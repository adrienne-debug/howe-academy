/*
 * test_ledger_doagain.js — ↩ Send back's third answer, "↩ Do it again" (DESIGN_chore_ledger_2026-11-21 §3: "The chore is open again and
 * what it paid comes off. The kid's row says "↩ Do this again" with your note. The redo pays 20% less"; §7; slice L6). house.js LEDGERDA
 * (inside LEDGERSB), index.html AGAIN. The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a, kid_b),
 * the clock moved day by day, Mon 11/30 → Thu 12/3:
 *   kid_a  🌅 Make the bed (daily 5) · Start your laundry (the line's Thursday load) · 🧹 Feed the cat (daily 10) · Vacuum the den (Mon 10)
 *          · Dust the shelves (Tue 10) · Wipe the table (Mon + Wed 10) · Hang the towel (daily 1) · Shoes by the door (daily 0)
 *          · Socks in the basket (daily 10) · Unload the dishwasher (daily 10) · ☀️ Water the plants (daily 5)
 * Sections: R the core rules (re-run by every planted fault) · X the extra checks on Thursday (the ask, the writes = Just a mistake's + one
 * line, the Click-off Log, the ledger, a second Do it again, ⏸, 0 ⭐, ➖ Excuse, the morning and laundry rows, Dad, a kid's device,
 * ?dryrun=1, two devices) · A 32 days with no "Do it again" tap (Just a mistake and Wasn't done tapped): every list, every bank, every write
 * and the whole database = the app before · M planted faults, each named by the rule it breaks.
 * "The app before" = THIS tree with L6 taken out (test_fixtures/ledger_l6_out.js; no git; each piece must match exactly once).
 * run: node test_ledger_doagain.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const L6 = require(path.join(__dirname, "test_fixtures", "ledger_l6_out.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = path.join(__dirname, "index.html"), IDXS = fs.readFileSync(IDX, "utf8"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
const tmp = (name, s) => { const t = path.join(os.tmpdir(), "ledger_da_" + process.pid + "_" + name + ".html"); fs.writeFileSync(t, s); return t; };
const BASE_IDX = tmp("before", L6.idx(IDXS)), BASE_HJS = L6.hjs(HJS);
if (/agFind|AGAIN_START/.test(fs.readFileSync(BASE_IDX, "utf8")) || /lgDa[A-Z]|LEDGERDA/.test(BASE_HJS.replace(/lgDadTip|lgDay[A-Za-z]*|lgDate/g, ""))) throw new Error("test_ledger_doagain: the app before still has L6");
console.log("(the app before: this tree with AGAIN taken out of index.html and LEDGERDA out of house.js)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "morning", cad: "daily", pts: 5, order: 0 }),
  a_cat: K({ label: "Feed the cat", emoji: "🐱", who: "kid_a", slot: "chores", cad: "daily", pts: 10, area: "animals", order: 1 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:0", pts: 10, order: 2 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 3 }),
  a_mw: K({ label: "Wipe the table", emoji: "🧽", who: "kid_a", slot: "chores", cad: "wk:0,2", pts: 10, order: 4 }),
  a_one: K({ label: "Hang the towel", emoji: "🧺", who: "kid_a", slot: "chores", cad: "daily", pts: 1, order: 5 }),
  a_zero: K({ label: "Shoes by the door", emoji: "👟", who: "kid_a", slot: "chores", cad: "daily", pts: 0, order: 6 }),
  a_sock: K({ label: "Socks in the basket", emoji: "🧦", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 7 }),
  a_dish: K({ label: "Unload the dishwasher", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 8 }),
  a_plants: K({ label: "Water the plants", emoji: "🪴", who: "kid_a", slot: "afternoon", cad: "daily", pts: 5, order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧹", who: "kid_b", slot: "chores", cad: "daily", pts: 6, order: 0 })
});
const LINE = { caps: { "0": 0, "1": 0, "2": 0, "3": 1, "4": 0, "5": 0, "6": 0 }, asOf: "2026-11-23", homeFrom: "2026-11-23" };   // one load a week, on Thursday
const CFG = () => clone(W.FX.db.config);
const dOf = n => new Date(2026, 10, 30 + n);   // n=0 Mon 11/30 … n=3 Thu 12/3
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const CAP = "globalThis.__pop='';globalThis.__toast=[];globalThis.__cf=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };gwShowToast=function(m){ __toast.push(m); };mwToast=function(m){ __toast.push(m); };confirm=function(m){ __cf.push(m); return true; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
const idxOf = (d, slot, kid, label, dn) => d.run("(function(){ const d0=day; day=" + (dn ? J(dn) : "_todayDay") + "; try{ return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label.indexOf(" + J(label) + ")===0&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; " + (slot === "morning" ? "toggleMorningStep('" + kid + "'," + i + ")" : "toggleRtStep('" + slot + "','" + kid + "'," + i + ")") + "; })()"); return i; };
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ROWSPLIT = '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;';
const rowsRaw = h => String(h).split(ROWSPLIT).slice(1).map(r => '<div ' + r);
const rowT = (h, name) => txt(rowsRaw(h).filter(r => txt(r.split(ROWSPLIT)[0]).indexOf(name) >= 0)[0] || "");
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || "")));
const WS = (w, m) => writes(w, m).map(e => e.op + " " + e.path + (e.keys ? " [" + e.keys.join(",") + "]" : ""));
const MASK = a => a.map(s => s.replace(/(\/adjustments\/)bd[0-9a-z]+/g, "$1bd*").replace(/(routineLog\/[^/ ]+\/[^/ ]+\/[^/ ]+\/)-[A-Za-z0-9_-]+/g, "$1<key>"));
const bal = (d, kid) => d.run("bankBalance(" + J(kid || "kid_a") + ")");
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, q) => { o[q] = v[q]; return o; }, {}) : v);
const ctree = w => canon(w.db.tree.root);
const ddiff = (a, b, p) => { p = p || ""; if (canon(a) === canon(b)) return []; if (!a || !b || typeof a !== "object" || typeof b !== "object") return [p + ": " + String(J(a)).slice(0, 160) + " ≠ " + String(J(b)).slice(0, 160)]; return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => ddiff(a[k], b[k], p + "/" + k)).slice(0, 8); };
// the kid's own lists, as drawn on her screen today (the same drawing Kids' Corner uses)
const kidList = (d, slot) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return " + (slot === "morning" ? "mrIndividualHTML('kid_a')" : "rtSlotHTML(" + J(slot) + ",'kid_a')") + "; } finally{ day=d0; } })()");
const kidRow = (d, slot, label) => { const h = kidList(d, slot), parts = String(h).split('<div class="mr-step'); return txt(parts.filter(p => txt(p).indexOf(label) >= 0)[0] || ""); };
const pop = (d, k) => LG(d, "lgGo('kid_a'," + (k || 0) + ",0)");

async function mkWorld(index, hjs, o) { o = o || {};
  const w = await W.world({ index, longPlan: !!o.longPlan, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } },
    tree: { config: CFG(), laundryLine: clone(LINE), settings: { spotCheck: { penalty: { on: true, pts: 100 } } } } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) d.run(CAP);
  await w.flush(); return { w, A, B, Dd, Kk, hjs };
}

// ── R: the core rules, Mon → Thu. Returns what each rule's check reads (the planted faults re-run this) ──
async function core(index, hjs) {
  const V = await mkWorld(index, hjs), { w, A, B, Kk } = V, R = {};
  await go(w, 0, 16); A.run("haMomOn();1"); loadH(A, hjs);
  const wk = A.run("activeWk()"), I = {};
  for (const l of ["Feed the cat", "Hang the towel", "Wipe the table", "Vacuum the den"]) I[l] = tick(B, "chores", "kid_a", l);
  A.run("amSend('afternoon','kid_a',_todayDay," + idxOf(A, "afternoon", "kid_a", "Water the plants") + ")"); await w.flush();
  const ref = (l, slot) => "s:" + (slot || "chores") + ":" + I[l], aj = (dn, r) => "'kid_a','" + wk + "','" + dn + "','" + r + "'";
  const sendD = (dn, r, note, d) => (d || A).run("lgSendBack(" + aj(dn, r) + ",'d'," + J(note || "") + ")");
  // R1 today's daily: −10, the kid's row says so with the note and "10 → 8 ⭐"
  let b0 = bal(A); R.r1ok = sendD("monday", ref("Feed the cat"), "Fill the water bowl too"); await w.flush(); R.r1bank = bal(A) - b0; R.r1row = kidRow(Kk, "chores", "Feed the cat");
  // R2 the redo pays 20% less
  b0 = bal(A); tick(B, "chores", "kid_a", "Feed the cat"); await w.flush(); R.r2redo = bal(A) - b0;
  // R3 a 1 ⭐ chore: the redo pays 0, never below
  b0 = bal(A); sendD("monday", ref("Hang the towel")); await w.flush(); R.r3send = bal(A) - b0; R.r3row = kidRow(Kk, "chores", "Hang the towel"); b0 = bal(A); tick(B, "chores", "kid_a", "Hang the towel"); await w.flush(); R.r3redo = bal(A) - b0;
  // R4 Undo before the redo: the database exactly as before
  let t0 = ctree(w); sendD("monday", ref("Wipe the table")); await w.flush(); R.r4line = !!w.get("routineLog/kid_a/" + wk + "/monday/ag_cstep" + I["Wipe the table"]);
  R.r4undo = A.run("lgDaUndo(" + aj("monday", ref("Wipe the table")) + ")"); await w.flush(); R.r4exact = ctree(w) === t0; R.r4diff = ddiff(JSON.parse(ctree(w)), JSON.parse(t0));
  // R5 Take stars away OFF: the redo pays in full and the row still says "↩ Do this again"
  A.run("lgRuleTake('kid_a')"); await w.flush(); sendD("monday", ref("Vacuum the den")); await w.flush(); R.r5row = kidRow(Kk, "chores", "Vacuum the den");
  b0 = bal(A); tick(B, "chores", "kid_a", "Vacuum the den"); await w.flush(); R.r5redo = bal(A) - b0; A.run("lgRuleTake('kid_a')"); await w.flush();
  // Tue: the 🌅 plants ticked on the morning list; R6 Tuesday's cat is a new turn, in full; R7 Monday's daily cannot be done again
  await go(w, 1, 8); const carry = A.run("Object.keys(amCarry.kid_a||{})[0]||''"); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(carry) + "); })()"); await w.flush();
  await go(w, 1, 16); b0 = bal(A); tick(B, "chores", "kid_a", "Feed the cat"); await w.flush(); R.r6newTurn = bal(A) - b0;
  let m = w.mark(); R.r7ret = sendD("monday", ref("Feed the cat")); await w.flush(); R.r7writes = writes(w, m).length;
  R.r7ask = txt(LG(A, "lgGo('kid_a',-1,0);lgSbAskSet('kid_a|" + wk + "|monday|" + ref("Feed the cat") + "')")); A.run("lgSbAskSet('');1");
  tick(B, "chores", "kid_a", "Dust the shelves"); await w.flush();
  // Wed: R8 Tuesday's dust (its turn is still on the list) comes back and its redo pays 8, not 6 (it falls no further than its first tick)
  await go(w, 2, 16); const dI = idxOf(A, "chores", "kid_a", "Dust the shelves", "tuesday"); b0 = bal(A);
  R.r8ok = sendD("tuesday", "s:chores:" + dI); await w.flush(); R.r8send = bal(A) - b0; R.r8row = kidRow(Kk, "chores", "Dust the shelves");
  b0 = bal(A); tick(B, "chores", "kid_a", "Dust the shelves"); await w.flush(); R.r8redo = bal(A) - b0;
  // R9 its Undo after the redo (on another day) is refused: nothing paid twice
  b0 = bal(A); m = w.mark(); R.r9undo = A.run("lgDaUndo(" + aj("tuesday", "s:chores:" + dI) + ")"); await w.flush(); R.r9bank = bal(A) - b0; R.r9writes = writes(w, m).length;
  R.r9led = rowT(pop(A, -1), "Dust the shelves");
  // R10 the 🌅 plants (ticked Tuesday morning) sent back on Wednesday: open on Wednesday's morning list, the redo pays 4
  loadH(V.Dd, hjs); V.Dd.run("dadUnlocked=true;1"); b0 = bal(A); R.r10ok = sendD("tuesday", "a:" + carry, "", V.Dd); await w.flush(); V.Dd.run("dadUnlocked=false;1"); R.r10by = (w.get("routineLog/kid_a/" + wk + "/tuesday/ag_am_" + carry) || {}).by; R.r10send = bal(A) - b0; R.r10row = kidRow(Kk, "morning", "Water the plants");
  b0 = bal(A); B.run("(function(){ day=_todayDay; amToggle('kid_a'," + J(carry) + "); })()"); await w.flush(); R.r10redo = bal(A) - b0;
  // Thu: R11 Monday's table (due again Wednesday, so a new turn has begun) cannot be done again
  await go(w, 3, 16); m = w.mark(); R.r11ret = sendD("monday", ref("Wipe the table")); await w.flush(); R.r11writes = writes(w, m).length;
  return { R, V, wk, I, carry, aj, sendD };
}
const checkCore = (R, say) => ({
  "the note and the redo's pay on the kid's row": /↩ Do this again · Mom: “Fill the water bowl too”/.test(R.r1row) && /10 → 8 ⭐/.test(R.r1row),
  "the tick's pay comes off": R.r1ok === true && R.r1bank === -10,
  "the redo pays 20% less": R.r2redo === 8,
  "never below 0": R.r3send === -1 && R.r3redo === 0 && /1 → 0 ⭐/.test(R.r3row),
  "Undo puts everything back exactly": R.r4line && R.r4undo === true && R.r4exact,
  "Take stars away off: the redo pays in full, the mark still shows": R.r5redo === 10 && /↩ Do this again/.test(R.r5row) && /\+10 ⭐/.test(R.r5row),
  "a new turn pays in full": R.r6newTurn === 10,
  "only where the kid can do it again today": R.r7ret === false && R.r7writes === 0 && !/Do it again/.test(R.r7ask) && /Wasn't done/.test(R.r7ask),
  "a late redo falls no further than its first tick": R.r8ok === true && R.r8send === -10 && /↩ Do this again/.test(R.r8row) && R.r8redo === 8,
  "no Undo after the redo (nothing paid twice)": R.r9undo === false && R.r9bank === 0 && R.r9writes === 0 && /done again/.test(R.r9led) && !/Undo/.test(R.r9led),
  "the 🌅 row comes back and its redo pays 20% less": R.r10ok === true && R.r10send === -5 && /↩ Do this again/.test(R.r10row) && /5 → 4/.test(R.r10row) && R.r10redo === 4 && R.r10by === "dad",
  "a due day since starts a new turn": R.r11ret === false && R.r11writes === 0
});


// ── E: plan rows that fell under slice E (the plan ON, its blank slate Mon 12/07; the plan's own made-up 12-chore family + three) ──
const KP = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
const FAMP = () => ({
  a_dish: KP({ label: "Dishes", emoji: "🍽", who: "kid_a", slot: "chores", cad: "daily", minutes: 10, pts: 10, order: 1 }),
  a_vac: KP({ label: "Vacuum", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", minutes: 15, pts: 15, order: 2 }),
  a_rug: KP({ label: "Shake the rug", emoji: "🧶", who: "kid_a", slot: "chores", cad: "wk:0", minutes: 5, pts: 10, order: 3 }),
  a_one: KP({ label: "Hang the towel", emoji: "🧺", who: "kid_a", slot: "chores", cad: "wk:0", minutes: 5, pts: 1, order: 4 }),
  b_sink: KP({ label: "Sink", emoji: "🚰", who: "kid_b", slot: "chores", cad: "daily", minutes: 10, pts: 10, order: 0 }),
  b_mop: KP({ label: "Mop", emoji: "🪣", who: "kid_b", slot: "chores", cad: "7d", minutes: 15, pts: 20, lastDone: "2026-11-30", order: 1 }),
  b_tub: KP({ label: "Tub", emoji: "🛁", who: "kid_b", slot: "chores", cad: "wk:1", minutes: 5, pts: 20, order: 2 }),
  c_toys: KP({ label: "Toys", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", minutes: 5, pts: 5, order: 0 })
});
const dP = n => new Date(2026, 11, 7 + n), goP = (w, n, h) => { const d = dP(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h == null ? 7 : h, 0); };
async function planE(index, hjs) {
  const w = await W.world({ index, household: { jobs: FAMP(), people: { kid_a: { school: 60, weekend: 60 }, kid_b: { school: 30, weekend: 30 }, kid_c: { school: 10, weekend: 10 }, kid_d: { school: 0, weekend: 0 }, mom: { school: 0, weekend: 0 }, dad: { school: 0, weekend: 0 } }, meta: { takeover: 1, engine: { mode: "on", on: "2026-11-30" } } }, tree: { config: CFG() } });
  const A = w.boot("A", "devA", { mom: true }), Kk = w.boot("Kk", "devK"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1"); for (const d of [A, Kk]) d.run(CAP); A.run(hjs); await w.flush();
  const R = {}, pI = (kid, id) => A.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores'," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.house===" + J(id) + "; }); } finally{ day=d0; } })()");
  const tk = (kid, id) => { const i = pI(kid, id); if (i >= 0) A.run("(function(){ day=_todayDay; _rtMomTick=true; try{ toggleRtStep('chores'," + J(kid) + "," + i + "); } finally{ _rtMomTick=false; } })()"); return i; };
  const row = (kid, label) => { const h = Kk.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML('chores'," + J(kid) + "); } finally{ day=d0; } })()"); return txt(String(h).split('<div class="mr-step').filter(x => txt(x).indexOf(label) >= 0)[0] || ""); };
  const bl = k => A.run("bankBalance(" + J(k) + ")");
  await goP(w, 0); await goP(w, 1, 16); A.run("haMomOn();1"); const wk = A.run("activeWk()"), aj = (k, dn, i) => "'" + k + "','" + wk + "','" + dn + "','s:chores:" + i + "'";
  R.mopRow0 = row("kid_b", "Mop");
  // e1: Ben's Mop (20), skipped Monday → Tuesday "20 → 16"; ticked (16), sent back, the redo
  let b0 = bl("kid_b"); const mi = tk("kid_b", "b_mop"); await w.flush(); R.mopTick = bl("kid_b") - b0;
  const t0 = ctree(w); b0 = bl("kid_b"); R.mopSend = A.run("lgSendBack(" + aj("kid_b", "tuesday", mi) + ",'d','Under the table too')"); await w.flush(); R.mopSent = bl("kid_b") - b0; R.mopRow = row("kid_b", "Mop");
  R.mopUndo = A.run("lgDaUndo(" + aj("kid_b", "tuesday", mi) + ")"); await w.flush(); R.mopExact = ctree(w) === t0; R.mopDiff = ddiff(JSON.parse(ctree(w)), JSON.parse(t0));
  A.run("lgSendBack(" + aj("kid_b", "tuesday", mi) + ",'d','')"); await w.flush(); b0 = bl("kid_b"); tk("kid_b", "b_mop"); await w.flush(); R.mopRedo = bl("kid_b") - b0;
  // e2: Kid A's towel (1), skipped Monday → Tuesday pays 0; sent back, the redo
  b0 = bl("kid_a"); const oi = tk("kid_a", "a_one"); await w.flush(); R.oneTick = bl("kid_a") - b0; A.run("lgSendBack(" + aj("kid_a", "tuesday", oi) + ",'d','')"); await w.flush(); R.oneRow = row("kid_a", "Hang the towel");
  b0 = bl("kid_a"); tk("kid_a", "a_one"); await w.flush(); R.oneRedo = bl("kid_a") - b0;
  // e3: Kid A's rug (10), skipped Monday → Tuesday "10 → 8"; ticked (8), sent back Tuesday and NOT done again; Wednesday, carried by E
  b0 = bl("kid_a"); const ri = tk("kid_a", "a_rug"); await w.flush(); R.rugTick = bl("kid_a") - b0; b0 = bl("kid_a"); A.run("lgSendBack(" + aj("kid_a", "tuesday", ri) + ",'d','Shake it outside')"); await w.flush(); R.rugSent = bl("kid_a") - b0;
  await goP(w, 2, 16); R.rugWait = clone((w.get("houseDay/2026-12-09/plan") || {}).a_rug || (w.get("houseDay/2026-12-09/wait") || {}).a_rug || null); R.rugRow = row("kid_a", "Shake the rug");
  b0 = bl("kid_a"); tk("kid_a", "a_rug"); await w.flush(); R.rugRedo = bl("kid_a") - b0;
  // e4: Tuesday's Undo after Wednesday's redo: refused, nothing written (never paid twice)
  let m = w.mark(); b0 = bl("kid_a"); R.rugUndo = A.run("lgDaUndo(" + aj("kid_a", "tuesday", ri) + ")"); await w.flush(); R.rugUndoBank = bl("kid_a") - b0; R.rugUndoW = writes(w, m).length;
  return R;
}
const checkPlan = R => ({
  "a fallen plan row's redo pays 20% less than its fallen pay": R.mopTick === 16 && R.mopSent === -16 && /↩ Do this again · Mom: “Under the table too” 20 → 13 ⭐/.test(R.mopRow) && R.mopRedo === 13,
  "never more than without the send-back": R.mopRedo <= R.mopTick && R.rugRedo <= R.rugTick && R.oneRedo <= R.oneTick,
  "never below 0 (a plan row)": R.oneTick === 0 && /1 → 0 ⭐/.test(R.oneRow) && R.oneRedo === 0,
  "a plan row's Undo is exact": R.mopUndo === true && R.mopExact,
  "a carried plan row keeps its line and falls no further": !!R.rugWait && /↩ Do this again · Mom: “Shake it outside” 10 → 6 ⭐/.test(R.rugRow) && R.rugRedo === 6,
  "no Undo after a carried redo (nothing paid twice)": R.rugUndo === false && R.rugUndoBank === 0 && R.rugUndoW === 0
});

(async () => {
// ── R ──
console.log("\n── R · the core rules (Mon → Thu) ──");
const C = await core(IDX, HJS), { R } = C, CC = checkCore(R);
ok("Mon: Do it again on today's 🐱 Feed the cat (10 ⭐) with a note: −10; Kid A's own row reads \"↩ Do this again · Mom: “Fill the water bowl too”\" and \"10 → 8 ⭐\"", CC["the tick's pay comes off"] && CC["the note and the redo's pay on the kid's row"], [R.r1bank, R.r1row]);
ok("…Kid A does it again: +8 (20% less)", CC["the redo pays 20% less"], R.r2redo);
ok("a 1 ⭐ chore: −1, the kid's row says \"1 → 0 ⭐\", and its redo pays 0 (rtFallPts(1,1) = 0: never below 0)", CC["never below 0"], [R.r3send, R.r3row, R.r3redo]);
ok("Undo before the redo: the tick, its pay and no line — the whole database byte for byte as before the tap", CC["Undo puts everything back exactly"], R.r4diff);
ok("Take stars away OFF for Kid A: the row still says \"↩ Do this again\", shows \"+10 ⭐\", and the redo pays the full 10", CC["Take stars away off: the redo pays in full, the mark still shows"], [R.r5row, R.r5redo]);
ok("Tue: Tuesday's cat is a new turn: +10 (Monday's line is not its own)", CC["a new turn pays in full"], R.r6newTurn);
ok("Tue: Monday's daily cat cannot be done again today: no \"↩ Do it again\" in its ask (Wasn't done and Just a mistake stay); the tap is refused, nothing written", CC["only where the kid can do it again today"], [R.r7ret, R.r7writes, R.r7ask.slice(0, 200)]);
ok("Wed: Tuesday's 🪶 dust (done on its day) sent back: −10, it is back on Wednesday's list with \"↩ Do this again\", and its redo pays 8, not 6 (it falls no further than its first tick, which was on time)", CC["a late redo falls no further than its first tick"], [R.r8send, R.r8row, R.r8redo]);
ok("…its Undo after the redo is refused and writes nothing (the old tick never comes back beside the new one); the ledger says \"done again\", no Undo", CC["no Undo after the redo (nothing paid twice)"], [R.r9undo, R.r9bank, R.r9led]);
ok("Wed: Dad (his code in) sends back the 🌅 plants ticked on a PAST day (Tuesday morning; DADPAST): the line by dad, −5, open on Wednesday's morning list with \"↩ Do this again\" and \"5 → 4\"; the redo pays 4", CC["the 🌅 row comes back and its redo pays 20% less"], [R.r10send, R.r10row, R.r10redo]);
ok("Thu: Monday's 🧽 table (due again Wednesday: a new turn) cannot be done again: refused, nothing written", CC["a due day since starts a new turn"], [R.r11ret, R.r11writes]);

// ── X ──
console.log("\n── X · Thursday: the ask, the writes, the record, the ledger, the other kinds of row, who may ──");
const { V, wk, sendD, aj } = C, { w, A, B, Dd, Kk } = V;
const ix = (l, slot, dn) => idxOf(A, slot || "chores", "kid_a", l, dn), rf = (l, slot) => "s:" + (slot || "chores") + ":" + ix(l, slot);
{ // the ask
  tick(B, "chores", "kid_a", "Feed the cat"); await w.flush();
  const h = LG(A, "lgGo('kid_a',0,0);lgSbAskSet('kid_a|" + wk + "|thursday|" + rf("Feed the cat") + "')"), t = rowT(h, "Feed the cat"); A.run("lgSbAskSet('');1");
  ok("the ask: ↩ Do it again first — \"It goes back on Kid A's list and its 10 ⭐ come off. Kid A sees “↩ Do this again” and your note. Done again, it pays 8 ⭐, not 10 (20% less).\" — then Wasn't done, Just a mistake, Cancel",
    /↩ Send back "Feed the cat"\? ↩ Do it again It goes back on Kid A's list and its 10 ⭐ come off\. Kid A sees “↩ Do this again” and your note\. Done again, it pays 8 ⭐, not 10 \(20% less\)\. 🚩 Wasn't done .* Just a mistake .* Cancel$/.test(t), t);
  ok("…with a note box for Kid A (80 letters at most), read by the button", /<input id="lg-da-t" maxlength="80" placeholder="A short note for Kid A \(they see it\)"/.test(h) && h.indexOf("lgSendBack('kid_a','" + wk + "','thursday','" + rf("Feed the cat") + "','d',lgDaT())") > 0);
  // Just a mistake's writes, then its Undo; then Do it again's writes: the same + one line
  A.run("try{ renderAll(); }catch(e){}"); await w.flush();   // Mom's page drawn once first (its own side effects: the day's 🔎 spot-check draw)
  const noLv = t => { const o = JSON.parse(t); Object.values(o.spotChecks || {}).forEach(x => { if (x) delete x.level; }); return canon(o); }, t0Full = ctree(w), t0 = noLv(t0Full); let m = w.mark(); A.run("lgSendBack(" + aj("thursday", rf("Feed the cat")) + ",'m')"); await w.flush(); const SPL = a => a.filter(x => !/^set spotChecks\/kid_a\/level$/.test(x)), wm = SPL(MASK(WS(w, m)));   // the 🔎 spot check's level, which Mom's page reckons again after the first un-tick of the day (Just a mistake's, here)
  A.run("lgSbUndo(" + aj("thursday", rf("Feed the cat")) + ")"); await w.flush(); const back = noLv(ctree(w)) === t0;
  m = w.mark(); const b0 = bal(A); sendD("thursday", rf("Feed the cat"), "  Fill   the bowl <too>  "); await w.flush(); const wd = SPL(MASK(WS(w, m))), P = "routineLog/kid_a/" + wk + "/thursday/ag_cstep" + ix("Feed the cat");
  ok("Do it again = Just a mistake's un-tick, write for write, + ONE set of " + P.replace(wk, "<wk>"), back && J(wd.filter(s => s !== "set " + P)) === J(wm) && wd.filter(s => s === "set " + P).length === 1 && bal(A) - b0 === -10, [back, bal(A) - b0, back ? "" : ddiff(JSON.parse(ctree(w)), JSON.parse(t0Full)), wd, wm]);
  const g = w.get(P);
  ok("…the line: act \"again\", \"Feed the cat — sent back by Mom: do it again\", by mom, the note tidied (\"Fill the bowl <too>\"), pts 0, sb = what the un-tick changed, no prev (Monday's line is another day's)", g && g.act === "again" && g.label === "Feed the cat — sent back by Mom: do it again" && g.by === "mom" && g.t === "Fill the bowl <too>" && g.pts === 0 && g.sb && g.sb.dn === "thursday" && !g.prev && !g.f, g);
  const kr = kidRow(Kk, "chores", "Feed the cat"), kh = kidList(Kk, "chores");
  ok("Kid A's row: \"↩ Do this again · Mom: “Fill the bowl <too>”\" (escaped) and \"10 → 8 ⭐\"", /↩ Do this again · Mom: “Fill the bowl &lt;too&gt;”/.test(kr) && kh.indexOf("<too>") < 0 && /10 → 8 ⭐/.test(kr), kr);
  const corner = B.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return kcChoresHTML('kid_a'); } finally{ day=d0; } })()");   // Kids' Corner ▸ ✅ My Lists
  ok("…the same on Kids' Corner ▸ ✅ My Lists", /↩ Do this again · Mom: “Fill the bowl &lt;too&gt;”/.test(corner), txt(corner).slice(Math.max(0, txt(corner).indexOf("Feed the cat") - 100), txt(corner).indexOf("Feed the cat") + 200) || txt(corner).slice(0, 300));
  const log = A.run("chSettingsClickoffLogHTML()"), lrow = String(log).split('<div style="display:flex;align-items:center;gap:8px;padding:7px 0;').filter(r => r.indexOf("sent back by Mom: do it again") >= 0);
  ok("the Click-off Log: \"↩ Feed the cat — sent back by Mom: do it again\", a line of its own with no ⚠️ on it", lrow.length >= 1 && /↩ Feed the cat — sent back by Mom: do it again/.test(txt(lrow[lrow.length - 1])) && !/rlogFlag/.test(lrow[lrow.length - 1]), lrow.map(txt));
  let L = rowT(pop(A), "Feed the cat");
  ok("the ledger row: \"↩ sent back · do it again · by Mom · “Fill the bowl <too>”\" with Undo (and ➖ Excuse: two buttons at most)", /↩ sent back · do it again · by Mom · “Fill the bowl &lt;too&gt;” Undo/.test(L) && (rowsRaw(pop(A)).filter(r => txt(r).indexOf("Feed the cat") >= 0)[0].match(/<button /g) || []).length <= 2, L);
  tick(B, "chores", "kid_a", "Feed the cat"); await w.flush(); L = rowT(pop(A), "Feed the cat");
  ok("done again: the row is ✅ with \"↩ done again (sent back by Mom)\" and ↩ Send back again", /^✅ .*↩ done again \(sent back by Mom\)/.test(L) && /↩ Send back/.test(L), L);
  // a second Do it again the same day
  const t1 = ctree(w), b1 = bal(A); sendD("thursday", rf("Feed the cat"), "Again please"); await w.flush(); const g2 = w.get(P);
  ok("a second Do it again (same day): −8 (what the redo paid), the line keeps the first as prev; the ask says \"It was sent back before: it still pays 20% less, not more.\"", bal(A) - b1 === -8 && g2.t === "Again please" && g2.prev && g2.prev.t === "Fill the bowl <too>", [bal(A) - b1, g2 && g2.prev && g2.prev.t]);
  A.run("lgDaUndo(" + aj("thursday", rf("Feed the cat")) + ")"); await w.flush();
  ok("…its Undo: back to the first redo exactly (its tick and 8, the first line)", ctree(w) === t1, ddiff(JSON.parse(ctree(w)), JSON.parse(t1)));
  const askAgain = rowT(LG(A, "lgGo('kid_a',0,0);lgSbAskSet('kid_a|" + wk + "|thursday|" + rf("Feed the cat") + "')"), "Feed the cat"); A.run("lgSbAskSet('');1");
  ok("…asked again, the ask says so: \"…Done again, it pays 6 ⭐, not 8 (20% less). It was sent back before: it still pays 20% less, not more.\"", /It was sent back before: it still pays 20% less, not more\./.test(askAgain), askAgain);
  sendD("thursday", rf("Feed the cat")); await w.flush(); const b2 = bal(A); tick(B, "chores", "kid_a", "Feed the cat"); await w.flush();
  ok("…and a second redo pays 20% less than it would (10 → 8), not 40%: a second Do it again does not stack", bal(A) - b2 === 8, bal(A) - b2);
}
{ // ⏸ Pause
  tick(B, "chores", "kid_a", "Socks in the basket"); await w.flush(); A.run("lgRulePause()"); await w.flush();
  const t = rowT(LG(A, "lgGo('kid_a',0,0);lgSbAskSet('kid_a|" + wk + "|thursday|" + rf("Socks in the basket") + "')"), "Socks in the basket"); A.run("lgSbAskSet('');1");
  sendD("thursday", rf("Socks in the basket")); await w.flush(); const kr = kidRow(Kk, "chores", "Socks in the basket"), b0 = bal(A); tick(B, "chores", "kid_a", "Socks in the basket"); await w.flush();
  ok("⏸ Pause for everyone: the ask says \"Done again, it pays its 10 ⭐ in full (⏸ Star rules are paused for everyone).\"; the row still says \"↩ Do this again\"; the redo pays 10", /Done again, it pays its 10 ⭐ in full \(⏸ Star rules are paused for everyone\)\./.test(t) && /↩ Do this again/.test(kr) && bal(A) - b0 === 10, [t, kr, bal(A) - b0]);
  A.run("lgRulePause()"); await w.flush();
}
{ // 0 ⭐
  tick(B, "chores", "kid_a", "Shoes by the door"); await w.flush();
  const t = rowT(LG(A, "lgGo('kid_a',0,0);lgSbAskSet('kid_a|" + wk + "|thursday|" + rf("Shoes by the door") + "')"), "Shoes by the door"); A.run("lgSbAskSet('');1");
  const b0 = bal(A); sendD("thursday", rf("Shoes by the door")); await w.flush(); tick(B, "chores", "kid_a", "Shoes by the door"); await w.flush();
  ok("a 0 ⭐ chore: the ask says nothing about pay; sent back and done again, the bank does not move", /^.*It goes back on Kid A's list\. Kid A sees “↩ Do this again” and your note\. 🚩/.test(t) && bal(A) === b0, [t.slice(0, 260), bal(A) - b0]);
}
{ // ➖ Excuse on a row sent back
  tick(B, "chores", "kid_a", "Unload the dishwasher"); await w.flush(); const i = ix("Unload the dishwasher"), t0 = ctree(w);
  sendD("thursday", rf("Unload the dishwasher")); await w.flush(); const b0 = bal(A);
  const ex = A.run("lgExcuse('kid_a','" + wk + "','thursday','chores'," + i + ")"); await w.flush(); const kr = kidRow(Kk, "chores", "Unload the dishwasher");
  ok("➖ Excuse on a row sent back: it is excused (no \"↩ Do this again\" on the kid's list), and the bank does not move", ex === true && !/Do this again/.test(kr) && bal(A) === b0, [ex, kr]);
  A.run("lgExcuseUndo('kid_a','" + wk + "','thursday','chores'," + i + ")"); await w.flush();
  ok("…its Undo: \"↩ Do this again\" is back", /↩ Do this again/.test(kidRow(Kk, "chores", "Unload the dishwasher")));
  A.run("lgDaUndo(" + aj("thursday", rf("Unload the dishwasher")) + ")"); await w.flush();
  ok("…then Do it again's Undo: the database as before the send-back", ctree(w) === t0, ddiff(JSON.parse(ctree(w)), JSON.parse(t0)));
}
{ // the morning list and the laundry line's Start row (Thursday's load)
  await go(w, 3, 16, 30); tick(B, "morning", "kid_a", "Make the bed"); await w.flush();
  const bi = ix("Make the bed", "morning"), b0 = bal(A); sendD("thursday", "s:morning:" + bi); await w.flush(); const kr = kidRow(Kk, "morning", "Make the bed"), b1 = bal(A); tick(B, "morning", "kid_a", "Make the bed"); await w.flush();
  ok("🌅 Morning: Make the bed (5) sent back: −5, \"↩ Do this again\" and \"5 → 4\" on the morning list; the redo pays 4", b1 - b0 === -5 && /↩ Do this again/.test(kr) && /5 → 4/.test(kr) && bal(A) - b1 === 4, [b1 - b0, kr, bal(A) - b1]);
  const li = ix("Start your laundry", "morning");
  if (li < 0) ok("(the laundry line's Start row is on Thursday's morning list)", false, li);
  else { const pts = A.run("(rtStepsFor('morning','kid_a',false,_todayDay)||[])[" + li + "].pts||0"); tick(B, "morning", "kid_a", "Start your laundry"); await w.flush();
    const t0 = ctree(w); const c0 = bal(A); sendD("thursday", "s:morning:" + li, "Sort the colors first"); await w.flush();
    const kr2 = kidRow(Kk, "morning", "Start your laundry"), open = A.run("mStepDoneOn('kid_a','thursday'," + li + ")") === false;
    A.run("lgDaUndo(" + aj("thursday", "s:morning:" + li) + ")"); await w.flush(); const ex = ctree(w) === t0;
    sendD("thursday", "s:morning:" + li); await w.flush(); const c1 = bal(A); tick(B, "morning", "kid_a", "Start your laundry"); await w.flush();
    ok("laundry: \"Start your laundry\" sent back (the kid's own un-tick, as Just a mistake): open again with \"↩ Do this again · Mom: “Sort the colors first”\"; its Undo exact; the redo pays " + A.run("rtFallPts(" + pts + ",1)") + " of " + pts,
      open && /↩ Do this again · Mom: “Sort the colors first”/.test(kr2) && ex && bal(A) - c1 === A.run("rtFallPts(" + pts + ",1)") && c1 - c0 <= 0, [open, kr2, ex, bal(A) - c1]); }
}
{ // Dad, a kid's device, ?dryrun=1, two devices
  tick(B, "afternoon", "kid_a", "Water the plants"); await w.flush(); loadH(Dd, HJS); const pr = rf("Water the plants", "afternoon");
  let m = w.mark();
  ok("Dad's link, locked: no tap (refused, nothing written)", Dd.run("lgSendBack(" + aj("thursday", pr) + ",'d','x')") === false && writes(w, m).length === 0);
  Dd.run("dadUnlocked=true;1"); const b0 = bal(A); Dd.run("lgSendBack(" + aj("thursday", pr) + ",'d','Use the blue can')"); await w.flush();
  const g = w.get("routineLog/kid_a/" + wk + "/thursday/ag_astep" + ix("Water the plants", "afternoon")), kr = kidRow(Kk, "afternoon", "Water the plants");
  ok("with his code in: Dad's Do it again: −5, the line by dad (\"— sent back by Dad: do it again\"), the kid's row \"↩ Do this again · Dad: “Use the blue can”\", Mom's ledger \"by Dad\"",
    bal(A) - b0 === -5 && g && g.by === "dad" && /sent back by Dad/.test(g.label) && /↩ Do this again · Dad: “Use the blue can”/.test(kr) && /do it again · by Dad/.test(rowT(pop(A), "Water the plants")), [bal(A) - b0, g, kr]);
  ok("…his Undo puts it back", Dd.run("lgDaUndo(" + aj("thursday", pr) + ")") === true && (await w.flush(), bal(A) === b0));
  Dd.run("dadUnlocked=false;1");
  loadH(Kk, HJS); loadH(B, HJS); m = w.mark();
  ok("a kid's device (the kiosk, a kid's own list): the tap and the Undo refused, nothing written", Kk.run("lgSendBack(" + aj("thursday", pr) + ",'d','x')") === false && B.run("lgSendBack(" + aj("thursday", pr) + ",'d','x')") === false && B.run("lgDaUndo(" + aj("thursday", pr) + ")") === false && writes(w, m).length === 0);
  const Dr = w.boot("Dr", "devDr", { mom: true }); await w.flush(); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_dryrun','1');haMomOn();1"); loadH(Dr, HJS);
  Dr.run("(function(){ const o=db.ref.bind(db); db.ref=function(p){ const r=o(p); r.set=r.update=r.remove=function(){ return Promise.resolve(); }; return r; }; })();1"); await w.flush(); m = w.mark();
  const dr = Dr.run("lgSendBack(" + aj("thursday", pr) + ",'d','x')"); await w.flush();
  ok("?dryrun=1 (Mom): the screen answers, nothing reaches the database", Dr.run("_dryRun()") === true && dr === true && writes(w, m).length === 0, WS(w, m));
  const A2 = w.boot("A2", "devA2", { mom: true }); await w.flush(); A2.run(CAP); A2.run("haMomOn();1"); loadH(A2, HJS);
  const b1 = bal(A); A.run("lgSendBack(" + aj("thursday", pr) + ",'d','one')"); await w.flush(); m = w.mark(); const r2 = A2.run("lgSendBack(" + aj("thursday", pr) + ",'d','two')"); await w.flush();
  ok("two Mom devices, one after the other: the second is refused (the row is no longer ticked), one line, −5 once", r2 === false && writes(w, m).length === 0 && bal(A) - b1 === -5 && (w.get("routineLog/kid_a/" + wk + "/thursday/ag_astep" + ix("Water the plants", "afternoon")) || {}).t === "one");
}

// ── P ──
console.log("\n── P · a plan row (the plan ON; the fixture's own made-up household) ──");
{ const w = await W.world({ mode: "on" }), A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); for (const d of [A, B]) d.run(CAP); await w.flush();
  await w.at(2026, 11, 17, 16, 0);
  const row = JSON.parse(B.run("(function(){ day=_todayDay; const s=rtStepsFor('chores','kid_a',false,day)||[]; const i=s.findIndex(function(x,k){ return x&&x.house&&(x.pts||0)>0&&x.cad!=='none'&&rtDueOrLate('chores','kid_a',day,k,x); }); return JSON.stringify(i<0?null:{i:i,label:s[i].label,pts:s[i].pts,house:s[i].house}); })()"));
  if (!row) ok("(a paying plan row is on Kid A's chores today)", false);
  else { B.run("(function(){ day=_todayDay; toggleRtStep('chores','kid_a'," + row.i + "); })()"); await w.flush(); A.run(HJS); A.run("haMomOn();1");
    const wk = A.run("activeWk()"), dn = A.run("_todayDay"), pj = "'kid_a','" + wk + "','" + dn + "','s:chores:" + row.i + "'", t0 = ctree(w), b0 = bal(A);
    const r1 = A.run("lgSendBack(" + pj + ",'d','Wipe the corners')"); await w.flush(); const ln = w.get("routineLog/kid_a/" + wk + "/" + dn + "/ag_ch" + row.house), kr = txt(B.run("(function(){ day=_todayDay; rtOpen={}; return rtSlotHTML('chores','kid_a'); })()"));
    const s1 = bal(A) - b0, u = A.run("lgDaUndo(" + pj + ")"); await w.flush(); const ex = ctree(w) === t0;
    A.run("lgSendBack(" + pj + ",'d','')"); await w.flush(); const b1 = bal(A); B.run("(function(){ day=_todayDay; toggleRtStep('chores','kid_a'," + row.i + "); })()"); await w.flush();
    ok("plan row \"" + row.label + "\" (" + row.pts + " ⭐, by chore): Do it again −" + row.pts + ", its line ag_ch" + row.house + ", the kid's row \"↩ Do this again · Mom: “Wipe the corners”\" and \"" + row.pts + " → " + A.run("rtFallPts(" + row.pts + ",1)") + " ⭐\"; Undo exact; the redo pays " + A.run("rtFallPts(" + row.pts + ",1)"),
      r1 === true && s1 === -row.pts && ln && ln.act === "again" && new RegExp("↩ Do this again · Mom: “Wipe the corners” " + row.pts + " → " + A.run("rtFallPts(" + row.pts + ",1)") + " ⭐").test(kr) && u === true && ex && bal(A) - b1 === A.run("rtFallPts(" + row.pts + ",1)"), [r1, s1, !!ln, kr.slice(0, 300), u, ex, bal(A) - b1]); }
}

// ── E ──
console.log("\n── E · plan rows that fell under slice E (the plan ON, from Mon 12/07): the redo, its Undo, a row E carries ──");
{ const R = await planE(IDX, HJS), c = checkPlan(R);
  ok("Ben's Mop (20 ⭐, 7d), skipped Monday: Tuesday \"20 → 16\", ticked +16; Do it again −16, his row \"↩ Do this again · Mom: “Under the table too” 20 → 13 ⭐\"; the redo pays 13 (20% less than 16)", c["a fallen plan row's redo pays 20% less than its fallen pay"], [R.mopRow0, R.mopTick, R.mopSent, R.mopRow, R.mopRedo]);
  ok("…never more than without the send-back: the Mop 13 ≤ 16, the rug 6 ≤ 8, the towel 0 ≤ 0", c["never more than without the send-back"], [R.mopRedo, R.mopTick, R.rugRedo, R.rugTick, R.oneRedo, R.oneTick]);
  ok("a 1 ⭐ plan row that fell to 0: sent back, its row says \"1 → 0 ⭐\", the redo pays 0 (never below 0)", c["never below 0 (a plan row)"], [R.oneTick, R.oneRow, R.oneRedo]);
  ok("the Mop's Undo before the redo: the whole database byte for byte as before the tap", c["a plan row's Undo is exact"], R.mopDiff);
  ok("a row E carries: Kid A's rug (10, skipped Monday → Tuesday \"10 → 8\", ticked +8) sent back Tuesday and not done again → Wednesday E keeps it with Kid A; the row still says \"↩ Do this again · Mom: “Shake it outside”\" and \"10 → 6\" (8 less 20%: it falls no further than its first tick, not E's Wednesday 6 less 20% = 5); the redo pays 6", c["a carried plan row keeps its line and falls no further"], [R.rugTick, R.rugSent, R.rugWait, R.rugRow, R.rugRedo]);
  ok("…Tuesday's Undo after Wednesday's redo: refused, nothing written (the first tick never comes back beside the redo)", c["no Undo after a carried redo (nothing paid twice)"], [R.rugUndo, R.rugUndoBank, R.rugUndoW]);
}

if (!process.env.DA_QUICK) { // DA_QUICK=1: R, X and P only
// ── A ──
console.log("\n── A · 32 days, no ↩ Do it again tap (Just a mistake and Wasn't done tapped): every list, bank, write and the whole database = the app before ──");
{ const dA = n => new Date(2026, 10, 16 + n);
  const replay = async (index, hjs) => { const V = await mkWorld(index, hjs, { longPlan: true }), { w, A, B } = V, snaps = [];
    for (let n = 0; n < 32; n++) { const d = dA(n); await w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), 8, 0); tick(B, "morning", "kid_a", "Make the bed");
      await w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), 16, 0); for (const l of ["Feed the cat", "Dust the shelves", "Vacuum the den", "Wipe the table", "Hang the towel"]) tick(B, "chores", "kid_a", l); tick(B, "chores", "kid_b", "Sweep the porch"); await w.flush();
      A.run("haMomOn();1"); loadH(A, hjs); const wk = A.run("activeWk()"), dn = A.run("_todayDay");
      if (n % 4 === 1) { A.run("lgSendBack('kid_a','" + wk + "','" + dn + "','s:chores:" + idxOf(A, "chores", "kid_a", "Feed the cat") + "','m')"); await w.flush(); tick(B, "chores", "kid_a", "Feed the cat"); }
      if (n % 6 === 2) A.run("lgSendBack('kid_a','" + wk + "','" + dn + "','s:morning:" + idxOf(A, "morning", "kid_a", "Make the bed") + "','w')");
      await w.flush();
      snaps.push(J({ l: W.lists(B, { days: [dn] }), m: kidList(B, "morning"), c: kidList(B, "chores"), k: kidList(V.Kk, "chores"), bank: A.run("JSON.stringify(ROSTER.map(function(k){ return [bankBalance(k),bankLedger(k).length]; }))"), pop: pop(A), log: A.run("chSettingsClickoffLogHTML()") })); A.run("lgClose();1"); }
    return { snaps, writes: writes(w, 0).map(e => e.op + " " + e.path + " " + (e.keys || []).join(",")).join("\n"), tree: ctree(w) }; };
  const N = await replay(IDX, HJS), O = await replay(BASE_IDX, BASE_HJS);
  const bad = N.snaps.map((s, i) => s === O.snaps[i] ? null : i).filter(x => x !== null);
  ok("every day for 32 days: Kid A's lists (as drawn, on her screen and the kiosk), every list's ticks, the Star Banks, the 📒 pop-up and the Click-off Log = the app before", bad.length === 0, bad.slice(0, 3).map(i => { const a = JSON.parse(N.snaps[i]), b = JSON.parse(O.snaps[i]); const k = Object.keys(a).filter(x => J(a[x]) !== J(b[x])); return [i, k, String(a[k[0]]).slice(0, 300), String(b[k[0]]).slice(0, 300)]; }));
  ok("every write in 32 days is the app before's, in order (" + N.writes.split("\n").length + " writes)", N.writes === O.writes, (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok("the whole database after 32 days = the app before's, byte for byte", N.tree === O.tree, ddiff(JSON.parse(N.tree), JSON.parse(O.tree)));
}

// ── M ──
console.log("\n── M · planted faults: each breaks one rule, and the check of that rule catches it ──");
const MUT = [
  ["the redo pays 20% less", "idx", "function agPay(kid,g,p){ return g&&starTakeOk(kid)?rtFallPts(p,1):p; }", "function agPay(kid,g,p){ return p; }"],
  ["Take stars away off: the redo pays in full, the mark still shows", "idx", "return g&&starTakeOk(kid)?rtFallPts(p,1):p;", "return g?rtFallPts(p,1):p;"],
  ["never below 0", "idx", "return g&&starTakeOk(kid)?rtFallPts(p,1):p;", "return g&&starTakeOk(kid)?p-2:p;"],
  ["a new turn pays in full", "idx", "} else if(!w||cadDueOn(c,x)) break; } return null; }", "} else {} } return null; }"],
  ["Undo puts everything back exactly", "hjs", "if(g.prev){ Dd[k]=g.prev; u[P]=g.prev; } else { delete Dd[k]; u[P]=null; }", ""],
  ["no Undo after the redo (nothing paid twice)", "hjs", "function lgDaRedone(R){ if(!R) return true;", "function lgDaRedone(R){ return false; if(!R) return true;"],
  ["only where the kid can do it again today", "hjs", "if(c===\"none\"||(p0!==t&&!late)) return null;", "if(c===\"none\") return null;"],
  ["the 🌅 row comes back and its redo pays 20% less", "idx", "function agFindA(kid,id){", "function agFindA(kid,id){ return null;"],
  ["a late redo falls no further than its first tick", "idx", "rtFallPay(_st0,Math.min(rtLateDays(slot,kid,i),_g?_g.f||0:99),kid)", "rtFallPay(_st0,rtLateDays(slot,kid,i),kid)"],
  ["the note and the redo's pay on the kid's row", "idx", "+(g.t?' · '+(g.by===\"dad\"?\"Dad\":\"Mom\")+': “'+esc(g.t)+'”':'')", ""],
  ["a due day since starts a new turn", "hjs", "for(let p=p0+1;p<=t;p++) if(cadDueOn(c,DAYS_ALL[_rtIdx(p)])) return null;", ""],
  ["the tick's pay comes off", "hjs", "  if(R.it) amMomTick(kid,R.id,dn); else {", "  if(a===\"d\"){}else if(R.it) amMomTick(kid,R.id,dn); else {"],
  ["a fallen plan row's redo pays 20% less than its fallen pay", "idx", "b2=_g?agPay(kid,_g,agFall(st,_g,st.hdLate||0,kid)):b1;", "b2=b1;", "plan"],
  ["never more than without the send-back", "idx", "function agPay(kid,g,p){ return g&&starTakeOk(kid)?rtFallPts(p,1):p; }", "function agPay(kid,g,p){ return g&&starTakeOk(kid)?p+2:p; }", "plan"],
  ["never below 0 (a plan row)", "idx", "function agPay(kid,g,p){ return g&&starTakeOk(kid)?rtFallPts(p,1):p; }", "function agPay(kid,g,p){ return g&&starTakeOk(kid)?p-1:p; }", "plan"],
  ["a plan row's Undo is exact", "hjs", "if(g.prev){ Dd[k]=g.prev; u[P]=g.prev; } else { delete Dd[k]; u[P]=null; }", "", "plan"],
  ["a carried plan row keeps its line and falls no further", "idx", "if(!st.hdSince||!y||!(amIso(y)>=st.hdSince)) break;", "break;", "plan"],
  ["a carried plan row keeps its line and falls no further", "idx", "hdFall:Math.min(+st.hdFall||0,g.f||0)", "hdFall:+st.hdFall||0", "plan"],
  ["no Undo after a carried redo (nothing paid twice)", "hjs", "if(hdDoneRec(amIso(DAYS_ALL[_rtIdx(p)]),R.st.house)) return true;", "", "plan"]
];
for (const [rule, f, a, b, which] of MUT) {
  const src = f === "idx" ? IDXS : HJS, n = src.split(a).length - 1;
  if (n !== 1) { ok("planted fault for \"" + rule + "\": its line is found once", false, n); continue; }
  const s = src.replace(a, () => b), ix = f === "idx" ? tmp("m" + MUT.findIndex(x => x[2] === a && x[0] === rule), s) : IDX, hx = f === "hjs" ? s : HJS, c = which === "plan" ? checkPlan(await planE(ix, hx)) : checkCore((await core(ix, hx)).R);
  ok("planted fault (" + rule + ") is caught by that rule's check", c[rule] === false, Object.keys(c).filter(k => !c[k]));
}

}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
