// 图片转 PDF 埋点（客户端）
// 只上报行为计数、页数与 PDF 体积，不上传图片、文件名或内容。
// 任何异常都静默吞掉 —— 埋点不能影响工具本身。

export type PdfEventName = 'generate' | 'error' | 'download'

interface PdfEventPayload {
  pages?: number
  bytes?: number
}

export function trackPdfEvent(event: PdfEventName, payload: PdfEventPayload = {}): void {
  if (typeof window === 'undefined') return
  try {
    const visitorId = localStorage.getItem('cf_vid') || ''
    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event: 'pdf',
        pdfEvent: event,
        pages: payload.pages,
        bytes: payload.bytes,
        visitorId,
        host: window.location.hostname,
      }),
    }).catch(() => {})
  } catch {
    // ignore
  }
}
