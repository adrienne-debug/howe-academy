/*
 * Node tests for SEQFILL's carry-over box rule (her ask 2026-10-02).
 *
 * A carry-over box card (_eowOverflow) is the unscheduled tail — the weekday it is parked on is
 * never shown to the kid. seqFillNormalize used to lock any card whose day had passed, so a box
 * card parked on Tuesday froze with whatever lesson it held. Live on Fri 2026-10-02 8:17 PM:
 * Ellis' Mathematical Reasoning (rebuilt from its May 30 end date on 10/1) had Saturday pp. 13–16
 * correct, but the box read pp. 17–20, 21–24, 49–52 — six lessons skipped — and the pass logged
 * "⚠ locked card out of sequence". Unchecked, unclaimed box cards are now slots and refill in order.
 *
 * Replays Ellis' real week25 cards (read from Firebase 10/2) through the REAL function.
 *   run:  node test_seq_fill_box.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// SEQFILL_START"), b = src.indexOf("// SEQFILL_END");
if (a < 0 || b < 0) { console.error("SEQFILL markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

// Ellis' real MR plan around the cursor (4 pages a lesson)
const IDS = [], SEQ = [];
for (let n = 350; n <= 365; n++) { IDS.push("L0" + n); const p = (n - 350) * 4 + 1; SEQ.push("pp. " + p + "–" + (p + 3)); }
const DONE = new Set(["L0350", "L0351", "L0352"]);                 // curriculum/done: pp. 1–12
const PID = "ellis__mathematical_reasoning";
const pages = lid => SEQ[IDS.indexOf(lid)];

function mkNorm(o) {
  const subj = { ellis: { mathematical_reasoning: { planId: PID, lessonIds: IDS, lessonSeq: SEQ } } };
  const notes = [];
  const e = { console, JSON, Object, Array, String, Number, Math, Set, RegExp,
    Date: class extends Date { constructor(...a) { if (!a.length) super("2026-10-02T20:17:00"); else super(...a); } },
    checked: (o && o.checked) || {}, claimed: (o && o.claimed) || {},
    currData: { subjects: subj },
    DAY_DT: { monday: "September 28", tuesday: "September 29", wednesday: "September 30", thursday: "October 1", friday: "October 2" },
    _todayStr: () => "2026-10-02",
    toMin: x => { const m = /^(\d+):(\d+)\s*(AM|PM)/i.exec(x || ""); if (!m) return 9999; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; },
    planBacked: (k, sk) => !!(subj[k] && subj[k][sk]), lidsFor: () => IDS, lidDoneSet: () => DONE, dbg: m => notes.push(m) };
  e.__notes = notes;
  vm.createContext(e); vm.runInContext(BLOCK, e); return e;
}
const T = (idLid, day, time, lid, extra) => Object.assign({ id: "ellis_" + PID + "_" + idLid, who: "ellis", subjectKey: "mathematical_reasoning",
  day, time, lid, title: "📖 Mathematical Reasoning — " + pages(lid) }, extra || {});
const BOX = { _eowOverflow: true };
const CHECKED = { ["ellis_" + PID + "_L0350"]: "02:44 PM Oct 1", ["ellis_" + PID + "_L0351"]: "04:19 PM Oct 1" };
// exactly as week25/tasks held them on 10/2 evening
const ellisWeek = () => [
  T("L0350", "thursday", "12:16 PM", "L0350"),
  T("L0351", "thursday", "2:44 PM", "L0351", { lids: ["L0351", "L0352"], mergedFrom: ["ellis_" + PID + "_L0352"] }),
  T("L0355", "saturday", "12:25 PM", "L0353"),
  T("L0354", "friday", "12:26 PM", "L0354", BOX),
  T("L0357", "thursday", "3:05 PM", "L0355", BOX),
  T("L0361", "tuesday", "3:40 PM", "L0362", BOX),
];
const byTime = (ts, day, time) => ts.find(t => t.day === day && t.time === time);

console.log("── Ellis' live week25, Fri 10/2 8:17 PM ──");
{
  const e = mkNorm({ checked: CHECKED });
  const tasks = ellisWeek();
  e.__t = tasks; const r = vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("Saturday's sitting keeps pp. 13–16 — the next lesson", byTime(tasks, "saturday", "12:25 PM").lid === "L0353");
  ok("box card 1 = pp. 17–20", byTime(tasks, "friday", "12:26 PM").lid === "L0354", byTime(tasks, "friday", "12:26 PM"));
  ok("box card 2 = pp. 21–24", byTime(tasks, "thursday", "3:05 PM").lid === "L0355", byTime(tasks, "thursday", "3:05 PM"));
  ok("box card 3 = pp. 25–28, not the stale pp. 49–52", byTime(tasks, "tuesday", "3:40 PM").lid === "L0356", byTime(tasks, "tuesday", "3:40 PM"));
  ok("…and its title follows", byTime(tasks, "tuesday", "3:40 PM").title === "📖 Mathematical Reasoning — pp. 25–28", byTime(tasks, "tuesday", "3:40 PM").title);
  ok("box cards stay in the box (still _eowOverflow, same day/time)", tasks.filter(t => t._eowOverflow).length === 3);
  ok("the checked Thursday cards are untouched", tasks[0].lid === "L0350" && tasks[1].lid === "L0351" && tasks[1].lids.length === 2);
  ok("no '⚠ locked card out of sequence' any more", !r.notes.some(n => /out of sequence/.test(n)), r.notes);
  const box = e.__notes.filter(m => /^📦 box refill: /.test(m));
  ok("📦 box watch logs exactly one line", box.length === 1, e.__notes);
  ok("…naming the old and new pages and the parked day",
    box[0] === "📦 box refill: ellis|mathematical_reasoning pp. 49–52 → pp. 25–28 (filed under tuesday)", box[0]);
  ok("ids stay unique", new Set(tasks.map(t => t.id)).size === tasks.length, tasks.map(t => t.id));
  ok("card count unchanged", tasks.length === 6);
  const r2 = vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("idempotent — a second write changes nothing", r2.changed === 0, r2);
  ok("…and logs no second 📦 line", e.__notes.filter(m => /^📦/.test(m)).length === 1, e.__notes);
}

console.log("\n── what stays fixed ──");
{
  const e = mkNorm({ checked: Object.assign({ ["ellis_" + PID + "_L0361"]: "09:00 AM Oct 2" }, CHECKED) });
  const tasks = ellisWeek();
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("a CHECKED box card is never re-stamped", byTime(tasks, "tuesday", "3:40 PM").lid === "L0362");
}
{
  const e = mkNorm({ checked: CHECKED, claimed: { ["ellis_" + PID + "_L0361"]: true } });
  const tasks = ellisWeek();
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("a CLAIMED box card is never re-stamped", byTime(tasks, "tuesday", "3:40 PM").lid === "L0362");
}
{
  const e = mkNorm({ checked: CHECKED });
  const tasks = [T("L0362", "tuesday", "3:40 PM", "L0362")];         // a real past sitting, not in the box
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("a past-day card OUTSIDE the box is still locked (unchanged rule)", tasks[0].lid === "L0362");
}
{
  const e = mkNorm({ checked: CHECKED });
  const tasks = [T("L0354", "saturday", "12:25 PM", "L0355")];      // a real sitting re-stamped — not the box
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("a non-box re-stamp writes no 📦 line", tasks[0].lid === "L0353" && !e.__notes.some(m => /^📦/.test(m)), e.__notes);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
