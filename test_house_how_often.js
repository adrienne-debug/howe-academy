/*
 * test_house_how_often.js — 📊 How often: her record of how often each chore really gets done (HOWOFTEN in house.js;
 * DESIGN_missed_chores_2026-11-19 §7, §10 row A; her "Yes, start it" 2026-11-19). Made-up family (Ada, Ben, Cal, Mom, Dad) and a
 * Click-off Log built by hand, so every answer is known:
 *   · a weekly chore done on its day, one and five days late, not done, waved, with the kid off, and still inside its wait;
 *     a chore ticked then un-ticked; a "— not done" line on a chore that was then done (done late, not dropped); a daily chore's
 *     count; a renamed chore; a chore that started three weeks ago; Mom's, Dad's and Up for Grabs chores with and without ticks
 *     (never dropped: "checked off N times"; hub's call 2026-11-19); "no record yet" for each kind that has none;
 *   · every mark agrees with the room grid's own squares (hhRmCell) for the same chore and day; the split line (Daily chores % of days ·
 *     Weekly chores N of M · K dropped) by hand, and "dropped" never holds a daily chore's un-ticked days;
 *   · each filter shows only its own chores, a chip changes it, another page puts it back; least done first; Show all;
 *   · the chore card's History line = the card's row for that chore; not Mom: no taps; ZERO writes on every draw and tap;
 *   · the rest of 🏠 Whole house, a room page, 👤 By person and the chore card byte for byte the app before this change
 *     (git show 8f71835c:house.js; skipped with a note if that commit is missing);
 *   · the draw time on a table her size (267 chores, 8 weeks of ticks).
 *   run: node test_house_how_often.js
 */
"use strict";
// One fixed day: Wed 2026-11-18, noon (pinned before the fixtures load; house_vm.js reads "today" from it).
{ const RealDate = Date, PIN = new RealDate(2026, 10, 18, 12, 0, 0).getTime(), t0 = RealDate.now(), now = () => PIN + (RealDate.now() - t0);
  global.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(now()); } static now() { return now(); } }; }
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process"), V = require(path.join(__dirname, "test_fixtures", "house_vm.js"));
const { K, TODAY, T, ago, mk, roomPage, handlers, dayNum, isoOf } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), strip = s => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const dow = n => (n + 3) % 7;   // Mon 0 … Sun 6
const prev = (d, back) => { let n = T - 1; while (dow(n) !== d) n--; return n - 7 * (back || 0); };   // the last <weekday> before today, back weeks

