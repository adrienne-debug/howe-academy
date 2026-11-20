/*
 * Node tests for 🎁 Gifts — slice 2 (2026-11-20, her "Yes, slice 2"): the Christmas views in gifts.js.
 *   · ⚖️ Even: kids side by side by dollars (paid + still planned) AND number of gifts; a shared present counts for each kid
 *     with their share; returned/dropped don't count; amber past her thresholds (default 15% / 2 gifts; ✏️ = ONE set)
 *   · 🎀 To wrap (here, by paper) · 📍 Where (in the house, by spot) · 📦 Coming (ordered, late first) · 🛍 Shop (ideas by store)
 *     · 🗄 Closet (for no one yet) — groups ignore upper/lower case
 *   · ☑ Select + a status = one targeted update per present; "All wrapped" the same
 *   · 🌙 Eve: gather tick = ONE update (given ↔ what it was); jobs from 🔋/🔧/🔌; her own lines; copy last time's list
 *   · new fields: due + needs
 *
 *   run:  node test_gifts_views.js
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
    secs: { santa: { name: "Santa", emoji: "🎅", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 } } } },
  items: {
    a: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Treehouse", status: "here", paid: 80, paper: "Pink snow", where: "Closet" },
    b: { occ: "x", pids: ["k_lucy", "k_ellis"], sec: "santa", name: "Trampoline", status: "ordered", paid: 300, due: "2026-11-15" },
    c: { occ: "x", pids: ["k_ellis"], sec: "stocking", name: "Socks", status: "idea", plan: 10, store: "Target" },
    d: { occ: "x", pids: ["k_lincoln"], sec: "parents", name: "Filament", status: "wrapped", paid: 60, paper: "Blue", where: "closet", needs: { batt: "AA ×4", build: true } },
    e: { occ: "x", pids: ["k_julian"], sec: "parents", name: "Dino", status: "here", paid: 20, paper: "pink snow", where: "Van" },
    f: { occ: "x", sec: "parents", name: "Spare puzzle", status: "here", paid: 15 },
    g: { occ: "x", pids: ["k_ellis"], sec: "stocking", name: "Candy", status: "ordered", paid: 5, due: "2026-12-10", store: "Target" },
    h: { occ: "x", pids: ["k_julian"], sec: "parents", name: "Returned", status: "returned", paid: 99 } } });

console.log("\n# ⚖️ Even — dollars AND count, shared counts for each kid");
{
  reset(D()); T.setOcc("x");
  const E = T.evenData("x"), by = Object.fromEntries(E.all.map(c => [c.pid, c]));
  ok("Lucy: 80 + half the trampoline = 230, 2 gifts", by.k_lucy.amt === 230 && by.k_lucy.count === 2, by.k_lucy);
  ok("Ellis: 150 + 10 planned + 5 = 165, 3 gifts", by.k_ellis.amt === 165 && by.k_ellis.count === 3, by.k_ellis);
  ok("Julian: returned present doesn't count — 20, 1 gift", by.k_julian.amt === 20 && by.k_julian.count === 1);
  const b = T.behind(E.all), ib = Object.fromEntries(E.all.map((c, i) => [c.pid, b[i]]));
  ok("default 15% / 2 gifts: Julian behind on both, Lucy not behind", ib.k_julian.amt && ib.k_julian.count && !ib.k_lucy.amt && !ib.k_lucy.count && ib.k_julian.gapA === 210, ib);
  ok("Ellis: 28% behind in dollars, but only 0 gifts behind", ib.k_ellis.amt && !ib.k_ellis.count);
  const santa = E.secs.find(r => r.sec.id === "santa").cells.find(c => c.pid === "k_ellis");
  ok("per section: Ellis's Santa = half the trampoline", santa.amt === 150 && santa.count === 1);
  T.setRoot(root, "<nav/>"); W.gfGo("even"); const h = root.innerHTML;
  ok("Even page: table + who's behind line", /gf-even/.test(h) && /Julian is \$210 and 2 gifts behind/.test(h) && /gf-behind/.test(h), h.match(/⚖️ [^<]*/g));
  writes.length = 0; W.gfEvenEdit(); W.gfSet("pct", "50"); W.gfSet("n", "3"); W.gfSave();
  ok("✏️ thresholds = ONE set on gifts/settings/even", writes[0].op === "set" && writes[0].path === "gifts/settings/even" && writes[0].val.pct === 50 && writes[0].val.n === 3);
  const b2 = T.behind(T.evenData("x").all);
  ok("at 50% / 3 gifts Ellis is no longer flagged; Julian still is", !b2[1].amt && b2[3].amt, b2);
}

