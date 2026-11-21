/*
 * test_study_comeback.js — COMEBACK20 (her yes 2026-11-21): inside a study sitting, a card that needs another look comes back
 * ~20 cards later (MST_COMEBACK_GAP) instead of at the end of the whole line; fewer than 20 left → the end, as before.
 * Runs the REAL study engine sliced from index.html (MST_ENGINE_START..END) in a vm, on made-up cards. No database.
 * The OLD engine is the same slice with the COMEBACK20 block taken out — mstAnswer's guard then falls back to the old push.
 *   run:  node test_study_comeback.js
 */
const vm = require("vm");
const src = require("./test_src.js")();
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };

const si = src.indexOf("// ── MST_ENGINE_START ──"), ei = src.indexOf("// ── MST_ENGINE_END ──");
const engine = src.slice(si, ei);
const bA = engine.indexOf("// COMEBACK20_START"), bZ = engine.indexOf("// COMEBACK20_END");
const blk = engine.slice(bA, bZ);
const oldEngine = engine.slice(0, bA) + engine.slice(bZ + "// COMEBACK20_END\n".length);
function load(code) { const ctx = { console, Math, JSON, Date }; vm.createContext(ctx); vm.runInContext(code, ctx); return ctx; }
const NEW = load(engine), OLD = load(oldEngine);

