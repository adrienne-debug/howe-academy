/*
 * 📊 Book Sprints data view (asked 2026-10-07): tapping a sprint's 📊 opens a READ-ONLY pop-up for that kid + sprint —
 * total attempts, per sheet, first/latest attempt, days to pass, pass date, met/not streak, attempts-per-day chart —
 * and a per-kid summary (sprints passed, average attempts to pass, current sprint, runs this week). No writes.
 *   run:  node test_msprint_stats.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MSPRINT_START"), b = src.indexOf("// MSSTATS_END");
if (a < 0 || b < 0 || src.indexOf("// MSSTATS_START") < a) { console.error("MSPRINT/MSSTATS markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const BOOK4 = ["Sprint 401 · Identify the Value of Digits", "Sprint 402 · Count On or Back", "Sprint 403 · Compare Numbers", "Sprint 404 · Round"];
const R = (d, sheet, met) => ({ d, ts: "10:00 AM", sheet, met });
// Lincoln: 401 passed on its 2nd try the same day; 402 passed after 5 tries over 3 school days (with a weekend);
// 403 is current, two misses this week. Ellis: Sprints 5 (no list), one run. Lucy: not set up.
const STATE = {
  lincoln: { book: "sm-sprints-4", cur: 403, moves: [{ at: 1 }], log: {
    401: { runs: [R("2026-09-24", "a1", false), R("2026-09-24", "b1", true)], passed: "10:05 AM Sep 24" },
    402: { runs: [R("2026-09-25", "a1", false), R("2026-09-25", "b1", false), R("2026-09-25", "a2", false), R("2026-09-28", "b2", false), R("2026-09-29", "a1", true)], passed: "09:40 AM Sep 29" },
    403: { runs: { 0: R("2026-10-05", "a1", false), 1: R("2026-10-06", "b1", false), 3: null } } } },
  ellis: { book: "sm-sprints-5", cur: 501, log: { 501: { runs: [R("2026-10-07", "a1", false)] } } },
};
function world(o) {
  o = o || {};
  const writes = [], body = [];
  const mk = () => ({ id: "", className: "", style: {}, innerHTML: "", remove() { const i = body.indexOf(this); if (i >= 0) body.splice(i, 1); } });
  const ctx = {
    console, masteryKid: "lincoln", SL_KLBL: { lincoln: "Lincoln", ellis: "Ellis", lucy: "Lucy" },
    momHere: () => o.who !== "kid", nowTs: () => "10:00 AM Oct 7", cbTodayISO: () => o.today || "2026-10-07",
    dbg: () => {}, _mastRe: () => {}, _dryRun: () => false,
    db: { ref: p => ({ update: v => writes.push([p, v]), set: v => writes.push([p, v]), remove: () => writes.push([p, null]) }) },
    document: { getElementById: id => body.find(e => e.id === id) || null, createElement: mk, body: { appendChild: e => body.push(e) } },
    setInterval: () => 1, clearInterval: () => {}, setTimeout: () => 1, clearTimeout: () => {},
    Object, Array, String, Number, Math, Date, JSON, RegExp, parseInt,
  };
  vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
  vm.runInContext("lbScansMS=" + JSON.stringify({ "sm-sprints-4": { lessons: BOOK4 } }) + "; mathSprints=" + JSON.stringify(o.state || STATE) + ";", ctx);
  return { ctx, writes, body, call: e => vm.runInContext(e, ctx) };
}

console.log("── one sprint ──");
{
  const w = world(), S = w.call("msSprintStats('lincoln',402)");
  ok("total attempts + met/not", S.total === 5 && S.met === 1);
  ok("attempts per sheet (A1 twice: the 4-miss cycle restarted)", S.perSheet.a1.runs === 2 && S.perSheet.a1.met === 1 && S.perSheet.b1.runs === 1 && S.perSheet.a2.runs === 1 && S.perSheet.b2.runs === 1, S.perSheet);
  ok("first + latest attempt dates", S.first === "2026-09-25" && S.latest === "2026-09-29");
  ok("pass date is the met run's day", S.passed && S.passDate === "2026-09-29" && S.passLabel === "Sep 29");
  ok("days to pass: Sep 25 → Sep 29 = 5 calendar days, 3 practice days", S.daysToPass === 5 && S.practiceDays === 3, [S.daysToPass, S.practiceDays]);
  ok("streak now = met ×1; longest miss run ×4", S.streak.met === true && S.streak.len === 1 && S.longestNot === 4);
  ok("chart data: one bar per practice day", S.byDay.length === 3 && S.byDay[0].not === 3 && S.byDay[2].met === 1);
  const one = w.call("msSprintStats('lincoln',401)");
  ok("passed the same day it was first tried = 1 day", one.daysToPass === 1 && one.practiceDays === 1);
  const c = w.call("msSprintStats('lincoln',403)");
  ok("current sprint: Firebase object-shaped runs read, holes skipped", c.total === 2 && !c.passed && c.passDate === null && c.daysToPass === null);
  ok("current sprint streak = not ×2", c.streak.met === false && c.streak.len === 2);
  const e = w.call("msSprintStats('lincoln',404)");
  ok("an untried sprint is all zeros, no errors", e.total === 0 && e.first === null && e.streak === null && e.byDay.length === 0);
  ok("a kid who isn't set up → null", w.call("msSprintStats('lucy',401)") === null);
}
console.log("\n── the kid summary ──");
{
  const w = world(), K = w.call("msKidSummary('lincoln')");
  ok("sprints passed", K.passed === 2);
  ok("average attempts to pass = (2+5)/2 = 3.5", K.avgToPass === 3.5, K.avgToPass);
  ok("current sprint + title", K.cur === 403 && K.curTitle === "Compare Numbers");
  ok("runs this week (Mon Oct 5 – today)", K.weekStart === "2026-10-05" && K.weekRuns === 2, [K.weekStart, K.weekRuns]);
  const sun = world({ today: "2026-10-04" }).call("msKidSummary('lincoln')");
  ok("Sunday belongs to the week just ending", sun.weekStart === "2026-09-28" && sun.weekRuns === 2, [sun.weekStart, sun.weekRuns]);
  const el = w.call("msKidSummary('ellis')");
  ok("works for any kid (Ellis, a book with no list yet)", el.passed === 0 && el.avgToPass === null && el.cur === 501 && el.weekRuns === 1);
  ok("not set up → null + no card", w.call("msKidSummary('lucy')") === null && w.call("msKidSummaryHtml('lucy')") === "");
  ok("summary card shows the four numbers", /3\.5/.test(w.call("msKidSummaryHtml('lincoln')")) && /runs this week/.test(w.call("msKidSummaryHtml('lincoln')")));
}
console.log("\n── the pop-up ──");
{
  const w = world();
  w.call("msStatsOpen('lincoln',402)");
  const pop = w.body.find(e => e.id === "ms-stats-pop");
  ok("opens one overlay", pop && w.body.length === 1 && pop.className === "dlg-overlay");
  const h = pop.innerHTML;
  ok("names the kid + sprint + title", /Lincoln/.test(h) && /Sprint 402/.test(h) && /Count On or Back/.test(h));
  ok("shows every stat row", ["Total attempts", "Per sheet", "First attempt", "Latest attempt", "Pass date", "Days to pass", "Streak now"].every(x => h.includes(x)));
  ok("has the chart", /<svg/.test(h) && (h.match(/<rect/g) || []).length === 3);
  w.call("msStatsOpen('lincoln',401)");
  ok("re-opening replaces, never stacks", w.body.length === 1 && /Sprint 401/.test(w.body[0].innerHTML));
  w.call("msStatsClose()");
  ok("close removes it", w.body.length === 0);
  w.call("msStatsOpen('lincoln',404)");
  ok("untried sprint says so", /No attempts yet/.test(w.body[0].innerHTML));
  const k = world({ who: "kid" }); k.call("msStatsOpen('ellis',501)");
  ok("opens on a kid's device too", k.body.length === 1 && /Ellis/.test(k.body[0].innerHTML));
  const t = world({ state: { lincoln: { book: "sm-sprints-4", cur: 401, log: { 401: { runs: [R("2026-10-07", "a1", false)] } } } } });
  vm.runInContext("lbScansMS['sm-sprints-4'].lessons[0]='Sprint 401 · <b>x</b> & y'", t.ctx);
  t.call("msStatsOpen('lincoln',401)");
  ok("titles are escaped", !/<b>x/.test(t.body[0].innerHTML) && /&lt;b>x/.test(t.body[0].innerHTML));
}
console.log("\n── read-only ──");
{
  const w = world({ who: "mom" }); const before = JSON.stringify(w.call("mathSprints"));
  w.call("msSprintStats('lincoln',402); msKidSummary('lincoln'); msStatsOpen('lincoln',402); msStatsClose(); msKidSummaryHtml('lincoln'); msStatsOpen('lucy',1)");
  ok("no Firebase writes, even for Mom", w.writes.length === 0);
  ok("in-memory data untouched", JSON.stringify(w.call("mathSprints")) === before);
  const blk = src.slice(src.indexOf("// MSSTATS_START"), b);
  ok("the block has no db / ref / write calls", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(/.test(blk.replace(/ov\.remove\(\)/g, "")));
  ok("the book list's 📊 chip stops the row tap (the row tap moves the kid)", /event\.stopPropagation\(\);msStatsOpen\(/.test(src));
  ok("the book panel shows the summary card", /h\+=msKidSummaryHtml\(kid\)/.test(src));
  ok("no 🔀 added", !blk.includes("\u{1F500}"));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
