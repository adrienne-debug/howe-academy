// 📏 NBLADPLACE_BANK — the placement check's "how to choose" line names the bank when a bank rung sits between the picked
// level and the level above (her pick 2026-11-24, asked "keep → 3rd grade, or say the bank?" → "Say the 4th bank").
// Run: node test_nb_ladplace_bank.js
//  · which picked levels have that shape (number 3rd → the 4th-grade bank, number 5th → the 6th-grade bank — and no others).
//  · the new line for number 3rd and 5th, the old "comes right after it" note gone; every other line the same as before.
//  · every other picked level of both ladders: the grown-up's page byte for byte the same as the tree with the block cut out.
//  · the child's sheets: byte-identical to the tree with the block cut out, every picked level of both ladders.
//  · page fit for the changed grown-up pages, in Google Chrome headless when it is on this machine (else SKIPPED, said plainly).
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const nbSrc = rd("notebooks.js");
const NUM = JSON.parse(rd("ladders/number_thinking.json")), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");

// ════════════════════════════════════════ the block ════════════════════════════════════════
console.log("── the block ──");
const START = "  // NBLADPLACE_BANK_START", END = "  // NBLADPLACE_BANK_END\n";
const b0 = nbSrc.indexOf(START), b1 = nbSrc.indexOf(END);
const p3a = nbSrc.indexOf("  // NBLADPLACE3_START"), p3b = nbSrc.indexOf("  // NBLADPLACE3_END"), rules0 = nbSrc.indexOf("  function ladPlace3Rules(");
ok("one NBLADPLACE_BANK block, inside NBLADPLACE3, just before the rule lines", b0 > p3a && b1 > b0 && b1 < rules0 && rules0 < p3b && nbSrc.indexOf("NBLADPLACE_BANK_START", b0 + 20) < 0);
const blk = nbSrc.slice(b0, b1);
ok("no kid or family name in the block", !NAMES.test(blk), (blk.match(NAMES) || [])[0]);
ok("no DOM, no Firebase in the block", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(blk)));
const rest = nbSrc.slice(0, b0) + nbSrc.slice(b1 + END.length);
ok("outside the block its one function is called once, behind a typeof guard, in the rule lines", (code(rest).match(/\bladPlaceBankMid\b/g) || []).length === 2 &&
  rest.indexOf('typeof ladPlaceBankMid === "function"') > rest.indexOf("  function ladPlace3Rules(") && rest.indexOf('typeof ladPlaceBankMid === "function"') < rest.indexOf("  function ladPlace3Note("));
ok("the change is in the rule lines only: nothing in the pages, the picture code or the pair changed shape", !/ladPlaceBankMid/.test(nbSrc.slice(nbSrc.indexOf("  function ladderPlacementPages("))) &&
  !/ladPlaceBankMid/.test(nbSrc.slice(0, p3a)));

const NB = load(nbSrc), L = NB.ladders, NB0 = load(rest), L0 = NB0.ladders;
const tN = L.track("number", NUM), tR = L.track("reading", READ);
const DATA = { number: NUM, reading: READ }, TRACK = { number: tN, reading: tR };
const rules = (pg) => (pg.parent[0].match(/<p class="lp-rule">[^<]*<\/p>/g) || []).map((s) => s.replace(/<[^>]+>/g, ""));
const ALL = [];
for (const kind of ["number", "reading"]) for (const lv of TRACK[kind].order) ALL.push({ kind, lv });
const PG = {}, PG0 = {};
for (const { kind, lv } of ALL) { PG[kind + " " + lv] = L.placementPages(kind, DATA[kind], { lv, kidName: "Sam" }); PG0[kind + " " + lv] = L0.placementPages(kind, DATA[kind], { lv, kidName: "Sam" }); }

// ════════════════════════════════════════ which picked levels have the shape ════════════════════════════════════════
console.log("── which picked levels have a bank between the picked level and the one above ──");
const shape = ALL.filter(({ kind, lv }) => { const t = TRACK[kind], pr = L.placementPair(t, lv); if (!pr || !pr.up) return false;
  for (let i = t.order.indexOf(pr.hi) + 1; i < t.order.indexOf(pr.up); i++) if (t.levels[t.order[i]].bank) return true; return false; }).map((x) => x.kind + " " + x.lv);
ok("exactly number 3rd grade and number 5th grade (no reading level, no other number level)", shape.join() === "number g3,number g5", shape);

