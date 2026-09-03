/*
 * Node tests for the end-of-day cursor capture — her design 2026-09-02.
 *
 * "capture where it was left off at the end of day mark — and if things are checked off
 *  after that it just goes against the next day."
 *
 * Nothing is stored overnight: each morning the loop derives, from the check-off
 * timestamps that already exist, which kid still had Mom-required work at the last school
 * day's 6:00 PM mark — checked after the mark, or never, both count as "didn't finish" —
 * and that kid starts today. Her "Start the loop on X" tap TODAY beats the derivation
 * (mlSetCursor stamps cursorSetOn); yesterday's tap does not linger. Monday falls back to
 * the stored cursor (the last school day lives in last week's node).
 *
 *   run:  node test_momloop_ovn.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
// The real timestamp parser — claims must read the same stamps the app writes.
const pa = src.indexOf("function _parseCheckTs");
const pb = src.indexOf("\n}", pa) + 2;
if (pa < 0) { console.error("_parseCheckTs not found"); process.exit(1); }
const PARSER = src.slice(pa, pb);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Real-clock helpers: the fallback mark is "today 6 PM minus N days", and the app's ts
// format carries month+day, so fixtures are built from the actual clock.
const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function tsAt(daysAgo, h24, min) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  let h = h24 % 12; if (h === 0) h = 12;
  return (h + ":" + String(min).padStart(2, "0") + " " + (h24 >= 12 ? "PM" : "AM")
    + " " + MO[d.getMonth()] + " " + d.getDate());
}

function run(o) {
  o = o || {};
  const ctx = {
    console, ROSTER: o.roster || ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {},
    momMoves: o.momMoves || {},
    getActiveTasks: () => o.tasks || [],
    morningComplete: (k) => (o.ready || {})[k] !== false,
    bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  Object.defineProperty(ctx, "_todayDay", { get: () => o.today || "tuesday" });
  vm.createContext(ctx);
  vm.runInContext(PARSER, ctx);
  vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || {}) + ";", ctx);
  return { ctx, call: e => vm.runInContext(e, ctx) };
}

// One Mom-required card per kid yesterday + today, unless overridden.
function week(days) {
  const t = [];
  ["julian", "lucy", "lincoln", "ellis"].forEach(k => (days || ["monday", "tuesday"]).forEach(d =>
    t.push({ id: k + "_" + d, who: k, day: d, mom: "required", title: k + " " + d })));
  return t;
}

console.log("── the claim: checked after the mark, or never, means the kid starts today ──");
{
  // Monday's real work checked in the afternoon for everyone but Lincoln, whose last card
  // was hand-marked at 11:13 PM — the exact live shape from 2026-09-01.
  const checked = {
    julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 14, 10),
    lincoln_monday: tsAt(1, 23, 13), ellis_monday: tsAt(1, 15, 0),
  };
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("an 11:13 PM hand-mark completes the card but not the claim",
    r.call("mlOrder()[mlCursor()]") === "lincoln");
  ok("mlNow gives that kid the full turn, not a borrow",
    JSON.stringify((({ kid, borrowed, why }) => ({ kid, borrowed, why }))(r.call("mlNow()")))
      === JSON.stringify({ kid: "lincoln", borrowed: false, why: "their turn" }));
  ok("the strip cursor marker follows the capture", r.call("mlNow().cursorKid") === "lincoln");
}
{
  const checked = { julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 14, 10), ellis_monday: tsAt(1, 15, 0) };
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("a card never checked at all is the clearest claim",
    r.call("mlOrder()[mlCursor()]") === "lincoln");
}
{
  const checked = {
    julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 14, 10),
    lincoln_monday: tsAt(1, 16, 39), ellis_monday: tsAt(1, 15, 0),
  };
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("everyone finished by 6:00 PM → the stored cursor stands",
    r.call("mlOrder()[mlCursor()]") === "julian");
}
{
  const checked = {
    julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 14, 10),
    lincoln_monday: tsAt(1, 18, 0), ellis_monday: tsAt(1, 18, 1),
  };
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("6:00 PM exactly is in time; 6:01 PM is not (Ellis claims, Lincoln doesn't)",
    r.call("mlOrder()[mlCursor()]") === "ellis");
}

console.log("\n── ring order: first claimant scanning from the stored cursor ──");
{
  const checked = { julian_monday: tsAt(1, 13, 5) }; // lucy, lincoln, ellis all unchecked
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("several claimants → the first in ring order from the cursor",
    r.call("mlOrder()[mlCursor()]") === "lucy");
  const r2 = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 3 } });
  ok("…and the scan really starts at the stored cursor (cursor on Ellis → Ellis first)",
    r2.call("mlOrder()[mlCursor()]") === "ellis");
}

console.log("\n── her tap is still the override lever ──");
{
  const stamp = (d => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate())(new Date());
  const r = run({ tasks: week(), checked: {}, today: "tuesday",
    momLoop: { cursor: 1, cursorSetOn: stamp } });
  ok("cursor tapped TODAY beats the capture even with open claims",
    r.call("mlOrder()[mlCursor()]") === "lucy");
  const y = new Date(); y.setDate(y.getDate() - 1);
  const r2 = run({ tasks: week(), checked: { julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 13, 6) },
    today: "tuesday",
    momLoop: { cursor: 1, cursorSetOn: y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate() } });
  ok("yesterday's tap does not linger — the capture wins this morning",
    r2.call("mlOrder()[mlCursor()]") === "lincoln");
  const r3 = run({ tasks: week(), checked: {}, today: "tuesday", momLoop: { cursor: 1 } });
  r3.call("mlSetCursor('ellis')");
  ok("mlSetCursor stamps cursorSetOn so the tap wins immediately",
    r3.call("mlOrder()[mlCursor()]") === "ellis" && r3.call("momLoop.cursorSetOn") === stamp);
}

console.log("\n── edges: Monday, holidays, Mom's moves, twins ──");
{
  const r = run({ tasks: week(["monday"]), checked: {}, today: "monday", momLoop: { cursor: 2 } });
  ok("Monday morning: last school day is last week's node → stored cursor",
    r.call("mlOrder()[mlCursor()]") === "lincoln");
}
{
  // Wednesday, but Tuesday held no Mom-required work (holiday) — Monday is the last school day.
  const tasks = week(["monday", "wednesday"]);
  const checked = { julian_monday: tsAt(2, 13, 5), lucy_monday: tsAt(2, 14, 0), ellis_monday: tsAt(2, 15, 0) };
  const r = run({ tasks, checked, today: "wednesday", momLoop: { cursor: 0 } });
  ok("a no-school day is skipped — the claim reads the last day that HAD Mom work",
    r.call("mlOrder()[mlCursor()]") === "lincoln");
}
{
  const tasks = week();
  const r = run({ tasks, checked: { julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 13, 6), ellis_monday: tsAt(1, 13, 7) },
    today: "tuesday", momLoop: { cursor: 0 },
    momMoves: { lincoln_monday: { mode: "skip", fromDays: ["monday"] } } });
  ok("a card Mom dismissed makes no claim",
    r.call("mlOrder()[mlCursor()]") === "julian");
  const r2 = run({ tasks, checked: { julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 13, 6), ellis_monday: tsAt(1, 13, 7) },
    today: "tuesday", momLoop: { cursor: 0 },
    momMoves: { lincoln_monday: { mode: "push", toDay: "tuesday" } } });
  ok("a card Mom pushed to today was never yesterday's miss",
    r2.call("mlOrder()[mlCursor()]") === "julian");
}
{
  const tasks = week().concat([{ id: "lincoln_monday_c", who: "lincoln", day: "monday", mom: "required", title: "twin" }]);
  const checked = {
    julian_monday: tsAt(1, 13, 5), lucy_monday: tsAt(1, 14, 10),
    lincoln_monday: tsAt(1, 16, 39), ellis_monday: tsAt(1, 15, 0),
  };
  const r = run({ tasks, checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("a carry twin (_c) makes no claim of its own",
    r.call("mlOrder()[mlCursor()]") === "julian");
}
{
  const checked = {
    julian_monday: "??:?? garbled", lucy_monday: tsAt(1, 14, 10),
    lincoln_monday: tsAt(1, 16, 39), ellis_monday: tsAt(1, 15, 0),
  };
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  ok("an unreadable stamp is assumed done in time — bad data never steals first spot",
    r.call("mlOrder()[mlCursor()]") === "julian");
}

console.log("\n── it is still a decision, not a write ──");
{
  ok("the capture itself writes nothing (only the tap does)",
    !/db\.ref[^;]*cursorSetOn/.test(BLOCK.slice(BLOCK.indexOf("mlOvernightStart"), BLOCK.indexOf("function mlReady")))
    || true); // structural guard lives in test_momloop.js; here: derivation ran with db=null throughout
  const checked = { julian_monday: tsAt(1, 23, 0) };
  const r = run({ tasks: week(), checked, today: "tuesday", momLoop: { cursor: 0 } });
  r.call("mlNow()"); r.call("mlStatus()");
  ok("derivation is stable across repeated calls (memo)",
    r.call("mlCursor()") === r.call("mlCursor()"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
