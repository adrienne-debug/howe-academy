// 🔊 NBLADTAB_SAY — tap to hear a number question on the tablet (notebook ladders, tablet slice; her words 2026-11-24: a 1st-grade
// number-line question is read aloud "Only when tapped"). Run: node test_nb_ladtab_say.js
//  (a) the blocks: one in each file, one marked call site each; no kid names, no 🔀; nothing written; the voice is the drills'
//      mastSpeak, called only from the tap
//  (b) paper: Print / Look / PDF (no tablet flag) byte for byte = this tree without the change, every notebook; no 🔊 and no
//      spoken words on paper or in the parent guide; the tablet copy differs only by the words on its question blocks; a Pre-K / K
//      notebook (with a grown-up) is left as it was
//  (c) the words, every question of every level: the question as printed + its spoken line — never a choice the page doesn't
//      already show, never the answer, never the rule; a grown-up's "Read aloud" question gets none
//  (d) the viewer, in a sandbox: one 🔊 per marked question on the page on screen, none elsewhere; a tap says exactly that
//      question's words once; nothing speaks untapped (opening, page turns, repaints)
//  (e) Google Chrome headless: on the real page every 🔊 sits in the empty margin beside its number and nothing on the page moves
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const IX = rd("index.html"), NBS = rd("notebooks.js"), NUM = JSON.parse(rd("ladders/number_thinking.json"));
let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const KIDNAMES = /\b(lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew|adrienne|howe|dewalt|burris)\b/i;
const clone = (o) => JSON.parse(JSON.stringify(o));
const uncomment = (s) => s.replace(/\/\/[^\n]*/g, "");

