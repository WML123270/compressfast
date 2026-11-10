// AI 功能埋点（客户端）
// 只上报行为计数与耗时，不上传图片、文件名或错误堆栈。
// 任何异常都静默吞掉 —— 埋点不能影响工具本身。

export type AiTool = 'upscale' | 'remove-bg'
export type AiEventName = 'view' | 'gate' | 'start' | 'success' | 'error' | 'download'

interface AiEventPayload {
  scale?: 2 | 4
  durationMs?: number
}

export function trackAiEvent(event: AiEventName, tool: AiTool, payload: AiEventPayload = {}): void {
  if (typeof window === 'undefined') return
  try {
    const visitorId = localStorage.getItem('cf_vid') || ''
    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event: 'ai',
        aiEvent: event,
        tool,
        scale: payload.scale,
        durationMs: payload.durationMs,
        visitorId,
        host: window.location.hostname,
      }),
    }).catch(() => {})
  } catch {
    // ignore
  }
}
