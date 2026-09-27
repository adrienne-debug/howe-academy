/*
 * 📅 Each subject's end date at the top of the Grid (her ask 2026-09-27): a small "ends Feb 4" line under
 * the column name from pacing.builtThrough, colored by planPace (behind → amber "· 3 behind", ahead → green
 * "· 2 ahead", on track → muted); "paused" for a paused subject; nothing without a plan date. Mom-only
 * "Sort by end date" toggle orders columns earliest-ending first, remembered per device only.
 * Runs the real GRIDEND block with planPace stubbed; wiring checks on index.html.
 *
 *   run:  node test_grid_enddates.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// GRIDEND_START"), b = src.indexOf("// GRIDEND_END");
if (a < 0 || b < 0) { console.error("GRIDEND markers not found"); process.exit(1); }
const code = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

function mkEnv(o) {
  o = o || {};
  const store = {};
  const env = {
    currData: { lastEdit: 1, subjects: { lucy: {
      math:  { display: "Math",  pacing: { mode: "timesPerWeek", tpw: 4, builtThrough: "2027-02-04" } },
      latin: { display: "Latin", pacing: { mode: "timesPerWeek", tpw: 3, builtThrough: "2026-11-20" } },
      hist:  { display: "History", pacing: { mode: "timesPerWeek", tpw: 2, builtThrough: "2027-05-15" } },
      art:   { display: "Art" },                                                     // no plan date
      sci:   { display: "Science", paused: true, pacing: { mode: "timesPerWeek", tpw: 2, builtThrough: "2027-01-10" } },
      book1: { display: "Book 1", pacing: { builtThrough: "2026-12-01" } },
      book2: { display: "Book 2", pacing: { builtThrough: "2027-03-03" } },
    } } },
    checked: {},
    pace: o.pace || {},                       // stubbed planPace results, keyed "kid|sk"
    planPaceCalls: 0,
    cbTodayISO: () => o.today || "2026-09-27",
    gwParseDate: s => { const p = s.split("-"); return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])); },
    esc: s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    momModeActive: o.mom !== false, adminPinUnlocked: false,
    gvEdit: null, renders: 0, renderAll: () => { env.renders++; },
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    store,
    Date, Math, Object, JSON, String, Number, Array, parseInt, isNaN, console, RegExp,
  };
  if (o.preset) store["ha_gv_endsort"] = o.preset;
  env.momHere = () => env.momModeActive || env.adminPinUnlocked;
  env.planPace = (k, sk) => { env.planPaceCalls++; return env.pace[k + "|" + sk] || { behind: 0, ahead: 0, score: 0 }; };
  env.window = env;
  vm.createContext(env);
  new vm.Script(code).runInContext(env);
  env.get = name => vm.runInContext(name, env);   // top-level `let` lives in the context, not on env
  return env;
}

// ── the line text ─────────────────────────────────────────────────────────────────────────
{
  const e = mkEnv();
  ok("a subject with a plan date reads 'ends Feb 4' (short, no year — a school year spans two)", e.gvEndInfo("lucy", "math").text === "ends Feb 4", e.gvEndInfo("lucy", "math").text);
  ok("a date in the current year formats the same way", e.gvEndInfo("lucy", "latin").text === "ends Nov 20", e.gvEndInfo("lucy", "latin").text);
  ok("a malformed date falls back to the raw value, no throw", (e.currData.subjects.lucy.art.pacing = { builtThrough: "soon" }, e.currData.lastEdit = 9, e.gvEndInfo("lucy", "art").text === "ends soon"));
  delete e.currData.subjects.lucy.art.pacing; e.currData.lastEdit = 1;
  ok("no plan date → nothing", e.gvEndInfo("lucy", "art").text === "" && e.gvEndLine("lucy", "art") === "");
  ok("unknown subject → nothing, no throw", e.gvEndLine("lucy", "nope") === "" && e.gvEndLine("ellis", "math") === "");
  ok("a paused subject reads 'paused' (grey), even with a plan date", e.gvEndInfo("lucy", "sci").text === "paused" && e.gvEndInfo("lucy", "sci").color === "#6b7280" && e.gvEndInfo("lucy", "sci").iso === "");
  ok("on track → muted color, no suffix", e.gvEndInfo("lucy", "math").color === "var(--muted)" && !/behind|ahead/.test(e.gvEndInfo("lucy", "math").text));
  const html = e.gvEndLine("lucy", "math");
  ok("the line is one small block span under the name", /^<span class="gv-end" style="color:var\(--muted\)">ends Feb 4<\/span>$/.test(html), html);
}
// ── behind / ahead from planPace (numbers straight through, no new math) ────────────────────
{
  const e = mkEnv({ pace: { "lucy|math": { behind: 3, ahead: 0, score: -3 }, "lucy|latin": { behind: 0, ahead: 2, score: 2 }, "lucy|hist": { behind: 1, ahead: 1, score: 0 } } });
  ok("behind → amber text with '· 3 behind'", e.gvEndInfo("lucy", "math").text === "ends Feb 4 · 3 behind" && e.gvEndInfo("lucy", "math").color === "#b45309", e.gvEndInfo("lucy", "math"));
  ok("ahead → green text with '· 2 ahead'", e.gvEndInfo("lucy", "latin").text === "ends Nov 20 · 2 ahead" && e.gvEndInfo("lucy", "latin").color === "#15803d", e.gvEndInfo("lucy", "latin"));
  ok("behind wins when planPace reports both", /· 1 behind$/.test(e.gvEndInfo("lucy", "hist").text));
  ok("the html escapes nothing it shouldn't and carries the color", e.gvEndLine("lucy", "math") === '<span class="gv-end" style="color:#b45309">ends Feb 4 · 3 behind</span>');
  ok("planPace is never asked about a paused subject or one with no plan date", (e.gvEndInfo("lucy", "sci"), e.gvEndInfo("lucy", "art"), e.planPaceCalls) === 3);
}
// ── cache: once per subject per render key ───────────────────────────────────────────────────
{
  const e = mkEnv({ pace: { "lucy|math": { behind: 2, ahead: 0, score: -2 } } });
  e.gvEndInfo("lucy", "math"); e.gvEndInfo("lucy", "math"); e.gvEndLine("lucy", "math"); e.gvEndSortCols("lucy", ["math", "latin"], {});
  ok("repeat lookups within a render hit the cache (planPace called once for math)", e.planPaceCalls === 2, e.planPaceCalls); // math + latin
  e.currData.lastEdit = 2; e.gvEndInfo("lucy", "math");
  ok("an edit to the curriculum invalidates the cache", e.planPaceCalls === 3, e.planPaceCalls);
  e.checked.x = 1; e.gvEndInfo("lucy", "math");
  ok("a new check-off invalidates the cache", e.planPaceCalls === 4, e.planPaceCalls);
}
// ── sort by end date ─────────────────────────────────────────────────────────────────────────
{
  const e = mkEnv();
  ok("three subjects with different dates order earliest-ending first", eq(e.gvEndSortCols("lucy", ["math", "hist", "latin"], {}), ["latin", "math", "hist"]), e.gvEndSortCols("lucy", ["math", "hist", "latin"], {}));
  ok("subjects without a plan date keep their order at the end", eq(e.gvEndSortCols("lucy", ["art", "math", "sci", "latin"], {}), ["latin", "math", "art", "sci"]), e.gvEndSortCols("lucy", ["art", "math", "sci", "latin"], {}));
  ok("a lane column sorts by its last book's end", eq(e.gvEndSortCols("lucy", ["math", "ln1", "latin"], { ln1: { members: ["book1", "book2"] } }), ["latin", "math", "ln1"]));
  ok("empty input is fine", eq(e.gvEndSortCols("lucy", [], {}), []) && eq(e.gvEndSortCols("lucy", undefined, undefined), []));
}
// ── the toggle: Mom-only, per device, never Firebase ─────────────────────────────────────────
{
  const e = mkEnv();
  ok("default is the current order (sort off)", e.get("gvEndSort") === false && e.gvEndSortOn() === false);
  e.gvEndSortToggle();
  ok("Mom's tap turns it on, remembers it on this device and repaints", e.get("gvEndSort") === true && e.gvEndSortOn() === true && e.store["ha_gv_endsort"] === "1" && e.renders === 1);
  e.gvEndSortToggle();
  ok("a second tap turns it off and remembers that too", e.get("gvEndSort") === false && e.store["ha_gv_endsort"] === "0" && e.renders === 2);
  const r = mkEnv({ preset: "1" });
  ok("the remembered choice comes back on the next load", r.get("gvEndSort") === true && r.gvEndSortOn() === true);
  const k = mkEnv({ preset: "1", mom: false });
  ok("without Mom the remembered sort does not apply and the tap does nothing", k.gvEndSortOn() === false && (k.gvEndSortToggle(), k.get("gvEndSort") === true && k.renders === 0));
  ok("the block never touches the database", !/\bdb\b|\.set\(|\.update\(|\.remove\(|ref\(/.test(code));
}
// ── wiring in index.html ─────────────────────────────────────────────────────────────────────
{
  const g0 = src.indexOf("function renderCurrGrid(el){"), g1 = src.indexOf("\n}\n", g0);
  const grid = src.slice(g0, g1);
  ok("renderCurrGrid exists", g0 > 0 && grid.length > 1000);
  ok("the subject column header carries the line after the name and chips", /esc\(\(subs\[sk\]\|\|\{\}\)\.display\|\|sk\)\+owedChip\+_pzChip\+\(typeof gvEndLine==="function"\?gvEndLine\(gvKid,sk\):''\)\+'<\/th>'/.test(grid));
  ok("the lane header carries the line for the book that is up", /'\+_act\+_oc\+\(typeof gvEndLine==="function"\?gvEndLine\(gvKid,_upSk\):''\)\+_q\+'<\/th>'/.test(grid));
  ok("columns are re-ordered only when Mom's toggle is on, in memory", /const cols=\(typeof gvEndSortOn==="function"&&gvEndSortOn\(\)\)\?gvEndSortCols\(gvKid,_lnFold\.cols,_lnCols\):_lnFold\.cols;/.test(grid));
  ok("the toolbar toggle is Mom-only and sits with the other Grid tools, not in the header", /if\(\(momModeActive\|\|adminPinUnlocked\)&&typeof gvEndSortToggle==="function"\) h\+='<button onclick="gvEndSortToggle\(\)"[^\n]*Sort by end date<\/button>'/.test(grid) && grid.indexOf("gvEndSortToggle()") < grid.indexOf('<div class="gv-wrap">'));
  ok("the line has its own small style and does not inherit the header's uppercase", /\.gv-end\{display:block;font-size:9px;font-weight:700;text-transform:none;letter-spacing:0;white-space:nowrap;margin-top:1px\}/.test(src));
  ok("the toggle is remembered per device under HA_LS, not in currData", /HA_LS\.setItem\("ha_gv_endsort"/.test(code) && !/currData\.[a-zA-Z]+\s*=/.test(code));
  ok("no column width rule changed", /\.gv \.gv-fix\{position:sticky;left:0;z-index:2;background:#fff;width:108px;min-width:108px;max-width:108px/.test(src) && /\.gv \.gv-min\{position:sticky;left:108px;z-index:2;background:#fff;text-align:right;color:var\(--muted\);width:44px;min-width:44px;max-width:44px\}/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
