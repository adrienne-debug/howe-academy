// 📓 Pre-K cover fit (PK_COVERFIT, her report 2026-11-24: "the colors and the numbers little area is falling off … his shapes and
// his letters are so large. So those actually need to not extend to the right too much, but maybe go down and make the draw you
// a dinosaur … box below it a little smaller.")
// Run: node test_prek_cover_fit.js          (measures the covers in Google Chrome, headless, when it is on this machine;
//                                             set CHROME_BIN to point at another Chrome, NO_CHROME=1 to skip)
//   • the change is one marked CSS block in the shared Pre-K sheet — nothing else in the code moves
//   • every notebook (every kid, every look, every level-switch setting) is byte for byte the old one apart from those CSS
//     lines — so every page's HTML, the cover's included, is the same; only how the cover's cards are laid out changes
//   • measured in Chrome: on every Pre-K look (the nine in the picker + each family's own look) nothing on the cover crosses
//     the page's right or bottom edge — long lists with all switches off (her case), 26 letters / 21 shapes with little letters
//     and the Shapes Path on (and the same decks with every other switch setting), a tiny list, the longest name the name field
//     allows, and a stress deck longer than any kid has — and the two card columns are equal width
//   • the old tree really does push Numbers / Colors off the page for her case (the test sees the bug it fixes)
//   • a cover that fits today lands in exactly the same place (the four cards, the fourth card and the draw box)
//   • the "Draw YOU …" box keeps a usable height — printed for every case, the smallest reported
// Names and decks in here are made up.
const fs = require("fs"), path = require("path"), os = require("os");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const START = "  // PK_COVERFIT_START", endMark = "  // PK_COVERFIT_END\n";
const A = src.indexOf(START), B = src.indexOf(endMark);
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const block = src.slice(A, B + endMark.length);
const oldSrc = src.slice(0, A) + src.slice(B + endMark.length);
const NB = load(src), OLD = load(oldSrc);   // this tree, and this tree with the block taken out
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }

// the CSS the block adds, exactly as it lands in the page's <style>
const added = (block.match(/^"(.*)\\n" \+$/gm) || []).map(l => JSON.parse(l.replace(/ \+$/, "")) ).join("");

console.log("the block");
ok(A > 0 && B > A && src.indexOf("// PK_COVERFIT_START", A + 10) < 0 && src.indexOf("// PK_COVERFIT_END", B + 10) < 0, "one PK_COVERFIT block, marked start and end");
ok(A > src.indexOf("var JU_CSS = ") && A < src.indexOf("var SH_CSS = ") && A < src.indexOf("var CB_CSS = "), "it sits in the shared Pre-K sheet (JU_CSS), so every Pre-K look gets it");
ok(added === "  .learn-grid { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }\n  .learn-grid .learn-card > div { min-width:0; }\n  .learn-grid .learn-val { flex-wrap:wrap; }\n",
  "it is CSS only: equal columns that may shrink, a card's words may shrink, the shape / colour rows wrap", JSON.stringify(added));
