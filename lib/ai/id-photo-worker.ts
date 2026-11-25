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

// ─── 人脸检测（UltraFace RFB-320，1.27MB，MIT）───
// 只用来给证件照做自动构图；检测失败不影响手动取景。
const FACE_MODEL_URL = '/models/ultraface-rfb-320.onnx'
const FACE_MODEL_BYTES = 1_270_727
const FACE_W = 320
const FACE_H = 240
const FACE_CONF = 0.65
const FACE_NMS = 0.3
const FACE_STRIDES = [8, 16, 32, 64]
const FACE_MIN_BOXES = [
  [10, 16, 24],
  [32, 48],
  [64, 96],
  [128, 192, 256],
]

let session: any = null
let loading: Promise<any> | null = null

let faceSession: any = null
let faceLoading: Promise<any> | null = null

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

// ─── 人脸检测实现 ───

async function createFaceSession(): Promise<any> {
  const o = await getOrt()
  const data = await loadModelData(FACE_MODEL_URL, FACE_MODEL_BYTES)
  return o.InferenceSession.create(data, { executionProviders: ['wasm'] })
}

async function getFaceSession(onProgress?: (p: ModelLoadProgress) => void): Promise<any> {
  if (faceSession) return faceSession
  const off = onProgress ? onModelProgress(FACE_MODEL_URL, onProgress) : undefined
  try {
    if (!faceLoading) {
      faceLoading = (async () => {
        try {
          faceSession = await createFaceSession()
          return faceSession
        } catch (err) {
          faceLoading = null
          throw err
        }
      })()
    }
    return await faceLoading
  } finally {
    off?.()
  }
}

// 4400+ 先验框只算一次（中心点/宽高均为归一化坐标）
let facePriors: Float32Array | null = null
function getFacePriors(): Float32Array {
  if (facePriors) return facePriors
  const out: number[] = []
  for (let s = 0; s < FACE_STRIDES.length; s++) {
    const stride = FACE_STRIDES[s]
    const fw = Math.ceil(FACE_W / stride)
    const fh = Math.ceil(FACE_H / stride)
    for (let i = 0; i < fh; i++) {
      for (let j = 0; j < fw; j++) {
        for (const mb of FACE_MIN_BOXES[s]) {
          out.push(((j + 0.5) * stride) / FACE_W, ((i + 0.5) * stride) / FACE_H, mb / FACE_W, mb / FACE_H)
        }
      }
    }
  }
  facePriors = new Float32Array(out)
  return facePriors
}

interface FaceBox {
  x: number
  y: number
  w: number
  h: number
  score: number
}

function nmsBoxes(boxes: FaceBox[], iouThreshold: number): FaceBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score)
  const keep: FaceBox[] = []
  while (sorted.length) {
    const a = sorted.shift()!
    keep.push(a)
    for (let k = sorted.length - 1; k >= 0; k--) {
      const b = sorted[k]
      const x1 = Math.max(a.x, b.x)
      const y1 = Math.max(a.y, b.y)
      const x2 = Math.min(a.x + a.w, b.x + b.w)
      const y2 = Math.min(a.y + a.h, b.y + b.h)
      const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
      const iou = inter / (a.w * a.h + b.w * b.h - inter || 1)
      if (iou > iouThreshold) sorted.splice(k, 1)
    }
  }
  return keep
}

/** 原图 → 320×240 检测，返回原图像素坐标的人脸框（按面积从大到小） */
async function detectFaces(s: any, bitmap: ImageBitmap): Promise<FaceBox[]> {
  const canvas = new OffscreenCanvas(FACE_W, FACE_H)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, FACE_W, FACE_H)
  const { data } = ctx.getImageData(0, 0, FACE_W, FACE_H)

  const n = FACE_W * FACE_H
  const f = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    f[i] = (data[i * 4] - 127) / 128
    f[n + i] = (data[i * 4 + 1] - 127) / 128
    f[2 * n + i] = (data[i * 4 + 2] - 127) / 128
  }
  const tensor = new (await getOrt()).Tensor('float32', f, [1, 3, FACE_H, FACE_W])
  const feeds: Record<string, any> = {}
  feeds[s.inputNames[0]] = tensor
  const results = await s.run(feeds)

  // 不写死输出顺序：按最后一维识别 scores(2) / boxes(4)
  let scores: any = null
  let boxes: any = null
  for (const name of s.outputNames) {
    const t = results[name]
    const dims = t.dims as number[]
    if (dims[dims.length - 1] === 2) scores = t
    if (dims[dims.length - 1] === 4) boxes = t
  }
  if (!scores || !boxes) throw new Error('Face model outputs not recognized')

  const priors = getFacePriors()
  const sc = scores.data as Float32Array
  const bx = boxes.data as Float32Array
  const count = Math.min(scores.dims[1], priors.length / 4)
  const dets: FaceBox[] = []

  for (let i = 0; i < count; i++) {
    // softmax[1] = sigmoid(fg - bg)
    const p = 1 / (1 + Math.exp(sc[i * 2] - sc[i * 2 + 1]))
    if (p < FACE_CONF) continue
    const p4 = i * 4
    const cx0 = priors[p4]
    const cy0 = priors[p4 + 1]
    const w0 = priors[p4 + 2]
    const h0 = priors[p4 + 3]
    const cx = cx0 + bx[p4] * 0.1 * w0
    const cy = cy0 + bx[p4 + 1] * 0.1 * h0
    const w = w0 * Math.exp(bx[p4 + 2] * 0.2)
    const h = h0 * Math.exp(bx[p4 + 3] * 0.2)
    const x = (cx - w / 2) * FACE_W
    const y = (cy - h / 2) * FACE_H
    const bw = w * FACE_W
    const bh = h * FACE_H
    if (bw < 14 || bh < 14) continue
    dets.push({ x, y, w: bw, h: bh, score: p })
  }

  const kept = nmsBoxes(dets, FACE_NMS)
  const sx = bitmap.width / FACE_W
  const sy = bitmap.height / FACE_H
  return kept
    .map((d) => ({ x: d.x * sx, y: d.y * sy, w: d.w * sx, h: d.h * sy, score: d.score }))
    .sort((a, b) => b.w * b.h - a.w * a.h)
}

interface IdPhotoMsg {
  id: string
  type?: 'warmup' | 'face'
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

  // 人脸检测：只返回框，不做抠图
  if (type === 'face') {
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
      try {
        try {
          await getOrt()
        } catch (err) {
          postFailure(id, 'model_load', err)
          return
        }
        post(id, { type: 'phase', phase: 'model' })
        let s: any
        try {
          s = await getFaceSession((p) =>
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
        try {
          const faces = await detectFaces(s, bitmap)
          post(id, { type: 'done', result: { faces, imgW: bitmap.width, imgH: bitmap.height } })
        } catch (err) {
          postFailure(id, 'run', err)
        }
      } finally {
        bitmap.close()
      }
    } finally {
      clearInterval(heartbeat)
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
