/*
 * Node tests — 🏛 Word Roots step 3: hook up Ellis (WRATTACH block; her ask 2026-10-24: "Yes, start Word Roots step 3
 * (attach Ellis) on a branch. Show me the plan in the dry run before anything writes."). Design §4 + §6 PR 3, §7 wins.
 * Replays the read-only snapshot of his Greek & Latin Roots data (test_fixtures/word_roots_ellis_2026-10-24.json):
 *   · his 13 live cards are byte-identical after the attach — nothing under mastery/ellis is ever written;
 *   · his next new card is meter; only lessons up to the one he's on can start; More roots open now, 1 per 3;
 *   · the write list is exactly the plan (targeted paths only); dry run and non-Mom write nothing;
 *   · refuses with no unit / no subject / unstamped subject; Lincoln is still blocked.
 * Runs the real STARTER_UNITS block + the real gate functions sliced from index.html.   run: node test_word_roots_attach.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "word_roots_ellis_2026-10-24.json"), "utf8"));
const D = "Greek & Latin Roots";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));   // the whole multi-line list
const ELLIS_CODE = JSON.parse(/"Greek & Latin Roots":(\["bio","geo"[^\]]*\])/.exec(src)[1]);

function world(o) {
  o = o || {};
  const items = new Array(FX.itemsLength).fill(null).map((_, i) => FX.cards[i] ? JSON.parse(JSON.stringify(FX.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i });
  const cust = new Array(FX.customLength).fill(null).map((_, i) => FX.custom[i] ? JSON.parse(JSON.stringify(FX.custom[i])) : { cat: "Other", name: "n" + i });
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry,
    masteryData: { ellis: items, ellis_custom_items: cust, ellis_settings: JSON.parse(JSON.stringify(FX.settings)), ellis_bank_order: JSON.parse(JSON.stringify(FX.bankOrder)) },
    currData: { subjects: { ellis: o.noSubject ? {} : { word_roots: Object.assign(JSON.parse(JSON.stringify(FX.subject)), o.unstamped ? { doneImportedAt: null } : {}) } }, done: { ellis: { word_roots: FX.done } } },
    unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "ELLIS_CODE", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="ellis";
    const MAST_BANK_MAP={ellis:{"Greek & Latin Roots":ELLIS_CODE}}; ${VOCAB}
    ${GATE}
    ${block}
    if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS,_wrSlashDefs(MAST_VOCAB_DEFS));
    return { STARTER_UNITS, wrGateDone, wrPlanAttach, wrApplyAttach, wrAttachOpen, wrAttachHtml, _unitStageRowsHtml, mastBankEligible, mastFullBank, mastGateChapter, MAST_VOCAB_DEFS,
      unitStageFormOpen, unitStageEnroll, get view(){ return wrAttachView; } };`)(G, db, ELLIS_CODE);
  if (!o.noUnit) G.unitStudies.word_roots = w.STARTER_UNITS.word_roots();
  w.G = G; return w;
}

console.log("── the plan on his 10/24 data ──");
const w = world(), P = w.wrPlanAttach("ellis", 1761300000000);
ok("plan is ready for Ellis, gated on his own subject word_roots", P.ok && P.subject === "word_roots", P.why);
ok("he is ON Lesson 21 (next line L21b), but has checked off only through Lesson 20 — her rule: roots open after the lesson is checked off", P.onLesson === 21 && P.gate === 20 && FX.subject.lessonSeq[Object.keys(FX.done).length] === "L21b");
ok("next new card is meter", P.next10[0] === "meter", P.next10);
console.log("     next 10: " + P.next10.join(", "));
const card = {}; w.G.unitStudies.word_roots.decks[0].cards.forEach(c => { card[c.name] = c; });
ok("…and every 4th new card is a More root (3 book roots : 1)", P.next10.map(n => card[n].stage === 6 ? "M" : "B").join("") === "BBBMBBBMBB", P.next10.map(n => card[n].stage));
ok("his list order starts with his 13 cards, as she sorted them", JSON.stringify(P.order.slice(0, 13)) === JSON.stringify(FX.bankOrder[D].slice(0, 13)));
const live = Object.values(FX.cards).map(c => c.prompt);
ok("every name in the order is in his bank once", new Set(P.order).size === P.order.length);
const lessonOf = n => card[n] && card[n].stage !== 6 ? card[n].lesson : null;
ok("only roots from lessons ≤ 20 (or More roots / Our words, no gate) can start now", P.openNow.every(n => lessonOf(n) == null || lessonOf(n) <= 20), P.openNow.filter(n => lessonOf(n) > 20));
ok("Lesson 21 (half done), 22–24 and the Level roots wait", P.held.length && P.held.every(n => lessonOf(n) > 20) && ["viv/vive", "-acious", "-fy", "vert/vers", "cline", "stat", "il-", "a-", "poly-", "capt"].every(n => P.held.indexOf(n) >= 0), P.held);
ok("his 13 More roots are all open now", ["bio", "auto", "macro", "photo", "vis/vid", "mit/miss", "ject", "duct", "spect", "form", "cred", "aqua", "terra"].every(n => P.openNow.indexOf(n) >= 0));
ok("ir-, omni- and the number prefixes are kept as waiting roots, untouched", JSON.stringify(P.sum.ourWords) === JSON.stringify(["ir-", "-quadra", "penta-", "hexa-", "hepta-", "oct-", "novem-", "deca-", "omni-"]) && !P.writes.some(x => /custom_items\/\d+/.test(x.path) && ["ir-", "omni-", "-quadra", "penta-", "hexa-", "hepta-", "oct-", "novem-", "deca-"].indexOf(FX.custom[x.path.split("/")[2]] && FX.custom[x.path.split("/")[2]].name) >= 0));
ok("active is removed (one targeted remove)", P.sum.dropped.join() === "active" && P.writes.filter(x => x.value === null && /custom_items\/\d+$/.test(x.path)).length === 1);
ok("Lincoln's 20 More roots are NOT added to Ellis (listed for her call)", P.sum.lincolnMore.length === 20 && P.sum.lincolnMore.indexOf("chron") >= 0 && !P.order.includes("chron"));

console.log("\n── the write list ──");
const paths = P.writes.map(x => x.path);
ok("every write is a targeted path (no whole-node set)", paths.every(p => /^unitStudies\/word_roots\/(enrolled|kidStage)\/ellis$/.test(p) || /^mastery\/ellis_settings\/cat_gate\/Greek & Latin Roots$/.test(p) || /^mastery\/ellis_custom_items\/\d+(\/(ch|def))?$/.test(p) || /^mastery\/ellis_settings\/definitions\/[^\/]+$/.test(p) || p === "mastery/ellis_bank_order/Greek & Latin Roots"), paths.filter(p => !/word_roots|cat_gate|custom_items|definitions|bank_order/.test(p)));
ok("never mastery/ellis (cards), cat_modes, cat_intro_max, notebookSettings, curriculum or another kid", !paths.some(p => /^mastery\/ellis\//.test(p) || /cat_modes|cat_intro_max|cat_caps|notebookSettings|curriculum|lincoln|lucy|julian/.test(p)));
ok("no two writes overlap (one path inside another)", paths.every(a => !paths.some(b => b !== a && b.startsWith(a + "/"))));
ok("cat_gate = {subject: word_roots, after: done}", JSON.stringify(P.writes.find(x => /cat_gate/.test(x.path)).value) === JSON.stringify({ subject: "word_roots", after: "done" }));
ok("kidStage = Beginning, his subject, no check-up", (v => v.stage === 1 && v.subject === "word_roots" && !v.checkup && v.knows === "")(P.writes.find(x => /kidStage/.test(x.path)).value));
const appends = P.writes.filter(x => /custom_items\/\d+$/.test(x.path) && x.value);
ok("appended entries are {cat,name,ch} — never a def (a def makes a recite card)", appends.length && appends.every(x => Object.keys(x.value).sort().join() === "cat,ch,name" && x.value.cat === D));
ok("appends start after his last saved entry", appends.every(x => +x.path.split("/")[2] >= FX.customLength));
ok("…the 9 built-in Beginning roots that aren't cards get their lesson", P.sum.builtInCh.slice().sort().join() === ["meter", "rupt", "aud", "dict", "flex/flect", "port", "scrib/script", "tract", "struct"].sort().join(), P.sum.builtInCh);
{ const mine = new Set(Object.values(FX.custom).map(e => e.name).concat(ELLIS_CODE, live));
  const want = w.G.unitStudies.word_roots.decks[0].cards.filter(c => c.stage === 1 && !mine.has(c.name)).map(c => c.name);
  ok("…plus every Beginning root he doesn't have yet (" + want.length + "), in book order", JSON.stringify(P.sum.added) === JSON.stringify(want), [P.sum.added.length, want.length]); }
const savedCh = Object.fromEntries(P.writes.filter(x => /\/ch$/.test(x.path)).map(x => [FX.custom[x.path.split("/")[2]].name, x.value]));
ok("his saved roots get their lesson: peri- 1, uni- 2, act 5, op- 7; il-/a- 130; poly- 301", savedCh["peri-"] === 1 && savedCh["uni-"] === 2 && savedCh.act === 5 && savedCh["op-"] === 7 && savedCh["il-"] === 130 && savedCh["a-"] === 130 && savedCh["poly-"] === 301, savedCh);
const defGone = P.writes.filter(x => /\/def$/.test(x.path)).map(x => FX.custom[x.path.split("/")[2]].name);
ok("waiting def copies removed (" + defGone.length + "), never on a live card, never on Our words", defGone.length && defGone.every(n => live.indexOf(n) < 0 && P.sum.ourWords.indexOf(n) < 0));
ok("…and only where his definitions map holds the same words (no back changes)", defGone.every(n => FX.settings.definitions[n] === FX.custom[Object.keys(FX.custom).find(i => FX.custom[i].name === n)].def));
const newDefs = P.writes.filter(x => /definitions\//.test(x.path));
ok("backs for new names go only to EMPTY definitions keys", newDefs.length && newDefs.every(x => !FX.settings.definitions[x.path.split("/").pop()]));
ok("new names with '/' get their back from the built-in meanings list instead", P.sum.slashBacks.length === 5 && P.sum.slashBacks.every(n => w.MAST_VOCAB_DEFS[n.toLowerCase()] === card[n].def), P.sum.slashBacks);
ok("existing built-in backs are not replaced (flex/flect stays 'bend')", w.MAST_VOCAB_DEFS["flex/flect"] === "bend");

console.log("\n── after Yes (live) ──");
{ const before = JSON.stringify(w.G.masteryData.ellis);
  w.wrAttachOpen("ellis");
  const view = w.view; view.plan = w.wrPlanAttach("ellis", 1761300000000);
  const r = w.wrApplyAttach(view.plan);
  setTimeout(() => {
    const up = w.G.writes;
    ok("ONE multi-path update at the root, exactly the plan's paths and values", r === true && up.length === 1 && up[0][0] === "update" && up[0][1] === "" && JSON.stringify(Object.keys(up[0][2])) === JSON.stringify(paths) && Object.keys(up[0][2]).every((k, i) => JSON.stringify(up[0][2][k]) === JSON.stringify(P.writes[i].value)));
    ok("his 13 cards are byte-identical", JSON.stringify(w.G.masteryData.ellis) === before && Object.keys(FX.cards).every(i => JSON.stringify(w.G.masteryData.ellis[i]) === JSON.stringify(FX.cards[i])));
    ok("he's in the unit locally (enrolled + kidStage)", w.G.unitStudies.word_roots.enrolled.ellis === true && w.G.unitStudies.word_roots.kidStage.ellis.subject === "word_roots");
    const elig = w.mastBankEligible("ellis", D).filter(n => live.indexOf(n) < 0);
    ok("the REAL gate agrees: next new card meter, then the plan's order", elig[0] === "meter" && JSON.stringify(elig.slice(0, 10)) === JSON.stringify(P.next10), elig.slice(0, 10));
    ok("the REAL gate holds Lessons 21–24 and the Level roots", ["viv/vive", "-fy", "vert/vers", "cline", "stat", "il-", "a-", "poly-"].every(n => elig.indexOf(n) < 0) && elig.indexOf("bio") >= 0 && elig.indexOf("struct") >= 0);
    // her rule both ways: checking off L21b opens Lesson 21's roots; another gated deck keeps "the lesson he's on"
    const lid21b = FX.subject.lessonIds[FX.subject.lessonSeq.indexOf("L21b")];
    w.G.masteryData.ellis_settings.cat_gate.Vocabulary = { subject: "word_roots" };
    w.G.masteryData.ellis_custom_items.push({ cat: "Vocabulary", name: "w20", ch: 20 }, { cat: "Vocabulary", name: "w21", ch: 21 }, { cat: "Vocabulary", name: "w22", ch: 22 });
    const voc = () => w.mastBankEligible("ellis", "Vocabulary").filter(n => /^w2/.test(n)).join();
    ok("another gated deck is unchanged: opens the lesson he's ON (21) while he's on it", voc() === "w20,w21");
    w.G.currData.done.ellis.word_roots = Object.assign({}, FX.done, { [lid21b]: { day: "2026-10-26" } });
    const elig2 = w.mastBankEligible("ellis", D);
    ok("once L21b is checked off, Lesson 21's roots open (viv/vive, -acious, -fy); Lesson 22's still wait", ["viv/vive", "-acious", "-fy"].every(n => elig2.indexOf(n) >= 0) && elig2.indexOf("vert/vers") < 0);
    ok("…and the other deck still follows 'the lesson he's on' (now 22)", voc() === "w20,w21,w22");
    w.G.currData.done.ellis.word_roots = FX.done;
    ok("every root that can start has a back (definitions or built-in)", elig.every(n => (w.G.masteryData.ellis_settings.definitions || {})[n] || w.MAST_VOCAB_DEFS[n.toLowerCase()] || w.G.masteryData.ellis_custom_items.find(e => e && e.cat === D && e.name === n && e.def)), elig.filter(n => !((w.G.masteryData.ellis_settings.definitions || {})[n] || w.MAST_VOCAB_DEFS[n.toLowerCase()])));
    ok("active is gone from his bank; ir- is still there", !w.mastFullBank("ellis")[D].includes("active") && w.mastFullBank("ellis")[D].includes("ir-"));
    ok("second tap refuses: already hooked up", !w.wrPlanAttach("ellis").ok && /already/.test(w.wrPlanAttach("ellis").why));
    rest();
  }, 0); }

function rest() {
  console.log("\n── nothing written when it shouldn't be ──");
  { const d = world({ dry: true }); d.wrAttachOpen("ellis"); const r = d.wrApplyAttach(d.view.plan);
    ok("?dryrun=1: Yes writes nothing, changes nothing, says so", r === false && d.G.writes.length === 0 && !d.G.unitStudies.word_roots.enrolled && /Dry run/.test(d.view.msg)); }
  { const d = world(); d.wrAttachOpen("ellis"); const plan = d.view.plan; d.G.mom = false;
    ok("not Mom: nothing", d.wrApplyAttach(plan) === false && d.G.writes.length === 0); }
  { const d = world(); d.wrAttachOpen("ellis"); const plan = d.view.plan; d.G.masteryData.ellis_custom_items.push({ cat: D, name: "new-" });
    ok("data changed since the plan: nothing written, new plan shown", d.wrApplyAttach(plan) === false && d.G.writes.length === 0 && /changed/.test(d.view.msg)); }
  ok("refuses: unit not added yet (her live data today)", (p => !p.ok && /Add the Word Roots unit first/.test(p.why) && !p.writes.length)(world({ noUnit: true }).wrPlanAttach("ellis")));
  ok("refuses: no Word Roots subject", (p => !p.ok && /no Word Roots subject/.test(p.why) && !p.writes.length)(world({ noSubject: true }).wrPlanAttach("ellis")));
  ok("refuses: subject not stamped (Import completions)", (p => !p.ok && /stamped/.test(p.why) && !p.writes.length)(world({ unstamped: true }).wrPlanAttach("ellis")));
  ok("Lincoln is still blocked", (p => !p.ok && !p.writes.length)(world().wrPlanAttach("lincoln")));

  console.log("\n── 'checked off' rule (wrGateDone) ──");
  const gd = (seq, doneIdx, extra) => { const d = world(); const ids = seq.map((_, i) => "G" + i);
    d.G.currData.subjects.ellis.g = Object.assign({ lessonSeq: seq, lessonIds: ids, doneImportedAt: "2026-10-24" }, extra || {});
    d.G.currData.done.ellis.g = Object.fromEntries(doneIdx.map(i => [ids[i], { day: "2026-10-24" }])); return d.wrGateDone("ellis", "g"); };
  ok("nothing checked off yet (a new kid at L1): nothing opens — gate 0", gd(["L1", "L1b", "L2", "L2b"], []) === 0);
  ok("L1 done but L1b not: Lesson 1 still waits", gd(["L1", "L1b", "L2", "L2b"], [0]) === 0);
  ok("L1 + L1b done: Lesson 1 opens", gd(["L1", "L1b", "L2", "L2b"], [0, 1]) === 1);
  ok("whole book incl. reviews done: 24", gd(["L23", "L23b", "L24", "L24b", "Review", "Review"], [0, 1, 2, 3, 4, 5]) === 24);
  ok("L24b done, reviews not: still 24 (reviews aren't lessons)", gd(["L24", "L24b", "Review"], [0, 1]) === 24);
  ok("Level lines after Beginning: 'L1-1' not done → everything through Beginning opens (100), not Level 1", gd(["L24", "L24b", "Review", "L1-1", "L1-1b"], [0, 1, 2]) === 100);
  ok("…'L1-1' + 'L1-1b' done → Level 1 Lesson 1 opens (101)", gd(["L24", "L24b", "L1-1", "L1-1b", "L1-2"], [0, 1, 2, 3]) === 101);
  ok("unstamped subject → null (gate fails open, as always)", gd(["L1"], [0], { doneImportedAt: null }) === null);

  console.log("\n── the Word Roots page ──");
  { const d = world(), esc = s => String(s), roster = ["lincoln", "ellis", "lucy", "julian"], u = d.G.unitStudies.word_roots;
    const h = d._unitStageRowsHtml(u, roster);
    ok("Ellis gets 🔗 Hook up Ellis; Lincoln, Lucy, Julian stay 'not hooked up yet'", /wrAttachOpen\('ellis'\)/.test(h) && !/wrAttachOpen\('lincoln'\)/.test(h) && (h.match(/not hooked up yet/g) || []).length === 3);
    ok("still no stock + kid button on this unit", h.indexOf("unitStageFormOpen(") < 0);
    d.wrAttachOpen("ellis"); const h2 = d._unitStageRowsHtml(u, roster);
    ok("tap → the plan in plain words, with Yes / Cancel and nothing written yet", /Nothing is written until you tap Yes/.test(h2) && /13 root cards stay exactly as they are/.test(h2) && /Lesson 21/.test(h2) && /wrApplyAttach/.test(h2) && /meter/.test(h2) && d.G.writes.length === 0);
    ok("the plan shows the def-copy line on its own", /waiting roots lose their extra meaning copy/.test(h2));
    const dd = world({ dry: true }); dd.wrAttachOpen("ellis");
    ok("dry run: the panel says Yes writes nothing", /Dry run — Yes writes nothing/.test(dd._unitStageRowsHtml(dd.G.unitStudies.word_roots, roster)));
    d.unitStageFormOpen("word_roots", "ellis"); d.unitStageEnroll();
    ok("the stock enroll is still blocked", d.G.writes.length === 0); }
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
  { const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let m, n = 0, bad = []; while ((m = re.exec(src))) { if (m[1] && /src=/.test(m[1])) continue; n++; try { new Function(m[2]); } catch (e) { bad.push(e.message); } }
    ok("every inline script in index.html still parses (the built-in meanings hook sits after the list closes)", n > 0 && !bad.length, bad);
    ok("…the hook runs once, right after MAST_VOCAB_DEFS ends", (src.match(/Object\.assign\(MAST_VOCAB_DEFS,_wrSlashDefs\(MAST_VOCAB_DEFS\)\)/g) || []).length === 1 && /"\};\nif\(typeof _wrSlashDefs==="function"\) Object\.assign\(MAST_VOCAB_DEFS/.test(src)); }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
