/*
 * test_house_covered.js — slice F of DESIGN_missed_chores_2026-11-19 (§1.3, §1.4, §7, §8 row F): "Covered". With the plan ON, from
 * HD_MISSED_FROM (Mon 2026-12-07), a fixed-day chore DONE within its cover window before its day is not handed out that day: Mom's
 * 👤 By person says "done Mon" in place of a second turn; the kid's list simply has no row. The window is the card's "Skip the next one
 * if done within … days" (slice D's `cover`: 0 never, 1–6; none = Auto, the Auto wait's size: weekly 2 — "done Sunday or Monday covers
 * Tuesday; Saturday does not"). Saves nothing new. index.html COVERED (HouseEng) + COVEREDDAY; house.js COVEREDSEEN.
 * Made-up families only (kid_a … kid_d). No real family's data.
 *   A  the engine alone (a bare vm): without the new inputs = E's engine byte for byte (8 weeks, 300 chores); the rules; pure
 *   B  the window's size = the card's (house.js CARDRULES cdrInfo().cauto) for every kind of fixed-day chore
 *   C  the whole app, plan ON: Mom ticks ✓ Done today early → the next turn is covered; nothing missed, nothing taken, nothing new saved;
 *      Mom sees "done Mon"; a kid sees nothing; Saturday does not cover; never / 3-a-week / dailies are never covered
 *   D  plan ON with nothing done early: 30 days = the app before F (lists, banks, every write, the database)
 *   E  plan OFF and on preview, 35 days with early ✓ Done today taps: every kid list (Mom's device and a kid's), every pop-up, every
 *      bank, every write and the whole database = the app before F; on preview only the plan preview's drawings may change
 *   F  planted faults, each named for the rule it breaks: every one is caught
 * "The app before F" = this tree with test_fixtures/covered_pairs.js applied (its blocks out, its lines back): E's tip.
 *   run: node test_house_covered.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), vm = require("vm");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js")), COVF = require(path.join(__dirname, "test_fixtures", "covered_pairs.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => x == null ? x : JSON.parse(J(x));
const IDX = path.join(__dirname, "index.html"), SRC = fs.readFileSync(IDX, "utf8"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
const carve = (s, blocks, pairs, file) => { blocks.forEach(b => { const re = new RegExp("^ *// " + b + "_START[^\\n]*\\n[\\s\\S]*?^ *// " + b + "_END\\n", "m"), n = (s.match(new RegExp(re.source, "gm")) || []).length;
    if (n !== 1) throw new Error("test_house_covered: the app before F cannot be built — the " + b + " block found " + n + "× in " + file); s = s.replace(re, ""); });
  pairs.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_house_covered: the app before F cannot be built — piece " + (i + 1) + " of " + file + " found " + n + "×"); s = s.replace(a, () => b); });
  if (/covOf|covCarry|hdCover|hdCovered|hpCovHTML|COVERED/.test(s)) throw new Error("test_house_covered: the app before F's " + file + " still mentions slice F");
  return s; };
const BASE_SRC = carve(SRC, COVF.IDX_BLOCKS, COVF.IDX_PAIRS, "index.html"), BASE_HJS = carve(require(path.join(__dirname, "test_fixtures", "carve_g.js")).hjs(HJS), COVF.HJS_BLOCKS, COVF.HJS_PAIRS, "house.js");   // slice G reads F's hdCoverN: it goes too
const BASE_IDX = path.join(os.tmpdir(), "covered_before_" + process.pid + ".html"); fs.writeFileSync(BASE_IDX, BASE_SRC);
console.log("(the app before F: this tree with COVERED / COVEREDDAY / COVEREDSEEN taken out = slice E's tip)");
const block = (s, name) => { const a = s.indexOf("// " + name + "_START"), b = s.indexOf("// " + name + "_END"); if (a < 0 || b < a) throw new Error("missing " + name); return s.slice(a, s.indexOf("\n", b)); };
const engOf = src => { const c = {}; vm.createContext(c); vm.runInContext(block(src, "HOUSEENG") + "\nthis.E=HouseEng;", c); return c.E; };
// COVEREDDAY's two pure helpers in a bare vm (hhIsHouse as the app's)
const dayOf = src => { const c = {}; vm.createContext(c); vm.runInContext("function hhIsHouse(j){ return !!j&&(j.area==='pickup'||j.area==='cleaning'); }\n" + block(src, "COVEREDDAY") + "\nthis.N=hdCoverN;this.O=hdCoverOv;", c); return c; };

