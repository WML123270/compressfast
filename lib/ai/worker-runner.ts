// AI Worker 通用调用封装
// 解决旧实现的三类问题：
//   1. 没有任何超时 —— 模型下载失败 / Worker 卡死后 Promise 永远 pending，按钮一直转圈
//   2. 没有崩溃恢复 —— Worker OOM 退出后复用同一个死 Worker，后续全部失败
//   3. 错误信息不可分类 —— 只能把英文原始错误直接抛给用户

import { AiError, formatAiErrorDetail, normalizeAiErrorCode, type AiErrorCode } from './ai-error'

export interface AiWorkerProgress {
  /** model=下载/初始化模型，run=推理或后处理 */
  phase: 'model' | 'run'
  done?: number
  total?: number
  /** phase=model 时：true = 模型命中本地缓存，无需下载 */
  cached?: boolean
}

export interface AiWorkerRunOptions {
  transfer?: Transferable[]
  /** 多久收不到任何消息就判定卡死（Worker 每 3 秒发一次心跳） */
  idleTimeoutMs?: number
  onProgress?: (p: AiWorkerProgress) => void
}

const DEFAULT_IDLE_TIMEOUT_MS = 60_000

export class AiWorkerRunner {
  private worker: Worker | null = null
  private busy = false

  constructor(private readonly factory: () => Worker) {}

  /** 创建 Worker，并在它崩溃时丢弃实例（下次调用自动重建） */
  private ensureWorker(): Worker {
    if (this.worker) return this.worker
    const w = this.factory()
    const drop = () => {
      if (this.worker === w) {
        this.worker = null
        try {
          w.terminate()
        } catch {}
      }
    }
    w.addEventListener('error', drop)
    w.addEventListener('messageerror', drop)
    this.worker = w
    return w
  }

  private dropWorker(): void {
    const w = this.worker
    this.worker = null
    if (w) {
      try {
        w.terminate()
      } catch {}
    }
  }

  /**
   * 预热：只让 Worker 开始加载模型，不等待结果。
   * 用于「用户已经选好图、大概率会点运行」的场景，把模型下载提前。
   */
  warmup(): void {
    try {
      this.ensureWorker().postMessage({ id: 'warmup', type: 'warmup' })
    } catch {
      // 预热失败不影响正式任务，正式任务会重新初始化
    }
  }

  /** 把任务交给 Worker，返回结果 Blob */
  run(payload: Record<string, unknown>, opts: AiWorkerRunOptions = {}): Promise<Blob> {
    if (this.busy) {
      return Promise.reject(new AiError('busy', 'Another AI task is still running'))
    }

    let worker: Worker
    try {
      worker = this.ensureWorker()
    } catch (err) {
      return Promise.reject(new AiError('crash', formatAiErrorDetail(err)))
    }

    this.busy = true
    const idleTimeoutMs = opts.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS

    return new Promise<Blob>((resolve, reject) => {
      const id = `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null

      const emit = (p: AiWorkerProgress) => {
        try {
          opts.onProgress?.(p)
        } catch {
          // 进度回调出错不能影响任务
        }
      }

      const disarm = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      }

      const cleanup = () => {
        settled = true
        disarm()
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        worker.removeEventListener('messageerror', onMessageError)
        this.busy = false
      }

      const fail = (code: AiErrorCode, detail: string) => {
        if (settled) return
        cleanup()
        this.dropWorker()
        reject(new AiError(code, detail))
      }

      const succeed = (blob: Blob) => {
        if (settled) return
        cleanup()
        resolve(blob)
      }

      // 看门狗：每收到一条消息就重置。Worker 正常工作时至少每 3 秒有一次心跳。
      const arm = () => {
        disarm()
        timer = setTimeout(() => {
          fail('timeout', `No response from AI worker for ${Math.round(idleTimeoutMs / 1000)}s`)
        }, idleTimeoutMs)
      }

      const onMessage = (e: MessageEvent) => {
        const d = e.data
        if (!d || d.id !== id) return
        arm()

        if (d.type === 'progress') {
          emit({
            phase: d.phase === 'model' ? 'model' : 'run',
            done: d.done,
            total: d.total,
            cached: d.cached === true,
          })
          return
        }
        if (d.type === 'phase') {
          emit({ phase: d.phase === 'model' ? 'model' : 'run' })
          return
        }
        if (d.type === 'done') {
          if (d.resultBlob) succeed(d.resultBlob as Blob)
          else fail('internal', 'AI worker returned an empty result')
          return
        }
        if (d.type === 'error') {
          fail(normalizeAiErrorCode(d.code), String(d.error || 'AI worker error'))
        }
      }

      const onError = (e: ErrorEvent) => {
        fail('crash', e.message || 'AI worker crashed')
      }

      const onMessageError = () => {
        fail('crash', 'AI worker could not serialize a message')
      }

      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      worker.addEventListener('messageerror', onMessageError)
      arm()

      try {
        worker.postMessage({ id, ...payload }, opts.transfer ?? [])
      } catch (err) {
        fail('internal', formatAiErrorDetail(err))
      }
    })
  }
}
