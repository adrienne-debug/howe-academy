/*
 * 📖 Lucy's phonogram sprint follows Logic of English Foundations B (her Q 2026-09-23, "do all 3" 9/24):
 *   1. the ladder is the BOOK's order (LoE's official A–D scope & sequence), with or/tch/ough; ow/oo/ir/ur are Foundations C
 *   2. sprint word lists use only the multi-letter phonograms the kid has been taught so far
 *   3. the sprint's focus follows the lesson (newest taught phonogram); earlier unpassed rungs become review
 *   run:  node test_loe_link.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// LOELINK_START"), b = src.indexOf("// LOELINK_END");
if (a < 0 || b < 0) { console.error("LOELINK markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const ctx = { Array, String, Object, RegExp, Number }; vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
const B = vm.runInContext("SPRINT_LOE_B", ctx), C = vm.runInContext("SPRINT_LOE_C", ctx);
// Lucy's live shape (curriculum/subjects/lucy/loe + curriculum/done/lucy/loe, 9/24)
const seq = ["B Lesson 43", "B Lesson 44", "B Lesson 45", "B Review 1", "B Lesson 46", "B Lesson 47", "B Lesson 48", "B Lesson 49", "B Lesson 50", "B Lesson 51"];
const ids = seq.map((_, i) => "L" + String(i + 1).padStart(4, "0"));
const done = {}; ids.slice(0, 7).forEach(l => { done[l] = { src: "check" }; });   // L0001–L0007 = through B Lesson 48
const CD = { subjects: { lucy: { loe: { display: "LOE Foundations B", lessonSeq: seq, lessonIds: ids } } }, done: { lucy: { loe: done } } };
ctx.CD = CD;

console.log("── 1. the ladder is the book's order ──");
ok("starts sh, th, ck, igh, ch, ee, er, wh, oi, oy, ai, ay, ng, ar, or, tch, ou, ough, ea, oa",
  B.map(p => p.pg).join(" ") === "sh th ck igh ch ee er wh oi oy ai ay ng ar or tch ou ough ea oa", B.map(p => p.pg));
ok("lesson numbers never go backwards", B.every((p, i) => i === 0 || p.lesson >= B[i - 1].lesson));
ok("igh is lesson 48 and ch is lesson 49 (the day she was 'on I')", B.find(p => p.pg === "igh").lesson === 48 && B.find(p => p.pg === "ch").lesson === 49);
ok("or, tch, ough are on the B ladder now", ["or", "tch", "ough"].every(pg => B.some(p => p.pg === pg)));
ok("ow, oo, ir, ur moved to Foundations C", ["ow", "oo", "ir", "ur"].every(pg => !B.some(p => p.pg === pg) && C.some(p => p.pg === pg)));
ok("old logs still resolve by name (spPhono)", vm.runInContext("spPhono('ir')", ctx).lesson === 81 && vm.runInContext("spPhono('sh')", ctx).lesson === 41 && vm.runInContext("spPhono('zz')", ctx) === null);

console.log("\n── 2. what the book has taught her ──");
{
  const r = vm.runInContext("loeLessonReached('lucy',CD)", ctx);
  ok("done through Lesson 48, now on Lesson 49 (skips the 'B Review 1' row)", r && r.done === 48 && r.current === 49, r);
  const t = vm.runInContext("loeTaught('lucy',CD).map(p=>p.pg)", ctx);
  ok("taught so far = sh, th, ck, igh, ch (the current lesson's phonogram counts)", t.join(" ") === "sh th ck igh ch", t);
  ok("ee (Lesson 50) is NOT allowed yet", t.indexOf("ee") < 0);
}
{
  ctx.CD2 = { subjects: { ellis: { dm: { display: "Dimensions Math" } } }, done: {} };
  ok("a kid with no LoE subject → no link (old behaviour)", vm.runInContext("loeLessonReached('ellis',CD2)", ctx) === null && vm.runInContext("loeTaught('ellis',CD2)", ctx) === null);
}
{
  ctx.CD3 = { subjects: { lucy: { loe: { display: "LOE Foundations B", lessonSeq: seq, lessonIds: ids } } }, done: {} };
  const r = vm.runInContext("loeLessonReached('lucy',CD3)", ctx);
  ok("nothing checked yet → on the first lesson (43), taught = sh, th", r.done === null && r.current === 43 && vm.runInContext("loeTaught('lucy',CD3).map(p=>p.pg).join(' ')", ctx) === "sh th");
}

console.log("\n── 3. the focus follows the lesson ──");
{
  const keys = B.map(p => p.pg);
  ctx.KEYS = keys;
  ok("focus = ch (index 4) — not sh, where the gate left her", vm.runInContext("loeFocusIdx('lucy',KEYS,CD)", ctx) === 4);
  ok("no LoE link → -1 (gate rules apply)", vm.runInContext("loeFocusIdx('ellis',KEYS,CD2)", ctx) === -1);
}
{
  // retrEvalTrack with Lucy's real state: 7 sessions on sh, none ≥80 twice → old focus sh; new focus ch, sh/igh/ck/th as review
  const i = src.indexOf("function retrEvalTrack("), j = src.indexOf("\nfunction retrApplyPlan(");
  const ectx = { Array, String, Object, Math, Number, Date, JSON, RegExp,
    retrSettings: () => ({ gate_pct: 80, gate_streak: 2, min_stage_sessions: 0, stuck_after: 8, review_count: 3, gate_metric: "completion", recheck_ladder: [7, 14, 28], recheck_pass_pct: 80, recheck_fail: "recheck" }),
    retrEntries: () => [{ src: "phonogram", deck: "sh", pctA: 56, pctB: 61, date: "2026-09-23" }, { src: "phonogram", deck: "sh", pctA: 50, pctB: 44, date: "2026-06-30" }],
    retrPct: (e, m) => Math.max(e.pctA, e.pctB), retrStageMatch: (tr, st, e) => e.src === "phonogram" && e.deck === st.key,
    retrTodayPn: () => 38, retrPnForDate: () => 30, currData: CD };
  vm.createContext(ectx); vm.runInContext(src.slice(a, b) + "\n" + src.slice(i, j), ectx);
  ectx.TRACK = { key: "phono", src: "phonogram", stages: B.map(p => ({ key: p.pg, label: p.pg })) };
  const ev = vm.runInContext("retrEvalTrack('lucy',TRACK)", ectx);
  ok("Lucy's focus sprint is ch", ev.stages[ev.focus].key === "ch", ev.stages[ev.focus].key);
  ok("review = the unpassed earlier rungs, newest first, capped at 3 (igh, ck, th)", ev.review.join(" ") === "igh ck th", ev.review);
  ectx.currData = { subjects: {}, done: {} };
  const ev2 = vm.runInContext("retrEvalTrack('lucy',TRACK)", ectx);
  ok("without the LoE link the earned-rung gate still says sh", ev2.stages[ev2.focus].key === "sh");
}

console.log("\n── the wiring ──");
ok("the sprint prompt limits words to the taught phonograms", /plus ONLY these multi-letter phonograms, the only ones "\+kidName\+" has been taught so far/.test(src) && /"All words decodable with LOE Foundations A\+B only\."; \}\)\(\)\}/.test(src));
ok("no lookup still reads SPRINT_LOE_B by name for a pill/log", !/SPRINT_LOE_B\.find\(/.test(src));
ok("both pill grids show the whole catalog (B then C)", (src.match(/SPRINT_LOE_ALL\.forEach\(p=>\{/g) || []).length === 2);
ok("both ladders (Lucy, Ellis review) still build from SPRINT_LOE_B", (src.match(/stages:SPRINT_LOE_B\.map\(p=>\(\{key:p\.pg,label:p\.pg\}\)\)/g) || []).length === 2);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
