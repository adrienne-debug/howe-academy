/*
 * Node tests for fixed-time classes — the busy-interval primitive in packDay.
 *
 * Extracts the REAL packDay out of index.html (pure function, no globals).
 *
 * Two jobs:
 *   A) INERT — with no `busy`/`momBusy` the packer must behave exactly as it did when
 *      the only interval was lunch. These are the tests that make slice 1 safe to ship.
 *   B) CARVE-OUT — a fixed-time class is a window the packer steps OVER, so school still
 *      happens on BOTH sides of it. This is what a co-op's kidStart cursor cannot do:
 *      a cursor can only push work later, which is why a 2 PM class entered as a co-op
 *      wipes the whole morning.
 *
 *   run:  node test_fixed_class.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const packDay = new Function(extractFn("packDay") + "; return packDay;")();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}

// School 600..900 (10:00 AM – 3:00 PM). No lunch unless a test sets it.
const base = { start: 600, end: 900, lunchStart: 0, lunchEnd: 0, lanes: ["screen", "computer"] };
const run = (items, ctx) => {
  const p = packDay(items, Object.assign({}, base, ctx));
  const m = {}; p.placed.forEach(x => { m[x.id] = x.start; });
  return { m, overflow: p.overflow.map(x => x.id) };
};
// Paper task (no device lane) so lane pools never confound the interval logic.
const t = (id, who, dur) => ({ id, who, lane: "paper", durMin: dur === undefined ? 30 : dur });
const momT = (id, who, dur) => ({ id, who, lane: "paper", durMin: dur === undefined ? 30 : dur, momRequired: true });

console.log("\nA) INERT — no busy intervals means the old lunch-only behavior\n");

(() => {
  const r = run([t("a", "lincoln"), t("b", "lincoln")]);
  ok("no lunch, no busy: back-to-back 600/630", r.m.a === 600 && r.m.b === 630, JSON.stringify(r.m));
})();

(() => {
  // Old behavior: a task straddling lunch moves to lunchEnd.
  const r = run([t("a", "lincoln", 40)], { lunchStart: 620, lunchEnd: 690 });
  ok("lunch straddle pushes to lunchEnd (690)", r.m.a === 690, JSON.stringify(r.m));
})();

(() => {
  // Old behavior: a task that fits entirely before lunch keeps its slot.
  const r = run([t("a", "lincoln", 20)], { lunchStart: 620, lunchEnd: 690 });
  ok("fits before lunch: stays at 600", r.m.a === 600, JSON.stringify(r.m));
})();

(() => {
  // Old behavior: start already past lunch is untouched.
  const r = run([t("a", "lincoln", 30)], { start: 700, lunchStart: 620, lunchEnd: 690 });
  ok("start after lunch: stays at 700", r.m.a === 700, JSON.stringify(r.m));
})();

(() => {
  const without = run([t("a", "lincoln", 40), t("b", "ellis", 40)], { lunchStart: 620, lunchEnd: 690 });
  const withEmpty = run([t("a", "lincoln", 40), t("b", "ellis", 40)], { lunchStart: 620, lunchEnd: 690, busy: {}, momBusy: [] });
  ok("empty busy/momBusy is byte-identical to omitting them",
    JSON.stringify(without) === JSON.stringify(withEmpty), JSON.stringify(withEmpty));
})();

(() => {
  // A zero-width or inverted window must be ignored, not trusted.
  const r = run([t("a", "lincoln", 30)], { busy: { lincoln: [{ s: 700, e: 700 }, { s: 800, e: 750 }] } });
  ok("zero-width and inverted windows are ignored", r.m.a === 600, JSON.stringify(r.m));
})();

console.log("\nB) CARVE-OUT — school happens on both sides of a class\n");

(() => {
  // THE test. German-shaped class at 12:00–12:45 (720–765). A 30-min task fits
  // entirely before it, so the morning must NOT be wiped.
  const r = run([t("a", "lincoln", 30)], { busy: { lincoln: [{ s: 720, e: 765 }] } });
  ok("work that fits before the class KEEPS the morning (600)", r.m.a === 600, JSON.stringify(r.m));
})();

(() => {
  const r = run([t("a", "lincoln", 30)], { start: 700, busy: { lincoln: [{ s: 720, e: 765 }] } });
  ok("work that would straddle the class moves to its end (765)", r.m.a === 765, JSON.stringify(r.m));
})();

(() => {
  // Fill the morning, then step over the class. Note `d` lands at 690 and ends at 720,
  // exactly abutting the class — the packer uses the whole gap rather than leaving it
  // idle, and abutting is not overlapping. `e` is the first that must jump.
  const r = run([t("a", "lincoln"), t("b", "lincoln"), t("c", "lincoln"), t("d", "lincoln"), t("e", "lincoln")],
    { busy: { lincoln: [{ s: 720, e: 765 }] } });
  ok("day fills right up to the class, then resumes after it",
    r.m.a === 600 && r.m.b === 630 && r.m.c === 660 && r.m.d === 690 && r.m.e === 765, JSON.stringify(r.m));
})();

(() => {
  // A class at the very start of the day (German's real shape: 10:00–10:45).
  const r = run([t("a", "lincoln", 30), t("b", "lincoln", 30)], { busy: { lincoln: [{ s: 600, e: 645 }] } });
  ok("class at day start: work begins after it (645/675)", r.m.a === 645 && r.m.b === 675, JSON.stringify(r.m));
})();

(() => {
  // Per-kid isolation — Lincoln's class must not move Ellis.
  const r = run([t("a", "lincoln", 30), t("b", "ellis", 30)],
    { start: 700, busy: { lincoln: [{ s: 700, e: 765 }] } });
  ok("one kid's class does not move another kid's work", r.m.a === 765 && r.m.b === 700, JSON.stringify(r.m));
})();

(() => {
  // Back-to-back classes: stepping past the first lands inside the second.
  const r = run([t("a", "lincoln", 30)], { start: 700, busy: { lincoln: [{ s: 700, e: 730 }, { s: 730, e: 800 }] } });
  ok("back-to-back classes are both cleared (800)", r.m.a === 800, JSON.stringify(r.m));
})();

(() => {
  // Unsorted input must not defeat the walk.
  const r = run([t("a", "lincoln", 30)], { start: 700, busy: { lincoln: [{ s: 730, e: 800 }, { s: 700, e: 730 }] } });
  ok("windows given out of order still both clear (800)", r.m.a === 800, JSON.stringify(r.m));
})();

(() => {
  // Lunch and a class coexist: 620–690 lunch, 690–740 class.
  const r = run([t("a", "lincoln", 40)], { lunchStart: 620, lunchEnd: 690, busy: { lincoln: [{ s: 690, e: 740 }] } });
  ok("lunch then class: both stepped over (740)", r.m.a === 740, JSON.stringify(r.m));
})();

(() => {
  // A combined block is busy if ANY participant has the class.
  const r = run([{ id: "a", participants: ["lincoln", "ellis"], lane: "paper", durMin: 30 }],
    { start: 700, busy: { ellis: [{ s: 700, e: 765 }] } });
  ok("combined block respects any participant's class (765)", r.m.a === 765, JSON.stringify(r.m));
})();

console.log("\nC) Mom's own booked time\n");

(() => {
  const r = run([momT("a", "lincoln", 30)], { start: 700, momBusy: [{ s: 700, e: 765 }] });
  ok("momBusy defers a Mom-required task (765)", r.m.a === 765, JSON.stringify(r.m));
})();

(() => {
  const r = run([t("a", "lincoln", 30)], { start: 700, momBusy: [{ s: 700, e: 765 }] });
  ok("momBusy does NOT move an independent task (700)", r.m.a === 700, JSON.stringify(r.m));
})();

console.log("\nD) Nothing is silently lost\n");

(() => {
  // A class late in the day pushes work past cutoff — it must OVERFLOW, not vanish.
  const r = run([t("a", "lincoln", 30)], { start: 860, busy: { lincoln: [{ s: 860, e: 895 }] } });
  ok("work pushed past cutoff overflows (not dropped)",
    r.overflow.length === 1 && r.overflow[0] === "a" && r.m.a === undefined, JSON.stringify(r));
})();

(() => {
  // Every task is accounted for: placed + overflow == input.
  const items = [t("a", "lincoln"), t("b", "lincoln"), t("c", "lincoln"), t("d", "lincoln"),
                 t("e", "lincoln"), t("f", "lincoln"), t("g", "lincoln"), t("h", "lincoln")];
  const p = packDay(items, Object.assign({}, base, { busy: { lincoln: [{ s: 660, e: 800 }] } }));
  ok("placed + overflow accounts for every task",
    p.placed.length + p.overflow.length + p.dropped.length === items.length,
    p.placed.length + "+" + p.overflow.length + "+" + p.dropped.length + " of " + items.length);
})();

(() => {
  // No task may overlap the class window it was packed around.
  const items = [t("a", "lincoln"), t("b", "lincoln"), t("c", "lincoln"), t("d", "lincoln"), t("e", "lincoln")];
  const win = { s: 700, e: 780 };
  const p = packDay(items, Object.assign({}, base, { busy: { lincoln: [win] } }));
  const bad = p.placed.filter(x => {
    const dur = 30;
    return x.start < win.e && x.start + dur > win.s;
  });
  ok("no placed task overlaps the class window", bad.length === 0, JSON.stringify(bad));
})();

console.log("\nD2) A class holds its DEVICE, not just its kid\n");

const dev = (id, who, lane, dur) => ({ id, who, lane, durMin: dur === undefined ? 30 : dur });

(() => {
  // The computer lane has one machine. A class on it 700-765 means nobody else's
  // computer work can run then, even though no cursor has reached that time.
  const r = run([dev("a", "ellis", "computer", 30)],
    { start: 700, laneCap: { computer: 1 }, laneBusy: { computer: [{ s: 700, e: 765 }] } });
  ok("single-machine lane: another kid's computer work steps over the class (765)",
    r.m.a === 765, JSON.stringify(r.m));
})();

(() => {
  // …but work that fits before it keeps its slot — the lane is a window, not a cursor.
  const r = run([dev("a", "ellis", "computer", 30)],
    { laneCap: { computer: 1 }, laneBusy: { computer: [{ s: 720, e: 765 }] } });
  ok("single-machine lane: work before the class keeps the morning (600)",
    r.m.a === 600, JSON.stringify(r.m));
})();

(() => {
  // A 2-device pool with ONE class held: the other device is still free.
  const r = run([dev("a", "ellis", "screen", 30)],
    { start: 700, laneCap: { screen: 2 }, laneBusy: { screen: [{ s: 700, e: 765 }] } });
  ok("2-device pool, one class: the free device is still bookable (700)",
    r.m.a === 700, JSON.stringify(r.m));
})();

(() => {
  // Two OVERLAPPING classes fill both devices, so the lane is full — but only until the
  // EARLIER class ends and frees its machine (750, not 765).
  const r = run([dev("a", "ellis", "screen", 30)],
    { start: 700, laneCap: { screen: 2 },
      laneBusy: { screen: [{ s: 700, e: 765 }, { s: 700, e: 750 }] } });
  ok("2-device pool, both held: work waits for the first machine to free (750)",
    r.m.a === 750, JSON.stringify(r.m));
})();

(() => {
  // THREE overlapping classes on a 2-device pool is an over-subscription — physically
  // impossible input, so there is no "right" placement. What must hold is that the
  // packer stays sane: it never books other work before the earliest class ends, and it
  // still reports a placement rather than crashing or silently stacking.
  // (A real hardware clash like this is hers to resolve; the packer cannot invent a
  // third machine. See the device over-subscription note in the class docs.)
  const r = run([dev("a", "ellis", "screen", 30)],
    { start: 700, laneCap: { screen: 2 },
      laneBusy: { screen: [{ s: 700, e: 730 }, { s: 700, e: 745 }, { s: 700, e: 800 }] } });
  ok("over-subscribed lane: still placed, never before the earliest class ends",
    typeof r.m.a === "number" && r.m.a >= 730, JSON.stringify(r.m));
})();

(() => {
  // Non-overlapping classes pack onto ONE device, leaving the second genuinely free.
  const r = run([dev("a", "ellis", "screen", 30)],
    { start: 700, laneCap: { screen: 2 },
      laneBusy: { screen: [{ s: 700, e: 730 }, { s: 730, e: 800 }] } });
  ok("back-to-back classes share one device; the other stays free (700)",
    r.m.a === 700, JSON.stringify(r.m));
})();

(() => {
  // A lane nobody contends for is ignored.
  const r = run([dev("a", "ellis", "paper", 30)],
    { start: 700, laneBusy: { paper: [{ s: 700, e: 765 }] } });
  ok("paper is not a contended lane — holds nothing", r.m.a === 700, JSON.stringify(r.m));
})();

(() => {
  // The kid window and the device window are independent: Lincoln is in German (kid
  // busy) AND the computer is held; Ellis is free but the machine is not.
  const r = run([dev("a", "lincoln", "computer", 30), dev("b", "ellis", "computer", 30)],
    { laneCap: { computer: 1 },
      busy: { lincoln: [{ s: 600, e: 645 }] },
      laneBusy: { computer: [{ s: 600, e: 645 }] } });
  ok("kid and device windows compose: both wait for the class to end",
    r.m.a === 645 && r.m.b === 675, JSON.stringify(r.m));
})();

console.log("\nE) Which days a class actually meets\n");

// toMin is a global in the app; the class helpers need it.
const toMin = (t) => {
  if (t == null) return NaN;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mi;
};
const fxEnv = new Function("toMin", `
  ${extractFn("fxIsClass")}
  ${extractFn("fxDateList")}
  ${extractFn("fxRunsOn")}
  ${extractFn("fxWindow")}
  const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
  return {fxIsClass,fxDateList,fxRunsOn,fxWindow};
`)(toMin);

// Lincoln's real German class.
const GERMAN_DATES = ["2026-09-16","2026-09-23","2026-09-30","2026-10-07","2026-10-14","2026-10-21",
  "2026-10-28","2026-11-04","2026-11-11","2026-11-18","2026-12-02","2026-12-09","2026-12-16",
  "2027-01-06","2027-01-13","2027-01-20"];
const german = { display:"German (Outschool)", fixedTime:"10:00 AM", minutes:45,
  allowedDays:["Wed"], fixedDates:GERMAN_DATES, device:"computer", mom:"none" };

ok("a normal subject is not a class", fxEnv.fxIsClass({ display:"AAS", minutes:30 }) === false);
ok("German is a class", fxEnv.fxIsClass(german) === true);
ok("meets on a real class date", fxEnv.fxRunsOn(german, "2026-09-16", "wednesday") === true);
ok("does NOT meet Thanksgiving week (Nov 25)", fxEnv.fxRunsOn(german, "2026-11-25", "wednesday") === false);
ok("does NOT meet Dec 23 (holiday gap)", fxEnv.fxRunsOn(german, "2026-12-23", "wednesday") === false);
ok("does NOT meet on a Tuesday", fxEnv.fxRunsOn(german, "2026-09-15", "tuesday") === false);
ok("window is 600-645 (10:00-10:45)",
  JSON.stringify(fxEnv.fxWindow(german, "2026-09-16", "wednesday")) === JSON.stringify({ s:600, e:645 }),
  JSON.stringify(fxEnv.fxWindow(german, "2026-09-16", "wednesday")));
ok("no window on a non-class Wednesday", fxEnv.fxWindow(german, "2026-11-25", "wednesday") === null);

(() => {
  // With a date list set but no date known, the answer must be NO — better a missing
  // card than a card on a day the class does not meet.
  ok("unknown date + date list = does not meet", fxEnv.fxRunsOn(german, null, "wednesday") === false);
})();

(() => {
  // Without fixedDates, allowedDays is the fallback (a standing weekly class).
  const standing = { fixedTime:"2:00 PM", minutes:60, allowedDays:["Tue","Thu"] };
  ok("no date list: allowedDays decides (Tue yes)", fxEnv.fxRunsOn(standing, "2026-09-15", "tuesday") === true);
  ok("no date list: allowedDays decides (Wed no)", fxEnv.fxRunsOn(standing, "2026-09-16", "wednesday") === false);
  ok("afternoon class window is 840-900",
    JSON.stringify(fxEnv.fxWindow(standing, "2026-09-15", "tuesday")) === JSON.stringify({ s:840, e:900 }));
})();

(() => {
  const noTime = { display:"x", minutes:45, allowedDays:["Wed"], fixedDates:GERMAN_DATES };
  ok("fixedDates without fixedTime is not a class", fxEnv.fxRunsOn(noTime, "2026-09-16", "wednesday") === false);
  const badTime = { fixedTime:"half ten", minutes:45 };
  ok("an unparseable fixedTime yields no window", fxEnv.fxWindow(badTime, "2026-09-16", "wednesday") === null);
})();

console.log("\nF) The projection only lands a class on its real dates\n");

const pjEnv = new Function(`
  ${extractFn("_cbSpread")}
  ${extractFn("_pjWeekKey")}
  ${extractFn("_pjPatternRows")}
  return _pjPatternRows;
`)();

(() => {
  // Build every weekday from Sep 14 2026 to Jan 29 2027.
  const rows = [];
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let d = new Date(Date.UTC(2026, 8, 14)); d <= new Date(Date.UTC(2027, 0, 29)); d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = DOW[d.getUTCDay()];
    if (dow === "Sat" || dow === "Sun") continue;
    rows.push({ date: d.toISOString().slice(0, 10), dow, off: false });
  }
  const only = {}; GERMAN_DATES.forEach(x => { only[x] = true; });
  const plan = { allowedDays: ["Wed"], offDates: {}, _blocked: {}, onlyDates: only };
  const got = pjEnv(plan, rows, 0, 0).map(r => r.date);

  ok("projection yields exactly the 16 class dates",
    got.length === 16 && JSON.stringify(got) === JSON.stringify(GERMAN_DATES),
    got.length + " dates: " + got.slice(0, 4).join(",") + "…");

  // The control: without onlyDates, every Wednesday in the range is eligible — which is
  // the bug this gate exists to prevent (cards on Thanksgiving and Christmas week).
  const plan2 = { allowedDays: ["Wed"], offDates: {}, _blocked: {} };
  const all = pjEnv(plan2, rows, 0, 0).map(r => r.date);
  ok("control: without the gate it would take every Wednesday (" + all.length + " > 16)",
    all.length > 16 && all.indexOf("2026-11-25") >= 0, all.length + "");

  // Overflow must not spill a class onto a non-class date either.
  const got3 = pjEnv({ allowedDays: ["Wed"], offDates: {}, _blocked: {}, onlyDates: only }, rows, 0, 10)
    .map(r => r.date);
  ok("overflow cannot spill a class onto a non-class date",
    got3.every(d => only[d]), got3.filter(d => !only[d]).join(","));

  // A hand-added make-up day must not override the class's date list.
  const got4 = pjEnv({ allowedDays: ["Wed"], offDates: {}, _blocked: {}, onlyDates: only,
    _added: { "2026-11-25": true, "2026-09-17": true } }, rows, 0, 0).map(r => r.date);
  ok("a hand-added day cannot create a class meeting",
    got4.every(d => only[d]), got4.filter(d => !only[d]).join(","));
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
