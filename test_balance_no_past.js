/*
 * ⚖️ The week balancer never places work on a day already past (her rule 2026-10-08).
 *
 * Live: a mid-week Regenerate re-deals the whole week, and gwAutoBalance ranked the days already over (lightest —
 * their done work is gone) as the best place to even the week onto. Open lessons were dealt onto Monday/Tuesday on a
 * Wednesday regen, then the cascade swept them back out as carry-overs. A date before today can now neither receive
 * nor donate — the same guard the calendar off-day already has. Future weeks (every date ≥ today) are unchanged.
 *
 *   run:  node test_balance_no_past.js
 */
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const lines = src.split("\n");
function grab(name) {
  const i = lines.findIndex(l => l.startsWith("function " + name + "(")); if (i < 0) throw new Error("missing " + name);
  let t = ""; for (let j = i; j < lines.length; j++) { t += lines[j] + "\n"; try { new vm.Script(t); return t; } catch (e) { } }
}
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   - " + n); } else { fail++; console.log("  FAIL - " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function run(subjects, dayData, todayISO) {
  const ctx = {
    JSON, Object, Set, Math, parseInt, String,
    ROSTER: ["k"], currData: { subjects: { k: subjects } },
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    DEFAULT_DAY_CAP: 2, calendarData: { coops: {} },
    smapIsKidOff: () => null, schedOvKidOff: () => false, coopBlocksBase: () => false,
    coopTimedEndMin: () => 0, famAutoUnits: () => [], planBacked: () => false,
  };
  vm.createContext(ctx);
  vm.runInContext(["toMin", "gwParseDate", "gwRules", "capFor", "gwGetSubjects", "gwAutoBalance"].map(grab).join("\n"), ctx);
  ctx.__d = dayData; ctx.__t = todayISO;
  return vm.runInContext("gwAutoBalance(__d,{},[],__t)", ctx);
}
const W = { Mon: "2026-10-05", Tue: "2026-10-06", Wed: "2026-10-07", Thu: "2026-10-08", Fri: "2026-10-09" };
const fill = (n, p) => { const o = {}; for (let i = 0; i < n; i++) o[(p || "f") + i] = "x"; return o; };
const subjFor = d => { const s = {}; Object.values(d).forEach(day => Object.keys(day.k).forEach(k => { s[k] = { minutes: 20 }; })); return s; };
const keysOn = (b, dk) => Object.keys((b[dk] || {}).k || {});

console.log("1. Wednesday regenerate: Mon/Tue are over (empty) — nothing is evened onto them");
{
  const d = { [W.Mon]: { k: {} }, [W.Tue]: { k: {} }, [W.Wed]: { k: fill(6, "w") }, [W.Thu]: { k: fill(9, "t") }, [W.Fri]: { k: fill(9, "r") } };
  const b = run(subjFor(d), d, W.Wed);
  ok("Monday receives nothing", keysOn(b, W.Mon).length === 0, keysOn(b, W.Mon));
  ok("Tuesday receives nothing", keysOn(b, W.Tue).length === 0, keysOn(b, W.Tue));
  const total = Object.keys(b).reduce((n, dk) => n + keysOn(b, dk).length, 0);
  ok("no lesson lost (24 in, 24 out)", total === 24, total);
  ok("today and later still balance among themselves (Wed took some of Thu/Fri)", keysOn(b, W.Wed).length > 6, keysOn(b, W.Wed).length);
}
console.log("2. A past day's leftovers are not donated around either (the cascade sweeps them, as before)");
{
  const d = { [W.Mon]: { k: fill(9, "m") }, [W.Tue]: { k: {} }, [W.Wed]: { k: fill(2, "w") }, [W.Thu]: { k: fill(2, "t") } };
  const b = run(subjFor(d), d, W.Wed);
  ok("Monday keeps its 9 (no donation to Tuesday, which is past too)", keysOn(b, W.Mon).length === 9 && keysOn(b, W.Tue).length === 0, [keysOn(b, W.Mon).length, keysOn(b, W.Tue).length]);
}
console.log("3. A week that hasn't started (today before Monday) balances exactly as before");
{
  const d = { [W.Mon]: { k: {} }, [W.Tue]: { k: fill(9, "t") } };
  const a = run(subjFor(d), d, "2026-10-04");
  const b0 = run(subjFor(d), d, undefined);
  ok("Sunday build: Monday is evened onto", keysOn(a, W.Mon).length > 0, keysOn(a, W.Mon));
  ok("…identical to no today given", JSON.stringify(a) === JSON.stringify(b0));
}
console.log("4. wiring: generateWeek hands the balancer today's date");
ok("generateWeek calls gwAutoBalance(…, _todayStr())", /balanced=gwAutoBalance\(balanced,config\.lateStart\|\|\{\},config\.skipDays\|\|\[\],\(typeof _todayStr==="function"\)\?_todayStr\(\):null\);/.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
