/*
 * test_fixtures/house_overflow_world.js — the world behind test_house_overflow.js and test_house_overflow_world.js (Household by room,
 * step 6b: a chore that fit nobody goes to that day's Up for Grabs at double stars, only for the kids who can do it). It is
 * test_fixtures/house_grabs_world.js (the WHOLE app per device over one in-memory Firebase and one virtual clock, the made-up demo
 * family kid_a … kid_d, a made-up Up for Grabs pool: built-in, saved, or none; Wednesday's zone = bathrooms +5) with three more rows
 * that never fit on a school day:
 *   c_b_tub   kid_b's "Scrub the tub", daily, 20 min, 15 ⭐, zone bathrooms, who-can kid_b + kid_a  → offered to TWO kids (×2 = 30)
 *   c_d_shelf kid_d's "Dust the shelf", daily, 5 min, 0 ⭐ (kid_d's limit is 0)                     → offered to kid_d at 0
 *   m_oven    Mom's "Clean the oven", daily, 30 min, nobody else ticked                           → no kid can: no offer
 * and, from house_world's own table, kid_c's "Straighten the beds" (only kid_c, 5 ⭐) and kid_a's "Vacuum the den" (Mon + Thu,
 * only kid_a, 15 ⭐) fit nobody on most days. {roomy:true} gives everyone 300 minutes (a plan ON with nothing that fits nobody).
 * No real family's names or data.
 */
"use strict";
const path = require("path"), G = require(path.join(__dirname, "house_grabs_world.js")), W = G.W;
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
function extraRows() { return {
  c_b_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_b", slot: "chores", cad: "daily", minutes: 20, pts: 15, zone: "bath", can: ["kid_b", "kid_a"], order: 3 }),
  c_d_shelf: K({ label: "Dust the shelf", emoji: "🪶", who: "kid_d", slot: "chores", cad: "daily", minutes: 5, pts: 0, order: 0 }),
  m_oven: K({ label: "Clean the oven", who: "mom", slot: "", cad: "daily", minutes: 30, src: { kind: "momChore", id: "oven" }, order: 2 })
}; }
function household(mode, o) { o = o || {}; return G.household(mode, { rows: o.rows, extra: h => { if (o.over !== false) Object.assign(h.jobs, extraRows()); if (o.roomy) Object.keys(h.people).forEach(w => { h.people[w] = { school: 300, weekend: 300 }; }); if (o.extra) o.extra(h); } }); }
// kind: "builtin" | "saved" | "none" (the Up for Grabs pool); mode: "off" | "preview" | "on"
function world(kind, mode, o) { o = o || {}; return G.world(kind, mode, Object.assign({}, o, { household: o.household || household(mode, o) })); }
const KIDS = G.KIDS;
// today's ×2 offers a kid sees (ids), and the whole Up for Grabs screen
const x2 = (d, kid, mom) => JSON.parse(d.run("JSON.stringify(hdGrabRows(" + JSON.stringify(kid) + "," + (mom ? "true" : "false") + ").map(function(x){ return x.id; }))"));
const bank = (w, kid) => Object.values(((w.get("bank/" + kid) || {}).adjustments) || {});
const bal = (w, kid) => bank(w, kid).reduce((a, x) => a + (x.amount || 0), 0);
module.exports = { extraRows, household, world, KIDS, x2, bank, bal, G, W };
