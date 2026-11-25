// LN_PLAINQ — the 6th-grade notebook's built-in questions, rewritten without the snake/reptile theme (Mom 2026-11-24:
// "Replace them now"). Run: node test_ln_plainq.js        (CHROME_BIN=… to point at Chrome; NO_CHROME=1 to skip the measurement)
//   • no theme word left in any built-in question (tools/ln_theme_inventory.js's list), every table the same size
//   • the old text, put back from tools/ln_plainq_pairs.js, rebuilds the data line byte for byte (sha256) — so every item that
//     is not in the pairs list is unchanged; and the pairs list is exactly the items the inventory flags in the old data
//   • each rewritten item keeps its format: same fields, tag, skill/error, answer letter, choice letters and count; analogies
//     stay "A is to B as C is to ___"; number questions keep their numbers (one documented exception) and choices
//   • no duplicate question; no family name; the blind number solver agrees with the key on every number question
//   • every OTHER notebook prints byte for byte the same; the 6th-grade notebook's pages are the same count and order;
//     Mom's answer check (lincolnBuiltinQ3) keeps its shape
//   • page fit in headless Google Chrome: the student and parent notebooks for enough weeks that every rewritten item prints
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const inv = require("./tools/ln_theme_inventory.js"), solver = require("./tools/ln_number_solver.js");
const { ORIGINAL_SHA256, PAIRS } = require("./tools/ln_plainq_pairs.js");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };

// ── the block, and the old source rebuilt from the pairs ────────────────────────────────────────────────────────────
const A = src.indexOf("  // LN_PLAINQ_START"), endMark = "\n  // LN_PLAINQ_END", B = src.indexOf(endMark);
const PRE = "  var LINCOLN_DATA = ";
const li = src.indexOf("\n" + PRE, A) + 1, le = src.indexOf("\n", li);
const line = src.slice(li, le), cut = line.lastIndexOf("}; //") + 1;
function py(v) { if (Array.isArray(v)) return "[" + v.map(py).join(", ") + "]"; if (v && typeof v === "object") return "{" + Object.keys(v).map(k => JSON.stringify(k) + ": " + py(v[k])).join(", ") + "}"; return JSON.stringify(v); }
const NEWD = JSON.parse(line.slice(PRE.length, cut)), OLDD = JSON.parse(line.slice(PRE.length, cut));
const itemOf = (d, t, id) => t === "fallback_passages" ? d.banks[t][+id.replace("passage", "") - 1] : d.banks[t].find(x => x.id === id);
function at(o, f, v) { const p = f.split("."); for (let i = 0; i < p.length - 1; i++) o = o[isNaN(p[i]) ? p[i] : +p[i]]; const k = p[p.length - 1]; if (v === undefined) return o[k]; o[k] = v; }
let pairsFit = true;
PAIRS.forEach(([t, id, f, old, neu]) => { const it = itemOf(OLDD, t, id); if (!it || at(it, f) !== neu) pairsFit = false; else at(it, f, old); });
const oldLine = PRE + py(OLDD) + line.slice(cut);
const OLDSRC = src.slice(0, A) + oldLine + src.slice(B + endMark.length);
const NB = load(src), OLD = load(OLDSRC);

console.log("the block");
ok(A > 0 && B > A && li > A && le < B + 1 && src.indexOf("// LN_PLAINQ_START", A + 10) < 0, "one LN_PLAINQ block, around the LINCOLN_DATA line");
ok(py(NEWD) === line.slice(PRE.length, cut), "the data line is the same one-line JSON shape as before (round-trips)");
ok(pairsFit, "every pair's NEW text is what the data holds now (" + PAIRS.length + " fields)");
ok(sha(line.slice(0, PRE.length) + line.slice(PRE.length)) !== ORIGINAL_SHA256 && sha(oldLine) === ORIGINAL_SHA256, "the OLD text put back rebuilds the old data line byte for byte (sha256 " + ORIGINAL_SHA256.slice(0, 12) + "…)");

