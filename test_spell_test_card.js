/*
 * Node tests — 📝 the spelling test is its OWN card (her ask 2026-10-08, STTESTCARD inside the SPELLTEST block).
 * On a kid's AAS lesson day a "📝 Spelling test: Lesson N" card sits right before the lesson card (same stTarget rules:
 * Practice Week = the lesson before, none when that lesson had no words). Mom does both → test first, the lesson
 * unlocks when the test is checked or graded. A helper takes the test (help list or a pick for the day) → the test
 * card is hers alone, inside her window; the lesson stays with Mom, after it. Mom-only grading unchanged.
 * Runs the REAL SPELLTEST block (+ AAS data, ckResultTier), the real HELPERS block, and a replay through the real
 * MOMLOOP lay (mlQueueLay).
 *   run:  node test_spell_test_card.js
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
  const writes = [], toasts = [], finals = [], opened = [];
  const els = {};
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null,
    createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document,
    momHere: () => !!o.mom, _dryRun: () => false, ROSTER: new Set(["andrew"]),
    masteryData: o.mastery || { andrew: [], andrew_custom_items: [] },
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) }) },
    HA_LS: { setItem: () => {} }, gwShowToast: m => toasts.push(m), renderAll: () => {}, renderUnits: () => {},
    mastGetPrintNum: () => 7, mastStampNextDue: (it) => { it.next_due = 99; },
    DAY_DT: { wednesday: "October 7" }, checked: o.checked || {}, claimed: {}, toMin, fromMin, nowTs: () => "10:30 AM Oct 7",
    helperHolds: t => (o.helperHolds ? o.helperHolds(t) : null),
    finalizeDone: (id, ts) => { finals.push(id); ctx.checked[id] = ts; return true; },
    weekData: { tasks: o.tasks || [] } };
  vm.createContext(ctx);
  vm.runInContext(CODE + "\nObject.defineProperty(this,\"stUI\",{get:()=>stUI,set:v=>{stUI=v;}});", ctx);
  const decks = ctx._aasDecks();
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks,
    kidStage: { andrew: { stage: 1, subject: "all_about_spelling_1", path: o.path } } } };
  const realOpen = ctx.stOpen; ctx.stOpen = function () { opened.push([].slice.call(arguments)); return realOpen.apply(null, arguments); };
  return { ctx, writes, toasts, finals, opened, els };
}
const lesson = (id, time, title, extra) => Object.assign({ id, who: "andrew", day: "wednesday", time, dur: 30, mom: "required",
  subjectKey: "all_about_spelling_1", title: "📄 All About Spelling 1 — " + (title || "L19 NG · day 1 of 5") }, extra || {});
const other = (id, time, dur, extra) => Object.assign({ id, who: "andrew", day: "wednesday", time, dur: dur || 20, mom: "none", subjectKey: "math", title: "📄 Math — x" }, extra || {});
const sctx = (w, extra) => Object.assign({ checked: w.ctx.checked, claimed: {}, toMin, fromMin,
  win: () => ({ start: toMin("10:00 AM"), lunchStart: toMin("1:00 PM"), lunchEnd: toMin("2:00 PM") }) }, extra || {});

console.log("── the week gets a test card right before the lesson ──");
{
  const L = lesson("L1", "11:00 AM"), M = other("M1", "10:00 AM");
  const w = world({ tasks: [M, L] }), T = w.ctx.weekData.tasks;
  const r = w.ctx.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("one test card is added for Lesson 19's lesson day", r.added.length === 1 && t && t.id === "andrew_st_L1-18", r);
  ok("it tests the lesson BEFORE (Practice Week → Lesson 18), 10 words", t.title === "📝 Spelling test: Lesson 18" && t.stLevel === 1 && t.stLesson === 18 && /10 words/.test(t.detail));
  ok("it is Mom-required, its own subject (no lid, so no book's pace moves) and points at its lesson", t.mom === "required" && t.subjectKey === "spelltest" && !t.lid && t.stFor === "L1" && t.origSubjectKey === "all_about_spelling_1");
  ok("it sits right before the lesson: 10:50 → lesson 11:00 unchanged", t.time === "10:50 AM" && L.time === "11:00 AM" && t.day === "wednesday");
  ok("…and right before it in the week's list too", T.indexOf(t) === T.indexOf(L) - 1);
  ok("the card shows nothing that a child must produce (no words in the title or detail)", !/black|clock|milk|snack/.test(t.title + t.detail));
  const again = w.ctx.stSyncWeek(T, sctx(w));
  ok("a second pass changes nothing (every week write runs it)", !again.added.length && !again.removed.length && !again.moved.length && T.length === 3, again);
}
{
  const NB = other("NB", "10:00 AM", 30, { subjectKey: "morning_nb", title: "📓 Morning Notebook" }), L = lesson("L1", "10:30 AM");
  const w = world({ tasks: [NB, L] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("no room before the lesson (the Morning Notebook ends 10:30) → the test takes 10:30, the lesson follows at 10:40", t.time === "10:30 AM" && L.time === "10:40 AM" && NB.time === "10:00 AM");
  const again = w.ctx.stSyncWeek(T, sctx(w));
  ok("…and stays put on the next pass", !again.moved.length && t.time === "10:30 AM" && L.time === "10:40 AM");
}
{
  const w = world({ tasks: [lesson("P", "11:00 AM", "L19 NG · day 2 of 5"), lesson("Q", "11:00 AM", "L7 Short A")] });
  w.ctx.stSyncWeek(w.ctx.weekData.tasks, sctx(w));
  ok("no test card on a practice day, or when the lesson before had no words (Level 1 Lesson 7)", !w.ctx.weekData.tasks.some(x => x.stTest));
  const w2 = world({ tasks: [lesson("F", "11:00 AM", "L5 Writing Phonograms")], path: "first" });
  w2.ctx.stSyncWeek(w2.ctx.weekData.tasks, sctx(w2));
  ok("Test First on a lesson with no word cards → no test card", !w2.ctx.weekData.tasks.some(x => x.stTest));
  const w3 = world({ tasks: [lesson("G", "11:00 AM")], path: "first" });
  w3.ctx.stSyncWeek(w3.ctx.weekData.tasks, sctx(w3));
  ok("Test First: the card tests this lesson (Lesson 19)", (w3.ctx.weekData.tasks.find(x => x.stTest) || {}).stLesson === 19);
}

console.log("\n── it follows its lesson; done work never moves ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  L.day = "thursday"; L.time = "2:30 PM";   // the lesson was swept / re-laid
  w.ctx.stSyncWeek(T, sctx(w));
  const t = T.find(x => x.stTest);
  ok("the lesson moved to Thursday 2:30 → the test follows (Thursday 2:20)", t.day === "thursday" && t.time === "2:20 PM", t);
  w.ctx.checked[t.id] = "10:00 AM Oct 8"; L.time = "3:00 PM";
  w.ctx.stSyncWeek(T, sctx(w));
  ok("a checked test card is never moved", t.time !== "2:50 PM");
  T.splice(T.indexOf(L), 1); w.ctx.stSyncWeek(T, sctx(w));
  ok("…or removed when its lesson leaves the week", T.some(x => x.id === t.id));
}
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w));
  T.splice(T.indexOf(L), 1); const r = w.ctx.stSyncWeek(T, sctx(w));
  ok("an unchecked test card whose lesson left the week is removed", r.removed.length === 1 && !T.some(x => x.stTest));
  const w2 = world({ tasks: [lesson("L2", "11:00 AM")], checked: { L2: "9:00 AM Oct 7" } });
  w2.ctx.stSyncWeek(w2.ctx.weekData.tasks, sctx(w2));
  ok("a lesson already checked off gets no test card after the fact", !w2.ctx.weekData.tasks.some(x => x.stTest));
  const w3 = world({ tasks: [lesson("L3", "11:00 AM")] });
  w3.ctx.stSyncWeek(w3.ctx.weekData.tasks, sctx(w3, { dismissed: L => L.id === "L3" }));
  ok("a lesson Mom dismissed gets no test card", !w3.ctx.weekData.tasks.some(x => x.stTest));
  const w4 = world({ tasks: [lesson("L4", "11:00 AM")] });
  w4.ctx.stSyncWeek(w4.ctx.weekData.tasks, sctx(w4, { dayOf: L => "friday" }));
  ok("a lesson Mom pushed to Friday → the test card is on Friday too", w4.ctx.weekData.tasks.find(x => x.stTest).day === "friday");
}

console.log("\n── the lesson unlocks when the test is checked or graded ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), c = w.ctx;
  c.stSyncWeek(c.weekData.tasks, sctx(w));
  const t = c.weekData.tasks.find(x => x.stTest);
  ok("the lesson is locked behind its test", c.stLessonLock(L) === t);
  ok("the lesson card says so (kid-safe, no words)", /After the spelling test/.test(c.stCardRow(L, false)));
  ok("a tap on the locked lesson is stopped with a toast", c.stTapGate(L) === true && /Spelling test first/.test(w.toasts.pop()));
  c.checked[t.id] = "10:58 AM Oct 7";
  ok("test checked → unlocked", c.stLessonLock(L) === null && c.stTapGate(L) === false && c.stCardRow(L, false) === "");
  delete c.checked[t.id];
  c.masteryData.andrew_spelltests = { "L1-18": { state: "graded", res: {}, words: [] } };
  ok("test graded (not checked) → unlocked too", c.stLessonLock(L) === null);
  c.masteryData.andrew_spelltests = { "L1-18": { state: "pending", words: [] } };
  ok("a paper test waiting to be graded does NOT unlock by itself (its card is checked when given)", c.stLessonLock(L) === t);
}

console.log("\n── tapping the test card ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L], mom: true }), c = w.ctx;
  c.stSyncWeek(c.weekData.tasks, sctx(w));
  const t = c.weekData.tasks.find(x => x.stTest);
  ok("in Mom mode it opens the existing test screen on Lesson 18", c.stTapGate(t) === true && w.opened.length === 1 && w.opened[0][2] === 18 && c.stUI && c.stUI.key === "L1-18");
  ok("Mom sees her button on the test card", /Spelling test: Lesson 18 \(10 words\)/.test(c.stCardRow(t, false)));
  c.stToGrade(); c.stSetAll("c"); c.stSave();
  ok("Save results → the test card is checked off (and the lesson unlocks)", w.finals[0] === t.id && c.stLessonLock(L) === null);
  ok("…and the words were graded exactly as before", c.masteryData.andrew_spelltests["L1-18"].state === "graded" && c.masteryData.andrew.length === 10);
}
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L], mom: true }), c = w.ctx;
  c.stSyncWeek(c.weekData.tasks, sctx(w));
  const t = c.weekData.tasks.find(x => x.stTest);
  c.stTapGate(t); c.stPaper();
  ok("Paper — grade later → the card is checked (given) and 'Grade the spelling test' stays on Mom's list", w.finals[0] === t.id && c.masteryData.andrew_spelltests["L1-18"].state === "pending");
  ok("…the card's row says to grade it", /Grade the spelling test \(Lesson 18\)/.test(c.stCardRow(t, true)));
}
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), c = w.ctx;
  c.stSyncWeek(c.weekData.tasks, sctx(w));
  const t = c.weekData.tasks.find(x => x.stTest);
  ok("a kid can't open or check it — a toast, no screen", c.stTapGate(t) === true && !w.opened.length && /Mom gives the spelling test/.test(w.toasts.pop()));
  ok("a kid never sees Mom's button", c.stCardRow(t, false) === "");
  const hw = world({ tasks: [lesson("L1", "11:00 AM")], helperHolds: t => (t.stTest ? "gma" : null) }), h = hw.ctx;
  h.stSyncWeek(h.weekData.tasks, sctx(hw));
  const ht = h.weekData.tasks.find(x => x.stTest);
  ok("a helper holding it checks it off the normal way (no Mom screen)", h.stTapGate(ht) === false && !hw.opened.length);
  h.stOnTestChecked(ht);
  const rec = (h.masteryData.andrew_spelltests || {})["L1-18"];
  ok("…and her check leaves 'Grade the spelling test' for Mom (pending, words saved, nothing graded)", rec && rec.state === "pending" && rec.words.length === 10 && h.masteryData.andrew.length === 0
    && hw.writes.some(x => x[1] === "mastery/andrew_spelltests/L1-18" && x[0] === "set"));
  h.stOnTestChecked(ht);
  ok("…written once (a graded or pending record is never overwritten)", hw.writes.filter(x => x[1] === "mastery/andrew_spelltests/L1-18").length === 1);
}

console.log("\n── a helper takes the test: her window, alone ──");
{
  const L = lesson("L1", "2:00 PM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w, { helperWin: (d, k) => ({ id: "gma", s: toMin("9:30 AM"), e: toMin("12:00 PM") }) }));
  const t = T.find(x => x.stTest);
  ok("Grandma's regular window (9:30–12) → the test is laid at 9:30, the lesson stays with Mom at 2:00", t.time === "9:30 AM" && L.time === "2:00 PM");
}
{
  const L = lesson("L1", "10:00 AM"), M = other("M", "1:00 PM", 30), w = world({ tasks: [L, M] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w, { helperWin: () => ({ id: "gma", s: toMin("12:00 PM"), e: toMin("3:00 PM") }) }));
  const t = T.find(x => x.stTest);
  ok("window after the lesson → the test takes her first free slot (12:00) and the lesson follows it, still Mom's", t.time === "12:00 PM" && L.time === "12:10 PM", [t.time, L.time]);
  const again = w.ctx.stSyncWeek(T, sctx(w, { helperWin: () => ({ id: "gma", s: toMin("12:00 PM"), e: toMin("3:00 PM") }) }));
  ok("…stable on the next pass", !again.moved.length);
}
{
  const L = lesson("L1", "10:30 AM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w, { helperWin: () => ({ id: "gma", s: toMin("9:30 AM"), e: toMin("12:00 PM") }) }));
  ok("the lesson is in her window too → they stay together, test first", T.find(x => x.stTest).time === "10:20 AM" && L.time === "10:30 AM");
}

console.log("\n── the helper list: '📝 Spelling test' on its own ──");
{
  const H = cut("// ── HELPERS_START", "// ── HELPERS_END");
  const iso = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
  const mk = (help, pick, took) => {
    const ctx = { console, db: null, _dryRun: () => true, momHere: () => true, pageOn: () => true, weekData: { tasks: [] }, checked: {}, Date, toMin, Object, String };
    Object.defineProperty(ctx, "_todayDay", { get: () => "wednesday" });
    vm.createContext(ctx); vm.runInContext(H, ctx);
    const hd = {}; hd[iso] = { gma: { arrived: 1, took: took || {} } };
    vm.runInContext("helpersData=" + JSON.stringify({ gma: { name: "Grandma", pick: !!pick, help: { andrew: help } } }) + ";helperDaysData=" + JSON.stringify(hd) + ";", ctx);
    return ctx;
  };
  const L = lesson("L1", "11:00 AM"), t = { id: "andrew_st_L1-18", who: "andrew", day: "wednesday", mom: "required", subjectKey: "spelltest", stTest: true, origSubjectKey: "all_about_spelling_1" };
  const a = mk({ spelltest: true });
  ok("help list has the spelling test → Grandma holds the TEST, the lesson stays with Mom", a.helperHolds(t) === "gma" && a.helperHolds(L) === null);
  const b = mk({ all_about_spelling_1: true });
  ok("a helper on the AAS lesson takes its test too (they stay together)", b.helperHolds(t) === "gma" && b.helperHolds(L) === "gma");
  const p = mk({ all_about_spelling_1: true }, true, { "andrew_st_L1-18": true });
  ok("one-day handoff (pick mode): she ticks just the test today → the test is hers, the lesson stays with Mom", p.helperHolds(t) === "gma" && p.helperHolds(L) === null);
  ok("not on her list at all → nothing changes", mk({ math: true }).helperHolds(t) === null);
  ok("the help list shows a '📝 Spelling test' chip per AAS kid", /&#128221; Spelling test<\/div>/.test(H) && /helpersToggleHelp\(\\''\+id\+'\\',\\''\+_hlpQ\(k\)\+'\\',\\'spelltest\\'\)/.test(H));
}

console.log("\n── replay: Mom's lay keeps the pair together, test first ──");
{
  const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
  const BLOCK = src.slice(a, b);
  const ctx = { console, ROSTER: ["andrew", "lucy"], db: null, checked: {}, momMoves: {},
    morningComplete: () => true, bbActive: () => null, momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || ""), esc: s => String(s == null ? "" : s), toMin, fromMin,
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp };
  ctx._mlNowOverride = 9 * 60;
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  // a STALE stored time (the test printed after its lesson) — the lay still puts the test first, then the lesson
  const tasks = [
    { id: "buf", who: "andrew", day: "thursday", time: "10:00 AM", dur: 20, mom: "none", title: "Handwriting" },
    { id: "LES", who: "andrew", day: "thursday", time: "11:00 AM", dur: 30, mom: "required", subjectKey: "all_about_spelling_1", title: "📄 AAS 1 — L19 NG · day 1 of 5" },
    { id: "andrew_st_L1-18", who: "andrew", day: "thursday", time: "11:40 AM", dur: 10, mom: "required", subjectKey: "spelltest", stTest: true, stFor: "LES", title: "📝 Spelling test: Lesson 18" },
    { id: "SNG", who: "andrew", day: "thursday", time: "12:30 PM", dur: 20, mom: "required", subjectKey: "singapore", title: "📄 Singapore — 3" }];
  ctx.getActiveTasks = () => tasks;
  vm.createContext(ctx);
  vm.runInContext(BLOCK, ctx);
  vm.runInContext("stPairOrder=" + slice("stPairOrder") + ";momLoop={cursor:0,order:['andrew','lucy']};", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  const at = id => toMin(laid.find(t => t.id === id).time);
  ok("the test is laid right before its lesson, back to back", at("andrew_st_L1-18") + 10 === at("LES"), laid.map(t => t.id + "@" + t.time));
  ok("…and nothing of Mom's lands between them", !laid.some(t => t.id === "SNG" && at("SNG") > at("andrew_st_L1-18") && at("SNG") < at("LES")));
}

console.log("\n── STPASTGUARD: no new test card for a past lesson day, or for a test already given ──");
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  const r = w.ctx.stSyncWeek(T, sctx(w, { past: d => d === "wednesday" }));
  ok("Wednesday is behind us and the lesson isn't checked → no test card (nothing shows as missed)", !r.added.length && !T.some(x => x.stTest), r);
  const r2 = w.ctx.stSyncWeek(T, sctx(w, { past: () => false }));
  ok("…the same lesson today or later still gets its card", r2.added.length === 1);
}
// the app's own given/paper rules (stSyncCtx), on the test world's records
const appGuards = w => ({ given: (k, key) => { const x = w.ctx.stRecs(k)[key]; return !!(x && /graded|learning/.test(x.state)); },
  paper: (k, key) => { const x = w.ctx.stRecs(k)[key]; return !!(x && x.state === "pending"); } });
for (const st of ["graded", "learning"]) {
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  w.ctx.masteryData.andrew_spelltests = { "L1-18": { state: st, level: 1, lesson: 18 } };
  const r = w.ctx.stSyncWeek(T, sctx(w, appGuards(w)));
  ok("the test was already finished (" + st + ") from the lesson card → no new test card", !r.added.length && !T.some(x => x.stTest), r);
}
console.log("\n── STPAPERCARD: a test on paper, not yet graded, never loses its card (her rule 2026-10-14) ──");
{
  // replay 2026-10-13 DeWalt: L19's test marked paper (pending) at 9:26 PM while L20 day 1 sat on Thursday; the week was
  // regenerated at 11 PM (fresh cards) and L20 day 1 landed on Wednesday → the old code made no card, Andrew had no test.
  const w = world({ tasks: [] });
  w.ctx.masteryData.andrew_spelltests = { "L1-18": { state: "pending", level: 1, lesson: 18, due: "2026-10-15", words: [] } };
  const L = lesson("L1", "11:00 AM"), T = [L];   // the regenerated week: the lesson alone, on a new day
  const r = w.ctx.stSyncWeek(T, sctx(w, appGuards(w)));
  const t = T.find(x => x.stTest);
  ok("the regenerated week gets the test card back (pending is not 'given')", r.added.length === 1 && t && t.id === "andrew_st_L1-18", r);
  ok("its instruction is Grade (given on paper), not give the test", t && t.title === "📝 Grade the spelling test: Lesson 18" && /given on paper/.test(t.detail) && !/reads each word/.test(t.detail));
  ok("it sits right before the lesson, which stays locked until it is graded", t && t.time === "10:50 AM" && T.indexOf(t) === T.indexOf(L) - 1 && w.ctx.stLessonLock(L, T) === t);
  ok("the card shows nothing that a child must produce", !/black|clock|milk|snack/.test(t.title + t.detail));
  const again = w.ctx.stSyncWeek(T, sctx(w, appGuards(w)));
  ok("…and a second pass changes nothing", !again.added.length && !again.removed.length && !again.moved.length);
}
{
  // a plain card flips to Grade the moment the test goes on paper (print ahead), and back to a test card is never needed
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L], mom: true }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w, appGuards(w))); const t = T.find(x => x.stTest);
  ok("before printing: a give-the-test card", t && t.title === "📝 Spelling test: Lesson 18");
  w.ctx.masteryData.andrew_spelltests = { "L1-18": { state: "pending", level: 1, lesson: 18, words: [] } };
  const r = w.ctx.stSyncWeek(T, sctx(w, appGuards(w)));
  ok("after printing ahead: the SAME card now reads Grade (not removed, not re-added)", !r.added.length && !r.removed.length && T.find(x => x.stTest) === t && t.title === "📝 Grade the spelling test: Lesson 18", r);
  ok("Mom's row on it says Grade too", /Grade the spelling test \(Lesson 18\)/.test(w.ctx.stCardRow(t, false)));
}
{ const sc = slice("stSyncCtx");
  ok("the app's given = graded or learning only (pending is on paper, not given)", /given:\(kid,key\)=>\{[^\n]*r\.state==="graded"\|\|r\.state==="learning"\)\)/.test(sc) && !/given:\(kid,key\)=>[^\n]*"pending"/.test(sc));
  ok("…and paper = pending", /paper:\(kid,key\)=>\{[^\n]*r\.state==="pending"\)/.test(sc)); }
{
  const L = lesson("L1", "11:00 AM"), w = world({ tasks: [L] }), T = w.ctx.weekData.tasks;
  w.ctx.stSyncWeek(T, sctx(w)); const t = T.find(x => x.stTest);
  const r = w.ctx.stSyncWeek(T, sctx(w, { past: () => true, given: () => true }));
  ok("an EXISTING test card is left alone by the guard (it only stops new ones)", t && T.indexOf(t) >= 0 && !r.removed.length, r);
}
ok("the app context wires both (stSyncCtx: past by the week's dates, given by the record)", /past:day=>/.test(slice("stSyncCtx")) && /given:\(kid,key\)=>/.test(slice("stSyncCtx")));
ok("Regenerate passes the regenerated week's own dates", src.indexOf("stSyncCtx({checked:snapChecked,claimed:{},dates:d.dates||{}})") > 0);

console.log("\n── STHEAL: the week's cards load on Mom's device → the sync runs and writes only what it changed ──");
function healWorld(o) {
  const w = world(Object.assign({ mom: true }, o || {}));
  const now = new Date(), todayTxt = ["January","February","March","April","May","June","July","August","September","October","November","December"][now.getMonth()] + " " + now.getDate();
  Object.assign(w.ctx, { WK: "week2", sv: () => {}, dbg: m => w.toasts.push("dbg:" + m), lastTasksWrite: 0,
    DAY_DT: { wednesday: todayTxt },   // the app's STPASTGUARD reads the week's dates — this week's "wednesday" is today
    fbCheckedLoaded: o && o.checkedLoaded === false ? false : true, _haMastReady: o && o.mastReady === false ? false : true });
  if (o && o.dry) w.ctx._dryRun = () => true;
  return w;
}
const updates = w => w.writes.filter(x => x[0] === "update" && x[1] === "week2/tasks").map(x => x[2]);
{
  const NB = other("NB", "10:00 AM", 30, { subjectKey: "morning_nb", title: "📓 Morning Notebook" }), L = lesson("L1", "10:30 AM");
  const w = healWorld({ tasks: [NB, L] });
  w.ctx.masteryData.andrew_spelltests = { "L1-18": { state: "pending", level: 1, lesson: 18, words: [] } };   // Andrew's case: on paper, no card
  w.ctx.stHeal();
  const U = updates(w), u = U[0] || {}, T = w.ctx.weekData.tasks.find(x => x.stTest);
  ok("one targeted multi-path update (never the whole node)", U.length === 1 && !w.writes.some(x => x[0] === "set" && x[1] === "week2/tasks"), w.writes.map(x => x[0] + " " + x[1]));
  ok("it carries the new Grade card in full", u["andrew_st_L1-18"] && u["andrew_st_L1-18"].stTest && u["andrew_st_L1-18"].title === "📝 Grade the spelling test: Lesson 18" && u["andrew_st_L1-18"].time === "10:30 AM" && u["andrew_st_L1-18"].day === "wednesday");
  ok("…and the lesson's new time (the test took its slot), as day + time paths only", u["L1/time"] === "10:40 AM" && u["L1/day"] === "wednesday" && Object.keys(u).length === 3, Object.keys(u));
  ok("the Morning Notebook (unmoved) is not in the write", !("NB/time" in u) && !("NB" in u));
  ok("local week + echo guard + a log line", T && w.ctx.lastTasksWrite > 0 && w.toasts.some(m => /dbg:📝 spelling test cards \(heal\): \+1 −0/.test(m)));
  w.ctx.stHeal();
  ok("a second pass writes nothing (idempotent — the listener echo can't loop it)", updates(w).length === 1);
}
{
  const L = lesson("L1", "11:00 AM");
  for (const [label, o] of [["a kid's device (not Mom mode)", { mom: false }], ["dry-run", { dry: true }], ["before the checked list arrives", { checkedLoaded: false }], ["before the mastery records arrive (given/paper rules read them)", { mastReady: false }]]) {
    const w = healWorld(Object.assign({ tasks: [L] }, o)); w.ctx.stHeal();
    ok("no write " + label, !updates(w).length && !w.ctx.weekData.tasks.some(x => x.stTest));
  }
}
{
  const L = lesson("L1", "11:00 AM"), w = healWorld({ tasks: [L] });
  w.ctx.stHeal();
  ok("a plain lesson day gets its give-the-test card the same way", updates(w).length === 1 && updates(w)[0]["andrew_st_L1-18"].title === "📝 Spelling test: Lesson 18");
}
{
  const L = lesson("L1", "11:00 AM", "L19 NG · day 2 of 5", { id: "L1" }), stale = { id: "andrew_st_L1-18", who: "andrew", day: "wednesday", time: "10:50 AM", dur: 10, mom: "required", subjectKey: "spelltest", stTest: true, stFor: "L1", stKey: "L1-18", stLevel: 1, stLesson: 18, title: "📝 Spelling test: Lesson 18" };
  const w = healWorld({ tasks: [stale, L] }); w.ctx.stHeal();
  const u = updates(w)[0] || {};
  ok("a stale test card (its lesson is a practice day now) is removed by path (null), nothing else written", updates(w).length === 1 && u["andrew_st_L1-18"] === null && Object.keys(u).length === 1, u);
}
ok("the week's cards listener runs it right after rvHeal (first load or a changed task set)", /try\{ rvHeal\(\); \}catch\(e\)\{\} \}[^\n]*\n\s*if\(firstLoad \|\| inFP!==curFP\)\{ try\{ if\(typeof stHeal==="function"\) stHeal\(\); \}catch\(e\)\{\} \}/.test(src));
ok("Mom's device only, never in dry-run, waits for checked + mastery", /if\(!db\|\|_dryRun\(\)\) return;/.test(slice("stHeal")) && /momHereReal/.test(slice("stHeal")) && /fbCheckedLoaded\) return;/.test(slice("stHeal")) && /_haMastReady\) return;/.test(slice("stHeal")));

console.log("\n── wiring ──");
ok("tapTask asks the gate first (Mom opens the test · the lesson waits)", /if\(typeof stTapGate==="function"&&stTapGate\(t\)\) return;/.test(slice("tapTask")));
ok("finalizeDone refuses a locked lesson (every check path: Mom, approve, replays)", /stLessonLock\(_tg\)\)\{[^\n]*return false;/.test(slice("finalizeDone")));
ok("finalizeDone tells the test about a helper's check", /t\.stTest&&typeof stOnTestChecked==="function"/.test(slice("finalizeDone")));
ok("Mom's block keeps the pair together (prMomOrder → stPairOrder)", /stPairOrder\(out\)/.test(slice("prMomOrder")));
{ const sw = slice("safeWriteTasks"); ok("every week write syncs the test cards BEFORE the school-end guard", sw.indexOf("stSyncWeek(weekData.tasks,stSyncCtx())") > 0 && sw.indexOf("stSyncWeek(") < sw.indexOf("seGuardWeek(")); }
ok("Regenerate syncs them too (before its guard)", src.indexOf("stSyncWeek(d.tasks,stSyncCtx({checked:snapChecked") > 0 && src.indexOf("stSyncWeek(d.tasks,") < src.indexOf("seGuardWeek(d.tasks,seGuardCtx({checked:snapChecked}))"));
ok("the test card's own Mom-only row is what taskCard renders (stRow)", /const stRow=\(!readOnly&&typeof stCardRow==="function"\)\?stCardRow\(t,done\)/.test(src));
ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
