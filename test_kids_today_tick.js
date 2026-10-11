/*
 * ✅ KIDTICK — the ☐ on Mom's Day ▸ Kids today is the kid's own check-off (her ask 2026-10-11: "check off things but don't make
 * anything bigger"). Same stars, same log; the day is the row's day; Mom's tap passes the hour lock.   run: node test_kids_today_tick.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
function mk(o){
  o=o||{}; const calls=[], ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    momHere:()=>!o.noMom, ROSTER:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    day:"monday", _todayDay:"saturday", document:{getElementById:()=>({})}, renderMomsPlan:()=>calls.push(["render"]),
    toggleRtStep:(sl,k,i)=>calls.push(["rt",sl,k,i,vm.runInContext("day",ctx),vm.runInContext("_rtMomTick",ctx)]), toggleMorningStep:(k,i)=>calls.push(["mr",k,i,vm.runInContext("day",ctx),vm.runInContext("_rtMomTick",ctx)]),
    morningStepsFor:()=>[{label:"Brush teeth",cad:"daily"}], rtStepsFor:(sl,k)=>sl==="afternoon"?[{emoji:"🍽️",label:"Pickup kitchen",cad:"daily"}]:[], rtWaved:()=>false, stepWindowOk:()=>true, cadDueOn:()=>true, rtDueOrLate:()=>true, mStepDoneOn:()=>!!o.mrDone, rtDoneOn:()=>!!o.rtDone, esc:s=>String(s), calls};
  vm.createContext(ctx); vm.runInContext("let _rtMomTick=false;\n"+fn("mdKidTick")+"\n"+fn("mdKidListsHTML"),ctx); ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
console.log("The tap");
{ const c=mk(); const h=c.mdKidListsHTML("lucy","saturday");
  ok("every open row's ☐ is a tap with the row's slot, kid, day and index; nothing else grew", /onclick="event\.stopPropagation\(\);mdKidTick\('afternoon','lucy','saturday',0\)"[^>]*>☐</.test(h)&&/mdKidTick\('morning','lucy','saturday',0\)/.test(h)&&/rtWave\('afternoon','lucy','saturday',0\)/.test(h));
  ok("…and a done row's ✅ is a tap too (undo)", /mdKidTick\('afternoon','lucy','saturday',0\)"[^>]*>✅</.test(mk({rtDone:true}).mdKidListsHTML("lucy","saturday")));
  const r=c.mdKidTick("afternoon","lucy","saturday",0);
  ok("the tap runs the kid's own check-off with the day set to the row's day and the Mom flag up, then puts the day back and the flag down", r===true&&c.calls[0][0]==="rt"&&c.calls[0][1]==="afternoon"&&c.calls[0][2]==="lucy"&&c.calls[0][3]===0&&c.calls[0][4]==="saturday"&&c.calls[0][5]===true&&c.get("day")==="monday"&&c.get("_rtMomTick")===false, c.calls);
  ok("it re-renders Mom's Day", c.calls.some(x=>x[0]==="render"));
  c.calls.length=0; c.mdKidTick("morning","lucy","saturday",0); ok("a morning row uses the morning check-off", c.calls[0][0]==="mr"&&c.calls[0][1]==="lucy"&&c.calls[0][3]==="saturday"&&c.calls[0][4]===true);
  ok("bad slot / kid / index → nothing", c.mdKidTick("lunch","lucy","saturday",0)===false&&c.mdKidTick("chores","nana","saturday",0)===false&&c.mdKidTick("chores","lucy","saturday","x")===false);
  const k=mk({noMom:true}); ok("not Mom → nothing runs", k.mdKidTick("afternoon","lucy","saturday",0)===false&&k.calls.length===0);
}
console.log("The lock");
{ const T=fn("toggleRtStep"); const toasts=[];
  const run=(flag,avail)=>{ const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,_rtMomTick:flag,rtStepAvail:()=>avail,rtAvailable:()=>avail,rtStepsFor:()=>[{label:"Pickup kitchen",pts:20,cad:"daily"}],mealOf:()=>"",gwShowToast:m=>toasts.push(m),rtFmtHour:h=>h+":00",rtAfternoonHour:()=>16,rtEveningHour:()=>18,routineEditable:()=>true,_rtBlockedToast:()=>{},activeWk:()=>"week26",day:"saturday",RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},slState:{},zoneBonusFor:()=>0,choreVerifyOn:()=>false,bankDirect:()=>"bid1",bankDirectRemove:()=>{},nowTs:()=>"9:00 AM",rlogAppend:()=>{},laundryKidHook:()=>{},rtComplete:()=>false,rtBonusSettle:()=>{},rtDayBonusSettle:()=>{},rtOpen:{},rtOpenKey:()=>"k",rtDueOrLate:()=>true,sv:()=>{},db:null,obNoteSl:()=>{},renderAll:()=>{},mealCfg:()=>({}),mealHour:()=>12,renderSkylight:()=>{},tab:"moms-plan",document:{getElementById:()=>null},renderSchedule:()=>{}};
    vm.createContext(ctx); vm.runInContext(T,ctx); vm.runInContext('toggleRtStep("afternoon","lucy",0)',ctx); return ctx.slState["week26_saturday_lucy_astep0"]; };
  ok("a kid's tap before the afternoon opens: held (toast, no check)", run(false,false)===undefined&&/Afternoon unlocks/.test(toasts[0]));
  ok("Mom's tap from Kids today passes the lock: the step checks", (()=>{ const s=run(true,false); return s&&s.done===true; })());
  ok("with the slot open nothing changed", (()=>{ const s=run(false,true); return s&&s.done===true; })());
  ok("the gate line keeps its shape for the meal-jobs test", /rtStepAvail\(slot,kid,day,rtStepsFor\(slot,kid\)\[i\]\):rtAvailable\(slot,kid,day\)\)\)\{/.test(src));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
