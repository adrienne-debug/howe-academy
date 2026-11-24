// 🔁 NBNEEDS_GRAD — a card that slipped once but is now graduated stops counting as trouble (her yes 2026-11-23: "Yes, fix it").
// notebooks.js juCurriculumFromMastery SLOW_TIER + index.html NBNEEDS_SLOW gain `graduated`. Run: node test_nb_needs_graduated.js
//   (a) the notebook: graduated + drop_count > 0 + no recent miss → not flagged; the same card missed lately → still flagged
//   (b) the card (nbNeedsList) agrees with the notebook card for card, on every tier × drops × misses
//   (c) against the baseline (this tree minus the one word, both files): the ONLY cards that change are graduated, slipped,
//       not missed lately; every other tier/case is unchanged
//   (d) notebooks print differently only when a kid has such a card in a deck the notebook reads; with none, all built-in
//       notebooks are byte-identical to the baseline
const fs = require("fs"), path = require("path"), vm = require("vm");
const NBSRC = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const clone = (o) => JSON.parse(JSON.stringify(o));
function slice(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("marker missing: " + a); return src.slice(i, j + b.length); }
function loadNb(src) { const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx.window.HoweNotebooks; }

// ── baseline = this tree with the one word taken back out of both lists ─────────────────────────────
const NB_NEW = "var SLOW_TIER = { weekly: 1, bi_weekly: 1, biweekly: 1, monthly: 1, graduated: 1 };";
const APP_NEW = "const NBNEEDS_SLOW={ weekly:1, bi_weekly:1, biweekly:1, monthly:1, graduated:1 };";
ok(NBSRC.split(NB_NEW).length === 2 && html.split(APP_NEW).length === 2, "the notebook's rule and the card's copy both list graduated (once each)");
ok((NBSRC.match(/var SLOW_TIER/g) || []).length === 1, "notebooks.js has one trouble rule (Lucy's words and the level switches call juCurriculumFromMastery)");
const NBSRC0 = NBSRC.replace(NB_NEW, "var SLOW_TIER = { weekly: 1, bi_weekly: 1, biweekly: 1, monthly: 1 };");
const BLOCK = slice(html, "// NBNEEDS_START", "// NBNEEDS_END"), BLOCK0 = BLOCK.replace(APP_NEW, "const NBNEEDS_SLOW={ weekly:1, bi_weekly:1, biweekly:1, monthly:1 };");
ok(NBSRC0 !== NBSRC && BLOCK0 !== BLOCK, "baseline built from this tree (no git)");
const NB = loadNb(NBSRC), NB0 = loadNb(NBSRC0);

function appList(block, items, hist) {
  const g = { console, window: { HoweNotebooks: NB }, masteryData: { history: { k: hist || {} } }, scHistoryFor: (h, kid) => (h && h[kid]) || {},
    masteryFromApp: () => ({ k: clone(items) }), momHere: () => true, cap: (s) => s, notebookSettings: {}, nbThemeOf: () => null, nbLevelOf: () => null, nbReviewCap: () => 2 };
  vm.createContext(g); vm.runInContext(block + "\n;this.L=nbNeedsList;", g);
  return g.L("k");
}
const nbFlags = (lib, its) => its.filter(it => {   // the notebook's own answer, one card at a time (as test_nb_needs.js does)
  const cur = lib._internal.juCurriculumFromMastery([Object.assign({}, it, { subject: "Letters" })]);
  return !!cur.flag.letters[String(it.prompt).trim()];
}).map(it => it.id);

console.log("(a) the notebook's rule");
const G = (x) => Object.assign({ id: "g", subject: "Letters", prompt: "F", status: "active", tier: "graduated", drop_count: 1 }, x || {});
const I = NB._internal, I0 = NB0._internal;
ok(!I.juCurriculumFromMastery([G()]).flag.letters.F, "graduated, slipped once, not missed lately → no longer 🔁");
ok(!!I0.juCurriculumFromMastery([G()]).flag.letters.F, "(baseline: it was)");
ok(!!I.juCurriculumFromMastery([G({ recentMiss: 1 })]).flag.letters.F && I.juCurriculumFromMastery([G({ recentMiss: 1 })]).flagScore.letters.F === 5, "graduated but missed lately → still 🔁 (score 1*3 + 1*2)");
ok(!!I.juCurriculumFromMastery([G({ tier: "every_other_day" })]).flag.letters.F, "the same slip on a fast tier → still 🔁");
const lw = I.luWordsFromMastery([G({ subject: "Sight Words", prompt: "said" })], "sight words"), lw0 = I0.luWordsFromMastery([G({ subject: "Sight Words", prompt: "said" })], "sight words");
ok(!lw.flag.said && lw0.flag.said, "Lucy's word path follows (it calls the same rule)");

