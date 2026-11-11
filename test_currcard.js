/*
 * CURRCARD — one subject card, one pill function (Curriculum streamline slice 2, 2026-11-11;
 * PLAN_curriculum_streamline_2026-11-10.md §3.2 / §4 row 2; her answers to Q1 and Q2 on 2026-11-10:
 * "i like the rules table better than the builder i want to get away from builder except for the initial
 * setup" · "i dont want things repeating in multiple areas … all the options could be in one spot").
 *
 * What it proves, with the real code sliced out of index.html and replayed on stubs:
 *   (a) every per-subject field the ⚙ Rules table writes (20 rlSet fields + allowedDays) — and the 9 pacing
 *       leaves the card's Pace section now writes — has exactly ONE writer on the page, and rlSet / cbPinDay
 *       write the same paths and values as before for the same input (replayed; CURRCARD_VS=<old index.html>
 *       also replays the old file and compares);
 *   (b) cbApply's multi-path update is byte-identical for a given saved subject (fixture → expected update);
 *   (c) section visibility: the card is rendered over 11 fixtures (daily / sequenced × plan-backed / legacy ×
 *       paused × class × study × workbook × pages-with/without chapters × minutes × window) and EVERY handler
 *       the old card drew for that fixture — its own sections and the embedded Builder form — is still drawn,
 *       either as the same string or as its one documented replacement (the map below);
 *   (d) rlPillHTML is the one control: the table's cells and the card's Basics / When-it-runs call it, and for
 *       the same subject the two draw the same markup (the card only arms cbKid in front of the two handlers
 *       that read it);
 *   (e) the ⚙ Rules table's cells still write (rlSet / cbPinDay / cwdPinDay / lsdToggleDay) — no shortcuts;
 *   (f) the Pace section and its preview read the SAVED fields (cbDefaultForm), never a staged form;
 *   (g) RULESCROLL and _viewSig are untouched (test_rules_scroll.js still passes; the card never touches them);
 *   (h) no new Firebase write path: the set of ref(…) path patterns in the curriculum region is the same.
 *
 *   run:  node test_currcard.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const OLD_SRC = process.env.CURRCARD_VS ? fs.readFileSync(process.env.CURRCARD_VS, "utf8") : null;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 400) + ")" : "")); }
}
function braceSlice(S, name) { const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) return null; let d = 0, j = S.indexOf("{", i); for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function block(S, a, b) { const i = S.indexOf(a); if (i < 0) return ""; return S.slice(i, S.indexOf(b, i)); }
const fn = n => braceSlice(src, n) || "";
const CARD = fn("ceRenderEditSheet"), RULES = fn("cbRenderRules"), PILL = fn("rlPillHTML"), BLOCK = block(src, "// CURRCARD_START", "// CURRCARD_END");
const CODE_ONLY = t => t.replace(/^\s*\/\/.*$/gm, "").replace(/\/\/ [^'"\n]*$/gm, "");   // the code without its line comments

// ─────────────────────────────────────────────────────────────────────────────
// harness 1 · the subject card (auto-stubs every name it reaches for, one at a time — the card draws what the real code draws)
function fixture(fl) {
  const subj = { display: "Math", tracking: fl.daily ? "daily" : "sequenced", minutes: 30, mom: "required", device: "paper", allowedDays: ["Mon", "Wed", "Fri"], rules: "", priority: "normal", carryoverCap: 2, timesPerWeek: 3, cap: 2,
    lessonSeq: fl.daily ? undefined : ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4"] };
  if (fl.pacedMode) { subj.pacing = { mode: fl.pacedMode, tpw: 3, targetDate: "2027-05-01", windowEnd: "2027-05-01", minutesText: "30 min", pages: { totalPages: 120, startPage: 5, pattern: [3, 4], unitLabel: "pp.", units: fl.units ? [{ label: "Ch1", startPage: 5, endPage: 9, estMinutes: 20 }] : undefined } }; }
  if (fl.planBacked) { subj.planId = "kid__math"; subj.doneImportedAt = 1; subj.lessonIds = ["L0001", "L0002", "L0003", "L0004"]; }
  if (fl.paused) { subj.paused = true; subj.pausedSince = "2026-11-01T12:00:00Z"; }
  if (fl.cls) { subj.fixedTime = "10:00 AM"; subj.fixedDates = ["2026-11-12"]; subj.joinUrl = "https://x.y"; }
  if (fl.study) subj.study = "s1";
  if (fl.workbook) subj.workbook = "wb1";
  if (fl.scored) { subj.scored = true; subj.readingLog = true; subj.lessonUrl = "https://e.com/{lesson}"; subj.lessonUrls = { L0001: "https://o.com" }; subj.momPartMins = 10; subj.minMin = 5; }
  if (fl.momDays) { subj.momDays = [1]; subj.lessonDay = "Tue"; subj.stickyWith = "read"; subj.noCarry = true; subj.coopDay = 15; subj.noCoopDays = ["Mon", "Tue"]; }
  return subj;
}
function renderCard(S, fl, extraCtx, extraFns) {
  const subj = fixture(fl);
  const el = { innerHTML: "", querySelector: () => null, classList: { add() {}, remove() {} }, scrollTop: 0, style: {} };
  const parts = [block(S, "// CURRWORDS_START", "// CURRWORDS_END"), block(S, "// CURRCARD_START", "// CURRCARD_END"), braceSlice(S, "esc")];
  ["ceRenderEditSheet", "_ceMarkDoneUI", "cePracticeSectionHTML", "ceMomPartSectionHTML", "mmEditorSectionHTML", "cbPreviewCardHTML", "cbDefaultForm", "cbPacingLabel"].concat(extraFns || []).forEach(n => { const f = braceSlice(S, n); if (f) parts.push(f); });
  const lessons = {}; if (fl.legacyGrid) { lessons[1] = { week: "Wk 1", date: "2026-11-09", math: "Lesson 1" }; lessons[2] = { week: "Wk 1", date: "2026-11-16", math: "Lesson 2" }; }
  const done = {}; if (fl.planBacked && fl.someDone) done.math = { L0001: { src: "check" } };
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, parseFloat, Date, RegExp, Error, isNaN, Symbol,
    ceEditKid: "kid", ceEditKey: "math",
    currData: { subjects: { kid: { math: subj, read: { display: "Reading", tracking: "daily" }, hist: { display: "History", lessonSeq: ["a"] } } }, lessons: { kid: lessons }, done: { kid: done }, momVerifyKid: { kid: false } },
    paceData: { subjects: fl.paceRec ? { kid: { math: { keyword: "Math", startWeek: 1, offset: 1, adjust: 0, paceAdjust: 0, total: 4 } } } : {} },
    KID_COLOR: { kid: "#123456" }, CURR_DEV_EMOJI: { paper: "📄" }, CURR_DEV_LABEL: { paper: "Paper" }, DEFAULT_DAY_CAP: 2, ROSTER: ["kid", "other"],
    momModeActive: true, adminPinUnlocked: true, weekData: { tasks: [] }, checked: {}, walkbackData: {},
    ceGetSubject: () => subj, cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    momHere: () => true, planBacked: (k, sk) => !!(subj.planId && sk === "math"), lidStamped: (k, sk) => !!(subj.planId && sk === "math"),
    lidDoneIdx: () => { const out = new Set(); (subj.lessonIds || []).forEach((id, i) => { if (done.math && done.math[id]) out.add(i); }); return out; },
    lidDoneSet: () => new Set(Object.keys(done.math || {})),
    buildSubjectLessons: () => fl.legacyGrid ? [{ lesson: "Lesson 1", dayNum: 1 }, { lesson: "Lesson 2", dayNum: 2 }] : (subj.lessonSeq || []).map((l, i) => ({ lesson: l, dayNum: 90000 + i })),
    computeSubjectCursor: () => 0, paceAutoCount: () => 0, paceKeywords: () => ["Math"],
    mstSessions: () => fl.study ? [{ sid: "s1", name: "Latin", emoji: "📚" }] : [], wbList: () => fl.workbook ? [{ id: "wb1", name: "Book" }] : [], wbBook: () => ({ toc: 1 }), rlMode: () => "solo",
    fxIsClass: s => !!(s && s.fixedTime), ampmTo24: x => x, fxDoorMsg: "", llMsg: "", llPickKey: null, llLabelFor: () => "Open lesson", llLessonChoices: () => (subj.lessonIds || []).map((id, i) => ({ key: id, label: subj.lessonSeq[i], done: false })), llSafeUrl: x => x, llFillTemplate: x => x, llParseRef: () => ({}),
    subjectMilestoneBooks: () => [], ceConvUndoBanner: () => "", ceWalkOpen: false, ceConvOpen: false, ceWalkGather: () => [],
    lnMemberInfo: () => fl.lane ? { id: "L1", name: "Math", pos: 1, n: 2, state: "up", prior: false, multi: false, upLabel: "Math" } : null,
    coopsMap: () => fl.coop ? { c1: { mode: "timed", kids: ["kid"] } } : {}, coopDayRule: s => { if (!s || s.coopDay == null) return null; if (s.coopDay === "skip") return "skip"; const n = parseInt(s.coopDay, 10); return n > 0 ? n : null; },
    noCoopDaysOf: s => Array.isArray(s && s.noCoopDays) && s.noCoopDays.length ? s.noCoopDays : null, lessonDaySpan: () => fl.momDays ? 3 : 0, lessonDayList: s => Array.isArray(s.momDays) ? s.momDays.slice() : [],
    ldPin: s => s.lessonDay || null, ldMissMode: () => "next", ldPracticeMode: () => "drop", capFor: () => Math.max(1, parseInt(subj.cap, 10) || 1),
    cbExtendInfo: () => ({ lastDate: "2027-06-01" }), cbScanStatus: "", cbLastBuild: null, cbMsg: "", cbPreviewRes: null, cbKid: null, cbSubjKey: null, cbForm: null, ceGen: { prefix: "Lesson", count: 0 }, ceMoreOpen: null, ceBuildOpen: null,
    mmTargetOf: () => 0, mmShowOf: () => false, gwParseDate: d => new Date(d + "T12:00:00"),
    document: { getElementById: () => el, querySelector: () => null, body: { style: {}, classList: { add() {}, remove() {} } } }, requestAnimationFrame: () => 0, setTimeout: () => 0,
  };
  Object.assign(ctx, extraCtx || {}); ctx.window = ctx;
  vm.createContext(ctx);
  new vm.Script(parts.join("\n")).runInContext(ctx);
  // the block's own `let` state (ceMoreOpen, ceGen) shadows the context — set it the way the app would, by assignment
  ["ceMoreOpen", "ceGen"].forEach(k => { if (extraCtx && (k in extraCtx)) vm.runInContext(k + "=" + JSON.stringify(extraCtx[k]), ctx); });
  for (let tries = 0; tries < 400; tries++) {
    try { el.innerHTML = ""; vm.runInContext("ceRenderEditSheet()", ctx); return el.innerHTML; }
    catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m) throw e; ctx[m[1]] = function () { return ""; }; }
  }
  throw new Error("card harness: too many stubs");
}
const norm = h => h.replace(/\s+/g, " ").trim();
function handlers(html) { const out = []; const re = /\s(onclick|onchange|oninput)="([^"]*)"/g; let m; while ((m = re.exec(html))) out.push(norm(m[2])); return out; }

// harness 2 · the ⚙ Rules table (cbRenderRules + rlPillHTML over the same stubs)
function renderTable(S, fx) {
  const env = {
    currData: { subjects: { kid: fx.subjects }, dayCap: {} }, rulesData: {}, DEFAULT_DAY_CAP: 2, KID_COLOR: { kid: "#123456" },
    CURR_DEV_EMOJI: { paper: "📄", computer: "💻", "ipad/phone": "📱", book: "📖", keyboard: "🎹" }, CURR_DEV_LABEL: { paper: "Paper", computer: "Computer", "ipad/phone": "iPad/Phone", book: "Book", keyboard: "Keyboard" },
    cbKid: "kid", cbRulesOpen: true, cbFamilyRulesOpen: false, cbDayPinScroll: 0, cbGroupEdit: null,
    planBacked: (k, sk) => !!(fx.subjects[sk] || {}).planId, lidsFor: () => ["L0001"], cbDayCap: () => 180, cbOverCapDays: () => 0, lnRenderSection: () => "", lnMemberInfo: (k, sk) => (fx.lane || {})[sk] || null,
    coopsMap: () => fx.coops || {}, coopDayRule: s => { if (!s || s.coopDay == null) return null; if (s.coopDay === "skip") return "skip"; const n = parseInt(s.coopDay, 10); return n > 0 ? n : null; },
    noCoopDaysOf: s => { const a = s && s.noCoopDays; return Array.isArray(a) && a.length ? a : null; }, lessonDaySpan: s => (fx.span || {})[s.display] || 0, lessonDayList: s => Array.isArray(s.momDays) ? s.momDays.slice() : [],
    ldPin: s => s.lessonDay || null, ldMissMode: s => s.lessonDayMissed === "wait" ? "wait" : "next", ldPracticeMode: s => s.lessonDayPractice === "push" ? "push" : "drop", capFor: (k, sk) => Math.max(1, parseInt((fx.subjects[sk] || {}).cap, 10) || 1),
    esc: x => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"), cap: x => String(x).charAt(0).toUpperCase() + String(x).slice(1),
    document: { getElementById: () => null }, JSON, Object, Array, String, Number, Math, parseInt, console, Set, Symbol,
  };
  env.window = env; vm.createContext(env);
  new vm.Script(block(S, "// CURRWORDS_START", "// CURRWORDS_END") + "\n" + block(S, "// CURRCARD_START", "// CURRCARD_END") + "\n" + braceSlice(S, "cbRenderRules")).runInContext(env);
  env.render = () => env.cbRenderRules("#123456");
  env.pill = (sk, f, o) => env.rlPillHTML("kid", sk, f, o);
  return env;
}
const RICH = { subjects: {
  math: { display: "Math", rules: "sequential,first", minutes: 30, mom: "required", device: "paper", pacing: { mode: "timesPerWeek", tpw: 3 }, planId: "x", allowedDays: ["Mon", "Wed", "Fri"], noCoopDays: ["Mon", "Tue"], cap: 2, coopDay: 15, momDays: [1], momDayMin: 30, lessonDay: "Tue", lessonDayMissed: "wait", lessonDayPractice: "push", stickyWith: "read", stickyOrder: "before", noCarry: true, priority: "normal" },
  read: { display: "Reading", rules: "lastOwn", minutes: 10, tracking: "daily", device: "ipad", coopDay: "skip" },
  hist: { display: "History", rules: "last", minutes: 25, mom: "maybe", device: "book", priority: "low", lessonDay: "Fri" },
}, coops: { c1: { mode: "timed", kids: ["kid"] } }, span: { Math: 3 }, lane: { math: { id: "L1", name: "Math", pos: 1, n: 2, state: "up", prior: true, multi: false, upLabel: "Math" } } };

// harness 3 · rlSet / cbPinDay replayed with a stub db — the paths and values a tap writes
function writerWorld(S, subj, opts) {
  opts = opts || {};
  const log = { set: [], update: [], remove: [], relay: [], gv: [], toasts: [] };
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, parseFloat, Date, RegExp, Error, isNaN,
    currData: { subjects: { kid: { math: subj } } }, cbKid: "kid", cbSubjKey: null, cbDayPinScroll: 0,
    db: { ref: p => ({ set: v => log.set.push([p, v === undefined ? null : JSON.parse(JSON.stringify(v === undefined ? null : v))]), update: u => log.update.push([p, JSON.parse(JSON.stringify(u))]), remove: () => log.remove.push(p) }) },
    planBacked: () => !!opts.planBacked, _gvRelaySubject: (k, s) => { log.gv.push(k + "/" + s); return true; }, relayWeek: (k, o) => log.relay.push([k, o]), reprojectSubjectWeek: () => {},
    _rlwDailyOk: () => !!opts.daily, RLW_LAY_FIELDS: { mom: 1, momDays: 1, momDayMin: 1, lessonDay: 1, lessonDayMissed: 1, lessonDayPractice: 1, tpw: 1, cap: 1, minutes: 1, allowedDays: 1, noCoopDays: 1, coopDay: 1, rulesTok: 1, fixedTime: 1, device: 1 },
    _rlwFieldWords: f => f, gwShowToast: m => log.toasts.push(m), renderAll: () => {}, rsGrab: () => {}, dbg: () => {},
  };
  vm.createContext(ctx);
  new vm.Script([braceSlice(S, "rlSet"), braceSlice(S, "_rlwFieldUndo"), braceSlice(S, "cbPinDay")].join("\n")).runInContext(ctx);
  return { ctx, log, run: e => vm.runInContext(e, ctx), subj };
}
// the 20 Rules-table fields + allowedDays, each with a sample tap, and the path(s) it must write
const FIELDS = [
  ["tpw", "4", [["update", "curriculum/subjects/kid/math", { "pacing/tpw": 4, timesPerWeek: 4 }]]],
  ["cap", "3", [["set", "curriculum/subjects/kid/math/cap", 3]]],
  ["minutes", "35", [["set", "curriculum/subjects/kid/math/minutes", 35]]],
  ["noCoopDays", '["Mon","Tue"]', [["set", "curriculum/subjects/kid/math/noCoopDays", ["Mon", "Tue"]]]],
  ["coopDay", '"skip"', [["set", "curriculum/subjects/kid/math/coopDay", "skip"]]],
  ["mom", '"maybe"', [["set", "curriculum/subjects/kid/math/mom", "maybe"]]],
  ["momDays", "[1,3]", [["set", "curriculum/subjects/kid/math/momDays", [1, 3]]]],
  ["momDayMin", "25", [["set", "curriculum/subjects/kid/math/momDayMin", 25]]],
  ["lessonDay", '"Tue"', [["set", "curriculum/subjects/kid/math/lessonDay", "Tue"]]],
  ["lessonDayMissed", '"wait"', [["set", "curriculum/subjects/kid/math/lessonDayMissed", "wait"]]],
  ["lessonDayPractice", '"push"', [["set", "curriculum/subjects/kid/math/lessonDayPractice", "push"]]],
  ["device", '"book"', [["set", "curriculum/subjects/kid/math/device", "book"]]],
  ["priority", '"high"', [["set", "curriculum/subjects/kid/math/priority", "high"]]],
  ["rulesTok", '"first"', [["set", "curriculum/subjects/kid/math/rules", "first"]]],
  ["rulesTok", '"last"', [["set", "curriculum/subjects/kid/math/rules", "last"]]],
  ["rulesTok", '"lastOwn"', [["set", "curriculum/subjects/kid/math/rules", "lastOwn"]]],
  ["rulesTok", '"sequential"', [["set", "curriculum/subjects/kid/math/rules", "sequential"]]],
  ["stickyWith", '"read"', [["set", "curriculum/subjects/kid/math/stickyWith", "read"]]],
  ["stickyOrder", '"before"', [["set", "curriculum/subjects/kid/math/stickyOrder", "before"]]],
  ["noCarry", "true", [["set", "curriculum/subjects/kid/math/noCarry", true]]],
];
// the pacing leaves the card's Pace section writes (slice 2) — the same leaves cbApply writes inside the whole pacing node
const PACING = [
  ["pacing/mode", '"targetDate"', "targetDate"], ["pacing/targetDate", '"2027-05-01"', "2027-05-01"], ["pacing/windowEnd", '"2027-04-01"', "2027-04-01"], ["pacing/minutesText", '"20 min"', "20 min"],
  ["pacing/pages/totalPages", "120", 120], ["pacing/pages/startPage", "5", 5], ["pacing/pages/pattern", "[3,4]", [3, 4]], ["pacing/pages/unitLabel", '"Day"', "Day"], ["pacing/pages/units", '[{"label":"Ch1","startPage":5,"endPage":9,"estMinutes":20}]', [{ label: "Ch1", startPage: 5, endPage: 9, estMinutes: 20 }]],
];
function tap(S, field, val, opts) {
  const w = writerWorld(S, { display: "Math", minutes: 30, rules: "", pacing: opts && opts.pacing, allowedDays: ["Mon"] }, opts);
  w.run("rlSet('kid','math'," + JSON.stringify(field) + "," + val + "," + (opts && opts.relay ? "true" : "false") + ")");
  return w;
}
function writesOf(log) { return log.set.filter(x => x[0] !== "curriculum/lastEdit").map(x => ["set", x[0], x[1]]).concat(log.update.map(x => ["update", x[0], x[1]])); }

// harness 4 · cbApply replayed over one saved subject + one preview result, fixed clock
function replayApply(S) {
  const subj = { display: "Math", tracking: "sequenced", lessonSeq: ["L1", "L2", "L3", "L4", "L5"], lessonIds: ["L0001", "L0002", "L0003", "L0004", "L0005"], planId: "kid__math", doneImportedAt: 1, minutes: 30, allowedDays: ["Mon", "Wed"], days: "Mon Wed", timesPerWeek: 2,
    pacing: { mode: "pages", tpw: 2, targetDate: "2027-03-01", pages: { totalPages: 100, startPage: 3, pattern: [3, 4], unitLabel: "pp." }, builtThrough: "2027-01-01", builtAt: "x" }, pjExtras: { "2026-11-18": "L9" } };
  const lessons = { 1: { week: "Wk 1", date: "2026-11-09", math: "L1" }, 2: { week: "Wk 1", date: "2026-11-11", math: "L2" }, 3: { week: "Wk 2", date: "2026-11-16", math: "L3" }, 4: { week: "Wk 2", date: "2026-11-18" } };
  const ctx = { console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, parseFloat, RegExp, Error, isNaN, Symbol,
    Date: class extends Date { constructor(...a) { if (a.length) super(...a); else super("2026-11-12T15:00:00Z"); } static now() { return new Date("2026-11-12T15:00:00Z").getTime(); } },
    currData: { subjects: { kid: { math: subj } }, lessons: { kid: lessons }, weekDays: { kid: { "Wk 2": [3, 4] } }, skiplog: {}, rebaseline: {} },
    paceData: { subjects: {} }, scheduleOverrides: {}, saveScheduleOverrides: () => {}, HA_LS: { setItem() {}, removeItem() {} },
    cbKid: "kid", cbSubjKey: "math", cbForm: null, cbMsg: "", cbLastBuild: null, cbBacklogStash: {}, cbDecisions: {}, _rbInAll: false, _gvDelUndo: null,
    planBacked: () => true, computeSubjectCursor: () => 2, cbTodayISO: () => "2026-11-12", dbg: () => {}, rbLog: () => {}, buildCurrPaceCum: () => {}, relayWeek: () => {}, renderAll: () => {}, setLessonSeq: () => {},
    cbBacklogInfo: () => ({ split: { stale: [{ text: "L2", date: "2026-11-11", dayNum: 2 }], fresh: [] }, preDismiss: 0, dupFuture: false }),
    setSchedOverride: (d, k, mut) => { const o = (ctx.scheduleOverrides[d] = ctx.scheduleOverrides[d] || {}); o[k] = o[k] || {}; mut(o[k]); },
    writes: [], db: { ref: p => ({ update: u => { ctx.writes.push([p, "update", JSON.parse(JSON.stringify(u))]); return { catch() {} }; }, set: v => { ctx.writes.push([p, "set", v]); return { catch() {} }; } }) },
  };
  vm.createContext(ctx);
  new vm.Script(["cbApply", "cbPatchLocal", "cbPacingFromForm", "cbParsePattern", "cbDefaultForm"].map(n => braceSlice(S, n)).join("\n")).runInContext(ctx);
  vm.runInContext('cbForm=cbDefaultForm("kid","math")', ctx);
  ctx.cbPreviewRes = { clears: [3], assignments: [{ dayNum: 3, date: "2026-11-16", week: "Wk 2", text: "pp. 10–12" }, { dayNum: 4, date: "2026-11-18", week: "Wk 2", text: "pp. 13–16" }, { dayNum: 7, date: "2026-11-23", week: "Wk 3", text: "pp. 17–19", isNew: true }], placeholders: [{ dayNum: 8, date: "2026-11-25", week: "Wk 3" }], extras: [{ date: "2026-11-23", text: "pp. 20–22" }], stats: { placed: 3, lastDate: "2026-11-23", tpwUsed: 2 }, warnings: [] };
  vm.runInContext("cbApply()", ctx);
  return ctx.writes;
}
const APPLY_EXPECT = [["curriculum","update",{"lessons/kid/3/math":"pp. 10–12","lessons/kid/4/math":"pp. 13–16","lessons/kid/7":{"week":"Wk 3","date":"2026-11-23","math":"pp. 17–19"},"lessons/kid/8":{"week":"Wk 3","date":"2026-11-25"},"subjects/kid/math/pjExtras":{"2026-11-23":"pp. 20–22"},"weekDays/kid/Wk 3":[7,8],"lessons/kid/2/math":null,"rebaseline/kid/math":{"y":2026,"d":316,"ts":"2026-11-12T15:00:00.000Z"},"subjects/kid/math/pacing":{"mode":"pages","tpw":2,"pages":{"totalPages":100,"startPage":3,"pattern":[3,4],"unitLabel":"pp."},"targetDate":"2027-03-01","builtThrough":"2026-11-23","builtAt":"2026-11-12T15:00:00.000Z"},"subjects/kid/math/planAnchor":"2026-11-12","subjects/kid/math/allowedDays":["Mon","Wed"],"subjects/kid/math/days":null,"subjects/kid/math/timesPerWeek":2,"lastEdit":"2026-11-12T15:00:00.000Z","subjects/kid/math/total":4}]];

// the old card's handlers per fixture (rendered from main 6a36a97 with this same harness; the embedded Builder form open for sequenced ones)
const OLD = {
  "seqLegacy": {"fl":{},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceSetCount('paceAdjust',parseInt(this.value)||0)","ceSetTotal(parseInt(this.value)||1)","ceSetCount('adjust',parseInt(this.value)||0)","ceWalkToggle()","ceSaveLessonSeq(this.value)","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]},
  "seqPB": {"fl":{"planBacked":true,"pacedMode":"timesPerWeek","someDone":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('allowOutOfOrder',this.checked);ceRenderEditSheet()","ceSetCap(1)","ceSetCap(3)","ceRelayRemaining()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","llPick(this.value)","llSetOverride('L0001',this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceWalkToggle()","ceEditListLesson(0,this.value)","ceEditListLesson(1,this.value)","ceEditListLesson(2,this.value)","ceEditListLesson(3,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]},
  "daily": {"fl":{"daily":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceSetTracking('sequenced')","ceSetTracking('daily')","cePracticeSet('practiceFor',null)","cePracticeSet('practiceFor','hist')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":[]},
  "dailyStudy": {"fl":{"daily":true,"study":true,"coop":true,"momDays":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceSetTracking('sequenced')","ceSetTracking('daily')","cePracticeSet('practiceFor',null)","cePracticeSet('practiceFor','hist')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('study',null);ceRenderEditSheet()","ceSaveField('study','s1');ceSaveField('noCarry',true);ceRenderEditSheet()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":[]},
  "seqPBPaused": {"fl":{"planBacked":true,"pacedMode":"targetDate","paused":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('allowOutOfOrder',this.checked);ceRenderEditSheet()","ceSetCap(1)","ceSetCap(3)","ceRelayRemaining()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","llPick(this.value)","llSetOverride('L0001',this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceWalkToggle()","ceEditListLesson(0,this.value)","ceEditListLesson(1,this.value)","ceEditListLesson(2,this.value)","ceEditListLesson(3,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbSetField('targetDate',this.value)","cbRunPreview()","cbCopyTo('other')"]},
  "seqClass": {"fl":{"cls":true,"workbook":true,"scored":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","ceMomPartSet('momPartMins',5)","ceMomPartSet('momPartMins',15)","ceMomPartSet('momPartStart',this.checked)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","fxDoorToggle()","fxDoorSetTime(this.value)","ceSaveField('minutes',Math.max(5,parseInt(this.value,10)||45));ceRenderEditSheet();renderAll()","fxDoorSetDates(this.value)","fxDoorSetUrl(this.value)","llSetTemplate(this.value)","llSetLabel(this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',false);ceRenderEditSheet()","ceSaveField('readingLogBy','kid');ceRenderEditSheet()","ceSaveField('readingLogBy','mom');ceRenderEditSheet()","ceSaveField('workbook',null);ceRenderEditSheet();renderAll()","ceSaveField('workbook','wb1');ceRenderEditSheet();renderAll()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('scoreType','points');ceRenderEditSheet()","ceSaveField('scoreType','percent');ceRenderEditSheet()","ceSaveField('scoreType','rating');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceSetCount('paceAdjust',parseInt(this.value)||0)","ceSetTotal(parseInt(this.value)||1)","ceSetCount('adjust',parseInt(this.value)||0)","ceWalkToggle()","ceSaveLessonSeq(this.value)","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]},
  "seqPBPages": {"fl":{"planBacked":true,"pacedMode":"pages","units":true,"coop":true,"momDays":true,"lane":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('allowOutOfOrder',this.checked);ceRenderEditSheet()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","llPick(this.value)","llSetOverride('L0001',this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceWalkToggle()","ceEditListLesson(0,this.value)","ceEditListLesson(1,this.value)","ceEditListLesson(2,this.value)","ceEditListLesson(3,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbScanBook(this)","cbUnitField(0,'label',this.value)","cbUnitField(0,'startPage',this.value)","cbUnitField(0,'endPage',this.value)","cbUnitRemove(0)","cbUnitAdd()","cbUnitsClear()","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]},
  "seqPBPagesNoUnits": {"fl":{"planBacked":true,"pacedMode":"pages"},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('allowOutOfOrder',this.checked);ceRenderEditSheet()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","llPick(this.value)","llSetOverride('L0001',this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceWalkToggle()","ceEditListLesson(0,this.value)","ceEditListLesson(1,this.value)","ceEditListLesson(2,this.value)","ceEditListLesson(3,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbScanBook(this)","cbSetField('totalPages',this.value)","cbSetField('startPage',this.value)","cbSetField('patternStr',this.value)","cbSetField('targetDate',this.value)","cbSetField('unitLabel','pp.')","cbSetField('unitLabel','Lesson')","cbSetField('unitLabel','Day')","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]},
  "seqGrid": {"fl":{"legacyGrid":true,"paceRec":true},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceSetCount('paceAdjust',parseInt(this.value)||0)","ceSetTotal(parseInt(this.value)||1)","ceSetCount('adjust',parseInt(this.value)||0)","ceWalkToggle()","updatePaceField(ceEditKid,ceEditKey,'keyword',this.value)","updatePaceField(ceEditKid,ceEditKey,'startWeek',parseInt(this.value)||1)","ceEditLesson(1,this.value)","ceEditLesson(2,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]},
  "seqMinutes": {"fl":{"planBacked":true,"pacedMode":"minutes"},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('allowOutOfOrder',this.checked);ceRenderEditSheet()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","llPick(this.value)","llSetOverride('L0001',this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceWalkToggle()","ceEditListLesson(0,this.value)","ceEditListLesson(1,this.value)","ceEditListLesson(2,this.value)","ceEditListLesson(3,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbSetField('minutesText',this.value)","cbStepTpw(-1)","cbStepTpw(1)","cbSetField('windowEnd',this.value)","cbRunPreview()","cbCopyTo('other')"]},
  "seqWindow": {"fl":{"planBacked":true,"pacedMode":"window"},"closed":["if(event.target===this)ceCloseSheet()","ceRenameSubject(this.value)","ceOpenBuild('kid','math')","ceSetTracking('sequenced')","ceSetTracking('daily')","ceMomPartSet('momPartMins',null)","ceMomPartSet('momPartMins',10)","mmEditorSet('minMin',this.value)","mmEditorSet('minShow',this.checked)","ceSaveField('allowOutOfOrder',this.checked);ceRenderEditSheet()","fxDoorToggle()","llSetTemplate(this.value)","llSetLabel(this.value)","llPick(this.value)","llSetOverride('L0001',this.value)","ceToggleOverflow();ceRenderEditSheet()","ceToggleField('momVerify');ceRenderEditSheet()","ceSaveField('readingLog',true);ceRenderEditSheet()","ceToggleField('scored');ceRenderEditSheet()","ceSaveField('carryoverCap',Math.max(0,1));ceRenderEditSheet()","ceSaveField('carryoverCap',Math.min(5,3));ceRenderEditSheet()","ceWalkToggle()","ceEditListLesson(0,this.value)","ceEditListLesson(1,this.value)","ceEditListLesson(2,this.value)","ceEditListLesson(3,this.value)","ceConvOpen=true;ceRenderEditSheet()","var e=document.getElementById('ce-md-day');if(e)e.value=''","ceMarkLessonDone('kid','math','Lesson 1',false)","ceMarkLessonDone('kid','math','Lesson 1',true)","ceMarkLessonDone('kid','math','Lesson 2',false)","ceMarkLessonDone('kid','math','Lesson 2',true)","ceMarkLessonDone('kid','math','Lesson 3',false)","ceMarkLessonDone('kid','math','Lesson 3',true)","ceMarkLessonDone('kid','math','Lesson 4',false)","ceMarkLessonDone('kid','math','Lesson 4',true)","ceSaveField('completionPoints',Math.max(0,25));ceRenderEditSheet()","ceSaveField('completionPoints',75);ceRenderEditSheet()","ceSaveField('completionPoints',parseInt(this.value)||0);ceRenderEditSheet()","ceTogglePause()","ceCloseSheet()","ceDeleteSubject()"],"formOnly":["cbSetMode('targetDate')","cbSetMode('timesPerWeek')","cbSetMode('window')","cbSetMode('pages')","cbSetMode('minutes')","cbSetField('startDate',this.value)","cbToggleDay('Mon')","cbToggleDay('Tue')","cbToggleDay('Wed')","cbToggleDay('Thu')","cbToggleDay('Fri')","cbSetField('windowEnd',this.value)","cbStepTpw(-1)","cbStepTpw(1)","cbRunPreview()","cbCopyTo('other')"]}
};
// one documented replacement per retired handler string — the control keeps its function, its writer is now the one shared with the Rules table
const ADD_ONLY = [/^cbSetField\('startDate'/];   // "Start on" stays staged inside the guided Add only (her answer to Q1)
function mapOld(h) {
  let m;
  if (h === "ceOpenBuild('kid','math')" || h === "cbRunPreview()") return ["ceCardPreview()"];
  if ((m = /^ceSetCap\((\d+)\)$/.exec(h))) return ["rlSet('kid','math','cap'," + m[1] + ",true)"];
  if (/^ceSaveField\('minutes',/.test(h)) return [/^rlSet\('kid','math','minutes',\d+,true\)$/];
  if (h === "ceSaveField('study','s1');ceSaveField('noCarry',true);ceRenderEditSheet()") return ["ceSaveField('study','s1');rlSet('kid','math','noCarry',true,false);ceRenderEditSheet()"];
  if ((m = /^cbSetMode\('(\w+)'\)$/.exec(h))) return ["rlSet('kid','math','pacing/mode','" + m[1] + "',true)"];
  if ((m = /^cbSetField\('(targetDate|windowEnd|minutesText)',this\.value\)$/.exec(h))) return ["rlSet('kid','math','pacing/" + m[1] + "',this.value||null,true)"];
  if (h === "cbSetField('totalPages',this.value)") return ["rlSet('kid','math','pacing/pages/totalPages',parseInt(this.value)||0,true)"];
  if (h === "cbSetField('startPage',this.value)") return ["rlSet('kid','math','pacing/pages/startPage',parseInt(this.value)||1,true)"];
  if (h === "cbSetField('patternStr',this.value)") return ["rlSet('kid','math','pacing/pages/pattern',cbParsePattern(this.value),true)"];
  if ((m = /^cbSetField\('unitLabel','([^']+)'\)$/.exec(h))) return ["rlSet('kid','math','pacing/pages/unitLabel','" + m[1] + "',true)"];
  if (h === "cbSetField('genPrefix',this.value)") return ["ceGen.prefix=this.value"];
  if (h === "cbSetField('genCount',parseInt(this.value)||0)") return ["ceGen.count=parseInt(this.value)||0"];
  if ((m = /^cbToggleDay\('(\w+)'\)$/.exec(h))) return ["cbKid='kid';cbPinDay('math','" + m[1] + "')"];
  if (h === "cbStepTpw(-1)") return [/^rlSet\('kid','math','tpw',\d+,true\)$/];
  if (h === "cbStepTpw(1)") return [/^rlSet\('kid','math','tpw',\d+,true\)$/];
  if (/^cb(ScanBook|UnitField|UnitRemove|UnitAdd|UnitsClear)\(/.test(h)) return ["ceCardArm();" + h];
  if (h === "cbCopyTo('other')") return ["cbKid='kid';cbSubjKey='math';cbCopyTo('other')"];
  return [h];
}
function matches(want, set) { return (want instanceof RegExp) ? [...set].some(x => want.test(x)) : set.has(want); }

// ─────────────────────────────────────────────────────────────────────────────
console.log("the block, the pill function, the card's helpers");
{
  ok("CURRCARD block is marked", BLOCK.length > 2000 && src.indexOf("// CURRCARD_END") > src.indexOf("// CURRCARD_START"));
  ["rlPillHTML", "_rlCyc", "ceCardArm", "ceCardPreview", "ceCardSaveUnits", "ceCardDiscardUnits", "ceLaneEdit", "ceMoreToggle"].forEach(n => ok("defines " + n, BLOCK.indexOf("function " + n + "(") >= 0));
  ok("RL_PILL is the table's pill style, lifted unchanged", /const RL_PILL='display:inline-block;padding:2px 7px;border-radius:9px;border:1px solid var\(--border\);background:#fff;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';/.test(BLOCK));
  ok("cbPreviewCardHTML is the Builder's preview card, drawn by the form and the card", /function cbPreviewCardHTML\(col,s\)/.test(src) && /h\+=cbPreviewCardHTML\(col,s\);/.test(fn("cbRenderForm")) && /cbPreviewCardHTML\(col,s\)/.test(CARD));
  ok("rlPillHTML writes nothing itself (no db., no ref()", !/\bdb\.|\.ref\(/.test(PILL));
  ok("the Builder form is no longer drawn on the card (cbRenderForm / ceOpenBuild / _ceMaybeBuilder / 🧱 gone from its code)", !/cbRenderForm|ceOpenBuild|_ceMaybeBuilder|🧱/.test(CODE_ONLY(CARD)));
  ok("the Builder form itself still exists (the guided Add's form; the Builder tab until slice 3b)", fn("cbRenderForm").length > 1000 && /h\+=cbRenderForm\(col\);/.test(fn("renderCurrBuilder")));
  const cwKeys = (block(src, "var CW={", "\n};").match(/^\s{2}(\w+):/gm) || []).map(x => x.trim().replace(":", ""));
  ["secBasics", "secWhen", "secLessons", "secLane", "secChecking", "secLinks", "secRewards", "secFixups", "saveChapters", "editLane", "stackAfter", "handCounts"].forEach(k => ok("CW has " + k + " and the page uses it", cwKeys.indexOf(k) >= 0 && new RegExp('cw\\("' + k + '"').test(src)));
}

console.log("\n(d) one control drawn twice — the table's cells and the card's sections both call rlPillHTML");
{
  ok("cbRenderRules draws every cell through rlPillHTML(kid,sk,field,{col})", /const _P=f=>rlPillHTML\(kid,sk,f,\{col:col\}\);/.test(RULES) && (RULES.match(/_P\("/g) || []).length >= 12);
  ["days", "noCoopDays", "tpw", "cap", "minutes", "coopDay", "mom", "momDays", "lessonDay", "device", "priority", "order", "stickyWith", "noCarry", "seq"].forEach(f => ok("table cell: " + f, RULES.indexOf('_P("' + f + '")') >= 0));
  ok("the card draws its Basics / When-it-runs pills through rlPillHTML(K,SK,field,{col,arm:true})", /const _R=f=>rlPillHTML\(K,SK,f,\{col:col,arm:true\}\);/.test(CARD));
  ["days", "noCoopDays", "tpw", "cap", "minutes", "coopDay", "mom", "momDays", "lessonDay", "device", "priority", "order", "stickyWith", "noCarry", "seq"].forEach(f => ok("card pill: " + f, CARD.indexOf('_R("' + f + '")') >= 0));
  ok("no second pill implementation: cbRenderRules has no inline rlSet/cbPinDay handler of its own", !/onclick="rlSet|onclick="cbPinDay|_cyc\(/.test(RULES));
  ok("no second pill implementation: the card has no inline rlSet handler for a Rules-table field", !/onclick="rlSet\(\\''\+K\+'\\',\\''\+SK\+'\\',\\'(tpw|cap|minutes|mom|device|priority|rulesTok|stickyWith|stickyOrder|noCarry|coopDay|noCoopDays|momDays|momDayMin|lessonDay)/.test(CARD) && !/onclick="cbPinDay|cbToggleDay|cbStepTpw|cbSetMode|cbSetField/.test(CARD));
  // the same subject → the same markup, table and card (the card only arms cbKid before the two handlers that read it)
  const T = renderTable(src, RICH);
  ["days", "noCoopDays", "tpw", "cap", "minutes", "coopDay", "mom", "momDays", "lessonDay", "device", "priority", "order", "stickyWith", "noCarry", "seq"].forEach(f => {
    const a = T.pill("math", f, { col: "#123456" }), b = T.pill("math", f, { col: "#123456", arm: true });
    ok("same markup for " + f + " (card = table + cbKid arm on cbPinDay/cwdPinDay only)", a.length > 0 && b.replace(/cbKid='kid';/g, "") === a && ((f === "days" || f === "noCoopDays") ? b.indexOf("cbKid='kid';") >= 0 : b === a), [a.slice(0, 80), b.slice(0, 80)]);
  });
  ok("rlPillHTML output is embedded verbatim in the rendered table", (() => { const h = T.render(); return h.indexOf(T.pill("math", "tpw", { col: "#123456" })) >= 0 && h.indexOf(T.pill("math", "lessonDay", { col: "#123456" })) >= 0 && h.indexOf(T.pill("read", "coopDay", { col: "#123456" })) >= 0; })());
  ok("rlPillHTML output is embedded verbatim in the rendered card", (() => { const h = renderCard(src, { planBacked: true, pacedMode: "timesPerWeek", momDays: true, coop: true }); const c = renderTable(src, { subjects: { math: fixture({ planBacked: true, pacedMode: "timesPerWeek", momDays: true, coop: true }), read: { display: "Reading", tracking: "daily" }, hist: { display: "History", lessonSeq: ["a"] } }, coops: { c1: { mode: "timed", kids: ["kid"] } }, span: { Math: 3 } }); return h.indexOf(c.pill("math", "tpw", { col: "#123456", arm: true })) >= 0 && h.indexOf(c.pill("math", "days", { col: "#123456", arm: true })) >= 0 && h.indexOf(c.pill("math", "momDays", { col: "#123456", arm: true })) >= 0; })());
}

console.log("\n(e) the ⚙ Rules table's cells still WRITE (Q2: it stays a live editor, not shortcuts)");
{
  const T = renderTable(src, RICH); const h = T.render(); const hs = handlers(h);
  ok("every cell handler is a writer (rlSet / cbPinDay / cwdPinDay / lsdToggleDay) — none opens the card", hs.filter(x => /rlSet\(|cbPinDay\(|cwdPinDay\(|lsdToggleDay\(/.test(x)).length === hs.filter(x => !/cbCapStep|cbSetCap|cwdUseMonThu|setAdminSub/.test(x)).length && !hs.some(x => /ceOpenEdit/.test(x)));
  [["cbPinDay('math','Mon')", "Days"], ["cwdPinDay('math','Mon')", "no-co-op days"], ["rlSet('kid','math','tpw',4,true)", "×/wk"], ["rlSet('kid','math','cap',3,true)", "cap"], ["rlSet('kid','math','minutes',35,true)", "minutes"], ["rlSet('kid','math','coopDay','skip',true)", "co-op day"], ["lsdToggleDay('kid','math',2)", "Mom days"], ["rlSet('kid','math','momDayMin',25,false)", "Mom minutes"], ["rlSet('kid','math','lessonDay','Wed',false)", "new-lesson day"], ["rlSet('kid','math','lessonDayMissed','next',false)", "if missed"], ["rlSet('kid','math','lessonDayPractice','drop',false)", "missed practice"], ["rlSet('kid','math','device','computer',false)", "device"], ["rlSet('kid','math','priority','high',true)", "priority"], ["rlSet('kid','math','rulesTok','first',false)", "first"], ["rlSet('kid','math','rulesTok','sequential',false)", "sequential"], ["rlSet('kid','math','stickyWith',this.value||null,false)", "sticky"], ["rlSet('kid','math','stickyOrder','after',false)", "sticky order"], ["rlSet('kid','math','noCarry',false,false)", "no-carry"], ["rlSet('kid','hist','mom','required',false)", "mom (cycles)"]]
    .forEach(([w, lbl]) => ok("table writes " + lbl, hs.indexOf(w) >= 0, hs.filter(x => x.indexOf(lbl.split(" ")[0]) >= 0).slice(0, 3)));
  ok("the Rules table box still tracks its scroll (RULESCROLL)", /id="cb-daypin-scroll" onscroll="rsGrab\(\)"/.test(h));
}

console.log("\n(a) one writer per field — on the page, and the same paths and values as before");
{
  const T = renderTable(src, RICH); const th = handlers(T.render());
  const ch = handlers(renderCard(src, { planBacked: true, pacedMode: "pages", units: true, coop: true, momDays: true, lane: true, scored: true, cls: true, workbook: true, study: true }))
    .concat(handlers(renderCard(src, { planBacked: true, pacedMode: "targetDate" })), handlers(renderCard(src, { planBacked: true, pacedMode: "pages" })), handlers(renderCard(src, { planBacked: true, pacedMode: "minutes" })));
  // every write a handler string carries: {writer, field} — a Rules-table field, a card field, or a Builder staged setter
  const writesIn = h => { const out = []; let m; const re = /\b(rlSet|ceSaveField|ceSetCap|cbPinDay|cwdPinDay|lsdToggleDay|cbToggleDay|cbStepTpw|cbSetMode|cbSetField)\(([^)]*)/g;
    while ((m = re.exec(h))) { const w = m[1], a = m[2]; let f = null;
      if (w === "rlSet") f = (/^'kid','\w+','([\w/]+)'/.exec(a) || [])[1]; else if (w === "ceSaveField" || w === "cbSetField") f = (/^'([\w/]+)'/.exec(a) || [])[1]; else if (w === "ceSetCap") f = "cap"; else if (w === "cbPinDay" || w === "cbToggleDay") f = "allowedDays"; else if (w === "cwdPinDay") f = "noCoopDays"; else if (w === "lsdToggleDay") f = "momDays"; else if (w === "cbStepTpw") f = "tpw"; else if (w === "cbSetMode") f = "pacing/mode";
      if (f) out.push({ writer: w, field: f }); } return out; };
  const byField = {};
  th.concat(ch).forEach(h => writesIn(h).forEach(x => (byField[x.field] = byField[x.field] || new Set()).add(x.writer)));
  const EXPECT = { allowedDays: "cbPinDay", noCoopDays: "cwdPinDay", momDays: "lsdToggleDay", tpw: "rlSet", cap: "rlSet", minutes: "rlSet", coopDay: "rlSet", mom: "rlSet", momDayMin: "rlSet", lessonDay: "rlSet", lessonDayMissed: "rlSet", lessonDayPractice: "rlSet", device: "rlSet", priority: "rlSet", rulesTok: "rlSet", stickyWith: "rlSet", stickyOrder: "rlSet", noCarry: "rlSet", "pacing/mode": "rlSet", "pacing/targetDate": "rlSet" };
  Object.entries(EXPECT).forEach(([f, w]) => ok("field " + f + " has exactly one writer on the page: " + w, byField[f] && byField[f].size === 1 && byField[f].has(w), byField[f] ? [...byField[f]] : "not drawn"));
  ok("the card has NO second writer for a Rules-table field (ceSetCap, ceSaveField('cap'|'minutes'|'noCarry'|'device'|'mom'), cbToggleDay, cbStepTpw)", !ch.some(x => /ceSetCap\(|ceSaveField\('(cap|minutes|noCarry|device|mom|priority|allowedDays|tpw)'|cbToggleDay|cbStepTpw/.test(x)), ch.filter(x => /ceSetCap|ceSaveField\('(cap|minutes|noCarry)/.test(x)));
  ok("cwdPinDay and lsdToggleDay still funnel into rlSet (one writer underneath)", /rlSet\(kid,sk,"noCoopDays"/.test(fn("cwdPinDay")) && /rlSet\(kid,sk,"momDays"/.test(fn("lsdToggleDay")));
  // replay: every field writes the same path and value for the same input as before
  FIELDS.forEach(([f, v, want]) => {
    const w = tap(src, f, v, {}); const got = writesOf(w.log);
    ok("rlSet " + f + "=" + v + " → " + want.map(x => x[1]).join(" + "), JSON.stringify(got) === JSON.stringify(want), got);
    if (OLD_SRC) { const o = writesOf(tap(OLD_SRC, f, v, {}).log); ok("  …same as the old file", JSON.stringify(o) === JSON.stringify(got), o); }
  });
  { const w = tap(src, "tpw", "9", {}); ok("tpw clamps 1–7 as before", JSON.stringify(writesOf(w.log)) === JSON.stringify([["update", "curriculum/subjects/kid/math", { "pacing/tpw": 7, timesPerWeek: 7 }]])); }
  { const w = tap(src, "rulesTok", '"last"', {}); w.run("rlSet('kid','math','rulesTok','first',false)"); ok("rulesTok first clears last (same token rules)", w.subj.rules === "first" && w.log.set.filter(x => x[0].endsWith("/rules")).pop()[1] === "first"); }
  { const w = tap(src, "mom", '"maybe"', {}); ok("every rlSet write stamps curriculum/lastEdit", w.log.set.some(x => x[0] === "curriculum/lastEdit")); }
  // cbPinDay — allowedDays, with the legacy `days` string retired on the same tap
  { const w = writerWorld(src, { display: "Math", allowedDays: ["Mon"], days: "Mon Tue" }, {}); w.run("cbPinDay('math','Wed')");
    ok("cbPinDay writes allowedDays and removes the legacy days string", JSON.stringify(w.log.set) === JSON.stringify([["curriculum/subjects/kid/math/allowedDays", ["Mon", "Wed"]]]) && w.log.remove[0] === "curriculum/subjects/kid/math/days", w.log);
    if (OLD_SRC) { const o = writerWorld(OLD_SRC, { display: "Math", allowedDays: ["Mon"], days: "Mon Tue" }, {}); o.run("cbPinDay('math','Wed')"); ok("  …same as the old file", JSON.stringify(o.log.set) === JSON.stringify(w.log.set) && o.log.remove[0] === w.log.remove[0]); } }
  // the card's Days pin arms cbKid first — so a card open for another kid than the Rules table writes the RIGHT kid
  { const w = writerWorld(src, { display: "Math", allowedDays: [] }, {}); w.ctx.cbKid = "someoneElse"; w.ctx.currData.subjects.someoneElse = {};
    w.run("cbKid='kid';cbPinDay('math','Fri')"); ok("the card's armed pin writes this card's kid", w.log.set[0] && w.log.set[0][0] === "curriculum/subjects/kid/math/allowedDays" && w.ctx.cbKid === "kid", w.log.set); }
  // the pacing leaves (slice 2): one leaf each, same path cbApply writes inside the whole pacing node
  PACING.forEach(([f, v, want]) => {
    const w = tap(src, f, v, { planBacked: true, relay: true, pacing: { mode: "timesPerWeek", tpw: 3 } });
    ok("rlSet " + f + " → one leaf set, then the Builder re-lay (laid-out subject)", JSON.stringify(writesOf(w.log)) === JSON.stringify([["set", "curriculum/subjects/kid/math/" + f, want]]) && w.log.gv.length === 1, [writesOf(w.log), w.log.gv]);
  });
  { const w = tap(src, "pacing/mode", '"pages"', { planBacked: true, relay: true, pacing: undefined });
    ok("a subject never laid out only SAVES the pacing leaf — no re-lay (its first lay-out is Put it on the schedule, with its preview)", w.log.gv.length === 0 && w.subj.pacing && w.subj.pacing.mode === "pages" && writesOf(w.log).length === 1, [w.log.gv, w.subj.pacing]); }
  { const w = tap(src, "pacing/pages/totalPages", "120", { planBacked: true, relay: true, pacing: { mode: "pages", tpw: 2 } }); ok("a nested leaf creates the pages node locally and writes only the leaf", w.subj.pacing.pages.totalPages === 120 && writesOf(w.log)[0][1] === "curriculum/subjects/kid/math/pacing/pages/totalPages"); }
  { const w = tap(src, "pacing/targetDate", "null", { planBacked: true, relay: true, pacing: { mode: "targetDate", targetDate: "2027-01-01" } }); ok("null clears a pacing leaf (set(null)) and the local mirror", w.subj.pacing.targetDate === undefined && writesOf(w.log)[0][2] === null); }
  { const w = tap(src, "pacing/mode", '"minutes"', { planBacked: false, relay: true, pacing: { mode: "pages" } }); ok("a legacy (not plan-backed) subject saves without the Builder re-lay — as every Rules-table tap does today", w.log.gv.length === 0 && w.subj.pacing.mode === "minutes"); }
  ok("the pacing branch rides the generic path pattern (no new ref() text)", /else if\(field\.indexOf\("pacing\/"\)===0\)\{/.test(fn("rlSet")) && (fn("rlSet").match(/db\.ref\("curriculum\/subjects\/"\+kid\+"\/"\+sk\+"\/"\+field\)\.set\(val===undefined\?null:val\)/g) || []).length === 2);
}

console.log("\n(b) cbApply's multi-path update is byte-identical for a given saved subject");
{
  const got = replayApply(src);
  ok("one curriculum update, exactly the expected paths and values", JSON.stringify(got) === JSON.stringify(APPLY_EXPECT), got);
  if (OLD_SRC) ok("  …same as the old file", JSON.stringify(replayApply(OLD_SRC)) === JSON.stringify(got));
  ok("cbApply source: the pacing node is still written whole from the (saved-field) form", /const pacing=cbPacingFromForm\(\);/.test(fn("cbApply")) && /up\["subjects\/"\+kid\+"\/"\+sk\+"\/pacing"\]=pacing;/.test(fn("cbApply")));
}

console.log("\n(c) section visibility — every pre-existing control still appears for every condition pair");
{
  Object.entries(OLD).forEach(([name, o]) => {
    const fl = o.fl;
    let N = new Set(handlers(renderCard(src, fl)));
    handlers(renderCard(src, fl, { ceMoreOpen: "kid|math" })).forEach(x => N.add(x));   // ⋯ open → Delete
    if (!fl.daily) {
      const f = { mode: fl.pacedMode || "timesPerWeek", tpw: 3, allowedDays: ["Mon"], units: null };
      handlers(renderCard(src, fl, { cbKid: "kid", cbSubjKey: "math", cbForm: f, cbPreviewRes: { stats: { placed: 3, tpwUsed: 3, firstDate: "a", lastDate: "b" }, clears: [], warnings: [], assignments: [] } })).forEach(x => N.add(x));   // a preview armed → ✓ / Cancel
      handlers(renderCard(src, fl, { cbLastBuild: { kid: "kid", sk: "math" }, cbMsg: "done" })).forEach(x => N.add(x));   // after a build → ↩ Undo
    }
    const missing = [];
    o.closed.concat(o.formOnly).forEach(h => { if (ADD_ONLY.some(r => r.test(h))) return; if (!mapOld(h).some(w => matches(w, N))) missing.push(h); });
    ok(name + ": all " + (o.closed.length + o.formOnly.length) + " old controls still drawn (" + N.size + " handlers now)", missing.length === 0, missing);
    // the conditions themselves, one for one
    const hasPace = [...N].some(x => /pacing\/mode/.test(x));
    ok(name + ": Pace section only for a sequenced subject", hasPace === !fl.daily);
    ok(name + ": Delete only behind ⋯", !handlers(renderCard(src, fl)).includes("ceDeleteSubject()") && N.has("ceDeleteSubject()"));
  });
  ok("Start on (cbSetField('startDate')) is drawn only by the Builder form (the guided Add) — not on the card", !/startDate/.test(CARD) && /cbSetField\(\\'startDate\\'/.test(fn("cbRenderForm")));
  // the nine sections, in the plan's order, after the header's ⏸ toggle and before Done
  const h = renderCard(src, { planBacked: true, pacedMode: "timesPerWeek", lane: true });
  const idx = ["ceTogglePause()", "1 · The basics", "2 · When it runs", "3 · The lessons", "4 · Pace", "5 · Lane", "6 · Checking off", "7 · Links & supplies", "8 · Rewards", "9 · Fix-ups", ">Done<"].map(s => h.indexOf(s));
  ok("header ⏸ · 1 Basics · 2 When it runs · 3 Lessons · 4 Pace · 5 Lane · 6 Checking off · 7 Links · 8 Rewards · 9 Fix-ups · Done, in that order", idx.every((v, i) => v >= 0 && (i === 0 || v > idx[i - 1])), idx);
  const hd = renderCard(src, { daily: true });
  ok("a daily keeps its catch-up chip (When it’s behind) even without a Pace section", /ceToggleOverflow\(\)/.test(hd) && !/pacing\/mode/.test(hd));
  ok("the old 'live in ⚙ Rules above the Grid' note is gone — the settings are on the card now", !/live in <b>/.test(CARD));
  ok("the lane line is drawn once (Lane section), not again under Progress", (h.match(/🛤 Math · 1 of 2/g) || []).length === 1);
}

console.log("\n(f) the Pace section and its preview read the SAVED fields, never a staged form");
{
  ok("the Pace section reads cbDefaultForm(K,SK) — the saved subject with the engine's own fallbacks", /const pf=cbDefaultForm\(K,SK\);/.test(CARD) && !/cbForm\.(mode|targetDate|windowEnd|totalPages|startPage|patternStr|unitLabel|minutesText|tpw|allowedDays)\b/.test(CARD));
  ok("ceCardPreview re-arms cbForm from the saved fields, then runs the Builder's own preview", /cbForm=cbDefaultForm\(ceEditKid,ceEditKey\); cbPreviewRes=null;/.test(fn("ceCardPreview")) && /cbRunPreview\(\);/.test(fn("ceCardPreview")));
  // a stale staged form (mode minutes) armed for this subject; the saved mode is targetDate → the card shows targetDate
  const h = renderCard(src, { planBacked: true, pacedMode: "targetDate" }, { cbKid: "kid", cbSubjKey: "math", cbForm: { mode: "minutes", tpw: 3, allowedDays: [], units: null, minutesText: "zzz" } });
  ok("render: the selected mode chip is the SAVED one, not the staged form's", /class="ce-chip sel" onclick="rlSet\('kid','math','pacing\/mode','targetDate',true\)"/.test(h) && !/class="ce-chip sel" onclick="rlSet\('kid','math','pacing\/mode','minutes',true\)"/.test(h) && h.indexOf("zzz") < 0);
  ok("render: the Finish-by input shows the saved date", /value="2027-05-01" onchange="rlSet\('kid','math','pacing\/targetDate',this\.value\|\|null,true\)"/.test(h));
  // replay ceCardPreview: a stale cbForm is replaced by the saved fields before the preview runs
  const ctx = { ceEditKid: "kid", ceEditKey: "math", currData: { subjects: { kid: { math: { pacing: { mode: "pages", tpw: 2, pages: { totalPages: 50 } }, allowedDays: ["Tue"] } } } }, cbKid: "kid", cbSubjKey: "math", cbForm: { mode: "minutes" }, cbPreviewRes: { stale: 1 }, ceGen: { prefix: "Unit", count: 4 }, previews: 0, JSON, Object, String, parseInt };
  vm.createContext(ctx); vm.runInContext(fn("ceCardPreview") + "\n" + fn("cbDefaultForm") + "\nfunction cbRunPreview(){ previews++; }", ctx); vm.runInContext("ceCardPreview()", ctx);
  ok("replay: cbForm is rebuilt from the saved pacing (pages, 50 pages, Tue) and the preview runs once", ctx.cbForm.mode === "pages" && ctx.cbForm.totalPages === 50 && ctx.cbForm.allowedDays[0] === "Tue" && ctx.previews === 1, ctx.cbForm);
  ok("replay: the only staged bits are the generated-lesson names (Prefix / How many)", ctx.cbForm.genPrefix === "Unit" && ctx.cbForm.genCount === 4);
  ok("the preview card is drawn on the card only while armed for THIS subject", /if\(cbPreviewRes&&_armed\) h\+=/.test(CARD) && /const _armed=\(cbKid===K&&cbSubjKey===SK&&!!cbForm\);/.test(CARD));
  // chapters: edited with the Builder's own unit controls, kept on one tap through rlSet
  ok("Save chapters writes the pages leaves then units with the re-lay — through rlSet only", /rlSet\(kid,sk,"pacing\/pages\/totalPages",parseInt\(f\.totalPages\)\|\|0,false\);/.test(fn("ceCardSaveUnits")) && /rlSet\(kid,sk,"pacing\/pages\/units",u,true\);/.test(fn("ceCardSaveUnits")) && !/db\./.test(fn("ceCardSaveUnits")));
  const hu = renderCard(src, { planBacked: true, pacedMode: "pages", units: true }, { cbKid: "kid", cbSubjKey: "math", cbForm: { mode: "pages", tpw: 3, allowedDays: [], units: [{ label: "Ch1", startPage: 5, endPage: 9, estMinutes: 20 }, { label: "Ch2", startPage: 10, endPage: 12, estMinutes: 20 }] } });
  ok("edited chapters show as 'not saved yet' with Save / Discard; untouched ones show no such button", /not saved yet/.test(hu) && /ceCardSaveUnits\(\)/.test(hu) && !/ceCardSaveUnits\(\)/.test(renderCard(src, { planBacked: true, pacedMode: "pages", units: true })));
}

console.log("\n(g) RULESCROLL and _viewSig untouched");
{
  let rs = "";
  try { rs = cp.execFileSync(process.execPath, [path.join(__dirname, "test_rules_scroll.js")], { encoding: "utf8" }); } catch (e) { rs = String(e.stdout || e.message); }
  ok("test_rules_scroll.js still passes", /\b0 failed\b|passed, 0 failed|^(?![\s\S]*FAIL)/.test(rs) && !/FAIL/.test(rs), rs.slice(-200));
  ok("rlSet and cbPinDay still grab the Rules box before their write", /if\(typeof rsGrab==="function"\) rsGrab\(\);/.test(fn("rlSet")) && /if\(typeof rsGrab==="function"\) rsGrab\(\);/.test(fn("cbPinDay")));
  ok("the card never touches _viewSig, the Rules box scroll or the window scroll", !/_viewSig|cbDayPinScroll|scrollTo\(|rsRestore|rsGrab/.test(CARD) && !/_viewSig|cbDayPinScroll|window\.scroll/.test(BLOCK));
  ok("the card still restores its own box scroll on an in-place re-render (as before)", /const _prevScroll=_prevBox\?_prevBox\.scrollTop:0;/.test(CARD) && /_nb\.scrollTop=_prevScroll;/.test(CARD));
}

console.log("\n(h) no new Firebase write path in the curriculum region");
{
  function refs(S) { const a = S.indexOf("function ceOpenEdit("), b = S.indexOf("function renderCurrBuilder("); const reg = S.slice(a, b); const o = new Set(); const re = /\bref\(((?:[^()]|\([^()]*\))*)\)/g; let m; while ((m = re.exec(reg))) o.add(m[1].replace(/\s+/g, "")); return [...o].sort(); }
  const WAS = [
  "",
  "\"act_favs\"",
  "\"archive/\"+it.wk+\"/checked/\"+it.doneKey",
  "\"archive/\"+it.wk+\"/history/\"+it.doneKey",
  "\"calendar/coopMomDays/\"+ds",
  "\"calendar/coops/\"+id",
  "\"calendar/coops/\"+id+\"/noMomBase\"",
  "\"calendar/events/\"+id",
  "\"calendar/events/\"+id+\"/pending\"",
  "\"calendar/holidays/\"+id",
  "\"calendar/kidOverrides/\"+kid+\"/\"+date",
  "\"calendar/vacations/\"+id",
  "\"config/routineBonus/\"+slot+\"/\"+kid",
  "\"config/rules/familyBlocks/\"+path",
  "\"config/rules/maxPerDay\"",
  "\"config/zoneBonus\"",
  "\"config/zonePlan\"",
  "\"config/zones\"",
  "\"curriculum\"",
  "\"curriculum/dayCap/\"+kid",
  "\"curriculum/done/\"+t.who+\"/\"+t.subjectKey+\"/\"+t.lid",
  "\"curriculum/lanes/\"+kid+\"/\"+id",
  "\"curriculum/lanes/\"+u.kid+\"/\"+u.id",
  "\"curriculum/lastEdit\"",
  "\"curriculum/lessons/\"+kid",
  "\"curriculum/lessons/\"+kid+\"/\"+dayNum+\"/\"+key",
  "\"curriculum/momVerifyKid/\"+k",
  "\"curriculum/rebaseline/\"+kid+\"/\"+sk",
  "\"curriculum/resources\"",
  "\"curriculum/skiplog/\"+kid+\"/\"+sk",
  "\"curriculum/subjects/\"+ceAddKid+\"/\"+k+\"/rules\"",
  "\"curriculum/subjects/\"+ceEditKid+\"/\"+ceEditKey+\"/\"+field",
  "\"curriculum/subjects/\"+ceEditKid+\"/\"+ceEditKey+\"/lessonUrls/\"+k",
  "\"curriculum/subjects/\"+kid",
  "\"curriculum/subjects/\"+kid+\"/\"+key",
  "\"curriculum/subjects/\"+kid+\"/\"+key+\"/paused\"",
  "\"curriculum/subjects/\"+kid+\"/\"+key+\"/pausedSince\"",
  "\"curriculum/subjects/\"+kid+\"/\"+key+\"/planAnchor\"",
  "\"curriculum/subjects/\"+kid+\"/\"+sk",
  "\"curriculum/subjects/\"+kid+\"/\"+sk+\"/\"+f",
  "\"curriculum/subjects/\"+kid+\"/\"+sk+\"/\"+field",
  "\"curriculum/subjects/\"+kid+\"/\"+sk+\"/allowedDays\"",
  "\"curriculum/subjects/\"+kid+\"/\"+sk+\"/days\"",
  "\"curriculum/subjects/\"+kid+\"/\"+sk+\"/manualDone\"",
  "\"curriculum/subjects/\"+kid+\"/\"+sk+\"/rules\"",
  "\"curriculum/subjects/\"+toKid+\"/\"+sk",
  "\"curriculum/targetEnd/\"+kid",
  "\"curriculum…\"",
  "\"famProgress/\"+id+\"/\"+key+\"/done\"",
  "\"mastery/\"+k+\"_settings/definitions\"",
  "\"mastery/\"+kid",
  "\"mastery/\"+kid+\"_custom_items\"",
  "\"mastery/\"+kid+\"_idflash\"",
  "\"mastery/\"+kid+\"_sessions/\"+ENV_SESSION_SID",
  "\"mastery/\"+kid+\"_settings/cat_gate\"",
  "\"mastery/\"+kid+\"_settings/cat_hold\"",
  "\"mastery/\"+kid+\"_settings/cat_instructions\"",
  "\"mastery/\"+kid+\"_settings/cat_instructions_kid\"",
  "\"mastery/\"+kid+\"_settings/cat_intro_max\"",
  "\"mastery/\"+kid+\"_settings/cat_modes\"",
  "\"mastery/\"+kid+\"_settings/definitions\"",
  "\"mastery/\"+kid+\"_settings/envReadAloud\"",
  "\"mastery/\"+kid+\"_tests/\"+station+\"/postOpen\"",
  "\"mastery/studyLog/\"+kid+\"/\"+ENVFLASH_SID+\"/\"+todayKey",
  "\"notebookActivities\"",
  "\"notebookActivities/\"+cat+\"/\"+bookId",
  "\"notebookBookPages/\"+book+\"/ans/\"+p",
  "\"notebookBookPages/\"+c.book+\"/\"+kind+\"/\"+k",
  "\"notebookDocs/\"+kid+\"/\"+wk+\"/parent\"",
  "\"notebookDocs/\"+kid+\"/\"+wk+\"/student\"",
  "\"notebookPersonal\"",
  "\"notebookSettings/\"+k+\"/juPicks/\"+wk",
  "\"notebookSettings/\"+kid+\"/\"+node+\"/\"+path",
  "\"notebookSettings/\"+kid+\"/dailyGrams/\"+key",
  "\"notebookSettings/\"+kid+\"/dailyGrams/cursor\"",
  "\"notebookSettings/\"+kid+\"/extraPages/\"+key",
  "\"notebookSettings/\"+kid+\"/letterCursor\"",
  "\"notebookSettings/\"+kid+\"/nbLevel/\"+key",
  "\"notebookSettings/\"+kid+\"/nbMode\"",
  "\"notebookSettings/\"+kid+\"/notebookName\"",
  "\"notebookSettings/\"+kid+\"/notebookTheme\"",
  "\"notebookSettings/\"+kid+\"/numberCursor\"",
  "\"notebookSettings/\"+kid+\"/reviewCap\"",
  "\"notebookSettings/\"+kid+\"/unitDays/\"+unitId",
  "\"notebookSettings/\"+v.kid+\"/checks/\"+v.wk+\"/\"+a.day+\"/\"+a.slot",
  "\"notebookSettings/bindingMargin\"",
  "\"notebookStories/\"+kid+\"/week\"+wn",
  "\"pace/\"+r.path",
  "\"pace/plans/\"+key",
  "\"pace/subjects/\"+k+\"/\"+key",
  "\"pace/subjects/\"+kid+\"/\"+key",
  "\"pace/subjects/\"+kid+\"/\"+sk",
  "\"pace/subjects/\"+kid+\"/\"+sk+\"/adjust\"",
  "\"scheduleOverrides/\"+dt+\"/\"+kid",
  "\"supplies/staples\"",
  "\"supplies/staples/\"+id",
  "\"unitLog/\"+uid+\"/\"+dayId+\"/\"+kid",
  "\"unitStudies/\"+id",
  "\"unitStudies/\"+id+\"/decks/\"+dk+\"/cards/\"+ck+\"/ch\"",
  "\"unitStudies/\"+id+\"/track\"",
  "\"unitStudies/\"+id+\"/track/\"+field",
  "\"unitStudies/\"+id+\"/track/days/\"+k",
  "\"unitStudies/\"+id+\"/track/days/\"+k+\"/\"+part",
  "\"unitStudies/\"+u.id",
  "\"unitStudies/\"+u.id+\"/planDismiss/\"+kid",
  "\"unitStudies/\"+uid+\"/opening/\"+key",
  "\"unitStudies/\"+uid+\"/opening/poem\"",
  "\"unitStudies/\"+uid+\"/opening/sound\"",
  "\"unitStudies/\"+uid+\"/track/craft\"",
  "\"unitStudies/\"+uid+\"/track/days/\"+x.k+\"/res/docs\"",
  "\"unitStudies/\"+uid+\"/track/days/\"+x.k+\"/snack\"",
  "\"unitStudies/\"+unitBatch.unitId+\"/decks/\"+di+\"/cards\"",
  "\"unitStudies/\"+unitEdit.unitId",
  "\"unitStudies/\"+unitEdit.unitId+\"/decks/\"+di+\"/cards/\"+ci+\"/bio\"",
  "\"unitStudies/\"+unitEdit.unitId+\"/decks/\"+di+\"/cards/\"+ci+\"/def\"",
  "\"unitStudies/\"+unitId+\"/activities/\"+i+\"/points\"",
  "\"unitStudies/\"+unitId+\"/activityClaims/\"+kid+\"/\"+actKey",
  "\"unitStudies/\"+unitId+\"/activityLog/\"+kid+\"/\"+actKey",
  "\"unitStudies/\"+unitId+\"/decks/\"+di+\"/flipFace\"",
  "\"unitStudies/\"+unitId+\"/enrolled/\"+kid",
  "\"unitStudies/\"+unitId+\"/kidStage/\"+kid",
  "\"unitStudies/\"+unitId+\"/nbActivity/\"+kid",
  "\"unitStudies/\"+unitId+\"/nbInsert\"",
  "\"unitStudies/\"+unitId+\"/planDismiss/\"+kid+\"/\"+key",
  "\"unitStudies/\"+unitPics.unitId+\"/visuals\"",
  "\"unitStudies/\"+unitPlanEdit.unitId+\"/plan\"",
  "\"walkback_excl/\"+base",
  "\"walkbacks\"",
  "\"walkbacks/\"+ceEditKid+\"/\"+wid",
  "\"workbooks/\"+bookId",
  "\"workbooks/\"+id",
  "\"workbooks/\"+id+\"/imgs/\"+p",
  "WK+\"/celeb_used/\"+key",
  "WK+\"/checked\"",
  "WK+\"/checked/\"+x.id",
  "WK+\"/claimed\"",
  "WK+\"/famPaid/\"+famPaidKey(t)",
  "WK+\"/famPaid/\"+key",
  "WK+\"/history\"",
  "WK+\"/history/\"+it.doneKey",
  "WK+\"/history/\"+x.id",
  "WK+\"/relayLog/\"+at",
  "WK+\"/relayLog/\"+k",
  "WK+\"/tasks\"",
  "WK+\"/tasks/\"+id",
  "WK+\"/tasks/\"+id+\"/fixedAt\"",
  "WK+\"/tasks/\"+id+\"/nbRedo\"",
  "WK+\"/tasks/\"+x.id+\"/famAbsent\"",
  "base",
  "base+\"/game\"",
  "base+\"/pre\"",
  "dir+\"p\"+p+\".jpg\"",
  "lrPath(kid,sk,key,part)",
  "nbtInkPath(v.kid,v.wk,pg)",
  "nbtInkPath(v.kid,v.wk,v.page)",
  "nk",
  "p",
  "path",
  "path+\"/\"+id",
  "pr[1]",
  "uxPdfPath(uid,dayId,file.name)",
  "wbInkPath(v.kid,v.bookId,v.page)",
  "wk+\"/supplies\"",
  "wk+\"/supplies/\"+id",
  "x"
];
  const now = refs(src);
  const added = now.filter(x => WAS.indexOf(x) < 0), gone = WAS.filter(x => now.indexOf(x) < 0);
  ok("the same " + WAS.length + " ref() path patterns as main 6a36a97 — none added, none gone", added.length === 0 && gone.length === 0 && now.length === WAS.length, { added, gone });
  if (OLD_SRC) ok("  …and the old file agrees with the embedded list", JSON.stringify(refs(OLD_SRC)) === JSON.stringify(WAS));
  ok("no whole-node set of a subject / tasks / checked anywhere in the block or the card", !/\.set\(\s*(s|subj|currData|tasks|checked)\s*\)/.test(BLOCK + CARD));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
