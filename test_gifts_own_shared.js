/*
 * Node tests for 🎁 Gifts OWNSHARED (her ask + yes 2026-11-20): a kid's page counts 👤 just theirs vs 🤝 shared and filters by it,
 * then by how many kids share it; the People row shows the split; opens on All every time; display only, no writes.
 *
 *   run:  node test_gifts_own_shared.js
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



const D = () => ({ occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25",
    secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 } } } },
  items: {
    a: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Doll", status: "here", paid: 20 },
    b: { occ: "x", pids: ["k_lucy"], sec: "special", name: "Bike", status: "idea", plan: 100 },
    c: { occ: "x", pids: ["k_lucy", "k_ellis", "k_lincoln", "k_julian"], sec: "special", name: "Trampoline", status: "ordered", paid: 300 },
    d: { occ: "x", pids: ["k_lucy", "k_ellis", "k_lincoln", "k_julian"], sec: "parents", name: "Board game", status: "here", paid: 40 },
    e: { occ: "x", pids: ["k_lucy", "k_ellis"], sec: "parents", name: "Walkie talkies", status: "here", paid: 30 },
    f: { occ: "x", pids: ["k_lucy", "k_ellis", "k_julian"], sec: "parents", name: "Marble run", status: "here", paid: 45 },
    g: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Returned hat", status: "returned", paid: 9 },
    h: { occ: "x", pids: ["k_julian"], sec: "parents", name: "Dino", status: "here", paid: 15 } } });

console.log("\n# 👤 just theirs vs 🤝 shared on a kid's page (her ask + yes 2026-11-20)");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("people"); let h = root.innerHTML;
  ok("People row: Lucy 6 presents · 👤 2 own · 🤝 4 shared", /Lucy<span class="gf-pc">6 presents · 👤 2 own · 🤝 4 shared/.test(h), (h.match(/Lucy<span class="gf-pc">[^<]*/) || [])[0]);
  W.gfOpenPerson("k_lucy"); h = root.innerHTML;
  ok("Lucy's header: 6 presents · 👤 2 just theirs · 🤝 4 shared (the returned hat doesn't count)", /6 presents · 👤 2 just theirs · 🤝 4 shared/.test(h));
  ok("filter row: All (6) · 👤 Just theirs (2) · 🤝 Shared (4); opens on All", /class="gf-vw on" onclick="gfShareSet\('all'\)">All \(6\)/.test(h) && /👤 Just theirs \(2\)/.test(h) && /🤝 Shared \(4\)/.test(h));
  ok("All shows everything", ["Doll", "Bike", "Trampoline", "Board game", "Walkie talkies", "Marble run"].every(n => h.includes(n)));
  W.gfShareSet("own"); h = root.innerHTML;
  ok("👤 Just theirs → Doll + Bike only", /Doll/.test(h) && /Bike/.test(h) && !/Trampoline|Board game|Walkie|Marble run/.test(h));
  W.gfShareSet("shared"); h = root.innerHTML;
  ok("🤝 Shared → the 4 shared, and a size row: All shared · With everyone (4) · 2 · 3 kids · 1 · 2 kids · 1", !/>Doll</.test(h) && /Trampoline/.test(h) && /Walkie talkies/.test(h) && /All shared/.test(h) && /With everyone \(4\) · 2/.test(h) && /3 kids · 1/.test(h) && /2 kids · 1/.test(h));
  W.gfShareSize(4); h = root.innerHTML;
  ok("With everyone → Trampoline + Board game only", /Trampoline/.test(h) && /Board game/.test(h) && !/Walkie|Marble run/.test(h));
  W.gfShareSize(2); h = root.innerHTML;
  ok("2 kids → Walkie talkies only", /Walkie talkies/.test(h) && !/Trampoline|Marble run/.test(h));
  ok("an empty section under a filter says so", /None of these here\./.test(h));
  W.gfBack(); W.gfOpenPerson("k_lucy");
  ok("opening a kid again starts on All", /class="gf-vw on" onclick="gfShareSet\('all'\)"/.test(root.innerHTML));
  W.gfOpenPerson("k_lincoln"); h = root.innerHTML;
  ok("Lincoln: 2 presents, both shared — Just theirs (0)", /2 presents · 👤 0 just theirs · 🤝 2 shared/.test(h) && /👤 Just theirs \(0\)/.test(h));
  reset({ occasions: D().occasions, items: { z: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Solo", status: "idea" } } }); T.setOcc("x"); W.gfOpenPerson("k_lucy");
  ok("a kid with nothing shared gets no filter row", !/gfShareSet/.test(root.innerHTML));
  reset(D()); ok("money unchanged: Lucy = doll 20 + ¼ trampoline 75 + ¼ game 10 + ½ walkies 15 + ⅓ marble run 15 = 135", T.personTot("x", "k_lucy").paid === 135, T.personTot("x", "k_lucy").paid);
  writes.length = 0; reset(D()); T.setOcc("x"); W.gfOpenPerson("k_lucy"); W.gfShareSet("shared"); W.gfShareSize(4);
  ok("filters write nothing", writes.length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
