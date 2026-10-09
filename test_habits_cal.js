/*
 * Node tests for the month calendar's "✅ Habits" layer (#37, 2026-10-09): opt-in chip; a dot per kid
 * who finished ALL chores/routine slots on a PAST day, only when there is check-off data; tap → day sheet.
 *   run:  node test_habits_cal.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) { console.error(name + " not found"); process.exit(1); } return src.slice(i, src.indexOf("\n}", i) + 2); }
function line(s) { const i = src.indexOf(s); if (i < 0) { console.error(s + " not found"); process.exit(1); } return src.slice(i, src.indexOf("\n", i) + 1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const hs = src.indexOf("// HABITS_CAL_START"), he = src.indexOf("// HABITS_CAL_END");
ok("marked block exists", hs > 0 && he > hs);
const CODE = [line("const CAL_LAYERS="), line("const CAL_OPTIN="), line("let calLayers="), line("function _calLayersLoad()"), line("function calLayerOn("),
  line("function calLayerOptIn("), line("function calLayerToggle("), src.slice(hs, he)].join("\n");

function world(o) {
  const store = {};
  const ctx = { console, renders: 0, HA_LS: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); } },
    renderAll() { ctx.renders++; }, DAYS_ALL: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
    RT_ABBR: { afternoon: "a", chores: "c", evening: "e" },
    calToday: () => "2026-10-09", routineDateISO: dn => ({ monday: "2026-10-05", tuesday: "2026-10-06", wednesday: "2026-10-07", thursday: "2026-10-08", friday: "2026-10-09" })[dn] || null,
    activeWk: () => "week6", _prevWkKey: () => "week5", slState: o.sl || {}, prevSlState: o.prev || null,
    _calChoresFor: (k, iso) => o.due ? o.due(k, iso) : [{ slot: "morning", i: 0 }, { slot: "chores", i: 0 }] };
  vm.createContext(ctx); vm.runInContext(CODE, ctx); return ctx;
}
const done = { done: true };
// opt-in layer
let w = world({});
ok("habits layer is in the chip list", /\["habits","\\u2705 Habits"\]/.test(src));
ok("opt-in: off by default, others on", w.calLayerOptIn("habits") === false && w.calLayerOn("meals") === true);
w.calLayerToggle("habits"); ok("toggle turns it on", w.calLayerOptIn("habits") === true && w.renders === 1);
w.calLayerToggle("habits"); ok("toggle turns it off again", w.calLayerOptIn("habits") === false);
w.calLayerToggle("meals"); ok("normal layers still toggle off", w.calLayerOn("meals") === false);
// data
const all = { "week6_monday_lincoln_mstep0": done, "week6_monday_lincoln_cstep0": done };
w = world({ sl: all });
ok("all done on a past day → true", w.vm === undefined && vm.runInContext('_calHabitsDone("lincoln","2026-10-05")', w) === true);
w = world({ sl: { "week6_monday_lincoln_mstep0": done } });
ok("one left undone → false (no dot)", vm.runInContext('_calHabitsDone("lincoln","2026-10-05")', w) === false);
ok("a kid with no check-offs that day → null (no data)", vm.runInContext('_calHabitsDone("ellis","2026-10-05")', w) === null);
ok("today → null", vm.runInContext('_calHabitsDone("lincoln","2026-10-09")', w) === null);
ok("future → null", vm.runInContext('_calHabitsDone("lincoln","2026-10-20")', w) === null);
ok("a week with no loaded data → null", vm.runInContext('_calHabitsDone("lincoln","2026-09-01")', w) === null);
w = world({ sl: all, due: () => [] });
ok("nothing due → null", vm.runInContext('_calHabitsDone("lincoln","2026-10-05")', w) === null);
w = world({ prev: { "week5_monday_lincoln_mstep0": done, "week5_monday_lincoln_cstep0": done } });
ok("last week reads prevSlState", vm.runInContext('_calHabitsDone("lincoln","2026-09-28")', w) === true);
w = world({ prev: null });
ok("last week not loaded → null", vm.runInContext('_calHabitsDone("lincoln","2026-09-28")', w) === null);
// wiring
const cal = src.slice(src.indexOf("function calRenderMonthPreview("), src.indexOf("function _calLessonsFor("));
ok("month cell: dot per kid when layer on", /if\(L\.habits\)\{[\s\S]*_calHabitsDone\(k,iso\)===true/.test(cal) && /x\.h\|\|esc\(x\.t\)/.test(cal));
ok("kid mode never shows the layer", /dad:false,habits:false\}/.test(cal));
ok("cell tap still opens the day", /onclick="calDayClick\(/.test(cal));
ok("day sheet shows a Habits row", /if\(L\.habits&&!kidMode\)/.test(src.slice(src.indexOf("function calDaySheetHTML("))));
ok("read-only: no db writes in the block", !/db\.|\.set\(|\.update\(/.test(src.slice(hs, he)));
ok("no shuffle emoji", !src.includes("\u{1F500}"));
console.log(pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
