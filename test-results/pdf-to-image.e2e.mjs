// PDF 转图片 E2E：全页 ZIP / 单页图片 / PNG / 移动端 / 埋点
// 用法：node test-results/pdf-to-image.e2e.mjs [baseUrl]
import { chromium } from 'playwright'
import JSZip from 'jszip'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.argv[2] || 'http://localhost:3100'
const FIXTURE = path.join(__dirname, 'pdf-fixtures', 'text-3pages.pdf')
const OUT = path.join(__dirname, 'pdf2img-out')
fs.mkdirSync(OUT, { recursive: true })

let pass = 0
let fail = 0
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

const browser = await chromium.launch({ args: ['--no-proxy-server'] })

async function upload(page) {
  await page.locator('input[type=file]').setInputFiles(FIXTURE)
  await page.waitForFunction(
    () => /3\s*页|3\s*pages?/i.test(document.body.innerText),
    { timeout: 30000 },
  )
}

async function waitResult(page) {
  await page.waitForSelector('text=转换完成', { timeout: 120000 })
}

try {
  // 1) 全部 3 页 → ZIP
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const tracks = []
    page.on('request', r => {
      if (r.url().includes('/api/admin/track')) tracks.push(r.postData() || '')
    })
    await page.goto(`${BASE}/zh/tools/pdf-to-jpg`, { waitUntil: 'networkidle' })
    await upload(page)
    check('识别页数 3', (await page.locator('body').innerText()).includes('全部 3 页'))
    await page.click('button:has-text("转换为图片")')
    await waitResult(page)
    check('ZIP 下载按钮', await page.locator('button:has-text("下载 ZIP（3 张图片）")').count() > 0)
    const zipPath = path.join(OUT, 'all-pages.zip')
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("下载 ZIP")'),
    ])
    await dl.saveAs(zipPath)
    const zip = await JSZip.loadAsync(fs.readFileSync(zipPath))
    const names = Object.keys(zip.files)
    check('ZIP 含 3 个文件', names.length === 3, names.join(','))
    check('文件名为 jpg 且按页码排序', names.every(n => /-page-\d{2,}\.jpg$/.test(n)), names.join(','))
    const firstBuf = await zip.file(names[0]).async('nodebuffer')
    check('JPEG 文件头 FFD8', firstBuf[0] === 0xff && firstBuf[1] === 0xd8)
    check('埋点含 pdf-to-jpg', tracks.some(t => t.includes('"tool":"pdf-to-jpg"')), tracks.join(' | ').slice(0, 200))
    await ctx.close()
  }

  // 2) 自定义单页 + PNG
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(`${BASE}/zh/tools/pdf-to-jpg`, { waitUntil: 'networkidle' })
    await upload(page)
    await page.click('button:has-text("PNG")')
    await page.click('button:has-text("自定义页码")')
    await page.fill('#pdf-image-range', '2')
    check('单页预览', (await page.locator('body').innerText()).includes('输出 1 张图片'))
    await page.click('button:has-text("转换为图片")')
    await waitResult(page)
    check('单页显示图片下载', await page.locator('button:has-text("下载图片")').count() > 0)
    const pngPath = path.join(OUT, 'page-2.png')
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("下载图片")'),
    ])
    await dl.saveAs(pngPath)
    const buf = fs.readFileSync(pngPath)
    check('PNG 文件头', buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG')
    check('文件名含页码 02', /page-02\.png$/.test(dl.suggestedFilename()), dl.suggestedFilename())
    await ctx.close()
  }

  // 3) 非法范围报错
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(`${BASE}/zh/tools/pdf-to-jpg`, { waitUntil: 'networkidle' })
    await upload(page)
    await page.click('button:has-text("自定义页码")')
    await page.fill('#pdf-image-range', '9')
    check('越界提示', (await page.locator('body').innerText()).includes('页码超出范围'))
    const disabled = await page.locator('button:has-text("转换为图片")').isDisabled()
    check('越界时禁用转换', disabled)
    await ctx.close()
  }

  // 4) 390px 无横向溢出 + 英文页
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/en/tools/pdf-to-jpg`, { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    check('390px 无横向溢出', overflow <= 1, `overflow=${overflow}`)
    check('英文页面渲染', (await page.locator('h1').innerText()).includes('PDF to JPG'))
    await upload(page)
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    check('上传后仍无溢出', overflow2 <= 1, `overflow=${overflow2}`)
    await ctx.close()
  }

  // 5) sitemap 含新 URL
  {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const res = await page.request.get(`${BASE}/sitemap.xml`)
    const xml = await res.text()
    check('sitemap 含 pdf-to-jpg', xml.includes('/tools/pdf-to-jpg'))
    await ctx.close()
  }
} finally {
  await browser.close()
  console.log(`\n结果：${pass} 通过，${fail} 失败`)
  process.exit(fail === 0 ? 0 : 1)
}
