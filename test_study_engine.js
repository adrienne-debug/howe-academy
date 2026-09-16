// Node test harness for mst_engine.js — no deps.
const fs = require("fs"), path = require("path");

const SRC_PATH = process.env.MST_SRC || path.join(__dirname, "index.html");
const src = fs.readFileSync(SRC_PATH, "utf8");
const startMarker = "// ── MST_ENGINE_START ──";
const endMarker = "// ── MST_ENGINE_END ──";
const si = src.indexOf(startMarker);
const ei = src.indexOf(endMarker);
if (si === -1 || ei === -1) throw new Error("markers not found in " + SRC_PATH);
const block = src.slice(si, ei);

const stubs = `
var masteryData = {};
var masteryKid = null;

var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};

function mastDrillSettings(){
  const kid = masteryKid || "julian";
  const s = masteryData[kid+"_settings"] || {};
  const defaultLadder = ["every_other_day","weekly","bi_weekly","monthly","graduated"];
  return { ladder: s.ladder || defaultLadder };
}

function mastIsDue(item, pn){
  const iv = MAST_TIER_INT[item.tier || "daily"];
  if (iv == null) return false;
  if (item.next_due != null && iv > 1) return pn >= item.next_due;
  const cy = item.cycle || 1;
  return (pn - 1) % iv === (cy - 1) % iv;
}

function mastIsParked(i){ return !!(i && i.status === "parked"); }

function mastIsNeverDrill(item){
  const kt = item && item.knowledge_type;
  return kt === "concept" || kt === "transfer";
}

function mastFullBank(kidArg){
  const kid = kidArg || masteryKid || "julian";
  const base = {};
  const builtIn = (masteryData.__banks && masteryData.__banks[kid]) || {};
  Object.keys(builtIn).forEach(k => { base[k] = builtIn[k].slice(); });
  let custom = masteryData[kid+"_custom_items"] || [];
  if (!Array.isArray(custom)) custom = Object.values(custom);
  custom.forEach(ci => {
    if (!ci) return;
    if (!base[ci.cat]) base[ci.cat] = [];
    if (base[ci.cat].indexOf(ci.name) === -1) base[ci.cat].push(ci.name);
  });
  return base;
}
`;

const factory = new Function(stubs + block + `
return {
  mstSessions, mstTierIdx, mstOwns, mstMixOwns, mstMixSession, mstOwnedIds, mstDeckInSession, mstPile,
  mstSittingInit, mstAnswer, mstCurrent, mstProgress, mstOutcomes,
  mstSerialize, mstRestore,
  setMasteryData(d){ masteryData = d; },
  setMasteryKid(k){ masteryKid = k; },
  getMasteryData(){ return masteryData; }
};
`);

const M = factory();

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("PASS " + label); }
  else { fail++; console.log("FAIL " + label); }
}
function deepEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function setEq(setA, arrB) {
  const a = Array.from(setA).sort();
  const b = arrB.slice().sort();
  return deepEq(a, b);
}

// ---------------------------------------------------------------------
// (a) ownership
// ---------------------------------------------------------------------
(function testOwnership() {
  const ladder = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
  const session = { sid: "s1", decks: ["Math Facts", "Vocabulary"], mixInAt: "weekly", who: "solo", newPerDay: 5, passes: 2, order: "bank", audio: "front" };

  const introItem = { id: 1, subject: "Math Facts", status: "introduction", tier: null };
  ok(M.mstOwns(session, introItem, ladder) === true, "a: intro item owned");

  const eodItem = { id: 2, subject: "Math Facts", status: "active", tier: "every_other_day" };
  ok(M.mstOwns(session, eodItem, ladder) === true, "a: every_other_day owned (below mixInAt weekly)");

  const weeklyItem = { id: 3, subject: "Math Facts", status: "active", tier: "weekly" };
  ok(M.mstOwns(session, weeklyItem, ladder) === false, "a: weekly NOT owned when mixInAt is weekly");

  const parkedItem = { id: 4, subject: "Math Facts", status: "parked", tier: "every_other_day" };
  ok(M.mstOwns(session, parkedItem, ladder) === false, "a: parked item not owned");

  const conceptItem = { id: 5, subject: "Math Facts", status: "active", tier: "every_other_day", knowledge_type: "concept" };
  ok(M.mstOwns(session, conceptItem, ladder) === false, "a: concept (never-drill) item not owned");

  const outsideDeckItem = { id: 6, subject: "Science", status: "active", tier: "every_other_day" };
  ok(M.mstOwns(session, outsideDeckItem, ladder) === false, "a: item outside session decks not owned");

  const legacyDailyItem = { id: 7, subject: "Math Facts", status: "active", tier: "daily" };
  ok(M.mstOwns(session, legacyDailyItem, ladder) === true, "a: legacy tier 'daily' (off-ladder, snaps to 0) owned");
})();

