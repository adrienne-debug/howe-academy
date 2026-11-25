/*
 * test_fixtures/house_grabs_world.js — the world behind test_house_grabs.js and test_house_grabs_world.js (Household by room, step 6a:
 * Up for Grabs kept in the chore table). It is test_fixtures/house_world.js (the WHOLE app per device over one in-memory Firebase and
 * one virtual clock, the made-up demo family kid_a … kid_d) plus a MADE-UP Up for Grabs pool and a table whose Up for Grabs rows do
 * not match it, the way a real table can drift from the kids' pool:
 *   pool (8)  0 porch window  · 1 island 25⭐ · 2 hall toilet (zone: bathrooms) · 3 under the couch (Sat) · 4 bookshelf
 *             5 towel basket (laundry link: fold) · 6 garage (every 2 weeks) · 7 porch plants (Tue, Fri)
 *   table     same porch window · island at 20⭐ · "Scrub the toilet" (renamed, no zone; found by its old number) · couch every day ·
 *             bookshelf RETIRED · garage same · no towel basket · no porch plants · "Dust the blinds" (only in the table) ·
 *             "Old toy bin" (only in the table, retired)
 * Three kinds of family: "saved" (the pool in config/grabs), "builtin" (no config/grabs; the family is the one whose built-in list
 * gbDefault() returns, and that list is swapped for the made-up pool on every device, so no real chore names are used), "none" (no
 * pool at all). Zones: bathrooms are Wednesday's focus at +5. No real family's names or data.
 */
"use strict";
const fs = require("fs"), path = require("path"), W = require(path.join(__dirname, "house_world.js"));
const POOL = [
  { emoji: "🪟", label: "Wash the porch window", pts: 15, cad: "daily" },
  { emoji: "🧽", label: "Wipe the island", pts: 25, cad: "daily" },
  { emoji: "🚽", label: "Scrub the hall toilet", pts: 40, cad: "daily", zone: "bath" },
  { emoji: "🛋", label: "Clean under the couch", pts: 15, cad: "wk:5" },
  { emoji: "📚", label: "Sort the bookshelf", pts: 5, cad: "daily" },
  { emoji: "🧺", label: "Fold the towel basket", pts: 10, cad: "daily", laundry: "fold" },
  { emoji: "🧹", label: "Sweep the garage", pts: 20, cad: "2w" },
  { emoji: "🪴", label: "Water the porch plants", pts: 10, cad: "wk:1,4" }
];
const G = o => Object.assign({ who: "grab", source: "Up for Grabs", area: "cleaning", floor: "", status: "active", verdict: "", note: "", ts: 1763000000000 }, o);
function tableRows() { return {
  gb_wash_the_porch_window: G({ label: "Wash the porch window", emoji: "🪟", pts: 15, cad: "daily", src: { kind: "grab", i: 0 }, order: 0 }),
  gb_wipe_the_island: G({ label: "Wipe the island", emoji: "🧽", pts: 20, cad: "daily", src: { kind: "grab", i: 1 }, order: 1, room: "kitchen" }),
  gb_scrub_the_hall_toilet_old: G({ label: "Scrub the toilet", emoji: "🚽", pts: 40, cad: "daily", src: { kind: "grab", i: 2 }, order: 2 }),
  gb_clean_under_the_couch: G({ label: "Clean under the couch", emoji: "🛋", pts: 15, cad: "daily", src: { kind: "grab", i: 3 }, order: 3 }),
  gb_sort_the_bookshelf: G({ label: "Sort the bookshelf", emoji: "📚", pts: 5, cad: "daily", src: { kind: "grab", i: 4 }, order: 4, status: "retired", verdict: "retire" }),
  gb_sweep_the_garage: G({ label: "Sweep the garage", emoji: "🧹", pts: 20, cad: "2w", src: { kind: "grab", i: 6 }, order: 6 }),
  gb_dust_the_blinds: G({ label: "Dust the blinds", emoji: "🪟", pts: 15, cad: "daily", src: { kind: "grab", i: 9 }, order: 9 }),
  gb_old_toy_bin: G({ label: "Old toy bin", emoji: "🧸", pts: 5, cad: "daily", src: { kind: "grab", i: 10 }, order: 10, status: "retired", verdict: "retire" })
}; }
function household(mode, o) { o = o || {}; const h = W.household(mode); if (o.rows !== false) Object.assign(h.jobs, tableRows()); if (o.extra) o.extra(h); return h; }
function tree(kind) { const c = JSON.parse(JSON.stringify(W.FX.db.config)); c.zonePlan = { wednesday: "bath" }; c.zoneBonus = { enabled: true, mode: "flat", amount: 5 };
  if (kind === "saved") c.grabs = JSON.parse(JSON.stringify(POOL)); return { config: c }; }
// The id of the family whose built-in list gbDefault() returns, read from the app (so no family name is written here).
const BUILTIN_ID = (() => { const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8"); const m = /const HA_IS_HOWE\s*=\s*!\(window\.HA_FAMILY&&window\.HA_FAMILY\.familyId&&window\.HA_FAMILY\.familyId!=="([a-z]+)"\)/.exec(s); if (!m) throw new Error("built-in family id not found"); return m[1]; })();
async function world(kind, mode, o) {
  o = o || {}; const fam = W.FX.family, id0 = fam.familyId, as = () => { if (kind === "builtin") fam.familyId = BUILTIN_ID; };
  as(); let w; try { w = await W.world({ household: o.household || household(mode, o), tree: o.tree || tree(kind), index: o.index, deny: o.deny, longPlan: o.longPlan });   /* 📅 LISTWK: a 60-day replay's long plan (house_world.js) */ } finally { fam.familyId = id0; }
  const boot = w.boot.bind(w);
  w.boot = (name, dev, bo) => { as(); let d; try { d = boot(name, dev, bo); } finally { fam.familyId = id0; } if (kind === "builtin") d.run("GRAB_DEFAULT.splice(0,GRAB_DEFAULT.length).length; GRAB_DEFAULT.push.apply(GRAB_DEFAULT," + JSON.stringify(POOL) + "); 1"); return d; };
  return w;
}
// what each kid sees in Up for Grabs (their own screen) and what Mom sees for each kid
const KIDS = ["kid_a", "kid_b", "kid_c", "kid_d"];
const kidHTML = (d, mom) => JSON.parse(d.run("JSON.stringify(" + JSON.stringify(KIDS) + ".map(function(k){ return _grabsHTML(k," + (mom ? "true" : "false") + "); }))"));
// a kid acts on a chore in their own pool, picked by its name (so two worlds do the same thing to the same chore)
const act = (d, fn, kid, label) => d.run("(function(){ const x=gbPool(" + JSON.stringify(kid) + ",false).find(function(x){ return x.g.label===" + JSON.stringify(label) + "; }); if(!x) return 'none'; " + fn + "(" + JSON.stringify(kid) + ",x.i); return 'ok'; })()");
const poolNames = (d, kid, mom) => JSON.parse(d.run("JSON.stringify(gbPool(" + JSON.stringify(kid) + "," + (mom ? "true" : "false") + ").map(function(x){ return x.g.label; }))"));
module.exports = { POOL, tableRows, household, tree, world, KIDS, kidHTML, act, poolNames, BUILTIN_ID, W };
