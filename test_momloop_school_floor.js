/*
 * ⏰ The Mom-loop lay never places work before the school start (her rule 2026-09-23: "why did Ellis's Editor in
 * Chief sneak up above 10 am"). mlQueueLay runs LAST in render — mlQueueLay(dsRetime(…)) — so its floor must hold the
 * school start dsRetime already honours. Harness copied from test_momloop_lay.js.
 *   run:  node test_momloop_school_floor.js
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
  return { id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none",
    time, dur: dur || 20, title: title || (who + " card") };
}
function run(o) {
  o = o || {};
  const tasks = o.tasks || [];
  const ctx = {
    console, ROSTER: o.roster || ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: o.checked || {}, momMoves: {},
    getActiveTasks: () => tasks,
    morningComplete: (k) => (o.ready || {})[k] !== false,
    bbActive: (k) => (o.paused || {})[k] ? { phase: "go" } : null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = (typeof o.nowMin === "number") ? o.nowMin : 9 * 60;   // the living day lays from NOW; 9:00 = before school
  if (typeof o.endMin === "number") ctx._mlEndOverride = o.endMin;   // the cut line (default: the 4:15 PM Settings default)
  if (o.lunchWin !== undefined) ctx._mlLunchOverride = o.lunchWin;   // 🍎 [s,e] pins the lunch window; false = none (default: 1:00–2:00 PM)
  if (o.coopEnd) { ctx.routineDateISO = () => "2026-09-15"; ctx.coopTimedEndMin = (k, ds) => (ds === "2026-09-15" && o.coopEnd[k]) || 0; }   // 🏫 a timed co-op today for these kids
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  if (o.effectiveDay) ctx.effectiveDay = o.effectiveDay;
  if (o.rulesData) ctx.rulesData = o.rulesData;
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || { cursor: 0 }) + ";", ctx);
  if (o.momHold) vm.runInContext("momHold=" + JSON.stringify(o.momHold) + ";", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  const at = id => laid.find(t => t.id === id).time;
  return { laid, at, call: e => vm.runInContext(e, ctx) };
}


console.log("── ⏰ nothing is laid before the school start (her rule 2026-09-23) ──");
{
  // Live 9/23: Ellis's Mom-required Science was checked at 9:40 AM (before school); held with Mom, his next
  // Mom card (Editor in Chief) was laid at 9:45 — ahead of the 10:00 start.
  const sci = card("ellis", "9:40 AM", 25, "required", "Science"), eic = card("ellis", "12:40 PM", 20, "required", "Editor in Chief"),
        wr = card("ellis", "3:40 PM", 15, "required", "Word Roots"), nb = card("ellis", "10:00 AM", 5, "none", "Morning Notebook");
  const r = run({ tasks: [sci, eic, wr, nb], roster: ["ellis"], nowMin: 9 * 60 + 45, checked: { [sci.id]: "9:40 AM Sep 23" },
    momLoop: { cursor: 0, order: ["ellis"] }, momHold: { kid: "ellis", id: eic.id, day: "thursday" } });
  const m = s => { const x = /(\d+):(\d+)\s*([AP]M)/.exec(s); return (+x[1] % 12 + (x[3] === "PM" ? 12 : 0)) * 60 + +x[2]; };
  ok("the held kid's next Mom card waits for the school start (not 9:45)", m(r.at(eic.id)) >= 10 * 60, r.at(eic.id));
  ok("…and every open card of his lays at/after 10:00", [eic, wr, nb].every(t => m(r.at(t.id)) >= 10 * 60), [eic, wr, nb].map(t => r.at(t.id)));
  ok("the checked card keeps the time it was really done", r.at(sci.id) === "9:40 AM");
  const late = run({ tasks: [card("ellis", "12:40 PM", 20, "required", "EIC")], roster: ["ellis"], nowMin: 9 * 60 + 45,
    rulesData: { schoolDay: { defaultStart: "10:30 AM" } }, momLoop: { cursor: 0, order: ["ellis"] } });
  ok("the floor follows Settings (school start 10:30 → nothing before 10:30)", m(late.laid[0].time) >= 10 * 60 + 30, late.laid[0].time);
  const mid = run({ tasks: [card("ellis", "12:40 PM", 20, "required", "EIC")], roster: ["ellis"], nowMin: 11 * 60,
    momLoop: { cursor: 0, order: ["ellis"] } });
  ok("once school has started, now is still the floor (11:00, not 10:00)", m(mid.laid[0].time) >= 11 * 60, mid.laid[0].time);
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
