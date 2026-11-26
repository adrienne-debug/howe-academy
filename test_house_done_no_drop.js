/*
 * test_house_done_no_drop.js — her "Yes, fix it" (2026-11-25) to "Fix E so a chore you marked done never drops or takes stars?". With the
 * plan ON (slice E, from HD_MISSED_FROM 12/07), Mom's ✓ Done today on an every-N chore during its turn's wait moved only `lastDone`; the
 * next morning's build no longer counted the turn as due and DROPPED it: a drop note, "— not done" in the Click-off Log and −20% in the
 * Star Bank, for a chore that was done. The fix (index.html HDDONEEND + three tagged lines in MISSEDDAY hdCarryM): a carried turn whose
 * chore has a real `lastDone` on or after the turn's `since` ends quietly — in the plan, "fit nobody" (over) and waiting branches.
 * Nothing else: the kid's row after Mom's ✓ stays as it is (still tickable, still pays); Dad has no ✓ Done today. Made-up family only.
 *   A  the app before (this tree with HDDONEEND taken out): all three faults reproduced
 *   B  this tree: none of them; the next turn is Mom's done + 7; the 📒 Ledger has no ✖ for it; F's covered turn unchanged
 *   C  unchanged rules: a ✕ skip is not a done; a last-done from BEFORE the turn does not end it (the drop still happens); a kid's own
 *      tick; the kid's row after Mom's ✓ (still tickable, still pays 8)
 *   D  before 12/07 (plan ON), plan OFF and preview, with ✓ Done today taps: lists, banks, every write, the database = the app before
 *   E  planted faults: the fix removed · "on or after" turned into any last-done · each of the three branches left out
 *   run: node test_house_done_no_drop.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => x == null ? x : JSON.parse(J(x));
const IDX = path.join(__dirname, "index.html"), SRC = fs.readFileSync(IDX, "utf8"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
// the app before: the HDDONEEND block out, its three tagged calls out (absent → this tree IS the app before: B must fail, as it must)
const PIECES = [
  ["if(!p||p.k===\"daily\"||gone(id)||hdDoneEnd(id,p.since||y)) return; /* HDDONEEND */", "if(!p||p.k===\"daily\"||gone(id)) return;"],
  ["if(o&&!gone(id)&&!hdDoneEnd(id,o.since||y)) out.push({id:id,turn:o.turn,k:o.k,since:o.since||y}); });   // HDDONEEND", "if(o&&!gone(id)) out.push({id:id,turn:o.turn,k:o.k,since:o.since||y}); });"],
  ["if(w&&!gone(id)&&!hdDoneEnd(id,w.since||y)) out.push(", "if(w&&!gone(id)) out.push("]];
const HAS = SRC.indexOf("// HDDONEEND_START") >= 0;
const carve = (s, pieces) => { const re = /^\/\/ HDDONEEND_START[^\n]*\n[\s\S]*?^\/\/ HDDONEEND_END\n/m; if ((s.match(new RegExp(re.source, "gm")) || []).length !== 1) throw new Error("test_house_done_no_drop: the HDDONEEND block is not found once");
  s = s.replace(re, ""); pieces.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_house_done_no_drop: piece " + (i + 1) + " found " + n + "×"); s = s.replace(a, () => b); });
  if (/hdDoneEnd|HDDONEEND/.test(s)) throw new Error("test_house_done_no_drop: the app before still mentions the fix"); return s; };
let _tn = 0; const tmp = (tag, s) => { const f = path.join(os.tmpdir(), "donenodrop_" + tag + "_" + process.pid + "_" + (_tn++) + ".html"); fs.writeFileSync(f, s); return f; };   // one path each: the sandbox caches the page by path
const BASE_IDX = HAS ? tmp("before", carve(SRC, PIECES)) : IDX;
console.log(HAS ? "(the app before: this tree with HDDONEEND taken out)" : "(no HDDONEEND block in this tree: it IS the app before — the B checks must fail)");

