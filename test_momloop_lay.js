/*
 * Node tests for STAGE 3 — the Mom-queue engine (mlQueueLay), her "stage 3 go" 2026-09-03.
 *
 * Her vision: "the loop lays moms schedule as efficiently as possible with no breaks…
 * schedules will keep moving and updating." Her rules, settled 2026-09-02:
 *   · Mom's queue is gap-free: loop kid's Mom-required block, then the ring's in loop order
 *   · loop priority beats routine-finished priority
 *   · a borrowed turn is one card per decision; the borrower's rest sits at their ring spot
 *   · the in-flight buffer card never moves; Julian has no buffer — his notebook IS Mom work
 *   · independents/may-need-Mom re-pack push-later-only around the kid's Mom block
 *   · lunch never moves and nothing is laid on top of it
 *
 * Supersedes test_momloop_pull.js (stage 2's one-card pull, now generalized away).
 *
 *   run:  node test_momloop_lay.js
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
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || { cursor: 0 }) + ";", ctx);
  if (o.momHold) vm.runInContext("momHold=" + JSON.stringify(o.momHold) + ";", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  const at = id => laid.find(t => t.id === id).time;
  return { laid, at, call: e => vm.runInContext(e, ctx) };
}

console.log("── Mom's queue: the loop kid's block chains gap-free after their buffer ──");
{
  const buf = card("lucy", "10:00 AM", 20, "none", "notebook");
  const m1 = card("lucy", "12:30 PM", 15, "required"), m2 = card("lucy", "1:00 PM", 20, "required"),
        m3 = card("lucy", "2:40 PM", 10, "required");
  const r = run({ tasks: [buf, m1, m2, m3], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("the buffer card never moves", r.at(buf.id) === "10:00 AM");
  ok("the block starts right after the buffer", r.at(m1.id) === "10:20 AM");
  ok("…and chains with no gaps", r.at(m2.id) === "10:35 AM" && r.at(m3.id) === "10:55 AM", [r.at(m2.id), r.at(m3.id)]);
}
console.log("\n── the ring packs in behind, in loop order ──");
{
  const lb = card("lucy", "10:00 AM", 20, "none"), lm = card("lucy", "12:30 PM", 20, "required");
  const nb = card("lincoln", "10:05 AM", 30, "none"), nm1 = card("lincoln", "1:00 PM", 25, "required"),
        nm2 = card("lincoln", "2:00 PM", 15, "required");
  const em = card("ellis", "11:00 AM", 20, "required");
  const r = run({ tasks: [lb, lm, nb, nm1, nm2, em], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("lucy's block first (cursor kid)", r.at(lm.id) === "10:20 AM");
  ok("lincoln's block follows immediately", r.at(nm1.id) === "10:40 AM" && r.at(nm2.id) === "11:05 AM");
  ok("ellis follows lincoln — even though his card printed earlier", r.at(em.id) === "11:20 AM");
  ok("lincoln's own buffer card never moved", r.at(nb.id) === "10:05 AM");
}
console.log("\n── the hold: a started Mom card renders where the kid already is ──");
{
  const m = card("lucy", "12:30 PM", 20, "required"), later = card("lucy", "11:00 AM", 20, "none");
  const r = run({ tasks: [m, later], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] },
    momHold: { kid: "lucy", id: m.id, day: "thursday" } });
  ok("held card takes the kid's current slot", r.at(m.id) === "11:00 AM");
}
console.log("\n── borrowing: one card per decision ──");
{
  // Cursor on lucy, lucy still on routine; lincoln ready and borrows. His ONE next card
  // leads; lucy's whole block inserts behind it; lincoln's rest sits at his ring position.
  const nb = card("lincoln", "10:00 AM", 20, "none"), nm1 = card("lincoln", "12:00 PM", 20, "required"),
        nm2 = card("lincoln", "2:00 PM", 20, "required");
  const lm1 = card("lucy", "12:30 PM", 20, "required"), lm2 = card("lucy", "1:00 PM", 20, "required");
  const r = run({ tasks: [nb, nm1, nm2, lm1, lm2], ready: { lucy: false, julian: false },
    momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("mlNow says lincoln borrowed", r.call("mlNow()").kid === "lincoln" && r.call("mlNow()").borrowed === true);
  ok("the borrower's single card leads", r.at(nm1.id) === "10:20 AM");
  ok("the loop kid's block inserts right behind it", r.at(lm1.id) === "10:40 AM" && r.at(lm2.id) === "11:00 AM");
  ok("the borrower's remaining card waits at his ring position", r.at(nm2.id) === "11:20 AM");
}
console.log("\n── Julian: ring leader, no buffer — his notebook IS Mom work ──");
{
  const jm1 = card("julian", "10:00 AM", 15, "required", "Morning Notebook"),
        jm2 = card("julian", "11:00 AM", 10, "required", "Daily Drill");
  const lm = card("lucy", "12:30 PM", 20, "required");
  const r = run({ tasks: [jm1, jm2, lm], momLoop: { cursor: 0, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("his block starts at his own first slot — nothing to buffer with", r.at(jm1.id) === "10:00 AM");
  ok("his cards chain gap-free", r.at(jm2.id) === "10:15 AM");
  ok("the ring follows him", r.at(lm.id) === "10:25 AM");
}
console.log("\n── each kid's other work re-packs push-later-only around their Mom block ──");
{
  const buf = card("lucy", "10:00 AM", 20, "none"), m1 = card("lucy", "10:30 AM", 30, "required");
  const i1 = card("lucy", "10:40 AM", 20, "none"), may = card("lucy", "11:10 AM", 20, "maybe"),
        i3 = card("lucy", "2:00 PM", 20, "none");
  const r = run({ tasks: [buf, m1, i1, may, i3], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("mom card sits after the buffer", r.at(m1.id) === "10:20 AM");
  ok("an independent the block now covers steps later, not earlier", r.at(i1.id) === "10:50 AM");
  ok("the next card cascades behind it", r.at(may.id) === "11:10 AM");
  ok("a card with clear air keeps the packer's slot exactly", r.at(i3.id) === "2:00 PM");
}
console.log("\n── lunch never moves and nothing lands on it ──");
{
  const buf = card("lucy", "11:30 AM", 20, "none");
  const lunch = card("lucy", "12:00 PM", 30, "none", "🍽 Lunch");
  const m1 = card("lucy", "1:00 PM", 20, "required"), m2 = card("lucy", "2:00 PM", 20, "required");
  const r = run({ tasks: [buf, lunch, m1, m2], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("lunch keeps its time", r.at(lunch.id) === "12:00 PM");
  ok("a mom card that would overlap lunch steps past it", r.at(m1.id) === "12:30 PM", r.at(m1.id));
  ok("the chain continues after", r.at(m2.id) === "12:50 PM");
}
console.log("\n── what never moves ──");
{
  const buf = card("lucy", "10:00 AM", 20, "none"), m1 = card("lucy", "12:30 PM", 20, "required");
  const done = card("lucy", "10:30 AM", 20, "required"); // checked mom card
  const twin = card("lucy", "3:00 PM", 20, "required"); twin.id = "lucy_tw_c";
  const carry = card("lucy", "1:00 PM", 20, "required"); carry.day = "wednesday";
  const checked = {}; checked[done.id] = "10:45 AM Sep 3";
  const r = run({ tasks: [buf, m1, done, twin, carry], checked,
    momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("a checked card keeps its time", r.at(done.id) === "10:30 AM");
  ok("a carry twin (_c) keeps its time", r.at(twin.id) === "3:00 PM");
  ok("another day's card keeps its time", r.at(carry.id) === "1:00 PM");
  ok("the real mom card still laid", r.at(m1.id) === "10:20 AM");
}
{
  const i1 = card("lucy", "10:00 AM", 20, "none"), i2 = card("lucy", "10:30 AM", 20, "none");
  const r = run({ tasks: [i1, i2], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("no Mom work anywhere → nothing is touched at all",
    r.at(i1.id) === "10:00 AM" && r.at(i2.id) === "10:30 AM");
}
console.log("\n── it derives, it does not write ──");
{
  const layFn = BLOCK.slice(BLOCK.indexOf("function mlQueueLay"), BLOCK.indexOf("// Kid-facing banner"));
  ok("mlQueueLay contains no db writes", !/db\.ref/.test(layFn));
  ok("derivation is stable — laying twice gives the same times", (function () {
    const buf = card("lucy", "10:00 AM", 20, "none"), m1 = card("lucy", "12:30 PM", 20, "required");
    const r = run({ tasks: [buf, m1], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
    const once = r.laid.map(t => t.time).join("|");
    const twice = r.call("mlQueueLay(" + JSON.stringify(r.laid) + ")").map(t => t.time).join("|");
    return once === twice;
  })());
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
