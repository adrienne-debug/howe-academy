/*
 * 🕰 A code-version reload waits for an idle moment (her report 2026-09-22: a deploy threw her and
 * Ellis out of the workbook on two devices at once, and cut off a drill she was scoring).
 *   run:  node test_cv_reload.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// CVRELOAD_START"), b = src.indexOf("// CVRELOAD_END");
if (a < 0 || b < 0) { console.error("CVRELOAD markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world(o) {
  o = o || {};
  const reloads = [], timers = [], session = {}, logs = [];
  let now = o.now || 1000000;
  const ctx = {
    console: { log: m => logs.push(m) }, CODE_VERSION: 111,
    wbView: o.wbView || null, mastLogMode: !!o.mastLogMode, mastRecState: o.mastRecState || null, mstState: o.mstState || null,
    document: { getElementById: id => (o.dom || {})[id] || null, querySelectorAll: () => (o.overlays || []) },
    sessionStorage: { getItem: k => session[k] || null, setItem: (k, v) => { session[k] = v; } },
    location: { href: "https://x.test/app/", replace: u => reloads.push(u) }, URL,
    setInterval: (fn, ms) => { timers.push([fn, ms]); return timers.length; }, clearInterval: () => { timers.length = 0; },
    Date: { now: () => now }, String, Object,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, reloads, timers, session, logs, call: e => vm.runInContext(e, ctx), tick: ms => { now += ms; }, idle: () => { ctx.wbView = null; ctx.mastLogMode = false; ctx.mstState = null; ctx.mastRecState = null; o.overlays && (o.overlays.length = 0); } };
}
console.log("── idle device: reloads at once, exactly as before ──");
{
  const w = world(); w.call("haCvReloadWhenIdle(222)");
  ok("reloads with the cache-busting query", w.reloads.length === 1 && /_cv=222/.test(w.reloads[0]), w.reloads);
  ok("the loop guard is stamped", w.session.ha_cv_reload === "222");
  ok("no timer left behind", w.timers.length === 0);
}
console.log("\n── busy device: the reload waits ──");
[["workbook open", { wbView: { page: 3 } }], ["drill being scored", { mastLogMode: true }], ["study sitting", { mstState: { i: 1 } }],
 ["recording", { mastRecState: { on: 1 } }], ["viewer open", { dom: { "wb-view": {} } }], ["dialog open", { overlays: [{ style: { display: "flex" } }] }]].forEach(([why, o]) => {
  const w = world(o); w.call("haCvReloadWhenIdle(222)");
  ok(why + " → no reload, a 20 s re-check is scheduled", w.reloads.length === 0 && w.timers.length === 1 && w.timers[0][1] === 20000 && w.logs.some(m => m.indexOf(why) >= 0), { reloads: w.reloads, logs: w.logs });
});
{
  const w = world({ overlays: [{ style: { display: "none" } }] }); w.call("haCvReloadWhenIdle(222)");
  ok("a closed dialog does not count as busy", w.reloads.length === 1);
}
console.log("\n── …and lands the moment the device is idle ──");
{
  const w = world({ wbView: { page: 3 } }); w.call("haCvReloadWhenIdle(222)");
  w.tick(20000); w.timers[0][0]();   // still busy
  ok("still busy on the re-check → still no reload", w.reloads.length === 0);
  w.idle(); w.tick(20000); w.timers[0][0]();
  ok("workbook closed → the next re-check reloads to the pending version", w.reloads.length === 1 && /_cv=222/.test(w.reloads[0]), w.reloads);
}
{
  const w = world({ wbView: { page: 3 } }); w.call("haCvReloadWhenIdle(222)"); w.call("haCvReloadWhenIdle(333)");
  w.idle(); w.timers[0][0]();
  ok("a newer version arriving while waiting replaces the pending one", w.reloads.length === 1 && /_cv=333/.test(w.reloads[0]), w.reloads);
}
console.log("\n── a kiosk left busy for 30 minutes still gets the deploy ──");
{
  const w = world({ overlays: [{ style: { display: "flex" } }] }); w.call("haCvReloadWhenIdle(222)");
  w.tick(29 * 60 * 1000); w.timers[0][0]();
  ok("29 minutes busy → still waiting", w.reloads.length === 0);
  w.tick(2 * 60 * 1000); w.timers[0][0]();
  ok("31 minutes busy → reloads anyway", w.reloads.length === 1);
}
console.log("\n── wiring ──");
ok("the codeVersion listener defers through haCvReloadWhenIdle", /if\(sessionStorage\.getItem\("ha_cv_reload"\)===String\(remote\)\) return;\s*haCvReloadWhenIdle\(remote\);/.test(src));
ok("no other immediate location.replace on a version mismatch remains", (src.match(/u\.searchParams\.set\("_cv",remote\); location\.replace\(u\.href\);/g) || []).length === 1);
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
