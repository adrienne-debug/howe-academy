/*
 * test_house_week.js — 📅 Schedule: the ONE week card with a filter (HOUSEWEEK in house.js; DESIGN_now_todo_schedule_2026-11-17 §2
 * "Schedule", §3, §5 row B; her "Yes, start B" 2026-11-17). Made-up family (Ada, Ben, Cal, Mom, Dad).
 *   · each page opens the card on its own setting (a room → that room, 🏠 Whole house → Everything, 👤 By person → that person), a chip
 *     changes it for now, and another room / person / page puts it back;
 *   · each filter shows only its own rows; past days = the room grid's squares (hhRmCell), today = 🔴 Now's rows (rnRows), days ahead =
 *     the plan's run (hpRun) on preview / ON, nothing with the plan off (and no engine run), "past the plan" after its 29 days;
 *   · the dailies fold into one line with the right counts; laundry loads come first on Everything; 🧺 Laundry is the laundry code's
 *     own week (llWeekGridHTML, read-only) with its own ‹ ›;
 *   · the room's big grid is folded shut by default and opens; nothing else on the three pages changes;
 *   · ZERO writes on every draw and every tap (database, browser storage, the table, houseDay, the laundry line);
 *   · the whole app (test_fixtures/house_world.js), plan on preview: draws and taps write nothing, ‹ › of 🧺 Laundry redraws the page.
 *   run: node test_house_week.js
 */
"use strict";
// One fixed day for this file (fix 2026-11-19): Wed 2026-11-18. The week card needs days ahead of today and a laundry load today; on a
// Thu–Sun run the checks on those flipped (Fri–Sun: no laundry/no days ahead), so the result hung on the day it ran. The clock is
// pinned before the fixtures load (house_vm.js reads "today" from it); it still ticks, so the timing check below measures real time.
{ const RealDate = Date, PIN = new RealDate(2026, 10, 18, 12, 0, 0).getTime(), t0 = RealDate.now(), now = () => PIN + (RealDate.now() - t0);
  global.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(now()); } static now() { return now(); } }; }
const path = require("path"), vm = require("vm"), V = require(path.join(__dirname, "test_fixtures", "house_vm.js")), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const { K, TODAY, T, ago, DOW, mk, roomPage, handlers, dayNum } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = x => JSON.stringify(x), strip = s => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const LB = V.RAW.slice(V.RAW.indexOf("// LAUNDRYLINE_START"), V.RAW.indexOf("// LAUNDRYLINE_END"));   // the laundry code, as it is in index.html
const JOBS = () => ({
  k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, can: ["ada", "ben"] }),
  k_sink: K({ label: "Scrub the sink", emoji: "🚰", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10 }),
  k_chairs: K({ label: "Wipe the chairs", who: "ben", slot: "chores", cad: "daily", room: "kitchen", minutes: 5 }),
  k_fish: K({ label: "Feed the fish", emoji: "🐟", who: "cal", slot: "morning", cad: "daily", area: "animals", room: "kitchen" }),
  m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "daily", room: "kitchen", minutes: 10, src: { kind: "momChore", id: "fridge" } }),
  k_mop: K({ label: "Mop the floor", emoji: "🪣", who: "ben", slot: "chores", cad: "wk:" + ((DOW + 3) % 7), room: "kitchen", minutes: 15, can: ["ben", "ada"] }),
  k_oven: K({ label: "Clean the oven", who: "cal", slot: "chores", cad: "14d", room: "kitchen", minutes: 20, lastDone: ago(10) }),
  l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "daily", room: "living", minutes: 5 }),
  l_rug: K({ label: "Shake the rug", who: "cal", slot: "chores", cad: "wk:" + DOW, room: "living", minutes: 5 }),
  d_trash: K({ label: "Trash to the curb", who: "dad", slot: "", cad: "wk:" + DOW, area: "pickup", room: "entry", minutes: 5, src: { kind: "dadChore", id: "trash" } })
});
const KD = ["k_counter", "k_sink", "k_chairs", "k_fish", "m_fridge"];   // the kitchen's dailies
const CLEAN = () => ({ [ago(1)]: { done: { k_counter: { who: "ben" }, k_sink: { who: "ada" } } }, [ago(2)]: { done: { k_counter: { who: "ada" }, k_sink: { who: "ada" }, k_chairs: { who: "ben" }, k_fish: { who: "cal" }, m_fridge: { who: "mom" } } }, [ago(3)]: { done: { k_mop: { who: "ada" } } } });
const MOMDAY = { [TODAY]: { chores: { fridge: true } } };
const PREVIEW = { takeover: 1, engine: { mode: "preview", on: TODAY } }, ONM = { takeover: 1, engine: { mode: "on", on: ago(3) } };
const DAY = () => ({ [TODAY]: { built: { ok: 1, sig: "x" },
  plan: { k_counter: { who: "ben", mins: 10, order: 0, why: "given", late: 0, k: "daily", from: "ada" }, k_sink: { who: "ada", mins: 10, order: 1, late: 2, k: "daily" }, m_fridge: { who: "mom", mins: 10, order: 0, late: 0, k: "daily" }, l_dust: { who: "ben", mins: 5, order: 1, late: 0, k: "daily" } },
  over: { k_mop: { turn: "ben", mins: 15, k: "days", late: 1 } }, done: { m_fridge: { who: "mom", ts: "9:00 AM" } } } });
