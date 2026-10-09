/*
 * Node tests for LUNCHFIT (her rule 2026-10-09, #31) on top of LUNCHGRACE: "20 min Reading Eggs anytime after 12:41 would
 * have to move after lunch, but before that it can sit till 5 min after lunch then it can assume it wasn't started and
 * moved after lunch." Lunch here is 1:00–2:00 PM, Reading Eggs is 20 minutes.
 *
 * (Original LUNCHGRACE header follows.) Node tests for LUNCHGRACE — a card that can't finish before lunch moves after lunch (her rule 2026-10-08).
 *
 * Live 10/6: Lucy's 20-minute Reading Eggs sat 12:54–1:14 across her 1:00 lunch — the card in hand slides so it
 * ends at now, and it was stepped over lunch only when its START was inside lunch. Her rule: a card that can't
 * finish before lunch moves after lunch; the card being worked on gets ~5 minutes of grace (it may run up to
 * 5 min into lunch and stay there to be checked off), then it bumps to after lunch.
 *
 *   run:  node test_lunch_grace.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(name) {
  const i = src.indexOf("function " + name);
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const HELPERS = slice("toMin") + "\n" + slice("fromMin");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
let ID = 0;
function card(who, time, dur, mom, title) {
  return { id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") };
}
function run(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];   // lunch 1:00–2:00 PM
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  return id => laid.find(t => t.id === id).time;
}
const H = (h, m) => h * 60 + m;

for (const withMom of [false, true]) {
  const tag = withMom ? " [Mom work in the ring]" : "";
  const mk = () => withMom ? [card("lucy", "2:40 PM", 15, "required", "Lucy Mom lesson")] : [];
  console.log("\n── her example: 20-min Reading Eggs, lunch at 1:00" + tag + " ──");
  {
    const prev = card("lucy", "12:20 PM", 25, "none", "Math"), re = card("lucy", "12:45 PM", 20, "none", "Reading Eggs");
    const at = run({ tasks: [prev, re, ...mk()], nowMin: H(12, 47), checked: { [prev.id]: "12:45 PM Oct 9" } });
    ok("starts at 12:45 (after 12:40): can't finish by 1:00 → goes straight after lunch, no grace", at(re.id) === "2:00 PM", at(re.id));
  }
  {
    const prev = card("lucy", "12:15 PM", 25, "none", "Math"), re = card("lucy", "12:40 PM", 20, "none", "Reading Eggs");
    const at = run({ tasks: [prev, re, ...mk()], nowMin: H(12, 50), checked: { [prev.id]: "12:40 PM Oct 9" } });
    ok("starts at 12:40 exactly: fits before lunch → stays", at(re.id) !== "2:00 PM", at(re.id));
  }
  {
    const prev = card("lucy", "12:10 PM", 25, "none", "Math"), re = card("lucy", "12:35 PM", 20, "none", "Reading Eggs");
    const at3 = run({ tasks: [prev, re, ...mk()], nowMin: H(13, 3), checked: { [prev.id]: "12:35 PM Oct 9" } });
    ok("started 12:35 (fits), still going at 1:03 → stays (5-min grace)", at3(re.id) !== "2:00 PM", at3(re.id));
    const at6 = run({ tasks: [prev, re, ...mk()], nowMin: H(13, 6), checked: { [prev.id]: "12:35 PM Oct 9" } });
    ok("…at 1:06 it's assumed not started → after lunch", at6(re.id) === "2:00 PM", at6(re.id));
  }
  {
    const re = card("lucy", "12:54 PM", 20, "none", "Reading Eggs");
    const at = run({ tasks: [re, ...mk()], nowMin: H(12, 30) });
    ok("laid at 12:54 with nothing checked yet (Lucy's 10/6 card) → after lunch", at(re.id) === "2:00 PM", at(re.id));
  }
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
