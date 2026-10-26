/*
 * Node tests for the CALENDAR RELAY (relay/worker.js) — Calendar Sync Stage 1, slice 1, her yes 2026-10-25.
 *
 *   · IN fetches ONLY Apple "Public Calendar" and Google secret-iCal addresses, and only for the family apps
 *   · OUT: the first copy claims a feed; every later write needs the same key; the relay keeps a hash, never the key
 *   · phones read the .ics with no key; Reset (DELETE) removes the copy and frees the id
 *
 * Offline: upstream fetch is faked and storage is an in-memory stand-in for Cloudflare KV.
 *   run:  node test_calendar_relay.js
 */
const path = require("path"), { pathToFileURL } = require("url");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const APP = "https://adrienne-debug.github.io";
const ICS = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:a1\r\nDTSTART;VALUE=DATE:20261101\r\nSUMMARY:Field trip\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
const APPLE = "webcal://p42-caldav.icloud.com/published/2/MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI";
const GOOGLE = "https://calendar.google.com/calendar/ical/family%40gmail.com/private-0123456789abcdef/basic.ics";
const FEED = "f".repeat(8) + "A1b2C3d4E5f6G7h8I9j0K1l2";          // 32 chars
const KEY = "k".repeat(10) + "Zy9Xw8Vu7Ts6Rq5Po4Nm3Lk2";           // 34 chars
const KEY2 = "q".repeat(40);

function kv() {
  const m = new Map();
  return { m, async get(k) { return m.has(k) ? m.get(k) : null; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); } };
}
function req(method, url, opts) {
  opts = opts || {};
  const h = {};
  if (opts.origin !== null) h.Origin = opts.origin || APP;
  if (opts.key) h.Authorization = "Bearer " + opts.key;
  return new Request("https://relay.example.workers.dev" + url, { method, headers: h, body: opts.body });
}

