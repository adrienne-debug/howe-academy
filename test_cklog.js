/*
 * 🧾 Today's check-offs with −100 (her ask 2026-09-23, "on the dad build too" 9/24): one card on Mom's Plan and
 * Dad's Day listing everything every kid checked off today (school cards + chore steps), grouped by kid, newest
 * first, each line with the routine Log's −100 dock (bankDirect −100 + a 🚩 mark so it can't be docked twice).
 *   run:  node test_cklog.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// CKLOG_START"), b = src.indexOf("// CKLOG_END");
if (a < 0 || b < 0) { console.error("CKLOG markers not found"); process.exit(1); }
const fn = n => { const i = src.indexOf("function " + n + "("); return src.slice(i, src.indexOf("\n}", i) + 2); };
const BLOCK = [fn("_parseCheckTs"), src.slice(a, b)].join("\n");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const now = new Date(); const MD = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });   // e.g. "Sep 24"
function world(o) {
  o = o || {};
  const writes = [], banks = [], confirms = [];
  const ctx = {
    console, WK: "week24", activeWk: () => "week24", _todayDay: "thursday", ROSTER: ["julian", "lucy", "lincoln", "ellis"], PACE_KCOL: {},
    weekData: { tasks: o.tasks || [] }, checked: o.checked || {}, histState: o.hist || {}, routineLog: o.rlog || {},
    effectiveDay: t => t.day, momHere: () => o.who === "mom", _kioskD: () => o.who === "dad",
    bankDirect: (k, p, n) => { banks.push([k, p, n]); return "bd1"; }, confirm: m => { confirms.push(m); return o.say !== false; },
    cap: s => s.charAt(0).toUpperCase() + s.slice(1), esc: s => String(s), nowTs: () => "3:00 PM " + MD, dbg: () => {}, renderAll: () => {},
    ld: () => ({}), sv: () => {}, _dryRun: () => false, db: { ref: p => ({ update: v => writes.push([p, v]) }) },
    Object, Array, String, Number, Math, Date, JSON, RegExp,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, writes, banks, confirms, call: e => vm.runInContext(e, ctx) };
}
const T = [{ id: "dm", who: "lucy", day: "thursday", title: "📄 Dimensions Math 1A — Ch4-3" }, { id: "rd", who: "ellis", day: "thursday", title: "📄 Reading Detective — Ex. 45" }, { id: "old", who: "ellis", day: "wednesday", title: "yesterday" }];
const CK = { dm: "02:48 PM " + MD, rd: "10:14 AM " + MD, old: "10:00 AM Sep 1" };
const RL = { lucy: { week24: { thursday: { k1: { label: "🛏 Bed", act: "on", ts: "9:02 AM " + MD, at: 100, pts: 5 }, k2: { label: "Teeth", act: "off", ts: "9:03 AM " + MD, at: 101 } } } } };

console.log("── the list ──");
{
  const w = world({ who: "mom", tasks: T, checked: CK, rlog: RL });
  const L = w.call("ckLogToday()");
  ok("today's school cards + chore steps, not yesterday's, not un-checks", L.length === 3 && !L.some(i => i.ref === "old") && !L.some(i => i.label === "Teeth"), L.map(i => i.label));
  ok("newest first", L[0].label.indexOf("Dimensions") >= 0, L.map(i => i.ts));
  ok("a chore line carries its stars and a step ref; a card line its id", L.find(i => i.kind === "step").pts === 5 && L.find(i => i.kind === "step").ref === "week24/thursday/k1" && L.find(i => i.ref === "dm").kind === "task");
  const html = w.call("mdCardCheckLog()");
  ok("the card shows the count and is collapsed", /Today’s check-offs · 3/.test(html) && !/−100<\/button>/.test(html));
  w.call("ckLogToggle()");
  const open = w.call("mdCardCheckLog()");
  ok("open: grouped by kid with a −100 on every line", (open.match(/−100<\/button>/g) || []).length === 3 && /Lucy/.test(open) && /Ellis/.test(open));
}
{
  const w = world({ who: "mom", tasks: [], checked: {}, rlog: {} });
  ok("nothing checked yet → no card", w.call("mdCardCheckLog()") === "");
}
console.log("\n── the dock ──");
{
  const w = world({ who: "mom", tasks: T, checked: CK, rlog: RL, hist: { dm: { title: "x" } } });
  w.call("ckLogDock('task','lucy','dm','Dimensions Math 1A — Ch4-3')");
  ok("school card: −100 banked with the reason, 🚩 mark on its history entry, card stays checked", w.banks.length === 1 && w.banks[0][1] === -100 && /false check-off dock — Dimensions/.test(w.banks[0][2]) && w.writes.some(x => x[0] === "week24/history/dm" && x[1].flagged && x[1].penalty === -100 && x[1].flagBy === "mom") && w.ctx.checked.dm, w.writes);
  w.call("ckLogDock('task','lucy','dm','Dimensions')");
  ok("…can't be docked twice", w.banks.length === 1);
  w.call("ckLogDock('step','lucy','week24/thursday/k1','Bed')");
  ok("chore step: the routine Log's own dock (same record, same mark)", w.banks.length === 2 && w.writes.some(x => x[0] === "routineLog/lucy/week24/thursday/k1" && x[1].flagged && x[1].penalty === -100));
  w.call("ckLogToggle()");
  const open = w.call("mdCardCheckLog()");
  ok("docked lines show 🚩 −100 instead of the button; header counts them", (open.match(/🚩 −100/g) || []).length === 2 && /🚩 2 docked/.test(open) && (open.match(/−100<\/button>/g) || []).length === 1);
}
{
  const w = world({ who: "mom", tasks: T, checked: CK, hist: { dm: {} }, say: false });
  w.call("ckLogDock('task','lucy','dm','Dimensions')");
  ok("Cancel on the confirm → nothing happens", w.banks.length === 0 && w.writes.length === 0);
}
{
  const w = world({ who: "dad", tasks: T, checked: CK, rlog: RL, hist: { dm: {} } });
  ok("Dad's link sees the card", w.call("mdCardCheckLog()") !== "");
  w.call("ckLogDock('task','lucy','dm','Dimensions')");
  ok("Dad can dock, and the mark says so", w.banks.length === 1 && w.writes[0][1].flagBy === "dad");
}
{
  const w = world({ who: "kid", tasks: T, checked: CK, rlog: RL, hist: { dm: {} } });
  ok("a kid's view: no card, no dock", w.call("mdCardCheckLog()") === "" && (w.call("ckLogDock('task','lucy','dm','x')"), w.banks.length === 0));
}
console.log("\n── the wiring ──");
ok("Mom's Plan and Dad's Day both render it under Kids today", (src.match(/try\{ h\+=mdCardCheckLog\(\); \}catch\(e\)\{\}/g) || []).length === 2);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
