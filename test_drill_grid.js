/*
 * 🔡 Grid Size S / M / L for spelling sprints (her ask 2026-09-27): the drill-item sprint (Lincoln's AAS +
 * Spelling set) gets the phonogram sprint's Small 3×6 / Medium 4×7 / Large 5×8 pills, plus "Fit" — the
 * default, and exactly the old 4-across auto-size — so nothing changes until Mom taps a size. Own key
 * (sprintPillState.dgs) so it never moves Lucy's phonogram grid; a fixed size is logged with the result.
 *   run:  node test_drill_grid.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// DRILLGRID_START"), b = src.indexOf("// DRILLGRID_END");
if (a < 0 || b < 0) { console.error("DRILLGRID markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world(o) {
  o = o || {};
  const ctx = { console, sprintPillState: Object.assign({ diff: "intro", gs: "medium", nw: "yes", ps: "both" }, o.pills || {}),
    sprintSource: o.source || "drill", Object, Array, String, Number, Math, JSON };
  vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
  return { ctx, call: e => vm.runInContext(e, ctx) };
}
// The old formula, verbatim from sprintGenerateFromPool before this change.
const oldFit = n => ({ cols: 4, rows: Math.max(3, Math.min(10, Math.ceil(n / 4))) });

console.log("── Fit is the default and is exactly the old auto-size ──");
{
  const w = world();
  ok("no pill state yet → Fit", w.call("sprintDrillGridChoice()") === "fit");
  [0, 1, 5, 10, 12, 13, 28, 30, 40, 41, 60, 200].forEach(n => {
    const g = w.call("sprintDrillGrid(" + n + ")"), e = oldFit(n);
    ok("Fit with " + n + " items → " + e.cols + "×" + e.rows, g.cols === e.cols && g.rows === e.rows, g);
  });
  ok("a stray value falls back to Fit", world({ pills: { dgs: "huge" } }).call("sprintDrillGridChoice()") === "fit");
  ok("Fit logs no grid size (log entry unchanged)", w.call("sprintDrillLoggedGs()") === null);
}

console.log("── S / M / L are Lucy's sizes, whatever the set size ──");
{
  const sizes = { small: [3, 6], medium: [4, 7], large: [5, 8] };
  Object.keys(sizes).forEach(k => {
    const w = world({ pills: { dgs: k } });
    [3, 28, 60].forEach(n => {
      const g = w.call("sprintDrillGrid(" + n + ")");
      ok(k + " with " + n + " items → " + sizes[k].join("×"), g.cols === sizes[k][0] && g.rows === sizes[k][1], g);
    });
    ok(k + " is logged with a drill result", w.call("sprintDrillLoggedGs()") === k);
  });
  ok("the phonogram sprint's own table is unchanged and identical",
    src.includes('const gridSizes={small:[3,6],medium:[4,7],large:[5,8]};') && JSON.stringify(world().call("SPRINT_DRILL_GRIDS")) === JSON.stringify(sizes));
  ok("the phonogram key (gs) is untouched by the drill pill", (() => { const w = world({ pills: { dgs: "large" } }); return w.ctx.sprintPillState.gs === "medium"; })());
  ok("a fixed size is not logged on another source", world({ pills: { dgs: "large" }, source: "phonogram" }).call("sprintDrillLoggedGs()") === null);
}

console.log("── the pill row on the drill sprint form ──");
{
  const h = world().call("sprintDrillGridPillsHtml('#123456', 60)");
  ok("shows Grid Size", h.includes("Grid Size"));
  ["fit", "small", "medium", "large"].forEach(v => ok("a pill taps sprintSetPill('dgs','" + v + "')", h.includes("sprintSetPill('dgs','" + v + "')")));
  ok("labels match the phonogram sprint", h.includes("Small (3×6)") && h.includes("Medium (4×7)") && h.includes("Large (5×8)") && h.includes(">Fit<"));
  ok("Fit is the highlighted pill by default", /data-val="fit"[^>]*border:1\.5px solid #123456/.test(h) && !/data-val="medium"[^>]*border:1\.5px solid #123456/.test(h));
  ok("Fit hint names the auto-sized grid", h.includes("Fit sizes the grid to the set") && h.includes("40 tiles a sheet for these 60 items"));
  const hm = world({ pills: { dgs: "medium" } }).call("sprintDrillGridPillsHtml('#123456', 60)");
  ok("Medium is highlighted when chosen", /data-val="medium"[^>]*border:1\.5px solid #123456/.test(hm) && !/data-val="fit"[^>]*border:1\.5px solid #123456/.test(hm));
  ok("a set bigger than the grid says each sheet draws its own", hm.includes("4×7 — 28 of the 60 items on each sheet; A and B each draw their own."), hm);
  const hs = world({ pills: { dgs: "large" } }).call("sprintDrillGridPillsHtml('#123456', 12)");
  ok("a set smaller than the grid says the rest stay blank", hs.includes("5×8 — 12 items on 40 tiles; the rest stay blank."), hs);
  const he = world({ pills: { dgs: "small" } }).call("sprintDrillGridPillsHtml('#123456', 18)");
  ok("an exact fit has no blank note", he.includes("3×6 — 18 items on 18 tiles."), he);
  ok("no 🔀 anywhere in the block", !src.slice(a, b).includes("\u{1F500}"));
}

console.log("── wiring into the existing sprint code ──");
{
  const gen = src.slice(src.indexOf("function sprintGenerateFromPool("), src.indexOf("// DRILLGRID_START"));
  ok("sprintGenerateFromPool sizes its grid from the pill", gen.includes("const {cols,rows}=sprintDrillGrid(words.length)") && !gen.includes("const cols=4;"));
  const form = src.slice(src.indexOf("function buildSprintFromDrillHtml("), src.indexOf("function buildSprintHtml("));
  ok("the drill form shows the pills above Generate", form.indexOf("sprintDrillGridPillsHtml(color,pool.length)") > 0 && form.indexOf("sprintDrillGridPillsHtml(color,pool.length)") < form.indexOf('onclick="sprintGenerateFromPool()"'));
  ok("the pills sit inside the has-a-set branch (not the empty state)", form.indexOf("if(pool.length){") < form.indexOf("sprintDrillGridPillsHtml") && form.indexOf("sprintDrillGridPillsHtml") < form.indexOf("} else {"));
  const log = src.slice(src.indexOf("function sprintLogResult("), src.indexOf("async function sprintGenerate("));
  ok("the log entry's gs slot takes the drill size (phonogram and editor untouched)", log.includes("gs:isPhon?sprintPillState.gs:(isEd?laSize:sprintDrillLoggedGs())"));
  ok("sprintSetPill is generic: any key, then re-render", /function sprintSetPill\(groupId,val\)\{\s*sprintSaveInputs\(\);\s*sprintPillState\[groupId\]=val;\s*_mastRe\(\);/.test(src));
  ok("the phonogram generator still uses its own gs key", src.includes("const {diff,gs,nw,ps}=sprintPillState;"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
