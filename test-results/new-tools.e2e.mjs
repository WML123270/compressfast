// 新工具 E2E：图片模糊/马赛克、PNG→ICO、图片→Base64
// 运行：node test-results/new-tools.e2e.mjs
// 线上：BASE_URL=https://jisuyatu.com BLOCK_TRACK=1 node test-results/new-tools.e2e.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.BASE_URL || 'http://localhost:3100'
const OUT = path.join(__dirname, 'new-tools')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const PHOTO = path.join(ROOT, 'public/demo-photo.jpg')
const SMALL_PNG = path.join(ROOT, 'test-results/crop-fixture.png')
const ICO_SRC = path.join(OUT, 'ico-source.png')
await sharp(PHOTO).resize(512, 512, { fit: 'cover' }).png().toFile(ICO_SRC)

let passed = 0
let failed = 0
function ok(name, detail) {
  passed++
  console.log(`PASS  ${name}  ${detail || ''}`)
}
function bad(name, detail) {
  failed++
  console.log(`FAIL  ${name}  ${detail || ''}`)
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true })
if (process.env.BLOCK_TRACK === '1') {
  await ctx.route('**/api/admin/track', (route) => route.abort())
}

async function newPage(lang, slug) {
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const res = await page.goto(`${BASE}/${lang}/tools/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (res?.status() !== 200) throw new Error(`HTTP ${res?.status()}`)
  const h1 = (await page.locator('h1').first().textContent()) || ''
  if (!h1.trim()) throw new Error('缺少 H1')
  return { page, errors }
}

async function download(page, filenamePart, dest) {
  const btn = page.getByRole('button', { name: /^(下载|Download)$/ }).first()
  await btn.waitFor({ state: 'visible', timeout: 60000 })
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), btn.click()])
  await d.saveAs(dest)
  if (filenamePart && !d.suggestedFilename().includes(filenamePart)) {
    throw new Error(`文件名 ${d.suggestedFilename()} 不含 ${filenamePart}`)
  }
  return d.suggestedFilename()
}

try {
  // ── 1. 模糊 / 马赛克 ─────────────────────────────
  for (const lang of ['zh', 'en']) {
    const { page, errors } = await newPage(lang, 'blur-image')
    try {
      await page.locator('input[type=file]').first().setInputFiles(PHOTO)
      await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 20000 })

      // 切到马赛克再切回模糊，确保两种模式都能渲染
      const mosaic = page.getByRole('button', { name: /^(马赛克|Pixelate)$/ }).first()
      await mosaic.click()
      await page.waitForTimeout(200)
      const blur = page.getByRole('button', { name: /^(高斯模糊|Blur)$/ }).first()
      await blur.click()
      await page.waitForTimeout(200)

      const dest = path.join(OUT, `${lang}-blur.jpg`)
      const name = await download(page, 'blurred', dest)
      const size = fs.statSync(dest).size
      const meta = await sharp(dest).metadata()
      if (size <= 0) throw new Error('输出为空')
      if (meta.format !== 'jpeg') throw new Error(`格式 ${meta.format}，期望 jpeg`)
      if (meta.width !== 1200 || meta.height !== 800) throw new Error(`尺寸 ${meta.width}x${meta.height}`)
      if (errors.length) throw new Error(`页面异常：${errors[0]}`)
      ok(`${lang}/blur-image`, `${name} ${(size / 1024).toFixed(1)}KB ${meta.width}x${meta.height}`)
    } catch (err) {
      await page.screenshot({ path: path.join(OUT, `fail-${lang}-blur.png`), fullPage: true }).catch(() => {})
      bad(`${lang}/blur-image`, String(err?.message || err))
    } finally {
      await page.close()
    }
  }

  // ── 2. PNG → ICO ─────────────────────────────────
  for (const lang of ['zh', 'en']) {
    const { page, errors } = await newPage(lang, 'png-to-ico')
    try {
      await page.locator('input[type=file]').first().setInputFiles(ICO_SRC)
      await page.getByRole('button', { name: /^(下载|Download)$/ }).first().waitFor({ state: 'visible', timeout: 20000 })

      const dest = path.join(OUT, `${lang}-favicon.ico`)
      const name = await download(page, '.ico', dest)
      const buf = fs.readFileSync(dest)
      if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) throw new Error('ICO 头无效')
      const count = buf.readUInt16LE(4)
      if (count !== 4) throw new Error(`尺寸数量 ${count}，期望默认 4`)
      for (let i = 0; i < count; i++) {
        const p = 6 + i * 16
        const len = buf.readUInt32LE(p + 8)
        const off = buf.readUInt32LE(p + 12)
        if (len <= 0 || off + len > buf.length) throw new Error(`第 ${i + 1} 个条目越界`)
        const sig = buf.subarray(off, off + 8)
        const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        if (!sig.equals(pngSig)) throw new Error(`第 ${i + 1} 个条目不是 PNG`)
      }
      if (errors.length) throw new Error(`页面异常：${errors[0]}`)
      ok(`${lang}/png-to-ico`, `${name} ${(buf.length / 1024).toFixed(1)}KB ${count} sizes`)
    } catch (err) {
      await page.screenshot({ path: path.join(OUT, `fail-${lang}-ico.png`), fullPage: true }).catch(() => {})
      bad(`${lang}/png-to-ico`, String(err?.message || err))
    } finally {
      await page.close()
    }
  }

  // ── 3. 图片 → Base64 ─────────────────────────────
  for (const lang of ['zh', 'en']) {
    const { page, errors } = await newPage(lang, 'image-to-base64')
    try {
      await page.locator('input[type=file]').first().setInputFiles(SMALL_PNG)
      const ta = page.locator('textarea').first()
      await ta.waitFor({ state: 'visible', timeout: 20000 })
      const uri = await ta.inputValue()
      if (!uri.startsWith('data:image/png;base64,')) throw new Error(`Data URI 前缀错误：${uri.slice(0, 30)}`)
      if (uri.length < 1000) throw new Error('Data URI 过短')

      await page.getByRole('button', { name: 'HTML', exact: true }).click()
      const html = await ta.inputValue()
      if (!html.includes('<img src="data:image/png;base64,')) throw new Error('HTML 片段不正确')

      await page.getByRole('button', { name: 'CSS', exact: true }).click()
      const css = await ta.inputValue()
      if (!css.includes('background-image: url("data:image/png;base64,')) throw new Error('CSS 片段不正确')

      await page.getByRole('button', { name: 'Base64', exact: true }).click()
      const raw = await ta.inputValue()
      if (raw.startsWith('data:') || raw.length < 1000) throw new Error('纯 Base64 输出不正确')

      if (errors.length) throw new Error(`页面异常：${errors[0]}`)
      ok(`${lang}/image-to-base64`, `URI ${(uri.length / 1024).toFixed(1)}KB`)
    } catch (err) {
      await page.screenshot({ path: path.join(OUT, `fail-${lang}-base64.png`), fullPage: true }).catch(() => {})
      bad(`${lang}/image-to-base64`, String(err?.message || err))
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}

console.log(`\n新工具：${passed}/${passed + failed} 通过`)
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ passed, failed }, null, 2))
process.exit(failed > 0 ? 1 : 0)
