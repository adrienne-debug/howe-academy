/*
 * Node tests: the school week is SUNDAY → SATURDAY. Plan weeks stay laid Mon–Sat, but a
 * Sunday belongs to the COMING week: auto-gen/adopt fires on Sunday, a week built ahead
 * parks until its Sunday, the "look ahead" peek hides once Sunday arrives. Runs the real
 * WKB block + _wkIsFutureWeek + peekWeekAvailable.
 *
 *   run:  node test_week_boundary.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// WKB_START"), b = src.indexOf("// WKB_END");
if (a < 0 || b < 0) { console.error("WKB markers not found"); process.exit(1); }
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const code = src.slice(a, b) + "\n" + ["gwParseDate", "_wkNumOf", "_wkIsFutureWeek", "peekWeekAvailable"].map(braceSlice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Plan weeks: 17 = Mon 2026-08-10 … Sun 08-16, 18 = 08-17 … 08-23, 19 = 08-24 … 08-30
const RANGES = { 17: { start: "2026-08-10", end: "2026-08-16" }, 18: { start: "2026-08-17", end: "2026-08-23" }, 19: { start: "2026-08-24", end: "2026-08-30" } };
function mkEnv(today, wk) {
  const env = {
    _maxPlanWeek: () => 19, gwWeekDateRange: w => RANGES[w] || null,
    _todayStr: () => today, WK: wk || "week17", currWeekNum: () => parseInt((wk || "week17").replace(/\D/g, ""), 10),
    ld: () => [{ id: "x" }], peekData: null,
    Date, Math, String, Number, parseInt, isNaN, console,
  };
  vm.createContext(env);
  new vm.Script(code).runInContext(env);
  return env;
}

console.log("_schoolWeekDateFor / weekNumForDate — Sunday belongs to the coming week");
{
  const e = mkEnv("2026-08-16");
  ok("Sunday 8/16 → Mon 8/17", e._schoolWeekDateFor("2026-08-16") === "2026-08-17");
  ok("Saturday 8/15 unchanged", e._schoolWeekDateFor("2026-08-15") === "2026-08-15");
  ok("Monday unchanged", e._schoolWeekDateFor("2026-08-17") === "2026-08-17");
  ok("bad input passes through", e._schoolWeekDateFor("nope") === "nope");
  ok("Sat 8/15 → week 17", e.weekNumForDate("2026-08-15") === 17);
  ok("Sun 8/16 → week 18 (the coming week)", e.weekNumForDate("2026-08-16") === 18);
  ok("Mon 8/17 → week 18", e.weekNumForDate("2026-08-17") === 18);
  ok("Sun 8/09 → week 17", e.weekNumForDate("2026-08-09") === 17);
  ok("Sun 8/30 (last Sunday) → null (no plan week after)", e.weekNumForDate("2026-08-30") === null);
  ok("month-end Sunday rolls correctly (Sun 8/23 → Mon 8/24 → wk 19)", e.weekNumForDate("2026-08-23") === 19);
}

console.log("_wkIsFutureWeek — parking gate");
{
  ok("Saturday: week 18 is future → parks", mkEnv("2026-08-15")._wkIsFutureWeek({ week: "week18" }) === true);
  ok("Sunday: week 18 is NOT future → adopts", mkEnv("2026-08-16")._wkIsFutureWeek({ week: "week18" }) === false);
  ok("Monday: week 18 not future", mkEnv("2026-08-17")._wkIsFutureWeek({ week: "week18" }) === false);
  ok("Sunday: week 19 still future", mkEnv("2026-08-16")._wkIsFutureWeek({ week: "week19" }) === true);
  ok("unknown week → false", mkEnv("2026-08-16")._wkIsFutureWeek({ week: "week99" }) === false);
}

console.log("peekWeekAvailable — look-ahead only until its Sunday");
{
  ok("Saturday, active 17: peek shows 18", mkEnv("2026-08-15", "week17").peekWeekAvailable() === 18);
  ok("Sunday, active 17 (not yet adopted): peek is null — it's current now", mkEnv("2026-08-16", "week17").peekWeekAvailable() === null);
  ok("Sunday, active 18: peek shows 19", mkEnv("2026-08-16", "week18").peekWeekAvailable() === 19);
}

console.log("auto-gen trigger + day strip (source assertions)");
{
  ok("auto-gen asks weekNumForDate(_todayStr()) — fires on Sunday via the mapping", /const wn=weekNumForDate\(_todayStr\(\)\);\s*\n\s*if\(!wn\|\|wn<=currWeekNum\(\)\) return;/.test(src));
  ok("day strip does not fold the coming week's days on Sunday", /weekNumForDate\(_todayStr\(\)\)===currWeekNum\(\)&&_todayDay!=="sunday"/.test(src));
  ok("gwWeekDateRange keeps its Monday-anchored span (day math untouched)", /mon\.setDate\(mon\.getDate\(\)-\(\(mon\.getDay\(\)\+6\)%7\)\);/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
