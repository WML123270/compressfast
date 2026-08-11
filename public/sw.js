// CompressFast Service Worker v7
// Caches static assets for faster repeat visits and basic offline support.
const CACHE = 'png-compressor-v7'

// Pre-cache app shell assets
const PRE_CACHE = [
  '/',
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

  // Skip non-GET and non-http(s)
  if (request.method !== 'GET') return
  if (!request.url.startsWith('http')) return

  // Never cache: API calls, admin
  if (request.url.includes('/api/')) return
  if (request.url.includes('/admin')) return

  // For HTML navigation: network-first with offline fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh page
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() => {
          // Offline — serve cached version
          return caches.match(request) || caches.match('/')
        })
    )
    return
  }

  // Static assets: cache-first (these are versioned by Next.js)
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
