/*
 * Node tests for EGGQUIZ — a Reading Eggs quiz is its own lesson (her ask 2026-10-15:
 * "Reading Eggs, Ellis — when he has a quiz it needs to be its own lesson … just have his
 * quiz as that day's Reading Eggs").
 *
 * Fixture = Ellis's REAL Reading Eggspress list (curriculum/subjects/ellis/eggspress_e,
 * read 2026-10-15): 26 lines, all 26 finished (done L0001–L0026). Then a Map 22 run is
 * added the way Mom would type it, "+ Quiz" and all.
 *
 *   run:  node test_reading_eggs_quiz.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra !== undefined ? "  → " + JSON.stringify(extra) : "")); }
}
const J = JSON.stringify;

const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
const ea = src.indexOf("// EGGQUIZ_START"), eb = src.indexOf("// EGGQUIZ_END");
if (la < 0 || lb < 0 || ea < 0 || eb < 0) { console.error("LID / EGGQUIZ markers not found"); process.exit(1); }
ok("EGGQUIZ block lives inside the lesson-identity block", ea > la && eb < lb);

const ELLIS_SEQ = ["Map 17 L1","Map 17 L2","Map 17 L3","Map 17 L4","Map 17 L5 + Quiz","Map 18 L1","Map 18 L2","Map 18 L3","Map 18 L4","Map 19 L1","Map 19 L2","Map 19 L3","Map 19 L4","Map 18 L5 + Quiz","Map 19 L5 + Quiz","Map 20 L1","Map 20 L2","Map 20 L3","Map 20 L4","Map 20 L5 + Quiz","Map 21 L1","Map 21 L2","Map 21 L3","Map 21 L4","Map 21 L5 + Quiz","Map 22 L1"];
const ELLIS_IDS = ELLIS_SEQ.map((_, i) => "L" + String(i + 1).padStart(4, "0"));

function load(o) {
  o = o || {};
  const subj = Object.assign({ allowedDays: ["Mon","Wed","Fri"], device: "ipad", display: "Reading Eggspress",
    doneImportedAt: "2026-08-16T18:56:38.780Z", lessonIds: ELLIS_IDS.slice(), lessonSeq: ELLIS_SEQ.slice(),
    nextLid: 27, planId: "ellis__eggspress_e", total: 25 }, o.subj || {});
  const done = {}; (o.doneIds || ELLIS_IDS).forEach(id => { done[id] = { day: "2026-10-14", src: "check" }; });
  const subjects = { ellis: { [o.sk || "eggspress_e"]: subj } };
  if (o.other) subjects.ellis[o.other.sk] = o.other.subj;
  const ctx = {
    console, Date, Math, JSON, Object, Array, String, Set, parseInt, isNaN,
    currData: { subjects, done: { ellis: { [o.sk || "eggspress_e"]: done } }, lessons: {} },
    paceData: { subjects: { ellis: o.pace || {} } },
    PACE_DEFAULT_SUBJECTS: { ellis: { eggspress_e: { label: "Reading Eggspress", keyword: "Reading Eggspress" } }, lucy: { read_eggs: { label: "Reading Eggs", keyword: "Reading Eggs" } } },
  };
  vm.createContext(ctx);
  vm.runInContext(src.slice(la, lb), ctx);
  return ctx;
}

console.log("\nPure split (eqSplit / eqQuizLabel)");
{
  const c = load();
  ok("Map 22 L5 → Map 22 Quiz", c.eqQuizLabel("Map 22 L5") === "Map 22 Quiz");
  ok("no lesson token → label + Quiz", c.eqQuizLabel("Unit 4") === "Unit 4 Quiz");
  const r = c.eqSplit(["Map 22 L4", "Map 22 L5 + Quiz", "Map 23 L1"], null, null, 1);
  ok("text-only split: lesson, then its quiz, in place", J(r.seq) === J(["Map 22 L4","Map 22 L5","Map 22 Quiz","Map 23 L1"]), r.seq);
  ok("spacing / case variants split too", J(c.eqSplit(["Map 22 L5+quiz", "Map 23 L5  +  QUIZ"], null, null, 1).seq) === J(["Map 22 L5","Map 22 Quiz","Map 23 L5","Map 23 Quiz"]));
  const r2 = c.eqSplit(["Map 22 L5 + Quiz", "Map 22 Quiz"], null, null, 1);
  ok("already followed by its own quiz line → no duplicate quiz", J(r2.seq) === J(["Map 22 L5","Map 22 Quiz"]), r2.seq);
  ok("lines without + Quiz untouched", J(c.eqSplit(["Map 22 L1", "Quiz review", "Map 22 L2"], null, null, 1).seq) === J(["Map 22 L1","Quiz review","Map 22 L2"]));
  const r3 = c.eqSplit(["A L1", "A L5 + Quiz"], ["L0001", "L0002"], new Set(["L0002"]), 3);
  ok("a FINISHED + Quiz line is never touched", J(r3.seq) === J(["A L1","A L5 + Quiz"]) && J(r3.ids) === J(["L0001","L0002"]) && r3.n === 0, r3);
  const r4 = c.eqSplit(["A L1", "A L5 + Quiz"], ["L0001", "L0002"], new Set(["L0001"]), 3);
  ok("unfinished: lesson keeps its id, quiz gets a fresh one", J(r4.ids) === J(["L0001","L0002","L0003"]) && r4.nextLid === 4, r4);
}

console.log("\nEllis's real list — nothing finished is touched");
{
  const c = load();
  const patch = {};
  // Any save of his current list (e.g. the list editor's Save with nothing changed).
  c.setLessonSeq("ellis", "eggspress_e", ELLIS_SEQ.slice(), { patch });
  const s = c.currData.subjects.ellis.eggspress_e;
  ok("all 26 finished lines stay exactly as they are", J(s.lessonSeq) === J(ELLIS_SEQ), s.lessonSeq);
  ok("all 26 ids unchanged, nextLid unchanged", J(s.lessonIds) === J(ELLIS_IDS) && s.nextLid === 27);
  ok("same four save fields, nothing new", J(Object.keys(patch).sort()) === J(["subjects/ellis/eggspress_e/lessonIds","subjects/ellis/eggspress_e/lessonSeq","subjects/ellis/eggspress_e/nextLid","subjects/ellis/eggspress_e/total"]), Object.keys(patch));
}

console.log("\nMom adds the Map 22 run the way she'd type it");
{
  const c = load();
  const patch = {};
  const typed = ELLIS_SEQ.concat(["Map 22 L2","Map 22 L3","Map 22 L4","Map 22 L5 + Quiz","Map 23 L1"]);
  c.setLessonSeq("ellis", "eggspress_e", typed, { patch });
  const s = c.currData.subjects.ellis.eggspress_e;
  const want = ELLIS_SEQ.concat(["Map 22 L2","Map 22 L3","Map 22 L4","Map 22 L5","Map 22 Quiz","Map 23 L1"]);
  ok("Map 22 L5 and Map 22 Quiz are two lessons in a row", J(s.lessonSeq) === J(want), s.lessonSeq);
  ok("the 26 finished lines (and their old + Quiz text) untouched", J(s.lessonSeq.slice(0, 26)) === J(ELLIS_SEQ));
  ok("finished ids kept", J(s.lessonIds.slice(0, 26)) === J(ELLIS_IDS));
  ok("ids stay one per line, all distinct", s.lessonIds.length === s.lessonSeq.length && new Set(s.lessonIds).size === s.lessonIds.length, s.lessonIds);
  ok("quiz has its own id, after the lesson's", s.lessonIds[30] !== s.lessonIds[29] && /^L\d{4}$/.test(s.lessonIds[30]));
  ok("total and nextLid follow the split", s.total === 32 && patch["subjects/ellis/eggspress_e/total"] === 32 && s.nextLid === 27 + 6, { total: s.total, next: s.nextLid });
  ok("patch carries the split list", J(patch["subjects/ellis/eggspress_e/lessonSeq"]) === J(want));
  ok("only the four save fields written", Object.keys(patch).length === 4, Object.keys(patch));
  // Saving again is a no-op for the split (no second quiz, ids stable).
  const ids1 = s.lessonIds.slice();
  c.setLessonSeq("ellis", "eggspress_e", s.lessonSeq.slice(), { patch: {} });
  ok("re-saving changes nothing", J(s.lessonSeq) === J(want) && J(s.lessonIds) === J(ids1));
}

console.log("\nAn unfinished + Quiz line already in the list splits on the next save");
{
  // Same list, but Ellis hasn't done Map 21 L5 + Quiz (L0025) or Map 22 L1 (L0026) yet.
  const c = load({ doneIds: ELLIS_IDS.slice(0, 24) });
  c.setLessonSeq("ellis", "eggspress_e", ELLIS_SEQ.slice(), { patch: {} });
  const s = c.currData.subjects.ellis.eggspress_e;
  ok("finished Map 17–20 quiz lines untouched", s.lessonSeq[4] === "Map 17 L5 + Quiz" && s.lessonSeq[13] === "Map 18 L5 + Quiz" && s.lessonSeq[19] === "Map 20 L5 + Quiz");
  ok("Map 21 L5 + Quiz → Map 21 L5, Map 21 Quiz", J(s.lessonSeq.slice(24)) === J(["Map 21 L5","Map 21 Quiz","Map 22 L1"]), s.lessonSeq.slice(24));
  ok("Map 21 L5 keeps L0025, quiz gets L0027, Map 22 L1 keeps L0026", J(s.lessonIds.slice(24)) === J(["L0025","L0027","L0026"]), s.lessonIds.slice(24));
}

console.log("\nOnly Reading Eggs subjects; only plan-backed lists");
{
  const other = { display: "Math Mammoth", doneImportedAt: "x", planId: "ellis__mm", lessonSeq: ["Ch 1 L5 + Quiz"], lessonIds: ["L0001"], nextLid: 2 };
  const c = load({ other: { sk: "mm", subj: other } });
  c.currData.done.ellis.mm = {};
  c.setLessonSeq("ellis", "mm", ["Ch 1 L5 + Quiz", "Ch 2 L1"], { patch: {} });
  ok("a non-Reading-Eggs subject is never split", J(c.currData.subjects.ellis.mm.lessonSeq) === J(["Ch 1 L5 + Quiz","Ch 2 L1"]));

  const c2 = load({ subj: { planId: undefined } });
  c2.setLessonSeq("ellis", "eggspress_e", ELLIS_SEQ.concat(["Map 22 L5 + Quiz"]), { patch: {} });
  ok("not plan-backed (list mirrors grid cells) → left exactly as given", c2.currData.subjects.ellis.eggspress_e.lessonSeq.slice(-1)[0] === "Map 22 L5 + Quiz");

  const c3 = load();
  const p3 = {};
  c3.setLessonSeq("ellis", "eggspress_e", ELLIS_SEQ.concat(["Map 22 L5 + Quiz"]), { patch: p3, restoreIds: ELLIS_IDS.concat(["L0099"]), restoreNext: 100 });
  ok("undo / restore puts back exactly what it was given", c3.currData.subjects.ellis.eggspress_e.lessonSeq.slice(-1)[0] === "Map 22 L5 + Quiz");

  ok("matches Reading Eggs (Lucy) by default label", load().eqIsEggs("lucy", "read_eggs", {}));
  ok("matches Reading Eggspress by display name", load().eqIsEggs("ellis", "x", { display: "Reading Eggspress" }));
  ok("matches on the pace keyword", load({ pace: { re2: { keyword: "Reading Eggs —" } } }).eqIsEggs("ellis", "re2", { display: "RE" }));
  ok("doesn't match other subjects", !load().eqIsEggs("ellis", "nzk_e", { display: "Night Zookeeper" }));
}

console.log("\nPaths that bypass setLessonSeq are covered");
{
  const addSave = src.slice(src.indexOf("function ceAddSave("), src.indexOf("function ceAddSave(") + 6000);
  ok("new subject (ceAddSave) splits a Reading Eggs list before its ids are minted",
    /eqIsEggs\(ceAddKid,null,\{display:name\}\)\) lessonSeq=eqSplit\(lessonSeq,null,null,1\)\.seq;\s*\n\s*subj=\{display:name/.test(addSave));
  const ci = src.indexOf("// EGGQUIZ: the new kid has finished none of it");
  const near = src.slice(ci, ci + 600);
  ok("copy-to-kid splits before fresh ids are minted",
    ci > 0 && /eqIsEggs\(kid,sk,src\)\) copy\.lessonSeq=eqSplit\(copy\.lessonSeq,null,null,1\)\.seq;\s*\n\s*if\(copy\.lessonSeq\)\{ const _r=_lidAlign/.test(near));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
