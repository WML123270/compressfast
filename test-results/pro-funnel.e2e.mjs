import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3100'
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

check('Pro 页标题', (await page.locator('h1').first().textContent())?.includes('升级专业版'))
check('新增价值副标题', (await page.locator('body').textContent())?.includes('AVIF 超小体积'))
check('信任点 chips', (await page.locator('body').textContent())?.includes('本地处理 · 不上传'))
check('FAQ 区块', (await page.locator('body').textContent())?.includes('购买前常见问题'))
check('FAQ 条目可展开', (await page.locator('details').count()) >= 6, `details=${await page.locator('details').count()}`)
check('移动端吸底 CTA 可见', await page.getByRole('button', { name: '立即升级', exact: true }).isVisible())
check('首屏 CTA 可见', await page.getByRole('button', { name: /立即升级 · ¥9.9/ }).isVisible())

// 点击吸底 CTA，应滚动到购买区
await page.getByRole('button', { name: '立即升级', exact: true }).click()
await page.waitForTimeout(900)
const afterY = await page.evaluate(() => window.scrollY)
check('吸底 CTA 滚动到购买区', afterY > 0, `scrollY 0 → ${afterY}`)

// 回到顶部，点首屏 CTA
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await page.getByRole('button', { name: /立即升级 · ¥9.9/ }).click()
await page.waitForTimeout(900)
const heroY = await page.evaluate(() => window.scrollY)
check('首屏 CTA 滚动到购买区', heroY > 0, `scrollY 0 → ${heroY}`)

// 点击购买按钮（不填邮箱），应记录购买点击（国内版=pro_cn_buy / 海外版=pro_buy）
await page.getByRole('button', { name: /去支付|立即购买/ }).click()
await page.waitForTimeout(600)

const proEvents = trackBodies.filter(b => b.event === 'pro')
check('view 埋点上报', proEvents.some(b => b.proStage === 'view'))
check('hero_cta 点击埋点', proEvents.some(b => b.proStage === 'click' && b.source === 'hero_cta'))
check('mobile_sticky 点击埋点', proEvents.some(b => b.proStage === 'click' && b.source === 'mobile_sticky'))
check('购买按钮点击埋点', proEvents.some(b => b.proStage === 'click' && (b.source === 'pro_buy' || b.source === 'pro_cn_buy')))

// 无横向溢出
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check('390px 无横向溢出', overflow <= 1, `overflow=${overflow}`)

// ---- Desktop ----
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
})
const dpage = await desktop.newPage()
await dpage.goto(`${BASE}/en/pro`, { waitUntil: 'networkidle' })
await dpage.waitForTimeout(600)
check('英文 FAQ 渲染', (await dpage.locator('body').textContent())?.includes('Before You Buy'))
check('桌面端无吸底 CTA', !(await dpage.getByRole('button', { name: 'Upgrade', exact: true }).isVisible().catch(() => false)))
const dOverflow = await dpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
check('1280px 无横向溢出', dOverflow <= 1, `overflow=${dOverflow}`)

// ---- 后台 API ----
const authRes = await desktop.request.post(`${BASE}/api/admin/auth`, {
  data: { key: 'compressfast2026' },
})
check('后台登录', authRes.ok())
const statsRes = await desktop.request.get(`${BASE}/api/admin/stats`)
const stats = await statsRes.json()
check('stats 返回 proFunnel', !!stats.proFunnel)
check('proFunnel.view > 0', (stats.proFunnel?.view || 0) > 0, `view=${stats.proFunnel?.view}`)
check('proFunnel 来源明细非空', (stats.proFunnel?.bySource || []).some(s => s.click > 0))

await browser.close()

const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.log('FAILED:', failed.map(f => f.name).join(' | '))
  process.exit(1)
}
