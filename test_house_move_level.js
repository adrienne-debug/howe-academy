/*
 * test_house_move_level.js — HOUSEMOVELV (her "Yes, fix that" 2026-11-19, to "Fix the plan moving a chore to a sibling below its
 * level next?"): when the hand-out engine MOVES a house chore off the person whose turn it is, it goes only to someone in who-can
 * whose OWN Cleaning level is at or above the chore's level; nobody at its level with room → it overflows ("fit nobody"), and with
 * the plan ON it becomes the double-stars offer, which only ticked kids at its level see. Made-up family only (kid_a … kid_d).
 *   1 the engine alone (HouseEng sliced from index.html, run in a bare context): a Level 2 chore is not moved to a Level 1 sibling
 *     and overflows; it is moved to a Level 2 sibling; two candidates at different levels; a Level 1 chore moves as before;
 *     grown-ups follow the same rule with their own level; no level stored = Level 1; health and animal chores are never moved;
 *     a carried chore; the next day after a level is raised; nothing passed in is changed
 *   2 parity with the engine before this change (3d275fac): 60 days of HouseEng.run on a made-up table with chores at levels 1–3,
 *     everyone at one level (1, 2, 3, none stored) → byte-for-byte the same plans; with levels that differ, no move ever lands
 *     below a chore's level (and the old engine did make such moves, so the replay can see one)
 *   3 the whole app with the plan ON (test_fixtures/house_overflow_world.js): the chore is on nobody's list, in "fit nobody",
 *     the ×2 offer is seen (and can be done) only by the ticked kid at its level; two candidates; raising the Level 1 sibling's
 *     dial → tomorrow's plan moves it to them (and Mom's "Re-lay today too" does it today)
 *   4 the whole app, everyone at one level (1, 2, 3), chores at mixed levels, plan off / preview / ON for 14 days with check-offs:
 *     every list, Mom's 👤 By person, every write and the whole database = the app before this change (3d275fac)
 *   5 mutation: the level test taken out of the move → the checks of 1 and 3 fail
 *   BASE_HTML=/path/to/before/index.html BASE_HOUSE=/path/to/before/house.js node test_house_move_level.js   (default: `git show
 *   3d275fac:…`, the commit just before this change — pinned, so 2 and 4 mean the same before and after it is on main; no such
 *   commit → 2's parity, 3's contrast and 4 are skipped with a note)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), vm = require("vm"), cp = require("child_process");
const O = require(path.join(__dirname, "test_fixtures", "house_overflow_world.js")), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8"), IDX = path.join(__dirname, "index.html"), SRC = fs.readFileSync(IDX, "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = o => JSON.stringify(o), clone = o => o == null ? o : JSON.parse(J(o));
const BEFORE = "3d275fac", WAS = "the app before this change (" + BEFORE + ")";
const show = f => { try { return cp.execSync("git show " + BEFORE + ":" + f, { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { return null; } };
let BASE = process.env.BASE_HTML, BHJS = process.env.BASE_HOUSE ? fs.readFileSync(process.env.BASE_HOUSE, "utf8") : null;
const TMP = [];
if (!BASE) { const b = show("index.html"); if (b) { BASE = path.join(os.tmpdir(), "house_movelv_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); TMP.push(BASE); } }
if (!BHJS) { const b = show("house.js"); if (b) BHJS = b.toString("utf8"); }
const HAVE_BASE = !!(BASE && BHJS);
console.log("(base: " + (HAVE_BASE ? BASE : "none — git show " + BEFORE + " failed; 2's parity, 3's contrast and 4 are skipped") + ")");
const block = (s, name) => { const a = s.indexOf("// " + name + "_START"), b = s.indexOf("// " + name + "_END"); if (a < 0 || b < a) throw new Error("missing " + name); return s.slice(a, s.indexOf("\n", b)); };
const engineOf = s => { const bare = {}; vm.createContext(bare); vm.runInContext(block(s, "HOUSEENG") + "\nthis.HouseEng=HouseEng;", bare); return bare.HouseEng; };
// The mutation: the move's level test taken out (the move as it was before this change).
const GUARD = "if(w===c.turn||!levelFor(jobs[c.id],w,people)) return;";
const mutate = s => { if (s.split(GUARD).length !== 2) throw new Error("the move's level test is not in index.html exactly once"); return s.replace(GUARD, "if(w===c.turn) return;"); };

// ── 1 · the engine alone ──────────────────────────────────────────────────────────────────────────────────────────────────────
const MON = "2026-11-16", TUE = "2026-11-17", SUN = "2026-11-15";
const KIDS = ["kid_a", "kid_b", "kid_c", "kid_d"], OV = { kids: KIDS, slots: ["morning", "afternoon", "chores", "evening"], on: "2026-11-09" };
// kid_a (the owner) has 10 minutes; kid_b 40 at Level 1; kid_c 20 at Level 2; kid_d none; Mom 30 at Level 2; Dad 30 at Level 1.
const PEOPLE = () => ({ kid_a: { school: 10, weekend: 10, level: 2 }, kid_b: { school: 40, weekend: 40, level: 1 }, kid_c: { school: 20, weekend: 20, level: 2 },
  kid_d: { school: 0, weekend: 0, level: 1 }, mom: { school: 30, weekend: 30, level: 2 }, dad: { school: 30, weekend: 30, level: 1 } });
const row = o => Object.assign({ status: "active", src: { kind: "new" }, area: "cleaning", cad: "daily", slot: "chores", minutes: 15, level: 2, who: "kid_a", pts: 5 }, o);
const one = (o, peep, ov, iso) => ({ jobs: { x: row(o) } });
// Each check: [name, (E) → true when the rule holds]. Run against this branch's engine (all must hold) and the mutated one.
const day = (E, o, peep, ov, iso) => E.day(one(o), iso || MON, peep || PEOPLE(), Object.assign({}, OV, ov || {}));
const at = (p, id) => (p.plan[id] || null), overIds = p => p.over.map(o => o.id);
const PURE = [
  ["a Level 2 chore whose Level 2 owner is full is NOT moved to the Level 1 sibling in who-can (who has room)", E => { const p = day(E, { can: ["kid_a", "kid_b"] }); return !at(p, "x"); }],
  ["…it overflows (fit nobody), with who-can kept as it is, and a daily is carried as a daily overflow is today", E => { const p = day(E, { can: ["kid_a", "kid_b"] }); return J(overIds(p)) === J(["x"]) && J(p.over[0].can) === J(["kid_a", "kid_b"]) && p.over[0].turn === "kid_a" && p.carryOut.length === 1 && !(p.list.kid_b || []).length; }],
  ["it IS moved to a Level 2 sibling (why \"moved\", from the owner)", E => { const x = at(day(E, { can: ["kid_a", "kid_c"] }), "x"); return !!x && x.who === "kid_c" && x.why === "moved" && x.from === "kid_a"; }],
  ["two candidates (Level 1 with 40 min left, Level 2 with 20): the Level 2 one, though the other has more room", E => { const x = at(day(E, { can: ["kid_a", "kid_b", "kid_c"] }), "x"); return !!x && x.who === "kid_c"; }],
  ["…the order on the card doesn't matter (kid_c ticked first)", E => { const x = at(day(E, { can: ["kid_c", "kid_b"] }), "x"); return !!x && x.who === "kid_c"; }],
  ["both candidates at its level: the one with the most minutes left, as before", E => { const P = PEOPLE(); P.kid_b.level = 3; const x = at(day(E, { can: ["kid_a", "kid_b", "kid_c"] }, P), "x"); return !!x && x.who === "kid_b"; }],
  ["the only one at its level has no room → it overflows (not to the lower one with room)", E => { const P = PEOPLE(); P.kid_c.school = 5; const p = day(E, { can: ["kid_a", "kid_b", "kid_c"] }, P); return !at(p, "x") && J(overIds(p)) === J(["x"]); }],
  ["a Level 3 chore (owner at 3): kid_c at 2 is passed over, kid_b at 3 gets it", E => { const P = PEOPLE(); P.kid_a.level = 3; P.kid_b.level = 3; const x = at(day(E, { level: 3, can: ["kid_a", "kid_c", "kid_b"] }, P), "x"); return !!x && x.who === "kid_b"; }],
  ["…and nobody else at 3 → it overflows", E => { const P = PEOPLE(); P.kid_a.level = 3; const p = day(E, { level: 3, can: ["kid_a", "kid_c", "kid_b"] }, P); return !at(p, "x") && J(overIds(p)) === J(["x"]); }],
  ["a person with no level stored counts as Level 1: a Level 2 chore is not moved to them", E => { const P = PEOPLE(); delete P.kid_b.level; return !at(day(E, { can: ["kid_a", "kid_b"] }, P), "x"); }],
  ["grown-ups: Mom's Level 2 chore, Mom full, Dad (Level 1) has room → not moved, it overflows", E => { const P = PEOPLE(); P.mom.school = 10; const p = day(E, { who: "mom", slot: "", can: ["mom", "dad"] }, P); return !at(p, "x") && J(overIds(p)) === J(["x"]); }],
  ["…Dad at Level 2 → moved to Dad", E => { const P = PEOPLE(); P.mom.school = 10; P.dad.level = 2; const x = at(day(E, { who: "mom", slot: "", can: ["mom", "dad"] }, P), "x"); return !!x && x.who === "dad" && x.why === "moved"; }],
  ["…a kid's Level 2 chore with Dad (Level 1, 30 min) and Mom (Level 2, 30 min) ticked → Mom", E => { const x = at(day(E, { can: ["kid_a", "dad", "mom"] }), "x"); return !!x && x.who === "mom"; }],
  ["a carried set-day chore (yesterday's overflow) follows the same rule: not to kid_b; to kid_c", E => {
    const ov = { carry: [{ id: "x", turn: "kid_a", k: "set", since: SUN }] }, a = day(E, { cad: "wk:6", can: ["kid_a", "kid_b"] }, null, ov), b = day(E, { cad: "wk:6", can: ["kid_a", "kid_b", "kid_c"] }, null, ov);
    return !at(a, "x") && J(overIds(a)) === J(["x"]) && !!at(b, "x") && at(b, "x").who === "kid_c" && at(b, "x").why === "moved"; }],
  ["the next day, with kid_b's level raised to 2: moved to kid_b", E => { const P = PEOPLE(); P.kid_b.level = 2; const a = day(E, { can: ["kid_a", "kid_b"] }, null, null, MON), b = day(E, { can: ["kid_a", "kid_b"] }, P, null, TUE); return !at(a, "x") && !!at(b, "x") && at(b, "x").who === "kid_b" && at(b, "x").why === "moved"; }],
  ["…the same through HouseEng.run (Monday fit nobody, then a raise from Tuesday on)", E => { const t = one({ can: ["kid_a", "kid_b"] }), r1 = E.run(t, MON, 1, PEOPLE(), OV), P = PEOPLE(); P.kid_b.level = 2; const r2 = E.run(t, TUE, 2, P, OV); return !r1[0].plan.x && r2.every(p => p.plan.x && p.plan.x.who === "kid_b"); }],
];
const PURE_SAME = [   // these hold before and after (a Level 1 chore, health and animals, the owner with room, purity)
  ["a Level 1 chore still moves as before: to the one with the most minutes left (kid_b, Level 1)", E => { const x = at(day(E, { level: 1, can: ["kid_a", "kid_b", "kid_c"] }), "x"); return !!x && x.who === "kid_b" && x.why === "moved"; }],
  ["…a chore with no level stored is Level 1 (moves to kid_b)", E => { const t = one({ can: ["kid_a", "kid_b"] }); delete t.jobs.x.level; const x = at(E.day(t, MON, PEOPLE(), OV), "x"); return !!x && x.who === "kid_b"; }],
  ["the owner with room keeps it (no move, no level question)", E => { const P = PEOPLE(); P.kid_a.school = 30; const x = at(day(E, { can: ["kid_a", "kid_b"] }, P), "x"); return !!x && x.who === "kid_a" && x.why === "turn"; }],
  ["health and animal chores (any level) stay with their owner, full or not, never moved or overflowed", E => ["health", "animals"].every(a => { const p = day(E, { area: a, level: 3, minutes: 50, can: ["kid_a", "kid_b", "kid_c"] }); return at(p, "x") && at(p, "x").who === "kid_a" && at(p, "x").why === "routine" && !p.over.length; })],
  ["a chore above its owner's level is still not handed out at all", E => { const P = PEOPLE(); P.kid_a.level = 1; const p = day(E, { can: ["kid_a", "kid_c"] }, P); return !at(p, "x") && !p.over.length; }],
  ["nothing passed in is changed (table, people, overrides)", E => { const t = one({ can: ["kid_a", "kid_b", "kid_c"] }), P = PEOPLE(), ov = Object.assign({}, OV, { carry: [{ id: "x", turn: "kid_a", k: "set", since: SUN }] }), s = J([t, P, ov]); E.day(t, MON, P, ov); E.run(t, MON, 5, P, ov); return J([t, P, ov]) === s; }],
];

// ── 2 · the replay table: chores at levels 1–3, who-can, rotations, a wheel on the card, a grown-up turn ──────────────────────
let seed = 20261119; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)], ALL = KIDS.concat(["mom", "dad"]);
function table() {
  const jobs = {}; let n = 0; const add = o => { const id = "j" + (n++); jobs[id] = Object.assign({ status: "active", src: { kind: "new" }, pts: 5, order: n }, o); if (jobs[id].slot === undefined) jobs[id].slot = KIDS.includes(jobs[id].who) ? pick(["chores", "afternoon"]) : ""; return id; };
  const canOf = who => { const c = [who]; ALL.forEach(w => { if (w !== who && rnd() < 0.4) c.push(w); }); return c; };
  const house = o => add(Object.assign({ area: pick(["cleaning", "cleaning", "pickup"]), who: pick(ALL), minutes: pick([3, 5, 5, 10, 10, 15, 20]), level: pick([1, 1, 2, 2, 3]) }, o));
  for (let i = 0; i < 30; i++) { const w = pick(ALL); house({ label: "Daily " + i, cad: "daily", who: w, can: canOf(w) }); }
  for (let i = 0; i < 60; i++) { const w = pick(ALL); house({ label: "Weekday " + i, cad: "wk:" + [...new Set([Math.floor(rnd() * 7), Math.floor(rnd() * 7)])].sort().join(","), who: w, can: rnd() < 0.7 ? canOf(w) : undefined }); }
  for (let i = 0; i < 30; i++) { const w = pick(ALL), N = pick([3, 5, 7, 10, 14, 21]); const o = { label: "Every " + N + " #" + i, cad: N === 14 && i % 2 ? "2w" : N + "d", who: w, can: canOf(w), minutes: pick([10, 15, 20, 25]) }; if (i % 3 === 0) o.lastDone = "2026-11-0" + (1 + (i % 9)); if (i % 5 === 0) o.deepEvery = 3; house(o); }
  for (let i = 0; i < 12; i++) add({ label: "Routine " + i, area: pick(["health", "animals"]), who: pick(ALL), cad: "daily", minutes: 5, level: pick([1, 2, 3]), can: ALL.slice() });
  KIDS.forEach((k, i) => house({ label: "Pickup turn " + k, area: "pickup", who: k, cad: "daily", slot: "afternoon", rot: "pick", minutes: 5, level: 1 + (i % 3), can: KIDS.slice(), order: 100 + i }));   // an old rotation
  const w1 = house({ label: "Wheel A", who: "kid_a", cad: "daily", minutes: 10, level: 2, can: ["kid_a", "kid_b", "kid_c"] }), w2 = house({ label: "Wheel B", who: "kid_b", cad: "3d", minutes: 15, level: 3, can: ["kid_b", "kid_c", "kid_a"] });
  return { jobs, rotations: { r1: { v: { "2026-11-01": { people: ["kid_a", "kid_b", "kid_c"], period: "daily", chores: { [w1]: 0, [w2]: 1 } } } } } };
}
const TABLE = table();
const peopleAt = L => { const P = {}; ALL.forEach((w, i) => { P[w] = { school: [25, 30, 20, 10, 35, 20][i], weekend: [40, 40, 30, 15, 45, 30][i] }; if (L !== undefined) P[w].level = L; }); return P; };
const OVR = Object.assign({}, OV, { rotations: TABLE.rotations, rotPeriod: { pick: "daily" }, minDefault: { pickup: 5, cleaning: 10 } });
const tally = runs => { let moved = 0, movedHi = 0, over = 0; runs.forEach(p => { Object.keys(p.plan).forEach(id => { if (p.plan[id].why === "moved") { moved++; if ((+TABLE.jobs[id].level || 1) >= 2) movedHi++; } }); over += p.over.length; }); return { moved, movedHi, over }; };

// ── 3 / 4 · the whole app ─────────────────────────────────────────────────────────────────────────────────────────────────────
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
// "Wash the windows": kid_a's, Level 2, 40 minutes (never fits kid_a's 30), daily, ticked: kid_a + whoever `can` adds. kid_b has
// 100 minutes at the family's Level 1; kid_a's own dial is 2; `c2` gives kid_c 60 minutes at Level 2.
const winHH = (mode, o) => O.household(mode, { extra: h => { h.jobs.c_a_win = K({ label: "Wash the windows", emoji: "🪟", who: "kid_a", slot: "chores", cad: "daily", minutes: 40, pts: 20, level: 2, can: ["kid_a"].concat(o.can || ["kid_b"]), order: 7 });
  h.people.kid_b = { school: 100, weekend: 100 }; h.levels = { cleaning: { current: 1 }, kid_a: { current: 2 } }; if (o.c2) { h.people.kid_c = { school: 60, weekend: 60 }; h.levels.kid_c = { current: 2 }; } } });
const mkApp = async (mode, hh, index, hjs) => { const w = await O.world("saved", mode, { household: hh, index }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(hjs || HJS); await w.flush(); return { w, A, B }; };
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const onLists = (d, id, dn) => { const L = W.lists(d, { days: [dn] }); return Object.keys(L).filter(k => !/\/raw$/.test(k) && Array.isArray(L[k]) && L[k].some(e => e && e.house === id && !e.hdHidden)); };
const momOnLists = (d, id) => { const L = W.lists(d, { days: [] }); return ["mom", "dad"].filter(k => J(L[k]).indexOf('"' + id + '"') >= 0); };   // Mom's and Dad's lists name a plan row by its chore id
async function appChecks(index, hjs) {   // → [[name, bool, detail]] (run against this branch and the mutated copy)
  const out = [], add = (n, c, x) => out.push([n, !!c, x]);
  { const S = await mkApp("on", winHH("on", {}), index, hjs); await S.w.at(2026, 11, 16, 7, 0);
    const r = clone(S.w.get("houseDay/" + MON)) || {};
    add("plan ON · Kid B (Level 1, 100 min free) does NOT get kid_a's Level 2 chore", !(r.plan || {}).c_a_win, (r.plan || {}).c_a_win);
    add("…it is in Monday's \"fit nobody\" (kid_a's turn, 40 min)", !!(r.over || {}).c_a_win && r.over.c_a_win.turn === "kid_a" && r.over.c_a_win.mins === 40, (r.over || {}).c_a_win);
    add("…on nobody's list (every kid's four lists for Monday, Mom's, Dad's)", onLists(S.B, "c_a_win", "monday").length === 0 && momOnLists(S.A, "c_a_win").length === 0, onLists(S.B, "c_a_win", "monday"));
    add("…the ×2 offer is stored for the ticked kids (as every offer is) at double stars", !!(r.grabs || {}).c_a_win && r.grabs.c_a_win.pts === 40, (r.grabs || {}).c_a_win);
    add("…but only Kid A (ticked, Level 2) sees it; Kid B (ticked, Level 1) does not; Mom's view of Kid B neither", O.x2(S.B, "kid_a").indexOf("c_a_win") >= 0 && O.x2(S.B, "kid_b").indexOf("c_a_win") < 0 && O.x2(S.A, "kid_b", true).indexOf("c_a_win") < 0, [O.x2(S.B, "kid_a"), O.x2(S.B, "kid_b")]);
    const b0 = O.bal(S.w, "kid_b"), m = S.w.mark(); S.B.run("hdGrabDone('kid_b','" + MON + "','c_a_win')"); await S.w.flush();
    add("…Kid B's tap on it writes nothing and pays nothing", S.w.since(m).filter(l => l.op !== "tx").length === 0 && O.bal(S.w, "kid_b") === b0, S.w.since(m).map(l => l.op + " " + l.path));
    const a0 = O.bal(S.w, "kid_a"); S.B.run("hdGrabDone('kid_a','" + MON + "','c_a_win')"); await S.w.flush();
    add("…Kid A can do it: +40 (double 20)", O.bal(S.w, "kid_a") - a0 === 40);
    add("Mom's 👤 By person (Kid B): not among Kid B's chores; under \"Didn’t fit anyone today\"", (() => { const h = S.A.run("hpSel='kid_b'; hpPersonHTML()"), i = h.indexOf("Didn’t fit anyone today"), w = h.indexOf("Wash the windows"); return i > 0 && w > i; })());
  }
  { const S = await mkApp("on", winHH("on", { can: ["kid_b", "kid_c"], c2: true }), index, hjs); await S.w.at(2026, 11, 16, 7, 0);
    const r = clone(S.w.get("houseDay/" + MON)) || {}, x = (r.plan || {}).c_a_win;
    add("two candidates: Kid B (Level 1, 100 min) and Kid C (Level 2, 60 min) → Kid C, why \"moved\", from Kid A", !!x && x.who === "kid_c" && x.why === "moved" && x.from === "kid_a", x);
    add("…on Kid C's Monday chores list, not Kid B's", J(onLists(S.B, "c_a_win", "monday")) === J(["chores/kid_c/monday"]), onLists(S.B, "c_a_win", "monday"));
  }
  { const S = await mkApp("on", winHH("on", {}), index, hjs); await S.w.at(2026, 11, 16, 7, 0); await S.w.at(2026, 11, 16, 9, 0);
    S.A.run("hhLevelSetFor('kid_b',2)"); await S.w.flush();
    add("Mom raises Kid B's dial to 2 (only household/levels/kid_b written): Monday's stored plan is not changed by itself; Mom is asked", !((clone(S.w.get("houseDay/" + MON)) || {}).plan || {}).c_a_win && S.A.run("hdAsking('" + MON + "')") === true && S.w.get("household/levels/kid_b/current") === 2);
    await S.w.at(2026, 11, 17, 7, 0);
    const x = ((clone(S.w.get("houseDay/" + TUE)) || {}).plan || {}).c_a_win;
    add("…Tuesday's plan moves it to Kid B (why \"moved\", from Kid A), on Kid B's Tuesday list", !!x && x.who === "kid_b" && x.why === "moved" && x.from === "kid_a" && J(onLists(S.B, "c_a_win", "tuesday")) === J(["chores/kid_b/tuesday"]), x);
  }
  { const S = await mkApp("on", winHH("on", {}), index, hjs); await S.w.at(2026, 11, 16, 9, 0);
    S.A.run("hhLevelSetFor('kid_b',2)"); await S.w.flush(); S.A.run("hdRelay('" + MON + "')"); await S.w.flush();
    const r = clone(S.w.get("houseDay/" + MON)) || {}, x = (r.plan || {}).c_a_win;
    add("…or Mom's \"Re-lay today too\": moved to Kid B today, out of fit nobody and the ×2 offer taken back", !!x && x.who === "kid_b" && !(r.over || {}).c_a_win && !(r.grabs || {}).c_a_win, [x, (r.over || {}).c_a_win, (r.grabs || {}).c_a_win]);
  }
  return out;
}
// 4: everyone at one level, chores at mixed levels 1–3, several ticked for a sibling or a grown-up; kid_a has 12 minutes, so her
// dishes (Level 1) move every day, and at Levels 2 and 3 Level 2–3 chores move too.
const mixHH = (mode, L) => () => O.household(mode, { extra: h => { const lv = { c_a_dishes: 1, c_b_bath: 2, c_c_toys: 1, c_b_tub: 2, m_fridge: 3, c_b_mop: 3, c_a_vac: 2, d_trash: 3, c_c_beds: 2 };
  h.people.kid_a = { school: 12, weekend: 12 };
  Object.keys(lv).forEach(id => { if (h.jobs[id]) h.jobs[id].level = lv[id]; }); h.jobs.c_b_mop.can = ["kid_b", "kid_a", "kid_c"]; h.jobs.c_c_beds.can = ["kid_c", "kid_b", "mom"];
  h.levels = { cleaning: { current: L } }; } });
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
const isoN = n => { const d = new Date(2026, 10, 16 + n); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-"); };
async function replay(mode, L, days, index, hjs) {
  const S = await mkApp(mode, mixHH(mode, L)(), index, hjs), shots = [];
  for (let n = 0; n < days; n++) { const d = new Date(2026, 10, 16 + n), dn = DN[d.getDay()], at = (h) => S.w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0);
    await at(7); shots.push(J(W.lists(S.B, { days: [dn] })));
    await at(16); for (const k of ["kid_a", "kid_b", "kid_c"]) { S.B.run("(function(){ const st=rtStepsFor('chores','" + k + "',false,'" + dn + "')||[]; const i=st.findIndex(function(s){ return s&&s.house; }); if(i>=0) toggleRtStep('chores','" + k + "',i); })()"); await S.w.flush(); }
    await at(18); shots.push(J(W.lists(S.B, { days: [dn] })) + S.A.run("try{ hhRender(); }catch(e){} ['kid_a','kid_b','kid_c','mom'].map(function(w){ hpSel=w; return hpPersonHTML().replace(typeof hoCardHTML==='function'?hoCardHTML():'',''); }).join('')")); }
  const H = J(S.w.get("houseDay") || {});
  return { shots, writes: writes(S.w, 0).join("\n"), tree: J(S.w.db.tree.root), moved: H.split('"why":"moved"').length - 1, done: H.split('"done":{').length - 1 }; }

(async () => {
const E = engineOf(SRC);
console.log("\n── 1 · the engine alone ──");
PURE.concat(PURE_SAME).forEach(c => ok(c[0], c[1](E)));
const EB = HAVE_BASE ? engineOf(fs.readFileSync(BASE, "utf8")) : null;
if (EB) {
  ok("(contrast) the engine before this change moves that Level 2 chore to the Level 1 sibling (so 1's first check bites)", (() => { const x = at(day(EB, { can: ["kid_a", "kid_b"] }), "x"); return !!x && x.who === "kid_b"; })());
  ok("(contrast) every PURE_SAME check holds on the engine before this change too", PURE_SAME.every(c => c[1](EB)));
}

console.log("\n── 2 · 60-day replay: everyone at one level → the plans of the engine before this change, byte for byte ──");
for (const L of [1, 2, 3, undefined]) {
  const a = E.run(TABLE, MON, 60, peopleAt(L), OVR), t = tally(a), lab = L === undefined ? "no level stored" : "everyone at Level " + L;
  if (EB) { const b = EB.run(TABLE, MON, 60, peopleAt(L), OVR); ok(lab + " · 60 days of plans = " + WAS + " (" + t.moved + " moves, " + t.over + " fit nobody)", J(a) === J(b), (() => { const i = a.findIndex((p, k) => J(p) !== J(b[k])); return i < 0 ? null : [a[i].iso, J(a[i]).slice(0, 300), J(b[i]).slice(0, 300)]; })()); }
  ok(lab + " · (sanity) the replay moves chores and overflows" + (L >= 2 ? ", and moves chores of Level 2+ (" + t.movedHi + ")" : ""), t.moved >= 20 && t.over >= 20 && (!(L >= 2) || t.movedHi >= 5), t);
}
{ const P = peopleAt(2); P.kid_b.level = 1; P.kid_d.level = 1; P.dad.level = 3; P.kid_c.level = 3;
  const bad = runs => { let n = 0; runs.forEach(p => Object.keys(p.plan).forEach(id => { const x = p.plan[id], j = TABLE.jobs[id]; if (x.why === "moved" && (j.area === "cleaning" || j.area === "pickup") && (+j.level || 1) > ((P[x.who] || {}).level || 1)) n++; })); return n; };
  const a = E.run(TABLE, MON, 60, P, OVR);
  ok("levels that differ (Level 1, 2 and 3 people) · 60 days: no move ever lands below the chore's level (" + tally(a).moved + " moves)", bad(a) === 0 && tally(a).moved >= 10, bad(a));
  if (EB) ok("…(contrast) the engine before this change made such moves on the same table (" + bad(EB.run(TABLE, MON, 60, P, OVR)) + ")", bad(EB.run(TABLE, MON, 60, P, OVR)) >= 3);
}

console.log("\n── 3 · the whole app, plan ON ──");
(await appChecks(undefined, HJS)).forEach(c => ok(c[0], c[1], c[2]));
if (HAVE_BASE) { const S = await mkApp("on", winHH("on", {}), BASE, BHJS); await S.w.at(2026, 11, 16, 7, 0); const x = ((clone(S.w.get("houseDay/" + MON)) || {}).plan || {}).c_a_win;
  ok("(contrast) " + WAS + " put it on Kid B's list (so 3 bites)", !!x && x.who === "kid_b" && J(onLists(S.B, "c_a_win", "monday")) === J(["chores/kid_b/monday"]), x); }

console.log("\n── 4 · the whole app, everyone at one level, chores at mixed levels: = " + WAS + " ──");
if (HAVE_BASE) for (const mode of ["off", "preview", "on"]) for (const L of [1, 2, 3]) {
  if (mode !== "on" && L === 3) continue;   // off / preview never read the plan for lists; levels 1 and 2 cover them
  const N = await replay(mode, L, 14, undefined, HJS), B0 = await replay(mode, L, 14, BASE, BHJS), lab = mode + " · everyone at Level " + L;
  const badDay = N.shots.map((s, i) => s === B0.shots[i] ? null : isoN(i >> 1) + (i & 1 ? " 18:00" : " 07:00")).filter(Boolean);
  ok(lab + " · every kid's lists, Mom's and Dad's, Mom's 👤 By person, twice a day for 14 days = " + WAS, badDay.length === 0, badDay.slice(0, 3));
  ok(lab + " · every write, in order (" + N.writes.split("\n").length + ") = " + WAS, N.writes === B0.writes, (() => { const x = N.writes.split("\n"), y = B0.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok(lab + " · the whole database = " + WAS + ", byte for byte", N.tree === B0.tree);
  if (mode === "on") ok(lab + " · (sanity) the plan moved chores (" + N.moved + ") and the kids checked plan rows off (" + N.done + " days with a done)", N.moved >= 14 && N.done >= 10, [N.moved, N.done]);
}
else console.log("  (skipped: no " + BEFORE + ")");

console.log("\n── 5 · mutation: the level test taken out of the move ──");
{ const MUT = path.join(os.tmpdir(), "house_movelv_mut_" + process.pid + ".html"); fs.writeFileSync(MUT, mutate(SRC)); TMP.push(MUT);
  const EM = engineOf(fs.readFileSync(MUT, "utf8")), fails = PURE.filter(c => !c[1](EM)).map(c => c[0]);
  ok("the engine checks of 1 that are about the level now fail (" + fails.length + " of " + PURE.length + ")", fails.length >= 10 && fails.indexOf(PURE[0][0]) >= 0 && fails.indexOf(PURE[3][0]) >= 0, fails.length);
  ok("…while every check that holds before and after still holds", PURE_SAME.every(c => c[1](EM)));
  const am = await appChecks(MUT, HJS), af = am.filter(c => !c[1]).map(c => c[0]);
  ok("the whole-app checks of 3 fail (" + af.length + " of " + am.length + "), the first one among them", af.length >= 5 && af.indexOf(am[0][0]) >= 0, af);
}

console.log("\n" + pass + " passed, " + fail + " failed");
for (const p of TMP) try { fs.unlinkSync(p); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); for (const p of TMP) try { fs.unlinkSync(p); } catch (x) {} process.exit(1); });
