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
    // comments: apostrophes inside them are not string delimiters
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) break; continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const writers = ["ceSaveLessonSeq", "gvSyncSeqInto", "gvSelUndoApply", "cbDoneCellSet", "cbDeriveContent", "cbRemainingContent", "cbBacklogInfo", "cbSplitCells", "cbBuildGate"].map(extractFn).join("\n");

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

console.log("lidImportPlan / gvImportDone — import completions (Stage 1.4)");
{
  const e = mk({ lincoln: { mr: S(["a", "b", "b", "c", "d"], ["L0001", "L0002", "L0003", "L0004", "L0005"], 6), noid: S(["x"]) } });
  e.currData.subjects.lincoln.mr.display = "MR"; e.currData.subjects.lincoln.mr.manualDone = { d: { lesson: "d", day: "2026-08-10", ts: "t-manual" } };
  e.paceData = { subjects: { lincoln: { mr: { offset: 0, adjust: 0 } } } };
  e.paceKeywords = () => ["MR"]; e.chainDone = (id, ck) => !!ck[id]; e._archTrueRec = (t) => ({ who: t.who, title: t.title }); e._archCheckedId = (t, ck) => ck[t.id] ? t.id : null;
  e._mdText = (k, v) => (v && typeof v === "object" && v.lesson) ? String(v.lesson) : String(k); e.currFirstWeekNum = () => 1; e.gwWeekDateRange = wn => ({ start: "2026-08-10", end: "2026-08-16" }); e.cap = x => x;
  e.WK = "week17"; e.checked = { c1: "9:00 AM Aug 12", c2: "9:30 AM Aug 12", c9: "x" }; e.histState = { c1: { checkedOnDay: "wednesday" } };
  e.weekData = { tasks: [{ id: "c1", who: "lincoln", subjectKey: "mr", title: "📄 MR — b", day: "wednesday" }, { id: "c2", who: "lincoln", subjectKey: "mr", title: "📄 MR — b", day: "wednesday" }, { id: "c9", who: "lincoln", subjectKey: "other", title: "📄 Other — b", day: "monday" }, { id: "c3", who: "lincoln", subjectKey: "mr", title: "📄 MR — c", day: "friday" }] };
  e.archive = { week16: { weekLabel: "week16", checked: { a1: "10:00 AM Aug 3", a2: "x" }, history: { a1: { checkedOnDay: "monday" } }, tasks: [{ id: "a1", who: "lincoln", subjectKey: "mr", title: "📄 MR — a", day: "monday" }, { id: "a2", who: "lincoln", subjectKey: "mr", title: "📄 MR — zz", day: "tuesday" }] } };
  const p = e.lidImportPlan("lincoln", "mr");
  ok("evidence: manual d, live b b, archive a zz (keyword rule excludes 'Other — b')", p.nEvidence === 5);
  ok("tally in list order: a→L0001, b→L0002, b→L0003, d→L0005; c unchecked; zz unmatched", eq(Object.keys(p.writes).sort(), ["L0001", "L0002", "L0003", "L0005"]) && eq(p.unmatched, ["zz"]) && p.matched === 4);
  ok("record shapes: check via import w/ ISO day + taskId + week; manual keeps its day", p.writes.L0001.src === "check" && p.writes.L0001.via === "import" && p.writes.L0001.day === "2026-08-10" && p.writes.L0001.taskId === "a1" && p.writes.L0001.week === "week16" && p.writes.L0002.day === "2026-08-12" && p.writes.L0005.src === "manual" && p.writes.L0005.day === "2026-08-10");
  ok("counts: doneAfter 4 of 5", p.doneAfter === 4 && p.nList === 5);
  // offset → import marks; existing live done never overwritten
  e.paceData.subjects.lincoln.mr.offset = 1; e.currData.done = { lincoln: { mr: { L0002: { ts: "live", src: "check" } } } };
  const p2 = e.lidImportPlan("lincoln", "mr");
  ok("offset 1 → L0001 marked src:import/offset; live L0002 untouched (not in writes)", p2.writes.L0001.src === "import" && p2.writes.L0001.via === "offset" && !("L0002" in p2.writes) && p2.alreadyDone === 1);
  ok("subject without ids → null", e.lidImportPlan("lincoln", "noid") === null);
  // the writer + stamp + undo
  e.paceData.subjects.lincoln.mr.offset = 0; e.currData.done = {};
  ok("pending lists id'd, unstamped subjects", eq(e.lidImportPending(), [{ kid: "lincoln", sk: "mr" }]));
  e.gvImportDone(); const w = e.written;
  ok("one curriculum.update: done/<kid>/<sk>/<lid> ×4 + doneImportedAt + lastEdit", w && Object.keys(w).filter(k => k.startsWith("done/lincoln/mr/")).length === 4 && !!w["subjects/lincoln/mr/doneImportedAt"] && !!w["lastEdit"]);
  ok("stamped → nothing pending; local mirror populated", e.lidImportPending().length === 0 && Object.keys(e.currData.done.lincoln.mr).length === 4);
  e.written = null; e.gvImportDoneUndo();
  ok("undo nulls the same paths + stamp; pending again; mirror emptied", e.written && e.written["done/lincoln/mr/L0001"] === null && e.written["subjects/lincoln/mr/doneImportedAt"] === null && e.lidImportPending().length === 1 && Object.keys(e.currData.done.lincoln.mr).length === 0);
  const e2 = mk({ lincoln: { mr: S(["a"], ["L0001"], 2) } }); e2.paceKeywords = () => ["MR"]; e2.paceData = { subjects: {} }; e2.chainDone = () => false; e2.weekData = { tasks: [] }; e2.archive = {}; e2.checked = {}; e2.cap = x => x; e2.confirmAnswer = false; e2.gvImportDone();
  ok("cancel writes nothing", e2.written === null);
}

