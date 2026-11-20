// Howe Academy service worker — NETWORK-FIRST for the app HTML.
// Purpose: guarantee every load gets the latest deployed code with ZERO user action.
// The whole app is one index.html; if the browser/PWA ever serves a stale cached copy the
// user is stuck on old code (the pain we kept hitting). With this SW active, the page is
// always fetched fresh from the network when online; the cached copy is ONLY an offline
// fallback. Everything else (Firebase, etc.) passes straight through — we never cache it.
const CACHE = 'ha-shell-v1';
const FALLBACK = 'ha-index-fallback';
const CFG_FALLBACK = 'ha-family-config-fallback';   // FAMCFG_GUARD

// SWREVAL_START — the page downloads once per deploy, not on every start (2026-11-19, her "Yes, start step 1";
// REPORT_phone_battery_2026-11-09.md step 1, DESIGN_family_setup_2026-11-19.md §12.4 A1).
// {cache:'no-cache'} still asks GitHub Pages on EVERY load, so a deploy is seen at once (exactly as fresh as 'no-store'),
// but it sends the ETag of the copy the browser already has: an unchanged page comes back as an empty "304 not modified"
// (measured live 11/19: 0 bytes) instead of the whole 2.4 MB again. 'no-store' re-downloaded the page and each lazy file
// on every start (~42 starts a day in the Howe house). The offline copy is rewritten only when the ETag changed, so the
// device's storage is written once per deploy, not once per start.
const SW_FETCH = { cache: 'no-cache' };
function swKeep(key, fresh) {
  const copy = fresh.clone();   // cloned now, before the page starts reading the body
  return caches.open(CACHE).then(async (c) => {
    const tag = fresh.headers && fresh.headers.get ? fresh.headers.get('ETag') : null;
    const old = tag ? await c.match(key) : null;
    if (old && old.headers && old.headers.get && old.headers.get('ETag') === tag) {   // same deploy: the kept copy is already this one
      try { if (copy.body && copy.body.cancel) copy.body.cancel(); } catch (e) {}
      return;
    }
    return c.put(key, copy);
  }).catch(() => {});   // a full device keeps its older offline copy; the page itself is already on its way
}
// SWREVAL_END

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
        const fresh = await fetch(req, SW_FETCH);
        if (fresh && fresh.ok) swKeep(CFG_FALLBACK, fresh);
        return fresh;
      } catch (err) {
        const cached = await caches.open(CACHE).then(c => c.match(CFG_FALLBACK));
        return cached || Response.error();
      }
    })());
    return;
  }
  // LAZYSPLIT (2026-11-08): the areas that moved out of index.html (classes.js = the class platform, games.js = the practice games, env.js = the Envirothon site + class link) used to ride inside
  // the cached page; keep an offline copy of each one too (network-first, same as the page). Keyed by name, so the
  // GitHub Pages cache-bust query (?v=…) never piles up copies.
  const lazyM = req.method === 'GET' && /\/(classes|games|env|geo|house|us|us_pics_1|us_pics_2)\.js$/.exec(new URL(req.url).pathname);   // GEOPATH (2026-11-11): + geo.js, the Geography Path's pictures; HOUSE step 3 (2026-11-16): + house.js, the Household plan preview; USPATH (2026-11-17): + us.js, us_pics_1.js, us_pics_2.js
  if (lazyM) {
    const key = 'ha-lazy-' + lazyM[1];
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, SW_FETCH);
        if (fresh && fresh.ok) swKeep(key, fresh);
        return fresh;
      } catch (err) {
        const cached = await caches.open(CACHE).then(c => c.match(key));
        return cached || Response.error();
      }
    })());
    return;
  }
  if (!isDoc) return; // everything else: let the browser handle it normally (no caching)
  e.respondWith((async () => {
    try {
      // SW_FETCH = revalidate with the server on every load (SWREVAL) -> always the freshest deploy, but an unchanged page is a 304.
      const fresh = await fetch(req, SW_FETCH);
      swKeep(FALLBACK, fresh);                  // keep a copy purely for offline (rewritten only when the deploy changed)
      return fresh;
    } catch (err) {
      const cached = await caches.open(CACHE).then(c => c.match(FALLBACK));
      return cached || Response.error();        // offline: serve last-known-good
    }
  })());
});
