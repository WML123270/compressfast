export {}

// AI 图片放大 Worker —— 在浏览器本地跑 realesr-general-x4v3 模型（onnxruntime-web）
//
// 关键约束（见 docs/ai-image-upscale-plan.md）：
//   1. 预处理是 x/255（无 mean/std）—— 和抠图 isnet 的 (x/255)-0.5 不同，别照抄
//   2. numThreads = 1 单线程 WASM，不碰 COOP/COEP（bug 教训 #4）
//   3. 运行时复用 /ort/ 自托管（webpackIgnore 加载），模型自托管 /models/
//   4. 分块（tiling）+ 重叠加权缝合：内存随输入平方增长，必须切块
//   5. 本 Worker 独立于压缩/抠图 Worker，只在上点「放大」时懒加载

// 运行时从自托管 URL 加载 onnxruntime-web（不打包进 bundle）
let ort: any = null
async function getOrt(): Promise<any> {
  if (!ort) {
    // @ts-ignore —— 运行时从自托管 URL 加载，TS 无需解析该模块类型
    ort = await import(/* webpackIgnore: true */ '/ort/ort.min.mjs?v=1')
    ort.env.wasm.numThreads = 1
    ort.env.wasm.wasmPaths = '/ort/'
  }
  return ort
}

const MODEL_URL = '/models/realesr-general-x4v3.onnx'
const SCALE = 4
const TILE_SIZE = 256 // 输入 tile 尺寸
const TILE_PAD = 16 // 重叠 padding（输入像素），消除拼缝
const MAX_LONG_EDGE = 512 // 输入长边上限，4x 后输出 ≤2048px，防内存爆炸

let session: any = null
let loading: Promise<any> | null = null

async function getSession(): Promise<any> {
  if (session) return session
  if (!loading) {
    loading = (async () => {
      const o = await getOrt()
      session = await o.InferenceSession.create(MODEL_URL, {
        executionProviders: ['webgpu', 'wasm'],
      })
      return session
    })()
  }
  return loading
}

