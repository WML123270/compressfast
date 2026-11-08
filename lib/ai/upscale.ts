// AI 图片放大 —— 主线程封装
// 懒加载独立 Worker（不污染压缩/抠图 Worker，只在点「放大」时加载）

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./upscale-worker.ts', import.meta.url))
  }
  return worker
}

export interface UpscaleResult {
  blob: Blob
}

/**
 * 对图片做本地 AI 放大（4x 超分辨率），返回放大后的 PNG。
 * 全程在浏览器本地推理，图片不上传服务器。
 */
export function upscaleImage(imageBuffer: ArrayBuffer): Promise<UpscaleResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker()
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)

    const onMessage = (e: MessageEvent) => {
      if (e.data?.id !== id) return
      w.removeEventListener('message', onMessage)
      if (e.data.type === 'done') {
        resolve({ blob: e.data.resultBlob as Blob })
      } else {
        reject(new Error(e.data?.error || '放大失败'))
      }
    }

    w.addEventListener('message', onMessage)
    w.postMessage({ id, imageBuffer }, [imageBuffer])
  })
}