// The Household page in a vm (test_fixtures/house_vm.js) + the laundry code beside it, with every write recorded.
function mkW(o) {
  o = o || {}; const c = mk(Object.assign({ jobs: JOBS(), momday: MOMDAY, hd: Object.assign({ meta: o.meta || { takeover: 1 }, cleanday: CLEAN() }, o.hd || {}) }, o.mk || {}));
  vm.runInContext("var calNormDate=function(s){ return s; }, _lbWrite=function(){ return true; }, kitPinGate=function(){}, event={stopPropagation:function(){}};\n" + LB, c);
  c.laundryLineOnValue({ log: { [ago(1)]: { ben: { at: 1, done: true } } } });
  c.lsw = []; const s0 = c.HA_LS.setItem; c.HA_LS.setItem = (k, v) => { c.lsw.push(k); s0(k, v); };
  c.runs = 0; const E = c.get("HouseEng"), r0 = E.run; E.run = function () { c.runs++; return r0.apply(E, arguments); };
  c.writes.length = 0; return c;
}
const F = c => JSON.parse(c.get("JSON.stringify(hwF)"));
const WD = (c, f, wk) => JSON.parse(c.get("JSON.stringify(hwWeekData(" + J(f) + "," + wk + "))"));
const wkOf = iso => Math.floor((dayNum(iso) - (T - DOW)) / 7);
const dayOf = (c, f, iso) => WD(c, f, wkOf(iso)).find(d => d.iso === iso);
const cellsGrid = (c, rid, iso) => { const S = c.hhLogState(), rc = {}, out = {}; (c.hhRoomChores()[rid] || []).forEach(id => { const x = c.hhRmCell(id, iso, TODAY, S, rc); if (x) out[id] = { who: x.who, done: !!x.done }; }); return wd(out); };
const wd = m => { const o = {}; Object.keys(m || {}).sort().forEach(id => { o[id] = { who: m[id].who, done: !!m[id].done }; }); return o; };
const fromNow = (c, rid) => { const R = c.rnRows(rid), o = {}; R.rows.forEach(x => { o[x.id] = { who: x.who, done: !!x.done }; }); R.over.forEach(x => { o[x.id] = { who: x.turn, done: false }; }); return wd(o); };
const person = (c, who) => { c.get('hhView="person"; hpSel=' + J(who)); return c.hpPersonHTML(); };
const box = (h, iso) => { const i = h.indexOf("hwDayTap('" + iso + "')"); if (i < 0) return ""; const n = h.indexOf("hwDayTap('", i + 5); return h.slice(i, n < 0 ? h.indexOf('<div style="padding:6px 12px 8px', i) : n); };
const state = c => c.get("JSON.stringify([householdData,houseDayData,laundryLine,routineLog,momdayData,daddayData])");
// Run every tap on a card (each onclick / onchange; a select gets a real choice), then check: nothing written anywhere.
function tapAll(c, h, label) {
  const s0 = state(c), errs = [], hs = handlers(h);
  hs.forEach(t => { const v = /hwPick\('room'/.test(t) ? "living" : /hwPick\('who'/.test(t) ? "cal" : ""; try { c.get(t.replace(/this\.value/g, J(v))); } catch (e) { errs.push([t, e.message]); } });
  ok(label + ": every tap ran (" + hs.length + ")", hs.length > 0 && errs.length === 0, errs);
  ok(label + ": … and wrote nothing (database, browser storage) and changed no data", c.writes.length === 0 && c.lsw.length === 0 && state(c) === s0, [c.writes, c.lsw]);
  return hs;
}

console.log("\n── each page opens the card on its own setting ──");
{ const c = mkW({ meta: PREVIEW });
  roomPage(c, "kitchen"); ok("a room page → that room", J(F(c)) === J({ k: "room", id: "kitchen" }), F(c));
  roomPage(c, ""); ok("🏠 Whole house → Everything", J(F(c)) === J({ k: "all" }), F(c));
  person(c, "ben"); ok("👤 By person → that person", J(F(c)) === J({ k: "who", id: "ben" }), F(c));
  roomPage(c, "kitchen"); c.get("hwPick('who','ada')"); let h = roomPage(c, "kitchen");
  ok("a chip tap changes it for now (kitchen → Ada), and it stays while she is on the room", J(F(c)) === J({ k: "who", id: "ada" }) && /<option value="ada" selected>Ada<\/option>/.test(h), F(c));
  c.get("hwWeek(1)"); roomPage(c, "kitchen"); ok("…a week step stays too", c.get("hwWk") === 1);
  roomPage(c, "living"); ok("another room → back to that room's own setting, this week", J(F(c)) === J({ k: "room", id: "living" }) && c.get("hwWk") === 0, F(c));
  c.get("hwPick('all')"); person(c, "cal"); ok("another page (By person) → that person", J(F(c)) === J({ k: "who", id: "cal" }));
  c.get("hwPick('laundry')"); c.get("hpPick('ada')"); person(c, "ada"); ok("another person → that person", J(F(c)) === J({ k: "who", id: "ada" }));
  roomPage(c, ""); ok("Whole house again → Everything", J(F(c)) === J({ k: "all" }));
  c.get("hwPick('room','attic_gone')"); c.get("hwPick('who','nobody')"); c.get("hwPick('room','')"); ok("an unknown room / person / an empty pick changes nothing", J(F(c)) === J({ k: "all" }));
  h = roomPage(c, ""); ok("the chips: Everything · 🧺 Laundry · 🚪 Room ▾ · 👤 Person ▾ and ‹ week ›", /📅 Schedule/.test(h) && /Everything/.test(h) && /🧺 Laundry/.test(h) && /🚪 Room ▾/.test(h) && /👤 Person ▾/.test(h) && /hwWeek\(-1\)/.test(h) && /hwWeek\(1\)/.test(h));
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], mon = V.isoOf(T - DOW), sun = V.isoOf(T - DOW + 6);
  ok("…the week reads like “Nov 16 – 22”", strip(h).indexOf(mo[+mon.slice(5, 7) - 1] + " " + (+mon.slice(8)) + " – " + (mon.slice(5, 7) === sun.slice(5, 7) ? "" : mo[+sun.slice(5, 7) - 1] + " ") + (+sun.slice(8))) > 0);
  ok("…seven days Mon–Sun, today outlined and called Today", (h.match(/hwDayTap\('/g) || []).length === 7 && box(h, TODAY).indexOf("border:1.5px solid #2B7A78") > 0 && /Today<div/.test(box(h, TODAY)));
  ok("no 🔀 anywhere in the card", h.indexOf("🔀") < 0);
}

console.log("\n── each filter shows only its own rows ──");
{ const c = mkW({ meta: PREVIEW }), all = WD(c, { k: "all" }, 0), kit = WD(c, { k: "room", id: "kitchen" }, 0), ben = WD(c, { k: "who", id: "ben" }, 0), J0 = c.hhJobs();
  ok("a room: only that room's chores, every day", kit.every(d => Object.keys(d.cells || {}).every(id => c.hhRoomOn(J0[id]) === "kitchen")) && kit.some(d => Object.keys(d.cells || {}).length));
  ok("…and no laundry loads", kit.every(d => d.loads.length === 0));
  ok("a person: only what is theirs that day (nothing that would go to Up for Grabs)", ben.every(d => Object.keys(d.cells || {}).every(id => d.cells[id].who === "ben" && !d.cells[id].over)) && ben.some(d => Object.keys(d.cells || {}).length));
  ok("…from every room (kitchen and living room)", ben.some(d => Object.keys(d.cells || {}).some(id => J0[id].room === "living")) && ben.some(d => Object.keys(d.cells || {}).some(id => J0[id].room === "kitchen")));
  ok("Everything: every room's chores, the same squares the room shows, day by day", all.every((d, i) => { const k = kit[i].cells; return !k || Object.keys(k).every(id => J(d.cells[id]) === J(k[id])); }) && all.some(d => Object.keys(d.cells || {}).some(id => J0[id].room === "entry")));
  ok("…and the person's squares are Everything's squares for that person", all.every((d, i) => !d.cells || Object.keys(d.cells).filter(id => d.cells[id].who === "ben" && !d.cells[id].over).sort().join() === Object.keys(ben[i].cells).sort().join()));
  ok("…Everything carries the laundry loads", all.some(d => d.loads.length > 0));
  const h = (c.get("hwPick('room','living')"), c.hwCardHTML());
  ok("drawn: the living room shows its own chores and not the kitchen's", /Shake the rug/.test(h) && !/Mop the floor|Clean the oven/.test(h));
  c.get("hwPick('laundry')"); const lh = c.hwCardHTML(), g = c.llWeekGridHTML(TODAY, c.llNowMin() >= c.get("LL_SWEEP_MIN"), false);
  ok("🧺 Laundry: the body is the laundry code's own week, byte for byte (llWeekGridHTML, read-only form)", g.length > 200 && lh.indexOf(g) > 0);
  ok("…no chore in it, no 🫧 Start / ✓ Done, and the card's own ‹ › are hidden (the laundry week's own ‹ › are there)", !/hcOpen\(|llStart\(|llMarkDone\(|hwWeek\(|hwDayTap\(/.test(lh) && /llWeekNav\(1\)/.test(lh));
  c.get("llWeekNav(1)"); const nh = c.hwCardHTML();
  ok("…its ‹ › work here (llWeek steps, llRerender redraws the Household page)", c.get("llWeek") === 1 && /Next week/.test(nh) && nh.indexOf(c.llWeekGridHTML(TODAY, c.llNowMin() >= c.get("LL_SWEEP_MIN"), false)) > 0);
  c.get("llWeekNav(-1)");
}

console.log("\n── a room's week agrees with the room grid and the 🔴 Now card ──");
for (const [name, o] of [["plan off", {}], ["preview", { meta: PREVIEW }], ["ON, today stored", { meta: ONM, mk: { houseDay: DAY() } }], ["ON, today not stored", { meta: ONM }]]) {
  const c = mkW(o), f = { k: "room", id: "kitchen" };
  let bad = [];
  for (const wk of [-2, -1, 0]) WD(c, f, wk).forEach(d => { if (d.iso < TODAY && J(wd(d.cells)) !== J(cellsGrid(c, "kitchen", d.iso))) bad.push(d.iso); });
  ok(name + ": every past (chore, day) = hhRmCell — same who, same done, same blanks (3 weeks)", bad.length === 0, bad);
  const td = dayOf(c, f, TODAY);
  ok(name + ": today = the 🔴 Now card's rows (rnRows) — same chores, who, done", J(wd(td.cells)) === J(fromNow(c, "kitchen")) && Object.keys(td.cells).length > 0, [wd(td.cells), fromNow(c, "kitchen")]);
  const all = dayOf(c, { k: "all" }, TODAY), want = {}; c.hhRoomList().map(r => r[0]).concat(["__none", ""]).forEach(r => Object.assign(want, fromNow(c, r)));
  ok(name + ": Everything's today = every room's Now rows put together", J(wd(all.cells)) === J(wd(want)));
}
{ const c = mkW({ meta: ONM, mk: { houseDay: DAY() } }), td = dayOf(c, { k: "room", id: "kitchen" }, TODAY).cells;
  ok("ON stored: today's who is the stored plan's (counters given to Ben), done by chore (fridge)", !!(td.k_counter && td.m_fridge && td.k_sink) && td.k_counter.who === "ben" && td.m_fridge.done === true && td.k_sink.late === 2);
  ok("…a planned chore the plan left out today (chairs) is not taken from the lists", !td.k_chairs);
  ok("…what fit nobody shows as would-go-to-Grabs, and not under its person", !!td.k_mop && td.k_mop.over === true && !dayOf(c, { k: "who", id: "ben" }, TODAY).cells.k_mop);
  const h = (roomPage(c, "kitchen"), c.hwCardHTML());
  ok("…the note says today is today's plan", /Today is today’s plan/.test(h));
  const n = mkW({ meta: ONM }); roomPage(n, "kitchen");
  ok("ON not stored: today is the lists (the grid's own today squares), and says so", J(wd(dayOf(n, { k: "room", id: "kitchen" }, TODAY).cells)) === J(cellsGrid(n, "kitchen", TODAY)) && /Today is from the lists as they are now/.test(n.hwCardHTML()));
}

console.log("\n── days ahead: the plan's run (preview / ON), nothing with the plan off ──");
{ const c = mkW({ meta: PREVIEW }), f = { k: "room", id: "kitchen" }, run = c.hpRun(), ids = c.hhRoomChores().kitchen;
  let bad = [];
  for (const wk of [0, 1, 2, 3, 4]) WD(c, f, wk).forEach(d => { const n = dayNum(d.iso) - T; if (n <= 0 || n >= run.length) return; const p = run[n], want = {};
    Object.keys(p.plan).filter(id => ids.includes(id)).forEach(id => { want[id] = { who: p.plan[id].who, done: false }; }); p.over.filter(o => ids.includes(o.id)).forEach(o => { want[o.id] = { who: o.turn, done: false }; });
    if (J(wd(d.cells)) !== J(wd(want))) bad.push(d.iso); });
  ok("preview: every day after today = the run's plan for the room (who, would-go-to-Grabs)", bad.length === 0, bad);
  ok("…the same squares the big grid shows for those days (hpFuture)", (() => { const fu = c.hpFuture(); return WD(c, f, 1).every(d => { const n = dayNum(d.iso) - T; return n <= 0 || n >= fu.length || ids.every(id => J(fu[n][id] ? fu[n][id].who : null) === J(d.cells[id] ? d.cells[id].who : null)); }); })());
  roomPage(c, "kitchen"); c.get("hwWeek(1)"); const h = c.hwCardHTML();
  ok("…dashed, as the grid draws the preview, with its note", /title="Plan preview"/.test(h) && /🔭 plan preview \(dashed\)/.test(h));
  const b = c.get("JSON.stringify(hwBounds())"), B = JSON.parse(b); c.get("hwWeek(100)");
  ok("forward: as far as the week of the plan's last day (29 days)", c.get("hwWk") === B[1] && B[1] === Math.floor((DOW + 28) / 7), b);
  const last = WD(c, f, B[1]), far = last.filter(d => dayNum(d.iso) - T >= 29);
  ok("past the plan's reach: no squares, said plainly (not empty days)", far.every(d => d.cells === null) && (far.length === 0 || (/past the plan/.test(c.hwCardHTML()) && /The plan looks 4 weeks ahead/.test(c.hwCardHTML()))), far.map(d => d.iso));
  c.get("hwWeek(-100)"); ok("back: 8 weeks (the history's 8 weeks)", c.get("hwWk") === -8 && B[0] === -8);
  ok("…8 weeks back still reads the record (hhRmCell)", WD(c, f, -8).every(d => J(wd(d.cells)) === J(cellsGrid(c, "kitchen", d.iso))));
  const o = mkW({ meta: ONM, mk: { houseDay: DAY() } }); roomPage(o, "kitchen"); o.get("hwWeek(1)"); const oh = o.hwCardHTML();
  ok("ON: days ahead are the run too, solid (not the dashed preview)", WD(o, f, 1).some(d => Object.keys(d.cells || {}).length) && !/title="Plan preview"/.test(oh.replace(/title="Nobody who can[^"]*"/g, "")) && /the plan as it would lay them now/.test(oh));
}
{ const c = mkW({}), f = { k: "room", id: "kitchen" }; roomPage(c, "kitchen"); c.get("_hpMemo=null"); const r0 = c.runs, h = c.hwCardHTML(), d = WD(c, { k: "all" }, 0);
  ok("plan off: days after today are not worked out (no squares), said plainly", d.filter(x => x.iso > TODAY).every(x => x.cells === null) && /The plan is off, so days after today are not worked out/.test(h));
  ok("…and the card runs no engine", c.runs === r0, c.runs - r0);
  c.get("hwWeek(1)"); ok("…the week cannot go past this one (nothing ahead to show)", c.get("hwWk") === 0);
  ok("…laundry still shows ahead on Everything (the laundry line's own lay)", d.filter(x => x.iso > TODAY).some(x => x.loads.length));
}
{ const c = mkW({ meta: PREVIEW }); c.get("_hpMemo=null"); roomPage(c, "kitchen");
  ok("preview: drawing the whole room page (grid ahead, Tomorrow, the week card) runs the engine once — no second run", c.runs === 1, c.runs);
  c.hwCardHTML(); c.get("hwPick('all')"); c.hwCardHTML(); roomPage(c, ""); person(c, "ben"); ok("…and not again for the card on Everything, Whole house or By person", c.runs === 1, c.runs);
}

console.log("\n── a day box: laundry first, chores, the dailies folded ──");
{ const c = mkW({ meta: PREVIEW }); roomPage(c, "kitchen");
  const y = dayOf(c, { k: "room", id: "kitchen" }, ago(1)), yd = KD.filter(id => y.cells[id]), yn = yd.filter(id => y.cells[id].done).length;
  c.get("hwWeek(" + wkOf(ago(1)) + ")"); let h = c.hwCardHTML();
  ok("yesterday: “" + yd.length + " daily · " + yn + " ✓” (counted from the grid's squares)", yn > 0 && yn < yd.length && strip(box(h, ago(1))).indexOf(yd.length + " daily · " + yn + " ✓") >= 0, strip(box(h, ago(1))));
  ok("…no daily chore gets its own line in the box", !KD.some(id => box(h, ago(1)).indexOf("hcOpen('" + id + "')") >= 0));
  c.get("hwWk=" + wkOf(ago(2))); h = c.hwCardHTML(); const z = dayOf(c, { k: "room", id: "kitchen" }, ago(2)), zd = KD.filter(id => z.cells[id]);
  ok("all dailies done: “" + zd.length + " daily ✓”", zd.every(id => z.cells[id].done) && strip(box(h, ago(2))).indexOf(zd.length + " daily ✓") >= 0, strip(box(h, ago(2))));
  c.get("hwWk=" + wkOf(ago(3))); h = c.hwCardHTML();
  ok("a weekly chore done on its day: its own line, emoji, name, who in their colour and ✓", /🪣<\/span><span[^>]*>Mop the floor<\/span><span[^>]*color:#aa1111[^>]*>Ad ✓/.test(box(h, ago(3))), box(h, ago(3)).slice(0, 900));
  c.get("hwWk=0"); h = c.hwCardHTML(); const mopDay = V.isoOf(T - DOW + ((DOW + 3) % 7) + ((DOW + 3) % 7 < DOW ? 7 : 0));
  ok("a day ahead: the weekly chore, dashed, and the dailies line with no ✓", mopDay > TODAY && mopDay <= V.isoOf(T - DOW + 6) ? (/Mop the floor/.test(box(h, mopDay)) && /title="(Plan preview|Nobody who can has room[^"]*)"/.test(box(h, mopDay)) && / daily<\/div>/.test(box(h, mopDay))) : true);
  c.get("hwPick('all')"); h = c.hwCardHTML(); const tb = box(h, TODAY);
  ok("Everything: today's box shows the laundry load first, then the chores", tb.indexOf("hwToLaundry()") > 0 && tb.indexOf("hwToLaundry()") < tb.indexOf("hcOpen(") && tb.indexOf("hwToLaundry()") < tb.indexOf(" daily"), strip(tb));
  const ad = dayOf(c, { k: "all" }, TODAY), lp = c.llProject(TODAY, 7 - DOW, c.llNowMin() >= c.get("LL_SWEEP_MIN"))[0];
  ok("…the loads are the laundry line's own lay for today (llProject)", J(ad.loads.map(l => l.name)) === J(lp.loads.map(id => c.llShortFull(id))) && ad.loads.length > 0, [ad.loads, lp.loads]);
  const yl = dayOf(c, { k: "all" }, ago(1));
  ok("…a past day's loads are what really went in (llLog), ✓", J(yl.loads.map(l => [l.name, l.mark])) === J(c.llLog(ago(1)).map(id => [c.llShortFull(id), "done"])) && yl.loads.length === 1);
  ok("…a tap on a load opens 🧺 Laundry", (c.get("hwToLaundry()"), c.get("hhView") === "laundry"));
  roomPage(c, ""); c.get("hwDayTap('" + TODAY + "')"); h = c.hwCardHTML();
  const open = h.slice(h.indexOf("everything on it")), want = Object.keys(ad.cells);
  ok("tap a day: everything on it opens under the week — every chore, dailies too, each opening its card", want.length > 0 && want.every(id => open.indexOf("hcOpen('" + id + "')") > 0), want);
  ok("…the loads too, each to 🧺 Laundry", ad.loads.every(l => open.indexOf(c.esc(l.name)) > 0) &&/onclick="hwToLaundry\(\)"/.test(open));
  ok("…done ones ✅, open ones ☐ (today)", /✅<\/span><span><\/span><span style="flex:1">Wipe the fridge/.test(open) && /☐<\/span>/.test(open));
  c.get("hwDayTap('" + TODAY + "')"); ok("tap again: it closes", !/everything on it/.test(c.hwCardHTML()));
  c.get("hwDayTap('" + V.isoOf(T - DOW + 6 + (DOW === 6 ? 7 : 0)) + "')"); const fo = c.hwCardHTML();
  ok("a day ahead opened: no ☐ / ✅ boxes (nothing to tick)", DOW === 6 || (/everything on it/.test(fo) && !/[☐✅]<\/span>/.test(fo.slice(fo.indexOf("everything on it")))));
  const n = mkW({ meta: PREVIEW, mk: { noMom: true } }); roomPage(n, "kitchen"); const nh = n.hwCardHTML();
  ok("not Mom: the same week, no chore taps", /📅 Schedule/.test(nh) && !/hcOpen\(/.test(nh));
}

console.log("\n── the room's big grid: folded shut under the week, opens ──");
{ const c = mkW({ meta: PREVIEW }); let h = roomPage(c, "kitchen"); const ids = c.hhRoomChores().kitchen, grid = c.hhRoomGridHTML("kitchen", ids);
  ok("folded by default: one plain line, the grid shut (hidden, the very same grid)", /▸ The big grid/.test(h) && h.indexOf('<div style="display:none">' + grid + "</div>") > 0 && h.split("<table").length === 2);
  ok("…under the week card", h.indexOf("📅 Schedule") < h.indexOf("▸ The big grid") && h.indexOf("🔴 Now") < h.indexOf("📅 Schedule"));
  c.get("hwGridToggle('kitchen')"); h = roomPage(c, "kitchen");
  ok("tap: the grid opens, exactly as it was, under the line", /▾ The big grid/.test(h) && h.indexOf("<div>" + grid + "</div>") > h.indexOf("▾ The big grid") && h.indexOf("display:none") < 0);
  roomPage(c, "living"); ok("…another room has its own fold (still shut)", /▸ The big grid/.test(roomPage(c, "living")));
  ok("…back on the kitchen it is still open (kept in memory)", /▾ The big grid/.test(roomPage(c, "kitchen")));
  c.get("hwGridToggle('kitchen')"); ok("tap again: folded", /▸ The big grid/.test(roomPage(c, "kitchen")));
  c.get("hhEditId='k_mop'"); ok("a chore of this room open in ✎ Edit keeps the grid open (its editor lives there)", /▾ The big grid/.test(roomPage(c, "kitchen")) && roomPage(c, "kitchen").indexOf("display:none") < 0);
}

console.log("\n── nothing else on the three pages changes ──");
for (const [name, o] of [["preview", { meta: PREVIEW }], ["plan off", {}], ["ON", { meta: ONM, mk: { houseDay: DAY() } }]]) {
  const c = mkW(o), noHW = fn => { const a = c.hwCardHTML, b = c.hwRoomHTML; c.hwCardHTML = undefined; c.hwRoomHTML = undefined; try { return fn(); } finally { c.hwCardHTML = a; c.hwRoomHTML = b; } };
  const ids = c.hhRoomChores().kitchen, before = noHW(() => roomPage(c, "kitchen")), after = roomPage(c, "kitchen"), grid = c.hhRoomGridHTML("kitchen", ids);
  ok(name + ": the room page = before, with the grid swapped for the week card + the fold line", before.split(grid).length === 2 && after === before.replace(grid, () => c.hwRoomHTML("kitchen", ids)) && c.hwRoomHTML("kitchen", ids).indexOf(c.hwCardHTML()) === 0);
  c.get("hwGridToggle('kitchen')"); const opened = roomPage(c, "kitchen"); c.get("hwGridToggle('kitchen')");
  ok(name + ": …opened, the page = before + the card and the line above the very same grid", opened.replace(c.hwCardHTML(), "").replace(/<div onclick="hwGridToggle\('kitchen'\)"[^>]*>▾ The big grid <span[^>]*>[^<]*<\/span><\/div><div>/, "").replace(grid + "</div>", grid) === before);
  const bh = noHW(() => roomPage(c, "")).replace(c.hoCardHTML(), ""), ah = roomPage(c, "").replace(c.hoCardHTML(), ""), hh = c.hhRmHouseHTML(c.hhRoomChores());
  ok(name + ": Whole house = before, with the card above what it shows now", ah === bh.replace(hh, () => c.hwCardHTML() + hh));
  const bp = noHW(() => person(c, "ben")).replace(c.hoCardHTML(), ""), ap = person(c, "ben").replace(c.hoCardHTML(), ""), st = c.hpSettingsHTML("ben");
  ok(name + ": By person = before (Today · This week · Settings · Habits), with the card just above ⚙ Settings", ap === bp.replace(st, () => c.hwCardHTML() + st) && /📅 Today/.test(ap) && /📈 Habits/.test(ap));
  ok(name + ": drawing all three wrote nothing", c.writes.length === 0 && c.lsw.length === 0);
}

console.log("\n── zero writes: every draw and every tap ──");
for (const [name, o] of [["preview", { meta: PREVIEW }], ["plan off", {}], ["ON, today stored", { meta: ONM, mk: { houseDay: DAY() } }]]) {
  const c = mkW(o), s0 = state(c);
  roomPage(c, "kitchen"); roomPage(c, "living"); roomPage(c, ""); person(c, "ben"); person(c, "mom");
  ok(name + ": drawing a room, Whole house and By person wrote nothing", c.writes.length === 0 && c.lsw.length === 0 && state(c) === s0, c.writes);
  roomPage(c, "kitchen"); c.get("hwDayTap('" + TODAY + "')");
  tapAll(c, c.hwRoomHTML("kitchen", c.hhRoomChores().kitchen), name + ", a room (the week, the fold and the grid's own taps)");
  roomPage(c, "kitchen"); c.get("hwDayTap('" + TODAY + "')"); const t1 = handlers(c.hwRoomHTML("kitchen", c.hhRoomChores().kitchen).replace(c.hhRoomGridHTML("kitchen", c.hhRoomChores().kitchen), ""));
  ok(name + ": …the card's taps are chips, weeks, days, chore cards, Laundry, the fold — no check-off, no stage", t1.every(t => /^(hwPick|hwWeek|hwDayTap|hwGridToggle|hwToLaundry\(\)|event\.stopPropagation\(\);(hcOpen|hwToLaundry)|hcOpen)/.test(t)), t1.filter(t => !/^(hwPick|hwWeek|hwDayTap|hwGridToggle|hwToLaundry|event|hcOpen)/.test(t)));
  roomPage(c, ""); c.get("hwPick('all');hwDayTap('" + TODAY + "')"); tapAll(c, c.hwCardHTML(), name + ", Everything (day open)");
  roomPage(c, ""); c.get("hwPick('laundry')"); tapAll(c, c.hwCardHTML(), name + ", 🧺 Laundry setting");
  person(c, "ada"); c.get("hwDayTap('" + TODAY + "')"); tapAll(c, c.hwCardHTML(), name + ", By person");
}

console.log("\n── draw time (Everything, plan on preview) ──");
{ const c = mkW({ meta: PREVIEW }); roomPage(c, ""); c.get("_hpMemo=null"); let t0 = Date.now(); c.hwCardHTML(); const cold = Date.now() - t0;
  t0 = Date.now(); for (let i = 0; i < 20; i++) c.hwCardHTML(); const warm = (Date.now() - t0) / 20;
  console.log("  (card, Everything, preview: first draw " + cold + " ms incl. the engine's run; then " + warm.toFixed(1) + " ms a draw)");
  ok("the card draws in well under a second on the made-up family", cold < 1000 && warm < 250, [cold, warm]);
}

console.log("\n── the whole app, plan on preview ──");
(async () => {
  const hh = W.household("preview"); const R = { c_a_dishes: "kitchen", c_b_mop: "kitchen", m_fridge: "kitchen", an_a_fish: "kitchen", c_a_vac: "living", c_b_bath: "bathdown", d_trash: "entry" };
  Object.keys(hh.jobs).forEach(id => { hh.jobs[id].room = R[id] || "school"; });
  const w = await W.world({ household: hh }); const A = w.boot("A", "devA", { mom: true }); await w.flush(); await w.at(2026, 11, 17, 16, 30);
  A.run(V.HJS); const m = w.mark(), S0 = A.run("JSON.stringify([householdData,typeof laundryLine!=='undefined'?laundryLine:null])");
  const kit = A.run("tab='moms-plan'; mpSubView='house'; hhView='rooms'; hhRmSel='kitchen'; hhRoomsPageHTML()"), house = A.run("hhRmSel=''; hhRoomsPageHTML()"), per = A.run("hhView='person'; hpSel='kid_a'; hpPersonHTML()");
  ok("the room page has the week card and the folded grid", /📅 Schedule/.test(kit) && /▸ The big grid/.test(kit) && /<div style="display:none"><div style="background:#fff;border-radius:12px[^"]*overflow:auto"><table/.test(kit));
  ok("Whole house and By person have the card, set to their own", /📅 Schedule/.test(house) && /📅 Schedule/.test(per) && A.run("JSON.stringify(hwF)") === J({ k: "who", id: "kid_a" }));
  const td = JSON.parse(A.run("JSON.stringify(hwWeekData({k:'room',id:'kitchen'},0).find(function(d){ return d.iso==='2026-11-17'; }).cells)")), rn = JSON.parse(A.run("JSON.stringify(rnRows('kitchen'))"));
  ok("today on the kitchen = its 🔴 Now rows", J(Object.keys(td).sort()) === J(rn.rows.map(x => x.id).sort()) && rn.rows.every(x => td[x.id].who === x.who && td[x.id].done === !!x.done), [td, rn.rows]);
  A.run("rlHistReady=function(){ return true; }");   // the sandbox never fetches the long chore history; the page waits for it
  A.run("hhView='rooms'; hhRmSel=''; hwPick('laundry')"); A.run("hhRender()"); const el0 = A.run("document.getElementById('content').innerHTML");
  if (!/This week/.test(el0)) console.log(J([el0.length, A.run("mpSubView+'|'+tab+'|'+hhView+'|'+momGateOpen()+'|'+(typeof MP_GROUP_VIEWS!=='undefined'&&!!MP_GROUP_VIEWS.house)"), el0.slice(0, 300)]));
  ok("🧺 Laundry setting on the Household page: the laundry week is there", /📅 Schedule/.test(el0) && /This week/.test(el0) && A.run("String(llWeek)") === "0");
  A.run("llWeekNav(1)"); const el1 = A.run("document.getElementById('content').innerHTML");
  ok("…its › steps the laundry week and llRerender redraws the Household page (Next week)", A.run("String(llWeek)") === "1" && /Next week/.test(el1) && /📅 Schedule/.test(el1));
  A.run("llWeekNav(-1); hwPick('all'); hwDayTap('2026-11-17'); hwWeek(1); hwWeek(-1); hwPick('room','living'); hwPick('who','kid_b'); hwGridToggle('kitchen'); hhRender()"); await w.flush();
  ok("drawing and tapping wrote nothing to the database", w.since(m).filter(l => l.op !== "get" && l.op !== "on" && l.op !== "once" && l.op !== "off").length === 0, w.since(m).slice(0, 4));
  ok("…and changed nothing on the device (the table, the laundry line)", A.run("JSON.stringify([householdData,typeof laundryLine!=='undefined'?laundryLine:null])") === S0);
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL- threw " + (e && e.stack || e)); process.exit(1); });