(async function () {
  const mod = await import(pathToFileURL(path.join(__dirname, "relay", "worker.js")).href);
  const worker = mod.default, I = mod._internal;
  const env = { FEEDS: kv(), ALLOWED_ORIGINS: APP + ", http://localhost:8774" };

  console.log("allowed sources");
  ok("Apple webcal link → https", I.allowedSource(APPLE) === APPLE.replace("webcal://", "https://"));
  ok("Google secret address", I.allowedSource(GOOGLE) === GOOGLE);
  ok("Google public holidays address", !!I.allowedSource("https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics"));
  [
    "http://p42-caldav.icloud.com/published/2/abc",
    "https://p42-caldav.icloud.com.evil.com/published/2/abc",
    "https://evil.com/p42-caldav.icloud.com/published/2/abc",
    "https://p42-caldav.icloud.com/private/abc",
    "https://www.icloud.com/published/2/abc",
    "https://user:pw@p42-caldav.icloud.com/published/2/abc",
    "https://p42-caldav.icloud.com:8443/published/2/abc",
    "https://calendar.google.com/calendar/u/0/r",
    "https://calendar.google.com/calendar/ical/x/private-y/basic.ics/../../../evil",
    "https://docs.google.com/calendar/ical/x/y/basic.ics",
    "file:///etc/passwd", "", null, "not a url"
  ].forEach(function (u) { ok("refuses " + u, I.allowedSource(u) === null); });

  console.log("IN");
  let asked = [];
  let upstream = function () { return new Response(ICS, { status: 200 }); };
  globalThis.fetch = async function (u) { asked.push(String(u)); return upstream(u); };

  let r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE), { origin: null }), env);
  ok("no Origin → 403 and nothing fetched", r.status === 403 && asked.length === 0, r.status);
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE), { origin: "https://evil.example" }), env);
  ok("other site → 403 and nothing fetched", r.status === 403 && asked.length === 0, r.status);
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent("https://example.com/cal.ics")), env);
  ok("non-Apple/Google link → 400 and nothing fetched", r.status === 400 && asked.length === 0, r.status);
  ok("…with CORS so the app can show the message", r.headers.get("Access-Control-Allow-Origin") === APP);
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("Apple link → 200 calendar", r.status === 200 && (await r.text()) === ICS, r.status);
  ok("fetched the https form of the webcal link", asked[0] === APPLE.replace("webcal://", "https://"), asked);
  ok("calendar content type + CORS", /text\/calendar/.test(r.headers.get("Content-Type")) && r.headers.get("Access-Control-Allow-Origin") === APP);
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(GOOGLE), { origin: "http://localhost:8774" }), env);
  ok("Google link from the local test server → 200", r.status === 200, r.status);
  ok("nothing stored by IN", env.FEEDS.m.size === 0);

  upstream = function () { return new Response("gone", { status: 404 }); };
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("unshared/reset link → 404 with a plain message", r.status === 404 && /no longer works/.test(await r.text()), r.status);
  upstream = function () { return new Response("<html>sign in</html>", { status: 200 }); };
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("non-calendar answer → 502", r.status === 502, r.status);
  upstream = function () { return new Response("BEGIN:VCALENDAR\r\n" + "X".repeat(3 * 1024 * 1024 + 10) + "\r\nEND:VCALENDAR", { status: 200 }); };
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("oversized calendar → 413", r.status === 413, r.status);
  upstream = function () { const x = new Response(ICS, { status: 200 }); Object.defineProperty(x, "url", { value: "https://evil.example/cal.ics" }); return x; };
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("redirected off Apple/Google → 502", r.status === 502, r.status);
  upstream = function () { const x = new Response(ICS, { status: 200 }); Object.defineProperty(x, "url", { value: "https://p63-caldav.icloud.com/published/2/abc" }); return x; };
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("redirected to another iCloud server → 200", r.status === 200, r.status);
  upstream = function () { throw new Error("network down"); };
  r = await worker.fetch(req("GET", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("network failure → 502", r.status === 502, r.status);
  r = await worker.fetch(req("POST", "/in?url=" + encodeURIComponent(APPLE)), env);
  ok("POST /in → 405", r.status === 405, r.status);

  console.log("preflight");
  r = await worker.fetch(req("OPTIONS", "/out/" + FEED), env);
  ok("app origin → 204 + methods", r.status === 204 && /PUT/.test(r.headers.get("Access-Control-Allow-Methods")), r.status);
  r = await worker.fetch(req("OPTIONS", "/out/" + FEED, { origin: "https://evil.example" }), env);
  ok("other origin → 403, no CORS", r.status === 403 && !r.headers.get("Access-Control-Allow-Origin"), r.status);

  console.log("OUT");
  asked = [];
  r = await worker.fetch(req("GET", "/out/short.ics", { origin: null }), env);
  ok("too-short feed id → 404", r.status === 404, r.status);
  r = await worker.fetch(req("GET", "/out/" + FEED + ".ics", { origin: null }), env);
  ok("phone GET before any copy → 404", r.status === 404, r.status);
  r = await worker.fetch(req("PUT", "/out/" + FEED, { body: ICS }), env);
  ok("PUT without key → 401", r.status === 401, r.status);
  r = await worker.fetch(req("PUT", "/out/" + FEED, { key: KEY, body: ICS, origin: "https://evil.example" }), env);
  ok("PUT from another site → 403", r.status === 403 && !env.FEEDS.m.size, r.status);
  r = await worker.fetch(req("PUT", "/out/" + FEED, { key: KEY, body: "hello" }), env);
  ok("PUT non-calendar → 400, nothing claimed", r.status === 400 && !env.FEEDS.m.size, r.status);
  r = await worker.fetch(req("PUT", "/out/" + FEED, { key: KEY, body: ICS }), env);
  ok("first PUT claims the feed → 200", r.status === 200, r.status);
  ok("relay keeps a hash, never the key", env.FEEDS.m.get("key:" + FEED) === await I.sha256(KEY) && ![...env.FEEDS.m.values()].some(function (v) { return String(v).indexOf(KEY) >= 0; }));
  r = await worker.fetch(req("GET", "/out/" + FEED + ".ics", { origin: null }), env);
  ok("phone GET (no key, no Origin) → the calendar", r.status === 200 && (await r.text()) === ICS && /text\/calendar/.test(r.headers.get("Content-Type")), r.status);
  r = await worker.fetch(req("HEAD", "/out/" + FEED + ".ics", { origin: null }), env);
  ok("HEAD → 200", r.status === 200, r.status);
  r = await worker.fetch(req("GET", "/out/" + FEED, { origin: null }), env);
  ok("GET without .ics → 404", r.status === 404, r.status);
  const ICS2 = ICS.replace("Field trip", "Co-op");
  r = await worker.fetch(req("PUT", "/out/" + FEED, { key: KEY2, body: ICS2 }), env);
  ok("PUT with a different key → 403", r.status === 403, r.status);
  ok("…and the copy is unchanged", env.FEEDS.m.get("feed:" + FEED) === ICS);
  r = await worker.fetch(req("PUT", "/out/" + FEED, { key: KEY, body: ICS2 }), env);
  ok("PUT with the same key replaces the copy", r.status === 200 && env.FEEDS.m.get("feed:" + FEED) === ICS2, r.status);
  r = await worker.fetch(req("PUT", "/out/" + FEED, { key: KEY, body: "BEGIN:VCALENDAR\r\n" + "Y".repeat(1024 * 1024) + "\r\nEND:VCALENDAR" }), env);
  ok("oversized copy → 413, old copy kept", r.status === 413 && env.FEEDS.m.get("feed:" + FEED) === ICS2, r.status);
  r = await worker.fetch(req("PUT", "/out/" + FEED + ".ics", { key: KEY, body: ICS }), env);
  ok("PUT to the .ics address → 405", r.status === 405, r.status);
  r = await worker.fetch(req("DELETE", "/out/" + FEED, { key: KEY2 }), env);
  ok("Reset with the wrong key → 403", r.status === 403 && env.FEEDS.m.has("feed:" + FEED), r.status);
  r = await worker.fetch(req("DELETE", "/out/" + FEED, { key: KEY }), env);
  ok("Reset with the right key → 200", r.status === 200 && env.FEEDS.m.size === 0, r.status);
  r = await worker.fetch(req("GET", "/out/" + FEED + ".ics", { origin: null }), env);
  ok("phone GET after Reset → 404", r.status === 404, r.status);
  ok("OUT never fetched anything upstream", asked.length === 0, asked);

  r = await worker.fetch(req("GET", "/anything-else"), env);
  ok("unknown path → 404", r.status === 404, r.status);
  r = await worker.fetch(req("GET", "/out/" + FEED + ".ics", { origin: null }), { ALLOWED_ORIGINS: APP });
  ok("missing storage binding → 500, not a crash", r.status === 500, r.status);

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
