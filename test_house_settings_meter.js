/*
 * 🧽 HH_SETTINGS_METER — PR A of the distributing cleaning day (her 2026-10-11). Settings ▸ Cleaning Day (start · end · lunch ·
 * minutes per person, targeted writes under config/rules/cleaningDay), Can do on rows and the add form, real intervals, and the
 * need meter (days since last checked ÷ interval) with a most-behind-first sort.         run: node test_house_settings_meter.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HH_SETTINGS_METER_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const TODAY=iso(new Date()), N=dayNum(TODAY);
const atOf=s=>new Date(s+"T12:00:00").getTime();
const H=(h,m)=>h*60+(m||0);
function mk(o){
  o=o||{}; const writes=[], ls={}, dom={};
  // Lincoln: Vacuum (Wed) last done 10 days ago · Wipe table (daily) done yesterday · Dust (every 2 weeks) never · Sunny (as needed)
  const VDOW=(new Date(isoOf(N-10)+"T12:00:00Z").getUTCDay()+6)%7;   // ten days ago, as a Mon=0 weekday: the vacuum's day
  const cfg={chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:"+VDOW},{emoji:"🍽️",label:"Wipe table",pts:10,cad:"daily"},{emoji:"🪶",label:"Dust shelves",pts:15,cad:"2w"},{emoji:"🐰",label:"Sunny cage",pts:5,cad:"asneeded"}]},afternoon:{}};
  const log={lincoln:{}}; const put=(n,k,label)=>{ const s=isoOf(n), wk="wk"+Math.floor((N-n)/7), dk=DN[new Date(s+"T12:00:00Z").getUTCDay()]; log.lincoln[wk]=log.lincoln[wk]||{}; log.lincoln[wk][dk]=log.lincoln[wk][dk]||{}; log.lincoln[wk][dk][k]={label:label,slot:"chores",act:"on",ts:"",at:atOf(s),pts:1}; };
  put(N-10,"a","Vacuum kitchen"); put(N-1,"b","Wipe table");
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true, rulesData:o.rules||{}, calendarData:{holidays:{},vacations:{}},
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:log, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{}, activeWk:()=>"week26", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:id=>dom[id]||null}, dom, writes};
  vm.createContext(ctx); vm.runInContext(fn("toMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
const VAC="rt_chores_lincoln_vacuum_kitchen", WIPE="rt_chores_lincoln_wipe_table", DUST="rt_chores_lincoln_dust_shelves", SUNNY="rt_chores_lincoln_sunny_cage";
console.log("1. Settings ▸ Cleaning Day");
{ const c=mk(); const R=c.hhCleanRules();
  ok("defaults: 9:00–1:00 PM, lunch from the school day's default (1:00–2:00), the plan's minutes", R.start===H(9)&&R.end===H(13)&&R.lunchStart===H(13)&&R.lunchEnd===H(14)&&R.minutes.lincoln===60&&R.minutes.dad===120&&R.minutes.julian===15, R);
  const s=mk({rules:{schoolDay:{lunchStart:"12:30 PM",lunchEnd:"1:15 PM"},cleaningDay:{start:"8:30 AM",minutes:{lucy:45}}}}); const R2=s.hhCleanRules();
  ok("set values win; lunch follows the school day until set; the rest stay default", R2.start===H(8,30)&&R2.end===H(13)&&R2.lunchStart===H(12,30)&&R2.lunchEnd===H(13,15)&&R2.minutes.lucy===45&&R2.minutes.ellis===50);
  c.writes.length=0; const v=c.hhCleanRuleSet("start","10:00"); ok("a time from the box: one targeted write to config/rules/cleaningDay/start as 10:00 AM", v==="10:00 AM"&&c.writes.length===1&&c.writes[0][1]==="config/rules/cleaningDay/start"&&c.writes[0][2]==="10:00 AM"&&c.hhCleanRules().start===H(10), c.writes);
  c.writes.length=0; c.hhCleanMinSet("lucy","40"); ok("minutes: one targeted write to …/minutes/lucy", c.writes.length===1&&c.writes[0][1]==="config/rules/cleaningDay/minutes/lucy"&&c.writes[0][2]===40&&c.hhCleanRules().minutes.lucy===40);
  ok("bad field / bad time / bad minutes / the pool → nothing", c.hhCleanRuleSet("nap","10:00")===null&&c.hhCleanRuleSet("end","soon")===null&&c.hhCleanMinSet("lucy","-5")===null&&c.hhCleanMinSet("grab","10")===null);
  const h=c.hhCleanSettingsHTML(); ok("the card: four time boxes, six minute boxes", (h.match(/type="time"/g)||[]).length===4&&(h.match(/type="number"/g)||[]).length===6&&/hhCleanRuleSet\('lunchStart'/.test(h)&&/hhCleanMinSet\('dad'/.test(h));
  ok("it sits in Settings right under School Day Times", /h\+=rulesSchoolDayCardHTML\(r,!!openSchool\);[^\n]*\n\n\s*\/\/ 🧽 CLEANING DAY \(HH_SETTINGS_METER/.test(src)&&/rulesToggleCard\(\\'cleanday\\'\)/.test(src));
  const sat=(()=>{ const d=new Date(); d.setDate(d.getDate()+((6-d.getDay()+7)%7)); return iso(d); })(), mon=(()=>{ const d=new Date(); d.setDate(d.getDate()+((1-d.getDay()+7)%7)); return iso(d); })();
  ok("the Week grid's weekend budget reads the setting (Lucy 40 on Saturday); a school day keeps its number (15)", c.hhBudget("lucy",sat)===40&&c.hhBudget("lucy",mon)===15);
  const d=mk({noMom:true}); ok("not Mom → nothing", d.hhCleanRuleSet("start","10:00")===null&&d.hhCleanMinSet("lucy","40")===null&&d.writes.length===0);
}
console.log("2. Can do");
{ const c=mk(); ok("a row with no set: the owner only", JSON.stringify(c.hhCanOf(c.hhJobs()[VAC]))==='["lincoln"]'&&c.hhCanLabel(c.hhJobs()[VAC])==="👥 Lincoln only");
  c.hhSet(VAC,"can",["lucy","grab","nobody","lucy","ellis"]); const can=c.hhJobs()[VAC].can;
  ok("set: the owner forced in first, the pool and strangers dropped, no doubles; one targeted write", JSON.stringify(can)==='["lincoln","lucy","ellis"]'&&c.writes.length===1&&c.writes[0][1]==="household/jobs/"+VAC+"/can", can);
  c.hhCanToggle(VAC,"lucy"); ok("toggle off Lucy", JSON.stringify(c.hhJobs()[VAC].can)==='["lincoln","ellis"]');
  c.hhCanToggle(VAC,"lincoln"); ok("the owner cannot be toggled off", JSON.stringify(c.hhJobs()[VAC].can)==='["lincoln","ellis"]');
  ok("the picker lists everyone, the owner marked, the pool left out", (()=>{ c.hhPickToggle(VAC,"can"); const h=c.hhPickHTML(VAC,"can"); return /Lincoln \(owner\)/.test(h)&&/hhCanToggle\('rt_chores_lincoln_vacuum_kitchen','julian'\)/.test(h)&&!/Up for Grabs/.test(h); })());
  ok("the Review row carries the Can-do button", /hhPickToggle\('rt_chores_lincoln_vacuum_kitchen','can'\)/.test(c.hhRowHTML(VAC,c.hhJobs()[VAC]))&&/Lincoln, Ellis/.test(c.hhRowHTML(VAC,c.hhJobs()[VAC])));
  c.hhGiveTo(VAC,"julian"); ok("Give to… adds the new owner to the set", JSON.stringify(c.hhJobs()[VAC].can)==='["lincoln","ellis","julian"]');
  const a=mk(); a.hhAddSet("who","lucy"); a.hhAddCan("ellis"); a.hhAddCan("lucy"); a.dom["hh-add-label"]={value:"Sweep the porch"}; const id=a.hhAddSave();
  ok("the add form: 'Who else can do it' chips; the owner first in the saved set", JSON.stringify(a.hhJobs()[id].can)==='["lucy","ellis"]'&&/hhAddCan\('ellis'\)/.test((a.hhAddToggle(),a.hhAddHTML())));
  a.hhAddSet("who","lincoln"); a.hhAddCan("lucy"); a.hhAddSet("who","julian"); a.dom["hh-add-label"]={value:"Tidy shoes"}; const id2=a.hhAddSave(); ok("changing the owner clears the extra picks; no set saved when nobody else is picked", a.hhJobs()[id2].can===undefined);
  ok("the add form offers every 4 and 6 weeks", /\["28d","Every 4 weeks"\],\["42d","Every 6 weeks"\]/.test(src)&&c.cadLabel("28d")==="Every 28 days");
}
console.log("3. The need meter");
{ const c=mk(); const J=c.hhJobs();
  const v=c.hhNeed(J[VAC]); ok("Vacuum (weekly) last done 10 days ago → 143%", v&&v.pct===143&&v.days===10&&v.interval===7&&!v.never, v);
  const w=c.hhNeed(J[WIPE]); ok("Wipe table (daily) done yesterday → 100%", w&&w.pct===100&&w.days===1&&w.interval===1, w);
  const d=c.hhNeed(J[DUST]); ok("Dust (every 2 weeks) never in 8 weeks → never, top of the sort", d&&d.never&&d.pct===Infinity&&d.interval===14, d);
  ok("as needed has no meter", c.hhNeed(J[SUNNY])===null&&c.hhNeedPct(J[SUNNY])===-1);
  ok("intervals: Mon+Thu → 4 days, Sat → 7, every 28 days → 28, a 4-week cycle → 28", c.hhInterval({cad:"wk:0,3"})===4&&c.hhInterval({cad:"sat"})===7&&c.hhInterval({cad:"28d"})===28&&c.hhInterval({cad:"wk:5",cycW:1})===28);
  ok("chips: red for never / 200%+, amber for 100%+, green under", /#fee2e2/.test(c.hhNeedChip(J[DUST]))&&/#fef3c7/.test(c.hhNeedChip(J[VAC]))&&/⏳ 143% · 10 d \/ 7/.test(c.hhNeedChip(J[VAC]))&&/⏳ never in 8 wk/.test(c.hhNeedChip(J[DUST])));
  const el={}; c.hhToggleWho("lincoln"); c.renderHousehold(el); const order=h=>[VAC,WIPE,DUST].map(id=>h.indexOf("hhPickToggle('"+id+"','area')")).join(",");
  const o1=order(el.innerHTML); c.hhSortToggle(); c.renderHousehold(el); const o2=order(el.innerHTML);
  const pos=o2.split(",").map(Number); ok("the sort chip: list order by default; most behind first puts Dust, then Vacuum, then Wipe", /list order/.test(el.innerHTML)&&pos[2]<pos[0]&&pos[0]<pos[1]&&o1!==o2, [o1,o2]);
  c.hhGo("room"); c.get('hhOpenRoom=hhRoomOf(hhJobs()["'+DUST+'"])'); c.renderHousehold(el); ok("the Room view sorts the same way and shows the chips", /⏳ never in 8 wk/.test(el.innerHTML)&&/hhSortToggle/.test(el.innerHTML));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
