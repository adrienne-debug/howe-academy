/*
 * PATPICK (her research plan 2026-10-23): "🎯 Pick it" — a learning-pattern step. The card's front, three chips
 * (the right answer + two lures from the SAME deck via the Memory game's _matchLures), tap one: right → good,
 * wrong → again (the card comes back later in the sitting). No lures → the card flips as "rec".
 *   1 · "pick" is a pattern step: MST_PATTERN_MODES, mstPatternClean, the editor label, mhqPatCycle
 *   2 · the face: three chips, exactly one right, lures from the same deck; numbers get the nearest lures
 *   3 · a right pick grades good, a wrong pick grades again and re-queues the card (through the real mstTap)
 *   4 · a deck with no lures falls back to the rec flip (and keeps its ✗ / ✓ buttons)
 *   5 · the side-change rule still applies (pick after rec is a new side)
 *   6 · wiring: the hook lines in mstCardHtml / renderMastStudy, no 🔀
 * Runs the REAL code sliced from index.html.   run:  node test_pattern_pick.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error("missing " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

ok("PATPICK block present", src.indexOf("// PATPICK_START") > 0 && src.indexOf("// PATPICK_END") > src.indexOf("// PATPICK_START"));

// A study harness: the sitting engine, the card face, the nav/tap code and the PATPICK block, all real.
function harness(items, defs) {
  const timers = [];
  const ctx = { console, Math, Object, Array, String, Number, JSON, Set, Date, parseFloat, isNaN,
    masteryKid: "lincoln", masteryData: { lincoln: items },
    MAST_TIER_ORDER: ["daily", "every_other_day", "weekly", "bi_weekly", "monthly", "graduated"], MAST_TIER_INT: { daily: 1, every_other_day: 2, weekly: 7, bi_weekly: 14, monthly: 28, graduated: null },
    mastDrillSettings: () => ({ ladder: [] }), mastIsDue: () => false, mastIsParked: () => false, mastIsNeverDrill: () => false, mastFullBank: () => ({}),
    mastGetDef: (k, n) => defs[n] || "", mastCustomDef: () => "", mastGetDefAudio: () => null, mastGetCatMode: () => "", mastCatFace: () => "",
    mastGetVisual: () => null, MAST_ANIMAL_EMOJI: {}, MAST_COLOR_MAP: {}, mastColorBorder: () => "#000", mastShapeVis: () => "",
    ttsFlipAttrs: () => "", mstAutoPlayCurrent: () => {}, mstSessions: () => [], mstPersist: () => {},
    renders: 0, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; } };
  ctx._mastRe = () => { ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext([
    block("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──"),
    "let mstState=null, mstFlipped=false, mstTyped='', mstChecked=null, mstSid=null;",
    ["mstEsc", "mstEscJs", "mstItemAnswer", "mstCardDef", "mstCardMode", "mstIsRuleCard", "mstIsSpellCard", "mstAudioBtn", "mstFlipBtn",
      "mstCardPic", "mstPicCardHtml", "mstCardHtml", "mstTypeAnsOn", "_smTileVis", "_matchPlain", "_matchLures", "mstTap"].map(slice).join("\n"),
    block("// MST_NAV_START", "// MST_NAV_END"),
    block("// PATPICK_START", "// PATPICK_END"),
  ].join("\n"), ctx);
  const R = c => vm.runInContext(c, ctx);
  R("mstNow=function(){ return 1e12; }; mstLockTs=0;");   // the 350 ms tap lock never bites in a test
  return { ctx, R, timers, flush() { while (timers.length) timers.shift().f(); } };
}
const chipsOf = html => { const out = []; const re = /class="mst-pick-chip" data-ok="(\d)"[^>]*>(.*?)<\/button>/g; let m;
  while ((m = re.exec(html))) out.push({ ok: m[1] === "1", text: m[2].replace(/<[^>]*>/g, "").trim() }); return out; };

// ── 1 · a pattern step ─────────────────────────────────────────────────────────────
console.log("── 1 · \"pick\" is a pattern step ──");
{
  const { R } = harness([], {});
  ok("MST_PATTERN_MODES carries pick", R("MST_PATTERN_MODES.indexOf('pick')") !== -1);
  ok("…once, after the existing steps", R("MST_PATTERN_MODES.filter(m=>m==='pick').length") === 1 && R("MST_PATTERN_MODES.slice(0,3).join()") === "rec,say,type");
  ok("mstPatternClean keeps pick", R("JSON.stringify(mstPatternClean(['pick','rec','say']))") === '["pick","rec","say"]');
  ok("mstPatternMode returns pick on its day", R("mstPatternMode(['pick','rec','say'],0,3)") === "pick");
  const cyc = R("(function(){ var M=MST_PATTERN_MODES; return M[(M.indexOf('type')+1)%M.length]; })()");
  ok("the editor's cycle (mhqPatCycle's own formula) reaches pick from type", cyc === "pick" || R("MST_PATTERN_MODES").indexOf("pick") > 2);
  ok("the editor labels it 🎯 Pick it", /const _pl = \{ rec: [^\n]*, pick: "\\u\{1F3AF\} Pick it" \};/.test(src));
  ok("mhqPatCycle still cycles through MST_PATTERN_MODES", /function mhqPatCycle\(i\)[^\n]*MST_PATTERN_MODES\.indexOf\(p\[i\]\) \+ 1\) % MST_PATTERN_MODES\.length/.test(src));
}

// ── 2 · the face ────────────────────────────────────────────────────────────────────
console.log("── 2 · three chips, one right, lures from the same deck ──");
const VOCAB = [
  { id: "g1", subject: "German", prompt: "der Hund", status: "introduction", tally_dots: 0 },
  { id: "g2", subject: "German", prompt: "die Katze", status: "active" },
  { id: "g3", subject: "German", prompt: "das Haus", status: "active" },
  { id: "g4", subject: "German", prompt: "der Baum", status: "active" },
  { id: "s1", subject: "Science", prompt: "atom", status: "active" },
  { id: "s2", subject: "Science", prompt: "cell", status: "active" },
];
const VDEFS = { "der Hund": "the dog", "die Katze": "the cat", "das Haus": "the house", "der Baum": "the tree", atom: "smallest unit", cell: "unit of life" };
{
  const { R } = harness(VOCAB, VDEFS);
  R("mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[0]],newNames:[]},{pattern:['pick','rec','say'],passes:3},{dotsNeeded:()=>3})");
  ok("the day-1 card is a pick card", R("mstCurrent(mstState).mode") === "pick");
  ok("mstPickOn says the pick face is drawn", R("mstPickOn({},mstCurrent(mstState))") === true);
  const html = R("mstCardHtml({name:'German'},mstCurrent(mstState))");
  const chips = chipsOf(html);
  ok("the front shows the card's name", html.indexOf('<div class="mast-slide-name">der Hund</div>') > 0);
  ok("three chips", chips.length === 3, chips);
  ok("exactly one right chip, and it is the card's answer", chips.filter(c => c.ok).length === 1 && chips.find(c => c.ok).text === "the dog", chips);
  const german = ["the cat", "the house", "the tree"];
  ok("both lures come from the German deck", chips.filter(c => !c.ok).every(c => german.indexOf(c.text) !== -1), chips);
  ok("no lure repeats the right answer or another lure", new Set(chips.map(c => c.text)).size === 3);
  ok("the answer is not printed anywhere but its chip", html.split("the dog").length === 2);
  ok("no flip on the pick face", html.indexOf("mstFlip()") === -1);
  const again = R("mstCardHtml({name:'German'},mstCurrent(mstState))");
  ok("chip order is stable on a re-render", JSON.stringify(chipsOf(again)) === JSON.stringify(chips));
  // the order is really shuffled per sitting: over many fresh sittings the right chip lands in more than one slot
  const slots = new Set();
  for (let n = 0; n < 40; n++) { R("mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[0]],newNames:[]},{pattern:['pick'],passes:3},{dotsNeeded:()=>3})");
    slots.add(chipsOf(R("mstCardHtml({name:'German'},mstCurrent(mstState))")).findIndex(c => c.ok)); }
  ok("chips are shuffled per sitting (the right chip moves)", slots.size > 1, [...slots]);
}
console.log("── 2b · numbers get the nearest lures ──");
{
  const facts = [["7×8", "56"], ["6×9", "54"], ["9×7", "63"], ["2×2", "4"], ["3×3", "9"], ["10×10", "100"], ["5×5", "25"]]
    .map(([p, a], i) => ({ id: "m" + i, subject: "Math Facts", prompt: p, answer: a, status: i ? "active" : "introduction" }));
  const { R } = harness(facts, {});
  R("mstItemAnswer=function(id){ var it=masteryData.lincoln.find(i=>i.id===id); return it?it.answer:''; }");
  R("mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[0]],newNames:[]},{pattern:['pick'],passes:3},{dotsNeeded:()=>3})");
  const chips = chipsOf(R("mstCardHtml({name:'Facts'},mstCurrent(mstState))"));
  ok("7×8 → the right chip is 56", chips.filter(c => c.ok).map(c => c.text).join() === "56", chips);
  ok("…and the lures are the two nearest values, 54 and 63", chips.filter(c => !c.ok).map(c => c.text).sort().join() === "54,63", chips);
}
console.log("── 2c · a picture card picks its picture ──");
{
  const pics = [["dog", "🐶"], ["cat", "🐱"], ["cow", "🐮"], ["pig", "🐷"]].map(([p, e], i) => ({ id: "a" + i, subject: "Animals", prompt: p, emoji: e, status: "active" }));
  const { R } = harness(pics, { dog: "a pet that barks", cat: "a pet that meows", cow: "gives milk", pig: "oinks" });
  R("mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[0]],newNames:[]},{pattern:['pick'],passes:3},{dotsNeeded:()=>3})");
  const html = R("mstCardHtml({name:'Animals'},mstCurrent(mstState))");
  const chips = chipsOf(html);
  ok("three picture chips", chips.length === 3 && (html.match(/class="memoji"/g) || []).length === 3, chips);
  ok("the right chip carries the dog's picture", /data-ok="1"[^>]*>[^]*?🐶/.test(html.slice(html.indexOf('data-ok="1"'), html.indexOf('</button>', html.indexOf('data-ok="1"')))));
  ok("the ask reads Pick its picture", html.indexOf("Pick its picture") > 0);
}

// ── 3 · grading ────────────────────────────────────────────────────────────────────
console.log("── 3 · right → good, wrong → again (re-queued) ──");
{
  const h = harness(VOCAB, VDEFS), R = h.R;
  const learning = [VOCAB[0], { id: "g5", subject: "German", prompt: "der Tisch", tally_dots: 0, status: "introduction" }];
  VDEFS["der Tisch"] = "the table";
  R("mstState=mstSittingInit(" + JSON.stringify({ reviews: [], learning, newNames: [] }) + ",{pattern:['pick','rec'],passes:3},{dotsNeeded:()=>2})");
  const right = () => R("(function(){ var c=mstPickChips(mstCurrent(mstState)); return c.findIndex(x=>x.ok); })()");
  const wrong = () => R("(function(){ var c=mstPickChips(mstCurrent(mstState)); return c.findIndex(x=>!x.ok); })()");
  R("mstPickTap(" + right() + ")");
  const shown = R("mstCardHtml({name:'German'},mstCurrent(mstState))");
  ok("a right pick lights its chip green and says Right", /border:2\.5px solid #16a34a;background:#dcfce7/.test(shown) && shown.indexOf("Right!") > 0);
  ok("…the chips are locked until the grade lands", (shown.match(/ disabled/g) || []).length === 3);
  ok("…no grade before the beat", R("mstState.cards['l:g1'].goods") === 0 && h.timers.length === 1);
  R("mstPickTap(" + wrong() + ")");
  ok("one pick per showing (a second tap does nothing)", h.timers.length === 1);
  h.flush();
  ok("right pick → graded good", R("mstState.cards['l:g1'].goods") === 1 && R("mstState.cards['l:g1'].first") === "good");
  ok("…and the card goes to the back for its next right answer", R("mstState.queue[mstState.queue.length-1]") === "l:g1" && R("mstCurrent(mstState).key") === "l:g5");
  R("mstPickTap(" + wrong() + ")");
  const miss = R("mstCardHtml({name:'German'},mstCurrent(mstState))");
  ok("a wrong pick lights red and the right chip lights green", /#dc2626;background:#fee2e2/.test(miss) && /#16a34a;background:#dcfce7/.test(miss));
  ok("…with a longer beat", h.timers[0].ms > 1000);
  h.flush();
  ok("wrong pick → graded again", R("mstState.cards['l:g5'].first") === "again" && R("mstState.cards['l:g5'].goods") === 0);
  ok("…and the card is re-queued in this sitting", R("mstState.cards['l:g5'].done") === false && R("mstState.queue[mstState.queue.length-1]") === "l:g5");
  ok("the next showing is a fresh, unpicked face", R("mstCardHtml({name:'German'},mstCurrent(mstState))").indexOf(" disabled") === -1);
  // ← Back during the beat: the grade never lands, and the restored card can be picked again
  R("mstPickTap(" + right() + ")"); R("mstBack()"); h.flush();
  ok("← Back during the beat cancels the grade", R("mstState.cards['l:g1'].goods") === 1);
  ok("…and the card isn't stuck on its old pick", R("mstCardHtml({name:'German'},mstCurrent(mstState))").indexOf(" disabled") === -1);
}

// ── 4 · no lures ───────────────────────────────────────────────────────────────────
console.log("── 4 · a deck with no lures flips as rec ──");
{
  const tiny = [{ id: "t1", subject: "Tiny", prompt: "eins", status: "introduction" }, { id: "t2", subject: "Tiny", prompt: "zwei", status: "active" },
    { id: "o1", subject: "Other", prompt: "drei", status: "active" }];
  const { R } = harness(tiny, { eins: "one", zwei: "two", drei: "three" });
  R("mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[0]],newNames:[]},{pattern:['pick'],passes:3},{dotsNeeded:()=>3})");
  ok("the card's step is still pick", R("mstCurrent(mstState).mode") === "pick");
  ok("only 1 other answer in the deck → no pick face", R("mstPickOn({},mstCurrent(mstState))") === false);
  const html = R("mstCardHtml({name:'Tiny'},mstCurrent(mstState))");
  ok("…the normal rec flip is drawn (name front, meaning back, tap to flip)", html.indexOf("mstFlip()") > 0 && html.indexOf("mst-pick-chip") === -1 && html.indexOf(">one<") > 0);
  const same = [{ id: "r1", subject: "Rules", prompt: "a", status: "introduction" }, { id: "r2", subject: "Rules", prompt: "b", status: "active" }, { id: "r3", subject: "Rules", prompt: "c", status: "active" }];
  const H2 = harness(same, { a: "a rule", b: "a rule", c: "a rule" });
  H2.R("mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[0]],newNames:[]},{pattern:['pick'],passes:3},{dotsNeeded:()=>3})");
  ok("a deck whose answers are all the same has no lures either", H2.R("mstPickOn({},mstCurrent(mstState))") === false);
}

// ── 5 · side change ────────────────────────────────────────────────────────────────
console.log("── 5 · the side-change rule still applies ──");
{
  const { R } = harness([], {});
  ok("pick after rec is a new side (not a repeat day)", R("mstPatternRepeatDay(['rec','pick','pick'],1,3)") === false);
  ok("pick after pick is a repeat day", R("mstPatternRepeatDay(['rec','pick','pick'],2,3)") === true);
  ok("rec after pick is a new side", R("mstPatternRepeatDay(['pick','rec'],1,2)") === false);
  R("var _s=mstSittingInit({reviews:[],learning:[{id:'x',subject:'G',prompt:'p',tally_dots:1},{id:'y',subject:'G',prompt:'q',tally_dots:2}],newNames:[]},{pattern:['rec','pick','pick'],passes:3},{dotsNeeded:()=>3})");
  ok("the sitting asks the full 3 on pick's first day", R("_s.cards['l:x'].mode") === "pick" && R("_s.cards['l:x'].passes") === undefined && R("_s.passes") === 3);
  ok("…and 1 on its repeat day", R("_s.cards['l:y'].mode") === "pick" && R("_s.cards['l:y'].passes") === 1);
}

// ── 6 · wiring ─────────────────────────────────────────────────────────────────────
console.log("── 6 · wiring ──");
{
  const face = slice("mstCardHtml");
  const hook = face.indexOf("if(typeof mstPickOn===\"function\"&&mstPickOn(session,card)) return mstPickHtml(session,card,_lrn);");
  ok("mstCardHtml dispatches to the pick face", hook > 0);
  ok("…just before the type branch", hook > 0 && /^\s*if\(mode==="type"\)\{/.test(face.slice(face.indexOf("\n", hook) + 1)));
  ok("…after the picture / rule / spell / typed-answer faces", hook > face.indexOf("mstPicCardHtml(") && hook > face.indexOf("mstIsRuleCard(card)") && hook > face.indexOf("mstIsSpellCard(card)") && hook > face.indexOf("mstTypeAnsHtml("));
  ok("renderMastStudy hides ✗ / ✓ for a pick card", /mstTypeAnsOn\(session,card\)\)\|\|\(typeof mstPickOn==="function"&&mstPickOn\(session,card\)\)\)\{/.test(slice("renderMastStudy")));
  ok("the step is pushed from the block, not written into the array literal", /const MST_PATTERN_MODES = \["rec", "say", "type"\];/.test(src) && block("// PATPICK_START", "// PATPICK_END").indexOf('MST_PATTERN_MODES.push("pick")') > 0);
  ok("the block writes nothing to the database", !/\bdb\.ref\(|\.set\(|\.update\(/.test(block("// PATPICK_START", "// PATPICK_END")));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") === -1);
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
