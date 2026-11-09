/*
 * PATTILES (her research plan 2026-10-23, new step #4): "🔤 Build it" with letter tiles — a learning-pattern step.
 * He hears the card's word and taps its letters in order (SPELLBUILD's own tiles, board and check). Right on the
 * first try → good; wrong → the tiles come back, one more try; right on the second try or wrong twice → again
 * (the card comes back later in the sitting). The word is never written on screen.
 *   1 · "tiles" is a pattern step: MST_PATTERN_MODES, mstPatternClean, mstPatternMode, the editor label
 *   2 · the face: one slot per letter, the word's letters + 3 extras from the deck's other words, the word never shown
 *   3 · grading through the real mstTap: first try → good, second try → again, two misses → again, ← Back cancels
 *   4 · entry rule: sound off / two words / a fact / a rule card → the card's usual face (✗ / ✓ kept)
 *   5 · the clue: a non-spelling card may show its meaning, never one containing the word; a spelling word never
 *   6 · byte-identical: every card whose slot isn't "tiles" draws exactly as without the block
 *   7 · it says the word on show (autoplay), the side-change rule still applies
 *   8 · wiring: the hook lines, writes nothing, no 🔀
 * Runs the REAL code sliced from index.html.   run:  node test_pattern_tiles.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function sliceFrom(s, name) { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (!d) return s.slice(i, k + 1); } } }
const slice = name => sliceFrom(src, name);
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error("missing " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

ok("PATTILES block present", src.indexOf("// PATTILES_START") > 0 && src.indexOf("// PATTILES_END") > src.indexOf("// PATTILES_START"));

// A study harness: the sitting engine, the card face, nav/tap, SPELLBUILD (the shared tiles) and PATTILES, all real.
// opts.catMode: the deck mode mastGetCatMode returns · opts.noTiles: leave the PATTILES block out (for the byte check)
function harness(items, defs, opts) {
  opts = opts || {};
  const timers = [], said = [], tones = [];
  const SES = Object.assign({ sid: "s1", name: "Study", passes: 3 }, opts.session || {});
  const ctx = { console, Math, Object, Array, String, Number, JSON, Set, Date, parseFloat, isNaN,
    masteryKid: "kid", masteryData: { kid: items },
    MAST_TIER_ORDER: ["daily", "every_other_day", "weekly", "bi_weekly", "monthly", "graduated"], MAST_TIER_INT: { daily: 1, every_other_day: 2, weekly: 5, bi_weekly: 10, monthly: 20, graduated: null },
    mastDrillSettings: () => ({ ladder: [] }), mastIsDue: () => false, mastIsParked: () => false, mastIsNeverDrill: () => false, mastFullBank: () => ({}),
    mastGetDef: (k, n) => defs[n] || "", mastCustomDef: () => "", mastGetDefAudio: (k, n) => (opts.rec && opts.rec[n]) || null,
    mastGetCatMode: () => opts.catMode || "", mastCatFace: () => "",
    mastGetVisual: () => null, MAST_ANIMAL_EMOJI: {}, MAST_COLOR_MAP: {}, mastColorBorder: () => "#000", mastShapeVis: () => "",
    ttsFlipAttrs: () => "", mstSessions: () => [SES], mstPersist: () => {},
    mastSpeak: (t, o) => said.push({ t, spell: !!(o && o.spell) }), mastPlayDefAudio: n => said.push({ t: n, rec: true }),
    matchDing: () => tones.push("ding"), matchBonk: () => tones.push("bonk"),
    renders: 0, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; } };
  ctx._mastRe = () => { ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext([
    block("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──"),
    "let mstState=null, mstFlipped=false, mstTyped='', mstChecked=null, mstSid='s1';",
    ["mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef", "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstAudioBtn", "mstFlipBtn",
      "_mastVisNorm", "mastLiveVisual", "mastLiveImg", "mstCardPic", "mstPicCardHtml", "mstCardHtml", "mstTypeAnsOn", "_smTileVis", "_matchPlain", "_matchLures",
      "mstTap", "mstAutoPlayCurrent"].map(slice).join("\n"),
    "const WW_DECKS=" + JSON.stringify(["AAS Words", "Spelling", "SpellingYouSee"]) + ";",
    block("// MST_NAV_START", "// MST_NAV_END"),
    block("// SPELLBUILD_START", "// SPELLBUILD_END"),
    block("// PATPICK_START", "// PATPICK_END"),
    opts.noTiles ? "" : block("// PATTILES_START", "// PATTILES_END"),
  ].join("\n"), ctx);
  const R = c => vm.runInContext(c, ctx);
  R("mstNow=function(){ return 1e12; }; mstLockTs=0;");   // the 350 ms tap lock never bites in a test
  ctx.__SES = SES; R("mstSessions=function(){ return [__SES]; };");   // the engine's own mstSessions reads the bank; this sitting's session is SES
  return { ctx, R, timers, said, tones, SES, flush() { while (timers.length) timers.shift().f(); } };
}
const sit = (learning, pattern, need) => "mstState=mstSittingInit(" + JSON.stringify({ reviews: [], learning, newNames: [] }) + "," + JSON.stringify({ pattern, passes: 3 }) + ",{dotsNeeded:()=>" + (need || pattern.length) + "})";
const CUR = "mstCurrent(mstState)", FACE = "mstCardHtml(mstSessions()[0],mstCurrent(mstState))";
// tap the tiles that spell `word`, in order (each letter from an unused tile)
const build = (R, word) => R("(function(){ var t=mstTilesCur(" + CUR + ").t; " + JSON.stringify(word) + ".split('').forEach(function(ch){ var i=t.tiles.findIndex(function(x){return !x.used&&x.ch===ch;}); mstTilesTapTile(i); }); return t.placed.length; })()");

const SPELL = [
  { id: "w1", subject: "AAS Words", prompt: "frog", status: "introduction", tally_dots: 0 },
  { id: "w2", subject: "AAS Words", prompt: "plum", status: "introduction", tally_dots: 0 },
  { id: "w3", subject: "AAS Words", prompt: "crab", status: "active" },
  { id: "w4", subject: "AAS Words", prompt: "milk", status: "active" },
  { id: "x1", subject: "Science", prompt: "zygote", status: "active" },
];

// ── 1 · a pattern step ─────────────────────────────────────────────────────────────
console.log("── 1 · \"tiles\" is a pattern step ──");
{
  const { R } = harness([], {});
  ok("MST_PATTERN_MODES carries tiles, once", R("MST_PATTERN_MODES.filter(m=>m==='tiles').length") === 1);
  ok("…after the existing steps", R("MST_PATTERN_MODES.slice(0,3).join()") === "rec,say,type" && R("MST_PATTERN_MODES.indexOf('tiles')") > 2);
  ok("mstPatternClean keeps tiles", R("JSON.stringify(mstPatternClean(['tiles','rec','type']))") === '["tiles","rec","type"]');
  ok("mstPatternMode returns tiles on its day", R("mstPatternMode(['tiles','say','type'],0,3)") === "tiles");
  ok("the editor labels it 🔤 Build it", src.indexOf('_pl.tiles = "\\u{1F524} Build it";   // 🔤 PATTILES') > 0);
  ok("mhqPatCycle still cycles through MST_PATTERN_MODES (so tiles is reachable)", /function mhqPatCycle\(i\)[^\n]*MST_PATTERN_MODES\.indexOf\(p\[i\]\) \+ 1\) % MST_PATTERN_MODES\.length/.test(src));
}

// ── 2 · the face ────────────────────────────────────────────────────────────────────
console.log("── 2 · the board: slots, tiles, the word never shown ──");
{
  const { R } = harness(SPELL, {}, { catMode: "spell" });
  R(sit([SPELL[0]], ["tiles", "say", "type"]));
  ok("the day-1 card's step is tiles", R(CUR + ".mode") === "tiles");
  ok("mstTilesOn: the tiles face is drawn", R("mstTilesOn(mstSessions()[0]," + CUR + ")") === true);
  const html = R(FACE);
  ok("the chip reads 🔤 Build it", html.indexOf("\u{1F524} Build it") > 0);
  ok("one empty slot per letter", (html.match(/<span class="spell-slot"><\/span>/g) || []).length === 4);
  const tiles = (html.match(/aria-label="Letter (.)"/g) || []).map(s => s.slice(-2, -1));
  ok("the word's 4 letters + 3 extras", tiles.length === 7, tiles);
  ok("…every letter of the word is a tile", "frog".split("").every(ch => tiles.indexOf(ch) !== -1), tiles);
  const extras = tiles.filter(ch => "frog".indexOf(ch) === -1);
  ok("…the 3 extras are not in the word and come from the deck's other words", extras.length === 3 && extras.every(ch => "plumcrabmilk".indexOf(ch) !== -1), extras);
  ok("…never from another deck's words", extras.every(ch => "zyte".indexOf(ch) === -1), extras);
  ok("the word is never written on screen", html.indexOf("frog") === -1);
  ok("the big 🔊 hears it again", html.indexOf('onclick="mstTilesSayAgain()"') > 0);
  ok("no flip on the tiles face", html.indexOf("mstFlip()") === -1);
  ok("Check is off until every slot is filled", /onclick="mstTilesCheck\(\)" disabled/.test(html));
  ok("tiles stay put on a re-render", R(FACE) === html);
  build(R, "fr");
  const half = R(FACE);
  ok("a tapped tile moves into the row", (half.match(/class="spell-tile spell-placed"/g) || []).length === 2 && (half.match(/<span class="spell-slot"><\/span>/g) || []).length === 2);
  R("mstTilesTapPlaced(0)");
  ok("a placed tile taps back off", R("mstTilesCur(" + CUR + ").t.placed.length") === 1 && R("mstTilesCur(" + CUR + ").t.tiles.filter(x=>x.used).length") === 1);
  R("mstTilesClear()");
  ok("Clear puts every tile back", R("mstTilesCur(" + CUR + ").t.placed.length") === 0);
  R("(function(){ var t=mstTilesCur(" + CUR + ").t; for(var i=0;i<t.tiles.length;i++) mstTilesTapTile(i); })()");
  ok("no more tiles than slots can be placed", R("mstTilesCur(" + CUR + ").t.placed.length") === 4);
}

// ── 3 · grading ────────────────────────────────────────────────────────────────────
console.log("── 3 · first try → good · second try → again · two misses → again ──");
{
  const h = harness(SPELL, {}, { catMode: "spell" }), R = h.R;
  R(sit([SPELL[0], SPELL[1]], ["tiles", "say", "type"]));
  ok("starts on frog", R(CUR + ".key") === "l:w1");
  build(R, "frog"); R("mstTilesCheck()");
  const right = R(FACE);
  ok("right first try: the row turns green, You built it!", right.indexOf('class="spell-row spell-row-right"') > 0 && right.indexOf("You built it!") > 0 && h.tones.join() === "ding");
  ok("…the tiles lock until the grade lands, no grade yet", (right.match(/ disabled/g) || []).length >= 7 && R("mstState.cards['l:w1'].goods") === 0 && h.timers.length === 1);
  ok("…the built word in the row is his own taps (shown only after he built it)", right.indexOf("frog") === -1);
  R("mstTilesCheck()"); R("mstTilesTapPlaced(0)");
  ok("…a second Check or a tap during the beat does nothing", h.timers.length === 1 && R("mstTilesSt.t.placed.length") === 4);
  h.flush();
  ok("right first try → graded good", R("mstState.cards['l:w1'].goods") === 1 && R("mstState.cards['l:w1'].first") === "good");
  ok("…and the next card shows", R(CUR + ".key") === "l:w2");
  // plum: wrong, then right
  h.said.length = 0;
  build(R, "plmu"); R("mstTilesCheck()");
  const again = R(FACE);
  ok("wrong: the bonk, the tiles come back, Almost — listen and try again", h.tones.slice(-1)[0] === "bonk" && again.indexOf("try again") > 0 && R("mstTilesSt.t.placed.length") === 0 && R("mstTilesSt.t.tiles.every(x=>!x.used)"));
  ok("…he hears the word again", h.said.length === 1 && h.said[0].t === "plum" && h.said[0].spell);
  ok("…no grade, no beat, and the word still isn't shown", h.timers.length === 0 && R("mstState.cards['l:w2'].first") === null && again.indexOf("plum") === -1);
  build(R, "plum"); R("mstTilesCheck()");
  ok("right on the second try: You built it + you'll see it again soon", R(FACE).indexOf("You built it!") > 0 && R(FACE).indexOf("see it again soon") > 0);
  h.flush();
  ok("…graded again (it wasn't right the first time)", R("mstState.cards['l:w2'].first") === "again" && R("mstState.cards['l:w2'].goods") === 0);
  ok("…and re-queued in this sitting", R("mstState.cards['l:w2'].done") === false && R("mstState.queue.indexOf('l:w2')") !== -1);
  // frog again: two misses
  ok("the next showing is frog with a fresh board", R(CUR + ".key") === "l:w1" && R("mstTilesCur(" + CUR + ").t.placed.length") === 0 && R(FACE).indexOf('class="spell-row spell-row-right"') === -1);
  build(R, "fgor"); R("mstTilesCheck()"); build(R, "forg"); R("mstTilesCheck()");
  const failed = R(FACE);
  ok("wrong twice: We'll try that one again later, the word not shown", failed.indexOf("try that one again later") > 0 && failed.indexOf("frog") === -1);
  ok("…with the longer beat", h.timers.length === 1 && h.timers[0].ms > 1000);
  h.flush();
  ok("…graded again (its count of right answers starts over, as ✗ does)", R("mstState.cards['l:w1'].misses") === 1 && R("mstState.cards['l:w1'].goods") === 0 && R("mstState.cards['l:w1'].done") === false && R("mstState.queue.indexOf('l:w1')") !== -1);
  // ← Back during the beat
  const w = R(CUR + ".name");
  build(R, w); R("mstTilesCheck()");
  ok("(a beat is waiting)", h.timers.length === 1);
  R("mstBack()");
  const restored = R("JSON.stringify(mstState.cards)") + R("JSON.stringify(mstState.queue)");
  h.flush();
  ok("← Back during the beat: the grade never lands on the restored sitting", R("JSON.stringify(mstState.cards)") + R("JSON.stringify(mstState.queue)") === restored);
  ok("…and the board on screen isn't stuck on its old build", R("mstTilesCur(" + CUR + ").lock") === false);
}

// ── 4 · entry rule ─────────────────────────────────────────────────────────────────
console.log("── 4 · only a one-word card he can hear builds; others keep their face ──");
{
  const off = harness(SPELL, {}, { catMode: "spell", session: { audio: "off" } });
  off.R(sit([SPELL[0]], ["tiles"]));
  const offHtml = off.R(FACE);
  ok("sound off → no tiles (he couldn't hear the word)", off.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === false);
  ok("…the spell deck's own flip is drawn", offHtml.indexOf("spell it out loud") > 0 && offHtml.indexOf("spell-tile") === -1);
  const G = [{ id: "g1", subject: "German", prompt: "der Hund", status: "introduction", tally_dots: 0 }, { id: "g2", subject: "German", prompt: "Katze", status: "active" }];
  const two = harness(G, { "der Hund": "the dog", Katze: "the cat" });
  two.R(sit([G[0]], ["tiles"]));
  ok("two words (der Hund) → no tiles", two.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === false);
  ok("…the plain flip is drawn, ✗ / ✓ kept", two.R(FACE).indexOf("mstFlip()") > 0 && two.R(FACE).indexOf("spell-tile") === -1);
  const F = [{ id: "m1", subject: "Math Facts", prompt: "7×8", answer: "56", status: "introduction", tally_dots: 0 }];
  const fact = harness(F, { "7×8": "56" });
  fact.R(sit([F[0]], ["tiles"]));
  ok("a math fact (7×8) → no tiles", fact.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === false);
  const C = [{ id: "c1", subject: "Capitalization", prompt: "Monday", status: "introduction", tally_dots: 0 }];
  const rule = harness(C, { Monday: "days of the week" });
  rule.R(sit([C[0]], ["tiles"]));
  ok("a rule card → no tiles", rule.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === false);
  const L = [{ id: "a1", subject: "Letters", prompt: "b", status: "introduction", tally_dots: 0 }];
  const one = harness(L, { b: "bee" });
  one.R(sit([L[0]], ["tiles"]));
  ok("a one-letter card → no tiles (nothing to build)", one.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === false);
  const U = [{ id: "u1", subject: "German", prompt: "Brötchen", status: "introduction", tally_dots: 0 }];
  const um = harness(U, { "Brötchen": "bread roll" });
  um.R(sit([U[0]], ["tiles"]));
  ok("a German word with an umlaut builds", um.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === true && um.R("mstTilesCur(" + CUR + ").t.tiles.some(x=>x.ch==='ö')"));
  build(um.R, "Brötchen"); um.R("mstTilesCheck()"); um.flush();
  ok("…its capital and umlaut tiles check right", um.R("mstState.cards['l:u1'].first") === "good");
}

// ── 5 · the clue ───────────────────────────────────────────────────────────────────
console.log("── 5 · the clue ──");
{
  const G = [{ id: "g1", subject: "German", prompt: "Hund", status: "introduction", tally_dots: 0 }, { id: "g2", subject: "German", prompt: "Katze", status: "active" }];
  const g = harness(G, { Hund: "the dog", Katze: "the cat" });
  g.R(sit([G[0]], ["tiles"]));
  ok("a non-spelling card shows its meaning as the clue", g.R(FACE).indexOf(">the dog<") > 0);
  const G2 = [{ id: "g1", subject: "German", prompt: "Hund", status: "introduction", tally_dots: 0 }];
  const g2 = harness(G2, { Hund: "der Hund — the dog" });
  g2.R(sit([G2[0]], ["tiles"]));
  ok("…never a meaning that contains the word", g2.R(FACE).indexOf("Hund") === -1);
  const S = [{ id: "w1", subject: "AAS Words", prompt: "frog", status: "introduction", tally_dots: 0 }];
  const s = harness(S, { frog: "A green animal that hops." });
  s.R(sit([S[0]], ["tiles"]));
  ok("a Word Workout spelling word never shows a clue (even with the deck in flip mode)", s.R("mstTilesOn(mstSessions()[0]," + CUR + ")") === true && s.R(FACE).indexOf("green animal") === -1);
}

// ── 6 · byte-identical ─────────────────────────────────────────────────────────────
console.log("── 6 · every other card draws exactly as before ──");
{
  const MIX = [
    { id: "w1", subject: "AAS Words", prompt: "frog", status: "introduction", tally_dots: 0 },
    { id: "g1", subject: "German", prompt: "Hund", status: "introduction", tally_dots: 0 },
    { id: "g2", subject: "German", prompt: "Katze", status: "active" }, { id: "g3", subject: "German", prompt: "Haus", status: "active" },
  ];
  const D = { Hund: "the dog", Katze: "the cat", Haus: "the house", frog: "frog" };
  ["rec", "say", "type", "pick"].forEach(mode => {
    ["spell", ""].forEach(cm => {
      const a = harness(MIX, D, { catMode: cm }), b = harness(MIX, D, { catMode: cm, noTiles: true });
      const learning = [MIX[0], MIX[1]];
      a.R("Math.random=function(){return 0.3;}"); b.R("Math.random=function(){return 0.3;}");
      a.R(sit(learning, [mode])); b.R(sit(learning, [mode]));
      let same = true;
      for (let n = 0; n < 2; n++) { const fa = a.R(FACE), fb = b.R(FACE); if (fa !== fb) same = false; a.R("mstTap('good')"); b.R("mstTap('good')"); }
      ok("a " + mode + " day (" + (cm || "flip") + " decks) is byte-identical with or without PATTILES", same);
    });
  });
  const a = harness(MIX, D, { catMode: "spell" }), b = harness(MIX, D, { catMode: "spell", noTiles: true });
  a.R(sit([MIX[1]], ["rec"])); b.R(sit([MIX[1]], ["rec"]));
  a.R("mstAutoPlayCurrent(mstSessions()[0])"); b.R("mstAutoPlayCurrent(mstSessions()[0])");
  ok("autoplay on a non-tiles card is unchanged", JSON.stringify(a.said) === JSON.stringify(b.said) && a.said.length === 1);
}

// ── 7 · autoplay + side change ─────────────────────────────────────────────────────
console.log("── 7 · it says the word on show; the side-change rule applies ──");
{
  const G = [{ id: "g1", subject: "German", prompt: "Hund", status: "introduction", tally_dots: 0 }];
  const g = harness(G, { Hund: "the dog" });
  g.R(sit([G[0]], ["tiles"])); g.R("mstAutoPlayCurrent(mstSessions()[0])");
  ok("a non-spelling tiles card says its word on show, slowly", g.said.length === 1 && g.said[0].t === "Hund" && g.said[0].spell);
  const gr = harness(G, { Hund: "the dog" }, { rec: { Hund: "rec.m4a" } });
  gr.R(sit([G[0]], ["tiles"])); gr.R("mstAutoPlayCurrent(mstSessions()[0])");
  ok("…Mom's recording of the word plays when it has one", gr.said.length === 1 && gr.said[0].rec);
  const s = harness(SPELL, {}, { catMode: "spell" });
  s.R(sit([SPELL[0]], ["tiles"])); s.R("mstAutoPlayCurrent(mstSessions()[0])");
  ok("a spell-deck card says its word once, in the spelling voice", s.said.length === 1 && s.said[0].t === "frog" && s.said[0].spell);
  const { R } = harness([], {});
  ok("tiles after rec is a new side (full right answers)", R("mstPatternRepeatDay(['rec','tiles','tiles'],1,3)") === false);
  ok("tiles after tiles is a repeat day (1 right)", R("mstPatternRepeatDay(['rec','tiles','tiles'],2,3)") === true);
}

// ── 8 · wiring ─────────────────────────────────────────────────────────────────────
console.log("── 8 · wiring ──");
{
  const face = slice("mstCardHtml");
  const hook = face.indexOf('if(typeof mstTilesOn==="function"&&mstTilesOn(session,card)) return mstTilesHtml(session,card,def,_lrn);');
  ok("mstCardHtml dispatches to the tiles face", hook > 0);
  ok("…after the picture and rule faces, just ahead of the spell-deck flip", hook > face.indexOf("mstPicCardHtml(") && hook > face.indexOf("if(mstIsRuleCard(card)){") && /^\s*if\(mstIsSpellCard\(card\)\)\{/.test(face.slice(face.indexOf("\n", hook) + 1)));
  ok("renderMastStudy hides ✗ / ✓ for a tiles card", /\} else if\(typeof mstTilesOn==="function"&&mstTilesOn\(session,card\)\)\{   \/\/ 🔤 PATTILES/.test(slice("renderMastStudy")));
  ok("the step is pushed from the block, not written into the array literal", /const MST_PATTERN_MODES = \["rec", "say", "type"\];/.test(src) && block("// PATTILES_START", "// PATTILES_END").indexOf('MST_PATTERN_MODES.push("tiles")') > 0);
  const B = block("// PATTILES_START", "// PATTILES_END").split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  ok("the block writes nothing (no db, no Word Workout, no storage)", !/\bdb\b|\.set\(|\.update\(|wwNote|_wwWriteCard|HA_LS|localStorage/.test(B));
  ok("it reuses Build it's tiles, board and check", /spellTiles\(/.test(B) && /spellBoardHtml\(/.test(B) && /spellJudge\(/.test(B));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") === -1);
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
