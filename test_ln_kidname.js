// LN_KIDNAME — five built-in number questions in the 6th-grade notebook print the name of the kid whose notebook it is,
// not a fixed "Lincoln" (Mom 2026-11-25: "Use the kid's name"). Run: node test_ln_kidname.js   (NO_CHROME=1 skips the page fit)
//   • the block: one LN_KIDNAME block + one call line; LINCOLN_DATA's line is byte-identical to the line before this change
//   • im02 im07 im09 im13 im16: the given name prints (escaped), "Lincoln" never does for another kid; no he / his / him;
//     the same numbers in the same order; the choices, answer letters, tags and everything else on every page unchanged
//   • the baseline is THIS tree with the block and the call line cut out: every other notebook byte for byte the same,
//     the parent notebook the same, Mom's own number bank untouched
//   • page fit in headless Google Chrome: weeks 1–4 (all five questions print) × Lincoln / "Bo" / "Maximiliana Rose" —
//     no page that fit before overflows now
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const load = (code) => { const w = {}; new Function("window", "document", code)(w, undefined); return w.HoweNotebooks; };

// ── the block, and this tree without it ──────────────────────────────────────────────────────────────────────────────
const S0 = "  // LN_KIDNAME_START", E0 = "  // LN_KIDNAME_END\n";
const A = src.indexOf(S0), B = src.indexOf(E0);
const CALL = "      q2 = lnKidNameQ(q2, ctx, cfg);   // LN_KIDNAME: the kid's own name in five built-in number questions\n";
ok(A > 0 && B > A && src.indexOf(S0, A + 5) < 0 && src.indexOf(E0, B + 5) < 0 && src.split(CALL).length === 2,
  "one LN_KIDNAME block and one call line");
const OLDSRC = src.slice(0, A) + src.slice(B + E0.length).replace(CALL, "");
ok(OLDSRC.indexOf("LN_KIDNAME") < 0 && OLDSRC.indexOf("lnKidNameQ") < 0 && src.length - OLDSRC.length === (B + E0.length - A) + CALL.length,
  "cutting the block and the call line out leaves no trace (" + (src.length - OLDSRC.length) + " bytes added)");
const NB = load(src), OLD = load(OLDSRC);

// LINCOLN_DATA's one line: not edited (another branch reorders choices on it; sha of the line as origin/main c7cb6191 has it)
const PRE = "  var LINCOLN_DATA = ", li = src.indexOf("\n" + PRE) + 1, line = src.slice(li, src.indexOf("\n", li));
ok(sha(line) === "84ee4ab55cd809b13a5102e9f32894164c444577ec1d8d0537ecfcb5c94dae01", "the LINCOLN_DATA line is byte-identical (sha256 " + sha(line).slice(0, 12) + "…)");
const D = new Function(line + "\nreturn LINCOLN_DATA;")();
const IDS = ["im02", "im07", "im09", "im13", "im16"];
const item = (id) => D.banks.iowa_math.find(q => q.id === id);
const TXT = new Function(src.slice(A, B) + "\nreturn LN_KIDNAME_TEXT;")();
ok(Object.keys(TXT).join(",") === IDS.join(","), "the five replacement texts, keyed by id: " + Object.keys(TXT).join(" "));
ok(IDS.every(id => item(id) && /\bLincoln\b/.test(item(id).text)), "each of the five data texts names Lincoln (what is being replaced)");
ok(!D.banks.iowa_math.some(q => IDS.indexOf(q.id) < 0 && /Lincoln/.test(JSON.stringify(q))) &&
  !["cogat_verbal", "conventions", "words", "fallback_passages"].some(b => /Lincoln/.test(JSON.stringify(D.banks[b]))),
  "no other built-in question names Lincoln");
const nums = (s) => (String(s).match(/\d+(?::\d+)?(?:\/\d+)?/g) || []).join(" ");
ok(IDS.every(id => nums(TXT[id]) === nums(item(id).text)), "same numbers in the same order as the data text",
  IDS.filter(id => nums(TXT[id]) !== nums(item(id).text)).map(id => id + ": " + nums(TXT[id]) + " vs " + nums(item(id).text)).join("; "));
ok(IDS.every(id => !/\b(he|his|him|she|her|hers|they|their|them)\b/i.test(TXT[id])), "no pronoun in the five texts");
ok(IDS.every(id => TXT[id].indexOf("{name}") === 0 && !/Lincoln/.test(TXT[id])), "each text starts with {name} and names nobody");
// reading level: the new text is no harder — sentences no longer on average than the old one's (words / sentence)
const wps = (s) => { const w = s.replace(/\{name\}/g, "Lincoln").split(/\s+/).filter(Boolean).length, n = (s.match(/[.?!](\s|$)/g) || []).length || 1; return w / n; };
ok(IDS.every(id => wps(TXT[id]) <= wps(item(id).text) + 2.5), "sentences stay about as short as before (words per sentence " +
  IDS.map(id => id + " " + wps(item(id).text).toFixed(1) + "→" + wps(TXT[id]).toFixed(1)).join(", ") + ")");

