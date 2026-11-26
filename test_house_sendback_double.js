/*
 * test_house_sendback_double.js — the hub's find, fixed on her "Yes, fix it" (2026-11-25): with the plan ON, a plan row ticked on a
 * NOT-last day of its wait, then ↩ Send back (🚩 Wasn't done, or Just a mistake), carries to the next day as a waiting row; Mom's Undo of
 * the Send back puts yesterday's tick back — but the row is still on the kid's list today, so the same turn can be ticked and paid twice
 * (main 10 + 10; with slice E 8 + 6). The fix (index.html HDSBDOUBLE, in HOUSEDAY hdRtSteps): a carried plan row whose turn already has a
 * done record on a day from its `since` to yesterday is hidden from the kid's list (read-only; nothing written). Made-up family only.
 *   A  the app before the fix (this tree with HDSBDOUBLE taken out): the double pay, reproduced — 8 + 6 for one turn
 *   B  this tree: the turn pays once (8); the row is gone from her list after the Undo and her tick does nothing; both Undo paths
 *   C  Send back again after the Undo: the row is back on her list today and pays its waiting stars (nothing lost either way)
 *   D  a carried row with no earlier done record (not ticked yesterday): untouched, on her list, pays as before
 *   E  plan OFF and on preview, 14 days with ticks and Send backs: every list, every bank, every write and the database = the app before
 *   F  planted faults, each named for the rule it breaks
 *   run: node test_house_sendback_double.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => x == null ? x : JSON.parse(J(x));
const IDX = path.join(__dirname, "index.html"), SRC = fs.readFileSync(IDX, "utf8"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
// the app before the fix: the HDSBDOUBLE block out and its one call put back (absent → this tree IS the app before: the test then fails, as it must)
const PIECES = [[".filter(function(id){ const p=r.plan[id]; return p&&p.who===kid&&J[id]&&hdSlotOf(J[id])===slot&&!hdSbHid(p,id,iso); })", ".filter(function(id){ const p=r.plan[id]; return p&&p.who===kid&&J[id]&&hdSlotOf(J[id])===slot; })"],
  ["if(m&&m.s===steps&&m.r===r&&m.J===J&&m.h===hdSbSig(r,kid,iso)) return m.v;", "if(m&&m.s===steps&&m.r===r&&m.J===J) return m.v;"],
  ["_hdM[key]={s:steps,r:r,J:J,v:out,h:hdSbSig(r,kid,iso)};", "_hdM[key]={s:steps,r:r,J:J,v:out};"]];
const HAS = SRC.indexOf("// HDSBDOUBLE_START") >= 0;
const carve = (s, pieces) => { const re = /^\/\/ HDSBDOUBLE_START[^\n]*\n[\s\S]*?^\/\/ HDSBDOUBLE_END\n/m; if ((s.match(new RegExp(re.source, "gm")) || []).length !== 1) throw new Error("test_house_sendback_double: the HDSBDOUBLE block is not found once");
  s = s.replace(re, ""); pieces.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_house_sendback_double: piece " + (i + 1) + " found " + n + "×"); s = s.replace(a, () => b); });
  if (/hdSbHid|hdSbSig|HDSBDOUBLE/.test(s)) throw new Error("test_house_sendback_double: the app before still mentions the fix"); return s; };
const BASE_IDX = HAS ? path.join(os.tmpdir(), "sbdouble_before_" + process.pid + ".html") : IDX; if (HAS) fs.writeFileSync(BASE_IDX, carve(SRC, PIECES));
console.log(HAS ? "(the app before the fix: this tree with HDSBDOUBLE taken out)" : "(no HDSBDOUBLE block in this tree: it IS the app before — the B–D checks must fail)");

const dOf = n => new Date(2026, 11, 7 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h == null ? 7 : h, 0); };
const KJ = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 10, slot: "chores" }, o);
const FAM = () => ({
  a_vac: KJ({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", cad: "wk:1", pts: 10, order: 1 }),     // Tuesdays · waits 2 (Auto)
  a_bins: KJ({ label: "Wash the bins", emoji: "🗑", who: "kid_a", cad: "wk:1", pts: 10, order: 2 }),
  b_vac: KJ({ label: "Sweep the porch", emoji: "🧹", who: "kid_b", cad: "wk:1", pts: 10, order: 1 }),
  a_dish: KJ({ label: "Dishes", emoji: "🍽", who: "kid_a", cad: "daily", pts: 5, order: 0 })
});
const PE = () => ({ kid_a: { school: 60, weekend: 60 }, kid_b: { school: 60, weekend: 60 }, kid_c: { school: 0, weekend: 0 }, kid_d: { school: 0, weekend: 0 }, mom: { school: 0, weekend: 0 }, dad: { school: 0, weekend: 0 } });
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';confirm=function(){ return true; };1";
async function mkW(index, mode) {
  const w = await W.world({ index, household: { jobs: FAM(), people: PE(), meta: { takeover: 1, engine: { mode: mode || "on", on: "2026-11-30" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(CAP); B.run(CAP); A.run(HJS); B.run(HJS); await w.flush(); return { w, A, B }; }
const root = w => w.db.tree.root, day = (w, d) => clone(w.get("houseDay/" + d)) || {};
const adj = (w, kid) => (((root(w).bank || {})[kid] || {}).adjustments) || {};
const sumOf = (w, kid, re) => Object.values(adj(w, kid)).filter(a => re.test(a.note || "")).reduce((s, a) => s + (+a.amount || 0), 0);
const idxOf = (d, kid, id, dn) => d.run("(function(){ const d0=day; day=" + J(dn) + "; try{ return (rtStepsFor('chores'," + J(kid) + ",false," + J(dn) + ")||[]).findIndex(function(x){ return x&&x.house===" + J(id) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const onList = (d, kid, id) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores'," + J(kid) + ",false,day)||[]).some(function(x){ return x&&x.house===" + J(id) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const tickToday = (d, kid, id, mom) => d.run("(function(){ day=_todayDay; const i=(rtStepsFor('chores'," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.house===" + J(id) + "&&x.cad!=='none'; }); if(i<0) return -1; " + (mom ? "_rtMomTick=true; " : "") + "try{ toggleRtStep('chores'," + J(kid) + ",i); } finally{ _rtMomTick=false; } return i; })()");
const send = (S, kid, id, dn, a) => { const i = idxOf(S.A, kid, id, dn); return S.A.run("lgSendBack(" + J(kid) + ",activeWk()," + J(dn) + ",'s:chores:" + i + "'," + J(a) + ")"); };
const undoM = (S, kid, id, dn) => { const i = idxOf(S.A, kid, id, dn); return S.A.run("lgSbUndo(" + J(kid) + ",activeWk()," + J(dn) + ",'s:chores:" + i + "')"); };
const undoW = (S, kid) => { const L = (root(S.w).routineLog || {})[kid] || {}; let ref = ""; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(dn => Object.keys(L[wk][dn] || {}).forEach(k => { if (L[wk][dn][k] && L[wk][dn][k].flagged) ref = wk + "/" + dn + "/" + k; }))); return ref ? S.A.run("lgFlagUndo('step'," + J(kid) + "," + J(ref) + ",0)") : "no flagged line"; };
// the story: Tue 12/08 not done · Wed 12/09 (day 1 of its wait) Mom ticks it, then sends it back · Thu 12/10 its build carries it ·
// Thu 9:00 Mom's Undo · Thu 16:00 the kid taps it on her own tablet
async function story(index, how) { const S = await mkW(index), { w, A, B } = S;
  for (let n = 0; n <= 1; n++) { await go(w, n, 7); await w.flush(); }
  await go(w, 2, 7); await w.flush(); await go(w, 2, 10); tickToday(A, "kid_a", "a_vac", true); await w.flush();
  const paidWed = ((day(w, isoN(2)).done || {}).a_vac || {}).pts;
  await go(w, 2, 15); const sb = how === "none" ? null : send(S, "kid_a", "a_vac", "wednesday", how); await w.flush();
  await go(w, 3, 7); await w.flush(); const thu = day(w, isoN(3));
  await go(w, 3, 9); const u = how === "none" ? null : how === "w" ? undoW(S, "kid_a") : undoM(S, "kid_a", "a_vac", "wednesday"); await w.flush();
  const shown = onList(B, "kid_a", "a_vac"), shownMom = onList(A, "kid_a", "a_vac");
  await go(w, 3, 16); const t = tickToday(B, "kid_a", "a_vac", false); await w.flush();
  return { S, paidWed, sb, carried: !!(thu.plan || {}).a_vac, u, shown, shownMom, t, total: sumOf(w, "kid_a", /Vacuum the den/), doneThu: !!((day(w, isoN(3)).done || {}).a_vac) }; }

(async () => {
console.log("\n── A · the app before the fix: the double pay, reproduced ──");
for (const how of ["w", "m"]) { const r = await story(BASE_IDX, how), nm = how === "w" ? "🚩 Wasn't done" : "Just a mistake";
  ok("(setup, " + nm + ") Wed 12/09 Mom ticks the waiting Vacuum (paid " + r.paidWed + " of 10), sends it back; Thursday's build carries it; Undo puts Wednesday's tick back", r.paidWed === 8 && r.sb === true && r.carried && r.u === true);
  ok("app before, " + nm + ": after the Undo the row is still on Kid A's own list Thursday, her tap pays again — " + r.total + " ⭐ for one turn (8 + 6)", r.shown && r.t >= 0 && r.doneThu && r.total === 14, Object.assign({}, r, { S: 0 })); }

console.log("\n── B · this tree: the turn pays once ──");
for (const how of ["w", "m"]) { const r = await story(IDX, how), nm = how === "w" ? "🚩 Wasn't done" : "Just a mistake";
  ok(nm + "'s Undo: Wednesday's tick back (8 ⭐); the carried row is gone from Kid A's list (her tablet and Mom's)", r.u === true && !r.shown && !r.shownMom, Object.assign({}, r, { S: 0 }));
  ok("…her Thursday tap finds no row: nothing written for Thursday, the turn paid once — " + r.total + " ⭐", r.t === -1 && !r.doneThu && r.total === 8, Object.assign({}, r, { S: 0 }));
  if (how === "m") {
    // C · Send back again (Thursday, on Wednesday's row): the done record goes, the row comes back
    const { S } = r, { w, A, B } = S; await go(w, 3, 17); const sb2 = send(S, "kid_a", "a_vac", "wednesday", "m"); await w.flush();
    ok("C · Send back again after the Undo: Wednesday's tick gone (" + sumOf(w, "kid_a", /Vacuum the den/) + " ⭐), and the row is back on Kid A's list today", sb2 === true && sumOf(w, "kid_a", /Vacuum the den/) === 0 && onList(B, "kid_a", "a_vac"));
    await go(w, 3, 18); const t2 = tickToday(B, "kid_a", "a_vac", false); await w.flush();
    ok("…she ticks it Thursday and is paid its waiting stars once (6 of 10): nothing lost either way", t2 >= 0 && sumOf(w, "kid_a", /Vacuum the den/) === 6, sumOf(w, "kid_a", /Vacuum the den/));
    // D · a carried row with no earlier done record: the bins (never ticked) are on her list Thursday and pay as before
    ok("D · the Wash the bins row (carried, never ticked): on her list Thursday, untouched", onList(B, "kid_a", "a_bins"));
    const t3 = tickToday(B, "kid_a", "a_bins", false); await w.flush();
    ok("…ticked Thursday it pays 6 of 10, as the app before", t3 >= 0 && sumOf(w, "kid_a", /Wash the bins/) === 6, sumOf(w, "kid_a", /Wash the bins/));
    ok("…and the hide wrote nothing: the only writes about the Vacuum on Thursday are the Send back's and the tick's", !w.since(0).some(e => /houseDay\/2026-12-10\/(plan|wait|over)\/a_vac/.test(String(e.path || "")) && !/^(get|once|on|read)/.test(String(e.op || "")))); } }
{ const N = await story(IDX, "none"), O = await story(BASE_IDX, "none");
  ok("D · no Send back at all (Wednesday's tick stands): Thursday's lists, stored days and banks = the app before (" + N.total + " ⭐)", N.total === O.total && J(root(N.S.w).houseDay) === J(root(O.S.w).houseDay) && J(W.lists(N.S.A)) === J(W.lists(O.S.A))); }

console.log("\n── E · plan OFF and on preview, 14 days with ticks and Send backs: = the app before ──");
for (const mode of ["off", "preview"]) {
  const N = await mkW(IDX, mode), O = await mkW(BASE_IDX, mode), bad = [], m0 = N.w.mark(), m1 = O.w.mark();
  for (let n = 0; n < 14; n++) { const sn = [];
    for (const S of [N, O]) { await go(S.w, n, 10);
      const dn = S.A.run("_todayDay");
      for (const [kid, label] of [["kid_a", "Vacuum the den"], ["kid_a", "Dishes"], ["kid_b", "Sweep the porch"]]) { const i = S.A.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores'," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'&&cadDueOn(x.cad||'daily',day); }); } finally{ day=d0; } })()");
        if (i >= 0 && (n + label.length) % 2) { S.A.run("(function(){ day=_todayDay; _rtMomTick=true; try{ toggleRtStep('chores'," + J(kid) + "," + i + "); } finally{ _rtMomTick=false; } })()"); if (n % 3 === 0) S.A.run("lgSendBack(" + J(kid) + ",activeWk()," + J(dn) + ",'s:chores:" + i + "','m')"); } }
      await S.w.flush(); await go(S.w, n, 18); await S.w.flush(); sn.push(J([W.lists(S.A), W.lists(S.B), root(S.w).bank || {}])); }
    if (sn[0] !== sn[1]) bad.push(isoN(n)); }
  ok(mode + " · 14 days: every kid's four lists (Mom's device and a kid's) and every bank = the app before", bad.length === 0, bad.slice(0, 3));
  ok(mode + " · every write, in order (" + N.w.since(m0).length + "), and the whole database = the app before", J(N.w.since(m0).map(e => e.op + " " + e.path)) === J(O.w.since(m1).map(e => e.op + " " + e.path)) && J(root(N.w)) === J(root(O.w)));
}

console.log("\n── F · planted faults (each must be caught; each names the rule it breaks) ──");
if (HAS) { const FAULTS = [
    ["the hide never fires (\"nothing is paid twice\")", "if(!p||!(p.since<iso)) return false;", "return false;"],
    ["any carried row hidden, done or not (\"a row with no earlier done record is untouched\")", "for(let d=p.since;d<iso;d=hdAdd(d,1)) if(hdDoneRec(d,id)) return true; return false; }", "return true; }"],
    ["today's own done counted (a row ticked today must stay, checked)", "for(let d=p.since;d<iso;d=hdAdd(d,1))", "for(let d=p.since;d<=iso;d=hdAdd(d,1))"],
    ["the list's memo ignores the done records (a stale list after the Undo)", "if(m&&m.s===steps&&m.r===r&&m.J===J&&m.h===hdSbSig(r,kid,iso)) return m.v;", "if(m&&m.s===steps&&m.r===r&&m.J===J) return m.v;"]];
  for (const [rule, a, b] of FAULTS) { const n = SRC.split(a).length - 1; if (n !== 1) { ok("fault \"" + rule + "\": its line is found once", false, n); continue; }
    const f = path.join(os.tmpdir(), "sbdouble_fault_" + process.pid + ".html"); fs.writeFileSync(f, SRC.replace(a, () => b)); const got = [];
    const r = await story(f, "m"); if (!(r.u === true && !r.shown && r.t === -1 && r.total === 8)) got.push("pays once");
    if (r.S) { const { S } = r, { w, B } = S; if (!onList(B, "kid_a", "a_bins")) got.push("bins untouched");
      await go(w, 3, 17); send(S, "kid_a", "a_vac", "wednesday", "m"); await w.flush(); if (!onList(B, "kid_a", "a_vac")) got.push("back after a second Send back"); }
    { const S = await mkW(f), { w, A } = S; for (let n = 0; n <= 2; n++) { await go(w, n, 7); await w.flush(); } await go(w, 2, 10); tickToday(A, "kid_a", "a_vac", true); await w.flush();
      if (!A.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores','kid_a',false,day)||[]).some(function(x){ return x&&x.house==='a_vac'&&x.cad!=='none'; }); } finally{ day=d0; } })()")) got.push("ticked today stays"); }
    // the memo: draw the list, then put Wednesday's done record in place with no listener reset, draw again
    { const S = await mkW(f), { w, A } = S; for (let n = 0; n <= 2; n++) { await go(w, n, 7); await w.flush(); } await go(w, 3, 7); await w.flush(); await go(w, 3, 9);
      const before = onList(A, "kid_a", "a_bins"); A.run("houseDayData[" + J(isoN(2)) + "].done=Object.assign({},houseDayData[" + J(isoN(2)) + "].done,{a_bins:{who:'kid_a',pts:8,at:Date.now()}});1");
      if (!(before && !onList(A, "kid_a", "a_bins"))) got.push("memo follows the done records"); }
    try { fs.unlinkSync(f); } catch (e) {}
    ok("fault caught — " + rule + " (" + got.length + " fail: " + got.join(", ") + ")", got.length > 0); } }
else ok("planted faults: the fix is not in this tree", false);

console.log("\n" + pass + " passed, " + fail + " failed");
if (HAS) try { fs.unlinkSync(BASE_IDX); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
