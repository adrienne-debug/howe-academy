/*
 * Node tests for CLOSEFIX — a lone closing card follows the living day (her report 2026-10-06).
 *
 * Live Mon 10/5: Lincoln checked Ind Reading at 3:52 PM and his Closing Notebook jumped to 10:00 AM.
 * dsRetime had pulled his unchecked cards back to the day's start, and the closing tuck skipped a
 * closing card with nothing else left ("keeps its own time") — so it kept the pulled 10:00 AM.
 * Now a lone closing card is the card in hand: it starts when the last card was checked off, and
 * once the clock passes its end it slides so it ends at now — like any card in hand.
 *
 *   run:  node test_closing_lone.js
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
function card(who, time, dur, title, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, day: "thursday", mom: "none",
    time, dur: dur || 20, title: title || (who + " card") }, extra || {});
}
function run(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, momMoves: {},
    getActiveTasks: () => tasks,
    morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  return id => laid.find(t => t.id === id).time;
}
const H = (h, m) => h * 60 + m;

console.log("── live 10/5: last card checked at 3:52 → the closing card does NOT jump to the morning ──");
{
  const nb = card("lincoln", "10:18 AM", 20, "📖 Morning Notebook");
  const rd = card("lincoln", "3:31 PM", 20, "📖 Ind Reading");
  const cl = card("lincoln", "10:00 AM", 5, "📖 Closing Notebook", { subjectKey: "closing_nb" });   // where dsRetime pulled it
  const at = run({ tasks: [nb, rd, cl], nowMin: H(15, 53),
    checked: { [nb.id]: "10:38 AM Oct 5", [rd.id]: "3:52 PM Oct 5" } });
  ok("closing starts when Ind Reading was checked off (3:52 PM)", at(cl.id) === "3:52 PM", at(cl.id));
}
console.log("\n── a lone closing card past its end slides to end at now ──");
{
  const rd = card("ellis", "11:00 AM", 20, "📖 Ind Reading");
  const cl = card("ellis", "10:00 AM", 5, "📖 Closing Notebook");
  const at = run({ tasks: [rd, cl], nowMin: H(15, 0), checked: { [rd.id]: "11:20 AM Oct 5" } });
  ok("closing ends at now (2:55 PM start at 3:00 PM)", at(cl.id) === "2:55 PM", at(cl.id));
}
console.log("\n── unchanged: with work still open the closing card tucks after it ──");
{
  const rd = card("lucy", "2:30 PM", 20, "📖 Ind Reading");
  const cl = card("lucy", "10:00 AM", 5, "📖 Closing Notebook");
  const at = run({ tasks: [rd, cl], nowMin: H(14, 30) });
  ok("closing follows the last open card (2:50 PM)", at(cl.id) === "2:50 PM", at(cl.id));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
