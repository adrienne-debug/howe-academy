/*
 * Node tests — 🌐 GEOADOPT, slice 3 of the Geography Path (PLAN_geography_path_2026-11-10.md §9 row 3, §4; 2026-11-16):
 * hooking a kid whose World Geography cards are already live onto the path at Stage 7, and a kid with only Geography words.
 * The fixture kids are made up. The first is shaped like the plan's §3 table: 7 live World Geography cards (United Kingdom,
 * France, Germany, Spain, Italy, Japan, China — the built-in order), the built-in list of 30, no saved list, no deck settings.
 *   · data-driven row: live World Geography → Stage 7, fill, strayOk; ZERO card writes: enrolled + kidStage + the 30 capitals
 *     past the built-in list appended as {cat,name} (no def, no ch) after the list — and NO back written: every one of the 30
 *     finds its back in the code (MAST_VOCAB_DEFS, GEOADOPT's missing-keys merge), equal to the path's;
 *   · the next ten new cards don't change (India, Brazil, Australia …); the path's order from here is the one checkbox;
 *   · an extra card the path lacks is a stray, kept, never refused; a State Capitals card she also has is "earlier", kept;
 *   · a kid with only Geography words hooks at the highest stage of a live path word; their new words get the path's back
 *     ONLY where they have none saved and the code's back isn't already the path's; only non-path words → the first words stage;
 *     dry run inert.
 *   · GEOALL (her "Yes, add all", 2026-11-16): World Geography is 195 now — the 60 above stay FIRST in each continent with their
 *     names and backs byte for byte (PIN_60, copied from main before GEOALL), the 135 more follow; the hook-up appends 165, and
 *     still writes no back (every one of the 195 has its back in the code); the next ten new cards still don't change.
 *   run: node test_attach_geo_world.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const UNIT = "geography_path", KID = "kidb", WK = "kidw", D = "World Geography", W = "Geography";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible", "haKeyOk", "haKey"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();
const WORLD = JSON.parse(/"World Geography":(\[[^\]]*\])/.exec(src)[1]);   // the built-in list, read from the page
const VD = new Function(VOCAB + "\nreturn MAST_VOCAB_DEFS;")();   // the built-in backs only
const LIVE7 = [["United Kingdom", "active", "monthly"], ["France", "active", "monthly"], ["Germany", "active", "bi_weekly"], ["Spain", "active", "monthly"],
  ["Italy", "active", "monthly"], ["Japan", "active", "weekly"], ["China", "introduction", "daily"]];

function world(o) {
  o = o || {};
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: true, dry: !!o.dry, masteryData: {}, currData: { subjects: {}, done: {} }, unitStudies: {} };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "BANKS", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    let masteryKid="${KID}"; const MAST_BANK_MAP=BANKS; ${VOCAB}
    ${GATE}
    ${block}
    ${VOCAB_GEO}
    return { STARTER_UNITS, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachHtml, _unitStageRowsHtml, _ustCards, mastFullBank, unitStageStatus, MAST_VOCAB_DEFS, GEO_MORE_CAPITALS,
      get view(){ return uaAttachView; } };`)(G, db, { [KID]: { [D]: WORLD.slice() }, [WK]: {} });
  const u = w.STARTER_UNITS.geography_path(); G.unitStudies[UNIT] = u;
  const items = [];
  for (let i = 0; i < 25; i++) items.push({ id: "kid_v" + i, subject: "Vocabulary", type: "vocabulary", prompt: "term" + i, answer: "meaning " + i, status: "active", tier: "weekly", review_mode: "flash", next_due: 20 + i });
  LIVE7.forEach(([n, st, t], i) => items.push({ id: "kid_wg" + i, subject: D, type: "world geography", prompt: n, answer: VD[n.toLowerCase()], status: st, tier: t, review_mode: "flash", cycle: 1, consecutive_correct: i, tally_dots: i % 6, next_due: 30 + i, drop_count: 0 }));
  const custom = []; for (let i = 0; i < 132; i++) custom.push({ cat: "Social Studies", name: "ss" + i });
  Object.assign(G.masteryData, { [KID]: items, [KID + "_custom_items"]: custom, [KID + "_settings"]: { cat_modes: { Vocabulary: "flip" }, definitions: { term1: "meaning 1" } },
    [WK]: [], [WK + "_custom_items"]: [], [WK + "_settings"]: {} });
  if (o.pre) o.pre(G, u);
  w.G = G; w.u = u; return w;
}
const snap = (G, k) => JSON.stringify([G.masteryData[k], G.masteryData[k + "_settings"], G.masteryData[k + "_bank_order"]]);
const TS = 1763300000000;
// The 60 World Geography cards as main had them before GEOALL — [family, name, back]. They must never change.
const PIN_60 = [["North America","Mexico","Mexico City"],["North America","Canada","Ottawa"],["North America","Cuba","Havana"],["North America","Panama","Panama City"],["South America","Brazil","Brasília"],["South America","Argentina","Buenos Aires"],["South America","Colombia","Bogotá"],["South America","Peru","Lima"],["South America","Chile","Santiago"],["South America","Venezuela","Caracas"],["South America","Ecuador","Quito"],["Europe","United Kingdom","London"],["Europe","France","Paris"],["Europe","Germany","Berlin"],["Europe","Spain","Madrid"],["Europe","Italy","Rome"],["Europe","Russia","Moscow"],["Europe","Greece","Athens"],["Europe","Norway","Oslo"],["Europe","Ireland","Dublin"],["Europe","Portugal","Lisbon"],["Europe","Netherlands","Amsterdam"],["Europe","Belgium","Brussels"],["Europe","Switzerland","Bern"],["Europe","Austria","Vienna"],["Europe","Poland","Warsaw"],["Europe","Czechia","Prague"],["Europe","Hungary","Budapest"],["Europe","Sweden","Stockholm"],["Europe","Finland","Helsinki"],["Europe","Denmark","Copenhagen"],["Europe","Iceland","Reykjavík"],["Europe","Ukraine","Kyiv"],["Asia","Japan","Tokyo"],["Asia","China","Beijing"],["Asia","India","New Delhi"],["Asia","South Korea","Seoul"],["Asia","Saudi Arabia","Riyadh"],["Asia","Turkey","Ankara"],["Asia","Thailand","Bangkok"],["Asia","Indonesia","Jakarta"],["Asia","Pakistan","Islamabad"],["Asia","Vietnam","Hanoi"],["Asia","Philippines","Manila"],["Asia","Malaysia","Kuala Lumpur"],["Asia","Afghanistan","Kabul"],["Asia","Iran","Tehran"],["Asia","Iraq","Baghdad"],["Asia","Israel","Jerusalem"],["Africa","Egypt","Cairo"],["Africa","South Africa","Pretoria (executive), Cape Town (legislative)"],["Africa","Nigeria","Abuja"],["Africa","Kenya","Nairobi"],["Africa","Morocco","Rabat"],["Africa","Ghana","Accra"],["Africa","Ethiopia","Addis Ababa"],["Africa","Tanzania","Dodoma"],["Africa","Uganda","Kampala"],["Oceania","Australia","Canberra"],["Oceania","New Zealand","Wellington"]];

(async () => {
console.log("── the 165 more capitals (Appendix B ★ 30 + GEOALL 135) ──");
{ const w = world(), wg = w.u.decks.find(d => d.key === D).cards, more = wg.filter(c => !WORLD.includes(c.name));
  ok("GEOALL: the 60 that were there — names AND backs byte for byte, first in each continent, in their order", PIN_60.length === 60 && [...new Set(PIN_60.map(x => x[0]))].every(f => { const was = PIN_60.filter(x => x[0] === f); return JSON.stringify(wg.filter(c => c.family === f).slice(0, was.length).map(c => [c.family, c.name, c.def])) === JSON.stringify(was); }));
  ok("GEOALL: every one of the 195 has a back, and the 135 new ones are none of the built-in keys", wg.every(c => typeof c.def === "string" && c.def.length > 1) && wg.filter(c => !PIN_60.some(x => x[1] === c.name)).length === 135 && wg.filter(c => !PIN_60.some(x => x[1] === c.name)).every(c => VD[c.name.toLowerCase()] === undefined));
  ok("GEOALL: the country Georgia is “Georgia (country)” → Tbilisi; the built-in “georgia” back (the state's, Atlanta) is untouched", wg.find(c => c.name === "Georgia (country)").def === "Tbilisi" && !wg.some(c => c.name === "Georgia") && w.MAST_VOCAB_DEFS.georgia === VD.georgia && w.MAST_VOCAB_DEFS["georgia (country)"] === "Tbilisi");
  ok("World Geography: 195 cards = the 30 built-in + 165 more, each once, Stage 7, flip, 3 at a time", wg.length === 195 && new Set(wg.map(c => c.name)).size === 195 && more.length === 165 && wg.every(c => c.stage === 7) && w.u.decks.find(d => d.key === D).mode === "flip" && w.u.decks.find(d => d.key === D).introCap === 3);
  ok("families = the continents in Stage 6's order; inside each, the built-in countries first in the built-in order", [...new Set(wg.map(c => c.family))].join("|") === "North America|South America|Europe|Asia|Africa|Oceania" &&
    [...new Set(wg.map(c => c.family))].every(f => { const fam = wg.filter(c => c.family === f).map(c => c.name), b = fam.filter(n => WORLD.includes(n)); return JSON.stringify(fam.slice(0, b.length)) === JSON.stringify(b) && JSON.stringify(b) === JSON.stringify(WORLD.filter(n => b.includes(n))); }));
  ok("every World Geography country is a Stage-6 Countries card too (same name, same picture key family)", wg.every(c => w.u.decks.find(d => d.key === "Countries").cards.some(x => x.name === c.name)));
  ok("the 165 more: never one of the built-in backs' keys (nothing replaced); after the merge each resolves in MAST_VOCAB_DEFS to the path's back", more.every(c => VD[c.name.toLowerCase()] === undefined && w.MAST_VOCAB_DEFS[c.name.toLowerCase()] === c.def) && more.find(c => c.name === "Iceland").def === "Reykjavík");
  ok("the merge only ADDS keys: every built-in back is unchanged", Object.keys(VD).every(k => w.MAST_VOCAB_DEFS[k] === VD[k]) && Object.keys(w.MAST_VOCAB_DEFS).length === Object.keys(VD).length + 165);
}

console.log("\n── the plan ──");
{ const w = world(), before = snap(w.G, KID), P = w.uaPlanAttach(UNIT, KID, TS);
  const sp = w.uaSpec(w.u, KID);
  ok("data-driven row: live World Geography → Stage 7 · World capitals, fill, strayOk; stock + Kid closed", sp && sp.stage === 7 && sp.fill && sp.strayOk && w.uaLocked(w.u, KID) && P.ok && P.sum.label === "World capitals", P.why);
  ok("7 cards kept: 6 on the ladder, 1 learning, of 195; no stray, nothing earlier, no back differs", P.sum.liveKept === 7 && P.sum.onLadder === 6 && P.sum.learning === 1 && P.sum.total === 195 && P.sum.stray.length === 0 && P.sum.earlier === 0 && P.sum.backDiffers.length === 0, P.sum);
  const adds = P.writes.slice(2);
  ok("writes: enrolled + kidStage (Stage 7, via attach) + 165 appends at 132…296 — nothing else", P.writes.length === 167 && P.writes[0].path === "unitStudies/geography_path/enrolled/" + KID && P.writes[1].value.stage === 7 && P.writes[1].value.via === "attach" &&
    adds.every((x, i) => x.path === "mastery/" + KID + "_custom_items/" + (132 + i) && JSON.stringify(Object.keys(x.value)) === JSON.stringify(["cat", "name"]) && x.value.cat === D), P.writes.map(x => x.path).slice(0, 4));
  ok("the 165 appended are exactly the capitals past the built-in 30, in the path's order (Cuba, Panama, Guatemala …)", JSON.stringify(adds.map(x => x.value.name)) === JSON.stringify(w.u.decks.find(d => d.key === D).cards.filter(c => !WORLD.includes(c.name)).map(c => c.name)) && adds[0].value.name === "Cuba" && adds[2].value.name === "Guatemala");
  ok("NO back written (the code has all 195) — no definitions, no cat_modes, no card", P.sum.backsAdded.length === 0 && !P.writes.some(x => /_settings|^mastery\/kidb\/|^mastery\/kidb$/.test(x.path)));
  ok("next ten don't change: India, Brazil, Australia, Egypt, South Africa, Mexico, Canada, Russia, South Korea, Argentina", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10After.join(",") === "India,Brazil,Australia,Egypt,South Africa,Mexico,Canada,Russia,South Korea,Argentina", P.sum.next10After);
  ok("the path's order is offered; ticked → +1 bank order: her 7 first, then Mexico, Canada, Cuba, Panama, Guatemala … (GEOALL: North America's new capitals before Brazil)", (p => p.writes.length === 168 && p.writes[167].path === "mastery/" + KID + "_bank_order/World Geography" && p.writes[167].value.length === 195 && p.writes[167].value.slice(0, 7).join(",") === LIVE7.map(x => x[0]).join(",") && p.sum.next10After.slice(0, 5).join(",") === "Mexico,Canada,Cuba,Panama,Guatemala")(w.uaPlanAttach(UNIT, KID, TS, { pathOrder: true })));
  ok("making the plans changed nothing", snap(w.G, KID) === before && w.G.writes.length === 0);
  w.uaAttachOpen(UNIT, KID); const h = w._unitStageRowsHtml(w.u, [KID]);
  ok("Mom sees: 7 cards stay, Stage 7 marker, adds 165, next cards unchanged", /7 World Geography cards stay exactly as they are/.test(h) && /Stage 7 · World capitals<\/b> — 6 of 195 on the ladder, 1 learning/.test(h) && /Adds <b>165<\/b> stage words/.test(h) && /next new cards don’t change: India, Brazil/.test(h));
  const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setTimeout(res, 0));
  const up = w.G.writes.find(x => x[1] === "");
  ok("Yes: one update, 167 paths; her cards and settings byte-identical; the list now ends with the 165 more", r && w.G.writes.length === 1 && Object.keys(up[2]).length === 167 && snap(w.G, KID) === before && w.mastFullBank(KID)[D].length === 195 && w.mastFullBank(KID)[D].slice(0, 30).join() === WORLD.join());
  const st = w.unitStageStatus(w.u, KID);
  ok("status: 6 of 195 on the ladder, learning Asia (China), ready at 175, nothing after Stage 7 yet", st.on === 6 && st.learn === 1 && st.fam === "Asia" && st.need === 175 && st.next === null, st);
}

console.log("\n── strays and earlier stages ──");
{ const w = world({ pre: G => { G.masteryData[KID].push({ id: "x_s", subject: D, prompt: "Scotland", answer: "Edinburgh", status: "active", tier: "weekly" }, { id: "x_c", subject: "State Capitals", prompt: "Ohio", answer: "Columbus", status: "active", tier: "monthly" }); } });
  const P = w.uaPlanAttach(UNIT, KID, TS);
  ok("an extra card the path lacks (Scotland) is a stray, kept — never refused (strayOk)", P.ok && JSON.stringify(P.sum.stray) === JSON.stringify(["World Geography · Scotland"]));
  ok("a live State Capitals card is an earlier-stage card (Stage 5), kept — she still hooks at 7", P.sum.stage === 7 && P.sum.earlier === 1 && P.writes.length === 167);
}

console.log("\n── a kid with only Geography words ──");
{ const w = world({ pre: G => { G.masteryData[WK] = [["peninsula", "land with water on three sides"], ["fjord", "her own words for fjord"], ["barge", "a flat boat"]].map(([p, a], i) => ({ id: "w" + i, subject: W, prompt: p, answer: a, status: "active", tier: "weekly" }));
    G.masteryData[WK + "_settings"] = { cat_modes: { [W]: "quiz" }, definitions: { isthmus: "her saved isthmus back" } }; } });
  const sp = w.uaSpec(w.u, WK), P = w.uaPlanAttach(UNIT, WK, TS);
  ok("words only → the highest stage holding a live path word: fjord is Stage 6 → Stage 6; the stock + Kid is closed", sp && sp.stage === 6 && w.uaLocked(w.u, WK) && P.ok && P.sum.stage === 6);
  ok("kept: fjord (a Stage-6 card), peninsula (earlier); barge a stray", P.sum.liveKept === 1 && P.sum.earlier === 1 && JSON.stringify(P.sum.stray) === JSON.stringify(["Geography · barge"]));
  const defsW = P.writes.filter(x => /_settings\/definitions\//.test(x.path)), wordsAdded = P.sum.added.filter(n => w.u.decks.find(d => d.key === W).cards.some(c => c.name === n && c.stage === 6));
  ok("appends the 195 countries + 21 Stage-6 words (fjord is live) — no def on a bank entry", P.sum.added.length === 216 && wordsAdded.length === 21 && P.writes.filter(x => /_custom_items\//.test(x.path)).every(x => Object.keys(x.value).join() === "cat,name"));
  const pathDef = n => w.u.decks.find(d => d.key === W).cards.find(c => c.name === n).def;
  ok("backs: the path's back for 18 of the 21 new words (not isthmus: hers is saved; not precipitation/evaporation: the code's back is already the path's; never a country); volcano gets the path's, not the code's science back", defsW.length === 18 && defsW.length === P.sum.backsAdded.length && !defsW.some(x => /isthmus$/.test(x.path)) && P.sum.backsAdded.every(n => wordsAdded.includes(n)) && defsW.every(x => x.value === pathDef(x.path.split("/").pop())) && defsW.some(x => /volcano$/.test(x.path) && VD.volcano && x.value !== VD.volcano));
  ok("…and a word whose code back IS the path's writes nothing (precipitation, evaporation)", !defsW.some(x => /(precipitation|evaporation)$/.test(x.path)) && pathDef("precipitation") === VD.precipitation);
  ok("never a card, never the deck's mode (her quiz stays) or how many start", !P.writes.some(x => x.path === "mastery/" + WK || /^mastery\/kidw\/\d/.test(x.path) || /cat_modes|cat_intro_max/.test(x.path)));
  w.uaAttachOpen(UNIT, WK);
  ok("Mom sees the backs line: “Saves the back of N new words that have none yet. A back Kidw already has is never replaced.”", new RegExp("Saves the back of <b>" + defsW.length + "</b> new words that have none yet\\. A back Kidw already has is never replaced\\.").test(w._unitStageRowsHtml(w.u, [WK])));
}
{ const w = world({ pre: G => { G.masteryData[WK] = [{ id: "w0", subject: W, prompt: "barge", answer: "a flat boat", status: "active", tier: "weekly" }]; } });
  ok("only non-path words → the first stage with words (Stage 2), barge a stray", w.uaSpec(w.u, WK).stage === 2 && JSON.stringify(w.uaPlanAttach(UNIT, WK, TS).sum.stray) === JSON.stringify(["Geography · barge"])); }
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const before = snap(w.G, KID);
  ok("dry run: Yes writes nothing, she stays un-hooked, nothing changed", w.uaApplyAttach(w.view.plan) === false && w.G.writes.length === 0 && !w.uaHooked(w.u, KID) && snap(w.G, KID) === before); }

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
