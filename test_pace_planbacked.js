/*
 * Node tests for Stage 4 slice 4: pace hand-counts (offset / adjust / paceAdjust) are
 * legacy-only. A stamped subject's progress is its done record by lesson id; the card
 * shows no hand-count inputs for plan-backed subjects; "skip for good" is refused for
 * them (a lesson is done or owed — never passed over). Runs the real code.
 *
 *   run:  node test_pace_planbacked.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID block markers not found"); process.exit(1); }
const block = src.slice(la, lb);
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const fns = ["computeSubjectDone", "cePaceClearHand", "momDismiss"].map(braceSlice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function mkEnv(o) {
  o = o || {};
  const s = { display: "MR", lessonSeq: ["a", "b", "c", "d", "e"], lessonIds: ["L0001", "L0002", "L0003", "L0004", "L0005"] };
  if (o.stamped !== false) s.doneImportedAt = 1;
  if (o.planBacked) s.planId = "lincoln__mr";
  const env = {
    currData: { subjects: { lincoln: { mr: s } }, done: { lincoln: { mr: o.done || {} } } },
    lidsFor: (k, sk) => (env.currData.subjects[k][sk] || {}).lessonIds || null,
    paceData: { subjects: { lincoln: { mr: Object.assign({ offset: 0, adjust: 0, paceAdjust: 0, total: 5 }, o.pace || {}) } } },
    paceKeywords: () => ["MR"], paceAutoCount: () => (o.auto == null ? 2 : o.auto),
    saved: null, toast: null, confirmText: null, confirmAnswer: true, rendered: 0,
    savePaceSubject: (k, sk, d) => { env.saved = { k, sk, d }; }, ceRenderEditSheet: () => { env.rendered++; },
    momHere: () => true, gwShowToast: t => { env.toast = t; },
    confirm: t => { env.confirmText = t; return env.confirmAnswer; },
    // momDismiss deps
    weekData: { tasks: [{ id: "t1", who: "lincoln", subjectKey: "mr", day: "monday", title: "MR — c" }] },
    momMoves: {}, checked: {}, effectiveDay: t => t.day, _isNextUpLesson: () => true, nowTs: () => "ts",
    _saveMomMove: (id, rec) => { env.moved = { id, rec }; }, closeDlg: () => {}, schedCascade: () => {}, renderAll: () => {}, dbg: () => {},
    Date, Math, Object, JSON, String, Number, Array, parseInt, console,
  };
  env.window = env;
  vm.createContext(env);
  new vm.Script(block + "\n" + fns).runInContext(env);
  return env;
}

console.log("computeSubjectDone — done record by id for stamped; legacy formula otherwise");
{
  const e = mkEnv({ done: { L0001: { src: "check" }, L0002: { src: "manual" }, L0004: { src: "import" } }, pace: { offset: 3, paceAdjust: 1 } });
  ok("stamped: |done| = 3 (check + manual + import), hand-counts ignored", e.computeSubjectDone("lincoln", "mr") === 3);
  const e2 = mkEnv({ stamped: false, pace: { offset: 3, paceAdjust: 1 }, auto: 2 });
  ok("legacy: offset+auto+paceAdjust = 6, unchanged", e2.computeSubjectDone("lincoln", "mr") === 6);
  const e3 = mkEnv({});
  ok("stamped, nothing done → 0", e3.computeSubjectDone("lincoln", "mr") === 0);
}

console.log("cePaceClearHand — zero the legacy numbers on a plan-backed subject");
{
  const e = mkEnv({ planBacked: true, pace: { offset: 0, adjust: -1, paceAdjust: -1, total: 138 } });
  e.cePaceClearHand("lincoln", "mr");
  ok("confirm names the three numbers", /offset 0 · cursor adjust -1 · progress adjust -1/.test(e.confirmText || ""), e.confirmText);
  ok("savePaceSubject called with zeros, total kept", e.saved && e.saved.d.offset === 0 && e.saved.d.adjust === 0 && e.saved.d.paceAdjust === 0 && e.saved.d.total === 138, e.saved);
  ok("sheet re-rendered + toast", e.rendered === 1 && /cleared/i.test(e.toast || ""));
  const e2 = mkEnv({ planBacked: true, pace: { adjust: -1 } }); e2.confirmAnswer = false; e2.cePaceClearHand("lincoln", "mr");
  ok("cancel → nothing saved", e2.saved === null);
  const e3 = mkEnv({ planBacked: true }); e3.momHere = () => false; e3.cePaceClearHand("lincoln", "mr");
  ok("kid mode → no-op", e3.saved === null);
}

console.log("momDismiss 'skip for good' — refused for plan-backed, unchanged for legacy");
{
  const e = mkEnv({ planBacked: true });
  e.momDismiss("t1", "good");
  ok("plan-backed: toast, no adjust bump, no mom-move", /plan-backed/.test(e.toast || "") && e.saved === null && !e.moved, e.toast);
  const e2 = mkEnv({ planBacked: false });
  e2.momDismiss("t1", "good");
  ok("legacy: adjust bumped +1 and move recorded", e2.saved && e2.saved.d.adjust === 1 && e2.moved && e2.moved.rec.adjusted && e2.moved.rec.adjusted.by === 1, e2.saved);
}

console.log("card — hand-count inputs hidden for plan-backed (source assertions)");
{
  ok("card branches on planBacked and shows a Progress line", /const _pbCard=\(typeof planBacked==="function"\)&&planBacked\(ceEditKid,ceEditKey\);/.test(src) && src.indexOf("Counted by lesson id from the done record") >= 0);
  ok("Clear-them button wired to cePaceClearHand", src.indexOf("cePaceClearHand(\\''+ceEditKid+'\\',\\''+ceEditKey+'\\')") >= 0);
  ok("legacy inputs still present in the else branch", src.indexOf("onchange=\"ceSetCount(\\'adjust\\'") >= 0 && src.indexOf("onchange=\"ceSetCount(\\'paceAdjust\\'") >= 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
