/*
 * Node tests for OFFDAYLOG — one _debug line the first time a card falls off today before 3 PM (her yes 2026-10-08).
 *
 * #3 (10/6): Ellis's Mathematical Reasoning and Reflex went to "didn't fit today" while he waited on Mom, and nothing
 * recorded why (_offDay is display-only). Now the lay writes ONE line per card per day per device, before 3 PM only,
 * with what it saw. Logging only — the lay must be identical with or without it.
 *
 *   run:  node test_offday_log.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(name) {
  const i = src.indexOf("function " + name);
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const HELPERS = slice("toMin") + "\n" + slice("fromMin");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
let ID = 0;
function card(who, time, dur, mom, title) {
  return { id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") };
}
function make(o) {
  const logs = [];
  const ctx = {
    console, ROSTER: ["julian", "lucy", "lincoln", "ellis"], db: null,
    checked: {}, momMoves: {},
    getActiveTasks: () => o.tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  if (o.withDbg) ctx.dbg = m => logs.push(m);
  ctx._mlNowOverride = o.nowMin; ctx._mlEndOverride = o.endMin; ctx._mlLunchOverride = false;
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop={cursor:0};", ctx);
  const lay = () => vm.runInContext("mlQueueLay(" + JSON.stringify(o.tasks) + ")", ctx);
  return { lay, logs, ctx };
}
const H = (h, m) => h * 60 + m;
const view = l => l.map(t => t.id + "@" + t.time + (t._offDay ? "!" : "")).join(" ");

console.log("── a card falls off before 3 PM → one line, with what the lay saw ──");
{
  const e1 = card("ellis", "10:00 AM", 60, "none", "Reading"), mr = card("ellis", "11:00 AM", 30, "none", "Mathematical Reasoning");
  const lm = card("lincoln", "10:00 AM", 30, "required", "Lincoln Mom lesson");
  const tasks = [e1, mr, lm];
  const r = make({ tasks, nowMin: H(10, 0), endMin: H(11, 15), withDbg: true });
  const l1 = r.lay();
  ok("the card is flagged didn't fit", !!l1.find(t => t.id === mr.id)._offDay);
  ok("exactly one _debug line", r.logs.length === 1, r.logs);
  const m = r.logs[0] || "";
  ok("names kid, card, id and where it landed", /ellis/.test(m) && /Mathematical Reasoning/.test(m) && m.includes("[" + mr.id + "]") && /laid 11:00 AM 30m/.test(m), m);
  ok("records the clock, the day end, the card in hand and the last check-off", /now 10:00 AM/.test(m) && /day ends 11:15 AM/.test(m) && /in hand "Reading"/.test(m) && /last ✓ none/.test(m), m);
  ok("records who Mom is on and the ring", /Mom on lincoln/.test(m) && /ring lincoln/.test(m) && /ellis's Mom cards none/.test(m), m);
  r.lay(); r.lay();
  ok("re-renders don't repeat it", r.logs.length === 1, r.logs.length);
  const quiet = make({ tasks, nowMin: H(10, 0), endMin: H(11, 15), withDbg: false });
  ok("logging only: the lay is identical without it", view(quiet.lay()) === view(l1), [view(quiet.lay()), view(l1)]);
}
console.log("\n── from 3 PM on, nothing is written ──");
{
  const e1 = card("ellis", "3:00 PM", 60, "none", "Reading"), mr = card("ellis", "4:00 PM", 30, "none", "Mathematical Reasoning");
  const r = make({ tasks: [e1, mr], nowMin: H(15, 0), endMin: H(16, 15), withDbg: true });
  const l = r.lay();
  ok("still flagged didn't fit", !!l.find(t => t.id === mr.id)._offDay);
  ok("no _debug line at 3:00 PM", r.logs.length === 0, r.logs);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
