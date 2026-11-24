// 目标大小压缩落地页 E2E
// 逐页验证：目标预设生效、压缩后 ≤ 目标（约 15% 容差）、且绝不大于原图
//
// 运行：node test-results/target-size.e2e.mjs
// 线上：BASE_URL=https://jisuyatu.com node test-results/target-size.e2e.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.BASE_URL || 'http://localhost:3100'
const OUT = path.join(__dirname, 'target-size')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const SIZES = [20, 50, 100, 200, 500]
const FIXTURE = path.join(ROOT, 'public/demo-photo.jpg')
const ORIGINAL_BYTES = fs.statSync(FIXTURE).size

const results = []
let passed = 0
let failed = 0

function ok(name, detail) {
  passed++
  results.push({ name, ok: true, detail })
  console.log(`PASS  ${name}  ${detail || ''}`)
}
function bad(name, detail) {
  failed++
  results.push({ name, ok: false, detail })
  console.log(`FAIL  ${name}  ${detail || ''}`)
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true })

try {
  for (const lang of ['zh', 'en']) {
    for (const kb of SIZES) {
      const slug = `compress-to-${kb}kb`
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      try {
        const res = await page.goto(`${BASE}/${lang}/tools/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        if (res?.status() !== 200) throw new Error(`HTTP ${res?.status()}`)

        const h1 = (await page.locator('h1').first().textContent()) || ''
        if (!h1.includes(`${kb}KB`)) throw new Error(`H1 未包含 ${kb}KB：${h1.trim()}`)

        await page.locator('input[type=file]').first().setInputFiles(FIXTURE)

        const targetInput = page.locator('input[type=number][max="50000"]').first()
        await targetInput.waitFor({ state: 'visible', timeout: 20000 })
        const preset = await targetInput.inputValue()
        if (preset !== String(kb)) throw new Error(`目标预设为 ${preset}，期望 ${kb}`)

        await page.getByRole('button', { name: /压缩全部|Compress All/ }).first().click()

        const downloadBtn = page.getByRole('button', { name: /^(下载|Download)$/ }).first()
        await downloadBtn.waitFor({ state: 'visible', timeout: 90000 })

        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 30000 }),
          downloadBtn.click(),
        ])
        const saved = path.join(OUT, `${lang}-${kb}.jpg`)
        await download.saveAs(saved)
        const size = fs.statSync(saved).size

        const limit = kb * 1024
        if (size > limit * 1.15 + 1024) throw new Error(`输出 ${size}B 超过目标 ${kb}KB 的 15% 容差`)
        if (size > ORIGINAL_BYTES) throw new Error(`输出 ${size}B 大于原图 ${ORIGINAL_BYTES}B（目标模式不应撑大）`)
        if (size <= 0) throw new Error('输出文件为空')

        const pageErrs = errors.slice(0, 2).join(' | ')
        if (pageErrs) throw new Error(`页面异常：${pageErrs}`)

        ok(`${lang}/${slug}`, `${(size / 1024).toFixed(1)}KB / 原图 ${(ORIGINAL_BYTES / 1024).toFixed(1)}KB`)
      } catch (err) {
        await page.screenshot({ path: path.join(OUT, `fail-${lang}-${kb}.png`), fullPage: true }).catch(() => {})
        bad(`${lang}/${slug}`, String(err?.message || err))
      } finally {
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}

console.log(`\n目标大小落地页：${passed}/${passed + failed} 通过`)
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2))
process.exit(failed > 0 ? 1 : 0)
