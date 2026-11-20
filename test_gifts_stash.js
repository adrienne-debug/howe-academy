/*
 * Node tests for 🎁 Gifts STASH (her ask + yes 2026-11-20): 📤 Send to… any holiday or 🗄 Hold for a future holiday; held presents leave
 * every holiday's totals but stay on 📍 Where; 🗄 Stash + a card on People bring them into any holiday (ONE update each).
 *
 *   run:  node test_gifts_stash.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null };
const writes = [], listens = [];
let dryRun = false, mom = true;
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on(ev, fn) { listens.push(p); } }; } };
const LS = {};
const ctx = { console, Date, Math, JSON, document, db, _todayStr: () => "2026-11-20", _dryRun: () => dryRun, momHere: () => mom, gwShowToast() {}, confirm: () => true,
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'lincoln',name:'Lincoln',color:'#2563eb'},{id:'ellis',name:'Ellis',color:'#16a34a'},{id:'lucy',name:'Lucy',color:'#db2777'},{id:'julian',name:'Julian',color:'#d97706'}];", ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8"), ctx);
const T = ctx._gfTest, W = ctx;
const reset = d => { writes.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; };



const D = () => ({ occasions: {
    x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", budget: 1000, secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 } } },
    b: { name: "Lucy's birthday 2027", kind: "birthday", date: "2027-03-02", for: "k_lucy", secs: { main: { name: "Main gift", emoji: "🎁", order: 0 }, small: { name: "Small things", emoji: "🧁", order: 1 } } } },
  items: {
    a: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Extra puzzle", status: "here", paid: 25, where: "Closet", rcpt: "r1", returnBy: "2027-01-31" },
    c: { occ: "x", pids: ["k_ellis"], sec: "special", name: "Kite", status: "here", paid: 40, where: "Garage" },
    d: { occ: "x", pids: ["k_julian"], sec: "parents", name: "Spare blocks", status: "wrapped", paid: 15, where: "Closet", paper: "Blue" } } });

console.log("\n# 📤 Send to… / 🗄 Hold for a future holiday (her ask + yes 2026-11-20)");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>");
  W.gfEditItem("a"); ok("the present sheet has ↪ Move to… and 📤 Send to…", /gfMove\('a'\)">↪ Move to…/.test(root.innerHTML) && /gfSendTo\('a'\)">📤 Send to…/.test(root.innerHTML));
  W.gfSendTo("a"); let h = root.innerHTML;
  ok("Send to: every open holiday + 🗄 Hold for a future holiday", /<option value="x" selected>Christmas 2026/.test(h) && /Lucy&#39;s birthday 2027/.test(h) && /<option value="_hold">🗄 Hold for a future holiday/.test(h));
  W.gfSetDraw("occ", "_hold"); h = root.innerHTML;
  ok("choosing Hold hides the person + section pickers and explains", /waits in 🗄 Stash/.test(h) && !/For \(tap everyone/.test(h));
  writes.length = 0; W.gfSave();
  const up = writes.find(w => w.op === "update" && w.path === "gifts/items/a").val;
  ok("Hold = ONE update {occ:_hold, heldFrom:x}; person, section, paid, receipt, where stay", up.occ === "_hold" && up.heldFrom === "x" && up.sec === "parents" && up.pids.join() === "k_lucy" && !("paid" in up) && T.data().items.a.paid === 25 && T.data().items.a.rcpt === "r1" && T.data().items.a.where === "Closet", up);
  ok("the log says it's on hold", writes.some(w => w.op === "push" && /🗄 On hold: Extra puzzle \(from Christmas 2026\)/.test(w.val.text)));
  const O = T.occTot("x"), L = T.personTot("x", "k_lucy");
  ok("it left Christmas: total 55 (not 80), Lucy 0 presents", O.paid === 55 && O.count === 2 && L.count === 0 && L.paid === 0, [O.paid, L.count]);
  W.gfGo("people"); h = root.innerHTML;
  ok("People shows the Stash card: 1 present on hold — bring any into Christmas 2026?", /You have <b>1 present on hold<\/b> — bring any into Christmas 2026\?/.test(h));
  W.gfGo("where"); h = root.innerHTML;
  ok("📍 Where still lists it (it's in the house), tagged 🗄 on hold", /Extra puzzle/.test(h) && /🗄 on hold/.test(h));
  W.gfGo("eve"); ok("🌙 Eve no longer counts it", !/Extra puzzle/.test(root.innerHTML));
  W.gfGo("closet"); h = root.innerHTML;
  ok("🗄 Stash: On hold card with paid, Bring in, and Bring all", /🗄 On hold/.test(h) && /1 · \$25 paid/.test(h) && /gfBringIn\('a'\)">Bring in/.test(h) && /Bring all 1 into Christmas 2026/.test(h));
}

console.log("\n# a new holiday pulls it back out");
{
  T.setOcc("b"); W.gfGo("people");
  ok("the birthday shows the Stash card too", /bring any into Lucy&#39;s birthday 2027\?/.test(root.innerHTML));
  writes.length = 0; W.gfBringIn("a");
  const up = writes.find(w => w.op === "update" && w.path === "gifts/items/a").val;
  ok("Bring in = ONE update {occ:b, sec: the birthday's first section (old one isn't there), heldFrom removed}", up.occ === "b" && up.sec === "main" && up.heldFrom === null && Object.keys(up).length === 3, up);
  ok("now it counts in the birthday: Lucy 1 present, $25", T.personTot("b", "k_lucy").count === 1 && T.personTot("b", "k_lucy").paid === 25);
  ok("the Stash is empty and the card is gone", T.held().length === 0 && !/on hold<\/b>/.test(root.innerHTML));
}

console.log("\n# hold several, bring all in; Send to another holiday directly");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>");
  ["c", "d"].forEach(id => { W.gfSendTo(id); W.gfSetDraw("occ", "_hold"); W.gfSave(); });
  ok("two on hold", T.held().length === 2);
  T.setOcc("b"); writes.length = 0; W.gfBringIn("c,d");
  ok("Bring all = one update per present", writes.filter(w => w.op === "update").length === 2 && T.held().length === 0);
  T.setOcc("x"); W.gfSendTo("a"); W.gfSetDraw("occ", "b"); W.gfSave();
  ok("Send to a holiday directly moves it there (no stop in the Stash)", T.data().items.a.occ === "b" && T.held().length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