// ── the printed notebook ─────────────────────────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const ctx = (w, extra) => Object.assign({ weekNum: "week" + w, weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const WEEKS = [1, 2, 3, 4, 5, 6];
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const fill = (id, nm) => TXT[id].split("{name}").join(esc(nm));
// where each prints: lnPick = ((week-1)*5 + day) % 28
const WHERE = {}; IDS.forEach(id => { const k = D.banks.iowa_math.indexOf(item(id)); WHERE[id] = { w: Math.floor(k / 5) + 1, d: k % 5 }; });
ok(JSON.stringify(WHERE) === '{"im02":{"w":1,"d":1},"im07":{"w":2,"d":1},"im09":{"w":2,"d":3},"im13":{"w":3,"d":2},"im16":{"w":4,"d":0}}',
  "the five print in weeks 1–4: " + IDS.map(id => id + " wk" + WHERE[id].w).join(", "));
const NAMES = [[undefined, "Lincoln", "no name passed"], ["Lincoln", "Lincoln", "Lincoln"], ["Bo", "Bo", "Bo"], ["Maximiliana Rose", "Maximiliana Rose", "a long name"],
  [" Ana-Sofía ", "Ana-Sofía", "a name with spaces round it"], ["A&B <x>", "A&B <x>", "a name with & and <"]];
let bad = [], otherNames = [], mismatch = [];
NAMES.forEach(([given, nm, label]) => WEEKS.forEach(w => {
  const ex = given === undefined ? {} : { kidName: given };
  const a = NB.generate("lincoln", ctx(w, ex)), b = OLD.generate("lincoln", ctx(w, ex));
  IDS.forEach(id => { if (WHERE[id].w !== w) return; const t = fill(id, nm);
    if (a.student.indexOf(t) < 0) bad.push(label + " " + id);
    if (t !== item(id).text && a.student.indexOf(item(id).text) >= 0) bad.push(label + " " + id + " (old text left)"); });
  // swap the five texts back → the old notebook, byte for byte (so choices, answers, tags, order, layout are the same)
  let back = a.student; IDS.forEach(id => { back = back.split(fill(id, nm)).join(item(id).text); });
  if (back !== b.student || a.parent !== b.parent) mismatch.push(label + " wk" + w);
  if (nm !== "Lincoln") { const L = (a.student.match(/class="q-text"[^>]*>[^<]*Lincoln/g) || []).length; if (L) otherNames.push(label + " wk" + w); }
}));
ok(!bad.length, "each of the five prints the kid's name (" + NAMES.map(n => n[2]).join(", ") + "), weeks 1–6", bad.slice(0, 6).join(", "));
ok(!mismatch.length, "with the five texts swapped back the student notebook is the old one byte for byte; the parent notebook is unchanged", mismatch.slice(0, 6).join(", "));
ok(!otherNames.length, "\"Lincoln\" never prints in a question for a kid with another name", otherNames.join(", "));
{ const a = NB.generate("lincoln", ctx(1, { nbKidName: "Lincoln", kidName: "" })).student; ok(a.indexOf(fill("im02", "Lincoln")) >= 0, "no Family name → the app's id-name"); }
{ const a = NB.generate("lincoln", ctx(1, { kidName: "A&B <x>" })).student; ok(a.indexOf("A&amp;B &lt;x>") >= 0 && a.indexOf("A&B <x>") < 0, "the name is escaped as every printed name is"); }
// for the kid named Lincoln the only difference is the wording
{ const a = NB.generate("lincoln", ctx(2)).student, b = OLD.generate("lincoln", ctx(2)).student;
  ok(a !== b && a.indexOf(fill("im07", "Lincoln")) >= 0 && a.length - b.length === fill("im07", "Lincoln").length + fill("im09", "Lincoln").length - item("im07").text.length - item("im09").text.length,
    "Lincoln's own week 2: only the two texts differ"); }
// Mom's own number bank (a made-up one — her data is never read here) passes through untouched
const qb = { quantBank: { items: [{ type: "NS", text: "Lincoln  2  4  ?", c: ["6", "7", "8"], ans: "A" }, { type: "NS", text: "1  3  5  ?", c: ["7", "8"], ans: "A" }] } };
ok(JSON.stringify(NB.generate("lincoln", ctx(1, Object.assign({ kidName: "Bo" }, qb)))) === JSON.stringify(OLD.generate("lincoln", ctx(1, Object.assign({ kidName: "Bo" }, qb)))),
  "with Mom's number bank loaded, the notebook is unchanged");
// every other notebook: byte for byte the same
const others = [["lucy", {}, "1st grade"], ["ellis", {}, "4th grade"], ["julian", {}, "Pre-K"], ["caleb", {}, "Pre-K (Caleb)"], ["kid9", {}, "starter"],
  ["kid9", { isPreK: true }, "Pre-K starter"], ["kid9", { notebookTheme: "space", kidName: "Finn" }, "another kid on a Pre-K look"], ["ellis", { kidName: "Bo" }, "4th grade, another name"]];
