/**
 * UI 改版部署验证 —— 真实浏览器渲染两站首页
 * 检查：关键元素 / 吉祥物与标题是否重叠 / 移动端 / 失败请求
 * 用法: node scripts/verify-ui.js
 */
const { chromium } = require('playwright')

const SITES = [
  { name: 'cn', url: 'https://jisuyatu.com/' },
  { name: 'en', url: 'https://compressfast.site/' },
]
const VIEWPORTS = [
  { tag: 'desktop', width: 1280, height: 900 },
  { tag: 'mobile', width: 390, height: 844 },
]

const probe = () => {
  const mascot = document.querySelector('img[src*="mascot"]')
  const h1 = document.querySelector('h1')
  const grad = document.querySelector('.text-gradient')
  const visible = el => !!(el && el.offsetWidth > 0 && getComputedStyle(el).display !== 'none')

  let overlap = null
  if (visible(mascot) && h1) {
    const m = mascot.getBoundingClientRect()
    const t = h1.getBoundingClientRect()
    const ox = Math.max(0, Math.min(m.right, t.right) - Math.max(m.left, t.left))
    const oy = Math.max(0, Math.min(m.bottom, t.bottom) - Math.max(m.top, t.top))
    overlap = { px: Math.round(ox * oy), mascotRight: Math.round(m.right), vw: window.innerWidth }
  }
  return {
    mascotVisible: visible(mascot),
    mascotSize: mascot ? `${mascot.offsetWidth}x${mascot.offsetHeight}` : null,
    mascotLoaded: mascot ? mascot.naturalWidth > 0 : false,
    overlapWithH1: overlap,
    gradient: grad ? getComputedStyle(grad).backgroundImage.slice(0, 80) : null,
    windowBar: document.body.innerText.includes('Web Worker'),
    demoShowcase: /看看效果|See it in action/i.test(document.body.innerText),
    hDocScroll: document.documentElement.scrollWidth > window.innerWidth + 1
      ? `⚠️ 横向溢出 ${document.documentElement.scrollWidth}>${window.innerWidth}` : 'ok',
  }
}

;(async () => {
  const browser = await chromium.launch({ args: ['--no-proxy-server'] })
  for (const site of SITES) {
    console.log(`\n########## ${site.name.toUpperCase()}  ${site.url} ##########`)
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
      const failed = []
      page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })
      try {
        await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 })
        await page.waitForTimeout(2000)
        console.log(`--- ${vp.tag} ${vp.width}px ---`)
        console.log(JSON.stringify(await page.evaluate(probe), null, 1))
        await page.screenshot({ path: `verify-${site.name}-${vp.tag}.png` })
        console.log(failed.length ? '❌ ' + failed.join('\n   ') : '✅ 无 4xx/5xx')
      } catch (e) {
        console.log(`--- ${vp.tag} --- ❌ ${e.message}`)
      }
      await page.close()
    }
  }
  await browser.close()
})()