// ── the made-up family's table ──
const JOBS = () => ({
  k_mop: K({ label: "Mop the floor", emoji: "🪣", who: "ben", slot: "chores", cad: "wk:1", room: "kitchen", minutes: 15 }),
  l_rug: K({ label: "Shake the rug", who: "cal", slot: "chores", cad: "wk:1", room: "living", minutes: 5 }),
  k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10 }),
  l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "wk:3", room: "living", minutes: 5 }),
  b_mirror: K({ label: "Clean the mirror", who: "ada", slot: "chores", cad: "wk:0", room: "bathdown", minutes: 5, from: ago(21) }),
  k_trash: K({ label: "Empty the trash", who: "ben", slot: "chores", cad: "wk:0,2,4", room: "kitchen", minutes: 5 }),
  m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "daily", room: "kitchen", minutes: 10, src: { kind: "momChore", id: "fridge" } }),
  m_plants: K({ label: "Water the plants", who: "mom", slot: "", cad: "wk:4", room: "living", minutes: 10, src: { kind: "momChore", id: "plants" } }),
  d_curb: K({ label: "Trash to the curb", who: "dad", slot: "", cad: "wk:2", area: "pickup", room: "entry", minutes: 5, src: { kind: "dadChore", id: "curb" } }),
  d_gutter: K({ label: "Clear the gutter", who: "dad", slot: "", cad: "wk:5", room: "entry", minutes: 20, src: { kind: "dadChore", id: "gutter" } }),
  k_oven: K({ label: "Clean the oven", who: "cal", slot: "chores", cad: "14d", room: "kitchen", minutes: 20 }),
  k_fan: K({ label: "Dust the fan", who: "ben", slot: "chores", cad: "2w", room: "kitchen", minutes: 5 }),
  k_deep: K({ label: "Scrub the grout", who: "ada", slot: "chores", cad: "wk:2", cycW: 2, cycN: 4, cycStart: ago(60), room: "kitchen", minutes: 20 }),
  k_hood: K({ label: "Degrease the hood", who: "ben", slot: "chores", cad: "wk:4", level: 3, room: "kitchen", minutes: 15 }),
  k_spill: K({ label: "Mop up spills", who: "ada", slot: "chores", cad: "asneeded", room: "kitchen", minutes: 5 }),
  k_base: K({ label: "Wipe the baseboards", who: "grab", slot: "", cad: "wk:5", room: "kitchen", minutes: 15, pts: 10 }),
  k_win: K({ label: "Wipe the windows", emoji: "🪟", who: "grab", slot: "", cad: "daily", room: "kitchen", minutes: 10, pts: 8 }),
  k_paint: K({ label: "Touch up the paint", who: "mom", slot: "", cad: "once", room: "kitchen", minutes: 30 })
});
// ── the Click-off Log, by hand: routineLog/<kid>/<week>/<day>/<key> = {act, at, label, slot} ──
const DNS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function mkLog() {
  const L = {}; let seq = 0;
  const put = (kid, n, label, act, hour, slot) => { const iso = isoOf(n), d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8), hour || 9, 0, 0), w = "w" + isoOf(n - d.getDay()), dn = DNS[d.getDay()];
    ((L[kid] = L[kid] || {})[w] = L[kid][w] || {})[dn] = L[kid][w][dn] || {}; L[kid][w][dn]["e" + (++seq)] = { act, at: d.getTime(), label, slot: slot || "chores", pts: 1 }; };
  const TUE = k => prev(1, k), THU = k => prev(3, k), MON = k => prev(0, k);
  // Mop the floor (Ben, Tuesdays), oldest first: on its day · 1 day late · 5 days late · not done · a "— not done" line, then done 2 days late ·
  // waved by Mom · Ben off that day, not done · last Tuesday (yesterday) not done yet: still inside its wait
  put("ben", TUE(7), "Mop the floor", "on");
  put("ben", TUE(6) + 1, "Mop the floor", "on");
  put("ben", TUE(5) + 5, "Mop the floor", "on");
  put("ben", TUE(3) + 1, "Mop the floor — not done", "miss", 7); put("ben", TUE(3) + 2, "Mop the floor", "on");
  put("ben", TUE(2), "Mop the floor — waved by Mom", "wave");
  // Shake the rug (Cal, Tuesdays): done each week; 6 weeks back ticked and un-ticked the same day
  for (let k = 0; k < 8; k++) { if (k === 6) { put("cal", TUE(k), "Shake the rug", "on", 9); put("cal", TUE(k), "Shake the rug", "off", 10); } else put("cal", TUE(k), "Shake the rug", "on"); }
  // Wipe the counters (Ada, daily): done on the days 1…28 back where the number is not a multiple of 3 (19 of 28)
  for (let b = 1; b <= 28; b++) if (b % 3) put("ada", T - b, "Wipe the counters", "on");
  // Dust the den (Ben, Thursdays): renamed 3 weeks ago; the older 5 Thursdays are ticked under the old name "Dust the shelves"
  for (let k = 0; k < 8; k++) put("ben", THU(k), k < 3 ? "Dust the den" : "Dust the shelves", "on");
  // Wipe the windows (Up for Grabs, daily): grabbed 3 times in the last 4 weeks (a grab's log line carries the emoji)
  put("ada", T - 3, "🪟 Wipe the windows", "on", 9, "grab"); put("ben", T - 10, "🪟 Wipe the windows", "on", 9, "grab"); put("cal", T - 20, "🪟 Wipe the windows", "on", 9, "grab");
  // Clean the mirror (Ada, Mondays, started 21 days ago): done every Monday since it started
  for (let k = 0; k < 3; k++) put("ada", MON(k), "Clean the mirror", "on");
  // Empty the trash (Ben, Mon Wed Fri): done on its day except the two oldest of the last 4 weeks; the third oldest one day late
  const tr = []; for (let n = T - 28; n < T; n++) if ([0, 2, 4].includes(dow(n))) tr.push(n);
  tr.forEach((n, i) => { if (i < 2) return; put("ben", i === 2 ? n + 1 : n, "Empty the trash", "on"); });
  return L;
}
const MOMDAY = () => { const m = {}; for (let b = 1; b <= 28; b++) if (b % 4 === 0) m[ago(b)] = { chores: { fridge: true } }; return m; };   // 7 of 28
const DADDAY = () => ({ [isoOf(prev(2, 7))]: { chores: { curb: true } }, [isoOf(prev(2, 5) + 1)]: { chores: { curb: true } } });   // Wednesdays: oldest on the day, 3rd one a day late
const OFF = () => ({ ben: { [isoOf(prev(1, 1))]: { school: false, note: "Day off" } } });

