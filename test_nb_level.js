// 📏 One level — notebooks study step 2 (PLAN_notebooks_study_2026-11-23 §8 "One level", §9 step 2; approved 2026-11-23:
// "Notebook reads the Family grade (Pre-K to 8th), with an override … Headers show the right grade; the 5th/6th mismatch goes
// away. No content change."). Run: node test_nb_level.js
//  · index.html NBLEVEL: grade → band at every boundary; the Notebook tab override beats the Family grade, the Family grade
//    beats today's behaviour; ctx.grade only when Mom set one; the Mom-only control writes exactly
//    notebookSettings/<kid>/gradeOverride (clear removes it; ?dryrun=1 and a non-Mom device write nothing); one home for it.
//  · notebooks.js NBLEVEL: the "before" notebooks.js is built from THIS file — the NBLEVEL block cut out and every call site put
//    back to the word that was typed there (no git, no pinned commit). No grade → every generator prints byte for byte what
//    that file prints; a grade → only the grade words differ, and the new word is in the headers.
// Page overflow (8.5×11in, clipped silently) for the longer words is measured in a real browser — see the branch's report.
const fs = require("fs"), path = require("path"), vm = require("vm");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const nbSrc = rd("notebooks.js"), src = rd("index.html");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };

// ════════════════════════════════════════ index.html ════════════════════════════════════════
console.log("── index.html: the NBLEVEL block ──");
const i0 = src.indexOf("// NBLEVEL_START"), i1 = src.indexOf("// NBLEVEL_END");
ok("one NBLEVEL block, right after PREKLEVEL_WIRE_END", i0 === src.indexOf("// PREKLEVEL_WIRE_END\n") + "// PREKLEVEL_WIRE_END\n".length && i1 > i0 && src.indexOf("// NBLEVEL_START", i0 + 1) < 0);
const block = src.slice(i0, i1);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris)\b/i;
ok("no kid or family name in the block", !NAMES.test(block.replace(/"Lincoln \(5th 🐍\)"/g, "")), (block.match(NAMES) || [])[0]);
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

