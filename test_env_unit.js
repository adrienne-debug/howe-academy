/*
 * Node tests — 🌿 NC Envirothon starter unit, PR 1 of 8 (ENVUNIT block; her ask 2026-10-27; design
 * DESIGN_envirothon_console_2026-10-27.md §6 + PLAN_envirothon_2026-10-27.md §2).
 *   · envirothon.js (generated from envirothon/nc_envirothon_unit.json) registers window.HoweEnvirothon: 15 decks,
 *     4,371 cards, every card with name / def / src, the `core` flag kept, nothing dropped.
 *   · STARTER_UNITS.nc_envirothon is a THIN record (cards live in the code file): 6 stages in the club's order,
 *     15 decks, modes Terms = flip · Facts = flash · ID = flip · Current Issue = flash, grouped by Key Concept.
 *   · Enroll (stage 0, dry run and live): every one of the 15 decks held + its mode and cap; zero cards minted;
 *     the stage's bank entries and backs only; targeted paths only; the 🌿 session written once (pattern pick → ideas → type).
 *   · The enroll write is measured and printed (paths + bytes) — the numbers in the PR come from here.
 * Runs the real STARTER_UNITS block sliced from index.html plus the real envirothon.js.   run: node test_env_unit.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const LIB = require(path.join(__dirname, "envirothon.js"));
const JSON_UNIT = JSON.parse(fs.readFileSync(path.join(__dirname, "envirothon", "nc_envirothon_unit.json"), "utf8"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 300) : "")); } };
const bytes = v => Buffer.byteLength(JSON.stringify(v), "utf8");

const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);
const ea = src.indexOf("// ENVUNIT_START"), eb = src.indexOf("// ENVUNIT_END");
ok("ENVUNIT block present once, inside the STARTER_UNITS block, before UNIT_STAGES", ea > a && eb > ea && eb < src.indexOf("// UNIT_STAGES_START") && src.indexOf("// ENVUNIT_START", ea + 1) < 0);

// A tiny world: masteryData, the unitStudies library, a recording db, the few globals the block leans on.
function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, writes: [], dry: !!o.dry, mom: o.mom !== false, rendered: 0,
    content: { innerHTML: "" }, window: o.lib === null ? {} : { HoweEnvirothon: o.lib || LIB }, loads: 0 };
  const db = o.db || { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const r = fn(null); G.writes.push(["transaction", p, r]); return Promise.resolve({ committed: true }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData={subjects:{}}; let unitStudies=G.unitStudies; const window=G.window; let tab="units";
    const document={ getElementById:()=>G.content, createElement:()=>{ G.loads++; return {}; }, head:{ appendChild(){} } };
    const location={ hostname:"localhost" };
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const HA_LS={ setItem(){} };
    function mastDefKeyOk(p){ return !/[.#$\\[\\]\\/]/.test(p); }
    function mastDefKey(p){ p=String(p); return mastDefKeyOk(p)?p:p.replace(/[.#$\\[\\]\\/%]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")); }
    function mastGateChapter(){ return null; } function mastFullBank(){ return {}; }
    ${block}
    return { STARTER_UNITS, ENV_UNIT_ID, ENV_DECKS, ENV_STAGES, ENV_SESSION, envUnitRecord, envCardsInCode, envHydrate, envHydrateAll, envEnrollHold, envEnrollSession, envSessionRecord,
      _starterUnitsHtml, starterUnitAdd, _unitStagedEnrollPending, _ustCards, _ustFamilies, _ustStagesWithCards, _ustApply,
      unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp, _unitStageRowsHtml, get us(){ return unitStudies; } };`)(G, db);
  api.G = G; return api;
}

console.log("── envirothon.js (the card file) ──");
const U = LIB.unit, DECKS = U.decks, CARDS = DECKS.flatMap(d => d.cards.map(c => Object.assign({ _dk: d.key }, c)));
ok("registers { version 1, unit } with id nc_envirothon", LIB.version === 1 && U.id === "nc_envirothon" && typeof LIB.built === "string");
ok("15 decks", DECKS.length === 15, DECKS.map(d => d.key));
ok("4,371 cards", CARDS.length === 4371, CARDS.length);
ok("every card has name, def (non-empty strings) and src", CARDS.every(c => typeof c.name === "string" && c.name.trim() && typeof c.def === "string" && c.def.trim() && typeof c.src === "string" && c.src.trim()));
ok("every card keeps group, concept, station, kind, order, stage and the core flag", CARDS.every(c => "group" in c && "concept" in c && "station" in c && "kind" in c && typeof c.order === "number" && typeof c.stage === "number" && typeof c.core === "boolean"));
ok("1,525 cards flagged core (COUNTS.md; 44 added 2026-10-28 from the 2021–22 Area 8 tests, 211 set to core:false by Trim 1, 32 put back the same day)", CARDS.filter(c => c.core).length === 1525, CARDS.filter(c => c.core).length);
ok("family = the Key Concept (group) on every card — the staged engine reads card.family", CARDS.every(c => c.family === c.group));
ok("no deck key has a character Firebase forbids (. # $ [ ] /)", DECKS.every(d => !/[.#$\[\]\/]/.test(d.key)));
ok("no card name repeats inside its deck", DECKS.every(d => new Set(d.cards.map(c => c.name)).size === d.cards.length));
{ const unsafe = CARDS.filter(c => /[.#$\[\]\/]/.test(c.name)); console.log("     fronts with . # $ [ ] / (saved under their coded key): " + unsafe.length + ", none in stage 0: " + !unsafe.some(c => c.stage === 0));
  ok("fronts with . / exist only outside stage 0 (their backs save under mastDefKey)", !unsafe.some(c => c.stage === 0)); }
ok("envirothon.js matches the JSON it was built from (same cards, same fields, + family)", (() => {
  const jc = JSON_UNIT.decks.flatMap(d => d.cards.map(c => Object.assign({}, c, { family: c.group })));
  return JSON_UNIT.decks.length === DECKS.length && jc.length === CARDS.length && jc.every((c, i) => { const k = Object.assign({}, CARDS[i]); delete k._dk; return JSON.stringify(k) === JSON.stringify(c); }); })());
ok("stage field runs 0…5 and each deck's cards sit in one stage", DECKS.every(d => new Set(d.cards.map(c => c.stage)).size === 1) && new Set(CARDS.map(c => c.stage)).size === 6);

console.log("\n── the record (STARTER_UNITS.nc_envirothon) ──");
const W0 = world(); const R = W0.STARTER_UNITS.nc_envirothon();
ok("registered as starter nc_envirothon, version 1, last in the registry", R.id === "nc_envirothon" && R.starter === "nc_envirothon" && R.starterVer === 1 && Object.keys(W0.STARTER_UNITS).pop() === "nc_envirothon");
ok("title NC Envirothon, 🌿, notebook insert off, nobody enrolled", R.title === "NC Envirothon" && R.emoji === "\u{1F33F}" && R.nbInsert === false && !("enrolled" in R) && !("kidStage" in R));
ok("THIN: cards live in the code (cardsInCode, cardCount 4371), no deck carries cards, record under 4 KB", R.cardsInCode === true && R.cardCount === 4371 && R.decks.every(d => !("cards" in d)) && bytes(R) < 4096, bytes(R));
ok("6 stages in the club's order: General concepts, Forestry, Soils/Land Use, Aquatic Ecology, Wildlife, Current Environmental Issues",
  R.stages.map(s => s.n + ":" + s.label).join("|") === "0:General concepts|1:Forestry|2:Soils/Land Use|3:Aquatic Ecology|4:Wildlife|5:Current Environmental Issues" && R.stages.every(s => s.weeklyFrom === 0));
ok("15 decks, same keys and order as envirothon.js", R.decks.map(d => d.key).join("|") === DECKS.map(d => d.key).join("|"));
ok("deck modes: Terms flip · Facts flash · ID flip · Current Issue flash", R.decks.every(d => d.mode === (/· (Terms|ID)$/.test(d.key) ? "flip" : "flash")) && R.decks.find(d => d.key === "Current Issue · 2027").mode === "flash");
ok("deck modes match the JSON's", R.decks.every((d, i) => d.mode === DECKS[i].mode));
ok("every deck: introCap 3, grouped by Key Concept (group), flipFace name, bankOnly, no defsOnBank", R.decks.every(d => d.introCap === 3 && d.groupBy === "group" && d.flipFace === "name" && d.bankOnly === true && !("defsOnBank" in d)));
ok("every deck's stage matches its cards' stage; per-deck counts match envirothon.js", R.decks.every((d, i) => DECKS[i].cards.every(c => c.stage === d.stage) && d.n === DECKS[i].cards.length));
ok("stations: general, forestry, soils, aquatics, wildlife, cei", [...new Set(R.decks.map(d => d.station))].join() === "general,forestry,soils,aquatics,wildlife,cei");
ok("no cardLessons, no famSort, no activities (nothing of AAS / the interest units rides along)", !("cardLessons" in R) && !("famSort" in R) && !("activities" in R));
ok("staged unit → the plain enroll stays closed", W0._unitStagedEnrollPending(R));
ok("fresh object per call", W0.STARTER_UNITS.nc_envirothon() !== R);
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
ok("Mom sees it in 📚 Starter units with its count and stages", /starterUnitAdd\('nc_envirothon'\)/.test(W0._starterUnitsHtml()) && W0._starterUnitsHtml().indexOf("4371 cards") > 0 && /5\. Current Environmental Issues/.test(W0._starterUnitsHtml()));
ok("kids see nothing; hidden once the family has it", world({ mom: false })._starterUnitsHtml() === "" && !/starterUnitAdd\('nc_envirothon'\)/.test(world({ unitStudies: { nc_envirothon: { id: "nc_envirothon" } } })._starterUnitsHtml()));

console.log("\n── 📚 Add: one thin create-only write, then the code's cards in memory ──");
{ const w = world(); w.starterUnitAdd("nc_envirothon");
  const t = w.G.writes.filter(x => x[0] === "transaction");
  console.log("     unitStudies/nc_envirothon write: " + bytes(t[0][2]) + " bytes (the full card set would be " + bytes(U) + ")");
  ok("ONE transaction at unitStudies/nc_envirothon, thin (no cards), under 4 KB", t.length === 1 && t[0][1] === "unitStudies/nc_envirothon" && t[0][2].decks.every(d => !("cards" in d)) && bytes(t[0][2]) < 4096);
  ok("…and nothing else written", w.G.writes.length === 1); }
{ const w = world({ dry: true, db: { ref() { throw new Error("db touched in dry run"); } } }); w.starterUnitAdd("nc_envirothon");
  const u = w.us.nc_envirothon;
  ok("dry run: added locally, no DB write, hydrated from envirothon.js (4371 cards in memory)", u && u.decks.reduce((s, d) => s + d.cards.length, 0) === 4371 && w.G.rendered === 1); }
{ const w = world({ lib: null }); w.G.unitStudies.nc_envirothon = w.envUnitRecord();
  const r = w.envHydrateAll();
  ok("envirothon.js not loaded yet → one script tag asked for, cards wait", r === false && w.G.loads === 1 && !w.us.nc_envirothon.decks[0].cards);
  w.envHydrateAll(); ok("asked only once while loading", w.G.loads === 1); }
{ const w = world(); const u = w.envUnitRecord(); u.decks[0].cards = { 1: { def: "Mom's wording" }, 2: { name: "Something else", def: "x" } };
  w.envHydrate(u);
  ok("a saved card edit rides on the code card at its index when the name agrees; a different name is ignored", u.decks[0].cards.length === 28 && u.decks[0].cards[1].def === "Mom's wording" && u.decks[0].cards[1].name === DECKS[0].cards[1].name && u.decks[0].cards[2].def === DECKS[0].cards[2].def);
  ok("other units are left alone", w.envHydrate({ id: "word_roots", decks: [{ key: "x" }] }) === false); }

console.log("\n── enroll Lincoln (stage 0) — live writes recorded ──");
// (the live Add commits through a promise, so the family copy is placed directly here, as the listener would)
function enrollLincoln(o) { const w = world(o); w.G.unitStudies.nc_envirothon = w.envUnitRecord(); w.envHydrateAll(); w.G.writes.length = 0;
  w.unitStageFormOpen("nc_envirothon", "lincoln"); w.unitStageEnroll(); return w; }
{ const w = enrollLincoln(), M = w.G.masteryData, st = M.lincoln_settings, S = M.lincoln_sessions, u = w.us.nc_envirothon;
  const items = M.lincoln || [];
  ok("the + Lincoln form opens at stage 0 (General concepts) with the six stages to pick from", (() => { const w2 = world(); w2.G.unitStudies.nc_envirothon = w2.envUnitRecord(); w2.envHydrateAll(); w2.unitStageFormOpen("nc_envirothon", "lincoln");
    const h = w2._unitStageRowsHtml(w2.us.nc_envirothon, ["lincoln"]); return /<option value="0" selected>0\. General concepts<\/option>/.test(h) && /5\. Current Environmental Issues/.test(h) && /through the The Biosphere/.test(h); })());
  ok("ZERO cards minted — no mastery/lincoln item", items.length === 0 && !w.G.writes.some(x => x[1] === "mastery/lincoln"));
  ok("all 15 decks held (cat_hold true)", R.decks.every(d => st.cat_hold[d.key] === true) && Object.keys(st.cat_hold).length === 15);
  ok("all 15 decks: mode set (Terms/ID flip, Facts/CEI flash) and learning cap 3", R.decks.every(d => st.cat_modes[d.key] === d.mode && st.cat_intro_max[d.key] === 3));
  const bank = M.lincoln_custom_items;
  ok("bank = the 90 stage-0 cards only, {cat,name} with no def", bank.length === 90 && bank.every(e => (e.cat === "General Concepts · Terms" || e.cat === "General Concepts · Facts") && e.name && !("def" in e)));
  ok("backs = the 90 stage-0 definitions in the definitions map (no . / fronts in stage 0)", Object.keys(st.definitions).length === 90 && DECKS[0].cards.every(c => st.definitions[c.name] === c.def));
  ok("enrolled + kidStage written; stage 0 recorded", u.enrolled.lincoln === true && u.kidStage.lincoln.stage === 0);
  ok("status: 0 of 0 on the ladder (held words don't count), next = Stage 1 Forestry", (() => { const s = w.unitStageStatus(u, "lincoln"); return s && s.total === 0 && s.on === 0 && s.next && s.next.n === 1 && s.next.label === "Forestry"; })());
  // the 🌿 session
  const sess = S && S.envirothon;
  ok("🌿 Envirothon session created: kind deck over all 15 decks, solo", sess && sess.name === "Envirothon" && sess.emoji === "\u{1F33F}" && sess.kind === "deck" && sess.who === "solo" && sess.decks.join("|") === R.decks.map(d => d.key).join("|"));
  ok("pattern = pick → ideas → type (auto-graded only, no self-graded flip day)", JSON.stringify(sess.pattern) === JSON.stringify(["pick", "ideas", "type"]) && !sess.pattern.includes("rec") && !sess.pattern.includes("say"));
  ok("modest: 5 new a day, 12 cards a sitting, 2 decks introducing, 2 passes, mix in weekly, hand off bi-weekly, bank order", sess.newPerDay === 5 && sess.maxCards === 12 && sess.focusDecks === 2 && sess.passes === 2 && sess.mixInAt === "weekly" && sess.handOffAt === "bi_weekly" && sess.order === "bank");
  ok("no typeAnswer / bothWays / budgetRole / audio override on the record", !("typeAnswer" in sess) && !("bothWays" in sess) && !("budgetRole" in sess) && !("audio" in sess));
  ok("the three pattern steps exist in the engine", ['MST_PATTERN_MODES.push("pick")', 'MST_PATTERN_MODES.push("ideas")', 'const MST_PATTERN_MODES = ["rec", "say", "type"]'].every(s => src.indexOf(s) > 0));
  ok("Daily Study untouched: no write to any other session", w.G.writes.filter(x => /_sessions\//.test(x[1])).every(x => x[1] === "mastery/lincoln_sessions/envirothon"));
  // the writes
  const paths = w.G.writes.map(x => x[1]);
  ok("writes are targeted: bank index update, settings leaves, cat_hold update, the session, enrolled/kidStage", paths.every(p =>
    /^mastery\/lincoln_custom_items$/.test(p) || /^mastery\/lincoln_settings\/(cat_modes|cat_intro_max|definitions|cat_hold)$/.test(p) ||
    p === "mastery/lincoln_sessions/envirothon" || /^unitStudies\/nc_envirothon\/(kidStage|enrolled)\/lincoln$/.test(p)), paths);
  ok("no whole-node set of mastery / bank / settings; cat_hold is an update of 15 keys", !w.G.writes.some(x => x[0] === "set" && /^mastery\/lincoln(_custom_items|_settings)?$/.test(x[1])) && (() => { const h = w.G.writes.find(x => x[1] === "mastery/lincoln_settings/cat_hold"); return h && h[0] === "update" && Object.keys(h[2]).length === 15; })());
  ok("no write to unitStudies/nc_envirothon itself (the record stays thin)", !paths.some(p => p === "unitStudies/nc_envirothon"));
  // the measurement
  let total = 0; console.log("     ── enroll write (live), by path ──");
  w.G.writes.forEach(x => { const n = bytes(x[2]); total += n; console.log("     " + x[0].padEnd(6) + " " + x[1].padEnd(46) + String(n).padStart(8) + " B"); });
  console.log("     TOTAL " + total + " B (" + (total / 1024).toFixed(1) + " KB) across " + w.G.writes.length + " writes; mastery/lincoln items created: " + items.length);
  ok("the whole enroll write is under 40 KB", total < 40 * 1024, total);
  ok("Lincoln's localStorage mirror grows by under 40 KB too (the bank + settings + session)", bytes(M) < 40 * 1024, bytes(M)); }
{ const w = enrollLincoln({ dry: true, db: { ref() { throw new Error("db touched in dry run"); } } }), M = w.G.masteryData;
  ok("dry run: same in-memory result, nothing written", M.lincoln_custom_items.length === 90 && Object.keys(M.lincoln_settings.cat_hold).length === 15 && M.lincoln_sessions.envirothon && (M.lincoln || []).length === 0); }
{ const w = world({ mastery: { lincoln_sessions: { envirothon: { name: "Envirothon", kind: "deck", decks: ["Forestry · Terms"], newPerDay: 2, mine: true } } } });
  w.G.unitStudies.nc_envirothon = w.envUnitRecord(); w.envHydrateAll(); w.G.writes.length = 0; w.unitStageFormOpen("nc_envirothon", "lincoln"); w.unitStageEnroll();
  ok("a session she already made stands: not overwritten, not rewritten", w.G.masteryData.lincoln_sessions.envirothon.mine === true && w.G.masteryData.lincoln_sessions.envirothon.newPerDay === 2 && !w.G.writes.some(x => /_sessions/.test(x[1]))); }
{ const w = world({ mastery: { lincoln_sessions: [{ name: "Daily Study", kind: "all" }] } });   // Firebase hands a 0-keyed list back as an array
  w.G.unitStudies.nc_envirothon = w.envUnitRecord(); w.envHydrateAll(); w.unitStageFormOpen("nc_envirothon", "lincoln"); w.unitStageEnroll();
  const S = w.G.masteryData.lincoln_sessions;
  ok("an array-shaped sessions node is re-keyed, Daily Study kept, 🌿 added beside it", !Array.isArray(S) && S["0"].name === "Daily Study" && S.envirothon && S.envirothon.kind === "deck"); }
{ const w = world(); w.G.unitStudies.word_roots = w.STARTER_UNITS.word_roots();
  const st = {}, hold = {}, modes = {}, intro = {}, defs = {};
  ok("the hold hook ignores every other unit", w.envEnrollHold(w.us.word_roots, st, [], hold, modes, intro, defs) === false && !Object.keys(hold).length && w.envEnrollSession(w.us.word_roots, "ellis") === null); }

console.log("\n── ➡ move up to Stage 1 (Forestry): held, coded keys for . / fronts ──");
{ const w = enrollLincoln(); w.G.writes.length = 0; w.unitStageMoveUp("nc_envirothon", "lincoln");
  const M = w.G.masteryData, st = M.lincoln_settings, bank = M.lincoln_custom_items, items = M.lincoln || [];
  const forestry = CARDS.filter(c => c.stage === 1), unsafe = forestry.filter(c => /[.#$\[\]\/]/.test(c.name));
  ok("still ZERO cards minted; Forestry's 891 join the bank, held", items.length === 0 && bank.length === 90 + 891 && st.cat_hold["Forestry · Terms"] === true);
  ok("Forestry backs saved: plain fronts under their name, . / fronts under their coded key (" + unsafe.length + " of them)", forestry.every(c => st.definitions[/[.#$\[\]\/]/.test(c.name) ? c.name.replace(/[.#$\[\]\/%]/g, ch => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")) : c.name] === c.def) && unsafe.length > 0);
  ok("no definitions key carries . # $ [ ] /", Object.keys(st.definitions).every(k => !/[.#$\[\]\/]/.test(k)));
  let total = 0; w.G.writes.forEach(x => { total += bytes(x[2]); });
  console.log("     Stage 1 move-up write: " + total + " B (" + (total / 1024).toFixed(1) + " KB) across " + w.G.writes.length + " writes");
  ok("kidStage now 1", w.us.nc_envirothon.kidStage.lincoln.stage === 1); }

console.log("\n── the hooks in index.html ──");
ok("unitStudies listener hydrates on every value", /unitStudies=s\.val\(\)\|\|\{\}; const _uFirst=!_haUnitsReady; _haUnitsReady=true; if\(typeof envHydrateAll==="function"\) envHydrateAll\(\); \/\* 🌿 ENVUNIT[^*]*\*\/ if\(tab==="units"\)/.test(src));
ok("📚 Add hydrates the fresh copy", /unitStudies\[id\]=u; if\(typeof envHydrateAll==="function"\) envHydrateAll\(\);/.test(src));
ok("_ustApply calls the hold hook once, before it returns", (block.match(/typeof envEnrollHold==="function"\) envEnrollHold\(u,st,cards,hold,modes,intro,defs\);/g) || []).length === 1 && block.indexOf('envEnrollHold(u,st,cards,hold,modes,intro,defs);') < block.indexOf("const iu={}; for(let i=startItems"));
ok("unitStageEnroll writes the session after _ustWrite; move-up does not", /_ustWrite\(f\.unitId,f\.kid,w,rec\); if\(typeof envEnrollSession==="function"\) envEnrollSession\(u,f\.kid\);/.test(src) && !/_ustWrite\(unitId,kid,w,rec\); if\(typeof envEnrollSession/.test(src));
ok("envirothon.js is a classic script registering window.HoweEnvirothon (and module.exports)", /window\.HoweEnvirothon = lib/.test(fs.readFileSync(path.join(__dirname, "envirothon.js"), "utf8")) && /module\.exports = lib/.test(fs.readFileSync(path.join(__dirname, "envirothon.js"), "utf8")));
ok("the loader cache-busts only on GitHub Pages, like notebooks.js", /\/github\\\.io\$\/\.test\(location\.hostname\)\?\("envirothon\.js\?v="\+Date\.now\(\)\):"envirothon\.js"/.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
