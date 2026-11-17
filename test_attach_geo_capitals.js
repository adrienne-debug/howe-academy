/*
 * Node tests — 🏛 GEOADOPT, slice 3 of the Geography Path (PLAN_geography_path_2026-11-10.md §9 row 3, §4; 2026-11-16):
 * hooking a kid whose State Capitals cards and Geography words are already live onto the path at Stage 5.
 * The fixture kid is made up and shaped like the plan's §3 table: 16 live State Capitals cards (Alabama → Kansas, the
 * built-in list, alphabetical, no bank order) and 13 live Geography words out of 24 in the list (7 Stage-4 path words,
 * 2 Stage-6 path words, 4 words that aren't on the path), the deck saved as flip, 2 at a time, every back in definitions.
 *   · the row is DATA-DRIVEN (no kid's name in UA_ATTACH — the repo is public): geoAdoptSpec offers the hook-up to any kid
 *     with a live geography card, at the stage the cards imply (State Capitals → 5);
 *   · ZERO card writes: exactly enrolled + kidStage (every one of the 50 states is already in the built-in list → no bank
 *     appends); every live card, the settings and the list are byte-identical after;
 *   · the 7 earlier-stage words and the 2 later-stage words are counted as kept, the 4 non-path words as strays (strayOk);
 *   · the next ten new cards don't change (Kentucky, Louisiana, Maine …) — unless Mom ticks "the path's order from here",
 *     which writes ONE bank order (the 16 live first, then the regions from the family's home);
 *   · the 50 names and 50 backs are the built-in ones byte for byte (MAST_*_BANK / MAST_VOCAB_DEFS); likewise the 30 world;
 *   · the stock "+ Kid" is closed for that kid (form, enroll, _ustApply), open for a kid with no geography card;
 *   · dry run / not Mom / data changed / already hooked write nothing; a record from before this slice can't hook up;
 *   · after the hook-up, ➡ Stage 6 never replaces a saved back (the §4 guard) and leaves the live words alone.
 *   run: node test_attach_geo_capitals.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const UNIT = "geography_path", KID = "kida", OTHER = "kidc", D = "State Capitals", W = "Geography";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible", "haKeyOk", "haKey"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();
const builtIn = deck => JSON.parse(new RegExp('"' + deck + '":(\\[[^\\]]*\\])').exec(src)[1]);   // the built-in list, read from the page
const CAPS = builtIn(D), WORLD = builtIn("World Geography");
const VD = new Function(VOCAB + "\nreturn MAST_VOCAB_DEFS;")();   // the built-in backs only (before GEOADOPT adds the 30 more)

// ── the fixture: a made-up 4th-grader, shaped like §3 ──
const RUNG = [["active", "monthly"], ["active", "monthly"], ["active", "monthly"], ["active", "monthly"], ["active", "monthly"], ["active", "monthly"],
  ["active", "bi_weekly"], ["active", "bi_weekly"], ["active", "bi_weekly"], ["active", "bi_weekly"], ["active", "bi_weekly"], ["active", "weekly"],
  ["active", "every_other_day"], ["active", "every_other_day"], ["introduction", "daily"], ["introduction", "daily"]];
const WORDS_LIVE = [   // [prompt, status, tier, review_mode] — 7 Stage-4, 2 Stage-6, 4 not on the path
  ["lines of latitude", "active", "monthly", "flash"], ["lines of longitude", "active", "monthly", "flash"], ["atmosphere", "active", "monthly", "flash"],
  ["cardinal directions", "active", "monthly", "flash"], ["intermediate directions", "active", "monthly", "flash"], ["carbon footprint", "active", "monthly", "flash"],
  ["glacier", "active", "bi_weekly", "recite"], ["peak", "active", "bi_weekly", "recite"], ["elevation", "active", "bi_weekly", "recite"],
  ["contour lines", "active", "weekly", "recite"], ["irrigation", "active", "every_other_day", "recite"], ["barge", "introduction", "daily", "recite"], ["fertilizer", "introduction", "daily", "recite"]];
const NOT_PATH = { "carbon footprint": "the total amount of greenhouse gases a person or thing puts into the air", irrigation: "bringing water to crops through pipes or ditches",
  barge: "a long flat-bottomed boat for carrying heavy loads", fertilizer: "something added to soil to help plants grow", industry: "the making of goods in factories", fumarole: "an opening in the ground that lets out steam and gases" };
const PATH_WORDS = ["cardinal directions", "intermediate directions", "lines of latitude", "lines of longitude", "elevation", "contour lines", "peak",
  "tributaries", "glacier", "atmosphere", "tectonic plates", "caldera", "geyser", "precipitation", "evaporation", "biome", "tundra", "taiga"];   // 7 Stage-4 + 11 Stage-6 path words in the list
function fixture(unitWords) {
  const back = n => NOT_PATH[n] != null ? NOT_PATH[n] : unitWords[n];
  const items = [];
  for (let i = 0; i < 40; i++) items.push({ id: "kid_mf" + i, subject: "Math Facts", type: "math facts", prompt: i + " × 3", answer: String(i * 3), status: "active", tier: "weekly", review_mode: "flash", cycle: 1, consecutive_correct: 2, tally_dots: 5, next_due: 30 + i, drop_count: 0 });
  CAPS.slice(0, 16).forEach((s, i) => items.push({ id: "kid_sc" + i, subject: D, type: "state capitals", prompt: s, answer: VD[s.toLowerCase()], status: RUNG[i][0], tier: RUNG[i][1], review_mode: "flash", cycle: 1, consecutive_correct: i, tally_dots: i % 6, next_due: 40 + i, drop_count: 0 }));
  WORDS_LIVE.forEach(([p, st, t, rm], i) => items.push({ id: "kid_geo" + i, subject: W, type: "geography", prompt: p, answer: back(p), status: st, tier: t, review_mode: rm, cycle: 1, consecutive_correct: i, tally_dots: i % 6, next_due: 41 + i, drop_count: 0 }));
  const custom = [];
  for (let i = 0; i < 60; i++) custom.push({ cat: "Vocabulary", name: "word" + i });
  PATH_WORDS.concat(Object.keys(NOT_PATH)).forEach((n, i) => custom.push(i % 2 ? { cat: W, name: n } : { cat: W, name: n, def: back(n) }));
  const definitions = {}; PATH_WORDS.concat(Object.keys(NOT_PATH)).forEach(n => { definitions[n] = back(n); });
  return { items, custom, settings: { cat_modes: { [W]: "flip", "Math Facts": "quiz" }, cat_intro_max: { [W]: 2 }, definitions, auto_pull: true } };
}

function world(o) {
  o = o || {};
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry, masteryData: {}, currData: { subjects: { [KID]: {}, [OTHER]: {} }, done: {} }, unitStudies: {} };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "BANKS", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    let masteryKid="${KID}"; const MAST_BANK_MAP=BANKS; ${VOCAB}
    ${GATE}
    ${block}
    ${VOCAB_GEO}
    return { STARTER_UNITS, UA_ATTACH, uaSpec, uaLocked, uaHooked, uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachClose, uaAttachReorder, uaAttachHtml, _unitStageRowsHtml, _ustApply, _ustCards,
      unitStageStatus, unitStageMoveUp, unitStageFormOpen, unitStageFormSet, unitStageEnroll, mastFullBank, geoAdoptSpec, geoUnitRecord, geoPicOf, GEO_DECK_KEYS, MAST_VOCAB_DEFS,
      get view(){ return uaAttachView; }, get form(){ return unitStageForm; } };`)(G, db, { [KID]: { [D]: CAPS.slice() }, [OTHER]: {} });
  const u = w.STARTER_UNITS.geography_path(); if (!o.noUnit) G.unitStudies[UNIT] = u;
  const unitWords = {}; u.decks.find(d => d.key === W).cards.forEach(c => { unitWords[c.name] = c.def; });
  const fx = fixture(unitWords);
  Object.assign(G.masteryData, { [KID]: fx.items, [KID + "_custom_items"]: fx.custom, [KID + "_settings"]: fx.settings, [OTHER]: [], [OTHER + "_custom_items"]: [], [OTHER + "_settings"]: {} });
  if (o.pre) o.pre(G, u);
  w.G = G; w.u = u; return w;
}
const snap = (G, k) => JSON.stringify([G.masteryData[k], G.masteryData[k + "_custom_items"], G.masteryData[k + "_settings"], G.masteryData[k + "_bank_order"]]);

(async () => {
console.log("── the built-in names and backs, byte for byte ──");
{ const w = world(), u = w.u, sc = u.decks.find(d => d.key === D).cards, wg = u.decks.find(d => d.key === "World Geography").cards;
  ok("State Capitals: the 50 built-in names exactly (as a set), each once, all Stage 5, flip", sc.length === 50 && JSON.stringify(sc.map(c => c.name).slice().sort()) === JSON.stringify(CAPS.slice().sort()) && sc.every(c => c.stage === 5) && u.decks.find(d => d.key === D).mode === "flip");
  ok("State Capitals: all 50 backs === MAST_VOCAB_DEFS byte for byte (St. Paul, Jefferson City, Oklahoma City …)", sc.every(c => typeof c.def === "string" && c.def === VD[c.name.toLowerCase()]) && sc.find(c => c.name === "Minnesota").def === "St. Paul", sc.filter(c => c.def !== VD[c.name.toLowerCase()]).map(c => c.name));
  ok("World Geography: the 30 built-in names exactly, each with its built-in back (Pretoria (executive), Cape Town (legislative) …)", WORLD.length === 30 && WORLD.every(n => { const c = wg.find(x => x.name === n); return c && c.def === VD[n.toLowerCase()]; }) && wg.find(c => c.name === "South Africa").def === "Pretoria (executive), Cape Town (legislative)");
  ok("the 80 built-in names: none is respelled, none is missing (byte-compare of name + back)", JSON.stringify(CAPS.concat(WORLD).map(n => [n, VD[n.toLowerCase()]])) === JSON.stringify(CAPS.concat(WORLD).map(n => { const c = sc.concat(wg).find(x => x.name === n); return [c.name, c.def]; })));
  ok("State Capitals families = Stage 4's regions, same order, same states (the capitals of the neighbourhood whose shapes she just learned)", JSON.stringify(sc.map(c => [c.family, c.name])) === JSON.stringify(u.decks.find(d => d.key === "State Shapes").cards.map(c => [c.family, c.name])));
  ok("pictures: a State Capitals card draws Stage 4's outline (no capital on the front)", JSON.stringify(w.geoPicOf(D, "Alabama", u)) === JSON.stringify(w.geoPicOf("State Shapes", "Alabama", u)) && w.geoPicOf(D, "Puerto Rico", u) === null);
}

console.log("\n── the row (data-driven, no kid named) ──");
{ const w = world();
  ok("UA_ATTACH has NO geography_path row — the public repo names no kid", !w.UA_ATTACH.geography_path && src.split("const UA_ATTACH=").length === 2);
  const sp = w.uaSpec(w.u, KID);
  ok("geoAdoptSpec: live State Capitals → Stage 5, fill, strayOk, the Geography deck read too", sp && sp.stage === 5 && sp.fill && sp.strayOk && JSON.stringify(sp.alsoDecks) === JSON.stringify([D, W]), sp);
  ok("a kid with no geography card has no row (stock enroll stays theirs)", w.uaSpec(w.u, OTHER) === null && !w.uaLocked(w.u, OTHER));
  ok("another unit never gets a geography row", w.geoAdoptSpec({ id: "math_fluency_path", decks: [] }, KID) === null);
  ok("the GEOADOPT block names no kid and writes nothing", (() => { const b = src.slice(src.indexOf("// GEOADOPT_START"), src.indexOf("// GEOADOPT_END")); return b.length > 2000 && !/\b(julian|lincoln|ellis|lucy|howe|adrienne)\b/i.test(b) && !/db\.ref\(|\.set\(|\.update\(|HA_LS|localStorage/.test(b); })());
}

console.log("\n── the plan ──");
const TS = 1763300000000;
{ const w = world(), before = snap(w.G, KID), P = w.uaPlanAttach(UNIT, KID, TS);
  ok("plan is ready: Stage 5 · State capitals", P.ok && P.sum.stage === 5 && P.sum.label === "State capitals", P.why);
  ok("16 State Capitals cards kept: 14 on the ladder, 2 learning, of 50", P.sum.liveKept === 16 && P.sum.onLadder === 14 && P.sum.learning === 2 && P.sum.total === 50, P.sum);
  ok("Geography words: 7 earlier-stage (kept), 2 later-stage (kept), 4 not on the path → strays left as they are", P.sum.earlier === 7 && P.sum.later === 2 && JSON.stringify(P.sum.stray.slice().sort()) === JSON.stringify(["Geography · barge", "Geography · carbon footprint", "Geography · fertilizer", "Geography · irrigation"]), P.sum);
  ok("no back differs (her answers ARE the built-in backs)", P.sum.backDiffers.length === 0);
  ok("adds nothing to the list — all 50 states are already in the built-in list; no back saved", P.sum.added.length === 0 && P.sum.backsAdded.length === 0);
  ok("exactly 2 writes: enrolled + kidStage (via attach, Stage 5) — ZERO card writes, no settings, no list", P.writes.length === 2 && P.writes[0].path === "unitStudies/geography_path/enrolled/" + KID && P.writes[0].value === true && P.writes[1].path === "unitStudies/geography_path/kidStage/" + KID && JSON.stringify(P.writes[1].value) === JSON.stringify({ stage: 5, subject: "", knows: "", map: "", ts: TS, via: "attach" }), P.writes);
  ok("next ten new cards don't change: Kentucky, Louisiana, Maine … Montana (alphabetical — Q4 default)", JSON.stringify(P.sum.next10Before) === JSON.stringify(P.sum.next10After) && P.sum.next10After.join(",") === "Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana", P.sum.next10After);
  ok("the path's order is offered for State Capitals (it differs from her alphabetical list)", JSON.stringify(P.sum.reorderable) === JSON.stringify([D]));
  ok("making the plan changed nothing", snap(w.G, KID) === before && w.G.writes.length === 0);
  const P2 = w.uaPlanAttach(UNIT, KID, TS, { pathOrder: true }), bo = P2.writes[2];
  ok("with the checkbox: ONE more write — bank order for State Capitals: her 16 live first, then the regions from home", P2.ok && P2.writes.length === 3 && bo.path === "mastery/" + KID + "_bank_order/State Capitals" && bo.value.length === 50 && JSON.stringify(bo.value.slice(0, 16)) === JSON.stringify(CAPS.slice(0, 16)) && bo.value.slice(16, 21).join(",") === "North Carolina,South Carolina,Virginia,Tennessee,Kentucky", bo && bo.value.slice(0, 22));
  ok("…and the next new cards say so: North Carolina, South Carolina, Virginia … (today: Kentucky …)", P2.sum.next10After.slice(0, 3).join(",") === "North Carolina,South Carolina,Virginia" && P2.sum.next10Before[0] === "Kentucky");
}

console.log("\n── Mom's screen ──");
{ const w = world();
  let h = w._unitStageRowsHtml(w.u, [KID, OTHER]);
  ok("row: 🔗 Hook up Kida (no stock + Kida); the other kid keeps the stock button", /Hook up Kida/.test(h) && !/unitStageFormOpen\('geography_path','kida'\)/.test(h) && /unitStageFormOpen\('geography_path','kidc'\)/.test(h));
  w.uaAttachOpen(UNIT, KID); h = w._unitStageRowsHtml(w.u, [KID]);
  ok("the plan in plain words: 16 cards stay, Stage 5 marker, earlier 7, later 2, strays named, nothing added", /16 State Capitals cards stay exactly as they are/.test(h) && /Stage 5 · State capitals<\/b> — 14 of 50 on the ladder, 2 learning/.test(h) && /7 cards from earlier stages/.test(h) && /2 cards from later stages of the path/.test(h) && /Geography · carbon footprint/.test(h) && /Adds nothing to the list/.test(h));
  ok("the checkbox, off by default: “New State Capitals cards in the path’s order from here (Southeast, Northeast, Midwest…)”", /type="checkbox" onchange="uaAttachReorder/.test(h) && /New State Capitals cards in the path’s order from here \(Southeast, Northeast, Midwest…\)/.test(h) && /keep coming in Kida’s list order/.test(h));
  w.uaAttachReorder(true); h = w._unitStageRowsHtml(w.u, [KID]);
  ok("ticking it rebuilds the plan (3 writes) and shows it checked; unticking goes back to 2", w.view.plan.writes.length === 3 && / checked onchange="uaAttachReorder/.test(h) && (w.uaAttachReorder(false), w.view.plan.writes.length === 2));
}

console.log("\n── the stock enroll is closed for her ──");
{ const w = world(), before = snap(w.G, KID);
  ok("uaLocked; the stock form won't open; _ustApply refuses", w.uaLocked(w.u, KID) && (w.unitStageFormOpen(UNIT, KID), w.form === null) && w._ustApply(w.u, KID, 5, "", "", "") === null);
  w.unitStageFormOpen(UNIT, OTHER); w.unitStageFormSet("how", "checkup");
  ok("…while the other kid's stock form opens as always", w.form && w.form.kid === OTHER);
  ok("nothing written, nothing changed", w.G.writes.length === 0 && snap(w.G, KID) === before);
}

console.log("\n── Yes ──");
{ const w = world(), before = snap(w.G, KID);
  w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan); await new Promise(res => setTimeout(res, 0));
  const up = w.G.writes.find(x => x[0] === "update" && x[1] === "");
  ok("one multi-path update with exactly the plan's 2 paths", r === true && w.G.writes.length === 1 && up && JSON.stringify(Object.keys(up[2])) === JSON.stringify(["unitStudies/geography_path/enrolled/" + KID, "unitStudies/geography_path/kidStage/" + KID]));
  ok("every card, the list and the settings are byte-identical after (tiers, due days, answers, backs, the deck's flip / 2 at a time)", snap(w.G, KID) === before);
  ok("in memory: enrolled + kidStage via attach → the row is now the normal Stage 5 row, the lock is gone", w.u.enrolled[KID] === true && w.u.kidStage[KID].via === "attach" && !w.uaLocked(w.u, KID) && /Stage 5 · State capitals/.test(w._unitStageRowsHtml(w.u, [KID])));
  const st = w.unitStageStatus(w.u, KID);
  ok("status: 14 of 50 on the ladder, 2 learning (Iowa, Kansas → learning the Midwest), ready at 45, next Stage 6", st.on === 14 && st.learn === 2 && st.total === 50 && st.need === 45 && st.next && st.next.n === 6 && st.fam === "Midwest", st);
  ok("a second plan says she is already hooked up", (p => !p.ok && /already hooked up/.test(p.why))(w.uaPlanAttach(UNIT, KID)));
}
{ const w = world(), before = snap(w.G, KID);
  w.uaAttachOpen(UNIT, KID); w.uaAttachReorder(true); w.uaApplyAttach(w.view.plan); await new Promise(res => setTimeout(res, 0));
  const up = w.G.writes.find(x => x[1] === "");
  ok("with the checkbox: 3 paths — the bank order is the only mastery path, and the cards are untouched", up && Object.keys(up[2]).length === 3 && Object.keys(up[2]).filter(p => /^mastery\//.test(p)).join() === "mastery/" + KID + "_bank_order/State Capitals" && JSON.stringify(w.G.masteryData[KID]) === JSON.stringify(JSON.parse(before)[0]) && JSON.stringify(w.G.masteryData[KID + "_settings"]) === JSON.stringify(JSON.parse(before)[2]));
  ok("…and the list now reads the 16, then North Carolina, South Carolina, Virginia …", w.mastFullBank(KID)[D].slice(16, 19).join(",") === "North Carolina,South Carolina,Virginia");
}

console.log("\n── refusals write nothing ──");
{ const w = world({ dry: true }); w.uaAttachOpen(UNIT, KID); const r = w.uaApplyAttach(w.view.plan);
  ok("dry run: Yes writes nothing, says so, she stays un-hooked", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg) && !w.uaHooked(w.u, KID)); }
{ const w = world({ noDb: true }); w.uaAttachOpen(UNIT, KID); ok("no database: nothing written", w.uaApplyAttach(w.view.plan) === false && !w.uaHooked(w.u, KID)); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const plan = w.view.plan; w.G.mom = false;
  ok("not Mom: nothing", w.uaApplyAttach(plan) === false && w.G.writes.length === 0); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); const same = w.view.plan; w.G.masteryData[KID].push({ id: "x0", subject: "Math Facts", prompt: "99 × 3", status: "active", tier: "weekly" });
  ok("a change that doesn't touch the plan's writes (a new Math Facts card) still lets Yes through — the writes are compared, not the whole kid", JSON.stringify(w.uaPlanAttach(UNIT, KID, same.ts).writes) === JSON.stringify(same.writes)); }
{ const w = world(); w.uaAttachOpen(UNIT, KID); w.uaAttachReorder(true); const plan = w.view.plan; w.G.masteryData[KID].push({ id: "x1", subject: D, prompt: "Kentucky", status: "introduction", tier: "daily" });
  ok("her data changed after the plan (a new Kentucky card moves the bank order): nothing written, the new plan shown", w.uaApplyAttach(plan) === false && w.G.writes.length === 0 && /changed since the plan/.test(w.view.msg)); }
{ const w = world({ pre: (G, u) => { u.decks = u.decks.filter(d => d.key !== D && d.key !== "World Geography"); u.stages = u.stages.filter(s => s.n !== 5 && s.n !== 7); } });
  const P = w.uaPlanAttach(UNIT, KID, TS);
  ok("a record added before this slice (no Stage 5): still locked to the stock enroll, the plan says why, nothing to write", w.uaLocked(w.u, KID) && !P.ok && /added before Stage 5/.test(P.why) && P.writes.length === 0 && w._ustApply(w.u, KID, 4, "", "", "") === null);
}

console.log("\n── after the hook-up: ➡ Stage 6 (the §4 guard) ──");
{ const w = world(); w.uaAttachOpen(UNIT, KID); w.uaApplyAttach(w.view.plan); await new Promise(res => setTimeout(res, 0));
  const st = w.G.masteryData[KID + "_settings"], savedBefore = JSON.stringify(st.definitions), live = JSON.stringify(w.G.masteryData[KID].filter(i => i.subject === W));
  w.G.writes.length = 0; w.unitStageMoveUp(UNIT, KID);
  const dw = w.G.writes.find(x => x[1] === "mastery/" + KID + "_settings/definitions"), stage6 = w._ustCards(w.u, 6).filter(c => c._dk === W);
  const mine = stage6.filter(c => PATH_WORDS.includes(c.name)).map(c => c.name), fresh = stage6.filter(c => !PATH_WORDS.includes(c.name)).map(c => c.name);
  ok("➡ Stage 6: none of her 11 saved Stage-6 backs is written again; the 11 new words' backs are", mine.length === 11 && fresh.length === 11 && dw && mine.every(n => !(n in dw[2])) && fresh.every(n => typeof dw[2][n] === "string"), dw && Object.keys(dw[2]));
  ok("…her saved backs are all exactly as before (no key replaced)", Object.keys(JSON.parse(savedBefore)).every(k => st.definitions[k] === JSON.parse(savedBefore)[k]));
  ok("…her 13 live Geography cards are byte-identical (atmosphere and glacier aren't minted twice)", JSON.stringify(w.G.masteryData[KID].filter(i => i.subject === W).slice(0, 13)) === live && w.G.masteryData[KID].filter(i => i.subject === W && (i.prompt === "atmosphere" || i.prompt === "glacier")).length === 2);
}

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
