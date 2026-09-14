/*
 * Node tests for 🗺 the Room map in Toys (2026-09-14) — the ROOMMAP block in play.js.
 *   · no floorplan node → friendly message; with one → boxes positioned in % with labels
 *   · a box's count = bins whose effective slot is one of its units (unit, dashed slot, glued shelf)
 *   · decoration boxes (no codes) are not tappable; the Kallax box opens Books ▸ 🗺
 *   · tap → that unit becomes the Bins filter (added to the bar if it is not listed); the box highlights
 *   · toggle remembered per device; never writes
 *   · wiring: #pl-roommap in the shell, listener picks up play/floorplan, locbar has the 🗺 toggle
 *
 *   run:  node test_play_room.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "play.js"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function slice(a, b) { const i = src.indexOf(a); if (i < 0) { console.error(a + " not found"); process.exit(1); } const j = src.indexOf(b, i); return src.slice(i, j + b.length); }
const block = slice("// ROOMMAP_START", "// ROOMMAP_END");
const effloc = slice("function plEffLoc(c){", "}");
ok("ROOMMAP block present", block.length > 800);
const store = {}; const meta = {}; let renders = 0, subs = [];
const CAT = [
  { id: "CLX-1", name: "Clixo", cat: "magna", loc: "F1" }, { id: "MAG-1", name: "Magna-Tiles", cat: "magna", loc: "F1" },
  { id: "W-A", name: "Wall bin A", cat: "x", loc: "W3" }, { id: "MK-A", name: "Maker kit", cat: "maker", loc: "MK-3" },
  { id: "BG-A", name: "Project kit", cat: "kit", loc: "BG-L1" }, { id: "SH-A", name: "Finished build", cat: "kit", loc: "SHOW-R" },
  { id: "CART-A", name: "Lincoln daily", cat: "x", loc: "CART-LIN-3" }, { id: "NONE", name: "Nowhere", cat: "x", loc: "" },
];
const ctx = { console, String, Array, Object, JSON, window: {}, PL_CATALOG: CAT, plMeta: id => ({ loc: meta[id] || null }), plLocF: "F1", plMode: "bins", plRender() { renders++; },
  HA_LS: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, document: { getElementById: () => null }, plSetSub: v => { subs.push(v); }, lbSetMode: m => { subs.push("mode:" + m); } };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(effloc + "\n" + block, ctx);
const T = n => vm.runInContext(n, ctx);

console.log("\n# empty + toggle");
{
  ok("no floorplan → message", /No floorplan in the app yet/.test(T("plRoomMapHTML")()));
  ok("closed by default; toggle remembers", T("plRoomOpen") === false && (T("plRoomToggle")(), T("plRoomOpen") === true && store.lib_room === "1" && renders === 1));
}
console.log("\n# counts");
{
  ctx.plFloor = { boxes: {
    doors: { x: 31, y: 0, w: 45, h: 6, t: "French doors → patio", c: "" },
    f1: { x: 91, y: 25, w: 8.5, h: 11.6, t: "F1 🧲", c: "", codes: ["F1"] },
    f2: { x: 91, y: 36.7, w: 8.5, h: 12.6, t: "F2 daily\nW1-3 ⬆", c: "", codes: ["F2", "W1", "W2", "W3"] },
    maker: { x: 0, y: 50, w: 9, h: 10, t: "2×2 🖨 MAKER", c: "c-new", codes: ["MK"] },
    tank: { x: 90, y: 80, w: 9, h: 19, t: "🐟 tank\nBG shelves", c: "", codes: ["BG-L", "BG-R", "SHOW-L", "SHOW-R"] },
    cart_lincoln: { x: 72, y: 81, w: 8.5, h: 5, t: "🛒 Lincoln", c: "c-new", codes: ["CART-LIN"] },
    kallax: { x: 0, y: 18, w: 9, h: 32, t: "black Kallax 5×5", c: "", codes: ["KX"], books: true },
  } };
  vm.runInContext("plFloor=" + JSON.stringify(ctx.plFloor), ctx);
  const R = T("plRoomBins");
  ok("unit F1 → 2; F2 box counts its wall bins (W3) → 1; MK counts dashed slot MK-3 → 1", R(["F1"]).length === 2 && R(["F2", "W1", "W2", "W3"]).length === 1 && R(["MK"]).length === 1);
  ok("glued shelf BG-L1 + SHOW-R counted for the tank box; CART-LIN-3 for the cart", R(["BG-L", "BG-R", "SHOW-L", "SHOW-R"]).length === 2 && R(["CART-LIN"]).length === 1);
  meta["CLX-1"] = "T1"; ok("override moves a bin out of F1", R(["F1"]).length === 1); delete meta["CLX-1"];
  const h = T("plRoomMapHTML")();
  ok("boxes positioned in %, first label line only, counts shown, zero styled grey", /left:91%;top:25%;width:8.5%;height:11.6%/.test(h) && /F1 🧲<span class="pl-rn">2<\/span>/.test(h) && /F2 daily<span class="pl-rn">1/.test(h) && !/W1-3 ⬆<span/.test(h));
  ok("decoration box has no onclick and 'deco' class; Kallax box opens books", /pl-rbox deco[^>]*title="French doors → patio"/.test(h) && !/plRoomPick\('doors'\)/.test(h) && /books"[^>]*onclick="plRoomBooks\(\)"/.test(h) && /📚/.test(h));
  ok("current filter F1 highlights its box", /pl-rbox on[^>]*>F1/.test(h) || /class="pl-rbox on"/.test(h) || /pl-rbox on/.test(h));
  ok("style injected once", (h.match(/pl-roomstyle/g) || []).length === 1);
}
console.log("\n# tap");
{
  renders = 0; T("plRoomPick")("maker");
  ok("tap → filter = MK, re-rendered", T("plLocF") === "MK" && renders === 1);
  T("plRoomPick")("cart_lincoln");
  ok("a code the bar doesn't list is added for the session", T("plLocF") === "CART-LIN" && T("plLocExtra").indexOf("CART-LIN") >= 0);
  T("plRoomPick")("doors"); ok("decoration tap is a no-op", T("plLocF") === "CART-LIN");
  subs.length = 0; T("plRoomBooks")();
  ok("Kallax → Books map: mode remembered + switched + sub-tab", store.lb_mode === "map" && subs.join() === "mode:map,books");
}
console.log("\n# wiring");
{
  ok("#pl-roommap in the shell under the locbar", /<div id="pl-locbar"><\/div>\n<div id="pl-roommap"><\/div>/.test(src));
  ok("listener stores play/floorplan", /plFloor=v\.floorplan\|\|null;/.test(src));
  ok("locbar gets the 🗺 toggle; map rendered only in bins mode when open", /onclick="plRoomToggle\(\)"/.test(src) && /plMode=="bins"&&plRoomOpen/.test(src));
  ok("bar list extends with session extras", /\.concat\(plLocExtra\.filter/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
