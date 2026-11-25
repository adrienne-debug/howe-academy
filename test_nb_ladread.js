// 📖 NBLADREAD — "Read and answer" in the 1st-grade notebook, slice 2 of the notebook ladders (notebooks study, her words
// 2026-11-23/24: "Build it"; reading "twice a week sounds great"; 1st grade "She reads them"). Run: node test_nb_ladread.js
//  (a) the blocks: one in each file, no family names, no answer giver; the 1st-grade notebook is found through
//      HoweNotebooks.ladderPages (the test names no kid)
//  (b) off / not loaded / no items / ladder finished → every notebook byte for byte = THIS tree with the NBLADREAD block and its
//      call sites cut out (built below — no git, no pinned commit); every OTHER notebook unchanged even with reading on
//  (c) on → exactly the engine's passages, one page each, on the right days (default 2nd + 4th school day, saved ticks, short weeks)
//  (d) no answer, no why line, no mark on the right choice, no extra attribute on any child page — every passage in the file
//  (e) the Teaching Companion page: day, title, level, right letter + its words, the why line
//  (f) where the pages sit: every page that existed keeps its place; the paper dolls still land on a sheet front
//  (g) the tablet tags; (h) the place: same week twice = same passages, next week moves on, level end moves up, the end
//  (i) index.html: the day ticks (one field, Mom only, dry-run inert), the note per notebook, the cursor save (when, one field,
//      Mom only, dry-run inert), every Mom print path waits for the file, a failed load builds as before + a plain note
//  (j) page fit in Google Chrome headless with the notebook's own CSS: every passage page at every level + the Companion
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
// slice 3 (NBLADREAD3, test_nb_ladread3.js) is cut out first: this test checks slice 2 as it stands on its own (SRC0); the
// built notebook (NB) is the whole file, so every check below also holds with slice 3 in it.
const SRC_ALL = rd("notebooks.js"), IX = rd("index.html");
const cut3 = (s) => { const a = s.indexOf("  // NBLADREAD3_START"), b = s.indexOf("  // NBLADREAD3_END\n\n"); if (a > 0 && b > a) s = s.slice(0, a) + s.slice(b + "  // NBLADREAD3_END\n\n".length); return s.split("\n").filter((l) => !/NBLADREAD3/.test(l)).join("\n"); };
const SRC = cut3(SRC_ALL), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");

