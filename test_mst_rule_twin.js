// 📚 MSTRULETWIN (her report 2026-11-10: Lincoln's Social Studies study session "will not allow us to go past the
//   ancestors question"; her yes 2026-11-11: "The social studies study session is still not fixed. Can you please get
//   that fixed right now?").
//   The trap, replayed with made-up cards: a vocab deck minted with definitions makes RECITE cards (answer ≠ prompt).
//   With the session's Both directions on, each card has a twin (dir:"prod") that mstSittingInit types ("type").
//   mstCardHtml draws every rule card as the plain flip face — no typed box, no Check / Next — while renderMastStudy
//   hides ✓ / ✗ whenever mstCardMode(card) is "type". Card 2 of the sitting had no way forward.
//   · fix: mstCardMode returns "rec" for a TYPED rule card — flip face + ✓ / ✗ (only "type" ever hides them; say is untouched)
//   · a flash twin (no definition answer) is still typed; a German typed twin is unchanged (MSTTWINMODE, 2026-10-27)
//   · the whole sitting walks to the end with Both directions on; the one line is what clears it (the old function blocks)
//   · no database writes in the block
//   run: node test_mst_rule_twin.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

console.log("\n# the block");
const a = src.indexOf("// MSTRULETWIN_START"), z = src.indexOf("// MSTRULETWIN_END");
ok("MSTRULETWIN markers present, once each", a > 0 && z > a && src.indexOf("// MSTRULETWIN_START", a + 1) === -1 && src.indexOf("// MSTRULETWIN_END", z + 1) === -1);
const blk = src.slice(a, z);
ok("the block wraps mstCardMode", blk.indexOf("function mstCardMode(card){") !== -1 && (src.match(/function mstCardMode\(card\)\{/g) || []).length === 1);
ok("her words and the dates are in the comment", /2026-11-10/.test(blk) && /2026-11-11/.test(blk) && /ancestors/.test(blk) && /still not fixed/.test(blk));
ok("the one line: a typed rule card is 'rec', after the 'rec' early return", /if\(m==="rec"\) return m;\s+if\(m==="type"&&typeof mstIsRuleCard==="function"&&mstIsRuleCard\(card\)\) return "rec";/.test(blk));
ok("no database writes in the block", !/db\.ref|firebase\.|\.set\(|\.update\(|\.remove\(/.test(blk));

// ── the functions under test, sliced from the app ──────────────────────────────────────────────────
const fnSlice = (sig) => { const i = src.indexOf(sig); if (i < 0) throw new Error("missing " + sig); return src.slice(i, src.indexOf("\n}", i) + 2); };
const cardModeSrc = fnSlice("function mstCardMode(card){");
const ruleSrc = fnSlice("function mstIsRuleCard(card){");
ok("mstIsRuleCard still reads the record: recite + answer ≠ prompt", /review_mode==="recite"&&it\.answer&&it\.answer!==it\.prompt/.test(ruleSrc));

// a made-up family: one kid, a history vocab deck minted with definitions (recite cards) plus one flash card, both-ways twins
const DECK = "Explore! History 3B";
const KID = "kid1";
const rec = (id, prompt, answer, extra) => Object.assign({ id, prompt, answer, review_mode: "recite", subject: DECK, status: "active", tier: "every_other_day", next_due: 1 }, extra || {});
const twinOf = (b) => Object.assign({}, b, { id: b.id + "_p", dir: "prod", twinOf: b.id });
const harbor = rec("h_harbor", "harbor", "a sheltered place where ships can stay");
const compass = rec("h_compass", "compass", "", { review_mode: "flash" });            // a flash card: no definition answer
const trade = rec("h_trade", "trade", "buying and selling goods");
const items = [harbor, twinOf(harbor), compass, twinOf(compass), trade, twinOf(trade)];
const masteryData = {}; masteryData[KID] = items;
const defs = {}; items.forEach(i => { if (i.answer) defs[i.prompt] = i.answer; });
defs.compass = "a tool that shows which way is north";   // the bank knows its definition; the flash record just never minted it as the answer

const mkCardMode = (cm) => new Function("masteryData", "masteryKid", "mstCardDef", cm + "\n" + ruleSrc + "\nreturn { mstCardMode, mstIsRuleCard };")(masteryData, KID, (c) => defs[c.name] || "");
const NEW = mkCardMode(cardModeSrc);
const oldSrc = cardModeSrc.replace(/\n\s*if\(m==="type"&&typeof mstIsRuleCard==="function"&&mstIsRuleCard\(card\)\) return "rec";[^\n]*/, "");
ok("(harness) the old function is the new one minus the one line", oldSrc !== cardModeSrc && oldSrc.indexOf("mstIsRuleCard") === -1);
const OLD = mkCardMode(oldSrc);

const card = (it, mode) => { const c = { key: "r:" + it.id, id: it.id, name: it.prompt, deck: it.subject, kind: "review" }; if (mode) c.mode = mode; return c; };

console.log("\n# mstCardMode: a recite twin typed by the engine is a flip card again");
ok("recite twin, mode 'type' → 'rec' (flip face + ✓ / ✗)", NEW.mstCardMode(card(items[1], "type")) === "rec");
ok("…and it IS a rule card (the face mstCardHtml draws)", NEW.mstIsRuleCard(card(items[1], "type")) === true);
ok("the old function said 'type' for the same card — the trap", OLD.mstCardMode(card(items[1], "type")) === "type");
ok("recite base card, no mode → 'rec' (unchanged)", NEW.mstCardMode(card(items[0])) === "rec");
ok("a recite card in a learning pattern's 'say' step stays 'say' (✓ / ✗ already show for say; only 'type' hides them)", NEW.mstCardMode(card(items[1], "say")) === "say" && OLD.mstCardMode(card(items[1], "say")) === "say");
ok("flash twin, mode 'type' → still 'type' (MSTTWINMODE unchanged)", NEW.mstCardMode(card(items[3], "type")) === "type" && NEW.mstIsRuleCard(card(items[3], "type")) === false);
{
  // a German typed twin: a word, not a rule — no recite record
  const g = { key: "r:g1_p", id: "g1_p", name: "der Hund", deck: "German", kind: "review", mode: "type" };
  masteryData[KID].push({ id: "g1_p", prompt: "der Hund", answer: "the dog", subject: "German", dir: "prod", twinOf: "g1", status: "active" });
  defs["der Hund"] = "the dog";
  ok("German twin, mode 'type' → 'type' exactly as before", NEW.mstCardMode(g) === "type" && OLD.mstCardMode(g) === "type");
  masteryData[KID].pop(); delete defs["der Hund"];
}
ok("a card with no definition at all, mode 'type' → 'rec' (the old fallback still holds)", NEW.mstCardMode({ name: "nothing", deck: DECK, mode: "type" }) === "rec");
ok("no card → 'rec', no throw", NEW.mstCardMode(null) === "rec" && NEW.mstCardMode(undefined) === "rec");

console.log("\n# the screen: a rule card's face has no typed box, and ✓ / ✗ hide only on a 'type' card");
const chi = src.indexOf("function mstCardHtml(session,card){");
const cardHtml = src.slice(chi, src.indexOf("\nfunction ", chi + 10));
const ruleFaceAt = cardHtml.indexOf("if(mstIsRuleCard(card)){");
const typeFaceAt = cardHtml.search(/mode==="type"/);
ok("mstCardHtml draws the rule face before the typed face", ruleFaceAt > 0 && typeFaceAt > ruleFaceAt);
const ruleFace = cardHtml.slice(ruleFaceAt, cardHtml.indexOf("\n  if(", ruleFaceAt + 10));
ok("the rule face has no Check / Next of its own", !/mstTap\(|mstCheck|mstPickTap/.test(ruleFace));
ok("renderMastStudy hides ✓ / ✗ only when mstCardMode is 'type' (or Type-the-answer / Pick is on)", /if\(mstCardMode\(card\)==="type"\|\|\(typeof mstTypeAnsOn==="function"&&mstTypeAnsOn\(session,card\)\)\|\|\(typeof mstPickOn==="function"&&mstPickOn\(session,card\)\)\)\{/.test(src));

console.log("\n# the sitting: Both directions on, every card walks to the end");
const si = src.indexOf("// ── MST_ENGINE_START ──"), ei = src.indexOf("// ── MST_ENGINE_END ──");
ok("engine markers present", si > 0 && ei > si);
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
const E = new Function(stubs + src.slice(si, ei) + "\nreturn { mstSittingInit, mstCurrent, mstAnswer };")();
const session = { sid: "history", kind: "deck", decks: [DECK], bothWays: true, passes: 2 };
const pile = () => ({ reviews: items.slice(), learning: [], newNames: [] });
// the kid's only ways forward: ✓ / ✗ under the card (shown unless mstCardMode is "type"), or Check / Next inside a
// typed face (never drawn for a rule card). Type-the-answer and Pick are off in this session.
const walk = (M) => {
  const st = E.mstSittingInit(pile(), session);
  const total = st.queue.length;
  const modes = {}; Object.keys(st.cards).forEach(k => { modes[k] = st.cards[k].mode; });
  let steps = 0, cur = E.mstCurrent(st), blocked = null;
  while (cur && steps < 200) {
    const c = Object.assign({ key: cur.key, id: cur.id, name: cur.name, deck: cur.deck || DECK }, cur.mode ? { mode: cur.mode } : {});
    const checksHidden = M.mstCardMode(c) === "type";
    const typedFace = !M.mstIsRuleCard(c) && M.mstCardMode(c) === "type";
    if (checksHidden && !typedFace) { blocked = c; break; }
    E.mstAnswer(st, cur.key, "good"); steps++; cur = E.mstCurrent(st);
  }
  return { steps, blocked, finished: !cur, modes, total };
};
{
  const w = walk(NEW);
  ok("the engine still types the twins (Both directions on)", w.modes["r:h_harbor_p"] === "type" && w.modes["r:h_trade_p"] === "type" && w.modes["r:h_harbor"] === undefined, w.modes);
  ok("the sitting walks every card to the end — nothing blocks", w.finished && w.blocked === null && w.steps === w.total && w.total >= items.length, { steps: w.steps, total: w.total, blocked: w.blocked });
}
{
  const w = walk(OLD);
  ok("(replay) without the one line the sitting blocks on the first recite twin — her report", !w.finished && w.blocked && /_p$/.test(w.blocked.id) && NEW.mstIsRuleCard(w.blocked), w.blocked);
}
{
  const off = Object.assign({}, session, { bothWays: false });
  const st = E.mstSittingInit(pile(), off);
  ok("Both directions off: twins are untyped and still in the sitting (unchanged)", st.cards["r:h_harbor_p"].mode === undefined && st.queue.indexOf("r:h_harbor_p") !== -1);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