console.log("readers flip on the stamp (Stage 1.5)");
{
  const e = mk({ lincoln: { mr: S(["a", "b", "b", "c", "d"], ["L0001", "L0002", "L0003", "L0004", "L0005"], 6), un: S(["x", "y"], ["L0001", "L0002"], 3) } });
  e.paceData = { subjects: {} }; e.paceKeywords = () => ["MR"]; e.paceDoneTitles = () => ["📄 mr — a", "📄 mr — c"]; e.cbTodayISO = () => "2026-08-16";
  e.currData.done = { lincoln: { mr: { L0001: { src: "check" }, L0003: { src: "check" } } } };
  ok("unstamped → lidStamped false, sets null", !e.lidStamped("lincoln", "mr") && e.lidDoneSet("lincoln", "mr") === null && e.lidDoneIdx("lincoln", "mr") === null);
  // cbDoneCellSet unstamped = title path (a, c done)
  const cells = [{ text: "a" }, { text: "b" }, { text: "b" }, { text: "c" }, { text: "zz" }];
  ok("cbDoneCellSet unstamped: title match → {0,3}", eq([...e.cbDoneCellSet("lincoln", "mr", cells)].sort(), [0, 3]));
  e.currData.subjects.lincoln.mr.doneImportedAt = "2026-08-16T00:00:00Z";
  ok("stamped → done set/idx from records", e.lidStamped("lincoln", "mr") && eq([...e.lidDoneSet("lincoln", "mr")].sort(), ["L0001", "L0003"]) && eq([...e.lidDoneIdx("lincoln", "mr")].sort(), [0, 2]));
  ok("cbDoneCellSet stamped: by id → a(L0001) + SECOND b(L0003) done, first b not; zz (no id) falls back to title", eq([...e.cbDoneCellSet("lincoln", "mr", cells)].sort(), [0, 2]));
  ok("cbDoneCellSet stamped with no records → empty Set (authoritative, not null)", (() => { e.currData.done.lincoln.mr = {}; const r = e.cbDoneCellSet("lincoln", "mr", cells); e.currData.done.lincoln.mr = { L0001: { src: "check" }, L0003: { src: "check" } }; return r && typeof r.size === "number" && r.size === 0; })());
  // cbDeriveContent doneIdx wins over tally/count
  const split = { stale: [], todayCells: [], future: [] };
  ok("cbDeriveContent doneIdx → exact remaining [b(1st),c,d]", eq(e.cbDeriveContent(split, ["a", "b", "b", "c", "d"], 4, [], null, new Map([["a", 1]]), null, new Set([0, 2])), ["b", "c", "d"]));
  ok("cbDeriveContent without doneIdx unchanged (tally path)", eq(e.cbDeriveContent(split, ["a", "b", "b", "c", "d"], 1, [], null, new Map([["a", 1]]), null), ["b", "b", "c", "d"]));
  // hand-mark by text → first unfinished occurrence
  const patch = {}, prev = {};
  const w = e.lidMarkDone("lincoln", "mr", ["b", "d"], null, patch, prev);
  ok("lidMarkDone marks first unfinished b (L0002) and d (L0005), src manual, prev nulls for undo", eq(w, ["L0002", "L0005"]) && patch["done/lincoln/mr/L0002"].src === "manual" && patch["done/lincoln/mr/L0005"].day === "2026-08-16" && prev["done/lincoln/mr/L0002"] === null);
  ok("mirror updated", !!e.currData.done.lincoln.mr.L0002 && !!e.currData.done.lincoln.mr.L0005);
  const p2 = {}; const u = e.lidUnmarkText("lincoln", "mr", "b", p2);
  ok("lidUnmarkText removes only MANUAL b (L0002), never the check-off L0003", eq(u, ["L0002"]) && p2["done/lincoln/mr/L0002"] === null && !("done/lincoln/mr/L0003" in p2) && !e.currData.done.lincoln.mr.L0002 && !!e.currData.done.lincoln.mr.L0003);
  ok("unstamped subject: mark/unmark are no-ops", eq(e.lidMarkDone("lincoln", "un", ["x"], null, {}, {}), []) && eq(e.lidUnmarkText("lincoln", "un", "x", {}), []));
}

