// 📓 Pre-K cover, white shape (PK_WHITESHAPE, her yes 2026-11-24: "Yes, fix it"). On the cover's Shapes card each shape borrows a
// colour from the kid's colour list in order; the one that borrowed White (#f3f4f6) printed invisible on the pale card.
// Run: node test_prek_white_shape.js       (also checks the colours in Google Chrome, headless, when it is on this machine;
//                                            set CHROME_BIN to point at another Chrome, NO_CHROME=1 to skip)
//   • a borrowed colour too pale to see (luminance ≥ 0.70 — White, or a custom pale colour) is drawn in the look's ordinary
//     outline colour: the same colour the daily page's "Color it" shape is drawn in, in that same notebook
//   • every other shape keeps its borrowed colour; the Colors card, the shape list, order and sizes do not move
//   • every page other than the cover is byte for byte the old one; a deck with no pale colour gives the old notebook exactly
//   • the old tree = this tree with the PK_WHITESHAPE blocks cut out (no pinned commits)
//   • all nine picker looks plus each family's own look
// Names and decks in here are made up.
const fs = require("fs"), path = require("path"), os = require("os");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const START = "  // PK_WHITESHAPE_START", END = "  // PK_WHITESHAPE_END\n";
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }

// cut every marked block (and the line-start indentation of an indented one) out → the old tree
function cut(s) {
  let out = s, i;
  while ((i = out.indexOf("// PK_WHITESHAPE_START")) >= 0) {
    const a = out.lastIndexOf("\n", i) + 1, e = out.indexOf("// PK_WHITESHAPE_END", i), b = out.indexOf("\n", e) + 1;
    out = out.slice(0, a) + out.slice(b);
  }
  return out;
}
const blocks = src.split("// PK_WHITESHAPE_START").length - 1, ends = src.split("// PK_WHITESHAPE_END").length - 1;
const oldSrc = cut(src);
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const NB = load(src), OLD = load(oldSrc);

console.log("the blocks");
ok(blocks === 2 && ends === 2, "two PK_WHITESHAPE blocks, each marked start and end (the lightness check, and its one use)");
const useAt = src.indexOf("if (pkTooPale(c))"), cov = src.indexOf("function juPageCover("), covEnd = src.indexOf("var colorSwatches", cov);
ok(useAt > cov && useAt < covEnd && src.split("pkTooPale(").length - 1 === 2, "used once, on the cover's Shapes row only (before the Colors swatches)");
ok(oldSrc.indexOf("pkTooPale") < 0 && oldSrc.length < src.length, "cutting the blocks out leaves no trace of them");
ok(!/🔀/.test(src.slice(src.indexOf(START), src.indexOf(END)) ), "no 🔀");

// ── the lightness rule ─────────────────────────────────────────────────────────────────────────────────────────────────
// the function is cut out of the file's text and run alone
const fnSrc = src.slice(src.indexOf("function pkTooPale"), src.indexOf("  // PK_WHITESHAPE_END", src.indexOf("function pkTooPale")));
const pale = new Function(fnSrc + "\nreturn pkTooPale;")();
console.log("too pale to see = luminance 0.70 or more");
ok(pale("#f3f4f6") && pale("#fff") && pale("#FFFFFF") && pale("white") && pale("rgb(250, 250, 250)"), "White in every spelling is too pale");
ok(pale("#fde2e4") && pale("#fffdd0") && pale("#e0f2fe"), "custom pale colours (a pale pink, a cream, a pale blue) are too pale");
ok(["#dc2626", "#2563eb", "#16a34a", "#eab308", "#ea580c", "#9333ea", "#ec4899", "#1f2937", "#92400e", "#6b7280", "#7dd3fc"].every(c => !pale(c)),
  "every colour a deck prints today but White keeps its colour — Yellow (#eab308) and a sky blue (#7dd3fc) included");
ok(!pale("") && !pale(null) && !pale("Gold") && !pale("var(--x)"), "a missing or unreadable colour is left alone (the shape keeps today's default)");

