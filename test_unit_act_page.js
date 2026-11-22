// 🎨 UNITACTPG — the activity page, one renderer (PLAN_unit_sheet_2026-11-19.md §4.3, §5 row 4; her words 2026-11-22: "go with her
// answers and build"). Runs the REAL index.html code (haBuildUnitInsight, UNITCOVER's look, UNITACTPG, DAYCARD's dcLevel) and the
// REAL notebooks.js on a made-up family (kids "kida" Pre-K … "kidd" 7th) and a Builder-shaped unit with 10 cards; no real names.
//  · the four layouts still print (sheet / bio / compare / timeline), each with "Name ____ Date ____";
//  · the box page: a frame, "What I did" + "One thing I learned" by grade band (little: a bigger box and "I made ____");
//  · the notebook page and the Units tab's 🖨 Print give the SAME page — for every generator, in that kid's colours, same pool;
//    _unitActivityHtml (the second copy) is gone; no family or school name in the output; no footer;
//  · caps: 6 steps (+ N more), 28 timeline rows (+ N more); every blank empty — the app supplies nothing the child must produce;
//  · a notebook with no queued activity is byte for byte this tree without UNITACTPG; no database call anywhere.
// Page overflow (8.5×11in, clipped silently) is measured in headless Chrome — see the hand-over note; this file checks content.
//   run: node test_unit_act_page.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const rd = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const src = rd("index.html"), nbSrc = rd("notebooks.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;