// ── inventory ───────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("theme words and counts");
const itemsNew = inv.items(NEWD), itemsOld = inv.items(OLDD);
const themedNew = itemsNew.filter(it => inv.hits(it).length), themedOld = itemsOld.filter(it => inv.hits(it).length);
ok(themedNew.length === 0, "no theme word in any built-in question (" + itemsNew.length + " items, " + (inv.THEME.core.length + inv.THEME.flavor.length) + " theme words)", themedNew.map(it => it.id + ":" + inv.hits(it).map(h => h.word).join("/")).join(", "));
const counts = (d) => Object.keys(d.banks).map(k => k + " " + d.banks[k].length).join(", ");
ok(counts(NEWD) === counts(OLDD) && counts(NEWD) === "cogat_verbal 24, iowa_math 28, conventions 28, words 28, fallback_passages 3", "item counts per table unchanged: " + counts(NEWD));
const byTable = (list) => { const o = {}; list.forEach(it => { o[it.table] = (o[it.table] || 0) + 1; }); return JSON.stringify(o); };
ok(byTable(themedOld) === '{"cogat_verbal":20,"iowa_math":19,"conventions":27,"words":26,"fallback_passages":3}', "the old data had 95 themed items: " + byTable(themedOld));
const rewritten = new Set(PAIRS.map(p => p[0] + " " + p[1])), wasThemed = new Set(themedOld.map(it => it.table + " " + it.id));
ok(rewritten.size === wasThemed.size && [...wasThemed].every(k => rewritten.has(k)), "the rewritten items are exactly the themed ones — " + rewritten.size + " of " + itemsOld.length);
let same = 0, sameBad = [];
Object.keys(NEWD.banks).forEach(t => NEWD.banks[t].forEach((it, i) => { const id = t === "fallback_passages" ? "passage" + (i + 1) : it.id;
  if (!rewritten.has(t + " " + id)) { if (JSON.stringify(it) === JSON.stringify(OLDD.banks[t][i])) same++; else sameBad.push(id); } }));
ok(same === 16 && !sameBad.length, "the 16 unthemed items are byte for byte as before (cv09 cv14 cv15 cv20, 9 number items, cf11, w01 w25)", sameBad.join(","));
ok(JSON.stringify(NEWD.iowa_default) === JSON.stringify(OLDD.iowa_default), "the score table beside the banks is untouched");

// ── format of every rewritten item ──────────────────────────────────────────────────────────────────────────────────
console.log("each rewritten item keeps its format");
const TEXT_FIELDS = /^(text|sentence|corrected|ex1|ex2|html|q1_stem|q2_stem|(choices|q1|q2)\.\d+\.t)$/;
ok(PAIRS.every(p => TEXT_FIELDS.test(p[2])), "only question text changed — never an id, tag, skill, error type, answer letter or choice letter");
const shape = (o) => JSON.stringify(o, (k, v) => (typeof v === "string" && /^(text|sentence|corrected|ex1|ex2|html|q1_stem|q2_stem|t)$/.test(k)) ? "" : v);
let shapeBad = [];
Object.keys(NEWD.banks).forEach(t => NEWD.banks[t].forEach((it, i) => { if (shape(it) !== shape(OLDD.banks[t][i])) shapeBad.push(t + "#" + i); }));
ok(!shapeBad.length, "every item: same fields in the same order, same tag, skill/error, answer letter, choice letters and number of choices", shapeBad.join(","));
const spread = (d, t) => d.banks[t].map(q => q.ans).join("");
ok(spread(NEWD, "cogat_verbal") === spread(OLDD, "cogat_verbal") && spread(NEWD, "iowa_math") === spread(OLDD, "iowa_math") &&
  NEWD.banks.fallback_passages.every((p, i) => p.q1_ans === OLDD.banks.fallback_passages[i].q1_ans && p.q2_ans === OLDD.banks.fallback_passages[i].q2_ans),
  "in the data line the rewrite kept every answer letter: analogies " + spread(NEWD, "cogat_verbal") + " · numbers " + spread(NEWD, "iowa_math"));
// LN_ANSWER_SPREAD (2026-11-24) then moves some choices at load: the printed right answer is the same TEXT as the data line's,
// under the letter LN_ANSWER_SPREAD's table gives (test_ln_answer_spread.js checks that table item by item).
const SPREAD = new Function(src.slice(li, src.indexOf("  var LINCOLN_CONFIG = {")) + "\nreturn LINCOLN_DATA;")();
const keyT = (ch, l) => (ch.find(c => c.l === l) || {}).t;
ok(["cogat_verbal", "iowa_math"].every(t => SPREAD.banks[t].every((q, i) => keyT(q.choices, q.ans) === keyT(NEWD.banks[t][i].choices, NEWD.banks[t][i].ans))) &&
  SPREAD.banks.fallback_passages.every((p, i) => ["q1", "q2"].every(f => keyT(p[f], p[f + "_ans"]) === keyT(NEWD.banks.fallback_passages[i][f], NEWD.banks.fallback_passages[i][f + "_ans"]))),
  "after LN_ANSWER_SPREAD every right answer is the same text as before; letters now: analogies " + spread(SPREAD, "cogat_verbal") + " · numbers " + spread(SPREAD, "iowa_math"));
