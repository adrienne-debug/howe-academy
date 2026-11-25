// covered_pairs.js — how to take slice F (COVERED: "done Mon" in place of a second turn) back out of this tree, for the tests that
// need "the app before F" (test_house_covered.js) or "the app before E" (test_house_plan_missed.js, which takes F out first: F sits
// on E). Blocks are removed whole; each pair [now, before] must match exactly once. A pair marked "inE" sits inside one of E's own
// blocks, so taking E out takes it too.
"use strict";
module.exports = {
  IDX_BLOCKS: ["COVERED", "COVEREDDAY"],
  IDX_PAIRS: [
    ["    const due={}, cands=[], routine=[], cov={};   // COVERED: the turns done just before their day\n", "    const due={}, cands=[], routine=[];\n"],
    ["      const cv=covOf(ov,s,id,j,d); if(cv){ cov[id]={id:id,turn:turn,done:cv,k:d.k}; return; }   // COVERED (slice F): done within its window before its day\n", ""],
    ["    if(M) covCarry(cov,cands,missed,Mk);   // COVERED\n", ""],
    [" if(M) r.wait=wait; if(M) r.covered=Object.keys(cov).sort().map(function(id){ return cov[id]; }); return r;   // COVERED\n", " if(M) r.wait=wait; return r;\n"],
    ["  if(typeof hdCoverOv===\"function\") hdCoverOv(o,J);   // COVERED (slice F)\n", "", "inE"],   // inside E's MISSEDDAY block
  ],
  HJS_BLOCKS: ["COVEREDSEEN"],
  HJS_PAIRS: [
    ["  h+=(typeof hpCovHTML===\"function\")?hpCovHTML(who,(typeof hdCovered===\"function\")?hdCovered(t):[]):'';   // COVERED (slice F): done early, so today's turn is skipped\n", ""],
    ["    h+=(typeof hpCovHTML===\"function\")?hpCovHTML(who,d0.covered||[]):'';   // COVERED (slice F): the preview's own (days from the plan's start date)\n", ""],
  ],
};