console.log("── wiring ──");
const i0 = src.indexOf("// UNITACTPG_START"), i1 = src.indexOf("// UNITACTPG_END");
ok("index.html: one UNITACTPG block", i0 > 0 && i1 > i0 && src.indexOf("// UNITACTPG_START", i0 + 1) < 0);
ok("index.html: the second copy is gone (_unitActivityHtml, and _unitLearnedCards that only it used)", src.indexOf("_unitActivityHtml") < 0 && src.indexOf("_unitLearnedCards") < 0);
ok("index.html: unitPrintActivity is defined once, inside the block, and calls uapPrintDoc", (src.match(/function unitPrintActivity\(/g) || []).length === 1 && src.indexOf("function unitPrintActivity(") > i0 && src.indexOf("function unitPrintActivity(") < i1 && /uapPrintDoc\(u,act,kid\)/.test(fnIn(src, "unitPrintActivity")));
ok("index.html: haBuildUnitInsight queues the same spec (uapSpec)", /activities\.push\(uapSpec\(u,a,kid,cd\)\)/.test(fnIn(src, "haBuildUnitInsight")) && fnIn(src, "haBuildUnitInsight").indexOf("const spec=") < 0);
ok("the Units tab's 🖨 Print buttons still call unitPrintActivity(unit, activity, kid)", (src.match(/unitPrintActivity\(\\'/g) || []).length >= 2);
const n0 = nbSrc.indexOf("  // UNITACTPG_START"), n1 = nbSrc.indexOf("  // UNITACTPG_END\n");
ok("notebooks.js: one UNITACTPG block, before unitInsertPages", n0 > 0 && n1 > n0 && nbSrc.indexOf("  // UNITACTPG_START", n0 + 1) < 0 && nbSrc.indexOf("function unitInsertPages(") > n1);
const hooks = nbSrc.split("\n").filter(l => /   \/\/ UNITACTPG$/.test(l));
ok("notebooks.js: two one-line hooks — unitInsertPages' activity pages, and the export", hooks.length === 2 && /^    var actPages = acts\.map\(function \(act, ai\) \{ return .*uapPage\(act, \{ title: title, emoji: emoji, weekNum: weekNum, theme: _t, pool: ins\.learned \|\| \[\] \}\); \}\);/.test(hooks[0]) &&
  fnIn(nbSrc, "unitInsertPages").indexOf(hooks[0]) > 0 && /^    unitActivityPage: uapPage,/.test(hooks[1]), hooks);
ok("notebooks.js: the old in-insert copy of the four layouts is gone", fnIn(nbSrc, "unitInsertPages").indexOf('act.kind === "timeline"') < 0 && fnIn(nbSrc, "unitInsertPages").indexOf("Pick two you’ve learned") < 0);
const blockTxt = src.slice(i0, i1) + nbSrc.slice(n0, n1);
ok("no kid or family name in the new code", !NAMES.test(blockTxt.replace(/UNIT_INSERT_THEMES\.[a-z]+/g, "")), (blockTxt.match(NAMES) || [])[0]);
ok("no database call in either block", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase/i.test(blockTxt));
ok("no 🔀 emoji", blockTxt.indexOf("\u{1F500}") < 0);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);

// ── the notebooks ──
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const strip = s => { const a = s.indexOf("  // UNITACTPG_START"), b = s.indexOf("  // UNITACTPG_END\n"); s = s.slice(0, a) + s.slice(b + "  // UNITACTPG_END\n".length); return s.split("\n").filter(l => !/   \/\/ UNITACTPG$/.test(l)).join("\n"); };
const NB = load(nbSrc), NB0 = load(strip(nbSrc));
const genKeys = (cut(nbSrc, "  var GENERATORS = {", "\n  };").match(/^    ([a-z]+): \{ label:/gm) || []).map(l => l.trim().split(":")[0]);
const pkThemes = ["dino", "shark", "construction"].filter(k => cut(nbSrc, "  var NB_THEMES = {", "\n  };").indexOf("    " + k + ":") >= 0);
const GENS = genKeys.map(k => [k, {}]).concat(pkThemes.map(t => ["kidp" + t, { notebookTheme: t, nbGrade: "Pre-K" }]), [["kidz", {}]]);
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const ndates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const mk = (kid, units, extra) => Object.assign({ weekData: { dates: ndates, tasks: WEEKDAYS.map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" })) }, weekNum: 12, extraPages: {}, prevSummary: {}, pace: [], units, nbKidName: "Student" }, extra || {});
const CARDINS = (acts, learned) => ({ unitId: "bugs", title: "Backyard Bugs", emoji: "🐞", learning: [{ name: "Bug 1", group: "insect", bio: "Bugs have six legs.", portrait: { emoji: "🐞" } }], learned: learned || [{ name: "Bug 9", portrait: { emoji: "🐜" } }, { name: "Bug 10", portrait: { img: "https://img.example.org/b10.jpg" } }], next: [{ name: "Bug 2" }], extras: [], activities: acts || [] });
const SHEET = (band, extra) => Object.assign({ key: "draw", title: "Draw a bug", emoji: "🖍", desc: "Draw the bug you liked best.", kind: "sheet", lines: 0, points: 5, steps: ["Pick a bug", "Draw it"], entries: [], band }, extra || {});
const pageAt = (h, n) => { let k = -1; for (let i = 0; i <= n; i++) { k = h.indexOf('data-uap="1"', k + 1); if (k < 0) return ""; } const a = h.lastIndexOf('<div class="page">', k), e = h.indexOf("</div>\n</div>", k); return h.slice(a, e + "</div>\n</div>".length); };

console.log("── byte for byte with no queued activity ──");
ok("the stripped file has no trace of UNITACTPG", !/uapPage|UAP_|UNITACTPG|unitActivityPage/.test(strip(nbSrc)));
GENS.forEach(([kid, ex]) => {
  [["no units", []], ["a unit with cards", [CARDINS()]], ["a unit with no cards", [{ unitId: "rocks", title: "Rock Hunt", learning: [], learned: [], next: [], extras: [], activities: [] }]]].forEach(([lbl, units]) => {
    const a = NB.generate(kid, mk(kid, units, ex)), b = NB0.generate(kid, mk(kid, units, ex));
    ok(kid + ", " + lbl + ": identical to this tree without UNITACTPG", a.student === b.student && a.parent === b.parent && a.student.length > 1000);
  });
});

console.log("── the four layouts ──");
{
  const TL = { key: "tl", title: "Bug timeline", emoji: "📜", kind: "timeline", steps: [], entries: [{ year: "1700", name: "Bug A" }, { year: "1800", name: "Bug B" }], band: "middle" };
  const BIO = { key: "bio", title: "A bug's life", emoji: "📝", kind: "bio", steps: ["Pick one"], lines: 10, band: "middle" };
  const CMP = { key: "cmp", title: "Two bugs", emoji: "⚖️", kind: "compare", steps: [], lines: 8, band: "middle" };
  const h = NB.generate("kidz", mk("kidz", [CARDINS([SHEET("middle"), BIO, CMP, TL])])).student;
  const P = [0, 1, 2, 3].map(n => pageAt(h, n));
  ok("four activity pages, numbered after the unit page (2/5 … 5/5)", P.every(Boolean) && ["(2/5)", "(3/5)", "(4/5)", "(5/5)"].every(s => h.indexOf("Unit Study — Backyard Bugs " + s) > 0));
  ok("every layout has Name ____ and Date ____ under the header", P.every(p => p.indexOf(">Name <span") > 0 && p.indexOf(">Date <span") > 0));
  ok("sheet: the frame, What I did, One thing I learned", P[0].indexOf("What I did") > 0 && P[0].indexOf("One thing I learned") > 0 && /border:2px solid #0f766e;border-radius:12px;padding:4px/.test(P[0]));
  ok("bio: Pick one you’ve learned, the learned faces, a name line + 10 lines", P[1].indexOf("Pick one you’ve learned") > 0 && P[1].indexOf("Bug 9") > 0 && P[1].indexOf("b10.jpg") > 0 && (P[1].match(/border-bottom:1.5px solid #cbd5d1;height:22px/g) || []).length === 10);
  ok("compare: Pick two, two columns of 4 lines, What do they share? + 3", P[2].indexOf("Pick two you’ve learned") > 0 && P[2].indexOf("What do they share?") > 0 && (P[2].match(/border-bottom:1.5px solid #cbd5d1;height:22px/g) || []).length === 11);
  ok("timeline: one row per card with its year and a line", P[3].indexOf(">1700<") > 0 && P[3].indexOf(">Bug B<") > 0 && (P[3].match(/flex:1;border-bottom:1.5px solid #cbd5d1;height:14px/g) || []).length === 2);
  ok("points: the ⭐ worth line; none → no line", P[0].indexOf("⭐ Worth 5 points") > 0 && P[3].indexOf("⭐ Worth") < 0);
  ok("Mom's line and the steps as ☐ rows", P[0].indexOf("Draw the bug you liked best.") > 0 && P[0].indexOf(">Pick a bug<") > 0 && P[0].indexOf(">Draw it<") > 0);
  ok("no footer, no school or family name on any page", P.every(p => !NAMES.test(p) && p.indexOf("Academy") < 0));
  ok("no card story or definition on an activity page (names only)", P.every(p => p.indexOf("Bugs have six legs") < 0));
}

console.log("── the box page by grade band ──");
{
  const one = (band, extra) => pageAt(NB.generate("kidz", mk("kidz", [CARDINS([SHEET(band, extra)])])).student, 0);
  const lines = (p, h) => (p.match(new RegExp("border-bottom:1.5px solid #cbd5d1;height:" + h + "px", "g")) || []).length;
  const little = one("little"), early = one("early"), middle = one("middle"), upper = one("upper"), none = one(undefined);
  ok("little: the biggest box (420px at least) and one line, I made ____ — no written prompts", /min-height:420px/.test(little) && little.indexOf("I made <span") > 0 && little.indexOf("What I did") < 0 && little.indexOf("One thing I learned") < 0);
  ok("early: a 300px box, What I did (2 tall lines) + One thing I learned (1)", /min-height:300px/.test(early) && early.indexOf("What I did") > 0 && early.indexOf("One thing I learned") > 0 && lines(early, 32) === 3 && lines(early.slice(early.indexOf("One thing")), 32) === 1);
  ok("middle: a smaller box (200px) + 7 lines (4 + 3)", /min-height:200px/.test(middle) && lines(middle, 25) === 7 && lines(middle.slice(middle.indexOf("One thing")), 25) === 3);
  ok("upper: the same layout as middle", upper === middle);
  ok("no band → middle", none === middle);
  const ml = one("middle", { lines: 5 }), ml20 = one("early", { lines: 20 }), lit = one("little", { lines: 8 });
  ok("Mom's line count replaces the band's (5 → 3 + 2), capped at 10, not for little", lines(ml, 25) === 5 && lines(ml.slice(ml.indexOf("One thing")), 25) === 2 && lines(ml20, 32) === 10 && lit.indexOf("What I did") < 0);
  ok("the box is the one stretchy part (flex:1), a frame not a fill", [little, early, middle].every(p => /<div style="flex:1;min-height:\d+px;display:flex;border:2px solid [^;]+;border-radius:12px;padding:4px"><div style="flex:1;border:1px solid [^;]+;border-radius:9px"><\/div><\/div>/.test(p)));
  ok("every write line is empty (nothing the child must produce)", [little, early, middle].every(p => !/height:(22|25|32|38)px">[^<]/.test(p)));
}

console.log("── caps and escaping ──");
{
  const steps = Array.from({ length: 9 }, (_, i) => "Step " + (i + 1) + " " + "so many words ".repeat(i === 2 ? 20 : 1));
  const p = pageAt(NB.generate("kidz", mk("kidz", [CARDINS([SHEET("middle", { steps, desc: "Long ".repeat(200) })])])).student, 0);
  ok("9 steps → 6 shown + 3 more steps on the card", (p.match(/border-radius:4px;flex-shrink:0;margin-top:1px;box-sizing:border-box/g) || []).length === 6 && p.indexOf("+ 3 more steps on the card") > 0 && p.indexOf("Step 7") < 0);
  ok("Mom's line held to 4 lines, each step to 2", /line-height:1.5;color:#1c1c1e;display:-webkit-box;-webkit-line-clamp:4/.test(p) && (p.match(/-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">Step/g) || []).length === 6);
  const ents = Array.from({ length: 40 }, (_, i) => ({ year: String(1600 + i), name: "Card " + i }));
  const t = pageAt(NB.generate("kidz", mk("kidz", [CARDINS([{ key: "tl", title: "TL", kind: "timeline", entries: ents, steps: [] }])])).student, 0);
  ok("a 40-card timeline → 28 rows + 12 more", (t.match(/height:14px"><\/span><\/div>/g) || []).length === 28 && t.indexOf("+ 12 more") > 0);
  const big = { desc: "Long ".repeat(200), steps: Array.from({ length: 9 }, () => "word ".repeat(60)), points: 5 };
  const tb = pageAt(NB.generate("kidz", mk("kidz", [CARDINS([Object.assign({ key: "tl", title: "TL", kind: "timeline", entries: ents }, big)])])).student, 0);
  const nb = (tb.match(/height:14px"><\/span><\/div>/g) || []).length;
  ok("a full top (4-line note, 6 two-line steps) → the timeline lists fewer, as many as fit, and says + N more", nb >= 3 && nb < 28 && tb.indexOf("+ " + (40 - nb) + " more") > 0, nb);
  const sb = (b, x) => +(/<div style="flex:1;min-height:(\d+)px;display:flex;border:2px/.exec(pageAt(NB.generate("kidz", mk("kidz", [CARDINS([SHEET(b, Object.assign({}, big, x))])])).student, 0)) || [])[1];
  ok("a full top still leaves each band its box (420 / 300 / 200)", sb("little") === 420 && sb("early") === 300 && sb("middle") === 200, ["little", "early", "middle"].map(b => sb(b)));
  ok("…but with Mom's 10 tall lines on an early page the box gives up its size to keep the lines on the page, never under 120px", sb("early", { lines: 10 }) < 300 && sb("early", { lines: 10 }) >= 120, sb("early", { lines: 10 }));
  const bl = pageAt(NB.generate("kidz", mk("kidz", [CARDINS([{ key: "b", title: "B", kind: "bio", steps: [], lines: 22 }])])).student, 0);
  ok("bio / compare write-lines sit in a box that shrinks to the room left (whole lines only — measured in Chrome)", /<div data-uap-lines="1" style="flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column">/.test(bl) && (bl.match(/border-bottom:1.5px solid #cbd5d1;height:22px/g) || []).length === 22);
  const pool = Array.from({ length: 20 }, (_, i) => ({ name: "Learned " + i }));
  const b = pageAt(NB.generate("kidz", mk("kidz", [CARDINS([{ key: "b", title: "B", kind: "bio", steps: [] }], pool)])).student, 0);
  ok("bio pool shows 12 faces at most", (b.match(/<div style="width:58px;text-align:center">/g) || []).length === 12);
  const e = pageAt(NB.generate("kidz", mk("kidz", [CARDINS([SHEET("middle", { title: '<b>"x"</b>', desc: "<i>d</i> & e", steps: ["<u>s</u>"] })])])).student, 0);
  ok("title, Mom's line and steps are escaped", e.indexOf("<b>") < 0 && e.indexOf("<i>d") < 0 && e.indexOf("<u>s") < 0 && e.indexOf("&lt;i>d&lt;/i> &amp; e") > 0);
}

console.log("── the notebook page = the 🖨 Print page, every generator ──");
GENS.concat([["kidq", { notebookTheme: "shark", nbGrade: "K" }]]).forEach(([kid, ex]) => {
  const acts = [SHEET("early"), { key: "bio", title: "A bug's life", kind: "bio", steps: [], band: "early" }];
  const ins = CARDINS(acts);
  const h = NB.generate(kid, mk(kid, [ins], ex)).student;
  const look = { notebookTheme: ex.notebookTheme || null, nbLevel: {} };
  const same = acts.every((a, n) => pageAt(h, n) === NB.unitActivityPage(a, { title: ins.title, emoji: ins.emoji, weekNum: 12, theme: NB.unitPageTheme(kid, look), pool: ins.learned }));
  ok(kid + (ex.notebookTheme ? " (" + ex.notebookTheme + ")" : "") + ": unitActivityPage gives the notebook's page, byte for byte, in its colours", same);
});

console.log("── the app: the Units tab's 🖨 Print (real haBuildUnitInsight, dcLevel, uapSpec, uapPrintDoc) ──");
{
  const ROSTER_DEF = [{ id: "kida", grade: "Pre-K" }, { id: "kidb", grade: "1" }, { id: "kidc", grade: "4" }, { id: "kidd", grade: "7" }, { id: "kide", schoolAge: false }, { id: "kidf" }];
  const BUGS = () => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true, kidc: true, kidd: true },
    decks: [{ key: "Bugs", groupBy: "kind", cards: Array.from({ length: 10 }, (_, i) => ({ name: "Bug " + (i + 1), kind: "insect", def: "DEFSECRET" + (i + 1), year: String(1700 + i), order: i + 1 })) }],
    visuals: { "Bugs_Bug 3": { imageUrl: "https://img.example.org/bug3.jpg" } },
    activities: [{ key: "draw", title: "Draw a bug", emoji: "🖍", desc: "Draw one.", steps: { a: "Pick", b: "Draw" }, points: 5 }, { key: "life", title: "A bug's life", kind: "bio", lines: 6 },
      { key: "two", title: "Two bugs", kind: "compare" }, { key: "tl", title: "Bug timeline", kind: "timeline" }],
    nbActivity: { kida: ["draw"], kidb: { draw: true, life: true }, kidc: ["draw", "two", "tl"], kidd: "draw" } });
  const writes = [];
  const mast = { kida: [], kidb: [{ subject: "Bugs", prompt: "Bug 1", status: "introduction" }, { subject: "Bugs", prompt: "Bug 3", status: "review", tier: "weekly" }, { subject: "Bugs", prompt: "Bug 4", status: "review" }], kidc: { x: { subject: "Bugs", prompt: "Bug 2", status: "review" } }, kidd: [] };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isFinite, isNaN,
    window: { HoweNotebooks: NB }, unitStudies: { bugs: BUGS() }, masteryData: mast, ROSTER_DEF, ROSTER: ROSTER_DEF.map(k => k.id),
    MAST_MASTERY_TIER_DEFAULT: "monthly", mastTierAtLeast: () => false, nbTargetWkNum: () => 12, nbThemeOf: k => (k === "kida" ? "shark" : null), nbLevelOf: () => ({}),
    unitActPoints: a => a.points || 0, nbUnitDays: () => ({}), momHere: () => true,
    db: { ref: p => ({ set: () => writes.push(p), update: () => writes.push(p), remove: () => writes.push(p), transaction: () => writes.push(p), once: () => writes.push(p) }) } };
  vm.createContext(ctx);
  vm.runInContext([fnIn(src, "haKidUnits"), fnIn(src, "_unitCharDeck"), fnIn(src, "_unitPortrait"), fnIn(src, "haBuildUnitInsight"), fnIn(src, "_unitActs"), fnIn(src, "_nbActKeys"),
    fnIn(src, "dcLevel"), cut(src, "// UNITCOVER_START", "// UNITCOVER_END"), cut(src, "// UNITACTPG_START", "// UNITACTPG_END")].join("\n"), ctx);
  ok("grade bands from the roster: Pre-K little · 1 early · 4 middle · 7 upper · not school age little · no grade middle", J(["kida", "kidb", "kidc", "kidd", "kide", "kidf"].map(k => ctx.dcLevel(k))) === J(["little", "early", "middle", "upper", "little", "middle"]));
  const sp = ctx.uapSpec(ctx.unitStudies.bugs, ctx.unitStudies.bugs.activities[0], "kidb");
  ok("uapSpec: the fields the notebook always had, + band", J(sp) === J({ key: "draw", title: "Draw a bug", emoji: "🖍", desc: "Draw one.", kind: "sheet", lines: 0, points: 5, steps: ["Pick", "Draw"], entries: [], band: "early" }), sp);
  const tl = ctx.uapSpec(ctx.unitStudies.bugs, ctx.unitStudies.bugs.activities[3], "kidc");
  ok("uapSpec: a timeline lists the deck's cards in order, with their years", tl.entries.length === 10 && tl.entries[0].year === "1700" && tl.entries[9].name === "Bug 10");
  ["kida", "kidb", "kidc", "kidd"].forEach(kid => {
    const ins = ctx.haBuildUnitInsight(kid, ctx.unitStudies.bugs);
    const look = { notebookTheme: ctx.nbThemeOf(kid), nbLevel: {} };
    const h = NB.generate(kid, mk(kid, [ins], look)).student;
    ins.activities.forEach((a, n) => {
      const doc = ctx.uapPrintDoc(ctx.unitStudies.bugs, ctx.unitStudies.bugs.activities.find(x => x.key === a.key), kid);
      const pg = pageAt(h, n);
      ok(kid + " · " + a.key + " (" + a.band + "): the 🖨 Print document holds the very page the notebook prints", pg && doc.indexOf(pg) > 0 && /^<!DOCTYPE html>/.test(doc));
    });
  });
  const doc = ctx.uapPrintDoc(ctx.unitStudies.bugs, ctx.unitStudies.bugs.activities[0], "kidb");
  ok("the print names no family or school, and has no footer", !NAMES.test(doc.replace(/LINCOLN_CSS/g, "")) && doc.indexOf("Academy") < 0, (doc.match(NAMES) || [])[0]);
  ok("the print carries no card definition", doc.indexOf("DEFSECRET") < 0);
  ok("bio pool = the kid's learned cards, as the notebook's (Bug 3 with its photo, Bug 4; not Bug 1 in learning)", (() => { const d = ctx.uapPrintDoc(ctx.unitStudies.bugs, ctx.unitStudies.bugs.activities[1], "kidb"); return d.indexOf(">Bug 3<") > 0 && d.indexOf("bug3.jpg") > 0 && d.indexOf(">Bug 4<") > 0 && d.indexOf(">Bug 1<") < 0; })());
  ok("a Pre-K kid's print is in the kid's look (shark colours) and the little band", (() => { const d = ctx.uapPrintDoc(ctx.unitStudies.bugs, ctx.unitStudies.bugs.activities[0], "kida"); return d.indexOf(NB.unitPageTheme("kida", { notebookTheme: "shark" }).GD) > 0 && d.indexOf("I made <span") > 0; })());
  let wrote = "", opened = 0;
  ctx.window.open = () => { opened++; return { document: { write: s => { wrote += s; }, close: () => {} } }; };
  vm.runInContext("var open=window.open; var alert=function(){};", ctx);
  ctx.unitPrintActivity("bugs", "draw", "kidc");
  ok("unitPrintActivity opens one print window with the page and a print call", opened === 1 && wrote.indexOf('data-uap="1"') > 0 && wrote.indexOf("window.print()") > 0);
  ctx.unitPrintActivity("bugs", "nope", "kidc"); ctx.unitPrintActivity("none", "draw", "kidc");
  ok("an unknown activity or unit prints nothing", opened === 1);
  ctx.window.HoweNotebooks = null;
  ctx.unitPrintActivity("bugs", "draw", "kidc");
  ok("notebook code not loaded yet → no window (a message instead)", opened === 1);
  ok("no database write anywhere", writes.length === 0, writes);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
