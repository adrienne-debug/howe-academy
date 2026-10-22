/*
 * Node tests — 👨‍👩‍👧 FAMILY TIME HARNESS: daily cards + "scheduler picks" (at:"auto") coverage.
 * Session E of the readiness pack (her yes 2026-10-22). TESTS ONLY — nothing in index.html changes.
 *
 * Closes two coverage gaps noted 2026-10-03:
 *   1. the family suites' day harness only ever packed LESSON cards. Here the REAL gwBuildDayTasks (sliced out of
 *      GWGEN_START…GWGEN_END) lays a 4-kid day with DAILY cards — Morning Notebook ("first"), Drills, Closing Notebook
 *      ("last") — AND lesson cards, with the bookends injected by generateWeek's own daily-injection loop.
 *   2. at:"auto" through packAround → packDay with `participants` was only ever proven on DeWalt dry runs.
 *
 * Every day runs in BOTH packer modes the app has: "loop" (no saved Workflow Orders → gwLoopPack, the DeWalt path)
 * and "saved" (orders saved for every kid → one plain packAround, the Howe path).
 *
 *   a. the harness lays dailies + lessons for taylor / makenzie / andrew / caleb; School Day 9:00–3:00, lunch 12–1
 *   b. at:"lunch" block, 3 items (30/30/20) → every copy at 1:00 / 1:30 / 2:00, no clash with daily cards
 *   c. at:"auto" block for 2 of the 4, 15 min, momLeads:false, "first" cards present → lands after the first-of-day card
 *      at the earliest common free slot; the other two kids' days are byte-identical with or without it
 *   d. one computer, three kids with computer subjects, plus the auto block → the lane is never double-booked
 *   e. late start: one member starts 9:45 → all copies of the auto block shift together (dsRetime)
 *   f. kid off (smapIsKidOff) + a timed co-op ending after the block → that kid has no copy, the others do
 *   g. 500 randomized days with no blocks defined → byte-identical to the generator with the family code removed
 *      (and to FAM_BASE=<old index.html> when given)
 *
 *   run:  node test_family_harness.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const base = process.env.FAM_BASE ? fs.readFileSync(process.env.FAM_BASE, "utf8") : null;

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
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");

// ───────────────────────────── the generator, sliced verbatim ─────────────────────────────
// GWGEN_START…END holds gwRules, gwDeviceCaps, gwGetSubjects, gwByCategory, applyStickyOrder, gwTaskTitle,
// gwSubjectDetail, packDay, packAround, wfWithDefaults, gwLoopPack, gwWorkflowRank and gwBuildDayTasks itself.
// The daily-injection loop is generateWeek's own (bookends: "first"/"last" subjects onto every school day).
const INJECT_A = "  // Inject daily curriculum subjects", INJECT_B = "  const skipSet=new Set((config.skipDays";
function makeGen(from, withFam) {
  from = from || src;
  const GWGEN = slice("// GWGEN_START", "// GWGEN_END", from);
  if (GWGEN.indexOf("function gwBuildDayTasks(") < 0 || GWGEN.indexOf("function packDay(") < 0) throw new Error("GWGEN slice no longer holds the generator — update this test");
  const FAM = withFam ? slice("// FAMBLOCK_START", "// FAMBLOCK_END", from) : "";
  const INJECT = slice(INJECT_A, INJECT_B, from);
  if (INJECT.indexOf("balanced[dk][kid][sk]=subs[sk].display") < 0) throw new Error("daily-injection loop moved — update this test");
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "ROSTER", "ENV", `
    var rulesData=ENV.rulesData, currData=ENV.currData||{subjects:{}}, weekData={tasks:[]}, scheduleOverrides={};
    function smapIsKidOff(k,ds){ return !!(ENV.off&&ENV.off[k+"|"+ds]); }
    function coopTimedEndMin(k,ds){ return (ENV.coop&&ENV.coop[k+"|"+ds])||0; }
    function taskDevice(t){ return t.device||"paper"; }
    function dbg(){}
    const DEFAULT_DAY_CAP=2;
    ${FX_DOW_SRC}
    ${extractFn("gwParseDate", from)} ${extractFn("schedOv", from)} ${extractFn("schedOvKidOff", from)} ${extractFn("_normOrderArr", from)}
    ${extractFn("wfMatch", from)} ${extractFn("capFor", from)}
    ${extractFn("fxIsClass", from)} ${extractFn("fxDateList", from)} ${extractFn("fxRunsOn", from)} ${extractFn("fxWindow", from)}
    ${extractFn("fxLaneOf", from)} ${extractFn("fxSplitDay", from)} ${extractFn("fxCtxWithClasses", from)}
    ${GWGEN}
    ${FAM}
    function injectDaily(balanced){ const config={}; ${INJECT} return balanced; }
    return {gwBuildDayTasks:gwBuildDayTasks, injectDaily:injectDaily, hasFam:(typeof famDayCards==="function")};
  `);
  return (ENV) => f(toMin, fromMin, fbArr, cap, ROSTER, ENV);
}
const GEN = makeGen(src, true), GEN_NOFAM = makeGen(src, false);

// ───────────────────────────── the family ─────────────────────────────
const SD = { defaultStart: "9:00 AM", defaultEnd: "3:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const DS = "2026-10-05", DAY = "monday";   // a Monday
function norm(s) { return Object.assign({ device: "paper", mom: "none", rules: "" }, s); }
const DAILY = () => ({
  morning_nb: norm({ display: "Morning Notebook", minutes: 10, rules: "first", tracking: "daily" }),
  drills: norm({ display: "Drills", minutes: 10, tracking: "daily" }),
  closing_nb: norm({ display: "Closing Notebook", minutes: 10, rules: "last", tracking: "daily" }),
});
const LESSONS = {
  taylor: { math: { display: "Math", minutes: 30, mom: "required" }, lit: { display: "Literature", minutes: 30 }, writing: { display: "Writing", minutes: 30 },
    typing: { display: "Typing", minutes: 30, device: "computer" }, latin: { display: "Latin", minutes: 20, mom: "maybe" }, geo: { display: "Geography", minutes: 20 } },
  makenzie: { math: { display: "Math", minutes: 30, mom: "required" }, reading: { display: "Reading", minutes: 15 }, spelling: { display: "Spelling", minutes: 20, mom: "required" },
    math_online: { display: "Math Online", minutes: 30, device: "computer" }, art: { display: "Art", minutes: 15 } },
  andrew: { math: { display: "Math", minutes: 20, mom: "required" }, reading: { display: "Reading", minutes: 20 }, phonics: { display: "Phonics", minutes: 20, mom: "required" },
    handwriting: { display: "Handwriting", minutes: 15 } },
  caleb: { math: { display: "Math", minutes: 20, mom: "required" }, reading: { display: "Reading", minutes: 15 }, phonics: { display: "Phonics", minutes: 15 },
    handwriting: { display: "Handwriting", minutes: 15 } },
};
function subjectsFor(over) {
  const out = {};
  ROSTER.forEach(k => { out[k] = Object.assign({}, DAILY()); Object.keys(LESSONS[k]).forEach(sk => { out[k][sk] = norm(LESSONS[k][sk]); }); });
  (over || []).forEach(o => { out[o.kid][o.key] = norm(o.s); });
  return out;
}
// The week grid for one day, as gwReadWeek would hand it over: a lesson value per lesson subject and "Daily" for a
// day-bound daily (Drills); the bookends ("first"/"last") are NOT here — generateWeek's own loop injects them.
function gridFor(subjects, kids) {
  const g = {};
  (kids || ROSTER).forEach(k => {
    g[k] = {};
    Object.keys(subjects[k]).forEach(sk => {
      const s = subjects[k][sk]; if (s.paused) return;
      const r = String(s.rules || ""); if (r.includes("first") || r.includes("last")) return;
      g[k][sk] = s.tracking === "daily" ? "Daily" : "Lesson 7";
    });
  });
  return g;
}
// saved orders for every kid: Mom-required, then the computer turn, then independent, then may-need-Mom
const SAVED_WF = () => { const wf = {}; ROSTER.forEach(k => { wf[k] = { normal: [{ tier: "required" }, { tier: "computer" }, { tier: "independent" }, { tier: "maybe" }] }; }); return wf; };
// mode "loop" = no Workflow Orders saved (DeWalt → gwLoopPack); "saved" = orders for every kid (Howe → one packAround)
function rulesFor(blocks, mode, extra) {
  const r = { schoolDay: Object.assign({}, SD), familyBlocks: blocks };
  if (mode === "saved") r.workflow = SAVED_WF();
  return Object.assign(r, extra || {});
}
const BLOCK = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch",
  items: [{ key: "hist", name: "History", minutes: 30 }, { key: "sci", name: "Science", minutes: 30 }, { key: "ra", name: "Read Aloud", minutes: 20 }] };
const FR = { name: "Fact Review", kids: ["andrew", "makenzie"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "auto", momLeads: false,
  items: [{ key: "fr", name: "Fact Review", minutes: 15 }] };

// Lay one day through the real gwBuildDayTasks: o = {rules, subjects?, grid?, kids?, off?, coop?, schoolStart?, gen?}
function runDay(o) {
  const subjects = o.subjects || subjectsFor();
  const E = (o.gen || GEN)({ rulesData: o.rules, currData: { subjects }, off: o.off, coop: o.coop });
  const balanced = {}; balanced[DS] = JSON.parse(JSON.stringify(o.grid || gridFor(subjects, o.kids)));
  E.injectDaily(balanced);
  const start = o.schoolStart != null ? o.schoolStart : toMin(SD.defaultStart);
  const dayConfig = { schoolStart: start, momAvailable: start, isCarSchool: false, isSitter: false, sitterStart: 0, sitterEnd: 0, withSitter: [], theater: false, dayName: o.dayName || DAY, dateStr: DS };
  return E.gwBuildDayTasks(balanced[DS] || {}, dayConfig, "2026d278_", 1);
}
const T = (t) => toMin(t.time), END = (t) => toMin(t.time) + t.dur;
const overlap = (a, b) => T(a) < END(b) && T(b) < END(a);
const byKid = (tasks, k) => tasks.filter(t => t.who === k).sort((a, b) => T(a) - T(b));
const fam = (tasks, b) => tasks.filter(t => t.famBlock && (!b || t.famBlock === b));
const own = (tasks) => tasks.filter(t => !t.famBlock);
const timeline = (tasks, k) => byKid(tasks, k).map(t => (t.subjectKey || t.famItem) + "@" + t.time).join(",");
// Any clash between two cards of one kid (family copies included)?
function kidClashes(tasks) {
  const out = [];
  ROSTER.forEach(k => { const L = byKid(tasks, k); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (overlap(L[i], L[j])) out.push(k + ": " + (L[i].subjectKey || L[i].famItem) + "@" + L[i].time + " × " + (L[j].subjectKey || L[j].famItem) + "@" + L[j].time); });
  return out;
}
// Is there a hole of ≥ dur minutes before `before` where EVERY kid in `kids` is free (lunch counted as busy)?
function commonFreeBefore(tasks, kids, before, dur, dayStart) {
  const busy = tasks.filter(t => kids.indexOf(t.who) >= 0).map(t => [T(t), END(t)]).concat([[toMin(SD.lunchStart), toMin(SD.lunchEnd)]]);
  for (let s = dayStart; s + dur <= before; s += 5) { if (!busy.some(w => s < w[1] && s + dur > w[0])) return fromMin(s); }
  return null;
}
const MODES = ["loop", "saved"];

console.log("a. the harness: a real 4-kid day with daily cards AND lesson cards");
MODES.forEach(mode => {
  const R = runDay({ rules: rulesFor({}, mode) });
  const tasks = R.tasks;
  ok(mode + ": nothing dropped, every card has a time", R.dropped.length === 0 && tasks.every(t => t.time && !isNaN(T(t))), R.dropped);
  ok(mode + ": every kid has Morning Notebook, Drills and Closing Notebook (daily cards laid)",
    ROSTER.every(k => ["morning_nb", "drills", "closing_nb"].every(sk => byKid(tasks, k).some(t => t.subjectKey === sk))), ROSTER.map(k => timeline(tasks, k)));
  ok(mode + ": every kid has every lesson card", ROSTER.every(k => Object.keys(LESSONS[k]).every(sk => byKid(tasks, k).some(t => t.subjectKey === sk))));
  ok(mode + ": Morning Notebook is each kid's first card, at 9:00", ROSTER.every(k => { const L = byKid(tasks, k); return L[0].subjectKey === "morning_nb" && L[0].time === "9:00 AM"; }), ROSTER.map(k => byKid(tasks, k)[0].time));
  ok(mode + ": Closing Notebook is each kid's last card", ROSTER.every(k => { const L = byKid(tasks, k); return L[L.length - 1].subjectKey === "closing_nb"; }), ROSTER.map(k => timeline(tasks, k)));
  ok(mode + ": a kid never has two cards at once", kidClashes(tasks).length === 0, kidClashes(tasks));
  ok(mode + ": lunch is clear", !tasks.some(t => T(t) < toMin(SD.lunchEnd) && END(t) > toMin(SD.lunchStart)));
  ok(mode + ": nothing runs past school end (3:00)", tasks.every(t => END(t) <= toMin(SD.defaultEnd)), tasks.filter(t => END(t) > toMin(SD.defaultEnd)).map(t => t.who + " " + t.time));
  ok(mode + ": Mom-required cards never overlap across kids", !tasks.some(a => a.mom === "required" && tasks.some(b => b !== a && b.mom === "required" && b.who !== a.who && overlap(a, b))));
  ok(mode + ": titles come from the real gwTaskTitle (device emoji + display — value)", tasks.every(t => /^\S+ .+ — .+$/.test(t.title)) && byKid(tasks, "taylor").find(t => t.subjectKey === "typing").title.indexOf("Typing — Lesson 7") > 0, byKid(tasks, "taylor").map(t => t.title));
  ok(mode + ": ids unique, dur/mom/device/subjectKey carried", new Set(tasks.map(t => t.id)).size === tasks.length && tasks.every(t => t.dur > 0 && t.mom && t.device && t.subjectKey));
});
{
  const a = runDay({ rules: rulesFor({}, "loop") }), b = runDay({ rules: rulesFor({}, "saved") });
  ok("the two packer modes really are two paths (they lay the day differently)", JSON.stringify(a.tasks) !== JSON.stringify(b.tasks));
}

console.log("b. at:\"lunch\" — History 1:00 · Science 1:30 · Read Aloud 2:00 for everyone, no clash with daily cards");
MODES.forEach(mode => {
  const R = runDay({ rules: rulesFor({ fb1: BLOCK }, mode) });
  const tasks = R.tasks, F = fam(tasks, "fb1"), O = own(tasks);
  ok(mode + ": nothing dropped", R.dropped.length === 0, R.dropped);
  ok(mode + ": 12 family cards (4 kids × 3 subjects)", F.length === 12, F.length);
  ok(mode + ": each kid: History@1:00, Science@1:30, Read Aloud@2:00", ROSTER.every(k => F.filter(t => t.who === k).sort((x, y) => T(x) - T(y)).map(t => t.famItem + "@" + t.time).join() === "hist@1:00 PM,sci@1:30 PM,ra@2:00 PM"), ROSTER.map(k => F.filter(t => t.who === k).map(t => t.famItem + "@" + t.time)));
  ok(mode + ": family cards stamped famBlock/famItem, no subjectKey, not famAuto", F.every(t => t.famBlock === "fb1" && t.famItem && !t.subjectKey && !t.famAuto));
  const daily = O.filter(t => ["morning_nb", "drills", "closing_nb"].indexOf(t.subjectKey) >= 0);
  const dc = daily.filter(t => F.some(f => f.who === t.who && overlap(t, f)));
  ok(mode + ": no DAILY card sits inside that kid's family time", dc.length === 0, dc.map(t => t.who + " " + t.subjectKey + "@" + t.time));
  ok(mode + ": no card of any kind sits inside that kid's family time", kidClashes(tasks).length === 0, kidClashes(tasks));
  ok(mode + ": every kid still has all three daily cards", ROSTER.every(k => ["morning_nb", "drills", "closing_nb"].every(sk => byKid(tasks, k).some(t => t.subjectKey === sk))));
  ok(mode + ": Morning Notebook still first at 9:00", ROSTER.every(k => byKid(tasks, k)[0].subjectKey === "morning_nb" && byKid(tasks, k)[0].time === "9:00 AM"));
  const momIn = O.filter(t => t.mom === "required" && T(t) < toMin("2:20 PM") && END(t) > toMin("1:00 PM"));
  ok(mode + ": no Mom-required card (any kid) inside 1:00–2:20 — Mom leads family time", momIn.length === 0, momIn.map(t => t.who + " " + t.subjectKey + "@" + t.time));
  ok(mode + ": work continues after family time (someone has a card at 2:20 or later)", O.some(t => T(t) >= toMin("2:20 PM")), ROSTER.map(k => timeline(tasks, k)));
  ok(mode + ": nothing past 3:00", tasks.every(t => END(t) <= toMin("3:00 PM")));
  if (mode === "loop") ok("loop: Closing Notebook comes AFTER family time for every kid (last of the whole day)", ROSTER.every(k => { const L = byKid(tasks, k); return L[L.length - 1].subjectKey === "closing_nb" && T(L[L.length - 1]) >= toMin("2:20 PM"); }), ROSTER.map(k => timeline(tasks, k)));
  // CONTROL: the same day with no block puts work inside 1:00–2:20 — so the clash checks above prove something
  const R0 = runDay({ rules: rulesFor({}, mode) });
  ok(mode + ": control — with no block, work lands inside 1:00–2:20", R0.tasks.some(t => T(t) < toMin("2:20 PM") && END(t) > toMin("1:00 PM")));
});

console.log("c. at:\"auto\" for Andrew + Kenzie (15 min, kids on their own) — after the first-of-day card, earliest common slot");
const AUTO = {};
MODES.forEach(mode => {
  const R = runDay({ rules: rulesFor({ fr: FR }, mode) }), R0 = runDay({ rules: rulesFor({}, mode) });
  const tasks = R.tasks, F = fam(tasks, "fr"), O = own(tasks);
  AUTO[mode] = tasks;
  ok(mode + ": nothing dropped", R.dropped.length === 0, R.dropped);
  ok(mode + ": exactly one copy each for Andrew and Kenzie, same clock time", F.length === 2 && F[0].time === F[1].time && F.map(t => t.who).sort().join() === "andrew,makenzie", F.map(t => t.who + "@" + t.time));
  ok(mode + ": stamped famAuto, famBlock fr, 15 min, mom none, no subjectKey", F.every(t => t.famAuto === true && t.famBlock === "fr" && t.famItem === "fr" && t.dur === 15 && t.mom === "none" && !t.subjectKey));
  const nbEnd = Math.max(END(byKid(tasks, "andrew").find(t => t.subjectKey === "morning_nb")), END(byKid(tasks, "makenzie").find(t => t.subjectKey === "morning_nb")));
  ok(mode + ": lands after BOTH kids' Morning Notebook (first-of-day)", F.length && T(F[0]) >= nbEnd, [F[0] && F[0].time, fromMin(nbEnd)]);
  ok(mode + ": …and right there — 9:10, the earliest minute both are done with their notebook", F.length && F[0].time === "9:10 AM", F[0] && F[0].time);
  const hole = F.length ? commonFreeBefore(O, ["andrew", "makenzie"], T(F[0]), 15, toMin("9:00 AM")) : "n/a";
  ok(mode + ": no earlier common free slot of 15 min existed", hole === null, hole);
  ok(mode + ": neither kid has another card on top of it", !O.some(t => (t.who === "andrew" || t.who === "makenzie") && F.some(f => f.who === t.who && overlap(t, f))), kidClashes(tasks));
  ok(mode + ": Taylor and Caleb get no copy", !F.some(t => t.who === "taylor" || t.who === "caleb"));
  ok(mode + ": Taylor's and Caleb's Mom-required cards sit exactly where they sit without the block (Mom's sequence is untouched by a kids-only block)",
    ["taylor", "caleb"].every(k => JSON.stringify(byKid(tasks, k).filter(t => t.mom === "required")) === JSON.stringify(byKid(R0.tasks, k).filter(t => t.mom === "required"))), [timeline(tasks, "taylor"), timeline(R0.tasks, "taylor")]);
  // With the family's default ONE computer, Kenzie's computer card moves 15 min with her and can push Taylor's computer card
  // (lane contention — the lane, not the block). Give the family two computers and the non-members' days are byte-identical.
  const two = { devices: { computer: 2, screen: 2 } };
  const R2c = runDay({ rules: rulesFor({ fr: FR }, mode, two) }), R0c = runDay({ rules: rulesFor({}, mode, two) });
  ok(mode + ": with no shared lane (2 computers): Taylor's and Caleb's days are byte-identical with or without the block",
    JSON.stringify(byKid(R2c.tasks, "taylor").concat(byKid(R2c.tasks, "caleb"))) === JSON.stringify(byKid(R0c.tasks, "taylor").concat(byKid(R0c.tasks, "caleb"))) && fam(R2c.tasks, "fr").length === 2, [timeline(R2c.tasks, "taylor"), timeline(R0c.tasks, "taylor")]);
  ok(mode + ": Andrew and Kenzie still have every daily + lesson card", ["andrew", "makenzie"].every(k => Object.keys(subjectsFor()[k]).every(sk => byKid(tasks, k).some(t => t.subjectKey === sk))));
  ok(mode + ": Morning Notebook is still first for everyone", ROSTER.every(k => byKid(tasks, k)[0].subjectKey === "morning_nb"));
  // with the after-lunch block too: both blocks land, nothing clashes
  const R2 = runDay({ rules: rulesFor({ fr: FR, fb1: BLOCK }, mode) });
  ok(mode + ": with the lunch block as well — 2 auto + 12 lunch cards, no clashes, nothing dropped", fam(R2.tasks, "fr").length === 2 && fam(R2.tasks, "fb1").length === 12 && kidClashes(R2.tasks).length === 0 && R2.dropped.length === 0, [fam(R2.tasks, "fr").map(t => t.time), kidClashes(R2.tasks), R2.dropped]);
  ok(mode + ": …and the auto block is still before lunch, the lunch block still 1:00/1:30/2:00", fam(R2.tasks, "fr").every(t => END(t) <= toMin("12:00 PM")) && fam(R2.tasks, "fb1").every(t => ["1:00 PM", "1:30 PM", "2:00 PM"].indexOf(t.time) >= 0));
});
{
  // a "first" card that is LONGER for one member: the block waits for the slower notebook — in both modes
  const subs = subjectsFor([{ kid: "makenzie", key: "morning_nb", s: { display: "Morning Notebook", minutes: 25, rules: "first", tracking: "daily" } }]);
  MODES.forEach(mode => {
    const R = runDay({ rules: rulesFor({ fr: FR }, mode), subjects: subs });
    const F = fam(R.tasks, "fr");
    ok(mode + ": Kenzie's 25-min notebook → the block waits for her (9:25), Andrew's copy too", F.length === 2 && F.every(t => t.time === "9:25 AM"), F.map(t => t.who + "@" + t.time));
    ok(mode + ": Andrew's own next card fills his 9:10–9:25 gap or follows — never on top of the block", !own(R.tasks).some(t => t.who === "andrew" && F.some(f => f.who === "andrew" && overlap(t, f))));
  });
}

console.log("d. one computer, three kids with computer subjects, plus the auto block — the lane is never double-booked");
{
  const subs = subjectsFor([{ kid: "andrew", key: "reading_online", s: { display: "Reading Online", minutes: 20, device: "computer" } }]);
  const compClash = (tasks) => { const C = tasks.filter(t => t.device === "computer"); const out = []; for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) if (overlap(C[i], C[j])) out.push(C[i].who + "@" + C[i].time + " × " + C[j].who + "@" + C[j].time); return out; };
  MODES.forEach(mode => {
    const R = runDay({ rules: rulesFor({ fr: FR }, mode, { devices: { computer: 1, screen: 2 } }), subjects: subs });
    const C = R.tasks.filter(t => t.device === "computer");
    ok(mode + ": three computer cards laid (Taylor, Kenzie, Andrew), nothing dropped", C.length === 3 && C.map(t => t.who).sort().join() === "andrew,makenzie,taylor" && R.dropped.length === 0, [C.map(t => t.who + "@" + t.time), R.dropped]);
    ok(mode + ": the one computer is never double-booked", compClash(R.tasks).length === 0, compClash(R.tasks));
    ok(mode + ": the auto block still lands together (2 copies, same time), no kid clash", fam(R.tasks, "fr").length === 2 && fam(R.tasks, "fr")[0].time === fam(R.tasks, "fr")[1].time && kidClashes(R.tasks).length === 0, [fam(R.tasks, "fr").map(t => t.time), kidClashes(R.tasks)]);
    ok(mode + ": the family cards are paper — they hold no computer", fam(R.tasks).every(t => t.device === "paper"));
    // with the lunch block as well, the computer still never doubles up
    const R2 = runDay({ rules: rulesFor({ fr: FR, fb1: BLOCK }, mode, { devices: { computer: 1, screen: 2 } }), subjects: subs });
    // (a card that cannot fit around the lane and the block is reported past the cutoff, never laid on top of another)
    const expect = Object.keys(subs.taylor).length + Object.keys(subs.makenzie).length + Object.keys(subs.andrew).length + Object.keys(subs.caleb).length + 12 + 2;
    ok(mode + ": with both blocks: computer never double-booked, no kid clash, every card laid or reported dropped (none lost)", compClash(R2.tasks).length === 0 && kidClashes(R2.tasks).length === 0 && R2.tasks.length + R2.dropped.length === expect, [compClash(R2.tasks), kidClashes(R2.tasks), R2.dropped.map(d => d.kid + " " + d.key), R2.tasks.length]);
    if (mode === "loop") ok("loop: with both blocks nothing is dropped (the Mom loop packs the holes)", R2.dropped.length === 0, R2.dropped);
  });
  // CONTROL: with three computers the same day DOES put two computer cards side by side (in at least one mode)
  const ctl = MODES.map(mode => runDay({ rules: rulesFor({ fr: FR }, mode, { devices: { computer: 3, screen: 2 } }), subjects: subs })).some(R => compClash(R.tasks).length > 0);
  ok("control — with three computers, computer cards do overlap (so the one-lane check bites)", ctl);
}

console.log("e. a late start moves scheduler-picked family time TOGETHER (dsRetime)");
{
  const retime = new Function("toMin", "fromMin", "ENV", `
    var rulesData=ENV.rulesData, currData=ENV.currData, checked=ENV.checked||{}, dayStarts=ENV.dayStarts, _todayDay=ENV.day||"monday";
    ${extractFn("fxIsClass")}
    ${extractFn("dsRetime")}
    return dsRetime(ENV.tasks);
  `);
  MODES.forEach(mode => {
    const tasks = AUTO[mode];   // the real generated day from (c): FR at 9:10 for Andrew + Kenzie
    const run = (starts) => retime(toMin, fromMin, { rulesData: rulesFor({ fr: FR }, mode), currData: { subjects: subjectsFor() }, dayStarts: { monday: starts }, tasks, day: "monday" });
    const out = run({ andrew: "9:45 AM" });
    const at = (list, k) => list.filter(t => t.famBlock === "fr" && t.who === k)[0];
    ok(mode + ": Andrew starts 9:45 (45 min late) → BOTH copies move to 9:55, together", at(out, "andrew").time === "9:55 AM" && at(out, "makenzie").time === "9:55 AM", [at(out, "andrew").time, at(out, "makenzie").time]);
    const shifted = own(out).filter(t => t.who === "andrew").every(t => T(t) === T(own(tasks).find(x => x.id === t.id)) + 45);
    ok(mode + ": Andrew's own cards all shift 45 min with him", shifted, own(out).filter(t => t.who === "andrew").map(t => t.subjectKey + "@" + t.time));
    ok(mode + ": Kenzie's own cards do NOT move (only her copy of the block does)", own(out).filter(t => t.who === "makenzie").every(t => t.time === tasks.find(x => x.id === t.id).time));
    ok(mode + ": Taylor's and Caleb's cards do not move", ["taylor", "caleb"].every(k => byKid(out, k).every(t => t.time === tasks.find(x => x.id === t.id).time)));
    ok(mode + ": Andrew has nothing on top of his moved copy", !own(out).some(t => t.who === "andrew" && overlap(t, at(out, "andrew"))));
    ok(mode + ": the stored tasks were not mutated (a copy came back)", at(tasks, "andrew").time === "9:10 AM" && out !== tasks);
    const both = run({ andrew: "9:30 AM", makenzie: "9:45 AM" });
    ok(mode + ": both late (9:30 / 9:45) → the copies move by the LARGER delay (45) → 9:55", at(both, "andrew").time === "9:55 AM" && at(both, "makenzie").time === "9:55 AM", [at(both, "andrew").time, at(both, "makenzie").time]);
    ok(mode + ": Andrew's own cards shift 30, Kenzie's 45", own(both).filter(t => t.who === "andrew").every(t => T(t) === T(tasks.find(x => x.id === t.id)) + 30) && own(both).filter(t => t.who === "makenzie").every(t => T(t) === T(tasks.find(x => x.id === t.id)) + 45));
    const same = run({ andrew: "9:00 AM", makenzie: "9:00 AM" });
    ok(mode + ": on-time start → nothing moves", same.every(t => t.time === tasks.find(x => x.id === t.id).time));
    const early = run({ andrew: "8:40 AM" });
    ok(mode + ": an early finish never pulls the day before school start (9:00 floor) — nothing moves", early.every(t => t.time === tasks.find(x => x.id === t.id).time));
    const notToday = retime(toMin, fromMin, { rulesData: rulesFor({ fr: FR }, mode), currData: { subjects: subjectsFor() }, dayStarts: { monday: { andrew: "9:45 AM" } }, tasks, day: "tuesday" });
    ok(mode + ": a late start recorded for another day leaves Monday alone", notToday.every(t => t.time === tasks.find(x => x.id === t.id).time));
  });
  // with the lunch block too: the auto copies move, the 1:00 block never does
  const R = runDay({ rules: rulesFor({ fr: FR, fb1: BLOCK }, "loop") });
  const out = retime(toMin, fromMin, { rulesData: rulesFor({ fr: FR, fb1: BLOCK }, "loop"), currData: { subjects: subjectsFor() }, dayStarts: { monday: { makenzie: "9:45 AM" } }, tasks: R.tasks, day: "monday" });
  ok("Kenzie late 45 → auto copies move 45 together; the after-lunch family cards stay at 1:00/1:30/2:00", fam(out, "fr").every(t => T(t) === T(fam(R.tasks, "fr")[0]) + 45) && fam(out, "fb1").every(t => t.time === R.tasks.find(x => x.id === t.id).time), fam(out).map(t => t.who + " " + t.famItem + "@" + t.time));
}

console.log("f. a kid marked off + a timed co-op ending after the block — that kid has no copy, the others do");
MODES.forEach(mode => {
  // Andrew is off (calendar) → upstream leaves him out of the grid, and smapIsKidOff says so; Caleb is at co-op until 2:00.
  const off = {}; off["andrew|" + DS] = 1;
  const coop = {}; coop["caleb|" + DS] = toMin("2:00 PM");
  // Caleb's own work that day is what fits his hour at home: Reading + Handwriting + the three dailies = 60 min.
  const gridF = gridFor(subjectsFor(), ["taylor", "makenzie", "caleb"]); delete gridF.caleb.math; delete gridF.caleb.phonics;
  const R = runDay({ rules: rulesFor({ fb1: BLOCK, fr: FR }, mode), grid: gridF, off, coop });
  const tasks = R.tasks, F = fam(tasks, "fb1");
  ok(mode + ": nothing dropped", R.dropped.length === 0, R.dropped);
  ok(mode + ": Andrew (off) has no cards at all — no family copy, no dailies, no lessons", byKid(tasks, "andrew").length === 0, byKid(tasks, "andrew").map(t => (t.subjectKey || t.famItem) + "@" + t.time));
  ok(mode + ": Caleb (co-op until 2:00, after the 1:00 block) has no family-time copy", !F.some(t => t.who === "caleb"), F.filter(t => t.who === "caleb").map(t => t.time));
  ok(mode + ": Taylor and Kenzie get all 3 copies at 1:00/1:30/2:00 — 6 cards", F.length === 6 && ["taylor", "makenzie"].every(k => F.filter(t => t.who === k).sort((x, y) => T(x) - T(y)).map(t => t.famItem + "@" + t.time).join() === "hist@1:00 PM,sci@1:30 PM,ra@2:00 PM"), F.map(t => t.who + " " + t.famItem + "@" + t.time));
  ok(mode + ": the cards name only who is there (Taylor, Makenzie)", F.every(t => /together: Taylor, Makenzie$/.test(t.detail)), F[0] && F[0].detail);
  ok(mode + ": Caleb's own day starts when he is home (2:00 or later), nothing past 3:00", byKid(tasks, "caleb").length > 0 && byKid(tasks, "caleb").every(t => T(t) >= toMin("2:00 PM") && END(t) <= toMin("3:00 PM")), timeline(tasks, "caleb"));
  ok(mode + ": Caleb still gets his Morning Notebook first when he gets home", byKid(tasks, "caleb")[0] && byKid(tasks, "caleb")[0].subjectKey === "morning_nb", timeline(tasks, "caleb"));
  const fr = fam(tasks, "fr");
  ok(mode + ": the auto block (Andrew + Kenzie): Andrew has no copy; Kenzie's lands before lunch, after her notebook", !fr.some(t => t.who === "andrew") && fr.length === 1 && fr[0].who === "makenzie" && T(fr[0]) >= toMin("9:10 AM") && END(fr[0]) <= toMin("12:00 PM"), fr.map(t => t.who + "@" + t.time));
  ok(mode + ": no clashes anywhere", kidClashes(tasks).length === 0, kidClashes(tasks));
  // contrast: a co-op that ends BEFORE the block (11:00) → Caleb is back in time and gets his copies
  const coop2 = {}; coop2["caleb|" + DS] = toMin("11:00 AM");
  const gridC = gridFor(subjectsFor()); delete gridC.caleb.math; delete gridC.caleb.phonics;
  const R2 = runDay({ rules: rulesFor({ fb1: BLOCK }, mode), grid: gridC, coop: coop2 });
  ok(mode + ": contrast — co-op ending 11:00 (before the block) → Caleb has his 3 copies, 12 cards in all, nothing dropped", fam(R2.tasks, "fb1").length === 12 && fam(R2.tasks, "fb1").filter(t => t.who === "caleb").length === 3 && byKid(R2.tasks, "caleb").filter(t => !t.famBlock).every(t => T(t) >= toMin("11:00 AM")) && R2.dropped.length === 0, [fam(R2.tasks, "fb1").filter(t => t.who === "caleb").map(t => t.time), R2.dropped]);
  // an auto-block member at co-op: the block waits for them (both copies after they are home)
  const coop3 = {}; coop3["andrew|" + DS] = toMin("10:00 AM");
  const R3 = runDay({ rules: rulesFor({ fr: FR }, mode), coop: coop3 });
  const fr3 = fam(R3.tasks, "fr");
  ok(mode + ": Andrew home from co-op at 10:00 → the auto block waits for him: 2 copies, together, 10:00 or later, before lunch", fr3.length === 2 && fr3[0].time === fr3[1].time && T(fr3[0]) >= toMin("10:00 AM") && END(fr3[0]) <= toMin("12:00 PM") && kidClashes(R3.tasks).length === 0, fr3.map(t => t.who + "@" + t.time));
  ok(mode + ": …after his Morning Notebook (his first card once home)", byKid(R3.tasks, "andrew")[0].subjectKey === "morning_nb" && T(fr3[0]) >= END(byKid(R3.tasks, "andrew")[0]), timeline(R3.tasks, "andrew"));
});

console.log("g. 500 randomized days with no blocks defined → byte-identical to the generator without the family code");
{
  let seed = 20261022;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  let diffs = 0, diffsBase = 0, n = 0, laid = 0, withDaily = 0, sample = null;
  const GEN_BASE = base ? makeGen(base, false) : null;
  for (let trial = 0; trial < 500; trial++) {
    const subjects = {}, kids = ROSTER.filter(() => rnd() < 0.9);
    ROSTER.forEach(k => {
      const s = {};
      if (rnd() < 0.8) s.morning_nb = norm({ display: "Morning Notebook", minutes: pick([5, 10, 15]), rules: "first", tracking: "daily" });
      if (rnd() < 0.8) s.closing_nb = norm({ display: "Closing Notebook", minutes: pick([5, 10]), rules: "last", tracking: "daily" });
      if (rnd() < 0.6) s.drills = norm({ display: "Drills", minutes: pick([5, 10, 15]), tracking: "daily", device: pick(["paper", "ipad", "computer"]) });
      const nL = 1 + Math.floor(rnd() * 6);
      for (let i = 0; i < nL; i++) s["sub" + i] = norm({ display: "Subject " + i, minutes: pick([10, 15, 20, 30, 45]), mom: pick(["none", "none", "maybe", "required", "required"]), device: pick(["paper", "paper", "computer", "ipad", "phone"]), priority: pick(["normal", "normal", "high", "low"]) });
      subjects[k] = s;
    });
    const fbVal = pick([undefined, {}, null]);
    const rules = { schoolDay: { defaultStart: pick(["9:00 AM", "9:30 AM", "10:00 AM"]), defaultEnd: pick(["3:00 PM", "4:00 PM", "4:15 PM"]), lunchStart: pick(["12:00 PM", "12:30 PM", "1:00 PM"]), lunchEnd: pick(["1:00 PM", "1:30 PM", "2:00 PM"]) } };
    if (fbVal !== undefined) rules.familyBlocks = fbVal;
    if (rnd() < 0.5) rules.workflow = SAVED_WF();
    if (rnd() < 0.3) rules.devices = { computer: pick([1, 2]), screen: pick([1, 2, 3]) };
    const coop = {}; if (rnd() < 0.3) coop[pick(ROSTER) + "|" + DS] = toMin(pick(["10:00 AM", "11:00 AM", "2:00 PM"]));
    const off = {}; if (rnd() < 0.2) off[pick(ROSTER) + "|" + DS] = 1;
    const o = { rules, subjects, kids, coop, off, schoolStart: toMin(rules.schoolDay.defaultStart), dayName: pick(["monday", "tuesday", "wednesday", "thursday", "friday"]) };
    const a = runDay(Object.assign({}, o, { gen: GEN })), b = runDay(Object.assign({}, o, { gen: GEN_NOFAM }));
    n++; laid += a.tasks.length; if (a.tasks.some(t => t.subjectKey === "morning_nb" || t.subjectKey === "drills")) withDaily++;
    if (JSON.stringify(a) !== JSON.stringify(b)) { diffs++; if (!sample) sample = { a: a.tasks.slice(0, 3), b: b.tasks.slice(0, 3) }; }
    if (GEN_BASE) { const c = runDay(Object.assign({}, o, { gen: GEN_BASE })); if (JSON.stringify(a) !== JSON.stringify(c)) diffsBase++; }
  }
  ok("500 randomized days (both packer modes, dailies + lessons, co-ops, off days, lanes): 0 differences vs the generator without the family code", n === 500 && diffs === 0, { diffs, sample });
  ok("…and those days really laid cards (dailies included) — not an empty comparison", laid > 5000 && withDaily > 400, { laid, withDaily });
  if (GEN_BASE) ok("…and 0 differences vs FAM_BASE (the pre-family index.html)", diffsBase === 0, diffsBase);
  else console.log("  (FAM_BASE not set — skipped the comparison against an older index.html)");
  ok("the family code is really absent from the no-family runner (the comparison is between two different builds)", GEN({ rulesData: rulesFor({}, "loop"), currData: { subjects: {} } }).hasFam === true && GEN_NOFAM({ rulesData: rulesFor({}, "loop"), currData: { subjects: {} } }).hasFam === false);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
