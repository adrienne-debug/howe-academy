// 🎩 United States Path — slice 3 USPRES: Stage 7 "Presidents in order" (PLAN_us_unit_2026-11-16.md §5 Stage 7, §9 row 3, Appendix G;
// her approval 2026-11-17: "great on the us", "buil the us"). Runs the real STARTER_UNITS block (USPATH + USPRES + UNIT_STAGES +
// STARTERUP + ENVUNIT's envHydrateAll) with the real us.js / us_pics_1.js / us_pics_2.js and notebooks.js's presidents list:
//  · the code ships Stages 1–4 and 7 at version 2; the shell says "7. Presidents in order", 128 cards;
//  · the Presidents deck: 47 flip cards "1st President" … "47th President" once each, in order, eight eras in order, backs
//    "name · years · fact" with notebooks.js's names and years; Cleveland and Trump two numbers each, one portrait string each;
//  · a kid placed at Stage 7 → 1st–3rd learning, the 47 in the bank, the 47 backs saved; a kid on Stage 4 → ➡ Stage 7;
//  · a family that added version 1 (Stages 1–4) → "＋ Add the new stages": 47 cards, 1 stage — the Presidents deck whole,
//    Stage 7 and the version, nothing else; no kid gets a card until ➡;
//  · pictures: all 47 photos with credits, from both photo files; no name collides with another deck's back.
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nb = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const usSrc = fs.readFileSync(path.join(__dirname, "us.js"), "utf8"), p1Src = fs.readFileSync(path.join(__dirname, "us_pics_1.js"), "utf8"), p2Src = fs.readFileSync(path.join(__dirname, "us_pics_2.js"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  " + JSON.stringify(extra).slice(0, 500) : "")); } }
function lit(s, start, open, close) { const i = s.indexOf(start); if (i < 0) return null; let j = s.indexOf(open, i), d = 0, q = null;
  for (let k = j; k < s.length; k++) { const c = s[k]; if (q) { if (c === "\\") { k++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; } if (c === open) d++; else if (c === close) { d--; if (!d) return s.slice(j, k + 1); } } return null; }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const u0 = src.indexOf("// USPATH_START"), u1 = src.indexOf("// USPATH_END");
const p0 = src.indexOf("// USPRES_START"), p1 = src.indexOf("// USPRES_END");
ok("USPRES block once, inside the USPATH block", p0 > u0 && p1 > p0 && p1 < u1 && u1 < b && src.indexOf("// USPRES_START", p0 + 1) < 0);
const block = src.slice(a, b);
const sliceFn = (name) => { const s = src.indexOf("function " + name + "("); const e = src.indexOf("\n}\n", s); return src.slice(s, e + 3); };
const portraitLine = (() => { const s = src.indexOf("function _unitPortrait("); return src.slice(s, src.indexOf("\n", s) + 1); })();
const unitpic = src.slice(src.indexOf("// UNITPIC_START"), src.indexOf("// UNITPIC_END"));
const drawn = src.slice(src.indexOf("// UNITDRAWN_START"), src.indexOf("// UNITDRAWN_END"));
const picsCode = portraitLine + "\n" + unitpic + "\n" + sliceFn("mastGetVisual") + "\n" + drawn;
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();
const MATH = src.slice(src.indexOf("const MAST_MATH_ANS={"), src.indexOf("};", src.indexOf("const MAST_MATH_ANS={")) + 2);
const GETDEF = sliceFn("mastGetDef");
const NBP = JSON.parse(lit(nb, "var LN_EXTRA = ", "{", "}")).enrich.presidents;   // [["1st","George Washington","1789–1797","…"], …]
const ERAS = [["Founders", 1, 5], ["A growing nation", 6, 12], ["Toward war", 13, 17], ["Rebuilding and the Gilded Age", 18, 25], ["A new century", 26, 31],
  ["Depression, war and the Cold War", 32, 37], ["Into a new century", 38, 43], ["Today", 44, 47]];
const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));

function loadUS(pics, win) {   // us.js and the photo files, the browser's way, into one window
  win = win || {}; const ctx = { window: win, module: undefined, console }; vm.createContext(ctx);
  if (pics >= 1) vm.runInContext(p1Src, ctx); if (pics >= 2) vm.runInContext(p2Src, ctx);
  vm.runInContext(usSrc, ctx); return win;
}
function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, currData: { subjects: {} }, writes: [], dry: !!o.dry, unitStudies: {}, content: { innerHTML: "" },
    window: o.window || {}, lazy: [], tab: "units", redraws: 0 };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const v = fn(null); G.writes.push(["transaction", p, JSON.parse(JSON.stringify(v))]); return Promise.resolve({ committed: true }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; let masteryKid="kid"; const tab=G.tab;
    const window=G.window;
    function momHere(){ return true; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.redraws++; } function _mastRe(){ G.redraws++; } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    function haLazyReady(name){ return !!window["_haLazy_"+name]; }
    function haLazyLoad(name){ G.lazy.push(name); return G.lazyLoad?G.lazyLoad(name):Promise.reject(new Error("no loader")); }
    ${VOCAB}
    ${MATH}
    ${block}
    ${VOCAB_GEO}
    ${picsCode}
    ${GETDEF}
    return { STARTER_UNITS, STARTER_HOWTO, US_PATH_SHIP, US_PATH_STAGES, US_PATH_STAGE_CARDS, usUnitRecord, usHydrate, usLazyWant, _starterUnitsHtml,
      unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp, _unitStageRowsHtml, unitCardFace, mastGetVisual,
      mastGetDef, MAST_VOCAB_DEFS, MAST_MATH_ANS, geoUnitRecord, suPending, suPlan };`)(G, db);
  api.G = G; return api;
}
const deck = (u, k) => u.decks.find(d => d.key === k);
const items = (w, k) => w.G.masteryData[k] || [];
const bank = (w, k) => w.G.masteryData[k + "_custom_items"] || [];
const allOn = (w, k) => { const it = items(w, k); it.forEach(i => { i.status = "active"; i.tier = "weekly"; });
  bank(w, k).forEach((c, i) => { if (!it.some(x => x.subject === c.cat && x.prompt === c.name)) it.push({ id: "z" + k + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); }); };
const W2 = loadUS(2), L = W2.HoweUS;

console.log("── what ships ──");
{ const w = world();
  ok("version 2, Stages 1–4 and 7 (5–6 wait for USHIST)", w.US_PATH_SHIP.ver === 2 && w.US_PATH_SHIP.stages.join() === "1,2,3,4,7");
  const s = w.STARTER_UNITS.us_path();
  ok("the shell (before us.js) lists Stage 7, 128 cards", s._shell && s.stages.map(x => x.n).join() === "1,2,3,4,7" && s.cardCount === 128 && w.US_PATH_STAGE_CARDS[7] === 47);
  ok("the shell's Stage 7 is us.js's (label, readyAt 42)", JSON.stringify(s.stages[4]) === JSON.stringify({ n: 7, label: "Presidents in order", weeklyFrom: 0, readyAt: 42 }) && L.stages.find(x => x.n === 7).readyAt === 42 && L.stages.find(x => x.n === 7).label === "Presidents in order");
  ok("the Starter units list: “… · 4. How our government works · 7. Presidents in order” and “128 cards”", /4\. How our government works · 7\. Presidents in order/.test(w._starterUnitsHtml()) && /128 cards/.test(w._starterUnitsHtml()));
  ok("the description now names every president in order among what's here", /how our government works, and every president in order/.test(s.desc) && !/Later stages bring[^.]*president/.test(s.desc));
  const H = w.STARTER_HOWTO.Presidents, names = NBP.map(p => p[1]);
  ok("a How-to note for Presidents (Mom's and the kid's), naming no president — the app never gives the answer", H && H.main.length > 60 && H.kid && names.every(n => { const last = n.split(" ").pop(); return [H.main, H.kid].every(t => t.indexOf(n) < 0 && t.indexOf(last) < 0); }), names.filter(n => (H.main + H.kid).indexOf(n.split(" ").pop()) >= 0));
  ok("Famous Presidents keeps the “president now” note (Mom changes that card when it changes)", /president now/.test(w.STARTER_HOWTO["Famous Presidents"].main)); }

console.log("── the Presidents deck ──");
const w0 = world({ window: W2 }), U = w0.STARTER_UNITS.us_path(), P = deck(U, "Presidents");
ok("the record: version 2, stages 1·2·3·4·7, six decks (Presidents last), 128 cards", U.starterVer === 2 && U.stages.map(s => s.n).join() === "1,2,3,4,7" && U.decks.map(d => d.key).join() === "American Symbols,American Holidays,Famous Presidents,Famous Americans,Civics,Presidents" && U.decks.reduce((t, d) => t + d.cards.length, 0) === 128);
ok("Presidents: flip, 3 at a time, by family, 47 cards, all Stage 7", P.mode === "flip" && P.introCap === 3 && P.groupBy === "family" && P.cards.length === 47 && P.cards.every(c => c.stage === 7));
ok("“1st President” … “47th President”, each once, in path order", P.cards.every((c, i) => c.name === ord(i + 1) + " President") && new Set(P.cards.map(c => c.name)).size === 47 && P.cards.every((c, i) => !i || c.order > P.cards[i - 1].order));
ok("the eight eras in order: Founders 1–5 … Today 44–47", ERAS.every(([f, x, y]) => P.cards.filter(c => c.family === f).map(c => parseInt(c.name, 10)).join() === Array.from({ length: y - x + 1 }, (_, i) => x + i).join()) && [...new Set(P.cards.map(c => c.family))].join("|") === ERAS.map(e => e[0]).join("|"));
ok("each back is “name · years · fact”, the name and years exactly notebooks.js's", NBP.length === 47 && P.cards.every((c, i) => c.def.startsWith(NBP[i][1] + " · " + NBP[i][2] + " · ") && c.def.length > NBP[i][1].length + NBP[i][2].length + 12), P.cards.filter((c, i) => !c.def.startsWith(NBP[i][1] + " · " + NBP[i][2] + " · ")).map(c => c.name));
ok("each card is us.js's byte for byte, and holds only name, family, stage, order, back (no 6th–8th line, no picture spec)", P.cards.every(c => { const k = L.card("Presidents", c.name); return k && k.def === c.def && k.order === c.order && k.family === c.family && Object.keys(c).join() === "name,family,stage,order,def"; }));
ok("Grover Cleveland is the 22nd and the 24th, Donald Trump the 45th and the 47th — two cards each, each back its own term", ["22nd", "24th"].every(n => deck(U, "Presidents").cards.find(c => c.name === n + " President").def.startsWith("Grover Cleveland · ")) &&
  ["45th", "47th"].every(n => P.cards.find(c => c.name === n + " President").def.startsWith("Donald Trump · ")) && P.cards[21].def !== P.cards[23].def && P.cards[44].def !== P.cards[46].def);
ok("no other name is on two cards", (() => { const n = P.cards.map(c => c.def.split(" · ")[0]); return n.filter((x, i) => n.indexOf(x) !== i).sort().join() === "Donald Trump,Grover Cleveland"; })());
ok("the record still holds no picture (< 24 KB)", !/data:|<svg|imageUrl/.test(JSON.stringify(U)) && JSON.stringify(U).length < 24000, JSON.stringify(U).length);

console.log("── pictures ──");
{ const u = JSON.parse(JSON.stringify(U)); w0.usHydrate(u);
  const V = k => (u.visuals["Presidents_" + k + " President"] || {});
  ok("all 47 presidents get a photo (JPEG) with its credit and licence — in memory", P.cards.every(c => { const v = u.visuals["Presidents_" + c.name]; return v && /^data:image\/jpeg;base64,/.test(v.svg) && /(Public domain|CC0|CC BY)/i.test(v.credit); }), P.cards.filter(c => !(u.visuals["Presidents_" + c.name] || {}).svg).map(c => c.name));
  ok("Cleveland's two cards and Trump's two cards each show ONE portrait string (the memo), and differ from each other", V("22nd").svg === V("24th").svg && V("45th").svg === V("47th").svg && V("22nd").svg !== V("45th").svg);
  ok("the Stage 2 faces are the Stage 7 faces (Washington 1st, Lincoln 16th, Trump 47th)", u.visuals["Famous Presidents_George Washington"].svg === V("1st").svg && u.visuals["Famous Presidents_Abraham Lincoln"].svg === V("16th").svg && u.visuals["Famous Presidents_Donald Trump"].svg === V("47th").svg);
  ok("47 different men → 45 different portraits", new Set(P.cards.map(c => u.visuals["Presidents_" + c.name].svg)).size === 45);
  ok("the Units tile / card sheet shows the portrait on every president card", P.cards.every(c => { const f = w0.unitCardFace(u, "Presidents", c.name); return f && f.img && !f.emoji; }));
  ok("the drill / Study picture resolves too (mastGetVisual)", (() => { w0.G.unitStudies.us_path = u; const v = w0.mastGetVisual("Presidents", "16th President"); return v && /^data:image\/jpeg/.test(v.svg); })());
  ok("with only us_pics_1.js, the five Stage-2 faces' numbers show (1st, 3rd, 16th, 26th, 45th, 47th); the rest wait for us_pics_2.js", (() => { const L1 = loadUS(1).HoweUS, x = JSON.parse(JSON.stringify(U)); w0.usHydrate(x, L1);
    return P.cards.filter(c => x.visuals["Presidents_" + c.name]).map(c => parseInt(c.name, 10)).join() === "1,3,16,26,45,47"; })());
  ok("a family with the unit now fetches both photo files, and still no geo.js", world({ window: {} }).usLazyWant([U], L).sort().join() === "us_pics_1,us_pics_2"); }

console.log("── a kid placed at Stage 7 ──");
{ const w = world({ window: W2 }); const u = w.STARTER_UNITS.us_path(); w.G.unitStudies.us_path = u;
  w.unitStageFormOpen("us_path", "kid");
  ok("the Start form offers Stage 7", /Presidents in order/.test(w._unitStageRowsHtml(u, ["kid"])));
  w.unitStageFormSet("stage", "7"); w.unitStageEnroll();
  const it = items(w, "kid"), st = w.G.masteryData.kid_settings;
  ok("1st, 2nd, 3rd President learning, each with its back as the answer (the deck is flip — cat_modes, below)", it.map(i => i.prompt).join() === "1st President,2nd President,3rd President" && it.every((i, n) => i.status === "introduction" && i.subject === "Presidents" && i.answer === P.cards[n].def));
  ok("the 47 in the bank in order, nothing from another stage", bank(w, "kid").length === 47 && bank(w, "kid").every((c, i) => c.cat === "Presidents" && c.name === P.cards[i].name));
  ok("settings: flip, 3 at a time, the How-to filled, the 47 backs saved", st.cat_modes.Presidents === "flip" && st.cat_intro_max.Presidents === 3 && st.cat_instructions.Presidents === w.STARTER_HOWTO.Presidents.main && st.cat_instructions_kid.Presidents === w.STARTER_HOWTO.Presidents.kid &&
    P.cards.every(c => st.definitions[c.name] === c.def) && Object.keys(st.definitions).length === 47);
  ok("every write targeted; kidStage stage 7", w.G.writes.some(x => x[1] === "unitStudies/us_path/kidStage/kid" && x[2].stage === 7) && w.G.writes.every(x => x[0] === "update" ? /^mastery\/kid(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid|cat_hold))?$/.test(x[1]) : /^unitStudies\/us_path\/(kidStage|enrolled)\/kid$/.test(x[1])), w.G.writes.map(x => x[0] + " " + x[1]));
  const s = w.unitStageStatus(u, "kid");
  ok("row: Stage 7 · 0 of 47 · ready at 42 · learning Founders · no ➡ yet (Stage 7 is the last shipped)", s.stage === 7 && s.total === 47 && s.need === 42 && s.fam === "Founders" && s.next === null && /ready at 42/.test(w._unitStageRowsHtml(u, ["kid"])));
  it.forEach(i => { i.status = "active"; i.tier = "weekly"; });
  bank(w, "kid").slice(3, 41).forEach((c, i) => it.push({ id: "p" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }));
  ok("41 on the ladder → not ready; 42 → ready", !w.unitStageStatus(u, "kid").ready && (it.push({ id: "p42", subject: "Presidents", prompt: "42nd President", status: "active", tier: "weekly" }), w.unitStageStatus(u, "kid").ready)); }
{ const w = world({ window: W2, dry: true }); w.G.unitStudies.us_path = w.STARTER_UNITS.us_path();
  w.unitStageFormOpen("us_path", "kid"); w.unitStageFormSet("stage", "7"); w.unitStageEnroll();
  ok("dry run: placing a kid at Stage 7 writes nothing", w.G.writes.length === 0); }

console.log("── a kid on Stage 4 → ➡ Stage 7 ──");
{ const w = world({ window: W2 }); const u = w.STARTER_UNITS.us_path(); w.G.unitStudies.us_path = u;
  w.unitStageFormOpen("us_path", "kid"); w.unitStageFormSet("stage", "4"); w.unitStageEnroll(); allOn(w, "kid");
  const s = w.unitStageStatus(u, "kid");
  ok("Stage 4 ready, its ➡ says “Start Stage 7: Presidents in order”", s.ready && s.next && s.next.n === 7 && /➡ Start Stage 7: Presidents in order/.test(w._unitStageRowsHtml(u, ["kid"])));
  const before = bank(w, "kid").length; w.G.writes.length = 0; w.unitStageMoveUp("us_path", "kid");
  ok("➡: 1st–3rd President learning, the 47 added to the bank after what's there, nothing else", items(w, "kid").filter(i => i.status === "introduction").map(i => i.prompt).join() === "1st President,2nd President,3rd President" &&
    bank(w, "kid").length === before + 47 && bank(w, "kid").slice(before).every((c, i) => c.cat === "Presidents" && c.name === P.cards[i].name));
  ok("kidStage → 7, from 4", w.G.writes.some(x => x[1] === "unitStudies/us_path/kidStage/kid" && x[2].stage === 7 && x[2].from === 4)); }

console.log("── STARTERUP: a family that added version 1 ──");
{ const w = world({ window: W2 });
  const copy = w.usUnitRecord(null, { ver: 1, upTo: 4 }); copy.addedTs = 1;
  copy.enrolled = { kid: true, kid2: true }; copy.kidStage = { kid: { stage: 4, knows: "", ts: 1 }, kid2: { stage: 1, knows: "", ts: 1 } };
  deck(copy, "Civics").cards[0].def = "Mom's own words";   // her edit stays
  w.G.unitStudies.us_path = JSON.parse(JSON.stringify(copy));
  w.G.masteryData.kid_custom_items = deck(copy, "Civics").cards.map(c => ({ cat: "Civics", name: c.name }));
  w.G.masteryData.kid2_custom_items = deck(copy, "American Symbols").cards.map(c => ({ cat: "American Symbols", name: c.name }));
  const pend = w.suPending(w.G.unitStudies.us_path);
  ok("the row shows: 47 new cards, 1 new stage", pend && pend.cards === 47 && pend.stages === 1, pend);
  const Pl = w.suPlan("us_path", 1), paths = Pl.writes.map(x => x.path);
  ok("the plan is exactly three writes: the Presidents deck whole at decks/5, Stage 7 at stages/4, version 2", paths.join() === "unitStudies/us_path/decks/5,unitStudies/us_path/stages/4,unitStudies/us_path/starterVer" &&
    Pl.writes[0].value.key === "Presidents" && Pl.writes[0].value.cards.length === 47 && JSON.stringify(Pl.writes[0].value) === JSON.stringify(P) &&
    JSON.stringify(Pl.writes[1].value) === JSON.stringify({ n: 7, label: "Presidents in order", weeklyFrom: 0, readyAt: 42 }) && Pl.writes[2].value === 2, paths);
  ok("nothing of hers is touched (her Civics back kept, counted), no kid, no mastery, no picture written", Pl.sum.backsMine === 1 && paths.every(p => !/kidStage|enrolled|visuals|^mastery\//.test(p)));
  ok("neither kid gets a card now — the Stage-4 kid gets them with ➡, the Stage-1 kid later", Pl.sum.kids.length === 2 && Pl.sum.kids.every(k => !Object.keys(k.added || {}).length && k.later.Presidents === 47));
  const after = JSON.parse(JSON.stringify(w.G.unitStudies.us_path)); Pl.writes.forEach(x => { const p = x.path.replace("unitStudies/us_path/", "").split("/"); let o = after; p.slice(0, -1).forEach(k => o = o[k]); o[p[p.length - 1]] = x.value; });
  w.G.unitStudies.us_path = after;
  ok("once applied the copy is current: no row, and the Stage-4 kid's ➡ goes to Stage 7", w.suPending(after) === null && (w.unitStageStatus(after, "kid").next || {}).n === 7); }
{ const w = world({ window: W2 }); const c = w.STARTER_UNITS.us_path(); c.addedTs = 1; w.G.unitStudies.us_path = c;
  ok("a family that added version 2 sees no row", w.suPending(c) === null); }

console.log("── no card can show another deck's answer ──");
{ const w = world({ window: W2 }); const names = P.cards.map(c => c.name);
  ok("no president card name is a built-in back's key or a math fact", names.every(n => w.MAST_VOCAB_DEFS[n.toLowerCase()] == null && w.MAST_MATH_ANS[n] == null));
  const geo = w.geoUnitRecord("North Carolina"), geoNames = new Set(geo.decks.flatMap(d => d.cards.map(c => c.name)));
  ok("…nor a Geography Path card, nor another starter unit's card; no other starter has a “Presidents” deck", names.every(n => !geoNames.has(n)) &&
    Object.keys(w.STARTER_UNITS).filter(id => id !== "us_path").every(id => { try { const r = w.STARTER_UNITS[id](); return (r.decks || []).every(d => d.key !== "Presidents" && (d.cards || []).every(c => names.indexOf(c.name) < 0)); } catch (e) { return true; } }));
  ok("…nor another US Path card in any of the ten stages", (() => { const t = w.usUnitRecord(null, { ver: 9, upTo: 10 }); return t.decks.filter(d => d.key !== "Presidents").every(d => d.cards.every(c => names.indexOf(c.name) < 0)); })());
  w.G.masteryData.kid_settings = { definitions: {} };
  ok("so with no saved back mastGetDef gives nothing, and with the enroll's backs it gives the unit's", names.every(n => w.mastGetDef("kid", n, "Presidents") === "") &&
    (P.cards.forEach(c => { w.G.masteryData.kid_settings.definitions[c.name] = c.def; }), P.cards.every(c => w.mastGetDef("kid", c.name, "Presidents") === c.def))); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