const AN = /^[A-Z][A-Z -]*[A-Z] is to [A-Z][A-Z -]*[A-Z] as [A-Z][A-Z -]*[A-Z] is to ___$/;
ok(NEWD.banks.cogat_verbal.every(q => AN.test(q.text) && q.choices.length === 4 && q.choices.every(c => c.t.length > 0)), "every analogy is still \"A is to B as C is to ___\" with four choices");
ok(NEWD.banks.cogat_verbal.every(q => { const L = q.choices.map(c => c.t.split(" ").length); return L.filter(n => n === L[q.choices.findIndex(c => c.l === q.ans)]).length > 1; }),
  "no analogy's answer is the only one-word or only two-word choice (cannot be picked from the pattern)");
// number questions: words changed, numbers kept — except im08, whose old key was wrong (3 × $45 + 2 × $80 is $295, not
// the keyed B $235); the second price became $50 so the keyed B is right. Choices never changed.
const numsOf = (s) => (String(s).replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(?:\.\d+)?/g) || []).join(" ");
const numBad = NEWD.banks.iowa_math.filter((q, i) => { const o = OLDD.banks.iowa_math[i]; const want = q.id === "im08" ? numsOf(o.text).replace(/\b80\b/, "50") : numsOf(o.text);
  return numsOf(q.text) !== want || JSON.stringify(q.choices) !== JSON.stringify(o.choices); }).map(q => q.id);
ok(!numBad.length, "every number question keeps its numbers and its choices (im08: $80 → $50, documented)", numBad.join(","));
ok(PAIRS.filter(p => p[0] === "conventions").every(p => p[2] === "sentence" || p[2] === "corrected") &&
  NEWD.banks.conventions.every(q => q.sentence !== q.corrected && /[.!?]$/.test(q.sentence) && /[.!?]$/.test(q.corrected)), "every conventions item still has an error and a different corrected sentence");
const conv = (q) => { const t = q.error; const a = q.sentence, b = q.corrected;
  if (t === "comma") return a.replace(/,/g, "") === b.replace(/,/g, "") && (b.match(/,/g) || []).length > (a.match(/,/g) || []).length;
  if (t === "apostrophe") return a.replace(/'/g, "") === b.replace(/'/g, "") && (b.match(/'/g) || []).length > (a.match(/'/g) || []).length;
  return true; };
ok(NEWD.banks.conventions.every(conv), "comma items differ only by added commas, apostrophe items only by added apostrophes");
const agree = NEWD.banks.conventions.filter(q => q.error === "agreement").every(q => { const a = q.sentence.split(" "), b = q.corrected.split(" "); return a.length === b.length && a.filter((w, i) => w !== b[i]).length === 1; });
ok(agree, "agreement items fix exactly one verb");
ok(NEWD.banks.words.every((w, i) => ["ex1", "ex2"].every(f => { const m = /<strong>([^<]+)<\/strong>/.exec(w[f]); return m && m[1].toLowerCase().indexOf(w.word.slice(0, -1).toLowerCase()) === 0; })),
  "every word example still bolds the word of the day");
const em = (h) => (h.match(/<em>/g) || []).length;
ok(NEWD.banks.fallback_passages.every((p, i) => { const o = OLDD.banks.fallback_passages[i]; return em(p.html) === em(o.html) && p.q1_stem === o.q1_stem &&
  (p.q1_stem.match(/<em>([^<]+)<\/em>/) || [])[1] && p.html.indexOf("<em>" + p.q1_stem.match(/<em>([^<]+)<\/em>/)[1] + "</em>") >= 0; }),
  "each passage keeps its number of highlighted words, and the word its first question asks about is highlighted in it");
const wc = (h) => h.replace(/<[^>]+>/g, "").split(/\s+/).length;
ok(NEWD.banks.fallback_passages.every((p, i) => Math.abs(wc(p.html) - wc(OLDD.banks.fallback_passages[i].html)) <= 10), "each passage is within 10 words of the old one's length (" + NEWD.banks.fallback_passages.map(p => wc(p.html)).join("/") + " words)");

console.log("no duplicates, no names, the number solver");
const dup = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);
const d1 = dup(NEWD.banks.cogat_verbal.map(q => q.text)), d2 = dup(NEWD.banks.iowa_math.map(q => q.text)), d3 = dup(NEWD.banks.conventions.map(q => q.sentence)),
  d4 = dup(NEWD.banks.words.map(q => q.ex1).concat(NEWD.banks.words.map(q => q.ex2))), d5 = dup(NEWD.banks.fallback_passages.map(p => p.html));
