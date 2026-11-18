/*
 * test_house_turns_world.js — HOUSETURNS, Household by room step 5 (DESIGN_household_rooms_2026-11-15 §4.2, §5; her "Yes, start
 * step 5" 2026-11-18), the WHOLE app: test_fixtures/house_world.js (every device runs index.html over one in-memory Firebase and one
 * virtual clock) on the made-up demo family (kid_a … kid_d, Mom, Dad), with three rotations shaped like a real table's added:
 *   bins  — kid_a's "Bins to the curb" (Mon, Thu) and kid_b's "Free day" placeholder · weekly      (Chores list)
 *   tank  — kid_b's as-needed "Refill the lizard's water" (animals) and kid_c's "Free day"  · every 2 days (Morning list)
 *   pick3 — three pickups shared by kid_a, kid_b, kid_c                                     · daily  (Afternoon list)
 * (the fixture's own two-kid "pick" rotation is never switched).
 *   A  nothing switched: 60 days, plan off / preview / ON, every person's lists, every write and the whole database = main's
 *   B  ✨ Switch at 2 PM (and at 4:45 PM) with ticks already made: every list, every check mark, the stars, the Click-off Log and
 *      every other byte of the database are what they were; the only writes are the three switches
 *   C  a switched week (then 60 days): the same lists as a world that never switched, day after day, with check-offs; HouseEng
 *      names the same kid as the lists; with the plan ON the plan's turn is the same kid
 *   D  ↩ Undo: the whole database byte for byte as before the switch
 *   E  the grown-up turn with the plan ON: counted with each check-off, reversed exactly, Mom's turn at N on her own list, her
 *      check-off resets it, her un-check puts it back; with the preview it is only shown — no list moves
 *   F  the old Chores & Stars rotation chips leave a switched rotation alone; loading and drawing pages writes nothing
 *   BASE_HTML=/path/to/main/index.html node test_house_turns_world.js   (default: `git show origin/main:index.html`)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process"), W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
let BASE = process.env.BASE_HTML;
if (!BASE) { try { const t = path.join(os.tmpdir(), "house_turns_base_" + process.pid + ".html"); fs.writeFileSync(t, cp.execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] })); BASE = t; } catch (e) { BASE = null; } }
console.log("(base: " + (BASE || "none — git show failed; part A is skipped") + ")");
const J = o => JSON.stringify(o), clone = o => JSON.parse(J(o));
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
const ROTS = () => ({
  r_bins_a: K({ label: "Bins to the curb", emoji: "🗑", who: "kid_a", slot: "chores", cad: "wk:0,3", area: "pickup", rot: "bins", order: 8, minutes: 5, pts: 5 }),
  r_bins_free: K({ label: "Free day", emoji: "😌", who: "kid_b", slot: "chores", cad: "daily", area: "pickup", rot: "bins", free: true, pts: 0, order: 8 }),
  r_tank_b: K({ label: "Refill the lizard's water", emoji: "🦎", who: "kid_b", slot: "morning", cad: "asneeded", area: "animals", rot: "tank", order: 5, pts: 3 }),
  r_tank_free: K({ label: "Free day", emoji: "😌", who: "kid_c", slot: "morning", cad: "daily", area: "animals", rot: "tank", free: true, pts: 0, order: 5 }),
  r_pick3_a: K({ label: "Pickup the living room", emoji: "🛋", who: "kid_a", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick3", order: 5, minutes: 5, pts: 5 }),
  r_pick3_b: K({ label: "Pickup the school room", emoji: "📚", who: "kid_b", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick3", order: 5, minutes: 5, pts: 5 }),
  r_pick3_c: K({ label: "Pickup the kitchen", emoji: "🍳", who: "kid_c", slot: "afternoon", cad: "daily", area: "pickup", rot: "pick3", order: 5, minutes: 5, pts: 5 })
});
const CONV = ["r_bins_a", "r_tank_b", "r_pick3_a"], SW = ["r_bins_a", "r_tank_b", "r_pick3_a", "r_pick3_b", "r_pick3_c"];
function household(mode, extra) { const h = W.household(mode); Object.assign(h.jobs, ROTS()); if (extra) extra(h); return h; }
const tree = () => ({ config: Object.assign(clone(W.FX.db.config), { rotationPeriod: { bins: "weekly", tank: "2d", pick3: "daily" } }) });
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dOf = n => new Date(2026, 10, 16 + n);   // day n of the replay (day 0 = Mon 11/16)
const isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const tick = (d, slot, kid, label) => d.run("(function(){ const s=rtStepsFor('" + slot + "','" + kid + "',false,day)||[]; const i=s.findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); if(i<0) return -1; " + (slot === "morning" ? "toggleMorningStep('" + kid + "',i)" : "toggleRtStep('" + slot + "','" + kid + "',i)") + "; return i; })()");
// tick whatever a kid's row of a rotation shows today (the seat row)
const tickRot = (d, slot, kid, tag) => d.run("(function(){ const s=rtStepsFor('" + slot + "','" + kid + "',false,day)||[]; const i=s.findIndex(function(x){ return x&&x.rot==='" + tag + "'&&x.cad!=='none'&&!x.free; }); if(i<0) return -1; " + (slot === "morning" ? "toggleMorningStep('" + kid + "',i)" : "toggleRtStep('" + slot + "','" + kid + "',i)") + "; return i; })()");
// who holds each switched chore on the lists today: {label: kid}
const listHold = (d, dn) => J(JSON.parse(d.run("(function(){ const o={}; ROSTER.forEach(function(k){ SL_SLOTS.forEach(function(s){ (rtStepsFor(s,k,false," + J(dn) + ")||[]).forEach(function(x){ if(x&&(x.rot==='bins'||x.rot==='tank'||x.rot==='pick3')&&!x.free&&x.cad!=='none') o[x.label]=k; }); }); }); return JSON.stringify(o); })()")));
const engHold = (A, iso) => JSON.parse(A.run("JSON.stringify((function(){ const h=HouseEng.rotHolders({jobs:hhJobs()}," + J(iso) + ",hpPeople(),hpOv()), o={}; " + J(SW) + ".forEach(function(id){ if(h[id]) o[hhJobs()[id].label]=h[id]; }); return o; })())"));
const strip = t => { const o = clone(t); const h = o.household || {}; delete h.rotations; Object.keys(h.jobs || {}).forEach(id => { delete h.jobs[id].can; }); return J(o); };
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
const listsDay = (B, n) => J(W.lists(B, { days: [DN[dOf(n).getDay()]] }));
// Mom's page drawn once (its own side effects — the day's 🔎 spot-check draw — happen first, in both worlds alike)
const drawn = async S => { S.A.run("try{ renderAll(); hhRender(); }catch(e){}"); await S.w.flush(); };
// the lists read a weekday through the active week's dates (DAY_DT): only a day whose name maps to its own date is compared with
// the engine (the made-up family's school weeks stop being built in late December, so those weeks keep the last built dates)
const realDay = (B, n) => +B.run("_rtRotDayNum('" + DN[dOf(n).getDay()] + "')") === Math.round(Date.UTC(dOf(n).getFullYear(), dOf(n).getMonth(), dOf(n).getDate()) / 864e5);

(async () => {
// ── A ──
console.log("\n── A · nothing switched: 60 days, every list, every write, the whole database = main's (off / preview / ON) ──");
if (BASE) for (const mode of ["off", "preview", "on"]) {
  const replay = async index => { const w = await W.world({ household: household(mode), tree: tree(), index }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush(); const snaps = [];
    for (let n = 0; n < 60; n++) { await go(w, n, 7, 0); tickRot(B, "morning", "kid_b", "tank"); tick(B, "morning", "kid_a", "Brush teeth");
      await go(w, n, 16, 40); tickRot(B, "afternoon", "kid_a", "pick3"); tickRot(B, "afternoon", "kid_c", "pick3"); tickRot(B, "chores", "kid_a", "bins"); tick(B, "chores", "kid_a", "Unload the dishwasher"); await w.flush();
      snaps.push(listsDay(B, n)); }
    return { snaps, writes: writes(w, 0).join("\n"), tree: J(w.db.tree.root), built: Object.keys(w.db.tree.root.houseDay || {}).length }; };
  const N = await replay(undefined), O = await replay(BASE);
  const bad = N.snaps.map((s, i) => s === O.snaps[i] ? null : isoN(i)).filter(Boolean);
  ok(mode + " · every kid's four lists, Mom's and Dad's, with their check marks: main's on all 60 days", bad.length === 0, bad.slice(0, 3));
  ok(mode + " · every write in 60 days is main's, in order (" + N.writes.split("\n").length + " writes)", N.writes === O.writes, (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok(mode + " · the whole database after 60 days is main's, byte for byte", N.tree === O.tree);
  ok(mode + " · (sanity) " + (mode === "on" ? "a plan was built every day" : "no plan was ever stored"), mode === "on" ? N.built >= 60 : N.built === 0, N.built);
}

// ── B, C, D ──
for (const mode of ["preview", "on"]) {
  console.log("\n── B · ✨ Switch at 2 PM with ticks already made (" + mode + ") ──");
  const mkW = async () => { const w = await W.world({ household: household(mode), tree: tree() }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(HJS); await w.flush(); return { w, A, B }; };
  const X = await mkW(), Y = await mkW();   // X switches, Y never does
  for (const S of [X, Y]) { await go(S.w, 0, 7, 0); tickRot(S.B, "morning", "kid_b", "tank"); tickRot(S.B, "morning", "kid_c", "tank"); tick(S.B, "morning", "kid_a", "Brush teeth"); tick(S.B, "morning", "kid_c", "Fill the dog's water");
    await go(S.w, 0, 13, 50); tickRot(S.B, "chores", "kid_a", "bins"); tick(S.B, "chores", "kid_b", "Wipe the bathroom sink"); await S.w.flush(); await go(S.w, 0, 14, 0); await drawn(S); }
  const done0 = Object.values(W.lists(X.B)).reduce((a, r) => a + (Array.isArray(r) ? r.filter(x => x && x._done && (x.rot === "bins" || x.rot === "tank" || SW.includes(x.house))).length : 0), 0);
  ok(mode + " · (sanity) the ticks landed: rows of the bins and tank rotations (or, with the plan ON, the bins' plan row) are checked today", done0 >= 2, done0);
  const L0 = J(W.lists(X.B)), T0 = J(X.w.db.tree.root), m0 = X.w.mark(), byMom = JSON.parse(X.A.run("JSON.stringify(" + J(CONV) + ".map(function(id){ const p=htPlan(id); return {ok:p.ok,why:p.why,from:p.from}; }))"));
  ok(mode + " · each of the three can switch (its 14 days match)", byMom.every(p => p.ok && p.from === isoN(1)), byMom);
  CONV.forEach(id => X.A.run("htConvert('" + id + "')")); await X.w.flush();
  const wr = writes(X.w, m0);
  ok(mode + " · the only writes are the three switches, each ONE update of the wheel, its record and who-can", wr.length === 3 && wr.every(l => /^update  /.test(l) && l.split(" ")[2].split(",").every(k => /^household\/rotations\/(bins|tank|pick3)\/(v\/2026-11-17|conv)$|^household\/jobs\/r_(bins|tank|pick3)_[abc]\/can$/.test(k))), wr);
  ok(mode + " · every kid's lists (every weekday, raw and shown), Mom's and Dad's, with every check mark: exactly as before", J(W.lists(X.B)) === L0);
  ok(mode + " · the rest of the database — stars, the Click-off Log, check-offs, every list row — byte for byte as before", strip(X.w.db.tree.root) === strip(JSON.parse(T0)));
  ok(mode + " · …and it is the same as the world that did not switch", strip(X.w.db.tree.root) === strip(Y.w.db.tree.root) && J(W.lists(X.B)) === J(W.lists(Y.B)));
  ok(mode + " · no Free day row was touched (still there, still free)", ["r_bins_free", "r_tank_free"].every(id => { const j = X.w.get("household/jobs/" + id); return j && j.free && j.status === "active" && !j.can; }));
  ok(mode + " · the tank switch is the as-needed animal one; its 2-day cycle was kept", J(X.w.get("household/rotations/tank/v/2026-11-17")) === J({ people: ["kid_b", "kid_c"], period: "2d", chores: { r_tank_b: 0 } }), X.w.get("household/rotations/tank"));
  { const Z = await mkW(); await go(Z.w, 0, 16, 45); tickRot(Z.B, "afternoon", "kid_a", "pick3"); tickRot(Z.B, "afternoon", "kid_b", "pick3"); tick(Z.B, "afternoon", "kid_b", "Pickup the porch"); await Z.w.flush(); await drawn(Z);
    const l = J(W.lists(Z.B)), t = strip(Z.w.db.tree.root); CONV.forEach(id => Z.A.run("htConvert('" + id + "')")); await Z.w.flush();
    ok(mode + " · at 4:45 PM with the switched pickups already ticked: every list and mark, and the database, as before", J(W.lists(Z.B)) === l && strip(Z.w.db.tree.root) === t); }

  console.log("\n── C · the switched week, then 60 days, against the world that never switched (" + mode + ") ──");
  let bad = [], badE = [], badP = [], daysE = 0;
  for (let n = 1; n < 61; n++) {
    for (const S of [X, Y]) { await go(S.w, n, 7, 0); tickRot(S.B, "morning", "kid_b", "tank"); tickRot(S.B, "morning", "kid_c", "tank");
      await go(S.w, n, 16, 40); tickRot(S.B, "afternoon", "kid_a", "pick3"); tickRot(S.B, "afternoon", "kid_c", "pick3"); tickRot(S.B, "chores", "kid_a", "bins"); tickRot(S.B, "chores", "kid_b", "bins"); await S.w.flush(); }
    const dn = DN[dOf(n).getDay()];
    if (mode === "preview") { if (listsDay(X.B, n) !== listsDay(Y.B, n)) bad.push(isoN(n)); }
    else { const hx = JSON.parse(listHold(X.B, dn)), hy = JSON.parse(listHold(Y.B, dn)); if (hx["Refill the lizard's water"] !== hy["Refill the lizard's water"]) bad.push(isoN(n) + " tank"); }
    const lh = JSON.parse(listHold(X.B, dn)), eh = engHold(X.A, isoN(n)), real = realDay(X.B, n); if (real) daysE++;
    if (mode === "preview" && real) Object.keys(lh).forEach(lb => { if (eh[lb] !== lh[lb]) badE.push(isoN(n) + " " + lb + " " + eh[lb] + "≠" + lh[lb]); });
    if (mode === "on") { const px = X.w.get("houseDay/" + isoN(n)) || {}, py = Y.w.get("houseDay/" + isoN(n)) || {}, turn = (r, id) => { const p = (r.plan || {})[id], o = (r.over || {})[id]; return p ? (p.from || p.who) : o ? o.turn : ""; };
      ["r_bins_a", "r_pick3_a", "r_pick3_b", "r_pick3_c"].forEach(id => { if (turn(px, id) !== turn(py, id)) badP.push(isoN(n) + " " + id + " " + turn(px, id) + "≠" + turn(py, id)); });
      ["r_pick3_a", "r_pick3_b", "r_pick3_c"].forEach(id => { const t = turn(px, id); if (t && t !== eh[X.w.get("household/jobs/" + id).label]) badE.push(isoN(n) + " " + id); }); }
    if (n === 6) { ok(mode + " · the switched week (Tue–Sun): " + (mode === "preview" ? "every list and check mark = the world that never switched" : "the animal rotation's rows = the world that never switched"), bad.length === 0, bad.slice(0, 3));
      ok(mode + " · …and the whole database but the switch itself (stars, logs, check-offs)", mode === "on" || strip(X.w.db.tree.root) === strip(Y.w.db.tree.root)); }
  }
  ok(mode + " · 60 days after the switch: " + (mode === "preview" ? "every list and check mark" : "the animal rotation's rows") + " = the world that never switched", bad.length === 0, bad.slice(0, 3));
  ok(mode + " · …and HouseEng names the same kid as the lists for every switched chore, every day (" + daysE + " days the lists read their own date)", badE.length === 0 && daysE >= 30, [daysE, badE.slice(0, 4)]);
  if (mode === "on") ok("on · the day's stored plan names the same turn kid for every switched house chore as the world that never switched (60 days)", badP.length === 0, badP.slice(0, 4));
  if (mode === "preview") ok("preview · …and the database (stars, logs, check-offs) after 60 days = the world that never switched", strip(X.w.db.tree.root) === strip(Y.w.db.tree.root));

  console.log("\n── D · ↩ Undo (" + mode + ") ──");
  { const Z = await mkW(); await go(Z.w, 0, 9, 0); tickRot(Z.B, "morning", "kid_b", "tank"); await Z.w.flush(); await drawn(Z); const t0 = J(Z.w.db.tree.root), l0 = J(W.lists(Z.B));
    CONV.forEach(id => Z.A.run("htConvert('" + id + "')")); await Z.w.flush(); const m = Z.w.mark();
    ["bins", "tank", "pick3"].forEach(k => Z.A.run("htUndo('" + k + "')")); await Z.w.flush();
    ok(mode + " · Undo × 3 = three updates; the whole database is byte for byte what it was before the switch", writes(Z.w, m).length === 3 && J(Z.w.db.tree.root) === t0);
    ok(mode + " · …and every list with its marks", J(W.lists(Z.B)) === l0);
    await go(Z.w, 3, 16, 40); const Y2 = await mkW(); await go(Y2.w, 3, 16, 40); ok(mode + " · …and days later the lists are the never-switched world's", listsDay(Z.B, 3) === listsDay(Y2.B, 3)); }
}

// ── E ──
console.log("\n── E · the grown-up turn ──");
{ const deep = h => { const j = h.jobs.c_b_bath; j.deepEvery = 2; j.can = ["kid_b", "kid_a", "mom"]; };
  const w = await W.world({ household: household("on", deep), tree: tree() }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(HJS); await w.flush();
  const bath = () => w.get("household/jobs/c_b_bath"), plan = n => ((w.get("houseDay/" + isoN(n)) || {}).plan || {}).c_b_bath;
  await go(w, 0, 16, 30); ok("Mon: it is kid_b's (counter 0)", plan(0) && plan(0).who === "kid_b" && !bath().kidRun, plan(0));
  const L = "Wipe the bathroom sink"; tick(B, "chores", "kid_b", L); await w.flush(); const a1 = J(bath());
  ok("kid_b's check-off counts one kid turn (kidRun 1, written with the check-off)", bath().kidRun === 1 && bath().doneN === 1);
  tick(B, "chores", "kid_b", L); await w.flush(); ok("un-check: the counters go back exactly (none)", !bath().kidRun && !bath().doneN && !bath().deepBy && !bath().lastDone, bath());
  tick(B, "chores", "kid_b", L); await w.flush(); ok("…check again: the same as the first time", J(bath()) === a1);
  await go(w, 1, 16, 30); tick(B, "chores", "kid_b", L); await w.flush(); ok("Tue: kid_b again → kidRun 2", bath().kidRun === 2 && plan(1).who === "kid_b");
  await go(w, 2, 7, 0); ok("Wed: N reached → the plan gives it to Mom, why “deep”", plan(2) && plan(2).who === "mom" && plan(2).why === "deep", plan(2));
  ok("…it is on Mom's own list and not on kid_b's", J(W.lists(A, { days: ["wednesday"] }).mom).indexOf("Wipe the bathroom sink") >= 0 && !W.lists(B, { days: ["wednesday"] })["chores/kid_b/wednesday"].some(s => s.label === L && s.cad !== "none"));
  const key = A.run("(function(){ const m=mcAll(); return Object.keys(m).find(function(k){ return m[k].label===" + J(L) + "; })||''; })()"), b0 = J(bath());
  A.run("mcToggle(" + J(key) + ")"); await w.flush();
  ok("Mom's check-off: kidRun back to 0, deepBy = mom, lastBy = mom", !bath().kidRun && bath().deepBy === "mom" && bath().lastBy === "mom", bath());
  A.run("mcToggle(" + J(key) + ")"); await w.flush(); ok("Mom's un-check puts every counter back exactly (kidRun 2, no deepBy)", J(bath()) === b0, [bath(), JSON.parse(b0)]);
  A.run("mcToggle(" + J(key) + ")"); await w.flush();
  await go(w, 3, 7, 0); ok("Thu: back to kid_b (the count starts again)", plan(3) && plan(3).who === "kid_b" && plan(3).why !== "deep", plan(3));
  // Mom and Dad both ticked: after Mom's turn, Dad's
  const w2 = await W.world({ household: household("on", h => { deep(h); const j = h.jobs.c_b_bath; j.can = ["kid_b", "mom", "dad"]; j.kidRun = 2; j.deepBy = "mom"; }), tree: tree() }); w2.boot("A", "devA", { mom: true }); await w2.flush(); await go(w2, 0, 7, 0);
  const p2 = ((w2.get("houseDay/" + isoN(0)) || {}).plan || {}).c_b_bath; ok("Mom and Dad both ticked, Mom did the last one → Dad's turn", p2 && p2.who === "dad" && p2.why === "deep", p2);
  // the preview: shown only
  const P = await W.world({ household: household("preview", h => { deep(h); h.jobs.c_b_bath.kidRun = 2; }), tree: tree() }), Q = await W.world({ household: household("preview"), tree: tree() });
  const PA = P.boot("A", "devA", { mom: true }), PB = P.boot("B", "devB"), QB = Q.boot("B", "devB"); PA.run(HJS); await P.flush(); await Q.flush();
  let same = true; for (let n = 0; n < 7; n++) { await go(P, n, 16, 30); await go(Q, n, 16, 30); tick(PB, "chores", "kid_b", L); tick(QB, "chores", "kid_b", "Wipe the bathroom sink"); await P.flush(); await Q.flush(); if (listsDay(PB, n) !== listsDay(QB, n)) same = false; }
  ok("preview: with N set, no list moves — kid_b keeps it every day (= a world with no grown-up turn)", same);
  ok("…the old lists' check-offs write no counter (they are counted only where the plan acts)", !P.get("household/jobs/c_b_bath/doneN") && P.get("household/jobs/c_b_bath/kidRun") === 2);
  const pv = JSON.parse(PA.run("JSON.stringify((function(){ _hpMemo=null; return hpRun().slice(0,3).map(function(p){ const x=p.plan.c_b_bath; return x?x.who+(x.why==='deep'?'*':''):''; }); })())"));
  ok("…and the 🔭 preview shows where it would fall (Mom ✨ next time)", pv.indexOf("mom*") >= 0, pv); }

// ── F ──
console.log("\n── F · the old chips leave a switched rotation alone; loading and drawing write nothing ──");
{ const w = await W.world({ household: household("preview"), tree: tree() }); const A = w.boot("A", "devA", { mom: true }); A.run(HJS); await w.flush(); await go(w, 0, 9, 0);
  CONV.forEach(id => A.run("htConvert('" + id + "')")); await w.flush(); const m = w.mark(), rows0 = A.run("JSON.stringify(rtStepsFor('afternoon','kid_a',true))");
  A.run("(function(){ const s=rtStepsFor('afternoon','kid_a',true); const i=s.findIndex(function(x){ return x.rot==='pick3'; }); rtRotToggle('afternoon','kid_a',i); })()");
  A.run("rtRotPeriodSet('pick3','weekly'); cpRotAddFree('afternoon','pick3','nosuch');"); await w.flush();
  ok("Chores & Stars: the rotation chip, the cycle and + Free day do nothing to a switched rotation", writes(w, m).length === 0 && A.run("JSON.stringify(rtStepsFor('afternoon','kid_a',true))") === rows0 && A.run("rotationPeriod.pick3") === "daily");
  A.run("(function(){ const s=rtStepsFor('afternoon','kid_a',true); const i=s.findIndex(function(x){ return x.rot==='pick'; }); rtRotToggle('afternoon','kid_a',i); })()"); await w.flush();
  ok("…but still work on a rotation that was not switched (the fixture's own 'pick')", writes(w, m).length > 0);
  // a family with switched wheels (and one made on the card) boots, and Mom opens every page: nothing is written
  for (const mode of ["off", "preview", "on"]) {
    const h = household(mode, x => { x.rotations = { pick3: { v: { "2026-11-16": { people: ["kid_a", "kid_c", "kid_b"], period: "daily", chores: { r_pick3_a: 0, r_pick3_c: 1, r_pick3_b: 2 } } }, conv: { at: 1, from: "2026-11-16", rot: "pick3", slot: "afternoon", by: "mom" } }, t_c_a_vac: { v: { "2026-11-16": { people: ["kid_a", "kid_b"], period: "daily", chores: { c_a_vac: 0 } } } } }; x.jobs.c_a_dishes.deepEvery = 3; });
    const z = await W.world({ household: h, tree: tree() }); const A2 = z.boot("A", "devA", { mom: true }), B2 = z.boot("B", "devB"); await z.flush(); await go(z, 1, 8, 0); const m2 = z.mark();
    A2.run(HJS); A2.run("(function(){ hhView='rooms'; hhRmSel=''; hhRoomsPageHTML(); hhRmSel='kitchen'; hcRm['kitchen|rules']=true; hhRoomsPageHTML(); hpSel='kid_a'; hpPersonHTML(); hcOpen('r_pick3_a'); hcCardHTML(); hcOpen('c_a_vac'); hcCardHTML(); hcOpen('r_bins_a'); hcCardHTML(); htOpen('r_bins_a'); hcCardHTML(); htClose(); hcClose(); hhView='rot'; hhRotationsHTML(); })()");
    W.lists(B2); W.lists(A2); await z.flush();
    const wr = writes(z, m2).filter(l => !/^(set|update|transaction) (houseDay|routineLog|slState|weekData|autoBuild|week|presence|devices|lastSeen)/.test(l));
    ok(mode + " · booting with wheels stored, and drawing rooms, Whole house, ⚙ Rules, By person, three cards, the switch screen and 🔁 Rotations: no write", wr.length === 0 && !writes(z, m2).some(l => /household/.test(l)), writes(z, m2).slice(0, 5));
  } }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
