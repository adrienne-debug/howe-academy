/*
 * test_house_plan_row_days.js — PLANDAYS (her "Yes, fix it" 2026-11-19, Fix 2 of the Mom's-list quirk report): with the plan ON,
 * each of Mom's and Dad's plan rows carries cad "wk:<today>" so it is due today. The strip label and the ✎ Edit day chips read that
 * same field, so a daily chore read "Weekly · Mon" and a tap on "Tue" wrote household/jobs/<id>/cad = "wk:0,1" (the daily chore
 * became Mon+Tue in the table). Now a plan row (one that carries hd) shows and edits the chore's OWN days from the table
 * (the 🚪 PLANDAYS lookup in four places); "wk:<today>" still makes it due today. The whole app runs per device (test_fixtures/house_world.js, a made-up family).
 *   1 plan ON, Monday: a daily, a weekly (Mon) and a carried (Sunday's, laid today) row of Mom's, and Dad's daily and weekly rows:
 *     the strip label and the ✎ Edit chips show the chore's own days; a tap on "Tue" writes exactly what the same tap writes on
 *     preview (never wk:0,1 for a daily); the row stays on today's list once, with its done mark, after the "Re-lay today too /
 *     Keep today" question is answered either way (re-lay follows the chore's new days, as a re-lay does)
 *   2 parity with the app before this change (3b3c128e): plan off and preview, 5 days opening Mom's Day and Dad's Day and editing a
 *     chore's days each day (Mom's day circles, Dad's chips) → every list, the edit pop-ups, every write and the whole database are
 *     the same; plan ON → each day tap writes what the same tap writes on preview (both lists printed), where before this change
 *     it wrote other days
 *   3 mutation: the fix taken out (a plan row's own days = its wk:<today>, in all four places) → the wrong write appears and 1's checks fail
 *   BASE_HTML=/path/to/before/index.html node test_house_plan_row_days.js   (default: `git show 3b3c128e:index.html`, pinned, so 2
 *   means the same before and after this is on main; no such commit → 2 and the contrast are skipped with a note)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const IDX = path.join(__dirname, "index.html"), SRC = fs.readFileSync(IDX, "utf8"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = o => JSON.stringify(o);
const BEFORE = "3b3c128e", WAS = "the app before this change (" + BEFORE + ")";
const TMP = [];
let BASE = process.env.BASE_HTML;
if (!BASE) { try { const b = cp.execSync("git show " + BEFORE + ":index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); BASE = path.join(os.tmpdir(), "house_plandays_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); TMP.push(BASE); } catch (e) { BASE = null; } }
console.log("(base: " + (BASE || "none — git show " + BEFORE + " failed; 2 and the contrast are skipped") + ")");
// The mutation: a plan row's own days are its wk:<today> again (the label, chips and taps as before this change).
const FIX = "((c.hd&&typeof hhJobs===\"function\"&&hhJobs()[c.hd])?(hhJobs()[c.hd].cad||\"daily\"):(c.cad||\"daily\"))";
const mutate = s => { if (s.split(FIX).length !== 5) throw new Error("the PLANDAYS lookup is not in index.html exactly four times"); return s.split(FIX).join("(c.cad||\"daily\")"); };

const MON = "2026-11-16", DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const K = o => Object.assign({ status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
// Mom: the fixture's tea (health, never on the plan) + fridge (daily) + a weekly Monday chore + a Sunday chore (carried to Monday
// when Sunday's goes undone). Dad: the fixture's trash (daily) + a weekly Monday chore. Room enough that the plan keeps each its own.
function hh(mode) { const h = W.household(mode); h.people.mom = { school: 90, weekend: 90 }; h.people.dad = { school: 60, weekend: 60 };
  h.jobs.m_tubs = K({ src: { kind: "momChore", id: "mc_tubs" }, label: "Scrub the tub", who: "mom", slot: "", cad: "wk:0", minutes: 15, order: 3, ts: 6 });
  h.jobs.m_sun = K({ src: { kind: "momChore", id: "mc_sun" }, label: "Change the sheets", who: "mom", slot: "", cad: "wk:6", minutes: 15, order: 4, ts: 7 });
  h.jobs.d_sweep = K({ src: { kind: "dadChore", id: "dc_sweep" }, label: "Sweep the garage", who: "dad", slot: "", cad: "wk:0", minutes: 15, order: 1, ts: 8 });
  return h; }
const q = (d, e) => JSON.parse(d.run("JSON.stringify(" + e + ")"));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// What she sees: the strip row's cadence tag, the ✎ Edit chips lit (Mom's card / Dad's pop-up) and the onclick of the "Tue" chip.
function momSees(d, id, dn) { const c = q(d, "mcAll()['" + id + "']"); if (!c) return null;
  const row = d.run("_mcRow('" + id + "',mcAll()['" + id + "'],_todayStr())"), tag = (row.match(/>((?:Weekly|Every|Daily)[^<]*)<\/span>/) || [null, "(none: daily)"])[1];
  d.run("mcManage=true"); const card = d.run("momChoresCardHTML(_todayStr(),'" + dn + "')"); d.run("mcManage=false");
  const i = card.indexOf(">" + c.label + "<"), seg = card.slice(i, card.indexOf("time of day", i)), lit = [];
  if (new RegExp("mcSetCad\\('" + esc(id) + "','daily'\\)\" style=\"[^\"]*background:#A0622D").test(seg)) lit.push("daily");
  for (let k = 0; k < 7; k++) if (new RegExp("mcCadToggleDay\\('" + esc(id) + "'," + k + "\\)\" style=\"[^\"]*background:#A0622D").test(seg)) lit.push(String(k));
  if (new RegExp("mcSetCad\\('" + esc(id) + "','2w'\\)\" style=\"[^\"]*background:#A0622D").test(seg)) lit.push("2w");
  return { tag, lit, tue: "mcCadToggleDay('" + id + "',1)" }; }
function dadSees(d, id) { const c = q(d, "dcAll()['" + id + "']"); if (!c) return null;
  const row = d.run("_mcRow('" + id + "',dcAll()['" + id + "'],_todayStr(),mdMine('dad'))"), tag = (row.match(/>((?:Weekly|Every|Daily)[^<]*)<\/span>/) || [null, "(none: daily)"])[1];
  const pop = d.run("ddPopHTML(_todayStr(),_todayDay)"), i = pop.indexOf(">" + c.label + "<"), seg = pop.slice(i, pop.indexOf("dcDel(", i)), lit = [];
  const re = new RegExp("onclick=\"(dcSetCad\\('" + esc(id) + "',cadChipNext\\('[^']*','([^']*)'\\)\\))\" style=\"([^\"]*)\"", "g"); let m, tue = null;
  while ((m = re.exec(seg))) { if (/background:#2B7A78/.test(m[3])) lit.push(m[2]); if (m[2] === "1") tue = m[1]; }
  return { tag, lit, tue }; }

// One world, Monday 9:00, the tap on "Tue" for one row → what she saw, the write, and the row after the question.
async function tapCase(index, mode, who, id, answer, tickFirst) {
  const w = await W.world({ household: hh(mode), index }); const A = w.boot("A", "devA", { mom: true }); await w.flush(); await w.at(2026, 11, 16, 9, 0);
  A.run(HJS); await w.flush(); A.run("tab='moms-plan'; hhRender()");
  const sees = who === "dad" ? dadSees(A, id) : momSees(A, id, "monday"), job = Object.keys(w.get("household/jobs")).find(k => { const j = w.get("household/jobs/" + k); return j.who === who && j.src && j.src.id === id; });
  const plan = w.get("houseDay/" + MON) || {}, inPlan = (plan.plan || {})[job] || null;
  if (tickFirst) { A.run(who === "dad" ? "dcToggle('" + id + "')" : "mcToggle('" + id + "')"); await w.flush(); }
  const m = w.mark(); if (sees && sees.tue) { A.run(sees.tue); await w.flush(); }
  const wrote = w.get("household/jobs/" + job + "/cad"), writes = w.since(m).filter(l => (l.path || "").indexOf("household/jobs/" + job + "/cad") >= 0 || J(l.keys || {}).indexOf("household/jobs/" + job + "/cad") >= 0).map(l => [l.op, l.path]);
  const asked = mode === "on" ? A.run("hdAsking('" + MON + "')") : null;
  if (mode === "on" && answer === "keep") { A.run("hdKeep('" + MON + "')"); await w.flush(); }
  if (mode === "on" && answer === "relay") { A.run("hdRelay('" + MON + "')"); await w.flush(); }
  const list = who === "dad" ? q(A, "dcAll()") : q(A, "mcAll()"), due = who === "dad" ? q(A, "ddDueToday('monday')") : q(A, "mcDueToday('monday')");
  const strip = A.run("momDayStripHTML('" + MON + "','monday','" + who + "')"), label = (w.get("household/jobs/" + job) || {}).label;
  return { sees, wrote, writes, asked, inPlan, row: list[id] || null, dueToday: due.indexOf(id) >= 0, onStrip: strip.split(">" + label + "<").length - 1,
    done: who === "dad" ? A.run("dcDoneOn('" + MON + "','" + id + "')") : A.run("mcDoneOn('" + MON + "','" + id + "')"), hdDone: !!w.get("houseDay/" + MON + "/done/" + job) };
}
const ROWS = [ // [who, id, what, own cad, the Tue tap's result from the own cad]
  ["mom", "fridge", "Mom's daily row", "daily", "wk:1"],
  ["mom", "mc_tubs", "Mom's weekly (Mon) row", "wk:0", "wk:0,1"],
  ["mom", "mc_sun", "Mom's carried row (Sunday's, laid today)", "wk:6", "wk:1,6"],
  ["dad", "trash", "Dad's daily row", "daily", "wk:1"],
  ["dad", "dc_sweep", "Dad's weekly (Mon) row", "wk:0", "wk:0,1"]];
const TAG = { daily: "(none: daily)", "wk:0": "Weekly · Mon", "wk:6": "Weekly · Sun" }, LIT = { daily: ["daily"], "wk:0": ["0"], "wk:6": ["6"] };

async function checks(index) {   // → [[name, bool, detail]]
  const out = [], c = (n, b, x) => out.push([n, !!b, x]);
  for (const [who, id, what, own, next] of ROWS) {
    const P = await tapCase(index, "preview", who, id, null), K0 = await tapCase(index, "on", who, id, "keep", true), R0 = await tapCase(index, "on", who, id, "relay", true);
    c(what + ": (setup) on today's plan for " + who + (id === "mc_sun" ? ", carried (late)" : "") + "; the row carries hd and wk:0", !!K0.inPlan && K0.inPlan.who === who && (id !== "mc_sun" || !!K0.inPlan.late) && !!(K0.row || {}).hd || (K0.row === null && !!K0.inPlan), [K0.inPlan, R0.row]);
    c(what + ": the strip reads its own days (" + TAG[own] + "), as on preview", K0.sees.tag === TAG[own] && P.sees.tag === TAG[own], [K0.sees.tag, P.sees.tag]);
    c(what + ": ✎ Edit lights its own days (" + LIT[own] + "), as on preview", J(K0.sees.lit) === J(LIT[own]) && J(P.sees.lit) === J(LIT[own]), [K0.sees.lit, P.sees.lit]);
    c(what + ": the tap on Tue writes " + next + " to the table, exactly what the same tap writes on preview", K0.wrote === next && P.wrote === next && K0.writes.length === 1 && P.writes.length === 1, [K0.wrote, P.wrote, K0.writes, P.writes]);
    c(what + ": the edit raises the \"Re-lay today too / Keep today\" question", K0.asked === true);
    c(what + ": Keep today → still due today, on her strip once, still done (her stamp and the plan's)", K0.dueToday && K0.onStrip === 1 && K0.done && K0.hdDone && /^wk:0$/.test((K0.row || {}).cad || ""), K0);
    c(what + ": Re-lay today too → the done row stays today, once, still done", R0.dueToday && R0.onStrip === 1 && R0.done && R0.hdDone, R0);
  }
  { // an undone daily row tapped to Tue only, then Re-lay: it follows its new days (off today); Keep: it stays today
    const K1 = await tapCase(index, "on", "mom", "fridge", "keep", false), R1 = await tapCase(index, "on", "mom", "fridge", "relay", false);
    c("an undone daily row tapped to Tue only · Keep today → stays on today's list once", K1.dueToday && K1.onStrip === 1, K1);
    c("…Re-lay today too → it follows its new days (Tue only): off today, not doubled, nothing written as done", !R1.dueToday && R1.onStrip === 0 && !R1.done && !R1.hdDone, R1); }
  return out;
}

const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
// 5 days from Mon 11/16. Each day at 8:00 Mom opens Mom's Day + ✎ Edit and taps one day circle on one of her chores; Dad's device
// opens Dad's Day + ✎ Edit and taps one chip on one of his; lists, the pop-ups and the strips at 8:00 and 18:00.
async function replay(mode, index) {
  const w = await W.world({ household: hh(mode), index }); const A = w.boot("A", "devA", { mom: true }), D = w.boot("D", "devD"), B = w.boot("B", "devB"); const shots = [], cadW = [];
  const MT = [["fridge", 1], ["mc_tubs", 2], ["fridge", 1], ["mc_sun", 3], ["tea", 4]], DT = [["trash", "2"], ["dc_sweep", "1"], ["trash", "2"], ["dc_sweep", "daily"], ["trash", "5"]];
  for (let n = 0; n < 5; n++) { const dn = DN[new Date(2026, 10, 16 + n).getDay()], at = h => w.at(2026, 11, 16 + n, h, 0);
    const shot = () => { const L = W.lists(B, { days: [dn] }), M = W.lists(A, { days: [dn] }), Dd = W.lists(D, { days: [dn] });
      A.run("mcManage=true"); const card = A.run("momChoresCardHTML(_todayStr(),'" + dn + "')"); A.run("mcManage=false");
      shots.push(J([L, M, Dd]) + card + D.run("ddPopHTML(_todayStr(),_todayDay)") + A.run("momDayStripHTML(_todayStr(),'" + dn + "','mom')") + D.run("momDayStripHTML(_todayStr(),'" + dn + "','dad')")); };
    await at(8); A.run("tab='moms-plan'; hhRender(); mcManage=true; hhRender()"); D.run("tab='moms-plan'; ddManage=true; hhRender()");
    const m = w.mark(); const [mid, mk] = MT[n]; if (q(A, "!!mcAll()['" + mid + "']")) A.run("mcCadToggleDay('" + mid + "'," + mk + ")"); await w.flush();
    const [did, dk] = DT[n], pop = D.run("ddPopHTML(_todayStr(),_todayDay)"), mm = new RegExp("onclick=\"(dcSetCad\\('" + esc(did) + "',cadChipNext\\('[^']*','" + dk + "'\\)\\))\"").exec(pop); if (mm) D.run(mm[1]); await w.flush();
    w.since(m).forEach(l => (l.keys || [l.path]).filter(p => /\/cad$/.test(p || "")).forEach(p => cadW.push("day " + n + " " + l.op + " " + p + " = " + J(w.get(p)))));
    A.run("mcManage=false"); D.run("ddManage=false"); shot();
    await at(18); shot(); }
  return { shots, writes: writes(w, 0).join("\n"), tree: J(w.db.tree.root), cadW }; }

(async () => {
console.log("\n── 1 · plan ON: the chore's own days, shown and edited ──");
(await checks(undefined)).forEach(x => ok(x[0], x[1], x[2]));
if (BASE) { const b = await checks(BASE), bf = b.filter(x => !x[1]).map(x => x[0]); console.log("  (before this change these fail: " + bf.join(" | ") + ")");
  ok("(contrast) " + WAS + " fails the label, chip and write checks of 1 (" + bf.length + " of " + b.length + ")", bf.filter(n => /the tap on Tue writes/.test(n)).length >= 3 && bf.some(n => /strip reads/.test(n)) && bf.some(n => /✎ Edit lights/.test(n)), bf); }

console.log("\n── 2 · parity: 5 days of Mom's Day + Dad's Day edits = " + WAS + " ──");
if (BASE) { let PV = null;
  for (const mode of ["off", "preview"]) {
    const N = await replay(mode, undefined), B0 = await replay(mode, BASE); if (mode === "preview") PV = N;
    const bad = N.shots.map((s, i) => s === B0.shots[i] ? null : i).filter(x => x !== null);
    ok("plan " + mode + " · every kid's lists, Mom's and Dad's (3 devices), Mom's ✎ Edit card, Dad's ✎ Edit pop-up and both strips, twice a day = " + WAS, bad.length === 0, bad);
    ok("plan " + mode + " · every write, in order (" + N.writes.split("\n").length + ") = " + WAS, N.writes === B0.writes, (() => { const x = N.writes.split("\n"), y = B0.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
    ok("plan " + mode + " · the whole database = " + WAS + ", byte for byte", N.tree === B0.tree);
    ok("plan " + mode + " · (sanity) the replay edited days (" + N.cadW.length + " cad writes)", N.cadW.length >= 8, N.cadW);
  }
  { const N = await replay("on", undefined), B0 = await replay("on", BASE);
    console.log("  plan ON · the day taps' writes, this branch:\n    " + N.cadW.join("\n    ") + "\n  plan ON · the same taps before this change:\n    " + B0.cadW.join("\n    "));
    const v = x => x.cadW.map(l => l.replace(/^day \d+ \w+ /, ""));
    ok("plan ON · each day tap writes what the same tap writes on preview (" + N.cadW.length + " taps, 5 days)", J(v(N)) === J(v(PV)), [v(N), v(PV)]);
    ok("(contrast) " + WAS + " with the plan ON wrote other days for " + v(B0).filter((x, i) => x !== v(PV)[i]).length + " of those taps", J(v(B0)) !== J(v(PV)));
  }
} else console.log("  (skipped: no " + BEFORE + ")");

console.log("\n── 3 · mutation: the fix taken out ──");
{ const MUT = path.join(os.tmpdir(), "house_plandays_mut_" + process.pid + ".html"); fs.writeFileSync(MUT, mutate(SRC)); TMP.push(MUT);
  const m = await checks(MUT), mf = m.filter(x => !x[1]).map(x => x[0]); console.log("  (with the fix taken out these fail: " + mf.join(" | ") + ")");
  const P = await tapCase(MUT, "on", "mom", "fridge", null, false);
  ok("the wrong write appears: Mom's daily row tapped on Tue writes " + J(P.wrote) + " (wk:0,1)", P.wrote === "wk:0,1", P.wrote);
  ok("the label, chip and write checks of 1 fail (" + mf.length + " of " + m.length + ")", mf.filter(n => /the tap on Tue writes/.test(n)).length >= 3 && mf.some(n => /strip reads/.test(n)) && mf.some(n => /✎ Edit lights/.test(n)), mf); }

console.log("\n" + pass + " passed, " + fail + " failed");
for (const p of TMP) try { fs.unlinkSync(p); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); for (const p of TMP) try { fs.unlinkSync(p); } catch (x) {} process.exit(1); });