console.log("\n# 0. the block");
ok("COMEBACK20 markers once each, inside the study engine", bA > 0 && bZ > bA && src.split("// COMEBACK20_START").length === 2 && src.split("// COMEBACK20_END").length === 2);
ok("one named constant, 20, inside the tested 10–30 range", /const MST_COMEBACK_GAP = 20;/.test(blk) && NEW.mstComeback.length === 4 && vm.runInContext("MST_COMEBACK_GAP", NEW) === 20);
ok("the comment cites her yes 2026-11-21 and the research note", blk.indexOf("2026-11-21") > 0 && blk.indexOf("project_howe_sitting_size_research.md") > 0);
ok("the comment says 20 is a choice, not a research number", /not a number from the research/.test(blk));
ok("the old-engine slice really is the old code (no helper)", typeof OLD.mstComeback === "undefined" && oldEngine.indexOf("MST_COMEBACK_GAP") === -1);
const ansSrc = engine.slice(engine.indexOf("function mstAnswer("), engine.indexOf("function mstCurrent("));
ok("mstAnswer's only plain push is the guard's fallback", ansSrc.split("state.queue.push(key)").length === 2 && ansSrc.split("_back();").length === 4);
ok("MIXONCE: a Mix card's miss still ends the card (no re-queue)", /if \(ans === "good" \|\| card\.once\) \{[^\n]*\n\s*card\.done = true;/.test(ansSrc));

console.log("\n# 1. the placement helper (pure)");
{
  const L = Array.from({ length: 30 }, (_, i) => "c" + i);
  const out = NEW.mstComeback(L, 0, "X");
  ok("given the line and position 0 → 20 cards ahead of it", out.indexOf("X") === 20 && out.length === 31);
  ok("pure: the line passed in is not changed", L.length === 30 && L.indexOf("X") === -1);
  ok("the order of the other cards is kept", out.filter(k => k !== "X").join() === L.join());
  ok("position counts: from position 5 → 25", NEW.mstComeback(L, 5, "X").indexOf("X") === 25);
  ok("exactly 20 left → the end (same place as before)", NEW.mstComeback(L.slice(0, 20), 0, "X").indexOf("X") === 20);
  ok("fewer than 20 left → the end, as before", NEW.mstComeback(L.slice(0, 7), 0, "X").join() === L.slice(0, 7).concat("X").join());
  ok("an empty line → just the card", NEW.mstComeback([], 0, "X").join() === "X");
  ok("a gap can be passed (10)", NEW.mstComeback(L, 0, "X", 10).indexOf("X") === 10);
}

// a made-up sitting: R reviews, L learning, N new cards
function pile(R, L, N, opts) {
  opts = opts || {};
  const p = { reviews: [], learning: [], newNames: [] };
  for (let i = 0; i < R; i++) p.reviews.push({ id: "rv" + i, subject: "Demo Deck", prompt: "rev " + i });
  for (let i = 0; i < L; i++) p.learning.push({ id: "ln" + i, subject: "Demo Deck", prompt: "lrn " + i, tally_dots: i % 3 });
  for (let i = 0; i < N; i++) p.newNames.push({ deck: "Demo Deck", name: "new " + i });
  return p;
}
const deckSes = { sid: "demo", name: "Demo", kind: "deck", passes: 2 };

console.log("\n# 2. in a 90-card sitting");
{
  const st = NEW.mstSittingInit(pile(0, 90, 0), deckSes, {});
  const k = st.queue[0];
  NEW.mstAnswer(st, k, "good");
  ok("a first-right learning card comes back with 20 cards ahead of it (not 89)", st.queue.indexOf(k) === 20 && st.queue.length === 90 && !st.cards[k].done && st.cards[k].goods === 1);
  const st2 = NEW.mstSittingInit(pile(0, 90, 0), deckSes, {});
  const k2 = st2.queue[0];
  NEW.mstAnswer(st2, k2, "again");
  ok("a miss the same: 20 ahead, its right answers start over", st2.queue.indexOf(k2) === 20 && st2.cards[k2].goods === 0 && st2.cards[k2].misses === 1);
  const so = OLD.mstSittingInit(pile(0, 90, 0), deckSes, {}); OLD.mstAnswer(so, so.queue[0], "good");
  ok("(the old engine sent it to the end: 89 cards ahead)", so.queue.indexOf("l:ln0") === 89);
  const sr = NEW.mstSittingInit(pile(60, 0, 0), deckSes, {}); const kr = sr.queue[0];
  NEW.mstAnswer(sr, kr, "again");
  ok("a deck sitting's missed review also comes back 20 ahead (it needs another look too)", sr.queue.indexOf(kr) === 20 && !sr.cards[kr].done);
  const s3 = NEW.mstSittingInit(pile(0, 90, 0), deckSes, {});
  const firsts = s3.queue.slice(0, 4);   // card i is shown again at look 4 + 17 + i = i + 21 → 20 cards between
  firsts.forEach(k => NEW.mstAnswer(s3, k, "good"));
  ok("four re-queued in a row keep their order, side by side, each with 20 cards between its looks",
    firsts.every((k, i) => s3.queue.indexOf(k) === 17 + i), firsts.map(k => s3.queue.indexOf(k)));
  const sp = NEW.mstSittingInit(pile(0, 30, 0), Object.assign({}, deckSes, { passes: 1 }), {});
  NEW.mstAnswer(sp, sp.queue[0], "good");
  ok("rights needed unchanged: passes 1 → done on the first right, no re-queue", sp.cards["l:ln0"].done && sp.queue.indexOf("l:ln0") === -1);
}

console.log("\n# 3. near the end of the line — as today");
{
  const st = NEW.mstSittingInit(pile(0, 12, 0), deckSes, {});
  const k = st.queue[0];
  NEW.mstAnswer(st, k, "good");
  ok("12-card sitting: the card goes to the end, as before", st.queue[st.queue.length - 1] === k);
  const so = OLD.mstSittingInit(pile(0, 12, 0), deckSes, {}); OLD.mstAnswer(so, so.queue[0], "good");
  ok("…the same line the old engine makes", st.queue.join() === so.queue.join());
  const s1 = NEW.mstSittingInit(pile(0, 1, 0), deckSes, {});
  NEW.mstAnswer(s1, s1.queue[0], "again");
  ok("the last card left comes straight back (the only back-to-back case, as before)", s1.queue.join() === "l:ln0");
}

// ── whole sittings, seeded: each card has its OWN answer stream, so it takes the same looks whatever the order ──
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function sit(E, size, seed, session, pRight) {
  const R = Math.round(size * 0.3), N = Math.round(size * 0.2), L = size - R - N;
  const st = E.mstSittingInit(pile(R, L, N), session || deckSes, {});
  const streams = {}, looks = {}, at = {}, gaps = [], seq = [];
  Object.keys(st.cards).forEach(k => { streams[k] = mulberry(hash(seed + "|" + k)); looks[k] = 0; });
  let step = 0, b2b = 0;
  while (st.queue.length && step < 100000) {
    const cur = E.mstCurrent(st); const k = cur.key;
    if (at[k] != null) { const g = step - at[k] - 1; gaps.push({ g }); if (g === 0 && st.queue.length > 1) b2b++; }
    at[k] = step; looks[k]++; seq.push(k);
    E.mstAnswer(st, k, streams[k]() < (pRight == null ? 0.75 : pRight) ? "good" : "again");
    step++;
  }
  const allDone = Object.keys(st.cards).every(k => st.cards[k].done);
  return { st, looks, gaps, seq, steps: step, allDone, b2b, out: E.mstOutcomes(st) };
}
const avg = a => a.length ? a.reduce((s, x) => s + x.g, 0) / a.length : 0;
const sameOutcomes = (a, b) => JSON.stringify(a.scores) === JSON.stringify(b.scores) && a.shownIds.slice().sort().join() === b.shownIds.slice().sort().join() && a.shownNew.map(x => x.name).sort().join() === b.shownNew.map(x => x.name).sort().join();

console.log("\n# 4. whole sittings, old vs new (seeded, 75% right)");
const SIM = [];
[5, 25, 90, 200].forEach(size => {
  for (let s = 0; s < 3; s++) {
    const seed = "s" + size + "_" + s;
    const o = sit(OLD, size, seed), n = sit(NEW, size, seed);
    const sameLooks = Object.keys(o.looks).every(k => o.looks[k] === n.looks[k]);
    const maxGap = n.gaps.reduce((m, x) => Math.max(m, x.g), 0);
    ok(size + " cards (" + seed + "): the sitting ends, every card done", o.allDone && n.allDone);
    ok(size + " cards (" + seed + "): every card gets exactly the same number of looks (" + n.steps + " looks in all)", sameLooks && o.steps === n.steps);
    ok(size + " cards (" + seed + "): same scores and same shown cards at the end", sameOutcomes(o.out, n.out));
    ok(size + " cards (" + seed + "): never more than 20 cards between a card's looks", maxGap <= 20, maxGap);
    ok(size + " cards (" + seed + "): no card back-to-back with itself unless it was the last one left", n.b2b === 0 && o.b2b === 0);
    if (size <= 20) ok(size + " cards: the order is exactly the old order (short sitting unchanged)", o.seq.join() === n.seq.join());
    SIM.push({ size, seed, looks: n.steps, cards: Object.keys(n.looks).length, oldAvg: avg(o.gaps), newAvg: avg(n.gaps), oldMax: o.gaps.reduce((m, x) => Math.max(m, x.g), 0), newMax: maxGap });
  }
});
console.log("\n  size  cards  looks  avg gap old → new   max gap old → new");
SIM.forEach(r => console.log("  " + String(r.size).padStart(4) + "  " + String(r.cards).padStart(5) + "  " + String(r.looks).padStart(5) + "  " + r.oldAvg.toFixed(1).padStart(7) + " → " + r.newAvg.toFixed(1).padEnd(7) + "  " + String(r.oldMax).padStart(7) + " → " + r.newMax));
{
  const big = SIM.filter(r => r.size >= 90);
  ok("90+ card sittings: the average gap drops from about half the line (40+) to under 20", big.every(r => r.oldAvg > 40 && r.newAvg > 14 && r.newAvg <= 20), big.map(r => [r.oldAvg.toFixed(1), r.newAvg.toFixed(1)]));
}

console.log("\n# 5. a sitting saved partway by the OLD build resumes in the new one");
{
  const seed = "resume90";
  const whole = sit(OLD, 90, seed);
  // the old build plays 40 looks and saves (Save partway: mstSerialize → JSON in the database / localStorage)
  let saved = null;
  const o = OLD.mstSittingInit(pile(27, 45, 18), deckSes, {});
  const streams = {}; Object.keys(o.cards).forEach(k => { streams[k] = mulberry(hash(seed + "|" + k)); });
  const looks = {}; Object.keys(o.cards).forEach(k => { looks[k] = 0; });
  for (let i = 0; i < 40; i++) { const k = OLD.mstCurrent(o).key; looks[k]++; OLD.mstAnswer(o, k, streams[k]() < 0.75 ? "good" : "again"); }
  saved = JSON.stringify(OLD.mstSerialize(o));
  const ns = NEW.mstRestore(saved);
  ok("the old saved state restores (queue, cards, passes)", Array.isArray(ns.queue) && ns.queue.length === o.queue.length && ns.passes === 2 && Object.keys(ns.cards).length === 90);
  ok("the first card after resume is the one the old build had next", NEW.mstCurrent(ns).key === OLD.mstCurrent(o).key);
  let steps = 0;
  while (ns.queue.length && steps < 10000) { const k = NEW.mstCurrent(ns).key; looks[k]++; NEW.mstAnswer(ns, k, streams[k]() < 0.75 ? "good" : "again"); steps++; }
  ok("it finishes: every card done", Object.keys(ns.cards).every(k => ns.cards[k].done));
  ok("same looks per card as playing it all in the old build", Object.keys(looks).every(k => looks[k] === whole.looks[k]));
  ok("same end-of-sitting outcomes (what is written is unchanged)", sameOutcomes(NEW.mstOutcomes(ns), whole.out));
  const ser = NEW.mstSerialize(ns);
  ok("the saved shape is unchanged (queue, cards, passes — no new fields)", Object.keys(ser).join() === "queue,cards,passes");
  const fields = new Set(); Object.keys(ns.cards).forEach(k => Object.keys(ns.cards[k]).forEach(f => fields.add(f)));
  ok("no new field on any card", [...fields].every(f => ["key", "kind", "id", "deck", "name", "goods", "first", "done", "misses", "mode", "passes"].indexOf(f) !== -1), [...fields]);
}

console.log("\n# 6. the Daily Mix — unchanged (her 11/12 rule: a Mix card is asked once)");
{
  const mixSes = { sid: "daily_mix", name: "Daily Mix", kind: "mix", passes: 2 };
  [20, 60].forEach(size => {
    const p = pile(size, 0, 0);
    const o = OLD.mstSittingInit(p, mixSes, {}), n = NEW.mstSittingInit(p, mixSes, {});
    const r = mulberry(hash("mix" + size)), answers = [];
    const seqO = [], seqN = [];
    while (n.queue.length) { const k = NEW.mstCurrent(n).key; seqN.push(k); const a = r() < 0.6 ? "good" : "again"; answers.push(a); NEW.mstAnswer(n, k, a); }
    let i = 0; while (o.queue.length) { const k = OLD.mstCurrent(o).key; seqO.push(k); OLD.mstAnswer(o, k, answers[i++]); }
    ok("Mix of " + size + ": every card shown exactly once, misses included", seqN.length === size && new Set(seqN).size === size);
    ok("Mix of " + size + ": the same order and scores as the old engine", seqN.join() === seqO.join() && JSON.stringify(NEW.mstOutcomes(n).scores) === JSON.stringify(OLD.mstOutcomes(o).scores));
  });
}

console.log("\n# 7. a harness that loads mstAnswer alone keeps the old push (guard)");
{
  const ctx = load(engine.slice(engine.indexOf("function mstAnswer("), engine.indexOf("function mstCurrent(")));
  const st = { queue: Array.from({ length: 40 }, (_, i) => "l:" + i), passes: 2, cards: {} };
  st.queue.forEach(k => { st.cards[k] = { key: k, kind: "learning", goods: 0, first: null, done: false }; });
  ctx.mstAnswer(st, "l:0", "good");
  ok("without the helper: the end of the line", st.queue[39] === "l:0");
}

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
