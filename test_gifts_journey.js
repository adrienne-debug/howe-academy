/*
 * Node tests for 🎁 Gifts JOURNEY (her ask + "yes to all of those" 2026-11-20): bought → wrapped → 🎄 under the tree (home) or 🚗 packed
 * for a place → ✅ given. To wrap = everything bought; 📍 Needs a spot + Put in…; 🌙 Eve gathers home presents; 🚗 Going packs the rest;
 * each present's place (or its group's usual one); old orders default to 📦 here; every write one targeted update.
 *
 *   run:  node test_gifts_journey.js
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



const D = () => ({ occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 } } } },
  people: { "p-gma": { name: "Grandma", group: "mom" }, "p-dad": { name: "Dad", group: "house" } },
  groups: { mom: { giveAt: "Grandma's house" }, house: { name: "Our house", emoji: "👥", order: 56 } },
  items: {
    a: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Doll", status: "here", paid: 20, paper: "Pink" },
    b: { occ: "x", pids: ["k_ellis"], sec: "parents", name: "Kite", status: "ordered", paid: 30, paper: "Blue" },
    c: { occ: "x", pids: ["k_lucy"], sec: "special", name: "Bike", status: "wrapped", paid: 100, where: "Garage" },
    d: { occ: "x", pids: ["p-gma"], sec: "gifts", name: "Scarf", status: "wrapped", paid: 25, where: "Closet" },
    e: { occ: "x", pids: ["p-gma"], sec: "gifts", name: "Candle", status: "here", paid: 12 },
    f: { occ: "x", pids: ["p-dad"], sec: "gifts", name: "Wallet", status: "here", paid: 40 },
    g: { occ: "x", pids: ["k_julian"], sec: "parents", name: "Cousin swap toy", status: "wrapped", paid: 10, giveAt: "Cousins' party" },
    h: { occ: "x", pids: ["p-gma"], sec: "gifts", name: "Mug", status: "wrapped", paid: 8, giveAt: "home" } } });

console.log("\n# where each present is given: home, a place, or its group's usual place");
{
  reset(D()); T.setOcc("x"); const I = T.data().items;
  ok("a kid's present → home", T.atHome(I.a) && T.giveAt(I.a) === "");
  ok("Grandma's (Mom's side usually at Grandma's house) → that place", T.giveAt(I.d) === "Grandma's house" && !T.atHome(I.d));
  ok("a present's own place wins (cousins' party); 'home' on a present overrides the group", T.giveAt(I.g) === "Cousins' party" && T.atHome(I.h));
  ok("Dad (group with no usual place) → home", T.atHome(I.f));
  ok("the next step after 🎀 wrapped: home → 🎄 under the tree, away → 🚗 packed; then ✅ given", T.nextOf(I.c) === "out" && T.nextOf(I.d) === "packed" && T.nextOf({ status: "out" }) === "given" && T.nextOf({ status: "packed" }) === "given" && T.nextOf(I.a) === "wrapped");
}

console.log("\n# 🎀 To wrap = everything bought and not wrapped");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("wrap"); const h = root.innerHTML;
  ok("here AND ordered show; wrapped don't", /Doll/.test(h) && /Kite/.test(h) && /Candle/.test(h) && /Wallet/.test(h) && !/Bike/.test(h) && !/Scarf/.test(h));
  ok("the Blue roll (only an ordered one) has no 'wrapped' button; Pink does", /gfBulkIds\('a','wrapped'\)">All wrapped/.test(h) && !/gfBulkIds\('b'/.test(h));
}

console.log("\n# 📍 Where: needs a spot first · Put in… several at once");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("where"); let h = root.innerHTML;
  ok("📍 Needs a spot lists the in-house presents with no spot (Doll, Candle, Wallet, toy, Mug) before the spots", /📍 Needs a spot/.test(h) && h.indexOf("Needs a spot") < h.indexOf("📍 Garage") && /gfSpotPick\('a,e,f,g,h'\)/.test(h), (h.match(/gfSpotPick\('[^']*'\)/) || [])[0]);
  ok("the ordered Kite waits under 📦 Not here yet", /📦 Not here yet/.test(h) && h.indexOf("Not here yet") < h.lastIndexOf("Kite"));
  W.gfSpotPick("a,e"); ok("📍 Put in… asks for a spot and offers her old ones", /Where are these 2 going\?/.test(root.innerHTML) && /Garage/.test(root.innerHTML) && /Closet/.test(root.innerHTML));
  writes.length = 0; W.gfSave(); ok("no spot typed → nothing saved", writes.length === 0);
  W.gfSetDraw("where", "Closet"); writes.length = 0; W.gfSave();
  ok("Save = ONE update {where} per present + one log", writes.filter(w => w.op === "update").map(w => w.path + JSON.stringify(w.val)).join() === 'gifts/items/a{"where":"Closet"},gifts/items/e{"where":"Closet"}' && writes.filter(w => w.op === "push").length === 1);
  W.gfSelToggle(); W.gfPick("f"); ok("☑ Select bar offers 📍 Put in… for the picked ones", /gfSpotPick\('f'\)">📍 Put in…/.test(root.innerHTML));
}

console.log("\n# 🌙 Eve: home presents go 🎄 under the tree; ✅ All opened");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("eve"); let h = root.innerHTML;
  ok("gather lists only home presents (not Grandma's scarf, not the cousin toy); the Mug marked 'home' is in", /Doll/.test(h) && /Bike/.test(h) && /Mug/.test(h) && /Wallet/.test(h) && !/Scarf/.test(h) && !/Cousin swap toy/.test(h) && /0 of 4 under the tree/.test(h), (h.match(/Gather — [^<]*/) || [])[0]);
  writes.length = 0; W.gfGather("c");
  ok("tick = ONE update: status out (🎄 under the tree), not given", writes[0].val.status === "out" && writes[0].val.wasStatus === "wrapped" && /1 of 4 under the tree/.test(root.innerHTML));
  W.gfGather("h"); writes.length = 0; W.gfOpened("c,h");
  ok("✅ All opened = one update {status: given} each", writes.filter(w => w.op === "update").length === 2 && writes.filter(w => w.op === "update").every(w => w.val.status === "given") && T.data().items.c.status === "given");
}

