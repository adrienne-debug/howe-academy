/*
 * Node tests — 🔗 Units switch-over step 2: hook up Ellis to the Math Fluency Path, stage 7 (× and ÷ facts).
 * PLAN_units_switchover_order_2026-10-25.md step 2 · PLAN_attach_mathpath_ellis_2026-10-25.md. One UA_ATTACH row; the
 * UNITATTACH engine from step 1 does the rest. Replays the read-only snapshot of his Math Facts data
 * (test_fixtures/mathpath_ellis_2026-10-25.json, 2026-10-26 03:03 UTC) when it is present; otherwise a made-up Ellis
 * built from his built-in list + the 8 saved facts (same shape, same counts).
 *   · his 13 cards are byte-identical after the attach — nothing under mastery/ellis is ever written;
 *   · exactly enrolled + kidStage + 266 appended {cat,name} entries, starting right after his saved list (889…1154); no def, no ch;
 *   · ellis_bank_order is never written: his own 47 stay first in his own order, the new facts come after;
 *   · afterwards every stage-7 fact is in his list once; his next ten new cards are the same before and after;
 *   · dry run, non-Mom, "data changed", no-unit, already-hooked and stray-card refusals write nothing;
 *   · the stock "+ Ellis" enroll is closed for him on this unit; Julian and Lincoln keep the stock button.
 * Runs the real STARTER_UNITS block + the real bank/gate functions sliced from index.html.   run: node test_attach_mathpath_ellis.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "mathpath_ellis_2026-10-25.json");
const D = "Math Facts", UNIT = "math_fluency_path", KID = "ellis";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const ELLIS_CODE = (() => { const i = src.indexOf("const MAST_ELLIS_BANK"); const j = src.indexOf('"Math Facts":', i); return JSON.parse(src.slice(src.indexOf("[", j), src.indexOf("]", j) + 1)); })();
const SAVED8 = ["9×4", "8×4", "4×8", "4×9", "4×3", "3×4", "9×3", "3×9"];   // his 8 saved 3s/4s (ellis_custom_items 310–317)
const LIVE13 = { 5: "6×7", 6: "7×8", 7: "8×9", 23: "9×6", 30: "6×8", 31: "7×9", 61: "8×6", 65: "9×7", 66: "6×9", 112: "12×11", 198: "12×9", 222: "12×7", 242: "12×6" };
const ORDER47 = ["6×7", "7×8", "8×9", "9×6", "6×8", "7×9", "8×6", "9×7", "6×9", "12×11", "12×9", "12×7", "12×6", "12×8", "3×9", "9×3", "3×4", "4×3", "9×4", "4×9", "4×8", "8×4", "7×7", "8×8", "9×9", "12×12", "11×6", "11×7", "11×8", "11×9", "11×11", "48÷6", "56÷7", "72÷8", "54÷9", "63÷7", "81÷9", "64÷8", "42÷6", "49÷7", "36÷6", "108÷9", "132÷12", "144÷12", "96÷8", "84÷7", "72÷6"];
const ans = n => { const m = n.match(/^(\d+)([×÷])(\d+)$/); return String(m[2] === "×" ? (+m[1]) * (+m[3]) : (+m[1]) / (+m[3])); };

// ── the snapshot, or a made-up Ellis of the same shape ──
let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else {
  synthetic = true;
  const cards = {}; Object.keys(LIVE13).forEach(i => { const n = LIVE13[i], learn = n === "12×7" || n === "12×6";
    cards[i] = { id: "ell_" + n.replace(/[×÷]/g, "_"), subject: D, type: "math facts", prompt: n, answer: ans(n), review_mode: "flash", status: learn ? "introduction" : "active", tier: learn ? "daily" : "monthly", tally_dots: learn ? 1 : 3, consecutive_correct: 0, cycle: 1, drop_count: 0 }; if (!learn) cards[i].next_due = 220 + (+i % 10); });
  const custom = {}; SAVED8.forEach((n, k) => { custom[310 + k] = { cat: D, name: n }; });
  FX = { itemsLength: 256, cards, customLength: 889, customNull: [22], custom, settings: { cat_modes: { Spelling: "spell" }, cat_intro_max: {}, auto_pull: true, max_intro_per_cat: 2, cat_gate: [], cat_hold: null }, bankOrder: { [D]: ORDER47.slice() }, unitStage7: null, unitMeta: null };
}
console.log(synthetic ? "(no snapshot file — made-up Ellis)" : "(replaying " + path.basename(FXP) + ")");

function world(o) {
  o = o || {};
  const items = new Array(FX.itemsLength).fill(null).map((_, i) => FX.cards[i] ? JSON.parse(JSON.stringify(FX.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i, status: "active", tier: "weekly" });
  const nulls = FX.customNull || [];
  const cust = new Array(FX.customLength).fill(null).map((_, i) => FX.custom[i] ? JSON.parse(JSON.stringify(FX.custom[i])) : (nulls.indexOf(i) >= 0 ? null : { cat: "Other", name: "n" + i }));
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry,
    masteryData: { ellis: items, ellis_custom_items: cust, ellis_settings: JSON.parse(JSON.stringify(FX.settings)), ellis_bank_order: JSON.parse(JSON.stringify(FX.bankOrder || {})),
      lucy: [], lucy_custom_items: [], lucy_settings: {}, julian: [], julian_custom_items: [], julian_settings: {}, lincoln: [], lincoln_custom_items: [], lincoln_settings: {} },
    currData: { subjects: { ellis: {}, lucy: {}, julian: {}, lincoln: {} }, done: {} }, unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "ELLIS_CODE", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="ellis"; function subjName(k,s){ return s; }
    const MAST_BANK_MAP={ellis:{"Math Facts":ELLIS_CODE},lucy:{},julian:{},lincoln:{}}; ${VOCAB}
    ${GATE}
    ${block}
    return { STARTER_UNITS, UA_ATTACH, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachClose, uaAttachHtml, _unitStageRowsHtml, _ustApply, _ustCards, unitStageStatus, mastBankEligible, mastFullBank,
      unitStageFormOpen, unitStageEnroll, get view(){ return uaAttachView; }, get form(){ return unitStageForm; } };`)(G, db, ELLIS_CODE);
  if (!o.noUnit) G.unitStudies[UNIT] = w.STARTER_UNITS.math_fluency_path();
  w.G = G; return w;
}
const stage7 = w => w._ustCards(w.G.unitStudies[UNIT], 7);

(async () => {
console.log("── the row ──");
ok("UA_ATTACH has Ellis → Math Fluency Path, stage 7, fill, no strayOk — beside Lucy's, Lincoln's and Julian's rows (steps 1, 3, 6)", (t => Object.keys(t).filter(u => u === UNIT).length === 1 && Object.keys(t[UNIT]).sort().join() === "ellis,julian,lincoln,lucy" && t[UNIT].ellis.stage === 7 && t[UNIT].ellis.fill === true && !t[UNIT].ellis.strayOk && t[UNIT].lucy.stage === 6)(world().UA_ATTACH));
ok("one UNITATTACH block, one UA_ATTACH table (the step adds a row, not code)", src.split("// UNITATTACH_START").length === 2 && src.split("const UA_ATTACH=").length === 2);

console.log("\n── his data vs the unit ──");
{ const w = world(), s7 = stage7(w), names = s7.map(c => c.name);
  ok("stage 7 of the code starter = 313 × and ÷ facts in 13 families (0s … 12s)", s7.length === 313 && new Set(s7.map(c => c.family)).size === 13 && s7[0].name === "0×0" && s7[312].name === "144÷12", [s7.length, s7[0], s7[312]]);
  if (FX.unitStage7) ok("…and matches the live unit record (names, answers, order)", JSON.stringify(FX.unitStage7.map(c => [c.name, String(c.def)])) === JSON.stringify(s7.map(c => [c.name, String(c.def)])));
  if (FX.unitMeta) ok("the live unit record: starter v1, nbInsert false, nobody enrolled, no kidStage", FX.unitMeta.starterVer === 1 && FX.unitMeta.nbInsert === false && !FX.unitMeta.enrolled && !FX.unitMeta.kidStage, FX.unitMeta);
  ok("all 39 facts on his built-in list are stage-7 facts, no duplicates", ELLIS_CODE.length === 39 && ELLIS_CODE.every(n => names.includes(n)) && new Set(ELLIS_CODE).size === 39);
  const saved = Object.keys(FX.custom).sort((a, b) => a - b).map(i => FX.custom[i]);
  ok("his saved list holds exactly the 8 3s/4s facts (310–317), stage-7 facts, no def, no ch", saved.length === 8 && Object.keys(FX.custom).sort((a, b) => a - b).join() === "310,311,312,313,314,315,316,317" && saved.every(e => e.cat === D && names.includes(e.name) && e.def == null && e.ch == null) && saved.map(e => e.name).join() === SAVED8.join(), saved);
  const live = Object.values(FX.cards);
  ok("his 13 Math Facts cards are all stage-7 facts with the path's answers (× only — no ÷ card yet)", live.length === 13 && live.every(c => c.subject === D && names.includes(c.prompt) && String(s7.find(x => x.name === c.prompt).def) === String(c.answer)) && live.every(c => /×/.test(c.prompt)));
  ok("2 learning (12×7, 12×6), 11 on the ladder", live.filter(c => c.status === "introduction").map(c => c.prompt).sort().join() === "12×6,12×7" && live.filter(c => c.status !== "introduction" && c.status !== "parked").length === 11);
  ok("his bank order lists exactly his 47 (39 built-in + 8 saved), starting at the 6s", FX.bankOrder[D].length === 47 && new Set(FX.bankOrder[D]).size === 47 && FX.bankOrder[D].every(n => ELLIS_CODE.includes(n) || SAVED8.includes(n)) && FX.bankOrder[D][0] === "6×7", FX.bankOrder[D]);
  ok("the live list is " + FX.customLength + " long (one null at 22), so the new facts start at " + FX.customLength, FX.customLength === 889 && (FX.customNull || []).join() === "22");
  ok("no Math Facts cat_modes / cat_intro_max / cat_gate / cat_hold on his settings (the deck runs on the quiz default, 2 at a time)", !(FX.settings.cat_modes || {})[D] && !(FX.settings.cat_intro_max || {})[D] && (FX.settings.cat_gate || []).indexOf(D) < 0 && !FX.settings.cat_hold && FX.settings.max_intro_per_cat === 2);
}

console.log("\n── the plan ──");
const w = world(), P = w.uaPlanAttach(UNIT, KID, 1761450000000);
ok("plan is ready for Ellis, stage 7 · × and ÷ facts", P.ok && P.sum.stage === 7 && P.sum.label === "× and ÷ facts", P.why);
ok("13 cards kept: 11 on the ladder, 2 learning", P.sum.liveKept === 13 && P.sum.onLadder === 11 && P.sum.learning === 2, P.sum);
ok("no answer differs, no stray card", P.sum.backDiffers.length === 0 && P.sum.stray.length === 0, P.sum.backDiffers);
ok("adds 266 facts (313 − his 47), every one a stage-7 fact he doesn't have", P.sum.added.length === 266 && P.sum.added.every(n => !ELLIS_CODE.includes(n) && !SAVED8.includes(n)) && new Set(P.sum.added).size === 266, P.sum.added.length);
ok("…in the path's order (the 0s first: 0×0, 0×1, 0×2 …; 120÷12 last)", P.sum.added.slice(0, 3).join() === "0×0,0×1,0×2" && P.sum.added.slice(-2).join() === "108÷12,120÷12", [P.sum.added.slice(0, 5), P.sum.added.slice(-3)]);
ok("by family: 0s 25 · 1s 24 · 2s 24 · 3s 22 · 4s 21 · 5s 24 · 6s 17 · 7s 17 · 8s 17 · 9s 16 · 10s 24 · 11s 19 · 12s 16", (f => [25, 24, 24, 22, 21, 24, 17, 17, 17, 16, 24, 19, 16].every((n, k) => f["× ÷ · " + k + "s"] === n))(P.sum.added.reduce((a, n) => { const c = stage7(w).find(x => x.name === n); a[c.family] = (a[c.family] || 0) + 1; return a; }, {})));
ok("his next ten new cards don't change: 12×8, 3×9, 9×3, 3×4, 4×3, 9×4, 4×9, 4×8, 8×4, 7×7 (his own order)", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10Before.join() === "12×8,3×9,9×3,3×4,4×3,9×4,4×9,4×8,8×4,7×7", [P.sum.next10Before, P.sum.next10After]);

console.log("\n── the write list ──");
const paths = P.writes.map(x => x.path);
ok("268 writes: enrolled, kidStage, 266 appended entries", P.writes.length === 268, P.writes.length);
ok("every write is a targeted path (no whole-node set)", paths.every(p => p === "unitStudies/" + UNIT + "/enrolled/ellis" || p === "unitStudies/" + UNIT + "/kidStage/ellis" || /^mastery\/ellis_custom_items\/\d+$/.test(p)), paths.filter(p => !/enrolled|kidStage|custom_items/.test(p)));
ok("never mastery/ellis (cards), cat_modes, cat_intro_max, definitions, cat_gate, bank_order, notebookSettings, curriculum or another kid", !paths.some(p => /^mastery\/ellis\//.test(p) || /cat_modes|cat_intro_max|definitions|cat_gate|cat_hold|bank_order|notebookSettings|curriculum|julian|lucy|lincoln/.test(p)));
ok("no two writes overlap", paths.every(a => !paths.some(b => b !== a && b.startsWith(a + "/"))));
ok("enrolled = true", P.writes.find(x => /enrolled/.test(x.path)).value === true);
ok("kidStage = {stage 7, no subject/knows/map, via attach}", (v => v.stage === 7 && v.subject === "" && v.knows === "" && v.map === "" && v.via === "attach" && v.ts === 1761450000000)(P.writes.find(x => /kidStage/.test(x.path)).value));
const appends = P.writes.filter(x => /custom_items/.test(x.path));
ok("appended entries are exactly {cat:'Math Facts', name} — never a def, never ch", appends.length === 266 && appends.every(x => Object.keys(x.value).sort().join() === "cat,name" && x.value.cat === D));
ok("appends start right after his last saved entry and run without gaps (" + FX.customLength + " … " + (FX.customLength + 265) + ") — the null at 22 is left alone", appends.map(x => +x.path.split("/")[2]).join() === appends.map((_, k) => FX.customLength + k).join() && !paths.includes("mastery/ellis_custom_items/22"));
ok("every write has a plain-words 'what'", P.writes.every(x => typeof x.what === "string" && x.what.length > 8));

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const before = JSON.stringify(w.G.masteryData.ellis), orderBefore = JSON.stringify(w.G.masteryData.ellis_bank_order), setBefore = JSON.stringify(w.G.masteryData.ellis_settings); const P = w.uaPlanAttach(UNIT, KID, 1);
  w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("Yes writes once: one root-level update carrying exactly the plan's paths", r === true && w.G.writes.length === 1 && w.G.writes[0][0] === "update" && w.G.writes[0][1] === "" && JSON.stringify(Object.keys(w.G.writes[0][2]).sort()) === JSON.stringify(P.writes.map(x => x.path).sort()), w.G.writes.map(x => x[0] + ":" + x[1]));
  ok("his " + FX.itemsLength + " cards are byte-identical afterwards", JSON.stringify(w.G.masteryData.ellis) === before);
  ok("his bank order and his settings are byte-identical afterwards (kept, not rewritten)", JSON.stringify(w.G.masteryData.ellis_bank_order) === orderBefore && JSON.stringify(w.G.masteryData.ellis_settings) === setBefore);
  ok("he is in the unit with his Stage 7 marker", w.G.unitStudies[UNIT].enrolled.ellis === true && w.G.unitStudies[UNIT].kidStage.ellis.stage === 7);
  const bank = w.mastFullBank(KID)[D], names = stage7(w).map(c => c.name);
  ok("afterwards every stage-7 fact is in his list exactly once — his own 47 first, in HIS order, then the 266", bank.length === 313 && names.every(n => bank.includes(n)) && new Set(bank).size === 313 && bank.slice(0, 47).join() === FX.bankOrder[D].join() && bank[47] === "0×0", [bank.length, bank.slice(44, 50)]);
  ok("his saved list is " + (FX.customLength + 266) + " entries, " + FX.customLength + "… the new facts, the first " + FX.customLength + " untouched", w.G.masteryData.ellis_custom_items.length === FX.customLength + 266 && w.G.masteryData.ellis_custom_items[FX.customLength].name === "0×0" && w.G.masteryData.ellis_custom_items.slice(0, FX.customLength).filter(Boolean).filter(e => e.cat === D).length === 8);
  const st = w.unitStageStatus(w.G.unitStudies[UNIT], KID);
  ok("the stage row reads 11 of 313 on the ladder, 2 learning (12s), not ready to move up; next = stage 8", st && st.total === 313 && st.on === 11 && st.learn === 2 && /12s/.test(st.fam) && !st.ready && st.next && st.next.n === 8, st);
  ok("the panel closed and the page re-rendered", w.view === null && w.G.rendered >= 2);
  ok("the eligible list after = his 47 then the 266, so the next new card is still 12×8", (el => el.filter(n => !Object.values(FX.cards).some(c => c.prompt === n))[0] === "12×8")(w.mastBankEligible(KID, D)));
  ok("tapping again says he's already hooked up", !w.uaPlanAttach(UNIT, KID).ok && /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why));
  ok("…and the stock enroll is open again for him (the hook-up was the only lock)", w.uaLocked(w.G.unitStudies[UNIT], KID) === false);
}

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg) && !w.G.unitStudies[UNIT].enrolled); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); ok("no database: nothing written", r === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.uaPlanAttach(UNIT, KID)); ok("not Mom: the panel doesn't open and Yes writes nothing", w.view === null && r === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const seen = w.view.plan; w.G.masteryData.ellis_custom_items.push({ cat: D, name: "0×0" });   // his data moves under the plan
  const r = w.uaApplyAttach(seen); ok("data changed since the plan was shown: nothing written, the new plan shows with a note (267 writes now)", r === false && w.G.writes.length === 0 && /changed/.test(w.view.msg) && w.view.plan.writes.length === 267); }
{ const w = world({ noUnit: true }); const P = w.uaPlanAttach(UNIT, KID); ok("unit not in the database: refuses ('Add this unit first')", !P.ok && /Add this unit first/.test(P.why) && P.writes.length === 0); }
{ const w = world(); w.G.unitStudies[UNIT].enrolled = { ellis: true }; ok("already enrolled: refuses", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); w.G.masteryData.ellis[10] = { id: "ell_half", subject: D, prompt: "½ of 10", answer: "5", status: "active", tier: "weekly" };
  const P = w.uaPlanAttach(UNIT, KID); ok("a Math Facts card that isn't a stage-7 fact stops the plan and names it", !P.ok && /½ of 10/.test(P.why) && /Nothing was changed/.test(P.why), P.why); }
{ const w = world(); w.G.masteryData.ellis[5].answer = "forty-two";   // his 6×7 card with a different back
  const P = w.uaPlanAttach(UNIT, KID); ok("a back that differs is reported and kept — never written", P.ok && P.sum.backDiffers.length === 1 && /6×7/.test(P.sum.backDiffers[0]) && !P.writes.some(x => /^mastery\/ellis\//.test(x.path)), P.sum.backDiffers); }
{ const w = world(); ok("Caleb (no row yet): 'hooks up in a later step'", /later step/.test(w.uaPlanAttach(UNIT, "caleb").why)); }

console.log("\n── the stock enroll is closed for him, open for the kids without a row ──");
{ const w = world(), u = w.G.unitStudies[UNIT];
  ok("uaLocked: Ellis yes (Lucy and Lincoln too, steps 1, 3); Caleb no", w.uaLocked(u, KID) === true && w.uaLocked(u, "lucy") === true && w.uaLocked(u, "lincoln") === true && w.uaLocked(u, "caleb") === false);
  ok("_ustApply returns null for Ellis (no placed cards minted, no settings overwritten)", w._ustApply(u, KID, 7, "", "", "") === null && JSON.stringify(w.G.masteryData.ellis_settings) === JSON.stringify(FX.settings) && w.G.masteryData.ellis.length === FX.itemsLength);
  ok("…but still seeds Caleb at stage 1 (stock path untouched for a kid without a row)", (r => r && Object.keys(r.iu).length > 0)(w._ustApply(u, "caleb", 1, "", "", "")));
  w.unitStageFormOpen(UNIT, KID); ok("the stock '+ Ellis' form doesn't open", w.form === null);
  w.unitStageFormOpen(UNIT, "caleb"); ok("…the stock '+ Caleb' form does", w.form && w.form.kid === "caleb");
  const w2 = world(), h = w2._unitStageRowsHtml(w2.G.unitStudies[UNIT], ["caleb", "lucy", "ellis", "lincoln"]);
  ok("his row shows 🔗 Hook up Ellis (Lucy's and Lincoln's too); Caleb keeps + Kid", /Hook up Ellis/.test(h) && !/\+ Ellis/.test(h) && /Hook up Lucy/.test(h) && /Hook up Lincoln/.test(h) && /\+ Caleb/.test(h) && !/Hook up Caleb/.test(h));
  w.uaAttachOpen(UNIT, KID); const h2 = w._unitStageRowsHtml(u, [KID]);
  ok("the plan panel: 13 cards stay, Stage 7 marker, 266 added, next cards unchanged (12×8 …), 268 saved changes, Yes + Cancel", /13 Math Facts cards stay exactly as they are/.test(h2) && /Stage 7 · × and ÷ facts/.test(h2) && /Adds <b>266<\/b>/.test(h2) && /next new cards don’t change: 12×8/.test(h2) && /268 saved changes/.test(h2) && /Yes, hook up Ellis/.test(h2) && /Cancel/.test(h2) && !/Dry run/.test(h2));
  const wd = world({ dry: true }); wd.uaAttachOpen(UNIT, KID); ok("…and says 'Dry run — Yes writes nothing' under ?dryrun=1", /Dry run — Yes writes nothing/.test(wd._unitStageRowsHtml(wd.G.unitStudies[UNIT], [KID])));
  ok("no 'her'/'she' in the panel (Ellis)", !/\b(her|she)\b/i.test(h2));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
