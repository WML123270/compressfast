// 大图目标压缩补测：使用 898KB / 3200px 的图片验证 200KB / 500KB 页
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.BASE_URL || 'http://localhost:3100'
const FIXTURE = process.env.FIXTURE || path.join(ROOT, 'test-results/target-large.jpg')
const SIZES = (process.env.SIZES || '20,200,500').split(',').map(Number)

// 大图夹具缺失时自动生成，避免把 ~1MB 二进制提交进仓库
if (!fs.existsSync(FIXTURE)) {
  const src = path.join(ROOT, 'public/demo-photo.jpg')
  if (FIXTURE.endsWith('.png')) {
    await sharp(src).resize(2400, 1600).png({ compressionLevel: 9 }).toFile(FIXTURE)
  } else {
    await sharp(src).resize(3200, 2133).jpeg({ quality: 95 }).toFile(FIXTURE)
  }
}
const ORIG = fs.statSync(FIXTURE).size

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ acceptDownloads: true })
if (process.env.BLOCK_TRACK === '1') {
  await ctx.route('**/api/admin/track', (route) => route.abort())
}
let fail = 0

for (const kb of SIZES) {
  const page = await ctx.newPage()
  try {
    await page.goto(`${BASE}/zh/tools/compress-to-${kb}kb`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.locator('input[type=file]').first().setInputFiles(FIXTURE)
    await page.getByRole('button', { name: /压缩全部/ }).first().click()
    const btn = page.getByRole('button', { name: '下载', exact: true }).first()
    await btn.waitFor({ state: 'visible', timeout: 120000 })
    const [d] = await Promise.all([page.waitForEvent('download'), btn.click()])
    const p = path.join(__dirname, 'target-size', `large-${kb}.jpg`)
    await d.saveAs(p)
    const size = fs.statSync(p).size
    const okSize = size <= kb * 1024 * 1.15 && size <= ORIG
    console.log(`${okSize ? 'PASS' : 'FAIL'}  ${kb}KB -> ${(size / 1024).toFixed(1)}KB (原图 ${(ORIG / 1024).toFixed(1)}KB)`)
    if (!okSize) fail++
  } catch (e) {
    console.log(`FAIL  ${kb}KB  ${e.message}`)
    fail++
  } finally {
    await page.close()
  }
}
await browser.close()
process.exit(fail ? 1 : 0)
