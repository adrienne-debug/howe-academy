/*
 * 🎉 The day is done when the kid's TIMELINE is done (her report 2026-09-24): on a co-op day Ellis
 * started at 3:39 PM, most cards fell to "didn't fit today" (past the 4:15 school end, hidden from
 * kids), he finished everything on his screen — and got no celebration, because rtSchoolworkDone
 * counted the hidden cards. It now counts today's rendered lay and leaves out open `_offDay` cards.
 *   run:  node test_day_done_timeline.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const blk = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const fn = n => { const i = src.indexOf("function " + n + "("); return src.slice(i, src.indexOf("\n}", i) + 2); };
const one = n => { const i = src.indexOf("function " + n + "("); return src.slice(i, src.indexOf("\n", i)); };
const i0 = src.indexOf("let _rtSwLay=null"), i1 = src.indexOf("\n", src.indexOf("function rtSchoolworkDone("));
const CODE = [fn("toMin"), fn("fromMin"), one("fxIsClass"), one("coopsMap"), one("_coopHasDate"), fn("coopTimedEndMin"),
  blk("// MOMLOOP_START", "// MOMLOOP_END"), blk("// DAYSTART_START", "// DAYSTART_END"), src.slice(i0, i1 + 1)].join("\n");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const toM = s => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(s); return ((+m[1] % 12) + (m[3] === "PM" ? 12 : 0)) * 60 + (+m[2]); };
// Ellis's co-op Thursday, shape of the live week24 cards
const C = (id, time, dur, title, sk, mom) => ({ id, who: "ellis", day: "thursday", time, dur, title, subjectKey: sk || id, mom: mom || "none" });
const TASKS = [
  C("mn", "2:00 PM", 5, "📖 Morning Notebook — Morning Notebook", "morning_nb"),
  C("sprint", "2:05 PM", 2, "🏃 Sprint", "retrieval"),
  C("drill", "2:20 PM", 18, "🃏 Daily Drill", "retrieval", "required"),
  C("dim", "2:23 PM", 25, "📖 Dimensions Math Textbook 4A"),
  C("hwt", "2:48 PM", 10, "📄 HWT Printing Power"),
  C("read", "2:58 PM", 15, "📖 Independent Reading"),
  C("reflex", "3:20 PM", 15, "💻 Reflex Math"),
  C("close", "3:37 PM", 5, "📖 Closing Notebook — Closing Notebook", "closing_nb"),
];
function world(clock, checked, starts) {
  const ctx = { console, db: null, ROSTER: ["ellis"], checked: checked || {}, claimed: {}, momMoves: {},
    dayStarts: { thursday: starts || { ellis: "3:39 PM" } }, rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM", lunchStart: "1:00 PM", lunchEnd: "2:00 PM" } },
    currData: { subjects: { ellis: {} } }, calendarData: { coops: {} }, DAY_DT: { thursday: "September 24" }, routineDateISO: () => "2026-09-24",
    effectiveDay: t => t.day, morningComplete: () => true, bbActive: () => null, momHere: () => false, adminPinUnlocked: false, renderAll: () => {},
    cap: s => s, esc: s => s, dbg: () => {}, weekData: { tasks: TASKS }, Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp };
  ctx._mlNowOverride = toM(clock);
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  ctx.getActiveTasks = () => vm.runInContext("dsRetime(weekData.tasks)", ctx);
  return q => vm.runInContext(q, ctx);
}
console.log("── the live case: a 3:39 PM start, 4:15 end ──");
{
  const q = world("3:40 PM", {});
  ok("before anything is done → not done", q("rtSchoolworkDone('ellis','thursday')") === false);
}
{
  const q = world("3:50 PM", { mn: "03:49 PM Sep 24" });
  ok("notebook done, Sprint + Closing still on his day → not done", q("rtSchoolworkDone('ellis','thursday')") === false);
}
{
  const q = world("3:59 PM", { mn: "03:49 PM Sep 24", sprint: "03:58 PM Sep 24", close: "03:58 PM Sep 24" });
  ok("everything on his day done → DONE (the hidden didn't-fit cards don't count)", q("rtSchoolworkDone('ellis','thursday')") === true);
}
console.log("\n── a normal day is unchanged ──");
{
  const q = world("11:00 AM", { mn: "10:05 AM Sep 24", sprint: "10:10 AM Sep 24", close: "10:40 AM Sep 24" }, { ellis: "10:00 AM" });
  ok("a 10 AM start: all his work fits, so open cards still hold the day open", q("rtSchoolworkDone('ellis','thursday')") === false);
}
{
  const all = {}; TASKS.forEach(t => { all[t.id] = "11:00 AM Sep 24"; });
  const q = world("11:30 AM", all, { ellis: "10:00 AM" });
  ok("…and everything checked → done", q("rtSchoolworkDone('ellis','thursday')") === true);
}
console.log("\n── 📓 the Morning Notebook comes first when the day starts (live 9/24: Lincoln) ──");
{
  // Lincoln's stored Thursday: an overnight-carried Eggspress at 2:00 ahead of the notebook at 2:25; he started at 3:34
  const L = (id, time, dur, title, sk) => ({ id, who: "lincoln", day: "thursday", time, dur, title, subjectKey: sk || id, mom: "none" });
  const TL = [L("egg", "2:00 PM", 25, "💻 Eggspress Map-Lesson — Map38 L187", "eggspress_l"), L("nb", "2:25 PM", 5, "📖 Morning Notebook — Morning Notebook", "morning_nb"),
    L("ger", "2:30 PM", 25, "💻 German Flash Cards"), L("cl", "4:00 PM", 5, "📖 Closing Notebook — Closing Notebook", "closing_nb")];
  const ctx = { console, checked: {}, dayStarts: { thursday: { lincoln: "3:34 PM" } }, rulesData: { schoolDay: { defaultStart: "10:00 AM" } }, currData: { subjects: { lincoln: {} } }, Object, Array, String, Math, JSON };
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx); vm.runInContext([fn("toMin"), fn("fromMin"), one("fxIsClass"), blk("// DAYSTART_START", "// DAYSTART_END")].join("\n"), ctx);
  vm.runInContext("dayStarts={thursday:{lincoln:'3:34 PM'}};", ctx);
  ctx.__t = TL; const out = vm.runInContext("dsRetime(__t)", ctx); const tm = id => out.find(t => t.id === id).time;
  ok("the notebook takes the first slot (3:34)", tm("nb") === "3:34 PM", tm("nb"));
  ok("the card that was ahead of it slides behind by the notebook's 5 min, order kept", tm("egg") === "3:39 PM", tm("egg"));
  ok("cards after the notebook just shift with the start", tm("ger") === "4:04 PM" && tm("cl") === "5:34 PM", [tm("ger"), tm("cl")]);
  ok("stored cards are untouched (view only)", TL[0].time === "2:00 PM" && TL[1].time === "2:25 PM");
  ctx.__t = [L("nb2", "2:00 PM", 5, "📖 Morning Notebook — Morning Notebook", "morning_nb"), L("x", "2:05 PM", 20, "x")];
  const o2 = vm.runInContext("dsRetime(__t)", ctx);
  ok("a notebook already first: a plain shift, as before", o2[0].time === "3:34 PM" && o2[1].time === "3:39 PM");
}
console.log("\n── the wiring ──");
ok("today uses the rendered lay; open didn't-fit cards are left out", /const _lay=\(d===_todayDay\)\?_rtSwTodayLay\(\):null;/.test(src) && /!\(t\._offDay&&!checked\[t\.id\]\)\);/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