console.log("plan-backed subjects (Stage 2)");
{
  const e = mk({ lincoln: { mr: S(["a", "b", "c", "d"], ["L0001", "L0002", "L0003", "L0004"], 5) } });
  e.currData.subjects.lincoln.mr.display = "MR"; e.currData.subjects.lincoln.mr.doneImportedAt = "x"; e.currData.subjects.lincoln.mr.pacing = { mode: "timesPerWeek", tpw: 3 };
  e.currData.done = { lincoln: { mr: { L0001: { src: "check" } } } };
  e.currData.skiplog = { lincoln: { mr: [{ lesson: "c" }] } };
  e.currData.lessons = { lincoln: { 1: { date: "2026-08-10", mr: "b" }, 2: { date: "2026-08-18", mr: "c" }, 3: { date: "2026-08-19", mr: "d" } } };
  e.paceData = { subjects: { lincoln: { mr: { adjust: 1 } } } }; e.paceKeywords = () => ["MR"]; e.paceAutoCount = () => 1; e.paceDoneTitles = () => ["📄 mr — a"];
  e.cbTodayISO = () => "2026-08-16"; e.cbBacklogStash = {}; e.cbDecisions = { "lincoln|mr": { dismissed: [0] } }; e.cap = x => x;
  ok("planBacked false without planId; planPending lists the stamped subject", !e.planBacked("lincoln", "mr") && eq(e.planPending(), [{ kid: "lincoln", sk: "mr", disp: "MR" }]));
  // legacy: adjust pre-dismisses stale b (index 0), skiplog drops c
  const legacy = e.cbRemainingContent("lincoln", "mr");
  ok("legacy path: pre-dismiss (adjust) drops stale b, skiplog drops c → [d]", eq(legacy, ["d"]));
  e.currData.subjects.lincoln.mr.planId = "lincoln__mr";
  ok("planBacked true with planId + stamp", e.planBacked("lincoln", "mr") && e.planPending().length === 0);
  const pb = e.cbRemainingContent("lincoln", "mr");
  ok("plan-backed: list minus done only — b, c, d all served (no adjust, no skiplog, no dismissals)", eq(pb, ["b", "c", "d"]));
  // cbBuildGate skips the sheet for plan-backed
  let applied = 0; e.cbApply = () => { applied++; }; e.cbGate = null; e.cbKid = "lincoln"; e.cbSubjKey = "mr"; e.cbPreviewRes = { assignments: [] };
  e.cbBuildGate();
  ok("cbBuildGate: plan-backed with stale leftovers → applies directly, no sheet", applied === 1 && e.cbGate === null);
  delete e.currData.subjects.lincoln.mr.planId; e._cbGateItem = () => ({}); e.renderAll = () => {};
  e.cbBuildGate();
  ok("cbBuildGate: legacy with stale leftovers → sheet", applied === 1 && !!e.cbGate);
  // gvMakePlan / undo
  e._gvRelaySubject = () => true; e.confirmAnswer = true; e.written = null; e.momModeActive = true;
  e.gvMakePlan("lincoln", "mr");
  ok("gvMakePlan writes planId + planAnchor + lastEdit and relays", e.written && e.written["subjects/lincoln/mr/planId"] === "lincoln__mr" && e.written["subjects/lincoln/mr/planAnchor"] === "2026-08-16" && !!e.written["lastEdit"] && e.currData.subjects.lincoln.mr.planId === "lincoln__mr");
  ok("preview probe leaves no flag on cancel", (() => { const e2 = mk({ lincoln: { mr: S(["a"], ["L0001"], 2) } }); e2.currData.subjects.lincoln.mr.doneImportedAt = "x"; e2.currData.done = {}; e2.paceData = { subjects: {} }; e2.paceKeywords = () => ["MR"]; e2.paceAutoCount = () => 0; e2.paceDoneTitles = () => []; e2.cbTodayISO = () => "2026-08-16"; e2.cbBacklogStash = {}; e2.cbDecisions = {}; e2.cap = x => x; e2.confirmAnswer = false; e2.gvMakePlan("lincoln", "mr"); return !e2.currData.subjects.lincoln.mr.planId && e2.written === null; })());
  e.written = null; e.gvMakePlanUndo();
  ok("undo nulls planId + planAnchor", e.written && e.written["subjects/lincoln/mr/planId"] === null && e.written["subjects/lincoln/mr/planAnchor"] === null && !e.currData.subjects.lincoln.mr.planId);
}

