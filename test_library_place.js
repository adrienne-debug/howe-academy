/*
 * Node tests for 🧭 placement — Stage A2 (2026-09-13): "add new books and AI helps plan where they go".
 *   · transit states BOX / UNPACK / TABLE / PUTUP round-trip and the 📦 To shelve filter catches all four
 *   · ⚙ Room rules: Mom-gated, one set on library/rules, the prompt carries the rules text
 *   · the prompt carries every cube/cart's occupancy (compressed) + the book's own line, never the book itself in occupancy
 *   · a proposal is parsed and shown; NOTHING is written until ✓ Place; ✓ Place = one update of location + log
 *   · alternates apply; a cart proposal with laterCube stores nextCube; bad JSON → message, no write
 *   · re-shelve check: titles resolved to ids, unknown titles dropped, each ✓ = one update
 *
 *   run:  node test_library_place.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function el(id) { return { id, innerHTML: "", value: "", classList: { add() {}, remove() {}, contains() { return false; } }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {}, remove() {} }; }
const nodes = {}; const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, body: { appendChild() {} }, activeElement: null };
const writes = [], toasts = []; let reply = null, lastPrompt = "", fetchCalls = 0;
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); return Promise.resolve(); }, update(v) { writes.push({ op: "update", path: p, val: v }); return Promise.resolve(); }, push(v) { writes.push({ op: "push", path: p, val: v }); return Promise.resolve(); }, once() { return Promise.resolve({ val: () => null }); } }; } };
const ctx = { window: {}, document, db, console, setTimeout, Promise, JSON, URL: { createObjectURL: () => "blob:x", revokeObjectURL() {} }, Blob: function () {}, Image: function () {},
  gwShowToast: m => toasts.push(m), alert: m => toasts.push("ALERT " + m), APP_PIN: "1234", momPinUnlocked: true, mastAIKey: "k",
  fetch: (url, opts) => { fetchCalls++; lastPrompt = JSON.parse(opts.body).messages[0].content; return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ type: "text", text: typeof reply === "string" ? reply : JSON.stringify(reply) }] }) }); } };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, "library.js"), "utf8"), ctx);
const T = ctx._lbTest;
const tick = () => new Promise(r => setTimeout(r, 5));
T.setData([
  { id: "dm-4a", title: "Dimensions Math 4A", subject: "Math", kid: "ellis", status: "planned", location: { kallax: "BOX" } },
  { id: "dm-3b", title: "Dimensions Math 3B", subject: "Math", kid: "ellis", status: "in-use", location: { cart: "ellis", tier: 2 } },
  { id: "mr-d", title: "Mathematical Reasoning D", subject: "Math reasoning", kid: "ellis", status: "in-use", location: { kallax: "D5" } },
  { id: "sotw", title: "Story of the World 1", subject: "History", kid: "all", status: "in-use", location: { kallax: "BASKET" } },
  { id: "aas-3", title: "All About Spelling 3", subject: "Spelling", kid: "lincoln", status: "planned", location: { kallax: "UNPACK" } },
  { id: "hwt-c", title: "HWT Cursive", subject: "Handwriting", kid: "ellis", status: "planned", location: { kallax: "PUTUP", nextCube: "B4" } },
  { id: "loose", title: "Loose book", subject: "Art", location: {} },
], {});

(async () => {
  console.log("\n# transit states");
  {
    const keys = T.books().map(b => T.lbInTransit(b));
    ok("BOX / UNPACK / PUTUP are transit; cart, cube, basket, nowhere are not", keys.join() === "true,false,false,false,true,true,false", keys);
    ok("PUTUP text shows the target cube", T.lbLocText({ location: { kallax: "PUTUP", nextCube: "B4" } }) === "🪜 put up → B4");
    const f = T.lbLocForm({ location: { kallax: "PUTUP", nextCube: "b4" } }); const back = T.lbLocFrom(f);
    ok("PUTUP round-trips with nextCube upper-cased", f.mode === "PUTUP" && back.kallax === "PUTUP" && back.nextCube === "B4");
    ok("UNPACK round-trips", T.lbLocFrom(T.lbLocForm({ location: { kallax: "UNPACK" } })).kallax === "UNPACK");
    T.lbF.loc = "toshelve"; const hits = T.books().filter(T.lbMatch).map(b => b.id);
    ok("📦 To shelve filter = the three transit books", hits.join() === "dm-4a,aas-3,hwt-c", hits);
    T.lbF.loc = "all";
  }
  console.log("\n# occupancy + prompt");
  {
    const occ = T.lbOccupancy("dm-4a");
    ok("one line per place, counts, the book itself excluded", /CART ELLIS tier 2 \(1\): Dimensions Math 3B \[math·in-use·ellis\]/.test(occ) && /^D5 \(1\)/m.test(occ) && /TRANSIT UNPACK \(1\)/.test(occ) && /NOWHERE \(1\)/.test(occ) && !/4A/.test(occ), occ);
    T.setRules({ md: "Math → D4, D5. In use → cart tier 2.", updated: "2026-09-13" });
    const p = T.lbPlacePrompt(T.books()[0]);
    ok("prompt = rules + occupancy + the book line + strict JSON ask", /HER ROOM RULES ===\nMath → D4, D5/.test(p) && /WHAT IS WHERE RIGHT NOW/.test(p) && /THE BOOK ===\nDimensions Math 4A · subject: Math/.test(p) && /Return ONLY strict JSON/.test(p));
    ok("plan location parsing: kallax / cart / basket / bad", T.lbPlanLoc({ type: "kallax", cube: "d5" }).kallax === "D5" && T.lbPlanLoc({ type: "cart", kid: "Ellis", tier: "2" }).cart === "ellis" && T.lbPlanLoc({ type: "basket" }).kallax === "BASKET" && T.lbPlanLoc({ type: "kallax" }) === null);
  }
  console.log("\n# proposal → ✓ Place");
  {
    writes.length = 0; toasts.length = 0; fetchCalls = 0;
    reply = "Here you go:\n{\"location\":{\"type\":\"cart\",\"kid\":\"ellis\",\"tier\":2},\"lane\":\"Math\",\"reason\":\"Ellis starts it this month; D5 has room for it later.\",\"alternates\":[{\"type\":\"kallax\",\"cube\":\"D5\",\"why\":\"if it waits\"}],\"laterCube\":\"d5\"}";
    ctx.lbOpen("dm-4a"); await ctx.lbPlace("dm-4a"); await tick();
    const plan = T.plan()["dm-4a"];
    ok("one API call; proposal parsed with lane, reason, 1 alternate, laterCube upper-cased", fetchCalls === 1 && plan && plan.location.type === "cart" && plan.lane === "Math" && plan.alternates.length === 1 && plan.laterCube === "D5", plan);
    ok("NOTHING written by the proposal", writes.length === 0);
    const h = T.lbPlanHtml(T.books()[0]);
    ok("card shows proposal, later cube, ✓ Place and the alternate", /Proposed: 🛒 Ellis&#39;s cart · tier 2/.test(h) && /When it is done → Kallax D5/.test(h) && /lbPlaceApply\('dm-4a',-1\)/.test(h) && /lbPlaceApply\('dm-4a',0\)/.test(h) && /nothing moves until you tap/.test(h), h.slice(0, 300));
    ctx.lbPlaceApply("dm-4a", -1);
    ok("✓ Place = one update of location (+ nextCube from laterCube) and a log line", writes.filter(w => w.op === "update").length === 1 && writes[0].path === "library/books/dm-4a" && JSON.stringify(writes[0].val) === JSON.stringify({ location: { cart: "ellis", tier: 2, kallax: null, nextCube: "D5" } }) && writes.some(w => w.op === "push" && w.path === "library/log" && /proposal/.test(w.val.keys.join())), writes);
    ok("in memory + proposal cleared", T.books()[0].location.cart === "ellis" && !T.plan()["dm-4a"]);
    writes.length = 0; reply = { location: { type: "kallax", cube: "B4" }, reason: "spelling lane", alternates: [{ type: "kallax", cube: "B3", why: "younger" }] };
    await ctx.lbPlace("aas-3"); await tick(); ctx.lbPlaceApply("aas-3", 0);
    ok("alternate applies", writes[0].val.location.kallax === "B3" && !("nextCube" in writes[0].val.location));
    writes.length = 0; reply = "I am not sure.";
    await ctx.lbPlace("mr-d"); await tick();
    ok("bad answer → message, no proposal, no write", !T.plan()["mr-d"] && writes.length === 0 && /❌/.test(T.lbPlanHtml(T.books().find(b => b.id === "mr-d"))));
    reply = { location: { type: "kallax", cube: "D5" }, reason: "fine" }; await ctx.lbPlace("mr-d"); await tick();
    ok("already-there proposal says so and offers no ✓", /Already in the right place/.test(T.lbPlanHtml(T.books().find(b => b.id === "mr-d"))) && !/lbPlaceApply\('mr-d',-1\)/.test(T.lbPlanHtml(T.books().find(b => b.id === "mr-d"))));
  }
  console.log("\n# ⚙ rules");
  {
    writes.length = 0; ctx.momPinUnlocked = false; vm.runInContext("momPinUnlocked=false", ctx); ctx._plMomOk = false;
    ctx.lbRulesOpen(); ok("rules editor needs the code", ctx.lbRulesEdit === null && /Admin Code/.test(nodes["lb-shbody"].innerHTML));
    ctx.lbPinTry("1234"); ok("code opens the editor with the current text", ctx.lbRulesEdit === "Math → D4, D5. In use → cart tier 2." && /Room rules/.test(nodes["lb-shbody"].innerHTML));
    ctx.lbRulesEdit = "Math → D4, D5.\r\nScience → E1."; ctx.lbRulesSave();
    ok("save = one set on library/rules with CRs stripped + log", writes.filter(w => w.op === "set").length === 1 && writes[0].path === "library/rules" && writes[0].val.md === "Math → D4, D5.\nScience → E1." && /^\d{4}-\d{2}-\d{2}$/.test(writes[0].val.updated) && T.rules().md.startsWith("Math"));
    ok("next prompt carries the new rules", /Science → E1\./.test(T.lbPlacePrompt(T.books()[0])));
  }
  console.log("\n# 🧭 re-shelve check");
  {
    writes.length = 0; reply = { moves: [{ title: "Story of the World 1", from: "BASKET", to: { type: "kallax", cube: "B1" }, why: "term over" }, { title: "Not A Real Book", from: "X", to: { type: "kallax", cube: "B1" }, why: "?" }, { title: "HWT Cursive", to: { type: "nowhere" }, why: "bad target" }] };
    await ctx.lbReshelve(); await tick();
    const M = T.moves();
    ok("moves resolved to ids; unknown title and bad target dropped", M && !M.busy && M.moves.length === 1 && M.moves[0].id === "sotw" && /Morning Basket/.test(M.moves[0].from), M);
    ok("rendered as a packing list with per-row ✓, nothing written", /1 suggested move/.test(nodes["lb-shbody"].innerHTML) && /lbMoveApply\(0\)/.test(nodes["lb-shbody"].innerHTML) && writes.length === 0);
    ctx.lbMoveApply(0);
    ok("✓ = one update on that book only; row gone", writes.filter(w => w.op === "update").length === 1 && writes[0].path === "library/books/sotw" && writes[0].val.location.kallax === "B1" && T.moves().moves.length === 0 && /Nothing breaks the rules/.test(nodes["lb-shbody"].innerHTML));
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
