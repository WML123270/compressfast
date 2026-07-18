// Self-cleanup Service Worker — clears old cache and unregisters
// After this SW activates on all clients, it removes itself.
// The next deploy will restore a fresh SW.

const OLD_CACHES = ['png-compressor-v4', 'png-compressor-v5']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete all old caches
      const keys = await caches.keys()
      for (const key of [...keys, ...OLD_CACHES]) {
        try { await caches.delete(key) } catch {}
      }
      // Unregister itself on all clients
      const clients = await self.clients.matchAll()
      for (const client of clients) {
        client.postMessage({ type: 'SW_UNREGISTER' })
      }
      // Also unregister globally
      await self.registration.unregister()
    })()
  )
})

// Let all fetch requests pass through without caching
self.addEventListener('fetch', (event) => {
  // Do nothing — let browser handle normally
})