interface UpscaleMsg {
  id: string
  imageBuffer: ArrayBuffer
  scale: 2 | 4
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// ─── 提取一个 tile（含 clamp 边缘复制）→ CHW float32 [0,1] ───
function extractTile(
  src: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  x0: number,
  y0: number,
): Float32Array {
  const n = TILE_SIZE * TILE_SIZE
  const out = new Float32Array(3 * n)
  for (let y = 0; y < TILE_SIZE; y++) {
    const sy = clamp(y0 + y, 0, srcH - 1)
    const sRow = sy * srcW
    for (let x = 0; x < TILE_SIZE; x++) {
      const sx = clamp(x0 + x, 0, srcW - 1)
      const si = (sRow + sx) * 4
      const di = y * TILE_SIZE + x
      out[di] = src[si] / 255
      out[n + di] = src[si + 1] / 255
      out[2 * n + di] = src[si + 2] / 255
    }
  }
  return out
}

// ─── 单个 tile 的 1D 融合权重（沿某一维）───
// content 区域 [cl, cr] 权重=1；左/右各 64px 过渡区线性 0→1 / 1→0
function makeRamp(len: number, tileOutStart: number, outSize: number, cl: number, cr: number, hasLeft: boolean, hasRight: boolean): Float32Array {
  const ramp = new Float32Array(len)
  const PAD = TILE_PAD * SCALE // 64
  for (let i = 0; i < len; i++) {
    const p = tileOutStart + i
    if (p < 0 || p >= outSize) { ramp[i] = 0; continue }
    let w = 1
    if (hasLeft) w = Math.min(w, clamp((p - (cl - PAD)) / PAD, 0, 1))
    if (hasRight) w = Math.min(w, clamp(((cr + PAD) - p) / PAD, 0, 1))
    ramp[i] = w
  }
  return ramp
}

// ─── 主流程：分块推理 + 重叠加权缝合 ───
async function upscaleBitmap(bitmap: ImageBitmap, scale: 2 | 4 = 4): Promise<Blob> {
  const o = await getOrt()
  const s = await getSession()
  const inputName = s.inputNames[0]
  const outputName = s.outputNames[0]

  // 1. 长边缩到上限
  const scaleDown = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scaleDown))
  const h = Math.max(1, Math.round(bitmap.height * scaleDown))

  const inCanvas = new OffscreenCanvas(w, h)
  const inCtx = inCanvas.getContext('2d', { willReadFrequently: true })!
  inCtx.drawImage(bitmap, 0, 0, w, h)
  const src = inCtx.getImageData(0, 0, w, h).data

  // 2. 输出尺寸与累加缓冲
  const outW = w * SCALE
  const outH = h * SCALE
  const acc = new Float32Array(3 * outW * outH)
  const wsum = new Float32Array(outW * outH)

  const step = TILE_SIZE - 2 * TILE_PAD // 224 内容步长
  const nx = Math.ceil(w / step)
  const ny = Math.ceil(h / step)
  const tileOut = TILE_SIZE * SCALE // 1024

  // 3. 逐块推理 + 融合
  for (let ty = 0; ty < ny; ty++) {
    for (let tx = 0; tx < nx; tx++) {
      const cx = tx * step
      const cy = ty * step
      const ex = cx - TILE_PAD
      const ey = cy - TILE_PAD

      // 内容区（输出坐标），右/下边界裁剪
      const cl = cx * SCALE
      const cr = Math.min((cx + step) * SCALE, outW)
      const ct = cy * SCALE
      const cb = Math.min((cy + step) * SCALE, outH)

      // 提取 + 推理
      const tileData = extractTile(src, w, h, ex, ey)
      const tensor = new o.Tensor('float32', tileData, [1, 3, TILE_SIZE, TILE_SIZE])
      const results = await s.run({ [inputName]: tensor })
      const data = results[outputName].data as Float32Array // [1,3,1024,1024] CHW

      // 融合权重（可分离）
      const wx = makeRamp(tileOut, ex * SCALE, outW, cl, cr, cx > 0, cr < outW)
      const wy = makeRamp(tileOut, ey * SCALE, outH, ct, cb, cy > 0, cb < outH)

      const plane = tileOut * tileOut
      for (let j = 0; j < tileOut; j++) {
        const oy = ey * SCALE + j
        if (oy < 0 || oy >= outH) continue
        const wyj = wy[j]
        if (wyj <= 0) continue
        const outRow = oy * outW
        for (let i = 0; i < tileOut; i++) {
          const ox = ex * SCALE + i
          if (ox < 0 || ox >= outW) continue
          const wgt = wx[i] * wyj
          if (wgt <= 0) continue
          const outIdx = outRow + ox
          const ti = j * tileOut + i
          acc[outIdx] += data[ti] * wgt
          acc[outW * outH + outIdx] += data[plane + ti] * wgt
          acc[2 * outW * outH + outIdx] += data[2 * plane + ti] * wgt
          wsum[outIdx] += wgt
        }
      }
    }
  }

  // 4. 归一化 + 转 Uint8
  const outCanvas = new OffscreenCanvas(outW, outH)
  const outCtx = outCanvas.getContext('2d')!
  const img = outCtx.createImageData(outW, outH)
  const total = outW * outH
  for (let i = 0; i < total; i++) {
    const ws = wsum[i] || 1
    const o = i * 4
    img.data[o] = clamp(Math.round((acc[i] / ws) * 255), 0, 255)
    img.data[o + 1] = clamp(Math.round((acc[total + i] / ws) * 255), 0, 255)
    img.data[o + 2] = clamp(Math.round((acc[2 * total + i] / ws) * 255), 0, 255)
    img.data[o + 3] = 255
  }
  outCtx.putImageData(img, 0, 0)

  // 2x 模式：对 4x 结果做高质量 2:1 降采样（复用 4x 模型，无需第二个模型文件）
  if (scale === 2) {
    const w2 = Math.max(1, Math.round(outW / 2))
    const h2 = Math.max(1, Math.round(outH / 2))
    const half = new OffscreenCanvas(w2, h2)
    const hctx = half.getContext('2d')!
    hctx.imageSmoothingEnabled = true
    hctx.imageSmoothingQuality = 'high'
    hctx.drawImage(outCanvas, 0, 0, w2, h2)
    return half.convertToBlob({ type: 'image/png' })
  }
  return outCanvas.convertToBlob({ type: 'image/png' })
}

self.onmessage = async (e: MessageEvent<UpscaleMsg>) => {
  const { id, imageBuffer, scale } = e.data
  try {
    const bitmap = await createImageBitmap(new Blob([imageBuffer]))
    const blob = await upscaleBitmap(bitmap, scale ?? 4)
    bitmap.close()
    ;(self as unknown as Worker).postMessage({ id, type: 'done', resultBlob: blob })
  } catch (err: unknown) {
    ;(self as unknown as Worker).postMessage({
      id,
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
