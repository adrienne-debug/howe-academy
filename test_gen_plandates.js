/*
 * Node tests for STAGE 3a — the generator takes a plan-backed subject's DAYS from the
 * projection instead of the frozen grid cells, and both the generator and the Grid ask
 * for the plain pattern (opts.absorb === false) rather than a catch-up plan.
 *
 * Why this exists. The stored cells are a snapshot of the last lay: every column's cells
 * stop exactly at `pacing.builtThrough` (24 of 24 on live data, 2026-08-30), so they run
 * short by whatever the kid has slipped since — 22 of 24 subjects, 70 lessons with no cell.
 * Meanwhile the Grid was running the SAME projection with owed absorption switched on, so
 * it advertised catch-up days the generator had no mechanism to deal: 19 of 24 columns
 * disagreed. After this change both sides make the identical call and agree 24 of 24.
 *
 * These cover the day-selection merge and the wiring. test_projection owns projectPlans;
 * test_derived_col owns the Grid's card-vs-plan merge.
 *
 *   run:  node test_gen_plandates.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// GWPJ_START"), b = src.indexOf("// GWPJ_END");
if (a < 0 || b < 0) { console.error("GWPJ markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── _gwPlanDates ────────────────────────────────────────────────────────────
// The live days are the ones gwReadWeek produced for this kid this week; a projected date
// outside that set can never be taken (an off day, a ✕'d day, a day with no row at all).
function run(opts) {
  opts = opts || {};
  const ctx = {
    console, dbg: m => (ctx.__dbg = m),
    planBacked: () => opts.planBacked !== false,
    planMaterialize: (k, sk, form, o) => {
      ctx.__opts = o;
      if (opts.throws) throw new Error("boom");
      return opts.res === undefined
        ? { assignments: [{ date: "2026-08-31", text: "pg 5" }, { date: "2026-09-02", text: "pg 6" }], extras: [] }
        : opts.res;
    },
  };
  vm.createContext(ctx);
  const live = JSON.stringify(opts.live === undefined ? { "2026-08-31": 1, "2026-09-02": 1, "2026-09-04": 1 } : opts.live);
  vm.runInContext(BLOCK + "\nvar __r=_gwPlanDates('ellis','word_roots'," + live + ");", ctx);
  return { dates: ctx.__r, opts: ctx.__opts, dbg: ctx.__dbg };
}

console.log("── _gwPlanDates ──");
{
  const r = run();
  ok("returns the projected dates", JSON.stringify(r.dates) === JSON.stringify(["2026-08-31", "2026-09-02"]), r.dates);
  ok("asks the projection for the PLAIN pattern", r.opts && r.opts.absorb === false, r.opts);
}
ok("a subject that is not plan-backed is left alone (null)", run({ planBacked: false }).dates === null);
ok("a projection that cannot lay this mode returns null", run({ res: null }).dates === null);
ok("an error result returns null", run({ res: { error: "Nothing left to lay" } }).dates === null);
ok("no assignments returns null, not an empty list",
  run({ res: { assignments: [], extras: [] } }).dates === null);
{
  const r = run({ throws: true });
  ok("a throw is caught and reported, not fatal", r.dates === null && /plan dates skip/.test(r.dbg || ""), r.dbg);
}
{
  // The guard that keeps a projected day off a day the kid does not have.
  const r = run({ live: { "2026-08-31": 1 } });
  ok("a projected date the kid has no live day for is dropped",
    JSON.stringify(r.dates) === JSON.stringify(["2026-08-31"]), r.dates);
  const none = run({ live: {} });
  ok("no live days at all yields an empty list (subject takes no slot that week)",
    Array.isArray(none.dates) && none.dates.length === 0, none.dates);
}
{
  const r = run({ res: { assignments: [{ date: "2026-09-02" }, { date: "2026-08-31" }], extras: [] } });
  ok("dates come back in date order", JSON.stringify(r.dates) === JSON.stringify(["2026-08-31", "2026-09-02"]), r.dates);
}
{
  // extras only exist when absorption is on; carried anyway so the shape survives the loop work
  const r = run({ res: { assignments: [{ date: "2026-08-31" }], extras: [{ date: "2026-09-02" }] } });
  ok("a second sitting on a day is included when present",
    JSON.stringify(r.dates) === JSON.stringify(["2026-08-31", "2026-09-02"]), r.dates);
}

// ── the merge inside gwReadWeekAutoAdvance ──────────────────────────────────
console.log("\n── generator merge wiring ──");
{
  // Slice to the END of the function, not a fixed byte window: a 12000-char window was
  // outgrown the moment the quota cap was added, and the slow-log assertion failed for no
  // reason other than having been pushed past the edge.
  const g = src.indexOf("function gwReadWeekAutoAdvance");
  const gEnd = g < 0 ? -1 : src.indexOf("\n// Which plan week does a date fall in?", g);
  const gen = g < 0 ? "" : src.slice(g, gEnd > g ? gEnd : g + 20000);
  ok("gwReadWeekAutoAdvance exists", g >= 0);
  ok("the slice reaches the end of the function", /return \{dayData,cursors,catchup,served\};/.test(gen));
  ok("it calls the helper", /_gwPlanDates\(kid,sk,_live\)/.test(gen));
  ok("live days are the kid's own days in dayData", /if\(dayData\[_d\]&&dayData\[_d\]\[kid\]\) _live\[_d\]=1;/.test(gen));
  // A mid-week regeneration must not rewrite days that already happened. The projection
  // deliberately lays nothing on or before today, so today keeps its cell slot too.
  ok("days at or before today keep their cell slot", /_keep=dates\.filter\(function\(d\)\{ return d<=_t; \}\)/.test(gen));
  ok("only days after today come from the projection", /_next=_pjd\.filter\(function\(d\)\{ return d>_t/.test(gen));
  ok("a day cannot appear twice across the two halves", /_keep\.indexOf\(d\)<0/.test(gen));
  // resolveWeekSlots marks an injected slot "TMP"; a day dropped from the list must have
  // that marker cleared or gwBuildDayTasks lays it as a phantom task.
  ok("dropped days have their dayData entry cleared", /_was\.forEach\(function\(d\)\{ if\(!_set\[d\]&&dayData\[d\]&&dayData\[d\]\[kid\]\) delete dayData\[d\]\[kid\]\[sk\]; \}\)/.test(gen),
    "a dropped day would keep its TMP marker and become a phantom card");
  ok("newly taken days get a slot marker", /dayData\[d\]\[kid\]\[sk\]="TMP"/.test(gen));
  ok("the marker never overwrites a real cell", /\[sk\]===undefined\) dayData\[d\]\[kid\]\[sk\]="TMP"/.test(gen));
  // subjectSlots[sk] is held by reference and read again after this block
  ok("dates are replaced IN PLACE, not rebound", /dates\.length=0; _now\.forEach\(function\(d\)\{ dates\.push\(d\); \}\)/.test(gen),
    "rebinding would leave subjectSlots pointing at the old array");
  ok("nothing happens without a today", /const _pjd=_t\?_gwPlanDates/.test(gen));
  // A mid-week regen re-spreads the FULL weekly quota over only the days that are left, on
  // top of the days already kept. Measured on live data: ellis Editor in Chief (tpw 3, no
  // pinned days) took Mon+Wed from the cells and then Thu AND Fri from the projection —
  // four sittings in a week that asks for three. Found by the nothing-drops audit.
  ok("a mid-week regen cannot exceed the week's quota", /_room=Math\.max\(0,_tpwWk-_keep\.filter/.test(gen),
    "a regen could hand a tpw-3 subject a fourth sitting");
  ok("the quota is only applied when a tpw is set", /if\(_tpwWk>0\)\{/.test(gen));
  // Mom's hand-added days ride on top of tpw by design (_pjPatternRows unions them), so
  // they must not be counted against the quota and must never be trimmed by it.
  ok("a hand-added day is never counted against the quota", /_keep\.filter\(function\(d\)\{ return !_isAdd\(d\); \}\)/.test(gen));
  ok("a hand-added day is never trimmed by the quota", /if\(_isAdd\(d\)\) return true;/.test(gen));
  // one owner for backlog: the generator still adds no catch-up slots of its own
  ok("plan-backed catch-up stays switched off", /const _pbCatch=\(typeof planBacked==="function"\)&&planBacked\(kid,sk\)/.test(gen));
  ok("content still comes from the plan, list minus done by id", /_pbServe/.test(gen));
}

// ── planMaterialize's absorb option ─────────────────────────────────────────
console.log("\n── planMaterialize absorb ──");
{
  const p = src.indexOf("function planMaterialize");
  const pm = p < 0 ? "" : src.slice(p, src.indexOf("// Owed only (for chips)", p));
  ok("planMaterialize exists", p >= 0);
  ok("absorb defaults ON — an explicit false is the only way off", /const _absorb=!\(opts&&opts\.absorb===false\)/.test(pm));
  ok("suppressed: no second sitting on a day", /cap:_absorb\?cap:1/.test(pm));
  ok("suppressed: no owed, because there is no anchor to measure from", /anchor:_absorb\?anchor:null/.test(pm));
  ok("suppressed: no overflow spill onto other days", /overflow:_absorb&&\(s\.overflowExtras!==false\)/.test(pm));
  // The backlog number is still computed and still shown — suppressed, not hidden. Check
  // planOwed's own body, not a window around the NAME: the first mention of "planOwed" in
  // the file is a comment inside planMaterialize, which sits right next to _absorb and made
  // a proximity test fail for no reason.
  const po = src.indexOf("function planOwed(kid,sk){");
  const poBody = po < 0 ? "" : src.slice(po, src.indexOf("\n}", po));
  ok("planOwed exists", po >= 0);
  ok("planOwed is untouched, so the owed chip still counts the full backlog",
    poBody.length > 0 && !/_absorb/.test(poBody) && /return Math\.max\(0,Math\.min\(remaining,past-doneSince\)\)/.test(poBody));
}
{
  const g = src.indexOf("function gvDerivedColumn");
  const gd = g < 0 ? "" : src.slice(g, g + 3000);
  ok("the Grid asks for the plain pattern too", /planMaterialize\(kid,sk,null,\{dealt:dealt,absorb:false\}\)/.test(gd),
    "the Grid would go on advertising catch-up the generator never deals");
  ok("the Grid still lets dealt cards win their day", /dealt:dealt/.test(gd));
}

// ── the two follow-ups closed after the first audit ─────────────────────────
console.log("\n── one engine, one answer ──");
{
  const e = src.indexOf("function _cbEngine()");
  const eng = e < 0 ? "" : src.slice(e, e + 1400);
  ok("_cbEngine exists", e >= 0);
  // A Rebuild used to lay owed catch-up days and write them as cells. After Stage 3a
  // nothing reads those cells for placement, so the button did less than it looked like
  // — while the inflated cells still fed other subjects' usedMin through cbFutureRows.
  ok("the Builder/relay engine asks for the plain pattern too",
    /planMaterialize\(cbKid,cbSubjKey,cbForm,\{absorb:false\}\)/.test(eng),
    "Rebuild would lay catch-up days nothing deals");
  ok("it still falls back to cbMaterialize for non-plan modes", /return cbMaterialize\(cbBuildCfg\(\)\)/.test(eng));
}
{
  // The Grid logs its own derive time; the generator runs the same projection once per
  // plan-backed subject, on a path that can fire several times per generation.
  const g = src.indexOf("function gwReadWeekAutoAdvance");
  const gEnd2 = g < 0 ? -1 : src.indexOf("\n// Which plan week does a date fall in?", g);
  const gen = g < 0 ? "" : src.slice(g, gEnd2 > g ? gEnd2 : g + 20000);
  ok("the projection clock resets each pass", /_gwPjMs=0;/.test(gen));
  ok("a slow generation is logged", /generator plan-dates slow/.test(gen));
  ok("the clock is accumulated around the helper", /finally \{ _gwPjMs\+=Date\.now\(\)-_t0; \}/.test(src));
}
{
  // overflowExtras' only reader was planMaterialize. With absorption off app-wide the
  // checkbox on the card is now inert — recorded here so it cannot be forgotten when the
  // loop restores a rate-limited absorption.
  // Count CODE mentions only. Twice now a proximity/count assertion has failed on prose I
  // wrote in a comment beside the code it describes — strip comment lines first.
  const codeLines = src.split("\n").filter(l => !/^\s*(\/\/|\*)/.test(l)).join("\n");
  const readers = (codeLines.match(/s\.overflowExtras/g) || []).length;
  ok("overflowExtras is down to its own UI plus the (suppressed) projection", readers <= 3, readers);
  // s.cap is NOT dormant — only its projection use sleeps.
  ok("capFor still has real consumers outside the projection",
    (src.match(/capFor\(/g) || []).length > 5);
}

console.log("\nregen never trusts the calendar mirror");
{
  const _rg = src.slice(src.indexOf("function schedRegenerateNow"), src.indexOf("function schedRegenerateNow") + 5000);
  ok("regen pulls a fresh calendar snapshot before generating",
    _rg.indexOf('db.ref("calendar").once') > 0);
  ok("— and BEFORE the weekConfig read that starts the deal",
    _rg.indexOf('db.ref("calendar").once') < _rg.indexOf('db.ref("weekConfig/'));
  ok("the snapshot replaces the mirror, kidOverrides included",
    /kidOverrides:cv\.kidOverrides\|\|\{\}/.test(_rg));
  ok("and leaves a breadcrumb", _rg.indexOf("regen: calendar refreshed") > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
