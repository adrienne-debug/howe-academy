/*
 * 🗓 WKRELOAD: when another device moves the app to a new week, an open screen reloads ONCE at the next
 * idle moment (her ask 2026-11-08: last week stayed on screen until she reloaded).
 *   run:  node test_wk_reload.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// CVRELOAD_START"), b = src.indexOf("// WKRELOAD_END");
if (a < 0 || b < 0) { console.error("markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world(o) {
  o = o || {};
  const reloads = [], timers = [], session = {}, logs = [];
  let now = 1000000;
  const ctx = {
    console: { log: m => logs.push(m) }, CODE_VERSION: 111, tab: "schedule", kid: "ellis", masteryKid: "ellis", mastView: null, mastSlideIdx: 0, schedShowAdmin: false, adminSubTab: "", mhqKid: null, mhqView: null, mhqDeck: null,
    wbView: o.wbView || null, mastLogMode: false, mastRecState: null, mstState: null,
    document: { getElementById: () => null, querySelectorAll: () => [] },
    sessionStorage: { getItem: k => session[k] || null, setItem: (k, v) => { session[k] = v; } },
    location: { href: "https://x.test/app/", search: o.search || "", replace: u => reloads.push("replace:" + u), reload: () => reloads.push("reload") }, URL,
    HA_LS: { getItem: () => null },
    setInterval: (fn, ms) => { timers.push([fn, ms]); return timers.length; }, clearInterval: () => { timers.length = 0; },
    Date: { now: () => now }, String, Object, JSON,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("function _dryRun(){ return /[?&]dryrun=1/.test(location.search); }", ctx);
  return { ctx, reloads, timers, session, logs, call: e => vm.runInContext(e, ctx), tick: ms => { now += ms; } };
}
console.log("── idle screen: reloads once ──");
{
  const w = world(); w.call('haWkReloadWhenIdle("week31")');
  ok("reloads", w.reloads.length === 1 && w.reloads[0] === "reload", w.reloads);
  ok("stamps the once-per-week guard", w.session.ha_wk_reload === "week31");
  ok("saves the screen to come back to", !!w.session.ha_cv_return);
  w.call('haWkReloadWhenIdle("week31")');
  ok("the same week again → no second reload (no loop)", w.reloads.length === 1);
  w.call('haWkReloadWhenIdle("week32")');
  ok("the next week → reloads again", w.reloads.length === 2);
}
console.log("\n── busy screen: waits, then reloads ──");
{
  const w = world({ wbView: { page: 2 } }); w.call('haWkReloadWhenIdle("week31")');
  ok("workbook open → no reload, 20 s re-check", w.reloads.length === 0 && w.timers.length === 1 && w.timers[0][1] === 20000);
  w.ctx.wbView = null; w.tick(20000); w.timers[0][0]();
  ok("workbook closed → reloads", w.reloads.length === 1);
}
{
  const w = world({ wbView: { page: 2 } }); w.call('haWkReloadWhenIdle("week31")');
  w.tick(31 * 60 * 1000); w.timers[0][0]();
  ok("still busy after 30 min → reloads anyway (same cap as a code update)", w.reloads.length === 1);
}
console.log("\n── dry run never reloads ──");
{
  const w = world({ search: "?dryrun=1" }); w.call('haWkReloadWhenIdle("week31")');
  ok("no reload in dry run", w.reloads.length === 0 && !w.session.ha_wk_reload);
}
console.log("\n── code-update reload untouched ──");
{
  const w = world(); w.call("haCvReloadWhenIdle(222)");
  ok("a code update still uses its own cache-busting reload", w.reloads.length === 1 && /_cv=222/.test(w.reloads[0]));
}
console.log("\n── wiring in the source ──");
ok("the first-open flag is read at boot", /const _haWkHadLocal=!!HA_LS\.getItem\("ha_active_wk"\);/.test(src));
const li = src.indexOf('db.ref("ha_active_wk").on("value"');
const lb = src.slice(li, src.indexOf('db.ref("calendar")', li));
ok("the week listener calls it after the live switch", /attachWeekListeners\(WK\);\s*renderAllSoon\(\);\s*try\{ if\(_haWkHadLocal&&typeof haWkReloadWhenIdle==="function"\) haWkReloadWhenIdle\(WK\); \}catch\(e\)\{\}/.test(lb));
ok("only inside the 'week differs' branch", /if\(fbWk && fbWk!==WK\)\{[\s\S]*haWkReloadWhenIdle\(WK\)[\s\S]*\}\s*\}\);\s*$/.test(lb));
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
