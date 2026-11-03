/*
 * 🔁 RELAY — one re-lay door (her yes 2026-11-03; PLAN_day_adjust_2026-10-29 step 4, slice 1). Against code sliced out of
 * index.html:
 *   0. shape: one RELAY block; the 😷 toggle, ⏰ day-times save/clear and the 8 PM sweep go through it; the listener sweep
 *      (schedCascade) never does; the lock waits for a "relay" claim like a regen; no kid names in the block
 *   1. the REAL cascade: a kid marked off on a LATER day → that day's open cards move into the rest of the week now (never back
 *      onto the off day, lesson order kept); dailies, claimed and checked cards stay; a holiday alone or no mark → untouched
 *   2. the REAL school-end guard: open work laid before the day's start (⏰ a later start) re-lays from the start; a started
 *      card and the display pass are untouched; a day at or after its start is still "fine"
 *   3. the door: ten taps → one run under one lock; the lock held → waits, then gives up with a plain toast; the first "was"
 *      wins for Undo; the diff lists what moved (checked / claimed never), a held card that changed day trips the wire; the
 *      log is one targeted write per run, the newest 10 kept; ?dryrun=1 writes nothing; the banner line is Mom-only with
 *      Undo for 15 minutes; Undo puts the trigger's paths and only the still-unmoved cards back in one multi-path update
 *   4. the callers: the toggle re-lays any date of the week on the board with an Undo path; ⏰ save carries the leaves as
 *      they were
 *   run:  node test_relay_week.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };

console.log("0. shape");
{ const a=src.indexOf("// RELAY_START"), b=src.indexOf("// RELAY_END");
  ok("one RELAY block",a>0&&b>a&&src.indexOf("// RELAY_START",a+1)<0);
  const blk=src.slice(a,b);
  ok("no kid or family names in the block",!/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|sara|howe|dewalt|burris/i.test(blk));
  ok("the block defines relayWeek, _rlwRun, relayLineHTML, relayUndo, dtUndoSnap",["function relayWeek(","function _rlwRun(","function relayLineHTML(","function relayUndo(","function dtUndoSnap("].every(s=>blk.indexOf(s)>=0));
  const tog=fn("schedToggleKidOff"); ok("😷 toggle goes through relayWeek with an Undo path",/relayWeek\("kidoff"/.test(tog)&&/gone:true/.test(tog)&&!/regenerate to reflow/.test(tog));
  ok("⏰ save and clear go through relayWeek with the leaves as they were",/relayWeek\("daytimes"/.test(fn("dtSave"))&&/dtUndoSnap\(st\.iso\)/.test(fn("dtSave"))&&/relayWeek\("daytimes"/.test(fn("dtClear")));
  ok("the 8 PM sweep / ⏩ push run through _rlwRun inside their own lock",/_rlwRun\(\{whys:\["sweep"\]/.test(fn("mlEveningSweep")));
  ok("the listener sweep (schedCascade) never calls relayWeek",!/relayWeek|_rlwRun/.test(fn("schedCascade")));
  ok("the lock waits for a relay claim like a regen",/kind==="relay"/.test(fn("haClaimSchedLock")));
  ok("the relayLog listener sits with the week's listeners",/wk\+"\/relayLog"/.test(src));
  ok("the day banner draws the line for Mom only",/if\(momHere\(\)\)\{ try\{ if\(typeof relayLineHTML==="function"\) h\+=relayLineHTML\(day\); \}catch\(e\)\{\} \}/.test(src));
  ok("the picker no longer says 'regenerate afterward'",!/regenerate afterward to reflow/.test(src)); }

console.log("1. the real cascade — a kid marked off on a later day");
{
  const FNS=["toMin","fromMin","_parseCheckTs","_dismissed","_normOrderArr","taskDevice","taskSubject","taskTier","capFor","capForDisplay","catchupDayCap","isCatchupCapped","subjNoCarry","applyStickyOrder","packDay","packAround","cascadeIntraWeek"].map(fn).join("\n");
  const RealDate=Date;
  const frozen=iso=>class F extends RealDate{ constructor(...a){ if(!a.length) super(iso+"T09:00:00"); else super(...a); } static now(){ return new RealDate(iso+"T09:00:00").getTime(); } };
  const mk=(id,who,day,time,o)=>Object.assign({id,who,day,time,dur:25,device:"paper",mom:"none",title:"📄 "+(o&&o.sk||"subj")+" — L"+((o&&o.L)||id),subjectKey:(o&&o.sk)||"subj_"+id},o||{});
  const WEEK={monday:"November 2",tuesday:"November 3",wednesday:"November 4",thursday:"November 5",friday:"November 6"};
  function run(cfg){
    const writes=[];
    const env={DAY_DT:WEEK,WK:"week5",ROSTER:["kid_a","kid_b"],weekData:{tasks:cfg.tasks},checked:cfg.checked||{},claimed:cfg.claimed||{},histState:{},momMoves:{},
      currData:{subjects:{kid_a:{},kid_b:{}}},rulesData:{},fbCurrLoaded:true,_cascNowMin:cfg.nowMin||9*60,DEFAULT_DAY_CAP:2,
      calendarData:cfg.calendar||{kidOverrides:{}},
      smapIsKidOff:(kid,ds)=>{ const o=((cfg.calendar||{}).kidOverrides||{})[kid]||{}; if(o[ds]&&o[ds].school===false) return "Off"; return (cfg.holidays||{})[ds]||null; },
      schedOv:()=>null,schedOvKidOff:()=>null,satCutoffMin:()=>null,satApplyCutoff:()=>{},sv:()=>{},dbg:()=>{},renderAll:()=>{},
      safeWriteTasks:()=>{ writes.push("whole"); },lockHeldByOther:()=>false,_dryRun:()=>true,
      db:{ref:p=>({update:o=>{ writes.push({p,o}); return Promise.resolve(); },set:()=>Promise.resolve()})},Date:frozen("2026-11-03"),
      console,JSON,Math,Object,Array,Set,Map,String,Number,parseInt,isNaN,Promise};
    const keys=Object.keys(env);
    new Function(...keys,"\"use strict\";"+FNS+"; cascadeIntraWeek(); return null;")(...keys.map(k=>env[k]));
    return {tasks:cfg.tasks,writes};
  }
  const week=()=>[
    mk("a_m1","kid_a","monday","10:00 AM",{sk:"math",L:1}),mk("a_t1","kid_a","tuesday","10:00 AM",{sk:"math",L:2}),
    mk("a_w1","kid_a","wednesday","10:00 AM",{sk:"math",L:3}),mk("a_w2","kid_a","wednesday","10:30 AM",{sk:"read"}),mk("a_w3","kid_a","wednesday","11:00 AM",{sk:"write"}),
    mk("a_wn","kid_a","wednesday","9:55 AM",{sk:"morning_nb",title:"📖 Morning Notebook — Morning Notebook",dur:5}),
    mk("a_th1","kid_a","thursday","10:00 AM",{sk:"math",L:4}),mk("a_f1","kid_a","friday","10:00 AM",{sk:"math",L:5}),
    mk("b_w1","kid_b","wednesday","10:00 AM",{sk:"math"}),mk("b_w2","kid_b","wednesday","10:30 AM",{sk:"read"})];
  { const T=week(); const before=JSON.stringify(T.map(t=>[t.id,t.day,t.time]));
    run({tasks:T,checked:{a_m1:"10:20 AM Nov 2"}});
    ok("no mark → byte-identical (nothing moved, no write)",JSON.stringify(T.map(t=>[t.id,t.day,t.time]))===before); }
  { const T=week();
    run({tasks:T,nowMin:toMin("10:30 AM"),checked:{a_m1:"10:20 AM Nov 2"},calendar:{kidOverrides:{kid_a:{"2026-11-04":{school:false,note:"Day off"}}}}});   // mid-day Tuesday: today's goal is set (DAYGOAL)
    const w=T.filter(t=>t.who==="kid_a"&&t.day==="wednesday");
    ok("kid A's Wednesday lessons have left Wednesday",!w.some(t=>["a_w1","a_w2","a_w3"].includes(t.id)),w.map(t=>t.id));
    ok("…onto Thursday / Friday only, never back onto the off day",["a_w1","a_w2","a_w3"].every(id=>{ const t=T.find(x=>x.id===id); return t.day==="thursday"||t.day==="friday"; }),["a_w1","a_w2","a_w3"].map(id=>T.find(x=>x.id===id).day));
    ok("three of kid A's cards carry the ↩ chip (cascadedFrom wednesday — the lesson-order pass may swap which lesson sits in a swept slot)",T.filter(t=>t.who==="kid_a"&&t.cascadedFrom==="wednesday").length===3,T.filter(t=>t.cascadedFrom).map(t=>t.id+"@"+t.day));
    ok("the Morning Notebook (day-bound) stays on its day",T.find(x=>x.id==="a_wn").day==="wednesday");
    ok("kid B's Wednesday is untouched",T.filter(t=>t.who==="kid_b").every(t=>t.day==="wednesday"&&!t.cascadedFrom));
    const math=T.filter(t=>t.who==="kid_a"&&t.subjectKey==="math").sort((a,b)=>["monday","tuesday","wednesday","thursday","friday"].indexOf(a.day)-["monday","tuesday","wednesday","thursday","friday"].indexOf(b.day)||toMin(a.time)-toMin(b.time));
    ok("math stays in lesson order across the days (L1…L5 by day then time)",math.map(t=>t.title.slice(-2)).join(",")==="L1,L2,L3,L4,L5",math.map(t=>t.title.slice(-2)+"@"+t.day+" "+t.time));
    ok("no two of kid A's cards stack on a receiving day",["thursday","friday"].every(dn=>{ const L=T.filter(t=>t.who==="kid_a"&&t.day===dn).sort((a,b)=>toMin(a.time)-toMin(b.time)); for(let k=1;k<L.length;k++) if(toMin(L[k].time)<toMin(L[k-1].time)+(L[k-1].dur||20)) return false; return true; })); }
  { const T=week();
    run({tasks:T,checked:{a_m1:"10:20 AM Nov 2"},calendar:{kidOverrides:{kid_a:{"2026-11-04":{school:false,note:"Day off"}}}}});   // 9:00 AM, before school
    ok("tapped before school starts, today may take some of it (her 10/1 rule: the goal is set at the start) — never the off day",["a_w1","a_w2","a_w3"].every(id=>T.find(x=>x.id===id).day!=="wednesday"),["a_w1","a_w2","a_w3"].map(id=>T.find(x=>x.id===id).day)); }
  { const T=week();
    run({tasks:T,claimed:{a_w2:true},checked:{a_w3:"11:20 AM Nov 4"},calendar:{kidOverrides:{kid_a:{"2026-11-04":{school:false,note:"Day off"}}}}});
    ok("a claimed card on the off day stays frozen",T.find(x=>x.id==="a_w2").day==="wednesday");
    ok("a checked card on the off day stays",T.find(x=>x.id==="a_w3").day==="wednesday");
    ok("the open one still moves",T.find(x=>x.id==="a_w1").day!=="wednesday"); }
  { const T=week(); const before=JSON.stringify(T.map(t=>[t.id,t.day,t.time]));
    run({tasks:T,checked:{a_m1:"10:20 AM Nov 2"},holidays:{"2026-11-04":"Holiday"}});
    ok("a holiday alone (no per-kid mark) moves nothing — the mark is Mom's explicit per-kid one, as for today",JSON.stringify(T.map(t=>[t.id,t.day,t.time]))===before); }
  { const T=week();
    run({tasks:T,checked:{a_m1:"10:20 AM Nov 2"},calendar:{kidOverrides:{kid_a:{"2026-11-04":{school:true}}}}});
    ok("school:true (Mom restored the day) → nothing moves",T.filter(t=>t.who==="kid_a"&&t.day==="wednesday").length===4); }
}

console.log("2. the real school-end guard — a card laid before the day's start");
{ const G=new Function(fn("seGuardWeek")+"\nreturn seGuardWeek;")();
  const DAYS=["monday","tuesday","wednesday","thursday","friday"];
  const ctx=x=>Object.assign({days:DAYS,todayDay:"tuesday",nowMin:9*60,checked:{},claimed:{},win:()=>({start:toMin("11:00 AM"),end:toMin("4:15 PM"),lunchStart:780,lunchEnd:840}),kidOff:()=>false,isClass:t=>!!t.cls,isLesson:t=>!!t.lesson,ahead:()=>0,toMin,fromMin},x||{});
  let N=0; const c=(who,day,time,dur,sk,x)=>Object.assign({id:who+"_"+sk+"_"+(N++),who,day,time,dur,subjectKey:sk,title:sk,mom:"none"},x||{});
  { const nb=c("k","wednesday","10:00 AM",5,"morning_nb",{title:"Morning Notebook"}), a=c("k","wednesday","10:05 AM",25,"math",{lesson:1}), b=c("k","wednesday","10:30 AM",25,"read",{lesson:1}), cl=c("k","wednesday","10:55 AM",5,"closing_nb",{title:"Closing Notebook"});
    const r=G([nb,a,b,cl],ctx());
    ok("Wednesday now starts at 11:00 → the day re-lays from 11:00 in its order",nb.time==="11:00 AM"&&a.time==="11:05 AM"&&b.time==="11:30 AM"&&cl.time==="11:55 AM",[nb.time,a.time,b.time,cl.time]);
    ok("…targeted time writes only, nothing rolled",Object.keys(r.upd).every(k=>/\/time$/.test(k))&&!r.rolled.length&&!r.deferred.length,r); }
  { const a=c("k","wednesday","11:00 AM",25,"math",{lesson:1}), b=c("k","wednesday","11:25 AM",25,"read",{lesson:1});
    const r=G([a,b],ctx()); ok("a day at its start is still fine — no writes",!Object.keys(r.upd).length,r.upd); }
  { const a=c("k","tuesday","10:00 AM",25,"math",{lesson:1}), b=c("k","tuesday","10:40 AM",25,"read",{lesson:1});
    const r=G([a,b],ctx({nowMin:toMin("10:20 AM")}));
    ok("today: the started card (10:00, now 10:20) never moves; the open one re-lays from the new start",a.time==="10:00 AM"&&b.time==="11:00 AM",[a.time,b.time]); }
  { const a=c("k","wednesday","10:00 AM",25,"math",{lesson:1}), b=c("k","wednesday","10:25 AM",25,"read",{lesson:1});
    const r=G([a,b],ctx({displayOnly:true,todayDay:"wednesday"})); ok("the display pass is unchanged (lane clashes only)",!Object.keys(r.upd).length,r.upd); }
  { const cls=c("k","wednesday","10:00 AM",30,"outschool",{cls:true}), a=c("k","wednesday","10:30 AM",25,"math",{lesson:1});
    const r=G([cls,a],ctx()); ok("a fixed-time class before the start stays; the open card re-lays from 11:00",cls.time==="10:00 AM"&&a.time==="11:00 AM",[cls.time,a.time]); }
}

console.log("3. the door");
function world(o){
  o=o||{};
  const log={claims:[],toasts:[],writes:[],removes:[],dbg:[],renders:0,sweeps:0,timers:[]};
  const ctx={console,JSON,Math,Object,Array,String,Number,parseInt,isNaN,Date,RegExp,
    WK:"week5",HA_DEV_ID:"dev_test",weekData:{tasks:o.tasks||[]},checked:o.checked||{},claimed:o.claimed||{},momMoves:o.momMoves||{},
    fbCheckedLoaded:true,fbTasksLoaded:true,fbHistoryLoaded:true,fbCurrLoaded:true,_todayDay:"tuesday",
    rulesData:o.rules||{},calendarData:o.calendar||{kidOverrides:{}},
    momHere:()=>o.mom!==false,_dryRun:()=>!!o.dry,
    lockHeldByOther:()=>!!o.lockHeld,
    haClaimSchedLock:(kind,cb)=>{ log.claims.push(kind); if(o.lockDenied){ cb(null); return; } cb(function(){}); },
    cascadeIntraWeek:()=>{ log.sweeps++; if(o.sweep) o.sweep(ctx.weekData.tasks); },runCascade:()=>{},
    gwShowToast:m=>log.toasts.push(m),dbg:m=>log.dbg.push(m),renderAll:()=>{ log.renders++; },sv:()=>{},
    setTimeout:(f,ms)=>{ log.timers.push({f,ms}); return log.timers.length; },clearTimeout:()=>{},
    db:{ref:p=>({set:v=>{ log.writes.push([p,v]); },remove:()=>{ log.removes.push(p); },update:v=>{ log.writes.push([p||"(root)",v]); }})},
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1),esc:s=>String(s==null?"":s),toMin,fromMin,
    stApplyLocal:(p,v)=>{ log.local=(log.local||[]); log.local.push([p,v]); }};
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("// RELAY_START"),src.indexOf("// RELAY_END")),ctx);
  const fire=()=>{ const due=log.timers.splice(0,log.timers.length); due.forEach(t=>t.f()); };   // only the timers armed so far — a retry armed by one waits for the next fire()
  return {ctx,log,fire,call:e=>vm.runInContext(e,ctx)};
}
const T0=()=>[{id:"a1",who:"kid_a",day:"wednesday",time:"10:00 AM",dur:25,title:"math"},{id:"a2",who:"kid_a",day:"wednesday",time:"10:30 AM",dur:25,title:"read"},{id:"a3",who:"kid_a",day:"thursday",time:"10:00 AM",dur:25,title:"math"},{id:"b1",who:"kid_b",day:"wednesday",time:"10:00 AM",dur:25,title:"math"},{id:"c1",who:"kid_a",day:"wednesday",time:"11:00 AM",dur:25,title:"done"}];
const SWEEP=tasks=>{ tasks.forEach(t=>{ if(t.who==="kid_a"&&t.day==="wednesday"&&t.id!=="c1"){ t.cascadedFrom="wednesday"; t.day="thursday"; t.time=t.id==="a1"?"10:25 AM":"10:50 AM"; } if(t.id==="c1"){ t.day="tuesday"; } }); };
{ const w=world({tasks:T0(),checked:{c1:"11:10 AM Nov 3"},sweep:SWEEP});
  w.call('relayWeek("kidoff",{label:"😷 Kid A off Wed",undo:[{p:"calendar/kidOverrides/kid_a/2026-11-04",gone:true}]}); relayWeek("kidoff",{label:"😷 Kid A off Wed",undo:[{p:"calendar/kidOverrides/kid_a/2026-11-04",was:{school:false}}]}); relayWeek("daytimes",{label:"⏰ Wed 11:00 AM–2:00 PM"});');
  ok("three taps arm one 2 s timer each time (the last wins)",w.log.timers.length===3&&w.log.timers.every(t=>t.ms===2000));
  w.log.timers.splice(0,2); w.fire();
  ok("one lock claim of kind relay, one sweep",w.log.claims.join(",")==="relay"&&w.log.sweeps===1,w.log.claims);
  const wr=w.log.writes.find(x=>/^week5\/relayLog\/\d+$/.test(x[0]));
  ok("one targeted log write at week5/relayLog/<ts>",!!wr&&w.log.writes.length===1,w.log.writes.map(x=>x[0]));
  const e=wr[1];
  ok("the entry: both labels, 2 moves (the checked card's heal is not a move), no removed",e.label==="😷 Kid A off Wed · ⏰ Wed 11:00 AM–2:00 PM"&&e.n===2&&e.moves.length===2&&!e.removed.length,e);
  ok("the first 'was' wins: the kid's mark goes back to gone",e.undo.length===1&&e.undo[0].gone===true&&e.undo[0].was===undefined,e.undo);
  ok("each move keeps where it came from and where it went",e.moves.every(m=>m.from.d==="wednesday"&&m.to.d==="thursday"&&m.from.cf===null),e.moves);
  ok("the toast says what moved",/🔁 .*2 cards moved \(Kid_a 2\)/.test(w.log.toasts[w.log.toasts.length-1]),w.log.toasts);
  ok("the banner line draws for Mom with Undo",/2 cards moved/.test(w.call("relayLineHTML()"))&&/relayUndo\('\d+'\)/.test(w.call("relayLineHTML()")));
  w.ctx.momHere=()=>false; ok("…and not for a kid lens",w.call("relayLineHTML()")===""); w.ctx.momHere=()=>true;
  // Undo
  w.call("weekData.tasks[0].time='11:30 AM';");   // a1 moved since (Mom dragged it) → stays
  w.call("checked['a2']='10:55 AM Nov 5';");       // a2 checked since → stays
  w.call("relayUndo('"+e.at+"')");
  const u=w.log.writes[w.log.writes.length-1];
  ok("Undo: one multi-path root update",u[0]==="(root)"&&w.log.writes.length===2,w.log.writes.map(x=>x[0]));
  ok("…the kid's mark goes (null) first",u[1]["calendar/kidOverrides/kid_a/2026-11-04"]===null);
  ok("…no card path (one moved since, one checked since) — both left",!Object.keys(u[1]).some(k=>/\/tasks\//.test(k)),Object.keys(u[1]));
  ok("…the entry is marked undone",typeof u[1]["week5/relayLog/"+e.at+"/undone"]==="number"&&/undone/.test(w.call("_rlwWords(relayLogData['"+e.at+"'])")));
  ok("…the local calendar mirror dropped the mark",w.call("JSON.stringify(calendarData)")==='{"kidOverrides":{"kid_a":{}}}',w.call("JSON.stringify(calendarData)"));
  ok("…the toast says 2 left",/Put back 0 cards \(2 left/.test(w.log.toasts[w.log.toasts.length-1]),w.log.toasts[w.log.toasts.length-1]);
  w.call("relayUndo('"+e.at+"')"); ok("a second Undo does nothing more",w.log.writes.length===2&&/can't be undone/.test(w.log.toasts[w.log.toasts.length-1])); }
{ const w=world({tasks:T0(),checked:{c1:"11:10 AM Nov 3"},sweep:SWEEP});
  w.call('relayWeek("kidoff",{label:"😷 Kid A off Wed",undo:[{p:"calendar/kidOverrides/kid_a/2026-11-04",gone:true}]});'); w.fire();
  const e=w.log.writes[0][1];
  w.call("relayUndo('"+e.at+"')");
  const u=w.log.writes[w.log.writes.length-1][1];
  ok("Undo puts both still-unmoved cards back: day, time, chip, carry flag — targeted paths",u["week5/tasks/a1/day"]==="wednesday"&&u["week5/tasks/a1/time"]==="10:00 AM"&&u["week5/tasks/a1/cascadedFrom"]===null&&u["week5/tasks/a1/_eowOverflow"]===null&&u["week5/tasks/a2/day"]==="wednesday",u);
  ok("…and this device's cards already show it (the checked one stays where the heal put it)",w.call("weekData.tasks.filter(t=>t.who==='kid_a'&&t.day==='wednesday').length")===2);
  ok("…the toast: Put back 2 cards",/Put back 2 cards$/.test(w.log.toasts[w.log.toasts.length-1]),w.log.toasts[w.log.toasts.length-1]); }
{ const w=world({tasks:T0(),sweep:SWEEP});
  w.call('relayWeek("kidoff",{label:"x",undo:[{p:"calendar/kidOverrides/kid_a/2026-11-04",gone:true}]});'); w.fire();
  const e=w.log.writes[0][1]; w.call("relayLogData['"+e.at+"'].at="+(e.at-16*60*1000)+";");
  ok("after 15 minutes the line has no Undo",!/relayUndo/.test(w.call("relayLineHTML()")));
  w.call("relayUndo('"+e.at+"')"); ok("…and a late Undo writes nothing",w.log.writes.length===1&&/can't be undone/.test(w.log.toasts[w.log.toasts.length-1])); }
{ const w=world({tasks:T0(),sweep:SWEEP});
  w.call('relayWeek("sweep",{label:"🌙 8 PM sweep"});'); w.fire();
  ok("a run with no trigger paths (the sweep) logs but offers no Undo",w.log.writes.length===1&&!w.log.writes[0][1].undo&&!/relayUndo/.test(w.call("relayLineHTML()"))); }
{ const w=world({tasks:T0(),checked:{c1:"11:10 AM Nov 3"},sweep:SWEEP,dry:true});
  w.call('relayWeek("kidoff",{label:"x"});'); w.fire();
  ok("?dryrun=1: the sweep runs, nothing is written, the line still draws from memory",w.log.sweeps===1&&!w.log.writes.length&&/2 cards moved/.test(w.call("relayLineHTML()"))); }
{ const w=world({tasks:T0()});
  w.call('relayWeek("kidoff",{label:"x"});'); w.fire();
  ok("nothing moved → no log entry, no toast, no line",!w.log.writes.length&&!w.log.toasts.length&&w.call("relayLineHTML()")==="");}
{ const w=world({tasks:T0(),lockHeld:true});
  w.call('relayWeek("kidoff",{label:"x"});'); w.fire();
  ok("lock held elsewhere: waits 500 ms at a time",w.log.timers.length===1&&w.log.timers[0].ms===500&&!w.log.claims.length);
  for(let i=0;i<25&&w.log.timers.length;i++) w.fire();
  ok("…gives up after ~10 s with a plain toast, no claim",!w.log.claims.length&&/catches up on its next sweep/.test(w.log.toasts[0]),w.log.toasts); }
{ const w=world({tasks:T0(),lockDenied:true});
  w.call('relayWeek("kidoff",{label:"x"});'); w.fire();
  ok("the claim refused → the same plain toast, no sweep",w.log.sweeps===0&&/catches up on its next sweep/.test(w.log.toasts[0])); }
{ const w=world({tasks:T0(),claimed:{b1:true},sweep:t=>{ t.find(x=>x.id==="b1").day="thursday"; }});
  w.call('relayWeek("kidoff",{label:"x"});'); w.fire();
  ok("a claimed card that changed day trips the wire (logged, not a move)",w.log.dbg.some(m=>/relay tripwire/.test(m)&&/b1/.test(m))&&!w.log.writes.length,w.log.dbg); }
{ const w=world({tasks:T0(),sweep:SWEEP});
  const seed={}; for(let i=1;i<=10;i++) seed[String(1000+i)]={at:1000+i,label:"old",n:1,moves:[]};
  w.call("relayLogData="+JSON.stringify(seed)+";");
  w.call('relayWeek("kidoff",{label:"x"});'); w.fire();
  ok("the newest 10 are kept: the oldest entry goes with a targeted remove",w.log.removes.length===1&&w.log.removes[0]==="week5/relayLog/1001"&&w.call("Object.keys(relayLogData).length")===10,w.log.removes); }
{ const w=world({tasks:T0(),sweep:t=>{ t.splice(t.findIndex(x=>x.id==="a3"),1); }});
  w.call('relayWeek("daytimes",{label:"⏰",undo:[{p:"config/rules/schoolDay/byDate/2026-11-04",was:{end:"2:00 PM"}}]});'); w.fire();
  const e=w.log.writes[0][1];
  ok("a card the guard deferred is logged whole as removed",e.removed.length===1&&e.removed[0].id==="a3"&&/1 to next week/.test(w.call("_rlwWords(relayLogData['"+e.at+"'])")));
  w.call("relayUndo('"+e.at+"')"); const u=w.log.writes[1][1];
  ok("Undo brings it back whole and puts the date's leaf back",u["week5/tasks/a3"]&&u["week5/tasks/a3"].id==="a3"&&u["config/rules/schoolDay/byDate/2026-11-04"].end==="2:00 PM"&&w.log.local[0][0]==="config/rules/schoolDay/byDate/2026-11-04",u); }
{ const w=world({rules:{schoolDay:{byDate:{"2026-11-04":{start:"11:00 AM"}},lunchByDate:{"2026-11-04":{all:{start:"12:00 PM",end:"1:00 PM"}}}}}});
  const s=w.call('JSON.stringify(dtUndoSnap("2026-11-04"))'), g=w.call('JSON.stringify(dtUndoSnap("2026-11-05"))');
  ok("dtUndoSnap: the date's two leaves as they are",s==='[{"p":"config/rules/schoolDay/byDate/2026-11-04","was":{"start":"11:00 AM"}},{"p":"config/rules/schoolDay/lunchByDate/2026-11-04/all","was":{"start":"12:00 PM","end":"1:00 PM"}}]',s);
  ok("…gone when the date has none",g==='[{"p":"config/rules/schoolDay/byDate/2026-11-05","gone":true},{"p":"config/rules/schoolDay/lunchByDate/2026-11-05/all","gone":true}]',g); }

console.log("4. the callers");
{ const calls=[], toasts=[], writes=[];
  const ctx={console,JSON,Object,String,Array,Date,
    db:{ref:p=>({set:v=>writes.push([p,v]),remove:()=>writes.push([p,null])})},momHere:()=>true,calendarData:{kidOverrides:{}},_todayDay:"tuesday",
    routineDateISO:()=>"2026-11-03",stDayNameOf:iso=>({"2026-11-03":"tuesday","2026-11-05":"thursday","2026-11-12":"thursday"})[iso]||"",
    stDsOf:dn=>({tuesday:"2026-11-03",thursday:"2026-11-05"})[dn]||null,stDateWords:iso=>"Thu, Nov "+iso.slice(-2),
    relayWeek:(w,i)=>calls.push([w,i]),schedCascade:()=>calls.push(["cascade"]),gwShowToast:m=>toasts.push(m),renderAll:()=>{},cap:s=>s};
  vm.createContext(ctx); vm.runInContext(fn("schedToggleKidOff"),ctx);
  vm.runInContext('schedToggleKidOff("kid_a","2026-11-05")',ctx);
  ok("😷 a later day of the week on the board → relayWeek kidoff with the mark's Undo path",calls.length===1&&calls[0][0]==="kidoff"&&calls[0][1].undo[0].p==="calendar/kidOverrides/kid_a/2026-11-05"&&calls[0][1].undo[0].gone===true&&/off Thu, Nov 05/.test(calls[0][1].label),calls);
  ok("…the toast says it is moving now",/is off Thu, Nov 05 — moving their lessons/.test(toasts[0]),toasts);
  vm.runInContext('schedToggleKidOff("kid_a","2026-11-03")',ctx);
  ok("today → the same door, label 'off today'",calls[1][0]==="kidoff"&&/off today/.test(calls[1][1].label));
  vm.runInContext('schedToggleKidOff("kid_a","2026-11-12")',ctx);
  ok("a date outside the week on the board → the mark only, no re-lay",calls.length===2&&/marked off Thu, Nov 12$/.test(toasts[2]),toasts);
  vm.runInContext('schedToggleKidOff("kid_a","2026-11-05")',ctx);
  ok("restoring the day removes the mark, re-lays nothing",calls.length===2&&writes[writes.length-1][1]===null&&/restored/.test(toasts[3])); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
