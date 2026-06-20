/* Service Worker für die PWA.
   Wird nur registriert, wenn der Nutzer von einer erlaubten Domain kommt
   (siehe public/pwa-gate.js). Bietet einen App-Shell-Cache für Offline-Start. */
const CACHE = 'rjh-pwa-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Nur GET wird gecached; alles andere (z. B. /api/*) geht direkt ins Netz.
  if (request.method !== 'GET') return

  // SPA-Navigationen: Network-first mit Fallback auf den App-Shell (Offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  // Übrige GET-Requests: Cache-first, sonst Netz und in den Cache legen.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
