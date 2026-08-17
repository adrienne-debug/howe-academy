/*
 * Node tests for Stage 4 slice 2: hand-marks on PLAN-BACKED subjects live only in
 * curriculum/done (src "manual"); manualDone text is legacy-only. Runs the real code:
 * the LID block (_lidManualMarks, lidUnmarkLid, lidMarkDone…), _paceManualTitles,
 * ceMarkLessonDone, gvMenuDone, ceUnmarkLessonDone, _ceMarkDoneUI.
 *
 *   run:  node test_manual_done.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID block markers not found"); process.exit(1); }
const block = src.slice(la, lb);
function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) break; continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
// _ceMarkDoneUI has regex literals with quotes (/'/g) that defeat the string-aware slicer; its
// braces are balanced, so the plain brace-slicer is the right tool for it.
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const fns = ["_mdKey", "_mdText", "_paceManualTitles", "ceMarkLessonDone", "gvMenuDone", "ceUnmarkLessonDone"].map(extractFn).concat([braceSlice("_ceMarkDoneUI")]).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// subject: 4 lessons, stamped; planBacked toggled per test via s.planId
function mkEnv(opts) {
  opts = opts || {};
  const s = { display: "MR", lessonSeq: ["pg 1", "pg 2", "pg 3", "pg 4"], lessonIds: ["L0001", "L0002", "L0003", "L0004"], nextLid: 5, doneImportedAt: 1, pacing: null };
  if (opts.planBacked) s.planId = "lincoln__mr";
  if (opts.manualDone) s.manualDone = opts.manualDone;
  const env = {
    currData: { subjects: { lincoln: { mr: s } }, lessons: { lincoln: {} }, done: opts.done || {} },
    momModeActive: true, adminPinUnlocked: false, paceData: { subjects: {} },
    updates: [], sets: [], toast: null, relayMsg: null, cbMsg: "", _gvDelUndo: null,
    momHere: () => true, cbTodayISO: () => "2026-08-17", buildCurrPaceCum: () => {}, renderAll: () => {}, gvGrabScroll: () => {},
    gvFilled: v => !!(v && v !== "—" && String(v).trim()), gvMenu: null, gvEdit: null, cap: x => x,
    _gvRelaySubject: () => false, _gvFinishDeleteNoBuild: () => {},
    _ceRelayAfterMark: (k, sk, msg) => { env.relayMsg = msg; },
    paceDoneTitles: () => [], paceKeywords: () => [], buildSubjectLessons: () => [],
    esc: x => String(x), lidOutOfOrder: () => [],
    document: { getElementById: () => null },
    confirm: () => true,
    Date, Math, Object, JSON, String, Number, Array, parseInt, console,
  };
  env.db = { ref: p => ({ update: u => { env.updates.push({ p, u }); return { catch: () => {} }; }, set: v => { env.sets.push({ p, v }); } }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(block + "\n" + fns).runInContext(env);
  return env;
}
const curr = e => e.updates.filter(u => u.p === "curriculum").map(u => u.u);

console.log("_lidManualMarks / lidUnmarkLid (LID block)");
{
  const e = mkEnv({ done: { lincoln: { mr: { L0001: { src: "check", ts: "a" }, L0003: { src: "manual", ts: "b", day: "2026-08-10" } } } } });
  const m = e._lidManualMarks("lincoln", "mr");
  ok("lists only src:manual records, by lid with list text", eq(m, [{ lid: "L0003", text: "pg 3", day: "2026-08-10", ts: "b" }]), m);
  const p = {};
  ok("unmark a check-off record → refused", e.lidUnmarkLid("lincoln", "mr", "L0001", p) === false && !Object.keys(p).length);
  ok("unmark manual → done path nulled, record gone", e.lidUnmarkLid("lincoln", "mr", "L0003", p) === true && p["done/lincoln/mr/L0003"] === null && !e.currData.done.lincoln.mr.L0003);
  ok("unstamped subject → null / false", (() => { e.currData.subjects.lincoln.mr.doneImportedAt = null; return e._lidManualMarks("lincoln", "mr") === null && e.lidUnmarkLid("lincoln", "mr", "L0003", {}) === false; })());
}
{
  // legacy twin cleanup: manualDone entry of the same text is dropped with the lid record
  const e = mkEnv({ done: { lincoln: { mr: { L0002: { src: "manual" } } } }, manualDone: { "pg 2": { lesson: "pg 2" }, "pg 4": { lesson: "pg 4" } } });
  const p = {};
  e.lidUnmarkLid("lincoln", "mr", "L0002", p);
  ok("legacy manualDone twin removed too, other entries kept", eq(Object.keys(p["subjects/lincoln/mr/manualDone"]), ["pg 4"]));
}

console.log("_paceManualTitles — manualDone ∪ done/manual, de-duped by text");
{
  const e = mkEnv({ done: { lincoln: { mr: { L0001: { src: "check" }, L0002: { src: "manual" }, L0003: { src: "manual" } } } }, manualDone: { "pg 3": { lesson: "pg 3" }, "pg 4": { lesson: "pg 4" } } });
  const t = e._paceManualTitles("lincoln", "mr");
  ok("legacy pg3+pg4 and id-marks pg2+pg3 → 3 titles (pg3 once), check-off excluded", eq(t.slice().sort(), ["📄 mr — pg 2", "📄 mr — pg 3", "📄 mr — pg 4"]), t);
  const e2 = mkEnv({});
  ok("nothing marked → []", eq(e2._paceManualTitles("lincoln", "mr"), []));
  ok("unknown subject → []", eq(e2._paceManualTitles("lincoln", "zz"), []));
  const e3 = mkEnv({ manualDone: { "pg 1": { lesson: "pg 1" } } }); e3.currData.subjects.lincoln.mr.doneImportedAt = null; // legacy, unstamped
  ok("unstamped legacy subject: manualDone only, unchanged behaviour", eq(e3._paceManualTitles("lincoln", "mr"), ["📄 mr — pg 1"]));
}

console.log("ceMarkLessonDone — plan-backed writes done/manual ONLY; legacy dual-writes");
{
  const e = mkEnv({ planBacked: true });
  e.ceMarkLessonDone("lincoln", "mr", "pg 2", false);
  const u = curr(e)[0] || {};
  ok("done/<lid> written with src manual", u["done/lincoln/mr/L0002"] && u["done/lincoln/mr/L0002"].src === "manual", u);
  ok("NO manualDone path in the update", !Object.keys(u).some(k => k.indexOf("manualDone") >= 0), Object.keys(u));
  ok("in-memory subject has no manualDone", !e.currData.subjects.lincoln.mr.manualDone);
  ok("Undo covers the done record (prev null)", e._gvDelUndo && e._gvDelUndo.paths["done/lincoln/mr/L0002"] === null);
  ok("re-lay requested", /Marked 1 lesson/.test(e.relayMsg || ""));
}
{
  const e = mkEnv({ planBacked: false });
  e.ceMarkLessonDone("lincoln", "mr", "pg 2", false);
  const u = curr(e)[0] || {};
  ok("legacy (stamped, not plan-backed): manualDone written", u["subjects/lincoln/mr/manualDone"] && u["subjects/lincoln/mr/manualDone"]["pg 2"], u);
  ok("legacy: done/<lid> still dual-written", u["done/lincoln/mr/L0002"] && u["done/lincoln/mr/L0002"].src === "manual");
}
{
  // through-here on plan-backed: 3 records, no manualDone
  const e = mkEnv({ planBacked: true });
  e.ceMarkLessonDone("lincoln", "mr", "pg 3", true);
  const u = curr(e)[0] || {};
  const doneKeys = Object.keys(u).filter(k => k.indexOf("done/") === 0).sort();
  ok("through here → L0001..L0003 done records, nothing else", eq(doneKeys, ["done/lincoln/mr/L0001", "done/lincoln/mr/L0002", "done/lincoln/mr/L0003"]) && Object.keys(u).length === 3, u);
}

console.log("gvMenuDone — grid ✓ on a plan-backed subject");
{
  const e = mkEnv({ planBacked: true });
  e.currData.lessons.lincoln = { 5: { date: "2026-08-20", mr: "pg 2" } };
  e.gvMenuDone("lincoln", 5, "mr");
  const u = curr(e)[0] || {};
  ok("future cell: done record + cell cleared, no manualDone", u["done/lincoln/mr/L0002"] && u["done/lincoln/mr/L0002"].src === "manual" && u["lessons/lincoln/5/mr"] === null && !Object.keys(u).some(k => k.indexOf("manualDone") >= 0), u);
}
{
  const e = mkEnv({ planBacked: true });
  e.currData.lessons.lincoln = { 3: { date: "2026-08-10", mr: "pg 1" } };
  e.gvMenuDone("lincoln", 3, "mr");
  const u = curr(e)[0] || {};
  ok("past cell: done record dated to the cell's day, cell KEPT", u["done/lincoln/mr/L0001"] && u["done/lincoln/mr/L0001"].day === "2026-08-10" && !("lessons/lincoln/3/mr" in u), u);
}
{
  const e = mkEnv({ planBacked: false });
  e.currData.lessons.lincoln = { 5: { date: "2026-08-20", mr: "pg 2" } };
  e.gvMenuDone("lincoln", 5, "mr");
  const u = curr(e)[0] || {};
  ok("legacy subject: manualDone still written by grid ✓", u["subjects/lincoln/mr/manualDone"] && u["subjects/lincoln/mr/manualDone"]["pg 2"]);
}

console.log("_ceMarkDoneUI chips + ceUnmarkLessonDone by lid");
{
  const e = mkEnv({ planBacked: true, done: { lincoln: { mr: { L0001: { src: "check" }, L0002: { src: "manual" } } } }, manualDone: { "pg 2": { lesson: "pg 2" }, "pg 4": { lesson: "pg 4" } } });
  const h = e._ceMarkDoneUI("lincoln", "mr", e.currData.subjects.lincoln.mr, [], 0, "#000");
  ok("chip for the id-mark uses lid: key", h.indexOf("ceUnmarkLessonDone('lincoln','mr','lid:L0002')") >= 0);
  ok("legacy leftover (pg 4) still shown by its manualDone key; twin pg 2 not doubled", h.indexOf("'pg 4')") >= 0 && (h.match(/pg 2</g) || []).length === 1);
  ok("count reads 2", h.indexOf("Hand-marked done (2)") >= 0);
  ok("upcoming skips done lessons by id (pg 3, pg 4 offered; pg 1/pg 2 not)", h.indexOf("'pg 3',false") >= 0 && h.indexOf("'pg 1',false") < 0 && h.indexOf("'pg 2',false") < 0);
  // unmark by lid
  e.ceUnmarkLessonDone("lincoln", "mr", "lid:L0002");
  const u = curr(e)[0] || {};
  ok("unmark by lid: done nulled + legacy twin dropped from manualDone", u["done/lincoln/mr/L0002"] === null && u["subjects/lincoln/mr/manualDone"] && !u["subjects/lincoln/mr/manualDone"]["pg 2"] && u["subjects/lincoln/mr/manualDone"]["pg 4"], u);
  ok("relay message names the lesson", /Un-marked “pg 2”/.test(e.relayMsg || ""), e.relayMsg);
  // unmark a check-off by lid → refused, no write
  const n = e.updates.length;
  e.ceUnmarkLessonDone("lincoln", "mr", "lid:L0001");
  ok("check-off record can't be un-marked here", e.updates.length === n);
}
{
  // legacy key path unchanged
  const e = mkEnv({ planBacked: false, manualDone: { "pg 4": { lesson: "pg 4" } } });
  e.ceUnmarkLessonDone("lincoln", "mr", "pg 4");
  ok("legacy key: manualDone set(null) as before", e.sets.some(s => s.p === "curriculum/subjects/lincoln/mr/manualDone" && s.v === null), e.sets);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