// ── made-up decks ─────────────────────────────────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 30, 2026", tuesday: "December 1, 2026", wednesday: "December 2, 2026", thursday: "December 3, 2026", friday: "December 4, 2026" };
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), az = AZ.map(l => l.toLowerCase());
const SH = ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval", "Diamond", "Star", "Heart", "Pentagon", "Octagon", "Trapezoid", "Semicircle", "Parallelogram", "Kite", "Crescent", "Cross", "Arrow", "Cube", "Sphere", "Cone"];
const C11 = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Pink", "Brown", "Black", "White", "Gray"];
const NO_WHITE = C11.filter(c => c !== "White");
const NUMS = (a, b) => { const r = []; for (let n = a; n <= b; n++) r.push(n); return r; };
const base = (shapes, colors, x) => [].concat(mi("Letters", AZ.slice(0, 8)), mi("Numbers", NUMS(1, 10)), mi("Shapes", shapes, x), mi("Colors", colors), mi("Animals", ["Lion", "Frog"]));
const PALE_DECKS = {
  "11 colours, White 10th (19 shapes)": base(SH.slice(0, 19), C11),
  "White first (6 shapes, 4 colours — the colours go round twice)": base(SH.slice(0, 6), ["White", "Red", "Blue", "Green"]),
  "White 4th of 4 (8 shapes)": base(SH.slice(0, 8), ["Red", "Blue", "Green", "White"]),
  "White only (3 shapes)": base(SH.slice(0, 3), ["White"]),
  "White 2nd + little letters / Shapes Path deck": [].concat(mi("Letters", AZ), mi("Lowercase", az), mi("Letter Sounds", az), mi("Numbers", NUMS(1, 20)),
    mi("Shapes", SH, { 20: { status: "introduction" } }), mi("Colors", ["Red", "White", "Blue", "Yellow", "Green"]))
};
const PLAIN_DECKS = {
  "10 colours, no White (19 shapes)": base(SH.slice(0, 19), NO_WHITE),
  "4 colours, no White (6 shapes)": base(SH.slice(0, 6), ["Red", "Blue", "Yellow", "Green"]),
  "Shapes Path deck, no White": [].concat(mi("Letters", AZ), mi("Lowercase", az), mi("Numbers", NUMS(1, 20)), mi("Shapes", SH), mi("Colors", NO_WHITE))
};
const KEYS = ["nbLowercase", "nbFindIt", "nbTeens", "nbShapesAhead", "nbSkipNoSchoolDays"];
const MASKS = [0, 1, 8, 9, 31];
const LV = MASKS.map(m => { const lv = {}; KEYS.forEach((k, i) => { lv[k] = !!(m & (1 << i)); }); return lv; });
const ctxOf = (look, items, lv, curriculum) => {
  const c = { weekNum: "week31", weekDates: "Nov 30 – Dec 4, 2026", weekData: { dates, tasks: [] }, masteryItems: items, extraPages: {}, kidName: "Finn", notebookTheme: look, nbLevel: lv };
  if (curriculum) c.curriculum = curriculum;
  return c;
};
const LOOKS = Object.keys(NB.themes).map(k => ({ kid: "kid9", look: k, tag: k }))
  .concat(Object.keys(NB.GENERATORS).filter(k => NB.GENERATORS[k].prek).map((k, i) => ({ kid: k, look: "", tag: "family look " + (i + 1) })));
const gen = (N, L, ctx) => N.generate(L.kid, JSON.parse(JSON.stringify(ctx)));

// the cover's Shapes card (its HTML, start/end in the page) and the strokes of its shapes
function shapesCard(html) {
  const a = html.indexOf('<div class="learn-lab">Shapes</div>'); if (a < 0) return null;
  const s = html.lastIndexOf('<div class="learn-card', a), e = html.indexOf('<div class="learn-card', a);
  return { s, e, html: html.slice(s, e) };
}
const svgs = (h) => h.split("<svg").slice(1).map(x => "<svg" + x.slice(0, x.indexOf("</svg>") + 6));
const strokeOf = (svg) => { const m = / stroke="([^"]*)"/.exec(svg); return m ? m[1] : null; };
// the daily page's "Color it" shape — the look's ordinary outline colour, read from the same notebook
const colorItStroke = (html) => { const i = html.indexOf('Color it'); if (i < 0) return null; const s = html.lastIndexOf("<svg", i); return strokeOf(html.slice(s, i)); };

