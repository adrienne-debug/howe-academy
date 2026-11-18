// 🇺🇸 United States Path starter unit — slice 2 USPATH (PLAN_us_unit_2026-11-16.md §9 row 2; her approval 2026-11-17: "great on the
// us", "buil the us"). Runs the real STARTER_UNITS block (USPATH + UNIT_STAGES + STARTERUP + ENVUNIT's envHydrateAll) with the real
// us.js / us_pics_1.js / us_pics_2.js:
//  · Stages 1–4 only — American Symbols 11 · American Holidays 11 + Famous Presidents 5 · Famous Americans 24 · Civics 30 (81 cards),
//    every card byte for byte us.js's; flash decks carry no back, flip decks do; the record holds no picture;
//  · before us.js is here the maker is a SHELL for the Add card (title, stages, "81 cards", never written) and null for STARTERUP;
//    ＋ Add fetches us.js first ("Getting the unit ready…" / "Needs the internet once"), then writes the record once, create-only;
//  · a Pre-K kid at Stage 1 → the flag and the eagle learning, 11 in the bank; ➡ 2, 3, 4 seed only their own stage; dry run inert;
//  · pictures: usHydrate puts {svg, credit} on the record IN MEMORY — photos (JPEG) and drawings (SVG); the Units tile and the card
//    sheet (UNITDRAWN's unitCardFace), _unitPortrait and mastGetVisual all show them, never the unit emoji; Mom's picture wins;
//    usHydrateAll fetches us.js, then the photo files (us_pics_2.js for Stage 7's presidents since USPRES), never geo.js yet;
//  · STARTERUP: a family that added Stages 1–4 sees "＋ Add the new stages" when the code ships more (simulated: ver 2, Stages 1–10),
//    and the plan only adds — the new decks, the new cards of the two shared decks, the six stages, the version;
//  · no shipped card name is another deck's built-in back key, so mastGetDef can't hand a card another deck's answer.
// Since slice 3 (USPRES) the code ships Stages 1–4 and 7 (128 cards, version 2); this file pins the 1–4 part and the version-1
// copy a family added before; test_us_presidents.js pins Stage 7.
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const usSrc = fs.readFileSync(path.join(__dirname, "us.js"), "utf8"), p1Src = fs.readFileSync(path.join(__dirname, "us_pics_1.js"), "utf8"), p2Src = fs.readFileSync(path.join(__dirname, "us_pics_2.js"), "utf8");
const PIN = { ver: 2, stages: [1, 2, 3, 4, 7] };   // USPRES's release (Stages 1–4 and 7); USHIST ships 1–9 at version 3
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  " + JSON.stringify(extra).slice(0, 500) : "")); } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const u0 = src.indexOf("// USPATH_START"), u1 = src.indexOf("// USPATH_END");
ok("USPATH block once, inside the STARTER_UNITS block", a > 0 && u0 > a && u1 > u0 && u1 < b && src.indexOf("// USPATH_START", u0 + 1) < 0);
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
const SHIP = { 1: 11, 2: 16, 3: 24, 4: 30 };
const DECKS4 = { "American Symbols": 11, "American Holidays": 11, "Famous Presidents": 5, "Famous Americans": 24, "Civics": 30 };

