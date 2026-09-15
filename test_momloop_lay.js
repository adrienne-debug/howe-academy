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
  ctx._mlNowOverride = (typeof o.nowMin === "number") ? o.nowMin : 9 * 60;   // the living day lays from NOW; 9:00 = before school
  if (typeof o.endMin === "number") ctx._mlEndOverride = o.endMin;   // the cut line (default: the 4:15 PM Settings default)
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  if (o.effectiveDay) ctx.effectiveDay = o.effectiveDay;
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
  // 🌞 2026-09-14: the queue never lays on top of a checked card — the block steps past the 10:30–10:50 done card
  ok("the real mom card still laid (right after the checked card it can no longer sit on)", r.at(m1.id) === "10:50 AM", r.at(m1.id));
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


console.log("\n── a carried-forward Mom card joins Mom's queue (09-04) ──");
{
  // lucy: buffer 10:00, one Mom card today 12:30, and a leftover Mom card STORED on wednesday
  // that the schedule shows today. It must chain into her block, not vanish from the queue.
  const buf = card("lucy", "10:00 AM", 20, "none", "notebook");
  const m1 = card("lucy", "12:30 PM", 15, "required");
  const old = Object.assign(card("lucy", "11:00 AM", 20, "required"), { day: "wednesday" });
  const r = run({ tasks: [buf, m1, old], momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] },
    effectiveDay: t => (t.day === "wednesday" ? "thursday" : t.day) });
  ok("the buffer never moves", r.at(buf.id) === "10:00 AM");
  ok("the carried card is laid in her block (earliest stored time first)", r.at(old.id) === "10:20 AM", r.at(old.id));
  ok("today's own Mom card chains behind it", r.at(m1.id) === "10:40 AM", r.at(m1.id));
}

console.log("\n── 🌞 LIVING DAY: the queue re-flows from NOW (her rule 2026-09-14) ──");
{
  // 11:00, nobody has started: the buffer moves up to now, Mom's block chains right after it
  const buf = card("lucy", "10:00 AM", 20, "none", "notebook");
  const m1 = card("lucy", "10:20 AM", 15, "required"), m2 = card("lucy", "10:35 AM", 20, "required");
  const r = run({ tasks: [buf, m1, m2], nowMin: 11 * 60, momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("past 11:00 nothing sits before 11:00 — the buffer is at 11:00", r.at(buf.id) === "11:00 AM", r.at(buf.id));
  ok("Mom's block chains right after the buffer's REAL slot", r.at(m1.id) === "11:20 AM" && r.at(m2.id) === "11:35 AM", [r.at(m1.id), r.at(m2.id)]);
}
{
  // no Mom work anywhere: the day still moves (the empty ring used to return the plan untouched)
  const a = card("lincoln", "10:00 AM", 20, "none"), b = card("lincoln", "10:30 AM", 30, "none"), c = card("lincoln", "12:30 PM", 20, "maybe");
  const r = run({ tasks: [a, b, c], nowMin: 11 * 60, momLoop: { cursor: 0, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("no Mom cards at all: first card at now", r.at(a.id) === "11:00 AM", r.at(a.id));
  ok("…the next follows in order (its passed slot collapses)", r.at(b.id) === "11:20 AM", r.at(b.id));
  ok("…a printed gap still AHEAD of the clock is kept (12:30 stays 12:30)", r.at(c.id) === "12:30 PM", r.at(c.id));
}
{
  // before school (9:00) the plan's times hold exactly
  const a = card("ellis", "10:00 AM", 20, "none"), m = card("ellis", "10:40 AM", 20, "required");
  const r = run({ tasks: [a, m], nowMin: 9 * 60, momLoop: { cursor: 3, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("before the day starts nothing is pulled earlier than its slot", r.at(a.id) === "10:00 AM" && r.at(m.id) === "10:20 AM", [r.at(a.id), r.at(m.id)]);
}
{
  // a card checked AHEAD of time holds its slot; the queue steps over it
  const done = card("lucy", "11:00 AM", 20, "none", "done early"), nb = card("lucy", "10:00 AM", 20, "none", "notebook"), m = card("lucy", "10:20 AM", 15, "required");
  const r = run({ tasks: [done, nb, m], nowMin: 11 * 60, checked: { [done.id]: "x" }, momLoop: { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("the checked card never moves", r.at(done.id) === "11:00 AM");
  ok("the buffer steps over the checked interval", r.at(nb.id) === "11:20 AM", r.at(nb.id));
  ok("Mom's block follows the buffer", r.at(m.id) === "11:40 AM", r.at(m.id));
}
{
  // lunch is fixed; the re-flow steps over it
  const nb = card("lincoln", "10:00 AM", 20, "none", "notebook"), L = card("lincoln", "12:00 PM", 30, "none", "Lunch"), m = card("lincoln", "10:20 AM", 25, "required");
  const r = run({ tasks: [nb, L, m], nowMin: 11 * 60 + 50, momLoop: { cursor: 2, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("lunch never moves", r.at(L.id) === "12:00 PM");
  ok("a card that would cross lunch lands after it", r.at(nb.id) === "12:30 PM" && r.at(m.id) === "12:50 PM", [r.at(nb.id), r.at(m.id)]);
}

console.log("\n── 🌙 END-OF-DAY CUT: laid past the Settings school end → off the bottom, still checkable ──");
{
  const nb = card("lincoln", "10:00 AM", 20, "none", "notebook"), a = card("lincoln", "10:20 AM", 60, "none", "MR5"),
        b = card("lincoln", "11:20 AM", 60, "required", "AAS"), cl = card("lincoln", "3:00 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" });
  const r = run({ tasks: [nb, a, b, cl], nowMin: 15 * 60 + 30, momLoop: { cursor: 2, order: ["julian", "lucy", "lincoln", "ellis"] } });
  const f = id => !!r.laid.find(t => t.id === id)._offDay;
  ok("3:30 PM start: the notebook (ends 3:50) is still on today", r.at(nb.id) === "3:30 PM" && !f(nb.id), [r.at(nb.id), f(nb.id)]);
  ok("MR5 would end at 4:50 — past 4:15 → fell off the bottom", f(a.id), [r.at(a.id), f(a.id)]);
  ok("AAS behind it fell off too", f(b.id));
  ok("the closing notebook never falls off", !f(cl.id));
  ok("fallen cards keep a real time (the list still shows when they would have run)", /\d:\d\d [AP]M/.test(r.at(a.id)));
  ok("the flag never reaches the stored cards", [nb, a, b, cl].every(x => x._offDay === undefined));
}
{
  // the cut follows Settings: a 5:00 PM school end keeps MR5 on today
  const nb = card("lincoln", "10:00 AM", 20, "none", "notebook"), a = card("lincoln", "10:20 AM", 60, "none", "MR5");
  const r = run({ tasks: [nb, a], nowMin: 15 * 60 + 30, endMin: 17 * 60, momLoop: { cursor: 2, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("with school end at 5:00 PM nothing falls off", r.laid.every(t => !t._offDay), r.laid.map(t => t.title + "@" + t.time));
}
{
  // before the day starts nothing is anywhere near the cut
  const nb = card("ellis", "10:00 AM", 20, "none", "notebook"), a = card("ellis", "10:20 AM", 30, "required");
  const r = run({ tasks: [nb, a], nowMin: 9 * 60, momLoop: { cursor: 3, order: ["julian", "lucy", "lincoln", "ellis"] } });
  ok("morning: no card is flagged", r.laid.every(t => !t._offDay));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
