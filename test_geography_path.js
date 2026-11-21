// 🌍 Geography Path starter unit — slice 1 GEOPATH (PLAN_geography_path_2026-11-10.md §9 row 1; her "lets get that geography
// unit started", 2026-11-11). Runs the real STARTER_UNITS block (GEOPATH + UNIT_STAGES) with the real geo.js:
//  · Stages 1–3 only: Continents 7 · Oceans 5 + 13 Geography words · My Country 14 (+ 10 words); the words deck is born under
//    its final key "Geography" and its 23 terms match Appendix C byte for byte; Stage 4–7 deck keys are fixed already;
//  · a Pre-K kid at Stage 1 → 2 continents learning, 7 in the bank; ➡ Stage 2 seeds only Stage 2 (Geography set to flip);
//    ➡ Stage 3 seeds 14 + 10 with the home state's card; another home → another card (and 13 cards when home is far away);
//  · pictures: geoHydrate puts {svg} on the record IN MEMORY for places AND words; _unitPortrait and mastLiveVisual resolve them;
//    the record itself carries no picture; nothing ever gets an imageUrl (the key the bank's mint copies onto a kid's item);
//    Mom's own picture or emoji wins; geo.js is fetched lazily through haLazyLoad("geo");
//  · the Add card asks "Your state" once (pre-filled North Carolina) and the create-only record write carries `home`;
//  · every write a targeted path; dry run writes nothing.
// Slice 2 GEOSTATES (§9 row 2; her "Start slice 2", 2026-11-16) extends it:
//  · Stage 4 State Shapes: the 50 states once each, by region, ordered from the home state (Appendix A for North Carolina; Ohio,
//    Texas, California and Hawaii worked by hand from the border table) + the 14 map-skills and land words;
//  · Stage 6 Countries: Appendix B's 87 once each, by continent, every one of Lincoln's 30 built-in countries in it + the 22
//    world-landform and earth words; Ellis's 18 path terms byte-compared with the fixture below (his 6 others are not cards);
//  · enroll at Stage 4, ➡ 4 → 6, every new card has a picture, writes targeted, dry run inert.
// Slice 3 GEOADOPT (§9 row 3; 2026-11-16) adds Stage 5 State Capitals and Stage 7 World Geography: the counts below are the
// seven-stage record (332 cards); ➡ walks 4 → 5 → 6 → 7; the hook-up itself is test_attach_geo_capitals.js / test_attach_geo_world.js.
// GEOALL (her "Yes, add all", 2026-11-16) — every country: Countries 87 → 195 (193 UN members + Vatican City + Palestine) and World
// Geography 60 → 195. Appendix B's 87 stay first in their own order in each continent, the 108 more follow; the 60 capitals stay
// first, the 135 more follow in Stage 6's order — 575 cards; every new card has a picture and every new capital a back.
// GEOEXTRA (slice 5, §9 row 5; "def do the optionals") adds Stage 8 Flags (193 — the Countries minus Oman, not public domain, and
// Afghanistan, disputed), Stage 9 Rivers & mountains (24) and Stage 10 Landmarks (24, opens early from Stage 3) — 816 cards,
// starterVer 5: decks and names byte for byte, pictures (geoflags.js loaded only when wanted; rivers from geo.js; landmarks none
// until Mom's photos), the stage rules (early jump and back, never offered twice, 8–10 never count toward an earlier stage),
// targeted writes, dry run inert, and a mutation check that each rule, broken in a copy of the code, is caught.
// UNITS_SRC=<path> runs it against another copy of index.html (geo.js and sw.js beside it).
const fs = require("fs"), path = require("path");
const FILE = process.env.UNITS_SRC || path.join(__dirname, "index.html"), DIR = path.dirname(FILE);
const src = fs.readFileSync(FILE, "utf8");
const HoweGeo = require(path.join(DIR, "geo.js"));
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  " + JSON.stringify(extra).slice(0, 400) : "")); } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const g0 = src.indexOf("// GEOPATH_START"), g1 = src.indexOf("// GEOPATH_END");
ok("GEOPATH block inside the STARTER_UNITS block, once", a > 0 && g0 > a && g1 > g0 && g1 < b && src.indexOf("// GEOPATH_START", g0 + 1) < 0);
const block = src.slice(a, b);
const sliceFn = (name) => { const s = src.indexOf("function " + name + "("); const e = src.indexOf("\n}\n", s); return src.slice(s, e + 3); };
const portraitLine = (() => { const s = src.indexOf("function _unitPortrait("); return src.slice(s, src.indexOf("\n", s) + 1); })();
const unitpic = src.slice(src.indexOf("// UNITPIC_START"), src.indexOf("// UNITPIC_END"));
const picsCode = portraitLine + "\n" + unitpic + "\n" + sliceFn("mastGetVisual");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();   // 🌐 GEOADOPT

