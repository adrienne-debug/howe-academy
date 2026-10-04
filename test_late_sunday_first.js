/*
 * 🗓 Sunday comes first for late chores (SUNDAY_FIRST, her catch 2026-10-04).
 * Slices the REAL rtLateDays / _rtLastDueIdx / _rtDayPassed / rtDoneOnWk + the SUNDAY_FIRST block and replays
 * Sun Oct 4 2026: week26 is active (its Sunday = Oct 4, Monday = Oct 5), week25 is last week (its Sunday = Sep 27).
 * Lucy did her Fri/Sat/Sun chores on Sep 27, skipped Fri Oct 2 + Sat Oct 3 — they must show 2 and 1 days late.
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const a=src.indexOf("// SUNDAY_FIRST_START"), b=src.indexOf("// SUNDAY_FIRST_END");
if(a<0||b<0) throw new Error("SUNDAY_FIRST markers missing");
const CODE=src.slice(a,b)+"\n"+["_rtDayPassed","_rtLastDueIdx","rtLateDays","rtDoneOnWk","_prevWkKey"].concat(src.indexOf("function _rtPrevDueIdx(")>=0?["_rtPrevDueIdx"]:[]).map(slice).join("\n");

let pass=0, fail=0;
function ok(c,m){ if(c){pass++;console.log("  ok  - "+m);} else {fail++;console.log("  FAIL- "+m);} }

// Calendar for week25 (Sep 27 – Oct 3) and week26 (Oct 4 – Oct 10). Meta only dates Mon–Fri, like the live data.
const W={ week25:{monday:"2026-09-28",tuesday:"2026-09-29",wednesday:"2026-09-30",thursday:"2026-10-01",friday:"2026-10-02"},
          week26:{monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09"} };
// Lucy's chores: one per weekday, wk:0 … wk:6 (Mon … Sun), exactly as config/routines/chores/lucy.
const STEPS=[0,1,2,3,4,5,6].map(d=>({label:"chore"+d,cad:"wk:"+d}));

function run(o){
  const ctx={ DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
    RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    _todayDay:o.today, day:o.view||o.today, todayISO:o.todayISO,
    slState:o.cur||{}, prevSlState:(o.prev===undefined?{}:o.prev),
    activeWk:()=>o.wk, rtStepsFor:()=>STEPS, _loadPrevSl:()=>{},
    routineDateISO:function(dn){ return dn===o.today?o.todayISO:(W[o.wk][dn]||null); },
    out:{} };
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nfor(let i=0;i<7;i++) out[i]=rtLateDays('chores','lucy',i);",ctx);
  return ctx.out;
}
const done=(wk,dn,i)=>({[wk+"_"+dn+"_lucy_cstep"+i]:{done:true}});

console.log("Sun Oct 4 — Lucy (did Fri/Sat/Sun chores LAST Sunday Sep 27, skipped Fri Oct 2 + Sat Oct 3):");
let r=run({wk:"week26",today:"sunday",todayISO:"2026-10-04",
  prev:Object.assign({},done("week25","sunday",4),done("week25","sunday",5),done("week25","sunday",6),
    done("week25","tuesday",0),done("week25","tuesday",1),done("week25","thursday",2),done("week25","thursday",3))});
ok(r[4]===2,"Friday chore = 2 days late (was hidden) — got "+r[4]);
ok(r[5]===1,"Saturday chore = 1 day late (was hidden) — got "+r[5]);
ok(r[6]===0,"Sunday chore is due today, not late — got "+r[6]);
ok(r[0]===0&&r[1]===0&&r[2]===0&&r[3]===0,"next week's Mon–Thu chores are not late on Sunday — got "+[r[0],r[1],r[2],r[3]]);

console.log("Sun Oct 4 — Lincoln/Julian shape (nothing done last Sunday):");
r=run({wk:"week26",today:"sunday",todayISO:"2026-10-04",prev:{}});
ok(r[4]===2,"Friday chore = 2 days late (was 9) — got "+r[4]);
ok(r[5]===1,"Saturday chore = 1 day late (was 8) — got "+r[5]);

console.log("Caught up on the weekend:");
r=run({wk:"week26",today:"sunday",todayISO:"2026-10-04",prev:done("week25","saturday",4)});
ok(r[4]===0,"Friday chore done on Saturday → not late — got "+r[4]);
r=run({wk:"week26",today:"sunday",todayISO:"2026-10-04",prev:{},cur:done("week26","sunday",5)});
ok(r[5]===0,"Saturday chore done today (Sunday) → not late — got "+r[5]);

console.log("Mon Oct 5 — the Sunday chore:");
r=run({wk:"week26",today:"monday",todayISO:"2026-10-05",prev:{}});
ok(r[6]===1,"Sunday chore skipped yesterday = 1 day late — got "+r[6]);
ok(r[0]===0,"Monday chore due today, not late — got "+r[0]);
ok(r[4]===3,"Friday chore still missed = 3 days late — got "+r[4]);
r=run({wk:"week26",today:"monday",todayISO:"2026-10-05",prev:{},cur:done("week26","sunday",6)});
ok(r[6]===0,"Sunday chore done yesterday → not late — got "+r[6]);
r=run({wk:"week26",today:"monday",todayISO:"2026-10-05",prev:done("week25","sunday",6)});
ok(r[6]===1,"LAST week's Sunday (Sep 27) does not cover this Sunday (Oct 4) — got "+r[6]);

console.log("Midweek still works:");
r=run({wk:"week26",today:"wednesday",todayISO:"2026-10-07",prev:Object.assign({},done("week25","thursday",3),done("week25","friday",4))});
ok(r[1]===1&&r[0]===2,"Tue chore 1 late, Mon chore 2 late on Wednesday — got "+r[1]+","+r[0]);
ok(r[3]===0&&r[4]===0,"Thu/Fri not late yet — got "+r[3]+","+r[4]);
r=run({wk:"week26",today:"wednesday",todayISO:"2026-10-07",prev:{},cur:done("week26","tuesday",0)});
ok(r[0]===0,"Mon chore caught up Tuesday → not late — got "+r[0]);

console.log("Can't read last week → stay quiet:");
r=run({wk:"week26",today:"sunday",todayISO:"2026-10-04",prev:null});
ok(r[4]===0&&r[5]===0,"no previous-week data → 0 (never guess) — got "+r[4]+","+r[5]);

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
