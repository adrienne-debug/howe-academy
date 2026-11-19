/*
 * test_house_week_laundry.js — 📅 slice C: the filter chips on the Laundry page's own schedule (HOUSEWEEK_LAUNDRY in house.js + one
 * guarded line in index.html's hhLaundryHTML; DESIGN_now_todo_schedule_2026-11-17 §3, §5 row C; her "Yes, start C" 2026-11-17).
 * Her rule: the Laundry page loses and changes nothing. Made-up family (Ada, Ben, Cal, Mom, Dad; the whole app: kid_a … kid_d).
 *   · index.html changes by ONE line, and without house.js the Laundry page and the laundry schedule are byte-for-byte main's;
 *   · with house.js, on 🧺 Laundry (where the page opens), the card is today's card + the chips row and nothing else: the week inside
 *     is byte-for-byte llWeekGridHTML(…, mom) for Mom and for not-Mom, and the whole page = main's page + the chips row;
 *   · every other place the laundry schedule or cards are drawn (My day for Mom and Dad, Dad's card, the line card, Home Base's
 *     machines card) is unchanged with house.js loaded;
 *   · the page opens on Laundry and goes back to it after another page; Everything / a room / a person show slice B's week;
 *   · a laundry button (🫧 Start, ✓ Done, its ‹ ›) does exactly what it does on main and leaves the card on Laundry;
 *   · ZERO writes from every chip, arrow and day tap; the dry run stays inert.
 *   run: node test_house_week_laundry.js
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), vm = require("vm");
const V = require(path.join(__dirname, "test_fixtures", "house_vm.js")), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const { K, TODAY, ago, DOW, roomPage, handlers } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = x => JSON.stringify(x), count = (s, k) => s.split(k).length - 1;
// main's index.html = this one with the hook line put back as it was (the test proves that is the only change).
const OLD = 'try{ if(typeof llWeekCardHTML==="function"&&typeof laundryLine!=="undefined") h+=llWeekCardHTML(); }catch(e){}   // 📅 the schedule\n';
const NEW = 'try{ if(typeof llWeekCardHTML==="function"&&typeof laundryLine!=="undefined"){ if(typeof hwLaundryCardHTML==="function") h+=hwLaundryCardHTML(); else h+=llWeekCardHTML(); } }catch(e){}   // 📅 the schedule · its filter chips: HOUSEWEEK_LAUNDRY (house.js)\n';
const RAW = V.RAW, MAIN = RAW.split(NEW).join(OLD), HJS = V.HJS;
const LAU = s => s.slice(s.indexOf("// HH_LAUNDRY_START"), s.indexOf("// HH_LAUNDRY_END"));   // the Laundry page + the laundry line
const JOBS = () => ({
  k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10 }),
  k_mop: K({ label: "Mop the floor", emoji: "🪣", who: "ben", slot: "chores", cad: "wk:" + ((DOW + 1) % 7), room: "kitchen", minutes: 15 }),
  l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "daily", room: "living", minutes: 5 }),
  l_rug: K({ label: "Shake the rug", who: "cal", slot: "chores", cad: "wk:" + DOW, room: "living", minutes: 5 })
});
const PREVIEW = { takeover: 1, engine: { mode: "preview", on: TODAY } };
// The Household page in a vm + the Laundry page's own code, sliced from `src`; the other cards of the page are stand-ins (the same in
// every world, so a difference can only come from the schedule card). Every write recorded.
function mkL(o) {
  o = o || {}; const src = o.src || RAW;
  const c = V.mk({ src, jobs: JOBS(), house: o.house, dry: o.dry, noMom: o.noMom, hd: { meta: o.meta || { takeover: 1 } } });
  vm.runInContext("var calNormDate=function(s){ return s; }, _lbWrite=function(){ return typeof db!=='undefined'&&db&&!(typeof _dryRun===\"function\"&&_dryRun()); }, kitPinGate=function(){}, event={stopPropagation:function(){}};\n"
    + "function mdCardLaundry(){ return '<div>MACHINES-NOW</div>'; } function luLgHTML(){ return '<div>LEDGER</div>'; } function qlCardHTML(){ return '<div>QUICK</div>'; }\n" + LAU(src), c);
  if (o.late) c.llNowMin = () => 20 * 60 + 30;   // after 8 PM: today's unstarted loads show → tomorrow, with ✓ Done / 🫧 Start
  c.laundryLineOnValue({ log: { [ago(1)]: { ben: { at: 1, done: true } } } });
  c.lsw = []; const s0 = c.HA_LS.setItem; c.HA_LS.setItem = (k, v) => { c.lsw.push(k); s0(k, v); };
  c.get('hhView="laundry"'); c.writes.length = 0; return c;
}
const F = c => c.get("JSON.stringify(hwF)");
const state = c => c.get("JSON.stringify([householdData,houseDayData,laundryLine,routineLog,momdayData,daddayData,laundryData])");
const lauPage = c => { c.get('hhView="laundry"'); return c.hhLaundryHTML(); };
const grid = c => c.llWeekGridHTML(c.llToday(), c.llNowMin() >= c.get("LL_SWEEP_MIN"), c.momHere());
const chipsRow = c => '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">' + c.hwChips(JSON.parse(F(c))) + '</div>';
const LLBTN = /^(llStart|llMarkDone|llUndone)\(/;

console.log("\n── index.html: one line, and the source of everything else ──");
{ ok("the hook line is in index.html exactly once, and is the only place hwLaundryCardHTML is named there", count(RAW, NEW) === 1 && count(RAW, "hwLaundryCardHTML") === 2 && count(MAIN, "hwLaundryCardHTML") === 0);
  ok("the hook adds " + (Buffer.byteLength(NEW) - Buffer.byteLength(OLD)) + " bytes to index.html (under 600)", Buffer.byteLength(RAW) - Buffer.byteLength(MAIN) === Buffer.byteLength(NEW) - Buffer.byteLength(OLD) && Buffer.byteLength(NEW) - Buffer.byteLength(OLD) < 600);
  ok("the hook keeps today's text: h+=llWeekCardHTML() is still the fallback in hhLaundryHTML", /h\+=llWeekCardHTML\(\)/.test(NEW) && LAU(RAW).indexOf(NEW) > LAU(RAW).indexOf("function hhLaundryHTML("));
  const B = HJS.slice(HJS.indexOf("// HOUSEWEEK_LAUNDRY_START"), HJS.indexOf("// HOUSEWEEK_LAUNDRY_END"));
  ok("house.js has the HOUSEWEEK_LAUNDRY block, right after HOUSEWEEK", B.length > 200 && HJS.indexOf("// HOUSEWEEK_END") < HJS.indexOf("// HOUSEWEEK_LAUNDRY_START"));
  ok("…it writes nothing (no db, no browser storage) and names no 🔀", !/\bdb\b|HA_LS|localStorage|\.set\(|\.update\(|\.remove\(/.test(B) && !/🔀/.test(B));
  ok("house.js defines and replaces no laundry function (no 'function ll…', no 'll…=' assignment)", !/function ll[A-Z]\w*\s*\(/.test(HJS) && !/(^|[^.\w])ll[A-Z]\w*\s*=[^=]/m.test(HJS) && !/\bllWeek\s*=[^=]/.test(HJS));
}

console.log("\n── without house.js: today's page, byte for byte ──");
for (const [name, o] of [["Mom", {}], ["not Mom", { noMom: true }], ["Mom, after 8 PM", { late: true }], ["Mom, dry run", { dry: true }]]) {
  const a = mkL(Object.assign({ house: false }, o)), m = mkL(Object.assign({ house: false, src: MAIN }, o));
  ok(name + ": house.js not loaded (no hwLaundryCardHTML)", a.get("typeof hwLaundryCardHTML") === "undefined" && a.get("typeof hwCardHTML") === "undefined");
  ok(name + ": llWeekCardHTML() = main's", a.llWeekCardHTML() === m.llWeekCardHTML() && /📅 The laundry schedule/.test(a.llWeekCardHTML()));
  ok(name + ": hhLaundryHTML() = main's", lauPage(a) === lauPage(m) && /MACHINES-NOW/.test(lauPage(a)) && /QUICK/.test(lauPage(a)));
  a.get("llWeekNav(1)"); m.get("llWeekNav(1)"); ok(name + ": …next week too", lauPage(a) === lauPage(m) && /Next week/.test(lauPage(a)));
}

console.log("\n── with house.js, on 🧺 Laundry: today's card + the chips row ──");
for (const [name, o] of [["Mom", {}], ["not Mom", { noMom: true }], ["Mom, after 8 PM", { late: true }], ["Mom, plan on preview", { meta: PREVIEW }]]) {
  const c = mkL(o), m = mkL(Object.assign({ src: MAIN }, o)), mom = !o.noMom;
  const page = lauPage(c), mainPage = lauPage(m), row = chipsRow(c), card = c.hwLaundryCardHTML(), g = grid(c);
  ok(name + ": the page opens on 🧺 Laundry", F(c) === J({ k: "laundry" }));
  ok(name + ": the card = llWeekCardHTML() with only the chips row put in under the title", card.replace(row, "") === c.llWeekCardHTML() && count(card, row) === 1 && card.indexOf(row) === card.indexOf("📅 The laundry schedule</span></div>") + "📅 The laundry schedule</span></div>".length);
  ok(name + ": the week inside the card is byte-for-byte llWeekGridHTML(llToday(), after 8 PM, " + mom + ")", count(card, g) === 1 && card.endsWith(row + g + "</div>") && g.length > 500);
  ok(name + ": hhLaundryHTML() = main's page with the chips row added and nothing else", count(page, row) === 1 && page.replace(row, "") === mainPage);
  ok(name + ": the chips are Everything · 🧺 Laundry (filled) · 🚪 Room ▾ · 👤 Person ▾", /hwPick\('all'\)[^>]*#cbd5e1/.test(row) && /onclick="hwPick\('laundry'\)" style="[^"]*background:#2B7A78/.test(row) && /🚪 Room ▾/.test(row) && /👤 Person ▾/.test(row) && /<option value="kitchen">/.test(row) && /<option value="ben">Ben<\/option>/.test(row));
  const hs = handlers(card), ll = hs.filter(t => LLBTN.test(t));
  ok(name + ": Mom's laundry buttons are exactly main's (" + ll.length + ": " + ll.join(" ") + ")", J(ll) === J(handlers(m.llWeekCardHTML()).filter(t => LLBTN.test(t))) && (mom ? ll.length > 0 : ll.length === 0));
  ok(name + ": its own ‹ › are the laundry week's (llWeekNav), the card shows no second set", hs.filter(t => /Week/.test(t)).every(t => /^llWeekNav\(/.test(t)) && !/hwWeek\(/.test(card));
  c.get("llWeekNav(1)"); m.get("llWeekNav(1)");
  ok(name + ": next week (its ›) = main's page + the chips row", lauPage(c).replace(chipsRow(c), "") === lauPage(m) && /Next week/.test(lauPage(c)) && F(c) === J({ k: "laundry" }));
  ok(name + ": drawing wrote nothing", c.writes.length === 0 && c.lsw.length === 0);
}

console.log("\n── every other laundry screen is unchanged with house.js loaded ──");
for (const [name, o] of [["Mom", {}], ["not Mom", { noMom: true }], ["after 8 PM", { late: true }]]) {
  const c = mkL(o), m = mkL(Object.assign({ src: MAIN, house: false }, o)); lauPage(c); c.get("hwPick('all')"); lauPage(c);
  const calls = ["llWeekCardHTML()", "llCardHTML()", "llCardHTML(true)", "llDadCardHTML('dad')", "llDadCardHTML('mom',true)", "llDadCardHTML('dad',true)",
    "llMyDayLaundryHTML('mom')", "llMyDayLaundryHTML('dad')", "llWeekGridHTML(llToday(),false,true,'dad')", "llWeekGridHTML(llToday(),false,false)"];
  const diff = calls.filter(k => c.get(k) !== m.get(k));
  ok(name + ": " + calls.join(" · ") + " = main's (house.js loaded, the Laundry page set on Everything)", diff.length === 0 && /📅 The laundry schedule/.test(c.get("llWeekCardHTML()")), diff);
}

console.log("\n── opens on Laundry, and goes back to it ──");
{ const c = mkL({ meta: PREVIEW });
  lauPage(c); ok("🧺 Laundry opens on Laundry", F(c) === J({ k: "laundry" }));
  c.get("hwPick('all')"); let h = lauPage(c); ok("a chip tap changes it for now (Everything), and it stays while she is on the page", F(c) === J({ k: "all" }) && /📅 Schedule/.test(h) && !/📅 The laundry schedule/.test(h));
  c.get("hwWeek(1)"); lauPage(c); ok("…a week step stays too", c.get("hwWk") === 1);
  roomPage(c, "kitchen"); ok("a room → that room", F(c) === J({ k: "room", id: "kitchen" }));
  h = lauPage(c); ok("back to 🧺 Laundry → Laundry, this week, today's card", F(c) === J({ k: "laundry" }) && c.get("hwWk") === 0 && /📅 The laundry schedule/.test(h));
  c.get("hwPick('who','cal')"); lauPage(c); c.get('hhView="person"; hpSel="ben"'); c.hpPersonHTML(); ok("By person → that person", F(c) === J({ k: "who", id: "ben" }));
  lauPage(c); ok("back to 🧺 Laundry → Laundry", F(c) === J({ k: "laundry" }));
  roomPage(c, ""); ok("🏠 Whole house → Everything (slice B unchanged)", F(c) === J({ k: "all" }));
  c.get("hwPick('room','living')"); lauPage(c); ok("Whole house set on a room, then Laundry → Laundry", F(c) === J({ k: "laundry" }));
  c.get("hwPick('all')"); lauPage(c); c.get("hwToLaundry()"); lauPage(c); ok("on Everything, a tap on a load (hwToLaundry) puts the card back on 🧺 Laundry, on this page", F(c) === J({ k: "laundry" }) && c.get("hhView") === "laundry");
  c.get("hwPick('room','attic_gone')"); c.get("hwPick('who','nobody')"); c.get("hwPick('room','')"); ok("an unknown room / person / an empty pick changes nothing", F(c) === J({ k: "laundry" }));
}

console.log("\n── Everything, a room, a person: slice B's week, in the same spot ──");
for (const [name, o] of [["preview", { meta: PREVIEW }], ["plan off", {}]]) {
  const c = mkL(o), m = mkL(Object.assign({ src: MAIN }, o)), mainPage = lauPage(m), mainCard = m.llWeekCardHTML();
  for (const [pick, f, other] of [["hwPick('all')", { k: "all" }, () => roomPage(c, "")], ["hwPick('room','kitchen')", { k: "room", id: "kitchen" }, () => roomPage(c, "kitchen")], ["hwPick('who','ben')", { k: "who", id: "ben" }, () => { c.get('hhView="person"; hpSel="ben"'); c.hpPersonHTML(); }]]) {
    lauPage(c); c.get(pick); const page = lauPage(c), card = c.hwCardHTML();
    ok(name + ", " + J(f) + ": the page = main's with the laundry card swapped for slice B's card (hwCardHTML)", F(c) === J(f) && page === mainPage.replace(mainCard, () => card) && /📅 Schedule/.test(card));
    other(); const there = c.hwCardHTML(); c.get(pick.replace("hwPick", "hwPick")); const own = c.hwCardHTML();
    ok(name + ", " + J(f) + ": …the very card that filter draws on slice B's own pages", own === card, [own.length, card.length]);
    ok(name + ", " + J(f) + ": …no 🫧 Start / ✓ Done / ↩︎ / laundry ‹ › on it; its own ‹ › are slice B's", !handlers(card).some(t => LLBTN.test(t) || /llWeekNav/.test(t)) && /hwWeek\(1\)/.test(card));
    void there;
  }
  // Everything: laundry loads first; a day opens; its arrows and the laundry arrows are each their own
  lauPage(c); c.get("hwPick('all')"); let card = c.hwLaundryCardHTML(), bx = card.slice(card.indexOf("hwDayTap('" + TODAY + "')"));
  ok(name + ": Everything has today's laundry load first in today's box", /hwToLaundry\(\)/.test(card) && bx.indexOf("hwToLaundry()") < (bx.indexOf("hcOpen(") < 0 ? 1e9 : bx.indexOf("hcOpen(")));
  c.get("hwDayTap('" + TODAY + "')"); ok(name + ": a day tap opens everything on it", /everything on it/.test(lauPage(c)));
  const lw = c.get("llWeek"); c.get("hwWeek(-1)"); ok(name + ": slice B's ‹ goes back a week; the laundry week does not move", c.get("hwWk") === -1 && c.get("llWeek") === lw && /hwWeek/.test(lauPage(c)));
  c.get("hwPick('laundry')"); c.get("llWeekNav(1)"); ok(name + ": back on 🧺 Laundry its › steps only the laundry week (0–8)", c.get("llWeek") === 1 && /Next week/.test(lauPage(c)));
}

console.log("\n── laundry buttons: exactly what they do on main, and the card stays on Laundry ──");
for (const [name, o] of [["before 8 PM", {}], ["after 8 PM", { late: true }]]) {
  const taps = handlers(mkL(o).hwLaundryCardHTML()).filter(t => LLBTN.test(t) || /llWeekNav/.test(t));
  ok(name + ": the card has laundry buttons to try (" + taps.join(" ") + ")", taps.some(t => LLBTN.test(t)));
  for (const t of taps) {
    const c = mkL(o), m = mkL(Object.assign({ src: MAIN }, o)); lauPage(c); lauPage(m);
    let e1 = "", e2 = ""; try { c.get(t); } catch (e) { e1 = e.message; } try { m.get(t); } catch (e) { e2 = e.message; }
    ok(name + ": " + t + " → the same writes and the same laundry line as main (" + c.writes.length + " writes)", e1 === e2 && J(c.writes) === J(m.writes) && state(c) === state(m) && J(c.lsw) === J(m.lsw), [e1, e2, c.writes, m.writes]);
    ok(name + ": " + t + " → the card is still on 🧺 Laundry and the page = main's + the chips", F(c) === J({ k: "laundry" }) && lauPage(c).replace(chipsRow(c), "") === lauPage(m));
    const un = handlers(c.hwLaundryCardHTML()).filter(x => /^llUndone\(/.test(x));
    if (/^llMarkDone/.test(t)) { ok(name + ": after ✓ Done the card offers ↩︎ as main does", un.length === 1 && J(un) === J(handlers(m.llWeekCardHTML()).filter(x => /^llUndone\(/.test(x))));
      c.writes.length = 0; m.writes.length = 0; c.get(un[0]); m.get(un[0]);
      ok(name + ": " + un[0] + " → the same writes and laundry line as main, still on Laundry", J(c.writes) === J(m.writes) && c.writes.length > 0 && state(c) === state(m) && F(c) === J({ k: "laundry" }) && lauPage(c).replace(chipsRow(c), "") === lauPage(m), [c.writes, m.writes]); }
  }
}

console.log("\n── zero writes: every chip, arrow and day tap ──");
for (const [name, o] of [["preview", { meta: PREVIEW }], ["plan off", {}], ["dry run", { dry: true, meta: PREVIEW }]]) {
  const c = mkL(o), s0 = state(c);
  for (const [lbl, set] of [["🧺 Laundry", ""], ["Everything, day open", "hwPick('all');hwDayTap('" + TODAY + "')"], ["a room", "hwPick('room','living')"], ["a person", "hwPick('who','cal')"]]) {
    lauPage(c); if (set) c.get(set); const card = c.hwLaundryCardHTML(), hs = handlers(card).filter(t => !LLBTN.test(t)), errs = [];
    hs.forEach(t => { const v = /hwPick\('room'/.test(t) ? "kitchen" : /hwPick\('who'/.test(t) ? "ada" : ""; try { c.get(t.replace(/this\.value/g, J(v))); lauPage(c); } catch (e) { errs.push([t, e.message]); } if (set) { c.get('hhView="laundry"'); c.get(set); } });
    ok(name + ", " + lbl + ": every chip / arrow / day / chore / load tap ran (" + hs.length + ")", hs.length > 0 && errs.length === 0, errs);
    ok(name + ", " + lbl + ": …and wrote nothing (database, browser storage) and changed no data", c.writes.length === 0 && c.lsw.length === 0 && state(c) === s0, [c.writes, c.lsw]);
  }
}
{ const c = mkL({ dry: true }), m = mkL({ dry: true, src: MAIN }); lauPage(c); lauPage(m);
  handlers(c.hwLaundryCardHTML()).filter(t => LLBTN.test(t)).forEach(t => { try { c.get(t); } catch (e) {} try { m.get(t); } catch (e) {} });
  ok("dry run: the laundry buttons write nothing, as on main", c.writes.length === 0 && m.writes.length === 0 && J(c.lsw) === J(m.lsw));
}

console.log("\n── the whole app: main's index.html and this one, before and after house.js ──");
(async () => {
  const mainFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "hwl-")), "index.html"); fs.writeFileSync(mainFile, MAIN);
  const OTHER = "JSON.stringify([mdCardLaundry(true,false,true),mdCardLaundry(),llMyDayLaundryHTML('mom'),llMyDayLaundryHTML('dad'),llDadCardHTML('dad'),llCardHTML(),llWeekCardHTML()])";
  const run = async (index) => {
    const w = await W.world({ mode: "preview", index }); const A = w.boot("A", "devA", { mom: true }); await w.flush(); await w.at(2026, 11, 17, 9, 30);
    A.run("rlHistReady=function(){ return true; }; tab='moms-plan'; mpSubView='house'; hhView='laundry'");
    const r = { noHouse: A.run("typeof hwCardHTML"), page0: A.run("hhLaundryHTML()"), other0: A.run(OTHER) };
    A.run(V.HJS); const m = w.mark(), S0 = A.run("JSON.stringify([householdData,laundryLine,laundryData])");
    r.page1 = A.run("hhLaundryHTML()"); r.other1 = A.run(OTHER); r.F = A.run("typeof hwF!=='undefined'&&hwF?JSON.stringify(hwF):''");
    r.row = A.run("typeof hwChips==='function'&&hwF?'<div style=\"display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px\">'+hwChips(hwF)+'</div>':''");
    A.run("hhRender()"); r.el0 = A.run("document.getElementById('content').innerHTML");
    A.run("hwPick('all'); hwDayTap('2026-11-17'); hwWeek(1); hwWeek(-1); hwPick('room','kitchen'); hwPick('who','kid_b'); hwPick('laundry'); llWeekNav(1); llWeekNav(-1); hwPick('all')"); await w.flush();
    r.el1 = A.run("document.getElementById('content').innerHTML"); A.run("hwToLaundry()"); r.F2 = A.run("JSON.stringify(hwF)");
    r.writes = w.since(m).filter(l => l.op !== "get" && l.op !== "on" && l.op !== "once" && l.op !== "off"); r.same = A.run("JSON.stringify([householdData,laundryLine,laundryData])") === S0;
    return r; };
  const b = await run(undefined), m = await run(mainFile);
  ok("whole app: before house.js lands, the Laundry page is main's, byte for byte", b.noHouse === "undefined" && b.page0 === m.page0 && /📅 The laundry schedule/.test(b.page0));
  ok("whole app: …and every other laundry screen (Home Base's machines, My day for Mom and Dad, Dad's card, the line, the schedule) is main's", b.other0 === m.other0);
  ok("whole app: with house.js, the Laundry page opens on Laundry = main's page + the chips row", b.F === J({ k: "laundry" }) && b.row && count(b.page1, b.row) === 1 && b.page1.replace(b.row, "") === m.page1);
  ok("whole app: …every other laundry screen still main's with house.js loaded", b.other1 === m.other1);
  ok("whole app: the Household page draws the card (hhRender) with the chips; Everything redraws it as slice B's card", /hwPick\('all'\)/.test(b.el0) && /📅 The laundry schedule/.test(b.el0) && /📅 Schedule/.test(b.el1) && !/📅 The laundry schedule/.test(b.el1));
  ok("whole app: a load tap on Everything puts it back on Laundry", b.F2 === J({ k: "laundry" }));
  ok("whole app: drawing and every chip / arrow / day tap wrote nothing to the database and changed nothing on the device", b.writes.length === 0 && b.same, b.writes.slice(0, 4));
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL- threw " + (e && e.stack || e)); process.exit(1); });
