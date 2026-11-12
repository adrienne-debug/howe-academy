/*
 * PGDONE — a page book's relay starts at the first lesson NOT in its done records.
 *
 * Live case (2026-11-12): a kid's Math Reasoning B (pages mode, 4 pages a sitting, done records
 * by lesson id through p.52) was relaid from the Curriculum page and the grid came back starting
 * at pp. 5–8. The pages builder (cbBuildCfg → cbMaterialize) learned what was finished only from
 * checked task TITLES: her sittings were multi-page cards ("pp. 5–12", "pp. 21–28", "pp. 37–52")
 * that match no 4-page unit, and a carried card (id ending "_c") is never read as a title, so only
 * the three single-unit cards counted. The done records (curriculum/done, one per lesson id) were
 * right all along and never consulted.
 *
 * Replays that on a made-up family (kid_d) with the REAL sliced functions:
 *   (a) fixed code: relay lays pp. 53–56 first, on the next school day, then in order
 *   (b) nothing finished is re-laid — multi-page and carried sittings count (by id)
 *   (c) a re-patterned book (4 → 5 pages a sitting) skips every unit whose pages are all done
 *   (d) a subject WITHOUT done records (not stamped) keeps the title-tally path unchanged
 *   (e) the code before the fix (b562854, when git has it) reproduces the live bug
 *
 *   run:  node test_pages_done_relay.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const SRC = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function slicer(src) {
  return name => {
    const sig = "function " + name + "(";
    const i = src.indexOf(sig);
    if (i < 0) throw new Error("function not found: " + name);
    let d = 0;
    for (let k = src.indexOf("{", i); k < src.length; k++) {
      if (src[k] === "{") d++;
      else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
    }
    throw new Error("unbalanced braces: " + name);
  };
}
const FNS = ["_cbSpread", "_cbParseDate", "_cbISO", "_cbMonday", "cbMaterialize",
  "cbTodayISO", "cbFutureRows", "cbExtendInfo", "cbDayCap", "cbDefaultForm", "cbParsePattern", "cbBuildCfg",
  "lidsFor", "lidStamped", "lidDoneSet", "lidDoneIdx"];

// ── the made-up family's book: 315 pages, 4 a sitting → 79 lessons ─────────────
const SEQ = [];
for (let p = 1; p <= 315; p += 4) { const q = Math.min(p + 3, 315); SEQ.push("pp. " + p + "–" + q); }
const IDS = SEQ.map((_, i) => "L" + String(i + 1).padStart(4, "0"));
const DONE_THROUGH = 13;                         // pp. 1–4 … pp. 49–52
const TODAY = "2026-11-12";                      // Thursday, after the relay at 4:09 PM

function mkCurr(stamped) {
  const lessons = {};
  // school days Mon–Fri from Oct 5 2026 to Jul 30 2027, one grid row each
  let dn = 1;
  for (let t = Date.UTC(2026, 9, 5); t <= Date.UTC(2027, 6, 30); t += 864e5) {
    const d = new Date(t); const wd = d.getUTCDay(); if (wd === 0 || wd === 6) continue;
    lessons[dn] = { date: d.toISOString().slice(0, 10), week: "W" + Math.ceil(dn / 5) }; dn++;
  }
  // the grid before the relay: Mon/Wed/Fri cells ran ahead in 4-page steps
  let si = 0;
  Object.keys(lessons).map(Number).sort((a, b) => a - b).forEach(n => {
    const l = lessons[n]; const wd = new Date(l.date + "T12:00:00Z").getUTCDay();
    if ([1, 3, 5].includes(wd) && si < SEQ.length) l.math_b = SEQ[si++];
  });
  const subj = {
    display: "Math Reasoning B", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, minutes: 20,
    lessonSeq: SEQ.slice(), lessonIds: IDS.slice(), nextLid: 80, total: 79, rules: "sequential",
    pacing: { mode: "pages", tpw: 3, pages: { pattern: [4], startPage: 1, totalPages: 315, unitLabel: "pp." } },
  };
  if (stamped) subj.doneImportedAt = "2026-10-07T15:32:28.850Z";
  // done records as the check-offs wrote them: one per lesson id, several per multi-page card
  const card = ["t279", "t280_c", "t284", "t286a", "t286b", "t291", "t291", "t306", "t306", "t313", "t313", "t313", "t313"];
  const done = {};
  for (let i = 0; i < DONE_THROUGH; i++) done[IDS[i]] = { day: "2026-11-12", src: "check", taskId: card[i] };
  return { subjects: { kid_d: { math_b: subj } }, lessons: { kid_d: lessons }, done: stamped ? { kid_d: { math_b: done } } : {} };
}
// What the title path sees: checked, non-carried cards (the "_c" pp. 5–8 card is skipped there)
const TITLES = ["pp. 1–4", "pp. 5–12", "pp. 13–16", "pp. 17–20", "pp. 21–28", "pp. 29–36", "pp. 37–52"]
  .map(t => "📄 math reasoning b — " + t);

function relay(src, curr, patternStr) {
  const code = FNS.map(slicer(src)).join("\n");
  const env = {
    currData: curr, paceData: { subjects: {} },
    paceDoneTitles: () => TITLES.slice(), paceKeywords: () => ["math reasoning b"],
    ldPin: () => null, gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    smapIsKidOff: () => null, schedOvKidOff: () => null, schedOv: () => null, coopBlocksBase: () => false, _coopOff: () => false,
    gwParseDate: ds => new Date(ds + "T12:00:00"), dbg: null,
  };
  class Frozen extends Date {
    constructor(...a) { if (a.length === 0) super(TODAY + "T17:00:00"); else super(...a); }
    static now() { return new Date(TODAY + "T17:00:00").getTime(); }
  }
  env.Date = Frozen;
  const keys = Object.keys(env);
  const fn = new Function(...keys, "\"use strict\";let cbKid='kid_d',cbSubjKey='math_b',cbForm=null;" + code +
    ";cbForm=cbDefaultForm('kid_d','math_b');" + (patternStr ? "cbForm.patternStr=" + JSON.stringify(patternStr) + ";" : "") +
    "return cbMaterialize(cbBuildCfg());");
  return fn(...keys.map(k => env[k]));
}
const doneTexts = new Set(SEQ.slice(0, DONE_THROUGH));
const pagesOf = t => { const m = String(t).match(/(\d+)(?:–(\d+))?$/); return m ? [+m[1], m[2] ? +m[2] : +m[1]] : null; };

console.log("(a)(b) stamped page book — relay from the done records");
{
  const r = relay(SRC, mkCurr(true));
  ok("relay builds", r && !r.error, r && r.error);
  const A = (r.assignments || []);
  ok("first sitting laid is pp. 53–56", A[0] && A[0].text === "pp. 53–56", A[0]);
  ok("…on the next school day (Fri 2026-11-13)", A[0] && A[0].date === "2026-11-13", A[0] && A[0].date);
  ok("nothing finished is laid again", !A.some(a => doneTexts.has(a.text)), A.filter(a => doneTexts.has(a.text)).map(a => a.text));
  ok("no laid sitting starts at or before p.52", !A.some(a => (pagesOf(a.text) || [99])[0] <= 52));
  ok("pp. 37–52 (one multi-page card, four records) all counted", !A.some(a => ["pp. 37–40", "pp. 41–44", "pp. 45–48", "pp. 49–52"].includes(a.text)));
  ok("pp. 5–8 (checked on a carried card) counted", !A.some(a => a.text === "pp. 5–8"));
  ok("every unfinished lesson laid exactly once, in book order",
    JSON.stringify(A.map(a => a.text)) === JSON.stringify(SEQ.slice(DONE_THROUGH)), A.length);
  ok("last sitting is pp. 313–315", A.length && A[A.length - 1].text === "pp. 313–315");
}

console.log("(c) re-patterned to 5 pages a sitting — finished pages still skipped");
{
  const r = relay(SRC, mkCurr(true), "5");
  const A = (r.assignments || []);
  ok("relay builds", r && !r.error, r && r.error);
  ok("no laid unit is wholly inside pp. 1–52", !A.some(a => { const g = pagesOf(a.text); return g && g[1] <= 52; }), A.slice(0, 3).map(a => a.text));
  ok("first unit laid is pp. 51–55 (half-done units stay)", A[0] && A[0].text === "pp. 51–55", A[0] && A[0].text);
}

console.log("(d) no done records (not stamped) — title tally path unchanged");
{
  const r = relay(SRC, mkCurr(false));
  const A = (r.assignments || []);
  ok("relay builds", r && !r.error, r && r.error);
  ok("matching titles still dropped (pp. 1–4, 13–16, 17–20)", !A.some(a => ["pp. 1–4", "pp. 13–16", "pp. 17–20"].includes(a.text)));
  ok("first laid is pp. 5–8, as before the fix", A[0] && A[0].text === "pp. 5–8", A[0] && A[0].text);
}

console.log("(e) the code before the fix reproduces the live bug");
{
  let old = null;
  try { old = process.env.PGDONE_VS ? fs.readFileSync(process.env.PGDONE_VS, "utf8")
    : execSync("git show b562854:index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) {}
  if (!old) console.log("  (skipped: b562854 not in this checkout; set PGDONE_VS=<old index.html>)");
  else {
    const A = (relay(old, mkCurr(true)).assignments || []);
    ok("old code: first laid is pp. 5–8 (the grid she saw)", A[0] && A[0].text === "pp. 5–8", A[0] && A[0].text);
    ok("old code: re-lays pp. 21–24 … pp. 49–52", ["pp. 21–24", "pp. 37–40", "pp. 49–52"].every(t => A.some(a => a.text === t)));
  }
}

console.log("source pins");
ok("PGDONE block marked in cbBuildCfg", /PGDONE_START[\s\S]*lidDoneIdx\(kid,sk\)[\s\S]*PGDONE_END/.test(slicer(SRC)("cbBuildCfg")));
ok("cbMaterialize reads donePages", slicer(SRC)("cbMaterialize").includes("pg.donePages"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
