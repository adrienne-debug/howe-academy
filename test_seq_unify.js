/*
 * Slices the REAL buildSubjectLessons out of index.html and runs it over a lesson grid +
 * scheduleOverrides for every subject, asserting:
 *   - stale far-future "Extend" artifacts (added=true, no text) stay out
 *   - no existing sequence shifts while only bare artifacts are present
 *   - a removed cell actually leaves the sequence (when its content lives elsewhere)
 *   - a make-up cell with text actually joins it, in date order
 *
 * The July-2026 live snapshots this used to read are gone; the grid + overrides below are
 * SYNTHETIC, built to the same shape and the same story. Lincoln's MR5 grid, weekdays from
 * 2026-07-06: pp.176–211 in order, then pp.196–199 re-served on 07-20, 07-27, 08-03 and
 * 08-04 (the cursor ran 4 ahead), and the generator dealt pp.224+ from 08-05 — so
 * pp.212–223 exist NOWHERE in the grid. Jul 30/31 have no MR5 cell. 55 bare `added:true`
 * artifacts sit on far-future dates (and two on real grid dates).
 *   run: node test_seq_unify.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function fn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 200) : "")));

// ── synthetic world ──
const pp = n => "MR5 pp." + n + "–" + (n + 3);
function weekdays(startISO, n) {
  const out = []; const d = new Date(startISO + "T12:00:00");
  while (out.length < n) { const dow = d.getDay(); if (dow >= 1 && dow <= 5) out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
}
// 30 weekdays from 2026-07-06; null = no MR5 cell that day; "—"/"nan" = the grid's empties
const MR_GRID = [
  pp(176), pp(180), pp(184), pp(188), pp(192),     // 07-06..07-10
  pp(196), pp(200), pp(204), pp(208), "—",         // 07-13..07-17
  pp(196), null,    null,    null,    null,        // 07-20 dup; a light week
  pp(196), "nan",   "—",     null,    null,        // 07-27 dup; 07-30 + 07-31 free
  pp(196), pp(196), pp(224), pp(228), pp(232),     // 08-03 dup, 08-04 dup, then 224+
  pp(236), pp(240), pp(244), pp(248), pp(252),     // 08-10..08-14
];
const SING = i => "5B Ch." + (1 + Math.floor(i / 4)) + " L" + (1 + (i % 4));
const lessonsLin = {};
weekdays("2026-07-06", MR_GRID.length).forEach((date, i) => {
  const e = { date, week: 12 + Math.floor(i / 5), singapore_l: SING(i), aas: i % 2 ? "AAS Step " + (10 + i) : "—" };
  if (MR_GRID[i] !== null) e.mr_pages = MR_GRID[i];
  lessonsLin[String(187 + i)] = e;
});
const subjects = {
  lincoln: {
    mr_pages:    { display: "MR5 Math Reasoning", rules: "sequential", total: 142 },
    singapore_l: { display: "Singapore",          rules: "sequential", total: 58 },
    aas:         { display: "AAS",                rules: "sequential", total: 40 },
  },
};
// 55 bare "Extend" artifacts: 53 on far-future dates + 2 on real grid dates (07-21, 08-06)
const ARTIFACT_DATES = weekdays("2027-01-04", 53).concat(["2026-07-21", "2026-08-06"]);
const overrides = {};
ARTIFACT_DATES.forEach(d => { overrides[d] = { lincoln: { added: { mr_pages: true } } }; });

globalThis.currData = { subjects, lessons: { lincoln: lessonsLin } };
globalThis.scheduleOverrides = overrides;
eval(fn("schedOv"));
eval(fn("buildSubjectLessons"));

// A pre-unification reference: the raw grid, overrides ignored.
function rawSeq(kid, sk) {
  const lessons = currData.lessons[kid] || {};
  const out = [];
  Object.keys(lessons).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b).forEach(dn => {
    const e = lessons[dn]; if (!e) return;
    const v = e[sk];
    if (v && v !== "—" && v !== "nan" && String(v).trim()) out.push({ dayNum: dn, lesson: v, date: e.date || "" });
  });
  return out;
}

console.log("Sequence = grid + overrides, on Lincoln's data\n");

const lincolnSubjects = Object.keys(subjects.lincoln || {});
let shifted = [];
lincolnSubjects.forEach(sk => {
  const before = rawSeq("lincoln", sk).map(x => x.lesson).join("|");
  const after  = buildSubjectLessons("lincoln", sk).map(x => x.lesson).join("|");
  if (before !== after) shifted.push({ sk, beforeN: before.split("|").filter(Boolean).length, afterN: after.split("|").filter(Boolean).length });
});
ok("no sequence changes (the 55 artifacts carry no text)", shifted.length === 0, shifted);
ok("the grid's '—' and 'nan' cells are not lessons", buildSubjectLessons("lincoln", "mr_pages").length === 21);

// Those artifacts really are bare `true`
let bareAdds = 0, textAdds = 0;
Object.values(overrides).forEach(kids => Object.values(kids || {}).forEach(v => {
  Object.values((v || {}).added || {}).forEach(val => { typeof val === "string" && val.trim() ? textAdds++ : bareAdds++; });
}));
console.log("  make-up slots in the data: " + bareAdds + " bare, " + textAdds + " with text");
ok("all 55 make-up slots are bare placeholders", bareAdds === 55 && textAdds === 0, { bareAdds, textAdds });

// ── behaviour that used to be impossible ──
console.log("\nremoving a cell now leaves the sequence");
const mrBefore = buildSubjectLessons("lincoln", "mr_pages");
const dupDate = "2026-07-20";   // one of the four duplicate pp.196-199 cells
ok("pp.196-199 appears 5x before the removal (its slot + 4 re-serves)",
   mrBefore.filter(x => x.lesson === "MR5 pp.196–199").length === 5,
   mrBefore.filter(x => x.lesson === "MR5 pp.196–199").length);

scheduleOverrides[dupDate] = scheduleOverrides[dupDate] || {};
scheduleOverrides[dupDate].lincoln = { removed: { mr_pages: true } };
const mrAfterRm = buildSubjectLessons("lincoln", "mr_pages");
ok("removing the Jul 20 duplicate drops it from the sequence",
   mrAfterRm.length === mrBefore.length - 1, { before: mrBefore.length, after: mrAfterRm.length });
ok("...and only 4 copies of pp.196-199 remain",
   mrAfterRm.filter(x => x.lesson === "MR5 pp.196–199").length === 4);
ok("...other subjects on Jul 20 are untouched",
   buildSubjectLessons("lincoln", "singapore_l").length === rawSeq("lincoln", "singapore_l").length);

// 2026-08-05 rule: a removed slot removes the DAY, not the LESSON. Content that exists
// nowhere else stays in the sequence, slotless, instead of silently vanishing.
console.log("\nremoving a cell whose content lives nowhere else keeps the LESSON");
scheduleOverrides["2026-08-10"] = { lincoln: { removed: { mr_pages: true } } };   // pp.236-239, unique
const mrRmUnique = buildSubjectLessons("lincoln", "mr_pages");
const kept236 = mrRmUnique.find(x => x.lesson === pp(236));
ok("pp.236-239 is still in the sequence", !!kept236);
ok("...flagged slotRemoved, in its original position", kept236 && kept236.slotRemoved === true && kept236.date === "2026-08-10");
delete scheduleOverrides["2026-08-10"];

console.log("\nTHE ACTUAL REPAIR: drop all 4 duplicates, insert the 3 missing ranges");
// the remaining three duplicate cells
[["2026-07-27", "mr_pages"], ["2026-08-03", "mr_pages"], ["2026-08-04", "mr_pages"]].forEach(([d]) => {
  scheduleOverrides[d] = scheduleOverrides[d] || {};
  scheduleOverrides[d].lincoln = Object.assign({}, scheduleOverrides[d].lincoln, { removed: { mr_pages: true } });
});
// the three ranges that exist nowhere in his grid, as make-up slots on free dates
scheduleOverrides["2026-07-30"] = { lincoln: { added: { mr_pages: "MR5 pp.212–215" } } };
scheduleOverrides["2026-07-31"] = { lincoln: { added: { mr_pages: "MR5 pp.216–219" } } };
scheduleOverrides["2026-08-04"].lincoln.added = { mr_pages: "MR5 pp.220–223" };

const repaired = buildSubjectLessons("lincoln", "mr_pages").map(x => x.lesson);
const from192 = repaired.slice(repaired.indexOf("MR5 pp.192–195"), repaired.indexOf("MR5 pp.192–195") + 10);
console.log("  " + from192.join("  →  "));

ok("no duplicate lessons remain anywhere in the sequence",
   new Set(repaired).size === repaired.length,
   repaired.filter((v, i) => repaired.indexOf(v) !== i));
ok("the sequence runs 192 → 196 → 200 → 204 → 208 → 212 → 216 → 220 → 224, in order",
   from192.slice(0, 9).join("|") === [
     "MR5 pp.192–195", "MR5 pp.196–199", "MR5 pp.200–203", "MR5 pp.204–207",
     "MR5 pp.208–211", "MR5 pp.212–215", "MR5 pp.216–219", "MR5 pp.220–223",
     "MR5 pp.224–227"].join("|"),
   from192.slice(0, 9));
ok("the three inserted ranges are flagged as make-ups",
   buildSubjectLessons("lincoln", "mr_pages")
     .filter(x => ["MR5 pp.212–215", "MR5 pp.216–219", "MR5 pp.220–223"].includes(x.lesson))
     .every(x => x.madeUp === true));
ok("a remove+add on the same date (Aug 4) yields the make-up alone",
   buildSubjectLessons("lincoln", "mr_pages").filter(x => x.date === "2026-08-04").map(x => x.lesson).join("|") === "MR5 pp.220–223");
ok("the repaired sequence is 21 - 4 + 3 = 20 long", repaired.length === 20, repaired.length);
// Where the repaired sequence puts each lesson (0-based = the cursor value that serves it)
["MR5 pp.204–207","MR5 pp.208–211","MR5 pp.212–215"].forEach(function(t){
  console.log("    " + t + " sits at sequence position " + repaired.indexOf(t));
});
ok("pp.212-215 now serves at cursor 9 (right after pp.208-211 at 8)",
   repaired.indexOf("MR5 pp.208–211") === 8 && repaired.indexOf("MR5 pp.212–215") === 9);

console.log("\na bare make-up slot is still ignored");
scheduleOverrides["2026-08-05"] = scheduleOverrides["2026-08-05"] || { lincoln: { added: { mr_pages: true } } };
const beforeBare = buildSubjectLessons("lincoln", "mr_pages").length;
scheduleOverrides["2026-08-06"] = { lincoln: { added: { mr_pages: true } } };
ok("added=true adds nothing", buildSubjectLessons("lincoln", "mr_pages").length === beforeBare);
scheduleOverrides["2026-08-07"] = { lincoln: { added: { mr_pages: "   " } } };
ok("added='   ' (whitespace) adds nothing either", buildSubjectLessons("lincoln", "mr_pages").length === beforeBare);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
