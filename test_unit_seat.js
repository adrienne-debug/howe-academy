// 🗓 UNITSEAT — a unit's opened cards start in a study session too (her approval 2026-11-19).
//   Runs the REAL MST_ENGINE (mstSessions, mstPile, mstUnitSeats), RS4K gate (mastBankEligible), PUTSCHED readers
//   (psFamUpto, psGateUpto), UNITTRACK and GATESTART over a made-up family:
//   · a kid on 📚 Daily Study (Decks at once 3) gets the unit deck's opened cards even though its name is last alphabetically
//     and three other decks would fill every seat; a full learning backlog can't starve it either
//   · cards on days the unit hasn't reached stay un-started; a book gate, a held deck, a gate that can't tell → as before
//   · a session kid with no unit gets exactly the pile he got before; a kid with no session still starts through GATESTART
//   · building the pile writes nothing (dry run or not)
//   run: node test_unit_seat.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const LADDER = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];

// A 4-day unit "Harvest": day n opens the cards with ch n. Four other decks, all alphabetically ahead of it.
const UNIT = () => ({ id: "harvest", title: "Harvest", track: { mode: "seq", days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Barns" }, { id: "d3", n: 3, t: "Mills" }, { id: "d4", n: 4, t: "Markets" }] } });
const LINES = () => [1, 2, 3, 4].map(n => ({ t: "Day " + n + " — x", n: 1, u: { id: "harvest", d: "d" + n } }));
const UNIT_BANK = () => [["plow", 1], ["sickle", 1], ["silo", 2], ["hayloft", 2], ["millstone", 3], ["flour", 3], ["stall", 4]].map(([name, ch]) => ({ cat: "Harvest", name, ch }));
const OTHER = ["Alder", "Birch", "Cedar", "Dogwood"];
function bank() { const b = UNIT_BANK(); OTHER.forEach(d => { for (let i = 1; i <= 8; i++) b.push({ cat: d, name: d + " w" + i }); }); return b; }
// learning: {deck: count} → cards still being learned
function learningItems(spec) { const out = []; Object.keys(spec || {}).forEach(d => { for (let i = 1; i <= spec[d]; i++) out.push({ id: d.toLowerCase() + i, subject: d, status: "introduction", tier: "daily", prompt: d + " w" + i, tally_dots: i % 3 }); }); return out; }

function world(o) {
  o = o || {}; const writes = [];
  const sess = o.session === null ? null : Object.assign({ name: "Daily Study", emoji: "📚", kind: "all", who: "solo", newPerDay: 5, focusDecks: 3, maxCards: 12, mixInAt: "weekly", handOffAt: "bi_weekly", order: "bank" }, o.session || {});
  const gate = o.gate === undefined ? { fam: "fb1", item: "it1" } : o.gate;
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite,
    masteryKid: null, MAST_BANK_MAP: {}, unitStudies: { harvest: UNIT() },
    masteryData: { pip: (o.items || []).slice(), pip_custom_items: bank(), pip_settings: { ladder: LADDER, auto_pull: true, cat_gate: gate ? { Harvest: gate } : {}, cat_hold: o.hold || {} }, pip_sessions: sess ? { ds: sess } : null },
    rulesData: { familyBlocks: o.noBlock ? {} : { fb1: { name: "Family Time", kids: ["pip", "wren"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], items: [{ key: "it1", name: "Harvest", track: { mode: "seq", list: LINES() } }] } } },
    famProgress: { fb1: { it1: { done: o.done == null ? 2 : o.done } } }, cbTodayISO: () => "2026-11-20",
    fbArr: x => Array.isArray(x) ? x : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]) : x),
    MAST_TIER_ORDER: ["daily", "every_other_day", "every_third_day", "weekly", "bi_weekly", "monthly", "learned", "graduated"],
    MAST_TIER_INT: { daily: 1, every_other_day: 2, every_third_day: 3, weekly: 5, bi_weekly: 10, monthly: 20, learned: 60, graduated: null },
    mastKnowledgeType: i => i && i.knowledge_type, famLessonMap: () => null,
    currData: { subjects: { pip: o.subjects || {} } }, lidStamped: () => true, lidDoneIdx: () => new Set(o.doneIdx || []),
    mastCustomDef: () => "", mastGetDef: () => "", mastGetVisual: () => null, MAST_ANIMAL_EMOJI: {},
    mastUniqueId: (items, b) => { const ids = new Set(items.map(i => i && i.id)); if (!ids.has(b)) return b; let n = 2; while (ids.has(b + "_" + n)) n++; return b + "_" + n; },
    db: { ref: p => ({ set: v => writes.push(["set " + p, v]), update: v => writes.push(["update " + p, v]), remove: () => writes.push(["remove " + p]), transaction: () => writes.push(["tx " + p]) }) },
    _dryRun: () => !!o.dry };
  vm.createContext(ctx);
  vm.runInContext(["famDefs", "famList", "famDoneN", "famTrack", "mastDrillSettings", "mastIntroMaxFor", "mastIsParked", "mastIsDue", "mastIsNeverDrill", "mastFullBank", "mastMintFromBank"].map(fn).join("\n") + "\n" +
    cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + cut("// ── RS4K_GATE_START", "// ── RS4K_GATE_END") + "\n" +
    cut("// GATESTART_START", "// GATESTART_END") + "\n" + cut("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──"), ctx);
  const pile = (pn, log) => ctx.mstPile("pip", "ds", pn || 1, log || null);
  // the same pile with the unit seat switched off = the pile as it was before this change
  const before = (pn, log) => { const keep = ctx.mstUnitSeats; ctx.mstUnitSeats = () => []; try { return pile(pn, log); } finally { ctx.mstUnitSeats = keep; } };
  return { ctx, writes, pile, before };
}
const unitNew = p => p.newNames.filter(n => n.deck === "Harvest").map(n => n.name);
const decksOf = p => [...new Set(p.learning.map(i => i.subject).concat(p.newNames.map(n => n.deck)))];
const fp = p => J({ r: p.reviews.map(i => i.id), l: p.learning.map(i => i.id), n: p.newNames });

