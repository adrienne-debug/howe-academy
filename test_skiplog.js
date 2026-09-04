/*
 * Dismissing a lesson in a rebuild wrote curriculum/skiplog and NOTHING ever read it back.
 * The dismissal survived only as a pace `adjust`, which cbApply folds to zero on the grounds
 * that "its cells are gone" — true for a grid-only subject, false once the subject has a
 * lessonSeq, because content derives from the master list and the lesson is still in it.
 * So a dismissed lesson walked back in on the next rebuild and, being earlier in the sequence
 * than today's cell, landed after it and read as out of order.
 *
 * The July-2026 live snapshots this used to replay are gone; the world below is SYNTHETIC,
 * built to the same shape and the same story. Lincoln MR5, today = 2026-08-04:
 *   - lessonSeq pp.176–179 … pp.300–303 (32 lessons); grid weekdays from 2026-07-06 with
 *     pp.196–199 re-served on 07-20, 07-27, 08-03, and Mom's re-lay of pp.204–207 on TODAY
 *   - archive: pp.180–203 finished (pp.196–199 four times over); pp.176–179's check is
 *     Lucy's LOE 43 riding his card; a week5 entry with a REAL pp.176–179 completion that
 *     the app's currFirstWeekNum filter must drop (weekDays start at week8)
 *   - skiplog: pp.204–207 and pp.208–211, done on paper and dismissed in an earlier rebuild
 *   run: node test_skiplog.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function fn(n) {
  const i = src.indexOf("function " + n + "(");
  if (i < 0) throw new Error("not found: " + n);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}
function cbk(n) {
  const i = src.indexOf("const " + n + "=");
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return "globalThis." + n + "=" + src.slice(src.indexOf("{", i), k + 1) + ";"; }
  }
}

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 160) : "")));

// ── synthetic world ──
const PG = "\u{1F4C4}";
const pp = n => "MR5 pp." + n + "–" + (n + 3);
const MR = n => PG + " MR5 Math Reasoning — " + pp(n);
function weekdays(startISO, n) {
  const out = []; const d = new Date(startISO + "T12:00:00");
  while (out.length < n) { const dow = d.getDay(); if (dow >= 1 && dow <= 5) out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
}
function mkArchive(weeks) {
  const out = {};
  weeks.forEach(([label, rows]) => {
    const aw = { weekLabel: label, tasks: [], checked: {}, history: {} };
    rows.forEach(([id, who, title, done, hist]) => {
      aw.tasks.push({ id, who, title, day: "monday", time: "9:00 AM" });
      if (done) { aw.checked[id] = "ts"; aw.history[id] = Object.assign({ who, title, ts: "ts" }, hist || {}); }
    });
    out[label] = aw;
  });
  return out;
}

const LESSON_SEQ = []; for (let n = 176; n <= 300; n += 4) LESSON_SEQ.push(pp(n));   // 32 lessons
const subj = {
  lincoln: {
    mr_pages:   { display: "MR5 Math Reasoning", rules: "sequential", total: 32, lessonSeq: LESSON_SEQ, tracking: "auto", pacing: { tpw: 4 } },
    morning_nb: { display: "Morning Notebook",   rules: "daily",      total: 0 },
  },
  lucy: { loe: { display: "LOE Essentials", rules: "sequential", total: 60 } },
};

// the grid (30 weekdays from 2026-07-06); null = no MR5 cell that day
const MR_GRID = [
  pp(176), pp(180), pp(184), pp(188), pp(192),     // 07-06..07-10
  pp(196), pp(200), pp(204), pp(208), "—",         // 07-13..07-17
  pp(196), null,    null,    null,    null,        // 07-20 re-serve
  pp(196), null,    null,    null,    null,        // 07-27 re-serve
  pp(196), pp(204), pp(208), pp(212), pp(216),     // 08-03 re-serve, 08-04 = TODAY (Mom re-laid 204), 08-05..
  pp(220), pp(224), pp(228), pp(232), pp(236),     // 08-10..08-14
];
const l4 = {};
weekdays("2026-07-06", MR_GRID.length).forEach((date, i) => {
  const e = { date, week: 12 + Math.floor(i / 5), morning_nb: "Morning Notebook" };
  if (MR_GRID[i] !== null) e.mr_pages = MR_GRID[i];
  l4[String(187 + i)] = e;
});

let _n = 0; const tid = () => "t" + (++_n);
const arch = mkArchive([
  // an OLD week the app does not count (weekDays start at week8): a real pp.176-179 check
  ["week5", [[tid(), "lincoln", MR(176), true]]],
  ["week12", [
    [tid(), "lincoln", MR(176), true, { who: "lucy", title: "\u{1F4D6} LOE Essentials — LOE 43" }],  // STOLEN
    ...[180, 184, 188, 192].map(n => [tid(), "lincoln", MR(n), true]),
    ...[1, 2, 3].map(() => [tid(), "lincoln", PG + " Morning Notebook — Morning Notebook", true]),
  ]],
  ["week13", [
    [tid(), "lincoln", MR(196), true], [tid(), "lincoln", MR(200), true],
    [tid(), "lincoln", MR(204), false], [tid(), "lincoln", MR(208), false],   // "done on paper" — never checked
  ]],
  ["week14", [ ...[196, 196, 196].map(n => [tid(), "lincoln", MR(n), true]) ]],
  ["week15", [ [tid(), "lincoln", MR(196), false] ]],
]);

globalThis.archive = arch;
globalThis.currData = {
  subjects: subj,
  lessons: { lincoln: l4 },
  skiplog: { lincoln: { mr_pages: [
    { lesson: "MR5 pp.204–207", date: "2026-07-28", dayNum: 202, ts: "2026-07-28T20:00:00" },
    { lesson: "MR5 pp.208–211", date: "2026-07-28", dayNum: 203, ts: "2026-07-28T20:00:00" },
  ] } },
  // WITHOUT weekDays, currFirstWeekNum() returns 1 and counts archived weeks the app
  // filters out — which made an earlier harness predict pp.244 where the app said pp.216.
  weekDays: { lincoln: { week8: {}, week9: {}, week10: {}, week11: {}, week12: {}, week13: {}, week14: {}, week15: {}, week16: {} },
              lucy: { week9: {}, week10: {} } },
};
globalThis.paceData = { subjects: { lincoln: { mr_pages: { offset: 0, adjust: 0, paceAdjust: 0, total: 32 } } } };
globalThis.scheduleOverrides = { "2027-01-04": { lincoln: { added: { mr_pages: true } } } };   // a stale bare artifact
globalThis.WK = "week16";
globalThis.weekData = { tasks: [] };
globalThis.checked = {};
globalThis.chainDone = (id, ch) => !!ch[id];
globalThis.cbBacklogStash = {};
globalThis.cbDecisions = {};
globalThis.cbTodayISO = () => "2026-08-04";

eval(cbk("PACE_ALT_KEYWORDS"));
// One eval at module scope — eval() inside a forEach callback scopes the declarations to
// that callback and they never become visible here.
eval(["currFirstWeekNum", "currKeyword", "paceKeywords", "paceIsLessonSeq", "_mdText", "_paceManualTitles", "paceDoneTitles",
      "_archCheckedId", "_archTrueRec",
      "cbDoneCellSet", "paceAutoCount", "cbSplitCells", "cbDeriveContent", "cbBacklogInfo",
      "cbRemainingContent"].map(fn).join("\n"));

console.log("A dismissed lesson stays dismissed\n");

ok("harness matches the app (currFirstWeekNum = 8)", currFirstWeekNum() === 8, currFirstWeekNum());

const skip = currData.skiplog.lincoln.mr_pages.map(e => e.lesson);
ok("skiplog holds the two he did on paper",
   skip.includes("MR5 pp.204–207") && skip.includes("MR5 pp.208–211"), skip);

const content = cbRemainingContent("lincoln", "mr_pages");
ok("neither dismissed lesson comes back",
   !content.includes("MR5 pp.204–207") && !content.includes("MR5 pp.208–211"),
   content.slice(0, 4));
// The rebuild derives what is left by CONTENT, and archived work counts from its history
// record — so pp.176-179 leads. Lincoln never did those pages: their wk12 check was really
// Lucy's LOE 43 riding his card (and the week5 completion is outside the app's window).
// It is the one genuine hole left in front of pp.212–215, and everything after it still
// runs in sequence order.
ok("the rebuild opens on the real hole, pp.176–179", content[0] === "MR5 pp.176–179", content[0]);
ok("and runs in sequence order from there",
   content.slice(0, 4).join("|") ===
   ["MR5 pp.176–179", "MR5 pp.212–215", "MR5 pp.216–219", "MR5 pp.220–223"].join("|"),
   content.slice(0, 4));
ok("no duplicates anywhere in what it lays",
   new Set(content).size === content.length,
   content.filter((v, i) => content.indexOf(v) !== i).slice(0, 4));
ok("nothing finished is laid again (pp.180–203)",
   [180, 184, 188, 192, 196, 200].every(n => !content.includes(pp(n))), content.slice(0, 6));
ok("it lays the 32 - 6 done - 2 dismissed = 24 lessons that are left", content.length === 24, content.length);
ok("cbBacklogStash records the split for cbApply", !!cbBacklogStash["lincoln|mr_pages"] && cbBacklogStash["lincoln|mr_pages"].doneN === 6,
   cbBacklogStash["lincoln|mr_pages"] && cbBacklogStash["lincoln|mr_pages"].doneN);

// the harness note, made load-bearing: drop weekDays and the week5 completion leaks in
console.log("\nwithout weekDays the harness diverges from the app");
{
  const wd = currData.weekDays; delete currData.weekDays;
  const leaked = cbRemainingContent("lincoln", "mr_pages");
  currData.weekDays = wd;
  ok("currFirstWeekNum falls to 1 and the week5 check counts → pp.176–179 is no longer the hole",
     currFirstWeekNum() === 8 && leaked[0] === "MR5 pp.212–215", leaked.slice(0, 2));
}

// ── the regression itself ──
console.log("\nwithout the skiplog, the bug reproduces");
const info = cbBacklogInfo("lincoln", "mr_pages");
const withoutLog = cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, []);
// pp.204–207 currently sits on today's cell, so it is dropped for that reason regardless —
// assert on pp.208–211, which nothing else removes.
ok("today's cell is a today-cell (its stale twin on Jul 15 is unfinished)",
   info.split.todayCells.length === 1 && info.split.todayCells[0].text === "MR5 pp.204–207", info.split.todayCells);
ok("a dismissed lesson DOES return without the skiplog",
   withoutLog.includes("MR5 pp.208–211"), withoutLog.slice(0, 4));
ok("...ahead of today's lesson, which is the out-of-order symptom",
   withoutLog.indexOf("MR5 pp.208–211") >= 0 &&
   withoutLog.indexOf("MR5 pp.208–211") < withoutLog.indexOf("MR5 pp.212–215"),
   { at: withoutLog.indexOf("MR5 pp.208–211"), today: withoutLog.indexOf("MR5 pp.212–215") });
ok("...and with the skip set handed in, it stays out",
   !cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, [],
                    new Set(["mr5 pp.204–207", "mr5 pp.208–211"])).includes("MR5 pp.208–211"));

console.log("\nold call signature is untouched");
ok("4-arg cbDeriveContent behaves exactly as before",
   JSON.stringify(cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, [])) ===
   JSON.stringify(cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, [], undefined)));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
