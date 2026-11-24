// 🔢 Lucy's math block from her own Math Facts cards (LU_MATH — study piece B "Math pictures — Lucy first",
// PLAN_notebooks_study_2026-11-23.md §19 / §24 B; her rule 11/23: the notebook complements the drills, adds practice where it
// is needed, adjusts per kid, and never supplies the answer). notebooks.js LU_MATH block + its marked call sites in
// generateLucy / luPageDaily / luPageEndOfWeek / luPageTeachingCompanion.   Run: node test_lucy_math.js
//   (a) no usable Math Facts cards → student + parent byte-identical to THIS tree with the LU_MATH block and its call sites
//       cut out (built below, no git); every other kid's notebook identical even with a Math Facts deck in ctx
//   (b) the picks: trouble first (the one 🔁 rule), capped by reviewCap, each on 2–3 DIFFERENT days, never twice on a page,
//       then new cards, then a week-seeded rotation; parked / × / unreadable cards never print; stable on re-print
//   (c) no answer on any page the child works on; the frame shows only the first number; no hops drawn; answers on the Companion
//   (d) addition-only, subtraction-only and mixed decks; sums to 10 and to 20 (path over line, square k over the step k−1 → k)
//   (e) ctx.mathPic: both (default) / path / line / frame
//   (f) Weekly Review focus card, End of Week row and the Companion describe the deck ("Adding within 8 · 3 new facts")
//   (g) page fit in real Chromium — Playwright if installed, else the Mac's Google Chrome headless, else SKIPPED
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const SRC = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d !== undefined ? "  → " + d : "")); } }
const clone = (o) => JSON.parse(JSON.stringify(o));
const strip = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const count = (s, sub) => s.split(sub).length - 1;

