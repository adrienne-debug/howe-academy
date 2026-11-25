// ✍ LR_WFMARK — "written first" on the 1st-grade Teaching Companion's Read and Answer answers (her answer 2026-11-25 to
// "mark 'written first' questions on the Teaching Companion?": "Yes, mark them"). Run: node test_nb_ladread_wfmark.js
//  (a) the block: one in notebooks.js, right after NBLADREAD3_END; one marked call line, in lrCompanion; no DOM, no Firebase,
//      no ladder reads, no family names
//  (b) the baseline = THIS tree with the LR_WFMARK block and its call line cut out (no git, no pinned commit)
//  (c) the mark: after the right answer of exactly the questions that printed write-first (wf one → the 2nd reading day only,
//      both → both days; the question's writeFirst flag; levels g3 and up), nothing else on the guide changed
//  (d) no mark when write-first is off, at g1/g2, or with the ladder off → the guide byte for byte as before
//  (e) the child's notebook (paper and tablet copy) byte for byte as before; every other kid's notebook byte for byte as before
//  (f) page fit in Google Chrome headless: every page of the guide 11in and unclipped, none that fit before overflows now
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const SRC = rd("notebooks.js"), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");
const MARK = ' <span style="font-size:8.5px;font-weight:700;color:var(--lu-mid);">✍ written first</span>';

// ════════════════════════════════════ (a) the block ════════════════════════════════════
console.log("(a) the block");
const B0 = SRC.indexOf("  // LR_WFMARK_START"), B1 = SRC.indexOf("  // LR_WFMARK_END\n");
ok("one LR_WFMARK block, right after NBLADREAD3_END (a blank line after it)", B0 > 0 && SRC.indexOf("  // LR_WFMARK_END\n\n") === B1 && B0 === SRC.indexOf("  // NBLADREAD3_END\n\n") + "  // NBLADREAD3_END\n\n".length && B1 > B0 && SRC.indexOf("LR_WFMARK_START", B0 + 20) < 0);
const blk = SRC.slice(B0, B1);
ok("no kid or family name in the block", !NAMES.test(code(blk)), (code(blk).match(NAMES) || [])[0]);
ok("no DOM, no Firebase, no ladder read (it only reads the page's wf and the question's flag)", !/db\.ref|firebase|document\.|getElementById|window\.|ctx\b|\.ladders/i.test(code(blk)));
const sites = SRC.split("\n").filter((l) => /LR_WFMARK/.test(l) && !/^\s*\/\/ LR_WFMARK_(START|END)/.test(l));
const lc0 = SRC.indexOf("  function lrCompanion("), lc = SRC.slice(lc0, SRC.indexOf("\n  }\n", lc0));
ok("one marked call line, in lrCompanion (the 1st-grade Companion page), and lrWfMark called nowhere else", sites.length === 1 && lc.indexOf(sites[0]) > 0 &&
  /^\s*lrWfMark\(pg, q\) \+\s+\/\/ LR_WFMARK/.test(sites[0]) && SRC.split("lrWfMark(").length === 3);
const l30 = SRC.indexOf("  function lr3Parent("), l3p = SRC.slice(l30, SRC.indexOf("\n  }\n", l30));
ok("the 4th- and 6th-grade parent page is not touched (it has its own mark)", l3p.indexOf("lrWfMark") < 0 && l3p.indexOf("✍ written first") > 0);

// ════════════════════════════════════ (b) load: now + the baseline ════════════════════════════════════
let BASE = SRC.slice(0, B0) + SRC.slice(B1 + "  // LR_WFMARK_END\n\n".length);
const cut = BASE.split("\n").filter((l) => /LR_WFMARK/.test(l));
BASE = BASE.split("\n").filter((l) => !/LR_WFMARK/.test(l)).join("\n");
ok("the baseline cut takes the block (+ its blank line) and the one call line, nothing else", cut.length === 1 && SRC.length - BASE.length === blk.length + "  // LR_WFMARK_END\n\n".length + cut[0].length + 1 && BASE.indexOf("lrWfMark") < 0);
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const NB = load(SRC), OLD = load(BASE), I = NB._internal, L = NB.ladders;
const KIDS = Object.keys(NB.GENERATORS), K1 = KIDS.filter((k) => NB.GENERATORS[k].build === I.generateLucy && NB.ladderPages(k).reading);
ok("the 1st-grade notebook found through its builder + HoweNotebooks.ladderPages (the test names no kid)", K1.length === 1, K1);
const KID = K1[0], TR = L.track("reading", READ);