// ════════════════════════════════════ (a) the blocks ════════════════════════════════════
console.log("(a) the blocks");
const B0 = SRC.indexOf("  // NBLADREAD_START"), B1 = SRC.indexOf("  // NBLADREAD_END\n\n");
const I0 = IX.indexOf("// NBLADREAD_START"), I1 = IX.indexOf("// NBLADREAD_END\n");
ok("one NBLADREAD block in notebooks.js, right after LU_MATH_END", B0 === SRC.indexOf("  // LU_MATH_END\n\n") + "  // LU_MATH_END\n\n".length && B1 > B0 && SRC.indexOf("NBLADREAD_START", B0 + 20) < 0);
ok("one NBLADREAD block in index.html, right after NBLADDER_END", I0 === IX.indexOf("// NBLADDER_END\n") + "// NBLADDER_END\n".length && I1 > I0 && IX.indexOf("NBLADREAD_START", I0 + 5) < 0);
const nbBlk = SRC.slice(B0, B1), ixBlk = IX.slice(I0, I1);
const ldBlk = IX.slice(IX.indexOf("// NBLADDER_START"), IX.indexOf("// NBLADDER_END\n"));
ok("no kid or family name in either block", !NAMES.test(code(nbBlk)) && !NAMES.test(ixBlk), (code(nbBlk).match(NAMES) || ixBlk.match(NAMES) || [])[0]);
ok("notebooks.js block: no DOM, no Firebase", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(nbBlk)));
ok("index.html block: no db.ref of its own (writes go through nbLadderWrite)", !/db\.ref\(/.test(ixBlk) && (ixBlk.match(/nbLadderWrite\(/g) || []).length === 2);
const words = (s) => (code(s).match(/'[^']*'|"[^"]*"/g) || []).join(" ").replace(/<[^>]*>/g, " ");
ok("no he/his/him/she/her in either block's words", !/\b(he|his|him|she|her)\b/i.test(words(nbBlk)) && !/\b(he|his|him|she|her)\b/i.test(words(ixBlk)));
ok("no 🔀 in index.html", IX.indexOf("\u{1F500}") < 0);
ok("no CSS text columns on the page (the PDF maker doesn't follow them) — a long poem uses two plain grid columns", !/column-count|column-width|(^|[^-])columns\s*:/.test(nbBlk));
const gLucy0 = SRC.indexOf("  function generateLucy(ctx) {"), gLucy = SRC.slice(gLucy0, SRC.indexOf("\n  }\n", gLucy0));
const sites = gLucy.split("\n").filter((l) => /NBLADREAD/.test(l));
ok("five marked call sites in the 1st-grade builder, each a single line", sites.length === 5 && sites.every((l) => /\/\/ NBLADREAD/.test(l)));
ok("exported once: HoweNotebooks.ladderPages", SRC.split("ladderPages: nbLadReadPages,").length === 2);
ok("index.html's marked call sites: card ×2, state, write list, print paths", (IX.match(/\/\/ 📖 NBLADREAD/g) || []).length === 14, (IX.match(/\/\/ 📖 NBLADREAD/g) || []).length);
ok("nothing outside the two ladder blocks touches the ladders in Firebase", (() => { const r = IX.replace(ldBlk, "").replace(ixBlk, ""); return r.indexOf("/ladders/") < 0 && r.indexOf(".ladders") < 0; })());

// ════════════════════════════════════ load: now + the baseline ════════════════════════════════════
const HOOK = "_internal: {";
const T_HOOK = HOOK + " lrDays: lrDays, lrWeek: lrWeek, lrPage: lrPage, lrCompanion: lrCompanion, lrTier: lrTier, LR_CSS: LR_CSS, luShell: luShell,";
let BASE = SRC.slice(0, B0) + SRC.slice(B1 + "  // NBLADREAD_END\n\n".length);
const cut = BASE.split("\n").filter((l) => /NBLADREAD/.test(l));
BASE = BASE.split("\n").filter((l) => !/NBLADREAD/.test(l)).join("\n");
ok("the baseline cut takes only comment lines and marked call sites", cut.every((l) => /^\s*\/\//.test(l) || /\/\/ (📖 )?NBLADREAD/.test(l)) && cut.length === 8, cut.length);
ok("the baseline has no trace of the block", !/lrWeek|lrPage|lrCompanion|LR_CSS|nbLadReadPages|readingCursor/.test(BASE));
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const NB = load(SRC_ALL.replace(HOOK, T_HOOK)), OLD = load(BASE), I = NB._internal, L = NB.ladders;
const K1 = Object.keys(NB.GENERATORS).filter((k) => NB.ladderPages(k).reading && NB.GENERATORS[k].build === I.generateLucy);
ok("the 1st-grade notebook prints the reading ladder (slice 3 adds the 4th- and 6th-grade ones — test_nb_ladread3.js)", K1.length === 1, K1);
const KID = K1[0];
ok("…a starter notebook and a Pre-K look print none; nothing prints the number ladder yet",
  NB.ladderPages("kidz").reading === false && NB.ladderPages("kidt", { notebookTheme: Object.keys(NB.themes)[0] }).reading === false && NB.ladderPages(KID).number === false);
const TR = L.track("reading", READ);

// ── fixtures (made-up week, no family data) ──
const DATES = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Math Book — p. 12", "📱 Reading App — Lesson 4", "📖 Closing Notebook — Closing Notebook"];
const mkDates = (ds) => { const o = {}; ds.forEach((d) => (o[d] = DATES[d])); return o; };
const mkCtx = (extra, ds) => {
  ds = ds || Object.keys(DATES);
  return Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates: mkDates(ds), tasks: ds.flatMap((d) => T5.map((t) => ({ who: KID, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {} }, extra || {});
};
// ctx.ladders.reading the way index.html builds it (nbLadderCtx), straight from the engine
const rl = (st, wk) => { st = Object.assign({ on: true, lv: "g1", opt: false, cur: null, days: null }, st || {}); return { reading: Object.assign({}, st, { lvFrom: "saved", ready: true, next: L.next(TR, st, wk || 12, 2) }) }; };
const gen = (ctx, kid) => NB.generate(kid || KID, clone(ctx));
const genOld = (ctx, kid) => OLD.generate(kid || KID, clone(ctx));
const both = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
// every page's label, in order ("" when a page has none)
const pagesOf = (html) => { const out = [], re = /(?:<div class="page-label">([^<]*)<\/div>\s*)?<div class="page"[ >]/g; let m; while ((m = re.exec(html))) out.push(m[1] || ""); return out; };
// the reading pages' markup (label → end of the page)
const readingPages = (html) => html.split('<div class="page-label">').filter((s) => /^Read and Answer — /.test(s)).map((s) => '<div class="page-label">' + s);

// ════════════════════════════════════ (b) off → byte for byte ════════════════════════════════════
console.log("(b) off, not ready, nothing left → byte for byte as before");
{
  const r0 = rl({ lv: "g1" });
  const cases = {
    "no ladders at all": mkCtx(),
    "ladders null": mkCtx({ ladders: null }),
    "reading saved but off": mkCtx({ ladders: { reading: Object.assign({}, r0.reading, { on: false }) } }),
    "reading on, file not loaded yet (ready false, next null)": mkCtx({ ladders: { reading: Object.assign({}, r0.reading, { ready: false, next: null }) } }),
    "reading on and loaded, no items": mkCtx({ ladders: { reading: Object.assign({}, r0.reading, { next: { kind: "reading", items: [], stop: null, end: false, cursor: null } }) } }),
    "number only": mkCtx({ ladders: { number: { on: true, lv: "g1", ready: true, next: { items: [{ lv: "g1", item: { text: "1 2 ?" } }] } } } }),
    "reading finished (past the last level)": mkCtx({ ladders: rl({ lv: "g78", cur: { week: 11, lv: "g78", from: 10, adv: 1, opt: false } }, 12) }),
    "no school days this week": mkCtx({ ladders: rl({ lv: "g1" }) }, []),
    "with the tablet tags, off": mkCtx({ nbPageTags: true }),
  };
  ok("the finished-ladder fixture really is finished", cases["reading finished (past the last level)"].ladders.reading.next.end === true && cases["reading finished (past the last level)"].ladders.reading.next.items.length === 0);
  for (const [name, ctx] of Object.entries(cases)) {
    const a = gen(ctx), b = genOld(ctx);
    ok(name + ": student + Companion = before, no cursor", both(a) === both(b) && !("readingCursor" in a) && a.student.indexOf("Read and Answer") < 0);
  }
  // every other notebook, with reading ON and loaded
  const themes = Object.keys(NB.themes || {});
  const GENS = Object.keys(NB.GENERATORS).filter((k) => k !== KID && !NB.ladderPages(k).reading).map((k) => [k]).concat(themes.map((th) => ["kidt_" + th, { notebookTheme: th, nbGrade: "Pre-K", kidName: "Sam" }]), [["kidz"], [KID + "_x"]]);
  let same = 0; const diff = [];
  for (const [kid, extra] of GENS) {
    const ctx = mkCtx(Object.assign({ ladders: rl({ lv: "g2" }) }, extra || {}));
    if (both(gen(ctx, kid)) === both(genOld(ctx, kid)) && !("readingCursor" in gen(ctx, kid))) same++; else diff.push(kid);
  }
  ok("every other notebook that prints no reading (" + GENS.length + ": built-ins, every look, starter) prints the same with reading on", same === GENS.length, diff);
  const byKid = {}, byKid0 = {}; Object.keys(NB.GENERATORS).forEach((k) => { byKid[k] = mkCtx({ ladders: NB.ladderPages(k).reading ? { reading: Object.assign({}, rl().reading, { on: false }) } : rl() }); byKid0[k] = mkCtx(); });
  ok("the combined parent packet with reading off = before", NB.combinedParent(byKid) === OLD.combinedParent(byKid0));
}

// ════════════════════════════════════ (c) on → the engine's passages, on the right days ════════════════════════════════════
console.log("(c) on → one page per passage, on the right days");
{
  const ctx = mkCtx({ ladders: rl({ lv: "g1" }) }), out = gen(ctx), want = ctx.ladders.reading.next.items;
  const rp = readingPages(out.student);
  ok("a full week: 2 pages — Tuesday then Thursday", rp.length === 2 && /^<div class="page-label">Read and Answer — Tuesday</.test(rp[0]) && /^<div class="page-label">Read and Answer — Thursday</.test(rp[1]));
  ok("…the engine's two passages in order (titles), headed with the day", want.length === 2 && rp.every((p, i) => p.indexOf('<div class="lr-title">' + esc(want[i].item.title) + "</div>") > 0) &&
    rp[0].indexOf("Tuesday — Read and answer") > 0 && rp[1].indexOf("Thursday — Read and answer") > 0);
  ok("…every question and every choice of each passage is on its page", rp.every((p, i) => want[i].item.q.every((q) => p.indexOf(esc(q.text)) > 0 && q.c.every((c) => p.indexOf("</span>" + esc(c) + "</span>") > 0))));
  ok("…the kid-facing instruction a 1st grader can read", rp.every((p) => p.indexOf("Read it. Then circle the best answer.") > 0));
  ok("…the date is the day's own", rp[0].indexOf("November 17") > 0 && rp[1].indexOf("November 19") > 0);
  ok("…the footer says the level and where in it", rp[0].indexOf("1st grade · passage " + want[0].num + " of 30") > 0);
  ok("a poem keeps its line breaks", (() => { const p = Object.values(READ.passages).find((x) => x.lv === "g1" && x.kind === "poem"); const x = TR.levels.g1.items.find((it) => it.title === p.title);
    const h = I.lrPage(12, "tuesday", "", { lv: "g1", label: "1st grade", num: 1, of: 30, item: x }); return p.text.split("\n").every((ln) => h.indexOf(esc(ln)) > 0) && (h.match(/<br>/g) || []).length === p.text.split("\n").length - 1; })());
  ok("same ctx built twice → the same notebook", both(gen(ctx)) === both(gen(ctx)));
  ok("out.readingCursor = the engine's cursor (week, level, from, 2 passages)", JSON.stringify(out.readingCursor) === JSON.stringify({ week: 12, lv: "g1", from: 0, adv: 2, opt: false }));

  // the days, pure
  const D = Object.keys(DATES), dd = (ds, saved) => I.lrDays(ds, saved).join(",");
  ok("default: 2nd and 4th school day", dd(D) === "tuesday,thursday");
  ok("short weeks: 4 days (no Wed) → Tue, Fri; 3 days → Tue, Wed; 2 days → Mon, Tue; 1 day → that day; none → none",
    dd(["monday", "tuesday", "thursday", "friday"]) === "tuesday,friday" && dd(["monday", "tuesday", "wednesday"]) === "tuesday,wednesday" &&
    dd(["wednesday", "thursday"]) === "wednesday,thursday" && dd(["friday"]) === "friday" && dd([]) === "");
  ok("saved ticks: Mon + Fri; one tick → one day", dd(D, "monday friday") === "monday,friday" && dd(D, "wednesday") === "wednesday");
  ok("saved ticks that aren't school days (or junk) → the default", dd(D, "sunday") === "tuesday,thursday" && dd(D, "") === "tuesday,thursday" && dd(D, null) === "tuesday,thursday" && dd(D, 7) === "tuesday,thursday");
  ok("a ticked day off this week → the next school day, else the one before", dd(["monday", "tuesday", "wednesday", "friday"], "tuesday thursday") === "tuesday,friday" &&
    dd(["monday", "tuesday", "wednesday"], "tuesday thursday") === "tuesday,wednesday" && dd(["monday", "tuesday", "wednesday", "thursday"], "friday") === "thursday");
  ok("more than two ticks saved somehow → the first two", dd(D, "friday monday wednesday") === "monday,wednesday");
  // the days, through the builder
  const at = (c) => readingPages(gen(c).student).map((p) => /Read and Answer — (\w+)/.exec(p)[1]).join(",");
  ok("saved 'monday friday' → Monday and Friday pages", at(mkCtx({ ladders: rl({ days: "monday friday" }) })) === "Monday,Friday");
  ok("a 3-day week → Tuesday, Wednesday", at(mkCtx({ ladders: rl() }, ["monday", "tuesday", "wednesday"])) === "Tuesday,Wednesday");
  const one = gen(mkCtx({ ladders: rl() }, ["thursday"]));
  ok("a 1-day week → one page, and the cursor counts one passage", readingPages(one.student).length === 1 && one.readingCursor.adv === 1);
  const tick1 = gen(mkCtx({ ladders: rl({ days: "wednesday" }) }));
  ok("one tick → one page a week on that day, cursor adv 1", readingPages(tick1.student).length === 1 && /Read and Answer — Wednesday/.test(tick1.student) && tick1.readingCursor.adv === 1);
  const bad = rl(); bad.reading.next.items[1] = { lv: "g1", item: { title: "x" } };
  ok("a passage of the wrong shape → no reading page at all (never a broken page)", both(gen(mkCtx({ ladders: bad }))) === both(genOld(mkCtx())));
}

// ════════════════════════════════════ (d) nothing a child must produce on a child page ════════════════════════════════════
console.log("(d) no answer, no why, no mark, no extra attribute — every passage in the file");
{
  const all = []; TR.order.forEach((lv) => TR.levels[lv].items.forEach((it, i) => all.push({ lv, label: TR.levels[lv].label, i, num: i + 1, of: TR.levels[lv].items.length, id: it.id, item: it })));
  ok("all " + Object.keys(READ.passages).length + " passages render", all.length === Object.keys(READ.passages).length);
  const htmls = all.map((x) => I.lrPage(12, "tuesday", "November 17", x));
  const whyHit = [], markHit = [], attrHit = [], cHit = [];
  htmls.forEach((h, k) => {
    const p = all[k].item;
    // a why line that only quotes the passage (or a question / choice) word for word is on the page as the passage itself
    const own = p.text + "\n" + p.q.map((q) => q.text + "\n" + q.c.join("\n")).join("\n");
    p.q.forEach((q) => { if (own.indexOf(q.why) < 0 && (h.indexOf(esc(q.why)) >= 0 || h.indexOf(q.why) >= 0)) whyHit.push(p.id); });
    if (/✅|✓|✔|data-ans|lr-right|lr-ans|answer key/i.test(h)) markHit.push(p.id);
    (h.match(/<[a-z]+\s[^>]*>/g) || []).forEach((tag) => { if (!/^<[a-z]+ (class|style)="[^"]*">$/.test(tag)) attrHit.push(p.id + " " + tag); });
    const nC = p.q.reduce((a, q) => a + q.c.length, 0);
    if ((h.match(/<span class="lr-c">/g) || []).length !== nC || (h.match(/class="lr-c(?:\s[^"]*)?"/g) || []).length !== nC) cHit.push(p.id);
  });
  ok("no why line anywhere on a child page", !whyHit.length, whyHit);
  ok("no check mark, 'answer' word or answer class on a child page", !markHit.length, markHit);
  ok("no attribute but class (and the shared footer's style) on any tag of a child page — nothing hidden in an attribute", !attrHit.length, attrHit.slice(0, 3));
  ok("every choice has the same markup — the right one looks like the others", !cHit.length, cHit);
  // the whole student document of a real build, at a level with long why lines
  const out = gen(mkCtx({ ladders: rl({ lv: "g78" }), nbPageTags: true })), its = rl({ lv: "g78" }).reading.next.items;
  ok("the whole student notebook (tablet copy) has no why line of this week's passages", its.every((x) => x.item.q.every((q) => out.student.indexOf(esc(q.why)) < 0 && out.student.indexOf(q.why) < 0)));
  ok("…the only data- attributes on its reading pages are the tablet's day + name", readingPages(out.student).every((p) => (p.match(/data-[a-z-]+=/g) || []).join(",") === "data-nb-day=,data-nb-name="));
}

// ════════════════════════════════════ (e) the Companion ════════════════════════════════════
console.log("(e) the Teaching Companion");
for (const lv of ["g1", "g78"]) {
  const ctx = mkCtx({ ladders: rl({ lv }) }), out = gen(ctx), old = genOld(mkCtx()), its = ctx.ladders.reading.next.items;
  const comp = out.parent.slice(out.parent.indexOf('<div class="page-label">Teaching Companion — Read and Answer'));
  ok(lv + ": a second Companion page, after the first (which is unchanged)", pagesOf(out.parent).length === pagesOf(old.parent).length + 1 &&
    out.parent.indexOf(old.parent.slice(old.parent.indexOf("<body>"), old.parent.lastIndexOf("</div>"))) > 0 && comp.length > 0);
  ok(lv + ": each page's day, title, level and place", its.every((x, k) => comp.indexOf((k ? "Thursday" : "Tuesday") + " — “" + esc(x.item.title) + "” · " + esc(x.label) + " · passage " + x.num + " of " + x.of) > 0));
  ok(lv + ": each question's right letter + its words, and the why line", its.every((x) => x.item.q.every((q) => {
    const w = q.c["ABCDEFGH".indexOf(q.ans)]; return comp.indexOf('<span class="key-ans">' + esc(q.ans) + " — " + esc(w) + "</span>") > 0 && comp.indexOf(esc(q.why)) > 0; })));
  const ours = comp.replace(/<span class="key-ans">[\s\S]*?<\/span>/g, " ").replace(/<div class="lr-why">[\s\S]*?<\/div>/g, " ").replace(/“[^”]*”/g, " ").replace(/<[^>]*>/g, " ");   // the passage's own words out
  ok(lv + ": the page's own words never say he/she for the child", !/\b(she|her|he|his|him)\b/i.test(ours) && /Your child reads the passage/.test(ours));
}

// ════════════════════════════════════ (f) where the pages sit ════════════════════════════════════
console.log("(f) every page that existed keeps its place; the dolls land on a sheet front");
{
  const dolls = { doll: "data:image/png;base64,AAAA", outfit: "data:image/png;base64,BBBB" };
  const variants = [
    ["full week, no dolls", {}, null],
    ["full week, paper dolls", { dolls }, null],
    ["full week, dolls + My Words + a unit-free extra page", { dolls, extraPages: { myWords: { on: true }, allAboutMe: { on: true } } }, null],
    ["one-day week, dolls (one reading page flips the padding)", { dolls }, ["wednesday"]],
    ["one tick, dolls", { dolls }, null, "thursday"],
    ["3-day week, dolls, This Month on", { dolls, extraPages: { thisMonth: { on: true } } }, ["monday", "tuesday", "wednesday"]],
  ];
  for (const [name, extra, ds, tick] of variants) {
    const was = pagesOf(genOld(mkCtx(extra, ds)).student), now = pagesOf(gen(mkCtx(Object.assign({ ladders: rl({ days: tick || null }) }, extra), ds)).student);
    const r0 = now.findIndex((l) => /^Read and Answer — /.test(l)), nR = now.filter((l) => /^Read and Answer — /.test(l)).length;
    const dollAt = (arr) => arr.findIndex((l) => /^Paper doll/.test(l));
    const eow = was.findIndex((l) => /^End of Week/i.test(l));
    const before = now.slice(0, r0), wasBefore = was.slice(0, r0);
    const afterNow = now.slice(r0 + nR).filter((l) => !/^Blank/.test(l)), afterWas = was.slice(r0).filter((l) => !/^Blank/.test(l));
    ok(name + ": every page before the reading pages is where it was (" + r0 + " pages, End of Week at " + (eow + 1) + ")",
      nR >= 1 && r0 > eow && JSON.stringify(before) === JSON.stringify(wasBefore));
    ok(name + ": after them, the same pages in the same order (only the blank pad may change)", JSON.stringify(afterNow) === JSON.stringify(afterWas));
    if (extra.dolls) ok(name + ": the first doll is on a sheet front (even 0-based index), each doll followed by its blank back", dollAt(now) % 2 === 0 && dollAt(was) % 2 === 0 &&
      now.every((l, i) => !/^Paper doll/.test(l) || /^Blank/.test(now[i + 1] || "")));
  }
  const now = gen(mkCtx({ ladders: rl() })).student, labs = pagesOf(now);
  ok("every daily page is still followed by its brain-break back, on the same sides", labs.every((l, i) => !/^Daily Page — (Monday|Tuesday|Wednesday|Thursday)/.test(l) || /^Brain Break — back of /.test(labs[i + 1])) &&
    JSON.stringify(labs.map((l, i) => /^Daily Page/.test(l) ? i % 2 : null).filter((x) => x !== null)) === JSON.stringify(pagesOf(genOld(mkCtx()).student).map((l, i) => /^Daily Page/.test(l) ? i % 2 : null).filter((x) => x !== null)));
  ok("the daily pages themselves are unchanged (no pointer line — the page is already full)", now.split('<div class="page-label">').filter((s) => /^Daily Page/.test(s)).join("|") === genOld(mkCtx()).student.split('<div class="page-label">').filter((s) => /^Daily Page/.test(s)).join("|"));
}

// ════════════════════════════════════ (g) the tablet tags ════════════════════════════════════
console.log("(g) the tablet's Today list");
{
  const out = gen(mkCtx({ ladders: rl({ days: "monday thursday" }), nbPageTags: true })), rp = readingPages(out.student);
  ok("each reading page is tagged with its day and 'Read and answer'", rp.length === 2 && rp[0].indexOf('<div class="page" data-nb-day="monday" data-nb-name="Read and answer">') > 0 && rp[1].indexOf('<div class="page" data-nb-day="thursday" data-nb-name="Read and answer">') > 0);
  const oldT = genOld(mkCtx({ nbPageTags: true })).student;
  const rest = out.student.replace(I.LR_CSS, "").replace(/<div class="page-label">Read and Answer — [\s\S]*?<div class="footer">[\s\S]*?<\/div>\n<\/div>\n<\/div>\n/g, "");
  ok("every other page keeps the tags it had (and the document is otherwise the same)", rest === oldT);
  ok("paper (no tags) has no data-nb attributes on the reading pages", readingPages(gen(mkCtx({ ladders: rl() })).student).every((p) => p.indexOf("data-nb-") < 0));
}

// ════════════════════════════════════ (h) the place ════════════════════════════════════
console.log("(h) the place: same week, next week, level end, the end");
{
  const titles = (o) => readingPages(o.student).map((p) => /<div class="lr-title">([^<]*)</.exec(p)[1]);
  const w12 = gen(mkCtx({ ladders: rl({ lv: "g1" }, 12) })), cur = w12.readingCursor;
  const again = gen(mkCtx({ ladders: rl({ lv: "g1", cur }, 12) }));
  ok("the same week built again with the saved place → the same two passages and the same cursor", JSON.stringify(titles(again)) === JSON.stringify(titles(w12)) && JSON.stringify(again.readingCursor) === JSON.stringify(cur));
  const w13 = gen(mkCtx({ weekNum: "week13", ladders: rl({ lv: "g1", cur }, 13) }));
  ok("next week moves on: passages 3 and 4", JSON.stringify(titles(w13)) === JSON.stringify(TR.levels.g1.items.slice(2, 4).map((x) => esc(x.title))) && w13.readingCursor.from === 2);
  const one = gen(mkCtx({ ladders: rl({ lv: "g1" }, 12) }, ["tuesday"]));
  const after1 = gen(mkCtx({ weekNum: "week13", ladders: rl({ lv: "g1", cur: one.readingCursor }, 13) }));
  ok("a one-page week moves the place by one (nothing skipped)", titles(after1)[0] === esc(TR.levels.g1.items[1].title));
  const end1 = gen(mkCtx({ weekNum: "week13", ladders: rl({ lv: "g1", cur: { week: 12, lv: "g1", from: 28, adv: 2, opt: false } }, 13) }));
  ok("the end of 1st grade moves up by itself: 2nd grade's first two, in 2nd-grade type", JSON.stringify(titles(end1)) === JSON.stringify(TR.levels.g2.items.slice(0, 2).map((x) => esc(x.title))) &&
    readingPages(end1.student).every((p) => p.indexOf("lr-t2") > 0 && p.indexOf("2nd grade · passage") > 0));
  const across = gen(mkCtx({ weekNum: "week13", ladders: rl({ lv: "g1", cur: { week: 12, lv: "g1", from: 27, adv: 2, opt: false } }, 13) }));
  ok("a week across the line: the last 1st-grade passage, then the first 2nd-grade one", JSON.stringify(titles(across)) === JSON.stringify([esc(TR.levels.g1.items[29].title), esc(TR.levels.g2.items[0].title)]));
  const last = gen(mkCtx({ weekNum: "week13", ladders: rl({ lv: "g78", cur: { week: 12, lv: "g78", from: 8, adv: 2, opt: false } }, 13) }));
  ok("the last passage of all → one page, then nothing more", readingPages(last.student).length === 1 && last.readingCursor.adv === 1);
  const done = gen(mkCtx({ weekNum: "week14", ladders: rl({ lv: "g78", cur: last.readingCursor }, 14) }));
  ok("…the week after: no page, no cursor, the notebook as before", !("readingCursor" in done) && both(done) === both(genOld(mkCtx({ weekNum: "week14" }))));
}

// ════════════════════════════════════ (i) index.html ════════════════════════════════════
console.log("(i) index.html: the ticks, the note, the save, the print paths");
const ldOnly = ldBlk;
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
    nbLevelGrade: () => ({ key: "1", from: "family" }), nbQbList: () => [], nbTargetWkNum: () => 12,
    nbThemeOf: (k) => ((o.themes || {})[k] || null), nbLevelOf: () => null,
    db: o.noDb ? null : { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    fetch: (u) => { fetched.push(u); if (o.offline) return Promise.reject(new TypeError("Failed to fetch")); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(/read_and/.test(u) ? READ : {}) }); },
    console, Promise, JSON, Object, String, Array, Date, parseInt, isNaN, setTimeout,
  };
  c.renderNotebook = () => { c.rendered++; };
  vm.createContext(c);
  vm.runInContext(ldOnly + "\n" + ixBlk + "\nthis._nbLadData=_nbLadData; this._nbLadFail=_nbLadFail; this._nbLadOpen=_nbLadOpen; this.NBLADDER_PAGES_NOTE=NBLADDER_PAGES_NOTE; this.NBLADREAD_LOAD_FAIL=NBLADREAD_LOAD_FAIL;", c);
  c.writes = writes; c.fetched = fetched; c.ls = ls;
  return c;
}
const tick = () => new Promise((r) => setTimeout(r, 5));
(async () => {
  // ── the card ──
  {
    const c = sandbox({ settings: { [KID]: { ladders: { reading: { on: true, lv: "g1" } } }, kidz: { ladders: { reading: { on: true, lv: "g1" } } } } });
    c._nbLadData.reading = READ; c._nbLadData.number = {}; c._nbLadOpen[KID] = true; c._nbLadOpen.kidz = true;
    const h = c.nbLadderCardHtml(KID), hz = c.nbLadderCardHtml("kidz");
    ok("1st-grade notebook, reading on: 'prints in the notebook on the 2nd and 4th school day …'", /📖 Reading passages: prints in the notebook on the 2nd and 4th school day of the week \(Tuesday and Thursday in a full week\)/.test(h));
    ok("…the number row keeps the 'not yet' wording", /🔢 Number thinking doesn’t print anything in the notebook yet/.test(h) && h.indexOf(c.NBLADDER_PAGES_NOTE) < 0);
    ok("…the reading row has the five day ticks, none ticked, none disabled", (h.match(/nbLadReadSetDay\(/g) || []).length === 5 && !/type="checkbox" checked/.test(h) && !/ disabled onchange="nbLadReadSetDay/.test(h) && /None ticked: the 2nd and 4th school day/.test(h));
    ok("a notebook that prints no reading: the 'not yet' note, no ticks", hz.indexOf(c.NBLADDER_PAGES_NOTE) > 0 && !/nbLadReadSetDay/.test(hz) && !/prints in the notebook on/.test(hz));
    const cP = sandbox({ themes: { kidt: Object.keys(NB.themes)[0] }, settings: { kidt: { ladders: { reading: { on: true, lv: "g1" } } } } }); cP._nbLadData.reading = READ; cP._nbLadOpen.kidt = true;
    ok("a kid on a Pre-K look: the 'not yet' note, no ticks", cP.nbLadderCardHtml("kidt").indexOf(cP.NBLADDER_PAGES_NOTE) > 0 && !/nbLadReadSetDay/.test(cP.nbLadderCardHtml("kidt")));
    c.notebookSettings[KID].ladders.reading.on = false;
    ok("reading off: 'when it's on, it prints …'", /when it’s on, it prints in the notebook on the 2nd and 4th/.test(c.nbLadderCardHtml(KID)));
    c.notebookSettings[KID].ladders.reading = { on: true, lv: "g78", cur: { week: 12, lv: "g78", from: 10, adv: 1 } };
    ok("ladder finished: the card says so", /the last level is finished, so no reading page prints/.test(c.nbLadderCardHtml(KID)) && /Finished the last level/.test(c.nbLadderCardHtml(KID)));
    ok("drawing the card wrote nothing", c.writes.length === 0 && c.ls.length === 0);
  }
  // ── the ticks ──
  {
    const c = sandbox({ settings: { [KID]: { ladders: { reading: { on: true, lv: "g1" } } } } }); c._nbLadData.reading = READ;
    const P = "notebookSettings/" + KID + "/ladders/reading/days";
    c.nbLadReadSetDay(KID, "thursday", true);
    ok("a tick → ONE write of one field: …/ladders/reading/days = 'thursday'", JSON.stringify(c.writes) === JSON.stringify([["set", P, "thursday"]]) && c.notebookSettings[KID].ladders.reading.days === "thursday");
    c.nbLadReadSetDay(KID, "monday", true);
    ok("a second tick → 'monday thursday' (week order), one write", JSON.stringify(c.writes[1]) === JSON.stringify(["set", P, "monday thursday"]));
    c._nbLadOpen[KID] = true;
    const h = c.nbLadderCardHtml(KID);
    ok("…the card: two ticked, the other three disabled, 'Monday and Thursday'", (h.match(/type="checkbox" checked/g) || []).length === 2 && (h.match(/ disabled onchange="nbLadReadSetDay/g) || []).length === 3 && /prints in the notebook on Monday and Thursday/.test(h));
    c.nbLadReadSetDay(KID, "friday", true);
    ok("a third tick is refused (no write)", c.writes.length === 2);
    c.nbLadReadSetDay(KID, "monday", false); c.nbLadReadSetDay(KID, "thursday", false);
    ok("untick both → 'thursday', then the field is removed (back to the default)", JSON.stringify(c.writes.slice(2)) === JSON.stringify([["set", P, "thursday"], ["remove", P]]) && !("days" in c.notebookSettings[KID].ladders.reading));
    c.nbLadReadSetDay(KID, "sunday", true);
    ok("a day that isn't a school day is refused", c.writes.length === 4);
    const cM = sandbox({ mom: false }); cM.nbLadReadSetDay(KID, "monday", true);
    ok("not Mom → nothing written, nothing kept", cM.writes.length === 0 && cM.ls.length === 0);
    const cD = sandbox({ dry: true }); cD.nbLadReadSetDay(KID, "monday", true);
    ok("?dryrun=1 → no Firebase write", cD.writes.length === 0);
    ok("nbLadderWrite takes 'days' (and slice 3's 'wf', nothing else new)", /\["on","lv","opt","cur","days","wf"\]\.indexOf\(field\)<0/.test(ldBlk));
    const cs = sandbox({ settings: { [KID]: { ladders: { reading: { on: true, lv: "g1", days: "monday wednesday" } } } } }); cs._nbLadData.reading = READ;
    const lc = clone(cs.nbLadderCtx(KID));
    ok("the saved ticks reach the builder through ctx.ladders (nbLadderCtx → generateLucy)", lc.reading.days === "monday wednesday" &&
      readingPages(gen(mkCtx({ ladders: lc })).student).map((p) => /Read and Answer — (\w+)/.exec(p)[1]).join(",") === "Monday,Wednesday");
  }
  // ── the cursor save ──
  {
    const P = "notebookSettings/" + KID + "/ladders/reading/cur";
    const nc = { week: 12, lv: "g1", from: 0, adv: 2, opt: false };
    const c = sandbox({ settings: { [KID]: { ladders: { reading: { on: true, lv: "g1" } } } } });
    c.nbLadReadPersist(KID, { readingCursor: nc });
    ok("after a build: ONE write of one field — …/ladders/reading/cur", JSON.stringify(c.writes) === JSON.stringify([["set", P, nc]]));
    c.nbLadReadPersist(KID, { readingCursor: clone(nc) });
    ok("the same week again → nothing written", c.writes.length === 1);
    c.nbLadReadPersist(KID, { readingCursor: Object.assign({}, nc, { week: 13, from: 2 }) });
    ok("next week → written once more", c.writes.length === 2 && c.writes[1][1] === P);
    c.nbLadReadPersist(KID, {}); c.nbLadReadPersist(KID, null);
    ok("no reading pages printed (no cursor) → nothing", c.writes.length === 2);
    const cM = sandbox({ mom: false }); cM.nbLadReadPersist(KID, { readingCursor: nc });
    const cD = sandbox({ dry: true }); cD.nbLadReadPersist(KID, { readingCursor: nc });
    const cN = sandbox({ noDb: true }); cN.nbLadReadPersist(KID, { readingCursor: nc });
    ok("not Mom / ?dryrun=1 / no database → nothing written and nothing kept", cM.writes.length + cD.writes.length + cN.writes.length === 0 && cM.ls.length + cD.ls.length + cN.ls.length === 0);
    // when: right beside the sight-word cursor in every place that saves the notebook's cursors
    const fnAt = (sig) => { const a = IX.indexOf(sig); return IX.slice(a, IX.indexOf("\n}\n", a)); };
    const open = fnAt("async function haNbOpen(kid,which){"), pdf = fnAt("async function haNbPdf(kid,which){"), nbt = fnAt("function nbtPersistCursors(kid,out){"), send = fnAt("async function nbtSend(kid){"), comb = fnAt("async function haNbCombinedParent(){");
    const after = (f, a, b) => f.indexOf(a) > 0 && f.indexOf(b) > f.indexOf(a);
    ok("the save sits right after luWordsPersistCursor in Print/Look, PDF and the tablet send's cursor list", [open, pdf, nbt].every((f) => after(f, "luWordsPersistCursor(kid,out);", "nbLadReadPersist(kid,out);")) &&
      (IX.match(/nbLadReadPersist\(kid,out\);/g) || []).length === 3 && send.indexOf("nbtPersistCursors(kid,out);") > 0);
    ok("every Mom build waits for the reading file BEFORE building (Print/Look, PDF, tablet send)", [open, pdf, send].every((f) => after(f, "await nbLadReadReady(kid)", "lib.generate(")) && [open, pdf, send].every((f) => after(f, "lib.generate(", "nbLadReadNote(out,lrMsg);")));
    ok("…and the combined parent guide before its contexts", after(comb, "await nbLadReadReadyAll()", "haNbContext(k)"));
    ok("the note rides the builder's warnings, shown before anything is saved", [open, pdf, send].every((f) => after(f, "nbLadReadNote(out,lrMsg);", "out.warnings.join(")));
  }
  // ── waiting for the file; a failed load ──
  {
    const on = { settings: { [KID]: { ladders: { reading: { on: true, lv: "g1" } } }, kidz: { ladders: { reading: { on: true, lv: "g1" } } } } };
    const c = sandbox(on);
    const m = await c.nbLadReadReady(KID);
    ok("reading on, a notebook that prints it → the file is fetched before the build; no note", m === "" && c.fetched.length === 1 && c._nbLadData.reading === READ);
    const lc = clone(c.nbLadderCtx(KID));
    ok("…so ctx.ladders.reading is ready with this week's two passages", lc.reading.ready === true && lc.reading.next.items.length === 2 && readingPages(gen(mkCtx({ ladders: lc })).student).length === 2);
    const cz = sandbox(on); const mz = await cz.nbLadReadReady("kidz"); const coff = sandbox({}); const moff = await coff.nbLadReadReady(KID);
    ok("a notebook that prints none, or reading off → nothing fetched, no note", mz === "" && cz.fetched.length === 0 && moff === "" && coff.fetched.length === 0);
    const cx = sandbox(Object.assign({ offline: true }, on));
    const mx = await cx.nbLadReadReady(KID);
    ok("offline → the plain note for Mom (where to look: the Ladders card)", mx === cx.NBLADREAD_LOAD_FAIL && /couldn’t load \(check the internet\)/.test(mx) && /Ladders card on the Notebook tab/.test(mx));
    const lx = clone(cx.nbLadderCtx(KID));
    const outx = gen(mkCtx({ ladders: lx }));
    ok("…the notebook builds exactly as before (no reading page, no cursor)", lx.reading.ready === false && both(outx) === both(genOld(mkCtx())) && !("readingCursor" in outx));
    const o2 = { warnings: ["x"] }; cx.nbLadReadNote(o2, mx); const o3 = {}; cx.nbLadReadNote(o3, "");
    ok("…the note is added to the builder's warnings (shown in the same alert); no note → nothing added", o2.warnings.length === 2 && o2.warnings[1] === mx && !("warnings" in o3));
    const ca = sandbox(on); const ma = await ca.nbLadReadReadyAll(); const ca2 = sandbox({ settings: { kidz: { ladders: { reading: { on: true } } } } }); const ma2 = await ca2.nbLadReadReadyAll();
    ok("combined guide: fetched only when some kid's notebook prints reading", ma === "" && ca.fetched.length === 1 && ma2 === "" && ca2.fetched.length === 0);
  }

  // ════════════════════════════════════ (j) page fit ════════════════════════════════════
  console.log("(j) page fit (8.5×11in, overflow hidden) — Google Chrome headless, the notebook's own CSS");
  const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(CHROME)) console.log("  page measurement — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
  else {
    const MEASURE = function () {
      return [].map.call(document.querySelectorAll(".page"), function (pg) {
        var lab = pg.getAttribute("data-lab") || ((pg.previousElementSibling && pg.previousElementSibling.className === "page-label") ? pg.previousElementSibling.textContent : "");
        var b = pg.querySelector(".body"), r = pg.getBoundingClientRect(), out = { lab: lab, h: Math.round(r.height), wide: pg.scrollWidth - pg.clientWidth, clip: pg.scrollHeight - pg.clientHeight };
        if (b) { var low = 0; [].forEach.call(b.children, function (c) { var y = c.getBoundingClientRect().bottom; if (y > low) low = y; });
          out.spare = Math.round(b.getBoundingClientRect().bottom - parseFloat(getComputedStyle(b).paddingBottom) - low); out.clip = Math.max(out.clip, b.scrollHeight - b.clientHeight); }
        return out;
      });
    };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladread-"));
    const run = (html, tag) => {
      const f = path.join(dir, tag + ".html");
      fs.writeFileSync(f, html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace("</body>", "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body>"));
      for (let tryN = 0; tryN < 3; tryN++) {   // Chrome can print the page and still exit non-zero on teardown — read stdout either way
        const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof_" + tag + tryN), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 90000 });
        const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
        if (m) return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
      }
      return null;
    };
    // every passage page (so the shortest and longest of every level are in it) + the Companion with each level's two longest
    const pages = [];
    TR.order.forEach((lv) => TR.levels[lv].items.forEach((it, i) => pages.push(I.lrPage(12, "tuesday", "November 17", { lv, label: TR.levels[lv].label, i, num: i + 1, of: TR.levels[lv].items.length, id: it.id, item: it })
      .replace('<div class="page">', '<div class="page" data-lab="' + lv + "|" + it.id + '">'))));
    TR.order.forEach((lv) => { const two = TR.levels[lv].items.slice().sort((a, b) => JSON.stringify(b.q).length - JSON.stringify(a.q).length).slice(0, 2);
      pages.push(I.lrCompanion(12, "Nov 16–20, 2026", { pages: two.map((it, k) => ({ day: k ? "thursday" : "tuesday", x: { lv, label: TR.levels[lv].label, num: 1, of: 11, item: it } })) }).replace('<div class="page">', '<div class="page" data-lab="companion|' + lv + '">')); });
    const doc = I.luShell(pages.join("\n"), "fit", I.LR_CSS);
    const res = run(doc, "all"), resW = run(doc.replace("\n</style>", "\n  .lr-body, .lr-body * { letter-spacing:0.03em; }\n</style>"), "wide");
    if (!res || !resW) console.log("  page measurement — SKIPPED (Google Chrome would not run headless here)");
    else {
      console.log("  measured with Google Chrome headless; web fonts NOT loaded (Nunito / Fredoka One are not on this Mac — the fallback sans is used, as in the other notebook fit tests)");
      const len = (id) => { const p = READ.passages[id]; return p.text.length + p.q.reduce((a, q) => a + q.text.length + q.c.join("").length, 0); };
      for (const lv of TR.order) {
        const mine = res.filter((p) => p.lab.indexOf(lv + "|") === 0), w = resW.filter((p) => p.lab.indexOf(lv + "|") === 0);
        const byLen = mine.slice().sort((a, b) => len(a.lab.split("|")[1]) - len(b.lab.split("|")[1])), sh = byLen[0], lo = byLen[byLen.length - 1];
        const tight = mine.slice().sort((a, b) => a.spare - b.spare)[0], tightW = w.slice().sort((a, b) => a.spare - b.spare)[0];
        ok(lv + ": all " + mine.length + " passage pages 11in, nothing clipped — shortest " + sh.lab.split("|")[1] + " " + sh.spare + "px spare, longest " + lo.lab.split("|")[1] + " " + lo.spare + "px, tightest " + tight.lab.split("|")[1] + " " + tight.spare + "px",
          mine.length === TR.levels[lv].items.length && mine.every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0 && p.wide <= 0), mine.filter((p) => p.spare < 0 || p.clip > 0 || p.wide > 0));
        ok(lv + ": …still fits with every letter 0.03em wider (a wider web font) — tightest " + tightW.spare + "px", w.every((p) => p.spare >= 0 && p.clip <= 0 && p.wide <= 0), w.filter((p) => p.spare < 0 || p.clip > 0));
      }
      const comp = res.filter((p) => p.lab.indexOf("companion|") === 0);
      ok("the Companion page, each level's two longest question sets: nothing clipped (spare " + comp.map((p) => p.lab.split("|")[1] + " " + p.spare + "px").join(", ") + ")", comp.length === TR.order.length && comp.every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0));
      // a whole real build, student + Companion, at the first and the last level
      for (const lv of ["g1", "g78"]) {
        const out = gen(mkCtx({ ladders: rl({ lv }), extraPages: { myWords: { on: true } } }));
        for (const part of ["student", "parent"]) {
          const r = run(out[part], "whole_" + lv + part);
          const rp = (r || []).filter((p) => /Read and Answer/.test(p.lab));
          ok("whole " + lv + " build (" + part + "): " + (r ? r.length : 0) + " pages, every reading page 11in and unclipped (" + rp.map((p) => p.spare + "px").join(", ") + ")",
            r && rp.length === (part === "student" ? 2 : 1) && rp.every((p) => p.h === 1056 && p.spare >= 0 && p.clip <= 0));
        }
      }
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
