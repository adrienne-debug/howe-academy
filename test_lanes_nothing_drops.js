/*
 * 🛤 LANES — the NOTHING-DROPS audit. Her ask (2026-09-11): "check all the mechanisms doesn't
 * cause the disaster of things getting deleted off the grid — run a test that tests all scenarios."
 *
 * Runs every lane mechanism over a snapshot of the REAL curriculum (test_fixture_lanes_live_
 * 2026-09-11.json: subjects, done, lessons, scheduleOverrides — read-only GET) and checks the one
 * invariant that matters, on three layers:
 *
 *   A. PROJECTION — for every plan-backed subject, in every lane shape: every OPEN lesson (list
 *      minus done, by id) is laid exactly once, in list order; a waiting member lays nothing and
 *      loses nothing; members of a multiple card never share a day and follow the pattern.
 *   B. WRITE PATHS — no lane code can write lessons, subjects, done records or week tasks; the
 *      door writes only its own lane node; the handoff only re-projects; the grid never writes.
 *   C. THE RENDERED GRID — with lanes injected, every stored past cell of every subject is still
 *      drawn, and every open lesson of every running subject is on the grid.
 *
 * Lane shapes covered, per kid, built from the kid's REAL subjects: none · every subject alone in
 * a lane · stack A→B (B waiting) · stack with A finished · stack with A paused · 3-chain with two
 * finished · multiple cards AB / AAB / ABA / AABB / no pattern · borrowed-rhythm multiple card ·
 * 'prior' on the first unit (invalid, tolerated) · a daily subject in a lane (ignored) · a missing
 * subject key (ignored) · every subject in ONE stack lane · hand-added ➕ days on a borrowing member.
 *
 *   run:  node test_lanes_nothing_drops.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixture_lanes_live_2026-09-11.json"), "utf8"));
const TODAY = "2026-09-11";
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let pass = 0, fail = 0; const failures = [];
function ok(name, cond, extra) { if (cond) { pass++; } else { fail++; failures.push(name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 300) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
function fn(name) { const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m")); if (start < 0) throw new Error("fn " + name); let i = src.indexOf("{", start), d = 0; for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(start, j + 1); } } throw new Error("fn " + name); }
const deep = x => JSON.parse(JSON.stringify(x));

// ── one engine context over the fixture (fresh per scenario: lanes / done / paused are mutated) ──
const ENGINE = [
  fn("_cbSpread"), src.slice(src.indexOf("const _lidNorm="), src.indexOf("\n", src.indexOf("const _lidNorm="))),
  fn("_cbParseDate"), fn("_cbISO"), fn("_cbMonday"), fn("cbDefaultForm"), fn("planIdFor"),
  fn("lidsFor"), fn("lidStamped"), fn("lidDoneSet"), fn("lidDoneIdx"), fn("planBacked"),
  block("// PROJ_START", "// PROJ_END"), block("// PLANDROP_START", "// PLANDROP_END"),
  block("function planMaterialize", "// Owed only (for chips)"), block("function planOwed", "// PLANMAT_END"),
  block("// LANE_START", "// LANE_END"),
].join("\n");
function engine(o) {
  o = o || {};
  const subjects = deep(FX.subjects), done = deep(FX.done || {}), lessons = FX.lessons, sov = deep(FX.scheduleOverrides || {});
  const ctx = {
    console, Set, Math, Object, Array, String, Number, JSON, parseInt, Date,
    currData: { subjects, done, lessons, lanes: o.lanes || undefined }, scheduleOverrides: sov, checked: {},
    dbg: () => {}, cbTodayISO: () => TODAY, cbExtendInfo: () => null, cbDayCap: () => 0,
    smapIsKidOff: () => false, coopBlocksBase: () => false, schedOv: (d, k) => ((sov || {})[d] || {})[k] || null, gvDealtDates: () => ({}),
  };
  ctx.schedOvKidOff = (k, d) => { const x = ctx.schedOv(d, k); return !!(x && x.dayOff); };
  ctx.cbFutureRows = (kid, sk) => {
    const L = lessons[kid] || {}; const subs = subjects[kid] || {}; const rows = [];
    const filled = v => v && v !== "—" && v !== "nan" && String(v).trim();
    Object.keys(L).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b).forEach(dn => {
      const l = L[dn]; if (!l || !l.date || l.date <= TODAY) return;
      let usedMin = 0; for (const k2 of Object.keys(subs)) { if (k2 === sk || subs[k2].paused) continue; if (filled(l[k2])) usedMin += subs[k2].minutes || 20; }
      const ov = ctx.schedOv(l.date, kid) || {};
      rows.push({ dayNum: dn, date: l.date, week: l.week || "", dow: DOW[new Date(l.date + "T12:00:00").getDay()], off: !!(ov.dayOff || (ov.removed || {})[sk]), usedMin, hadMine: !!filled(l[sk]) });
    });
    return rows;
  };
  ctx.cbRemainingContent = (kid, sk) => { const s = subjects[kid][sk]; const di = ctx.lidDoneIdx(kid, sk) || new Set(); return (s.lessonSeq || []).filter((_, i) => !di.has(i)); };
  vm.createContext(ctx); new vm.Script(ENGINE).runInContext(ctx);
  ctx._subjects = subjects; ctx._done = done;
  return ctx;
}
const KIDS = Object.keys(FX.subjects).filter(k => Object.keys(FX.subjects[k]).some(sk => { const s = FX.subjects[k][sk]; return s && s.planId && s.doneImportedAt && s.lessonIds; }));
function pbList(c, kid) { return Object.keys(c._subjects[kid]).filter(sk => { const s = c._subjects[kid][sk]; return s && !s.paused && s.tracking !== "daily" && c.planBacked(kid, sk) && c.cbDefaultForm(kid, sk).mode !== "targetDate" && (c.cbDefaultForm(kid, sk).mode !== "pages" || parseInt(c.cbDefaultForm(kid, sk).tpw, 10) > 0); }).sort(); }
function openLids(c, kid, sk) { const s = c._subjects[kid][sk]; const di = c.lidDoneIdx(kid, sk) || new Set(); return (s.lessonIds || []).filter((_, i) => !di.has(i)); }
function addedDays(c, kid, sk) { const out = new Set(); Object.keys(c.scheduleOverrides || {}).forEach(d => { const a = (((c.scheduleOverrides[d] || {})[kid] || {}).added) || {}; if (a[sk] !== undefined && a[sk] !== null && a[sk] !== false) out.add(d); }); return out; }
const onDays = (dates, days) => dates.every(d => days.includes(DOW[new Date(d + "T12:00:00").getDay()]));
// The merged A/B sitting sequence must be the pattern (from some offset) for as long as BOTH
// members still have lessons; after one runs out the letters close ranks by design.
// Spec of the engine: the card's sittings are its rhythm days; letter k goes to pattern[(off+k)%len];
// a member whose sitting day is ✕'d for it simply skips that sitting (the letter is consumed, the
// lesson slides) — its partner never inherits the day. Checked while BOTH still have lessons.
// A ➕ day that is also a pattern day counts as a sitting (letter consumed) AND may carry the
// other member too (its own ➕ ride-along) — Lincoln's Sept-2027 ➕ block is on every subject.
function followsPattern(pat, da, db, xa, xb, pa, pb) {
  const P = (pat || "AB").split(""); xa = xa || new Set(); xb = xb || new Set(); pa = pa || new Set(); pb = pb || new Set();
  const isPat = d => d > TODAY && ["Mon", "Wed", "Fri"].includes(DOW[new Date(d + "T12:00:00").getDay()]);
  const sittings = [...new Set(da.concat(db).concat([...xa]).concat([...xb]))].filter(isPat).sort();
  const A = new Set(da), B = new Set(db);
  for (let off = 0; off < P.length; off++) {
    let a = da.filter(d => !pa.has(d)).length, b = db.filter(d => !pb.has(d)).length, good = true;
    for (let k = 0; k < sittings.length && a > 0 && b > 0; k++) {
      const d = sittings[k], L = P[(off + k) % P.length];
      if (L === "A") { if (xa.has(d)) { continue; } if (!A.has(d) || (B.has(d) && !pb.has(d))) { good = false; break; } a--; }
      else { if (xb.has(d)) { continue; } if (!B.has(d) || (A.has(d) && !pa.has(d))) { good = false; break; } b--; }
    }
    if (good) return true;
  }
  return false;
}
function removedDays(c, kid, sk) { const out = new Set(); Object.keys(c.scheduleOverrides || {}).forEach(d => { const r = (((c.scheduleOverrides[d] || {})[kid] || {}).removed) || {}; if (r[sk]) out.add(d); }); return out; }
function finishAll(c, kid, sk) { const s = c._subjects[kid][sk]; c._done[kid] = c._done[kid] || {}; c._done[kid][sk] = c._done[kid][sk] || {}; (s.lessonIds || []).forEach(id => { c._done[kid][sk][id] = { ts: 1, day: TODAY, src: "test" }; }); }
function lay(c, kid, sk) {
  const r = c.planMaterialize(kid, sk, null, { absorb: false });
  if (!r) return { none: true };
  if (r.waiting) return { waiting: true };
  if (r.finished) return { finished: true };
  if (r.error) return { error: r.error };
  const items = (r.assignments || []).map(a => ({ date: a.date, lid: a.lid })).concat((r.extras || []).map(x => ({ date: x.date, lid: x.lid })));
  items.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  return { lids: items.map(x => x.lid), dates: items.map(x => x.date), unplaced: (r.stats || {}).unplaced || 0 };
}
// THE INVARIANT for one running subject: laid == open (in order), or a strict prefix when the
// calendar ran out (unplaced > 0 — Lucy's Reading Eggs has 1 lesson past her calendar, known).
function assertLaid(name, c, kid, sk, r) {
  const open = openLids(c, kid, sk);
  if (!open.length) { ok(name + ": nothing open → finished", !!r.finished, r); return; }
  ok(name + ": lays something", !!r.lids, r);
  if (!r.lids) return;
  const laid = r.lids;
  ok(name + ": no lesson laid twice", new Set(laid).size === laid.length, laid.filter((x, i) => laid.indexOf(x) !== i));
  const expect = r.unplaced > 0 ? open.slice(0, open.length - r.unplaced) : open;
  ok(name + ": every open lesson laid exactly once, in list order" + (r.unplaced ? " (" + r.unplaced + " past the calendar)" : ""), eq(laid, expect), { laid: laid.length, open: open.length, first: [laid[0], expect[0]], last: [laid[laid.length - 1], expect[expect.length - 1]] });
  ok(name + ": no dropped lessons (nothing beyond the calendar unless the calendar is short)", laid.length + r.unplaced === open.length, { laid: laid.length, unplaced: r.unplaced, open: open.length });
}

console.log("── A. projection over the real curriculum ──");
// S0 baseline — the reference for "identical" checks
const BASE = {}; { const c = engine(); KIDS.forEach(kid => pbList(c, kid).forEach(sk => { BASE[kid + "|" + sk] = lay(c, kid, sk); assertLaid("S0 no lanes " + kid + "/" + sk, c, kid, sk, BASE[kid + "|" + sk]); })); }
ok("S0 covers every plan-backed subject", Object.keys(BASE).length >= 20, Object.keys(BASE).length);

// S1 every subject alone in its own lane → identical to S0
{ const lanes = {}; KIDS.forEach(kid => { const c0 = engine(); lanes[kid] = {}; pbList(c0, kid).forEach(sk => { lanes[kid]["l_" + sk] = { name: sk, units: [{ sk }] }; }); });
  const c = engine({ lanes }); KIDS.forEach(kid => pbList(c, kid).forEach(sk => { const r = lay(c, kid, sk); ok("S1 alone-in-a-lane identical to no lane " + kid + "/" + sk, eq(r, BASE[kid + "|" + sk])); })); }

// S2 stack pairs A→B(prior): B waiting, A identical
function pairs(list) { const out = []; for (let i = 0; i + 1 < list.length; i += 2) out.push([list[i], list[i + 1]]); return out; }
{ const lanes = {}; const P = {}; KIDS.forEach(kid => { const c0 = engine(); lanes[kid] = {}; P[kid] = pairs(pbList(c0, kid)); P[kid].forEach(([a, b], i) => { lanes[kid]["st" + i] = { name: "S" + i, units: [{ sk: a }, { sk: b, rhythm: "prior" }] }; }); });
  const c = engine({ lanes });
  KIDS.forEach(kid => P[kid].forEach(([a, b]) => {
    const ra = lay(c, kid, a), rb = lay(c, kid, b);
    ok("S2 " + kid + ": " + a + " (up) identical to no lane", eq(ra, BASE[kid + "|" + a]));
    ok("S2 " + kid + ": " + b + " waits — lays nothing, loses nothing (" + openLids(c, kid, b).length + " open lessons intact)", !!rb.waiting && openLids(c, kid, b).length === openLids(engine(), kid, b).length, rb);
  }));
  // unpaired leftovers untouched
  KIDS.forEach(kid => { const inLane = new Set(P[kid].flat()); pbList(c, kid).filter(sk => !inLane.has(sk)).forEach(sk => ok("S2 " + kid + ": " + sk + " not in a lane — identical", eq(lay(c, kid, sk), BASE[kid + "|" + sk]))); });
}

// S3 stack with A finished → B up, on A's rhythm, every open lesson of B laid
{ KIDS.forEach(kid => { const c0 = engine(); pairs(pbList(c0, kid)).forEach(([a, b], i) => {
    const c = engine({ lanes: { [kid]: { st: { name: "S", units: [{ sk: a }, { sk: b, rhythm: "prior" }] } } } });
    finishAll(c, kid, a);
    ok("S3 " + kid + ": " + a + " finished reads finished", !!lay(c, kid, a).finished);
    const rb = lay(c, kid, b); assertLaid("S3 " + kid + " " + b + " up after " + a, c, kid, b, rb);
    // borrowed rhythm: B's dates fall on A's allowed days (when A pins days)
    const aDays = (c._subjects[kid][a].allowedDays || []);
    if (aDays.length && rb.dates) { const plus = addedDays(c, kid, b); ok("S3 " + kid + ": " + b + " runs on " + a + "'s days " + aDays.join("/") + " (➕ days aside)", onDays(rb.dates.filter(d => !plus.has(d)), aDays), rb.dates.filter(d => !plus.has(d) && !aDays.includes(DOW[new Date(d + "T12:00:00").getDay()])).slice(0, 5)); }
  }); }); }

// S4 multiple cards — patterns, own rhythm MWF ×3
["AB", "AAB", "ABA", "AABB", ""].forEach(pat => {
  KIDS.forEach(kid => { const c0 = engine(); pairs(pbList(c0, kid)).slice(0, 2).forEach(([a, b]) => {
    const c = engine({ lanes: { [kid]: { mc: { name: "MC", units: [{ subs: [a, b], pattern: pat, rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 1 }] } } } });
    const ra = lay(c, kid, a), rb = lay(c, kid, b);
    assertLaid("S4 '" + (pat || "default") + "' " + kid + " " + a, c, kid, a, ra); assertLaid("S4 '" + (pat || "default") + "' " + kid + " " + b, c, kid, b, rb);
    if (ra.dates && rb.dates) {
      const pa = addedDays(c, kid, a), pb_ = addedDays(c, kid, b);            // Mom's ➕ days ride on top of the pattern, by design
      const da = ra.dates.filter(d => !pa.has(d)), db_ = rb.dates.filter(d => !pb_.has(d));
      const shared = da.filter(d => db_.includes(d));
      ok("S4 '" + (pat || "default") + "' " + kid + ": members never share a pattern day", shared.length === 0, shared.slice(0, 3));
      ok("S4 '" + (pat || "default") + "' " + kid + ": sittings follow the pattern while both have lessons (✕'d sittings skipped)", followsPattern(pat, ra.dates, rb.dates, removedDays(c, kid, a), removedDays(c, kid, b), pa, pb_), da.concat(db_).sort().slice(0, 8));
      ok("S4 '" + (pat || "default") + "' " + kid + ": all pattern sittings on Mon/Wed/Fri", onDays(da.concat(db_), ["Mon", "Wed", "Fri"]));
      // a ➕ day carries a sitting only while lessons remain (Lincoln's ➕ block sits past the end of every book)
      const lastA = ra.dates[ra.dates.length - 1] || "", lastB = rb.dates[rb.dates.length - 1] || "";
      ok("S4 '" + (pat || "default") + "' " + kid + ": every ➕ day before the book ends carries its sitting", [...pa].every(d => d <= TODAY || d > lastA || ra.dates.includes(d)) && [...pb_].every(d => d <= TODAY || d > lastB || rb.dates.includes(d)));
    }
  }); });
});

// S5 paused first unit → next is up; the paused one loses nothing
{ KIDS.forEach(kid => { const c0 = engine(); const [a, b] = pairs(pbList(c0, kid))[0] || [];
  if (!a) return; const c = engine({ lanes: { [kid]: { st: { name: "S", units: [{ sk: a }, { sk: b, rhythm: "prior" }] } } } });
  c._subjects[kid][a].paused = true;
  assertLaid("S5 " + kid + " " + b + " up while " + a + " paused", c, kid, b, lay(c, kid, b));
  ok("S5 " + kid + ": " + a + "'s open lessons are intact", openLids(c, kid, a).length === openLids(engine(), kid, a).length);
}); }

// S6 3-chain, first two finished → third up on the FIRST unit's rhythm (prior chains back)
{ KIDS.forEach(kid => { const c0 = engine(); const L = pbList(c0, kid); if (L.length < 3) return; const [a, b, x] = L;
  const c = engine({ lanes: { [kid]: { ch: { name: "Chain", units: [{ sk: a }, { sk: b, rhythm: "prior" }, { sk: x, rhythm: "prior" }] } } } });
  ok("S6 " + kid + ": third waits while first is up", !!lay(c, kid, x).waiting);
  finishAll(c, kid, a); ok("S6 " + kid + ": second up after first", !!lay(c, kid, b).lids && !!lay(c, kid, x).waiting);
  finishAll(c, kid, b); const rx = lay(c, kid, x); assertLaid("S6 " + kid + " third up after both", c, kid, x, rx);
  const aDays = c._subjects[kid][a].allowedDays || []; if (aDays.length && rx.dates) { const plus = addedDays(c, kid, x); ok("S6 " + kid + ": third runs on the FIRST unit's days (➕ days aside)", onDays(rx.dates.filter(d => !plus.has(d)), aDays)); }
}); }

// S7 'prior' on the very first unit (invalid, but if it ever got stored) → its own rhythm, nothing lost
{ KIDS.forEach(kid => { const c0 = engine(); const a = pbList(c0, kid)[0]; if (!a) return;
  const c = engine({ lanes: { [kid]: { bad: { name: "Bad", units: [{ sk: a, rhythm: "prior" }] } } } });
  ok("S7 " + kid + ": a first unit marked prior behaves as own — identical", eq(lay(c, kid, a), BASE[kid + "|" + a]));
}); }

// S8/S9 junk in a lane: a daily subject, a missing key — ignored, everything else identical
{ KIDS.forEach(kid => { const c0 = engine(); const L = pbList(c0, kid); const daily = Object.keys(c0._subjects[kid]).find(sk => (c0._subjects[kid][sk] || {}).tracking === "daily");
  const c = engine({ lanes: { [kid]: { junk: { name: "Junk", units: [{ sk: daily || "nope" }, { sk: "does_not_exist", rhythm: "prior" }, { sk: L[0], rhythm: "prior" }] } } } });
  L.forEach(sk => ok("S8/9 " + kid + ": " + sk + " unaffected by junk units ahead of it (daily/missing are ignored)", eq(lay(c, kid, sk), BASE[kid + "|" + sk])));
}); }

// S10 every subject of a kid in ONE stack lane: first up identical, all others waiting, nothing lost
{ KIDS.forEach(kid => { const c0 = engine(); const L = pbList(c0, kid); if (L.length < 2) return;
  const c = engine({ lanes: { [kid]: { all: { name: "All", units: L.map((sk, i) => (i ? { sk, rhythm: "prior" } : { sk })) } } } });
  ok("S10 " + kid + ": first identical", eq(lay(c, kid, L[0]), BASE[kid + "|" + L[0]]));
  L.slice(1).forEach(sk => ok("S10 " + kid + ": " + sk + " waiting, lessons intact", !!lay(c, kid, sk).waiting && openLids(c, kid, sk).length === openLids(engine(), kid, sk).length));
  // then finish them one by one — each next steps up with everything intact
  for (let i = 0; i + 1 < L.length; i++) { finishAll(c, kid, L[i]); assertLaid("S10 " + kid + " step " + (i + 1) + " " + L[i + 1], c, kid, L[i + 1], lay(c, kid, L[i + 1])); }
}); }

// S11 hand-added ➕ days for a borrowing member (scheduleOverrides.added) — still laid once, nothing lost
{ KIDS.forEach(kid => { const c0 = engine(); const [a, b] = pairs(pbList(c0, kid))[0] || []; if (!a) return;
  const c = engine({ lanes: { [kid]: { st: { name: "S", units: [{ sk: a }, { sk: b, rhythm: "prior" }] } } } });
  finishAll(c, kid, a);
  const rows = c.cbFutureRows(kid, b).filter(r => !r.off).slice(0, 6); if (rows.length < 2) return;
  const d = rows[1].date; c.scheduleOverrides[d] = c.scheduleOverrides[d] || {}; c.scheduleOverrides[d][kid] = c.scheduleOverrides[d][kid] || {}; (c.scheduleOverrides[d][kid].added = c.scheduleOverrides[d][kid].added || {})[b] = true;
  const rb = lay(c, kid, b); assertLaid("S11 " + kid + " " + b + " with a ➕ day", c, kid, b, rb);
  if (rb.dates) ok("S11 " + kid + ": the ➕ day carries a sitting", rb.dates.includes(d), { d, dates: rb.dates.slice(0, 5) });
}); }

// S12 borrowed rhythm on a multiple card (unit 2 prior) → its sittings on unit 1's days, nothing lost
{ KIDS.forEach(kid => { const c0 = engine(); const L = pbList(c0, kid); if (L.length < 3) return; const [a, b, x] = L;
  const c = engine({ lanes: { [kid]: { m: { name: "M", units: [{ sk: a }, { subs: [b, x], pattern: "AB", rhythm: "prior" }] } } } });
  finishAll(c, kid, a);
  const rb = lay(c, kid, b), rx = lay(c, kid, x); assertLaid("S12 " + kid + " " + b, c, kid, b, rb); assertLaid("S12 " + kid + " " + x, c, kid, x, rx);
  const aDays = c._subjects[kid][a].allowedDays || [];
  if (aDays.length && rb.dates && rx.dates) { const pb_ = addedDays(c, kid, b), px = addedDays(c, kid, x); const db_ = rb.dates.filter(d => !pb_.has(d)), dx = rx.dates.filter(d => !px.has(d));
    ok("S12 " + kid + ": both on " + a + "'s days, never together (➕ days aside)", onDays(db_.concat(dx), aDays) && !db_.some(d => dx.includes(d))); }
}); }

// S13 ✕ one member's day inside a multiple card: the partner's sittings do not move, nothing is lost
{ KIDS.forEach(kid => { const c0 = engine(); const [a, b] = pairs(pbList(c0, kid))[0] || []; if (!a) return;
  const mk = () => engine({ lanes: { [kid]: { mc: { name: "MC", units: [{ subs: [a, b], pattern: "AB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 1 }] } } } });
  const c1 = mk(); const before = { a: lay(c1, kid, a), b: lay(c1, kid, b) }; if (!before.a.dates || before.a.dates.length < 3) return;
  const x = before.a.dates[1];                                                   // A's second sitting gets ✕'d
  const c2 = mk(); c2.scheduleOverrides[x] = c2.scheduleOverrides[x] || {}; c2.scheduleOverrides[x][kid] = c2.scheduleOverrides[x][kid] || {}; (c2.scheduleOverrides[x][kid].removed = c2.scheduleOverrides[x][kid].removed || {})[a] = true;
  const after = { a: lay(c2, kid, a), b: lay(c2, kid, b) };
  assertLaid("S13 " + kid + " " + a + " with a ✕ day", c2, kid, a, after.a);
  ok("S13 " + kid + ": the ✕'d day is no longer " + a + "'s", after.a.dates && !after.a.dates.includes(x));
  ok("S13 " + kid + ": " + b + "'s sittings are exactly as before (the pattern did not shift)", eq(after.b.dates, before.b.dates), { before: (before.b.dates || []).slice(0, 4), after: (after.b.dates || []).slice(0, 4) });
  { const pa = addedDays(c2, kid, a), pb_ = addedDays(c2, kid, b); ok("S13 " + kid + ": still never together (➕ days aside)", after.a.dates && !after.a.dates.filter(d => !pa.has(d)).some(d => (after.b.dates || []).filter(d2 => !pb_.has(d2)).includes(d))); }
}); }

console.log("── B. write paths ──");
{
  const UI = block("// LANE_UI_START", "// LANE_UI_END"), HO = block("// LANE_HANDOFF_START", "// LANE_HANDOFF_END"), LN = block("// LANE_START", "// LANE_END");
  const refs = UI.match(/db\.ref\([^)]*\)/g) || [];
  ok("the door writes ONLY curriculum/lanes/<kid>/<id> and curriculum/lastEdit", refs.length > 0 && refs.every(r => r === 'db.ref("curriculum/lastEdit")' || /^db\.ref\("curriculum\/lanes\/"\+/.test(r)), refs);
  ok("the door never names lessons / subjects / done / week tasks", !/curriculum\/lessons|curriculum\/subjects|curriculum\/done|\/tasks/.test(UI));
  ok("the engine block has no writes at all", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(LN));
  ok("the handoff has no writes of its own — only reprojectSubjectWeek (targeted, locked, active week)", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(HO) && /reprojectSubjectWeek\(kid,x/.test(HO));
  ok("renderCurrGrid still has no writes", !/db\.ref\(/.test(fn("renderCurrGrid")));
  ok("gvSubjectCols is untouched (orphan cleanup still sees real orphans, never a lane key)", /return Object\.keys\(seen\)\.filter\(sk=>!subs\[sk\]\|\|subs\[sk\]\.tracking!=="daily"\)/.test(fn("gvSubjectCols")));
  const merge = src.slice(src.indexOf('let _keep=dates.filter(function(d){ return d<=_t; });'), src.indexOf("const cursor=(savedCursors", src.indexOf('let _keep=dates.filter')));
  ok("the generator's lane rule only touches THIS subject's own dayData entries", /delete dayData\[d\]\[kid\]\[sk\]/.test(merge) && !/delete dayData\[d\]\[kid\];/.test(merge) && !/delete dayData\[d\];/.test(merge));
  ok("the week diff never removes a card whose lesson is not done (nothing drops)", /doneLids/.test(block("// REPROJ_START", "// REPROJ_END")));
}

console.log("── C. the rendered grid, real data, lanes injected ──");
{
  const GRID = [
    fn("esc"), fn("_cbSpread"), fn("_cbParseDate"), fn("_cbISO"), fn("_cbMonday"), fn("cbDefaultForm"), fn("planIdFor"),
    fn("gvSubjectCols"), fn("cbHasGridCells"), fn("cbCardOnlySubjects"), fn("cbOtherSubjects"),
    fn("lidsFor"), fn("lidStamped"), fn("lidDoneSet"), fn("lidDoneIdx"), fn("planBacked"),
    src.slice(src.indexOf("const _lidNorm="), src.indexOf("\n", src.indexOf("const _lidNorm="))),
    block("// PROJ_START", "// PROJ_END"), block("// PLANDROP_START", "// PLANDROP_END"),
    block("function planMaterialize", "// Owed only (for chips)"), block("function planOwed", "// PLANMAT_END"),
    block("// LANE_START", "// LANE_END"), block("// GVDER_START", "// GVDER_END"), fn("renderCurrGrid"),
  ].join("\n");
  function render(kid, lanes, mutate) {
    const subjects = deep(FX.subjects), done = deep(FX.done || {}), lessons = deep(FX.lessons), sov = deep(FX.scheduleOverrides || {});
    const ctx = {
      console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, Date, RegExp, Error,
      currData: { subjects, done, lessons, lanes: lanes || undefined, skiplog: {}, targetEnd: {} }, scheduleOverrides: sov, checked: {}, weekData: { tasks: [] }, paceData: { subjects: {} },
      gvKid: kid, gvShowPast: true, gvSelMode: false, gvSel: new Set(), gvSelAnchor: null, gvEdit: null, gvMenu: null, gvSelUndo: null, lmMovePick: null, lmMoveWeek: null,
      cbRulesOpen: false, cbKid: kid, cbGate: null, KID_COLOR: {}, DAY_DT: {}, momModeActive: true, adminPinUnlocked: false,
      dbg: () => {}, cbTodayISO: () => TODAY, gwParseDate: s => { const p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
      cbExtendInfo: () => null, cbDayCap: () => 0, cbOverCapDays: () => 0, smapIsKidOff: () => false, coopBlocksBase: () => false, coopNoMomBaseFor: () => "", coopsOnDate: () => [],
      schedOv: (d, k) => ((sov || {})[d] || {})[k] || null, computeFutureSlots: () => ({}), retrTracks: () => [], formatPlanDate: d => d, cap: s => s, cbRenderRules: () => "", cbRenderGate: () => "",
      document: { getElementById: () => null, querySelector: () => null }, setTimeout: () => 0,
      ROSTER: KIDS, currViewKid: kid, gvKidCfgOpen: false, cbMsg: "", cbLastBuild: null, momVerifyKid: null, lmLastMove: null, gvScrollTop: 0, gvScrollLeft: 0, RETR_SLOT_TITLE: {},
      ceRenderSessions: () => "", ceConvUndoBanner: () => "", fbRender: () => "", gvAuditRender: () => "", alignPlanPreview: () => null,
      pacePhantomKeys: () => [], lidUnassigned: () => [], lidImportPending: () => [], lidOutOfOrderAll: () => [], skiplogLeftovers: () => [], dayTokenLeftovers: () => [],
      capLeftovers: () => ({ items: [], orphans: [], node: null }), planPending: () => [], gvNoSeqSubjects: () => [], gvMissingDays: () => [], gvSelFilledCount: () => 0, gvSelSingleSubject: () => null,
      retrDayKinds: () => [], retrSlotMinutes: () => 15, gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    };
    ctx.schedOvKidOff = (k, d) => { const x = ctx.schedOv(d, k); return !!(x && x.dayOff); };
    ctx.cbDoneCellSet = (k, sk, cells) => { const di = ctx.lidDoneIdx(k, sk); if (!di) return null; const seq = subjects[k][sk].lessonSeq || []; const out = new Set(); cells.forEach((c, i) => { const idx = seq.indexOf(c.text); if (idx >= 0 && di.has(idx)) out.add(i); }); return out; };
    ctx.cbRemainingContent = (k, sk) => { const di = ctx.lidDoneIdx(k, sk) || new Set(); return (subjects[k][sk].lessonSeq || []).filter((_, i) => !di.has(i)); };
    ctx.cbFutureRows = (k, sk) => { const L = lessons[k] || {}; const subs = subjects[k] || {}; const rows = []; const filled = ctx.gvFilled;
      Object.keys(L).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b).forEach(dn => { const l = L[dn]; if (!l || !l.date || l.date <= TODAY) return; let usedMin = 0; for (const k2 of Object.keys(subs)) { if (k2 === sk || subs[k2].paused) continue; if (filled(l[k2])) usedMin += subs[k2].minutes || 20; } const ov = ctx.schedOv(l.date, k) || {};
        rows.push({ dayNum: dn, date: l.date, week: l.week || "", dow: DOW[new Date(l.date + "T12:00:00").getDay()], off: !!(ov.dayOff || (ov.removed || {})[sk]), usedMin, hadMine: !!filled(l[sk]) }); });
      return rows; };
    vm.createContext(ctx); new vm.Script(GRID).runInContext(ctx);
    ctx._subjects = subjects; ctx._done = done;
    if (mutate) mutate(ctx, subjects, done);
    const el = { innerHTML: "" }; ctx.renderCurrGrid(el);
    return { html: el.innerHTML, ctx, subjects, done, lessons };
  }
  const escT = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function auditRender(name, kid, lanes, mutate) {
    let r; try { r = render(kid, lanes, mutate); } catch (e) { ok(name + ": renders", false, String(e && e.stack).slice(0, 300)); return; }
    const { html, ctx, subjects, lessons } = r; const filled = ctx.gvFilled;
    // every stored PAST cell of every subject is drawn
    let pastCells = 0, pastMissing = [];
    Object.keys(lessons[kid] || {}).forEach(dn => { const l = lessons[kid][dn]; if (!l || !l.date || l.date >= TODAY) return;
      Object.keys(l).forEach(sk => { if (sk === "date" || sk === "week" || !filled(l[sk])) return; const s = subjects[kid][sk]; if (!s || s.tracking === "daily") return; pastCells++; if (html.indexOf(escT(l[sk])) < 0) pastMissing.push(l.date + " " + sk + " " + l[sk]); }); });
    ok(name + ": every stored past cell is still on the grid (" + pastCells + ")", pastMissing.length === 0, pastMissing.slice(0, 5));
    // every open lesson of every RUNNING plan-backed subject is on the grid; a waiting one shows none of its future
    let openOn = 0, openMissing = [];
    pbList(ctx, kid).forEach(sk => { const res = ctx.planMaterialize(kid, sk, null, { absorb: false }); if (!res || res.waiting || res.finished || res.error) return;
      (res.assignments || []).forEach(a => { openOn++; if (html.indexOf(escT(a.text)) < 0) openMissing.push(sk + " " + a.date + " " + a.text); }); });
    ok(name + ": every projected open lesson is on the grid (" + openOn + ")", openMissing.length === 0, openMissing.slice(0, 5));
    ok(name + ": no lane key ever becomes a cell id", !/id="gv-c-\d+-lane:/.test(html));
  }
  KIDS.forEach(kid => {
    const c0 = engine(); const L = pbList(c0, kid); const P = pairs(L);
    auditRender("C " + kid + " no lanes", kid, null);
    const st = {}; P.forEach(([a, b], i) => { st["s" + i] = { name: "S" + i, units: [{ sk: a }, { sk: b, rhythm: "prior" }] }; });
    auditRender("C " + kid + " stacks (successors waiting)", kid, { [kid]: st });
    auditRender("C " + kid + " stacks, first unit finished", kid, { [kid]: st }, (ctx, subjects, done) => { P.forEach(([a]) => { done[kid] = done[kid] || {}; done[kid][a] = done[kid][a] || {}; (subjects[kid][a].lessonIds || []).forEach(id => { done[kid][a][id] = { ts: 1, day: TODAY }; }); }); });
    if (P.length) { const [a, b] = P[0]; auditRender("C " + kid + " multiple card AAB", kid, { [kid]: { mc: { name: "MC", units: [{ subs: [a, b], pattern: "AAB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 1 }] } } }); }
    if (L.length >= 2) auditRender("C " + kid + " everything in one lane", kid, { [kid]: { all: { name: "All", units: L.map((sk, i) => (i ? { sk, rhythm: "prior" } : { sk })) } } });
  });
}

if (failures.length) { console.log("\nFAILURES:"); failures.forEach(f => console.log("  FAIL- " + f)); }
console.log("\n" + pass + " passed, " + fail + " failed" + "  (kids: " + KIDS.join(", ") + ")");
process.exit(fail ? 1 : 0);