// ── the baseline: this tree without LU_MATH ─────────────────────────────────────────────────────────────────────
// Each call site as [with LU_MATH, without]. The block itself is cut from "  // LU_MATH_START" to the line after "// LU_MATH_END".
const CALLS = [
  ["    var words = luWordsWeek(ctx, days.length);   // LU_WORDS: the week's sight words, or null → nothing new prints\n    var math = luMathWeek(ctx, wn, days.length);   // LU_MATH: the week's facts from the Math Facts cards, or null → the old subtraction block\n    if (math) focus = [focus[0], math.focus];   // LU_MATH: the focus card describes the deck\n",
   "    var words = luWordsWeek(ctx, days.length);   // LU_WORDS: the week's sight words, or null → nothing new prints\n"],
  ["        xpStrip(pagesForDay(ctx, \"lucy\", day), \"#f472b6\", \"#fdf2f8\", \"#be185d\"), words ? words.days[i] : null, math ? math.days[i] : null));   // LU_MATH\n",
   "        xpStrip(pagesForDay(ctx, \"lucy\", day), \"#f472b6\", \"#fdf2f8\", \"#be185d\"), words ? words.days[i] : null));\n"],
  ["    parts.push(luPageEndOfWeek(wn, weekDates, blends, subtraction, days, tasks, math));   // LU_MATH\n",
   "    parts.push(luPageEndOfWeek(wn, weekDates, blends, subtraction, days, tasks));\n"],
  ["    var luCss = (phono ? LU_PHONO_CSS : \"\") + (words ? LU_WORDS_CSS : \"\") + (math ? LU_MATH_CSS : \"\");   // LU_WORDS · LU_MATH\n",
   "    var luCss = (phono ? LU_PHONO_CSS : \"\") + (words ? LU_WORDS_CSS : \"\");   // LU_WORDS\n"],
  ["    var companion = luPageTeachingCompanion(wn, weekDates, days, tasks, blends, subtraction, ctx.teachNotes || \"\", words, math);   // LU_MATH\n",
   "    var companion = luPageTeachingCompanion(wn, weekDates, days, tasks, blends, subtraction, ctx.teachNotes || \"\", words);\n"],
  ["  function luPageDaily(weekNum, day, dateStr, tasks, blend, subProblems, badge, year, extraStrip, word, mathDay) {   // LU_MATH: mathDay\n",
   "  function luPageDaily(weekNum, day, dateStr, tasks, blend, subProblems, badge, year, extraStrip, word) {\n"],
  ["  ${mathDay ? luMathCard(mathDay) : `<div class=\"card card-purple\" style=\"flex:1.05;min-height:0;display:flex;flex-direction:column;justify-content:space-between;\">\n    <div class=\"slabel\">Subtraction practice — try your best!</div>\n    <div class=\"sub-problems\">${subHtml}</div>\n    ${luNumberLine()}\n  </div>`}\n",
   "  <div class=\"card card-purple\" style=\"flex:1.05;min-height:0;display:flex;flex-direction:column;justify-content:space-between;\">\n    <div class=\"slabel\">Subtraction practice — try your best!</div>\n    <div class=\"sub-problems\">${subHtml}</div>\n    ${luNumberLine()}\n  </div>\n"],
  ["  function luPageEndOfWeek(weekNum, weekDates, blends, subtraction, days, tasks, math) {   // LU_MATH: math\n",
   "  function luPageEndOfWeek(weekNum, weekDates, blends, subtraction, days, tasks) {\n"],
  ["return b.digraph; }).join(\" · \") + \")\", math ? math.desc.row : \"Subtraction\"]);   // LU_MATH: the deck names the row\n",
   "return b.digraph; }).join(\" · \") + \")\", \"Subtraction\"]);\n"],
  ["    ${math ? luMathEowCard(math) : `<div class=\"card card-purple\">\n      <div class=\"slabel\">Subtraction answers — circle any that were tricky</div>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin:8px 0 6px;\">${ansHtml}</div>\n    </div>`}\n",
   "    <div class=\"card card-purple\">\n      <div class=\"slabel\">Subtraction answers — circle any that were tricky</div>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;margin:8px 0 6px;\">${ansHtml}</div>\n    </div>\n"],
  ["  function luPageTeachingCompanion(weekNum, weekDates, days, tasks, blends, subtraction, teachNotes, words, math) {   // LU_MATH: math\n",
   "  function luPageTeachingCompanion(weekNum, weekDates, days, tasks, blends, subtraction, teachNotes, words) {\n"],
  ["    Check ${math ? \"the math facts\" : \"subtraction answers\"} <em>with</em> Lucy",
   "    Check subtraction answers <em>with</em> Lucy"],
  ["      ${math ? luMathCompanion(math, days, DAY_NAMES) : `<div class=\"key-section\">\n        <div class=\"key-head\">Subtraction Answers — All Five Days</div>\n        <div class=\"key-body\">\n          ${subKeyRows}\n          <div class=\"key-row\"><div class=\"key-label\">Watch for</div><div style=\"font-size:10.5px;color:var(--muted);line-height:1.55;\">Common struggle: larger minus small (e.g. 10−3, 10−4). Have her use the number line on the page. Counting back on fingers is completely normal and expected. The goal is understanding \"take away,\" not memorized facts.</div></div>\n        </div>\n      </div>`}\n",
   "      <div class=\"key-section\">\n        <div class=\"key-head\">Subtraction Answers — All Five Days</div>\n        <div class=\"key-body\">\n          ${subKeyRows}\n          <div class=\"key-row\"><div class=\"key-label\">Watch for</div><div style=\"font-size:10.5px;color:var(--muted);line-height:1.55;\">Common struggle: larger minus small (e.g. 10−3, 10−4). Have her use the number line on the page. Counting back on fingers is completely normal and expected. The goal is understanding \"take away,\" not memorized facts.</div></div>\n        </div>\n      </div>\n"]
];
const B0 = SRC.indexOf("  // LU_MATH_START"), B1 = SRC.indexOf("  // LU_MATH_END\n\n");
let BASE = SRC.slice(0, B0) + SRC.slice(B1 + "  // LU_MATH_END\n\n".length);
CALLS.forEach(([now, was]) => { BASE = BASE.replace(now, () => was); });
function load(code) {
  const sb = { window: {}, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout };
  vm.runInNewContext(code, sb, { filename: "notebooks.js" });
  return sb.window.HoweNotebooks;
}
const HOOK = "_internal: {";
const NB = load(SRC.replace(HOOK, HOOK + " luMathWeek: luMathWeek, luMathParse: luMathParse,"));   // test-only reach into the block
const OLD = load(BASE);
const gen = (ctx, kid) => NB.generate(kid || "lucy", clone(ctx));
const genOld = (ctx, kid) => OLD.generate(kid || "lucy", clone(ctx));
const week = (ctx, n) => NB._internal.luMathWeek(clone(ctx), parseInt(String(ctx.weekNum).replace(/\D/g, ""), 10) || 1, n == null ? 5 : n);

