// ↔ MSTTWINMODE (her report 2026-10-27: Lincoln's Social Studies sitting "didn't give him check off buttons … he couldn't
//   answer"; her yes: "a both-directions twin runs typed only while its session still has Both directions on, and the chip
//   names the deck's language instead of German").
//   · engine: mstSittingInit types a 🇬🇧→🇩🇪 twin (dir:"prod") only when the session has bothWays on; off/absent → no mode
//     (mstCardMode → "rec", the plain flip card with ✓ / ✗); a base card is never typed by this rule either way
//   · chip: mstDirChip names the deck's language (German, Spanish, Deutsch → German, …); a deck with none reads
//     "Type the word" / "Say it — out loud"; mstCardHtml draws the chip from the card's deck (or the session's name)
//   · German sittings: bothWays on + a German deck → typed twin + "Type it in German", byte-for-byte the old words
//   · no database writes in either block
//   run: node test_mst_twin_mode.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

console.log("\n# the engine block: a twin is typed only while Both directions is on");
const si = src.indexOf("// ── MST_ENGINE_START ──"), ei = src.indexOf("// ── MST_ENGINE_END ──");
ok("engine markers present", si > 0 && ei > si);
const engine = src.slice(si, ei);
ok("the rule reads the session's bothWays (MSTTWINMODE)", /if \(item\.dir === "prod" && !!\(session && session\.bothWays\)\) cards\[key\]\.mode = "type";\s+\/\/ .*MSTTWINMODE/.test(engine));
ok("no other place forces a twin typed", (engine.match(/dir === "prod"/g) || []).length === 1);
const stubs = `
var masteryData = {}; var masteryKid = null;
var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
function mastDrillSettings(){ return { ladder: ["every_other_day","weekly","bi_weekly","monthly","graduated"] }; }
function mastIsDue(){ return true; } function mastIsParked(i){ return !!(i && i.status === "parked"); } function mastIsNeverDrill(){ return false; }
function mastStampNextDue(){} function mastUniqueId(items,id){ return id; } function mastMintFromBank(){ return {}; } function mastGetPrintNum(){ return 1; }
function mastGetDef(){ return ""; } function mastCustomDef(){ return ""; }
var HA_LS = { getItem(){ return null; }, setItem(){}, removeItem(){} };
`;
const M = new Function(stubs + engine + "\nreturn { mstSittingInit, mstCurrent, mstPatternClean };")();
const twin = { id: "lin_historian_p", subject: "Discover! Social Studies 6A", prompt: "historian", dir: "prod", twinOf: "lin_historian", status: "active" };
const base = { id: "lin_historian", subject: "Discover! Social Studies 6A", prompt: "historian", status: "active" };
const pile = () => ({ reviews: [twin, base], learning: [], newNames: [] });
{
  const st = M.mstSittingInit(pile(), { sid: "social_studies", kind: "deck", decks: ["Discover! Social Studies 6A"], bothWays: true, passes: 2 });
  ok("Both directions ON (as his session is today): the twin is typed, the base card is not", st.cards["r:lin_historian_p"].mode === "type" && st.cards["r:lin_historian"].mode === undefined, st.cards);
}
{
  const st = M.mstSittingInit(pile(), { sid: "social_studies", kind: "deck", decks: ["Discover! Social Studies 6A"], bothWays: false, passes: 2 });
  ok("Both directions OFF: the twin has no mode — a plain flip card — and is still in the sitting", st.cards["r:lin_historian_p"].mode === undefined && st.queue.indexOf("r:lin_historian_p") !== -1 && st.counts.review === 2, st.cards);
}
{
  const st = M.mstSittingInit(pile(), { sid: "social_studies", kind: "deck", decks: ["Discover! Social Studies 6A"], passes: 2 });
  ok("bothWays absent (an older session record): same as off", st.cards["r:lin_historian_p"].mode === undefined);
  const st2 = M.mstSittingInit(pile(), null);
  ok("no session at all: the engine does not throw, twin untyped", st2.cards["r:lin_historian_p"].mode === undefined);
}
{
  const st = M.mstSittingInit({ reviews: [{ id: "g1_p", subject: "German", prompt: "der Hund", dir: "prod", twinOf: "g1" }], learning: [], newNames: [] }, { sid: "german", kind: "deck", decks: ["German"], bothWays: true, passes: 2 });
  ok("German, Both directions on: the twin is typed exactly as before", st.cards["r:g1_p"].mode === "type");
}
{
  // a learning-pile twin never existed (twins are minted active); the pattern path is untouched
  const st = M.mstSittingInit({ reviews: [], learning: [{ id: "n1", subject: "German", prompt: "die Katze", tally_dots: 0 }], newNames: [] }, { sid: "german", kind: "deck", decks: ["German"], bothWays: true, pattern: ["rec", "say", "type"], passes: 2 });
  ok("the learning pattern still sets its own modes (rec at 0 dots)", st.cards["l:n1"].mode === "rec", st.cards["l:n1"]);
}

