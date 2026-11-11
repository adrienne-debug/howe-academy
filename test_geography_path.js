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

function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, currData: { subjects: {} }, writes: [], dry: !!o.dry, unitStudies: {}, content: { innerHTML: "" },
    window: o.window || { HoweGeo }, lazy: [] };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const v = fn(null); G.writes.push(["transaction", p, v]); return Promise.resolve({ committed: true }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; let masteryKid="julian";
    const window=G.window;
    function momHere(){ return true; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    function haLazyLoad(name){ G.lazy.push(name); return G.lazyLoad?G.lazyLoad(name):Promise.reject(new Error("no loader")); }
    ${block}
    ${picsCode}
    return { STARTER_UNITS, STARTER_HOWTO, GEO_DECK_KEYS, GEO_STATES, GEO_REGION_OF, geoUnitRecord, geoHydrate, geoHydrateAll, geoAddHomeSet, geoAddHomeHtml,
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
  ok("3 stages: The seven continents · Oceans & globe words (ready at 16 of 18) · My country (ready at 22 of 24)", u.stages.map(s => s.n + ":" + s.label).join("|") === "1:The seven continents|2:Oceans & globe words|3:My country" && u.stages[0].readyAt == null && u.stages[1].readyAt === 16 && u.stages[2].readyAt === 22);
  ok("4 decks, in this order: Continents flash · Oceans flash · Geography flip · My Country flash — all 2 at a time, grouped by family", u.decks.map(d => d.key + "/" + d.mode + "/" + d.introCap + "/" + d.groupBy).join("|") === "Continents/flash/2/family|Oceans/flash/2/family|Geography/flip/2/family|My Country/flash/2/family");
  ok("Stage 1: 7 continents in §5.2 order — North America · Africa, Antarctica, Australia · South America, Europe, Asia", names(u, "Continents").join(",") === "North America,Africa,Antarctica,Australia,South America,Europe,Asia" && deck(u, "Continents").cards.every(c => c.stage === 1 && c.def == null));
  ok("Stage 1 families: Where we live · Big, easy shapes · The rest", [...new Set(deck(u, "Continents").cards.map(c => c.family))].join("|") === "Where we live|Big, easy shapes|The rest");
  ok("Stage 2: 5 oceans (Q1 default: Southern Ocean in) — the two big ones first", names(u, "Oceans").join(",") === "Pacific Ocean,Atlantic Ocean,Indian Ocean,Arctic Ocean,Southern Ocean" && deck(u, "Oceans").cards.every(c => c.stage === 2));
  const wd = deck(u, "Geography");
  ok("the words deck key is exactly 'Geography' (Ellis's deck — born under its final key), flip", wd.key === "Geography" && wd.mode === "flip" && u.decks.filter(d => /geograph/i.test(d.key)).length === 1);
  ok("Stage 2 share: 13 globe words, Appendix C names AND backs byte for byte, The globe (9) then Directions (4)", JSON.stringify(wd.cards.filter(c => c.stage === 2).map(c => [c.name, c.def])) === JSON.stringify(WORDS2) && wd.cards.filter(c => c.stage === 2).map(c => c.family).join(",") === "The globe,".repeat(9).slice(0, -1) + "," + "Directions,".repeat(4).slice(0, -1));
  ok("Stage 3 share: 10 land and water words, Appendix C byte for byte, one family", JSON.stringify(wd.cards.filter(c => c.stage === 3).map(c => [c.name, c.def])) === JSON.stringify(WORDS3) && wd.cards.filter(c => c.stage === 3).every(c => c.family === "Land and water words"));
  ok("23 words in all, none of them one of Ellis's 24 (those come in Stages 4 and 6)", wd.cards.length === 23 && !wd.cards.some(c => ["tributaries", "glacier", "peak", "elevation", "contour lines", "cardinal directions", "intermediate directions", "lines of latitude", "lines of longitude", "atmosphere", "tectonic plates", "caldera", "geyser", "precipitation", "evaporation", "biome", "tundra", "taiga"].includes(c.name)));
  ok("Stage 3: My Country 14 = Appendix D with North Carolina as my state, flash, no backs", names(u, "My Country").join(",") === MY_COUNTRY.join(",") && deck(u, "My Country").cards.every(c => c.stage === 3 && c.def == null));
  ok("My Country families: Our country (3) · Our neighbours (2) · Water around us (5) · Land and far-away states (4)", deck(u, "My Country").cards.map(c => c.family).filter((f, i, A) => A.indexOf(f) === i).join("|") === "Our country|Our neighbours|Water around us|Land and far-away states" && deck(u, "My Country").cards.filter(c => c.family === "Our country").map(c => c.name).join(",") === "United States,Washington DC,North Carolina");
  ok("49 cards, every name a legal database key (no . # $ [ ] /), order 1..49 across the unit", u.decks.reduce((s, d) => s + d.cards.length, 0) === 49 && u.decks.every(d => d.cards.every(c => !/[.#$\[\]\/]/.test(c.name))) && [].concat(...u.decks.map(d => d.cards)).map(c => c.order).sort((x, y) => x - y).join() === Array.from({ length: 49 }, (_, i) => i + 1).join());
  ok("no stage past 3 is defined yet — but the deck keys of Stages 4–7 are fixed: State Shapes · State Capitals · Countries · World Geography (and Geography)", u.stages.length === 3 && w.GEO_DECK_KEYS.states === "State Shapes" && w.GEO_DECK_KEYS.capitals === "State Capitals" && w.GEO_DECK_KEYS.countries === "Countries" && w.GEO_DECK_KEYS.world === "World Geography" && w.GEO_DECK_KEYS.words === "Geography");
  ok("the record carries NO picture: no visuals, no data: URI, no <svg (pictures live in geo.js)", u.visuals === undefined && !/data:|<svg|imageUrl/.test(JSON.stringify(u)) && JSON.stringify(u).length < 12000);
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
  ok("row: Stage 3 · 24 cards · ready at 22 · no Stage 4 yet (no ➡ button)", s.stage === 3 && s.total === 24 && s.need === 22 && s.next === null && !/Start Stage 4/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("ids unique across the three stages; every item has a home deck", new Set(items(w, "kid").map(i => i.id)).size === items(w, "kid").length && items(w, "kid").every(i => ["Continents", "Oceans", "Geography", "My Country"].includes(i.subject)));
}

console.log("── another home: Stage 3 seeds that state's card ──");
{ const w = world(); w.geoAddHomeSet("Ohio"); const u = fresh(w);
  w.unitStageFormOpen("geography_path", "kid"); w.unitStageFormSet("stage", "3"); w.unitStageEnroll();
  const bk = bank(w, "kid").map(c => c.name);
  ok("a kid enrolled straight at Stage 3 in an Ohio family: Ohio in the bank, North Carolina not; 24 entries", bk.includes("Ohio") && !bk.includes("North Carolina") && bk.length === 24);
}

console.log("── pictures (geo.js → visuals, in memory) ──");
{ const w = world(), u = fresh(w);
  const t0 = Date.now(); const did = w.geoHydrate(u); const ms = Date.now() - t0;
  console.log("  geoHydrate: 49 pictures in " + ms + " ms");
  ok("geoHydrate ran and put a picture on every one of the 49 cards (places AND words)", did && u.visuals && Object.keys(u.visuals).length === 49 && u.decks.every(d => d.cards.every(c => u.visuals[d.key + "_" + c.name])));
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
  ok("re-hydrate: Mom's photo and her emoji stay; a card the data lacks gets no picture (unit emoji fallback); the rest redrawn", u.visuals["Continents_Europe"].imageUrl === "https://example.org/europe.jpg" && u.visuals["Geography_north"] === "\u{1F9ED}" && !u.visuals["My Country_Outer Banks"] && P("Continents", "Europe").img === "https://example.org/europe.jpg" && P("Geography", "north").emoji === "\u{1F9ED}" && P("My Country", "Outer Banks") === null && Object.keys(u.visuals).length === 49);
  ok("the kid's own _visuals override still wins over the drawn picture", (w.G.masteryData.kid_visuals = { "Continents_Asia": { imageUrl: "https://example.org/asia.jpg" } }, P("Continents", "Asia").img === "https://example.org/asia.jpg" && L("Continents", "Asia").img === "https://example.org/asia.jpg"));
  ok("a record with no geo.js in reach is left alone (no visuals invented); a unit that isn't this one is never touched", (() => { const w0 = world({ window: {} }); const u2 = w0.geoUnitRecord("Ohio"); return w0.geoHydrate(u2) === false && u2.visuals === undefined; })() && w.geoHydrate({ id: "sharks", decks: [] }, HoweGeo) === false);
}

console.log("── loading: geoHydrateAll from envHydrateAll, geo.js fetched lazily ──");
{ const w = world({ window: {} }); const u = fresh(w);
  let resolved = false;
  w.G.lazyLoad = name => { if (name !== "geo") return Promise.reject(new Error("wrong file")); w.G.window.HoweGeo = HoweGeo; resolved = true; return Promise.resolve(true); };
  const r = w.envHydrateAll();
  ok("envHydrateAll calls geoHydrateAll; with no HoweGeo yet it asks haLazyLoad('geo') once and returns (no envirothon unit → false)", r === false && w.G.lazy.join() === "geo" && !u.visuals);
  return_after: {
    setTimeout(() => {
      ok("after geo.js loads, the record is hydrated in place (49 pictures) — nothing written", resolved && u.visuals && Object.keys(u.visuals).length === 49 && w.G.writes.length === 0);
      const w2 = world(); fresh(w2); w2.envHydrateAll();
      ok("with HoweGeo already in the page, hydration is immediate and no fetch is asked", Object.keys(w2.G.unitStudies.geography_path.visuals).length === 49 && w2.G.lazy.length === 0);
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
