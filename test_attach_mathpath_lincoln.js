/*
 * Node tests — 🔗 Units switch-over step 3: hook up Lincoln to the Math Fluency Path, stage 8 (fractions, decimals & beyond).
 * PLAN_units_switchover_order_2026-10-25.md step 3 · PLAN_attach_mathpath_lincoln_2026-10-26.md. One UA_ATTACH row with
 * strayOk:true (her §10: his 14 extras — percent-of, order of operations — are his own, not unit words, and stay where they
 * are); the UNITATTACH engine from step 1 does the rest. Replays the read-only snapshot (test_fixtures/
 * mathpath_lincoln_2026-10-26.json, 2026-10-26 12:47 UTC) when present; otherwise a made-up Lincoln of the same shape.
 *   · his 4 cards are byte-identical after — the two backs that differ from the path ("0.333… (3 repeating)") are
 *     reported and KEPT; nothing under mastery/lincoln or his definitions is ever written;
 *   · exactly enrolled + kidStage + 190 appended {cat,name} entries (211 − his 21 stage-8 words), 1281…1470; no def, no ch;
 *   · the 14 extras stay in his list; an extra that has become a card is listed as "left as it is", never refused;
 *   · his next ten new cards are the same before and after; dry run / non-Mom / data-changed / no-unit / already-hooked
 *     refusals write nothing; the stock "+ Lincoln" enroll is closed for him, Julian keeps the stock button.
 *   run: node test_attach_mathpath_lincoln.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "mathpath_lincoln_2026-10-26.json");
const D = "Math Facts", UNIT = "math_fluency_path", KID = "lincoln";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const CODE = (() => { const i = src.indexOf("const MAST_LINCOLN_BANK"); const j = src.indexOf('"Math Facts":', i); return JSON.parse(src.slice(src.indexOf("[", j), src.indexOf("]", j) + 1)); })();
const EXTRAS = ["25% of 80", "10% of 250", "50% of 136", "15% of 60", "33% of 90", "75% of 200", "20% of 45", "5% of 300", "8% of 150", "3 + 4 × 2", "(3 + 4) × 2", "8 − 2 × 3 + 1", "12 ÷ 4 + 3²", "5 × (6 − 2) ÷ 4"];
const LIVE4 = { 160: ["⅓ as decimal", "0.333… (3 repeating)", "active"], 161: ["⅔ as decimal", "0.666… (6 repeating)", "active"], 338: ["¼ as decimal", "0.25", "active"], 382: ["¾ as decimal", "0.75", "introduction"] };

let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else {
  synthetic = true; const cards = {};
  Object.keys(LIVE4).forEach(i => { const [n, a, st] = LIVE4[i]; cards[i] = { id: "lin_" + i, subject: D, type: "math facts", prompt: n, answer: a, review_mode: "flash", status: st, tier: st === "introduction" ? "daily" : "every_other_day", tally_dots: st === "introduction" ? 2 : 3, consecutive_correct: 0, cycle: 1, drop_count: 0 }; if (st !== "introduction") cards[i].next_due = 204; });
  FX = { itemsLength: 461, cards, customLength: 1281, customNull: [], custom: {}, settings: { cat_modes: { Spelling: "spell" }, cat_intro_max: {}, auto_pull: true, max_intro_per_cat: 2, cat_gate: [], cat_hold: null }, bankOrder: {}, bankOrderKeys: ["Greek & Latin Roots"], unitStage8: null, unitMeta: null };
}
console.log(synthetic ? "(no snapshot file — made-up Lincoln)" : "(replaying " + path.basename(FXP) + ")");

function world(o) {
  o = o || {};
  const items = new Array(FX.itemsLength).fill(null).map((_, i) => FX.cards[i] ? JSON.parse(JSON.stringify(FX.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i, status: "active", tier: "weekly" });
  const cust = new Array(FX.customLength).fill(null).map((_, i) => FX.custom[i] ? JSON.parse(JSON.stringify(FX.custom[i])) : { cat: "Other", name: "n" + i });
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry,
    masteryData: { lincoln: items, lincoln_custom_items: cust, lincoln_settings: JSON.parse(JSON.stringify(FX.settings)), lincoln_bank_order: JSON.parse(JSON.stringify(FX.bankOrder || {})),
      lucy: [], lucy_custom_items: [], lucy_settings: {}, ellis: [], ellis_custom_items: [], ellis_settings: {}, julian: [], julian_custom_items: [], julian_settings: {} },
    currData: { subjects: { lincoln: {}, lucy: {}, ellis: {}, julian: {} }, done: {} }, unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "CODE", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="lincoln"; function subjName(k,s){ return s; }
    const MAST_BANK_MAP={lincoln:{"Math Facts":CODE},lucy:{},ellis:{},julian:{}}; ${VOCAB}
    ${GATE}
    ${block}
    return { STARTER_UNITS, UA_ATTACH, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachClose, uaAttachHtml, _unitStageRowsHtml, _ustApply, _ustCards, unitStageStatus, mastBankEligible, mastFullBank,
      unitStageFormOpen, unitStageEnroll, get view(){ return uaAttachView; }, get form(){ return unitStageForm; } };`)(G, db, CODE);
  if (!o.noUnit) G.unitStudies[UNIT] = w.STARTER_UNITS.math_fluency_path();
  w.G = G; return w;
}
const stage8 = w => w._ustCards(w.G.unitStudies[UNIT], 8);

(async () => {
console.log("── the row ──");
ok("UA_ATTACH has Lincoln → Math Fluency Path, stage 8, fill, strayOk — beside Lucy's, Ellis's and Julian's rows (steps 1, 2, 6)", (t => Object.keys(t).filter(u => u === UNIT).length === 1 && Object.keys(t[UNIT]).sort().join() === "ellis,julian,lincoln,lucy" && t[UNIT].lincoln.stage === 8 && t[UNIT].lincoln.fill === true && t[UNIT].lincoln.strayOk === true && !t[UNIT].lucy.strayOk && !t[UNIT].ellis.strayOk)(world().UA_ATTACH));
ok("one UNITATTACH block, one UA_ATTACH table (a row, not code)", src.split("// UNITATTACH_START").length === 2 && src.split("const UA_ATTACH=").length === 2);

console.log("\n── his data vs the unit ──");
{ const w = world(), s8 = stage8(w), names = s8.map(c => c.name);
  ok("stage 8 of the code starter = 211 cards in 12 families (halves … integer signs)", s8.length === 211 && new Set(s8.map(c => c.family)).size === 12 && s8[0].name === "½ as decimal", [s8.length, s8[0]]);
  if (FX.unitStage8) ok("…and matches the live unit record (names, answers, order)", JSON.stringify(FX.unitStage8.map(c => [c.name, String(c.def)])) === JSON.stringify(s8.map(c => [c.name, String(c.def)])));
  if (FX.unitMeta) ok("the live unit record: starter v1, nobody enrolled, no kidStage", FX.unitMeta.starterVer === 1 && !FX.unitMeta.enrolled && !FX.unitMeta.kidStage, FX.unitMeta);
  ok("his built-in list: 35 words — 21 are stage-8 words, the 14 extras (9 percent-of, 5 order of operations) are not", CODE.length === 35 && CODE.filter(n => names.includes(n)).length === 21 && JSON.stringify(CODE.filter(n => !names.includes(n))) === JSON.stringify(EXTRAS));
  ok("his saved list has no Math Facts entries (" + FX.customLength + " entries, none null) — the 190 start at " + FX.customLength, Object.keys(FX.custom).length === 0 && (FX.customNull || []).length === 0 && FX.customLength === 1281);
  ok("no Math Facts bank order (only Greek & Latin Roots) — his list reads built-in order, then saved", !(FX.bankOrder || {})[D] && (FX.bankOrderKeys || []).join() === "Greek & Latin Roots");
  const live = Object.values(FX.cards);
  ok("his 4 Math Facts cards are all stage-8 cards: ⅓ ⅔ ¼ ¾ as decimal; 3 on the ladder, 1 learning", live.length === 4 && live.every(c => c.subject === D && names.includes(c.prompt)) && live.filter(c => c.status === "introduction").length === 1 && live.filter(c => c.status !== "introduction" && c.status !== "parked").length === 3, live.map(c => c.prompt + ":" + c.status));
  ok("two backs differ from the path's and are his wording: 0.333… (3 repeating), 0.666… (6 repeating)", live.filter(c => String(c.answer) !== String(s8.find(x => x.name === c.prompt).def)).map(c => c.prompt).sort().join() === "⅓ as decimal,⅔ as decimal");
  ok("no Math Facts cat_modes / cat_intro_max / cat_gate / cat_hold on his settings (2 new at a time)", !(FX.settings.cat_modes || {})[D] && !(FX.settings.cat_intro_max || {})[D] && (FX.settings.cat_gate || []).indexOf(D) < 0 && !FX.settings.cat_hold && FX.settings.max_intro_per_cat === 2);
}

console.log("\n── the plan ──");
const w = world(), P = w.uaPlanAttach(UNIT, KID, 1761480000000);
ok("plan is ready for Lincoln, stage 8 · Fractions, decimals & beyond", P.ok && P.sum.stage === 8 && P.sum.label === "Fractions, decimals & beyond", P.why);
ok("4 cards kept: 3 on the ladder, 1 learning; no stray card today", P.sum.liveKept === 4 && P.sum.onLadder === 3 && P.sum.learning === 1 && P.sum.stray.length === 0, P.sum);
ok("the 2 differing backs are REPORTED, with both wordings", P.sum.backDiffers.length === 2 && P.sum.backDiffers.every(t => /repeating/.test(t) && /on the card/.test(t) && /on the path/.test(t)), P.sum.backDiffers);
ok("adds 190 (211 − his 21), every one a stage-8 card he doesn't have; the 14 extras are NOT touched or added", P.sum.added.length === 190 && P.sum.added.every(n => !CODE.includes(n)) && new Set(P.sum.added).size === 190 && !P.sum.added.some(n => EXTRAS.includes(n)), P.sum.added.length);
ok("…in the path's order (½ as decimal, ½ as percent, ¼ as percent …; −10 + 10 last)", P.sum.added.slice(0, 3).join(" ; ") === "½ as decimal ; ½ as percent ; ¼ as percent" && P.sum.added[189] === "−10 + 10", [P.sum.added.slice(0, 4), P.sum.added.slice(-2)]);
ok("his next ten new cards don't change: ⅕ ⅛ ⅜ ⅝ ⅞ as decimal, then his own percent extras", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10Before.join(" ; ") === "⅕ as decimal ; ⅛ as decimal ; ⅜ as decimal ; ⅝ as decimal ; ⅞ as decimal ; 25% of 80 ; 10% of 250 ; 50% of 136 ; 15% of 60 ; 33% of 90", [P.sum.next10Before, P.sum.next10After]);

console.log("\n── the write list ──");
const paths = P.writes.map(x => x.path);
ok("192 writes: enrolled, kidStage, 190 appended entries", P.writes.length === 192, P.writes.length);
ok("every write is a targeted path", paths.every(p => p === "unitStudies/" + UNIT + "/enrolled/lincoln" || p === "unitStudies/" + UNIT + "/kidStage/lincoln" || /^mastery\/lincoln_custom_items\/\d+$/.test(p)));
ok("never mastery/lincoln (cards), definitions (his backs stay), cat_modes, cat_intro_max, cat_gate, bank_order, notebookSettings, another kid", !paths.some(p => /^mastery\/lincoln\//.test(p) || /definitions|cat_modes|cat_intro_max|cat_gate|cat_hold|bank_order|notebookSettings|curriculum|julian|lucy|ellis/.test(p)));
ok("kidStage = {stage 8, via attach}; enrolled = true", (v => v.stage === 8 && v.via === "attach" && v.subject === "" && v.ts === 1761480000000)(P.writes.find(x => /kidStage/.test(x.path)).value) && P.writes.find(x => /enrolled/.test(x.path)).value === true);
const appends = P.writes.filter(x => /custom_items/.test(x.path));
ok("appends are {cat:'Math Facts', name} only, at " + FX.customLength + " … " + (FX.customLength + 189) + " without gaps", appends.length === 190 && appends.every(x => Object.keys(x.value).sort().join() === "cat,name" && x.value.cat === D) && appends.map(x => +x.path.split("/")[2]).join() === appends.map((_, k) => FX.customLength + k).join());

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const before = JSON.stringify(w.G.masteryData.lincoln), setBefore = JSON.stringify(w.G.masteryData.lincoln_settings); const P = w.uaPlanAttach(UNIT, KID, 1);
  w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("Yes writes once: one root-level update with exactly the plan's paths", r === true && w.G.writes.length === 1 && w.G.writes[0][0] === "update" && w.G.writes[0][1] === "" && JSON.stringify(Object.keys(w.G.writes[0][2]).sort()) === JSON.stringify(P.writes.map(x => x.path).sort()));
  ok("his " + FX.itemsLength + " cards and his settings are byte-identical afterwards (the two backs keep his wording)", JSON.stringify(w.G.masteryData.lincoln) === before && JSON.stringify(w.G.masteryData.lincoln_settings) === setBefore && w.G.masteryData.lincoln[160].answer === "0.333… (3 repeating)");
  const bank = w.mastFullBank(KID)[D], names = stage8(w).map(c => c.name);
  ok("afterwards his list = his 35 (extras included, in place) then the 190 — every stage-8 card once", bank.length === 225 && bank.slice(0, 35).join() === CODE.join() && names.every(n => bank.includes(n)) && EXTRAS.every(n => bank.includes(n)) && new Set(bank).size === 225, bank.length);
  const st = w.unitStageStatus(w.G.unitStudies[UNIT], KID);
  ok("the stage row reads 3 of 211 on the ladder, 1 learning, not ready; stage 8 is the last stage (no next)", st && st.total === 211 && st.on === 3 && st.learn === 1 && !st.ready && st.next === null, st);
  ok("the eligible list after still starts his next card at ⅕ as decimal", (el => el.filter(n => !Object.values(FX.cards).some(c => c.prompt === n))[0] === "⅕ as decimal")(w.mastBankEligible(KID, D)));
  ok("tapping again: already hooked up; the stock enroll is open again for him", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why) && w.uaLocked(w.G.unitStudies[UNIT], KID) === false);
}

console.log("\n── strayOk: his extras stay where they are ──");
{ const w = world(); w.G.masteryData.lincoln[10] = { id: "lin_pct", subject: D, prompt: "25% of 80", answer: "20", status: "introduction", tier: "daily" };   // an extra became a card before her Yes
  const P = w.uaPlanAttach(UNIT, KID);
  ok("an extra that is a card is listed as 'left as it is' and the plan still goes ahead (strayOk) — 190 appends unchanged", P.ok && P.sum.stray.length === 1 && /25% of 80/.test(P.sum.stray[0]) && P.sum.added.length === 190 && P.sum.liveKept === 4, P.why || P.sum.stray);
  ok("…never written: the stray card's path is not in the plan", !P.writes.some(x => /^mastery\/lincoln\//.test(x.path)));
  w.uaAttachOpen(UNIT, KID); const h = w._unitStageRowsHtml(w.G.unitStudies[UNIT], [KID]);
  ok("the panel names it: 'Not part of this stage, left as they are: Math Facts · 25% of 80'", /Not part of this stage, left as they are: Math Facts · 25% of 80/.test(h) && /2 answers differ/.test(h), h.slice(h.indexOf("Not part"), h.indexOf("Not part") + 120)); }
{ const w = world(); const P = w.uaPlanAttach(UNIT, "lucy"); ok("Lucy's row (no strayOk) still refuses a stray — the switch is per row", (() => { w.G.masteryData.lucy = [{ id: "l1", subject: D, prompt: "25% of 80", answer: "20", status: "active" }]; const Q = w.uaPlanAttach(UNIT, "lucy"); return !Q.ok && /25% of 80/.test(Q.why); })()); }

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res)); ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg)); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, KID); ok("no database: nothing written", w.uaApplyAttach(w.view.plan) === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaAttachOpen(UNIT, KID); ok("not Mom: no panel, no write", w.view === null && w.uaApplyAttach(w.uaPlanAttach(UNIT, KID)) === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const seen = w.view.plan; w.G.masteryData.lincoln_custom_items.push({ cat: D, name: "½ as decimal" }); ok("data changed since the plan was shown: nothing written, new plan (191) with a note", w.uaApplyAttach(seen) === false && w.G.writes.length === 0 && /changed/.test(w.view.msg) && w.view.plan.writes.length === 191); }
{ const w = world({ noUnit: true }); ok("unit not in the database: refuses", !w.uaPlanAttach(UNIT, KID).ok && /Add this unit first/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); w.G.unitStudies[UNIT].kidStage = { lincoln: { stage: 8 } }; ok("already hooked (kidStage): refuses", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); ok("Caleb (no row): 'hooks up in a later step'", /later step/.test(w.uaPlanAttach(UNIT, "caleb").why)); }

console.log("\n── the stock enroll is closed for him ──");
{ const w = world(), u = w.G.unitStudies[UNIT];
  ok("uaLocked: Lincoln yes (Lucy, Ellis too); Caleb no", w.uaLocked(u, KID) === true && w.uaLocked(u, "lucy") === true && w.uaLocked(u, "ellis") === true && w.uaLocked(u, "caleb") === false);
  ok("_ustApply returns null for Lincoln (no placed cards, no settings overwritten)", w._ustApply(u, KID, 8, "", "", "") === null && JSON.stringify(w.G.masteryData.lincoln_settings) === JSON.stringify(FX.settings));
  w.unitStageFormOpen(UNIT, KID); ok("the stock '+ Lincoln' form doesn't open", w.form === null);
  const h = w._unitStageRowsHtml(u, ["caleb", "lucy", "ellis", "lincoln"]);
  ok("his row shows 🔗 Hook up Lincoln; Caleb keeps + Caleb", /Hook up Lincoln/.test(h) && !/\+ Lincoln/.test(h) && /\+ Caleb/.test(h));
  w.uaAttachOpen(UNIT, KID); const h2 = w._unitStageRowsHtml(u, [KID]);
  ok("the plan panel: 4 cards stay, Stage 8 marker, 190 added, 2 answers differ and stay, next cards unchanged (⅕ …), 192 saved changes, Yes + Cancel", /4 Math Facts cards stay exactly as they are/.test(h2) && /Stage 8 · Fractions, decimals &amp; beyond/.test(h2) && /Adds <b>190<\/b>/.test(h2) && /2 answers differ/.test(h2) && /next new cards don’t change: ⅕ as decimal/.test(h2) && /192 saved changes/.test(h2) && /Yes, hook up Lincoln/.test(h2), h2.slice(0, 900));
  ok("no 'her'/'she' in the panel (Lincoln)", !/\b(her|she)\b/i.test(h2));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