// The code a world runs: from index.html, or (o.src) a mutated copy — GEOEXTRA's mutation check below.
function parts(S) {
  const a = S.indexOf("// STARTER_UNITS_START"), b = S.indexOf("// STARTER_UNITS_END");
  const sliceFn = (name) => { const s = S.indexOf("function " + name + "("); const e = S.indexOf("\n}\n", s); return S.slice(s, e + 3); };
  const portraitLine = (() => { const s = S.indexOf("function _unitPortrait("); return S.slice(s, S.indexOf("\n", s) + 1); })();
  const unitpic = S.slice(S.indexOf("// UNITPIC_START"), S.indexOf("// UNITPIC_END"));
  return { block: S.slice(a, b), picsCode: portraitLine + "\n" + unitpic + "\n" + sliceFn("mastGetVisual"),
    VOCAB: S.slice(S.indexOf("const MAST_VOCAB_DEFS={"), S.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS')),
    VOCAB_GEO: (() => { const s = S.indexOf('if(typeof geoVocabDefs==="function")'); return S.slice(s, S.indexOf("\n", s)); })() };
}
function world(o) {
  o = o || {}; const PT = parts(o.src || src);
  const G = { masteryData: o.mastery || {}, currData: { subjects: {} }, writes: [], dry: !!o.dry, unitStudies: {}, content: { innerHTML: "" },
    window: o.window || { HoweGeo }, lazy: [] };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const v = fn(null); G.writes.push(["transaction", p, v]); return Promise.resolve({ committed: true }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; let masteryKid="julian"; let unitOpenId=null;
    const window=G.window;
    function momHere(){ return true; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    function haLazyLoad(name){ G.lazy.push(name); return G.lazyLoad?G.lazyLoad(name):Promise.reject(new Error("no loader")); }
    ${PT.VOCAB}
    ${PT.block}
    ${PT.VOCAB_GEO}
    ${PT.picsCode}
    return { GEO_FLAGS_LEFT, GEO_LANDMARKS, GEO_RIVERS_MOUNTAINS, GEO_COUNTRIES, geoxNext, geoxSide, geoxFlagsWanted, geoxOnOpen, setOpen(id){ unitOpenId=id; }, STARTER_UNITS, STARTER_HOWTO, GEO_DECK_KEYS, GEO_STATES, GEO_REGION_OF, GEO_REGIONS, geoRegionOrder, geoNeighbours, geoUnitRecord, geoHydrate, geoHydrateAll, geoAddHomeSet, geoAddHomeHtml,
      geoPicOf, _starterUnitsHtml, starterUnitAdd, envHydrateAll, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp,
      _unitStageRowsHtml, _unitPortrait, mastLiveVisual, mastGetVisual, _mastVisNorm, setKid(k){ masteryKid=k; } };`)(G, db);
  api.G = G; return api;
}
const fresh = (w, home) => { const u = home ? w.geoUnitRecord(home) : w.STARTER_UNITS.geography_path(); w.G.unitStudies[u.id] = u; return u; };
const deck = (u, k) => u.decks.find(d => d.key === k);
const names = (u, k) => deck(u, k).cards.map(c => c.name);
const items = (w, k) => w.G.masteryData[k] || [];
const bank = (w, k) => w.G.masteryData[k + "_custom_items"] || [];

// ── Appendix C, Stages 2 and 3 — copied from the plan, the deck must match byte for byte ──
const WORDS2 = [["globe", "a round model of the Earth"], ["map", "a flat drawing of a place from above"], ["equator", "the imaginary line around the middle of the Earth"],
  ["North Pole", "the very top of the Earth"], ["South Pole", "the very bottom of the Earth"], ["Northern Hemisphere", "the top half of the Earth, above the equator"],
  ["Southern Hemisphere", "the bottom half of the Earth, below the equator"], ["compass rose", "the picture on a map that shows north, south, east and west"],
  ["map key", "the little box that tells what the map's colours and marks mean"], ["north", "toward the top of the map, toward the North Pole"],
  ["south", "toward the bottom of the map, toward the South Pole"], ["east", "toward the right side of the map, where the sun comes up"],
  ["west", "toward the left side of the map, where the sun goes down"]];
const WORDS3 = [["continent", "one of the seven huge pieces of land"], ["ocean", "a huge body of salt water"], ["island", "land with water all around it"],
  ["lake", "water with land all around it"], ["river", "a long stream of water that flows to a lake or the sea"], ["mountain", "land that rises very high, with a peak"],
  ["desert", "very dry land where almost no rain falls"], ["coast", "the land along the edge of the sea"], ["bay", "a part of the sea that curves into the land"],
  ["peninsula", "land with water on three sides"]];
const MY_COUNTRY = ["United States", "Washington DC", "North Carolina", "Canada", "Mexico", "Pacific Ocean", "Atlantic Ocean", "Gulf of Mexico", "Great Lakes", "Mississippi River", "Rocky Mountains", "Appalachian Mountains", "Alaska", "Hawaii"];   // Appendix D

console.log("── the unit ──");
{ const w = world(), u = fresh(w);
  ok("id geography_path · title Geography Path · 🌍 · picsInCode 'geo' · nbInsert on · home North Carolina", u.id === "geography_path" && u.starter === "geography_path" && u.title === "Geography Path" && u.emoji === "\u{1F30D}" && u.picsInCode === "geo" && u.nbInsert === undefined && u.home === "North Carolina");
  ok("10 stages: The seven continents · Oceans & globe words (ready at 16 of 18) · My country (ready at 22 of 24) · State shapes by region (57 of 64) · State capitals (45 of 50) · Countries by continent (193 of 217) · World capitals (175 of 195) · GEOEXTRA: Flags (174 of 193) · Rivers & mountains (22 of 24) · Landmarks (22 of 24, opens from Stage 3)", u.stages.map(s => s.n + ":" + s.label).join("|") === "1:The seven continents|2:Oceans & globe words|3:My country|4:State shapes by region|5:State capitals|6:Countries by continent|7:World capitals|8:Flags|9:Rivers & mountains|10:Landmarks" && u.stages[7].readyAt === 174 && u.stages[8].readyAt === 22 && u.stages[9].readyAt === 22 && u.stages[9].openFrom === 3 && u.stages.filter(s => s.openFrom != null).length === 1 && u.stages[0].readyAt == null && u.stages[1].readyAt === 16 && u.stages[2].readyAt === 22 && u.stages[3].readyAt === 57 && u.stages[4].readyAt === 45 && u.stages[5].readyAt === 193 && u.stages[6].readyAt === 175);
  ok("11 decks, in this order: Continents flash · Oceans flash · Geography flip · My Country flash (2 at a time) · State Shapes flash · State Capitals flip · Countries flash · World Geography flip · Flags flash · Rivers & Mountains flash · Landmarks flip (3 at a time) — grouped by family", u.decks.map(d => d.key + "/" + d.mode + "/" + d.introCap + "/" + d.groupBy).join("|") === "Continents/flash/2/family|Oceans/flash/2/family|Geography/flip/2/family|My Country/flash/2/family|State Shapes/flash/3/family|State Capitals/flip/3/family|Countries/flash/3/family|World Geography/flip/3/family|Flags/flash/3/family|Rivers & Mountains/flash/3/family|Landmarks/flip/3/family");
  ok("Stage 1: 7 continents in §5.2 order — North America · Africa, Antarctica, Australia · South America, Europe, Asia", names(u, "Continents").join(",") === "North America,Africa,Antarctica,Australia,South America,Europe,Asia" && deck(u, "Continents").cards.every(c => c.stage === 1 && c.def == null));
  ok("Stage 1 families: Where we live · Big, easy shapes · The rest", [...new Set(deck(u, "Continents").cards.map(c => c.family))].join("|") === "Where we live|Big, easy shapes|The rest");
  ok("Stage 2: 5 oceans (Q1 default: Southern Ocean in) — the two big ones first", names(u, "Oceans").join(",") === "Pacific Ocean,Atlantic Ocean,Indian Ocean,Arctic Ocean,Southern Ocean" && deck(u, "Oceans").cards.every(c => c.stage === 2));
  const wd = deck(u, "Geography");
  ok("the words deck key is exactly 'Geography' (Ellis's deck — born under its final key), flip", wd.key === "Geography" && wd.mode === "flip" && u.decks.filter(d => d.key === "Geography").length === 1);
  ok("Stage 2 share: 13 globe words, Appendix C names AND backs byte for byte, The globe (9) then Directions (4)", JSON.stringify(wd.cards.filter(c => c.stage === 2).map(c => [c.name, c.def])) === JSON.stringify(WORDS2) && wd.cards.filter(c => c.stage === 2).map(c => c.family).join(",") === "The globe,".repeat(9).slice(0, -1) + "," + "Directions,".repeat(4).slice(0, -1));
  ok("Stage 3 share: 10 land and water words, Appendix C byte for byte, one family", JSON.stringify(wd.cards.filter(c => c.stage === 3).map(c => [c.name, c.def])) === JSON.stringify(WORDS3) && wd.cards.filter(c => c.stage === 3).every(c => c.family === "Land and water words"));
  ok("23 words in Stages 2–3, none of them one of Ellis's 24 (those come in Stages 4 and 6)", wd.cards.filter(c => c.stage <= 3).length === 23 && !wd.cards.filter(c => c.stage <= 3).some(c => ["tributaries", "glacier", "peak", "elevation", "contour lines", "cardinal directions", "intermediate directions", "lines of latitude", "lines of longitude", "atmosphere", "tectonic plates", "caldera", "geyser", "precipitation", "evaporation", "biome", "tundra", "taiga"].includes(c.name)));
  ok("Stage 3: My Country 14 = Appendix D with North Carolina as my state, flash, no backs", names(u, "My Country").join(",") === MY_COUNTRY.join(",") && deck(u, "My Country").cards.every(c => c.stage === 3 && c.def == null));
  ok("My Country families: Our country (3) · Our neighbours (2) · Water around us (5) · Land and far-away states (4)", deck(u, "My Country").cards.map(c => c.family).filter((f, i, A) => A.indexOf(f) === i).join("|") === "Our country|Our neighbours|Water around us|Land and far-away states" && deck(u, "My Country").cards.filter(c => c.family === "Our country").map(c => c.name).join(",") === "United States,Washington DC,North Carolina");
  ok("816 cards (49 + 64 + 50 + 217 + 195 + GEOEXTRA 193 + 24 + 24), every name a legal database key (no . # $ [ ] /), order 1..816 across the unit", u.decks.reduce((s, d) => s + d.cards.length, 0) === 816 && u.decks.every(d => d.cards.every(c => !/[.#$\[\]\/]/.test(c.name))) && [].concat(...u.decks.map(d => d.cards)).map(c => c.order).sort((x, y) => x - y).join() === Array.from({ length: 816 }, (_, i) => i + 1).join());
  ok("Stages 5 and 7 (GEOADOPT) under the fixed keys: State Shapes · State Capitals · Countries · World Geography (and Geography)", deck(u, "State Capitals").cards.every(c => c.stage === 5) && deck(u, "World Geography").cards.every(c => c.stage === 7) && w.GEO_DECK_KEYS.states === "State Shapes" && w.GEO_DECK_KEYS.capitals === "State Capitals" && w.GEO_DECK_KEYS.countries === "Countries" && w.GEO_DECK_KEYS.world === "World Geography" && w.GEO_DECK_KEYS.words === "Geography");
  ok("the record carries NO picture: no visuals, no data: URI, no <svg (pictures live in geo.js / geoflags.js); < 64 KB (GEOALL: 195 countries + 195 capitals; GEOEXTRA: + 241 cards)", u.visuals === undefined && !/data:|<svg|imageUrl/.test(JSON.stringify(u)) && JSON.stringify(u).length < 64000);
  ok("50 states, each in one of the five regions (Appendix A); North Carolina Southeast, Maryland & Delaware Northeast", w.GEO_STATES.length === 50 && new Set(Object.values(w.GEO_REGION_OF)).size === 5 && w.GEO_REGION_OF["North Carolina"] === "Southeast" && w.GEO_REGION_OF.Maryland === "Northeast" && w.GEO_REGION_OF.Delaware === "Northeast" && w.GEO_STATES.every(s => HoweGeo.names("state").includes(s)));
  ok("STARTER_HOWTO has a Mom note + kid line for Continents, Oceans, Geography and My Country", ["Continents", "Oceans", "Geography", "My Country"].every(k => w.STARTER_HOWTO[k] && w.STARTER_HOWTO[k].main.length > 20 && w.STARTER_HOWTO[k].kid.length > 5));
}

console.log("── a different home state ──");
{ const w = world();
  const oh = w.geoUnitRecord("Ohio");
  ok("home Ohio → the my-state card is Ohio, North Carolina is nowhere, still 14", oh.home === "Ohio" && names(oh, "My Country").includes("Ohio") && !names(oh, "My Country").includes("North Carolina") && names(oh, "My Country").length === 14);
  const hi = w.geoUnitRecord("Hawaii");
  ok("home Hawaii → named once (in Our country), the far-away copy dropped: 13 cards, no duplicate name", names(hi, "My Country").filter(n => n === "Hawaii").length === 1 && names(hi, "My Country").length === 13 && deck(hi, "My Country").cards.find(c => c.name === "Hawaii").family === "Our country");
  w.geoAddHomeSet("Texas"); const tx = w.STARTER_UNITS.geography_path();
  ok("the Add card's pick feeds the starter factory (Texas); an unknown pick falls back to North Carolina", tx.home === "Texas" && names(tx, "My Country").includes("Texas") && (w.geoAddHomeSet("Atlantis"), w.STARTER_UNITS.geography_path().home === "North Carolina"));
  ok("the Add card asks 'Your state' once: a select of the 50 states, North Carolina pre-selected, only on this unit's card", (() => { const h = w._starterUnitsHtml(); const m = /<span>Your state<\/span><select[^>]*onchange="geoAddHomeSet\(this\.value\)">([\s\S]*?)<\/select>/.exec(h); return !!m && (m[1].match(/<option /g) || []).length === 50 && /<option value="North Carolina" selected>/.test(m[1]) && (h.match(/Your state/g) || []).length === 1; })());
  w.geoAddHomeSet("Ohio"); w.starterUnitAdd("geography_path");
  const t = w.G.writes.filter(x => x[0] === "transaction");
  ok("＋ Add: ONE create-only write of unitStudies/geography_path carrying home 'Ohio' and the Ohio card — no picture in it; nothing else written", t.length === 1 && t[0][1] === "unitStudies/geography_path" && t[0][2].home === "Ohio" && t[0][2].decks[3].cards.some(c => c.name === "Ohio") && !("visuals" in t[0][2]) && !/data:|<svg/.test(JSON.stringify(t[0][2])) && w.G.writes.length === 1);
}

console.log("── Julian-shaped Pre-K kid: Stage 1 → 2 → 3 ──");
{ const w = world(), u = fresh(w);
  w.unitStageFormOpen("geography_path", "kid");
  ok("the form opens at Stage 1 (the first stage with cards)", w.unitStageFormSet && true);
  w.unitStageEnroll();
  const it = items(w, "kid");
  ok("Stage 1: North America + Africa start learning (2 at a time), flash", it.map(i => i.prompt).join(",") === "North America,Africa" && it.every(i => i.status === "introduction" && i.subject === "Continents" && i.review_mode === "flash" && i.answer === undefined));
  ok("Stage 1: the 7 continents in the bank, in path order, Continents only", bank(w, "kid").map(c => c.cat + ":" + c.name).join(",") === "Continents:North America,Continents:Africa,Continents:Antarctica,Continents:Australia,Continents:South America,Continents:Europe,Continents:Asia");
  const st = w.G.masteryData.kid_settings;
  ok("Stage 1 settings: Continents flash, 2 new at once, NOT held (the drill pulls the next continent as room opens — the paths' way), How-to filled", st.cat_modes.Continents === "flash" && st.cat_intro_max.Continents === 2 && !(st.cat_hold || {}).Continents && st.cat_instructions.Continents === w.STARTER_HOWTO.Continents.main && st.cat_instructions_kid.Continents === w.STARTER_HOWTO.Continents.kid && !st.cat_modes.Geography && !st.cat_modes.Oceans);
  ok("Stage 1 writes nothing for Stage 2/3: no Oceans, Geography or My Country anywhere", !JSON.stringify(w.G.writes).match(/"cat":"(Oceans|Geography|My Country)"/) && !st.definitions || Object.keys(st.definitions || {}).length === 0);
  let s = w.unitStageStatus(u, "kid");
  ok("row: Stage 1 · 0 of 7 on the ladder · learning Where we live · next = Stage 2", s.stage === 1 && s.total === 7 && s.on === 0 && s.learn === 2 && s.fam === "Where we live" && !s.ready && s.next && s.next.n === 2 && /Stage 1 · The seven continents/.test(w._unitStageRowsHtml(u, ["kid"])) && /Start Stage 2: Oceans &amp; globe words/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("kidStage + enrolled written; every write a targeted path (index updates / leaf sets only)", w.G.writes.some(x => x[1] === "unitStudies/geography_path/kidStage/kid" && x[2].stage === 1) && w.G.writes.some(x => x[1] === "unitStudies/geography_path/enrolled/kid" && x[2] === true) &&
    w.G.writes.every(x => x[0] === "update" ? /^mastery\/kid(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid|cat_hold))?$/.test(x[1]) : /^unitStudies\/geography_path\/(kidStage|enrolled)\/kid$/.test(x[1])), w.G.writes.map(x => x[0] + " " + x[1]));
  // all 7 known → ready → ➡ Stage 2
  it.forEach(i => { i.status = "active"; i.tier = "weekly"; });
  ["Antarctica", "Australia", "South America", "Europe", "Asia"].forEach((n, i) => it.push({ id: "c" + i, subject: "Continents", prompt: n, status: "active", tier: "weekly" }));
  s = w.unitStageStatus(u, "kid");
  ok("all 7 on the ladder → ✓ ready to move up", s.ready && s.on === 7 && /ready to move up/.test(w._unitStageRowsHtml(u, ["kid"])));
  w.G.writes.length = 0; w.unitStageMoveUp("geography_path", "kid");
  const lrn = items(w, "kid").filter(i => i.status === "introduction");
  ok("➡ Stage 2: Pacific + Atlantic and globe + map start learning (2 per deck)", lrn.map(i => i.subject + ":" + i.prompt).join(",") === "Oceans:Pacific Ocean,Oceans:Atlantic Ocean,Geography:globe,Geography:map");
  const b2 = bank(w, "kid").slice(7);
  ok("➡ Stage 2 seeds ONLY Stage 2: the bank gains 5 oceans + 13 words, nothing from Stage 3", b2.length === 18 && b2.filter(c => c.cat === "Oceans").length === 5 && b2.filter(c => c.cat === "Geography").map(c => c.name).join(",") === WORDS2.map(x => x[0]).join(",") && !b2.some(c => c.cat === "My Country"));
  ok("Geography deck set to flip, Oceans flash, 2 new at once each; the 13 backs saved as definitions, exactly Appendix C", st.cat_modes.Geography === "flip" && st.cat_modes.Oceans === "flash" && st.cat_intro_max.Geography === 2 && Object.keys(st.definitions).length === 13 && WORDS2.every(([n, d]) => st.definitions[n] === d));
  ok("the words carry their back on the card too (flip: word + picture → meaning)", lrn.filter(i => i.subject === "Geography").every(i => i.answer === WORDS2.find(x => x[0] === i.prompt)[1]));
  s = w.unitStageStatus(u, "kid");
  ok("row: Stage 2 · 0 of 18 · ready at 16 · learning The two big ones", s.stage === 2 && s.total === 18 && s.need === 16 && s.fam === "The two big ones" && /ready at 16/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("Stage 2 writes targeted: bank indices 7..24, cat_modes/cat_intro_max/definitions updates, How-to for Oceans + Geography, kidStage from:1", (() => { const bu = w.G.writes.find(x => x[1] === "mastery/kid_custom_items"); const ks = w.G.writes.find(x => x[1] === "unitStudies/geography_path/kidStage/kid"); return bu && Object.keys(bu[2]).join() === Array.from({ length: 18 }, (_, i) => i + 7).join() && ks && ks[2].stage === 2 && ks[2].from === 1 && w.G.writes.some(x => x[1] === "mastery/kid_settings/cat_instructions" && x[2].Oceans && x[2].Geography && !x[2].Continents); })());
  // Stage 2 all known → ➡ Stage 3
  items(w, "kid").forEach(i => { i.status = "active"; i.tier = "weekly"; });
  b2.forEach((c, i) => { if (!items(w, "kid").some(x => x.subject === c.cat && x.prompt === c.name)) items(w, "kid").push({ id: "s2_" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); });
  w.G.writes.length = 0; w.unitStageMoveUp("geography_path", "kid");
  const b3 = bank(w, "kid").slice(25), lrn3 = items(w, "kid").filter(i => i.status === "introduction");
  ok("➡ Stage 3: the bank gains 14 My Country + 10 words (24), the home state's card among them", b3.length === 24 && b3.filter(c => c.cat === "My Country").map(c => c.name).join(",") === MY_COUNTRY.join(",") && b3.filter(c => c.cat === "Geography").map(c => c.name).join(",") === WORDS3.map(x => x[0]).join(","));
  ok("➡ Stage 3: continent + ocean and United States + Washington DC start learning (2 per deck, decks in record order); My Country flash; 23 definitions now", lrn3.map(i => i.subject + ":" + i.prompt).join(",") === "Geography:continent,Geography:ocean,My Country:United States,My Country:Washington DC" && st.cat_modes["My Country"] === "flash" && Object.keys(st.definitions).length === 23 && WORDS3.every(([n, d]) => st.definitions[n] === d));
  s = w.unitStageStatus(u, "kid");
  ok("row: Stage 3 · 24 cards · ready at 22 · next = Stage 4 (➡ Start Stage 4: State shapes by region)", s.stage === 3 && s.total === 24 && s.need === 22 && s.next && s.next.n === 4 && /Start Stage 4: State shapes by region/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("ids unique across the three stages; every item has a home deck", new Set(items(w, "kid").map(i => i.id)).size === items(w, "kid").length && items(w, "kid").every(i => ["Continents", "Oceans", "Geography", "My Country"].includes(i.subject)));
}

console.log("── another home: Stage 3 seeds that state's card ──");
{ const w = world(); w.geoAddHomeSet("Ohio"); const u = fresh(w);
  w.unitStageFormOpen("geography_path", "kid"); w.unitStageFormSet("stage", "3"); w.unitStageEnroll();
  const bk = bank(w, "kid").map(c => c.name);
  ok("a kid enrolled straight at Stage 3 in an Ohio family: Ohio in the bank, North Carolina not; 24 entries", bk.includes("Ohio") && !bk.includes("North Carolina") && bk.length === 24);
}

// ── slice 2 GEOSTATES ──
// Appendix A (home = North Carolina), copied from the plan.
const APPX_A = [["Southeast", ["North Carolina", "South Carolina", "Virginia", "Georgia", "Tennessee", "Florida", "Alabama", "Kentucky", "West Virginia", "Mississippi", "Louisiana", "Arkansas"]],
  ["Northeast", ["Pennsylvania", "New York", "New Jersey", "Maryland", "Delaware", "Connecticut", "Massachusetts", "Rhode Island", "Vermont", "New Hampshire", "Maine"]],
  ["Midwest", ["Ohio", "Michigan", "Indiana", "Illinois", "Wisconsin", "Minnesota", "Iowa", "Missouri", "Kansas", "Nebraska", "South Dakota", "North Dakota"]],
  ["Southwest", ["Texas", "Oklahoma", "New Mexico", "Arizona"]],
  ["West", ["Colorado", "Utah", "Nevada", "California", "Oregon", "Washington", "Idaho", "Montana", "Wyoming", "Alaska", "Hawaii"]]];
const flatA = [].concat(...APPX_A.map(r => r[1]));
// Worked by hand from the border table (fewest state borders crossed from home; ties keep Appendix A's order).
const BY_HAND = {
  Ohio: { regions: "Midwest|Southeast|Northeast|Southwest|West", first: ["Ohio", "Michigan", "Indiana", "Illinois"] },
  Texas: { regions: "Southwest|Southeast|Midwest|West|Northeast", first: ["Texas", "Oklahoma", "New Mexico", "Arizona"] },
  California: { regions: "West|Southwest|Southeast|Midwest|Northeast", first: ["California", "Nevada", "Oregon", "Colorado", "Utah", "Washington", "Idaho", "Montana", "Wyoming", "Alaska", "Hawaii"] },
  Hawaii: { regions: "West|Southeast|Northeast|Midwest|Southwest", first: ["Hawaii", "Colorado", "Utah", "Nevada", "California", "Oregon", "Washington", "Idaho", "Montana", "Wyoming", "Alaska"] } };
// Appendix B, copied from the plan.
const APPX_B = [["North America", ["Canada", "Mexico", "Cuba", "Guatemala", "Panama", "Costa Rica", "Jamaica", "Haiti", "Dominican Republic", "Honduras"]],
  ["South America", ["Brazil", "Argentina", "Chile", "Peru", "Colombia", "Venezuela", "Ecuador", "Bolivia", "Uruguay", "Paraguay"]],
  ["Europe", ["United Kingdom", "Ireland", "France", "Spain", "Portugal", "Italy", "Germany", "Netherlands", "Belgium", "Switzerland", "Austria", "Poland", "Czechia", "Hungary", "Greece", "Norway", "Sweden", "Finland", "Denmark", "Iceland", "Ukraine", "Russia", "Romania"]],
  ["Asia", ["China", "Japan", "South Korea", "North Korea", "India", "Pakistan", "Bangladesh", "Nepal", "Sri Lanka", "Vietnam", "Thailand", "Indonesia", "Philippines", "Malaysia", "Singapore", "Mongolia", "Kazakhstan", "Afghanistan", "Iran", "Iraq", "Saudi Arabia", "Israel", "Turkey", "United Arab Emirates"]],
  ["Africa", ["Egypt", "Morocco", "Algeria", "Libya", "Nigeria", "Ghana", "Ethiopia", "Kenya", "Tanzania", "Uganda", "Democratic Republic of the Congo", "South Africa", "Madagascar", "Sudan", "Somalia", "Senegal"]],
  ["Oceania", ["Australia", "New Zealand", "Papua New Guinea", "Fiji"]]];
// GEOALL — the 108 more, appended in each continent after Appendix B's (copied from the brief's list: the 193 UN members +
// Vatican City + Palestine, less the 87). "Georgia (country)": the state Georgia's back is Atlanta, and backs are found by the front.
const MORE_108 = [["North America", ["United States", "El Salvador", "Nicaragua", "Belize", "Bahamas", "Trinidad and Tobago", "Barbados", "Grenada", "Saint Lucia", "Antigua and Barbuda", "Dominica", "Saint Vincent and the Grenadines", "Saint Kitts and Nevis"]],
  ["South America", ["Guyana", "Suriname"]],
  ["Europe", ["Croatia", "Serbia", "Bulgaria", "Vatican City", "Monaco", "Luxembourg", "Slovakia", "Slovenia", "Belarus", "Lithuania", "Latvia", "Estonia", "Cyprus", "Malta", "Bosnia and Herzegovina", "Albania", "North Macedonia", "Montenegro", "Moldova", "San Marino", "Liechtenstein", "Andorra"]],
  ["Asia", ["Myanmar", "Cambodia", "Laos", "Syria", "Jordan", "Lebanon", "Yemen", "Oman", "Qatar", "Kuwait", "Bahrain", "Palestine", "Georgia (country)", "Armenia", "Azerbaijan", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Tajikistan", "Bhutan", "Maldives", "Brunei", "East Timor"]],
  ["Africa", ["Tunisia", "Zimbabwe", "Zambia", "Angola", "Mozambique", "Namibia", "Botswana", "Rwanda", "Cameroon", "Ivory Coast", "Mali", "Niger", "Chad", "South Sudan", "Eritrea", "Djibouti", "Burundi", "Malawi", "Republic of the Congo", "Gabon", "Central African Republic", "Mauritania", "Burkina Faso", "Liberia", "Sierra Leone", "Guinea", "Guinea-Bissau", "Gambia", "Benin", "Togo", "Equatorial Guinea", "Lesotho", "Eswatini", "Mauritius", "Seychelles", "Cape Verde", "Comoros", "São Tomé and Príncipe"]],
  ["Oceania", ["Solomon Islands", "Vanuatu", "Samoa", "Tonga", "Micronesia", "Palau", "Marshall Islands", "Kiribati", "Tuvalu", "Nauru"]]];
const ALL_195 = APPX_B.map((r, i) => [r[0], r[1].concat(MORE_108[i][1])]);
// Appendix C, Stages 4 and 6 — the non-(E) terms.
const WORDS4 = [["cardinal directions", "the four main directions: north, south, east, and west"], ["intermediate directions", "the in-between directions: northeast, southeast, southwest, and northwest"],
  ["lines of latitude", "imaginary lines that run east–west and measure distance north or south of the equator"], ["lines of longitude", "imaginary lines that run north–south from pole to pole and measure distance east or west"],
  ["prime meridian", "the line of longitude marked 0°, through Greenwich, England"], ["map scale", "the bar that tells how far a map inch is in real miles"],
  ["elevation", "how high the land is above sea level"], ["contour lines", "lines on a map that connect points of equal elevation"],
  ["sea level", "the height of the ocean's surface, where elevation starts at zero"], ["time zone", "a strip of the Earth where every clock shows the same time"],
  ["peak", "the pointed top of a mountain"], ["valley", "the low land between hills or mountains"], ["plain", "a wide, flat stretch of land"], ["plateau", "high, flat land, like a table"]];
const WORDS6 = [["isthmus", "a narrow strip of land joining two bigger pieces of land"], ["archipelago", "a group of many islands"], ["delta", "the fan of land a river builds where it meets the sea"],
  ["strait", "a narrow channel of water between two pieces of land"], ["gulf", "a large part of the sea reaching into the land"], ["canyon", "a deep, steep valley cut by a river"],
  ["tributaries", "smaller rivers or streams that flow into a larger river"], ["glacier", "a huge, slow-moving sheet of ice"], ["fjord", "a long, narrow sea inlet between high cliffs"],
  ["oasis", "a green spot in a desert where water comes up"], ["savanna", "a grassy plain with few trees, in a warm place"], ["rainforest", "a thick, wet forest where it rains almost every day"],
  ["atmosphere", "the layer of gases that surrounds the Earth"], ["tectonic plates", "the giant slabs of Earth's crust that slowly move"], ["volcano", "a mountain that can throw out melted rock, ash and gas"],
  ["caldera", "a large bowl-shaped crater left when a volcano collapses"], ["geyser", "a hot spring that shoots water and steam into the air"],
  ["precipitation", "water falling from clouds as rain, snow, sleet, or hail"], ["evaporation", "when liquid water heats up and becomes water vapor"],
  ["biome", "a large region with its own climate, plants, and animals"], ["tundra", "a cold, treeless biome with frozen ground"], ["taiga", "a cold northern forest biome of evergreen trees"]];
// FIXTURE — Ellis's own Geography prompts and backs on the unit's path (the plan's read-only copy of his list, 2026-11-10,
// Appendix C (E)), kept separate from WORDS4/6 on purpose: the unit must carry these exactly, whatever else changes.
const ELLIS_PATH = { "cardinal directions": "the four main directions: north, south, east, and west", "intermediate directions": "the in-between directions: northeast, southeast, southwest, and northwest",
  "lines of latitude": "imaginary lines that run east–west and measure distance north or south of the equator", "lines of longitude": "imaginary lines that run north–south from pole to pole and measure distance east or west",
  "elevation": "how high the land is above sea level", "contour lines": "lines on a map that connect points of equal elevation", "peak": "the pointed top of a mountain",
  "tributaries": "smaller rivers or streams that flow into a larger river", "glacier": "a huge, slow-moving sheet of ice", "atmosphere": "the layer of gases that surrounds the Earth",
  "tectonic plates": "the giant slabs of Earth's crust that slowly move", "caldera": "a large bowl-shaped crater left when a volcano collapses", "geyser": "a hot spring that shoots water and steam into the air",
  "precipitation": "water falling from clouds as rain, snow, sleet, or hail", "evaporation": "when liquid water heats up and becomes water vapor", "biome": "a large region with its own climate, plants, and animals",
  "tundra": "a cold, treeless biome with frozen ground", "taiga": "a cold northern forest biome of evergreen trees" };
const ELLIS_NOT_PATH = ["carbon footprint", "irrigation", "fertilizer", "barge", "industry", "fumarole"];
const LINCOLN_BUILTIN = JSON.parse(/"World Geography":(\[[^\]]*\])/.exec(src)[1]);   // MAST_LINCOLN_BANK, read from the page

console.log("── Stage 4 · State shapes by region ──");
{ const w = world(), u = fresh(w), sd = deck(u, "State Shapes"), wd = deck(u, "Geography");
  ok("State Shapes: the 50 states, each exactly once, all Stage 4, flash, no backs", sd.cards.length === 50 && new Set(sd.cards.map(c => c.name)).size === 50 && w.GEO_STATES.every(s => names(u, "State Shapes").includes(s)) && sd.cards.every(c => c.stage === 4 && c.def == null));
  ok("North Carolina family: Appendix A byte for byte — regions in order, states in order, family = region", JSON.stringify(sd.cards.map(c => [c.family, c.name])) === JSON.stringify([].concat(...APPX_A.map(r => r[1].map(n => [r[0], n])))));
  ok("the region lists agree with GEO_REGIONS (Delaware and Maryland Northeast — Q3 default)", JSON.stringify(w.GEO_REGIONS) === JSON.stringify(APPX_A));
  Object.keys(BY_HAND).forEach(h => { const x = w.geoUnitRecord(h), s = deck(x, "State Shapes").cards; const fams = s.map(c => c.family).filter((f, i, A) => A.indexOf(f) === i);
    const hr = w.GEO_REGION_OF[h], inHome = s.filter(c => c.family === hr).map(c => c.name);
    ok("home " + h + " → regions " + BY_HAND[h].regions.replace(/\|/g, " · ") + "; home region starts " + BY_HAND[h].first.slice(0, 4).join(", ") + "; still the 50 once each",
      fams.join("|") === BY_HAND[h].regions && JSON.stringify(inHome.slice(0, BY_HAND[h].first.length)) === JSON.stringify(BY_HAND[h].first) && s.length === 50 && new Set(s.map(c => c.name)).size === 50 &&
      s.filter(c => c.family !== hr).every(c => APPX_A.find(r => r[0] === c.family)[1].indexOf(c.name) >= 0) &&
      fams.filter(f => f !== hr).every(f => JSON.stringify(s.filter(c => c.family === f).map(c => c.name)) === JSON.stringify(APPX_A.find(r => r[0] === f)[1])), fams); });
  ok("Stage 3's home card and Stage 4's first shape are the same state (Ohio family)", (() => { const x = w.geoUnitRecord("Ohio"); return names(x, "My Country").includes("Ohio") && names(x, "State Shapes")[0] === "Ohio"; })());
  ok("Stage 4 words: 14, Appendix C names AND backs byte for byte, Reading a map (10) then Land near home (4)", JSON.stringify(wd.cards.filter(c => c.stage === 4).map(c => [c.name, c.def])) === JSON.stringify(WORDS4) && wd.cards.filter(c => c.stage === 4).map(c => c.family).join(",") === "Reading a map,".repeat(10) + "Land near home,Land near home,Land near home,Land near home");
  // the border table
  const nb = w.geoNeighbours(), U = HoweGeo.data.us.state;
  const box = d => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } return [x0, y0, x1, y1]; };
  const pairs = []; Object.keys(nb).forEach(a => nb[a].forEach(b => { if (a < b) pairs.push([a, b]); }));
  ok("border table: 105 land borders, symmetric, no state its own neighbour; Alaska and Hawaii none, every other state ≥ 1", pairs.length === 105 && Object.keys(nb).every(a => nb[a].every(b => nb[b].indexOf(a) >= 0 && b !== a)) && nb.Alaska.length === 0 && nb.Hawaii.length === 0 && w.GEO_STATES.filter(s => s !== "Alaska" && s !== "Hawaii").every(s => nb[s].length > 0));
  ok("border table spot checks: North Carolina = Georgia, South Carolina, Tennessee, Virginia; Maine = New Hampshire; Missouri touches 8; no Four Corners diagonal", nb["North Carolina"].slice().sort().join() === "Georgia,South Carolina,Tennessee,Virginia" && nb.Maine.join() === "New Hampshire" && nb.Missouri.length === 8 && nb.Tennessee.length === 8 && nb.Arizona.indexOf("Colorado") < 0 && nb.Utah.indexOf("New Mexico") < 0);
  const far = pairs.filter(([a, b]) => { const A = box(U[a]), B = box(U[b]), t = 4; return A[0] > B[2] + t || B[0] > A[2] + t || A[1] > B[3] + t || B[1] > A[3] + t; });
  ok("every border in the table is real on the geo.js US map (the two outlines' boxes touch)", far.length === 0, far);
  ok("STARTER_HOWTO has a Mom note + kid line for State Shapes and Countries", ["State Shapes", "Countries"].every(k => w.STARTER_HOWTO[k] && w.STARTER_HOWTO[k].main.length > 20 && w.STARTER_HOWTO[k].kid.length > 5));
}

console.log("── Stage 6 · Countries by continent ──");
{ const w = world(), u = fresh(w), cd = deck(u, "Countries"), wd = deck(u, "Geography");
  ok("GEOALL Countries: 195 — in each continent Appendix B's names first, byte for byte in their own order, then the 108 more; families = continents in order (23 · 12 · 45 · 47 · 54 · 14), Stage 6, flash, no backs", JSON.stringify(cd.cards.map(c => [c.family, c.name])) === JSON.stringify([].concat(...ALL_195.map(r => r[1].map(n => [r[0], n])))) && new Set(cd.cards.map(c => c.name)).size === 195 && cd.cards.every(c => c.stage === 6 && c.def == null) && ALL_195.map(r => r[1].length).join() === "23,12,45,47,54,14");
  ok("GEOALL: the 87 keep their order — each continent's first cards are Appendix B's exactly, so a kid's next country doesn't jump", APPX_B.every(r => JSON.stringify(cd.cards.filter(c => c.family === r[0]).slice(0, r[1].length).map(c => c.name)) === JSON.stringify(r[1])));
  ok("GEOALL: 195 = the 193 UN members + Vatican City + Palestine — no name twice (not even by case), the United States among them, Georgia the country named apart from Georgia the state", new Set(cd.cards.map(c => c.name.toLowerCase())).size === 195 && ["United States", "Vatican City", "Palestine", "Georgia (country)", "South Sudan", "Tuvalu"].every(n => names(u, "Countries").includes(n)) && !names(u, "Countries").includes("Georgia"));
  ok("every one of Lincoln's 30 built-in World Geography countries is a Countries card, spelled the built-in way", LINCOLN_BUILTIN.length === 30 && LINCOLN_BUILTIN.every(n => names(u, "Countries").includes(n)));
  ok("every country has a geo.js map", cd.cards.every(c => HoweGeo.has("country", c.name)));
  ok("Stage 6 words: 22, Appendix C names AND backs byte for byte, World landforms (12) then Earth words (10)", JSON.stringify(wd.cards.filter(c => c.stage === 6).map(c => [c.name, c.def])) === JSON.stringify(WORDS6) && wd.cards.filter(c => c.stage === 6).map(c => c.family).join(",") === "World landforms,".repeat(12) + "Earth words,".repeat(9) + "Earth words");
  ok("Ellis's 18 path terms: on the Geography deck, his prompt and back byte for byte (fixture); 7 in Stage 4, 11 in Stage 6", Object.keys(ELLIS_PATH).length === 18 && Object.keys(ELLIS_PATH).every(n => { const c = wd.cards.find(x => x.name === n); return c && c.def === ELLIS_PATH[n]; }) && wd.cards.filter(c => c.stage === 4 && ELLIS_PATH[c.name]).length === 7 && wd.cards.filter(c => c.stage === 6 && ELLIS_PATH[c.name]).length === 11);
  ok("his 5 non-path words and fumarole are NOT unit cards (they stay his own)", !u.decks.some(d => d.cards.some(c => ELLIS_NOT_PATH.includes(c.name))));
  ok("the Geography deck: 59 words, no name twice, every word has a drawing in geo.js", wd.cards.length === 59 && new Set(wd.cards.map(c => c.name)).size === 59 && wd.cards.every(c => HoweGeo.has("word", c.name)));
  ok("no card name repeats inside any deck", u.decks.every(d => new Set(d.cards.map(c => c.name)).size === d.cards.length));
}

console.log("── a 3rd-grader at Stage 4, then ➡ 5 ➡ 6 ➡ 7 ──");
{ const w = world(), u = fresh(w);
  w.unitStageFormOpen("geography_path", "kid"); w.unitStageFormSet("stage", "4"); w.unitStageEnroll();
  const st = w.G.masteryData.kid_settings, lrn = items(w, "kid").filter(i => i.status === "introduction");
  ok("enroll at Stage 4: cardinal + intermediate directions (2) and North Carolina, South Carolina, Virginia (3) start learning", lrn.map(i => i.subject + ":" + i.prompt).join(",") === "Geography:cardinal directions,Geography:intermediate directions,State Shapes:North Carolina,State Shapes:South Carolina,State Shapes:Virginia");
  ok("the bank gets the 14 words + 50 shapes — nothing from Stages 1–3 or 6", bank(w, "kid").length === 64 && bank(w, "kid").filter(c => c.cat === "State Shapes").length === 50 && bank(w, "kid").filter(c => c.cat === "Geography").map(c => c.name).join(",") === WORDS4.map(x => x[0]).join(",") && !bank(w, "kid").some(c => c.cat === "Countries" || c.cat === "My Country"));
  ok("settings: State Shapes flash · 3 at a time · How-to; Geography flip; the 14 backs saved exactly", st.cat_modes["State Shapes"] === "flash" && st.cat_intro_max["State Shapes"] === 3 && st.cat_modes.Geography === "flip" && st.cat_instructions["State Shapes"] === w.STARTER_HOWTO["State Shapes"].main && Object.keys(st.definitions).length === 14 && WORDS4.every(([n, d]) => st.definitions[n] === d) && !st.cat_modes.Countries);
  let s = w.unitStageStatus(u, "kid");
  ok("row: Stage 4 · 64 cards · ready at 57 · next = Stage 5 (GEOADOPT)", s.stage === 4 && s.total === 64 && s.need === 57 && s.next && s.next.n === 5 && /Start Stage 5: State capitals/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("the Stage 4 form's families: the two word families, then the five regions home first", /through the Reading a map[\s\S]*through the Land near home[\s\S]*through the Southeast[\s\S]*through the Northeast[\s\S]*through the West/.test((w.unitStageFormOpen("geography_path", "kid2"), w.unitStageFormSet("stage", "4"), w._unitStageRowsHtml(u, ["kid2"]))));
  // 57 on the ladder → ready → ➡ Stage 5
  const all = items(w, "kid"); const ladder = (from, n, tag) => { all.forEach(i => { i.status = "active"; i.tier = "weekly"; });
    bank(w, "kid").slice(from, from + n).forEach((c, i) => { if (!all.some(x => x.subject === c.cat && x.prompt === c.name)) all.push({ id: tag + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); }); };
  ladder(0, 57, "s4_"); s = w.unitStageStatus(u, "kid");
  ok("57 of 64 on the ladder → ✓ ready to move up", s.ready && s.on === 57);
  w.unitStageMoveUp("geography_path", "kid");
  const b5 = bank(w, "kid").slice(64), lrn5 = items(w, "kid").filter(i => i.status === "introduction");
  ok("➡ Stage 5: the bank gains the 50 states under State Capitals, in Stage 4's region order; North Carolina, South Carolina, Virginia start learning with their capitals", b5.length === 50 && b5.every(c => c.cat === "State Capitals") && b5.map(c => c.name).join(",") === [].concat(...APPX_A.map(r => r[1])).join(",") && lrn5.map(i => i.subject + ":" + i.prompt + "=" + i.answer).join(",") === "State Capitals:North Carolina=Raleigh,State Capitals:South Carolina=Columbia,State Capitals:Virginia=Richmond");
  ok("➡ Stage 5: State Capitals flip · 3 at a time; 64 definitions now (14 words + 50 capitals, St. Paul as built in)", st.cat_modes["State Capitals"] === "flip" && st.cat_intro_max["State Capitals"] === 3 && Object.keys(st.definitions).length === 64 && st.definitions.Minnesota === "St. Paul");
  s = w.unitStageStatus(u, "kid");
  ok("row: Stage 5 · 50 cards · ready at 45 · next = Stage 6", s.stage === 5 && s.total === 50 && s.need === 45 && s.next && s.next.n === 6);
  ladder(64, 45, "s5_"); w.G.writes.length = 0; w.unitStageMoveUp("geography_path", "kid");
  const b6 = bank(w, "kid").slice(114), lrn6 = items(w, "kid").filter(i => i.status === "introduction");
  ok("➡ Stage 6: the bank gains 22 words + 195 countries (217), in path order", b6.length === 217 && b6.filter(c => c.cat === "Countries").map(c => c.name).join(",") === [].concat(...ALL_195.map(r => r[1])).join(",") && b6.filter(c => c.cat === "Geography").map(c => c.name).join(",") === WORDS6.map(x => x[0]).join(","));
  ok("➡ Stage 6: isthmus + archipelago and Canada, Mexico, Cuba start learning; Countries flash · 3; 86 definitions now", lrn6.map(i => i.subject + ":" + i.prompt).join(",") === "Geography:isthmus,Geography:archipelago,Countries:Canada,Countries:Mexico,Countries:Cuba" && st.cat_modes.Countries === "flash" && st.cat_intro_max.Countries === 3 && Object.keys(st.definitions).length === 86);
  s = w.unitStageStatus(u, "kid");
  ok("row: Stage 6 · 217 cards · ready at 193 · next = Stage 7", s.stage === 6 && s.total === 217 && s.need === 193 && s.next && s.next.n === 7);
  ok("➡ Stage 6 writes only targeted paths: bank indices 114..330, the kid's settings leaves, kidStage from:5", (() => { const bu = w.G.writes.find(x => x[1] === "mastery/kid_custom_items"); const ks = w.G.writes.find(x => x[1] === "unitStudies/geography_path/kidStage/kid");
    return bu && Object.keys(bu[2]).join() === Array.from({ length: 217 }, (_, i) => i + 114).join() && ks && ks[2].stage === 6 && ks[2].from === 5 &&
      w.G.writes.every(x => x[0] === "update" ? /^mastery\/kid(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid))?$/.test(x[1]) : /^unitStudies\/geography_path\/(kidStage|enrolled)\/kid$/.test(x[1])); })());
  ladder(114, 193, "s6_"); w.unitStageMoveUp("geography_path", "kid");
  const b7 = bank(w, "kid").slice(331), lrn7 = items(w, "kid").filter(i => i.status === "introduction");
  ok("➡ Stage 7: the bank gains the 195 countries under World Geography, by continent; Mexico, Canada, Cuba start learning; 281 definitions", b7.length === 195 && b7.every(c => c.cat === "World Geography") && b7[0].name === "Mexico" && b7[194].name === "Nauru" && lrn7.map(i => i.prompt + "=" + i.answer).join(",") === "Mexico=Mexico City,Canada=Ottawa,Cuba=Havana" && Object.keys(st.definitions).length === 281 && st.cat_modes["World Geography"] === "flip");
  s = w.unitStageStatus(u, "kid");
  ok("row: Stage 7 · 195 cards · ready at 175 · next = Stage 8 Flags (GEOEXTRA); beside it, Landmarks early (open from Stage 3 on)", s.stage === 7 && s.total === 195 && s.need === 175 && s.next && s.next.n === 8 && s.next.label === "Flags" && s.side && s.side.n === 10);
  ok("GEOALL: Georgia the country saved Tbilisi and Georgia the state kept Atlanta — two fronts, two backs", st.definitions["Georgia (country)"] === "Tbilisi" && st.definitions.Georgia === "Atlanta");
  ok("ids unique; every item in a unit deck", new Set(items(w, "kid").map(i => i.id)).size === items(w, "kid").length && items(w, "kid").every(i => ["Geography", "State Shapes", "State Capitals", "Countries", "World Geography"].includes(i.subject)));
}

console.log("── Stage 4 / 6 pictures ──");
{ const w = world(), u = fresh(w); w.geoHydrate(u);
  const dec = k => decodeURIComponent(u.visuals[k].svg.slice("data:image/svg+xml;utf8,".length));
  ok("every State Shapes card: its outline in its region colour + the US inset, no capital dot (same picture as Stage 3's my-state card)", deck(u, "State Shapes").cards.every(c => u.visuals["State Shapes_" + c.name].svg === HoweGeo.svg("state", c.name, { region: w.GEO_REGION_OF[c.name], capital: false })) && u.visuals["State Shapes_North Carolina"].svg === u.visuals["My Country_North Carolina"].svg && /fill="#0072B2"/.test(dec("State Shapes_Maine")) && /fill="#CC79A7"/.test(dec("State Shapes_Oregon")));
  ok("every Countries card: lit on its continent (HoweGeo country picture, capital dot on)", deck(u, "Countries").cards.every(c => u.visuals["Countries_" + c.name].svg === HoweGeo.svg("country", c.name)));
  ok("GEOALL: every one of the 195 has its own picture with a capital dot; a speck (Vatican City, Tuvalu, Bahrain) also has its ring", deck(u, "Countries").cards.length === 195 && deck(u, "Countries").cards.every(c => /<circle[^>]*fill="#111827"/.test(dec("Countries_" + c.name))) && new Set(deck(u, "Countries").cards.map(c => u.visuals["Countries_" + c.name].svg)).size === 195 && ["Vatican City", "Tuvalu", "Bahrain"].every(n => /fill-opacity="0.22"/.test(dec("Countries_" + n))) && !/fill-opacity="0.22"/.test(dec("Countries_France")));
  ok("Stage 4 and 6 words: their geo.js word picture; credits present", deck(u, "Geography").cards.filter(c => c.stage >= 4).every(c => u.visuals["Geography_" + c.name].svg === HoweGeo.svg("word", c.name) && u.visuals["Geography_" + c.name].credit));
  ok("GEOADOPT: every State Capitals card has Stage 4's picture and every World Geography card Stage 6's — the very same string (built once)", deck(u, "State Capitals").cards.every(c => u.visuals["State Capitals_" + c.name].svg === u.visuals["State Shapes_" + c.name].svg) && deck(u, "World Geography").cards.every(c => u.visuals["World Geography_" + c.name].svg === u.visuals["Countries_" + c.name].svg));
  ok("Australia the continent and Australia the country are two different pictures (two decks)", u.visuals["Continents_Australia"].svg !== u.visuals["Countries_Australia"].svg);
  w.setKid("kid");
  ok("_unitPortrait and mastLiveVisual resolve a state, a country and a Stage-6 word", ["State Shapes:Rhode Island", "Countries:Czechia", "Geography:fjord"].every(x => { const [dk, n] = x.split(":"); const p = w._unitPortrait(u, "kid", dk, n), v = w.mastLiveVisual({ subject: dk, prompt: n }); return p && /^data:image\/svg/.test(p.img) && v && v.from === "live" && /^data:image\/svg/.test(v.img); }));
  ok("the record still carries no picture and stays small (< 64 KB, 816 cards)", !/data:|<svg|imageUrl/.test(JSON.stringify(w.geoUnitRecord("North Carolina"))) && JSON.stringify(w.geoUnitRecord("North Carolina")).length < 64000);
  ok("the GEOSTATES block writes nothing (no db.ref / .set( / .update( / storage) and names no kid", (() => { const b = src.slice(src.indexOf("// GEOSTATES_START"), src.indexOf("// GEOSTATES_END")); return b.length > 1000 && !/db\.ref\(|\.set\(|\.update\(|HA_LS|localStorage/.test(b) && !/\b(Julian|Lincoln|Ellis|Lucy)\b/.test(b.replace(/^\/\/.*$/gm, "")); })());
}

console.log("── pictures (geo.js → visuals, in memory) ──");
{ const w = world(), u = fresh(w);
  const t0 = Date.now(); const did = w.geoHydrate(u); const ms = Date.now() - t0;
  console.log("  geoHydrate: 599 pictures in " + ms + " ms");
  ok("geoHydrate ran and put a picture on every one of the 575 cards of Stages 1–7 (places AND words) + the 24 rivers and mountains (GEOEXTRA); flags wait for geoflags.js, landmarks for their photos", did && u.visuals && Object.keys(u.visuals).length === 599 && u.decks.filter(d => !["Flags", "Landmarks"].includes(d.key)).every(d => d.cards.every(c => u.visuals[d.key + "_" + c.name])) && !Object.keys(u.visuals).some(k => /^(Flags|Landmarks)_/.test(k)));
  ok("every picture is {svg: an SVG data URI, credit} — NEVER imageUrl (the key the bank's mint copies onto a kid's item)", Object.values(u.visuals).every(v => typeof v === "object" && /^data:image\/svg\+xml;utf8,%3Csvg/.test(v.svg) && typeof v.credit === "string" && v.credit && !("imageUrl" in v)));
  ok("the mint still stamps only vis.imageUrl / a string — so a geography item never gets a picture written to mastery/<kid>", /else if\(vis\.imageUrl\) item\.imageUrl=vis\.imageUrl;/.test(src) && (() => { const vis = w.mastGetVisual("Continents", "Africa"); const item = {}; if (typeof vis === "string") item.emoji = vis; else if (vis.imageUrl) item.imageUrl = vis.imageUrl; return !("imageUrl" in item) && !("emoji" in item); })());
  const dec = k => decodeURIComponent(u.visuals[k].svg.slice("data:image/svg+xml;utf8,".length));
  ok("the right picture per deck: continent silhouette (Africa in its colour) · ocean (world map) · word drawing · My Country on the US map", /fill="#009E73"/.test(dec("Continents_Africa")) && u.visuals["Oceans_Pacific Ocean"].svg === HoweGeo.svg("ocean", "Pacific Ocean") && u.visuals["Geography_equator"].svg === HoweGeo.svg("word", "equator") && u.visuals["My Country_Great Lakes"].svg === HoweGeo.svg("us", "Great Lakes") && u.visuals["My Country_Alaska"].svg === HoweGeo.svg("us", "Alaska"));
  ok("My Country: Canada/Mexico are country cards, the oceans ocean cards, my state its outline in the Southeast colour with the US inset (no capital dot — that is Stage 5)", u.visuals["My Country_Canada"].svg === HoweGeo.svg("country", "Canada") && u.visuals["My Country_Pacific Ocean"].svg === HoweGeo.svg("ocean", "Pacific Ocean") && u.visuals["My Country_North Carolina"].svg === HoweGeo.svg("state", "North Carolina", { region: "Southeast", capital: false }) && /fill="#E69F00"/.test(dec("My Country_North Carolina")));
  ok("words get their drawing, not the real-example map, by default (lake ≠ the Great Lakes map; peninsula a silhouette)", u.visuals.Geography_lake.svg !== HoweGeo.svg("us", "Great Lakes") && u.visuals.Geography_peninsula.svg === HoweGeo.svg("word", "peninsula") && dec("Geography_peninsula").length < 3000);
  ok("credits: maps → Natural Earth; a drawn word → Howe Academy", /Natural Earth/.test(u.visuals["Continents_Asia"].credit) && /Howe Academy/.test(u.visuals["Geography_globe"].credit));
  // the two picture surfaces
  const P = (dk, n) => w._unitPortrait(u, "kid", dk, n);
  ok("_unitPortrait (Units tab, notebook insert) resolves a place and a word to {img: data URI}", ["Continents:Africa", "Oceans:Indian Ocean", "My Country:Washington DC", "My Country:North Carolina", "Geography:compass rose", "Geography:bay"].every(s => { const [dk, n] = s.split(":"); const p = P(dk, n); return p && /^data:image\/svg\+xml/.test(p.img) && !p.emoji; }));
  w.setKid("kid");
  const L = (dk, n) => w.mastLiveVisual({ subject: dk, prompt: n });
  ok("mastLiveVisual (drill, Study, games, Match) resolves them live — from 'live', {img}", ["Continents:Antarctica", "Oceans:Southern Ocean", "My Country:Mississippi River", "Geography:west", "Geography:river"].every(s => { const [dk, n] = s.split(":"); const v = L(dk, n); return v && v.from === "live" && /^data:image\/svg\+xml/.test(v.img); }));
  ok("_mastVisNorm: a string and an {imageUrl} come back exactly as before; {svg} → {img}; junk → null", JSON.stringify(w._mastVisNorm("🦈", "live")) === JSON.stringify({ emoji: "🦈", from: "live" }) && JSON.stringify(w._mastVisNorm({ imageUrl: "https://x/y.jpg", credit: "c" }, "item")) === JSON.stringify({ img: "https://x/y.jpg", from: "item" }) && JSON.stringify(w._mastVisNorm({ svg: "data:image/svg+xml;utf8,x" }, "live")) === JSON.stringify({ img: "data:image/svg+xml;utf8,x", from: "live" }) && w._mastVisNorm({ more: ["a"] }, "live") === null && w._mastVisNorm("", "live") === null);
  // Mom's own picture / emoji wins; a card the data lacks keeps the unit emoji; re-hydration is idempotent
  u.visuals["Continents_Europe"] = { imageUrl: "https://example.org/europe.jpg", credit: "Mom" }; u.visuals["Geography_north"] = "\u{1F9ED}";
  deck(u, "My Country").cards.push({ name: "Outer Banks", family: "Our country", stage: 3, order: 99 });
  w.geoHydrate(u);
  ok("re-hydrate: Mom's photo and her emoji stay; a card the data lacks gets no picture (unit emoji fallback); the rest redrawn", u.visuals["Continents_Europe"].imageUrl === "https://example.org/europe.jpg" && u.visuals["Geography_north"] === "\u{1F9ED}" && !u.visuals["My Country_Outer Banks"] && P("Continents", "Europe").img === "https://example.org/europe.jpg" && P("Geography", "north").emoji === "\u{1F9ED}" && P("My Country", "Outer Banks") === null && Object.keys(u.visuals).length === 599);
  ok("the kid's own _visuals override still wins over the drawn picture", (w.G.masteryData.kid_visuals = { "Continents_Asia": { imageUrl: "https://example.org/asia.jpg" } }, P("Continents", "Asia").img === "https://example.org/asia.jpg" && L("Continents", "Asia").img === "https://example.org/asia.jpg"));
  ok("a record with no geo.js in reach is left alone (no visuals invented); a unit that isn't this one is never touched", (() => { const w0 = world({ window: {} }); const u2 = w0.geoUnitRecord("Ohio"); return w0.geoHydrate(u2) === false && u2.visuals === undefined; })() && w.geoHydrate({ id: "sharks", decks: [] }, HoweGeo) === false);
}

console.log("── 🏳️🏔🗽 GEOEXTRA: Stages 8 · Flags, 9 · Rivers & mountains, 10 · Landmarks ──");
{ const HoweGeoFlags = require(path.join(DIR, "geoflags.js"));
  const PHOTOS = JSON.parse(fs.readFileSync(path.join(DIR, "tools", "geo_landmark_photos.json"), "utf8")).photos;
  const RM = [["Mississippi River", "North America — the United States"], ["Amazon River", "South America"], ["Nile River", "Africa"], ["Congo River", "Africa"], ["Danube River", "Europe"], ["Rhine River", "Europe"],
    ["Thames River", "Europe — England"], ["Volga River", "Europe — Russia"], ["Ganges River", "Asia — India"], ["Yangtze River", "Asia — China"], ["Mekong River", "Asia — Southeast Asia"], ["Murray River", "Australia"],
    ["Appalachian Mountains", "North America — the United States"], ["Rocky Mountains", "North America"], ["Sierra Nevada", "North America — the United States"], ["Andes Mountains", "South America"], ["Alps", "Europe"], ["Pyrenees", "Europe"],
    ["Ural Mountains", "Europe and Asia — Russia"], ["Caucasus Mountains", "Europe and Asia"], ["Himalayas", "Asia"], ["Atlas Mountains", "Africa"], ["Drakensberg", "Africa — South Africa"], ["Great Dividing Range", "Australia"]];   // Appendix E's 12 + 12, its order
  const LM = ["Statue of Liberty", "Golden Gate Bridge", "Grand Canyon", "Mount Rushmore", "Washington Monument", "Niagara Falls", "Chichén Itzá", "Machu Picchu", "Christ the Redeemer", "Eiffel Tower", "Big Ben", "Colosseum",
    "Leaning Tower of Pisa", "Parthenon", "Neuschwanstein Castle", "Sagrada Família", "Pyramids of Giza", "Victoria Falls", "Table Mountain", "Taj Mahal", "Great Wall of China", "Mount Fuji", "Petra", "Sydney Opera House"];   // Appendix E's 24, its order
  const w = world(), u = fresh(w), fl = deck(u, "Flags"), rm = deck(u, "Rivers & Mountains"), lm = deck(u, "Landmarks");
  const six = deck(u, "Countries").cards.map(c => c.name);
  ok("Flags: one card per Countries card in Stage 6's order, minus the two left out (Oman — not public domain; Afghanistan — disputed, Mom's call): 193, flash, no backs, families = continents", fl.cards.length === 193 && JSON.stringify(fl.cards.map(c => c.name)) === JSON.stringify(six.filter(n => n !== "Oman" && n !== "Afghanistan")) && fl.mode === "flash" && fl.cards.every(c => c.stage === 8 && c.def == null && c.family === deck(u, "Countries").cards.find(x => x.name === c.name).family));
  ok("Flags left out = exactly the ones geoflags.js leaves out, each with its reason", JSON.stringify(Object.keys(w.GEO_FLAGS_LEFT).sort()) === JSON.stringify(Object.keys(HoweGeoFlags.left()).sort()) && /not public domain/.test(w.GEO_FLAGS_LEFT.Oman) && /disputed/.test(w.GEO_FLAGS_LEFT.Afghanistan));
  ok("every Flags card has its flag in geoflags.js, and every flag there is a card — no orphan either way", fl.cards.every(c => HoweGeoFlags.has(c.name)) && HoweGeoFlags.names().length === 193 && HoweGeoFlags.names().every(n => fl.cards.some(c => c.name === n)));
  ok("Rivers & Mountains: Appendix E's 12 rivers then 12 mountains, its order and names, a back naming the continent (and country), flash", JSON.stringify(rm.cards.map(c => [c.name, c.def])) === JSON.stringify(RM) && rm.mode === "flash" && rm.cards.every(c => c.stage === 9) && rm.cards.slice(0, 12).every(c => c.family === "Rivers of the world") && rm.cards.slice(12).every(c => c.family === "Mountains of the world"));
  ok("…every one of them drawn already in geo.js (Natural Earth): names match geo.js's rivers + ranges exactly", JSON.stringify(rm.cards.map(c => c.name)) === JSON.stringify(HoweGeo.names("river").concat(HoweGeo.names("range"))));
  ok("Landmarks: Appendix E's 24 in its order, the US first; flip (name → where) with no flipFace until the photos are in; families = continents", JSON.stringify(lm.cards.map(c => c.name)) === JSON.stringify(LM) && lm.mode === "flip" && lm.flipFace === undefined && lm.cards.every(c => c.stage === 10 && c.def && c.def.length > 3) && [...new Set(lm.cards.map(c => c.family))].join("|") === "North America|South America|Europe|Africa|Asia|Oceania" && lm.cards.slice(0, 6).every(c => /United States/.test(c.def)));
  ok("the photos' credit manifest names exactly these 24 cards, in order; PD / CC0 / CC BY only (no share-alike); one credit each", JSON.stringify(PHOTOS.map(p => p.card)) === JSON.stringify(LM) && PHOTOS.every(p => /^(Public domain|CC0|CC BY \d\.\d)$/.test(p.license) && !/SA/.test(p.license) && /^Photo: .+ · .+ · Wikimedia Commons$/.test(p.credit) && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.source) && /^[0-9a-f]{64}$/.test(p.sha256)));
  ok("a CC BY photo carries its author and the licence link (the licence's terms); US photos lean on the National Park Service", PHOTOS.filter(p => /^CC BY/.test(p.license)).every(p => p.author && /^https:\/\/creativecommons\.org\/licenses\/by\//.test(p.licenseUrl)) && PHOTOS.filter(p => /National Park|NPS/.test(p.author)).length >= 3);
  ok("How-to notes for the three new decks (Mom's and the kid's line)", ["Flags", "Rivers & Mountains", "Landmarks"].every(k => w.STARTER_HOWTO[k] && w.STARTER_HOWTO[k].main && w.STARTER_HOWTO[k].kid));
  ok("starterVer 5 (the earlier families are offered Stages 8–10 by ＋ Add the new stages — test_starter_update.js)", u.starterVer === 5);

  // pictures
  w.geoHydrate(u);
  ok("rivers and mountains: their geo.js picture (the feature lit on its continent), credit Natural Earth", rm.cards.every(c => u.visuals["Rivers & Mountains_" + c.name] && u.visuals["Rivers & Mountains_" + c.name].svg === HoweGeo.svg("feature", c.name) && /Natural Earth/.test(u.visuals["Rivers & Mountains_" + c.name].credit)));
  ok("without geoflags.js: no Flags picture (the unit emoji meanwhile); Landmarks never get a code picture", !Object.keys(u.visuals).some(k => /^(Flags|Landmarks)_/.test(k)));
  const wf = world({ window: { HoweGeo, HoweGeoFlags } }), uf = fresh(wf); wf.geoHydrate(uf);
  ok("with geoflags.js: every one of the 193 Flags cards has its flag, its credit (file · Public domain · Wikimedia Commons), never an imageUrl", fl.cards.every(c => { const v = uf.visuals["Flags_" + c.name]; return v && v.svg === HoweGeoFlags.svg(c.name) && /^Flag: Flag of .+ · Public domain · Wikimedia Commons$/.test(v.credit) && !("imageUrl" in v); }));
  ok("a flag reaches the drill and the Units tab like every other picture (mastLiveVisual, _unitPortrait)", (wf.setKid("kid"), ["Canada", "Mexico", "Nepal"].every(n => { const p = wf._unitPortrait(uf, "kid", "Flags", n), v = wf.mastLiveVisual({ subject: "Flags", prompt: n }); return p && /^data:image\/(svg\+xml|png)/.test(p.img) && v && v.from === "live" && v.img === p.img; })));
  uf.visuals["Landmarks_Eiffel Tower"] = { imageUrl: "https://example.org/eiffel.jpg", credit: "Photo: x · CC0 · Wikimedia Commons" }; wf.geoHydrate(uf);
  ok("an imported landmark photo is Mom's picture: it shows (Units tab, drill) and hydration never touches it", uf.visuals["Landmarks_Eiffel Tower"].imageUrl === "https://example.org/eiffel.jpg" && wf._unitPortrait(uf, "kid", "Landmarks", "Eiffel Tower").img === "https://example.org/eiffel.jpg" && wf.mastLiveVisual({ subject: "Landmarks", prompt: "Eiffel Tower" }).img === "https://example.org/eiffel.jpg");
  ok("the record still holds no picture (flags and photos live outside it)", !/data:|<svg|imageUrl/.test(JSON.stringify(w.geoUnitRecord("North Carolina"))));

  // loading geoflags.js only when it is wanted
  const wl = world({ window: { HoweGeo } }), ul = fresh(wl);
  wl.envHydrateAll();
  ok("no kid on Flags: geoflags.js is not fetched", wl.G.lazy.indexOf("geoflags") < 0 && wl.geoxFlagsWanted([ul]) === false);
  ul.kidStage = { kid: { stage: 7 } }; wl.G.masteryData.kid = [{ subject: "World Geography", prompt: "France", status: "active" }];
  ok("a kid on Stage 7 with no Flags card: still not wanted", wl.geoxFlagsWanted([ul]) === false);
  wl.setOpen("geography_path"); ok("Mom has the unit's page open: wanted (the Flags deck shows its pictures)", wl.geoxFlagsWanted([ul]) === true); wl.setOpen(null);
  wl.G.masteryData.kid.push({ subject: "Flags", prompt: "Canada", status: "introduction" });
  ok("a kid holding a Flags card (or on Stage 8): wanted", wl.geoxFlagsWanted([ul]) === true && wl.geoxFlagsWanted([{ id: "g", kidStage: { k: { stage: 8 } } }]) === true);
  wl.G.lazyLoad = name => { if (name === "geoflags") { wl.G.window.HoweGeoFlags = HoweGeoFlags; return Promise.resolve(true); } return Promise.reject(new Error("x")); };
  wl.envHydrateAll();
  ok("envHydrateAll then fetches geoflags.js once, through haLazyLoad", wl.G.lazy.filter(n => n === "geoflags").length === 1);
  Promise.resolve().then(() => Promise.resolve()).then(() => {
    ok("…and once it is here the Flags cards are hydrated in place — nothing written", ul.visuals && fl.cards.every(c => ul.visuals["Flags_" + c.name]) && wl.G.writes.length === 0);
  });
  ok("geoflags.js is a lazy file the service worker keeps offline; haLazyReady knows it", /geoflags:"geoflags\.js"/.test(src) && /name==="geoflags"\) return !!\(typeof window!=="undefined"&&window\.HoweGeoFlags\)/.test(src) && /\|geoflags\|/.test(fs.readFileSync(path.join(DIR, "sw.js"), "utf8")));
}

console.log("── 🗽 GEOEXTRA: the stage rules — Stage 10 early from Stage 3; 8–10 never count toward an earlier stage ──");
const startAt = (w, n) => { w.unitStageFormOpen("geography_path", "kid"); w.unitStageFormSet("stage", String(n)); w.unitStageEnroll(); };
const allOn = (w, u, n) => { const all = items(w, "kid"); w.G.unitStudies.geography_path.decks.forEach(d => d.cards.filter(c => c.stage === n).forEach(c => { const it = all.find(i => i.subject === d.key && i.prompt === c.name); if (it) { it.status = "active"; it.tier = "weekly"; } else all.push({ id: "on_" + d.key + c.name, subject: d.key, prompt: c.name, status: "active", tier: "weekly" }); })); };
{ const w = world(), u = fresh(w); startAt(w, 2);
  let s = w.unitStageStatus(u, "kid");
  ok("a kid on Stage 2: ➡ Stage 3, nothing early (Landmarks opens from Stage 3)", s.next && s.next.n === 3 && s.side === null && !/\(early\)/.test(w._unitStageRowsHtml(u, ["kid"])));
}
{ const w = world(), u = fresh(w); startAt(w, 3);
  let s = w.unitStageStatus(u, "kid");
  ok("a kid on Stage 3: ➡ Stage 4 AND “or ➡ Stage 10: Landmarks (early)” beside it", s.next && s.next.n === 4 && s.side && s.side.n === 10 && /or ➡ Stage 10: Landmarks \(early\)/.test(w._unitStageRowsHtml(u, ["kid"])) && /unitStageMoveUp\('geography_path','kid',undefined,10\)/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("Stage 3's ready counts Stage 3's 24 cards only — a Rivers & Mountains “Mississippi River” card on the ladder doesn't count", (items(w, "kid").push({ id: "rm1", subject: "Rivers & Mountains", prompt: "Mississippi River", status: "active" }), s = w.unitStageStatus(u, "kid"), s.total === 24 && s.on === 0));
  const b0 = bank(w, "kid").length, before = items(w, "kid").map(i => i.id + i.status).join();
  w.unitStageMoveUp("geography_path", "kid", undefined, 9);
  ok("asking for a stage that isn't the early one (9) does nothing", bank(w, "kid").length === b0 && u.kidStage.kid.stage === 3);
  w.G.writes.length = 0; w.unitStageMoveUp("geography_path", "kid", undefined, 10);
  const b10 = bank(w, "kid").slice(b0);
  ok("Stage 10 early: the 24 landmarks join the bank, the first 3 start learning, their backs saved; the kid is on Stage 10, from 3", u.kidStage.kid.stage === 10 && u.kidStage.kid.from === 3 && b10.length === 24 && b10.every(c => c.cat === "Landmarks") &&
    items(w, "kid").filter(i => i.subject === "Landmarks" && i.status === "introduction").map(i => i.prompt).join() === "Statue of Liberty,Golden Gate Bridge,Grand Canyon" && w.G.masteryData.kid_settings.definitions["Eiffel Tower"] === "Paris, France" && w.G.masteryData.kid_settings.cat_modes.Landmarks === "flip");
  ok("…Stage 3's cards untouched (the old stage keeps reviewing)", items(w, "kid").filter(i => i.subject !== "Landmarks").map(i => i.id + i.status).join() === before);
  ok("…writes only the targeted paths (mastery/kid lists and settings leaves, kidStage, enrolled)", w.G.writes.length > 0 && w.G.writes.every(x => x[0] === "update" ? /^mastery\/kid(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid))?$/.test(x[1]) : /^unitStudies\/geography_path\/(kidStage|enrolled)\/kid$/.test(x[1])));
  s = w.unitStageStatus(u, "kid");
  ok("on Stage 10 (came early): 24 cards, ready at 22; ➡ goes BACK to Stage 4 (where the path was left); nothing early now", s.total === 24 && s.need === 22 && s.next && s.next.n === 4 && s.side === null);
  w.unitStageMoveUp("geography_path", "kid");
  s = w.unitStageStatus(u, "kid");
  ok("➡ Stage 4: from 10; ➡ then Stage 5; Landmarks not offered again (already given)", u.kidStage.kid.stage === 4 && u.kidStage.kid.from === 10 && s.next.n === 5 && s.side === null);
  [5, 6, 7, 8].forEach(() => { allOn(w, u, u.kidStage.kid.stage); w.unitStageMoveUp("geography_path", "kid"); });
  s = w.unitStageStatus(u, "kid");
  ok("walking on: 5 → 6 → 7 → 8 → Stage 8 Flags (193 cards, ready at 174), next = 9", u.kidStage.kid.stage === 8 && s.total === 193 && s.need === 174 && s.next.n === 9);
  allOn(w, u, 8); w.unitStageMoveUp("geography_path", "kid"); s = w.unitStageStatus(u, "kid");
  ok("on Stage 9: 24 cards, ready at 22 — and no ➡ to Landmarks (already given): the path ends here", u.kidStage.kid.stage === 9 && s.total === 24 && s.need === 22 && s.next === null && s.side === null);
  ok("no card twice in the kid's bank or list across the whole walk", (() => { const k = bank(w, "kid").map(c => c.cat + "|" + c.name), l = items(w, "kid").map(i => i.subject + "|" + i.prompt); return new Set(k).size === k.length && new Set(l).size === l.length; })());
}
{ const w = world(), u = fresh(w); startAt(w, 9);
  const s = w.unitStageStatus(u, "kid");
  ok("a kid started straight at Stage 9: ➡ Stage 10 the ordinary way; nothing early", s.next && s.next.n === 10 && s.side === null);
  allOn(w, u, 9); w.unitStageMoveUp("geography_path", "kid");
  ok("➡ 9 → 10 (from 9): the end of the path", u.kidStage.kid.stage === 10 && u.kidStage.kid.from === 9 && w.unitStageStatus(u, "kid").next === null);
}
{ const w = world(), u = fresh(w); startAt(w, 7); allOn(w, u, 7);
  const s = w.unitStageStatus(u, "kid");
  ok("Stage 7 is ready on its own 195 (175 needed) — the 241 cards of Stages 8–10 never count toward it", s.total === 195 && s.ready && s.on === 195 && s.next.n === 8);
}
{ const w = world({ dry: true }), u = fresh(w); startAt(w, 3); w.unitStageMoveUp("geography_path", "kid", undefined, 10);
  ok("?dryrun=1: the early jump writes nothing", w.G.writes.length === 0 && u.kidStage.kid.stage === 10);
}
{ const w = world(); const u = { id: "plain", stages: [{ n: 1, label: "A" }, { n: 2, label: "B" }], decks: [{ key: "D", mode: "flash", cards: [{ name: "a", stage: 1, family: "f", order: 1 }, { name: "b", stage: 2, family: "f", order: 2 }] }] };
  w.G.unitStudies.plain = u; w.unitStageFormOpen("plain", "kid"); w.unitStageEnroll();
  const s = w.unitStageStatus(u, "kid");
  ok("a unit with no early stage: ➡ exactly as before, no side button", s.next && s.next.n === 2 && s.side === null && !/\(early\)/.test(w._unitStageRowsHtml(u, ["kid"])));
}
ok("the GEOEXTRA block writes nothing (no db.ref / .set( / .update( / storage) and names no kid", (() => { const b = src.slice(src.indexOf("// GEOEXTRA_START"), src.indexOf("// GEOEXTRA_END")); return b.length > 3000 && src.indexOf("// GEOEXTRA_START", src.indexOf("// GEOEXTRA_START") + 1) < 0 && !/db\.ref\(|\.set\(|\.update\(|HA_LS|localStorage|storage\(\)/.test(b) && !/\b(Julian|Lincoln|Ellis|Lucy|Adrienne|Sara|Caleb|Taylor|Andrew|Makenzie|Melanie)\b/.test(b.replace(/^\/\/.*$/gm, "")); })());

console.log("── 🧪 GEOEXTRA mutation check: each rule, broken on purpose in a copy of the code, is caught ──");
{ const kidAt3Side = S => { const w = world({ src: S }), u = fresh(w); startAt(w, 3); const s = w.unitStageStatus(u, "kid"); return !!(s.side && s.side.n === 10); };
  const backTo4 = S => { const w = world({ src: S }), u = fresh(w); startAt(w, 3); w.unitStageMoveUp("geography_path", "kid", undefined, 10); const s = w.unitStageStatus(u, "kid"); return !!(s && s.next && s.next.n === 4); };
  const flagsPdOnly = S => { const w = world({ src: S }), u = fresh(w); return !deck(u, "Flags").cards.some(c => c.name === "Oman"); };
  const ver5 = S => { const w = world({ src: S }); return w.STARTER_UNITS.geography_path().starterVer === 5; };
  const noSideTwice = S => { const w = world({ src: S }), u = fresh(w); startAt(w, 3); w.unitStageMoveUp("geography_path", "kid", undefined, 10); w.unitStageMoveUp("geography_path", "kid"); return w.unitStageStatus(u, "kid").side === null; };
  const M = [["Stage 10's openFrom:3 removed", s => s.replace(",readyAt:22,openFrom:3}", ",readyAt:22}"), kidAt3Side],
    ["➡ after an early stage no longer goes back", s => s.replace("const cand=(sd.openFrom!=null&&ks.from!=null&&from<cur-1)?", "const cand=false?"), backTo4],
    ["Oman's non-PD flag let in", s => s.replace('const GEO_FLAGS_LEFT={"Oman":', 'const GEO_FLAGS_LEFT={"Oman_":'), flagsPdOnly],
    ["starterVer left at 4", s => s.replace("starterVer:5, title:\"Geography Path\"", "starterVer:4, title:\"Geography Path\""), ver5],
    ["an early stage offered again after it was given", s => s.replace("&&!_geoxGiven(u,kid,s.n))||null;\n}\n// GEOEXTRA_END", ")||null;\n}\n// GEOEXTRA_END"), noSideTwice]];
  M.forEach(([what, mut, rule]) => { const S2 = mut(src);
    ok("mutant “" + what + "”: the copy differs, the real code passes the rule, the mutant fails it", S2 !== src && rule(src) === true && rule(S2) === false); });
}

console.log("── loading: geoHydrateAll from envHydrateAll, geo.js fetched lazily ──");
{ const w = world({ window: {} }); const u = fresh(w);
  let resolved = false;
  w.G.lazyLoad = name => { if (name !== "geo") return Promise.reject(new Error("wrong file")); w.G.window.HoweGeo = HoweGeo; resolved = true; return Promise.resolve(true); };
  const r = w.envHydrateAll();
  ok("envHydrateAll calls geoHydrateAll; with no HoweGeo yet it asks haLazyLoad('geo') once and returns (no envirothon unit → false)", r === false && w.G.lazy.join() === "geo" && !u.visuals);
  return_after: {
    setTimeout(() => {
      ok("after geo.js loads, the record is hydrated in place (599 pictures) — nothing written; no kid on Flags → geoflags.js not asked for", resolved && u.visuals && Object.keys(u.visuals).length === 599 && w.G.writes.length === 0 && w.G.lazy.join() === "geo");
      const w2 = world(); fresh(w2); w2.envHydrateAll();
      ok("with HoweGeo already in the page, hydration is immediate and no fetch is asked", Object.keys(w2.G.unitStudies.geography_path.visuals).length === 599 && w2.G.lazy.length === 0);
      const w3 = world({ window: {} }); w3.G.lazyLoad = () => Promise.reject(new Error("offline"));
      fresh(w3); w3.envHydrateAll();
      setTimeout(() => { ok("a failed fetch (offline) is swallowed: the unit still works, cards show the unit emoji, no throw", !w3.G.unitStudies.geography_path.visuals && w3.G.writes.length === 0); finish(); }, 0);
    }, 0);
  }
}

function finish() {
  console.log("── the plumbing in the page ──");
  ok("HA_LAZY_FILES names geo.js; haLazyReady knows geo (window.HoweGeo)", /HA_LAZY_FILES=\{[^}]*\bgeo:"geo\.js"/.test(src) && src.indexOf('if(name==="geo") return !!(typeof window!=="undefined"&&window.HoweGeo);') > 0);
  const sw = fs.readFileSync(path.join(DIR, "sw.js"), "utf8");
  const swRe = /const lazyM = req\.method === 'GET' && (\/[^\n]*?\/)\.exec\(new URL\(req\.url\)\.pathname\);/.exec(sw);
  ok("sw.js keeps an offline copy of geo.js like the other lazy files", !!swRe && eval(swRe[1]).test("/howe-academy/geo.js") && !eval(swRe[1]).test("/howe-academy/xgeo.js"));
  ok("envHydrateAll hooks geoHydrateAll (typeof-guarded); starterUnitAdd's done() runs envHydrateAll → the Add also hydrates", /function envHydrateAll\(\)\{\n[^\n]*\n  if\(typeof geoHydrateAll==="function"\) geoHydrateAll\(\);/.test(src) && /const done=\(\)=>\{ unitStudies\[id\]=u; if\(typeof envHydrateAll==="function"\) envHydrateAll\(\);/.test(src));
  ok("the two picture readers were extended by one clause each and nothing else (string and {imageUrl} first, unchanged)", /function _unitPortrait\([^\n]*if\(typeof v==="string"\) return \{emoji:v\}; if\(v\.imageUrl\) return \{img:v\.imageUrl\}; if\(v\.svg\) return \{img:v\.svg\}; \} return null; \}/.test(src) && /function _mastVisNorm\(v,from\)\{ if\(typeof v==="string"&&v\) return \{emoji:v,from:from\}; if\(v&&typeof v==="object"&&v\.imageUrl\) return \{img:String\(v\.imageUrl\),from:from\}; if\(v&&typeof v==="object"&&v\.svg\) return \{img:String\(v\.svg\),from:from\}; return null; \}/.test(src));
  ok("the GEOPATH block writes nothing itself (no db.ref / .set( / .update( inside it) and never touches localStorage", !/db\.ref\(|\.set\(|\.update\(|HA_LS|localStorage/.test(src.slice(g0, g1)));
  ok("no 🔀 in index.html (house rule)", src.indexOf("\u{1F500}") < 0);

  console.log("── dry run ──");
  { const w = world({ dry: true }); fresh(w);
    w.unitStageFormOpen("geography_path", "kid"); w.unitStageEnroll();
    w.G.masteryData.kid.forEach(i => { i.status = "active"; }); ["Antarctica", "Australia", "South America", "Europe", "Asia"].forEach((n, i) => w.G.masteryData.kid.push({ id: "d" + i, subject: "Continents", prompt: n, status: "active" }));
    w.unitStageMoveUp("geography_path", "kid"); w.geoAddHomeSet("Ohio"); w.starterUnitAdd("geography_path");
    ok("?dryrun=1: enroll, move-up and Add write NOTHING — the kid still gets the cards in memory", w.G.writes.length === 0 && w.G.masteryData.kid.length === 11 && w.G.masteryData.kid_custom_items.length === 25); }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
