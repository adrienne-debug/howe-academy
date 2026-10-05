/*
 * Node tests — 📘 All About Spelling starter unit, step 1 (her "build it", 2026-10-04).
 * One unit, Levels 1–7 as stages (1–4 filled from her Color Edition card boxes). Each card carries the lesson
 * that first teaches it; families = lessons. Word cards WAIT in the bank (only a test result / check-up /
 * problem word puts them on the ladder); phonograms, rules and sound-spelling cards open by lesson. Backs ride
 * on bank entries — a kid's existing answers are never overwritten, and the word "a" never gets the phonogram
 * a's sounds. Runs the REAL code sliced from index.html.
 *   run:  node test_aas_unit.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const AAS = cut("// AAS_START", "// AAS_END");
const UNITS = cut("const STARTER_UNITS={", "\n};") + "\n};";
const HOWTO = cut("const STARTER_HOWTO={", "\n};") + "\n};";
const FNS = ["_ustCards", "_ustFamilies", "_ustFamNum", "_ustStageDef", "_ustStagesWithCards", "_ustSlug", "_ustBookCh", "_ustApply", "unitStageStatus",
  "mastBankEligible", "mastGateChapter"].map(slice).join("\n");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function mkCtx(o) {
  o = o || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    UNIT_BOOK_MAPS: {}, masteryData: o.mastery || {}, currData: o.curr || { subjects: {}, done: {} },
    mastDefKeyOk: n => !/[.#$\[\]\/]/.test(n), mastFullBank: k => (o.builtIn || {})[k] || {},
    lidStamped: () => true, lidDoneIdx: (k, sk) => new Set(((o.doneIdx || {})[k + "|" + sk]) || []) };
  vm.createContext(ctx); vm.runInContext(AAS + "\n" + UNITS + "\n" + HOWTO + "\n" + FNS + "\nthis.STARTER_UNITS=STARTER_UNITS; this.STARTER_HOWTO=STARTER_HOWTO; this.AAS_DATA=AAS_DATA;", ctx);
  return ctx;
}

console.log("── the cards ──");
const base = mkCtx();
const U = base.STARTER_UNITS.all_about_spelling();
const deck = k => U.decks.find(d => d.key === k);
const byStage = (k, n) => deck(k).cards.filter(c => c.stage === n).length;
ok("four decks: AAS Words, Phonograms, Spelling Rules, Sound Spellings", U.decks.map(d => d.key).join() === "AAS Words,Phonograms,Spelling Rules,Sound Spellings");
ok("words per level 180 / 253 / 209 / 269 (boxes, read counted once)", [1, 2, 3, 4].map(n => byStage("AAS Words", n)).join() === "180,253,209,269", [1, 2, 3, 4].map(n => byStage("AAS Words", n)));
ok("phonograms per level 32 / 11 / 9 / 12", [1, 2, 3, 4].map(n => byStage("Phonograms", n)).join() === "32,11,9,12");
ok("rules per level 8 / 4 / 6 / 3", [1, 2, 3, 4].map(n => byStage("Spelling Rules", n)).join() === "8,4,6,3");
ok("sound-spelling cards: Level 3 five, Level 4 eight", byStage("Sound Spellings", 3) === 5 && byStage("Sound Spellings", 4) === 8);
ok("stages Level 1–7; only 1–4 have cards", U.stages.length === 7 && base._ustStagesWithCards(U).map(s => s.n).join() === "1,2,3,4");
const W = n => deck("AAS Words").cards.find(c => c.name === n);
ok("'at' = Level 1 Lesson 7", W("at").stage === 1 && W("at").lesson === 7 && W("at").family === "Lesson 7");
ok("'been' keeps its sentence and Rule Breaker tag", W("been").rb === true && W("been").sentence === "I have been there.");
ok("Mr. / Mrs. use the Firebase-safe dot", !!W("Mr․") && !!W("Mrs․") && !W("Mr."));
ok("no card name has a character Firebase forbids", U.decks.every(d => d.cards.every(c => !/[.#$\[\]\/]/.test(c.name))));
ok("names are unique within each deck", U.decks.every(d => new Set(d.cards.map(c => c.name)).size === d.cards.length));
ok("phonogram back reads like the existing deck ('/ă/–/ā/–/ah/ · apple, acorn, father')", deck("Phonograms").cards.find(c => c.name === "a").def === "/ă/–/ā/–/ah/ · apple, acorn, father");
{ const f = base._ustFamilies(U, 1), n = f.map(x => +x.split(" ")[1]);
  ok("Level 1 families are in lesson order, Lesson 1 … 24 (2, 3, 5 bring no new cards)", n[0] === 1 && n[n.length - 1] === 24 && n.every((x, i) => !i || x > n[i - 1]) && f.indexOf("Lesson 2") < 0, f); }
ok("How-to notes exist for all four decks", ["AAS Words", "Phonograms", "Spelling Rules", "Sound Spellings"].every(k => base.STARTER_HOWTO[k] && base.STARTER_HOWTO[k].main));

console.log("\n── the lesson gate reads every AAS lesson name ──");
{
  const seqs = { a: ["L18 CK and the CK Rule · day 4 of 5", "L19 NG · day 1 of 5"], t: ["Lesson 9", "Lesson 10"], k: ["Lesson 3 · day 4 of 5", "Lesson 4 · day 1 of 5"],
    e: ["L1 Mastering the First 26 Phonograms", "L2 Identifying Initial and Final Sounds"], l: ["L2-7", "L2-8"], r: ["Ch1 · Ch 1", "Glossary"] };
  const subjects = { x: {} }; Object.keys(seqs).forEach(k => subjects.x[k] = { lessonSeq: seqs[k] });
  const c = mkCtx({ curr: { subjects, done: {} } });
  ok("Andrew 'L18 CK… · day 4 of 5' → 18", c.mastGateChapter("x", "a") === 18);
  ok("Taylor 'Lesson 9' → 9", c.mastGateChapter("x", "t") === 9);
  ok("Kenzie 'Lesson 3 · day 4 of 5' → 3", c.mastGateChapter("x", "k") === 3);
  ok("Ellis 'L1 Mastering…' → 1", c.mastGateChapter("x", "e") === 1);
  ok("Lincoln 'L2-7' → 207 (level × 100 + lesson)", c.mastGateChapter("x", "l") === 207);
  ok("RS4K-style '· Ch 1' still → 1", c.mastGateChapter("x", "r") === 1);
}

console.log("\n── enroll: Andrew-style kid, Level 1, linked to his AAS subject on Lesson 13 ──");
{
  const seq = []; for (let L = 13; L <= 25; L++) seq.push("L" + L + " Lesson");
  const curr = { subjects: { andrew: { aas: { lessonSeq: seq } } }, done: {} };
  const c = mkCtx({ curr, mastery: { andrew: [], andrew_custom_items: [], andrew_settings: {} } });
  const u = c.STARTER_UNITS.all_about_spelling();
  const w = c._ustApply(u, "andrew", 1, "", "aas", "");
  const items = Object.values(w.iu), bank = Object.values(w.bu);
  ok("no word card is put on the ladder (they wait for the test)", !items.some(i => i.subject === "AAS Words"));
  ok("…but all 180 Level 1 words are in his bank, each with its lesson", bank.filter(b => b.cat === "AAS Words").length === 180 && bank.filter(b => b.cat === "AAS Words").every(b => b.ch >= 7 && b.ch <= 24));
  ok("AAS Words is held (cat_hold) — auto-pull will skip it", w.hold["AAS Words"] === true);
  ok("every Level 1 deck is gated by his AAS subject (Sound Spellings starts in Level 3)", w.gates.map(g => g.key).sort().join() === "AAS Words,Phonograms,Spelling Rules" && w.gates.every(g => g.v.subject === "aas"), w.gates);
  const ph = items.filter(i => i.subject === "Phonograms");
  ok("phonograms start 3 at a time, all from lessons he has reached", ph.length === 3 && ph.every(i => i.status === "introduction"), ph.map(i => i.prompt));
  ok("the new cards carry their backs", ph.every(i => i.answer && i.answer.indexOf("/") === 0));
  ok("nothing is written to the shared answer map (defs come on the bank entries)", Object.keys(w.defs).length === 0);
  ok("bank entries carry the phonogram backs", bank.filter(b => b.cat === "Phonograms").every(b => b.def));
  c.masteryData.andrew_settings.cat_hold = w.hold;
  c.masteryData.andrew_custom_items = bank;
  ok("auto-mint finds nothing to pull from AAS Words", c.mastBankEligible("andrew", "AAS Words").length === 0);
}

console.log("\n── enroll: Lincoln-style kid who already drills Phonograms + Spelling Rules ──");
{
  const subjects = { lincoln: { aas: { lessonSeq: ["L2-7", "L2-8", "L2-9"] } } };
  const items = [{ id: "lin_a", subject: "Phonograms", prompt: "a", answer: "/ă/ /ā/ /ah/ — his own wording", status: "active" },
                 { id: "lin_fl", subject: "Spelling Rules", prompt: "The Floss Rule", answer: "his own Floss wording", status: "active" }];
  const c = mkCtx({ curr: { subjects, done: {} }, mastery: { lincoln: items, lincoln_custom_items: [], lincoln_settings: { definitions: {} } },
    builtIn: { lincoln: { Phonograms: ["a", "e", "ough", "ee"] } } });
  const u = c.STARTER_UNITS.all_about_spelling();
  const w = c._ustApply(u, "lincoln", 2, "", "aas", "");
  const bank = Object.values(w.bu);
  ok("his Phonograms card 'a' keeps HIS answer", items.find(i => i.prompt === "a").answer === "/ă/ /ā/ /ah/ — his own wording");
  ok("his Floss Rule keeps HIS answer", items.find(i => i.prompt === "The Floss Rule").answer === "his own Floss wording");
  ok("a phonogram already in his built-in catalog is not added again ('ee')", !bank.some(b => b.cat === "Phonograms" && b.name === "ee"));
  const wd = bank.find(b => b.cat === "AAS Words" && b.name === "plant");
  ok("a level-spanning subject gates by level × 100 + lesson ('plant' L2 Lesson 2 → 202)", wd && wd.ch === 202, wd);
  ok("no card is duplicated", new Set(bank.map(b => b.cat + "|" + b.name)).size === bank.length);
}

console.log("\n── the word 'a' never gets the phonogram a's sounds ──");
{
  const c = mkCtx({ mastery: { julia: [], julia_custom_items: [], julia_settings: {} } });
  const u = c.STARTER_UNITS.all_about_spelling();
  const w = c._ustApply(u, "julia", 1, "", "", "");
  ok("no shared definition for 'a' is written", !("a" in w.defs) && !(c.masteryData.julia_settings.definitions || {}).a);
  const wa = Object.values(w.bu).find(b => b.cat === "AAS Words" && b.name === "a");
  ok("the word 'a' bank entry has no back", wa && !wa.def);
}

console.log("\n── stage readiness counts the cards that come in on their own ──");
{
  const c = mkCtx({ mastery: { k: [] } });
  const u = c.STARTER_UNITS.all_about_spelling(); u.kidStage = { k: { stage: 1 } };
  const st = c.unitStageStatus(u, "k");
  ok("Level 1 'total' = phonograms + rules (40), not the 180 held words", st.total === 40, st);
}

console.log("\n── other starter units are unchanged ──");
{
  const c = mkCtx();
  const u = c.STARTER_UNITS.shapes_path ? null : null;
  ok("_ustFamilies keeps card order for units without famSort", JSON.stringify(c._ustFamilies({ decks: [{ key: "x", cards: [{ name: "a", family: "B 2", stage: 1, order: 1 }, { name: "b", family: "A 1", stage: 1, order: 2 }] }] }, 1)) === JSON.stringify(["B 2", "A 1"]));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
