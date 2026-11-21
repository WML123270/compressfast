// AI 抠图 —— 主线程封装
// 懒加载独立 Worker（不在压缩 Worker 里跑，避免拖累压缩性能）

import { AiWorkerRunner } from './worker-runner'

let runner: AiWorkerRunner | null = null

function getRunner(): AiWorkerRunner {
  if (!runner) {
    runner = new AiWorkerRunner(() => new Worker(new URL('./remove-bg-worker.ts', import.meta.url)))
  }
  return runner
}

export interface RemoveBgResult {
  blob: Blob
}

export interface RemoveBgProgress {
  phase: 'model' | 'run'
  /** 模型下载进度（phase=model 时有值） */
  done?: number
  total?: number
  /** 模型命中本地缓存，无需下载 */
  cached?: boolean
}

/** 只预加载模型（约 88MB）—— 目前不自动触发，供后续「提前下载」入口使用 */
export function preloadRemoveBgModel(): void {
  getRunner().warmup()
}

/**
 * 对图片做本地 AI 抠图（去背景），返回透明背景 PNG。
 * 全程在浏览器本地推理，图片不上传服务器。
 */
export function removeBackground(
  imageBuffer: ArrayBuffer,
  onProgress?: (p: RemoveBgProgress) => void,
): Promise<RemoveBgResult> {
  return getRunner()
    .run(
      { imageBuffer },
      {
        transfer: [imageBuffer],
        idleTimeoutMs: 180_000,
        onProgress: onProgress
          ? (p) => onProgress({ phase: p.phase, done: p.done, total: p.total, cached: p.cached })
          : undefined,
      },
    )
    .then((blob) => ({ blob }))
}
