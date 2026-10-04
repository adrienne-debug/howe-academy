/*
 * ⏰ Late chores are measured from TODAY, not the tab on screen (LATE_TODAY, her ask 2026-10-04).
 * Slices the REAL rtLateDays / rtDueOrLate / rtSlotHTML lines. Live incident: on Thu Oct 1 someone opened Friday's tab
 * at 3:51 PM and Lucy's Thursday "Clean bathroom mirrors" read "1 day late" and was filed "— not done" — she did it at 5:32 PM.
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const a=src.indexOf("// SUNDAY_FIRST_START"), b=src.indexOf("// SUNDAY_FIRST_END");
const NAMES=["_rtDayPassed","_rtLastDueIdx","rtLateDays","rtDoneOnWk","_prevWkKey","rtDueOrLate"].concat(src.indexOf("function _rtPrevDueIdx(")>=0?["_rtPrevDueIdx"]:[]);
const CODE=src.slice(a,b)+"\n"+NAMES.map(slice).join("\n");
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log("  ok  - "+m);} else {fail++;console.log("  FAIL- "+m);} }
const W={monday:"2026-09-28",tuesday:"2026-09-29",wednesday:"2026-09-30",thursday:"2026-10-01",friday:"2026-10-02"};
const STEPS=[0,1,2,3,4,5,6].map(d=>({label:"chore"+d,cad:"wk:"+d}));
function run(o,expr){
  const ctx={ DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    _todayDay:o.today, day:o.view, slState:o.cur||{}, prevSlState:{}, activeWk:()=>"week25", rtStepsFor:()=>STEPS, _loadPrevSl:()=>{},
    stepWindowOk:()=>true, cadDueOn:(cad,d)=>cad==="wk:"+["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].indexOf(d),
    routineDateISO:dn=>dn===o.today?W[o.today]:(W[dn]||null), out:null };
  vm.createContext(ctx); vm.runInContext(CODE+"\nout=("+expr+");",ctx); return ctx.out;
}
console.log("Thu Oct 1, Friday's tab open (the live incident):");
ok(run({today:"thursday",view:"friday"},"rtLateDays('chores','lucy',3)")===0,"Thursday's chore, still due today, is NOT late");
ok(run({today:"thursday",view:"friday"},"rtLateDays('chores','lucy',2)")===1,"Wednesday's missed chore is 1 day late as of today (not 2)");
console.log("Thu Oct 1, Wednesday's tab open (Kids' Corner asks about today):");
ok(run({today:"thursday",view:"wednesday"},"rtLateDays('chores','lucy',1)")===2,"Tuesday's missed chore = 2 days late as of today (was 1 by the open tab)");
ok(run({today:"thursday",view:"wednesday"},"rtDueOrLate('chores','lucy','thursday',1,{cad:'wk:1'})")===true,"today's list still counts the late chore while another tab is open");
ok(run({today:"thursday",view:"thursday"},"rtDueOrLate('chores','lucy','wednesday',1,{cad:'wk:1'})")===false,"a past day's list never picks up today's carry-overs");
console.log("Today's tab — unchanged:");
ok(run({today:"thursday",view:"thursday"},"rtLateDays('chores','lucy',3)")===0,"due today → not late");
ok(run({today:"thursday",view:"thursday"},"rtLateDays('chores','lucy',2)")===1,"Wednesday's chore 1 day late");
ok(run({today:"thursday",view:"thursday",cur:{"week25_thursday_lucy_cstep2":{done:true}}},"rtLateDays('chores','lucy',2)")===0,"caught up today → not late");
console.log("rtSlotHTML only shows/logs carry-overs on today's tab:");
const rs=slice("rtSlotHTML");
ok(/day===_todayDay&&rtLateDays\(slot,kid,i\)>0/.test(rs),"due list: late rows only when the tab is today");
ok(/_lateN=\(day===_todayDay\)\?rtLateDays\(slot,kid,i\):0/.test(rs),"late badge + miss logging only when the tab is today");
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
