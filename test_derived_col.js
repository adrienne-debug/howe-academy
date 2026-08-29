/*
 * Node tests for the DERIVED COLUMN (Stage 2 of "one truth").
 *
 * Grid cells stop being the record for plan-backed subjects — the future is computed from
 * the plan on every render. Her rule (2026-08-28): CARDS WIN on days the scheduler has
 * already dealt, so the kids' week is never rewritten underneath them.
 *
 * These cover the merge, not the projection (test_projection owns that): which source a
 * date takes, what happens when the card and the plan name different lessons, and the
 * guards that must return null rather than render something wrong.
 *
 *   run:  node test_derived_col.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// GVDER_START"), b = src.indexOf("// GVDER_END");
if (a < 0 || b < 0) { console.error("GVDER markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
const norm = src.match(/^const _lidNorm=.*$/m);
if (!norm) throw new Error("_lidNorm not found");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// The world: one plan-backed subject, a materialise result we control, and an active week
// whose cards sit on known dates.
function run(opts) {
  opts = opts || {};
  const ctx = {
    console,
    currData: { subjects: { lincoln: { mr: Object.assign({ display: "MR", paused: false }, opts.subject || {}) } } },
    planBacked: () => opts.planBacked !== false,
    planMaterialize: (k, sub, form, o) => (ctx.__opts = o, opts.materialize === undefined
      ? { assignments: [{ date: "2026-08-31", text: "pg 5", lid: "L0005" },
                        { date: "2026-09-01", text: "pg 6", lid: "L0006" },
                        { date: "2026-09-02", text: "pg 7", lid: "L0007" }], extras: [], stats: {}, warnings: [] }
      : opts.materialize),
    weekData: { tasks: opts.tasks || [] },
    effectiveDay: t => t.day,
    DAY_DT: opts.DAY_DT === undefined ? { monday: "August 31" } : opts.DAY_DT,
    taskLessonRef: t => { const m = (t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; },
    Date: Date,
  };
  vm.createContext(ctx);
  vm.runInContext(norm[0] + "\n" + BLOCK + "\nvar __r=gvDerivedColumn('lincoln','mr'); var __d=gvDealtDates('lincoln','mr');", ctx);
  return { col: ctx.__r, dealt: ctx.__d, opts: ctx.__opts };
}
const card = (day, ref, extra) => Object.assign({ id: "lincoln_lincoln__mr_" + ref, who: "lincoln", subjectKey: "mr", day: day, title: "📄 MR — " + ref }, extra || {});

console.log("\n── the plan fills the future ──");
{
  const { col } = run({});
  ok("every projected date is present", Object.keys(col.byDate).sort().join() === "2026-08-31,2026-09-01,2026-09-02", Object.keys(col.byDate));
  ok("each is sourced from the plan", Object.values(col.byDate).every(v => v.src === "plan"));
  ok("text and lid carried through", col.byDate["2026-09-01"].text === "pg 6" && col.byDate["2026-09-01"].lid === "L0006");
  ok("no dealt dates, so nothing disagrees", Object.values(col.byDate).every(v => !v.disagrees));
}

console.log("\n── cards win on days already dealt ──");
{
  const { col, dealt } = run({ tasks: [card("monday", "pg 5")] });
  ok("the dealt date is recognised", Object.keys(dealt).join() === "2026-08-31", dealt);
  ok("that date is sourced from the card", col.byDate["2026-08-31"].src === "card");
  ok("later dates are still derived", col.byDate["2026-09-01"].src === "plan" && col.byDate["2026-09-02"].src === "plan");
  ok("agreement is not flagged as a disagreement", !col.byDate["2026-08-31"].disagrees);
}
{
  // The projection is TOLD which days are dealt and which lessons are already on cards, so
  // it never places on those days — a card and a projected lesson cannot collide, and the
  // same lesson can never appear twice down the column.
  const { col, opts: o } = run({ tasks: [card("monday", "pg 5", { lid: "L0005" })] });
  ok("planMaterialize is handed the dealt set", o && o.dealt && o.dealt["2026-08-31"], o);
  ok("the dealt day carries its lid so the lesson can be excluded by id",
    o.dealt["2026-08-31"].lid === "L0005", o.dealt["2026-08-31"]);
  ok("the dealt day is sourced from the card", col.byDate["2026-08-31"].src === "card");
  ok("no disagreement flag survives — the overlap is impossible now",
    !("disagrees" in col.byDate["2026-08-31"]) && !("planSaid" in col.byDate["2026-08-31"]),
    col.byDate["2026-08-31"]);
}
{
  // Belt and braces: a lesson on a card must not also appear as a projected cell.
  const { col } = run({
    tasks: [card("monday", "pg 5", { lid: "L0005" })],
    materialize: { assignments: [{ date: "2026-09-01", text: "pg 6", lid: "L0006" },
                                 { date: "2026-09-02", text: "pg 7", lid: "L0007" }],
                   extras: [], stats: {}, warnings: [] } });
  const texts = Object.values(col.byDate).map(v => v.text);
  ok("no lesson appears twice across cards and plan", new Set(texts).size === texts.length, texts);
  ok("the card day and the plan days are all present", texts.length === 3, texts);
}
{
  // A card on a date the projection never touched still claims that day.
  const { col } = run({ tasks: [card("monday", "pg 5")], DAY_DT: { monday: "September 14" } });
  ok("a card outside the projection still shows", col.byDate["2026-09-14"] && col.byDate["2026-09-14"].src === "card");
  ok("it does not disturb the projected days", col.byDate["2026-08-31"] && col.byDate["2026-08-31"].src === "plan");
}
{
  const { dealt } = run({ tasks: [card("monday", "pg 5", { id: "lincoln_lincoln__mr_L0005_c" })] });
  ok("a carry twin (_c) never speaks for a day", Object.keys(dealt).length === 0, dealt);
}
{
  const { dealt } = run({ tasks: [Object.assign(card("monday", "pg 5"), { who: "ellis" })] });
  ok("another kid's card is ignored", Object.keys(dealt).length === 0, dealt);
}
{
  const { dealt } = run({ tasks: [Object.assign(card("monday", "pg 5"), { subjectKey: "other" })] });
  ok("another subject's card is ignored", Object.keys(dealt).length === 0, dealt);
}
{
  const { dealt } = run({ tasks: [card("saturday", "pg 5")] });
  ok("a card on a day with no date in DAY_DT is skipped, not crashed", Object.keys(dealt).length === 0, dealt);
}

console.log("\n── extras (second sittings) ──");
{
  const { col } = run({ materialize: {
    assignments: [{ date: "2026-08-31", text: "pg 5", lid: "L0005" }],
    extras: [{ date: "2026-08-31", text: "pg 6", lid: "L0006" }, { date: "2026-09-01", text: "pg 7", lid: "L0007" }],
    stats: {}, warnings: [] } });
  ok("an extra on a day that has an assignment rides alongside it", col.byDate["2026-08-31"].extra === "pg 6", col.byDate["2026-08-31"]);
  ok("an extra on a day with no assignment still shows", col.byDate["2026-09-01"] && col.byDate["2026-09-01"].text === "pg 7");
}

// ── _planDropDealt: the lesson filter, on its own ──────────────────────────
// This is the piece that can make lessons VANISH from the grid if it over-drops, so it gets
// tested directly rather than only through the merge.
console.log("\n── _planDropDealt ──");
{
  const dropSrc = src.slice(src.indexOf("// PLANDROP_START"), src.indexOf("// PLANDROP_END"));
  const dctx = { console };
  vm.createContext(dctx);
  vm.runInContext(norm[0] + "\n" + dropSrc, dctx);
  const drop = dctx._planDropDealt;
  const L = (...xs) => xs.map(x => typeof x === "string" ? { lid: null, text: x } : x);
  const ids = t => t.map(x => x.text).join(",");

  ok("no dealt set leaves the list untouched", ids(drop(L("a", "b", "c"), null)) === "a,b,c");
  ok("empty dealt set leaves the list untouched", ids(drop(L("a", "b", "c"), {})) === "a,b,c");
  ok("drops the lesson matched by lid",
    ids(drop([{ lid: "L1", text: "a" }, { lid: "L2", text: "b" }], { "d1": { lid: "L2" } })) === "a");
  ok("drops by text when the card has no lid",
    ids(drop(L("a", "b", "c"), { "d1": { text: "b" } })) === "a,c");
  ok("text match is normalised (dashes, case, spacing)",
    ids(drop(L("pp. 10–12"), { "d1": { text: "PP.  10-12 " } })) === "");
  ok("a repeated lesson loses ONE occurrence per card, not all",
    ids(drop(L("Lesson 68", "Lesson 68", "Lesson 69"), { "d1": { text: "Lesson 68" } })) === "Lesson 68,Lesson 69");
  ok("two cards of the same text drop two occurrences",
    ids(drop(L("x", "x", "x"), { "d1": { text: "x" }, "d2": { text: "x" } })) === "x");
  ok("a card naming something not in the list drops nothing",
    ids(drop(L("a", "b"), { "d1": { text: "zzz" } })) === "a,b");
  ok("a null card entry is ignored", ids(drop(L("a", "b"), { "d1": null })) === "a,b");
  ok("lid match wins even when the text differs",
    ids(drop([{ lid: "L1", text: "renamed" }], { "d1": { lid: "L1", text: "old name" } })) === "");
  ok("dropping everything yields an empty list, not a throw", drop(L("a"), { "d1": { text: "a" } }).length === 0);
}

console.log("\n── guards: return null rather than render something wrong ──");
ok("not plan-backed → null", run({ planBacked: false }).col === null);
ok("paused subject → null", run({ subject: { paused: true } }).col === null);
ok("a mode the projection cannot lay → null", run({ materialize: null }).col === null);
{
  const { col } = run({ materialize: { error: "Nothing left to lay — every lesson is finished.", warnings: [] } });
  ok("a materialise error is reported, not thrown", col && col.err && !Object.keys(col.byDate).length, col);
}
{
  const ctx = { console, currData: { subjects: { lincoln: { mr: {} } } }, planBacked: () => true,
    planMaterialize: () => { throw new Error("boom"); }, weekData: { tasks: [] },
    effectiveDay: t => t.day, DAY_DT: {}, taskLessonRef: () => "", Date };
  vm.createContext(ctx);
  vm.runInContext(norm[0] + "\n" + BLOCK + "\nvar __r=gvDerivedColumn('lincoln','mr');", ctx);
  ok("a throw inside materialise is caught and reported", ctx.__r && /boom/.test(ctx.__r.err), ctx.__r);
}

// ── render wiring ──────────────────────────────────────────────────────────
// These are source assertions, not behaviour: the unit tests above exercise
// gvDerivedColumn in isolation, so they cannot see whether the GRID actually calls it.
// 2026-08-29 a line-based edit deleted the line that FILLS _gvDer while leaving the
// declaration and the read in place — every cell silently fell back to the stored value and
// nothing failed. That must not be able to happen quietly again.
console.log("\n── render wiring ──");
{
  const g = src.indexOf("function renderCurrGrid");
  const grid = g < 0 ? "" : src.slice(g, g + 60000);
  ok("renderCurrGrid exists", g >= 0);
  ok("the derived map is declared", /const _gvDer=\{\};/.test(grid));
  ok("the derived map is FILLED from gvDerivedColumn", /_gvDer\[sk\]\s*=\s*\(typeof gvDerivedColumn/.test(grid), "declared but never populated");
  ok("the cell value reads the derived map", /_derCol\s*\?/.test(grid) && /_gvDer\[sk\]/.test(grid));
  ok("past rows are excluded from derivation", /!past&&_gvDer\[sk\]/.test(grid));
  ok("a done cell keeps its own stored text", /_doneAt\[dn\+"\|"\+sk\]\)\?_gvDer\[sk\]:null/.test(grid));
  ok("slow renders are logged", /grid derive slow/.test(grid));
  // The backlog feature: owed + cap>1 doubles up a day so the finish date stops sliding.
  // Drawing only the first lesson of a pair hid six of Lincoln's AAS lessons (2026-08-29).
  ok("a derived SECOND SITTING is rendered", /_derExtra/.test(grid) && /byDate\[l\.date\]\|\|\{\}\)\.extra/.test(grid), "extras would be invisible");
  ok("the second sitting counts as content, not an empty cell", /gvFilled\(v\)\|\|_derExtra/.test(grid));
  ok("a derived column does not ALSO draw the stored make-up (added is an input now)", /else if\(!_derCol&&addedV!==undefined\)/.test(grid));
  // Stage 1's chips were retired with the derived render; the function stays as the
  // instrument that proves derived agrees with the plan (test_grid_drift).
  ok("the retired drift chip is gone from the render", !/driftChip/.test(src));
  ok("gvPlanDrift itself is kept", /function gvPlanDrift\(/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
