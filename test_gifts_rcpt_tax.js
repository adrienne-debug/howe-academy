/*
 * Node tests for 🧾 Gifts RCPTTAX (her ask 2026-11-20: "figure out the tax per item … one item I had three of, and it just did it as
 * one thing … maybe it should pull it out three different times also so it could do the tax as well"):
 *   · a ×N line becomes N rows (cents split exactly), each "k of N", each its own person
 *   · the receipt's tax is shared across the taxed lines by price, in cents, adding up exactly; a not-taxed line gets none;
 *     a not-a-gift line still takes its share (so presents carry only their own)
 *   · a present's paid = price + tax share, tax kept on it; the receipt keeps tax + each line's share
 *   · by hand (no key) the typed tax shares out the same; a receipt with no tax is unchanged
 *
 *   run:  node test_gifts_rcpt_tax.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null };
const writes = [], listens = [], onces = [];
let dryRun = false, mom = true, key = "sk-test", photosInDb = {};
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on(ev, fn) { listens.push(p); },
  once(ev) { onces.push(p); const id = p.split("/")[1]; return Promise.resolve({ val: () => photosInDb[id] || null }); } }; } };
const calls = []; let reply = null;
async function fetchStub(url, opt) { calls.push({ url, opt, body: JSON.parse(opt.body) }); const r = reply; return { ok: r.ok !== false, status: r.status || 200, async text() { return r.text || ""; }, async json() { return r.json; } }; }
const claude = (obj, stop) => ({ json: { stop_reason: stop || "end_turn", content: [{ type: "text", text: "Here you go:\n" + JSON.stringify(obj) + "\nthanks {not json" }] } });
const LS = {};
const ctx = { console, Date, Math, JSON, Promise, document, db, fetch: fetchStub, kitCapKey: () => key, _todayStr: () => "2026-11-20", _dryRun: () => dryRun, momHere: () => mom, gwShowToast() {}, confirm: () => true,
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'lincoln',name:'Lincoln',color:'#2563eb'},{id:'ellis',name:'Ellis',color:'#16a34a'},{id:'lucy',name:'Lucy',color:'#db2777'},{id:'julian',name:'Julian',color:'#d97706'}];", ctx);
const SRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._gfTest, W = ctx, RC = T.rc;
const reset = d => { writes.length = 0; calls.length = 0; onces.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; T.setRoot(root, "<nav/>"); };
const tick = () => new Promise(r => setTimeout(r, 0));
const JPG = "data:image/jpeg;base64,QUJD", JPG2 = "data:image/jpeg;base64,REVG", PDF = "data:application/pdf;base64,UERG";

const D = () => ({ occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25",
    secs: { santa: { name: "Santa", emoji: "🎅", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 } } } },
  people: { "k_lucy": { paper: "Pink snow" } },
  items: {
    i1: { occ: "x", pids: ["k_lucy"], sec: "santa", name: "LEGO Friends treehouse", status: "idea", plan: 60 },
    i2: { occ: "x", pids: ["k_ellis"], sec: "stocking", name: "Pokemon cards", status: "idea", plan: 10 },
    i3: { occ: "x", pids: ["k_julian"], sec: "parents", name: "Dino", status: "here", paid: 20 } } });


(async () => {
console.log("\n# the cents: splitting a line and sharing the tax");
{
  const sp = RC.split(25, 3);
  ok("$25 ×3 → 8.34 + 8.33 + 8.33 (adds back to 25 exactly)", sp.join() === "8.34,8.33,8.33" && Math.round(sp.reduce((a, b) => a + b, 0) * 100) === 2500, sp);
  const rows = [{ p: "20", taxed: null }, { p: "10", taxed: null }, { p: "10", taxed: null }];
  const sh = RC.taxShares(rows, "2.80");
  ok("$2.80 tax over 20/10/10 → 1.40 / 0.70 / 0.70", sh.join() === "1.4,0.7,0.7", sh);
  const odd = RC.taxShares([{ p: "9.99" }, { p: "9.99" }, { p: "9.99" }], "2.10");
  ok("shares always add up to the tax exactly (2.10 over three 9.99s)", Math.round(odd.reduce((a, b) => a + b, 0) * 100) === 210, odd);
  const mk = RC.taxShares([{ p: "20", taxed: true }, { p: "10", taxed: false }, { p: "10", taxed: null }], "1.50");
  ok("a line marked NOT taxed gets none; unmarked lines on a marked receipt are taxed", mk[1] === 0 && Math.round((mk[0] + mk[2]) * 100) === 150 && mk[0] === 1, mk);
  ok("no tax typed → no shares", RC.taxShares(rows, "").every(x => x === 0));
}

console.log("\n# Claude's answer: ×3 becomes three rows, the tax fills in");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(JPG, false);
  reply = claude({ store: "Target", date: "2026-11-19", total: 42.80, tax: 2.80, lines: [
    { text: "STUFFED SLOTH 3 @ 6.67", name: "Stuffed sloth", qty: 3, price: 20.00, taxed: true },
    { text: "PKMN CARDS", name: "Pokemon cards", qty: 1, price: 10.00, taxed: true, idea: "Pokemon cards" },
    { text: "BATTERIES AA", name: "AA batteries", qty: 1, price: 10.00, taxed: true }] });
  await W.gfRcptRead(); await tick();
  const f = T.edit().form;
  ok("the prompt asks for qty, taxed and the tax total", /"qty":whole number/.test(RC.prompt) && /"taxed":true or false or null/.test(RC.prompt) && /"tax":number or null/.test(RC.prompt));
  ok("sloth ×3 → three rows of 6.67 / 6.67 / 6.66, each 'k of 3'", f.rows.length === 5 && f.rows.slice(0, 3).map(r => r.p).join() === "6.67,6.67,6.66" && f.rows.slice(0, 3).map(r => r.of).join() === "1 of 3,2 of 3,3 of 3", f.rows.map(r => r.p + "/" + r.of));
  ok("the tax total fills in (2.80)", f.tax === "2.8");
  ok("the idea match still works on a single line", f.rows[3].idea === "i2" && f.rows[3].useIdea);
  const h = root.innerHTML;
  ok("check screen: Tax field, ×3 chips, '+ $0.47 tax' on each sloth", /Tax \$/.test(h) && (h.match(/×3 · \d of 3/g) || []).length === 3 && /\+ \$0\.47 tax/.test(h), (h.match(/\+ \$[\d.]+ tax|no tax/g) || []));
  // give one sloth to each kid; batteries are not a gift
  W.gfRcPid(0, "k_lucy"); W.gfRcPid(1, "k_ellis"); W.gfRcPid(2, "k_julian"); W.gfRcNog(4);
  writes.length = 0; W.gfSave();
  const sets = writes.filter(w => w.op === "set" && /^gifts\/items\//.test(w.path)).map(w => w.val);
  ok("three sloth presents, one per kid", sets.length === 3 && sets.map(v => v.pids.join()).join() === "k_lucy,k_ellis,k_julian", sets.map(v => v.pids));
  const all = sets.map(v => v.paid), taxes = sets.map(v => v.tax);
  ok("each sloth's paid = its price + its share of the tax", taxes.every(t => t > 0) && sets.every(v => Math.abs(v.paid - (v.tax + 6.67)) < 0.011 || Math.abs(v.paid - (v.tax + 6.66)) < 0.011), sets.map(v => [v.paid, v.tax]));
  const up = writes.find(w => w.op === "update" && w.path === "gifts/items/i2").val;
  ok("the idea marked bought gets 10 + its 0.70 tax = 10.70, tax 0.70", up.paid === 10.7 && up.tax === 0.7, up);
  const rc = writes.find(w => w.op === "set" && /^gifts\/receipts\//.test(w.path)).val;
  const lineTax = rc.lines.reduce((a, l) => a + (l.tax || 0), 0);
  ok("the receipt keeps tax 2.80, every line's share (the batteries' too) adding up to it", rc.tax === 2.8 && Math.round(lineTax * 100) === 280 && rc.lines[4].tax === 0.7 && !rc.lines[4].item, rc.lines);
  ok("not-a-gift batteries made no present", !sets.some(v => /batter/i.test(v.name)));
}

console.log("\n# by hand (no key): type the tax, it still shares out");
{
  reset(D()); T.setOcc("x"); key = ""; W.gfRcptNew(); W.gfSet("store", "Shop"); W.gfSet("tax", "1.00");
  W.gfRcAdd(); W.gfRcSet(0, "t", "Puzzle"); W.gfRcSet(0, "p", "30"); W.gfRcPid(0, "k_lucy");
  W.gfRcAdd(); W.gfRcSet(1, "t", "Book"); W.gfRcSet(1, "p", "10"); W.gfRcPid(1, "k_ellis"); W.gfRcTaxed(1);
  ok("tap '+ tax' flips a line to no tax", T.edit().form.rows[1].taxed === false);
  writes.length = 0; W.gfSave();
  const sets = writes.filter(w => w.op === "set" && /^gifts\/items\//.test(w.path)).map(w => w.val);
  ok("puzzle carries all 1.00 (31.00), the untaxed book none (10, no tax field)", sets[0].paid === 31 && sets[0].tax === 1 && sets[1].paid === 10 && !("tax" in sets[1]), sets);
  const rc = writes.find(w => w.op === "set" && /^gifts\/receipts\//.test(w.path)).val;
  ok("no total typed → total = lines + tax (41)", rc.total === 41 && rc.tax === 1);
  key = "sk-test";
}

console.log("\n# a receipt with no tax works as before");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(JPG, false);
  reply = claude({ store: "Toy shop", date: "2026-11-19", total: 12, lines: [{ text: "KITE", name: "Kite", price: 12 }] });
  await W.gfRcptRead(); await tick();
  const f = T.edit().form;
  ok("no qty → one row; no tax → no tax buttons", f.rows.length === 1 && !f.rows[0].of && !/ tax<\/button>|no tax<\/button>/.test(root.innerHTML));
  W.gfRcPid(0, "k_lucy"); writes.length = 0; W.gfSave();
  const v = writes.find(w => w.op === "set" && /^gifts\/items\//.test(w.path)).val;
  ok("paid 12, no tax field", v.paid === 12 && !("tax" in v));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
