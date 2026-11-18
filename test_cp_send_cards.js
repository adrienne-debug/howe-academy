/*
 * Node tests — 📥 CPSENDCARDS (her "yes build all of them" 2026-11-17): a teacher's send-out brings the station's cards for a
 * mirrored kid in the FAMILY app. Live 11/17: Forestry and Soils were sent out to Lincoln, he was still on stage 0, so the
 * released decks had none of their cards in his bank (only Mom's ➡ Start Stage N on the Units page put them there).
 *   · envmRelease → envStageCardsFor: the named station's stage cards that are missing go into mastery/<kid>_custom_items
 *     (one targeted index update) with the backs _ustApply writes (plain + coded keys) — the same entries a move-up writes;
 *     nothing else: no hold, no mode, no study card, kidStage and the Units row unchanged.
 *   · catches up a station released before (the hold already cleared); idempotent (again, a second device, the next start);
 *     two devices at once write the same bytes; never on the class site / demo / dry run / before his bank has arrived;
 *     a station, a deck key or a Key Concept key all name the station; other stations untouched; cards still loading → retried
 *     by envHydrate; the 📝 check-in gate (envtWaitsForCheckin) answers exactly as before.
 * Runs the real STARTER_UNITS block (ENVUNIT, ENVTEST, UNIT_STAGES) and ENVMIRROR sliced from the page, with the real envirothon.js.
 * run: node test_cp_send_cards.js
 */
