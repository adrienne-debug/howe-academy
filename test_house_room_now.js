/*
 * test_house_room_now.js — 🔴 Now at the top of a room page (ROOMNOW in house.js; DESIGN_now_todo_schedule_2026-11-17 §2, slice A,
 * her "Yes, build A" 2026-11-17). Made-up family (Ada, Ben, Cal, Mom, Dad).
 *   · plan off and on preview: the rows are exactly the room grid's today squares (hhRmCell) for this room — same who, same done —
 *     and the card is byte-identical in the two modes; late first with the red badge (the grid's "past its usual gap"), done folded
 *     into one quiet line; nothing from another room;
 *   · plan ON with today's plan stored: a chore the plan hands out reads the stored day (who, late, done, skip) and nothing else —
 *     one the plan left out is not shown from the old lists; what fit nobody (over) shows with → Give to… (Mom only); a chore the plan
 *     never hands out (animals here) still reads the old lists; ON but not stored yet = the old lists, as the kids' lists do;
 *   · room clear: "Nothing left in … today. Next: <chore>, <day> (<who>)." = the first chore in this room on the engine's run;
 *   · display only: the only taps are the chore card (hcOpen) and → Give to… (hdGive, the plan on); drawing writes nothing;
 *   · the whole app (test_fixtures/house_world.js), plan ON on a Monday: the card's rows are the stored houseDay plan for the room.
 *   run: node test_house_room_now.js
 */
"use strict";
const path = require("path"), V = require(path.join(__dirname, "test_fixtures", "house_vm.js")), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const { K, TODAY, ago, DOW, mk, roomPage, handlers } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const strip = s => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const DAYN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const JOBS = () => ({
  k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, lastDone: ago(1), can: ["ada", "ben"] }),
  k_sink: K({ label: "Scrub the sink", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, lastDone: ago(4) }),
  k_chairs: K({ label: "Wipe the chairs", who: "ben", slot: "chores", cad: "daily", room: "kitchen", minutes: 5 }),
  k_fish: K({ label: "Feed the fish", who: "cal", slot: "morning", cad: "daily", area: "animals", room: "kitchen", lastDone: ago(1) }),
  m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "daily", room: "kitchen", minutes: 10, src: { kind: "momChore", id: "fridge" }, lastDone: ago(1) }),
  d_trash: K({ label: "Trash to the curb", who: "dad", slot: "", cad: "daily", area: "pickup", room: "kitchen", minutes: 5, src: { kind: "dadChore", id: "trash" }, lastDone: ago(1) }),
  k_mop: K({ label: "Mop the floor", who: "ben", slot: "chores", cad: "wk:" + ((DOW + 3) % 7), room: "kitchen", minutes: 15, can: ["ben", "ada"] }),
  l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "daily", room: "living", minutes: 5 }),
  o_shelf: K({ label: "Fix the shelf", who: "ben", slot: "chores", cad: "once", hold: true, room: "kitchen", from: ago(2) })
});
const MOMDAY = { [TODAY]: { chores: { fridge: true } } };   // Mom checked the fridge today
const sq = (c, rid) => { const S = c.hhLogState(), rc = {}, out = {}; (c.hhRoomChores()[rid] || []).forEach(id => { const x = c.hhRmCell(id, TODAY, TODAY, S, rc); if (x) out[id] = { who: x.who, done: !!x.done }; }); return out; };
const asMap = rows => { const o = {}; rows.forEach(x => { o[x.id] = { who: x.who, done: !!x.done }; }); return o; };
const J = x => JSON.stringify(x), S = o => J(Object.keys(o).sort().reduce((a, k) => (a[k] = o[k], a), {}));   // S: key order does not matter

