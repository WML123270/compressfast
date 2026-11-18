/**
 * Pro 转化漏斗前端埋点（fire-and-forget）
 * stage: view（看到 Pro 页） / click（点击升级入口） / checkout（支付订单创建成功） / fail（创建失败）
 * source: 入口标识或支付渠道，服务端有白名单校验
 */

export type ProStage = 'view' | 'click' | 'checkout' | 'fail'

export type ProSource =
  | 'header'
  | 'quota_banner'
  | 'image_list'
  | 'format_selector'
  | 'preset_manager'
  | 'watermark'
  | 'scene_presets'
  | 'home_cta'
  | 'hero_cta'
  | 'ai_gate'
  | 'pro_buy'
  | 'pro_cn_buy'
  | 'mobile_sticky'
  | 'creem'
  | 'hupijiao'

export function trackPro(stage: ProStage, source?: ProSource): void {
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
        event: 'pro',
        proStage: stage,
        source,
        visitorId,
        host: window.location.hostname,
      }),
      // keepalive 保证点击链接跳转时请求仍能发出
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
