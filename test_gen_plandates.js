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
  const g = src.indexOf("function gwReadWeekAutoAdvance");
  const gen = g < 0 ? "" : src.slice(g, g + 12000);
  ok("gwReadWeekAutoAdvance exists", g >= 0);
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

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
