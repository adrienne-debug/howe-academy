/*
 * MOMNEXT — "after ✓ Mom part done, an OPTION to go to the next kid" (her ask 2026-10-13, DeWalt family).
 *
 * Today, after Mom taps "✓ Mom part done", the loop re-points her hold at the SAME kid's next Mom card and she "just sits
 * there idle". Now the strip offers a choice (never automatic):
 *   · Stay with <Kid>           — today's behaviour, no write
 *   · Next with work: <Kid2>    — the kid is switched OFF until they tick off the part-done card (off/<kid> + offFor/<kid>);
 *                                 their hold is kept; the pause ends by itself when the card is checked, claimed, or gone
 *   · Next in rotation: <Kid2>  — only when a different kid: "Start the loop on" (cursor + stamp, hold removed)
 * Nobody qualifies → a toast, no buttons. A help ask active, or Mom off → no offer. A kid in a timed co-op is skipped
 * until its end time. "↩ Mom still needed" ends the pause.
 *
 *   run:  node test_mom_next.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
const u = src.indexOf("// MOMNEXT_UI_START"), u2 = src.indexOf("// MOMNEXT_UI_END");
if (a < 0 || b < 0 || u < 0 || u2 < 0) { console.error("MOMLOOP / MOMNEXT_UI markers not found"); process.exit(1); }
const MPD = (function () { const i = src.indexOf("function mlMomPartDone("); return src.slice(i, src.indexOf("\n}", i) + 2); })();
const BLOCK = src.slice(a, b) + "\n" + MPD + "\n" + src.slice(u, u2);
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
function card(who, time, dur, mom, title, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") }, extra || {});
}
const H = (h, m) => h * 60 + m;
// The world — the test_mom_part_done harness, plus: a ready/paused map per kid, a help-ask stub, a timed co-op stub,
// a toast recorder, a setTimeout recorder (the 60 s offer timer never fires here), and the stored momLoop/momHold.
function world(o) {
  const tasks = o.tasks;
  const log = { writes: [], toasts: [], timers: [] };
  const st = { ready: o.ready || {}, paused: o.paused || {} };
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"],
    db: { ref: p => ({ set: v => { log.writes.push([p, v]); }, remove: () => { log.writes.push([p, null]); } }) },
    _dryRun: () => false, WK: "week26", weekData: { tasks }, lastTasksWrite: 0, sv: () => {}, dbg: () => {},
    nowTs: () => "10:40 AM Oct 13",
    checked: o.checked || {}, claimed: o.claimed || {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: k => st.ready[k] !== false, bbActive: k => st.paused[k] ? { phase: "go" } : null,
    momHere: () => o.mom !== false, momHereCards: () => o.mom !== false, adminPinUnlocked: false, renderAll: () => {},
    gwShowToast: m => { log.toasts.push(m); },
    setTimeout: (fn, ms) => { log.timers.push({ fn, ms }); return log.timers.length; },
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  if (o.hr) ctx.hrLoopTurn = () => o.hr();
  if (o.coop) { ctx.routineDateISO = () => "2026-10-15"; ctx.coopTimedEndMin = (k, ds) => (ds === "2026-10-15" && o.coop[k]) || 0; }
  ctx._mlNowOverride = o.nowMin;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || { cursor: 0, order: ["lucy", "ellis"] }) + ";", ctx);
  vm.runInContext("momHold=" + JSON.stringify(o.momHold || {}) + ";", ctx);
  const call = e => vm.runInContext(e, ctx);
  return { ctx, log, st, call,
    stamp: call("_mlDayStamp()"),
    cfgWrites: () => log.writes.filter(x => /^config\/momLoop\//.test(x[0]) || /momHold/.test(x[0])),
    choice: () => call("mnChoiceHTML()"),
    lay: () => { const laid = call("mlQueueLay(weekData.tasks)"); return id => laid.find(t => t.id === id); },
    now: () => call("JSON.stringify(mlNow())") && call("mlNow()") };
}
// Lucy with TWO Mom cards (m1 held, m2 after), Ellis with an independent card (checked) then a Mom card.
function twoMomCards(extra) {
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)"), m2 = card("lucy", "11:00 AM", 20, "required", "Lucy Reading (Mom)");
  const e1 = card("ellis", "10:00 AM", 30, "none", "Ellis Writing"), e2 = card("ellis", "11:00 AM", 30, "required", "Ellis Grammar (Mom)");
  const w = world(Object.assign({ tasks: [m1, m2, e1, e2], nowMin: H(10, 40), checked: { [e1.id]: "10:30 AM Oct 13" },
    momHold: { kid: "lucy", id: m1.id, day: "thursday" } }, extra || {}));
  return { w, m1, m2, e1, e2 };
}

console.log("── (a) two Mom cards → part-done → the choice is shown; Stay = no writes ──");
{
  const { w, m1, m2 } = twoMomCards();
  ok("before the tap: Mom is with Lucy (held on Math)", w.now().kid === "lucy" && w.now().held === true);
  ok("no choice before the tap", w.choice() === "");
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("the loop still says Lucy (her hold re-pointed at Reading) — this is the idle she reported", w.now().kid === "lucy" && w.call("momHold.id") === m2.id, w.now());
  const h = w.choice();
  ok("the strip shows the choice", /stay, or move on\?/.test(h), h);
  ok("…with 'Stay with Lucy'", /mnStay\(\)[^>]*>Stay with Lucy</.test(h));
  ok("…and 'Next with work: Ellis'", /mnNextWithWork\(\)[^>]*>Next with work: Ellis/.test(h));
  ok("…and NO 'Next in rotation' (Ellis is both the ring-next and the next with work)", !/Next in rotation/.test(h));
  ok("Ellis's card in hand IS the Mom card → no 'after …'", !/after /.test(h));
  ok("the offer is a 60 s per-device timer, nothing stored", w.log.timers.length === 1 && w.log.timers[0].ms === 60000 && w.call("_mnArm.kid") === "lucy");
  ok("the strip's hook is in place", /if\(typeof mnChoiceHTML==="function"\) h\+=mnChoiceHTML\(\);/.test(src));
  const before = w.cfgWrites().length;
  w.call("mnStay()");
  ok("Stay: the choice is gone and NOTHING was written to the loop", w.choice() === "" && w.cfgWrites().length === before && w.call("_mnArm") === null, w.cfgWrites());
  ok("the part-done tap itself still wrote only momPartDone + the hold", w.log.writes.every(x => /\/momPartDone$/.test(x[0]) || /momHold/.test(x[0])), w.log.writes);
  ok("Stay keeps Mom on Lucy", w.now().kid === "lucy");
  // the timer firing later clears a still-armed offer, and never one that was replaced
  w.call("mlMomPartDone('" + m2.id + "',false)"); w.call("mlMomPartDone('" + m2.id + "',true)");
}
{
  const { w, m1 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("the timer: still armed when it fires → cleared", (function () { w.log.timers[0].fn(); return w.call("_mnArm") === null; })());
}

console.log("\n── (b) Next with work: Lucy is paused until she ticks off the part-done card; Ellis gets Mom; Lucy returns ──");
{
  const { w, m1, m2, e2 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)");
  w.call("mnNextWithWork()");
  const cw = w.cfgWrites();
  ok("two targeted writes: off/lucy = today, offFor/lucy = {id: Math, day: today}",
    cw.some(x => x[0] === "config/momLoop/off/lucy" && x[1] === w.stamp)
    && cw.some(x => x[0] === "config/momLoop/offFor/lucy" && x[1] && x[1].id === m1.id && x[1].day === w.stamp), cw);
  ok("…and nothing else to the loop (no cursor, no hold change)", cw.every(x => /^config\/momLoop\/off(For)?\/lucy$/.test(x[0]) || x[0] === "week26/momHold"), cw);
  ok("the hold: released from Math, re-pointed at Reading by the tap (existing rule) — and the pause leaves it there", (function () { const hw = cw.filter(x => x[0] === "week26/momHold"); return hw.length === 2 && hw[0][1] === null && hw[1][1] && hw[1][1].id === m2.id; })() && w.call("momHold.kid") === "lucy" && w.call("momHold.id") === m2.id, cw);
  ok("Lucy reads OFF (paused)", w.call("mlOff('lucy')") === true && w.call("mlStatus()").find(x => x.kid === "lucy").state === "off");
  ok("Mom's loop is with Ellis", w.now().kid === "ellis", w.now());
  ok("the choice is gone", w.choice() === "" && w.call("_mnArm") === null);
  const at = w.lay();
  ok("Lucy's part-done card is still on her timeline, unchecked, as her own card in hand", at(m1.id) && !at(m1.id)._momWait && !w.call("checked['" + m1.id + "']"));
  ok("Ellis's Mom card (his card in hand, 11:00) lays first — Lucy's Reading block drops behind the ON kid, not on top of it", at(e2.id).time === "11:00 AM" && toMinLocal(at(m2.id).time) >= toMinLocal(at(e2.id).time) + 30, [at(e2.id).time, at(m2.id).time]);
  // another card checked ≠ the offFor card: still paused
  w.call("checked['" + m2.id + "']='x'");
  ok("checking a DIFFERENT card does not end the pause", w.call("mlOff('lucy')") === true);
  w.call("delete checked['" + m2.id + "']");
  // Lucy ticks off the part-done card → back on, by derivation (no write)
  const n = w.log.writes.length;
  w.call("checked['" + m1.id + "']='10:55 AM Oct 13'");
  ok("Lucy checks Math → she is back ON (derived; no write)", w.call("mlOff('lucy')") === false && w.log.writes.length === n);
  ok("…and her kept hold brings Mom back to her, on Reading", w.now().kid === "lucy" && w.now().held === true && w.call("mlHold().id") === m2.id, w.now());
  ok("her kid banner no longer says 'Not with Mom yet'", !/Not with Mom yet/.test(w.call("mlBannerHTML('lucy')")));
  ok("the stored off/offFor are still there (self-clearing overnight) but inert", w.call("momLoop.off.lucy") === w.stamp && w.call("momLoop.offFor.lucy.id") === m1.id);
  // a plain flip after that still works: Mom switches Lucy off by hand → the stale offFor goes with it
  w.call("mlSetOff('lucy',true)");
  ok("a later manual OFF is a real off again (offFor cleared with it)", w.call("mlOff('lucy')") === true && w.call("momLoop.offFor.lucy") === undefined
    && w.log.writes.some(x => x[0] === "config/momLoop/offFor/lucy" && x[1] === null), w.log.writes.slice(-3));
}
{
  const { w, m1 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)"); w.call("mnNextWithWork()");
  ok("sent to Mom to check (claimed) ends the pause too", (function () { w.call("claimed['" + m1.id + "']='10:50 AM Oct 13'"); return w.call("mlOff('lucy')") === false && w.now().kid === "lucy"; })());
}
{
  const { w, m1 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)"); w.call("mnNextWithWork()");
  w.call("weekData.tasks.splice(0,1)");   // the card is gone from today (moved/removed)
  ok("the offFor card gone from the day → nothing to wait for → back on", w.call("mlOff('lucy')") === false);
}
{
  const { w, m1 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)"); w.call("mnNextWithWork()");
  ok("paused: Lucy's banner says Not with Mom yet (keep going on your own work)", /Not with Mom yet/.test(w.call("mlBannerHTML('lucy')")));
  w.call("mlMomPartDone('" + m1.id + "',false)");
  ok("↩ Mom still needed: off + offFor removed, Lucy is back on, the card is Mom work again",
    w.call("mlOff('lucy')") === false && w.call("mlRemaining('lucy').length") === 2
    && w.log.writes.some(x => x[0] === "config/momLoop/off/lucy" && x[1] === null) && w.log.writes.some(x => x[0] === "config/momLoop/offFor/lucy" && x[1] === null), w.log.writes);
}
{
  const { w, m1 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)"); w.call("mnNextWithWork()");
  w.call("mlSetOff('lucy',true)");   // Mom switches her off by hand while paused
  w.call("checked['" + m1.id + "']='x'");
  ok("Mom's own OFF tap while paused outlives the card (a real off, not the pause)", w.call("mlOff('lucy')") === true);
}
{
  // Kid2 mid-card: Ellis's Writing is still open → the label says after it
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)"), m2 = card("lucy", "11:00 AM", 20, "required", "Lucy Reading (Mom)");
  const e1 = card("ellis", "10:00 AM", 30, "none", "Ellis Writing"), e2 = card("ellis", "11:00 AM", 30, "required", "Ellis Grammar (Mom)");
  const w = world({ tasks: [m1, m2, e1, e2], nowMin: H(10, 40), momHold: { kid: "lucy", id: m1.id, day: "thursday" } });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Kid2 mid-card → 'Next with work: Ellis (after Ellis Writing)'", /Next with work: Ellis <span[^>]*>\(after Ellis Writing\)/.test(w.choice()), w.choice());
}
{
  // another device / a check moved the loop on before Mom tapped a button → the offer withdraws itself
  const { w, m1, m2 } = twoMomCards();
  w.call("mlMomPartDone('" + m1.id + "',true)");
  w.call("checked['" + m2.id + "']='x'");   // Lucy's last Mom card done elsewhere
  ok("the loop moved on by itself → no choice, nothing armed", w.choice() === "" && w.call("_mnArm") === null);
  w.call("mnNextWithWork()");
  ok("…and a late tap writes nothing", !w.cfgWrites().some(x => /off/.test(x[0])));
}
{
  const { w, m1 } = twoMomCards({ mom: false });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("a kid's device: no part-done, no offer", w.call("_mnArm") === null && w.log.writes.length === 0);
}

console.log("\n── (c) nobody else ready → toast, no buttons ──");
{
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)"), m2 = card("lucy", "11:00 AM", 20, "required", "Lucy Reading (Mom)");
  const e1 = card("ellis", "10:00 AM", 30, "none", "Ellis Writing");
  const w = world({ tasks: [m1, m2, e1], nowMin: H(10, 40), momHold: { kid: "lucy", id: m1.id, day: "thursday" } });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Ellis has no Mom work → 'Nobody else is ready — staying with Lucy'", w.log.toasts.length === 1 && /Nobody else is ready/.test(w.log.toasts[0]) && /staying with Lucy/.test(w.log.toasts[0]), w.log.toasts);
  ok("no buttons, nothing armed, Mom stays with Lucy", w.choice() === "" && w.call("_mnArm") === null && w.now().kid === "lucy");
  ok("no loop writes", w.cfgWrites().every(x => x[0] === "week26/momHold"), w.cfgWrites());
}
{
  const { w, m1 } = twoMomCards({ ready: { ellis: false } });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Ellis still on routine → nobody", w.log.toasts.length === 1 && w.choice() === "");
}
{
  const { w, m1 } = twoMomCards({ paused: { ellis: true } });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Ellis on a brain break → nobody", w.log.toasts.length === 1 && w.choice() === "");
}
{
  const { w, m1 } = twoMomCards();
  w.call("momLoop.off={ellis:_mlDayStamp()}");
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Ellis switched off → nobody", w.log.toasts.length === 1 && w.choice() === "");
}
{
  const { w, m1, e2 } = twoMomCards({ checked: { [card("x", "1:00 PM").id]: "x" } });
  w.call("checked['" + e2.id + "']='x'");
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Ellis done → nobody", w.log.toasts.length === 1 && w.choice() === "");
}

console.log("\n── (d) a help ask is active → no offer at all ──");
{
  const { w, m1 } = twoMomCards({ hr: () => ({ id: "hr_1", kid: "lincoln", mode: "now", active: true }) });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("help now active → no choice, no toast", w.choice() === "" && w.call("_mnArm") === null && w.log.toasts.length === 0);
}
{
  const { w, m1 } = twoMomCards({ hr: () => ({ id: "hr_1", kid: "lincoln", mode: "next", active: false, after: "lucy" }) });
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("a 'help next' still waiting (not active) does not block the offer", /Next with work/.test(w.choice()));
}

console.log("\n── (e) a kid in a timed co-op is skipped until its end time ──");
{
  const mk = (nowMin) => {
    const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)"), m2 = card("lucy", "11:00 AM", 20, "required", "Lucy Reading (Mom)");
    const e2 = card("ellis", "11:00 AM", 30, "required", "Ellis Grammar (Mom)");
    const l2 = card("lincoln", "11:00 AM", 30, "required", "Lincoln AAS (Mom)");
    const w = world({ tasks: [m1, m2, e2, l2], nowMin, momLoop: { cursor: 0, order: ["lucy", "ellis", "lincoln"] },
      momHold: { kid: "lucy", id: m1.id, day: "thursday" }, coop: { ellis: H(12, 0) } });
    w.call("mlMomPartDone('" + m1.id + "',true)");
    return w;
  };
  let w = mk(H(10, 40));
  ok("10:40, Ellis at co-op until 12:00 → next with work is Lincoln", w.call("mlNextWithWork('lucy')") === "lincoln" && /Next with work: Lincoln/.test(w.choice()), w.choice());
  ok("…and no 'Next in rotation' (the ring-next, Ellis, does not qualify)", w.call("mlNextInRotation('lucy')") === null && !/Next in rotation/.test(w.choice()));
  w = mk(H(12, 10));
  ok("12:10, co-op over → Ellis is next with work again", w.call("mlNextWithWork('lucy')") === "ellis" && w.call("mlNextInRotation('lucy')") === "ellis");
}

console.log("\n── (f) Mom off → nothing ──");
{
  const { w, m1 } = twoMomCards();
  w.call("momLoop.momOff=_mlDayStamp()");
  w.call("mlMomPartDone('" + m1.id + "',true)");
  ok("Mom off: no choice, no toast, nothing armed", w.choice() === "" && w.call("_mnArm") === null && w.log.toasts.length === 0);
}

console.log("\n── Next in rotation (only when a different kid): the behind marker puts Ellis ahead of Lincoln ──");
{
  const m1 = card("lucy", "10:20 AM", 40, "required", "Lucy Math (Mom)"), m2 = card("lucy", "11:00 AM", 20, "required", "Lucy Reading (Mom)");
  const l2 = card("lincoln", "11:00 AM", 30, "required", "Lincoln AAS (Mom)"), e2 = card("ellis", "11:00 AM", 30, "required", "Ellis Grammar (Mom)");
  const w = world({ tasks: [m1, m2, l2, e2], nowMin: H(10, 40), momLoop: { cursor: 0, order: ["lucy", "lincoln", "ellis"] }, momHold: { kid: "lucy", id: m1.id, day: "thursday" } });
  {
    // a behind kid who is NOT the one Mom is with simply takes her when the hold lets go — the loop moved on by itself, no choice
    const w0 = world({ tasks: [m1, m2, l2, e2], nowMin: H(10, 40), momLoop: { cursor: 0, order: ["lucy", "lincoln", "ellis"] }, momHold: { kid: "lucy", id: m1.id, day: "thursday" } });
    w0.call("mlBehindAll=function(){ return {lincoln:{pct:40}}; };");
    w0.call("mlMomPartDone('" + m1.id + "',true)");
    ok("Lincoln behind → the loop goes to him by itself after the tap (existing rule); no choice offered", w0.now().kid === "lincoln" && w0.choice() === "" && w0.log.toasts.length === 0, w0.now());
  }
  w.call("mlBehindAll=function(){ return {lucy:{pct:40},ellis:{pct:20}}; };");   // Lucy and Ellis owe lessons → the scan order is Lucy, Ellis, Lincoln
  ok("scan order: Lucy, Ellis, Lincoln", w.call("JSON.stringify(_mlScan().order)") === '["lucy","ellis","lincoln"]');
  w.call("mlMomPartDone('" + m1.id + "',true)");
  const h = w.choice();
  ok("next with work (scan order after Lucy) = Ellis; next in rotation (ring after Lucy) = Lincoln",
    w.call("mlNextWithWork('lucy')") === "ellis" && w.call("mlNextInRotation('lucy')") === "lincoln");
  ok("both buttons show, the rotation one labelled '(Lucy loses their place)'", /Next with work: Ellis/.test(h) && /Next in rotation: Lincoln <span[^>]*>\(Lucy loses their place\)/.test(h), h);
  w.call("mnNextInRotation()");
  const cw = w.cfgWrites();
  ok("Next in rotation = the existing 'Start the loop on' lever: cursor 1 + today's stamp, hold removed, no off",
    cw.some(x => x[0] === "config/momLoop/cursor" && x[1] === 1) && cw.some(x => x[0] === "config/momLoop/cursorSetOn" && x[1] === w.stamp)
    && cw.some(x => x[0] === "week26/momHold" && x[1] === null) && !cw.some(x => /off/.test(x[0])), cw);
  ok("Mom is with Lincoln; Lucy is NOT off (she just lost her place)", w.now().kid === "lincoln" && w.call("mlOff('lucy')") === false, w.now());
  ok("the choice is gone", w.choice() === "");
}

// ── the day-walk replay (test_momloop_switch.js style): after a pause, nothing is dropped or stacked ──
console.log("\n── day walk: part-done → Next with work → the kid ticks the card → the loop comes back; invariants every step ──");
{
  const T = [];
  T.push(card("julian", "10:00 AM", 15, "required", "Morning Notebook"));
  T.push(card("julian", "10:15 AM", 10, "required", "Daily Drill"));
  T.push(card("julian", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("julian", "1:00 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  T.push(card("lucy", "10:00 AM", 20, "none", "Notebook"));
  T.push(card("lucy", "10:20 AM", 20, "required", "Read-Aloud"));
  T.push(card("lucy", "10:40 AM", 25, "required", "Dimensions"));
  T.push(card("lucy", "11:05 AM", 15, "none", "Reading Eggs"));
  T.push(card("lucy", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("lucy", "12:30 PM", 15, "maybe", "HWT"));
  T.push(card("lucy", "12:45 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  T.push(card("lincoln", "10:00 AM", 20, "none", "Notebook"));
  T.push(card("lincoln", "10:20 AM", 30, "none", "MR5"));
  T.push(card("lincoln", "10:50 AM", 25, "required", "Editor in Chief"));
  T.push(card("lincoln", "11:15 AM", 20, "required", "Spelling You See"));
  T.push(card("lincoln", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("lincoln", "12:30 PM", 30, "none", "Eggspress"));
  T.push(card("lincoln", "1:00 PM", 20, "required", "AAS"));
  T.push(card("lincoln", "1:20 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  T.push(card("ellis", "10:00 AM", 20, "none", "Notebook"));
  T.push(card("ellis", "10:20 AM", 20, "required", "Reading Detective"));
  T.push(card("ellis", "10:40 AM", 25, "none", "Singapore"));
  T.push(card("ellis", "11:05 AM", 20, "required", "Word Roots"));
  T.push(card("ellis", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("ellis", "12:30 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  const ORDER = ["julian", "lucy", "lincoln", "ellis"];
  const byTitle = (k, t) => T.find(x => x.who === k && x.title === t);
  // one "render": rebuild the block from the stored state (as every device does on every Firebase event)
  const derive = st => {
    const w = world({ tasks: T, nowMin: st.nowMin, checked: st.checked, claimed: st.claimed, ready: st.ready, paused: st.paused,
      momLoop: st.momLoop, momHold: st.momHold });
    return { w, call: w.call, laid: w.call("mlQueueLay(weekData.tasks)"), now: w.now(), status: w.call("mlStatus()"), hold: w.call("mlHold()") };
  };
  const invariants = (label, st, d) => {
    const laid = d.laid, tm = t => toMinLocal(t.time), end = t => tm(t) + (t.dur || 20);
    ok(label + ": nothing dropped (same ids, same count)", laid.length === T.length && T.every(t => laid.some(x => x.id === t.id)), { stored: T.length, laid: laid.length });
    ok(label + ": every card still has a real time", laid.every(t => typeof t.time === "string" && !isNaN(tm(t))));
    ok(label + ": no card lost its identity/duration/kid", laid.every(t => { const s = T.find(x => x.id === t.id); return s && s.who === t.who && s.dur === t.dur && s.title === t.title && s.mom === t.mom; }));
    const moved = laid.filter(t => { const s = T.find(x => x.id === t.id); return s.time !== t.time; });
    ok(label + ": checked cards never move", moved.every(t => !st.checked[t.id]));
    ok(label + ": lunch never moves", moved.every(t => !/lunch/i.test(t.title)));
    const on = k => !d.call("mlOff('" + k + "')") && st.ready[k] !== false;   // the DERIVED switch (offFor counts)
    const momCards = laid.filter(t => t.mom === "required" && !st.checked[t.id] && !t.momPartDone && on(t.who));
    let clash = null;
    for (let i = 0; i < momCards.length && !clash; i++) for (let j = i + 1; j < momCards.length; j++) {
      const x = momCards[i], y = momCards[j]; if (tm(x) < end(y) && tm(y) < end(x)) { clash = [x.id, x.time, y.id, y.time]; break; }
    }
    ok(label + ": Mom is never in two places (ON kids' Mom cards don't overlap)", !clash, clash);
    ORDER.forEach(k => {
      const mine = laid.filter(t => t.who === k && !st.checked[t.id]).sort((p, q) => tm(p) - tm(q));
      let selfClash = null;
      for (let i = 0; i + 1 < mine.length; i++) if (end(mine[i]) > tm(mine[i + 1])) { selfClash = [mine[i].id, mine[i].time, mine[i + 1].id, mine[i + 1].time]; break; }
      ok(label + ": " + k + " never laid on top of themselves (not stacked)", !selfClash, selfClash);
      const work = mine.filter(t => !/lunch/i.test(t.title));
      if (work.filter(t => t.subjectKey === "closing_nb").length && work.length > 1) ok(label + ": " + k + "'s closing notebook stays last", work[work.length - 1].subjectKey === "closing_nb", work.map(t => t.title + "@" + t.time));
    });
    if (d.now && d.now.kid) ok(label + ": the loop never points at a paused/off kid", on(d.now.kid), d.now);
    ok(label + ": no display flag reaches the stored cards", T.every(x => x._momWait === undefined && x._offDay === undefined));
  };
  const stamp = derive({ checked: {}, ready: {}, paused: {}, momLoop: { order: ORDER, cursor: 1 }, momHold: {}, nowMin: H(10, 0) }).call("_mlDayStamp()");
  const st = { checked: {}, claimed: {}, ready: { julian: true, lucy: true, lincoln: true, ellis: true }, paused: {},
    momLoop: { order: ORDER, cursor: 1, cursorSetOn: stamp }, momHold: {}, nowMin: H(10, 5) };
  let d;
  // 10:05 — everyone ready; Lucy (cursor) has Mom
  d = derive(st); invariants("10:05 all ready", st, d);
  ok("Lucy takes her turn", d.now.kid === "lucy" && !d.now.borrowed, d.now);
  // 10:20 — Lucy checks her notebook (buffer) → started, hold on Read-Aloud
  const lucyNb = byTitle("lucy", "Notebook"), ra = byTitle("lucy", "Read-Aloud"), dim = byTitle("lucy", "Dimensions");
  st.checked[lucyNb.id] = "x"; st.nowMin = H(10, 20);
  d.call("mlOnCheck(" + JSON.stringify(lucyNb) + ")"); st.momHold = d.call("momHold");
  ok("the buffer check starts a hold on Read-Aloud", st.momHold.kid === "lucy" && st.momHold.id === ra.id, st.momHold);
  d = derive(st); invariants("10:20 lucy started", st, d);
  // 10:35 — Mom's part of Read-Aloud is done: she taps ✓ Mom part done, then "Next with work: Lincoln"
  st.nowMin = H(10, 35);
  d = derive(st);
  d.call("mlMomPartDone('" + ra.id + "',true)");
  ok("after the tap the loop is still on Lucy (hold re-pointed at Dimensions) and the choice shows", d.now && d.w.now().kid === "lucy" && /Next with work: Lincoln/.test(d.w.choice()), d.w.choice());
  d.call("mnNextWithWork()");
  st.momHold = d.call("momHold"); st.momLoop = JSON.parse(d.call("JSON.stringify(momLoop)"));
  ok("stored: off/lucy + offFor/lucy = Read-Aloud, hold kept on Dimensions", st.momLoop.off.lucy === stamp && st.momLoop.offFor.lucy.id === ra.id && st.momHold.id === dim.id, [st.momLoop, st.momHold]);
  d = derive(st); invariants("10:35 lucy paused (next with work)", st, d);
  ok("Mom is with Lincoln; Lucy reads 'off'; the cursor still holds on Lucy", d.now.kid === "lincoln" && d.status.find(x => x.kid === "lucy").state === "off" && d.now.cursorKid === "lucy", d.now);
  ok("Lucy's Read-Aloud is on her day, unchecked, her own card in hand at her slot", (() => { const c = d.laid.find(t => t.id === ra.id); return c && !c._momWait && !isNaN(toMinLocal(c.time)); })());
  ok("Lincoln's Mom block lays from now (10:35), ahead of Lucy's Dimensions", (() => { const e = d.laid.find(t => t.id === byTitle("lincoln", "Editor in Chief").id), m = d.laid.find(t => t.id === dim.id); return toMinLocal(e.time) === H(10, 35) && toMinLocal(m.time) >= toMinLocal(e.time) + 25; })(), d.laid.filter(t => t.mom === "required").map(t => t.title + "@" + t.time));
  // 10:40 — Lincoln checks his notebook (buffer) while he has Mom → the hold moves to him (existing rule)
  const linNb = byTitle("lincoln", "Notebook"), eic = byTitle("lincoln", "Editor in Chief");
  st.checked[linNb.id] = "x"; st.nowMin = H(10, 40);
  d.call("checked['" + linNb.id + "']='x'"); d.call("mlOnCheck(" + JSON.stringify(linNb) + ")"); st.momHold = d.call("momHold");
  ok("Lincoln's buffer check takes the hold (Lucy's was suspended by the pause)", st.momHold.kid === "lincoln" && st.momHold.id === eic.id, st.momHold);
  d = derive(st); invariants("10:40 lincoln started", st, d);
  // 10:50 — Lucy ticks off Read-Aloud on her tablet → her pause ends by itself; Lincoln keeps his started card
  st.checked[ra.id] = "x"; st.nowMin = H(10, 50);
  d = derive(st); invariants("10:50 lucy ticked the part-done card", st, d);
  ok("Lucy is back ON (derived, nothing written)", d.status.find(x => x.kid === "lucy").state !== "off" && d.w.cfgWrites().length === 0);
  ok("Lincoln keeps his started session (hold beats the cursor kid coming back)", d.now.kid === "lincoln" && d.now.held === true, d.now);
  ok("Lucy's Dimensions is queued behind Lincoln's held card, not stacked on it", (() => { const e = d.laid.find(t => t.id === eic.id), m = d.laid.find(t => t.id === dim.id); return toMinLocal(m.time) >= toMinLocal(e.time) + e.dur; })());
  // 11:05 — Lincoln checks Editor in Chief → hold released → back to Lucy (cursor kid, ready, on)
  st.checked[eic.id] = "x"; st.nowMin = H(11, 5);
  d.call("checked['" + eic.id + "']='x'"); d.call("mlOnCheck(" + JSON.stringify(eic) + ")"); st.momHold = d.call("momHold");
  d = derive(st); invariants("11:05 EIC done", st, d);
  ok("the turn snaps back to Lucy (her Dimensions)", d.now.kid === "lucy" && !d.now.borrowed && d.call("mlNextCard('lucy').id") === dim.id, d.now);
  // 11:30 — Lucy's Dimensions: part done again, this time Mom STAYS (no write), then Lucy checks it
  st.nowMin = H(11, 30); d = derive(st);
  d.call("mlMomPartDone('" + dim.id + "',true)");
  ok("one Mom card left → the loop moves on by itself, no choice (nothing to stay for)", d.w.now().kid !== "lucy" && d.w.choice() === "", d.w.now());
  st.momHold = d.call("momHold");
  d = derive(st); invariants("11:30 dimensions part-done", st, d);
  st.checked[dim.id] = "x"; st.nowMin = H(11, 45);
  d = derive(st); invariants("11:45 dimensions done", st, d);
  ok("Lucy done with Mom work; the loop is with Lincoln", d.status.find(x => x.kid === "lucy").state === "done" && d.now.kid === "lincoln", d.now);
  // 12:30 — the afternoon: everyone's Mom work done; the pause records are inert
  T.filter(t => t.mom === "required").forEach(t => { st.checked[t.id] = "x"; }); st.nowMin = H(12, 30);
  d = derive(st); invariants("12:30 all Mom work done", st, d);
  ok("everyone done → nobody has Mom", d.now.kid === null && d.status.every(x => x.state === "done"));
  // tomorrow: yesterday's off/offFor mean nothing (fresh cards — the part-done stamps belonged to yesterday's)
  T.forEach(t => { delete t.momPartDone; });
  const st2 = { checked: {}, claimed: {}, ready: {}, paused: {}, momLoop: { order: ORDER, cursor: 1, off: { lucy: "2020-1-1" }, offFor: { lucy: { id: ra.id, day: "2020-1-1" } } }, momHold: {}, nowMin: H(10, 5) };
  d = derive(st2); invariants("next morning", st2, d);
  ok("yesterday's pause means nothing today", d.now.kid === "lucy" && d.status.every(x => x.state !== "off"));
}

console.log("\n── source guards ──");
{
  const BL = src.slice(a, b), UI = src.slice(u, u2);
  ok("the helpers are read-only (no db.ref inside MOMNEXT)", (function () { const i = BL.indexOf("// MOMNEXT_START"), j = BL.indexOf("// MOMNEXT_END"); return i > 0 && j > i && !/db\.ref/.test(BL.slice(i, j)); })());
  ok("the UI block writes nothing itself — only through mlSetOff / mlSetCursor", !/db\.ref/.test(UI) && /mlSetOff\(a\.kid,true,a\.id\)/.test(UI) && /mlSetCursor\(r\)/.test(UI));
  ok("the choice is inline buttons (no confirm/alert — kiosk browsers have none)", !/\bconfirm\(|\balert\(/.test(UI.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")));
  ok("the offer is never automatic: no button fires on its own", !/mnNextWithWork\(\);|mnNextInRotation\(\);/.test(UI.replace(/onclick="[^"]*"/g, "")));
  ok("Mom-gated actions", (UI.match(/if\(!momHere\(\)&&!adminPinUnlocked\) return;/g) || []).length === 2);
}
function toMinLocal(s) {
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(String(s || "").trim()); if (!m) return NaN;
  let h = parseInt(m[1], 10) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + parseInt(m[2], 10);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