let otherBad = [], otherN = 0;
others.forEach(([kid, ex, name]) => WEEKS.forEach(w => { otherN++; if (JSON.stringify(NB.generate(kid, ctx(w, ex))) !== JSON.stringify(OLD.generate(kid, ctx(w, ex)))) otherBad.push(name + " wk" + w); }));
ok(!otherBad.length, "every other notebook prints byte for byte the same (" + others.length + " × " + WEEKS.length + " weeks = " + otherN + ")", otherBad.slice(0, 5).join(", "));

// ── page fit in headless Chrome ──────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-11-25 (Google Chrome headless, web fonts allowed 6 s): see the numbers this prints.
const MEASURE_FN = "function(doc){var b=[],pages=0,max=-1e9,spare=[],gold=[];doc.querySelectorAll('.page').forEach(function(pg,i){pages++;" +
  "var oh=pg.scrollHeight-pg.clientHeight,ow=pg.scrollWidth-pg.clientWidth;if(oh>1||ow>1)b.push(i+': page +'+oh+'h +'+ow+'w');" +
  "pg.querySelectorAll('.card,.choices,.choice,.body,.col,.grid2,.q-text').forEach(function(el){var h=el.scrollHeight-el.clientHeight,w=el.scrollWidth-el.clientWidth;if(h>2||w>2)b.push(i+': .'+el.className.split(' ')[0]+' +'+h+'h +'+w+'w');});" +
  "var kids=pg.children,bottom=pg.getBoundingClientRect().bottom,low=0;for(var k=0;k<kids.length;k++){var r=kids[k].getBoundingClientRect();if(r.height>0)low=Math.max(low,r.bottom);}" +
  "pg.querySelectorAll('.card-gold').forEach(function(el){if(el.querySelector('.q-text'))gold.push(Math.round(el.getBoundingClientRect().height));});var over=Math.round(low-bottom);if(over>1)b.push(i+': content '+over+'px below the page');max=Math.max(max,over,oh,ow);spare.push(-over);" +
  "});return{bad:b,pages:pages,max:max,spare:spare,gold:gold};}";
function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (process.env.NO_CHROME || !fs.existsSync(chrome)) { console.log("Chrome page measurement — SKIPPED (" + (process.env.NO_CHROME ? "NO_CHROME" : "no Google Chrome at " + chrome) + ")"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ln-kidname-"));
  fs.writeFileSync(path.join(dir, "new.js"), src);
  fs.writeFileSync(path.join(dir, "old.js"), OLDSRC.replace(/window\.HoweNotebooks/g, "window.OldNotebooks"));
  const cfg = []; [["", "Lincoln"], ["Bo", "Bo"], ["Maximiliana Rose", "Maximiliana Rose"]].forEach(([k, label]) => [1, 2, 3, 4].forEach(w => cfg.push({ name: label + " wk" + w, ctx: ctx(w, k ? { kidName: k } : {}) })));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + path.join(dir, "new.js") + '"></script><script>var NEWNB=window.HoweNotebooks;</script>' +
    '<script src="file://' + path.join(dir, "old.js") + '"></script><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var which of ['new','old']){var N=which==='new'?NEWNB:window.OldNotebooks;for(var c of CFG){var o=N.generate('lincoln',c.ctx);for(var part of ['student']){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1200px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=o[part];});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,60);});var m=M(d);m.name=c.name;m.which=which;m.fonts=Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length;res.push(m);f.remove();}}}" +
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
  let worse = [], grow = {};
  nw.forEach((r, k) => { const o = od[k]; if (r.pages !== o.pages) worse.push(r.name + " pages " + o.pages + "→" + r.pages);
    const nm = r.name.replace(/ wk\d$/, ""); r.gold.forEach((h, i) => { grow[nm] = Math.max(grow[nm] || 0, h - (o.gold[i] || h)); });
    r.spare.forEach((s, i) => { if (s < -1 && o.spare[i] >= -1) worse.push(r.name + " page " + i + " overflows " + (-s) + "px"); }); });
  const flagged = (l) => l.filter(r => r.bad.length).map(r => r.name + ": " + r.bad.slice(0, 2).join("; "));
  console.log("Chrome page measurement (" + nw[0].fonts + " font faces loaded): before " + od.reduce((a, r) => a + r.pages, 0) + " pages, largest overflow " + Math.max.apply(null, od.map(r => r.max)) +
    " px; after " + nw.reduce((a, r) => a + r.pages, 0) + " pages, largest overflow " + Math.max.apply(null, nw.map(r => r.max)) + " px; the number-question card grows at most " + Object.keys(grow).map(k => k + " +" + grow[k] + "px").join(", ") +
    (flagged(od).length ? "; flagged before: " + flagged(od).slice(0, 3).join(" | ") : ""));
  ok(nw.length === 12 && !worse.length && flagged(nw).length <= flagged(od).length, "page fit: weeks 1–4 × Lincoln / Bo / Maximiliana Rose — no page that fit before overflows",
    worse.concat(flagged(nw)).slice(0, 4).join(" | "));
}
chromeMeasure();

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
