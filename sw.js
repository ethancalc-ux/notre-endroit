/* ======================================================================
   sw.js — Service Worker
   ======================================================================
   Rend le site installable sur iPhone/Android et permet une ouverture
   rapide même avec une connexion faible. Tu n'as normalement pas besoin
   d'y toucher.

   Si tu changes beaucoup de fichiers d'un coup et que le site semble
   "coincé" sur une ancienne version, augmente juste le numéro de
   CACHE_NAME ci-dessous (ex: 'v2' → 'v3').
   ====================================================================== */

const CACHE_NAME = 'notre-endroit-v1';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Stratégie : réseau d'abord (contenu toujours à jour), secours sur le
   cache si hors-ligne. Les appels vers d'autres domaines (météo,
   YouTube, Spotify…) ne sont pas mis en cache. */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
