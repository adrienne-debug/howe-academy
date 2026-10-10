/*
 * ⏰ LATE_FROM — a step is never late for a due day before it began (her report 2026-10-10: "things are showing up late that
 * were just added, we don't want that"). Live incident: weekday laundry rows written on Sat Oct 10 showed "5 days late"
 * against the Monday before they existed. Slices the REAL rtLateDays / _rtLogLateMiss / helpers.   run: node test_late_from.js
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const a=src.indexOf("// SUNDAY_FIRST_START"), b=src.indexOf("// SUNDAY_FIRST_END");
const NAMES=["_rtDayPassed","_rtLastDueIdx","_rtPrevDueIdx","_rtDueIso","_rtBeforeFrom","rtLateDays","rtDoneOnWk","_prevWkKey","rtDueOrLate","_rtLogLateMiss"];
const CODE=src.slice(a,b)+"\n"+NAMES.map(slice).join("\n");
let pass=0, fail=0; function ok(c,m,x){ if(c){pass++;console.log("  ok  - "+m);} else {fail++;console.log("  FAIL- "+m+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
// the live week: Sun Oct 4 … Sat Oct 10; today is Saturday Oct 10
const W={sunday:"2026-10-04",monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09",saturday:"2026-10-10"};
function run(o,expr){
  const steps=o.steps, misses=[];
  const ctx={ DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    _todayDay:o.today||"saturday", day:o.today||"saturday", slState:o.cur||{}, prevSlState:o.prev||{}, activeWk:()=>"week26", rtStepsFor:()=>steps, _loadPrevSl:()=>{},
    stepWindowOk:(st,d)=>!(st&&st.from&&W[d]&&W[d]<st.from), cadDueOn:(cad,d)=>cad==="wk:"+["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].indexOf(d),
    routineDateISO:dn=>o.noDates?null:(W[dn]||null), Date, String, _oldWay:!!o.old, _rtLogMiss:(kid,slot,i,dueDay,label,pts,wk)=>misses.push([dueDay,wk||"week26"]), misses, out:null, steps:steps };
  vm.createContext(ctx); vm.runInContext(CODE+(o.old?"\n_rtBeforeFrom=function(){ return false; };":"")+"\nout=("+expr+");",ctx); return {v:ctx.out,misses:ctx.misses};
}
console.log("Saturday Oct 10, laundry rows written today (from = 2026-10-10):");
const NEW=[{label:"Start your laundry load",cad:"wk:0",from:"2026-10-10"},{label:"Fold",cad:"wk:1",from:"2026-10-10"},{label:"Sat thing",cad:"wk:5",from:"2026-10-10"}];
ok(run({steps:NEW},"rtLateDays('afternoon','lincoln',0)").v===0,"Monday row born today → not late (was 5 days)");
ok(run({steps:NEW},"rtLateDays('afternoon','ellis',1)").v===0,"Tuesday row born today → not late");
ok(run({steps:NEW},"rtDueOrLate('afternoon','lincoln','saturday',0,steps[0])").v===false,"…and it is not on today's list either");
ok(run({steps:NEW},"rtDueOrLate('afternoon','lincoln','saturday',2,steps[2])").v===true,"a Saturday row born today IS due today");
let r=run({steps:NEW},"_rtLogLateMiss('afternoon','lincoln',0,'wk:0','Start your laundry load',10)"); ok(r.misses.length===0,"no '— not done' filed for the Monday before it existed");
console.log("Next week, same rows (Sat Oct 17, today):");
const W2={sunday:"2026-10-11",monday:"2026-10-12",tuesday:"2026-10-13",wednesday:"2026-10-14",thursday:"2026-10-15",friday:"2026-10-16",saturday:"2026-10-17"};
function run2(o,expr){ const save=Object.assign({},W); Object.assign(W,W2); try{ return run(o,expr); } finally { Object.keys(W).forEach(k=>delete W[k]); Object.assign(W,save); } }
ok(run2({steps:NEW},"rtLateDays('afternoon','lincoln',0)").v===5,"Monday Oct 12 missed → 5 days late on Saturday, as always");
ok(run2({steps:NEW,cur:{"week26_tuesday_lincoln_astep0":{done:true}}},"rtLateDays('afternoon','lincoln',0)").v===0,"done Tuesday → not late");
r=run2({steps:NEW},"_rtLogLateMiss('afternoon','lincoln',0,'wk:0','Start your laundry load',10)"); ok(r.misses.length===1&&r.misses[0][0]==="monday","the miss IS filed once the row has a past");
console.log("Last-week lookback honours from too:");
const OLD=[{label:"old Friday chore",cad:"wk:4"}];
ok(run({steps:OLD,today:"monday"},"rtLateDays('chores','lucy',0)").v===3,"an old Friday chore on Monday → 3 days late (unchanged)");
const BORN=[{label:"Friday chore born Sat",cad:"wk:4",from:"2026-10-10"}];
ok(run({steps:BORN,today:"monday"},"rtLateDays('chores','lucy',0)").v===0,"a Friday chore born Saturday → not late on Monday (last Friday was before it began)");
console.log("No from → exactly as before; unknown dates never guess:");
const PLAIN=[{label:"plain",cad:"wk:0"}];
ok(run({steps:PLAIN},"rtLateDays('afternoon','lincoln',0)").v===5,"no from: Monday missed → 5 days late on Saturday");
ok(run({steps:NEW,noDates:true},"rtLateDays('afternoon','lincoln',0)").v===0,"from set but DAY_DT not loaded → not late (never guess)");
ok(run({steps:PLAIN,noDates:true},"rtLateDays('afternoon','lincoln',0)").v===run({steps:PLAIN,noDates:true,old:true},"rtLateDays('afternoon','lincoln',0)").v,"no from, no dates → exactly the old answer");
ok(run({steps:PLAIN},"rtLateDays('afternoon','lincoln',0)").v===run({steps:PLAIN,old:true},"rtLateDays('afternoon','lincoln',0)").v,"no from → exactly the old answer");
console.log("Wiring:");
ok(/if\(!job\.from&&\/\^wk:\/\.test\(job\.cad\|\|""\)\) job\.from=_hhIsoLocal\(now\);/.test(src),"a weekday step added through an editor under Take over starts today");
ok(src.indexOf("🔀")<0,"no 🔀");
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
