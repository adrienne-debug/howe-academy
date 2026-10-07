// NBDAYORDER (2026-10-07): every kid's notebook prints its days in true CALENDAR order, starting from the day the week
// really starts. Live: Ellis's notebook printed Thu, Fri, Mon, Tue, Wed, and a week Mom started on Tuesday opened on
// Monday — the generators sorted day KEYS by a fixed Mon→Fri list (next Monday first) and the week grids followed task
// order. Run: node test_nb_day_order.js
const fs = require("fs"), path = require("path");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL - " + m); } };
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const w = {}; (new Function("window", "document", src))(w, {});
const H = w.HoweNotebooks, cal = H._internal.nbCalendarDays;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log("NBDAYORDER block");
ok(src.indexOf("// NBDAYORDER_START") > 0 && src.indexOf("// NBDAYORDER_END") > src.indexOf("// NBDAYORDER_START"), "marked block present");
ok(!/DAY_ORDER\.indexOf\(a\)/.test(src), "no generator sorts day keys by the fixed Mon→Fri list any more");

// Mom picked Tuesday: Tue Oct 6 … Mon Oct 12. Firebase hands keys back alphabetically (friday, monday, thursday, …).
const tueWeek = { friday: "October 9", monday: "October 12", thursday: "October 8", tuesday: "October 6", wednesday: "October 7" };
const TUE = ["tuesday", "wednesday", "thursday", "friday", "monday"];
const thuWeek = { friday: "October 9", monday: "October 12", thursday: "October 8", tuesday: "October 13", wednesday: "October 14" };
const THU = ["thursday", "friday", "monday", "tuesday", "wednesday"];
const monWeek = { monday: "October 5", tuesday: "October 6", wednesday: "October 7", thursday: "October 8", friday: "October 9" };
const MON = ["monday", "tuesday", "wednesday", "thursday", "friday"];

console.log("nbCalendarDays");
ok(eq(cal(tueWeek), TUE), "Tuesday start → Tue Wed Thu Fri Mon (got " + cal(tueWeek) + ")");
ok(eq(cal(thuWeek), THU), "Thursday start → Thu Fri Mon Tue Wed");
ok(eq(cal(monWeek), MON), "a plain Mon–Fri week is unchanged");
ok(eq(cal({ friday: "Oct 9", monday: "Oct 5", thursday: "Oct 8" }), ["monday", "thursday", "friday"]), "short month names read");
ok(eq(cal({ monday: "January 4", tuesday: "December 29", wednesday: "December 30", thursday: "December 31", friday: "January 1" }),
  ["tuesday", "wednesday", "thursday", "friday", "monday"]), "a week across New Year puts December first");
ok(eq(cal({ monday: "September 28", wednesday: "September 30", thursday: "October 1", tuesday: "September 29", friday: "October 2" }), MON), "a week across a month end stays in order");
ok(eq(cal({ saturday: "October 10", monday: "October 12", tuesday: "October 6" }), ["tuesday", "saturday", "monday"]), "a Saturday sits in its calendar place");
ok(eq(cal(tueWeek, ["monday", "tuesday", "friday"]), ["tuesday", "friday", "monday"]), "keys argument limits and orders just those days");
ok(eq(cal(tueWeek, ["unknown", "monday", "tuesday"]), ["tuesday", "monday", "unknown"]), "a day with no date goes after the dated ones");
ok(eq(cal({ friday: "Fri", monday: "Mon", wednesday: "Wed" }), ["monday", "wednesday", "friday"]), "dates that don't read fall back to Mon→Fri (old behaviour)");
ok(eq(cal({}), []) && eq(cal(null), []), "empty week → no days");

console.log("weekDatesRange");
ok(H.weekDatesRange(tueWeek, 2026) === "October 6–12, 2026", "Tuesday-start range reads from the real first day (got " + H.weekDatesRange(tueWeek, 2026) + ")");
ok(H.weekDatesRange(monWeek, 2026) === "October 5–9, 2026", "Mon–Fri range unchanged");

// Each generator: the day pages must run in calendar order — the LAST place each day's date prints is its own day page
// (the date may also show earlier, in the week grid or the header's range).
const firstSeen = (html, dates, days) => days.map(d => ({ d, i: html.indexOf(dates[d]) })).filter(x => x.i >= 0).sort((a, b) => a.i - b.i).map(x => x.d);
const lastSeen = (html, dates, days) => days.map(d => ({ d, i: html.lastIndexOf(dates[d]) })).filter(x => x.i >= 0).sort((a, b) => a.i - b.i).map(x => x.d);
const mkTasks = (kid, days) => days.slice().reverse().map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const ctx = (kid, dates, days) => ({ weekData: { dates, tasks: mkTasks(kid, days) }, weekNum: 27, extraPages: {}, prevSummary: {}, pace: [], units: [] });

["lincoln", "ellis", "lucy", "julian", "caleb"].forEach(kid => {
  console.log(kid);
  [["Tuesday start", tueWeek, TUE], ["Thursday start", thuWeek, THU], ["Mon–Fri", monWeek, MON]].forEach(([lbl, dates, want]) => {
    const out = H.generate(kid, ctx(kid, dates, want));
    const s = out.student;
    const fs1 = firstSeen(s, dates, want);
    ok(fs1.length === want.length, kid + " " + lbl + ": every day's date prints (" + fs1.length + "/" + want.length + ")");
    ok(eq(lastSeen(s, dates, want), want), kid + " " + lbl + ": day pages run in calendar order (got " + lastSeen(s, dates, want).join(",") + ")");
  });
});

console.log("week-at-a-glance grids (columns were in first-task order)");
["lincoln", "ellis"].forEach(kid => {
  const s = H.generate(kid, ctx(kid, tueWeek, TUE)).student;
  const grid = s.slice(s.indexOf('class="sched-grid"'), s.indexOf('class="sched-grid"') + 6000);
  ok(eq(firstSeen(grid, tueWeek, TUE), TUE), kid + ": schedule grid columns Tue → Mon (got " + firstSeen(grid, tueWeek, TUE).join(",") + ")");
});

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
