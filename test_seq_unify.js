/*
 * Slices the REAL buildSubjectLessons out of index.html and runs it over the LIVE lesson
 * grid + scheduleOverrides for every kid and subject, asserting:
 *   - the 55 stale far-future "Extend" artifacts (added=true, no text) stay out
 *   - no existing sequence shifts (nothing real is overridden today)
 *   - a removed cell actually leaves the sequence
 *   - a make-up cell with text actually joins it, in date order
 *   run: node test_seq_unify.js
 */
const fs = require("fs");
const S = "/private/tmp/claude-501/-Users-adriennehowe/ce8e1d3a-c7a7-40c9-98a5-4cea32fb95a2/scratchpad/";
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");

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

const lessonsLin = JSON.parse(fs.readFileSync(S + "lessons_lin.json", "utf8"));
const subjects   = JSON.parse(fs.readFileSync(S + "subj.json", "utf8"));
const overrides  = JSON.parse(fs.readFileSync(S + "ovr.json", "utf8"));

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

console.log("Sequence = grid + overrides, on Lincoln's live data\n");

const lincolnSubjects = Object.keys(subjects.lincoln || {});
let shifted = [];
lincolnSubjects.forEach(sk => {
  const before = rawSeq("lincoln", sk).map(x => x.lesson).join("|");
  const after  = buildSubjectLessons("lincoln", sk).map(x => x.lesson).join("|");
  if (before !== after) shifted.push({ sk, beforeN: before.split("|").filter(Boolean).length, afterN: after.split("|").filter(Boolean).length });
});
ok("no live sequence changes (the 55 artifacts carry no text)", shifted.length === 0, shifted);

// Those artifacts really are bare `true`
let bareAdds = 0, textAdds = 0;
Object.values(overrides).forEach(kids => Object.values(kids || {}).forEach(v => {
  Object.values((v || {}).added || {}).forEach(val => { typeof val === "string" && val.trim() ? textAdds++ : bareAdds++; });
}));
console.log("  make-up slots in live data: " + bareAdds + " bare, " + textAdds + " with text");
ok("all 55 live make-up slots are bare placeholders", bareAdds === 55 && textAdds === 0, { bareAdds, textAdds });

// ── behaviour that used to be impossible ──
console.log("\nremoving a cell now leaves the sequence");
const mrBefore = buildSubjectLessons("lincoln", "mr_pages");
const dupDate = "2026-07-20";   // one of the four duplicate pp.196-199 cells
ok("pp.196-199 appears 3x before the removal",
   mrBefore.filter(x => x.lesson === "MR5 pp.196–199").length === 3,
   mrBefore.filter(x => x.lesson === "MR5 pp.196–199").length);

scheduleOverrides[dupDate] = scheduleOverrides[dupDate] || {};
scheduleOverrides[dupDate].lincoln = { removed: { mr_pages: true } };
const mrAfterRm = buildSubjectLessons("lincoln", "mr_pages");
ok("removing the Jul 20 duplicate drops it from the sequence",
   mrAfterRm.length === mrBefore.length - 1, { before: mrBefore.length, after: mrAfterRm.length });
ok("...and only 2 copies of pp.196-199 remain",
   mrAfterRm.filter(x => x.lesson === "MR5 pp.196–199").length === 2);

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
// Where the repaired sequence puts each lesson (0-based = the cursor value that serves it)
["MR5 pp.204–207","MR5 pp.208–211","MR5 pp.212–215"].forEach(function(t){
  console.log("    " + t + " sits at sequence position " + repaired.indexOf(t));
});

console.log("\na bare make-up slot is still ignored");
scheduleOverrides["2026-08-05"] = scheduleOverrides["2026-08-05"] || { lincoln: { added: { mr_pages: true } } };
const beforeBare = buildSubjectLessons("lincoln", "mr_pages").length;
scheduleOverrides["2026-08-06"] = { lincoln: { added: { mr_pages: true } } };
ok("added=true adds nothing", buildSubjectLessons("lincoln", "mr_pages").length === beforeBare);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
