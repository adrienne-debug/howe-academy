// 🆕 New-family week + pace (her catch 2026-10-03 on Dewalt): no week built → the current week is the plan week
// for today, not the "week3" placeholder; "expected" = lessons planned BEFORE today; Howe's sessions seed Howe only.
// Run: node test_new_family_week.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const sl=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice "+a); return src.slice(i,j); };
const cwnSrc=sl("function currWeekNum(){","\n// Get curriculum-based expected count");
const todSrc=sl("// PACE_TODATE_START","// PACE_TODATE_END");
const expSrc=sl("function currExpected(kid,subjectKey,weekNum){","\n// PACE_TODATE_START");
// A Dewalt-shaped plan: Wk 1 = Mon 10/5 … Fri 10/9, Wk 2 = 10/12 …, one lesson per school day
function plan(){
  const weekDays={taylor:{}}, lessons={taylor:{}}; let d=1;
  for(let w=1;w<=3;w++){ weekDays.taylor["Wk "+w]=[]; for(let i=0;i<5;i++){
    const dt=new Date(2026,9,5+(w-1)*7+i), ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
    weekDays.taylor["Wk "+w].push(d); lessons.taylor[d]={date:ds,saxon:"Lesson "+(25+d),week:"Wk "+w}; d++; } }
  return {weekDays,lessons,subjects:{taylor:{saxon:{total:105}}}};
}
function env(o){
  const currData=o.currData||plan();
  const cum={taylor:{saxon:{}}}; let c=0; for(let w=1;w<=3;w++){ c+=5; cum.taylor.saxon[w]=c; }
  const ranges=w=>{ const ds=currData.weekDays.taylor["Wk "+w]; if(!ds) return null; return {start:currData.lessons.taylor[ds[0]].date,end:currData.lessons.taylor[ds[4]].date}; };
  const ctx={WK:o.WK||"week3", HA_LS:{getItem:k=>k==="ha_active_wk"?(o.stored||null):null}, currData, currPaceCum:cum,
    _activeWeekEmpty:()=>!!o.empty, _todayStr:()=>o.today,
    _firstPlanWeekOnOrAfter:t=>{ for(let w=1;w<=3;w++){ const r=ranges(w); if(r.end>=t) return w; } return null; },
    smapIsKidOff:()=>false, schedOvKidOff:()=>false, schedOv:()=>null, coopBlocksBase:()=>false};
  const names=Object.keys(ctx);
  const f=new Function(...names, cwnSrc+"\n"+expSrc+"\n"+todSrc+";return {currWeekNum,currExpected,currExpectedToDate};");
  return f(...names.map(n=>ctx[n]));
}
// A — the placeholder
let e=env({empty:true,stored:null,today:"2026-10-03"});
ok(e.currWeekNum()===1,"no week built, Sat before Wk 1 → current week is 1 (not the week3 placeholder)");
ok(env({empty:true,stored:null,today:"2026-10-13"}).currWeekNum()===2,"no week built, a Tuesday in Wk 2 → 2");
ok(env({empty:false,stored:"week25",WK:"week25",today:"2026-10-03"}).currWeekNum()===25,"a built week (Howe) → WK number, unchanged");
ok(env({empty:true,stored:"week25",WK:"week25",today:"2026-10-03"}).currWeekNum()===25,"stored active week but tasks still loading → WK number, unchanged");
// B — expected = planned before today
ok(e.currExpectedToDate("taylor","saxon")===0,"Sat before Wk 1: nothing expected → nothing behind");
ok(env({empty:true,today:"2026-10-05"}).currExpectedToDate("taylor","saxon")===0,"Mon of Wk 1: today's lesson not owed yet → 0");
ok(env({empty:true,today:"2026-10-07"}).currExpectedToDate("taylor","saxon")===2,"Wed of Wk 1: Mon+Tue expected → 2 (week rule said 5)");
ok(env({empty:false,stored:"week2",WK:"week2",today:"2026-10-11"}).currExpectedToDate("taylor","saxon")===5,"Sun after Wk 1 with Wk 2 built: 5 (week rule said 10)");
ok(e.currExpectedToDate("taylor","nope")===null,"subject with no plan → null (old fallback kept)");
const und=plan(); delete und.lessons.taylor[1].date;
ok(env({empty:false,stored:"week2",WK:"week2",today:"2026-10-11",currData:und}).currExpectedToDate("taylor","saxon")===10,"undated plan → keeps the week rule");
// call sites
ok((src.match(/currExpectedToDate\((kid|k),sk\)/g)||[]).length===2,"Mom's Day chip + Settings pace line both use the before-today rule");
// C — Howe sessions seed Howe only
ok(src.includes("if(!hasSavedPlans&&HA_IS_HOWE) Object.entries(PACE_DEFAULT_PLANS)"),"Howe's sessions seed only Howe");
if(fail){console.log(fail+" failed");process.exit(1);} console.log("all passed");
