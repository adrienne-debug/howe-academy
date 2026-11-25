// ✍️ NBLADTAB_WF — a write-first day on the tablet: the "Read and answer — check" page (the choices) stays covered until the child
// has written on the front page (notebook ladders, tablet slice; her words 2026-11-24: "Write first some days" — paper = the
// choices on the back, tablet = the choices hidden until the child has written; "no step may count on the kid covering something
// or not peeking — the page itself hides the answer"). Run: node test_nb_ladtab_wf.js
//  (a) the block: one, inside NBTABLET after NBT_TODAY; two marked call sites; no kid names, no 🔀; writes nothing to the database
//  (b) paper: notebooks.js and the send are untouched — every generated page is the builder's own, byte for byte
//  (c) real tablet copies (4th-, 6th- and 1st-grade notebooks): every check page is paired with the front right before it
//  (d) the viewer, run in a sandbox: covered until written (every question with lines), the card's words, opens on the writing on
//      screen or the saved writing, stays open (this device, this copy), a grown-up always sees it, write-first off = as before
//  (e) Google Chrome headless: the writing areas measure on the real page, even while that page is hidden
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const IX = rd("index.html"), NBS = rd("notebooks.js"), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const KIDNAMES = /\b(lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew|adrienne|howe|dewalt|burris)\b/i;
const clone = (o) => JSON.parse(JSON.stringify(o));

// ═════════════ (a) the block ═════════════
console.log("(a) the block");
const tb = IX.indexOf("// NBTABLET_START"), te = IX.indexOf("// NBTABLET_END");
const bs = IX.indexOf("// NBLADTAB_WF_START"), be = IX.indexOf("// NBLADTAB_WF_END");
const blk = IX.slice(bs, be), code = blk.replace(/\/\/[^\n]*/g, "");
ok(bs === IX.indexOf("// NBT_TODAY_END\n") + "// NBT_TODAY_END\n".length && be > bs && be < te && IX.split("NBLADTAB_WF_START").length === 2 && IX.split("NBLADTAB_WF_END").length === 2,
  "one NBLADTAB_WF block, right after NBT_TODAY, inside NBTABLET");
