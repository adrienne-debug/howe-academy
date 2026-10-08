/*
 * BUG #90 — gwAutoBalance must read each date's REAL weekday.
 * Slices gwAutoBalance verbatim from the given index.html and runs it on synthetic weeks.
 *   node test_balance_daymap.js <index.html>      (exit 1 on any failure)
 */
const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(process.argv[2]||require("path").join(__dirname,"index.html"), "utf8").split("\n");
function grab(name) {
  const i = src.findIndex(l => l.startsWith("function " + name + "(")); if (i < 0) throw new Error("missing " + name);
  let t = ""; for (let j = i; j < src.length; j++) { t += src[j] + "\n"; try { new vm.Script(t); return t; } catch (e) { } }
}
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   - " + n); } else { fail++; console.log("  FAIL - " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function run(subjects, dayData, skipDays) {
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
  ctx.__d = dayData; ctx.__s = skipDays || [];
  return vm.runInContext("gwAutoBalance(__d,{},__s)", ctx);
}
const on = (b, sk) => Object.keys(b).sort().filter(d => (b[d].k || {})[sk] !== undefined);
const W = { Mon: "2026-10-05", Tue: "2026-10-06", Wed: "2026-10-07", Thu: "2026-10-08", Fri: "2026-10-09" };
const fill = n => { const o = {}; for (let i = 0; i < n; i++) o["f" + i] = "x"; return o; };   // n × 20-min fillers (no pins)

console.log("1. Tue–Fri subject never evened onto a light Monday (the DeWalt Taylor Fix-It Practice case)");
{
  const subs = { fip: { minutes: 20, allowedDays: ["Tue", "Wed", "Thu", "Fri"] } };
  for (let i = 0; i < 12; i++) subs["f" + i] = { minutes: 20, allowedDays: ["Wed"] };          // pinned Wed: can't move
  const d = { [W.Mon]: { k: {} }, [W.Tue]: { k: fill(0) }, [W.Wed]: { k: Object.assign(fill(6), { fip: "x" }) } };
  const b = run(subs, d);
  ok("fip stays off Monday", on(b, "fip").indexOf(W.Mon) < 0, on(b, "fip"));
  ok("fip lands on an allowed day (Tue/Wed)", on(b, "fip").every(x => [W.Tue, W.Wed].includes(x)), on(b, "fip"));
}
console.log("2. A Friday-only subject CAN be evened onto a light Friday");
{
  const subs = { fri: { minutes: 20, allowedDays: ["Thu", "Fri"] } };
  for (let i = 0; i < 12; i++) subs["f" + i] = { minutes: 20, allowedDays: ["Thu"] };
  const d = { [W.Thu]: { k: Object.assign(fill(6), { fri: "x" }) }, [W.Fri]: { k: {} } };
  const b = run(subs, d);
  ok("Thu/Fri subject moves to the empty Friday", on(b, "fri").join() === W.Fri, on(b, "fri"));
}
console.log("3. Mon-only subject is never moved onto Sunday-labelled / wrong days");
{
  const subs = { mon: { minutes: 20, allowedDays: ["Mon"] }, tue: { minutes: 20, allowedDays: ["Mon", "Tue"] } };
  for (let i = 0; i < 12; i++) subs["f" + i] = { minutes: 20, allowedDays: ["Mon"] };
  const d = { [W.Mon]: { k: Object.assign(fill(6), { mon: "x", tue: "x" }) }, [W.Tue]: { k: {} }, [W.Wed]: { k: {} } };
  const b = run(subs, d);
  ok("Mon-only subject stays Monday", on(b, "mon").join() === W.Mon, on(b, "mon"));
  ok("Mon/Tue subject may move only to Tuesday", on(b, "tue").every(x => [W.Mon, W.Tue].includes(x)), on(b, "tue"));
}
console.log("4. skipDays names the real day");
{
  const subs = { any: { minutes: 20 } };
  for (let i = 0; i < 12; i++) subs["f" + i] = { minutes: 20, allowedDays: ["Wed"] };
  const d = { [W.Wed]: { k: Object.assign(fill(6), { any: "x" }) }, [W.Thu]: { k: {} }, [W.Fri]: { k: {} } };
  const b = run(subs, d, ["Friday"]);
  ok("skip Friday → nothing evened onto Friday", on(b, "any").indexOf(W.Fri) < 0, on(b, "any"));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
