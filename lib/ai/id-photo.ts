// 证件照人像分割 —— 主线程封装
// 懒加载独立 Worker（u2netp 约 4.4MB，与 Pro 抠图的 isnet 互不影响）

import { AiWorkerRunner } from './worker-runner'

let runner: AiWorkerRunner | null = null

function getRunner(): AiWorkerRunner {
  if (!runner) {
    runner = new AiWorkerRunner(() => new Worker(new URL('./id-photo-worker.ts', import.meta.url)))
  }
  return runner
}

export interface IdPhotoProgress {
  phase: 'model' | 'run'
  done?: number
  total?: number
  cached?: boolean
}

/** 只预加载模型（用户已选好照片时提前下载） */
export function preloadIdPhotoModel(): void {
  getRunner().warmup()
}

export interface DetectedFace {
  x: number
  y: number
  w: number
  h: number
  score: number
}

export interface FaceDetectionResult {
  /** 原图像素坐标，按面积从大到小 */
  faces: DetectedFace[]
  imgW: number
  imgH: number
}

/**
 * 本地人脸检测（UltraFace RFB-320，约 1.27MB），用于自动构图。
 * 传入原图 ArrayBuffer；检测失败不抛给页面（调用方自行降级为手动取景）。
 */
export function detectFace(
  imageBuffer: ArrayBuffer,
  onProgress?: (p: IdPhotoProgress) => void,
): Promise<FaceDetectionResult> {
  return getRunner().run<FaceDetectionResult>(
    { imageBuffer, type: 'face' },
    {
      transfer: [imageBuffer],
      idleTimeoutMs: 60_000,
      onProgress: onProgress
        ? (p) => onProgress({ phase: p.phase, done: p.done, total: p.total, cached: p.cached })
        : undefined,
    },
  )
}

/**
 * 对已经裁好的证件照做本地人像分割，返回透明背景 PNG。
 * imageBuffer 应已是目标输出尺寸（主线程按像素预设裁切好再传来）。
 */
export function cutoutPortrait(
  imageBuffer: ArrayBuffer,
  onProgress?: (p: IdPhotoProgress) => void,
): Promise<Blob> {
  return getRunner().run(
    { imageBuffer },
    {
      transfer: [imageBuffer],
      idleTimeoutMs: 120_000,
      onProgress: onProgress
        ? (p) => onProgress({ phase: p.phase, done: p.done, total: p.total, cached: p.cached })
        : undefined,
    },
  )
}
