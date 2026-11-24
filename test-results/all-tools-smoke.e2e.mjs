// 全站工具巡检
// 1. 23 个共享压缩工具页：用匹配的格式上传 → 压缩全部 → 下载 → 校验输出扩展名/非空
// 2. 首页：批量 2 张 → 压缩全部 → ZIP 下载 → 校验 ZIP 含 2 个文件
// 3. 静态页 / 工具目录 / Pro 页等：中英双语 200 + 无页面异常 + 无静态资源 404
//
// 运行：node test-results/all-tools-smoke.e2e.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.BASE_URL || 'http://localhost:3100'
const OUT = path.join(__dirname, 'all-tools-smoke')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const report = { ok: false, tools: [], pages: [], failures: [] }

function pass(name, extra) {
  report.tools.push({ name, ok: true, ...(extra || {}) })
  console.log(`PASS  ${name}${extra ? '  ' + JSON.stringify(extra) : ''}`)
}
function fail(name, detail, extra) {
  report.tools.push({ name, ok: false, detail, ...(extra || {}) })
  report.failures.push({ name, detail })
  console.log(`FAIL  ${name}  ${detail || ''}`)
}

// 共享压缩工具（特殊 UI：image-to-pdf / merge-pdf / split-pdf / compress-pdf / pdf-to-jpg / crop-image 由既有 E2E 覆盖）
const TOOLS = [
  ['compress-png', 'test-results/crop-fixture.png', 'png'],
  ['compress-jpeg', 'public/demo-photo.jpg', 'jpg'],
  ['convert-to-webp', 'public/demo-photo.jpg', 'webp'],
  ['compress-images', 'public/demo-photo.jpg', 'jpg'],
  ['compress-gif', 'test-results/batch-compress.gif', 'gif'],
  ['resize-image', 'public/demo-photo.jpg', 'jpg'],
  ['convert-jpg-to-png', 'public/demo-photo.jpg', 'png'],
  ['webp-to-png', 'test-results/crop-fixture.webp', 'png'],
  ['remove-metadata', 'public/demo-photo.jpg', 'jpg'],
  ['tinypng-alternative', 'public/demo-photo.jpg', 'jpg'],
  ['heic-to-jpg', 'test-results/heic-fixtures/sample.heic', 'jpg'],
  ['heic-to-png', 'test-results/heic-fixtures/sample.heic', 'png'],
  ['compress-svg', 'test-results/crop-test.svg', 'svg'],
  ['png-to-jpg', 'test-results/crop-fixture.png', 'jpg'],
  ['jpg-to-webp', 'public/demo-photo.jpg', 'webp'],
  ['png-to-webp', 'test-results/crop-fixture.png', 'webp'],
  ['svg-to-png', 'test-results/crop-test.svg', 'png'],
  ['webp-to-jpg', 'test-results/crop-fixture.webp', 'jpg'],
  ['avif-to-jpg', 'test-results/crop-fixture.avif', 'jpg'],
  ['avif-to-png', 'test-results/crop-fixture.avif', 'png'],
  ['avif-to-webp', 'test-results/crop-fixture.avif', 'webp'],
  ['heic-to-webp', 'test-results/heic-fixtures/sample.heic', 'webp'],
  ['gif-to-webp', 'test-results/batch-compress.gif', 'webp'],
]

const STATIC_PAGES = ['', 'pro', 'guides', 'about', 'help', 'contact', 'privacy', 'terms', 'vs-tinypng', 'tool']

function setupPage(page, state) {
  page.on('pageerror', (e) => state.pageErrors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') state.consoleErrors.push(m.text().slice(0, 300))
  })
  page.on('response', (res) => {
    const type = res.request().resourceType()
    if (res.status() >= 400 && ['script', 'stylesheet', 'font', 'image', 'document'].includes(type)) {
      state.resourceErrors.push(`${res.status()} ${type} ${res.url()}`)
    }
  })
}