function mkC(o) {
  o = o || {}; const c = mk(Object.assign({ jobs: JOBS(), momday: MOMDAY(), dadday: DADDAY(), hd: { meta: o.meta || { takeover: 1 } }, noMom: !!o.noMom }, o.mk || {}));
  if (o.base) { vm.runInContext(o.base, c, { filename: "house_base.js" }); c.householdOnValue(Object.assign({ jobs: JOBS(), meta: { takeover: 1 } }, { meta: o.meta || { takeover: 1 } })); }
  c.routineLog = mkLog(); c.calendarData.kidOverrides = OFF();
  c.lsw = []; const s0 = c.HA_LS.setItem; c.HA_LS.setItem = (k, v) => { c.lsw.push(k); s0(k, v); };
  c.writes.length = 0; return c;
}
const recOf = (c, id) => JSON.parse(c.get("JSON.stringify(hoRec(" + J(id) + ",hoX()))"));
const marks = r => r.marks.map(x => ({ on: "●", late: "◐", drop: "○", skip: "–" })[x.m]).join("");
const textOf = (c, id) => strip(c.get("hoText(hoRec(" + J(id) + ",hoX()))"));
const F = c => JSON.parse(c.get("JSON.stringify(hoF)"));
const person = (c, who) => { c.get('hhView="person"; hpSel=' + J(who)); return c.hpPersonHTML(); };
const rowsOf = (c, f) => JSON.parse(c.get("JSON.stringify(hoRows(" + J(f) + ",hoX()))"));
const state = c => c.get("JSON.stringify([householdData,houseDayData,routineLog,momdayData,daddayData,calendarData])");

console.log("\n── the clock and the made-up log ──");
{ ok("today is Wed 2026-11-18 and the weekday sum agrees with the app's (_hhDow)", TODAY === "2026-11-18" && dow(T) === 2);
  const c = mkC(); ok("house.js loaded with the 📊 card", typeof c.hoCardHTML === "function" && typeof c.hoRec === "function"); }

console.log("\n── each mark, from the ticks ──");
{ const c = mkC(), R = id => recOf(c, id);
  const mop = R("k_mop");
  ok("Mop the floor (weekly): ● on its day · ◐ 1 day late · ◐ 5 days late · ○ not done · ◐ after a “not done” line · – waved · – Ben off", marks(mop) === "●◐◐○◐––" && mop.form === "marks", marks(mop));
  ok("…the late ones are 1, 5 and 2 days late", J(mop.marks.filter(x => x.m === "late").map(x => x.q)) === J([1, 5, 2]));
  ok("…the “— not done” line does not make it dropped (it reads done late)", mop.marks[4].m === "late" && mop.marks[4].n === prev(1, 3));
  ok("…the waved one and the day off are not counted; the off one says so", mop.marks[5].m === "skip" && !mop.marks[5].off && mop.marks[6].m === "skip" && mop.marks[6].off === 1);
  ok("…yesterday's (still inside its wait, not done yet) has no mark", !mop.marks.some(x => x.n === prev(1, 0)));
  ok("…its line: “4 of the last 5 · 3 late · 1 dropped · 2 not counted”", textOf(c, "k_mop") === "4 of the last 5 · 3 late · 1 dropped · 2 not counted", textOf(c, "k_mop"));
  const rug = R("l_rug");
  ok("Shake the rug: ticked then un-ticked the same day is not done (○); yesterday done on the day (●)", marks(rug) === "●○●●●●●●" && textOf(c, "l_rug") === "7 of the last 8 · 1 dropped", [marks(rug), textOf(c, "l_rug")]);
  const ctr = R("k_counter");
  ok("Wipe the counters (daily): a count, not marks — “19 of the last 28 days”", ctr.form === "count" && textOf(c, "k_counter") === "19 of the last 28 days" && ctr.marks.length === 28, textOf(c, "k_counter"));
  ok("…and no marks drawn for it", c.get("hoMarksHTML(hoRec('k_counter',hoX()))") === "");
  const tr = R("k_trash");
  ok("Empty the trash (Mon Wed Fri): a count of times, “10 of the last 12 times · 1 late”", tr.form === "count" && textOf(c, "k_trash") === "10 of the last 12 times · 1 late", textOf(c, "k_trash"));
  const dust = R("l_dust");
  ok("Dust the den, renamed 3 weeks ago: the ticks under the old name do not match, so the older 5 read ○ (the log knows a chore by its name)", marks(dust) === "○○○○○●●●" && textOf(c, "l_dust") === "3 of the last 8 · 5 dropped", [marks(dust), textOf(c, "l_dust")]);
  const mir = R("b_mirror");
  ok("Clean the mirror, started 3 weeks ago: – before it started, then ● ● ●", marks(mir) === "–––––●●●" && textOf(c, "b_mirror") === "3 of the last 3 · 5 not counted", [marks(mir), textOf(c, "b_mirror")]);
  const fr = R("m_fridge");
  ok("Mom's daily with ticks: never dropped — “checked off 7 times · last 4 weeks”, only the ticked days kept", fr.form === "ticks" && textOf(c, "m_fridge") === "checked off 7 times · last 4 weeks" && fr.marks.length === 7 && fr.marks.every(x => x.m === "on"), textOf(c, "m_fridge"));
  ok("Mom's weekly with no ticks: no record yet (never 0%)", R("m_plants").form === "none" && textOf(c, "m_plants") === "no record yet · no check-offs");
  const cu = R("d_curb");
  ok("Dad's weekly with ticks (one on the day, one a day late, six Wednesdays un-ticked): “checked off 2 times · last 8 weeks”, no marks, no dropped", cu.form === "ticks" && marks(cu) === "●◐" && textOf(c, "d_curb") === "checked off 2 times · last 8 weeks" && c.get("hoMarksHTML(hoRec('d_curb',hoX()))") === "", [marks(cu), textOf(c, "d_curb")]);
  ok("Up for Grabs with a few ticks: “checked off 3 times · last 4 weeks”", R("k_win").form === "ticks" && textOf(c, "k_win") === "checked off 3 times · last 4 weeks", textOf(c, "k_win"));
  ok("Dad's with no ticks: no record yet", textOf(c, "d_gutter") === "no record yet · no check-offs");
  ok("Up for Grabs with no ticks: no record yet", textOf(c, "k_base") === "no record yet · no check-offs");
  ok("every 14 days: no record yet", textOf(c, "k_oven") === "no record yet · every 14 days", textOf(c, "k_oven"));
  ok("every 2 weeks: no record yet", textOf(c, "k_fan") === "no record yet · every 2 weeks", textOf(c, "k_fan"));
  ok("the 4-week cycle: no record yet", textOf(c, "k_deep") === "no record yet · 4-week cycle");
  ok("above the level (Level 3, house at 1): no record yet", textOf(c, "k_hood") === "no record yet · above the level" && c.hhLevelOut(c.hhJobs().k_hood) === false);
  ok("as needed: no record yet", textOf(c, "k_spill") === "no record yet · as needed");
  ok("a one-time job is not on the card (it lives on 📝 To do)", c.get("hoRec('k_paint',hoX())") === null && !/Touch up the paint/.test(c.get("hoF={k:'all'},hoAll=true,hoKey=hoHome().key,hoCardHTML()")));
}

