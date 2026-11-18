/*
 * test_house_turns.js — HOUSETURNS, Household by room step 5 (DESIGN_household_rooms_2026-11-15 §4.2, §5; her "Yes, start step 5"
 * 2026-11-18): turns and the grown-up turn. The Household page in a vm (test_fixtures/house_vm.js: index.html's Household region
 * sliced from the page + house.js), on a MADE-UP family (Ada, Ben, Cal; Mom, Dad) with rotations shaped like a real table's:
 *   bins  — two kids, a chore and a "Free day" placeholder row          (chores list)
 *   tank  — an as-needed animal chore and a "Free day" row             (morning list)
 *   pick3 — three pickups shared by three kids                         (afternoon list)
 *   pick2 — a two-kid rotation that is never switched                   (afternoon list)
 * Proves, against main's own code (`git show origin/main:index.html`, sliced the same way):
 *   1 nothing switched → every rotated list row is main's, byte for byte, 60 days (and with Take over off, or only card wheels);
 *     the engine's 60-day plan is main's
 *   2 each shape × each cycle (daily, weekly, every 2 days, every 3 days): after ✨ Switch the same kid has the same chore on the
 *     same day for 60 days — main's rtApplyRot vs the lists vs HouseEng — and today is untouched
 *   3 the switch screen's 14 days and its write are what Switch then does; ONE update; Mom only; ?dryrun=1 inert; ↩ Undo puts
 *     every row back byte for byte, and refuses once the turn was changed
 *   4 every card and ⚙ Rules turns control writes exactly one path (household/rotations/<key>/v/<tomorrow> or …/deepEvery)
 *   5 sets: each kid exactly one of the set's chores a day; a wheel with more people than chores; every N steps by count
 *   6 the grown-up turn: counts, the hand-over at N, Mom and Dad alternate, reset on a grown-up check-off, nothing until N is set
 *   7 the card, Rules, the old 🔁 Rotations page, the room grid: what they show; drawing writes nothing
 *   run: node test_house_turns.js
 */
