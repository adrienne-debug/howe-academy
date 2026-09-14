/*
 * Node tests for 🏷 Your call in Books (2026-09-14) — the keep/sell/donate ruling from the old page.
 *   · effective call = her decision word if any, else Claude's recommendation, else undecided
 *   · a decision that is a longer note ("keep — bought 9/13") still counts as keep
 *   · filter: leaving (sell/donate/cull), not-ruled-by-you, each word; counts in the select; clear resets
 *   · sheet section: chips, current ruling highlighted, Claude's suggestion + why shown when she hasn't ruled
 *   · tap = ONE update of decision; tapping the current word clears it (null); Mom gate; log line
 *
 *   run:  node test_library_call.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function el(id) { return { id, innerHTML: "", value: "", classList: { add() {}, remove() {}, contains() { return false; } }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("lib-root"); nodes["lib-root"] = root;
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, body: { appendChild() {} }, activeElement: null };
const writes = []; const store = {};
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, once() { return Promise.resolve({ val: () => null }); } }; } };
const ctx = { window: {}, document, db, console, setTimeout, Promise, URL: { createObjectURL: () => "", revokeObjectURL() {} }, Blob: function () {}, Image: function () {},
  HA_LS: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, gwShowToast() {}, alert() {}, APP_PIN: "1234", momPinUnlocked: true };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, "library.js"), "utf8"), ctx);
const T = ctx._lbTest;
T.setData([
  { id: "k1", title: "Keeper", subject: "Math", recommendation: "keep", location: {} },
  { id: "s1", title: "Seller", subject: "Math", recommendation: "sell", why: "duplicate of the 2nd edition", location: {} },
  { id: "d1", title: "Donor", subject: "Math", recommendation: "donate", decision: "donate", location: {} },
  { id: "n1", title: "Note keeper", subject: "Math", recommendation: "sell", decision: "keep — bought 2026-09-13 (family money)", location: {} },
  { id: "u1", title: "Unknown", subject: "Math", location: {} },
], {});

console.log("\n# effective call");
{
  const C = T.lbCall;
  ok("recommendation only → that word, not hers", C(T.books()[0]).word === "keep" && !C(T.books()[0]).hers);
  ok("her decision wins", C(T.books()[2]).word === "donate" && C(T.books()[2]).hers);
  ok("a long decision note starting with keep counts as keep (overrides Claude's sell)", C(T.books()[3]).word === "keep" && C(T.books()[3]).hers);
  ok("nothing → undecided", C(T.books()[4]).word === "undecided" && !C(T.books()[4]).hers);
}
console.log("\n# filter");
{
  ctx.lbSetMode("list"); ctx.renderLibrary(root);
  ok("select shows counts: leaving 2, not ruled 3", /Leaving: sell · donate · cull \(2\)/.test(root.innerHTML) && /Not ruled by you yet \(3\)/.test(root.innerHTML));
  ctx.lbSet("call", "out"); ok("leaving → Seller + Donor", /2 of 5 books/.test(root.innerHTML) && /Seller/.test(root.innerHTML) && /Donor/.test(root.innerHTML) && !/Keeper/.test(root.innerHTML));
  ctx.lbSet("call", "unruled"); ok("not ruled → 3", /3 of 5 books/.test(root.innerHTML));
  ctx.lbSet("call", "keep"); ok("keep → Keeper + Note keeper", /2 of 5 books/.test(root.innerHTML) && /Note keeper/.test(root.innerHTML));
  ctx.lbSet("call", "undecided"); ok("undecided → Unknown only", /1 of 5 books/.test(root.innerHTML) && /Unknown/.test(root.innerHTML));
  ctx.lbReset(); ok("clear resets", T.lbF.call === "all" && /5 of 5 books/.test(root.innerHTML));
}
console.log("\n# sheet + ruling");
{
  let h = T.lbCallHtml(T.books()[1]);
  ok("unruled sheet shows Claude's suggestion + why, no chip highlighted", /Claude suggests <b>sell<\/b>: duplicate/.test(h) && !/✓ /.test(h) && /lbRule\('s1','sell'\)/.test(h));
  h = T.lbCallHtml(T.books()[3]);
  ok("her ruling: keep chip highlighted, the note shown", /✓ keep/.test(h) && /— yours/.test(h) && /bought 2026-09-13/.test(h));
  writes.length = 0; ctx.lbRule("s1", "sell");
  ok("tap = one update {decision:'sell'} + log", writes.filter(w => w.op === "update").length === 1 && writes[0].path === "library/books/s1" && writes[0].val.decision === "sell" && writes.some(w => w.op === "push"), writes);
  ok("now hers", T.lbCall(T.books()[1]).hers && T.lbCall(T.books()[1]).word === "sell");
  writes.length = 0; ctx.lbRule("s1", "sell");
  ok("tapping the current word clears it (decision:null) → back to Claude's suggestion", writes[0].val.decision === null && !T.lbCall(T.books()[1]).hers && T.lbCall(T.books()[1]).word === "sell");
  writes.length = 0; ctx.lbRule("k1", "donate");
  ok("a different word overwrites", writes[0].val.decision === "donate" && T.lbCall(T.books()[0]).word === "donate");
  vm.runInContext("momPinUnlocked=false", ctx); ctx._plMomOk = false; writes.length = 0; ctx.lbRule("u1", "keep");
  ok("Mom gate: nothing written", writes.length === 0 && /Admin Code/.test(nodes["lb-shbody"].innerHTML));
  ok("sheet includes the section", (vm.runInContext("momPinUnlocked=true", ctx), ctx.lbOpen("s1"), /🏷 Your call/.test(nodes["lb-shbody"].innerHTML)));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