console.log("\n── every mark agrees with the room grid's squares (hhRmCell), chore by chore, day by day ──");
{ const c = mkC(), S = c.hhLogState(), rc = {}, cell = (id, n) => c.hhRmCell(id, isoOf(n), TODAY, S, rc), Jb = c.hhJobs(), bad = [];
  Object.keys(Jb).forEach(id => { const r = recOf(c, id); if (!r || r.form === "none") return; const ds = c.hoDays(Jb[id].cad), due = n => ds.includes(dow(n)), by = {};
    r.marks.forEach(m => { by[m.n] = m; });
    for (let n = T - (r.form === "ticks" ? 7 * r.wk : r.form === "count" ? 28 : 56); n < T; n++) { if (!due(n)) continue; let nx = n + 1; while (!due(nx)) nx++; const m = by[n], c0 = cell(id, n);
      let later = 0; for (let k = n + 1; k < nx && k <= T; k++) { const d = cell(id, k); if (d && d.done) { later = k - n; break; } }
      let want = !c0 ? "skip" : c0.done ? "on" : later ? "late" : c.hdKidOff(c0.who, isoOf(n)) ? "skip" : nx <= T ? "drop" : "none";
      if (r.form === "ticks" && want !== "on" && want !== "late") want = "none";   // a grown-up's / grab's: only the times checked off
      if ((m ? m.m : "none") !== want || (m && m.m === "late" && m.q !== later) || (m && m.m !== "skip" && m.who !== c0.who)) bad.push([id, isoOf(n), m && m.m, want]); } });
  ok("each time due: ● = a ✓ square that day (grown-ups and grabs: only these and ◐ are kept), ◐ = a pale square then a ✓ before its next day (same days late), ○ = no ✓ by its next day, – = no square (or the kid off), nothing = still waiting; who = the square's", bad.length === 0, bad);
  const all = rowsOf(c, { k: "all" }), n4 = all.reduce((a, x) => a.concat(x.r.marks.filter(m => m.n >= T - 28)), []);
  ok("…and the times counted are exactly the marks (no extra, none missing)", all.every(x => x.s.n === x.r.marks.filter(m => m.m !== "skip").length));
  ok("…every row's numbers add up (done = ● + ◐, of = done + ○)", all.every(x => x.s.done === x.s.on + x.s.late && x.s.n === x.s.done + x.s.drop) && n4.length > 0);
}

