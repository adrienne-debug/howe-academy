/*
 * Node tests for 🛤 LANES, Stage 1 — the engine only (nothing in the UI yet).
 *
 * A lane is a CATEGORY: a name and an ordered list of units. Units run in order; the first
 * with open lessons is UP and, when it finishes, the next takes its place. A unit is a single
 * card (own rhythm, or "prior" = borrow the nearest earlier unit's days/×wk/cap) or a
 * multiple card (sub-cards sharing one rhythm under a pattern such as AAB / ABA / AABB).
 *
 * These run the REAL planMaterialize over a synthetic curriculum (LANE + PROJ + PLANDROP
 * blocks and the helpers they call, sliced from index.html; calendar readers stubbed), plus
 * the wiring in the generator (_gwPlanDatesInner) and the Grid (gvDerivedColumn).
 *
 *   run:  node test_lanes.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a + " / " + b); return src.slice(i, j); }
function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn " + name);
  let i = src.indexOf("{", start), depth = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") depth++; else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); } }
  throw new Error("fn " + name);
}
const CODE = [
  extractFn("_cbSpread"), src.slice(src.indexOf("const _lidNorm="), src.indexOf("\n", src.indexOf("const _lidNorm="))), extractFn("_cbParseDate"), extractFn("_cbISO"), extractFn("_cbMonday"),
  extractFn("cbDefaultForm"), extractFn("planIdFor"),
  block("// PROJ_START", "// PROJ_END"),
  block("// PLANDROP_START", "// PLANDROP_END"),
  block("function planMaterialize", "// Owed only (for chips)"),
  block("function planOwed", "// PLANMAT_END"),
  block("// LANE_START", "// LANE_END"),
].join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

// ── synthetic world ──────────────────────────────────────────────────────────
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = "2026-09-13";           // a Sunday: the first future row is Mon 2026-09-14
function futureRows(weeks) {
  const out = []; const t0 = Date.UTC(2026, 8, 14); let dn = 100;
  for (let d = 0; d < weeks * 7; d++) { const dt = new Date(t0 + d * 86400000); const dow = dt.getUTCDay(); if (dow === 0 || dow === 6) continue;
    const iso = dt.toISOString().slice(0, 10); out.push({ dayNum: ++dn, date: iso, week: "Wk " + (1 + Math.floor(d / 7)), dow: DOW[dow], off: false, usedMin: 0, hadMine: false }); }
  return out;
}
const W = (wk, dow) => { const r = futureRows(6).find(r => r.week === "Wk " + wk && r.dow === dow); return r ? r.date : null; };

function subj(display, lessons, days, tpw, extra) {
  const seq = Array.from({ length: lessons }, (_, i) => display + " L" + (i + 1));
  return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), nextLid: lessons + 1,
    doneImportedAt: "2026-08-16", planId: "kid__" + display, allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw },
    minutes: 15, cap: 1 }, extra || {});
}
function world(o) {
  o = o || {};
  const subjects = o.subjects || {};
  const done = o.done || {};
  const ctx = {
    console, Set, Math, Object, Array, String, Number, JSON, parseInt, Date,
    currData: { subjects: { kid: subjects }, done: { kid: done }, lessons: { kid: {} }, lanes: o.lanes ? { kid: o.lanes } : undefined },
    scheduleOverrides: {}, checked: o.checked || {},
    dbg: () => {}, cbTodayISO: () => TODAY,
    cbFutureRows: () => futureRows(o.weeks || 6), cbExtendInfo: () => null, cbBlockedDates: () => [], cbDayCap: () => 0,
    smapIsKidOff: () => false, schedOvKidOff: () => false, schedOv: () => null, coopBlocksBase: () => false,
    gvDealtDates: (k, sk) => ((o.dealt || {})[sk]) || {},
  };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys(done[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  ctx.cbRemainingContent = (k, sk) => { const di = ctx.lidDoneIdx(k, sk) || new Set(); return (subjects[sk].lessonSeq || []).filter((_, i) => !di.has(i)); };
  vm.createContext(ctx);
  new vm.Script(CODE).runInContext(ctx);
  return ctx;
}
const doneN = (s, n) => { const o = {}; for (let i = 0; i < n; i++) o["L" + String(i + 1).padStart(4, "0")] = { ts: 1, day: "2026-09-0" + (1 + (i % 9)) }; return o; };
const dates = res => (res && res.assignments ? res.assignments.map(a => a.date) : null);
const texts = res => (res && res.assignments ? res.assignments.map(a => a.text) : null);

// ── 0. inert without lanes ───────────────────────────────────────────────────
console.log("── no lanes: nothing changes ──");
{
  const c = world({ subjects: { geo: subj("Geo", 4, ["Mon", "Wed", "Fri"], 3) } });
  ok("lnOf is null when the curriculum has no lanes node", c.lnOf("kid", "geo") === null);
  const r = c.planMaterialize("kid", "geo", null, { absorb: false });
  ok("a plain plan-backed subject lays its own pattern", eq(dates(r), [W(1, "Mon"), W(1, "Wed"), W(1, "Fri"), W(2, "Mon")]), dates(r));
  ok("no waiting / finished flags on a normal lay", !r.waiting && !r.finished);
  const c2 = world({ subjects: { geo: subj("Geo", 2, ["Mon"], 1) }, done: { geo: doneN("geo", 2) } });
  const f = c2.planMaterialize("kid", "geo", null, { absorb: false });
  ok("every lesson done → finished is now a STATE, error text unchanged", f.finished === true && /every lesson is finished/.test(f.error), f);
  ok("subjectFinished agrees", c2.subjectFinished("kid", "geo") === true && c.subjectFinished("kid", "geo") === false);
}

// ── 1. a stack: 3B → 4A ("same as the one before") ──────────────────────────
console.log("\n── stack: one after another ──");
const stack = (doneA, opts) => world(Object.assign({
  subjects: { s3b: subj("3B", 2, ["Mon", "Wed", "Fri"], 3, { cap: 2 }), s4a: subj("4A", 5, ["Tue"], 1) },
  done: { s3b: doneN("s3b", doneA) },
  lanes: { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }] } },
}, opts || {}));
{
  const c = stack(0);
  ok("membership is derived by scanning lanes", c.lnOf("kid", "s4a").id === "math" && c.lnOf("kid", "s4a").unitIdx === 1);
  ok("the first unit with open lessons is up", c.lnUp("kid", "math") === 0);
  const a = c.planMaterialize("kid", "s3b", null, { absorb: false });
  ok("3B lays on its own days", eq(dates(a), [W(1, "Mon"), W(1, "Wed")]), dates(a));
  const b = c.planMaterialize("kid", "s4a", null, { absorb: false });
  ok("4A is WAITING — lays nothing, says who is up", b.waiting === true && /Waiting in lane Math/.test(b.error) && /3B/.test(b.error), b);
  ok("a waiting unit owes nothing", c.planOwed("kid", "s4a") === 0);
}
{
  const c = stack(2);
  ok("3B done → 4A is up", c.lnUp("kid", "math") === 1);
  const a = c.planMaterialize("kid", "s3b", null, { absorb: false });
  ok("3B reports finished, not waiting", a.finished === true && !a.waiting);
  const b = c.planMaterialize("kid", "s4a", null, { absorb: false });
  ok("4A takes 3B's place on 3B's rhythm (Mon/Wed/Fri ×3), not its own Tuesday",
    eq(dates(b), [W(1, "Mon"), W(1, "Wed"), W(1, "Fri"), W(2, "Mon"), W(2, "Wed")]), dates(b));
  ok("4A's lessons come in its own book order", eq(texts(b), ["4A L1", "4A L2", "4A L3", "4A L4", "4A L5"]), texts(b));
  const rh = c.lnRhythm("kid", "math", 1);
  ok("the borrowed rhythm is a pointer to unit 0 (cap included)", rh.fromIdx === 0 && rh.own === false && rh.cap === 2 && rh.tpw === 3, rh);
  const rh0 = c.lnRhythm("kid", "math", 0);
  ok("a single card on its own settings reads as own", rh0.own === true && rh0.fromIdx === 0);
}
{
  const c = stack(2, { lanes: { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "own" }] } } });
  const b = c.planMaterialize("kid", "s4a", null, { absorb: false });
  ok("rhythm 'own' keeps 4A's own Tuesday", eq(dates(b).slice(0, 2), [W(1, "Tue"), W(2, "Tue")]), dates(b));
}
{
  // rules flow down from the NEAREST unit that set its own
  const c = world({
    subjects: { a: subj("A", 1, ["Mon"], 1), b: subj("B", 1, ["Tue", "Thu"], 2), cc: subj("C", 3, ["Fri"], 1) },
    done: { a: doneN("a", 1), b: doneN("b", 1) },
    lanes: { l: { name: "L", units: [{ sk: "a" }, { sk: "b" }, { sk: "cc", rhythm: "prior" }] } },
  });
  const r = c.planMaterialize("kid", "cc", null, { absorb: false });
  ok("'prior' borrows from B (Tue/Thu), not A", eq(dates(r), [W(1, "Tue"), W(1, "Thu"), W(2, "Tue")]), dates(r));
  const c2 = world({
    subjects: { a: subj("A", 1, ["Mon"], 1), b: subj("B", 1, ["Tue", "Thu"], 2), cc: subj("C", 2, ["Fri"], 1) },
    done: { a: doneN("a", 1), b: doneN("b", 1) },
    lanes: { l: { name: "L", units: [{ sk: "a" }, { sk: "b", rhythm: "prior" }, { sk: "cc", rhythm: "prior" }] } },
  });
  const r2 = c2.planMaterialize("kid", "cc", null, { absorb: false });
  ok("a chain of 'prior' walks back to A (Mon)", eq(dates(r2), [W(1, "Mon"), W(2, "Mon")]), dates(r2));
}
{
  const c = world({
    subjects: { a: subj("A", 3, ["Mon"], 1, { paused: true }), b: subj("B", 2, ["Wed"], 1) },
    lanes: { l: { name: "L", units: [{ sk: "a" }, { sk: "b" }] } },
  });
  ok("a paused unit is skipped as if absent", c.lnUp("kid", "l") === 1);
  const r = c.planMaterialize("kid", "b", null, { absorb: false });
  ok("— and the next unit is up", eq(dates(r), [W(1, "Wed"), W(2, "Wed")]), dates(r));
}
{
  const c = world({ subjects: { a: subj("A", 1, ["Mon"], 1) }, done: { a: doneN("a", 1) }, lanes: { l: { name: "L", units: [{ sk: "a" }] } } });
  ok("a lane with nothing open has no unit up", c.lnUp("kid", "l") === -1 && c.lnUpLabel("kid", "l") === "nothing");
}

// ── 2. a multiple card with a pattern ────────────────────────────────────────
console.log("\n── multiple card: AAB / ABA / AABB ──");
const multi = (pattern, o) => world(Object.assign({
  subjects: { geo: subj("Geo", 6, ["Tue"], 1), sci: subj("Sci", 6, ["Thu"], 1) },   // own days deliberately WRONG: the card's rhythm must win
  lanes: { gs: { name: "Geo/Sci", units: [{ subs: ["geo", "sci"], pattern, rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 1 }] } },
}, o || {}));
{
  const c = multi("AAB");
  const g = c.planMaterialize("kid", "geo", null, { absorb: false }), s = c.planMaterialize("kid", "sci", null, { absorb: false });
  ok("AAB — Geo takes Mon+Wed each week", eq(dates(g), [W(1, "Mon"), W(1, "Wed"), W(2, "Mon"), W(2, "Wed"), W(3, "Mon"), W(3, "Wed")]), dates(g));
  ok("AAB — Sci takes Fri each week", eq(dates(s), [W(1, "Fri"), W(2, "Fri"), W(3, "Fri"), W(4, "Fri"), W(5, "Fri"), W(6, "Fri")]), dates(s));
  ok("the card's rhythm wins over the sub-cards' own days (no Tue/Thu)", !dates(g).concat(dates(s)).some(d => /Tue|Thu/.test(DOW[new Date(d + "T00:00:00Z").getUTCDay()])));
  ok("nothing shared: no date appears in both", !dates(g).some(d => dates(s).includes(d)));
  ok("each in its own book order", eq(texts(g), ["Geo L1", "Geo L2", "Geo L3", "Geo L4", "Geo L5", "Geo L6"]) && texts(s)[0] === "Sci L1");
  const g2 = c.planMaterialize("kid", "geo", null, { absorb: false });
  ok("deterministic", eq(g, g2));
}
{
  const c = multi("ABA");
  const g = c.planMaterialize("kid", "geo", null, { absorb: false }), s = c.planMaterialize("kid", "sci", null, { absorb: false });
  ok("ABA — Geo Mon+Fri, Sci Wed", eq(dates(g).slice(0, 4), [W(1, "Mon"), W(1, "Fri"), W(2, "Mon"), W(2, "Fri")]) && eq(dates(s).slice(0, 2), [W(1, "Wed"), W(2, "Wed")]), [dates(g), dates(s)]);
}
{
  const c = multi("AABB");
  const g = c.planMaterialize("kid", "geo", null, { absorb: false }), s = c.planMaterialize("kid", "sci", null, { absorb: false });
  ok("AABB runs across the week boundary: Mon Wed → A A, Fri Mon → B B, Wed Fri → A A",
    eq(dates(g).slice(0, 4), [W(1, "Mon"), W(1, "Wed"), W(2, "Wed"), W(2, "Fri")]) && eq(dates(s).slice(0, 2), [W(1, "Fri"), W(2, "Mon")]), [dates(g), dates(s)]);
}
{
  const c = multi("AB", { subjects: { geo: subj("Geo", 6, ["Tue"], 1), sci: subj("Sci", 6, ["Thu"], 1), art: subj("Art", 6, ["Thu"], 1) },
    lanes: { gs: { name: "3", units: [{ subs: ["geo", "sci", "art"], pattern: "", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3 }] } } });
  const a = c.planMaterialize("kid", "art", null, { absorb: false });
  ok("no pattern = one letter per sub-card in order (C gets Fri)", eq(dates(a).slice(0, 2), [W(1, "Fri"), W(2, "Fri")]), dates(a));
}
{
  // the pattern picks up where it left off: position = done + dealt-unchecked
  const c = multi("AAB", { done: { geo: doneN("geo", 1) } });        // 1 sitting so far → next letter is index 1 (A), then B
  const g = c.planMaterialize("kid", "geo", null, { absorb: false }), s = c.planMaterialize("kid", "sci", null, { absorb: false });
  ok("position 1: Mon A, Wed B, Fri A", eq(dates(g).slice(0, 2), [W(1, "Mon"), W(1, "Fri")]) && dates(s)[0] === W(1, "Wed"), [dates(g), dates(s)]);
  const c2 = multi("AAB", { done: { geo: doneN("geo", 2), sci: doneN("sci", 1) } });   // 3 sittings = one full cycle
  const g2 = c2.planMaterialize("kid", "geo", null, { absorb: false });
  ok("position 3 = back to the start of the pattern", eq(dates(g2).slice(0, 2), [W(1, "Mon"), W(1, "Wed")]), dates(g2));
}
{
  // closing ranks
  const c = multi("AAB", { done: { sci: doneN("sci", 6) } });
  const g = c.planMaterialize("kid", "geo", null, { absorb: false }), s = c.planMaterialize("kid", "sci", null, { absorb: false });
  ok("Sci finished → Geo takes every sitting (AAB → A)", eq(dates(g).slice(0, 4), [W(1, "Mon"), W(1, "Wed"), W(1, "Fri"), W(2, "Mon")]), dates(g));
  ok("Sci reports finished", s.finished === true);
  const p = multi("AAB", { subjects: { geo: subj("Geo", 6, ["Tue"], 1, { paused: true }), sci: subj("Sci", 6, ["Thu"], 1) } });
  const ps = p.planMaterialize("kid", "sci", null, { absorb: false });
  ok("a paused sub-card drops out of the pattern (AAB → B on every sitting)", eq(dates(ps).slice(0, 3), [W(1, "Mon"), W(1, "Wed"), W(1, "Fri")]), dates(ps));
  const d = p._lnDeal({ pattern: "AAB", subs: [{ sk: "a", open: false }, { sk: "b", open: false }], sittings: ["x", "y"], pos: 0 });
  ok("no open letters → nobody is dealt anything", eq(d.live, []) && eq(d.bySk, { a: [], b: [] }), d);
}
{
  // the multiple card is a unit like any other: when ALL its sub-cards finish, the next unit is up
  const c = world({
    subjects: { geo: subj("Geo", 1, ["Tue"], 1), sci: subj("Sci", 1, ["Thu"], 1), nxt: subj("Next", 2, ["Wed"], 1) },
    done: { geo: doneN("geo", 1), sci: doneN("sci", 1) },
    lanes: { l: { name: "L", units: [{ subs: ["geo", "sci"], pattern: "AB", rhythm: "own", allowedDays: ["Mon", "Fri"], timesPerWeek: 2 }, { sk: "nxt", rhythm: "prior" }] } },
  });
  ok("finished multiple card → next unit up", c.lnUp("kid", "l") === 1);
  const r = c.planMaterialize("kid", "nxt", null, { absorb: false });
  ok("— and it borrows the card's rhythm (Mon/Fri)", eq(dates(r), [W(1, "Mon"), W(1, "Fri")]), dates(r));
}
{
  // nothing dropped, nothing doubled — across a long pattern and two books of different length
  const c = multi("AABAB", { subjects: { geo: subj("Geo", 9, ["Tue"], 1), sci: subj("Sci", 4, ["Thu"], 1) } });
  const g = c.planMaterialize("kid", "geo", null, { absorb: false }), s = c.planMaterialize("kid", "sci", null, { absorb: false });
  const all = texts(g).concat(texts(s));
  ok("every open lesson placed exactly once", all.length === 13 && new Set(all).size === 13, all);
  ok("Geo's 9 in order, Sci's 4 in order", eq(texts(g), Array.from({ length: 9 }, (_, i) => "Geo L" + (i + 1))) && eq(texts(s), ["Sci L1", "Sci L2", "Sci L3", "Sci L4"]));
  const ds = dates(g).concat(dates(s)); ok("no date used twice", new Set(ds).size === ds.length);
}

// ── 3. dealt cards (Grid context): partners' cards count ────────────────────
console.log("\n── dealt cards across a multiple card ──");
{
  const c = multi("AAB", { dealt: { geo: { [W(1, "Wed")]: { text: "Geo L1", lid: "L0001", id: "card1" } } } });
  const g = c.planMaterialize("kid", "geo", null, { absorb: false, dealt: c.gvDealtDates("kid", "geo") });
  const s = c.planMaterialize("kid", "sci", null, { absorb: false, dealt: {} });
  ok("Geo's dealt lesson comes out of its content", texts(g)[0] === "Geo L2", texts(g));
  ok("nothing projects at or before the last dealt day, for EITHER sub-card", !dates(g).some(d => d <= W(1, "Wed")) && !dates(s).some(d => d <= W(1, "Wed")), [dates(g), dates(s)]);
  ok("the week's quota is charged for the dealt card (Fri only left in week 1)",
    dates(g).concat(dates(s)).filter(d => d < W(2, "Mon")).length === 1);
  ok("pattern resumes after the dealt sitting: Fri A, Mon B, Wed A",
    dates(g)[0] === W(1, "Fri") && dates(s)[0] === W(2, "Mon") && dates(g)[1] === W(2, "Wed"), [dates(g), dates(s)]);
  const c2 = multi("AAB", { dealt: { geo: { [W(1, "Wed")]: { text: "Geo L1", lid: "L0001", id: "card1" } } }, checked: { card1: true }, done: { geo: doneN("geo", 1) } });
  const g2 = c2.planMaterialize("kid", "geo", null, { absorb: false, dealt: c2.gvDealtDates("kid", "geo") });
  ok("a checked card is counted once (done record), not twice", g2.assignments[0].date === W(1, "Fri") && g2.assignments[1].date === W(2, "Wed"), dates(g2));
}

// ── 4. Firebase shapes ───────────────────────────────────────────────────────
console.log("\n── data shapes ──");
{
  const c = world({
    subjects: { a: subj("A", 1, ["Mon"], 1), b: subj("B", 1, ["Wed"], 1) },
    lanes: { l: { name: "L", units: { "0": null, "2": { sk: "b" }, "1": { sk: "a" } } } },
  });
  ok("object-shaped units (sparse, unordered keys) read in numeric order with holes dropped", eq(c.lnUnits("kid", "l").map(u => u.sk), ["a", "b"]));
  const c2 = world({ subjects: { a: subj("A", 1, ["Mon"], 1), b: subj("B", 1, ["Wed"], 1) },
    lanes: { l: { name: "L", units: [{ subs: { "1": "b", "0": "a" }, pattern: "AB" }] } } });
  ok("object-shaped subs too", eq(c2.lnUnitSubs(c2.lnUnits("kid", "l")[0]), ["a", "b"]));
  const c3 = world({ subjects: { a: subj("A", 1, ["Mon"], 1), z: { display: "Z", tracking: "daily" } }, lanes: { l: { name: "L", units: [{ sk: "z" }, { sk: "a" }] } } });
  ok("a member that is not plan-backed is ignored as if absent", c3.lnUp("kid", "l") === 1 && c3.lnOpenCount("kid", "z") === 0);
}

// ── 5. wiring: generator + Grid + upload carry ──────────────────────────────
console.log("\n── wiring ──");
{
  const g = block("// GWPJ_START", "// GWPJ_END");
  const run = res => { const ctx = { planBacked: () => true, planMaterialize: () => res, dbg: () => {}, Date }; vm.createContext(ctx); vm.runInContext(g + "\nvar __r=_gwPlanDatesInner('k','s',{'2026-09-14':1});", ctx); return ctx.__r; };
  ok("generator: a WAITING unit takes no days this week (empty list, not null)", eq(run({ error: "Waiting", waiting: true }), []));
  ok("generator: a FINISHED subject takes no days this week", eq(run({ error: "Nothing left", finished: true }), []));
  ok("generator: any other error still returns null (keep the cells)", run({ error: "Nothing could be placed" }) === null);
  ok("generator: a normal lay is unchanged", eq(run({ assignments: [{ date: "2026-09-14" }], extras: [] }), ["2026-09-14"]));
}
{
  const gd = block("// GVDER_START", "// GVDER_END");
  const run = (res, tasks) => { const ctx = { planBacked: () => true, currData: { subjects: { k: { s: {} } } }, weekData: { tasks: tasks || [] }, planMaterialize: () => res, Date, String, Object }; vm.createContext(ctx); vm.runInContext(gd + "\nvar __r=gvDerivedColumn('k','s');", ctx); return ctx.__r; };
  const w = run({ error: "Waiting in lane", waiting: true });
  ok("Grid: a waiting unit renders BLANK future cells (no err → no stale-text fallback)", w && w.blank === true && !w.err && eq(w.byDate, {}), w);
  const f = run({ error: "Nothing left to lay — every lesson is finished.", finished: true });
  ok("Grid: a finished subject renders blank too — the ghost-text fallback is gone", f && f.blank === true && !f.err, f);
  const e = run({ error: "Nothing could be placed" });
  ok("Grid: other errors still fall back as before", e && e.err && !e.blank, e);
}
{
  const cell = src.slice(src.indexOf("const _derCol=(!past&&_gvDer[sk]&&!_gvDer[sk].err"), src.indexOf("const _derCol=(!past&&_gvDer[sk]&&!_gvDer[sk].err") + 300);
  ok("the cell reads the derived value whenever there is no err — so blank stays blank", /const v=_derCol\?\(\(_derCol\.byDate\[l\.date\]\|\|\{\}\)\.text\|\|""\):l\[sk\]/.test(cell));
  ok("the legacy xlsx upload carries `lanes` forward (whole-node set would wipe it)", /\["done","skiplog","rebaseline","dayCap","groups","plans","lanes"\]/.test(src));
  const pm = block("function planMaterialize", "// Owed only (for chips)");
  ok("planMaterialize: the lane hook sits before the mode guard, after planBacked", pm.indexOf("LANE_HOOK_A") > pm.indexOf("planBacked(kid,sk))) return null;") && pm.indexOf("LANE_HOOK_A") < pm.indexOf('f.mode==="timesPerWeek"||f.mode==="targetDate"'));
  ok("planMaterialize: no lane → _ln is null and the form is untouched", /const _ln=\(typeof lnOf==="function"\)\?lnOf\(kid,sk\):null;/.test(pm) && /if\(_lnRh&&!_lnRh\.own\) f=Object\.assign/.test(pm));
  ok("planMaterialize: absorb wiring untouched", /cap:_absorb\?cap:1/.test(pm) && /anchor:_absorb\?anchor:null/.test(pm));
  ok("the `// Owed only (for chips)` landmark survives (test_gen_plandates slices on it)", src.includes("// Owed only (for chips)"));
  ok("no writes anywhere in the LANE block", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(block("// LANE_START", "// LANE_END")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
