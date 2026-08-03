/*
 * Node tests for the day-rollover fix.
 *
 * The kiosk tablets stay open for days, so "today" must be derived from the clock on every
 * read, not frozen at page load. This slices the REAL block out of index.html (todayDay,
 * the _todayDay live getter, dayRollCheck + its listener wiring) plus REAL readers
 * (routineEditable, rtAvailable, bbBaseEntry's day field via _todayDay) into a vm context
 * with a movable clock, and asserts:
 *
 *   - todayDay() re-derives after midnight (the old const did not)
 *   - the _todayDay getter is live, so all 16 existing readers follow with no call-site edit
 *   - a real reader (routineEditable) unlocks the NEW today after the roll, and re-locks
 *     yesterday — the bug that would have locked a kid out of their own morning list
 *   - dayRollCheck() re-points `day` when the view was tracking today
 *   - dayRollCheck() leaves a day Mom deliberately opened alone
 *   - dayRollCheck() is a no-op (no render) when the date has not rolled
 *   - the interval + visibilitychange + focus hooks are actually registered
 *   - sunday rolls in (DAYS_ALL includes it; day tabs handle it)
 *
 *   run:  node test_dayroll.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// ── slice helpers ────────────────────────────────────────────────────────────
function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces: " + name);
}
function sliceBetween(startMark, endMark) {
  const i = src.indexOf(startMark);
  if (i < 0) throw new Error("start not found: " + startMark);
  const j = src.indexOf(endMark, i);
  if (j < 0) throw new Error("end not found: " + endMark);
  return src.slice(i, j + endMark.length);
}

// The whole rollover block, verbatim, including the `let tab=..., day=todayDay()` line.
const ROLL_BLOCK = sliceBetween(
  'const DOW_NAMES=["sunday"',
  'window.addEventListener("focus",dayRollCheck);'
);
const READERS = [slice("routineEditable"), slice("rtAvailable"), slice("rtEveningHour")].join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── movable clock ────────────────────────────────────────────────────────────
const RealDate = Date;
let NOW = "2026-08-03T22:40:00"; // Monday night
function MovableDate(...a) {
  if (!(this instanceof MovableDate)) return new MovableDate(...a);
  return a.length === 0 ? new RealDate(NOW) : new RealDate(...a);
}
MovableDate.now = () => new RealDate(NOW).getTime();
MovableDate.prototype = RealDate.prototype;

// ── build the sandbox ────────────────────────────────────────────────────────
function boot() {
  const log = { renders: 0, interval: null, docEvents: [], winEvents: [] };
  const sandbox = {
    Date: MovableDate, console, Object, Array, String, Number, Math, JSON, parseInt, isNaN,
    renderAll() { log.renders++; },
    momHere: () => false,                       // kid device, not Mom — routineEditable's strict path
    routineTimes: { eveningHour: 18 },
    getActiveTasks: () => [], effectiveDay: t => t.day, checked: {},
    setInterval(fn, ms) { log.interval = { fn, ms }; return 1; },
    document: {
      hidden: false,
      addEventListener(ev, fn) { log.docEvents.push({ ev, fn }); },
    },
  };
  const ctx = vm.createContext(sandbox);
  // `window` must be the real global object so Object.defineProperty(window,"_todayDay")
  // makes bare `_todayDay` reads in the sliced readers resolve to the getter.
  vm.runInContext("globalThis.window=globalThis;", ctx);
  sandbox.window.addEventListener = (ev, fn) => log.winEvents.push({ ev, fn });
  vm.runInContext(ROLL_BLOCK + "\n" + READERS, ctx);
  return { ctx, log, get: k => vm.runInContext(k, ctx), run: s => vm.runInContext(s, ctx) };
}

console.log("\nday rollover — live derivation");
{
  NOW = "2026-08-03T22:40:00"; // Monday
  const a = boot();
  ok("boots on the real day", a.get("day") === "monday", a.get("day"));
  ok("todayDay() is monday", a.get("todayDay()") === "monday");
  ok("_todayDay getter is monday", a.get("_todayDay") === "monday");

  NOW = "2026-08-04T00:05:00"; // five minutes past midnight — Tuesday
  ok("todayDay() re-derives after midnight", a.get("todayDay()") === "tuesday", a.get("todayDay()"));
  ok("_todayDay getter follows the clock (all 16 readers)", a.get("_todayDay") === "tuesday", a.get("_todayDay"));
  ok("`day` has NOT moved on its own", a.get("day") === "monday");
}

console.log("\nday rollover — a real reader follows");
{
  NOW = "2026-08-03T22:40:00";
  const a = boot();
  ok("monday editable before midnight", a.get('routineEditable("monday")') === true);
  ok("tuesday locked before midnight", a.get('routineEditable("tuesday")') === false);
  NOW = "2026-08-04T00:05:00";
  ok("tuesday editable after the roll", a.get('routineEditable("tuesday")') === true);
  ok("monday locked after the roll", a.get('routineEditable("monday")') === false);
  // rtAvailable's evening gate keys off _todayDay too: an off-today slot is always available.
  ok("evening slot: monday is no longer today, so open",
    a.get('rtAvailable("evening","lincoln","monday")') === true);
  ok("evening slot: tuesday 00:05 is before 18:00, so shut",
    a.get('rtAvailable("evening","lincoln","tuesday")') === false);
}

console.log("\ndayRollCheck — the view follows");
{
  NOW = "2026-08-03T22:40:00";
  const a = boot();
  ok("no roll yet → returns false", a.get("dayRollCheck()") === false);
  ok("no roll → no render", a.log.renders === 0);

  NOW = "2026-08-04T00:05:00";
  ok("roll detected → returns true", a.get("dayRollCheck()") === true);
  ok("`day` re-points to the new today", a.get("day") === "tuesday", a.get("day"));
  ok("roll re-renders once", a.log.renders === 1);
  ok("second call is a no-op", a.get("dayRollCheck()") === false);
  ok("still one render", a.log.renders === 1);
}

console.log("\ndayRollCheck — a day Mom opened is left alone");
{
  NOW = "2026-08-03T22:40:00";
  const a = boot();
  a.run('day="friday";');                       // Mom tapped Friday to look ahead
  NOW = "2026-08-04T00:05:00";
  ok("roll still detected", a.get("dayRollCheck()") === true);
  ok("Mom's chosen day survives the roll", a.get("day") === "friday", a.get("day"));
  ok("still re-renders (TODAY tag / gates moved)", a.log.renders === 1);
}

console.log("\ndayRollCheck — weekend + multi-day skip");
{
  NOW = "2026-08-08T23:59:00"; // Saturday
  const a = boot();
  ok("boots saturday", a.get("day") === "saturday");
  NOW = "2026-08-09T07:00:00"; // Sunday
  ok("saturday→sunday rolls", a.get("dayRollCheck()") === true);
  ok("`day` is sunday (DAYS_ALL carries it)", a.get("day") === "sunday", a.get("day"));

  // A tablet left on over a long weekend skips several days in one hop.
  NOW = "2026-08-12T09:00:00"; // Wednesday
  ok("multi-day skip still lands right", a.get("dayRollCheck()") === true);
  ok("`day` is wednesday", a.get("day") === "wednesday", a.get("day"));
}

console.log("\nwiring");
{
  NOW = "2026-08-03T22:40:00";
  const a = boot();
  ok("60s interval registered", !!a.log.interval && a.log.interval.ms === 60000, a.log.interval && a.log.interval.ms);
  ok("interval calls dayRollCheck", (() => {
    NOW = "2026-08-04T00:05:00";
    a.log.interval.fn();
    return a.get("day") === "tuesday";
  })(), a.get("day"));

  const b = boot();
  const vis = b.log.docEvents.find(e => e.ev === "visibilitychange");
  ok("visibilitychange registered", !!vis);
  ok("focus registered on window", b.log.winEvents.some(e => e.ev === "focus"));
  NOW = "2026-08-04T00:05:00";
  vis.fn();
  ok("waking the tablet catches the roll", b.get("day") === "tuesday", b.get("day"));

  NOW = "2026-08-03T22:40:00";                 // boot BEFORE midnight, then roll
  const c = boot();
  NOW = "2026-08-04T00:05:00";
  c.ctx.document.hidden = true;
  c.log.docEvents.find(e => e.ev === "visibilitychange").fn();
  ok("hidden→no check (fires again on show)", c.get("day") === "monday", c.get("day"));
}

console.log("\nregression: the old frozen const is gone");
{
  ok("no `const _todayDay=` left in index.html", !/const\s+_todayDay\s*=/.test(src));
  ok("_todayDay is defined once, as a getter",
    (src.match(/Object\.defineProperty\(window,"_todayDay"/g) || []).length === 1);
  ok("`day` no longer initialised from a frozen value", /let tab="schedule", day=todayDay\(\)/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
