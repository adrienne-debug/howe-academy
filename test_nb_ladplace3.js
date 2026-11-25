// 📏 NBLADPLACE3 — the ladder placement check covers three levels (her words 2026-11-24: her 1st grader "could have maybe did the
// second grade placement… when you click the placement test, it does the placement test for that grade, like the one above it,
// one below it"; asked "three levels?" → "Yes, three levels"). Run: node test_nb_ladplace3.js
//  · the parts printed for EVERY picked level of both ladders (Part 1 = below, Part 2 = picked, Part 3 = above; two at the
//    first / last level and for a picked bank rung; a bank rung is never printed and the grown-up's page names it).
//  · placementPair keeps its shape (suggested, lo, hi, skipped — lo/hi the same pair as before) and gains up + levels.
//  · the grown-up's page: the three "how to choose" lines (+ the bank-rung line when a bank sits between), answers for every part.
//  · the child's sheets never show or hint an answer: byte-identical whatever every answer, why and rule is.
//  · sheets split by part, never mid-question; Name/Date on the first sheet only; Pre-K / K parts keep "with a grown-up" and
//    the Read aloud lines.
//  · with the block cut out: the two-level check as before, every notebook byte for byte the same.
//  · page fit: every placement page of every picked level measured in Google Chrome headless when it is on this machine
//    (else SKIPPED, said plainly).
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const nbSrc = rd("notebooks.js"), ixSrc = rd("index.html");
const NUM = JSON.parse(rd("ladders/number_thinking.json")), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const clone = (o) => JSON.parse(JSON.stringify(o));
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");

// ════════════════════════════════════════ the block ════════════════════════════════════════
console.log("── the block ──");
const START = "  // NBLADPLACE3_START", END = "  // NBLADPLACE3_END\n";
const b0 = nbSrc.indexOf(START), b1 = nbSrc.indexOf(END);
const l0 = nbSrc.indexOf("  // NBLADDER_START"), p0 = nbSrc.indexOf("  // NBLADPIC_START"), pages0 = nbSrc.indexOf("  function ladderPlacementPages(");
ok("one NBLADPLACE3 block, inside NBLADDER, in the placement builder (before the pages are built)", b0 > l0 && b1 > b0 && b1 < pages0 && pages0 < p0 && nbSrc.indexOf("NBLADPLACE3_START", b0 + 20) < 0);
const blk = nbSrc.slice(b0, b1);
ok("no kid or family name in the block", !NAMES.test(blk), (blk.match(NAMES) || [])[0]);
ok("no DOM, no Firebase in the block", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(blk)));
const rest = nbSrc.slice(0, b0) + nbSrc.slice(b1 + END.length);
const FNS = ["ladPlace3Pair", "ladPlace3Rules", "ladPlace3Note", "ladPlace3ReadGroups", "ladPlace3NumGroups"];
ok("outside the block each of its functions is called once, behind a typeof guard", FNS.every((f) => (code(rest).match(new RegExp("\\b" + f + "\\b", "g")) || []).length === 2 && rest.indexOf('typeof ' + f + ' === "function"') > 0) &&
  !/ladPlace3(Real|Banks|BankName)\b/.test(rest));
ok("index.html untouched by this change: no placement-level logic there, the card's words still true", ixSrc.indexOf("A short check on paper, with a separate answer page for you. It changes nothing here.") > 0 && !/placementPair|ladPlace3/.test(ixSrc));

const NB = load(nbSrc), L = NB.ladders;
const NB0 = load(rest), L0 = NB0.ladders;
const tN = L.track("number", NUM), tR = L.track("reading", READ);
const DATA = { number: NUM, reading: READ }, TRACK = { number: tN, reading: tR };
const lab = (t, k) => t.levels[k].label;