// ════════════════════════════════════════ the new lines ════════════════════════════════════════
console.log("── the grown-up's lines, number 3rd and 5th grade ──");
const WANT = {
  "number g3": { before: [
    "4th grade is the question bank on the Notebook tab, not part of this ladder — so this check uses the nearest levels: 2nd grade, 3rd grade and 5th grade.",
    "Comfortable and mostly right on Part 3 → 5th grade.",
    "Comfortable on Part 2, but Part 3 is a struggle → 3rd grade (the 4th-grade question bank on the Notebook tab comes right after it).",
    "A struggle on Part 2 → 2nd grade."], after: [
    "4th grade is the question bank on the Notebook tab, not part of this ladder — so this check uses the nearest levels: 2nd grade, 3rd grade and 5th grade.",
    "Comfortable and mostly right on Part 3 → 5th grade.",
    "Comfortable on Part 2, but Part 3 is a struggle → the 4th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).",
    "A struggle on Part 2 → 2nd grade."] },
  "number g5": { before: [
    "4th grade and 6th grade are question banks on the Notebook tab, not part of this ladder — so this check uses the nearest levels: 3rd grade, 5th grade and 7th grade.",
    "Comfortable and mostly right on Part 3 → 7th grade.",
    "Comfortable on Part 2, but Part 3 is a struggle → 5th grade (the 6th-grade question bank on the Notebook tab comes right after it).",
    "A struggle on Part 2 → the 4th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).",
    "A struggle on Part 1 too → 3rd grade."], after: [
    "4th grade and 6th grade are question banks on the Notebook tab, not part of this ladder — so this check uses the nearest levels: 3rd grade, 5th grade and 7th grade.",
    "Comfortable and mostly right on Part 3 → 7th grade.",
    "Comfortable on Part 2, but Part 3 is a struggle → the 6th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).",
    "A struggle on Part 2 → the 4th-grade question bank (it lives on the Notebook tab, so it isn’t in this check).",
    "A struggle on Part 1 too → 3rd grade."] },
};
const TAIL = "This check doesn’t change anything in the app. Afterwards, pick the level on the Notebook tab, in the Ladders card.";
for (const k of Object.keys(WANT)) {
  const r = rules(PG[k]).filter((s) => s !== TAIL), r0 = rules(PG0[k]).filter((s) => s !== TAIL);
  console.log("  " + k + " before:\n    " + r0.join("\n    ") + "\n  " + k + " after:\n    " + r.join("\n    "));
  ok(k + ": the lines before (block cut out) are the old ones", JSON.stringify(r0) === JSON.stringify(WANT[k].before), r0);
  ok(k + ": the lines now — the middle one names the bank, the rest unchanged", JSON.stringify(r) === JSON.stringify(WANT[k].after), r);
  ok(k + ": the grown-up's page differs from before in that one line only", PG[k].parent[0].replace(WANT[k].after[2], WANT[k].before[2]) === PG0[k].parent[0] && PG[k].parent[0] !== PG0[k].parent[0]);
  ok(k + ": uses the same bank phrase the 'struggle on Part 2' line uses for a bank below", / → the \d+th-grade question bank \(it lives on the Notebook tab, so it isn’t in this check\)\.$/.test(WANT[k].after[2]));
}
ok("the old 'comes right after it' note is gone from every grown-up page", Object.values(PG).every((p) => p.parent.join("").indexOf("comes right after it") < 0));

// ════════════════════════════════════════ every other picked level unchanged ════════════════════════════════════════
console.log("── every other picked level of both ladders: the grown-up's page as before ──");
for (const { kind, lv } of ALL) {
  const k = kind + " " + lv; if (WANT[k]) continue;
  ok(k + ": grown-up's page byte for byte the same (" + rules(PG[k]).length + " lines)", PG[k].parent.join("\n") === PG0[k].parent.join("\n"));
}

// ════════════════════════════════════════ the child's sheets ════════════════════════════════════════
console.log("── the child's sheets: byte-identical to the tree with the block cut out ──");
for (const { kind, lv } of ALL) {
  const k = kind + " " + lv;
  ok(k + ": " + PG[k].child.length + " child sheet(s) the same", PG[k].child.length === PG0[k].child.length && PG[k].child.join("\n") === PG0[k].child.join("\n"));
}
{
  const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
  const tasks = (kid) => Object.keys(dates).map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
  const LCTX = { number: { on: true, lv: "g3", lvFrom: "saved", opt: false, cur: null, ready: true, next: L.next(tN, { lv: "g3" }, 12) } };
  const mk = (kid) => ({ weekData: { dates, tasks: tasks(kid) }, weekNum: 12, weekDates: "Nov 16–20, 2026", prevSummary: {}, pace: [], units: [], nbKidName: "Student", ladders: LCTX });
  const all = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
  const kids = Object.keys(NB.GENERATORS);
  ok("every weekly notebook generator (" + kids.length + "), with a number ladder at 3rd grade: the same as before", kids.every((kid) => all(NB.generate(kid, mk(kid))) === all(NB0.generate(kid, mk(kid)))));
}

// ════════════════════════════════════════ page fit ════════════════════════════════════════
console.log("── page fit (8.5×11in, overflow hidden), the changed grown-up pages ──");
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
  const docs = Object.keys(WANT).map((k) => ({ lab: k, html: L.placementDoc("number", NUM, { lv: k.split(" ")[1], kidName: "Sam" }) }));
  const head = docs[0].html.slice(0, docs[0].html.indexOf("<body>") + 6).replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "");
  const body = docs.map((d) => { let n = 0; return d.html.slice(d.html.indexOf("<body>") + 6, d.html.lastIndexOf("</body>")).replace(/<div class="page ([a-z-]+)">/g, (m, cl) => '<div class="page ' + cl + '" data-lab="' + d.lab + " · " + (cl === "lp-parent" ? "grown-up" : "sheet " + (++n)) + '">'); }).join("\n");
  const html = head + body + "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body></html>";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladbank-")), f = path.join(dir, "p.html");
  fs.writeFileSync(f, html);
  let res = null;
  for (let tryN = 0; tryN < 3 && !res; tryN++) {
    const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof" + tryN), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 60000 });
    const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
    if (m) res = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
  }
  if (!res) console.log("  page measurement — SKIPPED (Google Chrome would not run headless here)");
  else {
    const grown = res.filter((p) => / · grown-up$/.test(p.lab));
    console.log("  (" + res.map((p) => p.lab + " " + p.spare + "px").join("; ") + ")");
    const bad = grown.filter((p) => p.spare < 0 || p.spareR < 0 || p.wide > 0 || p.h !== 1056);
    ok("Google Chrome headless: the grown-up pages for number 3rd and 5th grade are 11in tall, nothing clipped below or to the right (" + grown.map((p) => p.lab + " " + p.spare + "px spare").join(", ") + ")",
      grown.length === 2 && !bad.length, bad);
  }
}

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
