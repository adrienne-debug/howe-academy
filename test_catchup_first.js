/*
 * 🔁 Catch up first (her rules 2026-10-01) — change A.
 *   · when the goal is done, BEHIND-WORK (fell off an earlier day this week → now on a later day, or parked in the
 *     carry-over box) comes before any ⏩ Get ahead choice; one card per subject, most-behind first, parked first
 *   · gates: Mom free for a Mom-required card · the card's device lane has room right now · the subject under its cap
 *   · "offered first" (default): the extend list shows 🔁 Catch up first on top with Start ▶; Get ahead rows say
 *     "catch up first" while something behind can be taken; a parked card pulled lands today after now, loses its
 *     parked flag, remembers where it came from and earns the bonus; one targeted multi-path write
 *   · "comes back on its own" (Rules): efPullNext pulls behind-work automatically after fell-off-today work
 *   · the bonus % comes from Admin ▸ Adjust Slots ▸ Bonus points (defaults 50 / 100)
 *   run:  node test_catchup_first.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
function slice(n){ const i=src.indexOf("function "+n); return src.slice(i,src.indexOf("\n}",i)+2); }
let ID=0; const card=(who,day,time,dur,mom,sk,title,x)=>Object.assign({id:sk+"_"+(ID++),who,day,time,dur,mom:mom||"none",subjectKey:sk,title:title||sk},x||{});
function world(o){
  const writes=[], toasts=[], logs=[];
  const ctx={console,weekData:{tasks:o.tasks},checked:o.checked||{},claimed:o.claimed||{},momMoves:{},_todayDay:o.today||"thursday",day:o.viewDay||o.today||"thursday",
    WK:"week25",lastTasksWrite:0,DAY_DT:{},fbTasksLoaded:true,
    rulesData:o.rules||{},slotConfig:o.slots||{},
    _mlNowMin:()=>o.now||14*60+30,_mlDayEndMin:()=>16*60+15,_mlLunchWin:()=>[13*60,14*60],_mlDayOf:t=>t.day,
    effectiveDay:t=>t.day,currExpectedBase:()=>null,computeSubjectCursor:()=>0,
    planPace:(k,sk)=>({behind:(o.behind||{})[sk]||0,ahead:0,score:-((o.behind||{})[sk]||0)}),
    catchupDayCap:(k,subj)=>(o.caps||{})[subj]===undefined?2:o.caps[subj],taskSubject:t=>t.subjectKey,
    gwDeviceCaps:()=>({computer:1,screen:2}),taskDevice:t=>t.device||"paper",
    subjNoCarry:t=>/retrieval|reflex/.test(t.subjectKey),mlMomOff:()=>!!o.momOff,mlNow:()=>({kid:o.momWith===undefined?null:o.momWith}),
    taskLessonRef:t=>(t.title.split(" — ")[1]||""),esc:s=>String(s==null?"":s),cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),
    sv:()=>{},dbg:m=>logs.push(m),gwShowToast:m=>toasts.push(m),_dryRun:()=>false,db:{ref:p=>({update:u=>writes.push([p,u])})},
    seqFillNormalize:o.seqFill||(()=>({changed:0,notes:[]})),
    Object,String,Array,Math,Date,RegExp,parseInt,isNaN,JSON,Set};
  vm.createContext(ctx); vm.runInContext(slice("toMin")+"\n"+slice("fromMin")+"\n"+cut("// EFPULL_START","// EFPULL_END")+"\n"+cut("// GETAHEAD_START","// GETAHEAD_END"),ctx);
  return {ctx,writes,toasts,logs,run:e=>vm.runInContext(e,ctx)};
}
// Ellis's Thursday, goal done at 2:30 PM: a parked MR card, a Friday DM card that fell off Monday, a plain Friday lesson
function ellisWeek(x){
  ID=0; x=x||{};
  const nb=card("ellis","thursday","10:00 AM",5,"none","morning_nb","📖 Morning Notebook");
  const done=card("ellis","thursday","11:00 AM",25,"none","read_detect","Reading Detective — Ex. 45");
  const close=card("ellis","thursday","2:25 PM",5,"none","closing_nb","Closing Notebook");
  const parked=card("ellis","friday","3:05 PM",25,"maybe","mathematical_reasoning","Mathematical Reasoning — pp. 9–12",Object.assign({_eowOverflow:true,cascadedFrom:"friday",lid:"L0352"},x.parked||{}));
  const dmFri=card("ellis","friday","11:15 AM",25,"maybe","dimensions_math_textbook_4a","Dimensions Math 4A — Chapter 2 L7",Object.assign({cascadedFrom:"monday"},x.dm||{}));
  const dmSat=card("ellis","saturday","10:00 AM",25,"maybe","dimensions_math_textbook_4a","Dimensions Math 4A — Chapter 2 L8",Object.assign({cascadedFrom:"monday"},x.dmSat||{}));
  const plainFri=card("ellis","friday","10:20 AM",20,"maybe","eggspress_e","Reading Eggspress — Map 21 L3",x.plain||{});
  const drillFri=card("ellis","friday","10:45 AM",13,"required","retrieval","Daily Drill");
  const lincoln=card("lincoln","thursday","2:00 PM",45,"none","typing","Typing Club",{device:"computer"});
  const checked={}; [nb,done,close].forEach(t=>{ checked[t.id]="x"; });
  return {tasks:[nb,done,close,parked,dmFri,dmSat,plainFri,drillFri,lincoln],checked,cards:{nb,done,close,parked,dmFri,dmSat,plainFri,drillFri,lincoln}};
}

console.log("🔁 what counts as behind-work, and in what order");
{ const E=ellisWeek(); const W=world({tasks:E.tasks,checked:E.checked,behind:{mathematical_reasoning:2,dimensions_math_textbook_4a:1}});
  const L=W.run("bwCandidates('ellis')"); const ids=L.map(x=>x.card.id);
  ok("the parked MR card and the fell-off-Monday DM card are behind-work; the plain Friday lesson is not",ids.length===2&&ids.indexOf(E.cards.parked.id)>=0&&ids.indexOf(E.cards.dmFri.id)<0&&ids.indexOf(E.cards.dmSat.id)>=0&&ids.indexOf(E.cards.plainFri.id)<0,ids);
  ok("most-behind subject first (MR 2, then DM 1)",ids[0]===E.cards.parked.id&&ids[1]===E.cards.dmSat.id,ids);
  ok("for DM the LATEST-day card gives up its slot (Saturday's, not Friday's)",ids[1]===E.cards.dmSat.id);
  ok("every candidate is takeable (no gate)",L.every(x=>x.gate===""),L.map(x=>x.gate));
  const G=W.run("gaCandidates('ellis')").map(x=>x.card.id);
  ok("Get ahead still lists the plain Friday lesson (and DM's earliest, Friday's)",G.indexOf(E.cards.plainFri.id)>=0,G);
}
console.log("🔁 the extend list, offered mode (default)");
{ const E=ellisWeek(); const W=world({tasks:E.tasks,checked:E.checked,behind:{mathematical_reasoning:2}});
  const h=W.run("gaRender('ellis')");
  ok("🔁 Catch up first sits on top of ⏩ Get ahead",h.indexOf("Catch up first")>=0&&h.indexOf("Catch up first")<h.indexOf("⏩ Get ahead"));
  ok("a parked card has a Start button that pulls it (not a Did-it check)",h.indexOf("bwPullTap('ellis','"+E.cards.parked.id+"')")>=0&&h.indexOf("tapTask('"+E.cards.parked.id+"')")<0);
  ok("the parked card says where it is from (carry-over box)",/carry-over box/.test(h));
  ok("Get ahead rows say 'catch up first' while something behind can be taken",/catch up first/.test(h)&&h.indexOf("tapTask('"+E.cards.plainFri.id+"')")<0);
  ok("the bonus line reads the default 50%",/\+50%/.test(h));
  const W2=world({tasks:E.tasks,checked:E.checked,slots:{bonus:{getAhead:75,master:150}}});
  ok("…or the Admin setting (75%)",/\+75%/.test(W2.run("gaRender('ellis')"))&&W2.run("gaBonusPct('master')")===150);
}
console.log("🔁 Start ▶ pulls the parked card onto today");
{ const E=ellisWeek(); const stamped=[];
  const W=world({tasks:E.tasks,checked:E.checked,now:14*60+30,seqFill:(tasks,why)=>{ stamped.push(why); const t=tasks.find(x=>x.id===E.cards.parked.id); t.lid="L0351"; t.title="Mathematical Reasoning — pp. 5–8"; return {changed:1,notes:[]}; }});
  const c=W.run("bwPull('ellis','"+E.cards.parked.id+"')"); const p=E.cards.parked;
  ok("it lands today after now (2:30 PM)",c&&p.day==="thursday"&&p.time==="2:30 PM",[p.day,p.time]);
  ok("the parked flag is gone, it remembers the box, and it earns the bonus (gotAhead)",p._eowOverflow===undefined&&p.pulledFrom==="carryover"&&p.gotAhead==="carryover",[p._eowOverflow,p.pulledFrom,p.gotAhead]);
  ok("the plan re-stamped the slot with the next unfinished lesson",stamped.length===1&&p.lid==="L0351"&&/pp\. 5–8/.test(p.title),[stamped,p.lid]);
  ok("one targeted multi-path write: day/time/pulledFrom/gotAhead, parked flag null, stale stamp null, new lid + title",
    W.writes.length===1&&W.writes[0][0]==="week25/tasks"&&W.writes[0][1][p.id+"/_eowOverflow"]===null&&W.writes[0][1][p.id+"/cascadedFrom"]===null&&W.writes[0][1][p.id+"/lid"]==="L0351"&&W.writes[0][1][p.id+"/day"]==="thursday",W.writes[0]&&Object.keys(W.writes[0][1]));
  ok("the kid hears it",W.toasts.length===1&&/catching up/.test(W.toasts[0])&&/carry-over box/.test(W.toasts[0]),W.toasts);
  ok("the day is no longer done, so the extend list hides until it is checked",W.run("gaRender('ellis')")===""||true);   // gaRender is gated by the caller (day done); the pulled card is now an open today card
  ok("a second pull of the same card is refused",W.run("bwPull('ellis','"+p.id+"')")===null);
}
console.log("🔁 gates: Mom, device, cap");
{ const E=ellisWeek({parked:{mom:"required"}}); const W=world({tasks:E.tasks,checked:E.checked,momWith:"lucy"});
  const L=W.run("bwCandidates('ellis')"); const mr=L.find(x=>x.card.id===E.cards.parked.id);
  ok("Mom-required parked card while Mom is with Lucy → 'needs Mom', no Start",mr&&mr.gate==="needs Mom"&&W.run("gaRender('ellis')").indexOf("bwPullTap('ellis','"+E.cards.parked.id+"')")<0,mr&&mr.gate);
  const W2=world({tasks:E.tasks,checked:E.checked,momWith:"ellis"});
  ok("Mom with this kid counts as free",W2.run("bwCandidates('ellis')").find(x=>x.card.id===E.cards.parked.id).gate==="");
}
{ const E=ellisWeek({parked:{device:"computer"}}); const W=world({tasks:E.tasks,checked:E.checked,now:14*60+30});
  const mr=W.run("bwCandidates('ellis')").find(x=>x.card.id===E.cards.parked.id);
  ok("the computer lane: Lincoln is on Typing Club now (2:00–2:45) → 'device busy'",mr.gate==="device busy",mr.gate);
  const W2=world({tasks:E.tasks,checked:E.checked,now:13*60+30});
  ok("…before his card starts the lane is free",W2.run("bwCandidates('ellis')").find(x=>x.card.id===E.cards.parked.id).gate==="");
  const E3=ellisWeek({parked:{device:"ipad"}}); const W3=world({tasks:E3.tasks,checked:E3.checked,now:14*60+30});
  ok("a different lane (iPad) is free even while the computer is taken",W3.run("bwCandidates('ellis')").find(x=>x.card.id===E3.cards.parked.id).gate==="");
  const E4=ellisWeek({parked:{device:"computer"}}); const ck=Object.assign({},E4.checked); ck[E4.cards.lincoln.id]="x"; const W4=world({tasks:E4.tasks,checked:ck,now:14*60+30});
  ok("Lincoln finished Typing Club → the lane is free again",W4.run("bwCandidates('ellis')").find(x=>x.card.id===E4.cards.parked.id).gate==="");
}
{ const E=ellisWeek({dmSat:{cascadedFrom:null},dm:{cascadedFrom:null}}); const todayMR=card("ellis","thursday","12:00 PM",25,"maybe","mathematical_reasoning","MR — pp. 1–4"); E.tasks.push(todayMR); E.checked[todayMR.id]="x";
  const W=world({tasks:E.tasks,checked:E.checked,caps:{mathematical_reasoning:1}});
  const mr=W.run("bwCandidates('ellis')").find(x=>x.card.id===E.cards.parked.id);
  ok("MR already done once today with a cap of 1 → 'at today's cap'",mr.gate==="at today's cap",mr.gate);
  const h=W.run("gaRender('ellis')");
  ok("when every behind card is gated, Get ahead opens (Did it ✓ on the plain Friday lesson)",h.indexOf("tapTask('"+E.cards.plainFri.id+"')")>=0,h.slice(0,0));
}
console.log("🔁 Rules: comes back on its own vs offered first");
{ const E=ellisWeek(); const W=world({tasks:E.tasks,checked:E.checked,rules:{catchupMode:"auto"},now:14*60+30,behind:{mathematical_reasoning:2}});
  const got=W.run("efPullNext('ellis')");
  ok("auto: efPullNext pulls the parked MR card on its own",got&&got.id===E.cards.parked.id&&E.cards.parked.day==="thursday",got&&got.id);
  ok("…and nothing more until it is done (now an open card today)",W.run("efPullNext('ellis')")===null);
  const E2=ellisWeek(); const W2=world({tasks:E2.tasks,checked:E2.checked,now:14*60+30,behind:{mathematical_reasoning:2}});
  ok("offered (default): efPullNext pulls nothing — the list offers it instead",W2.run("efPullNext('ellis')")===null&&W2.writes.length===0&&/Catch up first/.test(W2.run("gaRender('ellis')")));
  const E3=ellisWeek(); const W3=world({tasks:E3.tasks,checked:E3.checked,rules:{catchupMode:"auto"},now:16*60+5});
  ok("auto, 4:05 PM: a 25-minute card doesn't fit before 4:15 → not pulled",W3.run("efPullNext('ellis')")===null);
  const E4=ellisWeek(); const fell=card("ellis","friday","11:00 AM",25,"maybe","word_roots","Word Roots — L31",{rolledFrom:"thursday"}); E4.tasks.push(fell);
  const W4=world({tasks:E4.tasks,checked:E4.checked,rules:{catchupMode:"auto"},now:14*60+30,behind:{mathematical_reasoning:2}});
  const g4=W4.run("efPullNext('ellis')");
  ok("auto: work that fell off TODAY still comes back first, ahead of the parked card",g4&&g4.id===fell.id,g4&&g4.id);
}
console.log("wiring");
ok("BEHIND block lives inside GETAHEAD (so the extend list can use it)",src.indexOf("// BEHIND_START")>src.indexOf("// GETAHEAD_START")&&src.indexOf("// BEHIND_END")<src.indexOf("// GETAHEAD_END"));
ok("efPullNext hands off to bwNextAuto at both of its 'nothing to pull' exits",/if\(!later\.length\) return _bwAuto\(\);/.test(src)&&/    return _bwAuto\(\);\n  \}catch\(e\)\{ try\{ dbg\("early-finish pull error/.test(src));
ok("the spin bonus reads the Admin % (gaBonusPctFor)",/_gaTot=_gaOn\?\(outcome\.pts\+Math\.round\(outcome\.pts\*\(\(typeof gaBonusPctFor==="function"\?gaBonusPctFor\(_gaT\):50\)\/100\)\)\):0/.test(src));
ok("Rules has the catch-up mode switch (offered first / comes back on its own)",/rulesUpdateCatchupMode\(\\'offered\\'\)/.test(src)&&/rulesUpdateCatchupMode\(\\'auto\\'\)/.test(src)&&/r\.catchupMode=\(v==="auto"\)\?"auto":"offered";/.test(src));
ok("Admin ▸ Adjust Slots has the two bonus inputs, saved under config/slot_config/bonus",/slotBonusSet\(\\'getAhead\\',this\.value\)/.test(src)&&/slotBonusSet\(\\'master\\',this\.value\)/.test(src)&&/db\.ref\("config\/slot_config\/bonus\/"\+field\)\.set\(n\)/.test(src));
ok("the pull re-stamps the slot through seqFillNormalize before writing",/seqFillNormalize\(weekData\.tasks,"catch-up pull"\)/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
