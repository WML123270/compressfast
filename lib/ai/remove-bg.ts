// AI 抠图 —— 主线程封装
// 懒加载独立 Worker（不在压缩 Worker 里跑，避免拖累压缩性能）

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./remove-bg-worker.ts', import.meta.url))
  }
  return worker
}

export interface RemoveBgResult {
  blob: Blob
}

/**
 * 对图片做本地 AI 抠图（去背景），返回透明背景 PNG。
 * 全程在浏览器本地推理，图片不上传服务器。
 */
export function removeBackground(imageBuffer: ArrayBuffer): Promise<RemoveBgResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker()
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)

    const onMessage = (e: MessageEvent) => {
      if (e.data?.id !== id) return
      w.removeEventListener('message', onMessage)
      if (e.data.type === 'done') {
        resolve({ blob: e.data.resultBlob as Blob })
      } else {
        reject(new Error(e.data?.error || '抠图失败'))
      }
    }

    w.addEventListener('message', onMessage)
    w.postMessage({ id, imageBuffer }, [imageBuffer])
  })
}
