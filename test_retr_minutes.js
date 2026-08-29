/*
 * Node tests for retrSlotMinutes — how much of a kid's day a retrieval slot reserves.
 *
 * It was a hard-coded 15, in the generator's `dur` AND again in the Grid's Min column. A
 * sprint is sprint_seconds x 2 rounds — 2 minutes — so the packer held roughly seven times
 * the real time in every kid's day, five days a week (2026-08-29: "retrieval shouldn't be 30,
 * more like 5–10"). Length now resolves through the same chain as sprint_seconds, and the
 * timed kinds are DERIVED so they follow that setting instead of being typed twice.
 *
 *   run:  node test_retr_minutes.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) break; continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const defs = src.match(/^const RETR_DEFAULTS=[\s\S]*?\};$/m);
if (!defs) throw new Error("RETR_DEFAULTS not found");
const BLOCK = defs[0] + "\n" + extractFn("retrSettings") + "\n" + extractFn("retrSlotMinutes");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function mins(kind, opts) {
  opts = opts || {};
  const ctx = { console, Object, Math, parseInt, isNaN,
    masteryData: { retrievalPlan: opts.plan || {} } };
  vm.createContext(ctx);
  vm.runInContext(BLOCK + "\nvar __r=retrSlotMinutes(" + JSON.stringify(opts.kid || "lincoln") +
    "," + JSON.stringify(kind) + "," + JSON.stringify(opts.track || null) + ");", ctx);
  return ctx.__r;
}

console.log("\n── derived from sprint_seconds ──");
ok("a sprint is 2 rounds of 60s = 2 min", mins("sprint") === 2, mins("sprint"));
ok("re-checks are review_count(3) x 60s = 3 min", mins("recheck") === 3, mins("recheck"));
ok("a 45s track shortens its own sprint (Julian's Naming Dash)",
  mins("sprint", { track: { settings: { sprint_seconds: 45 } } }) === 2, mins("sprint", { track: { settings: { sprint_seconds: 45 } } }));
ok("30s rounds → 1 min", mins("sprint", { track: { settings: { sprint_seconds: 30 } } }) === 1);
ok("changing sprint_seconds moves the reservation with it",
  mins("sprint", { track: { settings: { sprint_seconds: 120 } } }) === 4);
ok("changing sprint_rounds moves it too",
  mins("sprint", { track: { settings: { sprint_rounds: 4 } } }) === 4);
ok("a bigger review mix lengthens re-checks",
  mins("recheck", { track: { settings: { review_count: 5 } } }) === 5);

console.log("\n── typed estimates, tunable ──");
ok("drill defaults to 5", mins("drill") === 5, mins("drill"));
ok("match defaults to 10", mins("match") === 10, mins("match"));
ok("per-kid override wins for drill",
  mins("drill", { plan: { lincoln: { settings: { slot_min_drill: 8 } } } }) === 8);
ok("per-kid override wins for match",
  mins("match", { plan: { lincoln: { settings: { slot_min_match: 6 } } } }) === 6);
ok("a global _defaults override applies to every kid",
  mins("drill", { plan: { _defaults: { slot_min_drill: 3 } } }) === 3);
ok("per-kid beats global",
  mins("drill", { plan: { _defaults: { slot_min_drill: 3 }, lincoln: { settings: { slot_min_drill: 7 } } } }) === 7);
ok("another kid's setting doesn't leak",
  mins("drill", { kid: "lucy", plan: { lincoln: { settings: { slot_min_drill: 9 } } } }) === 5);

console.log("\n── guards ──");
ok("an unknown kind falls back to 10", mins("off") === 10, mins("off"));
ok("never returns 0 or negative", mins("drill", { plan: { lincoln: { settings: { slot_min_drill: 0 } } } }) >= 1);
ok("a junk setting falls back rather than NaN",
  mins("drill", { plan: { lincoln: { settings: { slot_min_drill: "abc" } } } }) === 10);

console.log("\n── the old hard-coded 15 is gone from both places ──");
{
  const gen = src.indexOf("subjectKey:\"retrieval\"");
  const around = gen < 0 ? "" : src.slice(Math.max(0, gen - 700), gen);
  ok("the generated card no longer hard-codes dur:15", !/dur:15,/.test(around), "dur:15 still there");
  ok("the generated card asks retrSlotMinutes", /retrSlotMinutes\(kid,kind\)/.test(around));
  ok("the Grid's Min column no longer multiplies by 15", !/retrievalMins=15\*/.test(src));
  ok("the Grid's Min column asks retrSlotMinutes", /retrievalMins=_rks\.reduce/.test(src));
  ok("all four kinds are reachable from the admin",
    /num\("slot_min_drill"/.test(src) && /num\("slot_min_match"/.test(src) &&
    /num\("sprint_rounds"/.test(src) && /num\("sprint_seconds"/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
