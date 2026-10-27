// 🗓 PUTSCHED — the gate that opens a unit day's cards ("One shape" §5 the gate; BRIEF_units_build_2026-10-27.md T2).
//   Runs the REAL RS4K_GATE block (mastBankEligible, mastGateChapter), GATESTART (mastGateStart), the PUTSCHED readers
//   (psFamUpto, psGateUpto), UNITTRACK and mastMintFromBank / mastPullItem slices over a DeWalt-shaped fixture.
//   · eligible names after each check on a 5-day unit laid 3 days a week: a co-op day (no check), a made-up day (2 sittings
//     at once), a ×2 line (both sittings before its day opens)
//   · week mode by the calendar (fromWeek shifts it); block / item / track gone → the full bank (open, as RS4K)
//   · cat_hold still wins; a book gate is untouched; Mom's ▶ Start (mastPullItem) never asks the gate
//   · mastGateChapter reads "Day n — …" titles; GATESTART starts a unit-day-gated deck's released cards
//   · unitEnroll with the gate set first starts only the cards whose day is open
//   run: node test_unit_gate.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);

// A 5-day unit: day n opens its cards (ch = n); two cards have no day (no ch) and are always open.
const UNIT = () => ({ id: "thanksgiving", title: "Thanksgiving", enrolled: {}, decks: [{ key: "Thanksgiving", introCap: 3, cards: [
  { name: "Wampanoag", ch: 1, order: 1 }, { name: "Mayflower", ch: 2, order: 2 }, { name: "Plymouth", ch: 3, order: 3 }, { name: "Squanto", ch: 4, order: 4 }, { name: "harvest", ch: 5, order: 5 }, { name: "cornucopia", order: 6 }, { name: "gratitude", order: 7 }] }],
  track: { mode: "seq", perWeek: 3, days: [{ id: "d1", n: 1, t: "Who were the Wampanoag?" }, { id: "d2", n: 2, t: "The Mayflower" }, { id: "d3", n: 3, t: "Plymouth" }, { id: "d4", n: 4, t: "Squanto" }, { id: "d5", n: 5, t: "The harvest" }] } });
