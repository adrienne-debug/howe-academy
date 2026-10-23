/*
 * Node tests — 🕰 FAMILY TIME: A DIFFERENT START ON CHOSEN DAYS (FAMDAYSTART). Sara's ask 2026-10-22, DeWalt:
 * Andrew's Speech is a fixed-time class, Mondays 1:00 PM for 30 min — the same minute Family Time starts after lunch.
 * The WHOLE block starts at 1:35 on Mondays only (block.atByDay = {Mon:"1:35 PM"}); every other day stays at lunch.
 *
 * Checks, against code sliced verbatim out of index.html (the DeWalt shape is the fixture):
 *   0. the block sits right after FAMPRESENCE_END; every hook is one line; the block writes only through famWrite
 *   1. famStartFor — THE resolver: the day's own time, else lunch end (per-day lunch override), else block.at, else NaN
 *   2. the layout + famDayCards: Monday 1:35 / 2:05 / 2:35 for all four kids, Tue–Fri 1:00 as before
 *   3. the REAL day build (class partition + family block + packer + the emit): Andrew's Speech 1:00–1:30 and his
 *      family cards no longer collide on Monday; Mom's window moves; Tuesday is byte-identical to a block with no override
 *   4. the window every re-timer reads (famWindowOf → fxSplitDay, the packAround re-pack behind dsRetime / the
 *      day-start shift / the school-end guard) re-pins a stale 1:00 card to 1:35; dsRetime never moves the pinned copies
 *   5. FAMBLOCKOUT reads the override (a 1:00–1:30 blockout no longer puts Andrew out); FAMPRESENCE's sitter stamp too
 *   6. celebrations sort the laid cards — the 1:35 block is "next" after a kid's own work
 *   7. an at:"auto" block with a Monday override: Monday PINNED at 1:35 (famDayCards), Tue–Fri still auto (famAutoUnits);
 *      famMinOn / famCellState / famWhenLabel / the preview follow
 *   8. the editor: "Different on some days" chips, the time field, "Mondays start 1:35 PM", the clash line
 *   9. writes: one leaf per day (config/rules/familyBlocks/<id>/atByDay/<Day>), removed per day; Mom only; dry run inert
 *  10. removing the override restores base; no atByDay → the lay is byte-identical to the code with FAMDAYSTART removed
 *  11. the Grid audit strip lists the clash on every member's Grid; nothing moves by itself
 *
 *   run:  node test_fam_daystart.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
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
const TG = slice("// FAMTOGETHER_START", "// FAMTOGETHER_END");
const BO = slice("// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END");
const PRES = slice("// FAMPRESENCE_START", "// FAMPRESENCE_END");
const DS = slice("// FAMDAYSTART_START", "// FAMDAYSTART_END");
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");
const CLASSES = [extractFn("fxIsClass"), extractFn("fxDateList"), extractFn("fxRunsOn"), extractFn("fxWindow"), extractFn("fxLaneOf")].join("\n");
// the same file with the feature taken out — the "base" every byte-identical check compares against
const BASE = src.replace(DS, "");

// ── the DeWalt fixture (2026-10-22) ──
const SD = { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const ID = "fbmusz3l9q";
const BLOCK = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch",
  items: [{ key: "hist", name: "History", minutes: 30 }, { key: "sci", name: "Science", minutes: 30 }, { key: "ra", name: "Read Aloud", minutes: 20 }] };
const MON = Object.assign({}, BLOCK, { atByDay: { Mon: "1:35 PM" } });
const SUBJECTS = { andrew: { speech: { display: "Speech", fixedTime: "1:00 PM", minutes: 30, device: "computer", allowedDays: ["Mon"], mom: "none" },
                            math: { display: "Math", minutes: 20 } },
                   taylor: { latin: { display: "Latin", minutes: 20 } } };
const rules = (blocks, sd) => ({ schoolDay: Object.assign({}, SD, sd || {}), familyBlocks: blocks });
const DAYS5 = ["monday", "tuesday", "wednesday", "thursday", "friday"];

// ── an environment with the REAL family helpers (+ the feature) on stubs ──
function famEnv(E, opts) {
  opts = opts || {};
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "esc", "ampmTo24", "to12h", "ROSTER", "E", `
    var rulesData=E.rulesData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState={}, WK="week1", currData=E.currData||{subjects:{}};
    var rulesOpen={}, KID_COLOR={}, DAYS_ALL=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], blockouts=E.blockouts||{}, SITTER_NAME="Maggie", _todayDay=E.todayDay||"monday";
    var writes=[], renders=0, db=E.db===false?null:{ref:function(p){ return {set:function(v){ writes.push([p,v]); },remove:function(){ writes.push([p,"REMOVE"]); }}; }};
    function _dryRun(){ return !!E.dry; } function momHere(){ return E.mom!==false; } function renderAll(){ renders++; } function dbg(){} function sv(){} function ld(){ return {}; }
    function smapIsKidOff(k,ds){ return !!(E.off&&E.off[k+"|"+ds]); } function coopTimedEndMin(k,ds){ return (E.coop&&E.coop[k+"|"+ds])||0; }
    function gwGetSubjects(k){ return (currData.subjects||{})[k]||{}; }
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function routineDateISO(d){ return (E.dayISO||{})[d]||null; } function cbTodayISO(){ return E.today||"2026-10-26"; }
    ${FX_DOW_SRC}
    ${CLASSES}
    ${extractFn("fxSplitDay")}
    ${FAM}
    ${opts.tg ? TG : ""}
    ${opts.bo ? BO : ""}
    ${opts.pres ? PRES : ""}
    ${opts.noDs ? "" : DS}
    const X={famLayout,famDayCards,famWindowOf,famAutoUnits,famStartMin,famIsAuto,famPreviewHTML,famBlockEditorHTML,famDefs,fxSplitDay,
      writes:writes,renders:function(){ return renders; },rd:function(){ return rulesData; }};
    if(typeof famStartFor==="function") Object.assign(X,{famStartFor,famAutoOn,famDsAt,famDsDays,famDsWords,famDsSet,famDsToggle,famDsClashes,famDsClashList,famDsEditorHTML,famDsAudit,famDsAuditRowHTML,famDsClassOn,open:function(){ return _famDsOpen; }});
    if(typeof famMinOn==="function") Object.assign(X,{famMinOn,famCellState,famWhenLabel,famGridStripHTML});
    if(typeof famBoState==="function") Object.assign(X,{famBoState});
    if(typeof famPresSitterStamp==="function") Object.assign(X,{famPresSitterStamp});
    return X;
  `);
  return f(toMin, fromMin, fbArr, cap, esc, ampmTo24, to12h, ROSTER, E);
}

console.log("0. shape and hooks");
{
  const a = src.indexOf("// FAMPRESENCE_END\n"), b = src.indexOf("// FAMDAYSTART_START");
  ok("the block sits right after FAMPRESENCE_END", a > 0 && b === a + "// FAMPRESENCE_END\n".length);
  ok("one START, one END", src.split("// FAMDAYSTART_START").length === 2 && src.split("// FAMDAYSTART_END").length === 2);
  ok("the block writes only through famWrite (no db.ref of its own)", !/db\.ref\(/.test(DS) && /famWrite\(id\+"\/atByDay\/"\+day/.test(DS));
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
  const hooks = [
    ["famLayout → famStartFor", /let at=\(typeof famStartFor==='function'\)\?famStartFor\(b,dayName,ds\):famStartMin\(b,dayName\);/],   // SETTIME_TODAY: the layout carries its date
    ["famAutoUnits skips a pinned day", /\|\|\(typeof famAutoOn==='function'&&!famAutoOn\(b,dayName\)\)\) return;/],
    ["famMinOn", /if\(typeof famAutoOn==='function'\?famAutoOn\(b,dayName\):famIsAuto\(b\)\)\{/],
    ["famWhenLabel", /if\(typeof famAutoOn==="function"\?famAutoOn\(b,dn\):famIsAuto\(b\)\) return "scheduler picks";/],
    ["famCellState", /const L=\(typeof famAutoOn==="function"\?famAutoOn\(b,dn\):famIsAuto\(b\)\)\?null:famLayout\(b,dn\)/],
    ["famPreviewHTML", /const autoOn=function\(d\)\{ return typeof famAutoOn==="function"\?famAutoOn\(b,FAM_DN\[d\]\):famIsAuto\(b\); \};/],
    ["famRunDatesC key carries atByDay", /\}\),b\.atByDay\|\|null\]\);/],
    ["editor, under Starts", /if\(typeof famDsEditorHTML==="function"\) h\+=famDsEditorHTML\(id,b,ed,J\);/],
    ["Family Grid band", /typeof famDsWords==="function"\?famDsWords\(b,w\):w;/],
    ["gvAuditFindings", /out\.now=out\.now\.concat\(famDsAudit\(kid\)\);/],
    ["gvAuditRender", /else if\(f\.type==="famclash"\)\{ return \(typeof famDsAuditRowHTML==="function"\)\?famDsAuditRowHTML\(f\):""; \}/],
  ];
  hooks.forEach(([n, re]) => ok("hook: " + n, re.test(src)));
  ok("every hook is guarded (typeof) so the family suites' slices still run alone", (src.match(/typeof famStartFor===|typeof famAutoOn===|typeof famDsEditorHTML===|typeof famDsWords===|typeof famDsAudit===|typeof famDsAuditRowHTML===/g) || []).length >= 10);
  ok("the Firebase path is documented in the block", /config\/rules\/familyBlocks\/<id>\/atByDay\/<Day>/.test(DS));
}

console.log("1. famStartFor — the one resolver");
{
  const E = famEnv({ rulesData: rules({ [ID]: MON }) });
  ok("Monday override → 1:35 PM", fromMin(E.famStartFor(MON, "monday")) === "1:35 PM");
  ok("Tuesday → lunch end 1:00 PM", fromMin(E.famStartFor(MON, "tuesday")) === "1:00 PM");
  ok("the day token works too ('Mon')", fromMin(E.famStartFor(MON, "Mon")) === "1:35 PM");
  const E2 = famEnv({ rulesData: rules({ [ID]: MON }, { overrides: { wednesday: { lunchEnd: "1:30 PM" } } }) });
  ok("the per-day LUNCH override still moves a day with no start of its own (Wed 1:30)", fromMin(E2.famStartFor(MON, "wednesday")) === "1:30 PM");
  const E3 = famEnv({ rulesData: rules({ [ID]: Object.assign({}, MON, { atByDay: { Mon: "1:35 PM", Wed: "2:00 PM" } }) }, { overrides: { wednesday: { lunchEnd: "1:30 PM" } } }) });
  ok("…and a day's own start wins over the lunch override (Wed 2:00)", fromMin(E3.famStartFor(E3.famDefs()[ID], "wednesday")) === "2:00 PM");
  const timed = Object.assign({}, BLOCK, { at: "10:30 AM", atByDay: { Mon: "1:35 PM" } });
  ok("at:'10:30 AM' block: Mon 1:35, Tue 10:30", fromMin(E.famStartFor(timed, "monday")) === "1:35 PM" && fromMin(E.famStartFor(timed, "tuesday")) === "10:30 AM");
  const auto = Object.assign({}, BLOCK, { at: "auto", atByDay: { Mon: "1:35 PM" } });
  ok("at:'auto' block: Mon 1:35 pinned, Tue NaN (the scheduler picks)", fromMin(E.famStartFor(auto, "monday")) === "1:35 PM" && isNaN(E.famStartFor(auto, "tuesday")));
  ok("famAutoOn: auto block → Mon no, Tue yes; lunch block → never", !E.famAutoOn(auto, "monday") && E.famAutoOn(auto, "tuesday") && !E.famAutoOn(MON, "monday"));
  ok("a bad override ('soon') falls back to the block's start", fromMin(E.famStartFor(Object.assign({}, BLOCK, { atByDay: { Mon: "soon" } }), "monday")) === "1:00 PM");
  ok("no atByDay → exactly famStartMin, every day", DAYS5.every(d => E.famStartFor(BLOCK, d) === E.famStartMin(BLOCK, d)));
  ok("atByDay stored oddly (array / string) is ignored, not a crash", fromMin(E.famStartFor(Object.assign({}, BLOCK, { atByDay: ["1:35 PM"] }), "monday")) === "1:00 PM" && fromMin(E.famStartFor(Object.assign({}, BLOCK, { atByDay: "1:35 PM" }), "monday")) === "1:00 PM");
  ok("famDsDays lists the days with their own start, in week order", E.famDsDays(E3.famDefs()[ID]).join() === "Mon,Wed");
}

console.log("2. the layout + famDayCards");
{
  const E = famEnv({ rulesData: rules({ [ID]: MON }) });
  const L = E.famLayout(MON, "monday").map(x => [x.it.name, fromMin(x.s), fromMin(x.e)]);
  ok("Mon: History 1:35, Science 2:05, Read Aloud 2:35–2:55", JSON.stringify(L) === JSON.stringify([["History", "1:35 PM", "2:05 PM"], ["Science", "2:05 PM", "2:35 PM"], ["Read Aloud", "2:35 PM", "2:55 PM"]]), L);
  ok("Tue–Fri: History 1:00 as before", DAYS5.slice(1).every(d => fromMin(E.famLayout(MON, d)[0].s) === "1:00 PM"));
  const C = E.famDayCards("monday", "2026-10-26", null);
  ok("Monday: 4 kids × 3 subjects = 12 cards", C.length === 12);
  const at = (k) => C.filter(c => c.k === k).map(c => fromMin(c.s));
  ok("all four kids' copies at 1:35 / 2:05 / 2:35", at("hist").every(t => t === "1:35 PM") && at("sci").every(t => t === "2:05 PM") && at("ra").every(t => t === "2:35 PM"), [at("hist"), at("sci"), at("ra")]);
  ok("Tuesday cards at 1:00 / 1:30 / 2:00", E.famDayCards("tuesday", "2026-10-27", null).filter(c => c.k === "hist").every(c => fromMin(c.s) === "1:00 PM"));
  ok("a kid home from co-op by 1:35 (but not 1:00) IS in Monday's block now", famEnv({ rulesData: rules({ [ID]: MON }), coop: { "caleb|2026-10-26": toMin("1:20 PM") } }).famDayCards("monday", "2026-10-26", null).some(c => c.who === "caleb"));
  ok("…while Tuesday (1:00) still skips him", !famEnv({ rulesData: rules({ [ID]: MON }), coop: { "caleb|2026-10-27": toMin("1:20 PM") } }).famDayCards("tuesday", "2026-10-27", null).some(c => c.who === "caleb"));
  ok("a per-day start never changes WHICH days run (Sat still nothing, off still nothing)", E.famLayout(Object.assign({}, MON, { atByDay: { Sat: "1:35 PM" } }), "saturday").length === 0 && E.famLayout(Object.assign({}, MON, { off: true }), "monday").length === 0);
}

// ── the REAL day build: class partition + family block + packer + the emit (from the generator, verbatim) ──
const PARTITION = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer");
if (PARTITION.indexOf("famDayCards") < 0) throw new Error("family block not inside the partition slice — update this test");
function makeDayRunner(from) {
  const part = slice("  const fxBusy={}, fxMomBusy=[], fxLaneBusy={}, toPack=[];", "  // Place everything through the shared packer", from);
  const emit = slice("  famCards.forEach(function(fc){\n    tasks.push(", "  tasks.sort((a,b)=>toMin(a.time)-toMin(b.time));", from);
  return new Function("toMin", "fromMin", "fbArr", "cap", "taskDevice", "gwDeviceCaps", "ROSTER", "ENV", "ARG", `
    var rulesData=ENV.rulesData, weekData={tasks:[]}, currData=ENV.currData||{subjects:{}};
    function smapIsKidOff(k,ds){ return !!(ENV.off&&ENV.off[k+"|"+ds]); }
    function coopTimedEndMin(k,ds){ return (ENV.coop&&ENV.coop[k+"|"+ds])||0; }
    ${FX_DOW_SRC}
    ${extractFn("packDay", from)} ${extractFn("packAround", from)}
    ${extractFn("fxIsClass", from)} ${extractFn("fxDateList", from)} ${extractFn("fxRunsOn", from)} ${extractFn("fxWindow", from)} ${extractFn("fxLaneOf", from)}
    ${slice("// FAMBLOCK_START", "// FAMBLOCK_END", from)}
    ${slice("// FAMPRESENCE_START", "// FAMPRESENCE_END", from)}
    ${from.indexOf("// FAMDAYSTART_START") >= 0 ? slice("// FAMDAYSTART_START", "// FAMDAYSTART_END", from) : ""}
    const items=ARG.items, meta=ARG.meta, dayConfig=ARG.dayConfig, dayName=ARG.dayName, kidAssignments=ARG.kidAssignments;
    const kidStart={}, isSitter=!!dayConfig.isSitter, sitterEnd=dayConfig.sitterEnd||0, schoolStart=ARG.schoolStart, cutoff=ARG.cutoff;
    const r={lunchStart:ARG.lunchStart,lunchEnd:ARG.lunchEnd};
    let counter=1000; const prefix="d_"; const tasks=[]; function dbg(){}
    if(isSitter) (dayConfig.withSitter||[]).forEach(function(k){ kidStart[k]=sitterEnd; });
${part}
    const overflow=packAround([],toPack,{start:schoolStart,end:cutoff,lunchStart:r.lunchStart,lunchEnd:r.lunchEnd,
      kidStart:kidStart,momStart:(isSitter?sitterEnd:0),busy:fxBusy,momBusy:fxMomBusy,laneBusy:fxLaneBusy,lanes:["computer","screen","ipadLucy","keyboard"],laneCap:gwDeviceCaps()});
    const overflowSet=new Set(overflow);
    items.forEach(function(it){ const mm=meta[it.id]; tasks.push({id:it.id,who:it.who,time:it.time,dur:it.dur,mom:it.mom,device:it.device,subjectKey:mm.key}); });
    ${emit}
    tasks.sort((a,b)=>toMin(a.time)-toMin(b.time));
    return {tasks:tasks,momBusy:fxMomBusy.slice(),overflow:overflow.map(function(x){return x.id;})};
  `);
}
const runNew = makeDayRunner(src), runBase = makeDayRunner(BASE);
function buildDay(defs, ENV, opts, runner) {
  opts = opts || {};
  const items = [], meta = {}, kidAssignments = {};
  defs.forEach((d, i) => {
    const id = "t" + i, s = Object.assign({ minutes: d.min, mom: d.mom || "none", device: d.device || "paper", rules: d.rules || "" }, d.s || {});
    items.push({ id, who: d.kid, device: s.device, dur: d.min, mom: s.mom });
    meta[id] = { kid: d.kid, key: d.key || ("k" + i), excelVal: 1, s };
    (kidAssignments[d.kid] = kidAssignments[d.kid] || {})[d.key || ("k" + i)] = 1;
  });
  const dc = Object.assign({ dateStr: opts.ds || "2026-10-26" }, opts.sitter ? { isSitter: true, sitterStart: toMin(opts.sitter[0]), sitterEnd: toMin(opts.sitter[1]), withSitter: opts.withSitter || [] } : {});
  return (runner || runNew)(toMin, fromMin, fbArr, cap, taskDevice, gwDeviceCaps, ROSTER, ENV, {
    items, meta, kidAssignments, dayConfig: dc, dayName: opts.dayName || "monday",
    schoolStart: toMin("9:00 AM"), cutoff: toMin("5:00 PM"), lunchStart: toMin("12:00 PM"), lunchEnd: toMin("1:00 PM") });
}
const DEFS = (() => { const defs = []; [["taylor", [30, 20, 20, 30, 20, 30]], ["makenzie", [10, 30, 30, 20, 20, 10]], ["andrew", [10, 30, 20, 10, 20, 20]], ["caleb", [20, 15, 15, 20, 20, 15]]]
  .forEach(([k, ms]) => ms.forEach((m, i) => defs.push({ kid: k, min: m, mom: i % 3 === 1 ? "required" : "none" }))); return defs; })();
// Andrew's Speech: a fixed-time class, Mondays 1:00, 30 min, on the computer (curriculum/subjects/andrew/speech)
const SPEECH = { kid: "andrew", min: 30, key: "speech", device: "computer", s: SUBJECTS.andrew.speech };
const overlap = (a, b) => toMin(a.time) < toMin(b.time) + b.dur && toMin(b.time) < toMin(a.time) + a.dur;
const famOf = (R, id) => R.tasks.filter(t => t.famBlock === (id || ID));
const shape = (R) => JSON.stringify(R.tasks.map(t => [t.id, t.who, t.time, t.dur, t.famBlock || "", t.famItem || "", !!t.famAuto, !!t.famSitter]));

console.log("3. the real day build — Monday Speech and Family Time no longer collide");
{
  const ENV = { rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS } };
  const R = buildDay(DEFS.concat([SPEECH]), ENV, { dayName: "monday" });
  const fam = famOf(R), speech = R.tasks.find(t => t.id === "t24");
  ok("Speech is pinned at 1:00 PM (fixed-time class, untouched)", speech && speech.time === "1:00 PM", speech);
  ok("12 family cards, every copy at 1:35 / 2:05 / 2:35", fam.length === 12 && fam.filter(t => t.famItem === "hist").every(t => t.time === "1:35 PM") && fam.filter(t => t.famItem === "sci").every(t => t.time === "2:05 PM") && fam.filter(t => t.famItem === "ra").every(t => t.time === "2:35 PM"), fam.map(t => t.who + ":" + t.famItem + "@" + t.time));
  ok("Andrew's family cards don't overlap his Speech", !fam.filter(t => t.who === "andrew").some(t => overlap(t, speech)));
  ok("no kid's own card lands inside the moved block", !R.tasks.filter(t => !t.famBlock).some(t => fam.filter(f => f.who === t.who).some(f => overlap(t, f))));
  ok("Mom's held window follows (1:35–2:05 / 2:05–2:35 / 2:35–2:55)", JSON.stringify(R.momBusy.filter(w => w.s >= toMin("1:35 PM")).map(w => [fromMin(w.s), fromMin(w.e)])) === JSON.stringify([["1:35 PM", "2:05 PM"], ["2:05 PM", "2:35 PM"], ["2:35 PM", "2:55 PM"]]), R.momBusy);
  ok("no Mom-required card inside the moved block", !R.tasks.filter(t => t.mom === "required" && !t.famBlock).some(t => fam.some(f => overlap(t, f))));
  const R0 = buildDay(DEFS.concat([SPEECH]), { rulesData: rules({ [ID]: BLOCK }), currData: { subjects: SUBJECTS } }, { dayName: "monday" });
  ok("(the clash itself, with no override: Andrew's History at 1:00 sits on top of his Speech)", famOf(R0).some(t => t.who === "andrew" && t.famItem === "hist" && overlap(t, R0.tasks.find(x => x.id === "t24"))));
  const T1 = buildDay(DEFS, ENV, { dayName: "tuesday", ds: "2026-10-27" }), T0 = buildDay(DEFS, { rulesData: rules({ [ID]: BLOCK }), currData: { subjects: SUBJECTS } }, { dayName: "tuesday", ds: "2026-10-27" });
  ok("Tuesday lays at 1:00 and is byte-identical to the block with no override", famOf(T1).filter(t => t.famItem === "hist").every(t => t.time === "1:00 PM") && shape(T1) === shape(T0));
  ok("Monday cards carry no famAuto and no stamp of their own (a plain pinned family card)", fam.every(t => !t.famAuto && !("famSitter" in t)));
}

console.log("4. the window every re-timer reads (famWindowOf → fxSplitDay) and dsRetime");
{
  const E = famEnv({ rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS } });
  const w = E.famWindowOf({ famBlock: ID, famItem: "sci", day: "monday", time: "1:30 PM", dur: 30 }, "monday");
  ok("famWindowOf: a stale Monday Science card (laid 1:30 before the override) belongs at 2:05–2:35", fromMin(w.s) === "2:05 PM" && fromMin(w.e) === "2:35 PM", w);
  ok("…and the same card on Tuesday at 1:30–2:00", fromMin(E.famWindowOf({ famBlock: ID, famItem: "sci", day: "tuesday", time: "1:30 PM", dur: 30 }, "tuesday").s) === "1:30 PM");
  const stale = ROSTER.map(k => ({ id: "h_" + k, who: k, day: "monday", time: "1:00 PM", dur: 30, famBlock: ID, famItem: "hist" }));
  const own = { id: "a_math", who: "andrew", day: "monday", time: "9:00 AM", dur: 20, subjectKey: "math" };
  const sp = { id: "a_sp", who: "andrew", day: "monday", time: "1:00 PM", dur: 30, subjectKey: "speech" };
  const parts = E.fxSplitDay(stale.concat([own, sp]), "2026-10-26", "monday");
  ok("fxSplitDay (every packAround re-pack: dsRetime, the day-start shift, the school-end guard) re-pins all four copies to 1:35", stale.every(t => t.time === "1:35 PM") && parts.pinned.filter(p => p.t.famBlock).every(p => fromMin(p.w.s) === "1:35 PM" && fromMin(p.w.e) === "2:05 PM"));
  ok("Mom's window on the pinned copy is required (she leads it), Speech stays pinned at 1:00, Math is free to pack", parts.pinned.find(p => p.t.famBlock).s.mom === "required" && parts.pinned.some(p => p.t.id === "a_sp" && p.t.time === "1:00 PM") && parts.rest.some(t => t.id === "a_math"));
  // dsRetime — the real function on the real Monday build: a late start moves nothing pinned
  const retime = new Function("toMin", "fromMin", "ENV", `
    var rulesData=ENV.rulesData, currData=ENV.currData, checked=ENV.checked||{}, dayStarts=ENV.dayStarts, _todayDay=ENV.day||"monday";
    ${extractFn("fxIsClass")}
    ${extractFn("dsRetime")}
    return dsRetime(ENV.tasks);
  `);
  const ENV = { rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS } };
  const R = buildDay(DEFS.concat([SPEECH]), ENV, { dayName: "monday" }); R.tasks.forEach(t => { t.day = "monday"; });
  const out = retime(toMin, fromMin, Object.assign({}, ENV, { dayStarts: { monday: { andrew: "9:45 AM" } }, tasks: R.tasks, day: "monday" }));
  ok("dsRetime: Andrew 45 min late → his family copies stay at 1:35 / 2:05 / 2:35 (pinned, never strung out)", out.filter(t => t.famBlock && t.who === "andrew").map(t => t.time).join() === "1:35 PM,2:05 PM,2:35 PM", out.filter(t => t.famBlock && t.who === "andrew").map(t => t.time));
  ok("…and his Speech stays at 1:00", out.find(t => t.id === "t24").time === "1:00 PM");
  ok("…everyone else's copies untouched", out.filter(t => t.famBlock && t.who !== "andrew").every(t => t.time === R.tasks.find(x => x.id === t.id).time));
}

console.log("5. FAMBLOCKOUT and FAMPRESENCE read the override");
{
  const card = (k, it, time) => ({ id: k + "_" + it, who: k, day: "monday", time, dur: it === "ra" ? 20 : 30, famBlock: ID, famItem: it });
  const laid = (times) => ROSTER.flatMap(k => ["hist", "sci", "ra"].map((it, i) => card(k, it, times[i])));
  const bo = { b1: { day: "monday", type: "timed", start: "1:00 PM", end: "1:30 PM", kids: ["andrew"] } };
  const E1 = famEnv({ rulesData: rules({ [ID]: MON }), blockouts: bo, tasks: laid(["1:35 PM", "2:05 PM", "2:35 PM"]), dayISO: { monday: "2026-10-26" } }, { bo: true, tg: true });
  ok("a 1:00–1:30 blockout for Andrew no longer puts him out of Monday's History (block at 1:35)", E1.famBoState(E1.rd().familyBlocks && laid(["1:35 PM", "2:05 PM", "2:35 PM"])[6]) === null);
  const E0 = famEnv({ rulesData: rules({ [ID]: BLOCK }), blockouts: bo, tasks: laid(["1:00 PM", "1:30 PM", "2:00 PM"]), dayISO: { monday: "2026-10-26" } }, { bo: true, tg: true });
  const st0 = E0.famBoState(laid(["1:00 PM", "1:30 PM", "2:00 PM"])[6]);
  ok("(with no override the same blockout puts him out — the blockout reads the block's window)", !!(st0 && st0.out), st0);
  const bo2 = { b2: { day: "monday", type: "timed", start: "2:00 PM", end: "2:20 PM", kids: ["andrew"] } };
  const E2 = famEnv({ rulesData: rules({ [ID]: MON }), blockouts: bo2, tasks: laid(["1:35 PM", "2:05 PM", "2:35 PM"]), dayISO: { monday: "2026-10-26" } }, { bo: true, tg: true });
  const s2 = E2.famBoState(laid(["1:35 PM", "2:05 PM", "2:35 PM"])[7]);
  ok("…a 2:00–2:20 blockout DOES cover Monday's Science (2:05–2:35) — stale card times aren't what's read, the block's layout is", !!(s2 && s2.out), s2);
  // the sitter stamp (generation): the sitter 12:00–1:30, Mom-led block → inside the hours at 1:00, clear of them at 1:35
  const ENV = { rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS } };
  const RS = buildDay(DEFS, ENV, { dayName: "monday", sitter: ["12:00 PM", "1:30 PM"], withSitter: ["caleb"] });
  ok("sitter 12:00–1:30: Monday's block at 1:35 is NOT stamped famSitter", famOf(RS).length === 12 && famOf(RS).every(t => !("famSitter" in t)));
  const RS0 = buildDay(DEFS, { rulesData: rules({ [ID]: BLOCK }), currData: { subjects: SUBJECTS } }, { dayName: "monday", sitter: ["12:00 PM", "1:30 PM"], withSitter: ["caleb"] });
  ok("(with no override the 1:00 block IS stamped — the stamp reads the laid window)", famOf(RS0).filter(t => t.famItem === "hist").every(t => t.famSitter === true));
  const RT = buildDay(DEFS, ENV, { dayName: "tuesday", ds: "2026-10-27", sitter: ["12:00 PM", "1:30 PM"], withSitter: ["caleb"] });
  ok("Tuesday (still 1:00) is stamped as before", famOf(RT).filter(t => t.famItem === "hist").every(t => t.famSitter === true));
}

console.log("6. celebrations sort the laid cards — the 1:35 block is 'next'");
{
  const fns = ["famCelebOf", "famCelebSong", "_famCelebHas", "_famCelebMark", "_famCelebNames", "_famCelebCards", "famCelebOwnWork"];
  const code = fns.map(n => extractFn(n)).join("\n");
  const ENV = { rulesData: rules({ [ID]: Object.assign({}, MON, { celeb: "confetti" }) }), currData: { subjects: SUBJECTS } };
  const R = buildDay(DEFS.concat([SPEECH]), ENV, { dayName: "monday" }); R.tasks.forEach(t => { t.day = "monday"; });
  const shows = [], store = {};
  const ctx = { WK: "w", _todayDay: "monday", ROSTER, FAM_ICON: "🏡", checked: {}, tasks: R.tasks, defs: ENV.rulesData.familyBlocks, celebSongs: [],
    ld: k => store[k] || null, sv: (k, v) => { store[k] = v; }, db: null, _rtSwTodayLay: () => null, getActiveTasks: () => R.tasks, effectiveDay: t => t.day,
    famDefs: () => ENV.rulesData.familyBlocks, cap, esc, toMin, hasCelebrated: () => false,
    rtSchoolworkDone: (kid, d, ownOnly) => ownOnly ? R.tasks.filter(t => t.who === kid && !t.famBlock).every(t => ctx.checked[t.id]) : false,
    _showCelebration: (kid, title, o) => shows.push({ kid, title, o: o || {} }) };
  new Function("ctx", "with(ctx){" + code + "; Object.assign(ctx,{" + fns.join(",") + "});}")(ctx);
  R.tasks.filter(t => t.who === "caleb" && !t.famBlock).forEach(t => { ctx.checked[t.id] = 1; });
  const fired = ctx.famCelebOwnWork("caleb", "monday");
  ok("Caleb's own work done, the block still ahead → confetti, 'Family Time is next'", fired && shows.length === 1 && /Family Time is next/.test(shows[0].title) && shows[0].o.noSong === true, shows);
  const open = ctx._famCelebCards("monday").filter(t => t.who === "caleb").sort((a, b) => toMin(a.time) - toMin(b.time));
  ok("the earliest open family card it looked at is the 1:35 one", open.length === 3 && open[0].time === "1:35 PM", open.map(t => t.time));
}

console.log("7. an at:'auto' block with a Monday override — Monday pinned, the other days still auto");
{
  const AUTO = { name: "Fact Review", kids: ["andrew", "makenzie"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "auto", momLeads: false, atByDay: { Mon: "1:35 PM" }, items: [{ key: "fr", name: "Fact Review", minutes: 15 }] };
  const E = famEnv({ rulesData: rules({ fr: AUTO }) }, { tg: true });
  ok("famAutoUnits: nothing for Monday (pinned), one unit Tuesday", E.famAutoUnits("monday", "2026-10-26").length === 0 && E.famAutoUnits("tuesday", "2026-10-27").length === 1);
  const C = E.famDayCards("monday", "2026-10-26", null);
  ok("famDayCards lays Monday at 1:35 for both kids; Tuesday lays nothing (the packer places it)", C.length === 2 && C.every(c => fromMin(c.s) === "1:35 PM") && E.famDayCards("tuesday", "2026-10-27", null).length === 0, C);
  ok("famMinOn counts Monday's 15 min for a member (Tuesday too, as the auto path always did)", E.famMinOn("andrew", "monday", "2026-10-26") === 15 && E.famMinOn("andrew", "tuesday", "2026-10-27") === 15);
  const cm = E.famCellState(AUTO, AUTO.items[0], "2026-10-26"), ct = E.famCellState(AUTO, AUTO.items[0], "2026-10-27");
  ok("famCellState: Monday runs at 1:35, Tuesday runs with no time (scheduler)", cm.runs && fromMin(cm.at) === "1:35 PM" && ct.runs && ct.at === null, [cm, ct]);
  ok("famWhenLabel (first run day = Monday) says 1:35 PM", E.famWhenLabel(AUTO, AUTO.items[0]) === "1:35 PM");
  const pv = E.famPreviewHTML(AUTO);
  ok("the preview: Mon 1:35–1:50 pinned, Tue 'scheduler picks', both footers", /<b>Mon<\/b> 1:35 PM–1:50 PM/.test(pv) && /<b>Tue<\/b> 15 min, the scheduler picks/.test(pv) && /earliest morning time/.test(pv) && /still at co-op/.test(pv), pv);
  // the real build: Monday pinned at 1:35 with no famAuto; Tuesday placed by the packer, stamped famAuto
  const RM = buildDay(DEFS, { rulesData: rules({ fr: AUTO }), currData: { subjects: {} } }, { dayName: "monday" });
  const RT = buildDay(DEFS, { rulesData: rules({ fr: AUTO }), currData: { subjects: {} } }, { dayName: "tuesday", ds: "2026-10-27" });
  ok("day build Monday: both copies at 1:35, not famAuto (held like a class)", famOf(RM, "fr").length === 2 && famOf(RM, "fr").every(t => t.time === "1:35 PM" && !t.famAuto));
  ok("day build Tuesday: both copies in the morning, famAuto, together", famOf(RT, "fr").length === 2 && famOf(RT, "fr").every(t => t.famAuto && toMin(t.time) < toMin("12:00 PM")) && famOf(RT, "fr")[0].time === famOf(RT, "fr")[1].time, famOf(RT, "fr").map(t => t.time));
  const pure = Object.assign({}, AUTO); delete pure.atByDay;
  const RT0 = buildDay(DEFS, { rulesData: rules({ fr: pure }), currData: { subjects: {} } }, { dayName: "tuesday", ds: "2026-10-27" });
  ok("Tuesday is byte-identical to the same auto block with no override", shape(RT) === shape(RT0));
  ok("the pure auto block's preview is unchanged (auto rows + the one auto footer)", E.famPreviewHTML(pure) === famEnv({ rulesData: rules({ fr: pure }) }, { noDs: true, tg: true }).famPreviewHTML(pure));
}

console.log("8. the editor — 'Different on some days'");
{
  const E = famEnv({ rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS } });
  const h = E.famBlockEditorHTML(ID, E.famDefs()[ID]);
  ok("the row sits under Starts", h.indexOf("Some days") > h.indexOf("Starts") && h.indexOf("Some days") < h.indexOf("Mom leads it"));
  ok("plain words: Different on some days — tap a day…", /Different on some days — tap a day to give it its own start; tap it again to clear\./.test(h));
  ok("one chip per block day (Mon–Fri, no Sat)", ["Mon", "Tue", "Wed", "Thu", "Fri"].every(d => new RegExp("famDsToggle\\('" + ID + "','" + d + "'\\)").test(h)) && !/famDsToggle\('[^']+','Sat'\)/.test(h));
  ok("the Monday chip is on and reads 'Mon 1:35 PM'", /border:1\.5px solid #7c3aed[^>]*>Mon 1:35 PM<\/button>/.test(h));
  ok("a time field for Monday (13:35) that writes through famDsSet", new RegExp('<input type="time" class="rules-time" value="13:35" onchange="famDsSet\\(\'' + ID + '\',\'Mon\',to12h\\(this.value\\)\\)">').test(h));
  ok("…with a Clear button", new RegExp("famDsSet\\('" + ID + "','Mon',null\\)").test(h) && /✕ Clear/.test(h));
  ok("the words beside it: Mondays start 1:35 PM", /Mondays start 1:35 PM/.test(h));
  ok("no clash line (Monday has its own start now)", !/overlaps/.test(h));
  ok("the preview shows Mon 1:35–2:55 and Tue 1:00–2:20", /<b>Mon<\/b> 1:35 PM–2:55 PM/.test(h) && /<b>Tue<\/b> 1:00 PM–2:20 PM/.test(h));
  // no override yet: the clash line, and "Same start every day"
  const E0 = famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: SUBJECTS } });
  const h0 = E0.famBlockEditorHTML(ID, E0.famDefs()[ID]);
  ok("no override: 'Same start every day' and no time field", /Same start every day\./.test(h0) && !/type="time" class="rules-time" value="13:00" onchange="famDsSet/.test(h0));
  ok("the clash line: Mon: Andrew’s Speech 1:00–1:30 overlaps — set a later start?", /⚠ Mon: Andrew’s Speech 1:00–1:30 overlaps — set a later start\?/.test(h0), h0.match(/⚠[^<]*/g));
  ok("only Monday (Speech meets Mondays only)", (h0.match(/overlaps — set a later start/g) || []).length === 1);
  ok("tapping Tue opens a time field pre-filled with Tuesday's usual start (13:00), nothing written", (E0.famDsToggle(ID, "Tue"), E0.writes.length === 0 && /value="13:00" onchange="famDsSet\('fbmusz3l9q','Tue',to12h\(this.value\)\)"/.test(E0.famBlockEditorHTML(ID, E0.famDefs()[ID]))));
  ok("tapping Tue again closes it", (E0.famDsToggle(ID, "Tue"), !/value="13:00" onchange="famDsSet/.test(E0.famBlockEditorHTML(ID, E0.famDefs()[ID]))));
  // not Mom: words only
  const EV = famEnv({ rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS }, mom: false });
  const hv = EV.famBlockEditorHTML(ID, EV.famDefs()[ID]);
  ok("not in Mom mode: 'Mondays start 1:35 PM' in words, no chips, no time field", /Mondays start 1:35 PM/.test(hv) && !/famDsToggle/.test(hv) && !/type="time"/.test(hv));
  const EV0 = famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: {} }, mom: false });
  ok("not in Mom mode, no override, no clash → the editor is byte-identical to base", EV0.famBlockEditorHTML(ID, EV0.famDefs()[ID]) === famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: {} }, mom: false }, { noDs: true }).famBlockEditorHTML(ID, BLOCK));
  // the Family Grid band words + the kid Grid strip
  ok("famDsWords: 'after lunch · Mon 1:35 PM'; unchanged with no override", E.famDsWords(MON, "after lunch") === "after lunch · Mon 1:35 PM" && E.famDsWords(BLOCK, "after lunch") === "after lunch");
  ok("the kid Grid strip's chip (first run day Monday) says 1:35 PM", /1:35 PM · 30m/.test(famEnv({ rulesData: rules({ [ID]: MON }), currData: { subjects: {} } }, { tg: true }).famGridStripHTML("andrew")));
}

