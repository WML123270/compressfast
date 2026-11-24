/**
 * 图片拼接工具埋点（fire-and-forget）
 * generate 每会话只记一次（首次成功生成），download / error 每次记录。
 */

export type StitchEvent = 'generate' | 'download' | 'error'

export const STITCH_TOOL = 'stitch-images'

export function trackStitchEvent(event: StitchEvent): void {
  if (typeof window === 'undefined') return
  let visitorId = ''
  try {
    visitorId = localStorage.getItem('cf_vid') || ''
  } catch {}
  try {
    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'tool',
        tool: STITCH_TOOL,
        toolEvent: event,
        visitorId,
        host: window.location.hostname,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
