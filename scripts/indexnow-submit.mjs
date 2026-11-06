// IndexNow 批量提交 — 把 sitemap 里所有 URL 推给 Bing/Yandex 等引擎（秒收录，不等爬虫）
// 用法: node scripts/indexnow-submit.mjs
// 前提: 密钥文件已部署到 https://compressfast.site/5d316d21d12b159773cf9133deba14d5.txt
const HOST = 'compressfast.site'
const KEY = '5d316d21d12b159773cf9133deba14d5'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP_URL = `https://${HOST}/sitemap.xml`

// 各引擎端点（api.indexnow.org 会转发给所有参与引擎）
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
]

async function main() {
  console.log('→ 拉取 sitemap:', SITEMAP_URL)
  const res = await fetch(SITEMAP_URL)
  if (!res.ok) throw new Error(`sitemap 请求失败: ${res.status}`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  console.log(`→ 共 ${urls.length} 个 URL`)

  // 过滤掉中文路径？不，中英都推。但 IndexNow 只对海外域名有意义，全部推。
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  }

  for (const ep of ENDPOINTS) {
    try {
      const r = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log(`→ ${ep} → ${r.status} ${r.statusText}`)
      if (!r.ok) console.log('   ', await r.text())
    } catch (e) {
      console.log(`→ ${ep} → 失败: ${e.message}`)
    }
  }
  console.log('✓ 完成')
}

main().catch((e) => {
  console.error('✗', e.message)
  process.exit(1)
})