console.log("sequential-order guard + un-finish tools");
{
  const e = mk({ lincoln: { mr: S(["a", "b", "c", "d"], ["L0001", "L0002", "L0003", "L0004"], 5) } });
  e.currData.subjects.lincoln.mr.doneImportedAt = "x"; e.currData.done = { lincoln: { mr: { L0001: { src: "check" }, L0003: { src: "check" }, L0004: { src: "manual" } } } };
  const T = lid => ({ id: "t" + lid, who: "lincoln", subjectKey: "mr", lid, title: "📄 MR — x" });
  ok("guard: card for c (L0003) blocked by open b", e.lidOrderBlock(T("L0003")) === "b");
  ok("guard: card for b (next open) allowed", e.lidOrderBlock(T("L0002")) === null);
  ok("guard: no lid / other subject → null", e.lidOrderBlock({ id: "z", who: "lincoln", subjectKey: "mr" }) === null);
  e.currData.subjects.lincoln.mr.allowOutOfOrder = true;
  ok("setting allowOutOfOrder → guard off", e.lidOrderBlock(T("L0003")) === null);
  delete e.currData.subjects.lincoln.mr.allowOutOfOrder;
  ok("lidOutOfOrder: c and d (done after open b), in list order", eq(e.lidOutOfOrder("lincoln", "mr").map(x => x.text), ["c", "d"]));
  const patch = {}, prev = {};
  ok("lidUnfinish removes the record (any src) and snapshots it", e.lidUnfinish("lincoln", "mr", "L0004", patch, prev) === true && patch["done/lincoln/mr/L0004"] === null && prev["done/lincoln/mr/L0004"].src === "manual" && !e.currData.done.lincoln.mr.L0004);
  ok("lidUnfinish on a non-record → false", e.lidUnfinish("lincoln", "mr", "L0004", {}, {}) === false);
  ok("after un-finishing d, only c is out of order", eq(e.lidOutOfOrder("lincoln", "mr").map(x => x.text), ["c"]));
}

