import { chromium } from 'playwright'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'

const BASE = process.env.BASE_URL || 'http://localhost:3100'
const FIXTURE = 'test-results/crop-fixture.png'
const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok })
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  acceptDownloads: true,
})
const page = await ctx.newPage()

// ── 1. Page + SEO ───────────────────────────────────────────────────────
const res = await page.goto(`${BASE}/zh/tools/crop-image`, { waitUntil: 'networkidle' })
check('页面 200', res?.status() === 200, String(res?.status()))
check('H1 正确', (await page.locator('h1').textContent())?.includes('在线裁剪图片'))
const bodyText = await page.locator('body').textContent()
check('SEO 文案', bodyText.includes('裁剪') && bodyText.includes('EXIF'))
check('常见问题区块', bodyText.includes('常见问题') && bodyText.includes('这个裁剪工具真的免费吗'))
check('相关工具链接', (await page.locator('a[href$="/tools/resize-image"]').count()) > 0)
check('JSON-LD 存在', (await page.locator('script[type="application/ld+json"]').count()) > 0)
const enRes = await page.goto(`${BASE}/en/tools/crop-image`, { waitUntil: 'networkidle' })
check('英文页 200', enRes?.status() === 200)
check('英文 H1', (await page.locator('h1').textContent())?.includes('Crop Images Online'))

// ── 2. Upload + initial crop ───────────────────────────────────────────
await page.goto(`${BASE}/zh/tools/crop-image`, { waitUntil: 'networkidle' })
await page.locator('input[type=file]').setInputFiles(FIXTURE)
await page.waitForSelector('canvas', { timeout: 10000 })
await page.waitForTimeout(400)
check('上传后显示画布', await page.locator('canvas').isVisible())
const footer = () => page.locator('text=/^\\d+ × \\d+ px$/').textContent()
check('初始裁剪 80%（640×480）', (await footer()) === '640 × 480 px', await footer())

// Plain click on empty space must not wipe the current selection
const cbox = await page.locator('canvas').boundingBox()
await page.mouse.click(cbox.x + 12, cbox.y + 12)
await page.waitForTimeout(150)
check('空白处单击不丢失选区', (await footer()) === '640 × 480 px', await footer())

// Dragging on empty space draws a new crop
await page.mouse.move(cbox.x + 12, cbox.y + 12)
await page.mouse.down()
await page.mouse.move(cbox.x + 200, cbox.y + 100, { steps: 6 })
await page.mouse.up()
await page.waitForTimeout(200)
const dragged = await footer()
check('空白处拖拽可新建选区', dragged !== '640 × 480 px', dragged)

// ── 3. Aspect ratio preset ─────────────────────────────────────────────
await page.getByRole('button', { name: '1:1', exact: true }).click()
await page.waitForTimeout(300)
check('1:1 裁剪 480×480', (await footer()) === '480 × 480 px', await footer())

// ── 4. rotate resets crop to rotated bounds ────────────────────────────
await page.getByTitle('顺时针旋转 90°').click()
await page.waitForTimeout(300)
check('旋转后 480×640', (await footer()) === '480 × 640 px', await footer())
check('旋转后比例重置为自由', (await page.getByRole('button', { name: '自由', exact: true }).getAttribute('class'))?.includes('bg-cyan-600'))

// ── 5. Export WebP at chosen size ──────────────────────────────────────
await page.locator('select').selectOption('webp')
await page.waitForTimeout(200)
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }),
  page.getByRole('button', { name: '裁剪并下载' }).click(),
])
const outPath = 'test-results/crop-out.webp'
await download.saveAs(outPath)
check('下载文件名含 -cropped', download.suggestedFilename().endsWith('-cropped.webp'), download.suggestedFilename())
const meta = await sharp(outPath).metadata()
check('WebP 格式', meta.format === 'webp', String(meta.format))
check('导出尺寸 480×640', meta.width === 480 && meta.height === 640, `${meta.width}×${meta.height}`)

// Verify rotation direction: CW 90° puts original bottom-left at top-left
const raw = await sharp(outPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const px = (x, y) => {
  const i = (y * raw.info.width + x) * raw.info.channels
  return [raw.data[i], raw.data[i + 1], raw.data[i + 2]]
}
const near = (c, target, tol = 70) => c.every((v, i) => Math.abs(v - target[i]) <= tol)
check('旋转后左上=原左下（蓝）', near(px(20, 20), [0, 0, 255]), px(20, 20).join(','))
check('旋转后右上=原左上（红）', near(px(460, 20), [255, 0, 0]), px(460, 20).join(','))
check('旋转后左下=原右下（黄）', near(px(20, 620), [255, 230, 0]), px(20, 620).join(','))
check('旋转后右下=原右上（绿）', near(px(460, 620), [0, 255, 0]), px(460, 620).join(','))
check('显示下载结果提示', (await page.locator('body').textContent()).includes('已下载 480 × 640'))

// ── 6. PNG export after rotate-back ────────────────────────────────────
await page.getByTitle('逆时针旋转 90°').click()
await page.locator('select').selectOption('png')
const [dl2] = await Promise.all([
  page.waitForEvent('download', { timeout: 15000 }),
  page.getByRole('button', { name: '裁剪并下载' }).click(),
])
const outPng = 'test-results/crop-out.png'
await dl2.saveAs(outPng)
const meta2 = await sharp(outPng).metadata()
check('PNG 导出 640×480', meta2.format === 'png' && meta2.width === 640 && meta2.height === 480, `${meta2.format} ${meta2.width}×${meta2.height}`)

// ── 7. Remove image returns dropzone ───────────────────────────────────
await page.getByTitle('更换图片').click()
await page.waitForTimeout(200)
check('更换图片回到上传区', (await page.locator('text=点击选择图片，或拖到这里').count()) > 0)

// ── 8. Mobile viewport ─────────────────────────────────────────────────
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  acceptDownloads: true,
})
const mp = await mobile.newPage()
await mp.goto(`${BASE}/zh/tools/crop-image`, { waitUntil: 'networkidle' })
await mp.locator('input[type=file]').setInputFiles(FIXTURE)
await mp.waitForSelector('canvas', { timeout: 10000 })
await mp.waitForTimeout(400)
const box = await mp.locator('canvas').boundingBox()
check('移动端画布不溢出', box && box.width <= 390, JSON.stringify(box))
check('移动端显示下载按钮', await mp.getByRole('button', { name: '裁剪并下载' }).isVisible())
await mobile.close()

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
