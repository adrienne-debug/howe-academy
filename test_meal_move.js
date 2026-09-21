/*
 * Node tests for ➡ MOVE FORWARD (her ask 2026-09-20: "an option to move meals forward and a
 * choice of just one category like lunch etc in case we eat out and want to stay on the plan").
 *
 *   · one category moves alone; every later meal of that category slides behind it, order kept
 *   · the slide stops at the first empty day — nothing dropped, nothing overwritten
 *   · eaten / didn't-happen dinners never move (the slide hops over them)
 *   · a past day's meal lands on TODAY, never on another past day
 *   · a dinner's prep ticks travel with it
 *   · one atomic multi-path write under kitchen/ — never a whole-node set
 *   · Mom/Dad only; cancel writes nothing
 *
 *   run:  node test_meal_move.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
function line(startsWith) {
  const i = src.indexOf(startsWith); if (i < 0) { console.error(startsWith + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n", i) + 1);
}
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const CODE = [ line("const KIT_MOVE_NAMES="), line("function _kitMvGet(").trim() ? slice("_kitMvGet") : "", line("function _kitMvFixed("),
  slice("kitMoveChain"), slice("kitMoveForward"), slice("kitIsoPlus"), slice("kitEatGate"), slice("_kitRefresh") ].join("\n");

function world(o) {
  o = o || {};
  const store = {};
  const ctx = { console, renders: 0, updates: [], sets: [], toasts: [], confirms: [], TODAY: o.today || "2026-09-21",
    momHere: () => !o.kid, confirm: m => { ctx.confirms.push(m); return o.cancel ? false : true; }, mwToast: m => ctx.toasts.push(m),
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    renderAll: function () { ctx.renders++; },
    gwParseDate: iso => new Date(iso + "T12:00:00"),
    db: { ref: p => ({ update: v => { ctx.updates.push([p, v]); return Promise.resolve(); }, set: v => ctx.sets.push([p, v]), remove: () => ctx.sets.push([p, null]) }) },
    kitPlan: o.plan || {}, kitPrepDone: o.prep || {}, document: { getElementById: () => null },
  };
  ctx._todayStr = () => ctx.TODAY;
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return { ctx, call: e => vm.runInContext(e, ctx), store };
}
const J = x => JSON.stringify(x);

console.log("── one category, the rest slide behind it ──");
{
  const w = world({ plan: {
    "2026-09-21": { mid: "mA", b: { txt: "oatmeal" }, l: { txt: "L-mon" } },
    "2026-09-22": { mid: "mB", l: { txt: "L-tue" } },
    "2026-09-23": { txt: "D-wed", l: { mid: "mL" } },
    "2026-09-24": { mid: "mD" },                       // no lunch Thursday → absorbs the slide
    "2026-09-25": { mid: "mE", l: { txt: "L-fri" } },
  } });
  w.call("kitMoveForward('2026-09-21','l')");
  const P = w.ctx.kitPlan;
  ok("Monday's lunch slot is empty", !P["2026-09-21"].l);
  ok("Mon→Tue, Tue→Wed, Wed→Thu, in order", P["2026-09-22"].l.txt === "L-mon" && P["2026-09-23"].l.txt === "L-tue" && P["2026-09-24"].l.mid === "mL", P);
  ok("Friday's lunch (past the gap) did not move", P["2026-09-25"].l.txt === "L-fri");
  ok("dinners and breakfast untouched", P["2026-09-21"].mid === "mA" && P["2026-09-21"].b.txt === "oatmeal" && P["2026-09-22"].mid === "mB" && P["2026-09-23"].txt === "D-wed" && P["2026-09-24"].mid === "mD");
  ok("ONE write, a multi-path update under kitchen/", w.ctx.updates.length === 1 && w.ctx.updates[0][0] === "kitchen" && w.ctx.sets.length === 0);
  const up = w.ctx.updates[0][1];
  ok("only lunch paths of the four affected days are written", J(Object.keys(up).sort()) === J(["plan/2026-09-21/l", "plan/2026-09-22/l", "plan/2026-09-23/l", "plan/2026-09-24/l"]), Object.keys(up));
  ok("the vacated slot is written as null", up["plan/2026-09-21/l"] === null && up["plan/2026-09-24/l"].mid === "mL");
  ok("the confirm named the move and the slide", /Monday, Sep 21's lunch to Tuesday, Sep 22/.test(w.ctx.confirms[0]) && /2 later lunches slide forward too/.test(w.ctx.confirms[0]), w.ctx.confirms);
  ok("local mirror saved + screen redrawn", /L-mon/.test(w.store.ha_kit_plan || "") && w.ctx.renders === 1);
}
console.log("\n── dinner: no gap → lands past the end of the plan; an emptied day disappears ──");
{
  const w = world({ plan: { "2026-09-21": { mid: "mA" }, "2026-09-22": { txt: "Tacos" }, "2026-09-23": { mid: "mC", s: { txt: "apples" } } } });
  w.call("kitMoveForward('2026-09-21','d')");
  const P = w.ctx.kitPlan;
  ok("Monday had only a dinner → the day is gone", !("2026-09-21" in P));
  ok("A→Tue, Tacos→Wed, C→Thu (a new day)", P["2026-09-22"].mid === "mA" && !P["2026-09-22"].txt && P["2026-09-23"].txt === "Tacos" && !P["2026-09-23"].mid && P["2026-09-24"].mid === "mC", P);
  ok("Wednesday's snack stayed put", P["2026-09-23"].s.txt === "apples");
  const up = w.ctx.updates[0][1];
  ok("mid↔txt swaps write both children so neither lingers", up["plan/2026-09-22/mid"] === "mA" && up["plan/2026-09-22/txt"] === null && up["plan/2026-09-23/txt"] === "Tacos" && up["plan/2026-09-23/mid"] === null);
  ok("no eaten/skipped/other keys are touched", Object.keys(up).every(k => /\/(mid|txt)$/.test(k)), Object.keys(up));
}
console.log("\n── eaten / didn't-happen dinners never move ──");
{
  const w = world({ plan: { "2026-09-21": { mid: "mA" }, "2026-09-22": { mid: "mB", eaten: 5 }, "2026-09-23": { mid: "mC", skipped: 6 }, "2026-09-24": { mid: "mD" } } });
  ok("an eaten dinner offers no move", w.call("kitMoveChain('2026-09-22','d')") === null && w.call("kitMoveChain('2026-09-23','d')") === null);
  w.call("kitMoveForward('2026-09-22','d')");
  ok("…and the function refuses it", w.ctx.updates.length === 0 && w.ctx.confirms.length === 0);
  w.call("kitMoveForward('2026-09-21','d')");
  const P = w.ctx.kitPlan;
  ok("the slide hops over them: A→Thu, D→Fri", P["2026-09-24"].mid === "mA" && P["2026-09-25"].mid === "mD" && !("2026-09-21" in P), P);
  ok("eaten and skipped days are exactly as they were", J(P["2026-09-22"]) === J({ mid: "mB", eaten: 5 }) && J(P["2026-09-23"]) === J({ mid: "mC", skipped: 6 }));
}
console.log("\n── a past day's meal lands on today ──");
{
  const w = world({ today: "2026-09-24", plan: { "2026-09-21": { mid: "mOld" }, "2026-09-22": { mid: "mTue", eaten: 1 }, "2026-09-24": { mid: "mToday" } } });
  w.call("kitMoveForward('2026-09-21','d')");
  const P = w.ctx.kitPlan;
  ok("Monday's owed dinner → today (Thu), today's → Fri", P["2026-09-24"].mid === "mOld" && P["2026-09-25"].mid === "mToday" && !P["2026-09-23"], P);
}
console.log("\n── prep ticks travel with their dinner ──");
{
  const w = world({ plan: { "2026-09-21": { mid: "m1" }, "2026-09-22": { mid: "m1" }, "2026-09-23": { mid: "m10" } },
    prep: { "2026-09-21": { "m1_0": 111 }, "2026-09-22": { "m1_1": 222 }, "2026-09-23": { "m10_0": 333 } } });
  w.call("kitMoveForward('2026-09-21','d')");
  const D = w.ctx.kitPrepDone, up = w.ctx.updates[0][1];
  ok("each tick moved one day on with its meal", J(D["2026-09-22"]) === J({ "m1_0": 111 }) && J(D["2026-09-23"]) === J({ "m1_1": 222 }) && J(D["2026-09-24"]) === J({ "m10_0": 333 }) && !D["2026-09-21"], D);
  ok("the write mirrors it (old spot null, new spot stamped)", up["prepDone/2026-09-21/m1_0"] === null && up["prepDone/2026-09-22/m1_0"] === 111 && up["prepDone/2026-09-22/m1_1"] === null && up["prepDone/2026-09-23/m1_1"] === 222 && up["prepDone/2026-09-24/m10_0"] === 333, up);
  ok("m1's prefix never grabs m10's ticks", up["prepDone/2026-09-23/m10_0"] === null && !("prepDone/2026-09-22/m10_0" in up));
}
console.log("\n── the whole day ──");
{
  const w = world({ plan: { "2026-09-21": { mid: "mA", b: { txt: "B1" }, l: { txt: "L1" }, s: { txt: "S1" } }, "2026-09-22": { mid: "mB", l: { txt: "L2" } } } });
  w.call("kitMoveForward('2026-09-21','all')");
  const P = w.ctx.kitPlan;
  ok("Monday is cleared", !("2026-09-21" in P));
  ok("every category slid by its own chain", P["2026-09-22"].mid === "mA" && P["2026-09-22"].b.txt === "B1" && P["2026-09-22"].l.txt === "L1" && P["2026-09-22"].s.txt === "S1" && P["2026-09-23"].mid === "mB" && P["2026-09-23"].l.txt === "L2", P);
  ok("still one atomic write", w.ctx.updates.length === 1);
  ok("the confirm lists each category", /ALL of Monday, Sep 21's meals/.test(w.ctx.confirms[0]) && /dinner/.test(w.ctx.confirms[0]) && /snack/.test(w.ctx.confirms[0]));
}
console.log("\n── guards ──");
{
  const plan = () => ({ "2026-09-21": { mid: "mA", l: { txt: "L1" } } });
  const c = world({ plan: plan(), cancel: true }); c.call("kitMoveForward('2026-09-21','l')");
  ok("cancel writes nothing and moves nothing", c.ctx.updates.length === 0 && c.ctx.kitPlan["2026-09-21"].l.txt === "L1" && c.ctx.renders === 0);
  const k = world({ plan: plan(), kid: true }); k.call("kitMoveForward('2026-09-21','l')");
  ok("a kid cannot move meals", k.ctx.updates.length === 0 && k.ctx.confirms.length === 0 && k.ctx.kitPlan["2026-09-21"].l.txt === "L1");
  const e = world({ plan: plan() }); e.call("kitMoveForward('2026-09-21','s')");
  ok("an empty category says so and writes nothing", e.ctx.updates.length === 0 && /Nothing to move/.test(e.ctx.toasts[0] || ""));
}
console.log("\n── the day sheet wires it ──");
{
  const sheet = slice("calDaySheetHTML"), rows = slice("_calSlotRows");
  ok("b/l/s rows carry ➡ Move behind the same Mom gate as ✎", /\(who\|\|!kitEatGate\(\)\)\?'':'<button[^>]*kitSlotText\([^>]*>✎<\/button><button[^>]*kitMoveForward\(/.test(rows));
  ok("dinner offers ➡ Move forward when owed/planned, never when eaten", /✗ Didn’t happen<\/button>'\+_mvBtn;/.test(sheet) && /else if\(din\.st==="planned"\) h\+=_mvBtn;/.test(sheet));
  ok("the whole-day button needs 2+ movable categories", /\.length>1;/.test(sheet) && /kitMoveForward\(\\''\+iso\+'\\',\\'all\\'\)/.test(sheet));
  const kid = sheet.slice(sheet.indexOf("if(L.meals&&kidMode)"), sheet.indexOf("} else if(L.meals)"));
  ok("the kid's view has no move button", kid.length > 0 && !/kitMoveForward/.test(kid));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
