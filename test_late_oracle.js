/*
 * 🔬 Late chores vs a real-calendar oracle (her ask 2026-10-04: "check that everything works really well").
 * Slices the REAL SUNDAY_FIRST block + _rtDayPassed / _rtLastDueIdx / _rtPrevDueIdx / rtLateDays / rtDoneOnWk /
 * rtDueOrLate / cadDueOn / _rtLogMiss / _rtLogLateMiss and replays thousands of random weekday-pinned chores,
 * random check-offs, every "today" in a week and every open tab. The oracle knows nothing about week keys or day
 * indexes — it works on real dates only:
 *   last due  = the latest date before today on a chore weekday, no earlier than last week's Sunday;
 *               a due date in LAST week doesn't count if the chore is due again today (a fresh one is due).
 *   days late = today − last due, unless it was checked off on any date from the due date through today.
 *   the miss  = filed under the week and weekday of that due date.
 * Week layout (live, de0946b): a week's Sunday is the day BEFORE its Monday. week25 = Sun Sep 27 … Sat Oct 3,
 * week26 = Sun Oct 4 … Sat Oct 10. The week meta only dates Mon–Fri.
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const a=src.indexOf("// SUNDAY_FIRST_START"), b=src.indexOf("// SUNDAY_FIRST_END");
if(a<0||b<0) throw new Error("SUNDAY_FIRST markers missing");
const CODE="const _CAD_DOW={monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6};\n"+src.slice(a,b)+"\n"+
  ["_rtDayPassed","_rtLastDueIdx","_rtPrevDueIdx","rtLateDays","rtDoneOnWk","_prevWkKey","rtDueOrLate","cadDueOn","cadDowIdx","_rtLogMiss","_rtLogLateMiss"].map(slice).join("\n");

const DN=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];      // Mon=0 … Sun=6 (cadence index)
const DAY0=Date.UTC(2026,8,27);                                                           // Sun Sep 27 = calendar day 0
const iso=n=>new Date(DAY0+n*86400000).toISOString().slice(0,10);
const dow=n=>(n+6)%7;                                                                     // calendar day → Mon=0 … Sun=6
const wkOf=n=>n<7?"week25":"week26";                                                      // days 0–6 = week25, 7–13 = week26
const META={week25:{},week26:{}}; for(let n=0;n<14;n++){ const d=dow(n); if(d<=4) META[wkOf(n)][DN[d]]=iso(n); }

// One fixed VM; each trial swaps the state it reads.
const ctx={ DAYS_ALL:DN.slice(), RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, slState:{}, prevSlState:{}, routineLog:{},
  _todayDay:"", day:"", nowTs:()=>"9:00 AM", db:null, writes:[], STEPS:[],
  activeWk:()=>"week26", rtStepsFor:()=>ctx.STEPS, _loadPrevSl:()=>{}, stepWindowOk:()=>true, DAY_DT:{}, TODAY_ISO:"" };
ctx.routineDateISO=function(dn){ return dn===ctx._todayDay?ctx.TODAY_ISO:(META.week26[dn]||null); };
ctx.cadDateNum=()=>null;
vm.createContext(ctx); vm.runInContext(CODE,ctx);

let pass=0, fail=0, shown=0;
function ok(c,m){ if(c) pass++; else { fail++; if(shown++<25) console.log("  FAIL- "+m); } }
let seed=20261004; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };

function oracle(S,done,t){
  if(!S.length) return {late:0};
  let D=-1; for(let n=t-1;n>=0;n--){ if(S.indexOf(dow(n))>=0){ D=n; break; } }
  if(D<0) return {late:0};
  if(D<7&&S.indexOf(dow(t))>=0) return {late:0};               // last week's due date, but a fresh one is due today
  for(let n=D;n<=t;n++) if(done[n]) return {late:0};
  return {late:t-D, wk:wkOf(D), dn:DN[dow(D)]};
}

const TRIALS=3000; let lateCases=0, xweek=0;
for(let tr=0;tr<TRIALS;tr++){
  const S=[]; DN.forEach((x,i)=>{ if(rnd()<0.3) S.push(i); }); if(!S.length) S.push(Math.floor(rnd()*7));
  const t=7+Math.floor(rnd()*7);                                // today: any day of week26 (Sun Oct 4 … Sat Oct 10)
  const done={}; for(let n=0;n<=t;n++) if(rnd()<0.25) done[n]=true;
  const view=DN[Math.floor(rnd()*7)];                           // whichever tab happens to be open
  const cad="wk:"+S.join(",");
  ctx.STEPS=[{label:"chore",cad:cad}];
  ctx._todayDay=DN[dow(t)]; ctx.day=view; ctx.TODAY_ISO=iso(t);
  ctx.slState={}; ctx.prevSlState={};
  for(let n=0;n<=t;n++) if(done[n]) (n<7?ctx.prevSlState:ctx.slState)[wkOf(n)+"_"+DN[dow(n)]+"_lucy_cstep0"]={done:true};
  ctx.routineLog={};
  const want=oracle(S,done,t);
  const got=vm.runInContext("rtLateDays('chores','lucy',0)",ctx);
  const tag="cad "+cad+" today "+iso(t)+" ("+DN[dow(t)]+") tab "+view+" done ["+Object.keys(done).map(n=>iso(+n).slice(5)).join(" ")+"]";
  ok(got===want.late,"late "+got+" ≠ oracle "+want.late+" — "+tag);
  // the late count never depends on the open tab
  ctx.day=DN[(DN.indexOf(view)+3)%7]; ok(vm.runInContext("rtLateDays('chores','lucy',0)",ctx)===got,"late count changed with the open tab — "+tag); ctx.day=view;
  // today's list includes a late chore whatever tab is open; no other day's list does
  DN.forEach(function(d){
    const due=vm.runInContext("rtDueOrLate('chores','lucy','"+d+"',0,STEPS[0])",ctx);
    const expect=S.indexOf(DN.indexOf(d))>=0||(d===ctx._todayDay&&want.late>0);
    ok(due===expect,"rtDueOrLate("+d+") "+due+" ≠ "+expect+" — "+tag);
  });
  // the miss record lands on the real missed day, in the right week, exactly once
  if(want.late>0){
    lateCases++; if(want.wk==="week25") xweek++;
    vm.runInContext("_rtLogLateMiss('chores','lucy',0,'"+cad+"','chore',15);_rtLogLateMiss('chores','lucy',0,'"+cad+"','chore',15);",ctx);
    const L=ctx.routineLog.lucy||{}, recs=[];
    Object.keys(L).forEach(w=>Object.keys(L[w]).forEach(d=>Object.keys(L[w][d]).forEach(k=>recs.push(w+"/"+d+"/"+k))));
    ok(recs.length===1&&recs[0]===want.wk+"/"+want.dn+"/miss_chores_0","miss filed "+JSON.stringify(recs)+" ≠ "+want.wk+"/"+want.dn+" — "+tag);
    const dueIso=iso((want.wk==="week25"?0:7)+((DN.indexOf(want.dn)+1)%7));
    ok(dueIso<iso(t),"miss filed for a day that hasn't finished — "+tag);
  }
}
// Can't read last week → never guess a cross-week late or miss
ctx.STEPS=[{label:"chore",cad:"wk:4"}]; ctx._todayDay="sunday"; ctx.day="sunday"; ctx.TODAY_ISO=iso(7); ctx.slState={}; ctx.prevSlState=null; ctx.routineLog={};
ok(vm.runInContext("rtLateDays('chores','lucy',0)",ctx)===0,"no last-week data → 0");

console.log("  "+TRIALS+" random chores × every tab ("+lateCases+" late, "+xweek+" carried from last week) checked against the calendar oracle");
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
