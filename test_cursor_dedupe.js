/*
 * Slices the REAL paceAutoCount + paceIsLessonSeq out of index.html and replays Lincoln's
 * ACTUAL MR5 history (from the live archive) to prove the cursor lands on his real position
 * instead of running ahead. Also proves daily subjects are untouched.
 *   run: node test_cursor_dedupe.js
 */
const fs = require("fs");
const S = "/private/tmp/claude-501/-Users-adriennehowe/ce8e1d3a-c7a7-40c9-98a5-4cea32fb95a2/scratchpad/";
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");

function fn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

// ── live data ──
const archiveRaw = JSON.parse(fs.readFileSync(S + "arch.json", "utf8"));
const subjects   = JSON.parse(fs.readFileSync(S + "subj.json", "utf8"));

globalThis.archive  = archiveRaw;
globalThis.currData = { subjects };
globalThis.WK = "week16";
globalThis.weekData = { tasks: [] };     // current week supplied per-case
globalThis.checked  = {};
globalThis.currFirstWeekNum = () => 0;   // don't drop old weeks in this harness
globalThis.currData = { subjects, lessons: { lincoln: JSON.parse(fs.readFileSync(S + "lessons_lin.json", "utf8")) } };
globalThis.scheduleOverrides = JSON.parse(fs.readFileSync(S + "ovr.json", "utf8"));
globalThis.chainDone = (id, ch) => !!ch[id];

eval(fn("schedOv"));
eval(fn("buildSubjectLessons"));
eval(fn("paceIsLessonSeq"));
eval(fn("paceAutoCount"));

const MR_KWS = ["MR5/MR6 Pages", "MR5 Math", "MR6 Math"];

console.log("Lincoln MR5 — cursor from his real completed history\n");

ok("mr_pages is recognised as lesson-sequenced", paceIsLessonSeq("lincoln", "mr_pages") === true);
ok("morning_nb is NOT (daily, repeats one title)", paceIsLessonSeq("lincoln", "morning_nb") === false);
ok("math_sprints is NOT (sequential but total 0)", paceIsLessonSeq("lincoln", "math_sprints") === false);

const deduped = paceAutoCount("lincoln", MR_KWS, null, "mr_pages");
const legacy  = paceAutoCount("lincoln", MR_KWS, null, null);   // no subjectKey = old behaviour

console.log("\n  archive-only count, de-duped : " + deduped);
console.log("  archive-only count, old way  : " + legacy);
ok("de-dupe removes the phantom lessons", deduped < legacy, { deduped, legacy });
ok("counts 27 distinct lessons, not 30 instances", deduped === 27, deduped);
ok("old way counted 30 task instances", legacy === 30, legacy);
ok("inflation is exactly the 3 duplicate completions", legacy - deduped === 3, legacy - deduped);

// ── with this week's duplicate pp.196-199 included ──
globalThis.weekData = { tasks: [
  { id: "w16a", who: "lincoln", title: "\u{1F4C4} MR5 Math Reasoning — MR5 pp.196–199" },
  { id: "w16b", who: "lincoln", title: "\u{1F4C4} MR5 Math Reasoning — MR5 pp.200–203" },
] };
globalThis.checked = { w16a: true };   // Monday's duplicate was checked off

const withWeek    = paceAutoCount("lincoln", MR_KWS, null, "mr_pages");
const withWeekOld = paceAutoCount("lincoln", MR_KWS, null, null);
console.log("\n  incl. this week, de-duped : " + withWeek);
console.log("  incl. this week, old way  : " + withWeekOld);
ok("this week's REPEAT of pp.196-199 adds nothing", withWeek === deduped, { withWeek, deduped });
ok("old way would have counted it again", withWeekOld === legacy + 1, { withWeekOld, legacy });

// The cursor indexes buildSubjectLessons(), NOT page numbers — the completed set has gaps
// (pp.84-95 and 112-115 never appear), so page arithmetic off the cursor is meaningless.
// Assert on sequence positions, which is what the cursor actually is.
console.log("\n  cursor = offset(0) + auto + adjust(0)");
console.log("  before this fix : " + withWeekOld + "  (sequence positions ahead of reality)");
console.log("  after  this fix : " + withWeek + "  (= lessons actually finished)");
ok("cursor = distinct lessons finished", withWeek === 27, withWeek);
ok("was 4 ahead before (3 archived dupes + this week)", withWeekOld - withWeek === 4, withWeekOld - withWeek);

console.log("\nDaily subjects must be untouched");
const NB_KWS = ["Morning Notebook"];
const nbDedupe = paceAutoCount("lincoln", NB_KWS, null, "morning_nb");
const nbLegacy = paceAutoCount("lincoln", NB_KWS, null, null);
console.log("  morning_nb: with key=" + nbDedupe + "  without=" + nbLegacy);
ok("Morning Notebook still counts every day", nbDedupe === nbLegacy, { nbDedupe, nbLegacy });
ok("...and it's more than 1", nbDedupe > 1, nbDedupe);

console.log("\nUnknown subject falls back to the old behaviour (no silent change)");
ok("no subjectKey = instance counting (unchanged)", paceAutoCount("lincoln", MR_KWS, null, undefined) === withWeekOld);

console.log("\nREGRESSION GUARD: grid text and task titles do NOT always match");
// Lucy's NZK grid says "Q41-42" where her task says "Quest 41". Counting by matching the
// lesson GRID zeroed her out and restarted the subject - that approach was reverted.
const LUCY_KWS = ["NZK"];
const lucyN = paceAutoCount("lucy", LUCY_KWS, null, "nzk_l");
console.log("  lucy nzk_l count: " + lucyN);
ok("Lucy's NZK does not collapse to zero", lucyN > 0, lucyN);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
