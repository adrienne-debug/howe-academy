/*
 * Node tests — 🎧 a FIXED-TIME CLASS keeps its clock time through every RE-TIMER.
 *
 * Generation already pinned a class (gwBuildDayTasks, 2026-09-12), but that pin lived in ONE
 * place. Every other path that re-times a day — the cascade's scar re-pack and receiving-day
 * re-pack, the displacement engine, resortDayTasks — called packAround knowing nothing about
 * classes, so a 10:00 class was just a 45-minute block that packed wherever the queue reached
 * it. Live 2026-09-16: Lincoln's 10:00 Outschool German sat at 11:00 AM with THREE cards
 * inside its own 10:00–10:45 window.
 *
 * Fix (the class twin of coopApplyStart): packAround pins classes and hands their windows to
 * the packer as busy time, opt-in via ctx.fxDate. This file checks the helpers, packAround
 * itself, and the REAL cascadeIntraWeek re-pack.
 *
 *   run:  node test_fixed_class_retime.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces: " + name);
}
// FX_DOW is a module-level const, not a function — pull it verbatim so allowedDays still work.
const FX_DOW_SRC = (() => {
  const i = src.indexOf("const FX_DOW=");
  if (i < 0) throw new Error("FX_DOW not found");
  return src.slice(i, src.indexOf("\n", i) + 1);
})();

const FX_FNS = ["toMin", "fromMin", "fxIsClass", "fxDateList", "fxRunsOn", "fxWindow",
  "fxLaneOf", "fxSplitDay", "fxCtxWithClasses", "gwGetSubjects"];
const PACK_FNS = FX_FNS.concat(["taskDevice", "packDay", "packAround"]);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const mins = x => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(x || ""); if (!m) return 0; return (parseInt(m[1]) % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + parseInt(m[2]); };
const RealDate = Date;
function frozenDate(iso) {
  return class Frozen extends RealDate {
    constructor(...a) { if (a.length === 0) super(iso + "T09:00:00"); else super(...a); }
    static now() { return new RealDate(iso + "T09:00:00").getTime(); }
  };
}

// Lincoln's real class, as it sits in the live DB today.
const GERMAN = {
  display: "Outschool German", device: "computer", mom: "none", minutes: 45,
  allowedDays: ["Wed"], fixedTime: "10:00 AM", fixedDates: ["2026-07-21", "2026-09-16"],
  joinUrl: "https://outschool.com/classroom/x"
};
const PLAIN = { display: "Singapore Math", device: "paper", mom: "none", minutes: 25 };
// A MIDDAY class is the one that proves the point: school happens on BOTH sides of it. A
// co-op cursor ("out until 12:45") would wipe the whole morning, which is the trap
// gwBuildDayTasks calls out and the reason a class is a window, not a start.
const MIDDAY = Object.assign({}, GERMAN, { display: "Midday class", fixedTime: "12:00 PM" });
const SUBJECTS = { lincoln: { outschool_german: GERMAN, midday_class: MIDDAY, singapore_l: PLAIN }, ellis: { singapore_l: PLAIN }, lucy: {}, julian: {} };

function sandbox(fns, extra) {
  const env = Object.assign({
    currData: { subjects: SUBJECTS },
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN
  }, extra || {});
  const keys = Object.keys(env);
  const body = FX_DOW_SRC + fns.map(slice).join("\n");
  return new Function(...keys, "\"use strict\";" + body + "; return {" + fns.join(",") + "};")(...keys.map(k => env[k]));
}

function mkTask(id, who, day, time, opts) {
  return Object.assign({ id, who, day, time, dur: 25, device: "paper", mom: "none",
    title: "\u{1F4C4} " + id, subjectKey: "singapore_l" }, opts || {});
}
const CLASSCARD = (id, day, time) => mkTask(id, "lincoln", day, time, { dur: 45, device: "computer", subjectKey: "outschool_german", title: "\u{1F4BB} Outschool German — Lesson 1" });
const MIDCARD = (id, day, time) => mkTask(id, "lincoln", day, time, { dur: 45, device: "computer", subjectKey: "midday_class", title: "\u{1F4BB} Midday class" });

// ── 1. fxSplitDay / fxCtxWithClasses ─────────────────────────────────────────
console.log("fxSplitDay — pins the class and takes it out of the pack");
{
  const h = sandbox(FX_FNS);
  const cls = CLASSCARD("g1", "tuesday", "11:00 AM"), plain = mkTask("p1", "lincoln", "tuesday", "10:00 AM");
  const r = h.fxSplitDay([plain, cls], "2026-07-21", "tuesday");
  ok("the class is pinned to its fixedTime", cls.time === "10:00 AM", cls.time);
  ok("…and is NOT in the list to pack", r.rest.length === 1 && r.rest[0] === plain);
  ok("…and comes back as pinned with its window", r.pinned.length === 1 && r.pinned[0].w.s === 600 && r.pinned[0].w.e === 645, r.pinned[0] && r.pinned[0].w);
  ok("a plain card is untouched", plain.time === "10:00 AM");
}
{
  const h = sandbox(FX_FNS);
  const cls = CLASSCARD("g1", "tuesday", "11:00 AM");
  const r = h.fxSplitDay([cls], "2026-07-22", "tuesday");   // class does not meet that date
  ok("a date the class does NOT meet → nothing pinned", r.pinned.length === 0 && r.rest.length === 1);
  ok("…and its time is left alone", cls.time === "11:00 AM", cls.time);
}
{
  const h = sandbox(FX_FNS);
  const r = h.fxSplitDay([mkTask("p1", "lincoln", "tuesday", "10:00 AM")], null, "tuesday");
  ok("no date → nothing pinned", r.pinned.length === 0 && r.rest.length === 1);
}
console.log("\nfxCtxWithClasses — the window becomes busy time");
{
  const h = sandbox(FX_FNS);
  const cls = CLASSCARD("g1", "tuesday", "11:00 AM");
  const pinned = h.fxSplitDay([cls], "2026-07-21", "tuesday").pinned;
  const base = { start: 600, end: 975 };
  const ctx = h.fxCtxWithClasses(base, pinned);
  ok("the KID is busy 10:00–10:45", ctx.busy.lincoln.length === 1 && ctx.busy.lincoln[0].s === 600 && ctx.busy.lincoln[0].e === 645, ctx.busy);
  ok("the COMPUTER is busy too (an online class holds the machine)", (ctx.laneBusy.computer || []).length === 1, ctx.laneBusy);
  ok("Mom is NOT busy (this class is mom:none)", ctx.momBusy.length === 0, ctx.momBusy);
  ok("copy-on-write — the caller's ctx is untouched", base.busy === undefined && base.laneBusy === undefined);
  ok("no pinned classes → the same ctx object back", h.fxCtxWithClasses(base, []) === base);
}
{
  const h = sandbox(FX_FNS, { currData: { subjects: { lincoln: { outschool_german: Object.assign({}, GERMAN, { mom: "required" }) } } } });
  const pinned = h.fxSplitDay([CLASSCARD("g1", "tuesday", "11:00 AM")], "2026-07-21", "tuesday").pinned;
  ok("a mom:required class DOES hold the Mom lane", h.fxCtxWithClasses({ start: 600 }, pinned).momBusy.length === 1);
}

// ── 2. packAround ────────────────────────────────────────────────────────────
// The live shape: a morning of work with the class sitting mid-queue.
function packDay_(useFx) {
  const h = sandbox(PACK_FNS);
  const cards = [
    mkTask("a", "lincoln", "tuesday", "10:00 AM", { dur: 25, device: "computer", subjectKey: "singapore_l" }),
    mkTask("b", "lincoln", "tuesday", "10:25 AM", { dur: 20 }),
    mkTask("c", "lincoln", "tuesday", "10:45 AM", { dur: 5 }),
    mkTask("d", "lincoln", "tuesday", "10:50 AM", { dur: 10 }),
    CLASSCARD("g1", "tuesday", "11:00 AM"),
    mkTask("e", "lincoln", "tuesday", "11:45 AM", { dur: 25 })
  ];
  const ctx = { start: 600, end: 975, lunchStart: 780, lunchEnd: 840 };
  if (useFx) { ctx.fxDate = "2026-07-21"; ctx.fxDay = "tuesday"; }
  h.packAround([], cards, ctx);
  return cards;
}
console.log("\npackAround — control: NO fxDate reproduces the live bug");
{
  const cards = packDay_(false);
  const g = cards.find(t => t.id === "g1");
  ok("the class packs in queue order, not at its clock time", g.time !== "10:00 AM", g.time);
  ok("…exactly the live symptom (11:00 AM behind 60 min of work)", g.time === "11:00 AM", g.time);
}
console.log("\npackAround — with fxDate the class holds 10:00 AM");
{
  const cards = packDay_(true);
  const g = cards.find(t => t.id === "g1");
  ok("the class is at its own clock time", g.time === "10:00 AM", g.time);
  const others = cards.filter(t => t.id !== "g1");
  ok("NOTHING else of lincoln's overlaps the 10:00–10:45 window",
    others.every(t => mins(t.time) >= 645 || mins(t.time) + t.dur <= 600), others.map(t => t.time + "+" + t.dur));
  ok("German starts the day (its clock time IS school start)", Math.min(...cards.map(t => mins(t.time))) === 600);
  ok("the rest of the day still happens AFTER it", others.some(t => mins(t.time) >= 645));
  ok("no kid self-overlap anywhere", (() => {
    const s = cards.map(t => [mins(t.time), mins(t.time) + t.dur]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < s.length; i++) if (s[i][0] < s[i - 1][1]) return false; return true;
  })(), cards.map(t => t.time + "+" + t.dur));
  ok("nothing was dropped", cards.length === 6 && cards.every(t => !!t.time));
}
console.log("\npackAround — a day with NO class is byte-identical with and without fxDate");
{
  function noClass(useFx) {
    const h = sandbox(PACK_FNS);
    const cards = ["a", "b", "c", "d"].map((id, i) => mkTask(id, "lincoln", "tuesday", "10:00 AM", { dur: 25 + i * 5 }));
    const ctx = { start: 600, end: 975, lunchStart: 780, lunchEnd: 840 };
    if (useFx) { ctx.fxDate = "2026-07-21"; ctx.fxDay = "tuesday"; }
    h.packAround([], cards, ctx);
    return cards.map(t => t.id + "@" + t.time).join("|");
  }
  ok("identical layout (provably inert where there is no class)", noClass(false) === noClass(true), [noClass(false), noClass(true)]);
}
console.log("\npackAround — a MIDDAY class: school happens on BOTH sides of it");
{
  const h = sandbox(PACK_FNS);
  const cards = ["a", "b", "c", "d", "e", "f"].map(id => mkTask(id, "lincoln", "tuesday", "10:00 AM", { dur: 25 }));
  const cls = MIDCARD("m1", "tuesday", "10:00 AM");   // laid FIRST, i.e. at the wrong time
  cards.splice(0, 0, cls);
  h.packAround([], cards, { start: 600, end: 975, lunchStart: 780, lunchEnd: 840, fxDate: "2026-07-21", fxDay: "tuesday" });
  ok("the midday class is pinned to 12:00 PM", cls.time === "12:00 PM", cls.time);
  const others = cards.filter(t => t.id !== "m1");
  ok("the MORNING is not wiped — work lands before 12:00", others.some(t => mins(t.time) + t.dur <= 720), others.map(t => t.time));
  ok("work also lands after the class", others.some(t => mins(t.time) >= 765), others.map(t => t.time));
  ok("nothing sits inside 12:00–12:45",
    others.every(t => mins(t.time) >= 765 || mins(t.time) + t.dur <= 720), others.map(t => t.time + "+" + t.dur));
}
console.log("\npackAround — a class in `existing` must NOT seed the kid cursor past its end");
{
  // The trap gwBuildDayTasks calls out: seeded as `existing`, a 12:00 class advances kidStart
  // to 12:45 and the whole morning is wiped, exactly like a co-op "out until 12:45".
  function seedScenario(useFx) {
    const h = sandbox(PACK_FNS);
    const cls = MIDCARD("m1", "tuesday", "12:00 PM");
    const arrivals = [mkTask("n1", "lincoln", "tuesday", "10:00 AM", { dur: 20 }), mkTask("n2", "lincoln", "tuesday", "10:00 AM", { dur: 20 })];
    const ctx = { start: 600, end: 975, lunchStart: 780, lunchEnd: 840 };
    if (useFx) { ctx.fxDate = "2026-07-21"; ctx.fxDay = "tuesday"; }
    h.packAround([cls], arrivals, ctx);
    return { cls, arrivals };
  }
  // CONTROL — this is the trap, and it is real: left in `existing`, the class advances
  // lincoln's cursor to 12:45 and both arrivals land after it. Morning gone.
  ok("control — WITHOUT the fix the class wipes the morning",
    seedScenario(false).arrivals.every(t => mins(t.time) >= 765), seedScenario(false).arrivals.map(t => t.time));
  const { cls, arrivals } = seedScenario(true);
  ok("arrivals still fill the morning before the class", arrivals.every(t => mins(t.time) + t.dur <= 720), arrivals.map(t => t.time));
  ok("…and none of them land inside the class window",
    arrivals.every(t => mins(t.time) >= 765 || mins(t.time) + t.dur <= 720), arrivals.map(t => t.time + "+" + t.dur));
  ok("the class itself is still pinned", cls.time === "12:00 PM", cls.time);
}

// ── 3. THE REAL cascadeIntraWeek receiving-day re-pack ───────────────────────
// Same sandbox test_coop_start.js uses.
const CASC_FNS = [
  "toMin", "fromMin", "_parseCheckTs", "_dismissed", "_normOrderArr",
  "taskDevice", "taskSubject", "taskTier", "capFor", "capForDisplay", "catchupDayCap", "isCatchupCapped",
  "subjNoCarry", "applyStickyOrder", "packDay", "packAround",
  "coopsMap", "_coopHasDate", "coopTimedEndMin", "coopApplyStart",
  "fxIsClass", "fxDateList", "fxRunsOn", "fxWindow", "fxLaneOf", "fxSplitDay", "fxCtxWithClasses", "gwGetSubjects",
  "cascadeIntraWeek"
];
function runCascade(cfg) {
  const writes = [];
  const env = {
    DAY_DT: cfg.dates, WK: "week23", ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    weekData: { tasks: cfg.tasks }, checked: cfg.checked || {}, claimed: cfg.claimed || {},
    histState: {}, momMoves: {}, currData: { subjects: cfg.subjects || SUBJECTS },
    calendarData: { coops: {} },
    rulesData: cfg.rules || {}, fbCurrLoaded: true,
    _cascNowMin: cfg.nowMin || 9 * 60, DEFAULT_DAY_CAP: 9,
    smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null,
    satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {},
    lockHeldByOther: () => false, _dryRun: () => true,
    db: { ref: p => ({ update: o => { writes.push({ p, o }); return Promise.resolve(); }, set: () => Promise.resolve() }) },
    Date: frozenDate(cfg.today),
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  const body = FX_DOW_SRC + CASC_FNS.map(slice).join("\n");
  new Function(...keys, "\"use strict\";" + body + "; cascadeIntraWeek(" + (cfg.sweepToday ? "true" : "") + "); return null;")(...keys.map(k => env[k]));
  return { tasks: cfg.tasks, writes };
}
// Tuesday 2026-07-21, 9:00 AM (before school). Monday left open work; the cascade sweeps it
// into Tuesday and RE-PACKS Tuesday as one day. That re-pack is the path that lost the class.
const WEEK = { monday: "July 20", tuesday: "July 21" };
function tuesdayScenario(withClass) {
  const tasks = [];
  for (let i = 0; i < 3; i++) tasks.push(mkTask("lm" + i, "lincoln", "monday", "10:00 AM"));
  const T = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
  for (let i = 0; i < 4; i++) tasks.push(mkTask("lt" + i, "lincoln", "tuesday", T[i]));
  for (let i = 0; i < 4; i++) tasks.push(mkTask("et" + i, "ellis", "tuesday", T[i]));
  if (withClass) tasks.push(CLASSCARD("g1", "tuesday", "12:30 PM"));   // laid at the WRONG time
  const r = runCascade({ dates: WEEK, today: "2026-07-21", tasks });
  return { r, tue: who => r.tasks.filter(t => t.who === who && t.day === "tuesday") };
}
console.log("\ncascade receiving-day re-pack — WITHOUT a class (control)");
{
  const { tue } = tuesdayScenario(false);
  const lt = tue("lincoln");
  ok("monday's work was swept into tuesday", lt.length > 4, lt.length);
  ok("lincoln's tuesday starts at school start (10:00 AM)", Math.min(...lt.map(t => mins(t.time))) === 10 * 60, lt.map(t => t.time));
}
console.log("\ncascade receiving-day re-pack — WITH a 10:00 class laid at the wrong time");
{
  const { tue } = tuesdayScenario(true);
  const lt = tue("lincoln"), g = lt.find(t => t.id === "g1");
  ok("monday's work still swept in (nothing dropped)", lt.length > 5, lt.length);
  ok("the re-pack PINNED the class back to 10:00 AM", g && g.time === "10:00 AM", g && g.time);
  const others = lt.filter(t => t.id !== "g1");
  ok("no other lincoln card sits inside 10:00–10:45",
    others.every(t => mins(t.time) >= 645 || mins(t.time) + (t.dur || 20) <= 600), others.map(t => t.time + "+" + (t.dur || 20)));
  ok("work still lands after the class (the day is not truncated)", others.some(t => mins(t.time) >= 645));
  ok("no kid self-overlap on the re-laid day", (() => {
    const s = lt.map(t => [mins(t.time), mins(t.time) + (t.dur || 20)]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < s.length; i++) if (s[i][0] < s[i - 1][1]) return false; return true;
  })(), lt.map(t => t.time + "+" + (t.dur || 20)));
  ok("ellis (no class) still starts at 10:00 AM", Math.min(...tue("ellis").map(t => mins(t.time))) === 10 * 60);
}
console.log("\ncascade — a class meeting on ANOTHER date is just an ordinary card");
{
  const away = { lincoln: { outschool_german: Object.assign({}, GERMAN, { fixedDates: ["2026-07-23"] }), singapore_l: PLAIN }, ellis: { singapore_l: PLAIN }, lucy: {}, julian: {} };
  const tasks = [];
  for (let i = 0; i < 3; i++) tasks.push(mkTask("lm" + i, "lincoln", "monday", "10:00 AM"));
  for (let i = 0; i < 2; i++) tasks.push(mkTask("lt" + i, "lincoln", "tuesday", "10:00 AM"));
  tasks.push(CLASSCARD("g1", "tuesday", "12:30 PM"));
  const r = runCascade({ dates: WEEK, today: "2026-07-21", tasks, subjects: away });
  const g = r.tasks.find(t => t.id === "g1");
  ok("it is NOT pinned to 10:00", g.time !== "10:00 AM", g.time);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
