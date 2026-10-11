/*
 * 🧽 CLEANINGDAY — PR 4 of the Household plan (her "go" 2026-10-11, normal stars). A cleaning day pauses school exactly the way
 * a vacation with pause "school" does and the generator never sees it; "Go clean" puts the panel up without a pause; the panel
 * is that person's house rows by room with minutes, checked through the normal chore check-off.   run: node test_cleaning_day.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date()), DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()], DOW=(new Date().getDay()+6)%7;
console.log("1. The day type: a cleaning day pauses like a vacation; the generator never sees it");
{ // replay a week three ways through the real scheduleBreakToday / breakPause / activeSlots / smapIsOff
  const code=fn("calNormDate")+"\n"+fn("scheduleBreakToday")+"\n"+fn("breakPause")+"\n"+fn("activeSlots")+"\n"+fn("smapIsOff")+"\n"+fn("hhCleanDay");
  const week=["2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-17","2026-10-18"];
  const run=(cal,day)=>{ const c={SL_SLOTS:["morning","afternoon","chores","evening"],calendarData:cal,_todayStr:()=>day,console}; vm.createContext(c); vm.runInContext(code,c); return {brk:c.scheduleBreakToday(),pause:c.breakPause(),slots:c.activeSlots().join(","),off:c.smapIsOff(day)}; };
  const base={holidays:{},vacations:{}}, vac={holidays:{},vacations:{v1:{name:"Fall break",start:"2026-10-14",end:"2026-10-14"}}}, cln={holidays:{},vacations:{},cleaningDays:{"2026-10-14":{at:1,by:"mom"}}};
  let same=true, untouched=true, offSeen=false; const diffs=[];
  week.forEach(d=>{ const a=run(vac,d), b=run(cln,d), z=run(base,d);
    if(d==="2026-10-14"){ if(!(a.pause===b.pause&&a.slots===b.slots&&!!a.brk===!!b.brk&&a.brk.pause===b.brk.pause)) { same=false; diffs.push([d,a,b]); } if(b.off!==null) offSeen=true; }
    else { if(JSON.stringify(b)!==JSON.stringify(z)) { untouched=false; diffs.push([d,b,z]); } } });
  ok("on the day: pause 'school', all four routine slots, a break card — the same as the vacation", same, diffs);
  ok("every other day of the week is untouched", untouched, diffs);
  ok("smapIsOff (the generator's off-day) never sees a cleaning day", !offSeen&&run(cln,"2026-10-14").off===null);
  const r=run(cln,"2026-10-14"); ok("the break is typed 'cleaning', named, one day", r.brk.type==="cleaning"&&r.brk.name==="Cleaning day"&&r.brk.start==="2026-10-14"&&r.brk.end==="2026-10-14");
  const both={holidays:{h1:{name:"Columbus",start:"2026-10-14"}},vacations:{},cleaningDays:{"2026-10-14":{at:1}}}; ok("a holiday on the same date wins", run(both,"2026-10-14").brk.type==="holiday");
  ok("smapIsOff and _lmDayKind sources carry no cleaning reference", !/clean/i.test(fn("smapIsOff"))&&!/clean/i.test(fn("_lmDayKind")));
}
console.log("2. The switches");
const BLOCK=cut("// HOUSEHOLD_START","// CLEANINGDAY_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("_rtRotDayNum")+"\n"+fn("rtApplyRot");
function mk(o){
  o=o||{}; const writes=[], ls={}, taps=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true, calendarData:{holidays:{},vacations:{}}, calToday:()=>TODAY, kcKid:o.kcKid||"",
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{lincoln:"#123"},
    routineCfg2:{chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:"+DOW},{emoji:"🍽️",label:"Wipe table",pts:10,cad:"daily"},{emoji:"🐰",label:"Feed Sunny",pts:5,cad:"daily"},{emoji:"🛋️",label:"Fluff couch",pts:10,cad:"wk:"+((DOW+3)%7)}]},afternoon:{lincoln:[{emoji:"🧹",label:"Pickup living room",pts:20,cad:"daily"}]}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:(sl,k,d,i)=>!!(o.done&&o.done[sl+i]), mStepDoneOn:()=>false, rtLateDays:(sl,k,i)=>(o.late&&o.late[sl+i])||0, rtWaved:()=>false,
    toggleRtStep:(sl,k,i)=>taps.push([sl,k,i]), mcToggle:id=>taps.push(["mom",id]), dcToggle:id=>taps.push(["dad",id]),
    MC_DEFAULT:{}, mcDoneOn:()=>false, dcDoneOn:()=>!!o.dadDone, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",ts:1},mc_b:{label:"Vitamins",cad:"daily",ts:1}}, dadChoresData:{dc_a:{label:"Dishes",cad:"daily",ts:1}}, activeWk:()=>"week26", _todayDay:DN, _todayStr:()=>TODAY, mdTodayName:()=>DN,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>null}, writes, taps};
  vm.createContext(ctx); vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.get=expr=>vm.runInContext(expr,ctx);
  ctx.hhImport(); ctx.hhTakeover(true);
  // rooms: the vacuum and the table are kitchen, the couch is living; Sunny is animals (no room, never in the panel)
  ctx.hhSet("rt_chores_lincoln_vacuum_kitchen","room","kitchen"); ctx.hhSet("rt_chores_lincoln_wipe_table","room","kitchen"); ctx.hhSet("rt_chores_lincoln_fluff_couch","room","living"); ctx.hhSet("rt_afternoon_lincoln_pickup_living_room","room","living");
  ctx.hhSet("rt_chores_lincoln_vacuum_kitchen","minutes",15); ctx.hhSet("rt_chores_lincoln_wipe_table","minutes",3); ctx.hhSet("rt_afternoon_lincoln_pickup_living_room","minutes",5);
  ctx.writes.length=0; return ctx;
}
{ const c=mk(); ok("nothing on: no cleaning day, no Go clean", !c.hhCleanOn(TODAY)&&c.hhCleanDay(TODAY)===null);
  const on=c.hhCleanDayToggle(TODAY); ok("Cleaning day on: one targeted set under calendar/cleaningDays/<iso>", on===true&&c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="calendar/cleaningDays/"+TODAY&&c.writes[0][2].by==="mom"&&c.hhCleanOn(TODAY), c.writes);
  c.writes.length=0; c.hhCleanDayToggle(TODAY); ok("…and off again: one remove", c.writes.length===1&&c.writes[0][0]==="rm"&&c.writes[0][1]==="calendar/cleaningDays/"+TODAY&&!c.hhCleanOn(TODAY));
  c.writes.length=0; c.hhGoCleanToggle(TODAY); ok("Go clean on: one targeted set household/today/<iso>/goClean, no calendar record", c.writes.length===1&&c.writes[0][1]==="household/today/"+TODAY+"/goClean"&&c.hhGoClean(TODAY)&&c.hhCleanDay(TODAY)===null, c.writes);
  c.writes.length=0; c.hhGoCleanToggle(TODAY); ok("…off: one remove", c.writes.length===1&&c.writes[0][0]==="rm"&&!c.hhCleanOn(TODAY));
  ok("a bad date is ignored", c.hhCleanDayToggle("tomorrow")===null&&c.hhGoCleanToggle("")===null&&c.writes.length===1);
  const d=mk({noMom:true}); ok("not Mom → nothing", d.hhCleanDayToggle(TODAY)===null&&d.hhGoCleanToggle(TODAY)===null&&d.writes.length===0);
}
console.log("3. The panel");
{ const c=mk({done:{chores1:true},late:{chores3:2}}); c.hhGoCleanToggle(TODAY);
  const rows=c.hhCleanRows("lincoln",TODAY,DN);
  ok("Lincoln's house rows only, by room in walking order (living before kitchen), Sunny left out", rows.map(r=>r.label).join("|")==="Pickup living room|Fluff couch|Vacuum kitchen|Wipe table", rows.map(r=>r.label));
  ok("the couch is there because it is late (its day was three days off)", rows[1].late===true&&rows[2].late===false);
  ok("minutes: set ones and the area default; done reads the chore check-off", rows[2].mins===15&&rows[3].mins===3&&rows[0].mins===5&&rows[1].mins===10&&rows[3].done===true&&rows[2].done===false);
  ok("each check is the normal check-off: slot + kid + the step's index on that list", rows[2].on==="toggleRtStep('chores','lincoln',0)"&&rows[0].on==="toggleRtStep('afternoon','lincoln',0)");
  const h=c.hhCleanPanelHTML("lincoln",TODAY,DN);
  ok("the panel: Go clean header, 1/4 and 3 of 33 min, room headings, stars, ⏱, late", /🧽 Go clean · Lincoln/.test(h)&&/1\/4 · 3 of 33 min/.test(h)&&/🚪 Living room/.test(h)&&/🚪 Kitchen \+ dining/.test(h)&&/30 ⭐/.test(h)&&/⏱ 15 min/.test(h)&&/>late</.test(h), h.slice(0,400));
  const m=c.hhCleanRows("mom",TODAY,DN); ok("Mom's panel: her house rows via her strip's keys, checked through mcToggle; her health row left out", m.length===1&&m[0].label==="Kitchen close-down"&&m[0].on==="mcToggle('mc_a')");
  const dd=mk({dadDone:true}); dd.hhGoCleanToggle(TODAY); const dr=dd.hhCleanRows("dad",TODAY,DN); ok("Dad's: Dishes, done per his stamps, dcToggle", dr.length===1&&dr[0].done===true&&dr[0].on==="dcToggle('dc_a')");
  const e=mk({done:{chores0:true,chores1:true,chores3:true,afternoon0:true}}); e.hhCleanDayToggle(TODAY); const eh=e.hhCleanPanelHTML("lincoln",TODAY,DN); ok("all done → the thank-you line; a cleaning day header", /All done/.test(eh)&&/🧽 Cleaning day · Lincoln/.test(eh));
  c.hhLevelSetFor("lincoln",1); c.hhSet("rt_chores_lincoln_wipe_table","level",3); ok("a row above his level is not on the panel (the gate)", c.hhCleanRows("lincoln",TODAY,DN).map(r=>r.label).indexOf("Wipe table")<0);
}
console.log("4. The screens");
{ const c=mk({kcKid:"lincoln"}); c.hhCleanDayToggle(TODAY); const card=c.hhCleanCardHTML();
  ok("the day card on a kid's device: paused, their panel, Mom's undo button", /School is paused today/.test(card)&&/🧽 Cleaning day · Lincoln/.test(card)&&/Not a cleaning day after all/.test(card));
  const home=c.hhCleanHomeHTML(TODAY,DN); ok("Home Base on a cleaning day: the state, back-to-normal, Mom's own panel", /Cleaning day — school is paused/.test(home)&&/back to normal/.test(home)&&/🧽 Cleaning day · Mom/.test(home));
  c.hhCleanDayToggle(TODAY); const h2=c.hhCleanHomeHTML(TODAY,DN); ok("a normal day: 'Everyone go clean?' with both switches, no panel", /Everyone go clean\?/.test(h2)&&/hhGoCleanToggle/.test(h2)&&/hhCleanDayToggle/.test(h2)&&!/· Mom/.test(h2));
  ok("the editor section lists the day with a remove and an add-by-date", (()=>{ c.hhCleanDayToggle("2026-11-07"); const e=c.hhCleanDaysEditorHTML(); return /2026-11-07/.test(e)&&/hhCleanDayToggle\('2026-11-07'\)/.test(e)&&/hh-cd-date/.test(e); })());
  const k=mk({noMom:true}); ok("a kid's device: no switches, no banner button, no undo", k.hhCleanHomeHTML(TODAY,DN)===""&&k.hhCleanDayBtnHTML(DN)===""&&!/Not a cleaning day/.test(k.hhCleanCardHTML()));
}
console.log("5. Wiring");
ok("scheduleBreakToday returns the cleaning day after holidays and vacations", /scan\(calendarData\.vacations,"vacation"\)\n\s*\|\|\(\(typeof hhCleanDay==="function"&&hhCleanDay\(ds\)\)\?\{name:"Cleaning day",type:"cleaning",start:ds,end:ds,pause:"school"\}:null\);/.test(src));
ok("the Schedule shows the cleaning card instead of the no-school card", /el\.innerHTML=\(_brk\.type==="cleaning"&&typeof hhCleanCardHTML==="function"\)\?hhCleanCardHTML\(\):renderScheduleBreakCard\(_brk\);/.test(src));
ok("the banner button sits beside Kid Off", /Kid Off<\/button>':''\)\+\n\s*\(typeof hhCleanDayBtnHTML==="function"\?hhCleanDayBtnHTML\(day\):''\)\+/.test(src));
ok("the panel on the kid's Day page, the Skylight list, Kids' Corner, Dad's Day and Home Base", [/hhCleanOn\(_todayStr\(\)\)\)\{ try\{ h\+=hhCleanPanelHTML\(kid,_todayStr\(\),day\);/, /h2\+=hhCleanPanelHTML\(kid,_todayStr\(\),day\);/, /h\+=hhCleanPanelHTML\(k,_todayStr\(\),_todayDay\);/, /hhCleanPanelHTML\("dad",iso,dn\)/, /try\{ h\+=hhCleanHomeHTML\(iso,today\); \}catch\(e\)\{\}/].every(r=>r.test(src)));
ok("the afternoon list opens while a switch is on, today only", /function rtAvailable\(slot,kid,d\)\{ if\(slot==="afternoon"\) return rtAlwaysOpen\(d\)\|\|\(d===_todayDay&&typeof hhCleanOn==="function"&&hhCleanOn\(_todayStr\(\)\)\)\|\|rtSchoolworkDone\(kid,d\)/.test(src));
{ const c={_todayDay:"monday",_todayStr:()=>"2026-10-12",rtAlwaysOpen:()=>false,rtSchoolworkDone:()=>false,rtAfternoonHour:()=>99,rtEveningHour:()=>99,hhCleanOn:()=>true,Date}; vm.createContext(c); vm.runInContext(fn("rtAvailable"),c);
  ok("…afternoon today opens; evening keeps its hour; another day unchanged", c.rtAvailable("afternoon","lincoln","monday")===true&&c.rtAvailable("evening","lincoln","monday")===false&&c.rtAvailable("afternoon","lincoln","tuesday")===true);
  c.hhCleanOn=()=>false; ok("…and stays shut without a switch", c.rtAvailable("afternoon","lincoln","monday")===false); }
ok("the calendar: month colouring, the day sheet line, the breaks list, the CSS", /cls\+=" cleanday";/.test(src)&&/b\.kind==="cleaning"\?"\\u\{1F9FD\} "/.test(src)&&/kind:"cleaning",name:"Cleaning day"/.test(src)&&/\.gcal-month-day\.cleanday\{/.test(src)&&/h\+=hhCleanDaysEditorHTML\(\);/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
