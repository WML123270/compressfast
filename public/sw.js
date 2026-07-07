// 极速压图 Service Worker v4
const CACHE = 'png-compressor-v4'
const OFFLINE_PAGE = '/en'

// 预缓存关键资源
const PRE_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // 预缓存静态资源 + 离线 HTML 页面
      Promise.allSettled([
        ...PRE_CACHE.map(url => cache.add(url).catch(() => {})),
        // 缓存英文和中文首页的 HTML
        fetch(OFFLINE_PAGE).then(res => {
          if (res.ok) cache.put(OFFLINE_PAGE, res)
        }).catch(() => {}),
        fetch('/zh').then(res => {
          if (res.ok) cache.put('/zh', res)
        }).catch(() => {}),
      ])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // 跳过非 GET 请求
  if (request.method !== 'GET') return

  // 跳过 chrome-extension 等非 http 请求
  if (!request.url.startsWith('http')) return

  // Web Worker 文件不缓存（更新后需要立即生效）
  if (request.url.includes('worker')) return

  // API 请求不缓存
  if (request.url.includes('/api/')) return

  // HTML 导航请求：网络优先，失败时回退到缓存
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // 缓存最新版本
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, clone))
          }
          return res
        })
        .catch(() => {
          // 网络不可用，尝试返回缓存的页面
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_PAGE)
          })
        })
    )
    return
  }

  // 静态资源：Cache-First（缓存优先）
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    request.url.includes('/_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // 其他请求：Network-First（网络优先，失败回退缓存）
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request))
  )
})
