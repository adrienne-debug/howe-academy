/*
 * NEWFAMBUILD — a brand-new family's first "✓ Put it on the schedule" after a reload (found 2026-11-24 on a beta family's
 * first subject; her yes 2026-11-24 to "the one-line fix for the new-family build bug").
 * A new family has no curriculum node; the Add sheet (ceAddSave) writes only curriculum/subjects/<kid>/<key> and
 * curriculum/lastEdit. After ANY reload the curriculum listener's first answer is {lastEdit, subjects} — no lessons, no
 * weekDays — and currOnValue keeps it as is. The card's preview draws, then ✓ (cbBuildGate → cbApply) threw
 * "Cannot read properties of undefined (reading '<kid>')" on its first line: nothing written, no message, a dead button.
 * The fix: cbApply makes currData.lessons an object (memory only) before it reads it, as ceEditLesson already does.
 *
 * Runs the REAL code on the stub world test_addflow.js exports (ceOpenAdd / ceAddSave, the card's ceCardPreview, the Builder's
 * cbDefaultForm → _cbEngine → cbMaterialize → cbBuildGate → cbApply) plus the real currOnValue for the reload.
 * The baseline is THIS tree with the fix taken out again (FIX_NEW → FIX_OLD), never a pinned commit.
 *   0. the fix is in cbApply exactly once; stripping it gives back the old line
 *   1. baseline: after the reload, ✓ throws that TypeError and writes nothing
 *   2. fixed: the same flow writes exactly ONE curriculum update — lessons/<kid>/<day> rows, weekDays/<kid>/Wk n, the
 *      subject's pacing, lastEdit — and nothing outside curriculum; the in-memory copy then holds the build
 *   3. a family that already had lessons: the fixed and the stripped tree write the same thing, byte for byte
 *   4. currOnValue: a null first answer still gives the blank skeleton; neither branch is changed by the fix
 *   5. the other readers of currData.lessons / weekDays on a new family's paths (the grid, the card, the preview, the
 *      self-building week, the week turn, Kid's year) do not throw on a curriculum with subjects and no lessons
 *   run: node test_new_family_build.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const { world, BOOK } = require("./test_addflow.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const count = (s, t) => s.split(t).length - 1;
const fnIn = (s, name) => {
  const sig = "function " + name + "("; const i = s.indexOf(sig); if (i < 0) throw new Error("no function " + name);
  let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (d === 0) return s.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
};

// ── the fix, and the tree with it taken out again ──────────────────────────────────────────────────────────────────────
const FIX_OLD = "  const kid=cbKid, sk=cbSubjKey;\n  const lessons=(currData.lessons[kid]=currData.lessons[kid]||{});\n";
const FIX_NEW = "  const kid=cbKid, sk=cbSubjKey;\n  if(!currData.lessons) currData.lessons={};   // NEWFAMBUILD: a new family's reloaded curriculum has subjects, no lessons (2026-11-24)\n  const lessons=(currData.lessons[kid]=currData.lessons[kid]||{});\n";
const HAS_FIX = count(SRC, FIX_NEW) === 1;
const BASE = HAS_FIX ? SRC.replace(FIX_NEW, () => FIX_OLD) : SRC;

const KID = "kid_a";
// the reload: the real currOnValue answers once, on the device's empty memory (currData null before the first answer)
function reload(w, src, v) {
  w.ctx.currData = null;
  vm.runInContext("var fbCurrLoaded=false, isUploading=false, lastCurrWrite=0, CURR_ECHO_MS=4000, tab='curriculum';\n" +
    "function runDisplacement(){} function renderAllSoon(){} function autoGenerateWeekIfNeeded(){} function schedCascade(){}\n" + fnIn(src, "currOnValue"), w.ctx);
  w.run("currOnValue(" + J(v) + ")");
}
// what ceAddSave writes for the first subject on a new family = the server's curriculum node after it (and nothing else)
function addFirstSubject() {
  const w = world(SRC, { noFlow: true });
  w.run("ceOpenAdd('" + KID + "')");
  Object.assign(w.ctx.ceAddForm, BOOK); w.type("ce-add-name", BOOK.name);
  w.run("ceAddSave()");
  const node = {};
  w.writes.forEach(([op, p, v]) => {
    if (op !== "set" || p.indexOf("curriculum/") !== 0) return;
    const parts = p.slice("curriculum/".length).split("/"); let n = node;
    for (let i = 0; i < parts.length - 1; i++) n = n[parts[i]] = n[parts[i]] || {};
    n[parts[parts.length - 1]] = v;
  });
  return { node, writes: w.writes, sk: Object.keys((node.subjects || {})[KID] || {})[0] };
}
// open the subject's card, Put it on the schedule — preview first, then ✓
function build(src, server, sk) {
  const w = world(src, { noFlow: true });
  reload(w, src, server);
  w.ctx.ceEditKid = KID; w.ctx.ceEditKey = sk;
  w.run("ceCardPreview()");
  const res = w.ctx.cbPreviewRes;
  let err = null; const before = w.writes.length;
  try { w.run("cbBuildGate()"); } catch (e) { err = e; }
  return { w, res, err, writes: w.writes.slice(before) };
}

// 0 — the fix
ok("0. the fix is in cbApply, exactly once", HAS_FIX && fnIn(SRC, "cbApply").indexOf(FIX_NEW.split("\n")[1]) > 0);
ok("0. stripped tree = the old cbApply line, the fix gone", count(BASE, FIX_NEW) === 0 && count(BASE, FIX_OLD) === 1 && BASE.length === SRC.length - (FIX_NEW.length - FIX_OLD.length));
ok("0. cbApply is the only function the fix touches", BASE.replace(fnIn(BASE, "cbApply"), "") === SRC.replace(fnIn(SRC, "cbApply"), ""));

const add = addFirstSubject();
const SK = add.sk;
ok("the Add sheet wrote only the subject and lastEdit (a new family, no lessons, no weekDays)",
  !!SK && J(Object.keys(add.node).sort()) === J(["lastEdit", "subjects"]) && add.writes.every(x => x[1] === "curriculum/subjects/" + KID + "/" + SK || x[1] === "curriculum/lastEdit"), add.writes.map(x => x[1]));
ok("the subject is born plan-backed with a lesson list", !!add.node.subjects[KID][SK].planId && add.node.subjects[KID][SK].lessonSeq.length === BOOK.total);

// 1 — baseline
const b0 = build(BASE, add.node, SK);
ok("1. baseline: after the reload currData has subjects and no lessons / weekDays",
  b0.w.ctx.fbCurrLoaded === true && !!b0.w.ctx.currData.subjects && b0.w.ctx.currData.lessons === undefined);
ok("1. baseline: the preview draws (placed lessons, no error)", !!b0.res && !b0.res.error && (b0.res.assignments || []).length > 0, b0.res && b0.res.error);
ok("1. baseline: ✓ throws the TypeError reading '" + KID + "'", !!b0.err && b0.err.name === "TypeError" && b0.err.message.indexOf("reading '" + KID + "'") >= 0, b0.err && b0.err.message);
ok("1. baseline: nothing is written", b0.writes.length === 0, b0.writes);

// 2 — fixed
const f0 = build(SRC, add.node, SK);
const up = f0.writes.filter(x => x[0] === "update" && x[1] === "curriculum");
const keys = up.length ? Object.keys(up[0][2]) : [];
ok("2. fixed: ✓ does not throw", !f0.err, f0.err && f0.err.message);
ok("2. fixed: exactly one write, one curriculum update", f0.writes.length === 1 && up.length === 1, f0.writes.map(x => x[0] + " " + x[1]));
ok("2. fixed: nothing outside curriculum is written", f0.writes.every(x => x[1] === "curriculum" || x[1].indexOf("curriculum/") === 0));
const rowKeys = keys.filter(k => /^lessons\//.test(k));
ok("2. fixed: the update holds lessons/" + KID + "/<day> rows: one per placed lesson (with its text) + the grid's {week,date} placeholders",
  rowKeys.every(k => new RegExp("^lessons/" + KID + "/\\d+$").test(k)) &&
  rowKeys.filter(k => up[0][2][k][SK]).length === f0.res.assignments.length && f0.res.assignments.length === BOOK.total &&
  rowKeys.length === f0.res.assignments.length + (f0.res.placeholders || []).length && rowKeys.every(k => up[0][2][k].date && up[0][2][k].week), [rowKeys.length, f0.res.assignments.length]);
ok("2. fixed: the update holds weekDays/" + KID + "/Wk n entries", keys.some(k => new RegExp("^weekDays/" + KID + "/Wk \\d+$").test(k)));
ok("2. fixed: the update holds the subject's pacing and lastEdit",
  keys.indexOf("subjects/" + KID + "/" + SK + "/pacing") >= 0 && keys.indexOf("lastEdit") >= 0 && !!up[0][2]["subjects/" + KID + "/" + SK + "/pacing"].builtThrough);
ok("2. fixed: every key is a lessons / weekDays / subjects/<kid>/<sk> / rebaseline / lastEdit path",
  keys.every(k => /^lessons\//.test(k) || /^weekDays\//.test(k) || k.indexOf("subjects/" + KID + "/" + SK + "/") === 0 || k.indexOf("rebaseline/" + KID + "/" + SK) === 0 || k === "lastEdit"), keys);
ok("2. fixed: the in-memory copy holds the build (lessons + weekDays) and the button's message says so",
  Object.keys(f0.w.ctx.currData.lessons[KID] || {}).length === rowKeys.length && Object.keys(f0.w.ctx.currData.weekDays[KID] || {}).length > 0 && /is on the schedule/.test(f0.w.ctx.cbMsg));
ok("2. fixed: the week follows through the one door (relayWeek 'build', this subject)",
  f0.w.log.relays.length === 1 && f0.w.log.relays[0][0] === "build" && J(f0.w.log.relays[0][1]) === J([{ kid: KID, sk: SK }]));
// the same family in the same sitting (no reload: the skeleton is still in memory) — the fix makes the reload match it
{
  const w = world(SRC, { noFlow: true });
  w.run("ceOpenAdd('" + KID + "')"); Object.assign(w.ctx.ceAddForm, BOOK); w.type("ce-add-name", BOOK.name); w.run("ceAddSave()");
  w.ctx.ceEditKid = KID; w.ctx.ceEditKey = SK; w.run("ceCardPreview()");
  const n0 = w.writes.length; w.run("cbBuildGate()");
  ok("2. fixed: the reload's build = the same sitting's build, byte for byte", J(w.writes.slice(n0)) === J(f0.writes), [w.writes.slice(n0).length, f0.writes.length]);
}

// 3 — a family that already had lessons: same writes, same order, with and without the fix
{
  const server = JSON.parse(J(add.node));
  server.lessons = { [KID]: { 1: { date: "2026-11-16", week: "Wk 1", spelling: "Step 1" }, 2: { date: "2026-11-17", week: "Wk 1", spelling: "Step 2" } } };
  server.weekDays = { [KID]: { "Wk 1": [1, 2] } };
  server.subjects[KID].spelling = { display: "Spelling", minutes: 20, days: "Mon Tue", allowedDays: ["Mon", "Tue"], total: 2 };
  const a = build(BASE, server, SK), b = build(SRC, server, SK);
  ok("3. had lessons: the stripped tree builds without throwing", !a.err && a.writes.length === 1, a.err && a.err.message);
  ok("3. had lessons: the fixed tree writes the same update, byte for byte", J(a.writes) === J(b.writes) && J(a.w.ctx.currData) === J(b.w.ctx.currData));
  const s2 = JSON.parse(J(server)); s2.weekDays = undefined; delete s2.weekDays;
  const a2 = build(BASE, s2, SK), b2 = build(SRC, s2, SK);
  ok("3. lessons but no weekDays (cbApply already makes it): same writes with and without the fix", !a2.err && J(a2.writes) === J(b2.writes));
}

// 4 — currOnValue unchanged
{
  const cov = fnIn(SRC, "currOnValue");
  ok("4. currOnValue is byte-identical with and without the fix", cov === fnIn(BASE, "currOnValue"));
  const w = world(SRC, { noFlow: true }); reload(w, SRC, null);
  ok("4. a null first answer still gives the blank skeleton", J(w.ctx.currData) === J({ subjects: {}, lessons: {}, weekDays: {} }));
  const w2 = world(SRC, { noFlow: true }); reload(w2, SRC, add.node);
  ok("4. a subjects-only first answer is kept as is (memory gains nothing until a build)", J(w2.ctx.currData) === J(add.node));
  ok("4. the reload itself writes nothing", w.writes.length === 0 && w2.writes.length === 0);
}

// 5 — the other readers on a new family's paths: a curriculum with subjects and no lessons / weekDays never throws
{
  const cd = JSON.parse(J(add.node));
  const ctx = { currData: cd, currPaceCum: {}, currPaceCumBase: {}, ROSTER: [KID], dbg() {}, _todayStr: () => "2026-11-23",
    gwParseDate: ds => new Date(ds + "T12:00:00"), cbTodayISO: () => "2026-11-23", scheduleOverrides: {}, paceData: { subjects: {} } };
  vm.createContext(ctx);
  const names = ["buildCurrPaceCum", "gwWeekDateRange", "gwReadWeek", "alignPlanPreview", "currFirstWeekNum", "_maxPlanWeek", "gwSatPlanned",
    "cbTrailingEmptyRows", "_calLessonsFor", "gvMissingDays"];
  vm.runInContext(names.map(n => fnIn(SRC, n)).join("\n"), ctx);
  const tryIt = e => { try { return { v: vm.runInContext(e, ctx) }; } catch (x) { return { err: x.message }; } };
  [["buildCurrPaceCum()", "the pace cumulatives (load, every build)"], ["gwWeekDateRange(1)", "the week's date range (week turn)"],
   ["gwReadWeek(1)", "the plan week read (self-building week)"], ["alignPlanPreview()", "the plan-align preview (Kid's year)"],
   ["currFirstWeekNum()", "the first plan week"], ["_maxPlanWeek()", "the last plan week (finish line)"], ["gwSatPlanned(1)", "Saturday planned? (week turn)"],
   ["cbTrailingEmptyRows('" + KID + "','2026-11-23')", "the grid's trailing rows (build apply)"], ["_calLessonsFor('" + KID + "','2026-11-23')", "a kid's lessons on a date (Kids' Corner)"]]
    .forEach(([e, what]) => { const r = tryIt(e); ok("5. " + what + " — " + e.split("(")[0] + " does not throw", !r.err, r.err); });
  // gvMissingDays (the grid's "add missing days" banner): no rows of its own → nothing missing, so gvAddMissingDays never reaches currData.lessons[kid]
  ctx._gvFullDates = () => new Map();
  ok("5. the grid's missing-days check — gvMissingDays returns [] (gvAddMissingDays stops before its unguarded read)", J((tryIt("gvMissingDays('" + KID + "')")).v) === "[]");
  // the self-building first week waits for a lessons + weekDays node (unchanged: the build is what makes them)
  ok("5. autoGenerateWeekIfNeeded still waits on currData.lessons / weekDays (the fix adds no load-time normalising)",
    fnIn(SRC, "autoGenerateWeekIfNeeded").indexOf("if(!db||!currData||!currData.subjects||!currData.weekDays||!currData.lessons) return;") > 0);
}

// 6 — no names, no new paths
ok("6. the fix's text holds no kid or family name and no database path", !/howe|dewalt|lincoln|ellis|lucy|julian/i.test(FIX_NEW) && FIX_NEW.indexOf("db.ref") < 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