console.log("decks with a pale colour: only the pale shapes change, to the look's outline colour");
let nCov = 0, nFixed = 0; const bad = [], outlines = {}, hit = {};
LOOKS.forEach(L => {
  const runs = [];
  Object.keys(PALE_DECKS).forEach(d => LV.forEach((lv, li) => runs.push({ tag: d + " · level " + MASKS[li], ctx: ctxOf(L.look, PALE_DECKS[d], lv) })));
  // a custom pale colour (not in any deck's word list) reaches the cover through a ready-made curriculum
  const cur = NB._internal.juCurriculumFromMastery(PLAIN_DECKS["4 colours, no White (6 shapes)"]);
  cur.colors = [["Red", "#dc2626"], ["Cream", "#fffdd0"], ["Sky", "#7dd3fc"], ["Blush", "#fde2e4"]];
  runs.push({ tag: "custom pale cream + blush (2nd, 4th) · level 0", ctx: ctxOf(L.look, PLAIN_DECKS["4 colours, no White (6 shapes)"], LV[0], cur), custom: true });
  runs.forEach(r => {
    const a = gen(NB, L, r.ctx), b = gen(OLD, L, r.ctx); nCov++;
    const A = shapesCard(a.student), B = shapesCard(b.student);
    if (!A || !B) { bad.push(L.tag + "/" + r.tag + ": no Shapes card"); return; }
    const outline = colorItStroke(a.student);
    if (!outline || pale(outline)) { bad.push(L.tag + "/" + r.tag + ": no dark Color-it outline (" + outline + ")"); return; }
    outlines[L.tag] = outline;
    const sa = svgs(A.html), sb = svgs(B.html);
    if (sa.length !== sb.length) { bad.push(L.tag + "/" + r.tag + ": shape count moved"); return; }
    let fixedHere = 0;
    sb.forEach((svg, i) => {
      const was = strokeOf(svg), want = pale(was) ? outline : was;
      if (pale(was)) fixedHere++;
      if (strokeOf(sa[i]) !== want) bad.push(L.tag + "/" + r.tag + ": shape " + (i + 1) + " stroke " + strokeOf(sa[i]) + " ≠ " + want);
      // the shape itself: same drawing, same size — only its stroke colour
      if (sa[i] !== svg.split(' stroke="' + was + '"').join(' stroke="' + want + '"')) bad.push(L.tag + "/" + r.tag + ": shape " + (i + 1) + " changed more than its colour");
    });
    // a cover in week mode (little letters / Shapes Path on) shows only this week's picks, so White may not be on it this week
    const dk = r.tag.split(" · ")[0]; hit[L.tag + "/" + dk] = (hit[L.tag + "/" + dk] || 0) + fixedHere;
    nFixed += fixedHere;
    // the whole notebook: the old one with only the pale strokes in the Shapes card swapped (other pages, Colors card, guide all the same)
    const swapSvg = (svg) => { const w = strokeOf(svg); return pale(w) ? svg.split(' stroke="' + w + '"').join(' stroke="' + outline + '"') : svg; };
    const swapped = b.student.slice(0, B.s) + B.html.replace(/<svg[\s\S]*?<\/svg>/g, swapSvg) + b.student.slice(B.e);
    if (a.student !== swapped) bad.push(L.tag + "/" + r.tag + ": something outside the Shapes card's pale strokes changed");
    if (JSON.stringify(Object.assign({}, a, { student: "" })) !== JSON.stringify(Object.assign({}, b, { student: "" }))) bad.push(L.tag + "/" + r.tag + ": the guide / other output changed");
    // the Colors card still shows the White (or pale) swatch exactly as before
    const ca = a.student.indexOf('<div class="learn-lab">Colors</div>'), cb = b.student.indexOf('<div class="learn-lab">Colors</div>');
    if (a.student.slice(ca, a.student.indexOf("</div></div></div>", ca)) !== b.student.slice(cb, b.student.indexOf("</div></div></div>", cb))) bad.push(L.tag + "/" + r.tag + ": Colors card changed");
  });
});
ok(LOOKS.length >= 11, LOOKS.length + " Pre-K looks (" + LOOKS.map(L => L.tag).join(", ") + ")");
ok(!bad.length, nCov + " covers (White 1st, 2nd, 4th, 10th, alone, the colours going round twice, little letters / Shapes Path, a custom cream and blush) — " +
  nFixed + " pale shapes now in the look's outline colour, every other shape its own colour, nothing else on any page moved", bad.slice(0, 6).join(" | "));
const missed = Object.keys(hit).filter(k => !hit[k]);
ok(Object.keys(hit).length === LOOKS.length * (Object.keys(PALE_DECKS).length + 1) && !missed.length, "every look × pale deck has pale shapes to fix (none of the decks tests nothing)", missed.join(", "));
ok(Object.keys(outlines).length === LOOKS.length && Object.keys(outlines).every(k => !pale(outlines[k])),
  "each look's outline colour is the daily page's “Color it” colour: " + Object.keys(outlines).map(k => k + " " + outlines[k]).join(", "));