console.log("9. writes — one leaf per day, Mom only, dry run inert");
{
  const E = famEnv({ rulesData: rules({ [ID]: JSON.parse(JSON.stringify(BLOCK)) }), currData: { subjects: SUBJECTS } });
  ok("famDsSet Mon 1:35 PM → config/rules/familyBlocks/<id>/atByDay/Mon = '1:35 PM', one write", E.famDsSet(ID, "Mon", "1:35 PM") === true && JSON.stringify(E.writes) === JSON.stringify([["config/rules/familyBlocks/" + ID + "/atByDay/Mon", "1:35 PM"]]), E.writes);
  ok("…in memory at once: Monday lays at 1:35", fromMin(E.famLayout(E.famDefs()[ID], "monday")[0].s) === "1:35 PM" && E.famDsAt(E.famDefs()[ID], "Mon") === "1:35 PM");
  ok("…and the screen re-draws", E.renders() >= 1);
  E.famDsSet(ID, "Wed", "2:00 PM");
  ok("a second day is its own leaf (Wed)", E.writes[1][0].endsWith("/atByDay/Wed") && E.writes[1][1] === "2:00 PM" && E.famDsDays(E.famDefs()[ID]).join() === "Mon,Wed");
  ok("clearing Monday writes null to that leaf only — Wednesday stays", E.famDsSet(ID, "Mon", null) === true && E.writes[2][0].endsWith("/atByDay/Mon") && E.writes[2][1] === null && E.famDsDays(E.famDefs()[ID]).join() === "Wed");
  ok("the whole familyBlocks node is never written", E.writes.every(w => /\/atByDay\/(Mon|Wed)$/.test(w[0])));
  ok("a bad day ('Sun') and a bad time ('soon') write nothing", E.famDsSet(ID, "Sun", "1:35 PM") === false && E.famDsSet(ID, "Mon", "soon") === false && E.writes.length === 3);
  ok("an unknown block writes nothing", E.famDsSet("nope", "Mon", "1:35 PM") === false && E.writes.length === 3);
  ok("famDsToggle on a day with its own start clears it (one null write)", (E.famDsToggle(ID, "Wed"), E.writes.length === 4 && E.writes[3][1] === null && E.famDsDays(E.famDefs()[ID]).length === 0));
  const EK = famEnv({ rulesData: rules({ [ID]: JSON.parse(JSON.stringify(BLOCK)) }), mom: false });
  ok("not Mom → false, nothing written, nothing changed", EK.famDsSet(ID, "Mon", "1:35 PM") === false && EK.writes.length === 0 && !EK.famDsAt(EK.famDefs()[ID], "Mon"));
  const ED = famEnv({ rulesData: rules({ [ID]: JSON.parse(JSON.stringify(BLOCK)) }), dry: true });
  ok("?dryrun=1: in memory yes, Firebase no", ED.famDsSet(ID, "Mon", "1:35 PM") === true && ED.writes.length === 0 && ED.famDsAt(ED.famDefs()[ID], "Mon") === "1:35 PM");
}

