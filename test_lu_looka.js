// 🎨 Looks for the 1st-grade notebook, stage A — colours (LU_LOOKA, her words 2026-11-24: the older notebooks get looks in the
// plan's stages, the 1st-grade one first; stage A only: "the notebook's colours read from the look's palette; byte for byte the
// same for the look the kid has today; nothing prints differently until another look is picked"). Run: node test_lu_looka.js
//   (a) nothing saved (or "", null, a Pre-K look key, an unknown key) → student, companion and parent pages byte for byte the
//       baseline: THIS tree with every LU_LOOKA block cut out and the folded colour literals put back (built below, no git) —
//       across fixtures that turn on every optional part (My Words, the math block, phonograms, every extra page with a
//       "pages today" strip, a unit insert, the Spelling page, paper dolls, picture uploads, the reading ladder's Read and
//       answer pages + their Companion page at two levels, write-first days (a g3 level: the writing lines, the back page, the
//       Notes pad), the number ladder's Number thinking page + its Companion page (at k, with the grown-up tag, and at g1), a 4-day week)
//   (b) every colour set changes colours only: strip every colour value (and the one colour word, "this week is the … row")
//       from two builds and the rest is identical — same pages, order, words, sizes, pictures
//   (c) no colour literal is left in the notebook's own code outside the palette; every token has a value in every set
//   (d) contrast: text on each card colour, and the print tints on white, keep today's ratios on every set
//   (e) the picker: the notebook offers its sets through notebookOptions (the one look card), saved keys read back, the Pre-K
//       offers and every other notebook unchanged; unit pages printed from the Units tab follow the look
//   (f) page fit: every page of every fixture on every set, built in headless Google Chrome — the same element heights as
//       its own look, page for page (skipped when Chrome is not installed; set CHROME_BIN for another path)
const fs = require("fs"), path = require("path"), os = require("os");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d !== undefined ? "  → " + d : "")); } }
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;

// ── the blocks, and the baseline built from them ─────────────────────────────────────────────────────────────────────
console.log("the blocks and the baseline");
const S = "// LU_LOOKA_START", E = "// LU_LOOKA_END";
const blocks = []; { let i = 0; while ((i = src.indexOf(S, i)) >= 0) { const j = src.indexOf(E, i); blocks.push([src.lastIndexOf("\n", i) + 1, src.indexOf("\n", j) + 1]); i = j; } }
ok(blocks.length === 6 && src.split(E).length - 1 === 6 && blocks.every((b, n) => b[1] > b[0] && (n === 0 || b[0] > blocks[n - 1][1])), "six LU_LOOKA blocks, each marked start and end", blocks.length);
const INLINE = ['(g && g.lookOf) ? g.lookOf(opt) : ((looks[0] || {}).key || ""),   // LU_LOOKA: a notebook with colour sets says which is on', '((looks[0] || {}).key || ""),'];
ok(src.split(INLINE[0]).length === 2, "one marked line outside the blocks (notebookOptions says which set is on)");
const blockTxt = blocks.map(b => src.slice(b[0], b[1])).join("") + INLINE[0];
ok(!NAMES.test(blockTxt), "no kid or family name in the new code", (blockTxt.match(NAMES) || [])[0]);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok(!NAMES.test(testTxt), "this test names no real kid or family", (testTxt.match(NAMES) || [])[0]);
// the palette block runs by itself (it needs nothing else from the file)
const PB = blocks.map(b => src.slice(b[0], b[1])).find(t => /var LU_PAL = \{/.test(t));
const K = new Function(PB + "\nreturn { LU_PAL: LU_PAL, LU_LOOKS: LU_LOOKS, luLookPalette: luLookPalette, luLookKey: luLookKey, luRgbOf: luRgbOf, luLum: luLum };")();
const OWN = K.luLookPalette("");
let cut = src; for (let n = blocks.length - 1; n >= 0; n--) cut = cut.slice(0, blocks[n][0]) + cut.slice(blocks[n][1]);
const tokens = cut.match(/\{\{lu:\w+\}\}/g) || [];
const baseSrc = cut.replace(/\{\{lu:(\w+)\}\}/g, (m, n) => OWN[n]).replace(INLINE[0], INLINE[1]);
ok(tokens.length === 276 && !/\{\{lu:/.test(baseSrc) && !/LU_LOOKA|luPaint|luLook|LU_LNT_TOK/.test(baseSrc), "baseline: blocks cut, 275 colour literals + 1 colour word put back, nothing of the look left", tokens.length);
const NB = load(src), OLD = load(baseSrc), I = NB._internal, OI = OLD._internal;
const kidsOf = (N) => Object.keys(N.GENERATORS).filter(k => N.GENERATORS[k].build === N._internal.generateLucy);
const KID = kidsOf(NB)[0];
ok(kidsOf(NB).length === 1 && kidsOf(OLD)[0] === KID, "one notebook builder is the 1st-grade notebook (found by its builder, not a name)");

// ── fixtures that turn on every optional part ────────────────────────────────────────────────────────────────────────
const dates = { monday: "November 16, 2026", tuesday: "November 17, 2026", wednesday: "November 18, 2026", thursday: "November 19, 2026", friday: "November 20, 2026" };
const who = KID;
const tasks = [].concat.apply([], Object.keys(dates).map(d => [
  { who, day: d, title: "📚 Reading Eggs — lesson 12", time: "9:00" }, { who, day: d, title: "💻 Mathseeds — map 4", time: "9:30" },
  { who, day: d, title: "📞 Call Grandma", time: "10:00" }, { who, day: d, title: "✏️ Handwriting Without Tears p. 30", time: "10:30" }]));
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const deck = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ id: subject.slice(0, 2) + "_" + i, subject, prompt: p, status: "active", tier: "monthly", drop_count: 0, recentMiss: 0, review_mode: "flash" }, (extra || {})[i] || {}));
const items = [].concat(
  deck("Sight Words", ["said", "play", "come", "here", "look", "jump", "where", "little", "funny", "yellow"], { 1: { recentMiss: 2 }, 9: { status: "introduction" } }),
  deck("Spelling", ["cat", "hat", "ran", "bed"], { 2: { status: "introduction" } }),
  deck("Math Facts", ["4+5", "6+3", "9-4", "7-2", "5+5", "8-3"], { 0: { recentMiss: 1 } }));
