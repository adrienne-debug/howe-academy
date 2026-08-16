/*
 * Node tests for LESSON IDENTITY (Stage 1 of the Grid/Scheduler restructure).
 *
 * Every lesson in a subject's master list gets a stable id ("L0007") in a parallel
 * `lessonIds` array. These cover the one writer (setLessonSeq) and the alignment
 * rules that keep ids attached to the right lesson through renames, inserts,
 * deletes, reorders and repeats — and that NEVER mint ids on a subject that has
 * none unless asked (no lazy minting: a stale device must not invent a set).
 *
 *   run:  node test_lesson_ids.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID block markers not found"); process.exit(1); }
const block = src.slice(la, lb);
const sa = src.indexOf("// LID_SERVE_START"), sb = src.indexOf("// LID_SERVE_END");
const ta = src.indexOf("// LID_STAMP_START"), tb = src.indexOf("// LID_STAMP_END");
if (sa < 0 || sb < 0 || ta < 0 || tb < 0) { console.error("LID_SERVE/LID_STAMP markers not found"); process.exit(1); }
const serveBlock = src.slice(sa, sb) + "\n" + src.slice(ta, tb);

// Writers rewired onto setLessonSeq — extracted verbatim so the test runs the real code.
function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const writers = ["ceSaveLessonSeq", "gvSyncSeqInto", "gvSelUndoApply"].map(extractFn).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mk(subjects) {
  const env = {
    currData: { subjects: JSON.parse(JSON.stringify(subjects || {})), lessons: {} },
    momModeActive: true, adminPinUnlocked: false,
    confirmAnswer: true, written: null, toast: null,
    ceEditKid: "lincoln", ceEditKey: "mr",
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    gvRecountTotal: () => {}, buildCurrPaceCum: () => {}, renderAll: () => {}, gvGrabScroll: () => {},
    Date, Math, Object, JSON, String, Number, Array, parseInt, console,
  };
  env.confirm = () => env.confirmAnswer;
  env.gwShowToast = t => { env.toast = t; };
  env.db = { ref: () => ({ update: u => { env.written = u; return { catch: () => {} }; } }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(block + "\n" + serveBlock + "\n" + writers).runInContext(env);
  return env;
}
const S = (seq, ids, next) => { const s = { display: "MR", lessonSeq: seq.slice() }; if (ids) { s.lessonIds = ids.slice(); s.nextLid = next; } return s; };

console.log("_lidAlign — pure alignment");
{
  const e = mk();
  // no ids, no mint → stays id-less
  let r = e._lidAlign(["a", "b"], null, ["a", "b", "c"], 1, null, false);
  ok("no ids + no mint → ids null (no lazy minting)", r.ids === null);
  r = e._lidAlign(null, null, ["a", "b", "c"], 1, null, true);
  ok("mint from scratch → L0001..L0003, next 4", eq(r.ids, ["L0001", "L0002", "L0003"]) && r.nextLid === 4);
  // rename, same length
  r = e._lidAlign(["pg 25", "pg 27", "pg 28"], ["L0001", "L0002", "L0003"], ["pg 25", "pg 26", "pg 28"], 4);
  ok("same length rename keeps the id (pg 27→pg 26 = L0002)", eq(r.ids, ["L0001", "L0002", "L0003"]) && r.nextLid === 4);
  // dash fix is a rename too
  r = e._lidAlign(["pp.224-227"], ["L0009"], ["pp.224–227"], 10);
  ok("dash normalisation: hyphen→en-dash keeps id", eq(r.ids, ["L0009"]));
  // reorder, same length → ids follow text
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["b", "a", "c"], 4);
  ok("reorder follows the text", eq(r.ids, ["L0002", "L0001", "L0003"]));
  // insert (no hint) → mint, others kept
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["a", "x", "b", "c"], 4);
  ok("insert without hint → new id for x, rest kept", eq(r.ids, ["L0001", "L0004", "L0002", "L0003"]) && r.nextLid === 5);
  // delete (no hint) → id dropped
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["a", "c"], 4);
  ok("delete without hint → L0002 dropped, next unchanged", eq(r.ids, ["L0001", "L0003"]) && r.nextLid === 4);
  // dropped id never reused
  r = e._lidAlign(["a", "c"], ["L0001", "L0003"], ["a", "c", "b"], 4);
  ok("dropped id is never reused (b gets L0004, not L0002)", eq(r.ids, ["L0001", "L0003", "L0004"]));
  // delete + insert of different length → NOT a rename
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["a", "c", "x", "y"], 4);
  ok("delete+insert (length differs) never pairs a rename", eq(r.ids, ["L0001", "L0003", "L0004", "L0005"]));
  // repeats: each occurrence its own id, matched in order
  r = e._lidAlign(["Free choice", "Free choice", "Free choice"], ["L0001", "L0002", "L0003"], ["Free choice", "Free choice"], 4);
  ok("repeats: first two occurrences keep first two ids", eq(r.ids, ["L0001", "L0002"]));
  r = e._lidAlign(["Free choice", "Free choice"], ["L0001", "L0002"], ["Free choice", "Free choice", "Free choice"], 3);
  ok("repeats: added occurrence mints", eq(r.ids, ["L0001", "L0002", "L0003"]));
  // hints
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["a", "b", "x", "c"], 4, { index: 2, op: "insert" });
  ok("hint insert at 2 → new id at 2", eq(r.ids, ["L0001", "L0002", "L0004", "L0003"]));
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["a", "c"], 4, { index: 1, op: "delete" });
  ok("hint delete at 1 → L0002 gone", eq(r.ids, ["L0001", "L0003"]));
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002", "L0003"], ["a", "c"], 4, { index: 1, op: "insert" });
  ok("hint that doesn't fit the change is ignored (falls back to matching)", eq(r.ids, ["L0001", "L0003"]));
  // out-of-step ids are treated as none
  r = e._lidAlign(["a", "b", "c"], ["L0001", "L0002"], ["a", "b", "c", "d"], 3, null, false);
  ok("ids out of step with seq → treated as none (null, no mint)", r.ids === null);
  // nextLid missing → derived from max id
  r = e._lidAlign(["a", "b"], ["L0004", "L0009"], ["a", "b", "c"], undefined);
  ok("missing nextLid derives from max existing id", eq(r.ids, ["L0004", "L0009", "L0010"]));
}

console.log("setLessonSeq — the one writer");
{
  const e = mk({ lincoln: { mr: S(["a", "b", "c"], ["L0001", "L0002", "L0003"], 4), noid: S(["x", "y"]) } });
  let patch = {};
  let r = e.setLessonSeq("lincoln", "mr", ["a", "b", "c", "d"], { patch });
  ok("patch carries lessonSeq/lessonIds/total/nextLid under subjects/<kid>/<sk>/", eq(Object.keys(patch).sort(), ["subjects/lincoln/mr/lessonIds", "subjects/lincoln/mr/lessonSeq", "subjects/lincoln/mr/nextLid", "subjects/lincoln/mr/total"]));
  ok("in-memory subject updated in step", eq(e.currData.subjects.lincoln.mr.lessonIds, ["L0001", "L0002", "L0003", "L0004"]) && e.currData.subjects.lincoln.mr.total === 4 && e.currData.subjects.lincoln.mr.nextLid === 5);
  patch = {};
  r = e.setLessonSeq("lincoln", "noid", ["x", "y", "z"], { patch });
  ok("subject without ids: writes seq/total ONLY (byte-identical to before)", eq(Object.keys(patch).sort(), ["subjects/lincoln/noid/lessonSeq", "subjects/lincoln/noid/total"]) && r.lessonIds === null);
  patch = {};
  e.setLessonSeq("lincoln", "noid", ["x", "y", "z"], { patch, mint: true });
  ok("mint:true assigns ids to an id-less subject", eq(patch["subjects/lincoln/noid/lessonIds"], ["L0001", "L0002", "L0003"]) && patch["subjects/lincoln/noid/nextLid"] === 4);
  patch = {};
  e.setLessonSeq("lincoln", "mr", null, { patch });
  ok("null clears seq AND ids AND total", patch["subjects/lincoln/mr/lessonSeq"] === null && patch["subjects/lincoln/mr/lessonIds"] === null && patch["subjects/lincoln/mr/total"] === 0 && !("lessonIds" in e.currData.subjects.lincoln.mr));
  patch = {};
  e.setLessonSeq("lincoln", "mr", ["p", "q"], { patch, restoreIds: ["L0007", "L0002"], restoreNext: 9 });
  ok("restoreIds/restoreNext used verbatim (undo path)", eq(patch["subjects/lincoln/mr/lessonIds"], ["L0007", "L0002"]) && patch["subjects/lincoln/mr/nextLid"] === 9);
  ok("lidsFor returns ids only when aligned", eq(e.lidsFor("lincoln", "mr"), ["L0007", "L0002"]) && e.lidsFor("lincoln", "nope") === null);
  ok("unknown subject → null, no throw", e.setLessonSeq("lincoln", "zzz", ["a"], {}) === null);
}

console.log("gvAssignLids — Mom's one-time tap");
{
  const e = mk({ lincoln: { mr: S(["a", "b"]), has: S(["q"], ["L0001"], 2), daily: { display: "Drills", tracking: "daily" } }, lucy: { hwt: S(["p1", "p2", "p3"]) } });
  const un = e.lidUnassigned();
  ok("lidUnassigned lists only id-less subjects with a list (2)", un.length === 2 && un.map(x => x.kid + "/" + x.sk).sort().join(",") === "lincoln/mr,lucy/hwt");
  e.gvAssignLids();
  const w = e.written;
  ok("one multi-path update", !!w);
  ok("writes ids + nextLid for both, never lessonSeq/total", w && eq(w["subjects/lincoln/mr/lessonIds"], ["L0001", "L0002"]) && w["subjects/lucy/hwt/nextLid"] === 4 && !("subjects/lincoln/mr/lessonSeq" in w) && !("subjects/lincoln/mr/total" in w));
  ok("subject that already had ids untouched", w && !("subjects/lincoln/has/lessonIds" in w));
  ok("lastEdit moved", w && !!w["lastEdit"]);
  ok("nothing left unassigned afterwards", e.lidUnassigned().length === 0);
  e.written = null; e.gvAssignLidsUndo();
  ok("undo removes ids + nextLid for the same subjects", e.written && e.written["subjects/lincoln/mr/lessonIds"] === null && e.written["subjects/lucy/hwt/nextLid"] === null && !("subjects/lincoln/has/lessonIds" in e.written));
  ok("undo restores in-memory (unassigned again)", e.lidUnassigned().length === 2);
  const e2 = mk({ lincoln: { mr: S(["a"]) } }); e2.confirmAnswer = false; e2.gvAssignLids();
  ok("cancel writes nothing", e2.written === null);
  const e3 = mk({ lincoln: { mr: S(["a"]) } }); e3.momModeActive = false; e3.gvAssignLids();
  ok("not mom → no write", e3.written === null);
}

console.log("rewired writers");
{
  // ceSaveLessonSeq — whole-list edit from the card textarea
  const e = mk({ lincoln: { mr: S(["a", "b", "c"], ["L0001", "L0002", "L0003"], 4) } });
  e.ceSaveLessonSeq("a\nB2 pg 26\nc\n");
  ok("ceSaveLessonSeq: same-length edit = rename, id kept, one curriculum.update", e.written && eq(e.written["subjects/lincoln/mr/lessonIds"], ["L0001", "L0002", "L0003"]) && eq(e.written["subjects/lincoln/mr/lessonSeq"], ["a", "B2 pg 26", "c"]) && !!e.written["lastEdit"]);
  // gvSyncSeqInto — grid → list, and its undo
  const g = mk({ lincoln: { mr: S(["a", "b", "c"], ["L0001", "L0002", "L0003"], 4) } });
  g.currData.lessons = { lincoln: { 1: { date: "2026-08-10", mr: "a" }, 2: { date: "2026-08-11", mr: "c" } } };
  const patch = {}; const undo = g.gvSyncSeqInto(patch, ["mr"], "lincoln");
  ok("gvSyncSeqInto: grid [a,c] → ids [L0001,L0003], no total in patch", eq(patch["subjects/lincoln/mr/lessonIds"], ["L0001", "L0003"]) && !("subjects/lincoln/mr/total" in patch));
  ok("gvSyncSeqInto undo record carries seq+ids+next", undo.mr && eq(undo.mr.seq, ["a", "b", "c"]) && eq(undo.mr.ids, ["L0001", "L0002", "L0003"]) && undo.mr.next === 4);
  g.gvSelUndo = { kid: "lincoln", undo: {}, seqUndo: undo, subs: ["mr"] };
  g.gvSelUndoApply();
  ok("gvSelUndoApply restores ids exactly", g.written && eq(g.written["subjects/lincoln/mr/lessonIds"], ["L0001", "L0002", "L0003"]) && g.written["subjects/lincoln/mr/nextLid"] === 4);
  g.gvSelUndo = { kid: "lincoln", undo: {}, seqUndo: { mr: ["a", "b"] }, subs: ["mr"] }; g.written = null;
  g.gvSelUndoApply();
  ok("gvSelUndoApply accepts the pre-ids array shape", g.written && eq(g.written["subjects/lincoln/mr/lessonSeq"], ["a", "b"]));
}

console.log("_lidServedFor + gwStampLids — ids onto served rows and cards (Stage 1.2)");
{
  const e = mk({ lincoln: { mr: S(["a", "b", "b", "c"], ["L0001", "L0002", "L0003", "L0004"], 5), noid: S(["x"]) } });
  e.taskLessonRef = t => { const m = (t && t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; };
  e.toMin = t => { const m = /(\d+):(\d+)\s*(AM|PM)?/i.exec(t || ""); if (!m) return 0; let h = +m[1]; if (/pm/i.test(m[3]) && h < 12) h += 12; if (/am/i.test(m[3]) && h === 12) h = 0; return h * 60 + (+m[2]); };
  // grid rows: b appears twice → two different ids in date order; z is not on the list → null
  const rows = [{ dayNum: 1, lesson: "b", date: "2026-08-10" }, { dayNum: 2, lesson: "z", date: "2026-08-11" }, { dayNum: 3, lesson: "b", date: "2026-08-12" }, { dayNum: 4, lesson: "C", date: "2026-08-13" }];
  const lids = e._lidServedFor("lincoln", "mr", rows);
  ok("grid rows: repeats take successive list ids, unknown text → null, case/dash-insensitive", eq(lids, ["L0002", null, "L0003", "L0004"]));
  ok("list-fallback rows (dayNum ≥ 90000) map by index", eq(e._lidServedFor("lincoln", "mr", [{ dayNum: 90002, lesson: "b" }, { dayNum: 90000, lesson: "a" }]), ["L0003", "L0001"]));
  ok("subject without ids → null (nothing stamped)", e._lidServedFor("lincoln", "noid", rows) === null);
  ok("empty rows → null", e._lidServedFor("lincoln", "mr", []) === null);
  // stamping cards
  const served = { lincoln: { mr: [{ text: "b", lid: "L0002" }, { text: "b", lid: "L0003" }, { text: "c", lid: "L0004" }, { text: "q", lid: null }] } };
  const T = (id, day, time, sk, txt, who) => ({ id, who: who || "lincoln", subjectKey: sk, day, time, title: "📄 MR — " + txt });
  const tasks = [T("d2_5", "tuesday", "10:00 AM", "mr", "b"), T("d1_1", "monday", "9:00 AM", "mr", "b"), T("d3_9", "wednesday", "9:00 AM", "mr", "c"), T("d3_9_c", "monday", "9:00 AM", "mr", "b"), T("d1_2", "monday", "9:30 AM", "drills", "b"), T("d4_1", "thursday", "9:00 AM", "mr", "b"), T("d4_2", "thursday", "9:30 AM", "mr", "q")];
  const n = e.gwStampLids(tasks, served);
  const by = {}; tasks.forEach(t => { by[t.id] = t.lid || null; });
  ok("stamps in day order: Mon b→L0002, Tue b→L0003, Wed c→L0004", by["d1_1"] === "L0002" && by["d2_5"] === "L0003" && by["d3_9"] === "L0004");
  ok("third 'b' has no served entry left → unstamped; null-lid served entry stamps nothing", by["d4_1"] === null && by["d4_2"] === null);
  ok("_c carries and other subjects untouched", by["d3_9_c"] === null && by["d1_2"] === null);
  ok("returns the stamped count (3)", n === 3);
  ok("no served → 0, no throw", e.gwStampLids(tasks, null) === 0);
}

console.log("lidDoneWrite / lidDoneRemove — done-by-lesson-id (Stage 1.3)");
{
  const e = mk({ lincoln: { mr: S(["a", "b"], ["L0001", "L0002"], 3) } });
  const sets = []; const removes = [];
  e.db = { ref: p => ({ set: v => { sets.push([p, v]); }, remove: () => { removes.push(p); }, update: () => ({ catch: () => {} }) }) };
  e.cbTodayISO = () => "2026-08-16";
  const t = { id: "2026d228_12", who: "lincoln", subjectKey: "mr", lid: "L0002", title: "📄 MR — b" };
  ok("card with lid → writes curriculum/done/<kid>/<sk>/<lid> {ts,day,taskId,src:check}", e.lidDoneWrite(t, "10:14 AM Aug 16", t.id) === true && sets.length === 1 && sets[0][0] === "curriculum/done/lincoln/mr/L0002" && eq(sets[0][1], { ts: "10:14 AM Aug 16", day: "2026-08-16", taskId: "2026d228_12", src: "check" }));
  ok("in-memory currData.done mirrors it", e.currData.done.lincoln.mr.L0002.taskId === "2026d228_12");
  ok("card without lid → nothing", e.lidDoneWrite({ id: "x", who: "lincoln", subjectKey: "mr", title: "📄 MR — a" }, "ts", "x") === false && sets.length === 1);
  ok("uncheck by a DIFFERENT card (twin/_c) leaves the record", e.lidDoneRemove({ id: "2026d228_12_c", who: "lincoln", subjectKey: "mr", lid: "L0002" }, "2026d228_12_c") === false && removes.length === 0 && !!e.currData.done.lincoln.mr.L0002);
  ok("uncheck by the same card removes it", e.lidDoneRemove(t, t.id) === true && removes[0] === "curriculum/done/lincoln/mr/L0002" && !e.currData.done.lincoln.mr.L0002);
  ok("uncheck when no record exists → false, no write", e.lidDoneRemove(t, t.id) === false && removes.length === 1);
  ok("null task → false, no throw", e.lidDoneRemove(null, "x") === false && e.lidDoneWrite(null, "ts", "x") === false);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
