/*
 * MSTREPICK (her ask 2026-11-16): a sitting saved on the device follows the session's CURRENT learning pattern when it is
 * resumed — unfinished learning/new cards get their step again; finished cards, grades, queue and reviews are untouched,
 * and the ← Back / Forward → snapshots follow too.   run: node test_sitting_repick.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<0){ console.log("FAIL- block missing "+a); process.exit(1); } return src.slice(i,j); };
const block=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──")
  +cut("// ── Persistence (resumable sitting, same-day only)","// MSTREPICK_END");
const store={};
const SESS={sid:"envirothon",name:"Envirothon",kind:"deck",passes:2,pattern:["pick","ideas","type"]};
const ctx={console,Math,Object,Array,String,Number,JSON,Set,Date,
  masteryKid:"lincoln",
  masteryData:{lincoln:[
    {id:"a",subject:"General",prompt:"Q a",tally_dots:2,status:"introduction"},   // day 3 → type
    {id:"b",subject:"General",prompt:"Q b",tally_dots:2,status:"introduction"},   // day 3 → type, already finished
    {id:"c",subject:"General",prompt:"Q c",tally_dots:0,status:"introduction"},   // day 1 → pick
    {id:"r",subject:"General",prompt:"Q r",status:"active",tier:"weekly"}]},
  MAST_TIER_ORDER:["daily","every_other_day","weekly","bi_weekly","monthly","graduated"],MAST_TIER_INT:{},
  mastDrillSettings:()=>({}),mastIntroDotsFor:()=>3,mastIsDue:()=>false,mastIsParked:()=>false,mastIsNeverDrill:()=>false,mastFullBank:()=>({}),
  mstSessions:()=>[SESS], mstTodayKey:()=>"2026-11-16", mstStorageKey:(k,s)=>k+"|"+s,
  HA_LS:{setItem:(k,v)=>{store[k]=v;},getItem:k=>store[k]==null?null:store[k],removeItem:k=>{delete store[k];}}};
vm.createContext(ctx); vm.runInContext(block,ctx);
vm.runInContext('MST_PATTERN_MODES.push("pick"); MST_PATTERN_MODES.push("ideas");',ctx);
ctx.SESS=SESS; vm.runInContext('mstSessions=function(){ return [SESS]; };',ctx);   // the engine's own mstSessions reads masteryData; the test hands it the 🌿 session
const R=c=>vm.runInContext(c,ctx);
ctx.SESS=SESS;

// start a sitting with Pick it → Key ideas → Type it (3 learning days)
R(`var _items=masteryData.lincoln;
  mstState=mstSittingInit({reviews:[_items[3]],learning:[_items[0],_items[1]],newNames:[{deck:"General",name:"Q new"}]},SESS,{dotsNeeded:()=>3});
  mstSid="envirothon"; mstStartTs=1;`);
ok("at start: day-3 cards are Type it, the new card Pick it",
  R('mstState.cards["l:a"].mode')==="type"&&R('mstState.cards["l:b"].mode')==="type"&&R('mstState.cards["n:General|Q new"].mode')==="pick");
// he finishes card b, grades card a once; one Back snapshot exists
R(`mstRedo=[]; mstHist=[mstSerialize(mstState)]; mstState.cards["l:b"].done=true; mstState.cards["l:b"].goods=2; mstState.cards["l:a"].goods=1; mstPersist();`);
const before=JSON.parse(store["lincoln|envirothon"]);
ok("the device saved the sitting with Type it", before.state.cards["l:a"].mode==="type");

// Mom unticks Type it
SESS.pattern=["pick","ideas"];
R('mstState=null; mstHist=[]; mstRedo=[];');
ok("restore works", R('mstRestoreSitting("envirothon")')===true);
const c=R("mstState.cards");
ok("unfinished day-3 card now Key ideas (not Type it)", c["l:a"].mode==="ideas", c["l:a"]);
ok("…and keeps its grade so far", c["l:a"].goods===1);
ok("finished card untouched (still marked done, Type it, goods 2)", c["l:b"].done===true&&c["l:b"].mode==="type"&&c["l:b"].goods===2, c["l:b"]);
ok("new card still Pick it", c["n:General|Q new"].mode==="pick");
ok("review card untouched (no step)", c["r:r"].mode===undefined, c["r:r"]);
ok("queue untouched", JSON.stringify(R("mstState.queue"))===JSON.stringify(before.state.queue));
ok("Back snapshot follows too (no Type it comes back)", R('mstHist[0].cards["l:a"].mode')==="ideas"&&R('mstHist[0].cards["l:b"].mode')==="ideas", R("mstHist[0].cards"));

// Pattern turned Off → plain flip
SESS.pattern=null; R('mstState=null; mstRestoreSitting("envirothon")');
ok("pattern Off → unfinished cards are plain flip", R('mstState.cards["l:a"].mode')===undefined);

// Repeat-day passes (PATSIDE) follow the new pattern: pick,pick,ideas over 3 days → day 2 repeats
SESS.pattern=["pick","pick","ideas"]; R('masteryData.lincoln[0].tally_dots=1; mstState=null; mstRestoreSitting("envirothon")');
ok("repeat day → 1 right needed (passes 1)", R('mstState.cards["l:a"].passes')===1&&R('mstState.cards["l:a"].mode')==="pick");
SESS.pattern=["ideas","pick","ideas"]; R('mstState=null; mstRestoreSitting("envirothon")');
ok("not a repeat day → passes back to the session's", R('mstState.cards["l:a"].passes')===undefined);

// unchanged pattern → nothing changes
SESS.pattern=["pick","ideas","type"]; R('masteryData.lincoln[0].tally_dots=2; mstState=null; mstRestoreSitting("envirothon"); mstPersist();');
R('mstState=null; mstRestoreSitting("envirothon")');
ok("same pattern as at start → same steps as at start", R('mstState.cards["l:a"].mode')==="type"&&R('mstState.cards["n:General|Q new"].mode')==="pick");
// yesterday's sitting is still ignored

const old=JSON.parse(store["lincoln|envirothon"]); old.date="2026-11-15"; store["lincoln|envirothon"]=JSON.stringify(old);
ok("a sitting saved yesterday still isn't restored", R('mstState=null; mstRestoreSitting("envirothon")')===false);

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
