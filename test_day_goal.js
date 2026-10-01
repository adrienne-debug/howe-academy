/*
 * 🎯 DAYGOAL — "whatever is on the day at 9:59 is the goal for the day" (her rule 2026-10-01).
 *
 * Once school has started, the cascade never ADDS a card to today: swept work from earlier days, re-validated parked
 * overflow and later-day lessons all land tomorrow onward (or the carry-over box). Today's own cards (a mid-day
 * regenerate re-flowing elapsed slots) may still re-lay on today. Before school starts, today lays as before.
 *
 * Live 2026-10-01: every check-off ran a cascade pass that packed Monday's leftovers, Friday's Math Reasoning and last
 * week's parked extras into Ellis's Thursday after "now" — his day grew all afternoon (18 cards by 3 PM).
 *
 *   · live snapshot (test_fixtures/week25_tasks_2026-10-01_midday.json), clock Thursday 1:00 PM: a pass moves 0 cards
 *     onto Thursday, while past-day work still sweeps (it lands Friday / Saturday / the box)
 *   · synthetic, mid-day: Monday's leftover for a kid with room on Thursday lands Friday, not Thursday
 *   · synthetic, mid-day regenerate: today's own elapsed card re-lays on today after "now"
 *   · synthetic, before school: Monday's leftover may still land on today (unchanged behaviour)
 *   run:  node test_day_goal.js
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
  "taskDevice", "taskSubject", "taskTier", "capFor", "capForDisplay", "catchupDayCap", "isCatchupCapped",
  "subjNoCarry", "applyStickyOrder", "packDay", "packAround",
  "cascadeIntraWeek"
].map(slice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

const RealDate = Date;
function frozenDate(iso) {
  return class Frozen extends RealDate {
    constructor(...a) { if (a.length === 0) super(iso + "T09:00:00"); else super(...a); }
    static now() { return new RealDate(iso + "T09:00:00").getTime(); }
  };
}
function mkTask(id, who, day, time, opts) {
  return Object.assign({ id, who, day, time, dur: 25, device: "paper", mom: "none",
    title: "\u{1F4C4} Subject " + id + " — L" + id, subjectKey: "subj_" + id.replace(/[^a-z0-9]/gi, "") }, opts || {});
}
function runCascade(cfg) {
  const env = {
    DAY_DT: cfg.dates, WK: "week25", ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    weekData: { tasks: cfg.tasks, babysitter: cfg.babysitter || {} }, checked: cfg.checked || {}, claimed: cfg.claimed || {},
    histState: {}, momMoves: {}, currData: { subjects: cfg.subjects || { lincoln: {}, ellis: {}, lucy: {}, julian: {} } },
    rulesData: cfg.rules || {}, fbCurrLoaded: true,
    _cascNowMin: cfg.nowMin, DEFAULT_DAY_CAP: 2,
    smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null,
    satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {},
    lockHeldByOther: () => false, _dryRun: () => true,
    db: { ref: () => ({ update: () => Promise.resolve(), set: () => Promise.resolve() }) },
    Date: frozenDate(cfg.today),
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  const fn = new Function(...keys, "\"use strict\";" + FNS + "; cascadeIntraWeek(" + (cfg.sweepToday ? "true" : "") + "); return null;");
  fn(...keys.map(k => env[k]));
  return cfg.tasks;
}
const WEEK = { monday: "September 28", tuesday: "September 29", wednesday: "September 30", thursday: "October 1", friday: "October 2" };
const onDay = (tasks, d) => new Set(tasks.filter(t => t.day === d && !String(t.id).endsWith("_c")).map(t => t.id));

console.log("🎯 live snapshot, Thursday 1:00 PM — a pass adds nothing to today");
{
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "week25_tasks_2026-10-01_midday.json"), "utf8"));
  const tasks = Object.values(fx.tasks).map(t => Object.assign({}, t));
  const before = onDay(tasks, "thursday");
  const pastBefore = tasks.filter(t => ["monday", "tuesday", "wednesday"].includes(t.day) && !fx.checked[t.id]).map(t => t.id);
  runCascade({ dates: fx.dates, today: "2026-10-01", nowMin: 13 * 60, tasks, checked: fx.checked || {}, claimed: fx.claimed || {}, subjects: fx.subjects, rules: fx.rules || {} });
  const after = onDay(tasks, "thursday");
  const joined = [...after].filter(id => !before.has(id));
  ok("no card joined Thursday", joined.length === 0, joined);
  const moved = pastBefore.filter(id => { const t = tasks.find(x => x.id === id); return t && !["monday", "tuesday", "wednesday"].includes(t.day); });
  ok("past-day work still swept forward (to Friday/Saturday)", moved.length > 0, moved.length);
  ok("…and none of it onto Thursday", moved.every(id => tasks.find(x => x.id === id).day !== "thursday"));
  const ellisThu = tasks.filter(t => t.who === "ellis" && t.day === "thursday").length;
  ok("Ellis's Thursday kept its count (" + ellisThu + ")", ellisThu === [...before].filter(id => (fx.tasks[id] || {}).who === "ellis").length, ellisThu);
}

console.log("🎯 synthetic, Thursday 1:00 PM — Monday's leftover lands Friday, not today (room on Thursday)");
{
  const tasks = [
    mkTask("m1", "ellis", "monday", "10:00 AM"),
    mkTask("t1", "ellis", "thursday", "10:00 AM"),
    mkTask("f1", "ellis", "friday", "10:00 AM"),
  ];
  runCascade({ dates: WEEK, today: "2026-10-01", nowMin: 13 * 60, tasks, checked: { t1: "10:20 AM Oct 1" } });
  const m1 = tasks.find(t => t.id === "m1");
  ok("Monday's card did not land on Thursday", m1.day !== "thursday", m1.day);
  ok("…it landed on Friday", m1.day === "friday", m1.day);
  ok("it is stamped as swept from Monday", m1.cascadedFrom === "monday", m1.cascadedFrom);
}

console.log("🎯 synthetic, Thursday 2:30 PM regenerate — today's own elapsed card re-lays on today after now");
{
  const tasks = [
    mkTask("e1", "ellis", "thursday", "1:00 PM"),   // elapsed, undone
    mkTask("f1", "ellis", "friday", "10:00 AM"),
  ];
  runCascade({ dates: WEEK, today: "2026-10-01", nowMin: 14 * 60 + 30, tasks, sweepToday: true });
  const e1 = tasks.find(t => t.id === "e1");
  ok("today's elapsed card stays on Thursday", e1.day === "thursday", e1.day);
  ok("…re-timed to now or later", toMinT(e1.time) >= 14 * 60 + 30, e1.time);
}

console.log("🎯 synthetic, Thursday 9:30 AM (before school) — Monday's leftover may still join today");
{
  const tasks = [
    mkTask("m1", "ellis", "monday", "10:00 AM"),
    mkTask("t1", "ellis", "thursday", "10:00 AM"),
    mkTask("f1", "ellis", "friday", "10:00 AM"),
    mkTask("f2", "ellis", "friday", "10:30 AM"),
  ];
  runCascade({ dates: WEEK, today: "2026-10-01", nowMin: 9 * 60 + 30, tasks });
  const m1 = tasks.find(t => t.id === "m1");
  ok("before school, Monday's card lands on Thursday (unchanged)", m1.day === "thursday", m1.day);
}

console.log("wiring");
ok("DAYGOAL block present", src.indexOf("// DAYGOAL_START") > 0 && src.indexOf("// DAYGOAL_END") > src.indexOf("// DAYGOAL_START"));
ok("subject-spread skips today mid-day for arrivals", /if\(dn===today&&!_todayOpen&&!_fromToday\.has\(t\)\) return false;/.test(src));
ok("receiving-day loop keeps only today's own cards mid-day", /if\(dn===today&&!_todayOpen\) tryHere=tryHere\.filter\(t=>_fromToday\.has\(t\)\);/.test(src));
ok("today's own pooled cards are tagged", /if\(idx===todayIdx\) _fromToday\.add\(t\);/.test(src));

function toMinT(s) { const m = /(\d+):(\d+)\s*([AP]M)/.exec(s || ""); if (!m) return 0; return (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2]; }
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
