/*
 * Node tests — 🎰 two spins on one card keep BOTH in its spin record (DeWalt 10/5: Kenzie's AAS 4 L3 spun 25,
 * was un-ticked, re-ticked as her last card → day-bonus spin 5 overwrote the 25). Points paid were always right;
 * the record (Mom's Spin & Points Manager, Reset, sent-back) now sees the whole amount.
 *   run:  node test_spin_merge.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const CODE = cut("// SPINMERGE_START", "// SPINMERGE_END") + "\n" + slice("spinAdminResetSpin");
function world(sr, pool) {
  const store = { "week1_spin_results": sr, "week1_slot_points": pool || {}, "week1_spins_used": {} }, writes = [], bankRm = [], pending = [];
  const ref = p => ({ remove: () => writes.push(["remove", p]), set: v => writes.push(["set", p, v]),
    transaction: f => writes.push(["txn", p, f(store["week1_slot_points"].__srv !== undefined ? store["week1_slot_points"].__srv : 30)]) });
  const ctx = { console, JSON, Object, Array, Math, WK: "week1", db: { ref }, momHere: () => true, renderAll: () => {},
    ld: k => store[k], sv: (k, v) => { store[k] = v; }, addPendingSpin: (...a) => pending.push(a), bankDirectRemove: (k, b) => bankRm.push([k, b]) };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return { ctx, store, writes, bankRm, pending };
}

console.log("── merge ──");
{
  const { ctx } = world({});
  const first = { pts: 25, kid: "makenzie", day: "monday", ts: 1 }, bonus = { pts: 5, kid: "makenzie", day: "monday", ts: 2 };
  const m = ctx.spinMergeRec(first, bonus);
  ok("Kenzie 25 then day bonus 5 → record shows 30", m.pts === 30, m);
  ok("both spins kept as parts, in order", m.parts.length === 2 && m.parts[0].pts === 25 && m.parts[1].pts === 5);
  ok("latest kid/day/ts on top", m.kid === "makenzie" && m.day === "monday" && m.ts === 2);
  ok("no undefined anywhere (Firebase rejects it)", JSON.stringify(m) === JSON.stringify(JSON.parse(JSON.stringify(m))) && !/undefined/.test(JSON.stringify(Object.values(m))));
  const m3 = ctx.spinMergeRec(m, { pts: 10, kid: "makenzie", day: "monday", ts: 3 });
  ok("a third spin appends, does not nest", m3.pts === 40 && m3.parts.length === 3 && !m3.parts[2].parts);
  const ga = ctx.spinMergeRec({ pts: 20, kid: "andrew", day: "monday", ts: 1, gaBank: 30, gaBonus: 10, gaBid: "b1" }, { pts: 5, kid: "andrew", day: "monday", ts: 2 });
  ok("got-ahead bank id stays on ITS part, not the top", ga.parts[0].gaBid === "b1" && ga.gaBid === undefined && ga.parts[1].gaBid === undefined);
  ok("one-spin record reads as one part (old records unchanged)", ctx.spinRecParts({ pts: 7 }).length === 1 && ctx.spinRecParts(null).length === 0);
}

console.log("── Reset Spin ──");
{
  const rec = { pts: 30, kid: "makenzie", day: "monday", ts: 2, parts: [{ pts: 25, kid: "makenzie", day: "monday", ts: 1 }, { pts: 5, kid: "makenzie", day: "monday", ts: 2 }] };
  const w = world({ t1: rec }, { makenzie: { monday: 81 } });
  w.ctx.spinAdminResetSpin("t1", "makenzie", "monday");
  ok("Reset takes back 25 + 5 = 30 (81 → 51)", w.store.week1_slot_points.makenzie.monday === 51, w.store.week1_slot_points);
  ok("two server decrements, one per spin", w.writes.filter(x => x[0] === "txn").length === 2);
  ok("record removed + one spin re-offered", w.writes.some(x => x[0] === "remove" && x[1] === "week1/spin_results/t1") && w.pending.length === 1);
}
{
  const w = world({ t1: { pts: 25, kid: "makenzie", day: "monday", ts: 1 } }, { makenzie: { monday: 81 } });
  w.ctx.spinAdminResetSpin("t1", "makenzie", "monday");
  ok("a one-spin card resets exactly as before (81 → 56)", w.store.week1_slot_points.makenzie.monday === 56);
}
{
  const rec = { pts: 25, kid: "andrew", day: "monday", ts: 2, parts: [{ pts: 20, kid: "andrew", day: "monday", ts: 1, gaBid: "b1", gaBank: 30 }, { pts: 5, kid: "andrew", day: "monday", ts: 2 }] };
  const w = world({ t1: rec }, { andrew: { monday: 40 } });
  w.ctx.spinAdminResetSpin("t1", "andrew", "monday");
  ok("mixed: got-ahead part leaves the bank, pooled part leaves the day (40 → 35)", w.bankRm.length === 1 && w.bankRm[0][1] === "b1" && w.store.week1_slot_points.andrew.monday === 35);
}

console.log("── wiring in index.html ──");
ok("2nd spin's outbox guard points at its own part", /_srGuard=slotPendingTaskId\?\(WK\+"\/spin_results\/"\+slotPendingTaskId\+\(_srOld\?"\/parts\/"\+spinRecParts\(_srOld\)\.length:""\)\)/.test(src) && src.includes("addKidPoints(k,outcome.pts,d,_srGuard)"));
ok("record merged before the write", src.includes("if(_srOld) _srRec=spinMergeRec(_srOld,_srRec);"));
ok("sent-back removes every got-ahead part", src.includes("spinRecParts(_sr).forEach(function(p){ if(p.gaBid"));
ok("no leftover overwrite-only reset", !src.includes("const pts=sr[taskId].pts||0;"));

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
