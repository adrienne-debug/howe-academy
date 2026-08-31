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
  ok("the block never writes a task", !/week.*tasks|db\.ref\(WK/.test(BLOCK));
  ok("it writes only the order and the cursor",
    (BLOCK.match(/db\.ref\(/g) || []).length === 2 && /config\/momLoop\/order/.test(BLOCK) && /config\/momLoop\/cursor/.test(BLOCK));
  ok("the setters are Mom-gated", (BLOCK.match(/if\(!momHere\(\)&&!adminPinUnlocked\) return;/g) || []).length === 3);
  const R = src.indexOf("function mlStripHTML"), R2 = src.indexOf("// MOMLOOP_END");
  const strip = R >= 0 ? src.slice(R, R2) : "";
  ok("the strip is Mom-gated too", /if\(!momHere\(\)&&!adminPinUnlocked\) return "";/.test(strip));
  ok("it only renders on today", /if\(day===_todayDay\)\{ try\{ h\+=mlStripHTML\(\); \}catch\(e\)\{\} \}/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
