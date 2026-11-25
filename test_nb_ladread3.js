// 📖 NBLADREAD3 — "Read and answer" in the 4th- and 6th-grade notebooks, write-first days, and the 4th-grade notebook's old
// built-in passages retired: slice 3 of the notebook ladders (notebooks study, her words 2026-11-23/24: "Build it"; reading
// "twice a week sounds great"; from 3rd grade up "Write first some days"; "A full page" for 6th–8th; the old passages "Retire
// them" when the ladder goes into that notebook). Run: node test_nb_ladread3.js
//  (a) the blocks: one in each file, right after slice 2's; no family names, no answer giver; the two notebooks are found
//      through HoweNotebooks.ladderPages + their builders (the test names no kid)
//  (b) ladder off (every way) → every notebook byte for byte = THIS tree with the NBLADREAD3 block and its call sites cut out
//      (built below — no git, no pinned commit); the retirement rule exactly: reading switched on → the old passage box and
//      its two key rows are gone and nothing else changed; a week the CogAT bank covers → nothing changes at all
//  (c) on → the engine's passages on the right days in both notebooks, right behind the day's own pages, every other page in
//      its place; the place to save (readingCursor)
//  (d) no answer, no why line, no mark, no extra attribute on any child page — front, back and plain, every passage, both looks
//  (e) the parent page: answers + why lines, "written first" marks; the other parent pages unchanged
//  (f) write-first: never / one / both; flagged vs unflagged; the back page; g1/g2 never; the 1st-grade notebook at g3;
//      the sheet: the front on a sheet front, its back right after, a Notes pad only when needed
//  (g) the tablet tags; (h) index.html: the wf choice (where it shows, one field, Mom only, dry-run inert), the card note
//  (i) page fit in Google Chrome headless with each notebook's real CSS: every passage plain, every g3+ passage front and back,
//      the parent page, whole builds, the retired daily page
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const SRC = rd("notebooks.js"), IX = rd("index.html"), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");

