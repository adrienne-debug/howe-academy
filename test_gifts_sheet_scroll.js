/*
 * Node tests for 🎁 Gifts SHEETSCROLL (her report 2026-11-20, adding a receipt: "every time I click something, it jumps it back
 * up to the top"): a redraw keeps the open pop-up's scroll place when the SAME pop-up is still open; a different pop-up (or a
 * fresh one) starts at the top.
 *
 *   run:  node test_gifts_sheet_scroll.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
// every innerHTML write = a brand-new pop-up element (scrollTop 0), like the browser rebuilding it
let sheetEl = null, html = "";
const root = { id: "content", style: {}, get innerHTML() { return html; }, set innerHTML(v) { html = v; sheetEl = /class="gf-sh"/.test(v) ? { scrollTop: 0 } : null; }, querySelector() { return null; } };
const document = { getElementById(id) { return null; }, querySelector(q) { return q === ".gf-sh" ? sheetEl : null; }, createElement() { return { style: {} }; }, head: { appendChild() {} } };
const ctx = { console, Date, Math, JSON, document, db: null, _todayStr: () => "2026-11-20", _dryRun: () => true, momHere: () => true, gwShowToast() {}, confirm: () => true,
  HA_LS: { getItem: () => null, setItem() {} }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'a',name:'Kid A',color:'#2563eb'},{id:'b',name:'Kid B',color:'#16a34a'}];", ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8"), ctx);
const T = ctx._gfTest, W = ctx;
T.setData({ occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 } } } },
  items: { i1: { occ: "x", pids: ["k_a"], sec: "parents", name: "Kite", status: "idea" } } });
T.setOcc("x"); T.setRoot(root, "");

W.gfNewItem("k_a", "parents");
ok("a fresh pop-up opens at the top", sheetEl && sheetEl.scrollTop === 0);
sheetEl.scrollTop = 420; W.gfTogglePid("k_b");
ok("tapping a kid inside the SAME pop-up keeps its place (420)", sheetEl.scrollTop === 420, sheetEl && sheetEl.scrollTop);
sheetEl.scrollTop = 610; W.gfSetDraw("status", "ordered");
ok("…and again after a status tap (610)", sheetEl.scrollTop === 610);
W.gfCancel(); ok("closing the pop-up leaves no pop-up", sheetEl === null);
W.gfNewItem("k_a", "parents");
ok("opening a pop-up again starts at the top, not at the old place", sheetEl.scrollTop === 0);
W.gfCancel(); W.gfEditItem("i1"); sheetEl.scrollTop = 300; W.gfMove("i1");
ok("a DIFFERENT pop-up (↪ Move from the present) starts at the top", sheetEl.scrollTop === 0);
sheetEl.scrollTop = 150; W.gfTogglePid("k_b");
ok("…and keeps its own place once you scroll it", sheetEl.scrollTop === 150);
W.gfCancel(); W.gfRcptNew(); sheetEl.scrollTop = 900; W.gfRcAdd(); W.gfRcPid(0, "k_a");
ok("the receipt pop-up: ＋ a line, then picking a kid keeps the place (900)", sheetEl.scrollTop === 900);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
