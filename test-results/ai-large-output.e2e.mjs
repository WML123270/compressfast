// 抠图大图输出上限 E2E：5000×4000 输入 → 输出最长边 4096，且界面提前告知
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas } from '@napi-rs/canvas'

const BASE = 'http://localhost:3100'
const OUT = path.join(process.cwd(), 'test-results', 'ai-stability-e2e')
fs.mkdirSync(OUT, { recursive: true })

const W = 5000
const H = 4000
const imgPath = path.join(OUT, `large-${W}x${H}.jpg`)
{
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#e8eef7'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#c2410c'
  ctx.beginPath()
  ctx.arc(W / 2, H / 2, Math.min(W, H) / 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.font = '360px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('AI', W / 2, H / 2)
  fs.writeFileSync(imgPath, c.toBuffer('image/jpeg', 90))
}

const report = { ok: false, steps: [], aiEvents: [] }
function assert(name, pass, extra) {
  report.steps.push({ name, pass: !!pass, ...(extra ? { extra } : {}) })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? `  ${JSON.stringify(extra)}` : ''}`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  await ctx.addInitScript(() => localStorage.setItem('pro_license', 'E2E-AI-LARGE-0001'))
  const page = await ctx.newPage()
  await page.route('**/api/verify-license', (r) => r.abort())
  await page.route('**/api/admin/track', async (route) => {
    try {
      const b = route.request().postDataJSON()
      if (b?.event === 'ai') report.aiEvents.push(b)
    } catch {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })

  try {
    await page.goto(`${BASE}/zh/tools/remove-bg`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForSelector('input[type=file]', { state: 'attached', timeout: 30000 })
    await page.waitForTimeout(1200)
    await page.locator('input[type=file]').first().setInputFiles(imgPath)
    await page.waitForTimeout(1500)

    const advisory = await page.getByText(/超过本地处理上限/).count()
    assert('大图提示输出将缩到 4096px', advisory > 0)
    await page.screenshot({ path: path.join(OUT, '10-large-advisory.png'), fullPage: true })

    await page.getByRole('button', { name: /^AI 抠图$/ }).click()
    const done = await page
      .getByRole('button', { name: /下载透明 PNG/ })
      .waitFor({ timeout: 10 * 60 * 1000 })
      .then(() => true)
      .catch(() => false)
    assert('大图抠图成功', done)

    const dims = await page.locator('img[alt="result"]').evaluate((el) => ({
      w: el.naturalWidth,
      h: el.naturalHeight,
    }))
    assert('输出最长边被限制为 4096', Math.max(dims.w, dims.h) === 4096, dims)
    assert('输出保持原图宽高比（4:3.2）', Math.abs(dims.w / dims.h - W / H) < 0.01, dims)
    await page.screenshot({ path: path.join(OUT, '11-large-result.png'), fullPage: true })

    const success = report.aiEvents.find((e) => e.aiEvent === 'success' && e.tool === 'remove-bg')
    assert('成功事件已上报', !!success)
  } catch (err) {
    report.steps.push({ name: 'fatal', pass: false, extra: String(err?.stack || err) })
    console.error('FATAL', err)
  } finally {
    await browser.close()
  }

  report.ok = report.steps.every((s) => s.pass)
  fs.writeFileSync(path.join(OUT, 'large-report.json'), JSON.stringify(report, null, 2))
  console.log(`\n${report.ok ? 'ALL PASS' : 'FAILED'}  ${report.steps.filter((s) => s.pass).length}/${report.steps.length}`)
  process.exit(report.ok ? 0 : 1)
})()