// ---------------------------------------------------------------------
// (b) mstOwnedIds across two sessions
// ---------------------------------------------------------------------
(function testOwnedIds() {
  M.setMasteryData({
    julian_settings: { ladder: ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"] },
    julian_sessions: {
      sA: { name: "A", decks: ["Letters"], mixInAt: "weekly" },
      sB: { name: "B", decks: ["Numbers"], mixInAt: "bi_weekly" }
    },
    julian: [
      { id: "i1", subject: "Letters", status: "introduction" },
      { id: "i2", subject: "Letters", status: "active", tier: "every_other_day" },
      { id: "i3", subject: "Letters", status: "active", tier: "weekly" }, // not owned by sA (mixInAt weekly)
      { id: "i4", subject: "Numbers", status: "active", tier: "weekly" }, // owned by sB (below bi_weekly)
      { id: "i5", subject: "Numbers", status: "active", tier: "bi_weekly" }, // not owned by sB
      { id: "i6", subject: "Shapes", status: "active", tier: "every_other_day" } // no session owns Shapes
    ]
  });
  const owned = M.mstOwnedIds("julian");
  ok(setEq(owned, ["i1", "i2", "i4"]), "b: mstOwnedIds across two sessions == {i1,i2,i4}");
})();

// ---------------------------------------------------------------------
// (c) pile
// ---------------------------------------------------------------------
(function testPile() {
  const bankNames = [];
  for (let i = 1; i <= 12; i++) bankNames.push("N" + i);

  M.setMasteryData({
    __banks: { julian: { Numbers: bankNames } },
    julian_settings: { ladder: ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"] },
    julian_sessions: {
      s1: { name: "S1", decks: ["Numbers"], mixInAt: "weekly", newPerDay: 5, passes: 2 }
    },
    julian: [
      { id: "m1", subject: "Numbers", status: "active", tier: "every_other_day", prompt: "N1", next_due: null, cycle: 1 },
      { id: "m2", subject: "Numbers", status: "active", tier: "every_other_day", prompt: "N2", next_due: null, cycle: 2 }, // not due on pn=1 (cycle 2, iv 2 -> due when (pn-1)%2===1)
      { id: "m3", subject: "Numbers", status: "introduction", prompt: "N3" }
    ]
  });

  // pn=1: m1 (cycle1,iv2) due when (0)%2===0 -> true. m2 (cycle2) due when 0%2===1 -> false.
  const pile1 = M.mstPile("julian", "s1", 1, null);
  ok(pile1.reviews.length === 1 && pile1.reviews[0].id === "m1", "c: reviews only include due items");
  ok(pile1.learning.length === 1 && pile1.learning[0].id === "m3", "c: learning includes introduction item");
  // bank has 12 names; N1,N2 already minted as items -> 10 unminted names, N3 also minted (introduction) -> excluded too.
  // unminted in bank order: N4..N12 (skipping N1,N2,N3) -> first 5 = N4,N5,N6,N7,N8
  const expectedNew = ["N4", "N5", "N6", "N7", "N8"];
  ok(deepEq(pile1.newNames.map(n => n.name), expectedNew), "c: 5 new names, next unminted in bank order");

  // todayLog: N4 already shown (new), m3 already shown (learning) -> excluded, newPerDay reduced by 1 shown-new
  const todayLog = { items: [{ name: "N4", result: "shown" }, { id: "m3", result: "shown" }] };
  const pile2 = M.mstPile("julian", "s1", 1, todayLog);
  ok(pile2.learning.length === 0, "c: learning excludes shown-today items");
  // newPerDay 5 - 1(shown new) = 4 more names, excluding N4 (already logged) -> N5,N6,N7,N8
  ok(deepEq(pile2.newNames.map(n => n.name), ["N5", "N6", "N7", "N8"]), "c: new excludes logged names and reduces count by shown-new");
})();

// ---------------------------------------------------------------------
// (d) sitting state machine
// ---------------------------------------------------------------------
(function testSitting() {
  const session = { passes: 2 };

  // review: Again then Good -> done, first "again" -> score "m"
  {
    const pile = { reviews: [{ id: "r1", subject: "Math", prompt: "3x3" }], learning: [], newNames: [] };
    let st = M.mstSittingInit(pile, session);
    st = M.mstAnswer(st, "r:r1", "again");
    ok(M.mstCurrent(st) !== null, "d: review still current after Again");
    st = M.mstAnswer(st, "r:r1", "good");
    const outc = M.mstOutcomes(st);
    ok(outc.scores["r1"] === "m", "d: review Again-then-Good scores 'm' (first answer sticks)");
    ok(M.mstProgress(st).done === 1 && M.mstProgress(st).remaining === 0, "d: review sitting done after Good");
  }

  // review: Good -> "c"
  {
    const pile = { reviews: [{ id: "r2", subject: "Math", prompt: "4x4" }], learning: [], newNames: [] };
    let st = M.mstSittingInit(pile, session);
    st = M.mstAnswer(st, "r:r2", "good");
    const outc = M.mstOutcomes(st);
    ok(outc.scores["r2"] === "c", "d: review Good scores 'c'");
  }

  // new card, passes 2: good,good -> done -> shownNew
  {
    const pile = { reviews: [], learning: [], newNames: [{ deck: "Numbers", name: "N9" }] };
    let st = M.mstSittingInit(pile, session);
    const key = "n:Numbers|N9";
    st = M.mstAnswer(st, key, "good");
    ok(st.cards[key].done === false, "d: new card not done after 1 good (passes=2)");
    st = M.mstAnswer(st, key, "good");
    ok(st.cards[key].done === true, "d: new card done after 2 goods");
    const outc = M.mstOutcomes(st);
    ok(outc.shownNew.length === 1 && outc.shownNew[0].name === "N9", "d: done new card appears in shownNew");
  }

  // good,again,good,good -> done (goods reset on again) — a card never lost
  {
    const pile = { reviews: [], learning: [], newNames: [{ deck: "Numbers", name: "N10" }] };
    let st = M.mstSittingInit(pile, session);
    const key = "n:Numbers|N10";
    st = M.mstAnswer(st, key, "good"); // goods=1
    st = M.mstAnswer(st, key, "again"); // goods reset to 0, requeued
    ok(st.cards[key].goods === 0 && st.cards[key].done === false, "d: goods reset on Again");
    ok(st.queue.indexOf(key) !== -1, "d: card requeued after Again, never lost");
    st = M.mstAnswer(st, key, "good"); // goods=1
    st = M.mstAnswer(st, key, "good"); // goods=2 -> done
    ok(st.cards[key].done === true, "d: card eventually done after good,again,good,good");
  }
})();

// ---------------------------------------------------------------------
// (e) FUZZ 3000 random sittings
// ---------------------------------------------------------------------
(function testFuzz() {
  function rnd(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let allOk = true;
  let firstFailReason = null;
  const RUNS = 3000;

  for (let run = 0; run < RUNS && allOk; run++) {
    const rng = rnd(run * 7919 + 13);
    const nReviews = Math.floor(rng() * 15);
    const nLearning = Math.floor(rng() * 15);
    const nNew = Math.floor(rng() * 10);
    const passes = 1 + Math.floor(rng() * 3);

    const pile = { reviews: [], learning: [], newNames: [] };
    for (let i = 0; i < nReviews; i++) pile.reviews.push({ id: "rv" + run + "_" + i, subject: "D", prompt: "p" + i });
    for (let i = 0; i < nLearning; i++) pile.learning.push({ id: "lr" + run + "_" + i, subject: "D", prompt: "p" + i });
    for (let i = 0; i < nNew; i++) pile.newNames.push({ deck: "D", name: "nw" + run + "_" + i });

    let st = M.mstSittingInit(pile, { passes });
    const totalCards = nReviews + nLearning + nNew;
    let steps = 0;
    let midSerialized = null, midProgress = null, midKey = null;
    const midStep = Math.floor(totalCards * 1.3 * rng());

    while (st.queue.length > 0 && steps < 10000) {
      // invariant: queue never contains a done key
      for (let qi = 0; qi < st.queue.length; qi++) {
        const c = st.cards[st.queue[qi]];
        if (!c || c.done) { allOk = false; firstFailReason = "run " + run + ": done/missing card in queue"; break; }
      }
      if (!allOk) break;
      // invariant: every key in cards is either done or in the queue exactly once
      const allKeys = Object.keys(st.cards);
      for (let ki = 0; ki < allKeys.length; ki++) {
        const k = allKeys[ki];
        const c = st.cards[k];
        const occurrences = st.queue.filter(q => q === k).length;
        if (c.done) {
          if (occurrences !== 0) { allOk = false; firstFailReason = "run " + run + ": done card still in queue"; break; }
        } else {
          if (occurrences !== 1) { allOk = false; firstFailReason = "run " + run + ": undone card occurs " + occurrences + " times"; break; }
        }
      }
      if (!allOk) break;

      const curKey = st.queue[0];
      const ans = rng() < 0.6 ? "good" : "again";
      st = M.mstAnswer(st, curKey, ans);
      steps++;

      if (steps === midStep && st.queue.length > 0) {
        midSerialized = M.mstSerialize(st);
        midProgress = M.mstProgress(st);
      }
    }
    if (!allOk) break;

    if (steps >= 10000) { allOk = false; firstFailReason = "run " + run + ": exceeded max steps (possible infinite loop)"; break; }

    // all cards end done
    const finalKeys = Object.keys(st.cards);
    for (let ki = 0; ki < finalKeys.length; ki++) {
      if (!st.cards[finalKeys[ki]].done) { allOk = false; firstFailReason = "run " + run + ": card not done at end"; break; }
    }
    if (!allOk) break;

    // outcomes count == done cards
    const outc = M.mstOutcomes(st);
    const doneCount = finalKeys.length; // all done at end
    const outcomeCount = Object.keys(outc.scores).length + outc.shownIds.length + outc.shownNew.length;
    if (outcomeCount !== doneCount) { allOk = false; firstFailReason = "run " + run + ": outcome count " + outcomeCount + " != done count " + doneCount; break; }

    // serialize/restore mid-sitting reproduces identical progress
    if (midSerialized) {
      const restored = M.mstRestore(midSerialized);
      const restoredProgress = M.mstProgress(restored);
      if (!deepEq(restoredProgress, midProgress)) { allOk = false; firstFailReason = "run " + run + ": restore progress mismatch"; break; }
      if (!deepEq(M.mstSerialize(restored), midSerialized)) { allOk = false; firstFailReason = "run " + run + ": restore roundtrip mismatch"; break; }
    }
  }

  ok(allOk, "e: FUZZ 3000 random sittings — invariants, all-done, outcome counts, serialize/restore" + (firstFailReason ? (" (" + firstFailReason + ")") : ""));
})();

// ---------------------------------------------------------------------
// (f) mstTierIdx snapping
// ---------------------------------------------------------------------
(function testTierIdxSnap() {
  const ladder = ["every_other_day", "weekly", "monthly", "graduated"]; // no every_third_day, no bi_weekly, no learned
  // every_third_day sits between every_other_day and weekly in MAST_TIER_ORDER -> snaps down to every_other_day (idx 0)
  ok(M.mstTierIdx("every_third_day", ladder) === 0, "f: every_third_day snaps down to every_other_day rung");
  // bi_weekly sits between weekly and monthly -> snaps down to weekly (idx 1)
  ok(M.mstTierIdx("bi_weekly", ladder) === 1, "f: bi_weekly snaps down to weekly rung");
  // learned sits between monthly and graduated -> snaps down to monthly (idx 2)
  ok(M.mstTierIdx("learned", ladder) === 2, "f: learned snaps down to monthly rung");
  // daily sits before every_other_day (nothing at-or-below) -> minimum 0
  ok(M.mstTierIdx("daily", ladder) === 0, "f: daily (below everything on ladder) snaps to minimum 0");
  // exact match still returns its own index
  ok(M.mstTierIdx("weekly", ladder) === 1, "f: exact ladder match returns its own index");
})();

// ---------------------------------------------------------------------
// (g) Daily Mix ownership — middle rungs interleaved, edges excluded
// ---------------------------------------------------------------------
(function testMixOwnership() {
  const ladder = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
  const deckSession = { sid: "d1", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" };
  const mixSession = { sid: "mx", kind: "mix" };
  const sessions = [deckSession, mixSession];

  const eodItem = { id: 1, subject: "German", status: "active", tier: "every_other_day" };
  ok(M.mstOwns(deckSession, eodItem, ladder) === true, "g: every_other_day deck-owned");
  ok(M.mstMixOwns(sessions, eodItem, ladder) === false, "g: every_other_day not mix-owned");

  const weeklyItem = { id: 2, subject: "German", status: "active", tier: "weekly" };
  ok(M.mstOwns(deckSession, weeklyItem, ladder) === false, "g: weekly not deck-owned");
  ok(M.mstMixOwns(sessions, weeklyItem, ladder) === true, "g: weekly mix-owned");

  const biWeeklyItem = { id: 3, subject: "German", status: "active", tier: "bi_weekly" };
  ok(M.mstOwns(deckSession, biWeeklyItem, ladder) === false, "g: bi_weekly not deck-owned");
  ok(M.mstMixOwns(sessions, biWeeklyItem, ladder) === false, "g: bi_weekly not mix-owned (goes to Mom's drill)");

  const monthlyItem = { id: 4, subject: "German", status: "active", tier: "monthly" };
  ok(M.mstOwns(deckSession, monthlyItem, ladder) === false, "g: monthly not deck-owned");
  ok(M.mstMixOwns(sessions, monthlyItem, ladder) === false, "g: monthly not mix-owned (goes to Mom's drill)");

  const introItem = { id: 5, subject: "German", status: "introduction" };
  ok(M.mstOwns(deckSession, introItem, ladder) === true, "g: introduction deck-owned");
  ok(M.mstMixOwns(sessions, introItem, ladder) === false, "g: introduction not mix-owned (status not active)");

  const outsideDeckItem = { id: 6, subject: "French", status: "active", tier: "weekly" };
  ok(M.mstMixOwns(sessions, outsideDeckItem, ladder) === false, "g: weekly card from a deck not in any session not mix-owned");

  const parkedWeeklyItem = { id: 7, subject: "German", status: "parked", tier: "weekly" };
  ok(M.mstMixOwns(sessions, parkedWeeklyItem, ladder) === false, "g: parked weekly not mix-owned");
})();

// ---------------------------------------------------------------------
// (h) mstOwnedIds only pulls middle-rung cards out of Mom's drill when a
//     mix session exists
// ---------------------------------------------------------------------
(function testOwnedIdsWithMix() {
  const baseData = {
    julian_settings: { ladder: ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"] },
    julian: [
      { id: "w1", subject: "German", status: "active", tier: "weekly" }
    ]
  };

  M.setMasteryData(Object.assign({}, baseData, {
    julian_sessions: {
      d1: { name: "German", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" }
    }
  }));
  ok(!M.mstOwnedIds("julian").has("w1"), "h: weekly card NOT owned when no mix session exists");

  M.setMasteryData(Object.assign({}, baseData, {
    julian_sessions: {
      d1: { name: "German", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" },
      mx: { name: "Mix", kind: "mix" }
    }
  }));
  ok(M.mstOwnedIds("julian").has("w1"), "h: weekly card IS owned when a mix session exists");
})();

// ---------------------------------------------------------------------
// (i) mix pile: interleaved, deterministically shuffled, excludes
//     already-scored-today cards
// ---------------------------------------------------------------------
(function testMixPile() {
  const ladder = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
  M.setMasteryData({
    julian_settings: { ladder },
    julian_sessions: {
      dGerman: { name: "German", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" },
      dSpanish: { name: "Spanish", kind: "deck", decks: ["Spanish"], mixInAt: "weekly", handOffAt: "bi_weekly" },
      mx: { name: "Mix", kind: "mix" }
    },
    julian: [
      { id: "gw1", subject: "German", status: "active", tier: "weekly", next_due: 1 },
      { id: "gw2", subject: "German", status: "active", tier: "weekly", next_due: 1 },
      { id: "sw1", subject: "Spanish", status: "active", tier: "weekly", next_due: 1 }
    ]
  });

  const pile1a = M.mstPile("julian", "mx", 3, null);
  ok(setEq(new Set(pile1a.reviews.map(r => r.id)), ["gw1", "gw2", "sw1"]), "i: mix pile reviews include all three due weekly cards from both decks");
  ok(pile1a.learning.length === 0, "i: mix pile learning always empty");
  ok(pile1a.newNames.length === 0, "i: mix pile newNames always empty");

  const pile1b = M.mstPile("julian", "mx", 3, null);
  ok(deepEq(pile1a.reviews.map(r => r.id), pile1b.reviews.map(r => r.id)), "i: mix pile order deterministic for same pn+sid");

  const ordersByPn = [];
  for (let pn = 1; pn <= 5; pn++) {
    ordersByPn.push(M.mstPile("julian", "mx", pn, null).reviews.map(r => r.id).join(","));
  }
  ok(new Set(ordersByPn).size > 1, "i: mix pile order differs across pn 1..5 at least once (interleaved, not grouped by deck)");

  const todayLog = { items: [{ id: "gw1", result: "c" }] };
  const pile2 = M.mstPile("julian", "mx", 3, todayLog);
  ok(!pile2.reviews.some(r => r.id === "gw1"), "i: mix pile excludes an id already scored today");
  ok(pile2.reviews.length === 2, "i: mix pile has 2 remaining reviews after excluding the scored id");
})();

// ---------------------------------------------------------------------
// (j) handOffAt <= mixInAt -> mix owns nothing for that session
// ---------------------------------------------------------------------
(function testHandOffAtMixInEdge() {
  const ladder = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
  const deckSessionBelow = { sid: "d1", kind: "deck", decks: ["German"], mixInAt: "bi_weekly", handOffAt: "weekly" }; // handOff before mixIn
  const deckSessionEqual = { sid: "d2", kind: "deck", decks: ["Spanish"], mixInAt: "weekly", handOffAt: "weekly" }; // handOff == mixIn
  const sessions = [deckSessionBelow, deckSessionEqual, { sid: "mx", kind: "mix" }];

  ["every_other_day", "weekly", "bi_weekly", "monthly"].forEach(tier => {
    const itemA = { id: "a_" + tier, subject: "German", status: "active", tier: tier };
    ok(M.mstMixOwns(sessions, itemA, ladder) === false, "j: handOffAt < mixInAt -> mix owns nothing (" + tier + ")");
    const itemB = { id: "b_" + tier, subject: "Spanish", status: "active", tier: tier };
    ok(M.mstMixOwns(sessions, itemB, ladder) === false, "j: handOffAt == mixInAt -> mix owns nothing (" + tier + ")");
  });
})();

// ---------------------------------------------------------------------
// (k) FUZZ 500 items — exactly one of {deck session, mix, Mom's drill}
//     owns every active, non-parked item of a session deck
// ---------------------------------------------------------------------
(function testMixPartitionFuzz() {
  function rnd(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = rnd(20260915);
  const ladder = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
  const tiers = ["daily", "every_other_day", "every_third_day", "weekly", "bi_weekly", "monthly", "learned", "graduated"];

  const nDeckSessions = 1 + Math.floor(rng() * 3); // 1..3
  const deckSessions = [];
  for (let i = 0; i < nDeckSessions; i++) {
    const mixInIdx = Math.floor(rng() * (ladder.length - 1)); // 0..len-2
    const handOffIdx = mixInIdx + 1 + Math.floor(rng() * (ladder.length - 1 - mixInIdx)); // strictly > mixInIdx
    deckSessions.push({
      sid: "d" + i,
      kind: "deck",
      decks: ["Deck" + i],
      mixInAt: ladder[mixInIdx],
      handOffAt: ladder[handOffIdx]
    });
  }
  const sessions = deckSessions.concat([{ sid: "mx", kind: "mix" }]);

  let allOk = true;
  let failReason = null;
  let checked = 0;
  for (let n = 0; n < 500 && allOk; n++) {
    const di = Math.floor(rng() * nDeckSessions);
    const deckSession = deckSessions[di];
    const tier = tiers[Math.floor(rng() * tiers.length)];
    const statusRoll = rng();
    const status = statusRoll < 0.15 ? "parked" : (statusRoll < 0.3 ? "introduction" : "active");
    const item = { id: "f" + n, subject: deckSession.decks[0], status: status, tier: tier };

    // The exactly-one partition is only claimed for active, non-parked items.
    if (status !== "active") continue;
    checked++;

    const deckOwned = M.mstOwns(deckSession, item, ladder);
    const mixOwned = M.mstMixOwns(sessions, item, ladder);
    const itemIdx = M.mstTierIdx(tier, ladder);
    const handOffIdx = M.mstTierIdx(deckSession.handOffAt, ladder);
    const momOwned = itemIdx >= handOffIdx;

    const ownedCount = (deckOwned ? 1 : 0) + (mixOwned ? 1 : 0) + (momOwned ? 1 : 0);
    if (ownedCount !== 1) {
      allOk = false;
      failReason = "item " + n + " (tier=" + tier + ") owned by " + ownedCount +
        " of {deck,mix,mom}: deckOwned=" + deckOwned + " mixOwned=" + mixOwned + " momOwned=" + momOwned;
    }
  }
  ok(allOk && checked > 0, "k: FUZZ 500 items (" + checked + " active) — exactly one of {deck session, mix, Mom's drill} owns each" + (failReason ? (" (" + failReason + ")") : ""));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