// ── fixtures (made-up cards in the live deck's shape — no family data) ──────────────────────────────────────────
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T9 = ["📖 Morning Notebook — Morning Notebook", "📄 Dimensions Math 1A — Ch6-1", "📄 Math Reasoning B — pp. 5–12", "📄 HWT Letters and Numbers for Me — p. 53", "📱 Mathseeds Lesson — Lesson 72", "📞 Night Zookeeper Quest — Q43", "📞 Reading Eggs Lesson — Lesson 105", "🃏 Daily Drill", "📖 Closing Notebook — Closing Notebook"];
const tasksN = (n) => Object.keys(dates).flatMap(d => T9.slice(0, n).map(t => ({ who: "lucy", day: d, title: t, time: "8:00 AM" })));
const base = (extra, n) => Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates, tasks: tasksN(n == null ? 5 : n) }, extraPages: {} }, extra || {});
const mf = (prompts, extra) => prompts.map((p, i) => Object.assign({ id: "mf_" + i, subject: "Math Facts", prompt: p, status: "active", tier: "monthly", drop_count: 0, recentMiss: 0, review_mode: "flash", type: "math facts" }, (extra || {})[i] || {}));
const ADD16 = ["1+1", "1+2", "1+3", "1+4", "2+1", "2+2", "2+3", "2+4", "3+1", "3+2", "3+3", "3+4", "4+1", "4+2", "4+3", "4+4"];
const NEW3 = { 13: { status: "introduction", tier: "daily" }, 14: { status: "introduction", tier: "daily" }, 15: { status: "introduction", tier: "daily" } };
const lucyLike = (extra) => mf(ADD16, Object.assign({}, NEW3, extra || {}));
const SUB10 = ["5-2", "6-3", "7-4", "8-5", "9-6", "10-3", "10-4", "7-2", "9-4", "8-3", "6-1", "10-7"];
const MIX20 = ["9+8", "7+6", "12+5", "15-7", "13-4", "11-3", "8+5", "6+6", "14-6", "10+4", "17-9", "9+9"];
const words = ["said", "play", "come", "here", "look", "jump"].map((p, i) => ({ id: "sw_" + i, subject: "Sight Words", prompt: p, status: "active", tier: "monthly", drop_count: 0, recentMiss: i === 2 ? 1 : 0 }));
const ladder = ["sh", "th", "ck", "igh", "ch", "ee"].map((pg, i) => ({ pg, sounds: "/x/", lesson: 41 + i }));

