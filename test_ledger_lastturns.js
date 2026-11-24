/*
 * test_ledger_lastturns.js — 📒 Last turns on the chore card, a jump to the 📒 Ledger on that chore: slice L7 of
 * DESIGN_chore_ledger_2026-11-21 (§5 "Quick jumps, never second copies": "the card's '📒 Last turns: ✅ ✅ ✅ ✖ ›' → the ledger on that
 * chore"; §8 "Each links to the other"; §9 row L7; the hub's brief 2026-11-24). house.js LASTTURNS + one hook line on the card (HH_CARD ▸
 * History) + one line at the top of lgHTML. Writes nothing; adds no button.
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), the clock moved day by day from
 * Mon 11/16 (day 0) to Mon 11/30 (day 14) — the replay of test_chore_ledger.js (L1), so every row is known:
 *   kid_a  🌅 Brush teeth (daily) · Feed the rabbit (Mon Wed Fri) · 🧹 Make the bed (daily 2, not made Wed 11/25 and Thu) · Wipe the
 *          table (daily 2, not done Thu) · Vacuum the den (Tue 10; 11/17 ticked Thu in full, 11/24 ticked Thu 6 of 10) · Dust the shelves
 *          (Wed 10; 11/25 ⏳ Thu Fri, gone Sat) · Wipe the baseboards (Mon 10; 11/23 gone Thu) · Empty the trash (Mon Wed Fri 5, 3+ a week:
 *          11/23 ticked Tue, 11/27 ⏳ Sat Sun, gone Mon) · Feed the fish (Thu 3; 11/26 ✕ today) · Rake the leaves (Thu 8; 11/26 🌅 sent,
 *          ticked Fri morning) · ☀️ Water the plants (daily 3; 11/26 held: Mom checks before pay) · Pick up the den · 🌙 Lay out clothes
 *   plus the kinds that get NO line: Mom's and Dad's chores, an Up for Grabs chore, a 🔄 pair that takes turns (kid_a / kid_b), a
 *   brand-new chore (starts after the replay), a chore above kid_a's level (on nobody's list); kid_b 🧹 Sweep the porch; kid_c, kid_d.
 * Checks, on every day from Mon 11/23 to Mon 11/30:
 *   A the card's marks = the ledger's own rows for the same turns (one mark per day the chore was due; a ✖ row's own words say what
 *     became of it: "done Thu, late" → that day's ✅ / ⏸, "still on … list today" → ⏳ and today's ⏳ row, "gone from … Sat" → ✖ and
 *     Saturday's gone row), the last 6, newest last; every kind seen over the replay (on its day, late, ⏳, gone, ➖, 🌅, ⏸, ○, a daily,
 *     the 3-a-week trash)
 *   B the jump: the card closes; the pop-up = that chore's rows only, each byte for byte the ledger's own row on that day (the rows of
 *     lgDayHTML that link to this chore's card), in order, with the ledger's own buttons; how far back it says; "Show everything ›" =
 *     the ordinary ledger on that kid byte for byte (this tree, and the app before); the ordinary 📒 opening afterwards = before
 *   C nothing written: drawing the card, the chore view, Show everything, closing — no database ref, no local key, the database and
 *     the app's state the same; the tap = the card's own ✕ (hcClose), ref for ref and key for key, and nothing more
 *   D no line (and the tap opens nothing) for the kinds above, and for every chore with Take over off
 *   E the card = the app before's card byte for byte, but the one line, right under 📊; the ordinary ledger = the app before's
 *   F a kid's device, a kitchen kiosk, Dad's own link and Mom's device out of Mom mode: no line, no jump, no chore view
 * "The app before" = THIS tree's house.js with LASTTURNS taken out (the block, the card's hook, lgHTML's first line; each must match
 * exactly once or the test stops), loaded on a second Mom device in the same world. No git, no pinned commit.
 * LT_INDEX / LT_HJS = other copies of index.html / house.js (the mutation checks). LT_DUMP = a file for the preview page.
 * run: node test_ledger_lastturns.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.LT_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.LT_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree's house.js, LASTTURNS taken out ──
const once = (src, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_ledger_lastturns: the app before cannot be built — " + label + " found " + n + "× (must be exactly once)"); return src.replace(from, () => to); };
const HOOK_CARD = "+(typeof ltCardHTML===\"function\"?ltCardHTML(id):'')", HOOK_CARD_NOTE = " · 📒 LASTTURNS (L7): its last turns, a jump to the ledger";
const HOOK_LG = "  const _lt=(typeof ltHTML===\"function\")?ltHTML():\"\"; if(_lt) return _lt;   // 📒 LASTTURNS (L7): the ledger on one chore (lgWeek===null)\n";
const BASE_HJS = (() => { let s = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
  s = once(s, /^\/\/ LASTTURNS_START[^\n]*\n[\s\S]*?^\/\/ LASTTURNS_END\n/m, "", "the LASTTURNS block");
  s = once(s, HOOK_CARD, "", "the card's hook"); s = once(s, HOOK_CARD_NOTE, "", "the card hook's comment");
  s = once(s, HOOK_LG, "", "lgHTML's first line");
  if (/ltCardHTML|ltHTML|ltSel|LASTTURNS/.test(s)) throw new Error("test_ledger_lastturns: the app before still mentions LASTTURNS");
  return s; })();
console.log("(the app before: this tree's house.js with the LASTTURNS block, the card's hook and lgHTML's first line taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_rabbit: K({ label: "Feed the rabbit", emoji: "🐇", who: "kid_a", slot: "morning", cad: "wk:0,2,4", pts: 15, area: "animals", order: 0 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 1 }),
  a_table: K({ label: "Wipe the table", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 2 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 3 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 4 }),
  a_base: K({ label: "Wipe the baseboards", emoji: "🧽", who: "kid_a", slot: "chores", cad: "wk:0", pts: 10, order: 5 }),
  a_trash: K({ label: "Empty the trash", emoji: "🗑", who: "kid_a", slot: "chores", cad: "wk:0,2,4", pts: 5, order: 6 }),
  a_fish: K({ label: "Feed the fish", emoji: "🐟", who: "kid_a", slot: "chores", cad: "wk:3", pts: 3, order: 7 }),
  a_rake: K({ label: "Rake the leaves", emoji: "🍂", who: "kid_a", slot: "chores", cad: "wk:3", pts: 8, order: 8 }),
  a_new: K({ label: "Wash the car", emoji: "🚗", who: "kid_a", slot: "chores", cad: "wk:5", pts: 10, order: 9, from: "2026-12-05" }),   // brand-new: starts after the replay
  a_high: K({ label: "Clean the gutters", emoji: "🪜", who: "kid_a", slot: "chores", cad: "daily", pts: 20, order: 10, level: 3 }),     // above kid_a's level: on nobody's list
  a_plants: K({ label: "Water the plants", emoji: "🪴", who: "kid_a", slot: "afternoon", cad: "daily", pts: 3, order: 0 }),
  a_den: K({ label: "Pick up the den", emoji: "🧸", who: "kid_a", slot: "afternoon", cad: "daily", pts: 5, area: "pickup", order: 1 }),
  a_clothes: K({ label: "Lay out clothes", emoji: "👕", who: "kid_a", slot: "evening", cad: "daily", area: "health", order: 0 }),
  a_pick: K({ label: "Pickup the hall", emoji: "🧦", who: "kid_a", slot: "evening", cad: "daily", area: "pickup", rot: "pick", pts: 4, order: 1 }),   // 🔄 takes turns
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "daily", pts: 6, order: 0 }),
  b_pick: K({ label: "Pickup the stairs", emoji: "🧤", who: "kid_b", slot: "evening", cad: "daily", area: "pickup", rot: "pick", pts: 4, order: 1 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 }),
  g_win: K({ label: "Wipe the windows", emoji: "🪟", who: "grab", slot: "chores", cad: "daily", pts: 4, order: 0 }),
  m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "daily", minutes: 10, src: { kind: "momChore", id: "fridge" }, order: 1 }),
  d_trash: K({ label: "Trash to the curb", who: "dad", slot: "", cad: "daily", area: "pickup", src: { kind: "dadChore", id: "trash" }, order: 0 })
});
const KIDS_A = ["a_teeth", "a_rabbit", "a_bed", "a_table", "a_vac", "a_dust", "a_base", "a_trash", "a_fish", "a_rake", "a_plants", "a_den", "a_clothes"];
const NONE = ["a_new", "a_high", "a_pick", "b_pick", "g_win", "m_fridge", "d_trash"];
const CFG = () => ({ routineBonus: { afternoon: { kid_a: 4 }, chores: { kid_c: 2 }, day: { kid_c: 3 } }, choreVerify: { kid_b: true } });
const LINE = { caps: { "0": 0, "1": 0, "2": 0, "3": 1, "4": 0, "5": 0, "6": 0 }, asOf: "2026-11-23", homeFrom: "2026-11-23" };
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const idxOf = (d, slot, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label.indexOf(" + J(label) + ")===0&&x.cad!=='none'; }); })()");
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; " + (slot === "morning" ? "toggleMorningStep('" + kid + "'," + i + ")" : "toggleRtStep('" + slot + "','" + kid + "'," + i + ")") + "; })()"); return i; };
const wave = (A, slot, kid, label) => A.run("rtWave('" + slot + "','" + kid + "',_todayDay," + idxOf(A, slot, kid, label) + ")");
const send = (A, slot, kid, label) => A.run("amSend('" + slot + "','" + kid + "',_todayDay," + idxOf(A, slot, kid, label) + ")");
const kidsToday = d => d.run("mdCardKidsToday(mdTodayName(),true,true)");
const POP = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const ROW = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const rowDivs = h => String(h).split(ROW).slice(1).map(r => ROW + r.split("</div>")[0] + "</div>");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const card = (d, id) => d.run("(function(){ hcId=" + J(id) + "; try{ return hcCardHTML(); } finally{ hcId=''; } })()");
const marksOf = h => { const m = /📒 Last turns: ([\s\S]*?) <span style="color:#2B7A78;font-weight:800">›<\/span><\/div>/.exec(h || ""); return m ? (m[1].match(/<span title="[^"]*">([^<]*)<\/span>/g) || []).map(s => s.replace(/<[^>]+>/g, "")) : null; };
function watch(d) { d.run("globalThis.__refs=[];globalThis.__ls=[];if(!globalThis.__dbw&&db){ const r0=db.ref; db.ref=function(p){ __refs.push(String(p)); return r0.apply(db,arguments); }; globalThis.__dbw=1; }"
  + "if(!globalThis.__lsw){ const s0=localStorage.setItem, x0=localStorage.removeItem; localStorage.setItem=function(k,v){ __ls.push('set '+k); return s0.call(localStorage,k,v); }; localStorage.removeItem=function(k){ __ls.push('rm '+k); return x0.call(localStorage,k); }; globalThis.__lsw=1; }1"); }
const seen = d => JSON.parse(d.run("JSON.stringify({refs:__refs,ls:__ls})"));
const appState = d => d.run("JSON.stringify([slState,prevSlState,_prevSlWk,bank,routineLog,wavedData,amCarry,day,_todayDay,tab,householdData])");

// The ledger's own answer for each turn of a chore, from lgDayData only (the rows the ledger draws, their own words): one per day the
// chore's cad makes due (worked out here from the date, not by the app), in reach on this device.
const DOW = { daily: [0, 1, 2, 3, 4, 5, 6] };
const dueDays = cad => cad === "daily" ? DOW.daily : /^wk:/.test(cad) ? cad.slice(3).split(",").map(Number) : [];
function ledgerTurns(d, id, cad, kid) {
  const first = d.run("-(lgNow()+8)"), xs = {}, out = [], wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let k = first; k <= 0; k++) xs[k] = JSON.parse(d.run("JSON.stringify(lgDayData(" + J(kid) + "," + k + "))"));
  const mine = x => (x.lists || []).flatMap(L => L.rows).filter(r => r.id === id);
  for (let k = first; k <= 0; k++) { const x = xs[k]; if (!x.lists) continue; const dt = new Date(x.D.iso + "T12:00:00"), dow = (dt.getDay() + 6) % 7;
    if (dueDays(cad).indexOf(dow) < 0) continue; const rs = mine(x);
    if (rs.length !== 1) { out.push({ k, iso: x.D.iso, m: "?" + rs.length }); continue; }
    const r = rs[0]; let m = r.ic, why = r.note || "";
    if (r.ic === "✖") { const dn = /· done (\w{3}), late \(see that day\)$/.exec(why), still = / · still on .*'s list today$/.test(why), gone = / · gone from .*'s list (\w{3})$/.exec(why);
      if (dn) { let T = null; for (let j = k + 1; j <= 0; j++) if (xs[j].D && wd[new Date(xs[j].D.iso + "T12:00:00").getDay()] === dn[1]) { T = j; break; }
        const lr = T == null ? [] : mine(xs[T]); m = lr.length === 1 && /^(✅|⏸)$/.test(lr[0].ic) ? lr[0].ic : "?late"; }
      else if (still) m = mine(xs[0]).some(q => q.ic === "⏳") ? "⏳" : "?still";
      else if (gone) { let T = null; for (let j = k + 1; j <= 0; j++) if (xs[j].D && wd[new Date(xs[j].D.iso + "T12:00:00").getDay()] === gone[1]) { T = j; break; }
        m = T != null && (xs[T].gone || []).some(q => q.id === id && q.ic === "✖") ? "✖" : "?gone"; }
      else m = "✖"; }
    out.push({ k, iso: x.D.iso, m, why }); }
  return out; }

async function mkWorld(index) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: Object.assign(clone(W.FX.db.config), CFG()), laundryLine: clone(LINE) } });
  const A = w.boot("A", "devA", { mom: true }), E = w.boot("E", "devE", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK"), Mo = w.boot("Mo", "devMo");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, E, B, Dd, Kk, Mo]) d.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };tab='moms-plan';1");
  Mo.run("haMomOff();1");
  await w.flush(); return { w, A, E, B, Dd, Kk, Mo };
}

(async () => {
const { w, A, E, B, Dd, Kk, Mo } = await mkWorld(IDX);
A.run(HJS); E.run(BASE_HJS);
const S = { a: [], b: [], c: [], d: [], e: [], f: [], kinds: {}, dump: {} };
const daily = (B, n) => { tick(B, "morning", "kid_a", "Brush teeth"); if (n !== 9 && n !== 10) tick(B, "chores", "kid_a", "Make the bed"); if (n !== 10) tick(B, "chores", "kid_a", "Wipe the table"); tick(B, "chores", "kid_b", "Sweep the porch"); tick(B, "chores", "kid_c", "Toys in the bin"); };
for (let n = 0; n <= 14; n++) {
  await go(w, n, 8); const dow = (dOf(n).getDay() + 6) % 7;   // 0 = Monday
  daily(B, n); if ([0, 2, 4].includes(dow) && n !== 7) tick(B, "morning", "kid_a", "Feed the rabbit"); await w.flush();
  if (n === 10) { tick(B, "morning", "kid_a", "Start your laundry"); await w.flush(); }
  if (n === 11) { const id = B.run("(function(){ const L=amFor('kid_a',_todayDay)||[]; return (L[0]||{}).id||''; })()"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(id) + "); })()"); await w.flush(); }
  await go(w, n, 16);
  if (n < 6) { if (dow === 0) tick(B, "chores", "kid_a", "Wipe the baseboards"); if ([0, 2, 4].includes(dow)) tick(B, "chores", "kid_a", "Empty the trash");
    if (dow === 2) tick(B, "chores", "kid_a", "Dust the shelves"); if (dow === 3) { tick(B, "chores", "kid_a", "Feed the fish"); tick(B, "chores", "kid_a", "Rake the leaves"); tick(B, "chores", "kid_a", "Vacuum the den"); } }
  if (n === 8) tick(B, "chores", "kid_a", "Empty the trash");          // Monday 11/23's turn, 1 day late
  if (n === 9) tick(B, "chores", "kid_a", "Empty the trash");          // Wednesday's own
  if (n === 10) { tick(B, "chores", "kid_a", "Vacuum the den"); wave(A, "chores", "kid_a", "Feed the fish"); send(A, "chores", "kid_a", "Rake the leaves"); }
  if (n >= 6 && n <= 12 && n !== 10) { tick(B, "afternoon", "kid_a", "Water the plants"); tick(B, "afternoon", "kid_a", "Pick up the den"); tick(B, "evening", "kid_a", "Lay out clothes"); }
  if (n === 10) { B.run("choreVerify=Object.assign({},choreVerify,{kid_a:true});1"); tick(B, "afternoon", "kid_a", "Water the plants"); B.run("choreVerify=Object.assign({},choreVerify);delete choreVerify.kid_a;1"); tick(B, "afternoon", "kid_a", "Pick up the den"); }
  if (n < 6) { tick(B, "afternoon", "kid_a", "Water the plants"); tick(B, "afternoon", "kid_a", "Pick up the den"); tick(B, "evening", "kid_a", "Lay out clothes"); }
  await w.flush();
  await go(w, n, 18);
  if (n < 7) continue;
  // the kids' lists drawn (they file the "— not done" lines); Mom's Kids today card on both Mom devices (the lists' read of last week)
  B.run("(function(){ day=_todayDay; ['chores','afternoon','evening'].forEach(function(s){ ROSTER.forEach(function(k){ rtOpen={}; rtSlotHTML(s,k); }); }); })()");
  for (const d of [A, E]) { d.run("haMomOn();tab='moms-plan';1"); kidsToday(d); } await w.flush();
  const tag = "day " + n + " (" + A.run("_todayDay") + ")";
  // ── A · the marks = the ledger's own rows ──
  for (const id of KIDS_A) { const cad = FAM()[id].cad, L = ledgerTurns(A, id, cad, "kid_a"), want = L.map(t => t.m).slice(-6), h = card(A, id), got = marksOf(h);
    const inner = JSON.parse(A.run("JSON.stringify(ltTurns(" + J(id) + ").map(function(t){ return [t.D.iso,t.m]; }))"));
    S.a.push([tag, id, J(got) === J(want) && J(inner.map(t => t[1])) === J(L.map(t => t.m)) && J(inner.map(t => t[0])) === J(L.map(t => t.iso)) && !L.some(t => /^\?/.test(t.m)), got, want]);
    L.forEach(t => { S.kinds[id + " " + t.m] = 1; });
    if (got) { const titles = (h.match(/<span title="([^"]*)">[^<]*<\/span>/g) || []).length; S.a.push([tag, id + " titles", titles === got.length && got.length <= 6, titles]); } }
  // ── B · the jump ──
  for (const id of KIDS_A) { if (!marksOf(card(A, id))) continue;
    A.run("hcId=" + J(id) + ";1"); const pop = POP(A, "ltGo(" + J(id) + ")"), closed = A.run("hcId") === "";
    const first = A.run("-(lgNow()+8)"); let want = [];
    for (let k = first; k <= 0; k++) want = want.concat(rowDivs(A.run("lgDayHTML('kid_a'," + k + ")")).filter(r => r.indexOf("hcGo('" + id + "')") >= 0));
    const got = rowDivs(pop);
    S.b.push([tag, id, closed && got.length > 0 && J(got) === J(want) && /Show everything ›/.test(pop) && pop.indexOf("📒 Ledger") > 0 && A.run("lgWeek") === null, got.length, want.length]);
    if (id === "a_trash" || id === "a_vac") S.dump[n + "_" + id] = { card: card(A, id), pop };
    // the redraw a row button makes (lgDraw) keeps the chore view; "Show everything ›" = the ordinary ledger on kid_a, today
    const again = POP(A, "lgDraw()"), all = POP(A, "ltAll()"), plain = POP(A, "lgKid='kid_a';lgShow()"), base = POP(E, "lgKid='kid_a';lgShow()");
    const CH = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">', topA = all.slice(0, all.indexOf(CH));
    S.b.push([tag, id + " redraw / Show everything", again === pop && all === plain && all === base && all.indexOf("Show everything") < 0 && topA.length > 200 && pop.indexOf(topA) === 0 && pop.indexOf(CH) < 0, [again === pop, all === plain, all === base, pop.indexOf(topA)]]);
    // the chore view left by a name tap (lgClose; hcGo), then the ordinary 📒 from Kids today: the ordinary ledger, as before
    POP(A, "ltGo(" + J(id) + ")"); A.run("lgClose();1"); const later = POP(A, "ledgerOpen()"), laterB = POP(E, "ledgerOpen()");
    S.b.push([tag, id + " ordinary 📒 after the chore view", later === laterB && later.indexOf("Show everything") < 0, later === laterB]); A.run("lgClose();1"); E.run("lgClose();1"); }
  // the reach line
  { const pop = POP(A, "ltGo('a_bed')"), last = A.run("!!lgMap(lgDay(-(lgNow()+8)))"), from = A.run("lgDate(lgDay(-(lgNow()+8)).iso)");
    S.b.push([tag, "reach", last ? pop.indexOf("This week and last week, from " + from + ". Older days are not kept on this device.") > 0 : /This week, from [^.]*\. Last week's check-offs are not on this device yet\./.test(pop), from]); A.run("lgClose();1"); }
  // ── C · nothing written ──
  { const db0 = J(w.db.tree.root), log0 = w.db.log.length, st0 = appState(A); watch(A);
    // the line's own drawing, the chore view, a redraw, Show everything, ✕: nothing at all (the chore view opened here without the card)
    for (const id of KIDS_A.concat(NONE)) { card(A, id); A.run("ltCardHTML(" + J(id) + ")"); POP(A, "lgKid='kid_a';lgOff=0;lgWeek=null;ltSel=" + J(id) + ";lgDraw()"); POP(A, "lgDraw()"); POP(A, "ltAll()"); A.run("lgClose();1"); }
    await w.flush(); const s = seen(A);
    S.c.push([tag, "draw", s.refs.length === 0 && s.ls.length === 0 && J(w.db.tree.root) === db0 && w.db.log.length === log0 && appState(A) === st0, s, w.db.log.length - log0]);
    // the tap closes the card the way the card's own ✕ does (hcClose: Mom's Day drawn again) and does nothing more
    const bad = [];
    for (const id of KIDS_A.concat(NONE)) { const line = !!A.run("ltCardHTML(" + J(id) + ")");
      watch(A); A.run("hcId=" + J(id) + ";hcClose();1"); const x = seen(A); watch(A); POP(A, "hcId=" + J(id) + ";ltGo(" + J(id) + ")"); const y = seen(A); A.run("lgClose();hcId='';1");
      if (J(y) !== J(line ? x : { refs: [], ls: [] })) bad.push([id, x, y]); }
    await w.flush();
    S.c.push([tag, "tap", bad.length === 0 && J(w.db.tree.root) === db0 && w.db.log.length === log0, bad]); }
  // ── D · no line ──
  for (const id of NONE) { const h = card(A, id), p = POP(A, "ltGo(" + J(id) + ")"); S.d.push([tag, id, !/Last turns/.test(h) && A.run("ltCardHTML(" + J(id) + ")") === "" && p === "", h.length]); A.run("lgClose();1"); }
  { A.run("householdData.meta.takeover=0;1"); const bad = KIDS_A.filter(id => A.run("ltCardHTML(" + J(id) + ")") !== "" || POP(A, "ltGo(" + J(id) + ")") !== ""); A.run("householdData.meta.takeover=1;1");
    S.d.push([tag, "Take over off", bad.length === 0, bad]); }
  // ── E · the card and the ledger = the app before, but the one line ──
  for (const id of KIDS_A.concat(NONE)) { const a = card(A, id), b = card(E, id), line = A.run("ltCardHTML(" + J(id) + ")"), hist = A.run("hoHistHTML(" + J(id) + ")");
    S.e.push([tag, id, (line ? a.split(line).length === 2 && a.indexOf(hist + line) >= 0 : true) && a.replace(line, "") === b, line.length]); }
  S.e.push([tag, "the ordinary ledger", POP(A, "lgKid='kid_a';lgShow()") === POP(E, "lgKid='kid_a';lgShow()") && POP(A, "lgGo('kid_b',-2,0)") === POP(E, "lgGo('kid_b',-2,0)") && POP(A, "lgGo('',0,1)") === POP(E, "lgGo('',0,1)"), 0]);
  A.run("lgClose();1"); E.run("lgClose();1");
  // ── F · not Mom ──
  for (const [nm, d] of [["a kid's device", B], ["a kitchen kiosk", Kk], ["Dad's own link", Dd], ["Mom's device out of Mom mode", Mo]]) {
    if (d.run("typeof ltCardHTML") !== "function") d.run(HJS);
    const db0 = J(w.db.tree.root); watch(d);
    const r = KIDS_A.map(id => [d.run("ltCardHTML(" + J(id) + ")"), card(d, id), POP(d, "ltGo(" + J(id) + ")"), d.run("ltSel=" + J(id) + ";lgKid='kid_a';lgWeek=null;ltHTML()")]);
    d.run("ltSel='';lgWeek=false;1"); const s = seen(d);
    S.f.push([tag, nm, r.every(x => x.join("") === "") && s.refs.length === 0 && s.ls.length === 0 && J(w.db.tree.root) === db0, r.find(x => x.join("") !== "")]); }
}
const each = (lbl, arr) => { const bad = arr.filter(x => !x[2]); ok(lbl + " (" + arr.length + " checks)", bad.length === 0, bad.slice(0, 3)); };

console.log("\n── A · the card's marks = the ledger's own rows for the same turns ──");
each("every day Mon 11/23 … Mon 11/30, kid_a's 13 chores: the marks on the card = the last 6 turns the ledger shows, newest last; every turn = the ledger's row that day (and what its words say became of it)", S.a);
{ const k = S.kinds, has = s => !!k[s];
  ok("…seen over the replay: done on its day (bed ✅), done late (vacuum 11/24 → ✅ on Thu), in its wait (dust ⏳, trash ⏳), gone (baseboards ✖, dust ✖), excused (fish ➖), 🌅 sent (leaves), held (plants ⏸), not done yet (table ○), a daily not done (bed ✖), the 3-a-week trash",
    ["a_bed ✅", "a_vac ✅", "a_dust ⏳", "a_trash ⏳", "a_base ✖", "a_dust ✖", "a_fish ➖", "a_rake 🌅", "a_plants ⏸", "a_table ○", "a_bed ✖", "a_trash ✅", "a_trash ✖"].every(has), Object.keys(k).sort()); }
{ const thu = S.dump["10_a_vac"], m = marksOf(thu && thu.card);
  ok("Thu 11/26, the vacuum (Tue): \"📒 Last turns: ✅ ✅ ›\" — Tue 11/17 (ticked Thu in full) and Tue 11/24 (ticked today, 6 of 10)", J(m) === J(["✅", "✅"]), m); }
{ const mon = S.dump["14_a_trash"], m = marksOf(mon && mon.card);
  ok("Mon 11/30, the trash (Mon Wed Fri): \"📒 Last turns: ✅ ✅ ✖ ○ ›\" after Mon 11/23 (ticked Tue) · Wed · Fri (⏳ Sat, Sun, gone today) · today's", J(m.slice(-3)) === J(["✅", "✖", "○"]) && m.length === 4, m); }

console.log("\n── B · the jump: the ledger on that chore ──");
each("tapping the line closes the card and opens the 📒 Ledger on kid_a showing that chore's rows only — each byte for byte the ledger's own row that day, in day order, with the ledger's own buttons; \"Show everything ›\" is there", S.b.filter(x => !/ /.test(x[1])));
each("a row button's redraw (lgDraw) keeps the chore view; its top (📒 Ledger, ⚙, ✕, the panel / ⏸ banner) is the ledger's own top, byte for byte; \"Show everything ›\" = the ordinary ledger on kid_a today, byte for byte (this tree and the app before)", S.b.filter(x => / redraw/.test(x[1])));
each("the chore view left by a name tap: the next 📒 from Kids today is the ordinary ledger = the app before's", S.b.filter(x => / ordinary/.test(x[1])));
each("how far back, in one line: \"This week and last week, from <Sun>. Older days are not kept on this device.\" (or this week only, last week not on the device yet)", S.b.filter(x => x[1] === "reach"));

console.log("\n── C · nothing written ──");
each("drawing the card and its line, the chore view, a redraw, Show everything and ✕, for all 20 chores: no database ref (read or write), no local key, the database and the app's state as they were", S.c.filter(x => x[1] === "draw"));
each("tapping the line: exactly what the card's own ✕ does (hcClose draws Mom's Day again, which re-saves the kitchen flags on the device) and nothing more; no line, nothing at all; the database as it was", S.c.filter(x => x[1] === "tap"));

console.log("\n── D · no line where there is nothing to show ──");
each("Mom's chore, Dad's chore, Up for Grabs, the 🔄 pair that takes turns, a brand-new chore, one above the level (on nobody's list): no line, and ltGo opens nothing", S.d.filter(x => x[1] !== "Take over off"));
each("Take over off (the lists are not the table's): no line on any chore, no jump", S.d.filter(x => x[1] === "Take over off"));

console.log("\n── E · the app before, but the one line ──");
each("every chore's card = the app before's card byte for byte, but the line, which sits once, right under 📊 How often's line", S.e.filter(x => x[1] !== "the ordinary ledger"));
each("the ordinary ledger (today, kid_b two days ago, This week) = the app before's", S.e.filter(x => x[1] === "the ordinary ledger"));

console.log("\n── F · Mom only ──");
each("a kid's device, a kitchen kiosk, Dad's own link, Mom's device out of Mom mode: no line, no card, no jump, no chore view, nothing read or written", S.f);

console.log("\n── G · a Mom device that does not have last week yet ──");
{ const G = w.boot("G", "devG", { mom: true }); G.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };haMomOn();tab='moms-plan';1"); await w.flush(); G.run(HJS);
  G.run("prevSlState=null;1");   // memory only: as before the lists' read of last week lands
  const has = G.run("!!lgMap(lgDay(-(lgNow()+8)))"), L = ledgerTurns(G, "a_trash", "wk:0,2,4", "kid_a"), m = marksOf(card(G, "a_trash")), pop = POP(G, "ltGo('a_trash')");
  ok("Mon 11/30, last week not on the device: the line shows only this week's turn (\"○\", today's: none of last week's), = the ledger's", !has && J(m) === J(L.map(t => t.m)) && J(m) === J(["○"]), [has, m, L]);
  ok("…and the pop-up says so in one line: \"This week, from Sun, Nov 29. Last week's check-offs are not on this device yet. Open a kid's list and come back.\"", pop.indexOf("This week, from Sun, Nov 29. Last week's check-offs are not on this device yet. Open a kid's list and come back.") > 0, txt(pop).slice(0, 400)); }
{ const p = S.dump["10_a_vac"].pop;
  ok("the chore view's words (Thu 11/26, the vacuum): \"🧹 Vacuum the den · Kid A\", \"Show everything ›\", the four days it had a row: its two Tuesdays (✖ … done Thu, late) and the two Thursdays it was ticked", /🧹 Vacuum the den · Kid A Show everything › This week and last week, from Sun, Nov 15\. Older days are not kept on this device\. Tue, Nov 17 ✖ 🧹 Vacuum the den not done · done Thu, late \(see that day\) 10 ⭐ Thu, Nov 19 ✅ 🧹 Vacuum the den done late · due Tue \+10 ⭐ [\d:]+ [AP]M Tue, Nov 24 ✖ 🧹 Vacuum the den not done · done Thu, late \(see that day\) 10 ⭐ Today ✅ 🧹 Vacuum the den paid 6 of 10 ⭐ · due Tue \+6 ⭐ [\d:]+ [AP]M ⭐ Give stars back$/.test(txt(p).replace(/^📒 Ledger ⚙ ✕ /, "")), txt(p)); }

if (process.env.LT_DUMP) { fs.writeFileSync(process.env.LT_DUMP, J(S.dump)); console.log("(dump: " + process.env.LT_DUMP + ")"); }
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
