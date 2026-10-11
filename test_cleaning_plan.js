/*
 * 🧽 HH_CLEANPLAN — PR B: the cleaning day distributes (her 2026-10-11). Every house row at any level + once-jobs + grabs +
 * projects, ranked by the need meter, handed to whoever can do it with the most minutes free; Mom edits and sends; each person's
 * day is laid from the start, over lunch, re-laid from now; a check pays the doer, logs under the doer, marks the owner's list
 * done, resets the need meter.                                                              run: node test_cleaning_plan.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const HH=cut("// HOUSEHOLD_START","// HH_CLEANPLAN_END"), CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END"), MP=cut("// MEALPREP_BLOCK_START","// MEALPREP_BLOCK_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const TODAY=iso(new Date()), N=dayNum(TODAY), TDN=DN[new Date().getDay()], DOW=(new Date().getDay()+6)%7;
const atOf=s=>new Date(s+"T12:00:00").getTime(), H=(h,m)=>h*60+(m||0);
function mk(o){
  o=o||{}; const writes=[], ls={}, dom={}, bank=[], rlog=[], grabsDone=[];
  const cfg={chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:"+((DOW+3)%7)},{emoji:"🍽️",label:"Wipe table",pts:10,cad:"daily"},{emoji:"🪶",label:"Dust shelves",pts:15,cad:"2w"}],
    lucy:[{emoji:"🧽",label:"Mop entry",pts:20,cad:"wk:"+((DOW+2)%7)},{emoji:"📦",label:"Take boxes to curb",pts:5,cad:"once"}],ellis:[{emoji:"🪞",label:"Clean mirrors",pts:15,cad:"2w"}],julian:[{emoji:"🧼",label:"Wipe dresser",pts:5,cad:"wk:"+((DOW+1)%7)},{emoji:"🏋️",label:"Big heavy job",pts:40,cad:"wk:"+((DOW+4)%7)}]},afternoon:{}};
  const log={lincoln:{}}; { const s=isoOf(N-10), wk="wk1", dk=DN[new Date(s+"T12:00:00Z").getUTCDay()]; log.lincoln[wk]={}; log.lincoln[wk][dk]={a:{label:"Dust shelves",slot:"chores",act:"on",ts:"",at:atOf(s),pts:15}}; }
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, isMom:true, momHere:()=>ctx.isMom, kcKid:o.kcKid||"", _kioskD:()=>false, confirm:()=>true, calendarData:{holidays:{},vacations:{},cleaningDays:o.noClean?{}:{[TODAY]:{at:1,by:"mom"}}}, calToday:()=>TODAY,
    rulesData:{cleaningDay:{start:"9:00 AM",end:"11:00 AM",lunchStart:"9:20 AM",lunchEnd:"9:40 AM",minutes:{lincoln:60,ellis:40,lucy:30,julian:15,mom:40,dad:0}}},
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{}, RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, LAUNDRY_STAGES:["washer","dryer","fold"], laundryData:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, rtLateDays:()=>0, rtWaved:()=>false, toggleRtStep:()=>{}, mcToggle:()=>{}, dcToggle:()=>{},
    mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[{emoji:"🪟",label:"Wash windows",pts:25,cad:"wk:5"}], gbCur:()=>null, gbInstant:(k,i)=>grabsDone.push([k,i]),
    bankDirect:(k,p,n)=>{ bank.push([k,p,n]); return "bid"+bank.length; }, bankDirectRemove:(k,b)=>bank.push([k,"rm",b]), rlogAppend:(k,sl,l,act,p)=>rlog.push([k,sl,l,act,p]), zoneBonusFor:()=>0,
    slState:{}, sv:()=>{}, nowTs:()=>"9:50 AM", activeWk:()=>"week26", mdTodayName:()=>TDN, weekData:{week:"week26"},
    routineLog:log, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Fridge clean-out",cad:"wk:"+DOW,ts:1},mc_b:{label:"Vitamins",cad:"daily",ts:1}}, dadChoresData:{}, _todayStr:()=>TODAY, getActiveTasks:()=>[], checked:{}, momMoves:{}, morningComplete:()=>true, bbActive:()=>null, adminPinUnlocked:true, famIsMomCard:()=>false, taskCard:()=>'', _agLunchRow:()=>null,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:m=>{ ctx.toasts.push(m); }, toasts:[], renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:id=>dom[id]||null}, dom, writes, bank, rlog, grabsDone, gwParseDate:s=>{ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }};
  ctx._mlNowOverride=o.nowMin!=null?o.nowMin:H(8); Object.defineProperty(ctx,"_todayDay",{get:()=>TDN});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+fn("mwTodayIso")+"\nfunction _mlNowMin(){ return _mlNowOverride; }\n"+fn("laundrySince")+"\n"+MS+"\n"+MP+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+HH, ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.hhImport(); ctx.hhTakeover(true);
  const S=(id,f,v)=>ctx.hhSet(id,f,v);
  S("rt_chores_lincoln_vacuum_kitchen","minutes",15); S("rt_chores_lincoln_vacuum_kitchen","room","kitchen"); S("rt_chores_lincoln_vacuum_kitchen","can",["lincoln","ellis"]);
  S("rt_chores_lincoln_dust_shelves","minutes",30); S("rt_chores_lincoln_dust_shelves","room","living");
  S("rt_chores_lucy_mop_entry","minutes",20); S("rt_chores_lucy_mop_entry","room","entry"); S("rt_chores_lucy_mop_entry","can",["lucy","lincoln"]);
  S("rt_chores_lucy_take_boxes_to_curb","minutes",5); S("rt_chores_ellis_clean_mirrors","minutes",10); S("rt_chores_ellis_clean_mirrors","room","bathdown");
  S("rt_chores_julian_wipe_dresser","minutes",5); S("rt_chores_julian_big_heavy_job","minutes",30); S("rt_chores_julian_big_heavy_job","level",3);
  S("mc_mc_a","minutes",15); S("mc_mc_a","room","kitchen"); S("mc_mc_a","can",["mom","lincoln"]); S("gb_wash_windows","minutes",10);
  ctx.get('householdData.jobs.proj1={label:"The art cabinet",cad:"asneeded",layer:"project",who:"mom",area:"cleaning",room:"living",expect:40,status:"active",src:{kind:"momChore",id:"proj1"},order:50,ts:1}; householdOnValue(householdData);');
  ctx.isMom=!o.noMom; ctx.writes.length=0; return ctx;   // set up as Mom, then become the device under test
}
const VAC="rt_chores_lincoln_vacuum_kitchen", DUST="rt_chores_lincoln_dust_shelves", MOP="rt_chores_lucy_mop_entry", BOX="rt_chores_lucy_take_boxes_to_curb", MIR="rt_chores_ellis_clean_mirrors", DRS="rt_chores_julian_wipe_dresser", BIG="rt_chores_julian_big_heavy_job", FRIDGE="mc_mc_a", WIN="gb_wash_windows";
console.log("1. What a cleaning day pulls in, and the ranking");
{ const c=mk(); const C=c.hhPlanCandidates(TODAY), ids=C.map(x=>x.id);
  ok("every house row at every level (the Level 3 heavy job too), the once-job, the grab and the project; no dailies, no health", ids.indexOf(BIG)>=0&&ids.indexOf(BOX)>=0&&ids.indexOf(WIN)>=0&&ids.indexOf("proj1")>=0&&ids.indexOf("rt_chores_lincoln_wipe_table")<0&&ids.indexOf("mc_mc_b")<0, ids);
  ok("never-done rows outrank the dust shelves (71%), the project is last", ids.indexOf(DUST)>ids.indexOf(VAC)&&ids.indexOf(DUST)>ids.indexOf(MOP)&&ids[ids.length-1]==="proj1");
  ok("who can: the grab = every kid; the project = its owner; a row = its Can-do set", JSON.stringify(C.find(x=>x.id===WIN).can)==='["lincoln","ellis","lucy","julian"]'&&JSON.stringify(C.find(x=>x.id==="proj1").can)==='["mom"]'&&JSON.stringify(C.find(x=>x.id===VAC).can)==='["lincoln","ellis"]');
  const B=c.hhPlanBudget(c.hhCleanRules()); ok("budgets: the minutes, capped by the day (9–11 less 20 min lunch = 100)", B.lincoln===60&&B.ellis===40&&B.lucy===30&&B.julian===15&&B.mom===40&&B.dad===0);
}
console.log("2. Building the plan");
{ const c=mk(); const b=c.hhPlanBuild(TODAY,{}); const p=b.plan; const J=c.hhJobs();
  ok("everyone's minutes stay within budget", (()=>{ const used={}; Object.keys(p).forEach(id=>{ used[p[id].who]=(used[p[id].who]||0)+p[id].mins; }); const B=c.hhPlanBudget(c.hhCleanRules()); return Object.keys(used).every(w=>used[w]<=B[w]); })(), p);
  ok("every job went to someone in its Can-do set", Object.keys(p).every(id=>c.hhPlanCanDo(J[id]).indexOf(p[id].who)>=0), p);
  ok("the vacuum went to Lincoln (60 free) over Ellis (40)", p[VAC]&&p[VAC].who==="lincoln");
  ok("the Level 3 heavy job (30 min, Julian only, 15 min budget) is left for next time", !p[BIG]&&b.left.indexOf(BIG)>=0, b.left);
  ok("the project went to Mom with what was left of her 40", p.proj1&&p.proj1.who==="mom"&&p.proj1.mins===40-(p[FRIDGE]&&p[FRIDGE].who==="mom"?15:0));
  ok("order per person follows the room walk, projects last", (()=>{ const mine=Object.keys(p).filter(id=>p[id].who==="mom").sort((a,b)=>p[a].order-p[b].order); return mine[mine.length-1]==="proj1"; })());
  const d=c.hhPlanDraft(TODAY); ok("the draft is the build; nothing written yet", JSON.stringify(d.plan)===JSON.stringify(p)&&c.writes.length===0);
  c.hhPlanGive(TODAY,VAC,"ellis"); ok("Give to… in the draft: Ellis has the vacuum now", c.hhPlanDraft(TODAY).plan[VAC].who==="ellis"&&c.writes.length===0);
  ok("…but not to someone outside its set", c.hhPlanGive(TODAY,VAC,"julian")===null&&c.hhPlanDraft(TODAY).plan[VAC].who==="ellis");
  c.hhPlanSkip(TODAY,MOP); ok("Skip: off the plan, on the skipped list; Put back returns it", !c.hhPlanDraft(TODAY).plan[MOP]&&c.hhPlanDraft(TODAY).skip[MOP]===1&&(c.hhPlanSkip(TODAY,MOP),!!c.hhPlanDraft(TODAY).plan[MOP]));
  c.hhPlanRebuild(TODAY); ok("Rebuild starts over (the vacuum is Lincoln's again)", c.hhPlanDraft(TODAY).plan[VAC].who==="lincoln");
  c.hhPlanGive(TODAY,VAC,"ellis"); c.writes.length=0; const rec=c.hhPlanSend(TODAY);
  ok("📨 Send it: one update of household/cleanday/<today> with plan, skip and sent", c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][1]==="household/cleanday/"+TODAY&&c.writes[0][2].plan[VAC].who==="ellis"&&c.writes[0][2].sent>0&&c.hhPlanSent(TODAY), c.writes);
  c.writes.length=0; c.hhPlanGive(TODAY,VAC,"lincoln"); ok("after sending, Give to… writes the plan rows (orders re-done)", c.writes.length===1&&c.writes[0][2]["household/cleanday/"+TODAY+"/plan/"+VAC].who==="lincoln");
  c.writes.length=0; c.hhPlanUnsend(TODAY); ok("✎ Change it removes sent only; the kids wait again", c.writes.length===1&&c.writes[0][0]==="rm"&&c.writes[0][1]==="household/cleanday/"+TODAY+"/sent"&&!c.hhPlanSent(TODAY));
  const k=mk({noMom:true}); ok("a kid's device can't build, give, skip or send", k.hhPlanRebuild(TODAY)===null&&k.hhPlanGive(TODAY,VAC,"ellis")===null&&k.hhPlanSkip(TODAY,VAC)===null&&k.hhPlanSend(TODAY)===null&&k.writes.length===0);
}
console.log("3. The laid day");
{ const c=mk({nowMin:H(8)}); c.hhPlanSend(TODAY); const lay=c.hhPlanLay(TODAY,"lincoln");
  ok("Lincoln's day from 9:00 in room order: the entry mop (if his), then the kitchen vacuum, then the living-room dust", lay.length>=2&&lay[0].at===H(9)&&lay.every((x,i)=>i===0||x.at>=lay[i-1].at+lay[i-1].mins), lay.map(x=>[x.label,x.at,x.mins]));
  ok("lunch 9:20–9:40 is stepped over: no job starts inside it or straddles it", lay.every(x=>!(x.at<H(9,40)&&x.at+x.mins>H(9,20))), lay.map(x=>[x.label,x.at,x.mins]));
  const late=mk({nowMin:H(10,30)}); late.hhPlanSend(TODAY); const l2=late.hhPlanLay(TODAY,"lincoln"); ok("re-laid from now: at 10:30 the first open job starts at 10:30", l2[0].at===H(10,30));
  ok("past the end (11:00) a job reads didn’t fit", l2.some(x=>!x.fit));
  const m=mk({nowMin:H(8)}); m.hhPlanSend(TODAY); const ml=m.hhPlanLay(TODAY,"mom"); ok("Mom's day: the fridge went to Lincoln (more minutes free), so hers is the project alone, 'If there is time', with her whole 40", ml.length===1&&ml[0].id==="proj1"&&ml[0].proj&&ml[0].mins===40&&m.hhPlanRec(TODAY).plan[FRIDGE].who==="lincoln"&&/If there is time/.test(m.hhPlanPanelHTML("mom",TODAY)));
}
console.log("4. A check: the doer is paid and logged, the owner's list reads done, the meter resets");
{ const c=mk({nowMin:H(9,50)}); c.hhPlanDraft(TODAY); c.hhPlanGive(TODAY,VAC,"ellis"); c.hhPlanSend(TODAY); c.writes.length=0;
  const upd=c.hhPlanCheck(TODAY,VAC);
  ok("Ellis did Lincoln's vacuum: Ellis banks the 30 stars, logged under Ellis", c.bank.length===1&&c.bank[0][0]==="ellis"&&c.bank[0][1]===30&&c.rlog.length===1&&c.rlog[0][0]==="ellis"&&c.rlog[0][3]==="on"&&c.rlog[0][4]===30, [c.bank,c.rlog]);
  ok("the done record: who, when, the minute, the stars, the ledger id", upd["household/cleanday/"+TODAY+"/done/"+VAC].who==="ellis"&&upd["household/cleanday/"+TODAY+"/done/"+VAC].min===H(9,50)&&upd["household/cleanday/"+TODAY+"/done/"+VAC].bid==="bid1");
  const sk="week26_"+TDN+"_lincoln_cstep0"; ok("Lincoln's own list reads done, no stars to him: a targeted write on his check-off key", upd["week26/sl/"+sk]&&upd["week26/sl/"+sk].done===true&&upd["week26/sl/"+sk].pts===0&&upd["week26/sl/"+sk].by==="ellis"&&c.get("slState['"+sk+"'].done")===true, Object.keys(upd));
  ok("the row's lastDone is today, so the need meter reads 0%", upd["household/jobs/"+VAC+"/lastDone"]===TODAY&&c.hhNeed(c.hhJobs()[VAC]).pct===0);
  ok("it was one multi-path update", c.writes.length===1&&c.writes[0][0]==="update");
  const lay=c.hhPlanLay(TODAY,"ellis"); ok("on Ellis's laid day it sits at 9:50, the minute it was done", lay.find(x=>x.id===VAC).at===H(9,50)&&!!lay.find(x=>x.id===VAC).done);
  c.writes.length=0; c.hhPlanCheck(TODAY,VAC); ok("tap again: the ledger entry removed, logged off, Lincoln's key back to open, lastDone cleared", c.bank[1][1]==="rm"&&c.bank[1][2]==="bid1"&&c.rlog[1][3]==="off"&&c.get("slState['"+sk+"'].done")===false&&!c.hhJobs()[VAC].lastDone&&c.writes[0][2]["household/jobs/"+VAC+"/lastDone"]===null);
  // Mom's fridge done by Lincoln: her day stamp carries the key
  if(c.hhPlanRec(TODAY).plan[FRIDGE]){ c.hhPlanGive(TODAY,FRIDGE,"lincoln"); c.writes.length=0; const u2=c.hhPlanCheck(TODAY,FRIDGE); ok("Lincoln did Mom's fridge: Mom's strip stamp is written (momday/<iso>/chores/mc_a), Lincoln paid the row's stars (0)", typeof u2["momday/"+TODAY+"/chores/mc_a"]==="number"&&c.bank.filter(b=>b[0]==="lincoln").length===0); }
  // the grab
  if(c.hhPlanRec(TODAY).plan[WIN]){ const who=c.hhPlanRec(TODAY).plan[WIN].who; c.bank.length=0; c.hhPlanCheck(TODAY,WIN); ok("a grab is an instant claim (its own pay), and can't be unchecked", c.grabsDone.length===1&&c.grabsDone[0][0]===who&&c.bank.length===0&&c.hhPlanCheck(TODAY,WIN)===null&&c.toasts.some(t=>/can’t be unchecked/.test(t))); }
  const k=mk({noMom:true,kcKid:"lucy"}); k.get("hhPlanDrafts={}"); const mm=mk(); mm.hhPlanSend(TODAY); k.get("householdData.cleanday="+JSON.stringify(mm.get("householdData.cleanday"))+"; householdOnValue(householdData);");
  const mine=Object.keys(k.hhPlanRec(TODAY).plan).find(id=>k.hhPlanRec(TODAY).plan[id].who==="lucy"), theirs=Object.keys(k.hhPlanRec(TODAY).plan).find(id=>k.hhPlanRec(TODAY).plan[id].who!=="lucy");
  ok("Lucy's device checks Lucy's job, never someone else's", !!k.hhPlanCheck(TODAY,mine)&&k.hhPlanCheck(TODAY,theirs)===null);
}
console.log("5. On screen");
{ const c=mk({nowMin:H(8)}); const home=c.hhCleanHomeHTML(TODAY,TDN);
  ok("Home Base on a cleaning day: the builder — per-person cards with minutes vs budget, Give to… selects, ✕, Next time, 🔁 Rebuild, 📨 Send it", /Today’s plan — yours to change/.test(home)&&/hhPlanSend\(/.test(home)&&/hhPlanRebuild\(/.test(home)&&/<select onchange="hhPlanGive\(/.test(home)&&/hhPlanSkip\(/.test(home)&&/Next time/.test(home)&&/Big heavy job/.test(home)&&/of 60 min/.test(home));
  ok("a kid's panel before the send: the wait card", /Mom is making today’s plan/.test(mk({noMom:true,kcKid:"lucy"}).hhCleanPanelHTML("lucy",TODAY,TDN)));
  c.hhPlanSend(TODAY); const panel=c.hhCleanPanelHTML("lincoln",TODAY,TDN);
  ok("after the send, the panel is the laid day: time pills, room headings, minutes, stars, the check", /9:00 AM/.test(panel)&&/🚪 /.test(panel)&&/⏱ 15 min/.test(panel)&&/30 ⭐/.test(panel)&&/hhPlanCheck\('/.test(panel)&&/🧽 Cleaning day · Lincoln/.test(panel));
  const home2=c.hhCleanHomeHTML(TODAY,TDN); ok("Home Base after the send: progress per person, ✎ Change it, Mom's own laid list", /Today’s plan is out/.test(home2)&&/hhPlanUnsend\(/.test(home2)&&/🧽 Cleaning day · Mom/.test(home2));
  ok("the kid's Schedule card carries the same laid list", (()=>{ const k=mk({noMom:true,kcKid:"lincoln"}); k.get("householdData.cleanday="+JSON.stringify(c.get("householdData.cleanday"))+"; householdOnValue(householdData);"); return /hhPlanCheck\('/.test(k.hhCleanCardHTML()); })());
  const blocks=c.hhHouseBlocksOpen(); ok("Mom's laid jobs hold her time as blocks, and show on her agenda with ✓ Done (40 min would straddle the 9:20 lunch, so it lays at 9:40)", blocks.length===1&&blocks[0].key==="hp_proj1"&&blocks[0].startMin===H(9,40)&&blocks[0].mins===40&&c.momSchedHouse(TDN,[]).length===1&&/hhPlanCheck\(/.test(c.momSchedHouse(TDN,[])[0].html), blocks);
  const g=mk({noClean:true}); g.hhGoCleanToggle(TODAY); ok("a Go-clean day is untouched: everyone's own rows, no plan", /Go clean · Lincoln/.test(g.hhCleanPanelHTML("lincoln",TODAY,TDN))&&!/hhPlanCheck/.test(g.hhCleanPanelHTML("lincoln",TODAY,TDN))&&g.hhHouseBlocksOpen().length===0);
}
ok("the panel, Home Base, the blocks and the agenda are wired", /if\(hhCleanDay\(iso\)&&typeof hhPlanSent==="function"&&!title\)\{ if\(hhPlanSent\(iso\)\) return hhPlanPanelHTML\(who,iso\);/.test(src)&&/if\(cd&&typeof hhPlanHomeHTML==="function"\) h\+=hhPlanHomeHTML\(iso\);/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
