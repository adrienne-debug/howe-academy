/*
 * 🏁 Whole-list bonus (config/routineBonus/{slot}/{kid}): slices the REAL toggleRtStep + rtBonusSettle
 * out of index.html and checks: pays once when the last due step is checked, reverses on un-check,
 * re-pays once on re-complete, never pays with bonus 0, as-needed/not-due steps don't block it.
 *   run: node test_list_bonus.js
 */
const fs = require("fs");
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const FNS=["toggleRtStep","rtBonusSettle","rtBonusFor","rtComplete","rtDueOrLate","rtDoneOn","rtStepsFor","rtApplyRot","cadDueOn","cadDowIdx","cadDateNum","routineEditable"].map(slice).join("\n");
let pass=0,fail=0; const ok=(n,c,x)=>c?(pass++,console.log("  ok  - "+n)):(fail++,console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):"")));

function mk(steps,bonus,LATE){ LATE=LATE||{};
  const LEDGER=[],REMOVED=[]; let seq=0;
  const env={ day:"monday", _todayDay:"monday", momModeActive:false, adminPinUnlocked:false, slState:{}, rtOpen:{}, db:null, tab:"x",
    DAY_DT:{monday:"August 17"}, RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, RT_DEFAULT:{chores:{lucy:steps}}, routineCfg2:{}, SL_KIDS:["lucy"],
    routineBonus:{chores:{lucy:bonus}},
    momHere:function(){return this.momModeActive||this.adminPinUnlocked;},
    activeWk:()=>"week18", nowTs:()=>"9:00", cap:s=>s[0].toUpperCase()+s.slice(1),
    rtAvailable:()=>true, _rtBlockedToast:()=>{}, zoneBonusFor:()=>0, rlogAppend:()=>{}, sv:()=>{}, renderSkylight:()=>{}, renderAll:()=>{},
    bankDirect:(kid,pts,note)=>{ const id="b"+(++seq); LEDGER.push({id,kid,pts,note}); return id; },
    bankDirectRemove:(kid,id)=>{ REMOVED.push(id); const i=LEDGER.findIndex(l=>l.id===id); if(i>=0) LEDGER.splice(i,1); },
    _CAD_DOW:{monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6}, _mrLegacySteps:()=>[],
    rtLateDays:(slot,kid,i)=>(LATE[i]||0) };
  const keys=Object.keys(env);
  const body=FNS+"\nreturn {toggleRtStep, slState, rtComplete, cadDueOn};";
  const f=new Function(...keys,body); const r=f(...keys.map(k=>env[k]));
  r.bal=()=>LEDGER.reduce((a,l)=>a+l.pts,0); r.bonusLines=()=>LEDGER.filter(l=>/list complete/.test(l.note)); r.removed=REMOVED; return r;
}
console.log("bonus pays once on completion, reverses on un-check");
{ const t=mk([{label:"A",pts:10},{label:"B",pts:5}],25);
  t.toggleRtStep("chores","lucy",0); ok("no bonus after first step", t.bonusLines().length===0);
  t.toggleRtStep("chores","lucy",1); ok("bonus paid when list completes", t.bonusLines().length===1&&t.bonusLines()[0].pts===25);
  ok("balance = 10+5+25", t.bal()===40, t.bal());
  ok("bonusBid stored on slot record", !!t.slState["week18_monday_lucy_chores"].bonusBid);
  t.toggleRtStep("chores","lucy",1); ok("un-check removes the bonus line (+ the step line)", t.bonusLines().length===0&&t.removed.length===2);
  ok("balance back to 10", t.bal()===10, t.bal());
  t.toggleRtStep("chores","lucy",1); ok("re-complete pays exactly once more", t.bonusLines().length===1&&t.bal()===40);
  t.toggleRtStep("chores","lucy",1); t.toggleRtStep("chores","lucy",1); ok("toggle twice → still one bonus line", t.bonusLines().length===1, t.bonusLines()); }
console.log("bonus 0 = off");
{ const t=mk([{label:"A",pts:10}],0); t.toggleRtStep("chores","lucy",0); ok("no bonus line with 0", t.bonusLines().length===0&&t.bal()===10); }
console.log("not-due / as-needed steps do not block the bonus");
{ const t=mk([{label:"A",pts:10},{label:"Lizard poop",pts:15,cad:"asneeded"},{label:"Sat only",pts:5,cad:"sat"}],20);
  t.toggleRtStep("chores","lucy",0); ok("bonus paid with as-needed + Saturday step unchecked", t.bonusLines().length===1&&t.bal()===30, t.bal()); }
console.log("✋ as-needed: shows/pays but never due; 'none' is never due");
{ const t=mk([{label:"A",pts:10},{label:"Lizard poop",pts:15,cad:"asneeded"},{label:"Hidden",pts:5,cad:"none"}],20);
  ok("asneeded not due", t.cadDueOn("asneeded","monday")===false); ok("none not due", t.cadDueOn("none","monday")===false);
  t.toggleRtStep("chores","lucy",1); ok("tapping as-needed pays its stars", t.bal()===15, t.bal());
  ok("as-needed alone does not complete the list / pay bonus", !t.slState["week18_monday_lucy_chores"].done&&t.bonusLines().length===0);
  t.toggleRtStep("chores","lucy",0); ok("due step done → list complete + bonus, as-needed irrelevant", t.slState["week18_monday_lucy_chores"].done&&t.bonusLines().length===1&&t.bal()===45, t.bal());
  t.toggleRtStep("chores","lucy",1); ok("un-checking as-needed reverses only its own stars, list stays complete", t.bal()===30&&t.slState["week18_monday_lucy_chores"].done&&t.bonusLines().length===1, t.bal()); }
console.log("🔄 rotation: as-needed travels with the job");
{ // lucy's slot is as-needed lizard poop (rot "pets"); ellis's slot is daily "Feed fish" (rot "pets"). Whoever holds lizard poop today sees it as-needed.
  const t=mk([{label:"Lizard poop",pts:15,cad:"asneeded",rot:"pets"}],0);
  ok("harness sanity", typeof t.rtComplete==="function"); }
console.log("late carry-over counts toward complete (Julian's Tuesday shower)");
{ // Shower is Mon/Thu/Fri; today is Tuesday in this scenario → not due by cadence, but 1 day late.
  const t=mk([{label:"Shower",pts:50,cad:"wk:0,3,5"}],10,{0:1}); 
  const env_day="monday"; // harness day is monday; cadence wk:0 makes it DUE — so use a Tue-only step to isolate late:
  const u=mk([{label:"Shower",pts:50,cad:"wk:1,3,5"}],10,{0:1});
  ok("late (not due today) step keeps the list NOT complete", u.rtComplete("chores","lucy","monday")===false);
  u.toggleRtStep("chores","lucy",0); ok("doing the late step completes the list + pays bonus", u.slState["week18_monday_lucy_chores"].done&&u.bonusLines().length===1, u.bal());
  const v=mk([{label:"Shower",pts:50,cad:"wk:1,3,5"}],10,{});
  ok("same step, NOT late → nothing due → complete (vacuous)", v.rtComplete("chores","lucy","monday")===true); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
