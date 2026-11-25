import { formatAiErrorDetail, type AiErrorCode } from './ai-error'
import { loadModelData, onModelProgress, type ModelLoadProgress } from './model-loader'

// 证件照人像分割 Worker —— 本地跑 u2netp（U-2-Net portable，约 4.4MB）
//
// 为什么不用抠图页的 isnet（42.5MB）：
//   证件照是免费流量工具，首次下载必须轻；u2netp 在近景人像上边缘干净，
//   对纯色换底足够用，也不会把 Pro 抠图（isnet）的下载成本摊给免费用户。
//
// 模型来源：https://github.com/danielgatis/rembg (MIT) 的 u2netp.onnx，
// 原始网络 U-2-Net 为 Apache-2.0。推理约定与 rembg 一致：
//   输入 320×320 RGB，x/255/max → (x-mean)/std（ImageNet 均值方差），CHW float32
//   取第一个输出，min-max 归一化得到前景概率，再缩回原尺寸。
//
// 约束与 remove-bg-worker 相同：numThreads=1、自托管 WASM、不依赖 COOP/COEP。

let ort: any = null
async function getOrt(): Promise<any> {
  if (!ort) {
    // @ts-ignore —— 运行时从自托管 URL 加载
    ort = await import(/* webpackIgnore: true */ '/ort/ort.min.mjs?v=1')
    ort.env.wasm.numThreads = 1
    ort.env.wasm.wasmPaths = '/ort/'
  }
  return ort
}

const MODEL_URL = '/models/u2netp.onnx'
// 仓库里模型的实际字节数（Vercel 走 chunked 没有 Content-Length，进度靠它）
const MODEL_BYTES = 4_574_861
const INPUT_SIZE = 320
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]

let session: any = null
let loading: Promise<any> | null = null

async function createSession(): Promise<any> {
  const o = await getOrt()
  const data = await loadModelData(MODEL_URL, MODEL_BYTES)
  return o.InferenceSession.create(data, { executionProviders: ['wasm'] })
}

async function getSession(onProgress?: (p: ModelLoadProgress) => void): Promise<any> {
  if (session) return session
  const off = onProgress ? onModelProgress(MODEL_URL, onProgress) : undefined
  try {
    if (!loading) {
      loading = (async () => {
        try {
          session = await createSession()
          return session
        } catch (err) {
          loading = null
          throw err
        }
      })()
    }
    return await loading
  } finally {
    off?.()
  }
}

interface IdPhotoMsg {
  id: string
  type?: 'warmup'
  imageBuffer?: ArrayBuffer
}

function post(id: string, msg: Record<string, unknown>) {
  ;(self as unknown as Worker).postMessage({ id, ...msg })
}

function postFailure(id: string, code: AiErrorCode, err: unknown) {
  post(id, { type: 'error', code, error: formatAiErrorDetail(err) })
}

// 预处理：把裁好的照片拉伸到 320×320，按 rembg 的方式归一化
function bitmapToTensor(ort: any, bitmap: ImageBitmap): any {
  const canvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, INPUT_SIZE, INPUT_SIZE)
  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE)

  // rembg 用全图最大通道值做缩放，而不是固定 255：偏暗的原图不会被压暗
  let max = 1e-6
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > max) max = data[i]
    if (data[i + 1] > max) max = data[i + 1]
    if (data[i + 2] > max) max = data[i + 2]
  }

  const n = INPUT_SIZE * INPUT_SIZE
  const f = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      f[c * n + i] = (data[i * 4 + c] / max - MEAN[c]) / STD[c]
    }
  }
  return new ort.Tensor('float32', f, [1, 3, INPUT_SIZE, INPUT_SIZE])
}

/** min-max 归一化后的前景 mask（0..1） */
function toAlphaMask(output: Float32Array): Float32Array {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < output.length; i++) {
    if (output[i] < min) min = output[i]
    if (output[i] > max) max = output[i]
  }
  const range = max - min || 1
  const alpha = new Float32Array(output.length)
  for (let i = 0; i < output.length; i++) {
    const v = (output[i] - min) / range
    alpha[i] = v < 0 ? 0 : v > 1 ? 1 : v
  }
  return alpha
}

/** 把 320 的 mask 缩放到输出尺寸，并作为裁切图的 alpha 通道，导出透明 PNG */
async function cutoutAt(bitmap: ImageBitmap, mask: Float32Array): Promise<Blob> {
  const w = bitmap.width
  const h = bitmap.height

  const maskCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE)
  const mctx = maskCanvas.getContext('2d')!
  const mimg = mctx.createImageData(INPUT_SIZE, INPUT_SIZE)
  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    const a = Math.round(mask[i] * 255)
    mimg.data[i * 4] = a
    mimg.data[i * 4 + 1] = a
    mimg.data[i * 4 + 2] = a
    mimg.data[i * 4 + 3] = 255
  }
  mctx.putImageData(mimg, 0, 0)

  const out = new OffscreenCanvas(w, h)
  const ctx = out.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h)

  const scaled = new OffscreenCanvas(w, h)
  const sctx = scaled.getContext('2d')!
  sctx.imageSmoothingEnabled = true
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(maskCanvas, 0, 0, w, h)
  const maskData = sctx.getImageData(0, 0, w, h)

  for (let i = 0; i < w * h; i++) {
    // 极低置信的雾状残影直接清掉，避免灰边
    const a = maskData.data[i * 4]
    img.data[i * 4 + 3] = a < 8 ? 0 : a
  }
  ctx.putImageData(img, 0, 0)
  return out.convertToBlob({ type: 'image/png' })
}

self.onmessage = async (e: MessageEvent<IdPhotoMsg>) => {
  const { id, imageBuffer, type } = e.data

  if (type === 'warmup') {
    try {
      await getSession()
    } catch {
      /* ignore */
    }
    return
  }

  if (!imageBuffer) {
    postFailure(id, 'internal', 'Missing image data')
    return
  }

  let phase: 'model' | 'run' = 'model'
  const heartbeat = setInterval(() => post(id, { type: 'phase', phase }), 3000)

  try {
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(new Blob([imageBuffer]))
    } catch (err) {
      postFailure(id, 'decode', err)
      return
    }

    let o: any
    try {
      o = await getOrt()
    } catch (err) {
      postFailure(id, 'model_load', err)
      return
    }

    post(id, { type: 'phase', phase: 'model' })
    let s: any
    try {
      s = await getSession((p) =>
        post(id, {
          type: 'progress',
          phase: 'model',
          done: p.loaded,
          total: p.total,
          cached: p.cached,
        }),
      )
    } catch (err) {
      postFailure(id, 'model_load', err)
      return
    }

    phase = 'run'
    post(id, { type: 'phase', phase })

    let blob: Blob
    try {
      const tensor = bitmapToTensor(o, bitmap)
      const feeds: Record<string, any> = {}
      feeds[s.inputNames[0]] = tensor
      const results = await s.run(feeds)
      const output = results[s.outputNames[0]]
      const mask = toAlphaMask(output.data as Float32Array)
      blob = await cutoutAt(bitmap, mask)
    } catch (err) {
      postFailure(id, 'run', err)
      return
    } finally {
      bitmap.close()
    }

    post(id, { type: 'done', resultBlob: blob })
  } finally {
    clearInterval(heartbeat)
  }
}
