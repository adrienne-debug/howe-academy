// 📓 Pre-K daily-page fit (PK_DAILYFIT, her "Yes, fix them" 2026-11-24 to three fit problems found by measuring)
// Run: node test_prek_daily_fit.js        (measures the daily pages in Google Chrome, headless, when it is on this machine;
//                                           set CHROME_BIN to point at another Chrome, NO_CHROME=1 to skip; --quick = web fonts only)
//   1. "How was today?" ran below its row when the "Look what I learned today!" chips need two lines (28 px on the original
//      three looks with all five switches, a "pages to do today" strip, 22 and little q) → the card's gaps tighten, the row may
//      borrow the top cards' spare room
//   2. the dinosaur family look's own name at full size made wide-number days (20, 41–100) too wide → that name gives way
//   3. the construction family look's original find-it card is 12 px taller than its row → that row takes it from the bottom row
// What this checks:
//   • one marked block; with it cut out, every notebook is byte for byte this tree's old build (the call sites are guarded)
//   • the guide, the cover and every other non-daily page are byte for byte the same; the only other difference is the
//     block's CSS lines in the notebook's <style>; school-age and starter notebooks untouched
//   • measured in Chrome: the three set-ups really are clipped with the block cut out, and fit with it in; across a sweep of
//     every Pre-K look × all 32 level settings × numbers 1–100 × names 3–24 letters × both counting pictures × strips and long
//     chip words, a page that fit before has every element in exactly the same place and size, no page that fit is now
//     clipped, and no clipped page got worse — both with the web fonts and with the stand-in fonts
// Names and decks in here are made up.
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const START = "  // PK_DAILYFIT_START", endMark = "  // PK_DAILYFIT_END\n";
const A = src.indexOf(START), B = src.indexOf(endMark);
const oldSrc = src.slice(0, A) + src.slice(B + endMark.length);
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const NB = load(src), OLD = load(oldSrc);
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }

console.log("the block");
const block = src.slice(A, B + endMark.length);
ok(A > 0 && B > A && src.indexOf("// PK_DAILYFIT_START", A + 10) < 0 && src.indexOf("// PK_DAILYFIT_END", B + 10) < 0, "one PK_DAILYFIT block, marked start and end");
const outside = oldSrc.split("\n").filter(l => /pkdfDaily|PKDF_/.test(l));
ok(outside.length === 2 && outside.every(l => /typeof (pkdfDaily|PKDF_CSS) === "(function|string)"/.test(l)),
  "two call sites outside it, both guarded — the daily page hands its HTML to pkdfDaily, the shared Pre-K sheet adds PKDF_CSS", outside.join(" | "));
ok(src.indexOf("  var JU_CSS = ") === B + endMark.length + 1 && src.indexOf("function juPageCover(") > B, "it sits right above the shared Pre-K sheet (JU_CSS), away from the cover (juPageCover)");
ok(!/🔀/.test(block) && !/<img|https?:\/\//.test(block) && !/julian|caleb|lincoln|ellis|lucy|howe/i.test(block), "no 🔀, no outside picture or address, no child's or family's name");

// ── made-up decks ─────────────────────────────────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 30, 2026", tuesday: "December 1, 2026", wednesday: "December 2, 2026", thursday: "December 3, 2026", friday: "December 4, 2026" };
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), az = AZ.map(l => l.toLowerCase());
const NUMS = (a, b) => { const r = []; for (let n = a; n <= b; n++) r.push(n); return r; };
const SHAPES = ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval", "Diamond", "Star", "Heart", "Pentagon", "Octagon", "Trapezoid", "Semicircle", "Parallelogram", "Kite", "Crescent", "Cross", "Arrow", "Cube", "Sphere", "Cone"];
const COLORS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Pink", "Brown", "Black", "White", "Gray"];
const BASE = [].concat(mi("Letters", AZ), mi("Lowercase", az), mi("Letter Sounds", az), mi("Numbers", NUMS(1, 20)));
const DECKS = {
  std: BASE.concat(mi("Shapes", SHAPES, { 20: { status: "introduction" } }), mi("Colors", COLORS), mi("Animals", ["Lion", "Giraffe", "Frog", "Owl", "Penguin"])),
  // the longest chip words: the week's shapes and colours are long, so "Look what I learned today!" needs two lines
  long: BASE.concat(mi("Shapes", ["Parallelogram", "Semicircle", "Trapezoid", "Rectangle", "Crescent", "Pentagon"], { 5: { status: "introduction" } }), mi("Colors", ["Purple", "Orange", "Yellow", "Silver", "Brown"]), mi("Animals", ["Lion", "Giraffe", "Frog", "Owl", "Penguin"]))
};
const KEYS = NB.prekLevels.map(l => l.key);
const LEVELS = []; for (let m = 0; m < 32; m++) { const lv = {}; KEYS.forEach((k, i) => { lv[k] = !!(m & (1 << i)); }); LEVELS.push(lv); }
const NAMES = ["Pip", "Juniper", "Maximilian", "Jacquelinemaya", "Wilhelminabartholomewzzz"];   // 3 … 24 letters (the Notebook tab's name field allows 24)
const EVERY_DAY = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true };
const STRIP = { abc: { days: EVERY_DAY }, daysSeasons: { days: EVERY_DAY }, thisMonth: { days: EVERY_DAY } };
const UNIT = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
// every Pre-K look: the nine in the picker (on a made-up kid) and each family's own look (its own key, its own name)
const LOOKS = Object.keys(NB.themes).map(k => ({ kid: "kid9", look: k, tag: k }))
  .concat(Object.keys(NB.GENERATORS).filter(k => NB.GENERATORS[k].prek).map(k => ({ kid: k, look: "", tag: "family look (" + NB.GENERATORS[k].prek.native + ")", native: NB.GENERATORS[k].prek.native })));