console.log("\n── plan off: the room grid's today, for this room ──");
{ const c = mk({ jobs: JOBS(), momday: MOMDAY }); const R = c.rnRows("kitchen"), h = roomPage(c, "kitchen"), now = c.rnNowHTML("kitchen");
  ok("the rows are exactly the grid's today squares for the kitchen (who and done)", S(asMap(R.rows)) === S(sq(c, "kitchen")) && R.rows.length === 6, R.rows);
  ok("…not the living room's chore, not the one-time job, not a chore not due today", !R.rows.some(x => ["l_dust", "o_shelf", "k_mop"].includes(x.id)));
  ok("…and it says it reads the lists", /today, from the lists/.test(now) && R.plan === false);
  const order = R.rows.filter(x => !x.done).map(x => x.id);
  ok("late first: never done (late) → 3 days late → the rest", order[0] === "k_chairs" && order[1] === "k_sink" && R.rows.find(x => x.id === "k_sink").late === 3 && R.rows.find(x => x.id === "k_chairs").late === -1, R.rows);
  ok("…and no red late badge on them: they are dailies (HOUSEQUIET, slice B 2026-11-23: a daily is never late; test_house_quiet.js)", now.indexOf("#fee2e2") < 0 && !/ late</.test(now));
  ok("late = the grid's own count (hhRoomStats): the same chores", R.rows.filter(x => x.late).length === c.hhRoomStats(c.hhRoomChores().kitchen.filter(id => R.rows.some(x => x.id === id))).late);
  ok("who in their colour and the time of day", /color:#aa1111">Ada</.test(now) && /color:#11aa11">Ben</.test(now) && /Chores</.test(now) && /Any time</.test(now) && /Morning</.test(now));
  ok("done ones fold into one quiet line, not a row", /✅ 1 done: Wipe the fridge \(Mom\)/.test(now) && !/☐<\/span><span><\/span><span style="flex:1">Wipe the fridge/.test(now));
  ok("the card sits on the page above the grid", h.indexOf(now) > 0 && h.indexOf(now) < h.indexOf("<table"));
  const taps = handlers(now);
  ok("display only: the only taps open the chore card (no check-off)", taps.length > 0 && taps.every(t => /^hcOpen\('\w+'\)$/.test(t)), taps);
  ok("drawing wrote nothing", c.writes.length === 0, c.writes);
}

console.log("\n── plan on preview: the same as off ──");
{ const a = mk({ jobs: JOBS(), momday: MOMDAY }), b = mk({ jobs: JOBS(), momday: MOMDAY, hd: { meta: { takeover: 1, engine: { mode: "preview", on: TODAY } } } });
  ok("preview: the Now card is byte-identical to the plan off", a.rnNowHTML("kitchen") === b.rnNowHTML("kitchen"));
  ok("…its rows are the grid's today squares", S(asMap(b.rnRows("kitchen").rows)) === S(sq(b, "kitchen")));
  roomPage(b, "kitchen"); roomPage(b, ""); ok("…drawing the room and Whole house wrote nothing", b.writes.length === 0, b.writes);
  ok("🏠 Whole house has no single-room Now / To do card (it has its own, slice E)", !/>today, from the lists<\/span>/.test(roomPage(a, "")) && !/one-time jobs for this room/.test(roomPage(a, "")) && /every room/.test(roomPage(a, "")));
  const c = mk({ jobs: Object.assign(JOBS(), { x_lost: K({ label: "Lost chore", who: "ada", slot: "chores", cad: "daily", room: "attic_gone" }) }), hd: { meta: { takeover: 1 }, rooms: { kitchen: { name: "Kitchen", floor: "down", order: 1 } } } });
  const nh = roomPage(c, "__none"); ok("…the No room page draws no cards", /No room/.test(nh) && !/🔴 Now/.test(nh) && !/📝 To do/.test(nh));
}

console.log("\n── plan ON, today's plan stored ──");
const DAY = () => ({ [TODAY]: { built: { ok: 1, sig: "x" },
  plan: { k_counter: { who: "ben", mins: 10, order: 0, why: "given", late: 0, k: "daily", from: "ada" }, k_sink: { who: "ada", mins: 10, order: 1, late: 2, k: "daily" },
    m_fridge: { who: "mom", mins: 10, order: 0, late: 0, k: "daily" }, l_dust: { who: "ben", mins: 5, order: 1, late: 0, k: "daily" }, d_trash: { who: "dad", mins: 5, order: 0, late: 0, k: "daily" } },
  over: { k_mop: { turn: "ben", mins: 15, k: "days", late: 1 } }, done: { m_fridge: { who: "mom", ts: "9:00 AM" } }, skip: { d_trash: 1 } } });
const ON = { meta: { takeover: 1, engine: { mode: "on", on: ago(3) } } };
{ const c = mk({ jobs: JOBS(), hd: ON, houseDay: DAY() }), R = c.rnRows("kitchen"), now = c.rnNowHTML("kitchen"), M = asMap(R.rows);
  ok("hdOn() and the stored day is live", c.hdOn() === true && !!c.hdLive(TODAY) && R.plan === true);
  ok("a planned chore reads the stored day: who (given to Ben) and done (by chore)", M.k_counter.who === "ben" && M.m_fridge.done === true && M.k_sink.who === "ada" && M.k_sink.done === false, M);
  ok("…the plan's late (2 days) first, with Mom's grey note “from <day> · day 2” (HOUSEQUIET, slice B: red only for 3+ a week)", R.rows[0].id === "k_sink" && now.indexOf(">from " + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][c._hhDow(ago(2))] + " · day 2</span>") > 0 && now.indexOf("#fee2e2") < 0, R.rows.map(x => x.id));
  ok("…a ✕ skip shows as skipped", R.rows.find(x => x.id === "d_trash").skip === true && /skipped/.test(now));
  ok("a chore the plan left out (Ben's chairs) is NOT taken from the old lists", !M.k_chairs);
  ok("the living room's planned chore is not here", !M.l_dust);
  ok("a chore the plan never hands out (animals) still reads the old lists", M.k_fish && M.k_fish.who === "cal" && !c.hdManaged(c.hhJobs().k_fish));
  const plannedHere = Object.keys(DAY()[TODAY].plan).filter(id => c.hhJobs()[id].room === "kitchen").sort();
  ok("every planned row = the stored plan's kitchen rows, no more", J(R.rows.filter(x => c.hdManaged(c.hhJobs()[x.id])).map(x => x.id).sort()) === J(plannedHere), R.rows);
  ok("what fit nobody: its own part, whose turn, → Give to…", /Didn’t fit anyone today \(1\)/.test(now) && /Mop the floor/.test(now) && handlers(now).includes("hdGive('" + TODAY + "','k_mop',this.value);hhRender()"));
  ok("…Give to… offers only who can do it (Ben, Ada)", /<option value="">→ Give to…<\/option><option value="ben">Ben<\/option><option value="ada">Ada<\/option><\/select>/.test(now));
  ok("…no other tap than the card and Give to…", handlers(now).every(t => /^hcOpen\('\w+'\)$/.test(t) || /^event\.stopPropagation\(\)$/.test(t) || /^hdGive\(/.test(t)), handlers(now));
  roomPage(c, "kitchen"); ok("drawing with the plan on wrote nothing", c.writes.length === 0, c.writes);
  const k = mk({ jobs: JOBS(), hd: ON, houseDay: DAY(), noMom: true }); const kn = k.rnNowHTML("kitchen");
  ok("not Mom: the over row shows, without Give to…", /Mop the floor/.test(kn) && !/hdGive/.test(kn));
  const o = mk({ jobs: JOBS(), momday: MOMDAY });
  ok("plan off: no Give to… anywhere and no 'Didn’t fit' part", !/hdGive|Didn’t fit/.test(o.rnNowHTML("kitchen")));
  const n = mk({ jobs: JOBS(), momday: MOMDAY, hd: ON, houseDay: {} });
  ok("plan ON but today not stored yet: the old lists (as the kids' lists show then)", n.rnRows("kitchen").plan === false && S(asMap(n.rnRows("kitchen").rows)) === S(sq(n, "kitchen")));
  const g = mk({ jobs: JOBS(), hd: ON, houseDay: DAY() }); g.hdGive(TODAY, "k_mop", "ada");
  ok("after → Give to… Ada (HOUSESWITCH's own write) the chore moves from 'Didn’t fit' to Ada's row", g.rnRows("kitchen").over.length === 0 && asMap(g.rnRows("kitchen").rows).k_mop.who === "ada");
}

console.log("\n── the room is clear: the next chore due ──");
{ const jobs = { k_mop: JOBS().k_mop, l_dust: JOBS().l_dust, k_cab: K({ label: "Dust the cabinets", who: "cal", slot: "chores", cad: "wk:" + ((DOW + 5) % 7), room: "kitchen", minutes: 10 }) };
  const c = mk({ jobs }), run = c.hpRun(), now = c.rnNowHTML("kitchen"), n = c.rnNext("kitchen");
  let want = null; for (let i = 1; i < run.length && !want; i++) { const ids = Object.keys(run[i].plan).filter(id => c.hhJobs()[id].room === "kitchen"); if (ids.length) want = { iso: run[i].iso, ids }; }
  ok("nothing left today → the next chore is the engine's first kitchen chore after today", !!n && !!want && n.iso === want.iso && want.ids.includes(n.id), { n, want });
  ok("…Mop the floor in 3 days, Ben's", n.id === "k_mop" && n.n === 3 && n.who === "ben", n);
  ok("…one line: “Nothing left in 🍳 Kitchen + dining today. Next: Mop the floor, <day> (Ben).”", strip(now).indexOf("Nothing left in 🍳 Kitchen + dining today. Next: Mop the floor, " + DAYN[(DOW + 3) % 7] + " (Ben).") > 0, strip(now));
  const far = mk({ jobs: { k_far: K({ label: "Wash the curtains", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 20, from: ago(-9) })   /* starts in 9 days */ } }), fn = far.rnNext("kitchen");
  ok("more than 6 days away: the day and the date", !!fn && fn.n > 6 && strip(far.rnNowHTML("kitchen")).indexOf(DAYN[far._hhDow(fn.iso)] + " " + (+fn.iso.slice(5, 7)) + "/" + (+fn.iso.slice(8))) > 0, fn);
  const none = mk({ jobs: { l_dust: JOBS().l_dust } });
  ok("a room with nothing coming: just “Nothing left … today.”", /Nothing left in 🍳 Kitchen \+ dining today\.<\/div>/.test(none.rnNowHTML("kitchen")));
  ok("with chores still open there is no 'Nothing left' line", !/Nothing left/.test(mk({ jobs: JOBS() }).rnNowHTML("kitchen")));
  ok("working out the next chore wrote nothing", c.writes.length === 0 && far.writes.length === 0);
}

console.log("\n── the whole app, plan ON: the card is the stored plan ──");
(async () => {
  const hh = W.household("on"); const R = { c_a_dishes: "kitchen", c_b_mop: "kitchen", m_fridge: "kitchen", an_a_fish: "kitchen", c_a_vac: "living", c_b_bath: "bathdown", d_trash: "entry" };
  Object.keys(hh.jobs).forEach(id => { hh.jobs[id].room = R[id] || "school"; });
  const w = await W.world({ household: hh }); const A = w.boot("A", "devA", { mom: true }); await w.flush(); await w.at(2026, 11, 16, 16, 30);
  A.run(V.HJS); const m = w.mark();
  const day = A.run("JSON.stringify(houseDayData['2026-11-16'])"), D = JSON.parse(day), J0 = A.run("JSON.stringify(hhJobs())");
  const rows = JSON.parse(A.run("JSON.stringify(rnRows('kitchen'))"));
  const want = Object.keys(D.plan || {}).filter(id => R[id] === "kitchen").sort();
  ok("the day was built and stored (houseDay/2026-11-16)", !!(D.built && D.built.ok) && rows.plan === true, D.built);
  ok("the planned rows are the stored plan's kitchen rows: same chores, same people", want.length > 0 && J(rows.rows.filter(x => D.plan[x.id]).map(x => x.id).sort()) === J(want) && rows.rows.filter(x => D.plan[x.id]).every(x => x.who === D.plan[x.id].who), { want, rows: rows.rows });
  ok("…the rest is only what the plan never hands out (the fish)", rows.rows.filter(x => !D.plan[x.id]).every(x => x.id === "an_a_fish"), rows.rows);
  ok("…what fit nobody in the kitchen is in its part", J(rows.over.map(x => x.id).sort()) === J(Object.keys(D.over || {}).filter(id => R[id] === "kitchen").sort()));
  A.run("hhView='rooms'; hhRmSel='kitchen'; hhRoomsPageHTML()"); await w.flush();
  ok("drawing the room page wrote nothing to the database", w.since(m).filter(l => l.op !== "get" && l.op !== "on" && l.op !== "once").length === 0, w.since(m).slice(0, 4));
  ok("…and changed nothing on the device (the day, the table)", A.run("JSON.stringify(houseDayData['2026-11-16'])") === day && A.run("JSON.stringify(hhJobs())") === J0);
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL- threw " + (e && e.stack || e)); process.exit(1); });
