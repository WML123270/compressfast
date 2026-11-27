// Pro 转化优化 E2E
// 运行：node test-results/pro-conversion.e2e.mjs
// 只拦截支付/查码/激活接口，不创建真实订单、不写生产统计。
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3111'

let passed = 0
let failed = 0
const ok = (name, detail) => { passed++; console.log(`PASS  ${name}  ${detail || ''}`) }
const bad = (name, detail) => { failed++; console.log(`FAIL  ${name}  ${detail || ''}`) }

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
  'base64',
)
const QR_DATA_URI = 'data:image/png;base64,' + PNG_1X1.toString('base64')
const CODE = 'TEST-CODE-1234'

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
  const orderBodies = []
  const verifyBodies = []
  let statusCalls = 0

  await page.route('**/api/admin/track', async (route) => {
    try { trackEvents.push(route.request().postDataJSON()) } catch {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })
  await page.route('**/api/cn-create-order', async (route) => {
    try { orderBodies.push(route.request().postDataJSON()) } catch {}
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, tradeOrderId: 'test-order', qrcode: QR_DATA_URI }),
    })
  })
  await page.route('**/api/check-license-status', async (route) => {
    statusCalls += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: statusCalls >= 2
        ? JSON.stringify({ found: true, code: CODE })
        : JSON.stringify({ found: false, code: null }),
    })
  })
  await page.route('**/api/resend-license', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: CODE }) })
  })
  await page.route('**/api/verify-license', async (route) => {
    try { verifyBodies.push(route.request().postDataJSON()) } catch {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' })
  })

  await page.goto(`${BASE}/zh/pro`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // ── 1. 购买区信息与收款方式 ──
  const body = await page.locator('body').innerText()
  if (body.includes('仅用于接收激活码')) ok('邮箱用途说明')
  else bad('邮箱用途说明')
  if (body.includes('微信支付') && body.includes('支付宝')) ok('支付方式徽标')
  else bad('支付方式徽标')

  // ── 2. 空邮箱提交：本地拦截，不创建订单 ──
  await page.getByRole('button', { name: /去支付/ }).first().click()
  await page.waitForTimeout(400)
  const afterEmpty = await page.locator('body').innerText()
  if (afterEmpty.includes('请输入完整邮箱')) ok('空邮箱本地校验')
  else bad('空邮箱本地校验')
  if (orderBodies.length === 0) ok('空邮箱不创建订单')
  else bad('空邮箱不创建订单', JSON.stringify(orderBodies))

  // ── 3. 有效邮箱：创建订单 → 展示二维码 → 上报 pay ──
  await page.locator('#buy-email').fill('buyer@example.com')
  await page.waitForTimeout(200)
  if ((await page.locator('body').innerText()).includes('格式正确')) ok('有效邮箱实时提示')
  else bad('有效邮箱实时提示')

  await page.getByRole('button', { name: /去支付/ }).first().click()
  await page.locator('img[alt="支付二维码"]').waitFor({ state: 'visible', timeout: 15000 })
  if (orderBodies[0]?.email === 'buyer@example.com') ok('订单邮箱正确', JSON.stringify(orderBodies[0]))
  else bad('订单邮箱正确', JSON.stringify(orderBodies))
  const proEvents = trackEvents.filter((e) => e.event === 'pro')
  if (proEvents.some((e) => e.proStage === 'buy' && e.source === 'pro_cn_buy')) ok('buy 埋点')
  else bad('buy 埋点', JSON.stringify(proEvents))
  if (proEvents.some((e) => e.proStage === 'checkout' && e.source === 'hupijiao')) ok('checkout 埋点')
  else bad('checkout 埋点', JSON.stringify(proEvents))
  if (proEvents.some((e) => e.proStage === 'pay' && e.source === 'hupijiao')) ok('pay 埋点')
  else bad('pay 埋点', JSON.stringify(proEvents))

  // ── 4. 二维码展示后自动轮询，查到激活码并置顶显示 ──
  await page.getByText('已找到你的激活码').waitFor({ state: 'visible', timeout: 20000 })
  if ((await page.locator('body').innerText()).includes(CODE)) ok('自动轮询显示激活码', `statusCalls=${statusCalls}`)
  else bad('自动轮询显示激活码', `statusCalls=${statusCalls}`)

  // ── 5. 一键激活 → activated 埋点 ──
  await page.getByRole('button', { name: '一键激活' }).first().click()
  await page.waitForTimeout(1500)
  if (verifyBodies.some((b) => b.code === CODE)) ok('激活接口收到激活码')
  else bad('激活接口收到激活码', JSON.stringify(verifyBodies))
  if ((await page.locator('body').innerText()).includes('已激活 Pro')) ok('激活成功提示')
  else bad('激活成功提示')
  const activated = trackEvents.filter((e) => e.event === 'pro' && e.proStage === 'activated')
  if (activated.length >= 1) ok('activated 埋点')
  else bad('activated 埋点', JSON.stringify(trackEvents.filter((e) => e.event === 'pro')))

  if (errors.length === 0) ok('桌面无页面错误')
  else bad('桌面无页面错误', errors.join(' | '))
  await page.close()

  // ── 6. 移动端 Pro 页无横向溢出 ──
  {
    const mobile = await ctx.browser().newContext({ viewport: { width: 390, height: 844 } })
    const mp = await mobile.newPage()
    await mp.goto(`${BASE}/zh/pro`, { waitUntil: 'networkidle' })
    const overflow = await mp.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    if (overflow.scrollWidth <= overflow.innerWidth + 1) ok('移动端无横向溢出', JSON.stringify(overflow))
    else bad('移动端无横向溢出', JSON.stringify(overflow))
    await mobile.close()
  }

  // ── 7. AI 门控 CTA 带价格与完整价值 ──
  {
    const ai = await ctx.browser().newContext({ viewport: { width: 1280, height: 900 } })
    const ap = await ai.newPage()
    const aiTrack = []
    await ap.route('**/api/admin/track', async (route) => {
      try { aiTrack.push(route.request().postDataJSON()) } catch {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    })
    await ap.goto(`${BASE}/zh/tools/remove-bg`, { waitUntil: 'networkidle' })
    await ap.locator('input[type=file]').first().setInputFiles({
      name: 'tiny.png', mimeType: 'image/png', buffer: PNG_1X1,
    })
    await ap.getByText('AI 抠图是 Pro 专属功能').waitFor({ state: 'visible', timeout: 15000 })
    const gateText = await ap.locator('body').innerText()
    if (gateText.includes('¥9.9 永久解锁本地 AI 抠图')) ok('AI 门控价格文案')
    else bad('AI 门控价格文案')
    const gateBtn = ap.getByRole('link', { name: /¥9.9 解锁 Pro/ }).first()
    if (await gateBtn.isVisible()) ok('AI 门控按钮带价格')
    else bad('AI 门控按钮带价格')
    await gateBtn.click()
    await ap.waitForTimeout(1000)
    if (aiTrack.some((e) => e.event === 'pro' && e.proStage === 'click' && e.source === 'ai_gate')) ok('AI 门控点击埋点')
    else bad('AI 门控点击埋点', JSON.stringify(aiTrack.filter((e) => e.event === 'pro')))
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