const ownLook = (native) => LOOKS.find(L => L.native === native);
// a week: letters from li, numbers from n (five days); x = { deck, name, strip: 0 | 1 | 2 (2 = + a unit on Tuesday), pic }
function ctxOf(L, lv, li, n, x) {
  x = x || {};
  const c = { weekNum: "week31", weekDates: "Nov 30 – Dec 4, 2026", masteryItems: DECKS[x.deck || "std"], notebookTheme: L.look, nbLevel: lv, reviewCap: 0,
    weekData: { dates, tasks: ["monday", "tuesday", "wednesday", "friday"].map(d => ({ who: L.kid, day: d, title: "school" })) },
    letterCursor: { week: 31, idx: li, adv: 5 }, numberCursor: { week: 31, from: n, adv: 5 }, extraPages: x.strip ? STRIP : {}, units: x.strip === 2 ? [UNIT] : [] };
  if (x.name) c.kidName = x.name;
  if (x.pic) { c.countPic = x.pic; c.countEmoji = "🚒"; }
  return c;
}
const gen = (N, L, ctx) => N.generate(L.kid, JSON.parse(JSON.stringify(ctx)));

console.log("every notebook is the old one apart from the daily pages and the added CSS");
ok(LOOKS.length >= 11 && LOOKS.filter(L => L.native).length >= 2, LOOKS.length + " Pre-K looks (" + LOOKS.filter(L => L.native).length + " of them a family's own)");
const cssAdded = (/var PKDF_CSS = ([\s\S]*?);\n/.exec(block) || [])[1];
const CSS = cssAdded ? new Function("return " + cssAdded)() : "";
const pagesOf = (h) => h.split(/(?=<div class="page-label">)/);
// a daily page with the block's changes undone (gaps out, the recap wrapper back, classes and the name size back)
const undo = (p) => p.replace(/      <i class="pkdf-gap" style="flex-grow:\d+;max-height:\d+px;"><\/i>\n/g, "")
  .replace(/ pkdf-grow"/g, '"').replace(/ pkdf-rate"/g, '"').replace(/ pkdf-name"/g, '"').replace(/font-size:min\((\d+)px,calc\(100cqi \/ [\d.]+\)\)/g, "font-size:$1px")
  .replace(/(<\/div>\n)      <div class="recap-lab">/g, '$1      <div class="recap">\n        <div class="recap-lab">')
  .replace(/(      <div class="recap">\n        <div class="recap-lab">[^<]*<\/div>\n)      <div class="recap-chips">([\s\S]*?)\n      <\/div>\n/g, (m, a, chips) => a + '        <div class="recap-chips">' + chips + "\n        </div>\n      </div>\n");
