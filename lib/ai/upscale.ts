// AI 图片放大 —— 主线程封装
// 懒加载独立 Worker（不污染压缩/抠图 Worker，只在点「放大」时加载）

import { AiWorkerRunner } from './worker-runner'

let runner: AiWorkerRunner | null = null

function getRunner(): AiWorkerRunner {
  if (!runner) {
    runner = new AiWorkerRunner(() => new Worker(new URL('./upscale-worker.ts', import.meta.url)))
  }
  return runner
}

export interface UpscaleResult {
  blob: Blob
}

export interface UpscaleProgress {
  phase: 'model' | 'run'
  done: number
  total: number
}

/** 只预加载模型（下载约 5MB），用于用户已选图、即将点放大的场景 */
export function preloadUpscaleModel(): void {
  getRunner().warmup()
}

/**
 * 对图片做本地 AI 放大（2x / 4x 超分辨率），返回放大后的 PNG。
 * 2x 复用 4x 模型输出后做高质量降采样，不额外加载模型。
 * 全程在浏览器本地推理，图片不上传服务器。
 */
export function upscaleImage(
  imageBuffer: ArrayBuffer,
  scale: 2 | 4 = 4,
  onProgress?: (p: UpscaleProgress) => void,
): Promise<UpscaleResult> {
  return getRunner()
    .run(
      { imageBuffer, scale },
      {
        transfer: [imageBuffer],
        idleTimeoutMs: 120_000,
        onProgress: onProgress
          ? (p) => onProgress({ phase: p.phase, done: p.done ?? 0, total: p.total ?? 0 })
          : undefined,
      },
    )
    .then((blob) => ({ blob }))
}
