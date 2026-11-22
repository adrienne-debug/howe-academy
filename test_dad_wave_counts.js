/*
 * test_dad_wave_counts.js — Dad's wave counts like Mom's in 📊 How often (her words 2026-11-22: "count dads like mom"; the ledger L3
 * report's finding). hhLogState reads a Click-off Log wave line ("<chore> — waved by Mom", act "wave") as "Mom waved it that day → not
 * counted", but stripped only " — waved by Mom", so Dad's line ("— waved by Dad": ✕ today as an unlocked Dad, ➖ Excuse from Dad's link,
 * a plan row's skip) never matched its chore and the day counted as not done. Now " — waved by Mom" and " — waved by Dad" read alike.
 * A made-up family on the whole app (test_fixtures/house_world.js): kid_a and kid_b have the same four chores — Make the bed (daily),
 * Empty the trash (Mon Wed Fri, 3+ a week), Help Dad (daily: a name ending in "Dad"), Greet the bus (waved by the driver) (daily: a name
 * containing "waved by"). Mon 11/16 … Fri 11/27, everything ticked but Wed 11/25 (all four) and Mon 11/23 (the trash). Mom waves
 * kid_a's, Dad waves kid_b's, the same turns the same way: Wed's bed and Help Dad by ✕ today on Wednesday; Mon's trash and Wed's bus by
 * ➖ Excuse from the 📒 Ledger on Thursday (Mom's device / Dad's own link, unlocked).
 * "The app before" = THIS tree with the one change taken out (the regex back to Mom only; no git). DWC_INDEX = another index.html (a
 * mutation check).   run: node test_dad_wave_counts.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.DWC_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
const BASE = (() => { const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8"), a = 'replace(/ — waved by (Mom|Dad)$/,"")', n = s.split(a).length - 1;
  if (n !== 1) throw new Error("test_dad_wave_counts: the app before cannot be built — the change found " + n + "× (must be exactly once)");
  const t = path.join(os.tmpdir(), "dad_wave_before_" + process.pid + ".html"); fs.writeFileSync(t, s.replace(a, 'replace(/ — waved by Mom$/,"")')); return t; })();

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const CH = [["bed", "Make the bed", "🛏", "daily", 2], ["trash", "Empty the trash", "🗑", "wk:0,2,4", 5], ["dad", "Help Dad", "🧰", "daily", 3], ["bus", "Greet the bus (waved by the driver)", "🚌", "daily", 1]];
const FAM = () => { const o = {}; ["a", "b"].forEach(k => CH.forEach(([id, label, emoji, cad, pts], n) => { o[k + "_" + id] = K({ label, emoji, who: "kid_" + k, slot: "chores", cad, pts, order: n }); })); return o; };
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };
const idxOf = (d, kid, label) => d.run("(rtStepsFor('chores','" + kid + "',false,_todayDay)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; })");
const tick = (d, kid, label) => { const i = idxOf(d, kid, label); if (i >= 0) d.run("(function(){ day=_todayDay; toggleRtStep('chores','" + kid + "'," + i + "); })()"); };
async function run(index) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');dadUnlocked=true;1");
  for (const d of [A, Dd]) d.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };tab='moms-plan';1");
  await w.flush();
  for (let n = 0; n <= 11; n++) {
    await go(w, n, 16); const dow = (dOf(n).getDay() + 6) % 7;
    for (const k of ["kid_a", "kid_b"]) CH.forEach(([id, label, , cad]) => { if (n === 9) return; if (id === "trash" && (![0, 2, 4].includes(dow) || n === 7)) return; tick(B, k, label); });
    await w.flush(); await go(w, n, 18);
    B.run("(function(){ day=_todayDay; ['chores'].forEach(function(s){ ROSTER.forEach(function(k){ rtOpen={}; rtSlotHTML(s,k); }); }); })()"); await w.flush();
    if (n === 9) {   // Wednesday: ✕ today on the bed and Help Dad — Mom on kid_a's, Dad (unlocked) on kid_b's
      for (const [d, k] of [[A, "kid_a"], [Dd, "kid_b"]]) ["Make the bed", "Help Dad"].forEach(l => d.run("rtWave('chores','" + k + "',_todayDay," + idxOf(d, k, l) + ");1"));
      await w.flush(); }
    if (n === 10) {   // Thursday: ➖ Excuse in the 📒 Ledger — Monday's trash (gone Wednesday) and Wednesday's bus; Mom's device / Dad's own link
      for (const [d, k] of [[A, "kid_a"], [Dd, "kid_b"]]) { if (d.run("typeof lgShow") !== "function") d.run(HJS); const wk = d.run("activeWk()");
        w.__ex = (w.__ex || []).concat([d.run("lgExcuse('" + k + "','" + wk + "','monday','chores'," + idxOf(d, k, "Empty the trash") + ")"), d.run("lgExcuse('" + k + "','" + wk + "','wednesday','chores'," + idxOf(d, k, "Greet the bus (waved by the driver)") + ")")]); }
      await w.flush(); }
  }
  if (A.run("typeof hoRec") !== "function") A.run(HJS);
  const ho = {}; ["a", "b"].forEach(k => CH.forEach(([id]) => { ho[k + "_" + id] = JSON.parse(A.run("(function(){ const X=hoX(), r=hoRec('" + k + "_" + id + "',X); return JSON.stringify({s:hoSum(r.marks),t:hoText(r),m:r.marks.map(function(x){ return x.m; })}); })()")); }));
  const wave = JSON.parse(A.run("JSON.stringify(Object.keys(hhLogState().wave).sort())"));
  const log = Object.values(((((w.db.tree.root.routineLog || {}).kid_b) || {})) || {}).flatMap(wk => Object.values(wk).flatMap(d => Object.values(d))).filter(e => e && e.act === "wave").map(e => e.label).sort();
  return { ho, wave, log, ex: w.__ex };
}
(async () => {
const X = await run(IDX), B0 = await run(BASE);
const strip = s => s.replace(/^kid_[ab]\|/, "");
console.log("\n── the waves were made ──");
ok("Mom's and Dad's ➖ Excuse taps all said yes (4), in both trees", J(X.ex) === J([true, true, true, true]) && J(B0.ex) === J(X.ex), [X.ex, B0.ex]);
ok("kid_b's Click-off Log has Dad's four wave lines (\"… — waved by Dad\")", J(X.log) === J(["Empty the trash — waved by Dad", "Greet the bus (waved by the driver) — waved by Dad", "Help Dad — waved by Dad", "Make the bed — waved by Dad"]), X.log);
console.log("\n── 📊 How often: Dad's wave counts as Mom's does ──");
CH.forEach(([id, label]) => ok(label + ": Dad's wave (kid_b) reads exactly as Mom's (kid_a): \"" + X.ho["a_" + id].t + "\"", J(X.ho["b_" + id]) === J(X.ho["a_" + id]) && X.ho["a_" + id].s.skip === 1, [X.ho["a_" + id], X.ho["b_" + id]]));
ok("…each of Dad's waved turns moves from not done to \"not counted\" (one fewer not done, one not counted, against the app before; bed and Help Dad by ✕ today, the trash and the bus by ➖ Excuse)", CH.every(([id]) => X.ho["b_" + id].s.drop === B0.ho["b_" + id].s.drop - 1 && X.ho["b_" + id].s.skip === 1 && /1 not counted/.test(X.ho["b_" + id].t)), CH.map(([id]) => [X.ho["b_" + id].t, B0.ho["b_" + id].t]));
ok("the app before: Dad's waves counted as not done (the gap this closes): kid_b's records had no \"not counted\" and differed from kid_a's on all four", CH.every(([id]) => B0.ho["b_" + id].s.skip === 0 && J(B0.ho["b_" + id]) !== J(B0.ho["a_" + id])), CH.map(([id]) => B0.ho["b_" + id].t));
ok("Mom's results are unchanged: kid_a's four records = the app before's, byte for byte", CH.every(([id]) => J(X.ho["a_" + id]) === J(B0.ho["a_" + id])));
console.log("\n── names are not mangled ──");
const ws = X.wave.map(strip);
ok("the wave keys: each chore's own name, for both kids (\"help dad\" keeps its Dad; \"greet the bus (waved by the driver)\" keeps its \"waved by\")", J(X.wave.filter(k => /^kid_a/.test(k)).map(strip)) === J(X.wave.filter(k => /^kid_b/.test(k)).map(strip)) && ws.includes("chores|help dad|2026-11-25") && ws.includes("chores|greet the bus (waved by the driver)|2026-11-25") && ws.includes("chores|empty the trash|2026-11-23") && ws.includes("chores|make the bed|2026-11-25") && X.wave.length === 8, X.wave);
ok("…and in the app before Dad's four kept \"— waved by dad\" in the name, so they never matched a chore", J(B0.wave.filter(k => /^kid_a/.test(k))) === J(X.wave.filter(k => /^kid_a/.test(k))) && B0.wave.filter(k => /^kid_b/.test(k)).length === 4 && B0.wave.filter(k => /^kid_b/.test(k)).every(k => / — waved by dad\|/.test(k)), B0.wave);
console.log("\n" + pass + " passed, " + fail + " failed");
try { fs.unlinkSync(BASE); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE); } catch (x) {} process.exit(1); });
