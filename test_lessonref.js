/*
 * 🔎 taskLessonRef: a subject whose own display name holds an em-dash must still resolve its lesson
 * (found 2026-09-22: "Grammar for the Well-Trained Mind — Purple Workbook" cards never got a lesson id,
 * never marked the Grid, and Lesson 1 was dealt + checked in two weeks running).
 *   run:  node test_lessonref.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(n) { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("no " + n); return src.slice(i, src.indexOf("\n}", i) + 2); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const ctx = { console, String, Object, RegExp, Array, Set,
  currData: { subjects: { lincoln: {
    gwtm: { display: "Grammar for the Well-Trained Mind — Purple Workbook", doneImportedAt: "x", lessonIds: ["L0001", "L0002"], lessonSeq: ["Lesson 1: Introduction to Nouns (p.1)", "Lesson 2: Adjectives (p.2)"] },
    aas: { display: "AAS Lesson", doneImportedAt: "x", lessonIds: ["L0011"], lessonSeq: ["L2-16"] },
  } }, done: {} } };
vm.createContext(ctx);
["taskLessonRef", "lidForTask", "lidStamped", "lidsFor", "lidDoneSet"].forEach(n => vm.runInContext(slice(n), ctx));
{ const i = src.indexOf("_lidNorm="); vm.runInContext(src.slice(src.lastIndexOf("\n", i) + 1, src.indexOf("\n", i)), ctx); }
const ref = t => vm.runInContext("taskLessonRef(" + JSON.stringify(t) + ")", ctx), lid = t => vm.runInContext("lidForTask(" + JSON.stringify(t) + ")", ctx);
console.log("── a subject name with its own em-dash ──");
const g1 = { who: "lincoln", subjectKey: "gwtm", title: "📖 Grammar for the Well-Trained Mind — Purple Workbook — Lesson 1: Introduction to Nouns (p.1)" };
ok("the ref is the lesson text, not 'Purple Workbook — …'", ref(g1) === "Lesson 1: Introduction to Nouns (p.1)", ref(g1));
ok("…so the card resolves to its lesson id", lid(g1) === "L0001", lid(g1));
const g2 = { who: "lincoln", subjectKey: "gwtm", title: "📖 Grammar for the Well-Trained Mind — Purple Workbook — Lesson 2: Adjectives (p.2)" };
ok("the second lesson resolves too", lid(g2) === "L0002", lid(g2));
console.log("\n── the plain case is unchanged ──");
const a1 = { who: "lincoln", subjectKey: "aas", title: "📄 AAS Lesson — L2-16" };
ok("a one-dash title still gives the lesson text", ref(a1) === "L2-16" && lid(a1) === "L0011", [ref(a1), lid(a1)]);
ok("a card with no subject context falls back to the old rule", ref({ title: "📄 Something — Part A — Part B" }) === "Part A — Part B");
ok("a title that does not carry the display name falls back to the old rule", ref({ who: "lincoln", subjectKey: "gwtm", title: "📖 GWTM — Lesson 3" }) === "Lesson 3");
ok("no dash at all → empty ref", ref({ who: "lincoln", subjectKey: "aas", title: "Just a title" }) === "");
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
