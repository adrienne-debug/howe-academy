/*
 * Node tests — RPMERGE (fix D, her "d" 2026-10-04). The quick re-lay (reprojectSubjectWeek) builds a targeted
 * update, then folds in the school-end guard's update. When the guard retimed a card the re-lay was ADDING, the
 * map held "<id>" and "<id>/time" together and Firebase rejected the whole save — live on DeWalt Kenzie's AAS 4:
 *   "values argument contains a path /makenzie_makenzie__aas_4_L0141 that is ancestor of another path …/time"
 * Runs the REAL _rpMergeUpd sliced from index.html, and checks the call site uses it.
 *   run:  node test_rp_merge.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// RPMERGE_START"), b = src.indexOf("// RPMERGE_END");
if (a < 0 || b < 0) { console.error("RPMERGE markers missing"); process.exit(1); }
const ctx = { Object, JSON, console }; vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
const M = ctx._rpMergeUpd;
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
// Firebase's rule: no key may be an ancestor of another key.
const legal = u => { const k = Object.keys(u); return !k.some(p => k.some(q => q !== p && q.indexOf(p + "/") === 0)); };

console.log("── the live case: a NEW card retimed by the school-end guard ──");
{
  const id = "makenzie_makenzie__aas_4_L0141";
  const dst = { [id]: { id, day: "tuesday", time: "10:35 AM", title: "AAS 4 — Lesson 3 · day 5 of 5" }, "old_card": null };
  const r = M(dst, { [id + "/time"]: "10:55 AM" });
  ok("the update is legal for Firebase (no path beside its child)", legal(r), Object.keys(r));
  ok("the new card carries the guard's time", r[id].time === "10:55 AM");
  ok("…and keeps everything else", r[id].title === "AAS 4 — Lesson 3 · day 5 of 5" && r[id].day === "tuesday");
  ok("the removal elsewhere is untouched", r.old_card === null);
}
console.log("\n── other shapes ──");
{
  const r = M({ "c1/time": "9:00 AM" }, { "c2/time": "9:30 AM" });
  ok("unrelated child updates just merge", r["c1/time"] === "9:00 AM" && r["c2/time"] === "9:30 AM" && legal(r));
}
{
  const r = M({ c1: null }, { "c1/time": "9:30 AM" });
  ok("a child change on a card being REMOVED is dropped (never resurrects it)", r.c1 === null && !("c1/time" in r) && legal(r));
}
{
  const r = M({ "c1/time": "9:00 AM", "c1/day": "monday" }, { c1: null });
  ok("the guard removing a card wins over its pending field changes", r.c1 === null && !("c1/time" in r) && !("c1/day" in r) && legal(r));
}
{
  const r = M({ "c1/time": "9:00 AM" }, { c1: { id: "c1", time: "1:00 PM" } });
  ok("a whole-card value replaces pending field changes under it", r.c1.time === "1:00 PM" && legal(r));
}
{
  const before = { id: "c9", time: "10:00 AM" }; const dst = { c9: before };
  M(dst, { "c9/time": "10:20 AM" });
  ok("the caller's card object is not mutated in place (a copy is written)", before.time === "10:00 AM" && dst.c9.time === "10:20 AM");
}
{
  const r = M({ c1: { id: "c1", meta: { a: 1 } } }, { "c1/meta/b": 2 });
  ok("deeper paths land in the right nested spot", r.c1.meta.a === 1 && r.c1.meta.b === 2 && legal(r));
}
{
  const r = M({ c1: { id: "c1", time: "9:00 AM" } }, { "c1/time": null });
  ok("a null child deletes that field inside the new card", !("time" in r.c1) && legal(r));
}
console.log("\n── the call site ──");
{
  const i = src.indexOf("function reprojectSubjectWeek(");
  const body = src.slice(i, src.indexOf("// REPROJ_END", i));
  ok("reprojectSubjectWeek folds the school-end update through _rpMergeUpd", /_rpMergeUpd\(r\.upd,_se\.upd\)/.test(body));
  ok("the old ancestor-unsafe loop is gone", !/Object\.keys\(_se\.upd\)\.forEach/.test(body));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
