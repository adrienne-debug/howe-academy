/*
 * Node tests — 🔗 Units switch-over step 4: hook up Julian to the Letters Path, stage 1 (Big letters).
 * PLAN_units_switchover_order_2026-10-25.md step 4 · PLAN_attach_julian_2026-10-26.md. One UA_ATTACH row; the UNITATTACH
 * engine does the rest. Replays the shared read-only snapshot (test_fixtures/attach_julian_2026-10-26.json, 2026-10-26
 * 12:56 UTC) when present; otherwise a made-up Julian of the same shape.
 *   · ZERO card writes, ZERO bank writes: exactly enrolled + kidStage (his 26 capitals are already his list);
 *   · his 16 Letters cards (A–P) are stage-1 cards and stay byte-identical; so do his saved list, settings and notebook cursors;
 *   · the notebook cannot change: notebooks.js and the notebook context code read no unit enrolment or stage (static proof);
 *   · refusals write nothing; the stock "+ Julian" enroll is closed for him on this unit, open for a kid without a row.
 *   run: node test_attach_letters_julian.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nbsrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "attach_julian_2026-10-26.json");
const D = "Letters", UNIT = "letters_path", KID = "julian", OTHER = "caleb";
global.window = global.window || {}; eval(nbsrc); const NB = window.HoweNotebooks;
const NB_CTX = (items, FX) => ({ weekNum: "week29", weekDates: "Oct 26 – Oct 30", weekData: { dates: { monday: "Oct 26", tuesday: "Oct 27", wednesday: "Oct 28", thursday: "Oct 29", friday: "Oct 30" }, tasks: [] }, masteryItems: items, letterCursor: (FX.notebookSettings || {}).letterCursor, numberCursor: (FX.notebookSettings || {}).numberCursor });
const nbBuild = (items, FX) => { const o = NB.generate("julian", NB_CTX(items, FX)); return { student: o.student, parent: o.parent, letterCursor: JSON.stringify(o.letterCursor), numberCursor: JSON.stringify(o.numberCursor), chips: [...o.student.replace(/<style[\s\S]*?<\/style>/g, "").matchAll(/recap-chip">⭐ ([^<]+)/g)].map(m => m[1]) }; };

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const JBANK = { Letters: "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(","), Numbers: Array.from({ length: 20 }, (_, i) => String(i + 1)), Shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star", "Heart", "Diamond", "Oval"], Counting: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"] };
ok("the code's Julian lists are what the test assumes (26 capitals, 1–20, 8 shapes, one–ten)", (() => { const i = src.indexOf("const MAST_JULIAN_BANK"); const seg = src.slice(i, i + 900); return /Letters:"A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z"\.split\(","\)/.test(seg) && /Numbers:Array\.from\(\{length:20\}/.test(seg) && /Shapes:\["Circle","Square","Triangle","Rectangle","Star","Heart","Diamond","Oval"\]/.test(seg) && /Counting:\["one","two","three","four","five","six","seven","eight","nine","ten"\]/.test(seg); })());

let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else {
  synthetic = true; const cards = {}; const L = { 0: "A", 1: "B", 2: "C", 17: "D", 18: "E", 26: "F", 32: "G", 40: "H", 44: "I", 58: "J", 62: "K", 73: "L", 85: "M", 88: "N", 96: "O", 103: "P" };
  Object.keys(L).forEach(i => { const learn = ["N", "O", "P"].includes(L[i]); cards[i] = { id: "jul_" + L[i], subject: D, prompt: L[i], status: learn ? "introduction" : "active", tier: learn ? "daily" : "monthly", tally_dots: learn ? 1 : 5, review_mode: "flash" }; if (!learn) cards[i].next_due = 230; });
  FX = { itemsLength: 113, cards, customLength: 71, customNull: [], custom: {}, settings: { cat_modes: {}, cat_intro_max: {}, auto_pull: true, max_intro_per_cat: 3, cat_gate: [], cat_hold: null }, bankOrder: {}, units: null, unitMeta: null, notebookSettings: { letterCursor: { adv: 3, idx: 1, week: 27 }, numberCursor: { adv: 4, from: 14, week: 27 } } };
}
console.log(synthetic ? "(no snapshot file — made-up Julian)" : "(replaying " + path.basename(FXP) + ")");

function world(o) {
  o = o || {};
  const items = new Array(FX.itemsLength).fill(null).map((_, i) => FX.cards[i] ? JSON.parse(JSON.stringify(FX.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i, status: "active", tier: "weekly" });
  const cust = new Array(FX.customLength).fill(null).map((_, i) => FX.custom[i] ? JSON.parse(JSON.stringify(FX.custom[i])) : { cat: "Other", name: "n" + i });
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry, notebookSettings: { julian: JSON.parse(JSON.stringify(FX.notebookSettings || {})) },
    masteryData: { julian: items, julian_custom_items: cust, julian_settings: JSON.parse(JSON.stringify(FX.settings)), julian_bank_order: {}, caleb: [], caleb_custom_items: [], caleb_settings: {}, lucy: [], lucy_custom_items: [], lucy_settings: {} },
    currData: { subjects: { julian: {}, caleb: {}, lucy: {} }, done: {} }, unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "JBANK", `
    const masteryData=G.masteryData, currData=G.currData, notebookSettings=G.notebookSettings; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="julian"; function subjName(k,s){ return s; }
    const MAST_BANK_MAP={julian:JBANK,caleb:{},lucy:{}}; ${VOCAB}
    ${GATE}
    ${block}
    return { STARTER_UNITS, UA_ATTACH, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachClose, uaAttachHtml, _unitStageRowsHtml, _ustApply, _ustCards, unitStageStatus, mastBankEligible, mastFullBank,
      unitStageFormOpen, unitStageEnroll, get view(){ return uaAttachView; }, get form(){ return unitStageForm; } };`)(G, db, JBANK);
  if (!o.noUnit) G.unitStudies[UNIT] = w.STARTER_UNITS.letters_path();
  w.G = G; return w;
}
const stage1 = w => w._ustCards(w.G.unitStudies[UNIT], 1);
const letters = FX => Object.values(FX.cards).filter(c => c.subject === D);

(async () => {
console.log("── the row ──");
ok("UA_ATTACH.letters_path has Julian → stage 1, fill, no strayOk; the Math Fluency Path rows are untouched", (t => t.letters_path && Object.keys(t.letters_path).join() === KID && t.letters_path.julian.stage === 1 && t.letters_path.julian.fill === true && !t.letters_path.julian.strayOk && Object.keys(t.math_fluency_path).sort().join() === "ellis,lincoln,lucy")(world().UA_ATTACH));

console.log("\n── his data vs the unit ──");
{ const w = world(), s1 = stage1(w), names = s1.map(c => c.name);
  ok("stage 1 of the code starter = the 26 capitals, deck 'Letters', no answers", s1.length === 26 && names.join() === JBANK.Letters.join() && s1.every(c => c._dk === D && c.def == null));
  if (FX.units) ok("…and matches the live unit record (names, stages, order)", JSON.stringify(FX.units.letters_path.decks.find(d => d.key === D).cards.map(c => [c.name, c.stage])) === JSON.stringify(s1.map(c => [c.name, 1])));
  if (FX.unitMeta) ok("the live record: starter v1, nbInsert false, nobody enrolled, no kidStage", (m => m.starterVer === 1 && m.nbInsert === false && !m.enrolled && !m.kidStage)(FX.unitMeta.letters_path), FX.unitMeta && FX.unitMeta.letters_path);
  const live = letters(FX);
  ok("his 16 Letters cards are A–P, every one a stage-1 card; 13 on the ladder, 3 learning (N O P)", live.length === 16 && live.map(c => c.prompt).sort().join("") === "ABCDEFGHIJKLMNOP" && live.every(c => names.includes(c.prompt)) && live.filter(c => c.status === "introduction").map(c => c.prompt).sort().join("") === "NOP", live.map(c => c.prompt + ":" + c.status));
  ok("his saved list has no Letters entries; built-in 26 = the unit's 26 → nothing to add", !Object.values(FX.custom).some(e => e.cat === D));
  ok("his notebook cursors are the ones the plan leaves alone: letterCursor {week 27, idx 1}", FX.notebookSettings && FX.notebookSettings.letterCursor && FX.notebookSettings.letterCursor.idx === 1 && FX.notebookSettings.letterCursor.week === 27, FX.notebookSettings);
}

console.log("\n── the notebook cannot change (static proof) ──");
ok("notebooks.js reads no unit enrolment or stage (no kidStage / enrolled / unitStudies read)", !/kidStage|\.enrolled\b|unitStudies/.test(nbsrc.replace(/\/\/.*$/gm, "")));
ok("the app's notebook cursor code reads notebookSettings + the decks, not a unit record", (() => { const i = src.indexOf("letterCursor=out.letterCursor"); const seg = src.slice(src.indexOf("function nbBuildCtx") > 0 ? src.indexOf("function nbBuildCtx") : src.indexOf('if((kid==="julian"||kid==="caleb")&&out&&out.letterCursor)') - 3000, src.indexOf('if((kid==="julian"||kid==="caleb")&&out&&out.numberCursor)') + 800); return /notebookSettings/.test(seg) && !/kidStage|\.enrolled\b|unitStudies/.test(seg.replace(/\/\/.*$/gm, "")); })());
ok("letters_path is nbInsert:false in the code starter and the attach never writes nbInsert", /id:"letters_path", starter:"letters_path", starterVer:1,\s*title:"Letters Path", emoji:"\\u\{1F524\}", nbInsert:false/.test(block) && !/nbInsert/.test(block.slice(block.indexOf("// UNITATTACH_START"), block.indexOf("// UNITATTACH_END"))));

console.log("\n── the plan ──");
const w = world(), P = w.uaPlanAttach(UNIT, KID, 1761490000000);
ok("plan is ready for Julian, stage 1 · Big letters", P.ok && P.sum.stage === 1 && P.sum.label === "Big letters" && P.sum.decks.join() === D, P.why);
ok("16 cards kept: 13 on the ladder, 3 learning; no stray, no earlier-stage card, no differing back", P.sum.liveKept === 16 && P.sum.onLadder === 13 && P.sum.learning === 3 && P.sum.stray.length === 0 && !P.sum.earlier && P.sum.backDiffers.length === 0, P.sum);
ok("adds NOTHING to his list (every capital is already there)", P.sum.added.length === 0 && Object.keys(P.sum.addedByDeck).length === 0);
ok("his next new cards don't change (Q R S T U V W X Y Z)", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10Before.join("") === "QRSTUVWXYZ", P.sum.next10Before);
ok("EXACTLY 2 writes: enrolled/julian = true, kidStage/julian = {stage 1, via attach}", P.writes.length === 2 && P.writes[0].path === "unitStudies/" + UNIT + "/enrolled/" + KID && P.writes[0].value === true && P.writes[1].path === "unitStudies/" + UNIT + "/kidStage/" + KID && P.writes[1].value.stage === 1 && P.writes[1].value.via === "attach" && P.writes[1].value.ts === 1761490000000, P.writes);
ok("no write touches mastery/, notebookSettings/, curriculum/ or another kid", !P.writes.some(x => /^mastery\/|notebookSettings|curriculum|caleb|lucy|ellis|lincoln/.test(x.path)));

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const before = [w.G.masteryData.julian, w.G.masteryData.julian_custom_items, w.G.masteryData.julian_settings, w.G.notebookSettings].map(x => JSON.stringify(x));
  const nbBefore = nbBuild(w.G.masteryData.julian, FX);
  w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("next week's notebook (week 29), built before and after from his cards + cursors: student and parent pages byte-identical, letter cursor identical", (() => { const a = nbBuild(w.G.masteryData.julian, FX); return nbBefore.student === a.student && nbBefore.parent === a.parent && nbBefore.letterCursor === a.letterCursor && nbBefore.student.length > 1000; })());
  ok("Yes writes once: one root-level update with exactly the 2 paths", r === true && w.G.writes.length === 1 && w.G.writes[0][0] === "update" && Object.keys(w.G.writes[0][2]).sort().join() === ["unitStudies/" + UNIT + "/enrolled/" + KID, "unitStudies/" + UNIT + "/kidStage/" + KID].sort().join(), w.G.writes.map(x => x[0] + ":" + x[1]));
  ok("his 113 cards, 71 saved entries, settings and notebook cursors are byte-identical afterwards", [w.G.masteryData.julian, w.G.masteryData.julian_custom_items, w.G.masteryData.julian_settings, w.G.notebookSettings].map(x => JSON.stringify(x)).join("|") === before.join("|"));
  ok("he is in the unit with his Stage 1 marker", w.G.unitStudies[UNIT].enrolled.julian === true && w.G.unitStudies[UNIT].kidStage.julian.stage === 1);
  const st = w.unitStageStatus(w.G.unitStudies[UNIT], KID);
  ok("the stage row reads 13 of 26 on the ladder, 3 learning, not ready; next = Stage 2 (Little letters)", st && st.total === 26 && st.on === 13 && st.learn === 3 && !st.ready && st.next && st.next.n === 2, st);
  ok("his list is still the 26 capitals, in order", w.mastFullBank(KID)[D].join() === JBANK.Letters.join());
  ok("tapping again: already hooked up; the stock enroll is open again for him", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why) && w.uaLocked(w.G.unitStudies[UNIT], KID) === false);
}

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res)); ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg)); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, KID); ok("no database: nothing written", w.uaApplyAttach(w.view.plan) === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaAttachOpen(UNIT, KID); ok("not Mom: no panel, no write", w.view === null && w.uaApplyAttach(w.uaPlanAttach(UNIT, KID)) === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const seen = w.view.plan; w.G.unitStudies[UNIT].kidStage = { julian: { stage: 1 } };   // another device hooked him up meanwhile
  ok("data changed since the plan was shown: nothing written, the new plan (a refusal) shows with a note", w.uaApplyAttach(seen) === false && w.G.writes.length === 0 && /changed/.test(w.view.msg) && !w.view.plan.ok); }
{ const w = world({ noUnit: true }); ok("unit not in the database: refuses", !w.uaPlanAttach(UNIT, KID).ok && /Add this unit first/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); w.G.unitStudies[UNIT].enrolled = { julian: true }; ok("already enrolled: refuses", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); w.G.masteryData.julian[10] = { id: "jul_zz", subject: D, prompt: "Ä", answer: "", status: "active", tier: "weekly" }; const P = w.uaPlanAttach(UNIT, KID); ok("a Letters card that isn't a capital stops the plan (no strayOk on this row)", !P.ok && /Ä/.test(P.why) && P.writes.length === 0); }
{ const w = world(); ok("Caleb (no row on this unit): 'hooks up in a later step'", /later step/.test(w.uaPlanAttach(UNIT, OTHER).why)); }

console.log("\n── the stock enroll is closed for him, open for a kid without a row ──");
{ const w = world(), u = w.G.unitStudies[UNIT];
  ok("uaLocked: Julian yes; Caleb no", w.uaLocked(u, KID) === true && w.uaLocked(u, OTHER) === false);
  ok("_ustApply returns null for Julian (no placed cards, nothing overwritten)", w._ustApply(u, KID, 1, "", "", "") === null && w.G.masteryData.julian.length === FX.itemsLength);
  ok("…but still seeds Caleb at stage 1 (stock path untouched for a kid without a row)", (r => r && Object.keys(r.iu).length > 0)(w._ustApply(u, OTHER, 1, "", "", "")));
  w.unitStageFormOpen(UNIT, KID); ok("the stock '+ Julian' form doesn't open", w.form === null);
  w.unitStageFormOpen(UNIT, OTHER); ok("…the stock '+ Caleb' form does", w.form && w.form.kid === OTHER);
  const w2 = world(), h = w2._unitStageRowsHtml(w2.G.unitStudies[UNIT], [KID, OTHER]);
  ok("his row shows 🔗 Hook up Julian; Caleb keeps + Caleb", /Hook up Julian/.test(h) && !/\+ Julian/.test(h) && /\+ Caleb/.test(h));
  w.uaAttachOpen(UNIT, KID); const h2 = w._unitStageRowsHtml(u, [KID]);
  ok("the plan panel: 16 Letters cards stay, Stage 1 · Big letters, adds nothing, 2 saved changes, Yes + Cancel", /16 Letters cards stay exactly as they are/.test(h2) && /Stage 1 · Big letters/.test(h2) && /Adds nothing to the list/.test(h2) && /2 saved changes/.test(h2) && /Yes, hook up Julian/.test(h2) && /Cancel/.test(h2), h2.slice(0, 900));
  ok("no 'her'/'she' in the panel (Julian)", !/\b(her|she)\b/i.test(h2));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