console.log("\n── the line for the filter, worked by hand ──");
{ const c = mkC();
  // Kitchen, the last 28 days (T-28 … T-1). Daily chores (3+ a week, kids'): Wipe the counters 19 of 28, Empty the trash 10 of 12 → 29 of 40
  // = 72.5 → 73% of days. Weekly chores: Mop the floor's Tuesdays T-22 ◐ (the "not done" line, then done T-20), T-15 – waved, T-8 – Ben off,
  // T-1 still waiting → 1 of 1, nothing dropped. Out of the line: Mom's fridge and the windows grab (checked off), and 6 with no record yet
  // (oven, fan, grout, hood, spills, baseboards). The counters' 9 and the trash's 2 un-ticked days are NOT "dropped".
  roomPage(c, "kitchen"); const h = c.hoCardHTML(), L = JSON.parse(c.get("JSON.stringify(hoLine(hoRows(hoF,hoX()),hoX()))"));
  ok("Kitchen: daily chores 29 of 40 days = 73%; weekly chores 1 of 1, 0 dropped; 2 checked-off rows and 6 no-record rows left out", J(L) === J({ dl: { pct: 73, done: 29, n: 40 }, wk: { done: 1, n: 1, drop: 0 }, none: 6, ticks: 2 }), L);
  const lt = strip(c.get("hoLineTxt(hoLine(hoRows(hoF,hoX()),hoX()))"));
  ok("…drawn as “🍳 Kitchen + dining · last 4 weeks · Daily chores 73% of days · Weekly chores 1 of 1” — no “dropped” (no ○ in those weeks)", lt === "last 4 weeks · Daily chores 73% of days · Weekly chores 1 of 1" && strip(h).indexOf("🍳 Kitchen + dining · " + lt + " ") >= 0, [lt, strip(h).slice(0, 300)]);
  ok("…and the note says exactly what is counted and what is left out", strip(h).indexOf("The top line is the last 4 weeks: daily chores (3 or more times a week) as the share of their days done (29 of 40); weekly chores (once or twice a week) as times done of times due, dropped = not done by its next day. Late counts as done. Mom’s, Dad’s and Up for Grabs chores are never counted as dropped: they show how often they were checked off and stay out of the top line (2 here). Left out too: what was not counted, the 6 with no record yet and any chore still inside its wait.") >= 0, strip(h).slice(strip(h).indexOf("The top line")));
  ok("…and how far back it looks", /Looks back 8 weeks \(3 or more times a week: 4 weeks\)/.test(strip(h)) && /the last 8 weeks of check-offs/.test(h));
  // Whole house: daily as the kitchen (29 of 40 = 73%). Weekly, the last 4 weeks: mop 1 of 1 · rug T-1, T-8, T-15, T-22 all ● → 4 of 4 · den T-6,
  // T-13, T-20 ● and T-27 ○ (ticked under its old name) → 3 of 4 · mirror T-2, T-9, T-16 ●, T-23 – (before it started) → 3 of 3 = 11 of 12, 1 dropped.
  roomPage(c, ""); const w = strip(c.hoCardHTML()), LW = JSON.parse(c.get("JSON.stringify(hoLine(hoRows(hoF,hoX()),hoX()))"));
  ok("Whole house: “last 4 weeks · Daily chores 73% of days · Weekly chores 11 of 12 · 1 dropped”", /Whole house · last 4 weeks · Daily chores 73% of days · Weekly chores 11 of 12 · 1 dropped/.test(w) && J(LW.wk) === J({ done: 11, n: 12, drop: 1 }), [w.slice(0, 200), LW]);
  ok("…“dropped” = the weekly ○ marks only: the dailies' 11 un-ticked days and the grown-ups' un-ticked days are not in it", LW.wk.drop === 1 && LW.dl.n - LW.dl.done === 11);
  roomPage(c, "entry"); const e = strip(c.hoCardHTML());
  ok("Entry: only Dad's chores (curb checked off twice, gutter none) → the line says “no record yet”, the curb row “checked off 2 times · last 8 weeks”", /Entry \+ hallway · no record yet/.test(e) && /Trash to the curb Dad · Weekly · Wed checked off 2 times · last 8 weeks/.test(e) && !/dropped/.test(e.slice(0, e.indexOf("●"))), e.slice(0, 300));
  c.get('hhView="person"; hpSel="mom"'); c.hpPersonHTML(); const m = strip(c.hoCardHTML());
  ok("👤 Mom: “no record yet” on the line; her fridge “checked off 7 times”; no % and no dropped about her", /👤 Mom · no record yet/.test(m) && /Wipe the fridge Mom · Daily checked off 7 times · last 4 weeks/.test(m) && !/% of days|dropped/.test(m.slice(0, m.indexOf("●"))), m.slice(0, 300));
}

