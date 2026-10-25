/*
 * Node tests — 🏛 Word Roots step 4: hook up Lincoln (WRATTACH block; her decisions 2026-10-24, design §3.2 / §4.3 / PR 4).
 * He works the Beginning book from Lesson 1, gated like Ellis ("after he checks it off"), no check-up.
 *   · his 4 cards (chron, morph, bene, mal) are byte-identical — nothing under mastery/lincoln is written;
 *   · his built-in roots ("uni", "log/logy" …) become the unit's spellings (uni-, -ology …) and the built-in line stops
 *     counting for him once he's hooked up, so no root is offered twice; before that nothing changes;
 *   · book prefixes land on their Beginning lessons, poly- on Level 3, his other More roots open now (1 per 3), omni kept;
 *   · with Lesson 1 not checked off, no book root can start; L1 + L1b checked → Lesson 1's roots open;
 *   · refuses with no subject / unstamped; dry run writes nothing; Ellis's hook-up is unchanged.
 * Synthetic subject shaped like the one she's adding (word_roots, L1 L1b … L24 L24b + 7 Review); a live read-only
 * snapshot is replayed by test_word_roots_attach.js-style fixtures when present.   run: node test_word_roots_attach_lincoln.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const D = "Greek & Latin Roots";
const FXP = path.join(__dirname, "test_fixtures", "word_roots_lincoln_2026-10-24.json");
const FX = fs.existsSync(FXP) ? JSON.parse(fs.readFileSync(FXP, "utf8")) : null;
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const LINCOLN_CODE = JSON.parse(/"Greek & Latin Roots":(\["chron","morph"[^\]]*\])/.exec(src)[1]);
const ELLIS_CODE = JSON.parse(/"Greek & Latin Roots":(\["bio","geo"[^\]]*\])/.exec(src)[1]);

// Synthetic Lincoln (until the live snapshot): his 4 live cards + other decks, no saved roots.
const SEQ = []; for (let l = 1; l <= 24; l++) SEQ.push("L" + l, "L" + l + "b"); for (let r = 0; r < 7; r++) SEQ.push("Review");
const SYN = { cards: { 166: { id: "lin_chron", subject: D, prompt: "chron", status: "active", tier: "weekly", next_due: 210, answer: "time", review_mode: "flash", tally_dots: 5 },
    167: { id: "lin_morph", subject: D, prompt: "morph", status: "active", tier: "every_other_day", next_due: 205, answer: "form or shape", review_mode: "flash", tally_dots: 5 },
    252: { id: "lin_bene", subject: D, prompt: "bene", status: "active", tier: "every_other_day", next_due: 205, review_mode: "flash", tally_dots: 5 },
    337: { id: "lin_mal", subject: D, prompt: "mal", status: "active", tier: "every_other_day", next_due: 206, review_mode: "flash", tally_dots: 5 } },
  itemsLength: 400, custom: {}, customLength: 120,
  settings: { cat_gate: { "Logic": { subject: "fll" } }, definitions: { a: "/ă/–/ā/–/ah/", "-al": "SHOULD NOT CHANGE" } }, bankOrder: {},
  subject: { display: "Word Roots", doneImportedAt: "2026-10-24T20:00:00.000Z", lessonSeq: SEQ, lessonIds: SEQ.map((_, i) => "L" + String(i + 1).padStart(4, "0")) }, done: {} };

function world(o) {
  o = o || {}; const F = o.fx || SYN;
  const items = new Array(F.itemsLength).fill(null).map((_, i) => F.cards[i] ? JSON.parse(JSON.stringify(F.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i });
  const cust = new Array(F.customLength).fill(null).map((_, i) => F.custom[i] ? JSON.parse(JSON.stringify(F.custom[i])) : { cat: "Other", name: "n" + i });
  const subj = Object.assign(JSON.parse(JSON.stringify(F.subject)), o.unstamped ? { doneImportedAt: null } : {});
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry,
    masteryData: { lincoln: items, lincoln_custom_items: cust, lincoln_settings: JSON.parse(JSON.stringify(F.settings)), lincoln_bank_order: JSON.parse(JSON.stringify(F.bankOrder || {})),
      ellis: [], ellis_custom_items: [], ellis_settings: {} },
    currData: { subjects: { lincoln: o.noSubject ? { fll: { display: "First Language Lessons" } } : { word_roots: subj } }, done: { lincoln: { word_roots: JSON.parse(JSON.stringify(o.done || F.done || {})) } } },
    unitStudies: {} };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "LINCOLN_CODE", "ELLIS_CODE", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="lincoln";
    const MAST_BANK_MAP={lincoln:{"Greek & Latin Roots":LINCOLN_CODE,"Vocabulary":["brave"]},ellis:{"Greek & Latin Roots":ELLIS_CODE}}; ${VOCAB}
    ${GATE}
    ${block}
    if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS,_wrSlashDefs(MAST_VOCAB_DEFS));
    return { STARTER_UNITS, wrGateDone, wrPlanAttach, wrApplyAttach, wrAttachOpen, wrBuiltInRetired, _unitStageRowsHtml, mastBankEligible, mastFullBank, MAST_VOCAB_DEFS,
      unitStageFormOpen, unitStageEnroll, get view(){ return wrAttachView; } };`)(G, db, LINCOLN_CODE, ELLIS_CODE);
  G.unitStudies.word_roots = w.STARTER_UNITS.word_roots();
  if (o.ellisIn) { G.unitStudies.word_roots.enrolled = { ellis: true }; G.unitStudies.word_roots.kidStage = { ellis: { stage: 1, subject: "word_roots" } }; }
  w.G = G; return w;
}
const keysOf = s => String(s).toLowerCase().split(/[\/,]/).map(x => x.replace(/-/g, "").trim()).filter(Boolean);

function suite(label, F) {
  console.log("\n══ " + label + " ══");
  const w = world({ fx: F, ellisIn: true }), P = w.wrPlanAttach("lincoln", 1761300000000);
  const card = {}; w.G.unitStudies.word_roots.decks[0].cards.forEach(c => { card[c.name] = c; });
  const live = Object.values(F.cards).map(c => c.prompt);
  ok("plan is ready, gated on his own subject word_roots (Ellis already hooked up)", P.ok && P.subject === "word_roots", P.why);
  const anyDone = Object.keys(F.done || {}).length;
  if (!anyDone) ok("nothing checked off yet: gate 0 (he's on Lesson 1)", P.gate === 0 && P.onLesson === 1, [P.gate, P.onLesson]);
  console.log("     next 10: " + P.next10.join(", "));
  ok("his 4 cards come first in his order", JSON.stringify(P.order.slice(0, 4).sort()) === JSON.stringify(["bene", "chron", "mal", "morph"]));
  const b2 = {}; P.writes.filter(x => /custom_items\/\d+$/.test(x.path) && x.value).forEach(x => { b2[x.value.name] = x.value; });
  ok("his book prefixes land on their Beginning lessons: uni- 2, bi- 4, inter- 5, trans- 5, pre- 12, sub- 19, -ology 11, phob 1",
    [["uni-", 2], ["bi-", 4], ["inter-", 5], ["trans-", 5], ["pre-", 12], ["sub-", 19], ["-ology", 11], ["phob", 1]].every(([n, l]) => b2[n] && b2[n].ch === l), Object.fromEntries(["uni-", "bi-", "-ology", "phob"].map(n => [n, b2[n]])));
  ok("…labelled as his own roots, respelled (uni → uni-, log/logy → -ology)", P.sum.respelled.indexOf("uni → uni-") >= 0 && P.sum.respelled.indexOf("log/logy → -ology") >= 0 && P.sum.builtInCh.length === 8, P.sum.builtInCh);
  ok("poly → poly-, Level 3 (301)", b2["poly-"] && b2["poly-"].ch === 301 && P.sum.level.join() === "poly-");
  ok("omni is kept as a waiting root, raw, for Our words later", b2.omni && !("ch" in b2.omni) && P.sum.ourWords.join() === "omni" && !b2["omni-"]);
  const more16 = ["neo-", "retro-", "post-", "phil", "path", "anthro", "pseudo-", "mono-", "hyper-", "hypo-", "super-", "arch", "anti-", "circum-", "intra-", "syn-/sym-"];
  ok("his 16 waiting More roots: unit spellings, no gate", P.sum.more.slice().sort().join() === more16.slice().sort().join() && more16.every(n => b2[n] && !("ch" in b2[n])), P.sum.more);
  ok("Ellis's 13 More roots (bio, auto …) are NOT added for him", ["bio", "auto", "macro", "aqua"].every(n => !b2[n]) && P.sum.lincolnMore.length === 13);
  ok("every Beginning root becomes a bank entry with its lesson (99)", w.G.unitStudies.word_roots.decks[0].cards.filter(c => c.stage === 1).every(c => b2[c.name] && b2[c.name].ch === c.lesson));
  ok("no appended entry has a def (no recite cards)", Object.values(b2).every(e => !("def" in e)));
  const paths = P.writes.map(x => x.path);
  ok("never mastery/lincoln (cards), cat_modes, notebookSettings, curriculum, or Ellis", !paths.some(p => /^mastery\/lincoln\//.test(p) || /cat_modes|cat_intro_max|notebookSettings|curriculum|ellis/.test(p)));
  ok("only targeted paths", paths.every(p => /^unitStudies\/word_roots\/(enrolled|kidStage)\/lincoln$/.test(p) || p === "mastery/lincoln_settings/cat_gate/" + D || /^mastery\/lincoln_custom_items\/\d+$/.test(p) || /^mastery\/lincoln_settings\/definitions\/[^\/]+$/.test(p) || p === "mastery/lincoln_bank_order/" + D));
  ok("cat_gate = {subject: word_roots, after: done}", JSON.stringify(P.writes.find(x => /cat_gate/.test(x.path)).value) === JSON.stringify({ subject: "word_roots", after: "done" }));
  ok("backs go only to EMPTY definitions keys (his -al is never replaced)", P.writes.filter(x => /definitions\//.test(x.path)).every(x => !(F.settings.definitions || {})[x.path.split("/").pop()]) && !paths.some(p => /definitions\/-al$/.test(p) && (F.settings.definitions || {})["-al"]));
  ok("respelled names get a back (uni- = one, pre- = before)", ["uni-", "pre-"].every(n => P.writes.some(x => x.path === "mastery/lincoln_settings/definitions/" + n) || (F.settings.definitions || {})[n]));

  const before = JSON.stringify(w.G.masteryData.lincoln);
  ok("before the hook-up his built-in roots line still counts (nothing changes until Yes)", w.mastFullBank("lincoln")[D].indexOf("uni") >= 0 && !w.wrBuiltInRetired("lincoln", D));
  w.wrAttachOpen("lincoln"); w.view.plan = w.wrPlanAttach("lincoln", 1761300000000);
  const r = w.wrApplyAttach(w.view.plan);
  return new Promise(res => setTimeout(() => {
    const up = w.G.writes;
    ok("Yes: ONE multi-path update, exactly the plan", r === true && up.length === 1 && JSON.stringify(Object.keys(up[0][2])) === JSON.stringify(paths));
    ok("his 4 cards are byte-identical", JSON.stringify(w.G.masteryData.lincoln) === before && Object.keys(F.cards).every(i => JSON.stringify(w.G.masteryData.lincoln[i]) === JSON.stringify(F.cards[i])));
    const bank = w.mastFullBank("lincoln")[D];
    ok("after: the old spellings are gone (no 'uni', 'log/logy', 'poly')", ["uni", "bi", "log/logy", "poly", "syn/sym", "neo"].every(n => bank.indexOf(n) < 0));
    { const seen = {}, dup = []; bank.forEach(n => keysOf(n).concat(...((card[n] || {}).aka || []).map(keysOf)).forEach(k => { if (seen[k] && seen[k] !== n && k !== "nom") dup.push([k, seen[k], n]); seen[k] = n; }));
      ok("no root is offered twice in his bank", !dup.length, dup.slice(0, 5)); }
    { const defs = w.G.masteryData.lincoln_settings.definitions || {}, noBack = bank.filter(n => card[n] && !(defs[n] || w.MAST_VOCAB_DEFS[n.toLowerCase()]));
      ok("every unit root in his bank has a back (his definitions or the built-in meanings)", !noBack.length, noBack); }
    ok("his other built-in decks are untouched (Vocabulary)", w.mastFullBank("lincoln").Vocabulary.join() === "brave");
    const elig = () => w.mastBankEligible("lincoln", D).filter(n => live.indexOf(n) < 0);
    if (!anyDone) {
      ok("Lesson 1 not checked off: no book root can start; More roots (and omni) can", elig().every(n => !card[n] || card[n].stage === 6) && elig().indexOf("neo-") >= 0, elig().slice(0, 12));
      ok("…so his next new cards are More roots, in unit order", P.next10[0] === "neo-" && P.next10.every(n => card[n] && card[n].stage === 6), P.next10);
      const ids = F.subject.lessonIds; w.G.currData.done.lincoln.word_roots = { [ids[0]]: { day: "2026-10-26" } };
      ok("L1 checked, L1b not: Lesson 1 still waits", elig().indexOf("phob") < 0 && elig().indexOf("micro") < 0);
      w.G.currData.done.lincoln.word_roots = { [ids[0]]: { day: "2026-10-26" }, [ids[1]]: { day: "2026-10-27" } };
      ok("L1 + L1b checked: Lesson 1's roots open (micro, phob …); Lesson 2's still wait", ["micro", "scope", "phob", "-ia"].every(n => elig().indexOf(n) >= 0) && elig().indexOf("uni-") < 0);
      ok("…first new book card is micro, and More roots stay 1 in every 4", elig()[0] === "micro" && elig().slice(0, 8).map(n => card[n] && card[n].stage === 6 ? "M" : "B").join("") === "BBBMBBBM", elig().slice(0, 8));
    }
    ok("second tap refuses: already hooked up", /already/.test(w.wrPlanAttach("lincoln").why));
    res();
  }, 0));
}

(async () => {
  await suite("synthetic subject (L1 … L24b + 7 Review, nothing done)", SYN);
  if (FX) await suite("live read-only snapshot " + (FX._about || ""), FX);
  else console.log("\n  (no live Lincoln snapshot yet — test_fixtures/word_roots_lincoln_2026-10-24.json)");

  console.log("\n══ refusals, dry run, the page ══");
  ok("no Word Roots subject (his data before she adds it): refuses, writes nothing", (p => !p.ok && /no Word Roots subject/.test(p.why) && !p.writes.length)(world({ noSubject: true }).wrPlanAttach("lincoln")));
  ok("subject not stamped: refuses (unstamped = every root at once)", (p => !p.ok && /stamped/.test(p.why) && !p.writes.length)(world({ unstamped: true }).wrPlanAttach("lincoln")));
  { const d = world({ dry: true }); d.wrAttachOpen("lincoln"); const r = d.wrApplyAttach(d.view.plan);
    ok("?dryrun=1: Yes writes nothing, changes nothing", r === false && d.G.writes.length === 0 && !d.G.unitStudies.word_roots.enrolled && !d.wrBuiltInRetired("lincoln", D)); }
  { const d = world(); d.G.mom = false; ok("not Mom: no plan view, nothing written", (d.wrAttachOpen("lincoln"), d.view === null) && d.G.writes.length === 0); }
  { const d = world(), roster = ["lincoln", "ellis", "lucy", "julian"], u = d.G.unitStudies.word_roots;
    const h = d._unitStageRowsHtml(u, roster);
    ok("the page: Hook up Lincoln (and Ellis); Lucy and Julian 'not hooked up yet'; no stock + kid button", /wrAttachOpen\('lincoln'\)/.test(h) && (h.match(/not hooked up yet/g) || []).length === 2 && h.indexOf("unitStageFormOpen(") < 0);
    d.wrAttachOpen("lincoln"); const h2 = d._unitStageRowsHtml(u, roster);
    ok("his plan in plain words: 4 cards stay, no lesson checked off yet, old spellings replaced", /4 root cards stay exactly as they are/.test(h2) && /hasn’t checked off a Word Roots lesson yet/.test(h2) && /spelled the unit’s way/.test(h2) && d.G.writes.length === 0, h2.slice(0, 1500));
    d.unitStageFormOpen("word_roots", "lincoln"); d.unitStageEnroll(); ok("Lincoln's stock + kid enroll stays blocked", d.G.writes.length === 0); }
  ok("Ellis is never retired (his names already match)", !world({ ellisIn: true }).wrBuiltInRetired("ellis", D));
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
