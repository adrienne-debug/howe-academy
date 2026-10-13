/*
 * Node tests — ✏️ Practice-day cards (step 4 of the AAS plan, 2026-10-04). A practice day shows THIS lesson's words and
 * today's activity (rotating through the unit's list; an ideas PDF can ride along); a lesson-day card never does. Per kid
 * the practice can ride on a separate subject (Taylor's "Spelling Words") — then it shows the lesson she was last taught.
 *   run:  node test_practice_cards.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PRACTICE_START", "// PRACTICE_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {}; const writes = [], els = {};
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document,
    momHere: () => o.mom !== false, _dryRun: () => false, gwShowToast: () => {}, renderUnits: () => {},
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]) }) },
    currData: { subjects: { taylor: { all_about_spelling_4: { display: "All About Spelling 4", lessonSeq: ["Lesson 8", "Lesson 9", "Lesson 10"] }, spelling_words: { display: "Spelling Words" } },
      andrew: { all_about_spelling_1: { display: "AAS 1", lessonSeq: [] } } } },
    lidDoneIdx: (k, sk) => new Set(o.done || [0]), weekData: { tasks: o.tasks || [] } };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks: ctx._aasDecks(), practiceIdeas: o.ideas,
    kidStage: { andrew: { stage: 1, subject: "all_about_spelling_1" }, taylor: { stage: 4, subject: "all_about_spelling_4", practice: o.taylorPractice, knows: o.knows } } } };
  return { ctx, writes, els };
}
const card = (who, sk, title) => ({ who, subjectKey: sk, title: "📄 x — " + title, day: "thursday" });
console.log("── which card shows practice, and which words ──");
{
  const c = world().ctx;
  const I = c.prCardInfo(card("andrew", "all_about_spelling_1", "L19 NG · day 2 of 5"));
  ok("Andrew's practice day (L19 day 2 of 5) → Lesson 19's 10 words", I && I.lesson === 19 && I.words.length === 10 && I.words[0].name === "king");
  ok("his lesson-day card (day 1) shows NO practice — that's test + new lesson day", c.prCardInfo(card("andrew", "all_about_spelling_1", "L19 NG · day 1 of 5")) === null);
  ok("a card from another subject shows nothing", c.prCardInfo(card("andrew", "arithmetic_2", "Lesson 35")) === null);
  const row = c.prCardRow(card("andrew", "all_about_spelling_1", "L19 NG · day 3 of 5"));
  ok("the card row names today's activity and the lesson", /✏️ .+ — Lesson 19 words \(10\)/.test(row), row);
}
{
  const c = world({ taylorPractice: "spelling_words", done: [0] }).ctx;
  const I = c.prCardInfo(card("taylor", "spelling_words", "Spelling Words"));
  ok("Taylor's separate Spelling Words card → the lesson she was last taught (Lesson 8: January, February…)", I && I.lesson === 8 && I.words[0].name === "January", I && I.lesson);
  ok("…and her AAS lesson card shows no practice row", c.prCardInfo(card("taylor", "all_about_spelling_4", "Lesson 9")) === null);
  const c2 = world({ taylorPractice: "spelling_words", done: [0, 1] }).ctx;
  ok("after Lesson 9 is taught, the practice card moves to Lesson 9's words", c2.prCardInfo(card("taylor", "spelling_words", "Spelling Words")).lesson === 9);
  // Taylor's real first week: NO done records yet (Lesson 8 predates the app) — "knows through Lesson 8" carries it
  const c3 = world({ taylorPractice: "spelling_words", done: [], knows: "Lesson 8" }).ctx;
  ok("no done records yet → 'knows through Lesson 8' → Lesson 8 words on Mon/Tue", c3.prCardInfo(card("taylor", "spelling_words", "Spelling Words")).lesson === 8);
  // Wednesday: the AAS lesson-day card (Lesson 9) is on the same day → the NEW words (Sarah: "she writes the new words that day too")
  const wk = [{ who: "taylor", subjectKey: "all_about_spelling_4", day: "wednesday", title: "📖 AAS 4 — Lesson 9" }];
  const c4 = world({ taylorPractice: "spelling_words", done: [], knows: "Lesson 8", tasks: wk }).ctx;
  ok("Wednesday's Spelling Words card → Lesson 9 (the lesson taught that day), no check-off needed", c4.prCardInfo(Object.assign(card("taylor", "spelling_words", "Spelling Words"), { day: "wednesday" })).lesson === 9);
  ok("…Thursday too (the week's latest lesson day on or before)", c4.prCardInfo(Object.assign(card("taylor", "spelling_words", "Spelling Words"), { day: "thursday" })).lesson === 9);
  ok("…but Monday (before the lesson day) still Lesson 8", c4.prCardInfo(Object.assign(card("taylor", "spelling_words", "Spelling Words"), { day: "monday" })).lesson === 8);
}
console.log("\n── activities ──");
{
  const c = world().ctx, u = c.unitStudies.all_about_spelling;
  ok("no list of her own → the starter list (8 ideas, 'Write each word 3 times' first)", c.prIdeas(u).length === 8 && c.prIdeas(u)[0] === "Write each word 3 times");
  const days = ["2026-10-05", "2026-10-06", "2026-10-07"].map(d => c.prIdeaFor(u, d));
  ok("a different activity each day", new Set(days).size === 3, days);
  const c3 = world({ ideas: ["Sand", "", "Tiles"] }).ctx;
  ok("her own list replaces it (blank lines ignored)", JSON.stringify(c3.prIdeas(c3.unitStudies.all_about_spelling)) === JSON.stringify(["Sand", "Tiles"]));
}
console.log("\n── the panel (kids can open it — practice is copying) ──");
{
  const w = world({ mom: false }), c = w.ctx;
  c.prOpen("andrew", 1, 19);
  const html = w.els["pr-panel"].innerHTML;
  ok("shows every word big, and today's activity", /king/.test(html) && /swing/.test(html) && /Today:/.test(html));
  ok("no PDF link until one is attached", !/More activity ideas/.test(html));
  c.unitStudies.all_about_spelling.ideasPdfName = "ideas.pdf"; c.prRender();
  ok("an attached PDF shows as '📄 More activity ideas'", /More activity ideas \(ideas\.pdf\)/.test(w.els["pr-panel"].innerHTML));
}
console.log("\n── Mom's setup ──");
{
  const w = world(), c = w.ctx, u = c.unitStudies.all_about_spelling;
  ok("the unit shows 'Practice-day activities' to Mom", /Practice-day activities \(8 — the starter list\)/.test(c.prSetupHtml(u)));
  ok("…not to a kid", world({ mom: false }).ctx.prSetupHtml(u) === "");
  c.prSetPractice("all_about_spelling", "taylor", "spelling_words");
  ok("picking Taylor's Spelling Words card is saved for her", u.kidStage.taylor.practice === "spelling_words" && w.writes.some(x => x[1] === "unitStudies/all_about_spelling/kidStage/taylor/practice" && x[2] === "spelling_words"));
  ok("the kid row offers her other subjects", /Spelling Words/.test(c.prKidRowHtml(u, "taylor", u.kidStage.taylor)));
}
console.log("\n── wiring ──");
ok("the card joins prRow after the test row; never on done cards", /stRow\+prRow\+/.test(src) && /const prRow=\(!readOnly&&!done&&typeof prCardRow==="function"\)/.test(src));
ok("the unit carries the setup + per-kid practice choice", /h=prSetupHtml\(u\)\+h/.test(src) && /h\+=prKidRowHtml\(u,k,ks\)/.test(src));
console.log("\n── ST_NOWORDS (her report 10/13, DeWalt Kenzie): a lesson with no new word cards says so ──");
{
  const c = world().ctx;   // Andrew is Level 1; L1 Lessons 1–6 bring no new word cards in the deck
  ok("prCardInfo alone still returns null for an empty lesson (test rule + other callers unchanged)", c.prCardInfo(card("andrew", "all_about_spelling_1", "L5 x · day 2 of 5")) === null);
  const I = c.prCardInfo(card("andrew", "all_about_spelling_1", "L5 x · day 2 of 5"), true);
  ok("…but with allowEmpty it reports the lesson with noWords", I && I.lesson === 5 && I.noWords === true && I.words.length === 0);
  const row = c.prCardRow(card("andrew", "all_about_spelling_1", "L5 x · day 2 of 5"));
  ok("the card row says 'Lesson 5 — no new word cards' instead of nothing", /✏️ Lesson 5 — no new word cards in this lesson/.test(row) && !/prOpen\(/.test(row), row);
  ok("a lesson WITH words still shows the normal ✏️ row", /prOpen\(/.test(c.prCardRow(card("andrew", "all_about_spelling_1", "L19 NG · day 3 of 5"))));
}

console.log("\n── ST_REVIEW (her design 10/13): a lesson with no new words reviews 10 a day from the last 5 lessons that had words ──");
{
  const c = world().ctx;   // Taylor is Level 4; L4 Lessons 4 and 5 have no word cards, Lessons 3 and 2 do, Lesson 1 doesn't
  const d = n => c.prCardInfo(card("taylor", "all_about_spelling_4", "Lesson 4 · day " + n + " of 4"));
  const I1 = d(1), I2 = d(2);
  ok("the empty lesson's day 1 (lesson day) gets a review set too — the test is its own card", I1 && I1.review && I1.review.words.length === 10, I1);
  ok("pool = the last 5 lessons WITH words, walking back into Level 3 (3, 2, L3-29, L3-28, L3-26; L3-27 is empty)", I1.review.label === "Lessons 3, 2, L3-29, L3-28, L3-26", I1.review.label);
  const pool = new Set(I1.review.lists.reduce((a, l) => a.concat(l.words), []));
  ok("50 words in the pool, every review word comes from it", pool.size === 50 && I1.review.words.every(w => pool.has(w)));
  ok("day 2 is a different 10 (walks forward, no repeats until the pool wraps)", I2.review.words.length === 10 && !I2.review.words.some(w => I1.review.words.includes(w)));
  const all = [1, 2, 3, 4, 5].map(n => c.prCardInfo(card("taylor", "all_about_spelling_4", "Lesson 4 · day " + n + " of 5")).review.words);
  ok("five days cover all 50 once", new Set(all.flat()).size === 50);
  const I6 = c.prCardInfo(card("taylor", "all_about_spelling_4", "Lesson 4 · day 6 of 6")).review.words;
  ok("day 6 wraps around (repeats are fine)", I6.join() === all[0].join());
  ok("same kid + lesson + day → the same 10 every time (every device and the print agree)", d(2).review.words.join() === I2.review.words.join());
  ok("shuffled: day 1 is not just the first 10 of Lesson 3 in deck order", I1.review.words.join() !== I1.review.lists[0].words.join());
  ok("a lesson WITH words is unchanged: day 1 → no practice row, day 2 → its own words", c.prCardInfo(card("taylor", "all_about_spelling_4", "Lesson 3 · day 1 of 4")) === null && c.prCardInfo(card("taylor", "all_about_spelling_4", "Lesson 3 · day 2 of 4")).words.length === 10);
  const row = c.prCardRow(card("taylor", "all_about_spelling_4", "Lesson 4 · day 3 of 4"));
  ok("the ✏️ row reads 'Review words (10)' and opens the pop-up with the day", /— Review words \(10\)/.test(row) && /prOpen\('taylor',4,4,3\)/.test(row), row);
  ok("no pool at all (Level 1, Lesson 5) → still the 'no new word cards' note", /no new word cards/.test(c.prCardRow(card("andrew", "all_about_spelling_1", "L5 x · day 2 of 5"))));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
