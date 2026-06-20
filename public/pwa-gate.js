/* PWA-Domain-Gate
   --------------------------------------------------------------------------
   Die App ist NUR installierbar, wenn der Nutzer von einer erlaubten Domain
   auf sie navigiert hat. Technisch heißt das: Manifest-Link und Service-Worker
   werden ausschließlich dann eingebunden, wenn document.referrer zur erlaubten
   Domain gehört. Ohne Manifest + Service Worker bietet der Browser keine
   Installation an.

   Die Freigabe wird in sessionStorage gemerkt, damit sie über die Navigation
   innerhalb der SPA hinweg erhalten bleibt (dort ist der Referrer dann die
   App selbst).
*/
(function () {
  'use strict'

  // Erlaubte Quell-Domains. Beliebig erweiterbar.
  var ALLOWED_HOSTS = ['robertjamesherold.com', 'www.robertjamesherold.com', 'localhost', '127.0.0.1']
  var GRANT_KEY = 'pwa-install-granted'

  function refererAllowed() {
    try {
      if (!document.referrer) return false
      var host = new URL(document.referrer).hostname.toLowerCase()
      return ALLOWED_HOSTS.indexOf(host) !== -1
    } catch (e) {
      return false
    }
  }

  // Bereits in dieser Session freigegeben?
  var granted = false
  try {
    granted = sessionStorage.getItem(GRANT_KEY) === '1'
  } catch (e) {}

  // Frische Navigation von erlaubter Domain → Freigabe setzen.
  if (!granted && refererAllowed()) {
    granted = true
    try {
      sessionStorage.setItem(GRANT_KEY, '1')
    } catch (e) {}
  }

  if (!granted) {
    // Keine Freigabe: kein Manifest, kein Service Worker → nicht installierbar.
    return
  }

  // 1) Manifest dynamisch einbinden.
  if (!document.querySelector('link[rel="manifest"]')) {
    var link = document.createElement('link')
    link.rel = 'manifest'
    link.href = '/manifest.webmanifest'
    document.head.appendChild(link)
  }

  // 2) Service Worker registrieren (Voraussetzung für Installierbarkeit).
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {})
    })
  }
})()