try { new Function(IX.slice(tb, te)); ok(true, "NBTABLET parses"); } catch (e) { ok(false, "NBTABLET parses: " + e.message); }
ok(!KIDNAMES.test(blk) && IX.indexOf("\u{1F500}") < 0, "no kid or family names in the block; no 🔀 anywhere");
ok(!/\.(set|update|remove|transaction|push)\(/.test(code.replace(/el\.remove\(\)/g, "").replace(/classList\.remove\(/g, "")), "the block writes nothing to the database (only reads)");
ok((code.match(/db\.ref\(/g) || []).length === 1 && code.indexOf('db.ref(nbtInkPath(v.kid,v.wk,pg)).once("value")') > 0, "one read: the front page's saved writing — the same path the page's own ink load reads");
ok(/HA_LS\.setItem\(NBT_WF_LS,/.test(code) && (code.match(/HA_LS\.setItem\(/g) || []).length === 1, "what stays open is remembered on this device only (one local key)");
ok(!/notebookDocs|notebookSettings\/|\.set\(|generate\(|nbPageTags/.test(code), "no new database path; never touches the copy, the send or the builder");
ok(!/I wrote it|<input|type="checkbox"/.test(code), "no \"I wrote it\" button — the tablet's own ink decides");
const sites = IX.split("\n").filter((l) => /✍️ NBLADTAB_WF/.test(l));
ok(sites.length === 2 && sites[0].indexOf('if(i===v.page-1&&!nbtWfLocked(v,i+1)) p.classList.add("nbt-on"); else p.classList.remove("nbt-on"); });') > 0 &&
  sites[1].trim().indexOf("nbtWfTick(v);") === 0, "two marked call sites: the page turn never shows a covered page; every bar repaint ticks");
ok(/nbtWfTick\(v\);   \/\/ ✍️ NBLADTAB_WF[^\n]*\n  nbtTodayRender\(\);   \/\/ NBT_TODAY/.test(IX), "the tick rides the bar repaint (page turn, ink load, stroke lifted), before the Today list");
ok(blk.indexOf("Write your answers first, then your choices show here.") > 0, "the card says why in a few plain words");

// ═════════════ (b) paper ═════════════
console.log("(b) paper is untouched");
ok(NBS.indexOf("NBLADTAB_WF") < 0 && NBS.indexOf("nbtWf") < 0, "notebooks.js has nothing of this change → every printed, PDF and tablet page is the builder's own, byte for byte");
const send = IX.slice(IX.indexOf("async function nbtSend(kid){"), IX.indexOf("// ── the viewer ──"));
ok(send.indexOf("nbtWf") < 0 && send.indexOf("NBLADTAB") < 0 && send.indexOf('upd["notebookDocs/"+kid+"/"+wk]={student:student,parent:parent,ts:ts,pages:pages};') > 0, "the send stores the same copy as before");
const prep = IX.slice(IX.indexOf("function nbtPrepDoc(doc){"), IX.indexOf("function nbtPages(doc)"));
ok(prep.indexOf("nbtWf") < 0, "the viewer's page preparation is unchanged (the copy's HTML is never edited)");
ok(IX.slice(IX.indexOf("function haNbPdf"), IX.indexOf("function haNbPdf") + 4000).indexOf("nbtWf") < 0, "print / PDF never reach this code");

// ═════════════ build real tablet copies ═════════════
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const HOOK = "_internal: {";
const NB = load(NBS.replace(HOOK, HOOK + " generateEllis: generateEllis, generateLincoln: generateLincoln,")), I = NB._internal, L = NB.ladders;
const byBuild = (b) => Object.keys(NB.GENERATORS).filter((k) => NB.GENERATORS[k].build === b)[0];
const K4 = byBuild(I.generateEllis), K6 = byBuild(I.generateLincoln), K1 = byBuild(I.generateLucy);
const TR = L.track("reading", READ);
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Math Book — p. 12", "📖 Closing Notebook — Closing Notebook"];
const mkCtx = (kid, extra) => Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates: DATES, tasks: Object.keys(DATES).flatMap((d) => T5.map((t) => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {} }, extra || {});
const rl = (st) => { st = Object.assign({ on: true, lv: "g4", opt: false, cur: null, days: null, wf: null }, st || {}); return { reading: Object.assign({}, st, { lvFrom: "saved", ready: true, next: L.next(TR, st, 12, 2) }) }; };
const tabletCopy = (kid, lv, wf) => NB.generate(kid, clone(mkCtx(kid, { nbPageTags: true, bindingMargin: false, ladders: rl({ lv, wf }) }))).student;

// a small document from the builder's HTML: each page knows its attributes, its .lr-back heading, its questions (with or without
// lines, their numbers); a question's box measures only while its page is displayed (nbt-on), as a display:none page does
let GEOM = (qi) => ({ left: 40, top: 300 + qi * 130, width: 736, height: 110 });
function fakeDoc(html) {
  const re = /<div class="page[" ][^>]*>/g, at = []; let m;
  while ((m = re.exec(html))) at.push({ i: m.index, tag: m[0] });
  const pages = at.map((a, k) => {
    const chunk = html.slice(a.i, k + 1 < at.length ? at[k + 1].i : undefined), attrs = {};
    a.tag.replace(/([a-z-]+)="([^"]*)"/g, (_, x, y) => { attrs[x] = y.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); });
    const cls = new Set(); const pg = { attrs, chunk, getAttribute: (x) => (x in attrs ? attrs[x] : null),
      classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c) } };
    const qs = chunk.split('<div class="lr-q">').slice(1).map((q, qi) => {
      const lines = q.indexOf('class="lr-lines"') >= 0, n = (/<span class="lr-n">(\d+)<\/span>/.exec(q) || [])[1] || "";
      return { lines, n, querySelector: (s) => (s === ".lr-lines" ? (lines ? {} : null) : s === ".lr-n" ? { textContent: n } : null),
        getBoundingClientRect: () => (cls.has("nbt-on") ? GEOM(qi) : { left: 0, top: 0, width: 0, height: 0 }) };
    });
    pg.qs = qs;
    pg.querySelector = (s) => (s === ".lr-back" ? (chunk.indexOf('class="lr-how lr-back"') >= 0 ? {} : null) : s === ".lr-lines" ? (qs.some((q) => q.lines) ? {} : null) : null);
    pg.querySelectorAll = (s) => (s === ".lr-q" ? qs : []);
    return pg;
  });
  return { pages, querySelectorAll: (s) => (s === ".page" ? pages : []) };
}

// ═════════════ (c) the pairs on real copies ═════════════
console.log("(c) real tablet copies: each check page and its front");
const fnOf = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) return ""; const a = s.lastIndexOf("\n", i) + 1; let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(a, k + 1); } return ""; };
const tab = IX.slice(tb, te);
const pieces = ["nbtPages", "nbtInkPath", "nbtBuilt", "nbtShowPage"].map((n) => fnOf(tab, n)).join("\n") + "\n" + blk;
const els = {};
const store = {}, reads = [], writes = [];
let INK = {};   // path → saved page ({v,s,ts})
const G = { console, Promise, JSON, Object, Array, String, Number, Math,
  HA_LS: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  document: { getElementById: (id) => els[id] || null, createElement: () => { const e = { style: { cssText: "" }, innerHTML: "", id: "", remove() { if (els[this.id] === this) delete els[this.id]; } }; return e; } },
  notebookSettings: {}, nbtView: null, MOM: false, DAD: false, DADOK: false,
  db: { ref: (p) => ({ once: () => { reads.push(p); return Promise.resolve({ val: () => (p in INK ? clone(INK[p]) : null) }); }, set: (x) => { writes.push(p); return Promise.resolve(); }, update: (x) => { writes.push(p); return Promise.resolve(); } }) },
  nbtAnsFollow() {}, nbtShowAns() {}, nbtAcDraw() {}, gone: [] };
