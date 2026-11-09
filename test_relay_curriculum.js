/*
 * 🔁 RELAY3 — curriculum edits through the one re-lay door, pass B chained (her word "Merged, continue" 2026-11-03; slice 3).
 *   0. shape: pass B helpers in the RELAY block; rlSet, cbApply, cwdRelayKids and the co-op Mom-day flip go through the door
 *      (with the old direct call kept as the fallback where relayWeek is absent); no names
 *   1. the door: listed subjects are re-laid ONE AFTER ANOTHER (each waits for the one before), the lock is held until the
 *      chain is over, then one log line covers the sweep and the re-lays; a daily is skipped; a re-lay that never answers is
 *      closed after 45 s; the sweep's plain call still works
 *   2. the mode by the clock, never a question: before school → fresh; mid-day → tomorrow (today kept); after school → tomorrow
 *   3. rlSet: a Mom field on a Builder-paced subject → relayWeek("curriculum") with Undo = the field back; the same field on a
 *      daily → saved, a plain toast, no re-lay; the Builder fields keep the Builder path
 *   4. cwdRelayKids / the Mom-day flip: every plan-backed subject queued into ONE run (no longer all at once)
 *   5. RELAY3D (her answer "mid week too" 2026-11-03): a daily (not Builder-paced) re-lays this week through the same door and
 *      shell with ITS OWN by-day diff — a date-id card is never a phantom; past days, today mid-day, checked / claimed / started
 *      cards never change; a new card takes the generator's slot, else the packer's hole, else the end of the kid's day; a
 *      "last" card closes the day. rlSet / the Days pins / the editor sheet / pause / co-op loops send a daily through the door;
 *      the diff + Undo know an ADDED card.
 *   run:  node test_relay_curriculum.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const BLK=src.slice(src.indexOf("// RELAY_START"),src.indexOf("// RELAY_END"));

console.log("0. shape");
{ ok("pass B helpers live in the RELAY block",/function _rlwChain\(/.test(BLK)&&/function _rlwModeNoAsk\(/.test(BLK)&&/const RLW_LAY_FIELDS=/.test(BLK));
  ok("no kid or family names in the block",!/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|caleb|sara|howe|dewalt|burris/i.test(BLK));
  ok("_rlwModeNoAsk never asks",!/confirm\(/.test(BLK));
  const rl=fn("rlSet"); ok("rlSet: the Mom fields go through relayWeek with the field's Undo, the direct call kept as fallback",/relayWeek\("curriculum"/.test(rl)&&/else if\(_momF&&_pbF&&typeof reprojectSubjectWeek==="function"\)/.test(rl)&&/_wasF/.test(rl));
  ok("rlSet: a daily's laying field goes through the door; another unpaced subject's only saves",/_rlwDailyOk\(kid,sk\)/.test(rl)&&/isn't paced by the Builder/.test(rl)&&/_rlwFieldUndo\(kid,sk,field,_was0\)/.test(rl));
  const rs=fn("reprojectSubjectWeek"); ok("the shell takes a daily (opts.daily) through its own diff, the gate otherwise unchanged",/opts&&opts\.daily/.test(rs)&&/_rlwDailyDiff\(kid,sk,weekData\.tasks,_rlwDailyWant\(kid,sk,gen,wn\)/.test(rs)&&/if\(!_dl&&\(typeof planBacked!=="function"\|\|!planBacked\(kid,sk\)\)\)\{ _then\(null\); return null; \}/.test(rs)&&/_dl\?null:_rpPatternWant/.test(rs));
  ok("the daily helpers live in the RELAY block, no phantom test in them",/function _rlwDailyOk\(/.test(BLK)&&/function _rlwDailyWant\(/.test(BLK)&&/function _rlwDailyDiff\(/.test(BLK)&&!/isPhantom/.test(fn("_rlwDailyDiff")));
  ok("the Days pins, the editor sheet, pause / quick pause send a daily through the door",/_rlwDailyOk\(kid,sk\)&&typeof relayWeek/.test(fn("cbPinDay"))&&/_rlwDailyOk\(ceEditKid,ceEditKey\)/.test(fn("ceSaveField"))&&/_rlwDailyOk\(ceEditKid,ceEditKey\)/.test(fn("ceTogglePause"))&&/_rlwDailyOk\(kid,key\)/.test(fn("ceQuickPause")));
  ok("cbApply: the build's re-lay goes through the door",/relayWeek\("build"/.test(fn("cbApply")));
  ok("cwdRelayKids: one run, the subjects queued",/relayWeek\("coop-dates"/.test(fn("cwdRelayKids"))&&/_pairs\.push/.test(fn("cwdRelayKids")));
  ok("the co-op Mom-day flip: one run with Undo = the flag back",/relayWeek\("coop-mom"/.test(fn("coopToggleMomDay"))&&/calendar\/coopMomDays\/"\+ds,was:true/.test(fn("coopToggleMomDay")));
  ok("pause / resume, the lane handoff and the grid undo keep their own re-lays (unchanged)",/reprojectSubjectWeek\(kid,sk,why,Object\.assign/.test(fn("lnPauseRelay"))&&/reprojectSubjectWeek\(kid,x,\(why\|\|"lane"\)\+":handoff"\)/.test(fn("lnHandoff"))); }

function world(o){
  o=o||{}; const log={claims:[],releases:0,sweeps:0,reproj:[],toasts:[],writes:[],timers:[],dbg:[]};
  const ctx={console,JSON,Math,Object,Array,String,Number,parseInt,isNaN,RegExp,Date:o.Date||Date,
    WK:"week5",HA_DEV_ID:"dev_test",weekData:{tasks:o.tasks||[{id:"a1",who:"kid_a",day:"wednesday",time:"10:00 AM",dur:25,title:"math"}]},checked:{},claimed:{},momMoves:{},
    fbCheckedLoaded:true,fbTasksLoaded:true,fbHistoryLoaded:true,fbCurrLoaded:true,_todayDay:o.todayDay||"tuesday",DAY_DT:{tuesday:"November 3"},
    rulesData:{},calendarData:{},gwRules:()=>({schoolStart:9*60,schoolEnd:16*60+15}),
    momHere:()=>true,_dryRun:()=>!!o.dry,lockHeldByOther:()=>false,
    haClaimSchedLock:(kind,cb)=>{ log.claims.push(kind); cb(function(){ log.releases++; }); },
    cascadeIntraWeek:()=>{ log.sweeps++; if(o.sweep) o.sweep(ctx.weekData.tasks); },runCascade:()=>{},
    planBacked:(k,s)=>!/daily/.test(s),
    currData:o.currData||{subjects:{}},
    reprojectSubjectWeek:(k,s,why,opts)=>{ log.reproj.push({k,s,why,mode:opts&&opts.relayFrom,daily:!!(opts&&opts.daily),at:log.reproj.length}); if(o.reproj) o.reproj(k,s,ctx.weekData.tasks); if(o.holdThen) log.pendingThen=(log.pendingThen||[]).concat([opts.then]); else if(opts&&opts.then) opts.then({}); },
    gwShowToast:m=>log.toasts.push(m),dbg:m=>log.dbg.push(m),renderAll:()=>{},sv:()=>{},
    setTimeout:(f,ms)=>{ log.timers.push({f,ms}); return log.timers.length; },clearTimeout:()=>{},
    db:{ref:p=>({set:v=>log.writes.push([p,v]),remove:()=>{},update:v=>log.writes.push([p||"(root)",v])})},
    cap:s=>s,esc:s=>String(s==null?"":s),toMin,fromMin,stApplyLocal:()=>{}};
  vm.createContext(ctx); vm.runInContext(BLK,ctx);
  const fire=()=>{ const due=log.timers.splice(0,log.timers.length); due.forEach(t=>t.f()); };
  return {ctx,log,fire,call:e=>vm.runInContext(e,ctx)};
}

console.log("1. the door — pass B chained");
{ const w=world({holdThen:true,sweep:t=>{ t[0].day="thursday"; }});
  w.call('relayWeek("curriculum",{label:"📚 Math: Mom",subjects:[{kid:"kid_a",sk:"math"}]}); relayWeek("curriculum",{label:"📚 Read: Mom",subjects:[{kid:"kid_a",sk:"read"},{kid:"kid_a",sk:"math"},{kid:"kid_b",sk:"daily_piano"}]});');
  w.log.timers.splice(0,1); w.fire();
  ok("one lock claim, the sweep first",w.log.claims.join(",")==="relay"&&w.log.sweeps===1);
  ok("the first subject's re-lay starts; the second WAITS for it (chained)",w.log.reproj.length===1&&w.log.reproj[0].s==="math",w.log.reproj);
  ok("the lock is still held, nothing logged yet",w.log.releases===0&&!w.log.writes.length);
  w.log.pendingThen.shift()({});
  ok("…its then → the next one (math listed twice → once; the daily skipped)",w.log.reproj.length===2&&w.log.reproj[1].s==="read",w.log.reproj);
  w.log.pendingThen.shift()({});
  ok("the chain over → one log line for the whole run, then the lock goes",w.log.releases===1&&w.log.writes.length===1&&/relayLog/.test(w.log.writes[0][0])&&w.log.writes[0][1].label==="📚 Math: Mom · 📚 Read: Mom",w.log.writes.map(x=>x[0]));
  ok("…its 'then' fires exactly once more → nothing more happens",(w.log.pendingThen.length===0)&&w.log.releases===1); }
{ const w=world({holdThen:true});
  w.call('relayWeek("curriculum",{label:"x",subjects:[{kid:"kid_a",sk:"math"}]});'); w.fire();
  const t45=w.log.timers.find(t=>t.ms===45000); ok("a 45 s closer is armed for a re-lay that never answers",!!t45);
  t45.f(); ok("…it closes the run and releases the lock once",w.log.releases===1);
  w.log.pendingThen.shift()({}); ok("…a late answer changes nothing",w.log.releases===1); }
{ const w=world({sweep:t=>{ t[0].day="thursday"; }});
  w.call('_rlwRun({whys:["sweep"],labels:["🌙 8 PM sweep"]},function(){ cascadeIntraWeek(); });');
  ok("the sweep's plain call (no callback) still finishes at once and logs",w.log.sweeps===1&&w.log.writes.length===1&&w.log.writes[0][1].label==="🌙 8 PM sweep"); }
{ const w=world({sweep:t=>{ t[0].day="thursday"; },reproj:(k,s,t)=>{ t[0].time="11:00 AM"; }});
  w.call('relayWeek("curriculum",{label:"x",subjects:[{kid:"kid_a",sk:"math"}]});'); w.fire();
  const e=w.log.writes[0][1]; ok("the diff covers both passes: the sweep's day change and the re-lay's time",e.moves.length===1&&e.moves[0].to.d==="thursday"&&e.moves[0].to.t==="11:00 AM",e.moves); }

console.log("2. the mode by the clock");
{ const RealDate=Date; const at=hm=>class F extends RealDate{ constructor(...a){ if(!a.length) super("2026-11-03T"+hm+":00"); else super(...a); } static now(){ return new RealDate("2026-11-03T"+hm+":00").getTime(); } };
  ok("before school → fresh",world({Date:at("08:30")}).call("_rlwModeNoAsk()")==="fresh");
  ok("mid-day → tomorrow (today's cards stay where they are, no question)",world({Date:at("11:30")}).call("_rlwModeNoAsk()")==="tomorrow");
  ok("after school → tomorrow",world({Date:at("17:00")}).call("_rlwModeNoAsk()")==="tomorrow");
  ok("not a school day → tomorrow",world({Date:at("08:30"),todayDay:"sunday"}).call("_rlwModeNoAsk()")==="tomorrow");
  const w=world({Date:at("08:30")}); w.call('relayWeek("curriculum",{label:"x",subjects:[{kid:"kid_a",sk:"math"}]});'); w.fire();
  ok("the chain passes the mode as relayFrom (so the engine never asks)",w.log.reproj[0].mode==="fresh",w.log.reproj); }

console.log("3. rlSet");
function rlWorld(o){
  o=o||{}; const log={relay:[],reproj:[],writes:[],toasts:[],gv:[]};
  const ctx={console,JSON,Object,Array,String,Number,parseInt,Math,Date,RegExp,
    currData:{subjects:{kid_a:{math:{display:"Math",mom:"maybe",planId:"p1",pacing:{mode:"timesPerWeek",tpw:3}},daily_piano:{display:"Piano",mom:"none",minutes:20}}}},
    db:{ref:p=>({set:v=>log.writes.push([p,v]),update:v=>log.writes.push([p,v]),remove:()=>{}})},document:{getElementById:()=>null},
    planBacked:(k,s)=>s==="math",relayWeek:(w,i)=>log.relay.push([w,i]),reprojectSubjectWeek:(k,s)=>log.reproj.push(k+"/"+s),
    _rlwFieldWords:f=>({mom:"Mom",minutes:"minutes",tpw:"times a week"})[f]||f,RLW_LAY_FIELDS:{mom:1,minutes:1,tpw:1},_rlwDailyOk:(k,s)=>/daily/.test(s),
    _gvRelaySubject:(k,s)=>{ log.gv.push(k+"/"+s); return true; },gwShowToast:m=>log.toasts.push(m),renderAll:()=>{},dbg:()=>{},cbKid:null,cbSubjKey:null};
  if(o.noDoor) delete ctx.relayWeek;
  ctx.currData.subjects.kid_a.other={display:"Other",tracking:"lessons",mom:"none"};
  vm.createContext(ctx); vm.runInContext(fn("rlSet")+"\n"+fn("_rlwFieldUndo"),ctx); return {ctx,log,call:e=>vm.runInContext(e,ctx)};
}
{ const w=rlWorld(); w.call('rlSet("kid_a","math","mom","required",false)');
  ok("Mom on a Builder-paced subject → the field written, relayWeek('curriculum') with the subject and Undo = Mom back to 'maybe'",w.log.writes[0][0]==="curriculum/subjects/kid_a/math/mom"&&w.log.relay.length===1&&w.log.relay[0][1].label==="📚 Math: Mom"&&w.log.relay[0][1].subjects[0].sk==="math"&&w.log.relay[0][1].undo[0].was==="maybe",w.log.relay);
  ok("…no direct re-lay, no Builder path",!w.log.reproj.length&&!w.log.gv.length); }
{ const w=rlWorld(); w.call('rlSet("kid_a","math","momDays",["Mon"],false)'); ok("a field that wasn't there → Undo = gone",w.log.relay[0][1].undo[0].gone===true,w.log.relay[0][1].undo); }
{ const w=rlWorld({noDoor:true}); w.call('rlSet("kid_a","math","mom","required",false)'); ok("no door (an older build) → the direct re-lay as before",w.log.reproj.join()==="kid_a/math"); }
{ const w=rlWorld(); w.call('rlSet("kid_a","daily_piano","minutes",30,true)');
  ok("a daily's minutes: saved, then THROUGH THE DOOR with Undo = minutes back to 20; no toast, no Builder, no direct re-lay",w.log.writes[0][0]==="curriculum/subjects/kid_a/daily_piano/minutes"&&w.log.relay.length===1&&w.log.relay[0][0]==="curriculum"&&w.log.relay[0][1].label==="📚 Piano: minutes"&&w.log.relay[0][1].subjects[0].sk==="daily_piano"&&w.log.relay[0][1].undo[0].p==="curriculum/subjects/kid_a/daily_piano/minutes"&&w.log.relay[0][1].undo[0].was===20&&!w.log.toasts.length&&!w.log.gv.length&&!w.log.reproj.length,w.log); }
{ const w=rlWorld(); w.call('rlSet("kid_a","daily_piano","tpw",3,true)');
  ok("a daily's times a week: Undo names both paths the field writes (timesPerWeek, pacing/tpw — both were absent → gone)",w.log.relay.length===1&&w.log.relay[0][1].undo.map(u=>u.p+(u.gone?":gone":":was")).join()==="curriculum/subjects/kid_a/daily_piano/timesPerWeek:gone,curriculum/subjects/kid_a/daily_piano/pacing/tpw:gone",w.log.relay[0][1].undo); }
{ const w=rlWorld(); w.call('rlSet("kid_a","other","minutes",30,true)');
  ok("a subject that is neither Builder-paced nor a daily: saved + the plain toast, no re-lay (as before)",/Other isn't paced by the Builder/.test(w.log.toasts[0])&&!w.log.relay.length,w.log.toasts); }
{ const w=rlWorld(); w.call('rlSet("kid_a","math","tpw",4,true)'); ok("times a week on a Builder-paced subject keeps the Builder path (re-paced, then the door from cbApply)",w.log.gv.join()==="kid_a/math"&&!w.log.relay.length); }
{ const w=rlWorld(); w.call('rlSet("kid_a","daily_piano","mom","required",false)'); ok("Mom on a daily → through the door, Undo = Mom back to none",w.log.relay.length===1&&w.log.relay[0][1].undo[0].was==="none"&&!w.log.reproj.length&&!w.log.toasts.length,w.log); }

console.log("4. co-op dates and the Mom-day flip — one run each");
{ const log={relay:[],reproj:[]};
  const ctx={console,JSON,Object,Array,String,currData:{subjects:{kid_a:{math:{noCoopDays:["Mon"]},read:{noCoopDays:["Tue"]},daily_x:{noCoopDays:["Mon"]},paused_y:{noCoopDays:["Mon"],paused:true}},kid_b:{sci:{noCoopDays:["Mon"]}}}},
    noCoopDaysOf:s=>s.noCoopDays||null,planBacked:(k,s)=>!/daily/.test(s),_rlwDailyOk:(k,s)=>/daily/.test(s),relayWeek:(w,i)=>log.relay.push([w,i]),reprojectSubjectWeek:(k,s)=>log.reproj.push(k+"/"+s),dbg:()=>{}};
  vm.createContext(ctx); vm.runInContext(fn("cwdRelayKids"),ctx);
  const r=vm.runInContext('cwdRelayKids(["kid_a","kid_b"],"coop-dates")',ctx);
  ok("co-op dates: the plan-backed subjects AND the dailies with co-op week days queued into ONE run (a paused one not)",log.relay.length===1&&log.relay[0][0]==="coop-dates"&&log.relay[0][1].subjects.map(p=>p.kid+"/"+p.sk).join()==="kid_a/math,kid_a/read,kid_a/daily_x,kid_b/sci"&&!log.reproj.length,log.relay);
  ok("…the return names them",r.join()==="kid_a/math,kid_a/read,kid_a/daily_x,kid_b/sci");
  delete ctx.relayWeek; const r2=vm.runInContext('cwdRelayKids(["kid_a"],"coop-dates")',ctx); ok("no door → the direct re-lays as before",log.reproj.join()==="kid_a/math,kid_a/read,kid_a/daily_x"); }
{ const log={relay:[],reproj:[],writes:[]};
  const ctx={console,JSON,Object,Array,String,momHere:()=>true,calendarData:{coopMomDays:{}},currData:{subjects:{kid_a:{math:{mom:"required"},read:{mom:"maybe"}},kid_b:{sci:{mom:"required"}}}},
    coopMomDay:ds=>!!ctx.calendarData.coopMomDays[ds],coopTimedOn:()=>[{kids:["kid_a","kid_b"]}],planBacked:(k,s)=>s!=="daily_drills",_rlwDailyOk:(k,s)=>s==="daily_drills",
    db:{ref:p=>({set:v=>log.writes.push([p,v]),remove:()=>log.writes.push([p,null])})},relayWeek:(w,i)=>log.relay.push([w,i]),reprojectSubjectWeek:(k,s)=>log.reproj.push(k+"/"+s),gwShowToast:()=>{},renderAll:()=>{},dbg:()=>{}};
  vm.createContext(ctx); vm.runInContext(fn("coopToggleMomDay"),ctx);
  vm.runInContext('coopToggleMomDay("2026-11-05")',ctx);
  ok("Mom's here: the flag written, the Mom-required subjects queued into ONE run, Undo = the flag gone",log.writes[0][0]==="calendar/coopMomDays/2026-11-05"&&log.relay.length===1&&log.relay[0][1].subjects.map(p=>p.sk).join()==="math,sci"&&log.relay[0][1].undo[0].gone===true&&/Mom's here 2026-11-05/.test(log.relay[0][1].label),log.relay);
  vm.runInContext('coopToggleMomDay("2026-11-05")',ctx);
  ok("back to the co-op rule: Undo = the flag back to true",log.relay[1][1].undo[0].was===true&&/Co-op rule/.test(log.relay[1][1].label));
  ctx.currData.subjects.kid_a.daily_drills={mom:"required",tracking:"daily"}; vm.runInContext('coopToggleMomDay("2026-11-05")',ctx);
  ok("a Mom-required daily is queued too",log.relay[2][1].subjects.map(p=>p.sk).join()==="math,daily_drills,sci",log.relay[2][1].subjects); }

console.log("5. the dailies — their own diff, through the same shell (RELAY3D)");
{ const ctx={console,JSON,Math,Object,Array,String,Number,parseInt,isNaN,RegExp,Date,toMin,fromMin,dbg:()=>{},cap:s=>s,esc:s=>String(s),
    currData:{subjects:{kid_a:{daily_piano:{tracking:"daily",display:"Piano",minutes:20,mom:"none",device:"keyboard"},math:{planId:"p",tracking:"lessons"},closing_nb:{tracking:"daily",rules:"last"},morning_nb:{tracking:"daily",rules:"first"}}}},
    planBacked:(k,s)=>s==="math",gwTaskTitle:(k,s,v)=>"🎹 "+v,gwSubjectDetail:()=>"20 minutes.",coopDayMinutes:(k,ds,s,d)=>ds==="2026-11-05"?Math.min(d,10):d,calDateForWeekDay:(d,wn)=>({thursday:"2026-11-05",friday:"2026-11-06"})[d]||null};
  vm.createContext(ctx); vm.runInContext(BLK,ctx); const call=e=>vm.runInContext(e,ctx);
  ok("_rlwDailyOk: a Daily subject yes; a Builder-paced one, an unknown one no",call('_rlwDailyOk("kid_a","daily_piano")')===true&&call('_rlwDailyOk("kid_a","math")')===false&&call('_rlwDailyOk("kid_a","nope")')===false);
  // what the generator wants: its cards for the subject + a template for a day it dropped the daily (never a carried _c card, never another subject)
  ctx.gen={result:{tasks:[{id:"g1",who:"kid_a",subjectKey:"daily_piano",day:"wednesday",time:"9:05 AM",dur:20},{id:"g2",who:"kid_a",subjectKey:"daily_piano",day:"friday",time:"9:05 AM",dur:20},{id:"g3_c",who:"kid_a",subjectKey:"daily_piano",day:"friday",time:"1:00 PM",dur:20},{id:"g4",who:"kid_a",subjectKey:"math",day:"friday",time:"10:00 AM",dur:20}]},
    dropped:[{kid:"kid_a",key:"daily_piano",day:"thursday",reason:"⚠️ RAN PAST SCHOOL-DAY CUTOFF"},{kid:"kid_a",key:"daily_piano",day:"friday",reason:"x"},{kid:"kid_a",key:"math",day:"thursday",reason:"x"}]};
  const want=call('_rlwDailyWant("kid_a","daily_piano",gen,5)');
  ok("_rlwDailyWant: the subject's cards + one template for the dropped Thursday (co-op minutes, Mom / device / title from the subject, no id)",want.length===3&&want.map(w=>w.day).join()==="wednesday,friday,thursday"&&want[2].id===null&&want[2].dur===10&&want[2].device==="keyboard"&&want[2].mom==="none"&&want[2].title==="🎹 Piano"&&want[2].time===null,want);
  const live=()=>[
    {id:"d306_1",who:"kid_a",subjectKey:"daily_piano",day:"monday",time:"9:05 AM",dur:20,mom:"none",device:"keyboard",title:"🎹 Piano"},
    {id:"d307_1",who:"kid_a",subjectKey:"daily_piano",day:"tuesday",time:"9:05 AM",dur:20,mom:"none",device:"keyboard",title:"🎹 Piano"},
    {id:"d308_1",who:"kid_a",subjectKey:"daily_piano",day:"wednesday",time:"9:05 AM",dur:20,mom:"none",device:"keyboard",title:"🎹 Piano"},
    {id:"d309_1",who:"kid_a",subjectKey:"daily_piano",day:"thursday",time:"2:05 PM",dur:20,mom:"none",device:"keyboard",title:"🎹 Piano"},
    {id:"d310_1",who:"kid_a",subjectKey:"daily_piano",day:"friday",time:"9:05 AM",dur:20,mom:"none",device:"keyboard",title:"🎹 Piano"},
    {id:"kid_a_math_L0003",who:"kid_a",subjectKey:"math",day:"wednesday",time:"10:00 AM",dur:30,lid:"L0003",title:"L3"},
    {id:"kid_a_math_L0004",who:"kid_a",subjectKey:"math",day:"thursday",time:"2:05 PM",dur:30,lid:"L0004",title:"L4"},
    {id:"d308_b",who:"kid_b",subjectKey:"daily_piano",day:"wednesday",time:"9:05 AM",dur:20,mom:"none",device:"keyboard",title:"🎹 Piano"}];
  const W=(days,dur,extra)=>days.map(d=>Object.assign({id:"g_"+d,who:"kid_a",subjectKey:"daily_piano",day:d,time:(d==="thursday")?"2:05 PM":"9:05 AM",dur:dur||20,mom:"none",device:"keyboard",title:"🎹 Piano"},extra||{}));
  const ALL=["monday","tuesday","wednesday","thursday","friday"];
  const O=(o)=>Object.assign({todayDay:"tuesday",nowMin:10*60+30,checked:{d306_1:1},claimed:{},toMin,fromMin,mode:"tomorrow",dayCtx:d=>({start:9*60,end:16*60+15,lunchStart:13*60,lunchEnd:14*60}),packAround:null,days:["monday","tuesday","wednesday","thursday","friday","saturday"],rules:""},o||{});
  const run=(tasks,want,o)=>{ ctx.T=tasks; ctx.Wt=want; ctx.Oo=O(o); return call('_rlwDailyDiff("kid_a","daily_piano",T,Wt,Oo)'); };
  { const t=live(); const r=run(t,W(ALL,30));
    ok("minutes 20→30 mid-day: Wed/Thu/Fri cards keep their ids and days, only dur written; Monday (past, checked) and today untouched; nothing added or removed",Object.keys(r.upd).sort().join()==="d308_1/dur,d309_1/dur,d310_1/dur"&&r.upd["d308_1/dur"]===30&&!r.summary.added.length&&!r.summary.removed.length&&r.summary.retitled.join()==="d308_1,d309_1,d310_1"&&t[0].dur===20&&t[1].dur===20&&r.tasksAfter.length===8,r.upd);
    ok("…the lesson cards and the other kid's card are not touched (no phantom logic: a date-id card is a real card)",!Object.keys(r.upd).some(k=>/_L|d308_b/.test(k))); }
  { const t=live(); const r=run(t,W(ALL,30),{mode:"fresh",nowMin:8*60});
    ok("before school (fresh): today's open card re-lays too",Object.keys(r.upd).sort().join()==="d307_1/dur,d308_1/dur,d309_1/dur,d310_1/dur"); }
  { const t=live(); const r=run(t,W(ALL,30),{mode:"fresh"});
    ok("fresh but mid-day: a started card today (9:05 AM, now 10:30) is held",Object.keys(r.upd).sort().join()==="d308_1/dur,d309_1/dur,d310_1/dur"); }
  { const t=live(); const r=run(t,W(["monday","tuesday","wednesday","friday"]));
    ok("days: Thursday dropped → that card removed whole (one id:null, no field writes beside it); the rest kept",Object.keys(r.upd).join()==="d309_1"&&r.upd.d309_1===null&&r.summary.removed.join()==="d309_1"&&r.summary.kept.join()==="d308_1,d310_1"&&!r.tasksAfter.some(x=>x.id==="d309_1"),r.upd); }
  { const t=live(); const r=run(t,W(["monday","tuesday","wednesday","friday"]),{claimed:{d309_1:1}});
    ok("…a claimed card on the dropped day stays (held)",!Object.keys(r.upd).length&&!r.summary.removed.length); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL));
    const a=r.tasksAfter.find(x=>x.id==="g_thursday");
    ok("days: Thursday added, the generator's slot (2:05 PM) taken by the kid's lesson and no packer → after the kid's last card (2:35 PM)",r.summary.added.join()==="g_thursday"&&a&&a.day==="thursday"&&a.time==="2:35 PM",a); }
  { const t=live().filter(x=>x.id!=="d309_1"&&x.id!=="kid_a_math_L0004"); const r=run(t,W(ALL));
    const a=r.tasksAfter.find(x=>x.id==="g_thursday"); const u=r.upd.g_thursday;
    ok("…(Thursday empty) the generator's slot is taken as is; the write is the whole card without the scratch field",a&&a.time==="2:05 PM"&&u&&u.time==="2:05 PM"&&u._want===undefined&&!Object.keys(u).some(k=>u[k]===undefined||u[k]===null)&&u.who==="kid_a"&&u.subjectKey==="daily_piano",u); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL),{packAround:(ex,nt,c)=>{ nt[0].time=fromMin(c.start+60); return []; }});
    const a=r.tasksAfter.find(x=>x.id==="g_thursday");
    ok("…the slot taken by the kid's lesson (2:05 PM) → the packer's hole (10:00 AM here)",a&&a.time==="10:00 AM",a); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL),{packAround:(ex,nt,c)=>nt});
    const a=r.tasksAfter.find(x=>x.id==="g_thursday");
    ok("…no hole at all (packer overflow) → after the kid's last card (2:35 PM)",a&&a.time==="2:35 PM",a); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL),{claimed:{"kid_a_math_L0004":1}});
    ok("…a held lesson is still 'mine' when the slot is judged: the generator's 2:05 PM is not free → the end of the day",r.tasksAfter.find(x=>x.id==="g_thursday").time==="2:35 PM"); }
  { const t=live(); t.push({id:"d309_9",who:"kid_a",subjectKey:"daily_piano",day:"thursday",time:"3:00 PM",dur:20}); const r=run(t,W(ALL));
    ok("two open cards on a day that wants one → the later one removed",r.summary.removed.join()==="d309_9"&&!r.summary.added.length); }
  { const t=live(); const r=run(t,[]);
    ok("paused (the generator wants nothing): Wed/Thu/Fri cards leave; Monday and today stay",Object.keys(r.upd).sort().join()==="d308_1,d309_1,d310_1"&&r.summary.removed.length===3&&r.tasksAfter.length===5); }
  { const t=live(); t[3]._dayDrop=true; const r=run(t,W(ALL));
    ok("a card the guard had dropped for its day, still wanted → back on the day (_dayDrop cleared, counted)",r.upd["d309_1/_dayDrop"]===null&&r.summary.unboxed.join()==="d309_1"&&!t[3]._dayDrop); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL).map(w=>w.day==="thursday"?Object.assign(w,{id:"kid_a_math_L0004"}):w));
    const a=r.summary.added[0];
    ok("a new card never takes a live id, and never a lesson-shaped one",a==="kid_a_math_L0004_d"&&!r.upd["kid_a_math_L0004"],r.summary.added); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL).map(w=>w.day==="thursday"?Object.assign(w,{id:"d310_1"}):w));
    ok("…a taken id gets a suffix",r.summary.added[0]==="d310_1r1"); }
  { const t=live().filter(x=>x.id!=="d309_1"); const r=run(t,W(ALL).map(w=>w.day==="thursday"?Object.assign(w,{id:null}):w));
    ok("…a template with no id gets a plain one (never ending in _c or _L<n>)",/^rl_daily_piano_kid_a$/.test(r.summary.added[0]),r.summary.added); }
  { const t=live(); ctx.T=t; ctx.Wt=[{id:"gc",who:"kid_a",subjectKey:"closing_nb",day:"wednesday",time:"9:00 AM",dur:5,title:"Closing"}]; ctx.Oo=O({rules:"last"});
    const r=call('_rlwDailyDiff("kid_a","closing_nb",T,Wt,Oo)'); const a=r.tasksAfter.find(x=>x.id==="gc");
    ok("a 'last' card closes the kid's day (after the lesson that ends 10:30), whatever slot the generator named",a&&a.time==="10:30 AM",a); }
  { const t=live(); ctx.T=t; ctx.Wt=W(ALL); ctx.Oo=O({todayDay:null,nowMin:null});
    const r=call('_rlwDailyDiff("kid_a","daily_piano",T,Wt,Oo)');
    ok("no school today (weekend): every day is open to the re-lay, a checked card still held",Object.keys(r.upd).length===0&&r.summary.kept.length===4); }
  { const t=live(); const r=run(t,W(ALL,20,{device:"paper",mom:"required",title:"🎹 Piano 2"}));
    ok("Mom / device / title follow the subject on the open cards (one field write each)",r.upd["d308_1/mom"]==="required"&&r.upd["d308_1/device"]==="paper"&&r.upd["d308_1/title"]==="🎹 Piano 2"&&r.upd["d307_1/mom"]===undefined,r.upd); }
}
{ // the chain routes a daily to the shell with opts.daily, a Builder-paced one without, an unknown one is skipped
  // clock frozen mid-day: RELAY4's "today" mode depends on the hour, and this file runs at any time of day (hub fix 2026-11-08)
  const RealDate=Date, at1130=class F extends RealDate{ constructor(...a){ if(!a.length) super("2026-11-03T11:30:00"); else super(...a); } static now(){ return new RealDate("2026-11-03T11:30:00").getTime(); } };
  const w=world({Date:at1130,currData:{subjects:{kid_b:{daily_piano:{tracking:"daily"}},kid_a:{math:{planId:"p"}}}}});
  w.call('relayWeek("curriculum",{label:"📚 Piano: minutes",subjects:[{kid:"kid_a",sk:"math"},{kid:"kid_b",sk:"daily_piano"},{kid:"kid_b",sk:"daily_nope"}],undo:[{p:"curriculum/subjects/kid_b/daily_piano/minutes",was:20}]});');
  w.fire();
  ok("pass B: the lesson subject plain, the daily with daily:true, both with the clock's mode (RELAY4: a curriculum run mid-day takes today too → \"today\"); an unpaced subject that is no daily skipped",w.log.reproj.map(r=>r.k+"/"+r.s+":"+(r.daily?"daily":"plan")+":"+r.mode).join()==="kid_a/math:plan:today,kid_b/daily_piano:daily:today",w.log.reproj);
  ok("the lock released once the chain is over",w.log.releases===1); }
{ // the diff and Undo know an added card
  const w=world({sweep:t=>{ t.push({id:"new1",who:"kid_a",subjectKey:"daily_piano",day:"thursday",time:"2:05 PM",dur:20,title:"🎹 Piano"}); t[0].time="10:30 AM"; }});
  w.call('relayWeek("curriculum",{label:"📚 Piano: days",undo:[{p:"curriculum/subjects/kid_a/daily_piano/allowedDays",was:["Mon"]}]});'); w.fire();
  const e=w.call("Object.values(relayLogData)[0]");
  ok("the log entry counts the added card and names it; the words say so",e&&e.n===2&&e.added&&e.added.join()==="new1"&&e.moves.length===1&&/1 card moved/.test(w.call("_rlwWords(relayLogData['"+e.at+"'])"))&&/1 added/.test(w.call("_rlwWords(relayLogData['"+e.at+"'])")),e);
  const u=w.call("_rlwUndoUpd(relayLogData['"+e.at+"'],weekData.tasks,{wk:'week5',checked:{},claimed:{}})");
  ok("Undo: the added card goes (id: null), the moved one back, the days back — one root update",u.upd["week5/tasks/new1"]===null&&u.upd["week5/tasks/a1/time"]==="10:00 AM"&&u.upd["curriculum/subjects/kid_a/daily_piano/allowedDays"].join()==="Mon"&&u.cards===2,u.upd);
  const u2=w.call("_rlwUndoUpd(relayLogData['"+e.at+"'],weekData.tasks,{wk:'week5',checked:{new1:1},claimed:{}})");
  ok("…unless it was checked since",u2.upd["week5/tasks/new1"]===undefined&&u2.cards===1);
  w.call("relayUndo('"+e.at+"')");
  ok("…memory: no new1, a1 back at 10:00 AM",!w.ctx.weekData.tasks.some(t=>t.id==="new1")&&w.ctx.weekData.tasks[0].time==="10:00 AM"&&w.log.writes.some(x=>x[0]==="(root)"&&x[1]["week5/tasks/new1"]===null),w.log.writes); }
{ // the Days pins
  const log={relay:[],writes:[],gv:[]};
  const ctx={console,JSON,Object,Array,String,cbKid:"kid_a",cbSubjKey:null,currData:{subjects:{kid_a:{daily_piano:{display:"Piano",tracking:"daily",allowedDays:["Mon","Tue"]},math:{planId:"p",pacing:{mode:"timesPerWeek"},allowedDays:["Mon"]}}}},
    db:{ref:p=>({set:v=>log.writes.push([p,v]),remove:()=>{}})},document:{getElementById:()=>null},planBacked:(k,s)=>s==="math",_rlwDailyOk:(k,s)=>s==="daily_piano",relayWeek:(w,i)=>log.relay.push([w,i]),_gvRelaySubject:(k,s)=>{ log.gv.push(k+"/"+s); return true; },renderAll:()=>{}};
  vm.createContext(ctx); vm.runInContext(fn("cbPinDay"),ctx);
  vm.runInContext('cbPinDay("daily_piano","Wed")',ctx);
  ok("a daily's day pinned → saved, through the door, Undo = the days back",log.writes[0][0]==="curriculum/subjects/kid_a/daily_piano/allowedDays"&&log.writes[0][1].join()==="Mon,Tue,Wed"&&log.relay.length===1&&log.relay[0][1].label==="📚 Piano: days"&&log.relay[0][1].undo[0].was.join()==="Mon,Tue"&&!log.gv.length,log);
  vm.runInContext('cbPinDay("math","Wed")',ctx);
  ok("a Builder-paced subject keeps the Builder path",log.gv.join()==="kid_a/math"&&log.relay.length===1); }
{ // the editor sheet + pause
  const log={relay:[],writes:[]};
  const ctx={console,JSON,Object,Array,String,Date,ceEditKid:"kid_a",ceEditKey:"daily_piano",currData:{subjects:{kid_a:{daily_piano:{display:"Piano",tracking:"daily",minutes:20}}}},
    db:{ref:p=>({set:v=>log.writes.push([p,v])})},planBacked:()=>false,_rlwDailyOk:(k,s)=>s==="daily_piano",RLW_LAY_FIELDS:{minutes:1,fixedTime:1},_rlwFieldWords:f=>f,relayWeek:(w,i)=>log.relay.push([w,i]),
    ceRenderEditSheet:()=>{},renderAll:()=>{},cbTodayISO:()=>"2026-11-03",lnPauseRelay:()=>{ throw new Error("never for a daily"); }};
  vm.createContext(ctx); vm.runInContext(fn("ceSaveField")+"\n"+fn("ceGetSubject")+"\n"+fn("ceTogglePause")+"\n"+fn("ceQuickPause"),ctx);
  vm.runInContext('ceSaveField("minutes",30)',ctx);
  ok("the editor sheet: a daily's minutes → saved, through the door, Undo = 20",log.writes[0][0]==="curriculum/subjects/kid_a/daily_piano/minutes"&&log.relay.length===1&&log.relay[0][1].label==="📚 Piano: minutes"&&log.relay[0][1].undo[0].was===20,log);
  vm.runInContext('ceSaveField("display","Piano!")',ctx);
  ok("…a field the scheduler doesn't lay by: saved only",log.relay.length===1);
  vm.runInContext('ceTogglePause()',ctx);
  ok("pause from the sheet: through the door, Undo = paused back to false, pausedSince gone",log.relay.length===2&&log.relay[1][1].label==="⏸ Piano!"&&log.relay[1][1].undo[0].p==="curriculum/subjects/kid_a/daily_piano/paused"&&log.relay[1][1].undo[0].was===false&&log.relay[1][1].undo[1].gone===true,log.relay[1]);
  vm.runInContext('ceQuickPause("kid_a","daily_piano")',ctx);
  ok("resume from the list card: through the door, Undo = paused back to true, pausedSince back",log.relay.length===3&&log.relay[2][1].label==="▶ Piano!"&&log.relay[2][1].undo[0].was===true&&typeof log.relay[2][1].undo[1].was==="string",log.relay[2]); }


console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
