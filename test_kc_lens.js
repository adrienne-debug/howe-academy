/*
 * Node tests for 🧒 KCLENS — her report 2026-11-02: Kids' Corner's "Also today" showed the school-day ⏰, ✎ / ➡ Move,
 * veg · fruit · extra · eating out, the snack picker, "Move the whole day forward" and "＋ Add to this day". "None of those
 * things should be on the kids' part … That is for Mom and Dad only." Cause: the Mom switch (MOMSWITCH) stays on
 * everywhere, and the day sheet / month read "a kid is looking" as !momHere(). Fix: on Kids' Corner it's always the kid's lens.
 * Her add 2026-11-02: "Also look at the Kids' Corner Month … Mom settings and Dad settings … on the bottom of day cards" —
 * the Month's tapped day draws through the same sheet, so it is checked here too (whole month rendered, a day tapped).
 *
 *   run:  node test_kc_lens.js
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

const CODE = [line("function wbMomEyes("), line("function calKidLens("), slice("kitEatGate"), slice("_calSlotRows"), slice("calDaySheetHTML"), slice("calRenderMonthPreview")].join("\n");
const KID = "kid1", ISO = "2026-11-02";
function world(o) {
  const ctx = { console, tab: o.tab, momOn: !!o.mom, adminPinUnlocked: !!o.mom, kcAddIso: null, kcConfirmDel: null,
    KID_COLOR: {}, ROSTER: [KID],
    esc: s => String(s == null ? "" : s), cap: s => String(s), calToday: () => ISO,
    calBreaksOn: () => [], _calCoopsFor: () => [], _calDadChoresFor: () => [],
    calEventsOn: () => [{ id: "e1", title: "Polar Express", emoji: "🚂", who: "family" }],
    KIT_SLOTS: [["b", "Breakfast", "🍳"], ["l", "Lunch", "🥪"], ["s", "Snack", "🍎"]],
    kitPlanSlot: () => ({ txt: "Toast" }), kitSlotsRowHTML: () => '<div>MOMSLOT veg fruit extra</div>', grSyncSnackRowHTML: () => '<div>MOMSNACK</div>',
    kitMoveChain: () => true, kitOutBtn: () => '<button>EATOUT</button>',
    onecalBreakActs: (b, k) => k ? "" : "✎", onecalCoopActs: (c, k) => k ? "" : "✎",
    dtCalRowHTML: (iso, L, who, k) => ({ n: 1, html: k ? "" : '<div>DAYCLOCK ⏰</div>' }),
    stCalRowsHTML: (iso, L, who, k) => ({ n: 0, html: k ? "" : '<div>SETTIME ⏰</div>' }),
    onecalMom: () => !!o.mom, onecalAddBtnHTML: () => '<button>＋ Add to this day</button>', onecalSheetPickHTML: () => "",
    _kioskD: () => false, dadAwardOk: () => false, kcLittle: () => false,
    // the Month's own pieces
    calPreviewMonth: "2026-11", calDaySel: ISO, calendarData: { holidays: {}, vacations: {} }, KID_NAME: {},
    CAL_LAYERS: [["breaks", "Breaks"], ["dad", "Dad"]], calLayerOn: () => true, calLayerToggle: () => {},
    onecalPrintBtnHTML: () => '<button>MOMPRINT</button>', onecalSchoolLineHTML: () => '<div>MOMSCHOOLLINE</div>',
    _calDinnerOf: () => ({ name: 'Soup', st: 'planned', pl: {} }), _calLessonsFor: () => [], _calRoadmapFor: () => [], _calChoresFor: () => [],
    _calHabitsDone: () => null,
  };
  ctx.momHere = () => ctx.momOn;
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return { ctx, call: e => vm.runInContext(e, ctx) };
}
const ALSO = "calDaySheetHTML('" + ISO + "',{breaks:true,coops:true,events:true,meals:true},function(){ return {name:'Soup',st:'planned',pl:{}}; },'" + KID + "',{noWork:true,noClose:true,flat:true,title:'Also today'})";
const MOMBITS = /DAYCLOCK|SETTIME|MOMSLOT|MOMSNACK|Move the whole day forward|Add to this day|kitSlotText|kitMoveForward|EATOUT|kitMarkEaten/;
const MONTH = "calRenderMonthPreview({who:'" + KID + "'})";
const MONTHMOM = /MOMPRINT|MOMSCHOOLLINE|calLayerToggle/;

console.log("── Kids' Corner with the Mom switch ON: the kid's lens ──");
{
  const w = world({ tab: "kids", mom: true });
  ok("calKidLens is true on Kids' Corner even with the switch on", w.call("calKidLens('" + KID + "')") === true);
  const h = w.call(ALSO);
  ok("Also today carries none of Mom's controls", !MOMBITS.test(h), (h.match(MOMBITS) || [])[0]);
  ok("…and keeps the kid's own ＋ Add something", /kcAddOpen\(/.test(h));
  ok("…and still shows the day (the event and dinner)", /Polar Express/.test(h) && /Soup/.test(h));
  const m = w.call(MONTH), day = m.slice(m.indexOf('class="cal-sheet"'));
  ok("Month: no layer chips, print button or school-day line", !MONTHMOM.test(m), (m.match(MONTHMOM) || [])[0]);
  ok("Month: a tapped day's card carries none of Mom's or Dad's controls", day.length > 20 && !MOMBITS.test(day), (day.match(MOMBITS) || [])[0]);
  ok("Month: the tapped day still shows what's happening, with the kid's ＋ Add something", /Polar Express/.test(day) && /kcAddOpen\(/.test(day));
}
console.log("\n── Kids' Corner with the switch OFF: unchanged ──");
{
  const w = world({ tab: "kids", mom: false });
  const h = w.call(ALSO);
  ok("kid's lens, no Mom controls", w.call("calKidLens('" + KID + "')") === true && !MOMBITS.test(h));
}
console.log("\n── Mom's Day / Schedule with the switch ON: her tools stay ──");
{
  const w = world({ tab: "moms-plan", mom: true });
  ok("Mom looking through a kid's lens is not the kid's lens", w.call("calKidLens('" + KID + "')") === false);
  const h = w.call(ALSO);
  ok("her day clock, meal rows, snack, move-the-day and add-to-this-day are all there", /DAYCLOCK/.test(h) && /MOMSLOT/.test(h) && /MOMSNACK/.test(h) && /Move the whole day forward/.test(h) && /Add to this day/.test(h));
  const s = world({ tab: "schedule", mom: true });
  ok("the Schedule tab reads the switch as before", s.call("calKidLens('" + KID + "')") === false);
  ok("the family sheet (no kid) is never the kid's lens", w.call("calKidLens(null)") === false);
  const m = w.call(MONTH), day = m.slice(m.indexOf('class="cal-sheet"'));
  ok("Mom's Month through a kid's lens keeps her chips and her day-card tools", MONTHMOM.test(m) && /DAYCLOCK/.test(day) && /Move the whole day forward/.test(day));
}
console.log("\n── wiring ──");
{
  ok("the day sheet uses calKidLens", /const kidMode=calKidLens\(who\);/.test(slice("calDaySheetHTML")));
  ok("the month uses calKidLens (layer chips, school line)", /const kidMode=calKidLens\(who\);/.test(slice("calRenderMonthPreview")));
  ok("momHere itself is untouched (KIDSLENS still only on the Schedule)", /function momHere\(\)\{ return momModeActive\|\|adminPinUnlocked; \}/.test(src) && /if\(tab==="schedule"&&!momSchedView&&kid!=="mom"\)\{ _momSuspend\(\); \}/.test(src));
  ok("no writes in the helper", !/db\.ref|\.set\(|\.update\(/.test(line("function calKidLens(")));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