ok(!/🔀/.test(block) && !/<img|https?:\/\//.test(block), "no 🔀, no outside picture or address");

// ── made-up decks ─────────────────────────────────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 30, 2026", tuesday: "December 1, 2026", wednesday: "December 2, 2026", thursday: "December 3, 2026", friday: "December 4, 2026" };
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), az = AZ.map(l => l.toLowerCase());
const SHAPES21 = ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval", "Diamond", "Star", "Heart", "Pentagon", "Octagon", "Trapezoid", "Semicircle", "Parallelogram", "Kite", "Crescent", "Cross", "Arrow", "Cube", "Sphere", "Cone"];
const COLORS11 = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Pink", "Brown", "Black", "White", "Gray"];
const NUMS = (a, b) => { const r = []; for (let n = a; n <= b; n++) r.push(n); return r; };
const DECKS = {
  // her case: 20 letters, 20 numbers, 19 shapes, 11 colours
  long: [].concat(mi("Letters", AZ.slice(0, 20)), mi("Numbers", NUMS(1, 20)), mi("Shapes", SHAPES21.slice(0, 19)), mi("Colors", COLORS11), mi("Animals", ["Lion", "Giraffe", "Frog", "Owl"])),
  // little letters + the Shapes Path: 26 letters (big and little), 21 shapes, the last one being learned
  full: [].concat(mi("Letters", AZ), mi("Lowercase", az), mi("Letter Sounds", az), mi("Numbers", NUMS(1, 20)), mi("Shapes", SHAPES21, { 20: { status: "introduction" } }), mi("Colors", COLORS11)),
  // longer than any kid has: 26 letters, numbers 1–50, every shape the Shapes Path knows (26), 13 colours
  huge: [].concat(mi("Letters", AZ), mi("Numbers", NUMS(1, 50)), mi("Shapes", SHAPES21.concat(["Heptagon", "Nonagon", "Decagon", "Cylinder", "Pyramid"])), mi("Colors", COLORS11.concat(["Gold", "Silver"])), mi("Animals", ["Lion", "Giraffe", "Frog", "Owl"])),
  tiny: [].concat(mi("Letters", AZ.slice(0, 4)), mi("Numbers", NUMS(1, 4)), mi("Shapes", SHAPES21.slice(0, 4)), mi("Colors", COLORS11.slice(0, 4))),
  short: [].concat(mi("Letters", ["A", "B", "C", "D", "E"]), mi("Numbers", NUMS(11, 20)), mi("Shapes", SHAPES21.slice(0, 6), { 5: { status: "introduction" } }), mi("Colors", COLORS11.slice(0, 8)), mi("Animals", ["Lion", "Giraffe", "Frog", "Owl"]))
};
const KEYS = ["nbLowercase", "nbFindIt", "nbTeens", "nbShapesAhead", "nbSkipNoSchoolDays"];
const LEVELS = []; for (let m = 0; m < 32; m++) { const lv = {}; KEYS.forEach((k, i) => { lv[k] = !!(m & (1 << i)); }); LEVELS.push(lv); }
const LONG_NAMES = ["Maximiliana Bartholomewz", "Wilhelminabartholomewzzz"];   // 24 characters: the Notebook tab's name field allows 24
const ctxOf = (look, deck, lv, name) => ({ weekNum: "week31", weekDates: "Nov 30 – Dec 4, 2026", weekData: { dates, tasks: [] }, masteryItems: DECKS[deck], extraPages: {},
  kidName: name || "Finn", notebookTheme: look, nbLevel: lv });
// every Pre-K look: the nine in the picker (on a made-up kid) and each family's own look (its own key, no look picked)
const LOOKS = Object.keys(NB.themes).map(k => ({ kid: "kid9", look: k, tag: k }))
  .concat(Object.keys(NB.GENERATORS).filter(k => NB.GENERATORS[k].prek).map((k, i) => ({ kid: k, look: "", tag: "family look " + (i + 1) + " (" + NB.GENERATORS[k].prek.native + ")" })));
const gen = (N, L, deck, lv, name) => N.generate(L.kid, JSON.parse(JSON.stringify(ctxOf(L.look, deck, lv, name))));

console.log("every notebook is the old one apart from the added CSS");
ok(LOOKS.length >= 11 && LOOKS.every(L => /class="learn-grid"/.test(gen(NB, L, "short", {}).student)), LOOKS.length + " Pre-K looks, each with the “This week I am learning…” cards");
let cmp = 0; const diff = [];
const strip = (s) => String(s).split(added).join("");
LOOKS.forEach(L => ["long", "full", "tiny", "short"].forEach(deck => [0, 1, 8, 9, 31].forEach(li => {
  const a = gen(NB, L, deck, LEVELS[li]), b = gen(OLD, L, deck, LEVELS[li]); cmp++;
  if (JSON.stringify(a, (k, v) => typeof v === "string" ? strip(v) : v) !== JSON.stringify(b)) diff.push(L.tag + "/" + deck + "/lv" + li);
  if (a.student.split(added).length !== 2) diff.push(L.tag + "/" + deck + "/lv" + li + ": the CSS is not in the student sheet once");
})));
["lincoln", "ellis", "lucy", "kid9"].filter(k => NB.GENERATORS[k] || k === "kid9").forEach(k => [{}, { bindingMargin: true }].forEach(x => {
  const c = Object.assign(ctxOf("", "long", {}), x); cmp++;
  if (JSON.stringify(NB.generate(k, JSON.parse(JSON.stringify(c)))) !== JSON.stringify(OLD.generate(k, JSON.parse(JSON.stringify(c))))) diff.push(k + " (school-age / starter)");
}));
ok(!diff.length, cmp + " notebooks (student + guide) — every Pre-K page's HTML the same, the cover's too; the only difference is the three CSS lines; school-age and starter notebooks byte for byte the same", diff.slice(0, 5).join(", "));