function newState() {
  return { pageErrors: [], consoleErrors: [], resourceErrors: [] }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true })
  // 线上跑时拦截埋点，避免测试流量污染生产统计
  if (process.env.BLOCK_TRACK === '1') {
    await ctx.route('**/api/admin/track', (route) => route.abort())
  }

  try {
    // ───────── 1. 共享压缩工具 ─────────
    for (const [slug, fixture, expectedExt] of TOOLS) {
      const page = await ctx.newPage()
      const state = newState()
      setupPage(page, state)
      try {
        const res = await page.goto(`${BASE}/zh/tools/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        if (res?.status() !== 200) throw new Error(`HTTP ${res?.status()}`)

        const h1 = (await page.locator('h1').first().textContent().catch(() => '')) || ''
        if (!h1.trim()) throw new Error('缺少 H1')

        await page.locator('input[type=file]').first().setInputFiles(path.join(ROOT, fixture))

        const compressAll = page.getByRole('button', { name: /压缩全部/ }).first()
        await compressAll.waitFor({ state: 'visible', timeout: 20000 })

        const t0 = Date.now()
        await compressAll.click()

        const downloadBtn = page.getByRole('button', { name: '下载', exact: true }).first()
        await downloadBtn.waitFor({ state: 'visible', timeout: 90000 })
        const waitMs = Date.now() - t0

        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          downloadBtn.click(),
        ])
        const filename = download.suggestedFilename()
        const saved = path.join(OUT, `${slug}${path.extname(filename) || '.bin'}`)
        await download.saveAs(saved)
        const size = fs.statSync(saved).size
        if (size <= 0) throw new Error('下载文件为空')

        const extOk = filename.toLowerCase().endsWith('.' + expectedExt)
        if (!extOk) throw new Error(`输出扩展名不符：${filename}（期望 .${expectedExt}）`)

        // GIF 专项：必须是真的动图（不是改了扩展名的静态 PNG），且压缩后确实变小
        if (slug === 'compress-gif' || slug === 'gif-to-webp') {
          const meta = await sharp(saved).metadata()
          const pages = meta.pages || 1
          if (slug === 'compress-gif') {
            if (meta.format !== 'gif') throw new Error(`输出不是 GIF：${meta.format}`)
            if (pages < 2) throw new Error(`GIF 动画丢失（pages=${pages}）`)
            const inputSize = fs.statSync(path.join(ROOT, fixture)).size
            if (size >= inputSize) throw new Error(`GIF 未变小：${size} >= ${inputSize}`)
          } else {
            if (meta.format !== 'webp') throw new Error(`输出不是 WebP：${meta.format}`)
            if (pages < 2) throw new Error(`WebP 动画丢失（pages=${pages}）`)
          }
        }

        const errs = [...state.pageErrors, ...state.resourceErrors]
        if (errs.length) throw new Error(`页面错误：${errs.join(' | ')}`)

        pass(`${slug}`, { file: filename, bytes: size, ms: waitMs })
      } catch (err) {
        await page.screenshot({ path: path.join(OUT, `fail-${slug}.png`), fullPage: true }).catch(() => {})
        fail(slug, String(err?.message || err), {
          pageErrors: state.pageErrors,
          resourceErrors: state.resourceErrors,
          consoleErrors: state.consoleErrors,
        })
      } finally {
        await page.close()
      }
    }

    // ───────── 2. 首页批量 + ZIP ─────────
    {
      const page = await ctx.newPage()
      const state = newState()
      setupPage(page, state)
      try {
        const res = await page.goto(`${BASE}/zh`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        if (res?.status() !== 200) throw new Error(`HTTP ${res?.status()}`)
        await page.locator('input[type=file]').first().setInputFiles([
          path.join(ROOT, 'public/demo-photo.jpg'),
          path.join(ROOT, 'test-results/crop-fixture.png'),
        ])
        const compressAll = page.getByRole('button', { name: /压缩全部/ }).first()
        await compressAll.waitFor({ state: 'visible', timeout: 20000 })
        await compressAll.click()

        const downloadAll = page.getByRole('button', { name: /下载全部/ }).first()
        await downloadAll.waitFor({ state: 'visible', timeout: 90000 })
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          downloadAll.click(),
        ])
        const saved = path.join(OUT, 'home-batch.zip')
        await download.saveAs(saved)
        const zip = await JSZip.loadAsync(fs.readFileSync(saved))
        const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
        if (names.length !== 2) throw new Error(`ZIP 文件数 ${names.length}，期望 2`)
        const errs = [...state.pageErrors, ...state.resourceErrors]
        if (errs.length) throw new Error(`页面错误：${errs.join(' | ')}`)
        pass('home-batch-zip', { files: names, bytes: fs.statSync(saved).size })
      } catch (err) {
        await page.screenshot({ path: path.join(OUT, 'fail-home.png'), fullPage: true }).catch(() => {})
        fail('home-batch-zip', String(err?.message || err), {
          pageErrors: state.pageErrors,
          resourceErrors: state.resourceErrors,
        })
      } finally {
        await page.close()
      }
    }

    // ───────── 3. 静态页 / 目录页（中英） ─────────
    for (const lang of ['zh', 'en']) {
      for (const p of STATIC_PAGES) {
        const slug = p || 'home'
        const page = await ctx.newPage()
        const state = newState()
        setupPage(page, state)
        try {
          const res = await page.goto(`${BASE}/${lang}${p ? '/' + p : ''}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
          if (res?.status() !== 200) throw new Error(`HTTP ${res?.status()}`)
          const h1 = (await page.locator('h1').first().textContent().catch(() => '')) || ''
          if (!h1.trim()) throw new Error('缺少 H1')
          const errs = [...state.pageErrors, ...state.resourceErrors]
          if (errs.length) throw new Error(`页面错误：${errs.join(' | ')}`)
          report.pages.push({ lang, page: slug, ok: true })
          console.log(`PASS  ${lang}/${slug}`)
        } catch (err) {
          await page.screenshot({ path: path.join(OUT, `fail-${lang}-${slug}.png`), fullPage: true }).catch(() => {})
          report.pages.push({ lang, page: slug, ok: false, detail: String(err?.message || err) })
          report.failures.push({ name: `${lang}/${slug}`, detail: String(err?.message || err) })
          console.log(`FAIL  ${lang}/${slug}  ${err?.message || err}`)
        } finally {
          await page.close()
        }
      }
    }
  } catch (err) {
    report.failures.push({ name: 'fatal', detail: String(err?.stack || err) })
    console.error('FATAL', err)
  } finally {
    await ctx.close()
    await browser.close()
  }

  const total = report.tools.length + report.pages.length
  const failed = report.failures.length
  report.ok = failed === 0
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`\n${report.ok ? 'ALL PASS' : 'FAILED'}  ${total - failed}/${total}`)
  if (failed) console.log('失败项:', JSON.stringify(report.failures, null, 2))
  process.exit(report.ok ? 0 : 1)
})()