const allDays = { monday: true, wednesday: true };
const extraOn = { months: { on: true, days: allDays }, thisMonth: { on: true, days: { tuesday: true } }, allAboutMe: { on: true, days: { friday: true } }, myWords: { on: true } };
const unit = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }, { name: "Flipper" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
const loe = [{ pg: "sh", sounds: "/sh/", lesson: 41 }, { pg: "th", sounds: "/th/", lesson: 42 }, { pg: "ee", sounds: "/ē/", lesson: 43 }];
// the reading ladder the way index.html hands it over (nbLadderCtx): on, loaded, this week's items from the engine
const READ = JSON.parse(fs.readFileSync(path.join(__dirname, "ladders", "read_and_answer.json"), "utf8")), TR = NB.ladders.track("reading", READ);
const rl = (lv, wf) => { const st = { on: true, lv: lv, opt: false, cur: null, days: null }; return { reading: Object.assign({}, st, { lvFrom: "saved", ready: true, wf: wf || "", next: NB.ladders.next(TR, st, 12, 2) }) }; };
// …and the number ladder (5 questions a week)
const NUM = JSON.parse(fs.readFileSync(path.join(__dirname, "ladders", "number_thinking.json"), "utf8")), TN = NB.ladders.track("number", NUM);
const nl = (lv) => { const st = { on: true, lv: lv, opt: false, cur: null }; return { number: Object.assign({}, st, { lvFrom: "saved", ready: true, next: NB.ladders.next(TN, st, 12, 5) }) }; };
const base = (extra) => Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates, tasks }, extraPages: {} }, extra || {});
const full = (extra) => base(Object.assign({ masteryItems: items, extraPages: extraOn, loe, units: [unit], teachNotes: "Short day Wednesday.", ladders: rl("g1"),
  personal: { address: ["12 Elm Road", "Springfield"], phone: "555-0100" }, dolls: { doll: PNG, outfit: PNG }, dotdot: PNG, coloring: PNG, symmetry: PNG, pattern: PNG, maze: PNG,
  pace: [{ subject: "Reading Eggs", pct: 80, status: "ahead" }, { subject: "Mathseeds", pct: 60, status: "on" }] }, extra || {}));
