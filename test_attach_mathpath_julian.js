/*
 * Node tests — 🔗 Units switch-over step 6: hook up Julian to the Math Fluency Path, stage 2 (Numbers 11–20).
 * PLAN_units_switchover_order_2026-10-25.md step 6 · PLAN_attach_julian_2026-10-26.md. One UA_ATTACH row with fill:false
 * (her call assumed: enroll only — the order doc's "18 Counting bank entries — only if you say so"). Replays the shared
 * read-only snapshot (test_fixtures/attach_julian_2026-10-26.json) when present; otherwise a made-up Julian.
 *   · ZERO card writes, ZERO bank writes: exactly enrolled + kidStage;
 *   · 7 of his Numbers cards (11–17) are stage-2 cards; his Numbers 1–10 and Counting one–ten (20 cards) are stage-1 →
 *     kept, counted as "earlier"; no stray; all byte-identical after, as are his saved list, settings and cursors;
 *   · next week's notebook, built before and after, is byte-identical (the numbers front reads the deck + numberCursor);
 *   · fill:false → stage-2 Counting words (eleven–twenty) are NOT appended (flipping the row's fill would add exactly those 10);
 *   · refusals write nothing; stock enroll closed for him on this unit, open for Caleb (test_unit_stages.js keeps the stock
 *     path covered with Caleb as its sample kid).
 *   run: node test_attach_mathpath_julian.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "attach_julian_2026-10-26.json");
const UNIT = "math_fluency_path", KID = "julian", OTHER = "caleb";
const nbsrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"); global.window = global.window || {}; eval(nbsrc); const NB = window.HoweNotebooks;
const NB_CTX = (items, FX) => ({ weekNum: "week29", weekDates: "Oct 26 – Oct 30", weekData: { dates: { monday: "Oct 26", tuesday: "Oct 27", wednesday: "Oct 28", thursday: "Oct 29", friday: "Oct 30" }, tasks: [] }, masteryItems: items, letterCursor: (FX.notebookSettings || {}).letterCursor, numberCursor: (FX.notebookSettings || {}).numberCursor });
const nbBuild = (items, FX) => { const o = NB.generate("julian", NB_CTX(items, FX)); return { student: o.student, parent: o.parent, letterCursor: JSON.stringify(o.letterCursor), numberCursor: JSON.stringify(o.numberCursor) }; };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const JBANK = { Letters: "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(","), Numbers: Array.from({ length: 20 }, (_, i) => String(i + 1)), Shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star", "Heart", "Diamond", "Oval"], Counting: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"] };
const TEENS = ["eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else {
  synthetic = true; const cards = {}; const N = { 3: "1", 4: "2", 5: "3", 19: "4", 20: "5", 30: "6", 33: "7", 41: "8", 48: "9", 53: "10", 72: "11", 77: "12", 84: "13", 94: "14", 97: "15", 106: "16", 112: "17" }, C = { 37: "one", 38: "two", 39: "three", 55: "four", 56: "five", 57: "six", 78: "seven", 79: "eight", 81: "nine", 93: "ten" };
  Object.keys(N).forEach(i => { const learn = ["15", "16", "17"].includes(N[i]); cards[i] = { id: "jul_n" + N[i], subject: "Numbers", prompt: N[i], status: learn ? "introduction" : "active", tier: learn ? "daily" : "monthly", review_mode: "flash" }; if (!learn) cards[i].next_due = 230; });
  Object.keys(C).forEach(i => { cards[i] = { id: "jul_c" + C[i], subject: "Counting", prompt: C[i], status: "active", tier: "monthly", review_mode: "flash", next_due: 230 }; });
  FX = { itemsLength: 113, cards, customLength: 71, customNull: [], custom: {}, settings: { cat_modes: {}, cat_intro_max: {}, auto_pull: true, max_intro_per_cat: 3, cat_gate: [], cat_hold: null }, bankOrder: {}, units: null, unitMeta: null, notebookSettings: { letterCursor: { adv: 3, idx: 1, week: 27 }, numberCursor: { adv: 4, from: 14, week: 27 } } };
}
console.log(synthetic ? "(no snapshot file — made-up Julian)" : "(replaying " + path.basename(FXP) + ")");

function world(o) {
  o = o || {};
  const items = new Array(FX.itemsLength).fill(null).map((_, i) => FX.cards[i] ? JSON.parse(JSON.stringify(FX.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i, status: "active", tier: "weekly" });
  const cust = new Array(FX.customLength).fill(null).map((_, i) => FX.custom[i] ? JSON.parse(JSON.stringify(FX.custom[i])) : { cat: "Other", name: "n" + i });
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry, notebookSettings: { julian: JSON.parse(JSON.stringify(FX.notebookSettings || {})) },
    masteryData: { julian: items, julian_custom_items: cust, julian_settings: JSON.parse(JSON.stringify(FX.settings)), julian_bank_order: {}, caleb: [], caleb_custom_items: [], caleb_settings: {}, lucy: [], lucy_custom_items: [], lucy_settings: {}, ellis: [], ellis_custom_items: [], ellis_settings: {}, lincoln: [], lincoln_custom_items: [], lincoln_settings: {} },
    currData: { subjects: { julian: {}, caleb: {}, lucy: {}, ellis: {}, lincoln: {} }, done: {} }, unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "JBANK", `
    const masteryData=G.masteryData, currData=G.currData, notebookSettings=G.notebookSettings; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="julian"; function subjName(k,s){ return s; }
    const MAST_BANK_MAP={julian:JBANK,caleb:{},lucy:{},ellis:{},lincoln:{}}; ${VOCAB}
    ${GATE}
    ${block}
    return { STARTER_UNITS, UA_ATTACH, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachClose, uaAttachHtml, _unitStageRowsHtml, _ustApply, _ustCards, unitStageStatus, mastBankEligible, mastFullBank,
      unitStageFormOpen, unitStageEnroll, get view(){ return uaAttachView; }, get form(){ return unitStageForm; } };`)(G, db, JBANK);
  if (!o.noUnit) G.unitStudies[UNIT] = w.STARTER_UNITS.math_fluency_path();
  w.G = G; return w;
}
const stageN = (w, n) => w._ustCards(w.G.unitStudies[UNIT], n);

(async () => {
console.log("── the row ──");
ok("UA_ATTACH.math_fluency_path has Julian → stage 2, fill:false, no strayOk — beside Lucy 6, Ellis 7, Lincoln 8", (t => Object.keys(t.math_fluency_path).sort().join() === "ellis,julian,lincoln,lucy" && t.math_fluency_path.julian.stage === 2 && t.math_fluency_path.julian.fill === false && !t.math_fluency_path.julian.strayOk)(world().UA_ATTACH));

console.log("\n── his data vs the unit ──");
{ const w = world(), s1 = stageN(w, 1), s2 = stageN(w, 2);
  ok("code starter stage 1 = Numbers 1–10 + Counting one–ten (20); stage 2 = Numbers 11–20 + Counting eleven–twenty (20)", s1.length === 20 && s2.length === 20 && s2.filter(c => c._dk === "Numbers").map(c => c.name).join() === "11,12,13,14,15,16,17,18,19,20" && s2.filter(c => c._dk === "Counting").map(c => c.name).join() === TEENS.join());
  if (FX.units) ok("…and matches the live unit record's Numbers + Counting decks (names, stages, order)", ["Numbers", "Counting"].every(k => JSON.stringify(FX.units.math_fluency_path.decks.find(d => d.key === k).cards.map(c => [c.name, c.stage])) === JSON.stringify(w.G.unitStudies[UNIT].decks.find(d => d.key === k).cards.slice().sort((a, b) => a.order - b.order).map(c => [c.name, c.stage]))));
  const nums = Object.values(FX.cards).filter(c => c.subject === "Numbers"), cnt = Object.values(FX.cards).filter(c => c.subject === "Counting");
  ok("his cards: Numbers 1–17 (7 of them stage 2: 11–17; 15 16 17 learning) and Counting one–ten (all stage 1)", nums.length === 17 && nums.map(c => +c.prompt).sort((a, b) => a - b).join() === Array.from({ length: 17 }, (_, i) => i + 1).join() && nums.filter(c => c.status === "introduction").map(c => c.prompt).sort().join() === "15,16,17" && cnt.length === 10 && cnt.every(c => JBANK.Counting.includes(c.prompt)));
  ok("his list: Numbers 1–20 = the unit's 20; Counting one–ten only (the teens are not on his list)", JBANK.Numbers.length === 20 && !TEENS.some(t => JBANK.Counting.includes(t)) && !Object.values(FX.custom).some(e => e.cat === "Numbers" || e.cat === "Counting"));
  ok("his number cursor is the one the plan leaves alone: numberCursor {from 14, week 27}", FX.notebookSettings && FX.notebookSettings.numberCursor && FX.notebookSettings.numberCursor.from === 14, FX.notebookSettings);
}

console.log("\n── the plan ──");
const w = world(), P = w.uaPlanAttach(UNIT, KID, 1761490000000);
ok("plan is ready for Julian, stage 2 · Numbers 11–20, decks Numbers + Counting", P.ok && P.sum.stage === 2 && P.sum.label === "Numbers 11–20" && P.sum.decks.sort().join() === "Counting,Numbers", P.why);
ok("7 stage-2 cards kept (4 on the ladder, 3 learning); 20 EARLIER-stage cards kept too; no stray", P.sum.liveKept === 7 && P.sum.onLadder === 4 && P.sum.learning === 3 && P.sum.earlier === 20 && P.sum.stray.length === 0, P.sum);
ok("fill:false → adds NOTHING (the 10 teen Counting words stay off his list)", P.sum.added.length === 0);
ok("his next new cards don't change: 18, 19, 20 (Numbers), nothing from Counting", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10Before.join() === "18,19,20", P.sum.next10Before);
ok("EXACTLY 2 writes: enrolled/julian, kidStage/julian {stage 2, via attach}", P.writes.length === 2 && P.writes[0].path === "unitStudies/" + UNIT + "/enrolled/" + KID && P.writes[1].path === "unitStudies/" + UNIT + "/kidStage/" + KID && P.writes[1].value.stage === 2 && P.writes[1].value.via === "attach", P.writes);
{ const w2 = world(); w2.UA_ATTACH.math_fluency_path.julian = { stage: 2, fill: true }; const Q = w2.uaPlanAttach(UNIT, KID);
  ok("(if she says so) fill:true would add exactly the 10 teen Counting words after his saved list — 12 writes", Q.ok && Q.sum.added.join() === TEENS.join() && Q.writes.length === 12 && Q.writes.filter(x => /custom_items/.test(x.path)).every(x => x.value.cat === "Counting"), Q.sum.added); }

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const before = [w.G.masteryData.julian, w.G.masteryData.julian_custom_items, w.G.masteryData.julian_settings, w.G.notebookSettings].map(x => JSON.stringify(x)); const nbBefore = nbBuild(w.G.masteryData.julian, FX);
  w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("Yes writes once: one update with exactly the 2 paths", r === true && w.G.writes.length === 1 && Object.keys(w.G.writes[0][2]).length === 2);
  ok("his 113 cards (numeric prompts, statuses), saved list, settings, cursors byte-identical", [w.G.masteryData.julian, w.G.masteryData.julian_custom_items, w.G.masteryData.julian_settings, w.G.notebookSettings].map(x => JSON.stringify(x)).join("|") === before.join("|"));
  const nbAfter = nbBuild(w.G.masteryData.julian, FX);
  ok("next week's notebook (week 29), built before and after: student and parent pages byte-identical, number cursor identical", nbBefore.student === nbAfter.student && nbBefore.parent === nbAfter.parent && nbBefore.numberCursor === nbAfter.numberCursor && nbBefore.student.length > 1000);
  const st = w.unitStageStatus(w.G.unitStudies[UNIT], KID);
  ok("the stage row reads 4 of 20 on the ladder, 3 learning, not ready; next = Stage 3 (More & less)", st && st.total === 20 && st.on === 4 && st.learn === 3 && !st.ready && st.next && st.next.n === 3, st);
  ok("tapping again: already hooked up; stock enroll open again for him", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why) && w.uaLocked(w.G.unitStudies[UNIT], KID) === false);
}

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res)); ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg)); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, KID); ok("no database: nothing written", w.uaApplyAttach(w.view.plan) === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaAttachOpen(UNIT, KID); ok("not Mom: no panel, no write", w.view === null && w.uaApplyAttach(w.uaPlanAttach(UNIT, KID)) === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const seen = w.view.plan; w.G.unitStudies[UNIT].kidStage = { julian: { stage: 2 } }; ok("data changed since the plan was shown: nothing written, the new plan (a refusal) shows", w.uaApplyAttach(seen) === false && w.G.writes.length === 0 && /changed/.test(w.view.msg)); }
{ const w = world({ noUnit: true }); ok("unit not in the database: refuses", /Add this unit first/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); w.G.masteryData.julian[10] = { id: "jul_zz", subject: "Numbers", prompt: "21", status: "active", tier: "weekly" }; const P = w.uaPlanAttach(UNIT, KID); ok("a Numbers card in no stage (21) is stray → refused (no strayOk on this row)", !P.ok && /21/.test(P.why)); }
{ const w = world(); ok("Caleb (no row): 'hooks up in a later step'", /later step/.test(w.uaPlanAttach(UNIT, OTHER).why)); }

console.log("\n── the stock enroll is closed for him, open for Caleb ──");
{ const w = world(), u = w.G.unitStudies[UNIT];
  ok("uaLocked: Julian yes (Lucy, Ellis, Lincoln too); Caleb no", w.uaLocked(u, KID) === true && w.uaLocked(u, "lucy") === true && w.uaLocked(u, "ellis") === true && w.uaLocked(u, "lincoln") === true && w.uaLocked(u, OTHER) === false);
  ok("_ustApply returns null for Julian; still seeds Caleb at stage 1", w._ustApply(u, KID, 2, "", "", "") === null && (r => r && Object.keys(r.iu).length > 0)(w._ustApply(u, OTHER, 1, "", "", "")));
  w.unitStageFormOpen(UNIT, KID); ok("the stock '+ Julian' form doesn't open", w.form === null);
  const w2 = world(), h = w2._unitStageRowsHtml(w2.G.unitStudies[UNIT], ["julian", "lucy", "ellis", "lincoln", OTHER]);
  ok("every Howe kid's row shows 🔗 Hook up; Caleb keeps + Caleb", /Hook up Julian/.test(h) && /Hook up Lucy/.test(h) && /Hook up Ellis/.test(h) && /Hook up Lincoln/.test(h) && /\+ Caleb/.test(h) && !/\+ (Julian|Lucy|Ellis|Lincoln)/.test(h));
  w.uaAttachOpen(UNIT, KID); const h2 = w._unitStageRowsHtml(u, [KID]);
  ok("the plan panel: 7 Numbers, Counting cards stay, Stage 2 · Numbers 11–20, '20 cards from earlier stages stay', adds nothing, 2 saved changes", /7 Numbers, Counting cards stay exactly as they are/.test(h2) && /Stage 2 · Numbers 11–20/.test(h2) && /20 cards from earlier stages stay exactly as they are too/.test(h2) && /Adds nothing to the list/.test(h2) && /2 saved changes/.test(h2) && /Yes, hook up Julian/.test(h2), h2.slice(0, 900));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
