/*
 * Node tests — 🗓 MPSCHWK_NAV (her ask 2026-10-09): Mom's Day ▸ 🗓 Schedule ▸ Week steps ‹ › to last / next week.
 * Another week loads READ-ONLY from Firebase weekN/tasks (+ checked, meta) with once() reads; the live weekData /
 * checked are never touched. Past weeks show done / not done; future weeks show the plan; tap a day → read-only list.
 *   run:  node test_mpschwk_nav.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const tab = src.slice(src.indexOf("// 🗓 MOMSCHED_TAB_START"), src.indexOf("// 🗓 MOMSCHED_TAB_END"));
const blk = src.slice(src.indexOf("// 🗓 MPSCHWK_NAV_START"), src.indexOf("// 🗓 MPSCHWK_NAV_END"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const CUR = [
  { id: "c1", who: "ava", day: "thursday", time: "9:00 AM", title: "LiveMath", mom: "required" },
];
const FB = {
  "week9/tasks": { p1: { id: "p1", who: "ava", day: "monday", time: "9:00 AM", title: "OldMath", mom: "required" },
                   p2: { id: "p2", who: "ben", day: "monday", time: "10:00 AM", title: "OldReading" },
                   p3: { id: "p3", who: "ben", day: "tuesday", time: "9:00 AM", title: "OldScience", mom: "maybe" },
                   p4: { id: "p4", who: "ava", day: "monday", time: "12:00 PM", title: "Lunch" },
                   p5_c: { id: "p5_c", who: "ava", day: "monday", time: "9:00 AM", title: "CarryCopy" } },
  "week9/checked": { p1: "Mon 9:40 AM" },
  "week9/meta": { week: "week9", dates: { monday: "Sep 28" } },
  "week11/tasks": { n1: { id: "n1", who: "ava", day: "wednesday", time: "9:00 AM", title: "NextMath" },
                    n2: { id: "n2", who: "ben", day: "saturday", time: "9:00 AM", title: "NextChores" } },
  "week11/meta": { dates: {} },
};
function world(o) {
  o = o || {};
  const log = { reads: [], writes: [], renders: 0, pending: [] };
  const live = { weekData: { week: "week10", tasks: CUR.slice() }, checked: { c1: "x" } };
  const snap = v => ({ val: () => (v === undefined ? null : v) });
  const db = o.noDb ? null : {
    ref: p => ({
      once: (ev, cb, err) => { log.reads.push(p); const f = () => (o.failOn === p ? err && err(new Error("denied")) : cb(snap(FB[p]))); if (o.async) log.pending.push(f); else f(); },
      on: () => log.writes.push("on:" + p),
      set: () => log.writes.push(p), update: () => log.writes.push(p), remove: () => log.writes.push(p), push: () => log.writes.push(p),
    }),
  };
  const env = {
    ROSTER: ["ava", "ben"], KID_NAME: { ava: "Ava", ben: "Ben" }, SL_KCOL: { ava: "#e11d48", ben: "#2563eb" }, DAYS_ALL: DAYS,
    HA_LS: { getItem: () => null, setItem: () => {} },
    document: { getElementById: () => ({}) }, renderMomsPlan: () => log.renders++,
    mdTodayName: () => "thursday", getActiveTasks: () => live.weekData.tasks,
    mlQueueLay: ts => ts, dsDoneAtTime: ts => ts, effectiveDay: t => t.day, checked: live.checked,
    famMomView: x => x, famIsMomCard: () => false,
    momAgendaHtml: () => "MOMAG", allAgendaHtml: () => "ALLAG",
    calRenderMonthPreview: () => "MONTH", calRenderEventForm: () => "FORM",
    kcEmoji: () => "⭐", cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    toMin: t => { const m = /(\d+):(\d+) (AM|PM)/.exec(t || ""); if (!m) return null; let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; },
    fromMin: m => m + "m", taskTitleShow: t => t.title,
    momSchedView: false, tab: "moms-plan", showTab: () => {}, msvEnter: () => {},
    db, WK: "week10", activeWk: () => o.wk || "week10",
    archive: o.archive || {}, ld: k => (o.ls || {})[k] || null,
  };
  const keys = Object.keys(env);
  const body = "let kid='all', day='monday', calDaySel=null, calAddMode=null;\n" + tab + blk +
    "\nreturn {mpSchWeekHTML,mpSchBody,mpSchWkStep,mpSchWkBack,mpSchWkDaySet,mpSchWkNum,mpSchWkLoad,mpSchWkTasks,mpSchSet,st:()=>({off:mpSchWkOff,day:mpSchWkDay,mode:mpSchMode}),cache:mpSchWkCache};";
  const api = new Function(...keys, body)(...keys.map(k => env[k]));
  return { api, log, live };
}
const headers = h => (h.match(/onclick="mpSchWkDaySet\('(\w+)'\)" style="cursor:pointer;text-align/g) || []).map(s => /'(\w+)'/.exec(s)[1]);

console.log("── this week is unchanged ──");
{
  const w = world();
  const h = w.api.mpSchWeekHTML("all");
  ok("this week: same grid (mpSchDaySet columns) + live card", (h.match(/<div onclick="mpSchDaySet\('(\w+)'\)" style="cursor:pointer;text-align/g) || []).length === 5 && /LiveMath/.test(h));
  ok("‹ › arrows over the week", /mpSchWkStep\(-1\)/.test(h) && /mpSchWkStep\(1\)/.test(h) && /This week/.test(h) && /Week 10/.test(h));
  ok("no reads until you step", w.log.reads.length === 0);
}
console.log("\n── ‹ last week (past) ──");
{
  const w = world();
  w.api.mpSchWkStep(-1);
  ok("steps to Week 9", w.api.mpSchWkNum() === 9 && w.api.st().off === -1);
  ok("reads week9/tasks, checked, meta with once()", JSON.stringify(w.log.reads) === JSON.stringify(["week9/tasks", "week9/checked", "week9/meta"]));
  ok("re-renders once loaded", w.log.renders >= 1);
  const h = w.api.mpSchWeekHTML("all");
  ok("labelled Last week · read-only, with a way back", /Last week/.test(h) && /read-only/.test(h) && /mpSchWkBack\(\)/.test(h));
  ok("shows that week's cards, not this week's", /OldMath/.test(h) && /OldReading/.test(h) && !/LiveMath/.test(h));
  ok("lunch + carry copies left out", !/Lunch/.test(h) && !/CarryCopy/.test(h));
  ok("done ✓ / not done marks", /9:00 AM|540m/.test(h) && /540m · <span style="color:#e11d48">Ava<\/span> ✓/.test(h) && /600m · <span style="color:#2563eb">Ben<\/span> · not done/.test(h));
  ok("day header carries the week's date", /Mon <span[^>]*>Sep 28<\/span>/.test(h));
  ok("day taps go to the read-only day list, never to Today", headers(h).length === 5 && !/mpSchDaySet\(/.test(h));
  w.api.mpSchWkDaySet("monday");
  const d = w.api.mpSchWeekHTML("all");
  ok("day list: that day's cards with done / not done", /OldMath/.test(d) && /✓ done/.test(d) && /OldReading/.test(d) && /not done/.test(d) && !/OldScience/.test(d));
  ok("day list has a way back to the week", /mpSchWkDaySet\(null\)/.test(d));
  ok("mode stays Week (Today is the live day only)", w.api.st().mode !== "today");
  const m = (w.api.mpSchWkDaySet(null), w.api.mpSchWeekHTML("mom"));
  ok("Mom view: 🔴 / 🟡 cards only", /🔴 OldMath/.test(m) && /🟡 OldScience/.test(m) && !/OldReading/.test(m));
  ok("one kid", /OldReading/.test(w.api.mpSchWeekHTML("ben")) && !/OldMath/.test(w.api.mpSchWeekHTML("ben")));
  w.api.mpSchWkStep(1);
  ok("› back to this week draws the live grid again", w.api.st().off === 0 && /LiveMath/.test(w.api.mpSchWeekHTML("all")));
  w.api.mpSchWkStep(-1);
  ok("cached — stepping back again doesn't re-read", w.log.reads.length === 3);
}
console.log("\n── › next week (future) ──");
{
  const w = world();
  w.api.mpSchWkStep(1);
  const h = w.api.mpSchWeekHTML("all");
  ok("Next week · Week 11 — the plan", /Next week/.test(h) && /Week 11/.test(h) && /NextMath/.test(h));
  ok("future: no done / not done marks", !/not done/.test(h) && !/✓/.test(h));
  ok("Saturday shows when it has cards", headers(h).indexOf("saturday") >= 0);
  w.api.mpSchWkStep(1);
  ok("a week not built yet says so", /hasn’t been built yet/.test(w.api.mpSchWeekHTML("all")));
}
console.log("\n── edges ──");
{
  const w = world({ async: true });
  w.api.mpSchWkStep(-1);
  ok("loading message while Firebase answers", /Loading Week 9/.test(w.api.mpSchWeekHTML("all")));
  while (w.log.pending.length) w.log.pending.shift()();
  ok("then the week", /OldMath/.test(w.api.mpSchWeekHTML("all")));
  const w2 = world({ async: true });
  w2.api.mpSchWkStep(-1); w2.api.mpSchWkBack(); const r0 = w2.log.renders;
  while (w2.log.pending.length) w2.log.pending.shift()();
  ok("a reply for a week no longer on screen doesn't redraw", w2.log.renders === r0 && w2.api.cache.week9.tasks.length === 5);
  const w1 = world({ wk: "week1" });
  ok("can't step before Week 1", /disabled aria-label="Previous week"/.test(w1.api.mpSchWeekHTML("all")) && (w1.api.mpSchWkStep(-1), w1.api.st().off === 0));
  const wa = world({ noDb: true, archive: { week9: { tasks: [{ id: "a1", who: "ava", day: "monday", time: "9:00 AM", title: "ArchMath" }, { id: "a2", who: "ava", day: "monday", time: "10:00 AM", title: "ArchArt" }], checked: { a1: "t" }, dates: {} } } });
  wa.api.mpSchWkStep(-1);
  const ha = wa.api.mpSchWeekHTML("all");
  ok("no db → the archive's closed-week copy, with its completions", /ArchMath/.test(ha) && /✓/.test(ha) && /not done/.test(ha));
  const wf = world({ failOn: "week9/tasks" });
  wf.api.mpSchWkStep(-1);
  ok("read refused + nothing local → says it couldn't load", /Couldn’t load Week 9/.test(wf.api.mpSchWeekHTML("all")));
  const wc = world({ archive: { week9: { tasks: [], checked: { p2: "late" } } } });
  wc.api.mpSchWkStep(-1);
  ok("archive completions fill in (week-close snapshot)", /600m · <span style="color:#2563eb">Ben<\/span> ✓/.test(wc.api.mpSchWeekHTML("all")));
}
console.log("\n── read-only ──");
{
  const w = world();
  const before = JSON.stringify(w.live);
  w.api.mpSchWkStep(-1); w.api.mpSchWeekHTML("all"); w.api.mpSchWkDaySet("monday"); w.api.mpSchWeekHTML("mom");
  w.api.mpSchWkBack(); w.api.mpSchWkStep(1); w.api.mpSchWeekHTML("all"); w.api.mpSchBody();
  ok("no Firebase writes, no listeners", w.log.writes.length === 0);
  ok("live weekData / checked untouched", JSON.stringify(w.live) === before);
  ok("block never writes", !/\.set\(|\.update\(|\.remove\(|\.push\(|\.on\(|sv\(|setItem/.test(blk));
  ok("block never assigns weekData / checked / WK", !/\b(weekData|checked|WK)\s*=[^=]/.test(blk.replace(/c\.checked\s*=/g, "")));
  ok("no kid names hard-coded", !/lincoln|ellis|lucy|julian/i.test(blk));
  ok("no 🔀", blk.indexOf("🔀") < 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
