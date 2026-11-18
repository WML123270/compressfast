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

await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