console.log("(a) no usable Math Facts cards → exactly the old pages (baseline = this tree without LU_MATH)");
ok(B0 > 0 && B1 > B0 && count(SRC, "// LU_MATH_START") === 1 && count(SRC, "// LU_MATH_END") === 1, "one LU_MATH block");
CALLS.forEach(([now], i) => ok(count(SRC, now) === 1, "call site " + (i + 1) + " is in the tree exactly once", JSON.stringify(now.slice(0, 70))));
ok(!/LU_MATH|luMath|mathDay/.test(BASE), "with the block and the call sites cut, nothing of LU_MATH is left (every call site is listed above)");
const NODATA = {
  plain: base(), emptyMastery: base({ masteryItems: [] }),
  otherDecks: base({ masteryItems: words.concat([{ subject: "Science", prompt: "frog" }, { subject: "Numbers", prompt: "7" }]) }),
  timesOnly: base({ masteryItems: mf(["3×4", "2 x 5", "6 * 2", "12 ÷ 3"]) }),
  parkedOnly: base({ masteryItems: mf(["4+5", "5+5"], { 0: { status: "parked" }, 1: { status: "parked" } }) }),
  unreadable: base({ masteryItems: mf(["? + 3 = 5", "three plus four", "3 - 5", "", "1/2 + 1/4"]) }),
  pastTwenty: base({ masteryItems: mf(["15+12", "30-4", "19+2"]) }),
  mathPicNoDeck: base({ mathPic: "line", reviewCap: 5 }),
  bookPhonograms: base({ loe: ladder }, 9), sightWords: base({ masteryItems: words }, 9),
  withSpelling: base({ spelling: { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat"] }], practice: [] } }),
  fourDays: base({ weekData: { dates: { monday: dates.monday, tuesday: dates.tuesday, wednesday: dates.wednesday, thursday: dates.thursday }, tasks: tasksN(5) } })
};
Object.keys(NODATA).forEach(k => ok(JSON.stringify(gen(NODATA[k])) === JSON.stringify(genOld(NODATA[k])), "lucy/" + k + ": student + parent byte-identical"));
ok(/Subtraction practice — try your best!/.test(gen(NODATA.plain).student) && /Jump back on the number line/.test(gen(NODATA.plain).student), "…which is today's subtraction block and bare line");
const withDeck = base({ masteryItems: lucyLike({ 11: { recentMiss: 2 } }).concat(words), loe: ladder, mathPic: "path" });
for (const kid of ["julian", "caleb", "ellis", "lincoln", "kid9"]) ok(JSON.stringify(gen(withDeck, kid)) === JSON.stringify(genOld(withDeck, kid)), kid + ": unchanged even with a Math Facts deck in ctx");
const sharkCtx = Object.assign(clone(withDeck), { notebookTheme: "shark", kidName: "Finn" });
ok(JSON.stringify(gen(sharkCtx, "kid9")) === JSON.stringify(genOld(sharkCtx, "kid9")), "a themed starter kid: unchanged");

console.log("(b) the week's facts");
const P = NB._internal.luMathParse;
ok(P("4+2").key === "4+2" && P(" 4 + 2 = ").key === "4+2" && P("4 + 2 = ?").key === "4+2" && P("7 - 3").key === "7−3" && P("7 − 3").op === "−" && P("7 – 3").op === "−",
  "reads 4+2, \"4 + 2 =\", \"4 + 2 = ?\", 7-3, 7−3, 7–3");
ok([P("3×4"), P("3 - 5"), P("? + 3 = 5"), P("3+"), P("12 ÷ 3"), P("100+1")].every(x => x === null), "× ÷, a missing number, a negative answer, three digits → not a fact");
const keysOf = (w) => w.days.map(d => d.facts.map(f => f.key));
const noRepeatOnPage = (w) => w.days.every(d => new Set(d.facts.map(f => f.key)).size === d.facts.length);
const daysWith = (w, key) => w.days.map((d, i) => d.facts.some(f => f.key === key) ? i : -1).filter(i => i >= 0);
const reviewKeys = (w) => [...new Set(w.days.flatMap(d => d.facts.filter(f => f.review).map(f => f.key)))];
let w = week(base({ masteryItems: lucyLike({ 11: { recentMiss: 2 } }) }));
ok(w.days.length === 5 && w.days.every(d => d.facts.length === 3), "five days, three facts a day");
ok(noRepeatOnPage(w), "never the same fact twice on one page", JSON.stringify(keysOf(w)));
ok(JSON.stringify(reviewKeys(w)) === '["3+4"]' && daysWith(w, "3+4").length === 3, "one card in trouble (3+4): 🔁, on three different days", JSON.stringify(daysWith(w, "3+4")));
ok(daysWith(w, "3+4").every(i => w.days[i].facts[0].key === "3+4"), "…and it comes first on its pages (the ten-frame goes to it)");
ok(w.days.every(d => { const k = d.facts.map(f => f.review ? 0 : f.isNew ? 1 : 2); return k.every((v, i) => i === 0 || v >= k[i - 1]); }), "each page: trouble, then new, then the rest");
ok(["4+2", "4+3", "4+4"].every(k => daysWith(w, k).length >= 2) && w.days.every(d => d.facts.filter(f => f.isNew).length <= 2), "the three new cards come back across the week, at most two a page");
ok(w.days.every(d => d.facts.some(f => !f.isNew && !f.review)), "every page keeps one known fact in the mix");
ok(JSON.stringify(week(base({ masteryItems: lucyLike({ 11: { recentMiss: 2 } }) }))) === JSON.stringify(w), "same cards + same week → the same facts (a re-print matches)");
ok(gen(base({ masteryItems: lucyLike() })).student === gen(base({ masteryItems: lucyLike() })).student, "…and the same pages");
const w13 = week(base({ weekNum: "week13", masteryItems: lucyLike({ 11: { recentMiss: 2 } }) }));
ok(JSON.stringify(keysOf(w13)) !== JSON.stringify(keysOf(w)), "a new week shuffles the known facts differently");
let w2 = week(base({ masteryItems: lucyLike({ 2: { recentMiss: 1 }, 7: { recentMiss: 2 }, 9: { drop_count: 1, tier: "daily" } }) }));
ok(JSON.stringify(reviewKeys(w2)) === '["2+4","1+3"]', "three in trouble, default cap 2 → the two worst (recentMiss×3 + drop_count×2), worst first", JSON.stringify(reviewKeys(w2)));
ok(["2+4", "1+3"].every(k => daysWith(w2, k).length === 2) && daysWith(w2, "3+2").length <= 2, "with two, each comes back on two different days", JSON.stringify([daysWith(w2, "2+4"), daysWith(w2, "1+3")]));
ok(w2.days.every(d => d.facts.filter(f => f.review).length <= 2) && noRepeatOnPage(w2), "never more than two hard facts on a page");
const hard6 = { 0: { recentMiss: 3 }, 3: { recentMiss: 2 }, 5: { recentMiss: 1 }, 8: { drop_count: 2, tier: "daily" }, 10: { recentMiss: 1, drop_count: 1 }, 12: { drop_count: 1, tier: "every_other_day" } };
let w5 = week(base({ masteryItems: lucyLike(hard6), reviewCap: 5 }));
ok(reviewKeys(w5).length === 5 && reviewKeys(w5).every(k => daysWith(w5, k).length === 2), "reviewCap 5 (the most): five hard facts, two different days each", JSON.stringify(reviewKeys(w5).map(k => daysWith(w5, k))));
ok(w5.days.every(d => d.facts.filter(f => f.review).length <= 2 && d.facts.length === 3) && noRepeatOnPage(w5), "…still ≤ 2 hard a page and a full page");
ok(reviewKeys(week(base({ masteryItems: lucyLike(hard6), reviewCap: 9 }))).length === 5 && reviewKeys(week(base({ masteryItems: lucyLike(hard6), reviewCap: 3 }))).length === 3, "reviewCap clamps to 5; 3 → three");
const w0 = week(base({ masteryItems: lucyLike(hard6), reviewCap: 0 }));
ok(reviewKeys(w0).length === 0 && !/to practice again/.test(w0.focus.sub), "reviewCap 0 → no 🔁 at all");
ok(reviewKeys(week(base({ masteryItems: lucyLike({ 4: { drop_count: 2, tier: "monthly" } }) }))).length === 0, "same rule as the words: demoted but back on a slow tier = not in trouble");
const wp = week(base({ masteryItems: lucyLike({ 0: { status: "parked" }, 1: { status: "parked", recentMiss: 3 } }) }));
ok(!wp.days.some(d => d.facts.some(f => f.key === "1+1" || f.key === "1+2")), "parked cards (not taught yet) never print, even one marked missed");
const wdup = week(base({ masteryItems: mf(["3+4", "3 + 4", "3+4=", "2+2", "5+1"], { 1: { recentMiss: 1 } }) }));
ok(wdup.days.every(d => d.facts.length === 3) && reviewKeys(wdup).join() === "3+4" && noRepeatOnPage(wdup), "the same fact on two cards counts once (and keeps the trouble flag)");
const wsmall = week(base({ masteryItems: mf(["2+2", "3+1"], { 0: { recentMiss: 1 } }) }));
ok(wsmall.days.every(d => d.facts.length === 2) && noRepeatOnPage(wsmall), "a deck of two: two facts a page, no repeats");
ok(week(base({ masteryItems: lucyLike() }), 4).days.length === 4 && week(base({ masteryItems: lucyLike() }), 0) === null, "one set per school day (a 4-day week = 4)");
ok(week(base({ masteryItems: mf(["5+5"], {}).map(c => Object.assign(c, { subject: " math facts " })) })).days[0].facts[0].key === "5+5", "deck name matched like the words (case / spaces)");

console.log("(c) no answers where the child works; the frame shows only the first number; no hops");
const cardsOf = (h) => h.split('<div class="card card-purple lm-card').slice(1).map(c => c.slice(0, c.indexOf('<div class="divider"')));
const pageOf = (h, label) => { const i = h.indexOf('<div class="page-label">' + label); return i < 0 ? "" : h.slice(i, (h.indexOf('<div class="page-label">', i + 10) + 1 || h.length + 1) - 1); };
const CASES = {
  "sums ≤ 10 (the live deck's shape)": base({ masteryItems: lucyLike({ 11: { recentMiss: 2 } }) }),
  "sums to 20, + and −": base({ masteryItems: mf(MIX20, { 4: { recentMiss: 1 }, 10: { status: "introduction" }, 11: { status: "introduction" } }) }),
  "take-away only": base({ masteryItems: mf(SUB10, { 6: { recentMiss: 2 } }) }),
  "most hard cards (reviewCap 5)": base({ masteryItems: lucyLike(hard6), reviewCap: 5 })
};
for (const [label, ctx] of Object.entries(CASES)) {
  const o = gen(ctx), wk = week(ctx), cards = cardsOf(o.student), all = wk.days.flatMap(d => d.facts);
  const ans = (f) => f.op === "+" ? f.a + f.b : f.a - f.b, said = strip(o.student.replace(/<span class="sub-blank"><\/span>/g, " ___ "));   // an empty answer line reads as ___
  ok(cards.length === wk.days.length, label + ": one math card a day", cards.length);
  ok(all.every(f => !new RegExp("(^|\\D)" + f.a + "\\s*[+−-]\\s*" + f.b + "\\s*=\\s*" + ans(f) + "(\\D|$)").test(said)), label + ": no fact printed with its answer anywhere in the child's book");
  ok(!/Subtraction answers/.test(o.student) && !/class="sub-blank">[^<]/.test(o.student), label + ": the old answers block is gone; answer lines are empty");
  ok(cards.every((c, i) => { const f = wk.days[i].facts[0], fr = c.slice(c.indexOf('<svg class="lm-frame"'), c.indexOf("</svg>", c.indexOf('<svg class="lm-frame"'))); return count(fr, "<circle") === f.a; }),
    label + ": the ten-frame holds only the first number of the day's first fact");
  ok(cards.every(c => { const s = c.slice(c.indexOf('<svg class="lm-strip-svg"')); return count(s, "<path") === 1 && count(s, "<circle") === 0 && count(s, "<polyline") === 0; }), label + ": the path and line are blank — no hops drawn (one arrowhead only)");
  ok(cards.every((c, i) => wk.days[i].facts.every(f => c.indexOf('<span class="sub-num">' + f.a + '</span><span class="sub-op">' + (f.op === "+" ? "+" : "−") + '</span><span class="sub-num">' + f.b + '</span>') >= 0)), label + ": each card prints its three facts");
  ok(cards.every((c, i) => count(c, "🔁") === wk.days[i].facts.filter(f => f.review).length), label + ": 🔁 only on the facts giving trouble");
  const eow = pageOf(o.student, "End of Week"), eowCard = eow.slice(eow.indexOf("Math facts I practiced"), eow.indexOf("</div>\n    </div>", eow.indexOf("Math facts I practiced")));
  ok(eowCard.length > 20 && [...new Set(all.map(f => f.key))].every(k => { const f = all.find(x => x.key === k); return eowCard.indexOf(">" + f.a + " " + (f.op === "+" ? "+" : "−") + " " + f.b + "</div>") >= 0; }) && strip(eowCard).indexOf("=") < 0,
    label + ": End of Week lists the week's facts once each, no answers, to circle the tricky ones");
  const comp = o.parent.slice(o.parent.indexOf("Math Facts — Answers"));
  ok(wk.days.every(d => d.facts.every(f => comp.indexOf(f.a + (f.op === "+" ? "+" : "−") + f.b + "=" + ans(f)) >= 0)), label + ": every answer is on the Companion");
}
const lcomp = gen(CASES["sums ≤ 10 (the live deck's shape)"]).parent;
ok(/Monday<\/div><div><span class="key-ans">3\+4=7 🔁/.test(lcomp), "Companion: day by day, 🔁 on the hard one");
const mathBits = (o) => cardsOf(o.student).join("") + pageOf(o.student, "End of Week").slice(pageOf(o.student, "End of Week").indexOf("Math facts I practiced")) .slice(0, 900) + o.parent.slice(o.parent.indexOf("Math Facts — Answers"), o.parent.indexOf("App Lessons This Week"));
ok(Object.values(CASES).every(c => !/\bLucy\b|\bshe\b|\bher\b/i.test(strip(mathBits(gen(c))))), "no child's name and no she/her in anything LU_MATH prints (another family's child may use it)");

console.log("(d) the three kinds of deck, to 10 and to 20");
const firstCard = (ctx) => cardsOf(gen(ctx).student)[0];
const cAdd = firstCard(base({ masteryItems: lucyLike() })), cSub = firstCard(CASES["take-away only"]), cMix = firstCard(CASES["sums to 20, + and −"]);
ok(/Draw <b>\d+<\/b> more\.<br>How many now\?/.test(cAdd) && /Hop forward<br>to add/.test(cAdd) && !/Cross out|hop back/i.test(cAdd), "adding: \"Draw 2 more. How many now?\", \"Hop forward to add\"");
ok(/Cross out <b>\d+<\/b>\.<br>How many are left\?/.test(cSub) && /Hop back<br>to take away/.test(cSub) && !/Draw <b>|forward/.test(cSub), "taking away: \"Cross out 3. How many are left?\", \"Hop back to take away\"");
ok(/\+ hop forward<br>− hop back/.test(cMix), "mixed: both directions on the strip label");
const svgNums = (c, tag) => { const s = c.slice(c.indexOf('<svg class="lm-strip-svg"')); return [...s.matchAll(/<text x="([\d.]+)"[^>]*>(\d+)<\/text>/g)].map(m => [parseFloat(m[1]), +m[2]]); };
const rects = (c) => { const s = c.slice(c.indexOf('<svg class="lm-strip-svg"')); return [...s.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)].map(m => [parseFloat(m[1]), parseFloat(m[2])]); };
for (const [label, c, R] of [["to 10", cAdd, 10], ["to 20", cMix, 20]]) {
  const rs = rects(c), ticks = [...c.slice(c.indexOf('<svg class="lm-strip-svg"')).matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1"/g)].map(m => parseFloat(m[1]));
  const lineNums = svgNums(c).filter(([x, n], i, a) => i >= rs.length).map(([, n]) => n), pathNums = svgNums(c).slice(0, rs.length).map(([, n]) => n);
  ok(rs.length === R && pathNums.join() === Array.from({ length: R }, (_, k) => k + 1).join(), label + ": the path is squares 1…" + R + " (no zero)", pathNums.join());
  ok(ticks.length === R + 1 && lineNums.join() === Array.from({ length: R + 1 }, (_, k) => k).join(), label + ": the line runs 0…" + R + " with a tick at every number", lineNums.join());
  ok(rs.every(([x, wd], k) => Math.abs(x - ticks[k]) < 0.11 && Math.abs(x + wd - ticks[k + 1]) < 0.11), label + ": square k sits exactly over the step from k−1 to k");
}
ok(count(cAdd.slice(cAdd.indexOf('<svg class="lm-frame"'), cAdd.indexOf("</svg>", cAdd.indexOf('<svg class="lm-frame"'))), 'stroke-width="1.6"') === 1 && /^" style=/.test(cAdd), "sums to 10: one ten-frame");
const fr20 = cMix.slice(cMix.indexOf('<svg class="lm-frame"'), cMix.indexOf("</svg>", cMix.indexOf('<svg class="lm-frame"')));
ok(count(fr20, 'stroke-width="1.6"') === 2 && /^ lm-20" style=/.test(cMix), "past 10: two ten-frames, side by side (and the smaller to-20 fact size)");
const w20 = week(CASES["sums to 20, + and −"]);
ok(w20.range === 20 && week(base({ masteryItems: lucyLike() })).range === 10 && week(base({ masteryItems: mf(["6+4", "5+5"]) })).range === 10 && week(base({ masteryItems: mf(["6+5"]) })).range === 20, "the range follows the deck: sums to 10 → 0–10, past 10 → 0–20");
ok(week(base({ masteryItems: mf(["9+9", "19+2", "15+12"]) })).days.every(d => d.facts.length === 1 && d.facts[0].key === "9+9"), "a card past 20 is skipped (it fits neither two frames nor the 0–20 line)");
ok(week(base({ masteryItems: mf(["9+9"]) })).days[0].facts[0].key === "9+9" && count(firstCard(base({ masteryItems: mf(["12+3"]) })).slice(0, 4000), "<circle") === 12, "a first number past 10 fills one frame and spills into the second");

console.log("(e) ctx.mathPic");
const pic = (p) => firstCard(base({ masteryItems: lucyLike(), mathPic: p }));
const hasPath = (c) => rects(c).length > 0, hasLine = (c) => /<path d="M/.test(c), hasStrip = (c) => c.indexOf("lm-strip-svg") >= 0;
ok(hasPath(pic()) && hasLine(pic()) && pic() === pic("both") && pic("junk") === pic("both"), "default (and anything unknown) = both: the path over the line");
ok(hasPath(pic("path")) && !hasLine(pic("path")), "\"path\" = the path alone");
ok(!hasPath(pic("line")) && hasLine(pic("line")), "\"line\" = the line alone");
ok(!hasStrip(pic("frame")) && /lm-frame/.test(pic("frame")), "\"frame\" = the ten-frame only");

console.log("(f) the deck described, not typed in");
const lo = gen(base({ masteryItems: lucyLike({ 11: { recentMiss: 2 } }) })), rev = pageOf(lo.student, "Weekly Overview");
ok(/🔢 Adding<\/div>/.test(rev) && /Adding within 8<br>/.test(rev) && /3 new facts · 1 to practice again — daily practice/.test(rev) && !/Subtracting within 10/.test(lo.student), "Weekly Review focus card: \"Adding · Adding within 8 · 3 new facts · 1 to practice again\"");
ok(/<td>Adding facts<\/td>/.test(pageOf(lo.student, "End of Week")) && !/<td>Subtraction<\/td>/.test(lo.student), "End of Week rating row: \"Adding facts\"");
ok(/From the Math Facts cards: Adding within 8 · 3 new\./.test(lo.parent) && /Check the math facts <em>with<\/em>/.test(lo.parent) && !/Subtraction Answers/.test(lo.parent), "Companion: the cards described, the subtraction key gone");
ok(/Subtracting within 10/.test(gen(CASES["take-away only"]).student) && /Adding and subtracting within 18/.test(gen(CASES["sums to 20, + and −"]).student) && /<td>Math facts \(\+ and −\)<\/td>/.test(gen(CASES["sums to 20, + and −"]).student), "take-away and mixed decks are described the same way");
ok(/Facts from the drill cards — daily practice/.test(gen(base({ masteryItems: mf(["2+2", "3+3"]) })).student), "no new cards and none in trouble: a plain line");
ok(/\.lm-top \{/.test(lo.student) && !/\.lm-top \{/.test(gen(NODATA.plain).student), "its styles ride along only when the deck prints");

(async () => {
  console.log("(g) page fit — every page, the math card, the End of Week card, the Companion columns");
  const FIT = {
    "sums ≤ 10, 9 cards, words + book phonograms": base({ masteryItems: lucyLike({ 11: { recentMiss: 2 } }).concat(words), loe: ladder, teachNotes: "Short day Wednesday." }, 9),
    "sums to 20 (+ and −), 9 cards": base({ masteryItems: mf(MIX20, { 4: { recentMiss: 1 }, 10: { status: "introduction" }, 11: { status: "introduction" } }).concat(words), loe: ladder }, 9),
    "no trouble cards, 5 cards": base({ masteryItems: lucyLike() }),
    "reviewCap 5, five hard, to 20, 9 cards, words": base({ masteryItems: mf(MIX20, { 0: { recentMiss: 3 }, 2: { recentMiss: 2 }, 4: { recentMiss: 1 }, 6: { recentMiss: 1 }, 8: { drop_count: 2, tier: "daily" } }).concat(words), reviewCap: 5, loe: ladder, teachNotes: "Short day Wednesday." }, 9),
    "take-away only, path alone": base({ masteryItems: mf(SUB10, { 6: { recentMiss: 2 } }), mathPic: "path" }, 7),
    "line alone": base({ masteryItems: lucyLike(), mathPic: "line" }, 7),
    "ten-frame only, to 20": base({ masteryItems: mf(MIX20), mathPic: "frame" }, 9)
  };
  const MEASURE = function () {
    const r = [];
    document.querySelectorAll(".page").forEach(function (pg, i) {
      const lab = (pg.previousElementSibling && pg.previousElementSibling.className === "page-label") ? pg.previousElementSibling.textContent : "page " + i;
      const bad = [];
      if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) bad.push("page");
      const body = pg.querySelector(".body"); if (body && body.scrollHeight > body.clientHeight + 1) bad.push(".body +" + (body.scrollHeight - body.clientHeight));
      const m = pg.querySelector(".lm-card"), info = {};
      if (m) { const cs = getComputedStyle(m), inner = m.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const used = [].reduce.call(m.children, function (t, c) { const k = getComputedStyle(c); return t + c.offsetHeight + parseFloat(k.marginTop) + parseFloat(k.marginBottom); }, 0);
        info.card = used + "/" + inner; if (used > inner) bad.push(".lm-card content " + used + " > " + inner);   // stricter than scrollHeight: the bottom padding stays clear
        const top = m.querySelector(".lm-top"); if (top && top.scrollWidth > top.clientWidth + 1) bad.push(".lm-top wide +" + (top.scrollWidth - top.clientWidth));
        const fb = m.querySelector(".lm-framebox"), facts = m.querySelectorAll(".lm-fact"); if (fb && facts.length) { const lf = facts[facts.length - 1].getBoundingClientRect(); if (lf.right > fb.getBoundingClientRect().left + 1) bad.push("facts run into the frame"); } }
      pg.querySelectorAll(".key-section,.card-purple").forEach(function (el) { if (el.scrollHeight > el.clientHeight + 1) bad.push("." + el.className.split(" ").pop() + " +" + (el.scrollHeight - el.clientHeight)); });
      const c = pg.querySelector(".body > .col2"); if (c && pg.querySelector(".companion-header")) [].forEach.call(c.children, function (col, j) { info["col" + j] = col.scrollHeight + "/" + c.clientHeight; if (col.scrollHeight > c.clientHeight + 1) bad.push("companion column " + j); });
      r.push({ lab: lab, bad: bad, info: info });
    });
    return r;
  };
  let run = null, how = "";
  let pw = null;
  try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(cp.execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
  let browser = null;
  if (pw) { try { browser = await pw.chromium.launch(); const page = await browser.newPage(); how = "Playwright Chromium"; run = async (html) => { await page.setContent(html); return page.evaluate(MEASURE); }; } catch (e) { browser = null; } }
  const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!run && fs.existsSync(CHROME)) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lumath-"));
    how = "Google Chrome headless";
    run = async (html) => {
      const f = path.join(dir, "p.html");
      fs.writeFileSync(f, html.replace("</body>", "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body>"));
      for (let tryN = 0; tryN < 3; tryN++) {   // Chrome can print the page and still exit non-zero on teardown (e.g. an update staged) — read stdout either way
        const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof" + tryN), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 60000 });
        const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
        if (m) return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
      }
      return null;
    };
  }
  if (run && how.indexOf("Chrome headless") >= 0 && !(await run("<html><body><div class=\"page\"></div></body></html>"))) { run = null; console.log("  page measurement — SKIPPED (Google Chrome would not run headless here)"); }
  else if (!run) console.log("  page measurement — SKIPPED (no Playwright and no Chrome at " + CHROME + ")");
  if (run) {
    console.log("  measured with " + how + " (web fonts not loaded, as in the other notebook fit tests)");
    for (const [label, ctx] of Object.entries(FIT)) {
      const out = gen(ctx);
      for (const part of ["student", "parent"]) {
        const res = await run(out[part].replace(/<link[^>]*fonts\.googleapis[^>]*>/g, ""));
        if (!res) { ok(false, label + " (" + part + "): measured", "no result"); continue; }
        const bad = res.filter(p => p.bad.length), want = res.filter(p => /Daily Page|End of Week|Weekly Overview|Teaching Companion/.test(p.lab));
        ok(!bad.length && want.length === (part === "student" ? 7 : 1), label + " (" + part + "): nothing clips — " +
          want.map(p => p.lab.replace(/ — .*/, "").replace("Daily Page", p.lab.split("— ")[1] ? p.lab.split("— ")[1].slice(0, 3) : "") + (p.info.card ? " card " + p.info.card + "px" : "") + (p.info.col0 ? " cols " + p.info.col0 + " " + p.info.col1 : "")).join(" · "),
          bad.map(p => p.lab + ": " + p.bad.join(", ")).join("; "));
      }
    }
  }
  if (browser) await browser.close();
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
