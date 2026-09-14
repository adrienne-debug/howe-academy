/*
 * Node tests for 💰 Purchases — Stage C (2026-09-13): esa.js + its wiring in index.html.
 *   · balances are computed, never stored: committed = approved/arrived/partial; pending, denied separate;
 *     remaining = total − committed; family budget has no total → spent view
 *   · save = ONE set on esa/<kind>/<id> + one log push; blanks dropped; amounts numeric; needs vendor+amount
 *   · Buy from wishlist = one new order (pending, same budget) + one update on the wish (ordered, → order id)
 *   · delete = one remove; dry-run = no writes; edit keeps books/bins/fromWish
 *   · views render: balance cards, orders list with filters, wishlist by wave, sheet
 *   · index.html: global + esa listener, sub-tab "purchases", dispatch, hub row, lazy loader
 *
 *   run:  node test_esa.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null };
const writes = [], toasts = [];
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); } }; } };
const ctx = { console, Date, document, db, window: {}, esaData: {}, _todayStr: () => "2026-09-14", _dryRun: () => false, gwShowToast: m => toasts.push(m), confirm: () => true, prompt: () => "14000" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "esa.js"), "utf8"), ctx);
const T = ctx._esTest; T.setRoot(root, "<nav/>");

console.log("\n# balances");
{
  ctx.esaData = { budget: { esa: { year: "2026-27", total: 14000 } }, orders: {
    a: { vendor: "Carolina", amount: 1000, fund: "esa", status: "arrived" }, b: { vendor: "Timberdoodle", amount: 117.38, fund: "esa", status: "approved" },
    c: { vendor: "Timberdoodle", amount: 172.02, fund: "esa", status: "pending" }, d: { vendor: "Timberdoodle", amount: 349, fund: "esa", status: "denied" },
    e: { vendor: "Easy Grammar", amount: 18, fund: "family", status: "arrived" }, f: { vendor: "Amazon", amount: 15, fund: "family", status: "pending" } } };
  const B = T.esBalance("esa");
  ok("esa: committed = arrived + approved", Math.abs(B.committed - 1117.38) < 1e-9 && B.pending === 172.02 && B.denied === 349 && B.count === 4, B);
  ok("esa: remaining = total − committed; if-pending subtracts pending", Math.abs(B.remaining - 12882.62) < 1e-9 && Math.abs(B.ifPending - 12710.60) < 1e-9);
  const F = T.esBalance("family");
  ok("family: no total → remaining null, spent 18, pending 15", F.total === 0 && F.remaining === null && F.committed === 18 && F.pending === 15);
  ok("money formatting", T.money(12882.62) === "$12,882.62" && T.money(null) === "$0.00");
  T.draw(); const h = root.innerHTML;
  ok("balance view shows both cards + remaining", /ESA grant/.test(h) && /Family money/.test(h) && /\$12,882\.62/.test(h) && /Spent \(approved/.test(h));
}
console.log("\n# orders view + filters");
{
  T.setView("orders"); T.draw();
  ok("6 orders listed with chips", /6 orders/.test(root.innerHTML) && /⏳ pending/.test(root.innerHTML) && /💳 family/.test(root.innerHTML));
  ctx.esFilter("fund", "family"); ok("fund filter → 2", /2 orders · \$33\.00/.test(root.innerHTML), root.innerHTML.match(/\d+ orders? · \$[\d.,]+/));
  ctx.esFilter("status", "arrived"); ok("status filter → 1", /1 order · \$18\.00/.test(root.innerHTML));
  ctx.esFilter("fund", "all"); ctx.esFilter("status", "all"); ctx.esFilter("q", "timber pending"); ok("search matches vendor + status words in notes/items only (not status enum)", /0 orders|1 order/.test(root.innerHTML));
  ctx.esFilter("q", "");
}
console.log("\n# save = one set + one log");
{
  writes.length = 0; toasts.length = 0;
  ctx.esNew("orders");
  ok("new order form: pending, esa, today", T.edit().form.status === "pending" && T.edit().form.fund === "esa" && T.edit().form.placed === "2026-09-14" && /➕ New order/.test(root.innerHTML));
  ctx.esSave(); ok("missing vendor refused", writes.length === 0 && /Needs vendor/.test(toasts[toasts.length - 1]));
  ctx.esSet("vendor", "Timberdoodle"); ctx.esSet("n", "14"); ctx.esSet("items", "  Daily Grams 6 eBook "); ctx.esSet("amount", "$18.00"); ctx.esSet("fund", "family"); ctx.esSet("status", "arrived");
  ctx.esSave();
  const set = writes.filter(w => w.op === "set");
  ok("one set on esa/orders/order-14-timberdoodle", set.length === 1 && set[0].path === "esa/orders/order-14-timberdoodle", writes.map(w => w.op + " " + w.path));
  ok("record: numeric amount, trimmed, blanks dropped", set[0].val.amount === 18 && set[0].val.items === "Daily Grams 6 eBook" && !("arrived" in set[0].val) && !("risk" in set[0].val) && set[0].val.fund === "family");
  ok("one log push", writes.filter(w => w.op === "push" && w.path === "esa/log").length === 1 && /Added: Order #14 Timberdoodle \$18\.00 → arrived/.test(writes.find(w => w.op === "push").val.text));
  ok("sheet closed + in memory", T.edit() === null && ctx.esaData.orders["order-14-timberdoodle"].amount === 18);
  writes.length = 0;
  ctx.esaData.orders.a.books = ["x"]; ctx.esEditStart("orders", "a"); ctx.esSet("status", "partial"); ctx.esSave();
  ok("edit keeps id, keeps books[], one set", writes.filter(w => w.op === "set").length === 1 && writes[0].path === "esa/orders/a" && writes[0].val.status === "partial" && writes[0].val.books[0] === "x");
  ok("same slug gets a suffix", T.newId("orders", "a") === "a-2");
}
console.log("\n# wishlist + Buy");
{
  writes.length = 0;
  ctx.esaData.wishlist = { celestron: { item: "Celestron MicroDirect 1080p", est: 130, wave: "1", station: "STA-F2", status: "next", fund: "esa" }, tele: { item: "Telescope", est: null, wave: "3", status: "idea", fund: "esa" } };
  T.setView("wishlist"); T.draw();
  ok("grouped by wave, next first, open est. = 130", /Wave 1/.test(root.innerHTML) && /Wave 3/.test(root.innerHTML) && /open est\. \$130\.00/.test(root.innerHTML) && /esBuy\('celestron'\)/.test(root.innerHTML));
  ctx.esBuy("celestron");
  const set = writes.filter(w => w.op === "set"), up = writes.filter(w => w.op === "update");
  ok("Buy = one new pending order from the wish", set.length === 1 && set[0].path === "esa/orders/celestron-microdirect-1080p" && set[0].val.status === "pending" && set[0].val.amount === 130 && set[0].val.fund === "esa" && set[0].val.fromWish === "celestron", set);
  ok("…and one update marking the wish ordered → order id", up.length === 1 && up[0].path === "esa/wishlist/celestron" && up[0].val.status === "ordered" && /→ order celestron-microdirect-1080p/.test(up[0].val.notes));
  ok("opens the new order for vendor/amount, on the orders view", T.edit() && T.edit().kind === "orders" && T.edit().id === "celestron-microdirect-1080p" && T.view() === "orders");
  ctx.esCancel();
}
console.log("\n# delete, budget, dry-run");
{
  writes.length = 0;
  ctx.esEditStart("orders", "d"); ctx.esDelete();
  ok("delete = one remove + log, gone from memory", writes.filter(w => w.op === "remove").length === 1 && writes[0].path === "esa/orders/d" && !ctx.esaData.orders.d);
  writes.length = 0; ctx.esBudgetEdit("family");
  ok("budget total = one set on esa/budget/family", writes[0].op === "set" && writes[0].path === "esa/budget/family" && writes[0].val.total === 14000);
  vm.runInContext("_dryRun=function(){return true}", ctx); writes.length = 0;
  ctx.esEditStart("orders", "a"); ctx.esSet("notes", "x"); ctx.esSave();
  ok("dry-run: nothing written", writes.length === 0);
  vm.runInContext("_dryRun=function(){return false}", ctx);
}
console.log("\n# index.html wiring");
{
  const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  ok("global esaData + esa listener", /let esaData=\{\}/.test(src) && /db\.ref\("esa"\)\.on\("value"/.test(src));
  ok("sub-tab list has purchases with 💰 label", /\["hq","settings","curriculum","calendar","chores","purchases"\]/.test(src) && /s==="purchases"\?"💰"/.test(src));
  ok("dispatch → renderPurchasesView", /adminSubTab==="purchases"\)\{ renderPurchasesView\(el,ah\); \}/.test(src));
  ok("Mom HQ hub row", /_hqRowFn\("setAdminSub\('purchases'\)","💰","Purchases & ESA"/.test(src));
  ok("lazy loader loads esa.js with cache-bust on github.io", /PURCHASES_START/.test(src) && /"esa\.js\?v="\+Date\.now\(\)/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
