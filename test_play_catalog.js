/*
 * Node tests for the bin catalog as DATA (2026-09-14) — the CATALOG block in play.js.
 *   · no play/catalog node → the built-in table is untouched (inert)
 *   · a seeded node REPLACES the working list in place (same array object), ordered by `order`, retired excluded
 *   · DIFFERENTIAL: the seed built from the built-in table applies to an identical list (the live guarantee)
 *   · ➕ New bin: id from the name (prefix-n, unique), one set of play/catalog/<id>, appears in the list;
 *     blank name / unknown slot refused; 🗑 retire = one leaf write + removed from the list; Mom gate
 *   · Room setup wiring: form above the check bar, retire chip on rows only when live
 *
 *   run:  node test_play_catalog.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "play.js"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function slice(a, b) { const i = src.indexOf(a); if (i < 0) { console.error(a + " not found"); process.exit(1); } const j = src.indexOf(b, i); return src.slice(i, j + b.length); }
const catLine = (() => { const i = src.indexOf("const PL_CATALOG="); return src.slice(i, src.indexOf("\n", i)); })();
const block = slice("// CATALOG_START", "// CATALOG_END");
const locKnown = slice("function plLocKnown(code){", "return \"\";}");
ok("CATALOG block present", block.length > 1500);

function mk() {
  const writes = []; let renders = 0;
  const ctx = { console, String, Object, Array, Math, Date, JSON, window: {}, plFB: true, _mom: true, plMomAuthed: () => ctx._mom, plRender() { renders++; },
    PL_EMOJI: { "magna-tiles": "🧲", build: "🔧", math: "🔢" }, PL_FDESC: { F1: "the low frame", W2: "wall bin", MK: "maker" },
    plChip: (l, on, col, click) => '<button onclick="' + click.replace(/"/g, "&quot;") + '">' + l + '</button>', plBinName: c => c.name,
    alert: m => { ctx._alert = m; }, confirm: () => true, db: { ref: p => ({ set(v) { writes.push({ path: p, val: v }); } }) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(catLine + "\n" + locKnown + "\n" + block, ctx);
  return { ctx, writes, renders: () => renders, T: n => vm.runInContext(n, ctx) };
}

console.log("\n# inert without the node");
{
  const m = mk(); const before = m.T("PL_CATALOG.length"); const ref = m.T("PL_CATALOG");
  m.T("plCatalogApply")(null); m.T("plCatalogApply")({}); m.T("plCatalogApply")("junk");
  ok("built-in table untouched (" + before + " bins), not live", m.T("PL_CATALOG.length") === before && m.T("plCatalogLive") === false && m.T("PL_CATALOG") === ref);
}
console.log("\n# differential: seed from the built-in table applies to an identical list");
{
  const m = mk(); const builtin = JSON.parse(JSON.stringify(m.T("PL_CATALOG")));
  const seed = {}; builtin.forEach((c, n) => { seed[c.id] = Object.assign({}, c, { order: n }); });
  const ref = m.T("PL_CATALOG"); m.T("plCatalogApply")(seed);
  // photo null (code) vs "" (Firebase cannot store null) both mean "no photo" to plPhoto — equal here
  const canon = o => JSON.stringify(Object.keys(o).filter(k => k !== "order").sort().reduce((a, k) => (a[k] = (k === "photo" && !o[k]) ? "" : o[k], a), {}));
  const after = JSON.parse(JSON.stringify(m.T("PL_CATALOG")));
  ok("same array object, live", m.T("PL_CATALOG") === ref && m.T("plCatalogLive") === true);
  ok("71 bins, identical records (key order aside) in identical order", after.length === builtin.length && after.every((c, i) => canon(c) === canon(builtin[i])), [after.length, builtin.length]);
}
console.log("\n# order + retired");
{
  const m = mk();
  m.T("plCatalogApply")({ "B-2": { name: "Second", cat: "build", loc: "F1", order: 2 }, "B-1": { name: "First", cat: "build", loc: "F1", order: 1, ideas: { 0: ["x", 1] } }, "B-9": { name: "Gone", cat: "build", loc: "F1", order: 0, retired: true } });
  const L = m.T("PL_CATALOG");
  ok("ordered by order, retired excluded, ideas object → array, photo defaulted", L.map(c => c.id).join() === "B-1,B-2" && Array.isArray(L[0].ideas) && L[0].ideas.length === 1 && L[0].photo === "");
}
console.log("\n# ➕ New bin");
{
  const m = mk(); const seed = {}; m.T("PL_CATALOG").forEach((c, n) => { seed[c.id] = Object.assign({}, c, { order: n }); }); m.T("plCatalogApply")(seed);
  ok("id from the name: CLIXO-n is unique against CLX-1 (different prefix), then increments", m.T("plBinNewId")("Clixo") === "CLIX-1" && m.T("plBinNewId")("Magna Tiles") === "MAGN-1");
  ok("form: ➕ chip when live and no draft", /plBinDraft=\{name:''/.test(m.T("plBinAddHtml")()));
  m.ctx.plBinDraft = { name: "  Marble Run  ", cat: "build", loc: "w2" }; m.ctx.plBinAdd();
  const w = m.writes;
  ok("one set of play/catalog/MARB-1 with the full record shape", w.length === 1 && w[0].path === "play/catalog/MARB-1" && w[0].val.name === "Marble Run" && w[0].val.loc === "W2" && w[0].val.cat === "build" && Array.isArray(w[0].val.ideas) && typeof w[0].val.order === "number" && /^\d{4}-\d{2}-\d{2}$/.test(w[0].val.added), w[0]);
  ok("in the working list, draft cleared, re-rendered", m.T("PL_CATALOG").some(c => c.id === "MARB-1") && m.T("plBinDraft") === null && m.renders() > 0);
  w.length = 0; m.ctx.plBinDraft = { name: "", cat: "build", loc: "" }; m.ctx.plBinAdd(); ok("blank name refused", w.length === 0);
  m.ctx.plBinDraft = { name: "Thing", cat: "build", loc: "ZZ-9" }; m.ctx.plBinAdd(); ok("unknown slot refused with a message", w.length === 0 && /isn't one the room knows/.test(m.ctx._alert));
  m.ctx.plBinDraft = { name: "Thing", cat: "nope", loc: "" }; m.ctx.plBinAdd(); ok("unknown category falls back to build; blank slot allowed", w.length === 1 && w[0].val.cat === "build" && w[0].val.loc === "");
  w.length = 0; m.ctx.plBinRetire("MARB-1");
  ok("🗑 = one leaf write retired:true and removed from the list", w.length === 1 && w[0].path === "play/catalog/MARB-1/retired" && w[0].val === true && !m.T("PL_CATALOG").some(c => c.id === "MARB-1"));
  m.ctx._mom = false; w.length = 0; m.ctx.plBinDraft = { name: "X", cat: "build", loc: "" }; m.ctx.plBinAdd(); m.ctx.plBinRetire("CLX-1");
  ok("Mom gate: nothing written", w.length === 0 && m.T("PL_CATALOG").some(c => c.id === "CLX-1"));
}
console.log("\n# not live → no add/retire");
{
  const m = mk(); m.ctx.plBinDraft = { name: "X", cat: "build", loc: "" }; m.ctx.plBinAdd(); m.ctx.plBinRetire("CLX-1");
  ok("before the seed: form says so, nothing written", m.writes.length === 0 && /unlocks once the catalog is in the database/.test(m.T("plBinAddHtml")()));
}
console.log("\n# wiring");
{
  const r = src.slice(src.indexOf("function plRoomHtml(){"), src.indexOf("function plRoomHtml(){") + 5000);
  ok("form above the check bar; retire chip only when live", /plBinAddHtml\(\)\+\s*plRoomCheckHtml\(\)/.test(r) && /plCatalogLive\?plChip\("\\u\{1F5D1\}"/.test(r));
  ok("listener applies play/catalog before render; exports on window", /plCatalogApply\(v\.catalog\);/.test(src) && /window\.plBinAdd=plBinAdd;window\.plBinRetire=plBinRetire;/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