// ════════════════════════════════ A · the engine alone ════════════════════════════════
const H = o => Object.assign({ status: "active", src: { kind: "new" }, area: "cleaning", slot: "chores", level: 1, pts: 10, minutes: 10 }, o);
const OV = { kids: ["ava", "ben"], slots: ["morning", "afternoon", "chores", "evening"], on: "2026-11-30", minDefault: { cleaning: 10, pickup: 5 } };
const PPL = { ava: { school: 60, weekend: 60, level: 1 }, ben: { school: 60, weekend: 60, level: 1 } };
const TAB = () => ({
  vac: H({ who: "ava", cad: "wk:1", order: 1 }),                  // Tuesdays, Auto 2
  two: H({ who: "ben", cad: "wk:0,3", order: 2 }),                // Mon + Thu, Auto 1
  three: H({ who: "ava", cad: "wk:0,2,4", order: 3 }),            // 3 a week: Auto never
  dish: H({ who: "ben", cad: "daily", order: 4 }),
  mop: H({ who: "ben", cad: "7d", order: 5 }),
  win: H({ who: "ava", cad: "wk:3", order: 6 })                   // Thursdays, the window set per test
});
const MISS = (cover, done, keep) => ({ from: "2026-12-07", wait: { vac: 2, two: 1, three: 6, win: 2, mop: 2 }, keep: keep || {}, roll: {}, cover: cover, done: done });
const D = (E, iso, m, extra) => E.day({ jobs: TAB() }, iso, PPL, Object.assign({}, OV, { missed: m }, extra || {}));
function engineChecks(E, E0) { const R = [], c = (n, v) => R.push([n, !!v]);
  const COV = { vac: 2, two: 1, win: 2 };
  // §1.4 her example: "done Sunday or Monday covers Tuesday; Saturday does not"
  const mon = D(E, "2026-12-08", MISS(COV, { vac: "2026-12-07" })), sun = D(E, "2026-12-08", MISS(COV, { vac: "2026-12-06" })), sat = D(E, "2026-12-08", MISS(COV, { vac: "2026-12-05" }));
  c("done Monday covers Tuesday: not on a list, not \"fit nobody\", nothing missed, in the day's covered list as done Mon", !mon.plan.vac && !mon.over.some(o => o.id === "vac") && !mon.missed.length && J(mon.covered) === J([{ id: "vac", turn: "ava", done: "2026-12-07", k: "set" }]));
  c("done Sunday covers Tuesday (2 days before)", !sun.plan.vac && (sun.covered || []).some(x => x.id === "vac" && x.done === "2026-12-06"));
  c("done Saturday does NOT cover Tuesday (3 days before): its turn as usual", !!sat.plan.vac && !(sat.covered || []).length);
  const tod = D(E, "2026-12-08", MISS(COV, { vac: "2026-12-08" }));
  c("done on the day itself is not \"before its day\": not covered", !(tod.covered || []).length);
  c("a window of 0 (Never): never covered", !!D(E, "2026-12-08", MISS({}, { vac: "2026-12-07" })).plan.vac);
  c("a window of 4 (the card's pick): Saturday covers Tuesday", !D(E, "2026-12-08", MISS({ vac: 4 }, { vac: "2026-12-05" })).plan.vac);
  c("before the start date (Tue 12/01, done Mon 11/30): never covered", !!D(E, "2026-12-01", MISS(COV, { vac: "2026-11-30" })).plan.vac && D(E, "2026-12-01", MISS(COV, { vac: "2026-11-30" })).covered === undefined);
  c("a daily is never covered (tomorrow has its own), even with a window", !!D(E, "2026-12-08", MISS({ dish: 3 }, { dish: "2026-12-07" })).plan.dish);
  c("an every-N chore is never covered (\"not needed: the clock already restarted\")", (() => { const p = D(E, "2026-12-08", MISS({ mop: 3 }, { mop: "2026-12-07" }), { lastDone: { mop: "2026-12-01" } }); return !!p.plan.mop && !(p.covered || []).length; })());
  c("a 3-times-a-week chore with Auto (none given): never covered", !!D(E, "2026-12-09", MISS(COV, { three: "2026-12-08" })).plan.three);
  c("Mon + Thu with Auto 1: done Wednesday covers Thursday; done Tuesday does not", !D(E, "2026-12-10", MISS(COV, { two: "2026-12-09" })).plan.two && !!D(E, "2026-12-10", MISS(COV, { two: "2026-12-08" })).plan.two);
  c("the real last-done date (ov.missed.done) decides, never ov.lastDone (which carries a ✕ skip)", !!D(E, "2026-12-08", MISS(COV, {}), { lastDone: { vac: "2026-12-07" } }).plan.vac);
  c("no `done` given at all: nothing covered", !!D(E, "2026-12-08", MISS(COV, undefined)).plan.vac);
  // a turn of it still waiting from an earlier day (the plan's carry)
  const carry = since => [{ id: "win", turn: "ava", k: "set", since: since, by: "ava", sk: 2 }];
  const a = D(E, "2026-12-17", MISS({ win: 6 }, { win: "2026-12-15" }), { carry: carry("2026-12-10") });   // Thu 12/10 turn waiting? (wait 2 → gone by Sat; use Waits "next")
  const wl = Object.assign(MISS({ win: 6 }, { win: "2026-12-12" }), { wait: { win: 6 } });
  const p1 = D(E, "2026-12-17", wl, { carry: carry("2026-12-10") });
  c("a turn still waiting, done since it (✓ Done today on Sat): its next day is covered and the old turn ends — nothing missed, no note, no stars", !p1.plan.win && !p1.missed.some(m => m.id === "win") && (p1.covered || []).some(x => x.id === "win"));
  // (done before that turn yet inside today's window: only after a window was changed — the turn would have been covered too)
  const c2 = [{ id: "two", turn: "ben", k: "set", since: "2026-12-14", by: "ben", sk: 2 }], wl2 = Object.assign(MISS({ two: 6 }, { two: "2026-12-13" }), { wait: { two: 6 } });
  const p2 = D(E, "2026-12-17", wl2, { carry: c2, lastDone: { two: "2026-12-13" } });
  c("a turn still waiting, done only BEFORE it (Sun 12/13, the Mon 12/14 turn not done): its next day came — dropped as missed, with who had it", !p2.plan.two && p2.missed.some(m => m.id === "two" && m.why === "its next day came" && m.by === "ben" && m.since === "2026-12-14"));
  const p3 = D(E, "2026-12-17", Object.assign({}, wl2, { keep: { two: 1 } }), { carry: c2, lastDone: { two: "2026-12-13" } });
  c("…📌 Keep until done: the old turn goes on (on his list, from 12/14)", !!p3.plan.two && p3.plan.two.late === 3 && !p3.missed.some(m => m.id === "two"));
  const p4 = D(E, "2026-12-13", Object.assign(MISS({ win: 6 }, { win: "2026-12-11" }), { wait: { win: 2 } }), { carry: carry("2026-12-10") });
  c("a turn that drops by its wait the same morning, done since (Fri, by ✓ Done today): it is not 'covered' there (no turn that day) and E's drop stands", p4.missed.some(m => m.id === "win" && m.why === "wait") && !(p4.covered || []).length);
  // pure
  const t = TAB(), m = MISS(COV, { vac: "2026-12-07" }), s0 = J([t, m]); E.day({ jobs: t }, "2026-12-08", PPL, Object.assign({}, OV, { missed: m })); c("pure: the table and the inputs are unchanged", J([t, m]) === s0);
  c("pure: the same input gives the same day", J(D(E, "2026-12-08", MISS(COV, { vac: "2026-12-07" }))) === J(mon));
  // a run (the preview): the covered turn is not given, every other turn is
  const run = E.run({ jobs: TAB() }, "2026-12-07", 14, PPL, Object.assign({}, OV, { missed: MISS(COV, { vac: "2026-12-07", two: "2026-12-09" }) }));
  c("the preview's 14 days: Tue 12/08 and Thu 12/10 covered, Tue 12/15 and Thu 12/17 as usual", !run[1].plan.vac && !run[3].plan.two && !!run[8].plan.vac && !!run[10].plan.two && run.filter(p => (p.covered || []).length).length === 2);
  if (E0) { c("the same day with no window anywhere (cover {}) = E's engine, byte for byte", J(D(E, "2026-12-08", MISS({}, { vac: "2026-12-07" }))).replace(',"covered":[]', "") === J(D(E0, "2026-12-08", MISS({}, { vac: "2026-12-07" })))); }
  return R; }