const FIX = {
  plain: base(),
  full: full(),
  fullSpelling: full({ spelling: { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat", "sat"] }], practice: ["mat"] } }),
  readingG4: full({ ladders: rl("g4") }),
  writeFirst: full({ ladders: rl("g3", "both") }),
  numberK: full({ ladders: Object.assign(rl("g1"), nl("k")) }),
  numberG1: full({ ladders: Object.assign(rl("g3", "one"), nl("g1")) }),
  fourDays: full({ weekData: { dates: { monday: dates.monday, tuesday: dates.tuesday, wednesday: dates.wednesday, thursday: dates.thursday }, tasks } })
};
const fo = I.generateLucy(FIX.full), fs2 = I.generateLucy(FIX.fullSpelling);
const has = (h, re) => re.test(h);
ok([/Months of the Year/, /This Month/, /All About Me/, /My Words/, /Extra pages today:|Pages to do today:/, /Sea Turtles/, /Paper doll/, /slabel ph/, /lm-card/, /lw-/, /iVBORw0KGgo/, /Read and answer/, /lr-how/].every(re => has(fo.student, re)) && /Spelling/.test(fs2.student),
  "the full fixture prints every optional part (extra pages + strip, My Words, unit insert, paper dolls, phonograms, math block, uploads, Read and answer; Spelling in its twin)");
const wf = I.generateLucy(FIX.writeFirst), nk = I.generateLucy(FIX.numberK), n1 = I.generateLucy(FIX.numberG1);
ok(/lr-wl/.test(wf.student) && /\(back\)/.test(wf.student) && /NBLADREAD3 — write-first/.test(wf.student), "write-first (g3): the writing lines, the back page and their sheet print");
ok(/class="lnt-say"/.test(nk.student) && !/class="lnt-say"/.test(n1.student) && /lnt-q/.test(n1.student) && /Number/.test(n1.parent), "the number ladder: Number thinking + its Companion page; at k the amber \"Read aloud\" line prints (the amber tag style rides in the same sheet)");
ok((fo.student.match(/class="page-label">Read and Answer — /g) || []).length === 2 && /lr-/.test(fo.parent) && /lr-/.test(I.generateLucy(FIX.readingG4).student), "the reading ladder prints two Read and answer pages + its Companion page (levels g1 and g4)");

console.log("(a) nothing saved → byte for byte today's notebook");
const SAME = [undefined, null, "", "  ", "dino", "construction", "shark", "space", "farm", "forest", "col-nope", "plain", "unicorns"];
let sameBad = [];
Object.keys(FIX).forEach(f => {
  const b = OI.generateLucy(FIX[f]);
  SAME.forEach(t => {
    const o = I.generateLucy(Object.assign({}, FIX[f], t === undefined ? {} : { notebookTheme: t }));
    if (o.student !== b.student || o.parent !== b.parent || JSON.stringify(Object.assign({}, o, { student: 0, parent: 0 })) !== JSON.stringify(Object.assign({}, b, { student: 0, parent: 0 }))) sameBad.push(f + "/" + t);
  });
  const g = NB.generate(KID, FIX[f]), og = OLD.generate(KID, FIX[f]);
  if (g.student !== og.student || g.parent !== og.parent) sameBad.push(f + "/generate");
});
ok(!sameBad.length, Object.keys(FIX).length + " fixtures × " + SAME.length + " saved values (none, blank, a Pre-K look, unknown) + the app's generate: student, companion, parent identical", sameBad.slice(0, 4).join(", "));
ok(/Teaching Companion|Parent Companion/.test(fo.parent), "the companion pages are in the parent build checked above");
ok(I.generateLucy(Object.assign({}, FIX.full, { theme: "col-ocean", notebookTheme: "" })).student !== fo.student, "ctx.theme picks a set too, as it does for the Pre-K looks");

// ── (b) colours only ─────────────────────────────────────────────────────────────────────────────────────────────────
console.log("(b) a colour set changes colours only");
const SETS = K.LU_LOOKS.filter(l => l.key);
ok(JSON.stringify(K.LU_LOOKS.map(l => l.key)) === '["","col-plain","col-ocean","col-forest","col-horses"]', "the sets: its own, 📓 Plain, 🌊 Ocean, 🌲 Forest, 🐴 Horse", K.LU_LOOKS.map(l => l.key).join());
ok(K.LU_LOOKS.slice(1).every(l => / colors$/.test(l.label)), "each new set is named as a colour set (\"… colors\")");
const COLOR_RE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)/g;
const ROW_RE = /this week is the [a-z-]+ row/g;
const norm = (h) => h.replace(COLOR_RE, "‹c›").replace(ROW_RE, "this week is the ‹w› row");
let onlyBad = [], changed = 0;
SETS.forEach(L => Object.keys(FIX).forEach(f => {
  const own = I.generateLucy(FIX[f]), o = I.generateLucy(Object.assign({}, FIX[f], { notebookTheme: L.key }));
  ["student", "parent"].forEach(part => {
    if (norm(o[part]) !== norm(own[part])) { const a = norm(o[part]), b = norm(own[part]); let i = 0; while (a[i] === b[i]) i++; onlyBad.push(L.key + "/" + f + "/" + part + " @" + JSON.stringify(a.slice(i - 40, i + 40))); }
    if (o[part] !== own[part]) changed++;
    if (/\{\{lu:/.test(o[part])) onlyBad.push(L.key + "/" + f + "/" + part + " token left");
  });
  if ((o.student.match(/class="page"/g) || []).length !== (own.student.match(/class="page"/g) || []).length) onlyBad.push(L.key + "/" + f + " page count");
}));
ok(!onlyBad.length && changed === SETS.length * Object.keys(FIX).length * 2, SETS.length + " sets × " + Object.keys(FIX).length + " fixtures × student + parent: with every colour value and the row word taken out, identical to its own look — and every build did change colour", onlyBad.slice(0, 2).join(" | "));
{ const build = (fx, t) => I.generateLucy(Object.assign({}, fx, { notebookTheme: t })).student;
  const own = build(FIX.numberK, "") + build(FIX.writeFirst, ""), AMB = ["#92400e", "#fef3c7", "#fcd34d"];
  // the golds are re-hued only by a set with a warm colour (Plain); Ocean, Forest and Horse keep them, as their gold cards do
  const pl = build(FIX.numberK, "col-plain"), Pp = K.luLookPalette("col-plain"), sea = build(FIX.numberK, "col-ocean") + build(FIX.writeFirst, "col-ocean"), Po = K.luLookPalette("col-ocean");
  ok(AMB.every(v => own.indexOf(v) > 0 && pl.indexOf(v) < 0) && pl.indexOf("color:" + Pp.tagInk + "; line-height:1.3;") > 0 && sea.indexOf("color:" + Po.tagInk + "; line-height:1.3;") > 0 && Po.tagInk === "#92400e",
    "the Number thinking page's amber (\"Read aloud\" line, grown-up tag) moves with the golds: re-hued on Plain, kept on the sets that keep their golds");
  ok(own.indexOf(".lr-wl { border-bottom:1.5px solid #c4b5fd; }") > 0 && sea.indexOf(".lr-wl { border-bottom:1.5px solid " + Po.lilac + "; }") > 0 && Po.lilac !== "#c4b5fd", "…and the write-first lines and Notes pad turn with the purples"); }
{ const pk = Object.keys(NB.GENERATORS).filter(k => NB.GENERATORS[k].prek).concat(["kid9"]);
  ok(pk.every(k => ["", "col-ocean"].every(t => { const c = base({ notebookTheme: t || undefined, isPreK: true, nbGrade: "Pre-K", ladders: nl("k") }); if (k === "kid9") c.notebookTheme = "dino"; const a2 = NB.generate(k, c), b2 = OLD.generate(k, c); return a2.student === b2.student && a2.parent === b2.parent && /lnt-q/.test(a2.student); })), "a Pre-K notebook with the number ladder on builds exactly as before (its copy of the sheet is untouched)"); }
const thisMonth = (key) => (I.generateLucy(Object.assign({}, FIX.full, { notebookTheme: key })).student.match(ROW_RE) || [])[0];
ok(thisMonth("") === "this week is the purple row" && SETS.every(L => thisMonth(L.key) === "this week is the " + L.rowWord + " row"), "the one colour word follows the set: purple · " + SETS.map(L => L.rowWord).join(" · "));
const KEEPV = Object.keys(K.LU_PAL.keep);
ok(SETS.every(L => { const P = K.luLookPalette(L.key); return KEEPV.every(n => P[n] === OWN[n]); }), "the " + KEEPV.length + " \"keep\" colours (ink, greys, white, seasons, paper/screen tags, pace badges, the safety box) are the same on every set");
ok(SETS.every(L => { const P = K.luLookPalette(L.key); return ["main", "accent"].every(g => Object.keys(K.LU_PAL[g]).filter(n => P[n] !== OWN[n]).length >= Object.keys(K.LU_PAL[g]).length - 1); }), "each set re-hues the purples and the pinks");
const textOf = (h) => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
const emo = (h) => (textOf(h).match(/\p{Extended_Pictographic}/gu) || []).join("");
ok(SETS.every(L => emo(I.generateLucy(Object.assign({}, FIX.full, { notebookTheme: L.key })).student) === emo(fo.student)), "the pictures on the pages are the same on every set (" + emo(fo.student).length + " in the full fixture, 🦄 " + (emo(fo.student).match(/🦄/gu) || []).length + "×)");

// ── (c) every colour is the palette's ────────────────────────────────────────────────────────────────────────────────
console.log("(c) no colour literal left in the notebook's code");
const a0 = src.indexOf("  var LUCY_CSS = "), a1 = src.indexOf("\n  }\n", src.indexOf("  function generateLucy(ctx) {"));
let region = src.slice(a0, a1);
blocks.forEach(b => { if (b[0] > a0 && b[1] < a1) region = region.replace(src.slice(b[0], b[1]), ""); });
// NBLADREAD3's look table also holds the 4th- and 6th-grade notebooks' own reading-page colours (its tf: and ln: entries) —
// not this notebook's: they are left out of the scan by entry; its lu: entry (this notebook's) is scanned.
{ const t0 = region.indexOf("    tf: { map:"), t1 = region.indexOf("    lu: { line:");
  ok(t0 > 0 && t1 > t0 && region.lastIndexOf("NBLADREAD3_START", t0) > 0, "the older notebooks' reading-page looks (tf:, ln:) found inside NBLADREAD3 and left out of the scan");
  if (t0 > 0 && t1 > t0) region = region.slice(0, t0) + region.slice(t1); }
const unitLine = src.split("\n").find(l => /^\s+\w+:\s+\{ GD:"\{\{lu:dark\}\}"/.test(l)) || "";
const LIT = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|(?::\s*|fill="|stroke=")(white|black|transparent|red|blue|green|yellow|purple|pink|orange|gr[ae]y|gold|navy|teal)\b(?!-)/g;
const left = (region + unitLine).replace(/\{\{lu:\w+\}\}/g, "").match(LIT) || [];
ok(!left.length && region.length > 100000 && region.indexOf("NBLADREAD_START") > 0, "none in the sheet, the page code, the math pictures, the reading page, the strip call or the unit-page colours (" + Math.round(region.length / 1000) + " KB scanned)", left.slice(0, 5).join(" "));
ok(/\{\{lu:dark\}\}/.test(unitLine) && /"\{\{lu:bbPink\}\}", "\{\{lu:ppale\}\}", "\{\{lu:pink\}\}"/.test(region), "the unit-page colours and the \"pages today\" strip read the palette");
const lntMap = (/var LU_LNT_TOK = (\{[^}]*\})/.exec(blockTxt) || [])[1];
const used = new Set(tokens.map(t => t.slice(5, -2)).concat(lntMap ? Object.values(JSON.parse(lntMap)) : [])), names = Object.keys(OWN);
ok(lntMap && Object.keys(JSON.parse(lntMap)).length === 8, "the Number thinking sheet's 8 typed colours map to palette entries in the 1st-grade copy only");
ok(names.every(n => used.has(n)) && [...used].every(n => names.includes(n)), names.length + " palette entries, each used, and every token has one", names.filter(n => !used.has(n)).concat([...used].filter(n => !names.includes(n))).join());
ok(SETS.every(L => { const P = K.luLookPalette(L.key); return names.every(n => n === "rowWord" ? /^[a-z]+$/.test(P[n]) : K.luRgbOf(P[n]) || /^(white|transparent)$/.test(P[n])); }), "every set gives every entry a real colour");
ok(Object.keys(K.LU_PAL.word).length === 1, "one word in the palette (the row's colour name)");

// ── (d) contrast ─────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("(d) contrast — text on each card colour, and the print tints, on every set");
const lumOf = (v) => v === "white" ? 1 : K.luLum(K.luRgbOf(v));
const ratio = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// [text, background, what] — the pairs the sheet prints: body text, labels and headings on each card colour
const PAIRS = [["ink", "pale"], ["ink", "ppale"], ["ink", "gpale"], ["ink", "palePrint"], ["ink", "ppalePrint"], ["ink", "gpalePrint"], ["ink", "light"],
  ["dark", "pale"], ["dark", "light"], ["dark", "gpale"], ["dark", "palePrint"], ["dark", "lightPrint"], ["pink", "pale"], ["pink", "ppale"], ["pink", "gpale"], ["pink", "white"],
  ["pink", "ppalePrint"], ["mid", "pale"], ["mid", "white"], ["mid", "gpale"], ["goldInk", "gpale"], ["goldInk", "gpalePrint"], ["fff", "dark"], ["fff", "darkPrint"], ["fff", "mid"], ["fff", "compHead"],
  ["fff", "gold"], ["plight", "dark"], ["bbPink", "white"], ["violet", "white"], ["trace", "white"], ["safetyInk", "safetyBg"], ["muted", "white"], ["tagInk", "tagBg"], ["tagInk", "white"]];
const bodyText = PAIRS.filter(p => OWN[p[0]] && ratio(OWN[p[0]], OWN[p[1]]) >= 4.5);
let cBad = [], worst = 99;
SETS.forEach(L => { const P = K.luLookPalette(L.key); PAIRS.forEach(([t, b]) => {
  const r0 = ratio(OWN[t], OWN[b]), r = ratio(P[t], P[b]); worst = Math.min(worst, r / r0);
  if (r < r0 * 0.97 || (r0 >= 4.5 && r < 4.5)) cBad.push(L.key + " " + t + "/" + b + " " + r.toFixed(2) + " vs " + r0.toFixed(2)); }); });
ok(!cBad.length, PAIRS.length + " text-on-colour pairs × " + SETS.length + " sets: each within 3% of today's ratio (worst " + (worst * 100).toFixed(1) + "%), and the " + bodyText.length + " that pass 4.5:1 today still do", cBad.slice(0, 4).join("; "));
ok(SETS.every(L => { const P = K.luLookPalette(L.key); return ["ink", "dark", "pink"].every(t => ["pale", "ppale", "gpale", "palePrint", "ppalePrint", "gpalePrint"].every(b => ratio(P[t], P[b]) >= 4.5)); }), "body text, headings and labels on every card tint (screen and print) are ≥ 4.5:1 on every set");
const TINTS = [["pale", "palePrint"], ["ppale", "ppalePrint"], ["gpale", "gpalePrint"], ["light", "lightPrint"], ["plight", "plightPrint"], ["dark", "darkPrint"]];
let tBad = [];
SETS.forEach(L => { const P = K.luLookPalette(L.key); TINTS.forEach(([s, p]) => {
  const r0 = ratio(OWN[p], "#ffffff"), r = ratio(P[p], "#ffffff");
  if (r < r0 * 0.97) tBad.push(L.key + " " + p + " on white " + r.toFixed(3) + " vs " + r0.toFixed(3));
  if (s !== "dark" && !(lumOf(P[p]) < lumOf(P[s]))) tBad.push(L.key + " " + p + " not deeper than " + s); }); });
ok(!tBad.length, "the print tints: each as far from white as today's (they still show when printed light) and deeper than its screen tint, on every set", tBad.slice(0, 3).join("; "));
ok(SETS.every(L => { const P = K.luLookPalette(L.key); return ratio(P.palePrint, "#ffffff") >= 1.15 && ratio(P.ppalePrint, "#ffffff") >= 1.1 && ratio(P.gpalePrint, "#ffffff") >= 1.1; }), "every printed card tint is at least 1.1:1 off white");

// ── (e) the picker ───────────────────────────────────────────────────────────────────────────────────────────────────
console.log("(e) picking a set — the one look card");
let op = NB.notebookOptions(KID, {});
ok(JSON.stringify(op.looks) === JSON.stringify(K.LU_LOOKS.map(l => ({ key: l.key, label: l.label }))) && op.current === "" && op.prek === false && op.levels === null, "the notebook offers its own look + 4 colour sets; nothing saved = its own look on");
ok(JSON.stringify(op.looks[0]) === JSON.stringify(OLD.notebookOptions(KID, {}).looks[0]) && OLD.notebookOptions(KID, {}).looks.length === 1, "its own look keeps its key (\"\") and label; before this there was only that one");
ok(SETS.every(L => NB.notebookOptions(KID, { notebookTheme: L.key }).current === L.key) && NB.notebookOptions(KID, { notebookTheme: " COL-OCEAN " }).current === "col-ocean", "a saved set reads back as the one on");
ok(["dino", "forest", "bogus", null, ""].every(t => NB.notebookOptions(KID, { notebookTheme: t }).current === ""), "a Pre-K key, an unknown key, null or \"\" = its own look on (as it builds)");
ok(JSON.stringify(NB.notebookOptions(KID, { notebookTheme: "col-ocean" }).extraPages) === JSON.stringify(OLD.notebookOptions(KID, {}).extraPages), "its extra pages are unchanged");
const preKeys = Object.keys(NB.themes);
ok(SETS.every(L => !preKeys.includes(L.key) && /^col-/.test(L.key)) && preKeys.every(k => !/^col-/.test(k)), "set keys are \"col-…\" — apart from every Pre-K look key (" + preKeys.join(", ") + ")");
const others = Object.keys(NB.GENERATORS).filter(k => k !== KID).concat(["kid9"]);
const optSame = others.every(k => [{}, { isPreK: true }, { notebookTheme: "farm" }, { notebookTheme: "col-ocean" }, { isPreK: true, notebookTheme: "col-plain" }].every(o => JSON.stringify(NB.notebookOptions(k, o)) === JSON.stringify(OLD.notebookOptions(k, o))));
ok(optSame, "every other notebook's offer (the Pre-K looks, the starter notebook, the older notebooks) is unchanged, even with a col- key saved");
ok(others.every(k => ["col-ocean", "col-plain"].every(t => { const c = base({ notebookTheme: t, masteryItems: items }); const a = NB.generate(k, c), b = OLD.generate(k, c); return a.student === b.student && a.parent === b.parent; })), "every other notebook builds the same with a col- key saved");
ok(JSON.stringify(NB.unitPageTheme(KID, {})) === JSON.stringify(OLD.unitPageTheme(KID, {})) && others.every(k => JSON.stringify(NB.unitPageTheme(k, { notebookTheme: "col-ocean" })) === JSON.stringify(OLD.unitPageTheme(k, { notebookTheme: "col-ocean" }))), "Units-tab unit colours: its own look exactly as before; every other kid's unchanged");
const ut = NB.unitPageTheme(KID, { notebookTheme: "col-forest" }), P4 = K.luLookPalette("col-forest");
ok(ut.GD === P4.dark && ut.GM === P4.mid && ut.GOLD === P4.pink && ut.GOLDD === P4.pinkDeep && Object.values(ut).every(v => /^#[0-9a-f]{6}$/.test(v)), "…and in a set, the set's colours (as its notebook prints its unit pages)");
const ins = I.generateLucy(Object.assign({}, FIX.full, { notebookTheme: "col-forest" })).student;
ok(ins.indexOf(P4.dark) > 0 && ins.indexOf(OWN.dark) < 0, "a built notebook in a set carries none of the own look's dark purple");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
ok(/const looks=lookOpts\.looks\.map\(l=>pill\(l\.key===lookOpts\.current,esc\(l\.label\),"nbSetLook\('"\+sel\+"','"\+l\.key\+"'\)"/.test(html) && /db\.ref\("notebookSettings\/"\+kid\+"\/notebookTheme"\)\.set\(String\(key\|\|""\)\)/.test(html) && /function nbSetLook\(kid,key\)\{ if\(!momHere\(\)\) return;/.test(html) && /notebookTheme:nbThemeOf\(kid\)/.test(html),
  "the app's look card lists the offer, nbSetLook (Mom only) saves one field, and the build's ctx carries it — index.html unchanged");
ok(!/col-(plain|ocean|forest|horses)/.test(html), "index.html names none of the sets");
// NB_LOOKPICK (Mom's tick list + the Kids' Corner picker) builds only from looks that have a picture card (lookCard: the Pre-K
// looks). The colour sets have none, so this notebook offers 0 picture looks: the tick list and the kid's picker never show
// for it, and Mom's pills above stay the one control. Plainly not offered there — no second control.
ok(typeof NB.lookCard !== "function" || K.LU_LOOKS.every(l => NB.lookCard(l.key) === null), "the colour sets have no Kids' Corner picture card (lookCard → null): not offered in the tick list or Kids' Corner");
ok(!/function nbLookPickRow/.test(html) || /const offer=nbLookPickOffer\(sel,o\); if\(offer\.length<2\) return (part==="ticks"\?"":)?pillsHtml;/.test(html), "…so Mom's look card keeps its plain pills for this notebook (fewer than two picture looks → pills untouched)");

// ── (f) page fit in Chrome ───────────────────────────────────────────────────────────────────────────────────────────
// Each page's skeleton: every element's box height (0.1 px) and the page's own overflow, built IN the browser from notebooks.js
// alone (never the app) so the emoji-to-image swap and the fonts are in.
const MEASURE_FN = "function(doc){return Array.from(doc.querySelectorAll('.page')).map(function(pg){var h=[];pg.querySelectorAll('*').forEach(function(el){var r=el.getBoundingClientRect();h.push(Math.round(r.height*10),Math.round((r.top-pg.getBoundingClientRect().top)*10));});" +
  "return{over:Math.max(pg.scrollHeight-pg.clientHeight,pg.scrollWidth-pg.clientWidth),n:h.length,sig:h.join(',')};});}";
function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chrome)) { console.log("Chrome page fit — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lu-looka-"));
  const cfg = []; Object.keys(FIX).forEach(f => K.LU_LOOKS.forEach(L => cfg.push({ name: f + " · " + (L.key || "own"), fix: f, look: L.key, ctx: Object.assign({}, FIX[f], { notebookTheme: L.key }) })));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + file + '"></script><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ",KID=" + JSON.stringify(KID) + ";\n" +
    "(async function(){var res=[];for(var c of CFG){var o=window.HoweNotebooks.generate(KID,c.ctx);for(var part of ['student','parent']){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1200px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=o[part];});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,60);});res.push({name:c.name,fix:c.fix,look:c.look,part:part,pages:M(d),fonts:Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length});f.remove();}}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=1800000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 * 1024 * 1024, timeout: 900000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");   // Chrome can finish the page and still exit non-zero while shutting down — the result is on stdout
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome page fit — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome page fit ran", res ? res.error : "no result in the page"); return; }
  console.log("(f) page fit — Google Chrome headless, built in the browser, " + res[0].fonts + " font faces loaded");
  const ownOf = (r) => res.find(x => x.fix === r.fix && x.part === r.part && x.look === "");
  let pages = 0, diff = [], maxOver = 0, ownOver = 0;
  res.forEach(r => { const o = ownOf(r); pages += r.pages.length; r.pages.forEach((p, i) => { maxOver = Math.max(maxOver, p.over); if (!r.look) ownOver = Math.max(ownOver, p.over); if (!o.pages[i] || o.pages[i].sig !== p.sig || o.pages[i].over !== p.over) diff.push(r.name + " " + r.part + " page " + (i + 1)); }); });
  ok(res.length === Object.keys(FIX).length * K.LU_LOOKS.length * 2 && !diff.length, pages + " pages (" + Object.keys(FIX).length + " fixtures × " + K.LU_LOOKS.length + " looks × student + parent): every element the same height and place as on its own look", diff.slice(0, 4).join(" | "));
  ok(maxOver <= 0 && ownOver <= 0, "no page overflows its 8.5×11in sheet on any look (largest overflow " + maxOver + " px)");
}
chromeMeasure();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
