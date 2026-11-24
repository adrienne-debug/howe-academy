/*
 * test_house_quiet.js — HOUSEQUIET in house.js: quiet Household pages and Mom's notes (DESIGN_missed_chores_2026-11-19 §4 and §8
 * row B; the hub's brief 2026-11-23). Her words 11/19: "kids see nothing but mom view sees the notes"; "i def want to keep the ones 3
 * or more times a week like they are now where it shows how late it is". MADE-UP families only (Ada, Ben, Cal; kid_a … kid_d).
 * The baseline is THIS tree minus the feature: house.js with the HOUSEQUIET block cut out (every caller asks typeof first, so the
 * pages are then exactly as before). Each bullet is checked on the feature AND shown to be different on the baseline.
 *   A · the made-up table in the Household page's vm (test_fixtures/house_vm.js): dailies never "late"; a chore with no tick in 8
 *       weeks (Mom's, Up for Grabs) and one past its gap say so in grey; a chore above the Cleaning level is not counted and the room
 *       says "not on a list yet"; room headers and 🏠 Whole house show "% done" (worked out here again from hhStats) in place of the
 *       red count; the plan's own rows (stored plan, ON): "from Tue · day 2", red only for 3 or more weekdays; 📅 Schedule; not Mom:
 *       no grey notes; drawing writes nothing; every ranking (🔴 Now's rows, Whole house's rooms, 🔴 Now's room lines, the 🧽 cleaning
 *       day's picks hhPlanCandidates / hhPlanBuild, "most behind first" hhNeedPct, hhRoomStats) = the baseline's, value for value.
 *   B · the whole app (test_fixtures/house_world.js) on Wed 11/25 and Thu 11/26: a weekly chore in its wait with fallen stars and a
 *       3-times-a-week row late, on a kid's real list: 🔴 Now, 👤 By person ▸ Today and 📅 Schedule carry the Kids today pop-up's own
 *       words; every kid-facing list (each kid's four lists, Kids' Corner's stars) is byte-identical with no house.js, the baseline
 *       and the feature; Mom's pop-up too; drawing every Household page wrote nothing to the database.
 *   run: node test_house_quiet.js
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const V = require(path.join(__dirname, "test_fixtures", "house_vm.js")), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const { K, TODAY, T, ago, DOW, isoOf, roomPage } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), strip = s => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const RED = '#fee2e2', GREY = 'color:#6b7280';

// ── the feature and the baseline (this tree minus the HOUSEQUIET block) ──
const HJS = V.HJS, a0 = HJS.indexOf("// HOUSEQUIET_START"), a1 = HJS.indexOf("\n", HJS.indexOf("// HOUSEQUIET_END"));
const BASE = HJS.slice(0, a0) + HJS.slice(a1 + 1);
ok("house.js has one HOUSEQUIET block and the baseline is the tree without it", a0 > 0 && a1 > a0 && HJS.indexOf("// HOUSEQUIET_START", a0 + 1) < 0 && !/function hq\w*\(/.test(BASE) && BASE.length < HJS.length);
// the wait / fall code the notes read (CHOREWAIT, CHOREFALL, STARRULES), cut from index.html as it is: the one code, not a copy
const cut = (a, b) => { const i = V.RAW.indexOf(a), j = V.RAW.indexOf(b, i); return V.RAW.slice(i, V.RAW.indexOf("\n", j)); };
const WAITCODE = cut("// CHOREWAIT_START", "// CHOREWAIT_END") + "\n" + cut("// CHOREFALL_START", "// CHOREFALL_END") + "\n" + cut("// STARRULES_START", "// STARRULES_END");
function mk(o, hjs) { o = o || {}; const c = V.mk(Object.assign({}, o, { house: false }));
  vm.runInContext(WAITCODE, c); vm.runInContext(hjs || HJS, c, { filename: "house.js" });
  c.householdOnValue(Object.assign({ jobs: o.jobs || {}, meta: { takeover: 1 } }, o.hd || {}));
  if (o.houseDay) c.get("houseDayData=" + J(o.houseDay)); c.writes.length = 0; return c; }

// ── A · the made-up table: wk: 0 = Monday, DOW = today ──
const WD = (DOW + 7) % 7, Y = (DOW + 6) % 7;   // today's weekday, yesterday's
const JOBS = () => ({
  k_dish: K({ label: "Unload the dishes", emoji: "🍽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, lastDone: ago(2) }),   // daily, not done yesterday
  k_sink: K({ label: "Scrub the sink", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, lastDone: ago(5) }),   // daily, 4 days missed
  k_chair: K({ label: "Wipe the chairs", who: "ben", slot: "chores", cad: "daily", room: "kitchen", minutes: 5 }),   // daily, no tick in 8 weeks
  k_mop: K({ label: "Mop the floor", who: "ben", slot: "chores", cad: "wk:" + WD, room: "kitchen", minutes: 15, pts: 10, lastDone: ago(10) }),   // weekly, due today, past its gap
  k_trash: K({ label: "Empty the trash", who: "cal", slot: "chores", cad: "wk:" + [WD, (WD + 2) % 7, (WD + 4) % 7].join(","), room: "kitchen", minutes: 5, pts: 10, lastDone: ago(4) }),   // 3 a week
  k_oven: K({ label: "Deep-clean the oven", who: "ada", slot: "chores", cad: "wk:" + WD, level: 3, room: "kitchen", minutes: 30, pts: 20 }),   // above the Cleaning level
  m_win: K({ label: "Wash the windows", who: "mom", slot: "", cad: "wk:" + WD, room: "kitchen", minutes: 20, src: { kind: "momChore", id: "win" } }),   // Mom's, never ticked
  g_fridge: K({ label: "Clean out the fridge", who: "grab", slot: "chores", cad: "wk:" + WD, room: "kitchen", minutes: 15, pts: 8 }),   // Up for Grabs, no history
  l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "daily", room: "living", minutes: 5, lastDone: ago(1) }),
  l_rug: K({ label: "Vacuum the rug", who: "cal", slot: "chores", cad: "wk:" + Y, room: "living", minutes: 15, pts: 10, lastDone: ago(1) })
});
// 8 weeks of ticks for the % done (the Click-off Log's state, kid|slot|label|iso → on): the dishes every other day, the sink every day until 5 days ago;
// in the living room the dusting every day and the rug every week
function withLog(c) { const S = c.hhLogState(), on = (k, lb, iso) => { S.state[k + "|chores|" + c._hhNorm(lb) + "|" + iso] = { act: "on" }; };
  for (let n = 1; n <= 56; n++) { if (n % 2 === 0) on("ada", "Unload the dishes", ago(n)); if (n >= 5) on("ada", "Scrub the sink", ago(n)); on("ben", "Dust the den", ago(n)); }
  for (let n = 1; n <= 56; n += 7) on("cal", "Vacuum the rug", ago(n));
  c.hhLogState = () => S; return c; }
const pageSet = c => ({ kitchen: roomPage(c, "kitchen"), living: roomPage(c, "living"), whole: roomPage(c, ""), nowK: c.rnNowHTML("kitchen"), nowAll: c.htNowHTML() });

console.log("\n── A1 · 🔴 Now on a room page: dailies never late, grey notes, no red (plan off) ──");
{ const c = withLog(mk({ jobs: JOBS() })), b = withLog(mk({ jobs: JOBS() }, BASE)), now = c.rnNowHTML("kitchen"), bnow = b.rnNowHTML("kitchen"), R = c.rnRows("kitchen");
  const row = (h, lb) => (h.split('<div onclick="hcOpen(').filter(r => r.indexOf(">" + lb + "<") >= 0)[0] || "");
  ok("the baseline drew the red late badge on dailies (Scrub the sink 3 days late, Wipe the chairs late)", row(bnow, "Scrub the sink").indexOf(RED) > 0 && row(bnow, "Wipe the chairs").indexOf(RED) > 0 && row(bnow, "Unload the dishes").indexOf(RED) > 0);
  ok("dailies: no badge, no note, no word at all (a daily not done yesterday is simply due today)", ["Unload the dishes", "Scrub the sink", "Wipe the chairs"].every(lb => { const r = row(now, lb); return r && r.indexOf(RED) < 0 && !/late|tick|last done/.test(strip(r)); }), ["Unload the dishes", "Scrub the sink", "Wipe the chairs"].map(lb => strip(row(now, lb))));
  ok("Mom's never-ticked chore: grey “no tick in 8 weeks”, not red", row(now, "Wash the windows").indexOf(RED) < 0 && row(now, "Wash the windows").indexOf('<span style="font-size:10.5px;font-weight:700;' + GREY + ';white-space:nowrap">no tick in 8 weeks</span>') > 0, strip(row(now, "Wash the windows")));
  ok("Up for Grabs with no history: the same grey “no tick in 8 weeks”", row(now, "Clean out the fridge").indexOf(RED) < 0 && /no tick in 8 weeks/.test(row(now, "Clean out the fridge")), strip(row(now, "Clean out the fridge")));
  ok("a weekly due today, past its gap: grey “last done 10 days ago”, not red", row(now, "Mop the floor").indexOf(RED) < 0 && /last done 10 days ago/.test(row(now, "Mop the floor")) && /Mop the floor/.test(bnow) && row(bnow, "Mop the floor").indexOf("3 days late") > 0, [strip(row(now, "Mop the floor")), strip(row(bnow, "Mop the floor"))]);
  ok("a 3-times-a-week row DUE TODAY is not late (its last turn's wait ended when today came): no red", row(now, "Empty the trash").indexOf(RED) < 0 && row(bnow, "Empty the trash").indexOf(RED) > 0);
  ok("the above-level chore is on nobody's list: not on 🔴 Now at all (as before)", !/Deep-clean the oven/.test(now) && !/Deep-clean the oven/.test(bnow));
  ok("nothing on the card is red any more", now.indexOf(RED) < 0 && bnow.indexOf(RED) > 0);
  ok("the rows and their order are the baseline's, value for value", J(R) === J(b.rnRows("kitchen")), [R.rows.map(x => x.id), b.rnRows("kitchen").rows.map(x => x.id)]);
  ok("drawing wrote nothing", c.writes.length === 0, c.writes);
  const k = withLog(mk({ jobs: JOBS(), noMom: true })), kn = k.rnNowHTML("kitchen");
  ok("not Mom (and not Dad's link): the same rows, no grey notes", /Wash the windows/.test(kn) && !/no tick|last done/.test(kn) && kn.indexOf(RED) < 0);
}

console.log("\n── A2 · room headers and 🏠 Whole house: % done in place of the red count; above the level ──");
{ const c = withLog(mk({ jobs: JOBS() })), b = withLog(mk({ jobs: JOBS() }, BASE)), P = pageSet(c), Q = pageSet(b), A = c.hhJobs(), byRoom = c.hhRoomChores();
  // % done worked out again here: done on its day or later ÷ times due, 8 weeks before today, one-time / held / above the level left out
  const want = rid => { let due = 0, done = 0; byRoom[rid].forEach(id => { const j = A[id]; if (c.hhLaneOf(j) === "once" || j.hold || !c.hhLevelOut(j)) return; const s = c.hhStats(j); due += s.due8; done += s.done8; }); return due ? Math.round(100 * done / due) : null; };
  const pk = want("kitchen"), pl = want("living"), sk = c.hhRoomStats(byRoom.kitchen);
  ok("the kitchen's % done = " + pk + "% (worked out here from hhStats); the living room's = " + pl + "%", pk !== null && pl !== null && pk > 0 && pk < 100 && pl === 100, [pk, pl]);
  ok("the kitchen header: “… min a week · " + pk + "% done · on time " + sk.pct + "% · 1 above the Cleaning level, not on a list yet”", strip(P.kitchen).indexOf(" min a week · " + pk + "% done · on time " + sk.pct + "% · 1 above the Cleaning level, not on a list yet") > 0, strip(P.kitchen).slice(0, 400));
  ok("…the baseline's header had no % done and no level words", strip(Q.kitchen).indexOf("min a week · on time " + sk.pct + "%") > 0 && !/% done|not on a list yet/.test(strip(Q.kitchen).slice(0, 600)));
  ok("…the above-level oven is left out of the % (with it in, the number would differ)", (() => { let due = 0, done = 0; byRoom.kitchen.forEach(id => { const s = c.hhStats(A[id]); due += s.due8; done += s.done8; }); return Math.round(100 * done / due) !== pk; })());
  const line = (h, name) => (h.split('<div onclick="hhRmGo(').filter(r => r.indexOf(">" + name + "<") >= 0 && r.indexOf("min/wk") > 0)[0] || "");
  ok("Whole house: the kitchen's line says “" + pk + "% done” where the red count was", line(P.whole, "Kitchen + dining").indexOf(c._hhChip(pk + "% done", "#f3f4f6", "#1f2937")) > 0 && line(P.whole, "Kitchen + dining").indexOf(RED) < 0 && / late</.test(line(Q.whole, "Kitchen + dining")), [strip(line(P.whole, "Kitchen + dining")), strip(line(Q.whole, "Kitchen + dining"))]);
  ok("…the bar and its on-time number are as before", line(P.whole, "Kitchen + dining").indexOf(">" + sk.pct + "%</span>") > 0 && line(Q.whole, "Kitchen + dining").indexOf(">" + sk.pct + "%</span>") > 0);
  ok("…its header: “most behind first · the bar is on time over 8 weeks · % done also counts the ones done late” (no “late = past its usual gap”)", /most behind first · the bar is on time over 8 weeks · % done also counts the ones done late/.test(P.whole) && !/late = past its usual gap/.test(P.whole) && /late = past its usual gap/.test(Q.whole));
  ok("Whole house's room list keeps the baseline's order (the old count still ranks; only the drawing changed)", J(c.hhHouseOrder(byRoom)) === J(b.hhHouseOrder(b.hhRoomChores())) && J(P.whole.match(/hhRmGo\('\w*'\)/g)) === J(Q.whole.match(/hhRmGo\('\w*'\)/g)));
  ok("🔴 Now on Whole house: “N left · N done”, no red count (the baseline had “N late”)", P.nowAll.indexOf(RED) < 0 && Q.nowAll.indexOf(RED) > 0 && /\d+ left/.test(P.nowAll));
  ok("…its room lines in the baseline's order, with the baseline's numbers", J(c.htNowData().rooms.map(x => [x.rid, x.left, x.late, x.done, x.over])) === J(b.htNowData().rooms.map(x => [x.rid, x.left, x.late, x.done, x.over])) && J(P.nowAll.match(/hhRmGo\('\w*'\)/g)) === J(Q.nowAll.match(/hhRmGo\('\w*'\)/g)));
  ok("nothing red on any of these pages (no 3-times-a-week row is late here)", Object.keys(P).every(k => P[k].indexOf(RED) < 0), Object.keys(P).filter(k => P[k].indexOf(RED) >= 0));
  ok("drawing every page wrote nothing", c.writes.length === 0, c.writes);
}

console.log("\n── A2b · a held chore is not in “% done” (hub's fault 2, 2026-11-23) ──");
{ // a daily in the living room, due every day of the 8 weeks and never done: held, it is on nobody's list, so the room's % must not move
  const HELD = hold => Object.assign(JOBS(), { l_rugwash: K({ label: "Shampoo the rug", who: "ben", slot: "chores", cad: "daily", room: "living", minutes: 20, hold: hold }) });
  const base = withLog(mk({ jobs: JOBS() })), held = withLog(mk({ jobs: HELD(true) })), open = withLog(mk({ jobs: HELD(false) }));
  const pct = c => c.hqDone(c.hhRoomChores().living).pct, head = c => (strip(roomPage(c, "living")).match(/\d+ chores · \d+ min a week · [^🔴]*/) || [""])[0];
  const chip = c => (roomPage(c, "").split('<div onclick="hhRmGo(').filter(r => r.indexOf(">Living room<") >= 0 && r.indexOf("min/wk") > 0)[0] || "").match(/>(\d+)% done</);
  ok("the held chore was due in the 8 weeks and never done (hhStats: due " + held.hhStats(held.hhJobs().l_rugwash).due8 + ", done 0)", held.hhStats(held.hhJobs().l_rugwash).due8 > 0 && held.hhStats(held.hhJobs().l_rugwash).done8 === 0);
  ok("held: the living room's % done = without the chore (" + pct(base) + "%); not held it would be " + pct(open) + "%", pct(held) === pct(base) && pct(open) < pct(base), [pct(base), pct(held), pct(open)]);
  ok("…in the room header: “" + head(held).replace(/^\d+ chores · \d+ min a week · /, "") + "”", /(\d+)% done/.test(head(held)) && head(held).match(/(\d+)% done/)[1] === String(pct(base)) && head(open).match(/(\d+)% done/)[1] === String(pct(open)), [head(base), head(held), head(open)]);
  ok("…and in the Whole house chip", !!chip(held) && chip(held)[1] === String(pct(base)) && !!chip(open) && chip(open)[1] === String(pct(open)), [chip(held) && chip(held)[1], chip(open) && chip(open)[1]]);
}

