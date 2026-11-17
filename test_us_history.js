// 📜 United States Path — slice 4 USHIST: the history stages 5, 6, 8, 9 (PLAN_us_unit_2026-11-16.md §4, §5, §9 row 4; her go
// 2026-11-17: "and go with the next history"). Runs the real STARTER_UNITS block (USPATH + USPRES + USHIST + UNITATTACH + UNIT_STAGES
// + STARTERUP) with the real us.js, us_pics_1.js, us_pics_2.js and geo.js. Fixture kids are made up (no family's names):
//  · the code ships Stages 1–9 at version 3: 246 cards in 10 decks, stage counts 37 · 30 · 25 · 26 for the new four;
//  · the U.S. History deck is the built-in one — its 20 built-in names and backs byte for byte; the 13 Colonies fronts are
//    "<name> Colony", so NO shipped card name is a built-in back's key except those 20 (whose back is the path's), a math fact,
//    a Geography Path card or another starter's card with a back — no surface can show a state capital as a colony's answer;
//  · a kid with live U.S. History cards is HOOKED UP (usAdoptSpec), not enrolled: lowest live stage (Jamestown → 5), ZERO card
//    writes, no back for the 20, later cards kept, Mom's own card a stray left alone, the stock "+ Kid" closed for that kid only;
//    decks brand new to the kid get the path's card style (newDeckStyle) — a deck they have keeps its own;
//  · a kid with the built-in list but no live card takes the stock enroll, with no name twice in their list;
//  · a family on version 1 or 2 gets "＋ Add the new stages": only adds, never a kid's card;
//  · pictures: every one of the 246 resolves once geo.js and both photo files are in (colony maps, battle pins, photos).
const fs = require("fs"), path = require("path"), vm = require("vm");
const rd = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const src = rd("index.html"), usSrc = rd("us.js"), p1Src = rd("us_pics_1.js"), p2Src = rd("us_pics_2.js"), geoSrc = rd("geo.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const h0 = src.indexOf("// USHIST_START"), h1 = src.indexOf("// USHIST_END");
ok("USHIST block once, right after USPATH_END, inside the STARTER_UNITS block", h0 === src.indexOf("// USPATH_END") + "// USPATH_END\n".length && h1 > h0 && h1 < b && src.indexOf("// USHIST_START", h0 + 1) < 0);
const block = src.slice(a, b);
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible", "haKeyOk", "haKey", "mastGetDef"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();
const MATH = src.slice(src.indexOf("const MAST_MATH_ANS={"), src.indexOf("};", src.indexOf("const MAST_MATH_ANS={")) + 2);
const VD = new Function(VOCAB + "\nreturn MAST_VOCAB_DEFS;")();
const BUILT = JSON.parse(/"U\.S\. History":(\[[^\]]*\])/.exec(src)[1]);   // the built-in list, read from the page
const H = "U.S. History", UNIT = "us_path";
const KID = "kida", LISTONLY = "kidb", NEW = "kidc", LATE = "kidd";

function loadAll(o) {   // the browser's way: geo.js, the photo files, us.js — classic scripts on one window
  const win = {}, ctx = { window: win, module: undefined, console }; vm.createContext(ctx);
  if (!o || o.geo !== false) vm.runInContext(geoSrc, ctx);
  if (!o || o.pics !== false) { vm.runInContext(p1Src, ctx); vm.runInContext(p2Src, ctx); }
  vm.runInContext(usSrc, ctx); return win;
}
const WIN = loadAll(), L = WIN.HoweUS;

