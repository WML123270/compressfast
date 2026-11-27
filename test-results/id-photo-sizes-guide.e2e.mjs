// 证件照尺寸大全指南页 E2E
// 运行：node test-results/id-photo-sizes-guide.e2e.mjs
// 线上：BASE_URL=https://jisuyatu.com node test-results/id-photo-sizes-guide.e2e.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE_URL || 'http://localhost:3111'
const OUT = path.join(__dirname, 'id-photo-sizes-guide')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

let passed = 0
let failed = 0
const ok = (name, detail) => { passed++; console.log(`PASS  ${name}  ${detail || ''}`) }
const bad = (name, detail) => { failed++; console.log(`FAIL  ${name}  ${detail || ''}`) }

async function openPage(ctx, url, viewport) {
  const page = await ctx.newPage()
  if (viewport) await page.setViewportSize(viewport)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (res?.status() !== 200) throw new Error(`HTTP ${res?.status()} for ${url}`)
  return { page, errors }
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()

try {
  // ── 1. 中文桌面：标题、三张表、FAQ、JSON-LD、CTA ──
  {
    const url = `${BASE}/zh/guides/id-photo-sizes`
    const { page, errors } = await openPage(ctx, url, { width: 1280, height: 900 })
    const h1 = (await page.locator('h1').first().innerText()).trim()
    if (h1.includes('证件照尺寸大全')) ok('zh H1', h1)
    else bad('zh H1', h1)

    const tables = page.locator('table')
    const tableCount = await tables.count()
    if (tableCount === 3) ok('zh 表格数量', '3')
    else bad('zh 表格数量', `期望 3，实际 ${tableCount}`)

    // 每张表：表头列数 = 每行列数
    let tableOk = true
    for (let t = 0; t < tableCount; t++) {
      const table = tables.nth(t)
      const headerCells = await table.locator('thead th').count()
      const rowCount = await table.locator('tbody tr').count()
      if (headerCells === 0 || rowCount === 0) { tableOk = false; continue }
      const firstRowCells = await table.locator('tbody tr').first().locator('td').count()
      if (firstRowCells !== headerCells) tableOk = false
      for (let r = 0; r < rowCount; r++) {
        const cells = await table.locator('tbody tr').nth(r).locator('td').count()
        if (cells !== headerCells) { tableOk = false; break }
      }
    }
    if (tableOk) ok('zh 表格列数一致', '3 张表')
    else bad('zh 表格列数一致')

    // 关键数据出现在页面
    const text = await page.locator('body').innerText()
    for (const needle of ['295×413', '413×579', '600×600', '35×45mm']) {
      if (text.includes(needle)) ok(`zh 数据 ${needle}`)
      else bad(`zh 数据 ${needle}`)
    }

    const faqCount = await page.locator('details').count()
    if (faqCount >= 9) ok('zh FAQ 数量', String(faqCount))
    else bad('zh FAQ 数量', `期望 >= 9，实际 ${faqCount}`)

    const ctaTexts = await page.locator('a[href="/zh/tools/id-photo"]').allInnerTexts()
    if (ctaTexts.some((t) => t.includes('制作证件照'))) ok('zh CTA 指向证件照工具')
    else bad('zh CTA 指向证件照工具', ctaTexts.join(' / '))

    const jsonLd = (await page.locator('script[type="application/ld+json"]').allInnerTexts()).join('\n')
    if (jsonLd.includes('"FAQPage"') && jsonLd.includes('2026-11-27')) ok('zh JSON-LD FAQ + dateModified')
    else bad('zh JSON-LD FAQ + dateModified')

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    if (canonical?.endsWith('/zh/guides/id-photo-sizes')) ok('zh canonical', canonical)
    else bad('zh canonical', canonical ?? 'missing')

    if (errors.length === 0) ok('zh 无页面错误')
    else bad('zh 无页面错误', errors.join(' | '))
    await page.close()
  }

  // ── 2. 英文桌面：标题、CTA、内链 ──
  {
    const url = `${BASE}/en/guides/id-photo-sizes`
    const { page, errors } = await openPage(ctx, url, { width: 1280, height: 900 })
    const h1 = (await page.locator('h1').first().innerText()).trim()
    if (/ID Photo Size/i.test(h1)) ok('en H1', h1)
    else bad('en H1', h1)

    const text = await page.locator('body').innerText()
    if (text.includes('295×413') && text.includes('600×600')) ok('en 数据')
    else bad('en 数据')

    const ctaTexts = await page.locator('a[href="/en/tools/id-photo"]').allInnerTexts()
    if (ctaTexts.some((t) => /Make an ID Photo/i.test(t))) ok('en CTA 指向证件照工具')
    else bad('en CTA 指向证件照工具', ctaTexts.join(' / '))

    const tableHeaders = await page.locator('table thead th').allInnerTexts()
    if (tableHeaders.some((h) => h.includes('Print size'))) ok('en 表头本地化', tableHeaders.slice(0, 4).join(' / '))
    else bad('en 表头本地化', tableHeaders.join(' / '))

    if (errors.length === 0) ok('en 无页面错误')
    else bad('en 无页面错误', errors.join(' | '))
    await page.close()
  }

  // ── 3. 中文移动端：表格内部横向滚动，页面不溢出 ──
  {
    const url = `${BASE}/zh/guides/id-photo-sizes`
    const { page } = await openPage(ctx, url, { width: 390, height: 844 })
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    if (overflow.scrollWidth <= overflow.innerWidth + 1) ok('zh 移动端无横向溢出', JSON.stringify(overflow))
    else bad('zh 移动端无横向溢出', JSON.stringify(overflow))

    const scroller = await page.locator('table').first().evaluate((el) => {
      const wrapper = el.parentElement
      return wrapper ? { scrollWidth: wrapper.scrollWidth, clientWidth: wrapper.clientWidth } : null
    })
    if (scroller && scroller.scrollWidth > scroller.clientWidth) ok('zh 移动端表格内部可滚动', JSON.stringify(scroller))
    else bad('zh 移动端表格内部可滚动', JSON.stringify(scroller))
    await page.screenshot({ path: path.join(OUT, 'zh-mobile.png'), fullPage: true })
    await page.close()
  }

  // ── 4. 指南索引 + 证件照工具页互链 ──
  {
    const { page } = await openPage(ctx, `${BASE}/zh/guides`)
    const guideLink = page.locator('a[href="/zh/guides/id-photo-sizes"]')
    if (await guideLink.count()) ok('指南索引列出新指南')
    else bad('指南索引列出新指南')
    await page.close()

    const tool = await openPage(ctx, `${BASE}/zh/tools/id-photo`, { width: 1280, height: 900 })
    const back = tool.page.locator('a[href="/zh/guides/id-photo-sizes"]')
    if (await back.count()) ok('证件照工具页反向链接指南')
    else bad('证件照工具页反向链接指南')
    if (tool.errors.length === 0) ok('证件照工具页无页面错误')
    else bad('证件照工具页无页面错误', tool.errors.join(' | '))
    await tool.page.close()
  }

  // ── 5. sitemap 包含中英两条指南 URL ──
  {
    const res = await fetch(`${BASE}/sitemap.xml`)
    const xml = await res.text()
    const zh = xml.includes('/zh/guides/id-photo-sizes')
    const en = xml.includes('/en/guides/id-photo-sizes')
    if (zh && en) ok('sitemap 含中英指南 URL')
    else bad('sitemap 含中英指南 URL', `zh=${zh} en=${en}`)
    fs.writeFileSync(path.join(OUT, 'sitemap-id-photo-sizes.txt'), xml.split('\n').filter((l) => l.includes('id-photo-sizes')).join('\n'))
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
