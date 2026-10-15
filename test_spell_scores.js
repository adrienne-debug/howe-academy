/*
 * Node tests — 📝 STGIVEN + STLIST (her yes 2026-10-14).
 *   STGIVEN: on the grading screen a "✓ Given — grade later" button (hidden once graded) — the test card is done now, the
 *            lesson behind it unlocks, the record stays on paper so "Grade <kid>'s spelling test" waits on Mom's list.
 *   STLIST:  Units ▸ All About Spelling ▸ kid row ▸ "📝 Tests" — every test, newest lesson first, score / state / date;
 *            a row opens that test on the grading screen with its saved marks so a mark can be changed and saved again.
 * Runs the REAL SPELLTEST block (+ AAS data, ckResultTier).
 *   run:  node test_spell_scores.js
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
    helperHolds: () => null, finalizeDone: (id, ts) => { finals.push(id); ctx.checked[id] = ts; return true; },
    weekData: { tasks: o.tasks || [] } };
  vm.createContext(ctx);
  vm.runInContext(CODE + "\nObject.defineProperty(this,\"stUI\",{get:()=>stUI,set:v=>{stUI=v;}});", ctx);
  const decks = ctx._aasDecks();
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks,
    kidStage: { andrew: { stage: 1, subject: "all_about_spelling_1", path: o.path } } } };
  const realOpen = ctx.stOpen; ctx.stOpen = function () { opened.push([].slice.call(arguments)); return realOpen.apply(null, arguments); };
  return { ctx, writes, toasts, finals, opened, els };
}
const testCard = (key, lesson) => ({ id: "andrew_st_" + key, who: "andrew", day: "wednesday", time: "10:50 AM", dur: 10, mom: "required", subjectKey: "spelltest", stTest: true, stFor: "L1", stKey: key, stLevel: 1, stLesson: lesson, title: "📝 Spelling test: Lesson " + lesson });
const lesson = (id, title) => ({ id, who: "andrew", day: "wednesday", time: "11:00 AM", dur: 30, mom: "required", subjectKey: "all_about_spelling_1", title: "📄 All About Spelling 1 — " + title });

console.log("── STGIVEN: '✓ Given — grade later' on the grading screen ──");
{
  const T = testCard("L1-18", 18), L = lesson("L1", "L19 NG · day 1 of 5");
  const w = world({ mom: true, tasks: [T, L] });
  w.ctx.masteryData.andrew_spelltests = { "L1-18": { state: "pending", level: 1, lesson: 18, words: [], ts: 5, due: "2026-10-15" } };
  w.ctx.stOpen("andrew", 1, 18, "wednesday");
  const html = w.els["st-panel"].innerHTML;
  ok("a paper test opens on the grading screen", w.ctx.stUI.view === "grade");
  ok("…with the button, before 'Didn't have time'", /✓ Given — grade later/.test(html) && html.indexOf("Given — grade later") < html.indexOf("Didn’t have time"));
  ok("the lesson is locked behind the test before the tap", w.ctx.stLessonLock(L) === T);
  w.ctx.stPaper();   // the button's handler
  ok("the test card is checked off (done now)", w.finals[0] === T.id && !!w.ctx.checked[T.id]);
  ok("…so the lesson unlocks", w.ctx.stLessonLock(L) === null);
  const rec = w.ctx.masteryData.andrew_spelltests["L1-18"];
  ok("the record stays on paper (pending), first-given time kept, no marks invented", rec.state === "pending" && rec.ts === 5 && !rec.res && w.ctx.masteryData.andrew.length === 0);
  const _d = new Date(), _today = _d.getFullYear() + "-" + String(_d.getMonth() + 1).padStart(2, "0") + "-" + String(_d.getDate()).padStart(2, "0");
  ok("…and 'Grade Andrew's spelling test' is on Mom's list from its due day", w.ctx.stPendingList().some(p => p.key === "L1-18") || rec.due > _today);
  ok("the toast says it waits for grading", w.toasts.some(m => /On your list until it’s graded/.test(m)));
  ok("the screen closed", !w.els["st-panel"]);
}
{
  const w = world({ mom: true, tasks: [testCard("L1-18", 18)] });
  w.ctx.masteryData.andrew_spelltests = { "L1-18": { state: "graded", level: 1, lesson: 18, words: [], res: { 0: "c" }, gradedTs: 9 } };
  w.ctx.stOpen("andrew", 1, 18, null);
  ok("a graded test shows no 'Given' button (nothing left to do)", !/Given — grade later/.test(w.els["st-panel"].innerHTML));
}
{
  const w = world({ mom: true, tasks: [testCard("L1-18", 18)] });
  w.ctx.stOpen("andrew", 1, 18, null); w.ctx.stToGrade();
  ok("a brand-new test's grading screen offers it too (given on screen, marks later)", /Given — grade later/.test(w.els["st-panel"].innerHTML));
}

console.log("\n── STLIST: every test in one place ──");
{
  const w = world({ mom: true });
  w.ctx.masteryData.andrew_spelltests = {
    "L1-18": { state: "graded", level: 1, lesson: 18, words: ["a","b","c","d","e","f","g","h","i","j"], res: ["c","c","c","c","c","c","c","c","m","c"], gradedTs: Date.parse("2026-10-07T10:50:00") },
    "L1-19": { state: "pending", level: 1, lesson: 19, words: ["k","l","m","n","o","p","q","r","s","t"], ts: Date.parse("2026-10-13T21:26:00"), due: "2026-10-15" },
    "L1-17": { state: "learning", level: 1, lesson: 17, words: ["u","v","w"], res: ["m","m","m"], gradedTs: Date.parse("2026-09-30T11:00:00") } };
  const rows = w.ctx.stListRows("andrew");
  ok("rows are newest lesson first", rows.map(r => r.lesson).join(",") === "19,18,17");
  ok("a graded test shows its score", rows[1].score === "9 ✓ · 0 〰 · 1 ✗" && rows[1].date === "10/7/26");
  ok("a paper test says it is waiting", rows[0].score === "on paper — waiting for marks" && rows[0].date === "10/13/26");
  ok("a didn't-have-time test says all went to learning", /^all 3 to learning/.test(rows[2].score));
  const html = w.ctx.stListHtml("andrew");
  ok("the panel names the kid and counts the tests", /Andrew’s spelling tests/.test(html) && /3 tests/.test(html));
  ok("each row opens that test", /stListOpenTest\('andrew',1,18\)/.test(html) && /stListOpenTest\('andrew',1,19\)/.test(html));
  ok("no word is printed on the list (nothing a child must produce)", !/>a<|>k<|>u</.test(html));
  w.ctx.stListOpen("andrew");
  ok("stListOpen draws the overlay", w.els["st-list"] && /spelling tests/.test(w.els["st-list"].innerHTML));
  w.ctx.stListOpenTest("andrew", 1, 18);
  ok("tapping a row closes the list and opens the test on the grading screen with its saved marks", !w.els["st-list"] && w.opened.length === 1 && w.ctx.stUI && w.ctx.stUI.view === "grade" && w.ctx.stUI.grades[8] === "m" && w.ctx.stUI.grades[0] === "c");
  const word9 = w.ctx.stUI.words[8].name;   // the deck's real 9th word of Level 1 Lesson 18 (the screen shows the deck, not the record)
  w.ctx.stSet(8, "c"); w.ctx.stSave();
  const rec = w.ctx.masteryData.andrew_spelltests["L1-18"];
  const it = w.ctx.masteryData.andrew.find(i => i.prompt === word9);
  ok("a changed mark saves: the record is re-graded 10 ✓ and the word moved up (✓ → the kid's tier, monthly by default)", rec.res[8] === "c" && rec.state === "graded" && it && it.tier === "monthly" && it.status === "active", it);
  ok("a missing lesson (words not in the deck) → a note, no screen", (() => { const w2 = world({ mom: true }); w2.ctx.masteryData.andrew_spelltests = { "L1-99": { state: "graded", level: 1, lesson: 99, words: ["zz"], res: ["c"] } }; w2.ctx.stListOpenTest("andrew", 1, 99); return !w2.ctx.stUI && w2.toasts.some(m => /aren’t in the deck/.test(m)); })());
}
{
  const w = world({ mom: true });
  ok("no tests yet → the panel says so", /No spelling tests yet/.test(w.ctx.stListHtml("andrew")));
  const k = world({ mom: false }); k.ctx.masteryData.andrew_spelltests = { "L1-18": { state: "graded", level: 1, lesson: 18, words: [], res: {} } };
  ok("a kid's device: no list, no button, no panel", k.ctx.stListHtml("andrew") === "" && (k.ctx.stListOpen("andrew"), !k.els["st-list"]));
  const u = w.ctx.unitStudies.all_about_spelling;
  ok("the AAS unit row carries the 📝 Tests button for Mom only", /stListOpen\('andrew'\)/.test(w.ctx.stUnitRowHtml(u, "andrew", u.kidStage.andrew)) && !/stListOpen/.test(k.ctx.stUnitRowHtml(u, "andrew", u.kidStage.andrew)));
}
ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
