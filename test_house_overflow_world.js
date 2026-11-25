/*
 * test_house_overflow_world.js — HOUSEOVER, Household by room step 6b (DESIGN_household_rooms_2026-11-15 §1 rule 5, §4.3, §4.7, §5; her
 * "Yes, start 6b" 2026-11-18), the WHOLE app over 60 days: test_fixtures/house_overflow_world.js (every device runs index.html over one
 * in-memory Firebase and one virtual clock) on the made-up family, against `main` (git show origin/main:index.html and house.js).
 * Every day the kids use Up for Grabs the way they do (I did it now, Grab for later, Mark done, Let go; Mom assigns and releases).
 *   A  nothing new: plan off and preview (on a table where chores fit nobody) and plan ON with room for everything — × the built-in
 *      list, a saved list, no list, and the switched pool (6a) — every kid's Up for Grabs (their screen and Mom's), every person's
 *      lists, every write and the whole database = main's, byte for byte
 *   B  plan ON with chores that fit nobody, 60 days, the kids also taking the ×2 grabs (now, for later, let go, never finished, an
 *      undo, a sibling too late) and Mom re-laying some days: every day — each offer is a chore that fit nobody, for kids ticked on
 *      it; each ×2 payment is the done record's amount, once; nothing paid for one not done; a done one is never laid again that day
 *      or carried; one not done that is set-day is first in line the next day (or dropped on its own next day); and everything that
 *      is NOT the ×2 grabs — the normal grab records, their stars, their log lines, every list — is main's
 *   C  a kid's device left open: every morning it taps yesterday's cards before it redraws — nothing is written or paid
 *   D  loading and drawing every page on a day with offers writes exactly what main writes
 *   BASE_HTML=/path/to/main/index.html BASE_HOUSE=/path/to/main/house.js node test_house_overflow_world.js
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process"), F = require(path.join(__dirname, "test_fixtures", "house_overflow_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8"), IDX = process.env.HOUSE_INDEX || undefined;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const show = f => { try { return cp.execSync("git show origin/main:" + f, { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { return null; } };
let BASE = process.env.BASE_HTML, BHJS = process.env.BASE_HOUSE ? fs.readFileSync(process.env.BASE_HOUSE, "utf8") : null;
if (!BASE) { const b = show("index.html"); if (b) { BASE = path.join(os.tmpdir(), "house_over_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); } }
if (!BHJS) { const b = show("house.js"); if (b) BHJS = b.toString("utf8"); }
console.log("(base: " + (BASE && BHJS ? BASE : "none — git show failed; A, B's main half and D are skipped") + ")");
const J = o => JSON.stringify(o), clone = o => o == null ? o : JSON.parse(J(o)), KIDS = F.KIDS;
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
const R = (d, expr) => JSON.parse(d.run("JSON.stringify((function(){ " + expr + " })())"));
const mkW = async (kind, mode, o) => { o = o || {}; const w = await F.world(kind, mode, Object.assign({ longPlan: true }, o));   /* 📅 LISTWK: 60 school days (test_fixtures/house_world.js) */ const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(o.hjs || HJS); await w.flush();
  if (o.sw) { A.run("hgOpen(); hgSwitch()"); await w.flush(); } return { w, A, B }; };