// ═════════════ (a) the blocks ═════════════
console.log("(a) the blocks");
const nb0 = NBS.indexOf("  // NBLADTAB_SAY_START"), nb1 = NBS.indexOf("  // NBLADTAB_SAY_END\n");
const nbBlk = NBS.slice(nb0, nb1);
ok(nb0 === NBS.indexOf("  // NBLADNUM_END\n") + "  // NBLADNUM_END\n".length && nb1 > nb0 && NBS.split("NBLADTAB_SAY_START").length === 2, "notebooks.js: one NBLADTAB_SAY block, right after the number pages' block");
const tb = IX.indexOf("// NBTABLET_START"), te = IX.indexOf("// NBTABLET_END");
const ix0 = IX.indexOf("// NBLADTAB_SAY_START"), ix1 = IX.indexOf("// NBLADTAB_SAY_END");
const blk = IX.slice(ix0, ix1), code = uncomment(blk);
ok(ix0 === IX.indexOf("// NBLADTAB_WF_END\n") + "// NBLADTAB_WF_END\n".length && ix1 > ix0 && ix1 < te && IX.split("NBLADTAB_SAY_START").length === 2, "index.html: one NBLADTAB_SAY block, after the write-first one, inside NBTABLET");
try { new Function(IX.slice(tb, te)); ok(true, "NBTABLET parses"); } catch (e) { ok(false, "NBTABLET parses: " + e.message); }
ok(!KIDNAMES.test(blk) && !KIDNAMES.test(uncomment(nbBlk)) && IX.indexOf("\u{1F500}") < 0, "no kid or family names; no 🔀");
ok(!/db\.|\.set\(|\.update\(|\.transaction\(|HA_LS|localStorage/.test(code) && !/db\.|document\.|window\./.test(uncomment(nbBlk)), "nothing written anywhere (no database, no device storage); the notebooks.js part has no DOM or database");
ok((code.match(/mastSpeak\(/g) || []).length === 1 && /function nbtSayIt\(i\)\{[^\n]*mastSpeak\(t\)/.test(code), "the voice is the drills' own mastSpeak — one call, inside the tap handler only");
ok(!/function mastSpeak|speechSynthesis|SpeechSynthesisUtterance|new Audio/.test(code), "no new voice code");
ok((code.match(/nbtSayIt\(/g) || []).length === 2 && code.indexOf('onclick="event.stopPropagation();nbtSayIt(\'+i+\')"') > 0, "nbtSayIt is reached only from a 🔊 button's tap");
const ixSites = (IX.slice(0, ix0) + IX.slice(ix1)).split("\n").filter((l) => /NBLADTAB_SAY/.test(l) && l.indexOf("// NBLADTAB_SAY_") < 0);   // outside the block
ok(ixSites.length === 1 && ixSites[0] === "  nbtSayTick(v);   // 🔊 NBLADTAB_SAY: a 🔊 beside each number question the child can tap to hear" &&
  IX.indexOf("  nbtTodayRender();   // NBT_TODAY: the list follows every bar repaint (page, day, ink)\n" + ixSites[0] + "\n") > 0, "index.html: one marked call site — the 🔊 buttons follow every bar repaint");
const nbSites = (NBS.slice(0, nb0) + NBS.slice(nb1)).split("\n").filter((l) => /NBLADTAB_SAY/.test(l) && l.indexOf("// NBLADTAB_SAY_") < 0);
ok(nbSites.length === 1 && nbSites[0].indexOf('if (lnum) parts.push(nbTag(ctx, nbSayTag(ctx, lntLuPage(wn, weekDates, lnum), lnum), "week", "Number thinking"));') === 4 && /\/\/ NBLADNUM: /.test(nbSites[0]),
  "notebooks.js: one marked call site — the 1st-grade notebook's Number Thinking page only (still the number pages' own marked line)");
ok(/function nbSayTag\(ctx, html, w\) \{\s*if \(!ctx \|\| !ctx\.nbPageTags \|\|/.test(nbBlk), "the words are added only to the tablet copy (ctx.nbPageTags — Print, Look and the PDF never set it)");
ok(IX.split("nbPageTags").length === 2, "…and only the tablet send sets that flag");

// ═════════════ load the library: now, and the tree without this change ═════════════
const HOOK = "_internal: {";
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const NB = load(NBS.replace(HOOK, HOOK + " nbSayText: nbSayText, nbSayLine: nbSayLine, lntQ: lntQ,")), I = NB._internal, L = NB.ladders;
// the baseline: the block swapped for a do-nothing nbSayTag (= the call site's wrapper removed) — no git, no pinned commit
const BASE = NBS.slice(0, nb0) + "  function nbSayTag(ctx, html) { return html; }\n" + NBS.slice(nb1 + "  // NBLADTAB_SAY_END\n".length);
const OLD = load(BASE);
ok(!!NB && !!OLD, "the library loads, with and without the change");
const TN = L.track("number", NUM);
const K1 = Object.keys(NB.GENERATORS).filter((k) => NB.GENERATORS[k].build === I.generateLucy)[0];
const KPK = Object.keys(NB.GENERATORS).filter((k) => NB.GENERATORS[k].prek);
ok(!!K1 && KPK.length > 0 && NB.ladderPages(K1).number === true, "the 1st-grade notebook and the Pre-K / K notebooks print number pages");
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Math Book — p. 12", "📖 Closing Notebook — Closing Notebook"];
const mkCtx = (kid, extra) => Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates: DATES, tasks: Object.keys(DATES).flatMap((d) => T5.map((t) => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {} }, extra || {});
const nl = (st, wk) => { st = Object.assign({ on: true, lv: "g1", opt: false, cur: null }, st || {}); return { number: Object.assign({}, st, { lvFrom: "saved", ready: true, next: L.next(TN, st, wk || 12, 5) }) }; };
const PKX = (lv, th) => ({ notebookTheme: th || "dino", nbGrade: lv === "k" ? "K" : "Pre-K", kidName: "Sam" });
const strip = (h) => h.replace(/ data-nb-say="[^"]*"/g, "");
const both = (o) => JSON.stringify(o);

// ═════════════ (b) paper ═════════════
console.log("(b) paper, Look and the PDF are untouched");
const LEVELS1 = ["prek", "k", "g1", "g2", "g3"];
const cases = [];
LEVELS1.forEach((lv) => cases.push([K1 + " at " + lv, K1, { ladders: nl({ lv }) }]));
cases.push([K1 + " at g1, harder stage", K1, { ladders: nl({ lv: "g1", opt: true }) }], [K1 + ", number ladder off", K1, {}]);
KPK.forEach((k) => cases.push([k + " (Pre-K / K) at prek", k, { ladders: nl({ lv: "prek" }) }], [k + " at k", k, { ladders: nl({ lv: "k" }) }]));
cases.push(["a Pre-K look at K", "kidt", Object.assign(PKX("k", "space"), { ladders: nl({ lv: "k" }) })]);
Object.keys(NB.GENERATORS).filter((k) => k !== K1 && KPK.indexOf(k) < 0).forEach((k) => cases.push([k + " (no number page)", k, {}]));
let paperSame = [], tabSame = [], tabHas = [];
cases.forEach(([name, kid, extra]) => {
  const p = NB.generate(kid, mkCtx(kid, clone(extra))), p0 = OLD.generate(kid, mkCtx(kid, clone(extra)));
  if (both(p) !== both(p0) || /data-nb-say|🔊/.test(p.student) || /data-nb-say/.test(p.parent)) paperSame.push(name);
  const t = NB.generate(kid, mkCtx(kid, Object.assign(clone(extra), { nbPageTags: true }))), t0 = OLD.generate(kid, mkCtx(kid, Object.assign(clone(extra), { nbPageTags: true })));
  if (strip(t.student) !== t0.student || t.parent !== t0.parent || JSON.stringify(Object.assign({}, t, { student: "", parent: "" })) !== JSON.stringify(Object.assign({}, t0, { student: "", parent: "" })) || /data-nb-say/.test(t.parent)) tabSame.push(name);
  tabHas.push([name, (t.student.match(/data-nb-say=/g) || []).length]);
});
ok(!paperSame.length, "every notebook (" + cases.length + " builds): paper / Look / PDF byte for byte as before — no 🔊, no spoken words, parent guide unchanged", paperSame);
ok(!tabSame.length, "the tablet copy differs only by the words on its question blocks; parent guide and cursors unchanged", tabSame);
const has = (re) => tabHas.filter(([n]) => re.test(n));
ok(has(new RegExp("^" + K1 + " at (g1|g2|g3)")).every(([, c]) => c === 5) && has(/harder stage/).every(([, c]) => c === 5), "1st-grade notebook, a level the child reads alone: all five questions carry their words", tabHas);
ok(has(new RegExp("^" + K1 + " at (prek|k)$")).every(([, c]) => c === 0), "1st-grade notebook at a Pre-K / K level (with a grown-up, \"Read aloud\" line): no 🔊 — left as it was");
ok(has(/Pre-K|Pre-K look|no number page|ladder off/).every(([, c]) => c === 0), "Pre-K / K notebooks, every look, and every other notebook: no spoken words (left as they were)");
ok(I.lntQ.toString().indexOf("data-nb-say") < 0, "the question markup itself is untouched (the words are added to the tablet copy afterwards)");

// ═════════════ (c) the words ═════════════
console.log("(c) the words — every question of every level");
const ALLOW = new Set(["plus", "minus", "equals", "goes", "to", "times", "divided", "by", "is", "less", "more", "than", "box", "negative"]);
const toks = (s) => String(s || "").toLowerCase().replace(/[−–]/g, "-").replace(/-(?=\d)/g, " ").match(/[a-z']+|\d+(?:[.,]\d+)*%?/g) || [];
const all = [];
TN.order.forEach((lv) => { if (TN.levels[lv].bank) return; TN.levels[lv].items.forEach((it, i) => all.push({ lv, label: TN.levels[lv].label, i, num: i + 1, of: TN.levels[lv].items.length, id: it.id, item: it })); });
const extra = [], ansHit = [], ruleHit = [], grownHit = [], movedHit = [], emptyHit = [], sameHit = [];
all.forEach((x) => {
  const h = I.lntQ(x, 1), q = x.item, t = I.nbSayText(q, h.slice(h.indexOf('<div class="lnt-q">') + '<div class="lnt-q">'.length));
  const grown = /^(prek|k)$/.test(x.lv);
  if (grown) { if (t) grownHit.push(x.id); return; }
  if (!t) { emptyHit.push(x.id); return; }
  const shown = new Set(toks(q.text).concat(toks(q.say)));
  toks(t).forEach((w) => { if (!shown.has(w) && !ALLOW.has(w)) extra.push(x.id + ":" + w); });
  // the answer: its words appear only where the printed question or its spoken line already has them
  const aw = String(q.c["ABCDEFGH".indexOf(q.ans)]); toks(aw).forEach((w) => { if (!shown.has(w) && toks(t).indexOf(w) >= 0) ansHit.push(x.id + ":" + w); });
  if (/\b[A-H]\b/.test(t) || (q.rule && t.indexOf(q.rule) >= 0) || /\banswer\b|\bcorrect\b|\bright\b/i.test(t.replace(q.say || "", ""))) ruleHit.push(x.id);
  if (/class="lnt-ask"/.test(h) && t !== String(q.say)) movedHit.push(x.id);
  q.c.forEach((c, k) => { const y = clone(x); y.item.ans = "ABCDEFGH"[k]; const hy = I.lntQ(y, 1); if (I.nbSayText(y.item, hy) !== t) sameHit.push(x.id); });
});
ok(all.length > 400, all.length + " questions");
ok(!grownHit.length, "a grown-up's question (Pre-K, K — its \"Read aloud\" line) gets no words", grownHit.slice(0, 5));
ok(!emptyHit.length, "every question the child reads alone has words to say", emptyHit.slice(0, 5));
ok(!extra.length, "the words are only the printed question and its spoken line (+ plus / minus / equals / goes to / box …)", extra.slice(0, 8));
ok(!ansHit.length, "never the answer's words (unless the printed question already shows them)", ansHit.slice(0, 8));
ok(!ruleHit.length, "never a letter, the rule, or an answer / correct / right word", ruleHit.slice(0, 5));
ok(!sameHit.length, "the same words whatever the right letter is (every question, every letter)", sameHit.slice(0, 5));
ok(!movedHit.length, "a picture question that shows only its spoken line (\"About how many dots? …\") says exactly that line — never the picture's plain words", movedHit.slice(0, 5));
const ex = (id) => { const x = all.find((y) => y.item.text === id); const h = I.lntQ(x, 1); return I.nbSayText(x.item, h); };
const g1 = all.filter((x) => x.lv === "g1");
const g1t = (re) => { const x = g1.find((y) => re.test(y.item.text)); const h = I.lntQ(x, 1); return [x.item, I.nbSayText(x.item, h)]; };
{ const [q, t] = g1t(/^\d+\s+\d+\s+\d+\s+\d+\s+\?$/); ok(t === q.text.trim().split(/\s+/).map((w) => (w === "?" ? "box" : w)).join(", ") + ". " + q.say, "a number line: “" + t + "”"); }
{ const [q, t] = g1t(/\+ \? =/); ok(/^\d+ plus box equals \d+\. /.test(t) && t.endsWith(q.say), "a number puzzle: “" + t + "”"); }
{ const [q, t] = g1t(/→/); ok(/^\d+ goes to \d+\. \d+ goes to \d+\. \d+ goes to box\. /.test(t) && t.endsWith(q.say), "pairs: “" + t + "”"); }
{ const x = all.find((y) => y.item.type === "NE" && !y.item.pic && y.item.say); if (x) { const t = I.nbSayText(x.item, I.lntQ(x, 1)); ok(t === x.item.say, "a question that is already a sentence is said once, by its spoken line: “" + t + "”"); } }

// ═════════════ (d) the viewer ═════════════
console.log("(d) the viewer, in a sandbox");
const fnOf = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) return ""; const a = s.lastIndexOf("\n", i) + 1; let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(a, k + 1); } return ""; };
const tab = IX.slice(tb, te);
const said = [], writes = [];
const els = {};
const G = { console, String, Math, Array, Number, JSON,
  document: { getElementById: (id) => els[id] || null, createElement: () => ({ style: { cssText: "" }, innerHTML: "", id: "", remove() { if (els[this.id] === this) delete els[this.id]; } }) },
  mastSpeak: (t, o) => said.push(t), nbtView: null,
  db: { ref: (p) => ({ set: () => writes.push(p), update: () => writes.push(p), once: () => Promise.resolve({ val: () => null }) }) } };
vm.createContext(G);
vm.runInContext(fnOf(tab, "nbtPages") + "\n" + blk.replace("const NBT_SAY_BTN=", "var NBT_SAY_BTN="), G);
const run = (s) => vm.runInContext(s, G);
// the real tablet copy of the 1st-grade notebook; its pages as small objects (the number page's blocks measure where Chrome put them)
const tcopy = NB.generate(K1, mkCtx(K1, { nbPageTags: true, ladders: nl({ lv: "g1" }) })).student;
function fakeDoc(html) {
  const re = /<div class="page[" ][^>]*>/g, at = []; let m; while ((m = re.exec(html))) at.push(m.index);
  const pages = at.map((a, k) => {
    const chunk = html.slice(a, k + 1 < at.length ? at[k + 1] : undefined), cls = new Set();
    const qs = chunk.split('<div class="lnt-q"').slice(1).map((s, qi) => {
      const say = (/^ data-nb-say="([^"]*)"/.exec(s) || [])[1];
      return { say: say == null ? null : say.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
        getAttribute: function (x) { return x === "data-nb-say" ? this.say : null; },
        getBoundingClientRect: () => ({ left: 40, top: 143 + qi * 130, width: 736, height: 110 }),
        querySelector: (s2) => (s2 === ".lnt-n" ? { textContent: String(qi + 1), getBoundingClientRect: () => ({ left: 55, top: 154 + qi * 130, width: 26, height: 26 }) } : null) };
    });
    return { chunk, classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c) },
      querySelectorAll: (s) => (s === ".lnt-q[data-nb-say]" ? qs.filter((q) => q.say != null) : []) };
  });
  return { pages, querySelectorAll: (s) => (s === ".page" ? pages : []) };
}
const doc = fakeDoc(tcopy), NP = doc.pages.findIndex((p) => /data-nb-name="Number thinking"/.test(p.chunk)) + 1;
ok(NP > 0 && doc.pages[NP - 1].querySelectorAll(".lnt-q[data-nb-say]").length === 5, "the tablet copy's Number Thinking page (page " + NP + ") has five questions with words");
els["nbt-doc"] = { contentDocument: doc };
els["nbt-hold"] = { clientWidth: 600, appendChild: (e) => { els[e.id] = e; } };
const show = (p) => { doc.pages.forEach((x, i) => (i === p - 1 ? x.classList.add("nbt-on") : x.classList.remove("nbt-on"))); run("nbtView={ready:true,page:" + p + "}; nbtSayTick(nbtView);"); };
// open on the first page, turn every page, repaint a few times: no sound
for (let p = 1; p <= doc.pages.length; p++) { show(p); run("nbtSayTick(nbtView)"); }
show(NP); run("nbtSayTick(nbtView); nbtSayTick(nbtView);");
ok(said.length === 0, "opening, turning every page and repainting: nothing speaks by itself");
const lay = els["nbt-say"], btns = lay ? lay.innerHTML.split("<button").slice(1) : [];
ok(!!lay && btns.length === 5 && btns.every((b, i) => b.indexOf("nbtSayIt(" + i + ")") > 0 && b.indexOf("🔊") > 0 && b.indexOf('aria-label="Hear question ' + (i + 1) + '"') > 0), "the Number Thinking page: one 🔊 per question, each tied to its own question");
ok(/position:absolute;inset:0;z-index:1;pointer-events:none/.test(lay.style.cssText) && btns.every((b) => /position:absolute;pointer-events:auto;/.test(b)), "the buttons sit over the page (a layer that lets the pen through everywhere else), never in it");
const pos = btns.map((b) => { const g = (k) => parseFloat((new RegExp(k + ":([\\d.]+)%").exec(b) || [])[1]); return { x: g("left") * 8.16, y: g("top") * 10.56, w: g("width") * 8.16, h: g("height") * 10.56 }; });
ok(pos.every((r, i) => r.x >= 0 && r.x + r.w <= 40 && Math.abs(r.y + r.h / 2 - (154 + i * 130 + 13)) < 1 && r.w >= 28), "each 🔊 is in the page's empty left margin, level with its question's number (" + pos.map((r) => Math.round(r.x) + "–" + Math.round(r.x + r.w) + "px").join(", ") + ")");
const words = doc.pages[NP - 1].querySelectorAll(".lnt-q[data-nb-say]").map((q) => q.say);
run("nbtSayIt(2)");
ok(said.length === 1 && said[0] === words[2], "a tap on question 3's 🔊 says exactly its words, once: “" + said[0] + "”");
run("nbtSayIt(0)"); ok(said.length === 2 && said[1] === words[0], "…and question 1's its own");
run("nbtSayIt(9)"); ok(said.length === 2, "a tap with no question behind it says nothing");
show(1); ok(!els["nbt-say"], "another page: no 🔊");
run("nbtSayIt(0)"); ok(said.length === 2, "…and nothing to say there");
show(NP); doc.pages[NP - 1].classList.remove("nbt-on"); run("nbtSayTick(nbtView)"); ok(!els["nbt-say"], "a page that isn't showing (e.g. covered) gets no 🔊");
run("nbtView={ready:false,page:" + NP + "}; nbtSayTick(nbtView);"); ok(!els["nbt-say"], "before the pages are ready: none");
// a copy sent before this change (no words on the blocks) → no 🔊
const oldDoc = fakeDoc(OLD.generate(K1, mkCtx(K1, { nbPageTags: true, ladders: nl({ lv: "g1" }) })).student); els["nbt-doc"] = { contentDocument: oldDoc };
oldDoc.pages[NP - 1].classList.add("nbt-on"); run("nbtView={ready:true,page:" + NP + "}; nbtSayTick(nbtView);");
ok(!els["nbt-say"], "a week sent before this change: no 🔊 (nothing to say), the page as it was");
ok(writes.length === 0, "nothing written");

// ═════════════ (e) Chrome ═════════════
console.log("(e) the real page — Google Chrome headless");
const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(CHROME)) console.log("  SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
else {
  const prep = IX.slice(IX.indexOf("function nbtPrepDoc(doc){"), IX.indexOf("function nbtPages(doc)"));
  let prepCss = ""; try { const i0 = prep.indexOf("st.textContent=") + "st.textContent=".length; prepCss = new Function("return " + prep.slice(i0, prep.indexOf(";\n", i0)))(); } catch (e) { prepCss = ""; }
  const probe = function (NP) {
    var ps = nbtPages(document), pg = ps[NP - 1]; pg.classList.add("nbt-on");
    var rect = function (e) { var r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
    var before = [].map.call(pg.querySelectorAll("*"), rect);
    var hold = document.createElement("div"); hold.id = "nbt-hold"; hold.style.cssText = "position:absolute;left:0;top:0;width:816px;height:1056px;z-index:5"; document.body.appendChild(hold);
    window.__doc = { contentDocument: document };
    nbtSayTick({ ready: true, page: NP });
    var after = [].map.call(pg.querySelectorAll("*"), rect);
    var btn = [].map.call(document.querySelectorAll("#nbt-say button"), rect);
    var qs = [].map.call(pg.querySelectorAll(".lnt-q"), rect), ns = [].map.call(pg.querySelectorAll(".lnt-n"), rect);
    var cover = [];   // anything on the page with its own text or picture under a button
    [].forEach.call(pg.querySelectorAll("*"), function (e) { if (e.children.length || !(e.textContent || "").trim() && e.tagName !== "svg") return; var r = e.getBoundingClientRect();
      btn.forEach(function (b) { if (r.left < b[0] + b[2] && r.right > b[0] && r.top < b[1] + b[3] && r.bottom > b[1]) cover.push(e.className + ":" + (e.textContent || "").slice(0, 20)); }); });
    return { same: JSON.stringify(before) === JSON.stringify(after), btn: btn, qs: qs, ns: ns, cover: cover, emoji: [].map.call(document.querySelectorAll("#nbt-say button"), function (b) { return b.textContent; }) };
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladtabsay-"));
  const page = tcopy.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace("</head>", "<style>" + prepCss + "</style></head>").replace("</body>",
    "<script>" + fnOf(tab, "nbtPages") + "\n" + blk.replace('document.getElementById("nbt-doc")', "window.__doc") + "\nwindow.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + probe.toString() + ")(" + NP + ")));});</script></body>");
  const f = path.join(dir, "say.html"); fs.writeFileSync(f, page);
  let r = null;
  for (let t = 0; t < 3 && !r; t++) { const o = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "p" + t), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 120000 });
    const m = /data-r="([^"]*)"/.exec(String(o.stdout || "")); if (m) r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); }
  if (!r || !prepCss) console.log("  SKIPPED (Google Chrome would not run headless here, or the viewer's page CSS wasn't found)");
  else {
    ok(r.btn.length === 5 && r.emoji.every((e) => e === "🔊"), "five 🔊 buttons on the real Number Thinking page");
    ok(r.same, "nothing on the page moved (every element's box is the same before and after)");
    ok(r.btn.every((b, i) => b[0] >= 0 && b[0] + b[2] <= r.qs[i][0] && Math.abs((b[1] + b[3] / 2) - (r.ns[i][1] + r.ns[i][3] / 2)) <= 1.5) && !r.cover.length,
      "each sits in the empty margin left of its question's card, level with its number, covering nothing (" + r.btn.map((b) => b[0] + "–" + (b[0] + b[2]) + "px").join(", ") + "; cards start at " + r.qs[0][0] + "px)", r);
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
