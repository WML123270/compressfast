// PDF 工具统一错误类型与双语文案

export type PdfErrorCode =
  | 'engine'
  | 'password'
  | 'corrupt'
  | 'unsupported'
  | 'too-large'
  | 'too-many-pages'
  | 'render'
  | 'cancelled'
  | 'unknown'

export class PdfToolError extends Error {
  readonly code: PdfErrorCode

  constructor(code: PdfErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'PdfToolError'
    this.code = code
  }
}

/**
 * 把 pdf-lib / pdf.js / DOM 的异常归类成 PdfToolError。
 * 不依赖具体库的 instanceof —— 动态 import 后构造器可能来自不同 chunk。
 */
export function toPdfToolError(err: unknown, fallback: PdfErrorCode = 'unknown'): PdfToolError {
  if (err instanceof PdfToolError) return err

  const name = err instanceof Error ? err.name : ''
  const msg = err instanceof Error ? err.message : String(err ?? '')
  const haystack = `${name} ${msg}`

  if (/AbortError|RenderingCancelled|cancelled/i.test(haystack)) {
    return new PdfToolError('cancelled', msg)
  }
  if (/PasswordException|EncryptedPDFError|encrypt|password/i.test(haystack)) {
    return new PdfToolError('password', msg)
  }
  if (/InvalidPDFException|invalid pdf|not a pdf|no pdf header/i.test(haystack)) {
    return new PdfToolError('corrupt', msg)
  }
  if (/RangeError|allocation|out of memory|too large|canvas/i.test(haystack)) {
    return new PdfToolError('too-large', msg)
  }

  return new PdfToolError(fallback, msg)
}

export function pdfErrorMessage(err: unknown, isZh: boolean): string {
  const code = err instanceof PdfToolError ? err.code : toPdfToolError(err).code

  const zh: Record<PdfErrorCode, string> = {
    engine: 'PDF 处理引擎加载失败，请刷新页面，或使用最新版 Chrome / Edge / Safari。',
    password: '该 PDF 已加密，请先解除密码保护后再试。',
    corrupt: '无法读取该 PDF，文件可能已损坏或格式不受支持。',
    unsupported: '暂不支持该 PDF 格式。',
    'too-large': '文件或页面过大，浏览器内存不足。请降低压缩档位，或先拆分 PDF。',
    'too-many-pages': '页数超过本工具上限，请先拆分 PDF。',
    render: '页面渲染失败，请重试或换一个 PDF。',
    cancelled: '已取消处理。',
    unknown: '处理失败，请重试。',
  }
  const en: Record<PdfErrorCode, string> = {
    engine: 'The PDF engine failed to load. Refresh the page or use the latest Chrome, Edge, or Safari.',
    password: 'This PDF is password-protected. Remove the password and try again.',
    corrupt: 'Could not read this PDF — it may be damaged or unsupported.',
    unsupported: 'This PDF format is not supported.',
    'too-large': 'The file or page is too large for browser memory. Try a lower preset or split the PDF first.',
    'too-many-pages': 'The page count exceeds this tool’s limit. Split the PDF first.',
    render: 'Failed to render the page. Please retry or try another PDF.',
    cancelled: 'Processing cancelled.',
    unknown: 'Something went wrong. Please try again.',
  }

  return isZh ? zh[code] : en[code]
}
