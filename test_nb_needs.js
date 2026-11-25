// 🔁 NBNEEDS — "Giving trouble this week" on the Notebook tab (study step 1 "See it", her yes 2026-11-23).
// index.html NBNEEDS block (helpers + Mom card) + notebooks.js NBNEEDS block (HoweNotebooks.reviewDecks). Run: node test_nb_needs.js
//   (a) the helper's recent-miss count = haNbContext's own (its code sliced out of index.html and run on the same fixtures)
//   (b) the helper flags exactly what the notebook's rule flags (juCurriculumFromMastery run on the same cards): missed
//       lately, "almost", dropped but recovered to weekly / bi-weekly / monthly, parked, in introduction, the 7th-oldest day
//   (c) by card, not by text: a two-direction card stays two cards; worst first by recentMiss*3 + drop_count*2
//   (d) reviewDecks: which decks each notebook brings to paper, worked out from the code (Pre-K looks, levels, Lucy's, others)
//   (e) the card: a Pre-K kid, a school-age kid with nothing in trouble, one with many (the "Show all" fold); Mom only;
//       before notebooks.js loads; My Words off
//   (f) read-only: the block writes nothing; the review stepper keeps its one home, now for every kid whose notebook reads it
//   (g) generator output for every built-in notebook is byte-identical with and without the notebooks.js block
const fs = require("fs"), path = require("path"), vm = require("vm");
const NBSRC = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const clone = (o) => JSON.parse(JSON.stringify(o));
function slice(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("marker missing: " + a); return src.slice(i, j + b.length); }
function loadNb(src) { const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx.window.HoweNotebooks; }
const NB = loadNb(NBSRC), I = NB._internal;

// ── fixtures: a made-up family's cards and practice days (no real data) ─────────────────────────────
const C = (id, subject, prompt, x) => Object.assign({ id, subject, prompt, status: "active", tier: "daily", drop_count: 0 }, x || {});
const items = [
  C("a", "Letters", "A"),                                              // missed on the newest day
  C("b", "Letters", "B"),                                              // "almost" (~) twice
  C("q", "Letters", "Q"),                                              // missed only on the 7th-newest day → out of the window
  C("hex", "Shapes", "Hexagon", { drop_count: 3, tier: "daily" }),    // slipped, not back up
  C("cir", "Shapes", "Circle", { drop_count: 2, tier: "weekly" }),    // slipped but back to weekly → recovered
  C("sq", "Shapes", "Square", { drop_count: 2, tier: "monthly" }),    // recovered, but missed lately → in
  C("bi", "Shapes", "Oval", { drop_count: 1, tier: "bi_weekly" }),    // recovered
  C("bi2", "Shapes", "Star", { drop_count: 1, tier: "biweekly" }),    // recovered (other spelling)
  C("n7", "Numbers", "7", { status: "parked", drop_count: 1, tier: "" }),   // parked + slipped → the notebook still flags it
  C("n8", "Numbers", "8", { status: "parked", drop_count: 0, tier: "" }),   // parked, never slipped → no
  C("n19", "Numbers", "19", { status: "introduction", tier: "" }),          // in introduction, only shown → no
  C("n20", "Numbers", "20", { status: "introduction", tier: "" }),          // in introduction, but missed → in
  C("red", "Colors", "Red"),                                                // answered right → no
  C("cat", "Animals", "Cat", { drop_count: 1, tier: "every_other_day" }),   // slipped, a fast tier → in
  C("blank", "Shapes", "  ", { drop_count: 4 }),                            // no front → the notebook skips it
  C("gn1", "German", "Gute Nacht", { drop_count: 1 }),                      // two directions of one card,
  C("gn2", "German", "Gute Nacht", { drop_count: 2 }),                      //   same text → still two cards
  C("rex", "Dinosaurs", "T. rex")                                           // a deck no notebook reads, missed
];
const day = (res) => ({ items: Object.keys(res).map(id => ({ id, result: res[id] })) });
const history = { kidx: {
  "2026-11-02": day({ q: "m", red: "c" }),                       // 7th-newest → outside the 6-day window
  "2026-11-03": day({ b: "~", n19: "s" }),
  "2026-11-04": day({ sq: "m", red: "c" }),
  "2026-11-05": day({ n20: "m" }),
  "2026-11-06": day({ b: "~", rex: "m" }),
  "2026-11-09": { items: { 0: { id: "rex", result: "m" }, 1: { id: "red", result: "c" } } },   // items stored as an object
  "2026-11-10": day({ a: "m", n19: "c" })
} };