G.wbMomEyes = () => G.MOM; G._kioskD = () => G.DAD; G.dadAwardOk = () => G.DADOK;
G.nbtGo = (d) => { G.gone.push(d); };
G.nbtBarRender = () => { vm.runInContext("nbtWfTick(nbtView)", G); };   // the real bar repaint ends with this tick (checked in (a))
vm.createContext(G);
vm.runInContext(pieces.replace("const NBT_WF_PAD=", "var NBT_WF_PAD=").replace("const NBT_WF_LS=", "var NBT_WF_LS="), G);
const run = (s) => vm.runInContext(s, G);
const flush = () => new Promise((r) => setTimeout(r, 5));

const copies = {};
[[K6, "6th-grade", "g6"], [K4, "4th-grade", "g4"], [K1, "1st-grade (reading at g3)", "g3"]].forEach(([kid, nm, lv]) => {
  const html = tabletCopy(kid, lv, "both"), doc = fakeDoc(html);
  G._doc = doc; const pr = run("nbtWfPairs(_doc)");
  const checks = doc.pages.map((p, i) => (p.attrs["data-nb-name"] === "Read and answer — check" ? i + 1 : 0)).filter(Boolean);
  ok(checks.length >= 1 && Object.keys(pr).map(Number).join() === checks.join() &&
    checks.every((c) => pr[c] === c - 1 && doc.pages[c - 2].attrs["data-nb-name"] === "Read and answer" && doc.pages[c - 2].attrs["data-nb-day"] === doc.pages[c - 1].attrs["data-nb-day"] && doc.pages[c - 2].qs.some((q) => q.lines)),
    nm + " notebook, write-first both: " + checks.length + " check page(s), each paired with the front right before it (same day, has writing lines)", pr);
  const off = fakeDoc(tabletCopy(kid, lv, null)); G._doc = off;
  ok(JSON.stringify(run("nbtWfPairs(_doc)")) === "{}" && off.pages.every((p) => p.attrs["data-nb-name"] !== "Read and answer — check"), nm + " notebook, write-first off: no check page, nothing to cover");
  copies[kid] = { html, doc, checks, pr };
});
{ const lo = fakeDoc(tabletCopy(K6, "g2", "both")); G._doc = lo; ok(JSON.stringify(run("nbtWfPairs(_doc)")) === "{}", "a 2nd-grade-level passage never writes first → nothing covered"); }