const path = require("path");
const src = require("./test_src.js")(path.join(__dirname, "index.html"));
const LIB = require(path.join(__dirname, "envirothon.js"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const slice = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const BLOCK = slice("// STARTER_UNITS_START", "// STARTER_UNITS_END"), MIR = slice("// ENVMIRROR_START", "// ENVMIRROR_END");
const clone = v => JSON.parse(JSON.stringify(v));
const CARDS = LIB.unit.decks.flatMap(d => d.cards.map(c => Object.assign({ _dk: d.key }, c)));
const coded = n => /[.#$\[\]\/]/.test(n) ? n.replace(/[.#$\[\]\/%]/g, ch => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")) : n;

console.log("── placement ──");
ok("envStageCardsFor + envStageCardsRetry live in the ENVUNIT block, once", (() => { const e = slice("// ENVUNIT_START", "// ENVUNIT_END"); return e.split("function envStageCardsFor(").length === 2 && e.split("function envStageCardsRetry(").length === 2 && src.split("function envStageCardsFor(").length === 2; })());
ok("envmRelease calls it first (guarded), before the CPSEND branch and the hold clearing", (() => { const f = MIR.slice(MIR.indexOf("function envmRelease("), MIR.indexOf("function envmNotice(")); const i = f.indexOf('typeof envStageCardsFor==="function"&&envStageCardsFor(kid,rel,u)'); return i > 0 && i < f.indexOf("cpsdRelease(kid,rel,u)") && i < f.indexOf("delete hold[dk]"); })());
ok("envHydrate retries a waiting release (one guarded line, last)", /if\(typeof envStageCardsRetry==="function"\) envStageCardsRetry\(\);[^\n]*\n  return true;\n\}/.test(src));
ok("its only writes: an update on <kid>_custom_items and one on …/definitions; never a set, never cat_hold, never kidStage", (() => { const f = src.slice(src.indexOf("function envStageCardsFor("), src.indexOf("function envStageCardsRetry(")); return (f.match(/db\.ref\(/g) || []).length === 2 && /db\.ref\("mastery\/"\+kid\+"_custom_items"\)\.update\(bu\)/.test(f) && /db\.ref\("mastery\/"\+kid\+"_settings\/definitions"\)\.update\(/.test(f) && !/\.set\(/.test(f) && !/db\.ref\([^)]*(cat_hold|kidStage|cat_modes)/.test(f); })());
ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(src.slice(src.indexOf("const _envScPend"), src.indexOf("function envStageCardsRetry(") + 400)));

// ── the world: the unit + stages code, the check-ins, the mirror, a recording db ──
function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, writes: [], dry: !!o.dry, site: !!o.site, demo: !!o.demo, mastReady: o.mastReady !== false, cpsd: o.cpsd || null, ls: {}, rendered: 0 };
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p, clone(v)]); }, set(v) { G.writes.push(["set", p, clone(v)]); }, remove() { G.writes.push(["remove", p]); },
    transaction(fn) { const r = fn(null); G.writes.push(["transaction", p, r]); return Promise.resolve({ committed: true }); } }; } };
  const CFG = { firebase: { databaseURL: "https://x.firebaseio.com" }, classId: "c1" };
  const api = new Function("G", "db", "LIB", "CFG", `
    const masteryData=G.masteryData, currData={subjects:{}}; let unitStudies=G.unitStudies; const window={ HoweEnvirothon:LIB, HA_FAMILY:{ familyId:"howe", envirothon:CFG } }; let tab="units";
    const document={ getElementById:()=>({ innerHTML:"" }), createElement:()=>({}), head:{ appendChild(){} } }; const location={ hostname:"localhost" };
    const HA_LS={ getItem(k){ return (k in G.ls)?G.ls[k]:null; }, setItem(k,v){ G.ls[k]=String(v); }, removeItem(k){ delete G.ls[k]; } };
    const setTimeout=()=>0, clearTimeout=()=>{}; const console={ log(){}, error(){} };
    let _haMastReady=G.mastReady, _haUnitsReady=true;
    function momHere(){ return true; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); } function confirm(){ return true; }
    function renderUnits(){} function renderAllSoon(){ G.rendered++; } function gwShowToast(){}
    function envSiteOn(){ return G.site; } function envsDemo(){ return G.demo; }
    ${G.cpsd ? "function cpsdRelease(kid,rel,u){ return G.cpsd(kid,rel,u); }" : ""}
    function mastDefKeyOk(p){ return !/[.#$\\[\\]\\/]/.test(p); }
    function mastDefKey(p){ p=String(p); return mastDefKeyOk(p)?p:p.replace(/[.#$\\[\\]\\/%]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")); }
    function haKeyOk(n){ return mastDefKeyOk(String(n)); } function haKey(n){ return mastDefKey(n); }
    function haKeys(m){ const o={}; Object.keys(m).forEach(k=>{ o[haKey(k)]=m[k]; }); return o; }
    function mastGateChapter(){ return null; } function mastFullBank(){ return {}; }
    ${BLOCK}
    ${MIR}
    return { envUnitRecord, envHydrateAll, envStageCardsFor, envmRelease, envtWaitsForCheckin, unitStageFormOpen, unitStageEnroll, unitStageStatus, unitStageMoveUp, _unitStageRowsHtml, _ustCards,
      get us(){ return unitStudies; }, setMastReady(v){ _haMastReady=v; } };`)(G, db, LIB, CFG);
  api.G = G; return api;
}
// Lincoln enrolled at stage 0 through the Units page (live), then Forestry and Soils sent out BEFORE this change: holds cleared, no cards.
function enrolled(o) {
  const w = world(o); w.G.unitStudies.nc_envirothon = w.envUnitRecord(); w.envHydrateAll();
  const dry = w.G.dry, site = w.G.site, demo = w.G.demo; w.G.dry = false; w.G.site = false; w.G.demo = false;
  w.unitStageFormOpen("nc_envirothon", "lincoln"); w.unitStageEnroll();
  w.G.dry = dry; w.G.site = site; w.G.demo = demo;
  const hold = w.G.masteryData.lincoln_settings.cat_hold; w.us.nc_envirothon.decks.filter(d => d.station === "forestry" || d.station === "soils" || d.station === "general").forEach(d => { delete hold[d.key]; });
  w.G.writes.length = 0; return w;
}
const REL = { general: { openedAt: 1 }, forestry: { openedAt: 2 }, soils: { openedAt: 3 } };
const FOR = CARDS.filter(c => c.stage === 1), SOI = CARDS.filter(c => c.stage === 2), S0 = CARDS.filter(c => c.stage === 0);

