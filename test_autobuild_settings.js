/*
 * 🗓 AUTOBUILD — the week builds itself, properly (slice B of PLAN_living_schedule_finish_2026-11-08.md; her words 11/8:
 * "without having to say regenerate or generate"). Against code sliced out of index.html:
 *   0. shape: one AUTOBUILD block, no kid or family names; dayRollCheck calls the self-build; reprojectSubjectWeek and the
 *      self-build both build from gwEffectiveConfig (the fixed config is gone from the self-build); the week listeners fill the
 *      saved-settings cache; the what-moved line knows a built entry
 *   1. the merge (_abMerge): nothing saved → the fixed defaults; a saved weekConfig wins over the defaults (sitter, withSitter,
 *      skipDays, lateStart, carSchool, Saturday, redistribute; the legacy sitter key too); the grid's planned Saturday is never
 *      dropped; a date's own LATER start wins over a saved late start, an earlier one does not; Sunday catch-up per kid and the
 *      calendar's off days ride along; the saved object is never mutated
 *   2. the live wrapper (gwEffectiveConfig): the week's dates (Sunday only once a kid has Sunday catch-up), the cache
 *   3. Mom's words (_abWords / _abWhen): the full line, nothing after the count when nothing is special, "Sun 00:00"
 *   4. the day roll: Saturday → Sunday of a not-yet-built week fires the self-build once; the same date again, Sunday → Monday
 *      of the same week and a mid-week roll fire nothing
 *   5. one builder: two devices pass the tasks-empty check — the claim lets one build and the other does nothing but wait;
 *      a dead builder's claim (older than 2 min) is taken over; ?dryrun=1 generates in memory and writes nothing; the build reads
 *      weekConfig/<wn> from the server and builds with it; a week that already has cards is adopted, never rebuilt
 *   6. her question 2 (_abDue): "midnight" always builds; "start" waits on a Sunday until that Sunday's school start
 *   7. the banner line: a built entry shows on its day and the day after, with no clock prefix and no Undo
 *   run:  node test_autobuild_settings.js
 */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name,from){ from=from||src; const sig="function "+name+"("; const i=from.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=from.indexOf("{",i);k<from.length;k++){ if(from[k]==="{")d++; else if(from[k]==="}"){ d--; if(!d) return from.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const A=src.indexOf("// AUTOBUILD_START"), B=src.indexOf("// AUTOBUILD_END");
const BLK=src.slice(A,B);
const RealDate=Date;
const frozen=iso=>class F extends RealDate{ constructor(...a){ if(!a.length) super(iso); else super(...a); } static now(){ return new RealDate(iso).getTime(); } };
const ISO=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");

console.log("0. shape");
{ ok("one AUTOBUILD block",A>0&&B>A&&src.indexOf("// AUTOBUILD_START",A+1)<0);
  ok("no kid or family names in the block",!/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|sara|howe|dewalt|burris/i.test(BLK));
  ok("the block defines the merge, the words, the day-roll door, the claim and the self-build",["function gwEffectiveConfig(","function _abMerge(","function _abWords(","function autoBuildOnDayRoll(","function _abClaimTx(","function _abClaim(","function _abBuild(","function autoGenerateWeekIfNeeded("].every(s=>BLK.indexOf(s)>=0));
  ok("the constant for her question 2 is in the block, default midnight",/const AUTOBUILD_SUNDAY_AT="midnight"/.test(BLK));
  ok("dayRollCheck calls the self-build",/autoBuildOnDayRoll\(\)/.test(fn("dayRollCheck")));
  const ag=fn("autoGenerateWeekIfNeeded"); ok("the self-build no longer builds from a fixed config",!/babysitter:\{\},withSitter:\[\]/.test(ag)&&/_abClaim\(wn/.test(ag)&&/_abLoadSaved\(wn/.test(ag));
  ok("the adopt path (a week that already has cards) is still there",/wkHandoverTo\(wn,_existing/.test(ag));
  ok("reprojectSubjectWeek builds from gwEffectiveConfig",/gwEffectiveConfig\(wn\)/.test(fn("reprojectSubjectWeek")));
  ok("the week listeners fill the saved-settings cache (a read)",/_abLoadSaved\(_wkNumOf\(wk\)\)/.test(fn("attachWeekListeners")));
  ok("the what-moved words know a built entry",/if\(e\.built\) return String\(e\.label/.test(fn("_rlwWords")));
  ok("the self-build writes weekConfig nowhere",!/weekConfig\/[^"]*"\)\.(set|update)/.test(BLK)&&!/weekConfig.*\.set\(/.test(BLK));
  ok("the block touches the database in five places: the tasks and meta reads (adopt), the weekConfig read, the claim transaction, the relayLog note",(BLK.match(/db\.ref\(/g)||[]).length===5&&/tasks"\)\.once/.test(BLK)&&/meta"\)\.once/.test(BLK)&&/weekConfig\/"\+wn\)\.once/.test(BLK)&&/meta\/building"\)\.transaction/.test(BLK)&&/relayLog\/"\+at\)\.set/.test(BLK));
  ok("…and never a whole-node set of tasks / checked / meta",!/\/(tasks|checked|history|meta)"\)\.set\(/.test(BLK)); }

// ── run the block in a sandbox ──
function runBlock(env){
  const base={console,JSON,Math,Object,Array,Set,Map,String,Number,parseInt,isNaN,Promise,Date:RealDate,
    db:null,currData:null,rulesData:{},ROSTER:["kid_a","kid_b"],HA_DEV_ID:"dev_x",HA_LS:{setItem(){},getItem(){return null;}},
    fbCheckedLoaded:true,fbTasksLoaded:true,fbArchiveLoaded:true,_haMastReady:true,
    weekNumForDate:()=>12,_todayStr:()=>"2026-11-15",currWeekNum:()=>11,_activeWeekEmpty:()=>false,
    gwWeekDateRange:wn=>({start:"2026-11-16",end:"2026-11-22"}),gwParseDate:s=>new RealDate(s+"T12:00:00"),gwSatPlanned:()=>false,
    dtLeaf:()=>null,dtUsual:()=>({s:600,e:975,ls:780,le:840}),sucOn:()=>false,sucAny:()=>false,smapIsKidOff:()=>null,toMin,gwNormSitter:v=>(typeof v==="string"?{start:"10:00 AM",end:v}:v),
    cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),generateWeek:()=>({result:{tasks:[]}}),gwCommit(){},pgAutoApplyAll(){},renderAll(){},dbg(){},
    _dryRun:()=>false,wkHandoverTo(){},haClaimSchedLock:(k,cb)=>cb(function(){}),setTimeout:()=>0,stTodayIso:()=>"2026-11-15",dtDay:()=>({s:540}),
    _rlwWords:null};
  Object.assign(base,env||{});
  const keys=Object.keys(base);
  const body='"use strict"; let gwConfig=null,gwResult=null,gwDropped=null,gwCarryOverCount=0,gwCursors=null,gwCalendarSkips=null,relayLogData={};\n'+BLK+
    '\nreturn {gwEffectiveConfig,_abMerge,_abWords,_abWhen,_abDue,_abRollWants,_abClaimTx,_abDueCtx,_abLoadSaved,_abClaim,_abNote,_abBuild,autoBuildOnDayRoll,autoGenerateWeekIfNeeded,'+
    'get tried(){ return _autoGenTried; },set tried(v){ _autoGenTried=v; },get gwConfig(){ return gwConfig; },get relayLogData(){ return relayLogData; },get cache(){ return _abSavedCfg; },AUTOBUILD_CLAIM_MS};';
  return new Function(...keys,body)(...keys.map(k=>base[k]));
}

console.log("1. the merge");
{ const R=runBlock();
  const ctx0={withSitter:["kid_b"],satPlanned:false,dates:{},roster:["kid_a","kid_b"],toMin,normSitter:v=>v};
  const d=R._abMerge(12,null,ctx0);
  ok("nothing saved → the fixed defaults",d.weekNum==="12"&&!Object.keys(d.babysitter).length&&d.skipDays.length===0&&!Object.keys(d.lateStart).length&&!Object.keys(d.carSchool).length&&d.saturday===false&&d.redistribute.length===0&&d.autoAdvance===true,d);
  ok("withSitter falls back to Settings (as a Regenerate does)",JSON.stringify(d.withSitter)==='["kid_b"]');
  ok("the grid's planned Saturday → Saturday on",R._abMerge(12,null,Object.assign({},ctx0,{satPlanned:true})).saturday===true);
  const saved={weekNum:"12",babysitter:{tuesday:{start:"9:00 AM",end:"1:00 PM"},thursday:"2:00 PM"},withSitter:["kid_a"],skipDays:["friday"],lateStart:{monday:"11:00 AM"},carSchool:{wednesday:{end:"12:30 PM",note:"Trip"}},saturday:true,redistribute:["x"]};
  const snap=JSON.stringify(saved);
  const s=R._abMerge(12,saved,Object.assign({},ctx0,{normSitter:v=>(typeof v==="string"?{start:"10:00 AM",end:v}:v)}));
  ok("saved sitter days win (normalized)",JSON.stringify(s.babysitter)===JSON.stringify({tuesday:{start:"9:00 AM",end:"1:00 PM"},thursday:{start:"10:00 AM",end:"2:00 PM"}}),s.babysitter);
  ok("saved withSitter, skipDays, lateStart, carSchool, Saturday, redistribute win over the defaults",JSON.stringify(s.withSitter)==='["kid_a"]'&&JSON.stringify(s.skipDays)==='["friday"]'&&s.lateStart.monday==="11:00 AM"&&s.carSchool.wednesday.end==="12:30 PM"&&s.saturday===true&&JSON.stringify(s.redistribute)==='["x"]');
  ok("the saved object is never mutated",JSON.stringify(saved)===snap);
  ok("saved Saturday off + the grid plans Saturday → Saturday stays on (lessons are never dropped)",R._abMerge(12,{saturday:false},Object.assign({},ctx0,{satPlanned:true})).saturday===true);
  ok("saved Saturday on + no planned Saturday → on",R._abMerge(12,{saturday:true},ctx0).saturday===true);
  ok("the legacy sitter key (maggie) is read",Object.keys(R._abMerge(12,{maggie:{monday:{start:"9:00 AM",end:"noon"}}},ctx0).babysitter).join()==="monday");
  // by-date layer
  const dates={monday:"2026-11-16",tuesday:"2026-11-17",wednesday:"2026-11-18",thursday:"2026-11-19",friday:"2026-11-20",saturday:"2026-11-21"};
  const leaves={"2026-11-16":{start:"11:30 AM"},"2026-11-17":{start:"9:00 AM"},"2026-11-18":{end:"2:00 PM"}};
  const ctx1=Object.assign({},ctx0,{dates,leaf:iso=>leaves[iso]||null,usualStart:()=>600});
  const b=R._abMerge(12,{lateStart:{monday:"11:00 AM",thursday:"11:00 AM"}},ctx1);
  ok("a date's own LATER start wins over the saved late start",b.lateStart.monday==="11:30 AM",b.lateStart);
  ok("an earlier date start is not a late start (the generator lays from it itself)",b.lateStart.tuesday===undefined);
  ok("a saved late start on a date with no leaf stays",b.lateStart.thursday==="11:00 AM");
  ok("a date with only its own finish is remembered, no late start",b.dayTimes.wednesday&&b.dayTimes.wednesday.end==="2:00 PM"&&b.lateStart.wednesday===undefined);
  ok("the balancer never sees a start it cannot read",R._abMerge(12,null,Object.assign({},ctx1,{leaf:()=>({start:"soon"})})).lateStart.monday===undefined);
  // Sunday per kid + off days
  const c=R._abMerge(12,null,Object.assign({},ctx1,{sunOn:k=>k==="kid_b",kidOff:(k,iso)=>(k==="kid_a"&&iso==="2026-11-18")?"Sick":(iso==="2026-11-20"?"Holiday":null)}));
  ok("Sunday catch-up per kid rides along (only the switched-on kid)",JSON.stringify(c.sunday)==='["kid_b"]');
  ok("the calendar's off days per kid ride along",JSON.stringify(c.off)===JSON.stringify({wednesday:["kid_a"],friday:["kid_a","kid_b"]}),c.off);
  ok("…and never become skip days (the generator honours the calendar per kid; the day keeps its date)",c.skipDays.length===0);
  ok("a throwing helper never breaks the merge",(()=>{ try{ const m=R._abMerge(12,null,Object.assign({},ctx1,{leaf:()=>{ throw new Error("x"); },kidOff:()=>{ throw new Error("y"); },sunOn:()=>{ throw new Error("z"); }})); return m&&m.weekNum==="12"; }catch(e){ return false; } })()); }

console.log("2. the live wrapper");
{ const R=runBlock({sucAny:()=>false});
  const e=R.gwEffectiveConfig(12,null);
  ok("the fixed defaults with nothing saved and nothing by date",e.weekNum==="12"&&e.saturday===false&&!Object.keys(e.babysitter).length&&!Object.keys(e.lateStart).length);
  let seen=[]; const R2=runBlock({sucAny:()=>true,sucOn:k=>k==="kid_a",dtLeaf:iso=>{ seen.push(iso); return null; }});
  R2.gwEffectiveConfig(12,null);
  ok("the week's dates are Monday–Saturday + the Sunday BEFORE Monday once a kid has Sunday catch-up",JSON.stringify(seen.sort())===JSON.stringify(["2026-11-15","2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21"]),seen);
  seen=[]; const R3=runBlock({sucAny:()=>false,dtLeaf:iso=>{ seen.push(iso); return null; }}); R3.gwEffectiveConfig(12,null);
  ok("no Sunday catch-up → no Sunday date",seen.length===6&&seen.indexOf("2026-11-15")<0);
  R.cache[12]={saturday:true,babysitter:{tuesday:{start:"9:00 AM",end:"1:00 PM"}}};
  const f=R.gwEffectiveConfig(12);
  ok("with no saved given, the server-read cache is the saved config",f.saturday===true&&!!f.babysitter.tuesday);
  ok("a saved config given explicitly wins over the cache",R.gwEffectiveConfig(12,null).saturday===false); }

console.log("3. Mom's words");
{ const R=runBlock();
  const cfg={weekNum:"12",babysitter:{tuesday:{start:"9:00 AM",end:"1:00 PM"}},off:{wednesday:["kid_a"]},skipDays:[],lateStart:{},carSchool:{},saturday:false,sunday:[]};
  ok("the full line",R._abWords(cfg,112,"Sun 00:00")==="🗓 Week 12 built itself (Sun 00:00) — 112 cards, sitter Tue, Wed off for Kid_a",R._abWords(cfg,112,"Sun 00:00"));
  ok("nothing special → nothing after the count",R._abWords({weekNum:"12"},98,"Sun 00:00")==="🗓 Week 12 built itself (Sun 00:00) — 98 cards");
  ok("one card",/— 1 card$/.test(R._abWords({weekNum:"12"},1,"Sun 00:00")));
  const all=R._abWords({weekNum:"12",babysitter:{monday:{},thursday:{}},off:{},skipDays:["friday"],lateStart:{tuesday:"11:00 AM"},carSchool:{wednesday:{end:"12:30 PM"}},saturday:true,sunday:["kid_b"]},50,"Sun 00:00");
  ok("every special thing in order: sitter, no school, late start, car school, Saturday, Sunday catch-up",all==="🗓 Week 12 built itself (Sun 00:00) — 50 cards, sitter Mon Thu, no school Fri, Tue starts 11:00 AM, Wed car school until 12:30 PM, Saturday on, Sunday catch-up for Kid_b",all);
  ok("when: Sunday midnight reads Sun 00:00",R._abWhen(new RealDate("2026-11-15T00:00:00"))==="Sun 00:00");
  ok("when: a Monday morning page load reads Mon 07:12",R._abWhen(new RealDate("2026-11-16T07:12:00"))==="Mon 07:12"); }

console.log("4. the day roll");
{ function roll(seq){
    // seq: [{iso, todayWn, currWn}] — the dates the device wakes on, in order
    const calls=[]; let cur=null;
    const R=runBlock({weekNumForDate:()=>cur.todayWn,_todayStr:()=>cur.iso,currWeekNum:()=>cur.currWn,_activeWeekEmpty:()=>false,
      db:{ref:()=>({once:(ev,cb)=>{ calls.push("once"); }})},currData:{subjects:{},weekDays:{},lessons:{}}});
    const DRC=fn("dayRollCheck");
    const env={autoBuildOnDayRoll:()=>{ calls.push("roll:"+cur.iso); return R.autoBuildOnDayRoll(); },renderAll(){},console};
    const keys=Object.keys(env);
    const run=new Function(...keys,'"use strict"; const DOW_NAMES=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]; let _seen=null, day=null;\n'+
      'function todayDay(){ return DOW_NAMES[new Date(__iso+"T09:00:00").getDay()]; } let __iso=null; let _dayRollSeen=null;\n'+DRC+
      '\nreturn function(iso,first){ __iso=iso; if(first){ _dayRollSeen=todayDay(); day=_dayRollSeen; return false; } return dayRollCheck(); };')(...keys.map(k=>env[k]));
    const out=[]; seq.forEach((s,i)=>{ cur=s; out.push(run(s.iso,i===0)); });
    return {calls,out,R};
  }
  const a=roll([{iso:"2026-11-14",todayWn:11,currWn:11},{iso:"2026-11-15",todayWn:12,currWn:11},{iso:"2026-11-15",todayWn:12,currWn:11}]);
  ok("Saturday → Sunday of a not-yet-built week: the self-build fires once",a.calls.filter(c=>c==="once").length===1&&a.calls.filter(c=>/^roll:/.test(c)).length===1,a.calls);
  ok("the same Sunday seen again (a wake, the minute tick) fires nothing more",a.out[2]===false&&a.calls.filter(c=>c==="once").length===1);
  const b=roll([{iso:"2026-11-15",todayWn:12,currWn:12},{iso:"2026-11-16",todayWn:12,currWn:12},{iso:"2026-11-17",todayWn:12,currWn:12}]);
  ok("Sunday → Monday → Tuesday inside the built week: the day rolls, the self-build never fires",b.out[1]===true&&b.out[2]===true&&b.calls.filter(c=>c==="once").length===0,b.calls);
  const c=roll([{iso:"2026-11-14",todayWn:11,currWn:11},{iso:"2026-11-15",todayWn:null,currWn:11}]);
  ok("a Sunday past the grid (no plan week) fires nothing",c.calls.filter(x=>x==="once").length===0);
  const R=runBlock(); R.tried=true;
  ok("_abRollWants: a later plan week, or an empty active week, wants a build; otherwise not",R._abRollWants({todayWn:12,currWn:11})===true&&R._abRollWants({todayWn:12,currWn:12,activeEmpty:true})===true&&R._abRollWants({todayWn:12,currWn:12})===false&&R._abRollWants({todayWn:null,currWn:11})===false);
  // the page-load once-guard is reset by the roll
  let built=0; const R2=runBlock({db:{ref:()=>({once:(ev,cb)=>{ built++; }})},currData:{subjects:{},weekDays:{},lessons:{}},weekNumForDate:()=>12,currWeekNum:()=>11});
  R2.tried=true; R2.autoGenerateWeekIfNeeded(); ok("after a page-load run the once-guard holds",built===0);
  R2.autoBuildOnDayRoll(); ok("the day roll resets it and runs the self-build",built===1&&R2.tried===true); }

// ── a tiny Firebase: the two transactions + the reads/writes a build makes ──
function fakeDb(state,log){
  state=state||{}; log=log||[]; const q=[];   // reads answer in order on flush(), like a network does — two devices both pass a check before either acts
  const get=p=>p.split("/").reduce((o,k)=>(o&&o[k]!==undefined)?o[k]:null,state);
  const set=(p,v)=>{ const ks=p.split("/"); let o=state; ks.slice(0,-1).forEach(k=>{ o=o[k]=o[k]||{}; }); o[ks[ks.length-1]]=v; };
  return {log,state,ref:p=>({
    once:(ev,cb,err)=>{ log.push("once "+p); q.push(()=>cb({val:()=>get(p)})); },
    set:v=>{ log.push("set "+p); set(p,v); return Promise.resolve(); },
    update:v=>{ log.push("update "+p); return Promise.resolve(); },
    remove:()=>{ log.push("remove "+p); },
    transaction:(f,done)=>{ log.push("tx "+p); const cur=get(p); const nv=f(cur); if(nv===undefined){ done(null,false,{val:()=>cur}); return; } set(p,nv); done(null,true,{val:()=>nv}); }
  }),flush(){ while(q.length) q.shift()(); }};
}
console.log("5. one builder, the saved settings, dry run, adopt");
{ function device(id,db,extra,now){
    const built=[], dbgs=[], timers=[];
    const R=runBlock(Object.assign({db,HA_DEV_ID:id,currData:{subjects:{},weekDays:{},lessons:{}},Date:frozen(now||"2026-11-15T00:00:30"),
      generateWeek:cfg=>{ built.push(JSON.parse(JSON.stringify(cfg))); return {result:{tasks:[{id:"a"},{id:"b"},{id:"c"}]},dropped:[],cursors:{x:1}}; },
      gwCommit:()=>{ built.push("COMMIT"); db.ref("week12/meta").set({week:"week12",dates:{}}); },
      dbg:m=>dbgs.push(m),setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },
      haClaimSchedLock:(k,cb)=>cb(function(){ built.push("RELEASE"); })},extra||{}));
    const run=()=>{ R.autoGenerateWeekIfNeeded(); db.flush(); };
    return {R,built,dbgs,timers,run};
  }
  // two devices, same empty week, both pass the tasks-empty check (the lock stub lets both in → the claim must decide)
  { const db=fakeDb({weekConfig:{}});
    const A=device("dev_a",db), Bd=device("dev_b",db);
    A.R.autoGenerateWeekIfNeeded(); Bd.R.autoGenerateWeekIfNeeded(); db.flush();   // both pass the tasks-empty check, then act
    ok("device A takes the claim and builds once (generate → commit → release)",A.built.length===3&&typeof A.built[0]==="object"&&A.built[1]==="COMMIT"&&A.built[2]==="RELEASE",A.built);
    ok("device B sees the claim and does nothing but release and wait",Bd.built.length===1&&Bd.built[0]==="RELEASE"&&Bd.dbgs.some(m=>/another device is building/.test(m)),Bd.built);
    ok("device B looks again only after the claim would have expired (2 min + 30 s)",Bd.timers.length===1&&Bd.timers[0].ms===A.R.AUTOBUILD_CLAIM_MS+30000&&A.R.AUTOBUILD_CLAIM_MS===120000);
    ok("the claim was taken by a transaction on week12/meta/building, by both",db.log.filter(l=>l==="tx week12/meta/building").length===2);
    ok("gwCommit's meta write clears the claim",db.state.week12.meta.building===undefined);
    ok("Mom's note is one targeted relayLog write on the new week, built:true, no Undo",db.log.filter(l=>/^set week12\/relayLog\//.test(l)).length===1&&(()=>{ const k=Object.keys(db.state.week12.relayLog)[0]; const e=db.state.week12.relayLog[k]; return e.built===true&&!e.undo&&e.why==="autobuild"&&/^🗓 Week 12 built itself \(Sun 00:00\) — 3 cards$/.test(e.label); })(),db.state.week12.relayLog);
    ok("device B wrote nothing — one note, device A's; no commit from B",Bd.built.indexOf("COMMIT")<0&&Object.values(db.state.week12.relayLog).every(e=>e.dev==="dev_a")&&db.log.filter(l=>/^set /.test(l)).length===2); }
  // a dead builder's claim is taken over
  { const db=fakeDb({week12:{meta:{building:{dev:"dev_dead",at:new RealDate("2026-11-15T00:00:30").getTime()-121000}}}});
    const A=device("dev_a",db); A.run();
    ok("a claim older than 2 minutes belongs to a dead builder — this device builds",A.built.indexOf("COMMIT")>=0&&db.state.week12.meta.building===undefined);
    const db2=fakeDb({week12:{meta:{building:{dev:"dev_live",at:new RealDate("2026-11-15T00:00:30").getTime()-60000}}}});
    const B2=device("dev_a",db2); B2.run();
    ok("a claim a minute old is a live builder's — this device waits",B2.built.indexOf("COMMIT")<0&&db2.state.week12.meta.building.dev==="dev_live");
    const R=runBlock(); const now=1000000;
    ok("_abClaimTx: own stale claim is renewed; another's fresh claim aborts; another's stale claim is taken",R._abClaimTx({dev:"dev_x",at:now-500000},"dev_x",now).dev==="dev_x"&&R._abClaimTx({dev:"o",at:now-1000},"dev_x",now)===undefined&&R._abClaimTx({dev:"o",at:now-120001},"dev_x",now).dev==="dev_x"&&R._abClaimTx(null,"dev_x",now).at===now); }
  // dry run
  { const db=fakeDb({weekConfig:{12:{saturday:true}}});
    const A=device("dev_a",db,{_dryRun:()=>true}); A.run();
    ok("?dryrun=1: the week is generated in memory and logged, never committed",A.built.length===2&&typeof A.built[0]==="object"&&A.built[1]==="RELEASE"&&A.dbgs.some(m=>/dry run — would build: 🗓 Week 12 built itself \(Sun 00:00\) — 3 cards, Saturday on/.test(m)),A.dbgs);
    ok("?dryrun=1: nothing is written — no transaction, no set, no update",!db.log.some(l=>/^(tx|set|update|remove)/.test(l)),db.log);
    ok("?dryrun=1: the saved settings were still read (a read)",db.log.indexOf("once weekConfig/12")>=0); }
  // the saved settings reach the build
  { const db=fakeDb({weekConfig:{12:{weekNum:"12",babysitter:{tuesday:{start:"9:00 AM",end:"1:00 PM"}},withSitter:["kid_a"],skipDays:["friday"],lateStart:{monday:"11:00 AM"},saturday:true}}});
    const A=device("dev_a",db,{smapIsKidOff:(k,iso)=>(k==="kid_b"&&iso==="2026-11-18")?"Sick":null}); A.run();
    const cfg=A.built[0];
    ok("weekConfig/12 was read from the server once, before the build",db.log.indexOf("once weekConfig/12")>=0&&db.log.indexOf("once weekConfig/12")<db.log.findIndex(l=>/relayLog/.test(l)));
    ok("the build ran with the saved sitter, withSitter, skip day, late start and Saturday",cfg&&cfg.babysitter.tuesday&&cfg.babysitter.tuesday.end==="1:00 PM"&&JSON.stringify(cfg.withSitter)==='["kid_a"]'&&JSON.stringify(cfg.skipDays)==='["friday"]'&&cfg.lateStart.monday==="11:00 AM"&&cfg.saturday===true,cfg);
    ok("gwConfig is the effective config (the override sync sees the real shape)",A.R.gwConfig&&A.R.gwConfig.saturday===true&&A.R.gwConfig.weekNum==="12");
    const e=Object.values(db.state.week12.relayLog)[0];
    ok("Mom's note says what was special",e.label==="🗓 Week 12 built itself (Sun 00:00) — 3 cards, sitter Tue, Wed off for Kid_b, no school Fri, Mon starts 11:00 AM, Saturday on",e.label);
    ok("the cache holds the saved config for the re-lays",A.R.cache[12]&&A.R.cache[12].saturday===true); }
  // adopt: a week that already has cards is never rebuilt
  { const db=fakeDb({week12:{tasks:{t1:{id:"t1"}},meta:{week:"week12"}}}); let handed=null;
    const A=device("dev_a",db,{wkHandoverTo:(wn,t,m)=>{ handed={wn,t,m}; }}); A.run();
    ok("a week with cards is adopted (wkHandoverTo), not built",handed&&handed.wn===12&&handed.t.t1&&A.built.indexOf("COMMIT")<0&&!db.log.some(l=>/^tx week12\/meta\/building/.test(l))); }
  // lock refused → nothing
  { const db=fakeDb({}); const A=device("dev_a",db,{haClaimSchedLock:(k,cb)=>cb(null)}); A.run();
    ok("the scheduler lock held elsewhere → no claim, no build",A.built.length===0&&!db.log.some(l=>/^tx/.test(l))); }
  // the generator fails → the lock is released, nothing written
  { const db=fakeDb({}); const A=device("dev_a",db,{generateWeek:()=>({error:"No curriculum"})}); A.run();
    ok("a generator error releases the lock and writes no note",A.built.indexOf("RELEASE")>=0&&!db.log.some(l=>/relayLog/.test(l))&&A.dbgs.some(m=>/skipped: No curriculum/.test(m))); } }

console.log("6. her question 2");
{ const R=runBlock();
  ok("midnight (the default): a Sunday 00:00 build runs at once",R._abDue({dow:0,nowMin:0,startMin:540},"midnight")===true&&R._abDue({dow:0,nowMin:0,startMin:540})===true);
  ok("start: a Sunday waits until that Sunday's school start",R._abDue({dow:0,nowMin:0,startMin:540},"start")===false&&R._abDue({dow:0,nowMin:539,startMin:540},"start")===false&&R._abDue({dow:0,nowMin:540,startMin:540},"start")===true);
  ok("start: no kid has Sunday catch-up (no Sunday start) → builds at 00:00",R._abDue({dow:0,nowMin:0,startMin:null},"start")===true);
  ok("start: any other day builds at once",R._abDue({dow:1,nowMin:0,startMin:540},"start")===true);
  const C=runBlock({Date:frozen("2026-11-15T06:00:00"),sucAny:()=>true,dtDay:(dn,iso)=>({s:(dn==="sunday"&&iso==="2026-11-15")?540:null})});
  const c=C._abDueCtx(); ok("the live context: Sunday, 06:00, that Sunday's start 9:00",c.dow===0&&c.nowMin===360&&c.startMin===540,c);
  const C2=runBlock({Date:frozen("2026-11-15T06:00:00"),sucAny:()=>false}); ok("…and no Sunday start when no kid is switched on",C2._abDueCtx().startMin===null);
  // the self-build in "start" mode: not due → waits a minute, no claim
  { const db=fakeDb({}); let timers=[]; const blk=BLK.replace('const AUTOBUILD_SUNDAY_AT="midnight"','const AUTOBUILD_SUNDAY_AT="start"');
    const keys=["db","currData","Date","sucAny","dtDay","setTimeout","console","JSON","Object","Array","String","Number","Math","parseInt","isNaN","weekNumForDate","_todayStr","currWeekNum","_activeWeekEmpty","fbCheckedLoaded","fbTasksLoaded","fbArchiveLoaded","_haMastReady","stTodayIso","dbg","_dryRun","HA_DEV_ID"];
    const vals=[db,{subjects:{},weekDays:{},lessons:{}},frozen("2026-11-15T06:00:00"),()=>true,()=>({s:540}),(f,ms)=>{ timers.push(ms); },console,JSON,Object,Array,String,Number,Math,parseInt,isNaN,()=>12,()=>"2026-11-15",()=>11,()=>false,true,true,true,true,()=>"2026-11-15",()=>{},()=>false,"dev_a"];
    const out=new Function(...keys,'"use strict"; let gwConfig,gwResult,gwDropped,gwCarryOverCount,gwCursors,gwCalendarSkips,relayLogData={};\n'+blk+'\nautoGenerateWeekIfNeeded(); return {tried:_autoGenTried};')(...vals);
    ok("start mode, Sunday 06:00 before a 9:00 start: the build waits a minute and touches nothing",out.tried===false&&timers.length===1&&timers[0]===60000&&db.log.length===0,{timers,log:db.log}); } }

console.log("7. the banner line");
{ const FNS=[fn("_rlwWords"),fn("_rlwLast"),fn("_rlwCanUndo"),fn("relayLineHTML")].join("\n");
  function run(log,iso,mom){
    const env={relayLogData:log,RLW_UNDO_MS:15*60*1000,momHere:()=>mom!==false,cap:s=>s,esc:s=>String(s),fromMin:n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; },Date:frozen(iso),console,JSON,Object,String,Math};
    const keys=Object.keys(env);
    return new Function(...keys,'"use strict";'+FNS+'\nreturn {words:_rlwWords,last:_rlwLast,html:relayLineHTML};')(...keys.map(k=>env[k]));
  }
  const at=new RealDate("2026-11-15T00:00:30").getTime();
  const built={label:"🗓 Week 12 built itself (Sun 00:00) — 112 cards, sitter Tue",why:"autobuild",at,n:0,moves:[],removed:[],built:true};
  const r1=run({[at]:built},"2026-11-15T07:00:00");
  ok("the words of a built entry are its label",r1.words(built)===built.label);
  ok("Sunday morning: the line shows",r1.last()===built);
  const r2=run({[at]:built},"2026-11-16T07:30:00");
  ok("Monday morning (the day after): the line still shows",r2.last()===built);
  const h=r2.html(); ok("…with no clock prefix and no Undo",h.indexOf("🗓 Week 12 built itself")>=0&&h.indexOf("🔁 ")<0&&h.indexOf("Undo")<0,h);
  ok("Tuesday: gone",run({[at]:built},"2026-11-17T07:00:00").last()===null);
  ok("Mom only",run({[at]:built},"2026-11-16T07:30:00",false).html()==="");
  const relay={label:"⏰ Mon",at:new RealDate("2026-11-15T10:00:00").getTime(),n:1,moves:[{who:"kid_a"}],removed:[]};
  ok("an ordinary re-lay entry still shows only on its own day",run({[relay.at]:relay},"2026-11-15T12:00:00").last()===relay&&run({[relay.at]:relay},"2026-11-16T07:00:00").last()===null);
  ok("the newest entry wins (a Monday re-lay replaces the built line)",run({[at]:built,[relay.at+864e5]:Object.assign({},relay,{at:relay.at+864e5})},"2026-11-16T12:00:00").last().label==="⏰ Mon");
  ok("an ordinary entry's words are untouched",r1.words(relay)==="⏰ Mon → 1 card moved (kid_a 1)"); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
