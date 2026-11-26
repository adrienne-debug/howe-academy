/*
 * test_house_record_stored.js — slice G of DESIGN_missed_chores_2026-11-19 (§5, §8 row G): "The record reads the stored days". With the
 * plan ON, 📊 How often (🏠 Whole house, a room page, 👤 By person) and the chore card's History line read each turn of a chore the plan
 * hands out from houseDay/<iso> (today and the 14 days before, what a device holds): whose turn it was, who did it and what it paid, what
 * its drop took, "fit nobody", ✕ skipped / ➖ excused, and a turn covered by an early done (slice F) — instead of the grid's guess by the
 * chore's owner and its name in the Click-off Log. house.js HORECSTORED (+ six lines in HOWOFTEN). Reads only. Made-up family only.
 *   A  plan ON, two weeks (12/07 – 12/20) on a made-up family: every mark = what the stored days say (by hand), turn by turn; the person
 *      filter follows the turn; the line and the counts; the History line's "Last checked off"
 *   B  the grid as before where the plan did not store a day (older than the 14 days) and for a chore the plan does not hand out
 *   C  plan OFF and on preview, 35 days with ticks: every kid list, every bank, every 📊 card and History line, every write and the database
 *      = the app before G
 *   D  nothing is written by any draw (plan ON)
 *   E  planted faults, each named for the rule it breaks: every one is caught
 *   F  a plan drop Mom then ➖ Excused reads – not counted, "· excused", out of "dropped" and of "of the last N" (+ the hub's g5 fault)
 * "The app before G" = this tree with the HORECSTORED block taken out and its six HOWOFTEN lines put back.  run: node test_house_record_stored.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => x == null ? x : JSON.parse(J(x));
const IDX = path.join(__dirname, "index.html"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
// ── the app before G: test_fixtures/carve_g.js (HORECSTORED out, the HOWOFTEN lines back) ──
const CG = require(path.join(__dirname, "test_fixtures", "carve_g.js"));
const BASE_HJS = CG.hjs(HJS);
console.log("(the app before G: this tree's house.js with HORECSTORED taken out and its six HOWOFTEN lines put back)");

const dOf = n => new Date(2026, 11, 7 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h == null ? 7 : h, 0); };
const KJ = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 10, slot: "chores" }, o);
const FAM = () => ({
  a_dish: KJ({ label: "Dishes", emoji: "🍽", who: "kid_a", cad: "daily", pts: 10, order: 1, can: ["kid_b"] }),
  a_vac: KJ({ label: "Vacuum", emoji: "🧹", who: "kid_a", cad: "wk:1", pts: 10, order: 2, minutes: 15 }),             // Tuesdays
  a_dust: KJ({ label: "Dust", emoji: "🪶", who: "kid_a", cad: "wk:3", pts: 10, order: 3, can: ["kid_b"] }),           // Thursdays
  b_sink: KJ({ label: "Sink", emoji: "🚰", who: "kid_b", cad: "daily", pts: 10, order: 1 }),
  b_tub: KJ({ label: "Tub", emoji: "🛁", who: "kid_b", cad: "wk:2", pts: 20, order: 2 }),                             // Wednesdays
  c_toys: KJ({ label: "Toys", emoji: "🧩", who: "kid_c", cad: "daily", pts: 5, order: 1, minutes: 5 }),
  c_shoes: KJ({ label: "Shoes", emoji: "👟", who: "kid_c", cad: "wk:4", pts: 5, order: 2, minutes: 30 }),            // Fridays · fits nobody (limit 10)
  h_teeth: KJ({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 })
});
const PE = () => ({ kid_a: { school: 40, weekend: 40 }, kid_b: { school: 30, weekend: 30 }, kid_c: { school: 10, weekend: 10 }, kid_d: { school: 0, weekend: 0 }, mom: { school: 0, weekend: 0 }, dad: { school: 0, weekend: 0 } });
const CAP = "globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };globalThis.__toast=[];gwShowToast=function(m){ __toast.push(m); };tab='moms-plan';confirm=function(){ return true; };1";
async function mkW(hjs, mode) {
  const w = await W.world({ index: IDX, household: { jobs: FAM(), people: PE(), meta: { takeover: 1, engine: { mode: mode, on: "2026-11-30" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(CAP); B.run(CAP); A.run(hjs); B.run(hjs); await w.flush(); return { w, A, B }; }
const root = w => w.db.tree.root, day = (w, d) => clone(w.get("houseDay/" + d)) || {};
const bankOf = w => J(Object.keys(root(w).bank || {}).sort().map(k => [k, root(w).bank[k]]));
const tick = (d, kid, label) => d.run("(function(){ day=_todayDay; const i=(rtStepsFor('chores'," + J(kid) + ",false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); if(i<0) return -1; _rtMomTick=true; try{ toggleRtStep('chores'," + J(kid) + ",i); } finally{ _rtMomTick=false; } return i; })()");
const rec = (A, id) => JSON.parse(A.run("JSON.stringify(hoRec(" + J(id) + ",hoX()))"));
const recTxt = (A, id) => A.run("hoText(hoRec(" + J(id) + ",hoX()))");
const card = (A, f) => A.run("(function(){ hoKey=''; hoFilter(); hoF=" + J(f) + "; hoAll=true; return hoCardHTML(); })()");
const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const marksOf = (r, from) => (r.marks || []).filter(m => m.n >= from).map(m => [m.m, m.who, m.by || "", m.q || 0, m.pts == null ? "" : m.pts, m.dk ? m.dk.n : ""].join(" "));
const DN = iso => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8)) / 864e5);

(async () => {
// ════════════════════════════════ A · plan ON, two weeks ════════════════════════════════
console.log("\n── A · plan ON, two weeks (Mon 12/07 – Sun 12/20): the record = the stored days ──");
const S = await mkW(HJS, "on"), { w, A } = S;
// the script of the two weeks (who ticks what on which day); everything else is left undone
const PLAY = {
  0: [["kid_a", "Dishes"], ["kid_b", "Sink"]],
  1: [["kid_b", "Sink"]],                                   // Tue: Vacuum not done (waits Wed/Thu)
  2: [["kid_a", "Vacuum"], ["kid_b", "Tub"]],               // Wed: Vacuum done a day late
  3: [["kid_b", "Sink"]],                                   // Thu: Dust left undone (drops by Sunday)
  7: [["kid_a", "Dishes"]],
  8: [["kid_a", "Vacuum"]],                                 // Tue: Vacuum on its day
  9: [],                                                    // Wed: Tub not done → drops Sat
  10: [["kid_b", "Dust"]],                                  // Thu 12/17: Mom gives Kid A's Dust to Kid B (→ Give to…), Kid B does it
};
const MOM = (A, n) => { if (n === 7) A.run("(function(){ const r=hdLive(" + J(isoN(7)) + "); if(r&&r.plan&&r.plan.b_sink) hdSkipToggle(" + J(isoN(7)) + ",'b_sink','kid_b'); })()");   // Mom ✕ skips Kid B's sink on Mon 12/14
  if (n === 10) A.run("hdGive(" + J(isoN(10)) + ",'a_dust','kid_b');1");
  if (n === 6) A.run("lgHExcuse('kid_a'," + J(isoN(6)) + ",'a_dust')"); };   // Sun 12/13: Mom ➖ Excuses the Dust turn dropped that morning (the 📒 Ledger reaches it)
const m0 = w.mark();
for (let n = 0; n < 14; n++) { await go(w, n, 7); await w.flush(); await go(w, n, 10);
  MOM(A, n); (PLAY[n] || []).forEach(([k, l]) => tick(A, k, l));
  await w.flush(); await go(w, n, 20); await w.flush(); }
await go(w, 14, 9); await w.flush();   // Mon 12/21, 9:00: the record looks back from today
const wr = w.since(m0).length;
// by hand, from the stored days: a turn's since, who had it, done when / by whom / for how much, its drop
const T0 = DN("2026-12-07"), dump = {}; for (let n = 0; n <= 14; n++) dump[isoN(n)] = day(w, isoN(n));
const exp = id => { const T = {}; Object.keys(dump).sort().forEach(iso => { const r = dump[iso], p = (r.plan || {})[id], wt = (r.wait || {})[id], o = (r.over || {})[id], m = (r.miss || {})[id], d = (r.done || {})[id], k = (r.skip || {})[id];
    const at = s => T[s] || (T[s] = {}); if (p) { at(p.since).who = p.who; if (k) at(p.since).skip = 1; } if (wt) at(wt.since).who = wt.who; if (o) at(o.since).over = 1;
    if (d) { const t = at((p || o || {}).since || iso); if (t.at === undefined) { t.at = iso; t.by = d.who; t.pts = d.pts; } } if (m) at(m.since).miss = m; }); return T; };
ok("the two weeks ran: 15 stored days, Vacuum ticked twice, the Tub's 12/16 turn and the Dust's 12/10 turn dropped (the Dust's then ➖ Excused by Mom), Shoes fit nobody", Object.values(dump).filter(r => r.built && r.built.ok).length === 15 && !!((dump["2026-12-13"].miss || {}).a_dust || {}).x && !!(dump["2026-12-19"].miss || {}).b_tub && Object.values(dump).some(r => r.miss && r.miss.c_shoes && r.miss.c_shoes.nobody), Object.keys(dump).map(k => k + ":" + Object.keys(dump[k].miss || {}).join(",")));
for (const id of ["a_vac", "a_dust", "b_tub", "c_shoes"]) {
  const T = exp(id), r = rec(A, id), got = (r.marks || []).filter(m => m.n >= T0), want = [];
  Object.keys(T).sort().forEach(s => { const t = T[s], n = DN(s); if (t.skip) return want.push("skip"); if (t.at) return want.push((t.at === s ? "on" : "late") + " " + (t.who || "") + " " + t.by + " " + (DN(t.at) - n) + " " + t.pts); if (t.miss) return want.push(t.miss.x ? "skip" : t.miss.nobody ? "nobody " : "drop " + t.miss.who); });
  const gs = got.map(m => m.m === "skip" ? "skip" : m.m === "nobody" ? "nobody " : m.m === "drop" ? "drop " + m.who : m.m + " " + m.who + " " + m.by + " " + (m.q || 0) + " " + m.pts);
  ok("📊 " + id + ": one mark per stored turn, each the stored day's (" + (gs.join(" | ") || "none") + ")", J(gs) === J(want) && got.every(m => m.pl === 1), { got: gs, want }); }
{ const v = rec(A, "a_vac").marks.filter(m => m.n >= T0);
  ok("Vacuum, Tue 12/08: ◐ done 1 day late by Kid A, paid what done/<id> says (" + (v[0] && v[0].pts) + " ⭐); Tue 12/15: ● on its day", v[0] && v[0].m === "late" && v[0].q === 1 && v[0].pts === dump["2026-12-09"].done.a_vac.pts && v[1] && v[1].m === "on"); }
{ const t = rec(A, "b_tub").marks.filter(m => m.n >= T0), dr = dump["2026-12-19"].miss.b_tub;
  ok("Tub, Wed 12/16: ○ dropped with what it took (" + (dr.drop && dr.drop.n) + " ⭐), as LEDGERDROP reads the \"— not done\" line", t[1] && t[1].m === "drop" && (!(dr.drop && dr.drop.n > 0) || (t[1].dk && t[1].dk.n === dr.drop.n)), t[1]); }
{ const sh = rec(A, "c_shoes"), s = sh.marks.filter(m => m.n >= T0);
  ok("Shoes (fit nobody, all through its wait): ◌, with no kid's name on it, and \"fit nobody\" in its text", s.length > 0 && s.every(m => m.m === "nobody" && m.who === "") && /fit nobody/.test(recTxt(A, "c_shoes")), { s, t: recTxt(A, "c_shoes") });
  const pc = strip(card(A, { k: "who", id: "kid_c" }));
  ok("…and on 👤 kid_c's 📊 it counts nothing against her (no ◌, no dropped)", !/◌/.test(card(A, { k: "who", id: "kid_c" }).split("Shoes")[1] || "") && !/Shoes[^·]*· [0-9]+ dropped/.test(pc)); }
{ const sk = rec(A, "b_sink"); ok("Sink is a daily (3+ a week): its count reads the stored days too — Mon 12/14 ✕ skipped by Mom is – not counted", sk.form === "count" && sk.marks.some(m => m.n === DN(isoN(7)) && m.m === "skip" && m.pl === 1 && m.wv === 1), sk.marks.filter(m => m.n >= T0).map(m => m.m)); }
const dailyWant = id => { const out = []; for (let n = 0; n < 14; n++) { const r = dump[isoN(n)], p = (r.plan || {})[id]; if (!p || p.since !== isoN(n)) continue; out.push((r.skip || {})[id] ? "skip" : (r.done || {})[id] ? "on" : "drop " + p.who); } return out; };
const dailyGot = (Af, id) => JSON.parse(Af.run("JSON.stringify(hoRec(" + J(id) + ",hoX()))")).marks.filter(m => m.n >= T0).map(m => m.m === "drop" ? "drop " + m.who : m.m);
ok("Dishes and Sink (dailies): each stored day's turn — ● done, – Mom's ✕ skip, ○ not done (a daily on her list and not done is a missed day, as the grid counts it; the plan files no note for it)", J(dailyGot(A, "b_sink")) === J(dailyWant("b_sink")) && J(dailyGot(A, "a_dish")) === J(dailyWant("a_dish")) && dailyWant("b_sink").some(x => /^drop/.test(x)), { got: dailyGot(A, "b_sink"), want: dailyWant("b_sink") });
{ const h = A.run("hoMarksHTML(hoRec('a_vac',hoX()))");
  ok("the mark's tip says who did it and what it paid (\"…by Kid A · paid N ⭐\")", /done 1 day late by [^"]+ · paid \d+ ⭐/.test(h), h.slice(0, 400)); }
{ const hist = strip(A.run("hoHistHTML('a_dust')"));
  const nb = A.run("hhWhoName('kid_b')");
  ok("the chore card's History: \"Last checked off 12/17 by " + nb + "\" (Kid A's Dust, given to Kid B) (the plan's tick stamps lastDone / lastBy by chore)", hist.indexOf("Last checked off 12/17 by " + nb) >= 0, hist);
  const du = rec(A, "a_dust").marks.filter(m => m.n >= T0);
  ok("…and its 📊 mark for Thu 12/17 is Kid B's turn, done by Kid B (who had it, who did it — by chore)", du[1] && du[1].who === "kid_b" && du[1].by === "kid_b" && du[1].m === "on", du);
  ok("…on 👤 Kid B's 📊 the Dust is there (her turn that day), on Kid A's only her own 12/10 turn", JSON.parse(A.run("JSON.stringify(hoSee(hoRec('a_dust',hoX()),{k:'who',id:'kid_b'}))")).marks.filter(m => m.n >= T0).length === 1 && JSON.parse(A.run("JSON.stringify(hoSee(hoRec('a_dust',hoX()),{k:'who',id:'kid_a'}))")).marks.filter(m => m.n >= T0).length === 1); }
ok("A · drawing every card and History line wrote nothing (" + (w.since(w.mark()).length) + " writes)", (() => { const m = w.mark(); ["all"].forEach(() => { card(A, { k: "all" }); card(A, { k: "who", id: "kid_a" }); A.run("hoHistHTML('a_vac')"); }); return w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || ""))).length === 0; })());

// ════════════════════════════════ B · where the plan did not store a day: the grid ════════════════════════════════
console.log("\n── B · older days, and chores the plan does not hand out: the grid, as before ──");
{ const B0 = await mkW(BASE_HJS, "on"); for (let n = 0; n < 14; n++) { await go(B0.w, n, 7); await B0.w.flush(); await go(B0.w, n, 10); MOM(B0.A, n); (PLAY[n] || []).forEach(([k, l]) => tick(B0.A, k, l)); await B0.w.flush(); await go(B0.w, n, 20); await B0.w.flush(); }
  await go(B0.w, 14, 9); await B0.w.flush();
  ok("the same two weeks in the app before G: every list and every bank the same (G reads only)", J([W.lists(A), bankOf(w)]) === J([W.lists(B0.A), bankOf(B0.w)]));
  ok("…and the same database, byte for byte", J(root(w)) === J(root(B0.w)));
  ok("health rows (not the plan's): Brush teeth's record = the app before's", J(rec(A, "h_teeth")) === J(rec(B0.A, "h_teeth")));
  const old = r => J((r.marks || []).filter(m => m.n < DN(isoN(14)) - 15));
  ok("every mark older than the stored days (before 12/06) = the app before's, for every chore", ["a_dish", "a_vac", "a_dust", "b_sink", "b_tub", "c_toys", "c_shoes"].every(id => old(rec(A, id)) === old(rec(B0.A, id))));
  ok("…and the app before G got these two weeks wrong (the reason for G): it shows the Shoes as ○ dropped against Kid C, never \"fit nobody\"", rec(B0.A, "c_shoes").marks.some(m => m.n >= T0 && m.m === "drop" && m.who === "kid_c"));
}

// ════════════════════════════════ C · off and preview = the app before G ════════════════════════════════
console.log("\n── C · plan OFF and on preview, 35 days with ticks: = the app before G ──");
for (const mode of ["off", "preview"]) {
  const N = await mkW(HJS, mode), O = await mkW(BASE_HJS, mode), bad = [], m0 = N.w.mark(), m1 = O.w.mark();
  for (let n = 0; n < 35; n++) { const sn = [];
    for (const X of [N, O]) { await go(X.w, n, 9);
      for (const [kid, label] of [["kid_a", "Dishes"], ["kid_b", "Sink"], ["kid_c", "Toys"], ["kid_a", "Vacuum"], ["kid_b", "Tub"], ["kid_a", "Dust"]]) if ((n + label.length) % 3) tick(X.A, kid, label);
      await X.w.flush(); await go(X.w, n, 18); await X.w.flush();
      const o = { lists: J(W.lists(X.A)), kid: J(W.lists(X.B)), bank: bankOf(X.w) };
      if (n % 5 === 4) { o.cards = ["all", "kid_a", "kid_b", "kid_c"].map(k => card(X.A, k === "all" ? { k: "all" } : { k: "who", id: k })).join("\n"); o.hist = ["a_vac", "a_dust", "b_tub", "c_shoes", "b_sink"].map(id => X.A.run("hoHistHTML(" + J(id) + ")")).join("\n"); }
      sn.push(o); }
    Object.keys(sn[0]).forEach(k => { if (sn[0][k] !== sn[1][k]) bad.push(isoN(n) + " " + k); }); }
  ok(mode + " · 35 days: every kid's four lists (Mom's device and a kid's) and every bank = the app before G", !bad.some(x => / (lists|kid|bank)$/.test(x)), bad.slice(0, 3));
  ok(mode + " · every 📊 How often card (whole house, each kid) and every History line, every 5th day = the app before G, byte for byte", !bad.some(x => / (cards|hist)$/.test(x)), bad.slice(0, 3));
  ok(mode + " · every write in 35 days, in order (" + N.w.since(m0).length + "), and the whole database = the app before G", J(N.w.since(m0).map(e => e.op + " " + e.path)) === J(O.w.since(m1).map(e => e.op + " " + e.path)) && J(root(N.w)) === J(root(O.w)));
}

// ════════════════════════════════ E · planted faults ════════════════════════════════
console.log("\n── E · planted faults (each must be caught; each names the rule it breaks) ──");
// a fault is applied to house.js on Mom's device A (the world from A), its record re-read, and the A checks re-run
const checksA = (Af) => { const R = [];
  for (const id of ["a_vac", "a_dust", "b_tub", "c_shoes"]) { const T = exp(id), r = JSON.parse(Af.run("JSON.stringify(hoRec(" + J(id) + ",hoX()))")), want = [];
    Object.keys(T).sort().forEach(s => { const t = T[s], n = DN(s); if (t.skip) return want.push("skip"); if (t.at) return want.push((t.at === s ? "on" : "late") + " " + (t.who || "") + " " + t.by + " " + (DN(t.at) - n) + " " + t.pts); if (t.miss) return want.push(t.miss.x ? "skip" : t.miss.nobody ? "nobody " : "drop " + t.miss.who); });
    const gs = (r.marks || []).filter(m => m.n >= T0).map(m => m.m === "skip" ? "skip" : m.m === "nobody" ? "nobody " : m.m === "drop" ? "drop " + m.who : m.m + " " + m.who + " " + m.by + " " + (m.q || 0) + " " + m.pts);
    R.push([id, J(gs) === J(want)]); }
  R.push(["fit nobody text", /fit nobody/.test(Af.run("hoText(hoRec('c_shoes',hoX()))"))]);
  R.push(["skip by Mom", JSON.parse(Af.run("JSON.stringify(hoRec('b_sink',hoX()))")).marks.some(m => m.n === DN(isoN(7)) && m.m === "skip" && m.wv === 1)]);
  R.push(["dailies", J(dailyGot(Af, "b_sink")) === J(dailyWant("b_sink")) && J(dailyGot(Af, "a_dish")) === J(dailyWant("a_dish"))]);
  R.push(["history", strip(Af.run("hoHistHTML('a_dust')")).indexOf("Last checked off 12/17 by " + Af.run("hhWhoName('kid_b')")) >= 0]);
  return R; };
const FAULTS = [
  ["the grid's guess read instead of the stored day (\"instead of working it out again\")", "if(!hoStoredOn(X)||!hdManaged(j)||j.clock===\"roll\") return undefined;", "return undefined;"],
  ["fit nobody counted as a drop against the owner (\"never a mark or a deduction against a kid\")", "if(m.nobody) return mk({m:\"nobody\",who:\"\"});", "if(m.nobody) return mk({m:\"drop\",who:own});"],
  ["who did it read from the owner, not the done record (\"who had it, who did it\")", "t.at=n; t.by=d.who||\"\";", "t.at=n; t.by=(hhJobs()[id]||{}).who||\"\";"],
  ["a late turn counted on the day it was done, not its own day (the turn's `since`)", "if(d){ const t=at((p||o||{}).since);", "if(d){ const t=at(iso);"],
  ["Mom's ✕ skip counted as a miss (a skip is never a drop)", "if(t.skip) return mk({m:\"skip\",who:who||own,wv:1});", ""],
  ["a daily not done shown as not counted (\"Daily chores N% of days\" must count the missed days)", "if(t.k===\"daily\"&&t.who&&n<X.t) return mk({m:\"drop\",who:t.who});", ""],
  ["the stars paid left out (\"stars paid and taken\")", "if(t.pts!=null) o.pts=t.pts;", ""],
];
for (const [rule, a, b] of FAULTS) { const n = HJS.split(a).length - 1; if (n !== 1) { ok("fault \"" + rule + "\": its line is found once", false, n); continue; }
  const Af = w.boot("F" + FAULTS.indexOf(rule), "devF" + FAULTS.indexOf(rule), { mom: true }); Af.run(CAP); Af.run(HJS.replace(a, () => b)); await w.flush();
  const got = checksA(Af).filter(x => !x[1]).map(x => x[0]);
  ok("fault caught — " + rule + " (" + got.length + " check" + (got.length === 1 ? "" : "s") + " fail: " + got.join(", ") + ")", got.length > 0); }
{ const A2 = w.boot("Fok", "devFok", { mom: true }); A2.run(CAP); A2.run(HJS); await w.flush(); ok("…and the same checks, unchanged house.js on a fresh device: all pass", checksA(A2).every(x => x[1]), checksA(A2).filter(x => !x[1])); }

// ════════════════ F · a plan drop that Mom then ➖ Excused (the hub's g5, 11/25) ════════════════
console.log("\n── F · a plan drop Mom ➖ Excused (the Dust, due Thu 12/10, excused Sun 12/13): – not counted, \"· excused\" ──");
{ const due = DN("2026-12-10"), pick = r => (r.marks || []).find(m => m.n === due), r = rec(A, "a_dust"), m = pick(r), tip = A.run("hoMarksHTML(hoRec('a_dust',hoX()))"), t = recTxt(A, "a_dust");
  const counted = r.marks.filter(x => ["on", "late", "drop", "nobody"].indexOf(x.m) >= 0).length, drops = r.marks.filter(x => x.m === "drop").length, n = /(\d+) of the last (\d+)/.exec(t), d = +((/· (\d+) dropped/.exec(t) || [0, 0])[1]);
  ok("(setup) its drop note says excused (x on houseDay/2026-12-13/miss/a_dust)", !!((dump["2026-12-13"].miss || {}).a_dust || {}).x);
  ok("📊 that turn reads – not counted, with \"· excused\" in its tip", m && m.m === "skip" && m.x === 1 && /not counted[^"]*· excused/.test(tip), { m, tip: tip.slice(0, 300) });
  ok("…and it is not in \"dropped\" nor in \"of the last N\" (" + strip(t) + ": " + counted + " counted, " + drops + " dropped, the excused turn neither)", n && +n[2] === counted && d === drops && !r.marks.some(x => x.n === due && x.m !== "skip"), { t, counted, drops });
  const a5 = "if(m.x) return mk({m:\"skip\",who:m.who||who||own,x:1}); ", c5 = HJS.split(a5).length - 1;
  if (c5 !== 1) ok("fault g5: its piece is found once", false, c5); else { const Dg = w.boot("G5", "devG5", { mom: true }); Dg.run(CAP); Dg.run(HJS.replace(a5, () => "")); await w.flush();
    const fm = pick(JSON.parse(Dg.run("JSON.stringify(hoRec('a_dust',hoX()))"))), ft = Dg.run("hoText(hoRec('a_dust',hoX()))"), fd = +((/· (\d+) dropped/.exec(ft) || [0, 0])[1]);
    ok("fault caught — g5, the hub's exact replacement: an excused miss counted as dropped (\"➖ Excuse: it costs nothing and is not a miss\") — it reads " + (fm && fm.m) + ", \"" + strip(ft) + "\"", fm && fm.m === "drop" && fd === drops + 1, { fm, ft }); } }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
