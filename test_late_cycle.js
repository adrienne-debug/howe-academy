/*
 * 🗓 LATE_CYCLE (her report 2026-10-12, DeWalt Taylor): a 4-week-cycle chore is never "late" for a day in one of its OFF weeks.
 * Live case: Mon Oct 12 = kitchen week (cycle wk 2, week 1 started Mon Oct 5). Taylor's Tue/Wed/Thu kitchen chores read
 * "5 days late" and "— not done" was filed under last week (living-room week) — they were never due then.
 * Slices the REAL stepCycleOk / _rtOffCycle / rtLateDays / _rtLogLateMiss.
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const a=src.indexOf("// SUNDAY_FIRST_START"), b=src.indexOf("// SUNDAY_FIRST_END");
const CODE=(a>=0&&b>a?src.slice(a,b):"")+"\n"+["_rtDayPassed","_rtLastDueIdx","_rtPrevDueIdx","_rtPos","_rtIdx","stepCycleOk","_rtOffCycle","rtLateDays","rtDoneOnWk","_prevWkKey","_rtLogMiss","_rtLogLateMiss"].map(slice).join("\n");
let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log("  ok  - "+m);} else {fail++;console.log("  FAIL- "+m);} }
// DeWalt weeks: week1 = Oct 5–11 (living, cycle wk 1), week2 = Oct 12–18 (kitchen, cycle wk 2)
const W={ week1:{sunday:"2026-10-04",monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09",saturday:"2026-10-10"},
          week2:{sunday:"2026-10-11",monday:"2026-10-12",tuesday:"2026-10-13",wednesday:"2026-10-14",thursday:"2026-10-15",friday:"2026-10-16",saturday:"2026-10-17"},
          week3:{sunday:"2026-10-18",monday:"2026-10-19",tuesday:"2026-10-20",wednesday:"2026-10-21",thursday:"2026-10-22",friday:"2026-10-23",saturday:"2026-10-24"} };
const CYC={cycW:2,cycN:4,cycStart:"2026-10-05"};
// Taylor's real list shape: 0 Mon living · 1 Wed living · 2 Thu living · 3 Mon kitchen · 4 Tue kitchen · 5 Wed kitchen · 6 Thu kitchen · 7 a plain weekly Wed chore (no cycle)
const STEPS=[ {label:"Dust TV stand",cad:"wk:0",cycW:1,cycN:4,cycStart:"2026-10-05"}, {label:"Wipe down door",cad:"wk:2",cycW:1,cycN:4,cycStart:"2026-10-05"}, {label:"Sweep porch",cad:"wk:3",cycW:1,cycN:4,cycStart:"2026-10-05"},
  Object.assign({label:"Organize pantry",cad:"wk:0"},CYC), Object.assign({label:"Clean microwave",cad:"wk:1"},CYC), Object.assign({label:"Organize pantry",cad:"wk:2"},CYC), Object.assign({label:"Organize pantry",cad:"wk:3"},CYC),
  {label:"Plain weekly",cad:"wk:2"} ];
function run(o){
  const writes=[];
  const ctx={ DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    _todayDay:o.today, day:o.today, slState:o.sl||{}, prevSlState:o.psl||{}, activeWk:()=>o.wk, rtStepsFor:()=>STEPS, _loadPrevSl:()=>{},
    routineDateISO:dn=>(W[o.wk][dn]||null), routineLog:{}, nowTs:()=>"3:19 PM", Date:Date, DAY_DT:{},
    db:{ref:p=>({set:v=>writes.push(p)})}, late:null };
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nlate={};"+o.steps.map(i=>"late["+i+"]=rtLateDays('chores','taylor',"+i+"); if(late["+i+"]>0) _rtLogLateMiss('chores','taylor',"+i+",'"+STEPS[i].cad+"','"+STEPS[i].label+"',15);").join(""),ctx);
  return {late:ctx.late, writes};
}
console.log("Mon Oct 12 (week2, kitchen week) — nothing checked last week for the kitchen chores:");
let r=run({wk:"week2",today:"monday",steps:[3,4,5,6]});
ok(r.late[3]===0,"Mon 'Organize pantry' is due today, not late — got "+r.late[3]);
ok(r.late[4]===0,"Tue 'Clean microwave' not late (last week was living-room week) — got "+r.late[4]);
ok(r.late[5]===0,"Wed 'Organize pantry' not late — got "+r.late[5]);
ok(r.late[6]===0,"Thu 'Organize pantry' not late — got "+r.late[6]);
ok(r.writes.length===0,"no '— not done' filed under last week — got "+r.writes.length+" writes");
console.log("Same day — last week's living-room chores were all checked (Taylor did them):");
r=run({wk:"week2",today:"monday",steps:[0,1,2],psl:{week1_monday_taylor_cstep0:{done:true},week1_wednesday_taylor_cstep1:{done:true},week1_thursday_taylor_cstep2:{done:true}}});
ok(r.late[0]===0&&r.late[1]===0&&r.late[2]===0,"living-room chores not late");
console.log("Mon Oct 19 (week3, bathroom week) — living-room chores undone last week? Last week was KITCHEN week, so still not late:");
r=run({wk:"week3",today:"monday",steps:[1,2]});
ok(r.late[1]===0&&r.late[2]===0,"wk-1 chores never late during wk 3 for a wk-2 lookback — got "+r.late[1]+","+r.late[2]);
console.log("Wed Oct 14 (kitchen week) — Mon 'Organize pantry' skipped this week → still counts late (on-cycle week):");
r=run({wk:"week2",today:"wednesday",steps:[3]});
ok(r.late[3]===2,"Mon kitchen chore unchecked by Wed = 2 days late — got "+r.late[3]);
ok(r.writes.indexOf("routineLog/taylor/week2/monday/miss_chores_3")>=0,"miss filed under this week's Monday");
console.log("Plain weekly chore (no cycle) unchanged — Mon Oct 12, last Wed undone:");
r=run({wk:"week2",today:"monday",steps:[7]});
ok(r.late[7]===5,"plain Wed chore undone last week = 5 days late — got "+r.late[7]);
ok(r.writes.indexOf("routineLog/taylor/week1/wednesday/miss_chores_7")>=0,"its miss still files under last week's Wednesday");
console.log("Mon Oct 12 — cycle step but the date map is missing → behaves exactly as before the fix:");
{ const o={wk:"week2",today:"monday",steps:[5]}; const saveW=W.week2; W.week2={}; r=run(o); W.week2=saveW;
  ok(r.late[5]===5,"unknown dates: no guess — the old answer stands until the date map arrives (5) — got "+r.late[5]); }
console.log(pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