// ═════════════ (d) the viewer ═════════════
console.log("(d) the viewer, in a sandbox");
const C = copies[K6], CP = C.checks[0], FP = CP - 1;
const front = C.doc.pages[FP - 1], nLines = front.qs.filter((q) => q.lines).length, lineNums = front.qs.filter((q) => q.lines).map((q) => q.n);
ok(nLines >= 1, "the front has " + nLines + " question(s) to write first (" + lineNums.join(", ") + ")");
// a stroke in the middle of question qi's box (0..1 of the page)
const strokeIn = (qi, g) => { const b = (g || GEOM)(qi); return { c: "#1d4ed8", w: 0.004, p: [[(b.left + b.width / 2) / 816, (b.top + b.height / 2) / 1056], [(b.left + b.width / 2 + 30) / 816, (b.top + b.height / 2) / 1056]] }; };
const qIdx = front.qs.map((q, i) => (q.lines ? i : -1)).filter((i) => i >= 0);
const allInk = () => qIdx.map((i) => strokeIn(i));
function openView(kid, wk, ts) {
  const doc = C.doc; doc.pages.forEach((p) => p.classList.remove("nbt-on"));
  els["nbt-doc"] = { contentDocument: doc };
  els["nbt-hold"] = { appendChild: (e) => { els[e.id] = e; } };
  delete els["nbt-wf-lock"];
  G.notebookSettings = { [kid]: { tablet: { [wk]: { ts, pages: doc.pages.length } } } };
  run("nbtView={kid:" + JSON.stringify(kid) + ",wk:" + JSON.stringify(wk) + ",page:1,n:" + doc.pages.length + ",strokes:[],ready:true}");
  return run("nbtView");
}
const go = (p, strokes) => { run("nbtView.page=" + p + "; nbtView.strokes=" + JSON.stringify(strokes || []) + "; nbtShowPage();"); };
const shown = (p) => C.doc.pages[p - 1].classList.contains("nbt-on");
const card = () => els["nbt-wf-lock"] || null;
const P = (kid, wk, p) => "notebookWork/" + kid + "/" + wk + "/" + p;

