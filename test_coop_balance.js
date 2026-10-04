/*
 * Node tests for gwAutoBalance on a timed co-op day (COOP_BALANCE, 2026-10-04).
 *
 * The bug (DeWalt Week 1 preview): co-op Thursday 9–3 holds only the kids' dailies, so the
 * balancer — which counted the whole 9–4 school day — ranked it the EMPTIEST day and evened
 * Penmanship / Handwriting / Typing / an IEW day onto it, stacked 2–3 deep after co-op, while
 * Tue/Wed lost theirs. Fix: on a timed co-op date the kid's day starts at co-op end.
 *
 *   run:  node test_coop_balance.js
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

const MON = "2026-10-05", TUE = "2026-10-06", WED = "2026-10-07", THU = "2026-10-08", FRI = "2026-10-09";
const DAYS = [MON, TUE, WED, THU, FRI];
// Kenzie's shape: four book lessons Mon–Wed + Fri (none on co-op Thu), dailies every day.
function world(coopEnd) {
  const subjects = { kid: {
    cle: { minutes: 30 }, math: { minutes: 20 }, iew: { minutes: 20 }, aas: { minutes: 20 },
    pen: { minutes: 10 }, piano: { minutes: 20 }, read: { minutes: 30 }, wr: { minutes: 20 } } };
  const dayData = {};
  DAYS.forEach((d, i) => {
    const k = { pen: "Daily", piano: "Daily", read: "Daily", wr: "Daily" };
    if (d !== THU) Object.assign(k, { cle: "L" + i, math: "L" + i, iew: "L" + i, aas: "L" + i });
    dayData[d] = { kid: k };
  });
  const ctx = {
    console, Date,
    ROSTER: ["kid"],
    currData: { subjects },
    calendarData: { holidays: {}, vacations: {}, kidOverrides: {} },
    scheduleOverrides: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    coopFullDayFor: () => null,
    gwGetSubjects: k => subjects[k] || {},
    DEFAULT_DAY_CAP: 1,
    capFor: () => 2,
  };
  if (coopEnd !== undefined) ctx.coopTimedEndMin = (kid, ds) => (ds === THU ? coopEnd : 0);
  vm.createContext(ctx);
  ["calNormDate", "smapIsOff", "smapIsKidOff", "schedOv", "schedOvKidOff", "gwParseDate", "gwRules", "toMin", "gwAutoBalance"]
    .forEach(n => vm.runInContext(fn(n), ctx));
  ctx.__dd = dayData;
  return vm.runInContext("gwAutoBalance(__dd, {}, [])", ctx);
}
const keys = (r, d) => Object.keys((r[d] || {}).kid || {}).sort();
const stacked = r => DAYS.some(d => Object.values((r[d] || {}).kid || {}).some(v => Array.isArray(v)));

console.log("co-op Thursday and the balancer");
{
  const ctl = world(undefined);   // no co-op helper = the old behaviour
  ok("control: without the co-op start, Thursday RECEIVES work (the bug path is live)",
    keys(ctl, THU).length > 4, keys(ctl, THU));
}
{
  const co = world(15 * 60);      // co-op until 3:00 PM
  ok("co-op until 3: Thursday receives nothing", keys(co, THU).join() === "pen,piano,read,wr", keys(co, THU));
  ok("no subject stacks anywhere", !stacked(co));
  ok("every other day keeps all 8 subjects", [MON, TUE, WED, FRI].every(d => keys(co, d).length === 8),
    [MON, TUE, WED, FRI].map(d => keys(co, d).length));
  ok("lesson values stay in order (Mon L0 … Fri L4)", co[MON].kid.cle === "L0" && co[FRI].kid.cle === "L4");
}
{
  const none = world(0);          // helper present, no co-op that day → identical to the old math
  const ctl = world(undefined);
  ok("a day with no timed co-op balances exactly as before", JSON.stringify(none) === JSON.stringify(ctl));
}
{
  const early = world(11 * 60);   // morning-only co-op (out by 11) leaves a real afternoon
  ok("a morning co-op still lets the afternoon take a little work", keys(early, THU).length >= 4);
}

console.log("\nsource wiring");
{
  const ab = src.slice(src.indexOf("function gwAutoBalance"), src.indexOf("function gwAutoBalance") + 6000);
  ok("capacity reads the kid's timed co-op end (guarded)", /typeof coopTimedEndMin==="function"\)\?coopTimedEndMin\(kid,dk\)/.test(ab));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
