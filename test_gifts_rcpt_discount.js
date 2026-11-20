/*
 * Node tests for 🧾 Gifts RCPTDISC (her report 2026-11-20, a Woot order: "it didnt account for the discount and accounted for the
 * price before the discount which was significant"):
 *   · Claude reads the subtotal + the order-level discount; "N @ $X" read as $X for the line becomes X each when that's what adds
 *     up to the printed subtotal
 *   · the discount is shared by price in whole cents, then the tax on what's left; paid = price − discount + tax
 *   · the check screen adds it all up against the receipt's total: ✓ or ⚠ before Save
 *   · her real Woot numbers: Venator 7.80, dominoes ≈13.27 each, all adding back to 64.48
 *
 *   run:  node test_gifts_rcpt_discount.js
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
console.log("\n# her Woot order (2026-11-20): subtotal 150.72 · Prime discount −90.46 · tax 4.22 · total 64.48");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(PDF, true);
  // exactly what went wrong live: Claude gave the "3 @ $30.99" line as price 30.99 with qty 3, and no discount
  reply = claude({ store: "Woot", date: "2026-05-26", orderNo: "211508492", subtotal: 150.72, discount: 90.46, total: 64.48, tax: 4.22, lines: [
    { text: "Spin Master Build Star Wars Dlx Venator 1 @ $18.24", name: "Star Wars Venator Build Set", qty: 1, price: 18.24 },
    { text: "Tile Town Jurassic World Dino Magnetic Set 1 @ $17.49", name: "Jurassic World Dino Magnetic Set", qty: 1, price: 17.49 },
    { text: "Tile Town Jurassic World Tiles Set 1 @ $22.02", name: "Jurassic World Tiles Set", qty: 1, price: 22.02 },
    { text: "Hape Dynamo Wooden Domino Set 3 @ $30.99", name: "Wooden Domino Set", qty: 3, price: 30.99 }] });
  await W.gfRcptRead(); await tick();
  const f = T.edit().form;
  ok("the prompt asks for subtotal + order-level discount and says N @ $X means X each", /"subtotal":number or null/.test(RC.prompt) && /"discount":number or null/.test(RC.prompt) && /3 @ \$30\.99 = 92\.97/.test(RC.prompt));
  ok("3 @ $30.99 → three rows of 30.99 each (the subtotal only adds up that way)", f.rows.length === 6 && f.rows.slice(3).every(r => r.p === "30.99"), f.rows.map(r => r.p));
  ok("the discount fills in (90.46)", f.discount === "90.46");
  const ds = RC.discShares(f.rows, f.discount), tx = RC.taxShares(f.rows, f.tax, f.discount);
  ok("discount shares add up to 90.46 exactly", Math.round(ds.reduce((a, b) => a + b, 0) * 100) === 9046, ds);
  ok("tax shares add up to 4.22 exactly", Math.round(tx.reduce((a, b) => a + b, 0) * 100) === 422, tx);
  const paid = f.rows.map((r, i) => Math.round((+r.p - ds[i] + tx[i]) * 100) / 100);
  ok("Venator = 18.24 − 10.95 + 0.51 = 7.80", ds[0] === 10.95 && paid[0] === 7.8, [ds[0], tx[0], paid[0]]);
  ok("each domino set ≈ 13.27", paid.slice(3).every(x => Math.abs(x - 13.27) <= 0.01), paid.slice(3));
  ok("everything adds back to the receipt's 64.48", Math.round(paid.reduce((a, b) => a + b, 0) * 100) === 6448, paid);
  const h = root.innerHTML;
  ok("check screen: Order discount field, '− $10.95 off' on the Venator, ✓ adds up to the receipt", /Order discount \$/.test(h) && /− \$10\.95 off/.test(h) && /✓ Items \$150\.72 − \$90\.46 off \+ \$4\.22 tax = \$64\.48 — matches the receipt/.test(h), (h.match(/[✓⚠] Items[^<]*/) || [])[0]);
  ok("RCPTNET: the Venator's line spells out $18.24 − $10.95 off + $0.51 tax = $7.80 before Save", /<span>\$18\.24<\/span><span[^>]*>− \$10\.95 off<\/span><button[^>]*>\+ \$0\.51 tax<\/button><span class="gf-rcnet">= \$7\.80<\/span>/.test(h), (h.match(/<span>\$18\.24<\/span>.{0,300}/) || [])[0]);
  ok("…and each domino set shows its real cost (= $13.27 or $13.26)", (h.match(/<span class="gf-rcnet">= \$13\.2[67]<\/span>/g) || []).length === 3);
  W.gfRcPid(0, "k_lucy"); [1, 2, 3, 4, 5].forEach(i => W.gfRcNog(i));
  writes.length = 0; W.gfSave();
  const v = writes.find(w => w.op === "set" && /^gifts\/items\//.test(w.path)).val;
  ok("the Venator present saves paid 7.80, disc 10.95, tax 0.51", v.paid === 7.8 && v.disc === 10.95 && v.tax === 0.51, v);
  const rc = writes.find(w => w.op === "set" && /^gifts\/receipts\//.test(w.path)).val;
  T.draw();   // Save leaves the 🧾 list open on the receipt it just saved
  ok("RCPTNET: the 🧾 list leads with the real cost — $7.80 ($18.24 − $10.95 off + $0.51 tax)", /\$7\.80<small> \(\$18\.24 − \$10\.95 off \+ \$0\.51 tax\)<\/small>/.test(root.innerHTML));
  ok("the receipt keeps discount 90.46, tax 4.22, total 64.48, and each line's discount", rc.discount === 90.46 && rc.tax === 4.22 && rc.total === 64.48 && rc.lines[0].disc === 10.95);
}

console.log("\n# a mismatch is flagged before saving");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(JPG, false);
  reply = claude({ store: "Woot", total: 64.48, tax: 4.22, lines: [{ text: "VENATOR", name: "Venator", qty: 1, price: 18.24 }, { text: "TILES", name: "Tiles", qty: 1, price: 22.02 }] });
  await W.gfRcptRead(); await tick();
  ok("no discount read → ⚠ the receipt says 64.48", /⚠ Items \$40\.26 \+ \$4\.22 tax = \$44\.48 — the receipt says \$64\.48/.test(root.innerHTML), (root.innerHTML.match(/[✓⚠] Items[^<]*/) || [])[0]);
  W.gfSet("discount", "5"); W.gfRcRedraw();
  ok("typing a discount redraws the sum", /− \$5 off/.test(root.innerHTML));
}

console.log("\n# a line read correctly as the line total is left alone");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(JPG, false);
  reply = claude({ store: "Target", subtotal: 30, total: 30, lines: [{ text: "SOCKS 3 @ 10.00", name: "Socks", qty: 3, price: 30 }] });
  await W.gfRcptRead(); await tick();
  ok("3 @ 10 given as 30 → split 10/10/10 (no ×3)", T.edit().form.rows.map(r => r.p).join() === "10,10,10");
  ok("no discount → no discount chips, sum ✓", !/ off<\/span>/.test(root.innerHTML) && /✓ Items \$30 = \$30 — matches/.test(root.innerHTML));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
