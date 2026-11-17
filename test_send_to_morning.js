/*
 * 🌅 SENDAM — "🌅 AM": Mom sends a kid's unfinished afternoon / chores / evening item to their NEXT MORNING list (her ask
 * 2026-11-15), where it holds the schedule until done — and the check-off made there is the ORIGINAL chore's own check-off
 * ("make sure that it's also connected to its completed history … no issues with it not looking done"): the day it was due
 * reads done, the late ledger clears, the Click-off Log and the Household history count it, the stars are paid once.
 *                                                                                              run: node test_send_to_morning.js
 */
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":""));} };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const AM=cut("// SENDAM_START","// SENDAM_END"), WAVE=cut("// WAVE_START","// WAVE_END"), SUN=cut("// SUNDAY_FIRST_START","// SUNDAY_FIRST_END");
const NAMES=["morningDueIdx","mStepDoneOn","morningComplete","toggleMorningStep","mrIndividualHTML","rtDoneOn","rtDueOrLate","rtComplete","toggleRtStep","rtLateDays","rtDoneOnWk","_prevWkKey",
  "_rtDayPassed","_rtLastDueIdx","_rtPrevDueIdx","_rtDueIso","_rtBeforeFrom","_rtLogLateMiss","mdLateDays","mdSlotCounts","rtSlotHTML","slBefore","slSaveChanged","rlogAppend","boardStatPop","boardStatPopClose","kr2WaveBtnHTML","ckLogToday",
  "hhLogState","_hhCount","_hhIsoLocal","_hhDayNum","_hhIsoOf","_hhNorm"];
const WK32={sunday:"2026-11-15",monday:"2026-11-16",tuesday:"2026-11-17",wednesday:"2026-11-18",thursday:"2026-11-19",friday:"2026-11-20",saturday:"2026-11-21"};
const WK33={sunday:"2026-11-22",monday:"2026-11-23",tuesday:"2026-11-24",wednesday:"2026-11-25",thursday:"2026-11-26",friday:"2026-11-27",saturday:"2026-11-28"};
const STEPS=()=>({
  morning:{lucy:[{emoji:"🦷",label:"Brush Teeth",pts:0,cad:"daily"}],ellis:[]},
  afternoon:{lucy:[{emoji:"🍽️",label:"Pickup kitchen",pts:20,cad:"daily"}]},
  chores:{lucy:[{emoji:"🧹",label:"Wipe table",pts:15,cad:"daily"},{emoji:"🛌",label:"Take sheets off beds",pts:20,cad:"wk:0"},{emoji:"🧺",label:"Fold a load",pts:5,cad:"daily",line:"towels"},{emoji:"🍽️",label:"Clear supper",pts:5,cad:"daily",meal:"supper"},{emoji:"🦎",label:"Lizard poop",pts:5,cad:"asneeded"}]},
  evening:{lucy:[{emoji:"🚿",label:"Shower",pts:10,cad:"daily"}]}});