console.log("\n── A · the engine alone (a bare vm) ──");
const E = engOf(SRC), E0 = engOf(BASE_SRC), dn = E.dnum, iso = E.isoOf;
// a made-up 300-chore table (as test_house_plan_missed's), seeded
let seed = 20261125; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)], ALL = ["ava", "ben", "cal", "dot", "mom", "dad"], K4 = ["ava", "ben", "cal", "dot"];
const BIG = {}; let nId = 0; const addJ = o => { const id = "j" + (nId++); BIG[id] = Object.assign({ status: "active", src: { kind: "new" }, pts: pick([0, 5, 10, 15]), order: nId, area: pick(["cleaning", "cleaning", "pickup"]), who: pick(ALL), minutes: pick([2, 3, 5, 5, 10, 10, 15, 20]), level: pick([1, 1, 1, 2]) }, o); if (BIG[id].slot === undefined) BIG[id].slot = K4.includes(BIG[id].who) ? pick(["chores", "afternoon"]) : "chores"; if (rnd() < 0.5) BIG[id].lastDone = iso(dn("2026-12-12") - Math.floor(rnd() * 14)); };
for (let i = 0; i < 40; i++) addJ({ cad: "daily", minutes: pick([2, 3, 5]) });
for (let i = 0; i < 170; i++) { const ds = [...new Set([Math.floor(rnd() * 7), ...(rnd() < 0.3 ? [Math.floor(rnd() * 7)] : []), ...(rnd() < 0.1 ? [Math.floor(rnd() * 7), Math.floor(rnd() * 7)] : [])])].sort(); addJ({ cad: "wk:" + ds.join(","), can: rnd() < 0.2 ? [pick(K4)] : undefined, cover: rnd() < 0.2 ? pick([0, 1, 3, 6]) : undefined }); }
for (let i = 0; i < 30; i++) addJ({ cad: "wk:" + Math.floor(rnd() * 7), cycW: 1 + (i % 4), cycN: 4, cycStart: "2026-11-02" });
for (let i = 0; i < 60; i++) addJ({ cad: pick([3, 7, 10, 14, 21, 28]) + "d" });
const PEO = {}; ALL.forEach(w => { PEO[w] = { school: pick([20, 30, 45]), weekend: pick([30, 60]), level: pick([1, 2, 3]) }; });
const OVB = { kids: K4, slots: ["morning", "afternoon", "chores", "evening"], on: "2026-11-09", minDefault: { cleaning: 10, pickup: 5 } };
const MW = {}; Object.keys(BIG).forEach(id => { const c = BIG[id].cad, d = /^wk:/.test(c) ? c.slice(3).split(",").length : 0, g = c === "daily" ? 1 : d ? 7 / d * (BIG[id].cycW ? 4 : 1) : parseInt(c, 10) || 14; MW[id] = d >= 3 ? 6 : Math.min(7, Math.floor(g / 3)); });
const DC = dayOf(SRC), CV = {}; DC.O(CV, BIG);
const MB = (o) => Object.assign({ from: "2026-12-07", wait: MW, keep: {}, roll: {} }, o || {});
const r0 = J(E0.run({ jobs: BIG }, "2026-11-23", 56, PEO, Object.assign({ missed: MB() }, OVB)));
ok("ov.missed with no cover / done (as E builds it): HouseEng.run, 8 weeks, 300 chores = E's engine, byte for byte", J(E.run({ jobs: BIG }, "2026-11-23", 56, PEO, Object.assign({ missed: MB() }, OVB))).replace(/,"covered":\[\]/g, "") === r0);
ok("…and with no `covered` key on any day before the start date (12/07)", E.run({ jobs: BIG }, "2026-11-23", 14, PEO, Object.assign({ missed: MB(CV) }, OVB)).every(p => p.covered === undefined));
ok("ov.missed absent: = E's engine, byte for byte", J(E.run({ jobs: BIG }, "2026-11-23", 56, PEO, OVB)) === J(E0.run({ jobs: BIG }, "2026-11-23", 56, PEO, OVB)));
const runC = E.run({ jobs: BIG }, "2026-11-23", 56, PEO, Object.assign({ missed: MB(CV) }, OVB)), nCov = runC.reduce((a, p) => a + (p.covered || []).length, 0);
{ const bad = [], twice = []; runC.forEach(p => (p.covered || []).forEach(c => { const j = BIG[c.id]; if (p.plan[c.id] || p.over.some(o => o.id === c.id) || (p.wait || []).some(w => w.id === c.id)) twice.push(p.iso + " " + c.id); const g = dn(p.iso) - dn(c.done);
    if (!/^wk:/.test(j.cad) || g < 1 || g > CV.cover[c.id] || p.iso < "2026-12-07") bad.push(p.iso + " " + c.id + " " + j.cad + " " + c.done); }));
  ok("8 weeks with the table's windows: " + nCov + " covered turns, every one a fixed-day chore done 1…its window days before, from 12/07", nCov > 0 && bad.length === 0, bad.slice(0, 4));
  ok("…a covered turn is in no other place that day (a list, \"fit nobody\", waiting)", twice.length === 0, twice.slice(0, 4));
  ok("…every day without a covered turn = the same day with no windows, except what follows from the turns covered before it", (() => { const r1 = E.run({ jobs: BIG }, "2026-11-23", 56, PEO, Object.assign({ missed: MB({ cover: {}, done: CV.done }) }, OVB)); const first = runC.findIndex(p => (p.covered || []).length); return first >= 14 && J(runC.slice(0, first).map(p => Object.assign({}, p, { covered: undefined }))) === J(r1.slice(0, first).map(p => Object.assign({}, p, { covered: undefined }))); })());
}
const EC = engineChecks(E, E0); EC.forEach(([n, v]) => ok(n, v));

