// CALRELAY_START — the calendar relay (Stage 1, slice 1 of "Calendar Sync — Stage 1 Plan", her yes 2026-10-25).
// One small Cloudflare Worker shared by every family app (Howe, DeWalt, Burris). Two jobs:
//
//   IN  — GET /in?url=<Apple or Google share link>
//         Browsers won't load an iCloud "Public Calendar" link or a Google "Secret address in iCal format"
//         inside a web page (no CORS headers), so the app asks the relay, which fetches it and hands the
//         text back with CORS. Only Apple and Google calendar addresses are fetched — nothing else.
//         Nothing is stored; the app draws the events and saves nothing about them.
//
//   OUT — PUT    /out/<feedId>   body = the family's .ics text, header Authorization: Bearer <writeKey>
//         GET    /out/<feedId>.ics   → the phone's subscribed calendar
//         DELETE /out/<feedId>   (Reset) same header
//         The app hands the relay a fresh copy whenever a ticked kind of event is saved. The first PUT for
//         a feedId claims it: the relay keeps only a SHA-256 of the write key, and every later PUT/DELETE
//         must carry the same key. The relay holds no passwords and no database keys.
//
// Storage: one KV namespace bound as FEEDS. Keys: "feed:<id>" = ics text, "key:<id>" = key hash.
// Settings (wrangler.toml [vars]): ALLOWED_ORIGINS = comma list of app origins allowed to call it.

const MAX_IN_BYTES = 3 * 1024 * 1024;    // a big family calendar is well under 1 MB; refuse anything silly
const MAX_OUT_BYTES = 1024 * 1024;
const IN_TIMEOUT_MS = 10000;
const IN_CACHE_S = 300;                    // the app checks about every 15 min; Apple/Google get asked at most every 5
const FEED_ID_RE = /^[A-Za-z0-9_-]{32,64}$/;
const KEY_RE = /^[A-Za-z0-9_-]{32,128}$/;

