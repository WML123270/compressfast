/**
 * 图片切割工具埋点（fire-and-forget）
 * generate 每会话只记一次（首次成功打包），download / error 每次记录。
 */

export type SplitEvent = 'generate' | 'download' | 'error'

export const SPLIT_TOOL = 'split-image'

export function trackSplitEvent(event: SplitEvent): void {
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
        tool: SPLIT_TOOL,
        toolEvent: event,
        visitorId,
        host: window.location.hostname,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
