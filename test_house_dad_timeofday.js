/*
 * test_house_dad_timeofday.js — Household step 7 slice 4, "Dad, pinned" (PLAN_house_step7_2026-11-19 §2 "Dad", §5 row 4). No app code:
 * this test pins what the plan says Dad already gets. "He has no school cards, so nothing changes for him: his chores already show in
 * 🗓 My schedule today by their time of day. With the plan ON, his plan rows (a grown-up turn included) reach that list through dcAll
 * with the chore's time of day … No gap-fitting for Dad, as the design says (§4.5)."
 * The WHOLE app (test_fixtures/house_world.js: every device runs index.html over one in-memory Firebase and one virtual clock) on the
 * MADE-UP demo family (kid_a … kid_d, Mom, Dad). No real family's names or data. Dad's own rows here are made up:
 *   Start the coffee (Morning) · Bring in the mail (Afternoon) · Lock the doors (Night) · Trash to the curb (any time, the fixture's)
 * and two grown-up turns that land on him with the plan ON (kidRun reached):
 *   Wipe the bathroom sink (kid_b's, on the kids' "chores" list → Any time) · Scrub the porch steps (kid_a's, Afternoon → 12:00 PM)
 * Dad's daily limit is 60 min here (the fixture's 15 would leave his own rows to nobody — see the note at the end of the run).
 *
 *   A  plan ON: every plan row of his (the two grown-up turns too) is on 🗓 My schedule today at its time of day — Morning 7:00 AM,
 *      Afternoon 12:00 PM, Night 5:00 PM, else ANY TIME — the same minute at 7:00, 10:30, 1:10 and 4:00 (no gap-fitting)
 *   B  plan off: his own list by time of day, as today; the kids' chores stay the kids'
 *   C  both: his schedule is the same whatever Mom's "Mixed in" switch or his own Mixed in / School first says, has no "in a gap"
 *      and no ⏰ chip, and is byte-identical to this tree with step 7 (HOUSEGAP · HOUSEMIX · HOUSECHIP) cut out
 *   D  planted faults (on copies of index.html): his chores fitted to the clock · a plan row's time of day dropped · a grown-up turn
 *      left off his list → a check above fails
 *
 *   run:  node test_house_dad_timeofday.js
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const SRC = fs.readFileSync(path.join(__dirname, "index.html"), "utf8"), MINE = path.join(__dirname, "index.html");
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return s.slice(i, s.indexOf("\n", j) + 1); };
const TMP = []; const tmp = (tag, text) => { const f = path.join(os.tmpdir(), "house_dad_tod_" + tag + "_" + process.pid + ".html"); fs.writeFileSync(f, text); TMP.push(f); return f; };
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
function household(mode, momFit, dadFit) { const h = W.household(mode);
  h.jobs.d_coffee = K({ label: "Start the coffee", who: "dad", slot: "morning", cad: "daily", minutes: 5, src: { kind: "dadChore", id: "coffee" }, order: 1 });
  h.jobs.d_mail = K({ label: "Bring in the mail", who: "dad", slot: "afternoon", cad: "daily", minutes: 5, src: { kind: "dadChore", id: "mail" }, order: 2 });
  h.jobs.d_lock = K({ label: "Lock the doors", who: "dad", slot: "night", cad: "daily", minutes: 5, src: { kind: "dadChore", id: "lock" }, order: 3 });
  const j = h.jobs.c_b_bath; j.deepEvery = 2; j.can = ["kid_b", "mom", "dad"]; j.kidRun = 2; j.deepBy = "mom";   // Mom had the last turn → Dad's
  h.jobs.p_a_steps = K({ label: "Scrub the porch steps", emoji: "🧽", who: "kid_a", slot: "afternoon", cad: "daily", minutes: 10, pts: 5, can: ["kid_a", "dad"], deepEvery: 2, kidRun: 2, order: 7 });
  h.people.dad = { school: 60, weekend: 60 }; if (dadFit) h.people.dad.fit = dadFit; if (momFit) h.people.mom.fit = momFit; return h; }
// The expected place of each of his chores, from the table above (not from the app): the time of day's minute, or ANY TIME.
const SLOT = { morning: 7 * 60, afternoon: 12 * 60, night: 17 * 60 };
const EXPECT = { d_coffee: ["coffee", "Start the coffee", SLOT.morning], d_mail: ["mail", "Bring in the mail", SLOT.afternoon], d_lock: ["lock", "Lock the doors", SLOT.night], d_trash: ["trash", "Trash to the curb", null],
  c_b_bath: ["c_b_bath", "Wipe the bathroom sink", null], p_a_steps: ["p_a_steps", "Scrub the porch steps", SLOT.afternoon] };
const OWN = ["d_coffee", "d_mail", "d_lock", "d_trash"], DEEP = ["c_b_bath", "p_a_steps"];
const T12 = m => { let h = Math.floor(m / 60); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m % 60).padStart(2, "0") + " " + ap; };
const TIMES = [[7, 0], [10, 30], [13, 10], [16, 0]];
const SHOW = "(function(){ const dn=mdTodayName(); return JSON.stringify({html:dadSchedHTML(dn), items:dadSchedItems(dn).filter(function(x){ return x.kind==='chore'; }).map(function(x){ return [x.id,x.m]; })}); })()";
// 🗓 My schedule today as drawn: [[header, [labels…]], …] (a header is "7:00 AM" … or "ANY TIME").
const drawn = html => String(html).split(/<div style="font-size:11px;font-weight:800;color:#2C5F8A;letter-spacing:\.03em;padding:8px 0 4px">/).slice(1).map(seg => { const hd = seg.slice(0, seg.indexOf("<"));
  return [hd, Object.values(EXPECT).map(e => e[1]).filter(l => seg.includes(l))]; });
async function run(o) {
  const w = await W.world({ household: household(o.mode, o.momFit, o.dadFit), index: o.index || MINE }); await w.at(2026, 11, 16, 7, 0);
  const A = w.boot("A", "devA", { mom: true }); await w.flush(); const D = w.boot("D", "devD"); await w.flush(); const out = [];
  for (const t of TIMES) { await w.at(2026, 11, 16, t[0], t[1]); await w.flush();
    if (t[0] === 13) { A.run("(function(){ const c=mpSchTasks('all',mdTodayName()).filter(function(t){ return t.who==='kid_b'&&!checked[t.id]; })[0]; if(c) finalizeDone(c.id,nowTs()); })()"); await w.flush(); }   // the school day moves
    const s = JSON.parse(D.run(SHOW)); s.at = t[0] + ":" + String(t[1]).padStart(2, "0"); s.plan = (w.get("houseDay/2026-11-16") || {}).plan || {}; out.push(s); }
  return { out, w };
}
function placeChecks(r, ids) { const bad = []; const items = {}; r.items.forEach(([id, m]) => { items[id] = m; }); const d = drawn(r.html);
  ids.forEach(jid => { const [key, label, m] = EXPECT[jid], hd = m == null ? "ANY TIME" : T12(m), g = d.find(x => x[0] === hd);
    if (!(key in items) || items[key] !== m || !g || !g[1].includes(label)) bad.push([r.at, jid, items[key], hd]); });
  return bad; }

(async () => {
  const STEP7 = SRC.slice(SRC.indexOf("// HOUSEGAP_START"), SRC.indexOf("\n", SRC.indexOf("// HOUSECHIP_END")) + 1);
  ok("(step 7's three blocks HOUSEGAP · HOUSEMIX · HOUSECHIP sit together, once each)", ["HOUSEGAP", "HOUSEMIX", "HOUSECHIP"].every(n => SRC.split("// " + n + "_START").length === 2 && STEP7.includes("// " + n + "_END")));
  const BASE = tmp("base", SRC.replace(STEP7, ""));

  console.log("\n── A · plan ON: his plan rows (the grown-up turns too) at their time of day ──");
  const on = await run({ mode: "on" });
  const p = on.out[0].plan, dadPlan = Object.keys(p).filter(id => p[id].who === "dad").sort();
  ok("the plan hands Dad his own four rows and both grown-up turns (" + dadPlan.join(", ") + ")", JSON.stringify(dadPlan) === JSON.stringify(Object.keys(EXPECT).sort()), dadPlan);
  ok("…the two grown-up turns are marked as such (why \"deep\")", DEEP.every(id => p[id] && p[id].why === "deep"), DEEP.map(id => p[id]));
  ok("🗓 My schedule today: each at its time of day — Start the coffee 7:00 AM, Bring in the mail + Scrub the porch steps 12:00 PM, Lock the doors 5:00 PM, Trash + Wipe the bathroom sink ANY TIME — at 7:00, 10:30, 1:10 and 4:00", on.out.every(r => placeChecks(r, Object.keys(EXPECT)).length === 0), [].concat(...on.out.map(r => placeChecks(r, Object.keys(EXPECT)))).slice(0, 4));
  ok("…nothing moves with the clock or the school day: the same schedule at every time (no gap-fitting)", on.out.every(r => r.html === on.out[0].html), on.out.map(r => r.at + " " + (r.html === on.out[0].html)));
  ok("…and nothing else of his chores is on it (his plan rows only)", on.out.every(r => r.items.length === Object.keys(EXPECT).length), on.out[0].items);

  console.log("\n── B · plan off: his own list by time of day, as today ──");
  const off = await run({ mode: "off" });
  ok("plan off: Start the coffee 7:00 AM, Bring in the mail 12:00 PM, Lock the doors 5:00 PM, Trash ANY TIME, at every time", off.out.every(r => placeChecks(r, OWN).length === 0), [].concat(...off.out.map(r => placeChecks(r, OWN))).slice(0, 4));
  ok("…the kids' chores stay the kids' (no grown-up turn on his schedule) and nothing moves with the clock", off.out.every(r => r.items.length === OWN.length && !DEEP.some(id => r.html.includes(EXPECT[id][1])) && r.html === off.out[0].html), off.out[0].items);

  console.log("\n── C · step 7 does not touch Dad ──");
  for (const mode of ["on", "off"]) {
    const ref = mode === "on" ? on : off, diff = [];
    for (const [momFit, dadFit] of [["mixed", null], [null, "mixed"], ["mixed", "mixed"], ["mixed", "school"]]) { const r = await run({ mode, momFit, dadFit }); r.out.forEach((x, i) => { if (x.html !== ref.out[i].html) diff.push([momFit, dadFit, x.at]); }); }
    ok("plan " + mode + ": his schedule is byte-identical whatever Mom's Mixed in and his own Mixed in / School first say", diff.length === 0, diff.slice(0, 4));
    ok("plan " + mode + ": …it has no \"in a gap\" and no ⏰ chip", ref.out.every(r => !/in a gap|⏰/.test(r.html)));
    const b = await run({ mode, momFit: "mixed", dadFit: "mixed", index: BASE }), m = await run({ mode, momFit: "mixed", dadFit: "mixed" });
    ok("plan " + mode + ": …and = this tree with step 7 cut out (HOUSEGAP · HOUSEMIX · HOUSECHIP), at every time, with both switches on", m.out.every((x, i) => x.html === b.out[i].html && x.html.length > 0), m.out.map((x, i) => x.html === b.out[i].html));
  }

  console.log("\n── D · planted faults → a check above fails ──");
  const PL = [
    ["Z1 his chores fitted to the clock when his switch says Mixed in", "m:sl?DAD_SLOT_MIN[sl]:null,o:sl?0:3,kind:\"chore\"", "m:(hhPeopleOf(\"dad\").fit===\"mixed\")?Math.max(_mlNowMin(),sl?DAD_SLOT_MIN[sl]:0):(sl?DAD_SLOT_MIN[sl]:null),o:sl?0:3,kind:\"chore\"",
      async T => { const r = await run({ mode: "on", dadFit: "mixed", index: T }); return r.out.some(x => x.html !== on.out.find(y => y.at === x.at).html) || r.out.some((x, i) => placeChecks(x, Object.keys(EXPECT)).length); }],
    ["Z2 a plan row's time of day dropped (everything ANY TIME)", "if(MC_SLOTS[j.slot]) c.slot=j.slot; o[key]=c;", "o[key]=c;",
      async T => { const r = await run({ mode: "on", index: T }); return r.out.some(x => placeChecks(x, Object.keys(EXPECT)).length); }],
    ["Z3 a grown-up turn left off his list", "return r.plan[id].who===who&&jobs[id]; }).sort(function(a,b){ return (r.plan[a].order||0)", "return r.plan[id].who===who&&r.plan[id].why!==\"deep\"&&jobs[id]; }).sort(function(a,b){ return (r.plan[a].order||0)",
      async T => { const r = await run({ mode: "on", index: T }); return r.out.some(x => placeChecks(x, Object.keys(EXPECT)).length); }],
  ];
  for (const [name, a, b, caught] of PL) { const n = SRC.split(a).length - 1; if (n !== 1) { ok("(" + name + ": its text occurs once in index.html)", false, n); continue; }
    ok(name + " → the time-of-day check fails", await caught(tmp(name.slice(0, 2), SRC.replace(a, b)))); }

  console.log("    (note: with the fixture's 15-minute limit for Dad, the plan ON hands him only the bathroom sink turn and the trash; his own Morning / Afternoon / Night rows then go to nobody and leave his schedule — the engine's limit, not step 7)");
  TMP.forEach(f => { try { fs.unlinkSync(f); } catch (e) { } });
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { TMP.forEach(f => { try { fs.unlinkSync(f); } catch (x) { } }); console.error(e); process.exit(1); });
