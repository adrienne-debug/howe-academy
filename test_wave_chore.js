/*
 * 🙋 WAVE — "✕ today": Mom waves a kid's chore for one day (her ask 2026-10-10). Not due, not paid, not late, no "— not done",
 * the list completes without it, the kid sees a greyed row, the check-off log shows "waved", the Household numbers count it
 * as not due. Mom's Day ▸ Kids today ▸ 📋 lists is the only place with the button.               run: node test_wave_chore.js
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":""));} };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const WAVE=cut("// WAVE_START","// WAVE_END"), SUN=cut("// SUNDAY_FIRST_START","// SUNDAY_FIRST_END");
const NAMES=["_rtDayPassed","_rtLastDueIdx","_rtPrevDueIdx","_rtDueIso","_rtBeforeFrom","rtLateDays","rtDoneOnWk","_prevWkKey","rtDueOrLate","rtComplete","_rtLogLateMiss","morningDueIdx","mdSlotCounts","ckLogToday","rtSlotHTML"];
const W={sunday:"2026-10-04",monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09",saturday:"2026-10-10"};
function mk(o){
  o=o||{}; const writes=[], ls={}, misses=[];
  const steps={afternoon:{lucy:[{emoji:"🍽️",label:"Pickup kitchen",pts:20,cad:"daily"},{emoji:"",label:"shower",pts:50,cad:"wk:2,4,6"}]},chores:{lucy:[{emoji:"🛌",label:"Take sheets off beds",pts:15,cad:"wk:0"}]},morning:{lucy:[{emoji:"🦷",label:"Brush Teeth",pts:0,cad:"daily"}]},evening:{lucy:[]}};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:o.nodb?null:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p]),push:()=>({key:"k"})})}, _dryRun:o.dry?()=>true:undefined,
    DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"}, SL_STIM:{},
    _todayDay:o.today||"saturday", day:o.today||"saturday", slState:o.cur||{}, prevSlState:{}, activeWk:()=>"week26", _loadPrevSl:()=>{},
    rtStepsFor:(slot,kid)=>steps[slot][kid]||[], morningStepsFor:kid=>steps.morning[kid]||[],
    stepWindowOk:()=>true, cadDueOn:(cad,d)=>cad==="daily"||(cad.startsWith("wk:")&&cad.slice(3).split(",").indexOf(String(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].indexOf(d)))>=0),
    routineDateISO:dn=>W[dn]||null, nowTs:()=>"2:10 PM Oct 10", esc:s=>String(s==null?"":s), cap:s=>s, cadLabel:c=>c, stepWindowLabel:()=>"", mealOf:()=>"", mealOpen:()=>false, mealHeadHTML:()=>"", rtAvailable:()=>true, rtStepAvail:()=>true, rtIsOpen:()=>true, routineEditable:()=>true, routineLockNote:()=>"", rtFmtHour:h=>h, rtAfternoonHour:()=>16, rtEveningHour:()=>18, getSlot:()=>({}), rtDoneOn:(slot,kid,d,i)=>!!(o.cur&&o.cur["week26_"+d+"_"+kid+"_"+({afternoon:"a",chores:"c",evening:"e"})[slot]+"step"+i]&&o.cur["week26_"+d+"_"+kid+"_"+({afternoon:"a",chores:"c",evening:"e"})[slot]+"step"+i].done), mStepDoneOn:()=>false,
    _rtLogMiss:(kid,slot,i,dueDay)=>misses.push(dueDay), routineLog:{}, weekData:{tasks:[]}, checked:{}, histState:{}, effectiveDay:t=>t.day, _ckLogTodayTs:()=>true, _parseCheckTs:()=>new Date(),
    tab:"moms-plan", document:{getElementById:()=>({})}, renderMomsPlan:()=>{}, renderAll:()=>{}, writes, misses, ls};
  vm.createContext(ctx); vm.runInContext(SUN+"\n"+WAVE+"\n"+NAMES.map(slice).join("\n"), ctx); return ctx;
}
console.log("Wave a daily chore on Saturday");
{ const c=mk(); const st=c.rtStepsFor("afternoon","lucy")[0];
  ok("before: due, list not complete", c.rtDueOrLate("afternoon","lucy","saturday",0,st)===true&&c.rtComplete("afternoon","lucy","saturday")===false);
  c.rtWave("afternoon","lucy","saturday",0);
  ok("two targeted writes: the wave record and the log line", c.writes.length===2&&c.writes[0][1]==="waved/week26/saturday/lucy/afternoonstep0"&&c.writes[0][2].by==="mom"&&c.writes[1][1]==="routineLog/lucy/week26/saturday/wave_afternoonstep0"&&c.writes[1][2].act==="wave"&&c.writes[1][2].pts===0, c.writes);
  ok("after: not due; shower still due; the list completes without it", c.rtDueOrLate("afternoon","lucy","saturday",0,st)===false&&c.rtDueOrLate("afternoon","lucy","saturday",1,c.rtStepsFor("afternoon","lucy")[1])===true);
  ok("Kids today counts leave it out (the shower is not a Saturday chore, so 0 due)", c.mdSlotCounts("afternoon","lucy","saturday").due===0&&(()=>{ const z=mk(); return z.mdSlotCounts("afternoon","lucy","saturday").due===1; })());
  const html=c.rtSlotHTML("afternoon","lucy");
  ok("the kid sees it greyed: 'Mom waved this today', no tap, and 0/1 for the rest", /Mom waved this today/.test(html)&&/line-through/.test(html)&&/0\/1/.test(html)&&!/toggleRtStep\('afternoon','lucy',0\)/.test(html));
  ok("the check-off log shows it as waved, 0 ⭐", (()=>{ const it=c.ckLogToday().find(x=>x.kind==="wave"); return !!it&&/waved by Mom/.test(it.label)&&it.pts===0; })());
  c.writes.length=0; c.rtWave("afternoon","lucy","saturday",0);
  ok("undo: two removes, and it is due again", c.writes.length===2&&c.writes.every(w=>w[0]==="rm")&&c.rtDueOrLate("afternoon","lucy","saturday",0,st)===true, c.writes);
  ok("a waved morning step leaves the morning due index", (()=>{ c.rtWave("morning","lucy","saturday",0); return c.morningDueIdx("lucy","saturday").length===0; })());
}
console.log("Wave a weekday chore: not late later in the week, no '— not done'");
{ const c=mk({today:"wednesday"}); const st=c.rtStepsFor("chores","lucy")[0];
  ok("Monday's sheets, undone on Wednesday → 2 days late", c.rtLateDays("chores","lucy",0)===2);
  c.rtWave("chores","lucy","monday",0);
  ok("waved on Monday → not late on Wednesday", c.rtLateDays("chores","lucy",0)===0);
  c._rtLogLateMiss("chores","lucy",0,"wk:0","Take sheets off beds",15); ok("…and no miss is filed", c.misses.length===0);
  ok("still due next Monday as normal", c.rtDueOrLate("chores","lucy","monday",0,st)===false&&(()=>{ const d=mk({today:"monday"}); return d.rtDueOrLate("chores","lucy","monday",0,st)===true; })());
}
console.log("A done step cannot be waved from the panel; dry run writes nothing; the panel");
{ const c=mk({cur:{"week26_saturday_lucy_astep0":{done:true}}}); const h=c.mdKidListsHTML("lucy","saturday");
  ok("Kids today lists: ✅ for the done one with no ✕, ✕ today on the open ones, slots labelled", /✅/.test(h)&&!/rtWave\('afternoon','lucy','saturday',0\)/.test(h)&&/rtWave\('chores','lucy','saturday',0\)|rtWave\('morning','lucy','saturday',0\)/.test(h)&&/Morning<\/div>/.test(h));
  const d=mk({dry:true}); d.rtWave("afternoon","lucy","saturday",0); ok("?dryrun=1 → nothing written, waved locally", d.writes.length===0&&d.rtWaved("afternoon","lucy","saturday",0));
  const e=mk({nodb:true}); e.rtWave("afternoon","lucy","saturday",0); ok("db null → no throw", e.rtWaved("afternoon","lucy","saturday",0));
}
console.log("Wiring");
ok("📋 lists pill only on Mom's Day's card (bank, no Dad control), only when the wave code is present", /bank&&dadCtl===undefined&&typeof mpKidListsToggle==="function"/.test(src)&&/bank&&dadCtl===undefined&&typeof mdKidListsHTML==="function"&&mpKidOpen===kid/.test(src));
ok("waved listener; Household numbers skip a waved day; log card shows 🙋 waved with no dock", /db\.ref\("waved"\)\.on\("value"/.test(src)&&/S\.wave\[job\.who/.test(src)&&/i\.kind==="wave"\) h\+='<span[^>]*>🙋 waved/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
