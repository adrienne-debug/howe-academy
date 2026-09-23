/*
 * 🎯 Priority inside a kid's block with Mom (her rule 2026-09-23): "the Mom flow today was perfect — don't mess with it —
 * but within those kid windows with Mom their school work can move around, in the order of what is needed first."
 * Harness copied from test_momloop_lay.js.
 *   run:  node test_priority_order.js
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
  ctx.planBacked = (k, sk) => !!(o.lessons || {})[sk];
  ctx._efBehind = (k, sk) => (o.behind || {})[sk] || 0;
  ctx.dmLabel = t => t.title; ctx.dmIsDaily = () => true; ctx.dmWeeks = () => [];
  ctx.dmCompute = () => ({ rows: Object.keys(o.streak || {}).map(l => ({ kid: o.streakKid || "ellis", label: l, streak: o.streak[l] })) });
  ctx.cbTodayISO = () => "2026-09-23"; ctx.ROSTER = o.roster || ["julian", "lucy", "lincoln", "ellis"];
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || { cursor: 0 }) + ";", ctx);
  if (o.momHold) vm.runInContext("momHold=" + JSON.stringify(o.momHold) + ";", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  const at = id => laid.find(t => t.id === id).time;
  return { laid, at, call: e => vm.runInContext(e, ctx) };
}


const m = s => { const x = /(\d+):(\d+)\s*([AP]M)/.exec(s); return (+x[1] % 12 + (x[3] === "PM" ? 12 : 0)) * 60 + +x[2]; };
console.log("── 🎯 inside a kid's block with Mom: what's needed first (her rule 2026-09-23) ──");
{
  // Ellis's Mom block today, laid 10:05–11:15 by plan time: EIC, Word Roots, AAS, Match & Play, Daily Drill
  const nb = card("ellis", "10:00 AM", 5, "none", "Morning Notebook"); nb.subjectKey = "morning_nb";
  const eic = card("ellis", "10:05 AM", 20, "required", "EIC"); eic.subjectKey = "eic";
  const wr = card("ellis", "10:25 AM", 15, "required", "Word Roots"); wr.subjectKey = "wr";
  const aas = card("ellis", "10:40 AM", 25, "required", "AAS"); aas.subjectKey = "aas";
  const match = card("ellis", "11:05 AM", 10, "required", "Match & Play"); match.subjectKey = "retrieval";
  const drill = card("ellis", "11:15 AM", 18, "required", "Daily Drill"); drill.subjectKey = "retrieval";
  const base = { tasks: [nb, eic, wr, aas, match, drill], roster: ["ellis"], nowMin: 9 * 60 + 50, momLoop: { cursor: 0, order: ["ellis"] },
    lessons: { eic: 1, wr: 1, aas: 1 } };
  const plain = run(Object.assign({}, base));
  const planOrder = [eic, wr, aas, match, drill].map(t => plain.at(t.id));
  const r = run(Object.assign({}, base, { behind: { aas: 4, wr: 2 }, streak: { "Daily Drill": 7 } }));
  const at = t => m(r.at(t.id));
  ok("a daily missed 7 days running goes to the FRONT of his block (Daily Drill first)", at(drill) < at(aas) && at(drill) < at(eic), [r.at(drill.id), r.at(aas.id)]);
  ok("then the most-behind lessons: AAS (4 behind) before Word Roots (2) before EIC (not behind)", at(aas) < at(wr) && at(wr) < at(eic), [r.at(aas.id), r.at(wr.id), r.at(eic.id)]);
  ok("not-behind cards keep their plan order (EIC before Match & Play)", at(eic) < at(match));
  const span = x => { const ts = [eic, wr, aas, match, drill].map(t => m(x.at(t.id))); const ends = [eic, wr, aas, match, drill].map(t => m(x.at(t.id)) + t.dur); return [Math.min(...ts), Math.max(...ends)]; };
  ok("the block starts and ends exactly where the loop put it (the Mom flow is untouched)", JSON.stringify(span(r)) === JSON.stringify(span(plain)), [span(r), span(plain)]);
  ok("the Morning Notebook still comes first", r.at(nb.id) === plain.at(nb.id));
  ok("with nothing behind and nothing missed, the order is exactly the plan's", JSON.stringify(planOrder) === JSON.stringify([eic, wr, aas, match, drill].map(t => run(Object.assign({}, base)).at(t.id))));
  const held = run(Object.assign({}, base, { behind: { aas: 4 }, momHold: { kid: "ellis", id: eic.id, day: "thursday" } }));
  ok("the card already in hand stays first", m(held.at(eic.id)) < m(held.at(aas.id)), [held.at(eic.id), held.at(aas.id)]);
}
{
  // another kid's block and the ring order are not touched
  const l1 = card("lucy", "10:05 AM", 20, "required", "LOE"), l2 = card("lucy", "10:25 AM", 20, "required", "Read-Aloud");
  const e1 = card("ellis", "10:45 AM", 20, "required", "EIC"); e1.subjectKey = "eic";
  const e2 = card("ellis", "11:05 AM", 25, "required", "AAS"); e2.subjectKey = "aas";
  const o = { tasks: [l1, l2, e1, e2], roster: ["lucy", "ellis"], nowMin: 9 * 60 + 50, momLoop: { cursor: 0, order: ["lucy", "ellis"] }, lessons: { eic: 1, aas: 1 } };
  const a = run(o), b = run(Object.assign({}, o, { behind: { aas: 5 } }));
  ok("Lucy's block (earlier in the loop) is exactly the same", a.at(l1.id) === b.at(l1.id) && a.at(l2.id) === b.at(l2.id));
  ok("Ellis's block still starts after Lucy's — only its inside order changed (AAS now first)", Math.min(m(b.at(e1.id)), m(b.at(e2.id))) === Math.min(m(a.at(e1.id)), m(a.at(e2.id))) && m(b.at(e2.id)) < m(b.at(e1.id)));
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
