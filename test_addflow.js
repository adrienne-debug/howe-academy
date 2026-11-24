/*
 * ADDFLOW — the guided ＋ Add subject (Curriculum streamline slice 5, PLAN_curriculum_streamline_2026-11-10.md §3.7, §4 row 5).
 * Runs the REAL code on stubs: the ADDFLOW block, ceOpenAdd / ceRenderAddSheet / ceAddSave and the Add-sheet handlers, the
 * card's ceCardPreview (CURRCARD), and the Builder's cbDefaultForm → _cbEngine → cbMaterialize → cbBuildGate → cbApply.
 * "Today" is replayed from test_addflow_today_abb03281.json: ceOpenAdd / ceRenderAddSheet / ceAddSave copied verbatim from
 * main abb03281 (the commit ADDFLOW branched from). Pinned in the repo, so the test needs no git and does not move when
 * origin/main does (hub review 2026-11-21: a git-compare test goes red the day its own branch merges).
 * The whole-file "nothing else changed" check is build-time only: ADDFLOW_VS_MAIN=1 compares against `git show abb03281`.
 *
 * Asserts (plan row 5):
 *   1. for the same answers, the subject record step 3 writes equals today's ceAddSave record, and the build writes equal
 *      today's Add → card → Put it on the schedule → ✓ (a book; a book with a finish date; a typed list; pages; a class)
 *   2. a brand-new kid with no grid builds from the synthetic Wk 1 (cbExtendInfo)
 *   3. a daily skips steps 2 and 4 (and is laid by ceAddSave's own week update); two kids → famWhoSave, as today
 *   4. ✓ runs cbBuildGate, so the Keep/Dismiss sheet still opens for a legacy subject (nothing written until she answers)
 *   5. after the build no card re-opens (today's re-open stays on the one-page sheet); Show all options at once = today's
 *      sheet byte-identical; the words are plain (no §3.5 before word), no kid names in code
 *   6. mutation check: with the ceAddSave hook gone, with ✓ calling cbApply straight, or with the finish date not handed to
 *      the form, the matching checks fail
 *   run: node test_addflow.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const SRC = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const TODAY = JSON.parse(fs.readFileSync(path.join(__dirname, "test_addflow_today_abb03281.json"), "utf8"));   // today's three functions, pinned
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const block = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("no block " + a); return s.slice(i, j + b.length); };
const fnIn = (s, name) => {
  const sig = "function " + name + "("; const i = s.indexOf(sig); if (i < 0) throw new Error("no function " + name);
  let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (d === 0) return s.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
};
const AF = block(SRC, "// ADDFLOW_START", "// ADDFLOW_END");

// ── the world: every function by name from one source (the branch, or a mutant of it), stubs around them ─────────────
const BUILDER = ["_cbParseDate", "_cbISO", "_cbMonday", "_cbSpread", "cbMaterialize", "cbSplitCells", "cbDeriveContent", "cbTodayISO", "cbFutureRows",
  "cbExtendInfo", "cbBacklogInfo", "cbRemainingContent", "cbDayCap", "cbDayCapDefault", "cbDefaultForm", "cbParsePattern", "cbBuildCfg", "cbPacingFromForm",
  "_cbEngine", "cbRunPreview", "cbApply", "cbPatchLocal", "cbTrailingEmptyRows", "cbPruneTrailingRows", "_cbGateItem", "cbBuildGate", "cbPreviewCardHTML",
  "buildSubjectLessons", "computeSubjectCursor", "paceKeywords", "lessonExpandDays", "ceCardPreview",
  "ceOpenAdd", "ceAddToggleDay", "ceAddToggleRule", "ceAddSetTotal", "ceAddToggleClass", "ceAddSetClassTime", "ceAddSetClassDates", "ceAddStepMin"];
function world(src, o) {
  o = o || {};
  const writes = [], log = { opened: [], toasts: [], alerts: [], closed: 0, relays: [], doors: [], fam: 0, rendered: 0 };
  const els = {};
  const el = id => els[id] || (els[id] = { id, innerHTML: "", value: "", style: {}, scrollTop: 0, classList: { add() {}, remove() {} }, querySelector() { return null; } });
  const wrap = el("ce-sheet-wrap");
  wrap.querySelector = sel => {
    if (sel === ".ce-sheet.open") return /class="ce-sheet open"/.test(wrap.innerHTML) ? {} : null;
    if (sel === ".ce-sheet-box") return /ce-sheet-box/.test(wrap.innerHTML) ? { scrollTop: 0 } : null;
    if (sel === ".ce-sheet") return /class="ce-sheet/.test(wrap.innerHTML) ? { classList: { add() { wrap.innerHTML = wrap.innerHTML.replace('class="ce-sheet"', 'class="ce-sheet open"'); }, remove() {} } } : null;
    return null;
  };
  const FrozenDate = class extends Date { constructor(...a) { if (a.length) super(...a); else super("2026-11-23T14:00:00"); } static now() { return new Date("2026-11-23T14:00:00").getTime(); } };
  const ctx = {
    console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Error, isNaN, isFinite, parseInt, parseFloat, Promise, Symbol,
    Date: FrozenDate, ROSTER: ["kid_a", "kid_b", "kid_c"], KID_COLOR: {},
    CURR_DEV_EMOJI: { paper: "📄", book: "📖" }, CURR_DEV_LABEL: { paper: "Paper", book: "Book", "ipad/phone": "iPad/Phone" },
    currData: o.currData || { subjects: { kid_a: {} }, lessons: {}, weekDays: {}, skiplog: {}, rebaseline: {} },
    paceData: { subjects: {} }, scheduleOverrides: {}, mastAIKey: o.aiKey || "",
    document: { getElementById: id => (id === "ce-sheet-wrap" || els[id]) ? el(id) : null, body: { style: {} } },
    requestAnimationFrame: f => f(), setTimeout: () => 0, clearTimeout: () => {},
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    ampmTo24: s => s, to12h: s => s, fxParseDates: t => ({ dates: String(t).split("\n").filter(Boolean), bad: [] }), fxDatesMsg: n => n + " dates",
    alert: m => log.alerts.push(m), confirm: () => true, dbg: () => {}, gwShowToast: m => log.toasts.push(m), renderAll: () => {},
    gwParseDate: ds => new FrozenDate(ds + "T12:00:00"), smapIsKidOff: () => null, schedOvKidOff: () => null, coopBlocksBase: () => false,
    gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    paceAutoCount: () => 0, cbDoneCellSet: () => null, paceDoneTitles: () => [], PACE_ALT_KEYWORDS: {}, currKeyword: (k, sk) => sk,
    planBacked: (k, sk) => !!((((ctx.currData.subjects || {})[k]) || {})[sk] || {}).planId, planIdFor: (k, sk) => k + "__" + sk,
    _lidAlign: (a, b, seq) => ({ ids: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), nextLid: seq.length + 1 }),
    setSchedOverride: () => {}, saveScheduleOverrides: () => {}, setLessonSeq: () => {}, HA_LS: { setItem() {}, getItem() { return null; } },
    rbLog: () => {}, buildCurrPaceCum: () => {}, relayWeek: (why, opt) => log.relays.push([why, opt && opt.subjects]),
    _rlwCurrDoor: (label, subs) => log.doors.push([label, subs]),
    ceCloseSheet: () => { log.closed++; ctx.ceEditKid = null; ctx.ceEditKey = null; wrap.innerHTML = ""; },
    ceOpenEdit: (k, sk) => { log.opened.push(k + "|" + sk); ctx.ceEditKid = k; ctx.ceEditKey = sk; },
    famList: x => Array.isArray(x) ? x : [],
    famWhoRowHTML: () => '<div class="ce-sheet-lbl">Who does this?</div>',
    famWhoSave: () => { const p = ctx.famWhoPicks(ctx.ceAddForm); if (p.length < 2) { if (p.length === 1 && p[0] !== ctx.ceAddKid) ctx.ceAddKid = p[0]; return false; } log.fam++; ctx.ceCloseSheet(); return true; },
    mstSessions: () => [], RULE_LABEL: { sequential: "in order", sticky: "Right after / before", first: "First thing", last: "Last thing", lastOwn: "Last of their own work" },
    RULE_DESC: {}, ceFindRuleOwner: () => null,
    db: { ref: p => ({ set: v => { writes.push(["set", p, JSON.parse(J(v === undefined ? null : v))]); return { catch() {} }; },
      update: v => { writes.push(["update", p, JSON.parse(J(v))]); return { catch() {} }; } }) },
  };
  vm.createContext(ctx);
  const pre = "var ceAddKid=null, ceAddForm={}, ceAddMsg='', ceBuildOpen=null, ceEditKid=null, ceEditKey=null, ceCloseTimer=null, ceGen={prefix:'Lesson',count:0};\n" +
    "var cbKid=null, cbSubjKey=null, cbForm=null, cbPreviewRes=null, cbGate=null, cbMsg='', cbLastBuild=null, cbBacklogStash={}, cbDecisions={}, cbScanStatus='', _rbInAll=false, _gvDelUndo=null;\n";
  const parts = [pre, block(src, "// CURRWORDS_START", "// CURRWORDS_END"), "const LESSON_DAY_RE=/\\s*·\\s*day \\d+ of \\d+\\s*$/i;",
    fnIn(src, "famWhoPicks"), ...BUILDER.filter(n => n !== "ceOpenAdd").map(n => fnIn(src, n)),
    o.today ? TODAY.ceOpenAdd : fnIn(src, "ceOpenAdd"), o.today ? TODAY.ceAddSave : fnIn(src, "ceAddSave"), (o.today || o.todayRender) ? TODAY.ceRenderAddSheet : fnIn(src, "ceRenderAddSheet")];
  if (!o.noFlow) parts.push(block(src, "// ADDFLOW_START", "// ADDFLOW_END"));
  vm.runInContext(parts.join("\n"), ctx);
  const run = e => vm.runInContext(e, ctx);
  const type = (id, v) => { el(id).value = v; };
  return { ctx, run, writes, log, wrap, type, html: () => wrap.innerHTML };
}

const BOOK = { name: "Saxon Math", minutes: 30, days: "Mon Wed Fri", timesPerWeek: 3, mom: "required", device: "book", total: 120 };
// today: the one-page sheet (origin/main's own renderer and save), Add Subject, the card re-opens, Put it on the schedule → Preview → ✓
function today(form, o) {
  o = o || {};
  const w = world(SRC, { today: true, noFlow: true, currData: o.currData });
  w.run("ceOpenAdd('kid_a')");
  Object.assign(w.ctx.ceAddForm, form); w.type("ce-add-name", form.name);
  w.run("ceAddSave()");
  const sk = (w.log.opened[0] || "|").split("|")[1];
  if (sk && o.cardPacing) w.ctx.currData.subjects.kid_a[sk].pacing = Object.assign({}, o.cardPacing);   // the card's Pace pills (they write on the tap)
  if (sk) { w.run("ceCardPreview()"); w.ctx.formAtPreview = J(w.ctx.cbForm); w.run("cbBuildGate()"); }
  return w;
}
// the flow: step 1 → (2) → 3 → 4 → Put it on the schedule
function flow(form, o, src) {
  o = o || {};
  const w = world(src || SRC, { currData: o.currData });
  w.run("ceOpenAdd('kid_a')");
  const steps = [w.run("afStep")];
  w.type("ce-add-name", form.name); w.ctx.ceAddForm.name = form.name;
  if (form.tracking === "daily") w.run("afSetKind('daily')");
  if (o.cls) w.run("afSetKind('class')");
  Object.assign(w.ctx.ceAddForm, form, { name: form.name });
  if (o.step2) o.step2(w);
  w.run("afGo(2)"); steps.push(w.run("afStep"));
  if (w.run("afStep") === 2) { w.ctx.step2Html = w.html(); w.run("afGo(3)"); steps.push(w.run("afStep")); }
  if (o.step3) o.step3(w);
  w.ctx.step3Html = w.html();
  w.run("afSave()"); steps.push(w.run("afStep"));
  w.ctx.step4Html = w.html();
  if (w.run("afStep") === 4) { w.ctx.formAtPreview = J(w.ctx.cbForm); if (!o.noPut) w.run("afPut()"); }
  w.ctx.steps = steps;
  return w;
}
const subjWrites = w => w.writes.filter(x => /^curriculum\/subjects\//.test(x[1]));
const buildWrites = w => w.writes.filter(x => x[1] === "curriculum" && x[0] === "update");

// CURRSIMPLE (slice 6): test_curr_simple.js walks this world in the Simple and Everything views
module.exports = { world, BOOK };
if (require.main !== module) return;   // required (test_curr_simple.js reuses this harness): the definitions only, no checks

ok("the pinned 'today' fixture holds abb03281's ceOpenAdd, ceRenderAddSheet and ceAddSave", TODAY.commit === "abb03281" && ["ceOpenAdd", "ceRenderAddSheet", "ceAddSave"].every(n => typeof TODAY[n] === "string" && TODAY[n].indexOf("function " + n + "(") === 0) && !/afSaved|afStep|afReset/.test(TODAY.ceAddSave + TODAY.ceRenderAddSheet + TODAY.ceOpenAdd));

console.log("── 0. the block and its hooks ──");
{
  ok("ADDFLOW_START / ADDFLOW_END once each, after ceAddSave, before the upload code", SRC.split("// ADDFLOW_START").length === 2 && SRC.split("// ADDFLOW_END").length === 2
    && SRC.indexOf("// ADDFLOW_START") > SRC.indexOf("function ceAddSave(") && SRC.indexOf("// ADDFLOW_END") < SRC.indexOf("// ── CURRICULUM UPLOAD"));
  ok("the block cites her words, the date and the plan", /2026-11-10/.test(AF) && /simple enough another mom could/.test(AF) && /Put it on the schedule/.test(AF) && /PLAN_curriculum_streamline_2026-11-10\.md/.test(AF));
  ok("hook: ceOpenAdd starts the guided steps", /\n  ceAddMsg="";\n  if\(typeof afReset==="function"\) afReset\(\);[^\n]*\n  ceRenderAddSheet\(\);\n\}/.test(fnIn(SRC, "ceOpenAdd")));
  ok("hook: ceRenderAddSheet draws a step when afStep is set, else today's sheet", /const col=KID_COLOR\[kid\]\|\|"#333";\n  if\(typeof afStep!=="undefined"&&afStep\)\{ afMount\(w,afSheetHTML\(kid,f,col\)\); return; \}/.test(fnIn(SRC, "ceRenderAddSheet")));
  ok("hook: ceAddSave hands over after its writes and its week update, before it closes the sheet", /_rlwCurrDoor\("📚 "[^\n]*\n  if\(typeof afSaved==="function"&&afSaved\(kid,key,subj\)\) return;[^\n]*\n  ceCloseSheet\(\);/.test(fnIn(SRC, "ceAddSave")));
  const strip = s => s.replace(/\n  if\(typeof afReset==="function"\) afReset\(\);[^\n]*/, "").replace(/\n  if\(typeof afStep!=="undefined"&&afStep\)\{[^\n]*/, "").replace(/\n  if\(typeof afSaved==="function"&&afSaved\(kid,key,subj\)\) return;[^\n]*/, "");
  ok("apart from the three hook lines, ceOpenAdd / ceRenderAddSheet / ceAddSave are byte-identical to today's (abb03281, pinned)",
    ["ceOpenAdd", "ceRenderAddSheet", "ceAddSave"].every(n => strip(fnIn(SRC, n)) === TODAY[n]), ["ceOpenAdd", "ceRenderAddSheet", "ceAddSave"].filter(n => strip(fnIn(SRC, n)) !== TODAY[n]));
  if (process.env.ADDFLOW_VS_MAIN === "1") {   // build-time only: the branch against the commit it was cut from
    let base = ""; try { base = cp.execSync("git show abb03281:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { base = ""; }
    ok("(ADDFLOW_VS_MAIN) outside the block and the three hooks, index.html is byte-identical to abb03281", !!base && strip(SRC.replace(AF + "\n", "")) === base);
  } else console.log("  SKIPPED - outside the block, index.html byte-identical to abb03281 (build-time only: ADDFLOW_VS_MAIN=1)");
  const code = AF.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  ok("the block writes nothing itself: no db.ref, no .set / .update / .remove", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(code));
  ok("no kid names anywhere in the block (the roster draws the chips)", !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb/i.test(AF));
  ok("no 🔀 in index.html", SRC.indexOf("\u{1F500}") < 0);
}

console.log("\n── 1. same answers → the same record and the same build as today ──");
const CASES = [
  ["a book, default answers apart from name/days/minutes (Mon Wed Fri, 3 a week, 120 lessons)", BOOK, {}, {}],
  ["a typed lesson list, 2 days per lesson, a rule and a study-free daily priority", Object.assign({}, BOOK, { lessonSource: "manual", manualLessons: "pg 1-3\npg 4-6\nReview", daysPerLesson: 2, rules: "sequential, first", priority: "high", carryoverCap: 1 }), {}, {}],
  ["a book that starts partway (start at 40, 'Ch.' names)", Object.assign({}, BOOK, { prefix: "Ch.", startAt: 40, total: 60 }), {}, {}],
  ["a class at a set time with dates and a link", Object.assign({}, BOOK, { fixedTime: "1:00 PM", fixedDates: ["2026-12-02", "2026-12-09"], joinUrl: "https://example.org/j/1" }), { cls: true }, {}],
];
CASES.forEach(([n, form, fo]) => {
  const t = today(form), f = flow(form, fo);
  ok(n + ": the subject record is byte-identical", J(subjWrites(f)) === J(subjWrites(t)) && subjWrites(f).length === 1, { flow: subjWrites(f), today: subjWrites(t) });
  ok("   …the same week update through the one door (ceAddSave's own)", J(f.log.doors) === J(t.log.doors) && f.log.doors.length === 1);
  ok("   …the Builder form at the preview is the same", f.ctx.formAtPreview === t.ctx.formAtPreview, { flow: f.ctx.formAtPreview, today: t.ctx.formAtPreview });
  ok("   …the build writes are byte-identical (one curriculum update) and the week follows (relayWeek 'build')", buildWrites(f).length === 1 && J(buildWrites(f)) === J(buildWrites(t)) && J(f.log.relays) === J(t.log.relays) && f.log.relays.length === 1, { f: buildWrites(f).map(x => Object.keys(x[2]).length), t: buildWrites(t).map(x => Object.keys(x[2]).length) });
  ok("   …every write the flow made, in order, is a write today makes", J(f.writes) === J(t.writes));
});
{ // a finish date: today = the card's Finish by a date pills, then Put it on the schedule
  const DATE = "2027-05-28";
  const t = today(BOOK, { cardPacing: { mode: "targetDate", targetDate: DATE } });
  const f = flow(BOOK, { step3: w => w.run("afSet('targetDate','" + DATE + "')") });
  ok("a book with a finish date: the form at the preview equals the card's (mode Finish by a date, the date)", f.ctx.formAtPreview === t.ctx.formAtPreview && JSON.parse(f.ctx.formAtPreview).mode === "targetDate" && JSON.parse(f.ctx.formAtPreview).targetDate === DATE, { f: f.ctx.formAtPreview, t: t.ctx.formAtPreview });
  ok("   …the build writes are byte-identical, pacing {mode:targetDate, targetDate}", J(buildWrites(f)) === J(buildWrites(t)) && buildWrites(f)[0][2]["subjects/kid_a/saxon_math/pacing"].mode === "targetDate");
  ok("   …and the record is the same as without a date (the date rides only in the build)", J(subjWrites(f)) === J(subjWrites(today(BOOK))));
}
{ // Start on
  const f = flow(BOOK, { step3: w => { w.run("afMore=true"); w.run("afSet('startDate','2026-12-07')"); } });
  ok("Start on (More options) reaches the form — staged, the one field that only means anything at the first lay-out", JSON.parse(f.ctx.formAtPreview).startDate === "2026-12-07" && buildWrites(f)[0][2]["subjects/kid_a/saxon_math/pacing"].startDate === "2026-12-07");
  ok("   …nothing lands before it", Object.entries(buildWrites(f)[0][2]).filter(([k, v]) => /^lessons\/kid_a\/\d+$/.test(k) && v.saxon_math).every(([, v]) => v.date >= "2026-12-07"));
}
{ // pages → the lesson list itself (today: the same list typed on the one-page sheet)
  const f = flow(BOOK, { step2: w => { w.run("afSrc('pages')"); w.run("afSet('firstPage','5')"); w.run("afSet('lastPage','16')"); w.run("afSet('patternStr','3, 4')"); } });
  const t = today(Object.assign({}, BOOK, { lessonSource: "manual", manualLessons: "pp. 5–7\npp. 8–11\npp. 12–14\npp. 15–16" }));
  ok("a workbook by pages (5–16, 3 then 4 a day): the list is pp. 5–7, 8–11, 12–14, 15–16", J(subjWrites(f)[0][2].lessonSeq) === J(["pp. 5–7", "pp. 8–11", "pp. 12–14", "pp. 15–16"]), subjWrites(f)[0] && subjWrites(f)[0][2].lessonSeq);
  ok("   …the record and the build equal today's for that typed list", J(subjWrites(f)) === J(subjWrites(t)) && J(buildWrites(f)) === J(buildWrites(t)));
  const u = flow(BOOK, { step2: w => { w.run("afPace.pages=true;afPace.units=[{label:'Ch.1',startPage:3,endPage:9},{label:'',startPage:10,endPage:10}]"); } });
  ok("📸 chapters from the photo become one line each (label — pp.)", J(subjWrites(u)[0][2].lessonSeq) === J(["Ch.1 — pp. 3–9", "p. 10"]));
  const bad = world(SRC); bad.run("ceOpenAdd('kid_a')"); bad.ctx.ceAddForm.name = "X"; bad.type("ce-add-name", "X"); bad.run("afGo(2)"); bad.run("afSrc('pages')"); bad.run("afGo(3)");
  ok("   …no last page → it says so and stays on step 2", bad.run("afStep") === 2 && /last page/.test(bad.log.alerts.join()));
}

console.log("\n── 2. a brand-new kid with no grid builds from the synthetic Wk 1 ──");
{
  const f = flow(BOOK), up = (buildWrites(f)[0] || [])[2] || {};
  const rows = Object.entries(up).filter(([k]) => /^lessons\/kid_a\/\d+$/.test(k));
  ok("the kid has no grid before: cbExtendInfo answers with the synthetic anchor (Start on, or today)", (() => { const w0 = world(SRC); return !("kid_a" in w0.ctx.currData.lessons) && w0.run("cbExtendInfo('kid_a',null,'saxon_math').synthetic") === true; })());
  ok("   …lessons/kid_a/1 is the first row, in Wk 1, and holds Lesson 1", up["lessons/kid_a/1"] && up["lessons/kid_a/1"].week === "Wk 1" && up["lessons/kid_a/1"].saxon_math === "Lesson 1", up["lessons/kid_a/1"]);
  ok("   …120 rows with a lesson, every one on a Mon / Wed / Fri (the days between are the grid's empty placeholder rows)", rows.filter(([, v]) => v.saxon_math).length === 120 && rows.filter(([, v]) => v.saxon_math).every(([, v]) => [1, 3, 5].includes(new Date(v.date + "T12:00:00").getDay())) && rows.filter(([, v]) => !v.saxon_math).every(([, v]) => Object.keys(v).join() === "week,date"));
  ok("   …weekDays/kid_a/Wk 1 written in the same update; pacing timesPerWeek 3", J(up["weekDays/kid_a/Wk 1"] || []).length > 2 && up["subjects/kid_a/saxon_math/pacing"].mode === "timesPerWeek" && up["subjects/kid_a/saxon_math/pacing"].tpw === 3);
  ok("   …and a kid WITH a grid extends it instead (no synthetic Wk 1 row 1)", (() => {
    const cd = { subjects: { kid_a: {} }, lessons: { kid_a: { 7: { week: "Wk 9", date: "2026-11-20" } } }, weekDays: { kid_a: { "Wk 9": [7] } }, skiplog: {}, rebaseline: {} };
    const g = flow(BOOK, { currData: cd }); const u2 = buildWrites(g)[0][2]; return !u2["lessons/kid_a/1"] && Object.keys(u2).some(k => k === "lessons/kid_a/8"); })());
}

console.log("\n── 3. the paths: steps a mom sees ──");
{
  const f = flow(BOOK);
  ok("a book: steps 1 → 2 → 3 → 4, then the sheet closes", J(f.ctx.steps) === J([1, 2, 3, 4]) && f.run("afStep") === 0 && f.log.closed === 1, f.ctx.steps);
  ok("   …no card re-opens after the build (today it does)", f.log.opened.length === 0 && today(BOOK).log.opened.length === 1);
  ok("   …the toast: On the schedule. Tap its name …", /On the schedule\. Tap its name/.test(f.log.toasts.join("|")));
  const d = flow({ name: "Read Aloud", tracking: "daily", minutes: 20, days: "Mon Tue Wed Thu Fri" });
  ok("a daily: steps 1 → 3, then saved and closed — steps 2 and 4 skipped", J(d.ctx.steps) === J([1, 3, 0]) && d.log.closed === 1 && !d.ctx.step2Html, d.ctx.steps);
  ok("   …its record equals today's, it is laid by ceAddSave's own week update, no build, no card", J(subjWrites(d)) === J(subjWrites(today({ name: "Read Aloud", tracking: "daily", minutes: 20, days: "Mon Tue Wed Thu Fri" })))
    && d.log.doors.length === 1 && buildWrites(d).length === 0 && d.log.opened.length === 0 && /Read Aloud is on the schedule/.test(d.log.toasts.join()));
  ok("   …step 3's button says Put it on the schedule; Back from 3 goes to step 1", /afSave\(\)">Put it on the schedule</.test(d.ctx.step3Html) && (() => { const w = world(SRC); w.run("ceOpenAdd('kid_a')"); w.ctx.ceAddForm.name = "R"; w.type("ce-add-name", "R"); w.run("afSetKind('daily')"); w.run("afGo(2)"); const a = w.run("afStep"); w.run("afGo(2)"); return a === 3 && w.run("afStep") === 1; })());
  const two = flow(Object.assign({}, BOOK, { who: ["kid_a", "kid_b"] }));
  ok("two kids: steps 1 → 2 → 3, then famWhoSave (one Family Time item), no subject, no build, no step 4", J(two.ctx.steps) === J([1, 2, 3, 3]) && two.log.fam === 1 && subjWrites(two).length === 0 && buildWrites(two).length === 0 && two.log.closed === 1, two.ctx.steps);
  ok("   …step 3 for two kids: Add it, no Needs you? / finish date (family time leaves them out)", /afSave\(\)">Add it</.test(two.ctx.step3Html) && !/Needs you\?/.test(two.ctx.step3Html) && !/Finish by/.test(two.ctx.step3Html));
  const one = flow(Object.assign({}, BOOK, { who: ["kid_b"] }));
  ok("one OTHER kid picked → that kid's own subject, as today", subjWrites(one)[0] && subjWrites(one)[0][1] === "curriculum/subjects/kid_b/saxon_math");
  const noName = world(SRC); noName.run("ceOpenAdd('kid_a')"); noName.run("afGo(2)");
  ok("step 1 with no name → 'Enter a subject name.' and it stays", noName.run("afStep") === 1 && noName.log.alerts[0] === "Enter a subject name.");
  const dup = world(SRC, { currData: { subjects: { kid_a: { saxon_math: { display: "Saxon Math" } } }, lessons: {} } }); dup.run("ceOpenAdd('kid_a')"); dup.type("ce-add-name", "Saxon Math"); dup.run("afGo(2)");
  ok("a name the kid already has → said on step 1, not after three steps", dup.run("afStep") === 1 && /already one of Kid_a’s subjects/.test(dup.log.alerts[0]));
  const later = flow(BOOK, { noPut: true }); later.run("afLater()");
  ok("step 4 ▸ Not now: the subject stays saved, nothing laid, the sheet closes and says how to finish", subjWrites(later).length === 1 && buildWrites(later).length === 0 && later.log.closed === 1 && /not on the schedule yet/.test(later.log.toasts.join()) && later.ctx.cbForm === null);
}

console.log("\n── 4. ✓ is cbBuildGate: the Keep/Dismiss sheet still opens for a legacy subject ──");
{
  const cd = { subjects: { kid_a: { spelling: { display: "Spelling", minutes: 20, lessonSeq: ["S1", "S2", "S3", "S4"], allowedDays: ["Mon", "Wed"], days: "Mon Wed", timesPerWeek: 2 } } },
    lessons: { kid_a: { 1: { week: "Wk 1", date: "2026-11-09", spelling: "S1" }, 2: { week: "Wk 1", date: "2026-11-11", spelling: "S2" } } }, weekDays: { kid_a: { "Wk 1": [1, 2] } }, skiplog: {}, rebaseline: {} };
  const w = world(SRC, { currData: cd });
  w.run("afReset();afStep=4;cbKid='kid_a';cbSubjKey='spelling';cbForm=cbDefaultForm('kid_a','spelling');cbRunPreview();");
  const n0 = w.writes.length; w.run("afPut()");
  ok("legacy (no lesson ids, past cells not done): afPut opens the gate — cbGate set, nothing written, no 'On the schedule' toast", !!w.ctx.cbGate && w.ctx.cbGate.items[0].sk === "spelling" && w.writes.length === n0 && !/On the schedule/.test(w.log.toasts.join()));
  ok("   …the sheet steps aside so the gate (drawn by the grid, above the sheets) is what she sees", w.log.closed === 1 && w.run("afStep") === 0);
  ok("afPut's code calls cbBuildGate and never cbApply", /cbBuildGate\(\)/.test(fnIn(SRC, "afPut").replace(/\/\/[^\n]*/g, "")) && !/cbApply/.test(fnIn(SRC, "afPut").replace(/\/\/[^\n]*/g, "")));
}

console.log("\n── 5. what she sees ──");
{
  const w = world(SRC); w.run("ceOpenAdd('kid_a')"); const h1 = w.html();
  ok("＋ Add subject opens on step 1: 'What is it?', step 1 of 4, Who does this?, the name box, three kinds, Next, Show all options at once",
    /What is it\?/.test(h1) && /step 1 of 4/.test(h1) && /Who does this\?/.test(h1) && /id="ce-add-name"/.test(h1) && /A book or course with lessons in order/.test(h1) && /Something they do every school day/.test(h1) && /A class at a set time/.test(h1) && /afGo\(2\)">Next</.test(h1) && /afAll\(\)/.test(h1) && /Show all options at once/.test(h1));
  ok("   …the book kind is picked by default", /class="ce-chip sel" onclick="afSetKind\('book'\)"/.test(h1));
  const f = flow(BOOK, { noPut: true });
  ok("step 2: Number them for me / Type the list / go by pages; how many, they're called, start at", /Number them for me/.test(f.ctx.step2Html) && /Type the list/.test(f.ctx.step2Html) && /go by pages/.test(f.ctx.step2Html) && /How many lessons\?/.test(f.ctx.step2Html) && /They’re called/.test(f.ctx.step2Html) && /Start at/.test(f.ctx.step2Html));
  ok("   …📸 Photo of the table of contents only when the family has an AI key", !/Photo of the table of contents/.test(f.ctx.step2Html) && (() => { const k = world(SRC, { aiKey: "sk-ant-x" }); k.run("ceOpenAdd('kid_a')"); k.type("ce-add-name", "B"); k.ctx.ceAddForm.name = "B"; k.run("afGo(2)"); return /Photo of the table of contents/.test(k.html()) && /afScan\(this\)/.test(k.html()); })());
  ok("step 3: Days of the week, How many times a week, How long, Needs you?, Finish by, More options", ["Days of the week", "How many times a week", "How long", "Needs you?", "Finish by", "More options"].every(x => f.ctx.step3Html.indexOf(x) >= 0) && /Next — see the plan/.test(f.ctx.step3Html));
  const m = world(SRC); m.run("ceOpenAdd('kid_a')"); m.type("ce-add-name", "B"); m.ctx.ceAddForm.name = "B"; m.run("afGo(2)"); m.run("afGo(3)"); m.run("afMore=true;ceRenderAddSheet()"); const hm = m.html();
  ok("More options holds every other field of today's sheet: Start on, Where it happens, Order in the day, If the day is tight, How many missed ones can pile up",
    ["Start on", "Where it happens", "Order in the day", "If the day is tight", "How many missed ones can pile up"].every(x => hm.indexOf(x) >= 0));
  m.run("afMore=false;afGo(2);afMore=true;ceRenderAddSheet()");
  ok("   …and step 2's More options holds Days per lesson", /Days per lesson/.test(m.html()));
  const c = world(SRC); c.run("ceOpenAdd('kid_a')"); c.type("ce-add-name", "Co-op"); c.ctx.ceAddForm.name = "Co-op"; c.run("afSetKind('class');afGo(2);afGo(3);afMore=true;ceRenderAddSheet()");
  ok("a class: Starts at on step 3; the dates it meets, the join link and Lessons in order? under More options", /Starts at/.test(c.html()) && /The dates it meets/.test(c.html()) && /Join link/.test(c.html()) && /Lessons in order\?/.test(c.html()) && c.ctx.ceAddForm.fixedTime === "10:00 AM");
  ok("days lit → times a week follows (Mon–Fri 5; untick Tue, Thu → 3); she can still make it fewer", (() => { const w2 = world(SRC); w2.run("ceOpenAdd('kid_a')"); w2.run("afDay('Tue');afDay('Thu')"); const a = w2.ctx.ceAddForm.timesPerWeek; w2.run("afTpw(-1)"); const b = w2.ctx.ceAddForm.timesPerWeek; w2.run("afDay('Sat')"); return a === 3 && b === 2 && w2.ctx.ceAddForm.timesPerWeek === 2 && w2.ctx.ceAddForm.days === "Mon Wed Fri Sat"; })());
  ok("step 4: 'Here’s the plan', saved-not-yet line, the Builder's preview card with ✓ Put it on the schedule → afPut and Not now → afLater",
    /Here’s the plan/.test(f.ctx.step4Html) && /not on the schedule until you tap/.test(f.ctx.step4Html) && /Preview — nothing written yet/.test(f.ctx.step4Html) && /onclick="afPut\(\)"[^>]*>✓ Put it on the schedule</.test(f.ctx.step4Html) && /onclick="afLater\(\)"[^>]*>Not now</.test(f.ctx.step4Html)
    && !/cbBuildGate\(\)|cbPreviewRes=null;renderAll\(\)/.test(f.ctx.step4Html), f.ctx.step4Html.slice(-700));
  ok("the backdrop on any step goes through afClose (step 4 = Not now)", /onclick="if\(event\.target===this\)afClose\(\)"/.test(h1));
  // Show all options at once = today's sheet, byte-identical
  const forms = [{}, { tracking: "daily" }, { fixedTime: "1:00 PM", fixedDates: ["2026-12-02"] }, { lessonSource: "manual", manualLessons: "a\nb", rules: "sequential, sticky" }];
  ok("Show all options at once: today's one-page sheet, byte-identical to abb03281's, for 4 shapes of the form", forms.every(fo => {
    const a = world(SRC); a.run("ceOpenAdd('kid_a')"); Object.assign(a.ctx.ceAddForm, fo); a.run("afAll()");
    const b = world(SRC, { todayRender: true, noFlow: true }); b.run("ceOpenAdd('kid_a')"); Object.assign(b.ctx.ceAddForm, fo); b.run("ceRenderAddSheet()");
    return a.html() === b.html() && /Add Subject for Kid_a/.test(a.html()) && /ceAddSave\(\)">Add Subject</.test(a.html()); }));
  ok("   …and its Add Subject is today's ending: the card re-opens, nothing is built", (() => { const a = world(SRC); a.run("ceOpenAdd('kid_a')"); a.type("ce-add-name", "Saxon Math"); Object.assign(a.ctx.ceAddForm, BOOK); a.run("afAll();ceAddSave()"); return a.log.opened.length === 1 && buildWrites(a).length === 0 && a.ctx.cbForm && a.ctx.ceBuildOpen === "kid_a|saxon_math"; })());
  // the words: none of the §3.5 before words in the block's strings
  const strs = (AF.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n").match(/'[^'\n]*'|"[^"\n]*"/g) || []).join(" ");
  const BEFORE = ["Builder", "Build into map", "Preview build", "Mom Requirement", "Device<", "Duration (minutes)</div>", "Times Per Week", "×/wk", "Lesson Tracking", ">Sequenced<", "Daily (no lesson #)",
    "Scheduling Rules", "Carryover Cap", "Stick with:", "packed into the day", "Meeting dates", "Pacing &amp; build", "How should it be paced", "Scan the book", "plan-backed", "Lesson Map", "re-lay", "Auto-number", "Prefix", "Rebuild"];
  ok("plain words: no §3.5 before word (Builder, Sequenced, Carryover Cap, Prefix, Auto-number …) in the block's strings", BEFORE.filter(b => strs.indexOf(b) >= 0).length === 0, BEFORE.filter(b => strs.indexOf(b) >= 0));
}

console.log("\n── 6. mutation check: the checks catch a broken flow ──");
{
  const mutate = (from, to) => { if (SRC.indexOf(from) < 0) throw new Error("mutation anchor missing: " + from.slice(0, 60)); return SRC.replace(from, to); };
  // M1: the ceAddSave hook gone → the card re-opens and nothing is built from the flow
  const M1 = mutate('  if(typeof afSaved==="function"&&afSaved(kid,key,subj)) return;', "");
  const f1 = flow(BOOK, {}, M1);
  ok("M1 (no hook in ceAddSave): the 'no card re-opens' and 'build writes equal' checks FAIL", !(f1.log.opened.length === 0) && !(J(buildWrites(f1)) === J(buildWrites(today(BOOK))) && buildWrites(f1).length === 1));
  // M2: ✓ calls cbApply straight → the legacy gate never opens and the leftovers are written over
  const M2 = mutate("afStep=0; cbBuildGate();", "afStep=0; cbApply();");
  const cd = { subjects: { kid_a: { spelling: { display: "Spelling", minutes: 20, lessonSeq: ["S1", "S2", "S3", "S4"], allowedDays: ["Mon", "Wed"], days: "Mon Wed", timesPerWeek: 2 } } },
    lessons: { kid_a: { 1: { week: "Wk 1", date: "2026-11-09", spelling: "S1" }, 2: { week: "Wk 1", date: "2026-11-11", spelling: "S2" } } }, weekDays: { kid_a: { "Wk 1": [1, 2] } }, skiplog: {}, rebaseline: {} };
  const w2 = world(M2, { currData: cd }); w2.run("afReset();afStep=4;cbKid='kid_a';cbSubjKey='spelling';cbForm=cbDefaultForm('kid_a','spelling');cbRunPreview();"); const n0 = w2.writes.length; w2.run("afPut()");
  ok("M2 (✓ → cbApply): the 'gate opens, nothing written' check FAILS", !(!!w2.ctx.cbGate && w2.writes.length === n0));
  // M3: the finish date not handed to the form → the build differs from the card's
  const M3 = mutate('if(p.targetDate){ cbForm.mode="targetDate"; cbForm.targetDate=p.targetDate; }', "");
  const f3 = flow(BOOK, { step3: w => w.run("afSet('targetDate','2027-05-28')") }, M3), t3 = today(BOOK, { cardPacing: { mode: "targetDate", targetDate: "2027-05-28" } });
  ok("M3 (finish date dropped): the 'build writes equal' check FAILS", !(J(buildWrites(f3)) === J(buildWrites(t3))));
  // M4: the daily skip removed → a daily walks into step 2
  const M4 = mutate('    if(f.tracking==="daily") n=3;\n', "\n");
  const f4 = flow({ name: "Read Aloud", tracking: "daily", minutes: 20, days: "Mon Tue Wed Thu Fri" }, {}, M4);
  ok("M4 (no daily skip): the 'steps 1 → 3' check FAILS", !(J(f4.ctx.steps) === J([1, 3, 0])));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
