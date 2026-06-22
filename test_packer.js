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

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
