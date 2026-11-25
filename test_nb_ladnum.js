// 🔢 NBLADNUM — "Number thinking" in the Pre-K / K notebooks and the 1st-grade notebook, slice 4 of the notebook ladders (notebooks
// study, her words 2026-11-23/24: "Build it"; number questions "5 a week"; Pre-K and K done with a grown-up). Run: node test_nb_ladnum.js
//  (a) the blocks: one in each file, no family names, no DOM/Firebase in notebooks.js, writes only through nbLadderWrite
//  (b) off / not loaded / no items / finished / a broken question → every notebook byte for byte = THIS tree with the NBLADNUM block
//      and its call sites cut out (built below — no git, no pinned commit); notebooks that don't print it are unchanged when it's on
//  (c) on → exactly the engine's questions in order, one page, for Pre-K, K and 1st grade, in every Pre-K look
//  (d) nothing on the child's page gives the answer: the same markup whatever the answer letter, no rule, no plain words of a
//      picture, every choice the same size and frame, no attribute but class (and the tablet's day + name)
//  (e) the answers on a grown-up page only (the Grown-Up Guide's last page / a Teaching Companion page)
//  (f) where the page sits: every page that existed keeps its place; the paper dolls still land on a sheet front
//  (g) the tablet tags; (h) the place: same week = same questions, next week moves on, level end climbs, opt, a bank, the end
//  (i) index.html: the card's note per notebook, every Mom build waits for the file, a failed load, the cursor save (once, Mom
//      only, dry-run inert)
//  (j) page fit in Google Chrome headless (when it is on the machine): every week of Pre-K and K in all nine looks, every level in the
//      1st-grade notebook, and the answer pages
//  (k) would one question a school day fit on the daily pages? (measured; the answer goes in the report)
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const SRC = rd("notebooks.js"), IX = rd("index.html"), NUM = JSON.parse(rd("ladders/number_thinking.json")), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");

