/*
 * PATSIDE (her design 2026-10-23): with a learning pattern, a card needs the session's right answers on the day its
 * side changes and 1 on the day that repeats yesterday's side. German see·see·say·say·type at 3 → 3·1·3·1·3 = 11.
 *   run:  node test_pattern_side_passes.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const block=src.slice(src.indexOf("// ── MST_ENGINE_START ──"),src.indexOf("// ── MST_ENGINE_END ──"));
const ctx={console,Math,Object,Array,String,Number,JSON,Set,Date,masteryData:{},masteryKid:null,
  MAST_TIER_ORDER:["daily","every_other_day","weekly","bi_weekly","monthly","graduated"],MAST_TIER_INT:{daily:1,every_other_day:2,weekly:7,bi_weekly:14,monthly:28,graduated:null},
  mastDrillSettings:()=>({ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}),mastIsDue:()=>false,mastIsParked:()=>false,mastIsNeverDrill:()=>false,mastFullBank:()=>({})};
vm.createContext(ctx); vm.runInContext(block,ctx);
const R=c=>vm.runInContext(c,ctx);
const GER=["rec","rec","say","say","type"];

console.log("📅 which days are repeat days");
{
  const rep=[0,1,2,3,4].map(d=>R("mstPatternRepeatDay("+JSON.stringify(GER)+","+d+",5)"));
  ok("German see·see·say·say·type → repeat only on day 2 and day 4",JSON.stringify(rep)==="[false,true,false,true,false]",rep);
  ok("no pattern → never a repeat day",R("mstPatternRepeatDay(null,1,5)")===false);
  ok("a 3-slot pattern stretched over 5 learning days follows the stretched slots",
    JSON.stringify([0,1,2,3,4].map(d=>R("mstPatternRepeatDay([\"rec\",\"say\",\"type\"],"+d+",5)")))===JSON.stringify([0,1,2,3,4].map(d=>{ const m=e=>R("mstPatternMode([\"rec\",\"say\",\"type\"],"+e+",5)"); return d>0&&m(d)===m(d-1); })));
}

console.log("🃏 the sitting asks 3 · 1 · 3 · 1 · 3");
{
  const sess={pattern:GER,passes:3};
  const learning=[0,1,2,3,4].map(d=>({id:"g"+d,subject:"German",prompt:"wort"+d,tally_dots:d,status:"introduction"}));
  R("var _st=mstSittingInit("+JSON.stringify({reviews:[{id:"r1",subject:"German",prompt:"alt",status:"active"}],learning,newNames:[{deck:"German",name:"neu"}]})+","+JSON.stringify(sess)+",{dotsNeeded:()=>5})");
  const need=k=>R("(function(){ var c=_st.cards["+JSON.stringify(k)+"]; return c.passes!=null?c.passes:_st.passes; })()");
  ok("day 1 (see it, first time) needs 3",need("l:g0")===3);
  ok("day 2 (see it again) needs 1",need("l:g1")===1);
  ok("day 3 (say it, new side) needs 3",need("l:g2")===3);
  ok("day 4 (say it again) needs 1",need("l:g3")===1);
  ok("day 5 (type it, new side) needs 3",need("l:g4")===3);
  ok("a brand-new word needs 3",need("n:German|neu")===3);
  ok("total for one word: 3+1+3+1+3 = 11",[0,1,2,3,4].reduce((a,d)=>a+need("l:g"+d),0)===11);
  // answering: a repeat-day card is done after one Good; a side-change card needs three
  R("mstAnswer(_st,'l:g1','good'); mstAnswer(_st,'l:g2','good');");
  ok("repeat-day card: one right answer finishes it",R("_st.cards['l:g1'].done")===true);
  ok("side-change card: one right answer is not enough",R("_st.cards['l:g2'].done")===false&&R("_st.cards['l:g2'].goods")===1);
  R("mstAnswer(_st,'l:g2','good'); mstAnswer(_st,'l:g2','good');");
  ok("…three right answers finish it",R("_st.cards['l:g2'].done")===true);
  R("mstAnswer(_st,'l:g3','again')");
  ok("a miss on a repeat day sends it to the back, still needing 1",R("_st.cards['l:g3'].done")===false&&R("_st.queue[_st.queue.length-1]")==="l:g3");
  R("mstAnswer(_st,'l:g3','good')");
  ok("…and one right answer then finishes it",R("_st.cards['l:g3'].done")===true);
  R("mstAnswer(_st,'r:r1','good')");
  ok("reviews still finish on one right answer",R("_st.cards['r:r1'].done")===true);
  const back=R("JSON.stringify(mstRestore(mstSerialize(_st)).cards['l:g1'])");
  ok("a saved and restored sitting keeps the per-card number",JSON.parse(back).passes===1);
}

console.log("📴 sessions without a pattern are unchanged");
{
  R("var _s2=mstSittingInit("+JSON.stringify({reviews:[],learning:[{id:"x",subject:"Science",prompt:"atom",tally_dots:1,status:"introduction"}],newNames:[]})+",{passes:2},{dotsNeeded:()=>3})");
  ok("no pattern → no per-card number, the session's 2 applies",R("_s2.cards['l:x'].passes")===undefined&&R("_s2.passes")===2);
  R("mstAnswer(_s2,'l:x','good')");
  ok("…one right answer is not enough on any day",R("_s2.cards['l:x'].done")===false);
}

console.log("wiring");
ok("the block is marked",src.indexOf("// PATSIDE_START")>0&&src.indexOf("// PATSIDE_END")>src.indexOf("// PATSIDE_START"));
ok("mstAnswer reads the card's own number first",/if \(card\.goods >= \(card\.passes != null \? card\.passes : state\.passes\)\)/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
