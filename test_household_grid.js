/*
 * 🧹 HOUSEHOLD_GRID — 📆 Week · 🗂 Area · 🚪 Room · 🪜 Levels on the Household tab (PR 2b, her "can i see it" 2026-10-09).
 * The week grid = people × Mon–Sun, minutes vs her capacity budget; plan fields (minutes, room, level, moved weekday) live on the
 * household row only; `cad` stays the live list's so Review keeps measuring reality. Still read-only on every live list.
 *                                                                                          run: node test_household_grid.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HOUSEHOLD_GRID_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const dow=s=>(new Date(s+"T12:00:00Z").getUTCDay()+6)%7;
const TODAY=iso(new Date()), N=dayNum(TODAY), MON=N-dow(TODAY);                 // this week's Monday
const atOf=s=>new Date(s+"T12:00:00").getTime();
function mk(o){
  o=o||{}; const writes=[], renders=[], ls={};
  const cfg={afternoon:{lincoln:[{emoji:"🧹",label:"Pickup school room",pts:20,cad:"daily",rot:"downstairs"}],ellis:[{emoji:"🛋️",label:"Pickup living room",pts:20,cad:"daily",rot:"downstairs"}],
                        lucy:[{emoji:"🐕",label:"Let Chloe out",pts:0,cad:"daily"},{emoji:"🍽️",label:"Pickup kitchen",pts:20,cad:"daily",rot:"downstairs"},{emoji:"",label:"shower",pts:50,cad:"wk:2,4,6"}]},
             chores:{lucy:[{emoji:"🛌",label:"Take sheets off beds",pts:15,cad:"wk:0"},{emoji:"🧹",label:"Dust dining area",pts:15,cad:"wk:2"}],
                     lincoln:[{emoji:"🧹",label:"Vacuum stairs & upstairs hallway",pts:30,cad:"wk:1"},{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:2"}]}};
  // log: the 22 days before this Monday, keyed the way the app keys weeks (Sunday → Saturday) — Lucy did every main chore and
  // every pickup (right room) → 100%
  const g=["Pickup school room","Pickup living room","Pickup kitchen"]; const log={lucy:{}}; const s0=MON-1-21;
  for(let n=s0;n<MON;n++){ const wk="wk"+Math.floor((n-s0)/7), s=isoOf(n), dk=DN[new Date(s+"T12:00:00Z").getUTCDay()]; log.lucy[wk]=log.lucy[wk]||{}; log.lucy[wk][dk]={};
      log.lucy[wk][dk]["p"]={label:g[(2+n)%3],slot:"afternoon",act:"on",ts:"",at:atOf(s),pts:20};
      if(dow(s)===0) log.lucy[wk][dk]["a"]={label:"Take sheets off beds",slot:"chores",act:"on",ts:"",at:atOf(s),pts:15};
      if(dow(s)===2) log.lucy[wk][dk]["b"]={label:"Dust dining area",slot:"chores",act:"on",ts:"",at:atOf(s),pts:15}; }
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:o.nodb?null:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))])})},
    _dryRun:o.dry?()=>true:undefined, momHere:()=>!o.noMom,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:k=>k==="julian"?[{label:"Brush Teeth",emoji:"🦷",pts:0,cad:"daily"}]:[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false,
    mcAll:()=>({mc_sheets:{label:"🛏 Wash the sheets",cad:"wk:0"},mc_kclose:{label:"🌙 Kitchen close-down",cad:"daily"}}), dcAll:()=>({}), mcDoneOn:()=>false,
    gbList:()=>[{emoji:"🧹",label:"Spray and wipe down baseboards",pts:40,cad:"daily"}],
    routineLog:log, momdayData:{}, daddayData:{}, activeWk:()=>"week26", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"<banner>"+s+"</banner>", mpSubnav:v=>"<nav:"+v+">", mwToast:()=>{},
    document:{getElementById:()=>({})}, renderMomsPlan:()=>renders.push(1), writes, renders, ls};
  vm.createContext(ctx);
  vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+BLOCK, ctx);
  ctx.hhImport(); ctx.writes.length=0; return ctx;
}
const LUCY_MON="rt_chores_lucy_take_sheets_off_beds", LUCY_WED="rt_chores_lucy_dust_dining_area", LUCY_PK="rt_afternoon_lucy_pickup_kitchen", LINC_TUE="rt_chores_lincoln_vacuum_stairs_upstairs_hallway";

console.log("📆 Week: this week's days, cells, minutes vs budget, the rotation's room per date");
{ const c=mk(); const days=c.hhWeekDays();
  ok("seven days starting this Monday", days.length===7&&days[0]===isoOf(MON)&&dow(days[0])===0&&days[6]===isoOf(MON+6));
  const mon=c.hhCellJobs("lucy",days[0]); ok("Lucy Monday: Chloe, pickup, sheets (shower is Wed/Fri/Sun)", mon.length===3&&mon.includes(LUCY_MON)&&!mon.includes("rt_afternoon_lucy_shower"), mon);
  ok("Lucy Wednesday: + shower + dust dining", c.hhCellJobs("lucy",days[2]).length===4);
  ok("minutes by area: house = pickup 5 + cleaning 10 = 15; routine = Chloe 3", c.hhCellMins(mon).house===15&&c.hhCellMins(mon).routine===3);
  ok("budget: Lucy 15 on a school day, 30 on Saturday", c.hhBudget("lucy",days[0])===15&&c.hhBudget("lucy",days[5])===30&&c.hhBudget("lucy",days[6])===30);
  ok("Lincoln's pickup on a date follows the rotation", c.hhRotLabelOn(c.hhJobs()["rt_afternoon_lincoln_pickup_school_room"],days[1])===["Pickup school room","Pickup living room","Pickup kitchen"][(0+dayNum(days[1]))%3]);
  const el={}; c.hhGo("week"); c.renderHousehold(el);
  ok("grid renders people × days with counts, house minutes and the routine beside it", /Lincoln<\/td>/.test(el.innerHTML)&&/Mom<\/td>/.test(el.innerHTML)&&/15m <span/.test(el.innerHTML)&&/\+3m/.test(el.innerHTML)&&!/Up for Grabs<\/td>/.test(el.innerHTML));
  ok("Lucy Monday at budget (15 of 15) → not amber", !new RegExp("hhGridPick\\('lucy','"+days[0]+"'\\)\" style=\"[^\"]*background:#fef3c7").test(el.innerHTML));
  c.hhMinutesCycle(LUCY_MON); c.renderHousehold(el);
  ok("sheets at 15 min → 20 > 15 → amber", new RegExp("hhGridPick\\('lucy','"+days[0]+"'\\)\" style=\"[^\"]*background:#fef3c7").test(el.innerHTML));
  c.hhGridPick("lucy",days[0]); c.renderHousehold(el);
  ok("open cell lists its jobs with minutes, day buttons on the weekly one, retire", /Take sheets off beds/.test(el.innerHTML)&&/⏱ 15 min/.test(el.innerHTML)&&new RegExp("hhMoveDay\\('"+LUCY_MON+"',1\\)").test(el.innerHTML)&&/house 20 of 15 min/.test(el.innerHTML)&&/routine 3 min/.test(el.innerHTML));
  c.hhSet(LUCY_MON,"minutes",10);
}
console.log("Plan fields: minutes, moved weekday, room, level — targeted writes, live cad untouched");
{ const c=mk(); c.hhMinutesCycle(LUCY_MON); ok("minutes 10 → 15, one set", c.writes.length===1&&c.writes[0][1]==="household/jobs/"+LUCY_MON+"/minutes"&&c.writes[0][2]===15, c.writes);
  c.writes.length=0; c.hhMoveDay(LUCY_MON,1); ok("move Monday → Tuesday writes planCad wk:1", c.writes.length===1&&c.writes[0][1].endsWith("/planCad")&&c.writes[0][2]==="wk:1", c.writes);
  const j=c.hhJobs()[LUCY_MON]; ok("live cad still wk:0, plan cad wk:1", j.cad==="wk:0"&&c.hhPlanCad(j)==="wk:1");
  const days=c.hhWeekDays(); ok("the week grid follows the plan day; Review's numbers still follow the live day", !c.hhCellJobs("lucy",days[0]).includes(LUCY_MON)&&c.hhCellJobs("lucy",days[1]).includes(LUCY_MON)&&c.hhStats(j).due8===8);
  c.writes.length=0; c.hhMoveDay(LUCY_MON,0); ok("moving back to its own day clears planCad", c.writes[0][2]==="");
  c.writes.length=0; c.hhMoveDay(LUCY_PK,3); ok("a daily job cannot be moved", c.writes.length===0);
  c.writes.length=0; c.hhSet(LUCY_MON,"minutes",999); c.hhSet(LUCY_MON,"level",7); c.hhSet(LUCY_MON,"planCad","wk:9"); ok("bad values rejected", c.writes.length===0);
  c.writes.length=0; c.hhRoomCycle(LUCY_MON); ok("room cycles from the guess (ours → bathup) with one set", c.writes.length===1&&c.writes[0][1].endsWith("/room")&&c.writes[0][2]==="bathup", c.writes);
  c.writes.length=0; c.hhLevelCycle(LUCY_MON); ok("level 1 → 2", c.writes[0][1].endsWith("/level")&&c.writes[0][2]===2);
  const d=mk({noMom:true}); d.hhMinutesCycle(LUCY_MON); d.hhLevelSet(2); ok("not Mom → nothing", d.writes.length===0);
  const e=mk({dry:true}); e.hhMinutesCycle(LUCY_MON); ok("dry run → nothing", e.writes.length===0);
  ok("no write to a live list anywhere in the block", !/db\.ref\("(config|momChores|dadChores|week|routineLog|bank|laundry)/.test(BLOCK));
}
console.log("🚪 Room guesses and 🗂 Area layers");
{ const c=mk(); const J=c.hhJobs();
  ok("sheets → Mom and Dad's room; stairs → stairs; vacuum kitchen → kitchen; dust dining → kitchen; pickup school room → school", c.hhRoomOf(J[LUCY_MON])==="ours"&&c.hhRoomOf(J[LINC_TUE])==="stairs"&&c.hhRoomOf(J["rt_chores_lincoln_vacuum_kitchen"])==="kitchen"&&c.hhRoomOf(J[LUCY_WED])==="kitchen"&&c.hhRoomOf(J["rt_afternoon_lincoln_pickup_school_room"])==="school");
  ok("health / animals → not a room", c.hhRoomOf(J["rt_morning_julian_brush_teeth"])==="any"&&c.hhRoomOf(J["rt_afternoon_lucy_let_chloe_out"])==="any");
  ok("layers: chores-slot weekly = main; Mom's wk = weekly; sheets wash = laundry; grab = grab; daily = daily", c.hhLayerOf(J[LUCY_MON])==="main"&&c.hhLayerOf(J["mc_mc_sheets"])==="laundry"&&c.hhLayerOf(J["gb_spray_and_wipe_down_baseboards"])==="grab"&&c.hhLayerOf(J[LUCY_PK])==="daily");
  const el={}; c.hhGo("room"); c.renderHousehold(el);
  ok("rooms in order, floors labelled, a room with no weekly owner is flagged", el.innerHTML.indexOf("Living room")<el.innerHTML.indexOf("Boys")&&/⬆️ Upstairs/.test(el.innerHTML)&&/no weekly job owns this room/.test(el.innerHTML));
  c.hhGo("area"); vm.runInContext("hhOpenArea='cleaning'",c); c.renderHousehold(el);
  ok("area view: four cards, cleaning split into layers", /🧽 Cleaning/.test(el.innerHTML)&&/One main chore a day · 4/.test(el.innerHTML)&&/Laundry · 1/.test(el.innerHTML)&&/Up for Grabs · 1/.test(el.innerHTML), (el.innerHTML.match(/[A-Za-z ]+ · \d+<\/div>/g)||[]).slice(0,8));
}
console.log("🪜 Levels: the ready meter from the last three full weeks");
{ const c=mk(); ok("current level defaults to 1", c.hhLevelCur()===1);
  const R=c.hhReady(1); ok("three weeks listed, each with due and done", R.weeks.length===3&&R.weeks.every(w=>w.due>0), R.weeks);
  ok("not ready: Lincoln's rows were never done", !R.ready);
  // retire Lincoln's two main chores and his pickup, Ellis's pickup → only Lucy's house rows remain → three weeks at 100%
  ["rt_chores_lincoln_vacuum_stairs_upstairs_hallway","rt_chores_lincoln_vacuum_kitchen","rt_afternoon_lincoln_pickup_school_room","rt_afternoon_ellis_pickup_living_room","gb_spray_and_wipe_down_baseboards","mc_mc_sheets","mc_mc_kclose"].forEach(id=>c.hhSet(id,"verdict","retire"));
  const R2=c.hhReady(1); ok("ready when every remaining house row hit 80%+ three weeks running (Lucy 100%)", R2.ready&&R2.weeks.every(w=>w.rate===1), R2.weeks);
  c.writes.length=0; c.hhLevelSet(2); ok("level up writes household/levels/cleaning/current = 2", c.writes.length===1&&c.writes[0][1]==="household/levels/cleaning/current"&&c.writes[0][2]===2&&c.hhLevelCur()===2);
  c.hhLevelSet(9); c.hhLevelSet(0); ok("bad levels ignored", c.hhLevelCur()===2);
  const el={}; c.hhGo("levels"); c.renderHousehold(el);
  ok("levels view: current level, ready line, week chips, L1/L2/L3 groups", /Cleaning is at Level 2/.test(el.innerHTML)&&/Ready for the next level\?/.test(el.innerHTML)&&/Level 3 · 0 jobs · not on yet/.test(el.innerHTML)&&/🪜 L1/.test(el.innerHTML));
}
console.log("Wiring");
{ ok("seven chips on the tab", /chip\('week','📆 Week'\)\+chip\('area','🗂 Area'\)\+chip\('room','🚪 Room'\)\+chip\('levels','🪜 Levels'\)/.test(src));
  ok("hhSet accepts the plan fields", /\["area","floor","verdict","note","status","minutes","room","level","planCad"\]/.test(src));
  ok("no 🔀 in index.html", src.indexOf("🔀")<0); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
