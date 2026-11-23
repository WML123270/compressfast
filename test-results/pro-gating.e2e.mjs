import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:3100'
const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok })
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
})
const page = await ctx.newPage()
const trackBodies = []
page.on('request', (req) => {
  if (req.url().includes('/api/admin/track')) {
    try { trackBodies.push(JSON.parse(req.postData() || '{}')) } catch {}
  }
})

await page.goto(`${BASE}/zh`, { waitUntil: 'networkidle' })
// 直接注入一张 1x1 PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
  'base64',
)
await page.locator('input[type=file]').first().setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png })
await page.waitForTimeout(1500)

const body = await page.locator('body').textContent()
check('免费用户看到水印 Pro 锁', body?.includes('水印设置') && body?.includes('升级解锁'))
check('免费用户看到场景预设 Pro 锁', body?.includes('场景预设'))
check('水印锁文案', body?.includes('Pro 一次买断即可永久使用'))

// 点击水印升级入口，应带 source=watermark
await page.locator('a[href$="/pro"]').filter({ hasText: '升级解锁' }).first().click()
await page.waitForTimeout(1200)
check('进入 Pro 页', page.url().includes('/pro'))
const clicks = trackBodies.filter(b => b.event === 'pro' && b.proStage === 'click')
check('水印入口埋点', clicks.some(b => b.source === 'watermark' || b.source === 'scene_presets'), JSON.stringify(clicks.map(c => c.source)))

// ---- 文件超限时给升级入口 ----
const page2 = await ctx.newPage()
const track2 = []
page2.on('request', (req) => {
  if (req.url().includes('/api/admin/track')) {
    try { track2.push(JSON.parse(req.postData() || '{}')) } catch {}
  }
})
await page2.goto(`${BASE}/zh`, { waitUntil: 'networkidle' })
await page2.locator('input[type=file]').first().setInputFiles({
  name: 'too-big.png',
  mimeType: 'image/png',
  buffer: Buffer.alloc(11 * 1024 * 1024),
})
await page2.waitForTimeout(900)
const limitBody = await page2.locator('body').textContent()
check('超限提示', limitBody?.includes('文件过大'))
check('超限提示带 Pro 权益', limitBody?.includes('Pro 支持每次 500 张、单张 50MB'))
const upgrade = page2.getByTestId('dropzone-upgrade')
check('超限提示带升级入口', await upgrade.isVisible())
check('升级入口指向 Pro 页', (await upgrade.getAttribute('href'))?.includes('/pro'))

await upgrade.click()
await page2.waitForTimeout(1200)
check('超限升级入口进入 Pro 页', page2.url().includes('/pro'))
check(
  '超限升级入口埋点 source=dropzone',
  track2.some(b => b.event === 'pro' && b.proStage === 'click' && b.source === 'dropzone'),
  JSON.stringify(track2.filter(b => b.event === 'pro').map(b => `${b.proStage}:${b.source}`))
)

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