const dOf = n => new Date(2026, 11, 7 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h == null ? 7 : h, 0); };
const KJ = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 10, slot: "chores" }, o);
const FAM = () => ({
  a_mop: KJ({ label: "Mop the hall", emoji: "🪣", who: "kid_a", cad: "7d", pts: 10, order: 1, lastDone: "2026-11-30" }),               // every 7 days: due Mon 12/07 · on her list
  b_rug: KJ({ label: "Beat the rug", emoji: "🧶", who: "kid_b", cad: "7d", pts: 10, order: 1, minutes: 30, lastDone: "2026-11-30" }),   // 30 min > Kid B's 20: fits nobody
  c_win: KJ({ label: "Wash the window", emoji: "🪟", who: "kid_c", cad: "7d", pts: 10, order: 1, lastDone: "2026-11-30" }),           // skipped Mon; Kid C off Tue → waits with her
  a_vac: KJ({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", cad: "wk:1", pts: 10, order: 2, lastDone: "2026-12-01" }),         // Tuesdays, last done Tue 12/01 (F: covered by a done Mon)
  a_dish: KJ({ label: "Dishes", emoji: "🍽", who: "kid_a", cad: "daily", pts: 5, order: 0, minutes: 5 })
});
const PE = () => ({ kid_a: { school: 60, weekend: 60 }, kid_b: { school: 20, weekend: 20 }, kid_c: { school: 30, weekend: 30 }, kid_d: { school: 0, weekend: 0 }, mom: { school: 0, weekend: 0 }, dad: { school: 0, weekend: 0 } });
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };mwToast=function(m){ __toast.push(m); };tab='moms-plan';confirm=function(){ return true; };1";
async function mkW(index, mode) {
  const w = await W.world({ index, household: { jobs: FAM(), people: PE(), meta: { takeover: 1, engine: { mode: mode || "on", on: "2026-11-23" } } }, tree: { config: clone(W.FX.db.config), calendar: { kidOverrides: { kid_c: { "2026-12-08": { school: false } } } } } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(CAP); B.run(CAP); A.run(HJS); B.run(HJS); await w.flush(); return { w, A, B }; }
const root = w => w.db.tree.root, day = (w, d) => clone(w.get("houseDay/" + d)) || {};
const adj = (w, kid) => (((root(w).bank || {})[kid] || {}).adjustments) || {};
const hdrops = (w, kid, id) => Object.keys(adj(w, kid)).filter(k => /^hdrop_/.test(k) && k.endsWith("_" + id)).map(k => k + " " + adj(w, kid)[k].amount);
const notDone = (w, kid, id) => { const L = (root(w).routineLog || {})[kid] || {}, o = []; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(dn => { if ((L[wk][dn] || {})["miss_h_" + id]) o.push(wk + "/" + dn); })); return o; };
const notes = (w, id) => { const o = []; for (let n = 0; n <= 9; n++) { const m = (day(w, isoN(n)).miss || {})[id]; if (m) o.push(isoN(n) + " " + J(m)); } return o; };
const onList = (d, kid, id) => d.run("(function(){ const d0=day; day=_todayDay; try{ return (rtStepsFor('chores'," + J(kid) + ",false,day)||[]).some(function(x){ return x&&x.house===" + J(id) + "&&x.cad!=='none'; }); } finally{ day=d0; } })()");
const tick = (d, kid, id) => d.run("(function(){ day=_todayDay; const i=(rtStepsFor('chores'," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.house===" + J(id) + "&&x.cad!=='none'; }); if(i<0) return -1; toggleRtStep('chores'," + J(kid) + ",i); return i; })()");
const turnsOn = (w, id) => { const o = []; for (let n = 0; n <= 9; n++) if ((day(w, isoN(n)).plan || {})[id] || (day(w, isoN(n)).over || {})[id] || (day(w, isoN(n)).wait || {})[id]) o.push(isoN(n)); return o; };
const ledgerX = (A, kid) => { const o = []; for (let k = -1; k <= 0; k++) { try { (JSON.parse(A.run("JSON.stringify(lgDayData(" + J(kid) + "," + k + "))")).gone || []).forEach(g => o.push(g.ic + " " + g.nm + " · " + g.note)); } catch (e) {} } return o; };
// the story: Mon 12/07 the three every-7 turns start (Mop on Kid A's list, the Rug fits nobody, the Window on Kid C's list) and nobody does
// them; Tue 12/08 (Kid C off: her Window waits with her) Mom taps ✓ Done today on all three at 10:00 (opts.mom); the builds run to Mon 12/14.
async function story(index, o) { o = o || {}; const S = await mkW(index, o.mode), { w, A, B } = S, r0 = {};
  await go(w, 0, 7); await w.flush(); await go(w, 0, 10); if (o.monVac) A.run("ktDoneToday('a_vac');1"); await w.flush(); if (o.kidMon) { await go(w, 0, 16); r0.kt = tick(B, "kid_a", "a_mop"); await w.flush(); }
  await go(w, 1, 7); await w.flush(); const tue = day(w, isoN(1));
  await go(w, 1, 10); const m0 = w.mark(); if (o.mom !== false) A.run("ktDoneToday('a_mop');ktDoneToday('b_rug');ktDoneToday('c_win');1"); if (o.skip) A.run("hdSkipToggle(" + J(isoN(1)) + ",'a_mop','kid_a');1"); await w.flush();
  const momW = w.since(m0).filter(e => !/^(get|once|on|read)/.test(String(e.op || ""))).map(e => e.op + " " + e.path + " " + J(e.keys || ""));
  const r = Object.assign(r0, { S, tue, momW, rowAfter: onList(B, "kid_a", "a_mop") });
  if (o.kidAfter) { await go(w, 1, 16); r.t = tick(B, "kid_a", "a_mop"); await w.flush(); r.paid = ((day(w, isoN(1)).done || {}).a_mop || {}).pts; }
  for (let n = 2; n <= 8; n++) { await go(w, n, 7); await w.flush(); if (n === 2) { await go(w, 2, 9); r.led = ledgerX(A, "kid_a"); } }
  for (const [kid, id] of [["kid_a", "a_mop"], ["kid_b", "b_rug"], ["kid_c", "c_win"], ["kid_a", "a_vac"]]) r[id] = { notes: notes(w, id), line: notDone(w, kid, id), bank: hdrops(w, kid, id), turns: turnsOn(w, id) };
  r.vacTue = !!((tue.plan || {}).a_vac); return r; }
