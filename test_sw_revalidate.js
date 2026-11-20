// SWREVAL — the page downloads once per deploy, not on every start (2026-11-19, her "Yes, start step 1";
// REPORT_phone_battery_2026-11-09.md step 1). sw.js asks the server on every load with {cache:'no-cache'} (a 304 when
// nothing changed) instead of {cache:'no-store'} (the whole 2.4 MB every time), and rewrites the offline copy only when
// the ETag changed. Runs the real sw.js against a fake fetch + cache.
const fs = require("fs"), path = require("path");
const dir = process.argv[2] || __dirname;
const sw = fs.readFileSync(path.join(dir, "sw.js"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x !== undefined ? "  → " + JSON.stringify(x) : "")); } };

console.log("sw.js source");
ok("SWREVAL block present", /\/\/ SWREVAL_START[\s\S]*\/\/ SWREVAL_END/.test(sw));
ok("no fetch bypasses the HTTP cache any more ('no-store' gone)", !/no-store/.test(sw.replace(/\/\/[^\n]*/g, "")));
ok("the fetch option is cache:'no-cache'", /const SW_FETCH = \{ cache: 'no-cache' \};/.test(sw));
ok("all three network fetches (page, family-config.js, lazy files) use it", (sw.match(/fetch\(req, SW_FETCH\)/g) || []).length === 3 && !/fetch\(req, \{/.test(sw));
ok("pictures and other files still pass straight to the browser", /if \(!isDoc\) return;/.test(sw));

function hdr(etag) { return { get: k => (k === "ETag" ? etag : null) }; }
function resp(body, etag, okFlag) {
  const r = { ok: okFlag !== false, body: { text: body, cancelled: false, cancel() { this.cancelled = true; } }, headers: hdr(etag) };
  r.clone = () => { const c = resp(body, etag, okFlag); r.clones.push(c); return c; }; r.clones = [];
  return r;
}
function mkSW() {
  const store = {}, puts = [], fetches = []; let handler = null;
  const net = { up: true, body: "PAGE-A", etag: 'W/"a"' };
  const caches = { open: async () => ({ put: async (k, v) => { store[k] = v; puts.push(k); }, match: async k => store[k] }), keys: async () => [], delete: async () => {} };
  const self = { addEventListener: (t, f) => { if (t === "fetch") handler = f; }, skipWaiting() {}, clients: { claim: async () => {} } };
  const fetchFn = async (req, opt) => { fetches.push(opt); if (!net.up) throw new Error("offline"); return resp(net.body, net.etag); };
  new Function("self", "caches", "fetch", "URL", "Response", sw)(self, caches, fetchFn, URL, { error: () => "ERR" });
  const go = async (url, extra) => {
    let p = null;
    handler({ request: Object.assign({ url, method: "GET", mode: "navigate", destination: "document" }, extra || {}), respondWith: x => { p = x; } });
    const r = p ? await p : "(browser)";
    await new Promise(res => setTimeout(res, 0));   // let the background offline-copy write finish
    return r;
  };
  return { net, store, puts, fetches, go };
}

(async () => {
  const PAGE = "https://adrienne-debug.github.io/howe-academy/";
  console.log("the page");
  {
    const s = mkSW();
    const r1 = await s.go(PAGE);
    ok("online: the page comes from the network", r1 && r1.body.text === "PAGE-A", r1 && r1.body.text);
    ok("it asks with cache:'no-cache' (revalidate — never stale, a 304 when unchanged)", s.fetches[0] && s.fetches[0].cache === "no-cache", s.fetches[0]);
    ok("first load: an offline copy is kept", s.store["ha-index-fallback"] && s.store["ha-index-fallback"].body.text === "PAGE-A");
    const r2 = await s.go(PAGE);
    ok("same deploy again: the page is still served", r2 && r2.body.text === "PAGE-A");
    ok("same deploy again: the offline copy is NOT rewritten", s.puts.length === 1, s.puts);
    ok("same deploy again: the unused copy's body is let go", r2.clones[0] && r2.clones[0].body.cancelled === true);
    s.net.body = "PAGE-B"; s.net.etag = 'W/"b"';
    const r3 = await s.go(PAGE);
    ok("after a deploy: the new page is served at once", r3 && r3.body.text === "PAGE-B");
    ok("after a deploy: the offline copy becomes the new page", s.puts.length === 2 && s.store["ha-index-fallback"].body.text === "PAGE-B", s.puts);
    s.net.up = false;
    const r4 = await s.go(PAGE);
    ok("offline: the last deploy's copy is served", r4 && r4.body.text === "PAGE-B", r4);
  }
  {
    const s = mkSW(); s.net.etag = null;
    await s.go(PAGE); await s.go(PAGE);
    ok("a server that sends no ETag: the copy is kept every time (today's behaviour)", s.puts.length === 2, s.puts);
  }
  {
    const s = mkSW(); s.net.up = false;
    const r = await s.go(PAGE);
    ok("offline with no copy yet: a network error, as before", r === "ERR", r);
  }

  console.log("family-config.js and the lazy files");
  {
    const s = mkSW(); s.net.body = "CFG";
    const extra = { mode: "no-cors", destination: "script" };
    await s.go("https://adrienne-debug.github.io/howe-academy-dewalt/family-config.js", extra);
    await s.go("https://adrienne-debug.github.io/howe-academy-dewalt/family-config.js?v=2", extra);
    ok("family-config.js: revalidated, kept once per deploy", s.fetches.every(o => o && o.cache === "no-cache") && s.puts.filter(k => k === "ha-family-config-fallback").length === 1, s.puts);
    s.net.body = "GAMES";
    await s.go("https://adrienne-debug.github.io/howe-academy/games.js?v=1", extra);
    await s.go("https://adrienne-debug.github.io/howe-academy/games.js?v=1", extra);
    ok("games.js: revalidated, kept once per deploy", s.puts.filter(k => k === "ha-lazy-games").length === 1, s.puts);
    s.net.etag = 'W/"c"';
    await s.go("https://adrienne-debug.github.io/howe-academy/games.js?v=2", extra);
    ok("games.js: a new deploy replaces the kept copy", s.puts.filter(k => k === "ha-lazy-games").length === 2);
    const before = s.fetches.length;
    const r = await s.go("https://adrienne-debug.github.io/howe-academy/notebooks.js", extra);
    ok("other scripts still pass straight through (the service worker never fetches them)", r === "(browser)" && s.fetches.length === before, r);
  }

  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})();