console.log("decks with no pale colour: the old notebook, byte for byte");
let nPlain = 0; const diff = [];
LOOKS.forEach(L => Object.keys(PLAIN_DECKS).forEach(d => LV.forEach((lv, li) => {
  const c = ctxOf(L.look, PLAIN_DECKS[d], lv); nPlain++;
  if (JSON.stringify(gen(NB, L, c)) !== JSON.stringify(gen(OLD, L, c))) diff.push(L.tag + "/" + d + "/lv" + li);
})));
["lincoln", "ellis", "lucy", "kid9"].filter(k => NB.GENERATORS[k] || k === "kid9").forEach(k => {
  const c = ctxOf("", PALE_DECKS["11 colours, White 10th (19 shapes)"], {}); nPlain++;
  if (["lincoln", "ellis", "lucy"].indexOf(k) >= 0 && JSON.stringify(NB.generate(k, JSON.parse(JSON.stringify(c)))) !== JSON.stringify(OLD.generate(k, JSON.parse(JSON.stringify(c))))) diff.push(k);
});
ok(!diff.length, nPlain + " notebooks (student + guide) the same as the old tree; school-age notebooks untouched even with White in the deck", diff.slice(0, 5).join(", "));

// ── in Chrome: the fixed shape really is darker than the card behind it ─────────────────────────────────────────────
const lum = (rgb) => { const l = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
const contrast = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
const coverOnly = (html) => { const h = html.indexOf('<div class="page-label">'), c2 = html.indexOf('<div class="page-label">', h + 10); return html.slice(0, c2 > 0 ? c2 : undefined) + "\n</body>\n</html>"; };
const MEASURE_FN = "function(d){var lab=[].slice.call(d.querySelectorAll('.learn-lab')).filter(function(x){return x.textContent==='Shapes';})[0];" +
  "var card=lab.closest('.learn-card'),bg=getComputedStyle(card).backgroundColor;" +
  "return{bg:bg,strokes:[].slice.call(card.querySelectorAll('svg')).map(function(s){var el=s.firstElementChild;return getComputedStyle(el).stroke;})};}";
function chromeCheck() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (process.env.NO_CHROME) { console.log("Chrome colour check — SKIPPED (NO_CHROME is set)"); return; }
  if (!fs.existsSync(chrome)) { console.log("Chrome colour check — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return; }
  const deck = PALE_DECKS["11 colours, White 10th (19 shapes)"];
  const cfg = [];
  LOOKS.forEach(L => ["new", "old"].forEach(w => cfg.push({ which: w, look: L.tag, html: coverOnly(gen(w === "new" ? NB : OLD, L, ctxOf(L.look, deck, LV[0])).student) })));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prek-white-shape-"));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var c of CFG){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1300px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=c.html;});var m=M(f.contentDocument);m.which=c.which;m.look=c.look;res.push(m);f.remove();}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=600000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 300000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome colour check — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome colour check ran", res ? res.error : "no result in the page"); return; }
  const rgb = (s) => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  console.log("in Chrome (headless): the 10th shape (White's) against the Shapes card");
  ok(res.length === cfg.length, "Chrome colour check ran: " + LOOKS.length + " looks, new and old cover");
  const lines = [], badC = [];
  LOOKS.forEach(L => {
    const n = res.find(r => r.look === L.tag && r.which === "new"), o = res.find(r => r.look === L.tag && r.which === "old");
    const cn = contrast(rgb(n.strokes[9]), rgb(n.bg)), co = contrast(rgb(o.strokes[9]), rgb(o.bg));
    lines.push(L.tag + " " + co.toFixed(2) + "→" + cn.toFixed(2));
    if (!(cn >= 4.5 && co < 1.2)) badC.push(L.tag + " old " + co.toFixed(2) + " new " + cn.toFixed(2));
    if (n.strokes.some((s, i) => i !== 9 && s !== o.strokes[i])) badC.push(L.tag + ": another shape's colour moved");
  });
  ok(!badC.length, "the old White shape all but vanished (contrast under 1.2 : 1); now at least 4.5 : 1 on every look, and no other shape's colour moved — " + lines.join(", "), badC.join(" | "));
}
chromeCheck();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
