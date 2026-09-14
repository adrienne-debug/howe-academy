/*
 * Node tests for 🗺 the Kallax map in Books (2026-09-14).
 *   · List | 🗺 Kallax toggle, remembered per device; map mode draws the 5×5 grid, no search box
 *   · each cube: lane colour bar from the plan (default plan until library/kallax is seeded), count,
 *     first 3 titles, "+n more"; drawers/no-book cubes hatched (⚠ if something is in one); over-cap red
 *   · ⚠ n = books whose subject lane differs from the cube's planned lane (Gathering / Mom's cubes exempt)
 *   · tap a cube → cube filter + panel listing its books (open the sheet); tap again clears
 *   · tiles: carts by tier, basket, to-shelve, online → jump to the list with that filter
 *   · cube filter works in the list and is cleared by "clear"; nothing here writes
 *
 *   run:  node test_library_map.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function el(id) { return { id, innerHTML: "", value: "", classList: { add() {}, remove() {}, contains() { return false; } }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("lib-root"); nodes["lib-root"] = root;
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, body: { appendChild() {} }, activeElement: null };
const writes = []; const store = {};
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p }); }, update(v) { writes.push({ op: "update", path: p }); }, push() { writes.push({ op: "push", path: p }); }, once() { return Promise.resolve({ val: () => null }); } }; } };
const ctx = { window: {}, document, db, console, setTimeout, Promise, URL: { createObjectURL: () => "", revokeObjectURL() {} }, Blob: function () {}, Image: function () {},
  HA_LS: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } }, gwShowToast() {}, alert() {}, APP_PIN: "1234", momPinUnlocked: true };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, "library.js"), "utf8"), ctx);
const T = ctx._lbTest;
const books = [];
for (let i = 1; i <= 27; i++) books.push({ id: "m" + i, title: "Math Book " + i, subject: "Math", status: "shelved", location: { kallax: "D5" } });
books.push({ id: "sp1", title: "AAS 2", subject: "Spelling", status: "in-use", kid: "lincoln", location: { cart: "lincoln", tier: 2, kallax: null } });
books.push({ id: "sp2", title: "SYS C", subject: "Spelling", status: "shelved", location: { kallax: "B4" } });
books.push({ id: "odd", title: "Story of the World", subject: "History", status: "shelved", location: { kallax: "B4" } });
books.push({ id: "gath", title: "Curiosity Chronicles", subject: "History", status: "in-use", location: { kallax: "C4" } });
books.push({ id: "drw", title: "Stray in a drawer", subject: "Art", status: "shelved", location: { kallax: "C3" } });
books.push({ id: "bask", title: "Read-aloud", subject: "Literature", status: "in-use", location: { kallax: "BASKET" } });
books.push({ id: "box", title: "New arrival", subject: "Science", status: "planned", location: { kallax: "BOX" } });
books.push({ id: "web", title: "Gen Genius", subject: "Science", status: "in-use", location: { kallax: "ONLINE" } });
T.setData(books, {});

console.log("\n# toggle");
{
  ok("default mode is list", T.mode() === "list");
  ctx.lbSetMode("map"); ok("map mode remembered per device", T.mode() === "map" && store.lb_mode === "map");
  ctx.renderLibrary(root);
  ok("map mode: grid drawn, no search box, both toggle buttons", /lb-mapgrid/.test(root.innerHTML) && !/lb-q/.test(root.innerHTML) && /lbSetMode\('list'\)/.test(root.innerHTML));
}
console.log("\n# cubes");
{
  const g = T.lbMapHTML();
  ok("25 cubes + row/col headers", (g.match(/class="lb-cube/g) || []).length === 25 && /lb-mh">A</.test(g) && /lb-mh">5</.test(g));
  const d5 = T.lbCubeHTML("D5");
  ok("D5: Math lane colour, count 27 in RED (over 25), 3 titles + '+24 more'", /background:#5692B4/.test(d5) && /lb-cn" style="background:#dc2626">27</.test(d5) && (d5.match(/lb-ct/g) || []).length === 3 && /\+24 more/.test(d5) && /Math<\/span>/.test(d5), d5.slice(0, 300));
  const b4 = T.lbCubeHTML("B4");
  ok("B4: Phonics lane, 2 books, ⚠1 (history book in the phonics cube)", /background:#EDA1A1/.test(b4) && /">2</.test(b4) && /⚠1/.test(b4), b4);
  ok("C4 Gathering cube: sticker colour, no ⚠ (not a subject lane)", /background:#DAB162/.test(T.lbCubeHTML("C4")) && !/⚠/.test(T.lbCubeHTML("C4")));
  ok("C3 drawer with a stray book → warn cube + ⚠ no-book cube", /lb-cube warn/.test(T.lbCubeHTML("C3")) && /no-book cube/.test(T.lbCubeHTML("C3")));
  ok("D3 empty drawer hatched, A1 ✕", /lb-cube x/.test(T.lbCubeHTML("D3")) && /drawer/.test(T.lbCubeHTML("D3")) && /✕/.test(T.lbCubeHTML("A1")));
  ok("empty real cube marked empty", /lb-cube empty/.test(T.lbCubeHTML("E1")));
  ok("legend lists every planned lane once; shelf count 31", /Phonics · Spelling/.test(g) && /The Gathering/.test(g) && (g.match(/Math<\/span>/g) || []).length >= 1 && /31 on the shelf/.test(g));
}
console.log("\n# tap → panel + filter");
{
  ctx.lbMapPick("B4");
  ok("cube filter set + panel shows the 2 books, the off-lane one flagged", T.lbF.cube === "B4" && /🗄 B4/.test(root.innerHTML) && /2 books/.test(root.innerHTML) && /Story of the World/.test(root.innerHTML) && /⚠ History/.test(root.innerHTML) && /lbOpen\('sp2'\)/.test(root.innerHTML));
  ok("selected cube highlighted", /lb-cube sel/.test(root.innerHTML));
  ctx.lbMapPick("B4"); ok("tap again clears", T.lbF.cube === "" && !/lb-cubepanel/.test(root.innerHTML));
  ctx.lbMapPick("D5"); ok("over-cap panel says so", /over 25/.test(root.innerHTML));
  ctx.lbSetMode("list");
  ok("list keeps the cube filter and shows the chip; matches only D5 books", T.mode() === "list" && /🗄 cube D5/.test(root.innerHTML) && /27 of 35 books/.test(root.innerHTML), root.innerHTML.match(/\d+ of \d+ books/));
  ctx.lbReset(); ok("clear resets the cube filter", T.lbF.cube === "" && /35 of 35 books/.test(root.innerHTML));
}
console.log("\n# tiles");
{
  ctx.lbSetMode("map");
  const g = root.innerHTML;
  ok("cart tile with tier counts, basket 1, to-shelve 1, online 1", /Lincoln&#39;s cart|Lincoln's cart/.test(g) && /t2:1/.test(g) && /Morning Basket<\/b><span[^>]*>1</.test(g) && /To shelve<\/b><span[^>]*>1</.test(g) && /Online<\/b><span[^>]*>1</.test(g), g.match(/lb-tile[^]{0,120}/g));
  ctx.lbMapTile("toshelve");
  ok("tile → list mode with that filter", T.mode() === "list" && T.lbF.loc === "toshelve" && /1 of 35 books/.test(root.innerHTML));
}
console.log("\n# plan node + no writes");
{
  T.setKallax({ lanes: { E1: "MATH" }, drawers: [], noBooks: [] });
  ok("a seeded library/kallax overrides the default plan", /background:#5692B4/.test(T.lbCubeHTML("E1")) && !/lb-cube x/.test(T.lbCubeHTML("D3")) && T.lbKal().lanes.E1 === "MATH");
  T.setKallax(null);
  ok("the map never writes", writes.length === 0, writes);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
