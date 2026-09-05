/*
 * Node tests for ONE CALENDAR, step 1 — her design 2026-09-05 ("one master that mirrors
 * needed info in the other spaces"): the month view is the master LENS with per-device
 * layer toggles; the day sheet acts through the kitchen's own functions.
 *
 *   · layers are a per-device view preference — default on, remembered, never data
 *   · breaks on a date come from the holiday/vacation ranges that already exist
 *   · "didn't happen" marks a day without touching the pantry; eaten clears it
 *   · Admin ▸ Calendar and Mom HQ ▸ Calendar render through the SAME month function
 *
 *   run:  node test_calendar_layers.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
function line(startsWith) {
  const i = src.indexOf(startsWith); if (i < 0) { console.error(startsWith + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n", i) + 1);
}
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const CODE = [
  line("let calDaySel="), line("const CAL_LAYERS="), line("let calLayers="),
  line("function _calLayersLoad()"), line("function calLayerOn("), line("function calLayerToggle("),
  slice("calBreaksOn"), slice("kitMarkEaten"), slice("_kitRefresh"), slice("kitMarkSkipped"), slice("calDayClick"),
].join("\n");

function world() {
  const store = {};
  const ctx = { console, renders: 0, writes: [], removes: [],
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    renderAll: function () { ctx.renders++; }, confirm: () => true, mwToast: () => {},
    db: { ref: p => ({ set: v => ctx.writes.push([p, v]), remove: () => ctx.removes.push(p) }) },
    kitPlan: {}, kitMeals: {}, kitPantry: {}, kitStaples: {}, calendarData: {}, document: { getElementById: () => null },
  };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return { ctx, call: e => vm.runInContext(e, ctx), store };
}

console.log("── layers: a per-device view preference ──");
{
  const w = world();
  ok("every layer is on by default", w.call("CAL_LAYERS.every(c=>calLayerOn(c[0]))"));
  w.call("calLayerToggle('meals')");
  ok("toggling turns a layer off and re-renders", w.call("calLayerOn('meals')") === false && w.ctx.renders === 1);
  ok("…and remembers it on this device", /"meals":false/.test(w.store.ha_cal_layers || ""), w.store);
  ok("nothing is written to the database for a view preference", w.ctx.writes.length === 0);
  const w2 = world(); w2.store.ha_cal_layers = '{"coops":false}';
  ok("a remembered preference loads", w2.call("calLayerOn('coops')") === false && w2.call("calLayerOn('events')") === true);
}
console.log("\n── breaks on a date ──");
{
  const w = world();
  w.call("calendarData={holidays:{h1:{name:'Labor Day',start:'2026-09-07'},h2:{name:'Thanksgiving',start:'2026-11-26',end:'2026-11-27'}},vacations:{v1:{name:'Beach',start:'2026-10-05',end:'2026-10-09'}}}");
  ok("a one-day holiday", JSON.stringify(w.call("calBreaksOn('2026-09-07').map(b=>b.name)")) === '["Labor Day"]');
  ok("inside a range", JSON.stringify(w.call("calBreaksOn('2026-10-07').map(b=>b.kind)")) === '["vacation"]');
  ok("range end is inclusive", w.call("calBreaksOn('2026-11-27').length") === 1);
  ok("a plain day has none", w.call("calBreaksOn('2026-10-12').length") === 0);
}
console.log("\n── didn't happen / eaten ──");
{
  const w = world();
  w.call("kitPlan={'2026-08-12':{txt:'Kielbasa'},'2026-08-13':{txt:'Shrimp'}}");
  w.call("kitMarkSkipped('2026-08-13')");
  ok("skipped stamps the day and writes only that path", w.call("kitPlan['2026-08-13'].skipped>0") && w.ctx.writes.length === 1 && w.ctx.writes[0][0] === "kitchen/plan/2026-08-13/skipped");
  ok("the pantry is untouched", w.ctx.writes.every(x => !/pantry|staples/.test(x[0])));
  ok("skipping twice is a no-op", (w.call("kitMarkSkipped('2026-08-13')"), w.ctx.writes.length === 1));
  w.call("kitMarkEaten('2026-08-13')");
  ok("eaten later clears the skip", !w.call("kitPlan['2026-08-13'].skipped") && w.call("kitPlan['2026-08-13'].eaten>0") && w.ctx.removes.indexOf("kitchen/plan/2026-08-13/skipped") >= 0);
  ok("an eaten day cannot be skipped", (w.call("kitMarkSkipped('2026-08-13')"), !w.call("kitPlan['2026-08-13'].skipped")));
  ok("both actions redraw whatever screen is up (renderAll), not Mom's Day specifically", w.ctx.renders >= 2 && !/renderMomsPlan\(el\);\n\}/.test(slice("kitMarkEaten")));
}
console.log("\n── one lens, two doors ──");
{
  ok("tapping a day opens/closes its sheet", (() => { const w = world(); w.call("calDayClick('2026-08-12')"); const a = w.call("calDaySel"); w.call("calDayClick('2026-08-12')"); return a === "2026-08-12" && w.call("calDaySel") === null; })());
  const mp = slice("renderMPCalendar"), adm = src.slice(src.indexOf("function renderCalendarView("), src.indexOf("function renderCalendarView(") + 1500);
  ok("Mom HQ ▸ Calendar renders calRenderMonthPreview", /calRenderMonthPreview\(\)/.test(mp));
  ok("Admin ▸ Calendar renders the same function", /calRenderMonthPreview\(\)/.test(adm));
  ok("the event form is the existing one", /calRenderEventForm\(\)/.test(mp));
  ok("the sheet's eaten button is the kitchen's own function", /onclick="kitMarkEaten\(/.test(slice("calDaySheetHTML")));
  ok("the subnav has the Calendar entry", /btn\('cal','🗓 Calendar'\)/.test(slice("mpSubnav")));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
