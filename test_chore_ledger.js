/*
 * test_chore_ledger.js — 📒 the Ledger, slice L1 of DESIGN_chore_ledger_2026-11-21 (§2, §8, §9 row L1; her "go" 2026-11-21): a
 * look-only pop-up from a 📒 button on 🧒 Kids today, for Mom and for Dad's own link. Her words: "a good ledger for mom to really look
 * at the deductions and everything that was daily", "moms day as a button to a pop up", "Dad gets it too", "i dont want to mess up
 * something that is working".
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase, one virtual clock) on a made-up family
 * (kid_a … kid_d), the clock moved day by day from Mon 11/16 (day 0) to Mon 11/30 (day 14). A hand-built week, so every number is known:
 *   kid_a  🌅 Brush teeth (daily, 0 ⭐) · Feed the rabbit (Mon Wed Fri, 15) · Start your laundry (the line's Thursday load, 10 ⭐)
 *          🧹 Make the bed (daily 2) · Wipe the table (daily 2) · Vacuum the den (Tue 10) · Dust the shelves (Wed 10) · Wipe the baseboards
 *             (Mon 10) · Empty the trash (Mon Wed Fri 5) · Feed the fish (Thu 3) · Rake the leaves (Thu 8)
 *          ☀️ Water the plants (daily 3) · Pick up the den (daily 5), list bonus 4 · 🌙 Lay out clothes (daily 0)
 *   kid_b  🧹 Sweep the porch (daily 6), Mom checks before pay   ·   kid_c  🧹 Toys in the bin (daily 3), list bonus 2, day bonus 3
 *   kid_d  nothing at all (the empty day)
 * Week 1 (before the falling stars' blank slate 11/22): every row on its day, except Vacuum the den (Tue 11/17), ticked Thu 11/19 in full.
 * Week 2: Mon 11/23 the baseboards missed (gone Thu) and the trash's Monday turn ticked Tue (4 of 5, 1 day late); Tue the vacuum missed,
 * ticked Thu (6 of 10); the rabbit (a Morning row) not fed Mon 11/23 — the Morning list never carries it; Wed the dust missed (still on the list Thu and Fri, gone Sat) and the bed not made; Thu (THE day): the laundry
 * started, the plants ticked while Mom checks before pay (held 3), the den → the 🏁 bonus, the fish ✕ today, the leaves 🌅 sent to Friday
 * morning (ticked there: 8), the table and the clothes not done yet; Fri the trash missed (1 day late Sat, 2 Sun, gone Mon 11/30).
 * Checks: A the button (Mom, Dad's link; not a kid device, a kiosk, Mom's device out of Mom mode) · B the first tap asks for house.js
 * once, the loading line, the second tap does not · C Thursday, row by row, the top line by hand = the bank lines of that day, each
 * row's stars = what its check-off stored · D every day of the week, This week = the seven days added up · E the gone / still-on-list
 * fate agrees with the lists' own rule (rtLateDays, the "— not done" line) every day · F yesterday and last week across Sunday's week
 * change, with last week's check-offs loaded and not yet loaded; the empty day; the not-on-this-device day · G the chips, arrows and
 * kid chips move the view and write nothing; no database read or write, no log line, no bank change, through all of it · H the chore
 * name opens its card for Mom, not for Dad · I the first-minute card once per device, its one local flag · J every other screen =
 * the app before (this tree's index.html with the LEDGER block and its one header call taken out, house.js not loaded there), byte for
 * byte, apart from the button.
 * LEDGER_INDEX / LEDGER_HJS = other copies of index.html / house.js (the mutation checks).   run: node test_chore_ledger.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.LEDGER_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.LEDGER_HJS || path.join(__dirname, "house.js"), "utf8");
// "The app before" = THIS tree with the ledger taken out (no git, no pinned commit, so a later merge that changes another screen changes
// both sides alike): index.html beside this file minus the LEDGER block and the one call in the Kids today header (each must match
// exactly once — renamed or moved, the test stops loudly), and house.js not loaded on that side (LEDGERVIEW is only reached through it).
const BASE = (() => { let src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const blk = /^\/\/ LEDGER_START[^\n]*\n[\s\S]*?^\/\/ LEDGER_END\n/gm, call = "+(typeof ledgerBtn===\"function\"?ledgerBtn(_kToday):'')+'</div>';   // 📒 LEDGER";
  const nb = (src.match(blk) || []).length, nc = src.split(call).length - 1;
  if (nb !== 1 || nc !== 1) throw new Error("test_chore_ledger: the app before cannot be built — LEDGER block found " + nb + "×, the header call " + nc + "× (each must be exactly once)");
  src = src.replace(blk, "").replace(call, "+'</div>';");
  if (/ledgerBtn|ledgerOpen|^\/\/ LEDGER_(START|END)/m.test(src)) throw new Error("test_chore_ledger: the app before still mentions the ledger");
  const t = path.join(os.tmpdir(), "chore_ledger_before_" + process.pid + ".html"); fs.writeFileSync(t, src); return t; })();
console.log("(the app before: this tree's index.html with the LEDGER block and its header call taken out; house.js not loaded there)");

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
  a_plants: K({ label: "Water the plants", emoji: "🪴", who: "kid_a", slot: "afternoon", cad: "daily", pts: 3, order: 0 }),
  a_den: K({ label: "Pick up the den", emoji: "🧸", who: "kid_a", slot: "afternoon", cad: "daily", pts: 5, area: "pickup", order: 1 }),
  a_clothes: K({ label: "Lay out clothes", emoji: "👕", who: "kid_a", slot: "evening", cad: "daily", area: "health", order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "daily", pts: 6, order: 0 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const CFG = () => ({ routineBonus: { afternoon: { kid_a: 4 }, chores: { kid_c: 2 }, day: { kid_c: 3 } }, choreVerify: { kid_b: true } });
const LINE = { caps: { "0": 0, "1": 0, "2": 0, "3": 1, "4": 0, "5": 0, "6": 0 }, asOf: "2026-11-23", homeFrom: "2026-11-23" };   // one load a week, on Thursday: kid_a's
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
async function mkWorld(index) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: Object.assign(clone(W.FX.db.config), CFG()), laundryLine: clone(LINE) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK"), Mo = w.boot("Mo", "devMo");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk, Mo]) d.run("globalThis.__pop='';globalThis.__tags=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };document.head.appendChild=function(c){ __tags.push(c); c.parentNode=document.head; return c; };tab='moms-plan';1");
  Mo.run("haMomOff();1");   // Mom's own device out of Mom mode
  await w.flush(); return { w, A, B, Dd, Kk, Mo };
}
// a kid's tick on today's tab (Kids' Corner's own), a morning tick, Mom's ✕ today and 🌅
const idxOf = (d, slot, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label.indexOf(" + J(label) + ")===0&&x.cad!=='none'; }); })()");
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; " + (slot === "morning" ? "toggleMorningStep('" + kid + "'," + i + ")" : "toggleRtStep('" + slot + "','" + kid + "'," + i + ")") + "; })()"); return i; };
const wave = (A, slot, kid, label) => A.run("rtWave('" + slot + "','" + kid + "',_todayDay," + idxOf(A, slot, kid, label) + ")");
const send = (A, slot, kid, label) => A.run("amSend('" + slot + "','" + kid + "',_todayDay," + idxOf(A, slot, kid, label) + ")");
// the ledger on a device: house.js run in it (the file the tap fetches), then its own functions
const loadH = d => { if (d.run("typeof lgShow") !== "function") d.run(HJS); };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const data = (d, kid, k) => JSON.parse(d.run("JSON.stringify(lgDayData(" + J(kid) + "," + k + "))"));
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const rowsH = h => String(h).split('<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;').slice(1).map(r => txt(('<div ' + r.split("</div>")[0]).replace(/<button onclick="lgExcuse(Undo)?\([^"]*\)"[^>]*>(➖ Excuse|Undo)<\/button>/g, "")));   // L3's ➖ Excuse / Undo left out of a row's words (line 219 checks where they are)
const rowT = (h, name) => rowsH(h).filter(r => r.indexOf(name) >= 0)[0] || "";
const top = h => txt((/<div style="font-size:13\.5px;padding:6px 2px 2px">([\s\S]*?)<\/div>/.exec(h) || ["", ""])[1]);
// the bank lines of a kid's day as the database holds them (src earn, this week key and day), held apart
const adj = (w, kid) => (((w.db.tree.root.bank || {})[kid] || {}).adjustments) || {};
const bankDay = (w, kid, wk, dn) => { let paid = 0, held = 0, lines = []; Object.values(adj(w, kid)).forEach(a => { if (a && a.src === "earn" && a.wk === wk && a.day === dn) { if (a.held) held += a.amount || 0; else { paid += a.amount || 0; lines.push([a.note, a.amount]); } } }); return { paid, held, lines: lines.sort() }; };
// every database ref the device makes while fn runs (reads and writes), and every localStorage key it sets
function watch(d) { d.run("globalThis.__refs=[];globalThis.__ls=[];if(!globalThis.__dbw&&db){ const r0=db.ref; db.ref=function(p){ __refs.push(String(p)); return r0.apply(db,arguments); }; globalThis.__dbw=1; }"
  + "if(!globalThis.__lsw){ const s0=localStorage.setItem, x0=localStorage.removeItem; localStorage.setItem=function(k,v){ __ls.push('set '+k); return s0.call(localStorage,k,v); }; localStorage.removeItem=function(k){ __ls.push('rm '+k); return x0.call(localStorage,k); }; globalThis.__lsw=1; }1"); }
const seen = d => JSON.parse(d.run("JSON.stringify({refs:__refs,ls:__ls})"));
// the ledger's own state, and the app's that it must leave alone
const appState = d => d.run("JSON.stringify([slState,prevSlState,_prevSlWk,bank,routineLog,wavedData,amCarry,day,_todayDay,tab,typeof mpSubView!=='undefined'?mpSubView:null])");
const BTN = /<button onclick="ledgerOpen\(\)" style="margin-left:(auto|6px);border:none;background:rgba\(255,255,255,0\.25\);color:#fff;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer">📒 Ledger<\/button>/g;
const kidsToday = (d, dad) => d.run("mdCardKidsToday(mdTodayName(),true,true" + (dad ? ",false" : "") + ")");

(async () => {
const { w, A, B, Dd, Kk, Mo } = await mkWorld(IDX);
const BW = await mkWorld(BASE);   // the app before, the same replay, never a ledger tap
const S = { days: {}, fate: [], weekOf: {}, screens: [], dbSame: [], notes: {} };
// one replay, both worlds in step
const both = async (fn) => { await fn(w.__dev || { w, A, B, Dd }); if (BW) await fn(BW.__dev); };
w.__dev = { w, A, B, Dd, Kk, Mo }; if (BW) BW.__dev = { w: BW.w, A: BW.A, B: BW.B, Dd: BW.Dd, Kk: BW.Kk, Mo: BW.Mo };
const daily = (B, n) => { tick(B, "morning", "kid_a", "Brush teeth"); if (n !== 9) tick(B, "chores", "kid_a", "Make the bed"); if (n !== 10) tick(B, "chores", "kid_a", "Wipe the table"); tick(B, "chores", "kid_b", "Sweep the porch"); tick(B, "chores", "kid_c", "Toys in the bin"); };
const DUE = { vac: 1, dust: 2, base: 0, fish: 3, rake: 3 };
for (let n = 0; n <= 14; n++) {
  await both(async ({ w, A, B, Dd }) => {
    await go(w, n, 8); const dow = (dOf(n).getDay() + 6) % 7;   // 0 = Monday
    daily(B, n); if ([0, 2, 4].includes(dow) && n !== 7) tick(B, "morning", "kid_a", "Feed the rabbit"); await w.flush();
    if (n === 10) { tick(B, "morning", "kid_a", "Start your laundry"); await w.flush(); }
    if (n === 11) { const id = B.run("(function(){ const L=amFor('kid_a',_todayDay)||[]; return (L[0]||{}).id||''; })()"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(id) + "); })()"); await w.flush(); }
    await go(w, n, 16);
    // week 1: everything on its day, but the vacuum (Tue 11/17) ticked Thu 11/19 — in full, before the blank slate
    if (n < 6) { if (dow === DUE.base) tick(B, "chores", "kid_a", "Wipe the baseboards"); if ([0, 2, 4].includes(dow)) tick(B, "chores", "kid_a", "Empty the trash");
      if (dow === DUE.dust) tick(B, "chores", "kid_a", "Dust the shelves"); if (dow === 3) { tick(B, "chores", "kid_a", "Feed the fish"); tick(B, "chores", "kid_a", "Rake the leaves"); tick(B, "chores", "kid_a", "Vacuum the den"); } }
    if (n === 8) tick(B, "chores", "kid_a", "Empty the trash");          // Monday 11/23's turn, 1 day late: 4 of 5
    if (n === 9) tick(B, "chores", "kid_a", "Empty the trash");          // Wednesday's own
    if (n === 10) { tick(B, "chores", "kid_a", "Vacuum the den");        // Tuesday's, 2 days late: 6 of 10
      wave(A, "chores", "kid_a", "Feed the fish"); send(A, "chores", "kid_a", "Rake the leaves"); }
    if (n >= 6 && n <= 12 && n !== 10) { tick(B, "afternoon", "kid_a", "Water the plants"); tick(B, "afternoon", "kid_a", "Pick up the den"); tick(B, "evening", "kid_a", "Lay out clothes"); }
    if (n === 10) { B.run("choreVerify=Object.assign({},choreVerify,{kid_a:true});1"); tick(B, "afternoon", "kid_a", "Water the plants"); B.run("choreVerify=Object.assign({},choreVerify);delete choreVerify.kid_a;1"); tick(B, "afternoon", "kid_a", "Pick up the den"); }   // held, then the list completes (🏁 not held)
    if (n < 6) { tick(B, "afternoon", "kid_a", "Water the plants"); tick(B, "afternoon", "kid_a", "Pick up the den"); tick(B, "evening", "kid_a", "Lay out clothes"); }
    if (n === 13) tick(B, "chores", "kid_a", "Make the bed");
    if (n === 11) { const wk0 = A.run("activeWk()"), hid = Object.keys(adj(w, "kid_b")).find(id => { const a = adj(w, "kid_b")[id]; return a && a.held && a.day === "friday" && a.wk === wk0; }); A.run("bankHeldReject('kid_b'," + J(hid) + ")"); }   // Mom's ✗ on Friday's porch
    await w.flush();
    await go(w, n, 18);
    // the kids' lists drawn on the real today (they file the "— not done" lines), and Mom's Kids today card (it makes the lists' read of last week)
    if (n >= 6) { B.run("(function(){ day=_todayDay; ['chores','afternoon','evening'].forEach(function(s){ ROSTER.forEach(function(k){ rtOpen={}; rtSlotHTML(s,k); }); }); })()"); A.run("haMomOn();tab='moms-plan';1"); kidsToday(A); await w.flush(); }
  });
  if (n >= 6) {
    loadH(A);
    const wk = A.run("activeWk()"), dn = A.run("_todayDay"), raw = JSON.parse(A.run("(function(){ day=_todayDay; const o={}; rtStepsFor('chores','kid_a',false,day).forEach(function(st,i){ o[st.label]=mdLateDays('chores','kid_a',day,i,st); }); return JSON.stringify(o); })()"));
    const misses = []; Object.entries((w.get("routineLog/kid_a") || {})).forEach(([wkk, days]) => Object.entries(days || {}).forEach(([dd, L]) => Object.entries(L || {}).forEach(([key, r]) => { if (r && r.act === "miss") misses.push(wkk + "/" + dd + "/" + r.label + "/" + r.at); })));
    S.days[n] = { wk, dn, raw, misses, x: data(A, "kid_a", 0), xs: [-1, -2, -3, -4, -5, -6, -7, -8].map(k => data(A, "kid_a", k)), bank: {} };
    ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => { S.days[n].bank[k] = bankDay(w, k, wk, dn); S.days[n]["x_" + k] = data(A, k, 0); });
    S.days[n].mraw = A.run("(function(){ day=_todayDay; const s=rtStepsFor('morning','kid_a',false,day), i=s.findIndex(function(x){ return x.label==='Feed the rabbit'; }); return i<0?-1:mdLateDays('morning','kid_a',day,i,s[i]); })()");
    S.days[n].kidMorning = B.run("(function(){ const d0=day; day=_todayDay; try{ return mrIndividualHTML('kid_a'); } finally{ day=d0; } })()");
    S.days[n].kidMorningDue = JSON.parse(B.run("JSON.stringify(morningDueIdx('kid_a',_todayDay).map(function(i){ return morningStepsFor('kid_a')[i].label; }))"));
    S.days[n].html = LG(A, "lgShow()"); S.days[n].phone = S.days[n].html;
    S.days[n].week = LG(A, "lgGo('',0,1)"); S.days[n].weekX = JSON.parse(A.run("(function(){ const t=lgNow(), o=[]; for(let k=-(t+1);k<=0;k++) o.push(lgDayData('kid_a',k)); return JSON.stringify(o); })()"));
    if (process.env.LEDGER_DUMP && (n === 10 || n === 12)) {   // the preview page's drawings (nothing else reads them)
      S.dump = S.dump || {}; S.dump["d" + n] = { day: S.days[n].html, week: S.days[n].week, empty: LG(A, "lgGo('kid_d',0,0)") };
      A.run("HA_LS.setItem('ha_ledger_hello','1');1"); S.dump["d" + n].plain = LG(A, "lgGo('kid_a',0,0)"); A.run("HA_LS.removeItem('ha_ledger_hello');1"); }
    A.run("lgClose();1");
    // J · every other screen = the app before, byte for byte, but the button
    if (BW) {
      const scr = (X) => { const o = {}; X.A.run("haMomOn();tab='moms-plan';1");
        o.kidsToday = kidsToday(X.A).replace(BTN, ""); o.dadToday = X.Dd.run("mdCardKidsToday(mdTodayName(),true,true,false)").replace(BTN, "");
        o.pops = {}; ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => ["morning", "afternoon", "chores", "evening", "stars"].forEach(s => { o.pops[k + s] = X.A.run("__pop='';boardStatPop('" + k + "','" + s + "',mdTodayName());__pop"); }));
        o.lists = {}; ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => ["afternoon", "chores", "evening"].forEach(s => { o.lists[k + s] = X.B.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML('" + s + "','" + k + "'); } finally{ day=d0; } })()"); }));
        const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
        o.momsDay = page(X.A, "renderMomsPlan").replace(BTN, ""); o.dadsDay = page(X.Dd, "renderDadsDay").replace(BTN, ""); X.B.run("kcKid='kid_a';1"); o.corner = page(X.B, "renderKidsCorner");
        o.log = X.A.run("chSettingsClickoffLogHTML()"); o.check = X.A.run("mdCardCheckLog()");
        o.bank = X.A.run("JSON.stringify(ROSTER.map(function(k){ return [bankBalance(k),bankLedger(k).length]; }))");
        return o; };
      const a = scr(w.__dev), b = scr(BW.__dev); S.lastScr = a; const diff = Object.keys(a).filter(k => J(a[k]) !== J(b[k]));
      S.screens.push([n, diff, diff.length ? J(a[diff[0]]).slice(0, 300) + " ≠ " + J(b[diff[0]]).slice(0, 300) : ""]);
      S.dbSame.push([n, J(w.db.tree.root) === J(BW.w.db.tree.root), w.db.log.length === BW.w.db.log.length]);
    }
  }
}

// ── A ──
console.log("\n── A · the 📒 button: Mom mode and Dad's own link only ──");
{ const mom = kidsToday(A), dad = Dd.run("mdCardKidsToday(mdTodayName(),true,true,false)"), kid = kidsToday(B), kio = kidsToday(Kk), off = kidsToday(Mo);
  ok("Mom's Day ▸ Kids today: one 📒 Ledger in the header (pushed right, as the header's own button is)", (mom.match(BTN) || []).length === 1 && mom.indexOf('Kids today<button onclick="ledgerOpen()" style="margin-left:auto;') > 0, mom.slice(0, 600));
  ok("Dad's own link (Dad's Day): the same one button", (dad.match(BTN) || []).length === 1);
  ok("a kid's device, a kitchen kiosk and Mom's device out of Mom mode: no button", !/ledgerOpen/.test(kid) && !/ledgerOpen/.test(kio) && !/ledgerOpen/.test(off));
  A.run("mpSetDay('tuesday');1"); const other = kidsToday(A); A.run("mpSetDay(_todayDay);1");
  ok("on another day's chip the button follows \"↩ back to today\" (margin 6px, not a second auto)", /↩ back to today<\/button><button onclick="ledgerOpen\(\)" style="margin-left:6px;/.test(other));
  ok("a tap on a kid's device (or the kiosk) opens nothing and fetches nothing", (() => { for (const d of [B, Kk, Mo]) { d.run("__pop='';__tags=[];ledgerOpen();1"); if (d.run("__pop") || d.run("__tags.length")) return false; } return true; })());
}

// ── B ──
console.log("\n── B · the first tap fetches house.js once, behind the loading line ──");
{ const { w: w2, A: A2, Dd: D2 } = await mkWorld(IDX); await go(w2, 10, 18);
  for (const [nm, d] of [["Mom", A2], ["Dad's link", D2]]) {
    watch(d); const m = w2.mark();
    const t0 = JSON.parse(d.run("__pop='';__tags=[];JSON.stringify({ready:haLazyReady('house'),fn:typeof lgShow})"));
    d.run("ledgerOpen();1"); const mid = d.run("JSON.stringify({pop:__pop,tags:__tags.map(function(t){ return t.src; })})"), M = JSON.parse(mid);
    ok(nm + " · before: house.js not there; the tap shows \"⏳ Loading the ledger…\" and asks for house.js (one <script>)", !t0.ready && t0.fn === "undefined" && /⏳ Loading the ledger…/.test(M.pop) && J(M.tags) === J(["house.js"]), [t0, M.tags]);
    d.run(HJS); d.run("__tags[0].onload();1"); for (let i = 0; i < 4; i++) { await new Promise(r => setImmediate(r)); await w2.flush(); }
    const h1 = d.run("__pop");
    ok(nm + " · when it lands the ledger draws in its place (📒 Ledger, the kid chips, today)", /📒 Ledger/.test(h1) && /lgGo\('kid_b'\)/.test(h1) && /Today:<\/b> earned/.test(h1), txt(h1).slice(0, 200));
    d.run("lgClose();__pop='';__tags=[];ledgerOpen();1");
    ok(nm + " · the second tap: drawn at once, no <script>", d.run("__tags.length") === 0 && /📒 Ledger/.test(d.run("__pop")));
    const s = seen(d);
    ok(nm + " · through both taps: no database read or write (0 refs), nothing written to the database", s.refs.length === 0 && w2.since(m).length === 0, [s.refs.slice(0, 5), w2.since(m).slice(0, 3)]);
  }
}

// ── C ──
console.log("\n── C · Thursday 11/26 for kid_a: every kind of row, the top line worked by hand ──");
const T = S.days[10], th = T.html, X = T.x;
{ const r = n => rowT(th, n);
  ok("the top line: \"Today: earned 27 ⭐ · fell short 4 ⭐ · 3 not done yet · ⏸ 3 ⭐ waiting for your ✓\" (10 laundry + 6 vacuum + 2 bed + 5 den + 4 bonus; 10 − 6; table, dust, clothes; the plants)", top(th) === "Today: earned 27 ⭐ · fell short 4 ⭐ · 3 not done yet · ⏸ 3 ⭐ waiting for your ✓", top(th));
  ok("…earned 27 = the bank lines kid_a got on Thursday (src earn, this week, thursday, not held); held 3 = the held line", X.earned === 27 && T.bank.kid_a.paid === 27 && T.bank.kid_a.held === 3 && X.held === 3, [X.earned, T.bank.kid_a]);
  ok("✅ done on its day, with the time and what it paid: \"✅ 🛏 Make the bed +2 ⭐ <time>\" (and L5's ↩ Send back)", /^✅ 🛏 Make the bed \+2 ⭐ \d{1,2}:\d\d [AP]M ↩ Send back$/.test(r("Make the bed")), r("Make the bed"));
  ok("✅ done late, for less: \"✅ 🧹 Vacuum the den paid 6 of 10 ⭐ · due Tue +6 ⭐ <time>\"", /^✅ 🧹 Vacuum the den paid 6 of 10 ⭐ · due Tue \+6 ⭐ /.test(r("Vacuum the den")), r("Vacuum the den"));
  ok("⏳ in its wait: \"⏳ 🪶 Dust the shelves still on Kid A's list from Wed · pays 8 of 10 ⭐ today\" (and the lists say 1 day: mdLateDays)", r("Dust the shelves") === "⏳ 🪶 Dust the shelves still on Kid A's list from Wed · pays 8 of 10 ⭐ today" && T.raw["Dust the shelves"] === 1, r("Dust the shelves"));
  ok("○ not done yet (today): \"○ 🍽 Wipe the table not done yet 2 ⭐\" and \"○ 👕 Lay out clothes not done yet\"", r("Wipe the table") === "○ 🍽 Wipe the table not done yet 2 ⭐" && r("Lay out clothes") === "○ 👕 Lay out clothes not done yet", [r("Wipe the table"), r("Lay out clothes")]);
  ok("➖ excused, a line only: \"➖ 🐟 Feed the fish excused (✕ today)\"; 🌅 \"🌅 🍂 Rake the leaves sent to tomorrow morning\"", r("Feed the fish") === "➖ 🐟 Feed the fish excused (✕ today)" && r("Rake the leaves") === "🌅 🍂 Rake the leaves sent to tomorrow morning", [r("Feed the fish"), r("Rake the leaves")]);
  ok("⏸ held pay, a line only: \"⏸ 🪴 Water the plants waiting for your ✓ · 3 ⭐ <time>\"", /^⏸ 🪴 Water the plants waiting for your ✓ · 3 ⭐ \d/.test(r("Water the plants")), r("Water the plants"));
  ok("the 🏁 list bonus its own row under ☀️ Afternoon: \"✅ 🏁 List complete bonus +4 ⭐\"", /^✅ 🏁 List complete bonus \+4 ⭐/.test(r("List complete bonus")) && txt(th).indexOf("☀️ Afternoon 2 of 2") >= 0 && txt(th).indexOf("List complete bonus") > txt(th).indexOf("☀️ Afternoon"), r("List complete bonus"));
  ok("the laundry Start row like any other row: \"✅ 👕 Start your laundry: Kid A's clothes +10 ⭐ <time>\" under 🌅 Morning (2 of 2) (and L5's ↩ Send back)", /^✅ \S+ Start your laundry: Kid A's clothes \+10 ⭐ \d{1,2}:\d\d [AP]M ↩ Send back$/.test(r("Start your laundry")) && txt(th).indexOf("🌅 Morning 2 of 2") >= 0, r("Start your laundry"));
  ok("gone from the list (the baseboards, due Mon, wait 2 days): \"Gone from Kid A's list this morning\" · \"✖ 🧽 Wipe the baseboards due Mon, not done in time\"", txt(th).indexOf("Gone from Kid A's list this morning ✖ 🧽 Wipe the baseboards due Mon, not done in time") >= 0, txt(th).slice(-300));
  ok("…and it is not on the lists (the lists' rule: rtLateDays 0) and its \"— not done\" was filed today", T.raw["Wipe the baseboards"] === 0 && T.misses.some(m => /Wipe the baseboards — not done/.test(m)));
  ok("each list with its count: 🧹 Chores 2 of 4 (bed, vacuum ✅ · table ○, dust ⏳; fish ➖ and leaves 🌅 are lines), 🌙 Evening 0 of 1", txt(th).indexOf("🧹 Chores 2 of 4") >= 0 && txt(th).indexOf("🌙 Evening 0 of 1") >= 0);
  // each row's stars = what its check-off stored (the bank line it wrote): name → amount
  const paidRows = X.lists.flatMap(L => L.rows).filter(r => r.pts).map(r => [r.nm.replace(/^🌅 /, ""), r.pts]).sort(), lines = T.bank.kid_a.lines.map(([n, a]) => [String(n).replace(/^🏁 Afternoon list complete$/, "🏁 List complete bonus"), a]).sort();
  ok("each ✅ row's stars = its own bank line (the amount the check-off stored), one for one", J(paidRows) === J(lines), [paidRows, lines]);
  ok("never \"drop\" / \"wait\" in a row's words; \"late\" only on the 3-a-week row", !/\bdrop|\bwait(?!ing for your)/i.test(txt(th)) && !/ late/.test(rowsH(th).filter(x => !/Empty the trash/.test(x)).join("|")));
  ok("no button, switch, ⚙ or disabled placeholder on a row (L5's ↩ Send back only on a ticked row; L4's ⚙ is only in the header); L2's ⭐ Give stars back only on the vacuum's late tick; L3's ➖ Excuse on each not-done row (the table, the clothes, the dust ⏳, the baseboards gone) and Undo on the excused fish, nowhere else", rowsH(th).every(x => !/⚙/.test(x) && (!/↩ Send/.test(x) || /^[✅⏸]/.test(x)) && (!/⭐ Give/.test(x) || /Vacuum the den paid 6 of 10/.test(x))) && rowsH(th).filter(x => /⭐ Give/.test(x)).length === 1 && J(String(th).split('<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;').slice(1).map(r => r.split("</div>")[0]).map(r => (/lgExcuse\(/.test(r) ? "X " : /lgExcuseUndo\(/.test(r) ? "U " : "") + (/Wipe the table|Lay out clothes|Dust the shelves|Wipe the baseboards|Feed the fish/.exec(r) || [""])[0]).filter(x => /^[XU] /.test(x) || /^(Wipe the table|Lay out clothes|Dust the shelves|Wipe the baseboards|Feed the fish)$/.test(x)).sort()) === J(["U Feed the fish", "X Dust the shelves", "X Lay out clothes", "X Wipe the baseboards", "X Wipe the table"]) && (th.match(/➖ Excuse<\/button>/g) || []).length === 4 && !/<button[^>]*disabled[^>]*>(?!‹|›)/.test(th) && !/⚙/.test(th.replace(/<button onclick="lgRulesToggle\(\)"[^>]*>⚙<\/button>/, "").replace(" To change the star rules, tap ⚙.", "")));   // L4: the ⚙ only in the header (and the first-minute card's sentence)
  ok("held pay on kid_b (Mom checks before pay): \"⏸ 🧺 Sweep the porch waiting for your ✓ · 6 ⭐\", earned 0, the bank's held 6", T.x_kid_b.held === 6 && T.x_kid_b.earned === 0 && T.bank.kid_b.held === 6);
  { const F = S.days[11], r = F.x_kid_b.lists.flatMap(L => L.rows).find(x => /Sweep the porch/.test(x.nm)) || {};
    ok("Mom's ✗ on a held claim (kid_b's porch, Friday): \"✅ 🧺 Sweep the porch not paid (your ✗ on its stars)\", no stars, nothing held; = the bank (0 paid, 0 held)", r.ic === "✅" && r.note === "not paid (your ✗ on its stars)" && !r.pts && !r.held && F.x_kid_b.earned === 0 && F.x_kid_b.held === 0 && F.bank.kid_b.paid === 0 && F.bank.kid_b.held === 0, [r, F.bank.kid_b]); }
  ok("kid_c: \"🏁 List complete bonus +2\" under Chores and \"🏆 Whole day complete +3\" as its own row; earned 8 = the bank's 8", T.x_kid_c.earned === 8 && T.bank.kid_c.paid === 8 && T.x_kid_c.lists.some(L => L.slot === "day" && L.rows[0].pts === 3), T.x_kid_c);
}

// ── D ──
console.log("\n── D · every day: the top line = the bank lines of that day; This week = the seven days added up ──");
{ const bad = [];
  for (let n = 6; n <= 14; n++) { const D = S.days[n]; ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => { const x = D["x_" + k]; if (x.earned !== D.bank[k].paid || x.held !== D.bank[k].held) bad.push([n, k, x.earned, x.held, D.bank[k]]); }); }
  ok("Sun 11/22 … Mon 11/30, four kids: earned = the day's bank lines, held = the held lines, every day (" + 9 * 4 + " days)", bad.length === 0, bad);
  const Sa = S.days[12], sum = f => Sa.weekX.reduce((s, x) => s + (x[f] || 0), 0), wt = top(Sa.week);
  ok("Saturday 11/28, This week: earned / fell short / not done / held = Sun … Sat added up (" + [sum("earned"), sum("short"), sum("open"), sum("held")].join(" / ") + ")", wt === "This week: earned " + sum("earned") + " ⭐ · fell short " + sum("short") + " ⭐ · " + sum("open") + " not done yet · ⏸ " + sum("held") + " ⭐ waiting for your ✓", [wt, sum("earned"), sum("short"), sum("open"), sum("held")]);
  ok("…by hand: fell short 4 (the vacuum) + 1 (the trash's Monday turn) = 5", sum("short") === 5, sum("short"));
  ok("…every day under its date, Sunday first, today last", /Sun, Nov 22[\s\S]*Mon, Nov 23[\s\S]*Fri, Nov 27[\s\S]*Today/.test(txt(Sa.week)) || /Sun Nov 22[\s\S]*Mon Nov 23[\s\S]*Fri Nov 27[\s\S]*Today/.test(txt(Sa.week)), txt(Sa.week).slice(0, 300));
  const tu = rowT(LG(A, "lgGo('kid_a',-6,0)"), "Empty the trash");   // A is on Mon 11/30: −6 = Tue 11/24
  ok("the 3-a-week trash, Monday's turn ticked Tuesday: \"✅ … paid 4 of 5 ⭐ · due Mon · 1 day late +4 ⭐\"", /^✅ 🗑 Empty the trash paid 4 of 5 ⭐ · due Mon · 1 day late \+4 ⭐/.test(tu), tu);
  const sat = S.days[12].html;
  ok("…Friday's turn on Saturday (today): \"⏳ 🗑 Empty the trash 1 day late · pays 4 of 5 ⭐ today\" (the lists' own count, as the lists say it)", /^⏳ 🗑 Empty the trash 1 day late · pays 4 of 5 ⭐ today/.test(rowT(sat, "Empty the trash")) && S.days[12].raw["Empty the trash"] === 1, rowT(sat, "Empty the trash"));
}

// ── E ──
console.log("\n── E · a missed turn's fate agrees with the lists' own rule, day by day ──");
{ const bad = [];
  for (let n = 6; n <= 14; n++) { const D = S.days[n], wait = {}, goneToday = {};
    D.x.lists.forEach(L => L.rows.forEach(r => { if (r.ic === "⏳") wait[r.nm.replace(/^\S+ /, "")] = 1; }));
    D.x.gone.forEach(r => { goneToday[r.nm.replace(/^\S+ /, "")] = 1; });
    Object.entries(D.raw).forEach(([lab, nl]) => { if (!!wait[lab] !== (nl > 0)) bad.push([n, lab, "wait", nl, !!wait[lab]]); });
    const filed = D.misses.filter(m => { const at = +m.split("/").pop(); return at >= dOf(n).getTime() && at < dOf(n + 1).getTime(); }).map(m => m.split("/")[2].replace(/ — not done$/, ""));
    Object.keys(goneToday).forEach(l => { if (filed.indexOf(l) < 0) bad.push([n, l, "gone, no line filed today"]); });
    filed.forEach(l => { if (!goneToday[l]) bad.push([n, l, "line filed, not gone in the ledger"]); }); }
  ok("Sun 11/22 … Mon 11/30: ⏳ exactly on the rows the lists carry (mdLateDays > 0), ✖ gone exactly on the day the list filed its \"— not done\"", bad.length === 0, bad);
  const fr = S.days[11].xs[0];   // Thu seen from Fri
  const du = (S.days[12].xs[2].lists.flatMap(L => L.rows).find(r => /Dust the shelves/.test(r.nm)) || {}).note;
  ok("Wednesday's dust seen later: \"not done · gone from Kid A's list Sat\"; Thursday from Friday keeps \"🌅 … done the next morning (Fri)\"", du === "not done · gone from Kid A's list Sat" && fr.lists.flatMap(L => L.rows).some(r => /Rake the leaves/.test(r.nm) && /done the next morning \(Fri\)/.test(r.note)), [du]);
  const tueSeen = (S.days[11].xs[2].lists.flatMap(L => L.rows).find(r => /Vacuum the den/.test(r.nm)) || {}).note;
  const bedW = rowT(S.days[10].html.length ? LG(A, "lgGo('kid_a',-5,0)") : "", "Make the bed");   // A is on Mon 11/30: −5 = Wed 11/25
  ok("a daily row not done on a past day: \"✖ 🛏 Make the bed not done 2 ⭐\" (Wed 11/25; a daily row never waits)", bedW === "✖ 🛏 Make the bed not done 2 ⭐", bedW);
  ok("Tuesday's vacuum seen from Friday: \"not done · done Thu, late (see that day)\" (its stars on Thursday, never twice)", tueSeen === "not done · done Thu, late (see that day)" && !(S.days[11].xs[2].lists.flatMap(L => L.rows).find(r => /Vacuum the den/.test(r.nm)) || {}).pts, tueSeen);
  const fri = S.days[11].x.lists.find(L => L.slot === "morning");
  ok("Friday morning: the carried leaves \"✅ 🌅 🍂 Rake the leaves from Thu Chores\" +8, counted on Friday (= Friday's bank line)", fri && fri.rows.some(r => /🌅 🍂 Rake the leaves/.test(r.nm) && r.pts === 8 && /from Thu Chores/.test(r.note)) && S.days[11].bank.kid_a.lines.some(l => /Rake the leaves/.test(l[0]) && l[1] === 8), fri);
}

// ── K ──
console.log("\n── K · a Morning row is never carried: not done is just not done ──");
{ const all = (x) => x.lists.flatMap(L => L.rows), rab = x => all(x).filter(r => /Feed the rabbit/.test(r.nm)), Tu = S.days[8];
  ok("Tue 11/24: the rabbit (Mon Wed Fri Morning row, missed Monday) is not on the kid's Morning list (morningDueIdx: Brush teeth only; the list reads \"Morning 1/1\"), though rtLateDays would say 1 (" + Tu.mraw + ")", J(Tu.kidMorningDue) === J(["Brush teeth"]) && /Morning 1\/1/.test(txt(Tu.kidMorning)) && !/Feed the rabbit/.test(Tu.kidMorning) && Tu.mraw === 1, [Tu.kidMorningDue, txt(Tu.kidMorning).slice(0, 80), Tu.mraw]);
  ok("…and not in the ledger on Tuesday: no ⏳, no \"still on the list\", no \"pays\", no \"late\" row for it", rab(Tu.x).length === 0 && !/Feed the rabbit/.test(txt(Tu.html)), rab(Tu.x));
  const mon = rab(S.days[10].xs[2])[0] || {};   // Mon 11/23 seen from Thu 11/26
  ok("its own day, seen later: \"✖ 🐇 Feed the rabbit not done\", 15 ⭐ wanted, no \"gone from …\" tail", mon.ic === "✖" && mon.note === "not done" && mon.want === 15 && rowT(LG(A, "lgGo('kid_a',-7,0)"), "Feed the rabbit") === "✖ 🐇 Feed the rabbit not done 15 ⭐", [mon, rowT(LG(A, "lgGo('kid_a',-7,0)"), "Feed the rabbit")]);
  ok("…never in a \"Gone from the list\" block, on any day Sun 11/22 … Mon 11/30", [6, 7, 8, 9, 10, 11, 12, 13, 14].every(n => !S.days[n].x.gone.some(r => /Feed the rabbit/.test(r.nm)) && !S.days[n].xs.some(x => x.gone && x.gone.some(r => /Feed the rabbit/.test(r.nm)))));
  const we = rab(S.days[10].xs[0])[0] || {}, wedBank = S.days[9].bank.kid_a.lines.filter(l => /Feed the rabbit/.test(l[0]));
  ok("its next due day (Wed 11/25) ticked: pays in full and shows in full, \"✅ 🐇 Feed the rabbit +15 ⭐\" (= Wednesday's bank line 15)", we.ic === "✅" && we.pts === 15 && !we.note && !we.sh && J(wedBank) === J([["🐇 Feed the rabbit", 15]]), [we, wedBank]);
  ok("…This week's \"fell short\" (Sat) does not count it: no Morning row falls short on any day of the week", S.days[12].weekX.every(x => !x.lists || x.lists.filter(L => L.slot === "morning").every(L => L.rows.every(r => !r.sh && r.ic !== "⏳"))));
}

// ── F ──
console.log("\n── F · across Sunday's week change; the empty day; the day not on this device ──");
{ const Su = S.days[13];
  ok("Sunday 11/29: yesterday = Saturday 11/28, read from last week's check-offs (prevSlState): the same rows Saturday showed as today, \"not done yet\" now \"not done\"", (() => { const y = Su.xs[0], s = S.days[12].x; return y.D.prev === true && y.D.dn === "saturday" && y.earned === s.earned && y.short === s.short && J(y.lists.map(L => L.rows.map(r => r.nm))) === J(s.lists.map(L => L.rows.map(r => r.nm)).map((a, i) => a.filter(nm => !(s.lists[i].rows.find(r => r.nm === nm) || {}).ic || (s.lists[i].rows.find(r => r.nm === nm).ic !== "⏳")))); })(), [Su.xs[0].earned, S.days[12].x.earned]);
  ok("…the trash's Friday turn on Sunday: still on the list, 2 days late, pays 3 of 5 (the lists' count across the week change)", Su.x.lists.flatMap(L => L.rows).some(r => /Empty the trash/.test(r.nm) && r.note === "2 days late · pays 3 of 5 ⭐ today") && Su.raw["Empty the trash"] === 2);
  const Mo30 = S.days[14];
  ok("Monday 11/30: the trash gone this morning (its next day came), its line filed under last week's Friday", Mo30.x.gone.some(r => /Empty the trash/.test(r.nm) && r.note === "due Fri, not done in time") && Mo30.misses.some(m => /friday\/Empty the trash — not done/.test(m)), Mo30.x.gone);
  ok("…last week's Thursday 11/26 seen from Monday 11/30 = Thursday as it was that night (earned 27, fell short 4, held 3)", (() => { const t = Mo30.xs[3]; return t.D.prev && t.D.dn === "thursday" && t.earned === 27 && t.short === 4 && t.held === 3; })(), [Mo30.xs[3].D, Mo30.xs[3].earned]);
  ok("…the week before the blank slate (Thu 11/19, seen from Thu 11/26): the vacuum ticked late in full, \"✅ 🧹 Vacuum the den done late · due Tue +10\"", (S.days[10].xs[6].lists.flatMap(L => L.rows).find(r => /Vacuum the den/.test(r.nm)) || {}).note === "done late · due Tue" && (S.days[10].xs[6].lists.flatMap(L => L.rows).find(r => /Vacuum the den/.test(r.nm)) || {}).pts === 10 && S.days[10].xs[6].D.prev);
  // last week not yet on this device: a device that has not read it (the lists' read not landed) — the ledger says so and reads nothing
  watch(A); const m = w.mark(), keep = A.run("JSON.stringify([prevSlState?1:0,_prevSlWk])");
  A.run("globalThis.__ps=[prevSlState,_prevSlWk];prevSlState=null;_prevSlWk=null;1");
  const ny = LG(A, "lgGo('kid_a',-2,0)"), nyW = LG(A, "lgGo('kid_a',-2,1)"), nyT = LG(A, "lgGo('kid_a',0,0)"), s1 = seen(A), still = A.run("JSON.stringify([prevSlState,_prevSlWk])");
  ok("last week's check-offs not yet read on this device: yesterday says \"Last week's check-offs are not on this device yet…\", never an empty day", /Last week's check-offs are not on this device yet/.test(txt(ny)) && !/Nothing was on/.test(txt(ny)) && /Last week's check-offs are not on this device yet/.test(txt(nyW)), txt(ny).slice(0, 300));
  ok("…and opening it (that day, last week, and today, whose rows would ask about last week) read nothing (no ref, prevSlState still not there)", /Today:<\/b> earned/.test(nyT) && s1.refs.length === 0 && still === "[null,null]" && w.since(m).length === 0, [s1.refs, still]);
  A.run("prevSlState=__ps[0];_prevSlWk=__ps[1];1"); void keep;
  const far = LG(A, "lgGo('kid_a',-99,0)");
  ok("the day before last week's Sunday: \"Only this week and last week are on this device.\", and ‹ stops there", /Only this week and last week are on this device\./.test(txt(far)) && /<button disabled style="[^"]*">‹<\/button>/.test(far), txt(far).slice(0, 200));
  const emp = LG(A, "lgGo('kid_d',0,0)");
  ok("the empty day: \"Nothing was on Kid D's lists this day.\" with earned 0", /Today: earned 0 ⭐ Nothing was on Kid D's lists this day\./.test(txt(emp).replace(/📒 This is everything[^.]*\.[^]*?(?=Today:)/, "")), txt(emp).slice(-160));
}

// ── G ──
console.log("\n── G · chips, arrows, kid chips move the view and write nothing ──");
{ watch(A); const m = w.mark(), s0 = appState(A); A.run("lgShow();1");
  const st = () => JSON.parse(A.run("JSON.stringify([lgKid,lgOff,lgWeek])")), steps = [];
  const taps = ["lgGo('kid_c')", "lgGo('',lgOff-1)", "lgGo('',lgOff-1)", "lgGo('',lgOff+1)", "lgGo('',-1,0)", "lgGo('',0,0)", "lgGo('',0,1)", "lgGo('',-(lgNow()+2))", "lgGo('',0)", "lgGo('kid_b')", "lgGo('',0,0)"];
  taps.forEach(t => { const h = LG(A, t); steps.push([t, st(), (/<b style="font-size:13px;min-width:92px;text-align:center">([^<]*)<\/b>/.exec(h) || [])[1]]); });
  ok("the taps move the view: kid chip → kid_c; ‹ ‹ › → two days back, one forward; Yesterday; Today; This week; ‹ → last week; › → this week; kid_b", J(steps.map(s => s[1])) === J([["kid_c", 0, false], ["kid_c", -1, false], ["kid_c", -2, false], ["kid_c", -1, false], ["kid_c", -1, false], ["kid_c", 0, false], ["kid_c", 0, true], ["kid_c", -2, true], ["kid_c", 0, true], ["kid_b", 0, true], ["kid_b", 0, false]]) && steps[6][2] === "This week" && steps[7][2] === "Last week", steps);
  const s = seen(A);
  ok("…no database ref at all (no read, no write), no localStorage key, no write in the database's log, the app's own state unchanged", s.refs.length === 0 && s.ls.length === 0 && w.since(m).length === 0 && appState(A) === s0, [s.refs.slice(0, 4), s.ls, w.since(m).slice(0, 3)]);
  A.run("lgClose();1");
  ok("the whole replay: the database the same as the app before's (every write the same), on all " + S.dbSame.length + " days", S.dbSame.length === 9 && S.dbSame.every(x => x[1] && x[2]), S.dbSame.filter(x => !(x[1] && x[2])));
}

// ── H ──
console.log("\n── H · a chore's name opens its card for Mom; nothing for Dad ──");
{ A.run("haMomOn();tab='moms-plan';1"); const h = LG(A, "lgGo('kid_a',0,0)"), m = /<span onclick="lgClose\(\);hcGo\('([^']+)'\)"[^>]*>([^<]*)<\/span>/.exec(h);
  ok("Mom: a row's chore name is a tap → hcGo(its chore id) (Make the bed → a_bed)", !!m && h.indexOf("hcGo('a_bed')\" style=\"cursor:pointer;text-decoration:underline dotted #94a3b8\">🛏 Make the bed</span>") > 0, m && m.slice(1));
  const wm = w.mark(); A.run("lgClose();hcGo('a_bed');1");
  loadH(B); B.run("__pop='';lgShow();1"); const kb = B.run("__pop"), wb = w.mark(), sv0 = B.run("JSON.stringify([typeof hcGoId!=='undefined'?hcGoId:'',mpSubView])"); B.run("hcGo('a_bed');1");
  ok("a kid's device: the ledger opens nothing even with house.js there, and the chore-name tap does nothing", kb === "" && B.run("JSON.stringify([typeof hcGoId!=='undefined'?hcGoId:'',mpSubView])") === sv0 && w.since(wb).length === 0, [kb.slice(0, 80), sv0]);
  ok("…the tap goes to the Household page on that card, writing nothing", (A.run("hcGoId") === "a_bed" || A.run("hcId") === "a_bed") && A.run("mpSubView") === "house" && w.since(wm).length === 0, [A.run("hcGoId"), A.run("hcId"), A.run("mpSubView"), w.since(wm).length]);
  loadH(Dd); const hd = LG(Dd, "lgShow()");
  ok("Dad's link: the same ledger, no chore name is a tap (the chore card is Mom's)", /📒 Ledger/.test(hd) && !/hcGo\(/.test(hd) && /Make the bed/.test(hd));
}

// ── I ──
console.log("\n── I · the first-minute card: once per device, one local flag ──");
{ const { w: w3, A: A3 } = await mkWorld(IDX); await go(w3, 10, 18); loadH(A3); watch(A3); const m = w3.mark();
  const h1 = LG(A3, "lgShow()");
  ok("the first time: the card above the rows (\"📒 This is everything on Kid A's lists today.\" · ✅ ○ ⏳ ✖ · the line on top · tap a name)", /📒 This is everything on Kid A's lists today\. ✅ done · ○ not done yet · ⏳ still on the list from an earlier day \(it pays a little less each day\) · ✖ gone from the list \(not done in time\)\. The line on top adds up the stars\. To change how a chore works, tap its name\./.test(txt(h1)) && h1.indexOf("lgHelloClose()") > 0 && h1.indexOf("📒 This is everything") < h1.indexOf("Today:</b>"), txt(h1).slice(0, 400));
  const h2 = LG(A3, "lgHelloClose()"), s = seen(A3);
  ok("✕ closes it; the only thing stored is localStorage \"ha_ledger_hello\" = \"1\" on this device, nothing in the database", !/This is everything/.test(h2) && s.ls.length === 1 && /^set (\w+:)?ha_ledger_hello$/.test(s.ls[0]) && A3.run("HA_LS.getItem('ha_ledger_hello')") === "1" && s.refs.length === 0 && w3.since(m).length === 0, s);
  A3.run("lgClose();1"); ok("…closed for good on this device (opened again: no card)", !/This is everything/.test(LG(A3, "lgShow()")));
  const D3 = w3.boot("D3", "devD3", { mom: true }); await w3.flush(); D3.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };tab='moms-plan';1"); loadH(D3);
  ok("…another device still shows it once (the flag is the device's, not the family's)", /This is everything/.test(LG(D3, "lgShow()")));
}

// ── J ──
console.log("\n── J · every other screen = the app before (this tree without the ledger), byte for byte, but the button ──");
{
  ok("Sun 11/22 … Mon 11/30, at 6 PM each day: Mom's and Dad's Kids today (button taken out), every kid's pop-up (morning … stars), every kid's lists, the whole Mom's Day and Dad's Day pages, Kids' Corner, the Click-off Log, 🧾 Today's check-offs, every Star Bank = the app before", S.screens.every(x => x[1].length === 0), S.screens.filter(x => x[1].length));
  ok("the Kids today card's only change is the button: taking it out gives the app before's HTML", S.screens.length === 9);
  const L = S.lastScr; ok("(those are real pages: Mom's Day " + L.momsDay.length + " chars with Kids today, Dad's Day " + L.dadsDay.length + ", Kids' Corner " + L.corner.length + ", none threw)", L.momsDay.length > 5000 && /Kids today/.test(L.momsDay) && L.dadsDay.length > 3000 && /Kids today/.test(L.dadsDay) && L.corner.length > 1000 && ![L.momsDay, L.dadsDay, L.corner].some(x => /^threw/.test(x)), [L.momsDay.slice(0, 80), L.dadsDay.slice(0, 80), L.corner.slice(0, 80)]);
}

// draw time: a week of a 4-kid family, every kid's This week
{ const { w: w4, A: A4 } = await mkWorld(IDX); await go(w4, 12, 18); A4.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };1"); loadH(A4);
  const t0 = process.hrtime.bigint(); LG(A4, "lgShow()"); const first = Number(process.hrtime.bigint() - t0) / 1e6;
  const t1 = process.hrtime.bigint(); for (const k of ["kid_a", "kid_b", "kid_c", "kid_d"]) LG(A4, "lgGo('" + k + "',0,1)"); const ms = Number(process.hrtime.bigint() - t1) / 1e6;
  S.notes.draw = { first, week4: ms }; console.log("\n(draw time on this machine, Sat 11/28: the first open " + first.toFixed(1) + " ms; This week Sun … Sat for all four kids " + ms.toFixed(1) + " ms in all, ≈ " + (ms / 28).toFixed(2) + " ms a kid-day)"); }

if (process.env.LEDGER_DUMP) fs.writeFileSync(process.env.LEDGER_DUMP, J(S.dump));
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
