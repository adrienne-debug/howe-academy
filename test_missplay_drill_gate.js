/*
 * 📚 DRILLGATE — drills wait for the daily study (step 6; her words 2026-11-02: "Their drills wouldn't open up until … their
 * daily session's done"). Switch on + "Drills wait for the daily study" on: 📝 Log becomes "📚 Study first · what's left" until
 * every study session (not check-ups) is done for the day; Mom can tap Drill anyway (today, this device). Otherwise unchanged.
 *   run:  node test_missplay_drill_gate.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
ok("mastStartLog asks the gate right after the Kids' Corner gate",/if\(typeof kcLogGate==="function"&&!kcLogGate\(\)\) return; if\(typeof mpDrillGate==="function"&&!mpDrillGate\(masteryKid\)\) return;/.test(fnText("mastStartLog")));
ok("the Drills tab shows the gate in place of 📝 Log (Log another untouched)",/else if\(typeof mpDrillGate==="function"&&!mpDrillGate\(masteryKid\)\) h\+=mpDrillGateHtml\(masteryKid\);/.test(src)&&(src.match(/mpDrillGateHtml\(masteryKid\)/g)||[]).length===1&&/mastRelog\(\)/.test(src));
ok("mpSet accepts the wait field; Mom HQ has the row",/\["on","cap","secs","close","study","wait"\]/.test(fnText("mpSet"))&&/tg\("wait",c\.wait\)/.test(fnText("mpSettingsHtml")));
ok("the gate writes nothing",!/db\./.test(fnText("mpDrillGate")+fnText("mpDrillGateHtml")+fnText("mpDrillAnyway")+fnText("mpStudyLeft")));
const blk=src.slice(src.indexOf("// MISSPLAY_START"),src.indexOf("// MISSPLAY_END"));
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));

// ── a sandbox: WHICHONE + GAMELOG + MISSPLAY, sessions and today's logs ──
function sandbox(o){
  o=o||{};
  const md={kid1:[],kid1_settings:o.settings||{missPlay:{on:true}},history:{},studyLog:{kid1:o.logs||{}}};
  const piles=o.piles||{};
  const ctx={console,Math,Object,Array,String,JSON,Number,Set,Date,setTimeout:()=>0,
    masteryKid:"kid1", masteryData:md,
    _smTileVis:()=>null,_matchPlain:h=>String(h||""),esc:s=>String(s||""),cap:s=>s.toUpperCase(),
    mastSpeak(){},matchDing(){},matchBonk(){},_mastRe(){},_dryRun:()=>false,db:null,
    HA_LS:{setItem(){}},bbAudioUnlock(){},renderAll(){},momHere:()=>o.mom!==false,mastAdminPinOk:!!o.pin,
    mastSchoolDayNum:()=>5,mstTodayKey:()=>"20261102",
    mstSessions:()=>o.sessions||[],mstLogGet:(k,sid)=>(md.studyLog[k]&&md.studyLog[k][sid]&&md.studyLog[k][sid]["20261102"])||null,
    mstPile:(k,sid)=>piles[sid]||{newNames:["x"],reviews:[],learning:[]},mastGetPrintNum:()=>1,mstEscJs:s=>String(s).replace(/'/g,"\\'"),
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}}};
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("// WHICHONE_START"),src.indexOf("// MISSPLAY_END")),ctx);
  return ctx;
}
const SESS=[{sid:"fact",name:"Fact Study",emoji:"🔢",kind:"deck"},{sid:"daily",name:"Daily Study",emoji:"📚",kind:"all"},{sid:"mix",name:"Daily Mix",emoji:"🎲",kind:"mix"},{sid:"ck",name:"Check-up",kind:"checkup"}];
const log={"20261102":{total:5}};

console.log("── off = the drill as it was ──");
{ const c=sandbox({settings:{},sessions:SESS}); ok("switch off → open",c.mpDrillGate("kid1")===true&&c.mpDrillGateHtml("kid1")===""); }
{ const c=sandbox({settings:{missPlay:{on:true,wait:false}},sessions:SESS}); ok("toggle off → open",c.mpDrillGate("kid1")===true); }
{ const c=sandbox({sessions:[]}); ok("no sessions → open",c.mpDrillGate("kid1")===true); }
{ const c=sandbox({sessions:[SESS[3]]}); ok("only a check-up → open (Mom's, never a kid's step)",c.mpDrillGate("kid1")===true); }
console.log("── the gate holds until the study is done ──");
{
  const c=sandbox({sessions:SESS});
  ok("nothing done → closed; what's left names the three sessions in order",c.mpDrillGate("kid1")===false&&c.mpStudyLeft("kid1").map(x=>x.sid).join(",")==="fact,daily,mix");
  const h=c.mpDrillGateHtml("kid1");
  ok("in place of Log: 📚 Study first · the sessions, and Mom's Drill anyway",/mp-drill-gate/.test(h)&&h.indexOf("Study first")>=0&&h.indexOf("Fact Study")>=0&&h.indexOf("Daily Mix")>=0&&/mpDrillAnyway\('kid1'\)/.test(h));
}
{ const c=sandbox({sessions:SESS,logs:{fact:log,daily:log}}); ok("two of three done → still closed, only the Mix left",c.mpDrillGate("kid1")===false&&c.mpStudyLeft("kid1").map(x=>x.sid).join(",")==="mix"); }
{ const c=sandbox({sessions:SESS,logs:{fact:log,daily:log,mix:log}}); ok("all done → open, no banner",c.mpDrillGate("kid1")===true&&c.mpDrillGateHtml("kid1")===""); }
{ const c=sandbox({sessions:SESS,logs:{fact:log,mix:log},piles:{daily:{newNames:[],reviews:[],learning:[]}}}); ok("a session with nothing to do today counts as done",c.mpDrillGate("kid1")===true); }
console.log("── Drill anyway: Mom only, today, this device ──");
{
  const c=sandbox({sessions:SESS});
  ok("Mom taps Drill anyway → open for today",c.mpDrillAnyway("kid1")===true&&c.mpDrillGate("kid1")===true&&c.mpDrillGateHtml("kid1")==="");
  c.mstTodayKey=()=>"20261103";
  ok("tomorrow the gate holds again",c.mpDrillGate("kid1")===false);
}
{ const c=sandbox({sessions:SESS,mom:false}); const h=c.mpDrillGateHtml("kid1"); ok("not Mom: the banner, no Drill anyway button, the tap refused",h.indexOf("Study first")>=0&&!/mpDrillAnyway/.test(h)&&c.mpDrillAnyway("kid1")===false&&c.mpDrillGate("kid1")===false); }
{ const c=sandbox({sessions:SESS,mom:false,pin:true}); ok("the admin PIN counts as Mom",/mpDrillAnyway/.test(c.mpDrillGateHtml("kid1"))&&c.mpDrillAnyway("kid1")===true); }
console.log("── the setting round-trips ──");
{ const c=sandbox({sessions:SESS}); ok("wait defaults on; mpSet wait false → open",c.mpCfg("kid1").wait===true&&c.mpSet("kid1","wait",false)===true&&c.mpCfg("kid1").wait===false&&c.mpDrillGate("kid1")===true);
  ok("Mom HQ shows the row only while the switch is on",c.mpSettingsHtml("kid1").indexOf("Drills wait for the daily study")>=0&&(c.mpSet("kid1","on",false),c.mpSettingsHtml("kid1").indexOf("Drills wait for the daily study")<0)); }
console.log("── a broken helper never locks the drill ──");
{ const c=sandbox({sessions:SESS}); c.mstSessions=()=>{ throw new Error("boom"); }; ok("mstSessions throwing → open",c.mpDrillGate("kid1")===true); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
