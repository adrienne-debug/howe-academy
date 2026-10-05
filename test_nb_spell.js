/*
 * Node tests — 📝 notebook Spelling page + 📓 starter notebooks (step 5 of the AAS plan, 2026-10-04).
 * Per kid, OFF until Mom picks: This Week's Words (all / just the missed ones) and Practice Words. Practice Week kids:
 * before this week's lesson day the words of the lesson they were last taught, from the lesson day the new lesson's.
 * Kids with no custom notebook (DeWalt) get a starter notebook in a neutral palette that holds these pages.
 *   run:  node test_nb_spell.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nbSrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const CODE = cut(src, "// AAS_START", "// AAS_END") + "\n" + cut(src, "// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut(src, "// PRACTICE_START", "// PRACTICE_END") + "\n" + cut(src, "// NBSPELL_START", "// NBSPELL_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {}; const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document: { getElementById: () => null },
    momHere: () => o.mom !== false, _dryRun: () => false, renderUnits: () => {}, db: { ref: p => ({ set: v => writes.push([p, v]) }) },
    masteryData: o.mastery || { andrew: [] },
    currData: { subjects: { andrew: { aas: { lessonSeq: ["L18 CK · day 1 of 5", "L18 CK · day 2 of 5", "L19 NG · day 1 of 5"] } } } },
    lidDoneIdx: () => new Set(o.done || [0, 1]), ROSTER: new Set(["andrew"]), nbWeekOverride: null, weekData: { tasks: o.tasks || [] }, DAY_DT: o.dates || {} };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks: ctx._aasDecks(), kidStage: { andrew: Object.assign({ stage: 1, subject: "aas" }, o.ks || {}) } } };
  return { ctx, writes };
}
const DATES = { monday: "October 5", tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9" };
const WK = [{ who: "andrew", subjectKey: "aas", day: "monday", title: "x — L18 CK · day 4 of 5" }, { who: "andrew", subjectKey: "aas", day: "wednesday", title: "x — L19 NG · day 1 of 5" }];
console.log("── off until Mom picks ──");
ok("nothing turned on → no spelling page", world({ tasks: WK }).ctx.nbSpellCtx("andrew", WK, DATES) === null);
console.log("\n── This Week's Words (Practice Week) ──");
{
  const sp = world({ ks: { nbWords: "all" } }).ctx.nbSpellCtx("andrew", WK, DATES);
  ok("two sections: Mon – Tue = Lesson 18 (last taught), Wed – Fri = Lesson 19 (new)", sp && sp.sections.length === 2 && sp.sections[0].label === "Mon – Tue" && sp.sections[0].lesson === 18 && sp.sections[1].label === "Wed – Fri" && sp.sections[1].lesson === 19, sp && sp.sections.map(s => s.label + s.lesson));
  ok("…with the real words (black… / king…)", sp.sections[0].words[0] === "black" && sp.sections[1].words[0] === "king");
}
{
  const sp = world({ ks: { nbWords: "all", path: "first" } }).ctx.nbSpellCtx("andrew", WK, DATES);
  ok("Test First 'all' → just this week's lesson from its day", sp.sections.length === 1 && sp.sections[0].lesson === 19);
}
{
  const m = { andrew: [{ subject: "AAS Words", prompt: "snack", status: "introduction" }, { subject: "AAS Words", prompt: "black", status: "active", tier: "graduated" }] };
  const sp = world({ ks: { nbWords: "missed" }, mastery: m }).ctx.nbSpellCtx("andrew", WK, DATES);
  ok("'just the missed ones' → only words they're learning now", sp.sections.length === 1 && sp.sections[0].words.join() === "snack");
}
console.log("\n── Practice Words ──");
{
  const m = { andrew: [{ subject: "AAS Words", prompt: "snack", status: "introduction", stLast: { r: "m" } }, { subject: "Spelling", prompt: "been", status: "parked", problem: { ts: 1 } },
    { subject: "AAS Words", prompt: "king", status: "introduction" }, { subject: "Math Facts", prompt: "7×8", status: "introduction", drop_count: 3 }] };
  const sp = world({ ks: { nbPractice: true }, mastery: m }).ctx.nbSpellCtx("andrew", WK, DATES);
  ok("missed / problem spelling words they're learning → listed; a never-missed new word and math are not", sp.practice.join() === "snack,been", sp.practice);
  ok("no practice words and no This Week's Words → no page", world({ ks: { nbPractice: true } }).ctx.nbSpellCtx("andrew", WK, DATES) === null);
}
console.log("\n── the Notebook tab's print-tests button ──");
{
  const c = world({ tasks: WK, dates: DATES }).ctx;
  ok("shows '🖨 Spelling tests for this notebook week (1)' to Mom", /Spelling tests for this notebook week \(1\)/.test(c.nbsTestsBtnHtml()));
  ok("…not to a kid", world({ tasks: WK, dates: DATES, mom: false }).ctx.nbsTestsBtnHtml() === "");
  c.nbWeekOverride = { tasks: [], dates: DATES };
  ok("it follows the notebook's TARGET week (a parked week with no lesson day → no button)", c.nbsTestsBtnHtml() === "");
}
console.log("\n── kid row ──");
{
  const w = world(), c = w.ctx, u = c.unitStudies.all_about_spelling;
  ok("the AAS unit row offers both options", /This Week’s Words/.test(c.nbsKidRowHtml(u, "andrew", u.kidStage.andrew)) && /Practice Words/.test(c.nbsKidRowHtml(u, "andrew", u.kidStage.andrew)));
  c.nbsSet("all_about_spelling", "andrew", "nbWords", "all");
  ok("picking saves to the kid's unit record", u.kidStage.andrew.nbWords === "all" && w.writes.some(x => x[0] === "unitStudies/all_about_spelling/kidStage/andrew/nbWords" && x[1] === "all"));
}
console.log("\n── notebooks.js: the page and the starter notebook ──");
{
  global.window = global; require(path.join(__dirname, "notebooks.js")); const N = global.HoweNotebooks;
  const sp = { title: "Spelling", sections: [{ label: "Mon – Tue", lesson: 18, words: ["black", "Mr․"] }], practice: ["been"] };
  const pg = N._internal.spellNbPages({ weekNum: 3, spelling: sp }, null);
  ok("one page with the words (Mr․ printed as 'Mr.') and the Practice Words box", pg.length === 1 && /black/.test(pg[0]) && /Mr\./.test(pg[0]) && /Practice Words/.test(pg[0]));
  ok("no spelling → no page", N._internal.spellNbPages({ weekNum: 3 }, null).length === 0);
  const base = { weekNum: 1, nbKidName: "Taylor", weekData: { dates: { monday: "Oct 5" }, tasks: [] } };
  const g = N.generate("taylor", Object.assign({}, base, { spelling: sp }));
  ok("a kid with no custom notebook gets the starter notebook with the Spelling page", /📝 Spelling/.test(g.student) && /Taylor's Notebook/.test(g.student));
  ok("nothing turned on → one page that says where to turn things on", /Nothing to print yet/.test(N.generate("taylor", base).student));
  ok("custom notebooks still build (Lincoln)", /Lincoln/.test(N.generate("lincoln", base).student));
  ok("every custom generator adds the spelling page after its unit pages", (nbSrc.match(/spellNbPages\(ctx, UNIT_INSERT_THEMES\.\w+\)\.forEach/g) || []).length === 5);
}
console.log("\n── wiring in the app ──");
ok("the notebook context carries the spelling page data and the kid's name", /spelling=nbSpellCtx\(kid,tasks,dates\)/.test(src) && /return \{ nbKidName:/.test(src));
ok("the Notebook tab lists every kid in the family (starter notebooks for the rest)", /NB_KIDS\.push\(\{k,label:/.test(src) && /starter notebook/.test(src));
ok("the Notebook tab carries the print-tests button", /nbsTestsBtnHtml\(\):""\)\+/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
