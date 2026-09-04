/*
 * The rebuild bug: cbSplitCells decided "finished" by index (i<doneN) instead of by
 * check-off, so a completed past cell was filed as STALE and copied forward — a duplicate —
 * while an unfinished cell below the line was treated as done and skipped.
 *
 * The July-2026 live snapshots this used to replay are gone; the grid + archive below are
 * SYNTHETIC, built to the same shape and the same story:
 *   - a 30-cell Lincoln MR5 grid, weekdays 2026-07-06 → 2026-08-14, TODAY = 2026-08-03
 *   - pp.196–199 sits on 5 cells (its real slot 07-13 + re-served on 07-20, 07-27, 08-03, 08-04)
 *   - 10 distinct lessons genuinely checked off; pp.204–215 and pp.232–247 left undone in the
 *     past; pp.176–179's check is Lucy's LOE 43 riding his card (a phantom, see _archTrueRec)
 *   - Lucy NZK: task titles "Quest 41" vs grid "Q41-42" — the matcher must say "can't tell"
 *   - Ellis TTRS + Lucy Fast Phonics: half their completions predate the grid (Level 4 /
 *     Peak 10), so the matched cells must form a contiguous prefix and nothing more
 *   run: node test_rebuild_donecells.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function fn(n) {
  const i = src.indexOf("function " + n + "(");
  if (i < 0) throw new Error("not found: " + n);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}
function cb(n) {
  const i = src.indexOf("const " + n + "=");
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return "globalThis." + n + "=" + src.slice(src.indexOf("{", i), k + 1) + ";"; }
  }
}

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 180) : "")));

// ── synthetic world ──
const PG = "\u{1F4C4}";
// weekday dates from a Monday, N of them
function weekdays(startISO, n) {
  const out = []; const d = new Date(startISO + "T12:00:00");
  while (out.length < n) { const dow = d.getDay(); if (dow >= 1 && dow <= 5) out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
}
// grid: {dayNum: {date, week, sk: text}} from an ordered list of texts (null = no cell that day)
function mkGrid(kid, sk, startISO, texts, dayNum0) {
  const g = {}; const ds = weekdays(startISO, texts.length);
  texts.forEach((t, i) => { const e = { date: ds[i], week: 10 + Math.floor(i / 5) }; if (t) e[sk] = t; g[String(dayNum0 + i)] = e; });
  return g;
}
// archive weeks: [label, [[id, who, title, checked, historyOverride], ...]]
function mkArchive(weeks) {
  const out = {};
  weeks.forEach(([label, rows]) => {
    const aw = { weekLabel: label, tasks: [], checked: {}, history: {} };
    rows.forEach(([id, who, title, done, hist]) => {
      aw.tasks.push({ id, who, title, day: "monday", time: "9:00 AM" });
      if (done) { aw.checked[id] = "ts"; aw.history[id] = Object.assign({ who, title, ts: "ts" }, hist || {}); }
    });
    out[label] = aw;
  });
  return out;
}
const pp = n => "MR5 pp." + n + "–" + (n + 3);
const MR = n => PG + " MR5 Math Reasoning — " + pp(n);

const MR_GRID = [
  pp(176), pp(180), pp(184), pp(188), pp(192),          // 07-06..07-10  idx 0-4
  pp(196), pp(200), pp(204), pp(208), pp(212),          // 07-13..07-17  idx 5-9
  pp(196), pp(216), pp(220), pp(224), pp(228),          // 07-20 (dup)   idx 10-14
  pp(196), pp(232), pp(236), pp(240), pp(244),          // 07-27 (dup)   idx 15-19
  pp(196), pp(196), pp(248), pp(252), pp(256),          // 08-03 (dup, TODAY), 08-04 (dup)  idx 20-24
  pp(260), pp(264), pp(268), pp(272), pp(276),          // 08-10..08-14  idx 25-29
];
// what Lincoln actually finished (history records on his cards)
const MR_DONE = [180, 184, 188, 192, 196, 200, 216, 220, 224, 228];

let _n = 0; const tid = () => "t" + (++_n);
globalThis.archive = mkArchive([
  ["week12", [
    [tid(), "lincoln", MR(176), true, { who: "lucy", title: "\u{1F4D6} LOE Essentials — LOE 43" }],   // PHANTOM
    ...[180, 184, 188, 192].map(n => [tid(), "lincoln", MR(n), true]),
  ]],
  ["week13", [
    [tid(), "lincoln", MR(196), true], [tid(), "lincoln", MR(200), true],
    [tid(), "lincoln", MR(204), false], [tid(), "lincoln", MR(208), false],      // never checked
  ]],
  ["week14", [
    ...[196, 196, 196].map(n => [tid(), "lincoln", MR(n), true]),                 // the smeared repeats
    ...[216, 220, 224, 228].map(n => [tid(), "lincoln", MR(n), true]),
    // Lucy NZK: her titles never contain her grid's "Q41-42"
    [tid(), "lucy", "\u{1F981} NZK — Quest 41", true], [tid(), "lucy", "\u{1F981} NZK — Quest 42", true],
    // Ellis TTRS: Level 4 (before the current grid) + the first 5 of Level 5
    ...[20, 21, 22, 23, 24, 25].map(n => [tid(), "ellis", PG + " TTRS — TTRS Level 4 L" + n, true]),
    ...["01", "02", "03", "04", "05"].map(n => [tid(), "ellis", PG + " TTRS — TTRS Level 5 L" + n, true]),
    // Lucy Fast Phonics: Peak 10 (before the grid) + the first 3 of Peak 11
    ...["05", "06", "07", "08"].map(n => [tid(), "lucy", PG + " Fast Phonics — Fast Phonics Peak 10 L" + n, true]),
    ...["01", "02", "03"].map(n => [tid(), "lucy", PG + " Fast Phonics — Fast Phonics Peak 11 L" + n, true]),
  ]],
]);
globalThis.currData = {
  subjects: {
    lincoln: { mr_pages: { display: "MR5 Math Reasoning", rules: "sequential", total: 142 } },
    lucy:    { nzk_l: { display: "NZK", rules: "sequential", total: 60 },
               fast_phon: { display: "Fast Phonics", rules: "sequential", total: 120 } },
    ellis:   { ttrs_e: { display: "TTRS", rules: "sequential", total: 200 } },
  },
  lessons: {
    lincoln: mkGrid("lincoln", "mr_pages", "2026-07-06", MR_GRID, 187),
    lucy: Object.assign(
      mkGrid("lucy", "nzk_l", "2026-07-06", ["Q41-42", "Q43-44", "Q45-46", "Q47-48", "Q49-50", "Q51-52", "Q53-54", "Q55-56", "Q57-58", "Q59-60", "Q61-62", "Q63-64"], 187),
      mkGrid("lucy", "fast_phon", "2026-07-20", ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"].map(n => "Fast Phonics Peak 11 L" + n), 300)),
    ellis: mkGrid("ellis", "ttrs_e", "2026-07-06", ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(n => "TTRS Level 5 L" + n), 187),
  },
};
globalThis.paceData = { subjects: {} };
globalThis.WK = "week16";
globalThis.weekData = { tasks: [] };
globalThis.checked = {};
globalThis.currFirstWeekNum = () => 0;
globalThis.chainDone = (id, ch) => !!ch[id];
eval(cb("PACE_ALT_KEYWORDS"));
eval(fn("currKeyword")); eval(fn("paceKeywords"));
eval(fn("_mdText")); eval(fn("_paceManualTitles"));    // paceDoneTitles folds hand-marks in (Stage 4)
eval(fn("_archCheckedId")); eval(fn("_archTrueRec"));   // archived work counts from its history record (2026-08-06)
eval(fn("paceDoneTitles"));
eval(fn("cbDoneCellSet")); eval(fn("cbSplitCells"));

function cellsFor(kid, sk) {
  const L = currData.lessons[kid] || [];
  const out = [];
  Object.keys(L).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b).forEach(dn => {
    const l = L[dn], v = l && l[sk];
    if (v && v !== "—" && v !== "nan" && String(v).trim()) out.push({ dayNum: dn, date: l.date || "", text: String(v) });
  });
  return out;
}

const TODAY = "2026-08-03";
const cells = cellsFor("lincoln", "mr_pages");
const doneSet = cbDoneCellSet("lincoln", "mr_pages", cells);

console.log("Lincoln MR5 — rebuild split, grid + check-offs\n");
ok("grid has 30 cells", cells.length === 30, cells.length);
// 10 distinct finished lessons, but pp.196-199 occupies 5 cells and every one of them
// matches its title → 14 cells. Archived work counts from its history record
// (_archTrueRec): pp.176-179's check was Lucy's LOE 43 on Lincoln's card — he never did
// those pages, so that cell is correctly not "done" and gets re-served.
ok("14 cells are genuinely checked off", doneSet && doneSet.size === 14, doneSet && doneSet.size);
ok("the phantom pp.176-179 is not in the done set", (() => {
  const i = cells.findIndex(c => c.text.includes("176"));
  return i >= 0 && !doneSet.has(i);
})(), true);
ok("nothing unfinished is in the done set", [204, 208, 212, 232, 236, 240, 244].every(n => !doneSet.has(cells.findIndex(c => c.text === pp(n)))));

// The four duplicate cells, by date
const DUPES = ["2026-07-20", "2026-07-27", "2026-08-03", "2026-08-04"];
const dupIdx = DUPES.map(d => cells.findIndex(c => c.date === d));
ok("found all 4 duplicate cells", dupIdx.every(i => i >= 0), dupIdx);
ok("every duplicate is recognised as DONE (so it won't be copied forward)",
   dupIdx.every(i => doneSet.has(i)), dupIdx.map(i => doneSet.has(i)));

// ── the bug has TWO directions; the cutoff hits one or the other depending on doneN ──
// (a) DUPLICATION — an earlier rebuild, when the count sat around his mid-July position.
//     Finished cells ABOVE the cutoff get filed stale and copied forward.
const EARLY_DONE_N = 8;
const earlySplit = cbSplitCells(cells, EARLY_DONE_N, TODAY);
const earlyNew   = cbSplitCells(cells, EARLY_DONE_N, TODAY, doneSet);
const staleButDone = earlySplit.stale.filter(c => doneSet.has(cells.indexOf(c)));
console.log("\n  (a) duplication, at doneN=" + EARLY_DONE_N);
console.log("      old: " + earlySplit.stale.length + " stale, of which " + staleButDone.length + " ALREADY FINISHED");
console.log("      new: " + earlyNew.stale.length + " stale, of which " +
            earlyNew.stale.filter(c => doneSet.has(cells.indexOf(c))).length + " already finished");
ok("old cutoff files FINISHED lessons as stale → copied forward → duplicates",
   staleButDone.length > 0, staleButDone.slice(0, 4).map(c => c.text));
// idx 10 (dup 196), 11-14 (216-228), 15 (dup 196) all sit above the cutoff, all finished
ok("...six of them here: the Jul 20/27 duplicates and pp.216–231", staleButDone.length === 6, staleButDone.map(c => c.text));
ok("check-off split files none of them",
   earlyNew.stale.every(c => !doneSet.has(cells.indexOf(c))));
ok("check-off split re-serves the phantom pp.176–179 (it was never done)",
   earlyNew.stale.some(c => c.text === pp(176)));

// (b) SKIPPING — today's inflated count. Unfinished cells BELOW the cutoff vanish.
const OLD_DONE_N = 18;
const oldSplit = cbSplitCells(cells, OLD_DONE_N, TODAY);
const newSplit = cbSplitCells(cells, OLD_DONE_N, TODAY, doneSet);
console.log("\n  (b) skipping, at doneN=" + OLD_DONE_N);
console.log("      old positional split : " + oldSplit.stale.length + " stale");
console.log("      new check-off split  : " + newSplit.stale.length + " stale");
ok("new split files no finished lesson as stale",
   newSplit.stale.every(c => !doneSet.has(cells.indexOf(c))));
ok("new split still carries the genuinely unfinished past work",
   newSplit.stale.some(c => c.text === "MR5 pp.204–207") &&
   newSplit.stale.some(c => c.text === "MR5 pp.208–211"),
   newSplit.stale.slice(0, 6).map(c => c.text));
ok("old split SKIPPED pp.204–207 and pp.208–211 (below the cutoff, though unfinished)",
   !oldSplit.stale.some(c => c.text === "MR5 pp.204–207") && !oldSplit.stale.some(c => c.text === "MR5 pp.208–211"));
ok("new split's stale set is exactly the undone past cells",
   newSplit.stale.map(c => c.text).join("|") === [176, 204, 208, 212, 232, 236, 240, 244].map(pp).join("|"),
   newSplit.stale.map(c => c.text));
ok("today's finished duplicate is neither stale nor a today-cell",
   !newSplit.stale.some(c => c.date === TODAY) && newSplit.todayCells.length === 0);

// ── the fallback that stops Lucy being reset ──
console.log("\nLucy NZK — grid text and task titles disagree");
const lucyCells = cellsFor("lucy", "nzk_l");
const lucySet = cbDoneCellSet("lucy", "nzk_l", lucyCells);
ok("returns null so the caller keeps the old behaviour", lucySet === null, lucySet && lucySet.size);
const lucySplit = cbSplitCells(lucyCells, 9, TODAY, lucySet);
const lucyPositional = cbSplitCells(lucyCells, 9, TODAY);
ok("her split is byte-identical to before",
   JSON.stringify(lucySplit) === JSON.stringify(lucyPositional));

console.log("\nno done-set = exactly the old behaviour (nothing changes silently)");
ok("undefined doneSet falls back to i<doneN",
   JSON.stringify(cbSplitCells(cells, 5, TODAY)) === JSON.stringify(cbSplitCells(cells, 5, TODAY, undefined)));
// A subject with NO completions and a hand OFFSET: "finished before tracking" is a real,
// usable answer — the first `offset` cells are done, and the rest are not.
ok("a pace OFFSET pre-fills the done set without any check-off", (() => {
  currData.subjects.lincoln.aas = { display: "AAS", rules: "sequential", total: 40 };
  paceData.subjects.lincoln = { aas: { offset: 3, adjust: 0, paceAdjust: 0, total: 40 } };
  const aasCells = ["Step 01", "Step 02", "Step 03", "Step 04", "Step 05"].map((t, i) => ({ dayNum: 500 + i, date: "2026-07-0" + (6 + i), text: "AAS " + t }));
  const s = cbDoneCellSet("lincoln", "aas", aasCells);
  delete paceData.subjects.lincoln; delete currData.subjects.lincoln.aas;
  return s instanceof Set && s.size === 3 && s.has(0) && s.has(2) && !s.has(3);
})(), true);
// ...but an offset PLUS completions that match nothing is still "can't tell" (null): the
// caller's positional fallback carries the offset through doneN instead.
ok("offset + unmatchable titles = null, not a half answer", (() => {
  paceData.subjects.lucy = { nzk_l: { offset: 3, adjust: 0, paceAdjust: 0, total: 60 } };
  const s = cbDoneCellSet("lucy", "nzk_l", lucyCells);
  delete paceData.subjects.lucy;
  return s === null;
})(), true);

console.log("\nAUDIT: the big backlog jumps are REAL, not a matcher failure");
// I very nearly reverted this fix over ellis/ttrs_e (15 of 31 completions matched) and
// lucy/fast_phon (14 of 30), reading the ratio as a half-broken matcher. It isn't: the
// unmatched completions are work done BEFORE the current grid begins (Ellis's Level 4,
// Lucy's Peak 10), which has no cell to match. The tell is that matches form a contiguous
// prefix and nothing matches after the first gap — the shape of a kid working in order and
// stopping. If a future change breaks the matching, that property breaks with it.
[["ttrs_e", 5], ["fast_phon", 3]].forEach(([sk, expect]) => {
  const kid = sk === "ttrs_e" ? "ellis" : "lucy";
  const cs = cellsFor(kid, sk);
  const ds = cbDoneCellSet(kid, sk, cs);
  ok(kid + "/" + sk + ": matcher returns a usable answer", ds instanceof Set && ds.size > 0, ds && ds.size);
  const idx = [...ds].sort((a, b) => a - b);
  const firstGap = idx.length ? idx[idx.length - 1] + 1 : 0;
  const afterGap = idx.filter(i => i > firstGap).length;
  ok(kid + "/" + sk + ": matches are a contiguous prefix (0.." + (firstGap - 1) + ")",
     idx.length === firstGap && afterGap === 0, { matched: idx.length, firstGap });
  ok(kid + "/" + sk + ": only the current-level completions matched (" + expect + ")", idx.length === expect, idx.length);
});

console.log("\nREGRESSION (2026-09-04): a finished title names ONE lesson — never a substring match");
// The old test was `title.includes(cellText)`, so with only "5B Ch.1 L10" finished the
// unfinished cell "5B Ch.1 L1" read as done (every chapter with ten or more lessons), the
// rebuild split never filed it stale, and the lesson was silently skipped.
(() => {
  currData.subjects.lincoln.singapore_l = { display: "Singapore Math", rules: "sequential", total: 130 };
  const SG = t => PG + " Singapore Math — " + t;
  archive.week15 = mkArchive([["week15", [[tid(), "lincoln", SG("5B Ch.1 L10"), true], [tid(), "lincoln", SG("MR5 pp.196–199"), true], [tid(), "lincoln", SG("5B Ch.1 L5"), true]]]]).week15;
  const sgCells = ["5B Ch.1 L1", "5B Ch.1 L10", "5B Ch.1 L2", "MR5 pp.196-199", "5B  Ch.1 L5", "5B Ch.1 L100"].map((t, i) => ({ dayNum: 600 + i, date: "2026-07-0" + (6 + i), text: t }));
  const s = cbDoneCellSet("lincoln", "singapore_l", sgCells);
  ok("'5B Ch.1 L1' is NOT done when only L10 is finished", s instanceof Set && !s.has(0), s && [...s]);
  ok("'5B Ch.1 L10' itself IS done", s instanceof Set && s.has(1));
  ok("'5B Ch.1 L2' untouched, 'L100' untouched", s instanceof Set && !s.has(2) && !s.has(5));
  ok("dash variants still match (cell 'pp.196-199' vs title 'pp.196–199')", s instanceof Set && s.has(3));
  ok("whitespace variants still match (cell '5B  Ch.1 L5' vs title '5B Ch.1 L5')", s instanceof Set && s.has(4));
  delete archive.week15; delete currData.subjects.lincoln.singapore_l;
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
