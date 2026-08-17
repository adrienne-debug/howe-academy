/*
 * Node tests for the week-generator catch-up placement logic.
 *
 * There's no build step for this app, so instead of importing, this extracts the
 * REAL gwCatchupExtraDates function text out of index.html and runs it against
 * stubbed globals (gwRules / currData / gwParseDate). That way the tests exercise
 * the actually-shipped code and fail if someone changes the placement rules.
 *
 *   run:  node test_catchup.js
 *
 * Covers: free-day fill, lightest-day spread, the doubling tier, cap 1 (never
 * doubles), the day-cap fit check, the daily-subject buffer, and want<=0.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// Pull a top-level `function NAME(...) { ... }` out of the source by brace-matching.
function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("function not found in index.html: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces extracting " + name);
}

// ── stubbed globals ──────────────────────────────────────────────────────────
// School 10:00–16:15 with lunch 13:00–13:30  ->  dayCap = 375 - 30 = 345 min.
const gwRules = () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 810 });
const gwParseDate = (s) => { const p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
const currData = { subjects: { ellis: {} } };

// A 2026-06-22 (Mon) .. 2026-06-26 (Fri) week.
const MON = "2026-06-22", TUE = "2026-06-23", WED = "2026-06-24", THU = "2026-06-25", FRI = "2026-06-26";

// 6c-2: gwCatchupExtraDates reads the ONE per-day cap via capFor (real fn) — max1 → cap 1.
const DEFAULT_DAY_CAP = 2;
const planBacked = () => false;
const gwCatchupExtraDates = new Function(
  "gwRules", "currData", "gwParseDate", "DEFAULT_DAY_CAP", "planBacked",
  extractFn("capFor") + "\n" + extractFn("gwCatchupExtraDates") + "; return gwCatchupExtraDates;"
)(gwRules, currData, gwParseDate, DEFAULT_DAY_CAP, planBacked);

// ── tiny harness ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}
const eqSet = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();

// Build a dayData where each listed day carries the given subject keys for ellis.
function mkDayData(perDay) {
  const dd = {};
  for (const d of Object.keys(perDay)) dd[d] = { ellis: {} };
  for (const d of Object.keys(perDay)) perDay[d].forEach((k) => { dd[d].ellis[k] = "x"; });
  return dd;
}
function setSubjects(map) { currData.subjects.ellis = map; }

// ── tests ────────────────────────────────────────────────────────────────────

// 1) 3-day subject behind 2 fills the two empty weekdays (no doubling).
(() => {
  setSubjects({ aas: { minutes: 25, rules: "sequential" }, mathx: { minutes: 30 }, sci: { minutes: 20 } });
  const dd = mkDayData({
    [MON]: ["mathx", "sci", "aas"], [TUE]: ["mathx", "sci"], [WED]: ["mathx", "sci", "aas"],
    [THU]: ["mathx", "sci"], [FRI]: ["mathx", "sci", "aas"],
  });
  const picks = gwCatchupExtraDates("ellis", "aas", currData.subjects.ellis.aas, [MON, WED, FRI], 2, dd);
  ok("free-day fill lands on the 2 empty days (Tue, Thu)", eqSet(picks, [TUE, THU]), JSON.stringify(picks));
})();

// 2) Lightest day first + even spread: 3 empty days of different loads, want 2 -> the 2 lightest.
(() => {
  setSubjects({ aas: { minutes: 20, rules: "sequential" }, big: { minutes: 100 }, mid: { minutes: 60 }, sm: { minutes: 30 } });
  // Tue heavy(100), Thu light(30), Fri mid(60); Mon/Wed hold aas already.
  const dd = mkDayData({ [MON]: ["aas"], [TUE]: ["big"], [WED]: ["aas"], [THU]: ["sm"], [FRI]: ["mid"] });
  const picks = gwCatchupExtraDates("ellis", "aas", currData.subjects.ellis.aas, [MON, WED], 2, dd);
  ok("picks the 2 lightest empty days (Thu then Fri, not heavy Tue)", eqSet(picks, [THU, FRI]), JSON.stringify(picks));
})();

// 3) 5-day sequential subject behind 2 doubles up on the 2 lightest days.
(() => {
  setSubjects({ ttrs: { minutes: 15, rules: "sequential" }, a: { minutes: 30 }, b: { minutes: 90 } });
  // loads: Mon 15, Tue 45, Wed 105, Thu 15, Fri 45  (ttrs everywhere + filler)
  const dd = mkDayData({
    [MON]: ["ttrs"], [TUE]: ["ttrs", "a"], [WED]: ["ttrs", "b"], [THU]: ["ttrs"], [FRI]: ["ttrs", "a"],
  });
  const picks = gwCatchupExtraDates("ellis", "ttrs", currData.subjects.ellis.ttrs, [MON, TUE, WED, THU, FRI], 2, dd);
  ok("5-day subject doubles on the 2 lightest days (Mon, Thu)", eqSet(picks, [MON, THU]), JSON.stringify(picks));
})();

// 4) max1 subject with no free day gets nothing (never doubles).
(() => {
  setSubjects({ reflex: { minutes: 15, cap: 1 }, a: { minutes: 30 } });
  const dd = mkDayData({ [MON]: ["reflex"], [TUE]: ["reflex"], [WED]: ["reflex"], [THU]: ["reflex"], [FRI]: ["reflex"] });
  const picks = gwCatchupExtraDates("ellis", "reflex", currData.subjects.ellis.reflex, [MON, TUE, WED, THU, FRI], 2, dd);
  ok("max1 never doubles (no free day -> [])", picks.length === 0, JSON.stringify(picks));
})();

// 5) Day-cap fit check: when every fitting day is exhausted, overflow rolls forward.
//    Use a max1 subject so there's no doubling fallback to mask the fit check.
(() => {
  setSubjects({ reflex: { minutes: 25, cap: 1 }, huge: { minutes: 330 } });
  // Free days Tue & Thu are both full (330) -> nothing fits; max1 can't double.
  const dd = mkDayData({ [MON]: ["reflex"], [TUE]: ["huge"], [WED]: ["reflex"], [THU]: ["huge"], [FRI]: ["reflex"] });
  const picks = gwCatchupExtraDates("ellis", "reflex", currData.subjects.ellis.reflex, [MON, WED, FRI], 2, dd);
  ok("over-cap days skipped, nothing fits -> [] (rolls forward)", picks.length === 0, JSON.stringify(picks));
})();

// 6) Daily-subject buffer: proven by contrast — the same borderline day is excluded WITH a
//    first/last subject present and kept WITHOUT it. max1 again, so no doubling interferes.
(() => {
  // dayCap 345; a 'first' notebook of 70 => effCap 275. Tue load 260 -> 260+25=285.
  setSubjects({ reflex: { minutes: 25, cap: 1 }, morning: { minutes: 70, rules: "first" }, l260: { minutes: 260 } });
  const ddBuf = mkDayData({ [MON]: ["reflex"], [TUE]: ["l260"], [WED]: ["reflex"], [FRI]: ["reflex"] });
  const withBuf = gwCatchupExtraDates("ellis", "reflex", currData.subjects.ellis.reflex, [MON, WED, FRI], 1, ddBuf);

  setSubjects({ reflex: { minutes: 25, cap: 1 }, l260: { minutes: 260 } }); // no daily subject
  const ddNo = mkDayData({ [MON]: ["reflex"], [TUE]: ["l260"], [WED]: ["reflex"], [FRI]: ["reflex"] });
  const noBuf = gwCatchupExtraDates("ellis", "reflex", currData.subjects.ellis.reflex, [MON, WED, FRI], 1, ddNo);

  ok("daily buffer excludes a borderline day (with-buf [] vs no-buf [Tue])",
     withBuf.length === 0 && eqSet(noBuf, [TUE]), "buf=" + JSON.stringify(withBuf) + " nobuf=" + JSON.stringify(noBuf));
})();

// 7) want<=0 short-circuits to [].
(() => {
  setSubjects({ aas: { minutes: 25, rules: "sequential" } });
  const dd = mkDayData({ [MON]: [], [TUE]: [] });
  ok("want<=0 returns []", gwCatchupExtraDates("ellis", "aas", currData.subjects.ellis.aas, [], 0, dd).length === 0);
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
