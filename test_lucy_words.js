// 🔤 Lucy's Sight Word of the Day + "My Words" page (LU_WORDS — slice 1 of PLAN_notebook_lucy_2026-11-10.md; her go-ahead
// to build 2026-11-21, every §6 default). notebooks.js LU_WORDS block + index.html LU_WORDS_WIRE. Run: node test_lucy_words.js
//   (a) no Sight Words deck (or My Words off) → student + parent byte-identical to origin/main abb03281; My Words turned on
//       with no deck → the Dolch list, exactly one more page
//   (b) the week's words walk the deck: missed words first with 🔁 (through juWeekPicks), the cursor continues / reprints /
//       opens on the words being learned; reviewCap 0 → no 🔁
//   (c) every daily page carries its word in the dotted font, and nothing on the card is filled in for her
//   (d) the My Words page: the five words, three lines each, + the Spelling words she is learning
//   (e) the Companion lists the five, new / review
//   (f) Julian / Caleb / the shark kid / Ellis / Lincoln / a starter kid: byte-identical to main even with a Sight Words deck
//   (g) the index.html wire: read + save, one targeted path, change-checked, ?dryrun=1 inert, at print / PDF / tablet send
//   (h) page fit in real Chromium when Playwright is installed (else SKIPPED): Mon–Fri with 5, 7, 9 cards, a 10-letter word
// If Lucy's notebook is changed ON PURPOSE later, refresh BEFORE with: node test_lucy_words.js --hashes
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
global.window = {};
eval(src);
const NB = window.HoweNotebooks, I = NB._internal;
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const clone = (o) => JSON.parse(JSON.stringify(o));
const hash = (o) => crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 16);
const gen = (ctx, kid) => NB.generate(kid || "lucy", clone(ctx));
const pages = (h) => (h.match(/<div class="page">/g) || []).length;
const strip = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// ── fixtures (a made-up deck in the live deck's shape — no family data) ─────────────────────────
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T9 = ["📖 Morning Notebook — Morning Notebook", "📄 Dimensions Math 1A — Ch6-1", "📄 Math Reasoning B — pp. 5–12", "📄 HWT Letters and Numbers for Me — p. 53", "📱 Mathseeds Lesson — Lesson 72", "📞 Night Zookeeper Quest — Q43", "📞 Reading Eggs Lesson — Lesson 105", "🃏 Daily Drill", "📖 Closing Notebook — Closing Notebook"];
const tasksN = (n) => Object.keys(dates).flatMap(d => T9.slice(0, n).map(t => ({ who: "lucy", day: d, title: t, time: "8:00 AM" })));
const base = (extra, n) => Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates, tasks: tasksN(n == null ? 5 : n) }, extraPages: {} }, extra || {});
const W = ["said", "play", "come", "here", "look", "jump", "where", "little", "funny", "yellow", "three", "down"];
const deck = (extra, words) => (words || W).map((p, i) => Object.assign({ id: "fx_" + i, subject: "Sight Words", prompt: p, status: "active", tier: "monthly", drop_count: 0, review_mode: "flash", type: "sight words" }, (extra || {})[i] || {}));
const spell = ["cat", "hat", "ran", "bed", "red", "best"].map((p, i) => ({ id: "sp_" + i, subject: "Spelling", prompt: p, status: (i >= 2 && i < 5) ? "introduction" : "active", tier: "monthly", drop_count: 0 }));
// the Math Facts card is "3 × 4": LU_MATH (test_lucy_math.js) turns + and − cards into the daily math block, so a "3 + 4" card
// would change these pages on purpose; a × card is skipped there, so this stays a "decks other than Sight Words" fixture.
const other = [{ subject: "Math Facts", prompt: "3 × 4" }, { subject: "Science", prompt: "frog" }].concat(spell);
const NODATA = {
  plain: base(), emptyMastery: base({ masteryItems: [] }), otherDecks: base({ masteryItems: other }),
  cursorNoDeck: base({ masteryItems: other, wordCursor: { week: 11, idx: 3, adv: 5 } }),
  deckButOff: base({ masteryItems: deck().concat(spell), extraPages: { myWords: { on: false } } }),
  loe: base({ loe: [{ pg: "sh", sounds: "/sh/", lesson: 41 }, { pg: "th", sounds: "/th/", lesson: 42 }] }),
  nineCards: base({}, 9), withSpelling: base({ spelling: { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat"] }], practice: [] } })
};
const big = base({ masteryItems: deck({ 1: { recentMiss: 2 } }).concat(spell, [{ subject: "Letters", prompt: "A" }, { subject: "Numbers", prompt: "3" }]), wordCursor: { week: 11, idx: 2, adv: 5 } });
const snap = {};
for (const k in NODATA) snap["lucy/" + k] = hash(gen(NODATA[k]));
for (const kid of ["julian", "caleb", "ellis", "lincoln", "kid9"]) snap[kid + "/withSightWords"] = hash(gen(big, kid));
snap["shark/withSightWords"] = hash(gen(Object.assign(clone(big), { notebookTheme: "shark", kidName: "Finn" }), "kid9"));
if (process.argv.includes("--hashes")) { console.log(JSON.stringify(snap)); process.exit(0); }
// sha256 (first 16 hex) of JSON.stringify(generate(kid, ctx)) — taken from origin/main abb03281, BEFORE LU_WORDS.
// Pre-K hashes refreshed ON PURPOSE 2026-11-24 (PK_COVERFIT, test_prek_cover_fit.js): three CSS lines join every Pre-K notebook's
// sheet so the cover's cards can't run off the page; with that block cut out of notebooks.js the old hashes come back exactly.
// lincoln/withSightWords refreshed ON PURPOSE 2026-11-24 (LN_ANSWER_SPREAD, test_ln_answer_spread.js): built-in choices reordered; block cut out → 92fec5297fe46073 comes back.
const BEFORE = {"lucy/plain":"af77007c75d1b458","lucy/emptyMastery":"af77007c75d1b458","lucy/otherDecks":"af77007c75d1b458","lucy/cursorNoDeck":"af77007c75d1b458","lucy/deckButOff":"af77007c75d1b458","lucy/loe":"36d587741a627cef","lucy/nineCards":"bd3fdff7318ec50f","lucy/withSpelling":"0e61fdac2fa0584b",
  "julian/withSightWords":"e88cb68251dc5fac","caleb/withSightWords":"7cd035ca23163a8a","ellis/withSightWords":"375283d2cc0727d3","lincoln/withSightWords":"812c9624eab5f2fd","kid9/withSightWords":"477f4e9017a4f89d","shark/withSightWords":"bfbdaa67682c2693"};

console.log("(a) no deck / My Words off → byte-identical to main");
Object.keys(NODATA).forEach(k => ok(snap["lucy/" + k] === BEFORE["lucy/" + k], "lucy/" + k, "now " + snap["lucy/" + k]));
ok(gen(NODATA.plain).wordCursor === undefined && gen(NODATA.deckButOff).wordCursor === undefined, "no words printed → no wordCursor reported (nothing to save)");
const dol = gen(base({ extraPages: { myWords: { on: true } } })), plain = gen(NODATA.plain);
ok(pages(dol.student) === pages(plain.student) + 1 && pages(dol.parent) === pages(plain.parent), "My Words turned on with no deck: exactly one more student page, same Companion page count",
  pages(dol.student) + " vs " + pages(plain.student));
ok(I.LU_DOLCH.length === 92 && new Set(I.LU_DOLCH).size === 92, "the Dolch fallback = pre-primer + primer, 92 distinct words");
ok(/Sight word of the day/.test(dol.student) && /Dolch pre-primer \+ primer list/.test(dol.parent) && dol.wordCursor && dol.wordCursor.week === 12,
  "…and the daily pages walk the Dolch list (Companion says so; it keeps a cursor too)");
ok(NB.extraPageCatalog && NB.extraPageCatalog.lucy.some(p => p.key === "myWords" && p.label === "My Words"), "Notebook tab ▸ extra pages lists My Words for Lucy (the on/off switch)");

console.log("(b) the week's words");
const words = (ctx, n) => I.luWordsWeek(clone(ctx), n == null ? 5 : n);
const misses = { 1: { recentMiss: 1 }, 3: { recentMiss: 2 } };
let w = words(base({ masteryItems: deck(misses) }));
ok(w.days.map(d => d.word).join(" ") === "here play little funny yellow", "deck of 12, two missed (outside the window): those two first, worst first, then the next three in deck order",
  w.days.map(d => d.word).join(" "));
ok(w.days[0].review && w.days[1].review && !w.days[2].review && !w.days[4].review, "the two missed words carry 🔁, the rest don't");
ok(JSON.stringify(w.cursor) === JSON.stringify({ week: 12, idx: 7, adv: 3 }), "cursor = {week 12, start 7, advanced by the 3 natural words shown}", JSON.stringify(w.cursor));
let w13 = words(base({ weekNum: "week13", masteryItems: deck(), wordCursor: w.cursor }));
ok(w13.days.map(d => d.word).join(" ") === "three down said play come", "week 13 continues from the cursor (start 7 + 3) and wraps", w13.days.map(d => d.word).join(" "));
let w12again = words(base({ masteryItems: deck(misses), wordCursor: w.cursor }));
ok(JSON.stringify(w12again) === JSON.stringify(w), "re-printing week 12 with its own cursor prints the same words and the same cursor");
let w14 = words(base({ weekNum: "week14", masteryItems: deck(), wordCursor: w.cursor }));
ok(w14.days[0].word === W[(7 + 3 + 5) % 12], "a skipped week advances 5 more (juLetterStart's arithmetic)", w14.days[0].word);
let wcap = words(base({ masteryItems: deck(misses), reviewCap: 0 }));
ok(wcap.days.map(d => d.word).join(" ") === "little funny yellow three down" && wcap.days.every(d => !d.review), "reviewCap 0 → no 🔁, the plain window", wcap.days.map(d => d.word).join(" "));
let wfront = words(base({ masteryItems: deck({ 9: { status: "introduction", tier: "daily" }, 10: { status: "introduction", tier: "daily" } }) }));
ok(wfront.days.map(d => d.word).join(" ") === "yellow three down said play" && wfront.days[0].isNew && wfront.days[1].isNew && !wfront.days[3].isNew,
  "first print, no cursor: opens on the words she is learning (status introduction), marked new", wfront.days.map(d => d.word).join(" "));
let wdrop = words(base({ masteryItems: deck({ 2: { drop_count: 2, tier: "daily" }, 4: { drop_count: 1, tier: "monthly" } }) }));
ok(wdrop.days[0].word === "come" && wdrop.days[0].review && wdrop.days.filter(d => d.review).length === 1, "same 🔁 rule as Julian's letters: demoted and not back to a slow tier = review; recovered = not");
ok(words(base({ masteryItems: deck() }), 4).days.length === 4 && words(base({ masteryItems: deck() }), 0) === null, "one word per school day (a 4-day week = 4 words)");
const wsm = words(base({ masteryItems: deck({}, ["the", "a", "see"]) }));
ok(wsm.days.length === 5 && wsm.days.every(d => ["the", "a", "see"].indexOf(d.word) >= 0), "a deck smaller than the week wraps");
ok(I.luWordsFromMastery([{ subject: " sight words ", prompt: " is " }])?.list[0] === "is" && I.luWordsFromMastery(other) === null, "deck match ignores case/spaces; no Sight Words items → null");

console.log("(c) the daily page");
const ctxDeck = base({ masteryItems: deck(misses).concat(spell) });
const o = gen(ctxDeck), dlist = w.days.map(d => d.word);
const cards = o.student.split('<div class="lw-word">').slice(1).map(c => c.slice(0, c.indexOf('<div class="lw-cap">') + 80));
ok(cards.length === 5, "five daily pages, five Sight Word cards", cards.length);
ok(dlist.every((wd, i) => cards[i].indexOf('<div class="lw-big">' + wd + '</div>') >= 0 && cards[i].indexOf(wd.split("").map(c => "#" + c).join("")) >= 0),
  "each day's card shows its word and traces it in the No Tears dotted font");
ok(cards.every((c, i) => strip(c).replace(/#/g, "") === ("🔤 Sight word of the day " + (w.days[i].review ? "🔁 practice again " : "") + dlist[i] + " " + dlist[i] + (dlist[i].length <= 6 ? " " + dlist[i] : "") + " Write it: 📖 Read it to a grown-up ☐").replace(/\s+/g, " ")),
  "nothing on the card but the word, its trace, an empty writing line and a box to tick — no answer-like text", strip(cards[0]));
ok(!/missed in drills|Dolch|new this week/.test(strip(o.student)), "Mom's words (missed in drills / new) stay on the Companion");
ok((o.student.match(/Today's apps and work — check off as you go/g) || []).length === 5 && (o.student.match(/class="pill pill-/g) || []).length === 25, "every card still lists the day's apps as chips");
const lw = gen(base({ masteryItems: deck({}, ["everything", "said", "play", "come", "here"]) }, 9));
ok(/<div class="lw-big">everything<\/div>\s*<div class="nt-trace lw-trace" style="font-size:22px;">#e#v#e#r#y#t#h#i#n#g<\/div>/.test(lw.student), "a 10-letter word: one 22px trace (two copies only for words up to 6 letters)");
ok(/\.lw-chips \.pill \{ font-size:9px;/.test(o.student) && !/\.lw-chips/.test(plain.student), "the compact styles ride along only when the words print");

console.log("(d) the My Words page");
const mwStart = o.student.indexOf("📝 My Words"), mw = mwStart > 0 ? o.student.slice(mwStart, o.student.indexOf('<div class="page-label">', mwStart) > 0 ? o.student.indexOf('<div class="page-label">', mwStart) : undefined) : "";
ok(mwStart > o.student.indexOf("End of Week") && mwStart > 0, "it prints right after End of Week (the day / activity-back pairs don't move)");
ok(pages(o.student) === pages(gen(NODATA.plain).student) + 1, "exactly one more page than without the deck");
ok(dlist.every(wd => mw.indexOf(">" + wd + "</div>") >= 0) && (mw.match(/height:17px"><\/div>/g) || []).length === 15, "lists the five words, three writing lines each", (mw.match(/height:17px"><\/div>/g) || []).length);
ok(/<div class="page-label">My Words — Week 12<\/div>/.test(o.student) && !/page-label">Spelling — /.test(o.student), "its screen label says My Words");
ok(/This week's sight words/.test(mw) && />Week 12</.test(mw) && !/Week week12/.test(mw), "labelled, with a clean week number");
ok(/Practice Words/.test(mw) && ["ran", "bed", "red"].every(s => mw.indexOf(">" + s + "</div>") >= 0) && mw.indexOf(">cat</div>") < 0, "+ the Spelling-deck words she is learning (not the ones she knows)");
const withAAS = gen(Object.assign(clone(ctxDeck), { spelling: NODATA.withSpelling.spelling }));
ok(!/📝 My Words/.test(withAAS.student) && /📝 Spelling/.test(withAAS.student) && /Sight word of the day/.test(withAAS.student), "a kid with a real Spelling page keeps it; the daily word still prints");

console.log("(e) the Companion");
const comp = o.parent.slice(o.parent.indexOf("🔤 Sight Words This Week"));
ok(comp.length > 30 && dlist.every(wd => comp.indexOf('<span class="key-ans">' + wd + '</span>') >= 0), "lists the five words");
ok(/>Mon<\/span> <span class="key-ans">here<\/span> <span[^>]*>🔁 missed in drills</.test(comp) && />Wed<\/span> <span class="key-ans">little<\/span> <span[^>]*>review</.test(comp), "day by day, 🔁 missed in drills / review");
ok(/>new</.test(gen(base({ masteryItems: deck({ 9: { status: "introduction" } }) })).parent), "a word she is learning is marked new");
ok(/Her Sight Words deck, in order/.test(comp) && /Spelling words: ran, bed, red/.test(comp), "where the words come from + the Spelling words on My Words");

console.log("(f) every other notebook unchanged, even with a Sight Words deck and a cursor in ctx");
Object.keys(BEFORE).filter(k => k.indexOf("lucy/") !== 0).forEach(k => ok(snap[k] === BEFORE[k], k, "now " + snap[k]));

console.log("(g) index.html wire");
const wireS = html.indexOf("// LU_WORDS_WIRE_START"), wireE = html.indexOf("// LU_WORDS_WIRE_END"), wire = html.slice(wireS, wireE);
ok(wireS > 0 && wireE > wireS, "LU_WORDS_WIRE block present");
ok(/function luWordsCursorOf\(kid\)\{[^\n]*notebookSettings[^\n]*\.wordCursor/.test(wire) && /juPicks:juPicks, wordCursor:luWordsCursorOf\(kid\), numberCursor:/.test(html), "haNbContext passes wordCursor from notebookSettings/<kid>/wordCursor");
ok(/if\(!out\|\|!out\.wordCursor\|\|!db\|\|_dryRun\(\)\) return;/.test(wire), "save is gated: needs a cursor, db, and not ?dryrun=1");
ok(/oc\.week===nc\.week&&oc\.idx===nc\.idx&&oc\.adv===nc\.adv\) return;/.test(wire), "only when it changed (same-week reprints write nothing)");
ok((wire.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\("notebookSettings\/"\+kid\+"\/wordCursor"\)\.set\(nc\)/.test(wire), "exactly one write: the targeted notebookSettings/<kid>/wordCursor path");
ok((html.match(/luWordsPersistCursor\(kid,out\);/g) || []).length === 3, "saved at print, PDF and tablet send (Lucy's notebook is in tablet mode)");
const nbtFn = html.slice(html.indexOf("function nbtPersistCursors(kid,out){"), html.indexOf("function nbtPersistCursors(kid,out){") + 1200);
ok(/luWordsPersistCursor\(kid,out\)/.test(nbtFn), "…including nbtPersistCursors (tablet send)");
ok((html.match(/wordCursor/g) || []).length === wire.match(/wordCursor/g).length + 1, "wordCursor is touched nowhere else in index.html");

(async () => {
  console.log("(h) page fit");
  let pw = null;
  try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(require("child_process").execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
  if (!pw) console.log("  Chromium page measurement — SKIPPED (Playwright not installed)");
  else {
    let browser; try { browser = await pw.chromium.launch(); } catch (e) { console.log("  Chromium page measurement — SKIPPED: " + e.message.split("\n")[0]); }
    if (browser) {
      const page = await browser.newPage();
      const ladder = ["sh", "th", "ck", "igh", "ch", "ee", "er", "wh", "oi", "oy", "ai", "ay", "ng", "ar", "or", "tch", "ou", "ough"].map((pg, i) => ({ pg, sounds: "/x/", lesson: 41 + i }));
      const long = deck({ 0: { recentMiss: 1 } }, ["everything", "said", "play", "come", "here", "little"]);
      for (const n of [5, 7, 9]) for (const [label, ctx] of [["deck", base({ masteryItems: deck(misses).concat(spell) }, n)], ["10-letter word + book phonograms", base({ masteryItems: long.concat(spell), loe: ladder, teachNotes: "Short day Wednesday." }, n)], ["Dolch", base({ extraPages: { myWords: { on: true } } }, n)]]) {
        const out = gen(ctx);
        for (const part of ["student", "parent"]) {
          await page.setContent(out[part].replace(/<link[^>]*fonts\.googleapis[^>]*>/g, ""));
          const bad = await page.evaluate(() => { const b = []; document.querySelectorAll(".page").forEach((pg, i) => {
            if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) b.push(i + ": page");
            pg.querySelectorAll(".lw-apps,.lw-word,.lw-trace,.key-section").forEach(el => { if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) b.push(i + ": ." + el.className.split(" ").pop()); });
            const c = pg.querySelector(".body > .col2"); if (c && pg.querySelector(".companion-header")) [...c.children].forEach((col, j) => { if (col.scrollHeight > c.clientHeight + 1) b.push(i + ": companion column " + j); });
          }); return b; });
          ok(!bad.length, n + " cards, " + label + " (" + part + "): nothing clips", bad.slice(0, 4).join("; "));
        }
      }
      await browser.close();
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