// ════════════════════════════════ B · the window = the card's ════════════════════════════════
console.log("\n── B · the window's size = the card's Auto (house.js CARDRULES cdrInfo().cauto) ──");
{ const cdr = (() => { const c = { hhEditDays: null, hhIsProject: () => false }; vm.createContext(c); vm.runInContext(HJS.slice(HJS.indexOf("function hhEditDays("), HJS.indexOf("\n", HJS.indexOf("function hhEditDays("))) + "\n" + block(HJS, "CARDRULES").replace(/^\/\/ CARDRULES_START[\s\S]*?\nconst CDR_F/m, "const CDR_F") + "\nthis.I=cdrInfo;", c); return c.I; })();
  const kinds = [["wk:1", "weekly", 2], ["wk:0,3", "twice a week", 1], ["wk:0,2,4", "3 a week", 0], ["wk:0,1,2,3,4", "5 a week", 0], ["sat", "Saturdays", 2], ["sun", "Sundays", 2], ["wk:2|cyc", "the 4-week cycle", 7], ["wk:5|cyc2", "every 2nd week (cycle of 2)", 4]];
  kinds.forEach(([cad, name, want]) => { const c = cad.split("|"), j = { cad: c[0], who: "kid_a", area: "cleaning" }; if (c[1] === "cyc") Object.assign(j, { cycW: 1, cycN: 4 }); if (c[1] === "cyc2") Object.assign(j, { cycW: 1, cycN: 2 });
    const I = cdr(j); ok(name + ": Auto window " + want + " day(s) = the card's \"Auto: …\" (" + (I && I.cauto) + ")", DC.N(j) === want && I && I.cauto === want); });
  ok("the card's own pick wins: 0 (Never) → 0, 4 → 4, 6 → 6; a bad value → Auto", DC.N({ cad: "wk:1", cover: 0 }) === 0 && DC.N({ cad: "wk:1", cover: 4 }) === 4 && DC.N({ cad: "wk:1", cover: 6 }) === 6 && DC.N({ cad: "wk:1", cover: 9 }) === 2 && DC.N({ cad: "wk:1", cover: "3" }) === 2);
  ok("🔄 Rolling (one weekday, clock roll): no window, whatever the card says", DC.N({ cad: "wk:1", clock: "roll", cover: 4 }) === 0);
  ok("daily, every N days, as needed: no window", DC.N({ cad: "daily" }) === 0 && DC.N({ cad: "7d", cover: 3 }) === 0 && DC.N({ cad: "asneeded" }) === 0);
  const o = {}; DC.O(o, { a: { cad: "wk:1", area: "cleaning", lastDone: "2026-12-07", lastSkip: "2026-12-08" }, b: { cad: "wk:1", area: "cleaning", lastSkip: "2026-12-07" }, c: { cad: "wk:1", area: "health", lastDone: "2026-12-07" } });
  ok("the done dates passed in are real last-done dates: a ✕ skip (lastSkip) is never one; health and animal rows are not the plan's", J(o) === J({ cover: { a: 2, b: 2 }, done: { a: "2026-12-07" } }), o);
}