// ── the index.html block, run with the app's globals stubbed ────────────────────────────────────────
const BLOCK = slice(html, "// NBNEEDS_START", "// NBNEEDS_END");
function appCtx(opt) {
  opt = opt || {};
  const writes = [];
  const g = {
    console, window: { HoweNotebooks: opt.noLib ? undefined : NB },
    masteryData: { history: clone(opt.history || { [opt.kid || "kidx"]: history.kidx }) },
    scHistoryFor: (h, kid) => (h && h[kid]) || {},
    masteryFromApp: () => ({ [opt.kid || "kidx"]: clone(opt.items || items) }),
    momHere: () => opt.mom !== false,
    cap: (s) => ({ kidx: "Robin", julian: "Robin", lucy: "Robin", ellis: "Robin", lincoln: "Robin", kid9: "Robin" })[s] || s,
    notebookSettings: clone(opt.settings || {}),
    nbThemeOf: (k) => (((opt.settings || {})[k]) || {}).notebookTheme || null,
    nbLevelOf: (k) => (((opt.settings || {})[k]) || {}).nbLevel || null,
    nbReviewCap: (k) => { const v = (((opt.settings || {})[k]) || {}).reviewCap; const n = parseInt(v, 10); return isNaN(n) ? 2 : Math.max(0, Math.min(5, n)); },
    db: { ref: (p) => ({ set: () => writes.push(p), update: () => writes.push(p), remove: () => writes.push(p) }) },
    HA_LS: { setItem: (k) => writes.push("ls:" + k) }, _dryRun: () => false
  };
  vm.createContext(g); vm.runInContext(BLOCK + "\n;this.nbNeedsList=nbNeedsList;this.nbNeedsMissMap=nbNeedsMissMap;this.nbNeedsCardHtml=nbNeedsCardHtml;this.nbNeedsReach=nbNeedsReach;this.nbNeedsReadsCap=nbNeedsReadsCap;", g);
  g._writes = writes;
  return g;
}

console.log("(a) recent misses = haNbContext's count");
const CTXSNIP = slice(html, "  let mItems=(mastery[kid]||[]);", "    mItems=mItems.map(it=>Object.assign({},it,{recentMiss:miss[it.id]||0}));\n  }catch(e){}");
ok(/recentKeys=Object\.keys\(kh\)\.sort\(\)\.reverse\(\)\.slice\(0,6\)/.test(CTXSNIP) && /it\.result==="m"\|\|it\.result==="~"/.test(CTXSNIP), "haNbContext still counts \"m\"/\"~\" on the 6 newest day keys (the code sliced below)");
function ctxItems(its, hist, kid) {
  const g = { masteryData: { history: clone(hist) }, scHistoryFor: (h, k) => (h && h[k]) || {}, mastery: { [kid]: clone(its) }, kid: kid, out: null };
  vm.createContext(g); vm.runInContext("(function(){" + CTXSNIP + "\n out=mItems; })()", g);
  return g.out;
}
const fromCtx = ctxItems(items, history, "kidx");
const A = appCtx(), miss = A.nbNeedsMissMap("kidx");
ok(fromCtx.every(it => !it || (miss[it.id] || 0) === it.recentMiss), "every card's recentMiss from haNbContext = the helper's count",
  JSON.stringify(fromCtx.filter(Boolean).map(it => [it.id, it.recentMiss, miss[it.id] || 0])));