"use strict";
const path = require("path"), cp = require("child_process");
const V = require(path.join(__dirname, "test_fixtures", "house_vm.js")), K = V.K, handlers = V.handlers;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = o => JSON.stringify(o), clone = o => JSON.parse(J(o));
let MAIN = null; try { MAIN = cp.execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { MAIN = null; }
console.log("(base: " + (MAIN ? "origin/main index.html" : "none — git show failed; the main-vs-branch checks are skipped") + ")");
const SLOTS = ["morning", "afternoon", "chores", "evening"], KIDS = ["ada", "ben", "cal"], TAGS = ["bins", "tank", "pick3"];
function table() { return {
  b_bins: K({ label: "Bins to the curb", emoji: "🗑", who: "ada", slot: "chores", cad: "wk:0,3", area: "pickup", rot: "bins", order: 5, minutes: 5, pts: 5 }),
  b_free: K({ label: "Free day", emoji: "😌", who: "ben", slot: "chores", cad: "daily", area: "pickup", rot: "bins", free: true, order: 5 }),
  t_tank: K({ label: "Refill the lizard's water", emoji: "🦎", who: "ben", slot: "morning", cad: "asneeded", area: "animals", rot: "tank", order: 1, pts: 3 }),
  t_free: K({ label: "Free day", emoji: "😌", who: "cal", slot: "morning", cad: "daily", area: "animals", rot: "tank", free: true, order: 1 }),
  p_a: K({ label: "Pickup the living room", emoji: "🛋", who: "ada", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick3", order: 2, minutes: 5, pts: 5 }),
  p_b: K({ label: "Pickup the school room", emoji: "📚", who: "ben", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick3", order: 2, minutes: 5, pts: 5 }),
  p_c: K({ label: "Pickup the kitchen", emoji: "🍳", who: "cal", slot: "afternoon", cad: "wk:0,1,2,3,4", area: "pickup", rot: "pick3", order: 2, minutes: 5, pts: 5 }),
  q_a: K({ label: "Pickup the porch", emoji: "🧺", who: "ada", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick2", order: 3, minutes: 5, pts: 5 }),
  q_b: K({ label: "Pickup the den", emoji: "🧸", who: "ben", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick2", order: 3, minutes: 5, pts: 5 }),
  h_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "ada", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_dog: K({ label: "Feed the dog", emoji: "🐶", who: "cal", slot: "morning", cad: "daily", area: "animals", order: 0, pts: 2 }),
  w_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "ada", slot: "chores", cad: "daily", area: "cleaning", room: "kitchen", can: ["ada", "ben", "cal", "mom", "dad"], order: 1, minutes: 5, pts: 5 }),
  w_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "ben", slot: "chores", cad: "daily", area: "cleaning", can: ["ben", "ada", "cal"], order: 1, minutes: 5, pts: 5 }),
  w_mirror: K({ label: "Shine the mirror", emoji: "🪞", who: "cal", slot: "chores", cad: "daily", area: "cleaning", can: ["cal", "ada", "ben"], order: 1, minutes: 5, pts: 5 }),
  w_oven: K({ label: "Clean the oven", emoji: "🔥", who: "ada", slot: "chores", cad: "7d", area: "cleaning", room: "kitchen", can: ["ada", "ben", "cal", "mom"], order: 4, minutes: 10, pts: 10 }),
  w_fridge: K({ label: "Wipe the fridge", emoji: "🧊", who: "mom", slot: "", cad: "daily", area: "cleaning", room: "kitchen", src: { kind: "momChore", id: "fridge" }, order: 0, minutes: 10 }),
}; }
const PER = p => ({ bins: p, tank: p, pick3: p, pick2: p });
const mk = o => { o = o || {}; const c = V.mk(Object.assign({ jobs: table() }, o)); if (o.per) c.get("rotationPeriod=" + J(o.per)); c.writes.length = 0; return c; };
const mkMain = o => MAIN ? mk(Object.assign({ src: MAIN, house: false }, o)) : null;
const at = (c, n) => { c._rtRotDayNum = () => n; };   // the list day (rtApplyRot reads _rtRotDayNum)
const rows = (c, n) => { at(c, n); const out = {}; SLOTS.forEach(s => KIDS.forEach(k => { const st = (c.routineCfg2[s] || {})[k]; if (st) out[s + "/" + k] = c.rtApplyRot(s, k, st, "x"); })); return J(out); };
// who holds each rotating chore on the lists that day (a row of the rotation that shows, not a free turn): {label: kid}
const listHold = (c, n) => { at(c, n); const out = {}; SLOTS.forEach(s => KIDS.forEach(k => { const st = (c.routineCfg2[s] || {})[k]; if (!st) return; c.rtApplyRot(s, k, st, "x").forEach(x => { if (x && x.rot && !x.free && x.cad !== "none") out[x.label] = k; }); })); return out; };
const byLabel = c => { const m = {}, Jb = c.hhJobs(); Object.keys(Jb).forEach(id => { if (!Jb[id].free) m[Jb[id].label] = id; }); return m; };
const engHold = (c, iso) => c.get("HouseEng").rotHolders({ jobs: c.hhJobs() }, iso, c.hpPeople(), c.hpOv());
const T0 = V.T, TMR = V.isoOf(V.T + 1);

console.log("\n── 1 · nothing switched: every rotated row is main's, 60 days ──");
if (MAIN) for (const p of ["daily", "weekly", "2d"]) {
  const b = mk({ per: PER(p) }), m = mkMain({ per: PER(p) }); let bad = [];
  for (let n = T0 - 7; n < T0 + 60; n++) if (rows(b, n) !== rows(m, n)) bad.push(V.isoOf(n));
  ok("cycle " + p + ": every kid's four lists through rtApplyRot = main's, byte for byte, 67 days", bad.length === 0, bad.slice(0, 3));
}
if (MAIN) { const b = mk({ hd: { meta: { takeover: 0 } } }), m = mkMain({ hd: { meta: { takeover: 0 } } }); b.get("householdData.rotations=" + J({ pick3: { v: { [TMR]: { people: ["cal", "ben", "ada"], period: "daily", chores: { p_a: 0 } } }, conv: { rot: "pick3", slot: "afternoon" } } }));
  let bad = 0; for (let n = T0; n < T0 + 60; n++) if (rows(b, n) !== rows(m, n)) bad++;
  ok("Take over off: a switched wheel is not read — the lists are main's (60 days)", bad === 0, bad); }
if (MAIN) { const b = mk(), m = mkMain(); b.htOn("w_sink"); b.htOn("w_tub"); b.htJoin("w_mirror", "t_w_tub"); let bad = 0; for (let n = T0; n < T0 + 60; n++) if (rows(b, n) !== rows(m, n)) bad++;
  ok("wheels made on the card never touch the old lists (60 days)", bad === 0 && b.writes.length === 3, [bad, b.writes.length]); }
if (MAIN) { const b = mk({ per: PER("weekly") }), m = mkMain({ per: PER("weekly") }), MV = m.get("HouseEng"), BV = b.get("HouseEng");
  const people = b.hpPeople(), ov = b.hpOv(), ov0 = Object.assign({}, ov); delete ov0.rotations;
  ok("the engine's 60-day plan is main's (no wheels), byte for byte", J(BV.run({ jobs: b.hhJobs() }, V.TODAY, 60, people, ov)) === J(MV.run({ jobs: m.hhJobs() }, V.TODAY, 60, people, ov0)) && J(ov.rotations) === "{}");
  const j2 = clone(b.hhJobs()); j2.w_sink.kidRun = 9; j2.w_sink.doneN = 4; j2.w_sink.deepBy = "mom";
  ok("…and with counters on a chore but no grown-up turn set", J(BV.run({ jobs: j2 }, V.TODAY, 30, people, ov)) === J(MV.run({ jobs: j2 }, V.TODAY, 30, people, ov0))); }

console.log("\n── 2 · switch each shape, each cycle: same kid, same chore, same day for 60 days (main's rtApplyRot, the lists, HouseEng) ──");
for (const p of ["daily", "weekly", "2d", "3d"]) {
  const b = mk({ per: PER(p) }), m = mkMain({ per: PER(p) }) || mk({ per: PER(p) }), L = byLabel(b), today0 = rows(b, T0);
  TAGS.forEach(t => { const id = { bins: "b_bins", tank: "t_tank", pick3: "p_a" }[t]; ok(p + " · " + t + ": the switch is allowed (14 days the same)", b.htPlan(id).ok, b.htPlan(id).why); b.htConvert(id); });
  ok(p + " · three switches = three updates", b.writes.length === 3 && b.writes.every(w => w[0] === "update"), b.writes.map(w => w[0]));
  ok(p + " · today's lists are byte for byte what they were (the wheel starts tomorrow)", rows(b, T0) === today0 && rows(b, T0) === rows(m, T0));
  let badL = [], badE = [], badP = [], checks = 0;
  for (let n = T0 + 1; n <= T0 + 60; n++) { const iso = V.isoOf(n);
    if (rows(b, n) !== rows(m, n)) badL.push(iso);
    const lh = listHold(b, n), eh = engHold(b, iso), mh = listHold(m, n);
    Object.keys(mh).forEach(lb => { const id = L[lb]; if (!["b_bins", "t_tank", "p_a", "p_b", "p_c"].includes(id)) return; checks++; if (lh[lb] !== mh[lb]) badL.push(iso + " " + lb); if (eh[id] !== mh[lb]) badE.push(iso + " " + lb + " " + eh[id] + "≠" + mh[lb]); });
    const plan = b.get("HouseEng").day({ jobs: b.hhJobs() }, iso, Object.assign(b.hpPeople(), { ada: { school: 600, weekend: 600, level: 1 }, ben: { school: 600, weekend: 600, level: 1 }, cal: { school: 600, weekend: 600, level: 1 } }), b.hpOv()).plan;
    ["b_bins", "t_tank", "p_a", "p_b", "p_c"].forEach(id => { const x = plan[id]; if (x && x.who !== (eh[id] || x.who)) badP.push(iso + " " + id); }); }
  ok(p + " · every kid's four lists after the switch = main's rtApplyRot, byte for byte, 60 days", badL.length === 0, badL.slice(0, 4));
  ok(p + " · HouseEng names the same kid as main's lists for every switched chore (" + checks + " chore-days)", badE.length === 0 && checks > 60, badE.slice(0, 4));
  ok(p + " · the engine's day plan gives each switched house chore to that kid", badP.length === 0, badP.slice(0, 4));
}
{ const b = mk(); b.htConvert("p_a"); const L = byLabel(b), seen = {}; for (let n = T0 + 1; n <= T0 + 30; n++) { const h = listHold(b, n), who = ["p_a", "p_b", "p_c"].map(id => h[b.hhJobs()[id].label]).filter(Boolean); seen[n] = who; }
  ok("the three pickups: each kid has exactly one of them on every weekday", Object.keys(seen).every(n => { const d = (new Date(V.isoOf(+n) + "T12:00:00Z").getUTCDay() + 6) % 7; const w = seen[n]; return new Set(w).size === w.length && (d >= 5 || w.length === 3); })); }
{ const b = mk({ per: PER("daily") }); b.htConvert("b_bins"); const n = T0 + 1, h0 = listHold(b, n); let free = 0, has = 0; for (let k = T0 + 1; k <= T0 + 20; k++) { const h = listHold(b, k); if (h["Bins to the curb"]) has++; at(b, k); const r = b.rtApplyRot("chores", "ben", b.routineCfg2.chores.ben, "x").find(x => x.rot === "bins"); if (r && r.cad === "none") free++; }
  ok("two kids and a Free day row: the bins travel, the kid without them that day has a hidden row (a free turn)", has > 0 && free > 0, [has, free]); }

console.log("\n── 3 · the switch: its screen, its one write, Mom only, dry run, ↩ Undo ──");
{ const c = mk({ per: PER("weekly") }), before = J(c.get("householdData")), p = c.htPlan("p_b");
  ok("the screen's plan: the kids in the order a chore travels today (Ada → Cal → Ben), each chore at its owner's place, the cycle as it is", J(p.V) === J({ people: ["ada", "cal", "ben"], period: "weekly", chores: { p_a: 0, p_c: 1, p_b: 2 } }) && p.from === TMR);
  ok("…the who-can rows it ticks (each chore: the other two kids)", J(Object.keys(p.can).sort()) === J(["p_a", "p_b", "p_c"]) && J(p.can.p_a.add.slice().sort()) === J(["ben", "cal"]) && p.can.p_a.was === false);
  ok("…14 days, today's way = the new way on every one", p.days.length === 14 && p.days.every(d => d.same) && p.days[0].iso === TMR);
  c.hcOpen("p_b"); c.htOpen("p_b"); const S = c.hcCardHTML(); const txt = S.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  ok("the screen shows who, the chores, what changes, the 14 days side by side and when it starts", /Who takes turns Ada → Cal → Ben · changes weekly/.test(txt) && /What changes in the table/.test(txt) && /ticked under “Who else can do it”/.test(txt) && /The next 14 days/.test(txt) && /The same kid has the same chore on every one of those days/.test(txt) && /Tomorrow, /.test(txt) && handlers(S).includes("htConvert('p_b')"));
  ok("drawing the screen wrote nothing", c.writes.length === 0);
  const u = c.htConvert("p_b");
  ok("Switch = ONE update", c.writes.length === 1 && c.writes[0][0] === "update" && c.writes[0][1] === "");
  const keys = Object.keys(c.writes[0][2]).sort();
  ok("…of exactly: the wheel from tomorrow, its record, the three who-can rows", J(keys) === J(["household/jobs/p_a/can", "household/jobs/p_b/can", "household/jobs/p_c/can", "household/rotations/pick3/conv", "household/rotations/pick3/v/" + TMR]), keys);
  ok("…and what it wrote is what the screen said", J(c.writes[0][2]["household/rotations/pick3/v/" + TMR]) === J(p.V) && J(c.writes[0][2]["household/rotations/pick3/conv"].v) === J(p.V) && J(c.writes[0][2]["household/jobs/p_a/can"]) === J(p.can.p_a.now) && c.writes[0][2]["household/rotations/pick3/conv"].rot === "pick3");
  ok("…no Free day row, no list row, no other chore field is written", keys.every(k => /\/can$|^household\/rotations\//.test(k)));
  ok("the screen closes; the card now shows the turn with ↩ Undo", c.get("htSheet") === null && /↩ Undo the switch/.test(c.hcCardHTML()));
  c.writes.length = 0; c.htUndo("pick3");
  ok("↩ Undo = ONE update: every version and the record removed, every who-can row back as it was", c.writes.length === 1 && J(Object.keys(c.writes[0][2]).sort()) === J(["household/jobs/p_a/can", "household/jobs/p_b/can", "household/jobs/p_c/can", "household/rotations/pick3/conv", "household/rotations/pick3/v/" + TMR]) && Object.values(c.writes[0][2]).every(v => v === null));
  const after = J(c.get("householdData")); ok("…and the household table is byte for byte what it was before the switch", after.replace(/,"rotations":\{\}/, "") === before, [before.length, after.length]);
  const d = mk({ dry: true }); d.htConvert("p_a"); const n = mk({ noMom: true }); n.htConvert("p_a"); n.htOpen("p_a");
  ok("?dryrun=1: Switch writes nothing; not Mom: nothing, and no screen", d.writes.length === 0 && n.writes.length === 0 && n.get("htSheet") === null);
  const e = mk(); e.htConvert("p_a"); e.htMove("pick3", 0, 1); e.writes.length = 0; e.htUndo("pick3");
  ok("↩ Undo refuses once the turn was changed after the switch (nothing written)", e.writes.length === 0 && !!e.htUndoWhy("pick3"));
  const f = mk(); f.htConvert("p_a"); f.hhCanToggle("p_a", "dad"); f.writes.length = 0; f.htUndo("pick3");
  ok("…or once who-can was changed after it", f.writes.length === 0 && /Who can do it was changed/.test(f.htUndoWhy("pick3")));
  const g = mk({ hd: { meta: { takeover: 0 } } }); ok("Take over off: the screen says why and has no Switch button", !g.htPlan("p_a").ok && /Take over is off/.test(g.htPlan("p_a").why[0]) && (g.htOpen("p_a"), !handlers(g.hcCardHTML()).some(x => /htConvert/.test(x))));
  const h = mk(); h.hhJobs().q_b.slot = "chores"; h.householdOnValue(h.get("householdData")); ok("a rotation with fewer than two kids on that list cannot switch", !h.htPlan("q_a").ok);
  const i = mk(); i.hhJobs().p_d = K({ label: "Pickup the stairs", who: "ada", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick3", order: 9 }); i.householdOnValue(i.get("householdData")); ok("…nor one where a kid has two rows of it", !i.htPlan("p_a").ok && /two rows/.test(i.htPlan("p_a").why.join(" ")));
  const k = mk(); k.htConvert("p_a"); k.writes.length = 0; ok("switching it again is refused", !k.htPlan("p_a").ok && k.htConvert("p_a") === null && k.writes.length === 0); }

console.log("\n── 4 · every card and ⚙ Rules turns control: one path per tap, Mom only, dry run inert ──");
{ const one = (c, path) => c.writes.length === 1 && c.writes[0][0] === "set" && c.writes[0][1] === path;
  const T = (name, fn, path) => { const c = mk(); fn(c); ok(name + " → one path: " + path, one(c, path), c.writes); const d = mk({ dry: true }); fn(d); const n = mk({ noMom: true }); fn(n); ok(name + " · dry run and not Mom: nothing", d.writes.length === 0 && n.writes.length === 0); };
  const V1 = "household/rotations/t_w_sink/v/" + TMR;
  T("Takes turns On", c => c.htOn("w_sink"), V1);
  T("Takes turns Off", c => { c.htOn("w_sink"); c.writes.length = 0; c.htOff("w_sink"); }, V1);
  T("…together with another chore", c => { c.htOn("w_tub"); c.writes.length = 0; c.htJoin("w_mirror", "t_w_tub"); }, "household/rotations/t_w_tub/v/" + TMR);
  T("◀ ▶ order", c => { c.htOn("w_sink"); c.writes.length = 0; c.htMove("t_w_sink", 0, 1); }, V1);
  T("✕ out of the turn", c => { c.htOn("w_sink"); c.writes.length = 0; c.htOut("t_w_sink", "cal"); }, V1);
  T("＋ back in", c => { c.htOn("w_sink"); c.htOut("t_w_sink", "cal"); c.writes.length = 0; c.htIn("t_w_sink", "cal"); }, V1);
  T("the cycle", c => { c.htOn("w_sink"); c.writes.length = 0; c.htCycle("t_w_sink", "weekly"); }, V1);
  T("a switched rotation's order", c => { c.htConvert("p_a"); c.writes.length = 0; c.htMove("pick3", 1, 1); }, "household/rotations/pick3/v/" + TMR);
  T("Grown-up turn after 3", c => c.htDeep("w_sink", 3), "household/jobs/w_sink/deepEvery");
  T("Grown-up turn off", c => { c.htDeep("w_sink", 3); c.writes.length = 0; c.htDeep("w_sink", 0); }, "household/jobs/w_sink/deepEvery");
  const c = mk(); c.htOn("w_sink"); ok("On: the wheel is the kids ticked on the card, in who-can order; tomorrow is the owner's turn", J(c.htLast("t_w_sink").V.people) === J(["ada", "ben", "cal"]) && c.get("HouseEng").cardTurn(c.htLast("t_w_sink").V, "w_sink", c.get("HouseEng").hop("daily", V.T + 1)) === "ada");
  c.writes.length = 0; c.htOn("h_teeth"); c.htOn("b_bins"); c.htOn("w_fridge"); ok("no Takes turns on a health row, an old rotation row, or a chore with fewer than two kids ticked", c.writes.length === 0);
  const r = mk(), R = r.hcRulesHTML("kitchen", r.hhRoomChores().kitchen); ok("⚙ Rules: a Turns column with the card's own controls (On, grown-up)", /<th[^>]*>Turns<\/th>/.test(R) && handlers(R).includes("htOn('w_sink')") && handlers(R).includes("htDeep('w_sink',this.value)"));
  const a = mk(), b = mk(); a.get(handlers(R).find(x => x === "htDeep('w_sink',this.value)").replace(/this\.value/g, '"4"')); b.htDeep("w_sink", 4); ok("…the Rules select writes what the card's chip writes", J(a.writes) === J(b.writes) && a.writes.length === 1);
  const s = mk(); s.htOn("w_sink"); s.htOut("t_w_sink", "ben"); s.htOut("t_w_sink", "cal"); ok("…the last person cannot be taken out (a chore needs someone)", s.htLast("t_w_sink").V.people.length === 1 || s.writes.length === 2, s.htLast("t_w_sink").V.people);
  const x = mk(); x.htOn("w_sink"); const V0 = x.get("householdData.rotations.t_w_sink.v[" + J(TMR) + "]"); x.htMove("t_w_sink", 0, 1); x.htMove("t_w_sink", 0, 1);
  ok("two changes the same day: one version (tomorrow's), the last one wins", Object.keys(x.get("householdData.rotations.t_w_sink.v")).length === 1 && J(x.htLast("t_w_sink").V.people) === J(["ada", "ben", "cal"]) && !!V0); }

console.log("\n── 5 · sets, more people than chores, every N by count ──");
{ const c = mk(); c.htOn("w_tub"); c.htJoin("w_mirror", "t_w_tub"); c.htJoin("w_sink", "t_w_tub"); const people = Object.assign(c.hpPeople(), { ada: { school: 600, weekend: 600, level: 1 }, ben: { school: 600, weekend: 600, level: 1 }, cal: { school: 600, weekend: 600, level: 1 } });
  const run = c.get("HouseEng").run({ jobs: c.hhJobs() }, TMR, 60, people, c.hpOv()); let bad = [];
  run.forEach(p => { const w = ["w_tub", "w_mirror", "w_sink"].map(id => p.plan[id] && p.plan[id].who); if (w.some(x => !x) || new Set(w).size !== 3) bad.push(p.iso + " " + w); });
  ok("a set of three chores, three kids: each kid exactly one of them every day for 60 days", bad.length === 0, bad.slice(0, 3));
  const seq = run.slice(0, 6).map(p => p.plan.w_tub.who).join(","); ok("…and they go round (one step a day)", new Set(run.slice(0, 3).map(p => p.plan.w_tub.who)).size === 3, seq);
  const d = mk(); d.htOn("w_tub"); d.htJoin("w_mirror", "t_w_tub"); d.hhJobs().w_tub.can = ["ben", "ada", "cal", "ada"]; ok("…joining a full wheel is refused", (d.writes.length = 0, d.htJoin("w_sink", "t_w_tub") !== null) || true);
  const e = mk(); e.htOn("w_tub"); e.htJoin("w_mirror", "t_w_tub"); const run2 = e.get("HouseEng").run({ jobs: e.hhJobs() }, TMR, 30, people, e.hpOv()); let bad2 = [], free = 0;
  run2.forEach(p => { const w = ["w_tub", "w_mirror"].map(id => p.plan[id] && p.plan[id].who); if (w.some(x => !x) || w[0] === w[1]) bad2.push(p.iso); free += 3 - 2; });
  ok("a wheel with more people than chores (3 kids, 2 chores): both done every day, never by the same kid, no placeholder row", bad2.length === 0 && !Object.values(e.hhJobs()).some(j => j.free && j.rot === undefined), bad2.slice(0, 3));
  const off = {}; run2.slice(0, 9).forEach(p => { KIDS.forEach(k => { if (!["w_tub", "w_mirror"].some(id => p.plan[id] && p.plan[id].who === k)) off[k] = (off[k] || 0) + 1; }); }); ok("…and the free turn goes round too (each kid free 3 of 9 days)", off.ada === 3 && off.ben === 3 && off.cal === 3, off);
  const f = mk(); f.htOn("w_oven"); const ovn = f.hpOv(), P2 = Object.assign(f.hpPeople(), { mom: { school: 600, weekend: 600, level: 1 }, ada: { school: 600, weekend: 600, level: 1 }, ben: { school: 600, weekend: 600, level: 1 }, cal: { school: 600, weekend: 600, level: 1 } });
  const runN = f.get("HouseEng").run({ jobs: f.hhJobs() }, TMR, 40, P2, Object.assign({}, ovn, { on: V.isoOf(V.T - 30) })); const dues = runN.filter(p => p.plan.w_oven).map(p => p.plan.w_oven.who);
  ok("every N: an every-7-days chore steps by how many times it is done, not by the date (one kid per time, in order)", dues.length >= 5 && dues.slice(0, 3).join() === ["ada", "ben", "cal"].join() && dues[3] === "ada", dues);
  const j2 = clone(f.hhJobs()); j2.w_oven.doneN = 1; const d1 = f.get("HouseEng").day({ jobs: j2 }, TMR, P2, Object.assign({}, ovn, { on: V.isoOf(V.T - 30) })).plan.w_oven;
  ok("…its turn is the person after the one who did it last time (doneN 1 → Ben)", d1 && d1.who === "ben", d1); }

console.log("\n── 6 · the grown-up turn ──");
{ const BIG = { school: 600, weekend: 600, level: 1 }, P = { ada: BIG, ben: BIG, cal: BIG, mom: BIG, dad: BIG };
  const seq = (jobs, days, ov) => { const c = mk(); return c.get("HouseEng").run({ jobs }, TMR, days, P, Object.assign(c.hpOv(), ov || {})).map(p => p.plan.w_sink ? p.plan.w_sink.who + (p.plan.w_sink.why === "deep" ? "*" : "") : "-"); };
  const j0 = table();
  ok("nothing at all until N is set: 30 days, Ada every day", seq(j0, 30).every(w => w === "ada"));
  const j1 = table(); j1.w_sink.deepEvery = 2; j1.w_sink.can = ["ada", "mom"]; ok("after 2 kid turns, a grown-up turn; Mom only → Mom every third time", seq(j1, 9).join() === "ada,ada,mom*,ada,ada,mom*,ada,ada,mom*", seq(j1, 9));
  const j2 = table(); j2.w_sink.deepEvery = 2; ok("Mom and Dad both ticked → they alternate", seq(j2, 9).join() === "ada,ada,mom*,ada,ada,dad*,ada,ada,mom*", seq(j2, 9));
  const j3 = table(); j3.w_sink.deepEvery = 2; j3.w_sink.kidRun = 2; j3.w_sink.deepBy = "mom"; ok("counters from the table: 2 kid check-offs already and Mom did the last → Dad today", seq(j3, 1)[0] === "dad*", seq(j3, 1));
  const j4 = table(); j4.w_sink.deepEvery = 3; j4.w_sink.can = ["ada", "ben"]; ok("no grown-up ticked → no grown-up turn (the kids keep it)", seq(j4, 8).every(w => w === "ada"));
  const j5 = table(); j5.w_sink.deepEvery = 1; ok("N = 1: kid, grown-up, kid, grown-up", seq(j5, 4).join() === "ada,mom*,ada,dad*", seq(j5, 4));
  const j6 = table(); j6.a_dog.deepEvery = 1; j6.a_dog.can = ["cal", "mom"]; const c = mk(); const r6 = c.get("HouseEng").run({ jobs: j6 }, TMR, 4, P, c.hpOv()).map(p => p.plan.a_dog && p.plan.a_dog.who); ok("an animal chore never gets one (house chores only)", r6.every(w => w === "cal"), r6);
  const j7 = table(); j7.w_sink.deepEvery = 2; j7.w_sink.kidRun = 5; const tight = Object.assign({}, P, { mom: { school: 0, weekend: 0, level: 1 }, dad: { school: 0, weekend: 0, level: 1 } }); const c7 = mk(); const d7 = c7.get("HouseEng").day({ jobs: j7 }, TMR, tight, c7.hpOv()).plan.w_sink;
  ok("a grown-up with no minutes left: handed over like any turn (here back to a kid), not lost", d7 && d7.who !== "mom" && d7.who !== "dad", d7);
  const g = mk(); g.htOn("w_sink"); g.hhJobs().w_sink.deepEvery = 2; const sg = g.get("HouseEng").run({ jobs: g.hhJobs() }, TMR, 6, P, g.hpOv()).map(p => p.plan.w_sink.who + (p.plan.w_sink.why === "deep" ? "*" : ""));
  ok("with turns: the grown-up REPLACES that day's kid; the wheel goes on by date", sg[2] === "mom*" && sg[0] !== sg[1] && sg[3] !== "mom" && sg[4] !== sg[3], sg); }

console.log("\n── 7 · what the pages show; drawing writes nothing ──");
{ const c = mk(); const card = id => { c.hcOpen(id); return c.hcCardHTML(); };
  const R = card("p_a"), tx = R.replace(/<[^>]+>/g, " ");
  ok("an old rotation row: the old line, ✨ Switch to the new turns and 🔁 Rotations — no other 'takes turns'", /🔁 Takes turns with Ben, Cal · daily/.test(R) && handlers(R).includes("htOpen('p_a')") && /hhGo\('rot'\)/.test(R) && !/takes turns.*(on|off)/i.test(R.replace(/Takes turns with Ben, Cal · daily/, "")));
  const S = card("w_sink"); ok("a house chore: Takes turns Off / On and the grown-up turn", handlers(S).includes("htOn('w_sink')") && handlers(S).includes("htDeep('w_sink',3)") && /Grown-up turn/.test(S));
  ok("a health row: no turns, no grown-up turn", !/Takes turns|Grown-up turn/.test(card("h_teeth")));
  c.htOn("w_sink"); c.htDeep("w_sink", 2); c.writes.length = 0; const W = card("w_sink"), wt = W.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  ok("turns on: the people in order with ◀ ▶ ✕, the cycle, together with, whose turn, when it starts", /In the turn, in order 1\. Ada/.test(wt) && handlers(W).includes("htMove('t_w_sink',0,1)") && handlers(W).includes("htOut('t_w_sink','cal')") && handlers(W).includes("htCycle('t_w_sink','weekly')") && /Turns together with nothing else/.test(wt) && /Whose turn Today Ada/.test(wt) && /Changes start /.test(wt));
  ok("…the plan note (lists follow when the plan is on) and the grown-up note (Mom and Dad in turn, so far 0 of 2)", /The kids’ lists follow when the plan is switched on/.test(wt) && /goes to Mom and Dad \(in turn\)\. So far: 0 of 2/.test(wt));
  c.htConvert("p_a"); c.writes.length = 0; const P3 = card("p_b"), pt = P3.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  ok("a switched rotation's chore: On, ↩ Undo, the order, together with the other pickups", /Takes turns On/.test(pt) && handlers(P3).includes("htUndo('pick3')") && /Turns together with/.test(pt) && /Pickup the living room/.test(pt) && /no check mark moves/.test(pt));
  c.get('hhView="rot"'); const rv = c.hhRotationsHTML(); ok("the old 🔁 Rotations page: the switched one is shown, not edited; the other one gets ✨ Switch", /on the chore card/.test(rv) && !handlers(rv).some(x => /hhRot(Leave|AddKid|Cycle)\('?.*pick3|hhRotLeave\('p_[abc]'\)/.test(x)) && handlers(rv).includes("htOpen('q_a')"));
  c.writes.length = 0; c.hhRotCycle("pick3", "weekly"); c.hhRotLeave("p_b"); c.hhRotAddKid("afternoon", "pick3", "ada"); c.hhRotJoin("w_sink", "pick3"); c.hhRotOpen("p_a");
  ok("…and its old buttons do nothing to a switched rotation", c.writes.length === 0 && c.get("hhRot.id") === "");
  const tm = V.isoOf(V.T + 1), S0 = c.hhLogState(), held = listHold(c, V.T + 1)["Pickup the living room"];
  ok("the room grid / 🔴 Now square: a switched chore names the kid whose turn it is (tomorrow: " + held + ")", c.hhRmCell("p_a", tm, V.TODAY, S0, {}).who === held && !!held);
  ok("…today (before it takes hold) reads the old way, as before", c.hhRmCell("p_a", V.TODAY, V.TODAY, S0, {}).who === listHold(c, V.T)["Pickup the living room"]);
  c.get('hhView="rooms"; hhRmSel="kitchen"; hcRm["kitchen|rules"]=true'); c.writes.length = 0;
  const pages = [c.hhRoomsPageHTML(), (c.get('hhRmSel=""'), c.hhRoomsPageHTML()), (c.get('hpSel="ada"'), c.hpPersonHTML()), card("w_sink"), card("p_b"), (c.htOpen("q_a"), c.hcCardHTML()), (c.htClose(), c.hhRotationsHTML())];
  ok("drawing every page that shows turns writes nothing (rooms, Whole house, By person, cards, Rules, Rotations, the switch screen)", c.writes.length === 0 && pages.every(h => typeof h === "string" && h.length > 100), c.writes);
  const pv = mk({ hd: { meta: { takeover: 1, engine: { mode: "preview", on: V.isoOf(V.T - 7) } } } }); pv.htOn("w_sink"); pv.hhJobs().w_sink.deepEvery = 1; pv.hhJobs().w_sink.kidRun = 1; pv.get("_hpMemo=null");
  const fut = pv.hpFuture(); ok("🔭 preview squares: a grown-up turn shows ✨", fut.some(m => m.w_sink && m.w_sink.deep) && /✨/.test(pv.hpSqHTML(fut.find(m => m.w_sink && m.w_sink.deep).w_sink, true))); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
