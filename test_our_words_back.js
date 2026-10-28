// 📝 OURWORDS PR 1 — the resolver (DESIGN_our_words_2026-10-24.md §5.4, §14 test_our_words_back; her go 2026-10-27).
//   · mastGetDef(kid,prompt,deck): a live wording/add record's back › deck_defs (PR 5; absent = skip) › definitions › the
//     code tables — and WITHOUT the deck, byte-for-byte the committed function (sliced from HEAD and run side by side)
//   · with the deck but no records: the same answers as today for every prompt tried
//   · every listed call site passes the card's deck; the recite sites read owRuleBack; mhqDeckCards reads the family back
//     first and is JSON-identical to HEAD's on a fixture with no records
//   · Lincoln's "er": a wording record for Phonograms shows "/er/ · her" there and "he" for German
//   · no display site reads definitions[…] directly any more (outside mastGetDef, every hit is a writer)
//   run: node test_our_words_back.js
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let head = ""; try { head = cp.execSync("git show HEAD:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { head = ""; }
const cutIn = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const fn = n => fnIn(src, n);
const BLOCK = cutIn(src, "// OURWORDS_START", "// OURWORDS_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const FIX = () => ({
  lincoln: [
    { id: "lin_pg_er", subject: "Phonograms", prompt: "er", answer: "/er/ · her", review_mode: "recite", status: "parked", tier: "daily" },
    { id: "lin_er", subject: "German", prompt: "er", answer: "he", status: "active", tier: "weekly" },
    { id: "lin_floss", subject: "Spelling Rules", prompt: "Floss rule", answer: "Double f, l, or s after a single short vowel at the end of a one-syllable word.", review_mode: "recite", status: "active", tier: "monthly" },
    { id: "lin_brave", subject: "Vocabulary", prompt: "brave", status: "active", tier: "weekly" },
    { id: "lin_ops", subject: "Math Facts", prompt: "3 + 4 × 2", answer: "11", status: "introduction", tier: "daily" },
    { id: "lin_flex", subject: "Greek & Latin Roots", prompt: "flex/flect", status: "active", tier: "weekly" }],
  lincoln_custom_items: [{ cat: "Spelling Rules", name: "Silent e rule", def: "Drop the e before a vowel suffix." }],
  lincoln_settings: { definitions: { er: "he", kind: "a family meaning of kind", "flex%2Fflect": "bend" } }
});
function world(o) {
  o = o || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, masteryData: o.mastery || FIX(), masteryKid: "lincoln",
    MAST_MATH_ANS: { "3 + 4 × 2": "11", "25% of 80": "20" }, MAST_VOCAB_DEFS: { brave: "not afraid, ready to face danger", kind: "friendly and caring toward others" },
    mastIsParked: i => !!(i && i.status === "parked"), mhqTierLbl: t => String(t == null ? "" : t).replace(/^bi_/, "bi-").replace(/_/g, " "), unitStudies: {},
    mastFullBank: () => ({}), haKidUnits: () => [], mhqItems: kid => ctx.masteryData[kid] || [], mhqBank: () => ({ "Spelling Rules": ["Floss rule", "Silent e rule"], Phonograms: ["er", "ar"] }) };
  vm.createContext(ctx);
  vm.runInContext(BLOCK + "\n" + fn("mastGetDef") + "\n" + fn("mastCustomDef") + "\n" + fn("mastDefKeyOk") + "\n" + fn("mastDefKey") + "\n" + fn("mstItemAnswer") + "\n" + fn("mstCardDef") + "\n" + fn("mhqDeckCards") + "\n" + fn("mastItemSpeakText"), ctx);
  return ctx;
}
function headWorld(mastery) {
  const ctx = { console, JSON, Object, Array, String, masteryData: mastery, masteryKid: "lincoln", MAST_MATH_ANS: { "3 + 4 × 2": "11", "25% of 80": "20" }, MAST_VOCAB_DEFS: { brave: "not afraid, ready to face danger", kind: "friendly and caring toward others" },
    mastIsParked: i => !!(i && i.status === "parked"), mhqItems: kid => mastery[kid] || [], mhqBank: () => ({ "Spelling Rules": ["Floss rule", "Silent e rule"], Phonograms: ["er", "ar"] }) };
  vm.createContext(ctx);
  vm.runInContext(fnIn(head, "mastGetDef") + "\n" + fnIn(head, "mastDefKeyOk") + "\n" + fnIn(head, "mastDefKey") + "\n" + fnIn(head, "mhqDeckCards") + "\n" + fnIn(head, "mstItemAnswer"), ctx);
  return ctx;
}
const PROMPTS = ["er", "brave", "kind", "3 + 4 × 2", "25% of 80", "flex/flect", "Floss rule", "nothing here", "Er"];
const DECKS = [undefined, "Phonograms", "German", "Vocabulary", "Math Facts", "Spelling Rules", "Greek & Latin Roots", ""];

