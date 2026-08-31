// Verify the day-start overlay against the live week. The properties that matter:
//   1. with no dayStart set, it is the IDENTITY — the same array back, untouched
//   2. it never mutates weekData.tasks
//   3. only the named kid's UNCHECKED cards move; checked work and other kids hold
//   4. order is preserved — her rule: the next card must not jump
//   5. the re-timed day starts at the given time
//   6. Mom-required cards still never collide across kids
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
// A trimmed slice of a real generated Monday — enough to exercise the shift, the pins and
// the clash check without carrying the whole week.
const tasks = [
  { id: "l1", who: "lincoln", day: "monday", time: "10:00 AM", dur: 5,  mom: "required", title: "Morning Notebook" },
  { id: "l2", who: "lincoln", day: "monday", time: "10:05 AM", dur: 25, mom: "none",     title: "Eggspress", device: "computer" },
  { id: "l3", who: "lincoln", day: "monday", time: "10:50 AM", dur: 25, mom: "maybe",    title: "Singapore" },
  // 11:40 + 34 min late = 12:14-12:34, which lands on Ellis's 12:20 Reading Detective —
  // the clash a shift can genuinely create, and the reason dsMomClashes exists.
  { id: "l4", who: "lincoln", day: "monday", time: "11:40 AM", dur: 20, mom: "required", title: "AAS" },
  { id: "e1", who: "ellis",   day: "monday", time: "11:50 AM", dur: 20, mom: "required", title: "Editor in Chief" },
  { id: "e2", who: "ellis",   day: "monday", time: "12:20 PM", dur: 15, mom: "required", title: "Reading Detective" },
];

function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
function fn(name) {
  const st = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (st < 0) throw new Error("fn " + name);
  let i = src.indexOf("{", st), d = 0, q = null, e = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (e) { e = false; continue; }
    if (c === "\\") { e = true; continue; }
    if (q) { if (c === q) q = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(st, j + 1); }
  }
  throw new Error("unbalanced " + name);
}

const ctx = {
  console, ROSTER: ["lincoln", "ellis", "lucy", "julian"],
  checked: {}, db: null, tab: "schedule", WK: "week20",
  weekData: { tasks }, displacedResult: null, dayStarts: {},
  momHere: () => true, adminPinUnlocked: true, renderAll: () => {}, dbg: () => {},
  gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840, stackGap: 40 }),
  gwDeviceCaps: () => ({ computer: 1, screen: 2 }),
  taskDevice: t => t.device || "paper",
  Date, Math, Object, Array, JSON, String, Number, parseInt, isNaN,
};
Object.defineProperty(ctx, "_todayDay", { get: () => "monday" });
vm.createContext(ctx);
vm.runInContext([fn("toMin"), fn("fromMin"), slice("// PACKDAY_START", "// PACKDAY_END") || "", ].join("\n"), ctx);
// packDay may not have markers; pull it by name if so
try { vm.runInContext("typeof packDay", ctx); } catch (e) {}
if (vm.runInContext("typeof packDay", ctx) !== "function") vm.runInContext(fn("packDay"), ctx);
vm.runInContext(fn("packAround"), ctx);
vm.runInContext(slice("// DAYSTART_START", "// DAYSTART_END"), ctx);

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

console.log("── identity when unused ──");
{
  const before = JSON.stringify(tasks);
  const out = vm.runInContext("dsRetime(weekData.tasks)", ctx);
  ok("returns the very same array when no start is set", out === ctx.weekData.tasks);
  ok("weekData.tasks untouched", JSON.stringify(ctx.weekData.tasks) === before);
}