console.log("un-stamped cards resolve by text (this week's cards predate ids)");
{
  const e = mk({ lincoln: { sys: S(["6c", "6d", "6e", "7a"], ["L0001", "L0002", "L0003", "L0004"], 5) } });
  e.currData.subjects.lincoln.sys.doneImportedAt = "x"; e.currData.done = { lincoln: { sys: { L0001: { src: "check" } } } };
  e.taskLessonRef = t => { const m = (t && t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; };
  const T = txt => ({ id: "c_" + txt, who: "lincoln", subjectKey: "sys", title: "📄 Spelling You See — " + txt });
  ok("lidForTask resolves 6e by text → L0003", e.lidForTask(T("6e")) === "L0003");
  ok("guard blocks 6e while 6d open (no lid on the card)", e.lidOrderBlock(T("6e")) === "6d" && e.lidOrderBlock(T("6d")) === null);
  const sets = []; e.db = { ref: p => ({ set: v => { sets.push([p, v]); }, remove: () => { sets.push([p, "rm"]); }, update: () => ({ catch: () => {} }) }) }; e.cbTodayISO = () => "2026-08-16";
  ok("lidDoneWrite on an un-stamped card writes done/<resolved lid>", e.lidDoneWrite(T("6d"), "ts", "c_6d") === true && sets[0][0] === "curriculum/done/lincoln/sys/L0002" && sets[0][1].taskId === "c_6d");
  ok("lidDoneRemove finds the record by taskId when the card has no lid", e.lidDoneRemove(T("6d"), "c_6d") === true && sets[1][0] === "curriculum/done/lincoln/sys/L0002" && !e.currData.done.lincoln.sys.L0002);
  ok("text not on the list → null (no guess)", e.lidForTask(T("9z")) === null && e.lidOrderBlock(T("9z")) === null);
}

console.log("↕ Sort in book order (natural sort)");
{
  const e = mk({});
  ok("6d before 6e; 6e before 7a", eq(e.lidNaturalSort(["6a", "6b", "6c", "6e", "6d", "7a", "7b"]), ["6a", "6b", "6c", "6d", "6e", "7a", "7b"]));
  ok("pages: pg47-48 < pg49-50 < pg51 < pg52 < pg53-54 (numeric, not text)", eq(e.lidNaturalSort(["pg51", "pg49-50", "pg53-54", "pg47-48", "pg52", "pg114-120", "pg98-99"]), ["pg47-48", "pg49-50", "pg51", "pg52", "pg53-54", "pg98-99", "pg114-120"]));
  ok("chapters: 5B Ch.3 L2 < 5B Ch.3 Review? no — text < number at same run; Ch.3 < Ch.10", (() => { const r = e.lidNaturalSort(["5B Ch.10 L1", "5B Ch.3 L2", "5B Ch.3 L1"]); return eq(r, ["5B Ch.3 L1", "5B Ch.3 L2", "5B Ch.10 L1"]); })());
  ok("dash-insensitive and stable for equal keys", eq(e.lidNaturalSort(["MR5 pp.228–231", "MR5 pp.224-227", "MR5 pp.228-231"]), ["MR5 pp.224-227", "MR5 pp.228–231", "MR5 pp.228-231"]));
  ok("already sorted → unchanged", eq(e.lidNaturalSort(["L1", "L2", "L10"]), ["L1", "L2", "L10"]));
  ok("shape groups: Assessment stays after L160; L-lessons sort among themselves", eq(e.lidNaturalSort(["Map32 L157", "Map32 L156", "Map32 L158", "Map32 Assess.", "Map33 L161"]), ["Map32 L156", "Map32 L157", "Map32 L158", "Map32 Assess.", "Map33 L161"]));
  ok("Review after Lesson 45 stays put while lessons reorder", eq(e.lidNaturalSort(["B Lesson 45", "B Review 1", "B Lesson 47", "B Lesson 46"]), ["B Lesson 45", "B Review 1", "B Lesson 46", "B Lesson 47"]));
  ok("mixed vocab: pg-lines and Ex.-lines never interleave", eq(e.lidNaturalSort(["pg22-25", "pg14-17", "Ex. 31–32", "Ex. 29–30"]), ["pg14-17", "pg22-25", "Ex. 29–30", "Ex. 31–32"]));
  ok("chapters + Review: 5B Ch.2 Review stays between Ch.2 and Ch.3", eq(e.lidNaturalSort(["5B Ch.2 L2", "5B Ch.2 L1", "5B Ch.2 Review", "5B Ch.3 L1"]), ["5B Ch.2 L1", "5B Ch.2 L2", "5B Ch.2 Review", "5B Ch.3 L1"]));
}

console.log("walk-back removes done records (lidDoneRemoveByCard)");
{
  const e = mk({ lincoln: { aas: S(["L2-15", "L2-16", "L2-17"], ["L0001", "L0002", "L0003"], 4) } });
  e.currData.subjects.lincoln.aas.doneImportedAt = "x"; e.currData.done = { lincoln: { aas: { L0001: { src: "check", taskId: "c15" }, L0003: { src: "check", taskId: "c17" } } } };
  e.taskLessonRef = t => { const m = (t && t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; };
  let patch = {};
  ok("by taskId → removes L0003", e.lidDoneRemoveByCard("lincoln", "aas", ["c17"], "📄 AAS — L2-17", patch) === "L0003" && patch["done/lincoln/aas/L0003"] === null && !e.currData.done.lincoln.aas.L0003);
  patch = {};
  ok("no taskId match → resolves by text to a DONE occurrence (L2-15 → L0001)", e.lidDoneRemoveByCard("lincoln", "aas", ["zz"], "📄 AAS — L2-15", patch) === "L0001" && patch["done/lincoln/aas/L0001"] === null);
  ok("nothing done for that text → null, no write", e.lidDoneRemoveByCard("lincoln", "aas", ["q"], "📄 AAS — L2-16", {}) === null);
}

console.log("✂ Trim descriptions");
{
  const e = mk({});
  ok("Ch3-1: Addition as Putting Together → Ch3-1", e.lidTrimDescription("Ch3-1: Addition as Putting Together") === "Ch3-1");
  ok("with page suffix: Ch3-1: … · pp. 34–36 → Ch3-1", e.lidTrimDescription("Ch3-1: Addition as Putting Together · pp. 34–36") === "Ch3-1");
  ok("Ch6-1: Add by Making 10 - Part 1 → Ch6-1", e.lidTrimDescription("Ch6-1: Add by Making 10 - Part 1") === "Ch6-1");
  ok("Lesson 5 – Counting On → Lesson 5", e.lidTrimDescription("Lesson 5 – Counting On") === "Lesson 5");
  ok("no description shapes untouched", e.lidTrimDescription("Review 2") === "Review 2" && e.lidTrimDescription("Story Problems") === "Story Problems" && e.lidTrimDescription("6d") === "6d" && e.lidTrimDescription("pg47-48") === "pg47-48" && e.lidTrimDescription("MR5 pp.204–207") === "MR5 pp.204–207");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