console.log("\n── filters: each shows its own chores; a chip changes it; another page puts it back ──");
{ const c = mkC(), Jb = c.hhJobs();
  roomPage(c, "kitchen"); ok("a room page → that room", J(F(c)) === J({ k: "room", id: "kitchen" }));
  const kit = rowsOf(c, { k: "room", id: "kitchen" });
  ok("a room: only that room's chores (one-time jobs left out)", kit.length === 11 && kit.every(x => c.hhRoomOn(Jb[x.id]) === "kitchen"), kit.map(x => x.id));
  roomPage(c, ""); ok("🏠 Whole house → Everything", J(F(c)) === J({ k: "all" }));
  const all = rowsOf(c, { k: "all" }); ok("Everything: every chore with a schedule, every room", all.length === 17 && ["kitchen", "living", "bathdown", "entry"].every(r => all.some(x => c.hhRoomOn(Jb[x.id]) === r)), all.length);
  person(c, "ben"); ok("👤 By person → that person", J(F(c)) === J({ k: "who", id: "ben" }));
  const ben = rowsOf(c, { k: "who", id: "ben" });
  ok("a person: only the times that were theirs, from every room", ben.length && ben.every(x => x.r.marks.every(m => m.who === "ben")) && ben.some(x => Jb[x.id].room === "living") && ben.some(x => Jb[x.id].room === "kitchen"), ben.map(x => x.id));
  ok("…their chores with no record yet are there too (fan, hood), and nobody else's", ["k_fan", "k_hood"].every(id => ben.some(x => x.id === id)) && !ben.some(x => Jb[x.id].who !== "ben"));
  roomPage(c, "kitchen"); c.get("hoPick('who','cal')"); let h = roomPage(c, "kitchen");
  ok("a chip tap changes it for now (kitchen → Cal) and it stays while she is on the room", J(F(c)) === J({ k: "who", id: "cal" }) && /onchange="hoPick\('who',this.value\)"[^>]*><option value="">👤 Person ▾<\/option>.*<option value="cal" selected>Cal<\/option>/.test(h));
  ok("…the Schedule card's filter is its own (still the kitchen)", J(JSON.parse(c.get("JSON.stringify(hwF)"))) === J({ k: "room", id: "kitchen" }));
  roomPage(c, "living"); ok("another room → that room's own setting", J(F(c)) === J({ k: "room", id: "living" }));
  c.get("hoPick('all')"); person(c, "ada"); ok("another page (By person) → that person", J(F(c)) === J({ k: "who", id: "ada" }));
  c.get("hpPick('cal')"); person(c, "cal"); ok("another person → that person", J(F(c)) === J({ k: "who", id: "cal" }));
  roomPage(c, ""); c.get("hoPick('room','attic_gone')"); c.get("hoPick('who','nobody')"); c.get("hoPick('laundry')"); c.get("hoPick('room','')");
  ok("an unknown room / person, a 🧺 Laundry pick, an empty pick change nothing", J(F(c)) === J({ k: "all" }));
  h = c.hoCardHTML(); ok("the chips: Everything · 🚪 Room ▾ · 👤 Person ▾ — no 🧺 Laundry", /hoPick\('all'\)/.test(h) && /🚪 Room ▾/.test(h) && /👤 Person ▾/.test(h) && !/Laundry/.test(h));
  ok("no 🔀 anywhere in the card", h.indexOf("🔀") < 0);
  ok("❔ No room page: no 📊 card (as the Schedule card's homes go)", (() => { const n = mkC({ mk: { jobs: Object.assign(JOBS(), { z: K({ label: "Lost chore", who: "ada", slot: "chores", cad: "wk:1", room: "gone_room" }) }) } }); return !/📊 How often/.test(roomPage(n, "__none")) && /📊 How often/.test(roomPage(n, "kitchen")); })());
}

