/*
 * Node tests for ↩ Undo "Edit as a list" — ceConvUndoGet / Apply / Banner.
 *
 * ceConvApply has always stashed the cells it cleared into ha_convUndo, and
 * nothing ever read it. These cover the restore that was missing on 2026-08-15,
 * when Lincoln's AAS lost 91 cells and the snapshot sat unused in localStorage:
 * both halves go back together, stale/foreign snapshots are ignored, conflicting
 * cells are surfaced before they're overwritten, and a rebuild since the Save is
 * warned about rather than silently clobbered.
 *
 *   run:  node test_conv_undo.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// ── ↩ Undo \"Edit as a list\" ");
const b = src.indexOf("// Rename one Excel-sourced lesson in place");
if (a < 0 || b < 0) { console.error("conv-undo block markers not found"); process.exit(1); }
// The undo now restores lesson ids through setLessonSeq (LID block, Stage 1).
const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID block markers not found"); process.exit(1); }
const block = src.slice(la, lb) + "\n" + src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Harness: a fake localStorage, a fake db that records the multi-path update,
// and the confirm() answer under test.
function mk(opts) {
  opts = opts || {};
  const store = {};
  const env = {
    HA_LS: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    currData: opts.currData,
    paceData: opts.paceData || { subjects: {} },
    momModeActive: opts.mom !== false, adminPinUnlocked: false,
    confirmAnswer: opts.confirm !== false,
    lastConfirmMsg: null,
    written: null,
    toast: null,
    esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    renderAll: () => {},
    savePaceSubject: () => {},
    buildCurrPaceCum: () => {},
    Date, Math, Object, JSON, String, Number, Array, console,
  };
  env.confirm = m => { env.lastConfirmMsg = m; return env.confirmAnswer; };
  env.gwShowToast = t => { env.toast = t; };
  env.db = { ref: () => ({ update: u => { env.written = u; } }) };
  env.window = env;
  const vm = require("vm");
  vm.createContext(env);
  new vm.Script(block).runInContext(env);
  env._store = store;
  return env;
}

// A subject with 3 future cells cleared and a previous 20-lesson list.
function fixture(over) {
  over = over || {};
  return {
    currData: {
      subjects: { lincoln: { aas: Object.assign({ display: "AAS Lesson", lessonSeq: ["new1", "new2"], total: 2 }, over.subj || {}) } },
      lessons: { lincoln: Object.assign({
        40: { date: "2026-08-17" }, 41: { date: "2026-08-19" }, 42: { date: "2026-08-21" },
      }, over.rows || {}) },
    },
    snap: Object.assign({
      kid: "lincoln", sk: "aas",
      cells: { 40: "L2-16", 41: "L2-18", 42: "L2-19" },
      prevSeq: Array.from({ length: 20 }, (_, i) => "L2-" + (i + 7)),
      prevTotal: 20,
      at: Date.now() - 60000,
    }, over.snap || {}),
  };
}

console.log("reading the snapshot");
{
  const f = fixture(), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  ok("finds a fresh snapshot", !!e.ceConvUndoGet());
}
{
  const f = fixture({ snap: { at: Date.now() - 1000 * 60 * 60 * 96 } }), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  ok("ignores one older than the 3-day window", e.ceConvUndoGet() === null);
}
{
  const f = fixture(), e = mk(f);
  delete e.currData.subjects.lincoln.aas;
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  ok("ignores a snapshot whose subject was deleted", e.ceConvUndoGet() === null);
}
{
  const f = fixture({ snap: { cells: {} } }), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  ok("ignores an empty snapshot", e.ceConvUndoGet() === null);
}
{
  const e = mk(fixture());
  e.HA_LS.setItem("ha_convUndo", "{not json");
  ok("survives corrupt json", e.ceConvUndoGet() === null);
}

console.log("restoring both halves");
{
  const f = fixture(), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  const w = e.written || {};
  ok("writes every cleared cell back",
    w["lessons/lincoln/40/aas"] === "L2-16" && w["lessons/lincoln/41/aas"] === "L2-18" && w["lessons/lincoln/42/aas"] === "L2-19");
  ok("restores the previous lesson list", (w["subjects/lincoln/aas/lessonSeq"] || []).length === 20);
  ok("restores the previous total", w["subjects/lincoln/aas/total"] === 20);
  ok("updates currData in step", e.currData.lessons.lincoln[40].aas === "L2-16");
  ok("clears the snapshot after use", e.ceConvUndoGet() === null);
}
{
  // prevSeq null = the subject had NO master list before the Save. Restoring must
  // put that absence back, not leave the list the Save invented.
  const f = fixture({ snap: { prevSeq: null, prevTotal: 0 } }), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  ok("restores 'no master list' as an absence", e.written["subjects/lincoln/aas/lessonSeq"] === null);
  ok("and drops it off the subject object", !("lessonSeq" in e.currData.subjects.lincoln.aas));
}
{
  const f = fixture(), e = mk(f);
  e.confirmAnswer = false;
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  ok("writes nothing when the confirm is declined", e.written === null);
  ok("and keeps the snapshot for another try", !!e.ceConvUndoGet());
}
{
  // A day that has since left the map must not be resurrected.
  const f = fixture(), e = mk(f);
  delete e.currData.lessons.lincoln[42];
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  ok("skips cells whose day is gone from the map", !("lessons/lincoln/42/aas" in e.written));
  ok("still restores the days that remain", e.written["lessons/lincoln/40/aas"] === "L2-16");
}

console.log("overwrite safety");
{
  const f = fixture({ rows: { 41: { date: "2026-08-19", aas: "SOMETHING NEWER" } } }), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  ok("names the cells it would overwrite", /SOMETHING NEWER/.test(e.lastConfirmMsg || ""), e.lastConfirmMsg);
  ok("counts them", /1 of those day/.test(e.lastConfirmMsg || ""));
}
{
  const f = fixture(), e = mk(f);   // no conflicts
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  ok("stays quiet when nothing would be overwritten", !/overwrites/.test(e.lastConfirmMsg || ""));
}
{
  const e = mk(fixture());
  e.momModeActive = false; e.adminPinUnlocked = false;
  const f = fixture();
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  e.ceConvUndoApply();
  ok("does nothing outside mom mode", e.written === null);
}

console.log("the banner");
{
  const f = fixture(), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  const g = e.ceConvUndoBanner("lincoln", "grid");
  ok("renders in the grid for the right kid", g.indexOf("Put them back") > 0);
  ok("names the subject and the count", /AAS Lesson/.test(g) && /3 cells/.test(g));
  ok("hides for a different kid", e.ceConvUndoBanner("ellis", "grid") === "");
  ok("renders on the owning card", e.ceConvUndoBanner("lincoln", "aas").indexOf("Put them back") > 0);
  ok("hides on a different card", e.ceConvUndoBanner("lincoln", "singapore_l") === "");
  const d = (g.match(/<div\b/g) || []).length - (g.match(/<\/div>/g) || []).length;
  ok("divs balance", d === 0, d);
}
{
  // Rebuilt after the Save — restoring replaces that work, so say so.
  const f = fixture({ subj: { pacing: { builtAt: new Date(Date.now() - 1000).toISOString() } } }), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  ok("warns when the subject was rebuilt since the Save",
    /rebuilt after that Save/.test(e.ceConvUndoBanner("lincoln", "grid")));
}
{
  const f = fixture({ subj: { pacing: { builtAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() } } }), e = mk(f);
  e.HA_LS.setItem("ha_convUndo", JSON.stringify(f.snap));
  ok("no warning when the rebuild predates the Save",
    !/rebuilt after that Save/.test(e.ceConvUndoBanner("lincoln", "grid")));
}
{
  const e = mk(fixture());
  ok("renders nothing with no snapshot", e.ceConvUndoBanner("lincoln", "grid") === "");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
