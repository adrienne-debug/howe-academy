/*
 * 📝 Last week's missed chores reach the Click-off Log (LATE_XWEEK, her ask 2026-10-04).
 * Slices the REAL _rtLogLateMiss / _rtLogMiss / rtLateDays. Live case: Lucy skipped Fri Oct 2 + Sat Oct 3 (week25);
 * on Sun Oct 4 (week26) they show late but no "— not done" was ever filed — only same-week misses were logged.
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const a=src.indexOf("// SUNDAY_FIRST_START"), b=src.indexOf("// SUNDAY_FIRST_END");
const CODE=src.slice(a,b)+"\n"+["_rtDayPassed","_rtLastDueIdx","_rtPrevDueIdx","rtLateDays","rtDoneOnWk","_prevWkKey","_rtLogMiss","_rtLogLateMiss"].map(slice).join("\n");
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log("  ok  - "+m);} else {fail++;console.log("  FAIL- "+m);} }
const W={ week25:{monday:"2026-09-28",tuesday:"2026-09-29",wednesday:"2026-09-30",thursday:"2026-10-01",friday:"2026-10-02"},
          week26:{monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09"} };
const STEPS=[0,1,2,3,4,5,6].map(d=>({label:"chore"+d,cad:"wk:"+d}));
function run(o){
  const writes=[];
  const ctx={ DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    _todayDay:o.today, day:o.today, slState:{}, prevSlState:{}, activeWk:()=>o.wk, rtStepsFor:()=>STEPS, _loadPrevSl:()=>{},
    routineDateISO:dn=>dn===o.today?o.iso:(W[o.wk][dn]||null), routineLog:o.log||{}, nowTs:()=>"10:00 AM", Date:Date,
    db:{ref:p=>({set:v=>writes.push(p)})}, out:null };
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nout=[];"+o.steps.map(i=>"if(rtLateDays('chores','lucy',"+i+")>0) _rtLogLateMiss('chores','lucy',"+i+",'wk:"+i+"','chore"+i+"',15);").join("")+"out=routineLog;",ctx);
  return {log:ctx.out, writes};
}
console.log("Sun Oct 4 (week26) — Lucy's Fri + Sat chores undone:");
let r=run({wk:"week26",today:"sunday",iso:"2026-10-04",steps:[4,5]});
ok(r.writes.indexOf("routineLog/lucy/week25/friday/miss_chores_4")>=0,"Friday's miss filed under week25 / friday");
ok(r.writes.indexOf("routineLog/lucy/week25/saturday/miss_chores_5")>=0,"Saturday's miss filed under week25 / saturday");
ok(!r.log.lucy.week26,"nothing filed against the new week (no days of it have been missed)");
ok(r.log.lucy.week25.friday.miss_chores_4.missed===true&&r.log.lucy.week25.friday.miss_chores_4.label==="chore4 — not done","record is a normal '— not done' miss");
console.log("Already recorded → no second write:");
r=run({wk:"week26",today:"sunday",iso:"2026-10-04",steps:[4],log:{lucy:{week25:{friday:{miss_chores_4:{act:"miss"}}}}}});
ok(r.writes.length===0,"existing miss is not rewritten — got "+r.writes.length+" writes");
console.log("Same-week misses unchanged:");
r=run({wk:"week25",today:"thursday",iso:"2026-10-01",steps:[2]});
ok(r.writes.indexOf("routineLog/lucy/week25/wednesday/miss_chores_2")>=0,"Wednesday's miss on Thursday → week25 / wednesday");
console.log("Mon Oct 5 — Sunday chore missed yesterday:");
r=run({wk:"week26",today:"monday",iso:"2026-10-05",steps:[6]});
ok(r.writes.indexOf("routineLog/lucy/week26/sunday/miss_chores_6")>=0,"filed under week26 / sunday (Oct 4, the Sunday that was missed)");
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
