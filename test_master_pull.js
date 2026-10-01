/*
 * 📘 Master pull (her rule 2026-10-01) — change B.
 *   · a plan-backed subject with NOTHING open this week offers "next <subject>" in the extend list, after catch-up
 *   · Pull next ▶ creates ONE sitting on today after now, stamped with the plan's next unfinished lesson (not done, not
 *     already dealt this week), same id/title shape as a catch-up extra, gotAhead="master" → the Master-pull bonus
 *   · never automatic; Mom / device / cap gates; "catch up first" while behind-work can be taken
 *   · one targeted write (set of the new card); a second pull of the same subject is refused while the card is open
 *   · untouched, it dissolves at the day's end (cascade: the 8 PM sweep today, or any pass once its day has passed);
 *     a card still in its time, or one the kid finished / sent to Mom, stays
 *   run:  node test_master_pull.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
function sliceFn(n){ const i=src.indexOf("function "+n); return src.slice(i,src.indexOf("\n}",i)+2); }
let ID=0; const card=(who,day,time,dur,mom,sk,title,x)=>Object.assign({id:sk+"_"+(ID++),who,day,time,dur,mom:mom||"none",subjectKey:sk,title:title||sk},x||{});
const SUBJ={
  word_roots:{display:"Word Roots",planId:"p1",lessonIds:["L0029","L0030","L0031","L0032"],lessonSeq:["L18","L19","L20","L21"],minutes:20,mom:"maybe"},
  mathematical_reasoning:{display:"Mathematical Reasoning",planId:"p2",lessonIds:["L0350","L0351","L0352"],lessonSeq:["pp. 1–4","pp. 5–8","pp. 9–12"],minutes:25,mom:"maybe"},
  paused_one:{display:"Paused",planId:"p3",paused:true,lessonIds:["L0001"],lessonSeq:["a"]},
  not_planned:{display:"Not planned",lessonIds:["L0001"],lessonSeq:["a"]},
  piano:{display:"Piano",planId:"p4",fixedTime:"3:00 PM",lessonIds:["L0001"],lessonSeq:["a"]},
};
function world(o){
  const writes=[], sets=[], toasts=[], logs=[];
  const done=o.done||{};
  const ctx={console,weekData:{tasks:o.tasks},checked:o.checked||{},claimed:o.claimed||{},momMoves:{},_todayDay:"thursday",day:"thursday",
    WK:"week25",lastTasksWrite:0,DAY_DT:{},fbTasksLoaded:true,rulesData:o.rules||{},slotConfig:o.slots||{},
    currData:{subjects:{ellis:o.subjects||SUBJ}},
    lidsFor:(k,sk)=>{ const s=(o.subjects||SUBJ)[sk]; return (s&&s.lessonIds)||null; },
    lidDoneSet:(k,sk)=>new Set(done[sk]||[]), planBacked:(k,sk)=>!!((o.subjects||SUBJ)[sk]||{}).planId, planIdFor:(k,sk)=>k+"__"+sk,
    _seqFillTitle:(t,x)=>{ const i=t.lastIndexOf(" — "); return i>=0?t.slice(0,i+3)+x:t+" — "+x; }, fxIsClass:s=>!!(s&&s.fixedTime),
    _mlNowMin:()=>o.now||14*60+30,_mlDayEndMin:()=>16*60+15,_mlLunchWin:()=>[13*60,14*60],_mlDayOf:t=>t.day,effectiveDay:t=>t.day,
    currExpectedBase:()=>null,computeSubjectCursor:()=>0,planPace:(k,sk)=>({behind:(o.behind||{})[sk]||0,ahead:0,score:0}),
    catchupDayCap:(k,subj)=>(o.caps||{})[subj]===undefined?2:o.caps[subj],taskSubject:t=>t.subjectKey,gwDeviceCaps:()=>({computer:1,screen:2}),taskDevice:t=>t.device||"paper",
    subjNoCarry:t=>/retrieval|reflex/.test(t.subjectKey),mlMomOff:()=>!!o.momOff,mlNow:()=>({kid:o.momWith===undefined?null:o.momWith}),
    taskLessonRef:t=>(t.title.split(" — ")[1]||""),esc:s=>String(s==null?"":s),cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),
    sv:()=>{},dbg:m=>logs.push(m),gwShowToast:m=>toasts.push(m),_dryRun:()=>false,
    db:{ref:p=>({update:u=>writes.push([p,u]),set:v=>sets.push([p,v])})},seqFillNormalize:()=>({changed:0,notes:[]}),
    Object,String,Array,Math,Date,RegExp,parseInt,isNaN,JSON,Set};
  vm.createContext(ctx); vm.runInContext(sliceFn("toMin")+"\n"+sliceFn("fromMin")+"\n"+cut("// EFPULL_START","// EFPULL_END")+"\n"+cut("// GETAHEAD_START","// GETAHEAD_END"),ctx);
  return {ctx,writes,sets,toasts,logs,run:e=>vm.runInContext(e,ctx)};
}
// Ellis's Thursday, goal done 2:30 PM: Word Roots all done this week (L18 Mon, L19 Thu); MR still has an open Friday card
function week(){
  ID=0;
  const nb=card("ellis","thursday","10:00 AM",5,"none","morning_nb","📖 Morning Notebook");
  const wrMon=card("ellis","monday","11:00 AM",20,"maybe","word_roots","📄 Word Roots — L18",{lid:"L0029",device:"paper"});
  const wrThu=card("ellis","thursday","11:07 AM",20,"maybe","word_roots","📄 Word Roots — L19",{lid:"L0030",device:"paper"});
  const mrFri=card("ellis","friday","12:26 PM",25,"maybe","mathematical_reasoning","📖 Mathematical Reasoning — pp. 5–8",{lid:"L0351"});
  const close=card("ellis","thursday","2:25 PM",5,"none","closing_nb","Closing Notebook");
  const checked={}; [nb,wrMon,wrThu,close].forEach(t=>{ checked[t.id]="x"; });
  return {tasks:[nb,wrMon,wrThu,mrFri,close],checked,cards:{nb,wrMon,wrThu,mrFri,close}};
}

console.log("📘 which subjects offer a master pull");
{ const E=week(); const W=world({tasks:E.tasks,checked:E.checked,done:{word_roots:["L0029","L0030"]}});
  const L=W.run("mpCandidates('ellis')"); const sks=L.map(x=>x.sk);
  ok("Word Roots (nothing open this week) is offered; MR (open Friday card) is not",sks.length===1&&sks[0]==="word_roots",sks);
  const c=L[0].card;
  ok("the card is the plan's next unfinished lesson: L0031 'L20', id in the catch-up-extra shape, title from this week's card",c.lid==="L0031"&&c.id==="ellis_ellis__word_roots_L0031"&&c.title==="📄 Word Roots — L20",[c.lid,c.id,c.title]);
  ok("it is marked as a master pull with the master bonus and 20 min from the subject",c.masterPull===true&&c.gotAhead==="master"&&c.pulledFrom==="plan"&&c.dur===20,[c.masterPull,c.gotAhead,c.dur]);
  ok("paused, un-planned and fixed-time subjects are never offered",sks.indexOf("paused_one")<0&&sks.indexOf("not_planned")<0&&sks.indexOf("piano")<0);
  const E2=week(); E2.checked[E2.cards.mrFri.id]="x";
  const W2=world({tasks:E2.tasks,checked:E2.checked,done:{word_roots:["L0029","L0030"],mathematical_reasoning:["L0350","L0351"]}});
  const L2=W2.run("mpCandidates('ellis')").map(x=>x.sk+":"+x.card.lid);
  ok("once MR's Friday card is done too, MR offers its next lesson (L0352), skipping done and dealt ones",L2.indexOf("mathematical_reasoning:L0352")>=0,L2);
  const W3=world({tasks:E2.tasks,checked:E2.checked,done:{word_roots:["L0029","L0030","L0031","L0032"],mathematical_reasoning:["L0350","L0351","L0352"]}});
  ok("a subject whose plan is finished offers nothing",W3.run("mpCandidates('ellis')").length===0);
}
console.log("📘 the extend list");
{ const E=week(); const W=world({tasks:E.tasks,checked:E.checked,done:{word_roots:["L0029","L0030"]}});
  const h=W.run("gaRender('ellis')");
  ok("📘 From the plan appears with a Pull next button for Word Roots",/From the plan/.test(h)&&h.indexOf("mpPullTap('ellis','word_roots')")>=0);
  ok("it says where it comes from and reads the default +100%",/from the plan/.test(h)&&/\+100%/.test(h));
  ok("⏩ Get ahead (MR's Friday card) is listed above it",h.indexOf("⏩ Get ahead")>=0&&h.indexOf("⏩ Get ahead")<h.indexOf("From the plan"));
  const W2=world({tasks:E.tasks,checked:E.checked,done:{word_roots:["L0029","L0030"]},slots:{bonus:{master:200}}});
  ok("…or the Admin setting (+200%)",/\+200%/.test(W2.run("gaRender('ellis')")));
  const E3=week(); const parked=card("ellis","friday","3:05 PM",25,"maybe","mathematical_reasoning","MR — pp. 9–12",{_eowOverflow:true}); E3.tasks.push(parked);
  const h3=world({tasks:E3.tasks,checked:E3.checked,done:{word_roots:["L0029","L0030"]}}).run("gaRender('ellis')");
  ok("while behind-work can be taken the master pull says 'catch up first' (no button)",/Catch up first/.test(h3)&&h3.indexOf("mpPullTap('ellis','word_roots')")<0&&/catch up first/.test(h3));
}
console.log("📘 Pull next ▶");
{ const E=week(); const W=world({tasks:E.tasks,checked:E.checked,done:{word_roots:["L0029","L0030"]},now:14*60+30});
  const c=W.run("mpPull('ellis','word_roots')");
  ok("a new card lands today after now",c&&c.day==="thursday"&&c.time==="2:30 PM"&&E.tasks.some(t=>t.id==="ellis_ellis__word_roots_L0031"),c&&[c.day,c.time]);
  ok("one targeted set of the new card — never the whole node",W.sets.length===1&&W.sets[0][0]==="week25/tasks/ellis_ellis__word_roots_L0031"&&W.sets[0][1].masterPull===true&&W.writes.length===0,W.sets.map(s=>s[0]));
  ok("the kid hears it",W.toasts.length===1&&/from the plan/.test(W.toasts[0]),W.toasts);
  ok("the subject now has an open card → no second pull, and it leaves the plan list",W.run("mpPull('ellis','word_roots')")===null&&W.run("mpCandidates('ellis')").length===0);
  const E2=week(); const W2=world({tasks:E2.tasks,checked:E2.checked,done:{word_roots:["L0029","L0030"]},now:12*60+50});
  const c2=W2.run("mpPull('ellis','word_roots')");
  ok("finished just before lunch → it lands at 2:00 PM, not on lunch",c2&&c2.time==="2:00 PM",c2&&c2.time);
}
console.log("📘 gates");
{ const S=JSON.parse(JSON.stringify(SUBJ)); S.word_roots.mom="required";
  const E=week(); const W=world({tasks:E.tasks,checked:E.checked,subjects:S,done:{word_roots:["L0029","L0030"]},momWith:"lucy"});
  const x=W.run("mpCandidates('ellis')")[0];
  ok("a Mom-required subject while Mom is with Lucy → 'needs Mom', and the pull is refused",x&&x.gate==="needs Mom"&&W.run("mpPull('ellis','word_roots')")===null,x&&x.gate);
  const S2=JSON.parse(JSON.stringify(SUBJ)); S2.word_roots.device="computer";
  const E2=week(); E2.tasks.push(card("lincoln","thursday","2:00 PM",45,"none","typing","Typing Club",{device:"computer"}));
  E2.cards.wrMon.device="computer"; E2.cards.wrThu.device="computer";   // this week's cards carry the subject's device (the template)
  const x2=world({tasks:E2.tasks,checked:E2.checked,subjects:S2,done:{word_roots:["L0029","L0030"]},now:14*60+30}).run("mpCandidates('ellis')")[0];
  ok("a computer subject while Lincoln is on the computer → 'device busy'",x2&&x2.gate==="device busy",x2&&x2.gate);
  const E3=week(); const x3=world({tasks:E3.tasks,checked:E3.checked,done:{word_roots:["L0029","L0030"]},caps:{word_roots:1}}).run("mpCandidates('ellis')")[0];
  ok("Word Roots already done once today with a cap of 1 → 'at today's cap'",x3&&x3.gate==="at today's cap",x3&&x3.gate);
}

console.log("📘 untouched, it dissolves at the day's end (cascade)");
{
  function sliceBal(name){ const sig="function "+name+"("; const i=src.indexOf(sig); let d=0,j=src.indexOf("{",i); for(let k=j;k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1); } } throw new Error(name); }
  const FNS=["toMin","fromMin","_parseCheckTs","_dismissed","_normOrderArr","taskDevice","taskSubject","taskTier","capFor","capForDisplay","catchupDayCap","isCatchupCapped","subjNoCarry","applyStickyOrder","packDay","packAround","cascadeIntraWeek"].map(sliceBal).join("\n");
  const RealDate=Date; const frozen=iso=>class F extends RealDate{ constructor(...a){ if(a.length===0) super(iso+"T09:00:00"); else super(...a); } static now(){ return new RealDate(iso+"T09:00:00").getTime(); } };
  const WEEK={monday:"September 28",tuesday:"September 29",wednesday:"September 30",thursday:"October 1",friday:"October 2"};
  const mk=(id,day,time,x)=>Object.assign({id,who:"ellis",day,time,dur:20,device:"paper",mom:"none",title:"📄 Word Roots — L20",subjectKey:"word_roots"},x||{});
  function run(cfg){
    const writes=[]; const env={DAY_DT:WEEK,WK:"week25",ROSTER:["lincoln","ellis","lucy","julian"],weekData:{tasks:cfg.tasks},checked:cfg.checked||{},claimed:cfg.claimed||{},histState:{},momMoves:{},
      currData:{subjects:{lincoln:{},ellis:{},lucy:{},julian:{}}},rulesData:{},fbCurrLoaded:true,_cascNowMin:cfg.nowMin,DEFAULT_DAY_CAP:2,lastTasksWrite:0,
      smapIsKidOff:()=>null,schedOv:()=>null,schedOvKidOff:()=>null,satCutoffMin:()=>null,satApplyCutoff:()=>{},sv:()=>{},dbg:()=>{},renderAll:()=>{},safeWriteTasks:()=>{},
      lockHeldByOther:()=>false,_dryRun:()=>false,db:{ref:p=>({update:o=>{ writes.push({p,o}); return Promise.resolve(); },set:()=>Promise.resolve()})},Date:frozen("2026-10-01"),
      console,JSON,Math,Object,Array,Set,Map,String,Number,parseInt,isNaN,Promise};
    const keys=Object.keys(env); new Function(...keys,"\"use strict\";"+FNS+"; cascadeIntraWeek("+(cfg.sweepToday?"true":"")+");")(...keys.map(k=>env[k]));
    return {tasks:cfg.tasks,writes};
  }
  const has=(tasks,id)=>tasks.some(t=>t.id===id);
  { const tasks=[mk("mp_wed","wednesday","2:00 PM",{masterPull:true}),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:13*60}); ok("left on Wednesday (yesterday) → gone on the next pass, written as a targeted null",!has(r.tasks,"mp_wed")&&r.writes.some(w=>w.o&&w.o.mp_wed===null),r.writes.map(w=>Object.keys(w.o))); }
  { const tasks=[mk("mp_thu","thursday","2:30 PM",{masterPull:true}),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:20*60,sweepToday:true}); ok("today, elapsed, at the 8 PM sweep → gone",!has(r.tasks,"mp_thu")); }
  { const tasks=[mk("mp_thu","thursday","2:30 PM",{masterPull:true}),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:15*60}); ok("today, elapsed, on an ordinary (listener) pass → stays (the kid may still be on it)",has(r.tasks,"mp_thu")); }
  { const tasks=[mk("mp_thu","thursday","2:30 PM",{masterPull:true}),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:14*60,sweepToday:true}); ok("today, still in its time → stays",has(r.tasks,"mp_thu")); }
  { const tasks=[mk("mp_wed","wednesday","2:00 PM",{masterPull:true}),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:13*60,checked:{mp_wed:"2:20 PM Sep 30"}}); ok("finished → stays (it earned its bonus)",has(r.tasks,"mp_wed")); }
  { const tasks=[mk("mp_wed","wednesday","2:00 PM",{masterPull:true}),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:13*60,claimed:{mp_wed:"x"}}); ok("sent to Mom → stays and waits for her",has(r.tasks,"mp_wed")); }
  { const tasks=[mk("plain_wed","wednesday","2:00 PM"),mk("t1","thursday","10:00 AM")];
    const r=run({tasks,nowMin:13*60}); ok("an ordinary leftover is never dissolved — it sweeps forward as before",has(r.tasks,"plain_wed")&&r.tasks.find(t=>t.id==="plain_wed").day!=="wednesday"); }
}
console.log("wiring");
ok("master-pull functions live inside the BEHIND block",src.indexOf("function mpCandidates(")>src.indexOf("// BEHIND_START")&&src.indexOf("function mpPull(")<src.indexOf("// BEHIND_END"));
ok("the pull writes ONE new card with a targeted set",/db\.ref\(WK\+"\/tasks\/"\+c\.id\)\.set\(c\);/.test(src));
ok("the cascade dissolves untouched master pulls (past day, or today elapsed at the sweep)",/if\(t\.masterPull&&!\(claimed&&claimed\[t\.id\]\)\)\{ const _mi=dayOrder\.indexOf\(t\.day\); if\(_mi>=0&&\(_mi<todayIdx\|\|\(_mi===todayIdx&&sweepTodayElapsed&&toMin\(t\.time\)<_nowMin\)\)\)\{ _mpDissolve\.push\(t\); return; \} \}/.test(src));
ok("the spin pays the Master-pull % for gotAhead=\"master\"",/function gaBonusPctFor\(t\)\{ return gaBonusPct\(t&&t\.gotAhead==="master"\?"master":"ahead"\); \}/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
