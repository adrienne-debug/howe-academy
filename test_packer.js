/*
 * Node tests for the shared time-packer's device-lane pools.
 *
 * Extracts the REAL packDay out of index.html (it's a pure function — no globals)
 * and asserts the capacity-aware lane behavior: a lane with N devices runs up to N
 * tasks at once and makes the (N+1)th wait, the per-kid "one thing at a time" rule
 * still holds, lunch is skipped, and past-cutoff work overflows.
 *
 *   run:  node test_packer.js
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
// School 600..900 (10:00–15:00), no lunch unless a test sets it.
const base = { start: 600, end: 900, lunchStart: 0, lunchEnd: 0, lanes: ["screen", "computer"] };
const starts = (items, ctx) => {
  const p = packDay(items, Object.assign({}, base, ctx));
  const m = {}; p.placed.forEach(x => { m[x.id] = x.start; });
  return { m, overflow: p.overflow.map(x => x.id) };
};
const screenTask = (id, who) => ({ id, who, lane: "screen", durMin: 30 });

// 1) Pool of 2: two run at once, the third waits.
(() => {
  const r = starts([screenTask("a", "lincoln"), screenTask("b", "ellis"), screenTask("c", "lucy")], { laneCap: { screen: 2 } });
  ok("screen pool of 2: a&b at 600, c waits to 630", r.m.a === 600 && r.m.b === 600 && r.m.c === 630, JSON.stringify(r.m));
})();

// 2) Pool of 1 serializes (backward compatible with the old single-lane behavior).
(() => {
  const r = starts([screenTask("a", "lincoln"), screenTask("b", "ellis"), screenTask("c", "lucy")], { laneCap: { screen: 1 } });
  ok("screen pool of 1: fully serialized 600/630/660", r.m.a === 600 && r.m.b === 630 && r.m.c === 660, JSON.stringify(r.m));
})();

// 3) Pool of 3: all three run at once.
(() => {
  const r = starts([screenTask("a", "lincoln"), screenTask("b", "ellis"), screenTask("c", "lucy")], { laneCap: { screen: 3 } });
  ok("screen pool of 3: all at 600", r.m.a === 600 && r.m.b === 600 && r.m.c === 600, JSON.stringify(r.m));
})();

// 4) A kid still can't do two things at once, even with spare devices.
(() => {
  const r = starts([screenTask("a", "ellis"), screenTask("b", "ellis")], { laneCap: { screen: 2 } });
  ok("same kid serializes despite 2 devices (600 then 630)", r.m.a === 600 && r.m.b === 630, JSON.stringify(r.m));
})();

// 5) Default screen cap is 2 when laneCap is omitted.
(() => {
  const r = starts([screenTask("a", "lincoln"), screenTask("b", "ellis"), screenTask("c", "lucy")], {});
  ok("default screen cap is 2", r.m.a === 600 && r.m.b === 600 && r.m.c === 630, JSON.stringify(r.m));
})();

// 6) Computer lane stays one-at-a-time (cap 1).
(() => {
  const r = starts([{ id: "a", who: "lincoln", lane: "computer", durMin: 30 }, { id: "b", who: "ellis", lane: "computer", durMin: 30 }], {});
  ok("computer lane serializes (cap 1)", r.m.a === 600 && r.m.b === 630, JSON.stringify(r.m));
})();

// 7) Lunch is skipped: a task that would straddle lunch starts after it.
(() => {
  // lunch 660..690; a 30-min task can't start at 650 (would hit lunch) -> pushed to 690.
  const r = starts([{ id: "a", who: "lincoln", lane: "screen", durMin: 30 }], { start: 650, lunchStart: 660, lunchEnd: 690 });
  ok("lunch is skipped (task pushed to 690)", r.m.a === 690, JSON.stringify(r.m));
})();

// 8) Past-cutoff work overflows (isn't placed).
(() => {
  const r = starts([{ id: "a", who: "lincoln", lane: "screen", durMin: 40 }], { start: 880, end: 900 });
  ok("past-cutoff task overflows", r.overflow.length === 1 && r.overflow[0] === "a", JSON.stringify(r.overflow));
})();

// ── Overflow roll-forward helpers (sequence-preserving cascade) ──────────────
const gwCarryFromDrops = new Function(extractFn("gwCarryFromDrops") + "; return gwCarryFromDrops;")();
const gwMergeCarry = new Function(extractFn("gwMergeCarry") + "; return gwMergeCarry;")();
const gwCarryToAssignments = new Function(extractFn("gwCarryToAssignments") + "; return gwCarryToAssignments;")();

// 9) Drops collapse into a {kid:{subject:[vals]}} carry.
(() => {
  const c = gwCarryFromDrops([{ kid: "lincoln", key: "math", val: "L13" }, { kid: "lincoln", key: "math", val: "L14" }]);
  ok("carry collects leftover values per kid/subject", JSON.stringify(c) === JSON.stringify({ lincoln: { math: ["L13", "L14"] } }), JSON.stringify(c));
})();

// 10) Merging a carry prepends the (lower) carried lesson BEFORE the day's existing one.
(() => {
  const day = { lincoln: { math: "L14" } };
  gwMergeCarry(day, { lincoln: { math: ["L13"] } });
  ok("carried lesson lands before the higher one (order kept)", JSON.stringify(day.lincoln.math) === JSON.stringify(["L13", "L14"]), JSON.stringify(day.lincoln.math));
})();

// 11) Merging into a subject the day doesn't have just adds it.
(() => {
  const day = { lincoln: {} };
  gwMergeCarry(day, { lincoln: { math: ["L13"] } });
  ok("carry into an empty subject sets the value", day.lincoln.math === "L13", JSON.stringify(day.lincoln.math));
})();

// 12) Carry → day-assignments shape (single value vs array).
(() => {
  const a = gwCarryToAssignments({ ellis: { ttrs: ["M5"], sci: ["U1", "U2"] } });
  ok("single carried value unwraps; multiple stays an array", a.ellis.ttrs === "M5" && JSON.stringify(a.ellis.sci) === JSON.stringify(["U1", "U2"]), JSON.stringify(a));
})();

// ── Cross-week handoff: the cursor regenerates rolled/unfinished work ─────────
// The overflow rescue doesn't hand anything to next week — it just doesn't place
// the residual. Next week's cursor (offset + check-off count + adjust) advances by
// exactly the lessons that got placed AND checked off, so rolled-over (and any
// unfinished) lessons come right back, in order, same numbers, with no duplication.
const SEQ = []; for (let i = 0; i < 25; i++) SEQ.push({ lesson: "L" + (i + 1) });
const getNextLessonsFromCursor = new Function("buildSubjectLessons",
  extractFn("getNextLessonsFromCursor") + "; return getNextLessonsFromCursor;")(() => SEQ);
const nums = arr => arr.map(x => x.lesson);

// 13) Rolled-over lessons regenerate next week, same numbers and order, no dupes.
(() => {
  const cursor = 12;                                                  // 12 done -> next is L13
  const week1 = nums(getNextLessonsFromCursor("k", "s", cursor, 8));  // L13..L20
  const placed = week1.slice(0, 5);                                   // L13..L17 fit this week
  const rolled = week1.slice(5);                                      // L18..L20 roll to next week
  const nextCursor = cursor + placed.length;                         // all placed checked off -> +5
  const week2 = nums(getNextLessonsFromCursor("k", "s", nextCursor, 8)); // L18..L25
  ok("rolled lessons return next week (same numbers/order)",
     JSON.stringify(week2.slice(0, rolled.length)) === JSON.stringify(rolled), "rolled=" + rolled + " week2=" + week2);
  ok("no duplication: placed lessons don't reappear next week",
     placed.every(l => week2.indexOf(l) < 0), "week2=" + week2);
})();

// 14) Unfinished placed work rides the same mechanism (cursor only counts check-offs).
(() => {
  const cursor = 12;                                                  // placed L13..L17, rolled L18..L20
  const nextCursor = cursor + 3;                                      // kid only checked off L13..L15
  const week2 = nums(getNextLessonsFromCursor("k", "s", nextCursor, 8)); // L16..L23
  ok("unfinished + rolled both come back, in order",
     week2.slice(0, 5).join() === ["L16", "L17", "L18", "L19", "L20"].join(), "week2=" + week2);
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