ok(miss.a === 1 && miss.b === 2 && miss.rex === 2 && !miss.q && !miss.n19 && !miss.red, "A ×1, B ×2 (almost), T. rex ×2 (object-shaped day too); Q's miss is 7 days back; shown / right don't count", JSON.stringify(miss));
ok(Object.keys(A.nbNeedsMissMap("nobody")).length === 0, "a kid with no practice days → no misses");
// a hole (null) in the card list: haNbContext's join throws and the notebook sees no recent misses at all — the helper matches
const holed = items.slice(0, 3).concat([null], items.slice(3));
const ctxHoled = ctxItems(holed, history, "kidx"), H = appCtx({ items: holed });
ok(ctxHoled.every(it => !it || it.recentMiss === undefined), "(the app today: a hole in the cards → haNbContext hands the notebook no recentMiss)");
ok(JSON.stringify(H.nbNeedsList("kidx").map(c => c.id).sort()) === JSON.stringify(["cat", "gn1", "gn2", "hex", "n7"]) && H.nbNeedsList("kidx").every(c => c.recentMiss === 0),
  "…and the helper shows the same: only the slipped cards, no recent misses", JSON.stringify(H.nbNeedsList("kidx").map(c => c.id)));

console.log("(b) the same cards the notebook's rule flags");
const list = A.nbNeedsList("kidx"), ids = list.map(c => c.id).sort();
// the notebook's own answer: juCurriculumFromMastery on the cards haNbContext hands it, one deck at a time as its Letters subject
// (luWordsFromMastery's trick), so every deck — not only the five Pre-K ones — goes through the one rule
const nbFlagged = [];
const decks = [...new Set(fromCtx.filter(Boolean).map(it => String(it.subject)))];
decks.forEach(dk => {
  const deck = fromCtx.filter(it => it && it.subject === dk);
  deck.forEach(it => {   // one card at a time, so two cards with the same text are judged apart
    const cur = I.juCurriculumFromMastery([Object.assign({}, it, { subject: "Letters" })]);
    if (cur.flag.letters[String(it.prompt).trim()]) nbFlagged.push(it.id);
  });
});
const preK = I.juCurriculumFromMastery(fromCtx.filter(Boolean));   // and as the Pre-K notebook itself reads them, in place
const preKflag = [];
["letters", "numbers", "shapes", "colors", "animals"].forEach(s => Object.keys(preK.flag[s]).forEach(p => preKflag.push(s + ":" + p)));
ok(JSON.stringify(ids) === JSON.stringify(nbFlagged.sort()), "helper list = juCurriculumFromMastery's flags, card by card", ids.join(",") + " vs " + nbFlagged.join(","));
ok(JSON.stringify(list.filter(c => ["Letters", "Numbers", "Shapes", "Colors", "Animals"].includes(c.deck)).map(c => c.deck.toLowerCase() + ":" + c.prompt).sort()) === JSON.stringify(preKflag.sort()),
  "the five Pre-K decks, read in place: exactly the 🔁 flags the Pre-K notebook builds", preKflag.join(","));
ok(JSON.stringify(ids) === JSON.stringify(["a", "b", "cat", "gn1", "gn2", "hex", "n20", "n7", "rex", "sq"]),
  "in: missed (A), almost (B), slipped on a fast tier (Hexagon, Cat), recovered-but-missed (Square), parked+slipped (7), introduction+missed (20), German ×2, T. rex", ids.join(","));
ok(!ids.includes("cir") && !ids.includes("bi") && !ids.includes("bi2") && !ids.includes("q") && !ids.includes("n8") && !ids.includes("n19") && !ids.includes("red") && !ids.includes("blank"),
  "out: back to weekly / bi_weekly / biweekly, a miss 7 days back, parked never slipped, introduction only shown, answered right, no front");

