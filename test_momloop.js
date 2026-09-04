/*
 * Node tests for the 👩 MOM LOOP — who has Mom right now.
 *
 * Her rules, 2026-08-30:
 *   · the loop has an order and a cursor; the cursor kid gets Mom for their turn
 *   · a kid isn't ready until their MORNING ROUTINE is done
 *   · if the cursor kid isn't ready, the first kid who IS ready borrows Mom — and the
 *     cursor does NOT advance, because a borrowed turn is not a lost turn
 *   · a PAUSE hands Mom on the same way, and again the cursor holds: a break costs a kid
 *     their minute, not their place
 *   · when a kid's Mom work is finished the loop moves on
 *
 * Why it exists: 1136 min/wk of Mom-required work against ~900 usable morning minutes, and
 * the order she worked through the kids was an emergent side effect of four per-kid
 * workflow lists plus a round-robin — invisible and unarbitrated. Lincoln got 33% of the
 * Mom time he needs and Lucy 51%, every week, because whoever sat last always lost.
 *
 *   run:  node test_momloop.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
// world: 3 kids, each with N mom-required cards today
function run(o) {
  o = o || {};
  const kids = o.kids || ["julian", "lucy", "lincoln"];
  const tasks = [];
  kids.forEach(k => { for (let i = 0; i < ((o.cards || {})[k] === undefined ? 2 : o.cards[k]); i++)
    tasks.push({ id: k + i, who: k, day: "monday", mom: "required", title: k + " task " + i }); });
  const ctx = {
    console, ROSTER: kids, db: null,
    checked: o.checked || {},
    getActiveTasks: () => tasks,
    morningComplete: (k) => (o.ready || {})[k] !== false,
    bbActive: (k) => (o.paused || {})[k] ? { phase: "go" } : null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON,
  };
  Object.defineProperty(ctx, "_todayDay", { get: () => "monday" });
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  // The block declares `let momLoop={}`, which WIPES anything seeded before it runs — so the
  // config has to be applied afterwards. Seeding it first silently left every case running
  // the fallback roster order, and several assertions passed for the wrong reason.
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || {}) + ";", ctx);
  return { ctx, call: e => vm.runInContext(e, ctx), tasks };
}

console.log("── the cursor kid gets their turn ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 } });
  const n = r.call("mlNow()");
  ok("the cursor kid has Mom", n.kid === "julian", n);
  ok("and it is not a borrowed turn", n.borrowed === false, n);
  ok("the reason says so", /their turn/.test(n.why), n.why);
}

console.log("\n── the cursor kid is not ready yet ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 }, ready: { julian: false } });
  const n = r.call("mlNow()");
  ok("the next READY kid borrows Mom", n.kid === "lucy", n);
  ok("it is marked as borrowed", n.borrowed === true, n);
  ok("the cursor has NOT moved — Julian is still next", n.cursorKid === "julian", n);
  ok("the reason names who we are waiting on", /Julian/.test(n.why) && /routine/.test(n.why), n.why);
  // and the moment he finishes his routine he takes his turn back
  const r2 = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 } });
  ok("as soon as he is ready he has Mom again", r2.call("mlNow()").kid === "julian");
}

console.log("\n── a pause hands Mom on but keeps the place ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 }, paused: { julian: true } });
  const n = r.call("mlNow()");
  ok("a kid on a break yields to the next in the loop", n.kid === "lucy", n);
  ok("the cursor still sits on the paused kid", n.cursorKid === "julian", n);
  ok("the reason says they are on a break", /break/.test(n.why), n.why);
  const r2 = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 } });
  ok("when the break ends the turn is still theirs", r2.call("mlNow()").kid === "julian");
}

console.log("\n── finishing moves the loop on ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 },
    checked: { julian0: true, julian1: true } });
  const n = r.call("mlNow()");
  ok("a kid with no Mom work left is skipped", n.kid === "lucy", n);
  ok("a finished kid reads as done", r.call('mlStatus()').find(x => x.kid === "julian").state === "done");
  ok("and shows nothing left", r.call('mlRemaining("julian")').length === 0);
}

console.log("\n── nobody available ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy"], cursor: 0 }, ready: { julian: false, lucy: false } });
  const n = r.call("mlNow()");
  ok("says nobody is ready rather than picking someone", n.kid === null, n);
  ok("but still reports whose turn it is", n.cursorKid === "julian", n);
}
{
  const r = run({ momLoop: { order: ["julian", "lucy"], cursor: 0 }, checked: { julian0: true, julian1: true, lucy0: true, lucy1: true } });
  ok("everyone finished is handled", r.call("mlNow()").kid === null);
}

console.log("\n── her levers ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 } });
  r.call('mlSetCursor("lincoln")');
  ok("'start the loop on Lincoln' puts him first", r.call("mlNow()").kid === "lincoln");
  ok("the stored cursor moved, not the order", r.call("momLoop.cursor") === 2 && r.call("mlOrder()")[0] === "julian");
  r.call('mlMove("lincoln",-1)');
  ok("reordering swaps two kids", JSON.stringify(r.call("mlOrder()")) === JSON.stringify(["julian", "lincoln", "lucy"]),
    r.call("mlOrder()"));
  const r2 = run({});
  ok("with nothing configured it falls back to roster order",
    JSON.stringify(r2.call("mlOrder()")) === JSON.stringify(["julian", "lucy", "lincoln"]), r2.call("mlOrder()"));
  ok("a stale kid in a stored order is dropped, not rendered",
    JSON.stringify(run({ momLoop: { order: ["julian", "ghost", "lucy"] } }).call("mlOrder()")) === JSON.stringify(["julian", "lucy"]));
}

console.log("\n── status strip ──");
{
  const r = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 0 },
    ready: { lincoln: false }, paused: { lucy: true }, checked: {} });
  const st = r.call("mlStatus()");
  const by = {}; st.forEach(x => by[x.kid] = x);
  ok("the kid with Mom reads 'withMom'", by.julian.state === "withMom", by.julian);
  ok("a paused kid reads 'paused'", by.lucy.state === "paused", by.lucy);
  ok("a kid still on their routine reads 'routine'", by.lincoln.state === "routine", by.lincoln);
  ok("each carries how much is left", by.julian.left === 2, by.julian);
  ok("the strip is in loop order", JSON.stringify(st.map(x => x.kid)) === JSON.stringify(["julian", "lucy", "lincoln"]));
}

console.log("\n── it decides, it does not reschedule ──");
{
  ok("the block never writes a task", !/db\.ref\([^)]*tasks/.test(BLOCK));
  // Stage 2b (2026-09-01) added ONE more stored fact: the hold ("once checked, who has it
  // has it") at WK/momHold — set on the buffer check, removed on the Mom-card check and by
  // Mom's cursor override. Still never a card.
  // 2026-09-02 added cursorSetOn: the day stamp on Mom's "Start the loop on X" tap, so her
  // tap beats the derived end-of-day capture today only. Written on the same Mom-gated tap.
  // 2026-09-03 added behindScope: the behind marker's subject scope (required | maybe | all),
  // one Mom-gated tap on the strip. Still never a card.
  ok("it writes only the order, the cursor + its tap-day stamp, the hold, and the behind scope",
    (BLOCK.match(/db\.ref\(/g) || []).length === 7
      && /config\/momLoop\/order/.test(BLOCK) && /config\/momLoop\/cursor/.test(BLOCK)
      && /config\/momLoop\/cursorSetOn/.test(BLOCK) && /config\/momLoop\/behindScope/.test(BLOCK)
      && (BLOCK.match(/WK\+"\/momHold"/g) || []).length === 3);
  ok("the setters are Mom-gated", (BLOCK.match(/if\(!momHere\(\)&&!adminPinUnlocked\) return;/g) || []).length === 4);
  const R = src.indexOf("function mlStripHTML"), R2 = src.indexOf("// MOMLOOP_END");
  const strip = R >= 0 ? src.slice(R, R2) : "";
  ok("the strip is Mom-gated too", /if\(!momHere\(\)&&!adminPinUnlocked\) return "";/.test(strip));
  ok("it only renders on today", /if\(day===_todayDay\)\{ try\{ h\+=mlStripHTML\(\); \}catch\(e\)\{\} \}/.test(src));
}


console.log("\n── the BEHIND marker (her design 2026-09-03): who owes Mom the most goes first ──");
{
  // Plan-backed subjects with lessons dated before today. Today is 2026-09-07 (a Monday) in
  // this world — the block reads cbTodayISO when present.
  const mk = (kid, sk, mom, tpw, cellsBefore, doneN) => ({
    subj: { display: sk, mom, planId: kid + "__" + sk, doneImportedAt: "x", pacing: { mode: "timesPerWeek", tpw },
            lessonSeq: ["L1", "L2", "L3", "L4", "L5", "L6"], lessonIds: ["A1", "A2", "A3", "A4", "A5", "A6"] },
    cells: cellsBefore, done: doneN });
  function world(spec, scope) {
    const currData = { subjects: {}, lessons: {}, done: {}, lastEdit: "e1" };
    let dn = 1;
    Object.keys(spec).forEach(kid => { currData.subjects[kid] = {}; currData.lessons[kid] = {}; currData.done[kid] = {};
      Object.keys(spec[kid]).forEach(sk => { const w = spec[kid][sk]; currData.subjects[kid][sk] = w.subj;
        const d = {}; for (let i = 0; i < w.done; i++) d[w.subj.lessonIds[i]] = { day: "2026-08-20" }; currData.done[kid][sk] = d;
        w.cells.forEach((text, i) => { const row = { date: "2026-09-0" + (1 + i), week: "Wk" }; row[sk] = text; currData.lessons[kid][dn++] = row; }); }); });
    const r = run({ kids: ["lucy", "lincoln", "ellis"], momLoop: Object.assign({ order: ["lucy", "lincoln", "ellis"], cursor: 0 }, scope ? { behindScope: scope } : {}) });
    r.ctx.currData = currData; r.ctx.cbTodayISO = () => "2026-09-07";
    return r;
  }
  // lincoln: EIC (required, 5/wk) — cells L1..L4 before today, L1 done → 3 owed of 5 = 60%
  // ellis:   EIC (required, 3/wk) — cells L1..L4, none done → 4 owed of 3 = 133%
  //          plus Reading Eggs (none, 1/wk) — 2 owed: OUT of scope by default
  // lucy:    LOE (required, 2/wk) — L1,L2 both done → 0%
  const spec = {
    lincoln: { eic: mk("lincoln", "eic", "required", 5, ["L1", "L2", "L3", "L4"], 1) },
    ellis: { eic: mk("ellis", "eic", "required", 3, ["L1", "L2", "L3", "L4"], 0), eggs: mk("ellis", "eggs", "none", 1, ["L1", "L2"], 0) },
    lucy: { loe: mk("lucy", "loe", "required", 2, ["L1", "L2"], 2) },
  };
  const r = world(spec);
  const b = r.call("mlBehindAll()");
  ok("lincoln 3 owed of 5/wk = 60%", b.lincoln && b.lincoln.owed === 3 && b.lincoln.asked === 5 && b.lincoln.pct === 60, b.lincoln);
  ok("ellis 4 owed of 3/wk = 133% — over 100 is honest", b.ellis && b.ellis.owed === 4 && b.ellis.pct === 133, b.ellis);
  ok("lucy all done = 0%", b.lucy && b.lucy.pct === 0, b.lucy);
  ok("Reading Eggs (mom: none) is NOT counted under the default scope", b.ellis.asked === 3, b.ellis);
  const sc = r.call("_mlScan()");
  ok("today's ring re-sorts highest-first: ellis, lincoln, lucy", JSON.stringify(sc.order) === JSON.stringify(["ellis", "lincoln", "lucy"]) && sc.cur === 0 && sc.behind === true, sc);
  const now = r.call("mlNow()");
  ok("mlNow hands Mom to ellis first", now && now.kid === "ellis" && now.cursorKid === "ellis" && !now.borrowed, now);
  const st = r.call("mlStatus()");
  ok("the strip lists the ring in that order and carries behind%", st.map(x => x.kid + ":" + x.behind).join() === "ellis:133,lincoln:60,lucy:0", st);
  // her tap today wins over the marker
  const r2 = world(spec); r2.call("momLoop.cursor=0; momLoop.cursorSetOn=_mlDayStamp();");
  const sc2 = r2.call("_mlScan()");
  ok("'Start the loop on X' today beats the marker — stored order, her cursor", JSON.stringify(sc2.order) === JSON.stringify(["lucy", "lincoln", "ellis"]) && sc2.cur === 0 && !sc2.behind, sc2);
  // scope widened to all → Reading Eggs counts (ellis 6 owed of 4/wk = 150)
  const r3 = world(spec, "all"); const b3 = r3.call("mlBehindAll()");
  ok("scope 'all' folds Reading Eggs in: ellis 6 of 4 = 150%", b3.ellis && b3.ellis.owed === 6 && b3.ellis.asked === 4 && b3.ellis.pct === 150, b3.ellis);
  // everyone caught up → plain loop, cursor as stored
  const spec0 = { lincoln: { eic: mk("lincoln", "eic", "required", 5, ["L1", "L2"], 2) }, ellis: { eic: mk("ellis", "eic", "required", 3, [], 0) }, lucy: { loe: mk("lucy", "loe", "required", 2, ["L1"], 1) } };
  const r4 = world(spec0); r4.call("momLoop.cursor=1;");
  const sc4 = r4.call("_mlScan()");
  ok("nobody behind → stored order and the stored cursor (lincoln)", JSON.stringify(sc4.order) === JSON.stringify(["lucy", "lincoln", "ellis"]) && sc4.cur === 1 && !sc4.behind, sc4);
  // a cell dated TODAY is not owed yet
  const spec5 = { lincoln: { eic: mk("lincoln", "eic", "required", 5, [], 0) }, ellis: { eic: mk("ellis", "eic", "required", 3, [], 0) }, lucy: { loe: mk("lucy", "loe", "required", 2, [], 0) } };
  const r5 = world(spec5); r5.call("currData.lessons.lucy[99]={date:'2026-09-07',loe:'L1'};");
  ok("today's own lesson does not count as owed", r5.call("mlBehind('lucy').owed") === 0);
  // no plan data at all (the other test worlds) → zeros, marker inert
  const r6 = run({}); ok("without curriculum data the marker is inert (0%, stored order)", r6.call("mlBehind('lucy').pct") === 0 && r6.call("_mlScan().behind") === false);
  // setter: Mom-gated, validated, writes the one path
  const r7 = world(spec); r7.call("mlSetBehindScope('bogus')"); ok("an unknown scope is refused", r7.call("mlBehindScope()") === "required");
  r7.call("mlSetBehindScope('maybe')"); ok("a valid scope sticks (in memory; db is null here)", r7.call("mlBehindScope()") === "maybe");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
