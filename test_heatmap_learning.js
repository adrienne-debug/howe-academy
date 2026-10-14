/*
 * Node tests — 🗺 Heat Map health ignores learning cards (HM_LEARNING, her yes 2026-10-13).
 * DeWalt Caleb, one week in: every deck read red "Needs Work" because learning cards sit at tier "daily" (weight 0).
 * Now only cards on the ladder count; an all-learning deck reads "⭐ Learning" in a calm colour.
 *   run:  node test_heatmap_learning.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const ctx = { console }; vm.createContext(ctx); vm.runInContext(cut("// HM_LEARNING_START", "// HM_LEARNING_END"), ctx);
const H = items => vm.runInContext("mastHmHealth(" + JSON.stringify(items) + ")", ctx);
const learn = n => Array.from({ length: n }, (_, i) => ({ id: "l" + i, status: "introduction", tier: "daily" }));

console.log("── an all-learning deck (Caleb, week 1) ──");
{ const r = H(learn(6));
  ok("nothing on the ladder → '⭐ Learning', calm colour, not 'Needs Work'", r.onLadder === 0 && r.healthLbl === "⭐ Learning" && r.barCol === "#6366f1", r);
  ok("6 intro counted, no '● daily' count for them", r.introCount === 6 && r.tc.daily === 0, r.tc); }

console.log("\n── learning cards don't drag a real ladder down ──");
{ const a = H([{ status: "active", tier: "monthly" }, { status: "active", tier: "graduated" }]);
  const b = H([{ status: "active", tier: "monthly" }, { status: "active", tier: "graduated" }].concat(learn(10)));
  ok("same health with or without 10 learning cards beside them", a.health === b.health && a.healthLbl === b.healthLbl && a.healthLbl === "Climbing", [a.health, b.health]);
  ok("…and the ladder count is 2 either way", a.onLadder === 2 && b.onLadder === 2); }

console.log("\n── the ladder itself still grades honestly ──");
{ const r = H([{ status: "active", tier: "daily" }, { status: "active", tier: "every_other_day" }, { status: "active", tier: "daily" }]);
  ok("three low-tier active cards → Needs Work (red)", r.healthLbl === "Needs Work" && r.barCol === "#dc2626", r);
  ok("parked cards are left out too", H([{ status: "parked", tier: "daily" }]).onLadder === 0); }

console.log("\n── wiring ──");
ok("the Heat Map card uses mastHmHealth", /const \{tc,introCount,onLadder,barCol,healthLbl\}=mastHmHealth\(sitems\);/.test(src));
ok("the tier bar divides by ladder cards, not the whole deck", /const pct=Math\.round\(tc\[t\]\/onLadder\*100\);/.test(src));
ok("no stray 'Needs Work' computation left in the renderer", src.split("\n").filter(l => /"Needs Work"/.test(l) && !/^\s*\/\//.test(l)).length === 1);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
