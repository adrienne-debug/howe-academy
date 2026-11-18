/*
 * Node tests — ⚡ CPFLUENT (her "yes build all of them" 2026-11-17): the ID Flash count on the class site's 📋 Class tab.
 *   · envSummary gains summary.flash.<ID deck> = {f: items fluent, n: items pictured} — PURE (masteryData + the unit record + the
 *     pictures in memory, or ctx.pics), ID Flash's own item and key, only decks the kid has ID Flash state in, absent when none.
 *   · the summary's hash moves when an item turns fluent (so it resends); the mirror waits while the pictures index is on its way.
 *   · envcGridHtml: "⚡ f/n" in the station's cell when the summary has it; an old summary (no flash) draws the cell as before;
 *     the legend names it.
 *   · ⚡ ID Flash's saved sitting calls the mirror's hook (envMirrorOn("study")); a dry run does not.
 * run: node test_cp_class_fluent.js
 */
const fs = require("fs"), path = require("path");
const src = require("./test_src.js")(path.join(__dirname, "index.html"));
const { world: siteWorld } = require("./test_env_site.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const slice = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const MIR = slice("// ENVMIRROR_START", "// ENVMIRROR_END");
const tierFn = src.slice(src.indexOf("function mastTierAtLeast(tier,gateTier){"), src.indexOf("}", src.indexOf("return a>=b;", src.indexOf("function mastTierAtLeast(tier,gateTier){"))) + 1);

console.log("── placement ──");
ok("envmFlash is in the ENVMIRROR block, called once from envSummary (guarded field)", MIR.split("function envmFlash(").length === 2 && MIR.split("const fl=envmFlash(kid,M,decks,ctx); if(fl) out.flash=fl;").length === 2);
ok("envsStationFlash once, used by the grid cell", src.split("function envsStationFlash(").length === 2 && src.split("const fx=envsStationFlash(sm,st);").length === 2);
ok("ID Flash's saved sitting calls envMirrorOn(\"study\") inside its live branch", /if\(live\)\{ db\.ref\("mastery\/"\+kid\+"_idflash"\)\.update\(upd\);[^\n]*\n    if\(typeof envMirrorOn==="function"\) envMirrorOn\("study"\); \}/.test(src));
ok("no Howe kid name as a code literal in the new code", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(MIR));

// ── the mirror's envSummary in a small world (the test_env_mirror shape) ──
function mirror(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, picsIdx: o.picsIdx === undefined ? null : o.picsIdx, picsP: o.picsP || null };
  return new Function("G", "tierFn", `
    const window={ HA_FAMILY:{ familyId:"howe", roster:[] } }; const masteryData=G.masteryData; let unitStudies=G.unitStudies; let _haUnitsReady=true;
    const HA_LS={ getItem(){ return null; }, setItem(){}, removeItem(){} }; const setTimeout=()=>0, clearTimeout=()=>{}; const document={ getElementById:()=>null };
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s; } function gwShowToast(){} function renderAllSoon(){}
    const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const MAST_MASTERY_TIER_DEFAULT="monthly";
    ${tierFn}
    const ENV_UNIT_ID="nc_envirothon"; function envCardsInCode(u){ return !!(u&&u.cardsInCode&&(u.starter===ENV_UNIT_ID||u.id===ENV_UNIT_ID)); }
    function mastDefKey(p){ p=String(p); return /[.#$\\[\\]\\/]/.test(p)?p.replace(/[.#$\\[\\]\\/%]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")):p; }
    let _envPicsP=G.picsP; function envPicsIndex(){ return G.picsIdx; }
    function envPicsFor(deck,name){ const idx=G.picsIdx; if(!idx||!/\\u00b7 ID$/.test(deck)) return null; const a=idx[name]; return (Array.isArray(a)&&a.length)?a:null; }
    ${MIR}
    return { envSummary, envmHash, envmWaiting, envmFlash, G };`)(G, tierFn);
}
const ID = "Wildlife · ID", TERMS = "Wildlife · Terms";
function unit() {
  return { nc_envirothon: { id: "nc_envirothon", starter: "nc_envirothon", starterVer: 1, cardsInCode: true, enrolled: { kidA: true },
    decks: [
      { key: TERMS, station: "wildlife", stage: 4, kind: "terms", n: 1, cards: [{ name: "Habitat", family: "Basics" }] },
      { key: ID, station: "wildlife", stage: 4, kind: "id", n: 6, cards: [
        { name: "Beaver · tracks", item: "Beaver" }, { name: "Beaver · diet", item: "Beaver" }, { name: "Otter · fur", item: "Otter" },
        { name: "Mink · den", item: "Mink" }, { name: "St. Francis satyr · wings", item: "St. Francis satyr" }, { name: "Heron · legs" }] }] } };
}
const PICS = { "Beaver · tracks": [{ url: "b1" }], "Beaver · diet": [{ url: "b1" }], "Otter · fur": [{ url: "o1" }], "St. Francis satyr · wings": [{ url: "s1" }], "Heron · legs": [{ url: "h1" }] };   // Mink has no picture
const NOW = Date.UTC(2026, 10, 17, 15, 0, 0);