// ════════════════════════════════ C · the whole app, plan ON ════════════════════════════════
const dOf = n => new Date(2026, 11, 7 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h == null ? 7 : h, 0); };
const KJ = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 10, slot: "chores" }, o);
const FAM = () => ({
  a_dish: KJ({ label: "Dishes", emoji: "🍽", who: "kid_a", cad: "daily", pts: 10, order: 1 }),
  a_vac: KJ({ label: "Vacuum", emoji: "🧹", who: "kid_a", cad: "wk:1", pts: 10, order: 2 }),             // Tuesdays · Auto 2
  a_dust: KJ({ label: "Dust", emoji: "🪶", who: "kid_a", cad: "wk:3", pts: 10, order: 3, cover: 0 }),    // Thursdays · Never
  a_wipe: KJ({ label: "Wipe the table", emoji: "🧽", who: "kid_a", cad: "wk:0,2,4", pts: 5, order: 4 }), // 3 a week · Auto never
  b_sink: KJ({ label: "Sink", emoji: "🚰", who: "kid_b", cad: "daily", pts: 10, order: 1 }),
  b_tub: KJ({ label: "Tub", emoji: "🛁", who: "kid_b", cad: "wk:1", pts: 20, order: 2 }),                // Tuesdays · Auto 2
  b_bins: KJ({ label: "Bins", emoji: "🗑", who: "kid_b", cad: "wk:0,3", pts: 10, order: 3 }),            // Mon + Thu · Auto 1
  c_toys: KJ({ label: "Toys", emoji: "🧩", who: "kid_c", cad: "daily", pts: 5, order: 1 }),
  c_shoes: KJ({ label: "Shoes", emoji: "👟", who: "kid_c", cad: "wk:5", pts: 5, order: 2, cover: 3 }),   // Saturdays · window 3
  h_teeth: KJ({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 })
});
const PE = () => ({ kid_a: { school: 60, weekend: 60 }, kid_b: { school: 60, weekend: 60 }, kid_c: { school: 60, weekend: 60 }, kid_d: { school: 0, weekend: 0 }, mom: { school: 0, weekend: 0 }, dad: { school: 0, weekend: 0 } });
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';1";
async function mkW(index, hjs, mode, jobs) {
  const w = await W.world({ index, household: { jobs: jobs || FAM(), people: PE(), meta: { takeover: 1, engine: { mode: mode, on: "2026-11-30" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(CAP); B.run(CAP); A.run(hjs); await w.flush(); return { w, A, B }; }
const root = w => w.db.tree.root, day = (w, d) => clone(w.get("houseDay/" + d)) || {};
const bankOf = w => J(Object.keys(root(w).bank || {}).sort().map(k => [k, root(w).bank[k]]));
const rows = (d, slot, kid) => JSON.parse(d.run("(function(){ const d0=day; day=_todayDay; try{ return JSON.stringify((rtStepsFor(" + J(slot) + "," + J(kid) + ",false,day)||[]).filter(function(x){ return x&&x.cad!=='none'&&cadDueOn(x.cad||'daily',day); }).map(function(x){ return x.label; })); } finally{ day=d0; } })()"));
const slotTxt = (d, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML('chores'," + J(kid) + "); } finally{ day=d0; } })()").replace(/<[^>]+>/g, " ");
const tick = (d, kid, label) => d.run("(function(){ day=_todayDay; const i=(rtStepsFor('chores'," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); if(i<0) return -1; _rtMomTick=true; try{ toggleRtStep('chores'," + J(kid) + ",i); } finally{ _rtMomTick=false; } return i; })()");
const person = (A, who) => A.run("(function(){ hpSel=" + J(who) + "; return hpPersonHTML(); })()").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const logKeys = (w, kid) => { const L = (root(w).routineLog || {})[kid] || {}, o = []; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(d => Object.keys(L[wk][d] || {}).forEach(k => o.push(k)))); return o; };

