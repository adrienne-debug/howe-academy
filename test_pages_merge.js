/*
 * 🧩 One card per day per page book (her yes 2026-09-22): adjacent unchecked page-range cards of the
 * same book on the same day fold into one card, every lesson id kept; checking it finishes them all.
 *   run:  node test_pages_merge.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// PGMERGE_START"), b = src.indexOf("// PGMERGE_END");
if (a < 0 || b < 0) { console.error("PGMERGE markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world() {
  const ctx = { console, currData: { subjects: { ellis: { mr: { pacing: { mode: "pages" } }, eic: { pacing: { mode: "timesPerWeek" } } }, lucy: { mr: { pacing: { mode: "pages" } } } } }, Object, String, Array, Math, parseInt, RegExp, JSON };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, merge: (tasks, ck, cl) => { ctx.__t = tasks; ctx.__ck = ck || {}; ctx.__cl = cl || {}; return vm.runInContext("pgMergeDayCards(__t,__ck,__cl)", ctx); } };
}
const card = (id, who, day, sk, title, time, dur, lid, extra) => Object.assign({ id, who, day, subjectKey: sk, title, time, dur, lid }, extra || {});
console.log("── the case she asked about ──");
{
  const w = world();
  const t = [card("a", "ellis", "tuesday", "mr", "📄 Mathematical Reasoning — pp. 1–2", "10:00 AM", 25, "L0001", { cascadedFrom: "monday" }),
             card("b", "ellis", "tuesday", "mr", "📄 Mathematical Reasoning — pp. 3–4", "10:30 AM", 25, "L0002"),
             card("c", "ellis", "tuesday", "eic", "📄 Editor in Chief — Pg 55–57", "11:00 AM", 20, "L0013")];
  const n = w.merge(t);
  ok("one card folded", n === 1 && t.length === 2, [n, t.length]);
  const m = t.find(x => x.id === "a");
  ok("it reads pp. 1–4", m && m.title === "📄 Mathematical Reasoning — pp. 1–4", m && m.title);
  ok("minutes added, both lessons kept, first id kept, the other remembered", m.dur === 50 && JSON.stringify(m.lids) === '["L0001","L0002"]' && m.lid === "L0001" && JSON.stringify(m.mergedFrom) === '["b"]', [m.dur, m.lids, m.mergedFrom]);
  ok("Editor in Chief (not a page book) untouched", t.some(x => x.id === "c" && x.title.endsWith("Pg 55–57")));
}
console.log("\n── three in a row, and a merged card merging again ──");
{
  const w = world();
  const t = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002"), card("c", "ellis", "tuesday", "mr", "📄 MR — pp. 5–6", "11:00 AM", 25, "L0003")];
  w.merge(t);
  ok("three adjacent sittings → one card pp. 1–6 with three lessons", t.length === 1 && t[0].title === "📄 MR — pp. 1–6" && t[0].lids.length === 3 && t[0].dur === 75, t.map(x => x.title));
  const t2 = [card("a", "ellis", "wednesday", "mr", "📄 MR — pp. 1–4", "10:00 AM", 50, "L0001", { lids: ["L0001", "L0002"] }), card("d", "ellis", "wednesday", "mr", "📄 MR — pp. 5–6", "10:30 AM", 25, "L0003")];
  w.merge(t2);
  ok("an already-merged card takes on the next sitting too", t2.length === 1 && t2[0].title === "📄 MR — pp. 1–6" && JSON.stringify(t2[0].lids) === '["L0001","L0002","L0003"]', t2[0]);
}
console.log("\n── when it leaves things alone ──");
{
  const w = world();
  const t = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "mr", "📄 MR — pp. 5–6", "10:30 AM", 25, "L0003")];
  ok("a gap between the ranges → two cards stay", w.merge(t) === 0 && t.length === 2);
  const t1 = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("one of them already checked → no merge", w.merge(t1, { a: "10:20 AM Sep 22" }) === 0 && t1.length === 2);
  const t1b = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("one of them claimed (waiting for Mom) → no merge", w.merge(t1b, {}, { b: "10:20 AM" }) === 0 && t1b.length === 2);
  const t3 = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "wednesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("different days → no merge", w.merge(t3) === 0 && t3.length === 2);
  const t4 = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "lucy", "tuesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("different kids → no merge", w.merge(t4) === 0 && t4.length === 2);
  const t5 = [card("a", "ellis", "tuesday", "eic", "📄 EIC — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "eic", "📄 EIC — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("a subject that is not in pages mode → no merge even with page-looking titles", w.merge(t5) === 0 && t5.length === 2);
  const t6 = [card("a_c", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("a carried twin (_c) is never merged", w.merge(t6) === 0 && t6.length === 2);
  const t7 = [card("a", "ellis", "tuesday", "mr", "📄 MR — pp. 1–2", "10:00 AM", 25, "L0001", { _eowOverflow: true }), card("b", "ellis", "tuesday", "mr", "📄 MR — pp. 3–4", "10:30 AM", 25, "L0002")];
  ok("end-of-week overflow is never merged", w.merge(t7) === 0 && t7.length === 2);
  const t8 = [card("a", "ellis", "tuesday", "mr", "📄 MR — Lesson 1", "10:00 AM", 25, "L0001"), card("b", "ellis", "tuesday", "mr", "📄 MR — Lesson 2", "10:30 AM", 25, "L0002")];
  ok("lesson-numbered titles never merge", w.merge(t8) === 0 && t8.length === 2);
}
console.log("\n── titles ──");
{
  const w = world();
  const t = [card("a", "ellis", "tuesday", "mr", "📄 Real Science — Book 6 — p. 7", "10:00 AM", 25, "L0007"), card("b", "ellis", "tuesday", "mr", "📄 Real Science — Book 6 — pp. 8–9", "10:30 AM", 25, "L0008")];
  w.merge(t);
  ok("a subject name with its own dash keeps it; single page + range → pp. 7–9", t.length === 1 && t[0].title === "📄 Real Science — Book 6 — pp. 7–9", t[0].title);
}
console.log("\n── wiring ──");
ok("the week generator folds after lesson ids are stamped", /gwPlanIds\(allTasks\);[\s\S]{0,400}pgMergeDayCards\(allTasks,/.test(src));
ok("the carry-forward sweep folds before it writes", /pgMergeDayCards\(weekData\.tasks,checked,[\s\S]{0,200}safeWriteTasks\("cascade"\)/.test(src));
ok("a check-off finishes every lesson on a merged card", /t\.lids\.forEach\(function\(l\)\{ if\(l&&l!==t\.lid\) lidDoneWrite\(Object\.assign\(\{\},t,\{lid:l\}\),doneTs,id\); \}\)/.test(src));
ok("an un-check un-does every lesson on a merged card", /_mt\.lids\.forEach\(function\(l\)\{ if\(l&&l!==_mt\.lid\) lidDoneRemove\(/.test(src));
ok("the projection sees every lesson a merged card holds as dealt", /if\(Array\.isArray\(t\.lids\)&&t\.lids\.length>1\) rec\.more=t\.lids\.filter/.test(src) && /rec\.more=\(rec\.more\|\|\[\]\)\.concat\(\[cur\]\)\.concat\(cur\.more\|\|\[\]\)/.test(src));
ok("the slot normalizer leaves a merged card alone and counts its lessons as taken", /if\(Array\.isArray\(t\.lids\)&&t\.lids\.length>1\)\{ const k=t\.who\+"\|"\+t\.subjectKey; \(takenBy\[k\]=takenBy\[k\]\|\|\[\]\)\.push\.apply/.test(src) && /const taken=new Set\(doneSet\); \(takenBy\[key\]\|\|\[\]\)\.forEach\(l=>taken\.add\(l\)\);/.test(src) && /done:taken,cards:groups\[key\]/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
