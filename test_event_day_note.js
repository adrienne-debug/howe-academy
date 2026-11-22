/*
 * 🎉 EVDAY — a calendar event shows IN the day (her ask 2026-11-22: "a note on the calendar for that day and if it's a certain
 * time a time block as well"). Step A of PLAN_event_time_hold_2026-11-22.md: DISPLAY ONLY.
 *
 * What is proved here:
 *   1. evMin reads a clock time safely ("2:30 PM", "2pm") and refuses everything else (no AM/PM, 24-hour, words, "").
 *   2. NOTHING about the schedule changes: the WHOLE app is booted twice in the vm sandbox of test_demo_week.js on the synthetic
 *      demo family — once with no events, once with a calendar full of them (timed, untimed, one kid's, a waiting one, a
 *      surprise, an evening show on every day, one on a co-op day). The built week, every card's day and time, the live lay
 *      of a running day, the counts and every database write are identical.
 *   3. Each screen draws the event: the kid's list, the All and Mom agendas, Kids' Corner, Dad's schedule, Mom's ▸ Week (this
 *      week and another week). who is respected, a waiting event never shows, a surprise shows its stored title only.
 *   4. A row is not a card: nothing to tap, no card markup, in no task list and no count.
 * No kid or family names: the fixture is synthetic.   run: node test_event_day_note.js     (EV_VERBOSE=1 echoes the app's console)
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const SRC=fs.readFileSync(INDEX,"utf8");

let pass=0, fail=0;
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,700)+")":"")); } }
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };

// ── the calendar: week 1 of the fixture is Mon 2026-11-09 … ; the co-op (kid_b, 9–1) is Thu 11/12 ──
const TUE="2026-11-10";
const EVENTS={
  ev_fam:   {title:"Museum trip",date:TUE,time:"2:30 PM",who:"family",emoji:"🏛"},
  ev_kid:   {title:"Eye check",date:TUE,time:"11am",who:"kid_a",emoji:"👓"},
  ev_none:  {title:"Pyjama day",date:TUE,time:"",who:"family",emoji:"🎈"},
  ev_wait:  {title:"Sleepover",date:TUE,time:"1:00 PM",who:"kid_a",emoji:"🛏",addedBy:"kid_a",pending:true},
  ev_odd:   {title:"Odd clock",date:TUE,time:"14:30",who:"family",emoji:"⏱"},
  ev_early: {title:"Sunrise walk",date:TUE,time:"7:00 AM",who:"family",emoji:"🌅"},
  ev_pre:   {title:"Picnic set-up",date:TUE,time:"11:50 AM",who:"family",emoji:"🧺"},
  ev_secret:{title:"A surprise",date:"2026-11-11",time:"10:00 AM",who:"family",emoji:"✨"},
  ev_coop:  {title:"Recital",date:"2026-11-12",time:"2:00 PM",who:"kid_b",emoji:"🎻"},
  ev_next:  {title:"Field day",date:"2026-11-17",time:"9:30 AM",who:"family",emoji:"⚽"}
};
["2026-11-09",TUE,"2026-11-11","2026-11-12","2026-11-13","2026-11-16","2026-11-17"].forEach((d,i)=>{ EVENTS["ev_show"+i]={title:"Evening show",date:d,time:"6:15 PM",who:"family",emoji:"🚂"}; });

async function world(withEvents){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const d=JSON.parse(JSON.stringify(FX.db)); if(withEvents) d.calendar.events=JSON.parse(JSON.stringify(EVENTS));
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  // the same pseudo-random run in both worlds, so ids made with Math.random are the same and the two can be compared
  let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const A=S.bootDevice({name:withEvents?"with events":"no events",dev:"dev_a",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.EV_VERBOSE,globals:{Math:M}});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);          // Sunday: week 1 builds itself
  const W={A,db,clock,flush,
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id),
    checked:()=>db.get(W.wk()+"/checked")||{}};
  W.play=async(iso,dn,untilMin)=>{                     // check off that day's cards that end by untilMin, in time order
    const ck=W.checked();
    const cards=W.board().filter(t=>t.day===dn&&!ck[t.id]&&!String(t.id).endsWith("_c")&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null)
      .sort((a,b)=>toMin(a.time)-toMin(b.time)||String(a.id).localeCompare(b.id));
    for(const t of cards){ const end=toMin(t.time)+(+t.dur||20); if(end>untilMin) continue;
      const at=hm(iso,Math.floor(end/60),end%60); if(at>clock.now) clock.now=at;
      if(!A.tasks().some(x=>x.id===t.id)) continue;
      A.fn("finalizeDone")(t.id,A.fn("nowTs")()); await flush(4000); }
  };
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; A.fn("dayRollCheck")(); await flush(90000); };
  return W;
}
const stable=o=>JSON.stringify(o,(k,v)=>(v&&typeof v==="object"&&!Array.isArray(v))?Object.keys(v).sort().reduce((a,x)=>{ a[x]=v[x]; return a; },{}):v);
const boardFp=W=>stable(W.board().slice().sort((a,b)=>String(a.id).localeCompare(String(b.id))));
const layFp=W=>W.A.run('JSON.stringify(dsDoneAtTime(mlQueueLay(dsRetime(weekData.tasks))).map(function(t){ return [t.id,t.day,t.time,t.dur||0,!!t._dayDrop,!!t._eowOverflow]; }).sort())');
const logFp=W=>stable(W.db.log.map(l=>[l.op,l.path,(l.keys||[]).slice().sort(),l.n]));
const countsFp=W=>W.A.run('JSON.stringify(ROSTER.map(function(k){ return [k,_boardTaskCounts(k,"tuesday"),mlRemaining(k).length,mlBehind(k)]; }).concat([getActiveTasks().length]))');

(async function(){
  // ── 1. the time reader ──
  console.log("evMin — a clock time or nothing");
  { const a=SRC.indexOf("// EVDAY_START"), b=SRC.indexOf("// EVDAY_END");
    ok("the EVDAY block is marked", a>0&&b>a);
    const evMin=new Function(SRC.slice(SRC.indexOf("function evMin(",a),SRC.indexOf("\n",SRC.indexOf("function evMin(",a)))+"; return evMin;")();
    const yes={"2:30 PM":870,"2:30pm":870,"2 PM":840,"2pm":840," 9:05 am ":545,"12:00 AM":0,"12 PM":720,"12:05 am":5,"2:30 p.m.":870,"11am":660};
    Object.keys(yes).forEach(k=>ok('"'+k+'" → '+yes[k],evMin(k)===yes[k],evMin(k)));
    ["","2:30","14:30","0:30 AM","13 PM","2:75 PM","afternoon","2ish","2:30 PM-ish","after lunch 2 PM","2:30 PM bring snacks",null,undefined].forEach(k=>ok(JSON.stringify(k)+" → not a clock time",evMin(k)===null,evMin(k)));
    ok("the block writes nothing (no db, no storage, no listener, no timer)",!/\bdb\b|HA_LS|localStorage|setInterval|setTimeout|\.on\(/.test(SRC.slice(a,b).replace(/\/\/[^\n]*/g,"")));
  }

  // ── 2. nothing about the schedule changes ──
  console.log("the built week is identical with and without events");
  const X=await world(false), Y=await world(true);
  ok("both worlds built week 1",X.board().length>20&&Y.board().length===X.board().length,[X.board().length,Y.board().length]);
  ok("the events are on the calendar in the second world",Object.keys(Y.A.fn("calEvents")()).length===Object.keys(EVENTS).length&&Object.keys(X.A.fn("calEvents")()).length===0);
  ok("every card: same id, day, time, length, title, every field",boardFp(X)===boardFp(Y));
  for(const W of [X,Y]){ await W.play("2026-11-09","monday",24*60); await W.roll(TUE); await W.play(TUE,"tuesday",10*60+30); W.clock.now=hm(TUE,10,40); await W.flush(2000); }
  ok("after Monday is played and Tuesday is running (10:40 AM): the board is still identical",boardFp(X)===boardFp(Y));
  ok("the live lay of the running day (what the screens draw) is identical",layFp(X)===layFp(Y),[layFp(X).length,layFp(Y).length]);
  ok("cards left, the Mom-loop queue and the behind marker are identical",countsFp(X)===countsFp(Y),[countsFp(X),countsFp(Y)]);
  ok("every database write is identical (op, path, keys)",logFp(X)===logFp(Y),[X.db.log.length,Y.db.log.length]);
  ok("no write ever touched calendar/events",!Y.db.log.some(l=>/calendar/.test(l.path)&&/events/.test(l.path+" "+(l.keys||[]).join(" "))));

  // ── 3. the screens (second world, Tuesday 10:40 AM) ──
  const A=Y.A, R=e=>A.run(e), writesBefore=[X.db.log.length,Y.db.log.length];
  R('__HARNESS_NO_RENDER=true; day="tuesday";');
  const layT=who=>'(function(){ var a=dsDoneAtTime(mlQueueLay(dsRetime(weekData.tasks))).filter(function(t){ return effectiveDay(t)==="tuesday"&&!String(t.id).endsWith("_c")'+(who?'&&t.who==="'+who+'"':'')+'; }); return a; })()';
  const rowsOf=h=>h.split(/<div class="(?:time-row|all-agenda-row|mom-agenda-row)/).slice(1);
  const idx=(h,s)=>h.indexOf(s);

  console.log("All tab");
  const all=R('kid="all"; allAgendaHtml('+layT()+')');
  ok("the family's timed event is a full-width row",/<div class="all-agenda-row"><div class="time-pill">2:30<span class="ampm">PM<\/span><\/div><div class="ev-blk" style="grid-column:2\/-1">🏛 Museum trip · 2:30 PM<\/div><\/div>/.test(all),all.slice(idx(all,"Museum")-200,idx(all,"Museum")+80));
  ok("one kid's event names the kid",all.indexOf("👓 Eye check · 11am · Kid A</div>")>0);
  ok("rows are in time order: 7:00 AM first, then 11:00, 11:50, 2:30, the evening show last",
    idx(all,"Sunrise walk")>0&&idx(all,"Sunrise walk")<idx(all,"Eye check")&&idx(all,"Eye check")<idx(all,"Picnic set-up")&&idx(all,"Picnic set-up")<idx(all,"Museum trip")&&idx(all,"Museum trip")<idx(all,"Evening show"),
    ["Sunrise walk","Eye check","Picnic set-up","Museum trip","Evening show"].map(s=>idx(all,s)));
  // the fixture's Tuesday has no card after lunch, so the lunch row is not drawn (as before). With an afternoon card it is — and
  // an event before lunch stays above it, one after stays below (the render is handed one extra card; nothing is stored)
  const withPm='(function(a){ var c=JSON.parse(JSON.stringify(a.filter(function(t){ return t.who==="kid_a"&&t.subjectKey==="math"; })[0])); c.id="zz_pm"; c.time="1:00 PM"; c.title="An afternoon card"; c.mom="required"; return a.concat([c]); })('+layT()+')';
  const allPm=R('allAgendaHtml('+withPm+')'), momPm=R('kid="mom"; momAgendaHtml('+withPm+')'); R('kid="all";');
  [["All tab",allPm],["Mom's lane",momPm]].forEach(p=>ok(p[0]+": 11:50 event, then the lunch row, then the 1:00 card, then the 2:30 event",
    idx(p[1],"Picnic set-up")>0&&idx(p[1],"Picnic set-up")<idx(p[1],"Lunch")&&idx(p[1],"Lunch")<idx(p[1],"An afternoon card")&&idx(p[1],"An afternoon card")<idx(p[1],"Museum trip"),
    ["Picnic set-up","Lunch","An afternoon card","Museum trip"].map(s=>idx(p[1],s))));
  ok("an event row sits before the first card row at or after its time",(function(){ const rs=rowsOf(all); let last=-1, good=true; rs.forEach(r=>{ const m=/<div class="time-pill">(\d+:\d+)<span class="ampm">(AM|PM)/.exec(r); if(!m) return; const t=toMin(m[1]+" "+m[2]); if(t<last) good=false; last=t; }); return good&&rs.length>5; })());
  ok("no time → no row; a time the app can't read → no row",all.indexOf("Pyjama day")<0&&all.indexOf("Odd clock")<0);
  ok("a waiting event never shows",all.indexOf("Sleepover")<0);
  ok("another day's event is not on this day",all.indexOf("A surprise")<0&&all.indexOf("Recital")<0&&all.indexOf("Field day")<0);
  const allNo=X.A.run('__HARNESS_NO_RENDER=true; day="tuesday"; kid="all"; allAgendaHtml('+layT()+')');
  ok("without events the All tab draws no event row",allNo.indexOf("ev-blk")<0);
  ok("take the event rows away and the All tab is the page it was",all.replace(/<div class="all-agenda-row"><div class="time-pill">[^<]*<span class="ampm">[^<]*<\/span><\/div><div class="ev-blk"[^>]*>[^<]*<\/div><\/div>/g,"")===allNo);

  console.log("Mom's lane");
  const mom=R('kid="mom"; momAgendaHtml('+layT()+')');
  ok("the timed events are rows across both columns",/<div class="mom-agenda-row"><div class="time-pill">2:30<span class="ampm">PM<\/span><\/div><div class="ev-blk" style="grid-column:2\/4">🏛 Museum trip · 2:30 PM<\/div><\/div>/.test(mom)&&mom.indexOf("👓 Eye check · 11am · Kid A")>0);
  ok("never a waiting one",mom.indexOf("Sleepover")<0);
  const momNo=X.A.run('kid="mom"; momAgendaHtml('+layT()+')');
  ok("take the event rows away and Mom's lane is the page it was",mom.replace(/<div class="mom-agenda-row"><div class="time-pill">[^<]*<span class="ampm">[^<]*<\/span><\/div><div class="ev-blk"[^>]*>[^<]*<\/div><\/div>/g,"")===momNo);

  console.log("one kid's Schedule day");
  const sched=k=>{ R('tab="schedule"; momSchedView=false; kid="'+k+'"; day="tuesday"; globalThis.__el={innerHTML:""}; renderSchedule(globalThis.__el);'); return R("globalThis.__el.innerHTML"); };
  const sa=sched("kid_a"), sb=sched("kid_b");
  ok("the page drew",sa.length>500&&sb.length>500,[sa.length,sb.length]);
  ok("kid A's list: his own event and the family's, each a marked row at its time",
    sa.indexOf('<div class="time-row"><div class="time-pill">11:00 AM</div><div class="slot-tasks"><div class="ev-blk">👓 Eye check · 11am</div></div></div>')>0&&
    sa.indexOf('<div class="time-row"><div class="time-pill">2:30 PM</div><div class="slot-tasks"><div class="ev-blk">🏛 Museum trip · 2:30 PM</div></div></div>')>0);
  ok("kid B's list: the family's event, never his sibling's",sb.indexOf("Museum trip")>0&&sb.indexOf("Eye check")<0);
  ok("neither list shows the waiting one",sa.indexOf("Sleepover")<0&&sb.indexOf("Sleepover")<0);
  ok("the event after the last card still shows (the evening show)",sa.indexOf("🚂 Evening show · 6:15 PM")>0);
  ok("Mom's lens (Mom mode on): the chip row tops the list, since the routines panel that carries it is hidden",/<div class="ev-banner">/.test(sa)&&sa.indexOf("Pyjama day")>0);
  R('kid="all"; globalThis.__el={innerHTML:""}; renderSchedule(globalThis.__el);'); const sAll=R("globalThis.__el.innerHTML");
  ok("the All tab's page: chip row at the top (with the untimed one) and the rows in the grid",/<div class="ev-banner">/.test(sAll)&&sAll.indexOf("Pyjama day")>0&&sAll.indexOf('class="ev-blk" style="grid-column:2/-1"')>0);
  R('haMomOff();'); const sKid=sched("kid_a"); R('haMomOn();');
  ok("the kid's own lens (Mom mode off): the rows are in the list, and no second chip row (the routines panel above already has it)",sKid.indexOf("👓 Eye check · 11am")>0&&sKid.indexOf("🏛 Museum trip · 2:30 PM")>0&&sKid.indexOf("ev-banner")<0);
  const sWed=(function(){ R('kid="kid_a"; day="wednesday"; globalThis.__el={innerHTML:""}; renderSchedule(globalThis.__el);'); return R("globalThis.__el.innerHTML"); })();
  ok("a surprise shows its stored title only",sWed.indexOf('<div class="ev-blk">✨ A surprise · 10:00 AM</div>')>0);
  const sThu=(function(){ R('kid="kid_b"; day="thursday"; globalThis.__el={innerHTML:""}; renderSchedule(globalThis.__el);'); return R("globalThis.__el.innerHTML"); })();
  ok("a co-op day still shows the kid's event",sThu.indexOf("🎻 Recital · 2:00 PM")>0);
  R('day="tuesday";');

  console.log("Kids' Corner ▸ Today");
  const kc=R('kcSchoolHTML("kid_a")'), kcB=R('kcSchoolHTML("kid_b")');
  ok("the kid's own and the family's timed events are rows in today's list",kc.indexOf('<div class="ev-blk">👓 Eye check · 11am</div>')>0&&kc.indexOf("🏛 Museum trip · 2:30 PM")>0,kc.slice(0,300));
  ok("a sibling's event is not there, a waiting one is not there",kcB.indexOf("Eye check")<0&&kc.indexOf("Sleepover")<0&&kcB.indexOf("Museum trip")>0);
  ok("without events Kids' Corner draws no event row",X.A.run('__HARNESS_NO_RENDER=true; kcSchoolHTML("kid_a")').indexOf("ev-blk")<0);

  console.log("Dad's schedule today");
  const dad=R('dadSchedHTML("tuesday")');
  ok("timed events sit under their time, with the kid's name",/>11:00 AM<\/div><div style="margin:0 0 5px"><div class="ev-blk">👓 Eye check · 11am · Kid A<\/div>/.test(dad)&&/>2:30 PM<\/div><div style="margin:0 0 5px"><div class="ev-blk">🏛 Museum trip · 2:30 PM<\/div>/.test(dad),dad.slice(0,900));
  ok("no time (or an unreadable one) → under ANY TIME",idx(dad,"ANY TIME")>0&&idx(dad,"Pyjama day")>idx(dad,"ANY TIME")&&idx(dad,"Odd clock")>idx(dad,"ANY TIME"));
  ok("never a waiting one",dad.indexOf("Sleepover")<0);
  ok("his own list is untouched: the items the app builds for him carry no event",R('JSON.stringify(dadSchedItems("tuesday"))').indexOf("ev-blk")<0);

  console.log("Mom's ▸ Schedule ▸ Week");
  const wkAll=R('mpSchWkOff=0; mpSchWkDay=null; mpSchWeekHTML("all")'), wkB=R('mpSchWeekHTML("kid_b")');
  ok("this week: each day lists its events",["Museum trip","Pyjama day","A surprise","Recital","Evening show"].every(s=>wkAll.indexOf(s)>0));
  ok("…with the kid's name on a kid's own",wkAll.indexOf('<div class="ev-blk ev-sm">👓 Eye check · 11am · Kid A</div>')>0);
  ok("one kid's week: not a sibling's event",wkB.indexOf("Eye check")<0&&wkB.indexOf("Recital")>0);
  ok("never a waiting one, never next week's",wkAll.indexOf("Sleepover")<0&&wkAll.indexOf("Field day")<0);
  ok("the day's events come before its cards",(function(){ const c=wkAll.split('<div onclick="mpSchDaySet(\'tuesday\')" style="cursor:pointer;display:flex')[1]||""; return c.indexOf("ev-sm")>0&&c.indexOf("ev-sm")<c.indexOf("border-left:4px"); })());
  // another week: the app reads that week's own copy; here it is handed one card so the grid draws
  R('mpSchWkOff=1; mpSchWkDay=null; (function(){ var wn=mpSchWkNum(); var c=mpSchWkLoad(wn); c.loading=false; c.failed=false; c.tasks=[{id:"zz1",who:"kid_a",day:"tuesday",time:"9:00 AM",title:"A card"}]; c.dates={}; })();');
  const other=R('mpSchWeekHTML("all")');
  ok("another week (›): that week's events, from that week's own dates",other.indexOf("⚽ Field day · 9:30 AM")>0&&other.indexOf("Museum trip")<0,other.slice(0,400));
  R('mpSchWkDay="tuesday";'); const otherDay=R('mpSchWeekHTML("all")');
  ok("…and on its one-day view",otherDay.indexOf("⚽ Field day · 9:30 AM")>0);
  R('mpSchWkOff=0; mpSchWkDay=null;');

  // ── 4. a row is not a card ──
  console.log("a row is not a card");
  const blocks=(all+mom+sa+kc+dad+wkAll+other).match(/<div class="ev-blk[^>]*>[^<]*<\/div>/g)||[];
  ok("every event block is plain text: no tap, no checkbox, no id, no card markup",blocks.length>10&&blocks.every(b=>!/onclick|onpointer|<input|<button|data-|task-card|id=/.test(b)),blocks.length);
  ok("the rows that carry them have no handler either",(all+mom+sa+kc).split("ev-blk").slice(0,-1).every(p=>{ const r=p.slice(p.lastIndexOf("<div class=\"")<0?0:Math.max(p.lastIndexOf('<div class="time-row"'),p.lastIndexOf('-agenda-row"'))); return !/onclick/.test(r); }));
  ok("no event is in the week's cards (same count of cards as the world without events)",Y.board().length===X.board().length&&!Y.board().some(t=>/Museum|Eye check|Evening show/.test(t.title||"")));
  ok("drawing the screens wrote nothing",X.db.log.length===writesBefore[0]&&Y.db.log.length===writesBefore[1],Y.db.log.slice(writesBefore[1]).map(l=>l.op+" "+l.path).slice(0,6));
  ok("after drawing: counts, the queue and the behind marker still identical",countsFp(X)===countsFp(Y));

  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.error(e&&e.stack||e); console.log("\n"+pass+" passed, "+(fail+1)+" failed"); process.exit(1); });
