/*
 * Node tests — 🔢 CARRYMAX: a carried lesson never breaks the subject's max per day (her rule 2026-11-02: "it should be
 * looking at the max 1 per day"). Live DeWalt week 5, Regenerate Mon 11/2 6:57 PM: Taylor's Saxon 42 was balanced onto
 * Monday (after school), ran past the cutoff, and the carry added it onto Tuesday's Saxon 43 — two Saxon lessons Tuesday,
 * none Wednesday (Kenzie's IEW the same). Saxon is plan-backed, so capFor gives it 1 a day.
 * Runs the REAL capFor, gwCarryFromDrops, gwMergeCarry, gwCapCarry, gwJoinCarry, and a replay of generateWeek's own day loop
 * (the two carry lines are checked verbatim below).
 *   run:  node test_carry_max.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function fn(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0, s = false; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") { d++; s = true; } else if (src[k] === "}") { d--; if (s && !d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function world(subjects, planned) {
  const ctx = { JSON, Object, Array, parseInt, String, DEFAULT_DAY_CAP: 2, currData: { subjects: subjects }, planBacked: (k, sk) => !!(planned && planned[k + "|" + sk]) };
  vm.createContext(ctx);
  vm.runInContext(["capFor", "gwCarryFromDrops", "gwMergeCarry", "gwCapCarry", "gwJoinCarry"].map(fn).join("\n"), ctx);
  return ctx;
}
// generateWeek's day loop, cut down to the carry: each day merges what came in, keeps its max, then "lays" the day
// (dropPastCutoff says which lessons ran past the cutoff) and hands on its drops + what its max sent on.
function lay(c, week, dropPastCutoff) {
  let _carry = null; const out = {};
  for (const dk of Object.keys(week)) {
    const day = week[dk];
    let _capOver = null;
    if (_carry) { c.gwMergeCarry(day, _carry); _capOver = c.gwCapCarry(day, _carry); _carry = null; }
    const drops = [];
    for (const kid of Object.keys(day)) for (const sk of Object.keys(day[kid])) {
      const v = [].concat(day[kid][sk]); const gone = v.filter(x => (dropPastCutoff[dk] || []).indexOf(x) >= 0);
      gone.forEach(x => drops.push({ kid, key: sk, val: x, reason: "⚠️ RAN PAST SCHOOL-DAY CUTOFF — needs manual placement" }));
      const left = v.filter(x => gone.indexOf(x) < 0); if (!left.length) delete day[kid][sk]; else day[kid][sk] = left.length === 1 ? left[0] : left;
    }
    out[dk] = JSON.parse(JSON.stringify(day));
    _carry = c.gwJoinCarry(drops.length ? c.gwCarryFromDrops(drops) : null, _capOver);
  }
  return { days: out, left: _carry };
}

console.log("── The live week: Taylor's Saxon after the 6:57 PM Monday regenerate ──");
{
  const c = world({ taylor: { saxon_math_8_7: { display: "Saxon Math 8/7", planId: "p" } } }, { "taylor|saxon_math_8_7": 1 });
  ok("Saxon (plan-backed) has a max of 1 a day", c.capFor("taylor", "saxon_math_8_7", 2) === 1);
  // what the balancer handed generateWeek (Mon 42, Tue 43, Wed none, Thu co-op, Fri 44); Monday is laid from 6:57 PM → 42 drops
  const week = { "2026-11-02": { taylor: { saxon_math_8_7: "Lesson 42" } }, "2026-11-03": { taylor: { saxon_math_8_7: "Lesson 43" } },
    "2026-11-04": { taylor: {} }, "2026-11-05": { taylor: {} }, "2026-11-06": { taylor: { saxon_math_8_7: "Lesson 44" } } };
  const r = lay(c, week, { "2026-11-02": ["Lesson 42"] });
  const sx = dk => r.days[dk].taylor.saxon_math_8_7;
  ok("Tuesday: Lesson 42 only (live: 42 AND 43)", sx("2026-11-03") === "Lesson 42", sx("2026-11-03"));
  ok("Wednesday: Lesson 43 (live: none)", sx("2026-11-04") === "Lesson 43", sx("2026-11-04"));
  ok("Friday keeps Lesson 44; nothing left over for next week", sx("2026-11-06") === "Lesson 44" && !r.left, r.left);
}

console.log("\n── The rules ──");
{
  const c = world({ k: { m: { display: "Math" } } }, { "k|m": 1 });
  const week = { d1: { k: { m: "L1" } }, d2: { k: { m: "L2" } }, d3: { k: { m: "L3" } } };
  const r = lay(c, week, { d1: ["L1"] });
  ok("a full week ripples in order: d2 L1, d3 L2, L3 rolls on (to Saturday / next week, as before)", r.days.d2.k.m === "L1" && r.days.d3.k.m === "L2" && J(r.left) === J({ k: { m: ["L3"] } }), r);
}
{
  const c = world({ k: { m: { display: "Math", cap: 2 } } });
  const week = { d1: { k: { m: "L1" } }, d2: { k: { m: "L2" } } };
  const r = lay(c, week, { d1: ["L1"] });
  ok("a subject set to 2 a day takes both on the next day (unchanged)", J(r.days.d2.k.m) === J(["L1", "L2"]) && !r.left);
}
{
  const c = world({ k: { m: { display: "Math", rules: "sequential, max1" } } });
  ok("a subject marked max1 counts as 1 a day", c.capFor("k", "m", 2) === 1);
  const r = lay(c, { d1: { k: { m: "L1" } }, d2: { k: { m: "L2" } }, d3: { k: {} } }, { d1: ["L1"] });
  ok("…and its carry ripples too", r.days.d2.k.m === "L1" && r.days.d3.k.m === "L2");
}
{
  const c = world({ k: { m: { display: "Math", cap: 2 }, r: { display: "Reading" } } });
  const day = { k: { m: ["L1", "L2", "L3"], r: ["R1", "R2"] } };
  const over = c.gwCapCarry(day, { k: { r: ["R1"] } });
  ok("only subjects that were carried in are looked at (a stack the balancer made stays)", J(day.k.m) === J(["L1", "L2", "L3"]));
  ok("a carried subject at the default max (2) keeps both", J(day.k.r) === J(["R1", "R2"]) && over === null);
}
{
  const c = world({ k: { m: { display: "Math" } } }, { "k|m": 1 });
  const day = { k: { m: ["L1", "L2", "L3"] } };
  const over = c.gwCapCarry(day, { k: { m: ["L1"] } });
  ok("lowest lessons stay, the rest go on in order", day.k.m === "L1" && J(over) === J({ k: { m: ["L2", "L3"] } }));
  ok("a day under its max is left as it was", (() => { const d = { k: { m: "L5" } }; return c.gwCapCarry(d, { k: { m: ["L5"] } }) === null && d.k.m === "L5"; })());
}
{
  const c = world({});
  ok("gwJoinCarry: drops first, then what the max sent on", J(c.gwJoinCarry({ k: { m: ["L1"] } }, { k: { m: ["L3"] }, j: { r: ["R2"] } })) === J({ k: { m: ["L1", "L3"] }, j: { r: ["R2"] } }));
  ok("gwJoinCarry with nothing → null; one side → that side", c.gwJoinCarry(null, null) === null && J(c.gwJoinCarry(null, { k: { m: ["L"] } })) === J({ k: { m: ["L"] } }));
}

console.log("\n── generateWeek is wired ──");
{
  const g = fn("generateWeek");
  ok("the merge is followed by the max check", g.indexOf("gwMergeCarry(balanced[dk],_carry); _capOver=gwCapCarry(balanced[dk],_carry); _carry=null;") >= 0);
  ok("the next day's carry = this day's drops + what its max sent on", g.indexOf("_carry=gwJoinCarry(_cut.length?gwCarryFromDrops(_cut):null,_capOver);") >= 0);
  ok("_capOver is reset for every day", /let _capOver=null;[^\n]*\n\s*if\(_carry\)\{/.test(g));
  const blk = src.slice(src.indexOf("// CARRYMAX_START"), src.indexOf("// CARRYMAX_END"));
  ok("the block is marked and has no 🔀", blk.length > 0 && blk.indexOf("\u{1F500}") < 0);
}
function J(x) { return JSON.stringify(x); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
