// 📘 UNITMOVEBOOK — her "yes" 2026-11-19: ➡ Start Stage N on a unit whose cards follow the kid's book (All About Spelling,
// cardLessons) asks "Which book?" — the kid's subjects, the current book chosen, Start / Cancel. The pick goes to _ustApply
// and is saved as the kid's subject, so the new level's cards, test and practice follow the NEW book. Runs the real
// STARTER_UNITS block (UNIT_STAGES + AAS + UNITMOVEBOOK) with the real lesson gate (mastGateChapter / mastBankEligible /
// lid*) over made-up kids:
//  · wren — Stage 1 done on book "spell_one" (L1 names), a new "spell_two" book (L2-1 … L2-31) added;
//  · tad  — enrolled at Stage 1, nothing learned (not ready → the "isn't ready yet" question stays);
//  · bo   — enrolled with NO book link → ➡ moves up exactly as before, no question.
// Checks: the picker lists the kid's subjects with the current one chosen; the pick reaches _ustApply (every deck's gate)
// and the saved record; the same book = today's move-up, write for write; Cancel changes nothing; Mom-only; nothing written
// in dry run; a unit with no book (Math Fluency) still moves up at once.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);
ok("UNITMOVEBOOK sits inside the STARTER_UNITS block", block.indexOf("// UNITMOVEBOOK_START") > 0 && block.indexOf("// UNITMOVEBOOK_END") > block.indexOf("// UNITMOVEBOOK_START"));
const GATE = ["mastGateChapter", "mastBankEligible", "mastFullBank", "lidStamped", "lidDoneSet", "lidDoneIdx", "lidsFor"].map(slice).join("\n");

const L1 = ["L1 Sounds", "L2 Sounds again"].concat(Array.from({ length: 23 }, (_, i) => "L" + (i + 3) + " Lesson " + (i + 3)));   // 25 lessons, AAS-1 style
const L2 = Array.from({ length: 31 }, (_, i) => "L2-" + (i + 1));
const book = (display, seq, doneN) => ({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => display.slice(0, 2) + i), doneImportedAt: "2026-10-01" });
const doneOf = (bk, n) => { const o = {}; bk.lessonIds.slice(0, n).forEach(id => o[id] = { src: "check" }); return o; };

