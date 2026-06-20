/* PWA-Domain-Gate
   --------------------------------------------------------------------------
   Die App ist NUR installierbar, wenn der Nutzer bewusst über den Installieren-
   Link der Portfolio-Seite gekommen ist. Technisch heißt das: Manifest-Link und
   Service-Worker werden ausschließlich dann eingebunden, wenn die Freigabe
   vorliegt. Ohne Manifest + Service Worker bietet der Browser keine Installation.

   Freigabe-Trigger (eines reicht):
     1. ?install=1 in der URL → expliziter Installieren-Link vom Portfolio.
        (Robust: der Referrer wird oft auf die Origin gekürzt oder ganz
        entfernt, der URL-Parameter überlebt die Navigation dagegen sicher.)
     2. document.referrer gehört zu einer erlaubten Domain (Fallback).

   Die Freigabe wird in sessionStorage gemerkt, damit sie über die Navigation
   innerhalb der SPA hinweg erhalten bleibt (dort sind Referrer/Parameter weg).
*/
(function () {
  'use strict'

  // Erlaubte Quell-Domains (nur Hostnamen, ohne Pfad). Der Referrer liefert
  // bei Cross-Origin-Navigation per Default nur die Origin ohne Pfad, daher
  // kann hier nicht auf "/codescanner" eingeschränkt werden.
  var ALLOWED_HOSTS = ['robertjamesherold.com', 'www.robertjamesherold.com']
  var GRANT_KEY = 'pwa-install-granted'

  function installParamPresent() {
    try {
      return new URL(window.location.href).searchParams.get('install') === '1'
    } catch (e) {
      return false
    }
  }

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

  // Frischer Installieren-Aufruf (?install=1) oder Navigation von erlaubter
  // Domain → Freigabe setzen.
  if (!granted && (installParamPresent() || refererAllowed())) {
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