// ════════════════════════════════════ (a) the blocks ════════════════════════════════════
console.log("(a) the blocks");
const B0 = SRC.indexOf("  // NBLADNUM_START"), B1 = SRC.indexOf("  // NBLADNUM_END\n");
const I0 = IX.indexOf("// NBLADNUM_START"), I1 = IX.indexOf("// NBLADNUM_END\n");
ok("one NBLADNUM block in notebooks.js, right after NBLADDER_END", B0 === SRC.indexOf("  // NBLADDER_END\n") + "  // NBLADDER_END\n".length && B1 > B0 && SRC.indexOf("NBLADNUM_START", B0 + 20) < 0);
ok("one NBLADNUM block in index.html, right after NBNAME_END", I0 === IX.indexOf("// NBNAME_END\n") + "// NBNAME_END\n".length && I1 > I0 && IX.indexOf("NBLADNUM_START", I0 + 5) < 0);
const nbBlk = SRC.slice(B0, B1), ixBlk = IX.slice(I0, I1);
const ldBlk = IX.slice(IX.indexOf("// NBLADDER_START"), IX.indexOf("// NBLADDER_END\n"));
const lrBlk = IX.slice(IX.indexOf("// NBLADREAD_START"), IX.indexOf("// NBLADREAD_END\n"));
ok("no kid or family name in either block", !NAMES.test(code(nbBlk)) && !NAMES.test(ixBlk), (code(nbBlk).match(NAMES) || ixBlk.match(NAMES) || [])[0]);
ok("notebooks.js block: no DOM, no Firebase", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(nbBlk)));
ok("notebooks.js block reads only ctx.ladders.number", (code(nbBlk).match(/ctx\.ladders[.\w]*/g) || []).every((m) => m === "ctx.ladders" || m === "ctx.ladders.number"));
ok("index.html block: no db.ref of its own — the one write goes through nbLadderWrite (the number ladder's cur)", !/db\.ref\(/.test(ixBlk) && (ixBlk.match(/nbLadderWrite\(/g) || []).length === 1 && ixBlk.indexOf('nbLadderWrite(kid,"number","cur",nc)') > 0);
ok("index.html block names no ladders path (test_nb_ladder: only NBLADDER touches it)", ixBlk.indexOf("/ladders/") < 0 && ixBlk.indexOf(".ladders") < 0);
const words = (s) => (code(s).match(/'[^']*'|"[^"]*"/g) || []).join(" ").replace(/<[^>]*>/g, " ");
ok("no he/his/him/she/her in either block's words", !/\b(he|his|him|she|her)\b/i.test(words(nbBlk)) && !/\b(he|his|him|she|her)\b/i.test(words(ixBlk)));
ok("no 🔀 in index.html", IX.indexOf("\u{1F500}") < 0);
const fnSlice = (sig) => { const a = SRC.indexOf(sig); return SRC.slice(a, SRC.indexOf("\n  }\n", a)); };
const gPk = fnSlice("  function generatePreK(ctx, T, lv, kidId) {"), gLu = fnSlice("  function generateLucy(ctx) {");
const sitesPk = gPk.split("\n").filter((l) => /NBLADNUM/.test(l)), sitesLu = gLu.split("\n").filter((l) => /NBLADNUM/.test(l));
ok("five marked one-line call sites in the Pre-K / K builder, five in the 1st-grade builder", sitesPk.length === 5 && sitesLu.length === 5 && sitesPk.concat(sitesLu).every((l) => /\/\/ NBLADNUM/.test(l)), [sitesPk.length, sitesLu.length]);
ok("…and one in nbLadReadPages (the card's 'what prints'); no other line outside the block mentions it",
  SRC.split("\n").filter((l) => /NBLADNUM/.test(l)).length === 10 + 1 + nbBlk.split("\n").filter((l) => /NBLADNUM/.test(l)).length + 1);
ok("index.html: the marked lines in NBLADREAD — the note ×2, the waits ×2, the save", (lrBlk.match(/\/\/ 🔢 NBLADNUM/g) || []).length === 5, (lrBlk.match(/\/\/ 🔢 NBLADNUM/g) || []).length);

// ════════════════════════════════════ load: now + the baseline ════════════════════════════════════
const HOOK = "_internal: {";
const T_HOOK = HOOK + " lntWeek: lntWeek, lntQ: lntQ, lntPkPage: lntPkPage, lntLuPage: lntLuPage, lntPkAnswers: lntPkAnswers, lntLuCompanion: lntLuCompanion, LNT_PIC: LNT_PIC, LNT_CSS_PK: LNT_CSS_PK, LNT_CSS_LU: LNT_CSS_LU, luShell: luShell,";
const RET_NOW = "    return { reading: !!(g && g.build === generateLucy), number: lntPrints(kid, opt) };   // NBLADNUM: number questions print in the Pre-K / K and 1st-grade notebooks\n";
let BASE = SRC.slice(0, B0) + SRC.slice(B1 + "  // NBLADNUM_END\n".length);
ok("the nbLadReadPages line is there once (restored to number: false for the baseline)", BASE.split(RET_NOW).length === 2);
BASE = BASE.replace(RET_NOW, "    return { reading: !!(g && g.build === generateLucy), number: false };\n");
const cut = BASE.split("\n").filter((l) => /NBLADNUM/.test(l));
BASE = BASE.split("\n").filter((l) => !/NBLADNUM/.test(l)).join("\n");
ok("the baseline cut takes only marked one-line call sites (10)", cut.length === 10 && cut.every((l) => /\/\/ NBLADNUM/.test(l)), cut.length);
ok("the baseline has no trace of the block", !/lnt[A-Z]|LNT_|numberLadderCursor/.test(BASE));
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const NB = load(SRC.replace(HOOK, T_HOOK)), OLD = load(BASE), I = NB._internal, L = NB.ladders;
const TN = L.track("number", NUM), TR = L.track("reading", READ);
const LOOKS = Object.keys(NB.themes || {});
ok("nine Pre-K looks", LOOKS.length === 9, LOOKS);
const KLU = Object.keys(NB.GENERATORS).filter((k) => NB.GENERATORS[k].build === I.generateLucy)[0];
const KPK = Object.keys(NB.GENERATORS).filter((k) => NB.GENERATORS[k].prek);
const KOLD = Object.keys(NB.GENERATORS).filter((k) => k !== KLU && !NB.GENERATORS[k].prek);
ok("ladderPages: number:true for the 1st-grade notebook, every built-in Pre-K / K notebook and any kid on a Pre-K look; false for the older notebooks and the starter",
  NB.ladderPages(KLU).number === true && KPK.length >= 1 && KPK.every((k) => NB.ladderPages(k).number === true) && LOOKS.every((th) => NB.ladderPages("kidt", { notebookTheme: th }).number === true) &&
  KOLD.length >= 2 && KOLD.every((k) => NB.ladderPages(k).number === false) && NB.ladderPages("kidz").number === false, KOLD);
ok("…reading is unchanged by this slice (the baseline answers the same)", Object.keys(NB.GENERATORS).concat(["kidz"]).every((k) => NB.ladderPages(k).reading === OLD.ladderPages(k).reading));

// ── fixtures (made-up week, no family data) ──
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Math Book — p. 12", "📱 Reading App — Lesson 4", "📖 Closing Notebook — Closing Notebook"];
const mkDates = (ds) => { const o = {}; ds.forEach((d) => (o[d] = DATES[d])); return o; };
const mkCtx = (kid, extra, ds) => {
  ds = ds || Object.keys(DATES);
  return Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates: mkDates(ds), tasks: ds.flatMap((d) => T5.map((t) => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {} }, extra || {});
};
// ctx.ladders.number the way index.html builds it (nbLadderCtx), straight from the engine
const nl = (st, wk) => { st = Object.assign({ on: true, lv: "g1", opt: false, cur: null }, st || {}); return { number: Object.assign({}, st, { lvFrom: "saved", ready: true, next: L.next(TN, st, wk || 12, 5) }) }; };
const PKX = (lv, th) => ({ notebookTheme: th || "dino", nbGrade: lv === "k" ? "K" : "Pre-K", kidName: "Sam" });
const gen = (kid, ctx) => NB.generate(kid, clone(ctx));
const genOld = (kid, ctx) => OLD.generate(kid, clone(ctx));
const both = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
const pagesOf = (html) => { const out = [], re = /(?:<div class="page-label">([^<]*)<\/div>\s*)?<div class="page"[ >]/g; let m; while ((m = re.exec(html))) out.push(m[1] || ""); return out; };
// the Number Thinking child page / the answers page (label → end of the page)
const pieces = (html, re) => html.split('<div class="page-label">').filter((s) => re.test(s)).map((s) => '<div class="page-label">' + s.replace(/\n?<\/body>[\s\S]*$/, ""));
const numPages = (html) => pieces(html, /^Number Thinking — Week /);
const ansPages = (html) => pieces(html, /^(Grown-Up Guide — Number Thinking answers|Teaching Companion — Number Thinking · answers)/);
const qBlocks = (page) => page.split('<div class="lnt-q">').slice(1);

// ════════════════════════════════════ (b) off → byte for byte ════════════════════════════════════
console.log("(b) off, not ready, nothing left → byte for byte as before");
{
  const books = [[KLU, {}, "g1"]].concat(KPK.map((k) => [k, {}, "prek"]), LOOKS.flatMap((th) => [["kidt_" + th, PKX("prek", th), "prek"], ["kidk_" + th, Object.assign(PKX("k", th), { nbLevel: { nbFindIt: true, nbLowercase: true, nbTeens: true } }), "k"]]));
  const fin = { lv: "g8", cur: { week: 11, lv: "g8", from: 59, adv: 1, opt: false } };
  let same = 0; const diff = [];
  for (const [kid, extra, lv] of books) {
    const n0 = nl({ lv }).number;
    const cases = {
      "no ladders": {}, "ladders null": { ladders: null },
      "number saved but off": { ladders: { number: Object.assign({}, n0, { on: false }) } },
      "on, file not loaded (ready false, next null)": { ladders: { number: Object.assign({}, n0, { ready: false, next: null }) } },
      "on and loaded, no items": { ladders: { number: Object.assign({}, n0, { next: { kind: "number", items: [], stop: null, end: false, cursor: null } }) } },
      "on, finished (past the last level)": { ladders: nl(fin, 12) },
      "on, at a bank rung (no items before it)": { ladders: nl({ lv: "g4" }) },
      "on, a question of the wrong shape": { ladders: { number: Object.assign({}, n0, { next: Object.assign({}, n0.next, { items: n0.next.items.slice(0, 4).concat([{ lv, item: { text: "1 2 ?" } }]) }) }) } },
      "reading only (on)": { ladders: { reading: { on: true, lv: "g1", ready: true, next: L.next(TR, { lv: "g1" }, 12, 2) } } },
      "tablet tags, off": { nbPageTags: true },
    };
    for (const [name, x] of Object.entries(cases)) {
      const ctx = mkCtx(kid, Object.assign({}, extra, x)), a = gen(kid, ctx), b = genOld(kid, ctx);
      if (both(a) === both(b) && !("numberLadderCursor" in a) && a.student.indexOf("Number Thinking") < 0) same++; else diff.push(kid + ": " + name);
    }
  }
  ok("finished / bank fixtures really have no items", nl(fin, 12).number.next.items.length === 0 && nl(fin, 12).number.next.end === true && nl({ lv: "g4" }).number.next.stop.lv === "g4" && nl({ lv: "g4" }).number.next.items.length === 0);
  ok("every case × every notebook that prints it (" + books.length + " notebooks: the 1st-grade one, the built-in Pre-K / K ones, all nine looks at Pre-K and at K) = before, no cursor", diff.length === 0 && same === books.length * 10, diff.slice(0, 5));
  // notebooks that don't print it, with the number ladder ON and loaded
  const others = KOLD.map((k) => [k, {}]).concat([["kidz", {}]]);
  let s2 = 0; const d2 = [];
  for (const [kid, extra] of others) { const ctx = mkCtx(kid, Object.assign({ ladders: nl({ lv: "g5", opt: true }) }, extra)); const a = gen(kid, ctx); if (both(a) === both(genOld(kid, ctx)) && !("numberLadderCursor" in a)) s2++; else d2.push(kid); }
  ok("the older notebooks and the starter (" + others.length + ") print the same with the number ladder on", s2 === others.length, d2);
  const byKid = {}, byKid0 = {}; Object.keys(NB.GENERATORS).forEach((k) => { byKid[k] = mkCtx(k, { ladders: { number: Object.assign({}, nl().number, { on: false }) } }); byKid0[k] = mkCtx(k); });
  ok("the combined parent packet with the number ladder off = before", NB.combinedParent(byKid) === OLD.combinedParent(byKid0));
}

// ════════════════════════════════════ (c) on → the engine's questions, in order ════════════════════════════════════
console.log("(c) on → one page, the engine's five questions in order");
const SAY = (q) => "Read aloud: “" + esc(q.say) + "”";
for (const [label, kid, extra, lv] of [["Pre-K (built-in look)", KPK[0], {}, "prek"], ["K (a Pre-K look at K)", "kidk", PKX("k", "construction"), "k"], ["1st grade", KLU, {}, "g1"]]) {
  const ctx = mkCtx(kid, Object.assign({ ladders: nl({ lv }) }, extra)), out = gen(kid, ctx), want = ctx.ladders.number.next.items;
  const np = numPages(out.student), qs = np.length ? qBlocks(np[0]) : [];
  ok(label + ": one Number Thinking page with " + want.length + " questions, numbered 1–5", want.length === 5 && np.length === 1 && qs.length === 5 && qs.every((q, i) => q.indexOf('<span class="lnt-n">' + (i + 1) + "</span>") >= 0));
  ok(label + ": each question is the engine's, in order (the same block lntQ draws for it)", qs.every((q, i) => ('<div class="lnt-q">' + q).indexOf(I.lntQ(want[i], i + 1)) === 0));
  if (lv !== "g1") {
    ok(label + ": every question drawn as a picture with its 'Read aloud' line, in order; the page says 'with a grown-up'", qs.every((q, i) => q.indexOf(SAY(want[i].item)) > 0 && q.indexOf("<svg") > 0) &&
      /With a grown-up/.test(np[0]) && /with a grown-up · look · think · circle/.test(np[0]) && np[0].indexOf("A grown-up reads each question aloud.") > 0);
    ok(label + ": each picture and its choices are ladders.picture's own drawing (choice frames in the item's order)", qs.every((q, i) => { const P = L.picture(want[i].item, I.LNT_PIC.grown); return P && q.indexOf(P.pic) > 0 && P.choices.every((c, k) => q.indexOf('<span class="lnt-l">' + "ABCDEFGH"[k] + "</span>" + c) > 0); }));
  } else {
    ok(label + ": the child reads it — no 'Read aloud', no 'with a grown-up'", np[0].indexOf("Read aloud") < 0 && !/with a grown-up/i.test(np[0]) && np[0].indexOf("Read each one. Find what comes next or what is missing.") > 0);
    ok(label + ": a plain number line prints as written (the first ? an empty box) with lettered choices", qs.every((q, i) => { const it = want[i].item; if (it.pic) return true;
      const t = esc(it.text), k = t.indexOf("?"); return q.indexOf(t.slice(0, k) + '<span class="lnt-box">?</span>' + t.slice(k + 1)) > 0 && it.c.every((c, j) => q.indexOf('<span class="lnt-l">' + "ABCD"[j] + "</span>" + esc(c) + "</span>") > 0); }));
  }
  ok(label + ": out.numberLadderCursor = the engine's cursor; the Pre-K number card's own cursor is untouched", JSON.stringify(out.numberLadderCursor) === JSON.stringify(ctx.ladders.number.next.cursor) &&
    JSON.stringify(out.numberCursor) === JSON.stringify(genOld(kid, mkCtx(kid, extra)).numberCursor));
  ok(label + ": same ctx built twice → the same notebook", both(gen(kid, ctx)) === both(gen(kid, ctx)));
}
{
  const g1 = TN.levels.g1.items, pp = g1.filter((it) => it.pic && /^(parts|pairs)$/.test(it.pic.kind)), es = g1.filter((it) => it.pic && it.pic.kind === "estimate");
  const qh = (it) => I.lntQ({ lv: "g1", label: "1st grade", num: 1, of: 60, item: it }, 1);
  ok("1st grade: puzzles and pairs keep their number line, with the picture beside it (" + pp.length + " questions)", pp.length > 0 && pp.every((it) => { const h = qh(it); const t = esc(it.text), k = t.indexOf("?"); return h.indexOf('<div class="lnt-line">' + t.slice(0, k) + '<span class="lnt-box">?</span>' + t.slice(k + 1) + "</div>") > 0 && h.indexOf("<svg") > 0; }));
  ok("1st grade: an 'about how many' picture prints its short spoken question, not its plain words (" + es.length + " questions)", es.length > 0 && es.every((it) => { const h = qh(it); return h.indexOf(esc(it.say)) > 0 && h.indexOf(esc(it.text)) < 0 && h.indexOf("<svg") > 0; }));
  // every look
  const bad = LOOKS.filter((th) => { const ctx = mkCtx("kidt", Object.assign({ ladders: nl({ lv: "prek" }) }, PKX("prek", th))), o = gen("kidt", ctx); return numPages(o.student).length !== 1 || ansPages(o.parent).length !== 1 || !o.numberLadderCursor; });
  ok("all nine looks print the page, its answers and the cursor", !bad.length, bad);
}

// ════════════════════════════════════ (d) nothing on the child's page gives the answer ════════════════════════════════════
console.log("(d) the child's page never shows or hints the answer — every question of Pre-K, K, 1st, 2nd and 3rd grade (and the harder levels)");
{
  const all = []; TN.order.forEach((lv) => { if (TN.levels[lv].bank) return; TN.levels[lv].items.forEach((it, i) => all.push({ lv, label: TN.levels[lv].label, i, num: i + 1, of: TN.levels[lv].items.length, id: it.id, item: it })); });
  ok("all " + all.length + " questions render", all.length === 60 * 8 + 36);
  const sameHit = [], ruleHit = [], txtHit = [], attrHit = [], sizeHit = [], markHit = [];
  all.forEach((x) => {
    const h = I.lntQ(x, 3), q = x.item;
    // the same markup whatever the answer is: move the answer letter (and nothing else) to every other choice
    q.c.forEach((c, k) => { const y = clone(x); y.item.ans = "ABCDEFGH"[k]; if (I.lntQ(y, 3) !== h) sameHit.push(x.id); });
    if (q.rule && h.indexOf(esc(q.rule)) >= 0) ruleHit.push(x.id);
    const picDrawn = !!(q.pic && L.picture(q, I.LNT_PIC[/^(prek|k)$/.test(x.lv) ? "grown" : "alone"]));
    const own = picDrawn && !(/^(parts|pairs)$/.test(q.pic.kind) && !/^(prek|k)$/.test(x.lv));
    if (own && h.indexOf(esc(q.text)) >= 0) txtHit.push(x.id);   // a picture's plain words ("… 45 dots …") stay on the grown-up page
    (h.match(/<[a-z]+\s[^>]*>/g) || []).forEach((tag) => { if (/^<(svg|g|rect|circle|polygon|path|line|text|pattern|defs)\b/.test(tag)) { if (/\b(data-|title=|alt=|aria-label)/.test(tag)) attrHit.push(x.id + " " + tag.slice(0, 60)); return; }
      if (!/^<[a-z]+ class="[^"]*">$/.test(tag)) attrHit.push(x.id + " " + tag.slice(0, 60)); });
    if (/✅|✓|✔|answer|correct|right one/i.test(h.replace(/<svg[\s\S]*?<\/svg>/g, ""))) markHit.push(x.id);
    if (picDrawn) { const ch = h.split('<span class="lnt-pc">').slice(1).map((s) => (/<svg[^>]*width="(\d+)" height="(\d+)"/.exec(s) || []).slice(1).join("x"));
      if (ch.length !== q.c.length || ch.some((s) => s !== ch[0])) sizeHit.push(x.id); }
    else if ((h.match(/<span class="lnt-c">/g) || []).length !== q.c.length) sizeHit.push(x.id);
  });
  ok("the same markup whatever the right letter is (every question, every letter)", !sameHit.length, sameHit.slice(0, 5));
  ok("no rule line on the child's page", !ruleHit.length, ruleHit.slice(0, 5));
  ok("a drawn picture's plain words are not on the child's page (puzzles and pairs keep their own number line)", !txtHit.length, txtHit.slice(0, 5));
  ok("no attribute but class on the page's own tags, and no data-/title/alt/aria-label in any picture", !attrHit.length, attrHit.slice(0, 3));
  ok("no check mark or 'answer'/'correct' word on a child question", !markHit.length, markHit.slice(0, 5));
  ok("every choice the same: picture choices all one size in the same frame; word choices the same markup", !sizeHit.length, sizeHit.slice(0, 5));
  // the whole student document of a real build (tablet copy): no rule, no answer words
  for (const [kid, extra, lv] of [[KPK[0], {}, "k"], [KLU, {}, "g1"], [KLU, {}, "g2"]]) {
    const ctx = mkCtx(kid, Object.assign({ ladders: nl({ lv }), nbPageTags: true }, extra)), out = gen(kid, ctx), its = ctx.ladders.number.next.items, np = numPages(out.student)[0];
    ok(lv + " build (tablet copy): no rule line of this week anywhere in the child's notebook; the page's only data- attributes are the tablet's day + name",
      its.every((x) => out.student.indexOf(esc(x.item.rule)) < 0) && (np.match(/data-[a-z-]+=/g) || []).join(",") === "data-nb-day=,data-nb-name=");
  }
  // a picture that can't be drawn where its words would give the answer away → no page at all
  const ctxB = mkCtx(KLU, { ladders: nl({ lv: "g2" }) }), est = TN.levels.g2.items.find((it) => it.pic && it.pic.kind === "estimate");
  ctxB.ladders.number.next.items[2] = { lv: "g2", label: "2nd grade", i: 2, num: 3, of: 60, id: est.id, item: Object.assign(clone(est), { pic: Object.assign(clone(est.pic), { kind: "nope" }) }) };
  const oB = gen(KLU, ctxB);
  ok("an 'about how many' picture that can't be drawn → no number page, no cursor (its plain words would show the count)", numPages(oB.student).length === 0 && !("numberLadderCursor" in oB));
}

// ════════════════════════════════════ (e) the answers, on a grown-up page only ════════════════════════════════════
console.log("(e) the answers: a grown-up page");
for (const [label, kid, extra, lv] of [["Pre-K / K", KPK[0], {}, "prek"], ["a Pre-K look at K", "kidk", PKX("k", "space"), "k"], ["1st grade", KLU, {}, "g1"]]) {
  const ctx = mkCtx(kid, Object.assign({ ladders: nl({ lv }) }, extra)), out = gen(kid, ctx), old = genOld(kid, mkCtx(kid, extra)), its = ctx.ladders.number.next.items;
  const ap = ansPages(out.parent);
  ok(label + ": one answers page, added after every page the guide had (which are unchanged)", ap.length === 1 && pagesOf(out.parent).length === pagesOf(old.parent).length + 1 &&
    out.parent.indexOf(old.parent.slice(old.parent.indexOf("<body>"), old.parent.lastIndexOf("</div>"))) > 0 && /answers/.test(pagesOf(out.parent).slice(-1)[0]));
  ok(label + ": each question's right letter + the right choice's words, and its rule", its.every((x) => { const q = x.item, w = q.c["ABCDEFGH".indexOf(q.ans)]; const ww = /^(prek|k)$/.test(x.lv) ? String(w).replace(/-/g, " ") : w;
    return ap[0].indexOf('<span class="lnt-key-a">' + esc(q.ans) + " — " + esc(ww) + "</span>") > 0 && ap[0].indexOf(esc(q.rule)) > 0; }));
  ok(label + ": the plain words of every picture whose words left the child's page", its.every((x) => { const q = x.item, moved = q.pic && (/^(prek|k)$/.test(x.lv) || !/^(parts|pairs)$/.test(q.pic.kind));
    return !moved || ap[0].indexOf('<div class="lnt-key-p">the picture: ' + esc(q.text) + "</div>") > 0; }));
  const sBody = out.student.slice(out.student.indexOf("<body>"));
  ok(label + ": the answers are not in the child's notebook", sBody.indexOf("lnt-key") < 0 && its.every((x) => sBody.indexOf(esc(x.item.rule)) < 0));
  ok(label + ": the place on the ladder is named (" + (/<div class="p-sec-h">([^<]*)</.exec(ap[0]) || /<div class="key-head">([^<]*)</.exec(ap[0]) || [])[1] + ")", ap[0].indexOf(esc(its[0].label) + " · questions 1–5 of 60") > 0);
  const ours = ap[0].replace(/<span class="lnt-key-[apr]">[\s\S]*?<\/span>/g, " ").replace(/<div class="lnt-key-p">[\s\S]*?<\/div>/g, " ").replace(/<[^>]*>/g, " ");
  ok(label + ": the page's own words never say he/she for the child", !/\b(she|her|he|his|him)\b/i.test(ours) && /your child/i.test(ours));
}
{
  const ctx = mkCtx(KLU, { ladders: Object.assign(nl({ lv: "g1" }), { reading: { on: true, lv: "g1", ready: true, next: L.next(TR, { lv: "g1" }, 12, 2) } }) }), out = gen(KLU, ctx);
  const labs = pagesOf(out.parent);
  ok("1st grade with reading on too: the reading Companion, then the number one", labs.slice(-2).join("|") === "Teaching Companion — Read and Answer · answers|Teaching Companion — Number Thinking · answers");
  const both2 = {}; both2[KLU] = ctx; both2[KPK[0]] = mkCtx(KPK[0], { ladders: nl({ lv: "prek" }) });
  const cpk = NB.combinedParent(both2);
  ok("the combined parent packet carries both answer pages", (cpk.match(/Number Thinking · answers|Number Thinking answers/g) || []).length >= 2);
}

// ════════════════════════════════════ (f) where the page sits ════════════════════════════════════
console.log("(f) every page that existed keeps its place");
{
  for (const [label, kid, extra, lv] of [["Pre-K", KPK[0], {}, "prek"], ["a Pre-K look, units + spelling-free extras", "kidt", Object.assign(PKX("prek", "farm"), { extraPages: { abc: { on: true }, daysSeasons: { on: true } } }), "prek"]]) {
    const was = pagesOf(genOld(kid, mkCtx(kid, extra)).student), now = pagesOf(gen(kid, mkCtx(kid, Object.assign({ ladders: nl({ lv }) }, extra))).student);
    ok(label + ": the same pages in the same places, then Number Thinking last", now.length === was.length + 1 && JSON.stringify(now.slice(0, -1)) === JSON.stringify(was) && /^Number Thinking — Week 12$/.test(now[now.length - 1]));
  }
  const dolls = { doll: "data:image/png;base64,AAAA", outfit: "data:image/png;base64,BBBB" };
  const rlad = { on: true, lv: "g1", ready: true, next: L.next(TR, { lv: "g1" }, 12, 2) };
  for (const [name, extra, ds] of [["full week", {}, null], ["paper dolls", { dolls }, null], ["dolls + My Words + reading on", { dolls, extraPages: { myWords: { on: true } }, read: true }, null], ["one-day week, dolls", { dolls }, ["wednesday"]], ["3-day week, dolls, reading on", { dolls, read: true }, ["monday", "tuesday", "wednesday"]]]) {
    const ex = Object.assign({}, extra); const rr = ex.read; delete ex.read;
    const ladOff = rr ? { ladders: { reading: rlad } } : {}, ladOn = { ladders: Object.assign(rr ? { reading: rlad } : {}, nl({ lv: "g1" })) };
    const was = pagesOf(gen(KLU, mkCtx(KLU, Object.assign({}, ex, ladOff), ds)).student), now = pagesOf(gen(KLU, mkCtx(KLU, Object.assign({}, ex, ladOn), ds)).student);
    const at = now.indexOf("Number Thinking — Week 12"), dollAt = (a) => a.findIndex((l) => /^Paper doll/.test(l));
    const lastRead = Math.max(-1, ...now.map((l, i) => (/^Read and Answer — /.test(l) ? i : -1))), eow = now.findIndex((l) => /^End of Week/i.test(l));
    ok(name + ": every page before it is where it was; it follows End of Week, My Words and Read and answer", at > eow && at > lastRead && JSON.stringify(now.slice(0, at)) === JSON.stringify(was.slice(0, at)));
    ok(name + ": after it, the same pages in the same order (only the blank pad may change)", JSON.stringify(now.slice(at + 1).filter((l) => !/^Blank/.test(l))) === JSON.stringify(was.slice(at).filter((l) => !/^Blank/.test(l))));
    if (ex.dolls) ok(name + ": the first doll is on a sheet front (even 0-based index), each doll followed by its blank back", dollAt(now) % 2 === 0 && now.every((l, i) => !/^Paper doll/.test(l) || /^Blank/.test(now[i + 1] || "")));
  }
  const now = gen(KLU, mkCtx(KLU, { ladders: nl() })).student, wasS = genOld(KLU, mkCtx(KLU)).student;
  ok("the daily pages themselves are unchanged (nothing squeezed onto them)", now.split('<div class="page-label">').filter((s) => /^Daily Page/.test(s)).join("|") === wasS.split('<div class="page-label">').filter((s) => /^Daily Page/.test(s)).join("|"));
  const pk = gen(KPK[0], mkCtx(KPK[0], { ladders: nl({ lv: "prek" }) })).student, pk0 = genOld(KPK[0], mkCtx(KPK[0])).student;
  const dp = (h) => h.split('<div class="page-label">').filter((s) => /^Daily Page/.test(s)).map((s) => s.replace(/\s*(<\/body>[\s\S]*)?$/, "")).join("|");
  ok("the Pre-K daily pages are unchanged too", dp(pk) === dp(pk0));
}

// ════════════════════════════════════ (g) the tablet tags ════════════════════════════════════
console.log("(g) the tablet's Today list");
for (const [kid, extra, lv] of [[KPK[0], {}, "prek"], [KLU, {}, "g1"], ["kidt", PKX("k", "sports"), "k"]]) {
  const out = gen(kid, mkCtx(kid, Object.assign({ ladders: nl({ lv }), nbPageTags: true }, extra))), np = numPages(out.student);
  ok(lv + ": the page is tagged as an any-time page of the week, 'Number thinking'", np.length === 1 && np[0].indexOf('<div class="page" data-nb-day="week" data-nb-name="Number thinking">') > 0);
  const oldT = genOld(kid, mkCtx(kid, Object.assign({ nbPageTags: true }, extra))).student;
  const css = kid === KLU ? I.LNT_CSS_LU : I.LNT_CSS_PK;
  const rest = out.student.replace(css, "").replace(np[0].replace(/^<div class="page-label">/, '<div class="page-label">') + "\n", "");
  ok(lv + ": every other page keeps the tags it had (the document is otherwise the same)", rest === oldT);
  ok(lv + ": paper (no tags) has no data-nb attributes on the page", numPages(gen(kid, mkCtx(kid, Object.assign({ ladders: nl({ lv }) }, extra))).student)[0].indexOf("data-nb-") < 0);
}

// ════════════════════════════════════ (h) the place ════════════════════════════════════
console.log("(h) the place: same week, next week, level end, the harder stage, a bank, the end");
{
  const ids = (o) => { const np = numPages(o.student)[0] || ""; return qBlocks(np).length; };
  const qsOf = (ctx) => ctx.ladders.number.next.items.map((x) => x.id);
  const c12 = mkCtx(KLU, { ladders: nl({ lv: "g1" }, 12) }), w12 = gen(KLU, c12), cur = w12.numberLadderCursor;
  const c12b = mkCtx(KLU, { ladders: nl({ lv: "g1", cur }, 12) }), again = gen(KLU, c12b);
  ok("the same week built again with the saved place → the same five questions, the same page, the same cursor", JSON.stringify(qsOf(c12b)) === JSON.stringify(qsOf(c12)) && numPages(again.student)[0] === numPages(w12.student)[0] && JSON.stringify(again.numberLadderCursor) === JSON.stringify(cur));
  const c13 = mkCtx(KLU, { weekNum: "week13", ladders: nl({ lv: "g1", cur }, 13) }), w13 = gen(KLU, c13);
  ok("next week moves on: questions 6–10", JSON.stringify(qsOf(c13)) === JSON.stringify(TN.levels.g1.items.slice(5, 10).map((x) => x.id)) && w13.numberLadderCursor.from === 5 && w13.numberLadderCursor.adv === 5 && /questions 6–10 of 60/.test(numPages(w13.student)[0]));
  const cK = mkCtx(KPK[0], { weekNum: "week13", ladders: nl({ lv: "k", cur: { week: 12, lv: "k", from: 52, adv: 5, opt: false } }, 13) }), oK = gen(KPK[0], cK);
  ok("the end of K climbs by itself: the last three K questions, then the first two of 1st grade — the 1st-grade ones read by the child", JSON.stringify(qsOf(cK)) === JSON.stringify(TN.levels.k.items.slice(57).concat(TN.levels.g1.items.slice(0, 2)).map((x) => x.id)) &&
    qBlocks(numPages(oK.student)[0]).map((q) => q.indexOf("Read aloud") > 0).join() === "true,true,true,false,false" && /Kindergarten · questions 58–60 of 60 · then 1st grade · questions 1–2 of 60/.test(ansPages(oK.parent)[0]));
  const optOff = nl({ lv: "g5", cur: { week: 12, lv: "g5", from: 55, adv: 5, opt: false } }, 13), optOn = nl({ lv: "g5", opt: true, cur: { week: 12, lv: "g5", from: 55, adv: 5, opt: false } }, 13);
  ok("the harder stage stays off unless switched on: off → the 4th-grade bank next (no page); on → the stage's first five", optOff.number.next.items.length === 0 && optOff.number.next.stop && optOn.number.next.items.length === 5 && optOn.number.next.items.every((x) => x.item.opt === true) &&
    numPages(gen(KLU, mkCtx(KLU, { weekNum: "week13", ladders: optOn })).student).length === 1 && numPages(gen(KLU, mkCtx(KLU, { weekNum: "week13", ladders: optOff })).student).length === 0);
  const toBank = gen(KLU, mkCtx(KLU, { weekNum: "week13", ladders: nl({ lv: "g3", cur: { week: 12, lv: "g3", from: 53, adv: 5, opt: false } }, 13) }));
  ok("two left before the 4th-grade bank → a page of two, the answers page says the bank is next", qBlocks(numPages(toBank.student)[0]).length === 2 && toBank.numberLadderCursor.adv === 2 && /reaches the 4th-grade question bank/.test(ansPages(toBank.parent)[0]));
  const lastW = gen(KLU, mkCtx(KLU, { weekNum: "week13", ladders: nl({ lv: "g8", cur: { week: 12, lv: "g8", from: 55, adv: 3, opt: false } }, 13) }));
  ok("the ladder's last questions → a short page that says so; the week after → nothing, as before", qBlocks(numPages(lastW.student)[0]).length === 2 && /the last questions on the ladder/.test(ansPages(lastW.parent)[0]) &&
    both(gen(KLU, mkCtx(KLU, { weekNum: "week14", ladders: nl({ lv: "g8", cur: lastW.numberLadderCursor }, 14) }))) === both(genOld(KLU, mkCtx(KLU, { weekNum: "week14" }))));
  void ids;
}

// ════════════════════════════════════ (i) index.html ════════════════════════════════════
console.log("(i) index.html: the note, the waits, a failed load, the cursor save");
function sandbox(o) {
  o = o || {};
  const writes = [], fetched = [], ls = [];
  const c = {
    window: { HoweNotebooks: NB, open: () => null }, location: { hostname: "localhost" },
    notebookSettings: o.settings || {}, tab: "notebook", rendered: 0,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    HA_LS: { setItem: (k, v) => ls.push([k, v]) },
    document: { getElementById: () => ({}) },
    cap: (k) => String(k).charAt(0).toUpperCase() + String(k).slice(1),
    nbLevelGrade: (k) => ({ key: (o.grade || {})[k] || "1", from: "family" }), nbQbList: () => [], nbTargetWkNum: () => 12,
    nbThemeOf: (k) => ((o.themes || {})[k] || null), nbLevelOf: () => null,
    db: o.noDb ? null : { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    fetch: (u) => { fetched.push(u); if (o.offline) return Promise.reject(new TypeError("Failed to fetch")); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(/read_and/.test(u) ? READ : NUM) }); },
    console, Promise, JSON, Object, String, Array, Date, parseInt, isNaN, setTimeout,
  };
  c.renderNotebook = () => { c.rendered++; };
  vm.createContext(c);
  vm.runInContext(ldBlk + "\n" + lrBlk + "\n" + ixBlk + "\nthis._nbLadData=_nbLadData; this._nbLadFail=_nbLadFail; this._nbLadOpen=_nbLadOpen; this.NBLADDER_PAGES_NOTE=NBLADDER_PAGES_NOTE; this.NBLADREAD_LOAD_FAIL=NBLADREAD_LOAD_FAIL; this.NBLADNUM_LOAD_FAIL=NBLADNUM_LOAD_FAIL; this.NBLADREAD_NUM_NOTE=NBLADREAD_NUM_NOTE;", c);
  c.writes = writes; c.fetched = fetched; c.ls = ls;
  return c;
}
const PKID = KPK[0], OKID = KOLD[0];
(async () => {
  // ── the card's note ──
  {
    const st = { [KLU]: { ladders: { number: { on: true, lv: "g1" } } }, [PKID]: { ladders: { number: { on: true } } }, kidt: { ladders: { number: { on: true } } }, [OKID]: { ladders: { number: { on: true, lv: "g5" } } }, kidz: { ladders: { number: { on: true, lv: "g1" } } } };
    const c = sandbox({ settings: st, themes: { kidt: "farm" }, grade: { [PKID]: "PreK", kidt: "K", [OKID]: "5" } });
    c._nbLadData.reading = READ; c._nbLadData.number = NUM; [KLU, PKID, "kidt", OKID, "kidz"].forEach((k) => (c._nbLadOpen[k] = true));
    const h = (k) => c.nbLadderCardHtml(k);
    ok("1st-grade notebook: the reading line as before, and 'Number thinking: prints in the notebook as a page of its own — 5 questions a week, read by the child'",
      /📖 Reading passages: when it’s on, it prints in the notebook on the 2nd and 4th/.test(h(KLU)) && /🔢 Number thinking: prints in the notebook as a page of its own — 5 questions a week, read by the child — with the answers on a page for you in the parent copy\./.test(h(KLU)) && h(KLU).indexOf(c.NBLADREAD_NUM_NOTE) < 0);
    ok("a built-in Pre-K notebook: reading 'don’t print in this notebook', number 'done with a grown-up who reads each one aloud'", /📖 Reading passages: don’t print in this notebook\./.test(h(PKID)) && /🔢 Number thinking: prints in the notebook as a page of its own — 5 questions a week, done with a grown-up who reads each one aloud/.test(h(PKID)));
    ok("a kid on a Pre-K look at K: the same", /done with a grown-up who reads each one aloud/.test(h("kidt")) && h("kidt").indexOf(c.NBLADDER_PAGES_NOTE) < 0);
    // Hub merge with NBLADREAD3 (the 4th- and 6th-grade notebooks print reading now): an older notebook's note is its reading line + the number 'not yet' line; the starter keeps the whole 'not yet' note.
    ok("an older notebook: the number 'not yet' line under its reading line; the starter: the 'not yet' wording, as before", h(OKID).indexOf(c.NBLADREAD_NUM_NOTE) > 0 && h("kidz").indexOf(c.NBLADDER_PAGES_NOTE) > 0 && !/as a page of its own/.test(h(OKID) + h("kidz")));
    c.notebookSettings[PKID].ladders.number.on = false;
    ok("number off: 'when it’s on, it prints in the notebook as a page of its own'", /Number thinking: when it’s on, it prints in the notebook as a page of its own/.test(h(PKID)));
    c.notebookSettings[KLU].ladders.number = { on: true, lv: "g8", cur: { week: 12, lv: "g8", from: 59, adv: 1, opt: false } };
    ok("ladder finished: the card says no number page prints", /the last level is finished, so no number page prints/.test(h(KLU)));
    c.notebookSettings[KLU].ladders.number = { on: true, lv: "g3", cur: { week: 12, lv: "g3", from: 55, adv: 5, opt: false } };
    ok("at the question bank: the card says no number page prints until the next level is picked", /the ladder is at the question bank, so no number page prints until you pick the next level/.test(h(KLU)));
    ok("drawing the card wrote nothing", c.writes.length === 0 && c.ls.length === 0);
  }
  // ── the cursor save ──
  {
    const P = "notebookSettings/" + KLU + "/ladders/number/cur";
    const out12 = gen(KLU, mkCtx(KLU, { ladders: nl({ lv: "g1" }, 12) })), nc = out12.numberLadderCursor;
    const c = sandbox({ settings: { [KLU]: { ladders: { number: { on: true, lv: "g1" } } } } });
    c.nbLadReadPersist(KLU, out12);
    ok("after a build (through nbLadReadPersist, so Print/Look, PDF and the tablet send all do it): ONE write of one field — …/ladders/number/cur", JSON.stringify(c.writes) === JSON.stringify([["set", P, nc]]));
    const again = gen(KLU, mkCtx(KLU, { ladders: nl({ lv: "g1", cur: c.notebookSettings[KLU].ladders.number.cur }, 12) }));
    c.nbLadReadPersist(KLU, again);
    ok("the same week built again → the same cursor, nothing written", JSON.stringify(again.numberLadderCursor) === JSON.stringify(nc) && c.writes.length === 1);
    c.nbLadNumPersist(KLU, { numberLadderCursor: Object.assign({}, nc, { week: 13, from: 5 }) });
    ok("next week → written once more", c.writes.length === 2 && c.writes[1][1] === P);
    c.nbLadNumPersist(KLU, {}); c.nbLadNumPersist(KLU, null); c.nbLadReadPersist(KLU, { numberCursor: { week: 12, from: 1, adv: 5 } });
    ok("no number page printed (no cursor), or only the Pre-K number card's own cursor → nothing", c.writes.length === 2);
    const cR = sandbox({ settings: { [KLU]: { ladders: { number: { on: true, lv: "g1" }, reading: { on: true, lv: "g1" } } } } });
    cR.nbLadReadPersist(KLU, { numberLadderCursor: nc, readingCursor: { week: 12, lv: "g1", from: 0, adv: 2, opt: false } });
    ok("with reading too: one write each, to their own fields", cR.writes.length === 2 && cR.writes.map((w) => w[1].split("/").slice(-2).join("/")).sort().join(",") === "number/cur,reading/cur");
    const cM = sandbox({ mom: false }); cM.nbLadNumPersist(KLU, { numberLadderCursor: nc });
    const cD = sandbox({ dry: true }); cD.nbLadNumPersist(KLU, { numberLadderCursor: nc });
    const cN = sandbox({ noDb: true }); cN.nbLadNumPersist(KLU, { numberLadderCursor: nc });
    ok("not Mom / ?dryrun=1 / no database → nothing written and nothing kept", cM.writes.length + cD.writes.length + cN.writes.length === 0 && cM.ls.length + cD.ls.length + cN.ls.length === 0);
    const fnAt = (sig) => { const a = IX.indexOf(sig); return IX.slice(a, IX.indexOf("\n}\n", a)); };
    const open = fnAt("async function haNbOpen(kid,which){"), pdf = fnAt("async function haNbPdf(kid,which){"), nbt = fnAt("function nbtPersistCursors(kid,out){"), send = fnAt("async function nbtSend(kid){");
    ok("the save rides nbLadReadPersist, which Print/Look, PDF and the tablet send's cursor list each call once", [open, pdf, nbt].every((f) => f.indexOf("nbLadReadPersist(kid,out);") > 0) && send.indexOf("nbtPersistCursors(kid,out);") > 0 &&
      fnAt("function nbLadReadPersist(kid,out){").indexOf("nbLadNumPersist(kid,out);") > 0);
  }
  // ── waiting for the file; a failed load ──
  {
    const on = { settings: { [PKID]: { ladders: { number: { on: true } } }, kidz: { ladders: { number: { on: true, lv: "g1" } } } }, grade: { [PKID]: "PreK" } };
    const c = sandbox(on);
    const m = await c.nbLadReadReady(PKID);
    ok("number on, a notebook that prints it → the number file is fetched before the build (the same wait every Mom build already makes); no note", m === "" && c.fetched.length === 1 && /number_thinking/.test(c.fetched[0]) && c._nbLadData.number === NUM);
    const lc = clone(c.nbLadderCtx(PKID));
    ok("…so ctx.ladders.number is ready with this week's five questions, and the notebook prints them", lc.number.ready === true && lc.number.next.items.length === 5 && numPages(gen(PKID, mkCtx(PKID, { ladders: lc })).student).length === 1);
    const cz = sandbox(on); const mz = await cz.nbLadReadReady("kidz"); const coff = sandbox({}); const moff = await coff.nbLadReadReady(PKID);
    ok("a notebook that prints none, or the ladder off → nothing fetched, no note", mz === "" && cz.fetched.length === 0 && moff === "" && coff.fetched.length === 0);
    const cx = sandbox(Object.assign({ offline: true }, on));
    const mx = await cx.nbLadReadReady(PKID);
    ok("offline → the plain note for Mom (where to look: the Ladders card)", mx === cx.NBLADNUM_LOAD_FAIL && /couldn’t load \(check the internet\)/.test(mx) && /Ladders card on the Notebook tab/.test(mx));
    const lx = clone(cx.nbLadderCtx(PKID)), outx = gen(PKID, mkCtx(PKID, { ladders: lx }));
    ok("…the notebook builds exactly as before (no number page, no cursor)", lx.number.ready === false && both(outx) === both(genOld(PKID, mkCtx(PKID))) && !("numberLadderCursor" in outx));
    const cxr = sandbox({ offline: true, settings: { [KLU]: { ladders: { number: { on: true, lv: "g1" }, reading: { on: true, lv: "g1" } } } } });
    const mxr = await cxr.nbLadReadReady(KLU);
    ok("both ladders on and offline → both notes, reading's first", mxr === cxr.NBLADREAD_LOAD_FAIL + " " + cxr.NBLADNUM_LOAD_FAIL);
    const ca = sandbox(on); const ma = await ca.nbLadReadReadyAll(); const ca2 = sandbox({ settings: { kidz: { ladders: { number: { on: true } } } } }); const ma2 = await ca2.nbLadReadReadyAll();
    ok("combined guide: the number file fetched only when some kid's notebook prints it", ma === "" && ca.fetched.length === 1 && /number_thinking/.test(ca.fetched[0]) && ma2 === "" && ca2.fetched.length === 0);
  }

  // ════════════════════════════════════ (j) page fit ════════════════════════════════════
  console.log("(j) page fit (8.5×11in, overflow hidden) — Google Chrome headless, each notebook's own CSS");
  const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(CHROME)) { console.log("  page measurement — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)"); return done(); }
  const MEASURE = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      var lab = pg.getAttribute("data-lab") || ((pg.previousElementSibling && pg.previousElementSibling.className === "page-label") ? pg.previousElementSibling.textContent : "");
      var b = pg.querySelector(".body"), r = pg.getBoundingClientRect(), out = { lab: lab, h: Math.round(r.height), wide: pg.scrollWidth - pg.clientWidth, clip: pg.scrollHeight - pg.clientHeight, qwide: 0 };
      if (b) { var low = 0; [].forEach.call(b.children, function (c) { var y = c.getBoundingClientRect().bottom; if (y > low) low = y; });
        out.spare = Math.round(b.getBoundingClientRect().bottom - parseFloat(getComputedStyle(b).paddingBottom) - low); out.clip = Math.max(out.clip, b.scrollHeight - b.clientHeight); }
      [].forEach.call(pg.querySelectorAll(".lnt-q"), function (q) { var qr = q.getBoundingClientRect(); [].forEach.call(q.querySelectorAll("*"), function (e) { var d = Math.round(e.getBoundingClientRect().right - qr.right); if (d > out.qwide) out.qwide = d; }); });
      return out;
    });
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladnum-"));
  let active = 0; const waitQ = [];
  const slot = () => new Promise((r) => { if (active < 6) { active++; r(); } else waitQ.push(r); });
  const free = () => { active--; if (waitQ.length) { active++; waitQ.shift()(); } };
  // Chrome prints the DOM and then can take a long while to quit here — read stdout as it comes and stop it once the result is in.
  const run1 = (f, tag) => new Promise((res) => {
    const ch = cp.spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof_" + tag), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"] });
    let buf = "", t = setTimeout(() => { try { ch.kill("SIGKILL"); } catch (e) {} res(null); }, 120000);
    ch.stdout.on("data", (d) => { buf += d; const m = /data-r="([^"]*)"/.exec(buf); if (m) { clearTimeout(t); try { ch.kill("SIGKILL"); } catch (e) {} res(JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"))); } });
    ch.on("exit", () => { clearTimeout(t); res(null); });
  });
  const run = async (html, tag) => {
    const f = path.join(dir, tag + ".html");
    fs.writeFileSync(f, html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace(/<\/body>(?![\s\S]*<\/body>)/, "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body>"));
    await slot();
    try { for (let k = 0; k < 3; k++) { const r = await run1(f, tag + "_" + k); if (r) return r; } return null; } finally { free(); }
  };
  // a document = the notebook's own head + chosen pages (every page carries its own label)
  const docOf = (html, pages) => html.slice(0, html.indexOf("<body>") + 6) + "\n" + pages.join("\n") + "\n</body>\n</html>";
  // every week of the level from its start, plus one that crosses into the next level (its last three, then two more)
  const weeks = (lv, opt) => { const n = TN.levels[lv].items.filter((it) => opt || !it.opt).length, out = []; for (let f = 0; f < n; f += 5) out.push({ lv, opt: !!opt, cur: { week: 11, lv, from: Math.max(0, f - 5), adv: f ? 5 : 0, opt: !!opt } });
    out.push({ lv, opt: !!opt, cur: { week: 11, lv, from: n - 8, adv: 5, opt: !!opt } }); return out; };
  const jobs = [];
  // Pre-K and K: every week of the level, in every look (and K with find-it + little letters, which adds its own CSS)
  for (const th of LOOKS) for (const lv of ["prek", "k"]) {
    const extra = lv === "k" ? Object.assign(PKX("k", th), { nbLevel: { nbFindIt: true, nbLowercase: true, nbTeens: true } }) : PKX("prek", th);
    const st = [], pa = []; let head = "", headP = "";
    weeks(lv).forEach((w, k) => { const cur = k ? w.cur : null; const o = gen("kidt", mkCtx("kidt", Object.assign({ weekNum: "week12", ladders: nl({ lv, cur: cur && Object.assign({}, cur, { week: 11 }) }, 12) }, extra)));
      if (!head) { head = o.student; headP = o.parent; }
      st.push(numPages(o.student)[0].replace('<div class="page">', '<div class="page" data-lab="' + th + "|" + lv + "|w" + (k + 1) + '">').replace(/<div class="page" data-nb[^>]*>/, (m) => m));
      pa.push(ansPages(o.parent)[0].replace('<div class="page">', '<div class="page" data-lab="ans|' + th + "|" + lv + "|w" + (k + 1) + '">')); });
    jobs.push(run(docOf(head, st.concat(pa)), "pk_" + th + "_" + lv).then((r) => ({ key: th + " " + lv, r, n: st.length })));
  }
  // the 1st-grade notebook: every week of every level it could climb to (the harder stage on, so it is in)
  for (const lv of ["prek", "k", "g1", "g2", "g3", "g5", "g7", "g8"]) {
    const st = [], pa = []; let head = "", headP = "";
    weeks(lv, true).forEach((w, k) => { const o = gen(KLU, mkCtx(KLU, { ladders: nl({ lv, opt: true, cur: k ? Object.assign({}, w.cur, { opt: true }) : null }, 12) }));
      if (!head) { head = o.student; headP = o.parent; }
      st.push(numPages(o.student)[0].replace('<div class="page">', '<div class="page" data-lab="lu|' + lv + "|w" + (k + 1) + '">'));
      pa.push(ansPages(o.parent)[0].replace('<div class="page">', '<div class="page" data-lab="ans|lu|' + lv + "|w" + (k + 1) + '">')); });
    jobs.push(run(docOf(head, st), "lu_" + lv).then((r) => ({ key: "1st-grade notebook " + lv, r, n: st.length })));
    jobs.push(run(docOf(headP, pa), "lup_" + lv).then((r) => ({ key: "1st-grade Companion " + lv, r, n: pa.length })));
  }
  const res = await Promise.all(jobs);
  if (res.some((x) => !x.r)) { console.log("  page measurement — SKIPPED (Google Chrome would not run headless here: " + res.filter((x) => !x.r).map((x) => x.key).join(", ") + ")"); return done(); }
  console.log("  measured with Google Chrome headless; web fonts NOT loaded (Nunito / Fredoka One are not on this Mac — the fallback sans is used, as in the other notebook fit tests)");
  const fitLine = (pp) => pp.every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0 && p.wide <= 0 && p.qwide <= 1);
  const summary = [];
  for (const x of res) {
    const kids = x.r.filter((p) => !/^ans\|/.test(p.lab)), ans = x.r.filter((p) => /^ans\|/.test(p.lab));
    if (/Companion/.test(x.key)) { const tight = x.r.slice().sort((a, b) => a.spare - b.spare)[0]; ok(x.key + ": all " + x.r.length + " answer pages fit (tightest " + tight.spare + "px spare)", x.r.length === x.n && fitLine(x.r), x.r.filter((p) => !fitLine([p]))); summary.push(x.key + " ans " + tight.spare); continue; }
    const tight = kids.slice().sort((a, b) => a.spare - b.spare)[0], tightA = ans.length ? ans.slice().sort((a, b) => a.spare - b.spare)[0] : null;
    ok(x.key + ": all " + kids.length + " weeks fit — nothing clipped, nothing wider than its box (tightest " + tight.lab.split("|").pop() + " " + tight.spare + "px spare)" + (tightA ? "; answers page tightest " + tightA.spare + "px" : ""),
      kids.length === x.n && fitLine(kids) && (!ans.length || (ans.length === x.n && fitLine(ans))), x.r.filter((p) => !fitLine([p])).slice(0, 3));
    summary.push(x.key + " " + tight.spare + (tightA ? "/" + tightA.spare : ""));
  }
  console.log("  tightest spare px (child page / answers page): " + summary.join(" · "));

  // ════════════════════════════════════ (k) one a day on the daily page? ════════════════════════════════════
  // Not built — measured, for the report: the smallest question box ({w:300,h:56,choice:56}, the size NBLADPIC calls the smallest
  // to use) added to each daily page. A Pre-K / K daily page is laid out to fill the sheet (and some set-ups are already over);
  // the 1st-grade daily page is flex-full — any box shrinks its rating table and draw boxes.
  console.log("(k) one question a school day on the daily page — measured only (not built)");
  const MEAS2 = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      var lab = (pg.previousElementSibling && pg.previousElementSibling.className === "page-label") ? pg.previousElementSibling.textContent : "", worst = 0, hs = {};
      [].forEach.call(pg.querySelectorAll("*"), function (el) { var cs = getComputedStyle(el); if (cs.overflow === "hidden" || cs.overflowY === "hidden") { var d = el.scrollHeight - el.clientHeight; if (d > worst) worst = d; } });
      (function walk(el, p, d) { if (d > 6) return; [].forEach.call(el.children, function (c, i) { var k = p + "/" + i; hs[k] = Math.round(c.getBoundingClientRect().height); walk(c, k, d + 1); }); })(pg.querySelector(".body") || pg, "", 0);
      return { lab: lab, clip: worst, hs: hs };
    });
  };
  const runK = async (html, tag) => { const f = path.join(dir, tag + ".html"); fs.writeFileSync(f, html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace(/<\/body>(?![\s\S]*<\/body>)/, "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEAS2.toString() + ")()));});</script></body>"));
    await slot(); try { for (let k = 0; k < 3; k++) { const r = await run1(f, tag + "_" + k); if (r) return r; } return null; } finally { free(); } };
  const small = (x) => { const keep = clone(I.LNT_PIC); I.LNT_PIC.grown = { w: 300, h: 56, choice: 56 }; I.LNT_PIC.alone = { w: 300, h: 56, choice: 56 }; const h = I.lntQ(x, 1); I.LNT_PIC.grown = keep.grown; I.LNT_PIC.alone = keep.alone; return h.replace('<div class="lnt-q">', '<div class="lnt-q" style="flex-shrink:0;padding:4px 10px 6px">'); };
  const kX = { lv: "k", label: "Kindergarten", num: 1, of: 60, item: TN.levels.k.items[0] }, gX = { lv: "g1", label: "1st grade", num: 2, of: 60, item: TN.levels.g1.items[1] };
  const addBox = (html, box, css) => html.replace("</style>", css + "</style>").split('<div class="page-label">').map((p, i) => { if (!i || !/^Daily Page/.test(p)) return i ? '<div class="page-label">' + p : p;
    const k = p.lastIndexOf('<div class="footer'), q = p.slice(0, k), j = q.lastIndexOf("</div>"); return '<div class="page-label">' + q.slice(0, j) + box + "\n" + q.slice(j) + p.slice(k); }).join("");
  const kcases = [["1st grade", KLU, {}, gX, I.LNT_CSS_LU]].concat(LOOKS.map((th) => ["Pre-K " + th, "kidt", PKX("prek", th), kX, I.LNT_CSS_PK]), LOOKS.map((th) => ["K+find-it " + th, "kidt", Object.assign(PKX("k", th), { nbLevel: { nbFindIt: true, nbLowercase: true, nbTeens: true } }), kX, I.LNT_CSS_PK]));
  const kres = await Promise.all(kcases.map(async ([name, kid, extra, x, css]) => {
    const html = gen(kid, mkCtx(kid, extra)).student, a = await runK(html, "k0_" + name.replace(/\W+/g, "_")), b = await runK(addBox(html, small(x), css), "k1_" + name.replace(/\W+/g, "_"));
    if (!a || !b) return { name, skip: true };
    const d0 = a.filter((p) => /^Daily Page/.test(p.lab)), d1 = b.filter((p) => /^Daily Page/.test(p.lab));
    let worstShrink = 0, clipBefore = 0, clipAfter = 0;
    d1.forEach((p, i) => { const q = d0[i]; clipBefore = Math.max(clipBefore, q.clip); clipAfter = Math.max(clipAfter, p.clip);
      Object.keys(q.hs).forEach((k) => { if (p.hs[k] != null && q.hs[k] - p.hs[k] > worstShrink) worstShrink = q.hs[k] - p.hs[k]; }); });
    return { name, clipBefore, clipAfter, worstShrink };
  }));
  if (kres.some((x) => x.skip)) console.log("  per-day box measurement — SKIPPED for: " + kres.filter((x) => x.skip).map((x) => x.name).join(", "));
  kres.filter((x) => !x.skip).forEach((x) => console.log("  " + x.name + ": clipped before " + x.clipBefore + "px → with a daily box " + x.clipAfter + "px; something else on the page shrinks by up to " + x.worstShrink + "px"));
  if (kres.some((x) => !x.skip)) console.log("  → a daily box " + (kres.filter((x) => !x.skip).every((x) => x.clipAfter > x.clipBefore || x.worstShrink >= 40) ? "clips or squeezes every daily page measured, so the questions stay on a page of their own" : "fits somewhere — see the lines above"));
  done();
})().catch((e) => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
function done() { console.log(pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0); }
