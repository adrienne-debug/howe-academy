/*
 * 🏫 COOP_FAMROOM (her "yes to fix" 2026-10-04) — the balancer's room on a co-op day counts the kid's family time.
 * Replay of DeWalt Week 1 (Andrew): co-op Thu 10/8 until 3:00, school ends 4:00. Thursday holds Independent Reading 20 +
 * Piano 20 (Handwriting skips co-op days) + Fact Review 15 (family, scheduler picks) = 55 of 60. Before the fix the
 * balancer saw 20 min free and moved Monday's Independent Reading onto Thursday (two that day, none Monday).
 *   run:  node test_coop_famroom.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (m < 0) throw new Error("missing " + name);
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }

const MON = "2026-10-05", TUE = "2026-10-06", WED = "2026-10-07", THU = "2026-10-08", FRI = "2026-10-09";
const DAYS = [MON, TUE, WED, THU, FRI];
// opts.fam: undefined = no famAutoUnits helper (old path) · number = Fact Review minutes for Andrew every day
function world(opts) {
  opts = opts || {};
  const subjects = { andrew: { aas: { minutes: 10 }, arith: { minutes: 20 }, la2: { minutes: 30 },
    handwriting: { minutes: 10 }, indep: { minutes: 20 }, piano: { minutes: 20 } } };
  const dayData = {};
  DAYS.forEach((d, i) => {
    const k = { indep: "Daily", piano: "Daily" };
    if (d !== THU) Object.assign(k, { handwriting: "Daily", aas: "L" + i, arith: "L" + i, la2: "L" + i });   // Mom-required + Handwriting off co-op Thu
    dayData[d] = { andrew: k };
  });
  const ctx = { console, Date, ROSTER: ["andrew"], currData: { subjects },
    calendarData: { holidays: {}, vacations: {}, kidOverrides: {} }, scheduleOverrides: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    coopFullDayFor: () => null, gwGetSubjects: k => subjects[k] || {}, DEFAULT_DAY_CAP: 1, capFor: () => 2,
    coopTimedEndMin: (kid, ds) => (ds === THU && !opts.noCoop ? 15 * 60 : 0) };
  if (opts.fam !== undefined) ctx.famAutoUnits = (dayName, ds) => [{ b: "fact_review", kids: ["andrew"], dur: opts.fam,
    items: [{ dur: opts.fam, kids: opts.famKids || ["andrew"] }] }];
  vm.createContext(ctx);
  ["calNormDate", "smapIsOff", "smapIsKidOff", "schedOv", "schedOvKidOff", "gwParseDate", "gwRules", "toMin", "gwAutoBalance"]
    .forEach(n => vm.runInContext(fn(n), ctx));
  ctx.__dd = dayData;
  return vm.runInContext("gwAutoBalance(__dd, {}, [])", ctx);
}
const keys = (r, d) => Object.keys((r[d] || {}).andrew || {}).sort();
const thu = r => (r[THU] || {}).andrew || {};

console.log("Andrew's co-op Thursday");
{ const bug = world();   // no family-time helper = the live bug path
  ok("control: without family time counted, Thursday TAKES a card (the bug)", keys(bug, THU).length > 2 || Array.isArray(thu(bug).indep), thu(bug)); }
{ const r = world({ fam: 15 });
  ok("Fact Review 15 counted → Thursday keeps just Independent Reading + Piano", keys(r, THU).join() === "indep,piano" && !Array.isArray(thu(r).indep), thu(r));
  ok("Monday keeps its Independent Reading", keys(r, MON).includes("indep"), keys(r, MON));
  ok("every other day keeps all 6", [MON, TUE, WED, FRI].every(d => keys(r, d).length === 6), [MON, TUE, WED, FRI].map(d => keys(r, d).length)); }
{ const r = world({ fam: 15, famKids: ["makenzie"] });
  ok("a family block this kid isn't in doesn't take his room (same as no helper)", JSON.stringify(r) === JSON.stringify(world()), thu(r)); }
{ ok("no co-op that week: family time changes nothing (balances exactly as before)",
    JSON.stringify(world({ fam: 15, noCoop: true })) === JSON.stringify(world({ noCoop: true }))); }

console.log("\nsource wiring");
ok("room subtracts the kid's scheduler-picks family minutes only on a timed co-op date",
  /if\(_ce>toMin\(startStr\)&&typeof famAutoUnits==="function"\)\{ try\{ famAutoUnits\(dayName,dk\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
