/*
 * test_house_mom_list_shape.js — MPLIST (her "Yes, fix it" 2026-11-19, to the Mom's-list quirk report): with 🏡 Take over on,
 * the first draw of Mom's Day in a page life (mpInit) used to paste the phone's saved copy (ha_momchores) over Mom's list. That
 * copy is written at page start, before today's plan arrives, so it has the TABLE shape: every chore she owns on the table, no
 * plan marks. With the plan ON her 🏡 My day strip then showed chores the plan gave a kid or fit nobody, her House card went empty,
 * and a tick on the "fit nobody" chore was only her own stamp (it came back late the next day). Now, with Take over on, mpInit
 * rebuilds her list from the table (+ today's plan), the same as hhMaterialize does; with Take over off it pastes as before.
 * The whole app runs per device (test_fixtures/house_world.js, a made-up family: kid_a … kid_d, Mom, Dad).
 *   1 plan ON, Monday: the first Mom's Day draw leaves mcAll(), mcDueToday and her House card rows as they were; the chore the
 *     plan gave kid_a and the "fit nobody" chore are not on her list or her strip; a tick on a plan row is done on the plan
 *   2 a saved copy from an earlier day's plan cannot hide today's chores
 *   3 Take over off: the saved copy is still pasted at the first draw (as before)
 *   4 a first draw before any data has arrived (a page start offline, from the phone's saved copies): her table rows, not the
 *     built-in default chores (holds before this change too — the guard that the rebuild never falls back to the defaults)
 *   5 parity with the app before this change (eb5b5aba): plan off, preview and Take over off, a 7-day replay in which Mom's page
 *     starts fresh each morning (same phone storage) and Mom's Day is opened → every person's lists, every write and the whole
 *     database are the same; plan ON → only Mom's list on her own page differs (the fault going away), and what that changes
 *   6 mutation: the fix taken out → the checks of 1 and 2 that are about the fault fail; 3 and 4 still hold
 *   BASE_HTML=/path/to/before/index.html node test_house_mom_list_shape.js   (default: `git show eb5b5aba:index.html`, pinned, so 5
 *   means the same before and after this is on main; no such commit → 5 and the contrasts are skipped with a note)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js")), S = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const IDX = path.join(__dirname, "index.html"), SRC = fs.readFileSync(IDX, "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = o => JSON.stringify(o);
const BEFORE = "eb5b5aba", WAS = "the app before this change (" + BEFORE + ")";
const TMP = [];
let BASE = process.env.BASE_HTML;
if (!BASE) { try { const b = cp.execSync("git show " + BEFORE + ":index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); BASE = path.join(os.tmpdir(), "house_mplist_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); TMP.push(BASE); } catch (e) { BASE = null; } }
console.log("(base: " + (BASE || "none — git show " + BEFORE + " failed; 5 and the contrasts are skipped") + ")");
// The mutation: mpInit's Take over branch taken out (the paste as it was before this change).
const FIX = "try{ if(typeof hhTakeoverOn===\"function\"&&hhTakeoverOn()) _hhRefill(momChoresData,hhDerivePerson(\"mom\"));";
const mutate = s => { if (s.split(FIX).length !== 2) throw new Error("the MPLIST line is not in index.html exactly once"); return s.replace(FIX, "try{ if(false) _hhRefill(momChoresData,hhDerivePerson(\"mom\"));"); };

const MON = "2026-11-16", DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const K = o => Object.assign({ status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
// Mom has, besides the fixture's tea + fridge: a daily planned for her, a Monday chore too big for her limit (fits nobody), and a
// Monday chore kid_a can take (the plan gives it to kid_a). Dad has one more weekly chore.
function hh(mode, takeover) { const h = W.household(mode);
  h.jobs.m_close = K({ src: { kind: "momChore", id: "mc_close" }, label: "Kitchen close-down", who: "mom", slot: "night", cad: "daily", minutes: 10, order: 2, ts: 5 });
  h.jobs.m_tubs = K({ src: { kind: "momChore", id: "mc_tubs" }, label: "Scrub the tub", who: "mom", slot: "", cad: "wk:0", minutes: 15, order: 3, ts: 6 });
  h.jobs.m_wipe = K({ src: { kind: "momChore", id: "mc_wipe" }, label: "Wipe the switches", who: "mom", slot: "", cad: "wk:0", minutes: 10, order: 4, ts: 7, can: ["mom", "kid_a"] });
  h.jobs.d_sweep = K({ src: { kind: "dadChore", id: "dc_sweep" }, label: "Sweep the garage", who: "dad", slot: "", cad: "wk:0", minutes: 15, order: 1, ts: 8 });
  if (takeover === false) h.meta.takeover = 0;
  return h; }
// A page (re)start on the same phone: a new copy of the app whose storage is the old page's storage (the saved copies survive).
function storeFrom(prev) { const m = new Map(prev ? prev.ctx.localStorage._map : []); return { getItem(k) { return m.has(String(k)) ? m.get(String(k)) : null; }, setItem(k, v) { m.set(String(k), String(v)); }, removeItem(k) { m.delete(String(k)); }, clear() { m.clear(); }, key(i) { return Array.from(m.keys())[i] || null; }, get length() { return m.size; }, _map: m }; }
function restart(w, name, prev) { let seed = 0; for (const ch of "devA") seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const d = S.bootDevice({ name, dev: "devA", db: w.db, clock: w.clock, sched: w.sched, family: W.FX.family, indexPath: w.index, globals: { Math: M, localStorage: storeFrom(prev) } });
  d.momOn(); w.devs.push(d); return d; }
const q = (d, e) => JSON.parse(d.run("JSON.stringify(" + e + ")"));
const view = (d, iso, dn) => ({ all: q(d, "mcAll()"), due: q(d, "mcDueToday('" + dn + "')"), card: q(d, "hhCleanRows('mom','" + iso + "','" + dn + "').map(function(r){ return r.id; })"),
  strip: ["Morning tea", "Wipe the fridge", "Kitchen close-down", "Scrub the tub", "Wipe the switches"].filter(l => d.run("momDayStripHTML('" + iso + "','" + dn + "','mom')").indexOf(l) >= 0) });
const draw = d => d.run("tab='moms-plan'; hhRender()");

async function checks(index) {   // → [[name, bool, detail]] (run against this branch, the base and the mutated copy)
  const out = [], c = (n, b, x) => out.push([n, !!b, x]);
  { const w = await W.world({ household: hh("on"), index }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush(); await w.at(2026, 11, 16, 9, 0);
    const plan = w.get("houseDay/" + MON) || {}, v0 = view(A, MON, "monday");
    c("1 (setup) the plan gave Wipe the switches to kid_a, Scrub the tub fit nobody, Kitchen close-down is Mom's", ((plan.plan || {}).m_wipe || {}).who === "kid_a" && !!(plan.over || {}).m_tubs && ((plan.plan || {}).m_close || {}).who === "mom", [(plan.plan || {}).m_wipe, Object.keys(plan.over || {})]);
    draw(A); const v1 = view(A, MON, "monday");
    c("1 the first Mom's Day draw leaves mcAll() as it was (the plan shape)", J(v1.all) === J(v0.all) && !!(v1.all.mc_close || {}).hd, [v0.all.mc_close, v1.all.mc_close]);
    c("1 …mcDueToday (her 🏡 My day strip) as it was", J(v1.due) === J(v0.due), [v0.due, v1.due]);
    c("1 …her House card rows as they were (not empty)", J(v1.card) === J(v0.card) && v1.card.length > 0, [v0.card, v1.card]);
    c("1 the kid's chore and the fit-nobody chore are not on her list, her due list or her strip", !v1.all.mc_wipe && !v1.all.mc_tubs && v1.due.indexOf("mc_wipe") < 0 && v1.due.indexOf("mc_tubs") < 0 && v1.strip.indexOf("Wipe the switches") < 0 && v1.strip.indexOf("Scrub the tub") < 0, v1);
    A.run("hhRender()"); c("1 a second draw: still the same", J(view(A, MON, "monday")) === J(v1));
    A.run("mcToggle('mc_close')"); await w.flush();
    c("1 her tick on a plan row (Kitchen close-down) is done on the plan", !!w.get("houseDay/" + MON + "/done/m_close"), w.get("houseDay/" + MON + "/done"));
    // 2 · a saved copy from Sunday's plan (cad wk:6), the page then restarted on Monday and Mom's Day opened before anything else
    const A2 = restart(w, "A2", A); await w.flush();
    A2.run("HA_LS.setItem('ha_momchores', JSON.stringify({_seeded:true, mc_close:{label:'Kitchen close-down',cad:'wk:6',ts:5,hd:'m_close',slot:'night'}, fridge:{label:'Wipe the fridge',cad:'wk:6',ts:0,hd:'m_fridge'}}))");
    const v2a = view(A2, MON, "monday"); draw(A2); const v2 = view(A2, MON, "monday");
    c("2 a saved copy from an earlier day's plan cannot hide today's chores (due list and House card the same as before the draw)", J(v2.due) === J(v2a.due) && J(v2.card) === J(v2a.card) && v2.due.indexOf("mc_close") >= 0, [v2a.due, v2.due, v2.card]);
  }
  { const w = await W.world({ household: hh("on", false), index }); const A = w.boot("A", "devA", { mom: true }); await w.flush(); await w.at(2026, 11, 16, 9, 0);
    A.run("HA_LS.setItem('ha_momchores', JSON.stringify(Object.assign({}, momChoresData, {zz_saved:{label:'From the saved copy',cad:'daily',ts:1}})))");
    draw(A); c("3 Take over off: the saved copy is still pasted at the first draw (as before)", !!q(A, "mcAll()").zz_saved && q(A, "hhTakeoverOn()") === false);
  }
  { const w = await W.world({ household: hh("on"), index }); const A = w.boot("A", "devA", { mom: true }); await w.flush(); await w.at(2026, 11, 16, 9, 0);
    const A4 = restart(w, "A4", A);   // no flush: Firebase has not answered; only the phone's saved copies
    const pre = q(A4, "Object.keys(momChoresData)"); draw(A4); const v4 = view(A4, MON, "monday"), keys = Object.keys(v4.all).filter(k => k !== "_seeded").sort(), def = q(A4, "Object.keys(MC_DEFAULT)");
    const labels = keys.map(k => v4.all[k].label), defL = q(A4, "Object.keys(MC_DEFAULT).map(function(k){ return MC_DEFAULT[k].label; })");
    c("4 a first draw before any data: her table rows (the five she owns on the table, by their labels), not the built-in default chores", J(keys) === J(["fridge", "mc_close", "mc_tubs", "mc_wipe", "tea"]) && J(labels) === J(["Wipe the fridge", "Kitchen close-down", "Scrub the tub", "Wipe the switches", "Morning tea"]) && J(keys) !== J(def.slice().sort()), { pre, keys, labels, defL });
    await w.flush(); c("4 …and once the data arrives her list is the plan shape", !!(q(A4, "mcAll()").mc_close || {}).hd && !q(A4, "mcAll()").mc_tubs);
  }
  return out;
}

const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
// 7 days from Mon 11/16. Each morning Mom's page starts fresh (same storage) and she opens Mom's Day; at 16:00 the kids tick their
// first house row and Mom ticks the first chore due on her strip; lists at 07:00 (after the draw) and 18:00.
async function replay(mode, takeover, index) {
  const w = await W.world({ household: hh(mode, takeover), index }); const B = w.boot("B", "devB"); let A = null; const shots = [], momShots = [];
  for (let n = 0; n < 7; n++) { const d = new Date(2026, 10, 16 + n), dn = DN[d.getDay()], iso = MON.slice(0, 8) + String(16 + n), at = h => w.at(2026, 11, 16 + n, h, 0);
    await at(7); A = restart(w, "A" + n, A); await w.flush(); draw(A);
    const shot = () => { const L = W.lists(B, { days: [dn] }), M = W.lists(A, { days: [dn] }), mom = { all: M.mom, view: view(A, iso, dn) }; delete M.mom; shots.push(J(L) + J(M)); momShots.push(J(mom)); };
    shot();
    await at(16); for (const k of ["kid_a", "kid_b", "kid_c"]) { B.run("(function(){ const st=rtStepsFor('chores','" + k + "',false,'" + dn + "')||[]; const i=st.findIndex(function(s){ return s&&s.house; }); if(i>=0) toggleRtStep('chores','" + k + "',i); })()"); await w.flush(); }
    A.run("(function(){ const d=mcDueToday('" + dn + "'); if(d.length) mcToggle(d[0]); })()"); await w.flush();
    await at(18); shot(); }
  return { shots, momShots, writes: writes(w, 0).join("\n"), tree: J(w.db.tree.root) }; }

(async () => {
console.log("\n── 1–4 · this branch ──");
const mine = await checks(undefined); mine.forEach(x => ok(x[0], x[1], x[2]));
if (BASE) { const b = await checks(BASE), bf = b.filter(x => !x[1]).map(x => x[0]); console.log("  (before this change these fail: " + bf.join(" | ") + ")");
  ok("(contrast) " + WAS + " fails the checks of 1 and 2 that are about the fault (" + bf.length + " of " + b.length + ") and passes 3 and 4", bf.length >= 4 && bf.some(n => /^1 the first/.test(n)) && bf.some(n => /^2 /.test(n)) && !bf.some(n => /^[34] /.test(n)), bf); }

console.log("\n── 5 · 7-day replay, Mom's page restarted each morning: = " + WAS + " ──");
if (BASE) {
  for (const [mode, to, lab] of [["off", true, "plan off"], ["preview", true, "plan on preview"], ["on", false, "Take over off"]]) {
    const N = await replay(mode, to, undefined), B0 = await replay(mode, to, BASE);
    const bad = N.shots.map((s, i) => s === B0.shots[i] && N.momShots[i] === B0.momShots[i] ? null : i).filter(x => x !== null);
    ok(lab + " · every kid's lists, Mom's and Dad's (both devices), Mom's strip and House card, twice a day for 7 days = " + WAS, bad.length === 0, bad);
    ok(lab + " · every write, in order (" + N.writes.split("\n").length + ") = " + WAS, N.writes === B0.writes, (() => { const x = N.writes.split("\n"), y = B0.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
    ok(lab + " · the whole database = " + WAS + ", byte for byte", N.tree === B0.tree);
  }
  { const N = await replay("on", true, undefined), B0 = await replay("on", true, BASE);
    const other = N.shots.map((s, i) => s === B0.shots[i] ? null : i).filter(x => x !== null), momDiff = N.momShots.map((s, i) => s === B0.momShots[i] ? null : i).filter(x => x !== null);
    ok("plan ON · every kid's lists and Dad's list on both devices, and Mom's list on the kid tablet = " + WAS, other.length === 0, other);
    ok("plan ON · Mom's own list differs on " + momDiff.length + " of " + N.momShots.length + " shots (the stale paste gone) and on this branch it is always the plan shape", momDiff.length > 0 && N.momShots.every(s => { const m = JSON.parse(s); return Object.keys(m.all).filter(k => k !== "_seeded" && k !== "tea").every(k => !!m.all[k].hd); }), momDiff);
    momDiff.slice(0, 2).forEach(i => { const a = JSON.parse(N.momShots[i]).view, b = JSON.parse(B0.momShots[i]).view; console.log("  plan ON · shot " + i + " (day " + (i >> 1) + " 07:00) strip now " + J(a.strip) + " / before " + J(b.strip) + " · House card now " + J(a.card) + " / before " + J(b.card)); });
    const xw = N.writes.split("\n"), yw = B0.writes.split("\n"), onlyN = xw.filter(l => yw.indexOf(l) < 0), onlyB = yw.filter(l => xw.indexOf(l) < 0);
    console.log("  plan ON · writes only on this branch (" + onlyN.length + "): " + J(onlyN.slice(0, 8)) + "\n  plan ON · writes only before (" + onlyB.length + "): " + J(onlyB.slice(0, 8)));
    const ld = (t, p) => p.split("/").reduce((o, k) => (o || {})[k], JSON.parse(t));
    console.log("  plan ON · lastDone of Mom's chores, this branch / before: " + ["m_tea", "m_fridge", "m_close", "m_tubs", "m_wipe"].map(id => id + " " + ld(N.tree, "household/jobs/" + id + "/lastDone") + "/" + ld(B0.tree, "household/jobs/" + id + "/lastDone")).join(" · "));
  }
} else console.log("  (skipped: no " + BEFORE + ")");

console.log("\n── 6 · mutation: the fix taken out ──");
{ const MUT = path.join(os.tmpdir(), "house_mplist_mut_" + process.pid + ".html"); fs.writeFileSync(MUT, mutate(SRC)); TMP.push(MUT);
  const m = await checks(MUT), mf = m.filter(x => !x[1]).map(x => x[0]); console.log("  (with the fix taken out these fail: " + mf.join(" | ") + ")");
  ok("the checks of 1 and 2 that are about the fault now fail (" + mf.length + " of " + m.length + "), 3 and 4 still hold", mf.length >= 4 && mf.some(n => /^1 the first/.test(n)) && mf.some(n => /^2 /.test(n)) && !mf.some(n => /^[34] /.test(n)), mf); }

console.log("\n" + pass + " passed, " + fail + " failed");
for (const p of TMP) try { fs.unlinkSync(p); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); for (const p of TMP) try { fs.unlinkSync(p); } catch (x) {} process.exit(1); });
