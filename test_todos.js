/*
 * Node tests for the two to-do lists (2026-09-14): 📌 Book & shelf to-dos (library.js, library/todos) and
 * 🧹 Room to-dos (play.js ROOMTODO block, play/todos).
 *   · open first, grouped by area, done folded behind "Show n done"; counts in the button / header
 *   · ✓ = one update/set of done (ts), ✓ again reopens (null); ➕ = one set of a new record; blank refused
 *   · Mom gate on both; nothing written otherwise
 *
 *   run:  node test_todos.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

console.log("\n# 📌 Books");
{
  function el(id) { return { id, innerHTML: "", value: "", classList: { add() {}, remove() {}, contains() { return false; } }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
  const nodes = {}; const root = el("lib-root"); nodes["lib-root"] = root;
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, body: { appendChild() {} }, activeElement: null };
  const writes = [];
  const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, push() {}, once() { return Promise.resolve({ val: () => null }); } }; } };
  const ctx = { window: {}, document, db, console, setTimeout, Promise, URL: { createObjectURL: () => "", revokeObjectURL() {} }, Blob: function () {}, Image: function () {}, HA_LS: { getItem: () => null, setItem() {} }, gwShowToast() {}, alert() {}, APP_PIN: "1234", momPinUnlocked: true };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, "library.js"), "utf8"), ctx);
  const T = ctx._lbTest; T.setData([{ id: "b", title: "B", subject: "Math", location: {} }], {});
  T.setTodos({ a1: { text: "Shoot LoE boxes", area: "shoot", added: "2026-09-14" }, a2: { text: "Buy DM 1B", area: "buy", added: "2026-09-14" }, a3: { text: "Old one", area: "decide", added: "2026-08-01", done: 1 } });
  ctx.lbSetMode("list"); ctx.renderLibrary(root);
  ok("top bar shows 📌 To-dos (2 open)", /📌 To-dos \(2\)/.test(root.innerHTML));
  ctx.lbTodoOpenSheet();
  const h = () => nodes["lb-shbody"].innerHTML;
  ok("sheet: 2 open grouped by area, done folded", /2 open · 1 done/.test(h()) && /🛒 buy/.test(h()) && /📸 shoot/.test(h()) && !/Old one/.test(h()) && /Show 1 done/.test(h()));
  ok("buy sorts before shoot (area order)", h().indexOf("Buy DM 1B") < h().indexOf("Shoot LoE boxes"));
  writes.length = 0; ctx.lbTodoToggle("a1");
  ok("✓ = one update {done:ts} on library/todos/a1", writes.length === 1 && writes[0].op === "update" && writes[0].path === "library/todos/a1" && typeof writes[0].val.done === "number");
  ctx.lbTodoToggle("a1"); ok("✓ again reopens (done:null)", writes[1].val.done === null && !T.todos().a1.done);
  writes.length = 0; ctx.lbTodoDraft = { text: "  ", area: "buy" }; ctx.lbTodoAdd(); ok("blank refused", writes.length === 0);
  ctx.lbTodoDraft = { text: "  Bookends ×8 ", area: "buy" }; ctx.lbTodoAdd();
  ok("➕ = one set of a new record, trimmed, dated", writes.length === 1 && writes[0].op === "set" && /^library\/todos\/t[a-z0-9]+$/.test(writes[0].path) && writes[0].val.text === "Bookends ×8" && writes[0].val.area === "buy" && /^\d{4}-\d{2}-\d{2}$/.test(writes[0].val.added));
  ok("sheet still open, 3 open now", T.todoOpen() && /3 open/.test(h()));
  vm.runInContext("momPinUnlocked=false", ctx); ctx._plMomOk = false; writes.length = 0; ctx.lbTodoToggle("a2");
  ok("Mom gate: nothing written", writes.length === 0);
}
console.log("\n# 🧹 Toys");
{
  const src = fs.readFileSync(path.join(__dirname, "play.js"), "utf8");
  const a = src.indexOf("// ROOMTODO_START"), z = src.indexOf("// ROOMTODO_END");
  ok("ROOMTODO block present", a > 0 && z > a);
  const writes = []; let renders = 0;
  const ctx = { console, String, Object, Array, Date, JSON, window: {}, plFB: true, _mom: true, plMomAuthed: () => ctx._mom, plRender() { renders++; },
    plChip: (l, on, col, click) => '<button onclick="' + click.replace(/"/g, "&quot;") + '">' + l + '</button>',
    db: { ref: p => ({ set(v) { writes.push({ path: p, val: v }); } }) } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src.slice(a, z), ctx);
  vm.runInContext('plTodos={r1:{text:"LEGO tote merge",area:"merge",added:"2026-09-14"},r2:{text:"Rubber bands",area:"buy",added:"2026-09-14"},r3:{text:"Done thing",area:"load",added:"2026-08-01",done:5}}', ctx);
  const T = n => vm.runInContext(n, ctx);
  const h = T("plTodoHtml")();
  ok("card: 2 open · 1 done, grouped (buy before merge), done folded, ➕ Add", /2 open · 1 done/.test(h) && h.indexOf("Rubber bands") < h.indexOf("LEGO tote merge") && !/Done thing/.test(h) && /Show 1 done/.test(h) && /plTodoDraft=\{text:'',area:'load'\}/.test(h));
  ctx.plTodoToggle("r1");
  ok("✓ = one leaf set play/todos/r1/done (ts), re-rendered", writes.length === 1 && writes[0].path === "play/todos/r1/done" && typeof writes[0].val === "number" && renders === 1);
  ctx.plTodoToggle("r1"); ok("✓ again → null", writes[1].val === null);
  writes.length = 0; ctx.plTodoDraft = { text: "Park the stools", area: "load" }; ctx.plTodoAdd();
  ok("➕ = one set of play/todos/<new>", writes.length === 1 && /^play\/todos\/t[a-z0-9]+$/.test(writes[0].path) && writes[0].val.text === "Park the stools" && writes[0].val.area === "load");
  ctx._mom = false; writes.length = 0; ctx.plTodoToggle("r2"); ok("Mom gate", writes.length === 0);
  ok("Room setup draws the card above the rows", /plRoomCheckHtml\(\)\+\s*plTodoHtml\(\)\+\s*rows/.test(src) && /plTodos=v\.todos\|\|\{\};/.test(src) && /window\.plTodoToggle=plTodoToggle;window\.plTodoAdd=plTodoAdd;/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
