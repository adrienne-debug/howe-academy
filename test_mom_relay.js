/*
 * Node tests — 👩 flipping a subject's Mom setting re-stamps THIS WEEK's open cards (her ask 2026-09-22).
 * Live shape: Lincoln's GWTM Purple switched to Mom Required; the week's cards kept mom:"none" and sat on
 * Thursday's China-Grove co-op (no-Mom day). The re-lay diff must carry the new stamp; checked cards never change.
 *   run:  node test_mom_relay.js
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
const SK = "gwtm";
const T = (id, day, time, mom, extra) => Object.assign({ id, who: "lincoln", subjectKey: SK, day, time, dur: 10, title: "GWTM " + id.slice(-5), lid: id.split("_").pop(), mom }, extra || {});
const O = (id, day) => ({ id, who: "lincoln", subjectKey: "other", day, time: "9:00 AM", dur: 20, title: "other" });
const P = "lincoln_lincoln__gwtm_";
const kidWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"].map(d => O("o_" + d, d));
const OPTS = o => Object.assign({ todayDay: "tuesday", nowMin: 20 * 60, checked: {}, claimed: {}, dayCtx, packAround, toMin, fromMin, dayCap: 1, allowedDays: [], lidOrder: ["L0001", "L0002", "L0003", "L0004", "L0005"] }, o || {});
const clone = x => x.map(t => Object.assign({}, t));
const card = (r, id) => r.tasksAfter.find(t => t.id === id) || {};

console.log("── an open card takes the new Mom stamp ──");
{
  const live = kidWeek.concat([T(P + "L0002", "wednesday", "12:15 PM", "none"), T(P + "L0003", "friday", "11:30 AM", "none")]);
  const want = [T(P + "L0002", "wednesday", "12:15 PM", "required"), T(P + "L0003", "friday", "11:30 AM", "required")];
  const r = mkEnv()._reprojectPlan("lincoln", SK, clone(live), want, OPTS());
  ok("Wednesday card now Mom Required", card(r, P + "L0002").mom === "required");
  ok("the write carries the stamp", r.upd[P + "L0002/mom"] === "required" && r.upd[P + "L0003/mom"] === "required", r.upd);
  ok("counted, so the re-lay writes", r.summary.retitled.indexOf(P + "L0002") >= 0);
  ok("nothing moved or dropped", r.summary.moved.length === 0 && r.summary.removed.length === 0 && r.tasksAfter.filter(t => t.subjectKey === SK).length === 2);
}
console.log("\n── a checked card is a record: never restamped ──");
{
  const live = kidWeek.concat([T(P + "L0001", "tuesday", "11:00 AM", "none")]);
  const r = mkEnv()._reprojectPlan("lincoln", SK, clone(live), [T(P + "L0001", "tuesday", "11:00 AM", "required")], OPTS({ checked: { [P + "L0001"]: 1 } }));
  ok("checked card keeps mom:none", card(r, P + "L0001").mom === "none" && r.upd[P + "L0001/mom"] === undefined);
}
console.log("\n── no change → no write ──");
{
  const live = kidWeek.concat([T(P + "L0002", "wednesday", "12:15 PM", "required")]);
  const r = mkEnv()._reprojectPlan("lincoln", SK, clone(live), [T(P + "L0002", "wednesday", "12:15 PM", "required")], OPTS());
  ok("same stamp → empty diff", Object.keys(r.upd).length === 0, r.upd);
  const live2 = kidWeek.concat([Object.assign(T(P + "L0002", "wednesday", "12:15 PM"), { mom: undefined })]);
  const r2 = mkEnv()._reprojectPlan("lincoln", SK, clone(live2), [T(P + "L0002", "wednesday", "12:15 PM", "none")], OPTS());
  ok("missing mom ≡ none → no write", Object.keys(r2.upd).length === 0, r2.upd);
}
console.log("\n── flipped to Required with Thursday blocked (co-op) ──");
{
  const live = kidWeek.concat([T(P + "L0002", "wednesday", "12:15 PM", "none"), T(P + "L0003", "thursday", "3:30 PM", "none"), T(P + "L0004", "friday", "11:30 AM", "none")]);
  const want = [T(P + "L0002", "wednesday", "12:15 PM", "required"), T(P + "L0003", "friday", "11:00 AM", "required"), T(P + "L0004", "monday", "10:00 AM", "required")];
  const r = mkEnv()._reprojectPlan("lincoln", SK, clone(live), want, OPTS({ todayDay: "tuesday", blockedDays: ["thursday"], dayCap: 2 }));
  const g = r.tasksAfter.filter(t => t.subjectKey === SK);
  ok("no GWTM card left on Thursday", !g.some(t => t.day === "thursday"), g.map(t => t.day + ":" + t.lid));
  ok("every open card Mom Required", g.every(t => t.mom === "required"), g.map(t => t.lid + ":" + t.mom));
  ok("nothing dropped", g.length === 3);
}
console.log("\n── the Rules-panel setter re-lays on a Mom change ──");
{
  const i = src.indexOf("function rlSet("); const fn = src.slice(i, src.indexOf("\n}\n", i) + 2);
  ok("rlSet calls reprojectSubjectWeek for field mom", /field==="mom"[\s\S]*?reprojectSubjectWeek\(kid,sk,"mom"/.test(fn));
  const calls = []; const env = { currData: { subjects: { lincoln: { gwtm: { mom: "none" } } } }, db: { ref: () => ({ set() {}, update() {} }) }, document: { getElementById: () => null },
    planBacked: () => true, reprojectSubjectWeek: (k, s, why, o) => { calls.push([k, s, why]); o && o.then && o.then(null); }, renderAll: () => calls.push("render"), cbKid: "", cbSubjKey: "" };
  vm.createContext(env); new vm.Script(fn).runInContext(env);
  env.rlSet("lincoln", "gwtm", "mom", "required", false);
  ok("setting saved", env.currData.subjects.lincoln.gwtm.mom === "required");
  ok("week re-laid once for that subject", calls.filter(c => Array.isArray(c)).length === 1 && calls[0][2] === "mom", calls);
  calls.length = 0; env.rlSet("lincoln", "gwtm", "priority", "high", false);
  ok("other fields do not trigger it", !calls.some(c => Array.isArray(c)), calls);
  calls.length = 0; env.planBacked = () => false; env.rlSet("lincoln", "gwtm", "mom", "maybe", false);
  ok("not plan-backed → no re-lay (next generation picks it up)", !calls.some(c => Array.isArray(c)), calls);
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