// ════════════════════════════════════════ the parts, every picked level ════════════════════════════════════════
console.log("── the parts printed, every picked level of both ladders ──");
const WANT = {
  number: { prek: "prek,k", k: "prek,k,g1", g1: "k,g1,g2", g2: "g1,g2,g3", g3: "g2,g3,g5", g4: "g3,g5", g5: "g3,g5,g7", g6: "g5,g7", g7: "g5,g7,g8", g8: "g7,g8" },
  reading: { g1: "g1,g2", g2: "g1,g2,g3", g3: "g2,g3,g4", g4: "g3,g4,g5", g5: "g4,g5,g6", g6: "g5,g6,g78", g78: "g6,g78" },
};
const SKIP = { number: { g3: "g4", g4: "g4", g5: "g4,g6", g6: "g6", g7: "g6" }, reading: {} };
const SHEETS = { number: { prek: 1, k: 2, g1: 2, g2: 1, g3: 1, g4: 1, g5: 1, g6: 1, g7: 1, g8: 1 }, reading: { g1: 1, g2: 2, g3: 3, g4: 3, g5: 3, g6: 3, g78: 2 } };
ok("the table covers every level of both ladders", Object.keys(WANT.number).join() === tN.order.join() && Object.keys(WANT.reading).join() === tR.order.join());
const ALL = [];
for (const kind of ["number", "reading"]) for (const lv of Object.keys(WANT[kind])) ALL.push({ kind, lv });
const PG = {};
for (const { kind, lv } of ALL) {
  const t = TRACK[kind], pr = L.placementPair(t, lv), pr0 = L0.placementPair(t, lv), want = WANT[kind][lv].split(",");
  const pg = L.placementPages(kind, DATA[kind], { lv, kidName: "Sam" }); PG[kind + " " + lv] = pg;
  const word = kind === "reading" ? "Passage" : "Part";
  const childParts = pg.child.join("").match(new RegExp('<div class="lp-part">' + word + " \\d", "g")) || [];
  const parentParts = (pg.parent.join("").match(new RegExp('<div class="lp-part">' + word + " (\\d) — ([^<“]+?)(?: level: “|<)", "g")) || []).map((m) => m.replace(/<div class="lp-part">/, "").replace(/ level: “$|<$/, ""));
  const wantParts = want.map((k, i) => word + " " + (i + 1) + " — " + lab(t, k));
  ok(kind + " " + lv + " → " + want.map((k, i) => word + " " + (i + 1) + " " + k).join(", ") + " · " + SHEETS[kind][lv] + " child sheet(s) + 1 grown-up page" + (SKIP[kind][lv] ? " (skips " + SKIP[kind][lv] + ")" : ""),
    pr.levels.join(",") === want.join(",") && childParts.length === want.length && JSON.stringify(parentParts) === JSON.stringify(wantParts) &&
    pr.skipped.join(",") === (SKIP[kind][lv] || "") && pg.child.length === SHEETS[kind][lv] && pg.parent.length === 1, { levels: pr.levels, parentParts, skipped: pr.skipped, sheets: pg.child.length });
  ok("  placementPair keeps its shape: lo/hi/suggested as before; + up, levels", JSON.stringify(Object.keys(pr)) === JSON.stringify(["suggested", "lo", "hi", "skipped", "up", "levels"]) &&
    pr.lo === pr0.lo && pr.hi === pr0.hi && pr.suggested === pr0.suggested && pr0.skipped.every((k) => pr.skipped.indexOf(k) >= 0) &&
    pr.up === (want.length === 3 ? want[2] : null) && JSON.stringify(Object.keys(pr0)) === JSON.stringify(["suggested", "lo", "hi", "skipped"]));
  ok("  a bank rung is never printed", pr.levels.every((k) => !t.levels[k].bank));
}

// ════════════════════════════════════════ the grown-up's page ════════════════════════════════════════
console.log("── the grown-up's page: how to choose, answers for every part ──");
const rules = (pg) => (pg.parent[0].match(/<p class="lp-rule">[^<]*<\/p>/g) || []).map((s) => s.replace(/<[^>]+>/g, ""));
ok("number 1st grade: the three lines, in plain words", JSON.stringify(rules(PG["number g1"]).slice(0, 3)) === JSON.stringify([
  "Comfortable and mostly right on Part 3 → 2nd grade.", "Comfortable on Part 2, but Part 3 is a struggle → 1st grade.", "A struggle on Part 2 → Kindergarten."]), rules(PG["number g1"]));
ok("reading 2nd grade: the three lines (Passage)", JSON.stringify(rules(PG["reading g2"]).slice(0, 3)) === JSON.stringify([
  "Comfortable and mostly right on Passage 3 → 3rd grade.", "Comfortable on Passage 2, but Passage 3 is a struggle → 2nd grade.", "A struggle on Passage 2 → 1st grade."]), rules(PG["reading g2"]));
ok("number 5th grade (banks on both sides): the bank wording kept", JSON.stringify(rules(PG["number g5"]).slice(0, 5)) === JSON.stringify([
  "4th grade and 6th grade are question banks on the Notebook tab, not part of this ladder — so this check uses the nearest levels: 3rd grade, 5th grade and 7th grade.",
  "Comfortable and mostly right on Part 3 → 7th grade.",
  "Comfortable on Part 2, but Part 3 is a struggle → the 6th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).",   // NBLADPLACE_BANK
  "A struggle on Part 2 → the 4th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).",
  "A struggle on Part 1 too → 3rd grade."]), rules(PG["number g5"]));
