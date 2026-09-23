/*
 * ↻ "Rebuild all" rebuilds ALL (her rule 2026-09-22): plan-backed subjects with no Builder pacing record are included,
 * and plan-backed subjects never stall behind the legacy keep/dismiss gate.
 *   run:  node test_rebuild_all_scope.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(n) { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("no " + n); return src.slice(i, src.indexOf("\n}", i) + 2); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const subs = { gwtm: { planId: "p", timesPerWeek: 5 }, singapore: { planId: "p", pacing: { mode: "timesPerWeek" } }, legacy: { pacing: { mode: "timesPerWeek" } },
  bare: { timesPerWeek: 3 }, paused: { planId: "p", paused: true }, daily: { planId: "p", tracking: "daily" }, closing: { planId: "p", rules: "last" } };
const ctx = { currData: { subjects: { lincoln: subs } }, planBacked: (k, sk) => !!subs[sk].planId, Object, String };
vm.createContext(ctx); vm.runInContext(slice("cbRebuildable"), ctx);
const R = sk => vm.runInContext("cbRebuildable('lincoln','" + sk + "')", ctx);
ok("a plan-backed subject with NO pacing record is rebuilt (Grammar for the Well-Trained Mind)", R("gwtm") === true);
ok("a Builder-paced subject is rebuilt", R("singapore") === true && R("legacy") === true);
ok("a subject with neither is left alone", R("bare") === false);
ok("paused, daily and first/last subjects are left alone", R("paused") === false && R("daily") === false && R("closing") === false);
const all = slice("cbRebuildAll");
ok("the run uses the same definition", /const list=Object\.keys\(subs\)\.filter\(sk=>cbRebuildable\(kid,sk\)\);/.test(all));
ok("plan-backed subjects skip the keep/dismiss gate", /if\(\(typeof planBacked==="function"\)&&planBacked\(kid,sk\)\) continue;\s*try\{ const info=cbBacklogInfo/.test(all));
ok("both Rebuild-all buttons count with the same definition", (src.match(/filter\(sk=>\(typeof cbRebuildable==="function"\)\?cbRebuildable\((cbKid|gvKid),sk\):false\)\.length/g) || []).length === 2);
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
