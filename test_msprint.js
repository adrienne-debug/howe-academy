/*
 * 🔢 Book Sprints (her design 2026-09-24): per kid a book + current sprint (editable, moves logged) and a run
 * history. A session = 4 timed runs; each run is one sheet of the current sprint in the order A1 → B1 → A2 → B2;
 * met = sprint PASSED, next run is the next sprint's A1; not met = same sprint's next sheet; four misses → start
 * over at A1. The 4th run of the day checks off the Math Sprints card. Book lists (count + titles) are editable and
 * saved to the library list. Mom marks; kids view. Targeted writes; dry-run inert.
 *   run:  node test_msprint.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MSPRINT_START"), b = src.indexOf("// MSPRINT_END");
if (a < 0 || b < 0) { console.error("MSPRINT markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const BOOK4 = ["Sprint 401 · Identify the Value of Digits", "Sprint 402 · Count On or Back", "Sprint 403 · Compare Numbers", "Sprint 404 · Round to the Nearest Ten Thousand"];
function world(o) {
  o = o || {};
  const writes = [], checks = [], toasts = [];
  const ctx = {
    console, masteryKid: "lincoln", mastView: "sprint", sprintSource: "phonogram", mastLogMode: false, mastScoreItemId: null, tab: "mastery",
    SL_KLBL: { lincoln: "Lincoln", ellis: "Ellis" }, _todayDay: "thursday",
    weekData: { tasks: o.tasks || [] }, checked: {}, claimed: {},
    momHere: () => o.who !== "kid", nowTs: () => "10:00 AM Sep 24", cbTodayISO: () => o.today || "2026-09-24",
    effectiveDay: t => t.day, toMin: () => 0, tsToMin: () => 0, finalizeDone: id => { checks.push(id); return true; }, showPaceToast: () => {},
    dbg: () => {}, gwShowToast: m => toasts.push(m), renderAll: () => {}, _mastRe: () => {}, showTab: () => {}, bbChime: () => {}, bbAudioUnlock: () => {},
    _dryRun: () => !!o.dry, db: { ref: p => ({ update: v => writes.push([p, v]), set: v => writes.push([p, v]) }) },
    document: { getElementById: () => null }, setInterval: () => 1, clearInterval: () => {},
    Object, Array, String, Number, Math, Date, JSON, RegExp, parseInt,
  };
  vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
  vm.runInContext("lbScansMS=" + JSON.stringify({ "sm-sprints-4": { lessons: o.book4 || BOOK4 }, "math-sprints-6": { lessons: [] } }) + "; mathSprints=" + JSON.stringify(o.state || {}) + ";", ctx);
  return { ctx, writes, checks, toasts, call: e => vm.runInContext(e, ctx) };
}

console.log("── the book list ──");
{
  const w = world();
  const L = w.call("msBookList('sm-sprints-4')");
  ok("titles parse from 'Sprint NNN · Title'", L.length === 4 && L[0].n === 401 && L[0].title === "Identify the Value of Digits", L[0]);
  ok("a book with no list yet is empty, not an error", w.call("msBookList('math-sprints-6')").length === 0 && w.call("msBookList('nope')").length === 0);
}
console.log("\n── setting where a kid is ──");
{
  const w = world();
  w.call("msSetPosition('lincoln','sm-sprints-4',403,'set by Mom')");
  const st = w.call("msState('lincoln')");
  ok("book + current sprint set, the move is logged", st.book === "sm-sprints-4" && st.cur === 403 && st.moves.length === 1 && st.moves[0].to.cur === 403);
  ok("one targeted write", w.writes.length === 1 && w.writes[0][0] === "mathSprints/lincoln" && w.writes[0][1].cur === 403 && w.writes[0][1]["moves/0"]);
  w.call("msSetPosition('lincoln','sm-sprints-4',999,'oops')");
  ok("an unknown sprint number falls back to the book's first", w.call("msState('lincoln')").cur === 401);
  const k = world({ who: "kid" }); k.call("msSetPosition('lincoln','sm-sprints-4',403)");
  ok("a kid can't set positions", k.call("msState('lincoln')") === null && k.writes.length === 0);
}
console.log("\n── a session: A1 → B1 → A2 → B2, met passes the sprint ──");
{
  const w = world({ state: { lincoln: { book: "sm-sprints-4", cur: 401 } } });
  ok("first sheet is A 1st half", w.call("msNextSheet('lincoln',401)").k === "a1");
  let r = w.call("msRecordRun('lincoln',false)");
  ok("miss on A1 → next sheet is B1, still Sprint 401", r.sheet === "a1" && !r.advanced && w.call("msNextSheet('lincoln',401)").k === "b1" && w.call("msState('lincoln').cur") === 401);
  r = w.call("msRecordRun('lincoln',true)");
  ok("met on B1 → Sprint 401 PASSED, moved to 402", r.met && r.advanced === 402 && w.call("msPassed('lincoln',401)") === true && w.call("msState('lincoln').cur") === 402);
  ok("402's first sheet is A1 again", w.call("msNextSheet('lincoln',402)").k === "a1");
  ok("runs today = 2 (counted across sprints)", w.call("msTodayRuns('lincoln')") === 2);
  ok("writes are targeted: log/401/runs/0, log/401/runs/1 + passed + cur", w.writes.some(x => x[1]["log/401/runs/0"]) && w.writes.some(x => x[1]["log/401/runs/1"] && x[1]["log/401/passed"] && x[1].cur === 402));
}
{
  const w = world({ state: { lincoln: { book: "sm-sprints-4", cur: 401 } }, tasks: [{ id: "ms1", who: "lincoln", day: "thursday", subjectKey: "math_sprints", title: "📄 Math Sprints" }] });
  ["a", "b", "c", "d"].forEach(() => w.call("msRecordRun('lincoln',false)"));
  ok("four misses → the sprint starts over at A1, still on 401", w.call("msNextSheet('lincoln',401)").k === "a1" && w.call("msState('lincoln').cur") === 401 && w.call("msRuns('lincoln',401)").length === 4);
  ok("the 4th run of the day checks off the Math Sprints card", w.checks.length === 1 && w.checks[0] === "ms1" && /session done/.test(w.toasts.join("|")));
}
{
  const w = world({ state: { lincoln: { book: "sm-sprints-4", cur: 401 } } });
  ["x", "x", "x", "x"].forEach(() => w.call("msRecordRun('lincoln',true)"));
  ok("a flying kid passes 4 sprints in one session and lands on the book's end", w.call("msState('lincoln').cur") === 404 && w.call("msState('lincoln').done") === true && [401, 402, 403, 404].every(n => w.call("msPassed('lincoln'," + n + ")")));
}
{
  const w = world({ state: { lincoln: { book: "sm-sprints-4", cur: 401 } }, who: "kid" });
  ok("a kid can't mark a run", w.call("msRecordRun('lincoln',true)") === null && w.writes.length === 0);
  const d = world({ state: { lincoln: { book: "sm-sprints-4", cur: 401 } }, dry: true }); d.call("msRecordRun('lincoln',true)");
  ok("dry-run writes nothing", d.writes.length === 0);
}
console.log("\n── editing a book's list ──");
{
  const w = world();
  w.call("msBookSave('math-sprints-6',5,'Place value\\nSprint 602 · Powers of 10\\n\\n604: Ratios')");
  const L = w.call("msBookList('math-sprints-6')");
  ok("count sets the length; lines are normalised to 'Sprint 60N · title', blanks kept", L.length === 5 && L[0].title === "Place value" && L[1].title === "Powers of 10" && L[2].title === "" && L[3].title === "Ratios" && L[4].n === 605, L);
  ok("saved to the library list everyone reads", w.writes.some(x => x[0] === "library/scans/math-sprints-6" && x[1].lessons.length === 5 && x[1].lessons[1] === "Sprint 602 · Powers of 10"));
  const k = world({ who: "kid" }); k.call("msBookSave('math-sprints-6',3,'a\\nb\\nc')");
  ok("a kid can't edit a book", k.writes.length === 0);
}
console.log("\n── the wiring ──");
ok("🔢 Book sprints pill on the Sprint tab", /opt\("book","\\u\{1F522\} Book sprints"\)/.test(src));
ok("the book panel renders before the phonogram gate", /if\(sprintSource==="book"\) return h\+buildSprintBookHtml\(color\);/.test(src));
ok("a Math Sprints card opens today's sprint", /msIsCard\(t\)&&typeof msState==="function"&&msState\(t\.who\)/.test(src) && /wbRow\+eicRow\+rvRow\+msRow\+/.test(src));
ok("mathSprints and library/scans are listened to", /db\.ref\("mathSprints"\)\.on\("value"/.test(src) && /db\.ref\("library\/scans"\)\.on\("value"/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
