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
  slice("calBreaksOn"), slice("kitEatGate"), slice("kitMarkEaten"), slice("_kitRefresh"), slice("kitMarkSkipped"), slice("calDayClick"),
].join("\n");

function world(o) {
  o = o || {};
  const store = {};
  const ctx = { console, renders: 0, writes: [], removes: [], toasts: [],
    momHere: () => o.kid ? false : true, gwShowToast: m => ctx.toasts.push(m),
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
  // her rule 2026-09-05: "the we ate it part doesn't need to be for the kids" — a kid on a
  // shared screen can neither see the buttons nor call the functions
  const k = world({ kid: true });
  k.call("kitPlan={'2026-08-12':{txt:'Kielbasa'}}");
  k.call("kitMarkEaten('2026-08-12'); kitMarkSkipped('2026-08-12');");
  ok("a kid device cannot mark eaten or skipped (toast, nothing written)", !k.call("kitPlan['2026-08-12'].eaten") && !k.call("kitPlan['2026-08-12'].skipped") && k.ctx.writes.length === 0 && k.ctx.toasts.length === 1);
  ok("the dinner card and the sheet hide the buttons behind the same gate", /\(dpl&&kitEatGate\(\)\)\?'<button onclick="kitMarkEaten/.test(src) && /if\(!kitEatGate\(\)\)\{ \/\* a kid on a shared screen/.test(slice("calDaySheetHTML")));
  ok("meal pencils and Plan-it are gated too", /\(who\|\|!kitEatGate\(\)\)\?'':'<button class="act" style="background:#fff7ed;color:#c2410c" onclick="kitSlotText/.test(src) && /tab==="moms-plan"&&kitEatGate\(\)\)/.test(src));
}
console.log("\n── one lens, two doors ──");
{
  ok("tapping a day opens/closes its sheet", (() => { const w = world(); w.call("calDayClick('2026-08-12')"); const a = w.call("calDaySel"); w.call("calDayClick('2026-08-12')"); return a === "2026-08-12" && w.call("calDaySel") === null; })());
  const mp = slice("_calPageBody"), adm = src.slice(src.indexOf("function renderCalendarView("), src.indexOf("function renderCalendarView(") + 1500);
  ok("Mom HQ ▸ Calendar renders calRenderMonthPreview (family, or one kid's lens)", /calRenderMonthPreview\(who\?\{who:who\}:undefined\)/.test(mp));
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
  ok("layer chips never render when a KID is looking (Mom keeps them through a kid's lens)", /if\(!kidMode\)\{\s*\/\/ layer chips are a Mom\/Dad setting/.test(src));
  ok("Dad's page has the Calendar button (to HIS calendar)", /Dad\\'s Day<\/div>'\+\s*'<button onclick="mpGoto\(\\'dadcal\\'\)"/.test(src));
  ok("the Corner is locked when opened by its kiosk link", /if\(_kioskK\(\)&&t!=="kids"\) return;/.test(src));
}

console.log("\n── a kid's lessons and chores on a date (step 2c) ──");
{
  const CODE2 = [slice("_calLessonsFor"), line("const _CAL_DN="), slice("_calCadDueOn"), slice("_calChoresFor")].join("\n");
  const ctx = { console, calToday: () => "2026-09-09", cadDowIdx: dn => ({ monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 })[dn],
    activeSlots: () => ["morning", "chores"], rtDoneOn: (slot, kid, dn, i) => slot === "chores" && i === 0,
    rtStepsFor: (slot, kid, raw, dn) => slot === "morning" ? [{ label: "Brush teeth", cad: "daily" }, { label: "Vitamins", cad: "daily", to: "2026-09-01" }]
      : [{ label: "Dust", cad: "wk:2", pts: 15 }, { label: "Trash", cad: "wk:1,4" }, { label: "Deep clean", cad: "2w" }, { label: "Never", cad: "none" }, { label: "Help", cad: "asneeded" }],
    currData: { subjects: { lucy: { dimensions_math_1a: { display: "Dimensions Math 1A" }, hwt: { display: "HWT" }, old: { display: "Old", paused: true } } },
      lessons: { lucy: [{ date: "2026-09-08", dimensions_math_1a: "Ch4-1", hwt: "p. 33", week: "Wk 21" }, { date: "2026-09-09", dimensions_math_1a: "Ch4-2", old: "x", hwt: "—" }],
                 ellis: { r1: { date: "2026-09-09", singapore: "3A-12" } } } } };
  vm.createContext(ctx); vm.runInContext(CODE2, ctx);
  const c = e => vm.runInContext(e, ctx);
  ok("lessons on a date from an ARRAY of rows", JSON.stringify(c("_calLessonsFor('lucy','2026-09-08').map(l=>l.name+':'+l.text)")) === '["Dimensions Math 1A:Ch4-1","HWT:p. 33"]');
  ok("blank / dash / paused subjects are skipped", JSON.stringify(c("_calLessonsFor('lucy','2026-09-09').map(l=>l.sk)")) === '["dimensions_math_1a"]');
  ok("rows as an OBJECT work too; unknown subject falls back to its key", JSON.stringify(c("_calLessonsFor('ellis','2026-09-09').map(l=>l.name)")) === '["singapore"]');
  ok("no rows → none", c("_calLessonsFor('julian','2026-09-09').length") === 0);
  // chores: Wed 2026-09-09
  const ch = c("_calChoresFor('lucy','2026-09-09')");
  ok("daily + wk:2 (Wednesday) are due; wk:1,4 / none / asneeded are not", JSON.stringify(ch.map(x => x.label)) === '["Brush teeth","Dust","Deep clean"]' || JSON.stringify(ch.map(x => x.label)) === '["Brush teeth","Dust"]', ch.map(x => x.label));
  ok("a step whose window ended is not due", ch.every(x => x.label !== "Vitamins"));
  ok("today's done state rides along; other days never do", ch.find(x => x.label === "Dust").done === true && c("_calChoresFor('lucy','2026-09-16')").find(x => x.label === "Dust").done === false);
  ok("every-2-weeks is decided by the calendar DATE, not this week's map", c("_calCadDueOn('2w','wednesday','2026-09-09')") === (Math.floor(new Date("2026-09-09T12:00:00").getTime() / 86400000) % 14 === 0));
  ok("Saturday-only chore is due on a Saturday date only", c("_calCadDueOn('sat','saturday','2026-09-12')") === true && c("_calCadDueOn('sat','wednesday','2026-09-09')") === false);
  const sheet = slice("calDaySheetHTML");
  ok("the sheet lists lessons and chores only on a kid's lens, read-only", /if\(who&&!opts\.noWork\)\{\s*const _ls=_calLessonsFor\(who,iso\);/.test(sheet) && !/rtToggle|toggleSlot/.test(sheet));
}

console.log("\n── 📖 School panel in the Corner: today's cards, the real check-off ──");
{
  const sp = slice("kcSchoolHTML"), tc = slice("_kcTodayCards"), sheet = slice("calDaySheetHTML");
  ok("lays the day the way the Schedule tab does (loop lay over Mom's re-times)", /mlQueueLay\(dsRetime\(srcTasks\)\)/.test(tc) && /_kcTodayCards\(k\)/.test(sp));
  ok("only this kid, only today (effectiveDay), no carry twins, no overflow", /t\.who===k&&effectiveDay\(t\)===dn&&!String\(t\.id\|\|""\)\.endsWith\("_c"\)&&!t\._eowOverflow/.test(tc));
  ok("renders the same taskCard — a tap is the check-off", /taskCard\(tk\)/.test(sp));
  ok("locked behind the morning routine like the Schedule tab", /isScheduleUnlocked\(k,dn\)/.test(sp) && /pointer-events:none/.test(sp));
  ok("the Corner always opens on TODAY", /if\(t==="kids"\)\{ try\{ day=_todayDay; \}catch\(e\)\{\} \}/.test(src));
  ok("School lives under Calendar ▸ Today (no separate subnav entry)", !/btn\('school'/.test(slice("kcSubnav")) && /if\(v==="school"\|\|v==="chores"\|\|v==="bank"\)\{ kcView="cal"; kcCalSet\("today"\); return; \}/.test(slice("kcGo")));
  // who is LOOKING gates the actions; whose calendar gates the content
  ok("a kid's own device: kid actions (add / delete own)", /const kidMode=!!who&&!wbMomEyes\(\);/.test(sheet) && /if\(kidMode\)\{/.test(sheet));
  ok("Mom through a kid's lens keeps her actions (meal buttons, edit, approve)", /if\(L\.meals&&kidMode\)\{/.test(sheet) && /\(kidMode\?\(\(e\.addedBy===who\)/.test(sheet));
  ok("Mom's Calendar has Today | Month and Family + each kid", /mpCalSet\('today'\)|tb\('today'/.test(slice("_calPageBody")) && /ROSTER\.map\(function\(k\)\{ return wb\(k,/.test(slice("_calPageBody")));
  ok("the points card never invents a school number — school pays spins", /bonus spin when done/.test(slice("kcPointsHTML")) && !/cards\.length\*|pts\*cards/.test(slice("kcPointsHTML")));
  ok("the Spins row spells out what's left and offers Claim only when the gate is met", /leftBits\.join\(", "\)\+" to go"/.test(slice("kcPointsHTML")) && /const canClaim=spun>0&&gateOk&&!\(claim&&\(claim\.status==="claimed"\|\|claim\.status==="cashed"\)\);/.test(slice("kcPointsHTML")) && /Claim my spins/.test(slice("kcPointsHTML")));
}

console.log("\n── 🎰 spins hold until ALL school work is done (her rule 2026-09-05) ──");
{
  const G = [slice("choresGateDone"), slice("schoolDoneOn"), slice("spinClaimGateDone"), slice("getPointClaim"), slice("_setPointClaim"), slice("claimDayPoints")].join("\n");
  function gw(o) {
    const ctx = { console, renders: 0, toasts: [], WK: "week21", db: null, pointClaims: {},
      renderAll: function () { ctx.renders++; }, gwShowToast: m => ctx.toasts.push(m), nowTs: () => "4:00 PM",
      getSlot: (k, slot) => ({ done: (o.slots || {})[slot] !== false }),
      getKidDayPoints: () => 40, effectiveDay: t => t.day, _dismissed: t => !!t.dismissed, checked: o.checked || {},
      weekData: { tasks: o.tasks || [] } };
    vm.createContext(ctx); vm.runInContext(G, ctx);
    return { ctx, call: e => vm.runInContext(e, ctx) };
  }
  const tasks = [{ id: "a", who: "lucy", day: "monday", title: "Math" }, { id: "b", who: "lucy", day: "monday", title: "Read-Aloud" },
    { id: "l", who: "lucy", day: "monday", title: "Lunch" }, { id: "x", who: "lucy", day: "monday", title: "Skipped", dismissed: true }, { id: "e", who: "ellis", day: "monday", title: "His" }];
  const w1 = gw({ tasks, checked: { a: "x" } });
  ok("one school card left → not done", w1.call("schoolDoneOn('lucy','monday')") === false);
  w1.call("claimDayPoints('lucy','monday')");
  ok("…and the claim is refused with a toast, nothing stored", !w1.call("getPointClaim('lucy','monday')") && w1.ctx.toasts.length === 1);
  const w2 = gw({ tasks, checked: { a: "x", b: "x" } });
  ok("lunch and dismissed cards don't count; both real cards done → school done", w2.call("schoolDoneOn('lucy','monday')") === true);
  w2.call("claimDayPoints('lucy','monday')");
  ok("school + afternoon + chores done → the claim is stored as claimed (still not banked)", (w2.call("getPointClaim('lucy','monday')") || {}).status === "claimed");
  const w3 = gw({ tasks, checked: { a: "x", b: "x" }, slots: { chores: false } });
  w3.call("claimDayPoints('lucy','monday')");
  ok("school done but Chores not → still held", !w3.call("getPointClaim('lucy','monday')"));
  ok("a day with no school cards is not blocked by school", gw({ tasks: [] }).call("schoolDoneOn('lucy','monday')") === true);
  const pc = slice("kcPointsHTML");
  ok("the stars card shows spins on their own line, never as banked", /getKidDayPoints\(k,dn\)/.test(pc) && /banked today/.test(pc) && /holding until school, Afternoon and Chores are done/.test(pc));
}

console.log("\n── 📋 list pop-ups from the Today card; Store + Grabs on the Bank tab ──");
{
  const pp = slice("_popPaint"), pc = slice("kcPointsHTML"), kb = slice("kcBankHTML");
  ok("a list pop-up renders the SAME list as the Chores panel (morning via mrIndividualHTML, others via rtSlotHTML)", /popView==="list"/.test(pp) && /mrIndividualHTML\(popKid\)/.test(pp) && /rtSlotHTML\(popSlot,popKid\)/.test(pp));
  ok("opening a list snaps to today first", /function kcOpenList\(kid,slot\)\{ popSlot=slot; try\{ day=_todayDay; \}/.test(src));
  ok("every list row on the stars card opens its list", /onclick="event\.stopPropagation\(\);kcOpenList\(\\''\+k\+'\\',\\''\+l\.slot\+'\\'\)"/.test(pc));
  ok("the pop-up repaints on every renderAll, so a check-off inside it shows at once", /if\(popView&&popKid&&document\.getElementById\("kid-pop"\)\) _popPaint\(\);/.test(src));
  ok("(the old Bank tab renderer is kept but no longer wired)", !/kcBankHTML\(k\)/.test(slice("renderKidsCorner")));
  ok("general tablet: a 📆 My Day tab renders the Corner page for the picked kid (kid mode)", /\["myday","\\uD83D\\uDCC6 My Day"\]/.test(slice("renderKioskTabs")) && /kkTab==="myday"/.test(slice("renderKioskView")) && /kcTodayHTML\(kid\)/.test(slice("renderKioskView")) && /calRenderMonthPreview\(\{who:kid,little:kcLittle\(kid\)\}\)/.test(slice("renderKioskView")));
  ok("tapping a name always lands on My Day; the tab row is gone; idle still resets to Everyone/Routines", /if\(_kioskR\(\)\) kkTab=\(k==="all"\)\?"routines":"myday";/.test(slice("kkSel")) && /el\.style\.display="none"; el\.innerHTML=""; return;/.test(slice("renderKioskTabs")) && /kkTab="routines"; renderAll\(\); \}/.test(src));
  ok("the Chores and Bank tabs are gone; the Corner renders no subnav; old view names route to Today", !/h\+=kcSubnav\(k\)/.test(slice("renderKidsCorner")) && /v==="chores"\|\|v==="bank"/.test(slice("kcGo")));
  ok("the daily page: balance opens the Star Bank register; Bank · Store · Grabs buttons on that line", /popOpen\(\\''\+k\+'\\',\\'bank\\'\)/.test(slice("kcPointsHTML")) && /pb\('store'/.test(slice("kcPointsHTML")) && /pb\('grabs'/.test(slice("kcPointsHTML")) && /popView==="bank"\) body=_bankCardHTML\(popKid,momView\)/.test(slice("_popPaint")));
}

console.log("\n── 👨 Dad's chores as a layer ──");
{
  const CODE3 = [line("const _CAL_DN="), slice("_calCadDueOn"), slice("_calDadChoresFor")].join("\n");
  const ctx = { console, cadDowIdx: dn => ({ monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 })[dn],
    dcAll: () => ({ a: { label: "Trash out", cad: "wk:2", slot: "night", ts: 2 }, b: { label: "Water plants", cad: "daily", slot: "morning", ts: 1 }, c: { label: "Bills", cad: "sat", ts: 3 } }),
    dcDoneOn: (iso, id) => iso === "2026-09-09" && id === "b", MC_SLOTS: { morning: { ic: "☀️", nm: "Morning" }, night: { ic: "🌙", nm: "Night" } }, mcSlotOf: c => c.slot && ["morning", "night"].indexOf(c.slot) >= 0 ? c.slot : "" };
  vm.createContext(ctx); vm.runInContext(CODE3, ctx);
  const c = e => vm.runInContext(e, ctx);
  ok("Wednesday: daily + wk:2 due, in Dad's order; Saturday-only is not", JSON.stringify(c("_calDadChoresFor('2026-09-09').map(x=>x.label)")) === '["Water plants","Trash out"]');
  ok("done stamps ride along from dadday/{iso}", c("_calDadChoresFor('2026-09-09')").find(x => x.label === "Water plants").done === true && c("_calDadChoresFor('2026-09-10')").find(x => x.label === "Water plants").done === false);
  ok("Saturday: the Saturday chore appears", JSON.stringify(c("_calDadChoresFor('2026-09-12').map(x=>x.label)")) === '["Water plants","Bills"]');
  ok("the layer is a chip on the Mom/Dad lens and never on a kid's", /\["dad","\\u\{1F468\} Dad"\]/.test(line("const CAL_LAYERS=")) && /dad:!who&&calLayerOn\("dad"\)/.test(src) && /meals:true,dad:false\}/.test(src));
  ok("cell line + sheet rows exist", /gmd-dad/.test(slice("calRenderMonthPreview")) && /_calDadChoresFor\(iso\)\.forEach/.test(slice("calDaySheetHTML")));
  // Dad's own calendar page: same body as Mom's, his header, a way back, reachable on ?kiosk=dad
  ok("Dad's Day button opens HIS calendar sub-view, not Mom HQ's", /mpGoto\(\\'dadcal\\'\)/.test(slice("renderDadsDay")) && /if\(mpSubView==='dadcal'\)\{ return renderDadCalendar\(el\); \}/.test(src));
  ok("Mom's and Dad's calendar pages render the SAME body", /h\+=_calPageBody\(\);/.test(slice("renderMPCalendar")) && /h\+=_calPageBody\(\);/.test(slice("renderDadCalendar")));
  ok("his page carries a way back to Dad's Day and no Mom subnav", /\\u2190 Dad\\u2019s Day/.test(slice("renderDadCalendar")) && !/mpSubnav\(/.test(slice("renderDadCalendar")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
