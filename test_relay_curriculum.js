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
  ok("rlSet: a daily's laying field says it only saved",/isn't paced by the Builder/.test(rl));
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
    reprojectSubjectWeek:(k,s,why,opts)=>{ log.reproj.push({k,s,why,mode:opts&&opts.relayFrom,at:log.reproj.length}); if(o.reproj) o.reproj(k,s,ctx.weekData.tasks); if(o.holdThen) log.pendingThen=(log.pendingThen||[]).concat([opts.then]); else if(opts&&opts.then) opts.then({}); },
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
    _rlwFieldWords:f=>({mom:"Mom",minutes:"minutes"})[f]||f,RLW_LAY_FIELDS:{mom:1,minutes:1,tpw:1},
    _gvRelaySubject:(k,s)=>{ log.gv.push(k+"/"+s); return true; },gwShowToast:m=>log.toasts.push(m),renderAll:()=>{},dbg:()=>{},cbKid:null,cbSubjKey:null};
  if(o.noDoor) delete ctx.relayWeek;
  vm.createContext(ctx); vm.runInContext(fn("rlSet"),ctx); return {ctx,log,call:e=>vm.runInContext(e,ctx)};
}
{ const w=rlWorld(); w.call('rlSet("kid_a","math","mom","required",false)');
  ok("Mom on a Builder-paced subject → the field written, relayWeek('curriculum') with the subject and Undo = Mom back to 'maybe'",w.log.writes[0][0]==="curriculum/subjects/kid_a/math/mom"&&w.log.relay.length===1&&w.log.relay[0][1].label==="📚 Math: Mom"&&w.log.relay[0][1].subjects[0].sk==="math"&&w.log.relay[0][1].undo[0].was==="maybe",w.log.relay);
  ok("…no direct re-lay, no Builder path",!w.log.reproj.length&&!w.log.gv.length); }
{ const w=rlWorld(); w.call('rlSet("kid_a","math","momDays",["Mon"],false)'); ok("a field that wasn't there → Undo = gone",w.log.relay[0][1].undo[0].gone===true,w.log.relay[0][1].undo); }
{ const w=rlWorld({noDoor:true}); w.call('rlSet("kid_a","math","mom","required",false)'); ok("no door (an older build) → the direct re-lay as before",w.log.reproj.join()==="kid_a/math"); }
{ const w=rlWorld(); w.call('rlSet("kid_a","daily_piano","minutes",30,true)');
  ok("a daily's minutes: saved, the plain toast, no re-lay, no Builder",w.log.writes[0][0]==="curriculum/subjects/kid_a/daily_piano/minutes"&&/Piano isn't paced by the Builder/.test(w.log.toasts[0])&&!w.log.relay.length&&!w.log.gv.length,w.log.toasts); }
{ const w=rlWorld(); w.call('rlSet("kid_a","math","tpw",4,true)'); ok("times a week on a Builder-paced subject keeps the Builder path (re-paced, then the door from cbApply)",w.log.gv.join()==="kid_a/math"&&!w.log.relay.length); }
{ const w=rlWorld(); w.call('rlSet("kid_a","daily_piano","mom","required",false)'); ok("Mom on a daily → saved + the plain toast, nothing re-laid",!w.log.relay.length&&!w.log.reproj.length&&w.log.toasts.length===1); }

console.log("4. co-op dates and the Mom-day flip — one run each");
{ const log={relay:[],reproj:[]};
  const ctx={console,JSON,Object,Array,String,currData:{subjects:{kid_a:{math:{noCoopDays:["Mon"]},read:{noCoopDays:["Tue"]},daily_x:{noCoopDays:["Mon"]},paused_y:{noCoopDays:["Mon"],paused:true}},kid_b:{sci:{noCoopDays:["Mon"]}}}},
    noCoopDaysOf:s=>s.noCoopDays||null,planBacked:(k,s)=>!/daily/.test(s),relayWeek:(w,i)=>log.relay.push([w,i]),reprojectSubjectWeek:(k,s)=>log.reproj.push(k+"/"+s),dbg:()=>{}};
  vm.createContext(ctx); vm.runInContext(fn("cwdRelayKids"),ctx);
  const r=vm.runInContext('cwdRelayKids(["kid_a","kid_b"],"coop-dates")',ctx);
  ok("co-op dates: the plan-backed subjects with co-op week days queued into ONE run",log.relay.length===1&&log.relay[0][0]==="coop-dates"&&log.relay[0][1].subjects.map(p=>p.kid+"/"+p.sk).join()==="kid_a/math,kid_a/read,kid_b/sci"&&!log.reproj.length,log.relay);
  ok("…the return names them as before",r.join()==="kid_a/math,kid_a/read,kid_b/sci");
  delete ctx.relayWeek; const r2=vm.runInContext('cwdRelayKids(["kid_a"],"coop-dates")',ctx); ok("no door → the direct re-lays as before",log.reproj.join()==="kid_a/math,kid_a/read"); }
{ const log={relay:[],reproj:[],writes:[]};
  const ctx={console,JSON,Object,Array,String,momHere:()=>true,calendarData:{coopMomDays:{}},currData:{subjects:{kid_a:{math:{mom:"required"},read:{mom:"maybe"}},kid_b:{sci:{mom:"required"}}}},
    coopMomDay:ds=>!!ctx.calendarData.coopMomDays[ds],coopTimedOn:()=>[{kids:["kid_a","kid_b"]}],planBacked:()=>true,
    db:{ref:p=>({set:v=>log.writes.push([p,v]),remove:()=>log.writes.push([p,null])})},relayWeek:(w,i)=>log.relay.push([w,i]),reprojectSubjectWeek:(k,s)=>log.reproj.push(k+"/"+s),gwShowToast:()=>{},renderAll:()=>{},dbg:()=>{}};
  vm.createContext(ctx); vm.runInContext(fn("coopToggleMomDay"),ctx);
  vm.runInContext('coopToggleMomDay("2026-11-05")',ctx);
  ok("Mom's here: the flag written, the Mom-required subjects queued into ONE run, Undo = the flag gone",log.writes[0][0]==="calendar/coopMomDays/2026-11-05"&&log.relay.length===1&&log.relay[0][1].subjects.map(p=>p.sk).join()==="math,sci"&&log.relay[0][1].undo[0].gone===true&&/Mom's here 2026-11-05/.test(log.relay[0][1].label),log.relay);
  vm.runInContext('coopToggleMomDay("2026-11-05")',ctx);
  ok("back to the co-op rule: Undo = the flag back to true",log.relay[1][1].undo[0].was===true&&/Co-op rule/.test(log.relay[1][1].label)); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