console.log("\n# mstCardMode: an untyped twin shows as a flip card");
{
  const cm = src.slice(src.indexOf("function mstCardMode(card){"), src.indexOf("\n}", src.indexOf("function mstCardMode(card){")) + 2);
  const mstCardMode = new Function("mstCardDef", cm + "; return mstCardMode;")(() => "a person who studies the past");
  ok("mode undefined → 'rec' (flip, ✓ / ✗); mode 'type' with a definition → 'type'", mstCardMode({ name: "historian" }) === "rec" && mstCardMode({ name: "historian", mode: "type" }) === "type");
}

console.log("\n# the chip names the deck's language");
const a = src.indexOf("// MSTTWINMODE_START"), z = src.indexOf("// MSTTWINMODE_END");
ok("MSTTWINMODE block present, right before mstCardHtml", a > 0 && z > a && src.indexOf("function mstCardHtml(session,card){") > z && src.indexOf("function mstCardHtml(session,card){") - z < 40);
const blk = src.slice(a, z);
ok("no database writes in the block", !/db\.ref|firebase\./.test(blk));
const L = new Function(blk + "; return { mstLangOf, mstDirChip };")();
const txt = h => h.replace(/<[^>]+>/g, "");
ok("German / Deutsch / Spanish / French decks name their language", L.mstLangOf("German") === "German" && L.mstLangOf("Deutsch 1") === "German" && L.mstLangOf("Spanish Vocab Unit 2") === "Spanish" && L.mstLangOf("French — Unit 3") === "French");
ok("a non-language deck has none", L.mstLangOf("Discover! Social Studies 6A") === "" && L.mstLangOf("Science") === "" && L.mstLangOf("") === "" && L.mstLangOf(null) === "");
ok("German chips read exactly the old words", txt(L.mstDirChip("type", "German")) === "⌨️ Type it in German" && txt(L.mstDirChip("say", "German")) === "🗣 Say it in German — out loud");
ok("Social Studies chips: 'Type the word' / 'Say it — out loud'", txt(L.mstDirChip("type", "Discover! Social Studies 6A")) === "⌨️ Type the word" && txt(L.mstDirChip("say", "Discover! Social Studies 6A")) === "🗣 Say it — out loud");
ok("a Spanish deck: 'Type it in Spanish'", txt(L.mstDirChip("type", "Spanish Vocab Unit 2")) === "⌨️ Type it in Spanish");
ok("the chip keeps its old styling", /display:inline-block;margin-top:2px;padding:3px 10px;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:800/.test(L.mstDirChip("type", "German")));
const cardHtml = src.slice(src.indexOf("function mstCardHtml(session,card){"), src.indexOf("\nfunction ", src.indexOf("function mstCardHtml(session,card){") + 10));
ok("mstCardHtml draws the chip from the card's deck (or the session's name) and nowhere hard-codes German", /const _chip=m=>\(typeof mstDirChip==="function"\)\?mstDirChip\(m,card\.deck\|\|session\.name\|\|""\):"";/.test(cardHtml) && !/in German/.test(cardHtml));
ok("the typed and say cards still call the chip", (cardHtml.match(/_chip\("type"\)/g) || []).length >= 1 && (cardHtml.match(/_chip\("say"\)/g) || []).length >= 1);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