(async () => {
console.log("\n── C · the whole app, plan ON (Mon 12/07 – Sun 12/20) ──");
{ const S = await mkW(IDX, HJS, "on"), { w, A, B } = S, m0 = w.mark();
  await go(w, 0, 9); A.run("ktDoneToday('a_vac');ktDoneToday('b_bins');1"); await w.flush();   // Mon 12/07: Mom's ✓ Done today on Tuesday's Vacuum and on Bins (its Monday)
  await go(w, 1, 7); await w.flush(); await go(w, 1, 9); await w.flush();                       // Tue 12/08: the day's build
  const d1 = day(w, isoN(1));
  ok("Tue 12/08: the stored plan has no Vacuum (done Mon, Auto 2 days) and has the Tub (never done early)", d1.plan && !d1.plan.a_vac && !!d1.plan.b_tub, Object.keys(d1.plan || {}));
  ok("…kid_a's own list (a kid's device) has no Vacuum row; her Dishes are there", !rows(B, "chores", "kid_a").includes("Vacuum") && rows(B, "chores", "kid_a").includes("Dishes"), rows(B, "chores", "kid_a"));
  ok("…a kid sees nothing about it: no \"done\", \"skipped\" or \"covered\" words on her list", !/done Mon|skipped today|ahead of its day|covered/i.test(slotTxt(B, "kid_a")));
  const pa = person(A, "kid_a");
  ok("…Mom's 👤 By person ▸ kid_a: \"Done ahead of its day · skipped today (1)\" with Vacuum \"done Mon 12/7\"", /Done ahead of its day · skipped today \(1\)/.test(pa) && /Vacuum done Mon 12\/7/.test(pa), pa.slice(pa.indexOf("Done ahead") - 10, pa.indexOf("Done ahead") + 160));
  ok("…and nothing of it on kid_b's page (the Tub is a normal row)", !/Done ahead of its day/.test(person(A, "kid_b")));
  ok("…nothing new saved: houseDay/12-08 has only E's keys, and no key anywhere in the database says cover / covered", Object.keys(d1).every(k => ["built", "plan", "over", "miss", "grabs", "wait", "done", "skip", "keep"].includes(k)) && !/"cover(ed)?"/.test(J(root(w).houseDay || {})) && !/"cover(ed)?"/.test(J(Object.assign({}, root(w), { household: null }))));
  ok("…the only writes about the Vacuum: Mom's ✓ Done today (lastDone / lastBy)", w.since(m0).filter(e => /a_vac/.test(String(e.path || "")) && !/^(get|once|on|read)/.test(String(e.op || ""))).every(e => /household\/jobs\/a_vac$/.test(e.path) && J(e.keys || Object.keys(e.val || {})) === J(["lastDone", "lastBy"])), w.since(m0).filter(e => /a_vac/.test(String(e.path || ""))).map(e => e.op + " " + e.path));
  // Wed – Fri: no wait, no drop, no star line for a turn that was never handed out
  for (let n = 2; n <= 4; n++) { await go(w, n, 7); await w.flush(); await go(w, n, 9); await w.flush(); }
  ok("Wed–Fri: the Vacuum never waits, never drops: no miss/a_vac, no wait/a_vac on any stored day", [2, 3, 4].every(n => { const d = day(w, isoN(n)); return !(d.miss || {}).a_vac && !(d.wait || {}).a_vac && !(d.plan || {}).a_vac; }));
  ok("…no \"— not done\" line for it in kid_a's Click-off Log and no hdrop_ line in her Star Bank", !logKeys(w, "kid_a").includes("miss_h_a_vac") && !Object.keys(((root(w).bank || {}).kid_a || {}).adjustments || {}).some(k => /a_vac/.test(k)));
  // Thu 12/10: Bins (Mon + Thu, Auto 1) was done Mon (3 days before): its turn as usual; Dust (Never) done Wed: its turn as usual
  ok("Thu 12/10: Bins done Mon (3 days before, window 1) is on kid_b's list as usual", !!(day(w, isoN(3)).plan || {}).b_bins);
  // the next week: Sat 12/12 Tub done (3 days before Tue: not covered); Sun 12/13 Vacuum done (2 days: covered); Wed 12/16 Dust (Never); Tue 12/15 Wipe (3 a week, Auto never)
  await go(w, 5, 9); A.run("ktDoneToday('b_tub');1"); await w.flush();
  await go(w, 6, 9); A.run("ktDoneToday('a_vac');1"); await w.flush();
  await go(w, 7, 7); await w.flush(); await go(w, 7, 9); await w.flush();
  await go(w, 8, 7); await w.flush(); await go(w, 8, 9); A.run("ktDoneToday('a_wipe');1"); await w.flush();
  const d8 = day(w, isoN(8));
  ok("Tue 12/15: Vacuum done Sun (2 days before) is covered; the Tub done Sat (3 days before) is on kid_b's list — \"Saturday does not\"", !(d8.plan || {}).a_vac && !!(d8.plan || {}).b_tub, Object.keys(d8.plan || {}));
  ok("…Mom's page says \"done Sun 12/13\"", /Vacuum done Sun 12\/13/.test(person(A, "kid_a")));
  await go(w, 9, 7); await w.flush(); await go(w, 9, 9); A.run("ktDoneToday('a_dust');1"); await w.flush();
  ok("Wed 12/16: Wipe the table (3 a week, Auto never) done Tue is on kid_a's list as usual", !!(day(w, isoN(9)).plan || {}).a_wipe);
  await go(w, 10, 7); await w.flush(); await go(w, 10, 9); await w.flush();
  ok("Thu 12/17: Dust (window Never) done Wed is on kid_a's list as usual", !!(day(w, isoN(10)).plan || {}).a_dust);
  await go(w, 11, 9); A.run("ktDoneToday('c_shoes');1"); await w.flush(); await go(w, 12, 7); await w.flush(); await go(w, 12, 9); await w.flush();
  ok("Sat 12/19: Shoes (window 3, the card's pick) done Fri is covered", !(day(w, isoN(12)).plan || {}).c_shoes && /Shoes done Fri 12\/18/.test(person(A, "kid_c")));
  ok("a daily is never covered: Dishes on kid_a's list every day 12/08 – 12/19", [1, 2, 3, 4, 7, 8, 9, 10, 12].every(n => !!(day(w, isoN(n)).plan || {}).a_dish));
  ok("kid_a's Star Bank: nothing taken in two weeks (no line at all: nobody ticked and the covered turns cost nothing)", !Object.keys(((root(w).bank || {}).kid_a || {}).adjustments || {}).some(k => /a_vac/.test(k)));
  // the preview on the same family (switch to preview: Mom's 👤 By person "WOULD give today" shows it too)
}
{ const S = await mkW(IDX, HJS, "preview"), { w, A } = S; await go(w, 0, 9); A.run("ktDoneToday('a_vac');1"); await w.flush(); await go(w, 1, 9); await w.flush();
  const pa = person(A, "kid_a");
  ok("preview, Tue 12/08: \"🔭 House chores the plan WOULD give today\" leaves out the Vacuum and says \"done Mon 12/7\"", /WOULD give today/.test(pa) && /Done ahead of its day · skipped today \(1\) 🧹 Vacuum done Mon 12\/7/.test(pa), pa.slice(pa.indexOf("WOULD give"), pa.indexOf("WOULD give") + 300));
  ok("…and kid_a's own list on preview still has Tuesday's Vacuum (preview changes no list)", rows(S.B, "chores", "kid_a").includes("Vacuum")); }

// ════════════════════════════════ D · plan ON, nothing done early = the app before F ════════════════════════════════
console.log("\n── D · plan ON, 30 days (12/07 – 1/05), every chore ticked on its day or late — never early: = the app before F ──");
{ const N = await mkW(IDX, HJS, "on"), O = await mkW(BASE_IDX, BASE_HJS, "on"), bad = [], m0 = N.w.mark(), m1 = O.w.mark();
  for (let n = 0; n < 30; n++) { const sn = [];
    for (const S of [N, O]) { await go(S.w, n, 7); await S.w.flush(); await go(S.w, n, 10);
      for (const [kid, label] of [["kid_a", "Dishes"], ["kid_b", "Sink"], ["kid_c", "Toys"], ["kid_a", "Vacuum"], ["kid_b", "Tub"], ["kid_b", "Bins"], ["kid_c", "Shoes"]]) if ((n * 7 + label.length) % 3) tick(S.A, kid, label);
      await S.w.flush(); await go(S.w, n, 18); await S.w.flush(); sn.push(J([W.lists(S.A), W.lists(S.B), bankOf(S.w)])); }
    if (sn[0] !== sn[1]) bad.push(isoN(n)); }
  ok("30 days: every kid's four lists (Mom's device and a kid's) and every bank = the app before F", bad.length === 0, bad.slice(0, 3));
  ok("…every write, in order, and the whole database = the app before F", J(N.w.since(m0).map(e => e.op + " " + e.path)) === J(O.w.since(m1).map(e => e.op + " " + e.path)) && J(root(N.w)) === J(root(O.w))); }

// ════════════════════════════════ E · off and preview = the app before F ════════════════════════════════
console.log("\n── E · plan OFF and on preview, 35 days (12/07 – 1/10), ticks + Mom's early ✓ Done today: = the app before F ──");
for (const mode of ["off", "preview"]) {
  const N = await mkW(IDX, HJS, mode), O = await mkW(BASE_IDX, BASE_HJS, mode), bad = [], pvd = [], m0 = N.w.mark(), m1 = O.w.mark();
  for (let n = 0; n < 35; n++) { const sn = [];
    for (const S of [N, O]) { await go(S.w, n, 9); const dow = n % 7;
      if (dow === 0) S.A.run("ktDoneToday('a_vac');ktDoneToday('b_tub');1"); if (dow === 2) S.A.run("ktDoneToday('b_bins');ktDoneToday('a_dust');1"); if (dow === 4) S.A.run("ktDoneToday('c_shoes');1");
      for (const [kid, label] of [["kid_a", "Dishes"], ["kid_b", "Sink"], ["kid_c", "Toys"], ["kid_a", "Vacuum"], ["kid_b", "Bins"]]) if ((n + label.length) % 2) tick(S.A, kid, label);
      await S.w.flush(); await go(S.w, n, 18); await S.w.flush();
      const o = { lists: J(W.lists(S.A)), kid: J(W.lists(S.B)), bank: bankOf(S.w) };
      for (const k of ["kid_a", "kid_b", "kid_c"]) for (const s of ["chores", "stars"]) o["pop_" + k + "_" + s] = S.A.run("(function(){ __pop=''; try{ boardStatPop(" + J(k) + "," + J(s) + ",_todayDay); }catch(e){ return 'threw '+e.message; } return __pop; })()");
      for (const k of ["kid_a", "kid_b", "kid_c"]) o["lg_" + k] = S.A.run("JSON.stringify([lgDayData(" + J(k) + ",0),lgDayData(" + J(k) + ",-1)])");
      o.kc = S.B.run("(function(){ try{ return kcChoresHTML('kid_a')+kcChoresHTML('kid_b'); }catch(e){ return 'threw'; } })()");
      const pv = { person: ["kid_a", "kid_b", "kid_c"].map(k => S.A.run("(function(){ hpSel=" + J(k) + "; return hpPersonHTML(); })()")).join("\n"), tomorrow: S.A.run("hhRoomsTailHTML()"), future: S.A.run("JSON.stringify(hhRoomFuture())") };
      sn.push({ o, pv }); }
    Object.keys(sn[0].o).forEach(k => { if (sn[0].o[k] !== sn[1].o[k]) bad.push(isoN(n) + " " + k); });
    Object.keys(sn[0].pv).forEach(k => { if (sn[0].pv[k] !== sn[1].pv[k]) pvd.push(isoN(n) + " " + k); }); }
  ok(mode + " · every kid's four lists (Mom's device and a kid's) with their check marks, 35 days = the app before F", !bad.some(x => / (lists|kid)$/.test(x)), bad.slice(0, 3));
  ok(mode + " · every bank, every 🧒 Kids today pop-up, the 📒 Ledger and Kids' Corner = the app before F", !bad.length, bad.slice(0, 3));
  ok(mode + " · every write in 35 days, in order (" + N.w.since(m0).length + "), and the whole database = the app before F", J(N.w.since(m0).map(e => e.op + " " + e.path)) === J(O.w.since(m1).map(e => e.op + " " + e.path)) && J(root(N.w)) === J(root(O.w)));
  if (mode === "off") ok("off · the plan preview's drawings too (none drawn)", pvd.length === 0, pvd.slice(0, 3));
  else ok("preview · only the plan preview's drawings change (👤 By person, 🔭 Tomorrow, the grid's future), on " + new Set(pvd.map(x => x.split(" ")[0])).size + " of 35 days, never before 12/07's turns", pvd.length > 0 && pvd.every(x => / (person|tomorrow|future)$/.test(x)), pvd.slice(0, 4));
}

// ════════════════════════════════ F · planted faults ════════════════════════════════
console.log("\n── F · planted faults (each must be caught; each names the rule it breaks) ──");
const FAULTS = [
  ["the window ignored: any earlier done covers (her §1.4: \"Saturday does not\")", "return (g>=1&&g<=N)?l:\"\";", "return (g>=1)?l:\"\";"],
  ["before the start date (the blank slate: nothing acts before 12/07)", "if(!M||!isIso(M.from)||s<M.from||!d", "if(!M||!isIso(M.from)||!d"],
  ["a daily covered (a daily never waits or skips: tomorrow has its own)", "d.k!==\"set\"||!M.cover", "d.k===\"every\"||!M.cover"],
  ["done on the day itself counts as \"before its day\"", "return (g>=1&&g<=N)?l:\"\";", "return (g>=0&&g<=N)?l:\"\";"],
  ["the covered turn still handed out (\"done Mon\" IN PLACE OF a second turn)", "if(cv){ cov[id]={id:id,turn:turn,done:cv,k:d.k}; return; }", "if(cv){ cov[id]={id:id,turn:turn,done:cv,k:d.k}; }"],
  ["a waiting turn done since is still dropped as missed (nothing is taken from a kid by accident)", "for(let i=missed.length-1;i>=0;i--) if(missed[i].id===id&&missed[i].since&&v.done>=missed[i].since) missed.splice(i,1);", ""],
  ["a waiting turn done only before it ends silently (a turn not done drops with its note)", "if(v.done>=c.since){ cands.splice(i,1); return; }", "{ cands.splice(i,1); return; }"],
  ["📌 ignored on a covered day (📌 never drops)", "if(Mk(id,c.k)) return;   // 📌: the old turn goes on", ""],
  ["ov.lastDone (with ✕ skips) read instead of the real done date", "const N=+M.cover[id]||0, l=M.done[id];", "const N=+M.cover[id]||0, l=M.done[id]||(ov.lastDone||{})[id];"],
];
const DFAULTS = [
  ["the Auto window a different size from the card's (\"the same size as the Auto wait\")", "*(j.cycW?Math.max(1,parseInt(j.cycN,10)||4):1)/3)); }", "*(j.cycW?Math.max(1,parseInt(j.cycN,10)||4):1)/2)); }"],
  ["a 🔄 rolling chore given a window (\"not needed: the clock already restarted\")", "if(!j||(j.clock===\"roll\"&&/^(wk:\\d|sat|sun)$/.test(j.cad||\"\"))) return 0;", "if(!j) return 0;"],
  ["a ✕ skip counted as done", "if(/^\\d{4}-\\d{2}-\\d{2}$/.test(j.lastDone||\"\")) o.done[id]=j.lastDone;", "if(/^\\d{4}-\\d{2}-\\d{2}$/.test(j.lastSkip||j.lastDone||\"\")) o.done[id]=j.lastSkip||j.lastDone;"],
];
FAULTS.forEach(([rule, a, b]) => { const n = SRC.split(a).length - 1; if (n !== 1) { ok("fault \"" + rule + "\": its line is found once", false, n); return; }
  const Ef = engOf(SRC.replace(a, () => b)), got = engineChecks(Ef, null).filter(x => !x[1]).map(x => x[0]);
  ok("fault caught — " + rule + " (" + got.length + " check" + (got.length === 1 ? "" : "s") + " fail; first: " + (got[0] || "none").slice(0, 70) + ")", got.length > 0); });
DFAULTS.forEach(([rule, a, b]) => { const n = SRC.split(a).length - 1; if (n !== 1) { ok("fault \"" + rule + "\": its line is found once", false, n); return; }
  const C = dayOf(SRC.replace(a, () => b)), o = {}; C.O(o, { a: { cad: "wk:1", area: "cleaning", lastSkip: "2026-12-07" }, r: { cad: "wk:1", area: "cleaning", clock: "roll" } });
  const cy = { cad: "wk:2", cycW: 1, cycN: 4 }, got = [C.N({ cad: "wk:1" }) === 2, C.N({ cad: "wk:0,3" }) === 1, C.N(cy) === 7, C.N({ cad: "wk:1", clock: "roll" }) === 0, J(o) === J({ cover: { a: 2 }, done: {} })].filter(x => !x).length;
  ok("fault caught — " + rule + " (" + got + " of B's checks fail)", got > 0); });

console.log("\n" + pass + " passed, " + fail + " failed");
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