console.log("── a study-session kid gets the unit's opened cards ──");
{
  // three decks already being learned fill all three seats; Harvest is last alphabetically
  const w = world({ items: learningItems({ Alder: 2, Birch: 2, Cedar: 2 }) });
  const was = w.before();
  ok("before: Harvest had no seat (the three started decks took them)", !decksOf(was).includes("Harvest") && unitNew(was).length === 0, decksOf(was));
  const p = w.pile();
  ok("now: Harvest has a seat beyond Decks at once", decksOf(p).includes("Harvest") && decksOf(p).length === 4, decksOf(p));
  ok("its opened cards start (days 1–2: plow, sickle, silo, hayloft)", J(unitNew(p)) === J(["plow", "sickle", "silo", "hayloft"]), unitNew(p));
  ok("the unit's cards come first among the new cards", p.newNames[0] && p.newNames[0].deck === "Harvest");
  ok("the learning cards he already had all still ride", p.learning.length === 6);
  ok("New cards a day is still respected (5)", p.newNames.length <= 5, p.newNames.length);
}
console.log("\n── cap and alphabet no longer starve it ──");
{
  // nothing started anywhere: before, the 3 seats went to Alder, Birch, Cedar (alphabetical)
  const w = world({ items: [] });
  const was = w.before();
  ok("before: alphabetical order handed the new cards to Alder, then Birch — none to Harvest", J(decksOf(was)) === J(["Alder", "Birch"]) && unitNew(was).length === 0, decksOf(was));
  const p = w.pile();
  ok("now: Harvest is seated first", J(unitNew(p)) === J(["plow", "sickle", "silo", "hayloft"]), p.newNames);
}
{
  // a full backlog: 3 decks × 4 learning = all 12 seats taken
  const w = world({ items: learningItems({ Alder: 4, Birch: 4, Cedar: 4 }) });
  const was = w.before();
  ok("before: a full sitting left no room for any new card", was.newNames.length === 0 && was.learning.length === 12);
  const p = w.pile();
  ok("now: the unit's seat brings its own share — its cards still start", unitNew(p).length === 4, p.newNames);
  ok("…and the backlog is not cut to make room", p.learning.length === 12);
}
{
  // Decks at once off (0): every deck already has a seat, but the alphabet decided who got New/day first
  const w = world({ items: [], session: { focusDecks: 0, maxCards: 0, newPerDay: 3 } });
  const was = w.before();
  ok("before (Decks at once off): New/day went to Alder first", unitNew(was).length === 0 && was.newNames[0].deck === "Alder", was.newNames);
  const p = w.pile();
  ok("now: the unit's opened cards come first", J(unitNew(p)) === J(["plow", "sickle", "silo"]), p.newNames);
}
{
  // once started, the unit keeps its seat while its cards are learned (even with nothing new opened)
  const items = learningItems({ Alder: 4, Birch: 4, Cedar: 4 }).concat(["plow", "sickle", "silo", "hayloft"].map((n, i) => ({ id: "h" + i, subject: "Harvest", status: "introduction", tier: "daily", prompt: n, tally_dots: 1 })));
  const w = world({ items });
  const p = w.pile();
  ok("its cards being learned keep their seat (4 Harvest learning cards ride)", p.learning.filter(i => i.subject === "Harvest").length === 4, p.learning.map(i => i.subject));
  ok("no new Harvest card while its share is full", unitNew(p).length === 0);
}
console.log("\n── cards the unit hasn't opened stay un-started ──");
{
  const w = world({ items: [], session: { maxCards: 0, focusDecks: 3, newPerDay: 20 } });
  let p = w.pile();
  ok("days 3–4 cards never appear (millstone, flour, stall)", !unitNew(p).some(n => ["millstone", "flour", "stall"].includes(n)), unitNew(p));
  w.ctx.famProgress.fb1.it1.done = 3; p = w.pile();
  ok("Mom checks day 3 → millstone and flour open", unitNew(p).includes("millstone") && unitNew(p).includes("flour") && !unitNew(p).includes("stall"), unitNew(p));
  w.ctx.famProgress.fb1.it1.done = 0;
  const p0 = w.pile(), b0 = w.before();
  ok("nothing opened yet → no seat, the pile is exactly as before", fp(p0) === fp(b0));
}
console.log("\n── everyone else is left as before ──");
{
  const items = learningItems({ Alder: 2, Birch: 3 });
  const w = world({ items, gate: null });
  ok("no unit gate → exactly the pile from before", fp(w.pile()) === fp(w.before()) && fp(w.pile(3)) === fp(w.before(3)));
  const book = world({ items, gate: { subject: "bk" }, subjects: { bk: { lessonSeq: ["Lesson 1: a", "Lesson 2: b"] } } });
  ok("a book gate (not a unit) → exactly the pile from before", fp(book.pile()) === fp(book.before()));
  const unitSub = world({ items, gate: { subject: "hv" }, subjects: { hv: { unit: { id: "harvest" }, lessonSeq: ["Day 1 — Fields", "Day 2 — Barns", "Day 3 — Mills"] } }, doneIdx: [0] });
  ok("a one-kid unit subject ({subject} with .unit) gets the seat too — only day 2's cards and before", J(unitNew(unitSub.pile())) === J(["plow", "sickle", "silo", "hayloft"]), unitNew(unitSub.pile()));
  const gone = world({ items, noBlock: true });
  ok("the gate can't tell (Family Time item gone) → as before, never the whole bank", fp(gone.pile()) === fp(gone.before()));
  const held = world({ items, hold: { Harvest: true } });
  ok("a held deck → as before", fp(held.pile()) === fp(held.before()));
}
{
  // a kid with no study session: GATESTART starts the opened cards on a drill save, as today
  const w = world({ items: [], session: null });
  const items = [], minted = []; w.ctx.masteryKid = "pip";
  w.ctx.mastGateStart("pip", items, minted, w.ctx.mastDrillSettings());
  ok("no session → GATESTART still starts the unit's opened cards (up to its cap of 3)", J(minted.map(i => i.prompt)) === J(["plow", "sickle", "silo"]), minted.map(i => i.prompt));
  ok("no session → mstUnitSeats has nothing to seat", J(w.ctx.mstUnitSeats("pip", { decks: [] }, [], {}, new Set(), {})) === "[]");
}
console.log("\n── reads only ──");
{
  const dry = world({ items: [], dry: true }); dry.pile(); dry.pile(2);
  ok("dry run: building the pile writes nothing", dry.writes.length === 0, dry.writes);
  const live = world({ items: [] }); live.pile();
  ok("live: building the pile writes nothing either (cards are made when the sitting is saved)", live.writes.length === 0, live.writes);
}
{
  // a card already shown today isn't offered twice
  const w = world({ items: [] });
  const p = w.pile(1, { items: [{ name: "plow", deck: "Harvest", result: "shown" }] });
  ok("a unit card shown earlier today isn't handed out again", !unitNew(p).includes("plow"), unitNew(p));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