function sandbox(o) {
  o = o || {};
  const writes = [];
  const c = {
    notebookSettings: o.settings || {}, tab: "notebook", rendered: 0, lsSet: 0,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    HA_LS: { setItem: () => { c.lsSet++; } },
    document: { getElementById: () => ({}) },
    nbRecOf: (kid) => (o.roster || {})[kid] || {},
    nbGradeOf: (kid) => (o.before || {})[kid] || null,
    db: o.noDb ? null : { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
  };
  c.renderNotebook = () => { c.rendered++; };
  vm.createContext(c);
  vm.runInContext(block + "\nthis.NB_LEVEL_CHOICES=NB_LEVEL_CHOICES;", c);
  c.writes = writes;
  return c;
}

console.log("── grade → band, at every boundary ──");
{
  const c = sandbox();
  const BAND = { PreK: "Pre-K", K: "K", 1: "1st–2nd", 2: "1st–2nd", 3: "3rd–4th", 4: "3rd–4th", 5: "5th–6th", 6: "5th–6th", 7: "7th–8th", 8: "7th–8th", 9: "7th–8th", 10: "7th–8th", 11: "7th–8th", 12: "7th–8th" };
  for (const k in BAND) ok("band " + k + " → " + BAND[k], c.nbLvBand(String(k)) === BAND[k], c.nbLvBand(String(k)));
  const KEY = { PreK: "PreK", "Pre-K": "PreK", prek: "PreK", " pre k ": "PreK", K: "K", k: "K", Kindergarten: "K", "1": "1", "4": "4", "4th": "4", "6th Grade": "6", "12": "12", "13": "", "0": "", "": "", null: "", "Year 2": "", "100": "" };
  for (const v in KEY) ok("reads " + JSON.stringify(v === "null" ? null : v) + " as " + JSON.stringify(KEY[v]), c.nbLvKey(v === "null" ? null : v) === KEY[v], c.nbLvKey(v));
  const LAB = { PreK: ["Pre-K", "Pre-K"], K: ["Kindergarten", "K"], 1: ["1st Grade", "1st"], 2: ["2nd Grade", "2nd"], 3: ["3rd Grade", "3rd"], 4: ["4th Grade", "4th"], 11: ["11th Grade", "11th"], 12: ["12th Grade", "12th"] };
  for (const k in LAB) ok("words for " + k + ": " + LAB[k].join(" / "), c.nbLvLabel(String(k)) === LAB[k][0] && c.nbLvShort(String(k)) === LAB[k][1]);
  ok("the override offers Pre-K, K, 1st … 8th", c.NB_LEVEL_CHOICES.join(",") === "PreK,K,1,2,3,4,5,6,7,8");
}

console.log("── which grade: override → Family grade → today ──");
{
  const roster = { a: { grade: "4" }, b: { grade: "PreK" }, c: {}, d: { grade: "11" } };
  const c = sandbox({ roster, settings: { a: { gradeOverride: "6" }, c: { gradeOverride: "K" }, d: { gradeOverride: "13" } }, before: { b: "Pre-K", e: "Pre-K" } });
  const a = c.nbLevelGrade("a");
  ok("override beats the Family grade", a.key === "6" && a.from === "override" && a.label === "6th Grade" && a.band === "5th–6th", a);
  ok("Family grade when there is no override", c.nbLevelGrade("b").from === "family" && c.nbLevelGrade("b").label === "Pre-K");
  ok("an override with no Family grade", c.nbLevelGrade("c").key === "K" && c.nbLevelGrade("c").label === "Kindergarten");
  ok("an override outside Pre-K–8th is ignored → the Family grade (11th → band 7th–8th)", c.nbLevelGrade("d").key === "11" && c.nbLevelGrade("d").from === "family" && c.nbLevelGrade("d").band === "7th–8th");
  ok("neither → today's behaviour (a Pre-K kid: Pre-K, from 'before')", c.nbLevelGrade("e").key === "PreK" && c.nbLevelGrade("e").from === "before");
  ok("neither and nothing today → null", c.nbLevelGrade("z") === null);
  const cx = (k) => JSON.parse(JSON.stringify(c.nbLevelCtx(k)));
  ok("ctx: override → grade + band", cx("a").grade === "6th Grade" && cx("a").gradeBand === "5th–6th");
  ok("ctx: Family grade → grade + band", cx("b").grade === "Pre-K" && cx("b").gradeBand === "Pre-K");
  ok("ctx: today's behaviour → a band but NO grade (the pages print as before)", cx("e").grade === undefined && cx("e").gradeBand === "Pre-K");
  ok("ctx: nothing → no grade, no band", cx("z").grade === undefined && cx("z").gradeBand === undefined);
  ok("label: the grade in brackets follows the level", c.nbKidLabel("a", "Lincoln (5th 🐍)") === "Lincoln (6th 🐍)" && c.nbKidLabel("b", "Julian (Pre-K 🦕)") === "Julian (Pre-K 🦕)" && c.nbKidLabel("c", "Caleb (K 🚜)") === "Caleb (K 🚜)");
  ok("label: no grade set (or today's only) → as typed", c.nbKidLabel("z", "Lincoln (5th 🐍)") === "Lincoln (5th 🐍)" && c.nbKidLabel("e", "Ellis (4th 🤖)") === "Ellis (4th 🤖)");
  ok("label: a starter notebook's label has no grade → as typed", c.nbKidLabel("a", "Sam (starter notebook)") === "Sam (starter notebook)");
}

console.log("── the control: Mom only, one targeted value ──");
{
  let c = sandbox({ roster: { a: { grade: "4" } } });
  c.nbSetGradeOverride("a", "5");
  ok("set → exactly one write: notebookSettings/a/gradeOverride = \"5\"", JSON.stringify(c.writes) === JSON.stringify([["set", "notebookSettings/a/gradeOverride", "5"]]), c.writes);
  ok("…kept locally and the tab redrawn", c.notebookSettings.a.gradeOverride === "5" && c.lsSet === 1 && c.rendered === 1);
  c.nbSetGradeOverride("a", "");
  ok("back to following → removes that one value", JSON.stringify(c.writes[1]) === JSON.stringify(["remove", "notebookSettings/a/gradeOverride"]) && c.writes.length === 2 && !("gradeOverride" in c.notebookSettings.a), c.writes);
  c.nbSetGradeOverride("a", "PreK"); c.nbSetGradeOverride("a", "K"); c.nbSetGradeOverride("a", "8");
  ok("Pre-K, K, 8th are stored as PreK / K / 8", c.writes.slice(2).map((w) => w[2]).join(",") === "PreK,K,8");
  const n = c.writes.length; c.nbSetGradeOverride("a", "9"); c.nbSetGradeOverride("a", "13"); c.nbSetGradeOverride("a", "junk");
  ok("9th, 13 or junk → no write, nothing changed", c.writes.length === n && c.notebookSettings.a.gradeOverride === "8");
  c = sandbox({ mom: false }); c.nbSetGradeOverride("a", "5");
  ok("not Mom → no write, nothing changed", c.writes.length === 0 && !c.notebookSettings.a);
  c = sandbox({ dry: true }); c.nbSetGradeOverride("a", "5");
  ok("?dryrun=1 → no Firebase write (local copy only)", c.writes.length === 0 && c.notebookSettings.a.gradeOverride === "5");
  c = sandbox({ roster: { a: { grade: "4" } } });
  const h = c.nbLevelCardHtml("a");
  ok("the card: 'Notebook level:' + 'follows the Family grade (4th)' first", /Notebook level:/.test(h) && /<option value="" selected>follows the Family grade \(4th\)<\/option>/.test(h), h.slice(0, 200));
  ok("the card: Pre-K, K, 1st … 8th to choose from", (h.match(/<option value="(PreK|K|[1-8])">/g) || []).length === 10 && />Pre-K</.test(h) && />8th</.test(h) && !/>9th</.test(h));
  c.notebookSettings.a = { gradeOverride: "6" };
  ok("the card shows an override as chosen", /<option value="6" selected>6th<\/option>/.test(c.nbLevelCardHtml("a")));
  ok("no Family grade → says so, and that the pages print as before", /follows the Family grade \(none set\)/.test(sandbox().nbLevelCardHtml("x")) && /print as they always have/.test(sandbox().nbLevelCardHtml("x")));
  ok("not Mom → no card", sandbox({ mom: false }).nbLevelCardHtml("a") === "");
}

console.log("── wiring: one home, the only writer ──");
ok("the card is placed once: the kid's section of the Notebook tab, after the look and extra-pages cards",
  (src.match(/nbLevelCardHtml\(/g) || []).length === 2 && /        lookHtml\+\n        xpHtml\+\n        nbLevelCardHtml\(sel\)\+   \/\/ 📏 NBLEVEL: Notebook level \(Mom\)\n(        \(\(typeof nbLadderCardHtml==="function"\)\?nbLadderCardHtml\(sel\):""\)\+   \/\/ 📚 NBLADDER[^\n]*\n)?        reviewHtml\+\n/.test(src));   // NBLADDER (2026-11-24): the Ladders card may follow it
ok("nbSetGradeOverride is called only from the card", (src.match(/nbSetGradeOverride\(/g) || []).length === 2);
ok("gradeOverride is touched nowhere outside the block", src.split("gradeOverride").length - 1 === block.split("gradeOverride").length - 1);
ok("haNbContext hands the generators ctx.grade + ctx.gradeBand (nbGrade unchanged)",
  /  const nbLv=nbLevelCtx\(kid\);   \/\/ NBLEVEL: ctx\.grade \+ ctx\.gradeBand\n  return \{ nbKidName:cap\(kid\), kidName:/.test(src) && src.indexOf("nbLevel:nbLevelOf(kid), nbGrade:nbGradeOf(kid), grade:nbLv.grade, gradeBand:nbLv.gradeBand, ") > 0);
ok("the kid's label follows the level in all three places it shows (Generate list, kid chips, section title)",
  src.indexOf("${nbKidLabel(k,g.label)}") > 0 && src.indexOf("'+nbKidLabel(x.k,x.label)+'</button>'") > 0 && src.indexOf("'+nbKidLabel(meta.k,meta.label)+'</div>'") > 0 && (src.match(/nbKidLabel\(/g) || []).length === 4);
ok("nbGradeOf (the US Path page's grade — it changes that page's content) is untouched",
  src.indexOf('function nbGradeOf(kid){ const g=((nbRecOf(kid).notebook||{}).gradeLabel); if(g==="K") return "Kindergarten"; if(typeof g==="string"&&g.trim()) return g.trim(); return isPreK(kid)?"Pre-K":null; }') > 0);
{
  // every NBLEVEL name outside the block is one of the call sites above
  let out = src.slice(0, i0) + src.slice(i1);
  const l0 = out.indexOf("// NBLADDER_START"), l1 = out.indexOf("// NBLADDER_END");
  if (l0 >= 0 && l1 > l0) out = out.slice(0, l0) + out.slice(l1);   // NBLADDER (2026-11-24): the ladders' default level reads nbLevelGrade (test_nb_ladder.js)
  const stray = out.split("\n").filter((l) => /nbLevelCtx|nbLevelGrade|nbKidLabel|nbLevelCardHtml|nbSetGradeOverride|nbLvKey|nbLvBand|NB_LEVEL_CHOICES/.test(l))
    .filter((l) => !/const nbLv=nbLevelCtx\(kid\)|\$\{nbKidLabel\(k,g\.label\)\}|nbKidLabel\(x\.k,x\.label\)|nbKidLabel\(meta\.k,meta\.label\)|nbLevelCardHtml\(sel\)\+/.test(l));
  ok("no other line outside the block uses it", stray.length === 0, stray.map((l) => l.trim().slice(0, 80)));
}

// ════════════════════════════════════════ notebooks.js ════════════════════════════════════════
console.log("── notebooks.js: the block and its call sites ──");
const n0 = nbSrc.indexOf("  // NBLEVEL_START"), n1 = nbSrc.indexOf("  // NBLEVEL_END\n");
ok("one NBLEVEL block, right after cap()", n0 === nbSrc.indexOf("  function cap(s)") + nbSrc.slice(nbSrc.indexOf("  function cap(s)")).indexOf("\n") + 2 && n1 > n0 && nbSrc.indexOf("  // NBLEVEL_START", n0 + 1) < 0);
const nbBlk = nbSrc.slice(n0, n1).replace(/generate(Ellis|Lucy)/g, "");
ok("no Firebase, no kid name in the block", !/db\.ref|firebase/i.test(nbBlk) && !NAMES.test(nbBlk), (nbBlk.match(NAMES) || [])[0]);
// [what the call site is now, the word that was typed there before]
const SITES = [
  ["  function juPageParent(weekNum, weekDates, cur, teachNotes, T) {", "  function juPageParent(weekNum, weekDates, cur, teachNotes) {"],
  ['juHeader((T && T.eyebrow) || "Howe Academy · Pre-K", "Julian\'s Grown-Up Guide"', 'juHeader("Howe Academy · Pre-K", "Julian\'s Grown-Up Guide"'],
  ["\n    T = pkOwnGrade(T, ctx);   // NBLEVEL: the kid's grade word reaches a kid's own look too", ""],
  ["  function cbPageParent(weekNum, weekDates, cur, picks, teachNotes, eyebrow) {", "  function cbPageParent(weekNum, weekDates, cur, picks, teachNotes) {"],
  ['juHeader(eyebrow || "Kindergarten", "Caleb\'s Grown-Up Guide"', 'juHeader("Kindergarten", "Caleb\'s Grown-Up Guide"'],
  ["return cbPageParent(wn, wd, cur, picks, tn, T && T.eyebrow); }", "return cbPageParent(wn, wd, cur, picks, tn); }"],
  ['var gr = nbLvWord(ctx, String((ctx && ctx.nbGrade) || "").trim() || "Pre-K", "long");   // NBLEVEL: ctx.grade first', 'var gr = String((ctx && ctx.nbGrade) || "").trim() || "Pre-K";'],
  ['var cfg = nbLvWith(LINCOLN_CONFIG, ctx), student = cfg.student;   // NBLEVEL: cfg.grade = ctx.grade\'s word, else "6th Grade"', "var cfg = LINCOLN_CONFIG, student = cfg.student;"],
  ["var T = nbLvWith(LN_EXTRA.enrich.theme_lincoln, ctx);   // NBLEVEL", "var T = LN_EXTRA.enrich.theme_lincoln;"],
  ["var T = nbLvWith(ELLIS_DATA.theme, ctx);   // NBLEVEL", "var T = ELLIS_DATA.theme;"],
  ['"Howe Academy · " + lvG("4th Grade") + " · Samuel Ellis Howe"', '"Howe Academy · 4th Grade · Samuel Ellis Howe"'],
  ['"Year", "2026", lvG("4th Grade").toUpperCase())}', '"Year", "2026", "4TH GRADE")}'],
  ["\n    _nbLvCtx = ctx;   // NBLEVEL: the grade word the page builders print (lvG)", "", 2],
  ['"Howe Academy · " + lvG("1st Grade") + " · Weekly Review"', '"Howe Academy · 1st Grade · Weekly Review"'],
  ['"Howe Academy · " + lvG("1st Grade") + " · Calendar"', '"Howe Academy · 1st Grade · Calendar"', 2],
  ['"Howe Academy · Lucy Howe · " + lvG("1st Grade")', '"Howe Academy · Lucy Howe · 1st Grade"'],
  ['"Howe Academy · " + lvG("1st Grade") + " · Safety"', '"Howe Academy · 1st Grade · Safety"'],
  ['"Howe Academy · " + lvG("1st Grade") + " · Daily Notebook"', '"Howe Academy · 1st Grade · Daily Notebook"'],
  ['"Howe Academy · " + lvG("1st Grade") + " · End of Week"', '"Howe Academy · 1st Grade · End of Week"'],
  ['Howe Academy · ${lvG("1st Grade")} · Teaching Companion', "Howe Academy · 1st Grade · Teaching Companion"],
  [", binding = false, metaOut = {};", ", binding = false;"],
  ['var m = Object.assign({}, META[kid], { grade: nbLvWord(ctx, META[kid].grade, "long") });   // NBLEVEL\n      metaOut[kid] = m;', "var m = META[kid];"],
  ["present.map(function (k) { return metaOut[k]; })", "present.map(function (k) { return META[k]; })"],
];
let before = nbSrc.slice(0, n0) + nbSrc.slice(n1 + "  // NBLEVEL_END\n\n".length);
for (const [now, was, times] of SITES) {
  const c = before.split(now).length - 1;
  ok("call site ×" + (times || 1) + ": " + now.trim().slice(0, 70), c === (times || 1), c);
  before = before.split(now).join(was);
}
ok("the rebuilt 'before' file has no trace of NBLEVEL", !/nbLv|lvG\(|pkOwnGrade|_nbLvCtx|metaOut|NBLEVEL/.test(before));
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const NB = load(nbSrc), NB0 = load(before);

console.log("── no grade → byte for byte ──");
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const tasks = (kid) => Object.keys(dates).map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const XP = { allAboutMe: { on: true }, moneyLife: { on: true }, wilderness: { on: true }, memoryCivics: { on: true }, notes: { on: true } };
const mk = (kid, extra) => Object.assign({ weekData: { dates, tasks: tasks(kid) }, weekNum: 12, weekDates: "Nov 16–20, 2026", extraPages: XP, prevSummary: {}, pace: [], units: [], nbKidName: "Student" }, extra || {});
const GENS = [["lincoln"], ["ellis"], ["lucy"], ["julian"], ["caleb"], ["kidp", { notebookTheme: "shark", nbGrade: "Pre-K" }], ["kidd", { notebookTheme: "dino", kidName: "Sam" }], ["kidz"]];
const all = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
for (const [kid, extra] of GENS) {
  for (const gb of [undefined, "Pre-K", "5th–6th"]) {   // a band alone (today's behaviour) never changes a page
    const ctx = mk(kid, Object.assign({}, extra, gb ? { gradeBand: gb } : {}));
    ok(kid + (gb ? " (band " + gb + ", no grade)" : "") + ": student + guide = before", all(NB.generate(kid, ctx)) === all(NB0.generate(kid, mk(kid, extra))));
  }
  ok(kid + ": an unreadable grade ('Year 2') = before", all(NB.generate(kid, mk(kid, Object.assign({ grade: "Year 2" }, extra)))) === all(NB0.generate(kid, mk(kid, extra))));
}
{
  const byKid = {}; ["lincoln", "ellis", "lucy", "julian"].forEach((k) => (byKid[k] = mk(k)));
  ok("the combined parent packet = before", NB.combinedParent(byKid) === NB0.combinedParent(byKid));
}

console.log("── a grade → only the grade words differ ──");
const GW = /\bkindergartner\b|Pre-K|PRE-K|Kindergarten|KINDERGARTEN|\b\d{1,2}(?:st|nd|rd|th) Grade\b|\b\d{1,2}(?:ST|ND|RD|TH) GRADE\b/g;
const norm = (s) => s.replace(GW, "‹G›").replace(/‹G› kid\b/g, "‹G›");   // the Pre-K guide says "a kindergartner" / "a Pre-K kid"
const GRADES = ["Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "12th Grade"];
// where the word must now be (the header / eyebrow / footer of each notebook)
const WHERE = {
  lincoln: (g) => ["Howe Academy · " + g], ellis: (g) => ["Howe Academy · " + g + " · Samuel", g.toUpperCase() + "</"], lucy: (g) => ["Howe Academy · " + g + " · Daily Notebook", "Lucy Howe · " + g, "Howe Academy · " + g + " · Teaching Companion"],
  julian: (g) => ["Howe Academy · " + g, "Julian Howe · " + g, "This is my " + g + " notebook"], caleb: (g) => ["Caleb · " + g, "This is my " + g + " notebook"],
  kidp: (g) => ["This is my " + g + " notebook"], kidd: (g) => ["Sam · " + g], kidz: () => [],
};
const OLD = { lincoln: /6th Grade/, ellis: /4th Grade|4TH GRADE/, lucy: /1st Grade/, julian: null, caleb: null, kidp: null, kidd: null, kidz: null };
for (const [kid, extra] of GENS) {
  const base = all(NB0.generate(kid, mk(kid, extra)));
  let same = true, there = true, gone = true, firstBad = null;
  for (const g of GRADES) {
    const out = all(NB.generate(kid, mk(kid, Object.assign({ grade: g }, extra))));
    if (norm(out) !== norm(base)) { same = false; firstBad = firstBad || g; }
    const miss = WHERE[kid](g).filter((w) => out.indexOf(w) < 0); if (miss.length) { there = false; firstBad = firstBad || [g, miss]; }
    if (OLD[kid] && g.indexOf(String(OLD[kid].source).slice(0, 3)) !== 0 && OLD[kid].test(out.split("<<PARENT>>")[0])) { gone = false; firstBad = firstBad || ["old word left", g]; }
  }
  ok(kid + ": every grade Pre-K … 12th — only the grade words differ", same, firstBad);
  ok(kid + ": the new word is in the headers / footers", there, firstBad);
  if (OLD[kid]) ok(kid + ": the typed word is gone from the student pages", gone, firstBad);
}
{
  const g6 = all(NB.generate("lincoln", mk("lincoln", { grade: "6th Grade" }))), b = all(NB0.generate("lincoln", mk("lincoln")));
  ok("Lincoln at 6th = before (his typed word was already 6th)", g6 === b);
  ok("Ellis at 4th, Lucy at 1st, Julian at Pre-K = before", all(NB.generate("ellis", mk("ellis", { grade: "4th Grade" }))) === all(NB0.generate("ellis", mk("ellis"))) &&
    all(NB.generate("lucy", mk("lucy", { grade: "1st Grade" }))) === all(NB0.generate("lucy", mk("lucy"))) &&
    all(NB.generate("julian", mk("julian", { grade: "Pre-K" }))) === all(NB0.generate("julian", mk("julian"))));
  const byKid = { lincoln: mk("lincoln", { grade: "7th Grade" }), ellis: mk("ellis", { grade: "5th Grade" }), lucy: mk("lucy"), julian: mk("julian") };
  const cp = NB.combinedParent(byKid), cp0 = NB0.combinedParent({ lincoln: mk("lincoln"), ellis: mk("ellis"), lucy: mk("lucy"), julian: mk("julian") });
  ok("combined parent packet: each kid's divider + cover carry the kid's grade; the rest is the same",
    /7th Grade/.test(cp) && /5th Grade/.test(cp) && !/6th Grade/.test(cp) && !/4th Grade/.test(cp) && /1st Grade/.test(cp) && norm(cp) === norm(cp0));
}
{
  // the generator after a Lucy build doesn't leak her grade into an Ellis build with none (the shared _nbLvCtx)
  NB.generate("lucy", mk("lucy", { grade: "3rd Grade" }));
  ok("one build's grade never leaks into the next", all(NB.generate("ellis", mk("ellis"))) === all(NB0.generate("ellis", mk("ellis"))));
}

console.log("── the two files agree on the words ──");
{
  const c = sandbox();
  const bad = ["PreK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].filter((k) => {
    const out = all(NB.generate("lincoln", mk("lincoln", { grade: c.nbLvLabel(k) })));
    return out.indexOf("Howe Academy · " + c.nbLvLabel(k)) < 0;
  });
  ok("every label index.html passes prints as itself", bad.length === 0, bad);
}

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