// ════════════════════════════════════ (a) the blocks ════════════════════════════════════
console.log("(a) the blocks");
const B0 = SRC.indexOf("  // NBLADREAD3_START"), B1 = SRC.indexOf("  // NBLADREAD3_END\n\n");
const I0 = IX.indexOf("// NBLADREAD3_START"), I1 = IX.indexOf("// NBLADREAD3_END\n");
ok("one NBLADREAD3 block in notebooks.js, right after slice 2's (NBLADREAD_END)", B0 === SRC.indexOf("  // NBLADREAD_END\n\n") + "  // NBLADREAD_END\n\n".length && B1 > B0 && SRC.indexOf("NBLADREAD3_START", B0 + 20) < 0);
ok("one NBLADREAD3 block in index.html, right after slice 2's", I0 === IX.indexOf("// NBLADREAD_END\n") + "// NBLADREAD_END\n".length && I1 > I0 && IX.indexOf("NBLADREAD3_START", I0 + 5) < 0);
const nbBlk = SRC.slice(B0, B1), ixBlk = IX.slice(I0, I1);
const ldBlk = IX.slice(IX.indexOf("// NBLADDER_START"), IX.indexOf("// NBLADDER_END\n")), rdBlk = IX.slice(IX.indexOf("// NBLADREAD_START"), IX.indexOf("// NBLADREAD_END\n"));
ok("no kid or family name in either block", !NAMES.test(code(nbBlk)) && !NAMES.test(ixBlk), (code(nbBlk).match(NAMES) || ixBlk.match(NAMES) || [])[0]);
ok("notebooks.js block: no DOM, no Firebase", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(nbBlk)));
ok("index.html block: no db.ref of its own (the one write goes through nbLadderWrite)", !/db\.ref\(/.test(ixBlk) && (ixBlk.match(/nbLadderWrite\(/g) || []).length === 1);
ok("index.html block names no ladder path (test_nb_ladder: only the NBLADDER block touches them)", ixBlk.indexOf("/ladders/") < 0 && ixBlk.indexOf(".ladders") < 0);
const words = (s) => (code(s).match(/'[^']*'|"[^"]*"/g) || []).join(" ").replace(/<[^>]*>/g, " ");
ok("no he/his/him/she/her in either block's words", !/\b(he|his|him|she|her)\b/i.test(words(nbBlk)) && !/\b(he|his|him|she|her)\b/i.test(words(ixBlk)));
ok("no 🔀 in index.html", IX.indexOf("\u{1F500}") < 0);
ok("no CSS text columns", !/column-count|column-width|(^|[^-])columns\s*:/.test(nbBlk));
const fnOf = (sig) => { const a = SRC.indexOf(sig); return SRC.slice(a, SRC.indexOf("\n  }\n", a)); };
const gE = fnOf("  function generateEllis(ctx) {"), gL = fnOf("  function generateLincoln(ctx) {"), gU = fnOf("  function generateLucy(ctx) {");
const marks = (f) => f.split("\n").filter((l) => /NBLADREAD3/.test(l));
ok("marked call sites: 4 in the 4th-grade builder, 3 in the 6th-grade one, 3 in the 1st-grade one (+ one note line), each a single line",
  marks(gE).length === 4 && marks(gL).length === 3 && marks(gU).length === 3 && [gE, gL].every((f) => marks(f).every((l) => /\/\/ NBLADREAD3/.test(l))));
ok("the card's marked lines in index.html: state, write list, reading row", (IX.match(/✍️ NBLADREAD3/g) || []).length === 3);

// ════════════════════════════════════ load: now + the baseline ════════════════════════════════════
const HOOK = "_internal: {";
const T_HOOK = HOOK + " lr3Page: lr3Page, lr3Css: lr3Css, lr3AddCss: lr3AddCss, lr3Parent: lr3Parent, lr3Flags: lr3Flags, lrWeek: lrWeek, LR_CSS: LR_CSS, luShell: luShell, ellShell: ellShell, lnFullHtml: lnFullHtml," +
  " generateEllis: generateEllis, generateLincoln: generateLincoln, ellDailyPage: ellDailyPage, ELLIS_DATA: ELLIS_DATA,";
let BASE = SRC.slice(0, B0) + SRC.slice(B1 + "  // NBLADREAD3_END\n\n".length);
const cut = BASE.split("\n").filter((l) => /NBLADREAD3/.test(l));
BASE = BASE.split("\n").filter((l) => !/NBLADREAD3/.test(l)).join("\n");
ok("the baseline cut takes only comment lines and marked call sites", cut.every((l) => /^\s*\/\//.test(l) || /\/\/ NBLADREAD3/.test(l)) && cut.length === 14, cut.length);
ok("the baseline has no definition or call of the block (the 1st-grade push only reads pg.wf, which nothing sets there)",
  !/function lr3|lr3Week\(|lr3Finish\(|lr3Retire\(|lr3Flags\(|lr3Prints\(|lr3Css\(|LR3_/.test(BASE) && (BASE.match(/lr3Push\(/g) || []).length === 1);
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const T_OLD = HOOK + " generateEllis: generateEllis, generateLincoln: generateLincoln,";
const NB = load(SRC.replace(HOOK, T_HOOK)), OLD = load(BASE.replace(HOOK, T_OLD)), I = NB._internal, L = NB.ladders;
const byBuild = (b) => Object.keys(NB.GENERATORS).filter((k) => NB.GENERATORS[k].build === b)[0];
const K4 = byBuild(I.generateEllis), K6 = byBuild(I.generateLincoln), K1 = byBuild(I.generateLucy);
// Hub merge with NBLADNUM (slice 4): the 1st-grade notebook prints number questions now; the 4th- and 6th-grade ones still don't.
ok("the 4th- and 6th-grade notebooks now print the reading ladder; the 1st-grade one still does; number pages only in the 1st-grade one", !!K4 && !!K6 && [K4, K6, K1].every((k) => NB.ladderPages(k).reading === true) && [K4, K6].every((k) => NB.ladderPages(k).number === false) && NB.ladderPages(K1).number === true);
ok("…every other notebook, a starter notebook and a Pre-K look print none", Object.keys(NB.GENERATORS).filter((k) => [K4, K6, K1].indexOf(k) < 0).every((k) => !NB.ladderPages(k).reading) &&
  NB.ladderPages("kidz").reading === false && NB.ladderPages("kidt", { notebookTheme: Object.keys(NB.themes)[0] }).reading === false);
ok("…the baseline (slice 2 alone) printed reading only in the 1st-grade notebook", !OLD.ladderPages(K4).reading && !OLD.ladderPages(K6).reading && OLD.ladderPages(K1).reading);
const TR = L.track("reading", READ);

// ── fixtures (made-up week, no family data) ──
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const mkDates = (ds) => { const o = {}; ds.forEach((d) => (o[d] = DATES[d])); return o; };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Math Book — p. 12", "📖 Closing Notebook — Closing Notebook"];
const mkCtx = (kid, extra, ds) => {
  ds = ds || Object.keys(DATES);
  return Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates: mkDates(ds), tasks: ds.flatMap((d) => T5.map((t) => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {} }, extra || {});
};
const rl = (st, wk) => { st = Object.assign({ on: true, lv: "g4", opt: false, cur: null, days: null, wf: null }, st || {}); return { reading: Object.assign({}, st, { lvFrom: "saved", ready: true, next: L.next(TR, st, wk || 12, 2) }) }; };
const gen = (kid, ctx) => NB.generate(kid, clone(ctx));
const genOld = (kid, ctx) => OLD.generate(kid, clone(ctx));
const both = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
function dgBook() {   // a made-up Daily Grams book (the shape test_nbt_today.js uses)
  const pages = { day: {}, ans: {} }, dayAns = {};
  for (let d = 1; d <= 12; d++) { pages.day[d] = "data:image/png;base64,DAY" + d; dayAns[d] = [197]; }
  pages.ans[197] = "data:image/png;base64,ANS197";
  return { book: "dgTest", title: "Daily Grams Grade 4", total: 12, cursor: { week: 12, day: 1, adv: 5 }, ansMeta: { 197: { first: 1, last: 12, cont: false } }, dayAns, pages };
}
const cqBank = (fromWeek) => ({ cursor: { week: fromWeek, day: 1, adv: 5, from: fromWeek }, items: Array.from({ length: 9 }, (_, i) => ({ type: "A", text: "hot : cold :: up : ?" + i, c: ["down", "left", "high", "warm", "top"], ans: "A" })) });
// every page of a document, in order: { lab (page-label or the comment before it), day, name (tablet tags) }
const pagesOf = (html) => { const out = [], re = /(?:<div class="page-label">([^<]*)<\/div>\s*|<!--\s*([^>]*?)\s*-->\s*)?<div class="page"((?: data-nb-day="([^"]*)" data-nb-name="([^"]*)")?)[ >]/g; let m;
  while ((m = re.exec(html))) out.push({ lab: m[1] || m[2] || "", day: m[4] || "", name: m[5] || "" }); return out; };
const isRA = (p) => /^Read and Answer|^READ AND ANSWER/.test(p.lab);
const titles = (html) => (html.match(/<div class="lr-title">([^<]*)</g) || []).map((s) => s.replace('<div class="lr-title">', "").replace("<", ""));

// ════════════════════════════════════ (b) off → byte for byte; the retirement rule ════════════════════════════════════
console.log("(b) off → byte for byte as before; the retirement rule exactly");
{
  const r0 = rl();
  const OFF = {
    "no ladders at all": {},
    "ladders null": { ladders: null },
    "reading saved but off (with write-first both saved)": { ladders: { reading: Object.assign({}, r0.reading, { on: false, wf: "both" }) } },
    "number only": { ladders: { number: { on: true, lv: "g4", ready: true, next: { items: [{ lv: "g4", item: { text: "1 2 ?" } }] } } } },
    "with the tablet tags, off": { nbPageTags: true },
    "Daily Grams + CogAT bank, off": { dailyGrams: dgBook(), cogatBank: cqBank(1) },
  };
  const themes = Object.keys(NB.themes || {});
  const GENS = Object.keys(NB.GENERATORS).map((k) => [k]).concat(themes.map((th) => ["kidt_" + th, { notebookTheme: th, nbGrade: "Pre-K", kidName: "Sam" }]), [["kidz"]]);
  for (const [name, extra] of Object.entries(OFF)) {
    const diff = [];
    for (const [kid, ex2] of GENS) { const c = mkCtx(kid, Object.assign({}, extra, ex2 || {})); const a = gen(kid, c); if (both(a) !== both(genOld(kid, c)) || "readingCursor" in a) diff.push(kid); }
    ok(name + ": all " + GENS.length + " notebooks (built-ins, every look, starter) = before, no cursor", !diff.length, diff);
  }
  const byKid = {}; Object.keys(NB.GENERATORS).forEach((k) => (byKid[k] = mkCtx(k, { ladders: { reading: Object.assign({}, r0.reading, { on: false }) } })));
  ok("the combined parent packet, reading off = before", NB.combinedParent(byKid) === OLD.combinedParent(byKid));
  // reading switched ON but nothing prints this time (not loaded / no items / finished / no school days) — the 6th-grade notebook
  // is as before; the 4th-grade one loses exactly the old passage box and its two key rows, nothing else
  const ON0 = {
    "on, file not loaded yet": { ladders: { reading: Object.assign({}, r0.reading, { ready: false, next: null }) } },
    "on and loaded, no items": { ladders: { reading: Object.assign({}, r0.reading, { next: { kind: "reading", items: [], stop: null, end: false, cursor: null } }) } },
    "on, ladder finished": { ladders: rl({ lv: "g78", cur: { week: 11, lv: "g78", from: 10, adv: 1, opt: false } }, 12) },
  };
  ok("the finished fixture really is finished", ON0["on, ladder finished"].ladders.reading.next.end === true);
  const BOX = /    <div class="sec-label sec-red">🎯 Iowa Reading — Test Prep<\/div>\n    <div class="card card-read">\n      <div class="passage-block">[\s\S]*?<div class="skill-note">⚙️ Skill: [^<]*<\/div>\n    <\/div>/g;
  const KEY1 = /<div class="key-row"><div class="key-label">Iowa R<\/div>[\s\S]*?<\/div><\/div>/g;
  const KEY2 = /<div style="font-size:7\.5px;font-weight:700;color:var\(--tf-dark\);margin:2px 0 1px;">📡 [^<]*<\/div><div style="font-size:7\.5px;color:#444;margin-bottom:1px;">[^<]*<\/div>[\s\S]*?(?=<div style="font-size:7\.5px;font-weight:700;color:#8b0000)/g;
  const retired = (o) => ({ student: o.student.replace(BOX, ""), parent: o.parent.replace(KEY1, "").replace(KEY2, "").replace("Word · Iowa Reading · Language · Math", "Word · Language · Math") });
  const P8 = I.ELLIS_DATA.banks.passages;
  ok("the old built-in passages: 8 of them, still in the file (a week with reading off still prints them)", P8.length === 8);
  for (const [name, extra] of Object.entries(ON0)) {
    const c6 = mkCtx(K6, extra), c4 = mkCtx(K4, extra), a6 = gen(K6, c6), a4 = gen(K4, c4), o4 = genOld(K4, c4);
    ok(name + ": 6th grade = before, no cursor", both(a6) === both(genOld(K6, c6)) && !("readingCursor" in a6));
    ok(name + ": 4th grade, no CogAT bank — before had the old box on every day (" + (o4.student.match(BOX) || []).length + "), now none",
      (o4.student.match(BOX) || []).length === 5 && a4.student.indexOf("Iowa Reading — Test Prep") < 0 && P8.every((p) => a4.student.indexOf(p.title) < 0 && a4.parent.indexOf(p.title) < 0));
    ok(name + ": …and that is the ONLY change: before minus the box = now (student); minus the two key rows (parent)", both(a4) === both(retired(o4)) && !("readingCursor" in a4), [a4.student.length, retired(o4).student.length, a4.parent.length, retired(o4).parent.length]);
  }
  // live: the CogAT bank (from its start week) fills the reading box every day → switching the ladder on changes nothing there
  const cov = mkCtx(K4, Object.assign({ cogatBank: cqBank(10) }, ON0["on, file not loaded yet"]));
  ok("a week the CogAT bank covers: on (nothing printed) = before, byte for byte", both(gen(K4, cov)) === both(genOld(K4, cov)) && genOld(K4, cov).student.indexOf("Iowa Reading — Test Prep") < 0);
  const pre = mkCtx(K4, Object.assign({ cogatBank: cqBank(20) }, ON0["on, file not loaded yet"]));
  ok("a week before the bank's start week: before showed the old passages; on → retired exactly", genOld(K4, pre).student.indexOf("Iowa Reading — Test Prep") > 0 && both(gen(K4, pre)) === both(retired(genOld(K4, pre))));
  const preOff = mkCtx(K4, { cogatBank: cqBank(20) });
  ok("…the same week with the ladder off: the old passages print exactly as before", both(gen(K4, preOff)) === both(genOld(K4, preOff)));
}

// ════════════════════════════════════ (c) on → the engine's passages, on the right days, right behind the day ════════════════════════════════════
console.log("(c) on → one page per passage, on the right days, right behind that day's own pages");
for (const [K, lv, nm] of [[K4, "g4", "4th grade"], [K6, "g6", "6th grade"]]) {
  const variants = [
    ["full week", {}, null, null],
    ["full week, Daily Grams + the tablet tags", { dailyGrams: dgBook() }, null, null],
    ["ticks Mon + Fri, every extra page off", { extraPages: { allAboutMe: { on: false }, moneyLife: { on: false }, memoryCivics: { on: false }, notes: { on: false }, wilderness: { on: false } } }, null, "monday friday"],
    ["a 3-day week", {}, ["monday", "tuesday", "wednesday"], null],
    ["a 1-day week", {}, ["thursday"], null],
    ["brain breaks off", { extraPages: { brainBreaks: { on: false } } }, null, null],
  ];
  for (const [vn, extra, ds, tick] of variants) {
    const ctx = mkCtx(K, Object.assign({ nbPageTags: true, ladders: rl({ lv, days: tick }) }, extra), ds), out = gen(K, ctx), want = ctx.ladders.reading.next.items;
    const was = pagesOf(genOld(K, mkCtx(K, Object.assign({ nbPageTags: true }, extra), ds)).student), now = pagesOf(out.student);
    const rp = now.filter(isRA), days = (ds || Object.keys(DATES)), wantDays = tick ? tick.split(" ") : (days.length >= 4 ? [days[1], days[3]] : days.length === 3 ? [days[1], days[2]] : days.slice(0, 2));
    ok(nm + ", " + vn + ": " + wantDays.length + " reading page(s), on " + wantDays.join(" + ") + ", the engine's passages in order",
      rp.length === wantDays.length && rp.every((p, i) => p.day === wantDays[i]) && JSON.stringify(titles(out.student)) === JSON.stringify(want.slice(0, wantDays.length).map((x) => esc(x.item.title))));
    ok(nm + ", " + vn + ": every page that was there is still there, in the same order", JSON.stringify(now.filter((p) => !isRA(p))) === JSON.stringify(was));
    ok(nm + ", " + vn + ": each reading page sits right behind its day's own last page, before the next day's first", now.every((p, i) => !isRA(p) || (now[i - 1].day === p.day && (!now[i + 1] || now[i + 1].day !== p.day))));
    ok(nm + ", " + vn + ": the place to save = the engine's cursor with this week's count", JSON.stringify(out.readingCursor) === JSON.stringify(Object.assign({}, ctx.ladders.reading.next.cursor, { adv: wantDays.length })));
  }
  const ctx = mkCtx(K, { ladders: rl({ lv }) }), out = gen(K, ctx), want = ctx.ladders.reading.next.items;
  const rpH = out.student.split(/(?=<div class="page-label">|<!-- )/).filter((s) => /^(<div class="page-label">Read and Answer|<!-- READ AND ANSWER)/.test(s));
  ok(nm + ": every question and every choice of each passage is on its page; the level and place in the footer", rpH.length === 2 && rpH.every((h, i) => want[i].item.q.every((q) => h.indexOf(esc(q.text)) > 0 && q.c.every((c) => h.indexOf("</span>" + esc(c) + "</span>") > 0)) &&
    h.indexOf(esc(want[i].label) + " · passage " + want[i].num + " of " + want[i].of) > 0 && h.indexOf("November 1" + (i ? "9" : "7")) > 0));
  ok(nm + ": the page is in this notebook's own look (its header and footer classes), no other theme", K === K4 ? rpH.every((h) => /<div class="page-header">/.test(h) && /<div class="page-footer">/.test(h) && /class="page-body lr-body lr-t\d"/.test(h))
    : rpH.every((h) => /<div class="header">/.test(h) && /<div class="footer">/.test(h) && /class="body lr-body lr-t\d"/.test(h)));
  ok(nm + ": the slice-2 rules come in this notebook's colours (no 1st-grade variable left)", out.student.indexOf("/* NBLADREAD — Read and answer */") > 0 && out.student.indexOf("var(--lu-") < 0 && out.student.indexOf("Fredoka") < 0);
  ok(nm + ": same ctx built twice → the same notebook", both(gen(K, ctx)) === both(out));
  const w13 = gen(K, mkCtx(K, { weekNum: "week13", ladders: rl({ lv, cur: out.readingCursor }, 13) }));
  ok(nm + ": next week picks up after these passages", JSON.stringify(titles(w13.student)) === JSON.stringify(TR.levels[lv].items.slice(2, 4).map((x) => esc(x.title))));
}

// ════════════════════════════════════ (d) nothing a child must produce on a child page ════════════════════════════════════
console.log("(d) no answer, no why, no mark, no extra attribute — every passage, every mode, both looks");
const ALL = []; TR.order.forEach((lv) => TR.levels[lv].items.forEach((it, i) => ALL.push({ lv, label: TR.levels[lv].label, i, num: i + 1, of: TR.levels[lv].items.length, id: it.id, item: it })));
const hasWf = (x) => !/^g[12]$/.test(x.lv) && x.item.q.some((q) => q.writeFirst === true);
const LOOKS = [["tf", { k: "tf", wn: 12, dates: DATES }], ["ln", { k: "ln", wn: 12, dates: DATES, emoji: "🐍" }], ["lu", { k: "lu", wn: 12, dates: DATES }]];
{
  ok("all " + ALL.length + " passages; " + ALL.filter(hasWf).length + " can have a write-first day (g3 up, a flagged question)", ALL.length === Object.keys(READ.passages).length && ALL.filter(hasWf).length > 50);
  const hit = { why: [], mark: [], attr: [], ch: [], lines: [] };
  for (const [lk, look] of LOOKS) for (const x of ALL) for (const mode of (hasWf(x) ? ["plain", "front", "back"] : lk === "lu" ? [] : ["plain"])) {
    const h = I.lr3Page(look, "tuesday", x, mode), p = x.item, tag = lk + "|" + x.id + "|" + mode;
    const own = p.text + "\n" + p.q.map((q) => q.text + "\n" + q.c.join("\n")).join("\n");
    p.q.forEach((q) => { if (own.indexOf(q.why) < 0 && (h.indexOf(esc(q.why)) >= 0 || h.indexOf(q.why) >= 0)) hit.why.push(tag); });
    if (/✅|✓|✔|data-ans|lr-right|lr-ans|answer key|written first/i.test(h)) hit.mark.push(tag);
    (h.match(/<[a-z]+\s[^>]*>/g) || []).forEach((t) => { if (!/^<[a-z]+ (class|style)="[^"]*">$/.test(t) && !/^<img src="[^"]*" alt="Autobot">$/.test(t) && t !== "<span class='hl'>") hit.attr.push(tag + " " + t); });
    const fl = p.q.filter((q) => q.writeFirst === true), un = p.q.filter((q) => q.writeFirst !== true);
    const nC = mode === "plain" ? p.q.reduce((a, q) => a + q.c.length, 0) : mode === "front" ? un.reduce((a, q) => a + q.c.length, 0) : fl.reduce((a, q) => a + q.c.length, 0);
    if ((h.match(/<span class="lr-c">/g) || []).length !== nC || (h.match(/class="lr-c(?:\s[^"]*)?"/g) || []).length !== nC) hit.ch.push(tag);
    if ((h.match(/<div class="lr-lines">/g) || []).length !== (mode === "front" ? fl.length : 0)) hit.lines.push(tag);
  }
  ok("no why line on any child page (plain, write-first front, back; 4th-, 6th- and 1st-grade looks)", !hit.why.length, hit.why.slice(0, 3));
  ok("no check mark, 'answer key' or 'written first' on a child page", !hit.mark.length, hit.mark.slice(0, 3));
  ok("no attribute but class/style (and the 4th-grade header's own logo) on any tag — nothing hidden in an attribute", !hit.attr.length, hit.attr.slice(0, 3));
  ok("choices: all of them on a plain page; on a write-first front only the unflagged questions'; on the back only the flagged ones' — every choice the same markup", !hit.ch.length, hit.ch.slice(0, 3));
  ok("writing lines: one pair per flagged question on the front, none anywhere else", !hit.lines.length, hit.lines.slice(0, 3));
  // a whole real build, both write-first days, both notebooks, at the longest levels — student document only
  for (const [K, lv] of [[K4, "g5"], [K6, "g78"]]) {
    const out = gen(K, mkCtx(K, { ladders: rl({ lv, wf: "both" }), nbPageTags: true })), its = rl({ lv }).reading.next.items;
    ok(lv + " build: the whole student notebook (tablet copy) has no why line and no 'written first' of this week's passages",
      its.every((x) => x.item.q.every((q) => out.student.indexOf(esc(q.why)) < 0 && out.student.indexOf(q.why) < 0)) && out.student.indexOf("written first") < 0);
  }
}

// ════════════════════════════════════ (e) the parent page ════════════════════════════════════
console.log("(e) the parent page: answers + why lines; the other parent pages unchanged");
for (const [K, lv] of [[K4, "g4"], [K6, "g6"], [K6, "g78"], [K4, "g3"]]) {
  const ctx = mkCtx(K, { ladders: rl({ lv, wf: "one" }) }), out = gen(K, ctx), its = ctx.ladders.reading.next.items;
  const pp = pagesOf(out.parent), po = pagesOf(genOld(K, mkCtx(K, {})).parent);   // (the 4th-grade key rows' retirement is checked in (b))
  ok(lv + ": one parent page more, after the others (which are unchanged)", pp.length === po.length + 1 && JSON.stringify(pp.slice(0, -1)) === JSON.stringify(po) &&
    /^(Teaching Companion — Read and Answer|PARENT PAGE: READ AND ANSWER)/.test(pp[pp.length - 1].lab));
  const k = out.parent.slice(Math.max(out.parent.indexOf("PARENT PAGE: READ AND ANSWER"), out.parent.indexOf("Teaching Companion — Read and Answer")));
  ok(lv + ": each page's day, title, level and place; the write-first day marked", its.every((x, n) => k.indexOf((n ? "Thursday" : "Tuesday") + " — “" + esc(x.item.title) + "” · " + esc(x.label) + " · passage " + x.num + " of " + x.of) > 0) &&
    /Thursday — [^<]* · write-first day</.test(k) && !/Tuesday — [^<]* · write-first day</.test(k));
  ok(lv + ": each question's right letter + its words, and the why line; 'written first' on exactly the flagged questions of the write-first day",
    its.every((x) => x.item.q.every((q) => k.indexOf('<span class="key-ans">' + esc(q.ans) + " — " + esc(q.c["ABCDEFGH".indexOf(q.ans)]) + "</span>") > 0 && k.indexOf(esc(q.why)) > 0)) &&
    (k.match(/written first/g) || []).length === its[1].item.q.filter((q) => q.writeFirst === true).length);
  const ours = k.replace(/<span class="key-ans">[\s\S]*?<\/span>/g, " ").replace(/<div class="lr-why">[\s\S]*?<\/div>/g, " ").replace(/“[^”]*”/g, " ").replace(/<[^>]*>/g, " ");
  ok(lv + ": the page's own words never say he/she for the child", !/\b(she|her|he|his|him)\b/i.test(ours) && /Your child reads the passage/.test(ours));
}

// ════════════════════════════════════ (f) write-first ════════════════════════════════════
console.log("(f) write-first: never / one / both, the back page, the sheet");
{
  const back = (html) => html.split(/(?=<div class="page-label">|<!-- )/).filter((s) => /^(<div class="page-label">Read and Answer — \w+ \(back\)|<!-- READ AND ANSWER \(BACK\))/.test(s));
  const fronts = (html) => html.split(/(?=<div class="page-label">|<!-- )/).filter((s) => /^(<div class="page-label">Read and Answer — \w+<|<!-- READ AND ANSWER: )/.test(s));
  for (const [K, lv] of [[K4, "g4"], [K6, "g6"], [K1, "g3"]]) {
    const nm = K === K1 ? "1st-grade notebook at " + lv : (K === K4 ? "4th" : "6th") + "-grade notebook at " + lv;
    const never = gen(K, mkCtx(K, { ladders: rl({ lv }) })), one = gen(K, mkCtx(K, { ladders: rl({ lv, wf: "one" }) })), two = gen(K, mkCtx(K, { ladders: rl({ lv, wf: "both" }) }));
    const its = rl({ lv }).reading.next.items;
    ok(nm + ": never (nothing saved) → no lines, no back page", back(never.student).length === 0 && never.student.indexOf('<div class="lr-lines">') < 0);
    ok(nm + ": one day a week → the 2nd reading day (Thursday) only", back(one.student).length === 1 && /Thursday|THURSDAY/.test(back(one.student)[0].slice(0, 80)) && (fronts(one.student)[0].match(/lr-lines/g) || []).length === 0);
    ok(nm + ": both days → both", back(two.student).length === 2);
    const f = fronts(two.student)[1], b = back(two.student)[1], q = its[1].item.q;
    ok(nm + ": front — a flagged question has lines and no choices; an unflagged one keeps its choices", q.every((x, i) => {
      const blk = f.split('<div class="lr-q">')[i + 1] || ""; return x.writeFirst === true ? (blk.indexOf("lr-lines") > 0 && blk.indexOf("lr-c") < 0) : (blk.indexOf("lr-lines") < 0 && x.c.every((c) => blk.indexOf(esc(c)) > 0)); }));
    ok(nm + ": back — the heading, then the flagged questions only, same order and numbers, with their choices", b.indexOf("Now turn back and check: circle the choice closest to what you wrote") > 0 &&
      JSON.stringify((b.match(/<span class="lr-n">(\d+)<\/span>/g) || []).map((s) => +s.replace(/\D/g, ""))) === JSON.stringify(q.map((x, i) => x.writeFirst === true ? i + 1 : 0).filter(Boolean)) &&
      q.filter((x) => x.writeFirst === true).every((x) => b.indexOf(esc(x.text)) > 0 && x.c.every((c) => b.indexOf(esc(c)) > 0)) && b.indexOf("lr-psg") < 0);
    ok(nm + ": the front's how-to line says to write, then turn the page over", /write your own answer/i.test(f) && /turn the page over/.test(f));
    ok(nm + ": the same passages and the same cursor whichever write-first choice", JSON.stringify(titles(two.student).filter((t, i, a) => a.indexOf(t) === i)) === JSON.stringify(titles(never.student)) && JSON.stringify(two.readingCursor) === JSON.stringify(never.readingCursor));
  }
  // g1 / g2 never; a passage with no flagged question → a plain page
  for (const [K, lv] of [[K1, "g1"], [K1, "g2"], [K4, "g2"], [K6, "g1"]]) {
    const o = gen(K, mkCtx(K, { ladders: rl({ lv, wf: "both" }) }));
    ok("at " + lv + " (" + (K === K1 ? "1st" : K === K4 ? "4th" : "6th") + "-grade notebook), write-first both → still plain pages, no back, no lines", back(o.student).length === 0 && o.student.indexOf('<div class="lr-lines">') < 0 && fronts(o.student).length === 2);
  }
  const x0 = ALL.find((x) => x.lv === "g4"), w0 = { pages: [{ day: "tuesday", x: Object.assign({}, x0, { item: Object.assign({}, x0.item, { q: x0.item.q.map((q) => Object.assign({}, q, { writeFirst: false })) }) }) }] };
  I.lr3Flags({ ladders: { reading: { wf: "both" } } }, w0, { k: "tf" });
  ok("a passage with no flagged question is never a write-first page", w0.pages[0].wf === false);
  const g2n = TR.levels.g2.items.length, across = rl({ lv: "g2", cur: { week: 11, lv: "g2", from: g2n - 3, adv: 2, opt: false }, wf: "both" }, 12);
  ok("a week across g2 → g3: the g2 page plain, the g3 page write-first", across.reading.next.items.map((x) => x.lv).join() === "g2,g3" &&
    (() => { const o = gen(K4, mkCtx(K4, { ladders: across })); return back(o.student).length === 1 && /THURSDAY/.test(back(o.student)[0].slice(0, 60)); })());
  const oneDay = gen(K6, mkCtx(K6, { ladders: rl({ lv: "g6", wf: "one", days: "wednesday" }) }));
  ok("one day a week with only one reading day that week → no write-first page (the 2nd reading day doesn't exist)", back(oneDay.student).length === 0);
  // the sheet: the front on a sheet front (even, counting from 0), the back right after; a Notes pad only when needed
  const XPOFF = { allAboutMe: { on: false }, moneyLife: { on: false }, memoryCivics: { on: false }, notes: { on: false }, wilderness: { on: false } };
  const sheetCases = [];
  for (const K of [K4, K6, K1]) for (const xp of [{}, XPOFF, Object.assign({}, XPOFF, { notes: { on: true } }), Object.assign({}, XPOFF, { allAboutMe: { on: true }, moneyLife: { on: true } })]) for (const extra of [{}, { dailyGrams: dgBook() }])
    sheetCases.push([K, Object.assign({ extraPages: xp }, extra)]);
  let padded = 0, unpadded = 0; const bad = [];
  for (const [K, extra] of sheetCases) {
    const lv = K === K1 ? "g3" : "g4", out = gen(K, mkCtx(K, Object.assign({ nbPageTags: true, ladders: rl({ lv, wf: "both" }) }, extra)));
    const old = genOld(K, mkCtx(K, Object.assign({ nbPageTags: true }, extra, K === K4 ? { ladders: { reading: { on: true, ready: false } } } : {})));
    const now = pagesOf(out.student), was = pagesOf(old.student);
    now.forEach((p, i) => {
      if (!isRA(p) || / \(back\)|\(BACK\)/.test(p.lab)) return;
      if (i % 2 !== 0 || !/ \(back\)|\(BACK\)/.test((now[i + 1] || {}).lab || "")) bad.push([K, i, p.lab]);
      if (now[i - 1] && now[i - 1].name === "Notes" && now[i - 1].day === p.day) padded++; else unpadded++;
    });
    const rest = now.filter((p) => !isRA(p) && !(p.name === "Notes" && now[now.indexOf(p) + 1] && isRA(now[now.indexOf(p) + 1])));
    if (JSON.stringify(rest) !== JSON.stringify(was)) bad.push([K, "order"]);
  }
  ok("every write-first front lands on a sheet front with its back right after (" + sheetCases.length + " page mixes, 3 notebooks)", !bad.length, bad.slice(0, 4));
  ok("…a Notes pad goes in only when the front would land on a back (padded " + padded + ", not padded " + unpadded + " — both happen)", padded > 0 && unpadded > 0);
  ok("…and every page that was there is still there, in order (only the reading pages and their pads are new)", !bad.some((b) => b[1] === "order"));
  const dolls = { doll: "data:image/png;base64,AAAA", outfit: "data:image/png;base64,BBBB" };
  const ld = pagesOf(gen(K1, mkCtx(K1, { dolls, ladders: rl({ lv: "g3", wf: "both" }) })).student), dAt = ld.findIndex((p) => /^Paper doll/.test(p.lab));
  ok("1st-grade notebook: the paper dolls still land on a sheet front after the write-first pages", dAt > 0 && dAt % 2 === 0 && ld.every((p, i) => !/^Paper doll/.test(p.lab) || /^Blank/.test((ld[i + 1] || {}).lab || "")));
}

// ════════════════════════════════════ (g) the tablet tags ════════════════════════════════════
console.log("(g) the tablet's Today list");
for (const K of [K4, K6, K1]) {
  const lv = K === K1 ? "g3" : "g4", out = gen(K, mkCtx(K, { ladders: rl({ lv, wf: "one" }), nbPageTags: true })), ps = pagesOf(out.student).filter(isRA);
  ok((K === K1 ? "1st" : K === K4 ? "4th" : "6th") + " grade: the reading pages tagged with their day and 'Read and answer', the back 'Read and answer — check'",
    ps.length === 3 && ps[0].day === "tuesday" && ps[0].name === "Read and answer" && ps[1].day === "thursday" && ps[1].name === "Read and answer" && ps[2].day === "thursday" && ps[2].name === "Read and answer — check");
  ok("…paper (no tags) has no data-nb attributes on them", gen(K, mkCtx(K, { ladders: rl({ lv, wf: "one" }) })).student.indexOf("data-nb-") < 0);
}

// ════════════════════════════════════ (h) index.html ════════════════════════════════════
console.log("(h) index.html: the write-first choice, the note");
function sandbox(o) {
  o = o || {};
  const writes = [], ls = [];
  const c = {
    window: { HoweNotebooks: NB, open: () => null }, location: { hostname: "localhost" },
    notebookSettings: o.settings || {}, tab: "notebook", rendered: 0,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    HA_LS: { setItem: (k, v) => ls.push([k, v]) }, document: { getElementById: () => ({}) },
    cap: (k) => String(k).charAt(0).toUpperCase() + String(k).slice(1),
    nbLevelGrade: () => null, nbQbList: () => [], nbTargetWkNum: () => 12,
    nbThemeOf: (k) => ((o.themes || {})[k] || null), nbLevelOf: () => null,
    db: o.noDb ? null : { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    fetch: () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(READ) }),
    console, Promise, JSON, Object, String, Array, Date, parseInt, isNaN, setTimeout,
  };
  c.renderNotebook = () => { c.rendered++; };
  vm.createContext(c);
  vm.runInContext(ldBlk + "\n" + rdBlk + "\n" + ixBlk + "\nthis._nbLadData=_nbLadData; this._nbLadOpen=_nbLadOpen; this.NBLADDER_PAGES_NOTE=NBLADDER_PAGES_NOTE;", c);
  c._nbLadData.reading = READ; c._nbLadData.number = {};
  c.writes = writes; c.ls = ls;
  return c;
}
{
  const set = (lv, wf, extra) => Object.assign({ on: true, lv }, wf ? { wf } : {}, extra || {});
  const c = sandbox({ settings: { [K4]: { ladders: { reading: set("g4") } }, [K6]: { ladders: { reading: set("g6", "one") } }, [K1]: { ladders: { reading: set("g1") } }, kidz: { ladders: { reading: set("g4") } } } });
  [K4, K6, K1, "kidz"].forEach((k) => (c._nbLadOpen[k] = true));
  const card = (k) => c.nbLadderCardHtml(k);
  ok("4th-grade notebook at g4: the choice on the reading row — Never (lit), One day a week, Both days", (card(K4).match(/nbLadReadSetWf\(/g) || []).length === 3 && /Write first:/.test(card(K4)) &&
    /border:1\.5px solid #4338ca[^>]*>Never</.test(card(K4)));
  ok("6th-grade notebook with 'one' saved: 'One day a week' lit", /border:1\.5px solid #4338ca[^>]*>One day a week</.test(card(K6)));
  ok("1st-grade notebook at g1: no choice (a 1st/2nd-grade page always shows its choices)", !/nbLadReadSetWf/.test(card(K1)));
  c.notebookSettings[K1].ladders.reading.lv = "g2"; const h2 = card(K1); c.notebookSettings[K1].ladders.reading.lv = "g3"; const h3 = card(K1);
  ok("…at g2 still none; at g3 the choice shows", !/nbLadReadSetWf/.test(h2) && (h3.match(/nbLadReadSetWf\(/g) || []).length === 3);
  c.notebookSettings[K1].ladders.reading = set("g2", null, { cur: { week: 11, lv: "g2", from: TR.levels.g2.items.length - 2, adv: 2 } });
  ok("…at the end of g2 (the next page is g3) the choice shows — it follows where the child is", (card(K1).match(/nbLadReadSetWf\(/g) || []).length === 3);
  ok("a notebook that prints no reading: no choice", !/nbLadReadSetWf/.test(card("kidz")));
  c.notebookSettings[K4].ladders.reading = set("g78", null, { cur: { week: 12, lv: "g78", from: 10, adv: 1 } });
  ok("ladder finished: no choice (nothing prints)", !/nbLadReadSetWf/.test(card(K4)));
  ok("drawing the cards wrote nothing", c.writes.length === 0 && c.ls.length === 0);
  // the note per notebook
  const note = (cc, k) => cc.nbLadReadNoteHtml(k);
  const c2 = sandbox({ settings: { [K4]: { ladders: { reading: set("g4") } }, [K6]: { ladders: { reading: set("g6", null, { days: "monday wednesday" }) } }, kidz: { ladders: { reading: set("g4") } } }, themes: { kidt: Object.keys(NB.themes)[0] } });
  ok("4th-grade note: 'prints in the notebook on the 2nd and 4th school day …'", /📖 Reading passages: prints in the notebook on the 2nd and 4th school day of the week/.test(note(c2, K4)));
  ok("6th-grade note follows its ticks: 'on Monday and Wednesday'", /prints in the notebook on Monday and Wednesday/.test(note(c2, K6)));
  ok("…the number row keeps the 'not yet' wording in both", [K4, K6].every((k) => /🔢 Number thinking doesn’t print anything in the notebook yet/.test(note(c2, k))));
  ok("every other notebook and a Pre-K look keep the 'not yet' note", note(c2, "kidz") === c2.NBLADDER_PAGES_NOTE && note(c2, "kidt") === c2.NBLADDER_PAGES_NOTE);
  // the write
  const P = "notebookSettings/" + K4 + "/ladders/reading/wf";
  const w = sandbox({ settings: { [K4]: { ladders: { reading: set("g4") } } } });
  w.nbLadReadSetWf(K4, "one");
  ok("'One day a week' → ONE write of one field: …/ladders/reading/wf = 'one'", JSON.stringify(w.writes) === JSON.stringify([["set", P, "one"]]) && w.notebookSettings[K4].ladders.reading.wf === "one");
  w.nbLadReadSetWf(K4, "both"); w.nbLadReadSetWf(K4, "both");
  ok("'Both days' → 'both'; the same choice again writes nothing", JSON.stringify(w.writes.slice(1)) === JSON.stringify([["set", P, "both"]]));
  w.nbLadReadSetWf(K4, "");
  ok("'Never' → the field is removed (nothing saved = never)", JSON.stringify(w.writes[2]) === JSON.stringify(["remove", P]) && !("wf" in w.notebookSettings[K4].ladders.reading));
  w.nbLadReadSetWf(K4, "always"); w.nbLadReadSetWf(K4, 2);
  ok("anything else is refused", w.writes.length === 3);
  const wM = sandbox({ mom: false }); wM.nbLadReadSetWf(K4, "one");
  const wD = sandbox({ dry: true }); wD.nbLadReadSetWf(K4, "one");
  ok("not Mom → nothing written, nothing kept; ?dryrun=1 → no Firebase write", wM.writes.length === 0 && wM.ls.length === 0 && wD.writes.length === 0);
  ok("nbLadderWrite's fields: + wf, nothing else new", /\["on","lv","opt","cur","days","wf"\]\.indexOf\(field\)<0/.test(ldBlk));
  const st = sandbox({ settings: { [K6]: { ladders: { reading: set("g6", "both") } }, x: { ladders: { reading: set("g6", "sometimes") } } } });
  const lc = clone(st.nbLadderCtx(K6));
  ok("the saved choice reaches the builder through ctx.ladders (nbLadderCtx → the 6th-grade notebook): two back pages", lc.reading.wf === "both" && lc.reading.ready === true &&
    (gen(K6, mkCtx(K6, { ladders: lc })).student.match(/Read and Answer — \w+ \(back\)/g) || []).length === 2 && clone(st.nbLadderCtx("x")).reading.wf === null);
}

// ════════════════════════════════════ (i) page fit ════════════════════════════════════
console.log("(i) page fit (8.5×11in, overflow hidden) — Google Chrome headless, each notebook's own CSS");
const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(CHROME)) console.log("  page measurement — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
else {
  const MEASURE = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      var lab = pg.getAttribute("data-lab") || "";
      var b = pg.querySelector(".lr-body, .lr-kbody, .page-body, .body"), r = pg.getBoundingClientRect(), out = { lab: lab, h: Math.round(r.height), wide: pg.scrollWidth - pg.clientWidth, clip: pg.scrollHeight - pg.clientHeight };
      if (b) { var low = 0; [].forEach.call(b.children, function (c) { var y = c.getBoundingClientRect().bottom; if (y > low) low = y; });
        out.spare = Math.round(b.getBoundingClientRect().bottom - parseFloat(getComputedStyle(b).paddingBottom) - low); out.clip = Math.max(out.clip, b.scrollHeight - b.clientHeight); }
      return out;
    });
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladread3-"));
  const run = (html, tag) => {
    const f = path.join(dir, tag + ".html");
    fs.writeFileSync(f, html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace("</body>", "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body>"));
    for (let tryN = 0; tryN < 3; tryN++) {
      const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof_" + tag + tryN), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 120000 });
      const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
      if (m) return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    }
    return null;
  };
  const lab = (h, s) => h.replace(/<div class="page"/, '<div class="page" data-lab="' + s + '"');
  const shell = { tf: (p, css) => I.lr3AddCss(I.ellShell(p), css), ln: (p, css) => I.lr3AddCss(I.lnFullHtml("fit", p), css), lu: (p) => I.luShell(p, "fit", I.LR_CSS + I.lr3Css("lu")) };
  const WIDE = "\n.lr-body, .lr-body *, .lr-kbody, .lr-kbody * { letter-spacing:0.03em; }\n";
  console.log("  measured with Google Chrome headless; web fonts NOT loaded (Orbitron, Nunito, Fraunces, DM Sans/Mono, Fredoka One are not on this Mac — the fallback fonts are used, as in the other notebook fit tests); a second run adds 0.03em to every letter for a wider web font");
  const len = (x) => x.item.text.length + x.item.q.reduce((a, q) => a + q.text.length + q.c.join("").length, 0);
  const report = {};
  for (const [lk, look] of LOOKS) {
    const pages = [];
    for (const x of ALL) for (const mode of ["plain", "front", "back"]) {
      if (mode !== "plain" && !hasWf(x)) continue;
      if (lk === "lu" && mode === "plain") continue;   // the 1st-grade plain page is slice 2's (test_nb_ladread.js measures it)
      pages.push(lab(I.lr3Page(look, "tuesday", x, mode), x.lv + "|" + x.id + "|" + mode));
    }
    if (lk !== "lu") TR.order.forEach((lv) => { const two = TR.levels[lv].items.slice().sort((a, b) => JSON.stringify(b.q).length - JSON.stringify(a.q).length).slice(0, 2);
      pages.push(lab(I.lr3Parent(look, "Nov 16–20, 2026", { pages: two.map((it, k) => ({ day: k ? "thursday" : "tuesday", wf: !/^g[12]$/.test(lv), x: { lv, label: TR.levels[lv].label, num: 1, of: 11, item: it } })) }), "parent|" + lv + "|x")); });
    const css = lk === "lu" ? "" : I.lr3Css(lk);
    const doc = shell[lk](pages.join("\n"), css), res = run(doc, lk), resW = run(doc.replace("</head>", "<style>" + WIDE + "</style></head>"), lk + "W");
    if (!res || !resW) { console.log("  page measurement (" + lk + ") — SKIPPED (Google Chrome would not run headless here)"); continue; }
    const nmL = lk === "tf" ? "4th-grade look" : lk === "ln" ? "6th-grade look" : "1st-grade look";
    for (const lv of TR.order) for (const mode of ["plain", "front", "back"]) {
      const mine = res.filter((p) => p.lab.indexOf(lv + "|") === 0 && p.lab.endsWith("|" + mode)), w = resW.filter((p) => p.lab.indexOf(lv + "|") === 0 && p.lab.endsWith("|" + mode));
      if (!mine.length) continue;
      const byLen = mine.slice().sort((a, b) => len(ALL.find((x) => x.id === a.lab.split("|")[1])) - len(ALL.find((x) => x.id === b.lab.split("|")[1])));
      const sh = byLen[0], lo = byLen[byLen.length - 1], tight = mine.slice().sort((a, b) => a.spare - b.spare)[0], tightW = w.slice().sort((a, b) => a.spare - b.spare)[0];
      report[nmL + " " + lv + " " + mode] = { n: mine.length, shortest: sh.lab.split("|")[1] + " " + sh.spare, longest: lo.lab.split("|")[1] + " " + lo.spare, tightest: tight.lab.split("|")[1] + " " + tight.spare, tightestWide: tightW.spare };
      ok(nmL + ", " + lv + " " + mode + ": " + mine.length + " pages 11in, nothing clipped — shortest " + sh.lab.split("|")[1] + " " + sh.spare + "px spare, longest " + lo.lab.split("|")[1] + " " + lo.spare + "px, tightest " + tight.lab.split("|")[1] + " " + tight.spare + "px; wider letters " + tightW.spare + "px",
        mine.every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0 && p.wide <= 0) && w.every((p) => p.spare >= 0 && p.clip <= 0 && p.wide <= 0), mine.concat(w).filter((p) => p.spare < 0 || p.clip > 0 || p.wide > 0).slice(0, 3));
    }
    const par = res.filter((p) => p.lab.indexOf("parent|") === 0), parW = resW.filter((p) => p.lab.indexOf("parent|") === 0);
    if (par.length) ok(nmL + ": the parent page, each level's two longest question sets, write-first marks on: nothing clipped (spare " + par.map((p) => p.lab.split("|")[1] + " " + p.spare + "px").join(", ") + ")",
      par.length === TR.order.length && par.concat(parW).every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0));
  }
  // whole real builds, both notebooks, both write-first days, student + parent
  for (const [K, lv] of [[K4, "g4"], [K4, "g5"], [K6, "g6"], [K6, "g78"]]) {
    const out = gen(K, mkCtx(K, { ladders: rl({ lv, wf: "both" }), dailyGrams: dgBook() }));
    for (const part of ["student", "parent"]) {
      const html = out[part].replace(/(<!-- READ AND ANSWER[^>]*-->\n<div class="page")|(<div class="page-label">(?:Read and Answer|Teaching Companion — Read and Answer)[^<]*<\/div>\n<div class="page")|(<!-- PARENT PAGE: READ AND ANSWER -->\n<div class="page")/g, (m) => m.replace(/<div class="page"$/, '<div class="page" data-lab="RA"'));
      const r = run(html, "whole_" + lv + part), rp = (r || []).filter((p) => p.lab === "RA");
      ok("whole " + lv + " build (" + part + "): every reading page 11in and unclipped (" + rp.map((p) => p.spare + "px").join(", ") + ")",
        r && rp.length === (part === "student" ? 4 : 1) && rp.every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0));
    }
  }
  // the 4th-grade daily page with the old passage retired and no CogAT box that day: nothing clipped, no empty box
  {
    const ctx = mkCtx(K4, { ladders: { reading: { on: true, ready: false } } }), out = gen(K4, ctx), old = genOld(K4, mkCtx(K4, {}));
    const tagD = (h) => h.replace(/<!-- DAILY PAGE: (\w+) -->\n<div class="page"/g, (m, d) => m.replace('<div class="page"', '<div class="page" data-lab="D|' + d + '"'));
    const r = run(tagD(out.student), "retired"), r0 = run(tagD(old.student), "beforeRetire"), d = (r || []).filter((p) => /^D\|/.test(p.lab)), d0 = (r0 || []).filter((p) => /^D\|/.test(p.lab));
    ok("4th-grade daily pages with the old passage retired: 11in, nothing clipped, no empty box (spare now " + d.map((p) => p.spare + "px").join(", ") + "; before " + d0.map((p) => p.spare + "px").join(", ") + ")",
      d.length === 5 && d.every((p) => p.h === 1056 && p.clip <= 0) && out.student.indexOf('<div class="card card-read">\n      <div class="passage-block">') < 0);
  }
  fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify(report, null, 1));
  console.log("  (per-level numbers also in " + path.join(dir, "report.json") + ")");
}
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