console.log("\n── A3 · the plan ON, today's plan stored: the plan's own carried rows ──");
const ON = { meta: { takeover: 1, engine: { mode: "on", on: ago(3) } } };
const DAY = () => ({ [TODAY]: { built: { ok: 1, sig: "x" },
  plan: { k_mop: { who: "ben", mins: 15, order: 0, late: 2, k: "days" }, k_trash: { who: "cal", mins: 5, order: 1, late: 1, k: "days" }, k_dish: { who: "ada", mins: 10, order: 2, late: 0, k: "daily" }, l_rug: { who: "cal", mins: 15, order: 0, late: 1, k: "days" } },
  over: {}, done: {}, skip: {} } });
{ const c = mk({ jobs: JOBS(), hd: ON, houseDay: DAY() }), b = mk({ jobs: JOBS(), hd: ON, houseDay: DAY() }, BASE), now = c.rnNowHTML("kitchen"), bnow = b.rnNowHTML("kitchen");
  const from = iso => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][c._hhDow(iso)];
  ok("the plan is live", c.hdOn() === true && c.rnRows("kitchen").plan === true);
  ok("a weekly row the plan carried 2 days: grey “from " + from(ago(2)) + " · day 2”, no red", now.indexOf(">from " + from(ago(2)) + " · day 2</span>") > 0 && bnow.indexOf(c._hhChip("2 days late", RED, "#991b1b")) > 0, strip(now));
  ok("a 3-times-a-week row the plan carried 1 day keeps the red “1 day late” (rtWaitAsBefore), as she chose", now.indexOf(c._hhChip("1 day late", RED, "#991b1b")) > 0 && c.rtWaitAsBefore(c.hhJobs().k_trash));
  ok("…the rows in the baseline's order", J(c.rnRows("kitchen")) === J(b.rnRows("kitchen")));
  c.get('hpSel="cal"'); const on = c.hpOnHTML("cal"), bon = b.hpOnHTML("cal");
  ok("👤 By person ▸ Today (plan on, Cal): the rug “from " + from(ago(1)) + " · day 1” grey, the trash red “1 day late”", on.indexOf(">from " + from(ago(1)) + " · day 1</span>") > 0 && on.indexOf(c._hhChip("1 day late", RED, "#991b1b")) > 0 && (bon.match(/1 day late/g) || []).length === 2, strip(on));
  ok("drawing wrote nothing", c.writes.length === 0, c.writes);
}