// The made-up kid with live U.S. History cards: the first 13 built-ins (Jamestown → Reconstruction) at mixed rungs, one card
// Mom added herself ("Pony Express", not on the path), her own wording on Jamestown, the deck flip, 2 at a time.
function fixture(G) {
  const items = [];
  for (let i = 0; i < 12; i++) items.push({ id: "kid_mf" + i, subject: "Math Facts", prompt: i + " × 4", answer: String(i * 4), status: "active", tier: "weekly", review_mode: "flash", next_due: 30 + i });
  BUILT.slice(0, 13).forEach((n, i) => items.push({ id: "kid_us" + i, subject: H, type: "u.s. history", prompt: n, answer: i === 0 ? "1607 — the first lasting English town" : VD[n.toLowerCase()],
    status: i > 10 ? "introduction" : "active", tier: i > 10 ? "daily" : ["monthly", "bi_weekly", "weekly"][i % 3], review_mode: "flip", next_due: 40 + i, consecutive_correct: i }));
  items.push({ id: "kid_us_px", subject: H, prompt: "Pony Express", answer: "1860 — riders carried mail west", status: "active", tier: "weekly", review_mode: "flip", next_due: 60 });
  G.masteryData[KID] = items;
  G.masteryData[KID + "_custom_items"] = [{ cat: "Vocabulary", name: "harbor" }, { cat: H, name: "Pony Express" }];
  G.masteryData[KID + "_settings"] = { cat_modes: { [H]: "flip", "Math Facts": "quiz" }, cat_intro_max: { [H]: 2 }, definitions: { "Pony Express": "1860 — riders carried mail west" } };
  G.masteryData[LISTONLY] = []; G.masteryData[LISTONLY + "_custom_items"] = []; G.masteryData[LISTONLY + "_settings"] = {};
  G.masteryData[NEW] = []; G.masteryData[NEW + "_custom_items"] = []; G.masteryData[NEW + "_settings"] = {};
  G.masteryData[LATE] = [{ id: "d1", subject: H, prompt: "Civil War", answer: VD["civil war"], status: "active", tier: "weekly", review_mode: "flip" },
    { id: "d2", subject: H, prompt: "Ellis Island", answer: VD["ellis island"], status: "introduction", tier: "daily", review_mode: "flip" }];
}
function world(o) {
  o = o || {};
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry, masteryData: {}, currData: { subjects: {}, done: {} }, unitStudies: {},
    window: o.window || WIN, lazy: [], tab: "units", redraws: 0 };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); },
    transaction(fn) { const v = fn(null); G.writes.push(["transaction", p, JSON.parse(JSON.stringify(v))]); return Promise.resolve({ committed: true }); } }; } };
  const w = new Function("G", "db", "BANKS", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; const window=G.window; const tab=G.tab;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } function _mastRe(){ G.redraws++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function haLazyReady(name){ return !!window["_haLazy_"+name]; }
    function haLazyLoad(name){ G.lazy.push(name); return G.lazyLoad?G.lazyLoad(name):Promise.reject(new Error("no loader")); }
    let masteryKid="${KID}"; const MAST_BANK_MAP=BANKS; ${VOCAB}
    ${MATH}
    ${GATE}
    ${block}
    ${VOCAB_GEO}
    return { STARTER_UNITS, STARTER_HOWTO, US_PATH_SHIP, US_PATH_STAGES, US_PATH_STAGE_CARDS, usUnitRecord, usHydrate, usHydrateAll, usLazyWant, usAdoptSpec, uaSpec, uaLocked,
      uaPlanAttach, uaApplyAttach, uaAttachOpen, uaAttachHtml, _unitStageRowsHtml, _starterUnitsHtml, unitStageStatus, unitStageMoveUp, unitStageFormOpen, unitStageFormSet,
      unitStageEnroll, mastFullBank, mastGetDef, MAST_VOCAB_DEFS, MAST_MATH_ANS, geoUnitRecord, suPending, suPlan, get view(){ return uaAttachView; } };`)(G, db,
    { [KID]: { [H]: BUILT.slice(), Vocabulary: ["harbor"] }, [LISTONLY]: { [H]: BUILT.slice() }, [NEW]: {}, [LATE]: { [H]: BUILT.slice() } });
  fixture(G);
  if (!o.noUnit) { const u = o.copy || w.STARTER_UNITS.us_path(); u.addedTs = 1; G.unitStudies[UNIT] = u; w.u = u; }
  w.G = G; return w;
}
const deck = (u, k) => u.decks.find(d => d.key === k);
const snap = (G, k) => JSON.stringify([G.masteryData[k], G.masteryData[k + "_custom_items"], G.masteryData[k + "_settings"]]);
const tick = () => new Promise(r => setImmediate(r));
const flush = async () => { for (let i = 0; i < 10; i++) await tick(); };

(async () => {
console.log("── what ships ──");
const w0 = world(), U = w0.u;
ok("version 3, Stages 1–9 (the citizen's test, Stage 10, comes with USCIVTEST)", w0.US_PATH_SHIP.ver === 3 && w0.US_PATH_SHIP.stages.join() === "1,2,3,4,5,6,7,8,9");
{ const s = world({ window: {}, noUnit: true }).STARTER_UNITS.us_path();
  ok("the shell (before us.js): 9 stages, 246 cards", s._shell && s.stages.map(x => x.n).join() === "1,2,3,4,5,6,7,8,9" && s.cardCount === 246);
  ok("the shell's labels, readyAt and per-stage counts are us.js's", JSON.stringify(w0.US_PATH_STAGES.map(x => [x.n, x.label, x.readyAt || 0])) === JSON.stringify(L.stages.filter(x => x.n <= 9).map(x => [x.n, x.label, x.readyAt || 0])) &&
    [1, 2, 3, 4, 5, 6, 7, 8, 9].every(n => w0.US_PATH_STAGE_CARDS[n] === L.cards.filter(c => c.stage === n).length));
  ok("the Starter units list names all nine stages and “246 cards”", /5\. Colonies, Revolution &amp; Constitution · 6\. The Bill of Rights &amp; all 27 amendments · 7\. Presidents in order · 8\. A growing nation &amp; the Civil War · 9\. America in the world, 1865–today/.test(world({ window: {}, noUnit: true })._starterUnitsHtml()) && /246 cards/.test(world({ window: {}, noUnit: true })._starterUnitsHtml())); }
ok("the description: the colonies, the amendments, the Civil War are here now; only the citizen's test comes later", /the 13 colonies and the founding, all 27 amendments/.test(U.desc) && /Civil War/.test(U.desc) && /citizen's test comes later/.test(U.desc));
ok("How-to notes for the four new decks, each fits the 240-character box", ["13 Colonies", H, "American Battles", "Amendments"].every(k => { const t = w0.STARTER_HOWTO[k]; return t && t.main.length > 60 && t.main.length <= 240 && t.kid; }));

console.log("── the record ──");
const DECKS = [["American Symbols", "flash", 11], ["American Holidays", "flash", 11], ["Famous Presidents", "flash", 5], ["Famous Americans", "flip", 30], ["Civics", "flip", 33],
  ["13 Colonies", "flash", 13], [H, "flip", 48], ["American Battles", "flip", 25], ["Amendments", "flip", 23], ["Presidents", "flip", 47]];
ok("ten decks with the plan's modes and counts = 246 (the Civics Test waits)", JSON.stringify(U.decks.map(d => [d.key, d.mode, d.cards.length])) === JSON.stringify(DECKS) && U.decks.reduce((t, d) => t + d.cards.length, 0) === 246);
const per = n => { const o = {}; U.decks.forEach(d => d.cards.forEach(c => { if (c.stage === n) o[d.key] = (o[d.key] || 0) + 1; })); return o; };
ok("Stage 5 = 37: 13 Colonies 13 · U.S. History 10 · Famous Americans 6 · American Battles 8", JSON.stringify(per(5)) === JSON.stringify({ "Famous Americans": 6, "13 Colonies": 13, [H]: 10, "American Battles": 8 }));
ok("Stage 6 = 30: Amendments 23 · U.S. History 4 (13th, 14th, 15th, 19th) · Civics 3", JSON.stringify(per(6)) === JSON.stringify({ Civics: 3, [H]: 4, Amendments: 23 }) && deck(U, H).cards.filter(c => c.stage === 6).map(c => c.name).join() === "13th Amendment,14th Amendment,15th Amendment,19th Amendment");
ok("Stage 8 = 25: U.S. History 16 · American Battles 9; Stage 9 = 26: U.S. History 18 · American Battles 8", JSON.stringify(per(8)) === JSON.stringify({ [H]: 16, "American Battles": 9 }) && JSON.stringify(per(9)) === JSON.stringify({ [H]: 18, "American Battles": 8 }));
ok("readyAt 33 · 26 · 22 · 23 for Stages 5 · 6 · 8 · 9", [[5, 33], [6, 26], [8, 22], [9, 23]].every(([n, r]) => U.stages.find(s => s.n === n).readyAt === r));
ok("every card is us.js's byte for byte and holds only name, family, stage, order (and a back)", U.decks.every(d => d.cards.every(c => { const k = L.card(d.key, c.name); return k && k.family === c.family && k.stage === c.stage && k.order === c.order && (k.def == null ? c.def === undefined : k.def === c.def) && Object.keys(c).every(x => ["name", "family", "stage", "order", "def"].includes(x)); })));
ok("the U.S. History deck holds all 20 built-in names, each back the built-in's byte for byte", BUILT.every(n => { const c = deck(U, H).cards.find(x => x.name === n); return c && c.def === VD[n.toLowerCase()]; }));
ok("13 Colonies: “<name> Colony” fronts, flash (no back), New England 4 · Middle 4 · Southern 5 with North Carolina first", deck(U, "13 Colonies").cards.every(c => / Colony$/.test(c.name) && c.def === undefined) &&
  deck(U, "13 Colonies").cards.filter(c => c.family === "Southern")[0].name === "North Carolina Colony" && ["New England", "Middle", "Southern"].map(f => deck(U, "13 Colonies").cards.filter(c => c.family === f).length).join() === "4,4,5");
ok("the record holds no picture (< 48 KB)", !/data:|<svg|imageUrl/.test(JSON.stringify(U)) && JSON.stringify(U).length < 48000, JSON.stringify(U).length);

console.log("── no card can show another deck's answer ──");
{ const names = U.decks.flatMap(d => d.cards.map(c => [d.key, c.name, c.def]));
  const vocabHit = names.filter(([, n]) => w0.MAST_VOCAB_DEFS[n.toLowerCase()] != null);
  ok("no shipped card name is a built-in back's key — except the 20 built-ins, whose back IS the path's", vocabHit.length === 20 && vocabHit.every(([k, n, d]) => k === H && BUILT.includes(n) && w0.MAST_VOCAB_DEFS[n.toLowerCase()] === d), vocabHit.filter(([k, n]) => !BUILT.includes(n)).map(x => x[1]));
  ok("no shipped card name is a math fact", names.every(([, n]) => w0.MAST_MATH_ANS[n] == null));
  const geoNames = new Set(w0.geoUnitRecord("North Carolina").decks.flatMap(d => d.cards.map(c => c.name)));
  ok("no shipped card name is a Geography Path card (their backs share the kid's definitions map)", names.every(([, n]) => !geoNames.has(n)), names.filter(([, n]) => geoNames.has(n)).map(x => x[1]));
  const others = Object.keys(w0.STARTER_UNITS).filter(id => id !== UNIT).flatMap(id => { try { const r = w0.STARTER_UNITS[id](); return (r.decks || []).flatMap(d => (d.cards || []).filter(c => c.def != null).map(c => c.name)); } catch (e) { return []; } });
  ok("no shipped card name is another starter unit's card with a back", names.every(([, n]) => !others.includes(n)), names.filter(([, n]) => others.includes(n)).map(x => x[1]));
  ok("no front repeats across the unit's decks", new Set(names.map(x => x[1])).size === names.length);
  ok("the old trap is shut: “North Carolina” IS a capital key (Raleigh), “North Carolina Colony” gives no back anywhere", w0.MAST_VOCAB_DEFS["north carolina"] === "Raleigh" && deck(U, "13 Colonies").cards.every(c => w0.mastGetDef(NEW, c.name, "13 Colonies") === ""));
  ok("with nothing saved, a built-in card's back is still the path's (MAST_VOCAB_DEFS), and every other flip card's is empty until the enroll saves it", BUILT.every(n => w0.mastGetDef(NEW, n, H) === VD[n.toLowerCase()]) &&
    names.filter(([k, n, d]) => d != null && !BUILT.includes(n)).every(([k, n]) => w0.mastGetDef(NEW, n, k) === "")); }

console.log("── pictures ──");
{ const u = JSON.parse(JSON.stringify(U)); w0.usHydrate(u, L);
  ok("geo.js and both photo files in → every one of the 246 cards gets {svg, credit}", Object.keys(u.visuals).length === 246 && Object.values(u.visuals).every(v => typeof v.svg === "string" && v.credit.length > 5), U.decks.flatMap(d => d.cards.filter(c => !u.visuals[d.key + "_" + c.name]).map(c => d.key + "_" + c.name)));
  ok("a colony is a map (SVG) lit by its STATE name — North Carolina Colony in the Southern orange", /^data:image\/svg\+xml/.test(u.visuals["13 Colonies_North Carolina Colony"].svg) && /E69F00/.test(decodeURIComponent(u.visuals["13 Colonies_North Carolina Colony"].svg)));
  ok("battles are map pins, amendments drawn icons, history photos JPEG", /^data:image\/svg/.test(u.visuals["American Battles_Yorktown"].svg) && /^data:image\/svg/.test(u.visuals["Amendments_1st Amendment"].svg) && /^data:image\/jpeg/.test(u.visuals[H + "_Jamestown"].svg));
  const nogeo = loadAll({ geo: false }).HoweUS, v = JSON.parse(JSON.stringify(U)); w0.usHydrate(v, nogeo);
  ok("before geo.js: the 53 map cards (13 colonies, 25 battles, 15 war / event pins) wait — the unit emoji — and nothing breaks", Object.keys(v.visuals).length === 246 - 53 && U.decks.every(d => d.cards.every(c => !!v.visuals[d.key + "_" + c.name] === !/^(colony|pin):/.test(L.pic(d.key, c.name))))); }
ok("the family's record asks for both photo files and geo.js", world({ window: {} }).usLazyWant([U], L).sort().join() === "geo,us_pics_1,us_pics_2");
{ const win = {}, w = world({ window: win, noUnit: true }); w.G.unitStudies[UNIT] = JSON.parse(JSON.stringify(U)); const loads = {};
  w.G.lazyLoad = n => new Promise(r => { loads[n] = r; });
  w.usHydrateAll();
  const ctx = { window: win, module: undefined, console }; vm.createContext(ctx); vm.runInContext(usSrc, ctx); loads.us(true); await flush();
  ok("usHydrateAll: us.js, then the two photo files and geo.js together", w.G.lazy.join() === "us,us_pics_1,us_pics_2,geo");
  vm.runInContext(p1Src, ctx); vm.runInContext(p2Src, ctx); vm.runInContext(geoSrc, ctx); loads.us_pics_1(true); loads.us_pics_2(true); loads.geo(true); await flush();
  ok("…all three in → all 246 pictures, maps included", Object.keys(w.G.unitStudies[UNIT].visuals).length === 246 && /^data:image\/svg/.test(w.G.unitStudies[UNIT].visuals["13 Colonies_Georgia Colony"].svg)); }

console.log("── a kid with live U.S. History cards: hooked up, not enrolled ──");
{ const w = world(), G = w.G, before = snap(G, KID);
  const sp = w.uaSpec(w.u, KID);
  ok("the hook-up row is data-driven: Stage 5 (Jamestown is the lowest live path card), fill, strays OK, later kept, backs, newDeckStyle", sp && sp.stage === 5 && sp.fill && sp.strayOk && sp.keepLater && sp.backs && sp.newDeckStyle && JSON.stringify(sp.alsoDecks) === JSON.stringify([H]));
  ok("the stock “+ Kid” is closed for that kid only", w.uaLocked(w.u, KID) && !w.uaLocked(w.u, NEW) && !w.uaLocked(w.u, LISTONLY) && w.usAdoptSpec(w.u, NEW) === null && w.usAdoptSpec(w.u, LISTONLY) === null);
  w.unitStageFormOpen(UNIT, KID); w.unitStageEnroll();
  ok("…so the Start form / enroll writes nothing for that kid", G.writes.length === 0 && snap(G, KID) === before);
  const P = w.uaPlanAttach(UNIT, KID, 7), S = P.sum, paths = P.writes.map(x => x.path);
  ok("the plan is ok: 6 live stage-5 cards kept, 7 later ones kept, Mom's “Pony Express” a stray left alone", P.ok && S.liveKept === 6 && S.later === 7 && JSON.stringify(S.stray) === JSON.stringify([H + " · Pony Express"]), S);
  ok("ZERO card writes: nothing under mastery/kida itself, no cat_modes or intro cap for U.S. History, no back for the 20", paths.every(p => !/^mastery\/kida(\/|$)/.test(p)) && !paths.some(p => /\/(cat_modes|cat_intro_max|cat_instructions(_kid)?)\/U_S_ History$|\/(cat_modes|cat_intro_max)\/U\.S\. History$/.test(p)) &&
    !paths.some(p => /definitions\//.test(p) && BUILT.some(n => p.endsWith("/" + n))), paths);
  ok("enrolled + kidStage (stage 5, via attach)", P.writes[0].path === "unitStudies/us_path/enrolled/kida" && P.writes[1].path === "unitStudies/us_path/kidStage/kida" && P.writes[1].value.stage === 5 && P.writes[1].value.via === "attach");
  const adds = P.writes.filter(x => /^mastery\/kida_custom_items\/\d+$/.test(x.path)).map(x => x.value);
  ok("appends the 31 stage-5 words their list lacks (4 U.S. History, 13 colonies, 6 founders, 8 battles) after what's there — none of the 6 built-ins", adds.length === 31 &&
    JSON.stringify(adds.filter(x => x.cat === H).map(x => x.name)) === JSON.stringify(["French and Indian War", "Stamp Act", "Revolutionary War", "Articles of Confederation"]) &&
    adds.filter(x => x.cat === "13 Colonies").length === 13 && adds.filter(x => x.cat === "Famous Americans").length === 6 && adds.filter(x => x.cat === "American Battles").length === 8 &&
    P.writes.filter(x => /^mastery\/kida_custom_items\//.test(x.path))[0].path === "mastery/kida_custom_items/2" && adds.every(x => Object.keys(x).join() === "cat,name"));
  const defs = P.writes.filter(x => /^mastery\/kida_settings\/definitions\//.test(x.path));
  ok("saves the 18 backs the new flip words need (4 history, 6 founders, 8 battles) — none for colonies, none for a built-in", defs.length === 18 && S.backsAdded.length === 18);
  const style = P.writes.filter(x => /_settings\/(cat_modes|cat_intro_max|cat_instructions|cat_instructions_kid)\//.test(x.path));
  ok("newDeckStyle: the three decks new to the kid get their style — 13 Colonies flash 3, Famous Americans flip 2, American Battles flip 3 — and their How-to", JSON.stringify(S.styled) === JSON.stringify(["Famous Americans", "13 Colonies", "American Battles"]) &&
    style.length === 12 && style.filter(x => /cat_modes/.test(x.path)).map(x => x.path.split("/").pop() + ":" + x.value).join() === "Famous Americans:flip,13 Colonies:flash,American Battles:flip" &&
    style.filter(x => /cat_intro_max/.test(x.path)).map(x => x.value).join() === "2,3,3", style.map(x => x.path));
  ok("nothing else is written (enrolled, kidStage, 31 appends, 18 backs, 12 style)", P.writes.length === 2 + 31 + 18 + 12, P.writes.length);
  ok("her own wording on Jamestown is kept and shown", S.backDiffers.length === 1 && /^Jamestown: /.test(S.backDiffers[0]));
  w.uaAttachOpen(UNIT, KID); const html = w.uaAttachHtml(w.u, KID, x => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;"), () => "");
  ok("the plan Mom reads says the new decks get the path's style and the decks she has keep theirs", /New to Kida: <b>Famous Americans, 13 Colonies, American Battles<\/b>/.test(html) && /the card style and start count of every deck Kida already has/.test(html) && /7 cards from later stages/.test(html));
  ok("the path's-order checkbox is offered (nothing written unless she ticks it)", Array.isArray(S.reorderable) && !paths.some(p => /_bank_order/.test(p)));
  G.writes.length = 0; w.uaApplyAttach(w.view.plan); await flush();
  ok("Yes → ONE multi-path update of exactly the plan", G.writes.length === 1 && JSON.stringify(Object.keys(G.writes[0][2])) === JSON.stringify(paths));
  const it = G.masteryData[KID];
  ok("after: every live card byte-identical, the kid at Stage 5 · 6 of 37 on the ladder", JSON.stringify(it) === JSON.stringify(JSON.parse(before)[0]) && (s => s.stage === 5 && s.total === 37 && s.on === 6)(w.unitStageStatus(w.u, KID)));
  ok("…and no name twice in their U.S. History list", (l => l.length === new Set(l).size && l.length === 20 + 4 + 1)(w.mastFullBank(KID)[H])); }
{ const w = world({ dry: true }); const P = w.uaPlanAttach(UNIT, KID, 7); w.uaAttachOpen(UNIT, KID); w.uaApplyAttach(w.view.plan); await flush();
  ok("dry run: the plan shows, Yes writes nothing", P.ok && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.uaApplyAttach(w.uaPlanAttach(UNIT, KID, 7)); ok("not Mom: nothing written", w.G.writes.length === 0); }
{ const w = world();
  ok("a kid whose only live U.S. History cards are later (Civil War, Ellis Island) hooks up at Stage 8", w.uaSpec(w.u, LATE).stage === 8 && w.uaPlanAttach(UNIT, LATE, 7).ok); }
{ const w = world({ copy: world().usUnitRecord(null, { ver: 2, stages: [1, 2, 3, 4, 7] }) });
  const P = w.uaPlanAttach(UNIT, KID, 7);
  ok("a family copy from before this slice: no hook-up yet, the plan says to add the new stages first, and the stock enroll stays closed", !P.ok && /Add the new stages/.test(P.why) && w.uaLocked(w.u, KID) && P.writes.length === 0); }

console.log("── a kid with the built-in list but no live card: the stock enroll ──");
{ const w = world(); w.unitStageFormOpen(UNIT, LISTONLY); w.unitStageFormSet("stage", "5"); w.unitStageEnroll();
  const it = w.G.masteryData[LISTONLY], st = w.G.masteryData[LISTONLY + "_settings"];
  ok("Stage 5: the first of each deck learning — 2 founders, 3 colonies, 3 history events, 3 battles", JSON.stringify(it.map(i => i.subject + ":" + i.prompt)) === JSON.stringify(["Famous Americans:Alexander Hamilton", "Famous Americans:John Hancock",
    "13 Colonies:New Hampshire Colony", "13 Colonies:Massachusetts Colony", "13 Colonies:Rhode Island Colony", H + ":Jamestown", H + ":Plymouth Colony", H + ":French and Indian War",
    "American Battles:Lexington and Concord", "American Battles:Bunker Hill", "American Battles:Moores Creek Bridge"]), it.map(i => i.subject + ":" + i.prompt));
  ok("no name twice in their U.S. History list (the built-in 20 + the 4 new)", (l => l.length === new Set(l).size && l.length === 24)(w.mastFullBank(LISTONLY)[H]));
  ok("styles: colonies flash, the rest flip; the colonies get no back", st.cat_modes["13 Colonies"] === "flash" && st.cat_modes[H] === "flip" && st.cat_modes["American Battles"] === "flip" && st.cat_modes["Famous Americans"] === "flip" && deck(w.u, "13 Colonies").cards.every(c => st.definitions[c.name] === undefined));
  ok("a built-in's saved back is the built-in's own, byte for byte", BUILT.slice(0, 6).every(n => st.definitions[n] == null || st.definitions[n] === VD[n.toLowerCase()])); }
{ const w = world(); w.unitStageFormOpen(UNIT, NEW); w.unitStageFormSet("stage", "4"); w.unitStageEnroll();
  const it = w.G.masteryData[NEW]; it.forEach(i => { i.status = "active"; i.tier = "weekly"; }); (w.G.masteryData[NEW + "_custom_items"] || []).forEach((c, i) => { if (!it.some(x => x.subject === c.cat && x.prompt === c.name)) it.push({ id: "n" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); });
  const s = w.unitStageStatus(w.u, NEW);
  ok("a kid on Stage 4: ➡ now goes to Stage 5 (then 6, 7, 8, 9)", s.ready && s.next.n === 5 && /➡ Start Stage 5: Colonies, Revolution &amp; Constitution/.test(w._unitStageRowsHtml(w.u, [NEW])));
  w.unitStageMoveUp(UNIT, NEW);
  ok("➡ Stage 5 seeds only Stage 5's four decks", w.G.masteryData[NEW].filter(i => i.status === "introduction").every(i => ["Famous Americans", "13 Colonies", H, "American Battles"].includes(i.subject)) && w.unitStageStatus(w.u, NEW).stage === 5 && w.unitStageStatus(w.u, NEW).next.n === 6); }
{ const w = world({ dry: true }); w.unitStageFormOpen(UNIT, NEW); w.unitStageFormSet("stage", "5"); w.unitStageEnroll(); ok("dry run: the stock enroll writes nothing", w.G.writes.length === 0); }

console.log("── STARTERUP: families on version 1 or 2 ──");
for (const [ver, ship, cards, stages] of [[2, { ver: 2, stages: [1, 2, 3, 4, 7] }, 118, 4], [1, { ver: 1, upTo: 4 }, 165, 5]]) {
  const w = world({ copy: world().usUnitRecord(null, ship) });
  w.u.enrolled = { [NEW]: true }; w.u.kidStage = { [NEW]: { stage: ver === 2 ? 7 : 4, knows: "", ts: 1 } };
  w.G.masteryData[NEW + "_custom_items"] = deck(w.u, "Civics").cards.map(c => ({ cat: "Civics", name: c.name }));
  const pend = w.suPending(w.u);
  ok("version " + ver + " copy → the row: " + cards + " new cards, " + stages + " new stages", pend && pend.cards === cards && pend.stages === stages, pend);
  const P = w.suPlan(UNIT, 1), paths = P.writes.map(x => x.path);
  ok("version " + ver + ": the plan only adds — four new decks whole, 6 founders and 3 Civics words at new indexes, the stages, version 3", ["13 Colonies", H, "American Battles", "Amendments"].every(k => P.writes.some(x => /^unitStudies\/us_path\/decks\/\d+$/.test(x.path) && x.value.key === k)) &&
    P.writes.filter(x => /^unitStudies\/us_path\/decks\/3\/cards\/\d+$/.test(x.path)).length === 6 && P.writes.filter(x => /^unitStudies\/us_path\/decks\/4\/cards\/\d+$/.test(x.path)).length === 3 &&
    P.writes.some(x => x.path === "unitStudies/us_path/starterVer" && x.value === 3) && paths.every(p => !/kidStage|enrolled|visuals|^mastery\//.test(p)), paths);
  ok("version " + ver + ": the kid gets no card from it", P.sum.kids.every(k => !Object.keys(k.added || {}).length)); }
{ const w = world({ copy: world().usUnitRecord(null, { ver: 2, stages: [1, 2, 3, 4, 7] }) });
  const after = JSON.parse(JSON.stringify(w.u)); w.u.kidStage = { [NEW]: { stage: 7, ts: 1 } }; after.kidStage = w.u.kidStage;
  w.suPlan(UNIT, 1).writes.forEach(x => { const p = x.path.replace("unitStudies/us_path/", "").split("/"); let o = after; p.slice(0, -1).forEach(k => o = o[k]); o[p[p.length - 1]] = x.value; });
  ok("once added, the copy is current; a kid already on Stage 7 goes ➡ 8 (5–6 aren't offered by ➡ — Mom places them)", w.suPending(after) === null && w.unitStageStatus(after, NEW).next.n === 8); }
{ const w = world(); ok("a family on version 3 sees no row", w.suPending(w.u) === null); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