console.log("\n── least done first, and Show all ──");
{ const c = mkC(); roomPage(c, ""); const rows = rowsOf(c, { k: "all" }), rate = x => x.rate;
  ok("rows go least done first; then the 3 grown-up / grab rows that were checked off; the 8 with no record yet last", rows.every((x, i) => !i || rate(rows[i - 1]) <= rate(x)) && J(rows.map(x => x.rate === 2 ? "none" : x.rate === 1.5 ? "ticks" : "kid")) === J(Array(6).fill("kid").concat(Array(3).fill("ticks"), Array(8).fill("none"))), rows.map(x => [x.id, x.rate]));
  ok("…the kids': Dust the den 3/8, the counters 19/28, Mop 4/5, the trash 10/12, the rug 7/8, the mirror 3/3", J(rows.slice(0, 6).map(x => x.id)) === J(["l_dust", "k_counter", "k_mop", "k_trash", "l_rug", "b_mirror"]), rows.slice(0, 6).map(x => x.id));
  ok("…then the checked-off ones by name: Trash to the curb, Wipe the fridge, Wipe the windows", J(rows.slice(6, 9).map(x => x.id)) === J(["d_curb", "m_fridge", "k_win"]), rows.slice(6, 9).map(x => x.id));
  let h = c.hoCardHTML(), drawn = (h.match(/hcOpen\('/g) || []).length;
  ok("8 rows shown, then “Show all 17”", drawn === 8 && /Show all 17/.test(h), drawn);
  c.get("hoMore()"); h = roomPage(c, ""), drawn = (c.hoCardHTML().match(/hcOpen\('/g) || []).length;
  ok("Show all → all 17 rows, and “Show fewer”", drawn === 17 && /Show fewer/.test(c.hoCardHTML()));
  roomPage(c, "kitchen"); roomPage(c, ""); ok("…another page folds it again", c.get("hoAll") === false);
  const order = rows.map(x => x.id), html = c.hoCardHTML(); c.get("hoMore()"); const H = c.hoCardHTML(); let last = -1, good = true;
  order.forEach(id => { const i = H.indexOf("hcOpen('" + id + "')"); if (i < last) good = false; last = i; });
  ok("…drawn in that order", good && html.length > 0);
}

console.log("\n── the chore card ▸ History ──");
{ const c = mkC(); roomPage(c, "kitchen");
  for (const id of ["k_mop", "k_counter", "d_curb", "m_fridge", "k_win", "k_oven", "m_plants"]) {
    c.get("hcId=" + J(id)); const card = c.hcCardHTML(), line = c.hoHistHTML(id), r = "hoRec(" + J(id) + ",hoX())", want = c.get("hoMarksHTML(" + r + ")") + '<span style="color:#475569">' + c.get("hoText(" + r + ")") + "</span>";
    c.get("hoF={k:'all'},hoAll=true"); const row = c.hoCardHTML(), ri = row.indexOf("hcOpen('" + id + "')"), rowHtml = row.slice(ri, row.indexOf("</div>", ri));
    ok(id + ": the card's History holds this chore's line, the same marks and words as its row on the 📊 card", card.indexOf(line) > 0 && line.indexOf(want) > 0 && rowHtml.indexOf(c.get("hoMarksHTML(" + r + ")") + '<span style="font-size:11px') > 0 && strip(rowHtml).endsWith(strip(c.get("hoText(" + r + ")"))), strip(line));
  }
  c.get("hcId='k_mop'"); const mc = strip(c.hcCardHTML());
  ok("Mop the floor: the new line says “Last checked off 10/29 by Ben” (ticked Thu, the late finish of 10/27's) and never “Last done”", /Last checked off 10\/29 by Ben/.test(c.hoHistHTML("k_mop")) && !/Last done/.test(c.hoHistHTML("k_mop")), strip(c.hoHistHTML("k_mop")));
  ok("…today's “Last done 10/27 by Ben” line (hhStats, the day the time was due) is still there, untouched", mc.indexOf("History Last done 10/27 by Ben on time 4 wk") >= 0, mc.slice(mc.indexOf("History"), mc.indexOf("History") + 120));
  ok("Shake the rug: “Last checked off 11/17 by Cal”", /Last checked off 11\/17 by Cal/.test(c.hoHistHTML("l_rug")));
  ok("Wipe the windows (a grab): “Last checked off 11/15 by Up for Grabs”, the line “checked off 3 times · last 4 weeks”", /Last checked off 11\/15 by Up for Grabs/.test(c.hoHistHTML("k_win")) && /checked off 3 times · last 4 weeks/.test(c.hoHistHTML("k_win")), strip(c.hoHistHTML("k_win")));
  ok("Clean the oven (no record yet, never ticked): “Not checked off in the last 8 weeks”", /no record yet · every 14 days/.test(strip(c.hoHistHTML("k_oven"))) && /Not checked off in the last 8 weeks/.test(c.hoHistHTML("k_oven")));
  ok("the old History chips and badges are still there", /on time 4 wk/.test(c.hcCardHTML()) && /Last done/.test(c.hcCardHTML()));
}

console.log("\n── zero writes; not Mom: no taps ──");
{ for (const [name, meta] of [["plan off", { takeover: 1 }], ["preview", { takeover: 1, engine: { mode: "preview", on: TODAY } }]]) {
    const c = mkC({ meta }), s0 = state(c), errs = []; let n = 0;
    for (const draw of [() => roomPage(c, "kitchen"), () => roomPage(c, ""), () => person(c, "ben")]) { draw(); const hs = handlers(c.hoCardHTML());
      hs.forEach(t => { n++; const v = /hoPick\('room'/.test(t) ? "living" : /hoPick\('who'/.test(t) ? "cal" : ""; try { c.get(t.replace(/this\.value/g, J(v))); } catch (e) { errs.push([t, e.message]); } c.get("hcId=''"); draw(); }); }
    c.get("hcId='k_mop'"); c.hcCardHTML(); c.hoHistHTML("k_mop");
    ok(name + ": every tap on the card ran (" + n + "), the chore card drew", n > 10 && errs.length === 0, errs);
    ok(name + ": …nothing written (database, browser storage), no data changed", c.writes.length === 0 && c.lsw.length === 0 && state(c) === s0, [c.writes, c.lsw]);
  }
  const k = mkC({ noMom: true }); roomPage(k, ""); const h = k.hoCardHTML();
  ok("not Mom: the card draws, no row opens a chore card", /📊 How often/.test(h) && !/hcOpen\(/.test(h) && /Mop the floor/.test(h));
}

// HOUSEQUIET (slice B of the missed-chores design, 2026-11-23) changes on purpose what the Household pages draw (test_house_quiet.js);
// every caller asks typeof first, so this comparison with the app before runs on house.js with that block cut out.
const noQ = s => { const i = s.indexOf("// HOUSEQUIET_START"); return i < 0 ? s : s.slice(0, i) + s.slice(s.indexOf("\n", s.indexOf("// HOUSEQUIET_END")) + 1); };
console.log("\n── the rest of the three pages and the chore card: byte for byte the app before this change (8f71835c) ──");
{ let base = null; try { base = cp.execSync("git show 8f71835c:house.js", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { base = null; }
  if (!base) console.log("  (skipped: commit 8f71835c is not in this checkout)");
  else for (const [name, meta] of [["plan off", { takeover: 1 }], ["preview", { takeover: 1, engine: { mode: "preview", on: TODAY } }]]) {
    const N = mkC({ meta, mk: { house: false }, base: noQ(V.HJS) }), O = mkC({ meta, mk: { house: false }, base });   // HOUSEQUIET: noQ
    const cut = (c, h) => { const k = c.hoCardHTML(); const i = h.indexOf(k); return i < 0 ? null : h.slice(0, i) + h.slice(i + k.length); };
    for (const rid of ["kitchen", "living", "entry", ""]) { const a = roomPage(N, rid), b = roomPage(O, rid);
      ok(name + ": " + (rid || "🏠 Whole house") + " = before, apart from the 📊 card", a !== b && cut(N, a) === b, [a.length, b.length]); }
    for (const who of ["ben", "mom"]) { const a = person(N, who), b = person(O, who); ok(name + ": 👤 By person " + who + " = before, apart from the 📊 card", a !== b && cut(N, a) === b); }
    for (const id of ["k_mop", "k_oven", "m_fridge"]) { N.get("hcId=" + J(id)); O.get("hcId=" + J(id)); const a = N.hcCardHTML(), b = O.hcCardHTML(), l = N.hoHistHTML(id), m = N.get("typeof cdrCardHTML==='function'?cdrCardHTML(" + J(id) + "):''");   // CARDRULES (slice D): the card's "If it is missed" part is new since
      ok(name + ": the chore card (" + id + ") = before, apart from its 📊 line (and slice D's \"If it is missed\")", a.indexOf(l) > 0 && a.replace(l, "").replace(m, "") === b); }
    roomPage(N, "kitchen"); roomPage(O, "kitchen"); ok(name + ": the 📅 Schedule card's chips are unchanged (Everything · 🧺 Laundry · Room · Person)", N.hwChips({ k: "room", id: "kitchen" }) === O.hwChips({ k: "room", id: "kitchen" }));
  }
}

console.log("\n── a table her size: 267 chores, 8 weeks of ticks ──");
{ const jobs = {}, rooms = ["kitchen", "living", "bathdown", "entry", "school", "boys", "playroom"], who = ["ada", "ben", "cal", "mom", "dad"], cads = ["daily", "wk:1", "wk:3", "wk:0,2,4", "wk:5", "14d", "daily", "wk:2"];
  for (let i = 0; i < 267; i++) { const w = who[i % 5]; jobs["j" + i] = K({ label: "Chore " + i, who: w, slot: (w === "mom" || w === "dad") ? "" : "chores", cad: cads[i % cads.length], room: rooms[i % rooms.length], minutes: 5, src: (w === "mom" || w === "dad") ? { kind: w + "Chore", id: "s" + i } : { kind: "new" } }); }
  const c = mk({ jobs, hd: { meta: { takeover: 1 } } }), L = {}; let seq = 0;
  for (let b = 1; b <= 56; b++) { const n = T - b, iso = isoOf(n), d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8), 9), w = "w" + isoOf(n - d.getDay()), dn = DNS[d.getDay()];
    for (let i = 0; i < 267; i++) { const k = ["ada", "ben", "cal"].indexOf(who[i % 5]); if (k < 0 || (i + b) % 3 === 0) continue; const kid = who[i % 5];
      ((L[kid] = L[kid] || {})[w] = L[kid][w] || {})[dn] = L[kid][w][dn] || {}; L[kid][w][dn]["e" + (++seq)] = { act: "on", at: d.getTime(), label: "Chore " + i, slot: "chores" }; } }
  c.routineLog = L; c.hhLogState(); c.get('hhView="rooms"; hhRmSel=""');
  const RealNow = () => process.hrtime.bigint(); let t0 = RealNow(); c.hoCardHTML(); const first = Number(RealNow() - t0) / 1e6;
  t0 = RealNow(); for (let i = 0; i < 5; i++) c.hoCardHTML(); const each = Number(RealNow() - t0) / 5e6;
  c.get('hhRmSel="kitchen"'); t0 = RealNow(); c.hoCardHTML(); const room = Number(RealNow() - t0) / 1e6;
  const calls = (() => { let k = 0; const f = c.hhRmCell; c.hhRmCell = function () { k++; return f.apply(this, arguments); }; c.get('hhRmSel=""'); c.hoCardHTML(); c.hhRmCell = f; return k; })();
  console.log("  (Everything, " + Object.keys(jobs).length + " chores, " + seq + " ticks: first draw " + first.toFixed(1) + " ms, then " + each.toFixed(1) + " ms a draw; one room " + room.toFixed(1) + " ms; " + calls + " grid squares read)");
  ok("Everything on a table her size draws in under 400 ms (" + each.toFixed(0) + " ms)", each < 400);
  ok("…each grid square is read at most once a draw (≤ 267 × 57)", calls <= 267 * 57, calls);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
