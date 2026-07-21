/*
 * Node tests for cascadeIntraWeek's off-day handling in vacation-shortened weeks.
 *
 * Slices the REAL cascadeIntraWeek (+ its real helpers: packers, sticky order,
 * task metadata, catch-up caps) out of index.html, pins the clock, and asserts:
 *
 *   - overflow NEVER lands on a weekday absent from the week's date map
 *     (the bug that parked 13 tasks on beach-trip Thu/Fri of week14)
 *   - work stranded on a date-less day is swept back onto real school days
 *   - Saturday (date derived from Friday+1) still behaves: not swept as
 *     "nonexistent", still a legal overflow target in a full week
 *   - with NO date map loaded (pre-meta boot) the old behavior is preserved
 *   - a day that IS in the map but calendar-off for the kid stays skipped
 *
 *   run:  node test_cascade_offdays.js
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
const FNS = [
  "toMin", "fromMin", "_parseCheckTs", "_dismissed", "_normOrderArr",
  "taskDevice", "taskSubject", "taskTier", "catchupDayCap", "isCatchupCapped",
  "subjNoCarry", "applyStickyOrder", "packDay", "packAround",
  "cascadeIntraWeek"
].map(slice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Frozen clock helper — cascadeIntraWeek derives "today" from new Date()
const RealDate = Date;
function frozenDate(iso) {
  return class Frozen extends RealDate {
    constructor(...a) { if (a.length === 0) super(iso + "T09:00:00"); else super(...a); }
    static now() { return new RealDate(iso + "T09:00:00").getTime(); }
  };
}

function mkTask(id, day, time, opts) {
  return Object.assign({ id, who: "lincoln", day, time, dur: 25, device: "paper", mom: "none",
    title: "\u{1F4C4} Subject " + id + " — L" + id, subjectKey: "subj_" + id.replace(/[^a-z0-9]/gi, "") }, opts || {});
}

function runCascade(cfg) {
  const writes = [];
  const env = {
    DAY_DT: cfg.dates, WK: "week14", ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    weekData: { tasks: cfg.tasks }, checked: cfg.checked || {}, claimed: {},
    histState: {}, momMoves: {}, currData: { subjects: { lincoln: {}, ellis: {}, lucy: {}, julian: {} } },
    rulesData: cfg.rules || {}, fbCurrLoaded: true,
    _cascNowMin: cfg.nowMin || 9 * 60, DEFAULT_DAY_CAP: 2,
    smapIsKidOff: cfg.kidOff || (() => null),
    schedOv: () => null, schedOvKidOff: () => null,
    satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {},
    lockHeldByOther: cfg.lockHeld ? (() => true) : (() => false),
    _dryRun: () => true,
    db: { ref: p => ({ update: o => { writes.push({ p, o }); return Promise.resolve(); }, set: () => Promise.resolve() }) },
    Date: frozenDate(cfg.today),
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  const fn = new Function(...keys, "\"use strict\";" + FNS + "; cascadeIntraWeek(" + (cfg.sweepToday ? "true" : "") + "); return null;");
  fn(...keys.map(k => env[k]));
  return { tasks: cfg.tasks, writes };
}

const daysOf = tasks => { const m = {}; tasks.forEach(t => { m[t.day] = (m[t.day] || 0) + 1; }); return m; };
const mins = x => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(x || ""); if (!m) return 0; return (parseInt(m[1]) % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + parseInt(m[2]); };
const WEEK3 = { monday: "July 20", tuesday: "July 21", wednesday: "July 22" }; // beach-trip week
const WEEK5 = { monday: "July 20", tuesday: "July 21", wednesday: "July 22", thursday: "July 23", friday: "July 24" };

console.log("3-day week — overflow never lands on date-less days");
{
  // Tuesday; Monday left 14 unchecked 25-min tasks (~6h) — far more than Tue+Wed can absorb.
  const tasks = [];
  for (let i = 0; i < 14; i++) tasks.push(mkTask("m" + i, "monday", "10:00 AM"));
  for (let i = 0; i < 10; i++) tasks.push(mkTask("t" + i, "tuesday", "10:00 AM"));
  for (let i = 0; i < 10; i++) tasks.push(mkTask("w" + i, "wednesday", "10:00 AM"));
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks });
  const d = daysOf(r.tasks);
  ok("nothing on thursday/friday/saturday", !d.thursday && !d.friday && !d.saturday, d);
  ok("monday's work went somewhere real", (d.tuesday || 0) + (d.wednesday || 0) + (d.monday || 0) === 34, d);
  const swept = r.tasks.filter(t => t.cascadedFrom === "monday" && t.day !== "monday");
  ok("sweep actually ran (monday work moved)", swept.length > 0, swept.length);
}

console.log("3-day week — stranded tasks self-heal off date-less days");
{
  // The real week14 shape: cascade-stranded tasks sitting on vacation Thu/Fri.
  const tasks = [
    mkTask("a", "tuesday", "10:00 AM"), mkTask("b", "wednesday", "10:00 AM"),
    mkTask("s1", "thursday", "10:00 AM", { cascadedFrom: "monday", cascade: true }),
    mkTask("s2", "friday", "10:00 AM", { cascadedFrom: "monday", cascade: true }),
  ];
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks });
  const d = daysOf(r.tasks);
  ok("thursday/friday emptied", !d.thursday && !d.friday, d);
  const healed = r.tasks.filter(t => t.id === "s1" || t.id === "s2");
  ok("stranded tasks moved to real days", healed.every(t => ["tuesday", "wednesday"].includes(t.day)), healed.map(t => t.day));
}

console.log("full week — Saturday still derives its date and behaves");
{
  // Saturday school task; today Wednesday. Saturday has no meta date (normal) but
  // derives Friday+1 → it exists, is NOT stranded-swept, and remains a target.
  const tasks = [
    mkTask("sat1", "saturday", "10:00 AM"),
    mkTask("w1", "wednesday", "10:00 AM"),
  ];
  const r = runCascade({ dates: WEEK5, today: "2026-07-22", tasks });
  const sat = r.tasks.find(t => t.id === "sat1");
  ok("saturday task stays put", sat.day === "saturday", sat.day);
}
{
  // Overflow in a full week may still chain toward Friday/Saturday (unchanged behavior)
  const tasks = [];
  for (let i = 0; i < 14; i++) tasks.push(mkTask("m" + i, "monday", "10:00 AM"));
  for (let i = 0; i < 10; i++) tasks.push(mkTask("t" + i, "tuesday", "10:00 AM"));
  for (let i = 0; i < 10; i++) tasks.push(mkTask("w" + i, "wednesday", "10:00 AM"));
  const r = runCascade({ dates: WEEK5, today: "2026-07-21", tasks });
  const d = daysOf(r.tasks);
  ok("full week: thursday/friday ARE valid receiving days", (d.thursday || 0) + (d.friday || 0) > 0, d);
}

console.log("pre-meta boot (no date map) — old behavior preserved");
{
  const tasks = [
    mkTask("th1", "thursday", "10:00 AM"),
    mkTask("t1", "tuesday", "10:00 AM"),
  ];
  const r = runCascade({ dates: {}, today: "2026-07-21", tasks });
  const th = r.tasks.find(t => t.id === "th1");
  ok("future-weekday task not treated as stranded", th.day === "thursday", th.day);
}

console.log("calendar-off day inside the map still skipped");
{
  // Thursday in the map but the kid is off (holiday) — overflow skips it per kid.
  const tasks = [];
  for (let i = 0; i < 14; i++) tasks.push(mkTask("m" + i, "monday", "10:00 AM"));
  for (let i = 0; i < 10; i++) tasks.push(mkTask("t" + i, "tuesday", "10:00 AM"));
  for (let i = 0; i < 10; i++) tasks.push(mkTask("w" + i, "wednesday", "10:00 AM"));
  const r = runCascade({ dates: WEEK5, today: "2026-07-21", tasks,
    kidOff: (kid, ds) => ds === "2026-07-23" ? "Holiday" : null });
  const d = daysOf(r.tasks);
  ok("off thursday skipped, friday still used", !d.thursday && (d.friday || 0) > 0, d);
}

console.log("retrieval slots — day-bound, never swept or stacked");
{
  // Monday's missed Sprint was cascade-stranded onto Wednesday (colliding with
  // Wednesday's own slot). Day-bound snap-back must send it home as missed, and
  // a plain missed slot must not sweep forward at all.
  const tasks = [
    mkTask("2026d200_retr_sprint_lincoln", "wednesday", "2:55 PM",
      { subjectKey: "retrieval", title: "🏃 Sprint", cascadedFrom: "monday", cascade: true }),
    mkTask("2026d202_retr_sprint_lincoln", "wednesday", "3:35 PM",
      { subjectKey: "retrieval", title: "🏃 Sprint" }),
    mkTask("m1", "monday", "10:00 AM"),
    mkTask("t1", "tuesday", "10:00 AM"),
  ];
  const r = runCascade({ dates: WEEK5, today: "2026-07-21", tasks });
  const strayed = r.tasks.find(t => t.id === "2026d200_retr_sprint_lincoln");
  const own = r.tasks.find(t => t.id === "2026d202_retr_sprint_lincoln");
  ok("stranded slot snapped back to its own day (missed)", strayed.day === "monday" && !strayed.cascadedFrom, strayed.day);
  ok("wednesday keeps exactly its own slot", own.day === "wednesday");
  const wedSprints = r.tasks.filter(t => t.day === "wednesday" && t.subjectKey === "retrieval");
  ok("no double sprint on one day", wedSprints.length === 1, wedSprints.length);
  const m1 = r.tasks.find(t => t.id === "m1");
  ok("real lessons still sweep normally", m1.day !== "monday", m1.day);
  ok("no retrieval slot in the carry box", !r.tasks.some(t => t.subjectKey === "retrieval" && t._eowOverflow));
}

console.log("shortened week — overtime opens on the last REAL day");
{
  // Heavy backlog, 3-day week: without the last-valid-day fix no day counts as
  // "last", overtime never opens, and fittable work gets parked for next week.
  const tasks = [];
  for (let i = 0; i < 16; i++) tasks.push(mkTask("m" + i, "monday", "10:00 AM"));
  for (let i = 0; i < 8; i++) tasks.push(mkTask("t" + i, "tuesday", "10:00 AM"));
  for (let i = 0; i < 8; i++) tasks.push(mkTask("w" + i, "wednesday", "10:00 AM"));
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks });
  const late = r.tasks.filter(t => t.day === "wednesday" && mins(t.time) + (t.dur || 20) > mins("4:15 PM"));
  ok("wednesday runs overtime (past 4:15)", late.length > 0, late.length);
  ok("still nothing on vacation days", !r.tasks.some(t => ["thursday", "friday", "saturday"].includes(t.day)));
}

console.log("carry box — parked work re-validated every sweep");
{
  // A stale _eowOverflow flag (fossil of an earlier sweep) on a lesson that fits
  // today: the sweep re-pools it, places it, and clears the flag.
  const tasks = [
    mkTask("fossil", "wednesday", "2:20 PM", { _eowOverflow: true }),
    mkTask("t1", "tuesday", "10:00 AM"),
  ];
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks });
  const f = r.tasks.find(t => t.id === "fossil");
  ok("stale flag cleared and lesson re-placed", !f._eowOverflow && ["tuesday", "wednesday"].includes(f.day), f);
}
{
  // Genuinely unfittable work stays parked: longer than any remaining day even
  // with the overtime valve open.
  const tasks = [
    mkTask("fossil", "wednesday", "2:20 PM", { _eowOverflow: true, dur: 600 }),
    mkTask("t1", "tuesday", "10:00 AM"),
  ];
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks });
  const f = r.tasks.find(t => t.id === "fossil");
  ok("truly unfittable work re-parks", f._eowOverflow === true, f);
}

console.log("regen re-packs the WHOLE remaining day — Mom work first");
{
  // 10:20 AM regenerate. Lucy's Mom-required lesson sat at an elapsed slot (10:05);
  // her independent iPad apps hold not-yet-started slots (10:25, 11:00). The old rule
  // froze the iPad block and appended Mom's work after it (Mom idle till noon); a
  // regen must re-pack the whole remaining day in workflow order instead.
  const WF = { workflow: { lucy: { normal: [
    { label: "Mom Required", subjects: ["Dimensions Math 1A"], tier: "required" },
    { label: "Independent", subjects: ["Reading Eggs"], tier: "independent" },
  ] } } };
  const tasks = [
    mkTask("dim", "tuesday", "10:05 AM", { who: "lucy", mom: "required", title: "📄 Dimensions Math 1A — Lesson 9", subjectKey: "dimensions_math_1a" }),
    mkTask("egg1", "tuesday", "10:25 AM", { who: "lucy", mom: "none", device: "ipad", title: "📱 Reading Eggs — Map 20 L1", subjectKey: "read_eggs" }),
    mkTask("egg2", "tuesday", "11:00 AM", { who: "lucy", mom: "none", device: "ipad", title: "📱 Reading Eggs — Map 20 L2", subjectKey: "read_eggs" }),
  ];
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks, rules: WF, nowMin: 10 * 60 + 20, sweepToday: true });
  const dim = r.tasks.find(t => t.id === "dim");
  const todayEggs = r.tasks.filter(t => t.id.indexOf("egg") === 0 && t.day === "tuesday");
  ok("nothing unchecked left in TODAY's elapsed time", r.tasks.filter(t => t.day === "tuesday").every(t => mins(t.time) >= 10 * 60 + 20), r.tasks.map(t => t.day + " " + t.time));
  ok("Mom-required re-packed to the first free minute", dim.day === "tuesday" && mins(dim.time) <= 10 * 60 + 30, dim.day + " " + dim.time);
  ok("independent work follows Mom work, not leads", todayEggs.length > 0 && todayEggs.every(e => mins(e.time) > mins(dim.time)), todayEggs.map(e => e.time));
}

console.log("scheduler lock — foreign lock makes the sweep a no-op");
{
  const tasks = [];
  for (let i = 0; i < 14; i++) tasks.push(mkTask("m" + i, "monday", "10:00 AM"));
  const before = JSON.stringify(tasks);
  const r = runCascade({ dates: WEEK3, today: "2026-07-21", tasks, lockHeld: true });
  ok("nothing moved while another device schedules", JSON.stringify(r.tasks) === before);
  ok("nothing written while another device schedules", r.writes.length === 0, r.writes.length);
}

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
