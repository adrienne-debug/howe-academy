/*
 * Node tests for 🧭 toy-bin placement — Stage A2b (2026-09-14), the PLACE block in play.js.
 *   · only known slot codes are accepted (exact, dashed slot, glued shelf, unit prefix)
 *   · prompt = rules + slot dictionary + occupancy (bin itself excluded) + the bin line
 *   · a proposal is parsed and shown; NOTHING written until ✓; ✓ = plMetaSet(id,"loc",code) — one leaf
 *   · alternates equal to the main pick are dropped; bad answer → message, no write; Mom gate
 *   · Check the room: ids resolved, unknown/unchanged/bad-target moves dropped, per-row ✓ = one leaf write
 *   · Room setup wiring: 🧭 chip per row, plan card under the row, check bar above the list
 *
 *   run:  node test_play_place.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "play.js"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function slice(startsWith, endMarker) { const i = src.indexOf(startsWith); if (i < 0) { console.error(startsWith + " not found"); process.exit(1); } const j = src.indexOf(endMarker, i); return src.slice(i, j + endMarker.length); }
const fdesc = slice("const PL_FDESC=", "\n");
const locdesc = slice("function plLocDesc(loc){", "return loc;}");
const block = slice("// PLACE_START", "// PLACE_END");
ok("PLACE block present", block.length > 1000);

const writes = [], renders = { n: 0 }; let reply = null, lastPrompt = "", fetchCalls = 0;
const CAT = [
  { id: "CLX-1", name: "Clixo", cat: "magna-tiles", loc: "F1", "pl-intents": ["build"] },
  { id: "MAG-1", name: "Magna-Tiles", cat: "magna-tiles", loc: "F1" },
  { id: "DUP-1", name: "DUPLO", cat: "littles-build", loc: "F3" },
  { id: "SCI-2", name: "Snap Circuits", cat: "science", loc: "" },
  { id: "ART-9", name: "Watercolors", cat: "art", loc: "CONFIRM" },
];
const meta = {};
const ctx = { console, Date, JSON, Promise, String, Array, Object, window: {},
  PL_CATALOG: CAT, plBinMeta: {}, plFB: true, plMomAuthed: () => ctx._mom, _mom: true,
  plMeta: id => ({ loc: meta[id] || null, kids: [], rot: true, cull: "watch", _src: meta[id] ? "set" : "none" }),
  plMetaSet: (id, f, v) => { writes.push({ id, f, v }); meta[id] = v; },
  plBinName: c => c.name, plRender: () => { renders.n++; }, plChip: (l, on, col, click) => '<button onclick="' + click + '">' + l + '</button>',
  db: { ref: p => ({ once: () => Promise.resolve({ val: () => (p === "library/rules" ? { md: "Magna-tiles live in F1. Science in F2. Kid-reach = W3." } : null) }) }) },
  mastAIKey: "k", fetch: (u, o) => { fetchCalls++; lastPrompt = JSON.parse(o.body).messages[0].content; return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ type: "text", text: typeof reply === "string" ? reply : JSON.stringify(reply) }] }) }); } };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fdesc + "\n" + locdesc + "\n" + block, ctx);
const T = n => vm.runInContext(n, ctx);
const tick = () => new Promise(r => setTimeout(r, 5));

(async () => {
  console.log("\n# slot codes");
  { const K = T("plLocKnown");
    ok("exact / dashed slot / glued shelf / unit prefix accepted, junk refused", K("f2") === "F2" && K("MK-3") === "MK-3" && K("BG-L1") === "BG-L1" && K("CART-LIN-2") === "CART-LIN-2" && K("ZZ-9") === "" && K("") === "");
    ok("needs-a-spot: empty and CONFIRM, not a real slot", T("plNeedsSpot")(CAT[3]) && T("plNeedsSpot")(CAT[4]) && !T("plNeedsSpot")(CAT[0])); }
  console.log("\n# occupancy + prompt");
  { const occ = T("plOccupancy")("CLX-1");
    ok("grouped by effective slot with counts, bin excluded, nowhere listed", /^F1 \(.*\) \[1\]: Magna-Tiles \{magna-tiles\}/m.test(occ) && /NOWHERE \[1\]: Snap Circuits/.test(occ) && !/Clixo/.test(occ), occ);
    meta["DUP-1"] = "T1"; ok("override beats the catalog default", /T1 .*DUPLO/.test(T("plOccupancy")()));
    const p = T("plPlacePrompt")(CAT[0], "RULES-HERE");
    ok("prompt = rules + slot dictionary + occupancy + bin line + strict JSON ask", /HER ROOM RULES ===\nRULES-HERE/.test(p) && /SLOT CODES/.test(p) && /F1 = the low frame/.test(p) && /THE BIN ===\nClixo · id CLX-1 · category magna-tiles · used for build/.test(p) && /now: F1 = the low frame/.test(p) && /Return ONLY strict JSON/.test(p)); }
  console.log("\n# proposal → ✓");
  { writes.length = 0; fetchCalls = 0;
    reply = "Sure:\n{\"loc\":\"f2\",\"reason\":\"Science lives in F2 <b>\",\"alternates\":[{\"loc\":\"F2\",\"why\":\"dup of main\"},{\"loc\":\"W3\",\"why\":\"kid reach\"},{\"loc\":\"NOPE\",\"why\":\"junk\"}]}";
    await ctx.plPlace("SCI-2"); await tick();
    const p = T("plPlan")["SCI-2"];
    ok("one call (rules fetched from library/rules); proposal parsed; alt = main and junk dropped", fetchCalls === 1 && /Kid-reach = W3/.test(lastPrompt) && p && p.loc === "F2" && p.alternates.length === 1 && p.alternates[0].loc === "W3", p);
    ok("nothing written by the proposal", writes.length === 0);
    const h = T("plPlanHtml")("SCI-2");
    ok("card: proposal + desc, reason escaped, ✓ Place, alternate, ✕", /Proposed: F2 — the MIDDLE low frame/.test(h) && /&lt;b>/.test(h) && /plPlaceApply\('SCI-2',-1\)/.test(h) && /plPlaceApply\('SCI-2',0\)/.test(h) && /nothing moves until you tap/.test(h), h.slice(0, 200));
    ctx.plPlaceApply("SCI-2", -1);
    ok("✓ = exactly plMetaSet(id,'loc','F2'), proposal cleared, re-rendered", writes.length === 1 && writes[0].id === "SCI-2" && writes[0].f === "loc" && writes[0].v === "F2" && !T("plPlan")["SCI-2"] && renders.n > 0, writes);
    writes.length = 0; reply = { loc: "F1", reason: "already" }; await ctx.plPlace("CLX-1"); await tick();
    ok("already there → no ✓ offered", /Already in the right slot/.test(T("plPlanHtml")("CLX-1")) && !/plPlaceApply\('CLX-1',-1\)/.test(T("plPlanHtml")("CLX-1")));
    reply = "no idea"; await ctx.plPlace("MAG-1"); await tick();
    ok("bad answer → message, no plan, no write", !T("plPlan")["MAG-1"] && /❌/.test(T("plPlanHtml")("MAG-1")) && writes.length === 0);
    ctx._mom = false; fetchCalls = 0; await ctx.plPlace("DUP-1"); await tick();
    ok("Mom gate: no call without the code", fetchCalls === 0 && !T("plPlan")["DUP-1"]); ctx._mom = true; }
  console.log("\n# check the room");
  { writes.length = 0;
    reply = { moves: [{ id: "clx-1", to: "F2", why: "science shelf" }, { id: "MAG-1", to: "F1", why: "unchanged" }, { id: "NOPE-1", to: "F2", why: "?" }, { id: "DUP-1", to: "ZZ", why: "bad target" }, { name: "Watercolors", to: "CAB", why: "art supplies" }] };
    await ctx.plRoomCheckRun(); await tick();
    const M = T("plRoomCheck");
    ok("moves: id case-folded, unchanged / unknown / bad-target dropped, name match works", M && !M.busy && M.moves.map(m => m.id + "→" + m.to).join() === "CLX-1→F2,ART-9→CAB", M);
    const h = T("plRoomCheckHtml")();
    ok("bar: check button + needs-a-spot count + 2 moves with ✓ each; nothing written", /plRoomCheckRun\(\)/.test(h) && /<b>1<\/b> bin without/.test(h) && /2 suggested moves/.test(h) && /plRoomMoveApply\(1\)/.test(h) && writes.length === 0, h.slice(0, 300));
    ctx.plRoomMoveApply(0);
    ok("✓ = one leaf write for that bin; row gone", writes.length === 1 && writes[0].id === "CLX-1" && writes[0].v === "F2" && T("plRoomCheck").moves.length === 1); }
  console.log("\n# Room setup wiring");
  { const r = src.slice(src.indexOf("function plRoomHtml(){"), src.indexOf("function plRoomHtml(){") + 4000);
    ok("🧭 chip beside 📍 on every row; plan card under the row", /plPlace\('"\+c\.id\+"'\)/.test(r) && /'<\/div>'\+plPlanHtml\(c\.id\)\+'<\/div>'/.test(r));
    ok("check bar drawn above the rows", /plRoomCheckHtml\(\)\+\s*rows/.test(r)); }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
