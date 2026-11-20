/*
 * Node tests for 🎁 Gifts — slice 3 (2026-11-20): 📸 Receipts in gifts.js (GIFTS_RCPT_START … GIFTS_RCPT_END).
 *   · 🧾 Receipts chip + 📸 Add a receipt in the view row; the sheet takes photos / a PDF (6 at most)
 *   · ✨ Read it = ONE call to api.anthropic.com (claude-sonnet-5, the family key, max_tokens set) with the photos in order, the
 *     PDF as a document, and this occasion's 💭 idea names; a cut-off (max_tokens) or junk answer says so plainly
 *   · the check screen: one row per line, filled from Claude's JSON; what she typed first wins; a line that is one of her ideas
 *     (Claude's pick, or most of the idea's words) offers "mark it bought" — each idea only once
 *   · Save: photos → giftPhotos/<rid> (ONE set) · the receipt → gifts/receipts/<rid> (ONE set, no "$" key) · one set per new
 *     present (paid, store, status, rcpt, returnBy, orderNo, shared pids) · one update per idea marked bought · not-a-gift
 *     lines make nothing · nothing written before Save
 *   · no Claude key → no Read button, photos + typed total still save
 *   · the list: soonest open return window first; a present with rcpt shows 🧾 + its return-by; photos are read ONLY when a
 *     receipt is opened (once), never by renderGifts; dry-run = no writes
 *   · index.html never reads giftPhotos (secret + page-size rule)
 *
 *   run:  node test_gifts_receipts.js
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
console.log("\n# the block, the chip, the button");
{
  ok("marked block GIFTS_RCPT_START … GIFTS_RCPT_END", SRC.indexOf("// GIFTS_RCPT_START") > 0 && SRC.indexOf("// GIFTS_RCPT_END") > SRC.indexOf("// GIFTS_RCPT_START"));
  reset(D()); T.setOcc("x"); T.draw(); const h = root.innerHTML;
  ok("view row has 🧾 Receipts + 📸 Add a receipt", /gfGo\('receipts'\)">🧾 Receipts/.test(h) && /gfRcptNew\(\)">📸 Add a receipt/.test(h));
  W.gfGo("receipts");
  ok("empty receipts page", /No receipts yet/.test(root.innerHTML) && writes.length === 0);
  const blk = SRC.slice(SRC.indexOf("// GIFTS_RCPT_START"), SRC.indexOf("// GIFTS_RCPT_END"));
  ok("model claude-sonnet-5, max_tokens set, the family key, direct browser call", /model:"claude-sonnet-5",max_tokens:\d+/.test(blk) && /kitCapKey\(\)/.test(blk) && /anthropic-dangerous-direct-browser-access/.test(blk));
  ok("the prompt asks for store, date, order #, total, lines (line total), return-by only if printed, idea names", /"store"/.test(RC.prompt) && /"orderNo"/.test(RC.prompt) && /"returnBy"/.test(RC.prompt) && /LINE total/.test(RC.prompt) && /PRINTED/.test(RC.prompt) && /"idea"/.test(RC.prompt));
}

console.log("\n# ✨ Read it → the check screen");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew();
  ok("sheet open: photo tray + Read (disabled until a photo)", T.edit().kind === "rcpt" && /New receipt/.test(root.innerHTML) && /gfRcptPick\(this\)/.test(root.innerHTML) && /disabled onclick="gfRcptRead\(\)"/.test(root.innerHTML));
  RC.addFile(JPG); RC.addFile(JPG2); RC.addFile(PDF, true); W.gfSet("store", "My Target");
  reply = claude({ store: "Target", date: "2026-11-18", orderNo: "112-555", total: 95.5, returnBy: "2026-11-25",
    lines: [{ text: "LEGO FRNDS 41703 HEARTLAKE TREEHOUSE", name: "LEGO Friends treehouse", price: 59.99, idea: "LEGO Friends treehouse" },
            { text: "POKEMON TCG BOOSTER", name: "Pokemon booster", price: 4.99, idea: null },
            { text: "TRAMPOLINE 8FT", name: "Trampoline", price: 25.52, idea: null },
            { text: "GIFT WRAP ROLL", name: "Wrapping paper", price: 5, idea: null }] });
  await W.gfRcptRead(); await tick();
  ok("ONE call to api.anthropic.com/v1/messages with the key", calls.length === 1 && calls[0].url === "https://api.anthropic.com/v1/messages" && calls[0].opt.headers["x-api-key"] === "sk-test");
  const c = calls[0].body.messages[0].content;
  ok("photos in order (labelled), then the PDF as a document, then the prompt", c[0].text === "Photo 1 of 2 (top of the receipt)" && c[1].type === "image" && c[1].source.data === "QUJD" && c[3].source.data === "REVG" && c.some(b => b.type === "document" && b.source.data === "UERG") && c[c.length - 1].type === "text");
  ok("the prompt lists this occasion's 💭 ideas only", /"LEGO Friends treehouse"; "Pokemon cards"/.test(c[c.length - 1].text) && !/Dino/.test(c[c.length - 1].text));
  ok("model + max_tokens in the body", calls[0].body.model === "claude-sonnet-5" && calls[0].body.max_tokens >= 4000);
  const f = T.edit().form;
  ok("fills date/order/total/return-by; what she typed (store) wins", f.store === "My Target" && f.iso === "2026-11-18" && f.orderNo === "112-555" && f.total === "95.5" && f.returnBy === "2026-11-25", f);
  ok("an order # → 'On the way' picked", f.status === "ordered");
  ok("4 rows; row 1 = her idea (Claude's pick); 'Pokemon booster' isn't close enough to 'Pokemon cards' on its own", f.rows.length === 4 && f.rows[0].idea === "i1" && f.rows[0].useIdea && f.rows[1].idea === null, f.rows.map(r => r.idea));
  const h = root.innerHTML;
  ok("check screen: mark-it-bought line, person chips, No one yet, Not a gift, sections only once someone is picked", /That's your idea <b>LEGO Friends treehouse<\/b> \(Lucy\) — mark it bought/.test(h) && /gfRcPid\(1,'k_lucy'\)/.test(h) && /🗄 No one yet/.test(h) && /✕ Not a gift/.test(h) && !/gfRcSec\(1,/.test(h));
  ok("nothing written while checking", writes.length === 0);
  // her choices
  W.gfRcIdea(1, "i2");                                        // the booster IS the Pokemon idea
  W.gfRcPid(2, "k_lucy"); W.gfRcPid(2, "k_ellis"); W.gfRcSec(2, "santa");   // a shared trampoline from Santa
  W.gfRcNog(3);                                               // wrapping paper isn't a gift
  ok("picking someone shows the sections", /gfRcSec\(2,'santa'\)/.test(root.innerHTML));
  W.gfSave();
  const ph = writes.filter(w => /^giftPhotos\//.test(w.path)), rw = writes.filter(w => /^gifts\/receipts\//.test(w.path));
  const rid = rw[0] && rw[0].path.split("/").pop();
  ok("photos = ONE set on giftPhotos/<rid> with all 3 files, first", ph.length === 1 && ph[0].op === "set" && ph[0].val.length === 3 && ph[0].val[2] === PDF && writes[0] === ph[0]);
  const r = rw[0].val;
  ok("receipt = ONE set on gifts/receipts/<rid>", rw.length === 1 && rw[0].op === "set" && ph[0].path === "giftPhotos/" + rid);
  ok("receipt fields", r.store === "My Target" && r.iso === "2026-11-18" && r.orderNo === "112-555" && r.total === 95.5 && r.returnBy === "2026-11-25" && r.photoCount === 3 && r.occ === "x", r);
  ok("lines {t,p,item?} — no '$' key anywhere; not-a-gift has no item", r.lines.length === 4 && r.lines[0].t === "LEGO Friends treehouse" && r.lines[0].p === 59.99 && r.lines[0].item === "i1" && r.lines[1].item === "i2" && !("item" in r.lines[3]) && !JSON.stringify(r).includes('"$"'), r.lines);
  const up = writes.filter(w => w.op === "update"), sets = writes.filter(w => w.op === "set" && /^gifts\/items\//.test(w.path));
  ok("two ideas marked bought = one update each, nothing else in it", up.length === 2 && up.map(w => w.path).sort().join() === "gifts/items/i1,gifts/items/i2" && up.every(w => Object.keys(w.val).sort().join() === "orderNo,paid,rcpt,returnBy,status,store" && w.val.status === "ordered" && w.val.rcpt === rid && w.val.store === "My Target"), up);
  ok("idea paid = the line price", up.find(w => w.path === "gifts/items/i1").val.paid === 59.99 && up.find(w => w.path === "gifts/items/i2").val.paid === 4.99);
  ok("one new present (the trampoline) = ONE set; not-a-gift makes none", sets.length === 1 && sets[0].val.name === "Trampoline" && sets[0].val.pids.join() === "k_lucy,k_ellis" && sets[0].val.sec === "santa" && sets[0].val.paid === 25.52 && sets[0].val.status === "ordered" && sets[0].val.rcpt === rid && sets[0].val.returnBy === "2026-11-25" && sets[0].val.orderNo === "112-555" && sets[0].val.occ === "x" && sets[0].val.paper === "Pink snow", sets[0].val);
  ok("a log line", writes.filter(w => w.op === "push" && w.path === "gifts/log").length === 1 && /🧾 Receipt: My Target \$95\.50 · 1 new present · 2 ideas bought/.test(writes.find(w => w.op === "push").val.text));
  ok("exactly photos + receipt + 1 set + 2 updates + 1 log", writes.length === 6, writes.map(w => w.op + " " + w.path));
  ok("the sheet closes onto the receipts list with it open", !T.edit() && T.view() === "receipts" && RC.open() === rid);
  const L = root.innerHTML;
  ok("list row: store · date · order · presents · ⏰ return by (5 days, amber) · total", /My Target/.test(L) && /Nov 18/.test(L) && /#112-555/.test(L) && /LEGO Friends treehouse, Pokemon cards, Trampoline/.test(L) && /⏰ return by Nov 25 — 5 days/.test(L) && /\$95\.50/.test(L));
  ok("opened: the photos already here (no read), lines with who each is for", onces.length === 0 && /<img src="data:image\/jpeg;base64,QUJD"/.test(L) && /📄 Open the PDF/.test(L) && /Lucy \+ Ellis · 🎅 Santa/.test(L) && /✕ not a gift/.test(L));
  const tr = T.data().items[sets[0].path.split("/").pop()];
  W.gfGo("people"); W.gfOpenPerson("k_ellis");
  ok("a present from a receipt shows 🧾 + its return-by", /🧾 receipt/.test(root.innerHTML) && /⏰ return by Nov 25/.test(root.innerHTML) && tr && tr.rcpt === rid);
  ok("totals pick up the paid $: Ellis = half the trampoline + the booster", Math.abs(T.personTot("x", "k_ellis").paid - (25.52 / 2 + 4.99)) < 1e-9);
}

console.log("\n# matching by words; each idea only once");
{
  reset(D()); T.setOcc("x");
  ok("most of the idea's words in the line → that idea", RC.matchIdea("POKEMON CARDS BOOSTER 3PK", null, "x", []) === "i2");
  ok("Claude's exact pick wins", RC.matchIdea("Building toy", "lego friends treehouse", "x", []) === "i1");
  ok("too few words → no match", RC.matchIdea("LEGO City police car", null, "x", []) === null);
  ok("an idea already used isn't offered again", RC.matchIdea("Pokemon cards", "Pokemon cards", "x", ["i2"]) === null);
  ok("bought/here presents are never ideas", RC.ideas("x").map(i => i.id).join() === "i1,i2");
  W.gfRcptNew(); RC.addFile(JPG);
  reply = claude({ store: "Walmart", date: "2026-11-19", total: 20, lines: [{ text: "POKEMON CARDS", name: "Pokemon cards", price: 10, idea: "Pokemon cards" }, { text: "POKEMON CARDS", name: "Pokemon cards", price: 10, idea: "Pokemon cards" }] });
  await W.gfRcptRead();
  const f = T.edit().form;
  ok("two lines for one idea → only the first gets it", f.rows[0].idea === "i2" && f.rows[1].idea === null);
  ok("no order # → '📦 Here'", f.status === "here");
  W.gfRcIdea(1, "i2");
  ok("picking the idea on another line takes it off the first", f.rows[1].idea === "i2" && f.rows[0].idea === null && !f.rows[0].useIdea);
  W.gfRcUseIdea(1);
  ok("unticking 'mark it bought' → it's a new present again", !f.rows[1].useIdea && /gfRcPid\(1,/.test(root.innerHTML));
  writes.length = 0; W.gfSave();
  const sets = writes.filter(w => w.op === "set" && /^gifts\/items\//.test(w.path));
  ok("two new presents, status here, no updates; no-one-yet = no pids (🗄 closet)", sets.length === 2 && sets.every(w => w.val.status === "here" && !("pids" in w.val) && w.val.store === "Walmart" && !("returnBy" in w.val) && !("orderNo" in w.val)) && !writes.some(w => w.op === "update"));
}

console.log("\n# a bad answer says so; nothing changes");
{
  reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(JPG);
  reply = { json: { stop_reason: "max_tokens", content: [{ type: "text", text: '{"store":"Target","lines":[{"text":"a' }] } };
  await W.gfRcptRead();
  ok("cut off → 'came back incomplete', no rows", /came back incomplete/.test(T.edit().form.msg) && !T.edit().form.rows.length && !T.edit().form.busy);
  reply = { json: { stop_reason: "end_turn", content: [{ type: "text", text: "Sorry, I can't read this." }] } };
  await W.gfRcptRead(); ok("no JSON → 'try a clearer photo'", /clearer photo/.test(T.edit().form.msg));
  reply = { ok: false, status: 401, text: "invalid x-api-key" };
  await W.gfRcptRead(); ok("an API error shows its code", /Claude 401/.test(T.edit().form.msg));
  ok("first complete {…} (braces in strings don't count)", RC.firstJson('x {"a":"}{","b":{"c":1}} {"z":2}') === '{"a":"}{","b":{"c":1}}' && RC.firstJson('{"a":[1,') === null);
  ok("still nothing written", writes.length === 0);
  W.gfCancel(); ok("Cancel closes, nothing written", !T.edit() && writes.length === 0);
}

console.log("\n# no Claude key → photos + a typed total");
{
  key = ""; reset(D()); T.setOcc("x"); W.gfRcptNew();
  ok("no Read button; a plain note instead", !/gfRcptRead\(\)/.test(root.innerHTML) && /No Claude key on this device/.test(root.innerHTML));
  W.gfSave(); ok("nothing to save yet → nothing written", T.edit() && writes.length === 0);
  RC.addFile(JPG); W.gfSet("store", "Costco"); W.gfSet("total", "$142.18"); W.gfSet("returnBy", "2027-01-15");
  await W.gfRcptRead(); ok("Read without a key never calls Claude", calls.length === 0);
  W.gfSave();
  const rw = writes.find(w => /^gifts\/receipts\//.test(w.path));
  ok("photo + receipt {store,total,returnBy,lines:[],photoCount:1}, no presents", writes.filter(w => /^giftPhotos\//.test(w.path)).length === 1 && rw && rw.val.total === 142.18 && rw.val.store === "Costco" && rw.val.returnBy === "2027-01-15" && rw.val.lines.length === 0 && rw.val.photoCount === 1 && !writes.some(w => /^gifts\/items\//.test(w.path)), rw && rw.val);
  W.gfRcptNew(); W.gfRcAdd(); W.gfRcSet(0, "t", "Sled"); W.gfRcSet(0, "p", "40"); W.gfRcPid(0, "k_julian"); writes.length = 0; W.gfSave();
  const s = writes.find(w => w.op === "set" && /^gifts\/items\//.test(w.path)), r2 = writes.find(w => /^gifts\/receipts\//.test(w.path)).val;
  ok("a line by hand → a present; total = the lines when none typed; no photos node", s && s.val.name === "Sled" && s.val.paid === 40 && s.val.pids.join() === "k_julian" && r2.total === 40 && r2.photoCount === 0 && !writes.some(w => /^giftPhotos\//.test(w.path)));
  W.gfRcptNew(); W.gfRcAdd(); W.gfRcSet(0, "p", "9"); writes.length = 0; W.gfSave();
  ok("a present with no name won't save", T.edit() && writes.length === 0);
  W.gfCancel(); key = "sk-test";
}

console.log("\n# the list: soonest return first; photos read only on open");
{
  const d = D(); d.receipts = {
    r1: { store: "Old", iso: "2026-10-01", total: 10, returnBy: "2026-11-01", lines: [], photoCount: 0, occ: "x" },
    r2: { store: "Late", iso: "2026-11-15", total: 20, returnBy: "2027-01-10", lines: [], photoCount: 2, occ: "x" },
    r3: { store: "Soon", iso: "2026-11-02", total: 30, returnBy: "2026-11-22", lines: [{ t: "Dino", p: 20, item: "i3" }], photoCount: 1, occ: "x" },
    r4: { store: "NoDate", iso: "2026-11-19", total: 40, lines: [], photoCount: 0, occ: "x" },
    r5: { store: "Other", iso: "2026-11-19", total: 50, lines: [], photoCount: 0, occ: "bday" } };
  photosInDb = { r2: [JPG, JPG2] };
  reset(d); T.setOcc("x"); W.gfGo("receipts");
  ok("open return windows soonest first, then the rest newest first; other occasions left out", RC.rcpts("x").map(r => r.id).join() === "r3,r2,r4,r1", RC.rcpts("x").map(r => r.id));
  const h = root.innerHTML;
  ok("⏰ chips: 2 days amber, Jan 10 plain, closed window grey", /⏰ return by Nov 22 — 2 days/.test(h) && /⏰ return by Jan 10/.test(h) && /return window closed/.test(h));
  ok("listing the receipts reads no photos", onces.length === 0);
  W.gfRcptToggle("r2"); ok("opening one reads giftPhotos/<rid> once", onces.join() === "giftPhotos/r2" && /Loading 2 photos/.test(root.innerHTML));
  await tick(); await tick();
  ok("…and shows them", (root.innerHTML.match(/<img src="data:image\/jpeg/g) || []).length === 2);
  W.gfRcptToggle("r2"); W.gfRcptToggle("r2"); ok("re-opening doesn't read again", onces.length === 1);
  W.gfRcptToggle("r4"); ok("no photos → no read, says typed by hand", onces.length === 1 && /typed in by hand/.test(root.innerHTML));
  ok("still nothing written", writes.length === 0);
}

console.log("\n# dry-run + secrecy");
{
  dryRun = true; reset(D()); T.setOcc("x"); W.gfRcptNew(); RC.addFile(JPG);
  reply = claude({ store: "Target", date: "2026-11-18", total: 59.99, lines: [{ text: "LEGO", name: "LEGO Friends treehouse", price: 59.99, idea: "LEGO Friends treehouse" }] });
  await W.gfRcptRead(); W.gfSave();
  ok("dry-run: reads, saves on this screen only — no writes", writes.length === 0 && Object.keys(T.data().receipts || {}).length === 1 && T.data().items.i1.paid === 59.99);
  dryRun = false;
  listens.length = 0; mom = false; const r = el("y"); ctx.renderGifts(r, "");
  ok("no Mom → nothing loads (no gifts, no giftPhotos)", /Mom only/.test(r.innerHTML) && listens.length === 0 && onces.length === 0);
  mom = true;
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  ok("index.html never reads gifts/ or giftPhotos/ itself", html.indexOf('db.ref("giftPhotos') < 0 && html.indexOf("giftPhotos") < 0 && html.indexOf('db.ref("gifts') < 0);
  ok("gifts.js reads giftPhotos only in the open-a-receipt path", (SRC.match(/giftPhotos\/"\+rid\)\.once/g) || []).length === 1 && (SRC.match(/\.once\(/g) || []).length === 1);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
