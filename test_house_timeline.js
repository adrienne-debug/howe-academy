/*
 * 🏡 HOUSECARDS — house work on the timelines (PR 5; her "go" 2026-10-11, the derived card). Kids: a trailing "🏡 House" card
 * drawn from their house rows after the last laid card, never written into the week. Mom: her house rows as Mom blocks the
 * Mom loop steps over (Now / After <card> / Later / Not now), ✓ Done = her strip's check.   run: node test_house_timeline.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date()), DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()], DOW=(new Date().getDay()+6)%7;
const H=(h,m)=>h*60+(m||0);
const HH=cut("// HOUSEHOLD_START","// HOUSECARDS_END"), CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("_rtRotDayNum")+"\n"+fn("rtApplyRot");
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END"), MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END"), MP=cut("// MEALPREP_BLOCK_START","// MEALPREP_BLOCK_END");
const LTIMES=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
function mk(o){
  o=o||{}; const writes=[], ls={}, taps=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true, calendarData:{holidays:{},vacations:{}}, calToday:()=>TODAY, kcKid:"", checked:o.checked||{}, momMoves:{},
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, LAUNDRY_STAGES:["washer","dryer","fold"], laundryData:{},
    routineCfg2:{chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:"+DOW},{emoji:"🍽️",label:"Wipe table",pts:10,cad:"daily"},{emoji:"🐰",label:"Feed Sunny",pts:5,cad:"daily"}]},afternoon:{lincoln:[{emoji:"🧹",label:"Pickup living room",pts:20,cad:"daily"}]}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:(sl,k,d,i)=>!!(o.done&&o.done[sl+i]), mStepDoneOn:()=>false, rtLateDays:()=>0, rtWaved:()=>false,
    toggleRtStep:(sl,k,i)=>taps.push([sl,k,i]), mcToggle:id=>taps.push(["mom",id]), dcToggle:id=>taps.push(["dad",id]),
    MC_DEFAULT:{}, mcDoneOn:(d,id)=>!!(o.momDone&&o.momDone[id]), dcDoneOn:()=>false, gbList:()=>[], getActiveTasks:()=>o.tasks||[], morningComplete:()=>true, bbActive:()=>null, adminPinUnlocked:true, famIsMomCard:()=>false, taskCard:t=>'', _agLunchRow:()=>null,
    routineLog:{}, momdayData:o.momday||{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",ts:1},mc_b:{label:"Vitamins",cad:"daily",ts:1}}, dadChoresData:{}, activeWk:()=>"week26", _todayStr:()=>TODAY, mdTodayName:()=>DN,
    coSchoolEnd:()=>H(16,15), calDateForWeekDay:d=>TODAY, gwParseDate:s=>{ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); },
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, inputs:{}, writes, taps, tab:"schedule", kid:"mom", day:DN};
  ctx.document={getElementById:id=>ctx.inputs[id]||null}; ctx._mlNowOverride=o.nowMin!=null?o.nowMin:H(10); ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>DN});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+LTIMES+"\n"+MS+"\n"+MP+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+HH, ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:["lucy","ellis","lincoln","julian"]})+";",ctx);   // the ring as the meal-prep replay has it
  ctx.get=e=>vm.runInContext(e,ctx);
  ctx.hhImport(); ctx.hhTakeover(true);
  ctx.hhSet("rt_chores_lincoln_vacuum_kitchen","room","kitchen"); ctx.hhSet("rt_chores_lincoln_vacuum_kitchen","minutes",15); ctx.hhSet("rt_chores_lincoln_wipe_table","minutes",5); ctx.hhSet("rt_afternoon_lincoln_pickup_living_room","room","living"); ctx.hhSet("rt_afternoon_lincoln_pickup_living_room","minutes",5);
  ctx.hhSet("mc_mc_a","minutes",20); ctx.hhSet("mc_mc_a","room","kitchen");
  ctx.writes.length=0; return ctx;
}
let ID=0; const card=(who,time,dur,mom,title)=>({id:who+"_"+(ID++),who,day:DN,mom:mom||"none",time,dur:dur||20,title:title||(who+" card")});
console.log("1. The kid's card — derived, after the last laid card");
{ const c=mk(); const tasks=[card("lincoln","2:00 PM",30),card("lucy","5:00 PM",30)]; const before=JSON.stringify(tasks);
  const I=c.hhHouseCardInfo("lincoln",DN,tasks);
  ok("Lincoln: three house rows (Sunny is animals), 25 min, at school end (his last card ends 2:30)", I&&I.n===3&&I.mins===25&&I.at===H(16,15)&&I.title==="Pickup living room|Vacuum kitchen|Wipe table".replace(/\|/g," + "), I&&[I.n,I.mins,I.at,I.title]);
  const I2=c.hhHouseCardInfo("lincoln",DN,[card("lincoln","4:30 PM",20)]); ok("…or after his last card when that runs past school end (4:50)", I2.at===H(16,50));
  ok("nothing for Mom / all / a kid with no house rows", c.hhHouseCardInfo("mom",DN,tasks)===null&&c.hhHouseCardInfo("all",DN,tasks)===null&&c.hhHouseCardInfo("lucy",DN,tasks)===null);
  const h=c.hhHouseCardHTML("lincoln",DN,tasks);
  ok("the card: a time row at 4:15 PM, 🏡 House + the jobs, 25 min · 0/3 done, folded", /time-pill">4:15 PM</.test(h)&&/🏡 House · Pickup living room \+ Vacuum kitchen \+ Wipe table/.test(h)&&/25 min · 0\/3 done · after school ▸/.test(h)&&!/🧽 House/.test(h));
  c.hhHouseCardToggle("lincoln"); const h2=c.hhHouseCardHTML("lincoln",DN,tasks); ok("a tap unfolds the house panel (titled House) with the normal check-offs", /🧽 House · Lincoln/.test(h2)&&/toggleRtStep\('chores','lincoln',0\)/.test(h2)&&/after school ▾/.test(h2));
  const d=mk({done:{afternoon0:true,chores0:true,chores1:true}}); const hd=d.hhHouseCardHTML("lincoln",DN,tasks); ok("all rows checked → the card reads done on its own", /✓ 🏡 House/.test(hd)&&/3\/3 done/.test(hd)&&d.hhHouseCardInfo("lincoln",DN,tasks).done===true);
  ok("the week's tasks are untouched and nothing was written", JSON.stringify(tasks)===before&&c.writes.length===0);
  const B=cut("// HOUSECARDS_START","// HOUSECARDS_END"); ok("the block never touches week data or the generator", !/weekData|week\w*\/tasks|gwCommit|runGenerateWeek|seGuardWeek/.test(B)&&(B.match(/db\.ref\(/g)||[]).length===2);
  c.hhSet("rt_chores_lincoln_wipe_table","level",3); ok("a row above his level is not on the card (the gate)", c.hhHouseCardInfo("lincoln",DN,tasks).n===2);
}
console.log("2. Mom's house blocks");
{ const c=mk(); const t=c.hhHouseToday(); ok("Mom's house rows today: Kitchen close-down (20 min), no block yet", t.length===1&&t[0].r.label==="Kitchen close-down"&&t[0].r.mins===20&&t[0].rec===null);
  ok("no block picked → nothing holds her time", c.hhHouseBlocksOpen().length===0);
  const rec=c.hhHouseBlockSet("mc_mc_a","now"); ok("Now: one targeted set of momBlocks/<today>/hh_mc_mc_a, kind house, from her tap (10:00), 20 min", rec&&rec.kind==="house"&&rec.at==="now"&&rec.startMin===H(10)&&rec.mins===20&&c.writes.length===1&&c.writes[0][1]==="momBlocks/"+TODAY+"/hh_mc_mc_a", c.writes);
  ok("…and it holds her time in momBlockOpen's shape", JSON.stringify(c.hhHouseBlocksOpen())===JSON.stringify([{key:"hh_mc_mc_a",at:"now",startMin:H(10),afterId:"",mins:20}]));
  c.writes.length=0; c.inputs["hb-min-hh_mc_mc_a"]={value:"35"}; const r2=c.hhHouseBlockSet("mc_mc_a","after","lucy_9"); ok("After <card> with 35 min typed: afterId kept, the minutes stick to the row (one more targeted write)", r2.at==="after"&&r2.afterId==="lucy_9"&&r2.mins===35&&c.hhJobs().mc_mc_a.minutes===35&&c.writes.some(w=>w[1]==="household/jobs/mc_mc_a/minutes"&&w[2]===35), c.writes);
  const r3=c.hhHouseBlockSet("mc_mc_a","later"); ok("Later from an After block: 30 min past the question's place (4:15 → 4:45), laid as a Now block", r3.at==="later"&&r3.startMin===H(16,45)&&c.hhHouseBlocksOpen()[0].at==="now"&&c.hhHouseBlocksOpen()[0].startMin===H(16,45));
  const l2=mk(); l2.hhHouseBlockSet("mc_mc_a","now"); const r3b=l2.hhHouseBlockSet("mc_mc_a","later"); ok("Later from a Now block at 10:00 → 10:30", r3b.startMin===H(10,30));
  c.hhHouseBlockSet("mc_mc_a","skip"); ok("Not now lets go of the time", c.hhHouseBlocksOpen().length===0);
  ok("bad choices and unknown rows → nothing", c.hhHouseBlockSet("mc_mc_a","whenever")===null&&c.hhHouseBlockSet("nope","now")===null);
  const d=mk({momDone:{mc_a:true}}); ok("a row she already checked never holds time", d.hhHouseBlockSet("mc_mc_a","now")===null&&d.hhHouseBlocksOpen().length===0);
  const e=mk({noMom:true}); ok("not Mom → nothing", e.hhHouseBlockSet("mc_mc_a","now")===null&&e.writes.length===0);
}
console.log("3. The Mom agenda rows");
{ const c=mk(); const tasks=[card("lucy","10:00 AM",20,"required","Math — Lesson 12")]; const rows=c.momSchedHouse(DN,tasks);
  ok("unanswered: the question at school end (4:15) with How long, Now, After Lucy's Math, Later, Not now", rows.length===1&&rows[0].m===H(16,15)&&rows[0].o===1&&/block out time\?/.test(rows[0].html)&&/hb-min-hh_mc_mc_a/.test(rows[0].html)&&/hhHouseBlockSet\('mc_mc_a','now'\)/.test(rows[0].html)&&/After Lucy's Math/.test(rows[0].html)&&/hhHouseBlockSet\('mc_mc_a','after','lucy_\d+'\)/.test(rows[0].html)&&/'later'\)/.test(rows[0].html)&&/'skip'\)/.test(rows[0].html), rows[0]&&rows[0].html.slice(0,300));
  c.hhHouseBlockSet("mc_mc_a","now"); const r2=c.momSchedHouse(DN,tasks); ok("picked: the block at its time with ⏱, ✓ Done = her strip's check, 30 min later, Not now", r2[0].m===H(10)&&r2[0].o===2&&/kp-cd/.test(r2[0].html)&&/mcToggle\('mc_a'\)/.test(r2[0].html)&&/30 min later/.test(r2[0].html)&&/· Kitchen \+ dining/.test(r2[0].html));
  c.hhHouseBlockSet("mc_mc_a","skip"); const r3=c.momSchedHouse(DN,tasks); ok("Not now: listed at school end with ✓ Done only", r3[0].o===1&&/mcToggle\('mc_a'\)/.test(r3[0].html)&&!/block out time/.test(r3[0].html));
  const dd=mk({momDone:{mc_a:true},momday:{[TODAY]:{chores:{mc_a:new Date().setHours(11,5,0,0)}}}}); const r4=dd.momSchedHouse(DN,tasks); ok("done: a grey ✓ at the minute she checked it (11:05)", r4[0].o===3&&r4[0].m===H(11,5)&&/✓ 🏡/.test(r4[0].html));
  ok("another day's agenda: nothing", c.momSchedHouse("sunday"===DN?"monday":"sunday",tasks).length===0);
}
console.log("4. The Mom loop steps over a house block (replay)");
{ const m1=card("lucy","10:00 AM",20,"required","Math — Lesson 12"), m2=card("lucy","10:20 AM",20,"required","Spelling"), e1=card("ellis","10:40 AM",20,"required","Reading"), own=card("lincoln","10:00 AM",20,"none","Copywork");
  const TASKS=[m1,m2,e1,own];
  const lay=(c)=>{ const laid=c.get("mlQueueLay("+JSON.stringify(TASKS)+")"); return id=>laid.find(t=>t.id===id).time; };
  const a=mk({tasks:TASKS}); const at0=lay(a); ok("control: no block → Lucy 10:00 / 10:20, Ellis 10:40", at0(m1.id)==="10:00 AM"&&at0(m2.id)==="10:20 AM"&&at0(e1.id)==="10:40 AM", [at0(m1.id),at0(m2.id),at0(e1.id)]);
  const b=mk({tasks:TASKS}); b.hhHouseBlockSet("mc_mc_a","now"); const at1=lay(b); ok("Now at 10:00 for 20 min: her Mom cards step over it — Lucy 10:20 / 10:40, Ellis 11:00; Lincoln's own work stays 10:00", at1(m1.id)==="10:20 AM"&&at1(m2.id)==="10:40 AM"&&at1(e1.id)==="11:00 AM"&&at1(own.id)==="10:00 AM", [at1(m1.id),at1(m2.id),at1(e1.id),at1(own.id)]);
  const d=mk({tasks:TASKS}); d.hhHouseBlockSet("mc_mc_a","after",m1.id); const at2=lay(d); ok("After Lucy's Math: laid behind it — Math 10:00, the block 10:20–10:40, Spelling 10:40, Ellis 11:00", at2(m1.id)==="10:00 AM"&&at2(m2.id)==="10:40 AM"&&at2(e1.id)==="11:00 AM"&&d.get("_mlBlkLaid.hh_mc_mc_a")===H(10,20), [at2(m1.id),at2(m2.id),at2(e1.id)]);
  const e=mk({tasks:TASKS}); e.hhHouseBlockSet("mc_mc_a","skip"); const at3=lay(e); ok("Not now holds nothing: back to the control", at3(m1.id)==="10:00 AM"&&at3(e1.id)==="10:40 AM");
}
console.log("5. Wiring");
ok("the kid's Day page draws the card after the lunch line, single-kid views only", /h\+=lunchBlock\(\);\n\s*if\(_singleKid&&typeof hhHouseCardHTML==="function"\)\{ try\{ h\+=hhHouseCardHTML\(kid,day,tasks\); \}catch\(e\)\{\} \}/.test(src));
ok("the Mom agenda takes the house rows beside laundry and prep", /\.concat\(\(typeof momSchedHouse==="function"\)\?momSchedHouse\(day,dayTasks\):\[\]\);/.test(src));
ok("the Mom loop lays around house blocks on momBlockOpen's path", /momBlockOpen\(\)\.concat\(\(typeof hhHouseBlocksOpen==="function"\)\?hhHouseBlocksOpen\(\):\[\]\)\.forEach\(function\(b\)\{/.test(src));
ok("gwBuildDayTasks, seGuardWeek and the sweep are untouched by this PR (no house reference)", !/house|hhHouse/i.test(fn("gwBuildDayTasks"))&&!/hhHouse/.test(fn("seGuardWeek")));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
