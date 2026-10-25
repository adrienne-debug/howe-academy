/*
 * Node tests — 🔗 Units switch-over step 1: hook up Lucy to the Math Fluency Path, stage 6 (UNITATTACH engine; her ask
 * 2026-10-25: "The order is good. Start step 1: Lucy on the Math Fluency path, stage 6, with the hook-up engine. Snapshot
 * and plan file first, then the branch."). PLAN_units_switchover_order_2026-10-25.md §0 · PLAN_attach_mathpath_lucy_2026-10-25.md.
 * Replays the read-only snapshot of her Math Facts data (test_fixtures/mathpath_lucy_2026-10-25.json) when it is present;
 * otherwise a made-up Lucy built from her built-in list (same shape, same counts).
 *   · her 13 cards are byte-identical after the attach — nothing under mastery/lucy is ever written;
 *   · exactly enrolled + kidStage + 151 appended {cat,name} entries, starting right after her saved list; no def, no ch;
 *   · afterwards every stage-6 fact is in her list once; her next ten new cards are the same before and after;
 *   · dry run, non-Mom, "data changed", no-unit, already-hooked and stray-card refusals write nothing;
 *   · the stock "+ Lucy" enroll is closed for her on this unit (and only her); AAS is refused by the engine.
 * Runs the real STARTER_UNITS block + the real bank/gate functions sliced from index.html.   run: node test_attach_mathpath_lucy.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "mathpath_lucy_2026-10-25.json");
const D = "Math Facts", UNIT = "math_fluency_path";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const LUCY_CODE = (() => { const i = src.indexOf("const MAST_LUCY_BANK"); const j = src.indexOf('"Math Facts":', i); return JSON.parse(src.slice(src.indexOf("[", j), src.indexOf("]", j) + 1)); })();

// ── the snapshot, or a made-up Lucy of the same shape ──
let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else {
  synthetic = true;
  const idx = [3, 4, 5, 23, 24, 25, 44, 45, 55, 68, 71, 77, 85], tiers = ["bi_weekly", "bi_weekly", "bi_weekly", "bi_weekly", "bi_weekly", "bi_weekly", "bi_weekly", "bi_weekly", "weekly", "every_other_day", "daily", "daily", "daily"];
  const cards = {}; idx.forEach((i, k) => { const n = LUCY_CODE[k], learn = tiers[k] === "daily";
    cards[i] = { id: "luc_" + n.replace(/\+/g, "_"), subject: D, type: "math facts", prompt: n, answer: String(eval(n.replace("−", "-"))), review_mode: "flash", status: learn ? "introduction" : "active", tier: tiers[k], tally_dots: learn ? 2 : 5, consecutive_correct: 0, cycle: 2, drop_count: 0 }; if (!learn) cards[i].next_due = 205 + k; });
  FX = { itemsLength: 87, cards, customLength: 60, custom: {}, settings: { cat_modes: { Spelling: "spell" }, cat_intro_max: {}, auto_pull: true, max_intro_per_cat: 3 }, bankOrder: {}, unitStage6: null };
}
console.log(synthetic ? "(no snapshot file — made-up Lucy)" : "(replaying " + path.basename(FXP) + ")");

function world(o) {
  o = o || {};
  const items = new Array(FX.itemsLength).fill(null).map((_, i) => FX.cards[i] ? JSON.parse(JSON.stringify(FX.cards[i])) : { id: "x" + i, subject: "Other", prompt: "p" + i, status: "active", tier: "weekly" });
  const cust = new Array(FX.customLength).fill(null).map((_, i) => FX.custom[i] ? JSON.parse(JSON.stringify(FX.custom[i])) : { cat: "Other", name: "n" + i });
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry,
    masteryData: { lucy: items, lucy_custom_items: cust, lucy_settings: JSON.parse(JSON.stringify(FX.settings)), lucy_bank_order: JSON.parse(JSON.stringify(FX.bankOrder || {})),
      ellis: [], ellis_custom_items: [], ellis_settings: {}, julian: [], julian_custom_items: [], julian_settings: {} },
    currData: { subjects: { lucy: {}, ellis: {}, julian: {} }, done: {} }, unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "LUCY_CODE", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function ldPin(){ return null; } let masteryKid="lucy"; function subjName(k,s){ return s; }
    const MAST_BANK_MAP={lucy:{"Math Facts":LUCY_CODE},ellis:{},julian:{}}; ${VOCAB}
    ${GATE}
    ${block}
    return { STARTER_UNITS, UA_ATTACH, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachClose, uaAttachHtml, _unitStageRowsHtml, _ustApply, _ustCards, unitStageStatus, mastBankEligible, mastFullBank,
      unitStageFormOpen, unitStageEnroll, get view(){ return uaAttachView; }, get form(){ return unitStageForm; } };`)(G, db, LUCY_CODE);
  if (!o.noUnit) G.unitStudies[UNIT] = w.STARTER_UNITS.math_fluency_path();
  w.G = G; return w;
}
const stage6 = w => w._ustCards(w.G.unitStudies[UNIT], 6);

(async () => {
console.log("── the block ──");
ok("UNITATTACH sits inside STARTER_UNITS exactly once", block.split("// UNITATTACH_START").length === 2 && block.split("// UNITATTACH_END").length === 2 && src.split("// UNITATTACH_START").length === 2);
ok("the table has exactly one row today: Lucy → Math Fluency Path, stage 6, fill", (t => Object.keys(t).join() === UNIT && Object.keys(t[UNIT]).join() === "lucy" && t[UNIT].lucy.stage === 6 && t[UNIT].lucy.fill === true && !t[UNIT].lucy.strayOk)(world().UA_ATTACH));

console.log("\n── her data vs the unit ──");
{ const w = world(), s6 = stage6(w), names = s6.map(c => c.name);
  ok("stage 6 of the code starter = 200 + and − facts in 19 families", s6.length === 200 && new Set(s6.map(c => c.family)).size === 19, s6.length);
  if (FX.unitStage6) ok("…and matches the live unit record (names, answers, order)", JSON.stringify(FX.unitStage6.map(c => [c.name, String(c.def)])) === JSON.stringify(s6.map(c => [c.name, String(c.def)])));
  ok("all 49 facts on her built-in list are stage-6 facts, no duplicates", LUCY_CODE.length === 49 && LUCY_CODE.every(n => names.includes(n)) && new Set(LUCY_CODE).size === 49);
  const live = Object.values(FX.cards);
  ok("her 13 Math Facts cards are all stage-6 facts with the path's answers", live.length === 13 && live.every(c => c.subject === D && names.includes(c.prompt) && String(s6.find(x => x.name === c.prompt).def) === String(c.answer)));
  ok("her saved list has no Math Facts entries (the 151 start at index " + FX.customLength + ")", Object.keys(FX.custom).length === 0);
}

console.log("\n── the plan ──");
const w = world(), P = w.uaPlanAttach(UNIT, "lucy", 1761420000000);
ok("plan is ready for Lucy, stage 6 · + and − facts", P.ok && P.sum.stage === 6 && P.sum.label === "+ and − facts", P.why);
ok("13 cards kept: 10 on the ladder, 3 learning", P.sum.liveKept === 13 && P.sum.onLadder === 10 && P.sum.learning === 3, P.sum);
ok("no answer differs, no stray card", P.sum.backDiffers.length === 0 && P.sum.stray.length === 0, P.sum.backDiffers);
ok("adds 151 facts (200 − her 49), every one a stage-6 fact she doesn't have", P.sum.added.length === 151 && P.sum.added.every(n => !LUCY_CODE.includes(n)) && new Set(P.sum.added).size === 151, P.sum.added.length);
ok("…in the path's order (0 family first: 0+0, 0-0, 0+1 …)", P.sum.added.slice(0, 3).join() === "0+0,0-0,0+1" && P.sum.added.slice(-2).join() === "9+9,18-9", P.sum.added.slice(0, 5));
ok("her next ten new cards don't change: 4+2 … 6+2", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10Before.join() === "4+2,4+3,4+4,5+1,5+2,5+3,5+4,5+5,6+1,6+2", [P.sum.next10Before, P.sum.next10After]);

console.log("\n── the write list ──");
const paths = P.writes.map(x => x.path);
ok("153 writes: enrolled, kidStage, 151 appended entries", P.writes.length === 153, P.writes.length);
ok("every write is a targeted path (no whole-node set)", paths.every(p => p === "unitStudies/" + UNIT + "/enrolled/lucy" || p === "unitStudies/" + UNIT + "/kidStage/lucy" || /^mastery\/lucy_custom_items\/\d+$/.test(p)), paths.filter(p => !/enrolled|kidStage|custom_items/.test(p)));
ok("never mastery/lucy (cards), cat_modes, cat_intro_max, definitions, cat_gate, bank_order, notebookSettings, curriculum or another kid", !paths.some(p => /^mastery\/lucy\//.test(p) || /cat_modes|cat_intro_max|definitions|cat_gate|cat_hold|bank_order|notebookSettings|curriculum|julian|ellis|lincoln/.test(p)));
ok("no two writes overlap", paths.every(a => !paths.some(b => b !== a && b.startsWith(a + "/"))));
ok("enrolled = true", P.writes.find(x => /enrolled/.test(x.path)).value === true);
ok("kidStage = {stage 6, no subject/knows/map, via attach}", (v => v.stage === 6 && v.subject === "" && v.knows === "" && v.map === "" && v.via === "attach" && v.ts === 1761420000000)(P.writes.find(x => /kidStage/.test(x.path)).value));
const appends = P.writes.filter(x => /custom_items/.test(x.path));
ok("appended entries are exactly {cat:'Math Facts', name} — never a def, never ch", appends.length === 151 && appends.every(x => Object.keys(x.value).sort().join() === "cat,name" && x.value.cat === D));
ok("appends start right after her last saved entry and run without gaps (" + FX.customLength + " … " + (FX.customLength + 150) + ")", appends.map(x => +x.path.split("/")[2]).join() === appends.map((_, k) => FX.customLength + k).join());
ok("every write has a plain-words 'what'", P.writes.every(x => typeof x.what === "string" && x.what.length > 8));

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const before = JSON.stringify(w.G.masteryData.lucy); const P = w.uaPlanAttach(UNIT, "lucy", 1);
  w.uaAttachOpen(UNIT, "lucy"); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("Yes writes once: one root-level update carrying exactly the plan's paths", r === true && w.G.writes.length === 1 && w.G.writes[0][0] === "update" && w.G.writes[0][1] === "" && JSON.stringify(Object.keys(w.G.writes[0][2]).sort()) === JSON.stringify(P.writes.map(x => x.path).sort()), w.G.writes.map(x => x[0] + ":" + x[1]));
  ok("her 87 cards are byte-identical afterwards", JSON.stringify(w.G.masteryData.lucy) === before);
  ok("she is in the unit with her Stage 6 marker", w.G.unitStudies[UNIT].enrolled.lucy === true && w.G.unitStudies[UNIT].kidStage.lucy.stage === 6);
  const bank = w.mastFullBank("lucy")[D], names = stage6(w).map(c => c.name);
  ok("afterwards every stage-6 fact is in her list exactly once, her own 49 first", bank.length === 200 && names.every(n => bank.includes(n)) && new Set(bank).size === 200 && bank.slice(0, 49).join() === LUCY_CODE.join(), bank.length);
  ok("her saved list is 211 entries, 60–210 the new facts, the first 60 untouched", w.G.masteryData.lucy_custom_items.length === FX.customLength + 151 && w.G.masteryData.lucy_custom_items[FX.customLength].name === "0+0" && w.G.masteryData.lucy_custom_items.slice(0, FX.customLength).every(e => e.cat !== D));
  const st = w.unitStageStatus(w.G.unitStudies[UNIT], "lucy");
  ok("the stage row reads 10 of 200 on the ladder, 3 learning, not ready to move up", st && st.total === 200 && st.on === 10 && st.learn === 3 && !st.ready && st.next && st.next.n === 7, st);
  ok("the panel closed and the page re-rendered", w.view === null && w.G.rendered >= 2);
  ok("the eligible list after = her 49 then the 151, so the next new card is still 4+2", (el => el.filter(n => !Object.values(FX.cards).some(c => c.prompt === n))[0] === "4+2")(w.mastBankEligible("lucy", D)));
  ok("tapping again says she's already hooked up", !w.uaPlanAttach(UNIT, "lucy").ok && /already hooked up/.test(w.uaPlanAttach(UNIT, "lucy").why));
  ok("…and the stock enroll is open again for her (the hook-up was the only lock)", w.uaLocked(w.G.unitStudies[UNIT], "lucy") === false);
}

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, "lucy"); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg) && !w.G.unitStudies[UNIT].enrolled); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, "lucy"); const r = w.uaApplyAttach(w.view.plan); ok("no database: nothing written", r === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaAttachOpen(UNIT, "lucy"); const r = w.uaApplyAttach(w.uaPlanAttach(UNIT, "lucy")); ok("not Mom: the panel doesn't open and Yes writes nothing", w.view === null && r === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, "lucy"); const seen = w.view.plan; w.G.masteryData.lucy_custom_items.push({ cat: D, name: "0+0" });   // her data moves under the plan
  const r = w.uaApplyAttach(seen); ok("data changed since the plan was shown: nothing written, the new plan shows with a note", r === false && w.G.writes.length === 0 && /changed/.test(w.view.msg) && w.view.plan.writes.length === 152); }
{ const w = world({ noUnit: true }); const P = w.uaPlanAttach(UNIT, "lucy"); ok("unit not in the database: refuses ('Add this unit first')", !P.ok && /Add this unit first/.test(P.why) && P.writes.length === 0); }
{ const w = world(); w.G.unitStudies[UNIT].enrolled = { lucy: true }; ok("already enrolled: refuses", /already hooked up/.test(w.uaPlanAttach(UNIT, "lucy").why)); }
{ const w = world(); w.G.masteryData.lucy[10] = { id: "luc_6x7", subject: D, prompt: "6×7", answer: "42", status: "active", tier: "weekly" };
  const P = w.uaPlanAttach(UNIT, "lucy"); ok("a Math Facts card that isn't a stage-6 fact stops the plan and names it", !P.ok && /6×7/.test(P.why) && /Nothing was changed/.test(P.why), P.why); }
{ const w = world(); ok("another kid: 'hooks up in a later step'", /later step/.test(w.uaPlanAttach(UNIT, "ellis").why)); }
{ const w = world(); w.UA_ATTACH.all_about_spelling = { lucy: { stage: 1, fill: true } }; w.G.unitStudies.all_about_spelling = w.STARTER_UNITS.all_about_spelling();
  const P = w.uaPlanAttach("all_about_spelling", "lucy"); ok("a bank-held unit (AAS) is refused by the engine — its own step", !P.ok && /its own step/.test(P.why), P.why); delete w.UA_ATTACH.all_about_spelling; }

console.log("\n── the stock enroll is closed for her, open for everyone else ──");
{ const w = world(), u = w.G.unitStudies[UNIT];
  ok("uaLocked: Lucy yes, Ellis / Julian no", w.uaLocked(u, "lucy") === true && w.uaLocked(u, "ellis") === false && w.uaLocked(u, "julian") === false);
  ok("_ustApply returns null for Lucy (no placed cards minted, no settings overwritten)", w._ustApply(u, "lucy", 6, "", "", "") === null && JSON.stringify(w.G.masteryData.lucy_settings) === JSON.stringify(FX.settings) && w.G.masteryData.lucy.length === FX.itemsLength);
  ok("…but still seeds Ellis at stage 7 (stock path untouched for other kids)", (r => r && Object.keys(r.iu).length > 0)(w._ustApply(u, "ellis", 7, "", "", "")));
  w.unitStageFormOpen(UNIT, "lucy"); ok("the stock '+ Lucy' form doesn't open", w.form === null);
  w.unitStageFormOpen(UNIT, "julian"); ok("…the stock '+ Julian' form does", w.form && w.form.kid === "julian");
  const w2 = world(), h = w2._unitStageRowsHtml(w2.G.unitStudies[UNIT], ["julian", "lucy", "ellis", "lincoln"]);   // a fresh world: no form open
  ok("her row shows 🔗 Hook up Lucy; the others keep + Kid", /Hook up Lucy/.test(h) && !/\+ Lucy/.test(h) && /\+ Julian/.test(h) && /\+ Ellis/.test(h) && /\+ Lincoln/.test(h) && !/Hook up (Julian|Ellis|Lincoln)/.test(h));
  w.uaAttachOpen(UNIT, "lucy"); const h2 = w._unitStageRowsHtml(u, ["lucy"]);
  ok("the plan panel: 13 cards stay, Stage 6 marker, 151 added, next cards unchanged, Yes + Cancel", /13 Math Facts cards stay exactly as they are/.test(h2) && /Stage 6 · \+ and − facts/.test(h2) && /Adds <b>151<\/b>/.test(h2) && /next new cards don’t change: 4\+2/.test(h2) && /153 saved changes/.test(h2) && /Yes, hook up Lucy/.test(h2) && /Cancel/.test(h2) && !/Dry run/.test(h2));
  const wd = world({ dry: true }); wd.uaAttachOpen(UNIT, "lucy"); ok("…and says 'Dry run — Yes writes nothing' under ?dryrun=1", /Dry run — Yes writes nothing/.test(wd._unitStageRowsHtml(wd.G.unitStudies[UNIT], ["lucy"])));
  ok("no 'his'/'him' in the panel (Lucy)", !/\b(his|him)\b/i.test(h2));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