let cmp = 0; const diff = [], dailyDiff = [];
LOOKS.forEach(L => [0, 1, 2, 3, 8, 31].forEach(li => [["std", 0, 1], ["long", 2, 21], ["std", 1, 41], ["long", 0, 96]].forEach(([deck, strip, n]) => [null, "Maximilian"].forEach(name => {
  const c = ctxOf(L, LEVELS[li], (n * 3) % 26, n, { deck, strip, name }), a = gen(NB, L, c), b = gen(OLD, L, c); cmp++;
  if (JSON.stringify(Object.assign({}, a, { student: 0, parent: 0 })) !== JSON.stringify(Object.assign({}, b, { student: 0, parent: 0 }))) diff.push(L.tag + "/lv" + li + "/" + deck + ": cursors");
  if (a.parent.split(CSS).join("") !== b.parent || a.parent.split(CSS).length !== 2) diff.push(L.tag + "/lv" + li + "/" + deck + ": guide (not just the CSS once)");
  const pa = pagesOf(a.student), pb = pagesOf(b.student);
  if (pa.length !== pb.length) { diff.push(L.tag + "/lv" + li + ": page count"); return; }
  pa.forEach((p, i) => {
    if (i === 0) { if (p.split(CSS).join("") !== pb[0] || p.split(CSS).length !== 2) diff.push(L.tag + "/lv" + li + ": head (not just the CSS once)"); return; }
    if (!/^<div class="page-label">Daily Page/.test(p)) { if (p !== pb[i]) diff.push(L.tag + "/lv" + li + ": " + p.slice(24, 50)); return; }
    if (undo(p) !== pb[i]) dailyDiff.push(L.tag + "/lv" + li + "/" + deck + "/" + p.slice(24, 50));
  });
}))));
ok(!diff.length, cmp + " notebooks — cursors, the guide's pages, the cover and every non-daily page byte for byte the same; each <style> (notebook and guide) differs only by the block's CSS, once", diff.slice(0, 4).join(", "));
ok(!dailyDiff.length, "…and each daily page differs only by the block's own marks: the closing card's three gaps (the recap wrapper's two children move up beside them), the two row classes, the name size rule", dailyDiff.slice(0, 3).join(", "));
const older = Object.keys(NB.GENERATORS).filter(k => !NB.GENERATORS[k].prek).concat(["kid8"]);
ok(older.every(k => [{}, { bindingMargin: true }].every(x => { const c = Object.assign(ctxOf(LOOKS[0], {}, 0, 1), { notebookTheme: "" }, x); return JSON.stringify(NB.generate(k, JSON.parse(JSON.stringify(c)))) === JSON.stringify(OLD.generate(k, JSON.parse(JSON.stringify(c)))); })),
  older.length + " school-age and starter notebooks byte for byte the same");
// where each change lands
const own = ownLook("dino"), cn = ownLook("construction");
const sDino = gen(NB, own, ctxOf(own, LEVELS[0], 0, 41)).student, sPick = gen(NB, LOOKS[0], ctxOf(LOOKS[0], LEVELS[0], 0, 41)).student;
ok((sDino.match(/card-gold pkdf-name/g) || []).length === 5 && !/pkdf-name"/.test(sPick) && !/pkdf-name"/.test(gen(NB, own, ctxOf(own, LEVELS[0], 0, 41, { name: "Maximilian" })).student) &&
  !/pkdf-name"/.test(gen(NB, cn, ctxOf(cn, LEVELS[0], 0, 41)).student),
  "the name rule lands only where a name prints above the size rule (the dinosaur family look's own name) — not on a picked look, not on a renamed notebook, not on a 5-letter name");
