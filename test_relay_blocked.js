/*
 * Node tests — 🏫 the re-lay diff never lands a card on a day the subject is blocked (her "yes" 2026-09-14).
 * Live shape it reproduces: Lincoln's AAS, every day allowed, re-laid on Monday night → lesson 18 went to
 * Tuesday's co-op at 4:43 PM. The generator skips the co-op day; the diff's own landings must too.
 *   run:  node test_relay_blocked.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// REPROJ_START"), b = src.indexOf("// REPROJ_END"); if (a < 0 || b < 0) { console.error("REPROJ markers"); process.exit(1); }
const block = src.slice(a, b);
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = +m[1] % 12; if (/PM/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = m => { const h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return hh + ":" + String(mm).padStart(2, "0") + " " + ap; };
const packAround = (fixed, news, ctx) => { const cur = {}; fixed.forEach(t => { cur[t.who] = Math.max(cur[t.who] || ctx.start, toMin(t.time) + (t.dur || 20)); }); news.forEach(t => { const c = Math.max(cur[t.who] || ctx.start, ctx.start); t.time = fromMin(c); cur[t.who] = c + (t.dur || 20); }); return []; };
const dayCtx = () => ({ start: 600, end: 975, lunchStart: 780, lunchEnd: 840 });
function mkEnv() { const env = { console, JSON, Object, Array, String, Number, Math, parseInt, Date, RegExp }; vm.createContext(env); new vm.Script(block).runInContext(env); return env; }
const T = (id, day, time, title, extra) => Object.assign({ id, who: "lincoln", subjectKey: "aas", day, time, dur: 20, title, lid: id.split("_").pop() }, extra || {});
const O = (id, who, day, time) => ({ id, who, subjectKey: "other", day, time, dur: 20, title: "other" });
const L16 = "lincoln_lincoln__aas_L0016", L17 = "lincoln_lincoln__aas_L0017", L18 = "lincoln_lincoln__aas_L0018";
const kidWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"].map(d => O("o_" + d, "lincoln", d, "9:00 AM"));
const OPTS = o => Object.assign({ todayDay: "monday", nowMin: 23 * 60, checked: {}, claimed: {}, dayCtx, packAround, toMin, fromMin, dayCap: 2, allowedDays: [], lidOrder: ["L0016", "L0017", "L0018"] }, o || {});
const clone = a => a.map(t => Object.assign({}, t));
const dayOf = (r, id) => (r.tasksAfter.find(t => t.id === id) || {}).day || null;

console.log("── a push to the next school day skips a blocked day ──");
{
  // Monday 11 PM: the generator wants a THIRD sitting on Monday (extra on today, no freed slot) →
  // pushed to the next school day. Tuesday is the co-op.
  const live = kidWeek.concat([T(L16, "monday", "12:10 PM", "AAS L2-16")]);
  const want = [T(L16, "monday", "12:10 PM", "AAS L2-16"), T(L17, "thursday", "10:00 AM", "AAS L2-17"), T(L18, "monday", "3:00 PM", "AAS L2-18")];
  const e0 = mkEnv(); const r0 = e0._reprojectPlan("lincoln", "aas", clone(live), want, OPTS());
  ok("control (no blocked days): the pushed sitting lands on Tuesday — tonight's bug", dayOf(r0, L18) === "tuesday", dayOf(r0, L18));
  const e = mkEnv(); const r = e._reprojectPlan("lincoln", "aas", clone(live), want, OPTS({ blockedDays: ["tuesday"] }));
  ok("with Tuesday blocked: it lands on Wednesday instead", dayOf(r, L18) === "wednesday", dayOf(r, L18));
  ok("nothing on Tuesday", !r.tasksAfter.some(t => t.subjectKey === "aas" && t.day === "tuesday"));
  ok("the two open lessons land in order on non-blocked days (the pattern re-lay keeps book order)", (() => { const d17 = dayOf(r, L17), d18 = dayOf(r, L18); const ix = d => ["monday", "tuesday", "wednesday", "thursday", "friday"].indexOf(d); return d17 !== "tuesday" && d18 !== "tuesday" && ix(d17) <= ix(d18); /* cap 2: both may share Wednesday */ })(), [dayOf(r, L17), dayOf(r, L18)]);
  ok("it is still counted as pushed", r.summary.pushed.indexOf(L18) >= 0, r.summary.pushed);
}

console.log("\n── the whole-pattern re-lay never uses a blocked day ──");
{
  // a carried card (Monday's, swept to Tuesday by the overnight cascade) triggers the whole-pattern
  // re-lay; Tuesday is the co-op and must not be a pattern day for it
  const live = kidWeek.concat([T(L16, "tuesday", "1:00 PM", "AAS L2-16", { cascadedFrom: "monday" }), T(L17, "thursday", "10:00 AM", "AAS L2-17")]);
  const want = [T(L16, "wednesday", "10:00 AM", "AAS L2-16"), T(L17, "thursday", "10:00 AM", "AAS L2-17"), T(L18, "friday", "10:00 AM", "AAS L2-18")];
  const e0 = mkEnv(); const r0 = e0._reprojectPlan("lincoln", "aas", clone(live), want, OPTS({ todayDay: "tuesday", nowMin: 9 * 60 }));
  ok("control: with every day allowed the carried card may stay on Tuesday", r0.tasksAfter.some(t => t.subjectKey === "aas" && t.day === "tuesday"));
  const e = mkEnv(); const r = e._reprojectPlan("lincoln", "aas", clone(live), want, OPTS({ todayDay: "tuesday", nowMin: 9 * 60, blockedDays: ["tuesday"] }));
  ok("blocked: no AAS card sits on Tuesday afterwards", !r.tasksAfter.some(t => t.subjectKey === "aas" && t.day === "tuesday"), r.tasksAfter.filter(t => t.subjectKey === "aas").map(t => t.day + ":" + t.lid));
  ok("all three lessons still in the week, in order, on other days", (() => { const c = r.tasksAfter.filter(t => t.subjectKey === "aas").sort((x, y) => x.lid < y.lid ? -1 : 1); return c.length === 3 && c.every(t => t.day !== "tuesday"); })(), r.tasksAfter.filter(t => t.subjectKey === "aas").map(t => t.day + ":" + t.lid));
  ok("nothing dropped", r.tasksAfter.filter(t => t.subjectKey === "aas").length === 3);
}
{
  // a locked card on a blocked day stays (records never move)
  const live = kidWeek.concat([T(L16, "tuesday", "10:00 AM", "AAS L2-16")]);
  const e = mkEnv(); const r = e._reprojectPlan("lincoln", "aas", clone(live), [T(L17, "thursday", "10:00 AM", "AAS L2-17")], OPTS({ todayDay: "tuesday", nowMin: 11 * 60, blockedDays: ["tuesday"], checked: { [L16]: 1 } }));
  ok("a checked card on the blocked day is left alone", dayOf(r, L16) === "tuesday" && r.upd[L16] === undefined);
}

console.log("\n── wiring ──");
{
  ok("reprojectSubjectWeek computes the blocked days from the calendar (co-op rule + ✕) and passes them", /_ovRmX\(kid,ds,sk,false\)\) _blockedDays\.push\(d\);/.test(src) && /blockedDays:_blockedDays\}\);/.test(src));
  ok("the diff drops them from the pattern re-lay", /Object\.keys\(blockedD\)\.forEach\(d=>\{ delete dayOk\[d\]; \}\);/.test(src));
  ok("…and from the push landing", /kidDays\[_RP_DAYS\[j\]\]&&!blockedD\[_RP_DAYS\[j\]\]/.test(src));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
