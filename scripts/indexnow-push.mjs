#!/usr/bin/env node
// IndexNow 推送（Bing / Yandex 等）
// 用法: node scripts/indexnow-push.mjs
// 先确保 https://<domain>/<KEY>.txt 可访问（key 文件在 public/ 下）。
// 新增页面后把路径加到 PATHS，再运行一次即可。

const KEY = '4b336b75f627ae82ddab7fde4eef8b13'
const DOMAINS = ['jisuyatu.com', 'compressfast.site']

// 2026-11-24 ~ 11-25 新增页面：5 个目标大小页、3 个小工具、证件照
const PATHS = [
  '/zh/tools/compress-to-20kb', '/en/tools/compress-to-20kb',
  '/zh/tools/compress-to-50kb', '/en/tools/compress-to-50kb',
  '/zh/tools/compress-to-100kb', '/en/tools/compress-to-100kb',
  '/zh/tools/compress-to-200kb', '/en/tools/compress-to-200kb',
  '/zh/tools/compress-to-500kb', '/en/tools/compress-to-500kb',
  '/zh/tools/blur-image', '/en/tools/blur-image',
  '/zh/tools/png-to-ico', '/en/tools/png-to-ico',
  '/zh/tools/image-to-base64', '/en/tools/image-to-base64',
  '/zh/tools/id-photo', '/en/tools/id-photo',
  '/zh/tools/split-image', '/en/tools/split-image',
  // 2026-11-27 新增：证件照尺寸大全指南
  '/zh/guides/id-photo-sizes', '/en/guides/id-photo-sizes',
]

const dry = process.env.INDEXNOW_DRY === '1'
// 可选：只推某个域名（例如海外站还没部署新页面时）
const domains = process.env.INDEXNOW_DOMAIN ? [process.env.INDEXNOW_DOMAIN] : DOMAINS

for (const domain of domains) {
  const keyLocation = `https://${domain}/${KEY}.txt`
  const urlList = PATHS.map((p) => `https://${domain}${p}`)
  const body = { host: domain, key: KEY, keyLocation, urlList }

  if (dry) {
    console.log(`[dry] ${domain}: ${urlList.length} URLs, keyLocation=${keyLocation}`)
    continue
  }

  // 先确认 key 文件在线，避免白推
  try {
    const k = await fetch(keyLocation, { cache: 'no-store' })
    const text = (await k.text()).trim()
    if (!k.ok || text !== KEY) {
      console.log(`SKIP ${domain}: key file ${k.status}, body=${JSON.stringify(text.slice(0, 40))}`)
      continue
    }
  } catch (e) {
    console.log(`SKIP ${domain}: key file fetch failed: ${e.message}`)
    continue
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    console.log(`${domain}: HTTP ${res.status} ${text.slice(0, 200)} (${urlList.length} URLs)`)
  } catch (e) {
    console.log(`${domain}: FAILED ${e.message}`)
  }
}
