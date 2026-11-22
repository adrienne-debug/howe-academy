/*
 * ⏰ EVHOLD — a calendar event can HOLD its time (her choices 2026-11-22: "Holds the time" · "Before and after" · "Only that
 * kid" · "Re-plan right away"). Step B of PLAN_event_time_hold_2026-11-22.md.
 *
 * The WHOLE app runs in the vm sandbox of test_demo_week.js on the synthetic demo family (school 9:00 AM–3:30 PM, lunch
 * 12:00–12:45, week 1 = Mon 2026-11-09 …, a timed co-op for kid_b on Thu 11/12 9:00 AM–1:00 PM). What is proved:
 *   1. Switch OFF = nothing: events with a length but no hold, a waiting event that carries hold, hold with a time the app
 *      can't read, hold with no length — the built week and every write are identical to a calendar with no events.
 *   2. Switch ON at generation: school is laid BEFORE and AFTER the block; no open card of a held kid sits inside it; nothing
 *      is lost; the other days are untouched. One kid's block holds only that kid.
 *   3. A block that starts at school start lays the day exactly as a one-day timed co-op does.
 *   4. The built week: saving the form with the switch on goes through the ONE re-lay door — cards inside the block move
 *      later, a log line with Undo; Undo puts the cards back and leaves the event on the calendar, not held. With the
 *      switch off before and after, a save writes the event and nothing else.
 *   5. Today's live lay steps around a block; a kid inside one is not offered to Mom; a planner-style move (date / time
 *      written directly) carries the block along at the same length.
 *   6. The risks: two blocks in a day, a block on a co-op day, a block over the whole school day, a weekend, a waiting event.
 * No kid or family names: the fixture is synthetic.   run: node test_event_time_hold.js    (EV_VERBOSE=1 echoes the app's console)
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const SRC=fs.readFileSync(INDEX,"utf8");

let pass=0, fail=0;
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,900)+")":"")); } }
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };
const MON="2026-11-09", TUE="2026-11-10", WED="2026-11-11", THU="2026-11-12", FRI="2026-11-13", SAT="2026-11-14";
const KIDS=["kid_a","kid_b","kid_c","kid_d"];

// o = {events, db(d) → reshape the fixture}
async function world(o){
  o=o||{};
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const d=JSON.parse(JSON.stringify(FX.db)); if(o.events) d.calendar.events=JSON.parse(JSON.stringify(o.events)); if(o.db) o.db(d);
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };   // the same ids in every world
  const A=S.bootDevice({name:o.name||"A",dev:"dev_a",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.EV_VERBOSE,globals:{Math:M}});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);          // Sunday: week 1 builds itself
  A.run('globalThis.__toasts=[]; gwShowToast=function(m){ globalThis.__toasts.push(String(m)); }; globalThis.__alerts=[]; alert=function(m){ globalThis.__alerts.push(String(m)); };');
  const W={A,db,clock,flush,
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id),
    checked:()=>db.get(W.wk()+"/checked")||{},
    relayLog:()=>db.get(W.wk()+"/relayLog")||{},
    ev:id=>db.get("calendar/events/"+id),
    at:async(iso,h,m)=>{ clock.now=hm(iso,h,m); await flush(1000); }};
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; A.fn("dayRollCheck")(); await flush(90000); };
  // the real form: fill the fields, tap Add / Update
  W.form=(f)=>{ A.run('(function(f){ const s=(i,v)=>{ document.getElementById(i).value=v; }; s("cal-ev-title",f.title); s("cal-ev-date",f.date); s("cal-ev-time",f.time||""); s("cal-ev-who",f.who||"family"); s("cal-ev-emoji",f.emoji||"🎉"); s("cal-ev-end",f.end||""); document.getElementById("cal-ev-hold").checked=!!f.hold; calAddMode="event"; calEditId=f.id||null; calSaveEvent(); })('+JSON.stringify(f)+')'); };
  return W;
}
const stable=o=>JSON.stringify(o,(k,v)=>(v&&typeof v==="object"&&!Array.isArray(v))?Object.keys(v).sort().reduce((a,x)=>{ a[x]=v[x]; return a; },{}):v);
const live=t=>t&&t.id&&!String(t.id).endsWith("_c");
const boardFp=W=>stable(W.board().slice().sort((a,b)=>String(a.id).localeCompare(String(b.id))));
const dayFp=(W,days)=>stable(W.board().filter(t=>live(t)&&days.indexOf(t.day)>=0).map(t=>[t.id,t.who,t.subjectKey||"",t.day,t.time,t.dur||0,!!t._dayDrop,!!t._eowOverflow]).sort());
const shapeFp=(W,day)=>stable(W.board().filter(t=>live(t)&&t.day===day).map(t=>[t.who,t.subjectKey||"",t.time,t.dur||0,t.title||""]).sort());   // id-free: what the day looks like
const logFp=W=>stable(W.db.log.map(l=>[l.op,l.path,(l.keys||[]).slice().sort(),l.n]));
const onDay=(W,day,kid)=>W.board().filter(t=>live(t)&&t.day===day&&(!kid||t.who===kid)&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null);
const inWin=(t,s,e)=>toMin(t.time)<e&&s<toMin(t.time)+(+t.dur||20);
// a fixed-time class and family time are set times of their own: a held block never moves them (they are not "open work")
const isSet=t=>t.subjectKey==="german_class"||!!t.famBlock;
const inBlk=(t,s,e)=>!isSet(t)&&inWin(t,s,e);
const subjSet=(W,day,kid)=>W.board().filter(t=>live(t)&&t.day===day&&t.who===kid).map(t=>t.subjectKey||t.title).sort().join(",");
const held=(o)=>Object.assign({title:"Museum trip",emoji:"🏛",who:"family",hold:true},o);

(async function(){
  // ── 0. the rule, in the small ──
  console.log("what counts as held");
  const P=await world({name:"plain"});
  const R=e=>P.A.run(e);
  ok("the EVHOLD block is marked",SRC.indexOf("// EVHOLD_START")>0&&SRC.indexOf("// EVHOLD_END")>SRC.indexOf("// EVHOLD_START"));
  ok("evHoldMins: a start and a later end → the length",R('evHoldMins("2:30 PM","4:00 PM")')===90&&R('evHoldMins("9am","1pm")')===240);
  [["2:30 PM",""],["","4:00 PM"],["2:30 PM","2:30 PM"],["4:00 PM","2:30 PM"],["2:30","4:00 PM"],["14:30","16:00"],["afternoon","4:00 PM"],["2:30 PM","later"]]
    .forEach(p=>ok("evHoldMins("+JSON.stringify(p[0])+", "+JSON.stringify(p[1])+") → null",R('evHoldMins('+JSON.stringify(p[0])+','+JSON.stringify(p[1])+')')===null));
  const H=o=>R('JSON.stringify(evHeld('+JSON.stringify(o)+'))');
  ok("held: hold + a readable start + a length → [start,end]",H({hold:true,time:"2:30 PM",mins:90})==="[870,960]");
  ok("not held: no hold (every event that exists today)",H({time:"2:30 PM",mins:90})==="null"&&H({time:"6:15 PM"})==="null");
  ok("not held: hold is anything but true",H({hold:"yes",time:"2:30 PM",mins:90})==="null"&&H({hold:1,time:"2:30 PM",mins:90})==="null");
  ok("not held: still waiting for Mom",H({hold:true,pending:true,time:"2:30 PM",mins:90})==="null");
  ok("not held: a start the app can't read, or none",H({hold:true,time:"14:30",mins:90})==="null"&&H({hold:true,time:"",mins:90})==="null"&&H({hold:true,time:"after lunch",mins:90})==="null");
  ok("not held: no length, a bad one, or one that runs past midnight",H({hold:true,time:"2:30 PM"})==="null"&&H({hold:true,time:"2:30 PM",mins:0})==="null"&&H({hold:true,time:"2:30 PM",mins:-30})==="null"&&H({hold:true,time:"2:30 PM",mins:"x"})==="null"&&H({hold:true,time:"11:00 PM",mins:90})==="null");

  // ── 1. switch off = nothing ──
  console.log("switch off: the built week and every write are identical");
  const OFF={
    e1:{title:"Evening show",date:WED,time:"6:15 PM",who:"family",emoji:"🚂"},
    e2:{title:"Has an end, not held",date:WED,time:"10:00 AM",mins:60,who:"family",emoji:"🎉"},
    e3:{title:"Waiting, says hold",date:WED,time:"10:00 AM",mins:60,hold:true,pending:true,addedBy:"kid_a",who:"kid_a",emoji:"🎈"},
    e4:{title:"Hold, odd clock",date:WED,time:"10 o'clock",mins:60,hold:true,who:"family",emoji:"🎉"},
    e5:{title:"Hold, no length",date:WED,time:"10:00 AM",hold:true,who:"family",emoji:"🎉"},
    e6:{title:"Hold is a word",date:WED,time:"10:00 AM",mins:60,hold:"true",who:"family",emoji:"🎉"}};
  [MON,TUE,THU,FRI].forEach((d,i)=>{ OFF["s"+i]={title:"Evening show",date:d,time:"6:15 PM",who:"family",emoji:"🚂"}; });
  const O=await world({name:"off",events:OFF});
  ok("the week built",P.board().length>20);
  ok("every card identical to a calendar with no events",boardFp(P)===boardFp(O));
  ok("every database write identical",logFp(P)===logFp(O),[P.db.log.length,O.db.log.length]);
  ok("no kid is held on any day",O.A.run('JSON.stringify(ROSTER.map(function(k){ return ["'+[MON,TUE,WED,THU,FRI].join('","')+'"].map(function(d){ return evHoldFor(k,d).length; }); }))')===JSON.stringify(KIDS.map(()=>[0,0,0,0,0])));

  // ── 2. switch on, at generation ──
  console.log("switch on: the week is built around the block (Wed 10:00–11:00 AM, the whole family)");
  const G=await world({name:"gen",events:{h1:held({date:WED,time:"10:00 AM",mins:60})}});
  const wedP=onDay(P,"wednesday"), wedG=onDay(G,"wednesday");
  ok("without the block, cards do sit between 10 and 11 on Wednesday (so the test means something)",wedP.filter(t=>inWin(t,600,660)).length>=3,wedP.filter(t=>inWin(t,600,660)).length);
  ok("with it: no card of any kid is inside the block",wedG.filter(t=>inBlk(t,600,660)).length===0,wedG.filter(t=>inBlk(t,600,660)).map(t=>t.who+" "+t.title+" "+t.time));
  KIDS.forEach(k=>{ const mine=onDay(G,"wednesday",k); if(!onDay(P,"wednesday",k).length) return;
    ok(k+": school BEFORE the block and AFTER it",mine.some(t=>toMin(t.time)+(+t.dur||20)<=600)&&mine.some(t=>toMin(t.time)>=660),mine.map(t=>t.time));
    ok(k+": every subject of the day is still on the day",subjSet(G,"wednesday",k)===subjSet(P,"wednesday",k),[subjSet(G,"wednesday",k),subjSet(P,"wednesday",k)]); });
  ok("each kid's Morning Notebook is still first and Closing Notebook last (it comes after the block, as it does after a class)",KIDS.every(k=>{ const m=onDay(G,"wednesday",k).sort((x,y)=>toMin(x.time)-toMin(y.time)); return !m.length||(m[0].subjectKey==="morning_nb"&&m[m.length-1].subjectKey==="closing_nb"); }));
  ok("a fixed-time class inside the block stays at its own time (a set time is never moved)",wedG.some(t=>t.subjectKey==="german_class"&&t.time==="10:00 AM")&&wedP.some(t=>t.subjectKey==="german_class"&&t.time==="10:00 AM"));
  ok("the day still ends by 3:30 PM and no kid's cards stack",wedG.every(t=>toMin(t.time)+(+t.dur||20)<=930)&&KIDS.every(k=>{ const m=onDay(G,"wednesday",k).sort((a,b)=>toMin(a.time)-toMin(b.time)); return m.every((t,i)=>!i||toMin(m[i-1].time)+(+m[i-1].dur||20)<=toMin(t.time)); }));
  ok("the other days of the week are exactly as they were",["monday","tuesday","thursday","friday"].every(d=>shapeFp(G,d)===shapeFp(P,d)),["monday","tuesday","thursday","friday"].filter(d=>shapeFp(G,d)!==shapeFp(P,d)));
  ok("building wrote no calendar event",!G.db.log.some(l=>/calendar\/events/.test(l.path)));

  console.log("one kid's block holds only that kid");
  const K=await world({name:"kid",events:{h1:held({date:WED,time:"10:00 AM",mins:60,who:"kid_a",title:"Eye check"})}});
  ok("kid_a: nothing inside the block, every subject still on the day",onDay(K,"wednesday","kid_a").filter(t=>inBlk(t,600,660)).length===0&&subjSet(K,"wednesday","kid_a")===subjSet(P,"wednesday","kid_a"));
  ok("the others still have school inside it (Mom stays free for them)",onDay(K,"wednesday").filter(t=>t.who!=="kid_a"&&inWin(t,600,660)).length>=2,onDay(K,"wednesday").filter(t=>t.who!=="kid_a"&&inWin(t,600,660)).length);
  ok("…and a Mom-required card of another kid can sit inside it",onDay(K,"wednesday").some(t=>t.who!=="kid_a"&&t.mom==="required"&&inWin(t,600,660))||!onDay(P,"wednesday").some(t=>t.who!=="kid_a"&&t.mom==="required"&&inWin(t,600,660)));
  ok("only kid_a is held: evHoldFor",K.A.run('JSON.stringify(ROSTER.map(function(k){ return evHoldFor(k,"'+WED+'"); }))')==='[[[600,660]],[],[],[]]');

  // ── 3. a block from school start = a one-day co-op ──
  console.log("a block that starts at school start lays the day exactly as a timed co-op does");
  const C=await world({name:"coop",db:d=>{ d.calendar.coops.coop1.noMomBase=false; }});
  const E=await world({name:"as event",db:d=>{ d.calendar.coops={}; },events:{h1:held({date:THU,time:"9:00 AM",mins:240,who:"kid_b",title:"Morning out"})}});
  ok("the co-op world: kid_b's Thursday starts at 1:00 PM or later",onDay(C,"thursday","kid_b").length>0&&onDay(C,"thursday","kid_b").every(t=>toMin(t.time)>=780),onDay(C,"thursday","kid_b").map(t=>t.time));
  ok("the event world: kid_b's Thursday is card for card the same (subject, time, length)",stable(onDay(E,"thursday","kid_b").map(t=>[t.subjectKey,t.time,t.dur]).sort())===stable(onDay(C,"thursday","kid_b").map(t=>[t.subjectKey,t.time,t.dur]).sort()),[onDay(E,"thursday","kid_b").map(t=>t.subjectKey+" "+t.time),onDay(C,"thursday","kid_b").map(t=>t.subjectKey+" "+t.time)]);
  ok("…and so is everyone else's Thursday",shapeFp(E,"thursday")===shapeFp(C,"thursday"));
  ok("…and the rest of the week",["monday","tuesday","wednesday","friday"].every(d=>shapeFp(E,d)===shapeFp(C,d)),["monday","tuesday","wednesday","friday"].filter(d=>shapeFp(E,d)!==shapeFp(C,d)));

  // ── 4. the built week: the form, the door, Undo ──
  console.log("the built week: Mom turns Hold on for Wednesday (Monday 8:00 AM)");
  const D=await world({name:"door",events:{show:{title:"Evening show",date:WED,time:"6:15 PM",who:"family",emoji:"🚂"}}});
  await D.at(MON,8,0);
  ok("the week on the board is the plain one",dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===dayFp(P,["monday","tuesday","wednesday","thursday","friday"]));
  const formHtml=D.A.run('calEditId=null; calRenderEventForm()');
  ok("the form has an end time and the switch, OFF by default",/id="cal-ev-end"/.test(formHtml)&&/<input type="checkbox" id="cal-ev-hold" onchange="evHoldTick\(this\)"> ⏰ Hold this time — school is planned around it/.test(formHtml)&&!/id="cal-ev-hold" checked/.test(formHtml));
  ok("…and says in plain words what the switch needs",formHtml.indexOf("To hold the time, give a start and an end like 2:30 PM and 4:00 PM.")>0);
  // can't be turned on without both times
  ok("the switch refuses to turn on with no end time",D.A.run('(function(){ document.getElementById("cal-ev-time").value="10:00 AM"; document.getElementById("cal-ev-end").value=""; const el={checked:true}; evHoldTick(el); return el.checked; })()')===false);
  ok("…or with a time the app can't read",D.A.run('(function(){ document.getElementById("cal-ev-time").value="morning"; document.getElementById("cal-ev-end").value="11:00 AM"; const el={checked:true}; evHoldTick(el); return el.checked; })()')===false);
  ok("…and turns on with both",D.A.run('(function(){ document.getElementById("cal-ev-time").value="10:00 AM"; document.getElementById("cal-ev-end").value="11:00 AM"; const el={checked:true}; evHoldTick(el); return el.checked; })()')===true);
  let n0=D.db.log.length;
  D.form({title:"Museum trip",date:WED,time:"10:00 AM",end:"",hold:true,emoji:"🏛"});
  ok("Save with the switch on and no end: she is told why, nothing is saved",D.A.get("globalThis.__alerts").length===1&&/give a start and an end/.test(D.A.get("globalThis.__alerts")[0])&&D.db.log.length===n0);

  // a plain save (switch off) writes the event and nothing else
  n0=D.db.log.length; const log0=Object.keys(D.relayLog()).length, before=dayFp(D,["monday","tuesday","wednesday","thursday","friday"]);
  D.form({id:"show",title:"Evening show (moved)",date:WED,time:"6:30 PM",emoji:"🚂"});
  await D.flush(20000);
  ok("switch off: editing a timed event writes ONE thing — the event",D.db.log.length===n0+1&&D.db.log[n0].op==="set"&&D.db.log[n0].path==="calendar/events/show",D.db.log.slice(n0).map(l=>l.op+" "+l.path));
  ok("…its record carries no hold and no length",stable(D.ev("show"))===stable({title:"Evening show (moved)",date:WED,time:"6:30 PM",who:"family",emoji:"🚂"}));
  ok("…no re-plan, no log line, no card moved",Object.keys(D.relayLog()).length===log0&&dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===before);
  n0=D.db.log.length;
  D.form({title:"Has an end",date:WED,time:"10:00 AM",end:"11:00 AM",hold:false});
  await D.flush(20000);
  const endId=Object.keys(db_events(D)).find(id=>db_events(D)[id].title==="Has an end");
  ok("switch off with an end time: the length is kept, still ONE write, nothing re-planned",D.db.log.length===n0+1&&D.ev(endId).mins===60&&D.ev(endId).hold===undefined&&dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===before);

  // now the switch on
  n0=D.db.log.length;
  D.form({title:"Museum trip",date:WED,time:"10:00 AM",end:"11:00 AM",hold:true,emoji:"🏛"});
  const hid=Object.keys(db_events(D)).find(id=>db_events(D)[id].title==="Museum trip");
  ok("the event is saved at once, with its length and hold",!!hid&&stable(D.ev(hid))===stable({title:"Museum trip",date:WED,time:"10:00 AM",who:"family",emoji:"🏛",mins:60,hold:true}),D.ev(hid));
  ok("the first write is the event record, one set",D.db.log[n0].op==="set"&&D.db.log[n0].path==="calendar/events/"+hid);
  await D.flush(20000);
  const wedD=onDay(D,"wednesday");
  ok("re-planned right away: no open card is inside 10:00–11:00 on Wednesday",wedD.filter(t=>inBlk(t,600,660)).length===0,wedD.filter(t=>inBlk(t,600,660)).map(t=>t.who+" "+t.time));
  ok("every Wednesday card is still on the board (same ids)",onDay(P,"wednesday").every(t=>D.board().some(x=>x.id===t.id)));
  ok("cards before the block did not move",onDay(P,"wednesday").filter(t=>toMin(t.time)+(+t.dur||20)<=600).every(t=>{ const x=D.board().find(y=>y.id===t.id); return x&&x.day==="wednesday"&&x.time===t.time; }));
  ok("Monday and Tuesday did not change",dayFp(D,["monday","tuesday"])===dayFp(P,["monday","tuesday"]));
  const rl=D.relayLog(), rk=Object.keys(rl).sort(), entry=rl[rk[rk.length-1]]||{};
  ok("one log line: what holds, when, how many cards moved",rk.length===log0+1&&entry.label==="⏰ Museum trip 10:00 AM–11:00 AM"&&entry.n>0,entry);
  ok("its Undo names one thing: the event's hold",stable(entry.undo)===stable([{p:"calendar/events/"+hid+"/hold",gone:true}]),entry.undo);
  ok("every moved card was a Wednesday card inside the block or behind one",(entry.moves||[]).length>0&&(entry.moves||[]).every(m=>m.from.d==="wednesday"),(entry.moves||[]).map(m=>m.from.d+" "+m.from.t+"→"+m.to.d+" "+m.to.t));
  const wr=D.db.log.slice(n0+1);
  ok("the cards were written with targeted updates — never a whole-node set of the week",wr.length>0&&!wr.some(l=>l.whole)&&!wr.some(l=>l.op==="set"&&/\/tasks$/.test(l.path)),wr.map(l=>l.op+" "+l.path+(l.whole?" WHOLE":"")).slice(0,8));
  ok("nothing but the week's cards, its log and the scheduler's own lock was written",wr.every(l=>/^week\d+\/(tasks|relayLog)|lock|_debug|sched|heartbeat|meta/i.test(l.path)),wr.map(l=>l.path).filter(p=>!/^week\d+\/(tasks|relayLog)|lock|_debug|sched|heartbeat|meta/i.test(p)));
  ok("the toast says cards moved",D.A.get("globalThis.__toasts").some(m=>/Museum trip/.test(m)&&/moved/.test(m)),D.A.get("globalThis.__toasts").slice(-3));
  const rowHtml=D.A.run('kid="all"; day="wednesday"; allAgendaHtml(dsDoneAtTime(mlQueueLay(dsRetime(weekData.tasks))).filter(function(t){ return effectiveDay(t)==="wednesday"&&!String(t.id).endsWith("_c"); }))');
  ok("the day shows the block with its end and ⏰",rowHtml.indexOf("🏛 Museum trip · 10:00 AM–11:00 AM ⏰</div>")>0,rowHtml.slice(rowHtml.indexOf("Museum")-60,rowHtml.indexOf("Museum")+80));

  console.log("a new name for a held event does not re-plan; Undo puts the cards back");
  const afterOn=dayFp(D,["monday","tuesday","wednesday","thursday","friday"]); n0=D.db.log.length;
  D.form({id:hid,title:"Museum trip!",date:WED,time:"10:00 AM",end:"11:00 AM",hold:true,emoji:"🏛"}); await D.flush(20000);
  ok("same block, new name: one write, no re-plan",D.db.log.length===n0+1&&Object.keys(D.relayLog()).length===rk.length&&dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===afterOn);
  ok("the edit form shows the end and the switch ON",(function(){ const h=D.A.run('calEditId="'+hid+'"; calRenderEventForm()'); return /id="cal-ev-end"[^>]*value="11:00 AM"/.test(h)&&/id="cal-ev-hold" checked/.test(h); })());
  D.A.run('calEditId=null; calAddMode=null;');
  D.A.fn("relayUndo")(rk[rk.length-1]); await D.flush(20000);
  ok("Undo: every card is back where it was",dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===before,[afterOn.length,before.length]);
  ok("Undo: the event stays on the calendar as saved — only its hold is gone",stable(D.ev(hid))===stable({title:"Museum trip!",date:WED,time:"10:00 AM",who:"family",emoji:"🏛",mins:60}),D.ev(hid));
  ok("…so nobody is held any more, on this device too",D.A.run('JSON.stringify(evHoldFor("kid_a","'+WED+'"))')==="[]");
  D.A.fn("relayWeek")("calendar",{label:"another re-plan"}); await D.flush(20000);
  ok("…and the next re-plan moves nothing (it stays put back)",dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===before);

  console.log("Hold on again, then off; then the event deleted");
  D.form({id:hid,title:"Museum trip!",date:WED,time:"10:00 AM",end:"11:00 AM",hold:true,emoji:"🏛"}); await D.flush(20000);
  ok("on again: the same re-plan as the first time",dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===afterOn);
  let lines=Object.keys(D.relayLog()).length; n0=D.db.log.length;
  D.form({id:hid,title:"Museum trip!",date:WED,time:"10:00 AM",end:"11:00 AM",hold:false,emoji:"🏛"});
  ok("off: it goes through the same door (a re-plan is queued)",D.A.run("!!_rlwPend")===true);
  await D.flush(20000);
  ok("off: the record keeps its length, loses hold",stable(D.ev(hid))===stable({title:"Museum trip!",date:WED,time:"10:00 AM",who:"family",emoji:"🏛",mins:60}));
  ok("off: nothing needs to move, so no log line and no moved-cards toast",Object.keys(D.relayLog()).length===lines&&dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===afterOn);
  // a longer block, then moved to another day, then deleted
  D.form({id:hid,title:"Museum trip!",date:WED,time:"9:30 AM",end:"11:00 AM",hold:true,emoji:"🏛"}); await D.flush(20000);
  ok("on with an earlier start (9:30–11:00): nothing inside the longer block",onDay(D,"wednesday").filter(t=>inBlk(t,570,660)).length===0);
  lines=Object.keys(D.relayLog()).length;
  D.form({id:hid,title:"Museum trip!",date:THU,time:"9:30 AM",end:"11:00 AM",hold:true,emoji:"🏛"}); await D.flush(20000);
  { const rl2=D.relayLog(), k2=Object.keys(rl2).sort(), e2=rl2[k2[k2.length-1]];
    ok("moved to Thursday: Thursday is planned around it",onDay(D,"thursday").filter(t=>inBlk(t,570,660)).length===0&&k2.length===lines+1);
    ok("…and that line's Undo is the whole event as it was (the Wednesday block)",e2.undo.length===1&&e2.undo[0].p==="calendar/events/"+hid&&e2.undo[0].was&&e2.undo[0].was.date===WED&&e2.undo[0].was.hold===true&&e2.undo[0].was.mins===90,e2.undo); }
  D.form({id:hid,title:"Museum trip!",date:THU,time:"9:30 AM",end:"11:00 AM",hold:true,who:"kid_a",emoji:"🏛"});
  ok("who changed (the family → one kid): through the same door",D.A.run("!!_rlwPend")===true&&D.ev(hid).who==="kid_a");
  await D.flush(20000);
  ok("…now only kid_a is held on Thursday",D.A.run('JSON.stringify(ROSTER.map(function(k){ return evHoldFor(k,"'+THU+'").length; }))')==="[1,0,0,0]");
  lines=Object.keys(D.relayLog()).length; const preDel=dayFp(D,["monday","tuesday","wednesday","thursday","friday"]);
  D.A.run('calDeleteEvent("'+hid+'")');
  ok("deleted: through the same door",D.A.run("!!_rlwPend")===true&&D.ev(hid)===null);
  await D.flush(20000);
  ok("deleted: nothing needs to move, no log line",Object.keys(D.relayLog()).length===lines&&dayFp(D,["monday","tuesday","wednesday","thursday","friday"])===preDel);

  console.log("a date that is not on the board");
  n0=D.db.log.length;
  D.form({title:"Next week's trip",date:"2026-11-18",time:"10:00 AM",end:"11:00 AM",hold:true});
  ok("a held event for NEXT week: one write, no re-plan queued (that week reads it when it is built)",D.db.log.length===n0+1&&D.A.run("!!_rlwPend")===false);
  n0=D.db.log.length;
  D.form({title:"Last week's trip",date:"2026-11-04",time:"10:00 AM",end:"11:00 AM",hold:true});
  ok("a held event in the past: one write, nothing else",D.db.log.length===n0+1&&D.A.run("!!_rlwPend")===false);

  console.log("Mom OKs a waiting event that carries hold");
  const Q=await world({name:"ok",events:{w1:{title:"Swim meet",date:WED,time:"10:00 AM",mins:60,hold:true,pending:true,addedBy:"kid_a",who:"kid_a",emoji:"🏊"}}});
  await Q.at(MON,8,0);
  ok("while it waits, the week is the plain one",dayFp(Q,["monday","tuesday","wednesday","thursday","friday"])===dayFp(P,["monday","tuesday","wednesday","thursday","friday"]));
  const qBefore=dayFp(Q,["monday","tuesday","wednesday","thursday","friday"]);
  Q.A.fn("calApproveEvent")("w1"); await Q.flush(20000);
  ok("OK'd: kid_a's Wednesday is planned around it",onDay(Q,"wednesday","kid_a").filter(t=>inBlk(t,600,660)).length===0&&onDay(P,"wednesday","kid_a").filter(t=>inWin(t,600,660)).length>0);
  { const rl3=Q.relayLog(), k3=Object.keys(rl3).sort(), e3=rl3[k3[k3.length-1]]||{};
    ok("its Undo puts the event back to waiting",stable(e3.undo)===stable([{p:"calendar/events/w1/pending",was:true}]),e3.undo);
    Q.A.fn("relayUndo")(k3[k3.length-1]); await Q.flush(20000);
    ok("Undo: cards back, the event waits again",dayFp(Q,["monday","tuesday","wednesday","thursday","friday"])===qBefore&&Q.ev("w1").pending===true&&Q.ev("w1").hold===true); }

  console.log("not Mom's lens: the form has no switch, and a save keeps what the event had");
  { const Z=await world({name:"notmom",events:{h1:held({date:"2026-11-18",time:"10:00 AM",mins:60})}});
    Z.A.fn("haMomOff")();
    ok("no end field, no switch",Z.A.run('calEditId="h1"; calRenderEventForm()').indexOf("cal-ev-hold")<0);
    Z.form({id:"h1",title:"Renamed",date:"2026-11-18",time:"10:00 AM",end:"",hold:false,emoji:"🏛"});
    ok("the length and hold stay on the record",Z.ev("h1").mins===60&&Z.ev("h1").hold===true&&Z.ev("h1").title==="Renamed",Z.ev("h1")); }

  // ── 5. today ──
  console.log("today: the live lay steps around a block; a kid inside one is not offered to Mom");
  const T=await world({name:"today"});
  await T.roll(TUE); await T.at(TUE,9,2);
  const layOf=W=>JSON.parse(W.A.run('JSON.stringify(dsDoneAtTime(mlQueueLay(dsRetime(weekData.tasks))).filter(function(t){ return effectiveDay(t)==="tuesday"&&!String(t.id).endsWith("_c")&&!t._dayDrop&&!t._eowOverflow; }).map(function(t){ return {id:t.id,who:t.who,time:t.time,dur:t.dur||20,fam:!!t.famBlock}; }))'));
  const lay0=layOf(T);
  ok("before: kid_a has cards between 9:30 and 10:30 today",lay0.filter(t=>t.who==="kid_a"&&inWin(t,570,630)).length>0,lay0.filter(t=>t.who==="kid_a").map(t=>t.time));
  // the planner's way in: the record is written directly (no form, no door)
  n0=T.db.log.length;
  T.db.api("dev_t").ref("calendar/events/p1").set(held({date:TUE,time:"9:30 AM",mins:60,who:"kid_a",title:"Eye check"})); await T.flush(1500);
  const lay1=layOf(T);
  ok("with a block 9:30–10:30 for kid_a: none of his open cards is laid inside it",lay1.filter(t=>t.who==="kid_a"&&inWin(t,570,630)).length===0,lay1.filter(t=>t.who==="kid_a").map(t=>t.time));
  ok("…all of his cards are still on the day",lay1.filter(t=>t.who==="kid_a").length===lay0.filter(t=>t.who==="kid_a").length);
  ok("…and the other kids' lay is not held",lay1.filter(t=>t.who!=="kid_a"&&inWin(t,570,630)).length>0);
  ok("drawing the lay wrote nothing",T.db.log.slice(n0).filter(l=>!/calendar\/events\/p1/.test(l.path)).length===0,T.db.log.slice(n0).map(l=>l.op+" "+l.path));
  ok("9:02 AM, before the block: kid_a is not 'out'",T.A.run('_mlOnTimedCoop("kid_a")')===false);
  await T.at(TUE,9,45);
  ok("9:45 AM, inside it: kid_a is not offered to Mom; the others are unaffected",T.A.run('_mlOnTimedCoop("kid_a")')===true&&T.A.run('_mlCanTakeMom("kid_a")')===false&&T.A.run('_mlOnTimedCoop("kid_c")')===false);
  await T.at(TUE,10,31);
  ok("10:31 AM, after it: back in the loop",T.A.run('_mlOnTimedCoop("kid_a")')===false);

  console.log("the door on a running day: Hold turned on at 9:02 AM for 10:00–10:45 today");
  { const N=await world({name:"now"}); await N.roll(TUE); await N.at(TUE,9,2);
    const started=N.board().filter(t=>live(t)&&t.day==="tuesday"&&toMin(t.time)<=9*60+2).map(t=>[t.id,t.time]);
    const firstId=started.length?started[0][0]:null; if(firstId){ N.A.fn("finalizeDone")(firstId,N.A.fn("nowTs")()); await N.flush(4000); }
    const tueBefore=onDay(N,"tuesday");
    ok("before: open cards sit between 10:00 and 10:45 today",tueBefore.filter(t=>inBlk(t,600,645)).length>=2,tueBefore.filter(t=>inBlk(t,600,645)).length);
    N.form({title:"Dentist",date:TUE,time:"10:00 AM",end:"10:45 AM",hold:true}); await N.flush(20000);
    const tueAfter=onDay(N,"tuesday"), ckN=N.checked();
    ok("after: no open card is inside the block",tueAfter.filter(t=>!ckN[t.id]&&inBlk(t,600,645)).length===0,tueAfter.filter(t=>!ckN[t.id]&&inBlk(t,600,645)).map(t=>t.who+" "+t.time));
    ok("cards already started or checked did not move",started.every(p=>{ const x=N.board().find(t=>t.id===p[0]); return x&&(ckN[p[0]]||x.time===p[1]); }));
    ok("every card of the day is still on the board",tueBefore.every(t=>N.board().some(x=>x.id===t.id)));
    { const monBefore=dayFp(N,["monday"]), ln=Object.keys(N.relayLog()).length;
      N.form({title:"Yesterday's thing",date:MON,time:"10:00 AM",end:"11:00 AM",hold:true}); await N.flush(20000);
      ok("Hold turned on for a day of this week that is already over: nothing moves, no log line",dayFp(N,["monday"])===monBefore&&Object.keys(N.relayLog()).length===ln); }
    ok("the other days did not change",dayFp(N,["wednesday","thursday","friday"])===dayFp(P,["wednesday","thursday","friday"])||(function(){ const rl=N.relayLog(), k=Object.keys(rl).sort(), e=rl[k[k.length-1]]||{}; return (e.moves||[]).some(m=>m.to.d!=="tuesday"); })()); }

  console.log("a planner-style move (date and time written directly) carries the block along");
  T.db.api("dev_t").ref().update({"calendar/events/p1/date":THU,"calendar/events/p1/time":"11:00 AM"}); await T.flush(1500);
  ok("the block is now Thursday 11:00–12:00, the same length",T.A.run('JSON.stringify([evHoldFor("kid_a","'+TUE+'"),evHoldFor("kid_a","'+THU+'")])')==="[[],[[660,720]]]");
  ok("no re-plan was queued by it (the planner does not use the door yet)",T.A.run("!!_rlwPend")===false);
  { const r=JSON.parse(T.A.run('(function(){ const copy=JSON.parse(JSON.stringify(weekData.tasks)); const se=seGuardWeek(copy,seGuardCtx()); return JSON.stringify({n:Object.keys(se.upd).length,thu:copy.filter(function(t){ return t.day==="thursday"&&t.who==="kid_a"&&!String(t.id).endsWith("_c")&&!t._dayDrop&&!t._eowOverflow; }).map(function(t){ return {time:t.time,dur:t.dur||20}; })}); })()'));
    ok("the next sweep's guard plans Thursday around it",r.thu.length>0&&r.thu.filter(t=>inWin(t,660,720)).length===0,r); }
  T.db.api("dev_t").ref("calendar/events/p1/time").set("lunchtime"); await T.flush(1500);
  ok("moved to a time the app can't read: it simply stops holding",T.A.run('JSON.stringify(evHoldFor("kid_a","'+THU+'"))')==="[]");

  console.log("a re-pack that names its date steps over the block (the sweep's packer); the balancer's room shrinks by it");
  { const B2=await world({name:"pack",events:{h1:held({date:WED,time:"10:00 AM",mins:60,who:"kid_a",title:"Eye check"})}});
    const pk=fx=>JSON.parse(B2.A.run('(function(){ const mk=(id,who)=>({id:id,who:who,day:"wednesday",time:"9:00 AM",dur:40,device:"paper",mom:"none",title:id,detail:""}); const list=[mk("a1","kid_a"),mk("a2","kid_a"),mk("a3","kid_a"),mk("b1","kid_b"),mk("b2","kid_b"),mk("b3","kid_b")]; const ctx={start:540,end:930,lunchStart:720,lunchEnd:765'+(fx?',fxDate:"'+WED+'",fxDay:"wednesday"':'')+'}; const keep=JSON.stringify(ctx); const over=packAround([],list,ctx); return JSON.stringify({t:list.map(function(t){ return [t.id,t.time]; }),over:over.length,same:JSON.stringify(ctx)===keep}); })()'));
    const withDate=pk(true), noDate=pk(false);
    ok("the held kid: 9:00, then AFTER the block (11:00), then on — the other kid packs straight through",stable(withDate.t)===stable([["a1","9:00 AM"],["a2","11:00 AM"],["a3","12:45 PM"],["b1","9:00 AM"],["b2","9:40 AM"],["b3","10:20 AM"]]),withDate.t);
    ok("nothing overflowed and the caller's ctx was not changed (copy-on-write)",withDate.over===0&&withDate.same===true);
    ok("a pack that does not name its date is exactly as before (no block read)",stable(noDate.t)===stable([["a1","9:00 AM"],["a2","9:40 AM"],["a3","10:20 AM"],["b1","9:00 AM"],["b2","9:40 AM"],["b3","10:20 AM"]]),noDate.t);
    ok("no held block on the date → the very same ctx object comes back",B2.A.run('(function(){ const c={busy:{}}; return evHoldCtx(c,"'+TUE+'")===c&&evHoldCtx(c,"'+WED+'")!==c; })()')===true);
    const loss=(kid,iso)=>B2.A.run('evHoldLoss("'+kid+'","'+iso+'",540,930,720,765)');
    ok("room lost to a 10:00–11:00 block: 60 minutes, for the held kid only, on that date only",loss("kid_a",WED)===60&&loss("kid_b",WED)===0&&loss("kid_a",TUE)===0);
    B2.db.api("dev_t").ref("calendar/events/h2").set(held({date:THU,time:"11:30 AM",mins:90})); B2.db.api("dev_t").ref("calendar/events/h3").set(held({date:FRI,time:"8:00 AM",mins:90})); B2.db.api("dev_t").ref("calendar/events/h4").set(held({date:MON,time:"3:00 PM",mins:120})); await B2.flush(1500);
    ok("a block across lunch (11:30–1:00) costs 45, not 90: lunch was never school time",loss("kid_a",THU)===45);
    ok("a block that starts before school (8:00–9:30) costs only the 30 minutes inside the day; one that runs past the end only what is inside",loss("kid_a",FRI)===30&&loss("kid_a",MON)===30);
    ok("the balancer takes that off the day's room",/let room=capacity-dayTotals\[dk\];\n\s*if\(typeof evHoldLoss==="function"\) room-=evHoldLoss\(kid,dk,_st,DAY_END_D,_rr\.lunchStart,_rr\.lunchEnd\);/.test(SRC)); }

  // ── 6. the risks ──
  console.log("two blocks in one day");
  const TW=await world({name:"two",events:{a:held({date:WED,time:"9:30 AM",mins:30}),b:held({date:WED,time:"10:00 AM",mins:45,title:"Back to back"}),c:held({date:WED,time:"1:00 PM",mins:30,who:"kid_c",title:"Later one"})}});
  ok("nothing inside either morning block (9:30–10:45), for anyone",onDay(TW,"wednesday").filter(t=>inBlk(t,570,645)).length===0);
  ok("kid_c: nothing inside 1:00–1:30 either; every subject still on the day",onDay(TW,"wednesday","kid_c").filter(t=>inWin(t,780,810)).length===0&&subjSet(TW,"wednesday","kid_c")===subjSet(P,"wednesday","kid_c"));
  ok("the day ends by 3:30 PM",onDay(TW,"wednesday").every(t=>toMin(t.time)+(+t.dur||20)<=930));

  console.log("a block on a co-op day (kid_b: co-op 9:00–1:00, then a block 1:00–2:00)");
  const CO=await world({name:"coop+hold",events:{a:held({date:THU,time:"1:00 PM",mins:60,who:"kid_b",title:"Recital"})}});
  const P_thu=onDay(P,"thursday","kid_b"), CO_thu=onDay(CO,"thursday","kid_b");
  ok("without the block kid_b's Thursday starts at 1:00 PM (co-op)",P_thu.length>0&&Math.min.apply(null,P_thu.map(t=>toMin(t.time)))>=780&&P_thu.some(t=>inWin(t,780,840)));
  ok("with it: nothing before 2:00 PM, nothing inside the block",CO_thu.every(t=>toMin(t.time)>=840),CO_thu.map(t=>t.time));
  ok("the other kids' Thursday is as it was",stable(onDay(CO,"thursday").filter(t=>t.who!=="kid_b").map(t=>[t.who,t.subjectKey,t.time]).sort())===stable(onDay(P,"thursday").filter(t=>t.who!=="kid_b").map(t=>[t.who,t.subjectKey,t.time]).sort()));

  console.log("a block over the whole school day");
  const ALL=await world({name:"whole",events:{a:held({date:WED,time:"9:00 AM",mins:390,title:"All-day outing"})}});
  ok("no card of anyone sits inside it",onDay(ALL,"wednesday").filter(t=>inBlk(t,540,930)).length===0,onDay(ALL,"wednesday").map(t=>t.who+" "+t.time));
  ok("nothing is laid after 3:30 PM either",onDay(ALL,"wednesday").every(t=>toMin(t.time)+(+t.dur||20)<=930));
  ok("the other days are as they were",["monday","tuesday"].every(d=>shapeFp(ALL,d)===shapeFp(P,d)));
  console.log("      (what it did with Wednesday's work: "+(function(){ const w=ALL.board().filter(t=>live(t)&&t.day==="wednesday"); const p=P.board().filter(t=>live(t)&&t.day==="wednesday"); return p.length+" cards without the block → "+w.length+" on Wednesday with it"; })()+")");

  console.log("a weekend, and a kid who is off");
  const WE=await world({name:"weekend",events:{a:held({date:SAT,time:"10:00 AM",mins:120}),b:held({date:"2026-11-15",time:"10:00 AM",mins:120,title:"Sunday thing"})}});
  ok("a held Saturday / Sunday event changes nothing in the week",boardFp(WE)===boardFp(P));

  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.error(e&&e.stack||e); console.log("\n"+pass+" passed, "+(fail+1)+" failed"); process.exit(1); });
function db_events(W){ return W.db.get("calendar/events")||{}; }