ok("number 3rd grade (the 4th-grade bank between Part 2 and Part 3)", rules(PG["number g3"]).indexOf("Comfortable on Part 2, but Part 3 is a struggle → the 4th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).") >= 0 &&
  rules(PG["number g3"]).indexOf("A struggle on Part 2 → 2nd grade.") >= 0);
ok("number 7th grade (the 6th-grade bank between Part 1 and Part 2)", rules(PG["number g7"]).indexOf("A struggle on Part 2 → the 6th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).") >= 0 &&
  rules(PG["number g7"]).indexOf("A struggle on Part 1 too → 5th grade.") >= 0 && rules(PG["number g7"]).indexOf("Comfortable and mostly right on Part 3 → 8th grade.") >= 0);
const UPBANK = { "number g3": "the 4th-grade question bank", "number g5": "the 6th-grade question bank" };   // NBLADPLACE_BANK: a bank between Part 2 and Part 3 is named
for (const { kind, lv } of ALL) {
  const t = TRACK[kind], pr = L.placementPair(t, lv), r = rules(PG[kind + " " + lv]), w = kind === "reading" ? "Passage" : "Part";
  if (pr.levels.length === 3) ok(kind + " " + lv + ": Part 3 → the level above, Part 2 → the picked level, a struggle → lower",
    r.indexOf("Comfortable and mostly right on " + w + " 3 → " + lab(t, pr.up) + ".") >= 0 && r.some((s) => s.indexOf("Comfortable on " + w + " 2, but " + w + " 3 is a struggle → " + (UPBANK[kind + " " + lv] || lab(t, lv))) === 0) &&
    r.some((s) => s.indexOf("A struggle on " + w + " 2 → ") === 0) && r.some((s) => s.indexOf(" → " + lab(t, pr.lo) + ".") > 0));
  else ok(kind + " " + lv + ": two parts — the two-part lines, and a line saying why only two",
    r.some((s) => s === "Comfortable and mostly right on " + w + " 2 → " + lab(t, pr.hi) + ".") &&
    r.some((s) => /is the first level, so this check pairs it with the one above\.$|is the last level, so this check pairs it with the one below\.$|(is the question bank|are question banks) on the Notebook tab/.test(s)), r);
  const items = pr.levels.map((k) => kind === "reading" ? [t.levels[k].items[0]] : t.levels[k].items.filter((x) => !x.opt).slice(0, 3)).flat();
  const ans = kind === "reading" ? items.flatMap((p) => p.q.map((q) => q.ans)) : items.map((q) => q.ans);
  const keys = (PG[kind + " " + lv].parent[0].match(/<div class="lp-key"><b>\d+\. ([A-E])<\/b>/g) || []).map((m) => m.slice(-5, -4));
  ok("  answers for every part, on the grown-up's page", keys.join("") === ans.join("") && keys.length === (kind === "reading" ? ans.length : 3 * pr.levels.length));
}

// ════════════════════════════════════════ the child's sheets ════════════════════════════════════════
console.log("── the child's sheets: no answer, split by part, Name/Date once, grown-up parts kept ──");
// every answer letter, why and rule changed → the child's sheets must not change by one byte (nothing on them depends on the answer)
const scramble = (kind) => { const d = clone(DATA[kind]);
  if (kind === "reading") Object.values(d.passages).forEach((p) => p.q.forEach((q) => { q.ans = "ABCD"[("ABCD".indexOf(q.ans) + 1) % q.c.length]; q.why = "zz-why"; }));
  else Object.values(d.levels).forEach((Lv) => Object.values(Lv.items || {}).forEach((q) => { q.ans = "ABCDE"[("ABCDE".indexOf(q.ans) + 1) % q.c.length]; q.rule = "zz-rule"; }));
  return d; };
