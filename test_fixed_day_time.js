/*
 * Node tests — ⏰ SET TIME: today at <time> · <weekday this week> at <time> (FIXEDDAYTIME). Her ask 2026-10-28: "if there is
 * something in the schedule it would be nice if I could click it and say today I need it at this specific time, or I need to
 * send it to this specific time on this specific day this week … that particular schedule, that particular week, a fixed
 * time … if we follow that mechanism [Set time just for today]".
 *
 * Checks, against code sliced verbatim out of index.html (the DeWalt shape of test_settime_today is the fixture):
 *   0. shape: one block right after SPINSOFFTODAY_END (FAMRES and SPINSOFFTODAY are pinned ahead of it by their own tests); every hook one guarded line; SETTIME_TODAY's block untouched; the one
 *      write is stWrite's multi-path update (+ the ↩ undo's one targeted remove); no kid's name, no 🔀
 *   1. the pin: fdtPinned / fdtHeld / fdtWinOf read fixedAt for its date only; fxSplitDay (every packAround re-pack) pins the
 *      card at its time with its OWN duration and holds Mom when it is Mom-required; packAround lays the rest around it; a card
 *      with no pin → fxSplitDay byte-identical to the code with the feature removed
 *   2. dsRetime (a late day start) holds a pinned card like a class and shifts the others
 *   3. the living-day lay (mlQueueLay) holds a pinned card today; the kid's other cards step around it; a Mom-required one
 *      holds Mom there (another kid's Mom block steps over it); no pin → identical lay
 *   4. the school-end guard (seGuardWeek + seGuardCtx) treats a pinned card as fixed and slides the kid's stacked card
 *   5. the ⏰: Mom's lens, any open kid card this week; a family / class card on another day opens SETTIME's sheet for THAT
 *      day; today's family / class card draws nothing here (SETTIME's own ⏰); kids, done, sent, read-only, mirrors → nothing
 *   6. today at <time> (the card's own day): ONE update = fixedAt {date,at,was} + time; no day, no move record; the week's
 *      other cards untouched; the day chips are this week's days from today on (a day-bound card: its own day only)
 *   7. <weekday> at <time>: + day + MOVETODAY's record shape (setTime:true, fromDays []); that day's stacked card slides in the
 *      SAME update; the old day's other cards and the other days untouched; next week: the pin means nothing
 *   8. Back to normal: the pin goes; a moved card goes back to its own day and time; a same-day pin gets its old time back
 *   9. collisions (class · lunch · family block) listed with keep / move-it-that-day; "move" writes that thing's own leaf
 *  10. a past time on today asks "did you already do it then?" — No writes nothing; Yes pins + checks the card off at that
 *      time (stTsAt's stamp)
 *  11. ?dryrun=1: the sheet works, memory only, nothing written; a kid's device: nothing opens, nothing writes
 *  12. lessons stay in order (an earlier open lesson must stay ahead, a later one behind — mvtPlan's wording)
 *  13. the dialog's ↩ Undo move drops the pin too (undoMomMove → mvtUndo → fdtOnUndo)
 *  14. SETTIME_TODAY's own writer takes any date (what the ⏰ on another day's family / class card opens): the leaf is that
 *      day's, the other days and next week unchanged
 *
 *   run:  node test_fixed_day_time.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

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
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

const toMin = (t) => {
  if (t == null) return NaN;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mi;
};
const fromMin = (v) => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
const fbArr = (v) => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; };
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ampmTo24 = (s) => { const m = toMin(s); return isNaN(m) ? "" : String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const to12h = (s) => { const p = String(s || "").split(":"); if (p.length !== 2) return s; return fromMin((+p[0]) * 60 + (+p[1])); };
const taskDevice = (t) => t.device || "paper";
const gwDeviceCaps = () => ({ screen: 2, computer: 1, ipadLucy: 1 });
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];

const FAM = slice("// FAMBLOCK_START", "// FAMBLOCK_END");
const ATT = slice("// FAMATTEND_START", "// FAMATTEND_END");
const DS = slice("// FAMDAYSTART_START", "// FAMDAYSTART_END");
const ST = slice("// SETTIME_TODAY_START", "// SETTIME_TODAY_END");
const FDT = slice("// FIXEDDAYTIME_START", "// FIXEDDAYTIME_END");
const MVT = slice("// MOVETODAY_START", "// MOVETODAY_END");
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");
const CLASSES = [extractFn("fxIsClass"), extractFn("fxDateList"), extractFn("fxRunsOn"), extractFn("fxWindow"), extractFn("fxLaneOf"), extractFn("fxWindowsFor"), extractFn("fxSplitDay"), extractFn("fxCtxWithClasses")].join("\n");
const PACK = [extractFn("packDay"), extractFn("packAround")].join("\n");
const GUARD = [extractFn("seGuardWeek"), extractFn("seGuardCtx"), extractFn("_lessonPos"), extractFn("taskLessonRef"), extractFn("undoMomMove")].join("\n");
const BASE = src.replace(FDT, "");   // the file with the feature taken out

// ── the fixture: the DeWalt shape (test_settime_today) in the week of Mon 2026-10-26; today = Wednesday 10/28 ──
const SD = { defaultStart: "9:00 AM", defaultEnd: "4:15 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const ID = "fbmusz3l9q";
const BLOCK = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch",
  items: [{ key: "hist", name: "History", minutes: 30, pts: 20 }, { key: "sci", name: "Science", minutes: 30, pts: 20 }, { key: "ra", name: "Read Aloud", minutes: 20 }] };
const SEQ = [], LIDS = []; for (let i = 1; i <= 20; i++) { SEQ.push("Lesson " + i); LIDS.push("L" + String(i).padStart(4, "0")); }
const SUBJECTS = { andrew: { speech: { display: "Speech", fixedTime: "10:00 AM", minutes: 45, device: "computer", allowedDays: ["Thu"], mom: "none" }, math: { display: "Math", minutes: 30, lessonSeq: SEQ, lessonIds: LIDS }, read: { display: "Reading", minutes: 30 }, morning_nb: { display: "Morning Notebook", minutes: 15 } },
                   taylor: { latin: { display: "Latin", minutes: 20 } } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const rules = (blocks, sd) => ({ schoolDay: Object.assign({}, SD, sd || {}), familyBlocks: clone(blocks || {}) });
const WEEK = { monday: "2026-10-26", tuesday: "2026-10-27", wednesday: "2026-10-28", thursday: "2026-10-29", friday: "2026-10-30" };
const NEXT = { monday: "2026-11-02", tuesday: "2026-11-03", wednesday: "2026-11-04", thursday: "2026-11-05", friday: "2026-11-06" };
const TODAY = "2026-10-28";
const lesson = (n, day, time, x) => Object.assign({ id: "andrew_math_L" + String(n).padStart(4, "0"), who: "andrew", subjectKey: "math", day, time, dur: 30, mom: "required", title: "Math — Lesson " + n, lid: "L" + String(n).padStart(4, "0") }, x || {});
const card = (id, who, sk, day, time, dur, x) => Object.assign({ id, who, subjectKey: sk, day, time, dur: dur || 30, mom: "none", title: (SUBJECTS[who] && SUBJECTS[who][sk] && SUBJECTS[who][sk].display) || sk }, x || {});
// Andrew's week: notebook + reading + a math lesson each day; Taylor has Latin; Thursday has his Speech class 10:00–10:45
function week() {
  const T = [];
  ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((d, i) => {
    T.push(card("nb_" + d, "andrew", "morning_nb", d, "9:00 AM", 15, { title: "Morning Notebook" }));
    T.push(card("read_" + d, "andrew", "read", d, "9:15 AM", 30));
    T.push(lesson(i + 1, d, "11:00 AM"));
    T.push(card("latin_" + d, "taylor", "latin", d, "9:00 AM", 20));
  });
  T.push(card("speech_thu", "andrew", "speech", "thursday", "10:00 AM", 45, { device: "computer" }));
  return T;
}

// ── an environment with the REAL helpers + both blocks on stubs ──
function env(E) {
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "esc", "ampmTo24", "to12h", "ROSTER", "taskDevice", "gwDeviceCaps", "E", `
    var rulesData=E.rulesData||{schoolDay:{}}, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, claimed=E.claimed||{}, histState={}, WK="week1", currData=E.currData||{subjects:{}};
    var momMoves=E.momMoves||{}, rulesOpen={}, KID_COLOR={}, DAYS_ALL=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], blockouts={}, SITTER_NAME="Maggie", _todayDay=E.todayDay||"wednesday", lastTasksWrite=0, DAY_DT={}, paceData={subjects:{}};
    var writes=[], toasts=[], renders=0, cascades=0, banked=[], hist={}, dom={}, saved=[];
    var db=E.db===false?null:{ref:function(p){ return {set:function(v){ writes.push(["set",p,v]); },remove:function(){ writes.push(["remove",p]); },update:function(o){ writes.push(["update",p||"",o]); },
      transaction:function(fn,cb){ const r=fn(null); cb(null,r!==undefined); }}; }};
    function _dryRun(){ return !!E.dry; } function momHere(){ return E.mom!==false; } function momHereCards(){ return E.mom!==false&&!E.kidsTab; }
    function renderAll(){ renders++; } function schedCascade(){ cascades++; } function dbg(){} function sv(k,v){ saved.push(k); } function ld(){ return {}; } function closeDlg(){}
    function gwShowToast(m){ toasts.push(m); } function nowTs(){ return "10:40 AM Oct 28"; }
    function smapIsKidOff(k,ds){ return !!((E.kidOff||{})[k+"|"+ds]); } function schedOvKidOff(){ return false; } function coopTimedEndMin(){ return 0; }
    function gwGetSubjects(k){ return (currData.subjects||{})[k]||{}; }
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function calDateForWeekDay(dn){ return (E.dayISO||{})[dn]||null; } function calToday(){ return E.today||"${TODAY}"; }
    function _pushDateStr(dn){ return (E.dayISO||{})[dn]||null; }
    function effectiveDay(t){ const m=momMoves[t.id]; if(m&&(m.mode==="skip"||m.mode==="drop")) return m.fromDays[0]; return (m&&m.mode==="push"&&m.toDay)||t.day; }
    function _dismissed(t){ const m=momMoves[t.id]; return !!(m&&(m.mode==="skip"||m.mode==="drop")); }
    function subjNoCarry(t){ return !!(t&&(t.subjectKey==="reflex"||t.noCarry)); }
    function onecalMom(){ return E.mom!==false; }
    function _mlNowMin(){ return E.nowMin!=null?E.nowMin:(10*60+40); }
    function gwRules(){ return {lunchStart:toMin(rulesData.schoolDay.lunchStart||"12:00 PM"),lunchEnd:toMin(rulesData.schoolDay.lunchEnd||"1:00 PM")}; }
    function planBacked(){ return true; } function planPace(){ return {score:0}; } function _efLane(t){ return (t.device==="computer")?"computer":null; } function _efLaneCap(){ return 1; }
    function savePaceSubject(){}
    function bankDirect(kid,pts,note){ banked.push([kid,pts,note]); return "b"+banked.length; } function rlogAppend(){}
    function finalizeDone(id,ts,score){ if(E.refuseDone&&E.refuseDone[id]) return false; checked[id]=ts; hist[id]={ts:ts,score:score||null}; return true; }
    function mntCanX(){ return false; }
    var document={getElementById:function(id){ return dom[id]||null; },createElement:function(){ const el={style:{},innerHTML:"",remove:function(){ delete dom[el.id]; }}; return el; },body:{appendChild:function(el){ dom[el.id]=el; }}};
    ${FX_DOW_SRC}
    ${CLASSES}
    ${PACK}
    ${GUARD}
    ${extractFn("_parseCheckTs")}
    ${extractFn("dsDoneAtTime")}
    ${extractFn("_famChip")}
    ${FAM}
    ${ATT}
    ${DS}
    ${ST}
    ${MVT}
    ${E.noFdt ? "" : FDT}
    if(typeof stNowMin==="function"&&E.nowMin!=null) stNowMin=function(){ return E.nowMin; };
    const X={famLayout,famDayCards,famStartFor,famDefs,fxWindow,fxWindowsFor,fxSplitDay,fxCtxWithClasses,packAround,seGuardWeek,seGuardCtx,undoMomMove,
      sttOpen,stMove,stSetTime,stClear,stClearAt,stTsAt,
      writes:writes,toasts:toasts,banked:banked,hist:hist,checked:checked,weekData:weekData,saved:saved,renders:function(){ return renders; },cascades:function(){ return cascades; },
      rd:function(){ return rulesData; },cd:function(){ return currData; },mm:function(){ return momMoves; },dom:dom,T:function(id){ return weekData.tasks.find(function(t){ return t.id===id; }); },
      stState:function(){ return stState; }};
    if(typeof fdtOpen==="function") Object.assign(X,{fdtIsoOf,fdtPinned,fdtHeld,fdtWinOf,fdtRec,fdtOrig,fdtDays,fdtKind,fdtClockHTML,fdtOpen,fdtClose,fdtPick,fdtSetTime,fdtClashTime,fdtClashMove,fdtClashes,fdtOrderWhy,fdtMove,fdtPastYes,fdtPastNo,fdtCommit,fdtClear,fdtOnUndo,fdtRender,
      state:function(){ return fdtState; },sheet:function(){ const o=dom["fdt-ov"]; return o?o.innerHTML:""; },stSheet:function(){ const o=dom["st-ov"]; return o?o.innerHTML:""; }});
    return X;
  `);
  return f(toMin, fromMin, fbArr, cap, esc, ampmTo24, to12h, ROSTER, taskDevice, gwDeviceCaps, E);
}
const upd = (E) => E.writes.filter(w => w[0] === "update").map(w => w[2]);
const base = (o) => Object.assign({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: clone(SUBJECTS) }, dayISO: WEEK, tasks: week(), todayDay: "wednesday", nowMin: 10 * 60 + 40 }, o || {});
const overlapsOf = (tasks, who, day) => { const L = tasks.filter(t => t.who === who && t.day === day).map(t => [toMin(t.time), toMin(t.time) + (t.dur || 20), t.id]).sort((a, b) => a[0] - b[0]); for (let i = 1; i < L.length; i++) if (L[i][0] < L[i - 1][1]) return L[i - 1][2] + " × " + L[i][2]; return null; };
const snap = (tasks) => JSON.stringify(tasks.map(t => [t.id, t.day, t.time, t.fixedAt || null]));

console.log("0. shape and hooks");
{
  const a = src.indexOf("// SPINSOFFTODAY_END\n"), b = src.indexOf("// FIXEDDAYTIME_START");
  ok("the block sits right after SPINSOFFTODAY_END (after SETTIME_TODAY and every family block it reads; test_fam_resources and test_spins_off_today pin the two blocks before it)", a > 0 && b === a + "// SPINSOFFTODAY_END\n".length && src.indexOf("// SETTIME_TODAY_END") < a);
  ok("one START, one END", src.split("// FIXEDDAYTIME_START").length === 2 && src.split("// FIXEDDAYTIME_END").length === 2);
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
  ok("no kid's name in the block", !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb/i.test(FDT));
  ok("SETTIME_TODAY's block is untouched by this feature (no fdt / FIXEDDAYTIME inside it)", !/fdt|FIXEDDAYTIME/.test(ST));
  ok("writes go through stWrite's ONE multi-path update — the block's only own write is the ↩ undo's targeted remove of the pin", (FDT.match(/stWrite\(upd\)/g) || []).length === 2 && !/db\.ref\([^)]*\)\.(set|update)\(/.test(FDT) && (FDT.match(/db\.ref\(WK\+"\/tasks\/"\+id\+"\/fixedAt"\)\.remove\(\)/g) || []).length === 1 && /if\(db&&!_dryRun\(\)\)\{ try\{ db\.ref\(WK\+"\/tasks\/"\+id\+"\/fixedAt"\)\.remove\(\)/.test(FDT));
  ok("the paths are documented in the block", /week<N>\/tasks\/<id>\/fixedAt = \{date:"YYYY-MM-DD", at:"10:30 AM", was:/.test(FDT) && /week<N>\/momMoves\/<id>/.test(FDT) && /week<N>\/tasks\/<id>\/time/.test(FDT));
  const hooks = [
    ["taskCard: the ⏰ at the end of the badge slot", /\{ const _fdt=\(typeof fdtClockHTML==="function"\)\?fdtClockHTML\(t,done,claimedHere,readOnly,!!mb\):""; if\(_fdt\) mb\+=_fdt; \}/],
    ["fxSplitDay: a set-time card holds on its date", /\{ const _fw=\(typeof fdtWinOf==="function"\)\?fdtWinOf\(t,ds\):null; if\(_fw\)\{ t\.time=fromMin\(_fw\.s\); pinned\.push\(\{t:t,w:_fw,s:\{mom:t\.mom\|\|"none"\}\}\); return; \} \}/],
    ["dsRetime: the family-time shift leaves it out", /if\(!x\.famAuto&&\(x\.famBlock\|\|\(typeof fxIsClass==="function"&&fxIsClass\(_ks\[x\.subjectKey\]\)\)\|\|\(typeof fdtHeld==="function"&&fdtHeld\(x\)\)\)\) return;/],
    ["dsRetime: _isClass", /const _isClass=function\(t\)\{ return !!\(t&&t\.famBlock\)\|\|\(typeof fxIsClass==="function"&&fxIsClass\(_subs\[t\.subjectKey\]\)\)\|\|\(typeof fdtHeld==="function"&&fdtHeld\(t\)\); \};/],
    ["mlQueueLay: movable", /&&!\/lunch\/i\.test\(t\.title\|\|""\)&&!t\.famBlock&&!\(typeof fdtHeld==="function"&&fdtHeld\(t\)\)/],
    ["mlQueueLay: lunchOf (the kid's cards step over it)", /\(\(x\.famBlock\|\|\(typeof fdtHeld==="function"&&fdtHeld\(x\)\)\)&&!_mlFinished\(x\.id,x\)\)/],
    ["mlQueueLay: Mom's _blkIv (her other cards step over a Mom-required one)", /try\{ if\(typeof fdtHeld==="function"\) tasks\.forEach\(function\(x\)\{ if\(x&&isToday\(x\)&&_mr\(x\)&&fdtHeld\(x\)&&!_mlFinished\(x\.id,x\)\) _blkIv\.push\(\[toMin\(x\.time\),toMin\(x\.time\)\+\(x\.dur\|\|20\)\]\); \}\); \}catch\(e\)\{\}/],
    ["seGuardCtx.isClass", /\(typeof fxIsClass==="function"&&fxIsClass\(subj\(t\)\)\)\|\|\(typeof fdtHeld==="function"&&fdtHeld\(t\)\); \}catch\(e\)\{ return false; \} \},/],
    ["undoMomMove: the pin goes with the ↩", /if\(rec&&rec\.setTime&&typeof fdtOnUndo==="function"\) fdtOnUndo\(id\);/],
  ];
  hooks.forEach(([n, re]) => ok("hook: " + n, re.test(src)));
  ok("every hook is guarded (typeof) so the other suites' slices still run alone", (src.match(/typeof fdtClockHTML===|typeof fdtWinOf===|typeof fdtHeld===|typeof fdtOnUndo===/g) || []).length >= 9);
  const fns = (FDT.match(/^function (fdt\w+)\(/gm) || []).map(s => s.replace(/^function |\($/g, ""));
  ok("every fdt function is defined exactly once in the whole file (" + fns.length + ")", fns.length >= 20 && fns.every(n => src.split("function " + n + "(").length === 2), fns.filter(n => src.split("function " + n + "(").length !== 2));
  ok("SETTIME_TODAY's card hook line is byte-identical (its test's regex)", /mntXHTML\(t,done,claimedHere,readOnly,!!mb\)\)\|\|""\)\+\(\(typeof stClockHTML==="function"&&stClockHTML\(t,done,claimedHere,readOnly,!!mb\)\)\|\|""\)\+'<\/div>'/.test(src));
}

console.log("1. the pin — fixedAt on its date only; fxSplitDay / packAround hold it with its own duration");
{
  const E = env(base());
  const t = card("x", "andrew", "read", "thursday", "9:15 AM", 25, { fixedAt: { date: WEEK.thursday, at: "10:30 AM", was: "9:15 AM" } });
  ok("fdtPinned: its date → true; another date → false; no fixedAt → false", E.fdtPinned(t, WEEK.thursday) && !E.fdtPinned(t, WEEK.friday) && !E.fdtPinned(card("y", "andrew", "read", "thursday", "9:15 AM"), WEEK.thursday));
  ok("a bad pin (fixedAt.at 'soon' / a string / an array) → not pinned", !E.fdtPinned(Object.assign({}, t, { fixedAt: { date: WEEK.thursday, at: "soon" } }), WEEK.thursday) && !E.fdtPinned(Object.assign({}, t, { fixedAt: "10:30 AM" }), WEEK.thursday) && !E.fdtPinned(Object.assign({}, t, { fixedAt: ["10:30 AM"] }), WEEK.thursday));
  ok("fdtHeld: this plan week's Thursday → held; the same card in next week's plan (Thursday = 11/05) → not", E.fdtHeld(t) && !env(base({ dayISO: NEXT })).fdtHeld(t));
  ok("fdtWinOf: 10:30–10:55 (the CARD's 25 min, not the subject's 30)", JSON.stringify(E.fdtWinOf(t, WEEK.thursday)) === JSON.stringify({ s: toMin("10:30 AM"), e: toMin("10:55 AM") }) && E.fdtWinOf(t, WEEK.friday) === null);
  const P = E.fxSplitDay([t, card("r2", "andrew", "math", "thursday", "11:00 AM", 30), card("sp", "andrew", "speech", "thursday", "10:00 AM", 45)], WEEK.thursday, "thursday");
  ok("fxSplitDay pins the set-time card at 10:30 beside the class, the plain card packs", P.pinned.length === 2 && P.pinned[0].t.id === "x" && P.pinned[0].t.time === "10:30 AM" && P.pinned[0].w.e === toMin("10:55 AM") && P.pinned[1].t.id === "sp" && P.rest.length === 1 && P.rest[0].id === "r2");
  ok("…a Mom-required set-time card holds Mom too (s.mom carried for fxCtxWithClasses)", E.fxSplitDay([Object.assign({}, t, { mom: "required" })], WEEK.thursday, "thursday").pinned[0].s.mom === "required" && P.pinned[0].s.mom === "none");
  const ctx = E.fxCtxWithClasses({ busy: {}, momBusy: [], laneBusy: {} }, E.fxSplitDay([Object.assign({}, t, { mom: "required", device: "computer" })], WEEK.thursday, "thursday").pinned);
  ok("…its window is busy for the kid, Mom and the computer", JSON.stringify(ctx.busy.andrew) === JSON.stringify([{ s: toMin("10:30 AM"), e: toMin("10:55 AM") }]) && ctx.momBusy.length === 1 && ctx.laneBusy.computer.length === 1);
  ok("the pin means nothing on another date (next Thursday → rest)", E.fxSplitDay([t], NEXT.thursday, "thursday").rest.length === 1);
  // the real packer: Andrew's Thursday re-packed around the pinned card
  const day = [Object.assign({}, t), card("a1", "andrew", "math", "thursday", "9:00 AM", 30), card("a2", "andrew", "read", "thursday", "10:00 AM", 30), card("a3", "andrew", "latin", "thursday", "10:30 AM", 30)];
  const over = E.packAround([], day, { start: toMin("9:00 AM"), end: toMin("4:15 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM"), fxDate: WEEK.thursday, fxDay: "thursday" });
  const x = day.find(d => d.id === "x");
  ok("packAround (fxDate) keeps it at 10:30 and lays the other three around it, nothing overlapping", x.time === "10:30 AM" && over.length === 0 && overlapsOf(day, "andrew", "thursday") === null, day.map(d => d.id + "@" + d.time));
  const E0 = env(base({ noFdt: true }));
  const d1 = [card("a1", "andrew", "math", "thursday", "9:00 AM", 30), card("a2", "andrew", "read", "thursday", "10:00 AM", 30)];
  ok("no pin anywhere → fxSplitDay identical to the code with the feature removed", JSON.stringify(E.fxSplitDay(clone(d1), WEEK.thursday, "thursday")) === JSON.stringify(E0.fxSplitDay(clone(d1), WEEK.thursday, "thursday")));
}

console.log("2. dsRetime — a late day start holds a pinned card like a class");
{
  function dsEnv(o) {
    const ctx = { console, Object, Array, String, Number, Math, JSON, Date, RegExp, parseInt, isNaN, toMin, fromMin, _todayDay: "thursday", dayStarts: { thursday: o.starts || {} }, rulesData: { schoolDay: { defaultStart: "9:00 AM" } }, currData: { subjects: clone(SUBJECTS) }, checked: o.checked || {}, DAY_DT: {} };
    vm.createContext(ctx);
    vm.runInContext([extractFn("fxIsClass"), extractFn("dsRetime")].join("\n") + "\n" + (o.noFdt ? "" : [extractFn("fdtIsoOf"), extractFn("fdtPinned"), extractFn("fdtHeld")].join("\n") + "\nfunction _pushDateStr(dn){ return " + JSON.stringify(WEEK) + "[dn]||null; } function stDsOf(){ return null; }"), ctx);
    return (tasks) => vm.runInContext("dsRetime(" + JSON.stringify(tasks) + ")", ctx);
  }
  const T = [card("nb", "andrew", "morning_nb", "thursday", "9:00 AM", 15, { title: "Morning Notebook" }), card("rd", "andrew", "read", "thursday", "9:15 AM", 30), card("pin", "andrew", "math", "thursday", "10:30 AM", 30, { fixedAt: { date: WEEK.thursday, at: "10:30 AM", was: "11:00 AM" } }), card("sp", "andrew", "speech", "thursday", "10:00 AM", 45)];
  const R = dsEnv({ starts: { andrew: "9:40 AM" } })(T);
  const at = id => R.find(x => x.id === id).time;
  ok("a 9:40 start: the notebook and reading shift by 40 min", at("nb") === "9:40 AM" && at("rd") === "9:55 AM", [at("nb"), at("rd")]);
  ok("the pinned card stays at 10:30 — like the 10:00 class", at("pin") === "10:30 AM" && at("sp") === "10:00 AM");
  const T2 = T.map(x => { const y = Object.assign({}, x); delete y.fixedAt; return y; });
  ok("no pin → identical to the code with the feature's helpers absent (the typeof guard)", JSON.stringify(dsEnv({ starts: { andrew: "9:40 AM" } })(T2)) === JSON.stringify(dsEnv({ starts: { andrew: "9:40 AM" }, noFdt: true })(T2)));
}

console.log("3. the living-day lay (mlQueueLay) — a pinned card holds today; the kid's cards step around it; a Mom-required one holds Mom");
{
  const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
  const ML = src.slice(a, b);
  function run(o) {
    const tasks = o.tasks || [];
    const ctx = { console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null, checked: o.checked || {}, momMoves: {}, weekData: { tasks: tasks },
      getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null, momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
      cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1), esc: s => String(s == null ? "" : s),
      Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp };
    ctx._mlNowOverride = (typeof o.nowMin === "number") ? o.nowMin : 9 * 60;
    Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
    vm.createContext(ctx);
    vm.runInContext(extractFn("toMin") + "\n" + extractFn("fromMin") + "\n", ctx);
    vm.runInContext(ML, ctx);
    if (!o.noFdt) vm.runInContext([extractFn("fdtIsoOf"), extractFn("fdtPinned"), extractFn("fdtHeld")].join("\n") + "\nfunction _pushDateStr(dn){ return " + JSON.stringify(WEEK) + "[dn]||null; } function stDsOf(){ return null; }", ctx);
    vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || { cursor: 1, order: ["julian", "lucy", "lincoln", "ellis"] }) + ";", ctx);
    const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
    return { laid, at: id => laid.find(t => t.id === id).time };
  }
  const c = (id, who, time, dur, mom, x) => Object.assign({ id, who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: id }, x || {});
  const PIN = { date: WEEK.thursday, at: "10:30 AM", was: "2:00 PM" };
  // Lucy's own work at 10:40 (now): her card in hand ran over; the chain would push the next card to 10:40 — the pinned one holds at 10:30
  {
    const buf = c("buf", "lucy", "10:00 AM", 20), pin = c("pin", "lucy", "10:30 AM", 30, "none", { fixedAt: PIN }), nxt = c("nxt", "lucy", "10:20 AM", 20), later = c("later", "lucy", "11:00 AM", 20);
    const r = run({ tasks: [buf, pin, nxt, later], nowMin: 10 * 60 + 25 });
    ok("the pinned card holds at 10:30", r.at("pin") === "10:30 AM", r.laid.map(t => t.id + "@" + t.time));
    ok("the kid's next card steps over it (10:25 → 11:00, after the pinned window)", r.at("nxt") === "11:00 AM", r.at("nxt"));
    ok("the card after that follows", toMin(r.at("later")) >= toMin("11:20 AM"), r.at("later"));
  }
  // a Mom-required pinned card: Mom's block for another kid steps over it
  {
    const lb = c("lb", "lucy", "10:00 AM", 20), lp = c("lp", "lucy", "10:30 AM", 30, "required", { fixedAt: PIN });
    const nb = c("nb", "lincoln", "10:00 AM", 10), nm1 = c("nm1", "lincoln", "10:20 AM", 20, "required"), nm2 = c("nm2", "lincoln", "11:30 AM", 20, "required");
    const r = run({ tasks: [lb, lp, nb, nm1, nm2], momLoop: { cursor: 2, order: ["julian", "lucy", "lincoln", "ellis"] } });
    ok("the Mom-required pinned card holds at 10:30 (not chained into Mom's queue)", r.at("lp") === "10:30 AM", r.laid.map(t => t.id + "@" + t.time));
    ok("Lincoln's Mom block starts after his buffer (10:10) and his second Mom card steps over Lucy's pinned window (10:30–11:00 → 11:00)", r.at("nm1") === "10:10 AM" && r.at("nm2") === "11:00 AM", [r.at("nm1"), r.at("nm2")]);
  }
  // no pin → the lay is identical with the feature's helpers absent
  {
    const T = [c("buf", "lucy", "10:00 AM", 20), c("m1", "lucy", "10:30 AM", 30, "required"), c("nxt", "lucy", "10:20 AM", 20), c("nb", "lincoln", "10:00 AM", 20), c("nm1", "lincoln", "10:20 AM", 20, "required")];
    ok("no pin → identical lay with the helpers absent (typeof guards)", JSON.stringify(run({ tasks: clone(T) }).laid) === JSON.stringify(run({ tasks: clone(T), noFdt: true }).laid));
  }
}

console.log("4. the school-end guard — a pinned card is fixed; the kid's stacked card slides around it");
{
  const E = env(base());
  E.T("read_thursday").fixedAt = { date: WEEK.thursday, at: "11:00 AM", was: "9:15 AM" }; E.T("read_thursday").time = "11:00 AM";   // stacked on Lesson 4 (11:00)
  const se = E.seGuardWeek(E.weekData.tasks, E.seGuardCtx({ kids: ["andrew"], nowMin: 10 * 60 + 40 }));
  ok("seGuardCtx.isClass says the pinned card is fixed", E.seGuardCtx({}).isClass(E.T("read_thursday")) === true && E.seGuardCtx({}).isClass(E.T("read_friday")) === false);
  ok("the pinned card keeps 11:00; the stacked lesson slid; nothing overlaps on Thursday", E.T("read_thursday").time === "11:00 AM" && se.retimed.indexOf("read_thursday") < 0 && se.retimed.indexOf("andrew_math_L0004") >= 0 && E.T("andrew_math_L0004").time !== "11:00 AM" && overlapsOf(E.weekData.tasks, "andrew", "thursday") === null, [se.retimed, E.weekData.tasks.filter(t => t.who === "andrew" && t.day === "thursday").map(t => t.id + "@" + t.time)]);
}

console.log("5. the ⏰ — Mom's lens, open kid cards any day this week; a family / class card on another day opens SETTIME's sheet for that day");
{
  const tasks = week().concat([{ id: "wednesday_hist_andrew", who: "andrew", day: "wednesday", time: "1:00 PM", dur: 30, famBlock: ID, famItem: "hist", title: "🏡 History" }, { id: "thursday_hist_andrew", who: "andrew", day: "thursday", time: "1:00 PM", dur: 30, famBlock: ID, famItem: "hist", title: "🏡 History" }, card("lunch_w", "andrew", "lunch", "wednesday", "12:00 PM", 60, { title: "🍽 Lunch" }), card("c_mirror_c", "andrew", "read", "wednesday", "9:15 AM", 30), card("over", "andrew", "read", "wednesday", "9:15 AM", 30, { _eowOverflow: true })]);
  const E = env(base({ tasks }));
  const H = (id, d, c, r, b) => E.fdtClockHTML(E.T(id), !!d, !!c, !!r, !!b);
  ok("today's lesson card → the ⏰ (fdtOpen)", /fdt-clock/.test(H("read_wednesday")) && /fdtOpen\('read_wednesday'\)/.test(H("read_wednesday")));
  ok("tomorrow's and Friday's cards too; Monday's (past) card is still a card of this week → its chips start today, so the ⏰ draws", /fdtOpen\('read_thursday'\)/.test(H("read_thursday")) && /fdtOpen\('read_friday'\)/.test(H("read_friday")) && /fdtOpen\('read_monday'\)/.test(H("read_monday")));
  ok("same spot and size as the ✗ (20px; margin-left auto with nothing beside it, 4px beside a badge)", /width:20px;height:20px/.test(H("read_wednesday")) && /margin-left:auto/.test(H("read_wednesday")) && /margin-left:4px/.test(H("read_wednesday", 0, 0, 0, 1)));
  ok("a family card TODAY → nothing here (SETTIME_TODAY's own ⏰ draws there)", H("wednesday_hist_andrew") === "");
  ok("a family card on Thursday → SETTIME's sheet for Thursday", /sttOpen\('fam','fbmusz3l9q','','2026-10-29'\)/.test(H("thursday_hist_andrew")));
  ok("the class card on Thursday → SETTIME's sheet for Thursday (fx, that kid + subject)", /sttOpen\('fx','andrew','speech','2026-10-29'\)/.test(H("speech_thu")));
  ok("a done / sent-to-Mom / read-only card → nothing", H("read_wednesday", 1) === "" && H("read_wednesday", 0, 1) === "" && H("read_wednesday", 0, 0, 1) === "");
  ok("a carry mirror (_c), an overflow card, lunch → nothing", H("c_mirror_c") === "" && H("over") === "" && H("lunch_w") === "");
  E.mm()["read_friday"] = { mode: "push", toDay: "friday", fromDays: ["thursday"], ts: "x" };
  ok("a card Mom pushed / dismissed with the other buttons → nothing (that button's ↩ first)", H("read_friday") === "");
  E.mm()["read_thursday"] = { mode: "push", toDay: "thursday", fromDays: [], pulledFrom: "wednesday", fromTime: "9:15 AM", setTime: true, ts: "x" };
  ok("a card this sheet moved → the ⏰, highlighted", /fdtOpen\('read_thursday'\)/.test(H("read_thursday")) && /#7c3aed/.test(H("read_thursday")));
  const K = env(base({ tasks, mom: false })), KT = env(base({ tasks, kidsTab: true }));
  ok("a kid's device → nothing, on every card; Mom on the Kids tab → nothing", tasks.every(t => K.fdtClockHTML(t, false, false, false, false) === "") && tasks.every(t => KT.fdtClockHTML(t, false, false, false, false) === ""));
  ok("the taskCard hook adds it to the badge slot only when it draws (a family card today keeps mb byte-identical)", /if\(_fdt\) mb\+=_fdt;/.test(src));
}

console.log("6. today at <time> — the card's own day: ONE update, the pin + the time, nothing else");
{
  const E = env(base());
  E.fdtOpen("read_wednesday");
  const st = E.state();
  ok("the sheet opens on today with the card's own time", st && st.dn === "wednesday" && st.iso === TODAY && st.time === "9:15 AM" && st.step === "pick");
  ok("the day chips: Today · Thu · Fri (Mon / Tue are past)", (E.sheet().match(/fdtPick\('(\w+)'\)/g) || []).map(s => s.slice(9, -2)).join() === "wednesday,thursday,friday" && /Today/.test(E.sheet()) && />Thu</.test(E.sheet()));
  ok("the sheet names the card and its usual day/time", /⏰ Andrew — Reading/.test(E.sheet()) && /Today only/.test(E.sheet()) && /usually Wed 9:15 AM/.test(E.sheet()) && !/Back to normal/.test(E.sheet()));
  E.fdtSetTime("15:00"); E.fdtMove();   // 3:00 PM: clear of lunch and the 1:00–2:20 family block
  const U = upd(E);
  ok("ONE multi-path update at the root", U.length === 1 && E.writes.length === 1 && E.writes[0][1] === "", E.writes);
  ok("…= the pin {date, at, was} and the time", U[0] && JSON.stringify(U[0]["week1/tasks/read_wednesday/fixedAt"]) === JSON.stringify({ date: TODAY, at: "3:00 PM", was: "9:15 AM" }) && U[0]["week1/tasks/read_wednesday/time"] === "3:00 PM", U[0]);
  ok("…no day, no move record (its own day)", U[0] && !("week1/tasks/read_wednesday/day" in U[0]) && !Object.keys(U[0]).some(k => /momMoves/.test(k)) && !E.mm()["read_wednesday"]);
  ok("…no other card's path (the day has room — nothing to slide)", U[0] && Object.keys(U[0]).every(k => k.indexOf("week1/tasks/read_wednesday/") === 0), Object.keys(U[0] || {}));
  ok("this device's copy follows; the sheet closed; the day re-lays and repaints", E.T("read_wednesday").time === "3:00 PM" && E.T("read_wednesday").fixedAt.at === "3:00 PM" && E.state() === null && E.sheet() === "" && E.cascades() === 1 && E.renders() === 1 && E.saved.indexOf("week1_tasks") >= 0);
  ok("the toast", /⏰ Andrew — Reading at 3:00 PM today/.test(E.toasts[0] || ""), E.toasts);
  ok("the week's other cards unchanged", E.weekData.tasks.filter(t => t.id !== "read_wednesday").every(t => !t.fixedAt) && E.T("read_thursday").time === "9:15 AM" && E.T("read_monday").time === "9:15 AM");
  ok("fdtHeld now holds it (today's lay treats it like a class)", E.fdtHeld(E.T("read_wednesday")) === true);
  // re-open: pinned → Back to normal offered, "set:" shown
  E.fdtOpen("read_wednesday");
  ok("re-opened: set: Wed 3:00 PM · Back to normal offered · usual time still 9:15", /set: Wed 3:00 PM/.test(E.sheet()) && /Back to normal/.test(E.sheet()) && /usually Wed 9:15 AM/.test(E.sheet()));
  E.fdtClose();
  // a day-bound card: its own day only
  E.fdtOpen("nb_thursday");
  ok("a notebook (day-bound) gets a time on its own day only (one chip: Thu)", (E.sheet().match(/fdtPick\('(\w+)'\)/g) || []).map(s => s.slice(9, -2)).join() === "thursday");
  E.fdtClose();
  const E2 = env(base({ kidOff: { "andrew|2026-10-30": true } }));
  E2.fdtOpen("read_wednesday");
  ok("a day the kid is off (Friday) is not offered", (E2.sheet().match(/fdtPick\('(\w+)'\)/g) || []).map(s => s.slice(9, -2)).join() === "wednesday,thursday");
  ok("a card on a past day whose day-bound work is missed → no chips → no ⏰ (fdtDays empty)", E2.fdtDays(E2.T("nb_monday")).length === 0 && E2.fdtKind(E2.T("nb_monday"), false, false, false) === "");
}

console.log("7. <weekday> at <time> — the card leaves its day, lands fixed on the new one; that day's stacked card slides in the same update");
{
  const E = env(base());
  E.fdtOpen("read_wednesday"); E.fdtPick("thursday");
  ok("Thursday picked: the sheet says Thu Oct 29 only", E.state().dn === "thursday" && E.state().iso === WEEK.thursday && /Thu, Oct 29 only/.test(E.sheet()));
  E.fdtSetTime("09:15"); E.fdtMove();
  const U = upd(E)[0] || {};
  ok("ONE update: day + time + the pin on Thursday's date", E.writes.length === 1 && U["week1/tasks/read_wednesday/day"] === "thursday" && U["week1/tasks/read_wednesday/time"] === "9:15 AM" && JSON.stringify(U["week1/tasks/read_wednesday/fixedAt"]) === JSON.stringify({ date: WEEK.thursday, at: "9:15 AM", was: "9:15 AM" }), U);
  const rec = U["week1/momMoves/read_wednesday"];
  ok("…and MOVETODAY's record shape: push to Thursday, fromDays EMPTY, pulledFrom Wednesday 9:15, setTime", rec && rec.mode === "push" && rec.toDay === "thursday" && Array.isArray(rec.fromDays) && rec.fromDays.length === 0 && rec.pulledFrom === "wednesday" && rec.fromTime === "9:15 AM" && rec.setTime === true && rec.ts === "10:40 AM Oct 28", rec);
  ok("Thursday's own Reading (9:15) slid out of the way in the SAME update; nothing overlaps there", U["week1/tasks/read_thursday/time"] && U["week1/tasks/read_thursday/time"] !== "9:15 AM" && overlapsOf(E.weekData.tasks, "andrew", "thursday") === null, [U["week1/tasks/read_thursday/time"], E.weekData.tasks.filter(t => t.who === "andrew" && t.day === "thursday").map(t => t.id + "@" + t.time)]);
  ok("the moved card is where Mom put it and held there", E.T("read_wednesday").day === "thursday" && E.T("read_wednesday").time === "9:15 AM" && E.fdtHeld(E.T("read_wednesday")));
  ok("Wednesday's other cards, Monday's, Friday's: untouched (no path of theirs in the update)", !Object.keys(U).some(k => /\/(nb_|latin_|read_monday|read_friday|read_wednesday\/x)/.test(k) || /_wednesday\/time|_friday\/|_monday\//.test(k.replace("read_wednesday", ""))) && E.T("nb_wednesday").time === "9:00 AM" && E.T("read_friday").time === "9:15 AM" && E.T("latin_thursday").time === "9:00 AM", Object.keys(U));
  ok("the toast says where from", /⏰ Andrew — Reading at 9:15 AM Thu, Oct 29 \(from Wed\)/.test(E.toasts[0] || ""), E.toasts);
  ok("the ↩ in the dialog would read 'Undo move (back to Wednesday)' — the same record MOVETODAY writes (pulledFrom)", E.mm()["read_wednesday"].pulledFrom === "wednesday");
  // next week: the pin is for its date only
  const N = env(base({ dayISO: NEXT, tasks: clone(E.weekData.tasks), momMoves: clone(E.mm()) }));
  ok("next week's Thursday (11/05): the pin means nothing — fxSplitDay packs it, fdtHeld false", N.fxSplitDay([N.T("read_wednesday")], NEXT.thursday, "thursday").rest.length === 1 && !N.fdtHeld(N.T("read_wednesday")));
  // re-set on the same moved card: Friday 1:30 → the record keeps the ORIGINAL day/time
  E.fdtOpen("read_wednesday");
  ok("re-opened on the moved card: usually Wed 9:15 AM · set: Thu 9:15 AM", /usually Wed 9:15 AM/.test(E.sheet()) && /set: Thu 9:15 AM/.test(E.sheet()));
  E.fdtPick("friday"); E.fdtSetTime("15:00"); E.fdtMove();
  const U2 = upd(E)[1] || {}, rec2 = U2["week1/momMoves/read_wednesday"];
  ok("moved again to Friday 3:00: the record still says from Wednesday 9:15; the pin is Friday's; was = 9:15", rec2 && rec2.toDay === "friday" && rec2.pulledFrom === "wednesday" && rec2.fromTime === "9:15 AM" && U2["week1/tasks/read_wednesday/day"] === "friday" && U2["week1/tasks/read_wednesday/fixedAt"].date === WEEK.friday && U2["week1/tasks/read_wednesday/fixedAt"].was === "9:15 AM", [rec2, U2["week1/tasks/read_wednesday/fixedAt"]]);
  // back to its own day at a new time: the record goes, the pin stays
  E.fdtOpen("read_wednesday"); E.fdtPick("wednesday"); E.fdtSetTime("15:00"); E.fdtMove();
  const U3 = upd(E)[2] || {};
  ok("back on Wednesday at 3:00: day written back, the move record removed (null), the pin is Wednesday's", U3["week1/tasks/read_wednesday/day"] === "wednesday" && U3["week1/momMoves/read_wednesday"] === null && U3["week1/tasks/read_wednesday/fixedAt"].date === TODAY && !E.mm()["read_wednesday"] && E.T("read_wednesday").day === "wednesday", U3);
}

console.log("8. Back to normal — the pin goes; a moved card goes home; a same-day pin gets its old time back");
{
  const E = env(base());
  E.fdtOpen("read_wednesday"); E.fdtPick("thursday"); E.fdtSetTime("15:00"); E.fdtMove();
  E.fdtOpen("read_wednesday"); E.fdtClear();
  const U = upd(E)[1] || {};
  ok("the moved card: fixedAt null, day Wednesday, time 9:15, the move record null — one update", E.writes.length === 2 && U["week1/tasks/read_wednesday/fixedAt"] === null && U["week1/tasks/read_wednesday/day"] === "wednesday" && U["week1/tasks/read_wednesday/time"] === "9:15 AM" && U["week1/momMoves/read_wednesday"] === null, U);
  ok("this device's copy: home, unpinned, no record; toast", E.T("read_wednesday").day === "wednesday" && E.T("read_wednesday").time === "9:15 AM" && !E.T("read_wednesday").fixedAt && !E.mm()["read_wednesday"] && /back to its own day/.test(E.toasts[1] || ""), E.toasts);
  const E2 = env(base());
  E2.fdtOpen("read_wednesday"); E2.fdtSetTime("15:00"); E2.fdtMove();
  E2.fdtOpen("read_wednesday"); E2.fdtClear();
  const U2 = upd(E2)[1] || {};
  ok("a same-day pin: fixedAt null and the time it had before (9:15) back; no day, no record", U2["week1/tasks/read_wednesday/fixedAt"] === null && U2["week1/tasks/read_wednesday/time"] === "9:15 AM" && !("week1/tasks/read_wednesday/day" in U2) && !Object.keys(U2).some(k => /momMoves/.test(k)) && E2.T("read_wednesday").time === "9:15 AM" && /back to its usual time/.test(E2.toasts[1] || ""), U2);
}

console.log("9. collisions — a class, lunch, a family block: keep (work packs around both) or move it that day too");
{
  const E = env(base());
  // Thursday 10:30 runs into Speech 10:00–10:45
  E.fdtOpen("read_wednesday"); E.fdtPick("thursday"); E.fdtSetTime("10:30"); E.fdtMove();
  let st = E.state();
  ok("the class clash is listed, nothing written yet", st.step === "clash" && st.clashes.length === 1 && st.clashes[0].kind === "fx" && st.clashes[0].sk === "speech" && /Andrew — Speech/.test(E.sheet()) && /Keep its time — work packs around both/.test(E.sheet()) && /Move it this day/.test(E.sheet()) && E.writes.length === 0, st.clashes);
  E.fdtMove();   // keep
  let U = upd(E)[0] || {};
  ok("keep → only the card's own paths (+ the slide of the kid's stacked cards)", Object.keys(U).every(k => k.indexOf("week1/") === 0) && !Object.keys(U).some(k => /fixedTimeByDate/.test(k)), Object.keys(U));
  // move the class today too, to 11:00
  const E2 = env(base());
  E2.fdtOpen("read_wednesday"); E2.fdtPick("thursday"); E2.fdtSetTime("10:30"); E2.fdtMove();
  E2.fdtClashMove("fx|andrew|speech", true); E2.fdtClashTime("fx|andrew|speech", "11:00"); E2.fdtMove();
  U = upd(E2)[0] || {};
  ok("move it → the class's own leaf for that date rides the same update; the toast names it", U["curriculum/subjects/andrew/speech/fixedTimeByDate/2026-10-29"] === "11:00 AM" && E2.cd().subjects.andrew.speech.fixedTimeByDate["2026-10-29"] === "11:00 AM" && /Andrew — Speech → 11:00 AM/.test(E2.toasts[0] || ""), [Object.keys(U), E2.toasts]);
  ok("a changed time looks at the collisions again (the clash step is reset)", (() => { const E3 = env(base()); E3.fdtOpen("read_wednesday"); E3.fdtPick("thursday"); E3.fdtSetTime("10:30"); E3.fdtMove(); E3.fdtSetTime("14:30"); return E3.state().step === "pick" && E3.state().clashes.length === 0; })());
  // lunch (the rule 12:00–1:00) and the family block (lunch end 1:00 → 1:00–2:20)
  const E4 = env(base());
  E4.fdtOpen("read_wednesday"); E4.fdtPick("friday"); E4.fdtSetTime("12:45"); E4.fdtMove();
  st = E4.state();
  ok("12:45 Friday runs into lunch AND the family block (1:00–2:20)", st.step === "clash" && st.clashes.map(c => c.kind).join() === "lunch,fam", st.clashes.map(c => c.name + " " + fromMin(c.s) + "-" + fromMin(c.e)));
  E4.fdtClashMove("lunch", true); E4.fdtClashTime("lunch", "11:30"); E4.fdtClashMove("fam|" + ID, true); E4.fdtClashTime("fam|" + ID, "14:30"); E4.fdtMove();
  U = upd(E4)[0] || {};
  ok("move both → lunchByDate/<iso>/all {11:30–12:30} and atByDate/<iso> 2:30 PM in the same update", JSON.stringify(U["config/rules/schoolDay/lunchByDate/2026-10-30/all"]) === JSON.stringify({ start: "11:30 AM", end: "12:30 PM" }) && U["config/rules/familyBlocks/" + ID + "/atByDate/2026-10-30"] === "2:30 PM" && E4.rd().schoolDay.lunchByDate["2026-10-30"].all.start === "11:30 AM" && E4.rd().familyBlocks[ID].atByDate["2026-10-30"] === "2:30 PM", U);
  ok("…Thursday's family time still lays at 1:00 (the leaf is Friday's)", fromMin(E4.famLayout(E4.famDefs()[ID], "thursday", WEEK.thursday)[0].s) === "1:00 PM" && fromMin(E4.famLayout(E4.famDefs()[ID], "friday", WEEK.friday)[0].s) === "2:30 PM");
}

console.log("10. a past time on today asks 'did you already do it then?'");
{
  const E = env(base({ nowMin: 10 * 60 + 40 }));
  E.fdtOpen("read_wednesday"); E.fdtSetTime("09:00"); E.fdtMove();
  ok("9:00 AM at 10:40 → the question, nothing written", E.state().step === "past" && /9:00 AM is already past\. Did you already do it then\?/.test(E.sheet()) && /Yes — we did it at 9:00 AM/.test(E.sheet()) && E.writes.length === 0);
  E.fdtPastNo();
  ok("No → back to the picker, nothing written", E.state().step === "pick" && E.writes.length === 0 && /Starts at/.test(E.sheet()));
  E.fdtMove(); E.fdtPastYes();
  const U = upd(E)[0] || {};
  ok("Yes → the pin + the time written, and the card checked off at 9:00 AM (stTsAt's stamp)", U["week1/tasks/read_wednesday/time"] === "9:00 AM" && U["week1/tasks/read_wednesday/fixedAt"].at === "9:00 AM" && E.checked["read_wednesday"] && /0?9:00 AM Oct 28/.test(E.checked["read_wednesday"]) && E.hist["read_wednesday"].score === null, [U, E.checked]);
  ok("…the toast says so; the sheet closed", /✓ checked off then/.test(E.toasts[0] || "") && E.state() === null);
  const E2 = env(base({ nowMin: 10 * 60 + 40 }));
  E2.fdtOpen("read_wednesday"); E2.fdtPick("thursday"); E2.fdtSetTime("09:00"); E2.fdtMove();
  ok("a future day never asks (9:00 on Thursday → straight on)", E2.state() === null && E2.writes.length === 1 && !E2.checked["read_wednesday"]);
  const E3 = env(base({ nowMin: 10 * 60 + 40, refuseDone: { read_wednesday: true } }));
  E3.fdtOpen("read_wednesday"); E3.fdtSetTime("09:00"); E3.fdtMove(); E3.fdtPastYes();
  ok("a check-off the order guard refuses: the pin still lands, the toast says it was not checked off", upd(E3).length === 1 && !E3.checked["read_wednesday"] && /not checked off/.test(E3.toasts[0] || ""), E3.toasts);
}

console.log("11. dry run and a kid's device");
{
  const E = env(base({ dry: true }));
  E.fdtOpen("read_wednesday"); E.fdtPick("thursday"); E.fdtSetTime("09:15"); E.fdtMove();
  ok("?dryrun=1: the sheet works and this device's copy follows — nothing written", E.T("read_wednesday").day === "thursday" && E.T("read_wednesday").fixedAt && E.mm()["read_wednesday"] && E.writes.length === 0 && E.toasts.length === 1);
  E.fdtOpen("read_wednesday"); E.fdtClear();
  ok("…Back to normal in dry run: nothing written either", E.T("read_wednesday").day === "wednesday" && !E.T("read_wednesday").fixedAt && E.writes.length === 0);
  const K = env(base({ mom: false }));
  K.fdtOpen("read_wednesday");
  ok("not Mom: the sheet does not open; a stale Move / Back to normal write nothing", K.state() === null && K.sheet() === "" && (K.fdtCommit({ id: "read_wednesday", iso: TODAY, dn: "wednesday", clashes: [] }, toMin("2:00 PM")), K.fdtClear(), K.writes.length === 0 && !K.T("read_wednesday").fixedAt));
}

console.log("12. lessons stay in order");
{
  const E = env(base());
  E.fdtOpen("andrew_math_L0005"); E.fdtPick("wednesday"); E.fdtSetTime("15:00"); E.fdtMove();
  ok("Lesson 5 (Fri) to Wednesday while Lesson 4 is open on Thursday → refused, nothing written", /Move Lesson 4 first — lessons stay in order\./.test(E.toasts[0] || "") && E.writes.length === 0 && E.state() !== null, E.toasts);
  E.fdtClose();
  E.fdtOpen("andrew_math_L0004"); E.fdtPick("wednesday"); E.fdtSetTime("10:30"); E.fdtMove();
  ok("Lesson 4 (Thu) to Wednesday 10:30, BEFORE Wednesday's Lesson 3 at 11:00 → refused", /Move Lesson 3 first — lessons stay in order\./.test(E.toasts[1] || "") && E.writes.length === 0, E.toasts);
  E.fdtSetTime("15:00"); E.fdtMove();
  ok("…at 3:00 PM, after Lesson 3 → fine (Lesson 5 stays behind it on Friday)", E.writes.length === 1 && E.T("andrew_math_L0004").day === "wednesday" && E.T("andrew_math_L0004").time === "3:00 PM");
  E.fdtOpen("andrew_math_L0003"); E.fdtSetTime("15:30"); E.fdtMove();
  ok("Lesson 3 on its own day at 3:30, now BEHIND Lesson 4 (3:00 Wed) → refused with the other wording", /Lesson 4 is already ahead of it — lessons stay in order\./.test(E.toasts[3] || "") && E.writes.length === 1, E.toasts);
  E.fdtClose();
  const E2 = env(base({ checked: { andrew_math_L0004: "x" } }));
  E2.fdtOpen("andrew_math_L0005"); E2.fdtPick("wednesday"); E2.fdtSetTime("15:00"); E2.fdtMove();
  ok("with Lesson 4 done, Lesson 5 may come to Wednesday", E2.writes.length === 1 && E2.T("andrew_math_L0005").day === "wednesday");
  const E3 = env(base());
  E3.fdtOpen("read_wednesday"); E3.fdtPick("friday"); E3.fdtSetTime("09:00"); E3.fdtMove();
  ok("unsequenced work (Reading) is never refused", E3.writes.length === 1);
}

console.log("13. the dialog's ↩ Undo move drops the pin too");
{
  const E = env(base());
  E.fdtOpen("read_wednesday"); E.fdtPick("thursday"); E.fdtSetTime("09:15"); E.fdtMove();
  E.undoMomMove("read_wednesday");
  const t = E.T("read_wednesday");
  ok("mvtUndo put it back on Wednesday 9:15; the pin is gone; the record is gone", t.day === "wednesday" && t.time === "9:15 AM" && !t.fixedAt && !E.mm()["read_wednesday"]);
  ok("…the pin's removal is one targeted remove", E.writes.some(w => w[0] === "remove" && w[1] === "week1/tasks/read_wednesday/fixedAt"), E.writes.map(w => w[0] + " " + w[1]));
  ok("fdtOnUndo on a card without a pin writes nothing", (() => { const n = E.writes.length; E.fdtOnUndo("read_friday"); return E.writes.length === n; })());
}

console.log("14. SETTIME_TODAY's own writer takes any date — what the ⏰ on another day's family / class card opens");
{
  const E = env(base());
  E.sttOpen("fam", ID, "", WEEK.thursday);
  ok("the family sheet opens for Thursday (Thu, Oct 29 only)", E.stState() && E.stState().iso === WEEK.thursday && /Thu, Oct 29 only/.test(E.stSheet()));
  E.stSetTime("14:15"); E.stMove();
  const U = upd(E)[0] || {};
  ok("→ atByDate for Thursday only", U["config/rules/familyBlocks/" + ID + "/atByDate/2026-10-29"] === "2:15 PM" && Object.keys(U).length === 1, U);
  ok("Thursday lays at 2:15; Wednesday and Friday at 1:00; next Thursday at 1:00", fromMin(E.famStartFor(E.famDefs()[ID], "thursday", WEEK.thursday)) === "2:15 PM" && fromMin(E.famStartFor(E.famDefs()[ID], "wednesday", WEEK.wednesday)) === "1:00 PM" && fromMin(E.famStartFor(E.famDefs()[ID], "friday", WEEK.friday)) === "1:00 PM" && fromMin(E.famStartFor(E.famDefs()[ID], "thursday", NEXT.thursday)) === "1:00 PM");
  E.sttOpen("fx", "andrew", "speech", WEEK.thursday); E.stSetTime("13:00"); E.stMove();
  const U2 = upd(E)[1] || {};
  ok("the class: fixedTimeByDate for Thursday only; fxWindow Thursday 1:00–1:45, next Thursday 10:00", U2["curriculum/subjects/andrew/speech/fixedTimeByDate/2026-10-29"] === "1:00 PM" && fromMin(E.fxWindow(E.cd().subjects.andrew.speech, WEEK.thursday, "thursday").s) === "1:00 PM" && fromMin(E.fxWindow(E.cd().subjects.andrew.speech, NEXT.thursday, "thursday").s) === "10:00 AM", U2);
  E.stClearAt("fam", ID, "", WEEK.thursday);
  ok("Back to normal (the calendar row's button) removes Thursday's leaf", upd(E)[2] && upd(E)[2]["config/rules/familyBlocks/" + ID + "/atByDate/2026-10-29"] === null && fromMin(E.famStartFor(E.famDefs()[ID], "thursday", WEEK.thursday)) === "1:00 PM");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
