/*
 * Node tests — 📝 Spelling test (step 2 of the All About Spelling plan; her "yes build", 2026-10-04).
 * One test per lesson, Mom-only, words hidden until she taps; ✓ Got it → graduated · 〰 Took a moment → monthly ·
 * ✗ Missed → learning (the Check-up's own mapping). Practice Week tests LAST lesson's words on the lesson-day card,
 * Test First tests THIS lesson's. Paper tests sit on Mom's list until graded; "Didn't have time" sends every word
 * to learning and stays re-gradable. Runs the REAL SPELLTEST block (+ the real AAS unit data and ckResultTier).
 *   run:  node test_spell_test.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + slice("ckResultTier") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function world(o) {
  o = o || {};
  const writes = [], toasts = [], els = {};
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null,
    createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document,
    momHere: () => o.mom !== false, _dryRun: () => false, ROSTER: new Set(["andrew", "taylor"]),
    masteryData: o.mastery || { andrew: [], andrew_custom_items: [], taylor: [], taylor_custom_items: [] },
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) }) },
    HA_LS: { setItem: () => {} }, gwShowToast: m => toasts.push(m), renderAll: () => {}, renderUnits: () => {},
    mastGetPrintNum: () => 7, mastStampNextDue: (it) => { it.next_due = 99; },
    DAY_DT: { monday: "October 5", tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9" },
    weekData: { tasks: o.tasks || [] } };
  vm.createContext(ctx); vm.runInContext(CODE + "\nthis.AAS_DATA=AAS_DATA; Object.defineProperty(this,\"stUI\",{get:()=>stUI,set:v=>{stUI=v;}});", ctx);
  const decks = ctx._aasDecks();
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks,
    kidStage: Object.assign({ andrew: { stage: 1, subject: "all_about_spelling_1", path: o.andrewPath }, taylor: { stage: 4, subject: "all_about_spelling_4", path: "first" } }, o.kidStage || {}) } };
  return { ctx, writes, toasts, els, run: e => vm.runInContext(e, ctx) };
}

console.log("── which lesson a card tests ──");
{
  const w = world(), c = w.ctx, en = c.stEnroll("andrew");
  ok("lesson names parse: 'L19 NG · day 1 of 5' / 'Lesson 9' / 'L2-7'", c.stParseLesson("L19 NG · day 1 of 5").lesson === 19 && c.stParseLesson("Lesson 9").lesson === 9
    && c.stParseLesson("L2-7").level === 2 && c.stParseLesson("L2-7").lesson === 7);
  ok("a practice day is not a lesson day; day 1 and one-day lessons are", !c.stIsLessonDay("L19 NG · day 2 of 5") && c.stIsLessonDay("L19 NG · day 1 of 5") && c.stIsLessonDay("Lesson 9"));
  const wk = c.stTarget(en.u, en.ks, "L19 NG · day 1 of 5");
  ok("Practice Week (default): Lesson 19's lesson day tests Lesson 18's 10 words", wk && wk.lesson === 18 && wk.words.length === 10 && wk.words[0].name === "king" === false && wk.key === "L1-18", wk && { l: wk.lesson, n: wk.words.length });
  ok("…and they are Lesson 18's words (black, clock, milk…)", wk.words.map(x => x.name).slice(0, 3).join() === "black,clock,milk");
  const first = c.stTarget(en.u, Object.assign({}, en.ks, { path: "first" }), "L19 NG · day 1 of 5");
  ok("Test First: the same card tests Lesson 19's own words (king, long, sing…)", first.lesson === 19 && first.words[0].name === "king");
  ok("Test First on a lesson with no word cards (Level 1 Lesson 5) → no test", c.stTarget(en.u, Object.assign({}, en.ks, { path: "first" }), "L5 Writing Phonograms") === null);
  ok("Practice Week on Level 1 Lesson 7 → nothing earlier has words → no test", c.stTarget(en.u, en.ks, "L7 Short A") === null);
  ok("Practice Week tests ONLY the lesson right before — Level 2 Lesson 4 brought no words, so Lesson 5's card has no test", c.stTarget(en.u, { stage: 2, path: "week" }, "Lesson 5") === null);
  ok("…and never reaches back further (Level 2 Lesson 2: Lesson 1 has no words → no test)", c.stTarget(en.u, { stage: 2 }, "Lesson 2") === null);
  ok("a level-spanning subject: 'L2-10' → Level 2 Lesson 9 (the lesson before)", (function () { const r = c.stTarget(en.u, { stage: 2 }, "L2-10"); return r.level === 2 && r.lesson === 9; })());
  ok("Taylor-style one-day lessons: Lesson 9 (Practice Week) → Lesson 8", (function () { const r = c.stTarget(en.u, { stage: 4 }, "Lesson 9"); return r.level === 4 && r.lesson === 8 && r.words[0].name === "January"; })());
}

console.log("\n── the lesson card's button ──");
{
  const card = (title, sk) => ({ id: "x", who: "andrew", subjectKey: sk || "all_about_spelling_1", day: "wednesday", title: "📄 All About Spelling 1 — " + title });
  const w = world();
  const row = w.ctx.stCardRow(card("L19 NG · day 1 of 5"));
  ok("Mom sees 'Spelling test: Lesson 18 (10 words)' on the lesson-day card", /Spelling test: Lesson 18 \(10 words\)/.test(row), row);
  ok("not on a practice-day card", w.ctx.stCardRow(card("L19 NG · day 2 of 5")) === "");
  ok("not on another subject's card", w.ctx.stCardRow(card("L19 NG · day 1 of 5", "arithmetic_2")) === "");
  const kidView = world({ mom: false });
  ok("a KID never sees it (no Mom unlock → no button)", kidView.ctx.stCardRow(card("L19 NG · day 1 of 5")) === "");
}

console.log("\n── giving and grading it ──");
{
  const w = world(), c = w.ctx;
  c.stOpen("andrew", 1, 18, "wednesday");
  ok("the screen opens on word 1, hidden", c.stUI && c.stUI.view === "give" && c.stUI.i === 0 && !c.stUI.show && !/>black</.test(w.els["st-panel"].innerHTML));
  c.stShowWord();
  ok("👁 shows the word (and only then)", />black</.test(w.els["st-panel"].innerHTML));
  c.stStep(1);
  ok("next word hides again", c.stUI.i === 1 && !c.stUI.show);
  c.stToGrade();
  ok("Save is blocked until every word is marked", (c.stSave(), c.stUI !== null) && !w.writes.length);
  c.stUI.words.forEach((x, i) => c.stSet(i, i < 7 ? "c" : (i < 9 ? "s" : "m")));
  c.stSave();
  const items = c.masteryData.andrew;
  const tierOf = n => { const it = items.find(i => i.prompt === n); return it && (it.status + "/" + it.tier); };
  ok("✓ → graduated", tierOf("black") === "active/graduated");
  ok("〰 → monthly, with a next check booked", tierOf("desk") === "active/monthly" && items.find(i => i.prompt === "desk").next_due === 99);
  ok("✗ → learning (daily)", tierOf("snack") === "introduction/daily");
  ok("every word is an AAS Words card with its spelling as the answer", items.length === 10 && items.every(i => i.subject === "AAS Words" && i.answer === i.prompt));
  const rec = c.masteryData.andrew_spelltests["L1-18"];
  ok("the test record is saved as graded, with each word's result", rec.state === "graded" && rec.res[0] === "c" && rec.res[9] === "m" && rec.words.length === 10);
  ok("writes are targeted (cards by index, the record by key)", w.writes.some(x => x[1] === "mastery/andrew" && x[0] === "update") && w.writes.some(x => x[1] === "mastery/andrew_spelltests/L1-18" && x[0] === "set"));
  ok("the card now says how it went", /✓ Spelling test, Lesson 18: 7 of 10/.test(c.stCardRow({ who: "andrew", subjectKey: "all_about_spelling_1", day: "wednesday", title: "x — L19 NG · day 1 of 5" })));
}
{
  const w = world({ mastery: { andrew: [{ id: "and_black", subject: "AAS Words", prompt: "black", answer: "black", status: "active", tier: "monthly" }], andrew_custom_items: [] } }), c = w.ctx;
  c.stOpen("andrew", 1, 18); c.stToGrade(); c.stSetAll("c"); c.stSet(0, "m"); c.stSet(0, "m"); c.stSet(0, "m"); c.stSave();
  const blacks = c.masteryData.andrew.filter(i => i.prompt === "black");
  ok("one word = one card: an existing card is updated, not duplicated", blacks.length === 1 && blacks[0].id === "and_black" && blacks[0].status === "introduction");
}

console.log("\n── paper, 'didn't have time', and Mom's list ──");
{
  const w = world(), c = w.ctx;
  c.stOpen("andrew", 1, 18, "monday"); c.stPaper();
  const rec = c.masteryData.andrew_spelltests["L1-18"];
  ok("paper → pending on Mom's list, due its lesson day", rec.state === "pending" && /^2026-10-05$|^\d{4}-10-05$/.test(rec.due));
  ok("no card changed yet (nothing moves until it's graded)", c.masteryData.andrew.length === 0);
  c.masteryData.andrew_spelltests["L1-18"].due = "2000-01-01";
  ok("Mom's list shows 'Grade Andrew's spelling test'", c.stPendingList().length === 1 && /Grade Andrew’s spelling test/.test(c.stPendingHTML()));
  c.masteryData.andrew_spelltests["L1-18"].due = "2999-01-01";
  ok("…but not before its day (printed ahead)", c.stPendingList().length === 0);
  c.masteryData.andrew_spelltests["L1-18"].due = "2000-01-01";
  c.stOpen("andrew", 1, 18);
  ok("opening a pending test goes straight to grading", c.stUI.view === "grade");
  c.stNoTime();
  ok("'Didn't have time' → every word to learning, test marked 'learning'", c.masteryData.andrew.length === 10 && c.masteryData.andrew.every(i => i.status === "introduction") && c.masteryData.andrew_spelltests["L1-18"].state === "learning");
  ok("…and it leaves Mom's list", c.stPendingList().length === 0);
  c.stOpen("andrew", 1, 18); c.stSetAll("c"); c.stSave();
  ok("it can still be graded properly later — the words move to where they belong", c.masteryData.andrew.every(i => i.tier === "graduated") && c.masteryData.andrew_spelltests["L1-18"].state === "graded");
  const kid = world({ mom: false });
  ok("a kid's device never shows the list", kid.ctx.stPendingHTML() === "");
}

console.log("\n── print ──");
{
  const w = world(), c = w.ctx;
  const en = c.stEnroll("andrew"), t = c.stTarget(en.u, en.ks, "L19 NG · day 1 of 5");
  const html = c.stPrintHtml([{ kid: "andrew", level: 1, lesson: 18, words: t.words }]);
  const parts = html.split('<section class="pg">');
  ok("the grown-up's sheet has every word, sentence and ✓ 〰 ✗ boxes", /black/.test(parts[1]) && /snack/.test(parts[1]) && /☐ 〰/.test(parts[1]));
  ok("the kid's sheet has NO words — just numbered lines", parts[2] && !/black|clock|snack/.test(parts[2]) && (parts[2].match(/<li><\/li>/g) || []).length === 10);
}
{
  const tasks = [{ who: "andrew", subjectKey: "all_about_spelling_1", day: "wednesday", title: "📄 AAS 1 — L19 NG · day 1 of 5" },
                 { who: "andrew", subjectKey: "all_about_spelling_1", day: "thursday", title: "📄 AAS 1 — L19 NG · day 2 of 5" },
                 { who: "taylor", subjectKey: "all_about_spelling_4", day: "wednesday", title: "📖 AAS 4 — Lesson 9" }];
  const w = world({ tasks }), c = w.ctx;
  const T = c.stWeekTests();
  ok("this week: Andrew (Practice Week → Lesson 18) and Taylor (Test First → Lesson 9)", T.length === 2 && T.find(x => x.kid === "andrew").lesson === 18 && T.find(x => x.kid === "taylor").lesson === 9, T.map(x => x.kid + x.lesson));
  ok("each carries its lesson day as the due date", T.every(x => /-10-07$/.test(x.due)));
}

console.log("\n── the unit row ──");
{
  const w = world(), c = w.ctx, u = c.unitStudies.all_about_spelling;
  const h = c.stUnitRowHtml(u, "andrew", u.kidStage.andrew);
  ok("shows the path choice with Practice Week selected by default", /Practice Week/.test(h) && /Test First/.test(h) && c.stPath(u.kidStage.andrew) === "week");
  c.stSetPath("all_about_spelling", "andrew", "first");
  ok("tapping Test First saves it for that kid", u.kidStage.andrew.path === "first" && w.writes.some(x => x[1] === "unitStudies/all_about_spelling/kidStage/andrew/path" && x[2] === "first"));
  ok("no path pill on a unit that isn't lesson-carrying", c.stUnitRowHtml({ id: "x", cardLessons: false }, "andrew", {}) === "");
}

console.log("\n── wiring ──");
ok("the lesson card renders the button (taskCard joins stRow)", /rvRow\+msRow\+llRow\+stRow\+/.test(src) && /const stRow=\(!readOnly&&typeof stCardRow==="function"\)\?stCardRow\(t,done\)/.test(src));
ok("Mom HQ and Mom's Day show tests waiting to be graded", (src.match(/h\+=stPendingHTML\(\)/g) || []).length === 2);
ok("the unit row carries the path pill and the print-this-week button", /h\+=stUnitRowHtml\(u,k,ks\)/.test(src) && /onclick="stPrintWeek\(\)"/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