// Apple: https://p<NN>-caldav.icloud.com/published/2/<token>   (webcal:// in the share sheet)
// Google: https://calendar.google.com/calendar/ical/<id>/<private-…|public>/basic.ics
function allowedSource(raw) {
  let s = String(raw || "").trim();
  if (/^webcal:\/\//i.test(s)) s = "https://" + s.slice(9);
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  const host = u.hostname.toLowerCase();
  if (/^p\d{1,3}-caldav\.icloud\.com$/.test(host) && u.pathname.startsWith("/published/")) return u.toString();
  if (host === "calendar.google.com" && /^\/calendar\/ical\/[^/]+\/[^/]+\/basic\.ics$/.test(u.pathname)) return u.toString();
  return null;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String((env && env.ALLOWED_ORIGINS) || "").split(",").map(function (o) { return o.trim(); }).filter(Boolean);
  if (!origin || allowed.indexOf(origin) < 0) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function reply(status, body, extra, cors) {
  return new Response(body, { status: status, headers: Object.assign({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, cors || {}, extra || {}) });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
}

function bearer(request) {
  const m = /^Bearer\s+(\S+)$/.exec(request.headers.get("Authorization") || "");
  return m && KEY_RE.test(m[1]) ? m[1] : null;
}

function looksLikeIcs(text) { return /^\s*BEGIN:VCALENDAR/.test(text) && /END:VCALENDAR\s*$/.test(text); }

// Read a body, refusing it once it passes `max` bytes (a Content-Length can lie or be missing).
async function readCapped(stream, max) {
  if (!stream) return "";
  const reader = stream.getReader(), parts = [];
  let n = 0;
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    n += r.value.byteLength;
    if (n > max) { try { await reader.cancel(); } catch (e) {} return null; }
    parts.push(r.value);
  }
  const all = new Uint8Array(n); let o = 0;
  parts.forEach(function (p) { all.set(p, o); o += p.byteLength; });
  return new TextDecoder().decode(all);
}

async function handleIn(request, env, cors) {
  if (!cors["Access-Control-Allow-Origin"]) return reply(403, "This relay only answers the family apps.");
  const src = allowedSource(new URL(request.url).searchParams.get("url"));
  if (!src) return reply(400, "That isn't an Apple Public Calendar link or a Google secret iCal address.", null, cors);
  let res;
  try {
    res = await fetch(src, { redirect: "follow", signal: AbortSignal.timeout(IN_TIMEOUT_MS), cf: { cacheTtl: IN_CACHE_S, cacheEverything: true } });
  } catch (e) {
    return reply(502, "Couldn't reach the calendar right now.", null, cors);
  }
  // iCloud often redirects a published link to another pNN-caldav host; wherever it lands must still be Apple/Google.
  if (res.url && !/^https:\/\/(p\d{1,3}-caldav\.icloud\.com|calendar\.google\.com)\//i.test(res.url)) return reply(502, "The calendar link went somewhere unexpected.", null, cors);
  if (res.status === 404 || res.status === 403 || res.status === 401) return reply(404, "The calendar link no longer works (it may have been reset or unshared).", null, cors);
  if (!res.ok) return reply(502, "The calendar answered with an error (" + res.status + ").", null, cors);
  const text = await readCapped(res.body, MAX_IN_BYTES);
  if (text === null) return reply(413, "That calendar is too big to bring in.", null, cors);
  if (!looksLikeIcs(text)) return reply(502, "That link didn't return a calendar.", null, cors);
  return reply(200, text, { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=60" }, cors);
}

async function handleOut(request, env, cors, id, isIcs) {
  if (!env.FEEDS) return reply(500, "Relay storage isn't set up.", null, cors);
  const method = request.method;
  if (method === "GET" || method === "HEAD") {
    if (!isIcs) return reply(404, "Not found.", null, cors);
    const ics = await env.FEEDS.get("feed:" + id);
    if (ics == null) return reply(404, "No calendar here.", null, cors);
    return reply(200, method === "HEAD" ? null : ics, { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-cache" }, cors);
  }
  if (isIcs) return reply(405, "Send the copy to /out/<id> without .ics.", null, cors);
  if (!cors["Access-Control-Allow-Origin"]) return reply(403, "This relay only answers the family apps.");
  const key = bearer(request);
  if (!key) return reply(401, "Missing or malformed write key.", null, cors);
  const hash = await sha256(key);
  const have = await env.FEEDS.get("key:" + id);
  if (have != null && have !== hash) return reply(403, "Wrong write key for this calendar.", null, cors);
  if (method === "DELETE") {
    if (have == null) return reply(404, "No calendar here.", null, cors);
    await env.FEEDS.delete("feed:" + id);
    await env.FEEDS.delete("key:" + id);
    return reply(200, "Removed.", null, cors);
  }
  if (method === "PUT") {
    const text = await readCapped(request.body, MAX_OUT_BYTES);
    if (text === null) return reply(413, "Calendar copy too big.", null, cors);
    if (!looksLikeIcs(text)) return reply(400, "That isn't a calendar.", null, cors);
    if (have == null) await env.FEEDS.put("key:" + id, hash);
    await env.FEEDS.put("feed:" + id, text);
    return reply(200, "Saved.", null, cors);
  }
  return reply(405, "Method not allowed.", { "Allow": "GET, PUT, DELETE" }, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return reply(cors["Access-Control-Allow-Origin"] ? 204 : 403, null, null, cors);
    const path = new URL(request.url).pathname;
    if (path === "/in") return request.method === "GET" ? handleIn(request, env, cors) : reply(405, "Method not allowed.", null, cors);
    const m = /^\/out\/([^/]+?)(\.ics)?$/.exec(path);
    if (m) {
      if (!FEED_ID_RE.test(m[1])) return reply(404, "Not found.", null, cors);
      return handleOut(request, env, cors, m[1], !!m[2]);
    }
    return reply(404, "Not found.", null, cors);
  }
};

export const _internal = { allowedSource, looksLikeIcs, sha256 };
// CALRELAY_END