function mk(o){
  o=o||{}; const writes=[], ls={}, bank=[], unbank=[], starts=[], toasts=[], W=o.W||WK32, wk=o.wk||"week32"; let n=0;
  if(o.am) ls.ha_amcarry=JSON.stringify(o.am);
  const ref=p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p]),update:v=>writes.push(["upd",p,JSON.parse(JSON.stringify(v))]),push:()=>({key:"k"+(++n)})});
  const steps=STEPS();
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:o.nodb?null:{ref}, _dryRun:o.dry?()=>true:()=>false,
    DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"}, SL_STIM:{}, ROSTER:["lucy","ellis"],
    _todayDay:o.today||"monday", day:o.day||o.today||"monday", slState:o.cur||{}, prevSlState:o.prev===undefined?{}:o.prev, activeWk:()=>wk, _loadPrevSl:()=>{},
    rtStepsFor:(slot,kid)=>(steps[slot]&&steps[slot][kid])||[], morningStepsFor:kid=>steps.morning[kid]||[],
    stepWindowOk:()=>true, cadDueOn:(cad,d)=>cad==="daily"||(cad.startsWith("wk:")&&cad.slice(3).split(",").indexOf(String(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].indexOf(d)))>=0),
    routineDateISO:dn=>W[dn]||null, nowTs:()=>"7:40 AM Nov 17", esc:s=>String(s==null?"":s), cap:s=>s.charAt(0).toUpperCase()+s.slice(1), cadLabel:c=>c, stepWindowLabel:()=>"", mealOf:(slot,st)=>(st&&st.meal)||"", mealOpen:()=>true, mealHeadHTML:()=>"", mealCfg:()=>({breakfastGate:true}),
    rtAvailable:()=>true, rtStepAvail:()=>true, rtIsOpen:()=>true, rtOpen:{}, rtOpenKey:(s,k)=>s+k, routineEditable:()=>o.kidOtherDay?false:true, _rtBlockedToast:()=>toasts.push("blocked"), routineLockNote:()=>"", rtFmtHour:h=>h, rtAfternoonHour:()=>16, rtEveningHour:()=>18,
    gateClockHeld:()=>false, gateStartMin:()=>600, fromMin:m=>m, getSlot:()=>({done:false,ts:""}), toggleMrOpen:()=>{}, mrOpen:{},
    momHere:()=>o.kid?false:true, dadAwardOk:()=>!!o.dad, _spBy:()=>o.kid?null:"mom", momModeActive:!o.kid,
    bankDirect:(kid,pts,note,hold)=>{ const id="bd"+(bank.length+1); bank.push({id,kid,pts,note}); return id; }, bankDirectRemove:(kid,id)=>unbank.push(id), zoneBonusFor:()=>0, choreVerifyOn:()=>false,
    rtBonusSettle:()=>{}, rtDayBonusSettle:()=>{}, dsAutoStart:kid=>starts.push(kid), obSet:(p,v)=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]), obNoteSl:()=>{}, sv:()=>{},
    routineLog:o.log||{}, weekData:{tasks:[]}, checked:{}, histState:{}, effectiveDay:t=>t.day, _ckLogTodayTs:()=>true, _parseCheckTs:()=>new Date(),
    gwShowToast:m=>toasts.push(m), renderSkylight:()=>{}, renderSchedule:()=>{}, renderAllSoon:()=>{},
    tab:"moms-plan", document:{getElementById:()=>null,body:{insertAdjacentHTML:(p,h)=>{ ctx.popHTML=h; }}}, renderMomsPlan:()=>{}, renderAll:()=>{}, writes, ls, bank, unbank, starts, toasts};
  vm.createContext(ctx);
  vm.runInContext("const _HH_DN=[\"sunday\",\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\"]; let _hhLogCache=null;\n"+SUN+"\n"+WAVE+"\n"+AM+"\n"+NAMES.map(slice).join("\n")+"\nthis.amCarryOf=()=>amCarry; this.setDay=d=>{ day=d; }; this.getDay=()=>day;", ctx);
  return ctx;
}
const ID="2026-11-16_cstep0";   // Monday's "Wipe table"
const sent=()=>({lucy:{[ID]:{slot:"chores",i:0,label:"Wipe table",emoji:"🧹",pts:15,fromIso:"2026-11-16",fromWk:"week32",fromDay:"monday",dueIso:"2026-11-17",ts:"8:30 PM Nov 16",at:1,by:"mom"}}});
const brushed=d=>({["week32_"+d+"_lucy_mstep0"]:{done:true,ts:"x"}});