console.log("\n── A4 · 📅 Schedule, today: no red on dailies; the open day has the notes ──");
{ const c = withLog(mk({ jobs: JOBS() })), b = withLog(mk({ jobs: JOBS() }, BASE));
  const sched = x => { x.get('hhView="rooms"; hhRmSel="kitchen"; hwKey=""; hwFilter(); hwDay=' + J(TODAY)); return x.hwCardHTML(); };
  const s = sched(c), t = sched(b);
  ok("the baseline's week had red marks on today's chores", t.indexOf("color:#dc2626") > 0);
  ok("the feature's: none (no 3-times-a-week row is late here)", s.indexOf("color:#dc2626") < 0);
  ok("the open day (today) says “no tick in 8 weeks” and “last done 10 days ago”, in grey", /no tick in 8 weeks/.test(s) && /last done 10 days ago/.test(s));
  ok("the same chores on the same days, in the same order", J(s.match(/hcOpen\('\w+'\)/g)) === J(t.match(/hcOpen\('\w+'\)/g)));
  ok("drawing wrote nothing", c.writes.length === 0);
}

console.log("\n── A5 · nothing that ranks moved: the 🧽 cleaning day, most behind first, the rooms ──");
for (const [tag, o] of [["plan off", {}], ["preview", { hd: { meta: { takeover: 1, engine: { mode: "preview", on: ago(3) } } } }], ["plan on", { hd: ON, houseDay: DAY() }]]) {
  const c = withLog(mk(Object.assign({ jobs: JOBS() }, o))), b = withLog(mk(Object.assign({ jobs: JOBS() }, o), BASE)), A = c.hhJobs(), ids = Object.keys(A).sort();
  ok(tag + ": hhNeedPct of every chore (most behind first) = the baseline's", J(ids.map(id => c.hhNeedPct(A[id]))) === J(ids.map(id => b.hhNeedPct(b.hhJobs()[id]))));
  ok(tag + ": the 🧽 cleaning day's candidates (hhPlanCandidates) and its built plan (hhPlanBuild) = the baseline's", J(c.hhPlanCandidates(TODAY)) === J(b.hhPlanCandidates(TODAY)) && J(c.hhPlanBuild(TODAY, {})) === J(b.hhPlanBuild(TODAY, {})));
  ok(tag + ": every room's hhRoomStats, rnRows, rnLate, and Whole house's order = the baseline's", ["kitchen", "living", "__none"].every(r => J(c.hhRoomStats(c.hhRoomChores()[r] || [])) === J(b.hhRoomStats(b.hhRoomChores()[r] || [])) && J(c.rnRows(r)) === J(b.rnRows(r)))
    && ids.every(id => c.rnLate(A[id], T, id) === b.rnLate(b.hhJobs()[id], T, id)) && J(c.hhHouseOrder(c.hhRoomChores())) === J(b.hhHouseOrder(b.hhRoomChores())));
  pageSet(c); ok(tag + ": drawing wrote nothing", c.writes.length === 0, c.writes);
}