const legacy = (lv) => (gen(NB, cn, ctxOf(cn, lv, 0, 1)).student.match(/grid2 pkdf-grow" style="flex:1\.75;"/g) || []).length;
ok(legacy(LEVELS[3]) === 5 && legacy(LEVELS[19]) === 4 && legacy(LEVELS[1]) === 0 && legacy(LEVELS[0]) === 0 && !/flex:1\.75;"/.test(sPick.replace(/class="grid2" style="flex:1\.75;"/g, "")),
  "the row rule for the original find-it card lands only on that card (little letters + find it on the construction family look)");

// ── measured in Chrome ────────────────────────────────────────────────────────────────────────────────────────────────
// Every daily page: every element box and every line of text against the page's right margin and the body's cut-off; every
// element in a card / column / row / strip inside its box; the page's blocks and each column's cards not running under one
// another; and a fingerprint of every element's box (the closing card's new gaps and its old wrapper left out).
const MEASURE_FN = function (doc) {
  var out = [], R = function (v) { return Math.round(v * 10) / 10; };
  doc.querySelectorAll(".page-label").forEach(function (lab) {
    if (!/^Daily Page/.test(lab.textContent)) return;
    var pg = lab.nextElementSibling, pr = pg.getBoundingClientRect(), body = pg.querySelector(".body"), br = body.getBoundingClientRect(), cs = getComputedStyle(body);
    var cR = br.right - parseFloat(cs.paddingRight), bad = [], maxR = 0, maxD = 0;
    var rectsOf = function (root) {
      var a = []; root.querySelectorAll("*").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.width > 0 || r.height > 0) a.push(r); });
      var tw = doc.createTreeWalker(root, 4), t; while ((t = tw.nextNode())) { if (!t.nodeValue.trim()) continue; var rg = doc.createRange(); rg.selectNodeContents(t); Array.from(rg.getClientRects()).forEach(function (r) { a.push(r); }); }
      return a;
    };
    rectsOf(body).forEach(function (r) { maxR = Math.max(maxR, r.right - cR); maxD = Math.max(maxD, r.bottom - br.bottom); });
    if (maxR > 0.5) bad.push(R(maxR) + "px past the right margin");
    if (maxD > 0.5) bad.push(R(maxD) + "px below the cut-off");
    body.querySelectorAll(".grid2, .col, .card, .path-wrap, .todo, .wf-row, .cal-card, .bookend").forEach(function (box) {
      var b = box.getBoundingClientRect(), d = 0, w = 0; rectsOf(box).forEach(function (r) { d = Math.max(d, r.bottom - b.bottom); w = Math.max(w, r.right - b.right); });
      maxD = Math.max(maxD, d); if (d > 0.5 || w > 0.5) bad.push("." + box.className.split(" ")[0] + " spills " + R(d) + "px down / " + R(w) + "px right");
    });
    var sib = function (par, what) { var k = Array.from(par.children).filter(function (c) { return c.getBoundingClientRect().height > 0; });
      for (var i = 0; i + 1 < k.length; i++) { var o = k[i].getBoundingClientRect().bottom - k[i + 1].getBoundingClientRect().top; if (o > 0.5) { maxD = Math.max(maxD, o); bad.push(what + ": " + (k[i].className.split(" ")[0] || "strip") + " runs " + R(o) + "px under the next"); } } };
    sib(body, "page"); body.querySelectorAll(".grid2 > .col").forEach(function (c) { sib(c, "column"); });
    var sig = []; pg.querySelectorAll("*").forEach(function (el) { if (el.matches(".recap, .pkdf-gap")) return; var r = el.getBoundingClientRect(); sig.push(R(r.left - pr.left) + "," + R(r.top - pr.top) + "," + R(r.width) + "," + R(r.height)); });
    var s = sig.join(";"), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    out.push({ day: lab.textContent.replace(/^Daily Page — /, ""), bad: bad.filter(function (v, i, a) { return a.indexOf(v) === i; }), r: R(maxR), d: R(maxD), sig: h + ":" + sig.length, pageW: R(pr.width) });
  });
  return out;
}.toString();
const dailyOnly = function (html, noFonts) {
  var first = html.indexOf('<div class="page-label">'), head = html.slice(0, first), rest = html.slice(first, html.lastIndexOf("</body>"));
  if (noFonts) head = head.replace(/<link href=.https:\/\/fonts\.googleapis\.com[^>]*>/g, "");
  return head + rest.split(/(?=<div class="page-label">)/).filter(function (c) { return /^<div class="page-label">Daily Page/.test(c); }).join("") + "\n</body>\n</html>";
}.toString();