function loadUS(pics, win) {   // us.js (and the photo files) loaded the browser's way into one window (a fresh one unless given)
  win = win || {}; const ctx = { window: win, module: undefined, console }; vm.createContext(ctx);
  if (pics) { vm.runInContext(p1Src, ctx); if (pics === 2) vm.runInContext(p2Src, ctx); }
  if (pics !== "picsOnly") vm.runInContext(usSrc, ctx); return win;
}
function loadPics(win, s) { const ctx = { window: win, module: undefined, console }; vm.createContext(ctx); vm.runInContext(s || p1Src, ctx); return win; }
const V1 = { ver: 1, upTo: 4 };   // what slice 2 shipped — a family's copy from before USPRES
const key4 = u => u.decks.flatMap(d => d.cards.filter(c => c.stage <= 4).map(c => d.key + "_" + c.name));
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
    return { STARTER_UNITS, STARTER_HOWTO, STARTER_LAZY, US_PATH_SHIP, US_PATH_STAGES, US_PATH_STAGE_CARDS, usUnitRecord, usHydrate, usHydrateAll, usLazyWant,
      _starterUnitsHtml, starterUnitAdd, envHydrateAll, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp,
      _unitStageRowsHtml, _unitPortrait, mastGetVisual, _mastVisNorm, unitCardFace, mastGetDef, MAST_VOCAB_DEFS, MAST_MATH_ANS, geoUnitRecord,
      suPending, suPlan, suCode, setKid(k){ masteryKid=k; } };`)(G, db);
  api.STARTER_UNITS.us_path = fam => api.usUnitRecord(fam, PIN);   // this file pins the USPRES release; test_us_history.js pins today's
  api.G = G; return api;
}
const deck = (u, k) => u.decks.find(d => d.key === k);
const items = (w, k) => w.G.masteryData[k] || [];
const bank = (w, k) => w.G.masteryData[k + "_custom_items"] || [];
const tick = () => new Promise(r => setImmediate(r));
const flush = async () => { for (let i = 0; i < 8; i++) await tick(); };

(async () => {
console.log("── wiring ──");
ok("registry: us_path right after geography_path (with the paths)", (() => { const k = Object.keys(world().STARTER_UNITS); return k.indexOf("us_path") === k.indexOf("geography_path") + 1; })());
ok("HA_LAZY_FILES names us.js, us_pics_1.js and us_pics_2.js", /HA_LAZY_FILES=\{[^}]*us:"us\.js",us_pics_1:"us_pics_1\.js",us_pics_2:"us_pics_2\.js"/.test(src));
const sw = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
const swPat = new RegExp((/const lazyM = req\.method === 'GET' && \/(.*)\/\.exec/.exec(sw) || [])[1]);
ok("sw.js keeps an offline copy of each of the three (and not of a look-alike)", ["us.js", "us_pics_1.js", "us_pics_2.js"].every(f => swPat.test("/howe-academy/" + f) && !swPat.test("/howe-academy/x" + f)) && swPat.test("/geo.js"));
ok("the three generated files set their haLazyReady flag (window._haLazy_us / _us_pics_1 / _us_pics_2)", (() => { const w = loadUS(2); return w._haLazy_us && w._haLazy_us_pics_1 && w._haLazy_us_pics_2; })());
{ const w = world();
  ok("STARTER_LAZY: us_path waits for us.js", w.STARTER_LAZY.us_path === "us");
  ok("How-to notes for the five Stage 1–4 decks", Object.keys(DECKS4).every(k => w.STARTER_HOWTO[k] && w.STARTER_HOWTO[k].main.length > 40 && w.STARTER_HOWTO[k].kid));
  ok("the code ships Stages 1–4 (and more since USPRES / USHIST — pinned in their own tests)", [1, 2, 3, 4].every(n => w.US_PATH_SHIP.stages.includes(n)) && w.US_PATH_SHIP.ver >= 2); }

console.log("── before us.js: the shell ──");
{ const w = world();
  const s = w.STARTER_UNITS.us_path();
  ok("the Add card's shell: title, flag emoji, stages 1–4 and 7, 128 cards, no decks, marked _shell", s._shell === true && s.title === "United States Path" && s.emoji === "\u{1F1FA}\u{1F1F8}" && s.stages.map(x => x.n).join() === "1,2,3,4,7" && s.cardCount === 128 && s.decks.length === 0);
  ok("a version-1 shell is still Stages 1–4, 81 cards", (() => { const v = w.usUnitRecord(null, V1); return v._shell && v.stages.map(x => x.n).join() === "1,2,3,4" && v.cardCount === 81; })());
  ok("called with a family's copy (STARTERUP) it is null — never a diff of nothing", w.STARTER_UNITS.us_path({ id: "us_path", starter: "us_path", starterVer: 1, decks: [] }) === null);
  const h = w._starterUnitsHtml();
  ok("the Starter units list shows it: name, the five stages by number, “128 cards”, ＋ Add", /United States Path/.test(h) && /1\. Symbols of America · 2\. Holidays &amp; presidents to know · 3\. Famous Americans · 4\. How our government works · 7\. Presidents in order/.test(h) && /128 cards/.test(h) && /starterUnitAdd\('us_path'\)/.test(h)); }
{ const L = loadUS(0).HoweUS, w = world();
  ok("the shell's stage labels and readyAt are us.js's, and its counts are us.js's per stage", JSON.stringify(w.US_PATH_STAGES.map(s => [s.n, s.label, s.readyAt || 0])) === JSON.stringify(L.stages.filter(s => w.US_PATH_SHIP.stages.includes(s.n)).map(s => [s.n, s.label, s.readyAt || 0])) &&
    w.US_PATH_SHIP.stages.every(n => w.US_PATH_STAGE_CARDS[n] === L.cards.filter(c => c.stage === n).length)); }

console.log("── ＋ Add waits for us.js ──");
{ const win = {}; const w = world({ window: win }); let res;
  w.G.lazyLoad = () => new Promise((r) => { res = r; });
  w.starterUnitAdd("us_path");
  ok("tap ＋ Add with no us.js: nothing written, us.js asked for once, the card says “Getting the unit ready…”", w.G.writes.length === 0 && w.G.lazy.join() === "us" && /Getting the unit ready/.test(w._starterUnitsHtml()));
  w.starterUnitAdd("us_path");
  ok("a second tap while it loads asks nothing more", w.G.lazy.join() === "us" && w.G.writes.length === 0);
  const L = loadUS(1); Object.assign(win, L); res(true); await flush();
  const t = w.G.writes.filter(x => x[0] === "transaction");
  ok("us.js here → ONE create-only write of unitStudies/us_path, the real record (128 cards, no shell), and the note is gone", t.length === 1 && t[0][1] === "unitStudies/us_path" && !t[0][2]._shell && t[0][2].decks.reduce((n, d) => n + d.cards.length, 0) === 128 && !/Getting the unit ready/.test(w._starterUnitsHtml()));
  ok("the written record carries no picture (no visuals, no data: URI)", !t[0][2].visuals && !/data:|<svg|imageUrl/.test(JSON.stringify(t[0][2])));
  ok("after Add the unit is on the family and its pictures hydrate in memory (envHydrateAll → usHydrateAll) — all 81 of Stages 1–4", !!w.G.unitStudies.us_path && key4(w.G.unitStudies.us_path).every(k => (w.G.unitStudies.us_path.visuals || {})[k])); }
{ const w = world(); w.G.lazyLoad = () => Promise.reject(new Error("offline"));
  w.starterUnitAdd("us_path"); await flush();
  ok("offline: nothing written, the card says it needs the internet once", w.G.writes.length === 0 && /Needs the internet once/.test(w._starterUnitsHtml()));
  w.G.lazyLoad = () => Promise.resolve(true); Object.assign(w.G.window, loadUS(1)); w.starterUnitAdd("us_path"); await flush();
  ok("…and tapping again once it's back adds it", w.G.writes.filter(x => x[0] === "transaction").length === 1); }
{ const w = world({ dry: true, window: loadUS(1) }); w.starterUnitAdd("us_path"); await flush();
  ok("dry run: Add writes nothing", w.G.writes.length === 0); }

console.log("── the record (us.js loaded) ──");
const W1 = loadUS(1);
{ const w = world({ window: W1 }), L = W1.HoweUS, u = w.STARTER_UNITS.us_path();
  ok("id, starter, the shipped version, picsInCode us, nbInsert on, the plan's description", u.id === "us_path" && u.starter === "us_path" && u.starterVer === PIN.ver && u.picsInCode === "us" && u.nbInsert === true && /Liberty Bell/.test(u.desc) && !u._shell);
  ok("Stages 1–4, readyAt 14 · 21 · 27 (Stage 1 needs all 11)", JSON.stringify(u.stages.filter(s => s.n <= 4)) === JSON.stringify([{ n: 1, label: "Symbols of America", weeklyFrom: 0 }, { n: 2, label: "Holidays & presidents to know", weeklyFrom: 0, readyAt: 14 }, { n: 3, label: "Famous Americans", weeklyFrom: 0, readyAt: 21 }, { n: 4, label: "How our government works", weeklyFrom: 0, readyAt: 27 }]));
  ok("five Stage 1–4 decks with the plan's counts, modes and intro caps", JSON.stringify(u.decks.slice(0, 5).map(d => [d.key, d.mode, d.introCap, d.cards.length])) === JSON.stringify([["American Symbols", "flash", 2, 11], ["American Holidays", "flash", 2, 11], ["Famous Presidents", "flash", 2, 5], ["Famous Americans", "flip", 2, 24], ["Civics", "flip", 3, 30]]));
  ok("stage counts 11 · 16 · 24 · 30 = 81", [1, 2, 3, 4].every(n => u.decks.reduce((t, d) => t + d.cards.filter(c => c.stage === n).length, 0) === SHIP[n]));
  ok("every card is us.js's card byte for byte (name, family, stage, order, back)", u.decks.every(d => d.cards.every(c => { const k = L.card(d.key, c.name); return k && k.family === c.family && k.stage === c.stage && k.order === c.order && (k.def == null ? c.def === undefined : k.def === c.def); })));
  ok("a card holds only name, family, stage, order (and a back) — no picture spec, no notes", u.decks.every(d => d.cards.every(c => Object.keys(c).every(k => ["name", "family", "stage", "order", "def"].includes(k)))));
  ok("flash decks carry no back; Famous Americans and Civics all have one", u.decks.every(d => d.cards.every(c => d.mode === "flash" ? c.def === undefined : typeof c.def === "string" && c.def.length > 3)));
  ok("the record holds no picture and stays small (< 24 KB with Stage 7)", !/data:|<svg|imageUrl/.test(JSON.stringify(u)) && JSON.stringify(u).length < 24000, JSON.stringify(u).length);
  ok("the version-1 record (what a family added before USPRES) is the same five decks, 81 cards", (() => { const v = w.usUnitRecord(null, V1); return v.starterVer === 1 && JSON.stringify(v.decks) === JSON.stringify(u.decks.slice(0, 5)) && JSON.stringify(v.stages) === JSON.stringify(u.stages.filter(s => s.n <= 4)); })());
  ok("a test can ship more: Stages 1–10 at version 2 → 370 cards, 11 decks", (() => { const r = w.usUnitRecord(null, { ver: 2, upTo: 10 }); return r.starterVer === 2 && r.decks.length === 11 && r.decks.reduce((t, d) => t + d.cards.length, 0) === 370 && r.stages.length === 10; })()); }

console.log("── a Pre-K kid: Stage 1 → 2 → 3 → 4 ──");
{ const w = world({ window: W1 }); const u = w.STARTER_UNITS.us_path(); w.G.unitStudies.us_path = u;
  w.unitStageFormOpen("us_path", "kid"); w.unitStageEnroll();
  let it = items(w, "kid");
  ok("Stage 1: the flag and the bald eagle start learning (2 at a time), flash, no back", it.map(i => i.prompt).join() === "American flag,bald eagle" && it.every(i => i.status === "introduction" && i.subject === "American Symbols" && i.review_mode === "flash" && i.answer === undefined));
  ok("Stage 1: the 11 symbols in the bank in path order, nothing else", bank(w, "kid").map(c => c.name).join() === "American flag,bald eagle,Statue of Liberty,Liberty Bell,White House,the Capitol,Mount Rushmore,Washington Monument,Lincoln Memorial,Pledge of Allegiance,national anthem" && bank(w, "kid").every(c => c.cat === "American Symbols"));
  const st = w.G.masteryData.kid_settings;
  ok("settings: American Symbols flash, 2 new at once, the How-to note filled; no back written", st.cat_modes["American Symbols"] === "flash" && st.cat_intro_max["American Symbols"] === 2 && st.cat_instructions["American Symbols"] === w.STARTER_HOWTO["American Symbols"].main && Object.keys(st.definitions || {}).length === 0);
  let s = w.unitStageStatus(u, "kid");
  ok("row: Stage 1 · 0 of 11 · learning Our flag and our bird · next Stage 2", s.stage === 1 && s.total === 11 && s.learn === 2 && s.fam === "Our flag and our bird" && s.next && s.next.n === 2 && /Stage 1 · Symbols of America/.test(w._unitStageRowsHtml(u, ["kid"])));
  ok("every write a targeted path; kidStage stage 1 + enrolled", w.G.writes.some(x => x[1] === "unitStudies/us_path/kidStage/kid" && x[2].stage === 1) && w.G.writes.every(x => x[0] === "update" ? /^mastery\/kid(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid|cat_hold))?$/.test(x[1]) : /^unitStudies\/us_path\/(kidStage|enrolled)\/kid$/.test(x[1])), w.G.writes.map(x => x[0] + " " + x[1]));
  bank(w, "kid").forEach((c, i) => { const f = it.find(x => x.prompt === c.name); if (f) { f.status = "active"; f.tier = "weekly"; } else it.push({ id: "s" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); });
  ok("all 11 on the ladder → ready", w.unitStageStatus(u, "kid").ready);
  w.G.writes.length = 0; w.unitStageMoveUp("us_path", "kid");
  it = items(w, "kid");
  const s2 = it.filter(i => i.status === "introduction");
  ok("➡ Stage 2: two holidays and two presidents learning — New Year's Day, MLK Jr Day, George Washington, Thomas Jefferson", s2.map(i => i.prompt).join() === "New Year's Day,Martin Luther King Jr Day,George Washington,Thomas Jefferson");
  ok("➡ Stage 2 seeds only Stage 2 (no Famous Americans, no Civics)", !JSON.stringify(w.G.writes).match(/"cat":"(Famous Americans|Civics)"/) && bank(w, "kid").filter(c => c.cat === "American Holidays").length === 11 && bank(w, "kid").filter(c => c.cat === "Famous Presidents").length === 5);
  it.forEach(i => { i.status = "active"; i.tier = "weekly"; }); bank(w, "kid").forEach((c, i) => { if (!it.some(x => x.subject === c.cat && x.prompt === c.name)) it.push({ id: "t" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); });
  w.unitStageMoveUp("us_path", "kid");
  const st3 = w.G.masteryData.kid_settings;
  ok("➡ Stage 3: Famous Americans flip, 2 at a time — Pocahontas and Squanto learning, their backs on the card and saved", it.filter(i => i.status === "introduction").map(i => i.prompt).join() === "Pocahontas,Squanto" && st3.cat_modes["Famous Americans"] === "flip" &&
    it.find(i => i.prompt === "Pocahontas").answer === deck(u, "Famous Americans").cards[0].def && st3.definitions.Pocahontas === deck(u, "Famous Americans").cards[0].def);
  it.forEach(i => { i.status = "active"; i.tier = "weekly"; }); bank(w, "kid").forEach((c, i) => { if (!it.some(x => x.subject === c.cat && x.prompt === c.name)) it.push({ id: "f" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); });
  w.unitStageMoveUp("us_path", "kid");
  ok("➡ Stage 4: Civics flip, 3 at a time — Constitution, law, citizen; the 30 backs saved", it.filter(i => i.status === "introduction").map(i => i.prompt).join() === "Constitution,law,citizen" && w.G.masteryData.kid_settings.cat_intro_max.Civics === 3 &&
    deck(u, "Civics").cards.every(c => w.G.masteryData.kid_settings.definitions[c.name] === c.def));
  ok("after Stage 4, ➡ goes to Stage 7 (5–6 come with USHIST)", (w.unitStageStatus(u, "kid").next || {}).n === 7); }
{ const w = world({ window: W1, dry: true }); w.G.unitStudies.us_path = w.STARTER_UNITS.us_path();
  w.unitStageFormOpen("us_path", "kid"); w.unitStageEnroll();
  ok("dry run: enroll writes nothing", w.G.writes.length === 0); }

console.log("── pictures ──");
{ const w = world({ window: loadUS(2) }); const u = w.STARTER_UNITS.us_path(); w.G.unitStudies.us_path = u;
  ok("usHydrate: every one of the 128 cards gets {svg, credit} — in memory", w.usHydrate(u) && Object.keys(u.visuals).length === 128 && Object.values(u.visuals).every(v => typeof v.svg === "string" && v.credit.length > 5 && !v.imageUrl));
  const V = u.visuals;
  ok("photos are small JPEGs (the eagle, the Liberty Bell, Lincoln, Rosa Parks, the Supreme Court), drawings SVG (the flag, Thanksgiving, the three branches)",
    ["American Symbols_bald eagle", "American Symbols_Liberty Bell", "Famous Presidents_Abraham Lincoln", "Famous Americans_Rosa Parks", "Civics_Supreme Court"].every(k => /^data:image\/jpeg;base64,/.test(V[k].svg)) &&
    ["American Symbols_American flag", "American Holidays_Thanksgiving", "Civics_legislative branch"].every(k => /^data:image\/svg\+xml;utf8,%3Csvg/.test(V[k].svg)));
  ok("each photo's credit names its licence and Commons file; drawings say Howe Academy", /Wikimedia Commons/.test(V["American Symbols_bald eagle"].credit) && /CC BY 2\.0/.test(V["American Symbols_bald eagle"].credit) && /Drawing: Howe Academy/.test(V["American Symbols_American flag"].credit));
  ok("the Units tile and the Mom card sheet (UNITDRAWN unitCardFace) show the picture for EVERY card — never the unit emoji",
    u.decks.every(d => d.cards.every(c => { const f = w.unitCardFace(u, d.key, c.name); return f && f.img && f.from === "unit" && !f.emoji; })));
  ok("_unitPortrait (notebook insert) and mastGetVisual (drill, Study, games) resolve them", (() => { const p = w._unitPortrait(u, "kid", "Famous Americans", "Harriet Tubman"); const v = w.mastGetVisual("Civics", "veto"); return p && /^data:image\/jpeg/.test(p.img) && v && v.svg && /^data:image\/svg/.test(v.svg); })());
  ok("the bank's mint stamps only vis.imageUrl / a string — so a US item never gets a picture written to mastery/<kid>", /else if\(vis\.imageUrl\) item\.imageUrl=vis\.imageUrl;/.test(src) && (() => { const vis = w.mastGetVisual("American Symbols", "bald eagle"); const item = {}; if (typeof vis === "string") item.emoji = vis; else if (vis.imageUrl) item.imageUrl = vis.imageUrl; return !("imageUrl" in item) && !("emoji" in item); })());
  u.visuals["Civics_veto"] = { imageUrl: "https://example.com/mine.jpg" }; u.visuals["American Symbols_bald eagle"] = "\u{1F985}";
  w.usHydrate(u);
  ok("Mom's own picture or emoji on a card wins over the code's", u.visuals["Civics_veto"].imageUrl === "https://example.com/mine.jpg" && u.visuals["American Symbols_bald eagle"] === "\u{1F985}");
  ok("a card Mom added that the code doesn't know keeps the unit emoji (no picture, no error)", (() => { deck(u, "Civics").cards.push({ name: "filibuster", family: "Congress", stage: 4, order: 999, def: "x" }); w.usHydrate(u); return !u.visuals["Civics_filibuster"]; })()); }
{ const win = {}; const w = world({ window: win }); w.G.unitStudies.us_path = (() => { const t = world({ window: W1 }); return t.STARTER_UNITS.us_path(); })();
  const loads = {};
  w.G.lazyLoad = n => new Promise(r => { loads[n] = r; });
  const r = w.envHydrateAll();
  ok("envHydrateAll → usHydrateAll: with no us.js yet it asks for us.js once", r === false && w.G.lazy.join() === "us");
  loadUS(0, win); loads.us(true); await flush();
  const V = w.G.unitStudies.us_path.visuals || {};
  ok("us.js here → the drawings hydrate at once (flag, holidays, civics), the photos wait; the screen redraws", /svg/.test((V["American Symbols_American flag"] || {}).svg || "") && !V["American Symbols_bald eagle"] && w.G.redraws >= 1);
  ok("then it fetches the two photo files (Stage 7's presidents are us_pics_2.js's) — not geo.js (no map card yet)", w.G.lazy.join() === "us,us_pics_1,us_pics_2");
  loadPics(win); loads.us_pics_1(true); await flush();
  ok("…and waits for both before it re-hydrates (no photo yet with one file in)", !w.G.unitStudies.us_path.visuals["American Symbols_bald eagle"]);
  loadPics(win, p2Src); loads.us_pics_2(true); await flush();
  ok("both here → all 128 pictures, photos included", Object.keys(w.G.unitStudies.us_path.visuals).length === 128 && /^data:image\/jpeg/.test(w.G.unitStudies.us_path.visuals["American Symbols_bald eagle"].svg) && key4(w.G.unitStudies.us_path).every(k => w.G.unitStudies.us_path.visuals[k]));
  { const w1 = world({ window: {} }), v1 = world({ window: W1 }).usUnitRecord(null, V1);
    ok("a version-1 copy (Stages 1–4) wants us_pics_1.js only", w1.usLazyWant([v1], W1.HoweUS).join() === "us_pics_1"); }
  const t10 = world({ window: W1 }).usUnitRecord(null, { ver: 2, upTo: 10 });
  ok("a record with Stage 5+ cards also wants us_pics_2.js and geo.js (colony maps, pins)", JSON.stringify(world({ window: {} }).usLazyWant([t10], W1.HoweUS).sort()) === JSON.stringify(["geo", "us_pics_1", "us_pics_2"])); }
{ const w = world({ window: {} }); ok("a family without the unit fetches nothing", w.envHydrateAll() === false && w.G.lazy.length === 0); }

console.log("── STARTERUP: Stages 1–4 now, the rest later ──");
{ const w0 = world({ window: W1 }), c0 = w0.STARTER_UNITS.us_path(); c0.addedTs = 1;
  ok("the code ships what the copy has → no “＋ Add the new stages” row", w0.suPending(c0) === null && /current/.test((w0.G.unitStudies.us_path = c0, w0.suPlan("us_path", 1).why)));
  const w = world({ window: W1 });
  const copy = w.usUnitRecord(null, V1); copy.addedTs = 1; copy.enrolled = { kid: true }; copy.kidStage = { kid: { stage: 4, knows: "", ts: 1 } };
  w.G.unitStudies.us_path = JSON.parse(JSON.stringify(copy));
  w.G.masteryData.kid_custom_items = deck(copy, "Civics").cards.map(c => ({ cat: "Civics", name: c.name }));
  w.STARTER_UNITS.us_path = fam => w.usUnitRecord(fam, { ver: 9, upTo: 10 });   // a later slice: Stages 1–10
  const pend = w.suPending(w.G.unitStudies.us_path);
  ok("the code grows to Stages 1–10 → the row shows: 289 new cards, 6 new stages", pend && pend.cards === 289 && pend.stages === 6, pend);
  const P = w.suPlan("us_path", 1);
  const paths = P.writes.map(x => x.path);
  ok("the plan only adds: six new decks whole, the new cards of Famous Americans (6) and Civics (3) at new indexes, six stages, the version", P.writes.length > 0 &&
    ["13 Colonies", "U.S. History", "American Battles", "Amendments", "Presidents", "Civics Test"].every(k => P.writes.some(x => /^unitStudies\/us_path\/decks\/\d+$/.test(x.path) && x.value.key === k)) &&
    P.writes.filter(x => /^unitStudies\/us_path\/decks\/3\/cards\/\d+$/.test(x.path)).length === 6 && P.writes.filter(x => /^unitStudies\/us_path\/decks\/4\/cards\/\d+$/.test(x.path)).length === 3 &&
    P.writes.some(x => x.path === "unitStudies/us_path/starterVer" && x.value === 9), paths);
  ok("no write touches an existing card, kid, enrolled or kidStage", paths.every(p => !/kidStage|enrolled|^mastery\//.test(p)) &&
    P.writes.filter(x => /\/cards\/\d+$/.test(x.path)).every(x => Number(x.path.split("/").pop()) >= (x.path.indexOf("/decks/3/") > 0 ? 24 : 30)));
  ok("the Stage-4 kid gets nothing yet — Stage 5's cards come with ➡ like any stage card", (P.sum.kids || []).every(k => !Object.keys(k.added || {}).length) && P.sum.kids[0].later["Presidents"] === 47); }
{ const win = {}; const w = world({ window: win }); const c = world({ window: W1 }).usUnitRecord(null, V1); c.addedTs = 1; w.G.unitStudies.us_path = c;
  w.STARTER_UNITS.us_path = fam => w.usUnitRecord(fam, { ver: 9, upTo: 10 });
  ok("the Units page renders before us.js arrives: no row yet, and the plan says the code's copy didn't build", w.suPending(c) === null && /didn’t build/.test(w.suPlan("us_path", 2).why));
  loadUS(0, win);
  ok("…once us.js is here the SAME copy shows the row (a not-built answer is never remembered)", (() => { const p = w.suPending(c); return p && p.cards === 289; })()); }

console.log("── no card can show another deck's answer ──");
{ const w = world({ window: W1 }); const u = w.STARTER_UNITS.us_path();
  const names = u.decks.flatMap(d => d.cards.map(c => c.name));
  const vocab = Object.keys(w.MAST_VOCAB_DEFS);
  ok("no shipped card name is a built-in back's key (MAST_VOCAB_DEFS with the world capitals) or a math fact", names.every(n => w.MAST_VOCAB_DEFS[n.toLowerCase()] == null && w.MAST_MATH_ANS[n] == null), names.filter(n => w.MAST_VOCAB_DEFS[n.toLowerCase()] != null));
  const geoNames = new Set(w.geoUnitRecord("North Carolina").decks.flatMap(d => d.cards.map(c => c.name)));
  ok("no shipped card name is a Geography Path card name (their backs share the kid's definitions map)", names.every(n => !geoNames.has(n)), names.filter(n => geoNames.has(n)));
  const others = Object.keys(w.STARTER_UNITS).filter(id => id !== "us_path").flatMap(id => { try { const r = w.STARTER_UNITS[id](); return (r.decks || []).flatMap(d => (d.cards || []).filter(c => c.def != null).map(c => c.name)); } catch (e) { return []; } });
  ok("no shipped card name is another starter unit's card with a back", names.every(n => !others.includes(n)), names.filter(n => others.includes(n)));
  ok("so for a kid with no saved backs, every flash card's back is empty and every flip card's back is the unit's", u.decks.every(d => d.cards.every(c => w.mastGetDef("kid", c.name, d.key) === "")) &&
    (() => { w.G.masteryData.kid_settings = { definitions: {} }; u.decks.forEach(d => d.cards.forEach(c => { if (c.def) w.G.masteryData.kid_settings.definitions[c.name] = c.def; })); return u.decks.every(d => d.cards.every(c => w.mastGetDef("kid", c.name, d.key) === (c.def || ""))); })()); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
