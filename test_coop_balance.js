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


// ── 🏫 COOPWEEKDAYS (Sarah's ask 2026-10-13): the balancer doesn't undo the no-co-op week's day set ──
// Kenzie's 4×/wk subjects: allowedDays Mon/Tue/Wed/Fri (co-op weeks), noCoopDays Mon/Tue/Wed/Thu (weeks without).
// WK2 (10/12–16) has no co-op, so the lay puts them on Mon–Thu and Friday holds only dailies: Friday is the lightest
// day and the old balancer would have evened a lesson back onto it. With subjDaysFor in play it may not.
console.log("\nweeks without co-op (noCoopDays) and the balancer");
{
  const COOPFNS = [fn("coopsMap"), fn("_coopHasDate"), fn("_pjWeekKey")].join("\n") + "\n" + src.slice(src.indexOf("// COOPWEEKDAYS_START"), src.indexOf("// COOPWEEKDAYS_END"));
  const COOPS = { cg: { name: "China-Grove Co-Op", mode: "timed", start: "9:00 AM", end: "3:00 PM", kids: ["kid"], dates: ["2026-10-08", "2026-10-22"] } };
  function world2(dates, lessonDays, withField) {
    const MTWF = ["Mon", "Tue", "Wed", "Fri"], MTWT = ["Mon", "Tue", "Wed", "Thu"];
    const book = () => Object.assign({ allowedDays: MTWF.slice() }, withField ? { noCoopDays: MTWT.slice() } : {});
    const subjects = { kid: {
      cle: Object.assign({ minutes: 30 }, book()), math: Object.assign({ minutes: 20 }, book()), iew: Object.assign({ minutes: 20 }, book()), aas: Object.assign({ minutes: 20 }, book()),
      pen: { minutes: 10 }, piano: { minutes: 20 }, read: { minutes: 30 }, wr: { minutes: 20 } } };
    const dayData = {};
    dates.forEach((d, i) => { const k = { pen: "Daily", piano: "Daily", read: "Daily", wr: "Daily" }; if (lessonDays.indexOf(d) >= 0) Object.assign(k, { cle: "L" + i, math: "L" + i, iew: "L" + i, aas: "L" + i }); dayData[d] = { kid: k }; });
    const ctx = { console, Date, Math, JSON, Object, Array, String, Number, parseInt, isNaN, ROSTER: ["kid"], currData: { subjects },
      calendarData: { holidays: {}, vacations: {}, kidOverrides: {}, coops: JSON.parse(JSON.stringify(COOPS)) }, scheduleOverrides: {},
      rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
      coopFullDayFor: () => null, coopTimedEndMin: (kid, ds) => (ds === "2026-10-08" ? 15 * 60 : 0), gwGetSubjects: k => subjects[k] || {}, DEFAULT_DAY_CAP: 1,
      capFor: (k, key) => (["pen", "piano", "read", "wr"].indexOf(key) >= 0 ? 1 : 2) };   // dailies are once-a-day (cap 1), book lessons may double
    vm.createContext(ctx);
    ["calNormDate", "smapIsOff", "smapIsKidOff", "schedOv", "schedOvKidOff", "gwParseDate", "gwRules", "toMin", "gwAutoBalance"].forEach(n => vm.runInContext(fn(n), ctx));
    vm.runInContext(COOPFNS, ctx);
    ctx.__dd = dayData;
    return vm.runInContext("gwAutoBalance(__dd, {}, [])", ctx);
  }
  const W2 = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"], W2_THU = "2026-10-15", W2_FRI = "2026-10-16";
  const ctl = world2(W2, W2.slice(0, 3).concat([W2_FRI]), false);     // no field: the lay itself used Friday
  ok("control (no field): a Mon/Tue/Wed/Fri lay stays off Thursday", keys(ctl, W2_THU).join() === "pen,piano,read,wr" && !stacked(ctl), keys(ctl, W2_THU));
  const nc = world2(W2, W2.slice(0, 4), true);                           // field: the lay used Mon–Thu, Friday is light
  ok("no-co-op week: Friday receives NONE of the Mon–Thu subjects", keys(nc, W2_FRI).join() === "pen,piano,read,wr", keys(nc, W2_FRI));
  ok("…Thursday keeps all 8, nothing stacks, order kept", keys(nc, W2_THU).length === 8 && !stacked(nc) && nc[W2[0]].kid.cle === "L0" && nc[W2_THU].kid.cle === "L3", keys(nc, W2_THU));
  const W1 = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];
  const co = world2(W1, W1.slice(0, 3).concat(["2026-10-09"]), true);   // co-op week: allowedDays rule, Thursday is co-op
  ok("co-op week with the field set: Thursday still receives nothing (allowedDays + co-op start)", keys(co, "2026-10-08").join() === "pen,piano,read,wr" && !stacked(co), keys(co, "2026-10-08"));
  ok("wiring: the balancer's day guard asks subjDaysFor per date, guarded", /try\{ if\(typeof subjDaysFor==="function"\) allowed=subjDaysFor\(kid,subjects\[key\],dk\); \}catch\(e\)\{\}/.test(fn("gwAutoBalance")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
