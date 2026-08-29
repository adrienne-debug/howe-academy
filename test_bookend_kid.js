/*
 * Node tests for the bookend-only kid (Julian, 2026-08-29).
 *
 * His only two subjects are morning_nb (rules "first") and closing_nb ("last").
 * resolveWeekSlots' daily-injection loop explicitly SKIPS first/last, so those two are added
 * only by the later notebook loop — which was guarded by "the kid must already have something
 * on this day". His `drills` subject used to be that seed. When it was removed he generated
 * ZERO cards for week 19: notebooks never injected, and retrieval (which needs an existing
 * task that day) skipped him as well. One subject deletion ended his whole school week, and
 * it went unnoticed because she hadn't done school with him that week.
 *
 * Bookends must not require a middle. These run the real injection loop, sliced from
 * index.html, over the four kids' real shapes.
 *
 *   run:  node test_bookend_kid.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("  // Inject daily curriculum subjects (notebooks, drills) into every school day");
if (a < 0) { console.error("injection loop not found"); process.exit(1); }
const end = src.indexOf("  const skipSet=new Set(", a);
if (end < 0) { console.error("end of injection loop not found"); process.exit(1); }
const BLOCK = src.slice(a, end);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

const NB = { morning_nb: { rules: "first", allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], display: "Morning Notebook" },
             closing_nb: { rules: "last", allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], display: "Closing Notebook" } };
const withMiddle = Object.assign({ singapore: { rules: "sequential" } }, NB);

// 2026-08-31 is a Monday.
function run(subjects, balancedForKid, opts) {
  opts = opts || {};
  const balanced = { "2026-08-31": {} };
  if (balancedForKid) balanced["2026-08-31"].julian = balancedForKid;
  const ctx = {
    console, Object, Date, String,
    ROSTER: ["julian"],
    balanced,
    currData: { subjects: { julian: subjects } },
    gwParseDate: s => new Date(s + "T12:00:00"),
    smapIsKidOff: () => !!opts.calendarOff,
    schedOvKidOff: () => !!opts.overrideOff,
  };
  vm.createContext(ctx);
  vm.runInContext(BLOCK, ctx);
  return ctx.balanced["2026-08-31"].julian || null;
}

console.log("\n── the bug ──");
{
  const got = run(NB, null);
  ok("a bookend-only kid now gets his day", got && Object.keys(got).length === 2, got);
  ok("both notebooks are injected", got && got.morning_nb && got.closing_nb, got);
}
{
  // what week 19 actually did
  const before = src.indexOf("if(!balanced[dk][kid]||!Object.keys(balanced[dk][kid]).length){");
  ok("the old unconditional `continue` is gone", before >= 0 && !/if\(!balanced\[dk\]\[kid\]\|\|!Object\.keys\(balanced\[dk\]\[kid\]\)\.length\) continue;/.test(src));
}

console.log("\n── it must not hand out days a kid shouldn't have ──");
ok("calendar day-off still skips him", run(NB, null, { calendarOff: true }) === null);
ok("a day-off override still skips him", run(NB, null, { overrideOff: true }) === null);
{
  const paused = { morning_nb: Object.assign({}, NB.morning_nb, { paused: true }),
                   closing_nb: Object.assign({}, NB.closing_nb, { paused: true }) };
  const got = run(paused, null);
  ok("all-paused bookends inject nothing", !got || !Object.keys(got).length, got);
}
{
  const got = run(NB, null, {});
  ok("a weekday outside allowedDays gets nothing", (() => {
    // 2026-08-30 is a Sunday — rebuild with only that date
    const balanced = { "2026-08-30": {} };
    const ctx = { console, Object, Date, String, ROSTER: ["julian"], balanced,
      currData: { subjects: { julian: NB } }, gwParseDate: s => new Date(s + "T12:00:00"),
      smapIsKidOff: () => false, schedOvKidOff: () => false };
    vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
    const r = ctx.balanced["2026-08-30"].julian;
    return !r || !Object.keys(r).length;
  })(), got);
}

console.log("\n── kids with real subjects are untouched ──");
{
  // A kid who HAS content that day: behaviour must be exactly as before.
  const got = run(withMiddle, { singapore: "5B Ch.1" });
  ok("existing content is kept", got && got.singapore === "5B Ch.1", got);
  ok("bookends are added alongside it", got && got.morning_nb && got.closing_nb, got);
}
{
  // A kid with a middle but NOTHING on this day is off — unchanged, still skipped.
  const got = run(withMiddle, null);
  ok("a kid with non-bookend subjects and an empty day is still skipped", got === null, got);
}
{
  const got = run(Object.assign({ drills: { tracking: "daily" } }, NB), null);
  ok("a kid whose seed subject exists is NOT treated as bookend-only", got === null, got);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