const BANK = () => [{ cat: "Thanksgiving", name: "Wampanoag", ch: 1 }, { cat: "Thanksgiving", name: "Mayflower", ch: 2 }, { cat: "Thanksgiving", name: "Plymouth", ch: 3 }, { cat: "Thanksgiving", name: "Squanto", ch: 4 }, { cat: "Thanksgiving", name: "harvest", ch: 5 }, { cat: "Thanksgiving", name: "cornucopia" }, { cat: "Thanksgiving", name: "gratitude" }];
function world(o) {
  o = o || {}; const writes = [];
  const lines = o.lines || [{ t: "Day 1 — Who were the Wampanoag?", n: 1, u: { id: "thanksgiving", d: "d1" } }, { t: "Day 2 — The Mayflower", n: 1, u: { id: "thanksgiving", d: "d2" } }, { t: "Day 3 — Plymouth", n: 1, u: { id: "thanksgiving", d: "d3" } }, { t: "Day 4 — Squanto", n: 2, u: { id: "thanksgiving", d: "d4" } }, { t: "Day 5 — The harvest", n: 1, u: { id: "thanksgiving", d: "d5" } }];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap,
    unitStudies: { thanksgiving: UNIT() }, masteryKid: "caleb", momHere: () => o.mom !== false, _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push([p, v]), update: v => writes.push(["update " + p, v]) }) },
    masteryData: { caleb: o.items || [], caleb_custom_items: BANK(), caleb_settings: { cat_gate: { Thanksgiving: o.gate === undefined ? { fam: "ft", item: "th" } : o.gate }, cat_hold: o.hold || {} } },
    rulesData: { familyBlocks: { ft: { name: "Family Time", kids: ["taylor", "makenzie", "andrew", "caleb"], days: ["Mon", "Tue", "Thu"], items: [{ key: "th", name: "Thanksgiving", track: o.track === undefined ? { mode: "seq", list: lines } : o.track }, { key: "r", name: "Read Aloud" }] } } },
    famDefs: () => ctx.rulesData.familyBlocks, famList: x => Array.isArray(x) ? x.filter(v => v != null) : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]).filter(v => v != null) : []),
    famTrack: it => (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null,
    famProgress: { ft: { th: { done: o.done || 0 } } }, famDoneN: (id, key) => Math.max(0, parseInt((((ctx.famProgress || {})[id] || {})[key] || {}).done, 10) || 0),
    famLessonMap: () => ({ byDate: o.byDate || {}, short: o.byDate || {}, now: o.now || "" }), cbTodayISO: () => o.today || "2026-10-21",
    mastFullBank: kid => { const base = {}; (ctx.masteryData[kid + "_custom_items"] || []).forEach(e => { if (!base[e.cat]) base[e.cat] = []; base[e.cat].push(e.name); }); return base; },
    currData: { subjects: { caleb: { tg: { lessonSeq: ["Day 1 — Who were the Wampanoag?", "Day 2 — The Mayflower", "Day 3 — Plymouth"], lessonIds: ["L0001", "L0002", "L0003"] } } } },
    lidStamped: () => true, lidDoneIdx: () => new Set(o.doneIdx || []),
    mastCustomDef: () => "", mastGetDef: () => "", mastGetVisual: () => null, MAST_ANIMAL_EMOJI: {}, mastUniqueId: (items, b) => { const ids = new Set(items.map(i => i && i.id)); if (!ids.has(b)) return b; let n = 2; while (ids.has(b + "_" + n)) n++; return b + "_" + n; },
    mastDrillSettings: () => ({ ladder: ["every_other_day"], cat_intro_max: {}, max_intro_per_cat: 3 }), mastIntroMaxFor: (cat, s) => 3, mstSessions: () => [], mastIsParked: i => !!(i && i.status === "parked"),
    mastDefKeyOk: p => !/[.#$\[\]\/]/.test(p), HA_LS: { setItem: () => {} }, document: { getElementById: () => null }, renderUnits: () => {}, cap: s => s[0].toUpperCase() + s.slice(1), alert: () => {}, wrGateDone: undefined, ROSTER: ["taylor", "makenzie", "andrew", "caleb"] };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + cut("// ── RS4K_GATE_START", "// ── RS4K_GATE_END") + "\n" + cut("// GATESTART_START", "// GATESTART_END") + "\n" + fn("mastMintFromBank") + "\n" + fn("unitEnroll") + "\n" + fn("mastSeedCat") + "\n" + fn("mastSetStartAfter"), ctx);
  return { ctx, writes, setDone: n => { ctx.famProgress.ft.th.done = n; } };
}
const EL = (c, kid, cat) => c.mastBankEligible(kid || "caleb", cat || "Thanksgiving").join();

console.log("── in order: the place moves as Mom checks the family card ──");
{
  const w = world(), c = w.ctx;
  ok("before anything is checked only the dayless cards may start", EL(c) === "cornucopia,gratitude", EL(c));
  w.setDone(1); ok("Mon: day 1 checked → Wampanoag opens", EL(c) === "Wampanoag,cornucopia,gratitude");
  ok("Tue is a co-op day: no card, no check → unchanged", EL(c) === "Wampanoag,cornucopia,gratitude");
  w.setDone(3); ok("Thu made up Tue: two sittings at once → days 2 and 3 open", EL(c) === "Wampanoag,Mayflower,Plymouth,cornucopia,gratitude");
  w.setDone(4); ok("a ×2 line (day 4 takes two sittings): one sitting done → day 4 still closed", EL(c) === "Wampanoag,Mayflower,Plymouth,cornucopia,gratitude");
  w.setDone(5); ok("…both sittings done → day 4 opens", EL(c) === "Wampanoag,Mayflower,Plymouth,Squanto,cornucopia,gratitude");
  w.setDone(6); ok("day 5 → everything", EL(c) === "Wampanoag,Mayflower,Plymouth,Squanto,harvest,cornucopia,gratitude");
  w.setDone(40); ok("past the end stays at the last day (nothing odd)", c.psFamUpto("ft", "th") === 5);
  ok("psGateUpto reads the deck's gate", c.psGateUpto("caleb", "Thanksgiving") === 5 && c.psGateUpto("caleb", "Nope") === null);
}
console.log("\n── week by week: the calendar's week ──");
{
  const w = world({ track: { mode: "week", startDate: "2026-10-19", startWeek: 1, total: 8, days: { Mon: "The object", Tue: "Nature" }, unit: { id: "thanksgiving", fromWeek: 1 } }, byDate: { "2026-10-19": "Wk 1 · The object", "2026-10-20": "Wk 1 · Nature", "2026-10-26": "Wk 2 · The object", "2026-10-27": "Wk 2 · Nature" }, today: "2026-10-21" }), c = w.ctx;
  ok("Wed of week 1 (no run day today): the latest run day up to today says Wk 1 → ch ≤ 1", c.psFamUpto("ft", "th") === 1 && EL(c) === "Wampanoag,cornucopia,gratitude");
  const w2 = world({ track: { mode: "week", startDate: "2026-10-19", startWeek: 1, total: 8, days: { Mon: "The object" }, unit: { id: "thanksgiving", fromWeek: 1 } }, byDate: { "2026-10-19": "Wk 1 · The object", "2026-10-26": "Wk 2 · The object" }, today: "2026-10-27" });
  ok("week 2 → ch ≤ 2", w2.ctx.psFamUpto("ft", "th") === 2);
  const w3 = world({ track: { mode: "week", startDate: "2026-10-19", startWeek: 3, total: 8, days: { Mon: "The object" }, unit: { id: "thanksgiving", fromWeek: 3 } }, byDate: { "2026-10-19": "Wk 3 · The object", "2026-10-26": "Wk 4 · The object" }, today: "2026-10-27" });
  ok("fromWeek 3: book week 4 is the unit's week 2", w3.ctx.psFamUpto("ft", "th") === 2);
  const w4 = world({ track: { mode: "week", startDate: "2026-11-02", startWeek: 1, total: 8, days: { Mon: "The object" }, unit: { id: "thanksgiving", fromWeek: 1 } }, byDate: {}, now: "", today: "2026-10-21" });
  ok("no label at all (not started, no 'now') → cannot tell → open", w4.ctx.psFamUpto("ft", "th") === null && EL(w4.ctx).split(",").length === 7);
}
console.log("\n── fail open, as RS4K ──");
{
  ok("block gone → the full bank", (() => { const w = world({ done: 0 }); delete w.ctx.rulesData.familyBlocks.ft; return EL(w.ctx).split(",").length === 7; })());
  ok("item gone → the full bank", (() => { const w = world(); w.ctx.rulesData.familyBlocks.ft.items = [{ key: "r", name: "Read Aloud" }]; return EL(w.ctx).split(",").length === 7; })());
  ok("item with no track → the full bank", world({ track: null }).ctx.mastBankEligible("caleb", "Thanksgiving").length === 7);
  ok("a gate with neither fam nor subject → the full bank; no gate → the full bank", world({ gate: { odd: 1 } }).ctx.mastBankEligible("caleb", "Thanksgiving").length === 7 && world({ gate: null }).ctx.mastBankEligible("caleb", "Thanksgiving").length === 7);
  ok("cat_hold still wins over everything", world({ hold: { Thanksgiving: true }, done: 9 }).ctx.mastBankEligible("caleb", "Thanksgiving").length === 0);
  const bg = world({ gate: { subject: "tg" }, doneIdx: [0] }).ctx;
  ok("a book gate is untouched — and reads 'Day n' titles: on Day 2 → ch ≤ 2", EL(bg) === "Wampanoag,Mayflower,cornucopia,gratitude" && bg.mastGateChapter("caleb", "tg") === 2);
  ok("mastGateChapter: '· Ch N' and 'Lesson N:' still read as before", (() => { const c = world().ctx; c.currData.subjects.caleb.rs = { lessonSeq: ["RS4K · Ch 3 · Cells", "RS4K · Ch 4 · Energy"], lessonIds: ["a", "b"] }; c.currData.subjects.caleb.di = { lessonSeq: ["Lesson 7: The Nile"], lessonIds: ["c"] }; return c.mastGateChapter("caleb", "rs") === 3 && c.mastGateChapter("caleb", "di") === 7; })());
}
console.log("\n── Mom's ▶ Start never asks the gate ──");
{
  const pull = fn("mastPullItem");
  ok("mastPullItem has no gate call (bank eligibility is for AUTOMATIC starts only)", !/mastBankEligible|psGateUpto|psFamUpto/.test(pull));
}
console.log("\n── GATESTART: a unit-day-gated deck starts its released cards on a drill save ──");
{
  const w = world({ done: 3 }), c = w.ctx; const items = [], minted = [];
  c.mastGateStart("caleb", items, minted, c.mastDrillSettings());
  ok("three days open, cap 3: the first three released names mint (in bank order)", minted.map(i => i.prompt).join() === "Wampanoag,Mayflower,Plymouth" && items.length === 3, minted.map(i => i.prompt));
  const w0 = world({ done: 0 }), i0 = [], m0 = []; w0.ctx.mastGateStart("caleb", i0, m0, w0.ctx.mastDrillSettings());
  ok("nothing checked yet: only the dayless cards start (cornucopia, gratitude)", m0.map(i => i.prompt).join() === "cornucopia,gratitude");
  const w1 = world({ done: 3, items: [{ id: "x", subject: "Thanksgiving", prompt: "Wampanoag", status: "introduction" }] }), i1 = w1.ctx.masteryData.caleb, m1 = []; w1.ctx.mastGateStart("caleb", i1, m1, w1.ctx.mastDrillSettings());
  ok("a learning card in the deck → GATESTART leaves it to auto-pull (as before)", m1.length === 0);
}
console.log("\n── unitEnroll with the gate set first starts only the open day's cards ──");
{
  const w = world({ done: 0 }), c = w.ctx; c.masteryData.caleb_custom_items = [];
  c.unitEnroll("thanksgiving", "caleb");
  const started = c.masteryData.caleb.map(i => i.prompt);
  ok("gate at 0: enroll seeds the bank (with ch) but starts only the two dayless cards", started.join() === "cornucopia,gratitude" && c.masteryData.caleb_custom_items.length === 7 && c.masteryData.caleb_custom_items[0].ch === 1, started);
  ok("the writes are unitEnroll's own (items, bank, modes, intro, definitions, enrolled) — the gate was already there", w.writes.some(x => x[0] === "update mastery/caleb") && w.writes.some(x => x[0] === "unitStudies/thanksgiving/enrolled/caleb") && !w.writes.some(x => /cat_gate/.test(x[0])));
  const w2 = world({ done: 1 }), c2 = w2.ctx; c2.masteryData.caleb_custom_items = []; c2.unitEnroll("thanksgiving", "caleb");
  ok("gate at day 1 (Sara put it on after a check): Wampanoag starts too, within the cap", c2.masteryData.caleb.map(i => i.prompt).join() === "Wampanoag,cornucopia,gratitude");
  const w3 = world({ gate: null }), c3 = w3.ctx; c3.masteryData.caleb_custom_items = []; c3.unitEnroll("thanksgiving", "caleb");
  ok("no gate at all: enroll behaves exactly as today (first introCap cards in order)", c3.masteryData.caleb.map(i => i.prompt).join() === "Wampanoag,Mayflower,Plymouth");
}
console.log("\n── the hooks are guarded one-liners ──");
{
  ok("mastBankEligible accepts {fam,item} through psFamUpto (guarded)", /if\(!g\|\|\(!g\.subject&&!g\.fam\)\) return all;/.test(fn("mastBankEligible")) && /g\.fam\?\(\(typeof psFamUpto==="function"\)\?psFamUpto\(g\.fam,g\.item\):null\)/.test(fn("mastBankEligible")));
  ok("the Word Roots after:'done' branch is still there", /g\.after==="done"&&typeof wrGateDone==="function"/.test(fn("mastBankEligible")));
  ok("mastGateStart lets a fam gate through; unitEnroll reads psGateUpto when the deck has no book gate (guarded)", /if\(!g\|\|\(!g\.subject&&!g\.fam\)\) return;/.test(fn("mastGateStart")) && /\(typeof psGateUpto==="function"\)\?psGateUpto\(kid,d\.key\):null/.test(fn("unitEnroll")));
  ok("no kid's name in the block; no shuffle emoji in index.html", !/lincoln|ellis|lucy|julian/i.test(cut("// PUTSCHED_START", "// PUTSCHED_END").replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
