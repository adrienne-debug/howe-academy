/*
 * test_fixtures/carve_g.js — "the app before" slice G (HORECSTORED in house.js; test_house_record_stored.js): the given house.js with
 * the HORECSTORED block taken out and its six HOWOFTEN lines put back, each piece matched exactly once (or it throws). Used by
 * test_house_record_stored.js and by the tests whose own "app before" is built on a tree G reads from (C3 test_chore_drop.js — hoDrop,
 * E test_house_plan_missed.js — hdMissedOn / the stored days, F test_house_covered.js — hdCoverN).
 */
"use strict";
const PAIRS = [
  ["skip:[\"–\",\"#cbd5e1\"],nobody:[\"◌\",\"#b45309\"]};   // ◌ HORECSTORED (slice G): fit nobody", "skip:[\"–\",\"#cbd5e1\"]};"],
  ["    const pd=(typeof hoStored===\"function\")?hoStored(id,j,n,nx,X):undefined; if(pd!==undefined){ if(pd) marks.push(pd); continue; }   // HORECSTORED (slice G): a day the plan stored\n", ""],
  ["function hoSum(ms){ const s={on:0,late:0,drop:0,skip:0,nobody:0}; ms.forEach(function(x){ s[x.m]++; }); s.done=s.on+s.late; s.n=s.done+s.drop+s.nobody; return s; }   // nobody: HORECSTORED", "function hoSum(ms){ const s={on:0,late:0,drop:0,skip:0}; ms.forEach(function(x){ s[x.m]++; }); s.done=s.on+s.late; s.n=s.done+s.drop; return s; }"],
  ["+(s.nobody?' · '+s.nobody+' fit nobody':'')", ""],
  [":x.m===\"nobody\"?'fit nobody, all through its wait (the limits): not counted against a kid':x.off?'off that day':'not counted')+(x.by?' by '+hhWhoName(x.by):'')+((x.pl&&typeof hoStoredTip===\"function\")?hoStoredTip(x):'');   // HORECSTORED", ":x.off?'off that day':'not counted')+(x.by?' by '+hhWhoName(x.by):'');"],
  ["wk:w.n?(w.nobody?{done:w.done,n:w.n,drop:w.drop,nobody:w.nobody}:{done:w.done,n:w.n,drop:w.drop}):null", "wk:w.n?{done:w.done,n:w.n,drop:w.drop}:null"],
  ["+(L.wk.nobody?' · '+L.wk.nobody+' fit nobody':'')", ""],
];
function hjs(s) { const re = /^\/\/ HORECSTORED_START[^\n]*\n[\s\S]*?^\/\/ HORECSTORED_END\n/m;
  if ((s.match(new RegExp(re.source, "gm")) || []).length !== 1) throw new Error("carve_g: the HORECSTORED block is not found once");
  s = s.replace(re, ""); PAIRS.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("carve_g: the app before G cannot be built — piece " + (i + 1) + " found " + n + "×"); s = s.replace(a, () => b); });
  if (/HORECSTORED|hoStored|hoTurns|hoEarly|nobody/.test(s.slice(s.indexOf("// HOWOFTEN_START"), s.indexOf("// HOWOFTEN_END")))) throw new Error("carve_g: the app before G still mentions slice G");
  return s; }
module.exports = { hjs, PAIRS };
