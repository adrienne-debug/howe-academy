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
console.log("\n── 🧒 Kids' Corner gates (her rule 2026-09-05: think on what should be available to them) ──");
{
  // the pieces, extracted: pending filter, kid save, Mom approve, kid delete
  const GATES = [slice("calEventsOn"), line("let kcKid="), line("function _kcLoadKid()"), slice("kcSaveEvent"), slice("kcSaveQuick"), slice("calApproveEvent"), slice("kcDeleteEvent"), slice("kcLittle")].join("\n");
  function gw(o) {
    const store = { ha_kc_kid: o.kid || "lucy" };
    const ctx = { console, renders: 0, writes: [], removes: [], ROSTER: ["lincoln", "ellis", "lucy", "julian"], SCHOOL_KIDS: ["lincoln", "ellis", "lucy"],
      HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
      renderAll: function () { ctx.renders++; }, gwShowToast: () => {}, momHere: () => !!o.mom, adminPinUnlocked: false,
      db: { ref: p => ({ set: v => ctx.writes.push([p, v]), remove: () => ctx.removes.push(p) }) },
      calendarData: { events: o.events || {} }, calEvents: function () { return ctx.calendarData.events || {}; },
      document: { getElementById: id => ({ value: (o.fields || {})[id] || "", style: {}, focus() {} }) },
    };
    vm.createContext(ctx); vm.runInContext(GATES, ctx);
    vm.runInContext("kcAddIso='2026-09-18'; kcConfirmDel=null;", ctx);
    return { ctx, call: e => vm.runInContext(e, ctx) };
  }
  const w = gw({ fields: { "kc-ev-title": "Sleepover", "kc-ev-time": "6:00 PM", "kc-ev-emoji": "🎈" } });
  w.call("kcSaveEvent()");
  const ev = Object.values(w.ctx.calendarData.events)[0];
  ok("a kid's addition carries their name AND waits for Mom", ev && ev.who === "lucy" && ev.addedBy === "lucy" && ev.pending === true, ev);
  ok("it is written to the shared events node, nowhere else", w.ctx.writes.length === 1 && /^calendar\/events\/ev_20260918_/.test(w.ctx.writes[0][0]));
  ok("a pending event is INVISIBLE to the day chips, the Board, the peek", w.call("calEventsOn('2026-09-18','lucy').length") === 0);
  ok("…but the lenses see it when they ask", w.call("calEventsOn('2026-09-18','lucy',true).length") === 1);
  ok("another kid never sees it, even pending", w.call("calEventsOn('2026-09-18','ellis',true).length") === 0);
  const id = Object.keys(w.ctx.calendarData.events)[0];
  w.call("calApproveEvent('" + id + "')");
  ok("a kid device cannot approve", w.ctx.calendarData.events[id].pending === true && w.ctx.removes.length === 0);
  w.ctx.momHere = () => true; w.call("calApproveEvent('" + id + "')");
  ok("Mom's OK clears the wait and removes only the pending flag", !w.ctx.calendarData.events[id].pending && w.ctx.removes[0] === "calendar/events/" + id + "/pending");
  ok("…and now the day chips show it", w.call("calEventsOn('2026-09-18','lucy').length") === 1);
  // little mode + quick tiles
  const j = gw({ kid: "julian" });
  ok("Julian (not school-age) is LITTLE; Lincoln is not", j.call("kcLittle('julian')") === true && j.call("kcLittle('lincoln')") === false);
  j.call("kcSaveQuick('🏊','Swimming')");
  const je = Object.values(j.ctx.calendarData.events)[0];
  ok("a quick tile adds a pending event with no typing", je && je.title === "Swimming" && je.emoji === "🏊" && je.addedBy === "julian" && je.pending === true, je);
  // delete: own only, two taps
  const d = gw({ events: { a1: { title: "x", date: "2026-09-18", who: "lucy", addedBy: "lucy", pending: true }, m1: { title: "Mom's", date: "2026-09-18", who: "family" } } });
  d.call("kcDeleteEvent('m1')");
  ok("a kid cannot delete Mom's event", !!d.ctx.calendarData.events.m1 && d.ctx.removes.length === 0);
  d.call("kcDeleteEvent('a1')");
  ok("first tap on their own asks", !!d.ctx.calendarData.events.a1 && d.call("kcConfirmDel") === "a1");
  d.call("kcDeleteEvent('a1')");
  ok("second tap deletes", !d.ctx.calendarData.events.a1 && d.ctx.removes[0] === "calendar/events/a1");
  // what a kid's sheet never carries
  const sheet = slice("calDaySheetHTML");
  ok("meal actions are Mom-only in the sheet (kid branch has no eaten/skip/plan buttons)", (() => { const kid = sheet.slice(sheet.indexOf("if(L.meals&&who)"), sheet.indexOf("} else if(L.meals)")); return !/kitMarkEaten|kitMarkSkipped|kitPickDay|kitSlotText\(/.test(kid.replace(/_calSlotRows\(iso,who\)/, "")); })());
  ok("layer chips never render on a kid's lens", /if\(!who\)\{\s*\/\/ layer chips are a Mom\/Dad setting/.test(src));
  ok("Dad's page has the Calendar button", /Dad\\'s Day<\/div>'\+\s*'<button onclick="mpGoto\(\\'cal\\'\)"/.test(src));
  ok("the Corner is locked when opened by its kiosk link", /if\(_kioskK\(\)&&t!=="kids"\) return;/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