console.log("(b)+(c) every tier × drops × misses: notebook = card, and only graduated-slipped-not-missed changed");
const TIERS = ["daily", "every_other_day", "every_third_day", "weekly", "bi_weekly", "biweekly", "monthly", "learned", "graduated", "", undefined];
const grid = [];
TIERS.forEach((t, ti) => [0, 2].forEach(dc => [0, 1].forEach(rm => grid.push({ id: "c" + ti + "_" + dc + "_" + rm, subject: "Letters", prompt: "p" + ti + "_" + dc + "_" + rm, tier: t, drop_count: dc, status: "active", _rm: rm }))));
const hist = { "2026-11-20": { items: grid.filter(c => c._rm).map(c => ({ id: c.id, result: "m" })) } };
const withRm = grid.map(c => Object.assign({}, c, { recentMiss: c._rm }));
const card = appList(BLOCK, grid, hist).map(c => c.id).sort(), card0 = appList(BLOCK0, grid, hist).map(c => c.id).sort();
const nb = nbFlags(NB, withRm).sort(), nb0 = nbFlags(NB0, withRm).sort();
ok(JSON.stringify(card) === JSON.stringify(nb), "now: the card lists exactly the notebook's 🔁 cards (" + nb.length + " of " + grid.length + ")", card.join(",") + " vs " + nb.join(","));
ok(JSON.stringify(card0) === JSON.stringify(nb0), "baseline: the same agreement held before");
const gone = nb0.filter(id => nb.indexOf(id) < 0), added = nb.filter(id => nb0.indexOf(id) < 0);
const gi = TIERS.indexOf("graduated");
ok(JSON.stringify(gone) === JSON.stringify(["c" + gi + "_2_0"]) && added.length === 0, "the only change: graduated + slipped + not missed lately leaves the list", "gone " + gone.join(",") + " added " + added.join(","));
ok(nb.indexOf("c" + TIERS.indexOf("learned") + "_2_0") >= 0, "a 'learned' card that slipped still counts (left as it was — a question for Mom)");

console.log("(d) what prints differently");
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Dimensions Math 1A — Ch6-1", "🃏 Daily Drill", "📖 Closing Notebook — Closing Notebook"];
const C = (id, subject, prompt, x) => Object.assign({ id, subject, prompt, status: "active", tier: "daily", drop_count: 0 }, x || {});
const noGrad = ["A", "B", "C", "D", "E", "F", "G", "H"].map((l, i) => C("l" + i, "Letters", l, i === 1 ? { recentMiss: 1 } : i === 2 ? { drop_count: 2, tier: "weekly" } : {}))
  .concat(["Circle", "Square", "Hexagon"].map((s, i) => C("s" + i, "Shapes", s, i === 2 ? { drop_count: 3 } : {})))
  .concat(["said", "play", "come", "here", "look", "jump"].map((w, i) => C("w" + i, "Sight Words", w, i === 4 ? { drop_count: 1, tier: "monthly" } : {})))
  .concat([C("x", "Letters", "Q", { tier: "graduated", drop_count: 0 }), C("y", "German", "Hallo", { tier: "graduated", drop_count: 4 })]);   // graduated but never slipped; a deck no notebook reads
const gradLetter = noGrad.concat([C("gf", "Letters", "M", { tier: "graduated", drop_count: 2 })]);
const gradWord = noGrad.concat([C("gw", "Sight Words", "funny", { tier: "graduated", drop_count: 2 })]);
const ctxFor = (kid, its) => ({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates, tasks: Object.keys(dates).flatMap(d => T5.map(t => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {}, masteryItems: clone(its), reviewCap: 2 });
const same = (kid, its) => JSON.stringify(NB.generate(kid, ctxFor(kid, its))) === JSON.stringify(NB0.generate(kid, ctxFor(kid, its)));
["julian", "lucy", "ellis", "lincoln", "caleb", "kid9"].forEach(kid => ok(same(kid, noGrad), kid + ": no graduated card that slipped (a graduated never-slipped card, one in an unread deck) → byte-identical"));
["ellis", "lincoln", "kid9"].forEach(kid => ok(same(kid, gradLetter) && same(kid, gradWord), kid + ": reads no drill trouble → byte-identical even with one"));
ok(!same("julian", gradLetter) && !same("caleb", gradLetter.map(it => it.subject === "Letters" ? Object.assign({}, it, { subject: "Lowercase", prompt: it.prompt.toLowerCase() }) : it)), "Pre-K notebooks with a graduated slipped letter print differently (it stops coming back 🔁)");
const pl = NB.juPlanPreview(ctxFor("julian", gradLetter)), pl0 = NB0.juPlanPreview(ctxFor("julian", gradLetter));
const flaggedL = (p) => p.subjects.letters.items.filter(i => i.flagged).map(i => i.prompt).join(",");
ok(flaggedL(pl0).indexOf("M") >= 0 && flaggedL(pl).indexOf("M") < 0 && flaggedL(pl).indexOf("B") >= 0, "Julian's planner: M no longer flagged, B (missed lately) still is", flaggedL(pl0) + " → " + flaggedL(pl));
ok(same("lucy", gradLetter) && !same("lucy", gradWord), "Lucy's notebook: changes only with a graduated slipped Sight Word");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