console.log("10. removing the override restores base; no atByDay → byte-identical lay");
{
  const E = famEnv({ rulesData: rules({ [ID]: JSON.parse(JSON.stringify(MON)) }), currData: { subjects: SUBJECTS } });
  E.famDsSet(ID, "Mon", null);
  ok("after the clear, Monday lays at 1:00 again", fromMin(E.famLayout(E.famDefs()[ID], "monday")[0].s) === "1:00 PM");
  const cleared = E.rd();
  const R1 = buildDay(DEFS.concat([SPEECH]), { rulesData: cleared, currData: { subjects: SUBJECTS } }, { dayName: "monday" });
  const R0 = buildDay(DEFS.concat([SPEECH]), { rulesData: rules({ [ID]: BLOCK }), currData: { subjects: SUBJECTS } }, { dayName: "monday" }, runBase);
  ok("…and the Monday build is byte-identical to the code without FAMDAYSTART", shape(R1) === shape(R0));
  // randomized days, lunch / set-time / auto blocks, no atByDay anywhere: new code vs the file with the feature removed
  let seed = 20261022; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  let same = 0, n = 0;
  for (let i = 0; i < 150; i++) {
    const defs = DEFS.map(d => Object.assign({}, d, { min: 5 * (1 + Math.floor(rnd() * 8)), mom: rnd() < .3 ? "required" : "none", device: rnd() < .3 ? "computer" : "paper" }));
    if (rnd() < .5) defs.push(SPEECH);
    const at = pick(["lunch", "auto", "10:30 AM", "2:00 PM"]);
    const b = Object.assign({}, BLOCK, { at, kids: rnd() < .3 ? ["andrew", "makenzie"] : ROSTER.slice(), momLeads: rnd() < .3 ? false : undefined });
    const blocks = { [ID]: b }; if (rnd() < .3) blocks.fr = { name: "FR", kids: ["andrew", "makenzie"], days: ["Mon", "Wed"], at: "auto", momLeads: false, items: [{ key: "fr", name: "Fact Review", minutes: 15 }] };
    const dayName = pick(DAYS5), ds = "2026-10-2" + (6 + DAYS5.indexOf(dayName));
    const opts = { dayName, ds }; if (rnd() < .3) { opts.sitter = ["12:00 PM", "1:30 PM"]; opts.withSitter = ["caleb"]; }
    const ENV = { rulesData: rules(blocks), currData: { subjects: SUBJECTS }, coop: rnd() < .2 ? { ["caleb|" + ds]: toMin("2:00 PM") } : null };
    const A = buildDay(defs, ENV, opts), B = buildDay(defs, ENV, opts, runBase);
    n++; if (shape(A) === shape(B) && JSON.stringify(A.momBusy) === JSON.stringify(B.momBusy)) same++;
  }
  ok("150 randomized days (lunch / set time / auto, sitter, co-op, classes), no atByDay → byte-identical to the file with FAMDAYSTART removed", same === n, [same, n]);
  const E0 = famEnv({ rulesData: rules({ [ID]: BLOCK, fr: { name: "FR", kids: ["andrew"], days: ["Mon"], at: "auto", items: [{ key: "fr", name: "FR", minutes: 15 }] } }) }, { tg: true });
  const EB = famEnv({ rulesData: rules({ [ID]: BLOCK, fr: { name: "FR", kids: ["andrew"], days: ["Mon"], at: "auto", items: [{ key: "fr", name: "FR", minutes: 15 }] } }) }, { tg: true, noDs: true });
  ok("famMinOn / famCellState / famWhenLabel / the preview: byte-identical with no atByDay", E0.famMinOn("andrew", "monday", "2026-10-26") === EB.famMinOn("andrew", "monday", "2026-10-26")
    && JSON.stringify(E0.famCellState(BLOCK, BLOCK.items[1], "2026-10-26")) === JSON.stringify(EB.famCellState(BLOCK, BLOCK.items[1], "2026-10-26"))
    && E0.famWhenLabel(BLOCK, BLOCK.items[0]) === EB.famWhenLabel(BLOCK, BLOCK.items[0]) && E0.famPreviewHTML(BLOCK) === EB.famPreviewHTML(BLOCK));
}

