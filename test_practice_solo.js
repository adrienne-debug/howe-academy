/*
 * Node tests — PRACTICE_SOLO (F4 of PLAN_learning_system_2026-10-24, her yes 2026-10-24): which practice cards need Mom.
 *
 *   🎯 Match & Play is the kids' own (Match, Memory flip, Which one? — the 🎮 Games tab) → mom "none".
 *   🃏 Daily Drill, 🏃 Sprint, 📅 Sprint Re-checks stay mom "required" — Mom runs them.
 *   A subject linked to a study session (subject.study) follows the session's who: solo → "none", mom → "required".
 *
 *   a. the PRACTICE_SOLO block itself (retrSlotMom, practiceSoloSubj)
 *   b. the real generator slot injection (GWRETR → gwInjectRetrieval): flags per kind; Match & Play no longer dodges
 *      Mom's lane, the drill still does
 *   c. the real day builder (GWGEN → gwBuildDayTasks): a study card takes its session's who
 *   d. REPLAY — live week28 Wednesday (Oct 21), read-only snapshot: as stored, Mom's loop waited on Julian's and Ellis's
 *      Match & Play; stamped the new way, the loop is done with Julian once his drill + notebooks are, and Mom's lane
 *      holds no Match & Play card
 *
 *   run:  node test_practice_solo.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
function slice(a, b, from) {
  from = from || src;
  const i = from.indexOf(a); if (i < 0) throw new Error("slice start not found: " + a);
  const j = from.indexOf(b, i); if (j < 0) throw new Error("slice end not found: " + b);
  return from.slice(i, j + b.length);
}
function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
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
const ov = (a, b) => toMin(a.time) < toMin(b.time) + (b.dur || 20) && toMin(b.time) < toMin(a.time) + (a.dur || 20);

const SOLO = slice("// PRACTICE_SOLO_START", "// PRACTICE_SOLO_END");
const GWRETR = slice("// GWRETR_START", "// GWRETR_END");
const RETRWEEK = slice("// RETRWEEK_START", "// RETRWEEK_END");
ok("the PRACTICE_SOLO block sits inside GWRETR (the generator slice tests run)", GWRETR.indexOf(SOLO) >= 0);
ok("no 🔀 in the block", SOLO.indexOf("\u{1F500}") < 0);

// ── a. the block ──────────────────────────────────────────────────────────────────────────────────────
console.log("a. the PRACTICE_SOLO block");
function soloEnv(masteryData) {
  const env = { masteryData: masteryData || {}, Object, JSON, String };
  vm.createContext(env); vm.runInContext(SOLO, env); return env;
}
{
  const E = soloEnv();
  ok("🎯 Match & Play → not Mom-required", E.retrSlotMom("match") === "none");
  ok("🃏 Daily Drill stays Mom-required", E.retrSlotMom("drill") === "required");
  ok("🏃 Sprint stays Mom-required", E.retrSlotMom("sprint") === "required");
  ok("📅 Sprint Re-checks stays Mom-required", E.retrSlotMom("recheck") === "required");
  ok("an unknown kind stays Mom-required (as before)", E.retrSlotMom("bogus") === "required");
}
{
  // live shape 2026-10-24: Lincoln's German Flash Cards subject is "required", its session is Solo
  const E = soloEnv({ lincoln_sessions: { german: { name: "German", who: "solo" }, daily_mix: { name: "Daily Mix", kind: "mix" },
    checkup_x: { name: "Check-up", kind: "checkup", who: "mom" } } });
  const german = { display: "German Flash Cards", mom: "required", study: "german", minutes: 25 };
  const g2 = E.practiceSoloSubj("lincoln", german);
  ok("solo session → the card is not Mom-required", g2.mom === "none", g2.mom);
  ok("…the subject itself is never edited (a copy)", german.mom === "required" && g2 !== german && g2.minutes === 25);
  const mix = { display: "Daily mix", mom: "none", study: "daily_mix" };
  ok("who absent = Solo; already none → the same object", E.practiceSoloSubj("lincoln", mix) === mix);
  const ck = { display: "Check-up", mom: "none", study: "checkup_x" };
  ok("With Mom session → Mom-required", E.practiceSoloSubj("lincoln", ck).mom === "required");
  const gone = { display: "Old flash", mom: "maybe", study: "deleted_one" };
  ok("a session that no longer exists → the subject's own setting", E.practiceSoloSubj("lincoln", gone) === gone);
  const plain = { display: "Math", mom: "required" };
  ok("a subject with no study session is untouched", E.practiceSoloSubj("lincoln", plain) === plain);
  ok("null subject passes through", E.practiceSoloSubj("lincoln", null) === null);
  ok("another kid's sessions are not read", E.practiceSoloSubj("ellis", german) === german);
}
{
  const E = soloEnv(undefined); vm.runInContext("masteryData=undefined;", E);
  const s = { mom: "required", study: "x" };
  ok("no masteryData loaded → unchanged, no throw", E.practiceSoloSubj("lincoln", s) === s);
}

// ── b. the generator's slot injection ──────────────────────────────────────────────────────────────────
console.log("b. gwInjectRetrieval (GWRETR, real)");
const WDAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dayOfYear = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
function retrEnv(plan) {
  const env = {
    masteryData: { retrievalPlan: plan || {} }, ROSTER: ["julian", "lucy", "ellis", "lincoln"],
    retrTracks: () => [1], gwParseDate: s => new Date(s + "T12:00:00"),
    gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    toMin, fromMin, Date, Math, Object, JSON, String, Number, Array, parseInt, console, Set, RegExp, isNaN,
  };
  vm.createContext(env); vm.runInContext(RETRWEEK + "\n" + GWRETR, env); return env;
}
{
  // every kind on one Monday: julian match + drill (match laid first), lucy sprint, ellis recheck
  const E = retrEnv({ julian: { week: { mon: "match" }, week2: { mon: "drill" } }, lucy: { week: { mon: "sprint" } },
    ellis: { week: { mon: "recheck" } }, lincoln: { week: { mon: "off" } } });
  const tasks = [
    { id: "j1", who: "julian", day: "monday", time: "10:00 AM", dur: 25, title: "📖 Morning Notebook", subjectKey: "morning_nb", mom: "required" },
    { id: "j2", who: "julian", day: "monday", time: "10:25 AM", dur: 5, title: "📖 Closing Notebook", subjectKey: "closing_nb", mom: "required" },
    // Lucy's Mom-required lesson sits exactly where Julian's slots would go first
    { id: "l1", who: "lucy", day: "monday", time: "10:00 AM", dur: 10, title: "📖 Morning Notebook", subjectKey: "morning_nb", mom: "maybe" },
    { id: "l2", who: "lucy", day: "monday", time: "10:25 AM", dur: 45, title: "📄 Dimensions Math 1A", subjectKey: "dimensions_math_1a", mom: "required" },
    { id: "e1", who: "ellis", day: "monday", time: "10:00 AM", dur: 10, title: "📖 Morning Notebook", subjectKey: "morning_nb", mom: "none" },
  ];
  E.gwInjectRetrieval(tasks, ["2026-10-26"], WDAY_MAP, new Set(), { monday: "October 26" }, dayOfYear);
  const R = tasks.filter(t => t.subjectKey === "retrieval");
  const by = k => R.find(t => t.retrieval === k);
  ok("four slots laid (drill, match, sprint, recheck)", ["drill", "match", "sprint", "recheck"].every(k => by(k)), R.map(t => t.id));
  ok("🎯 Match & Play card is mom none", by("match").mom === "none", by("match"));
  ok("🃏 Daily Drill card is mom required", by("drill").mom === "required");
  ok("🏃 Sprint card is mom required", by("sprint").mom === "required");
  ok("📅 Sprint Re-checks card is mom required", by("recheck").mom === "required");
  const lucyMath = tasks.find(t => t.id === "l2");
  ok("the drill (Mom's) still steps around Lucy's Mom-required math", !ov(by("drill"), lucyMath), [by("drill").time, lucyMath.time]);
  // (before PRACTICE_SOLO it stepped over Lucy's math to 11:10 AM, a Mom seat it never needed)
  ok("Match & Play no longer waits for Mom's lane: it takes the first window after Julian's own cards",
    by("match").time === "10:25 AM" && ov(by("match"), lucyMath), [by("match").time, by("drill").time]);
  ok("Julian's slots never overlap each other", !ov(by("match"), by("drill")));
  const closing = tasks.find(t => t.id === "j2");
  ok("Julian's Closing Notebook is still his last card", R.filter(t => t.who === "julian").every(s => toMin(closing.time) >= toMin(s.time) + s.dur), closing.time);
}

// ── c. the day builder: study cards follow the session ────────────────────────────────────────────────
console.log("c. gwBuildDayTasks (GWGEN, real): study cards follow their session's who");
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");
const fbArr = (v) => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; };
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const GWGEN = slice("// GWGEN_START", "// GWGEN_END");
ok("getMeta reads the subject through practiceSoloSubj", /function getMeta\(kid,key\)\{[^\n]*practiceSoloSubj\(kid,s\)/.test(GWGEN));
function makeGen(withSolo) {
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "ROSTER", "ENV", `
    var rulesData=ENV.rulesData, currData=ENV.currData, masteryData=ENV.masteryData, weekData={tasks:[]}, scheduleOverrides={};
    function smapIsKidOff(){ return false; } function coopTimedEndMin(){ return 0; }
    function taskDevice(t){ return t.device||"paper"; } function dbg(){}
    const DEFAULT_DAY_CAP=2;
    ${FX_DOW_SRC}
    ${extractFn("gwParseDate")} ${extractFn("schedOv")} ${extractFn("schedOvKidOff")} ${extractFn("_normOrderArr")}
    ${extractFn("wfMatch")} ${extractFn("capFor")}
    ${extractFn("fxIsClass")} ${extractFn("fxDateList")} ${extractFn("fxRunsOn")} ${extractFn("fxWindow")}
    ${extractFn("fxLaneOf")} ${extractFn("fxSplitDay")} ${extractFn("fxCtxWithClasses")}
    ${withSolo ? SOLO : ""}
    ${GWGEN}
    return {gwBuildDayTasks:gwBuildDayTasks};
  `);
  return (ENV) => f(toMin, fromMin, fbArr, cap, ["lincoln", "ellis"], ENV);
}
function layDay(withSolo, sessions) {
  const n = s => Object.assign({ device: "paper", mom: "none", rules: "", tracking: "daily" }, s);
  const subjects = {
    lincoln: { german_flash_cards: n({ display: "German Flash Cards", minutes: 25, mom: "required", study: "german", device: "computer" }),
               daily_mix: n({ display: "Daily mix", minutes: 5, study: "daily_mix" }),
               math: n({ display: "Singapore Math", minutes: 25, mom: "required", tracking: "sequenced" }) },
    ellis: { checkup: n({ display: "Check-up", minutes: 10, mom: "none", study: "checkup_u" }),
             spelling: n({ display: "All About Spelling", minutes: 25, mom: "required", tracking: "sequenced" }) },
  };
  const E = makeGen(withSolo)({ rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM" } },
    currData: { subjects }, masteryData: sessions });
  const grid = { lincoln: { german_flash_cards: "Daily", daily_mix: "Daily", math: "Lesson 6" }, ellis: { checkup: "Daily", spelling: "Lesson 7" } };
  const dayConfig = { schoolStart: 600, momAvailable: 600, isCarSchool: false, isSitter: false, sitterStart: 0, sitterEnd: 0, withSitter: [], theater: false, dayName: "monday", dateStr: "2026-10-26" };
  return E.gwBuildDayTasks(grid, dayConfig, "2026d299_", 1).tasks;
}
{
  const SESS = { lincoln_sessions: { german: { name: "German", who: "solo" }, daily_mix: { name: "Daily Mix", kind: "mix", who: "solo" } },
                 ellis_sessions: { checkup_u: { name: "Check-up", kind: "checkup", who: "mom" } } };
  const before = layDay(false, SESS), after = layDay(true, SESS);
  const card = (ts, sk) => ts.find(t => t.subjectKey === sk);
  ok("without the block the German card kept the subject's \"required\" (old behavior)", card(before, "german_flash_cards").mom === "required");
  ok("Solo German session → the German card is not Mom-required", card(after, "german_flash_cards").mom === "none", card(after, "german_flash_cards"));
  ok("Solo Daily mix stays not Mom-required", card(after, "daily_mix").mom === "none");
  ok("With Mom check-up session → Ellis's check-up card is Mom-required", card(after, "checkup").mom === "required", card(after, "checkup"));
  ok("lesson subjects keep their own flag", card(after, "math").mom === "required" && card(after, "spelling").mom === "required");
  const momCards = after.filter(t => t.mom === "required");
  ok("Mom-required cards still never overlap across kids (the check-up was laid in Mom's lane)",
    !momCards.some(a => momCards.some(b => b !== a && b.who !== a.who && ov(a, b))), momCards.map(t => t.who + " " + t.subjectKey + "@" + t.time));
  const noSess = layDay(true, {});
  ok("no sessions loaded → every card keeps the subject's flag", card(noSess, "german_flash_cards").mom === "required" && card(noSess, "checkup").mom === "none");
}

// ── d. REPLAY: live week28 Wednesday, Oct 21 ──────────────────────────────────────────────────────────
console.log("d. replay — week28 Wednesday Oct 21 (live snapshot, read-only GET 2026-10-24), through the real Mom loop");
// The day as the generator stored it: every retrieval slot "required", Match & Play included. Titles trimmed.
const WED = [
  ["2026d293_5698", "ellis", "10:00 AM", 5, "none", "📖 Morning Notebook", "morning_nb"],
  ["2026d293_5699", "lucy", "10:00 AM", 5, "maybe", "📖 Morning Notebook", "morning_nb"],
  ["2026d293_5700", "julian", "10:00 AM", 5, "required", "📖 Morning Notebook", "morning_nb"],
  ["lincoln_lincoln__outschool_german_L0005", "lincoln", "10:00 AM", 45, "none", "💻 Outschool German — Lesson 5", "outschool_german"],
  ["2026d293_retr_drill_ellis", "ellis", "10:05 AM", 15, "required", "🃏 Daily Drill", "retrieval", "drill"],
  ["ellis_ellis__daily_sci_L0031", "ellis", "10:20 AM", 15, "maybe", "📄 Daily Science", "daily_sci"],
  ["lucy_lucy__dimensions_math_1a_L0070", "lucy", "10:20 AM", 25, "required", "📄 Dimensions Math 1A — Story Problems", "dimensions_math_1a"],
  ["2026d293_retr_drill_julian", "julian", "10:28 AM", 5, "required", "🃏 Daily Drill", "retrieval", "drill"],
  ["2026d293_retr_match_julian", "julian", "10:33 AM", 10, "required", "🎯 Match & Play", "retrieval", "match"],
  ["2026d293_5704", "julian", "10:43 AM", 5, "required", "📖 Closing Notebook", "closing_nb"],
  ["2026d293_5697", "lincoln", "10:45 AM", 5, "none", "📖 Morning Notebook", "morning_nb"],
  ["2026d293_retr_drill_lucy", "lucy", "10:45 AM", 6, "required", "🃏 Daily Drill", "retrieval", "drill"],
  ["ellis_ellis__editor_chief_L0020", "ellis", "10:48 AM", 20, "required", "📱 Editor in Chief — Sitting 7", "editor_chief"],
  ["lincoln_lincoln__singapore_l_L0053", "lincoln", "10:49 AM", 25, "required", "📄 Singapore Math — 5B Ch.12 L6", "singapore_l"],
  ["2026d293_5708", "lincoln", "10:50 AM", 5, "none", "📄 Daily flash", "daily_flash"],
  ["2026d293_5711", "lincoln", "10:55 AM", 5, "none", "📄 Daily mix", "daily_mix"],
  ["2026d293_5705", "lincoln", "11:00 AM", 5, "none", "💻 science flash", "science_flash"],
  ["ellis_ellis__daily_geo_L0028", "ellis", "11:08 AM", 15, "maybe", "📄 Daily Geography", "daily_geo"],
  ["lincoln_lincoln__writeshop_i_student_workbook_L0023", "lincoln", "11:08 AM", 25, "required", "📖 WriteShop I — Lesson 1b", "writeshop_i_student_workbook"],
  ["lincoln_lincoln__mr_pages_L0047", "lincoln", "11:10 AM", 25, "maybe", "📄 MR5 Math Reasoning", "mr_pages"],
  ["ellis_ellis__read_detect_L0033", "ellis", "11:23 AM", 15, "maybe", "📄 Reading Detective", "read_detect"],
  ["2026d293_5724", "ellis", "11:30 AM", 15, "none", "💻 Reflex Math", "reflex"],
  ["2026d293_retr_sprint_lucy", "lucy", "11:30 AM", 2, "required", "🏃 Sprint", "retrieval", "sprint"],
  ["2026d293_5722", "ellis", "11:38 AM", 15, "none", "📖 Independent Reading", "independent_reading"],
  ["2026d293_5701", "lincoln", "11:43 AM", 25, "required", "💻 German Flash Cards", "german_flash_cards"],
  ["2026d293_5731", "lincoln", "11:44 AM", 5, "none", "📖 Closing Notebook", "closing_nb"],
  ["2026d293_retr_drill_lincoln", "lincoln", "12:05 PM", 2, "required", "🃏 Daily Drill", "retrieval", "drill"],
  ["2026d293_retr_sprint_lincoln", "lincoln", "12:05 PM", 2, "required", "🏃 Sprint", "retrieval", "sprint"],
  ["lincoln_lincoln__conventions_L0024", "lincoln", "12:08 PM", 15, "maybe", "📱 Editor in Chief — Sitting 8", "conventions"],
  ["ellis_ellis__word_roots_L0034", "ellis", "12:40 PM", 15, "required", "📄 Word Roots — L21", "word_roots"],
  ["2026d293_5703", "lucy", "2:40 PM", 20, "required", "📖 Read-Aloud", "read_aloud"],
  ["ellis_ellis__all_about_spelling_level_1_teacher_s_manual_L0007", "ellis", "3:05 PM", 25, "required", "📖 All About Spelling Level 1 — L7", "all_about_spelling_level_1_teacher_s_manual"],
  ["2026d293_5716", "lucy", "3:50 PM", 5, "none", "📖 Closing Notebook", "closing_nb"],
  ["2026d293_5730", "lincoln", "3:52 PM", 5, "required", "📄 Math Sprints", "math_sprints"],
  ["2026d293_retr_match_ellis", "ellis", "3:57 PM", 10, "required", "🎯 Match & Play", "retrieval", "match"],
  ["2026d293_5726", "ellis", "4:07 PM", 5, "none", "📖 Closing Notebook", "closing_nb"],
].map(r => { const t = { id: r[0], who: r[1], day: "wednesday", time: r[2], dur: r[3], mom: r[4], title: r[5], subjectKey: r[6] }; if (r[7]) t.retrieval = r[7]; return t; });
// The day as the next Generate stamps it: the generator's own rule (PRACTICE_SOLO retrSlotMom) on every retrieval slot.
const S = soloEnv();
const WED_NEW = WED.map(t => t.subjectKey === "retrieval" ? Object.assign({}, t, { mom: S.retrSlotMom(t.retrieval) }) : Object.assign({}, t));

const MOMLOOP = slice("// MOMLOOP_START", "// MOMLOOP_END");
function loop(tasks, o) {
  o = o || {};
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null, checked: o.checked || {}, momMoves: {},
    getActiveTasks: () => ctx.__tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap, esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = o.nowMin != null ? o.nowMin : 10 * 60;
  ctx._mlLunchOverride = [13 * 60, 14 * 60];
  Object.defineProperty(ctx, "_todayDay", { get: () => "wednesday" });
  vm.createContext(ctx);
  vm.runInContext(extractFn("toMin") + "\n" + extractFn("fromMin") + "\n" + MOMLOOP, ctx);
  vm.runInContext("momLoop=" + JSON.stringify({ cursor: 0, order: ["julian", "lucy", "lincoln", "ellis"] }) + ";", ctx);
  const laid = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx);
  ctx.__tasks = laid;
  const ids = e => vm.runInContext(e, ctx).map(t => t.id);
  return { laid, remaining: k => ids("mlRemaining(" + JSON.stringify(k) + ")"), done: k => vm.runInContext("mlDone(" + JSON.stringify(k) + ")", ctx),
    next: k => { const c = vm.runInContext("mlNextCard(" + JSON.stringify(k) + ")", ctx); return c && c.id; } };
}
const MJ = "2026d293_retr_match_julian", ME = "2026d293_retr_match_ellis";
{
  const was = loop(WED), now = loop(WED_NEW);
  ok("as stored, Julian's Match & Play was in Mom's loop", was.remaining("julian").indexOf(MJ) >= 0, was.remaining("julian"));
  ok("as stored, Ellis's Match & Play was in Mom's loop", was.remaining("ellis").indexOf(ME) >= 0);
  ok("new stamp: Julian's Match & Play is not Mom's work", now.remaining("julian").indexOf(MJ) < 0, now.remaining("julian"));
  ok("new stamp: Ellis's Match & Play is not Mom's work", now.remaining("ellis").indexOf(ME) < 0);
  ok("every drill and sprint is still in Mom's loop",
    WED.filter(t => t.retrieval && t.retrieval !== "match").every(t => now.remaining(t.who).indexOf(t.id) >= 0));
  const lane = now.laid.filter(t => t.mom === "required");
  ok("Mom's laid lane holds no Match & Play card", !lane.some(t => t.retrieval === "match"));
  ok("Mom's lane is still one card at a time (no two Mom cards overlap)",
    !lane.some(a => lane.some(b => b !== a && ov(a, b))), lane.filter(a => lane.some(b => b !== a && ov(a, b))).map(t => t.id + "@" + t.time));
  ok("nothing dropped by the lay", now.laid.length === WED.length && now.laid.every(t => !isNaN(toMin(t.time))));
}
{
  // 10:45 AM: Julian has done his notebook and drill with Mom, Closing Notebook too; Match & Play is still open.
  const chk = { "2026d293_5700": "10:05 AM", "2026d293_retr_drill_julian": "10:33 AM", "2026d293_5704": "10:45 AM" };
  const was = loop(WED, { checked: chk, nowMin: 10 * 60 + 45 }), now = loop(WED_NEW, { checked: chk, nowMin: 10 * 60 + 45 });
  ok("as stored, the loop still waited on Julian (his Match & Play held a Mom seat)", !was.done("julian") && was.next("julian") === MJ, was.next("julian"));
  ok("new stamp: the loop is done with Julian — Mom moves on; Match & Play is his own", now.done("julian") && now.next("julian") === null, now.remaining("julian"));
}
{
  // Ellis at 3:55 PM with everything Mom-required done: as stored she still owed Mom a 10-minute Match & Play.
  const chk = {}; WED.filter(t => t.who === "ellis" && t.mom === "required" && t.retrieval !== "match").forEach(t => { chk[t.id] = "done"; });
  const was = loop(WED, { checked: chk, nowMin: 15 * 60 + 55 }), now = loop(WED_NEW, { checked: chk, nowMin: 15 * 60 + 55 });
  ok("as stored, Ellis's Match & Play was her last Mom card", was.next("ellis") === ME);
  ok("new stamp: nothing of Ellis's waits on Mom", now.done("ellis"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
