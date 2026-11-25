/*
 * test_chore_fall.js — ⭐ CHOREFALL (missed-chores design slice C2, her rule 2026-11-19: "if skipped it stays with them and they lose
 * 20% of the original points value a day"; the kid's row: "i think let them know the original. versus the now so they are motivated
 * in the future to do it the first day"; 3+ a week (11/20): "Yes, same rules").
 * A chore on a kid's own list in its wait today (rtLateDays > 0) pays 100% on its day, then 80 · 60 · 40 · 20 · 0% (a step is 20% of
 * the original, rounded, at least 1: rtFallPts, the one function). Only a turn due on or after RT_FALL_FROM (Sun 2026-11-22) falls.
 * Nothing is ever taken from a bank; un-check takes back exactly what was paid (the stored amount).
 * The WHOLE app runs per device (test_fixtures/house_world.js: one shared in-memory Firebase, one virtual clock) on a made-up family
 * (kid_a … kid_d), the clock moved day by day from Mon 11/16 (day 0; Sun 11/22 = day 6, Mon 11/23 = day 7):
 *   A · the function: the table for 10, 15, 22 and 5 ⭐ day by day; small values; every payer and display reads it;
 *   B · the table through real ticks: 4-week-cycle chores due Mon 11/23 (their wait runs to Saturday), ticked one per day — the bank
 *       line, the bank balance, the log line's pts and the check-off's pts; the kid's pill and Kids' Corner's "still to get";
 *   C · un-check takes back exactly what was paid: the kid the same day; Mom a day later and after the drop (when today's value differs);
 *   D · Mom's tick from the Kids today pop-up = the kid's tick; held pay holds and releases the reduced amount; a bonus room doubles
 *       the reduced amount; the 🏁 list and 🏆 day bonuses keep their size;
 *   E · a 3-a-week row 1 and 2 days late pays 80% / 60% and keeps its red tag; a daily row, a 0 ⭐ row, an as-needed row and a 🌅
 *       morning-list chore pay full, as before;
 *   F · the blank slate: turns due before 11/22 pay full on every wait day (one number on the row); the same chores' later turns fall;
 *   G · what is shown: both numbers on a falling row, one otherwise; no "late"/"from " added to a plain waiting row; Mom's note
 *       "… · pays 6 of 10 ⭐"; a kid's device pop-up has no note;
 *   H · nothing else moves: every chore done on its day for 14 days, and a missed week before the blank slate (late ticks included):
 *       every list, pop-up, write and the whole database = the app before, byte for byte; the plan ON, a missed week after the slate
 *       with its late plan rows ticked: = the app before (slice E).
 * "The app before" = git show c4561ba8:index.html (skipped with a note if that commit is missing). HOUSE_INDEX=<a copy> runs the
 * branch side on another copy (the mutation checks).   run: node test_chore_fall.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const unLS = s => String(s).replace(/ <span class=\\*"ls-fire\\*"[^>]*>🔥 \d+<\/span>/g, "").replace(/<div class=\\*"ls-four\\*"[^>]*>.*?<\/div>/g, "");   // LISTSTREAK (P2): the 🔥 streak's own markup, left out of the comparisons with older copies (test_list_streak.js checks it)
const BASE_SHA = "c4561ba8";
let BASE = null; try { const t = path.join(os.tmpdir(), "chore_fall_base_" + process.pid + ".html"); fs.writeFileSync(t, cp.execSync("git show " + BASE_SHA + ":index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] })); BASE = t; } catch (e) { BASE = null; }
console.log("(the app before: " + (BASE ? BASE_SHA : "none — git show " + BASE_SHA + " failed; the checks against it are skipped") + ")");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const household = (jobs, mode) => ({ jobs: jobs, people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: mode || "preview", on: "2026-11-09" } } });
async function mkWorld(jobs, cfg, mode, index) { const w = await W.world({ household: household(jobs, mode), tree: { config: Object.assign(clone(W.FX.db.config), cfg || {}) }, index }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush(); return { w, A, B }; }

// what a kid's device draws: one list on today's tab, opened as the kid finds it
const draw = (d, slot, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML(" + J(slot) + "," + J(kid) + "); } finally{ day=d0; } })()");
const rowsOf = h => { const i = h.indexOf('<div class="mr-steps"'); if (i < 0) return []; const p = h.slice(h.indexOf(">", i) + 1).split('<div class="mr-step').slice(1).map(r => '<div class="mr-step' + r); if (p.length) p[p.length - 1] = p[p.length - 1].replace(/<\/div>$/, ""); return p; };
const rowOf = (h, label) => rowsOf(h).filter(r => r.indexOf(label + "<") >= 0 || r.indexOf(label + " <") >= 0)[0] || "";
const pill = r => (r.match(/<span class="mr-pts">.*?⭐<\/span>/) || [""])[0];
const FALL = (a, b) => '<span class="mr-pts"><s style="opacity:.6">' + a + '</s> → ' + b + ' ⭐</span>', ONE = a => '<span class="mr-pts">+' + a + ' ⭐</span>';
const idxOf = (d, slot, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); })()");
// a tick on today's tab (Kids' Corner's), and Mom's tick from her Kids today pop-up (mdKidTick, the ○ on the row)
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; toggleRtStep('" + slot + "','" + kid + "'," + i + "); })()"); return i; };
const momTick = (A, slot, kid, label, dn) => { const i = idxOf(A, slot, kid, label); if (i < 0) return -1; A.run("mdKidTick('" + slot + "','" + kid + "'," + (dn ? J(dn) : "_todayDay") + "," + i + ")"); return i; };
const teeth = (d, kid) => d.run("(function(){ day=_todayDay; const i=morningStepsFor(" + J(kid || "kid_a") + ").findIndex(function(s){ return s.label==='Brush teeth'; }); if(i>=0&&!mStepDoneOn(" + J(kid || "kid_a") + ",day,i)) toggleMorningStep(" + J(kid || "kid_a") + ",i); return i; })()");
const pop = (d, kid, slot) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + "," + J(slot) + ",_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
const popRow = (h, label) => (h.split('<div style="display:flex;align-items:center;gap:8px;padding:6px 2px').filter(r => r.indexOf(label) >= 0)[0] || "");
// the bank as the database holds it
const adj = (w, kid) => w.db.tree.root.bank && w.db.tree.root.bank[kid] && w.db.tree.root.bank[kid].adjustments || {};
const bal = (w, kid) => Object.values(adj(w, kid)).reduce((s, a) => s + (a && !a.held ? (a.amount || 0) : 0), 0);
const linesOf = (w, kid, label) => Object.entries(adj(w, kid)).filter(([id, a]) => a && String(a.note || "").indexOf(label) >= 0).map(([id, a]) => Object.assign({ id }, a));
const logsOf = (w, kid, label) => { const L = (w.db.tree.root.routineLog || {})[kid] || {}, out = []; Object.values(L).forEach(wk => Object.values(wk || {}).forEach(dy => Object.values(dy || {}).forEach(r => { if (r && r.label === label && !r.missed) out.push(r); }))); return out.sort((a, b) => a.at - b.at); };
const recOf = (d, kid, i) => d.run("JSON.stringify(slState[activeWk()+'_'+_todayDay+'_" + kid + "_cstep" + i + "']||null)");
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
const treeJ = w => JSON.stringify(w.db.tree.root);
const TABLE = { 10: [10, 8, 6, 4, 2, 0, 0], 15: [15, 12, 9, 6, 3, 0, 0], 22: [22, 18, 13, 9, 4, 0, 0], 5: [5, 4, 3, 2, 1, 0, 0] };

(async () => {
// ── A ──
console.log("\n── A · the one function: what a step pays n days late (rtFallPts) ──");
{ const { A } = await mkWorld({ a_teeth: K({ label: "Brush teeth", who: "kid_a", slot: "morning", cad: "daily", area: "health" }) });
  Object.keys(TABLE).forEach(v => { const got = [0, 1, 2, 3, 4, 5, 6].map(n => A.run("rtFallPts(" + v + "," + n + ")"));
    ok(v + " ⭐ on its day and each day after: " + TABLE[v].join(", "), J(got) === J(TABLE[v]), got); });
  ok("a step is at least 1: 1 ⭐ → 0 · 2 ⭐ → 1, 0 · 3 ⭐ → 2, 1, 0", J([A.run("rtFallPts(1,1)"), A.run("rtFallPts(2,1)"), A.run("rtFallPts(2,2)"), A.run("rtFallPts(3,1)"), A.run("rtFallPts(3,2)"), A.run("rtFallPts(3,3)")]) === J([0, 1, 0, 2, 1, 0]));
  ok("0 ⭐ and not late pay what they pay (0, 10); never below 0 (50 days late: 0)", A.run("rtFallPts(0,3)") === 0 && A.run("rtFallPts(10,0)") === 10 && A.run("rtFallPts(10,50)") === 0);
  ok("the blank slate is one constant, Sun 2026-11-22, read in one helper (rtFallDays)", A.run("RT_FALL_FROM") === "2026-11-22" && A.run("rtFallDays.toString()").indexOf("RT_FALL_FROM") >= 0 && A.run("rtFallPay.toString()").indexOf("rtFallPts(") >= 0 && A.run("rtFallPay.toString()").indexOf("rtFallDays(") >= 0);
  ok("every payer and display goes through it: toggleRtStep, the kid's row (rtSlotHTML → rtFallPill), Mom's pop-up, Kids' Corner, the 🧽 house panel", ["toggleRtStep", "rtFallPill", "boardStatPop", "kcPointsHTML", "hhCleanRows"].every(f => A.run(f + ".toString()").indexOf("rtFallPay(") >= 0) && A.run("rtSlotHTML.toString()").indexOf("rtFallPill(") >= 0);
}

// ── B ──
console.log("\n── B · the table through real ticks: 4-week-cycle chores due Mon 11/23, one ticked each day Mon … Sat ──");
{ const V = { kid_a: 10, kid_b: 15, kid_c: 22, kid_d: 5 }, jobs = {};
  Object.keys(V).forEach(k => { for (let i = 0; i < 6; i++) jobs[k + "_" + i] = K({ label: "Chore " + V[k] + " #" + i, who: k, slot: "chores", cad: "wk:0", cycW: 1, cycN: 4, cycStart: "2026-11-23", pts: V[k], order: i }); });
  jobs.a_teeth = K({ label: "Brush teeth", who: "kid_a", slot: "morning", cad: "daily", area: "health" });
  const { w, A, B } = await mkWorld(jobs);
  const res = {}, pills = {}; let kc = "", kcOld = "";
  for (let n = 0; n < 13; n++) { await go(w, n, 17); teeth(B); await w.flush();
    if (n < 7) continue; const k = n - 7;
    if (n === 9) kc = B.run("kcPointsHTML('kid_a')");
    for (const kid of Object.keys(V)) { const lb = "Chore " + V[kid] + " #" + k, h = draw(B, "chores", kid);
      pills[kid + k] = pill(rowOf(h, lb)); const b0 = bal(w, kid), l0 = linesOf(w, kid, lb).length;
      const i = tick(B, "chores", kid, lb); await w.flush();
      const ln = linesOf(w, kid, lb), lg = logsOf(w, kid, lb), rec = JSON.parse(recOf(B, kid, i) || "null");
      res[kid + k] = { i, paid: bal(w, kid) - b0, line: ln.length - l0 === 1 ? ln[ln.length - 1].amount : (ln.length === l0 ? null : "x" + ln.length), log: lg.length ? lg[lg.length - 1].pts : "none", act: lg.length ? lg[lg.length - 1].act : "", rec: rec && rec.pts }; }
  }
  Object.keys(V).forEach(kid => { const v = V[kid], exp = TABLE[v].slice(0, 6);
    const got = [0, 1, 2, 3, 4, 5].map(k => res[kid + k]);
    ok(v + " ⭐, ticked on its day … 5 days late: the bank balance grows " + exp.join(", "), J(got.map(r => r.paid)) === J(exp), got);
    ok("…one bank line of that amount (none when it pays 0), the log line's pts and the check-off's stored pts the same", got.every((r, k) => (exp[k] > 0 ? r.line === exp[k] : r.line === null) && r.log === exp[k] && r.act === "on" && r.rec === exp[k]), got);
    ok("…its row before the tick: \"+" + v + " ⭐\" on its day, then \"" + v + " → " + exp.slice(1).join("\", \"" + v + " → ") + "\"", pills[kid + 0] === ONE(v) && [1, 2, 3, 4, 5].every(k => pills[kid + k] === FALL(v, exp[k])), [0, 1, 2, 3, 4, 5].map(k => pills[kid + k])); });
  ok("Kids' Corner (Wed, 2 days late): Chores \"+24 ⭐\" still to get (four rows at 6, not 40)", /\+24 ⭐<\/span>/.test(kc) && />\+24<\/div>/.test(kc) && !/\+40/.test(kc), kc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 400));
  void A; void kcOld;
}

// the made-up family for C–G and H: Tue = wk:1
const FAM = () => ({
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  a_dust: K({ label: "Dust the shelf", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 2 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 0, order: 3 }),
  b_trash: K({ label: "Empty the trash", emoji: "🗑", who: "kid_b", slot: "chores", cad: "wk:0,2,4", pts: 10, order: 0 }),
  b_bikes: K({ label: "Wash the bikes", emoji: "🚲", who: "kid_b", slot: "chores", cad: "wk:5", pts: 8, order: 1 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "wk:1", pts: 10, order: 2 }),
  c_shelf: K({ label: "Wipe the shelf", emoji: "🧽", who: "kid_c", slot: "chores", cad: "wk:1", pts: 10, order: 0 }),
  c_table: K({ label: "Wipe the table", emoji: "🍽", who: "kid_c", slot: "chores", cad: "daily", pts: 5, order: 1 }),
  c_fish: K({ label: "Feed the fish", emoji: "🐟", who: "kid_c", slot: "chores", cad: "wk:1", pts: 0, order: 2 }),
  c_lizard: K({ label: "Lizard tank", emoji: "🦎", who: "kid_c", slot: "chores", cad: "asneeded", pts: 5, order: 3 }),
  d_zone: K({ label: "Zoned sweep", emoji: "🧹", who: "kid_d", slot: "chores", cad: "wk:1", zone: "z1", pts: 10, order: 0 }),
  d_towels: K({ label: "Fold the towels", emoji: "🧺", who: "kid_d", slot: "chores", cad: "wk:1", pts: 10, order: 1 }),
  d_car: K({ label: "Wash the car", emoji: "🚗", who: "kid_d", slot: "chores", cad: "wk:1", pts: 10, order: 2 }),
  d_garden: K({ label: "Water the garden", emoji: "🪴", who: "kid_d", slot: "chores", cad: "wk:1", pts: 8, order: 3 })
});
const CFG = () => ({ routineBonus: { chores: { kid_a: 7 }, day: { kid_a: 3 } }, choreVerify: { kid_c: true }, zoneBonus: { enabled: true, mode: "double" }, zonePlan: { wednesday: "z1" } });

// ── C–G: one replay, 11/16 … 11/30 ──
const S = { rows: {}, mom: {}, kidPop: {}, pay: {}, bank: {}, misc: {} };
{ const { w, A, B } = await mkWorld(FAM(), CFG());
  const snap = (n) => { S.rows[n] = { kid_a: draw(B, "chores", "kid_a"), kid_b: draw(B, "chores", "kid_b"), kid_c: draw(B, "chores", "kid_c"), kid_d: draw(B, "chores", "kid_d") };
    S.mom[n] = { kid_a: pop(A, "kid_a", "chores"), kid_b: pop(A, "kid_b", "chores"), kid_d: pop(A, "kid_d", "chores") }; S.kidPop[n] = { kid_a: pop(B, "kid_a", "chores"), kid_b: pop(B, "kid_b", "chores") }; };
  const pay = async (key, fn, kid, label) => { const b0 = bal(w, kid), l0 = linesOf(w, kid, label).length; fn(); await w.flush(); const ln = linesOf(w, kid, label), lg = logsOf(w, kid, label);
    S.pay[key] = { paid: bal(w, kid) - b0, line: ln.length > l0 ? ln[ln.length - 1].amount : null, held: ln.length > l0 ? !!ln[ln.length - 1].held : null, log: lg.length ? lg[lg.length - 1].pts : null, act: lg.length ? lg[lg.length - 1].act : null }; };
  for (let n = 0; n < 15; n++) { await go(w, n, 17); teeth(B); await w.flush(); snap(n);
    // F · the blank slate: the turns due before 11/22
    if (n === 3) await pay("vacThu1119", () => tick(B, "chores", "kid_a", "Vacuum the den"), "kid_a", "Vacuum the den");                 // due Tue 11/17, 2 days late
    if (n === 6) await pay("trashSun1122", () => tick(B, "chores", "kid_b", "Empty the trash"), "kid_b", "Empty the trash");              // due Fri 11/20, 2 days late
    if (n === 7) await pay("bikesMon1123", () => tick(B, "chores", "kid_b", "Wash the bikes"), "kid_b", "Wash the bikes");                // due Sat 11/21, 2 days late
    if (n === 1) S.misc.zoneOwn = J(A.run("zoneBonusFor('z1',10,'tuesday')"));
    // E · the 3-a-week row: Monday 11/23's turn ticked Tuesday (1 day late); Wednesday's on its day; Friday's ticked Sunday (2 days late)
    if (n === 8) await pay("trashTue", () => tick(B, "chores", "kid_b", "Empty the trash"), "kid_b", "Empty the trash");
    if (n === 9) { await go(w, n, 9); snap("9am"); await go(w, n, 17); await pay("trashWedOwn", () => tick(B, "chores", "kid_b", "Empty the trash"), "kid_b", "Empty the trash"); }
    if (n === 13) await pay("trashSun", () => tick(B, "chores", "kid_b", "Empty the trash"), "kid_b", "Empty the trash");
    // E · the rows that never fall
    if (n === 8) S.misc.dailyPills = [];
    if (n >= 8 && n <= 10) S.misc.dailyPills.push(pill(rowOf(S.rows[n].kid_c, "Wipe the table")));
    if (n === 10) { await pay("table", () => tick(B, "chores", "kid_c", "Wipe the table"), "kid_c", "Wipe the table"); await pay("fish", () => tick(B, "chores", "kid_c", "Feed the fish"), "kid_c", "Feed the fish"); await pay("lizard", () => tick(B, "chores", "kid_c", "Lizard tank"), "kid_c", "Lizard tank"); }
    if (n === 8) { const i = idxOf(A, "chores", "kid_d", "Water the garden"); S.misc.sent = A.run("amSend('chores','kid_d',_todayDay," + i + ")"); await w.flush(); }
    if (n === 9) { S.misc.gardenOnList = rowOf(S.rows[9].kid_d, "Water the garden"); const id = B.run("(function(){ const L=amFor('kid_d',_todayDay)||[]; return (L[0]||{}).id||''; })()"); S.misc.amId = id;
      await pay("garden", () => B.run("(function(){ day=_todayDay; amToggle('kid_d'," + J(id) + "); })()"), "kid_d", "Water the garden"); }
    // D · Wednesday: a bonus room doubles the reduced amount; held pay holds the reduced amount
    if (n === 9) { await pay("zone", () => tick(B, "chores", "kid_d", "Zoned sweep"), "kid_d", "Zoned sweep");
      await pay("held", () => tick(B, "chores", "kid_c", "Wipe the shelf"), "kid_c", "Wipe the shelf");
      const hid = (linesOf(w, "kid_c", "Wipe the shelf").filter(a => a.held)[0] || {}).id; S.misc.heldId = hid;
      await pay("release", () => A.run("bankHeldRelease('kid_c'," + J(hid) + ")"), "kid_c", "Wipe the shelf"); }
    // C · un-check: the kid the same day (Wed); Mom on Thursday (Wednesday's tick) and on Friday after the drop (Thursday's tick)
    if (n === 9) { await pay("towelsOn", () => tick(B, "chores", "kid_d", "Fold the towels"), "kid_d", "Fold the towels"); S.bank.towels0 = bal(w, "kid_d") - S.pay.towelsOn.paid;
      const i = idxOf(B, "chores", "kid_d", "Fold the towels"); await pay("towelsOff", () => B.run("(function(){ day=_todayDay; toggleRtStep('chores','kid_d'," + i + "); })()"), "kid_d", "Fold the towels"); S.bank.towels1 = bal(w, "kid_d");
      S.bank.towelsLines = linesOf(w, "kid_d", "Fold the towels").length;
      await pay("porchOn", () => tick(B, "chores", "kid_b", "Sweep the porch"), "kid_b", "Sweep the porch"); S.bank.porch0 = bal(w, "kid_b") - S.pay.porchOn.paid; }
    if (n === 10) { const i = idxOf(A, "chores", "kid_b", "Sweep the porch"); S.misc.porchToday = A.run("rtFallPay(rtStepsFor('chores','kid_b',false,'wednesday')[" + i + "],2)");
      await pay("porchOff", () => A.run("choreUndo('chores','kid_b','wednesday'," + i + ")"), "kid_b", "Sweep the porch"); S.bank.porch1 = bal(w, "kid_b");
      await pay("carOn", () => tick(B, "chores", "kid_d", "Wash the car"), "kid_d", "Wash the car"); S.bank.car0 = bal(w, "kid_d") - S.pay.carOn.paid; }
    if (n === 11) { const i = idxOf(A, "chores", "kid_d", "Wash the car"); S.misc.carDropped = !rowOf(S.rows[11].kid_d, "Wash the car");
      await pay("carOff", () => A.run("choreUndo('chores','kid_d','thursday'," + i + ")"), "kid_d", "Wash the car"); S.bank.car1 = bal(w, "kid_d"); }
    // D · Thursday: Mom's tick from the pop-up and the kid's own tick, the same chore value on the same day; the last one finishes the list
    if (n === 10) { tick(B, "chores", "kid_a", "Make the bed"); await w.flush(); await pay("momVac", () => momTick(A, "chores", "kid_a", "Vacuum the den"), "kid_a", "Vacuum the den");
      const ids0 = Object.keys(adj(w, "kid_a")); await pay("kidDust", () => tick(B, "chores", "kid_a", "Dust the shelf"), "kid_a", "Dust the shelf");
      S.misc.bonus = Object.entries(adj(w, "kid_a")).filter(([id]) => ids0.indexOf(id) < 0).map(([id, a]) => [a.note, a.amount]).filter(x => !/Dust the shelf/.test(x[0])).sort(); S.misc.dustBank = S.pay.kidDust.paid; }
  }
  S.misc.amCarry = J(w.get("amCarry/kid_d"));
  void A;
}
console.log("\n── C · un-check takes back exactly what was paid ──");
ok("the kid ticks Fold the towels on Wednesday (1 day late): +8; un-ticks it: the bank is back to the cent, the line removed", S.pay.towelsOn.paid === 8 && S.pay.towelsOff.paid === -8 && S.bank.towels1 === S.bank.towels0 && S.bank.towelsLines === 0, [S.pay.towelsOn, S.pay.towelsOff, S.bank]);
ok("…the un-check's log line carries the 8 it took back (\"off\", 8)", S.pay.towelsOff.act === "off" && S.pay.towelsOff.log === 8, S.pay.towelsOff);
ok("Sweep the porch ticked Wednesday (+8); Mom undoes it Thursday on Wednesday's tab (today's value would be 6): −8, the bank back to the cent", S.pay.porchOn.paid === 8 && S.misc.porchToday === 6 && S.pay.porchOff.paid === -8 && S.bank.porch1 === S.bank.porch0 && S.pay.porchOff.log === 8, [S.pay.porchOn, S.pay.porchOff, S.misc.porchToday]);
ok("Wash the car ticked Thursday (2 days late, +6); Mom undoes it Friday, after it would have dropped (a fresh tick would pay 10): −6, back to the cent", S.pay.carOn.paid === 6 && S.pay.carOff.paid === -6 && S.bank.car1 === S.bank.car0 && S.pay.carOff.log === 6, [S.pay.carOn, S.pay.carOff]);
console.log("\n── D · Mom's tick, held pay, a bonus room, the list and day bonuses ──");
ok("Mom's tick from her Kids today pop-up (Vacuum the den, Thursday, 2 days late) pays what the kid's own tick pays (Dust the shelf, the same day): 6 and 6", S.pay.momVac.paid === 6 && S.pay.kidDust.line === 6 && S.pay.momVac.line === 6 && S.pay.momVac.log === 6 && S.pay.kidDust.log === 6, [S.pay.momVac, S.pay.kidDust]);
ok("held pay (Mom checks before pay): Wipe the shelf on Wednesday holds 8 (not 10), the balance unchanged; Mom releases it: +8", S.pay.held.line === 8 && S.pay.held.held === true && S.pay.held.paid === 0 && S.pay.release.paid === 8 && S.pay.held.log === 8, [S.pay.held, S.pay.release]);
ok("a bonus room at double (Zoned sweep, Wednesday, 1 day late): 16 = twice the 8 it pays today (its own day would be 20)", S.pay.zone.paid === 16 && S.pay.zone.line === 16 && S.pay.zone.log === 16, S.pay.zone);
ok("the 🏁 Chores list bonus (7) and the 🏆 whole-day bonus (3) keep their size when a late row finishes the list (the bank: 6 + 7 + 3)", J(S.misc.bonus) === J([["🏁 Chores list complete", 7], ["🏆 Whole day complete", 3]]) && S.misc.dustBank === 16, [S.misc.bonus, S.misc.dustBank]);
console.log("\n── E · the 3-a-week row falls and keeps its tag; the rows that never fall ──");
const tr = n => rowOf(S.rows[n].kid_b, "Empty the trash");
ok("Empty the trash (Mon Wed Fri, 10 ⭐) on Tuesday, Monday's turn 1 day late: red edge, \"1 day late\", and \"10 → 8 ⭐\"; ticked: 8", /^<div class="mr-step is-late"/.test(tr(8)) && /Empty the trash<span class="rt-late">1 day late<\/span>/.test(tr(8)) && pill(tr(8)) === FALL(10, 8) && S.pay.trashTue.paid === 8 && S.pay.trashTue.log === 8, [tr(8), S.pay.trashTue]);
ok("…on Wednesday, its own day: a plain row \"+10 ⭐\", ticked: 10", !/rt-late|is-late/.test(rowOf(S.rows["9am"].kid_b, "Empty the trash")) && pill(rowOf(S.rows["9am"].kid_b, "Empty the trash")) === ONE(10) && S.pay.trashWedOwn.paid === 10, S.pay.trashWedOwn);
ok("…Friday's turn: Saturday \"1 day late\" 10 → 8, Sunday \"2 days late\" 10 → 6; ticked Sunday: 6", /<span class="rt-late">1 day late<\/span>/.test(tr(12)) && pill(tr(12)) === FALL(10, 8) && /<span class="rt-late">2 days late<\/span>/.test(tr(13)) && pill(tr(13)) === FALL(10, 6) && S.pay.trashSun.paid === 6, [tr(12), tr(13), S.pay.trashSun]);
ok("…the same row in Mom's pop-up and a kid's pop-up: \"Empty the trash 10 → 8 ⭐\" with the red tag, as before", /Empty the trash 10 → 8 ⭐<span class="rt-late">1 day late<\/span>/.test(S.mom[8].kid_b) && /Empty the trash 10 → 8 ⭐<span class="rt-late">1 day late<\/span>/.test(S.kidPop[8].kid_b), popRow(S.mom[8].kid_b, "Empty the trash"));
ok("a daily row (Wipe the table, 5 ⭐) is never late: \"+5 ⭐\" every day, ticked: 5 (held: this kid's pay waits for Mom)", S.misc.dailyPills.every(p => p === ONE(5)) && S.pay.table.line === 5 && S.pay.table.log === 5, [S.misc.dailyPills, S.pay.table]);
ok("a 0 ⭐ row in its wait (Feed the fish, Thursday): no pill, ticked: nothing banked, log 0 (as before)", rowOf(S.rows[10].kid_c, "Feed the fish") && !/mr-pts/.test(rowOf(S.rows[10].kid_c, "Feed the fish")) && S.pay.fish.paid === 0 && S.pay.fish.line === null && S.pay.fish.log === 0, [rowOf(S.rows[10].kid_c, "Feed the fish"), S.pay.fish]);
ok("an as-needed row (Lizard tank, 5 ⭐) pays 5", S.pay.lizard.line === 5 && S.pay.lizard.log === 5 && S.pay.lizard.held === true, S.pay.lizard);
ok("a 🌅 morning-list chore (Water the garden, sent on its day Tuesday): not on Wednesday's Chores list; ticked on the morning list Wednesday: 8, full", S.misc.sent === true && !S.misc.gardenOnList && S.pay.garden.paid === 8 && S.pay.garden.line === 8 && /"pts":8/.test(S.misc.amCarry), [S.misc.sent, S.pay.garden, S.misc.amCarry]);
console.log("\n── F · the blank slate (Sun 11/22): turns due before it pay in full for their whole wait ──");
const vac = n => rowOf(S.rows[n].kid_a, "Vacuum the den"), bikes = n => rowOf(S.rows[n].kid_b, "Wash the bikes");
ok("Vacuum the den, due Tue 11/17: Wednesday and Thursday \"+10 ⭐\" (one number); ticked Thursday 11/19: 10", pill(vac(2)) === ONE(10) && pill(vac(3)) === ONE(10) && S.pay.vacThu1119.paid === 10, [pill(vac(2)), S.pay.vacThu1119]);
ok("Empty the trash, due Fri 11/20: Saturday and Sunday 11/22 \"+10 ⭐\" with the tag; ticked Sunday 11/22 (on the blank-slate day itself): 10", pill(tr(5)) === ONE(10) && /2 days late/.test(tr(6)) && pill(tr(6)) === ONE(10) && S.pay.trashSun1122.paid === 10, [tr(6), S.pay.trashSun1122]);
ok("Wash the bikes, due Sat 11/21: Sunday 11/22 and Monday 11/23 \"+8 ⭐\" (after the date, an older turn); ticked Monday: 8", pill(bikes(6)) === ONE(8) && pill(bikes(7)) === ONE(8) && S.pay.bikesMon1123.paid === 8, [pill(bikes(6)), pill(bikes(7)), S.pay.bikesMon1123]);
ok("…the same chores' next turns fall: Vacuum the den Wed 11/25 \"10 → 8 ⭐\", Thu \"10 → 6 ⭐\"; Wash the bikes Sun 11/29 \"8 → 6 ⭐\", Mon 11/30 \"8 → 5 ⭐\"", pill(vac(9)) === FALL(10, 8) && pill(vac(10)) === FALL(10, 6) && pill(bikes(13)) === FALL(8, 6) && pill(bikes(14)) === FALL(8, 5), [pill(vac(9)), pill(bikes(13)), pill(bikes(14))]);
ok("…Mom's note on a turn from before the date carries no pay: \"from Tue · day 1 of 2\" (Wed 11/18)", /Vacuum the den \+10 ⭐<span[^>]*>from Tue · day 1 of 2<\/span>/.test(S.mom[2].kid_a), popRow(S.mom[2].kid_a, "Vacuum the den"));
ok("(the bonus room is not today's on Tuesday: its own day pays 10, not 20)", S.misc.zoneOwn === "0");
console.log("\n── G · what is shown ──");
const vTue = vac(8), vWed = vac(9), vThu = vac(10);
ok("the kid's row on wait days 1 and 2 = its Tuesday row with only the pill changed: \"+10 ⭐\" → \"10 → 8 ⭐\" → \"10 → 6 ⭐\"", pill(vTue) === ONE(10) && vWed === vTue.replace(ONE(10), FALL(10, 8)) && vThu === vTue.replace(ONE(10), FALL(10, 6)), [vTue, vWed]);
const plainAll = [8, 9, 10, 11, 12, 13, 14].map(n => ["kid_a", "kid_c", "kid_d"].map(k => S.rows[n][k]).join("")).join("");
ok("no list (but the 3-a-week row's own tag) says \"late\" or \"from \" on any day", !/late/i.test(plainAll) && plainAll.indexOf("from ") < 0 && rowsOf(S.rows[13].kid_b).filter(r => r.indexOf("Empty the trash") < 0).every(r => !/late|from /.test(r)));
ok("one number on every row that is not falling: its own day, a daily, as-needed (Lizard tank \"+5 ⭐\")", pill(rowOf(S.rows[8].kid_a, "Dust the shelf")) === ONE(10) && pill(rowOf(S.rows[8].kid_c, "Lizard tank")) === ONE(5));
ok("Mom's Kids today pop-up: \"Vacuum the den 10 → 6 ⭐\" and her note \"from Tue · day 2 of 2 · pays 6 of 10 ⭐\" (Thursday)", /Vacuum the den 10 → 6 ⭐<span[^>]*>from Tue · day 2 of 2 · pays 6 of 10 ⭐<\/span>/.test(S.mom[10].kid_a), popRow(S.mom[10].kid_a, "Vacuum the den"));
ok("…Wednesday: \"from Tue · day 1 of 2 · pays 8 of 10 ⭐\"; Wash the bikes Monday 11/30: \"from Sat · day 2 of 2 · pays 5 of 8 ⭐\"", /from Tue · day 1 of 2 · pays 8 of 10 ⭐</.test(S.mom[9].kid_a) && /Wash the bikes 8 → 5 ⭐<span[^>]*>from Sat · day 2 of 2 · pays 5 of 8 ⭐</.test(S.mom[14].kid_b), popRow(S.mom[14].kid_b, "Wash the bikes"));
ok("a kid's device opening the same pop-up: both numbers, no note (no \"from \", no \"pays\")", /Vacuum the den 10 → 6 ⭐<\/span>/.test(S.kidPop[10].kid_a) && S.kidPop[10].kid_a.indexOf("from ") < 0 && S.kidPop[10].kid_a.indexOf("pays") < 0, popRow(S.kidPop[10].kid_a, "Vacuum the den"));
ok("the 3-a-week row in Mom's pop-up keeps the red tag, not the note (no \"pays\" there; its stars say it)", popRow(S.mom[8].kid_b, "Empty the trash").indexOf("pays") < 0);

// ── G2: the 🧽 house panel ──
{ const { w, B } = await mkWorld(FAM(), CFG());
  for (let n = 0; n < 11; n++) { await go(w, n, 17); teeth(B); await w.flush(); }
  const hp = B.run("hhCleanPanelHTML('kid_a',_todayStr(),_todayDay,'House')");
  ok("the 🧽 house panel (Thursday): Vacuum the den shows \"10 → 6 ⭐\"; no word about why", /Vacuum the den<\/span>.*?<s style="opacity:\.6">10<\/s> → 6 ⭐<\/span>/.test(hp) && !/late|from /.test(hp.slice(hp.indexOf("Vacuum the den"), hp.indexOf("Vacuum the den") + 700)), hp.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300));
}

// ── H ──
console.log("\n── H · nothing else moves: the app before, byte for byte ──");
if (BASE) {
  // H1 · every chore done on its day for 14 days
  const run1 = async index => { let { w, A, B } = await mkWorld(FAM(), CFG(), "preview", index); const snaps = [];
    for (let n = 0; n < 14; n++) { await go(w, n, 7);
      if (dOf(n).getDay() === 0) { w.devs.splice(0); A = w.boot("A", "devA", { mom: true }); B = w.boot("B", "devB"); await w.flush(); }   // devices reload over the week change (as test_chore_wait D)
      const s0 = ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => draw(B, "chores", k)); await w.flush();
      await go(w, n, 17); B.run("day=_todayDay"); teeth(B);
      ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => { const st = JSON.parse(B.run("JSON.stringify(rtStepsFor('chores','" + k + "',false,day))")); st.forEach(x => { if (x && x.cad !== "none" && B.run("cadDueOn(" + J(x.cad || "daily") + ",day)&&stepWindowOk(" + J(x) + ",day)")) tick(B, "chores", k, x.label); }); }); await w.flush();
      snaps.push(J([s0, ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => draw(B, "chores", k)), pop(A, "kid_a", "chores"), pop(A, "kid_b", "chores"), B.run("kcPointsHTML('kid_a')"), J(W.lists(B, { days: [DN[dOf(n).getDay()]] }))])); }
    return { snaps, writes: writes(w, 0).join("\n"), tree: treeJ(w) }; };
  { const N = await run1(undefined), O = await run1(BASE); const bad = N.snaps.map((s, i) => unLS(s) === O.snaps[i] ? null : isoN(i)).filter(Boolean);
    ok("every chore done on its day, 14 days (11/16 … 11/29): every kid list, Mom's pop-ups, Kids' Corner = the app before", bad.length === 0, bad);
    ok("…every write, in order (" + N.writes.split("\n").length + "), and the whole database (bank, log, check-offs) = the app before", N.writes === O.writes && N.tree === O.tree, (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })()); }
  // H2 · a missed week before the blank slate, the late rows ticked on their wait days (all turns due before 11/22)
  const run2 = async index => { const { w, A, B } = await mkWorld(FAM(), CFG(), "preview", index); const snaps = [];
    for (let n = 0; n < 8; n++) { await go(w, n, 17); teeth(B); await w.flush();
      const s0 = ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => draw(B, "chores", k)), p0 = [pop(A, "kid_a", "chores"), pop(A, "kid_b", "chores"), pop(B, "kid_a", "chores")];
      // tick the late ones only (never a row on its day): day 1 of the wait for kid_a/kid_b, day 2 for kid_c/kid_d
      ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => { const L = JSON.parse(B.run("(function(){ day=_todayDay; return JSON.stringify((rtStepsFor('chores','" + k + "',false,day)||[]).map(function(x,i){ return [x.label, rtLateDays('chores','" + k + "',i)]; })); })()"));
        L.forEach(([lb, late]) => { if (late === ((k === "kid_a" || k === "kid_b") ? 1 : 2)) tick(B, "chores", k, lb); }); }); await w.flush();
      snaps.push(J([s0, p0, ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => draw(B, "chores", k)), B.run("kcPointsHTML('kid_d')")])); }
    return { snaps, writes: writes(w, 0).join("\n"), tree: treeJ(w), banks: J(w.get("bank")) }; };
  { const N = await run2(undefined), O = await run2(BASE); const bad = N.snaps.map((s, i) => unLS(s) === O.snaps[i] ? null : isoN(i)).filter(Boolean);
    ok("a missed week before the blank slate (11/16 … 11/23), late rows ticked 1 or 2 days late: every list, pop-up, Kids' Corner = the app before", bad.length === 0, bad);
    ok("…every write, the banks (full stars) and the whole database = the app before", N.writes === O.writes && N.tree === O.tree && /"amount":10\b/.test(N.banks), (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })()); }
  // H3 · the plan ON (slice E is the plan's part): a missed week after the slate, its late plan rows ticked
  const run3 = async index => { const { w, B } = await mkWorld(FAM(), CFG(), "on", index); const snaps = []; let ticked = 0;
    for (let n = 6; n < 13; n++) { await go(w, n, 17); teeth(B); await w.flush();
      const s0 = ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => draw(B, "chores", k));
      if (n >= 9) ["kid_a", "kid_b", "kid_d"].forEach(k => { const L = JSON.parse(B.run("(function(){ day=_todayDay; return JSON.stringify((rtStepsFor('chores','" + k + "',false,day)||[]).map(function(x,i){ return [x.label, !!x.house, x.hdLate||0, rtDoneOn('chores','" + k + "',day,i)]; })); })()"));
        L.forEach(([lb, house, late, done]) => { if (house && late > 0 && !done) { tick(B, "chores", k, lb); ticked++; } }); });
      await w.flush(); snaps.push(J([s0, ["kid_a", "kid_b", "kid_c", "kid_d"].map(k => draw(B, "chores", k))])); }
    return { snaps, ticked, writes: writes(w, 0).join("\n"), tree: treeJ(w) }; };
  { const N = await run3(undefined), O = await run3(BASE); const bad = N.snaps.map((s, i) => unLS(s) === O.snaps[i] ? null : isoN(i + 6)).filter(Boolean);
    ok("the plan ON, 11/22 … 11/28, nothing done then its carried plan rows ticked late (" + N.ticked + " ticks): every list = the app before (no \"→\")", bad.length === 0 && N.ticked > 0 && N.snaps.join("").indexOf("</s> →") < 0, [bad, N.ticked]);
    ok("…every write and the whole database (full stars on each late plan row) = the app before", N.writes === O.writes && N.tree === O.tree); }
} else console.log("  (skipped: the app before)");

if (BASE) try { fs.unlinkSync(BASE); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