console.log("(c) by card, worst first");
ok(list.filter(c => c.prompt === "Gute Nacht").length === 2, "a two-direction card with the same text stays two cards");
const sc = (id) => list.find(c => c.id === id).score;
ok(sc("hex") === 6 && sc("b") === 6 && sc("rex") === 6 && sc("sq") === 7 && sc("a") === 3 && sc("n7") === 2, "score = recentMiss*3 + drop_count*2", JSON.stringify(list.map(c => [c.id, c.score])));
ok(list.every((c, i) => i === 0 || list[i - 1].score >= c.score), "sorted worst first");
ok(list[0].id === "sq" && list.find(c => c.id === "n7").status === "parked", "Square (missed + slipped) tops the list; a parked card carries its status");

console.log("(d) which decks each notebook brings to paper — from the code");
const rd = (kid, opt) => NB.reviewDecks(kid, opt || {});
const dk = (r) => r.decks.map(d => d.deck).join(",");
ok(rd("julian").readsCap && dk(rd("julian")) === "Letters,Numbers,Shapes,Colors,Animals", "the dinosaur Pre-K notebook: Letters, Numbers, Shapes, Colors, Animals (reads reviewCap)", dk(rd("julian")));
ok(rd("caleb", { nbLevel: { nbLowercase: false } }).readsCap && dk(rd("caleb", { nbLevel: { nbLowercase: false } })) === "Letters,Numbers,Shapes,Colors", "the construction look counts its own picture → no Animals (pkPlanSubs)", dk(rd("caleb", { nbLevel: { nbLowercase: false } })));
ok(dk(rd("caleb")) === "Lowercase,Numbers,Shapes,Colors" && dk(rd("julian", { nbLevel: { nbLowercase: true } })) === "Lowercase,Numbers,Shapes,Colors,Animals",
  "little letters on (the construction notebook's default; switched on for the dinosaur one) → the Lowercase deck stands in for Letters");
ok(rd("kid9", { notebookTheme: "shark" }).readsCap && dk(rd("kid9", { notebookTheme: "shark" })) === "Letters,Numbers,Shapes,Colors,Animals", "a kid with no notebook of their own wearing a Pre-K look gets the Pre-K decks");
ok(rd("lucy").readsCap && dk(rd("lucy")) === "Sight Words,Spelling" && rd("lucy").decks[0].cap && !rd("lucy").decks[1].cap,
  "Lucy's notebook: Sight Words (word of the day, review slots) + Spelling (My Words practice box, not slotted)");
ok(!rd("lucy", { extraPages: { myWords: { on: false } } }).readsCap && rd("lucy", { extraPages: { myWords: { on: false } } }).decks.length === 0, "…My Words turned off → nothing reaches paper");
ok(!rd("ellis").readsCap && !rd("lincoln").readsCap && !rd("kid9").readsCap && rd("ellis").decks.length === 0 && rd("kid9").decks.length === 0,
  "Ellis's, Lincoln's and the starter notebook read no drill trouble today");
// the Pre-K deck list is the notebook's own: a 🔁 flag in each listed deck reaches the week's picks
const pkItems = ["Letters", "Numbers", "Shapes", "Colors", "Animals"].map((s, i) => C("p" + i, s, ["M", "9", "Hexagon", "Blue", "Fox"][i], { recentMiss: 1 }));
const pkCur = I.juCurriculumFromMastery(pkItems);
ok(["letters", "numbers", "shapes", "colors", "animals"].every(s => Object.keys(pkCur.flag[s]).length === 1), "juCurriculumFromMastery flags in exactly those five decks");