console.log("\n── summary.flash ──");
{
  const W = mirror({ unitStudies: unit(), picsIdx: PICS });
  const U = W.G.unitStudies.nc_envirothon;
  const s0 = W.envSummary("kidA", { M: {}, u: U, now: NOW });
  ok("a kid with no ID Flash data: no flash field at all", !("flash" in s0));
  const s0b = W.envSummary("kidA", { M: { kidA_idflash: {} }, u: U, now: NOW });
  ok("… nor with an empty idflash node (same hash as no node)", !("flash" in s0b) && W.envmHash(s0b) === W.envmHash(s0));
  const st = (fluent) => ({ shows: [{ pic: "b1", ok: true, secs: 2, at: 1, mode: "pick" }], fluent, at: 1 });
  const M = { kidA_idflash: { [ID]: { Beaver: st(true), Otter: st(false), Mink: st(true), ["St%2E Francis satyr"]: st(true) } } };
  const before = JSON.stringify(M);
  const s1 = W.envSummary("kidA", { M, u: U, now: NOW });
  ok("flash.<ID deck> = {f, n}: 4 pictured items (Mink unpictured), 2 fluent (a fluent unpictured item does not count)", s1.flash && JSON.stringify(s1.flash) === JSON.stringify({ [ID]: { f: 2, n: 4 } }), s1.flash);
  ok("the item key is ID Flash's own (mastDefKey: a '.' in the name is coded)", s1.flash[ID].f === 2);
  ok("PURE: masteryData is not touched", JSON.stringify(M) === before);
  ok("a Terms deck never appears; only decks the kid has state in", Object.keys(s1.flash).join() === ID);
  const s1p = W.envSummary("kidA", { M, u: U, now: NOW, pics: { "Beaver · tracks": [{ url: "x" }], "Otter · fur": [{ url: "y" }] } });
  ok("ctx.pics in place of the pictures in memory (2 pictured, 1 fluent)", JSON.stringify(s1p.flash) === JSON.stringify({ [ID]: { f: 1, n: 2 } }), s1p.flash);
  const M2 = JSON.parse(before); M2.kidA_idflash[ID].Otter.fluent = true;
  const s2 = W.envSummary("kidA", { M: M2, u: U, now: NOW });
  ok("a newly fluent item moves the count (3/4) and the hash, so the summary resends", s2.flash[ID].f === 3 && W.envmHash(s2) !== W.envmHash(s1));
  ok("everything else in the summary is the same with or without the field", (() => { const a = Object.assign({}, s1); delete a.flash; return JSON.stringify(a) === JSON.stringify(s0); })());
  const Wn = mirror({ unitStudies: unit(), picsIdx: null });
  ok("no pictures in memory (index not loaded / failed): no field, never a wrong total", !("flash" in Wn.envSummary("kidA", { M, u: Wn.G.unitStudies.nc_envirothon, now: NOW })));
  const Mz = { kidA_idflash: { [ID]: { Otter: st(false) } } };
  ok("zero-safe: shows but nothing fluent yet → {f:0, n:4}", JSON.stringify(W.envSummary("kidA", { M: Mz, u: U, now: NOW }).flash) === JSON.stringify({ [ID]: { f: 0, n: 4 } }));
  ok("a deck still loading (no cards array) is skipped", W.envmFlash("kidA", M, [{ key: ID, kind: "id", n: 6 }], {}) === null);
}

console.log("\n── the mirror waits for the pictures index ──");
{
  const W1 = mirror({ unitStudies: unit(), picsIdx: null, picsP: {} });
  ok("index on its way (_envPicsP set, no index yet) → envmWaiting true", W1.envmWaiting() === true);
  const W2 = mirror({ unitStudies: unit(), picsIdx: PICS, picsP: {} });
  ok("index here → not waiting", W2.envmWaiting() === false);
  const W3 = mirror({ unitStudies: unit(), picsIdx: null, picsP: null });
  ok("index failed or never asked for (_envPicsP null) → not waiting (the mirror never stalls on it)", W3.envmWaiting() === false);
}