// ── fixtures (made-up week, no family data) ──
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Math Book — p. 12", "📖 Closing Notebook — Closing Notebook"];
const mkCtx = (kid, extra) => { const ds = Object.keys(DATES); return Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates: Object.assign({}, DATES), tasks: ds.flatMap((d) => T5.map((t) => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {} }, extra || {}); };
// ctx.ladders.reading the way index.html builds it (nbLadderCtx), straight from the engine
const rl = (st, wk) => { st = Object.assign({ on: true, lv: "g1", opt: false, cur: null, days: null, wf: null }, st || {}); return { reading: Object.assign({}, st, { lvFrom: "saved", ready: true, next: L.next(TR, st, wk || 12, 2) }) }; };
const gen = (kid, ctx) => NB.generate(kid, clone(ctx)), genOld = (kid, ctx) => OLD.generate(kid, clone(ctx));
const companion = (html) => html.slice(html.indexOf("Teaching Companion — Read and Answer"));
const WFLV = TR.order.filter((lv) => !/^g[12]$/.test(lv));
ok("write-first levels on the track: " + WFLV.join(" "), WFLV.length >= 4 && WFLV.indexOf("g3") === 0);

// ════════════════════════════════════ (c) the mark ════════════════════════════════════
console.log("(c) the mark: exactly the questions that printed write-first");
let marked = 0, plainOnWf = 0;
for (const lv of WFLV) for (const wf of ["one", "both"]) {
  const ctx = mkCtx(KID, { ladders: rl({ lv, wf }) }), out = gen(KID, ctx), old = genOld(KID, ctx), its = ctx.ladders.reading.next.items;
  const days = ["tuesday", "thursday"], wfDay = (k) => wf === "both" || k === 1;
  const want = its.reduce((a, x, k) => a + (wfDay(k) ? x.item.q.filter((q) => q.writeFirst === true).length : 0), 0);
  const back = (out.student.match(/<div class="lr-lines">/g) || []).length;
  ok(lv + " wf " + wf + ": " + want + " marks = the writing-line questions on the child's pages (" + back + ")", want > 0 && (out.parent.match(/✍ written first/g) || []).length === want && back === want);
  // each section: the mark right after the right answer of a flagged question on a write-first day, none elsewhere
  const k = companion(out.parent), secs = k.split('<div class="key-section"').slice(1);
  ok(lv + " wf " + wf + ": one Companion section per reading page", secs.length === its.length);
  const right = its.every((x, n) => {
    const s = secs[n], rows = s.split('<div class="key-row">').slice(1);
    return s.indexOf(days[n].charAt(0).toUpperCase() + days[n].slice(1) + " — “" + esc(x.item.title) + "”") > 0 && rows.length === x.item.q.length && x.item.q.every((q, i) => {
      const ans = '<span class="key-ans">' + esc(q.ans) + " — " + esc(q.c["ABCDEFGH".indexOf(q.ans)]) + "</span>", has = rows[i].indexOf(ans + MARK) > 0;
      if (wfDay(n) && q.writeFirst !== true && !has) plainOnWf++;
      return rows[i].indexOf(ans) > 0 && has === (wfDay(n) && q.writeFirst === true) && (rows[i].match(/written first/g) || []).length === (has ? 1 : 0);
    });
  });
  ok(lv + " wf " + wf + ": the mark sits right after the right answer of each flagged question" + (wf === "one" ? " of the 2nd reading day only" : " of both days") + ", on no other row", right);
  ok(lv + " wf " + wf + ": the guide without the marks is byte for byte the guide before", out.parent.split(MARK).join("") === old.parent && out.parent !== old.parent);
  ok(lv + " wf " + wf + ": the child's notebook byte for byte as before, and says nothing of it", out.student === old.student && out.student.indexOf("written first") < 0);
  marked += want;
}
ok("marks checked in all: " + marked + "; unflagged questions on a write-first day checked unmarked: " + plainOnWf, marked > 20 && plainOnWf > 0);