console.log("\n# 🚗 Going: a packing list per place");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("going"); let h = root.innerHTML;
  ok("one card per place: Grandma's house (Scarf, Candle) + Cousins' party (toy); home ones aren't here", /🚗 Grandma&#39;s house/.test(h) && /🚗 Cousins&#39; party/.test(h) && /Scarf/.test(h) && /Candle/.test(h) && /Cousin swap toy/.test(h) && !/Doll/.test(h) && !/>Mug</.test(h));
  ok("Grandma's: 2 · 1 wrapped · 0 packed; the unwrapped Candle says so", /2 · 1 wrapped · 0 packed/.test(h) && /Candle<\/b>[^<]*(<[^>]*>)*[^<]*not wrapped/.test(h.replace(/\n/g, "")) || /not wrapped/.test(h));
  writes.length = 0; W.gfPack("d");
  ok("tick = ONE update: 🚗 packed, remembers wrapped", writes[0].path === "gifts/items/d" && writes[0].val.status === "packed" && writes[0].val.wasStatus === "wrapped" && /1 packed/.test(root.innerHTML));
  writes.length = 0; W.gfPack("d"); ok("untick = back to wrapped", writes[0].val.status === "wrapped" && writes[0].val.wasStatus === null);
  W.gfPack("d"); writes.length = 0; W.gfGivenAt("d,e");
  ok("✅ All given = one update {status: given} each", writes.filter(w => w.op === "update").length === 2 && T.data().items.d.status === "given" && T.data().items.e.status === "given");
  W.gfGo("where"); ok("📍 Where shows 🚗 Packed for / 🎄 Under the tree as their own spots", (() => { T.data().items.g.status = "packed"; T.data().items.c.status = "out"; T.draw(); const w = root.innerHTML; return /🚗 Packed for Cousins&#39; party/.test(w) && /🎄 Under the tree/.test(w); })());
}

console.log("\n# setting where it's given");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>");
  W.gfEditItem("f"); ok("the present sheet has 🎁 Given at with 🏠 Home + her places", /🎁 Given at/.test(root.innerHTML) && /🏠 Home/.test(root.innerHTML) && /🚗 Cousins&#39; party/.test(root.innerHTML));
  W.gfSetDraw("giveAt", "Cousins' party"); writes.length = 0; W.gfSave();
  ok("saved on the present (giveAt)", writes.find(w => w.op === "set").val.giveAt === "Cousins' party");
  W.gfEditItem("d"); ok("Grandma's present offers 'Usual — Grandma's house' and 🏠 Home", /Usual — Grandma&#39;s house/.test(root.innerHTML) && /gfSetDraw\('giveAt',&quot;home&quot;\)/.test(root.innerHTML)); W.gfCancel();
  W.gfGrpSecs("house"); ok("a group's ✏️ Sections sheet has 'Usually given at'", /Usually given at/.test(root.innerHTML));
  W.gfSet("giveAt", "Lake house"); writes.length = 0; W.gfSave();
  const g = writes.find(w => w.path === "gifts/groups/house");
  ok("group's usual place = ONE update {giveAt} on the group; Dad's wallet now goes to 🚗 Going", g && g.op === "update" && g.val.giveAt === "Lake house" && Object.keys(g.val).length === 1 && T.giveAt(T.data().items.e) === "Grandma's house" && !T.atHome({ pids: ["p-dad"] }));
}

console.log("\n# receipts: an old order has already come");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>");
  W.gfRcptNew(); T.rc.load(T.edit().form, { store: "Woot", date: "2026-05-26", orderNo: "211507345", total: 10, lines: [{ name: "Thing", price: 10 }] }, "x");
  ok("an order from May (with an order #) defaults to 📦 Here", T.edit().form.status === "here");
  W.gfCancel(); W.gfRcptNew(); T.rc.load(T.edit().form, { store: "Amazon", date: "2026-11-18", orderNo: "112-1", total: 10, lines: [{ name: "Thing", price: 10 }] }, "x");
  ok("an order from two days ago defaults to 🛒 On the way", T.edit().form.status === "ordered");
  W.gfCancel(); W.gfRcptNew(); T.rc.load(T.edit().form, { store: "Target", date: "2026-11-20", total: 10, lines: [{ name: "Thing", price: 10 }] }, "x");
  ok("a store receipt (no order #) is 📦 Here", T.edit().form.status === "here"); W.gfCancel();
}

console.log("\n# reminders count 🎄 / 🚗 as not given yet");
{
  const d = D(); d.items.c.status = "out"; d.items.d.status = "packed"; reset(d);
  const r = T.reminders("2027-01-03", 10).find(x => x.kind === "hidden");
  ok("Jan 3: the under-the-tree + packed ones still count as never marked given", r && r.n >= 2 && !/Bike|Scarf|Special/.test(r.text), r);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