console.log("\n── the catch-up: Forestry + Soils sent out before, stage 0 ──");
{
  const w = enrolled(), M = w.G.masteryData, bank0 = M.lincoln_custom_items.length, hold0 = clone(M.lincoln_settings.cat_hold), set0 = clone(M.lincoln_settings);
  ok("before: his bank holds stage 0 only (" + bank0 + " = " + S0.length + "), kidStage 0", bank0 === S0.length && w.us.nc_envirothon.kidStage.lincoln.stage === 0);
  const n = w.envmRelease("lincoln", REL);
  const ws = w.G.writes, bank = M.lincoln_custom_items;
  ok("the release (holds already clear) returns 0 decks changed, as before", n === 0);
  ok("Forestry's " + FOR.length + " and Soils' " + SOI.length + " cards join the bank — General's (already there) do not repeat", bank.length === bank0 + FOR.length + SOI.length && new Set(bank.map(b => b.cat + "|" + b.name)).size === bank.length);
  ok("each new entry is exactly {cat, name}, in the unit's order, Forestry's decks then Soils'", bank.slice(bank0).every(b => Object.keys(b).sort().join() === "cat,name") && bank.slice(bank0).map(b => b.cat + "|" + b.name).join("\n") === FOR.concat(SOI).map(c => c._dk + "|" + c.name).join("\n"));
  ok("exactly two writes: ONE update of mastery/lincoln_custom_items (index keys " + bank0 + "…) and ONE of …/definitions", ws.length === 2 && ws[0][0] === "update" && ws[0][1] === "mastery/lincoln_custom_items" && Object.keys(ws[0][2]).join() === Array.from({ length: FOR.length + SOI.length }, (_, i) => String(bank0 + i)).join() && ws[1][0] === "update" && ws[1][1] === "mastery/lincoln_settings/definitions", ws.map(x => x[0] + " " + x[1]));
  ok("no hold written or changed, no mode, no study card, kidStage still 0", JSON.stringify(M.lincoln_settings.cat_hold) === JSON.stringify(hold0) && JSON.stringify(M.lincoln_settings.cat_modes) === JSON.stringify(set0.cat_modes) && !(M.lincoln || []).length && w.us.nc_envirothon.kidStage.lincoln.stage === 0);
  const defs = M.lincoln_settings.definitions;
  ok("the backs: every Forestry/Soils front under its name or coded key; a back already saved (stage 0's) is never replaced", FOR.concat(SOI).every(c => defs[coded(c.name)] != null) && S0.every(c => /[.#$\[\]\/]/.test(c.name) || defs[c.name] === set0.definitions[c.name]) && Object.keys(ws[1][2]).every(k => set0.definitions[k] == null));
  ok("no definitions key carries . # $ [ ] /", Object.keys(ws[1][2]).every(k => !/[.#$\[\]\/]/.test(k)));
  // the same entries a ➡ move-up writes
  const v = enrolled(); v.unitStageMoveUp("nc_envirothon", "lincoln"); v.unitStageMoveUp("nc_envirothon", "lincoln");
  const vb = v.G.masteryData.lincoln_custom_items, vd = v.G.masteryData.lincoln_settings.definitions;
  ok("…the SAME bank entries and backs two ➡ move-ups (stage 1, then 2) write", JSON.stringify(vb) === JSON.stringify(bank) && JSON.stringify(Object.keys(vd).sort().map(k => [k, vd[k]])) === JSON.stringify(Object.keys(defs).sort().map(k => [k, defs[k]])));
  ok("a scheduled repaint and a mirror resend (the summary's totals move)", w.G.rendered >= 1);

  console.log("\n── idempotent ──");
  w.G.writes.length = 0;
  ok("the same release read again (the next app start) adds nothing, writes nothing", w.envmRelease("lincoln", REL) === 0 && w.G.writes.length === 0 && M.lincoln_custom_items.length === bank.length);
  const w2 = enrolled(); Object.assign(w2.G.masteryData, clone(M));   // a second device, after the first one's write has synced
  ok("a second device (synced) adds nothing", (w2.envmRelease("lincoln", REL), w2.G.writes.length === 0));
  const a = enrolled(), b = enrolled(); a.envmRelease("lincoln", REL); b.envmRelease("lincoln", REL);
  ok("two devices at the same moment (same synced state, neither has seen the other's write) send byte-identical updates", JSON.stringify(a.G.writes) === JSON.stringify(b.G.writes) && a.G.writes.length === 2);

  console.log("\n── the Units row afterwards ──");
  const s = w.unitStageStatus(w.us.nc_envirothon, "lincoln");
  ok("the Units row still reads Stage 0 · General concepts, ➡ Start Stage 1: Forestry still offered", s.stage === 0 && s.next && s.next.n === 1 && /Stage 0 · General concepts/.test(w._unitStageRowsHtml(w.us.nc_envirothon, ["lincoln"])) && /➡ Start Stage 1: Forestry/.test(w._unitStageRowsHtml(w.us.nc_envirothon, ["lincoln"])));
  w.G.writes.length = 0; w.unitStageMoveUp("nc_envirothon", "lincoln");
  const bw = w.G.writes.find(x => x[1] === "mastery/lincoln_custom_items"), hw = w.G.writes.find(x => x[1] === "mastery/lincoln_settings/cat_hold");
  ok("a later ➡ tap adds no bank entry (all there) — and, as today, re-holds every deck (released ones included) until the release is read again", (!bw || !Object.keys(bw[2]).length) && hw && Object.keys(hw[2]).length === 15 && hw[2]["Forestry · Terms"] === true, { bw: bw && Object.keys(bw[2]).length });
  ok("…a release read after it clears those holds again and adds nothing", (w.G.writes.length = 0, w.envmRelease("lincoln", REL) > 0) && !w.G.writes.some(x => x[1] === "mastery/lincoln_custom_items") && !M.lincoln_settings.cat_hold["Forestry · Terms"]);
}

console.log("\n── what names a station; other stations untouched ──");
{
  const w = enrolled(), M = w.G.masteryData, b0 = M.lincoln_custom_items.length;
  w.envmRelease("lincoln", { "Aquatic Ecology · ID": { openedAt: 5 } });
  const add = M.lincoln_custom_items.slice(b0), AQ = CARDS.filter(c => c.stage === w.us.nc_envirothon.decks.find(d => d.key === "Aquatic Ecology · ID").stage);
  ok("a deck key brings its whole station's stage cards (all Aquatics decks), no other station's", add.length === AQ.length && add.every(e => w.us.nc_envirothon.decks.find(d => d.key === e.cat).station === "aquatics"));
  ok("…and its hold is cleared as before (that deck only)", !M.lincoln_settings.cat_hold["Aquatic Ecology · ID"] && M.lincoln_settings.cat_hold["Aquatic Ecology · Terms"] === true);
  const b1 = M.lincoln_custom_items.length; w.envmRelease("lincoln", { "wildlife~some-concept": { openedAt: 6 } });
  ok("a Key Concept key (<station>~<kc>) brings that station's cards (Wildlife only)", M.lincoln_custom_items.length > b1 && M.lincoln_custom_items.slice(b1).every(e => w.us.nc_envirothon.decks.find(d => d.key === e.cat).station === "wildlife"));
  const b2 = M.lincoln_custom_items.length; w.G.writes.length = 0;
  ok("a falsy entry (an undone send-out) or an unknown key brings nothing", (w.envmRelease("lincoln", { cei: null, nonsense: { openedAt: 1 } }), M.lincoln_custom_items.length === b2 && w.G.writes.length === 0));
}

console.log("\n── the Howe-app path through CPSEND (cpsdRelease answers first) ──");
{
  const seen = []; const w = enrolled({ cpsd: (kid, rel) => { seen.push(Object.keys(rel).join()); return 0; } }), b0 = w.G.masteryData.lincoln_custom_items.length;
  w.envmRelease("lincoln", REL);
  ok("the cards are added before cpsdRelease's early return (which still runs, once)", w.G.masteryData.lincoln_custom_items.length === b0 + FOR.length + SOI.length && seen.length === 1);
}

console.log("\n── never where it must not ──");
{
  const none = (o, label, pre) => { const w = enrolled(o); if (pre) pre(w); const b0 = (w.G.masteryData.lincoln_custom_items || []).length; w.envmRelease("lincoln", REL);
    ok(label, w.G.writes.filter(x => x[1] === "mastery/lincoln_custom_items" || /definitions$/.test(x[1])).length === 0 && (w.G.masteryData.lincoln_custom_items || []).length === b0); };
  none({ dry: true }, "dry run: nothing added, nothing written");
  none({ site: true }, "the class site: nothing (envsAutoEnroll's job)");
  none({ demo: true }, "the demo: nothing");
  none({}, "his bank not read yet (_haMastReady false): nothing", w => w.setMastReady(false));
  none({}, "a kid not enrolled through the Units page (no kidStage): nothing", w => { delete w.us.nc_envirothon.kidStage.lincoln; });
  none({}, "no bank node at all: nothing (never appends to a bank not there)", w => { delete w.G.masteryData.lincoln_custom_items; });
  const w = enrolled(); w.G.dry = false;
  const noDb = world({ noDb: true }); noDb.G.unitStudies.nc_envirothon = w.us.nc_envirothon; Object.assign(noDb.G.masteryData, clone(w.G.masteryData));
  ok("no db: nothing", noDb.envStageCardsFor("lincoln", REL, noDb.us.nc_envirothon) === 0);
}

console.log("\n── a bank read back as an object with gaps; cards still loading ──");
{
  const w = enrolled(), M = w.G.masteryData; const obj = {}; M.lincoln_custom_items.forEach((e, i) => { obj[String(i === 0 ? 200 : i)] = e; }); M.lincoln_custom_items = obj;
  w.envmRelease("lincoln", { forestry: { openedAt: 2 } });
  const up = w.G.writes.find(x => x[1] === "mastery/lincoln_custom_items");
  ok("an object-shaped bank: new indices start past the highest used one (201), never over an entry", up && Object.keys(up[2])[0] === "201" && Object.keys(up[2]).length === FOR.length && M.lincoln_custom_items["200"].cat === S0[0]._dk);
  const L = enrolled(), u = L.us.nc_envirothon; u.decks.forEach(d => { if (d.station === "forestry") delete d.cards; });
  const b0 = L.G.masteryData.lincoln_custom_items.length;
  ok("Forestry's cards not loaded yet: nothing added now", L.envmRelease("lincoln", { forestry: { openedAt: 2 } }) === 0 && L.G.masteryData.lincoln_custom_items.length === b0 && !L.G.writes.length);
  L.envmRelease("lincoln", { soils: { openedAt: 3 } });   // the other listener, still before the cards
  L.envHydrateAll();
  ok("when they arrive (envHydrate), both waiting releases are applied: Forestry + Soils", L.G.masteryData.lincoln_custom_items.length === b0 + FOR.length + SOI.length && L.G.writes.filter(x => x[1] === "mastery/lincoln_custom_items").length === 1);
  L.G.writes.length = 0; L.envHydrateAll();
  ok("…once: a later hydrate retries nothing", L.G.writes.length === 0);
}

console.log("\n── 📝 the check-in gate is untouched ──");
{
  const tests = { general: { pre: { right: 5, n: 10 } } };   // Forestry's and Soils' check-ins not taken yet
  const w = enrolled({ mastery: { lincoln_tests: clone(tests) } });
  const before = ["Forestry · Terms", "Forestry · ID", "Soils and Land Use · Terms", "General Concepts · Terms"].map(k => w.envtWaitsForCheckin("lincoln", k));
  w.envmRelease("lincoln", REL);
  const after = ["Forestry · Terms", "Forestry · ID", "Soils and Land Use · Terms", "General Concepts · Terms"].map(k => w.envtWaitsForCheckin("lincoln", k));
  ok("envtWaitsForCheckin answers the same after the cards arrive (Forestry / Soils wait for their check-ins: " + JSON.stringify(after) + ")", JSON.stringify(before) === JSON.stringify(after) && after[0] === true && after[2] === true && after[3] === false);
  ok("the cards are in his bank all the same (the gate, not the bank, holds them back)", w.G.masteryData.lincoln_custom_items.some(e => e.cat === "Forestry · Terms"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