console.log("(e) the card");
const strip = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ju = appCtx({ kid: "julian" }), juH = ju.nbNeedsCardHtml("julian"), juT = strip(juH);
ok(/🔁 Giving trouble this week/.test(juT) && /MOM/.test(juT), "Pre-K kid: the card, Mom-badged");
ok(/\b10 cards giving trouble\b/.test(juT), "the total (10)", juT.slice(0, 200));
ok(/7 can reach paper/.test(juT), "7 of them can reach paper (Letters 2, Shapes 2, Numbers 2, Animals 1 — not German, not Dinosaurs)", (juT.match(/\d+ can reach paper/) || [""])[0]);
ok(/Shapes 2 cards 📄 Can reach paper — comes back 🔁 on a daily page/.test(juT), "per deck: Shapes, 2 cards, reaches paper");
ok(/Dinosaurs 1 card Not in Robin’s notebook yet/.test(juT) && /German 2 cards Not in Robin’s notebook yet/.test(juT), "per deck: Dinosaurs / German are not in this notebook yet (roster name, no he/his)");
ok(/Square · ?missed lately ×1 · slipped ×2|Square missed lately ×1 · slipped ×2/.test(juT), "plain counts: “missed lately ×1 · slipped ×2”", (juT.match(/Square.{0,40}/) || [""])[0]);
ok(/7 · parked/.test(juT) && /slipped ×1/.test(juT), "a parked card says so");
ok(juT.indexOf("Shapes") < juT.indexOf("Letters") && juT.indexOf("Letters") < juT.indexOf("Dinosaurs"), "decks worst first (Shapes 13 > Letters 9 > Dinosaurs 6)");
ok(/🔁 Review slots: 2 per deck each week Change/.test(juT) && /getElementById\(\\?'nbrev-card\\?'\)/.test(juH) && !/nbSetReviewCap/.test(juH), "the review-slots number, read-only, with a jump to the stepper (no second control)");
ok(!/<details/.test(juH), "10 cards in 6 decks, ≤3 a deck → no fold needed");
// a school-age kid with nothing in trouble
const el = appCtx({ kid: "ellis", history: { ellis: { "2026-11-10": day({ a: "c" }) } }, items: [C("a", "Science", "atom"), C("b", "Science", "cell", { drop_count: 2, tier: "monthly" })] });
const elT = strip(el.nbNeedsCardHtml("ellis"));
ok(/🌟 Nothing is giving Robin trouble right now/.test(elT) && !/Review slots/.test(elT) && !/can reach paper/.test(elT), "school-age kid, nothing in trouble: the friendly line, no review slots (the notebook doesn't read them)");
// one with many
const many = [];
for (let d = 0; d < 9; d++) for (let k = 0; k <= d; k++) many.push(C("m" + d + "_" + k, "Deck " + d, "word " + d + "-" + k + (k === 0 && d === 8 ? " — a very long card front that goes on and on past sixty characters" : ""), { drop_count: 1 + (k % 3) }));
const li = appCtx({ kid: "lincoln", items: many, history: { lincoln: {} } }), liH = li.nbNeedsCardHtml("lincoln"), liT = strip(liH);
const nShown = (liH.split("<details")[0].match(/slipped ×/g) || []).length, nAll = (liH.match(/slipped ×/g) || []).length;
ok(/45 cards giving trouble/.test(liT) && /Show all 45/.test(liT), "many (45 cards in 9 decks): the total and a “Show all 45” fold");
ok(nShown === 6 * 3 && nAll === 45, "6 decks × 3 cards show; the fold holds the other 27 — every card listed exactly once", nShown + " shown, " + nAll + " in all");
ok(/Deck 8 9 cards/.test(liT) && liT.indexOf("Deck 8") < liT.indexOf("Deck 7"), "the worst deck first");
ok(/word 8-0 — a very long card front that goes on and on pas…/.test(liT) && !/sixty characters/.test(liT), "a long card front is cut to fit (57 characters + …)");
ok(/Not in Robin’s notebook yet/.test(liT) && /0 can reach paper/.test(liT), "a notebook that reads no trouble says so per deck (0 can reach paper)");
ok(appCtx({ kid: "julian", mom: false }).nbNeedsCardHtml("julian") === "", "not Mom → no card");
const nl = strip(appCtx({ kid: "julian", noLib: true }).nbNeedsCardHtml("julian"));
ok(/10 cards giving trouble/.test(nl) && !/can reach paper|Not in|Review slots/i.test(nl), "before notebooks.js loads: the list still shows, the paper lines wait for it");
const lu = appCtx({ kid: "lucy", items: [C("s1", "Sight Words", "said", { drop_count: 1 }), C("s2", "Spelling", "cat", { drop_count: 1 }), C("v", "Vocabulary", "loyal", { drop_count: 1 })], history: {} });
const luT = strip(lu.nbNeedsCardHtml("lucy"));
ok(/2 can reach paper/.test(luT) && /Sight Words 1 card 📄 Can reach paper — comes back 🔁 as the sight word of the day/.test(luT) && /Spelling 1 card 📄 Can reach paper — goes in the practice box/.test(luT) && /Vocabulary 1 card Not in/.test(luT),
  "Lucy's notebook: Sight Words and Spelling reach paper, Vocabulary doesn't", luT);
