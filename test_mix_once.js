// 🧠 MIXONCE (her report 2026-11-12: "on Daily Mix, it is repeating some of the cards multiple times, especially it seems like
//   German … after it goes from the learning point, it shouldn't be doing it multiple times").
//   Cause 1: a Both-directions twin (dir "prod", twinOf the base) has its base's deck + prompt; the Mix has no Both directions switch,
//            so the twin is drawn as the very same flip card — the live Mix showed 3–7 German cards twice every day.
//   Cause 2: a missed review went to the back of the line and came again until right — inside the Mix too.
//   Now: the Mix takes ONE card per deck + prompt (oldest due; the base on a tie; one already scored in today's Mix is not drawn again),
//        and a Mix card is asked once — a miss is scored ✗ and done. Learning cards and deck-session reviews keep the re-ask.
//   Replayed on the made-up demo family (kid_a, a made-up vocab deck). No database writes anywhere in the engine.
//   run: node test_mix_once.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")));

const si = src.indexOf("// ── MST_ENGINE_START ──"), ei = src.indexOf("// ── MST_ENGINE_END ──");
ok("engine markers present", si > 0 && ei > si);
const engine = src.slice(si, ei);
const ms = engine.indexOf("    // MIXONCE_START"), me = engine.indexOf("    // MIXONCE_END\n");
ok("MIXONCE block present in the Mix branch of mstPile", ms > 0 && me > ms && engine.indexOf("MIX_FINISH_START") > me);
// The engine as it was before this fix: no de-dup block, no once flag, the miss always goes back in line.
const oldEngine = (engine.slice(0, ms) + engine.slice(me + "    // MIXONCE_END\n".length))
  .replace(/\n    if \(session && session\.kind === "mix"\) cards\[key\]\.once = true;[^\n]*/, "")
  .replace(/if \(ans === "good" \|\| card\.once\) \{[^\n]*/, 'if (ans === "good") {');
ok("the old engine slice really is the old code", oldEngine.indexOf("MIXONCE") === -1 && oldEngine.indexOf("card.once") === -1);

const PN = 300;
const stubs = `
var masteryData = {}; var masteryKid = null;
var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
function mastDrillSettings(){ return { ladder: ["every_other_day","weekly","bi_weekly","monthly","graduated"] }; }
function mastIsDue(i,pn){ return i.next_due == null || i.next_due <= pn; } function mastIsParked(i){ return !!(i && i.status === "parked"); } function mastIsNeverDrill(){ return false; }
function mastFullBank(){ return {}; }
var HA_LS = { getItem(){ return null; }, setItem(){}, removeItem(){} };
`;
const load = eng => new Function(stubs + eng + "\nreturn { set: (k, v) => { masteryData[k] = v; }, mstPile, mstSittingInit, mstAnswer, mstCurrent, mstOutcomes, mstProgress };")();

// kid_a's made-up family data: a vocab deck with Both directions on, its cards in the Mix's middle rungs.
const DECK = "Demo Vocab";
const words = ["el perro", "la casa", "el gato", "la mesa", "el libro", "la luna", "el sol", "la flor"];
const slug = w => "kida_" + w.replace(/[^a-z]/g, "_");
function family() {
  const items = [];
  words.forEach((w, i) => {
    const nd = PN - (i % 3);
    items.push({ id: slug(w), subject: DECK, prompt: w, answer: "m" + i, review_mode: "flash", status: "active", tier: "weekly", next_due: nd });
    // the twin: same deck + prompt, minted on graduation — same day for most, one day OLDER for "el sol" (index 6)
    items.push({ id: slug(w) + "_p", subject: DECK, prompt: w, answer: "m" + i, review_mode: "flash", status: "active", tier: "weekly", next_due: i === 6 ? nd - 1 : nd, dir: "prod", twinOf: slug(w) });
  });
  // duplicate DATA: two live items, one prompt, neither a twin
  items.push({ id: "kida_dup1", subject: "Demo Facts", prompt: "2+2", answer: "4", review_mode: "flash", status: "active", tier: "weekly", next_due: PN });
  items.push({ id: "kida_dup2", subject: "Demo Facts", prompt: "2+2", answer: "4", review_mode: "flash", status: "active", tier: "weekly", next_due: PN - 2 });
  // a plain card, a same-prompt card in ANOTHER deck (not a repeat), and a learning card (never the Mix's)
  items.push({ id: "kida_solo", subject: "Demo Facts", prompt: "3+3", answer: "6", review_mode: "flash", status: "active", tier: "weekly", next_due: PN });
  items.push({ id: "kida_other", subject: "Demo Words", prompt: "la casa", answer: "house", review_mode: "flash", status: "active", tier: "weekly", next_due: PN });
  items.push({ id: "kida_lrn", subject: DECK, prompt: "el agua", answer: "w", review_mode: "flash", status: "introduction", tier: "daily" });
  return items;
}
const sessions = {
  daily_mix: { name: "Daily Mix", kind: "mix", mixFinish: 0 },
  vocab: { name: "Vocab", kind: "deck", decks: [DECK], bothWays: true, mixInAt: "every_other_day", handOffAt: "bi_weekly", passes: 3 },
  facts: { name: "Facts", kind: "deck", decks: ["Demo Facts", "Demo Words"], mixInAt: "every_other_day", handOffAt: "bi_weekly", passes: 2 }
};
const mixSes = { sid: "daily_mix", name: "Daily Mix", kind: "mix", passes: 2 };
const keyOf = it => it.subject + "|" + it.prompt;
const dupKeys = list => { const c = {}; list.forEach(it => { c[keyOf(it)] = (c[keyOf(it)] || 0) + 1; }); return Object.keys(c).filter(k => c[k] > 1); };
function engineWith(eng, items, mixFinish) {
  const E = load(eng); const ses = JSON.parse(JSON.stringify(sessions)); if (mixFinish != null) ses.daily_mix.mixFinish = mixFinish;
  E.set("kid_a", items); E.set("kid_a_sessions", ses); return E;
}

console.log("\n# 1. the live case, replayed on the demo family — the OLD engine shows a card twice");
{
  const E = engineWith(oldEngine, family());
  const p = E.mstPile("kid_a", "daily_mix", PN, null);
  const d = dupKeys(p.reviews);
  ok("old Mix: every vocab word + its twin, and the duplicate-data pair, are drawn (9 deck+prompts twice)", d.length === 9, d);
  // walk the old sitting: miss one card, it comes back
  const st = E.mstSittingInit(p, mixSes, {}); const k = st.queue[0];
  E.mstAnswer(st, k, "again");
  ok("old Mix: a missed card goes back in line", st.queue.indexOf(k) === st.queue.length - 1 && !st.cards[k].done);
}

console.log("\n# 2. the fixed Mix: one card per deck + prompt");
{
  const E = engineWith(engine, family());
  const p = E.mstPile("kid_a", "daily_mix", PN, null);
  const ids = p.reviews.map(i => i.id);
  ok("no deck + prompt twice in the sitting", dupKeys(p.reviews).length === 0, dupKeys(p.reviews));
  ok("every word is still in it once (8 vocab + 2+2 + 3+3 + the other deck's la casa = 11)", p.reviews.length === 11 && p.mixLeft === 11, ids);
  ok("on a tie the base card is the one drawn, its twin waits", ids.indexOf("kida_el_perro") >= 0 && ids.indexOf("kida_el_perro_p") === -1, ids);
  ok("an older twin is drawn ahead of its base (oldest due first)", ids.indexOf("kida_el_sol_p") >= 0 && ids.indexOf("kida_el_sol") === -1, ids);
  ok("duplicate data: the older of the two live items is drawn, once", ids.indexOf("kida_dup2") >= 0 && ids.indexOf("kida_dup1") === -1);
  ok("the same prompt in ANOTHER deck is a different card — kept", ids.indexOf("kida_other") >= 0 && ids.indexOf("kida_la_casa") >= 0);
  ok("the learning card is never the Mix's", ids.indexOf("kida_lrn") === -1);
  const np = family().concat([{ id: "kida_np1", subject: "Demo Facts", status: "active", tier: "weekly", next_due: PN }, { id: "kida_np2", subject: "Demo Facts", status: "active", tier: "weekly", next_due: PN }]);
  const npIds = engineWith(engine, np).mstPile("kid_a", "daily_mix", PN, null).reviews.map(i => i.id);
  ok("two cards with NO prompt are not one card — both drawn", npIds.indexOf("kida_np1") >= 0 && npIds.indexOf("kida_np2") >= 0, npIds);
  const p20 = engineWith(engine, family(), 5).mstPile("kid_a", "daily_mix", PN, null);
  ok("with a finish line (5) the sitting is 5 distinct cards and mixLeft counts each card once (11)", p20.reviews.length === 5 && dupKeys(p20.reviews).length === 0 && p20.mixLeft === 11, [p20.reviews.length, p20.mixLeft]);
}

console.log("\n# 3. Keep going and tomorrow — the waiting twin");
{
  const items = family(); const E = engineWith(engine, items);
  const first = E.mstPile("kid_a", "daily_mix", PN, null).reviews;
  const log = { items: first.map(i => ({ id: i.id, name: i.prompt, deck: i.subject, result: "c" })) };
  const more = E.mstPile("kid_a", "daily_mix", PN, log);
  ok("Keep going after the first save: no twin of a card scored today, nothing left", more.reviews.length === 0 && more.mixLeft === 0, more.reviews.map(i => i.id));
  // tomorrow: the graded cards moved up the ladder; the twins that waited are still due → each comes, once
  first.forEach(i => { const it = items.find(x => x.id === i.id); it.next_due = PN + 5; });
  const next = E.mstPile("kid_a", "daily_mix", PN + 1, null).reviews.map(i => i.id);
  ok("next day: the twins that waited are drawn (7 twins + el sol's base + 2+2's other copy)", next.length === 9 && next.indexOf("kida_el_perro_p") >= 0 && next.indexOf("kida_el_sol") >= 0 && next.indexOf("kida_dup1") >= 0, next);
}

console.log("\n# 4. the fixed Mix sitting: each card asked once, a miss is scored ✗ and done");
{
  const E = engineWith(engine, family());
  const p = E.mstPile("kid_a", "daily_mix", PN, null);
  const st = E.mstSittingInit(p, mixSes, {});
  ok("every Mix card carries the once flag", Object.keys(st.cards).every(k => st.cards[k].once === true));
  const seen = {}; let n = 0, cur;
  while ((cur = E.mstCurrent(st)) && n < 100) { seen[cur.key] = (seen[cur.key] || 0) + 1; E.mstAnswer(st, cur.key, n % 3 === 0 ? "again" : "good"); n++; }
  ok("a walk with every third card missed: 11 answers, every card shown exactly once", n === 11 && Object.keys(seen).length === 11 && Object.values(seen).every(v => v === 1), seen);
  const o = E.mstOutcomes(st);
  ok("the misses are scored ✗ (m), the rest ✓ (c) — 4 m, 7 c", Object.values(o.scores).filter(v => v === "m").length === 4 && Object.values(o.scores).filter(v => v === "c").length === 7, o.scores);
  ok("the missed card still counts as a miss for the games list (misses = 1)", Object.keys(st.cards).filter(k => st.cards[k].misses === 1).length === 4);
  ok("progress: nothing left, 4 'again'", E.mstProgress(st).remaining === 0 && E.mstProgress(st).againCount === 4);
}

console.log("\n# 5. kept rules — outside the Mix nothing changes");
{
  const E = engineWith(engine, family());
  const vocab = { sid: "vocab", kind: "deck", decks: [DECK], bothWays: true, passes: 3 };
  const st = E.mstSittingInit({ reviews: [family()[0], family()[1]], learning: [{ id: "kida_lrn", subject: DECK, prompt: "el agua", tally_dots: 0 }], newNames: [] }, vocab, {});
  ok("deck session: no once flag on its cards", Object.keys(st.cards).every(k => st.cards[k].once === undefined));
  ok("deck session: the twin is still typed (MSTTWINMODE), the base is not", st.cards["r:kida_el_perro_p"].mode === "type" && st.cards["r:kida_el_perro"].mode === undefined);
  E.mstAnswer(st, "r:kida_el_perro", "again");
  ok("deck session: a missed review still goes back in line (re-ask kept)", st.queue[st.queue.length - 1] === "r:kida_el_perro" && !st.cards["r:kida_el_perro"].done);
  E.mstAnswer(st, "l:kida_lrn", "again");
  ok("learning card: a miss still goes back in line until its right answers (re-ask kept)", st.queue[st.queue.length - 1] === "l:kida_lrn" && st.cards["l:kida_lrn"].goods === 0);
  E.mstAnswer(st, "l:kida_lrn", "good");
  ok("learning card: one right is not enough when passes is 3", !st.cards["l:kida_lrn"].done && st.queue.indexOf("l:kida_lrn") >= 0);
}

console.log("\n# 6. house rules");
const blk = engine.slice(ms, me);
ok("the block writes nothing (no db / ref / set / update)", !/\bdb\b|\.ref\(|\.set\(|\.update\(/.test(blk));
ok("no family names in the block", !/lincoln|ellis|lucy|julian|adrienne/i.test(blk.replace(/\(Lincoln\)/, "")));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") === -1);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
