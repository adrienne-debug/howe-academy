/*
 * Node tests — 🏫 timed co-op start time survives every RE-TIMER (her "yes co-op first" 2026-09-14).
 *
 * Generation already pushed a co-op kid's start to the co-op end (2026-07-17), but the cascade's
 * receiving-day re-pack rebuilt its kidStart map from the sitter alone, so a re-laid co-op day slid
 * back to 10:00 AM (live Tue 2026-09-15 / Thu 2026-09-10). `coopApplyStart` is now the one helper
 * every ctx builder calls. This file checks the helper and the REAL cascadeIntraWeek re-pack.
 *
 *   run:  node test_coop_start.js
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
  "coopsMap", "_coopHasDate", "coopTimedEndMin", "coopApplyStart",
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
const mins = x => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(x || ""); if (!m) return 0; return (parseInt(m[1]) % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + parseInt(m[2]); };

function mkTask(id, who, day, time, opts) {
  return Object.assign({ id, who, day, time, dur: 25, device: "paper", mom: "none",
    title: "\u{1F4C4} Subject " + id + " — L" + id, subjectKey: "subj_" + id.replace(/[^a-z0-9]/gi, "") }, opts || {});
}

// The same sandbox test_cascade_offdays.js uses, plus a calendar with co-ops.
function runCascade(cfg) {
  const writes = [];
  const env = {
    DAY_DT: cfg.dates, WK: "week23", ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    weekData: { tasks: cfg.tasks }, checked: cfg.checked || {}, claimed: cfg.claimed || {},
    histState: {}, momMoves: {}, currData: { subjects: { lincoln: {}, ellis: {}, lucy: {}, julian: {} } },
    calendarData: { coops: cfg.coops || {} },
    rulesData: cfg.rules || {}, fbCurrLoaded: true,
    _cascNowMin: cfg.nowMin || 9 * 60, DEFAULT_DAY_CAP: 2,
    smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null,
    satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {},
    lockHeldByOther: () => false, _dryRun: () => true,
    db: { ref: p => ({ update: o => { writes.push({ p, o }); return Promise.resolve(); }, set: () => Promise.resolve() }) },
    Date: frozenDate(cfg.today),
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  const fn = new Function(...keys, "\"use strict\";" + FNS + "; cascadeIntraWeek(" + (cfg.sweepToday ? "true" : "") + "); return null;");
  fn(...keys.map(k => env[k]));
  return { tasks: cfg.tasks, writes };
}
function helper(coops) {
  const env = { calendarData: { coops }, ROSTER: ["lincoln", "ellis", "lucy", "julian"], Math, Object, Array, String, parseInt, isNaN };
  const keys = Object.keys(env);
  const body = ["toMin", "coopsMap", "_coopHasDate", "coopTimedEndMin", "coopApplyStart"].map(slice).join("\n");
  return new Function(...keys, "\"use strict\";" + body + "; return {coopApplyStart, coopTimedEndMin};")(...keys.map(k => env[k]));
}

const CLEVELAND = { c1: { name: "Cleveland Co-Op", mode: "timed", start: "9:00 AM", end: "2:00 PM",
  kids: ["lincoln", "lucy", "julian"], dates: ["2026-07-21"], noMomBase: true } };
const FULLDAY = { f1: { name: "Field day", mode: "fullDay", kids: ["lincoln"], dates: ["2026-07-21"] } };

console.log("coopApplyStart — the helper");
{
  const h = helper(CLEVELAND);
  ok("member kid on the co-op date → co-op end (2:00 PM)", h.coopApplyStart({}, "2026-07-21").lincoln === 14 * 60);
  ok("non-member kid untouched", h.coopApplyStart({}, "2026-07-21").ellis === undefined);
  ok("another date → nothing", Object.keys(h.coopApplyStart({}, "2026-07-22")).length === 0);
  ok("no date → map returned unchanged", Object.keys(h.coopApplyStart({}, null)).length === 0);
  ok("never LOWERS an existing start (sitter later than co-op)", h.coopApplyStart({ lincoln: 15 * 60 }, "2026-07-21").lincoln === 15 * 60);
  ok("raises an earlier existing start", h.coopApplyStart({ lincoln: 10 * 60 }, "2026-07-21").lincoln === 14 * 60);
  ok("explicit kid list honoured", Object.keys(h.coopApplyStart({}, "2026-07-21", ["lucy"])).join() === "lucy");
  ok("full-day co-op is NOT a start push (handled upstream as an off day)", Object.keys(helper(FULLDAY).coopApplyStart({}, "2026-07-21")).length === 0);
}

// Tuesday 2026-07-21, 9:00 AM (before school): Monday left open work; the cascade sweeps it into
// Tuesday, and Tuesday is RE-PACKED as one day. That re-pack is the path that lost the co-op.
// Two-day week map: Tuesday is the ONLY day that can receive Monday's sweep (the cascade picks the lightest day).
const WEEK = { monday: "July 20", tuesday: "July 21" };
function tuesdayScenario(coops) {
  const tasks = [];
  for (let i = 0; i < 3; i++) tasks.push(mkTask("lm" + i, "lincoln", "monday", "10:00 AM"));
  const T = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
  for (let i = 0; i < 4; i++) tasks.push(mkTask("lt" + i, "lincoln", "tuesday", T[i]));
  for (let i = 0; i < 4; i++) tasks.push(mkTask("et" + i, "ellis", "tuesday", T[i]));
  const r = runCascade({ dates: WEEK, today: "2026-07-21", tasks, coops });
  const tue = who => r.tasks.filter(t => t.who === who && t.day === "tuesday");
  return { r, tue };
}
console.log("\ncascade receiving-day re-pack — WITHOUT a co-op (control)");
{
  const { tue } = tuesdayScenario({});
  const lt = tue("lincoln");
  ok("monday's work was swept into tuesday", lt.length > 4, lt.length);
  ok("lincoln's tuesday starts at school start (10:00 AM)", Math.min(...lt.map(t => mins(t.time))) === 10 * 60, lt.map(t => t.time));
}
console.log("\ncascade receiving-day re-pack — Cleveland co-op until 2:00 PM (lincoln in, ellis out)");
{
  const { tue } = tuesdayScenario(CLEVELAND);
  const lt = tue("lincoln"), et = tue("ellis");
  ok("monday's work still swept into tuesday (nothing dropped)", lt.length > 4, lt.length);
  ok("EVERY lincoln tuesday card starts at or after 2:00 PM", lt.every(t => mins(t.time) >= 14 * 60), lt.map(t => t.time));
  ok("lincoln's first card is exactly 2:00 PM", Math.min(...lt.map(t => mins(t.time))) === 14 * 60, lt.map(t => t.time));
  ok("ellis (not in the co-op) still starts at 10:00 AM", Math.min(...et.map(t => mins(t.time))) === 10 * 60, et.map(t => t.time));
  ok("no kid self-overlap on lincoln's re-laid afternoon", (() => {
    const s = lt.map(t => [mins(t.time), mins(t.time) + (t.dur || 20)]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < s.length; i++) if (s[i][0] < s[i - 1][1]) return false; return true; })(), lt.map(t => t.time));
}
console.log("\ncascade — a co-op on ANOTHER date leaves tuesday alone");
{
  const other = { c2: Object.assign({}, CLEVELAND.c1, { dates: ["2026-07-23"] }) };
  const { tue } = tuesdayScenario(other);
  ok("lincoln's tuesday starts at 10:00 AM", Math.min(...tue("lincoln").map(t => mins(t.time))) === 10 * 60);
}

// THE LIVE SHAPE: generation laid the co-op day at 2:00 PM; nothing is swept in; the cascade's
// end-of-run "float earlier" pass used to pull those cards back to 10:00 AM anyway.
console.log("\ncascade float-earlier pass — a correctly laid co-op day must stay at 2:00 PM");
function floatScenario(coops) {
  const tasks = [];
  const T = ["2:00 PM", "2:25 PM", "2:50 PM"];
  for (let i = 0; i < 3; i++) tasks.push(mkTask("lt" + i, "lincoln", "tuesday", T[i]));
  tasks.push(mkTask("et0", "ellis", "tuesday", "10:00 AM"));
  tasks.push(mkTask("em0", "ellis", "monday", "10:00 AM")); // something for the cascade to sweep (ellis, not lincoln) so the run reaches its late passes
  const r = runCascade({ dates: WEEK, today: "2026-07-21", tasks, coops });
  return r.tasks.filter(t => t.who === "lincoln" && t.day === "tuesday");
}
{
  const lt = floatScenario({});
  ok("control — WITHOUT a co-op the float pass pulls lincoln's 2:00 PM cards earlier", Math.min(...lt.map(t => mins(t.time))) < 14 * 60, lt.map(t => t.time));
}
{
  const lt = floatScenario(CLEVELAND);
  ok("with the co-op every card stays at or after 2:00 PM", lt.every(t => mins(t.time) >= 14 * 60), lt.map(t => t.time));
  ok("…and untouched in place (2:00 / 2:25 / 2:50)", lt.map(t => t.time).sort().join() === ["2:00 PM", "2:25 PM", "2:50 PM"].sort().join(), lt.map(t => t.time));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