function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, currData: o.curr || { subjects: {}, done: {} }, writes: [], dry: !!o.dry, mom: o.mom !== false,
    unitStudies: {}, content: {}, confirms: [], confirmAns: o.confirmAns !== false };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, JSON.parse(JSON.stringify(v))]); }, set(v) { G.writes.push(["set", p, JSON.parse(JSON.stringify(v))]); },
    transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; const MAST_BANK_MAP={}; let masteryKid=null;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function confirm(m){ G.confirms.push(m); return G.confirmAns; }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); }
    ${GATE}
    ${block}
    return { STARTER_UNITS, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp, _ustApply,
      unitMoveBookSet, unitMoveBookGo, unitMoveBookClose, _unitStageRowsHtml, mastBankEligible, mastGateChapter,
      get moveForm(){ return unitMoveForm; } };`)(G, db);
  api.G = G;
  ["all_about_spelling", "math_fluency_path"].forEach(id => { const u = api.STARTER_UNITS[id](); G.unitStudies[u.id] = u; });
  api.u = G.unitStudies.all_about_spelling; return api;
}
// wren: enrolled at Stage 1 on spell_one, every Level 1 phonogram + rule on the ladder (ready), book one finished
function wrenWorld(o) {
  o = o || {};
  const one = book("Spelling One", L1), two = book("Spelling Two", L2);
  const curr = { subjects: { wren: { spell_one: one, spell_two: two, piano: { display: "Piano" } }, tad: { spell_one: book("Spelling One", L1) }, bo: { spell_one: book("Spelling One", L1) } },
    done: { wren: { spell_one: doneOf(one, 25) }, tad: {}, bo: {} } };
  const w = world(Object.assign({ curr }, o));
  const dry = w.G.dry; w.G.dry = true;   // enroll in memory only, then measure the move-up's own writes
  const enroll = (kid, subject) => { w.unitStageFormOpen("all_about_spelling", kid); w.unitStageFormSet("stage", "1"); if (subject) w.unitStageFormSet("subject", subject); w.unitStageEnroll(); };
  enroll("wren", "spell_one"); enroll("tad", "spell_one"); enroll("bo", "");
  w.u.decks.filter(d => !d.bankOnly).forEach(d => d.cards.filter(c => c.stage === 1).forEach(c => {
    const it = w.G.masteryData.wren.find(i => i.subject === d.key && i.prompt === c.name);
    if (it) Object.assign(it, { status: "active", tier: "weekly" }); else w.G.masteryData.wren.push({ id: "wr_" + c.name, subject: d.key, prompt: c.name, status: "active", tier: "weekly" }); }));
  w.G.dry = dry; w.G.writes.length = 0; return w;
}
const snap = w => JSON.stringify([w.G.masteryData, w.u.kidStage]);
const ksRec = w => w.G.writes.find(x => x[1] === "unitStudies/all_about_spelling/kidStage/wren");
const gatesW = w => w.G.writes.filter(x => /^mastery\/wren_settings\/cat_gate\//.test(x[1])).map(x => x[1].split("/").pop() + "=" + x[2].subject).sort();

console.log("── ➡ asks Which book? ──");
{ const w = wrenWorld();
  ok("wren is ready on Stage 1 → ➡ Start Stage 2", w.unitStageStatus(w.u, "wren").ready && w.unitStageStatus(w.u, "wren").next.n === 2);
  const before = snap(w);
  w.unitStageMoveUp("all_about_spelling", "wren");
  ok("tap ➡ → nothing written, nothing changed yet", w.G.writes.length === 0 && snap(w) === before);
  ok("the Which-book row is open for wren, current book chosen", w.moveForm && w.moveForm.kid === "wren" && w.moveForm.subject === "spell_one");
  const h = w._unitStageRowsHtml(w.u, ["wren"]);
  const sel = (/<select[^>]*unitMoveBookSet[^>]*>([\s\S]*?)<\/select>/.exec(h) || [])[1] || "";
  const opts = [...sel.matchAll(/<option value="([^"]*)"( selected)?>([^<]*)</g)].map(m => [m[1], !!m[2], m[3]]);
  ok("row shows Which book? with Start Stage 2 and Cancel", /Which book\?/.test(h) && /unitMoveBookGo\(\)[^>]*>Start Stage 2</.test(h) && /unitMoveBookClose\(\)[^>]*>Cancel</.test(h));
  ok("picker lists the kid's subjects by name (as the Start form does)", JSON.stringify(opts.map(x => x[0])) === JSON.stringify(["spell_one", "spell_two", "piano"]) && opts[1][2] === "Spelling Two", opts);
  ok("only the current book is pre-chosen", opts.filter(x => x[1]).map(x => x[0]).join() === "spell_one");
  ok("tad's row shows no picker", !/Which book\?/.test(w._unitStageRowsHtml(w.u, ["tad"]))); }

console.log("\n── Cancel ──");
{ const w = wrenWorld(); const before = snap(w);
  w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookSet("spell_two"); w.unitMoveBookClose();
  ok("Cancel → row closed, nothing written, kid still on Stage 1 with book one", !w.moveForm && w.G.writes.length === 0 && snap(w) === before && w.u.kidStage.wren.stage === 1 && w.u.kidStage.wren.subject === "spell_one"); }

console.log("\n── the new book ──");
{ const w = wrenWorld();
  w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookSet("spell_two"); w.unitMoveBookGo();
  const r = ksRec(w);
  ok("saved record: Stage 2, subject spell_two, from Stage 1", r && r[0] === "set" && r[2].stage === 2 && r[2].subject === "spell_two" && r[2].from === 1 && r[2].knows === "", r && r[2]);
  ok("in memory too, and the row closed", w.u.kidStage.wren.subject === "spell_two" && w.u.kidStage.wren.stage === 2 && !w.moveForm);
  ok("every Level 2 deck's gate points at spell_two", gatesW(w).join() === "AAS Words=spell_two,Phonograms=spell_two,Spelling Rules=spell_two", gatesW(w));
  const bank = w.G.masteryData.wren_custom_items, l2 = bank.filter(c => w.u.decks.some(d => d.cards.some(k => k.stage === 2 && k.name === c.name && d.key === c.cat)));
  ok("Level 2 bank entries carry ch = 200 + lesson (L2-7 → 207)", l2.length > 0 && l2.every(c => c.ch > 200 && c.ch < 300), l2.slice(0, 3));
  ok("the gate reads book two: lesson 1 → 201", w.mastGateChapter("wren", "spell_two") === 201);
  ok("no Level 2 card starts learning before its lesson (first rule is L2-3, first phonogram L2-17)", !w.G.masteryData.wren.some(i => i.status === "introduction" && /Phonograms|Spelling Rules/.test(i.subject) && l2.some(c => c.name === i.prompt && c.cat === i.subject)));
  const elig = k => w.mastBankEligible("wren", k).filter(n => l2.some(c => c.cat === k && c.name === n));
  ok("lesson 1: no Level 2 phonogram or rule is open", elig("Phonograms").length === 0 && elig("Spelling Rules").length === 0);
  w.G.currData.done.wren.spell_two = doneOf(w.G.currData.subjects.wren.spell_two, 2);   // L2-1, L2-2 done → on L2-3
  ok("on L2-3: the L2-3 rule opens, nothing later", w.mastGateChapter("wren", "spell_two") === 203 && elig("Spelling Rules").length === 1 && elig("Phonograms").length === 0, elig("Spelling Rules"));
  const l1Open = w.mastBankEligible("wren", "Phonograms").filter(n => bank.some(c => c.cat === "Phonograms" && c.name === n && c.ch != null && c.ch < 100));
  ok("Level 1 cards stay open under book two (ch ≤ 25 < 203)", l1Open.length === bank.filter(c => c.cat === "Phonograms" && c.ch != null && c.ch < 100).length && l1Open.length > 0); }

console.log("\n── the same book = today ──");
{ const w1 = wrenWorld(), w2 = wrenWorld();
  w1.unitStageMoveUp("all_about_spelling", "wren"); w1.unitMoveBookGo();   // Start with the pre-chosen (current) book
  // today's move-up, line for line: _ustApply with the kid's saved book, the same record, the same writes
  { const u = w2.u, ks = u.kidStage.wren; const ww = w2._ustApply(u, "wren", 2, "", ks.subject, ks.map);
    const rec = { stage: 2, knows: "", subject: ks.subject || "", map: (ww.gate ? ks.map : "") || "", ts: 0, from: ks.stage };
    w1.G.writes.forEach(x => { if (/kidStage\/wren$/.test(x[1])) x[2].ts = 0; });
    ok("same mastery items, bank and settings as today's move-up", JSON.stringify(w1.G.masteryData) === JSON.stringify(w2.G.masteryData));
    ok("same saved record as today's (ts aside)", JSON.stringify(ksRec(w1)[2]) === JSON.stringify(rec), [ksRec(w1)[2], rec]); }
  ok("gates stay on spell_one", gatesW(w1).every(g => /=spell_one$/.test(g)) && gatesW(w1).length === 3);
  ok("old book: Level 2 cards get ch = lesson (book one isn't multi-level)", w1.G.masteryData.wren_custom_items.filter(c => c.cat === "Spelling Rules" && c.ch != null).some(c => c.ch === 25)); }

console.log("\n── isn't ready yet ──");
{ const w = wrenWorld({ confirmAns: false }); const before = snap(w);
  w.unitStageMoveUp("all_about_spelling", "tad");
  ok("not ready: ➡ opens the picker first (no question yet)", w.moveForm && w.moveForm.kid === "tad" && w.G.confirms.length === 0);
  w.unitMoveBookGo();
  ok("Start → the isn't-ready question is still asked", w.G.confirms.length === 1 && /isn’t ready yet/.test(w.G.confirms[0]));
  ok("answered No → nothing written, nothing changed", w.G.writes.length === 0 && snap(w) === before);
  w.G.confirmAns = true; w.unitMoveBookGo();
  ok("answered Yes → tad moves up on his book", w.u.kidStage.tad.stage === 2 && w.u.kidStage.tad.subject === "spell_one"); }

console.log("\n── no question where no book is linked ──");
{ const w = wrenWorld(); w.G.masteryData.bo = w.G.masteryData.bo || [];
  w.unitStageMoveUp("all_about_spelling", "bo");
  ok("AAS kid with no book link: no picker, moves up as before (after the question)", !w.moveForm && w.u.kidStage.bo.stage === 2 && w.u.kidStage.bo.subject === "" && w.G.confirms.length === 1);
  const mf = w.G.unitStudies.math_fluency_path;
  w.G.dry = true; w.unitStageFormOpen("math_fluency_path", "bo"); w.unitStageFormSet("stage", "1"); w.unitStageEnroll(); w.G.dry = false;
  w.unitStageMoveUp("math_fluency_path", "bo");
  ok("Math Fluency (no book cards): ➡ moves up at once, no picker", !w.moveForm && mf.kidStage.bo.stage > 1); }

console.log("\n── Mom-only + dry run ──");
{ const w = wrenWorld(); w.G.mom = false; const before = snap(w);
  w.unitStageMoveUp("all_about_spelling", "wren");
  ok("not Mom: ➡ does nothing", !w.moveForm && w.G.writes.length === 0);
  w.G.mom = true; w.unitStageMoveUp("all_about_spelling", "wren"); w.G.mom = false;
  w.unitMoveBookSet("spell_two"); w.unitMoveBookGo();
  ok("not Mom: Set and Start do nothing", w.moveForm.subject === "spell_one" && w.G.writes.length === 0 && snap(w) === before); }
{ const w = wrenWorld({ dry: true });
  w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookSet("spell_two"); w.unitMoveBookGo();
  ok("dry run: nothing written to the database", w.G.writes.length === 0 && w.u.kidStage.wren.subject === "spell_two"); }

console.log("\n── writes are targeted ──");
{ const w = wrenWorld();
  w.unitStageMoveUp("all_about_spelling", "wren"); w.unitMoveBookSet("spell_two"); w.unitMoveBookGo();
  ok("only index updates / leaf sets under the kid", w.G.writes.length > 0 && w.G.writes.every(x => x[0] === "update"
    ? /^mastery\/wren(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_hold|cat_instructions|cat_instructions_kid))?$/.test(x[1])
    : /^(unitStudies\/all_about_spelling\/(kidStage|enrolled)\/wren|mastery\/wren_settings\/cat_gate\/[^/]+)$/.test(x[1])), w.G.writes.map(x => x[0] + " " + x[1])); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