console.log("11. the Grid audit strip — the clash is listed, nothing moves");
{
  const E0 = famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: SUBJECTS } });
  const a = E0.famDsAudit("andrew");
  ok("Andrew's Grid: one 'famclash' line", a.length === 1 && a[0].type === "famclash" && a[0].day === "Mon" && a[0].kid === "andrew" && a[0].disp === "Family Time", a);
  ok("the line: Mon: Andrew’s Speech 1:00–1:30 overlaps — set a later start?", a[0].txt === "Mon: Andrew’s Speech 1:00–1:30 overlaps — set a later start?", a[0].txt);
  ok("every member's Grid lists it (the block is theirs too); a kid not in the block gets nothing", E0.famDsAudit("taylor").length === 1 && E0.famDsAudit("lincoln").length === 0);
  const row = E0.famDsAuditRowHTML(a[0]);
  ok("the row says what and where, and that nothing moves by itself", /🏡 Family Time<\/b> — Mon: Andrew’s Speech 1:00–1:30 overlaps — set a later start\? Nothing moves by itself: give that day its own start in Settings ▸ Family time\./.test(row), row);
  ok("with the Monday start set → no line", famEnv({ rulesData: rules({ [ID]: MON }), currData: { subjects: SUBJECTS } }).famDsAudit("andrew").length === 0);
  ok("a block turned off → no line", famEnv({ rulesData: rules({ [ID]: Object.assign({}, BLOCK, { off: true }) }), currData: { subjects: SUBJECTS } }).famDsAudit("andrew").length === 0);
  ok("a paused class → no line", famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: { andrew: { speech: Object.assign({}, SUBJECTS.andrew.speech, { paused: true }) } } } }).famDsAudit("andrew").length === 0);
  ok("a class that meets every day (no allowedDays) → a line for each block day", famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: { andrew: { speech: { display: "Speech", fixedTime: "1:00 PM", minutes: 30 } } } } }).famDsAudit("andrew").map(f => f.day).join() === "Mon,Tue,Wed,Thu,Fri");
  ok("a class with real dates (fixedDates) → only the weekdays those dates fall on (Tue)", famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: { andrew: { speech: { display: "Speech", fixedTime: "1:00 PM", minutes: 30, fixedDates: ["2026-10-27", "2026-11-03"] } } } } }).famDsAudit("andrew").map(f => f.day).join() === "Tue");
  ok("a class in the block's middle (2:00–2:30, inside 1:00–2:20) is a clash too", E0.famDsClashes(Object.assign({}, BLOCK), "monday").length === 1 && famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: { andrew: { art: { display: "Art", fixedTime: "2:00 PM", minutes: 30, allowedDays: ["Mon"] } } } } }).famDsClashes(BLOCK, "monday").length === 1);
  ok("a class right after the block (2:20) is not", famEnv({ rulesData: rules({ [ID]: BLOCK }), currData: { subjects: { andrew: { art: { display: "Art", fixedTime: "2:20 PM", minutes: 30, allowedDays: ["Mon"] } } } } }).famDsClashes(BLOCK, "monday").length === 0);
  ok("nothing in the block moves a card or writes anything on its own", !/famWrite\(/.test(extractFn("famDsClashes", DS) + extractFn("famDsAudit", DS) + extractFn("famDsEditorHTML", DS)) && !/\.time=/.test(DS));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
