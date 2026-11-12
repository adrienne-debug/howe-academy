/*
 * Node tests for UNIT_NOT_BOOK (her report 2026-11-12: Ellis checked off geography and the celebration song played).
 *
 * Skill Sharpeners Geography labels every lesson "Unit N · Pg a–b" and the pages climb through one workbook. The
 * milestone list took every label change as a new book, so each finished unit minted a 📖 book trophy, paid 25 pts
 * and played the song. Now, for milestones only, a label change is a new book when the pages also start over.
 *
 *   · a unit-labelled workbook has NO milestone books (its finish is the 🏆 subject finish)
 *   · MR5 → MR6 (pages start over) still milestones MR5; a same-label page reset still splits
 *   · volume-token subjects (5A/5B) and bookMilestones=false are unchanged
 *   · _bookRuns, page totals and progress are untouched (old _bookRuns replayed side by side)
 *
 *   run:  node test_unit_not_book.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
function line(startsWith) {
  const i = src.indexOf(startsWith); if (i < 0) { console.error(startsWith + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n", i) + 1);
}
function block(name) {
  const a = src.indexOf("// " + name + "_START"), b = src.indexOf("// " + name + "_END");
  if (a < 0 || b < a) { console.error(name + " block not found"); process.exit(1); }
  return src.slice(a, b);
}
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const ctx = { currData: { subjects: { kid: {} } }, SEQS: {} };
vm.createContext(ctx);
vm.runInContext([
  slice("parsePageNum"), line("function _bookKey("), slice("_bookRuns"), block("UNIT_NOT_BOOK"),
  slice("_bankedPages"), slice("subjectCurrentBook"), slice("_lessonBookKey"), slice("_volumeRuns"), slice("subjectMilestoneBooks"),
  "function buildSubjectLessons(kid,sk){ return SEQS[sk]||[]; }",
].join("\n"), ctx);
const R = (code) => vm.runInContext(code, ctx);
function setSubj(sk, labels, extra) {
  ctx.SEQS[sk] = labels.map(l => ({ lesson: l }));
  ctx.currData.subjects.kid[sk] = Object.assign({ display: sk }, extra || {});
}

// ── the reported subject: 16 units, pages 5→68, two lessons per unit shown here ──
const units = []; let pg = 5;
for (let u = 1; u <= 16; u++) for (let k = 0; k < 4; k++) { units.push("Unit " + u + " · Pg " + pg + "–" + (pg + 1)); pg += 2; }
setSubj("ss_geo", units);
const ssMs = R("subjectMilestoneBooks('kid','ss_geo')");
ok("no 📖 milestone books → finishing Unit 1 plays nothing", ssMs.length === 0, ssMs);
const joined = R("_milestonePageRuns(SEQS.ss_geo)");
ok("…the 16 units join into one unnamed run", joined.length === 1 && joined[0].name === "" && joined[0].lastIdx === units.length - 1, joined.length);
ok("_bookRuns itself is unchanged (still 16 runs — page totals and progress untouched)", R("_bookRuns(SEQS.ss_geo)").length === 16);
const OLD_BOOKRUNS = 'function _bookRuns(seq){\n  const runs=[]; let prev=null;\n  (seq||[]).forEach((e,i)=>{\n    const p=parsePageNum(e.lesson); if(p===null) return;\n    const key=_bookKey(e.lesson).toLowerCase();\n    const last=runs[runs.length-1];\n    if(!last||last.key!==key||(prev!==null&&p<prev)) runs.push({name:_bookKey(e.lesson),key,firstIdx:i,lastIdx:i,maxPage:p});\n    else { last.lastIdx=i; if(p>last.maxPage) last.maxPage=p; }\n    prev=p;\n  });\n  return runs;\n}';
ok("_bookRuns source is byte-identical to before", slice("_bookRuns").trim() === OLD_BOOKRUNS);
ok("banked pages unchanged by this fix", R("_bankedPages(SEQS.ss_geo, 7)") === 12 + 20, R("_bankedPages(SEQS.ss_geo, 7)"));

// ── MR5 → MR6: pages start over, so still two books and MR5 still celebrates ──
const mr = [];
for (let p = 140; p <= 160; p += 4) mr.push("MR5 pp." + p + "–" + (p + 3));
for (let p = 1; p <= 21; p += 4) mr.push("MR6 pp." + p + "–" + (p + 3));
setSubj("mr", mr);
const mrRuns = R("_bookRuns(SEQS.mr)");
ok("MR5 → MR6 still two runs", mrRuns.length === 2 && mrRuns[0].name === "MR5" && mrRuns[1].name === "MR6", mrRuns.map(r => r.name));
const mrMs = R("subjectMilestoneBooks('kid','mr')");
ok("MR5 is still a 📖 milestone (MR6, the last book, belongs to the 🏆 finish)", mrMs.length === 1 && mrMs[0].name === "MR5", mrMs);
ok("MR6 progress resets to its own pages", R("subjectCurrentBook(SEQS.mr, 7)").bookNum === 2);

// ── same label, page drops → still a new book ──
setSubj("reset", ["Book p.10", "Book p.20", "Book p.30", "Book p.2", "Book p.12", "Book p.22"]);
ok("same label + page reset still two milestone runs", R("_milestonePageRuns(SEQS.reset)").length === 2);

// ── a different label that starts lower is a new book even mid-number ──
setSubj("ab", ["Level A p.40", "Level A p.44", "Level B p.12", "Level B p.16"]);
ok("label change + lower page = new book", R("_milestonePageRuns(SEQS.ab)").map(r => r.name).join("|") === "Level A|Level B");

// ── volume tokens never reach the page splitter ──
const vol = []; ["5A", "5B"].forEach(v => { for (let l = 1; l <= 4; l++) vol.push(v + " Ch.1 L" + l); });
setSubj("vol", vol);
const vm5 = R("subjectMilestoneBooks('kid','vol')");
ok("5A/5B volume subject still milestones 5A", vm5.length === 1 && vm5[0].key === "5A", vm5);

// ── bookMilestones=false still off ──
setSubj("off", mr, { bookMilestones: false });
ok("bookMilestones=false still silences milestones", R("subjectMilestoneBooks('kid','off')").length === 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