const snap = S => J({ kid: F.G.kidHTML(S.B), mom: F.G.kidHTML(S.A, true).map(h => h.replace(/<span onclick="event\.stopPropagation\(\);hcGo\('[^']*'\)" title="Edit this chore" style="[^"]*">✎<\/span>/g, "")) });
const lists = (S, iso) => { const L = F.W.lists(S.B, { days: [S.B.run("day")] }); return J(L); };
const pool = (d, kid) => F.G.poolNames(d, kid);
// One day of the normal Up for Grabs, picked by name from each kid's own list (so two worlds do the same thing to the same chore).
async function normalDay(S, n) {
  const { w, A, B } = S, pick = (kid, k) => { const p = pool(B, kid); return p.length ? p[k % p.length] : null; };
  await go(w, n, 8, 0); { const l = pick("kid_a", n); if (l) F.G.act(B, "gbInstant", "kid_a", l); }
  { const held = R(B, "const x=gbPool('kid_b',false).find(function(x){ const s=gbCur(x.i); return s&&s.by==='kid_b'&&!s.done; }); return x?x.g.label:'';");
    if (held && n % 2) F.G.act(B, "gbMarkDone", "kid_b", held); else if (!held) { const l = pick("kid_b", n + 1); if (l) F.G.act(B, "gbClaim", "kid_b", l); } }
  await w.flush(); await go(w, n, 12, 0); { const l = pick("kid_c", n + 2); if (l) { F.G.act(B, "gbClaim", "kid_c", l); await w.flush(); if (n % 3) F.G.act(B, "gbLetGo", "kid_c", l); } }
  await w.flush(); await go(w, n, 15, 0); { const l = pick("kid_d", n + 3); if (l) { F.G.act(A, "gbClaim", "kid_d", l); await w.flush(); await go(w, n, 16, 0); if (n % 2) F.G.act(B, "gbMarkDone", "kid_d", l); else F.G.act(A, "gbLetGo", "kid_d", l); } }
  await w.flush(); await go(w, n, 18, 0); S.A.run("try{ renderAll(); hhRender(); }catch(e){}"); await w.flush();
}
// The ×2 side of a day (branch only), in the evening after the normal day's taps. Kid B never holds a ×2
// grab (so its normal holds are never refused by one-at-a-time) — every normal tap is the same tap in both worlds.
async function x2Day(S, n) {
  const { w, A, B } = S, t = isoN(n), off = F.x2;
  await go(w, n, 19, 0); { const o = off(B, "kid_a"); if (o.length) B.run("hdGrabDone('kid_a','" + t + "','" + o[n % o.length] + "')"); }
  { const o = off(B, "kid_b"); if (o.length && n % 2) B.run("hdGrabDone('kid_b','" + t + "','" + o[0] + "')"); }
  await w.flush(); await go(w, n, 19, 30); { const o = off(B, "kid_d"); if (o.length) { B.run("hdGrabHold('kid_d','" + t + "','" + o[0] + "')"); await w.flush(); if (n % 4 === 1) B.run("hdGrabLetGo('kid_d','" + t + "','" + o[0] + "')"); else if (n % 4 === 2) B.run("hdGrabDone('kid_d','" + t + "','" + o[0] + "')"); } }   // 0 and 3: held and never finished
  await w.flush(); await go(w, n, 20, 0); { const o = off(B, "kid_a"); if (o.length && n % 3 === 0) { B.run("hdGrabDone('kid_a','" + t + "','" + o[0] + "')"); await w.flush(); if (n % 6 === 0) A.run("hdGrabUndo('kid_a','" + t + "','" + o[0] + "')"); } }
  await w.flush(); await go(w, n, 20, 30); if (n % 5 === 0) { A.run("hdRelay('" + t + "')"); await w.flush(); }
  await go(w, n, 21, 0); { const r = clone(w.get("houseDay/" + t)) || {}, id = Object.keys(r.done || {}).find(k => r.done[k].grab && r.done[k].who === "kid_a"); if (id) B.run("hdGrabDone('kid_b','" + t + "','" + id + "')"); }   // a sibling too late
  await w.flush();
}

(async () => {
// ── A ──
console.log("\n── A · nothing new: off / preview (chores that fit nobody), ON with room for everything — 60 days = main ──");
const combos = []; for (const kind of ["builtin", "saved", "none"]) for (const mode of ["off", "preview", "on"]) combos.push({ kind, mode });
for (const mode of ["off", "preview", "on"]) combos.push({ kind: "saved", mode, sw: true });
if (BASE && BHJS) for (const c of combos) {
  const o = { roomy: c.mode === "on", sw: !!c.sw }, label = c.kind + (c.sw ? " switched" : "") + " · " + c.mode + (c.mode === "on" ? " (room for all)" : "");
  const replay = async (index, hjs) => { const S = await mkW(c.kind, c.mode, Object.assign({ index, hjs }, o)), shots = [], ls = [];
    for (let n = 0; n < 60; n++) { await normalDay(S, n); shots.push(snap(S)); ls.push(lists(S)); }
    return { shots, ls, writes: writes(S.w, 0).join("\n"), tree: J(S.w.db.tree.root), gc: Object.keys(S.w.get("grabClaims") || {}).length, over: Object.values(S.w.get("houseDay") || {}).filter(d => d.over).length, x2: Object.values(S.w.get("houseDay") || {}).filter(d => d.grabs).length }; };
  const N = await replay(IDX, HJS), O = await replay(BASE, BHJS);
  const bad = N.shots.map((s, i) => s === O.shots[i] ? null : isoN(i)).filter(Boolean), badL = N.ls.map((s, i) => s === O.ls[i] ? null : isoN(i)).filter(Boolean);
  ok(label + " · every kid's Up for Grabs (their screen and Mom's) = main's on all 60 days", bad.length === 0, bad.slice(0, 3));
  ok(label + " · every person's lists = main's on all 60 days", badL.length === 0, badL.slice(0, 3));
  ok(label + " · every write in 60 days = main's, in order (" + N.writes.split("\n").length + " writes)", N.writes === O.writes, (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok(label + " · the whole database after 60 days = main's, byte for byte", N.tree === O.tree);
  ok(label + " · (sanity) " + (c.mode === "on" ? "the plan was stored every day and nothing fit nobody" : "nothing stored under houseDay") + (c.kind === "none" ? "" : "; the kids grabbed (" + N.gc + " grab records)"), (c.mode === "on" ? (Object.keys(clone(N.tree ? JSON.parse(N.tree).houseDay : {}) || {}).length >= 60 && N.over === 0 && N.x2 === 0) : !JSON.parse(N.tree).houseDay) && (c.kind === "none" ? N.gc === 0 : N.gc >= 30), [N.over, N.x2, N.gc]);
}

// ── B ──
console.log("\n── B · plan ON with chores that fit nobody: 60 days with the ×2 grabs taken ──");
for (const kind of ["saved", "builtin", "none"]) {
  const S = await mkW(kind, "on"), M = (BASE && BHJS) ? await mkW(kind, "on", { index: BASE, hjs: BHJS }) : null, prob = { offer: [], pay: [], twice: [], carry: [], other: [] };
  let nx2 = 0, paid = 0, held = 0, undone = 0;
  for (let n = 0; n < 60; n++) {
    await normalDay(S, n); if (M) await normalDay(M, n);   // the normal day first, the same in both worlds …
    await x2Day(S, n); if (M) { await go(M.w, n, 20, 30); if (n % 5 === 0) { M.A.run("hdRelay('" + isoN(n) + "')"); await M.w.flush(); } }   // … then the ×2 side (main has none; Mom's re-lay in both)
    await go(S.w, n, 23, 30); if (M) await go(M.w, n, 23, 30);
    const t = isoN(n), r = clone(S.w.get("houseDay/" + t)) || {}, J0 = clone(S.w.get("household/jobs")) || {};
    Object.keys(r.grabs || {}).forEach(id => { const g = r.grabs[id], j = J0[id] || {}, can = [j.who].concat(j.can || []).filter((k, i, a) => KIDS.indexOf(k) >= 0 && a.indexOf(k) === i);
      if (!(r.over || {})[id] || (r.plan || {})[id] || !(g.can || []).length || (g.can || []).some(k => can.indexOf(k) < 0)) prob.offer.push(t + " " + id); });
    Object.keys(r.over || {}).forEach(id => { const j = J0[id] || {}, kidCan = [j.who].concat(j.can || []).some(k => KIDS.indexOf(k) >= 0); if (kidCan && !(r.grabs || {})[id]) prob.offer.push(t + " no offer " + id); if (!kidCan && (r.grabs || {})[id]) prob.offer.push(t + " offer w/o kid " + id); });
    const B0 = KIDS.map(k => (clone(S.w.get("bank/" + k)) || {}).adjustments || {});
    Object.keys(r.done || {}).forEach(id => { const d = r.done[id]; if (!d.grab) return; nx2++; paid += d.pts;
      const e = B0[KIDS.indexOf(d.who)][d.bid]; if (d.pts > 0 && !(e && e.amount === d.pts)) prob.pay.push(t + " " + id); if ((r.plan || {})[id]) prob.twice.push(t + " laid+paid " + id); if (d.pts !== d.grab + (/wednesday/.test(dOf(n).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()) && J0[id].zone === "bath" ? 5 : 0)) prob.pay.push(t + " amount " + id + " " + d.pts); });
    Object.keys(r.grabs || {}).forEach(id => { if (r.grabs[id].by && !r.grabs[id].done) held++; });
    if (n > 0) { const y = clone(S.w.get("houseDay/" + isoN(n - 1))) || {};
      Object.keys(y.over || {}).forEach(id => { const o = y.over[id], dn = (y.done || {})[id];
        if (dn && ((r.plan || {})[id] || {}).why === "carried") prob.twice.push(t + " carried after done " + id);
        if (!dn && o.k === "set" && !((r.plan || {})[id] && r.plan[id].since <= isoN(n - 1)) && !((r.over || {})[id] && r.over[id].since <= isoN(n - 1)) && !(r.miss || {})[id]) prob.carry.push(t + " " + id); }); }
  }
  const allX2 = KIDS.reduce((a, k) => a.concat(F.bank(S.w, k).filter(x => /×2 Up for Grabs|↩︎ Mom undid|↩ unchecked/.test(x.note || "")).map(x => x.amount)), []).reduce((a, x) => a + x, 0), recs = [];
  Object.values(clone(S.w.get("houseDay")) || {}).forEach(d => Object.values(d.done || {}).forEach(x => { if (x.grab) recs.push(x); }));
  undone = KIDS.reduce((a, k) => a + F.bank(S.w, k).filter(x => /↩︎ Mom undid/.test(x.note || "")).length, 0);
  ok(kind + " · each day every offer is a chore that fit nobody and is on no list, for kids ticked on it — and every such chore a kid can do has one", prob.offer.length === 0, prob.offer.slice(0, 5));
  ok(kind + " · every ×2 payment is its done record's amount (double + Wednesday's zone on the tub), once", prob.pay.length === 0, prob.pay.slice(0, 5));
  ok(kind + " · the ×2 stars in the bank = the done records' stars, net of the undos (" + recs.reduce((a, d) => a + d.pts, 0) + ")", allX2 === recs.reduce((a, d) => a + d.pts, 0), [allX2, recs.length]);
  ok(kind + " · never laid again or carried after it was done as a grab", prob.twice.length === 0, prob.twice.slice(0, 5));
  ok(kind + " · a set-day chore nobody grabbed is first in line the next day (or dropped on its own next day)", prob.carry.length === 0, prob.carry.slice(0, 5));
  ok(kind + " · (sanity) " + recs.length + " ×2 grabs done, " + undone + " undone by Mom, holds left unfinished on some days", recs.length >= 60 && undone >= 5 && held >= 10, [recs.length, undone, held]);
  if (M) {
    const gc = w => J(clone(w.get("grabClaims")) || {}, (k, v) => k === "doneMs" ? 0 : v);
    ok(kind + " · the normal grab records are main's, byte for byte (no ×2 grab ever touches them)", J(clone(S.w.get("grabClaims")) || {}) === J(clone(M.w.get("grabClaims")) || {}));
    const nb = w => KIDS.map(k => F.bank(w, k).filter(x => !/×2 Up for Grabs|↩︎ Mom undid|↩ unchecked/.test(x.note || "")).map(x => x.amount + " " + x.note + " " + x.day).sort());
    ok(kind + " · every other bank line (the normal grabs, the lists) is main's", J(nb(S.w)) === J(nb(M.w)), (() => { const a = nb(S.w), b = nb(M.w); return KIDS.map((k, i) => [a[i].length, b[i].length]); })());
    const gl = w => { const out = [], L = clone(w.get("routineLog")) || {}; Object.keys(L).forEach(k => Object.keys(L[k] || {}).forEach(wk => Object.keys(L[k][wk] || {}).forEach(dn => Object.values(L[k][wk][dn] || {}).forEach(e => { if (e.slot === "grab") out.push([k, wk, dn, e.label, e.act, e.pts].join(" ")); })))); return J(out.sort()); };
    ok(kind + " · every normal grab's Click-off Log line is main's", gl(S.w) === gl(M.w));
    const lsS = lists(S), lsM = lists(M), strip = s => s.replace(/"_done":(true|false),"_waved":(true|false)\}/g, "}");
    ok(kind + " · every person's lists on the last day are main's (the rows on them, in order)", strip(lsS) === strip(lsM));
    // A chore done as a ×2 grab is not laid again the next day (not carried) or (every N) not due again yet — main would lay it — so
    // the plans may part from main's only from the day after the first such grab; up to then they are main's, day for day.
    const days = Object.keys(clone(S.w.get("houseDay")) || {}).sort(), pd = k => J((clone(S.w.get("houseDay/" + k)) || {}).plan || {}) === J((clone(M.w.get("houseDay/" + k)) || {}).plan || {});
    const first = days.find(k => !pd(k)), lead = days.find(k => { const d = clone(S.w.get("houseDay/" + k)) || {}; return Object.keys(d.done || {}).some(id => d.done[id].grab && (d.over[id] || {}).k !== "daily"); });
    ok(kind + " · every day's plan is main's up to the day after the first ×2 grab of a chore that would carry (" + (lead || "none") + "; first difference " + (first || "none") + ")", !first || (lead && first > lead), [first, lead]);
  }
}

// ── C ──
console.log("\n── C · a kid's device left open across midnight ──");
{ const S = await mkW("saved", "on"), C = S.w.boot("C", "devC"); await S.w.flush(); let bad = 0, taps = 0;
  for (let n = 0; n < 14; n++) { await go(S.w, n, 8, 0); const t = isoN(n), stale = F.x2(C, "kid_a").concat(F.x2(C, "kid_b")); if (n) { const y = isoN(n - 1), m = S.w.mark(), b = KIDS.map(k => F.bal(S.w, k));
      ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => ["c_b_tub", "c_a_vac", "c_c_beds", "c_d_shelf", "c_a_morn"].forEach(id => { taps++; C.run("hdGrabDone('" + k + "','" + y + "','" + id + "'); hdGrabHold('" + k + "','" + y + "','" + id + "')"); }));
      await S.w.flush(); if (S.w.since(m).some(l => /^houseDay\/\d{4}-\d\d-\d\d\/(grabs|done)|^bank|^routineLog/.test(l.path) || (l.keys || []).some(k => /grabs|done|bank|routineLog/.test(k))) || KIDS.some((k, i) => F.bal(S.w, k) !== b[i])) bad++; }
    if (stale.length) C.run("hdGrabDone('kid_a','" + t + "','" + F.x2(C, "kid_a")[0] + "')"); await S.w.flush(); await go(S.w, n, 23, 59); }
  ok("14 mornings × " + (taps / 13) + " taps on yesterday's cards: nothing written, nothing paid", bad === 0 && taps > 0, bad);
}

// ── D ──
console.log("\n── D · loading and drawing on a day with offers writes what main writes ──");
if (BASE && BHJS) for (const kind of ["saved", "none"]) {
  const run = async (index, hjs) => { const S = await mkW(kind, "on", { index, hjs }); await go(S.w, 0, 14, 0); const m = S.w.mark(); const C = S.w.boot("C", "devC", { mom: true }); C.run(hjs); await S.w.flush();
    C.run("try{ renderAll(); hhRender(); " + J(KIDS) + ".forEach(function(k){ _grabsHTML(k,false); _grabsHTML(k,true); }); hpOnHTML('kid_a'); htNowHTML(); }catch(e){}"); await S.w.flush(); await S.w.tick();
    return writes(S.w, m).join("\n"); };
  const N = await run(IDX, HJS), O = await run(BASE, BHJS);
  ok(kind + " · a device booted at 2 PM and every page drawn: the same writes as main (" + N.split("\n").length + ")", N === O, (() => { const x = N.split("\n"), y = O.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
