/*
 * Node tests for 🎁 Gifts SPLITTAGS (2026-11-20, her "finish all the builds needed for the gift tracker"):
 *   · SPLIT: a shared present's own split (items.split, any proportion), stored only when not even; totals, Even, "their share" follow
 *   · WNWR: optional want/need/wear/read/do — a switch (gifts/settings/tags), a kind per present, five boxes on a kid's page
 *
 *   run:  node test_gifts_split_tags.js
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
  items: {
    a: { occ: "x", pids: ["k_lucy", "k_ellis"], sec: "special", name: "Trampoline", status: "here", paid: 300 },
    b: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Book", status: "here", paid: 10, kind: "read" },
    c: { occ: "x", pids: ["k_lucy"], sec: "parents", name: "Coat", status: "idea", plan: 40, kind: "wear" } } });

console.log("\n# 🤝 her own split of a shared present");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>");
  ok("no split saved → even: Lucy 150 + 10, Ellis 150", T.personTot("x", "k_lucy").paid === 160 && T.personTot("x", "k_ellis").paid === 150);
  W.gfEditItem("a"); let h = root.innerHTML;
  ok("the sheet offers Even / My own split when 2+ people are picked", /🤝 Split the cost/.test(h) && /gfSplitMode\(1\)">My own split/.test(h));
  W.gfEditItem("b"); ok("…and not for a present with one person", !/Split the cost/.test(root.innerHTML)); W.gfCancel();
  W.gfEditItem("a"); W.gfSplitMode(1); ok("My own split starts even (50 / 50) with a % box each", T.edit().form.split.k_lucy === "50" && T.edit().form.split.k_ellis === "50" && (root.innerHTML.match(/gfSplitSet\(/g) || []).length === 2);
  writes.length = 0; W.gfSave(); ok("left even → no split is stored", !("split" in writes.find(w => w.op === "set").val));
  W.gfEditItem("a"); W.gfSplitMode(1); W.gfSplitSet("k_lucy", "60"); W.gfSplitSet("k_ellis", "40"); writes.length = 0; W.gfSave();
  const v = writes.find(w => w.op === "set").val;
  ok("60 / 40 = ONE set with split {k_lucy:60, k_ellis:40}", v.split && v.split.k_lucy === 60 && v.split.k_ellis === 40 && writes.filter(w => w.op === "set").length === 1, v.split);
  ok("totals follow it: Lucy 180 + 10, Ellis 120; the occasion still counts 300 once", T.personTot("x", "k_lucy").paid === 190 && T.personTot("x", "k_ellis").paid === 120 && T.occTot("x").paid === 310);
  W.gfOpenPerson("k_ellis"); ok("Ellis's row says his share: ($120 their share)", /\(\$120 their share\)/.test(root.innerHTML));
  ok("Even follows the split", T.evenData("x").all.find(c => c.pid === "k_ellis").amt === 120);
  W.gfEditItem("a"); ok("editing reads the split back", T.edit().form.split.k_lucy === "60");
  W.gfSplitMode(0); writes.length = 0; W.gfSave(); ok("back to Even removes it", !("split" in writes.find(w => w.op === "set").val) && T.personTot("x", "k_ellis").paid === 150);
  W.gfEditItem("a"); W.gfSplitMode(1); W.gfSplitSet("k_lucy", "2"); W.gfSplitSet("k_ellis", "1"); W.gfSave();
  ok("any numbers work as a proportion (2 and 1 → 200 / 100)", T.personTot("x", "k_lucy").paid === 210 && T.personTot("x", "k_ellis").paid === 100);
}

console.log("\n# 🏷 want · need · wear · read — off until she turns it on");
{
  reset(D()); T.setOcc("x"); T.setRoot(root, "<nav/>"); W.gfGo("people"); let h = root.innerHTML;
  ok("People has the switch, off", /gfTagsToggle\(\)">🏷 Want · need · wear · read: off/.test(h));
  W.gfOpenPerson("k_lucy"); h = root.innerHTML;
  ok("off: no boxes, no chips, and the sheet doesn't ask", !/gf-kind/.test(h) && !/📚 Read/.test(h) && (() => { W.gfEditItem("b"); const s = !/🏷 Kind/.test(root.innerHTML); W.gfCancel(); return s; })());
  writes.length = 0; W.gfEditItem("b"); W.gfSave();
  ok("off: saving a present keeps the kind it already had", writes.find(w => w.op === "set").val.kind === "read");
  W.gfGo("people"); writes.length = 0; W.gfTagsToggle();
  ok("turning it on = ONE set gifts/settings/tags true", writes[0].op === "set" && writes[0].path === "gifts/settings/tags" && writes[0].val === true);
  W.gfOpenPerson("k_lucy"); h = root.innerHTML;
  ok("on: the kid's page shows the five boxes with counts (Wear 1 · Read 1 · Want —)", (h.match(/class="gf-kind/g) || []).length === 5 && /Read<\/div><b>1<\/b>/.test(h) && /Wear<\/div><b>1<\/b>/.test(h) && /Want<\/div><b>—<\/b>/.test(h));
  ok("on: a present shows its chip", /📚 Read<\/span>/.test(h));
  W.gfEditItem("c"); ok("on: the sheet offers the five kinds", /🏷 Kind \(optional\)/.test(root.innerHTML) && /💝 Want/.test(root.innerHTML));
  W.gfSetDraw("kind", "need"); writes.length = 0; W.gfSave(); ok("picking one saves it on the present", writes.find(w => w.op === "set").val.kind === "need");
  W.gfEditItem("c"); W.gfSetDraw("kind", ""); writes.length = 0; W.gfSave(); ok("tapping it off removes it", !("kind" in writes.find(w => w.op === "set").val));
  writes.length = 0; W.gfTagsToggle(); ok("turning it off = ONE remove", writes[0].op === "remove" && writes[0].path === "gifts/settings/tags");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
