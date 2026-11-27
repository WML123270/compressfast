/**
 * Pro 转化漏斗前端埋点（fire-and-forget）
 * stage:
 *   view     看到 Pro 页
 *   click    点击其他页面的升级入口（header / 额度条 / 功能锁等）
 *   intent   Pro 页内点击首屏/吸底「立即升级」（有购买意图，还没点支付）
 *   buy      Pro 页内点击支付按钮（邮箱校验前）
 *   checkout 支付订单创建成功
 *   pay      已展示支付方式（国内二维码 / 手机跳转 / Creem checkout）
 *   activated 激活码在本机激活成功
 *   fail     创建订单失败
 * source: 入口标识或支付渠道，服务端有白名单校验
 */

export type ProStage = 'view' | 'click' | 'intent' | 'buy' | 'checkout' | 'pay' | 'activated' | 'fail'

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
  | 'table_cta'
  | 'ai_gate'
  | 'pro_buy'
  | 'pro_cn_buy'
  | 'mobile_sticky'
  | 'dropzone'
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
