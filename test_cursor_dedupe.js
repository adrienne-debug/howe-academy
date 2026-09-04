/*
 * Slices the REAL paceAutoCount + paceIsLessonSeq out of index.html and replays a Lincoln
 * MR5 history that reproduces the 2026-08-03 cursor bug — the same lesson checked off on
 * several cards across weeks — to prove the cursor lands on his real position instead of
 * running ahead. Also proves daily subjects are untouched.
 *
 * The July-2026 live snapshots this used to read are gone; the archive below is SYNTHETIC
 * and built to the same shape (see mkArchive). The scenario:
 *   - 8 distinct MR5 lessons genuinely finished (pp.180–183 … pp.208–211)
 *   - 6 duplicate completions of those: pp.196–199 checked on 5 cards (wk13 + 4 wk14 cards
 *     from the id collision), pp.184–187 and pp.200–203 each re-issued and re-checked once
 *   - 1 STOLEN check: a wk12 card titled pp.176–179 was checked, but its history record is
 *     Lucy's LOE 43 — so Lincoln never did those pages (counted for neither kid here)
 *   - 1 unchecked MR5 card, 1 Ellis MR card (kid filter), tasks with and without history
 *   - Morning Notebook: one title, checked 5 days in wk15
 *   - Lucy NZK: task titles say "Quest 41", her grid says "Q41-42"
 * So: distinct = 8, instances = 14, inflation = 6.
 *   run: node test_cursor_dedupe.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

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

// ── synthetic world ──
const PG = "\u{1F4C4}";                                   // 📄
const MR = t => PG + " MR5 Math Reasoning — " + t;        // title = emoji display — cell text
const NB = PG + " Morning Notebook — Morning Notebook";
const NZ = t => "\u{1F981} NZK — " + t;                   // 🦁

// One archived week. Each task: [id, who, title, checked?, historyOverride?]
//   checked=true writes checked[id] and a matching history record (who+title of the card)
//   historyOverride={who,title} writes a DIFFERENT history record — the stolen-check case
function mkArchive(weeks) {
  const out = {};
  weeks.forEach(([label, rows]) => {
    const aw = { weekLabel: label, tasks: [], checked: {}, history: {} };
    rows.forEach(([id, who, title, done, hist]) => {
      aw.tasks.push({ id, who, title, day: "monday", time: "9:00 AM" });
      if (done) {
        aw.checked[id] = "2026-07-01T09:00:00";
        if (hist !== null) aw.history[id] = Object.assign({ who, title, ts: "2026-07-01T09:00:00" }, hist || {});
      }
    });
    out[label] = aw;
  });
  return out;
}

const archiveRaw = mkArchive([
  ["week12", [
    ["w12a", "lincoln", MR("MR5 pp.176–179"), true, { who: "lucy", title: "\u{1F4D6} LOE Essentials — LOE 43" }], // STOLEN
    ["w12b", "lincoln", MR("MR5 pp.180–183"), true],
    ["w12c", "lincoln", MR("MR5 pp.184–187"), true],
    ["w12d", "lincoln", MR("MR5 pp.184–187"), true],        // dup #1 (re-issued, re-checked)
    ["w12e", "lincoln", MR("MR5 pp.188–191"), true, null],  // checked, NO history record → card's own who/title
    ["w12f", "lincoln", MR("MR5 pp.192–195"), true],
  ]],
  ["week13", [
    ["w13a", "lincoln", MR("MR5 pp.196–199"), true],
    ["w13b", "lincoln", MR("MR5 pp.200–203"), true],
    ["w13c", "lincoln", MR("MR5 pp.200–203"), true],        // dup #2
    ["w13d", "lincoln", MR("MR5 pp.204–207"), false],       // never checked
    ["w13e", "ellis",   PG + " MR3 Math Reasoning — MR3 pp.40–43", true],  // other kid
  ]],
  ["week14", [
    ["w14a", "lincoln", MR("MR5 pp.196–199"), true],        // dup #3 — id collision smeared
    ["w14b", "lincoln", MR("MR5 pp.196–199"), true],        // dup #4    one completion
    ["w14c", "lincoln", MR("MR5 pp.196–199"), true],        // dup #5    across 4 cards
    ["w14d", "lincoln", MR("MR5 pp.196–199"), true],        // dup #6
    ["w14e", "lincoln", MR("MR5 pp.204–207"), true],
    ["w14f", "lincoln", MR("MR5 pp.208–211"), true],
  ]],
  ["week15", [
    ["w15a", "lincoln", NB, true], ["w15b", "lincoln", NB, true], ["w15c", "lincoln", NB, true],
    ["w15d", "lincoln", NB, true], ["w15e", "lincoln", NB, true],
    ["w15f", "lucy", NZ("Quest 41"), true], ["w15g", "lucy", NZ("Quest 42"), true],
  ]],
]);

const subjects = {
  lincoln: {
    mr_pages:     { display: "MR5 Math Reasoning", rules: "sequential", total: 142, pacing: { tpw: 4 } },
    morning_nb:   { display: "Morning Notebook",   rules: "daily",      total: 0,   pacing: { tpw: 5 } },
    math_sprints: { display: "Math Sprint",        rules: "sequential", total: 0,   pacing: { tpw: 2 } },
  },
  lucy: {
    nzk_l: { display: "NZK", rules: "sequential", total: 60, pacing: { tpw: 2 } },
  },
};
// a small grid so buildSubjectLessons has something to index (the cursor is a position in it)
const lessonsLin = {
  "180": { date: "2026-06-29", week: 12, mr_pages: "MR5 pp.176–179" },
  "181": { date: "2026-06-30", week: 12, mr_pages: "MR5 pp.180–183" },
  "182": { date: "2026-07-01", week: 12, mr_pages: "MR5 pp.184–187" },
  "183": { date: "2026-07-02", week: 12, mr_pages: "MR5 pp.188–191" },
};

globalThis.archive  = archiveRaw;
globalThis.WK = "week16";
globalThis.weekData = { tasks: [] };     // current week supplied per-case
globalThis.checked  = {};
globalThis.currFirstWeekNum = () => 0;   // don't drop old weeks in this harness
globalThis.currData = { subjects, lessons: { lincoln: lessonsLin } };
globalThis.scheduleOverrides = {};
globalThis.chainDone = (id, ch) => !!ch[id];

eval(fn("schedOv"));
eval(fn("buildSubjectLessons"));
eval(fn("paceIsLessonSeq"));
eval(fn("_mdText"));
eval(fn("_paceManualTitles"));   // paceAutoCount folds hand-marked lessons in first (Stage 4)
eval(fn("_archCheckedId"));
eval(fn("_archTrueRec"));   // archived work counts from its history record (2026-08-06)
eval(fn("paceAutoCount"));

const MR_KWS = ["MR5/MR6 Pages", "MR5 Math", "MR6 Math"];

console.log("Lincoln MR5 — cursor from his completed history\n");

ok("mr_pages is recognised as lesson-sequenced", paceIsLessonSeq("lincoln", "mr_pages") === true);
ok("morning_nb is NOT (daily, repeats one title)", paceIsLessonSeq("lincoln", "morning_nb") === false);
ok("math_sprints is NOT (sequential but total 0)", paceIsLessonSeq("lincoln", "math_sprints") === false);

const deduped = paceAutoCount("lincoln", MR_KWS, null, "mr_pages");
const legacy  = paceAutoCount("lincoln", MR_KWS, null, null);   // no subjectKey = old behaviour

console.log("\n  archive-only count, de-duped : " + deduped);
console.log("  archive-only count, old way  : " + legacy);
ok("de-dupe removes the phantom lessons", deduped < legacy, { deduped, legacy });
// Archived work is counted from its HISTORY RECORD (_archTrueRec), so the wk12 pp.176-179
// card — checked, but its record is Lucy's LOE 43 — leaves the count in BOTH modes. What is
// left: 8 distinct lessons across 14 checked Lincoln MR5 cards (5 copies of pp.196-199,
// 2 each of pp.184-187 and pp.200-203). The de-dupe is the thing under test, and it
// collapses every repeat.
ok("counts 8 distinct lessons, not 14 instances", deduped === 8, deduped);
ok("old way counted 14 task instances", legacy === 14, legacy);
ok("inflation is exactly the 6 duplicate completions", legacy - deduped === 6, legacy - deduped);
ok("the phantom pp.176-179 is not counted as finished", (() => {
  let seen = false;
  paceAutoCount("lincoln", MR_KWS, null, "mr_pages", t => {
    const ti = String(t.title || ""), i = ti.indexOf(" — ");
    if ((i >= 0 ? ti.slice(i + 3) : ti).trim() === "MR5 pp.176–179") seen = true;
  });
  return !seen;
})(), true);
ok("...and it is not handed to Lucy's MR count either (kid filter on the record)",
   paceAutoCount("lucy", MR_KWS, null, null) === 0);
ok("the checked card with NO history record still counts from the card itself (pp.188-191)", (() => {
  let seen = false;
  paceAutoCount("lincoln", MR_KWS, null, "mr_pages", t => { if (String(t.title || "").includes("pp.188–191")) seen = true; });
  return seen;
})(), true);
ok("the unchecked pp.204-207 card in wk13 does not count twice (once, from wk14)", (() => {
  let n = 0;
  paceAutoCount("lincoln", MR_KWS, null, null, t => { if (String(t.title || "").includes("pp.204–207")) n++; });
  return n === 1;
})(), true);

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

// The cursor indexes buildSubjectLessons(), NOT page numbers — a real grid has gaps, so page
// arithmetic off the cursor is meaningless. Assert on sequence positions, which is what the
// cursor actually is.
console.log("\n  cursor = offset(0) + auto + adjust(0)");
console.log("  before this fix : " + withWeekOld + "  (sequence positions ahead of reality)");
console.log("  after  this fix : " + withWeek + "  (= lessons actually finished)");
ok("cursor = distinct lessons finished", withWeek === 8, withWeek);
ok("was 7 ahead before (6 archived dupes + this week)", withWeekOld - withWeek === 7, withWeekOld - withWeek);
ok("excludeWeek=WK leaves this week's check out again", paceAutoCount("lincoln", MR_KWS, WK, null) === legacy);

console.log("\nDaily subjects must be untouched");
const NB_KWS = ["Morning Notebook"];
const nbDedupe = paceAutoCount("lincoln", NB_KWS, null, "morning_nb");
const nbLegacy = paceAutoCount("lincoln", NB_KWS, null, null);
console.log("  morning_nb: with key=" + nbDedupe + "  without=" + nbLegacy);
ok("Morning Notebook still counts every day", nbDedupe === nbLegacy, { nbDedupe, nbLegacy });
ok("...and it's more than 1", nbDedupe > 1, nbDedupe);
ok("...all 5 days, in fact", nbDedupe === 5, nbDedupe);

console.log("\nUnknown subject falls back to the old behaviour (no silent change)");
ok("no subjectKey = instance counting (unchanged)", paceAutoCount("lincoln", MR_KWS, null, undefined) === withWeekOld);
ok("unknown subjectKey = instance counting too", paceAutoCount("lincoln", MR_KWS, null, "no_such_subject") === withWeekOld);

console.log("\nREGRESSION GUARD: grid text and task titles do NOT always match");
// Lucy's NZK grid says "Q41-42" where her task says "Quest 41". Counting by matching the
// lesson GRID zeroed her out and restarted the subject - that approach was reverted.
globalThis.currData.lessons.lucy = { "200": { date: "2026-07-20", week: 15, nzk_l: "Q41-42" } };
const LUCY_KWS = ["NZK"];
const lucyN = paceAutoCount("lucy", LUCY_KWS, null, "nzk_l");
console.log("  lucy nzk_l count: " + lucyN);
ok("Lucy's NZK does not collapse to zero", lucyN > 0, lucyN);
ok("...it counts her two Quests by TITLE, not by the grid cell", lucyN === 2, lucyN);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
