import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3100'
// 本地 .env.local 默认是国内构建；跑海外口径时用 EXPECT_OVERSEAS=1 + 海外构建
const EXPECT_OVERSEAS = process.env.EXPECT_OVERSEAS === '1'
const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok, extra })
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`)
}

const browser = await chromium.launch()

// ---- Mobile ----
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
const page = await mobile.newPage()
const trackBodies = []
page.on('request', (req) => {
  if (req.url().includes('/api/admin/track')) {
    try { trackBodies.push(JSON.parse(req.postData() || '{}')) } catch {}
  }
})

await page.goto(`${BASE}/zh/pro`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const bodyText = await page.locator('body').textContent()
check('Pro 页标题', (await page.locator('h1').first().textContent())?.includes('升级专业版'))
check('新增价值副标题', bodyText?.includes('AVIF 超小体积'))
check('信任点 chips', bodyText?.includes('本地处理 · 不上传'))
check('退款保障文案', bodyText?.includes('7 天未激活可申请全额退款'))
check('客服入口文案', bodyText?.includes('支付遇到问题？联系客服'))
check('FAQ 区块', bodyText?.includes('购买前常见问题'))
check('FAQ 条目可展开', (await page.locator('details').count()) >= 8, `details=${await page.locator('details').count()}`)
check('移动端吸底 CTA 可见', await page.getByRole('button', { name: /立即升级|Upgrade/ }).last().isVisible())
check('首屏 CTA 可见', await page.getByRole('button', { name: /立即升级/ }).first().isVisible())

// 购买区必须在功能对比表之前（首屏 CTA 一步到购买）
const buyFirst = await page.evaluate(() => {
  const buy = document.getElementById('buy')
  const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent?.includes('功能对比'))
  if (!buy || !heading) return false
  return buy.getBoundingClientRect().top + window.scrollY < heading.getBoundingClientRect().top + window.scrollY
})
check('购买区在功能对比表之前', buyFirst)

// 点击吸底 CTA，购买区应进入视口
await page.getByRole('button', { name: /立即升级|Upgrade/ }).last().click()
await page.waitForTimeout(900)
const buyVisible = await page.evaluate(() => {
  const el = document.getElementById('buy')
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.top < window.innerHeight && r.bottom > 0
})
check('吸底 CTA 滚动到购买区', buyVisible)

// 回到顶部，点首屏 CTA
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.getByRole('button', { name: /立即升级/ }).first().click()
await page.waitForTimeout(900)
check('首屏 CTA 滚动到购买区', await page.evaluate(() => {
  const el = document.getElementById('buy')
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.top < window.innerHeight && r.bottom > 0
}))

// 点击购买按钮（不填邮箱），应记录 buy 阶段（国内版=pro_cn_buy / 海外版=pro_buy）
await page.getByRole('button', { name: /去支付|立即购买|Buy Now/ }).first().click()
await page.waitForTimeout(600)

const proEvents = trackBodies.filter(b => b.event === 'pro')
check('view 埋点上报', proEvents.some(b => b.proStage === 'view'))
check('hero_cta 意图埋点', proEvents.some(b => b.proStage === 'intent' && b.source === 'hero_cta'))
check('mobile_sticky 意图埋点', proEvents.some(b => b.proStage === 'intent' && b.source === 'mobile_sticky'))
check('购买按钮 buy 埋点', proEvents.some(b => b.proStage === 'buy' && (b.source === 'pro_buy' || b.source === 'pro_cn_buy')))

// 无横向溢出
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check('390px 无横向溢出', overflow <= 1, `overflow=${overflow}`)

// ---- 支付返回后找回激活码 ----
const paidCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
await paidCtx.addInitScript(() => {
  localStorage.setItem('pro_pending_email', 'buyer-e2e@example.com')
  localStorage.setItem('pro_pending_at', String(Date.now()))
  localStorage.removeItem('pro_license')
})
const paidPage = await paidCtx.newPage()
await paidPage.route('**/api/resend-license', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, code: 'E2ETEST-CODE-1234', message: 'Activation code found.' }),
  })
})
await paidPage.goto(`${BASE}/zh/pro`, { waitUntil: 'networkidle' })
await paidPage.waitForTimeout(700)
const paidText = await paidPage.locator('body').textContent()
check('支付返回提示可见', paidText?.includes('已经完成支付？'))
check('提示里展示脱敏邮箱', paidText?.includes('bu***@example.com'))

await paidPage.getByRole('button', { name: '查询并激活' }).click()
await paidPage.waitForTimeout(900)
const lookupText = await paidPage.locator('body').textContent()
check('查询后展示激活码', lookupText?.includes('E2ETEST-CODE-1234'))
check('查询后有一键激活', await paidPage.getByRole('button', { name: '一键激活' }).isVisible())
await paidCtx.close()

// 国内支付返回 /pro?paid=1 时自动查码
const autoCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
await autoCtx.addInitScript(() => {
  localStorage.setItem('pro_pending_email', 'buyer-e2e@example.com')
  localStorage.setItem('pro_pending_at', String(Date.now()))
  localStorage.removeItem('pro_license')
})
const autoPage = await autoCtx.newPage()
await autoPage.route('**/api/resend-license', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, code: 'E2EAUTO-CODE-5678', message: 'Activation code found.' }),
  })
})
await autoPage.goto(`${BASE}/zh/pro?paid=1`, { waitUntil: 'networkidle' })
await autoPage.waitForTimeout(2200)
check('paid=1 自动查码展示激活码', (await autoPage.locator('body').textContent())?.includes('E2EAUTO-CODE-5678'))
await autoCtx.close()

// ---- Desktop ----
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
})
const dpage = await desktop.newPage()
await dpage.goto(`${BASE}/en/pro`, { waitUntil: 'networkidle' })
await dpage.waitForTimeout(600)
const enText = await dpage.locator('body').textContent()
check('英文 FAQ 渲染', enText?.includes('Before You Buy'))
check('桌面端无吸底 CTA', !(await dpage.getByRole('button', { name: 'Upgrade', exact: true }).isVisible().catch(() => false)))
check(EXPECT_OVERSEAS ? '海外价格 $24.99' : '国内构建价格 ¥9.9', enText?.includes(EXPECT_OVERSEAS ? '$24.99' : '¥9.9'))
const dOverflow = await dpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check('1280px 无横向溢出', dOverflow <= 1, `overflow=${dOverflow}`)

// 中文页面文案不应随部署区域串语言；额度/价格按部署区域区分
await dpage.goto(`${BASE}/zh/pro`, { waitUntil: 'networkidle' })
await dpage.waitForTimeout(500)
const zhText = await dpage.locator('body').textContent()
check('中文页面显示中文 FAQ', zhText?.includes('购买前常见问题') && !zhText?.includes('Before You Buy'))
check(
  EXPECT_OVERSEAS ? '免费额度按海外口径 400 张' : '免费额度按国内口径 100 张',
  zhText?.includes(EXPECT_OVERSEAS ? '每月可压缩 400 张' : '每月可压缩 100 张')
)
check(EXPECT_OVERSEAS ? '中文页价格 $24.99' : '中文页价格 ¥9.9', zhText?.includes(EXPECT_OVERSEAS ? '$24.99' : '¥9.9'))

// ---- 后台 API ----
const authRes = await desktop.request.post(`${BASE}/api/admin/auth`, {
  data: { key: 'compressfast2026' },
})
check('后台登录', authRes.ok())
const statsRes = await desktop.request.get(`${BASE}/api/admin/stats`)
const stats = await statsRes.json()
check('stats 返回 proFunnel', !!stats.proFunnel)
check('proFunnel 含 intent/buy 字段', typeof stats.proFunnel?.intent === 'number' && typeof stats.proFunnel?.buy === 'number')
check('proFunnel 来源含 dropzone', (stats.proFunnel?.bySource || []).some(s => s.source === 'dropzone'))

await browser.close()

const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.log('FAILED:', failed.map(f => f.name).join(' | '))
  process.exit(1)
}
