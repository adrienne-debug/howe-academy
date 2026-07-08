/*
 * Node tests for the Curriculum Builder materializer (CB1).
 *
 * Extracts the REAL cbMaterialize (pure — reads only its cfg) out of index.html
 * via the CBGEN_START/CBGEN_END markers and asserts: day selection per pacing
 * mode, allowedDays, calendar-off skipping, the day-minute cap, page patterns,
 * window stop, target-date math, grid extension, and re-pace clears.
 *
 *   run:  node test_builder.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// CBGEN_START");
const b = src.indexOf("// CBGEN_END");
if (a < 0 || b < 0) { console.error("CBGEN markers not found"); process.exit(1); }
const block = src.slice(a, b);
const { cbMaterialize, _cbSpread } = new Function(block + "; return {cbMaterialize:cbMaterialize,_cbSpread:_cbSpread};")();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── row factory: consecutive Mon–Fri weeks starting at a Monday ──────────────
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
// mondayStr must be a Monday. opts: {off:[dates], usedMin:{date:min}, mine:[dates]}
function mkRows(mondayStr, nWeeks, startDayNum, startWkNum, opts) {
  opts = opts || {};
  const rows = [];
  const d = new Date(mondayStr + "T12:00:00");
  let dn = startDayNum;
  for (let w = 0; w < nWeeks; w++) {
    for (let i = 0; i < 5; i++) {
      const ds = iso(d);
      rows.push({
        dayNum: dn++, date: ds, week: "Wk " + (startWkNum + w), dow: DOW[d.getDay()],
        off: (opts.off || []).includes(ds),
        usedMin: (opts.usedMin || {})[ds] || 0,
        hadMine: (opts.mine || []).includes(ds)
      });
      d.setDate(d.getDate() + 1);
    }
    d.setDate(d.getDate() + 2); // skip the weekend
  }
  return rows;
}
const texts = n => { const o = []; for (let i = 1; i <= n; i++) o.push("Lesson " + i); return o; };
const dates = res => res.assignments.map(x => x.date);
const dows = res => res.assignments.map(x => x.dow || DOW[new Date(x.date + "T12:00:00").getDay()]);

// 2026-08-03 is a Monday.
const MON = "2026-08-03";

console.log("spread");
ok("5 pick 3 = Mon/Wed/Fri", JSON.stringify(_cbSpread([1, 2, 3, 4, 5], 3)) === "[1,3,5]");
ok("5 pick 2 = Mon/Fri", JSON.stringify(_cbSpread([1, 2, 3, 4, 5], 2)) === "[1,5]");
ok("5 pick 1 = Mon", JSON.stringify(_cbSpread([1, 2, 3, 4, 5], 1)) === "[1]");
ok("pick more than have = all", _cbSpread([1, 2], 5).length === 2);

console.log("timesPerWeek mode");
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 3, allowedDays: [], content: texts(6), rows: mkRows(MON, 3, 1, 1), dayCapMin: 0 });
  ok("6 lessons at 3×/wk = 2 weeks", res.stats.placed === 6 && res.stats.weeksUsed === 2, res.stats);
  ok("lands Mon/Wed/Fri", JSON.stringify(dows(res).slice(0, 3)) === '["Mon","Wed","Fri"]', dows(res));
  ok("content stays in order", res.assignments[3].text === "Lesson 4");
  ok("no clears when subject had no cells", res.clears.length === 0);
}
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 2, allowedDays: ["Tue", "Thu"], content: texts(4), rows: mkRows(MON, 3, 1, 1), dayCapMin: 0 });
  ok("allowedDays Tue/Thu respected", dows(res).every(d => d === "Tue" || d === "Thu"), dows(res));
}

console.log("calendar + cap");
{
  const rows = mkRows(MON, 2, 1, 1, { off: ["2026-08-03", "2026-08-05", "2026-08-07"] }); // wk1 Mon/Wed/Fri off
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 3, allowedDays: [], content: texts(3), rows, dayCapMin: 0 });
  ok("off days never chosen", !dates(res).some(d => ["2026-08-03", "2026-08-05", "2026-08-07"].includes(d)), dates(res));
  ok("week 1 still serves its 2 open days", dates(res).filter(d => d < "2026-08-08").length === 2, dates(res));
}
{
  const rows = mkRows(MON, 1, 1, 1, { usedMin: { "2026-08-03": 290, "2026-08-05": 290 } });
  const res = cbMaterialize({ sk: "m", minutes: 25, mode: "timesPerWeek", tpw: 3, allowedDays: [], content: texts(3), rows, dayCapMin: 300 });
  ok("over-cap days skipped", !dates(res).includes("2026-08-03") && !dates(res).includes("2026-08-05"), dates(res));
  ok("cap warning fires", res.warnings.some(w => w.includes("cap")), res.warnings);
}

console.log("targetDate mode");
{
  // 12 lessons, 4 weeks of grid, target = end of week 3 → needs ceil(12/3)=4×/wk
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "targetDate", targetDate: "2026-08-21", allowedDays: [], content: texts(12), rows: mkRows(MON, 4, 1, 1), dayCapMin: 0 });
  ok("computes 4×/wk", res.stats.tpwUsed === 4, res.stats);
  ok("finishes by target", res.stats.lastDate <= "2026-08-21", res.stats.lastDate);
  ok("no overshoot warning", !res.warnings.some(w => w.includes("after the")), res.warnings);
}
{
  // 30 lessons, target = end of week 2 → needs 15×/wk, impossible → clamp to 5 + warnings
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "targetDate", targetDate: "2026-08-14", allowedDays: [], content: texts(30), rows: mkRows(MON, 8, 1, 1), dayCapMin: 0 });
  ok("impossible target clamps to daily", res.stats.tpwUsed === 5, res.stats);
  ok("warns it can't hit the target", res.warnings.length >= 1, res.warnings);
  ok("everything still placed", res.stats.placed === 30);
}

console.log("pages mode");
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "pages", tpw: 4, allowedDays: [], pages: { totalPages: 15, startPage: 12, pattern: [3, 4, 5, 3], unitLabel: "pp." }, rows: mkRows(MON, 3, 1, 1), dayCapMin: 0 });
  ok("pattern cycles 3,4,5,3", res.assignments[0].text === "pp. 12–14" && res.assignments[1].text === "pp. 15–18" && res.assignments[2].text === "pp. 19–23", res.assignments.map(x => x.text));
  ok("ends exactly on the last page", res.assignments[3].text === "pp. 24–26", res.assignments[3]);
  ok("4 chunks for 15 pages", res.stats.placed === 4);
}
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "pages", tpw: 5, allowedDays: [], pages: { totalPages: 3, startPage: 7, pattern: [1], unitLabel: "Lesson" }, rows: mkRows(MON, 1, 1, 1), dayCapMin: 0 });
  ok("single-page chunk labels", res.assignments[0].text === "Lesson 7", res.assignments[0]);
}

console.log("pages mode — scanned units (CB6)");
{
  const units = [
    { label: "Lesson 1: Short Vowels", startPage: 3, endPage: 9, estMinutes: 20 },
    { label: "Lesson 2: Long Vowels", startPage: 10, endPage: 15, estMinutes: 20 },
    { label: "Review", startPage: 16, endPage: 16, estMinutes: 15 }
  ];
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "pages", tpw: 3, allowedDays: [], pages: { units, pattern: [4], totalPages: 99, startPage: 1 }, rows: mkRows(MON, 2, 1, 1), dayCapMin: 0 });
  ok("units override the pattern (3 units = 3 days)", res.stats.placed === 3, res.stats);
  ok("unit text = label + true range", res.assignments[0].text === "Lesson 1: Short Vowels · pp. 3–9", res.assignments[0]);
  ok("single-page unit reads p. N", res.assignments[2].text === "Review · p. 16", res.assignments[2]);
  ok("units keep book order", res.assignments[1].text.startsWith("Lesson 2"), res.assignments[1]);
}
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "pages", tpw: 5, allowedDays: [], pages: { units: [{ label: "", startPage: 5, endPage: 8 }] }, rows: mkRows(MON, 1, 1, 1), dayCapMin: 0 });
  ok("label-less unit is just the range", res.assignments[0].text === "pp. 5–8", res.assignments[0]);
}

console.log("window mode");
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "window", windowEnd: "2026-08-07", tpw: 5, allowedDays: [], content: texts(20), rows: mkRows(MON, 4, 1, 1), dayCapMin: 0, extend: { lastDayNum: 20, lastDate: "2026-08-28", lastWeekNum: 4, lastWeekLabel: "Wk 4", isOff: () => false } });
  ok("stops at windowEnd", res.stats.lastDate <= "2026-08-07", res.stats.lastDate);
  ok("places only week 1", res.stats.placed === 5, res.stats);
  ok("leftovers stay unscheduled + explained", res.stats.unplaced === 15 && res.warnings.some(w => w.includes("stop date")), res.warnings);
  ok("window never extends the grid", res.stats.newRows === 0);
}

console.log("minutes mode");
{
  const res = cbMaterialize({ sk: "m", minutes: 15, mode: "minutes", tpw: 2, allowedDays: [], minutesText: "15 min read", rows: mkRows(MON, 3, 1, 1), dayCapMin: 0, extend: { lastDayNum: 15, lastDate: "2026-08-21", lastWeekNum: 3, lastWeekLabel: "Wk 3", isOff: () => false } });
  ok("fills 2×/wk to grid end, no extension", res.stats.placed === 6 && res.stats.newRows === 0, res.stats);
  ok("cell text is the label", res.assignments[0].text === "15 min read");
}

console.log("extension");
{
  // 1-week grid ending Fri 2026-08-07 (dayNum 5, Wk 1); 8 lessons at 3×/wk → 3 in grid, 5 extend
  const res = cbMaterialize({
    sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 3, allowedDays: [], content: texts(8),
    rows: mkRows(MON, 1, 1, 1), dayCapMin: 0,
    extend: { lastDayNum: 5, lastDate: "2026-08-07", lastWeekNum: 1, lastWeekLabel: "Wk 1", isOff: ds => ds === "2026-08-10" }
  });
  const news = res.assignments.filter(x => x.isNew);
  ok("everything placed", res.stats.placed === 8, res.stats);
  ok("5 new rows created", news.length === 5, news.length);
  // Dense extension: lessons + empty placeholder rows share one chronological dayNum
  // sequence (one row per school day, off days skipped, no duplicate dates).
  const allNew = news.concat(res.placeholders || []).sort((a, b) => a.dayNum - b.dayNum);
  ok("dayNums start after the grid and stay unique+ascending",
    allNew[0].dayNum === 6 && allNew.every((x, i) => i === 0 || x.dayNum === allNew[i - 1].dayNum + 1), allNew.map(x => x.dayNum));
  ok("extension is dense — every walked school day gets a row (lesson or placeholder)",
    allNew.every((x, i) => i === 0 || x.date > allNew[i - 1].date), allNew.map(x => x.date));
  ok("no duplicate dates across lessons+placeholders",
    new Set(allNew.map(x => x.date)).size === allNew.length);
  ok("new week labels continue", news[0].week === "Wk 2" && news[news.length - 1].week === "Wk 3", news.map(x => x.week));
  ok("off day 8-10 gets no row at all", !allNew.some(x => x.date === "2026-08-10"), allNew.map(x => x.date));
  ok("no weekend dates", allNew.every(x => { const g = new Date(x.date + "T12:00:00").getDay(); return g >= 1 && g <= 5; }));
  ok("lesson dates ascend with dayNums", news.every((x, i) => i === 0 || x.date > news[i - 1].date));
}
{
  // Mid-week grid end: last row Wed 2026-08-05 → Thu/Fri stay in "Wk 1"
  const rows = mkRows(MON, 1, 1, 1).slice(0, 3); // Mon–Wed
  const res = cbMaterialize({
    sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 5, allowedDays: [], content: texts(7),
    rows, dayCapMin: 0,
    extend: { lastDayNum: 3, lastDate: "2026-08-05", lastWeekNum: 1, lastWeekLabel: "Wk 1", isOff: () => false }
  });
  const news = res.assignments.filter(x => x.isNew);
  ok("Thu/Fri extension keeps the same week label", news[0].week === "Wk 1" && news[1].week === "Wk 1", news.map(x => x.week));
  ok("next Monday starts Wk 2", news[2] && news[2].week === "Wk 2", news.map(x => x.week));
}

console.log("re-pace clears");
{
  const rows = mkRows(MON, 2, 1, 1, { mine: ["2026-08-04", "2026-08-06", "2026-08-11"] }); // old Tue/Thu placements
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 1, allowedDays: ["Mon"], content: texts(2), rows, dayCapMin: 0 });
  ok("old future cells cleared when not reassigned", res.clears.length === 3, res.clears);
  ok("new placements on Mondays only", dows(res).every(d => d === "Mon"), dows(res));
}
{
  const rows = mkRows(MON, 1, 1, 1, { mine: ["2026-08-03"] }); // Monday already had this subject
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 1, allowedDays: ["Mon"], content: texts(1), rows, dayCapMin: 0 });
  ok("reassigned day is NOT cleared (overwrite, not clear+write)", res.clears.length === 0, res.clears);
}

console.log("alternation (blockedDates)");
{
  // Partner claims Mon/Wed/Fri of week 1 → this subject avoids them
  const res = cbMaterialize({ sk: "m2", minutes: 20, mode: "timesPerWeek", tpw: 2, allowedDays: [], content: texts(2), rows: mkRows(MON, 1, 1, 1), dayCapMin: 0, blockedDates: ["2026-08-03", "2026-08-05", "2026-08-07"] });
  ok("blocked days never used", JSON.stringify(dates(res)) === '["2026-08-04","2026-08-06"]', dates(res));
}
{
  // Two-subject alternation: A gets Mon/Wed/Fri, then B (A's days blocked) fills Tue/Thu
  const rowsA = mkRows(MON, 2, 1, 1);
  const a = cbMaterialize({ sk: "a", minutes: 20, mode: "timesPerWeek", tpw: 3, allowedDays: [], content: texts(6), rows: rowsA, dayCapMin: 0 });
  const b = cbMaterialize({ sk: "b", minutes: 20, mode: "timesPerWeek", tpw: 2, allowedDays: [], content: texts(4), rows: mkRows(MON, 2, 1, 1), dayCapMin: 0, blockedDates: dates(a) });
  const overlap = dates(b).filter(d => dates(a).includes(d));
  ok("A and B never share a day", overlap.length === 0, overlap);
  ok("B still places everything", b.stats.placed === 4, b.stats);
  ok("B lands Tue/Thu", dows(b).every(d => d === "Tue" || d === "Thu"), dows(b));
}
{
  // Blocked dates hold in the extension too
  const res = cbMaterialize({
    sk: "m2", minutes: 20, mode: "timesPerWeek", tpw: 5, allowedDays: [], content: texts(7),
    rows: mkRows(MON, 1, 1, 1), dayCapMin: 0, blockedDates: ["2026-08-10", "2026-08-11"],
    extend: { lastDayNum: 5, lastDate: "2026-08-07", lastWeekNum: 1, lastWeekLabel: "Wk 1", isOff: () => false }
  });
  const news = res.assignments.filter(x => x.isNew).map(x => x.date);
  ok("extension skips blocked dates", !news.includes("2026-08-10") && !news.includes("2026-08-11"), news);
  ok("all 7 still placed", res.stats.placed === 7, res.stats);
}

console.log("errors");
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "timesPerWeek", tpw: 3, allowedDays: [], content: [], rows: mkRows(MON, 2, 1, 1), dayCapMin: 0 });
  ok("empty content errors cleanly", !!res.error);
}
{
  const res = cbMaterialize({ sk: "m", minutes: 20, mode: "targetDate", allowedDays: [], content: texts(5), rows: mkRows(MON, 2, 1, 1), dayCapMin: 0 });
  ok("missing target date errors cleanly", !!res.error);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
