// AI 工具（抠图 / 放大）统一错误类型与提示文案
// 注意：本文件同时被 Worker、客户端、服务端（埋点白名单）引用，不能依赖 window/document。

export const AI_ERROR_CODES = [
  'model_load', // 模型 / 运行时下载、初始化失败
  'decode', // 图片无法解码（格式不支持 / 文件损坏）
  'oom', // 内存不足（大图 / 低端设备）
  'timeout', // 长时间无响应（Worker 卡死）
  'crash', // Worker 异常退出
  'unsupported', // 浏览器能力不足
  'busy', // 上一张还在处理
  'run', // 推理 / 后处理失败
  'internal', // 其它未知错误
] as const

export type AiErrorCode = (typeof AI_ERROR_CODES)[number]

export class AiError extends Error {
  code: AiErrorCode

  constructor(code: AiErrorCode, message: string) {
    super(message)
    this.name = 'AiError'
    this.code = code
  }
}

export function normalizeAiErrorCode(value: unknown): AiErrorCode {
  return AI_ERROR_CODES.includes(value as AiErrorCode) ? (value as AiErrorCode) : 'internal'
}

const OOM_RE =
  /out of memory|allocation failed|failed to allocate|RangeError|Invalid array length|Invalid typed array length|backing store|exceeds the maximum|too large|OOM/i
const DECODE_RE =
  /could not be decoded|InvalidStateError|InvalidState|ImageBitmap|The source image|decode|unsupported image/i
const MODEL_RE =
  /Importing a module script failed|Failed to fetch|NetworkError|network error|Load failed|404|wasm|WebAssembly|Can't create a session|session creation|model/i

/** 根据异常信息猜测失败类别（Worker 内精确阶段会显式传 code，这里只兜底） */
export function classifyAiError(err: unknown): AiErrorCode {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  if (OOM_RE.test(msg)) return 'oom'
  if (DECODE_RE.test(msg)) return 'decode'
  if (MODEL_RE.test(msg)) return 'model_load'
  return 'internal'
}

/** 是否疑似内存不足（用于大图自动降级重试） */
export function isMemoryError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return OOM_RE.test(msg)
}

/** 截断错误详情，避免把超长堆栈/URL 渲染到界面上 */
export function formatAiErrorDetail(err: unknown, max = 300): string {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return msg.length > max ? msg.slice(0, max) + '…' : msg
}

export interface AiErrorCopy {
  title: string
  hint: string
}

export function aiErrorCopy(code: AiErrorCode, isZh: boolean): AiErrorCopy {
  switch (code) {
    case 'model_load':
      return isZh
        ? { title: 'AI 模型加载失败', hint: '首次使用需要下载 AI 模型，请检查网络后重试。' }
        : { title: 'Failed to load the AI model', hint: 'The model is downloaded on first use. Check your connection and retry.' }
    case 'decode':
      return isZh
        ? { title: '无法读取这张图片', hint: '请换一张 JPG / PNG / WebP 图片再试。' }
        : { title: 'Could not read this image', hint: 'Try a JPG, PNG, or WebP file instead.' }
    case 'oom':
      return isZh
        ? { title: '设备内存不足', hint: '请换一张更小的图片，或关闭其他标签页后重试。' }
        : { title: 'Not enough memory', hint: 'Try a smaller image, or close other tabs and retry.' }
    case 'timeout':
      return isZh
        ? { title: '处理超时', hint: '网络或设备较慢，已自动重置，请重试。' }
        : { title: 'Processing timed out', hint: 'The engine was reset automatically — please retry.' }
    case 'crash':
      return isZh
        ? { title: 'AI 引擎异常退出', hint: '已自动重置，点击重试即可。' }
        : { title: 'The AI engine stopped unexpectedly', hint: 'It has been reset — click retry.' }
    case 'unsupported':
      return isZh
        ? { title: '当前浏览器不支持本地 AI', hint: '请使用最新版 Chrome / Edge / Safari（iOS 16.4+）。' }
        : { title: 'Local AI is not supported in this browser', hint: 'Please use a recent Chrome / Edge / Safari (iOS 16.4+).' }
    case 'busy':
      return isZh
        ? { title: '正在处理另一张图片', hint: '请等待当前任务完成。' }
        : { title: 'Another image is still processing', hint: 'Please wait for it to finish.' }
    case 'run':
      return isZh
        ? { title: 'AI 处理失败', hint: '请重试；若反复失败，请换一张更小的图片。' }
        : { title: 'AI processing failed', hint: 'Retry, or try a smaller image if it keeps failing.' }
    default:
      return isZh
        ? { title: 'AI 处理失败', hint: '请重试。' }
        : { title: 'AI processing failed', hint: 'Please retry.' }
  }
}

/** 重试按钮是否有意义：格式错误重试也不会成功 */
export function isRetryableAiError(code: AiErrorCode): boolean {
  return code !== 'decode' && code !== 'unsupported'
}
