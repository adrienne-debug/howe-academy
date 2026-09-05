/*
 * Node tests for 🏡 MOM'S DAY (Phase 1 — the live command center that replaced
 * the static Skylight-era Mom's Plan, 2026-08-09).
 *
 * Extracts the REAL block out of index.html (from the "🏡 MOM'S DAY" banner
 * comment to the wellness sub-views header) and asserts: today-name mapping,
 * Mom-required task grouping (combined groupId collapses to one row; checked /
 * lunch / _c / non-mom excluded), morning-waiting list, per-kid pace chips
 * (incl. throw-safe fallback), school-day vs Sunday vs break-day rendering,
 * and momdayEdit's write path (momday/{iso}/{field}, cancel writes nothing).
 *
 * Phase 2 (Kitchen) coverage: kitchen/* meal library CRUD, week-grid plan
 * writes, prep-timer due logic (timed steps by clock, night-before steps for
 * tomorrow from KIT_NB_HOUR under TOMORROW's iso), 🔴 NOW prep cards, the
 * dinner-card precedence (planned meal > typed plan > momday note), and the
 * 🍽 Meals subview (grid, picker, recipe view, editor with draft-stash).
 *
 * Phase 4 coverage: 🧹 Mom's chores — momChores/{id} CRUD on the shared
 * cadence grammar, per-day done stamps at momday/{iso}/chores/{id}, and the
 * day-view card (due-today list, manage mode, other-days footnote).
 *
 *   run:  node test_momsday.js
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
global.db = { ref: p => ({ set: v => dbWrites.push([p, v]), remove: () => dbRemoves.push(p) }) };
global.esc = s => String(s);
global.cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
global.SL_KIDS = ["julian","lincoln","ellis","lucy"];
global.SL_KCOL = { julian:"#e07b39", lincoln:"#2b7a78", ellis:"#6b4c93", lucy:"#c2547e" };
global.morningStepsFor = k => [{},{},{}];
global.mStepDoneOn = (k,d,i) => i === 0;
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

const M = new Function(block + `; return {mdTodayName,momdayGet,momdayEdit,mdSlotCounts,renderMomsDay,renderMomsPlan,mpInit,mdOpenBoard,mdBack,mwBPCat,mwBPChip,mwSaveBP,mwBPSlotNow,momdayAddTodo,momdayToggleTodo,momdayDelTodo,mwToggleSym,mwAllSyms,mwAddSymType,mwDelSymType,billDueInfo,billState,billMarkPaid,billAdd,billDel,laundryAdd,laundryAdvance,laundryDel,laundryData,renderKitchen,kitIsoPlus,kitWhenMin,kitWhenLabel,kitPlanFor,kitPrepSteps,kitDuePrep,kitMarkPrep,kitAssign,kitPickDay,kitPlanText,kitOpenRecipe,kitCloseRecipe,kitEditMeal,kitAddPrepRow,kitDelPrepRow,kitSaveMeal,kitCancelEdit,kitDelMeal,kitMeals,kitPlan,kitPrepDone,kitStapleCycle,kitStapleAdd,kitStapleDel,kitStapleToggleManage,kitUsualAdd,kitUsualDel,kitSetOrderDay,kitOrderList,kitOrderText,kitCopyOrder,kitStaples,kitUsuals,kitSettings,kitPantry,panStatus,panAdd,panAddManual,panDel,panImportToggle,panImportApply,panClearGone,panToggleRegular,panIsRegular,panToggleManage,kitSweepDue,kitUsualQty,kitSlug,kitBuyLog,kitRate,kitRateChips,kitParseWeek,kitWkIso,kitWkImportToggle,kitImportWeekApply,kitPlanSlot,kitSlotText,panQtyEdit,kitMarkEaten,momChoresData,mcAll,mcAdd,mcDel,mcToggle,mcDoneOn,mcSetCad,mcCadToggleDay,mcDueToday,mcToggleManage,momChoresCardHTML};`)();

// ── mdTodayName: weekday from the DATE ───────────────────────────────────────
(() => {
  TODAY = "2026-08-10"; ok("monday date → 'monday'", M.mdTodayName() === "monday", M.mdTodayName());
  TODAY = "2026-08-09"; ok("sunday date → 'sunday'", M.mdTodayName() === "sunday", M.mdTodayName());
  TODAY = "2026-08-15"; ok("saturday date → 'saturday'", M.mdTodayName() === "saturday", M.mdTodayName());
})();

// ── school-day render ────────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10"; BREAK = null;
  M.renderMomsDay(elStub);
  const h = elStub.innerHTML;
  ok("banner shows Mom's Day + week", h.includes("Mom's Day") && h.includes("Week 16"), null);
  // School blocks that need Mom are deliberately NOT repeated in "Now — needs you";
  // 📖 Mom's school schedule (momAgendaHtml, stubbed here) is the one place they live.
  ok("Now card does not repeat the school blocks", !h.includes("Read-aloud: Narnia") && !h.includes("Phonics with Mom") && !h.includes("tapTask('t1')"), null);
  ok("📖 Mom's school schedule section is on the page", h.includes("school schedule") && h.includes('id="agenda"'), null);
  ok("checked-off mom block excluded", !h.includes("Already done with Mom"), null);
  ok("lunch excluded", !h.includes("Lunch break"), null);
  ok("cascade mirror excluded", !h.includes("Cascade mirror"), null);
  ok("non-mom task excluded", !h.includes("Solo math"), null);
  ok("morning waiting lists Lincoln, Lucy", h.includes("Morning routine not done") && h.includes("Lincoln, Lucy"), null);
  ok("behind chip: 2 behind + subjects", h.includes("2 behind: Math, LA"), null);
  ok("ahead chip", h.includes("On track · 1 ahead"), null);
  ok("plain on-track chip", h.includes(">On track<"), null);
  ok("pace throw → no chip, kid still renders", h.includes("Julian"), null);
  ok("school seg shows 2/5", h.includes("📅 2/5"), null);
  ok("stars seg", h.includes("⭐ 7"), null);
  ok("claims/board/calendar/subnav embedded", ["claims","evbanner","upcoming","subnav"].every(id => h.includes('id="'+id+'"')), null);
  ok("win placeholder when empty", h.includes("Tap to write today's win"), null);
  ok("dinner placeholder when empty", h.includes("Tap to jot tonight's plan"), null);
  ok("no luteal card on follicular", !h.includes("Luteal Week"), null);
})();

// ── sunday: no school segs, no morning card ──────────────────────────────────
(() => {
  TODAY = "2026-08-09"; BREAK = null;
  M.renderMomsDay(elStub);
  const h = elStub.innerHTML;
  ok("sunday: no 📅 seg", !h.includes("📅 2/5"), null);
  ok("sunday: no morning-waiting card", !h.includes("Morning routine not done"), null);
  ok("sunday: mom school blocks still empty-safe", h.includes("Now — needs you"), null);
})();

// ── break day ────────────────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10"; BREAK = { name:"Beach Week", type:"vacation" };
  M.renderMomsDay(elStub);
  const h = elStub.innerHTML;
  ok("break banner shows name + no school", h.includes("Beach Week — no school"), null);
  ok("break: no 📅 seg", !h.includes("📅 2/5"), null);
  BREAK = null;
})();

// ── luteal card ──────────────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10"; CYCLE = { key:"luteal", day:24 };
  M.renderMomsDay(elStub);
  ok("luteal card surfaces", elStub.innerHTML.includes("Luteal Week — go gentle"), null);
  CYCLE = { key:"follicular", day:5 };
})();

// ── momdayEdit write path ────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  PROMPT = "Tacos"; dbWrites.length = 0;
  M.momdayEdit("dinner");
  ok("edit writes momday/{iso}/dinner", JSON.stringify(dbWrites) === JSON.stringify([["momday/2026-08-10/dinner","Tacos"]]), dbWrites);
  ok("momdayGet round-trips", M.momdayGet("dinner") === "Tacos", null);
  ok("LS cache written", !!lsStore["momday_data"] && lsStore["momday_data"].includes("Tacos"), null);
  M.renderMomsDay(elStub);
  ok("dinner shows after edit", elStub.innerHTML.includes("Tacos"), null);
  PROMPT = null; dbWrites.length = 0;
  M.momdayEdit("win");
  ok("prompt cancel writes nothing", dbWrites.length === 0, dbWrites);
  ok("other date's data invisible", (TODAY = "2026-08-11", M.momdayGet("dinner") === ""), null);
  TODAY = "2026-08-10";
})();

// ── dispatcher ───────────────────────────────────────────────────────────────
(() => {
  M.renderMomsPlan(elStub);
  ok("dispatcher default → main view", elStub.innerHTML.includes("Mom's Day"), null);
})();

// ── board jump + return pill functions ───────────────────────────────────────
(() => {
  global.tab = "moms-plan"; showTabCalls.length = 0; renderAllCalls = 0; global.schedShowBoard = false; global.schedShowAdmin = true;
  M.renderMomsDay(elStub);
  // The board-jump button retired with the 🏡 HQ hub (2026-08-05); the function stays callable.
  ok("no board-jump button on the page any more", !elStub.innerHTML.includes("mdOpenBoard()"), null);
  M.mdOpenBoard();
  ok("jump switches to schedule tab", showTabCalls.length === 1 && showTabCalls[0] === "schedule", showTabCalls);
  ok("jump raises board flag, clears admin", global.schedShowBoard === true && global.schedShowAdmin === false, null);
  ok("jump re-renders", renderAllCalls >= 1, renderAllCalls);
  showTabCalls.length = 0;
  M.mdBack();
  ok("back pill returns to moms-plan", showTabCalls.length === 1 && showTabCalls[0] === "moms-plan", showTabCalls);
  M.mdOpenBoard(); // already on schedule? tab is now moms-plan again from mdBack stub
  global.tab = "schedule"; showTabCalls.length = 0;
  M.mdOpenBoard();
  ok("jump from schedule tab skips showTab", showTabCalls.length === 0, showTabCalls);
  global.tab = "moms-plan";
})();

// ── agenda mirror + quick weigh-in ───────────────────────────────────────────
(() => {
  TODAY = "2026-08-10"; BREAK = null; global.kid = "all"; global.day = "friday";
  agendaArgs = null; agendaSeen = null;
  M.renderMomsDay(elStub);
  const h = elStub.innerHTML;
  ok("agenda card embedded on school day", h.includes('id="agenda"'), null);
  ok("agenda gets required + maybe tasks", !!agendaArgs && agendaArgs.some(t => t.id === "t8") && agendaArgs.some(t => t.id === "t1"), agendaArgs && agendaArgs.map(t => t.id));
  ok("agenda keeps checked task (full mirror shows done)", !!agendaArgs && agendaArgs.some(t => t.id === "t4"), null);
  ok("agenda excludes lunch/_c/non-mom", !!agendaArgs && !agendaArgs.some(t => ["t5","t6_c","t7"].includes(t.id)), null);
  ok("kid/day pinned to mom/today during build", !!agendaSeen && agendaSeen.kid === "mom" && agendaSeen.day === "monday", agendaSeen);
  ok("kid/day restored after build", global.kid === "all" && global.day === "friday", null);
  ok("weigh card: today's date + lb input", h.includes('id="wi-date" value="2026-08-10"') && h.includes('id="wi-lb"'), null);
  ok("weigh card: save wired to mwSaveWeighin", h.includes("mwSaveWeighin()"), null);
  ok("weigh card: Save label when today unlogged", h.includes(">Save</button>"), null);
  ok("weigh card: last-logged line", h.includes("151.8"), null);
  TODAY = "2026-08-09";
  M.renderMomsDay(elStub);
  ok("sunday: no agenda card", !elStub.innerHTML.includes('id="agenda"'), null);
  ok("sunday: weigh card still present", elStub.innerHTML.includes('id="wi-lb"'), null);
  TODAY = "2026-08-10";
})();

// ── 🫀 BP tracker ────────────────────────────────────────────────────────────
(() => {
  const cat = M.mwBPCat;
  ok("BP cat: 118/76 normal", cat(118,76).label === "Normal", cat(118,76));
  ok("BP cat: 124/78 elevated", cat(124,78).label === "Elevated", null);
  ok("BP cat: 132/78 stage 1", cat(132,78).label === "Stage 1 high", null);
  ok("BP cat: 118/84 stage 1 via bottom number", cat(118,84).label === "Stage 1 high", null);
  ok("BP cat: 142/88 stage 2", cat(142,88).label === "Stage 2 high", null);
  ok("BP cat: 185/95 crisis", /Crisis/.test(cat(185,95).label), null);
  ok("BP slot is am or pm", ["am","pm"].includes(M.mwBPSlotNow()), null);

  TODAY = "2026-08-10";
  domVals["bp-sys"] = { value: "128" }; domVals["bp-dia"] = { value: "82" }; domVals["bp-pulse"] = { value: "" };
  dbWrites.length = 0; alerts.length = 0; toasts.length = 0;
  M.mwSaveBP();
  const w = dbWrites[0];
  ok("BP save writes wellness/bp/{iso}/{slot}", dbWrites.length === 1 && /^wellness\/bp\/2026-08-10\/(am|pm)$/.test(w[0]), dbWrites);
  ok("BP record has sys/dia, no empty pulse", w && w[1].sys === 128 && w[1].dia === 82 && !("pulse" in w[1]), w && w[1]);
  ok("BP save toasts, no alert", toasts.length === 1 && alerts.length === 0, { toasts, alerts });
  ok("BP LS cache written", !!lsStore["wellness_bp"] && lsStore["wellness_bp"].includes("128"), null);
  ok("BP chip shows saved reading", /128\/82/.test(M.mwBPChip(M.mwBPSlotNow(), "2026-08-10")), null);
  ok("BP chip dash for empty slot", /—/.test(M.mwBPChip("am", "2020-01-01")), null);

  domVals["bp-sys"] = { value: "190" }; domVals["bp-dia"] = { value: "125" };
  dbWrites.length = 0; alerts.length = 0; toasts.length = 0;
  M.mwSaveBP();
  ok("BP crisis: saves AND alerts, no toast", dbWrites.length === 1 && alerts.length === 1 && /crisis range/.test(alerts[0]) && toasts.length === 0, alerts);

  domVals["bp-sys"] = { value: "12" }; domVals["bp-dia"] = { value: "80" };
  dbWrites.length = 0; alerts.length = 0;
  M.mwSaveBP();
  ok("BP sanity guard rejects junk, no write", dbWrites.length === 0 && alerts.length === 1 && /looks off/.test(alerts[0]), alerts);

  domVals["bp-sys"] = { value: "" }; domVals["bp-dia"] = { value: "80" };
  dbWrites.length = 0; alerts.length = 0;
  M.mwSaveBP();
  ok("BP missing number rejected", dbWrites.length === 0 && alerts.length === 1 && /both numbers/.test(alerts[0]), alerts);

  delete domVals["bp-sys"]; delete domVals["bp-dia"]; delete domVals["bp-pulse"];
  M.renderMomsDay(elStub);
  ok("quick card: BP inputs + save button", elStub.innerHTML.includes('id="bp-sys"') && elStub.innerHTML.includes("mwSaveBP()"), null);
  ok("quick card: AM/PM chips present", /AM /.test(elStub.innerHTML) && /PM /.test(elStub.innerHTML), null);
})();

// ── 📝 Mom's list ────────────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  domVals["md-todo-new"] = { value: "Order chicken feed" };
  dbWrites.length = 0;
  M.momdayAddTodo();
  const w = dbWrites[0];
  ok("todo add writes momday/{iso}/todos/{id}", dbWrites.length === 1 && /^momday\/2026-08-10\/todos\/t[a-z0-9]+$/.test(w[0]), dbWrites);
  ok("todo record: text + not done", w && w[1].text === "Order chicken feed" && w[1].done === false, w && w[1]);
  const tid = w[0].split("/").pop();
  M.renderMomsDay(elStub);
  ok("todo renders with count 0/1", elStub.innerHTML.includes("Order chicken feed") && elStub.innerHTML.includes(">0/1<"), null);
  dbWrites.length = 0;
  M.momdayToggleTodo(tid);
  ok("todo toggle writes done=true", dbWrites.length === 1 && dbWrites[0][0].endsWith("/todos/" + tid + "/done") && dbWrites[0][1] === true, dbWrites);
  M.renderMomsDay(elStub);
  ok("todo count now 1/1", elStub.innerHTML.includes(">1/1<"), null);
  dbRemoves.length = 0;
  M.momdayDelTodo(tid);
  ok("todo delete removes the node", dbRemoves.length === 1 && dbRemoves[0].endsWith("/todos/" + tid), dbRemoves);
  M.renderMomsDay(elStub);
  ok("deleted todo gone from render", !elStub.innerHTML.includes("Order chicken feed"), null);
  domVals["md-todo-new"] = { value: "   " };
  dbWrites.length = 0;
  M.momdayAddTodo();
  ok("blank todo rejected", dbWrites.length === 0, dbWrites);
  delete domVals["md-todo-new"];
})();

// ── 🌡 Symptoms ──────────────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  dbWrites.length = 0; dbRemoves.length = 0;
  M.mwToggleSym("headache");
  ok("symptom on writes wellness/symptoms/{iso}/{sym}", dbWrites.length === 1 && dbWrites[0][0] === "wellness/symptoms/2026-08-10/headache", dbWrites);
  M.renderMomsDay(elStub);
  ok("quick chips row renders symptom bank", elStub.innerHTML.includes("🤕 Headache") && elStub.innerHTML.includes("🍫 Cravings"), null);
  ok("active symptom chip highlighted", elStub.innerHTML.includes("#fbe3ec"), null);
  M.mwToggleSym("headache");
  ok("symptom off removes the node", dbRemoves.length === 1 && dbRemoves[0] === "wellness/symptoms/2026-08-10/headache", dbRemoves);
  ok("symptom LS cache written", !!lsStore["wellness_symptoms"], null);
})();

// ── ⏳ Waiting for your check (claimed kid work in NOW) ──────────────────────
(() => {
  TODAY = "2026-08-10"; global.kid = "all"; global.day = "friday"; cardSeen = null;
  global.claimed = { t7: "9:12 AM", t4: "8:50 AM" }; // t4 is already checked → excluded
  M.renderMomsDay(elStub);
  const h = elStub.innerHTML;
  ok("waiting section appears", h.includes("Waiting for your check"), null);
  ok("claimed unchecked task rendered via taskCard", h.includes('<div class="tc">Solo math</div>'), null);
  ok("claimed-but-checked task excluded", !h.includes('<div class="tc">Already done with Mom</div>'), null);
  ok("taskCard built with kid/day pinned", !!cardSeen && cardSeen.kid === "mom" && cardSeen.day === "monday", cardSeen);
  ok("globals restored after waiting build", global.kid === "all" && global.day === "friday", null);
  global.claimed = {};
  M.renderMomsDay(elStub);
  ok("no waiting section when no claims", !elStub.innerHTML.includes("Waiting for your check"), null);
})();

// ── 🌡 custom symptom types ──────────────────────────────────────────────────
(() => {
  ok("built-in bank includes body pain", M.mwAllSyms().some(s => s[0] === "bodypain" && /Body pain/.test(s[1])), null);
  PROMPT = "Hip ache"; dbWrites.length = 0; alerts.length = 0;
  M.mwAddSymType();
  ok("custom add writes wellness/symptomBank/{slug}", dbWrites.length === 1 && dbWrites[0][0] === "wellness/symptomBank/hipache" && dbWrites[0][1] === "Hip ache", dbWrites);
  ok("custom type joins the bank", M.mwAllSyms().some(s => s[0] === "hipache" && s[1] === "Hip ache"), null);
  M.renderMomsDay(elStub);
  ok("quick row shows custom chip + add chip", elStub.innerHTML.includes("Hip ache") && elStub.innerHTML.includes("＋ Add"), null);
  dbWrites.length = 0; alerts.length = 0;
  M.mwAddSymType();
  ok("duplicate custom rejected", dbWrites.length === 0 && alerts.length === 1 && /Already tracking/.test(alerts[0]), alerts);
  CONFIRM = true; dbRemoves.length = 0;
  M.mwDelSymType("hipache");
  ok("custom delete removes bank node", dbRemoves.length === 1 && dbRemoves[0] === "wellness/symptomBank/hipache", dbRemoves);
  ok("deleted type leaves the bank", !M.mwAllSyms().some(s => s[0] === "hipache"), null);
  dbRemoves.length = 0;
  M.mwDelSymType("headache");
  ok("built-in type cannot be deleted", dbRemoves.length === 0, null);
  PROMPT = "Tacos";
})();

// ── 💳 Bills ─────────────────────────────────────────────────────────────────
(() => {
  const dueInfo = M.billDueInfo, state = M.billState;
  // monthly cycle math
  let b = { name:"Electric", dueDay:12, freq:"monthly" };
  ok("monthly: due this month", dueInfo(b,"2026-08-10").due === "2026-08-12", dueInfo(b,"2026-08-10"));
  ok("monthly: 2 days out = soon", state(b,"2026-08-10").state === "soon", state(b,"2026-08-10"));
  ok("monthly: due today", state(b,"2026-08-12").state === "due", null);
  ok("monthly: overdue after", state(b,"2026-08-15").state === "overdue" && state(b,"2026-08-15").days === -3, state(b,"2026-08-15"));
  b.paidThrough = "2026-08";
  ok("paid → rolls to next month", dueInfo(b,"2026-08-15").due === "2026-09-12" && state(b,"2026-08-15").state === "later", null);
  b = { name:"X", dueDay:31, freq:"monthly", paidThrough:"2026-01" };
  ok("short-month clamp (Feb 31 → 28)", dueInfo(b,"2026-02-01").due === "2026-02-28", dueInfo(b,"2026-02-01"));
  b = { name:"Y", dueDay:5, freq:"monthly", paidThrough:"2026-12" };
  ok("December paid → rolls to January", dueInfo(b,"2026-12-20").due === "2027-01-05", null);
  b = { name:"Insurance", dueDay:15, freq:"yearly", dueMonth:3 };
  ok("yearly: due in March", dueInfo(b,"2026-08-10").due === "2026-03-15" && state(b,"2026-08-10").state === "overdue", null);
  b.paidThrough = "2026";
  ok("yearly paid → next year", dueInfo(b,"2026-08-10").due === "2027-03-15", null);

  // add / paid / delete flows
  TODAY = "2026-08-10";
  domVals["bill-name"] = { value: "Electric" }; domVals["bill-amt"] = { value: "$180" };
  domVals["bill-day"] = { value: "12" }; domVals["bill-freq"] = { value: "monthly" };
  dbWrites.length = 0;
  M.billAdd();
  const bw = dbWrites[0];
  ok("bill add writes bills/{id}", dbWrites.length === 1 && /^bills\/b[a-z0-9]+$/.test(bw[0]), dbWrites);
  ok("bill record complete", bw && bw[1].name === "Electric" && bw[1].amt === "$180" && bw[1].dueDay === 12 && bw[1].freq === "monthly", bw && bw[1]);
  const bid = bw[0].split("/").pop();
  M.renderMomsDay(elStub);
  ok("bills card renders bill + due label", elStub.innerHTML.includes("Electric") && elStub.innerHTML.includes("due Aug 12"), null);
  // NOTE: the add-form placeholder "Bill (Electric…)" contributes 1 match everywhere
  ok("2 days out: in card but NOT in NOW", (elStub.innerHTML.match(/Electric/g)||[]).length === 2 && elStub.innerHTML.includes("(in 2d)"), (elStub.innerHTML.match(/Electric/g)||[]).length);
  TODAY = "2026-08-13";
  M.renderMomsDay(elStub);
  ok("overdue: appears in NOW too", (elStub.innerHTML.match(/Electric/g)||[]).length === 3 && elStub.innerHTML.includes("1d overdue"), (elStub.innerHTML.match(/Electric/g)||[]).length);
  dbWrites.length = 0;
  M.billMarkPaid(bid);
  ok("✓ Paid writes paidThrough cycle key", dbWrites.length === 1 && dbWrites[0][0] === "bills/" + bid + "/paidThrough" && dbWrites[0][1] === "2026-08", dbWrites);
  M.renderMomsDay(elStub);
  ok("paid bill leaves NOW, shows next due", (elStub.innerHTML.match(/Electric/g)||[]).length === 2 && elStub.innerHTML.includes("due Sep 12"), (elStub.innerHTML.match(/Electric/g)||[]).length);
  dbWrites.length = 0; alerts.length = 0;
  domVals["bill-name"] = { value: "" };
  M.billAdd();
  ok("bill needs name + day", dbWrites.length === 0 && alerts.length === 1, alerts);
  CONFIRM = true; dbRemoves.length = 0;
  M.billDel(bid);
  ok("bill delete removes node", dbRemoves.length === 1 && dbRemoves[0] === "bills/" + bid, dbRemoves);
  ["bill-name","bill-amt","bill-day","bill-freq"].forEach(k => delete domVals[k]);
  TODAY = "2026-08-10";
})();

// ── 🧺 Laundry ───────────────────────────────────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  domVals["laundry-label"] = { value: "Towels" };
  dbWrites.length = 0;
  M.laundryAdd();
  const lw = dbWrites[0];
  ok("laundry add writes laundry/{id} in washer", dbWrites.length === 1 && /^laundry\/l[a-z0-9]+$/.test(lw[0]) && lw[1].stage === "washer" && lw[1].label === "Towels", dbWrites);
  const lid = lw[0].split("/").pop();
  M.renderMomsDay(elStub);
  ok("laundry card shows load + stage trail", elStub.innerHTML.includes("Towels") && elStub.innerHTML.includes("🫧 washer") && elStub.innerHTML.includes("→ Dryer"), null);
  ok("fresh washer load: no NOW nudge", !elStub.innerHTML.includes("before it sours"), null);
  M.laundryData[lid].ts = Date.now() - 2 * 3600 * 1000; // sat 2h
  M.renderMomsDay(elStub);
  ok("stale washer load nudges in NOW", elStub.innerHTML.includes("before it sours"), null);
  dbWrites.length = 0;
  M.laundryAdvance(lid);
  ok("advance → dryer writes stage", dbWrites.length === 1 && dbWrites[0][1].stage === "dryer", dbWrites);
  M.renderMomsDay(elStub);
  ok("dryer load: nudge gone, → Fold offered", !elStub.innerHTML.includes("before it sours") && elStub.innerHTML.includes("→ Fold"), null);
  M.laundryAdvance(lid);
  ok("advance → fold offers put away", M.laundryData[lid].stage === "fold", null);
  dbRemoves.length = 0; toasts.length = 0;
  M.laundryAdvance(lid);
  ok("put away removes the load + toasts", dbRemoves.length === 1 && dbRemoves[0] === "laundry/" + lid && !(lid in M.laundryData) && toasts.length === 1, { dbRemoves, toasts });
  domVals["laundry-label"] = { value: "  " };
  dbWrites.length = 0;
  M.laundryAdd();
  ok("blank load rejected", dbWrites.length === 0, dbWrites);
  delete domVals["laundry-label"];
})();

// ── 🍽 KITCHEN Phase 2 · pure helpers ────────────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  ok("kitIsoPlus +1", M.kitIsoPlus("2026-08-10", 1) === "2026-08-11", M.kitIsoPlus("2026-08-10", 1));
  ok("kitIsoPlus month rollover", M.kitIsoPlus("2026-08-31", 1) === "2026-09-01", M.kitIsoPlus("2026-08-31", 1));
  ok("kitIsoPlus +6", M.kitIsoPlus("2026-08-10", 6) === "2026-08-16", null);
  ok("kitWhenMin 17:30 → 1050", M.kitWhenMin("17:30") === 1050, M.kitWhenMin("17:30"));
  ok("kitWhenMin 7:05 → 425", M.kitWhenMin("7:05") === 425, null);
  ok("kitWhenMin nb → null", M.kitWhenMin("nb") === null, null);
  ok("kitWhenMin junk → null", M.kitWhenMin("junk") === null, null);
  ok("kitWhenMin 25:00 → null", M.kitWhenMin("25:00") === null, null);
  ok("kitWhenLabel nb", M.kitWhenLabel("nb") === "night before", M.kitWhenLabel("nb"));
  ok("kitWhenLabel 17:30 → 5:30 PM", M.kitWhenLabel("17:30") === "5:30 PM", M.kitWhenLabel("17:30"));
  ok("kitWhenLabel 00:15 → 12:15 AM", M.kitWhenLabel("00:15") === "12:15 AM", null);
  ok("kitWhenLabel 12:00 → 12:00 PM", M.kitWhenLabel("12:00") === "12:00 PM", null);
})();

// ── 🍽 KITCHEN · plan resolution + prep-due logic ────────────────────────────
(() => {
  TODAY = "2026-08-10";
  M.kitMeals.mtaco = { name: "Taco night", emoji: "🌮", ing: "beef\nshells", steps: "brown\nfill",
    prep: [{ when: "11:30", label: "Start the Instant Pot" }, { when: "nb", label: "Thaw the beef" }], ts: 1 };
  ok("kitPlanFor empty → null", M.kitPlanFor("2026-08-10") === null, null);
  M.kitPlan["2026-08-10"] = { mid: "mtaco" };
  const pf = M.kitPlanFor("2026-08-10");
  ok("kitPlanFor resolves library meal", pf && pf.mid === "mtaco" && pf.meal && pf.meal.name === "Taco night", pf);
  M.kitPlan["2026-08-12"] = { txt: "Leftovers" };
  ok("kitPlanFor typed plan", (M.kitPlanFor("2026-08-12") || {}).txt === "Leftovers", null);
  M.kitPlan["2026-08-13"] = { mid: "ghost" };
  const pg = M.kitPlanFor("2026-08-13");
  ok("kitPlanFor missing meal keeps mid, meal null", pg && pg.mid === "ghost" && pg.meal === null, pg);
  const steps = M.kitPrepSteps("2026-08-10");
  ok("kitPrepSteps: both steps w/ mealName", steps.length === 2 && steps[0].mealName === "Taco night" && steps[0].when === "11:30" && steps[1].when === "nb", steps);
  ok("kitPrepSteps: typed plan → none", M.kitPrepSteps("2026-08-12").length === 0, null);
  ok("kitPrepSteps: ghost plan → none", M.kitPrepSteps("2026-08-13").length === 0, null);
  ok("11:30 step NOT due at 10:00", M.kitDuePrep(600).length === 0, M.kitDuePrep(600));
  const due = M.kitDuePrep(700);
  ok("11:30 step due at 11:40", due.length === 1 && due[0].label === "Start the Instant Pot" && due[0].iso === "2026-08-10", due);
  M.kitPlan["2026-08-11"] = { mid: "mtaco" }; // tomorrow too — its nb step is tonight's job
  ok("tomorrow's nb hidden before 4 PM", !M.kitDuePrep(940).some(s => s.when === "nb"), M.kitDuePrep(940));
  const nb = M.kitDuePrep(961).find(s => s.when === "nb");
  ok("tomorrow's nb due after 4 PM under TOMORROW's iso", nb && nb.iso === "2026-08-11" && nb.label === "Thaw the beef", nb);
  dbWrites.length = 0;
  M.kitMarkPrep("2026-08-10", "mtaco_0");
  ok("kitMarkPrep writes kitchen/prepDone/{iso}/{key}", dbWrites.length === 1 && dbWrites[0][0] === "kitchen/prepDone/2026-08-10/mtaco_0", dbWrites);
  ok("done step no longer due", M.kitDuePrep(700).length === 0, null);
  ok("done flag shows in kitPrepSteps", M.kitPrepSteps("2026-08-10")[0].done === true, null);
  dbRemoves.length = 0;
  M.kitMarkPrep("2026-08-10", "mtaco_0");
  ok("kitMarkPrep toggles back off with remove", dbRemoves.length === 1 && dbRemoves[0] === "kitchen/prepDone/2026-08-10/mtaco_0" && M.kitDuePrep(700).length === 1, dbRemoves);
  M.kitMarkPrep("2026-08-11", "mtaco_1");
  ok("nb done (under tomorrow's iso) drops from due", !M.kitDuePrep(961).some(s => s.when === "nb"), null);
  M.kitMarkPrep("2026-08-11", "mtaco_1"); // back off for later groups
})();

// ── 🍽 KITCHEN · week-grid plan writes ───────────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  dbWrites.length = 0;
  M.kitAssign("2026-08-14", { mid: "mtaco" });
  ok("kitAssign mid writes kitchen/plan/{iso}", dbWrites.length === 1 && dbWrites[0][0] === "kitchen/plan/2026-08-14" && dbWrites[0][1].mid === "mtaco", dbWrites);
  ok("HA_LS plan mirror updated", JSON.parse(lsStore["ha_kit_plan"])["2026-08-14"].mid === "mtaco", null);
  dbRemoves.length = 0;
  M.kitAssign("2026-08-14", null);
  ok("kitAssign null clears day + removes node", dbRemoves[0] === "kitchen/plan/2026-08-14" && !M.kitPlan["2026-08-14"], dbRemoves);
  PROMPT = "Breakfast for dinner";
  M.kitPlanText("2026-08-14");
  ok("kitPlanText saves typed plan", (M.kitPlan["2026-08-14"] || {}).txt === "Breakfast for dinner", M.kitPlan["2026-08-14"]);
  PROMPT = null;
  M.kitPlanText("2026-08-14");
  ok("prompt cancel keeps typed plan", (M.kitPlan["2026-08-14"] || {}).txt === "Breakfast for dinner", null);
  PROMPT = "   ";
  M.kitPlanText("2026-08-14");
  ok("blank prompt clears the day", !M.kitPlan["2026-08-14"], M.kitPlan["2026-08-14"]);
})();

// ── 🍽 KITCHEN · Mom's Day render: NOW prep cards + dinner-card precedence ───
(() => {
  TODAY = "2026-08-10"; BREAK = null;
  // 00:00 timed step is due at any real clock time → deterministic in render
  M.kitMeals.mchili = { name: "Chili", emoji: "🌶", ing: "beans", steps: "simmer",
    prep: [{ when: "00:00", label: "Lay out the beans" }, { when: "nb", label: "Soak the beans" }], ts: 2 };
  M.kitPlan["2026-08-10"] = { mid: "mchili" };
  M.kitPlan["2026-08-11"] = { mid: "mchili" };
  M.renderMomsDay(elStub);
  let h = elStub.innerHTML;
  ok("due prep step is a NOW card w/ ✓ Done", h.includes("Lay out the beans") && h.includes("kitMarkPrep('2026-08-10','mchili_0')"), null);
  ok("dinner card shows planned meal + recipe link", h.includes("Chili") && h.includes("📖 recipe") && h.includes("kitOpenRecipe('mchili')"), null);
  ok("dinner card lists prep chips", h.includes("12:00 AM"), null);
  ok("nb hint for tomorrow shows all evening", h.includes("Tonight for tomorrow") && h.includes("Soak the beans"), null);
  ok("Plan week button present", h.includes("mpGoto('meals')"), null);
  delete M.kitPlan["2026-08-10"]; delete M.kitPlan["2026-08-11"];
  M.kitPlan["2026-08-10"] = { txt: "Pizza out" };
  M.renderMomsDay(elStub);
  ok("typed plan renders in dinner card", elStub.innerHTML.includes("Pizza out") && elStub.innerHTML.includes("kitPlanText('2026-08-10')"), null);
  delete M.kitPlan["2026-08-10"];
  M.renderMomsDay(elStub);
  ok("no plan → momday note fallback intact", elStub.innerHTML.includes("momdayEdit('dinner')"), null);
})();

// ── 🍽 KITCHEN · Meals subview: grid, picker, recipe view ────────────────────
(() => {
  TODAY = "2026-08-10";
  M.renderKitchen(elStub);
  let h = elStub.innerHTML;
  ok("grid: 7 day rows, Tonight → +6", h.includes("Tonight · 8/10") && h.includes("Tomorrow · 8/11") && h.includes("kitPickDay('2026-08-16')"), null);
  ok("grid: unplanned day invites a tap", h.includes("tap to plan"), null);
  ok("grid: ghost plan flags removed meal", h.includes("meal removed"), null);
  ok("library alphabetical + edit buttons", h.indexOf("Chili") < h.indexOf("Taco night") && h.includes("kitEditMeal('mtaco')"), null);
  ok("subnav shows meals active", h.includes('data-active="meals"'), null);
  M.kitPickDay("2026-08-12");
  M.renderKitchen(elStub); h = elStub.innerHTML;
  ok("picker open on tapped day", h.includes("kitAssign('2026-08-12',{mid:'mchili'})") && h.includes("Type it"), null);
  ok("clear chip offered when day planned", h.includes("kitAssign('2026-08-12',null)"), null);
  M.kitPickDay("2026-08-12");
  M.renderKitchen(elStub);
  ok("picker toggles closed", !elStub.innerHTML.includes("Type it"), null);
  M.kitOpenRecipe("mtaco");
  M.renderKitchen(elStub); h = elStub.innerHTML;
  ok("recipe: name, ingredients, instructions", h.includes("Taco night") && h.includes("beef") && h.includes("brown"), null);
  ok("recipe: prep timers listed", h.includes("Start the Instant Pot") && h.includes("night before"), null);
  ok("recipe: back + edit buttons", h.includes("kitCloseRecipe()") && h.includes("kitEditMeal('mtaco')"), null);
  M.kitCloseRecipe();
})();

// ── 🍽 KITCHEN · editor: draft stash, prep builder, save/delete ──────────────
(() => {
  TODAY = "2026-08-10";
  M.kitEditMeal(); // new meal
  M.renderKitchen(elStub);
  let h = elStub.innerHTML;
  ok("editor renders for a new meal", h.includes("New meal") && h.includes('id="kit-name"') && h.includes("＋ Step"), null);
  alerts.length = 0;
  domVals["kit-prep-mode"] = { value: "t" }; domVals["kit-prep-time"] = { value: "" }; domVals["kit-prep-label"] = { value: "  " };
  M.kitAddPrepRow();
  ok("blank prep label rejected", alerts.length === 1, alerts);
  domVals["kit-prep-label"] = { value: "Start the rice" };
  alerts.length = 0;
  M.kitAddPrepRow();
  ok("timed step without a time rejected", alerts.length === 1, alerts);
  domVals["kit-prep-time"] = { value: "17:30" };
  domVals["kit-name"] = { value: "Stir fry" }; domVals["kit-emoji"] = { value: "🥦" };
  domVals["kit-ing"] = { value: "rice\nbroccoli" }; domVals["kit-steps"] = { value: "cook rice\nfry veg" };
  M.kitAddPrepRow();
  M.renderKitchen(elStub); h = elStub.innerHTML;
  ok("prep row added + typed fields survive re-render", h.includes("5:30 PM") && h.includes("Start the rice") && h.includes('value="Stir fry"'), null);
  domVals["kit-prep-mode"] = { value: "nb" }; domVals["kit-prep-label"] = { value: "Thaw the chicken" };
  M.kitAddPrepRow();
  dbWrites.length = 0;
  M.kitSaveMeal();
  const w = dbWrites.find(x => x[0].startsWith("kitchen/meals/"));
  ok("save writes kitchen/meals/{id} with both prep kinds", w && w[1].name === "Stir fry" && w[1].emoji === "🥦" && w[1].prep.length === 2 && w[1].prep[0].when === "17:30" && w[1].prep[1].when === "nb", w);
  const sid = w ? w[0].split("/").pop() : "";
  M.renderKitchen(elStub);
  ok("after save: recipe view of the new meal", elStub.innerHTML.includes("Stir fry") && elStub.innerHTML.includes("Thaw the chicken"), null);
  M.kitEditMeal();
  ["kit-name", "kit-emoji", "kit-ing", "kit-steps"].forEach(k => domVals[k] = { value: "" });
  alerts.length = 0; dbWrites.length = 0;
  M.kitSaveMeal();
  ok("no-name save rejected, nothing written", alerts.length === 1 && dbWrites.length === 0, alerts);
  M.kitCancelEdit();
  M.kitEditMeal(sid);
  domVals["kit-name"] = { value: "Stir fry 2" }; domVals["kit-emoji"] = { value: "🥦" };
  domVals["kit-ing"] = { value: "rice" }; domVals["kit-steps"] = { value: "cook" };
  dbWrites.length = 0;
  M.kitSaveMeal();
  ok("edit saves back to the same id", dbWrites.some(x => x[0] === "kitchen/meals/" + sid && x[1].name === "Stir fry 2"), dbWrites);
  M.kitAssign("2026-08-15", { mid: sid });
  CONFIRM = false;
  M.kitDelMeal(sid);
  ok("delete declined keeps the meal", !!M.kitMeals[sid], null);
  CONFIRM = true; dbRemoves.length = 0;
  M.kitDelMeal(sid);
  ok("delete removes meal + its planned day", !M.kitMeals[sid] && !M.kitPlan["2026-08-15"] && dbRemoves.includes("kitchen/meals/" + sid) && dbRemoves.includes("kitchen/plan/2026-08-15"), dbRemoves);
  ["kit-name", "kit-emoji", "kit-ing", "kit-steps", "kit-prep-mode", "kit-prep-time", "kit-prep-label"].forEach(k => delete domVals[k]);
})();

// ── 🛒 KITCHEN Phase 3 · staples, usuals, order day ──────────────────────────
(() => {
  TODAY = "2026-08-10"; // Monday
  domVals["kit-staple-new"] = { value: "  Milk  " };
  dbWrites.length = 0;
  M.kitStapleAdd();
  const sw = dbWrites[0];
  ok("staple add writes kitchen/staples/{id} as ✅ have", dbWrites.length === 1 && /^kitchen\/staples\/s[a-z0-9]+$/.test(sw[0]) && sw[1].state === "have" && sw[1].name === "Milk", dbWrites);
  const milkId = sw[0].split("/").pop();
  dbWrites.length = 0;
  M.kitStapleCycle(milkId);
  ok("cycle have → low", M.kitStaples[milkId].state === "low" && dbWrites[0][1].state === "low", dbWrites);
  M.kitStapleCycle(milkId);
  ok("cycle low → out", M.kitStaples[milkId].state === "out", null);
  M.kitStapleCycle(milkId);
  ok("cycle out → back to have", M.kitStaples[milkId].state === "have", null);
  domVals["kit-staple-new"] = { value: "   " };
  dbWrites.length = 0;
  M.kitStapleAdd();
  ok("blank staple rejected", dbWrites.length === 0, null);
  delete domVals["kit-staple-new"];
  M.kitStaples.s_eggs = { name: "Eggs", state: "out", ts: 1 };
  M.kitStaples.s_butter = { name: "Butter", state: "low", ts: 1 };
  M.kitStaples.s_apples = { name: "Apples", state: "out", ts: 1 };
  M.kitStapleCycle(milkId); // milk → low
  domVals["kit-usual-new"] = { value: "Oatmeal" }; domVals["kit-usual-cat"] = { value: "breakfast" };
  dbWrites.length = 0;
  M.kitUsualAdd();
  ok("usual add writes kitchen/usuals/{id} w/ cat", dbWrites.length === 1 && dbWrites[0][1].cat === "breakfast" && dbWrites[0][1].name === "Oatmeal", dbWrites);
  const oatId = dbWrites[0][0].split("/").pop();
  // ids are "u"+Date.now().toString(36) — spin to the next ms between adds so
  // same-millisecond test calls don't collide (real taps are seconds apart)
  const nextMs = () => { const t = Date.now(); while (Date.now() === t); };
  nextMs();
  domVals["kit-usual-new"] = { value: "GF pretzels" }; domVals["kit-usual-cat"] = { value: "snack" };
  M.kitUsualAdd();
  nextMs();
  domVals["kit-usual-new"] = { value: "Weird cat" }; domVals["kit-usual-cat"] = { value: "nonsense" };
  M.kitUsualAdd();
  ok("unknown category folds to other", Object.keys(M.kitUsuals).some(id => M.kitUsuals[id].name === "Weird cat" && M.kitUsuals[id].cat === "other"), M.kitUsuals);
  ["kit-usual-new", "kit-usual-cat"].forEach(k => delete domVals[k]);
  const o = M.kitOrderList();
  ok("order list: out first, alphabetical", o.need.length === 4 && o.need[0].name === "Apples" && o.need[1].name === "Eggs" && o.need[0].state === "out", o.need);
  ok("order list: low follows", o.need[2].name === "Butter" && o.need[3].name === "Milk" && o.need[3].state === "low", o.need);
  ok("order list: usuals grouped by cat", o.usuals.breakfast[0].name === "Oatmeal" && o.usuals.snack[0].name === "GF pretzels" && o.usuals.other[0].name === "Weird cat", o.usuals);
  ok("order list: count totals", o.count === 7, o.count);
  const txt = M.kitOrderText();
  ok("order text: OUT/LOW + category lines", txt.includes("OUT: Apples, Eggs") && txt.includes("LOW: Butter, Milk") && txt.includes("Breakfast: Oatmeal") && txt.includes("Snacks: GF pretzels"), txt);
  let promptText = null; const realPrompt = global.prompt;
  global.prompt = (msg, val) => { promptText = val; return null; };
  M.kitCopyOrder(); // node has no clipboard → prompt fallback
  global.prompt = realPrompt;
  ok("copy falls back to prompt with the list", promptText === txt, promptText);
  dbWrites.length = 0;
  M.kitSetOrderDay("monday");
  ok("order day writes kitchen/settings/orderDay", dbWrites.some(w => w[0] === "kitchen/settings/orderDay" && w[1] === "monday"), dbWrites);
  M.renderMomsDay(elStub);
  ok("Monday + orderDay monday → Build-your-order card", elStub.innerHTML.includes("Build your order") && elStub.innerHTML.includes("kitCopyOrder()"), null);
  M.kitSetOrderDay("tuesday");
  M.renderMomsDay(elStub);
  ok("other weekday → no order card on Mom's Day", !elStub.innerHTML.includes("Build your order"), null);
  dbRemoves.length = 0;
  M.kitSetOrderDay("");
  ok("clearing order day removes the node", dbRemoves.includes("kitchen/settings/orderDay") && !("orderDay" in M.kitSettings), dbRemoves);
  CONFIRM = true; dbRemoves.length = 0;
  M.kitUsualDel(oatId);
  ok("usual delete removes node", dbRemoves.includes("kitchen/usuals/" + oatId) && !(oatId in M.kitUsuals), null);
})();

// ── 🛒 KITCHEN Phase 3 · Meals subview render ────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  M.renderKitchen(elStub);
  let h = elStub.innerHTML;
  ok("staples card: chips + order-day select", h.includes("Staples") && h.includes("Milk") && h.includes("kitSetOrderDay(this.value)"), null);
  ok("state chips carry their emoji", h.includes("❌ Apples") && h.includes("🟡 Butter"), null);
  ok("usuals card renders groups", h.includes("Standing usuals") && h.includes("🍎 Snacks") && h.includes("GF pretzels"), null);
  ok("order preview card always in subview", h.includes("Build your order") && h.includes("📋 Copy list"), null);
  ok("manage mode hidden by default", !h.includes("kitStapleDel"), null);
  M.kitStapleToggleManage();
  M.renderKitchen(elStub); h = elStub.innerHTML;
  ok("✎ manage shows ✕ per chip", h.includes("kitStapleDel"), null);
  CONFIRM = false;
  M.kitStapleDel("s_eggs");
  ok("staple delete declined keeps it", !!M.kitStaples.s_eggs, null);
  CONFIRM = true; dbRemoves.length = 0;
  M.kitStapleDel("s_eggs");
  ok("staple delete removes node", dbRemoves.includes("kitchen/staples/s_eggs") && !M.kitStaples.s_eggs, null);
  M.kitStapleToggleManage();
})();

// ── 🥫 KITCHEN · pantry snapshot: fade math, import, ⭐ regulars ──────────────
(() => {
  TODAY = "2026-08-10";
  // zone fade math — produce life 6: fresh < 3.6d, aging 3.6–6d, gone > 6d
  ok("produce day-0 fresh", M.panStatus({ zone: "produce", addedIso: "2026-08-10" }, "2026-08-10") === "fresh", null);
  ok("produce day-3 fresh", M.panStatus({ zone: "produce", addedIso: "2026-08-07" }, "2026-08-10") === "fresh", null);
  ok("produce day-4 aging", M.panStatus({ zone: "produce", addedIso: "2026-08-06" }, "2026-08-10") === "aging", null);
  ok("produce day-7 gone", M.panStatus({ zone: "produce", addedIso: "2026-08-03" }, "2026-08-10") === "gone", null);
  ok("freezer day-30 fresh", M.panStatus({ zone: "freezer", addedIso: "2026-07-11" }, "2026-08-10") === "fresh", null);
  ok("freezer day-60 aging", M.panStatus({ zone: "freezer", addedIso: "2026-06-11" }, "2026-08-10") === "aging", null);
  ok("unknown zone falls back to pantry life", M.panStatus({ zone: "junk", addedIso: "2026-05-10" }, "2026-08-10") === "fresh", null);
  // add + case-insensitive merge-refresh
  dbWrites.length = 0;
  const idSpin = M.panAdd("Spinach", "produce");
  ok("panAdd stamps today + zone + db path", M.kitPantry[idSpin].addedIso === "2026-08-10" && M.kitPantry[idSpin].zone === "produce" && dbWrites[0][0] === "kitchen/pantry/" + idSpin, dbWrites);
  ok("bad zone folds to pantry", M.kitPantry[M.panAdd("Rice", "cupboard")].zone === "pantry", null);
  M.kitPantry[idSpin].addedIso = "2026-08-05";
  const idAgain = M.panAdd("spinach", "produce");
  ok("re-add merges by name + refreshes date", idAgain === idSpin && M.kitPantry[idSpin].addedIso === "2026-08-10", idAgain);
  // paste-import
  domVals["pan-import"] = { value: "chicken thighs | freezer\n  \nGF pasta|pantry\npeppers | produce\n| produce\nplain yogurt" };
  toasts.length = 0;
  M.panImportApply();
  const names = Object.keys(M.kitPantry).map(k => M.kitPantry[k].name);
  ok("import parses lines + zones", names.includes("chicken thighs") && names.includes("GF pasta") && names.includes("peppers"), names);
  ok("import defaults missing zone to pantry", Object.keys(M.kitPantry).some(k => M.kitPantry[k].name === "plain yogurt" && M.kitPantry[k].zone === "pantry"), null);
  ok("import skips blank/nameless lines + toasts the count", toasts.length === 1 && /4 items/.test(toasts[0]), toasts);
  delete domVals["pan-import"];
  // ⭐ regular toggle ↔ staples check-list
  ok("not a regular yet", M.panIsRegular("Spinach") === false, null);
  dbWrites.length = 0;
  M.panToggleRegular(idSpin);
  ok("⭐ creates a ✅-have staple", M.panIsRegular("spinach") === true && dbWrites.some(w => /^kitchen\/staples\//.test(w[0]) && w[1].name === "Spinach" && w[1].state === "have"), dbWrites);
  dbRemoves.length = 0;
  M.panToggleRegular(idSpin);
  ok("re-tap ☆ removes the staple", M.panIsRegular("Spinach") === false && dbRemoves.some(p => /^kitchen\/staples\//.test(p)), dbRemoves);
  // gone hides, clear removes only gone
  M.kitPantry.p_old = { name: "Ancient kale", zone: "produce", addedIso: "2026-07-01", ts: 1 };
  M.renderKitchen(elStub);
  let h = elStub.innerHTML;
  ok("gone item hidden from zone chips", !h.includes("Ancient kale"), null);
  ok("clear-gone button counts it", h.includes("Clear 1 probably-gone"), null);
  dbRemoves.length = 0;
  M.panClearGone();
  ok("clear removes only the gone item", !M.kitPantry.p_old && !!M.kitPantry[idSpin] && dbRemoves.includes("kitchen/pantry/p_old"), dbRemoves);
})();

// ── 🥫 KITCHEN · pantry render + use-soon line ───────────────────────────────
(() => {
  TODAY = "2026-08-10";
  // make peppers aging (produce day-4) and a fridge item aging too
  const pep = Object.keys(M.kitPantry).find(k => M.kitPantry[k].name === "peppers");
  M.kitPantry[pep].addedIso = "2026-08-06";
  M.kitPantry.p_soup = { name: "Leftover soup", zone: "fridge", addedIso: "2026-07-30", ts: 1 };
  M.renderKitchen(elStub);
  let h = elStub.innerHTML;
  ok("zone sections render w/ chips", h.includes("🥬 Produce") && h.includes("Spinach") && h.includes("❄️ Freezer") && h.includes("chicken thighs"), null);
  ok("aging chip carries 🕐", h.includes("🕐 peppers"), null);
  ok("every chip offers the ⭐ regular toggle", h.includes("panToggleRegular(") && h.includes("☆"), null);
  ok("manage mode hidden by default", !h.includes("panDel("), null);
  M.panToggleManage();
  M.renderKitchen(elStub);
  ok("✎ manage shows ✕ per chip", elStub.innerHTML.includes("panDel("), null);
  M.panToggleManage();
  M.panImportToggle();
  M.renderKitchen(elStub);
  ok("📥 opens the paste-import panel", elStub.innerHTML.includes('id="pan-import"') && elStub.innerHTML.includes("panImportApply()"), null);
  M.panImportToggle();
  // manual quick-add
  domVals["pan-new"] = { value: "Almond flour" }; domVals["pan-zone"] = { value: "pantry" };
  M.panAddManual();
  ok("manual add lands in its zone", Object.keys(M.kitPantry).some(k => M.kitPantry[k].name === "Almond flour" && M.kitPantry[k].zone === "pantry"), null);
  ["pan-new", "pan-zone"].forEach(k => delete domVals[k]);
  // Mom's Day: use-soon = AGING PRODUCE ONLY
  M.renderMomsDay(elStub);
  h = elStub.innerHTML;
  ok("use-soon lists aging produce", h.includes("Use soon:") && h.includes("peppers"), null);
  ok("fresh produce + aging fridge stay out of it", !h.includes("Spinach") && !h.includes("Leftover soup"), null);
  delete M.kitPantry.p_soup;
})();

// ── 🥫 KITCHEN · 📸 cabinet-sweep reminder ───────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  ok("never swept + pantry exists → due", M.kitSweepDue("2026-08-10") === true, null);
  M.kitSettings.lastSweep = "2026-08-01";
  ok("9 days since sweep → not due", M.kitSweepDue("2026-08-10") === false, null);
  M.kitSettings.lastSweep = "2026-07-13";
  ok("exactly 28 days → due", M.kitSweepDue("2026-08-10") === true, null);
  const stash = Object.assign({}, M.kitPantry);
  Object.keys(M.kitPantry).forEach(k => delete M.kitPantry[k]);
  delete M.kitSettings.lastSweep;
  ok("empty pantry + never swept → not due (no nag before adoption)", M.kitSweepDue("2026-08-10") === false, null);
  Object.assign(M.kitPantry, stash);
  M.kitSettings.lastSweep = "2026-07-01";
  M.renderKitchen(elStub);
  ok("order card carries the sweep nudge when due", elStub.innerHTML.includes("Cabinet sweep is due"), null);
  M.panImportToggle();
  M.renderKitchen(elStub);
  ok("import panel offers the sweep checkbox", elStub.innerHTML.includes('id="pan-sweep"'), null);
  domVals["pan-import"] = { value: "black beans | pantry" };
  domVals["pan-sweep"] = { checked: true };
  dbWrites.length = 0;
  M.panImportApply();
  ok("sweep-checked import stamps lastSweep today", M.kitSettings.lastSweep === "2026-08-10" && dbWrites.some(w => w[0] === "kitchen/settings/lastSweep" && w[1] === "2026-08-10"), dbWrites);
  M.renderKitchen(elStub);
  ok("nudge clears after the sweep", !elStub.innerHTML.includes("Cabinet sweep is due"), null);
  M.kitSettings.lastSweep = "2026-07-01";
  domVals["pan-import"] = { value: "salsa | pantry" };
  domVals["pan-sweep"] = { checked: false };
  dbWrites.length = 0;
  M.panImportApply();
  ok("plain import leaves lastSweep alone", M.kitSettings.lastSweep === "2026-07-01" && !dbWrites.some(w => w[0] === "kitchen/settings/lastSweep"), null);
  ["pan-import", "pan-sweep"].forEach(k => delete domVals[k]);
})();

// ── 🛒 KITCHEN · usual quantities + purchase log ─────────────────────────────
(() => {
  TODAY = "2026-08-10";
  const nextMs = () => { const t = Date.now(); while (Date.now() === t); };
  domVals["kit-usual-new"] = { value: "Almond milk" }; domVals["kit-usual-cat"] = { value: "breakfast" }; domVals["kit-usual-qty"] = { value: "3" };
  dbWrites.length = 0;
  M.kitUsualAdd();
  const aw = dbWrites.find(w => /^kitchen\/usuals\//.test(w[0]));
  ok("usual stores qty 3", aw && aw[1].qty === 3, aw);
  const milkUid = aw[0].split("/").pop();
  nextMs();
  domVals["kit-usual-new"] = { value: "Bananas" }; domVals["kit-usual-cat"] = { value: "snack" }; domVals["kit-usual-qty"] = { value: "1" };
  dbWrites.length = 0;
  M.kitUsualAdd();
  const bw = dbWrites.find(w => /^kitchen\/usuals\//.test(w[0]));
  ok("qty 1 stays implicit (no qty key)", bw && !("qty" in bw[1]), bw);
  ["kit-usual-new", "kit-usual-cat", "kit-usual-qty"].forEach(k => delete domVals[k]);
  ok("copy text carries ×3", M.kitOrderText().includes("Almond milk ×3"), M.kitOrderText());
  M.renderKitchen(elStub);
  ok("usual row + order card show ×3", elStub.innerHTML.includes("×3") && elStub.innerHTML.includes("kitUsualQty('" + milkUid + "')"), null);
  PROMPT = "5";
  M.kitUsualQty(milkUid);
  ok("qty edit to 5 writes", M.kitUsuals[milkUid].qty === 5, null);
  PROMPT = "";
  dbRemoves.length = 0;
  M.kitUsualQty(milkUid);
  ok("blank qty clears to implicit ×1", !("qty" in M.kitUsuals[milkUid]) && dbRemoves.some(p => p.endsWith("/qty")), null);
  domVals["pan-import"] = { value: "almond milk | fridge | 3\napples | produce | 2\nsalsa | pantry\ncorn chips | pantry | abc" };
  domVals["pan-sweep"] = { checked: false };
  dbWrites.length = 0;
  M.panImportApply();
  ok("receipt logs qty per slug", M.kitBuyLog["2026-08-10"].almondmilk === 3 && M.kitBuyLog["2026-08-10"].apples === 2, M.kitBuyLog["2026-08-10"]);
  // salsa is 2, not 1: the sweep group's plain import already logged it once
  // today — same-day receipts sum, which is exactly the intended behavior
  ok("missing/bad qty defaults to 1", M.kitBuyLog["2026-08-10"].salsa === 2 && M.kitBuyLog["2026-08-10"].cornchips === 1, M.kitBuyLog["2026-08-10"]);
  ok("buyLog db path written", dbWrites.some(w => w[0] === "kitchen/buyLog/2026-08-10/almondmilk" && w[1] === 3), dbWrites);
  domVals["pan-import"] = { value: "almond milk | fridge | 2" };
  M.panImportApply();
  ok("same-day re-import sums", M.kitBuyLog["2026-08-10"].almondmilk === 5, null);
  domVals["pan-import"] = { value: "frozen peas | freezer | 4" };
  domVals["pan-sweep"] = { checked: true };
  M.panImportApply();
  ok("sweep import never logs purchases", !M.kitBuyLog["2026-08-10"].frozenpeas, M.kitBuyLog["2026-08-10"]);
  ["pan-import", "pan-sweep"].forEach(k => delete domVals[k]);
})();

// ── 😋 KITCHEN · kid votes on meals + snacks ─────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  dbWrites.length = 0;
  M.kitRate("meal", "mtaco", "lincoln");
  ok("first tap = 😍 love", M.kitMeals.mtaco.ratings.lincoln === "love" && dbWrites.some(w => w[0] === "kitchen/meals/mtaco/ratings/lincoln" && w[1] === "love"), dbWrites);
  M.kitRate("meal", "mtaco", "lincoln");
  ok("second tap = 🙂 like", M.kitMeals.mtaco.ratings.lincoln === "like", null);
  M.kitRate("meal", "mtaco", "lincoln");
  ok("third tap = 🚫 won't eat", M.kitMeals.mtaco.ratings.lincoln === "no", null);
  dbRemoves.length = 0;
  M.kitRate("meal", "mtaco", "lincoln");
  ok("fourth tap clears the vote", !M.kitMeals.mtaco.ratings.lincoln && dbRemoves.some(p => p === "kitchen/meals/mtaco/ratings/lincoln"), null);
  M.kitRate("meal", "mtaco", "ellis");
  const chips = M.kitRateChips("meal", "mtaco");
  ok("chips render all four kids", chips.includes("Ju") && chips.includes("Li") && chips.includes("El") && chips.includes("Lu"), null);
  ok("rated kid shows 😍, unrated shows –", chips.includes("😍") && chips.includes("–"), null);
  const snackId = Object.keys(M.kitUsuals).find(k => M.kitUsuals[k].name === "Bananas");
  M.kitRate("usual", snackId, "lucy");
  ok("usual rating lands on the usual", M.kitUsuals[snackId].ratings.lucy === "love", null);
  M.kitOpenRecipe("mtaco");
  M.renderKitchen(elStub);
  ok("recipe view has Kid votes section", elStub.innerHTML.includes("Kid votes") && elStub.innerHTML.includes("kitRate('meal','mtaco'"), null);
  M.kitCloseRecipe();
  M.renderKitchen(elStub);
  let h = elStub.innerHTML;
  ok("library rows carry tappable votes", h.includes("kitRate('meal','mchili'"), null);
  ok("snack usual row carries votes", h.includes("kitRate('usual','" + snackId + "'"), null);
  const otherId = Object.keys(M.kitUsuals).find(k => M.kitUsuals[k].cat === "other");
  ok("household 'other' rows skip votes", !h.includes("kitRate('usual','" + otherId + "'"), null);
  M.kitPlan["2026-08-10"] = { mid: "mtaco" };
  M.renderMomsDay(elStub);
  ok("dinner card shows tonight's votes", elStub.innerHTML.includes("kitRate('meal','mtaco'"), null);
  delete M.kitPlan["2026-08-10"];
})();

// ── 📥 KITCHEN · week paste-import ───────────────────────────────────────────
(() => {
  TODAY = "2026-08-10"; // Monday
  const SAMPLE = [
    "ignored preamble line",
    "MEAL: Braised Shank | 🍖",
    "Ingredients:",
    "2 pkgs beef shank",
    "2 cans tomatoes",
    "Instructions:",
    "Brown the shanks.",
    "Braise 3 hours.",
    "prep: nb | thaw the shanks",
    "prep: 14:30 | into the oven",
    "prep: 99:99 | broken time is skipped",
    "prep: 12:00 |",
    "meal: No Recipe Night",
    "PLAN:",
    "tue: Braised Shank",
    "wed: Kielbasa + dirty rice",
    "  ",
    "nonsense line without colon",
    "fri: no recipe night",
  ].join("\n");
  const p = M.kitParseWeek(SAMPLE);
  ok("parser: two meals, preamble ignored", p.meals.length === 2 && p.meals[0].name === "Braised Shank" && p.meals[0].emoji === "🍖" && p.meals[1].name === "No Recipe Night", p.meals);
  ok("parser: ingredients + instructions captured", p.meals[0].ing.length === 2 && p.meals[0].steps[1] === "Braise 3 hours.", p.meals[0]);
  ok("parser: both prep kinds kept, broken/blank skipped", p.meals[0].prep.length === 2 && p.meals[0].prep[0].when === "nb" && p.meals[0].prep[1].when === "14:30", p.meals[0].prep);
  ok("parser: plan day lines, junk skipped", p.plan.length === 3 && p.plan[0].day === "tue" && p.plan[2].value === "no recipe night", p.plan);
  ok("kitWkIso: tue → tomorrow", M.kitWkIso("tue") === "2026-08-11", M.kitWkIso("tue"));
  ok("kitWkIso: monday → today", M.kitWkIso("monday") === "2026-08-10", null);
  ok("kitWkIso: sunday → end of week", M.kitWkIso("sunday") === "2026-08-16", null);
  ok("kitWkIso: junk → null", M.kitWkIso("blursday") === null, null);
  // apply: fresh meal + mid resolution + txt fallback
  domVals["kit-week-import"] = { value: SAMPLE };
  dbWrites.length = 0; toasts.length = 0;
  M.kitImportWeekApply();
  const shankW = dbWrites.find(w => /^kitchen\/meals\//.test(w[0]) && w[1].name === "Braised Shank");
  ok("apply: meal written with recipe + prep", shankW && shankW[1].ing.includes("beef shank") && shankW[1].prep.length === 2, shankW);
  const shankId = shankW ? shankW[0].split("/").pop() : "";
  ok("apply: tue resolves to the imported meal's mid", dbWrites.some(w => w[0] === "kitchen/plan/2026-08-11" && w[1].mid === shankId), dbWrites);
  ok("apply: unknown name falls back to txt", (M.kitPlan["2026-08-12"] || {}).txt === "Kielbasa + dirty rice", M.kitPlan["2026-08-12"]);
  ok("apply: name match is case-insensitive", (M.kitPlan["2026-08-14"] || {}).mid && M.kitMeals[M.kitPlan["2026-08-14"].mid].name === "No Recipe Night", M.kitPlan["2026-08-14"]);
  ok("apply: toast counts meals + days", toasts.length === 1 && /2 meals/.test(toasts[0]) && /3 days/.test(toasts[0]), toasts);
  // merge: re-import same meal name keeps id, ratings, emoji
  M.kitRate("meal", shankId, "lucy"); // 😍
  domVals["kit-week-import"] = { value: "meal: braised shank\ningredients:\nnew ingredient list\ninstructions:\nnew steps" };
  dbWrites.length = 0;
  M.kitImportWeekApply();
  const upd = dbWrites.find(w => w[0] === "kitchen/meals/" + shankId);
  ok("re-import merges by name: same id, recipe replaced", upd && upd[1].ing === "new ingredient list", upd);
  ok("re-import keeps name-case, emoji, and 😋 votes", upd && upd[1].name === "Braised Shank" && upd[1].emoji === "🍖" && upd[1].ratings.lucy === "love", upd);
  delete domVals["kit-week-import"];
  // UI toggle
  M.kitWkImportToggle();
  M.renderKitchen(elStub);
  ok("📥 Import week panel renders", elStub.innerHTML.includes('id="kit-week-import"') && elStub.innerHTML.includes("kitImportWeekApply()"), null);
  M.kitWkImportToggle();
  M.renderKitchen(elStub);
  ok("panel toggles closed", !elStub.innerHTML.includes('id="kit-week-import"'), null);
  // cleanup the plan days this group wrote
  ["2026-08-11", "2026-08-12", "2026-08-14"].forEach(iso => { delete M.kitPlan[iso]; });
})();

// ── 📥 KITCHEN · week import day-slots (breakfast/lunch/snack) ───────────────
(() => {
  TODAY = "2026-08-10"; // Monday
  const SAMPLE = [
    "plan:",
    "tue: Taco night",
    "tue breakfast: oatmeal bar",
    "tue lunch: turkey roll-ups + apples",
    "tue snack: apples + PB",
    "tue brunch: not a real slot",
    "wed b: smoothies",
    "wed supper: Chili",
  ].join("\n");
  const p = M.kitParseWeek(SAMPLE);
  ok("slot parser: bare day = dinner", p.plan[0].slot === "d" && p.plan[0].value === "Taco night", p.plan[0]);
  ok("slot parser: breakfast/lunch/snack words", p.plan[1].slot === "b" && p.plan[2].slot === "l" && p.plan[3].slot === "s", p.plan.slice(1, 4));
  ok("slot parser: unknown slot word skipped", !p.plan.some(x => x.value === "not a real slot"), null);
  ok("slot parser: short + supper forms", p.plan[4].slot === "b" && p.plan[5].slot === "d" && p.plan[5].day === "wed", p.plan.slice(4));
  domVals["kit-week-import"] = { value: SAMPLE };
  dbWrites.length = 0;
  M.kitImportWeekApply();
  const tue = M.kitPlan["2026-08-11"];
  ok("apply: dinner + slots merge on one day", tue && tue.mid === "mtaco" && tue.b.txt === "oatmeal bar" && tue.l.txt === "turkey roll-ups + apples" && tue.s.txt === "apples + PB", tue);
  ok("apply: db carries the whole day object", dbWrites.some(w => w[0] === "kitchen/plan/2026-08-11" && w[1].b && w[1].mid === "mtaco"), null);
  ok("apply: meal-name slot resolves to mid", (M.kitPlan["2026-08-12"] || {}).mid && M.kitMeals[M.kitPlan["2026-08-12"].mid].name === "Chili", M.kitPlan["2026-08-12"]);
  ok("kitPlanSlot: txt + meal resolution", M.kitPlanSlot("2026-08-11", "b").txt === "oatmeal bar" && M.kitPlanSlot("2026-08-11", "x" in {} ? "x" : "l").txt.includes("turkey"), null);
  ok("kitPlanSlot: empty slot → null", M.kitPlanSlot("2026-08-11", "x") === null && M.kitPlanSlot("2026-08-13", "b") === null, null);
  // dinner change via the picker keeps the slots
  M.kitAssign("2026-08-11", { mid: "mchili" });
  ok("kitAssign keeps b/l/s on dinner swap", M.kitPlan["2026-08-11"].mid === "mchili" && M.kitPlan["2026-08-11"].b.txt === "oatmeal bar", M.kitPlan["2026-08-11"]);
  M.kitAssign("2026-08-11", { txt: "Leftovers" });
  ok("txt dinner drops mid but keeps slots", !M.kitPlan["2026-08-11"].mid && M.kitPlan["2026-08-11"].txt === "Leftovers" && M.kitPlan["2026-08-11"].s.txt === "apples + PB", null);
  // renders
  M.renderKitchen(elStub);
  ok("grid row shows the slot line", elStub.innerHTML.includes("🌅 oatmeal bar") && elStub.innerHTML.includes("🍎 apples + PB"), null);
  // dinner card slot rows — plan TODAY with slots
  M.kitPlan["2026-08-10"] = { txt: "Pizza out", b: { txt: "granola + berries" }, l: { txt: "ramen bowls" } };
  M.renderMomsDay(elStub);
  let dh = elStub.innerHTML;
  ok("dinner card shows labeled slot rows", dh.includes("🌅 Breakfast") && dh.includes("granola + berries") && dh.includes("☀️ Lunch") && dh.includes("ramen bowls"), null);
  ok("empty snack row invites a tap", dh.includes("🍎 Snack") && dh.includes("tap to add") && dh.includes("kitSlotText('2026-08-10','s')"), null);
  // prompt-edit the snack slot right on the card
  PROMPT = "apple boats";
  M.kitSlotText("2026-08-10", "s");
  ok("kitSlotText fills the slot + keeps the day", M.kitPlan["2026-08-10"].s.txt === "apple boats" && M.kitPlan["2026-08-10"].txt === "Pizza out", M.kitPlan["2026-08-10"]);
  PROMPT = "";
  M.kitSlotText("2026-08-10", "s");
  ok("blank clears just that slot", !M.kitPlan["2026-08-10"].s && M.kitPlan["2026-08-10"].b.txt === "granola + berries", null);
  // a day that becomes empty is removed entirely
  M.kitPlan["2026-08-13"] = { b: { txt: "toast" } };
  PROMPT = "";
  dbRemoves.length = 0;
  M.kitSlotText("2026-08-13", "b");
  ok("clearing the last slot removes the day node", !M.kitPlan["2026-08-13"] && dbRemoves.includes("kitchen/plan/2026-08-13"), null);
  M.kitAssign("2026-08-11", null);
  ok("clear drops the whole day incl. slots", !M.kitPlan["2026-08-11"], null);
  delete M.kitPlan["2026-08-10"]; delete M.kitPlan["2026-08-12"];
  delete domVals["kit-week-import"];
})();

// ── 📥 KITCHEN · "next" prefix + exact-date day lines (the Sunday bug) ───────
(() => {
  TODAY = "2026-08-09"; // a SUNDAY — the day the ambiguity bit
  ok("bare sun on a Sunday = today (the footgun, unchanged)", M.kitWkIso("sun") === "2026-08-09", M.kitWkIso("sun"));
  ok("strict sun on a Sunday = next week", M.kitWkIso("sun", true) === "2026-08-16", M.kitWkIso("sun", true));
  ok("strict tue on a Sunday = this coming Tuesday", M.kitWkIso("tue", true) === "2026-08-11", null);
  ok("exact ISO date passes through", M.kitWkIso("2026-08-16") === "2026-08-16", null);
  const p = M.kitParseWeek("plan:\nnext sun: granola + fruit\nnext sun snack: apples + PB\n2026-08-16: veg soup night");
  ok("parser: next prefix + slot word survive together", p.plan[0].next === true && p.plan[0].slot === "d" && p.plan[1].next === true && p.plan[1].slot === "s", p.plan);
  domVals["kit-week-import"] = { value: "plan:\nnext sun: Frontier veg soup + GF cornbread\nnext sun breakfast: granola + fruit" };
  dbWrites.length = 0;
  M.kitImportWeekApply();
  const sun = M.kitPlan["2026-08-16"];
  ok("apply: next sun lands a week out, not tonight", sun && sun.txt === "Frontier veg soup + GF cornbread" && sun.b.txt === "granola + fruit" && !M.kitPlan["2026-08-09"], sun);
  ok("apply: db write went to 2026-08-16", dbWrites.some(w => w[0] === "kitchen/plan/2026-08-16"), dbWrites);
  delete M.kitPlan["2026-08-16"];
  delete domVals["kit-week-import"];
})();

// ── 🧮 KITCHEN · rough counts: sweep sets, receipt adds, thumb corrects ──────
(() => {
  TODAY = "2026-08-10";
  domVals["pan-import"] = { value: "oat milk | fridge | 2" };
  domVals["pan-sweep"] = { checked: false };
  M.panImportApply();
  const omId = Object.keys(M.kitPantry).find(k => M.kitPantry[k].name === "oat milk");
  ok("receipt starts the count", M.kitPantry[omId].qty === 2, M.kitPantry[omId]);
  domVals["pan-import"] = { value: "oat milk | fridge | 3" };
  M.panImportApply();
  ok("second receipt ADDS", M.kitPantry[omId].qty === 5, M.kitPantry[omId].qty);
  domVals["pan-import"] = { value: "oat milk | fridge | 4" };
  domVals["pan-sweep"] = { checked: true };
  M.panImportApply();
  ok("sweep SETS the truth", M.kitPantry[omId].qty === 4, M.kitPantry[omId].qty);
  domVals["pan-import"] = { value: "oat milk | fridge" };
  M.panImportApply();
  ok("uncounted sweep keeps the old count", M.kitPantry[omId].qty === 4, M.kitPantry[omId].qty);
  ["pan-import", "pan-sweep"].forEach(k => delete domVals[k]);
  M.renderKitchen(elStub);
  ok("chip shows the rough count", elStub.innerHTML.includes("×4"), null);
  PROMPT = "7";
  M.panQtyEdit(omId);
  ok("manage-tap corrects the count", M.kitPantry[omId].qty === 7, null);
  PROMPT = "";
  dbRemoves.length = 0;
  M.panQtyEdit(omId);
  ok("blank stops counting (qty removed)", !("qty" in M.kitPantry[omId]) && dbRemoves.some(p => p.endsWith("/qty")), null);
})();

// ── 🍽 KITCHEN · uses manifest + ✓ We ate it ─────────────────────────────────
(() => {
  TODAY = "2026-08-10";
  domVals["kit-week-import"] = { value: "meal: Taco night\ningredients:\nbeef etc\ninstructions:\ncook it\nuses: canned tomatoes | 2\nuses: tortilla chips\nuses: ghost item | 5\nplan:\nmon: Taco night" };
  M.kitImportWeekApply();
  delete domVals["kit-week-import"];
  ok("import attaches the uses manifest", M.kitMeals.mtaco.uses.length === 3 && M.kitMeals.mtaco.uses[0].qty === 2 && M.kitMeals.mtaco.uses[1].qty === 1, M.kitMeals.mtaco.uses);
  ok("merge kept id + votes through a uses re-import", M.kitMeals.mtaco.ratings && M.kitMeals.mtaco.ratings.ellis === "love", M.kitMeals.mtaco.ratings);
  M.kitOpenRecipe("mtaco");
  M.renderKitchen(elStub);
  ok("recipe view shows the manifest", elStub.innerHTML.includes("On ✓ eaten") && elStub.innerHTML.includes("canned tomatoes ×2"), null);
  M.kitCloseRecipe();
  // stage pantry + staple for the deduction
  M.kitPantry.p_ct = { name: "Canned Tomatoes", zone: "pantry", addedIso: "2026-08-10", qty: 3, ts: 1 };
  M.kitPantry.p_tc = { name: "tortilla chips", zone: "pantry", addedIso: "2026-08-10", ts: 1 }; // no qty — untouched
  M.kitStaples.s_ct = { name: "canned tomatoes", state: "have", ts: 1 };
  M.renderMomsDay(elStub);
  ok("card offers ✓ We ate it", elStub.innerHTML.includes("kitMarkEaten('2026-08-10')"), null);
  CONFIRM = false;
  M.kitMarkEaten("2026-08-10");
  ok("declined confirm deducts nothing", !M.kitPlan["2026-08-10"].eaten && M.kitPantry.p_ct.qty === 3, null);
  CONFIRM = true; dbWrites.length = 0;
  M.kitMarkEaten("2026-08-10");
  ok("eaten stamps the day", M.kitPlan["2026-08-10"].eaten && dbWrites.some(w => w[0] === "kitchen/plan/2026-08-10/eaten"), null);
  ok("uses deduct case-insensitively", M.kitPantry.p_ct.qty === 1, M.kitPantry.p_ct.qty);
  ok("uncounted + ghost items untouched", !("qty" in M.kitPantry.p_tc), null);
  M.renderMomsDay(elStub);
  ok("card flips to ✓ Eaten badge", elStub.innerHTML.includes("✓ Eaten") && !elStub.innerHTML.includes("kitMarkEaten('2026-08-10')"), null);
  M.kitMarkEaten("2026-08-10");
  ok("second tap never double-deducts", M.kitPantry.p_ct.qty === 1, null);
  // zero flips the ⭐ staple to ❌ out
  M.kitPlan["2026-08-12"] = { mid: "mtaco" };
  M.kitMarkEaten("2026-08-12");
  ok("hitting zero floors and flips the staple out", M.kitPantry.p_ct.qty === 0 && M.kitStaples.s_ct.state === "out", { qty: M.kitPantry.p_ct.qty, st: M.kitStaples.s_ct.state });
  // txt dinner: stamp only
  M.kitPlan["2026-08-13"] = { txt: "Pizza out" };
  M.kitMarkEaten("2026-08-13");
  ok("typed dinner stamps without deduction", M.kitPlan["2026-08-13"].eaten && M.kitPantry.p_ct.qty === 0, null);
  ["2026-08-10", "2026-08-12", "2026-08-13"].forEach(iso => delete M.kitPlan[iso]);
  delete M.kitPantry.p_ct; delete M.kitPantry.p_tc; delete M.kitStaples.s_ct;
})();


// ── 🧹 Phase 4: Mom's chores — MC_DEFAULT seed + momChores/{id} + day stamps ─
(() => {
  // Real-grammar cadence for this group — the suite-wide stub says always-due.
  const oldCad = global.cadDueOn;
  global.cadDueOn = (cad, dn) => {
    if (!cad || cad === "daily") return true;
    if (cad === "asneeded") return false;
    const idx = DAYS_ALL.indexOf(dn);
    if (cad.indexOf("wk:") === 0) return cad.slice(3).split(",").filter(x => x !== "").map(Number).indexOf(idx) >= 0;
    return false; // 2w treated as not-today here (deterministic)
  };
  // scope html asserts to THIS card (counts like 1/1 also live on Mom's list)
  const mcCard = h => { const i = h.indexOf("Mom's chores"); const j = h.indexOf("<span>💳</span>", i); return i < 0 ? "" : h.slice(i, j < 0 ? undefined : j); };
  TODAY = "2026-08-10"; BREAK = null; // a Monday
  dbWrites.length = 0; dbRemoves.length = 0;

  // fresh install: her 8 starter chores show without a single db write
  ok("defaults: 8 starter chores", Object.keys(M.mcAll()).length === 8, Object.keys(M.mcAll()));
  ok("defaults live in code, not the db", Object.keys(M.momChoresData).length === 0 && dbWrites.length === 0, null);
  ok("monday due = kitchen close + sheets", JSON.stringify(M.mcDueToday("monday")) === JSON.stringify(["mc_kclose","mc_sheets"]), M.mcDueToday("monday"));
  ok("tuesday due = close + tubs + sinks", JSON.stringify(M.mcDueToday("tuesday")) === JSON.stringify(["mc_kclose","mc_tubs","mc_bsinks"]), M.mcDueToday("tuesday"));
  ok("sunday due includes fridge + master", M.mcDueToday("sunday").indexOf("mc_fridge") >= 0 && M.mcDueToday("sunday").indexOf("mc_master") >= 0, null);

  // The day-to-day list now lives on the 🏡 My day strip; the full chores card is the
  // EDITOR and only renders while managing (mcManage).
  M.renderMomsDay(elStub);
  const strip = elStub.innerHTML;
  ok("My day strip lists today's due chores", strip.includes("Wash the sheets") && strip.includes("Kitchen close-down"), null);
  ok("not-due default hidden on the strip (mop is Friday)", !strip.includes("Mop kitchen"), null);
  ok("editor card hidden until managing", mcCard(strip) === "", null);
  M.mcToggleManage();
  M.renderMomsDay(elStub);
  let c = mcCard(elStub.innerHTML);
  ok("editor card renders default chores", c.includes("Wash the sheets") && c.includes("Kitchen close-down"), null);
  ok("editor lists the whole week (mop too)", c.includes("Mop kitchen"), null);
  ok("header count 0/2", c.includes(">0/2<"), null);

  // checking a default stamps the DAY without seeding the defs
  M.mcToggle("mc_kclose");
  ok("default check-off stamps momday only", M.mcDoneOn("2026-08-10","mc_kclose") && dbWrites.every(w => w[0].indexOf("momChores/") !== 0), null);
  ok("stamp is TODAY-only", !M.mcDoneOn("2026-08-11","mc_kclose"), null);
  ok("defs still unseeded after a check", Object.keys(M.momChoresData).length === 0, null);
  M.renderMomsDay(elStub);
  c = mcCard(elStub.innerHTML);
  ok("editor header counts 1/2 after the check", c.includes(">1/2<"), null);
  ok("My day strip's Ongoing column counts 1/2 too", elStub.innerHTML.includes("Ongoing") && elStub.innerHTML.includes(">1/2<"), null);
  M.mcToggle("mc_kclose");
  ok("re-toggle unstamps (db remove)", !M.mcDoneOn("2026-08-10","mc_kclose") && dbRemoves.some(p => p === "momday/2026-08-10/chores/mc_kclose"), null);
  M.mcToggleManage();   // leave managing OFF so the manage-mode checks below toggle it on themselves

  // the FIRST EDIT copies the whole set to momChores/* (rtCfgEnsure pattern)
  dbWrites.length = 0;
  M.mcSetCad("mc_mop","wk:5");
  ok("first edit seeds all 8 + _seeded", Object.keys(M.mcAll()).length === 8 && M.momChoresData._seeded === true, null);
  ok("seed wrote every def + the sentinel", dbWrites.some(w => w[0] === "momChores/mc_sheets") && dbWrites.some(w => w[0] === "momChores/_seeded"), null);
  ok("the edit itself landed", M.momChoresData.mc_mop.cad === "wk:5", M.momChoresData.mc_mop);
  M.mcSetCad("mc_mop","wk:4");

  // her own adds join the seeded list
  domVals["mc-new"] = { value: "  Water plants  " };
  domVals["mc-cad"] = { value: "wk:2" };
  M.mcAdd();
  const id9 = Object.keys(M.mcAll()).find(k => k.indexOf("mc_") !== 0);
  ok("mcAdd joins without nuking defaults", !!id9 && Object.keys(M.mcAll()).length === 9 && M.momChoresData[id9].label === "Water plants", null);
  domVals["mc-new"] = { value: "   " };
  M.mcAdd();
  ok("blank add is a no-op", Object.keys(M.mcAll()).length === 9, null);

  // cadence letters: sorted wk: lists, clearing all falls back to daily
  M.mcCadToggleDay(id9, 0);
  ok("letter adds sorted → wk:0,2", M.momChoresData[id9].cad === "wk:0,2", M.momChoresData[id9].cad);
  ok("cad edit writes momChores/{id}/cad", dbWrites.some(w => w[0] === "momChores/" + id9 + "/cad" && w[1] === "wk:0,2"), null);
  M.mcCadToggleDay(id9, 0); M.mcCadToggleDay(id9, 2);
  ok("clearing every letter → daily", M.momChoresData[id9].cad === "daily", M.momChoresData[id9].cad);

  // manage mode shows everything; delete needs the confirm
  M.mcToggleManage();
  M.renderMomsDay(elStub);
  c = mcCard(elStub.innerHTML);
  ok("manage mode lists all 9", c.includes("Water plants") && c.includes("Mop kitchen"), null);
  ok("manage mode has letter chips + delete", c.includes("mcCadToggleDay('mc_mop'") && c.includes("mcDel('" + id9 + "')"), null);
  M.mcToggleManage();
  CONFIRM = false;
  M.mcDel(id9);
  ok("declined confirm keeps the chore", !!M.momChoresData[id9], null);
  CONFIRM = true;
  M.mcDel(id9);
  ok("mcDel removes + db remove", !M.momChoresData[id9] && dbRemoves.some(p => p === "momChores/" + id9), null);

  // deleting EVERYTHING stays deleted — _seeded blocks the resurrect
  Object.keys(M.mcAll()).forEach(id => M.mcDel(id));
  ok("delete-all: no default resurrect", Object.keys(M.mcAll()).length === 0, Object.keys(M.mcAll()));
  M.renderMomsDay(elStub);
  ok("empty strip says nothing is due and offers the slot basics", elStub.innerHTML.includes("Nothing of yours due today") && elStub.innerHTML.includes("mcSeedSlot("), null);

  // wipe module state so no later group inherits it
  Object.keys(M.momChoresData).forEach(k => { delete M.momChoresData[k]; });
  global.cadDueOn = oldCad;
  delete domVals["mc-new"]; delete domVals["mc-cad"];
})();

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
