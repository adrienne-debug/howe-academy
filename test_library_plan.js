/*
 * Node tests for 📋 the Packing list in Books (2026-09-14) — the frozen Kallax Reset plan as a checklist.
 *   · third mode; no plan node → friendly empty state
 *   · cubes in the plan's order, with why + lane colour; NEW arrivals section with "cube · after X"
 *   · progress: books in their planned cube / planned; cubes done
 *   · rows: ✓ when the book's location IS the cube; otherwise "now: …" and ✓ writes ONE location update + log
 *   · ✓ on a row already in place writes nothing; Mom gate; ✔ cube toggles library/plan/done (one set)
 *   · fold: done cubes and complete cubes fold by default; a fold toggle is remembered
 *
 *   run:  node test_library_plan.js
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
  { id: "a", title: "Apologia Astronomy", subject: "Science", status: "shelved", location: { kallax: "E1" } },
  { id: "b", title: "Blood and Guts", subject: "Science", status: "shelved", location: { kallax: "C5" } },
  { id: "c", title: "Cursive Success", subject: "Handwriting", status: "planned", location: { kallax: "BOX" } },
  { id: "d", title: "DM 6B Textbook", subject: "Math", status: "in-use", location: { cart: "lincoln", tier: 2, kallax: null } },
  { id: "e", title: "Editor in Chief", subject: "Editing", status: "shelved", recommendation: "sell", location: { kallax: "C2" } },
], {});

console.log("\n# empty state + mode");
{
  ctx.lbSetMode("plan"); ctx.renderLibrary(root);
  ok("third mode remembered; no plan → friendly message", T.mode() === "plan" && store.lb_mode === "plan" && /No packing list in the app yet/.test(root.innerHTML) && /📋 Packing list/.test(root.innerHTML));
}
console.log("\n# with a plan");
{
  T.setPlan({ generated: "2026-09-14", note: "Frozen 2026-08-27.", done: ["E1"],
    order: [["E1", "Empty already — start here"], ["C2", ""], ["NEW", ""], ["B3", "EVACUATE"]],
    cubes: { E1: { lane: "SCIENCE", ids: ["a", "b"] }, C2: { lane: "WRITING", ids: ["e"] }, B3: { lane: "PHONICS", ids: ["c"] }, D5: { lane: "MATH", ids: ["zzz-missing"] } },
    new: { d: { cube: "D4", where: "after DM 6A" } } });
  ctx.lbSetMode("plan");
  const h = root.innerHTML;
  const S = T.lbPlanStats();
  ok("stats: 2 of 4 planned in place (missing id skipped), 1 of 4 cubes done", S.inPlace === 2 && S.planned === 4 && S.done === 1 && S.cubes === 4 && /2 of 4<\/b> books/.test(h) && /1 of 4<\/b> cubes/.test(h), S);
  ok("cubes in the plan's order, then unlisted cubes appended (D5 last)", h.indexOf("<b>E1</b>") < h.indexOf("<b>C2</b>") && h.indexOf("<b>C2</b>") < h.indexOf("New arrivals") && h.indexOf("New arrivals") < h.indexOf("<b>B3</b>") && h.indexOf("<b>B3</b>") < h.indexOf("<b>D5</b>"));
  ok("why + lane colour + counts on the header", /Empty already — start here/.test(h) && /background:#A3BFB3/.test(h) && /EVACUATE/.test(h) && /1 \/ 2/.test(h));
  ok("E1 done → ✔ done, folded (its rows hidden)", /lb-pcube done/.test(h) && /✔ done/.test(h) && !/Apologia Astronomy/.test(h));
  ok("C2 complete (1/1) → folded by default; B3 open with its row and 'now:' text", !/Editor in Chief/.test(h) && /Cursive Success/.test(h) && /📦 still in the box/.test(h));
  ok("NEW section: row with cube · after X, not in place (on a cart)", /new · D4 · after DM 6A/.test(h) && /Lincoln&#39;s cart|Lincoln's cart/.test(h) && /0 \/ 1/.test(h));
  ctx.lbPlanOpen.E1 = true; ctx.lbSetMode("plan");
  ok("unfold a done cube: rows show, in-place row struck + ✓, out-of-place row shows where it is", /lb-prow ok/.test(root.innerHTML) && /Apologia Astronomy/.test(root.innerHTML) && /Blood and Guts/.test(root.innerHTML) && /🗄 Kallax C5/.test(root.innerHTML));
  ok("sell recommendation rides along as a chip", (ctx.lbPlanOpen.C2 = true, ctx.lbSetMode("plan"), /Editor in Chief/.test(root.innerHTML) && />sell</.test(root.innerHTML)));
}
console.log("\n# ✓ shelve + ✔ done");
{
  writes.length = 0;
  ctx.lbShelve("b", "E1");
  ok("✓ = one update of location to the cube (cart cleared) + log", writes.filter(w => w.op === "update").length === 1 && writes[0].path === "library/books/b" && JSON.stringify(writes[0].val) === JSON.stringify({ location: { cart: null, tier: null, kallax: "E1" } }) && writes.some(w => w.op === "push" && /packing list → E1/.test(w.val.keys.join())), writes);
  ok("stats now 3 of 4", T.lbPlanStats().inPlace === 3);
  writes.length = 0; ctx.lbShelve("b", "E1");
  ok("✓ on an in-place row writes nothing", writes.length === 0);
  ctx.lbShelve("d", "D4");
  ok("a carted book shelved → cart cleared", writes[0].val.location.cart === null && writes[0].val.location.kallax === "D4");
  writes.length = 0; ctx.lbPlanDone("B3");
  ok("✔ cube = one set of library/plan/done with the cube added", writes.filter(w => w.op === "set").length === 1 && writes[0].path === "library/plan/done" && writes[0].val.join() === "E1,B3");
  writes.length = 0; ctx.lbPlanDone("E1");
  ok("✔ again removes it", writes[0].val.join() === "B3");
  vm.runInContext("momPinUnlocked=false", ctx); ctx._plMomOk = false; writes.length = 0;
  ctx.lbShelve("c", "B3"); ctx.lbPlanDone("C2");
  ok("Mom gate: nothing written without the code", writes.length === 0 && /Admin Code/.test(nodes["lb-shbody"].innerHTML));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
