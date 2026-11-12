/*
 * SPELLPRODUCE (her ask 2026-11-12, dictated): "for Lincoln's study sessions, if it is a spelling word, he needs to either
 * have the tiles with some of them, or he needs to type it in … him hearing it is he's just clicking through them".
 * A spell-deck card in a 📚 study sitting can no longer be passed by hearing it and tapping ✓ — he builds it (learning)
 * or types it (past learning). A miss is the sitting's own miss and shows the word after.
 *   1 · which way: learning (new / learning card) → tiles · review → typed · a word the tiles can't build → typed
 *   2 · no way past without producing: no ✗ / ✓, no flip, the word never shown before he answers (real renderMastStudy)
 *   3 · typed: right → good · wrong → the word + Next → again (a miss, back of the line) · empty Check does nothing
 *   4 · tiles: right first try → good · wrong twice → the word + Next → again · right on the second try → again
 *   5 · the typed check: ends, apostrophes, a capital only counts when the word has one
 *   6 · every non-spelling card draws byte-for-byte as without the block
 *   7 · wiring: the hook lines, writes nothing, no kid names, no 🔀
 * Runs the REAL code sliced from index.html, with a made-up family.   run:  node test_study_spell_produce.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function sliceFrom(s, name) { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (!d) return s.slice(i, k + 1); } } }
const slice = name => sliceFrom(src, name);
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error("missing " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

ok("SPELLPRODUCE block present", src.indexOf("// SPELLPRODUCE_START") > 0 && src.indexOf("// SPELLPRODUCE_END") > src.indexOf("// SPELLPRODUCE_START"));

// The study harness: the sitting engine, the card face, renderMastStudy, nav/tap, SPELLBUILD's tiles, PATTILES and
// SPELLPRODUCE, all real. opts.catModes: deck → mode · opts.noBlock: leave SPELLPRODUCE out (the byte check)
function harness(items, defs, opts) {
  opts = opts || {};
  const timers = [], said = [], tones = [];
  const SES = Object.assign({ sid: "s1", name: "Daily Study", passes: 2 }, opts.session || {});
  const modes = opts.catModes || { "AAS Words": "spell", "SpellingYouSee": "spell" };
  let seed = 7; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };   // same tiles both runs (byte check)
  const ctx = { console, Math: M, Object, Array, String, Number, JSON, Set, Date, parseFloat, isNaN,
    masteryKid: "kid", masteryData: { kid: items },
    MAST_TIER_ORDER: ["daily", "every_other_day", "weekly", "bi_weekly", "monthly", "graduated"], MAST_TIER_INT: { daily: 1, every_other_day: 2, weekly: 5, bi_weekly: 10, monthly: 20, graduated: null },
    mastDrillSettings: () => ({ ladder: [] }), mastIsDue: () => false, mastIsParked: () => false, mastIsNeverDrill: () => false, mastFullBank: () => ({}),
    mastGetDef: (k, n) => defs[n] || "", mastCustomDef: () => "", mastGetDefAudio: () => null,
    mastGetCatMode: (k, d) => modes[d] || "", mastCatFace: () => "",
    mastGetVisual: () => null, MAST_ANIMAL_EMOJI: {}, MAST_COLOR_MAP: {}, mastColorBorder: () => "#000", mastShapeVis: () => "",
    ttsFlipAttrs: () => "", mstPersist: () => {},
    mastSpeak: (t, o) => said.push({ t, spell: !!(o && o.spell) }), mastPlayDefAudio: n => said.push({ t: n, rec: true }),
    matchDing: () => tones.push("ding"), matchBonk: () => tones.push("bonk"),
    mastGetPrintNum: () => 100, mstLogGet: () => null, mstHasPersisted: () => false,
    renders: 0, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; } };
  ctx._mastRe = () => { ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext([
    block("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──"),
    "let mstState=null, mstFlipped=false, mstTyped='', mstChecked=null, mstSid='s1', mstKid='kid', mstDone=null, mstStartTs=null, mstSaveErr=null;",
    ["mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef", "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstAudioBtn", "mstFlipBtn",
      "_mastVisNorm", "mastLiveVisual", "mastLiveImg", "mstCardPic", "mstPicCardHtml", "mstCardHtml", "mstTypeAnsOn", "_smTileVis", "_matchPlain", "_matchLures",
      "mstTap", "mstAutoPlayCurrent", "renderMastStudy"].map(slice).join("\n"),
    "const WW_DECKS=" + JSON.stringify(["AAS Words", "Spelling", "SpellingYouSee"]) + ";",
    block("// MST_NAV_START", "// MST_NAV_END"),
    block("// SPELLBUILD_START", "// SPELLBUILD_END"),
    block("// PATPICK_START", "// PATPICK_END"),
    block("// MST_TYPEANS_START", "// MST_TYPEANS_END"),
    block("// PATTILES_START", "// PATTILES_END"),
    opts.noBlock ? "" : block("// SPELLPRODUCE_START", "// SPELLPRODUCE_END"),
  ].join("\n"), ctx);
  const R = c => vm.runInContext(c, ctx);
  R("mstNow=function(){ return 1e12; }; mstLockTs=0;");   // the 350 ms tap lock never bites in a test
  ctx.__SES = SES; R("mstSessions=function(){ return [__SES]; };");
  ctx.__pile = { reviews: [], learning: [], newNames: [] }; R("mstPile=function(){ return __pile; };");
  const sit = (pile, ses) => { ctx.__pile = Object.assign({ reviews: [], learning: [], newNames: [] }, pile);
    R("mstState=mstSittingInit(__pile," + JSON.stringify(Object.assign({}, SES, ses || {})) + ",{dotsNeeded:()=>3}); mstNavReset(); mstTilesSt=null; mstTyped=''; mstChecked=null;"); };
  return { ctx, R, timers, said, tones, SES, sit, flush() { while (timers.length) timers.shift().f(); } };
}
const CUR = "mstCurrent(mstState)", FACE = "mstCardHtml(mstSessions()[0],mstCurrent(mstState))", PAGE = "renderMastStudy()";
const build = (R, word) => R("(function(){ var t=mstTilesCur(" + CUR + ").t; " + JSON.stringify(word) + ".split('').forEach(function(ch){ var i=t.tiles.findIndex(function(x){return !x.used&&x.ch===ch;}); mstTilesTapTile(i); }); return t.placed.length; })()");
const type = (R, txt) => R("mstTyped=" + JSON.stringify(txt) + "; mstSpellTypeCheck();");

// The made-up family's bank: two spell decks, a German deck, a science deck, a rule deck
const BANK = [
  { id: "a1", subject: "AAS Words", prompt: "frog", answer: "frog", status: "introduction", tally_dots: 0, review_mode: "flash" },
  { id: "a2", subject: "AAS Words", prompt: "spend", answer: "spend", status: "active", review_mode: "written", tier: "weekly" },
  { id: "a3", subject: "AAS Words", prompt: "plum", answer: "plum", status: "active", review_mode: "flash", tier: "weekly" },
  { id: "a4", subject: "AAS Words", prompt: "ice cream", answer: "ice cream", status: "introduction", review_mode: "flash" },
  { id: "y1", subject: "SpellingYouSee", prompt: "when", answer: "when", status: "active", review_mode: "flash", tier: "weekly" },
  { id: "g1", subject: "German", prompt: "der Hund", answer: "der Hund", status: "active", review_mode: "flash" },
  { id: "g2", subject: "German", prompt: "die Katze", answer: "die Katze", status: "active", review_mode: "flash", dir: "prod" },
  { id: "s1", subject: "Science", prompt: "atom", answer: "atom", status: "active", review_mode: "flash" },
  { id: "r1", subject: "Spelling Rules", prompt: "Rule 1", answer: "C before e, i or y says /s/", status: "active", review_mode: "recite" },
];
const DEFS = { "der Hund": "the dog", "die Katze": "the cat", atom: "the smallest part of an element" };
const B = id => BANK.find(i => i.id === id);

// ── 1 · which way ─────────────────────────────────────────────────────────────────
console.log("── 1 · learning → tiles · past learning → typed ──");
{
  const h = harness(BANK, DEFS), R = h.R;
  h.sit({ learning: [B("a1")], reviews: [B("a2")], newNames: [{ deck: "AAS Words", name: "crab" }] });
  ok("a learning spelling word builds with tiles", R("mstSpellProduce(mstState.cards['l:a1'])") === "tiles");
  ok("a new spelling word (first day) builds with tiles", R("mstSpellProduce(mstState.cards['n:AAS Words|crab'])") === "tiles");
  ok("a review spelling word (past learning) is typed", R("mstSpellProduce(mstState.cards['r:a2'])") === "type");
  ok("…mstTilesOn agrees (tiles for learning, not for review)", R("mstTilesOn(mstSessions()[0],mstState.cards['l:a1'])") === true && R("mstTilesOn(mstSessions()[0],mstState.cards['r:a2'])") === false);
  ok("…mstSpellTypeOn agrees", R("mstSpellTypeOn(mstState.cards['r:a2'])") === true && R("mstSpellTypeOn(mstState.cards['l:a1'])") === false);
  h.sit({ learning: [B("a4")] });
  ok("a learning word the tiles can't build (two words) is typed", R("mstSpellProduce(" + CUR + ")") === "type");
  h.sit({ learning: [B("a1")] }, { audio: "off" });
  ok("sound off for the session: still tiles (the 🔊 on the board says it)", R("mstSpellProduce(" + CUR + ")") === "tiles" && R("mstTilesOn(mstSessions()[0]," + CUR + ")") === true);
  h.sit({ learning: [B("a1")] }, { pattern: ["rec", "say", "type"] });
  ok("a pattern slot (rec / say / type) doesn't put a spelling word back on the flip", R("mstSpellProduce(" + CUR + ")") === "tiles");
  h.sit({ reviews: [B("y1")] });
  ok("every spell-mode deck (SpellingYouSee too), not one kid's", R("mstSpellProduce(" + CUR + ")") === "type");
  h.sit({ reviews: [B("s1"), B("g1"), B("r1")] });
  ok("a non-spelling card → '' (no gate)", R("mstSpellProduce(mstState.cards['r:s1'])") === "" && R("mstSpellProduce(mstState.cards['r:g1'])") === "" && R("mstSpellProduce(mstState.cards['r:r1'])") === "");
  const h2 = harness(BANK, DEFS, { catModes: { "AAS Words": "flip" } });
  h2.sit({ learning: [B("a1")] });
  ok("a spelling deck Mom set to a flip (word on the front) is not gated", h2.R("mstSpellProduce(" + CUR + ")") === "");
}

// ── 2 · no way past without producing ──────────────────────────────────────────────
console.log("── 2 · no ✗ / ✓, no flip, the word not shown ──");
{
  const h = harness(BANK, DEFS), R = h.R;
  h.sit({ reviews: [B("a2")] });
  let page = R(PAGE);
  ok("typed: the box and Check are on the card", page.indexOf('id="mst-spell-in"') > 0 && page.indexOf('onclick="mstSpellTypeCheck()"') > 0);
  ok("typed: no ✗ / ✓ under the card", page.indexOf('aria-label="Good"') === -1 && page.indexOf('aria-label="Again"') === -1 && page.indexOf("tap the card to flip") === -1);
  ok("typed: no flip, no grade on the face before Check", page.indexOf("mstFlip()") === -1 && page.indexOf("mstTap(") === -1);
  ok("typed: the word is not on screen", page.indexOf("spend") === -1);
  ok("typed: 🔊 Hear it says the word in the spelling voice", page.indexOf('onclick="mstSpellSayAgain()"') > 0 && (R("mstSpellSayAgain()"), h.said.slice(-1)[0].t === "spend" && h.said.slice(-1)[0].spell));
  R("mstFlipped=true");
  page = R(PAGE);
  ok("…even with the flip flag set, still no ✗ / ✓", page.indexOf('aria-label="Good"') === -1);
  h.sit({ learning: [B("a1")] });
  page = R(PAGE);
  ok("tiles: the board is on the card, no ✗ / ✓, no flip", page.indexOf("mstTilesCheck()") > 0 && page.indexOf('aria-label="Good"') === -1 && page.indexOf("mstFlip()") === -1);
  ok("tiles: the word is not on screen", page.indexOf("frog") === -1);
  R("mstFlipped=true");
  ok("…still no ✗ / ✓ with the flip flag set", R(PAGE).indexOf('aria-label="Good"') === -1);
  // before: the same card was the hear-it-and-flip face with ✓
  const old = harness(BANK, DEFS, { noBlock: true });
  old.sit({ reviews: [B("a2")] }); old.R("mstFlipped=true");
  ok("(without the block the same card had ✓ — the hole this closes)", old.R(PAGE).indexOf('aria-label="Good"') > 0);
}

// ── 3 · typed ─────────────────────────────────────────────────────────────────────
console.log("── 3 · typed: right → good · wrong → the word, Next → again ──");
{
  const h = harness(BANK, DEFS), R = h.R;
  h.sit({ reviews: [B("a2"), B("a3")] });
  type(R, "   ");
  ok("an empty Check does nothing", R("mstChecked") === null);
  type(R, "spned");
  let f = R(FACE);
  ok("wrong: ✗ Not quite, what he typed struck through", f.indexOf("Not quite") > 0 && f.indexOf("line-through\">spned") > 0 && h.tones.slice(-1)[0] === "bonk");
  ok("…the right spelling is shown after", f.indexOf("The word is") > 0 && f.indexOf(">spend<") > 0);
  ok("…Next marks it again (no ✓ anywhere)", f.indexOf("mstTap('again')") > 0 && f.indexOf("mstTap('good')") === -1);
  type(R, "spend");
  ok("…a second Check after the answer changes nothing", R("mstChecked.ok") === false);
  R("mstTap('again')");
  ok("the miss counts the sitting's way: first = again, misses 1, back of the line", R("mstState.cards['r:a2'].first") === "again" && R("mstState.cards['r:a2'].misses") === 1 && R("mstState.queue.join()") === "r:a3,r:a2");
  ok("…the box is fresh for the next card", R("mstChecked") === null && R("mstTyped") === "");
  type(R, "Plum");
  f = R(FACE);
  ok("right: ✓ Right!, Next marks it good", f.indexOf("Right!") > 0 && f.indexOf("mstTap('good')") > 0 && h.tones.slice(-1)[0] === "ding");
  R("mstTap('good')");
  ok("…graded good, the review is done", R("mstState.cards['r:a3'].done") === true && R("mstState.cards['r:a3'].first") === "good");
  type(R, "spend"); R("mstTap('good')");
  ok("the missed word comes back and can be passed by typing it right", R("mstState.cards['r:a2'].done") === true && R(CUR) === null);
}

// ── 4 · tiles ─────────────────────────────────────────────────────────────────────
console.log("── 4 · tiles: right → good · wrong twice → the word, Next → again ──");
{
  const h = harness(BANK, DEFS), R = h.R;
  h.sit({ learning: [B("a1")], newNames: [{ deck: "AAS Words", name: "crab" }] });
  build(R, "frog"); R("mstTilesCheck()");
  ok("right first try: the beat, then good (as PATTILES)", h.timers.length === 1 && R("mstTilesSt.reveal") !== true);
  h.flush();
  ok("…graded good", R("mstState.cards['l:a1'].first") === "good" && R("mstState.cards['l:a1'].goods") === 1);
  ok("…on to the new word", R(CUR + ".key") === "n:AAS Words|crab");
  build(R, "carb"); R("mstTilesCheck()");
  ok("first wrong build: try again, the word still hidden", R(FACE).indexOf("try again") > 0 && R(FACE).indexOf("crab") === -1 && h.timers.length === 0);
  build(R, "cbar"); R("mstTilesCheck()");
  const f = R(FACE);
  ok("wrong twice: no auto-advance, the word is shown", h.timers.length === 0 && f.indexOf("The word is") > 0 && f.indexOf(">crab<") > 0);
  ok("…with Next", f.indexOf('onclick="mstSpellTilesNext()"') > 0);
  ok("…not graded until Next", R("mstState.cards['n:AAS Words|crab'].first") === null);
  R("mstSpellTilesNext()");
  ok("Next → again: a miss, back of the line", R("mstState.cards['n:AAS Words|crab'].first") === "again" && R("mstState.cards['n:AAS Words|crab'].misses") === 1 && R("mstState.queue.slice(-1)[0]") === "n:AAS Words|crab");
  ok("…a fresh board next time it shows", R("mstTilesSt") === null || R("mstTilesSt.reveal") !== true);
  // right on the second try: PATTILES' own rule — again, after the beat
  const h2 = harness(BANK, DEFS), R2 = h2.R;
  h2.sit({ learning: [B("a1")] });
  build(R2, "fgor"); R2("mstTilesCheck()"); build(R2, "frog"); R2("mstTilesCheck()");
  h2.flush();
  ok("right on the second try → again (a wrong build is a miss)", R2("mstState.cards['l:a1'].first") === "again");
  // a stray tap: Next during the tap lock is swallowed
  const h3 = harness(BANK, DEFS), R3 = h3.R;
  h3.sit({ learning: [B("a1")] });
  build(R3, "fgor"); R3("mstTilesCheck()"); build(R3, "gorf"); R3("mstTilesCheck()");
  R3("mstLockTs=mstNow()"); R3("mstSpellTilesNext()");
  ok("Next inside the tap lock does nothing", R3("mstState.cards['l:a1'].first") === null);
}

// ── 5 · the typed check ───────────────────────────────────────────────────────────
console.log("── 5 · mstSpellTypedOk ──");
{
  const { R } = harness(BANK, DEFS);
  const T = (t, w) => R("mstSpellTypedOk(" + JSON.stringify(t) + "," + JSON.stringify(w) + ")");
  ok("exact → right", T("spend", "spend") === true);
  ok("spaces at the ends don't count", T("  spend ", "spend") === true);
  ok("a capital first letter on a plain word isn't a miss", T("Spend", "spend") === true);
  ok("a word with a capital needs it", T("monday", "Monday") === false && T("Monday", "Monday") === true);
  ok("curly vs straight apostrophe is the same", T("don't", "don’t") === true);
  ok("a dropped apostrophe IS a miss (spelling, not vocab)", T("dont", "don't") === false);
  ok("a letter off is a miss", T("spned", "spend") === false && T("spen", "spend") === false);
  ok("empty is never right", T("", "spend") === false);
}

// ── 6 · non-spelling cards unchanged ──────────────────────────────────────────────
console.log("── 6 · every non-spelling card draws exactly as before ──");
{
  const cases = [
    ["a science flip card", { reviews: [B("s1")] }, {}],
    ["a German flip card", { reviews: [B("g1")] }, {}],
    ["a German typed twin (Both directions)", { reviews: [B("g2")] }, { bothWays: true }],
    ["a rule card", { reviews: [B("r1")] }, {}],
    ["a science card on a 🔤 tiles pattern day", { learning: [Object.assign({}, B("s1"), { status: "introduction", tally_dots: 0 })] }, { pattern: ["tiles", "rec", "rec"] }],
    ["a science card on a Type-the-answer session", { reviews: [B("s1")] }, { typeAnswer: true }],
  ];
  cases.forEach(([label, pile, ses]) => {
    const a = harness(BANK, DEFS), b = harness(BANK, DEFS, { noBlock: true });
    a.sit(pile, ses); b.sit(pile, ses);
    a.R("__SES2=" + JSON.stringify(Object.assign({}, a.SES, ses)) + "; mstSessions=function(){ return [__SES2]; };");
    b.R("__SES2=" + JSON.stringify(Object.assign({}, b.SES, ses)) + "; mstSessions=function(){ return [__SES2]; };");
    const same = (a.R(PAGE) === b.R(PAGE)) && (a.R("mstFlipped=true"), b.R("mstFlipped=true"), a.R(PAGE) === b.R(PAGE));
    ok(label + ": the page is byte-for-byte the same, face up and down", same);
  });
}

// ── 7 · wiring ────────────────────────────────────────────────────────────────────
console.log("── 7 · wiring ──");
{
  const blk = block("// SPELLPRODUCE_START", "// SPELLPRODUCE_END");
  ok("mstTilesOn asks SPELLPRODUCE first", /function mstTilesOn\(session,card\)\{\n  if\(card&&typeof mstSpellProduce==="function"\)/.test(src));
  const face = slice("mstCardHtml"), th = face.indexOf("mstSpellTypeOn(card)) return mstSpellTypeHtml(session,card,_lrn);");
  ok("mstCardHtml draws the typed face after the picture / rule faces, ahead of the tiles and the hear-it-and-flip face",
    th > face.indexOf("if(mstIsRuleCard(card)){") && th < face.indexOf("mstTilesOn(session,card)) return mstTilesHtml(") && th < face.indexOf("if(mstIsSpellCard(card)){"));
  ok("renderMastStudy hides ✗ / ✓ for a typed spelling word (its own branch)", /if\(typeof mstSpellTypeOn==="function"&&mstSpellTypeOn\(card\)\)\{ \/\* ✍️ SPELLPRODUCE[^\n]*\*\/ \} else\n/.test(slice("renderMastStudy")));
  ok("the block writes nothing (no db, no storage)", !/db\.ref|\.set\(|\.update\(|HA_LS|localStorage/.test(blk));
  ok("no kid or family names in the block", !/lincoln|ellis|lucy|julian|adrienne|andrew|kenzie|taylor|caleb|sara/i.test(blk.replace(/\/\/[^\n]*/g, "")));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") === -1);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
