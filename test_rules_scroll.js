/*
 * Node tests for RULESCROLL — the ⚙ Rules table stays where she was when she taps a pill.
 * Her words 2026-11-10: "if i click something it takes me back to the top instead of allowing me
 * to edit cleanly without movement." The 340-px #cb-daypin-scroll box was rebuilt at row 1,
 * column 1 on every tap: only scrollTop was saved, and only the retired Builder tab restored it.
 *
 *   run:  node test_rules_scroll.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// RULESCROLL_START"), b = src.indexOf("// RULESCROLL_END");
if (a < 0 || b < 0) { console.error("RULESCROLL markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log("FAIL:", msg); } }

// A fake document holding one Rules box (or none).
function ctxWith(box, extra) {
  const ctx = Object.assign({
    document: { getElementById: id => (id === "cb-daypin-scroll" ? box : null) },
    cbDayPinScroll: 0, cbKid: "lincoln",
  }, extra || {});
  vm.createContext(ctx);
  vm.runInContext(BLOCK, ctx);
  return ctx;
}

// 1 · rsGrab captures both axes
{
  const box = { scrollTop: 412, scrollLeft: 230 };
  const c = ctxWith(box);
  vm.runInContext("rsGrab()", c);
  ok(c.cbDayPinScroll.top === 412, "rsGrab saves scrollTop");
  ok(c.cbDayPinScroll.left === 230, "rsGrab saves scrollLeft");
}
// 2 · rsRestore writes both back onto a fresh box (the rebuilt one starts at 0,0)
{
  const old = { scrollTop: 412, scrollLeft: 230 };
  const c = ctxWith(old);
  vm.runInContext("rsGrab()", c);
  const fresh = { scrollTop: 0, scrollLeft: 0 };
  c.document = { getElementById: id => (id === "cb-daypin-scroll" ? fresh : null) };
  vm.runInContext("rsRestore()", c);
  ok(fresh.scrollTop === 412 && fresh.scrollLeft === 230, "rsRestore puts both axes back: " + JSON.stringify(fresh));
}
// 3 · no box in the DOM: rsGrab keeps the last position, rsRestore does nothing
{
  const c = ctxWith(null, { cbDayPinScroll: { top: 90, left: 40, kid: "lincoln" } });
  vm.runInContext("rsGrab(); rsRestore();", c);
  ok(c.cbDayPinScroll.top === 90 && c.cbDayPinScroll.left === 40, "rsGrab with no box keeps the saved position");
}
// 4 · the old numeric save still reads (top only)
{
  const box = { scrollTop: 0, scrollLeft: 0 };
  const c = ctxWith(box, { cbDayPinScroll: 150 });
  vm.runInContext("rsRestore()", c);
  ok(box.scrollTop === 150 && box.scrollLeft === 0, "a numeric cbDayPinScroll restores as scrollTop");
}
// 5 · another kid's table is not scrolled to this kid's spot
{
  const box = { scrollTop: 0, scrollLeft: 0 };
  const c = ctxWith(box, { cbDayPinScroll: { top: 300, left: 120, kid: "lincoln" }, cbKid: "ellis" });
  vm.runInContext("rsRestore()", c);
  ok(box.scrollTop === 0 && box.scrollLeft === 0, "kid switch: Ellis's table starts at its top");
}

// 6 · wiring — the Grid restores after its markup is in the DOM
const grid = slice("renderCurrGrid");
{
  const ih = grid.lastIndexOf("el.innerHTML+=h;");
  const rr = grid.indexOf("rsRestore()");
  ok(rr > 0, "renderCurrGrid calls rsRestore");
  ok(ih > 0 && rr > ih, "renderCurrGrid restores AFTER the panel markup is in the DOM");
  ok(grid.indexOf("cbRenderRules(") > 0 && grid.indexOf("cbRenderRules(") < ih, "the Rules panel is part of the markup that lands before the restore");
}
// 7 · the Builder uses the same helper; no bare scrollTop-only save/restore is left anywhere
{
  const bld = slice("renderCurrBuilder");
  ok(bld.indexOf("rsRestore()") > bld.lastIndexOf("el.innerHTML+=h;"), "renderCurrBuilder restores through rsRestore after its markup");
  ok(!/cbDayPinScroll\s*=\s*_dp\.scrollTop/.test(src), "the old scrollTop-only saves are gone");
  ok(!/_dp\.scrollTop\s*=\s*cbDayPinScroll/.test(src), "the old scrollTop-only restore is gone");
}
// 8 · rlSet and cbPinDay grab before their write
for (const fn of ["rlSet", "cbPinDay"]) {
  const f = slice(fn);
  const g = f.indexOf("rsGrab()"), w = f.indexOf("db.ref(");
  ok(g > 0 && w > 0 && g < w, fn + " calls rsGrab before it writes");
}
// 9 · the box tracks her own scrolling, so a later render (the relay's ~2 s later) lands where she is now
{
  const rules = slice("cbRenderRules");
  ok(/id="cb-daypin-scroll" onscroll="rsGrab\(\)"/.test(rules), "the Rules box saves its position as she scrolls");
}
// 10 · nothing written by the block
ok(!/db\.ref|\.set\(|\.update\(|\.remove\(/.test(BLOCK), "RULESCROLL writes nothing");
// 11 · mutation check: without the block's restore, the Grid path never touches the Rules box
{
  const stripped = grid.replace(/if\(cbRulesOpen\) rsRestore\(\);[^\n]*\n/, "");
  ok(stripped !== grid && !/cb-daypin-scroll|rsRestore|cbDayPinScroll/.test(stripped), "mutation: the Grid has no other Rules-box restore");
}

// 12 · pin the half that already worked: _preserveUI keeps the window's scroll for an unchanged _viewSig
{
  const code = slice("_viewSig") + "\nlet _uiLastSig=null;\n" + slice("_preserveUI");
  const scrolls = [];
  const content = { querySelectorAll: () => [], contains: () => false };
  const ctx = {
    tab: "schedule", schedShowAdmin: true, schedShowHistory: false, schedShowPace: false, schedShowBoard: false, schedShowPeek: false,
    adminSubTab: "curriculum", histTab: "", mastView: "", day: "Mon", kid: "lincoln",
    document: { getElementById: id => (id === "content" ? content : null), activeElement: null },
    window: { scrollX: 0, scrollY: 0, scrollTo: (x, y) => scrolls.push([x, y]) },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  vm.runInContext("_preserveUI(function(){})", ctx);          // first paint: records the signature
  ok(scrolls.length === 0, "first paint does not restore scroll");
  ctx.window.scrollX = 15; ctx.window.scrollY = 880;
  vm.runInContext("_preserveUI(function(){ window.scrollY=0; window.scrollX=0; })", ctx);   // a tap's re-render
  ok(scrolls.length === 1 && scrolls[0][0] === 15 && scrolls[0][1] === 880, "same view: window scroll restored " + JSON.stringify(scrolls));
  ctx.window.scrollY = 500; ctx.kid = "ellis";
  vm.runInContext("_preserveUI(function(){})", ctx);
  ok(scrolls.length === 1, "a different view (kid) is not restored");
}

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