console.log("Monday night: Mom sends an unfinished chore to the next morning");
{ const c=mk({today:"monday"});
  ok("🌅 AM on the row → true", c.amSend("chores","lucy","monday",0)===true);
  ok("two targeted writes: the carry (dated, due the next calendar day) and one log line (act \"am\", 0 ⭐)", c.writes.length===2&&c.writes[0][0]==="set"&&c.writes[0][1]==="amCarry/lucy/"+ID&&c.writes[0][2].dueIso==="2026-11-17"&&c.writes[0][2].fromWk==="week32"&&c.writes[0][2].fromDay==="monday"&&c.writes[0][2].pts===15&&c.writes[0][2].label==="Wipe table"&&c.writes[0][2].by==="mom"
    &&c.writes[1][1]==="routineLog/lucy/week32/monday/am_cstep0"&&c.writes[1][2].act==="am"&&c.writes[1][2].pts===0&&/sent to the next morning by Mom/.test(c.writes[1][2].label), c.writes);
  ok("Monday's own list is untouched: the row is still due, the list still open, Monday's morning not held", c.rtDueOrLate("chores","lucy","monday",0,c.rtStepsFor("chores","lucy")[0])===true&&c.rtComplete("chores","lucy","monday")===false&&c.amBlocks("lucy","monday")===false);
  ok("the kid's Monday row says where it went", /on your next morning list/.test(c.rtSlotHTML("chores","lucy")));
  c.writes.length=0;
  ok("a second tap takes it back: two removes, nothing left", c.amSend("chores","lucy","monday",0)===true&&c.writes.length===2&&c.writes.every(w=>w[0]==="rm")&&c.writes[0][1]==="amCarry/lucy/"+ID&&c.writes[1][1]==="routineLog/lucy/week32/monday/am_cstep0"&&!c.amGet("lucy","chores",0,"2026-11-16"), c.writes);
  const k=mk({today:"monday",kid:true}); ok("a kid's device can't send (Mom, or an unlocked Dad)", k.amSend("chores","lucy","monday",0)===false&&k.writes.length===0&&mk({today:"monday",kid:true,dad:true}).amSend("chores","lucy","monday",0)===true);
  const x=mk({today:"monday",cur:{"week32_monday_lucy_cstep0":{done:true}}});
  ok("can't send: a done row, a meal job, a laundry-line row, an as-needed row, a waved row", x.amSend("chores","lucy","monday",0)===false&&x.amSend("chores","lucy","monday",3)===false&&x.amSend("chores","lucy","monday",2)===false&&x.amSend("chores","lucy","monday",4)===false&&(()=>{ x.rtWave("evening","lucy","monday",0); x.writes.length=0; return x.amSend("evening","lucy","monday",0)===false&&x.writes.length===0; })());
}
console.log("Tuesday morning: it sits on the Morning list and holds the schedule");
{ const c=mk({today:"tuesday",am:sent(),cur:brushed("tuesday")});
  ok("every morning step is done, but the list is not complete while the carried one is open", c.mStepDoneOn("lucy","tuesday",0)===true&&c.morningComplete("lucy","tuesday")===false&&c.amBlocks("lucy","tuesday")===true);
  ok("the schedule gate asks morningComplete", /return morningComplete\(kidFilter, viewDay\);/.test(slice("isScheduleUnlocked"))&&/SL_KIDS\.every\(k => morningComplete\(k, viewDay\)\)/.test(slice("isScheduleUnlocked")));
  const h=c.mrIndividualHTML("lucy");
  ok("the kid sees it first: 'Left over — finish these first', the chore, where it came from, its stars, 1/2", /Left over — finish these first/.test(h)&&/Wipe table/.test(h)&&/from Mon · Chores/.test(h)&&/\+15 ⭐/.test(h)&&/1\/2/.test(h)&&h.indexOf("Left over")<h.indexOf("Brush Teeth")&&/amToggle\('lucy','2026-11-16_cstep0'\)/.test(h)&&/Finish all to unlock your schedule/.test(h), h.slice(0,300));
  ok("Monday's morning is not held after the fact, and another kid is not held", c.amBlocks("lucy","monday")===false&&c.amBlocks("ellis","tuesday")===false);
  ok("Mom's Day counts: Tuesday's Chores are what they would be anyway (a daily: Tuesday has its own row, Monday's is not listed twice)", c.mdSlotCounts("chores","lucy","tuesday").due===mk({today:"tuesday"}).mdSlotCounts("chores","lucy","tuesday").due);
}
console.log("The check-off on the morning list IS the chore's own check-off (one fact, three writes)");
{ const c=mk({today:"tuesday",am:sent(),cur:Object.assign(brushed("tuesday"),{"week32_monday_lucy_cstep1":{done:true,ts:"x"},"week32_monday_lucy_cstep2":{done:true,ts:"x"},"week32_monday_lucy_cstep3":{done:true,ts:"x"}}),
    log:{lucy:{week32:{monday:{a:{label:"Take sheets off beds",slot:"chores",act:"on",at:new Date("2026-11-16T15:00:00").getTime()},a2:{label:"Fold a load",slot:"chores",act:"on",at:new Date("2026-11-16T15:02:00").getTime()},b:{label:"Pickup kitchen",slot:"afternoon",act:"on",at:new Date("2026-11-16T15:05:00").getTime()}}}}}});
  c.amToggle("lucy",ID);
  ok("stars paid once, the chore's own, in the bank with where it came from", c.bank.length===1&&c.bank[0].pts===15&&/Wipe table \(from Mon\)/.test(c.bank[0].note), c.bank);
  const wDone=c.writes.find(w=>w[1]==="amCarry/lucy/"+ID+"/done"), wSl=c.writes.find(w=>w[0]==="upd"&&w[1]==="week32/sl"), wLog=c.writes.find(w=>/^routineLog\/lucy\/week32\/monday\/k/.test(w[1]));
  ok("(1) the carry is done", !!wDone&&wDone[2].iso==="2026-11-17"&&wDone[2].src==="am"&&wDone[2].pts===15&&wDone[2].bid==="bd1", wDone);
  ok("(2) MONDAY's own check-off is written — done, stars + bank id, marked as done the next morning", !!wSl&&wSl[2]["week32_monday_lucy_cstep0"]&&wSl[2]["week32_monday_lucy_cstep0"].done===true&&wSl[2]["week32_monday_lucy_cstep0"].pts===15&&wSl[2]["week32_monday_lucy_cstep0"].bid==="bd1"&&wSl[2]["week32_monday_lucy_cstep0"].am==="2026-11-17", wSl);
  ok("…so Monday's row and Monday's whole Chores list read done (the light, the list record)", c.rtDoneOn("chores","lucy","monday",0)===true&&c.rtComplete("chores","lucy","monday")===true&&wSl[2]["week32_monday_lucy_chores"]&&wSl[2]["week32_monday_lucy_chores"].done===true);
  ok("(3) a history line under MONDAY with the chore's own slot + label", !!wLog&&wLog[2].label==="Wipe table"&&wLog[2].slot==="chores"&&wLog[2].act==="on"&&wLog[2].pts===15&&wLog[2].am==="2026-11-17", wLog);
  ok("…which the Household history reads as Monday's chore done", (()=>{ const S=c.hhLogState(); const st=S.state["lucy|chores|wipe table|2026-11-16"]; return !!st&&st.act==="on"; })());
  ok("the Morning list completes: gate open, list record written, the kid's day starts once", c.morningComplete("lucy","tuesday")===true&&wSl[2]["week32_tuesday_lucy_morning"]&&wSl[2]["week32_tuesday_lucy_morning"].done===true&&c.starts.length===1&&c.starts[0]==="lucy");
  ok("the finished list folds shut reading 2/2, unlocked; opened again, the carried row is still there, ticked", (()=>{ const h=c.mrIndividualHTML("lucy"); c.mrOpen.lucy=true; const h2=c.mrIndividualHTML("lucy"); return /2\/2/.test(h)&&/Schedule unlocked/.test(h)&&!/Wipe table/.test(h)&&/mr-step done" onclick="amToggle\('lucy','2026-11-16_cstep0'\)/.test(h2); })());
  ok("🧾 Today's check-offs shows it today, pointing at Monday's line (so −100 docks the real record)", (()=>{ const it=c.ckLogToday().find(x=>/Wipe table/.test(x.label)); return !!it&&it.kind==="step"&&/^week32\/monday\/k/.test(it.ref)&&it.pts===15; })(), c.ckLogToday());
  // un-check
  c.writes.length=0; c.amToggle("lucy",ID);
  const uSl=c.writes.find(w=>w[0]==="upd"&&w[1]==="week32/sl"), uLog=c.writes.find(w=>/^routineLog\/lucy\/week32\/monday\/k/.test(w[1]));
  ok("un-check reverses all three and the exact bank entry", c.unbank.length===1&&c.unbank[0]==="bd1"&&c.writes.some(w=>w[0]==="rm"&&w[1]==="amCarry/lucy/"+ID+"/done")&&uSl&&uSl[2]["week32_monday_lucy_cstep0"].done===false&&uLog&&uLog[2].act==="off"&&c.rtDoneOn("chores","lucy","monday",0)===false&&c.morningComplete("lucy","tuesday")===false, c.writes);
  ok("…and the Household history follows (latest line wins)", (()=>{ c.routineLog.lucy.week32.monday[Object.keys(c.routineLog.lucy.week32.monday).pop()].at+=5; const st=c.hhLogState().state["lucy|chores|wipe table|2026-11-16"]; return !!st&&st.act==="off"; })());
}
console.log("The original row and the carry never disagree");
{ const c=mk({today:"monday"}); c.amSend("chores","lucy","monday",0); c.writes.length=0;
  c.toggleRtStep("chores","lucy",0);
  ok("the kid does it Monday night on its own list → the carry closes (no second payment)", c.bank.length===1&&c.writes.some(w=>w[1]==="amCarry/lucy/"+ID+"/done"&&w[2].src==="list"&&w[2].iso==="2026-11-16")&&c.amCarryOf().lucy[ID].done.src==="list");
  const t=mk({today:"tuesday",am:c.amCarryOf(),cur:brushed("tuesday")});
  ok("…so Tuesday's Morning list never shows it and the gate is open", t.amFor("lucy","tuesday").length===0&&t.morningComplete("lucy","tuesday")===true&&!/Left over/.test(t.mrIndividualHTML("lucy")));
  c.writes.length=0; c.toggleRtStep("chores","lucy",0);
  ok("un-ticking the original row re-opens the carry", c.writes.some(w=>w[0]==="rm"&&w[1]==="amCarry/lucy/"+ID+"/done")&&!c.amCarryOf().lucy[ID].done);
  const s=mk({today:"tuesday",am:sent(),cur:Object.assign(brushed("tuesday"),{"week32_monday_lucy_cstep0":{done:true,ts:"x",pts:15,bid:"old"}})});
  s.amToggle("lucy",ID);
  ok("a carry whose original row is already ticked just closes — nothing is paid twice, no extra history line", s.bank.length===0&&s.writes.some(w=>w[1]==="amCarry/lucy/"+ID+"/done"&&w[2].src==="list")&&!s.writes.some(w=>/^routineLog/.test(w[1]))&&s.morningComplete("lucy","tuesday")===true, s.writes);
  s.writes.length=0; s.amToggle("lucy",ID);
  ok("…and it can't be un-checked from the morning row (it was checked on its own list)", s.writes.length===0&&s.toasts.some(m=>/un-check it there/.test(m)));
  const m=mk({today:"tuesday",am:sent(),cur:brushed("tuesday")}); m.amToggle("lucy",ID); m.writes.length=0; m.setDay("monday"); m.toggleRtStep("chores","lucy",0); m.setDay("tuesday");
  ok("Mom un-ticks Monday's row after it was done on the morning list → the payment reverses once and the carry re-opens", m.unbank.length===1&&m.unbank[0]==="bd1"&&!m.amCarryOf().lucy[ID].done&&m.morningComplete("lucy","tuesday")===false, m.writes);
}
console.log("It waits until it is done");
{ const c=mk({today:"wednesday",am:sent(),cur:brushed("wednesday")});
  ok("not done Tuesday → still first on Wednesday's Morning list, still holding", c.amFor("lucy","wednesday").length===1&&c.morningComplete("lucy","wednesday")===false);
  ok("a kid can't tick it from another day's tab", (()=>{ const k=mk({today:"wednesday",am:sent(),kid:true,kidOtherDay:true,day:"tuesday"}); k.amToggle("lucy",ID); return k.bank.length===0&&k.writes.length===0&&k.toasts[0]==="blocked"; })());
  const d=mk({today:"wednesday",am:(()=>{ const a=sent(); a.lucy[ID].done={iso:"2026-11-17",ts:"x",at:2,pts:15,bid:"b",src:"am"}; return a; })(),cur:brushed("wednesday")});
  ok("done Tuesday → gone from Wednesday's list; Tuesday's tab still shows it ticked", d.amFor("lucy","wednesday").length===0&&d.morningComplete("lucy","wednesday")===true&&d.amFor("lucy","tuesday").length===1&&d.amDoneBy(d.amFor("lucy","tuesday")[0],"2026-11-17")===true);
}
console.log("A late weekday chore: on the morning list, not ALSO late on its own list");
{ const c=mk({today:"wednesday"});
  ok("Monday's sheets, undone on Wednesday → 2 days late, counted in Wednesday's Chores", c.rtLateDays("chores","lucy",1)===2&&c.mdSlotCounts("chores","lucy","wednesday").due===4);
  c.amSend("chores","lucy","wednesday",1);
  ok("sent from Wednesday's pop-up → no longer late there, Wednesday's Chores count drops it", c.rtLateDays("chores","lucy",1)===0&&c.mdSlotCounts("chores","lucy","wednesday").due===3&&c.amCarryOf().lucy["2026-11-18_cstep1"].dueIso==="2026-11-19");
  const t=mk({today:"thursday",am:c.amCarryOf(),cur:brushed("thursday")});
  ok("Thursday: on the Morning list, not late on Chores", t.amFor("lucy","thursday").length===1&&t.rtLateDays("chores","lucy",1)===0);
  t.amToggle("lucy","2026-11-18_cstep1");
  ok("done Thursday morning → Wednesday's check-off is written, and it stays not-late", t.rtDoneOn("chores","lucy","wednesday",1)===true&&t.rtLateDays("chores","lucy",1)===0&&t.bank[0].pts===20);
  c.amSend("chores","lucy","wednesday",1);
  ok("taken back → late again", c.rtLateDays("chores","lucy",1)===2);
}
console.log("Across the week flip: Saturday night → Sunday morning of the new week");
{ const a=mk({today:"saturday"}); a.amSend("evening","lucy","saturday",0);
  ok("Saturday's shower is due Sunday the 22nd", a.amCarryOf().lucy["2026-11-21_estep0"].dueIso==="2026-11-22");
  const c=mk({today:"sunday",W:WK33,wk:"week33",am:a.amCarryOf(),cur:{"week33_sunday_lucy_mstep0":{done:true}},prev:{}});
  ok("it is on Sunday's Morning list in the new week", c.amFor("lucy","sunday").length===1&&c.morningComplete("lucy","sunday")===false);
  c.amToggle("lucy","2026-11-21_estep0");
  ok("the check-off is ONE targeted write into LAST week's record, and the history line files under last week's Saturday", c.writes.some(w=>w[0]==="set"&&w[1]==="week32/sl/week32_saturday_lucy_estep0"&&w[2].done===true&&w[2].pts===10&&w[2].am==="2026-11-22")&&c.writes.some(w=>/^routineLog\/lucy\/week32\/saturday\/k/.test(w[1])&&w[2].act==="on"&&w[2].label==="Shower")&&c.prevSlState["week32_saturday_lucy_estep0"].done===true&&c.morningComplete("lucy","sunday")===true, c.writes);
  ok("this week's check-marks get only this week's keys", (()=>{ const u=c.writes.find(w=>w[0]==="upd"&&w[1]==="week33/sl"); return !!u&&Object.keys(u[2]).every(k=>/^week33_/.test(k)); })());
}
console.log("Send all · sent from an earlier day · Mom's tick · take off");
{ const c=mk({today:"monday",cur:{"week32_monday_lucy_astep0":{done:true}}});
  ok("what Send all would send: every open sendable row of the three lists (not the done one, the meal job, the laundry row, the as-needed)", JSON.stringify(c.amRest("lucy","monday"))===JSON.stringify([{slot:"chores",i:0},{slot:"chores",i:1},{slot:"evening",i:0}]), c.amRest("lucy","monday"));
  ok("Send all → 3 sent, and nothing left to send", c.amSendRest("lucy","monday")===3&&c.amRest("lucy","monday").length===0&&Object.keys(c.amCarryOf().lucy).length===3&&c.toasts.some(m=>/3 things on Lucy's next morning list/.test(m)));
  const t=mk({today:"tuesday",cur:Object.assign(brushed("tuesday"),{"week32_tuesday_lucy_morning":{done:true,ts:"x"}})});
  t.amSend("chores","lucy","monday",0);
  ok("Mom sends Monday's leftover on Tuesday (from Monday's pop-up) → it is on THIS morning's list and the finished Morning re-opens", t.amBlocks("lucy","tuesday")===true&&t.writes.some(w=>w[0]==="upd"&&w[1]==="week32/sl"&&w[2]["week32_tuesday_lucy_morning"]&&w[2]["week32_tuesday_lucy_morning"].done===false), t.writes);
  t.setDay("wednesday"); t.amMomTick("lucy",ID,"tuesday");
  ok("Mom's ✓ done on the Morning pop-up is the same check-off, made on that row's day, and her own tab is put back", t.amCarryOf().lucy[ID].done.iso==="2026-11-17"&&t.amCarryOf().lucy[ID].done.by==="mom"&&t.rtDoneOn("chores","lucy","monday",0)===true&&t.getDay()==="wednesday");
  ok("a done one can't be taken off (un-check it first)", t.amTakeBack("lucy",ID)===false);
  const o=mk({today:"tuesday",am:sent(),cur:brushed("tuesday")}); o.writes.length=0;
  ok("✕ take off on the Morning pop-up removes the carry and its log line, and the gate opens", o.amTakeBack("lucy",ID)===true&&o.writes.some(w=>w[0]==="rm"&&w[1]==="amCarry/lucy/"+ID)&&o.writes.some(w=>w[0]==="rm"&&w[1]==="routineLog/lucy/week32/monday/am_cstep0")&&o.morningComplete("lucy","tuesday")===true&&o.starts.length===1, o.writes);
}
console.log("The pop-up buttons; dry run writes nothing");
{ const c=mk({today:"monday"});
  const b=c.amPopBtnsHTML({i:0,done:false,wv:false},"chores","lucy","monday",true);
  ok("an open Chores row gets 🌅 AM → amSend with that row's slot, kid, day, index, then the pop-up redraws", /amSend\('chores','lucy','monday',0\);boardStatPop\('lucy','chores','monday'\)/.test(b)&&/🌅 AM</.test(b), b);
  ok("no button: a done row, a waved row, a meal job, a kid's view, the Morning list's own steps", c.amPopBtnsHTML({i:0,done:true},"chores","lucy","monday",true)===""&&c.amPopBtnsHTML({i:0,wv:true},"chores","lucy","monday",true)===""&&c.amPopBtnsHTML({i:3},"chores","lucy","monday",true)===""&&c.amPopBtnsHTML({i:0},"chores","lucy","monday",false)===""&&c.amPopBtnsHTML({i:0},"morning","lucy","monday",true)==="");
  c.amSend("chores","lucy","monday",0);
  ok("once sent the button shows ✓", /🌅 AM ✓</.test(c.amPopBtnsHTML({i:0,done:false},"chores","lucy","monday",true)));
  ok("the foot of the pop-up offers the rest, counted across the three lists", /Send all 3 unfinished to the next morning/.test(c.amPopFootHTML("lucy","chores","monday"))&&/amSendRest\('lucy','monday'\);boardStatPop\('lucy','chores','monday'\)/.test(c.amPopFootHTML("lucy","chores","monday"))&&c.amPopFootHTML("lucy","morning","monday")==="");
  const t=mk({today:"tuesday",am:sent(),cur:brushed("tuesday")}); t.boardStatPop("lucy","morning","tuesday");
  ok("Mom's 🌅 Morning pop-up lists the carried row first, 1/2, with ✓ done and ✕ take off", /Wipe table — from Mon Chores/.test(t.popHTML)&&/\(1\/2\)/.test(t.popHTML)&&/amMomTick\('lucy','2026-11-16_cstep0','tuesday'\)/.test(t.popHTML)&&/amTakeBack\('lucy','2026-11-16_cstep0'\)/.test(t.popHTML)&&t.popHTML.indexOf("Wipe table")<t.popHTML.indexOf("Brush Teeth"), t.popHTML.slice(0,200));
  const p=mk({today:"monday"}); p.boardStatPop("lucy","chores","monday");
  ok("Mom's 🧹 Chores pop-up: ✕ today is still there, 🌅 AM beside it, Send all underneath", /rtWave\('chores','lucy','monday',0\)/.test(p.popHTML)&&/amSend\('chores','lucy','monday',0\)/.test(p.popHTML)&&/Send all 4 unfinished/.test(p.popHTML)&&!/amSend\('chores','lucy','monday',2\)/.test(p.popHTML)&&!/amSend\('chores','lucy','monday',3\)/.test(p.popHTML));
  const g=mk({today:"tuesday",am:{ellis:{"2026-11-16_estep0":{slot:"evening",i:0,label:"Shower",emoji:"🚿",pts:10,fromIso:"2026-11-16",fromWk:"week32",fromDay:"monday",dueIso:"2026-11-17",ts:"x",at:1,by:"mom"}}}});
  ok("a kid with no morning steps (the single Morning box) still sees what was sent, above the box, and is held", (()=>{ const h=g.mrIndividualHTML("ellis"); return /Left over/.test(h)&&/Shower/.test(h)&&/toggleSlot\('ellis','morning'\)/.test(h)&&h.indexOf("Shower")<h.indexOf("toggleSlot")&&g.morningComplete("ellis","tuesday")===false; })());
  const d=mk({today:"monday",dry:true}); d.amSend("chores","lucy","monday",0);
  ok("?dryrun=1 → nothing written, held locally", d.writes.length===0&&!!d.amGet("lucy","chores",0,"2026-11-16"));
  const e=mk({today:"monday",nodb:true}); ok("db null → no throw", e.amSend("chores","lucy","monday",0)===true&&!!e.amGet("lucy","chores",0,"2026-11-16"));
  ok("a device with nothing sent pays nothing for this: no carries → morningComplete as before", (()=>{ const z=mk({today:"tuesday",cur:brushed("tuesday")}); return z.amBlocks("lucy","tuesday")===false&&z.morningComplete("lucy","tuesday")===true&&!/Left over/.test(z.mrIndividualHTML("lucy"))&&/1\/1/.test(z.mrIndividualHTML("lucy")); })());
}
console.log("Wiring");
ok("morningComplete asks amBlocks first; toggleRtStep tells the carry; the late ledger asks amCovers for this week and last", /function morningComplete\(kid,d\)\{\n  if\(typeof amBlocks==="function"&&amBlocks\(kid,d\)\) return false;/.test(src)&&/amSourceSync\(slot,kid,day,i,now\)/.test(slice("toggleRtStep"))&&/amCovers\(kid,slot,i,amIso\(DAYS_ALL\[due\]\)\)/.test(slice("rtLateDays"))&&/amCovers\(kid,slot,i,amIso\(DAYS_ALL\[pd\],true\)\)/.test(slice("rtLateDays")));
ok("Kids today row + Kids' Corner points card count carried rows; the pop-up carries the buttons and the foot", /mT\+=_a\.length; _a\.forEach\(it=>\{ if\(amDoneBy\(it,_ai\)\) mD\+\+; \}\);/.test(slice("mdCardKidsToday"))&&/total:due\.length\+_am\.length/.test(slice("kcPointsHTML"))&&/amPopBtnsHTML\(r,slot,kid,_d,_tapOk\)/.test(slice("boardStatPop"))&&/amPopFootHTML\(kid,slot,_d\)/.test(slice("boardStatPop")));
ok("one listener per kid by key (old finished ones never load); the Click-off Log marks sent lines and morning-list check-offs", /if\(typeof amAttach==="function"\) amAttach\(\);/.test(src)&&/db\.ref\("amCarry\/"\+kid\)\.orderByKey\(\)\.startAt\(cut\)\.on\("value"/.test(src)&&/e\.act==="am"\?"🌅"/.test(src)&&/done on the morning list/.test(src));
ok("no whole-node write: every amCarry write names a kid and an id", !/db\.ref\("amCarry"\)\.(set|update|remove)/.test(src)&&!/db\.ref\("amCarry\/"\+kid\)\.(set|update|remove)/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
