/*
 * Node tests — 🌙 the 8 PM sweep + ⏩ push early (living day, slice 3; her rules 2026-09-14).
 *
 *   · cards that fell off today move into the rest of the week at 8:00 PM, once, on one device
 *   · a marker per day stops repeats; the scheduler lock stops two devices sweeping at once
 *   · Mom's ⏩ is a two-tap button that sweeps early; a kid can't
 *   · it runs the SAME intra-week cascade (today-elapsed sweep) — nothing new about where work lands
 *
 *   run:  node test_evening_sweep.js
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

function world(o) {
  o = o || {};
  const log = { cascade: 0, sweepFlag: [], runCascade: 0, writes: [], toasts: [], renders: 0, lockClaims: 0 };
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"],
    WK: "week23", weekData: { week: "week23", tasks: [{ id: "x", who: "lucy", day: "thursday", time: "4:30 PM", dur: 20, title: "late", mom: "none" }] },
    fbTasksLoaded: o.tasksLoaded !== false, checked: {}, momMoves: {},
    getActiveTasks: () => ctx.weekData.tasks,
    morningComplete: () => true, bbActive: () => null,
    momHere: () => o.mom !== false, adminPinUnlocked: false,
    renderAll: () => { log.renders++; },
    lockHeldByOther: () => !!o.lockHeld,
    haClaimSchedLock: (kind, cb) => { log.lockClaims++; if (o.lockDenied) { cb(null); return; } cb(function release() {}); },
    cascadeIntraWeek: (flag) => { log.cascade++; log.sweepFlag.push(flag); },
    runCascade: () => { log.runCascade++; },
    gwShowToast: m => { log.toasts.push(m); },
    _dryRun: () => false,
    db: { ref: p => ({ set: v => { log.writes.push([p, v]); return Promise.resolve(); } }) },
    setTimeout: (fn) => { log.armTimer = fn; return 1; },
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
    _mlNowOverride: (typeof o.nowMin === "number") ? o.nowMin : 20 * 60,
  };
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0,order:ROSTER.slice()};", ctx);
  if (o.marker) vm.runInContext("eveningSweeps=" + JSON.stringify({ thursday: o.marker }) + ";", ctx);
  return { ctx, log, call: e => vm.runInContext(e, ctx) };
}

console.log("── when is the sweep due ──");
{
  const w = world({});
  ok("7:59 PM, no marker → not due", w.call("_mlSweepDue(19*60+59,null,false)") === false);
  ok("8:00 PM, no marker → due", w.call("_mlSweepDue(20*60,null,false)") === true);
  ok("8:00 PM, marker set → not due (already ran)", w.call("_mlSweepDue(20*60,'2026-09-14T20:00:00Z',false)") === false);
  ok("force → due whatever the clock or marker says", w.call("_mlSweepDue(11*60,'stamp',true)") === true);
}

console.log("\n── the 8 PM run ──");
{
  const w = world({ nowMin: 20 * 60 });
  const ran = w.call("mlEveningSweep(false)");
  ok("it ran", ran === true && w.log.cascade === 1);
  ok("it is the intra-week cascade's today-elapsed sweep (the same path the commit uses)", w.log.sweepFlag[0] === true);
  ok("…followed by the cross-week cascade, like the boot path", w.log.runCascade === 1);
  ok("it claimed the scheduler lock first", w.log.lockClaims === 1);
  ok("the marker is written for today, ISO stamped", w.log.writes.length === 1 && w.log.writes[0][0] === "week23/eveningSweep/thursday" && /^\d{4}-\d\d-\d\dT/.test(w.log.writes[0][1]), w.log.writes);
  ok("…and kept locally", /^\d{4}/.test(w.call("eveningSweeps.thursday")));
  ok("Mom is told", w.log.toasts.length === 1 && /8 PM/.test(w.log.toasts[0]), w.log.toasts);
  const again = w.call("mlEveningSweep(false)");
  ok("a second call the same evening is a no-op (marker)", again === false && w.log.cascade === 1);
}
{
  const w = world({ nowMin: 15 * 60 });
  ok("3:00 PM: not due, nothing runs", w.call("mlEveningSweep(false)") === false && w.log.cascade === 0 && w.log.writes.length === 0);
}
{
  const w = world({ nowMin: 20 * 60, marker: "2026-09-14T20:00:11.000Z" });
  ok("marker already there (another device swept) → nothing runs", w.call("mlEveningSweep(false)") === false && w.log.cascade === 0);
}
{
  const w = world({ nowMin: 20 * 60, lockHeld: true });
  ok("lock held elsewhere → wait (no run, no marker)", w.call("mlEveningSweep(false)") === false && w.log.cascade === 0 && w.log.writes.length === 0);
}
{
  const w = world({ nowMin: 20 * 60, lockDenied: true });
  w.call("mlEveningSweep(false)");
  ok("lock claim refused → no cascade, no marker (the other device's run writes it)", w.log.cascade === 0 && w.log.writes.length === 0);
}
{
  const w = world({ nowMin: 20 * 60, tasksLoaded: false });
  ok("tasks not loaded yet → nothing runs", w.call("mlEveningSweep(false)") === false && w.log.cascade === 0);
}
{
  const w = world({ nowMin: 0 });
  ok("just after midnight (new day, no marker, before 8 PM) → not due", w.call("mlEveningSweep(false)") === false);
}

console.log("\n── ⏩ push early ──");
{
  const w = world({ nowMin: 16 * 60 + 30 });
  w.call("mlSweepEarly()");
  ok("first tap ARMS — nothing swept yet", w.call("_mlSweepArmed") === true && w.log.cascade === 0);
  ok("…and re-renders so the button can say 'tap again'", w.log.renders >= 1);
  w.call("mlSweepEarly()");
  ok("second tap sweeps now, before 8 PM", w.log.cascade === 1 && w.log.sweepFlag[0] === true);
  ok("…disarms", w.call("_mlSweepArmed") === false);
  ok("the marker is written, so 8 PM won't sweep again", w.log.writes.length === 1 && w.log.writes[0][0] === "week23/eveningSweep/thursday");
  ok("Mom is told it was the early push", /⏩/.test(w.log.toasts[0]), w.log.toasts);
  ok("8 PM later that evening: no-op", (() => { w.ctx._mlNowOverride = 20 * 60; return w.call("mlEveningSweep(false)") === false && w.log.cascade === 1; })());
}
{
  const w = world({ nowMin: 16 * 60 + 30 });
  w.call("mlSweepEarly()");
  ok("the arm times out (6 s) back to disarmed", (() => { w.log.armTimer(); return w.call("_mlSweepArmed") === false; })());
}
{
  const w = world({ nowMin: 16 * 60 + 30, mom: false });
  w.call("mlSweepEarly()"); w.call("mlSweepEarly()");
  ok("a kid's tap does nothing (Mom-gated)", w.log.cascade === 0 && w.call("_mlSweepArmed") === false);
}
{
  const w = world({ nowMin: 16 * 60 + 30, lockDenied: true });
  w.call("mlSweepEarly()"); w.call("mlSweepEarly()");
  ok("early push while another device holds the lock: told, nothing swept", w.log.cascade === 0 && w.log.toasts.some(m => /Couldn/.test(m)), w.log.toasts);
}

console.log("\n── wiring in the page (source checks) ──");
{
  ok("every device checks the sweep once a minute", /setInterval\(function\(\)\{ try\{ if\(typeof mlEveningSweep==="function"\) mlEveningSweep\(false\); \}catch\(e\)\{\} \},60000\);/.test(src));
  ok("the marker is subscribed with the week (like dayStart)", /db\.ref\(wk\+"\/eveningSweep"\)/.test(src) && /eveningSweeps=s\.val\(\)\|\|\{\};/.test(src));
  ok("the ⏩ button is Mom-only and today-only", /momHere\(\)&&day===_todayDay\?'<button class="bo-btn" onclick="mlSweepEarly\(\)"/.test(src));
  ok("the didn't-fit list is gated by the same per-kid Carryover switch", /offToday=offToday\.filter\(t=>!carryHidden\(t\.who\)\)/.test(src));
  ok("fallen cards leave the timeline only on TODAY's view", /let offToday=\(day===_todayDay\)\?tasks\.filter\(t=>t\._offDay&&!checked\[t\.id\]\):\[\];/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