// ── measured in Chrome ────────────────────────────────────────────────────────────────────────────────────────────────
// Only the cover is rendered: the notebook's <head> (its <style>) + the cover page. Everything inside the page is checked —
// every element box and every line of text — against the page's right / left / bottom edge and the cover body's clip, and
// everything in a card against its own card (so Letters / Shapes never run into Numbers / Colors).
const MEASURE_FN = "function(doc){var pg=doc.querySelector('.page'),pr=pg.getBoundingClientRect(),cb=pg.querySelector('.cover-body').getBoundingClientRect(),bad=[],maxR=0,maxB=0;" +
  "function chk(r,what){if(r.width<=0&&r.height<=0)return;var o=r.right-pr.right;if(o>maxR)maxR=o;if(o>0.5)bad.push(what+' '+Math.round(o)+'px past the right edge');if(r.left<pr.left-0.5)bad.push(what+' past the left edge');" +
  "var ob=r.bottom-pr.bottom;if(ob>maxB)maxB=ob;if(ob>0.5)bad.push(what+' '+Math.round(ob)+'px below the page');}" +
  "pg.querySelectorAll('*').forEach(function(el){chk(el.getBoundingClientRect(),'<'+el.tagName.toLowerCase()+(el.className&&el.className.baseVal==null?'.'+String(el.className).split(' ')[0]:'')+'>');});" +
  "var tw=doc.createTreeWalker(pg,4),t;while((t=tw.nextNode())){if(!t.nodeValue.trim())continue;var rg=doc.createRange();rg.selectNodeContents(t);Array.from(rg.getClientRects()).forEach(function(r){chk(r,'text “'+t.nodeValue.trim().slice(0,12)+'”');});}" +
  "pg.querySelectorAll('.cover-learn, .cover-learn *, .cover-hero, .cover-hero *').forEach(function(el){var r=el.getBoundingClientRect();if(r.height>0&&r.bottom>cb.bottom+0.5)bad.push('<'+el.tagName.toLowerCase()+'> cut off by the cover body ('+Math.round(r.bottom-cb.bottom)+'px)');});" +
  "pg.querySelectorAll('.cover-learn .learn-card').forEach(function(cd,ci){var c=cd.getBoundingClientRect(),inn=function(r,w){if(r.width>0&&(r.right>c.right+0.5||r.left<c.left-0.5||r.bottom>c.bottom+0.5))bad.push(w+' spills out of card '+(ci+1));};" +
  "cd.querySelectorAll('*').forEach(function(el){inn(el.getBoundingClientRect(),'<'+el.tagName.toLowerCase()+'>');});var w2=doc.createTreeWalker(cd,4),t2;while((t2=w2.nextNode())){if(!t2.nodeValue.trim())continue;var g=doc.createRange();g.selectNodeContents(t2);Array.from(g.getClientRects()).forEach(function(r){inn(r,'text');});}});" +
  "var box=function(el){var r=el.getBoundingClientRect();return[Math.round(r.left*10)/10,Math.round(r.top*10)/10,Math.round(r.width*10)/10,Math.round(r.height*10)/10];};" +
  "var cards=Array.from(pg.querySelectorAll('.cover-learn .learn-card')).map(box),dr=pg.querySelector('.cover-draw');" +
  "var sh=pg.querySelectorAll('.learn-grid .learn-card')[2],shapeRows={};if(sh)sh.querySelectorAll('svg').forEach(function(s){shapeRows[Math.round(s.getBoundingClientRect().top)]=1;});" +
  "return{bad:bad.filter(function(v,i,a){return a.indexOf(v)===i;}).slice(0,6),maxR:Math.round(maxR*10)/10,maxB:Math.round(maxB*10)/10,cards:cards,draw:box(dr),drawH:Math.round(dr.getBoundingClientRect().height),pageW:Math.round(pr.width),shapeRows:Object.keys(shapeRows).length};}";
const coverOnly = (html) => { const h = html.indexOf('<div class="page-label">'), c2 = html.indexOf('<div class="page-label">', h + 10); return html.slice(0, h) + html.slice(h, c2 > 0 ? c2 : undefined) + "\n</body>\n</html>"; };

