/*
 * 📅 Move to today (Mom-only, 2026-10-08) — MOVETODAY block.
 *   · an open lesson card from a LATER day this week comes to today, right after the card the kid is on now
 *   · recorded in momMoves as a push to today (pulledFrom/fromTime, fromDays EMPTY so no day counts it unfinished)
 *   · the real school-end re-lay (seGuardWeek) slides today's later cards so nothing overlaps, and holds the moved card
 *     (it never rolls back to its old day while today lasts)
 *   · lesson order: refused while an earlier lesson of the subject is still open on a later day; lands after an
 *     earlier one already on today
 *   · Mom-only; targeted writes only (momMoves/<id> + multi-path tasks update); dry-run writes nothing; ↩ undo puts it back
 *   · (b) her pick 2026-10-08: once today's Settings school end has passed (Howe 4:15 / DeWalt 4:00), the button is
 *     "✓ Mark done today" — the normal check-off path (dialog ✓ → finalizeDone), nothing moved; refused while an earlier
 *     lesson of the subject is still open anywhere this week
 *   · never before today's school start
 *   run:  node test_move_to_today.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
function slice(n){ const i=src.indexOf("function "+n+"("); if(i<0) throw new Error("no fn "+n); return src.slice(i,src.indexOf("\n}",i)+2); }

const seq=[], ids=[]; for(let i=1;i<=20;i++){ seq.push("Lesson "+i); ids.push("L"+String(i).padStart(4,"0")); }
const MOVETODAY="📅 MOVETODAY";
const lesson=(n,day,time,x)=>Object.assign({id:"ellis_mr_L"+String(n).padStart(4,"0"),who:"ellis",subjectKey:"mr",day,time,dur:30,mom:"none",
  title:"Math — Lesson "+n,lid:"L"+String(n).padStart(4,"0")},x||{});
const other=(id,day,time,dur,x)=>Object.assign({id,who:"ellis",subjectKey:id.split("_")[0],day,time,dur:dur||30,mom:"none",title:id},x||{});

// 🕰 Frozen clock: the code under test reads `new Date()` (seGuardCtx's "now", seGuardWeek's started cards), so the wall
// clock is pinned per world — o.wall in minutes, default 10:40 AM on Wed 2026-10-07. Found 2026-10-08: unfrozen, three
// checks failed whenever the test ran in the evening (8:36 PM on her Mac).
function frozenDate(wallMin){
  const R=Date, fixed=new R(2026,9,7,Math.floor(wallMin/60),wallMin%60,0,0).getTime();
  class FD extends R{ constructor(...a){ if(a.length) super(...a); else super(fixed); } static now(){ return fixed; } }
  return FD;
}
function world(o){
  o=o||{};
  const writes=[], toasts=[], okClicks=[];
  const Date=frozenDate(o.wall==null?(o.now==null?10*60+40:o.now):o.wall);
  const ctx={console,weekData:{tasks:o.tasks},checked:o.checked||{},claimed:{},momMoves:o.momMoves||{},_todayDay:"wednesday",
    WK:"week26",lastTasksWrite:0,DAY_DT:{},rulesData:{schoolDay:{defaultStart:"10:00 AM",defaultEnd:o.end||"4:15 PM"}},
    pendingId:null,pendingClaimMode:true,
    document:{getElementById:k=>k==="dlg-ok"?{onclick:function(){ okClicks.push([ctx.pendingId,ctx.pendingClaimMode]); }}:null},
    currData:{subjects:{ellis:{mr:{display:"Math",lessonSeq:seq,lessonIds:ids}}}},
    gwRules:()=>({lunchStart:13*60,lunchEnd:14*60}),
    _mlNowMin:()=>o.now==null?10*60+40:o.now,_mlLunchWin:()=>[13*60,14*60],
    effectiveDay:t=>(ctx.momMoves[t.id]&&ctx.momMoves[t.id].mode==="push")?ctx.momMoves[t.id].toDay:t.day,
    _dismissed:t=>{ const p=ctx.momMoves[t.id]; return !!(p&&(p.mode==="skip"||p.mode==="drop")); },
    momHere:()=>o.mom!==false, nowTs:()=>"10:40 AM Oct 8",
    taskLessonRef:t=>(t.title.split(" — ")[1]||""),cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),
    subjNoCarry:t=>t.subjectKey==="reflex",ldPinnedTask:()=>false,fxIsClass:()=>false,
    planBacked:()=>true,planPace:()=>({score:0}),_efLane:()=>null,_efLaneCap:()=>1,
    _pushDateStr:()=>"2026-10-07",schedOvKidOff:()=>false,smapIsKidOff:()=>!!o.kidOff,
    sv:()=>{},dbg:()=>{},gwShowToast:m=>toasts.push(m),closeDlg:()=>{},renderAll:()=>{},schedCascade:()=>{},
    _dryRun:()=>!!o.dry,db:{ref:p=>({update:u=>writes.push(["update",p,u]),set:v=>writes.push(["set",p,v]),remove:()=>writes.push(["remove",p])})},
    paceData:{subjects:{}},savePaceSubject:()=>{},
    Object,String,Array,Math,Date,RegExp,parseInt,isNaN,JSON,Set,Map};
  vm.createContext(ctx);
  vm.runInContext(["toMin","fromMin","_lessonPos","_mlDayEndMin","seGuardWeek","seGuardCtx","undoMomMove"].map(slice).join("\n")+"\n"+cut("// MOVETODAY_START","// MOVETODAY_END"),ctx);
  return {ctx,writes,toasts,okClicks,T:id=>ctx.weekData.tasks.find(t=>t.id===id)};
}
const overlaps=(tasks,day)=>{ const L=tasks.filter(t=>t.who==="ellis"&&t.day===day).map(t=>{ const a=w0.ctx.toMin(t.time); return [a,a+(t.dur||20),t.id]; }).sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<L.length;i++) if(L[i][0]<L[i-1][1]) return L[i-1][2]+" × "+L[i][2]; return null; };
const w0=world({tasks:[]});

// Ellis's Wednesday at 10:40: Morning Notebook (done), Spelling 10:30–11:00 in progress, Math L3 then Reading after it.
// Friday holds Math L4. Mom moves L4 to today.
function wed(x){ x=x||{}; return [
  other("morning_nb","wednesday","10:00 AM",30,{title:"Morning Notebook",subjectKey:"morning_nb"}),
  other("spell_1","wednesday","10:30 AM",30),
  lesson(3,"wednesday","11:00 AM"),
  other("read_1","wednesday","11:30 AM",30),
  other("closing_1","wednesday","3:30 PM",15,{title:"Closing Notebook",subjectKey:"closing_nb"}),
  lesson(4,"friday","10:30 AM"),
  lesson(5,"friday","11:00 AM"),
].concat(x.extra||[]); }

console.log("moves a later-day lesson to today, after the current card and after the earlier lesson, nothing overlapping");
{
  const w=world({tasks:wed(),checked:{morning_nb:"10:28 AM Oct 8"}});
  w.ctx.momMoveToToday("ellis_mr_L0004");
  const t=w.T("ellis_mr_L0004"), rec=w.ctx.momMoves["ellis_mr_L0004"];
  ok("card is on today", t.day==="wednesday");
  ok("lands right after L3 (11:30), the earlier lesson already on today", t.time==="11:30 AM", t.time);
  ok("recorded as a Mom move to today", rec&&rec.mode==="push"&&rec.toDay==="wednesday"&&rec.pulledFrom==="friday"&&rec.fromTime==="10:30 AM", rec);
  ok("fromDays empty — Friday never counts it as unfinished", Array.isArray(rec.fromDays)&&rec.fromDays.length===0);
  ok("Reading slid later — nothing overlaps today", overlaps(w.ctx.weekData.tasks,"wednesday")===null&&w.T("read_1").time==="12:00 PM", [overlaps(w.ctx.weekData.tasks,"wednesday"),w.T("read_1").time]);
  ok("Closing Notebook still last", w.ctx.weekData.tasks.filter(x=>x.day==="wednesday").every(x=>x.id==="closing_1"||w.ctx.toMin(x.time)<w.ctx.toMin(w.T("closing_1").time)));
  ok("Friday's L5 untouched", w.T("ellis_mr_L0005").day==="friday"&&w.T("ellis_mr_L0005").time==="11:00 AM");
  const mm=w.writes.filter(x=>x[0]==="set"), up=w.writes.filter(x=>x[0]==="update");
  ok("momMoves written per id", mm.length===1&&mm[0][1]==="week26/momMoves/ellis_mr_L0004");
  ok("tasks written as one targeted multi-path update", up.length===1&&up[0][1]==="week26/tasks"&&up[0][2]["ellis_mr_L0004/day"]==="wednesday"&&up[0][2]["read_1/time"]==="12:00 PM", up[0]&&up[0][2]);
  ok("no whole-node set of tasks", !w.writes.some(x=>x[0]==="set"&&x[1]==="week26/tasks"));
  ok("toast", /Moved to today at 11:30 AM/.test(w.toasts[0]||""), w.toasts);
}

console.log("the re-lay works whatever the wall clock says (it uses the app's clock, the same one the placement uses)");
{
  [7*60, 10*60+40, 16*60+30, 20*60+36, 23*60+59].forEach(function(wall){
    const w=world({tasks:wed(),checked:{morning_nb:"x"},wall:wall});
    w.ctx.momMoveToToday("ellis_mr_L0004");
    const lbl=Math.floor(wall/60)+":"+String(wall%60).padStart(2,"0");
    const up=w.writes.filter(x=>x[0]==="update")[0];
    ok("wall "+lbl+": moved to 11:30, Reading slid to 12:00, nothing overlaps",
      w.T("ellis_mr_L0004").time==="11:30 AM"&&w.T("read_1").time==="12:00 PM"&&overlaps(w.ctx.weekData.tasks,"wednesday")===null,
      [w.T("ellis_mr_L0004").time,w.T("read_1").time,overlaps(w.ctx.weekData.tasks,"wednesday")]);
    ok("wall "+lbl+": the slide rides the same targeted update", up&&up[2]["read_1/time"]==="12:00 PM", up&&up[2]);
  });
}

console.log("after school ends (the app's clock past today's school end): ✓ Mark done today — nothing moves, nothing stacks");
{
  [16*60+15, 20*60+36].forEach(function(now){
    const w=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"11:29 AM"},now:now});
    const before=JSON.stringify(w.ctx.weekData.tasks);
    const lbl=Math.floor(now/60)+":"+String(now%60).padStart(2,"0");
    const p=w.ctx.mvtPlan("ellis_mr_L0004");
    ok("now "+lbl+": the dialog offers ✓ Mark done today (mode done)", p.ok===true&&p.mode==="done"&&p.from==="friday", p);
    w.ctx.momMoveToToday("ellis_mr_L0004");
    ok("now "+lbl+": a stale 📅 Move tap moves nothing, writes nothing, no record", JSON.stringify(w.ctx.weekData.tasks)===before&&w.writes.length===0&&!w.ctx.momMoves["ellis_mr_L0004"]&&w.okClicks.length===0, w.toasts);
    w.ctx.momMarkDoneToday("ellis_mr_L0004");
    ok("now "+lbl+": hands it to the normal check-off (dialog ✓, Mom's own check, not a claim)", w.okClicks.length===1&&w.okClicks[0][0]==="ellis_mr_L0004"&&w.okClicks[0][1]===false, w.okClicks);
    ok("now "+lbl+": nothing of its own moved or written (the check-off does the writing)", JSON.stringify(w.ctx.weekData.tasks)===before&&w.writes.length===0&&!w.ctx.momMoves["ellis_mr_L0004"]);
  });
  {
    const w=world({tasks:wed(),checked:{morning_nb:"x"},now:16*60+30});
    const p=w.ctx.mvtPlan("ellis_mr_L0004");
    ok("after school: refused while Lesson 3 (on today) is still open", p.ok===false&&/Check off Lesson 3 first/.test(p.why), p);
    w.ctx.momMarkDoneToday("ellis_mr_L0004");
    ok("after school: refused tap checks nothing off", w.okClicks.length===0&&/Check off Lesson 3 first/.test(w.toasts[0]||""), w.toasts);
    const w2=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"x"},now:16*60+30});
    ok("after school: L5 refused while L4 is still open on Friday", /Check off Lesson 4 first/.test(w2.ctx.mvtPlan("ellis_mr_L0005").why||""), w2.ctx.mvtPlan("ellis_mr_L0005"));
    const w3=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"x","ellis_mr_L0004":"x"},now:16*60+30});
    ok("after school: L5 fine once L4 is done", w3.ctx.mvtPlan("ellis_mr_L0005").mode==="done");
    const w4=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"x"},now:16*60+30,mom:false});
    w4.ctx.momMarkDoneToday("ellis_mr_L0004");
    ok("after school, not Mom: nothing happens", w4.okClicks.length===0&&w4.writes.length===0);
    const w5=world({tasks:wed({extra:[other("reflex_1","friday","2:00 PM",15,{subjectKey:"reflex"})]}),checked:{morning_nb:"x"},now:17*60});
    ok("after school: a day-bound card (Reflex) is still never offered", w5.ctx.mvtPlan("reflex_1").ok===false);
    ok("after school: today's own card is not offered (the normal ✓ covers it)", w5.ctx.mvtPlan("ellis_mr_L0003").ok===false);
  }
  {
    // DeWalt's school ends 4:00 PM, Howe's 4:15 — the switch follows Settings, not a fixed hour
    const dw=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"x"},now:16*60+5,end:"4:00 PM"});
    ok("4:05 PM with a 4:00 school end: Mark done today", dw.ctx.mvtPlan("ellis_mr_L0004").mode==="done");
    const hw=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"x"},now:16*60+5});
    const hp=hw.ctx.mvtPlan("ellis_mr_L0004");
    ok("4:05 PM with a 4:15 school end: still school — no room for 30 min, so not offered", hp.ok===false&&/No room/.test(hp.why), hp);
    const ov=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"x"},now:15*60});
    ov.ctx.rulesData.schoolDay.overrides={wednesday:{end:"2:30 PM"}};
    ok("a per-day end override (Wed 2:30 PM) counts: 3:00 PM is after school", ov.ctx.mvtPlan("ellis_mr_L0004").mode==="done");
  }
  // moved during school, undone in the evening: it goes home, and today is not re-laid around a card that left
  const w=world({tasks:wed(),checked:{morning_nb:"x"}});
  w.ctx.momMoveToToday("ellis_mr_L0004");
  w.ctx._mlNowMin=()=>20*60+36;
  w.ctx.undoMomMove("ellis_mr_L0004");
  ok("undo at 8:36 PM: back on Friday 10:30", w.T("ellis_mr_L0004").day==="friday"&&w.T("ellis_mr_L0004").time==="10:30 AM");
  ok("undo at 8:36 PM: today's cards stay where they were (nothing stacked)", overlaps(w.ctx.weekData.tasks,"wednesday")===null&&w.T("read_1").time==="12:00 PM", [w.T("read_1").time,overlaps(w.ctx.weekData.tasks,"wednesday")]);
  ok("undo at 8:36 PM: Friday doesn't stack either", overlaps(w.ctx.weekData.tasks,"friday")===null, overlaps(w.ctx.weekData.tasks,"friday"));
}

console.log("never before today's school start");
{
  const w=world({tasks:[lesson(4,"friday","10:30 AM")],now:7*60});
  const p=w.ctx.mvtPlan("ellis_mr_L0004");
  ok("7:00 AM: lands at 10:00 AM school start, not 7:00", p.ok&&p.mode==="move"&&p.startMin===10*60, p);
}

console.log("lands after the card in progress when no earlier lesson is on today");
{
  const w=world({tasks:wed().filter(t=>t.id!=="ellis_mr_L0003"),checked:{morning_nb:"x"}});
  w.ctx.momMoveToToday("ellis_mr_L0004");
  ok("right after Spelling (10:30–11:00)", w.T("ellis_mr_L0004").time==="11:00 AM", w.T("ellis_mr_L0004").time);
  ok("nothing overlaps", overlaps(w.ctx.weekData.tasks,"wednesday")===null, overlaps(w.ctx.weekData.tasks,"wednesday"));
}

console.log("the re-lay never rolls the moved card back to its old day");
{
  const w=world({tasks:wed({extra:[other("art_1","wednesday","3:00 PM",30)]}),checked:{morning_nb:"x"}});
  w.ctx.momMoveToToday("ellis_mr_L0004");
  ok("moved card held on today", w.T("ellis_mr_L0004").day==="wednesday"&&w.T("ellis_mr_L0004").time==="11:30 AM");
  ok("mvtHeldToday true for it", w.ctx.mvtHeldToday(w.T("ellis_mr_L0004"))===true);
  // a later pass of the guard (another device's cascade) keeps it put
  const r=w.ctx.seGuardWeek(w.ctx.weekData.tasks,w.ctx.seGuardCtx({kids:["ellis"]}));
  ok("a second re-lay leaves it where Mom put it", w.T("ellis_mr_L0004").day==="wednesday"&&!r.rolled.includes("ellis_mr_L0004")&&!r.deferred.includes("ellis_mr_L0004"));
}

console.log("lesson order holds");
{
  const w=world({tasks:wed(),checked:{morning_nb:"x"}});
  w.ctx.momMoveToToday("ellis_mr_L0005");
  ok("L5 refused while L4 is still on Friday", w.T("ellis_mr_L0005").day==="friday"&&!w.ctx.momMoves["ellis_mr_L0005"]);
  ok("Mom is told which to move first", /Move Lesson 4 first/.test(w.toasts[0]||""), w.toasts);
  ok("nothing written", w.writes.length===0);
  w.ctx.momMoveToToday("ellis_mr_L0004"); w.ctx.momMoveToToday("ellis_mr_L0005");
  ok("after L4 comes over, L5 can follow — and lands after it", w.T("ellis_mr_L0005").day==="wednesday"&&w.ctx.toMin(w.T("ellis_mr_L0005").time)>=w.ctx.toMin(w.T("ellis_mr_L0004").time)+30, [w.T("ellis_mr_L0004").time,w.T("ellis_mr_L0005").time]);
  ok("still nothing overlapping", overlaps(w.ctx.weekData.tasks,"wednesday")===null, overlaps(w.ctx.weekData.tasks,"wednesday"));
  const w2=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0003":"10:59 AM"}});
  ok("an earlier lesson already checked doesn't block", w2.ctx.mvtPlan("ellis_mr_L0004").ok===true);
}

console.log("what is never offered");
{
  const w=world({tasks:wed({extra:[other("reflex_1","friday","2:00 PM",15,{subjectKey:"reflex"}),
    lesson(9,"friday","2:30 PM",{id:"ellis_mr_L0009_c"}),other("box_1","friday","9:00 AM",30,{_eowOverflow:true})]}),checked:{morning_nb:"x"}});
  ok("today's own card: no", w.ctx.mvtPlan("ellis_mr_L0003").ok===false);
  ok("a day-bound card (drill/Reflex): no", w.ctx.mvtPlan("reflex_1").ok===false);
  ok("a carry twin: no", w.ctx.mvtPlan("ellis_mr_L0009_c").ok===false);
  ok("the carry-over box: no", w.ctx.mvtPlan("box_1").ok===false);
  const w3=world({tasks:wed(),checked:{morning_nb:"x","ellis_mr_L0004":"done"}});
  ok("a checked card: no", w3.ctx.mvtPlan("ellis_mr_L0004").ok===false);
  const w4=world({tasks:wed(),momMoves:{"ellis_mr_L0004":{mode:"skip",fromDays:["friday"]}}});
  ok("a card Mom already moved/dismissed: no", w4.ctx.mvtPlan("ellis_mr_L0004").ok===false);
  const w5=world({tasks:wed(),now:16*60});
  ok("no room before school ends: no", w5.ctx.mvtPlan("ellis_mr_L0004").ok===false&&/No room/.test(w5.ctx.mvtPlan("ellis_mr_L0004").why));
  const w6=world({tasks:wed(),kidOff:true});
  ok("kid off today: no", w6.ctx.mvtPlan("ellis_mr_L0004").ok===false);
  const w7=world({tasks:wed(),mom:false});
  w7.ctx.momMoveToToday("ellis_mr_L0004");
  ok("not Mom: nothing happens", w7.T("ellis_mr_L0004").day==="friday"&&w7.writes.length===0&&!w7.ctx.momMoves["ellis_mr_L0004"]);
}

console.log("lunch is stepped over");
{
  const w=world({tasks:[lesson(4,"friday","10:30 AM")],now:12*60+50});
  ok("12:50 + 30 min crosses lunch → lands at 2:00 PM", w.ctx.mvtPlan("ellis_mr_L0004").startMin===14*60);
}

console.log("dry run writes nothing");
{
  const w=world({tasks:wed(),checked:{morning_nb:"x"},dry:true});
  w.ctx.momMoveToToday("ellis_mr_L0004");
  ok("moved locally", w.T("ellis_mr_L0004").day==="wednesday");
  ok("no Firebase writes", w.writes.length===0);
}

console.log("↩ undo puts it back on its own day and time");
{
  const w=world({tasks:wed(),checked:{morning_nb:"x"}});
  w.ctx.momMoveToToday("ellis_mr_L0004"); w.writes.length=0;
  w.ctx.undoMomMove("ellis_mr_L0004");
  ok("back on Friday 10:30", w.T("ellis_mr_L0004").day==="friday"&&w.T("ellis_mr_L0004").time==="10:30 AM");
  ok("record removed", !w.ctx.momMoves["ellis_mr_L0004"]);
  ok("targeted writes only", w.writes.some(x=>x[0]==="remove"&&x[1]==="week26/momMoves/ellis_mr_L0004")&&w.writes.some(x=>x[0]==="update"&&x[1]==="week26/tasks"&&x[2]["ellis_mr_L0004/day"]==="friday"));
}

console.log("wiring");
{
  ok("marker present", src.includes("// "+MOVETODAY));
  ok("dialog has the 📅 Move to today button", /id="dlg-movetoday"[^>]*>&#128197; Move to today</.test(src));
  ok("dialog: Mom-only block (momHereCards) and only when mvtPlan says it can", /if\(momHereCards\(\)&&!t\.id\.endsWith\("_c"\)&&!t\.famBlock\)\{[\s\S]{0,1600}mvtPlan\(id\)/.test(src));
  ok("dialog: after school the button reads ✓ Mark done today and runs momMarkDoneToday", src.includes('if(_mv.mode==="done"){ mtBtn.innerHTML="&#10003; Mark done today"; mtBtn.onclick=()=>momMarkDoneToday(id);'));
  ok("dialog: during school it moves", src.includes('else { mtBtn.innerHTML="&#128197; Move to today"; mtBtn.onclick=()=>momMoveToToday(id); }'));
  ok("the re-lay context holds the moved card", /isClass:t=>\{ try\{ return !!\(t&&t\.famBlock\)\|\|\(typeof mvtHeldToday==="function"&&mvtHeldToday\(t\)\)/.test(src));
  ok("undo label names the day it goes back to", src.includes('("↩ Undo move (back to "+cap(p.pulledFrom)+")")'));
  ok("both re-lays run on the app's clock, not the wall clock", (src.match(/seGuardCtx\(\{kids:\[t\.who\],nowMin:_mlNowMin\(\)\}\)/g)||[]).length===2);
  ok("card label says where it came from", src.includes("&#128197; Moved from '+cap(_pf.pulledFrom)"));
  ok("undoMomMove sends a moved card home", src.includes("if(rec&&rec.pulledFrom&&typeof mvtUndo===\"function\") mvtUndo(id,rec);"));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
