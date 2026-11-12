/*
 * Node tests for CURRWORDS — one label map for every word on the Curriculum page (slice 1 of
 * PLAN_curriculum_streamline_2026-11-10.md, §3.5 "The words — before → after").
 *
 * Her words 2026-11-10: "simple enough another mom could figure this out … i dont want things
 * repeating in multiple areas" — and she picked the plan's wording. Words only: no logic, no
 * layout, no writes.
 *
 * Checks
 *   1. the CURRWORDS block and cw() exist; cw(key) returns the map value, falls back to the key,
 *      fills {kid} / {n}
 *   2. every §3.5 "before" word is gone from the on-screen strings of the Curriculum page's draw
 *      functions (code comments are allowed — they cite the old words on purpose)
 *   3. every §3.5 "after" word is in the map, and every map key is used outside the block
 *   4. a real render of the Grid (toolbar, headers, banners, footer) and of the subject card
 *      (renderCurrGrid / ceRenderEditSheet over stub data) shows no "before" word
 *   5. the markup is otherwise unchanged: the render with the map set to identity (cw(key) = key)
 *      has the same tag/attribute skeleton as the render with the real map — only text nodes and
 *      title text differ. With CURRWORDS_VS=<path to a pre-CURRWORDS index.html> the same skeleton
 *      is compared against that file's render too (the one-time check against main:
 *      git show origin/main:index.html > /tmp/main.html; CURRWORDS_VS=/tmp/main.html node test_currwords.js)
 *
 *   run:  node test_currwords.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const OLD = process.env.CURRWORDS_VS ? fs.readFileSync(process.env.CURRWORDS_VS, "utf8") : null;

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 600) + ")" : "")); } }

function _block(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return S.slice(i, j); }
function _braceSlice(S, name) {
  const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = S.indexOf("{", i);
  for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
function _cwBlock(S) { const i = S.indexOf("// CURRWORDS_START"), j = S.indexOf("// CURRWORDS_END"); return i < 0 ? "" : S.slice(i, j); }
// a top-level function's source: from its "function name(" to the next top-level "function " line
function fnSrc(S, name) {
  const i = S.indexOf("\nfunction " + name + "("); if (i < 0) return null;
  const j = S.indexOf("\nfunction ", i + 10); return S.slice(i + 1, j < 0 ? S.length : j);
}
// drop code comments: whole // lines and trailing " // …" comments
function noComments(code) { return code.split("\n").filter(l => !/^\s*\/\//.test(l)).map(l => l.split(/\s\/\/\s/)[0]).join("\n"); }

// ── synthetic curriculum: 3B (2 cells, 1 left) → 4A (NO cells) ; Geo+Sci multiple card ──
const TODAY = "2026-09-13";     // Sunday; rows Mon 9/14 …
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function subj(display, n, days, tpw, extra) {
  const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1));
  return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display,
    allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw }, minutes: 15, mom: "none", device: "paper", rules: "" }, extra || {});
}
function lessonsRows(weeks) {
  const L = {}; const t0 = Date.UTC(2026, 8, 7); let dn = 100;   // start a week BEFORE today so there are past rows
  for (let d = 0; d < weeks * 7; d++) { const dt = new Date(t0 + d * 86400000); const dow = dt.getUTCDay(); if (dow === 0 || dow === 6) continue;
    L[++dn] = { date: dt.toISOString().slice(0, 10), week: "Wk " + (1 + Math.floor(d / 7)) }; }
  return L;
}
function world(S, o) {
  const block = (x, y) => _block(S, x, y), braceSlice = n => _braceSlice(S, n);
  const CURRWORDS = _cwBlock(S);
  o = o || {};
  const subjects = { s3b: subj("Singapore 3B", 3, ["Mon", "Wed", "Fri"], 3), s4a: subj("DM 4A", 4, ["Tue"], 1), geo: subj("Daily Geo", 6, ["Mon"], 1), sci: subj("Daily Sci", 6, ["Mon"], 1), plain: subj("Plain", 3, ["Thu"], 1) };
  const lessons = lessonsRows(4);
  // stored cells: 3B has a PAST cell (done) and a future cell; plain has one; 4A has NONE
  const dns = Object.keys(lessons).map(Number);
  lessons[dns[0]].s3b = "Singapore 3B L1";          // Mon 9/7 — past, done
  lessons[dns[5]].s3b = "Singapore 3B L2";          // Mon 9/14 — future (stale text; derived will decide)
  lessons[dns[3]].plain = "Plain L1"; lessons[dns[8]].plain = "Plain L2"; lessons[dns[13]].plain = "Plain L3";   // keeps the grid drawn through week 3
  lessons[dns[1]].geo = "Daily Geo L1"; lessons[dns[1]].sci = "Daily Sci L1";   // Tue 9/8 — both ran, before the lane existed
  const done = { s3b: { L0001: { ts: 1, day: "2026-09-07" } }, geo: { L0001: { ts: 1, day: "2026-09-08" } }, sci: { L0001: { ts: 1, day: "2026-09-08" } } };
  if (o.finish3b) { done.s3b.L0002 = { ts: 1, day: "2026-09-09" }; done.s3b.L0003 = { ts: 1, day: "2026-09-10" }; }
  const lanes = o.lanes === undefined ? { math: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }] },
    gs: { name: "Geo/Sci", units: [{ subs: ["geo", "sci"], pattern: "AB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 1 }] } } : o.lanes;
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, Date, RegExp, Error,
    currData: { subjects: { kid: subjects }, done: { kid: done }, lessons: { kid: lessons }, lanes: lanes ? { kid: lanes } : undefined, skiplog: {} },
    scheduleOverrides: {}, checked: {}, weekData: { tasks: [] }, paceData: { subjects: {} },
    gvKid: "kid", gvShowPast: true, gvSelMode: false, gvSel: new Set(), gvSelAnchor: null, gvEdit: null, gvMenu: null, gvSelUndo: null, lmMovePick: null, lmMoveWeek: null,
    cbRulesOpen: false, cbKid: "kid", cbGate: null, KID_COLOR: { kid: "#123456" }, DAY_DT: {}, momModeActive: true, adminPinUnlocked: false,
    dbg: () => {}, cbTodayISO: () => TODAY, gwParseDate: s => { const p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
    cbExtendInfo: () => null, cbBlockedDates: () => [], cbDayCap: () => 0, cbOverCapDays: () => 0, cbAltGroups: () => ({}), cbGroupOf: () => null,
    smapIsKidOff: () => false, schedOvKidOff: () => false, schedOv: () => null, coopBlocksBase: () => false, coopNoMomBaseFor: () => "", coopsOnDate: () => [],
    computeFutureSlots: () => ({}), retrTracks: () => [], formatPlanDate: d => d, cap: s => s, cbRenderRules: () => "", cbRenderGate: () => "",
    document: { getElementById: () => null, querySelector: () => null }, setTimeout: () => 0,
    ROSTER: ["kid"], currViewKid: "kid", gvKidCfgOpen: false, cbMsg: "", cbLastBuild: null, momVerifyKid: null, lmLastMove: null, gvScrollTop: 0, gvScrollLeft: 0, RETR_SLOT_TITLE: {},
    ceRenderSessions: () => "", ceConvUndoBanner: () => "", fbRender: () => "", gvAuditRender: () => "", alignPlanPreview: () => null,
    pacePhantomKeys: () => [], lidUnassigned: () => [], lidImportPending: () => [], lidOutOfOrderAll: () => [], skiplogLeftovers: () => [], dayTokenLeftovers: () => [],
    capLeftovers: () => ({ items: [], orphans: [], node: null }), planPending: () => [], gvNoSeqSubjects: () => [], gvMissingDays: () => [], gvSelFilledCount: () => 0, gvSelSingleSubject: () => null,
    retrDayKinds: () => [], retrSlotMinutes: () => 15, momHere: () => true,
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    cbDoneCellSet: (k, sk, cells) => { const di = ctx.lidDoneIdx(k, sk); if (!di) return null; const seq = subjects[sk].lessonSeq; const out = new Set(); cells.forEach((c, i) => { const idx = seq.indexOf(c.text); if (idx >= 0 && di.has(idx)) out.add(i); }); return out; },
    _lidNorm: s => String(s == null ? "" : s).replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(),
  };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys(done[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  ctx.cbRemainingContent = (k, sk) => { const di = ctx.lidDoneIdx(k, sk) || new Set(); return (subjects[sk].lessonSeq || []).filter((_, i) => !di.has(i)); };
  // real cbFutureRows needs a few more readers; a faithful stub over the same lessons object
  ctx.cbFutureRows = (kid, sk) => Object.keys(lessons).map(Number).sort((a, b) => a - b).filter(dn => lessons[dn].date > TODAY).map(dn => ({ dayNum: dn, date: lessons[dn].date, week: lessons[dn].week, dow: DOW[new Date(lessons[dn].date + "T12:00:00").getDay()], off: false, usedMin: 0, hadMine: ctx.gvFilled(lessons[dn][sk]) }));
  const CODE = [
    braceSlice("esc"), braceSlice("_cbSpread"), braceSlice("_cbParseDate"), braceSlice("_cbISO"), braceSlice("_cbMonday"), braceSlice("cbDefaultForm"), braceSlice("planIdFor"),
    braceSlice("gvSubjectCols"), braceSlice("cbHasGridCells"), braceSlice("cbCardOnlySubjects"), braceSlice("cbOtherSubjects"),
    block("// PROJ_START", "// PROJ_END"), block("// PLANDROP_START", "// PLANDROP_END"),
    block("function planMaterialize", "// Owed only (for chips)"), block("function planOwed", "// PLANMAT_END"),
    block("// LANE_START", "// LANE_END"), block("// GVDER_START", "// GVDER_END"), block("// GRIDEND_START", "// GRIDEND_END"),
    braceSlice("renderCurrGrid"),
  ].join("\n");
  vm.createContext(ctx);
  new vm.Script(CURRWORDS + "\n" + CODE).runInContext(ctx);
  ctx._lessons = lessons; ctx._dns = dns;
  return ctx;
}
function renderGrid(S, identity) {
  const c = world(S);
  c.cbRebuildable = () => true;   // so the toolbar draws its Lay everything out again button
  if (identity) vm.runInContext("CW={};", c);
  const el = { innerHTML: "" }; c.renderCurrGrid(el); return el.innerHTML;
}

// ── the subject card: ceRenderEditSheet (+ its Mark-done panel and section helpers) over one stub
// subject. Anything else it calls is stubbed to "" one name at a time, so the card draws exactly
// what the real code draws for this subject.
function renderCard(S, identity, over) {
  const subj = Object.assign({ display: "Math", tracking: "sequenced", lessonSeq: ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4"],
    timesPerWeek: 3, pacing: { mode: "timesPerWeek", tpw: 3 }, cap: 2, minutes: 30, mom: "required", momVerify: true, device: "paper",
    carryoverCap: 2, allowedDays: ["Mon", "Wed", "Fri"], rules: "", priority: "normal" }, (over || {}).subj || {});
  const el = { innerHTML: "", querySelector: () => null, classList: { add() {}, remove() {} }, scrollTop: 0, style: {} };
  const parts = [_cwBlock(S), _braceSlice(S, "esc")];
  ["ceRenderEditSheet", "_ceMarkDoneUI", "cePracticeSectionHTML", "ceMomPartSectionHTML", "mmEditorSectionHTML"].forEach(n => { const f = fnSrc(S, n); if (f) parts.push(f); });
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, parseFloat, Date, RegExp, Error, isNaN,
    ceEditKid: "kid", ceEditKey: "math", currData: { subjects: { kid: { math: subj, read: { display: "Reading", tracking: "daily" } } }, lessons: { kid: {} }, done: { kid: {} } },
    paceData: { subjects: {} }, KID_COLOR: { kid: "#123456" }, CURR_DEV_EMOJI: { paper: "📄" }, CURR_DEV_LABEL: { paper: "Paper" },
    momVerifyKid: { kid: false }, momModeActive: true, adminPinUnlocked: true, weekData: { tasks: [] }, checked: {},
    ceGetSubject: () => subj, cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    document: { getElementById: () => el, querySelector: () => null, body: { style: {}, classList: { add() {}, remove() {} } } }, requestAnimationFrame: () => 0, setTimeout: () => 0, window: {},
  };
  Object.assign(ctx, (over || {}).ctx || {});
  ctx.window = ctx;
  vm.createContext(ctx);
  new vm.Script(parts.join("\n")).runInContext(ctx);
  if (identity) vm.runInContext("CW={};", ctx);
  for (let tries = 0; tries < 400; tries++) {
    try { el.innerHTML = ""; vm.runInContext("ceRenderEditSheet()", ctx); return el.innerHTML; }
    catch (e) {
      const m = /^(\w+) is not defined/.exec(e.message);
      if (!m) throw e;
      ctx[m[1]] = function () { return ""; };
    }
  }
  throw new Error("card harness: too many stubs");
}

// the markup with every text node and every title/placeholder text emptied: what's left is the
// tags, their attributes and their order
function skeleton(html) {
  return String(html).replace(/(title|placeholder|aria-label)="[^"]*"/g, '$1=""').replace(/>[^<]*</g, "><").replace(/^[^<]*/, "").replace(/[^>]*$/, "");
}
const sha = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
const decode = s => String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rarr;/g, "→").replace(/&#8595;/g, "↓");
const visible = html => decode(String(html).replace(/<[^>]*\btitle="([^"]*)"[^>]*>/g, " $1 ").replace(/<[^>]*>/g, " "));

// ── §3.5, row by row: the words on screen before, and the plain words after ────────────────
// "before" = the exact fragments the page drew (as they sat in the source); "after" = the label.
const ROWS = [
  { before: ["Rules &amp; day cap", "Per-subject placement rules"], after: ["📅 {kid}’s year ▸ All subjects", "All subjects"] },
  { before: ["Target · Mom Check · Sessions"], after: ["📅 {kid}’s year"] },
  { before: ["Daily cap — no day over", ">min/day · '"], after: ["Longest school day", "minutes"] },
  { before: ["Finish Line Target"], after: ["Finish the year by"] },
  { before: ["School Sessions", "Session dates anchor the week numbering"], after: ["School terms", "Term dates set which week is week 1."] },
  { before: ["require my approval for"], after: ["You approve {kid}’s check-offs"] },
  { before: ["Mom Requirement", '["maybe","Maybe"]', 'maybe:"Maybe"', '["required","Required"]', 'required:"Required"'], after: ["Needs you?", "No", "Sometimes", "Yes"] },
  { before: ['ce-sheet-lbl">Device<', '"Device","Priority"'], after: ["Where it happens"] },
  { before: ["Duration (minutes)</div>", '"Cap","Min"', "set those with Duration and Days"], after: ["How long"] },
  { before: ["Times Per Week", "×/wk", "Times per week"], after: ["How many times a week"] },
  { before: ["Days it can land on", "none selected = any school day", '["Subject","Days"'], after: ["Days of the week", "(none lit = any school day)"] },
  { before: ["most sittings of this subject", '"Cap","Min"'], after: ["Most in one day"] },
  { before: ["Second sitting", "a second sitting", ">2nd</span>", "one sitting per day", "sittings</b>"], after: ["twice in one day", "again"] },
  { before: ["Lesson Tracking", ">Sequenced<", "Daily (no lesson #)", "Use Daily tracking"], after: ["Lessons in order?", "In order", "The same every day"] },
  { before: ["Scheduling Rules", 'RULE_LABEL={last:"last of day"', ">First</span>", ">Last of day</span>", ">Last of own work</span>", '["sequential","seq"]'], after: ["Order in the day", "in order", "First thing", "Last thing", "Last of their own work"] },
  { before: ["Stick with:", "\">Before</div>", "\">After</div>", '"First/last","Sticky"'], after: ["Right after", "Right before", "Right after / before"] },
  { before: ["No-carry", '?"day-bound":"carries"'], after: ["If it’s missed", "comes back tomorrow", "skip it"] },
  { before: ["Carryover Cap"], after: ["How many missed ones can pile up"] },
  { before: ['"Priority","First/last"', ">Priority</div>", "x.charAt(0).toUpperCase()+x.slice(1); })(s.priority"], after: ["If the day is tight", "do it last", "normal", "do it first"] },
  { before: ["a class that happens at a fixed clock time", "a class at a fixed clock time", "packed into the day", "Set time <span"], after: ["A class at a set time", "Off — the app picks the time"] },
  { before: ["Meeting dates", "optional, but exact"], after: ["The dates it meets"] },
  { before: ["Pacing &amp; build", "re-lay the plan"], after: ["Pace"] },
  { before: ["How should it be paced", "Done by a date", "} Days per week\"", "} Pages\""], after: ["How to pace it", "Finish by a date", "So many a week", "Until a date", "By pages", "Just minutes"] },
  { before: ["Preview build", "Build into map", "✓ Build —"], after: ["Preview", "Put it on the schedule", "Lay it out again"] },
  { before: ["Rebuild all", "Re-lay all"], after: ["Lay everything out again"] },
  { before: ["Re-lay remaining"], after: ["Catch up — spread what’s left from today"] },
  { before: ["re-lay", "re-lays", "re-laid", "Re-laid"], after: ["the week updates", "moves the rest"], afterAnywhere: true },
  { before: ["laid from where", "actually is"], after: ["starting from where {kid} is"] },
  { before: ["a kid with no grid yet", "nothing lands before this day"], after: ["(optional — nothing before this day)"] },
  { before: ["real boundaries", "overrides the pattern below"], after: ["Chapters", "(one a day — replaces the pages-per-day pattern)"] },
  { before: ["Scan the book", "Photograph the table of contents"], after: ["📸 Photo of the table of contents"] },
  { before: ["plan-backed", "One truth", "one truth", "Builder-paced", "master list", "master lesson list"], after: ["uses its lesson list as the record"] },
  { before: [">owed '", "' owed on '", "' owed — ", "owed count"], after: ["behind by"] },
  { before: ["When behind", "Extras can use other days", "Only its own days"], after: ["When it’s behind", "catch up on any school day", "only on its own days"] },
  { before: ["Fix false check-offs", "Walk back check-offs"], after: ["Undo check-offs that weren’t really done"] },
  { before: ["Mark a lesson done", "through here", "Make done contiguous"], after: ["Mark done", "this and everything before it", "put the skipped ones back"] },
  { before: ["the weekly lesson this daily card practices"], after: ["Practice for"] },
  { before: ["Timed card <span", "a minimum before it can be checked", "Edit Subject ▸ ⏱ Timed card)"], after: ["Can’t be checked off before (minutes)"] },
  { before: ["Mom\\u2019s part", "how much of the"], after: ["Your part of it"] },
  { before: ["Not in the Grid/Map yet", "not in the grid yet", "No lessons to pace"], after: ["Not on the schedule yet", "Runs every day (no lessons to lay out)"] },
  { before: ["a category: units run in order", "single card", "multiple card", "Rhythm:", "same as the one before", "↑ same as before", "unit before it", "first unit"], after: ["Lanes — books that take turns in one column", "book", "one book", "several books taking turns", "Days & times:", "same as the book before", "its own"] },
  { before: ["⤓ retire", ">retired: "], after: ["File it away", "filed away"] },
  { before: ["Lesson Map", "Extends the map", "into the map", "on the map", "end of the map", "the map lost"], after: ["the grid", "adds {n} school days to the grid"] },
  { before: ["keep or dismiss", "Keep all", "Dismiss all", "skipped earlier", "'✕ Dismiss'", "'↪ Keep'"], after: ["Leftover lessons — do them later, or skip them for good?", "Do later", "Skip for good", "skipped before"] },
  { before: ["Select cells", "Done selecting", "Sort by end date", "past days</button>"], after: ["Edit many cells at once", "Order columns by end date", "Show past days"] },
  { before: ["tap a column name for the Builder", "tap a column title for its subject card"], after: ["tap a subject’s name to open it"] },
  { before: ["Family-wide day rules"], after: ["Family-wide: school hours, sitter, devices, order of the day →"] },
  { before: ["Workflow Orders"], after: ["Order of the day"] },
];
const BEFORE = [].concat(...ROWS.map(r => r.before));

// the Curriculum page's draw functions, and the confirms / toasts it raises
const PAGE_FNS = ("renderCurriculumView ceBuildCard ceRenderSessions ceRenderEditSheet _ceMarkDoneUI ceRenderAddSheet cePracticeSectionHTML " +
  "ceMomPartSectionHTML mmEditorSectionHTML lnRenderSection cbRenderSummary cbRenderRules cbRenderGate renderCurrBuilder cbRenderForm renderCurrGrid " +
  "gvAuditRender gvMarkMenuHTML _ceMarkDoneAsk gvMakePlan gvMakePlanAll gvMakePlanUndo ceUnfinishLesson ceConvApply rlSet gvAuditFixGap " +
  "gvReconcileAdopt gvOpenCell gvMarkNotDone gvDeleteLesson ceRelayRemaining ceWalkApply ceSetCap cwdUseMonThu lnPauseRelay cbApply cbRebuildAll " +
  "gvMenuDone gvSelShiftUp ckLogDock mdCardCheckLog mmRulesCardHTML rulesFamilyCardsHTML").split(" ");

// ── 1. the block and cw() ────────────────────────────────────────────────────────────────
console.log("── 1. the block and cw() ──");
const CWB = _cwBlock(src);
{
  ok("CURRWORDS_START / CURRWORDS_END markers exist, once each", src.split("// CURRWORDS_START").length === 2 && src.split("// CURRWORDS_END").length === 2);
  ok("the block cites her words and the date", /2026-11-10/.test(CWB) && /simple enough another mom could figure this out/.test(CWB));
  ok("it holds one map CW and a getter cw()", /\nvar CW=\{/.test(CWB) && /\nfunction cw\(key,o\)\{/.test(CWB));
  ok("nothing else in index.html declares a CW map or cw()", (src.match(/var CW=|function cw\(/g) || []).length === 2);
  ok("the block sits before RULE_LABEL (the chip words read the map at load)", src.indexOf("// CURRWORDS_START") < src.indexOf("const RULE_LABEL="));
  const c = { Object, String }; vm.createContext(c); vm.runInContext(CWB, c);
  ok("cw(key) returns the map value", c.cw("tpw") === "How many times a week" && c.cw("cap") === "Most in one day" && c.cw("pace") === "Pace");
  ok("cw(key) falls back to the key when the map has no entry", c.cw("noSuchLabel") === "noSuchLabel");
  ok("cw(key,{kid}) fills the kid's name", c.cw("kidYear", { kid: "Lucy" }) === "📅 Lucy’s year" && c.cw("momCheckKid", { kid: "Ellis" }) === "You approve Ellis’s check-offs");
  ok("cw(key,{n}) fills a number; an unfilled hole stays as it was", c.cw("extends", { n: 3 }) === "adds 3 school days to the grid" && c.cw("kidYear") === "📅 {kid}’s year");
  ok("a map value never carries a double quote (labels go inside title=\"…\")", Object.keys(c.CW).every(k => String(c.CW[k]).indexOf('"') < 0));
  ok("no data key or test marker comes from the map: no write path reads cw()", !/\.(set|update|push)\([^)]*cw\(/.test(src));
}

// ── 2. every before word is gone from the page's on-screen strings ────────────────────────
console.log("\n── 2. the before words are off the page ──");
{
  const code = PAGE_FNS.map(n => { const f = fnSrc(src, n); if (!f) console.log("  (no function " + n + ")"); return f ? noComments(f) : ""; }).join("\n")
    + "\n" + noComments(src.slice(src.indexOf("const RULE_LABEL="), src.indexOf("\n", src.indexOf("const RULE_LABEL="))));
  ok("every page function was found", PAGE_FNS.every(n => fnSrc(src, n)));
  const left = BEFORE.filter(b => code.indexOf(b) >= 0).map(b => { const i = code.indexOf(b); return b + "  ⟶  …" + code.slice(Math.max(0, i - 60), i + b.length + 40) + "…"; });
  ok("no §3.5 before word is left in the page's strings (" + BEFORE.length + " checked)", left.length === 0, left);
  ok("the CW block keeps the before words only in its comments", BEFORE.filter(b => noComments(CWB).indexOf(b) >= 0 && !/^[a-z-]+$/.test(b)).length === 0, BEFORE.filter(b => noComments(CWB).indexOf(b) >= 0));
}

// ── 3. every after word is in the map, and every map key is used ──────────────────────────
console.log("\n── 3. the after words are in the map ──");
{
  const c = { Object, String }; vm.createContext(c); vm.runInContext(CWB, c);
  const vals = Object.keys(c.CW).map(k => c.CW[k]);
  const missing = [];
  ROWS.forEach(r => r.after.forEach(a => { if (!vals.some(v => v.indexOf(a) >= 0) && !(r.afterAnywhere && src.indexOf(a) >= 0)) missing.push(a); }));
  ok("every §3.5 after word is in CW (or, for the re-lay tooltips, in the rewritten text)", missing.length === 0, missing);
  const outside = src.replace(CWB, "");
  const unused = Object.keys(c.CW).filter(k => outside.indexOf('"' + k + '"') < 0);
  ok("every map key is used on the page (no dead labels)", unused.length === 0, unused);
  ok("the page reads the map through cw() — at least 150 call sites", (outside.match(/\bcw\(/g) || []).length >= 150, (outside.match(/\bcw\(/g) || []).length);
}

// ── 4. a real render shows no before word ─────────────────────────────────────────────────
console.log("\n── 4. the Grid and the subject card, rendered ──");
const visBefore = BEFORE.map(decode).filter(b => !/["\[{(<>]/.test(b) && !/^[a-z-]+$/.test(b));   // fragments that are on-screen words (not code shapes)
function beforeIn(html) { const t = visible(html); return visBefore.filter(b => t.indexOf(b) >= 0); }
let G, Gid, Cd, Cdid, Cd2, Cd2id;
{
  G = renderGrid(src, false); Gid = renderGrid(src, true);
  ok("the Grid renders", G.length > 2000 && /gvRulesToggle\(\)/.test(G));
  ok("toolbar: 📅 Kid's year (one button since KIDYEAR — the old ▸ All subjects button is a tab now), Lay everything out again, Edit many cells at once, Order columns by end date",
    G.indexOf("📅 kid’s year ▸ All subjects") < 0 && G.indexOf("📅 kid’s year ") >= 0 && G.indexOf("Lay everything out again (") >= 0
    && G.indexOf("☑︎ Edit many cells at once") >= 0 && G.indexOf("Order columns by end date") >= 0, G.slice(0, 0));
  ok("footer: tap a subject's name to open it", G.indexOf("tap a subject’s name to open it") >= 0);
  ok("no before word anywhere in the rendered Grid (text or tooltip)", beforeIn(G).length === 0, beforeIn(G));
  ok("the identity map shows the keys instead (proves the words come from the map)", Gid.indexOf(">kidYear ") >= 0 && Gid.indexOf("selCells") >= 0);

  Cd = renderCard(src, false); Cdid = renderCard(src, true);
  ok("the subject card renders", Cd.length > 2000 && /ce-sheet-title/.test(Cd), Cd.length);
  ok("card words: Lessons in order? · In order · The same every day · Most in one day · When it's behind · How many missed ones can pile up",
    ["Lessons in order?", ">In order<", "The same every day", "Most in one day", "When it’s behind", "How many missed ones can pile up", "A class at a set time"].every(w => Cd.indexOf(w) >= 0),
    ["Lessons in order?", ">In order<", "The same every day", "Most in one day", "When it’s behind", "How many missed ones can pile up", "A class at a set time"].filter(w => Cd.indexOf(w) < 0));
  ok("no before word anywhere in the rendered card", beforeIn(Cd).length === 0, beforeIn(Cd));
  // a second subject shape: daily, not paced, kid-level Mom check off
  Cd2 = renderCard(src, false, { subj: { tracking: "daily", pacing: null, momVerify: true, cap: 1 } }); Cd2id = renderCard(src, true, { subj: { tracking: "daily", pacing: null, momVerify: true, cap: 1 } });
  ok("a daily subject's card renders with no before word", Cd2.length > 1000 && beforeIn(Cd2).length === 0, beforeIn(Cd2));
  ok("…and points at the kid-level switch by its new name", Cd2.indexOf("Turn on “You approve Kid’s check-offs” (📅 Kid’s year)") >= 0);
}

// ── 5. the markup is otherwise unchanged ──────────────────────────────────────────────────
console.log("\n── 5. only the words changed ──");
{
  ok("Grid: real map vs identity map — same skeleton (" + sha(skeleton(G)) + ")", skeleton(G) === skeleton(Gid));
  ok("card: real map vs identity map — same skeleton (" + sha(skeleton(Cd)) + ")", skeleton(Cd) === skeleton(Cdid));
  ok("daily card: real map vs identity map — same skeleton", skeleton(Cd2) === skeleton(Cd2id));
  ok("the text did change (the check is not vacuous)", G !== Gid && Cd !== Cdid);
  if (OLD) {
    const g0 = renderGrid(OLD, false), c0 = renderCard(OLD, false), d0 = renderCard(OLD, false, { subj: { tracking: "daily", pacing: null, momVerify: true, cap: 1 } });
    ok("Grid vs " + path.basename(process.env.CURRWORDS_VS) + " — same skeleton (" + sha(skeleton(g0)) + ")", skeleton(g0) === skeleton(G));
    ok("card vs " + path.basename(process.env.CURRWORDS_VS) + " — same skeleton (" + sha(skeleton(c0)) + ")", skeleton(c0) === skeleton(Cd));
    ok("daily card vs " + path.basename(process.env.CURRWORDS_VS) + " — same skeleton", skeleton(d0) === skeleton(Cd2));
  } else console.log("  (set CURRWORDS_VS=<old index.html> to also compare against a pre-CURRWORDS render)");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
