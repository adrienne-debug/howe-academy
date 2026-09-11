/*
 * Node tests for 🛤 LANES, Stage 4 — the generator.
 *
 * Two readers of a subject's OWN days / ×wk had to learn the resolved rhythm: the injection
 * pass in resolveWeekSlots (which days a subject is offered this week) and the mid-week
 * quota in gwReadWeekAutoAdvance's merge (how many projected days may be added). A member
 * that is not up takes no slot at all. Both blocks are sliced from index.html and run REAL.
 *
 *   run:  node test_lanes_gen.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function block(a, b, from) { const i = src.indexOf(a, from || 0), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

const LANE = block("// LANE_START", "// LANE_END");
const INJECT = block("    // Inject in-app subjects (lessonSeq, no Excel data) onto matching days", "    // Manual Lesson Map additions");
const MERGE = (function () { const a = src.indexOf("      {\n        const _t=(typeof cbTodayISO===\"function\")?cbTodayISO():\"\";"); const b = src.indexOf("      const cursor=(savedCursors", a); if (a < 0 || b < 0) throw new Error("merge block"); return src.slice(a, b); })();

const WEEK = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"];   // Mon–Fri
function subj(display, n, days, tpw, extra) {
  const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1));
  return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display,
    allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw }, minutes: 15 }, extra || {});
}
function baseCtx(subjects, done, lanes) {
  const ctx = {
    console, Object, Array, String, Number, Math, JSON, Set, parseInt, Date,
    currData: { subjects: { kid: subjects }, done: { kid: done || {} }, lanes: lanes ? { kid: lanes } : undefined },
    gwParseDate: s => new Date(s + "T12:00:00"), smapIsKidOff: () => false, _ovOffX: () => false, _ovRmX: () => false, schedOv: () => null,
    cbDefaultForm: (k, sk) => { const s = subjects[sk] || {}; return { mode: (s.pacing || {}).mode || "timesPerWeek", tpw: (s.pacing || {}).tpw || s.timesPerWeek || 3, targetDate: "", allowedDays: (s.allowedDays || []).slice() }; },
  };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys((done || {})[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  return ctx;
}
const doneN = n => { const o = {}; for (let i = 0; i < n; i++) o["L" + String(i + 1).padStart(4, "0")] = { ts: 1, day: "2026-09-01" }; return o; };

// ── the injection pass ───────────────────────────────────────────────────────
function inject(subjects, done, lanes) {
  const ctx = baseCtx(subjects, done, lanes);
  Object.assign(ctx, { kid: "kid", subjects, subjectSlots: {}, sortedDates: WEEK.slice(), dayData: {}, ignoreAuto: false, WDAY_ABBR: { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" } });
  WEEK.forEach(d => { ctx.dayData[d] = { kid: {} }; });
  vm.createContext(ctx);
  vm.runInContext(LANE + "\n" + INJECT, ctx);
  return { slots: ctx.subjectSlots, dayData: ctx.dayData };
}
console.log("── resolveWeekSlots: injection ──");
{
  const r = inject({ s3b: subj("3B", 5, ["Mon", "Wed", "Fri"], 3), s4a: subj("4A", 5, ["Tue"], 1) }, {}, null);
  ok("no lanes: each subject injected on its own days", eq(r.slots.s3b, ["2026-09-14", "2026-09-16", "2026-09-18"]) && eq(r.slots.s4a, ["2026-09-15"]), r.slots);
}
{
  const lanes = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }] } };
  const r = inject({ s3b: subj("3B", 5, ["Mon", "Wed", "Fri"], 3), s4a: subj("4A", 5, ["Tue"], 1) }, {}, lanes);
  ok("3B (up) injected on its own days", eq(r.slots.s3b, ["2026-09-14", "2026-09-16", "2026-09-18"]));
  ok("4A (waiting) takes NO slot at all — not even a TMP marker", r.slots.s4a === undefined && !WEEK.some(d => r.dayData[d].kid.s4a), r.slots);
  const r2 = inject({ s3b: subj("3B", 5, ["Mon", "Wed", "Fri"], 3), s4a: subj("4A", 5, ["Tue"], 1) }, { s3b: doneN(5) }, lanes);
  ok("3B finished → 4A injected on 3B's borrowed days, not its own Tuesday", eq(r2.slots.s4a, ["2026-09-14", "2026-09-16", "2026-09-18"]) && r2.slots.s3b === undefined, r2.slots);
  ok("— with TMP markers on those days", WEEK.filter(d => r2.dayData[d].kid.s4a === "TMP").length === 3);
}
{
  const lanes = { gs: { name: "Geo/Sci", units: [{ subs: ["geo", "sci"], pattern: "AAB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3 }] } };
  const r = inject({ geo: subj("Geo", 6, ["Tue"], 1), sci: subj("Sci", 6, ["Thu"], 1) }, {}, lanes);
  ok("multiple card: both members offered the CARD's days (the projection then deals them by pattern)", eq(r.slots.geo, ["2026-09-14", "2026-09-16", "2026-09-18"]) && eq(r.slots.sci, ["2026-09-14", "2026-09-16", "2026-09-18"]), r.slots);
}
{
  const lanes = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "own" }] } };
  const r = inject({ s3b: subj("3B", 5, ["Mon"], 1), s4a: subj("4A", 5, ["Tue"], 1) }, { s3b: doneN(5) }, lanes);
  ok("rhythm 'own' keeps the member's own days", eq(r.slots.s4a, ["2026-09-15"]));
}
{
  const lanes = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }] } };
  const r = inject({ s3b: subj("3B", 5, ["Mon", "Wed", "Fri"], 3, { paused: true }), s4a: subj("4A", 5, ["Tue"], 1) }, {}, lanes);
  ok("a paused first unit is skipped: 4A is up, on the borrowed rhythm", eq(r.slots.s4a, ["2026-09-14", "2026-09-16", "2026-09-18"]) && r.slots.s3b === undefined, r.slots);
}
{
  // daily subjects and subjects already holding cells are untouched by the lane hook
  const r = inject({ nb: { display: "NB", tracking: "daily", allowedDays: ["Mon", "Tue"] }, s3b: subj("3B", 5, ["Mon"], 1) }, {}, { math: { name: "M", units: [{ sk: "s3b" }] } });
  ok("a daily subject still lands as itself", r.dayData["2026-09-14"].kid.nb === "NB" && r.dayData["2026-09-15"].kid.nb === "NB");
  ok("a single-unit lane on its own rhythm changes nothing", eq(r.slots.s3b, ["2026-09-14"]));
}

// ── the merge quota ──────────────────────────────────────────────────────────
function merge(subjects, lanes, opts) {
  opts = opts || {};
  const ctx = baseCtx(subjects, {}, lanes);
  Object.assign(ctx, { kid: "kid", sk: opts.sk || "s4a", subjects, dates: (opts.dates || []).slice(), dayData: {}, cbTodayISO: () => opts.today || "2026-09-13",
    _gwPlanDates: () => opts.projected || [], dbg: () => {}, weekData: opts.weekData === undefined ? { tasks: [{ who: "kid", subjectKey: opts.sk || "s4a", id: "kid_x_L0001" }] } : opts.weekData });
  WEEK.forEach(d => { ctx.dayData[d] = { kid: { other: "x" } }; });
  (opts.dates || []).forEach(d => { ctx.dayData[d].kid[ctx.sk] = "TMP"; });
  vm.createContext(ctx);
  vm.runInContext(LANE + "\n" + MERGE, ctx);
  return ctx.dates;
}
console.log("\n── merge: weekly quota ──");
{
  const lanes = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }] } };
  const subjects = { s3b: subj("3B", 5, ["Mon", "Wed", "Fri"], 3), s4a: subj("4A", 5, ["Tue"], 1) };
  const got = merge(subjects, lanes, { sk: "s4a", dates: ["2026-09-15"], projected: ["2026-09-14", "2026-09-16", "2026-09-18"] });
  ok("a borrowing unit's quota is the BORROWED ×/wk (3), so all three projected days survive", eq(got, ["2026-09-14", "2026-09-16", "2026-09-18"]), got);
  const own = merge(subjects, null, { sk: "s4a", dates: ["2026-09-15"], projected: ["2026-09-14", "2026-09-16", "2026-09-18"] });
  ok("without the lane the same subject (own ×/wk 1) would keep only one — the bug this stage fixes", eq(own, ["2026-09-14"]), own);
  const mid = merge(subjects, lanes, { sk: "s4a", today: "2026-09-15", dates: ["2026-09-14"], projected: ["2026-09-16", "2026-09-18"] });
  ok("mid-week: a kept day counts against the borrowed quota (1 kept + 2 added = 3)", eq(mid, ["2026-09-14", "2026-09-16", "2026-09-18"]), mid);
  const multi = merge({ geo: subj("Geo", 6, ["Tue"], 1), sci: subj("Sci", 6, ["Thu"], 1) }, { gs: { name: "G", units: [{ subs: ["geo", "sci"], pattern: "AAB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3 }] } }, { sk: "geo", dates: [], projected: ["2026-09-14", "2026-09-16"] });
  ok("a multiple-card member's quota is the card's ×/wk", eq(multi, ["2026-09-14", "2026-09-16"]), multi);
  // a member with NO card in the live week (it was waiting when the week was dealt) must not keep past days
  const fresh = merge(subjects, lanes, { sk: "s4a", today: "2026-09-16", dates: ["2026-09-14", "2026-09-16"], projected: ["2026-09-18"], weekData: { tasks: [{ who: "kid", subjectKey: "other", id: "o1" }] } });
  ok("mid-week handoff: a successor with no live card drops its past-day slots (no lessons wasted on days that happened)", eq(fresh, ["2026-09-18"]), fresh);
  const dealt = merge(subjects, lanes, { sk: "s4a", today: "2026-09-16", dates: ["2026-09-14", "2026-09-16"], projected: ["2026-09-18"] });
  ok("— but a member that HAS cards this week keeps its past days as before", eq(dealt, ["2026-09-14", "2026-09-16", "2026-09-18"]), dealt);
  const noLane = merge(subjects, null, { sk: "s4a", today: "2026-09-16", dates: ["2026-09-14", "2026-09-16"], projected: ["2026-09-18"], weekData: { tasks: [] } });
  ok("— and a subject not in a lane is untouched by the rule", eq(noLane, ["2026-09-14", "2026-09-16"]), noLane);
  const plain = merge(subjects, lanes, { sk: "s3b", dates: [], projected: ["2026-09-14", "2026-09-16", "2026-09-18", "2026-09-17"] });
  ok("a unit on its own rhythm keeps its own quota (3 of 4)", plain.length === 3, plain);
}

// ── wiring ───────────────────────────────────────────────────────────────────
console.log("\n── wiring ──");
{
  ok("injection: a member that is not up is skipped before any day is offered", /if\(!lnIsUp\(kid,_l\.id,_l\.unitIdx\)\) continue; _lnRh=lnRhythm/.test(INJECT));
  ok("injection: days and ×/wk come from the resolved rhythm", /const allowed=\(_lnRh\?_lnRh\.allowedDays:s\.allowedDays\)\|\|\[\];/.test(INJECT) && /parseInt\(_lnRh\?_lnRh\.tpw:s\.timesPerWeek\)/.test(INJECT));
  ok("injection: 'own' rhythm resolves to null so the member's own settings apply unchanged", /if\(_lnRh&&_lnRh\.own\) _lnRh=null;/.test(INJECT));
  ok("merge: quota reads the resolved rhythm, guarded", /let _tpwWk=parseInt/.test(MERGE) && /if\(_r&&!_r\.own\) _tpwWk=parseInt\(_r\.tpw,10\)\|\|0;/.test(MERGE));
  ok("merge: the quota cap itself is unchanged (test_gen_plandates pins it)", /_room=Math\.max\(0,_tpwWk-_keep\.filter/.test(MERGE) && /if\(_tpwWk>0\)\{/.test(MERGE));
  ok("the projection still decides the days (Stage 1's [] for waiting/finished)", /if\(res&&\(res\.waiting\|\|res\.finished\)\) return \[\];/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
