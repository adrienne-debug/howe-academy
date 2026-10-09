/*
 * Node tests — 🗓 MOMSCHED_TAB (her design 2026-10-08): Mom's Day ▸ 🏡 Today → 🏡 Home Base, ▸ 🗓 Calendar → 🗓 Schedule
 * with 📆 Today · 🗓 Week · 🗓 Month and who 👩 Mom (first) · All · each kid. Today reuses the Schedule tab's agendas.
 * Dad's Calendar is untouched. Display/navigation only — no Firebase writes.
 *   run:  node test_momsched_tab.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
const blk = src.slice(src.indexOf("// 🗓 MOMSCHED_TAB_START"), src.indexOf("// 🗓 MOMSCHED_TAB_END"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
function world(o) {
  o = o || {};
  const log = { ls: [], renders: 0, calls: [], writes: [] };
  const tasks = o.tasks || [
    { id: "a1", who: "ava", day: "thursday", time: "9:00 AM", title: "Math", mom: "required" },
    { id: "a2", who: "ava", day: "thursday", time: "10:00 AM", title: "Reading" },
    { id: "a3", who: "ava", day: "thursday", time: "12:00 PM", title: "Lunch" },
    { id: "a1_c", who: "ava", day: "thursday", time: "9:00 AM", title: "Math", mom: "required" },
    { id: "b1", who: "ben", day: "thursday", time: "9:30 AM", title: "Spelling", mom: "maybe" },
    { id: "b2", who: "ben", day: "friday", time: "9:00 AM", title: "Science", mom: "required" },
    { id: "b3", who: "ben", day: "monday", time: "9:00 AM", title: "Art" },
  ];
  const env = {
    ROSTER: ["ava", "ben"], KID_NAME: { ava: "Ava", ben: "Ben" }, SL_KCOL: { ava: "#e11d48", ben: "#2563eb" }, DAYS_ALL: DAYS,
    HA_LS: { getItem: k => (o.ls || {})[k] || null, setItem: (k, v) => log.ls.push([k, v]) },
    document: { getElementById: () => ({}) }, renderMomsPlan: () => log.renders++,
    mdTodayName: () => o.today || "thursday", getActiveTasks: () => tasks,
    mlQueueLay: ts => { log.calls.push("live"); return ts; }, dsDoneAtTime: ts => ts,
    effectiveDay: t => t.day, checked: o.checked || {}, famMomView: x => x, famIsMomCard: () => false,
    momAgendaHtml: ts => { log.calls.push(["mom", api_state(), ts.map(t => t.id).join()]); return "MOMAG"; },
    allAgendaHtml: (ts, only) => { log.calls.push(["all", api_state(), ts.map(t => t.id).join(), only || null]); return "ALLAG"; },
    calRenderMonthPreview: opts => "MONTH" + (opts ? ":" + opts.who : ""), calRenderEventForm: () => "FORM",
    kcEmoji: () => "⭐", cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s),
    toMin: t => { const m = /(\d+):(\d+) (AM|PM)/.exec(t || ""); if (!m) return null; let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; },
    fromMin: m => m + "m", taskTitleShow: t => t.title,
    db: { ref: p => ({ set: v => log.writes.push(p), update: v => log.writes.push(p) }) },
    momSchedView: false, tab: "moms-plan", showTab: t => log.calls.push("showTab:" + t), msvEnter: () => log.calls.push("msvEnter"),
  };
  let api_state = () => null;
  const keys = Object.keys(env);
  const body = "let kid='all', day='monday', calDaySel=null, calAddMode=null;\n" + blk +
    "\nreturn {mpSchModeGet,mpSchSet,mpSchWhoSet,mpSchDayNow,mpSchDaySet,mpSchDayStep,mpSchTasks,mpSchAgendaHTML,mpSchWeekHTML,mpSchBody,st:()=>({mode:mpSchMode,who:mpSchWho,day:mpSchDay,kid,gday:day})};";
  const api = new Function(...keys, body)(...keys.map(k => env[k]));
  api_state = () => { const s = api.st(); return s.kid + "/" + s.gday; };
  return { api, log };
}
console.log("── tab names ──");
ok("Mom's Day tabs read 🏡 Home Base and 🗓 Schedule", src.indexOf("${btn('plan','🏡 Home Base')}${btn('cal','🗓 Schedule')}") >= 0 && src.indexOf("btn('plan','🏡 Today')") < 0);
console.log("\n── who + mode ──");
{
  const w = world();
  ok("defaults: 📆 Today, 👩 Mom", w.api.mpSchModeGet() === "today" && w.api.st().who === "mom");
  w.api.mpSchSet("week"); ok("Week remembered on this device", w.api.mpSchModeGet() === "week" && JSON.stringify(w.log.ls) === '[["ha_mp_schmode","week"]]');
  w.api.mpSchWhoSet("ben"); ok("pick a kid", w.api.st().who === "ben");
  w.api.mpSchWhoSet("zzz"); ok("unknown → Mom", w.api.st().who === "mom");
  const w2 = world({ ls: { ha_mp_schmode: "month" } }); ok("remembered Month comes back", w2.api.mpSchModeGet() === "month");
  const body = world().api.mpSchBody();
  ok("toggles in order: 👩 Mom first, then All, then each kid", body.indexOf("mpSchWhoSet('mom')") < body.indexOf("mpSchWhoSet('all')") && body.indexOf("mpSchWhoSet('all')") < body.indexOf("mpSchWhoSet('ava')") && body.indexOf("mpSchWhoSet('ava')") < body.indexOf("mpSchWhoSet('ben')"));
  ok("Today · Week · Month buttons", /mpSchSet\('today'\)/.test(body) && /mpSchSet\('week'\)/.test(body) && /mpSchSet\('month'\)/.test(body));
}
console.log("\n── Today = the Schedule tab's agendas ──");
{
  const w = world();
  ok("Mom: required + maybe, today only, no _c copy, no lunch", w.api.mpSchTasks("mom", "thursday").map(t => t.id).join() === "a1,b1");
  ok("All: every kid's cards that day", w.api.mpSchTasks("all", "thursday").map(t => t.id).join() === "a1,a2,b1");
  ok("one kid", w.api.mpSchTasks("ben", "thursday").map(t => t.id).join() === "b1");
  ok("today uses the live lay; other days don't", (() => { const x = world(); x.api.mpSchTasks("all", "thursday"); const a = x.log.calls.length; x.api.mpSchTasks("all", "friday"); return a === 1 && x.log.calls.length === 1; })());
  w.log.calls.length = 0;
  w.api.mpSchAgendaHTML("mom", "thursday");
  ok("Mom → momAgendaHtml with kid/day pinned to mom/thursday", JSON.stringify(w.log.calls.filter(c => Array.isArray(c))[0]) === JSON.stringify(["mom", "mom/thursday", "a1,b1"]));
  ok("…and kid/day handed back", w.api.st().kid === "all" && w.api.st().gday === "monday");
  w.log.calls.length = 0; w.api.mpSchAgendaHTML("all", "thursday");
  ok("All → allAgendaHtml, every kid's column", JSON.stringify(w.log.calls.filter(c => Array.isArray(c))[0]) === JSON.stringify(["all", "all/thursday", "a1,a2,b1", null]));
  w.log.calls.length = 0; w.api.mpSchAgendaHTML("ben", "thursday");
  ok("a kid → allAgendaHtml with just their column", JSON.stringify(w.log.calls.filter(c => Array.isArray(c))[0]) === JSON.stringify(["all", "ben/thursday", "b1", ["ben"]]));
}
{
  const w = world();
  w.api.mpSchDayStep(1); ok("› steps to Friday", w.api.mpSchDayNow() === "friday" && w.api.st().mode === "today");
  w.api.mpSchDayStep(-1); ok("‹ back to today clears the pick", w.api.mpSchDayNow() === "thursday" && w.api.st().day === null);
  const w2 = world({ today: "sunday" }); w2.api.mpSchDayStep(1); ok("can't step past Sunday", w2.api.mpSchDayNow() === "sunday");
}
console.log("\n── Week ──");
{
  const w = world();
  const h = w.api.mpSchWeekHTML("all");
  ok("Mon–Fri columns (no weekend when empty)", (h.match(/<div onclick="mpSchDaySet\('(\w+)'\)" style="cursor:pointer;text-align/g) || []).length === 5 && !/saturday/.test(h));
  ok("cards land on their day; lunch + carry copies left out", /Art/.test(h) && /Science/.test(h) && !/Lunch/.test(h) && (h.match(/>Math</g) || []).length === 1);
  ok("tap a day → Today on that day", (() => { w.api.mpSchDaySet("monday"); return w.api.st().mode === "today" && w.api.mpSchDayNow() === "monday"; })());
  const hm = world().api.mpSchWeekHTML("mom");
  ok("Mom week shows 🔴 Mom Needed / 🟡 May Need Mom marks", /🔴 Math/.test(hm) && /🟡 Spelling/.test(hm) && !/Reading/.test(hm));
  const sat = world({ tasks: [{ id: "s1", who: "ava", day: "saturday", time: "9:00 AM", title: "Chores" }] }).api.mpSchWeekHTML("all");
  ok("Saturday shows up only when it has cards", /mpSchDaySet\('saturday'\)/.test(sat));
}
console.log("\n── Month + Dad ──");
{
  const w = world({ ls: { ha_mp_schmode: "month" } });
  ok("Month = the calendar (family)", /MONTH(?!:)/.test(w.api.mpSchBody()));
  w.api.mpSchWhoSet("ava"); ok("Month for one kid", /MONTH:ava/.test(w.api.mpSchBody()));
  ok("Dad's Calendar still draws _calPageBody (unchanged)", /_calPageBody\(\)/.test(slice("renderDadCalendar")) && /mpCalSet\(/.test(slice("_calPageBody")));
  ok("Mom's Day ▸ Schedule draws the new body", /mpSchBody\(\)/.test(slice("renderMPCalendar")) && !/_calPageBody/.test(slice("renderMPCalendar")));
}
console.log("\n── display only ──");
{
  const w = world(); w.api.mpSchBody(); w.api.mpSchWeekHTML("all"); w.api.mpSchSet("week"); w.api.mpSchWhoSet("ben");
  ok("no Firebase writes", w.log.writes.length === 0);
  ok("block has no db calls", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(blk));
  ok("no kid names hard-coded", !/lincoln|ellis|lucy|julian|taylor|caleb|zuri|david/i.test(blk));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