const luOff = strip(appCtx({ kid: "lucy", items: [C("s1", "Sight Words", "said", { drop_count: 1 })], history: {}, settings: { lucy: { extraPages: { myWords: { on: false } } } } }).nbNeedsCardHtml("lucy"));
ok(/My Words is off — not on paper this week/.test(luOff) && !/Review slots/.test(luOff), "My Words off → “My Words is off — not on paper this week”, no review slots");
const cap3 = strip(appCtx({ kid: "julian", settings: { julian: { reviewCap: 4 } } }).nbNeedsCardHtml("julian"));
ok(/Review slots: 4 per deck each week/.test(cap3), "the slots number follows notebookSettings/<kid>/reviewCap");
const esc1 = appCtx({ kid: "julian", items: [C("x", "Letters", "<b>&", { drop_count: 1 })], history: {} }).nbNeedsCardHtml("julian");
ok(esc1.indexOf("&lt;b>&amp;") >= 0 && esc1.indexOf("<b>&") < 0, "card text is escaped");

console.log("(f) read-only; the stepper's one home");
[ju, el, li, lu].forEach(g => ok(g._writes.length === 0, "rendering wrote nothing (" + Object.keys(g.masteryFromApp())[0] + ")"));
ok(!/\.set\(|\.update\(|\.remove\(|setItem|db\.ref|db&&|\bdb\b/.test(BLOCK.replace(/\/\/[^\n]*/g, "")), "the block has no write call at all");
ok(!/\b(julian|lucy|ellis|lincoln|caleb)\b/i.test(BLOCK.replace(/\/\/[^\n]*/g, "")) && !/\b(he|his|him)\b/.test(strip(BLOCK.replace(/\/\/[^\n]*/g, "").replace(/'\+[^']*\+'/g, " "))), "no kid names or he/his in the block's code or text");
const NBSHOW = slice(NBSRC, "// NBNEEDS_START", "// NBNEEDS_END");
ok(!/\b(he|his|him|she|her)\b/.test(NBSHOW.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")), "notebooks.js block: the text shown has no he/his/she/her");
ok(html.indexOf("🔀") < 0, "no 🔀 in index.html");
const REV = slice(html, "  let reviewHtml=\"\";", "    '</div>';\n  }");
ok(/if\(nbNeedsReadsCap\(sel\) && momHere\(\)\)\{/.test(REV) && /const cap=nbReviewCap\(sel\)/.test(REV) && /nbSetReviewCap\(\\''\+sel\+'\\',/.test(REV), "the stepper shows for any kid whose notebook reads reviewCap, and steps that kid's own value");
ok(!/sel==="julian" && momHere\(\)\)\{\n\s*const cap=nbReviewCap\("julian"\)/.test(html) && !/Julian missed in drills/.test(REV), "…no longer Julian only, no kid name in its text");
ok((html.match(/id="nbrev-card"/g) || []).length === 1 && (html.match(/onclick="nbSetReviewCap\(/g) || []).length === 1, "one stepper in the app (one id, one onclick builder)");
ok(/esc\(revNm\)/.test(REV) && /const revNm=cap\(sel\);/.test(html), "the stepper's text names the kid from the roster before cap is shadowed by the slot count");
ok((html.match(/\?nbNeedsCardHtml\((sel|kid)\)/g) || []).length === 1 && html.indexOf('struggles:((typeof nbNeedsCardHtml==="function")?nbNeedsCardHtml(kid):"")+(p.review||""),') > 0,
  "the card sits once, in the Customize card's 🔁 Struggles dial, right above the review stepper (NB_CUSTOM)");
// readsCap follows the notebook, never a kid id
ok(appCtx({ kid: "julian" }).nbNeedsReadsCap("julian") && appCtx({ kid: "lucy" }).nbNeedsReadsCap("lucy") && appCtx({ kid: "caleb" }).nbNeedsReadsCap("caleb") &&
   appCtx({ kid: "kid9", settings: { kid9: { notebookTheme: "shark" } } }).nbNeedsReadsCap("kid9"), "stepper shows: the dinosaur, construction and shark Pre-K notebooks, Lucy's");
ok(!appCtx({ kid: "ellis" }).nbNeedsReadsCap("ellis") && !appCtx({ kid: "lincoln" }).nbNeedsReadsCap("lincoln") && !appCtx({ kid: "kid9" }).nbNeedsReadsCap("kid9") &&
   !appCtx({ kid: "lucy", settings: { lucy: { extraPages: { myWords: { on: false } } } } }).nbNeedsReadsCap("lucy") && !appCtx({ kid: "julian", noLib: true }).nbNeedsReadsCap("julian"),
  "stepper hidden: Ellis's, Lincoln's, the starter notebook, Lucy's with My Words off, and until notebooks.js loads");

console.log("(g) every notebook prints byte-for-byte the same with and without the block");
const NBSRC0 = NBSRC.replace(NBSHOW + "\n", "").replace("    reviewDecks: nbReviewDecks,         // 🔁 NBNEEDS: which drill decks this kid's notebook brings back to paper (Notebook tab card)\n", "");
ok(NBSRC0.length < NBSRC.length && NBSRC0.indexOf("NBNEEDS_START") < 0 && NBSRC0.indexOf("nbReviewDecks") < 0, "baseline = this tree's notebooks.js with the NBNEEDS block and its export removed");
const NB0 = loadNb(NBSRC0);
ok(NB0 && typeof NB0.generate === "function" && NB0.reviewDecks === undefined, "baseline loads (no reviewDecks)");
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const T5 = ["📖 Morning Notebook — Morning Notebook", "📄 Dimensions Math 1A — Ch6-1", "📱 Mathseeds Lesson — Lesson 72", "🃏 Daily Drill", "📖 Closing Notebook — Closing Notebook"];
const allItems = fromCtx.filter(Boolean).concat([C("sw1", "Sight Words", "said", { drop_count: 2, recentMiss: 1 }), C("sw2", "Sight Words", "play"), C("sp1", "Spelling", "cat", { status: "introduction" })]);
const ctxFor = (kid, extra) => Object.assign({ weekNum: "week12", weekDates: "Nov 16–20, 2026", weekData: { dates, tasks: Object.keys(dates).flatMap(d => T5.map(t => ({ who: kid, day: d, title: t, time: "8:00 AM" }))) }, extraPages: {}, masteryItems: clone(allItems), reviewCap: 3 }, extra || {});
const cases = [["julian"], ["lucy"], ["ellis"], ["lincoln"], ["caleb"], ["kid9"], ["kid9", { notebookTheme: "shark", kidName: "Finn" }], ["lucy", { reviewCap: 0 }], ["julian", { masteryItems: [] }]];
cases.forEach(([kid, ex]) => {
  const a = JSON.stringify(NB.generate(kid, ctxFor(kid, ex))), b = JSON.stringify(NB0.generate(kid, ctxFor(kid, ex)));
  ok(a === b && a.length > 1000, kid + (ex ? " " + JSON.stringify(ex).slice(0, 40) : "") + ": byte-identical (" + a.length + " chars)");
});
ok(JSON.stringify(NB.planFor("caleb", ctxFor("caleb"))) === JSON.stringify(NB0.planFor("caleb", ctxFor("caleb"))) &&
   JSON.stringify(NB.juPlanPreview(ctxFor("julian"))) === JSON.stringify(NB0.juPlanPreview(ctxFor("julian"))), "the Pre-K planners answer the same");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
