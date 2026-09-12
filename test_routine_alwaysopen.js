/*
 * Node tests — 🗓 "Afternoon always open on <days>" (her ask 2026-09-12, after Saturday chores
 * sat locked at 11:41 AM because the afternoon list gates on schoolwork-done or 4:00 PM, and
 * Saturday is not a school day).
 *
 * Ships ACTIVE for Saturday and Sunday: the default lives in code, so it works on the next
 * reload with nothing to tap. An explicit empty list means "none" and must be honoured.
 *
 *   run:  node test_routine_alwaysopen.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
let pass = 0, fail = 0;
function ok(n, c, e) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (e !== undefined ? "  (" + JSON.stringify(e) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

const CODE = ["rtAfternoonHour", "rtAlwaysOpenDays", "rtAlwaysOpen", "rtSetAlwaysOpenDay", "rtEveningHour", "rtFmtHour", "rtSchoolworkDone", "rtAvailable", "chSettingsEveningHourHTML"].map(braceSlice).join("\n");
function env(o) {
  o = o || {};
  const writes = [];
  const e = { console, Object, Array, String, Number, Math, parseInt, isNaN, Date: o.Date || Date, JSON, writes,
    routineTimes: o.routineTimes === undefined ? {} : o.routineTimes,
    _todayDay: o.today || "saturday", checked: o.checked || {},
    getActiveTasks: () => o.tasks || [], effectiveDay: t => t.day,
    momHere: () => o.momHere !== false, renderAll: () => {}, rtSetEveningHour: () => {},
    db: { ref: p => ({ set: v => writes.push([p, JSON.parse(JSON.stringify(v))]) }) } };
  vm.createContext(e); new vm.Script(CODE).runInContext(e); return e;
}
// a clock fixed at 11:41 AM — the time she actually hit this
const At = h => class extends Date { getHours() { return h; } };

console.log("── the default ships active for today and tomorrow ──");
{
  const e = env({ routineTimes: {} });
  ok("unset → Saturday and Sunday", eq(e.rtAlwaysOpenDays(), ["saturday", "sunday"]), e.rtAlwaysOpenDays());
  ok("Saturday is an always-open day", e.rtAlwaysOpen("saturday") === true);
  ok("Sunday is too", e.rtAlwaysOpen("sunday") === true);
  ok("a school day is NOT", e.rtAlwaysOpen("monday") === false && e.rtAlwaysOpen("wednesday") === false);
  ok("null config behaves as unset", eq(env({ routineTimes: null }).rtAlwaysOpenDays(), ["saturday", "sunday"]));
}
console.log("\n── the gate: 11:41 AM Saturday, schoolwork NOT done ──");
{
  const tasks = [{ id: "t1", who: "lincoln", day: "saturday", title: "MR5 pp.280" }];
  const e = env({ today: "saturday", tasks, checked: {}, Date: At(11) });
  ok("BEFORE this change it would have been locked (no schoolwork, 11 < 16)", e.rtSchoolworkDone("lincoln", "saturday") === false && 11 < e.rtAfternoonHour());
  ok("afternoon is OPEN anyway, because Saturday is always-open", e.rtAvailable("afternoon", "lincoln", "saturday") === true);
  ok("evening is untouched — still waits for its hour", e.rtAvailable("evening", "lincoln", "saturday") === false);
  ok("the third slot stays always open", e.rtAvailable("chores", "lincoln", "saturday") === true);
}
console.log("\n── a school day is unchanged ──");
{
  const tasks = [{ id: "t1", who: "lincoln", day: "monday", title: "MR5" }];
  const e = env({ today: "monday", tasks, checked: {}, Date: At(11) });
  ok("Monday 11 AM with schoolwork left → still LOCKED", e.rtAvailable("afternoon", "lincoln", "monday") === false);
  const d = env({ today: "monday", tasks, checked: { t1: "x" }, Date: At(11) });
  ok("— and still opens when the schoolwork is done", d.rtAvailable("afternoon", "lincoln", "monday") === true);
  const l = env({ today: "monday", tasks, checked: {}, Date: At(17) });
  ok("— and still opens at the afternoon hour", l.rtAvailable("afternoon", "lincoln", "monday") === true);
}
console.log("\n── turning it off is honoured ──");
{
  const e = env({ routineTimes: { alwaysOpenDays: [] }, today: "saturday", tasks: [{ id: "t1", who: "k", day: "saturday", title: "x" }], Date: At(11) });
  ok("an explicit empty list means NONE — not 'fall back to the default'", eq(e.rtAlwaysOpenDays(), []) && e.rtAvailable("afternoon", "k", "saturday") === false);
  const s = env({ routineTimes: { alwaysOpenDays: ["sunday"] }, today: "saturday", tasks: [{ id: "t1", who: "k", day: "saturday", title: "x" }], Date: At(11) });
  ok("Sunday only → Saturday is locked again", s.rtAvailable("afternoon", "k", "saturday") === false);
}
console.log("\n── the setting writes one targeted value ──");
{
  const e = env({ routineTimes: { afternoonHour: 16 } });
  e.rtSetAlwaysOpenDay("monday");
  ok("toggling ON adds the day", eq(e.writes[0][1].alwaysOpenDays, ["saturday", "sunday", "monday"]), e.writes[0][1]);
  ok("— to config/routineTimes, and the hour it already held is preserved", e.writes[0][0] === "config/routineTimes" && e.writes[0][1].afternoonHour === 16);
  e.writes.length = 0; e.rtSetAlwaysOpenDay("saturday");
  ok("toggling OFF removes it", e.writes[0][1].alwaysOpenDays.indexOf("saturday") < 0, e.writes[0][1].alwaysOpenDays);
  const locked = env({ momHere: false });
  locked.rtSetAlwaysOpenDay("monday");
  ok("Mom-gated: no write when she is not in Mom mode", locked.writes.length === 0);
}
console.log("\n── the control renders ──");
{
  const e = env({ routineTimes: {} });
  const h = e.chSettingsEveningHourHTML();
  ok("a day-pill row appears under the hour pickers", /Afternoon always open on/.test(h));
  ok("all seven days are offered", ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].every(d => h.indexOf("rtSetAlwaysOpenDay('" + d + "')") >= 0));
  const satSel = h.slice(h.indexOf("rtSetAlwaysOpenDay('saturday')"), h.indexOf("rtSetAlwaysOpenDay('saturday')") + 200);
  ok("Saturday shows as selected out of the box", /background:var\(--header\)/.test(satSel), satSel.slice(0, 120));
  const monSel = h.slice(h.indexOf("rtSetAlwaysOpenDay('monday')"), h.indexOf("rtSetAlwaysOpenDay('monday')") + 200);
  ok("Monday does not", !/background:var\(--header\)/.test(monSel));
  ok("the existing hour pickers are still there", /Afternoon opens at/.test(h) && /Evening starts at/.test(h));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