function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (process.env.NO_CHROME) { console.log("Chrome cover measurement — SKIPPED (NO_CHROME is set)"); return; }
  if (!fs.existsSync(chrome)) { console.log("Chrome cover measurement — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return; }
  const cfg = [];
  const add = (which, L, deck, lv, name, tag) => cfg.push({ which, look: L.tag, tag, deck, html: coverOnly(gen(which === "new" ? NB : OLD, L, deck, lv, name).student) });
  LOOKS.forEach(L => {
    LEVELS.forEach((lv, li) => add("new", L, "long", lv, null, "her case (20 letters · 20 numbers · 19 shapes · 11 colours) · level " + li));
    LEVELS.forEach((lv, li) => add("new", L, "full", lv, null, "26 letters · 21 shapes · level " + li));
    [0, 1, 8, 9, 31].forEach(li => add("new", L, "huge", LEVELS[li], LONG_NAMES[0], "longer than any kid (26 letters · 1–50 · 26 shapes · 13 colours) + 24-character name · level " + li));
    [0, 31].forEach(li => LONG_NAMES.forEach(nm => add("new", L, "long", LEVELS[li], nm, "24-character name “" + nm + "” · level " + li)));
    add("old", L, "long", LEVELS[0], null, "her case · level 0");
    [0, 1, 8, 9, 31].forEach(li => ["tiny", "short"].forEach(deck => { add("new", L, deck, LEVELS[li], null, deck + " · level " + li); add("old", L, deck, LEVELS[li], null, deck + " · level " + li); }));
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prek-cover-fit-"));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var c of CFG){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1300px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=c.html;});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,40);});var m=M(d);m.which=c.which;m.look=c.look;m.tag=c.tag;m.deck=c.deck;res.push(m);f.remove();}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=1800000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 900000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");   // Chrome can finish the page and still exit non-zero while shutting down
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome cover measurement — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome cover measurement ran", res ? res.error : "no result in the page"); return; }
  ok(res.length === cfg.length && res.every(r => r.pageW === 816), "Chrome cover measurement ran: " + res.length + " covers on " + LOOKS.length + " looks, each page 816 px (8.5in) wide (stand-in fonts where the web fonts are not on this machine)");
  const NEWR = res.filter(r => r.which === "new"), OLDR = res.filter(r => r.which === "old");

  console.log("the old tree pushes the cards off the page (her case, all switches off)");
  const oldHer = OLDR.filter(r => r.deck === "long");
  ok(oldHer.length === LOOKS.length && oldHer.every(r => r.maxR > 50), "on every look the old cover's right column ran past the right edge — by " +
    Math.min.apply(null, oldHer.map(r => r.maxR)) + "–" + Math.max.apply(null, oldHer.map(r => r.maxR)) + " px", oldHer.filter(r => r.maxR <= 50).map(r => r.look + " " + r.maxR).join(", "));

  console.log("now: nothing crosses the right or bottom edge, the columns are equal");
  LOOKS.forEach(L => {
    const r = NEWR.filter(x => x.look === L.tag), bad = r.filter(x => x.bad.length);
    const uneven = r.filter(x => Math.abs(x.cards[0][2] - x.cards[1][2]) > 0.5 || Math.abs(x.cards[2][2] - x.cards[3][2]) > 0.5 || Math.abs(x.cards[1][0] + x.cards[1][2] - (x.cards[4][0] + x.cards[4][2])) > 0.5);
    const her = r.filter(x => x.deck === "long" && /level 0$/.test(x.tag))[0] || {};
    ok(!bad.length && !uneven.length, L.tag + ": " + r.length + " covers fit (largest reach past the right edge " + Math.max.apply(null, r.map(x => x.maxR)) + " px, below the page " + Math.max.apply(null, r.map(x => x.maxB)) +
      " px); her case: shapes in " + her.shapeRows + " rows, draw box " + her.drawH + " px tall; smallest draw box " + Math.min.apply(null, r.map(x => x.drawH)) + " px (" + (r.filter(x => x.drawH === Math.min.apply(null, r.map(y => y.drawH)))[0] || {}).tag + ")",
      bad.slice(0, 2).map(x => x.tag + " → " + x.bad.join("; ")).concat(uneven.slice(0, 2).map(x => x.tag + " → columns " + JSON.stringify(x.cards))).join(" | "));
  });
  const worst = NEWR.reduce((a, x) => (x.drawH < a.drawH ? x : a), { drawH: 1e9 });
  ok(worst.drawH >= 120, "the “Draw YOU …” box stays a drawing box on every look and case — smallest " + worst.drawH + " px (" + worst.look + ", " + worst.tag + ")" + (worst.drawH < 200 ? "; under 200 px — see the report" : ""));

  console.log("a cover that fits today lands exactly where it did");
  const moved = [];
  NEWR.filter(x => x.deck === "tiny" || x.deck === "short").forEach(x => {
    const o = OLDR.filter(y => y.look === x.look && y.tag === x.tag)[0];
    if (!o || o.bad.length || JSON.stringify(o.cards) !== JSON.stringify(x.cards) || JSON.stringify(o.draw) !== JSON.stringify(x.draw)) moved.push(x.look + " " + x.tag + (o ? " " + JSON.stringify(o.cards) + " → " + JSON.stringify(x.cards) : " (no old)"));
  });
  ok(!moved.length, NEWR.filter(x => x.deck === "tiny" || x.deck === "short").length + " short-list covers (4 of each, and a short Pre-K week) at five level settings on every look: the four cards, the fourth card and the draw box in the same place, same size", moved.slice(0, 3).join(" | "));
}
chromeMeasure();
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
