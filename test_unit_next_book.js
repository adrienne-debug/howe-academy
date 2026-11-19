// 📘 UNITNEXTBOOK — her ask 2026-11-19: "i would like it to link up with the lessons for the spelling test and it should
// recognize new book new level in the units" (design approved the same day: ONE Mom tap to start the next level; practice
// and test settings carry over; not automatic). Runs the real STARTER_UNITS block (UNIT_STAGES + AAS + UNITMOVEBOOK +
// UNITNEXTBOOK) with the real lesson gate and the real spelling test / practice functions over made-up kids:
//  · wren — Stage 1 on "spell_one" (25 lessons, every one done by the done record), a new "spell_two" (L2-1 … L2-31) added;
//  · tad  — Stage 1 on "spell_one", book not finished;
//  · bo   — Stage 1 with NO book link.
// Checks: the offer shows only when the linked book is done (done record, not cards), the kid has a next stage and exactly
// one other subject is the next level's book (by its lesson names, or by key/name stem + number); never a linked book, a
// paused or finished one; Mom-only; the tap = Which book? → Start with that book; the test and practice follow the new
// book; and every ➡ keeps the kid's practice / testRight / path / notebook / check-up settings.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);
const nb0 = block.indexOf("// UNITNEXTBOOK_START"), nb1 = block.indexOf("// UNITNEXTBOOK_END");
ok("UNITNEXTBOOK sits inside the STARTER_UNITS block", nb0 > 0 && nb1 > nb0);
ok("the kid's row draws the offer (tagged line)", /h\+=unitNextBookHtml\(u,k,btn,esc,subjName\);\s+\/\/ UNITNEXTBOOK/.test(block));
ok("the move-up's record keeps the kid's settings (tagged line)", /const rec=Object\.assign\(_unbKeep\(ks\),\{stage:st\.next\.n,[^\n]*\/\/ UNITNEXTBOOK/.test(block));
const FNS = ["mastGateChapter", "mastBankEligible", "mastFullBank", "lidStamped", "lidDoneSet", "lidDoneIdx", "lidsFor",
  "stEnroll", "stPath", "stParseLesson", "stIsLessonDay", "stWords", "stTarget", "stLessonTest", "prLastTaught", "prCardInfo", "stRightTier",
  "_stRevHash", "_stRevShuffle", "stReviewPool", "stReviewWords", "stReviewDayIdx"].map(slice).join("\n");

const L1 = ["L1 Sounds", "L2 Sounds again"].concat(Array.from({ length: 23 }, (_, i) => "L" + (i + 3) + " Lesson " + (i + 3)));   // AAS-1 style
const L2 = Array.from({ length: 31 }, (_, i) => "L2-" + (i + 1));
const LES = n => Array.from({ length: n }, (_, i) => "Lesson " + (i + 1));
let idn = 0;
const book = (display, seq, more) => Object.assign({ display, lessonSeq: seq.slice(), lessonIds: seq.map(() => "X" + (idn++)), doneImportedAt: "2026-10-01" }, more || {});
const doneOf = (bk, n) => { const o = {}; bk.lessonIds.slice(0, n).forEach(id => o[id] = { src: "check" }); return o; };

function world(o) {
  o = o || {};
  const G = { masteryData: {}, currData: o.curr, writes: [], dry: false, mom: true, unitStudies: {}, content: {}, confirms: [], week: { tasks: [] } };
  const db = { ref(p) { const r = m => v => G.writes.push([m, p, v === undefined ? null : JSON.parse(JSON.stringify(v))]); return { update: r("update"), set: r("set"), remove: r("remove"), transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; const MAST_BANK_MAP={}; let masteryKid=null;
    const weekData=G.week; const ST_DECK="AAS Words", ST_REVIEW_LISTS=5, ST_REVIEW_PER_DAY=10, ST_RIGHT_DEFAULT="monthly";
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function confirm(m){ G.confirms.push(m); return true; }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); }
    ${FNS}
    ${block}
    return { STARTER_UNITS, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp, _ustApply,
      unitMoveBookSet, unitMoveBookGo, _unitStageRowsHtml, mastGateChapter, unitNextBook, unitNextBookGo, _unbStem,
      stLessonTest, prCardInfo, stRightTier, get moveForm(){ return unitMoveForm; } };`)(G, db);
  api.G = G;
  ["all_about_spelling", "math_fluency_path"].forEach(id => { const u = api.STARTER_UNITS[id](); G.unitStudies[u.id] = u; });
  api.u = G.unitStudies.all_about_spelling; return api;
}
// Settings Mom set on the Units row (path pill, practice card, ✓ goes to, notebook options, check-up line)
const SETTINGS = { practice: "word_practice", testRight: "graduated", path: "first", nbWords: "missed", nbPractice: true, checkup: "checkup_x_1" };
function base(o) {
  o = o || {};
  const one = book("Spelling One", L1), two = book("Spelling Two", L2), tadOne = book("Spelling One", L1);
  const curr = { subjects: { wren: Object.assign({ spell_one: one, spell_two: two, word_practice: { display: "Word Practice" }, piano: { display: "Piano", lessonSeq: LES(10), lessonIds: LES(10).map((_, i) => "P" + i), doneImportedAt: "2026-10-01" } }, o.extra || {}),
    tad: { spell_one: tadOne, spell_two: book("Spelling Two", L2) }, bo: { spell_one: book("Spelling One", L1) } },
    done: { wren: { spell_one: doneOf(one, 25) }, tad: { spell_one: doneOf(tadOne, 24) }, bo: {} } };
  if (o.curr) o.curr(curr);
  const w = world({ curr });
  w.G.dry = true;   // enroll in memory only, then measure the tap's own writes
  const enroll = (kid, subject) => { w.unitStageFormOpen("all_about_spelling", kid); w.unitStageFormSet("stage", "1"); if (subject) w.unitStageFormSet("subject", subject); w.unitStageEnroll(); };
  enroll("wren", "spell_one"); enroll("tad", "spell_one"); enroll("bo", "");
  Object.assign(w.u.kidStage.wren, SETTINGS, { knows: "L5 Lesson 5" }); Object.assign(w.u.kidStage.bo, SETTINGS);
  w.u.decks.filter(d => !d.bankOnly).forEach(d => d.cards.filter(c => c.stage === 1).forEach(c => {   // wren: Level 1 learned → ready
    const it = w.G.masteryData.wren.find(i => i.subject === d.key && i.prompt === c.name);
    if (it) Object.assign(it, { status: "active", tier: "weekly" }); else w.G.masteryData.wren.push({ id: "wr_" + c.name, subject: d.key, prompt: c.name, status: "active", tier: "weekly" }); }));
  w.G.dry = false; w.G.writes.length = 0; return w;
}
const snap = w => JSON.stringify([w.G.masteryData, w.u.kidStage]);
const ksRec = (w, kid) => w.G.writes.find(x => x[1] === "unitStudies/all_about_spelling/kidStage/" + (kid || "wren"));
const offer = (w, kid) => { const r = w.unitNextBook(w.u, kid || "wren"); return r ? r.sk : null; };
const strip = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

console.log("── the offer ──");
{ const w = base();
  ok("wren: book one done, next stage, one Level 2 book → offer spell_two", offer(w) === "spell_two");
  const h = w._unitStageRowsHtml(w.u, ["wren", "tad", "bo"]);
  ok("Mom sees the line in plain words", /Wren finished Spelling One\. Spelling Two is on the schedule — ➡ Start Level 2 with it/.test(strip(h)), strip(h).slice(0, 400));
  ok("exactly one offer button on the page, and it is wren's", (h.match(/unitNextBookGo\(/g) || []).length === 1 && /unitNextBookGo\('all_about_spelling','wren'\)/.test(h));
  ok("tad (one lesson left in book one) → no offer", offer(w, "tad") === null);
  ok("bo (no book linked) → no offer", offer(w, "bo") === null);
  ok("➡ Start Stage 2 stays on the row next to it", /unitStageMoveUp\('all_about_spelling','wren'\)/.test(h));
  w.G.mom = false;
  ok("not Mom (a kid's device): no line, no button", !/unitNextBookGo|finished Spelling/.test(w._unitStageRowsHtml(w.u, ["wren"])));
  w.G.mom = true; w.unitStageMoveUp("all_about_spelling", "wren");
  ok("while Which book? is open, the offer steps aside", /Which book\?/.test(w._unitStageRowsHtml(w.u, ["wren"])) && !/unitNextBookGo/.test(w._unitStageRowsHtml(w.u, ["wren"]))); }

console.log("\n── finished = the done record ──");
{ const w = base({ curr: c => { c.done.wren.spell_one = doneOf(c.subjects.wren.spell_one, 24); } });
  ok("one lesson of book one not done → no offer (even though every Level 1 card is learned)", w.unitStageStatus(w.u, "wren").ready && offer(w) === null); }
{ const w = base({ curr: c => { delete c.subjects.wren.spell_one.doneImportedAt; } });
  ok("book one has no done record (unstamped) → no offer", offer(w) === null); }

console.log("\n── which book is the next one ──");
{ const w = base({ curr: c => { c.subjects.wren.spell_two.lessonSeq = L2.map(t => t.replace("L2-", "L3-")); } });
  ok("its lessons name Level 3 → not the Level 2 book → no offer", offer(w) === null); }
{ const w = base({ extra: { spell_review: book("Spelling Review", L2) } });
  ok("two books whose lessons are Level 2 → no offer", offer(w) === null); }
{ const w = base({ curr: c => { c.subjects.wren.spell_two.paused = true; } });
  ok("the Level 2 book is paused → no offer", offer(w) === null); }
{ const w = base({ curr: c => { c.done.wren.spell_two = doneOf(c.subjects.wren.spell_two, 31); } });
  ok("the Level 2 book is already finished too → no offer", offer(w) === null); }
{ const w = base(); w.G.unitStudies.math_fluency_path.kidStage = { wren: { stage: 1, subject: "spell_two" } };
  ok("a book already linked (to any unit) is never offered", offer(w) === null); }
{ const w = base({ curr: c => { const s = c.subjects.wren; s.spelling_1 = s.spell_one; s.spelling_2 = book("Spelling 2", LES(31)); delete s.spell_one; delete s.spell_two;
    c.done.wren = { spelling_1: c.done.wren.spell_one }; c.subjects.tad = {}; c.subjects.bo = {}; } });
  // the enroll above linked spell_one; relink to the renamed key
  w.u.kidStage.wren.subject = "spelling_1";
  ok("lessons with no level (Lesson N): key stem + next number (spelling_1 → spelling_2) → offer", offer(w) === "spelling_2"); }
{ const w = base({ curr: c => { const s = c.subjects.wren; s.spell_two = book("Spelling 3", LES(31)); } });
  ok("lessons with no level and a name for another level (Spelling 3) → no offer", offer(w) === null); }
{ const w = base({ curr: c => { const s = c.subjects.wren; s.spell_one.display = "AAS 1"; s.spell_two = book("AAS 2", LES(31)); } });
  ok("lessons with no level: display name AAS 1 → AAS 2 → offer", offer(w) === "spell_two"); }
{ const w = base({ curr: c => { c.subjects.wren.spell_two = book("Piano 2", LES(31)); } });
  ok("a level-2 book of something else (Piano 2) → no offer", offer(w) === null); }
{ const w = base();
  ok("_unbStem reads key and name alike", JSON.stringify([w._unbStem("all_about_spelling_2"), w._unbStem("All About Spelling 2"), w._unbStem("AAS 4"), w._unbStem("Spelling"), w._unbStem("4")])
    === JSON.stringify([{ stem: "all about spelling", n: 2 }, { stem: "all about spelling", n: 2 }, { stem: "aas", n: 4 }, null, null])); }
{ const w = base(); const u = w.u; const top = Math.max(...u.decks.flatMap(d => d.cards.map(c => c.stage || 0)));
  w.u.kidStage.wren.stage = top;
  ok("no next stage → no offer", !w.unitStageStatus(u, "wren").next && offer(w) === null); }

console.log("\n── the tap ──");
{ const w = base(), w2 = base();
  const before = JSON.parse(JSON.stringify(w.u.kidStage.wren));
  w.unitNextBookGo("all_about_spelling", "wren");
  w2.unitStageMoveUp("all_about_spelling", "wren"); w2.unitMoveBookSet("spell_two"); w2.unitMoveBookGo();
  const r = ksRec(w);
  ok("saved record: Stage 2 on spell_two, from Stage 1, knows reset", r && r[0] === "set" && r[2].stage === 2 && r[2].subject === "spell_two" && r[2].from === 1 && r[2].knows === "", r && r[2]);
  ok("the settings ride along unchanged", !!r && Object.keys(SETTINGS).every(k => JSON.stringify(r[2][k]) === JSON.stringify(before[k])), r && r[2]);
  ok("in memory too", w.u.kidStage.wren.subject === "spell_two" && Object.keys(SETTINGS).every(k => JSON.stringify(w.u.kidStage.wren[k]) === JSON.stringify(SETTINGS[k])));
  const norm = ws => JSON.stringify(ws.map(x => /kidStage\//.test(x[1]) ? [x[0], x[1], Object.assign({}, x[2], { ts: 0 })] : x));
  ok("same writes as ➡ → Which book? → spell_two → Start", norm(w.G.writes) === norm(w2.G.writes) && w.G.writes.length > 3);
  ok("same mastery changes too", JSON.stringify(w.G.masteryData) === JSON.stringify(w2.G.masteryData));
  ok("every deck's gate now reads spell_two", w.G.writes.filter(x => /cat_gate\//.test(x[1])).every(x => x[2].subject === "spell_two"));
  ok("✓ on the test still lands at the kid's own pick", w.stRightTier("wren") === "graduated");
  ok("the offer is gone after the tap", offer(w) === null && !/unitNextBookGo/.test(w._unitStageRowsHtml(w.u, ["wren"]))); }
{ const w = base(); w.G.currData.done.wren.spell_one = {};
  const before = snap(w); w.unitNextBookGo("all_about_spelling", "wren");
  ok("the tap re-checks: book one no longer done (old page) → nothing happens", w.G.writes.length === 0 && snap(w) === before); }
{ const w = base(); w.G.mom = false; const before = snap(w); w.unitNextBookGo("all_about_spelling", "wren");
  ok("not Mom → the tap does nothing", w.G.writes.length === 0 && snap(w) === before); }
{ const w = base(); w.G.dry = true; w.unitNextBookGo("all_about_spelling", "wren");
  ok("dry run → nothing written (memory moves, as every ➡ does)", w.G.writes.length === 0 && w.u.kidStage.wren.subject === "spell_two"); }
{ const w = base(); w.G.currData.done.tad.spell_one = doneOf(w.G.currData.subjects.tad.spell_one, 25);
  ok("tad: book finished but not ready on the ladder → offer shows", offer(w, "tad") === "spell_two");
  w.unitNextBookGo("all_about_spelling", "tad");
  ok("…and the tap asks the same isn't-ready question first", w.G.confirms.length === 1 && /isn’t ready yet/.test(w.G.confirms[0]) && w.u.kidStage.tad.subject === "spell_two"); }

console.log("\n── test + practice follow the new book ──");
{ const w = base();
  const card = (n, sk) => ({ id: "c" + n, who: "wren", subjectKey: sk || "spell_two", day: "wednesday", title: "Spelling Two — L2-" + n });
  ok("before the tap: a Level 2 lesson card gets no spelling test", w.stLessonTest(card(3)) === null);
  w.unitNextBookGo("all_about_spelling", "wren"); w.u.kidStage.wren.path = "week";
  const t3 = w.stLessonTest(card(3));
  ok("after: L2-3 card (Practice Week) tests Level 2 Lesson 2's words", t3 && t3.tg.level === 2 && t3.tg.lesson === 2 && t3.tg.words.length > 0, t3 && t3.tg.key);
  w.G.week.tasks = [card(3), { id: "p", who: "wren", subjectKey: "word_practice", day: "friday", title: "Word Practice" }];
  const pr = w.prCardInfo(w.G.week.tasks[1], true);
  ok("the practice card (kept setting) shows Level 2 Lesson 3's words", pr && pr.level === 2 && pr.lesson === 3 && pr.words.length > 0, pr && [pr.level, pr.lesson]); }

console.log("\n── every ➡ keeps the settings ──");
{ const w = base(); w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookGo();   // Which book? → same book
  const r = ksRec(w);
  ok("Which book? → same book: settings kept, stage 2, knows reset", r && r[2].stage === 2 && r[2].subject === "spell_one" && r[2].knows === "" && Object.keys(SETTINGS).every(k => JSON.stringify(r[2][k]) === JSON.stringify(SETTINGS[k])), r && r[2]); }
{ const w = base(); w.unitStageMoveUp("all_about_spelling", "bo");   // no book → ➡ moves at once
  const r = ksRec(w, "bo");
  ok("no book link (➡ at once): settings kept", r && r[2].stage === 2 && Object.keys(SETTINGS).every(k => JSON.stringify(r[2][k]) === JSON.stringify(SETTINGS[k])), r && r[2]); }
{ const w = base(); w.u.kidStage.wren.practice = null; w.u.kidStage.wren.from = 0; w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookGo();
  const r = ksRec(w);
  ok("an empty setting isn't written as null; the move's own from wins", r && !("practice" in r[2]) && r[2].from === 1); }
{ const w = base(); w.u.kidStage.wren = { stage: 1, knows: "", subject: "spell_one", map: "", ts: 1 }; w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookGo();
  ok("a record with no settings saves exactly today's fields", JSON.stringify(Object.keys(ksRec(w)[2])) === JSON.stringify(["stage", "knows", "subject", "map", "ts", "from"])); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