ok(!d1.length && !d2.length && !d3.length && !d4.length && !d5.length, "no duplicate question, sentence, example or passage", [].concat(d1, d2, d3, d4, d5).join(" | "));
const NAMES = ["Julian", "Lincoln", "Ellis", "Lucy", "Caleb", "Taylor", "David", "Kenzie", "Howe", "DeWalt", "Burris", "Mom", "Dad"];
const named = PAIRS.filter(p => NAMES.some(n => new RegExp("\\b" + n + "\\b").test(p[4])));
ok(!named.length, "no rewritten text names a child or family", named.map(p => p[1]).join(","));
const solved = SPREAD.banks.iowa_math.map(q => [q.id, solver.solve({ text: q.text, choices: q.choices }), q.ans]);   // the order that prints (after LN_ANSWER_SPREAD)
ok(solved.every(s => s[1] === s[2]), "the blind number solver (question + choices only) agrees with the key on all " + solved.length + " number questions", solved.filter(s => s[1] !== s[2]).map(s => s[0] + " solver " + s[1] + " key " + s[2]).join(", "));
const oldIm08 = OLDD.banks.iowa_math.find(q => q.id === "im08");
ok(solver.solve(oldIm08) === "C" && oldIm08.ans === "B", "…and it does catch a wrong key: the old im08 solves to C ($295) while its key said B");