function runChrome(chrome, list, dir, idx, oldFile, noFonts) {
  return new Promise((resolve) => {
    const page = path.join(dir, "m" + idx + ".html");
    fs.writeFileSync(page, '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + oldFile + '"></script><script>var NBS={old:window.HoweNotebooks};</script>' +
      '<script src="file://' + file + '"></script><script>NBS["new"]=window.HoweNotebooks;\n' +
      "var CFG=" + JSON.stringify(list).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ",DO=" + dailyOnly + ",NF=" + (noFonts ? "true" : "false") + ";\n" +
      "(async function(){var res=[];for(var c of CFG){for(var w of ['old','new']){var o=NBS[w].generate(c.kid,JSON.parse(JSON.stringify(c.ctx)));" +
      "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1300px;border:0';document.body.appendChild(f);" +
      "await new Promise(function(r){f.onload=r;f.srcdoc=DO(o.student,NF);});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
      "await new Promise(function(r){setTimeout(r,30);});res.push({i:c.i,w:w,pages:M(d),fonts:Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length});f.remove();}}" +
      "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
    const p = cp.spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile" + idx + (noFonts ? "nf" : "")), "--allow-file-access-from-files",
      "--virtual-time-budget=36000000", "--dump-dom", "file://" + page], { stdio: ["ignore", "pipe", "ignore"] });
    let buf = ""; p.stdout.on("data", d => { buf += d; });
    const t = setTimeout(() => { try { p.kill(); } catch (e) {} }, 1200000);
    p.on("close", () => { clearTimeout(t); const m = /RESULT([\s\S]*?)ENDRESULT/.exec(buf); let r = null; try { r = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {} resolve(r); });
  });
}
async function measure(chrome, cfg, noFonts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prek-daily-fit-")), oldFile = path.join(dir, "old.js");
  fs.writeFileSync(oldFile, oldSrc);
  cfg.forEach((c, i) => { c.i = i; });
  const par = Math.max(2, Math.min(12, (os.cpus() || []).length - 2)), chunks = Array.from({ length: par }, () => []);
  cfg.forEach((c, i) => chunks[i % par].push(c));
  const all = await Promise.all(chunks.map((ch, i) => runChrome(chrome, ch, dir, i, oldFile, noFonts)));
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (all.some(r => !Array.isArray(r))) return { error: (all.find(r => !Array.isArray(r)) || {}).error || "a Chrome run gave no result" };
  const by = {}; [].concat.apply([], all).forEach(r => { (by[r.i] = by[r.i] || {})[r.w] = r; });
  return { by, fonts: [].concat.apply([], all)[0].fonts };
}
const DAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// the three set-ups, as recorded
const SETUPS = [
  // 1. original three looks, all five switches, the "pages to do today" strip (+ a unit) — Tuesday: little q, 22, find it
  ...["dino", "construction", "shark"].map(k => ({ p: 1, look: k, day: "Tuesday", tag: "1 · " + k + " · all switches · strip · Tuesday q / 22 / Parallelogram + Purple", L: LOOKS.find(L => L.look === k), lv: LEVELS[31], li: 15, n: 21, x: { deck: "long", strip: 2 } })),
  // 2. the dinosaur family look, its own name, no switches — 20 (two full ten-frames) and 41–45 (tens and ones)
  { p: 2, day: "Monday", tag: "2 · dinosaur family look · no switches · 20", L: own, lv: LEVELS[0], li: 0, n: 20 },
  ...[41, 42, 43, 44, 45].map((n, i) => ({ p: 2, day: DAY[i], tag: "2 · dinosaur family look · no switches · " + n, L: own, lv: LEVELS[0], li: 0, n: 41 })),
  // 3. the construction family look at its own levels (little letters + find it = its original card) — every day of a plain week
  ...DAY.map(d => ({ p: 3, day: d, tag: "3 · construction family look · its own levels · " + d, L: cn, lv: { nbLowercase: true, nbFindIt: true, nbTeens: true, nbShapesAhead: true, nbSkipNoSchoolDays: false }, li: 0, n: 11 }))
];
function sweep(quick) {
  const cfg = [], add = (L, li, lvI, n, x, tag) => cfg.push({ kid: L.kid, look: L.tag, tag, ctx: ctxOf(L, LEVELS[lvI], li, n, x) });
  SETUPS.forEach(s => cfg.push({ kid: s.L.kid, look: s.L.tag, tag: "SETUP" + SETUPS.indexOf(s), ctx: Object.assign(ctxOf(s.L, {}, s.li, s.n, s.x), { nbLevel: s.lv }) }));
  const W = quick ? [1, 16, 21, 41, 96] : [1, 6, 11, 16, 21, 31, 41, 51, 66, 81, 96];
  LOOKS.forEach(L => {
    LEVELS.forEach((lv, li) => W.forEach((n, wi) => add(L, (n * 3) % 26, li, n, { deck: wi % 2 ? "long" : "std", strip: (li + wi) % 3 }, "lv" + li + " · from " + n)));
    [0, 1, 2, 3, 31].forEach(li => NAMES.forEach(nm => [16, 41, 96].forEach(n => add(L, (n * 7) % 26, li, n, { name: nm, strip: li % 2 }, "lv" + li + " · " + nm + " · from " + n))));
    [0, 3, 31].forEach(li => ["animal", "picture"].forEach(pic => [6, 21, 41].forEach(n => add(L, n % 26, li, n, { pic, deck: "long", strip: 1 }, "lv" + li + " · counts the " + pic + " · from " + n))));
  });
  return cfg;
}
function check(res, cfg, fontsTag, web) {
  const S = (i) => res.by[i], pages = (i, w) => (S(i)[w] || {}).pages || [];
  console.log("the three set-ups (" + fontsTag + ")");
  [1, 2, 3].forEach(p => {
    const set = SETUPS.map((s, i) => ({ s, i })).filter(z => z.s.p === p);
    const b = set.map(z => pages(z.i, "old").find(q => q.day === z.s.day)), a = set.map(z => pages(z.i, "new").find(q => q.day === z.s.day));
    const amt = (q) => q ? Math.max(q.r, q.d) : -1, clipped = b.every(q => q && q.bad.length), fits = a.every(q => q && !q.bad.length);
    const why = set.map((z, j) => z.s.tag + " → before " + JSON.stringify(b[j] && b[j].bad) + " after " + JSON.stringify(a[j] && a[j].bad)).filter((x, j) => !(a[j] && !a[j].bad.length) || (web && !(b[j] && b[j].bad.length))).slice(0, 2).join(" | ");
    if (web) ok(clipped && fits, "problem " + p + ": with the block cut out every set-up is clipped (" + b.map(amt).join(" / ") + " px); now all " + a.length + " fit", why);
    else ok(fits, "problem " + p + ": all " + a.length + " set-ups fit (with the block cut out: " + b.map(amt).join(" / ") + " px" + (clipped ? "" : " — the stand-in fonts happen to fit some of them") + ")", why);
  });
  console.log("the sweep (" + fontsTag + ")");
  let fit = 0, n = 0, fixed = 0, flagged = 0, subpx = 0; const moved = [], broke = [], worse = [];
  cfg.forEach((c, i) => { if (/^SETUP/.test(c.tag)) return; const o = pages(i, "old"), w = pages(i, "new");
    if (o.length !== w.length || !o.length) { broke.push(c.look + " " + c.tag + ": " + o.length + "/" + w.length + " pages"); return; }
    o.forEach((q, j) => { const v = w[j]; n++; const t = c.look + " · " + c.tag + " · " + q.day;
      if (!q.bad.length && q.r <= 0.05 && q.d <= 0.05) { fit++; if (v.sig !== q.sig) moved.push(t); if (v.bad.length) broke.push(t + " → " + v.bad.slice(0, 2).join("; ")); }
      else if (!q.bad.length) { subpx++; if (v.bad.length) broke.push(t + " (was " + Math.max(q.r, q.d) + " px) → " + v.bad.slice(0, 2).join("; ")); }
      else { flagged++; if (!v.bad.length) fixed++; else if (Math.max(v.r, v.d) > Math.max(q.r, q.d) + 0.5) worse.push(t + " " + Math.max(q.r, q.d) + " → " + Math.max(v.r, v.d) + " px"); } }); });
  ok(n > 0 && res.fonts >= 0, cfg.length * 2 + " notebooks measured (" + n + " daily pages a side, " + LOOKS.length + " looks; " + res.fonts + " font faces loaded on the first)");
  ok(!moved.length, fit + " pages that fit before: every element in exactly the same place and size", moved.slice(0, 3).join(" | "));
  ok(!broke.length, "…and none of them is clipped now — nor any of the " + subpx + " pages over by less than half a pixel (they may tighten by that much)", broke.slice(0, 3).join(" | "));
  ok(!worse.length, flagged + " pages clipped before (other causes included): " + fixed + " fit now, none clipped further", worse.slice(0, 3).join(" | "));
}
(async function () {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (process.env.NO_CHROME) console.log("Chrome daily-page measurement — SKIPPED (NO_CHROME is set)");
  else if (!fs.existsSync(chrome)) console.log("Chrome daily-page measurement — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)");
  else {
    const quick = process.argv.includes("--quick");
    for (const noFonts of quick ? [false] : [false, true]) {
      const cfg = sweep(quick), res = await measure(chrome, cfg, noFonts), tag = noFonts ? "stand-in fonts" : "web fonts when they load";
      if (res.error) { ok(false, "Chrome daily-page measurement ran (" + tag + ")", res.error); continue; }
      if (!noFonts && res.fonts < 3) console.log("  (the web fonts did not load — offline? — so the before/after of the three set-ups is checked with stand-in fonts only)");
      check(res, cfg, tag, !noFonts && res.fonts >= 3);
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