// ── B · the whole app: real lists, a real wait, fallen stars ──
console.log("\n── B · the whole app: a weekly chore in its wait, a 3-times-a-week row late (Wed 11/25, Thu 11/26) ──");
const KW = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_teeth: KW({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", room: "bathdown", order: 0 }),
  a_vac: KW({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, room: "living", order: 1 }),   // Tuesdays
  a_bed: KW({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 5, room: "living", order: 2 }),
  b_trash: KW({ label: "Empty the trash", emoji: "🗑", who: "kid_b", slot: "chores", cad: "wk:0,2,4", pts: 10, room: "kitchen", order: 0 }),   // Mon, Wed, Fri
  b_sink: KW({ label: "Rinse the sink", emoji: "🚰", who: "kid_b", slot: "chores", cad: "daily", pts: 2, room: "kitchen", order: 1 }),
  c_oven: KW({ label: "Deep-clean the oven", emoji: "🔥", who: "kid_c", slot: "chores", cad: "wk:1", level: 3, pts: 20, room: "kitchen", order: 0 }),
  m_win: KW({ label: "Wash the windows", who: "mom", slot: "", cad: "wk:2", room: "living", src: { kind: "momChore", id: "win" }, order: 0 })
});
const household = () => ({ jobs: FAM(), people: JSON.parse(J(W.PEOPLE)), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } });
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };
const teeth = d => d.run("(function(){ day=_todayDay; const i=morningStepsFor('kid_a').findIndex(function(s){ return s.label==='Brush teeth'; }); if(i>=0&&!mStepDoneOn('kid_a',day,i)) toggleMorningStep('kid_a',i); return i; })()");
const pop = (d, kid, slot) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + "," + J(slot) + ",_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
const kidScreens = d => d.run("(function(){ const d0=day; day=_todayDay; const out={}; try{ ['kid_a','kid_b','kid_c','kid_d'].forEach(function(k){ ['afternoon','chores','evening'].forEach(function(s){ rtOpen={}; out[s+'/'+k]=rtSlotHTML(s,k); }); try{ out['kc/'+k]=kcPointsHTML(k); }catch(e){ out['kc/'+k]='x'; } }); } finally{ day=d0; } return JSON.stringify(out); })()");
const momPops = A => J(["kid_a", "kid_b", "kid_c"].map(k => ["chores", "afternoon", "evening"].map(s => pop(A, k, s))));
const hhPages = A => A.run("(function(){ const o={}; hhView='rooms'; ['living','kitchen',''].forEach(function(r){ hhRmSel=r; hwKey=''; o['room/'+r]=hhRoomsPageHTML(); }); hhView='person'; ['kid_a','kid_b','mom'].forEach(function(w){ hpSel=w; hwKey=''; o['person/'+w]=hpPersonHTML(); }); hhView='rooms'; hhRmSel='living'; hwKey=''; hwFilter(); hwDay=hpToday(); o.sched=hwCardHTML(); hwDay=''; return JSON.stringify(o); })()");
(async () => {
  // four devices on one world: Mom with the feature (A) and with the baseline (M); a kid device with the feature (B), with the
  // baseline (K), and one that never loads house.js (Z) — house.js can be loaded once per device
  const w = await W.world({ household: household() }); const A = w.boot("A", "devA", { mom: true }), M = w.boot("M", "devM", { mom: true }), B = w.boot("B", "devB"), K = w.boot("K", "devK"), Z = w.boot("Z", "devZ"); await w.flush();
  const snaps = {}; let loaded = false;
  for (let n = 7; n <= 10; n++) { await go(w, n, 17); teeth(B); await w.flush();
    if (n < 9) continue;
    const pop0 = momPops(A);   // Mom's pop-ups before house.js is on the device
    if (!loaded) { A.run(HJS); B.run(HJS); M.run(BASE); K.run(BASE); loaded = true; }
    const m = w.mark(), pgF = JSON.parse(hhPages(A)), pgB = JSON.parse(hhPages(M)); await w.flush();
    const wr = w.since(m).filter(l => l.op !== "get" && l.op !== "on" && l.op !== "once");
    snaps[n] = { kid0: kidScreens(Z), kidB: kidScreens(K), kidF: kidScreens(B), pop0, popB: momPops(M), popF: momPops(A), pgB, pgF, wr, popA: pop(A, "kid_a", "chores"), kidPage: B.run("(function(){ hhView='rooms'; hhRmSel='living'; return rnNowHTML('living'); })()") }; }
  const wed = snaps[9], thu = snaps[10];
  for (const [d, s] of [["Wed", wed], ["Thu", thu]]) {
    ok(d + ": every kid-facing list (each kid's Afternoon, Chores, Evening and Kids' Corner stars) is byte-identical: no house.js, the baseline, the feature", s.kid0 === s.kidB && s.kidB === s.kidF && s.kidF.length > 2000);
    ok(d + ": Mom's Kids today pop-ups are byte-identical too", s.pop0 === s.popB && s.popB === s.popF);
    ok(d + ": drawing every Household page (rooms, Whole house, By person, Schedule) wrote nothing to the database", s.wr.length === 0, s.wr.slice(0, 4)); }
  const note = (h, lb) => { const i = h.indexOf(">" + lb + "<"); if (i < 0) return ""; const e = h.indexOf("</div>", i); return h.slice(i, e); };
  // Wed: the Tuesday vacuum waits, day 1 of 2, pays 8 of 10; the trash is due today (Wed), not late
  const wn = note(wed.pgF["room/living"], "Vacuum the den"), wantW = "from Tue · day 1 of 2 · pays 8 of 10 ⭐";
  ok("Wed: the Kids today pop-up's note for the vacuum is “" + wantW + "”", wed.popA.indexOf(wantW) > 0, strip(wed.popA).slice(0, 300));
  ok("Wed: 🔴 Now on the living room shows it, still on Kid_a's list, with the same words, in grey", wed.pgF["room/living"].indexOf("Still on their list from an earlier day (1)") > 0 && wn.indexOf(GREY) > 0 && wn.indexOf(wantW) > 0 && wn.indexOf(RED) < 0, strip(wn));
  ok("…the baseline's room page did not show it at all", wed.pgB["room/living"].indexOf("Vacuum the den") < 0 || note(wed.pgB["room/living"], "Vacuum the den").indexOf("from Tue") < 0);
  ok("Wed: 👤 By person ▸ Today (Kid_a) has it under “⏳ Still on Kid_a’s list from an earlier day”, the same words", /⏳ Still on .{1,12}’s list from an earlier day \(1\)/.test(wed.pgF["person/kid_a"]) && note(wed.pgF["person/kid_a"], "Vacuum the den").indexOf(wantW) > 0);
  ok("Wed: 📅 Schedule today: the vacuum in today's box (grey “1d”) and the whole note in the open day", wed.pgF.sched.indexOf(" <span style=\"font-size:10px;font-weight:700;" + GREY + "\">1d</span>") > 0 && wed.pgF.sched.indexOf(wantW) > 0);
  ok("Wed: the daily rows say nothing (Make the bed, Rinse the sink)", ["Make the bed", "Rinse the sink"].every(lb => !/late|tick|last done|from /.test(strip(note(wed.pgF["room/living"] + wed.pgF["room/kitchen"], lb)))));
  // Thu: the vacuum day 2 of 2, pays 6 of 10; the trash missed Wed: 1 day late, red, as on the kid's own row
  const wantT = "from Tue · day 2 of 2 · pays 6 of 10 ⭐", tn = note(thu.pgF["room/living"], "Vacuum the den"), tr = note(thu.pgF["room/kitchen"], "Empty the trash");
  ok("Thu: the pop-up says “" + wantT + "” and 🔴 Now says the same", thu.popA.indexOf(wantT) > 0 && tn.indexOf(wantT) > 0, [strip(thu.popA).slice(0, 300), strip(tn)]);
  ok("Thu: the 3-times-a-week trash, missed Wed, keeps the red “1 day late” on 🔴 Now — the kid's list has the same tag", tr.indexOf(RED) > 0 && strip(tr).indexOf("1 day late") >= 0 && thu.kidF.indexOf('<span class=\\"rt-late\\">1 day late</span>') > 0, strip(tr));
  const nw = strip(thu.pgF["room/"]).split("tap one to open it")[1] || "", kl = (nw.match(/🍳 Kitchen \+ dining [^›]*›/) || [""])[0], ll = (nw.match(/🛋 Living room [^›]*›/) || [""])[0];
  ok("Thu: 🏠 Whole house ▸ 🔴 Now: the kitchen “1 late” (the trash, counted once: not also “waiting”), the living room “1 waiting”", / 1 late /.test(kl) && !/waiting/.test(kl) && / 1 waiting /.test(ll) && !/late/.test(ll), [kl, ll]);
  ok("Thu: no daily row is red anywhere on the Household pages", ["Make the bed", "Rinse the sink"].every(lb => Object.values(thu.pgF).every(h => note(h, lb).indexOf(RED) < 0)));
  ok("Thu: the above-level oven is not on a list and the kitchen says “1 above the Cleaning level, not on a list yet”", thu.pgF["room/kitchen"].indexOf("1 above the Cleaning level, not on a list yet") > 0 && !/Deep-clean the oven/.test(strip(thu.kidF)));
  ok("a kid's device drawing the room: the rows, never the grey notes", thu.kidPage.indexOf("Vacuum the den") > 0 && thu.kidPage.indexOf("from Tue") < 0);
  // hub's fault 1 (2026-11-23): Mom ✕-skips the waiting vacuum today (✕ today in her pop-up, rtWave). The lists' count does not drop it
  // (rtLateDays checks ✕ only on the chore's own day), so the waiting part must leave it out itself.
  const vi = A.run("(function(){ day=_todayDay; return (rtStepsFor('chores','kid_a',false,day)||[]).findIndex(function(x){ return x&&x.label==='Vacuum the den'; }); })()");
  A.run("rtWave('chores','kid_a',_todayDay," + vi + ")"); await w.flush();
  const xw = JSON.parse(hhPages(A)), xn = A.run("(function(){ const d0=day; day=_todayDay; try{ return mdLateDays('chores','kid_a',_todayDay," + vi + ",rtStepsFor('chores','kid_a',false,day)[" + vi + "]); } finally{ day=d0; } })()");
  ok("Thu, Mom ✕-skips the waiting vacuum today: it is waved, and the lists' own count still says " + xn + " (so only the ✕ check keeps it off)", vi >= 0 && A.run("rtWaved('chores','kid_a',_todayDay," + vi + ")") === true && xn > 0, [vi, xn]);
  ok("…not under “Still on their list from an earlier day” on the living room's 🔴 Now", note(xw["room/living"], "Vacuum the den").indexOf("from Tue") < 0 && xw["room/living"].indexOf("Still on their list from an earlier day") < 0, strip(xw["room/living"]).slice(0, 500));
  ok("…not on 👤 By person ▸ Today (Kid_a)", !/Still on .{1,12}’s list from an earlier day/.test(xw["person/kid_a"]) && note(xw["person/kid_a"], "Vacuum the den").indexOf("from Tue") < 0);
  const nV = h => h.split(">Vacuum the den<").length - 1;
  ok("…not on 📅 Schedule today: no note, and one line fewer (today's box and the open day; Tuesday's box still has it, not done)", xw.sched.indexOf("from Tue · day 2") < 0 && thu.pgF.sched.indexOf("from Tue · day 2") > 0 && nV(xw.sched) === nV(thu.pgF.sched) - 2 && nV(xw.sched) >= 1, [nV(thu.pgF.sched), nV(xw.sched)]);
  ok("…and 🏠 Whole house ▸ 🔴 Now no longer counts it as waiting", !/🛋 Living room [^›]*waiting/.test(strip(xw["room/"]).split("tap one to open it")[1] || ""));
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL- threw " + (e && e.stack || e)); process.exit(1); });