console.log("── the order: record › deck_defs › definitions › code tables ──");
{
  const c = world();
  ok("no records, no deck: definitions win (er → he), then math, then vocab, else ''", c.mastGetDef("lincoln", "er") === "he" && c.mastGetDef("lincoln", "3 + 4 × 2") === "11" && c.mastGetDef("lincoln", "brave") === "not afraid, ready to face danger" && c.mastGetDef("lincoln", "zzz") === "");
  ok("the coded key still answers (flex/flect → bend)", c.mastGetDef("lincoln", "flex/flect") === "bend" && c.mastGetDef("lincoln", "flex/flect", "Greek & Latin Roots") === "bend");
  c.masteryData.lincoln_settings.deck_defs = { Phonograms: { er: "/er/ · her" } };
  ok("deck_defs (PR 5's layer) answers for its deck only", c.mastGetDef("lincoln", "er", "Phonograms") === "/er/ · her" && c.mastGetDef("lincoln", "er", "German") === "he" && c.mastGetDef("lincoln", "er") === "he");
  c.masteryData.lincoln_ourwords = { w1: { v: 1, kind: "wording", unit: null, deck: "Phonograms", name: "er", back: "/er/ as in her", src: "quick", order: 1, ts: 1 } };
  ok("a wording record beats deck_defs and definitions — for its deck", c.mastGetDef("lincoln", "er", "Phonograms") === "/er/ as in her" && c.mastGetDef("lincoln", "er", "German") === "he" && c.mastGetDef("lincoln", "er") === "he");
  c.masteryData.lincoln_ourwords = Object.assign({}, c.masteryData.lincoln_ourwords, { a1: { v: 1, kind: "add", unit: null, deck: "Vocabulary", name: "brave", back: "ready to do a hard thing", src: "quick", order: 1, ts: 1 } });   // the listener replaces the map (new identity) on every event
  ok("an add record with a back beats the code table; one without a back changes nothing", c.mastGetDef("lincoln", "brave", "Vocabulary") === "ready to do a hard thing" && (c.masteryData.lincoln_ourwords.a2 = { v: 1, kind: "add", deck: "Vocabulary", name: "kind", src: "quick", order: 2, ts: 1 }, c.masteryData.lincoln_ourwords = Object.assign({}, c.masteryData.lincoln_ourwords), c.mastGetDef("lincoln", "kind", "Vocabulary") === "a family meaning of kind"));
  c.masteryData.lincoln_ourwords = Object.assign({}, c.masteryData.lincoln_ourwords, { w1: Object.assign({}, c.masteryData.lincoln_ourwords.w1, { off: true }) });
  ok("a removed (off) record is ignored", c.mastGetDef("lincoln", "er", "Phonograms") === "/er/ · her");
  ok("the index is rebuilt when the map changes identity and reused while it does not", (() => { const a = c.owIndex("lincoln"); const b = c.owIndex("lincoln"); c.masteryData.lincoln_ourwords = Object.assign({}, c.masteryData.lincoln_ourwords); const d = c.owIndex("lincoln"); return a === b && d !== a; })());
}
console.log("\n── without the deck, byte-for-byte the committed function; with the deck and no records, the same ──");
if (!head) { ok("HEAD's index.html readable (git show)", false); } else {
  const c = world(), h = headWorld(FIX());
  let same = true, diffs = [];
  PROMPTS.forEach(p => { const a = h.mastGetDef("lincoln", p), b = c.mastGetDef("lincoln", p); if (a !== b) { same = false; diffs.push([p, a, b]); } });
  ok("no deck: every prompt answers exactly as HEAD", same, diffs);
  same = true; diffs = [];
  PROMPTS.forEach(p => DECKS.forEach(d => { const a = h.mastGetDef("lincoln", p), b = c.mastGetDef("lincoln", p, d); if (a !== b) { same = false; diffs.push([p, d, a, b]); } }));
  ok("with any deck and no records: every prompt answers exactly as HEAD", same, diffs);
  const hd = JSON.stringify(h.mhqDeckCards("lincoln", "Spelling Rules")) + JSON.stringify(h.mhqDeckCards("lincoln", "Phonograms"));
  const nd = JSON.stringify(c.mhqDeckCards("lincoln", "Spelling Rules")) + JSON.stringify(c.mhqDeckCards("lincoln", "Phonograms"));
  ok("mhqDeckCards (the deck page) is JSON-identical to HEAD with no records", hd === nd);
  ok("mstItemAnswer is identical to HEAD with no records", h.mstItemAnswer("lin_floss") === c.mstItemAnswer("lin_floss") && h.mstItemAnswer("lin_pg_er") === c.mstItemAnswer("lin_pg_er") && c.mstItemAnswer("lin_floss").indexOf("Double f") === 0);
}
console.log("\n── Lincoln's 'er' and the Floss rule ──");
{
  const c = world();
  c.masteryData.lincoln_ourwords = { w1: { v: 1, kind: "wording", unit: null, deck: "Phonograms", name: "er", back: "/er/ · her", src: "quick", order: 1, ts: 1 },
    w2: { v: 1, kind: "wording", unit: "all_about_spelling", deck: "Spelling Rules", name: "Floss rule", back: "We double f, l, s after a short vowel at the end.", src: "quick", order: 1, ts: 1 } };
  ok("Phonograms 'er' shows '/er/ · her'; German 'er' still shows 'he'", c.mastGetDef("lincoln", "er", "Phonograms") === "/er/ · her" && c.mastGetDef("lincoln", "er", "German") === "he");
  ok("mastItemSpeakText reads the card's deck", c.mastItemSpeakText(c.masteryData.lincoln[0], "er") === "/er/ · her" && c.mastItemSpeakText(c.masteryData.lincoln[1], "er") === "he");
  ok("mstCardDef passes the deck", c.mstCardDef({ id: "lin_pg_er", name: "er", deck: "Phonograms" }) === "/er/ · her" && c.mstCardDef({ id: "lin_er", name: "er", deck: "German" }) === "he");
  ok("a rule card's back (mstItemAnswer, owRuleBack) is the family wording", c.mstItemAnswer("lin_floss") === "We double f, l, s after a short vowel at the end." && c.owRuleBack("lincoln", c.masteryData.lincoln[2]) === "We double f, l, s after a short vowel at the end." && c.owRuleBack("lincoln", c.masteryData.lincoln[4]) === "11");
  const d = c.mhqDeckCards("lincoln", "Spelling Rules");
  ok("the deck page shows the family wording on the card and the bank's rule on the waiting one", d.find(x => x.name === "Floss rule").back === "We double f, l, s after a short vowel at the end." && d.find(x => x.name === "Silent e rule").back === "");
}
console.log("\n── every flip-side site passes the deck ──");
{
  const has = (name, re) => ok(name + " passes the deck", re.test(fn(name)), name);
  has("mastItemSpeakText", /mastGetDef\(masteryKid,prompt,it&&it\.subject\)/);
  has("_matchPairHtml", /mastGetDef\(masteryKid,it\.prompt,it\.subject\)/);
  has("mastMintFromBank", /mastGetDef\(kid,name,cat\)/);
  has("mastPullItem", /mastGetDef\(kid,name,cat\)/);
  has("mstCardDef", /mastGetDef\(masteryKid,name,card\.deck\)/);
  has("msaysAnswer", /mastGetDef\(kid,p,it\.subject\)/);
  ok("the auto-pull mint passes the deck", /const _nkdef=mastGetDef\(masteryKid,next,cat\);/.test(fn("mastApplyScores")));
  ok("the Flip Definitions editor passes the deck (started and waiting)", /mastGetDef\(masteryKid,fi\.prompt,fi\.subject\)/.test(src) && /mastGetDef\(masteryKid,nm,cat\)\|\|mastCustomDef/.test(src));
  const drill = src.slice(src.indexOf("const _vocabDef=mastGetDef("), src.indexOf("const _vocabDef=mastGetDef(") + 2500);
  ok("the drill card: _vocabDef with the deck, _isRule and _backText through owRuleBack", /_vocabDef=mastGetDef\(masteryKid,it\.prompt,it\.subject\)/.test(drill) && /const _ruleBack=\(typeof owRuleBack==="function"\)\?owRuleBack\(masteryKid,it\)/.test(drill) && /_isRule=it\.review_mode==="recite"&&_ruleBack&&_ruleBack!==it\.prompt/.test(drill) && /_backText=_isRule\?_ruleBack:_vocabDef/.test(drill));
  ok("mstItemAnswer, mastExpandHtml and _whichBack read owRuleBack", /owRuleBack\(masteryKid,it\)/.test(fn("mstItemAnswer")) && /owRuleBack\(masteryKid,it\)/.test(fn("mastExpandHtml")) && /owRuleBack\(masteryKid,i\)/.test(fn("_whichBack")));
  ok("mhqDeckCards reads the family back first, then defs[] exactly as before", /const _owb=n=>\(typeof owBack==="function"\)\?owBack\(kid,deck,n\):"";/.test(fn("mhqDeckCards")) && (fn("mhqDeckCards").match(/_owb\(name\)\|\|defs\[name\]/g) || []).length === 2);
  ok("no deck-less mastGetDef call is left at a site that has the card", !/mastGetDef\(masteryKid,it\.prompt\)[^,]/.test(src) && !/mastGetDef\(masteryKid,fi\.prompt\)/.test(src) && !/mastGetDef\(masteryKid,name\)\|\|mstItemAnswer/.test(src));
}
console.log("\n── no display site reads definitions[…] directly ──");
{
  const gd = fn("mastGetDef"); const gdStart = src.indexOf(gd), gdEnd = gdStart + gd.length;
  const bad = [];
  let re = /definitions\[[^\]\n]*\]/g, m;
  while ((m = re.exec(src))) {
    if (m.index >= gdStart && m.index < gdEnd) continue;
    const lineStart = src.lastIndexOf("\n", m.index) + 1, line = src.slice(lineStart, src.indexOf("\n", m.index));
    const after = src.slice(m.index + m[0].length, m.index + m[0].length + 8);
    const writer = /^\s*=[^=]/.test(after) || /^\s*==null/.test(after) || /delete\s+\S*definitions\[/.test(line) || /^\s*\/\//.test(line);
    if (!writer) bad.push(line.trim().slice(0, 140));
  }
  ok("outside mastGetDef every definitions[…] is a writer (assignment, a ==null guard, or delete)", bad.length === 0, bad);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
