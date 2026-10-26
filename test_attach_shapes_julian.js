/*
 * Node tests — 🔗 Units switch-over step 5: hook up Julian to the Shapes Path, stage 2 (More flat shapes).
 * PLAN_units_switchover_order_2026-10-25.md step 5 · PLAN_attach_julian_2026-10-26.md. One UA_ATTACH row, plus the engine
 * now keeps cards from EARLIER stages of the same deck (his four basic shapes) instead of calling them stray. Replays the
 * shared read-only snapshot (test_fixtures/attach_julian_2026-10-26.json) when present; otherwise a made-up Julian.
 *   · ZERO card writes, ZERO bank writes: exactly enrolled + kidStage (his 8 built-in + 18 saved = all 26 unit shapes);
 *   · his 15 Shapes cards stay byte-identical: 11 stage-2 shapes counted, 4 stage-1 basics counted as "earlier";
 *   · the Shape of the Day reads the deck + array order — untouched; Lucy's / Ellis's / Lincoln's plans are unchanged by
 *     the engine addition (a stage-6 card on a stage-6 row has no earlier stage);
 *   · refusals write nothing; stock enroll closed for him, open for Caleb.
 *   run: node test_attach_shapes_julian.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "attach_julian_2026-10-26.json");
const D = "Shapes", UNIT = "shapes_path", KID = "julian", OTHER = "caleb";
const nbsrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"); global.window = global.window || {}; eval(nbsrc); const NB = window.HoweNotebooks;
const NB_CTX = (items, FX) => ({ weekNum: "week29", weekDates: "Oct 26 – Oct 30", weekData: { dates: { monday: "Oct 26", tuesday: "Oct 27", wednesday: "Oct 28", thursday: "Oct 29", friday: "Oct 30" }, tasks: [] }, masteryItems: items, letterCursor: (FX.notebookSettings || {}).letterCursor, numberCursor: (FX.notebookSettings || {}).numberCursor });
const nbBuild = (items, FX) => { const o = NB.generate("julian", NB_CTX(items, FX)); return { student: o.student, parent: o.parent, letterCursor: JSON.stringify(o.letterCursor), numberCursor: JSON.stringify(o.numberCursor), chips: [...o.student.replace(/<style[\s\S]*?<\/style>/g, "").matchAll(/recap-chip">⭐ ([^<]+)/g)].map(m => m[1]) }; };

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx", "mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const JBANK = { Letters: "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(","), Numbers: Array.from({ length: 20 }, (_, i) => String(i + 1)), Shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star", "Heart", "Diamond", "Oval"], Counting: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"] };
const SAVED18 = ["Pentagon", "Hexagon", "Octagon", "Heptagon", "Nonagon", "Decagon", "Trapezoid", "Parallelogram", "Kite", "Semicircle", "Crescent", "Cross", "Arrow", "Cube", "Cylinder", "Cone", "Sphere", "Pyramid"];
const BASIC4 = ["Circle", "Square", "Triangle", "Rectangle"];

let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else {
  synthetic = true; const cards = {}; const S = { 9: "Circle", 10: "Square", 11: "Triangle", 23: "Rectangle", 24: "Star", 31: "Heart", 35: "Diamond", 43: "Oval", 52: "Pentagon", 60: "Hexagon", 63: "Octagon", 99: "Heptagon", 100: "Nonagon", 101: "Decagon", 109: "Trapezoid" };
  Object.keys(S).forEach(i => { const learn = ["Nonagon", "Decagon", "Trapezoid"].includes(S[i]); cards[i] = { id: "jul_" + S[i], subject: D, prompt: S[i], status: learn ? "introduction" : "active", tier: learn ? "daily" : "monthly", tally_dots: learn ? 1 : 5, review_mode: "flash" }; if (!learn) cards[i].next_due = 230; });
  const custom = {}; SAVED18.forEach((n, k) => { custom[[0, 1, 2, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70][k]] = { cat: D, name: n }; });
  FX = { itemsLength: 113, cards, customLength: 71, customNull: [], custom, settings: { cat_modes: {}, cat_intro_max: {}, auto_pull: true, max_intro_per_cat: 3, cat_gate: [], cat_hold: null }, bankOrder: {}, units: null, unitMeta: null, notebookSettings: { letterCursor: { adv: 3, idx: 1, week: 27 }, numberCursor: { adv: 4, from: 14, week: 27 } } };
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
  if (!o.noUnit) G.unitStudies[UNIT] = w.STARTER_UNITS.shapes_path();
  w.G = G; return w;
}
const stageN = (w, n) => w._ustCards(w.G.unitStudies[UNIT], n);
const shapes = FX => Object.values(FX.cards).filter(c => c.subject === D);

(async () => {
console.log("── the row + the engine addition ──");
ok("UA_ATTACH.shapes_path has Julian → stage 2, fill, no strayOk; Letters and Math rows untouched", (t => t.shapes_path && Object.keys(t.shapes_path).join() === KID && t.shapes_path.julian.stage === 2 && t.shapes_path.julian.fill === true && !t.shapes_path.julian.strayOk && t.letters_path.julian.stage === 1 && Object.keys(t.math_fluency_path).sort().join() === "ellis,lincoln,lucy")(world().UA_ATTACH));
ok("the engine counts a card from an EARLIER stage of the same deck as kept (S.earlier), never stray", /earlierKey/.test(block) && /if\(earlierKey\.has\(k\)\)\{ S\.earlier\+\+; return; \}/.test(block) && /from earlier stages stay exactly as they are too/.test(block));

console.log("\n── his data vs the unit ──");
{ const w = world(), s1 = stageN(w, 1), s2 = stageN(w, 2), s3 = stageN(w, 3);
  ok("code starter: Shapes deck, stage 1 = the 4 basics, stage 2 = 17 flat shapes, stage 3 = 5 solids", s1.map(c => c.name).join() === BASIC4.join() && s2.length === 17 && s3.length === 5 && [...s1, ...s2, ...s3].every(c => c._dk === D));
  if (FX.units) ok("…and matches the live unit record (names, stages, order)", JSON.stringify(FX.units.shapes_path.decks.find(d => d.key === D).cards.map(c => [c.name, c.stage])) === JSON.stringify([...s1, ...s2, ...s3].sort((a, b) => a.order - b.order).map(c => [c.name, c.stage])));
  if (FX.unitMeta) ok("the live record: starter v1, nbInsert false, nobody enrolled, no kidStage", (m => m.starterVer === 1 && m.nbInsert === false && !m.enrolled && !m.kidStage)(FX.unitMeta.shapes_path));
  const live = shapes(FX), n2 = s2.map(c => c.name);
  ok("his 15 Shapes cards: 4 basics (stage 1) + 11 stage-2 shapes; 3 learning (Nonagon Decagon Trapezoid)", live.length === 15 && BASIC4.every(b => live.some(c => c.prompt === b)) && live.filter(c => n2.includes(c.prompt)).length === 11 && live.filter(c => c.status === "introduction").map(c => c.prompt).sort().join() === "Decagon,Nonagon,Trapezoid", live.map(c => c.prompt + ":" + c.status));
  ok("his list: 8 built-in + 18 saved = all 26 unit shapes (the 5 solids wait in the bank)", (() => { const have = new Set([...JBANK.Shapes, ...Object.values(FX.custom).filter(e => e.cat === D).map(e => e.name)]); return have.size === 26 && [...s1, ...s2, ...s3].every(c => have.has(c.name)); })());
}

console.log("\n── the plan ──");
const w = world(), P = w.uaPlanAttach(UNIT, KID, 1761490000000);
ok("plan is ready for Julian, stage 2 · More flat shapes", P.ok && P.sum.stage === 2 && P.sum.label === "More flat shapes", P.why);
ok("11 stage-2 cards kept (8 on the ladder, 3 learning); 4 EARLIER-stage cards kept too; no stray", P.sum.liveKept === 11 && P.sum.onLadder === 8 && P.sum.learning === 3 && P.sum.earlier === 4 && P.sum.stray.length === 0, P.sum);
ok("adds NOTHING to his list", P.sum.added.length === 0);
ok("his next new cards don't change (stage-2 shapes he hasn't started, in his list's order)", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10Before[0] === "Parallelogram", P.sum.next10Before);
ok("EXACTLY 2 writes: enrolled/julian, kidStage/julian {stage 2, via attach}", P.writes.length === 2 && P.writes[0].path === "unitStudies/" + UNIT + "/enrolled/" + KID && P.writes[1].path === "unitStudies/" + UNIT + "/kidStage/" + KID && P.writes[1].value.stage === 2 && P.writes[1].value.via === "attach", P.writes);

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const before = [w.G.masteryData.julian, w.G.masteryData.julian_custom_items, w.G.masteryData.julian_settings, w.G.notebookSettings].map(x => JSON.stringify(x)); const orderBefore = w.G.masteryData.julian.filter(c => c.subject === D).map(c => c.prompt).join();
  const nbBefore = nbBuild(w.G.masteryData.julian, FX);
  w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res));
  ok("Yes writes once: one update with exactly the 2 paths", r === true && w.G.writes.length === 1 && Object.keys(w.G.writes[0][2]).length === 2);
  const nbAfter = nbBuild(w.G.masteryData.julian, FX);
  ok("next week's notebook (week 29), built before and after from his cards + cursors: student and parent pages byte-identical, cursors identical", nbBefore.student === nbAfter.student && nbBefore.parent === nbAfter.parent && nbBefore.letterCursor === nbAfter.letterCursor && nbBefore.numberCursor === nbAfter.numberCursor && nbBefore.student.length > 1000);
  if (!synthetic) ok("…and its Shape of the Day week is the live one: Octagon · Heptagon · Heart · Diamond · Oval", nbAfter.chips.join(",") === "Octagon,Heptagon,Heart,Diamond,Oval", nbAfter.chips);
  ok("his 113 cards (and the Shapes array order the Shape of the Day rotation reads), saved list, settings, cursors byte-identical", [w.G.masteryData.julian, w.G.masteryData.julian_custom_items, w.G.masteryData.julian_settings, w.G.notebookSettings].map(x => JSON.stringify(x)).join("|") === before.join("|") && w.G.masteryData.julian.filter(c => c.subject === D).map(c => c.prompt).join() === orderBefore);
  const st = w.unitStageStatus(w.G.unitStudies[UNIT], KID);
  ok("the stage row reads 8 of 17 on the ladder, 3 learning, not ready; next = Stage 3 (Solid shapes)", st && st.total === 17 && st.on === 8 && st.learn === 3 && !st.ready && st.next && st.next.n === 3, st);
  ok("tapping again: already hooked up; stock enroll open again for him", /already hooked up/.test(w.uaPlanAttach(UNIT, KID).why) && w.uaLocked(w.G.unitStudies[UNIT], KID) === false);
}

console.log("\n── the engine addition leaves the math rows alone ──");
{ const w = world(); w.G.unitStudies.math_fluency_path = w.STARTER_UNITS.math_fluency_path(); w.G.masteryData.lucy = [{ id: "l1", subject: "Math Facts", prompt: "1+1", answer: "2", status: "active", tier: "weekly" }];
  const P = w.uaPlanAttach("math_fluency_path", "lucy"); ok("Lucy at stage 6 (the first Math Facts stage): earlier 0, her card counted as kept, plan unchanged in shape", P.ok && P.sum.earlier === 0 && P.sum.liveKept === 1 && P.sum.stray.length === 0, P.sum); }
{ const w = world(); w.G.masteryData.julian[10] = { id: "jul_zz", subject: D, prompt: "Blob", status: "active", tier: "weekly" }; const P = w.uaPlanAttach(UNIT, KID); ok("a Shapes card that is in NO stage is still stray → refused (no strayOk on this row)", !P.ok && /Blob/.test(P.why)); }
{ const w = world(); w.G.masteryData.julian[10] = { id: "jul_cube", subject: D, prompt: "Cube", status: "active", tier: "weekly" }; const P = w.uaPlanAttach(UNIT, KID); ok("a card from a LATER stage (Cube, stage 3) is stray too — only earlier stages are kept", !P.ok && /Cube/.test(P.why)); }

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setImmediate(res)); ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg)); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, KID); ok("no database: nothing written", w.uaApplyAttach(w.view.plan) === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaAttachOpen(UNIT, KID); ok("not Mom: no panel, no write", w.view === null && w.uaApplyAttach(w.uaPlanAttach(UNIT, KID)) === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const seen = w.view.plan; w.G.unitStudies[UNIT].kidStage = { julian: { stage: 2 } }; ok("data changed since the plan was shown: nothing written, the new plan (a refusal) shows", w.uaApplyAttach(seen) === false && w.G.writes.length === 0 && /changed/.test(w.view.msg)); }
{ const w = world({ noUnit: true }); ok("unit not in the database: refuses", /Add this unit first/.test(w.uaPlanAttach(UNIT, KID).why)); }
{ const w = world(); ok("Caleb (no row on this unit): 'hooks up in a later step'", /later step/.test(w.uaPlanAttach(UNIT, OTHER).why)); }

console.log("\n── the stock enroll is closed for him, open for Caleb ──");
{ const w = world(), u = w.G.unitStudies[UNIT];
  ok("uaLocked: Julian yes; Caleb no", w.uaLocked(u, KID) === true && w.uaLocked(u, OTHER) === false);
  ok("_ustApply returns null for Julian; still seeds Caleb at stage 1", w._ustApply(u, KID, 2, "", "", "") === null && (r => r && Object.keys(r.iu).length > 0)(w._ustApply(u, OTHER, 1, "", "", "")));
  w.unitStageFormOpen(UNIT, KID); ok("the stock '+ Julian' form doesn't open", w.form === null);
  const w2 = world(), h = w2._unitStageRowsHtml(w2.G.unitStudies[UNIT], [KID, OTHER]);
  ok("his row shows 🔗 Hook up Julian; Caleb keeps + Caleb", /Hook up Julian/.test(h) && !/\+ Julian/.test(h) && /\+ Caleb/.test(h));
  w.uaAttachOpen(UNIT, KID); const h2 = w._unitStageRowsHtml(u, [KID]);
  ok("the plan panel: 11 Shapes cards stay, Stage 2 · More flat shapes, '4 cards from earlier stages stay exactly as they are too', adds nothing, 2 saved changes", /11 Shapes cards stay exactly as they are/.test(h2) && /Stage 2 · More flat shapes/.test(h2) && /4 cards from earlier stages stay exactly as they are too/.test(h2) && /Adds nothing to the list/.test(h2) && /2 saved changes/.test(h2) && /Yes, hook up Julian/.test(h2), h2.slice(0, 900));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
