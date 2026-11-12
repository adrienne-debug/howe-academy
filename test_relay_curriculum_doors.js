/*
 * 🔁 RELAY4 + 📚 CURRLIVE — every curriculum door re-lays through the one door; the curriculum is live
 * (her words 2026-11-08: "if I change something in the grid, if anything happens in the grid or on the curriculums page, it all
 *  reflects in the week and everything is regenerated as well, without having to say regenerate or generate";
 *  PLAN_living_schedule_finish_2026-11-08 slice A).
 *   0. shape: the RELAY4 and CURRLIVE blocks sit in the RELAY block; the boot read is .on("value") → currOnValue; db.ref is
 *      stamped once at init; every door in the plan's table names _rlwCurrDoor; no kid or family names
 *   1. the door helper: exactly one relayWeek("curriculum") for the kid+subject touched; a card-only subject only saves (one
 *      word, once); a paused one never; a kid-wide door lists every subject the engine lays; lane / kid pairs; _rlwWas
 *   2. the debounce: cells typed within 2 s → ONE run (one lock claim, one sweep, each subject re-laid once), Undo keeps the
 *      first "was" per path; an Undo value too big for the log is dropped (the cards still come back)
 *   3. the mode behind RLW_CURR_TODAY: before school "fresh", mid-day "today", after school / weekend "tomorrow"; only a
 *      "curriculum" run (or info.today) takes it; another why keeps the clock's old rule
 *   4. every door replayed on stubs → one door call with its kid+subject, label and Undo entries captured BEFORE the write
 *   5. a checked card never moves and its text never changes; a class is held — the engines' own rules
 *   6. Undo puts the field AND the cards back (one multi-path update), this device's copy first
 *   7. the listener: the first arrival = the old once; this device's own write echo is skipped; another device's change is the
 *      copy + a redraw and NEVER a re-lay; a screen mid-edit keeps its field; the stamp knows curriculum paths only
 *   run:  node test_relay_curriculum_doors.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const BLK=src.slice(src.indexOf("// RELAY_START"),src.indexOf("// RELAY_END"));
const R4=src.slice(src.indexOf("// RELAY4_START"),src.indexOf("// RELAY4_END"));
const CL=src.slice(src.indexOf("// CURRLIVE_START"),src.indexOf("// CURRLIVE_END"));
const NAMES=/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|caleb|sara|howe|dewalt|burris/i;
const RealDate=Date;
function fakeDate(iso){ const D=function(a){ return (a===undefined)?new RealDate(D.iso):new RealDate(a); }; D.iso=iso; D.now=function(){ return new RealDate(D.iso).getTime(); }; D.prototype=RealDate.prototype; return D; }

console.log("0. shape");
{ ok("RELAY4 and CURRLIVE live inside the RELAY block",R4.length>100&&CL.length>100&&BLK.indexOf("// RELAY4_START")>0&&BLK.indexOf("// CURRLIVE_START")>0);
  ok("the constant for plan question 1 and the Undo size cap",/const RLW_CURR_TODAY=true;/.test(R4)&&/const RLW_UNDO_MAX_JSON=16000;/.test(R4));
  ok("the door helpers",/function _rlwCurrDoor\(/.test(R4)&&/function _rlwLays\(/.test(R4)&&/function _rlwKidPairs\(/.test(R4)&&/function _rlwLanePairs\(/.test(R4)&&/function _rlwWas\(/.test(R4)&&/function _rlwModeToday\(/.test(R4));
  ok("the boot read is live: .on(\"value\") → currOnValue, the once is gone",!/db\.ref\("curriculum"\)\.once\("value",/.test(src)&&/db\.ref\("curriculum"\)\.on\("value",s=>\{ currOnValue\(s\.val\(\)\); \}\);/.test(src));
  ok("db.ref is stamped once at init, the globals sit beside lastTasksWrite",/\|\|firebase\.database\(\);[^\n]*\n\s*if\(typeof currStampDb==="function"\) currStampDb\(db\);/.test(src)&&/let lastTasksWrite = 0;\nlet lastCurrWrite = 0; const CURR_ECHO_MS = 3000;/.test(src));
  ok("relayWeek marks a curriculum run as 'today' (behind the constant) and caps an Undo value",/_rlwPend\.today=true/.test(fn("relayWeek"))&&/RLW_UNDO_MAX_JSON/.test(fn("relayWeek")));
  ok("_rlwChain takes the today mode for such a run",/pend\.today&&typeof RLW_CURR_TODAY!=="undefined"&&RLW_CURR_TODAY&&typeof _rlwModeToday==="function"\)\?_rlwModeToday\(\):_rlwModeNoAsk\(\)/.test(fn("_rlwChain")));
  const DOORS=["gvCommitCell","gvAddMissingDays","gvRecountTotal","lmSaveSlotText","ceEditLesson","ceAddSave","ceDeleteSubject","cbCopyTo","psApply","lnEditSave","lnRetire","lnDelete","lnUndoLast","cbSetCap","ceSetTargetEnd","llSetOverride","cwdUseMonThu","ceAddToggleRule","_ceRelayAfterMark"];
  const missing=DOORS.filter(d=>!/_rlwCurrDoor\(/.test(fn(d)));
  ok("every door in the plan's table ends in _rlwCurrDoor ("+DOORS.length+")",!missing.length,missing);
  ok("every door guards the call (typeof) so a sandbox without the door still saves",DOORS.every(d=>/typeof _rlwCurrDoor==="function"/.test(fn(d))));
  ok("the Builder-gate loop in cwdUseMonThu is the fallback only",/if\(typeof _rlwCurrDoor==="function"\)\{ _rlwCurrDoor\("🏫 Mon–Thu without co-op"/.test(fn("cwdUseMonThu"))&&/else hit\.forEach/.test(fn("cwdUseMonThu")));
  ok("a deleted subject: the kid's OTHER subjects, the sweep too, no field Undo",/_rlwCurrDoor\("🗑 "\+\(s\.display\|\|sk\)\+" deleted",_rlwKidPairs\(kid\),\[\],\{toast:false,sweep:true\}\)/.test(fn("ceDeleteSubject")));
  ok("psApply's kid branch goes through the door inside psLive()",/if\(psLive\(\)\)\{ db\.ref\("curriculum\/subjects\/"\+kid\+"\/"\+key\)\.set\(subj\);[^\n]*\n\s*try\{ if\(typeof _rlwCurrDoor==="function"\) _rlwCurrDoor\(/.test(fn("psApply")));
  ok("no kid or family names in the new blocks",!NAMES.test(R4)&&!NAMES.test(CL));
  ok("currOnValue never re-lays (no relayWeek, no schedCascade past the first arrival)",(CL.match(/schedCascade\(\)/g)||[]).length===1&&!/relayWeek\(/.test(CL)&&!/reprojectSubjectWeek/.test(CL)); }

// ── the world: the RELAY block on stubs, fake timers, a fake db, a controllable clock ──
function world(o){
  o=o||{}; const log={claims:[],releases:0,sweeps:0,reproj:[],toasts:[],writes:[],timers:[],dbg:[],renders:0,soon:0,pace:0,disp:0,casc:0,autogen:0};
  const D=fakeDate(o.nowISO||"2026-11-10T11:00:00");
  const subjects=o.subjects||{kid_a:{math:{planId:"p",display:"Math",lessonSeq:["L1","L2","L3"],lessonIds:["L0001","L0002","L0003"],nextLid:4,total:3},piano:{tracking:"daily",display:"Piano",minutes:20},cards:{display:"Cards",lessonSeq:["c1"]},old:{planId:"p",paused:true,display:"Old"}},kid_b:{geo:{planId:"p",display:"Geo"}}};
  const fakeRef=function(p){ return {set:v=>{ log.writes.push([p,"set",v]); },update:v=>{ log.writes.push([p==null?"(root)":p,"update",v]); },remove:()=>{ log.writes.push([p,"remove"]); },on:(ev,cb)=>{ log.writes.push([p,"on",ev]); },once:(ev,cb)=>{ log.writes.push([p,"once",ev]); }}; };
  const ctx={console,JSON,Math,Object,Array,String,Number,parseInt,isNaN,RegExp,Date:D,Set,
    WK:"week5",HA_DEV_ID:"dev_test",weekData:{tasks:o.tasks||[{id:"a1",who:"kid_a",subjectKey:"math",day:"wednesday",time:"10:00 AM",dur:25,title:"math"},{id:"a2",who:"kid_a",subjectKey:"piano",day:"wednesday",time:"11:00 AM",dur:20,title:"piano"}]},
    checked:o.checked||{},claimed:{},momMoves:{},
    fbCheckedLoaded:true,fbTasksLoaded:true,fbHistoryLoaded:true,fbCurrLoaded:(o.currLoaded===undefined)?true:o.currLoaded,_todayDay:o.todayDay||"tuesday",DAY_DT:{monday:"Nov 9",tuesday:"Nov 10",wednesday:"Nov 11",thursday:"Nov 12",friday:"Nov 13"},
    rulesData:{},calendarData:{},gwRules:()=>({schoolStart:9*60,schoolEnd:16*60+15,lunchStart:13*60,lunchEnd:14*60}),tab:o.tab||"schedule",isUploading:false,
    lastCurrWrite:0,CURR_ECHO_MS:3000,
    momHere:()=>true,_dryRun:()=>!!o.dry,lockHeldByOther:()=>false,
    haClaimSchedLock:(kind,cb)=>{ log.claims.push(kind); cb(function(){ log.releases++; }); },
    cascadeIntraWeek:()=>{ log.sweeps++; if(o.sweep) o.sweep(ctx.weekData.tasks); },runCascade:()=>{},
    planBacked:(k,s)=>{ const x=((ctx.currData||{}).subjects||{})[k]; return !!(x&&x[s]&&x[s].planId); },
    currData:(o.currData===undefined)?{subjects:subjects,lessons:{kid_a:{3:{date:"2026-11-10",math:"L3"}}},weekDays:{},done:{}}:o.currData,
    reprojectSubjectWeek:(k,s,why,opts)=>{ log.reproj.push({k,s,why,mode:opts&&opts.relayFrom,daily:!!(opts&&opts.daily)}); if(o.reproj) o.reproj(k,s,ctx.weekData.tasks); if(opts&&opts.then) opts.then({}); },
    gwShowToast:m=>log.toasts.push(m),dbg:m=>log.dbg.push(m),renderAll:()=>{ log.renders++; },renderAllSoon:()=>{ log.soon++; },sv:()=>{},
    buildCurrPaceCum:()=>{ log.pace++; },runDisplacement:()=>{ log.disp++; },schedCascade:()=>{ log.casc++; },autoGenerateWeekIfNeeded:function autoGenerateWeekIfNeeded(){ log.autogen++; },
    setTimeout:(f,ms)=>{ log.timers.push({f,ms}); return log.timers.length; },clearTimeout:()=>{},
    db:{ref:fakeRef},document:{activeElement:null},
    cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),esc:s=>String(s==null?"":s),toMin,fromMin,
    lnUnitSubs:u=>{ if(!u) return []; if(u.subs) return (Array.isArray(u.subs)?u.subs:Object.values(u.subs)).map(String); return u.sk?[String(u.sk)]:[]; },_lnList:v=>{ if(!v) return []; return Array.isArray(v)?v.filter(x=>x!=null):Object.keys(v).sort((a,b)=>(+a)-(+b)).map(k=>v[k]).filter(x=>x!=null); }};
  vm.createContext(ctx); vm.runInContext(BLK+"\n"+fn("stApplyLocal"),ctx);
  const fire=()=>{ const due=log.timers.splice(0,log.timers.length); due.forEach(t=>t.f()); };
  return {ctx,log,fire,D,call:e=>vm.runInContext(e,ctx)};
}

console.log("1. the door helper");
{ const w=world();
  const r=w.call('_rlwCurrDoor("📚 Math: lesson text",[{kid:"kid_a",sk:"math"}],[{p:"curriculum/lessons/kid_a/3/math",was:"L3"}])');
  const p=w.call("_rlwPend");
  ok("a Builder-paced subject → one pending run: the pair, the label, the Undo entry, marked today, one timer armed",r.length===1&&r[0].sk==="math"&&p&&p.subjects.length===1&&p.subjects[0].kid==="kid_a"&&p.subjects[0].sk==="math"&&p.labels.join()==="📚 Math: lesson text"&&p.undo[0].p==="curriculum/lessons/kid_a/3/math"&&p.undo[0].was==="L3"&&p.today===true&&p.whys.join()==="curriculum"&&w.log.timers.length===1&&w.log.timers[0].ms===2000,p);
  const r2=w.call('_rlwCurrDoor("📚 Piano: minutes",[{kid:"kid_a",sk:"piano"}],[])');
  ok("a daily lays too (same pending run, two subjects now)",r2.length===1&&w.call("_rlwPend.subjects.length")===2);
  w.call("_rlwPend=null; _rlwTimer=null;"); w.log.timers.length=0;
  const r3=w.call('_rlwCurrDoor("📚 Cards: lesson text",[{kid:"kid_a",sk:"cards"}],[{p:"curriculum/lessons/kid_a/3/cards",was:"c1"}])');
  ok("a card-only subject (not Builder-paced, not a daily): saved only — no run, one plain word",r3.length===0&&w.call("_rlwPend")===null&&w.log.timers.length===0&&w.log.toasts.length===1&&/Cards isn't paced, so this week's cards update/.test(w.log.toasts[0]),w.log.toasts);   // CURRWORDS 2026-11-11: the toast's words
  w.call('_rlwCurrDoor("📚 Cards: lesson text",[{kid:"kid_a",sk:"cards"}],[])');
  ok("…the word is not repeated within 10 s (ten cells, one word)",w.log.toasts.length===1);
  w.call('_rlwCurrDoor("x",[{kid:"kid_a",sk:"cards"}],[],{toast:false})');
  ok("…and a door with its own word (toast:false) says nothing",w.log.toasts.length===1);
  ok("a paused subject is never laid",w.call('_rlwCurrDoor("x",[{kid:"kid_a",sk:"old"}],[])').length===0&&w.call("_rlwPend")===null);
  ok("a kid-wide door lists every subject the engine lays for that kid (not the card-only one, not the paused one)",w.call('_rlwKidPairs("kid_a").map(p=>p.sk).join()')==="math,piano");
  w.call('_rlwCurrDoor("🗑 Gone deleted",_rlwKidPairs("kid_c"),[],{toast:false,sweep:true})');
  ok("{sweep:true} with no such pair still runs (the sweep alone fills a freed day)",w.call("_rlwPend")!==null&&w.call("_rlwPend.subjects.length")===0&&w.log.timers.length===1);
  w.call("_rlwPend=null;"); w.log.timers.length=0;
  ok("lane pairs: the members of the lane before and after, deduped",w.call('_rlwLanePairs("kid_a",{units:[{sk:"math"}]},{units:{0:{subs:["piano","cards"]},1:{sk:"math"}}}).map(p=>p.sk).join()')==="math,piano,cards");
  ok("the same pair twice in one call is one",w.call('_rlwCurrDoor("x",[{kid:"kid_a",sk:"math"},{kid:"kid_a",sk:"math"}],[]).length')===1&&w.call("_rlwPend.subjects.length")===1);
  ok("_rlwWas: a path that exists → its deep copy; a missing one → gone; not a curriculum path → null",(()=>{ const a=w.call('_rlwWas("curriculum/lessons/kid_a/3/math")'), b=w.call('_rlwWas("curriculum/dayCap/kid_a")'), c=w.call('_rlwWas("config/rules/x")'); const d=w.call('_rlwWas("curriculum/subjects/kid_a/math/lessonSeq")'); return a.was==="L3"&&b.gone===true&&c===null&&d.was.join()==="L1,L2,L3"&&d.was!==w.ctx.currData.subjects.kid_a.math.lessonSeq; })()); }

console.log("2. the debounce");
{ const w=world();
  w.call('_rlwCurrDoor("📚 Math: lesson text",[{kid:"kid_a",sk:"math"}],[{p:"curriculum/lessons/kid_a/3/math",was:"L3"}]);');
  w.call('_rlwCurrDoor("📚 Math: lesson text",[{kid:"kid_a",sk:"math"}],[{p:"curriculum/lessons/kid_a/3/math",was:"L3b"},{p:"curriculum/lessons/kid_a/4/math",was:"L4"}]);');
  w.call('_rlwCurrDoor("📚 Math: lesson count",[{kid:"kid_a",sk:"math"}],[{p:"curriculum/subjects/kid_a/math/total",was:3}],{toast:false});');
  w.call('_rlwCurrDoor("📚 Piano: lesson text",[{kid:"kid_a",sk:"piano"}],[]);');
  ok("four door calls within 2 s → one pending run with two subjects, the first 'was' per path kept, two labels",w.call("_rlwPend.subjects.map(s=>s.sk).join()")==="math,piano"&&w.call("_rlwPend.undo.map(u=>u.p+'='+JSON.stringify(u.was)).join('|')")==='curriculum/lessons/kid_a/3/math="L3"|curriculum/lessons/kid_a/4/math="L4"|curriculum/subjects/kid_a/math/total=3'&&w.call("_rlwPend.labels.join('·')")==="📚 Math: lesson text·📚 Math: lesson count·📚 Piano: lesson text",w.call("_rlwPend"));
  w.fire();
  ok("…when she stops: ONE lock claim, ONE sweep, each subject re-laid exactly once (chained), the lock released once",w.log.claims.join()==="relay"&&w.log.sweeps===1&&w.log.reproj.map(r=>r.k+"/"+r.s+(r.daily?":daily":"")).join()==="kid_a/math,kid_a/piano:daily"&&w.log.releases===1,w.log);
  ok("nothing moved → no log line, no toast (a quiet run)",w.call("Object.keys(relayLogData).length")===0&&!w.log.toasts.some(t=>/→/.test(t)));
  const w2=world(); const big="x".repeat(20000);
  w2.ctx.BIG=big; w2.call('_rlwCurrDoor("📚 Kid: 2 days added",_rlwKidPairs("kid_a"),[{p:"curriculum/lessons/kid_a",was:BIG},{p:"curriculum/weekDays/kid_a",was:{w1:[0,1]}}],{toast:false,sweep:true});');
  ok("an Undo value too big for the log is dropped, the small one kept, a note left",w2.call("_rlwPend.undo.map(u=>u.p).join()")==="curriculum/weekDays/kid_a"&&w2.log.dbg.some(m=>/too big to keep/.test(m)),w2.call("_rlwPend.undo")); }

console.log("3. the mode behind RLW_CURR_TODAY");
{ const at=(iso,td)=>{ const w=world({nowISO:iso,todayDay:td||"tuesday"}); return w.call("_rlwModeToday()"); };
  ok("before school → fresh (today laid by its pattern)",at("2026-11-10T08:30:00")==="fresh");
  ok("mid-day → today (today's open cards re-laid from now, slots kept)",at("2026-11-10T11:00:00")==="today");
  ok("after school → tomorrow",at("2026-11-10T16:30:00")==="tomorrow");
  ok("a weekend → tomorrow",at("2026-11-14T11:00:00","saturday")==="tomorrow");
  const w=world({nowISO:"2026-11-10T11:00:00"});
  w.call('relayWeek("curriculum",{label:"📚 Math: lesson text",subjects:[{kid:"kid_a",sk:"math"}]});'); w.fire();
  ok("a curriculum run mid-day re-lays with mode 'today' (RLW_CURR_TODAY=true)",w.log.reproj.length===1&&w.log.reproj[0].mode==="today",w.log.reproj);
  const w2=world({nowISO:"2026-11-10T11:00:00"});
  w2.call('relayWeek("coop-dates",{label:"🏫 Co-op dates",subjects:[{kid:"kid_a",sk:"math"}]});'); w2.fire();
  ok("another why keeps the clock's old rule (mid-day → tomorrow, today kept)",w2.log.reproj[0].mode==="tomorrow"&&w2.call("_rlwPend")===null);
  const w3=world({nowISO:"2026-11-10T11:00:00"});
  w3.call('relayWeek("coop-dates",{label:"x",subjects:[{kid:"kid_a",sk:"math"}],today:true});'); w3.fire();
  ok("info.today forces it for any why",w3.log.reproj[0].mode==="today");
  const w4=world({nowISO:"2026-11-10T08:30:00"});
  w4.call('relayWeek("curriculum",{label:"x",subjects:[{kid:"kid_a",sk:"math"}]});'); w4.fire();
  ok("a curriculum run before school → fresh",w4.log.reproj[0].mode==="fresh"); }

console.log("4. every door, replayed");
// a sandbox for one door: the real _rlwWas / _rlwLays / _rlwKidPairs / _rlwLanePairs, a RECORDING door, a fake db
function doorWorld(extra,code){
  const log={door:[],writes:[],toasts:[],gv:[]};
  const subjects={kid_a:{math:{planId:"p",display:"Math",lessonSeq:["L1","L2","L3"],lessonIds:["L0001","L0002","L0003"],nextLid:4,total:3,rules:"first,sequential",timesPerWeek:4,pacing:{mode:"timesPerWeek",tpw:4}},
    piano:{tracking:"daily",display:"Piano",minutes:20,allowedDays:["Mon","Tue"]},cards:{display:"Cards",lessonSeq:["c1","c2"],total:2},geo:{planId:"p",display:"Geo",lessonSeq:["g1"],lessonIds:["L0001"],timesPerWeek:4,noCoopDays:["Mon","Tue","Wed","Thu"]}},kid_b:{}};
  const ctx=Object.assign({console,JSON,Math,Object,Array,String,Number,parseInt,isNaN,RegExp,Date,Set,
    currData:{subjects:subjects,lessons:{kid_a:{3:{date:"2026-11-10",math:"L3",cards:"c1"},4:{date:"2026-11-11",math:"L4"}}},weekDays:{kid_a:{"Week 1":[3,4]}},dayCap:{},targetEnd:{},lanes:{},done:{}},
    db:{ref:p=>({set:v=>log.writes.push([p,"set",v]),update:v=>log.writes.push([p==null?"(root)":p,"update",v]),remove:()=>log.writes.push([p,"remove"])})},
    planBacked:(k,s)=>{ const x=(ctx.currData.subjects||{})[k]; return !!(x&&x[s]&&x[s].planId); },_rlwDailyOk:(k,s)=>{ const x=((ctx.currData.subjects||{})[k]||{})[s]; return !!(x&&x.tracking==="daily"&&!x.planId); },
    _rlwCurrDoor:(l,p,u,o)=>{ log.door.push({l,p,u,o}); return (p||[]).filter(x=>ctx._rlwLays(x.kid,x.sk)); },
    gwShowToast:m=>log.toasts.push(m),renderAll:()=>{},renderAllSoon:()=>{},dbg:()=>{},buildCurrPaceCum:()=>{},cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),esc:s=>String(s==null?"":s),
    momHere:()=>true,_dryRun:()=>false,sv:()=>{},confirm:()=>true,alert:()=>{},document:{getElementById:()=>null,activeElement:null},HA_LS:{setItem:()=>{},getItem:()=>null},
    lnUnitSubs:u=>{ if(!u) return []; if(u.subs) return (Array.isArray(u.subs)?u.subs:Object.values(u.subs)).map(String); return u.sk?[String(u.sk)]:[]; },_lnList:v=>{ if(!v) return []; return Array.isArray(v)?v.filter(x=>x!=null):Object.keys(v).sort((a,b)=>(+a)-(+b)).map(k=>v[k]).filter(x=>x!=null); },
    _gvRelaySubject:(k,s,m)=>{ log.gv.push(k+"/"+s); return false; }},extra||{});
  vm.createContext(ctx); vm.runInContext(fn("_rlwWas")+"\n"+fn("_rlwLays")+"\n"+fn("_rlwKidPairs")+"\n"+fn("_rlwLanePairs")+"\n"+code,ctx);
  return {ctx,log,call:e=>vm.runInContext(e,ctx)};
}
const one=(log)=>log.door.length===1?log.door[0]:null;
const pairStr=d=>d?d.p.map(x=>x.kid+"/"+x.sk).join():"";
const undoStr=d=>d?d.u.map(u=>u.p+(u.gone?"=∅":"="+JSON.stringify(u.was))).join("|"):"";
{ // gvCommitCell (+ the real gvRecountTotal underneath)
  const w=doorWorld({gvGrabScroll:()=>{},gvEdit:{},gvFilled:v=>!!(v&&String(v).trim()),gvCellIdentity:()=>({mode:"stored"}),gvSyncSeqInto:(patch,subs,kid)=>{ patch["subjects/"+kid+"/"+subs[0]+"/lessonSeq"]=["L1","L2","L3b"]; }},fn("gvCommitCell")+"\n"+fn("gvRecountTotal"));
  w.call('gvCommitCell("kid_a",3,"math","L3b")');
  const text=w.log.door.find(d=>/lesson text/.test(d.l));
  ok("grid cell edit → the door for kid_a/math with the cell, the count, the list (re-synced) and its ids as they WERE",w.log.door.length===1&&text&&pairStr(text)==="kid_a/math"&&text.l==="📚 Math: lesson text"&&undoStr(text)==='curriculum/lessons/kid_a/3/math="L3"|curriculum/subjects/kid_a/math/total=3|curriculum/subjects/kid_a/math/lessonSeq=["L1","L2","L3"]|curriculum/subjects/kid_a/math/lessonIds=["L0001","L0002","L0003"]|curriculum/subjects/kid_a/math/nextLid=4',w.log.door);
  ok("…the cell was written first (targeted) and the count unchanged → no second door call from the recount",w.log.writes[0][0]==="curriculum/lessons/kid_a/3/math"&&w.log.writes[0][2]==="L3b");
  w.log.door.length=0; w.call('gvCommitCell("kid_a",3,"math","L3b")');
  ok("the same text again → nothing (no write, no door)",w.log.door.length===0);
  w.log.door.length=0; w.log.writes.length=0; w.call('gvCommitCell("kid_a",4,"math","")');
  const rc=w.log.door.find(d=>/lesson count/.test(d.l));
  ok("clearing a cell → the recount's door call (count 3→2, Undo total=3, no word) and the text door; the cell is gone from memory",w.log.door.length===2&&rc&&undoStr(rc)==="curriculum/subjects/kid_a/math/total=3"&&rc.o.toast===false&&w.ctx.currData.lessons.kid_a[4].math===undefined&&w.log.writes.some(x=>x[0]==="curriculum/lessons/kid_a/4/math"&&x[1]==="remove"),w.log.door);
  w.log.door.length=0; w.ctx.gvCellIdentity=()=>({mode:"plan"}); w.log.writes.length=0; w.call('gvCommitCell("kid_a",3,"math","zzz")');
  ok("a plan cell is refused before any write — no door either",w.log.door.length===0&&w.log.writes.length===0&&w.log.toasts.some(t=>/shows the plan/.test(t)));
  w.ctx.gvCellIdentity=()=>({mode:"stored"}); w.log.door.length=0; w.log.toasts.length=0; w.call('gvCommitCell("kid_a",3,"cards","c1b")');
  ok("a card-only subject's cell → the door is still asked (it decides: saved only)",w.log.door.length===1&&pairStr(w.log.door[0])==="kid_a/cards"); }
{ const w=doorWorld({},fn("gvRecountTotal")+"\nfunction gvFilled(v){ return !!(v&&String(v).trim()); }");
  w.ctx.currData.subjects.kid_a.math.total=2; w.call('gvRecountTotal("kid_a","math")');
  ok("gvRecountTotal: 2 cells counted where total said 2 → no door call",w.log.door.length===0);
  w.ctx.currData.subjects.kid_a.math.total=7; w.call('gvRecountTotal("kid_a","math")');
  ok("…a changed count → one door call, Undo total=7, no word (the caller has its own)",w.log.door.length===1&&w.log.door[0].l==="📚 Math: lesson count"&&undoStr(w.log.door[0])==="curriculum/subjects/kid_a/math/total=7"&&w.log.door[0].o.toast===false); }
{ const w=doorWorld({lmEditSlot:{}},fn("lmSaveSlotText"));
  w.call('lmSaveSlotText("kid_a",3,"math","L3 — pages 4-5")');
  const d=one(w.log); ok("Lesson Map slot text → the door for kid_a/math, Undo = the old text",d&&pairStr(d)==="kid_a/math"&&d.l==="📚 Math: lesson text"&&undoStr(d)==='curriculum/lessons/kid_a/3/math="L3"',w.log.door);
  w.log.door.length=0; w.call('lmSaveSlotText("kid_a",9,"math","x")');
  ok("…a slot that does not exist: nothing",w.log.door.length===0); }
{ const w=doorWorld({ceEditKid:"kid_a",ceEditKey:"math"},fn("ceEditLesson"));
  w.call('ceEditLesson(5,"L5")');
  const d=one(w.log); ok("the subject card's lesson list (ceEditLesson) → the door, Undo = the cell gone (it was new)",d&&pairStr(d)==="kid_a/math"&&undoStr(d)==="curriculum/lessons/kid_a/5/math=∅"&&w.log.writes[0][0]==="curriculum/lessons/kid_a/5/math",w.log.door);
  w.log.door.length=0; w.call('ceEditLesson(3,"L3x")');
  ok("…an existing cell: Undo = its old text",undoStr(one(w.log))==='curriculum/lessons/kid_a/3/math="L3"'); }
{ // ceAddSave: a new daily
  const w=doorWorld({ceAddKid:"kid_b",ceAddForm:{name:"Reading",device:"paper",mom:"none",minutes:15,days:"Mon Tue Wed",rules:"",tracking:"daily",timesPerWeek:3,fixedTime:"",fixedDates:[],priority:"normal"},ceCloseSheet:()=>{},cbDefaultForm:()=>({}),ceOpenEdit:()=>{},ceBuildOpen:null,cbKid:null,cbSubjKey:null,cbForm:null,cbPreviewRes:null,lessonExpandDays:x=>x,_lidAlign:()=>({ids:[],nextLid:1})},fn("ceAddSave"));
  w.call("ceAddSave()");
  const d=one(w.log); ok("Add Subject (a daily) → the door for the new kid+subject right after its one write; Undo = the subject gone; no word of its own",d&&pairStr(d)==="kid_b/reading"&&d.l==="📚 Reading added"&&undoStr(d)==="curriculum/subjects/kid_b/reading=∅"&&d.o.toast===false&&w.log.writes[0][0]==="curriculum/subjects/kid_b/reading",w.log.door);
  ok("…the record is exactly what ceAddSave wrote before (no extra write, no extra field)",w.log.writes.length===2&&w.log.writes[1][0]==="curriculum/lastEdit"&&JSON.stringify(Object.keys(w.log.writes[0][2]))===JSON.stringify(["display","device","mom","minutes","days","allowedDays","rules","tracking","priority","timesPerWeek"]),w.log.writes[0]); }
{ // ceDeleteSubject: the kid's OTHER subjects
  const w=doorWorld({ceEditKid:"kid_a",ceEditKey:"geo",ceGetSubject:()=>({display:"Geo"}),_gvPurgeSubject:()=>0,WK:"week5",weekData:{tasks:[{id:"g1",who:"kid_a",subjectKey:"geo",day:"wednesday"},{id:"g2",who:"kid_a",subjectKey:"geo",day:"thursday"},{id:"m1",who:"kid_a",subjectKey:"math",day:"wednesday"}]},checked:{g1:"10:00 AM Nov 11"},rulesData:null,fbArr:x=>x,saveRules:()=>{},ceCloseSheet:()=>{}},fn("ceDeleteSubject"));
  w.call("ceDeleteSubject()");
  const d=one(w.log);
  ok("Delete subject → the door with the kid's remaining subjects only (math, piano — never the deleted one, never the card-only one), the sweep too, no field Undo",d&&d.l==="🗑 Geo deleted"&&pairStr(d)==="kid_a/math,kid_a/piano"&&d.u.length===0&&d.o.sweep===true&&d.o.toast===false,w.log.door);
  ok("…its open card came off the week (targeted), the checked one stayed, the record is gone",w.ctx.weekData.tasks.map(t=>t.id).join()==="g1,m1"&&w.log.writes.some(x=>x[0]==="week5/tasks"&&x[1]==="update"&&x[2].g2===null)&&!w.ctx.currData.subjects.kid_a.geo); }
{ const w=doorWorld({cbKid:"kid_a",cbSubjKey:"piano",cbMsg:"",buildSubjectLessons:()=>[],_lidAlign:()=>({ids:[],nextLid:1}),eqIsEggs:()=>false,cbSetKid:()=>{},cbOpenSubj:()=>{},kyCopyLand:()=>{},cw:k=>k},fn("cbCopyTo"));
  w.call('cbCopyTo("kid_b")');
  const d=one(w.log); ok("Copy to another kid → the door for THAT kid's copy, Undo = the copy gone",d&&pairStr(d)==="kid_b/piano"&&/copied to Kid_b/.test(d.l)&&undoStr(d)==="curriculum/subjects/kid_b/piano=∅"&&d.o.toast===false,w.log.door); }
{ // lanes
  const w=doorWorld({cbKid:"kid_a",cbMsg:"",lnEdit:{id:null,name:"Math lane",units:[{sk:"math",rhythm:"own"},{sk:"geo",rhythm:"prior"}]},lnUndo:null,lnEditProblems:()=>[],lnOpenCount:()=>0},fn("lnEditSave")+"\n"+fn("lnRetire")+"\n"+fn("lnDelete")+"\n"+fn("lnUndoLast")+"\n"+fn("lnLanes")+"\n"+fn("lnUnits"));
  w.call("lnEditSave()");
  let d=one(w.log); const id=Object.keys(w.ctx.currData.lanes.kid_a)[0];
  ok("a new lane → the door for its members (math, geo), Undo = the lane gone",d&&d.l==="🛤 lane “Math lane”"&&pairStr(d)==="kid_a/math,kid_a/geo"&&undoStr(d)==="curriculum/lanes/kid_a/"+id+"=∅",w.log.door);
  w.log.door.length=0; w.call('lnRetire("'+id+'",0,true)'); d=one(w.log);
  ok("retiring a unit → the door for the members, Undo = the lane as it was",d&&/retired/.test(d.l)&&pairStr(d)==="kid_a/math,kid_a/geo"&&d.u[0].p==="curriculum/lanes/kid_a/"+id&&d.u[0].was.units[0].retired===undefined&&w.ctx.currData.lanes.kid_a[id].units[0].retired===true,w.log.door);
  w.log.door.length=0; w.call('lnDelete("'+id+'")'); d=one(w.log);
  ok("removing the lane → the door for the members (back to their own settings), Undo = the lane back",d&&/removed/.test(d.l)&&pairStr(d)==="kid_a/math,kid_a/geo"&&d.u[0].was&&d.u[0].was.name==="Math lane"&&!w.ctx.currData.lanes.kid_a[id],w.log.door);
  w.log.door.length=0; w.call("lnUndoLast()"); d=one(w.log);
  ok("the lane's own ↩ Undo → the door again for the members, its Undo = the lane gone (as before this undo)",d&&d.l==="🛤 lane undo"&&pairStr(d)==="kid_a/math,kid_a/geo"&&undoStr(d)==="curriculum/lanes/kid_a/"+id+"=∅"&&w.ctx.currData.lanes.kid_a[id].name==="Math lane",w.log.door); }
{ const w=doorWorld({},fn("cbSetCap"));
  w.call('cbSetCap("kid_a",2)');
  let d=one(w.log); ok("max per day → the door for every subject of the kid the engine lays, Undo = the cap gone (none before)",d&&d.l==="📚 Kid_a: max per day"&&pairStr(d)==="kid_a/math,kid_a/piano,kid_a/geo"&&undoStr(d)==="curriculum/dayCap/kid_a=∅",w.log.door);
  w.log.door.length=0; w.call('cbSetCap("kid_a",0)'); d=one(w.log);
  ok("…clearing it: Undo = 2",undoStr(d)==="curriculum/dayCap/kid_a=2"&&w.log.writes.some(x=>x[0]==="curriculum/dayCap/kid_a"&&x[1]==="remove")); }
{ const w=doorWorld({},fn("ceSetTargetEnd"));
  w.call('ceSetTargetEnd("kid_a","2027-05-28")');
  const d=one(w.log); ok("target end → the door for the kid's subjects, Undo = the date gone",d&&d.l==="📚 Kid_a: target end"&&pairStr(d)==="kid_a/math,kid_a/piano,kid_a/geo"&&undoStr(d)==="curriculum/targetEnd/kid_a=∅",w.log.door); }
{ const w=doorWorld({ceEditKid:"kid_a",ceEditKey:"math",llMsg:"",llSafeUrl:u=>/^https:\/\//.test(u),ceRenderEditSheet:()=>{}},fn("llSetOverride"));
  w.call('llSetOverride("L0002","https://example.org/l2")');
  let d=one(w.log); ok("a lesson link → the door for kid_a/math, Undo = the link gone, no word",d&&d.l==="📚 Math: lesson link"&&pairStr(d)==="kid_a/math"&&undoStr(d)==="curriculum/subjects/kid_a/math/lessonUrls/L0002=∅"&&d.o.toast===false,w.log.door);
  w.log.door.length=0; w.call('llSetOverride("L0002","")'); d=one(w.log);
  ok("…clearing it: Undo = the link",undoStr(d)==='curriculum/subjects/kid_a/math/lessonUrls/L0002="https://example.org/l2"');
  w.log.door.length=0; w.call('llSetOverride("L0002","javascript:alert(1)")');
  ok("…a refused link: no write, no door",w.log.door.length===0); }
{ const w=doorWorld({noCoopDaysOf:s=>(s&&s.noCoopDays)||null,cbKid:null,cbSubjKey:null},fn("cwdUseMonThu"));
  w.ctx.currData.subjects.kid_a.cards.timesPerWeek=4;   // a card-only 4×/wk subject: set, but the door says saved only
  const r=w.call('cwdUseMonThu("kid_a")');
  const d=one(w.log);
  ok("Mon–Thu → ONE door call for every 4×/wk subject set (math + cards; geo already Mon–Thu), Undo = each field as it was",d&&d.l==="🏫 Mon–Thu without co-op"&&pairStr(d)==="kid_a/math,kid_a/cards"&&undoStr(d)==="curriculum/subjects/kid_a/math/noCoopDays=∅|curriculum/subjects/kid_a/cards/noCoopDays=∅",w.log.door);
  ok("…the result names what was set and what the engine re-lays; the Builder gate was not opened",JSON.stringify(r.set)==='["math","cards"]'&&JSON.stringify(r.relaid)==='["math"]'&&w.log.gv.length===0,r);
  ok("…one multi-path update, no whole-node set",w.log.writes.filter(x=>x[1]==="update"&&x[0]==="curriculum/subjects/kid_a").length===1&&!w.log.writes.some(x=>x[1]==="set"&&/subjects/.test(x[0]))); }
{ const w=doorWorld({ceAddKid:"kid_a",ceAddForm:{rules:""},RULE_LABEL:{first:"first of day",last:"last of day",lastOwn:"last of own work"},ceRenderAddSheet:()=>{}},fn("ceAddToggleRule")+"\n"+fn("ceFindRuleOwner"));
  w.call('ceAddToggleRule("first")');
  const d=one(w.log);
  ok("an Add-sheet 'first' rule taken from Math → the door for Math (whose rules were rewritten), Undo = its rules as they were",d&&d.l==="📚 Math: order rule"&&pairStr(d)==="kid_a/math"&&undoStr(d)==='curriculum/subjects/kid_a/math/rules="first,sequential"'&&w.ctx.currData.subjects.kid_a.math.rules==="sequential"&&w.ctx.ceAddForm.rules==="first",w.log.door);
  w.log.door.length=0; w.call('ceAddToggleRule("sequential")');
  ok("…a rule nobody owns: no door call",w.log.door.length===0); }
{ const w=doorWorld({cbMsg:""},fn("_ceRelayAfterMark"));
  w.ctx._gvRelaySubject=undefined;
  w.call('_ceRelayAfterMark("kid_a","math","✓ Marked 1 lesson done")');
  let d=one(w.log); ok("a hand mark with no Builder path → the door for kid_a/math, the message kept",d&&d.l==="✓ Marked 1 lesson done"&&pairStr(d)==="kid_a/math"&&w.ctx.cbMsg==="✓ Marked 1 lesson done",w.log.door);
  w.log.door.length=0; w.call('_ceRelayAfterMark("kid_a","cards","✓ Marked 1 lesson done")');
  ok("…a card-only subject: the old plain message, no door",w.log.door.length===0&&/isn’t Builder-paced/.test(w.ctx.cbMsg));
  w.ctx._gvRelaySubject=(k,s,m)=>{ w.log.gv.push(k+"/"+s); return true; }; w.log.door.length=0; w.call('_ceRelayAfterMark("kid_a","math","m")');
  ok("…the Builder path, when it runs, stays first (it reaches the door through cbApply)",w.log.gv.join()==="kid_a/math"&&w.log.door.length===0); }
{ const w=doorWorld({gvKid:"kid_a",gvMissingDays:()=>["2026-11-12"],_gvWkLabelFor:()=>"Week 1",_gvCadCompact:()=>1,cbTodayISO:()=>"2026-11-10"},fn("gvAddMissingDays"));
  w.call("gvAddMissingDays()");
  const d=one(w.log);
  ok("Add missing days → the door for every subject of the kid, the sweep too, Undo = the lesson grid and weekDays as they were",d&&d.l==="📚 Kid_a: 1 day added"&&pairStr(d)==="kid_a/math,kid_a/piano,kid_a/geo"&&d.o.sweep===true&&d.u.length===2&&d.u[0].p==="curriculum/lessons/kid_a"&&d.u[0].was[3].math==="L3"&&Object.keys(d.u[0].was).length===2&&d.u[1].p==="curriculum/weekDays/kid_a",w.log.door);
  ok("…the grid now has the new day; the Undo copy is not the live object",Object.keys(w.ctx.currData.lessons.kid_a).length===3&&d.u[0].was!==w.ctx.currData.lessons.kid_a); }

console.log("5. a checked card never moves, its text never changes; a class is held");
{ const w=world({nowISO:"2026-11-10T11:00:00"});
  w.ctx.o={todayDay:"tuesday",nowMin:11*60,checked:{p_tue:"10:00 AM Nov 10"},claimed:{},toMin,fromMin,mode:"today",days:["monday","tuesday","wednesday","thursday","friday"],dayCtx:()=>({start:540,end:975}),rules:""};
  w.ctx.live=[{id:"p_tue",who:"kid_a",subjectKey:"piano",day:"tuesday",time:"2:00 PM",dur:20,title:"🎹 Piano"},{id:"p_wed",who:"kid_a",subjectKey:"piano",day:"wednesday",time:"2:00 PM",dur:20,title:"🎹 Piano"}];
  w.ctx.want=[{who:"kid_a",subjectKey:"piano",day:"tuesday",time:"2:00 PM",dur:30,title:"🎹 Piano 30"},{who:"kid_a",subjectKey:"piano",day:"wednesday",time:"2:00 PM",dur:30,title:"🎹 Piano 30"}];
  const r=w.call('_rlwDailyDiff("kid_a","piano",live,want,o)');
  ok("the daily diff in 'today' mode: the checked card on today keeps its minutes and its title; the open card on Wednesday follows",r.upd["p_tue/dur"]===undefined&&r.upd["p_tue/title"]===undefined&&r.upd["p_wed/dur"]===30&&r.upd["p_wed/title"]==="🎹 Piano 30"&&r.summary.kept.indexOf("p_tue")<0,r.upd);
  w.ctx.T=[{id:"m1",who:"kid_a",subjectKey:"math",day:"wednesday",time:"10:00 AM",dur:25},{id:"c1",who:"kid_a",subjectKey:"cls",day:"wednesday",time:"10:00 AM",dur:45},{id:"m2",who:"kid_a",subjectKey:"math",day:"thursday",time:"10:00 AM",dur:25}];
  w.ctx.currData.subjects.kid_a.cls={fixedTime:"10:00 AM"}; w.ctx.fxIsClass=s=>!!(s&&s.fixedTime);
  w.call('before=_rlwSnapOf(T,{checked:{m1:"x"},claimed:{},momMoves:{},todayDay:"tuesday",nowMin:660,isHeld:function(t){ return _rlwIsClass(t); }}); T[0].time="10:30 AM"; T[1].time="11:30 AM"; T[2].time="10:30 AM"; d=_rlwDiff(before,T);');
  const d=w.call("d");
  ok("the relay diff: a checked card that changed is never a 'move'; a fixed-time class that changed trips the wire; the open card is the one move",d.moves.map(m=>m.id).join()==="m2"&&d.locked.join()==="c1"&&d.n===1,d);
  const u=w.call('_rlwUndoUpd({at:1,undo:[{p:"curriculum/lessons/kid_a/3/math",was:"L3"}],moves:[{id:"m2",who:"kid_a",from:{d:"thursday",t:"10:00 AM"},to:{d:"thursday",t:"10:30 AM"}}],removed:[]},T,{wk:"week5",checked:{m2:"done"},claimed:{}})');
  ok("Undo never touches a card checked since (the field still goes back)",u.cards===0&&u.skipped===1&&u.upd["curriculum/lessons/kid_a/3/math"]==="L3",u); }

console.log("6. Undo puts the field and the cards back");
{ const w=world({nowISO:"2026-11-10T11:00:00",sweep:t=>{ t[0].time="10:30 AM"; }});
  w.ctx.currData.lessons.kid_a[3].math="L3b";   // the edit already in this device's copy
  w.call('_rlwCurrDoor("📚 Math: lesson text",[{kid:"kid_a",sk:"math"}],[{p:"curriculum/lessons/kid_a/3/math",was:"L3"}]);'); w.fire();
  const e=w.call("Object.values(relayLogData)[0]");
  ok("the run logged what moved with the field's Undo entry; the banner words",e&&e.n===1&&e.moves[0].id==="a1"&&e.undo[0].p==="curriculum/lessons/kid_a/3/math"&&e.undo[0].was==="L3"&&/📚 Math: lesson text → 1 card moved \(Kid_a 1\)/.test(w.call("_rlwWords(Object.values(relayLogData)[0])")),e);
  ok("the log was written under the week, targeted",w.log.writes.some(x=>x[0]==="week5/relayLog/"+e.at&&x[1]==="set"));
  w.call("relayUndo('"+e.at+"')");
  const root=w.log.writes.find(x=>x[0]==="(root)"&&x[1]==="update");
  ok("Undo: ONE multi-path update — the cell back to L3, the card back to 10:00, the entry marked undone",root&&root[2]["curriculum/lessons/kid_a/3/math"]==="L3"&&root[2]["week5/tasks/a1/time"]==="10:00 AM"&&root[2]["week5/tasks/a1/day"]==="wednesday"&&root[2]["week5/relayLog/"+e.at+"/undone"],root&&root[2]);
  ok("…this device's copy first: the cell reads L3 again, the card is at 10:00",w.ctx.currData.lessons.kid_a[3].math==="L3"&&w.ctx.weekData.tasks[0].time==="10:00 AM");
  ok("…no whole-node write anywhere in the run or the undo",!w.log.writes.some(x=>x[1]==="set"&&(x[0]==="week5/tasks"||x[0]==="curriculum"||/^curriculum\/lessons\/kid_a$/.test(x[0])))); }

console.log("7. the listener");
{ const w=world({currLoaded:false,currData:null,nowISO:"2026-11-10T11:00:00"});
  const V1={subjects:{kid_a:{math:{planId:"p"}}},lessons:{kid_a:{}},weekDays:{kid_a:{}}};
  w.ctx.V1=V1; w.call("currOnValue(V1)");
  ok("the first arrival = the old once: fbCurrLoaded, the copy, the cumulatives, displacement, a redraw, the auto-build timer, the sweep re-armed",w.ctx.fbCurrLoaded===true&&w.ctx.currData===V1&&w.log.pace===1&&w.log.disp===1&&w.log.soon===1&&w.log.timers.some(t=>t.ms===3000&&/autoGenerateWeekIfNeeded/.test(String(t.f)))&&w.log.casc===1&&w.log.dbg.some(m=>/curriculum loaded: kid_a/.test(m)),w.log);
  const w0=world({currLoaded:false,currData:null}); w0.call("currOnValue(null)");
  ok("a brand-new family (no node): the blank skeleton, the sweep re-armed, no auto-build",w0.ctx.fbCurrLoaded===true&&JSON.stringify(w0.ctx.currData)==='{"subjects":{},"lessons":{},"weekDays":{}}'&&w0.log.casc===1&&!w0.log.timers.length);
  // this device's own write, then its echo
  w.call("currStampDb(db)");
  w.call('db.ref("curriculum/subjects/kid_a/math/minutes").set(30)');
  ok("a curriculum write through the stamped db marks lastCurrWrite and still writes",w.ctx.lastCurrWrite===w.D.now()&&w.log.writes.some(x=>x[0]==="curriculum/subjects/kid_a/math/minutes"&&x[1]==="set"&&x[2]===30));
  const V2={subjects:{kid_a:{math:{planId:"p",minutes:30}}},lessons:{kid_a:{}},weekDays:{kid_a:{}}};
  const soon0=w.log.soon, pace0=w.log.pace; w.ctx.V2=V2; w.call("currOnValue(V2)");
  ok("the echo (within 3 s of the write) is skipped: copy, redraw, cumulatives untouched; no sweep, no re-lay",w.ctx.currData===V1&&w.ctx.currData.subjects.kid_a.math.minutes===undefined&&w.log.soon===soon0&&w.log.pace===pace0&&w.log.casc===1&&w.call("_rlwPend")===null&&!w.log.claims.length&&w.log.dbg.some(m=>/skip:curriculum echo/.test(m)));
  // another device's change, 5 s later
  w.D.iso="2026-11-10T11:00:05"; w.ctx.currData.momVerifyKid={kid_a:true};
  const V3={subjects:{kid_a:{math:{planId:"p",minutes:30},piano:{tracking:"daily"}}},lessons:{kid_a:{3:{date:"2026-11-10",math:"L3"}}},dayCap:{kid_a:2}};
  w.ctx.V3=V3; w.call("currOnValue(V3)");
  ok("another device's change: the copy follows key by key (the object stays), the cumulatives and displacement rebuilt, one redraw — never a re-lay, never the sweep",w.ctx.currData===V1&&w.ctx.currData.subjects.kid_a.piano&&w.ctx.currData.subjects.kid_a.math.minutes===30&&w.ctx.currData.dayCap.kid_a===2&&w.ctx.currData.weekDays===undefined&&w.ctx.currData.momVerifyKid.kid_a===true&&w.log.pace===pace0+1&&w.log.disp===2&&w.log.soon===soon0+1&&w.log.casc===1&&w.call("_rlwPend")===null&&!w.log.claims.length&&!w.log.reproj.length&&w.ctx.fbCurrLoaded===true,{pace:w.log.pace,soon:w.log.soon,casc:w.log.casc});
  // a screen mid-edit
  w.D.iso="2026-11-10T11:00:10"; w.ctx.document.activeElement={tagName:"INPUT"}; const soon1=w.log.soon;
  w.ctx.V4={subjects:{kid_a:{math:{planId:"p",minutes:35}}}}; w.call("currOnValue(V4)");
  ok("a screen mid-edit: the data is in, the redraw waits",w.ctx.currData.subjects.kid_a.math.minutes===35&&w.log.soon===soon1);
  w.ctx.document.activeElement=null;
  // uploading / a wiped node
  w.ctx.isUploading=true; w.ctx.V5={subjects:{}}; w.call("currOnValue(V5)");
  ok("while a week upload runs, nothing",w.ctx.currData.subjects.kid_a.math.minutes===35);
  w.ctx.isUploading=false; w.call("currOnValue(null)");
  ok("a wiped node later is never copied over a working screen",w.ctx.currData.subjects.kid_a.math.minutes===35);
  // the stamp
  w.ctx.lastCurrWrite=0; w.call('db.ref("week5/tasks").update({x:1})');
  ok("the stamp: a week write does not mark",w.ctx.lastCurrWrite===0);
  w.call('db.ref().update({"week5/tasks/a1/time":"9:00 AM"})');
  ok("…a root update without a curriculum path does not mark",w.ctx.lastCurrWrite===0);
  w.call('db.ref().update({"week5/tasks/a1/time":"9:00 AM","curriculum/lessons/kid_a/3/math":"L3"})');
  ok("…a root update carrying a curriculum path marks (the Undo's write)",w.ctx.lastCurrWrite>0);
  w.ctx.lastCurrWrite=0; w.call('db.ref("curriculum/dayCap/kid_a").remove()');
  ok("…a remove marks",w.ctx.lastCurrWrite>0);
  w.ctx.lastCurrWrite=0; w.call('db.ref("curriculum").update({"lastEdit":"x"})');
  ok("…an update on the node itself marks",w.ctx.lastCurrWrite>0);
  w.ctx.lastCurrWrite=0; w.call('db.ref("curriculumX/y").set(1)');
  ok("…a look-alike path does not",w.ctx.lastCurrWrite===0);
  const n=w.log.writes.length; w.call('db.ref("curriculum").on("value",function(){})');
  ok("…reads pass straight through",w.log.writes.length===n+1&&w.log.writes[n][1]==="on"&&w.ctx.lastCurrWrite===0);
  const before=w.ctx.db.ref; w.call("currStampDb(db)");
  ok("…wrapping twice is a no-op",w.ctx.db.ref===before&&w.ctx.db._currStamped===true);
  ok("currStampDb(null) is harmless",w.call("currStampDb(null)")===null); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
