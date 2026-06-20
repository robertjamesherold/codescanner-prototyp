/* Service Worker für die PWA.
   Wird nur registriert, wenn der Nutzer über den Installieren-Link kommt
   (siehe public/pwa-gate.js). Bietet einen App-Shell-Cache für Offline-Start.

   Caching-Strategie:
   - Navigationen        → network-first, offline Fallback auf den App-Shell.
   - /assets/* (gehasht) → cache-first; diese Dateien sind durch ihren Hash
                           unveränderlich, dürfen also dauerhaft gecached werden.
   - Alles andere (pwa-gate.js, manifest.webmanifest, Icons, …) → network-first.
     Diese haben STABILE Namen und ändern sich zwischen Deploys; cache-first
     würde hier veraltete Versionen ausliefern (u. a. eine alte pwa-gate.js,
     wodurch das Install-Angebot ausbleibt). Offline fallen sie auf den Cache. */
const CACHE = 'rjh-pwa-v2'
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

/** Antwort in den Laufzeit-Cache legen (nur erfolgreiche, gleiche-Origin-GETs). */
const putInCache = (request, response) => {
  if (response && response.ok && response.type === 'basic') {
    const copy = response.clone()
    caches.open(CACHE).then((cache) => cache.put(request, copy))
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Nur GET wird behandelt; alles andere (z. B. /api/*) geht direkt ins Netz.
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // SPA-Navigationen: Network-first mit Fallback auf den App-Shell (Offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  // Unveränderliche, gehashte Build-Assets: cache-first.
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((r) => putInCache(request, r))),
    )
    return
  }

  // Alles andere: network-first (frisch halten), offline → Cache.
  event.respondWith(
    fetch(request)
      .then((r) => putInCache(request, r))
      .catch(() => caches.match(request)),
  )
})
