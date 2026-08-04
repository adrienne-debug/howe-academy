/*
 * Dismissing a lesson in a rebuild wrote curriculum/skiplog and NOTHING ever read it back.
 * The dismissal survived only as a pace `adjust`, which cbApply folds to zero on the grounds
 * that "its cells are gone" — true for a grid-only subject, false once the subject has a
 * lessonSeq, because content derives from the master list and the lesson is still in it.
 * So a dismissed lesson walked back in on the next rebuild and, being earlier in the sequence
 * than today's cell, landed after it and read as out of order.
 *
 * Replays Lincoln's REAL MR5 grid, lesson list, archive and skiplog.
 *   run: node test_skiplog.js
 */
const fs = require("fs");
const S = "/private/tmp/claude-501/-Users-adriennehowe/ce8e1d3a-c7a7-40c9-98a5-4cea32fb95a2/scratchpad/";
const src = fs.readFileSync(__dirname + "/index.html", "utf8");

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

const J = f => JSON.parse(fs.readFileSync(S + f, "utf8"));
const subj = J("subj_now.json");
subj.lincoln.mr_pages = J("s2.json");

globalThis.archive = J("arch.json");
globalThis.currData = {
  subjects: subj,
  lessons: { lincoln: J("l4.json") },
  skiplog: J("skip.json"),
  // WITHOUT weekDays, currFirstWeekNum() returns 1 and counts archived weeks the app
  // filters out — which made an earlier harness predict pp.244 where the app said pp.216.
  weekDays: J("wd.json"),
};
globalThis.paceData = { subjects: { lincoln: { mr_pages: J("p4.json") } } };
globalThis.scheduleOverrides = J("o3.json");
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
eval(["currFirstWeekNum", "currKeyword", "paceKeywords", "paceIsLessonSeq", "paceDoneTitles",
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
ok("the rebuild starts on pp.212–215", content[0] === "MR5 pp.212–215", content[0]);
ok("and runs in sequence order from there",
   content.slice(0, 4).join("|") ===
   ["MR5 pp.212–215", "MR5 pp.216–219", "MR5 pp.220–223", "MR5 pp.224–227"].join("|"),
   content.slice(0, 4));
ok("no duplicates anywhere in what it lays",
   new Set(content).size === content.length,
   content.filter((v, i) => content.indexOf(v) !== i).slice(0, 4));

// ── the regression itself ──
console.log("\nwithout the skiplog, the bug reproduces");
const info = cbBacklogInfo("lincoln", "mr_pages");
const withoutLog = cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, []);
// pp.204–207 currently sits on today's cell, so it is dropped for that reason regardless —
// assert on pp.208–211, which nothing else removes.
ok("a dismissed lesson DOES return without the skiplog",
   withoutLog.includes("MR5 pp.208–211"), withoutLog.slice(0, 4));
ok("...ahead of today's lesson, which is the out-of-order symptom",
   withoutLog.indexOf("MR5 pp.208–211") >= 0 &&
   withoutLog.indexOf("MR5 pp.208–211") < withoutLog.indexOf("MR5 pp.212–215"),
   { at: withoutLog.indexOf("MR5 pp.208–211"), today: withoutLog.indexOf("MR5 pp.212–215") });

console.log("\nold call signature is untouched");
ok("4-arg cbDeriveContent behaves exactly as before",
   JSON.stringify(cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, [])) ===
   JSON.stringify(cbDeriveContent(info.split, subj.lincoln.mr_pages.lessonSeq, info.doneN, [], undefined)));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