(async () => {
  const kid = "kid1", wk = "week12";
  // 1. nothing written yet
  INK = {};
  openView(kid, wk, 1000); go(CP); await flush();
  ok(!shown(CP) && !!card() && run("nbtWfLocked(nbtView," + CP + ")"), "nothing written on the front → the check page is covered (the page itself is not shown at all)");
  ok(card() && card().innerHTML.indexOf("Write your answers first, then your choices show here.") > 0 && card().innerHTML.indexOf("nbtWfBack()") > 0 && /position:absolute;inset:0;z-index:2;background:#fff/.test(card().style.cssText),
    "the card: plain words why, a way back to the questions; opaque, over the whole page (the pen can't reach it)");
  ok(reads.indexOf(P(kid, wk, FP)) >= 0, "it asked for the front page's saved writing (one read)");
  ok(card().innerHTML.indexOf("Still to write: ") > 0 && lineNums.every((n) => card().innerHTML.indexOf(n) > 0), "…and says which questions are still to write");
  run("nbtWfBack()"); ok(G.gone.pop() === FP - CP, "◀ Back to the questions turns to the front page");
  ok(C.checks.every((c) => run("nbtWfLocked(nbtView," + c + ")")) && C.doc.pages.every((p, i) => C.checks.indexOf(i + 1) >= 0 || !run("nbtWfLocked(nbtView," + (i + 1) + ")")), "every check page is covered; no other page ever is");
  go(FP); ok(shown(FP) && !card(), "the front page shows as always (no card)");
  for (let p = 1; p <= C.doc.pages.length; p++) if (C.checks.indexOf(p) < 0) { go(p); if (!shown(p) || card()) { ok(false, "page " + p + " shows normally"); break; } }
  ok(true, "every page that isn't a check page turns exactly as before");

  // 2. a scribble outside the questions, and only some questions written → still covered
  go(FP, [{ c: "#00f", w: 0.004, p: [[0.02, 0.02], [0.05, 0.03]] }]);
  ok(run("nbtWfLocked(nbtView," + CP + ")"), "a scribble at the page's corner doesn't count as writing an answer");
  if (qIdx.length > 1) { go(FP, [strokeIn(qIdx[0])]); ok(run("nbtWfLocked(nbtView," + CP + ")"), "writing on question " + lineNums[0] + " only → still covered");
    go(CP); ok(!shown(CP) && card() && card().innerHTML.indexOf("Still to write: " + lineNums.slice(1).join(", ").replace(/, ([^,]*)$/, " and $1")) > 0, "…the card names the ones left (" + lineNums.slice(1).join(", ") + ")"); }

  // 3. writing on every question on screen opens it — no network needed
  const saveDb = G.db; G.db = null;   // offline
  go(FP, allInk());
  ok(!run("nbtWfLocked(nbtView," + CP + ")"), "writing on every question with lines (on screen, before any save) → open, with no database at all");
  go(CP); ok(shown(CP) && !card(), "turn the page → the choices show");
  G.db = saveDb;
  const mem = JSON.parse(store.ha_nbt_wf || "{}");
  ok(JSON.stringify(mem) === JSON.stringify({ [kid + "|" + wk + "|1000"]: [CP] }), "remembered on this device for this copy (kid · week · copy)", mem);
  go(FP, []); go(CP);
  ok(shown(CP) && !card(), "the front erased afterwards → still open (it stays open for this week's copy)");

  // 4. a fresh open on this device: still open, even with nothing saved on the front
  INK = {}; reads.length = 0;
  openView(kid, wk, 1000); go(CP); await flush();
  ok(shown(CP) && !card() && reads.indexOf(P(kid, wk, FP)) < 0, "closed and opened again → still open, nothing to ask");
  // a new copy of the week (Mom sent it again) → its own record; the saved writing decides again
  openView(kid, wk, 2000); go(CP); await flush();
  ok(!shown(CP) && card(), "a new copy of the week (sent again) starts covered…");
  INK = { [P(kid, wk, FP)]: { v: 1, s: allInk(), ts: 1 } };
  openView(kid, wk, 3000); go(CP); await flush();
  ok(shown(CP) && !card(), "…and opens from the front's SAVED writing (another device, or written before) as soon as it is read");
  INK = { [P(kid, wk, FP)]: { v: 1, s: { 0: { c: "#00f", w: 0.004, p: { 0: [0.5, 0.5] } } }, ts: 1 } };   // the database's object shape
  openView(kid, wk, 4000); go(CP); await flush();
  ok(!shown(CP) && card(), "saved writing that isn't on the questions → still covered (read in the database's object shape)");
  // writing already saved on the check page itself → it was open before
  openView(kid, wk, 5000); go(CP); run("nbtView.strokes=" + JSON.stringify([strokeIn(0)]) + "; nbtBarRender();");
  ok(shown(CP) && !card(), "writing already saved on the check page (its circles) → open (it was open before)");

  // 5. a grown-up always sees it
  openView(kid, wk, 6000); G.MOM = true; go(CP);
  ok(shown(CP) && !card() && !run("nbtWfLocked(nbtView," + CP + ")"), "Mom (parent mode) sees the check page with nothing written");
  G.MOM = false; G.DAD = true; G.DADOK = true; go(CP); ok(shown(CP) && !card(), "Dad's unlocked link sees it too");
  G.DADOK = false; go(CP); ok(!shown(CP) && card(), "Dad's link while locked = the child's view");
  G.DAD = false;
  ok(writes.length === 0, "nothing was written to the database in any of this", writes);

  // 6. can't measure (the front's questions report no size) → any writing on the front counts
  const g0 = GEOM; GEOM = () => ({ left: 0, top: 0, width: 0, height: 0 });
  openView(kid, wk, 7000); go(FP, [{ c: "#00f", w: 0.004, p: [[0.5, 0.9]] }]);
  ok(!run("nbtWfLocked(nbtView," + CP + ")"), "a page that can't be measured: any writing on the front opens it (never stuck)");
  openView(kid, wk, 7001); go(FP, []); ok(run("nbtWfLocked(nbtView," + CP + ")"), "…but nothing written still keeps it covered");
  GEOM = g0;

  // 7. write-first off: a copy with no check page — the viewer behaves exactly as before
  const offDoc = fakeDoc(tabletCopy(K6, "g6", null));
  els["nbt-doc"] = { contentDocument: offDoc }; delete els["nbt-wf-lock"]; reads.length = 0;
  run("nbtView={kid:'kid1',wk:'week12',page:1,n:" + offDoc.pages.length + ",strokes:[],ready:true}");
  let same = true; for (let p = 1; p <= offDoc.pages.length; p++) { run("nbtView.page=" + p + "; nbtShowPage();"); if (!offDoc.pages[p - 1].classList.contains("nbt-on") || offDoc.pages.some((q, i) => i !== p - 1 && q.classList.contains("nbt-on")) || card()) same = false; }
  ok(same && reads.length === 0, "write-first off: every page turns as before, no card, no read");

  // ═════════════ (e) Chrome: the real page measures ═════════════
  console.log("(e) the writing areas on the real page — Google Chrome headless");
  const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(CHROME)) console.log("  SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladtabwf-"));
    let prepCss = ""; try { const i0 = prep.indexOf("st.textContent=") + "st.textContent=".length; prepCss = new Function("return " + prep.slice(i0, prep.indexOf(";\n", i0)))(); } catch (e) { prepCss = ""; }   // the viewer's own page CSS (one page at a time)
    const fns = ["nbtPages"].map((n) => fnOf(tab, n)).join("\n") + "\n" + ["nbtWfPairs", "nbtWfBoxes", "nbtWfMissing", "nbtWfWritten"].map((n) => fnOf(blk, n)).join("\n") + "\nvar NBT_WF_PAD=10;";
    const probe = function () {
      var ps = nbtPages(document), pr = nbtWfPairs(document), out = [];
      Object.keys(pr).forEach(function (c) {
        ps[0].classList.add("nbt-on");   // another page on screen; the front is hidden
        var b = nbtWfBoxes(ps[pr[c] - 1]), hiddenAfter = !ps[pr[c] - 1].classList.contains("nbt-on");
        var ink = b.map(function (x) { return { p: [[(x.x + x.w / 2) / 816, (x.y + x.h / 2) / 1056]] }; });
        out.push({ c: +c, f: pr[c], n: b.length, boxes: b, hiddenAfter: hiddenAfter, allIn: nbtWfWritten(ink, b), oneOff: b.length > 1 ? nbtWfMissing(ink.slice(1), b) : null,
          lines: ps[pr[c] - 1].querySelectorAll(".lr-lines").length });
      });
      return out;
    };
    const res = {};
    for (const kid of [K6, K4, K1]) {
      const html = copies[kid].html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace("</head>", "<style>" + prepCss + "</style></head>")
        .replace("</body>", "<script>" + fns + "\nwindow.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + probe.toString() + ")()));});</script></body>");
      const f = path.join(dir, kid + ".html"); fs.writeFileSync(f, html);
      let r = null;
      for (let t = 0; t < 3 && !r; t++) { const o = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "p" + kid + t), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 120000 });
        const m = /data-r="([^"]*)"/.exec(String(o.stdout || "")); if (m) r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); }
      res[kid] = r;
    }
    if (!prepCss || Object.values(res).some((r) => !r)) console.log("  SKIPPED (Google Chrome would not run headless here, or the viewer's page CSS wasn't found)");
    else [[K6, "6th-grade"], [K4, "4th-grade"], [K1, "1st-grade"]].forEach(([kid, nm]) => {
      const r = res[kid];
      ok(r.length === copies[kid].checks.length && r.every((x) => x.n === x.lines && x.n >= 1 && x.hiddenAfter && x.boxes.every((b) => b.w > 300 && b.h > 40 && b.x >= 0 && b.y > 100 && b.x + b.w <= 816 && b.y + b.h <= 1056)),
        nm + " notebook: each front's questions with lines measure on the real page (816 × 1056), while that page is hidden, and it stays hidden", r.map((x) => x.boxes.map((b) => [b.n, Math.round(b.y), Math.round(b.h)])));
      ok(r.every((x) => x.allIn && (x.oneOff === null || (x.oneOff.length === 1 && x.oneOff[0] === x.boxes[0].n))) && r.every((x) => x.boxes.every((b, i) => !i || b.y >= x.boxes[i - 1].y + x.boxes[i - 1].h - 1)),
        nm + " notebook: writing on every question opens it; leaving one out keeps it covered and names it; the areas don't overlap");
    });
    console.log("  (web fonts not loaded — the fallback fonts; the pad is " + 10 + " page px)");
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("  ✗ crashed: " + (e && e.stack || e)); process.exit(1); });
