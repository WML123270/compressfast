// CompressFast Service Worker v6
const CACHE = 'png-compressor-v6'

// Only pre-cache static assets, NOT HTML pages
const PRE_CACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRE_CACHE.map(url => cache.add(url).catch(() => {})))
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

  // Skip non-GET and non-http
  if (request.method !== 'GET') return
  if (!request.url.startsWith('http')) return

  // Never cache: API, workers, HTML navigation
  if (request.url.includes('/api/')) return
  if (request.url.includes('worker')) return
  if (request.mode === 'navigate' || request.destination === 'document') return

  // Cache static assets only
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    request.url.includes('/_next/static')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((res) => {
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
})
