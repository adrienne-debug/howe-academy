/*
 * 🔁 Mom's Day "📖 Mom's school schedule" shows the LIVE day — the same lay as the Schedule tab
 * (dsDoneAtTime(mlQueueLay(getActiveTasks())), open _offDay cards off the timeline), not the day it started with.
 * Her ask 2026-10-07. Harness = test_momsday.js's stubs.
 *   run:  node test_momday_live.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// ── 🏡 MOM'S DAY — the live command center");
const hdr = src.indexOf("//  MOM'S PLAN · Wellness sub-views");
if (a < 0 || hdr < 0) { console.error("MOM'S DAY block anchors not found"); process.exit(1); }
const b = src.lastIndexOf("\n// ═", hdr);
const block = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── global stubs the block reaches for at call time ──────────────────────────
let TODAY = "2026-08-10"; // a Monday
const lsStore = {}, dbWrites = [], dbRemoves = [];
global.DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday"];
global.DAYS_ALL = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
global.gwParseDate = iso => new Date(iso + "T12:00:00");
global._todayStr = () => TODAY;
global.HA_LS = { getItem: k => (k in lsStore ? lsStore[k] : null), setItem: (k,v) => { lsStore[k]=v; }, removeItem: k => { delete lsStore[k]; } };
global.db = { ref: p => ({ set: v => dbWrites.push([p, v]), update: v => dbWrites.push([p, v]), remove: () => dbRemoves.push(p) }) };   // update: the running to-do toggle (10/3)
global.esc = s => String(s);
global.cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
global.SL_KIDS = ["julian","lincoln","ellis","lucy"];
global.SL_KCOL = { julian:"#e07b39", lincoln:"#2b7a78", ellis:"#6b4c93", lucy:"#c2547e" };
global.morningStepsFor = k => [{},{},{}];
global.mStepDoneOn = (k,d,i) => i === 0;
global.morningDueIdx = (k,d) => [0,1,2];   // 🌅 Kids today counts that day's due steps (2026-09-23)
const morningDone = { julian:true, lincoln:false, ellis:true, lucy:false };
global.morningComplete = (k,d) => morningDone[k];
global._boardTaskCounts = (k,d) => ({ total:5, done:2 });
global.rtStepsFor = (slot,kid,x,day) => [{cad:"daily"},{cad:"daily"}];
global.cadDueOn = () => true;
global.rtDoneOn = (slot,kid,day,i) => i === 0;
global.earnedDayTotal = () => 7;
global.paceKidStatus = k => {
  if (k === "julian") throw new Error("no pace data");
  if (k === "lincoln") return { subjects:4, behindN:2, behindSubs:["Math","LA"], aheadN:0, onN:2 };
  if (k === "ellis")   return { subjects:3, behindN:0, behindSubs:[], aheadN:1, onN:2 };
  return { subjects:3, behindN:0, behindSubs:[], aheadN:0, onN:3 };
};
global.checked = { t4: { ts: "9:01 AM Aug 10" } };
global.getActiveTasks = () => [
  { id:"t1", who:"lincoln", mom:"required", title:"Read-aloud: Narnia", groupId:"g1" },
  { id:"t2", who:"ellis",   mom:"required", title:"Read-aloud: Narnia", groupId:"g1" },
  { id:"t3", who:"lucy",    mom:"required", title:"Phonics with Mom" },
  { id:"t4", who:"lucy",    mom:"required", title:"Already done with Mom" },
  { id:"t5", who:"julian",  mom:"required", title:"Lunch break" },
  { id:"t6_c", who:"ellis", mom:"required", title:"Cascade mirror" },
  { id:"t7", who:"ellis",   title:"Solo math" },
  { id:"t8", who:"julian",  mom:"maybe", title:"Poetry maybe" },
];
global.effectiveDay = t => "monday";
let BREAK = null;
global.scheduleBreakToday = () => BREAK;
global.currWeekNum = () => 16;
global.calEventBanner = () => '<div id="evbanner"></div>';
global.calUpcomingHTML = () => '<div id="upcoming"></div>';
global._boardClaimsHTML = () => '<div id="claims"></div>';
let CYCLE = { key:"follicular", day:5 };
global.mwCycleInfo = () => CYCLE;
global.mwTodayIso = () => TODAY;
global.mpSubnav = v => '<div id="subnav" data-active="'+v+'"></div>';
global.mwBanner = sub => '<div id="banner">'+sub+'</div>';
let prepCalls = 0, weighCalls = 0;
global.renderMPPrep = () => { prepCalls++; };
global.renderMPWeigh = () => { weighCalls++; };
global.momHQGo = () => {};
const elStub = { innerHTML: "" };
global.document = { getElementById: () => elStub };
let PROMPT = "Tacos";
global.prompt = () => PROMPT;
const domVals = {};
global.document = { getElementById: id => (id in domVals ? domVals[id] : elStub) };
const alerts = [];
global.alert = m => alerts.push(m);
const toasts = [];
global.mwToast = m => toasts.push(m);
global.cadLabel = c => (!c || c === "daily") ? "Daily" : (c === "2w" ? "Every 2 weeks" : c);

global.claimed = {};
let cardSeen = null;
global.taskCard = t => { cardSeen = { kid: global.kid, day: global.day }; return '<div class="tc">' + t.title + '</div>'; };
global.tapTask = () => {};
let CONFIRM = true;
global.confirm = () => CONFIRM;
let agendaArgs = null, agendaSeen = null;
global.momAgendaHtml = ts => { agendaArgs = ts; agendaSeen = { kid: global.kid, day: global.day }; return '<div id="agenda"></div>'; };
global.kid = "all"; global.day = "friday";
global.mpGoto = () => {};
global.mwSaveWeighin = () => {};
lsStore["wellness_weighins"] = JSON.stringify([{ iso: "2026-08-07", lb: 151.8, note: "", ts: 1 }]);

const showTabCalls = [];
global.tab = "moms-plan";
global.momHere = () => true;   // Mom's Day is Mom's page — meal marking/editing is gated on her (2026-09-05)
global.showTab = t => { showTabCalls.push(t); global.tab = t; };
let renderAllCalls = 0;
global.renderAll = () => { renderAllCalls++; };
global.schedShowBoard = false; global.schedShowAdmin = true; global.schedShowHistory = false;
global.schedShowPace = false; global.schedShowPeek = false;

global.allAgendaHtml = ts => { agendaArgs = ts; return '<div id="agenda"></div>'; };
const M = new Function(block + `; return {mpSetSched,mdTodayName,momdayGet,momdayEdit,mdSlotCounts,renderMomsDay,renderMomsPlan,mpInit,mdOpenBoard,mdBack,mwBPCat,mwBPChip,mwSaveBP,mwBPSlotNow,momdayAddTodo,momdayToggleTodo,momdayDelTodo,mwToggleSym,mwAllSyms,mwAddSymType,mwDelSymType,billDueInfo,billState,billMarkPaid,billAdd,billDel,laundryAdd,laundryAdvance,laundryDel,laundryData,renderKitchen,kitIsoPlus,kitWhenMin,kitWhenLabel,kitPlanFor,kitPrepSteps,kitDuePrep,kitMarkPrep,kitAssign,kitPickDay,kitPlanText,kitOpenRecipe,kitCloseRecipe,kitEditMeal,kitAddPrepRow,kitDelPrepRow,kitSaveMeal,kitCancelEdit,kitDelMeal,kitMeals,kitPlan,kitPrepDone,kitStapleCycle,kitStapleAdd,kitStapleDel,kitStapleToggleManage,kitUsualAdd,kitUsualDel,kitSetOrderDay,kitOrderList,kitOrderText,kitCopyOrder,kitStaples,kitUsuals,kitSettings,kitPantry,panStatus,panAdd,panAddManual,panDel,panImportToggle,panImportApply,panClearGone,panToggleRegular,panIsRegular,panToggleManage,kitSweepDue,kitUsualQty,kitSlug,kitBuyLog,kitRate,kitRateChips,kitParseWeek,kitWkIso,kitWkImportToggle,kitImportWeekApply,kitPlanSlot,kitSlotText,panQtyEdit,kitMarkEaten,grEatApply,momChoresData,mcAll,mcAdd,mcDel,mcToggle,mcDoneOn,mcSetCad,mcCadToggleDay,mcDueToday,mcToggleManage,momChoresCardHTML,kitRotations,kitRotAll,kitRotEnsure,kitRotPlanFor,kitRotCapture,kitRotApply,kitRotSave,kitRotDel,kitRotToggle,kitRotSaveToggle,kitRotMondayOf,kitRotationsCardHTML,KIT_ROT_DEFAULT};`)();


const base = [
  { id:"a1", who:"lincoln", mom:"required", title:"Read-aloud", time:"9:00 AM" },
  { id:"a2", who:"lucy",    mom:"required", title:"Phonics",    time:"10:00 AM" },
  { id:"a3", who:"ellis",   mom:"maybe",    title:"Writing",    time:"1:00 PM" },
  { id:"a4", who:"ellis",   mom:"required", title:"Done early", time:"2:00 PM" },
  { id:"a5", who:"lucy",    title:"Solo",                       time:"11:00 AM" },
];
global.getActiveTasks = () => base.map(t => Object.assign({}, t));
global.checked = { a4: "9:40 AM Aug 10" };
// the Mom loop re-lays: Phonics moved to 11:30, Writing fell off the end of the day
global.mlQueueLay = ts => ts.map(t => t.id === "a2" ? Object.assign({}, t, { time:"11:30 AM" }) : t.id === "a3" ? Object.assign({}, t, { _offDay:true }) : t);
// a done card moves to the time it was really checked off
global.dsDoneAtTime = ts => ts.map(t => t.id === "a4" ? Object.assign({}, t, { time:"9:40 AM" }) : t);
TODAY = "2026-08-10"; BREAK = null;

(() => {
  M.mpSetSched("mom"); agendaArgs = null;
  M.renderMomsDay(elStub);
  const by = Object.fromEntries((agendaArgs || []).map(t => [t.id, t]));
  ok("Mine: schedule section still on the page", elStub.innerHTML.includes("school schedule") && elStub.innerHTML.includes('id="agenda"'));
  ok("Mine: re-laid card shows its LIVE time (10:00 → 11:30)", by.a2 && by.a2.time === "11:30 AM", by.a2);
  ok("Mine: ✓ card sits at the time it was really done", by.a4 && by.a4.time === "9:40 AM", by.a4);
  ok("Mine: an open card that no longer fits today leaves the timeline", !by.a3, Object.keys(by));
  ok("Mine: still only Mom cards", !by.a5 && !!by.a1);
})();
(() => {
  M.mpSetSched("all"); agendaArgs = null;
  M.renderMomsDay(elStub);
  const by = Object.fromEntries((agendaArgs || []).map(t => [t.id, t]));
  ok("All: live times too", by.a2 && by.a2.time === "11:30 AM" && by.a4 && by.a4.time === "9:40 AM", agendaArgs);
  ok("All: kid-only card included, off-day card not", !!by.a5 && !by.a3, Object.keys(by));
})();
(() => {
  global.checked = { a4: "9:40 AM Aug 10", a3: "12:55 PM Aug 10" };   // a fell-off card that IS done stays
  M.mpSetSched("mom"); agendaArgs = null;
  M.renderMomsDay(elStub);
  ok("a ✓ card past school end stays on the timeline", (agendaArgs || []).some(t => t.id === "a3"));
})();
(() => {
  const keep = [global.mlQueueLay, global.dsDoneAtTime];
  delete global.mlQueueLay; delete global.dsDoneAtTime;
  M.mpSetSched("mom"); agendaArgs = null;
  M.renderMomsDay(elStub);
  ok("no loop helpers (older page) → falls back to the planned list, section still drawn", (agendaArgs || []).some(t => t.id === "a2" && t.time === "10:00 AM") && elStub.innerHTML.includes('id="agenda"'));
  [global.mlQueueLay, global.dsDoneAtTime] = keep;
})();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
