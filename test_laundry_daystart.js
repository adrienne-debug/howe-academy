/*
 * ⏱ LL_DAYSTART (Adrienne's "all yeses" 2026-11-02). Replays Kenzie's Monday 11/2 (DeWalt): her routine ticked by Mom at 8:19
 * except the line's "Start your laundry: Boys' Clothes"; at 9:17 Mom tapped 🫧 Start on that load right after the girls' load went
 * in, the line ticked her row (auto, 0 ⭐) and finished her Morning list — but no dayStart was recorded, because only the hand
 * tick (toggleMorningStep) called dsAutoStart. Now the line's tick that finishes the Morning list starts the day the same way.
 * run: node test_laundry_daystart.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-11-02", WK="week5";
// Her real Morning rows 11/2 (config/routines/morning, Kenzie's): 0–8; the line appends row 9.
const MORNING=["Brush teeth","Make bed","Get dressed","Brush hair","Set table","Clear table","Wipe table","Sweep","Bring laundry to the laundry room"].map(l=>({label:l,pts:0,cad:"daily"}));
const LINE={caps:{"0":2},asOf:MON,homeFrom:MON,mode:"home",items:{girls:{label:"Girls’ Clothes",emoji:"👕",order:0,doer:"ana"},boys:{label:"Boys’ Clothes",emoji:"👕",order:1,home:0,doer:"ben"}}};
function mk(o){
  o=o||{}; const writes=[], ls={}, starts=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>true, _kioskD:()=>false, laundryData:{}, calDateForWeekDay:d=>d==="monday"?MON:null, day:"monday", _todayDay:"monday", tab:"moms-plan", renderAll:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["ana","ben"], KID_NAME:{ana:"Ana",ben:"Ben"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes, starts,
    slState:{}, activeWk:()=>WK, nowTs:()=>"09:17 AM Nov 2", RT_ABBR:{afternoon:"a"},
    slBefore:()=>{ const b={}; Object.keys(ctx.slState).forEach(k=>{ b[k]=JSON.stringify(ctx.slState[k]); }); return b; },
    slSaveChanged:()=>{ ctx.saves=(ctx.saves||0)+1; }, rtComplete:()=>false,
    dayStarts:{}, dsAutoStart:kid=>{ starts.push(kid); if(!(ctx.dayStarts.monday&&ctx.dayStarts.monday[kid])){ ctx.dayStarts.monday=ctx.dayStarts.monday||{}; ctx.dayStarts.monday[kid]="9:17 AM"; } },
    _dryRun:()=>!!o.dry};
  ctx.rtStepsFor=(sl,kid,raw,dn)=>{ const base=sl==="morning"?MORNING:[]; return raw?base:ctx.llRtSteps(sl,kid,base,dn||"monday"); };
  ctx.morningComplete=(kid,d)=>ctx.rtStepsFor("morning",kid,false,d).every((s,i)=>{ const v=ctx.slState[WK+"_"+d+"_"+kid+"_mstep"+i]; return !!(v&&v.done); });
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+MON+"'; }; llNowMin=function(){ return 557; };",ctx);
  vm.runInContext("laundryLine="+JSON.stringify(o.line||LINE)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const tickRoutine=(c,kid,n)=>{ for(let i=0;i<n;i++) c.slState[WK+"_monday_"+kid+"_mstep"+i]={done:true,ts:"08:19 AM Nov 2",pts:0,by:"mom"}; };

console.log("1. Kenzie's Monday: rows 0–8 ticked by Mom, the girls' load in, then Mom's 🫧 Start on Boys’ Clothes");
{ const c=mk(); tickRoutine(c,"ben",9);
  ok("her Morning list is rows 0–8 + 9 = Start your laundry: Boys’ Clothes", c.rtStepsFor("morning","ben",false,"monday")[9].label==="Start your laundry: Boys’ Clothes");
  ok("…not finished yet (the laundry row holds it)", !c.morningComplete("ben","monday"));
  c.llStart("girls","ana"); ok("the girls' load going in starts nobody's day for her", c.starts.indexOf("ben")<0);
  c.llStart("boys");
  ok("Mom's 🫧 Start ticks her row itself (auto, 0 ⭐)", c.slState[WK+"_monday_ben_mstep9"]&&c.slState[WK+"_monday_ben_mstep9"].auto==="line"&&c.slState[WK+"_monday_ben_mstep9"].pts===0);
  ok("…the Morning flag flips done", c.slState[WK+"_monday_ben_morning"].done===true);
  ok("…and her day starts (dsAutoStart, once)", c.starts.filter(k=>k==="ben").length===1&&c.dayStarts.monday.ben==="9:17 AM", c.starts);
  c.get("llSyncKidRows()"); ok("another sync later: no second start", c.starts.filter(k=>k==="ben").length===1);
}
console.log("2. When it must not start the day");
{ const c=mk(); tickRoutine(c,"ben",8); c.llStart("boys");
  ok("a routine row still open: the laundry tick finishes nothing, no day start", !(c.slState[WK+"_monday_ben_morning"]||{}).done&&c.slState[WK+"_monday_ben_mstep9"].auto==="line"&&c.starts.length===0);
  const d=mk({dry:true}); tickRoutine(d,"ben",9); d.llStart("boys");
  ok("dry run: the list still ticks, but no day start is written", d.slState[WK+"_monday_ben_morning"].done===true&&d.starts.length===0);
  const e=mk(); tickRoutine(e,"ben",9); e.slState[WK+"_monday_ben_morning"]={done:true,ts:"08:19 AM Nov 2"}; e.llStart("boys");
  ok("Morning already marked done before the tick: no flip, no start", e.starts.length===0);
  const f=mk(); tickRoutine(f,"ben",9); f.dayStarts.monday={ben:"8:20 AM"}; f.llStart("boys");
  ok("a start already set stays (dsAutoStart never moves it)", f.dayStarts.monday.ben==="8:20 AM");
}
console.log("3. Wiring");
{ const S=fn("llSyncKidRows");
  ok("llSyncKidRows calls dsAutoStart on the Morning flip only, today's list, not in a dry run", /if\(p\[0\]==="morning"&&done&&!\(fc&&fc\.done\)&&typeof dsAutoStart==="function"&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\) dsAutoStart\(kid\);/.test(S));
  ok("the hand tick's own call is unchanged", /if\(allDone&&!\(_prevSlot&&_prevSlot\.done\)&&day===_todayDay&&typeof dsAutoStart==="function"\) dsAutoStart\(kid\);/.test(src));
}
console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