const none3 = x => !x.notes.length && !x.line.length && !x.bank.length;

(async () => {
console.log("\n── A · the app before: Mom's ✓ Done today during the wait, and the next morning the turn drops anyway ──");
const A0 = await story(BASE_IDX);
ok("(setup) Tue 12/08: the Mop waits on Kid A's list (10 → 8), the Rug fit nobody (offered), the Window waits with Kid C (her day off)", !!(A0.tue.plan || {}).a_mop && !!(A0.tue.over || {}).b_rug && (((A0.tue.wait || {}).c_win) || {}).who === "kid_c", { plan: Object.keys(A0.tue.plan || {}), over: Object.keys(A0.tue.over || {}), wait: Object.keys(A0.tue.wait || {}) });
ok("(setup) Mom's ✓ Done today writes only household/jobs/<id> {lastDone, lastBy}, three times", A0.momW.length === 3 && A0.momW.every(x => /^update household\/jobs\/(a_mop|b_rug|c_win) \["lastDone","lastBy"\]$/.test(x)), A0.momW);
ok("app before · the Mop (on her list): Wednesday's drop note, the \"— not done\" line and a −2 hdrop_ line (" + J(A0.a_mop.bank) + ")", A0.a_mop.notes.some(x => /2026-12-09/.test(x)) && A0.a_mop.line.length === 1 && J(A0.a_mop.bank) === J(["hdrop_week5_monday_kid_a_a_mop -2"]), A0.a_mop);
ok("app before · the Rug (fit nobody): a \"fit nobody\" drop note Wednesday, though Mom did it", A0.b_rug.notes.some(x => /2026-12-09.*"nobody":1/.test(x)), A0.b_rug);
ok("app before · the Window (waiting with Kid C): a drop note and a \"— not done\" line Wednesday (nothing taken: her day off)", A0.c_win.notes.some(x => /2026-12-09.*"who":"kid_c"/.test(x)) && A0.c_win.line.length === 1, A0.c_win);
ok("app before · the 📒 Ledger (Wed morning) shows Kid A a ✖ for the Mop (\"not done in time · 2 ⭐ taken\")", A0.led.some(x => /^✖ .*Mop the hall.*2 ⭐ taken/.test(x)), A0.led);

console.log("\n── B · this tree: a chore Mom marked done never drops or takes stars ──");
const B0 = await story(IDX);
ok("the Mop: no drop note, no \"— not done\" line, no hdrop_ line", none3(B0.a_mop), B0.a_mop);
ok("the Rug (fit nobody): no drop note", none3(B0.b_rug), B0.b_rug);
ok("the Window (waiting): no drop note, no \"— not done\" line", none3(B0.c_win), B0.c_win);
ok("…its clock restarts from her done: each next turn is Tue 12/15 (Mom's done + 7), none before", ["a_mop", "b_rug", "c_win"].every(id => J(B0[id].turns.filter(d => d > "2026-12-08")) === J(["2026-12-15"])), ["a_mop", "b_rug", "c_win"].map(id => B0[id].turns));
ok("the 📒 Ledger (Wed morning): no ✖ for the Mop", !B0.led.some(x => /Mop the hall/.test(x)), B0.led);
ok("📊 How often for the Mop: an every-N chore has no record either way (\"no record yet\"), so nothing reads as dropped", /no record yet/.test(B0.S.A.run("hoText(hoRec('a_mop',hoX()))")));
{ const F0 = await story(BASE_IDX, { monVac: true, mom: false }), F1 = await story(IDX, { monVac: true, mom: false });
  ok("F unchanged: the Vacuum done Mon (Mom's ✓ called directly) is covered Tue in both trees", !F0.vacTue && !F1.vacTue); }

console.log("\n── C · the rules that stay ──");
{ const N = await story(IDX, { mom: false }), O = await story(BASE_IDX, { mom: false });
  ok("nobody marks it done (its last-done 11/30 is BEFORE the turn): the drop still happens — the Mop's −2 and its \"— not done\" line, as the app before", J(N.a_mop) === J(O.a_mop) && N.a_mop.bank.length === 1 && N.a_mop.line.length === 1, N.a_mop);
  ok("…a fixed-day chore last done BEFORE its turn (the Vacuum, last done Tue 12/01, not done Tue 12/08): Friday's drop and its −2, as the app before", J(N.a_vac) === J(O.a_vac) && N.a_vac.notes.some(x => /2026-12-11/.test(x)) && N.a_vac.bank.length === 1, N.a_vac);
  ok("…and the Rug and the Window: the same notes as the app before", J([N.b_rug, N.c_win]) === J([O.b_rug, O.c_win]) && N.b_rug.notes.length === 1);
  ok("…every stored day, list and bank = the app before", J(root(N.S.w).houseDay) === J(root(O.S.w).houseDay) && J(root(N.S.w).bank || {}) === J(root(O.S.w).bank || {}) && J(W.lists(N.S.A)) === J(W.lists(O.S.A))); }
{ const N = await story(IDX, { mom: false, skip: true }), O = await story(BASE_IDX, { mom: false, skip: true });
  ok("a ✕ skip is not a done: Mom's ✕ on the Mop Tue — E's rules, every stored day and bank = the app before", J(root(N.S.w).houseDay) === J(root(O.S.w).houseDay) && J(root(N.S.w).bank || {}) === J(root(O.S.w).bank || {}) && !(root(N.S.w).household.jobs.a_mop.lastDone > "2026-11-30")); }
{ const N = await story(IDX, { mom: false, kidMon: true }), O = await story(BASE_IDX, { mom: false, kidMon: true });
  const sums = w => J(Object.keys(root(w).bank || {}).sort().map(k => [k, Object.values(adj(w, k)).map(a => a.amount + " " + a.note).sort()]));
  ok("a kid's own tick (Kid A ticks the Mop Mon): unchanged — every drop note, list and Star Bank line = the app before, nothing dropped", J(["a_mop", "b_rug", "c_win"].map(id => N[id])) === J(["a_mop", "b_rug", "c_win"].map(id => O[id])) && J(W.lists(N.S.A)) === J(W.lists(O.S.A)) && sums(N.S.w) === sums(O.S.w) && N.kt >= 0 && !N.a_mop.notes.length); }
{ const N = await story(IDX, { kidAfter: true }), O = await story(BASE_IDX, { kidAfter: true });
  ok("the kid's row after Mom's ✓ (not decided, left as it is): still on her list and tickable, pays 8 — as the app before", N.rowAfter && O.rowAfter && N.t >= 0 && N.paid === 8 && O.paid === 8, { n: [N.rowAfter, N.t, N.paid], o: [O.rowAfter, O.t, O.paid] });
  ok("…and once she ticks it, nothing drops in either tree", none3(N.a_mop) && none3(O.a_mop)); }

console.log("\n── D · before 12/07, plan OFF and preview: = the app before ──");
for (const mode of ["on-before", "off", "preview"]) {
  const N = await mkW(IDX, mode === "on-before" ? "on" : mode), O = await mkW(BASE_IDX, mode === "on-before" ? "on" : mode), bad = [], m0 = N.w.mark(), m1 = O.w.mark();
  const at = (w, n, h) => { const d = new Date(2026, 10, 23 + n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };   // from Mon 11/23
  for (let n = 0; n < (mode === "on-before" ? 14 : 21); n++) { const sn = [];
    for (const X of [N, O]) { await at(X.w, n, 7); await X.w.flush(); await at(X.w, n, 10); if (n % 3 === 1) X.A.run("ktDoneToday('a_mop');ktDoneToday('b_rug');1"); if (n % 4 === 2) X.A.run("ktDoneToday('c_win');1");
      for (const [k, id] of [["kid_a", "a_dish"], ["kid_a", "a_mop"], ["kid_c", "c_win"]]) if ((n + id.length) % 3 === 0) tick(X.B, k, id);
      await X.w.flush(); await at(X.w, n, 18); await X.w.flush(); sn.push(J([W.lists(X.A), W.lists(X.B), root(X.w).bank || {}])); }
    if (sn[0] !== sn[1]) bad.push(n); }
  ok(mode + (mode === "on-before" ? " (plan ON, 11/23 – 12/06)" : " (21 days)") + " · every kid's lists (Mom's device and a kid's) and every bank = the app before", bad.length === 0, bad.slice(0, 3));
  ok(mode + " · every write, in order (" + N.w.since(m0).length + "), and the whole database = the app before", J(N.w.since(m0).map(e => e.op + " " + e.path)) === J(O.w.since(m1).map(e => e.op + " " + e.path)) && J(root(N.w)) === J(root(O.w)));
}

console.log("\n── E · planted faults (each must be caught; each names the rule it breaks) ──");
if (HAS) { const FAULTS = [
    ["the fix removed (\"a chore you marked done never drops or takes stars\")", "function hdDoneEnd(id,since){ const l=(hhJobs()[id]||{}).lastDone; return /^\\d{4}-\\d{2}-\\d{2}$/.test(l||\"\")&&!!since&&l>=since; }", "function hdDoneEnd(id,since){ return false; }", ["a_mop", "b_rug", "c_win"]],
    ["\"on or after the turn\" turned into any last-done (a done BEFORE the turn does not end it)", "&&!!since&&l>=since; }", "; }", "before"],
    ["the plan branch left out (a turn on a kid's list)", "if(!p||p.k===\"daily\"||gone(id)||hdDoneEnd(id,p.since||y)) return;", "if(!p||p.k===\"daily\"||gone(id)) return;", ["a_mop"]],
    ["the fit-nobody branch left out", "if(o&&!gone(id)&&!hdDoneEnd(id,o.since||y)) out.push(", "if(o&&!gone(id)) out.push(", ["b_rug"]],
    ["the waiting branch left out", "if(w&&!gone(id)&&!hdDoneEnd(id,w.since||y)) out.push(", "if(w&&!gone(id)) out.push(", ["c_win"]]];
  for (const [rule, a, b, what] of FAULTS) { const n = SRC.split(a).length - 1; if (n !== 1) { ok("fault \"" + rule + "\": its line is found once", false, n); continue; }
    const f = tmp("fault", SRC.replace(a, () => b)); let got;
    if (what === "before") { const r = await story(f, { mom: false }); got = r.a_vac.bank.length ? [] : ["the Vacuum's turn ended by its 12/01 done"]; }
    else { const r = await story(f); got = what.filter(id => !none3(r[id])); }
    try { fs.unlinkSync(f); } catch (e) {}
    ok("fault caught — " + rule + " (" + got.join(", ") + ")", got.length > 0); } }
else ok("planted faults: the fix is not in this tree", false);

console.log("\n" + pass + " passed, " + fail + " failed");
if (HAS) try { fs.unlinkSync(BASE_IDX); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
