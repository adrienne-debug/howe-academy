/*
 * Node tests — 📝 STAFTER: a Test First spelling test comes AFTER its lesson (her rule 2026-10-28, DeWalt switching to
 * Test First: "the lesson is taught and then before its over then its tested"). Test First tests THIS lesson's words, so
 * the test card sits right after the lesson (the first free 10 minutes once it ends), back to back in Mom's block, and
 * the lesson is never locked behind it. Practice Week is unchanged: the test (last lesson's words) before, lesson locked.
 * Runs the REAL SPELLTEST block (+ AAS data, ckResultTier) and a replay through the real MOMLOOP lay (mlQueueLay).
 *   run:  node test_st_after.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + slice("ckResultTier") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END");
const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = +m[1]; if (m[3].toUpperCase() === "PM" && h !== 12) h += 12; if (m[3].toUpperCase() === "AM" && h === 12) h = 0; return h * 60 + +m[2]; };
const fromMin = m => { let h = Math.floor(m / 60), mn = m % 60; const ap = h >= 12 ? "PM" : "AM"; if (h === 0) h = 12; else if (h > 12) h -= 12; return h + ":" + String(mn).padStart(2, "0") + " " + ap; };

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function world(o) {
  o = o || {};
  const toasts = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    document: { body: { appendChild: () => {} }, getElementById: () => null, createElement: () => ({ style: {}, remove() {} }) },
    momHere: () => !!o.mom, _dryRun: () => true, masteryData: { andrew: [] }, db: null,
    HA_LS: { setItem: () => {} }, gwShowToast: m => toasts.push(m), renderAll: () => {}, renderUnits: () => {},
    DAY_DT: { wednesday: "October 7" }, checked: o.checked || {}, claimed: {}, toMin, fromMin,
    helperHolds: () => null, weekData: { tasks: o.tasks || [] } };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks: ctx._aasDecks(),
    kidStage: { andrew: { stage: 1, subject: "all_about_spelling_1", path: o.path } } } };
  return { ctx, toasts };
}
const lesson = (id, time, title, extra) => Object.assign({ id, who: "andrew", day: "wednesday", time, dur: 30, mom: "required",
  subjectKey: "all_about_spelling_1", title: "📄 All About Spelling 1 — " + (title || "L19 NG") }, extra || {});
const other = (id, time, dur) => ({ id, who: "andrew", day: "wednesday", time, dur: dur || 20, mom: "none", subjectKey: "math", title: "📄 Math — x" });
const sctx = (w, extra) => Object.assign({ checked: w.ctx.checked, claimed: {}, toMin, fromMin,
  win: () => ({ start: toMin("9:00 AM"), lunchStart: toMin("1:00 PM"), lunchEnd: toMin("2:00 PM") }) }, extra || {});

console.log("── Test First: the test card comes right after the lesson ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L], path: "first" }), T = w.ctx.weekData.tasks;
  const r = w.ctx.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("one test card, for THIS lesson (Lesson 19)", r.added.length === 1 && t && t.id === "andrew_st_L1-19" && t.stLesson === 19, r);
  ok("it is marked as an after-the-lesson test", t.stAfter === true);
  ok("it starts when the lesson ends (11:00 + 30 min → 11:30), the lesson keeps its time", t.time === "11:30 AM" && L.time === "11:00 AM", [t.time, L.time]);
  ok("in the week's list it sits right after the lesson", T.indexOf(t) === T.indexOf(L) + 1);
  const again = w.ctx.stSyncWeek(T, sctx(w));
  ok("a second pass changes nothing", !again.added.length && !again.moved.length && !again.removed.length, again);
}
{
  const L = lesson("L1", "11:00 AM"), M = other("M", "11:30 AM", 20), w = world({ tasks: [L, M], path: "first" }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("the slot after the lesson is taken (Math 11:30–11:50) → the next free 10 minutes (11:50)", t.time === "11:50 AM" && L.time === "11:00 AM", [t.time, L.time]);
}
{
  const L = lesson("L1", "12:30 PM"), w = world({ tasks: [L], path: "first" }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  ok("a lesson ending at lunch (1:00) → the test goes after lunch (2:00)", T.find(x => x.stTest).time === "2:00 PM");
}
{
  const L = lesson("L1", "2:00 PM"), w = world({ tasks: [L], path: "first" }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w, { helperWin: () => ({ id: "gma", s: toMin("9:30 AM"), e: toMin("12:00 PM") }) }));
  ok("a helper's window doesn't pull a Test First test away from its lesson", T.find(x => x.stTest).time === "2:30 PM" && L.time === "2:00 PM");
}
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L], path: "first" }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  L.day = "thursday"; L.time = "10:00 AM";
  w.ctx.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("the lesson moves to Thursday 10:00 → the test follows it (Thursday 10:30)", t.day === "thursday" && t.time === "10:30 AM", t);
}

console.log("\n── Test First never locks the lesson ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L], path: "first", mom: true }), c = w.ctx;
  c.stSyncWeek(c.weekData.tasks, sctx(w));
  ok("the lesson isn't waiting on its test", c.stLessonLock(L) === null);
  ok("no 🔒 line on the lesson card", c.stCardRow(L, false) === "");
  ok("a tap on the lesson goes through (not stopped)", c.stTapGate(L) === false && !w.toasts.length);
  const t = c.weekData.tasks.find(x => x.stTest);
  ok("Mom's tap on the test card still opens the test screen", /Spelling test: Lesson 19/.test(c.stCardRow(t, false)));
}

console.log("\n── Practice Week is unchanged ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), c = w.ctx, T = c.weekData.tasks;
  c.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("the test (last lesson's words) sits right before the lesson", t.id === "andrew_st_L1-18" && t.time === "10:50 AM" && T.indexOf(t) === T.indexOf(L) - 1, [t.id, t.time]);
  ok("no after-mark", t.stAfter === undefined);
  ok("the lesson is locked behind it", c.stLessonLock(L) === t);
}
{
  // a card left marked from Test First, back on Practice Week (same id: Lesson 18's test before Lesson 19) → the mark goes
  const L = lesson("L1", "11:00 AM"), stale = { id: "andrew_st_L1-18", who: "andrew", day: "wednesday", time: "11:30 AM", dur: 10, stTest: true, stFor: "L1", stAfter: true, subjectKey: "spelltest" };
  const w = world({ tasks: [L, stale] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  ok("switching back to Practice Week clears the after-mark and puts the test first again", stale.stAfter === undefined && stale.time === "10:50 AM" && T.indexOf(stale) === T.indexOf(L) - 1, stale);
}

console.log("\n── Mom's block order ──");
{
  const c = world().ctx;
  const L = { id: "LES" }, A = { id: "a" }, B = { id: "b" };
  const Tb = { id: "T1", stTest: true, stFor: "LES" }, Ta = { id: "T2", stTest: true, stFor: "LES", stAfter: true };
  ok("Practice Week test → right before its lesson", c.stPairOrder([A, L, Tb, B]).map(x => x.id).join() === "a,T1,LES,b");
  ok("Test First test → right after its lesson", c.stPairOrder([Ta, A, L, B]).map(x => x.id).join() === "a,LES,T2,b");
}

console.log("\n── replay: Mom's lay keeps the pair together, lesson first ──");
{
  const BLOCK = cut("// MOMLOOP_START", "// MOMLOOP_END");
  const ctx = { console, ROSTER: ["andrew", "lucy"], db: null, checked: {}, momMoves: {},
    morningComplete: () => true, bbActive: () => null, momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || ""), esc: s => String(s == null ? "" : s), toMin, fromMin,
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp };
  ctx._mlNowOverride = 9 * 60;
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  // a STALE stored time (the test before its lesson) — the lay still puts the lesson first, then the test
  const tasks = [
    { id: "buf", who: "andrew", day: "thursday", time: "10:00 AM", dur: 20, mom: "none", title: "Handwriting" },
    { id: "andrew_st_L1-19", who: "andrew", day: "thursday", time: "10:50 AM", dur: 10, mom: "required", subjectKey: "spelltest", stTest: true, stAfter: true, stFor: "LES", title: "📝 Spelling test: Lesson 19" },
    { id: "LES", who: "andrew", day: "thursday", time: "11:00 AM", dur: 30, mom: "required", subjectKey: "all_about_spelling_1", title: "📄 AAS 1 — L19 NG" },
    { id: "SNG", who: "andrew", day: "thursday", time: "12:30 PM", dur: 20, mom: "required", subjectKey: "singapore", title: "📄 Singapore — 3" }];
  ctx.getActiveTasks = () => tasks;
  vm.createContext(ctx);
  vm.runInContext(BLOCK, ctx);
  vm.runInContext("stPairOrder=" + slice("stPairOrder") + ";momLoop={cursor:0,order:['andrew','lucy']};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  const at = id => toMin(laid.find(t => t.id === id).time);
  ok("the test is laid right after its lesson, back to back", at("LES") + 30 === at("andrew_st_L1-19"), laid.map(t => t.id + "@" + t.time));
  ok("…and nothing of Mom's lands between them", !laid.some(t => t.id === "SNG" && at("SNG") > at("LES") && at("SNG") < at("andrew_st_L1-19")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