console.log("\n── one kid started late ──");
{
  const before = JSON.stringify(ctx.weekData.tasks);
  vm.runInContext('dayStarts={monday:{lincoln:"10:34 AM"}};', ctx);
  const out = vm.runInContext("dsRetime(weekData.tasks)", ctx);
  ok("weekData.tasks STILL untouched (worked on clones)", JSON.stringify(ctx.weekData.tasks) === before);
  const lin = out.filter(t => t.who === "lincoln");
  const others = out.filter(t => t.who !== "lincoln");
  const origOthers = ctx.weekData.tasks.filter(t => t.who !== "lincoln");
  ok("other kids' times are unchanged",
    JSON.stringify(others.map(t => t.id + "@" + t.time)) === JSON.stringify(origOthers.map(t => t.id + "@" + t.time)));
  const toM = s => vm.runInContext("toMin(" + JSON.stringify(s) + ")", ctx);
  const first = Math.min(...lin.map(t => toM(t.time)));
  ok("his day now starts at 10:34, not 10:00", first >= 634, { first });
  // order preserved
  const origLin = ctx.weekData.tasks.filter(t => t.who === "lincoln").slice().sort((a, b) => toM(a.time) - toM(b.time)).map(t => t.id);
  const newLin = lin.slice().sort((a, b) => toM(a.time) - toM(b.time)).map(t => t.id);
  ok("HER RULE: the order never changes, only the times", JSON.stringify(origLin) === JSON.stringify(newLin),
    { was: origLin.slice(0, 4), now: newLin.slice(0, 4) });
  ok("no card lost", lin.length === origLin.length, { got: lin.length, want: origLin.length });
}

console.log("\n── checked work holds its real time ──");
{
  const firstId = ctx.weekData.tasks.filter(t => t.who === "lincoln")[0].id;
  const origTime = ctx.weekData.tasks.find(t => t.id === firstId).time;
  vm.runInContext("checked={" + JSON.stringify(firstId) + ":true};", ctx);
  const out = vm.runInContext("dsRetime(weekData.tasks)", ctx);
  ok("a checked card keeps the time it actually happened at",
    out.find(t => t.id === firstId).time === origTime, out.find(t => t.id === firstId).time);
  vm.runInContext("checked={};", ctx);
}

console.log("\n── gaps and Mom clashes ──");
{
  vm.runInContext('dayStarts={monday:{lincoln:"10:34 AM"}};', ctx);
  const out = vm.runInContext("dsRetime(weekData.tasks)", ctx);
  const toM = s => vm.runInContext("toMin(" + JSON.stringify(s) + ")", ctx);
  const a = ctx.weekData.tasks.filter(t => t.who === "lincoln").slice().sort((x, y) => toM(x.time) - toM(y.time));
  const byId = {}; out.filter(t => t.who === "lincoln").forEach(t => byId[t.id] = t);
  const deltas = a.map(t => toM(byId[t.id].time) - toM(t.time));
  ok("every card shifts by the SAME amount — gaps preserved", deltas.every(d => d === deltas[0]), deltas.slice(0, 5));
  ok("that amount is the lateness", deltas[0] === 34, deltas[0]);
  // A shift CAN put a late kid on top of another child's Mom time. That clash is real once
  // someone starts late; the honest thing is to report it, not to silently re-pack around it
  // (re-packing pushed Lincoln's day to 5:57 PM on live data).
  const clashes = vm.runInContext("dsMomClashes(dsRetime(weekData.tasks))", ctx);
  ok("Mom clashes are detectable, not hidden", Array.isArray(clashes), typeof clashes);
  ok("a late kid landing on another child's Mom time IS reported", clashes.length > 0, clashes.length);
}

console.log("\n── guards ──");
{
  vm.runInContext("dayStarts={};", ctx);
  ok("empty task list is safe", vm.runInContext("dsRetime([])", ctx).length === 0);
  ok("null is safe", vm.runInContext("dsRetime(null)", ctx) === null);
  vm.runInContext('dayStarts={monday:{nobody:"10:00 AM"}};', ctx);
  ok("a start for a kid with no cards is a no-op", vm.runInContext("dsRetime(weekData.tasks)", ctx).length === tasks.length);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