console.log("\n# 🎀 To wrap · 📍 Where · 📦 Coming · 🛍 Shop · 🗄 Closet");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>");
  W.gfGo("wrap"); let h = root.innerHTML;
  ok("To wrap: only 'here' presents, grouped by paper (Pink snow + pink snow together)", /Treehouse/.test(h) && /Dino/.test(h) && /Spare puzzle/.test(h) && !/Filament/.test(h) && !/Trampoline/.test(h) && (h.match(/<span>🎀 Pink snow<\/span><span class="gf-gsum">/g) || []).length === 1 && !/<span>🎀 pink snow<\/span><span class="gf-gsum">/.test(h) && /No paper picked yet/.test(h));
  ok("rows say who it's for", /👤 Lucy/.test(h) && /🗄 no one yet/.test(h));
  writes.length = 0; W.gfBulkIds("a,e", "wrapped");
  ok("'All wrapped' = one update per present + one log", writes.filter(w => w.op === "update").length === 2 && writes.every(w => w.op !== "update" || (Object.keys(w.val).join() === "status" && w.val.status === "wrapped")) && writes.filter(w => w.op === "push").length === 1);
  reset(D()); T.setOcc("x"); W.gfGo("where"); h = root.innerHTML;
  ok("Where: in-house presents by spot (Closet + closet together), ideas/given left out", (h.match(/<span>📍 Closet<\/span><span class="gf-gsum">/g) || []).length === 1 && !/<span>📍 closet<\/span><span class="gf-gsum">/.test(h) && /Van/.test(h) && /Not written down/.test(h) && !/Socks/.test(h));
  W.gfGo("coming"); h = root.innerHTML;
  ok("Coming: ordered only, late on top", /⏰ Late/.test(h) && h.indexOf("Trampoline") < h.indexOf("Candy") && !/Treehouse/.test(h) && /late — due Nov 15/.test(h) && /by Dec 10/.test(h));
  W.gfGo("shop"); h = root.innerHTML;
  ok("Shop: ideas by store with planned total", /🏬 Target/.test(h) && /plan \$10/.test(h) && /Socks/.test(h) && !/Candy/.test(h));
  W.gfGo("closet"); h = root.innerHTML;
  ok("Closet: presents for no one yet", /Spare puzzle/.test(h) && !/Treehouse/.test(h));
}

console.log("\n# ☑ Select → change several at once");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("wrap");
  W.gfSelToggle(); ok("Select mode on", T.selOn() && /gf-selbar/.test(root.innerHTML) && /gfPick\('a'\)/.test(root.innerHTML));
  W.gfPick("a"); W.gfPick("e"); W.gfPick("e"); W.gfPick("f");
  ok("tapping picks / unpicks", Object.keys(T.sel()).sort().join() === "a,f");
  writes.length = 0; W.gfBulk("wrapped");
  ok("bulk = one targeted update per present, then select mode ends", writes.filter(w => w.op === "update").map(w => w.path).sort().join() === "gifts/items/a,gifts/items/f" && !T.selOn() && T.data().items.a.status === "wrapped");
  W.gfGo("people"); ok("People has no Select button", !/gfSelToggle/.test(root.innerHTML));
}