const SCR = { number: scramble("number"), reading: scramble("reading") };
for (const { kind, lv } of ALL) {
  const pg = PG[kind + " " + lv], other = L.placementPages(kind, SCR[kind], { lv, kidName: "Sam" });
  ok(kind + " " + lv + ": the child's sheets are the same whatever the answers, and carry no answer key", other.child.join("\n") === pg.child.join("\n") && other.parent.join("") !== pg.parent.join("") &&
    !/lp-key|lp-banner|not for the child|Answers|zz-/.test(pg.child.join("\n")));
  const word = kind === "reading" ? "Passage" : "Part";
  const perPage = pg.child.map((h) => ({ parts: (h.match(new RegExp('<div class="lp-part">' + word + " \\d", "g")) || []).length, qs: (h.match(/<div class="lp-q( lp-pq)?">/g) || []).length, name: (h.match(/<span>Name<\/span><span>Date<\/span>/g) || []).length, h }));
  const n = pg.child.length;
  ok("  Name/Date on the first sheet only; sheet titles say 'i of n' when more than one", perPage[0].name === 1 && perPage.slice(1).every((p) => p.name === 0) &&
    (n === 1 ? !/ of \d/.test(pg.child[0].slice(0, 300)) : pg.child.every((h, i) => h.indexOf(" — " + (i + 1) + " of " + n + "<") > 0)));
  if (kind === "number") ok("  split by part, never mid-question: every sheet holds whole parts of 3 questions", perPage.every((p) => p.parts >= 1 && p.qs === 3 * p.parts));
  else ok("  split by passage: every passage whole on one sheet, its questions with it", pg.child.every((h) => (h.match(/<div class="lp-psg">/g) || []).length >= 1));
}
{
  const pg = PG["number k"], s1 = pg.child[0], s2 = pg.child[1];
  ok("K check: sheet 1 = Pre-K + K (with a grown-up, Read aloud lines, pictures); sheet 2 = 1st grade (no grown-up badge)",
    /with a grown-up/.test(s1) && (s1.match(/a grown-up reads each one aloud/g) || []).length === 2 && (s1.match(/Read aloud: “/g) || []).length === 6 && /lp-pq/.test(s1) &&
    !/with a grown-up|Read aloud|a grown-up reads/.test(s2) && /<div class="lp-part">Part 3<\/div>/.test(s2));
  const g1 = PG["number g1"].child;
  ok("1st-grade check: sheet 1 = K (read aloud) + 1st grade (each part marked as before); sheet 2 = 2nd grade", /with a grown-up/.test(g1[0]) && /Part 1 — a grown-up reads each one aloud/.test(g1[0]) &&
    /<div class="lp-part">Part 2<\/div>/.test(g1[0]) && /<div class="lp-part">Part 3<\/div>/.test(g1[1]) && !/grown-up|Read aloud/.test(g1[1]));
  const g2 = PG["number g2"].child;
  ok("2nd-grade check: one sheet, nine questions, no grown-up parts", g2.length === 1 && (g2[0].match(/<div class="lp-q( lp-pq)?">/g) || []).length === 9 && !/with a grown-up|Read aloud/.test(g2[0]));
  ok("the grown-up's page still says the check changes nothing in the app", Object.values(PG).every((p) => p.parent[0].indexOf("This check doesn’t change anything in the app.") > 0));
}

