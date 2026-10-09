/*
 * #30 — kids keep moving while a card waits on Mom (her answers 2026-10-08, Option B: claimed = done for the kid's flow).
 *
 * Live: a card the kid sent to Mom to check (claimed — "⏳ Waiting for Mom") was still OPEN to the living-day lay. It
 * stayed the card "in hand", slid so it ended at now all afternoon, and every card behind it dragged later and later.
 * Now a claimed card counts as finished for the kid's flow: it sits where it was, ends at the moment it was sent, and
 * the kid's next card lays from there. Mom's loop stops pointing at it too (it waits on her close-out list instead).
 *
 *   run:  node test_claimed_keeps_moving.js
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
function world(o) {
  const tasks = o.tasks;
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, claimed: o.claimed || {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  return { lay: () => { const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx); return id => laid.find(t => t.id === id).time; },
    call: e => vm.runInContext(e, ctx) };
}
const H = (h, m) => h * 60 + m;

console.log("── Ellis sent Writing to Mom at 10:30; it's 11:40 ──");
{
  const w1 = card("ellis", "10:00 AM", 30, "none", "Writing"), w2 = card("ellis", "10:30 AM", 30, "none", "Spelling"), w3 = card("ellis", "11:00 AM", 30, "none", "Science");
  const w = world({ tasks: [w1, w2, w3], nowMin: H(11, 40), claimed: { [w1.id]: "10:30 AM Oct 8" } });
  const at = w.lay();
  ok("the claimed card stays where it was (10:00 AM) — not slid to end at now", at(w1.id) === "10:00 AM", at(w1.id));
  ok("the card behind it is the one in hand: starts at the send (10:30), ends at now (11:10 AM)", at(w2.id) === "11:10 AM", at(w2.id));
  ok("…and the next lays right after it (11:40 AM), not dragged behind the claimed card", at(w3.id) === "11:40 AM", at(w3.id));
}
console.log("\n── before the fix the claimed card was in hand (the drag) — a checked card behaves the same as claimed ──");
{
  const w1 = card("ellis", "10:00 AM", 30, "none", "Writing"), w2 = card("ellis", "10:30 AM", 30, "none", "Spelling");
  const ck = world({ tasks: [w1, w2], nowMin: H(10, 45), checked: { [w1.id]: "10:30 AM Oct 8" } }).lay();
  const cl = world({ tasks: [w1, w2], nowMin: H(10, 45), claimed: { [w1.id]: "10:30 AM Oct 8" } }).lay();
  ok("claimed lays exactly like checked (Writing)", cl(w1.id) === ck(w1.id), [cl(w1.id), ck(w1.id)]);
  ok("claimed lays exactly like checked (Spelling)", cl(w2.id) === ck(w2.id), [cl(w2.id), ck(w2.id)]);
}
console.log("\n── Mom's loop: a claimed Mom card is not her 'now' ──");
{
  const m1 = card("lucy", "10:00 AM", 20, "required", "Lucy Mom lesson"), m2 = card("lucy", "10:20 AM", 20, "required", "Lucy Mom 2");
  const w = world({ tasks: [m1, m2], nowMin: H(10, 30), claimed: { [m1.id]: "10:20 AM Oct 8" } });
  const rem = w.call("mlRemaining('lucy').map(function(t){return t.id;})");
  ok("mlRemaining skips the claimed one", rem.length === 1 && rem[0] === m2.id, rem);
  w.call("momHold={kid:'lucy',id:'" + m1.id + "',day:'thursday'}");
  ok("a hold on a claimed card is released (finished on any device)", w.call("mlHold()") === null);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
