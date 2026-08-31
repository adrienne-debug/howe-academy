/*
 * Node tests for gwAutoBalance's calendar guard.
 *
 * The bug (live, 2026-08-31): the balancer walks the UNION of dates across kids, so a
 * kid marked off (calendar/kidOverrides) still has those dates in the walk — empty, and
 * therefore ranked as their EMPTIEST days. The balancer then "evens" their week by moving
 * their subjects onto the very days the calendar took away. Ellis, marked off Mon–Wed for
 * testing with all three marks verified in the DB, was dealt those days by three
 * consecutive regenerates. Every READER honored the marks (proven by extraction against
 * the live data); the BALANCER un-honored them.
 *
 * The guard: a day the calendar says this kid is off can neither receive nor donate.
 *
 *   run:  node test_autobalance.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (m < 0) throw new Error("missing " + name);
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Week of 2026-08-31 (Mon) – 2026-09-04 (Fri). kidA loaded on Thu/Fri, empty Mon–Wed.
// kidB spread across all five (their presence is what puts Mon–Wed into the union walk).
function world(kidAOffDays) {
  const subjects = {
    kidA: { s1: { minutes: 30 }, s2: { minutes: 30 }, s3: { minutes: 30 }, s4: { minutes: 30 } },
    kidB: { b1: { minutes: 20 } },
  };
  const dayData = {
    "2026-08-31": { kidB: { b1: "L1" } },
    "2026-09-01": { kidB: { b1: "L2" } },
    "2026-09-02": { kidB: { b1: "L3" } },
    "2026-09-03": { kidA: { s1: "L1", s2: "L1" }, kidB: { b1: "L4" } },
    "2026-09-04": { kidA: { s3: "L1", s4: "L1" }, kidB: { b1: "L5" } },
  };
  const overrides = {};
  (kidAOffDays || []).forEach(d => { overrides[d] = { school: false, note: "Day off" }; });
  const ctx = {
    console, Date,
    ROSTER: ["kidA", "kidB"],
    currData: { subjects },
    calendarData: { holidays: {}, vacations: {}, kidOverrides: { kidA: overrides } },
    scheduleOverrides: {},
    rulesData: { schoolDay: {} },
    coopFullDayFor: () => null,
    gwGetSubjects: k => subjects[k] || {},
    DEFAULT_DAY_CAP: 1,
    capFor: () => 2,
  };
  vm.createContext(ctx);
  ["calNormDate", "smapIsOff", "smapIsKidOff", "schedOv", "schedOvKidOff", "gwParseDate", "gwRules", "toMin", "gwAutoBalance"]
    .forEach(n => vm.runInContext(fn(n), ctx));
  ctx.__dd = dayData;
  return vm.runInContext("gwAutoBalance(__dd, {}, [])", ctx);
}

console.log("the balancer and the calendar");
{
  // No off days: the balancer SHOULD move kidA's work onto their empty days —
  // this proves the fixture actually exercises the move path the guard must block.
  const free = world([]);
  const moved = ["2026-08-31", "2026-09-01", "2026-09-02"]
    .some(d => free[d].kidA && Object.keys(free[d].kidA).length);
  ok("without marks, empty days DO receive (the move path is live)", moved);
}
{
  // Ellis's exact shape: Mon–Wed marked off. Nothing may land there.
  const off = world(["2026-08-31", "2026-09-01", "2026-09-02"]);
  const leaked = ["2026-08-31", "2026-09-01", "2026-09-02"]
    .filter(d => off[d].kidA && Object.keys(off[d].kidA).length);
  ok("marked-off days receive NOTHING", leaked.length === 0, leaked);
  ok("the work stays on the days the kid actually has",
    Object.keys(off["2026-09-03"].kidA || {}).length + Object.keys(off["2026-09-04"].kidA || {}).length === 4);
  ok("the other kid is untouched",
    ["2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]
      .every(d => off[d].kidB && off[d].kidB.b1));
}
{
  // One off day only: the other empty days remain fair game.
  const one = world(["2026-08-31"]);
  ok("only the marked day is protected",
    !(one["2026-08-31"].kidA && Object.keys(one["2026-08-31"].kidA).length) &&
    ["2026-09-01", "2026-09-02"].some(d => one[d].kidA && Object.keys(one[d].kidA).length));
}

console.log("\nsource wiring");
{
  const ab = src.slice(src.indexOf("function gwAutoBalance"), src.indexOf("function gwAutoBalance") + 3000);
  ok("the guard sits in the day walk, before totals are counted",
    /smapIsKidOff\(kid,dk\)\|\|schedOvKidOff\(kid,dk\)/.test(ab) &&
    ab.indexOf("smapIsKidOff") < ab.indexOf("const kidTasks"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
