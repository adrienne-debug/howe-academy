/*
 * The rebuild bug: cbSplitCells decided "finished" by index (i<doneN) instead of by
 * check-off, so a completed past cell was filed as STALE and copied forward — a duplicate —
 * while an unfinished cell below the line was treated as done and skipped.
 * Replays Lincoln's REAL MR5 grid + archive.
 *   run: node test_rebuild_donecells.js
 */
const fs = require("fs");
const S = "/private/tmp/claude-501/-Users-adriennehowe/ce8e1d3a-c7a7-40c9-98a5-4cea32fb95a2/scratchpad/";
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");

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

globalThis.archive = JSON.parse(fs.readFileSync(S + "arch.json", "utf8"));
globalThis.currData = {
  subjects: JSON.parse(fs.readFileSync(S + "subj.json", "utf8")),
  lessons: JSON.parse(fs.readFileSync(S + "lessons_all.json", "utf8")),
};
globalThis.paceData = { subjects: {} };
globalThis.WK = "week16";
globalThis.weekData = { tasks: [] };
globalThis.checked = {};
globalThis.currFirstWeekNum = () => 0;
globalThis.chainDone = (id, ch) => !!ch[id];
eval(cb("PACE_ALT_KEYWORDS"));
eval(fn("currKeyword")); eval(fn("paceKeywords")); eval(fn("paceDoneTitles"));
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

console.log("Lincoln MR5 — rebuild split, real grid + real check-offs\n");
ok("grid has 142 cells", cells.length === 142, cells.length);
ok("21 cells are genuinely checked off", doneSet && doneSet.size === 21, doneSet && doneSet.size);

// The four duplicate cells, by date
const DUPES = ["2026-07-20", "2026-07-27", "2026-08-03", "2026-08-04"];
const dupIdx = DUPES.map(d => cells.findIndex(c => c.date === d));
ok("found all 4 duplicate cells", dupIdx.every(i => i >= 0), dupIdx);
ok("every duplicate is recognised as DONE (so it won't be copied forward)",
   dupIdx.every(i => doneSet.has(i)), dupIdx.map(i => doneSet.has(i)));

// ── the bug has TWO directions; the cutoff hits one or the other depending on doneN ──
// (a) DUPLICATION — an earlier rebuild, when the count sat around his mid-July position.
//     Finished cells ABOVE the cutoff get filed stale and copied forward.
const EARLY_DONE_N = 16;
const earlySplit = cbSplitCells(cells, EARLY_DONE_N, TODAY);
const earlyNew   = cbSplitCells(cells, EARLY_DONE_N, TODAY, doneSet);
const staleButDone = earlySplit.stale.filter(c => doneSet.has(cells.indexOf(c)));
console.log("\n  (a) duplication, at doneN=" + EARLY_DONE_N);
console.log("      old: " + earlySplit.stale.length + " stale, of which " + staleButDone.length + " ALREADY FINISHED");
console.log("      new: " + earlyNew.stale.length + " stale, of which " +
            earlyNew.stale.filter(c => doneSet.has(cells.indexOf(c))).length + " already finished");
ok("old cutoff files FINISHED lessons as stale → copied forward → duplicates",
   staleButDone.length > 0, staleButDone.slice(0, 4).map(c => c.text));
ok("check-off split files none of them",
   earlyNew.stale.every(c => !doneSet.has(cells.indexOf(c))));

// (b) SKIPPING — today's inflated count. Unfinished cells BELOW the cutoff vanish.
const OLD_DONE_N = 31;
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
   !oldSplit.stale.some(c => c.text === "MR5 pp.204–207"));

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

console.log("\nAUDIT: the big backlog jumps are REAL, not a matcher failure");
// I very nearly reverted this fix over ellis/ttrs_e (15 of 31 completions matched) and
// lucy/fast_phon (14 of 30), reading the ratio as a half-broken matcher. It isn't: the
// unmatched completions are work done BEFORE the current grid begins (Ellis's Level 4,
// Lucy's Peak 10), which has no cell to match. The tell is that matches form a contiguous
// prefix and nothing matches after the first gap — the shape of a kid working in order and
// stopping. If a future change breaks the matching, that property breaks with it.
["ttrs_e", "fast_phon"].forEach(sk => {
  const kid = sk === "ttrs_e" ? "ellis" : "lucy";
  const cs = cellsFor(kid, sk);
  const ds = cbDoneCellSet(kid, sk, cs);
  ok(kid + "/" + sk + ": matcher returns a usable answer", ds instanceof Set && ds.size > 0, ds && ds.size);
  const idx = [...ds].sort((a, b) => a - b);
  const firstGap = idx.length ? idx[idx.length - 1] + 1 : 0;
  const afterGap = idx.filter(i => i > firstGap).length;
  ok(kid + "/" + sk + ": matches are a contiguous prefix (0.." + (firstGap - 1) + ")",
     idx.length === firstGap && afterGap === 0, { matched: idx.length, firstGap });
});

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
