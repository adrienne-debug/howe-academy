/*
 * #23 — "Mom part done → kid keeps working" (her answers 2026-10-08, Option C; the on-the-day tap, built first).
 *
 * Mom taps "✓ Mom part done" on a Mom-required card (Mom-mode card, or the loop strip's now-card). The card stays the
 * kid's: they keep working until they check it off (no minutes shown). It stops being Mom work — her loop moves on as if
 * she had checked it, and the living-day lay treats it as the kid's own card in hand. "↩ Mom still needed" undoes it.
 * The kid's own check-off closes it (and does not re-lock Mom). The per-subject Mom-at-start/end setting is NOT built here.
 *
 *   run:  node test_mom_part_done.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
const BLOCK = src.slice(a, b) + "\n" + (function () { const i = src.indexOf("function mlMomPartDone("); return src.slice(i, src.indexOf("\n}", i) + 2); })();
function slice(name) {
  const i = src.indexOf("function " + name);
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const HELPERS = slice("toMin") + "\n" + slice("fromMin");
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
let ID = 0;
function card(who, time, dur, mom, title, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") }, extra || {});
}
function world(o) {
  const tasks = o.tasks;
  const log = { writes: [] };
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"],
    db: { ref: p => ({ set: v => { log.writes.push([p, v]); }, remove: () => { log.writes.push([p, null]); } }) },
    _dryRun: () => false, WK: "week26", weekData: { tasks }, lastTasksWrite: 0, sv: () => {}, dbg: () => {},
    nowTs: () => "10:40 AM Oct 8",
    checked: o.checked || {}, claimed: {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => o.mom !== false, momHereCards: () => o.mom !== false, adminPinUnlocked: false, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0,order:['lucy','ellis']};", ctx);
  return { ctx, log, call: e => vm.runInContext(e, ctx),
    lay: () => { const laid = vm.runInContext("mlQueueLay(weekData.tasks)", ctx); return id => laid.find(t => t.id === id); } };
}
const H = (h, m) => h * 60 + m;

console.log("── Lucy's Mom lesson: Mom taps ✓ Mom part done at 10:40 ──");
{
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)"), l2 = card("lucy", "11:00 AM", 20, "none", "Lucy Reading Eggs");
  const e1 = card("ellis", "10:00 AM", 30, "none", "Ellis Writing"), e2 = card("ellis", "11:00 AM", 30, "required", "Ellis Grammar (Mom)");
  const w = world({ tasks: [m1, l2, e1, e2], nowMin: H(10, 40), checked: { [e1.id]: "10:30 AM Oct 8" } });
  w.call("momHold={kid:'lucy',id:'" + m1.id + "',day:'thursday'}");
  ok("before the tap: Mom is with Lucy (held)", w.call("mlNow().kid") === "lucy");
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("the card is stamped momPartDone", w.call("weekData.tasks[0].momPartDone") === "10:40 AM Oct 8");
  ok("one targeted field write (tasks/<id>/momPartDone)", w.log.writes.some(x => x[0] === "week26/tasks/" + m1.id + "/momPartDone" && x[1] === "10:40 AM Oct 8"), w.log.writes);
  ok("Lucy's card is no longer Mom work (mlRemaining)", w.call("mlRemaining('lucy').length") === 0);
  ok("the session hold on it is released", w.call("mlHold()") === null);
  ok("Mom's loop moves on to Ellis", w.call("mlNow().kid") === "ellis", w.call("JSON.stringify(mlNow())"));
  const at = w.lay();
  ok("the card is still on Lucy's timeline, unchecked — she keeps working on it", at(m1.id) && !w.call("checked['" + m1.id + "']"));
  ok("…and it lays as her own card in hand (not greyed as waiting on Mom)", !at(m1.id)._momWait);
  w.call("mlOnCheck(weekData.tasks[0])");
  ok("Lucy's own check-off later does not re-lock Mom onto her", w.call("mlNow().kid") === "ellis");
}
console.log("\n── undo + gates ──");
{
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)");
  const w = world({ tasks: [m1], nowMin: H(10, 40) });
  w.call("mlMomPartDone('" + m1.id + "',true)"); w.call("mlMomPartDone('" + m1.id + "',false)");
  ok("↩ Mom still needed puts it back in her Mom work", w.call("mlRemaining('lucy').length") === 1 && w.call("weekData.tasks[0].momPartDone") === undefined);
  ok("…and clears the stored field", w.log.writes.some(x => x[0] === "week26/tasks/" + m1.id + "/momPartDone" && x[1] === null));
}
{
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)");
  const w = world({ tasks: [m1], nowMin: H(10, 40), mom: false });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("a kid can't tap it (Mom-only)", w.call("weekData.tasks[0].momPartDone") === undefined && w.log.writes.length === 0);
}
{
  const n1 = card("lucy", "10:20 AM", 40, "none", "Lucy Reading Eggs");
  const w = world({ tasks: [n1], nowMin: H(10, 40) });
  w.call("mlMomPartDone('" + n1.id + "',true)");
  ok("only Mom-required cards take it", w.call("weekData.tasks[0].momPartDone") === undefined);
}
console.log("\n── where the tap lives (source) ──");
ok("on the card in Mom mode (✓ Mom part done / ↩ Mom still needed) — the kid sees 'keep going until you check it off'",
  /const mpdRow=/.test(src) && /\+nbRedoRow\+mpdRow\+/.test(src) && /keep going until you check it off/.test(src));
ok("on the Mom loop strip beside the now-card", /mlMomPartDone\(\\''\+nc\.id\+'\\',true\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
