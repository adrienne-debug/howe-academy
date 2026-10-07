// Howe Academy service worker — NETWORK-FIRST for the app HTML.
// Purpose: guarantee every load gets the latest deployed code with ZERO user action.
// The whole app is one index.html; if the browser/PWA ever serves a stale cached copy the
// user is stuck on old code (the pain we kept hitting). With this SW active, the page is
// always fetched fresh from the network when online; the cached copy is ONLY an offline
// fallback. Everything else (Firebase, etc.) passes straight through — we never cache it.
const CACHE = 'ha-shell-v1';
const FALLBACK = 'ha-index-fallback';
const CFG_FALLBACK = 'ha-family-config-fallback';   // FAMCFG_GUARD

self.addEventListener('install', (e) => {
  // Take over as soon as installed — don't wait for old tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.clients.claim();               // control existing pages immediately
    const keys = await caches.keys();          // drop any old cache buckets
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Only take responsibility for the top-level document (the app HTML). Network-first.
  const isDoc = req.mode === 'navigate' || (req.method === 'GET' && req.destination === 'document');
  // FAMCFG_GUARD (2026-10-06): family-config.js says WHICH family this site is. Offline, the page came from this cache but
  // the config did not → the app fell back to the Howe family. Keep an offline copy of it too (network-first, same as the page).
  const isCfg = req.method === 'GET' && /\/family-config\.js$/.test(new URL(req.url).pathname);
  if (isCfg) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        if (fresh && fresh.ok) { const cache = await caches.open(CACHE); cache.put(CFG_FALLBACK, fresh.clone()); }
        return fresh;
      } catch (err) {
        const cached = await caches.open(CACHE).then(c => c.match(CFG_FALLBACK));
        return cached || Response.error();
      }
    })());
    return;
  }
  if (!isDoc) return; // everything else: let the browser handle it normally (no caching)
  e.respondWith((async () => {
    try {
      // {cache:'no-store'} = bypass the HTTP cache entirely -> always the freshest deploy.
      const fresh = await fetch(req, { cache: 'no-store' });
      const cache = await caches.open(CACHE);
      cache.put(FALLBACK, fresh.clone());       // keep a copy purely for offline
      return fresh;
    } catch (err) {
      const cached = await caches.open(CACHE).then(c => c.match(FALLBACK));
      return cached || Response.error();        // offline: serve last-known-good
    }
  })());
});
