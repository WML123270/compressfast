// 海外站 Pro 转化 E2E（Creem 流程）
// 运行：BASE_URL=https://compressfast.site node test-results/pro-conversion-os.e2e.mjs
// 只拦截支付/激活/埋点接口，不跳转真实 Creem、不写生产统计。
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'https://compressfast.site'

let passed = 0
let failed = 0
const ok = (name, detail) => { passed++; console.log(`PASS  ${name}  ${detail || ''}`) }
const bad = (name, detail) => { failed++; console.log(`FAIL  ${name}  ${detail || ''}`) }

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
  'base64',
)

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
})

try {
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const trackEvents = []
  const licenseBodies = []

  await page.route('**/api/admin/track', async (route) => {
    try { trackEvents.push(route.request().postDataJSON()) } catch {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })
  await page.route('**/api/create-license', async (route) => {
    try { licenseBodies.push(route.request().postDataJSON()) } catch {}
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, checkoutUrl: 'https://checkout.test/pay' }),
    })
  })
  await page.route('https://checkout.test/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Mock checkout</title>ok' })
  })
  await page.route('**/api/verify-license', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' })
  })

  await page.goto(`${BASE}/en/pro`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const body = await page.locator('body').innerText()
  if (body.includes('$24.99')) ok('海外价格 $24.99')
  else bad('海外价格 $24.99')
  if (body.includes('Only for your activation code')) ok('邮箱用途说明')
  else bad('邮箱用途说明')
  if (body.includes('Visa') && body.includes('Mastercard')) ok('卡组织徽标')
  else bad('卡组织徽标')
  if (!body.includes('WeChat Pay') && !body.includes('Alipay')) ok('海外不显示国内支付徽标')
  else bad('海外不显示国内支付徽标')

  // 空邮箱：本地校验，不请求 create-license
  await page.getByRole('button', { name: /Buy Now|Pay \$24\.99|Complete purchase/i }).first().click()
  await page.waitForTimeout(400)
  if ((await page.locator('body').innerText()).includes('Please enter a complete email')) ok('空邮箱本地校验')
  else bad('空邮箱本地校验')
  if (licenseBodies.length === 0) ok('空邮箱不创建支付链接')
  else bad('空邮箱不创建支付链接', JSON.stringify(licenseBodies))

  // 有效邮箱：创建 Creem 链接 → 跳转 → checkout/pay 埋点
  await page.locator('#buy-email').fill('buyer-os@example.com')
  await page.waitForTimeout(200)
  if ((await page.locator('body').innerText()).includes('Valid · code goes here')) ok('有效邮箱实时提示')
  else bad('有效邮箱实时提示')

  await Promise.all([
    page.waitForURL('https://checkout.test/**', { timeout: 15000 }),
    page.getByRole('button', { name: /Buy Now|Pay \$24\.99|Complete purchase/i }).first().click(),
  ])
  if (licenseBodies[0]?.email === 'buyer-os@example.com') ok('Creem 链接带购买邮箱', JSON.stringify(licenseBodies[0]))
  else bad('Creem 链接带购买邮箱', JSON.stringify(licenseBodies))
  const proEvents = trackEvents.filter((e) => e.event === 'pro')
  if (proEvents.some((e) => e.proStage === 'checkout' && e.source === 'creem')) ok('checkout 埋点')
  else bad('checkout 埋点', JSON.stringify(proEvents))
  if (proEvents.some((e) => e.proStage === 'pay' && e.source === 'creem')) ok('pay 埋点')
  else bad('pay 埋点', JSON.stringify(proEvents))

  if (errors.length === 0) ok('无页面错误')
  else bad('无页面错误', errors.join(' | '))
  await page.close()

  // 海外 AI 门控价格与权益
  {
    const ai = await ctx.browser().newContext({ viewport: { width: 1280, height: 900 } })
    const ap = await ai.newPage()
    await ap.route('**/api/admin/track', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    })
    await ap.goto(`${BASE}/en/tools/remove-bg`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await ap.locator('input[type=file]').first().waitFor({ state: 'attached', timeout: 30000 })
    await ap.locator('input[type=file]').first().setInputFiles({
      name: 'tiny.png', mimeType: 'image/png', buffer: PNG_1X1,
    })
    await ap.getByText('AI background removal is a Pro feature').waitFor({ state: 'visible', timeout: 15000 })
    const gateText = await ap.locator('body').innerText()
    if (gateText.includes('$24.99 lifetime unlocks on-device AI cutout')) ok('海外 AI 门控价格文案')
    else bad('海外 AI 门控价格文案')
    if (await ap.getByRole('link', { name: /Unlock Pro · \$24\.99/ }).first().isVisible()) ok('海外 AI 门控按钮带价格')
    else bad('海外 AI 门控按钮带价格')
    await ai.close()
  }
} catch (err) {
  failed++
  console.error('ERROR', err?.message || err)
} finally {
  await ctx.close().catch(() => {})
  await browser.close().catch(() => {})
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