// ════════════════════════════════════ (d) no mark ════════════════════════════════════
console.log("(d) no write-first → no mark, the guide as before");
const offCases = [["ladder off", {}], ["reading off, wf both saved", { ladders: { reading: Object.assign({}, rl({ lv: "g4" }).reading, { on: false, wf: "both" }) } }],
  ["not loaded", { ladders: { reading: { on: true, ready: false, wf: "both" } } }]];
TR.order.forEach((lv) => offCases.push([lv + " wf never", { ladders: rl({ lv }) }], [lv + " wf ''", { ladders: rl({ lv, wf: "" }) }], [lv + " wf off", { ladders: rl({ lv, wf: "off" }) }]));
["g1", "g2"].forEach((lv) => offCases.push([lv + " wf both", { ladders: rl({ lv, wf: "both" }) }], [lv + " wf one", { ladders: rl({ lv, wf: "one" }) }]));
offCases.push(["g4 wf one, one reading day", { ladders: rl({ lv: "g4", wf: "one", days: "wednesday" }) }]);
const offBad = offCases.filter(([n, x]) => { const c = mkCtx(KID, x), a = gen(KID, c), b = genOld(KID, c); return a.parent !== b.parent || a.student !== b.student || a.parent.indexOf("written first") >= 0; }).map((c) => c[0]);
ok(offCases.length + " cases (off, not loaded, never/''/off at every level, g1/g2 with one/both, one reading day): no mark, both documents byte for byte as before", !offBad.length, offBad);

// ════════════════════════════════════ (e) the child's notebook + the other kids ════════════════════════════════════
console.log("(e) the child's notebook and every other notebook as before");
{
  const bad = [];
  for (const lv of WFLV) for (const extra of [{}, { nbPageTags: true }, { dolls: { doll: "data:image/png;base64,AAAA", outfit: "data:image/png;base64,BBBB" } }]) {
    const c = mkCtx(KID, Object.assign({ ladders: rl({ lv, wf: "both" }) }, extra)), a = gen(KID, c), b = genOld(KID, c);
    if (a.student !== b.student) bad.push(lv + JSON.stringify(Object.keys(extra)));
  }
  ok("1st-grade child's notebook, write-first both at every g3+ level, paper / tablet copy / paper dolls: byte for byte", !bad.length, bad);
  const others = KIDS.filter((k) => k !== KID), oBad = [];
  for (const k of others) for (const x of [{}, { ladders: rl({ lv: "g4", wf: "both" }) }, { ladders: rl({ lv: "g6", wf: "one" }) }, { nbPageTags: true, ladders: rl({ lv: "g78", wf: "both" }) }]) {
    const c = mkCtx(k, x); let a, b;
    try { a = gen(k, c); } catch (e) { a = { err: String(e) }; }
    try { b = genOld(k, c); } catch (e) { b = { err: String(e) }; }
    if (JSON.stringify(a) !== JSON.stringify(b)) oBad.push(k);
  }
  ok("every other notebook (" + others.length + ": the 4th- and 6th-grade ones with write-first on too) byte for byte, student + parent", !oBad.length, oBad);
}