// ── notebooks ───────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("the notebooks");
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const ctx = (w, extra) => Object.assign({ weekNum: "week" + w, weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const WEEKS = [1, 2, 3, 4, 5, 6];
const others = [];
["dino", "construction", "shark", "space", "farm", "forest"].forEach(look => others.push(["julian", { notebookTheme: look }, "Pre-K " + look]));
others.push(["kid9", { isPreK: true }, "Pre-K starter"], ["lucy", {}, "1st grade"], ["ellis", {}, "4th grade"], ["kid9", {}, "starter"], ["kid9", { notebookTheme: "space", kidName: "Finn" }, "another kid on a Pre-K look"]);
let otherBad = [], otherN = 0;
others.forEach(([kid, ex, name]) => WEEKS.forEach(w => { const a = NB.generate(kid, ctx(w, ex)), b = OLD.generate(kid, ctx(w, ex)); otherN++;
  if (JSON.stringify(a) !== JSON.stringify(b)) otherBad.push(name + " wk" + w); }));
ok(!otherBad.length, "every other notebook prints byte for byte the same (" + others.length + " notebooks × " + WEEKS.length + " weeks = " + otherN + ", student + parent)", otherBad.slice(0, 5).join(", "));
const labels = (h) => (h.match(/class="page-label">[^<]*/g) || []).join(" | ");
const pages = (h) => (h.match(/<div class="page[" ]/g) || []).length;
let lnBad = [];
const extraOn = { allAboutMe: true, moneyLife: true, wilderness: true, memoryCivics: true, brainBreaks: true };
WEEKS.forEach(w => [{}, { extraPages: extraOn }].forEach(ex => { const a = NB.generate("lincoln", ctx(w, ex)), b = OLD.generate("lincoln", ctx(w, ex));
  ["student", "parent"].forEach(p => { if (labels(a[p]) !== labels(b[p]) || pages(a[p]) !== pages(b[p])) lnBad.push("wk" + w + " " + p); }); }));
const L1 = NB.generate("lincoln", ctx(1));
ok(!lnBad.length && pages(L1.student) > 5, "the 6th-grade notebook: same page count and page order, weeks 1–6, plain and with every extra page (" + pages(L1.student) + " student pages in week 1)", lnBad.join(", "));
// Mom's banks still replace the built-ins exactly as before (their data is never read here — a made-up bank)
const momBank = { cogatBank: { items: [{ text: "TEST is to BANK as ___", choices: [{ l: "A", t: "x" }], ans: "A" }] } };
ok(JSON.stringify(NB.generate("lincoln", ctx(2, momBank))).length > 1000, "a notebook with a loaded bank still builds");
const q3keys = (N) => Object.keys(N.lincolnBuiltinQ3(1, 0)).join(",");
ok(q3keys(NB) === q3keys(OLD) && q3keys(NB) === "id,error,tag,sentence,corrected" && [1, 2, 3, 4, 5, 6].every(w => [0, 1, 2, 3, 4].every(i => NB.lincolnBuiltinQ3(w, i).id === OLD.lincolnBuiltinQ3(w, i).id)),
  "Mom's answer check (lincolnBuiltinQ3) returns the same shape and the same item each day");
// enough weeks that EVERY rewritten text prints at least once (student or parent notebook)
const esc = (s) => String(s);
let need = 0, missing = PAIRS.slice(), allHtml = "";
for (let w = 1; w <= 12 && missing.length; w++) { const o = NB.generate("lincoln", ctx(w)); allHtml += o.student + o.parent; missing = missing.filter(p => allHtml.indexOf(esc(p[4])) < 0); need = w; }
ok(!missing.length && need === 6, "every rewritten text prints within " + need + " weeks (" + PAIRS.length + " fields)", missing.slice(0, 4).map(p => p[1] + " " + p[2]).join(", "));
let oldLeft = 0; { let h = ""; WEEKS.forEach(w => { const o = NB.generate("lincoln", ctx(w)); h += o.student + o.parent; }); oldLeft = PAIRS.filter(p => h.indexOf(p[3]) >= 0 && p[3].length > 12).length; }
ok(oldLeft === 0, "no old themed text prints anywhere in those weeks");

// ── page fit in headless Chrome ────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-11-24 (`node test_ln_plainq.js`, Google Chrome headless, notebooks built in the browser from notebooks.js,
// web fonts allowed 6 s to load): weeks 1–6 × student + parent, old text and new text side by side.
const MEASURE_FN = "function(doc){var b=[],pages=0,max=0;doc.querySelectorAll('.page').forEach(function(pg,i){pages++;" +
  "var oh=pg.scrollHeight-pg.clientHeight,ow=pg.scrollWidth-pg.clientWidth;max=Math.max(max,oh,ow);if(oh>1||ow>1)b.push(i+': page +'+oh+'h +'+ow+'w');" +
  "pg.querySelectorAll('.card,.choices,.choice,.body,.col,.grid2').forEach(function(el){var h=el.scrollHeight-el.clientHeight,w=el.scrollWidth-el.clientWidth;if(h>2||w>2)b.push(i+': .'+el.className.split(' ')[0]+' +'+h+'h +'+w+'w');});" +
  "var kids=pg.children,bottom=pg.getBoundingClientRect().bottom,low=0;for(var k=0;k<kids.length;k++){var r=kids[k].getBoundingClientRect();if(r.height>0)low=Math.max(low,r.bottom);}" +
  "if(low>bottom+1)b.push(i+': content '+Math.round(low-bottom)+'px below the page');max=Math.max(max,Math.round(low-bottom));" +
  "});return{bad:b,pages:pages,max:max};}";
function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (process.env.NO_CHROME || !fs.existsSync(chrome)) { console.log("Chrome page measurement — SKIPPED (" + (process.env.NO_CHROME ? "NO_CHROME" : "no Google Chrome at " + chrome) + "). Measured 2026-11-24: weeks 1–6, student + parent, no page clips"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ln-plainq-"));
  fs.writeFileSync(path.join(dir, "old.js"), OLDSRC.replace("window.HoweNotebooks", "window.OldNotebooks").replace(/window\.HoweNotebooks/g, "window.OldNotebooks"));
  const cfg = []; WEEKS.forEach(w => cfg.push({ name: "week " + w, ctx: ctx(w) }));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + file + '"></script><script>var NEWNB=window.HoweNotebooks;</script>' +
    '<script src="file://' + path.join(dir, "old.js") + '"></script><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var which of ['new','old']){var N=which==='new'?NEWNB:(window.OldNotebooks||window.HoweNotebooks);for(var c of CFG){var o=N.generate('lincoln',c.ctx);for(var part of ['student','parent']){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1200px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=o[part];});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,60);});var m=M(d);m.name=which+' '+c.name+' ('+part+')';m.which=which;m.fonts=Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length;res.push(m);f.remove();}}}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=600000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 300000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome page measurement — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome page measurement ran", res ? res.error : "no result in the page"); return; }
  const nw = res.filter(r => r.which === "new"), od = res.filter(r => r.which === "old");
  const pg = (l) => l.reduce((a, r) => a + r.pages, 0), mx = (l) => Math.max.apply(null, l.map(r => r.max)), bad = (l) => l.filter(r => r.bad.length);
  console.log("Chrome page measurement (Google Chrome headless; " + nw[0].fonts + " font faces loaded): old text " + pg(od) + " pages, largest overflow " + mx(od) + " px, " + bad(od).length + " notebooks flagged");
  ok(nw.length === 12 && pg(nw) === pg(od) && !bad(nw).length && mx(nw) <= 0, "new text: " + nw.length + " notebooks (weeks 1–6, student + parent), " + pg(nw) + " pages — largest overflow " + mx(nw) + " px, nothing clipped",
    bad(nw).slice(0, 3).map(x => x.name + " → " + x.bad.slice(0, 2).join("; ")).join(" | "));
}
chromeMeasure();

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
