// AI 稳定性 E2E
// 覆盖：
//  1. 模型下载失败 → 分类错误提示（不是原始英文报错）+ 失败原因埋点
//  2. 恢复网络后点「重试」→ Worker 重建并成功（验证不再永久失败）
//  3. 超过 30MB 的文件 → 友好提示
//  4. AI 抠图同样具备「失败 → 重试成功」
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3100'
const OUT = path.join(__dirname, 'ai-stability-e2e')
fs.mkdirSync(OUT, { recursive: true })

const report = { ok: false, steps: [], aiEvents: [], consoleErrors: [], pageErrors: [] }

function assert(name, pass, extra) {
  report.steps.push({ name, pass: !!pass, ...(extra ? { extra } : {}) })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? `  ${JSON.stringify(extra)}` : ''}`)
}

async function waitForText(page, re, timeoutMs) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const n = await page.getByText(re).count().catch(() => 0)
    if (n > 0) return true
    await page.waitForTimeout(300)
  }
  return false
}

async function newProPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  await ctx.addInitScript(() => {
    localStorage.setItem('pro_license', 'E2E-AI-STABILITY-0001')
  })
  const page = await ctx.newPage()
  await page.route('**/api/verify-license', (route) => route.abort())
  await page.route('**/api/admin/track', async (route) => {
    try {
      const body = route.request().postDataJSON()
      if (body?.event === 'ai') report.aiEvents.push(body)
    } catch {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  })
  page.on('console', (m) => {
    if (m.type() === 'error') report.consoleErrors.push(m.text().slice(0, 300))
  })
  page.on('pageerror', (e) => report.pageErrors.push(e.message))
  return { ctx, page }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  try {
    // ───────── 1. AI 放大：模型失败 → 重试成功 ─────────
    const { ctx, page } = await newProPage(browser)
    let blockModel = true
    let modelRequests = 0
    await page.route('**/models/realesr-general-x4v3.onnx', (route) => {
      modelRequests++
      return blockModel ? route.abort() : route.continue()
    })

    await page.goto(`${BASE}/zh/tools/upscale`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForSelector('input[type=file]', { state: 'attached', timeout: 30000 })
    await page.waitForTimeout(1500)

    // 30MB 上限：伪造一张 31MB 的图片
    const big = Buffer.alloc(31 * 1024 * 1024, 1)
    await page.locator('input[type=file]').setInputFiles({
      name: 'too-big.png',
      mimeType: 'image/png',
      buffer: big,
    })
    const bigWarn = await waitForText(page, /文件超过 30MB|larger than 30MB/, 5000)
    assert('31MB 文件被拦截并提示', bigWarn)
    await page.screenshot({ path: path.join(OUT, '01-file-too-big.png'), fullPage: true })

    // 正常图片
    await page.locator('input[type=file]').setInputFiles(path.join(process.cwd(), 'public/demo-photo.jpg'))
    await page.waitForTimeout(1200)

    const btn4 = page.getByRole('button', { name: /AI 放大 4x/ })
    await btn4.click()
    const failShown = await waitForText(page, /AI 模型加载失败/, 60000)
    assert('模型下载失败显示分类提示', failShown)
    const retryBtn = page.getByRole('button', { name: /^重试$/ })
    assert('失败后出现重试按钮', (await retryBtn.count()) > 0)
    await page.screenshot({ path: path.join(OUT, '02-model-load-error.png'), fullPage: true })

    const failedEvent = report.aiEvents.find(
      (e) => e.aiEvent === 'error' && e.tool === 'upscale' && e.errorCode === 'model_load',
    )
    assert('失败原因已上报 errorCode=model_load', !!failedEvent, failedEvent)

    // 恢复模型下载 → 点重试
    blockModel = false
    await retryBtn.click()
    const success = await waitForText(page, /已放大到/, 8 * 60 * 1000)
    assert('重试后放大成功（Worker 已重建）', success, { modelRequests })
    const successEvent = report.aiEvents.find((e) => e.aiEvent === 'success' && e.tool === 'upscale')
    assert('成功事件已上报', !!successEvent)
    await page.screenshot({ path: path.join(OUT, '03-retry-success.png'), fullPage: true })

    assert('放大按钮在失败后已恢复可点', !(await page.getByRole('button', { name: /准备中|加载 AI 模型|放大中/ }).count()))
    await ctx.close()

    // ───────── 2. AI 抠图：模型失败 → 重试成功 ─────────
    const { ctx: ctx2, page: page2 } = await newProPage(browser)
    let blockBgModel = true
    await page2.route('**/models/isnet-general-use-fp16.onnx', (route) => {
      return blockBgModel ? route.abort() : route.continue()
    })

    await page2.goto(`${BASE}/zh/tools/remove-bg`, { waitUntil: 'networkidle', timeout: 60000 })
    await page2.waitForSelector('input[type=file]', { state: 'attached', timeout: 30000 })
    await page2.waitForTimeout(1500)
    await page2.locator('input[type=file]').first().setInputFiles(path.join(process.cwd(), 'public/demo-photo.jpg'))
    await page2.waitForTimeout(800)

    await page2.getByRole('button', { name: /^AI 抠图$/ }).click()
    const bgFailShown = await waitForText(page2, /AI 模型加载失败/, 60000)
    assert('抠图模型失败显示分类提示', bgFailShown)
    const bgFailedEvent = report.aiEvents.find(
      (e) => e.aiEvent === 'error' && e.tool === 'remove-bg' && e.errorCode === 'model_load',
    )
    assert('抠图失败原因已上报', !!bgFailedEvent, bgFailedEvent)
    await page2.screenshot({ path: path.join(OUT, '04-remove-bg-error.png'), fullPage: true })

    blockBgModel = false
    await page2.getByRole('button', { name: /^重试$/ }).click()
    const bgSuccess = await waitForText(page2, /下载透明 PNG/, 10 * 60 * 1000)
    assert('抠图重试后成功', bgSuccess)
    const bgSuccessEvent = report.aiEvents.find((e) => e.aiEvent === 'success' && e.tool === 'remove-bg')
    assert('抠图成功事件已上报', !!bgSuccessEvent)
    await page2.screenshot({ path: path.join(OUT, '05-remove-bg-success.png'), fullPage: true })

    await ctx2.close()
  } catch (err) {
    report.steps.push({ name: 'fatal', pass: false, extra: String(err?.stack || err) })
    console.error('FATAL', err)
  } finally {
    await browser.close()
  }

  // 失败提示里允许出现被 abort 的模型请求（属于预期），其它 pageerror 视为失败
  const unexpectedPageErrors = report.pageErrors.filter((m) => !/Failed to fetch|NetworkError/i.test(m))
  assert('无未捕获页面异常', unexpectedPageErrors.length === 0, unexpectedPageErrors)
  report.ok = report.steps.every((s) => s.pass)
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`\n${report.ok ? 'ALL PASS' : 'FAILED'}  ${report.steps.filter((s) => s.pass).length}/${report.steps.length}`)
  process.exit(report.ok ? 0 : 1)
})()