// ════════════════════════════════════ (f) page fit ════════════════════════════════════
console.log("(f) page fit (8.5×11in, overflow hidden) — Google Chrome headless, the notebook's own CSS");
const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(CHROME)) console.log("  page measurement — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
else {
  const MEASURE = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      var b = pg.querySelector(".body"), r = pg.getBoundingClientRect(), o = { h: Math.round(r.height), clip: pg.scrollHeight - pg.clientHeight, wide: pg.scrollWidth - pg.clientWidth };
      if (b) { var low = 0; [].forEach.call(b.children, function (c) { var y = c.getBoundingClientRect().bottom; if (y > low) low = y; });
        o.spare = Math.round(b.getBoundingClientRect().bottom - parseFloat(getComputedStyle(b).paddingBottom) - low); o.clip = Math.max(o.clip, b.scrollHeight - b.clientHeight); }
      return o;
    });
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbwfmark-"));
  const run = (html, tag) => {
    const f = path.join(dir, tag + ".html");
    fs.writeFileSync(f, html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace("</body>", "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body>"));
    for (let t = 0; t < 3; t++) {
      const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof_" + tag + t), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 120000 });
      const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
      if (m) return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    }
    return null;
  };
  console.log("  measured with Google Chrome headless; web fonts NOT loaded (the fallback fonts are used, as in the other notebook fit tests); a second run adds 0.03em to every letter for a wider web font");
  const WIDE = "<style>.body, .body * { letter-spacing:0.03em; }</style></head>";
  const fits = (p) => p.h === 1056 && p.clip <= 0 && p.wide <= 0 && p.spare >= 0;
  // every g3+ level × one/both, the whole guide; the documents for all cases go in one Chrome run (each page measured)
  const cases = []; WFLV.forEach((lv) => ["one", "both"].forEach((wf) => cases.push([lv, wf])));
  const docs = cases.map(([lv, wf]) => { const c = mkCtx(KID, { ladders: rl({ lv, wf }) }); return [gen(KID, c).parent, genOld(KID, c).parent]; });
  // the hardest: each level's two longest question sets, both days write-first
  for (const lv of WFLV) {
    const two = TR.levels[lv].items.slice().sort((a, b) => JSON.stringify(b.q).length - JSON.stringify(a.q).length).slice(0, 2);
    const its = two.map((it) => TR.levels[lv].items.indexOf(it));
    const r = rl({ lv, wf: "both" }); r.reading.next.items = its.map((i, k) => ({ lv, label: TR.levels[lv].label, i, num: i + 1, of: TR.levels[lv].items.length, id: TR.levels[lv].items[i].id, item: TR.levels[lv].items[i] }));
    const c = mkCtx(KID, { ladders: r }); cases.push([lv, "both, two longest"]); docs.push([gen(KID, c).parent, genOld(KID, c).parent]);
  }
  let regress = [], unfit = [], n = 0, moved = [], ran = true;
  docs.forEach(([now, was], i) => {
    for (const [sfx, f] of [["", (h) => h], [" wide", (h) => h.replace("</head>", WIDE)]]) {
      const a = run(f(now), "now" + i + sfx.trim()), b = run(f(was), "was" + i + sfx.trim()), nm = cases[i].join(" ") + sfx;
      if (!a || !b) { ran = false; continue; }
      if (a.length !== b.length) regress.push(nm + " page count");
      a.forEach((p, j) => { n++; if (!fits(p)) unfit.push(nm + " p" + j + " " + JSON.stringify(p)); if (b[j] && fits(b[j]) && !fits(p)) regress.push(nm + " p" + j); if (b[j] && b[j].spare !== p.spare) moved.push(nm + " p" + j + " " + b[j].spare + "→" + p.spare + "px"); });
    }
  });
  if (!ran) console.log("  page measurement — SKIPPED for some documents (Google Chrome would not run headless here)");
  else {
    ok(n + " guide pages measured (" + cases.length + " weeks × normal + wider letters): every one 11in and unclipped", n > 0 && !unfit.length, unfit.slice(0, 3));
    ok("…no page that fit before overflows now, and the page count is the same (spare room that moved: " + (moved.length ? moved.join(", ") : "none — the mark fits on the answer's own line") + ")", !regress.length, regress.slice(0, 3));
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
