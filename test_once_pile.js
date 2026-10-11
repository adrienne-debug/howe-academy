/*
 * ☑️ HH_ONCEPILE — the once pile (her 2026-10-11: "a tab with all of these and a send to person button then it gets added to
 * their list … when a cleaning day things can be pulled"). A once-job starts in the pile, off every list; Send to… puts it on
 * someone's list; ⏸ back; the cleaning-day plan shows the pile with + Add and never hands it out alone.
 *                                                                                           run: node test_once_pile.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const HH=cut("// HOUSEHOLD_START","// HH_ONCEPILE_END"), CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("_rtRotDayNum")+"\n"+fn("rtApplyRot");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END"), MP=cut("// MEALPREP_BLOCK_START","// MEALPREP_BLOCK_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]; const TODAY=iso(new Date()), TDN=DN[new Date().getDay()], DOW=(new Date().getDay()+6)%7, H=(h,m)=>h*60+(m||0);
function mk(o){
  o=o||{}; const writes=[], ls={}, dom={}, bank=[], rlog=[];
  const cfg={chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:"+((DOW+3)%7)}],lucy:[{emoji:"🧽",label:"Mop entry",pts:20,cad:"wk:"+((DOW+2)%7)}]},afternoon:{}};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, isMom:true, momHere:()=>ctx.isMom, kcKid:"", _kioskD:()=>false, confirm:()=>true, calendarData:{holidays:{},vacations:{},cleaningDays:o.clean?{[TODAY]:{at:1}}:{}}, calToday:()=>TODAY,
    rulesData:{cleaningDay:{start:"9:00 AM",end:"11:00 AM",lunchStart:"12:00 PM",lunchEnd:"12:30 PM",minutes:{lincoln:60,ellis:40,lucy:30,julian:15,mom:40,dad:0}}},
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{}, RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, LAUNDRY_STAGES:["washer","dryer","fold"], laundryData:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, rtLateDays:()=>0, rtWaved:()=>false, toggleRtStep:()=>{}, mcToggle:()=>{}, dcToggle:()=>{},
    mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[], gbCur:()=>null, gbInstant:()=>{}, bankDirect:(k,p,n)=>{ bank.push([k,p,n]); return "bid"+bank.length; }, bankDirectRemove:()=>{}, rlogAppend:(k,sl,l,act,p)=>rlog.push([k,l,act,p]), zoneBonusFor:()=>0,
    slState:{}, sv:()=>{}, nowTs:()=>"9:50 AM", activeWk:()=>"week26", mdTodayName:()=>TDN, weekData:{week:"week26"},
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{}, _todayStr:()=>TODAY, getActiveTasks:()=>[], checked:{}, momMoves:{}, morningComplete:()=>true, bbActive:()=>null, adminPinUnlocked:true, famIsMomCard:()=>false, taskCard:()=>'', _agLunchRow:()=>null,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:m=>{ ctx.toasts.push(m); }, toasts:[], renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:id=>dom[id]||null}, dom, writes, bank, rlog, gwParseDate:s=>{ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }};
  ctx._mlNowOverride=H(8); Object.defineProperty(ctx,"_todayDay",{get:()=>TDN});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+fn("mwTodayIso")+"\nfunction _mlNowMin(){ return _mlNowOverride; }\n"+fn("laundrySince")+"\n"+MS+"\n"+MP+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+HH, ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.hhImport(); ctx.hhTakeover(true);
  // two once-jobs in the pile: Lincoln's suitcases (Ellis can too), Mom's mattress protectors
  ctx.hhAddToggle(); ctx.hhAddSet("who","lincoln"); ctx.hhAddSet("kind","once"); ctx.hhAddSet("room","ours"); ctx.hhAddCan("ellis"); ctx.dom["hh-add-label"]={value:"Put up the suitcases"}; ctx.dom["hh-add-pts"]={value:"15"}; ctx.SUIT=ctx.hhAddSave();
  ctx.hhAddToggle(); ctx.hhAddSet("who","mom"); ctx.hhAddSet("kind","once"); ctx.hhAddSet("room","ours"); ctx.dom["hh-add-label"]={value:"Mattress protectors on"}; ctx.dom["hh-add-pts"]={value:""}; ctx.PROT=ctx.hhAddSave();
  ctx.hhSet(ctx.SUIT,"minutes",10); ctx.hhSet(ctx.PROT,"minutes",15);
  ctx.isMom=!o.noMom; ctx.writes.length=0; ctx.toasts.length=0; return ctx;
}
console.log("1. The pile");
{ const c=mk(); const J=c.hhJobs();
  ok("a new once-job is in the pile: hold, off Lincoln's list and off Mom's strip", J[c.SUIT].hold===true&&J[c.PROT].hold===true&&!c.rtStepsFor("chores","lincoln",true).some(s=>s.label==="Put up the suitcases")&&!c.mcAll()[c.PROT]);
  c.hhGo("once"); const el={}; c.renderHousehold(el); const h=el.innerHTML;
  ok("the ☑️ Once chip and the pile by room: both jobs under Mom and Dad's room, owner, minutes, stars, Send to buttons (owner first, then who can)", /hhGo\('once'\)/.test(h)&&/☑️ The pile/.test(h)&&/2 waiting · 25 min/.test(h)&&/🚪 Mom and Dad.s room/.test(h)&&new RegExp("hhOnceSend\\('"+c.SUIT+"','lincoln'\\)").test(h)&&new RegExp("hhOnceSend\\('"+c.SUIT+"','ellis'\\)").test(h)&&!new RegExp("hhOnceSend\\('"+c.SUIT+"','lucy'\\)").test(h)&&/15 ⭐/.test(h));
  ok("the Projects view no longer lists once-jobs", (()=>{ c.hhGo("proj"); const e2={}; c.renderHousehold(e2); return !/suitcases/.test(e2.innerHTML); })());
}
console.log("2. Send to…");
{ const c=mk(); c.writes.length=0; const w=c.hhOnceSend(c.SUIT,"lincoln");
  ok("to its owner: hold cleared, from today, one update; it is on Lincoln's list now", w==="lincoln"&&c.hhJobs()[c.SUIT].hold===false&&c.writes.length===1&&c.writes[0][2]["household/jobs/"+c.SUIT+"/hold"]===null&&c.rtStepsFor("chores","lincoln",true).some(s=>s.label==="Put up the suitcases")&&c.toasts.some(t=>/On Lincoln’s list/.test(t)), c.writes);
  c.writes.length=0; c.hhOnceHold(c.SUIT); ok("⏸ back to the pile: one targeted set, off the list again", c.hhJobs()[c.SUIT].hold===true&&c.writes[0][1]==="household/jobs/"+c.SUIT+"/hold"&&!c.rtStepsFor("chores","lincoln",true).some(s=>s.label==="Put up the suitcases"));
  const w2=c.hhOnceSend(c.SUIT,"ellis"); ok("to Ellis (he can): the row is given to him and goes on his list", w2==="ellis"&&c.hhJobs()[c.SUIT].who==="ellis"&&c.rtStepsFor("chores","ellis",true).some(s=>s.label==="Put up the suitcases")&&!c.rtStepsFor("chores","lincoln",true).some(s=>s.label==="Put up the suitcases"));
  ok("to someone who can't → nothing", c.hhOnceSend(c.SUIT,"julian")===null);
  c.hhOnceSend(c.PROT,"mom"); ok("Mom's own: on her strip", !!c.mcAll()[c.PROT]);
  c.hhGo("once"); const el={}; c.renderHousehold(el); ok("the view: 'On a list' with ⏸ Back to the pile", /📋 On a list/.test(el.innerHTML)&&new RegExp("hhOnceHold\\('"+c.SUIT+"'\\)").test(el.innerHTML));
  const k=mk({noMom:true}); ok("a kid's device: no buttons, no writes", !/hhOnceSend\(/.test((k.hhGo("once"),(()=>{ const e={}; k.renderHousehold(e); return e.innerHTML; })()))&&k.hhOnceSend(k.SUIT,"lincoln")===null&&k.hhOnceHold(k.SUIT)===null&&k.writes.length===0);
}
console.log("3. A cleaning day pulls from the pile");
{ const c=mk({clean:true}); const b=c.hhPlanBuild(TODAY,{});
  ok("the pile is never handed out on its own: both once-jobs are left, the vacuum and the mop are planned", !b.plan[c.SUIT]&&!b.plan[c.PROT]&&b.left.indexOf(c.SUIT)>=0&&!!b.plan["rt_chores_lincoln_vacuum_kitchen"]);
  const home=c.hhCleanHomeHTML(TODAY,TDN); ok("Home Base shows '☑️ The once pile · 2 — add any to today?' with + Lincoln / + Ellis on the suitcases", /☑️ The once pile · 2/.test(home)&&new RegExp("hhPlanGive\\('"+TODAY+"','"+c.SUIT+"','lincoln'\\)").test(home)&&new RegExp("hhPlanGive\\('"+TODAY+"','"+c.SUIT+"','ellis'\\)").test(home)&&!/Next time/.test(home));
  c.hhPlanGive(TODAY,c.SUIT,"ellis"); ok("+ Ellis puts it on the plan for Ellis", c.hhPlanDraft(TODAY).plan[c.SUIT].who==="ellis");
  c.hhPlanSend(TODAY); c.writes.length=0; const upd=c.hhPlanCheck(TODAY,c.SUIT);
  ok("checked on the plan: Ellis paid its 15 stars, the once-job retires with the date, in the one update", c.bank.some(x=>x[0]==="ellis"&&x[1]===15)&&c.hhJobs()[c.SUIT].status==="retired"&&c.hhJobs()[c.SUIT].done===TODAY&&upd["household/jobs/"+c.SUIT+"/status"]==="retired"&&c.writes.length===1);
}
ok("a held row is off the derived lists at the source", /hhLevelOut\(j\)&&!j\.hold; \}\)/.test(src)&&/j\.status!=="retired"&&hhLevelOut\(j\)&&!j\.hold; \}\)\.sort/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
