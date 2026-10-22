/*
 * Node tests — 🏡 FAMPRESENCE (session pack B, her yes 2026-10-22): Family Time when Mom is NOT simply there.
 *   (a) Mom off (mlMomOff): every Mom-led copy for today + Mom's Day row say "Waiting on Mom"; nothing moves; a day that
 *       ends with no copy checked is owed (the existing FAMMAKEUP rule — proven here, no new hook).
 *   (b) Helpers: a Mom-led family card is GIVEN like a Mom card (one row per subject, one tick = every copy); on the given
 *       helper's device Mom's Done dialog opens and fans out; points pay with her name; history carries by:<helperId>; kids can't check.
 *   (c) Sitter: a Mom-led "scheduler picks" block lands after sitterEnd; a pinned block is NOT moved but stamped famSitter,
 *       the card says so, and the Grid audit strip lists it.
 *   momLeads:false blocks are untouched in all three; with no sitter, no helper and Mom present, lay + render = base.
 *
 *   run:  node test_fam_presence.js        (reads ./index.html; FAM_BASE=<main's index.html> or `git show origin/main:index.html` for the identity checks)
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const base = (() => {
  try { if (process.env.FAM_BASE) return fs.readFileSync(process.env.FAM_BASE, "utf8"); } catch (e) {}
  try { return require("child_process").execSync("git show origin/main:index.html", { cwd: __dirname, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 128e6 }).toString(); } catch (e) { return null; }
})();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
function extractFn(name, from) {
  from = from || src;
  const i = from.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = from.indexOf("{", i); k < from.length; k++) {
    const c = from[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return from.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(a, b, from) {
  from = from || src;
  const i = from.indexOf(a); if (i < 0) throw new Error("slice start not found: " + a);
  const j = from.indexOf(b, i); if (j < 0) throw new Error("slice end not found: " + b);
  return from.slice(i, j);
}
const toMin = (t) => { if (t == null) return NaN; const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10); const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + mi; };
const fromMin = (v) => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
const fbArr = (v) => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; };
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const esc = (s) => String(s == null ? "" : s).replace(/</g, "&lt;");
const taskDevice = (t) => t.device || "paper";
const gwDeviceCaps = () => ({ screen: 2, computer: 1, ipadLucy: 1 });
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");
const dayStamp = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
const TODAY_ISO = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const TODAY_DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

const FAM = slice("// FAMBLOCK_START", "// FAMBLOCK_END");
const TG = slice("// FAMTOGETHER_START", "// FAMTOGETHER_END");
const FL = slice("// FAMLESSONS_START", "// FAMLESSONS_END");
const PRES = slice("// FAMPRESENCE_START", "// FAMPRESENCE_END");
const HLP = slice("// ── HELPERS_START", "// ── HELPERS_END");
const ML = slice("// MOMLOOP_START", "// MOMLOOP_END");

const SD = { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const BLOCK = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch",
  items: [{ key: "hist", name: "History", minutes: 30 }, { key: "sci", name: "Science", minutes: 30 }] };
const KIDS_ONLY = { name: "Kids' Hour", kids: ["taylor", "makenzie"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "10:00 AM", momLeads: false,
  items: [{ key: "ko", name: "Kids Reading", minutes: 20 }] };
const rules = (blocks, sd) => ({ schoolDay: Object.assign({}, SD, sd || {}), familyBlocks: blocks });
// today's family cards (every copy at 1:00 / 1:30), as the week holds them
const famTasks = (ids, extra) => {
  const out = [];
  ROSTER.forEach((k, i) => {
    out.push(Object.assign({ id: "h_" + k, who: k, day: TODAY_DN, time: "1:00 PM", dur: 30, title: "\u{1F3E1} History", detail: "Family Time", mom: "none", device: "paper", famBlock: "fb1", famItem: "hist" }, extra || {}));
    out.push(Object.assign({ id: "s_" + k, who: k, day: TODAY_DN, time: "1:30 PM", dur: 30, title: "\u{1F3E1} Science", detail: "Family Time", mom: "none", device: "paper", famBlock: "fb1", famItem: "sci" }, extra || {}));
  });
  ["taylor", "makenzie"].forEach(k => out.push({ id: "ko_" + k, who: k, day: TODAY_DN, time: "10:00 AM", dur: 20, title: "\u{1F3E1} Kids Reading", detail: "Kids' Hour", mom: "none", device: "paper", famBlock: "fb2", famItem: "ko" }));
  return out;
};

console.log("0. placement + hooks");
{
  const iL = src.indexOf("// FAMLESSONS_END"), iS = src.indexOf("// FAMPRESENCE_START"), iE = src.indexOf("// FAMPRESENCE_END");
  ok("FAMPRESENCE block sits right after FAMLESSONS_END", iS > 0 && src.slice(iL, iS).trim() === "// FAMLESSONS_END" && iE > iS);
  ok("one FAMPRESENCE block", src.split("// FAMPRESENCE_START").length === 2 && src.split("// FAMPRESENCE_END").length === 2);
  const hooks = [
    ['famRowHTML', /famPresRowHTML\(t,done\)/],
    ['famRateOpen', /function famRateOpen\(id\)\{\n  if\(!momHere\(\)&&!\(typeof famPresLeadsId==="function"&&famPresLeadsId\(id\)\)\) return;/],
    ['famRateSave', /famPresLeadsId\(famRateState\.ids\[0\]\)/],
    ['helperGivenTo', /\(t\.mom!=="required"&&!\(typeof famPresGivable==="function"&&famPresGivable\(t\)\)\)\) return null;/],
    ['helperHolds', /t\.mom!=="required"&&t\.mom!=="maybe"&&!\(typeof famPresGivable==="function"&&famPresGivable\(t\)\)\) return null;/],
    ['helperTasksToday', /t\.mom==="maybe"\|\|\(typeof famPresGivable==="function"&&famPresGivable\(t\)\)\)&&_hlpIsToday\(t\)/],
    ['helperGiveCands', /\.concat\(\(typeof famPresGiveCands==="function"\)\?famPresGiveCands\(all\):\[\]\)/],
    ['_hlpGiveGroup', /function _hlpGiveGroup\(t,list\)\{ if\(t&&t\.famBlock&&typeof famPresGiveGroup==="function"\) return famPresGiveGroup\(t\);/],
    ["helper's list", /helperViewActive\(\)&&typeof famMomView==="function"\) allDay=famMomView\(allDay\);/],
    ['tapTask kid branch', /if\(t\.famBlock&&!momHereCards\(\)&&!\(typeof famPresLeads==="function"&&famPresLeads\(t\)\)\)\{/],
    ['tapTask points', /if\(t\.famBlock&&\(momHereCards\(\)\|\|\(typeof famPresLeads==="function"&&famPresLeads\(t\)\)\)&&!checked\[id\]/],
    ['finalizeDone by', /if\(!entry\.by&&typeof famPresBy==="function"\)\{ const _pb=famPresBy\(t\); if\(_pb\) entry\.by=_pb; \}/],
    ['generator stamp', /famPresSitterStamp\(fc,dayConfig\):null\)\);/],
    ['gvAuditFindings', /out\.now=out\.now\.concat\(famPresAudit\(kid\)\);/],
    ['gvAuditRender', /else if\(f\.type==="famsitter"\)\{ return \(typeof famPresAuditRowHTML==="function"\)\?famPresAuditRowHTML\(f\):""; \}/],
  ];
  hooks.forEach(([n, re]) => ok("hook: " + n, re.test(src)));
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
  ok("the block writes nothing to Firebase", !/db\.ref\(/.test(PRES));
}

// ── an environment with the REAL family code (+ optionally FAMPRESENCE) on stubs ──
function famEnv(E, withPres) {
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "esc", "ROSTER", "E", `
    var rulesData=E.rulesData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState=E.hist||{}, WK="week1", db=null, currData={subjects:{}};
    var helperView=E.helperView||null, _todayDay=E.todayDay||"${TODAY_DN}", momLoop=E.momLoop||{};
    function _dryRun(){ return true; } function momHere(){ return !!E.mom; } function renderAll(){} function dbg(){} function sv(){} function ld(){ return {}; }
    function nowTs(){ return "1:30 PM"; } var toasts=[]; function gwShowToast(m){ toasts.push(m); }
    function smapIsKidOff(){ return false; } function coopTimedEndMin(){ return 0; }
    function cbTodayISO(){ return E.today||"${TODAY_ISO}"; } function routineDateISO(d){ return (E.dayISO||{})[d]||(d==="${TODAY_DN}"?"${TODAY_ISO}":null); }
    function _mlDayStamp(){ return "${dayStamp()}"; }
    function mlMomOff(){ try{ return !!(momLoop&&momLoop.momOff===_mlDayStamp()); }catch(e){ return false; } }
    function helperHolds(t){ return (E.holds&&E.holds[t.id])||null; }
    function helperViewActive(){ return !!helperView; } function helperName(id){ return (E.helperNames||{})[id]||"Helper"; }
    function helperDadId(){ return E.dadId||null; } function helperDadCanAct(){ return !!E.dadHere; }
    var paid=[]; function bankDirect(k,p,n){ paid.push([k,p,n]); return "bid_"+paid.length; }
    var finals=[]; function finalizeDone(id,ts,score){ finals.push({id:id,ts:ts,score:score}); checked[id]=ts; return true; }
    var document={getElementById:function(){ return null; },createElement:function(){ return {style:{},appendChild:function(){}}; },body:{appendChild:function(){}}};
    ${FX_DOW_SRC}
    ${FAM}
    ${withPres ? PRES : ""}
    return {famRowHTML,famMomView,famIsMomCard,famRateOpen,famRateSave,famSiblings,
      pres:${withPres ? "{famPresWaiting,famPresRowHTML,famPresGiveCands,famPresGiveGroup,famPresLeads,famPresBy,famPresLeadName,famPresSitterStamp,famPresAudit,famPresAuditRowHTML,famPresGivable}" : "null"},
      state:function(){ return {toasts:toasts,paid:paid,finals:finals,checked:checked,rate:famRateState}; }};
  `);
  return f(toMin, fromMin, fbArr, cap, esc, ROSTER, E);
}

console.log("1a. Mom off → 'Waiting on Mom' on every Mom-led copy and Mom's row; kids-only and done cards untouched");
{
  const T = famTasks();
  const off = famEnv({ rulesData: rules({ fb1: BLOCK, fb2: KIDS_ONLY }), tasks: T, momLoop: { momOff: dayStamp() } }, true);
  const on = famEnv({ rulesData: rules({ fb1: BLOCK, fb2: KIDS_ONLY }), tasks: T, momLoop: {} }, true);
  const WAIT = "Waiting on Mom";
  ok("switch on: every Mom-led copy (8) says Waiting on Mom", T.filter(t => t.famBlock === "fb1").every(t => off.famRowHTML(t, false, t.who).indexOf(WAIT) > 0));
  ok("…the kids-only block never does", T.filter(t => t.famBlock === "fb2").every(t => off.famRowHTML(t, false, t.who).indexOf(WAIT) < 0));
  ok("…Mom's Day row (famMomView, one per subject) says it too", off.famMomView(T).filter(t => t.famBlock === "fb1").length === 2 && off.famMomView(T).filter(t => t.famBlock === "fb1").every(t => off.famRowHTML(t, false, "mom").indexOf(WAIT) > 0));
  ok("switch off: no badge anywhere", T.every(t => on.famRowHTML(t, false, t.who).indexOf(WAIT) < 0));
  ok("the card still says Mom checks it off (nothing else on the card changed)", off.famRowHTML(T[0], false, "taylor").indexOf("Mom checks this off for everyone") > 0);
  const offDone = famEnv({ rulesData: rules({ fb1: BLOCK }), tasks: T, momLoop: { momOff: dayStamp() }, checked: { h_taylor: "1:20 PM" } }, true);
  ok("a checked copy shows no badge", offDone.famRowHTML(T[0], true, "taylor").indexOf(WAIT) < 0);
  ok("a stale stamp (yesterday's) is not 'off'", famEnv({ rulesData: rules({ fb1: BLOCK }), tasks: T, momLoop: { momOff: "2000-1-1" } }, true).famRowHTML(T[0], false, "taylor").indexOf(WAIT) < 0);
  const other = famTasks().map(t => Object.assign({}, t, { day: TODAY_DN === "monday" ? "tuesday" : "monday" }));
  ok("another day's copy is not waiting (today only)", famEnv({ rulesData: rules({ fb1: BLOCK }), tasks: other, momLoop: { momOff: dayStamp() } }, true).famRowHTML(other[0], false, "taylor").indexOf(WAIT) < 0);
  const held = famEnv({ rulesData: rules({ fb1: BLOCK }), tasks: T, momLoop: { momOff: dayStamp() }, holds: { h_taylor: "g" } }, true);
  ok("a copy a helper holds is not waiting on Mom", held.famRowHTML(T[0], false, "taylor").indexOf(WAIT) < 0 && held.famRowHTML(T[1], false, "taylor").indexOf(WAIT) > 0);
}

console.log("1b. Mom off → nothing moves (the real living-day lay, Mom-off on vs off)");
{
  const TIME = extractFn("toMin") + "\n" + extractFn("fromMin");
  function lay(tasks, momLoop) {
    const ctx = { console, ROSTER: ["taylor", "makenzie", "andrew", "caleb"], db: null, checked: {}, momMoves: {}, getActiveTasks: () => tasks,
      morningComplete: () => true, bbActive: () => null, momHere: () => true, renderAll: () => {}, cap: s => String(s), esc: s => String(s == null ? "" : s),
      Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp };
    ctx._mlNowOverride = 9 * 60; ctx._mlEndOverride = 16 * 60 + 15; ctx._mlLunchOverride = [12 * 60, 13 * 60];
    Object.defineProperty(ctx, "_todayDay", { get: () => TODAY_DN });
    vm.createContext(ctx); vm.runInContext(TIME, ctx); vm.runInContext(ML, ctx);
    vm.runInContext("momLoop=" + JSON.stringify(momLoop) + ";", ctx);
    const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
    return Object.fromEntries(laid.map(t => [t.id, t.time]));
  }
  const own = (k, n) => Array.from({ length: n }, (_, i) => ({ id: "o_" + k + i, who: k, day: TODAY_DN, time: fromMin(9 * 60 + 30 * i), dur: 30, title: "own " + i, mom: "none", device: "paper", subjectKey: "own" + i }));
  const T = famTasks().concat(own("taylor", 5), own("makenzie", 4), own("andrew", 6), own("caleb", 3),
    [{ id: "m_taylor", who: "taylor", day: TODAY_DN, time: "9:00 AM", dur: 30, title: "Math with Mom", mom: "required", device: "paper", subjectKey: "math" }]);
  const A = lay(T, { cursor: 0, order: ROSTER }), B = lay(T, { cursor: 0, order: ROSTER, momOff: dayStamp() });
  const fam = T.filter(t => t.famBlock);
  ok("Mom off: every family card keeps its pinned time", fam.every(t => B[t.id] === t.time), fam.map(t => t.id + "@" + B[t.id]));
  ok("…the same times as with Mom present", fam.every(t => A[t.id] === B[t.id]));
  const indep = T.filter(t => !t.famBlock && t.mom !== "required" && t.who !== "taylor");
  ok("kids with no Mom card today lay exactly the same with Mom off", indep.every(t => A[t.id] === B[t.id]), indep.filter(t => A[t.id] !== B[t.id]).map(t => t.id));
  ok("(control: Taylor's Mom-required math sinks behind her own work — the switch still does its job)", B["m_taylor"] !== A["m_taylor"], [A["m_taylor"], B["m_taylor"]]);
}

console.log("1c. Mom off all day, no copy checked → the date is owed (the FAMMAKEUP rule covers it; no new hook)");
{
  function mk(E) {
    return new Function("toMin", "fromMin", "E", `
      var rulesData=E.rulesData, currData=E.currData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState=E.hist||{}, WK="week2", db=null, archive={};
      const ROSTER=["taylor","makenzie","andrew","caleb"], KID_COLOR={};
      function fbArr(v){ if(!v) return v; if(Array.isArray(v)) return v; if(typeof v==="object"){ const k=Object.keys(v); if(k.length&&k.every(x=>/^\\d+$/.test(x))) return k.sort((a,b)=>a-b).map(x=>v[x]); } return v; }
      function cap(s){ return s?s[0].toUpperCase()+s.slice(1):s; } function esc(s){ return String(s==null?"":s).replace(/</g,"&lt;"); }
      function _dryRun(){ return true; } function momHere(){ return true; } function renderAll(){} function dbg(){} function confirm(){ return true; }
      function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
      function smapIsKidOff(){ return false; } function coopTimedEndMin(){ return 0; } function planBacked(){ return false; }
      function cbTodayISO(){ return E.today; } function routineDateISO(d){ return (E.dayISO||{})[d]||null; } var gvShowPast=false;
      var document={getElementById:()=>null}; var momLoop={}; function mlMomOff(){ return false; } function helperHolds(){ return null; }
      const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
      ${FAM}
      ${TG}
      ${FL}
      ${PRES}
      return {famLessonMap:famLessonMap,famOwedList:famOwedList,famDefs:famDefs};
    `)(toMin, fromMin, E);
  }
  const it = { key: "hist", name: "History", minutes: 30, track: { mode: "seq", list: [{ t: "L1", n: 1 }, { t: "L2", n: 1 }, { t: "L3", n: 1 }], missed: "next", missedFrom: "2026-10-19" } };
  const b = Object.assign({}, BLOCK, { items: [it] });
  const lessons = {}; ROSTER.forEach(k => { lessons[k] = {}; [["2026-10-19", 1], ["2026-10-20", 2], ["2026-10-21", 3], ["2026-10-22", 4], ["2026-10-23", 5]].forEach(([d, n]) => lessons[k][n] = { date: d, week: 8 }); });
  const dayISO = { monday: "2026-10-19", tuesday: "2026-10-20", wednesday: "2026-10-21", thursday: "2026-10-22" };
  const tasks = ROSTER.map(k => ({ id: "w_" + k, who: k, day: "wednesday", time: "1:00 PM", dur: 30, famBlock: "fb1", famItem: "hist" }));
  // Mon + Tue were checked; Wednesday Mom was off all day and nobody checked a copy; today is Thursday.
  const E0 = { rulesData: rules({ fb1: b }), currData: { subjects: {}, lessons }, tasks, today: "2026-10-22", dayISO };
  const noCheck = mk(E0);
  const dates = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];
  const owedA = noCheck.famOwedList("fb1", it, dates, "2026-10-22", () => true);
  ok("Wednesday (Mom off, nothing checked) is owed on Thursday", owedA.indexOf("2026-10-21") >= 0, owedA);
  ok("…and doubles onto today's card (two lessons)", /\+/.test(noCheck.famLessonMap(b, "fb1", it).byDate["2026-10-22"] || ""), noCheck.famLessonMap(b, "fb1", it).byDate["2026-10-22"]);
  const withCheck = mk(Object.assign({}, E0, { checked: { w_taylor: "1:20 PM" }, hist: { w_taylor: { famLabel: "L3" } } }));
  ok("a copy checked that day (Mom came back, or a helper led it) → not owed", withCheck.famOwedList("fb1", it, dates, "2026-10-22", () => true).indexOf("2026-10-21") < 0);
  ok("no new hook in famOwedList (the rule already counts a run day with no checked copy)", !/famPres/.test(extractFn("famOwedList")));
}

// ── (b) the REAL helpers block + family code, on a vm context (test_helper_give's pattern) ──
const TIME_SRC = extractFn("toMin") + "\n" + extractFn("fromMin");
function hlpEnv(tasks, o) {
  o = o || {};
  const writes = [];
  const db = { ref: p => ({ set: v => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: v => writes.push(["update", p, v]),
    transaction: (fn, cb) => { writes.push(["txn", p]); const r = fn(null); if (cb) cb(null, r !== undefined); } }) };
  const ctx = { console, db, _dryRun: () => false, momHere: () => o.mom !== false, rulesOpen: {}, pageOn: () => true, dadUnlocked: !!o.dadUnlocked,
    DAYS: [TODAY_DN], ROSTER: ROSTER.slice(), weekData: { tasks }, getActiveTasks: () => tasks, checked: o.checked || {}, histState: {}, WK: "week1", momLoop: {},
    rulesData: o.rulesData || rules({ fb1: BLOCK, fb2: KIDS_ONLY }), currData: { subjects: {} },
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), esc: s => String(s == null ? "" : s), fbArr,
    document: { activeElement: null, getElementById: () => null, createElement: () => ({ style: {}, appendChild() {} }), body: { appendChild: () => {} } },
    kitPinGate: () => { ctx.__gated = (ctx.__gated || 0) + 1; }, renderAll: () => {}, dbg: () => {}, sv: () => {}, ld: () => ({}), nowTs: () => "1:35 PM",
    smapIsKidOff: () => false, coopTimedEndMin: () => 0, cbTodayISO: () => TODAY_ISO, routineDateISO: d => d === TODAY_DN ? TODAY_ISO : null,
    gwShowToast: m => { (ctx.__toasts = ctx.__toasts || []).push(m); }, bankDirect: (k, p, n) => { (ctx.__paid = ctx.__paid || []).push([k, p, n]); return "bid" + ctx.__paid.length; },
    finalizeDone: (id, ts, score) => { (ctx.__finals = ctx.__finals || []).push({ id, ts, score }); ctx.checked[id] = ts; return true; },
    Date, Object, Array, String, Number, JSON, Math, parseInt, isNaN, RegExp };
  Object.defineProperty(ctx, "_todayDay", { get: () => TODAY_DN });
  vm.createContext(ctx);
  vm.runInContext(TIME_SRC + "\n" + FX_DOW_SRC + "\n" + HLP + "\n" + FAM + "\n" + PRES + "\nthis.__set=(h,d,g)=>{helpersData=h;helperDaysData=d||{};helperGiveData=g||{};};this.__view=(v)=>{helperView=v;};this.__rate=()=>famRateState;", ctx);
  ctx.__writes = writes;
  return ctx;
}
const G = { name: "Grandma", icon: "\u{1F475}", createdAt: 1, pick: false, days: { [TODAY_DN]: { start: "9:30 AM", end: "3:00 PM" } }, help: {} };
const DADH = { name: "Dad", icon: "\u{1F468}", createdAt: 2, dadPage: true, days: {}, help: {} };
const mkTasks = () => famTasks().concat([{ id: "m_taylor", who: "taylor", day: TODAY_DN, time: "9:00 AM", dur: 30, title: "Math with Mom", mom: "required", device: "paper", subjectKey: "math" }]);

console.log("2a. a Mom-led family card can be GIVEN like a Mom card — one row per subject, one tick = every copy");
{
  const T = mkTasks();
  const e = hlpEnv(T); e.__set({ g: G });
  const cands = e.helperGiveCands();
  ok("the give list: Mom's math + ONE row per Mom-led family subject (History, Science) — kids-only block absent", cands.map(t => t.famItem || t.id).join() === "m_taylor,hist,sci", cands.map(t => t.id));
  const pop = e.helperGivePopHTML("g");
  ok("the pop lists the family rows and says the copies go together", pop.indexOf("History") > 0 && pop.indexOf("4 of this subject go together") > 0);
  ok("before the tick nobody holds them", T.filter(t => t.famBlock).every(t => e.helperGivenTo(t) === null && e.helperHolds(t) === null));
  e.helperGiveToggle("g", cands.find(t => t.famItem === "hist").id);
  const w = e.__writes;
  ok("one targeted multi-path update under helperGive/<today>", w.length === 1 && w[0][0] === "update" && w[0][1] === "helperGive/" + TODAY_ISO, w.map(x => x[1]));
  ok("…holding every kid's History copy (4), nothing else", Object.keys(w[0][2]).sort().join() === ROSTER.map(k => "g/h_" + k).sort().join(), Object.keys(w[0][2]));
  ok("every History copy is Grandma's (helperGivenTo + helperHolds), Science and the kids-only block are not", ROSTER.every(k => e.helperGivenTo(T.find(t => t.id === "h_" + k)) === "g" && e.helperHolds(T.find(t => t.id === "h_" + k)) === "g")
    && ROSTER.every(k => e.helperHolds(T.find(t => t.id === "s_" + k)) === null) && e.helperHolds(T.find(t => t.id === "ko_taylor")) === null);
  ok("her list (helperTasksToday) carries the History copies", e.helperTasksToday("g").filter(t => t.famItem === "hist").length === 4);
  ok("the pop shows History ticked, with ↩ Undo", e.helperGivePopHTML("g").indexOf("checked onchange=\"helperGiveToggle('g','h_") > 0 && e.helperGiveBtnsHTML().indexOf("&#8617; Undo") > 0);
  const undoId = e.helperGiveCands().find(t => t.famItem === "hist").id;
  ok("the Undo button carries the row's own id", e.helperGiveBtnsHTML().indexOf("helperGiveToggle('g','" + undoId + "')") > 0);
  e.helperGiveToggle("g", undoId);
  ok("↩ Undo on the row clears every copy (null leaves)", Object.keys(e.__writes[1][2]).length === 4 && Object.values(e.__writes[1][2]).every(v => v === null) && ROSTER.every(k => e.helperHolds(T.find(t => t.id === "h_" + k)) === null));
  const kidsOnly = hlpEnv(T); kidsOnly.__set({ g: G });
  ok("a kids-only family card can't be given (momLeads:false)", kidsOnly.famPresGivable(T.find(t => t.id === "ko_taylor")) === false && kidsOnly.helperGiveCands().every(t => t.famBlock !== "fb2"));
  const gone = hlpEnv(T); gone.__set({ g: G }, { [TODAY_ISO]: { g: { arrived: 1, left: 2 } } }, { [TODAY_ISO]: { g: { h_taylor: { at: 1 } } } });
  ok("she left → the copy is Mom's again", gone.helperHolds(T[0]) === null);
  const off = hlpEnv(T, { mom: false }); off.__set({ g: G });
  off.helperGiveToggle("g", "h_taylor");
  ok("off Mom mode the hand-off asks for the Mom PIN and writes nothing", off.__gated === 1 && !off.__writes.length);
}

console.log("2b. on the given helper's device she leads (Mom's dialog + fan-out); a kid's device still can't");
{
  const T = mkTasks();
  const given = { [TODAY_ISO]: { g: {} } }; ROSTER.forEach(k => given[TODAY_ISO].g["h_" + k] = { at: 1 });
  const here = { [TODAY_ISO]: { g: { arrived: 1 } } };
  const kidDev = hlpEnv(T); kidDev.__set({ g: G }, here, given);
  ok("kid's tablet (no helper list open): famPresLeads false on every copy", T.filter(t => t.famBlock).every(t => !kidDev.famPresLeads(t)));
  ok("…so nothing is recorded 'by' a helper", kidDev.famPresBy(T[0]) === null);
  const hlpDev = hlpEnv(T); hlpDev.__set({ g: G }, here, given); hlpDev.__view("g");
  ok("Grandma's list open: she leads every History copy", ROSTER.every(k => hlpDev.famPresLeads(T.find(t => t.id === "h_" + k))));
  ok("…but not Science (not given) nor the kids-only card", !hlpDev.famPresLeads(T.find(t => t.id === "s_taylor")) && !hlpDev.famPresLeads(T.find(t => t.id === "ko_taylor")));
  ok("history entry by:<helperId> = 'g', name 'Grandma'", hlpDev.famPresBy(T[0]) === "g" && hlpDev.famPresLeadName(T[0]) === "Grandma");
  const other = hlpEnv(T); other.__set({ g: G, s: Object.assign({}, G, { name: "Sitter", createdAt: 3 }) }, { [TODAY_ISO]: { g: { arrived: 1 }, s: { arrived: 1 } } }, given); other.__view("s");
  ok("another helper's list open: not hers to lead", !other.famPresLeads(T[0]));
  const dad = hlpEnv(T, { dadUnlocked: true }); const dg = { [TODAY_ISO]: { d: {} } }; ROSTER.forEach(k => dg[TODAY_ISO].d["h_" + k] = { at: 1 });
  dad.__set({ g: G, d: DADH }, {}, dg);
  ok("the Dad helper leads from his own page (given, Dad unlocked, no hours needed)", dad.famPresLeads(T[0]) && dad.famPresBy(T[0]) === "d");
  const dadLocked = hlpEnv(T); dadLocked.__set({ g: G, d: DADH }, {}, dg);
  ok("…not from a locked device", !dadLocked.famPresLeads(T[0]));

  // the real tapTask + the real ✓ handler, replayed with a fake dialog
  const TAP = extractFn("tapTask") + "\n" + slice('document.getElementById("dlg-ok").onclick=()=>{', 'document.getElementById("dlg-uncheck").onclick=()=>{');
  function tapEnv(devHelperView, momMode) {
    const ctx = hlpEnv(T.map(t => Object.assign({}, t)), { mom: !!momMode }); ctx.__set({ g: G }, here, given); if (devHelperView) ctx.__view(devHelperView);
    const els = {}; const el = id => els[id] = els[id] || { id, style: {}, textContent: "", innerHTML: "", onclick: null, disabled: false };
    ctx.document.getElementById = id => el(id);
    Object.assign(ctx, { checkoffHeld: () => false, stTapGate: () => false, momHereCards: () => !!momMode, claimed: {}, day: TODAY_DN, momMoves: {},
      needsVerify: () => false, taskLessonRef: () => "", effectiveDay: t => t.day, closeDlg: () => { el("dlg").style.display = "none"; }, showPaceToast: () => {}, scoredType: () => null,
      obSet: () => {}, rtSchoolworkDone: () => false, celebrateDayComplete: () => {}, _nextSchoolDay: () => null, mvtPlan: () => null, _isNextUpLesson: () => false, paceData: {} });
    vm.runInContext("var pendingId=null, pendingClaimMode=false;\n" + TAP, ctx);
    return { ctx, els, el };
  }
  const K = tapEnv(null, false);
  K.ctx.tapTask("h_taylor");
  ok("a kid taps: toast 'Mom checks this off', no dialog", (K.ctx.__toasts || []).some(m => /Mom checks this off/.test(m)) && (K.el("dlg").style.display || "none") !== "flex" && !K.ctx.__finals);
  const H = tapEnv("g", false);
  H.ctx.tapTask("h_taylor");
  ok("Grandma taps on her list: Mom's dialog opens, 'Done — everyone', naming all four", H.el("dlg").style.display === "flex" && /Done — everyone/.test(H.el("dlg-ok").textContent) && /Taylor, Makenzie, Andrew, Caleb/.test(H.el("dlg-detail").textContent), H.el("dlg-detail").textContent);
  ok("…no claim ('send to Mom'): she checks it herself", /Done/.test(H.el("dlg-ok").textContent) && !/send to Mom/.test(H.el("dlg-ok").textContent));
  H.el("dlg-ok").onclick();
  const fin = (H.ctx.__finals || []).map(f => f.id).sort();
  ok("her ✓ fans out: every History copy finalized, Science untouched", fin.join() === ROSTER.map(k => "h_" + k).sort().join(), fin);
  const S = tapEnv("g", false);
  S.ctx.tapTask("s_taylor");
  ok("a copy NOT given to her still says Mom checks it (not hers to lead)", (S.ctx.__toasts || []).some(m => /Mom checks this off/.test(m)) && !S.ctx.__finals);
}

console.log("2c. points: a paying subject opens the stars screen for the helper and pays with her name");
{
  const PB = Object.assign({}, BLOCK, { items: [{ key: "hist", name: "History", minutes: 30, pts: 20 }, { key: "sci", name: "Science", minutes: 30 }] });
  const T = mkTasks();
  const given = { [TODAY_ISO]: { g: {} } }; ROSTER.forEach(k => given[TODAY_ISO].g["h_" + k] = { at: 1 });
  const here = { [TODAY_ISO]: { g: { arrived: 1 } } };
  const kid = hlpEnv(T, { rulesData: rules({ fb1: PB }), mom: false }); kid.__set({ g: G }, here, given);
  kid.famRateOpen("h_taylor");
  ok("a kid's device: the stars screen does not open", kid.__rate() === null);
  const h = hlpEnv(T, { rulesData: rules({ fb1: PB }), mom: false }); h.__set({ g: G }, here, given); h.__view("g");
  h.famRateOpen("h_taylor");
  ok("Grandma's device: the stars screen opens with every kid at full stars", h.__rate() && h.__rate().ids.length === 4 && Object.values(h.__rate().stars).every(n => n === 5), h.__rate());
  h.famRateSet("h_caleb", 3);
  h.famRateSave();
  const fin = h.__finals || [], paid = h.__paid || [];
  ok("Done — pay everyone: four copies finalized with a score", fin.length === 4 && fin.every(f => f.score && f.score.max === 20));
  ok("stars from Grandma, not 'Mom'", fin.every(f => f.score.by === "Grandma"), fin.map(f => f.score.by));
  ok("points banked as Mom's would be (20, 20, 20, 12)", paid.map(p => p[1]).sort((a, b) => a - b).join() === "12,20,20,20", paid);
  ok("paid once, under the same lock Mom's path uses (famPaid transaction)", h.__writes.filter(w => w[0] === "txn" && /famPaid/.test(w[1])).length === 1);
  const mom = hlpEnv(T, { rulesData: rules({ fb1: PB }), mom: true }); mom.__set({ g: G });
  mom.famRateOpen("h_taylor"); mom.famRateSave();
  ok("Mom's own path unchanged: by 'Mom'", (mom.__finals || []).length === 4 && mom.__finals.every(f => f.score.by === "Mom"));
}

// ── (c) the REAL day build: class partition + family block + packer, with a babysitter day ──
const PARTITION = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer");
if (PARTITION.indexOf("famDayCards") < 0) throw new Error("family block not inside the partition slice — update this test");
function makeDayRunner(from, withFam, withPres) {
  const part = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer", from);
  const emit = slice("  famCards.forEach(function(fc){\n    tasks.push(", "  tasks.sort((a,b)=>toMin(a.time)-toMin(b.time));", from);
  return new Function("toMin", "fromMin", "fbArr", "cap", "taskDevice", "gwDeviceCaps", "ROSTER", "ENV", "ARG", `
    var rulesData=ENV.rulesData, weekData={tasks:[]};
    function smapIsKidOff(k,ds){ return !!(ENV.off&&ENV.off[k+"|"+ds]); }
    function coopTimedEndMin(k,ds){ return (ENV.coop&&ENV.coop[k+"|"+ds])||0; }
    ${FX_DOW_SRC}
    ${extractFn("packDay", from)} ${extractFn("packAround", from)}
    ${extractFn("fxIsClass", from)} ${extractFn("fxDateList", from)} ${extractFn("fxRunsOn", from)} ${extractFn("fxWindow", from)} ${extractFn("fxLaneOf", from)}
    ${withFam ? slice("// FAMBLOCK_START", "// FAMBLOCK_END", from) : ""}
    ${withPres ? slice("// FAMPRESENCE_START", "// FAMPRESENCE_END", from) : ""}
    const items=ARG.items, meta=ARG.meta, dayConfig=ARG.dayConfig, dayName=ARG.dayName, kidAssignments=ARG.kidAssignments;
    const kidStart={}, isSitter=!!dayConfig.isSitter, sitterEnd=dayConfig.sitterEnd||0, schoolStart=ARG.schoolStart, cutoff=ARG.cutoff;
    const r={lunchStart:ARG.lunchStart,lunchEnd:ARG.lunchEnd};
    let counter=1000; const prefix="d_"; const tasks=[]; function dbg(){}
    if(isSitter) (dayConfig.withSitter||[]).forEach(function(k){ kidStart[k]=sitterEnd; });
${part}
    const overflow=packAround([],toPack,{start:schoolStart,end:cutoff,lunchStart:r.lunchStart,lunchEnd:r.lunchEnd,
      kidStart:kidStart,momStart:(isSitter?sitterEnd:0),busy:fxBusy,momBusy:fxMomBusy,laneBusy:fxLaneBusy,lanes:["computer","screen","ipadLucy","keyboard"],laneCap:gwDeviceCaps()});
    const overflowSet=new Set(overflow);
    items.forEach(function(it){ tasks.push({id:it.id,who:it.who,time:it.time,dur:it.dur,mom:it.mom,device:it.device}); });
    ${withFam ? emit : ""}
    return {tasks:tasks,overflow:overflow.map(function(x){return x.id;})};
  `);
}
const runNew = makeDayRunner(src, true, true), runFamOnly = makeDayRunner(src, true, false);
function buildDay(defs, ENV, opts, runner) {
  opts = opts || {};
  const items = [], meta = {}, kidAssignments = {};
  defs.forEach((d, i) => {
    const id = "t" + i, s = { minutes: d.min, mom: d.mom || "none", device: d.device || "paper", rules: d.rules || "" };
    items.push({ id, who: d.kid, device: s.device, dur: d.min, mom: s.mom });
    meta[id] = { kid: d.kid, key: "k" + i, excelVal: 1, s };
    (kidAssignments[d.kid] = kidAssignments[d.kid] || {})["k" + i] = 1;
  });
  const dc = Object.assign({ dateStr: opts.ds || "2026-10-26" }, opts.sitter ? { isSitter: true, sitterStart: toMin(opts.sitter[0]), sitterEnd: toMin(opts.sitter[1]), withSitter: opts.withSitter || [] } : {});
  return (runner || runNew)(toMin, fromMin, fbArr, cap, taskDevice, gwDeviceCaps, ROSTER, ENV, {
    items, meta, kidAssignments, dayConfig: dc, dayName: opts.dayName || "monday",
    schoolStart: toMin("9:00 AM"), cutoff: toMin("5:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM") });
}
const DEFS = (() => { const defs = []; [["taylor", [30, 20, 20, 30, 20, 30]], ["makenzie", [10, 30, 30, 20, 20, 10]], ["andrew", [10, 30, 20, 10, 20, 20]], ["caleb", [20, 15, 15, 20, 20, 15]]]
  .forEach(([k, ms]) => ms.forEach((m, i) => defs.push({ kid: k, min: m, mom: i % 3 === 1 ? "required" : "none" }))); return defs; })();

console.log("3a. sitter day, pinned Mom-led block inside the sitter hours → not moved, stamped famSitter");
{
  const R = buildDay(DEFS, { rulesData: rules({ fb1: BLOCK, fb2: KIDS_ONLY }) }, { sitter: ["12:00 PM", "3:00 PM"], withSitter: ["caleb"] });
  const fam = R.tasks.filter(t => t.famBlock === "fb1"), ko = R.tasks.filter(t => t.famBlock === "fb2");
  ok("the lunch block still lays at 1:00 / 1:30 for all four (not moved)", fam.length === 8 && fam.filter(t => t.famItem === "hist").every(t => t.time === "1:00 PM") && fam.filter(t => t.famItem === "sci").every(t => t.time === "1:30 PM"));
  ok("every copy is stamped famSitter:true", fam.every(t => t.famSitter === true));
  ok("the kids-only block (10:00, inside the window) is NOT stamped", ko.length === 2 && ko.every(t => !("famSitter" in t)));
  ok("Mom-required work (any kid) is deferred past 3:00 (the sitter rule, as before)", R.tasks.filter(t => t.mom === "required" && t.time).every(t => toMin(t.time) >= toMin("3:00 PM")), R.tasks.filter(t => t.mom === "required").map(t => t.time));
  const late = buildDay(DEFS, { rulesData: rules({ fb1: Object.assign({}, BLOCK, { at: "3:00 PM" }) }) }, { sitter: ["12:00 PM", "3:00 PM"] });
  ok("a block that starts right when the sitter leaves is not flagged (no overlap)", late.tasks.filter(t => t.famBlock).every(t => !("famSitter" in t)));
  const edge = buildDay(DEFS, { rulesData: rules({ fb1: Object.assign({}, BLOCK, { at: "2:45 PM" }) }) }, { sitter: ["12:00 PM", "3:00 PM"] });
  ok("a block that starts 15 min before she leaves: History (2:45–3:15) IS flagged, Science (3:15–3:45) is not — each card is its own window", edge.tasks.filter(t => t.famItem === "hist").every(t => t.famSitter === true) && edge.tasks.filter(t => t.famItem === "sci").every(t => !("famSitter" in t)));
  const morn = buildDay(DEFS, { rulesData: rules({ fb1: BLOCK }) }, { sitter: ["9:00 AM", "11:00 AM"] });
  ok("a morning sitter → the 1:00 block is not flagged", morn.tasks.filter(t => t.famBlock).every(t => !("famSitter" in t)));
  const none = buildDay(DEFS, { rulesData: rules({ fb1: BLOCK }) });
  ok("no sitter → no famSitter key on any card", none.tasks.filter(t => t.famBlock).every(t => !("famSitter" in t)));
}

console.log("3b. sitter day, 'scheduler picks' Mom-led block → lands after sitterEnd (the packer's momStart; proven, not changed)");
{
  const AUTO = { name: "Fact Review", kids: ["andrew", "makenzie"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "auto", items: [{ key: "fr", name: "Fact Review", minutes: 20 }] };
  const AUTO_KIDS = Object.assign({}, AUTO, { momLeads: false });
  const R = buildDay(DEFS, { rulesData: rules({ fb1: AUTO }) }, { sitter: ["9:00 AM", "11:00 AM"] });
  const fam = R.tasks.filter(t => t.famBlock);
  ok("Mom-led auto block lands at/after 11:00 (sitter leaves), both kids together", fam.length === 2 && fam.every(t => toMin(t.time) >= toMin("11:00 AM")) && fam[0].time === fam[1].time && fam.every(t => t.famAuto), fam.map(t => t.time));
  const R0 = buildDay(DEFS, { rulesData: rules({ fb1: AUTO }) });
  ok("…with no sitter it lands in the morning (9:00)", R0.tasks.filter(t => t.famBlock).every(t => t.time === "9:00 AM"), R0.tasks.filter(t => t.famBlock).map(t => t.time));
  const RK = buildDay(DEFS, { rulesData: rules({ fb1: AUTO_KIDS }) }, { sitter: ["9:00 AM", "11:00 AM"] });
  ok("a kids-only auto block is unaffected by the sitter (9:00)", RK.tasks.filter(t => t.famBlock).every(t => t.time === "9:00 AM" && !("famSitter" in t)), RK.tasks.filter(t => t.famBlock).map(t => t.time));
}

console.log("3c. the Grid audit strip lists a flagged block");
{
  const T = famTasks().map(t => t.famBlock === "fb1" ? Object.assign({}, t, { famSitter: true }) : t);
  const E = famEnv({ rulesData: rules({ fb1: BLOCK, fb2: KIDS_ONLY }), tasks: T }, true);
  const a = E.pres.famPresAudit("taylor");
  ok("one line per flagged subject for the kid (History, Science), none for the kids-only card", a.length === 2 && a.every(f => f.type === "famsitter") && a.map(f => f.disp).join("|").indexOf("History") >= 0);
  const row = E.pres.famPresAuditRowHTML(a[0]);
  ok("the line names the subject, day and time and says it stays put", /History/.test(row) && new RegExp(cap(TODAY_DN)).test(row) && /1:00 PM/.test(row) && /sitter/.test(row) && /stays at its time/.test(row));
  ok("a past day is left out", famEnv({ rulesData: rules({ fb1: BLOCK }), tasks: T, today: "2099-01-01" }, true).pres.famPresAudit("taylor").length === 0);
  ok("no flag → no line", famEnv({ rulesData: rules({ fb1: BLOCK }), tasks: famTasks() }, true).pres.famPresAudit("taylor").length === 0);
  ok("the card says 'During sitter hours'", E.famRowHTML(T[0], false, "taylor").indexOf("During sitter hours") > 0 && E.famRowHTML(T[0], true, "taylor").indexOf("During sitter hours") < 0);
  ok("a kids-only card never says it, even stamped by hand", E.famRowHTML(Object.assign({}, T.find(t => t.famBlock === "fb2"), { famSitter: true }), false, "taylor").indexOf("sitter") < 0);
}

console.log("4. Mom present, no helper, no sitter → render and lay are byte-identical to the code without this block (and to main)");
{
  const T = famTasks();
  const PB = Object.assign({}, BLOCK, { items: [{ key: "hist", name: "History", minutes: 30, pts: 20, rate: "each" }, { key: "sci", name: "Science", minutes: 30, pts: 10 }] });
  const A = famEnv({ rulesData: rules({ fb1: PB, fb2: KIDS_ONLY }), tasks: T, mom: true }, false);
  const B = famEnv({ rulesData: rules({ fb1: PB, fb2: KIDS_ONLY }), tasks: T, mom: true }, true);
  let same = true;
  T.forEach(t => { ["taylor", "mom"].forEach(k => { if (A.famRowHTML(t, false, k) !== B.famRowHTML(t, false, k) || A.famRowHTML(t, true, k) !== B.famRowHTML(t, true, k)) same = false; }); });
  ok("famRowHTML: identical for every card, done or not, kid or Mom view", same);
  let diffs = 0, seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let trial = 0; trial < 400; trial++) {
    const defs = []; ROSTER.forEach(k => { const c = 3 + Math.floor(rnd() * 7); for (let i = 0; i < c; i++) defs.push({ kid: k, min: [10, 15, 20, 30, 45][Math.floor(rnd() * 5)], mom: rnd() < 0.3 ? "required" : "none", device: rnd() < 0.2 ? "computer" : "paper" }); });
    const env = { rulesData: rnd() < 0.5 ? rules({ fb1: BLOCK, fb2: KIDS_ONLY }) : rules({ fb1: Object.assign({}, BLOCK, { at: "auto" }) }) };
    if (JSON.stringify(buildDay(defs, env)) !== JSON.stringify(buildDay(defs, env, {}, runFamOnly))) diffs++;
  }
  ok("day build (400 randomized days, lunch + auto blocks): identical with and without the block", diffs === 0, diffs);
  if (base) {
    const runBase = makeDayRunner(base, true, false);
    let d2 = 0; seed = 5;
    for (let trial = 0; trial < 400; trial++) {
      const defs = []; ROSTER.forEach(k => { const c = 3 + Math.floor(rnd() * 7); for (let i = 0; i < c; i++) defs.push({ kid: k, min: [10, 15, 20, 30, 45][Math.floor(rnd() * 5)], mom: rnd() < 0.3 ? "required" : "none" }); });
      const env = { rulesData: rnd() < 0.5 ? rules({ fb1: BLOCK, fb2: KIDS_ONLY }) : rules({ fb1: Object.assign({}, BLOCK, { at: "auto" }) }) };
      if (JSON.stringify(buildDay(defs, env)) !== JSON.stringify(buildDay(defs, env, {}, runBase))) d2++;
    }
    ok("day build vs main's index.html: identical", d2 === 0, d2);
  } else console.log("  (main not available — set FAM_BASE to skip-proof the base comparison)");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
