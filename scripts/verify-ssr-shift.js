/**
 * 对比「SSR 占位版（禁用 JS）」与「水合后」的元素几何位置。
 * 位移接近 0 = 用户看不到界面闪变。
 * 用法: node scripts/verify-ssr-shift.js [url]
 */
const { chromium } = require('playwright')
const URL = process.argv[2] || 'http://127.0.0.1:3999/zh'

const probe = () => {
  const el = sel => document.querySelector(sel)
  const rect = sel => {
    const e = el(sel)
    if (!e) return null
    const r = e.getBoundingClientRect()
    return { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }
  }
  const w = el('.backdrop-blur-xl')
  const d = el('.border-dashed')
  return {
    h1: rect('h1'),
    mascot: rect('img[src*=mascot]'),
    window: rect('.backdrop-blur-xl'),
    dropArea: rect('.border-dashed'),
    // 相对锚点：dropArea 相对 window 顶部的偏移（消除占位版/水合版内容差异造成的绝对位移）
    dropVsWindow: w && d ? d.getBoundingClientRect().top - w.getBoundingClientRect().top : null,
  }
}

;(async () => {
  const browser = await chromium.launch({ args: ['--no-proxy-server'] })
  const out = {}
  for (const js of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: js })
    const page = await ctx.newPage()
    await page.goto(URL, { waitUntil: js ? 'networkidle' : 'load', timeout: 60000 })
    await page.waitForTimeout(js ? 2500 : 800)
    out[js ? 'hydrated' : 'ssr'] = await page.evaluate(probe)
    await ctx.close()
  }
  console.log(JSON.stringify(out, null, 1))
  console.log('--- 位移 (SSR vs 水合后) ---')
  for (const k of Object.keys(out.ssr)) {
    const a = out.ssr[k], z = out.hydrated[k]
    if (!a || !z) { console.log(`${k}: ${a ? '' : 'SSR缺失 '}${z ? '' : '水合后缺失'}`); continue }
    const d = ['t', 'l', 'w', 'h'].map(x => Math.abs(a[x] - z[x]))
    console.log(`${k}: top±${d[0]} left±${d[1]} w±${d[2]} h±${d[3]} ${Math.max(...d) <= 2 ? '✅' : '⚠️'}`)
  }
  await browser.close()
})()