console.log("\n# 🌙 Christmas Eve");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("eve"); let h = root.innerHTML;
  ok("gather list: in-house presents by spot, 0 of 4 out", /0 of 4 out/.test(h) && /Treehouse/.test(h) && /not wrapped/.test(h) && !/Socks/.test(h));
  writes.length = 0; W.gfGather("d");
  ok("tick = ONE update: given, remembers it was wrapped", writes[0].path === "gifts/items/d" && writes[0].val.status === "given" && writes[0].val.wasStatus === "wrapped" && /1 of 4 out/.test(root.innerHTML));
  writes.length = 0; W.gfGather("d");
  ok("untick = back to wrapped, the memory cleared", writes[0].val.status === "wrapped" && writes[0].val.wasStatus === null && T.data().items.d.status === "wrapped" && !("wasStatus" in T.data().items.d));
  h = root.innerHTML;
  ok("jobs from the presents: batteries (AA ×4) + assembly", /Batteries in \(AA ×4\)/.test(h) && /Put together/.test(h) && /Batteries to have on hand: AA ×4/.test(h));
  writes.length = 0; W.gfEveTick("d_batt");
  ok("job tick = ONE set on gifts/eve/<occ>/done/<id>_batt; again = remove", writes[0].op === "set" && writes[0].path === "gifts/eve/x/done/d_batt");
  W.gfEveTick("d_batt"); ok("…untick removes it", writes[1].op === "remove");
  ok("count check per kid and section", /Count check/.test(h) && /Stocking/.test(h));
  writes.length = 0; nodes["gf-line"] = el("gf-line"); nodes["gf-line"].value = "Cookies + milk"; W.gfLineAdd();
  const lw = writes.find(w => w.op === "set");
  ok("her own line = ONE set on gifts/eve/<occ>/lines/<id>", /^gifts\/eve\/x\/lines\/g/.test(lw.path) && lw.val.text === "Cookies + milk" && /Cookies \+ milk/.test(root.innerHTML));
  const lid = lw.path.split("/").pop(); writes.length = 0; W.gfLineTick(lid);
  ok("tick a line = ONE set …/done true", writes[0].path === "gifts/eve/x/lines/" + lid + "/done" && writes[0].val === true);
  writes.length = 0; W.gfLineDel(lid); ok("✕ = ONE remove", writes[0].op === "remove");
  const d2 = D(); d2.occasions.y = { name: "Christmas 2027", kind: "christmas", date: "2027-12-25", secs: {} };
  d2.eve = { x: { lines: { l1: { text: "Reindeer food", order: 0 }, l2: { text: "Camera charged", order: 1 } } } };
  reset(d2); T.setOcc("y"); W.gfGo("eve");
  ok("next Christmas offers to copy last time's list", /Copy last time.s list \(Christmas 2026\)/.test(root.innerHTML));
  writes.length = 0; W.gfLinesCopy("x");
  ok("copy = one set per line under the new occasion", writes.filter(w => w.op === "set" && /^gifts\/eve\/y\/lines\//.test(w.path)).length === 2);
}

console.log("\n# a present's new fields: coming by + Christmas Eve jobs");
{
  reset(D()); T.setOcc("x");
  W.gfNewItem("k_lucy", "parents"); W.gfSet("name", "RC car"); W.gfSet("due", "2026-12-12"); W.gfNeed("batt"); W.gfSet("batt", "AA ×6"); W.gfNeed("charge"); W.gfNeed("charge"); W.gfNeed("build"); W.gfSave();
  const v = writes.find(w => w.op === "set").val;
  ok("saves due + needs {batt:'AA ×6', build:true}; an untoggled job isn't stored", v.due === "2026-12-12" && v.needs.batt === "AA ×6" && v.needs.build === true && !("charge" in v.needs), v);
  const id = writes.find(w => w.op === "set").path.split("/").pop();
  writes.length = 0; W.gfEditItem(id); ok("edit reads them back", T.edit().form.due === "2026-12-12" && T.edit().form.needs.batt && T.edit().form.batt === "AA ×6");
  W.gfNeed("batt"); W.gfNeed("build"); W.gfSave(); const v2 = writes.find(w => w.op === "set").val;
  ok("untick both → no needs stored", !("needs" in v2));
  W.gfNewItem("k_lucy", "parents"); W.gfSet("name", "Ball"); W.gfNeed("batt"); W.gfSave();
  ok("batteries with no kind written = true", writes.filter(w => w.op === "set").pop().val.needs.batt === true);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
