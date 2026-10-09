/*
 * 🌙 The 8 PM sweep leaves today's day-bound cards where they were laid (her rule 2026-10-08).
 *
 * Live: at 8:06 PM every unchecked daily on today (Reflex, Morning Notebook, drills…) and the Closing Notebook
 * were re-timed to 8:06–8:26 PM. The cascade's "pull today's elapsed day-bound cards up to now" step was meant
 * for a MID-DAY Regenerate (a 10:00 morning notebook at a 1 PM regen is still today's to do); the 8 PM sweep runs
 * the same today-elapsed path, so after school it dragged them into the evening. Day-bound cards never move days,
 * and once the school day is over they keep their own times (the "didn't fit" reminder until tomorrow).
 *
 *   · 8:06 PM sweep: Reflex / Morning Notebook / Closing Notebook keep their times on today
 *   · 1:00 PM mid-day Regenerate: an elapsed morning notebook is still pulled up to now (unchanged)
 *   · after school (5:00 PM) Regenerate: day-bound cards keep their times too
 *   run:  node test_sweep_keeps_dailies.js
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
  "subjNoCarry", "applyStickyOrder", "packDay", "packAround", "momClosingSlot",
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
function runCascade(cfg) {
  const env = {
    DAY_DT: cfg.dates, WK: "week26", ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    weekData: { tasks: cfg.tasks, babysitter: {} }, checked: cfg.checked || {}, claimed: {},
    histState: {}, momMoves: {}, currData: { subjects: cfg.subjects },
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM" } },
    fbCurrLoaded: true, _cascNowMin: cfg.nowMin, DEFAULT_DAY_CAP: 2,
    smapIsKidOff: () => null, schedOv: () => null, schedOvKidOff: () => null,
    satCutoffMin: () => null, satApplyCutoff: () => {},
    sv: () => {}, dbg: () => {}, renderAll: () => {}, safeWriteTasks: () => {},
    lockHeldByOther: () => false, _dryRun: () => true,
    db: { ref: () => ({ update: () => Promise.resolve(), set: () => Promise.resolve() }) },
    Date: frozenDate("2026-10-08"),
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, isNaN, Promise,
  };
  const keys = Object.keys(env);
  const fn = new Function(...keys, "\"use strict\";" + FNS + "; cascadeIntraWeek(true); return null;");
  fn(...keys.map(k => env[k]));
  return cfg.tasks;
}
const WEEK = { monday: "October 5", tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9" };
const SUBJ = { ellis: { morning_nb: { noCarry: true }, closing_nb: { noCarry: true }, drills: { tracking: "daily" }, math: {} } };
function day(extra) {
  return [
    { id: "mn", who: "ellis", day: "thursday", time: "10:00 AM", dur: 15, title: "📓 Morning Notebook", subjectKey: "morning_nb", mom: "none", device: "paper" },
    { id: "rf", who: "ellis", day: "thursday", time: "10:40 AM", dur: 20, title: "⚡ Reflex", subjectKey: "reflex", mom: "none", device: "computer" },
    { id: "dr", who: "ellis", day: "thursday", time: "11:00 AM", dur: 10, title: "🎧 Drills", subjectKey: "drills", mom: "none", device: "paper" },
    { id: "cn", who: "ellis", day: "thursday", time: "3:55 PM", dur: 20, title: "📓 Closing Notebook", subjectKey: "closing_nb", mom: "none", device: "paper" },
    { id: "mf", who: "ellis", day: "friday", time: "10:00 AM", dur: 15, title: "📓 Morning Notebook", subjectKey: "morning_nb", mom: "none", device: "paper" },
  ].concat(extra || []);
}
const at = (ts, id) => ts.find(t => t.id === id);

console.log("🌙 8:06 PM sweep — nothing else left to sweep");
{
  const ts = runCascade({ dates: WEEK, nowMin: 20 * 60 + 6, tasks: day(), subjects: SUBJ });
  ok("Morning Notebook stays 10:00 AM on Thursday", at(ts, "mn").time === "10:00 AM" && at(ts, "mn").day === "thursday", at(ts, "mn"));
  ok("Reflex stays 10:40 AM", at(ts, "rf").time === "10:40 AM" && at(ts, "rf").day === "thursday", at(ts, "rf"));
  ok("Drills stay 11:00 AM", at(ts, "dr").time === "11:00 AM", at(ts, "dr"));
  ok("Closing Notebook stays 3:55 PM", at(ts, "cn").time === "3:55 PM" && at(ts, "cn").day === "thursday", at(ts, "cn"));
}
console.log("\n🌙 8:06 PM sweep — with a graded lesson that fell off today (the sweep's full path)");
{
  const extra = [{ id: "m1", who: "ellis", day: "thursday", time: "2:00 PM", dur: 30, title: "📐 Math — L5", subjectKey: "math", mom: "none", device: "paper" }];
  const ts = runCascade({ dates: WEEK, nowMin: 20 * 60 + 6, tasks: day(extra), subjects: SUBJ });
  ok("the graded lesson moved into the rest of the week", at(ts, "m1").day !== "thursday", at(ts, "m1"));
  ok("Morning Notebook stays 10:00 AM Thursday", at(ts, "mn").time === "10:00 AM" && at(ts, "mn").day === "thursday", at(ts, "mn"));
  ok("Reflex stays 10:40 AM Thursday", at(ts, "rf").time === "10:40 AM" && at(ts, "rf").day === "thursday", at(ts, "rf"));
  ok("Drills stay 11:00 AM Thursday", at(ts, "dr").time === "11:00 AM" && at(ts, "dr").day === "thursday", at(ts, "dr"));
  ok("Closing Notebook stays 3:55 PM Thursday", at(ts, "cn").time === "3:55 PM" && at(ts, "cn").day === "thursday", at(ts, "cn"));
  const late = ts.filter(t => t.day === "thursday" && toMin(t.time) >= 20 * 60);
  ok("no card on today sits in the evening (8 PM+)", late.length === 0, late.map(t => t.id + "@" + t.time));
}
console.log("\n🔄 1:00 PM mid-day Regenerate — elapsed dailies still come up to now (unchanged)");
{
  const ts = runCascade({ dates: WEEK, nowMin: 13 * 60, tasks: day(), subjects: SUBJ });
  ok("Reflex (10:40, elapsed) pulled up to 1:00 PM or later", toMin(at(ts, "rf").time) >= 13 * 60, at(ts, "rf"));
  ok("…on Thursday still", at(ts, "rf").day === "thursday");
}
console.log("\n🔄 5:00 PM Regenerate (school over) — day-bound cards keep their times");
{
  const ts = runCascade({ dates: WEEK, nowMin: 17 * 60, tasks: day(), subjects: SUBJ });
  ok("Reflex stays 10:40 AM", at(ts, "rf").time === "10:40 AM", at(ts, "rf"));
  ok("Closing stays 3:55 PM", at(ts, "cn").time === "3:55 PM", at(ts, "cn"));
}
function toMin(s) { const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
