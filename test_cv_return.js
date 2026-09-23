/*
 * 🧠 ↩ 🃏 Mastery and update reloads (her report 2026-09-23: drilling in Mastery, an update reload
 * threw her back to the main Schedule; "would it also land on the last card that was drilled").
 *   A. anywhere in Mastery (tab or Mastery HQ) counts as busy → the update waits
 *   B. an update reload comes back to the same screen (tab, kid, Mastery view, card)
 *   C. a half-scored drill resumes on the card it was on, not card 1
 *   run:  node test_cv_return.js
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
  const reloads = [], timers = [], session = o.session || {};
  let now = o.now || 5000000;
  const ctx = {
    console: { log: () => {} }, CODE_VERSION: 111,
    wbView: null, mastLogMode: !!o.mastLogMode, mastRecState: null, mstState: null,
    tab: o.tab || "schedule", kid: o.kid || "all", masteryKid: o.masteryKid || "lincoln", mastView: o.mastView || "drill", mastSlideIdx: o.mastSlideIdx || 0,
    schedShowAdmin: !!o.schedShowAdmin, adminSubTab: o.adminSubTab || "hq", mhqKid: "lincoln", mhqView: "week", mhqDeck: null,
    _kiosk: () => !!o.kiosk, _kioskR: () => false, _kioskD: () => false, _kioskK: () => false,
    document: { getElementById: () => null, querySelectorAll: () => [] },
    sessionStorage: { getItem: k => (k in session ? session[k] : null), setItem: (k, v) => { session[k] = String(v); }, removeItem: k => { delete session[k]; } },
    location: { href: "https://x.test/app/", replace: u => reloads.push(u) }, URL,
    setInterval: (fn, ms) => { timers.push([fn, ms]); return timers.length; }, clearInterval: () => { timers.length = 0; },
    Date: { now: () => now }, String, Object, JSON,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, reloads, timers, session, call: e => vm.runInContext(e, ctx), tick: ms => { now += ms; } };
}

console.log("── A. Mastery counts as busy ──");
{
  const w = world({ tab: "mastery" });
  ok("on the Mastery tab (not scoring) → busy", w.call("haBusyReason()") === "in Mastery");
  w.call("haCvReloadWhenIdle(222)");
  ok("the update waits instead of reloading", w.reloads.length === 0 && w.timers.length === 1);
  w.ctx.tab = "schedule"; w.timers[0][0]();
  ok("…and goes once she leaves Mastery", w.reloads.length === 1);
}
{
  const w = world({ tab: "schedule", schedShowAdmin: true, adminSubTab: "mastery" });
  ok("Mastery HQ (Admin) → busy", w.call("haBusyReason()") === "in Mastery HQ");
}
{
  const w = world({ tab: "schedule", schedShowAdmin: true, adminSubTab: "hq" });
  ok("the plain Schedule is still idle → updates as before", w.call("haBusyReason()") === null);
}

console.log("\n── B. an update reload comes back to the same screen ──");
{
  const w = world({ tab: "mastery", masteryKid: "ellis", mastView: "sprint", mastSlideIdx: 7, kid: "ellis" });
  w.call("haCvReturnSave()");
  const w2 = world({ session: w.session });   // the reloaded page starts on the defaults
  const r = w2.call("haCvReturnRestore()");
  ok("restored", r === true);
  ok("same tab, kid, Mastery view and card", w2.ctx.tab === "mastery" && w2.ctx.masteryKid === "ellis" && w2.ctx.mastView === "sprint" && w2.ctx.mastSlideIdx === 7 && w2.ctx.kid === "ellis",
    [w2.ctx.tab, w2.ctx.masteryKid, w2.ctx.mastView, w2.ctx.mastSlideIdx]);
  ok("used once — a later reload starts fresh", !("ha_cv_return" in w2.session) && world({ session: w2.session }).call("haCvReturnRestore()") === false);
}
{
  const w = world({ tab: "schedule", schedShowAdmin: true, adminSubTab: "mastery" });
  w.call("haCvReturnSave()");
  const w2 = world({ session: w.session });
  w2.call("haCvReturnRestore()");
  ok("Mastery HQ comes back to Mastery HQ", w2.ctx.schedShowAdmin === true && w2.ctx.adminSubTab === "mastery");
}
{
  const w = world({ tab: "mastery" });
  w.call("haCvReturnSave()");
  const w2 = world({ session: w.session }); w2.tick(3 * 60000);
  ok("stale (over 2 minutes) → ignored, normal start", w2.call("haCvReturnRestore()") === false && w2.ctx.tab === "schedule");
}
{
  const w = world({ tab: "mastery" });
  w.call("haCvReturnSave()");
  const w2 = world({ session: w.session, kiosk: true });
  ok("a kiosk keeps its own locked view", w2.call("haCvReturnRestore()") === false && w2.ctx.tab === "schedule");
}
{
  const w = world({ tab: "moms-plan" });
  w.tick(0); w.call("haCvReloadWhenIdle(333)");
  ok("the update reload itself saves the screen", w.reloads.length === 1 && JSON.parse(w.session.ha_cv_return).tab === "moms-plan");
}

console.log("\n── C. a saved drill resumes on its card ──");
{
  const i1 = src.indexOf("function mastPersistLog(){"), i2 = src.indexOf("// A half-logged session from a PRIOR day");
  const MB = src.slice(i1, i2);
  const store = {};
  const ctx = { masteryKid: "lincoln", mastLogMode: false, mastLogScores: { a: "c", b: "m" }, mastLogStartTs: 1, mastLogPausedMs: 0, mastLogPauseAt: null, mastSlideIdx: 5,
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
    mastRescueStaleLog: () => {}, JSON, Date, Object };
  vm.createContext(ctx); vm.runInContext(MB, ctx);
  vm.runInContext("mastPersistLog()", ctx);
  ok("the card position is saved with the scores", JSON.parse(store.ha_mast_log_lincoln).slideIdx === 5);
  ctx.mastSlideIdx = 0; ctx.mastLogScores = {};
  vm.runInContext("mastRestoreLog()", ctx);
  ok("resuming puts her back on card 6 (index 5), scores intact", ctx.mastLogMode === true && ctx.mastSlideIdx === 5 && ctx.mastLogScores.b === "m");
}
ok("next/prev save the position during a scored drill", /function mastSlideNext\(\)\{ mastSlideIdx\+\+; mastFlipped=false; if\(mastLogMode\) mastPersistLog\(\); _mastRe\(\); \}/.test(src) && /function mastSlidePrev\(\)\{ mastSlideIdx--; mastFlipped=false; if\(mastLogMode\) mastPersistLog\(\); _mastRe\(\); \}/.test(src));
ok("boot restores the screen before the first paint", /fxClassRestore\(\);[^\n]*\nif\(haCvReturnRestore\(\)\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
