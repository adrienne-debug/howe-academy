/*
 * ⏳ Page books that keep averaging toward a finish date (her rule 2026-09-22): the unprotected tail of
 * the lesson list is re-cut so pages-left ÷ sittings-left is what each sitting asks; done and dealt
 * lessons are never touched; written on Build and before every weekly generation.
 *   run:  node test_pages_auto.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// PGAUTO_START"), b = src.indexOf("// PGAUTO_END");
if (a < 0 || b < 0) { console.error("PGAUTO markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(n) { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("no " + n); return src.slice(i, src.indexOf("\n}", i) + 2); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world(o) {
  o = o || {};
  const seq = o.seq || [], ids = seq.map((_, i) => "L" + String(i + 1).padStart(4, "0"));
  const done = new Set((o.doneIdx || []).map(i => ids[i]));
  const writes = [], logs = [], sets = [];
  const ctx = {
    console, currData: { subjects: { ellis: { mr: { display: "Mathematical Reasoning", planId: "ellis__mr", doneImportedAt: "x", lessonSeq: seq.slice(), lessonIds: ids.slice(), nextLid: seq.length + 1,
      pacing: o.pacing === null ? undefined : Object.assign({ mode: "pages", tpw: 3, targetDate: o.target || "2027-04-20", pages: { totalPages: 349, startPage: 1, unitLabel: "pp." } }, o.pacing || {}) } } } },
    planBacked: () => o.planBacked !== false, lidsFor: () => ctx.currData.subjects.ellis.mr.lessonIds,
    lidDoneIdx: () => { const out = new Set(); ctx.currData.subjects.ellis.mr.lessonIds.forEach((id, i) => { if (done.has(id)) out.add(i); }); return out; },
    gvDealtDates: () => o.dealt || {}, cbTodayISO: () => o.today || "2026-09-22",
    setLessonSeq: (kid, sk, s, opts) => { sets.push(s); ctx.currData.subjects.ellis.mr.lessonSeq = s.slice(); opts.patch["subjects/ellis/mr/lessonSeq"] = s; return {}; },
    db: { ref: p => ({ update: u => { writes.push([p, u]); return { catch: () => {} }; } }) }, _dryRun: () => !!o.dry, dbg: m => logs.push(m),
    Object, String, Array, Math, Set, JSON, RegExp, parseInt, Date,
  };
  vm.createContext(ctx);
  vm.runInContext(slice("_pjWeeksBetween"), ctx);
  { const i = src.indexOf("_lidNorm="); vm.runInContext(src.slice(src.lastIndexOf("\n", i) + 1, src.indexOf("\n", i)), ctx); }
  vm.runInContext(BLOCK, ctx);
  return { ctx, writes, logs, sets, call: e => vm.runInContext(e, ctx) };
}
const pgSeq = n => Array.from({ length: n }, (_, i) => "pg " + (i + 1));
console.log("── a fresh 349-page book, 30 weeks × 3 sittings to the date ──");
{
  const w = world({ seq: pgSeq(349), target: "2027-04-20", today: "2026-09-22" });   // 30 weeks
  const rc = w.call("pgAutoChunk('ellis','mr')");
  ok("90 sittings → 4 pages per sitting", rc && rc.weeks === 30 && rc.sittings === 90 && rc.chunk === 4, rc && [rc.weeks, rc.sittings, rc.chunk]);
  ok("the one-page list becomes 88 page ranges", rc.seq.length === 88 && rc.seq[0] === "pp. 1–4" && rc.seq[86] === "pp. 345–348" && rc.seq[87] === "p. 349", [rc.seq.length, rc.seq[0], rc.seq[87]]);
  ok("flagged as changed", rc.changed === true);
}
console.log("\n── progress and slippage: the tail re-averages, the done prefix never moves ──");
{
  const seq = ["pp. 1–4", "pp. 5–8", "pp. 9–12", "pp. 13–16", "pp. 17–20"].concat(Array.from({ length: 83 }, (_, i) => "pp. " + (21 + i * 4) + "–" + (24 + i * 4)));
  const w = world({ seq, doneIdx: [0, 1, 2], today: "2027-01-05", target: "2027-04-20" });   // 15 weeks left, 45 sittings, 337 pages left from p.13
  const rc = w.call("pgAutoChunk('ellis','mr')");
  ok("resumes right after the last DONE lesson (page 13)", rc.resumeIdx === 3 && rc.seq[3].startsWith("pp. 13–"), [rc.resumeIdx, rc.seq[3]]);
  ok("337 pages ÷ 45 sittings → 8 per sitting", rc.pagesLeft === 337 && rc.sittings === 45 && rc.chunk === 8, [rc.pagesLeft, rc.sittings, rc.chunk]);
  ok("done lessons keep their exact text", rc.seq.slice(0, 3).join("|") === "pp. 1–4|pp. 5–8|pp. 9–12");
}
{
  const seq = pgSeq(349);
  const w = world({ seq, doneIdx: [0, 1], dealt: { "2026-09-24": { lid: "L0003" }, "2026-09-25": { text: "pg 5", more: [{ text: "pg 6" }] } } });
  const rc = w.call("pgAutoChunk('ellis','mr')");
  ok("lessons already on this week's cards are protected too — resume after pg 6", rc.resumeIdx === 6 && rc.seq[5] === "pg 6" && rc.seq[6].startsWith("pp. 7–"), [rc.resumeIdx, rc.seq[5], rc.seq[6]]);
}
{
  const w = world({ seq: pgSeq(349), today: "2027-04-06", target: "2027-04-20" });   // 2 weeks left
  const rc = w.call("pgAutoChunk('ellis','mr')");
  ok("two weeks out with the whole book left → 59 pages per sitting, shown not hidden", rc.sittings === 6 && rc.chunk === 59, [rc.sittings, rc.chunk]);
}
{
  const w = world({ seq: pgSeq(349), today: "2027-06-01", target: "2027-04-20" });
  const rc = w.call("pgAutoChunk('ellis','mr')");
  ok("past the date → crams into the next week's sittings (never null, never a crash)", rc && rc.weeks === 1 && rc.sittings === 3, rc && [rc.weeks, rc.sittings]);
}
{
  const w = world({ seq: pgSeq(349) });
  const rc = w.call("pgAutoChunk('ellis','mr')");
  w.ctx.currData.subjects.ellis.mr.lessonSeq = rc.seq.slice(); w.ctx.currData.subjects.ellis.mr.lessonIds = rc.seq.map((_, i) => "L" + (i + 1));
  const rc2 = w.call("pgAutoChunk('ellis','mr')");
  ok("laid again with nothing new → not changed (no churn)", rc2 && rc2.changed === false, rc2 && rc2.changed);
}
console.log("\n── when it stays off ──");
ok("no Finish-by date → off", world({ seq: pgSeq(10), pacing: { targetDate: null } }).call("pgAutoChunk('ellis','mr')") === null);
ok("scanned unit boundaries → off (real boundaries win)", world({ seq: pgSeq(10), pacing: { pages: { totalPages: 349, startPage: 1, units: [{ startPage: 1, endPage: 9 }] } } }).call("pgAutoChunk('ellis','mr')") === null);
ok("not plan-backed → off", world({ seq: pgSeq(10), planBacked: false }).call("pgAutoChunk('ellis','mr')") === null);
ok("timesPerWeek mode → off", world({ seq: pgSeq(10), pacing: { mode: "timesPerWeek" } }).call("pgAutoChunk('ellis','mr')") === null);
ok("every page finished → off", world({ seq: ["pp. 1–349"], doneIdx: [0] }).call("pgAutoChunk('ellis','mr')") === null);
console.log("\n── the write ──");
{
  const w = world({ seq: pgSeq(349) });
  const rc = w.call("pgAutoApply('ellis','mr','test')");
  ok("goes through setLessonSeq (the one list writer) and one curriculum update with lastEdit", w.sets.length === 1 && w.writes.length === 1 && w.writes[0][0] === "curriculum" && !!w.writes[0][1].lastEdit && Array.isArray(w.writes[0][1]["subjects/ellis/mr/lessonSeq"]), w.writes.map(x => x[0]));
  ok("logs the cut", w.logs.some(m => /re-averaged ellis\/mr/.test(m)), w.logs);
  const w2 = world({ seq: pgSeq(349), dry: true }); w2.call("pgAutoApply('ellis','mr','test')");
  ok("dry-run: list updated in memory, nothing sent", w2.sets.length === 1 && w2.writes.length === 0);
  const w3 = world({ seq: pgSeq(349) }); const all = w3.call("pgAutoApplyAll('weekly')");
  ok("pgAutoApplyAll reports what changed", all.length === 1 && all[0].sk === "mr" && all[0].chunk === 4, all);
}
console.log("\n── wiring ──");
ok("pacing keeps the date in pages mode", /if\(f\.targetDate&&String\(f\.targetDate\)\.trim\(\)\) p\.targetDate=String\(f\.targetDate\)\.trim\(\);/.test(src));
ok("the Builder engine previews on the re-cut list and tags the result", /r\.rechunk=\{seq:rc\.seq,chunk:rc\.chunk/.test(src) && /finally \{ _s\.lessonSeq=keepSeq; _s\.lessonIds=keepIds; _s\.nextLid=keepNext; _s\.pacing=_pace; \}/.test(src));
ok("cbApply writes the re-cut list before the cells", /if\(res\.rechunk&&Array\.isArray\(res\.rechunk\.seq\)\)\{[\s\S]{0,400}setLessonSeq\(kid,sk,res\.rechunk\.seq,\{patch:up,mint:true\}\);/.test(src));
ok("the pages form has a Finish-by date", /Finish by <span[^<]*re-averaged toward this date/.test(src) && /onchange="cbSetField\(\\'targetDate\\',this\.value\)"/.test(src));
ok("Sunday auto-generation re-averages first", /haClaimSchedLock\("autogen"[\s\S]{0,300}pgAutoApplyAll\("weekly"\)/.test(src));
ok("Mom's Regenerate re-averages first", /pgAutoApplyAll\("regenerate"\)[\s\S]{0,300}runGenerateWeek\(\);/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