console.log("\n── 📋 the Class tab (envcGridHtml, the demo class) ──");
{
  const FAM = { familyId: "envirothon", edition: "envirothon", className: "MS Science 2026-27", roster: [] };
  const demo = () => { const w = siteWorld({ fam: FAM, search: "?demo=1&role=teacher" }); w.envSiteDemoBoot(); w.renderAll(); return w; };
  const w = demo(); const h0 = w.envcGridHtml();
  const row = (h, name) => { const i = h.indexOf(">" + name + "<"); return h.slice(i, h.indexOf("</tr>", i)); };
  const tbody = h => h.slice(h.indexOf("<tbody>"), h.indexOf("</tbody>"));
  ok("old summaries (no flash): no ⚡ anywhere in the grid's rows", !/⚡/.test(tbody(h0)));
  ok("the legend names it: ⚡ ID Flash fluent / pictured", h0.includes("% right in the last 14 days · ⚡ ID Flash fluent / pictured · "));
  const maya = w.envcStudents().find(s => s.sid === "ramirez_maya");
  maya.summary.flash = { "Forestry · ID": { f: 24, n: 24 }, "Aquatic Ecology · ID": { f: 3, n: 40 } };
  const h1 = w.envcGridHtml(), r1 = row(h1, "Maya R."), r0 = row(h0, "Maya R.");
  ok("Maya's Forestry cell gains ⚡24/24 after its % and 14-day right", /<b>100%<\/b> <span class="envs-muted">·\d+%<\/span> <span class="envs-muted" title="ID Flash: fluent of the pictured items">⚡24\/24<\/span>/.test(r1), r1.replace(/<[^>]+>/g, " ").slice(0, 300));
  ok("Aquatics (sent out to her, 0% so far) shows its ⚡3/40 too; nothing else in her row changes (the ⚡ bits removed → the old row)", /<b>0%<\/b> <span class="envs-muted" title="ID Flash: fluent of the pictured items">⚡3\/40<\/span>/.test(r1) && r1.replace(/ <span class="envs-muted" title="ID Flash: fluent of the pictured items">⚡\d+\/\d+<\/span>/g, "") === r0 && (r1.match(/⚡/g) || []).length === 2);
  maya.summary.flash = { "Wildlife · ID": { f: 5, n: 35 } };
  ok("a station not sent out ('–') never shows ⚡, even with data", row(w.envcGridHtml(), "Maya R.") === r0);
  ok("other students' rows are byte-identical", w.envcStudents().filter(s => s.sid !== "ramirez_maya" && s.meta && s.meta.name).every(s => row(h1, s.meta.name) === row(h0, s.meta.name)));
  maya.summary.flash = { "Forestry · ID": { f: 0, n: 0 } };
  ok("a station whose count is 0 of 0 shows nothing", row(w.envcGridHtml(), "Maya R.") === r0);
}

console.log("\n── ⚡ ID Flash's saved sitting → envMirrorOn(\"study\") ──");
{
  const block = slice("// ENVIDFLASH_START", "// ENVIDFLASH_END");
  const mk = dry => { const G = { mirror: [], writes: [], dry }; const db = { ref(p) { return { update(v) { G.writes.push(p); }, set(v) { G.writes.push(p); } }; } };
    const api = new Function("G", "db", `const masteryData={}; let unitStudies={}; function _dryRun(){ return G.dry; } function _mastRe(){} function mstTodayKey(){ return "20261117"; }
      function envMirrorOn(w){ G.mirror.push(w); }
      ${block}
      return { start(){ envFlash={kid:"kidA",deckKeys:["X · ID"],mode:"pick",cards:[],i:0,startedAt:Date.now(),results:[{deck:"X · ID",item:"Fox",key:"Fox",pic:"p",ok:true,secs:2,at:1,mode:"pick"}],done:null,timer:null,dry:G.dry,keep:false}; return envFlashFinish(); } };`)(G, db);
    return { G, api }; };
  const L = mk(false); L.api.start();
  ok("live: the two writes, then one envMirrorOn(\"study\")", L.G.writes.length === 2 && JSON.stringify(L.G.mirror) === '["study"]');
  const D = mk(true); D.api.start();
  ok("dry run: no write, no mirror call", D.G.writes.length === 0 && D.G.mirror.length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