// ════════════════════════════════════════ with the block cut out ════════════════════════════════════════
console.log("── with the block cut out: the two-level check as before; every notebook the same ──");
ok("the cut tree has no trace of the block (only the guarded calls)", !/NBLADPLACE3_|ladPlace3(Real|Banks|BankName)/.test(code(rest)) && NB0 && NB0.ladders && typeof NB0.ladders.placementDoc === "function");
for (const { kind, lv } of ALL) {
  const pr0 = L0.placementPair(TRACK[kind], lv), pg0 = L0.placementPages(kind, DATA[kind], { lv, kidName: "Sam" }), pr = L.placementPair(TRACK[kind], lv);
  const d = L.placementDoc(kind, DATA[kind], { lv, kidName: "Sam" }), d0 = L0.placementDoc(kind, DATA[kind], { lv, kidName: "Sam" });
  const lastNote = '<p class="lp-rule">' + lab(TRACK[kind], pr.hi) + " is the last level, so this check pairs it with the one below.</p>";
  if (pr.levels.length === 2) ok(kind + " " + lv + ": stays two — the same document as before" + (d.indexOf(lastNote) > 0 ? " but for the one 'last level' line" : ""), d.replace(lastNote, "") === d0);
  else ok(kind + " " + lv + ": cut out → the old two parts (" + pr0.lo + " + " + pr0.hi + ")", (pg0.parent[0].match(/<div class="lp-part">(Part|Passage) \d/g) || []).length === 2 && d !== d0);
}
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const tasks = (kid) => Object.keys(dates).map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const XP = { allAboutMe: { on: true }, moneyLife: { on: true }, wilderness: { on: true }, memoryCivics: { on: true }, notes: { on: true } };
const mk = (kid, extra) => Object.assign({ weekData: { dates, tasks: tasks(kid) }, weekNum: 12, weekDates: "Nov 16–20, 2026", extraPages: XP, prevSummary: {}, pace: [], units: [], nbKidName: "Student" }, extra || {});
const all = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
const LCTX = { number: { on: true, lv: "g1", lvFrom: "saved", opt: false, cur: null, ready: true, next: L.next(tN, { lv: "g1" }, 12) }, reading: { on: true, lv: "g1", lvFrom: "saved", opt: false, cur: null, ready: true, next: L.next(tR, { lv: "g1" }, 12) } };
const themes = Object.keys(NB.themes || {});
const GENS = Object.keys(NB.GENERATORS).map((k) => [k]).concat(themes.map((th) => ["kidt_" + th, { notebookTheme: th, nbGrade: "Pre-K", kidName: "Sam" }]), [["kidz"], ["kidg", { gradeBand: "3rd–4th", grade: "3rd Grade" }]]);
ok("every generator + every Pre-K look + a starter notebook (" + GENS.length + ")", GENS.length >= Object.keys(NB.GENERATORS).length + 2);
for (const [kid, extra] of GENS) {
  ok(kid + ": student + guide = the tree without NBLADPLACE3, ladders or not", all(NB.generate(kid, mk(kid, extra))) === all(NB0.generate(kid, mk(kid, extra))) &&
    all(NB.generate(kid, mk(kid, Object.assign({ ladders: LCTX }, extra)))) === all(NB0.generate(kid, mk(kid, Object.assign({ ladders: LCTX }, extra)))));
}
{
  const byKid = {}; Object.keys(NB.GENERATORS).forEach((k) => (byKid[k] = mk(k)));
  ok("the combined parent packet = the tree without NBLADPLACE3", NB.combinedParent(byKid) === NB0.combinedParent(byKid));
}

// ════════════════════════════════════════ page fit ════════════════════════════════════════
console.log("── page fit (8.5×11in, overflow hidden), every page of every picked level ──");
const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(CHROME)) console.log("  page measurement — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
else {
  const MEASURE = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      const r = pg.getBoundingClientRect(), cs = getComputedStyle(pg), lim = r.bottom - parseFloat(cs.paddingBottom), limR = r.right - parseFloat(cs.paddingRight);
      let low = r.top, right = r.left; [].forEach.call(pg.querySelectorAll("*"), function (el) { const b = el.getBoundingClientRect(); if (b.bottom > low) low = b.bottom; if (b.right > right) right = b.right; });
      return { lab: pg.getAttribute("data-lab"), h: Math.round(r.height), spare: Math.round(lim - low), spareR: Math.round(limR - right), wide: pg.scrollWidth - pg.clientWidth };
    });
  };
  const docs = ALL.map(({ kind, lv }) => ({ lab: kind + " " + lv, html: L.placementDoc(kind, DATA[kind], { lv, kidName: "Sam" }) }));
  const head = docs[0].html.slice(0, docs[0].html.indexOf("<body>") + 6).replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "");
  const body = docs.map((d) => { let n = 0; return d.html.slice(d.html.indexOf("<body>") + 6, d.html.lastIndexOf("</body>")).replace(/<div class="page ([a-z-]+)">/g, (m, cl) => '<div class="page ' + cl + '" data-lab="' + d.lab + " · " + (cl === "lp-parent" ? "grown-up" : "sheet " + (++n)) + '">'); }).join("\n");
  const html = head + body + "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body></html>";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladplace3-")), f = path.join(dir, "p.html");
  fs.writeFileSync(f, html);
  let res = null;
  for (let tryN = 0; tryN < 3 && !res; tryN++) {
    const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof" + tryN), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 60000 });
    const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
    if (m) res = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
  }
  if (!res) console.log("  page measurement — SKIPPED (Google Chrome would not run headless here)");
  else {
    console.log("  (" + res.map((p) => p.lab + " " + p.spare + "px").join("; ") + ")");
    const bad = res.filter((p) => p.spare < 0 || p.spareR < 0 || p.wide > 0 || p.h !== 1056);
    const tight = res.slice().sort((a, b) => a.spare - b.spare).slice(0, 4).map((p) => p.lab + " " + p.spare + "px");
    ok("Google Chrome headless: " + res.length + " placement pages (" + ALL.length + " checks), every one 11in tall with nothing clipped below or to the right (tightest: " + tight.join(", ") + ")",
      !bad.length && res.length === docs.reduce((n, d) => n + (d.html.match(/<div class="page /g) || []).length, 0), bad);
  }
}

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
