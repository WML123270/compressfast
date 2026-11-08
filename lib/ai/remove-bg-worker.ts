export {}

// AI 抠图 Worker —— 在浏览器本地跑 isnet-general-use 模型（onnxruntime-web）
//
// 关键约束（见 docs/ai-background-removal-plan.md 和 memory）：
//   1. numThreads = 1 —— 单线程 WASM，不依赖 SharedArrayBuffer，避免 COOP/COEP 头
//      （之前加 COOP/COEP 把 Vercel 生产 Worker 搞崩过，bug 教训 #4）
//   2. 模型 / WASM 运行时都自托管在 public/ 下（同源加载，无跨域问题）
//   3. onnxruntime-web 用「运行时 webpackIgnore 加载」绕过 webpack 打包 —— 它的 .mjs
//      里有 require polyfill，Next.js 的 esbuild 解析不了（否则构建报 Dynamic require）
//   4. 本 Worker 独立于压缩 Worker，只在用户点「抠图」时才懒加载

// 运行时从自托管 URL 加载 onnxruntime-web（不打包进 bundle）
let ort: any = null
async function getOrt(): Promise<any> {
  if (!ort) {
    // @ts-ignore —— 运行时从自托管 URL 加载，TS 无需解析该模块类型
    ort = await import(/* webpackIgnore: true */ '/ort/ort.min.mjs?v=1')
    ort.env.wasm.numThreads = 1 // 单线程，无 SharedArrayBuffer / COOP/COEP 依赖
    ort.env.wasm.wasmPaths = '/ort/'
  }
  return ort
}

const MODEL_URL = '/models/isnet-general-use-fp16.onnx'
const INPUT_SIZE = 1024

let session: any = null
let loading: Promise<any> | null = null

async function getSession(): Promise<any> {
  if (session) return session
  if (!loading) {
    loading = (async () => {
      const o = await getOrt()
      session = await o.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
      })
      return session
    })()
  }
  return loading
}

interface RemoveBgMsg {
  id: string
  imageBuffer: ArrayBuffer
}

// ─── 预处理：resize 到 1024 + (x/255 - 0.5) + CHW float32 ───
// 依据 preprocessor_config.json: image_mean 0.5 / image_std 1.0 / rescale 1/255
function bitmapToTensor(ort: any, bitmap: ImageBitmap, size = INPUT_SIZE): any {
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const n = size * size
  const floatData = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    floatData[i] = data[i * 4] / 255 - 0.5 // R
    floatData[n + i] = data[i * 4 + 1] / 255 - 0.5 // G
    floatData[2 * n + i] = data[i * 4 + 2] / 255 - 0.5 // B
  }
  return new ort.Tensor('float32', floatData, [1, 3, size, size])
}

// ─── 后处理：logits → [0,1] 前景概率 + 连通域保主体 + 羽化 ───
// 若模型已输出 [0,1] 概率则直接用；若输出是 logits 则套 sigmoid
function toAlphaMask(output: Float32Array): Float32Array {
  const n = output.length
  const W = INPUT_SIZE
  const H = INPUT_SIZE

  let min = Infinity
  let max = -Infinity
  const sample = Math.min(n, 200000)
  for (let i = 0; i < sample; i++) {
    if (output[i] < min) min = output[i]
    if (output[i] > max) max = output[i]
  }
  const needSigmoid = min < -1 || max > 1

  // 1. soft 概率（sigmoid 后 [0,1]）
  const soft = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let v = output[i]
    if (needSigmoid) v = 1 / (1 + Math.exp(-v))
    soft[i] = Math.max(0, Math.min(1, v))
  }

  // 2. 连通域保主体：从高置信种子洪泛，保留与之连通的低置信区域（手/发丝/细突起）
  //    孤立背景噪点（不与主体连通）会被剔除 —— 同时解决「手被扣没」和「背景残留」
  const SEED = 0.4 // 高置信主体种子
  const KEEP = 0.08 // 连通区域的最低置信
  const visited = new Uint8Array(n)
  const queue = new Int32Array(n)
  let qHead = 0
  let qTail = 0
  for (let i = 0; i < n; i++) {
    if (soft[i] > SEED) { visited[i] = 1; queue[qTail++] = i }
  }
  while (qHead < qTail) {
    const idx = queue[qHead++]
    const x = idx % W
    if (x > 0) { const j = idx - 1; if (!visited[j] && soft[j] > KEEP) { visited[j] = 1; queue[qTail++] = j } }
    if (x < W - 1) { const j = idx + 1; if (!visited[j] && soft[j] > KEEP) { visited[j] = 1; queue[qTail++] = j } }
    if (idx >= W) { const j = idx - W; if (!visited[j] && soft[j] > KEEP) { visited[j] = 1; queue[qTail++] = j } }
    if (idx < n - W) { const j = idx + W; if (!visited[j] && soft[j] > KEEP) { visited[j] = 1; queue[qTail++] = j } }
  }

  // 3. 二值化 + 羽化（box blur 让边缘平滑）
  const bin = new Float32Array(n)
  for (let i = 0; i < n; i++) bin[i] = visited[i] ? 1 : 0
  return boxBlur(bin, W, H, 2)
}

// 两遍 box blur（水平+垂直），半径 radius，用于羽化二值 mask 边缘
function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      let sum = 0
      let cnt = 0
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = x + dx
        if (xx >= 0 && xx < w) { sum += src[row + xx]; cnt++ }
      }
      tmp[row + x] = sum / cnt
    }
  }
  const out = new Float32Array(src.length)
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let sum = 0
      let cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy
        if (yy >= 0 && yy < h) { sum += tmp[yy * w + x]; cnt++ }
      }
      out[y * w + x] = sum / cnt
    }
  }
  return out
}

// ─── 合成：把 alpha 遮罩缩放回原图尺寸，作为原图的透明通道 ───
async function compositeWithAlpha(
  bitmap: ImageBitmap,
  mask: Float32Array,
): Promise<Blob> {
  const origW = bitmap.width
  const origH = bitmap.height

  // 1. mask → 1024x1024 灰度图
  const maskCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE)
  const maskCtx = maskCanvas.getContext('2d')!
  const maskImg = maskCtx.createImageData(INPUT_SIZE, INPUT_SIZE)
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    const a = Math.round(mask[i] * 255)
    maskImg.data[i * 4] = a
    maskImg.data[i * 4 + 1] = a
    maskImg.data[i * 4 + 2] = a
    maskImg.data[i * 4 + 3] = 255
  }
  maskCtx.putImageData(maskImg, 0, 0)

  // 2. 原图 → 原尺寸 canvas
  const outCanvas = new OffscreenCanvas(origW, origH)
  const outCtx = outCanvas.getContext('2d')!
  outCtx.drawImage(bitmap, 0, 0)
  const origImg = outCtx.getImageData(0, 0, origW, origH)

  // 3. mask 缩放回原尺寸
  const resizedMask = new OffscreenCanvas(origW, origH)
  const rCtx = resizedMask.getContext('2d')!
  rCtx.drawImage(maskCanvas, 0, 0, origW, origH)
  const maskData = rCtx.getImageData(0, 0, origW, origH)

  // 4. 用 mask 灰度作为原图的 alpha 通道
  for (let i = 0; i < origW * origH; i++) {
    origImg.data[i * 4 + 3] = maskData.data[i * 4]
  }
  outCtx.putImageData(origImg, 0, 0)

  // 5. 导出透明 PNG
  return outCanvas.convertToBlob({ type: 'image/png' })
}

self.onmessage = async (e: MessageEvent<RemoveBgMsg>) => {
  const { id, imageBuffer } = e.data
  try {
    const o = await getOrt()
    const bitmap = await createImageBitmap(new Blob([imageBuffer]))

    const s = await getSession()
    const tensor = bitmapToTensor(o, bitmap)

    // 动态取输入/输出名，避免写死
    const inputName = s.inputNames[0]
    const outputName = s.outputNames[0]
    const feeds: Record<string, any> = {}
    feeds[inputName] = tensor

    const results = await s.run(feeds)
    const output = results[outputName]
    const mask = toAlphaMask(output.data as Float32Array)

    const blob = await compositeWithAlpha(bitmap, mask)
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
