/*
 * ✗ Not today on a subject card — MOMNOTTODAY (Mom-only; her ask 2026-10-23).
 *   · the ✗ draws only for Mom (momHereCards), on today's open card — not checked, not sent to Mom, not a carry mirror,
 *     not Family Time, not read-only, not already moved; kids never see it
 *   · a LESSON card → the dialog's push record with toDay chosen for her: next school day, then the subject's own days
 *     this week (allowedDays in a co-op week, noCoopDays in a week with none); the sequence and curriculum/done untouched;
 *     no bank, spin or history write; the record is byte-for-byte what pushTaskForward writes
 *   · a DAILY card → momMoves/<id> = {mode:"waive", ts}; rtSchoolworkDone reads true with it as the only open card and
 *     celebrateDayComplete fires; no bank, spin or done write; Mom sees "✗ not today · undo", the kid "Mom said not today"
 *     with no checkbox; effectiveDay keeps it on its day; the 8 PM sweep and the school-end guard leave it; it never
 *     carries to next week
 *   · undo both ways (the dialog's undoMomMove for a push, momNotTodayUndo for a waive) puts the card back exactly
 *   · with no ✗ tap and no record the render is byte-identical to the hooks-off render; dry-run writes nothing
 *   run:  node test_mom_not_today.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("no fn "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const one=n=>{ const i=src.indexOf("function "+n+"("); if(i<0) throw new Error("no fn "+n); return src.slice(i,src.indexOf("\n",i)); };
const BLOCK=cut("// MOMNOTTODAY_START","// MOMNOTTODAY_END");

console.log("The block");
ok("MOMNOTTODAY block sits right after the momMoves code (undoMomMove) and before MOVETODAY", src.indexOf("function undoMomMove(")<src.indexOf("// MOMNOTTODAY_START")&&src.indexOf("// MOMNOTTODAY_START")<src.indexOf("// MOVETODAY_START"));
ok("rtSchoolworkDone's gate names the waive (an open waived card, like an open _offDay card, is left out)", /!t\._eowOverflow&&!\(\(typeof mntWaived==="function"&&mntWaived\(t\)\)&&!checked\[t\.id\]\)&&/.test(one("rtSchoolworkDone"))&&/&&!\(\(t\._offDay\|\|t\._dayDrop\)&&!checked\[t\.id\]\)\); return ts\.length===0/.test(one("rtSchoolworkDone")));
ok("the end-of-day claim gate (schoolDoneOn) names the waive — a waived daily never blocks the kid's claim", (()=>{ const i=src.indexOf("function schoolDoneOn("); const b=src.slice(i,i+900); return /mntWaived\(t\)/.test(b); })());
ok("the last-card celebration check (pace toast) names the waive", /!_dismissed\(x\) && !\(typeof mntWaived==="function"&&mntWaived\(x\)\)/.test(src));
ok("effectiveDay keeps a waived card on its own day", /if\(_mv&&_mv\.mode==="waive"\) return t\.day;/.test(fn("effectiveDay")));
ok("the sweep leaves a waived card (right after its _dayDrop rule)", /if\(t\._dayDrop\) return;[^\n]*\n    if\(typeof mntWaived==="function"&&mntWaived\(t\)\) return;/.test(fn("cascadeIntraWeek")));
ok("a waived card never carries to next week", /_m\.mode==="drop"\|\|_m\.mode==="waive"/.test(fn("_carryBlocked")));
ok("the block writes only the targeted momMoves/<id> path", /db\.ref\(WK\+"\/momMoves\/"\+id\)\.set\(rec\)/.test(BLOCK)&&/db\.ref\(WK\+"\/momMoves\/"\+id\)\.remove\(\)/.test(BLOCK)&&(BLOCK.match(/db\.ref\(/g)||[]).length===2);
ok("every write is behind db && !_dryRun()", (BLOCK.match(/db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\) db\.ref/g)||[]).length===2);
ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}")<0);

// ── a frozen clock: Wed 2026-10-07 (or another weekday of that week), at a wall minute ──
function frozenDate(iso,wallMin){
  const R=Date, fixed=new R(iso+"T00:00:00"); fixed.setHours(Math.floor(wallMin/60),wallMin%60,0,0); const ms=fixed.getTime();
  class FD extends R{ constructor(...a){ if(a.length) super(...a); else super(ms); } static now(){ return ms; } }
  return FD;
}
const WEEK={monday:"October 5",tuesday:"October 6",wednesday:"October 7",thursday:"October 8",friday:"October 9"};
const seq=[], ids=[]; for(let i=1;i<=20;i++){ seq.push("Lesson "+i); ids.push("L"+String(i).padStart(4,"0")); }
// subjects: math is a 4-day subject — Mon Tue Wed Fri in a co-op week (Thursday is co-op), Mon Tue Wed Thu in a week with none
const SUBJ={ellis:{
  math:{display:"Math",lessonSeq:seq,lessonIds:ids,allowedDays:["Mon","Tue","Wed","Fri"],noCoopDays:["Mon","Tue","Wed","Thu"]},
  hist:{display:"History",lessonSeq:seq,lessonIds:ids},                       // no day pattern → the dialog's own answer
  read:{display:"Independent Reading",tracking:"daily"},
  morning_nb:{noCarry:true}, closing_nb:{noCarry:true},
  art:{display:"Art"}                                                          // plain subject, no lessons, carries → the sweep would move it
}};
const L=(n,day,time,x)=>Object.assign({id:"ellis_math_L"+String(n).padStart(4,"0"),who:"ellis",subjectKey:"math",day,time,dur:30,mom:"none",title:"📐 Math — Lesson "+n,lid:"L"+String(n).padStart(4,"0"),detail:"Lesson "+n},x||{});
const C=(id,sk,title,day,time,x)=>Object.assign({id,who:"ellis",subjectKey:sk,day,time,dur:20,mom:"none",title,detail:""},x||{});

const CODE=[fn("toMin"),fn("fromMin"),fn("calNormDate"),fn("smapIsOff"),fn("smapIsKidOff"),fn("_pushDateStr"),fn("_nextSchoolDay"),
  fn("_saveMomMove"),fn("pushTaskForward"),fn("undoMomMove"),fn("_pushedFrom"),fn("_dismissed"),fn("effectiveDay"),fn("_isPastDay"),
  fn("kidOffOwnDay"),fn("taskLessonRef"),fn("_lessonPos"),fn("subjNoCarry"),fn("_carryBlocked"),
  "const _CWD_DAYS="+src.slice(src.indexOf("const _CWD_DAYS=")+16,src.indexOf("\n",src.indexOf("const _CWD_DAYS="))),
  one("noCoopDaysOf"),one("subjDaysFor"),one("momHere"),one("momHereCards"),
  src.slice(src.indexOf("let _rtSwLay=null"),src.indexOf("\n",src.indexOf("function rtSchoolworkDone("))+1),
  fn("taskCard"),BLOCK].join("\n");

// o: {today, wall, tasks, checked, claimed, momMoves, mom, kidsTab, coop, dry, kidOff, hooksOff}
function world(o){
  o=o||{};
  const writes=[], toasts=[], celebs=[], casc=[], renders=[], banks=[], spins=[];
  const today=o.today||"wednesday";
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,Set,Map,Error,
    Date:frozenDate({monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09"}[today],o.wall==null?10*60+40:o.wall),
    setTimeout:(f)=>{ f(); return 1; },
    weekData:{tasks:o.tasks||[]},checked:o.checked||{},claimed:o.claimed||{},momMoves:o.momMoves||{},histState:{},pendingSpins:{},
    WK:"week26",DAY_DT:WEEK,DAYS:["monday","tuesday","wednesday","thursday","friday","saturday"],day:today,kid:"all",tab:o.kidsTab?"kids":"schedule",
    currData:{subjects:SUBJ},calendarData:{holidays:{},vacations:{},kidOverrides:{}},rulesData:{schoolDay:{defaultStart:"10:00 AM",defaultEnd:"4:15 PM"}},
    paceData:{subjects:{}},walkbackExcl:{},baseId:id=>String(id||"").replace(/_c$/,""),
    momModeActive:o.mom!==false,adminPinUnlocked:false,
    coopFullDayFor:()=>null,schedOvKidOff:(k,ds)=>!!(o.kidOff&&o.kidOff[ds]),coopWeekHas:()=>!!o.coop,
    coopsMap:()=>({}),_coopHasDate:()=>false,fxIsClass:s=>!!(s&&s.fixedTime),ldPin:()=>false,ldPinnedTask:()=>false,
    routineDateISO:()=>null,
    cap:s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):s,esc:s=>String(s),taskTitleShow:t=>t.title,
    nowTs:()=>"10:40 AM Oct 7",dbg:()=>{},sv:()=>{},ld:()=>null,
    gwShowToast:m=>toasts.push(m),closeDlg:()=>{},schedCascade:()=>casc.push(1),renderAll:()=>renders.push("all"),renderMomsPlan:()=>renders.push("momsplan"),
    celebrateDayComplete:(k,d)=>celebs.push([k,d]),bankDirect:(k,p,n)=>banks.push([k,p,n]),openSlotMachine:()=>spins.push(1),
    _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    document:{getElementById:()=>null},
    _mlClaimDay:t=>t.day,coActionsHTML:()=>"",coKidHeldLine:()=>"",coKidSentBackRow:()=>"",scoreLabel:()=>""};
  Object.defineProperty(ctx,"_todayDay",{get:()=>today});
  vm.createContext(ctx);
  let code=CODE; if(o.hooksOff) code=code.replace(BLOCK,"");   // base behaviour: the hooks find no mnt* functions
  vm.runInContext(code,ctx);
  ctx.getActiveTasks=()=>ctx.weekData.tasks;
  const q=e=>vm.runInContext(e,ctx);
  return {ctx,q,writes,toasts,celebs,casc,renders,banks,spins,
    card:(id,ro)=>q("taskCard(weekData.tasks.find(x=>x.id==='"+id+"'),null,"+(ro?"true":"false")+")"),
    tap:id=>q("momNotToday('"+id+"')"), undo:id=>q("momNotTodayUndo('"+id+"')")};
}
const onlyMomMoves=(w)=>w.writes.every(x=>/^week26\/momMoves\//.test(x[1]));

console.log("\nThe ✗ on a card");
{
  const w=world({tasks:[L(5,"wednesday","10:00 AM"),L(6,"friday","10:00 AM"),C("rd","read","📖 Independent Reading","wednesday","11:00 AM"),C("fam","art","🏡 Family Time","wednesday","1:00 PM",{famBlock:"fam1"}),C("mir_c","art","Mirror","wednesday","2:00 PM")]});
  const h=w.card("ellis_math_L0005");
  ok("Mom, today's open lesson card → a small ✗ titled \"Not today\" that taps momNotToday(id)", /class="mnt-x" onclick="event\.stopPropagation\(\);momNotToday\('ellis_math_L0005'\)" title="Not today"/.test(h), h.slice(0,300));
  ok("…and the ✗ sits in the card's header corner (after the badges)", h.indexOf('class="mnt-x"')>h.indexOf('class="kid-badge')&&h.indexOf('class="mnt-x"')<h.indexOf('class="task-detail"'));
  ok("the card still has its checkbox and tap", /class="task-cb" onclick="tapTask\('ellis_math_L0005'\)"/.test(h));
  ok("a daily card gets the same ✗", /momNotToday\('rd'\)/.test(w.card("rd")));
  ok("Friday's card (not today) → no ✗", !/mnt-x/.test(w.card("ellis_math_L0006")));
  ok("a Family Time card → no ✗", !/mnt-x/.test(w.card("fam")));
  ok("a carry mirror (_c) → no ✗", !/mnt-x/.test(w.card("mir_c")));
  ok("a read-only card → no ✗", !/mnt-x/.test(w.card("ellis_math_L0005",true)));
  const k=world({tasks:[L(5,"wednesday","10:00 AM")],mom:false});
  ok("a kid's device (not Mom) → no ✗", !/mnt-x|momNotToday/.test(k.card("ellis_math_L0005")));
  const kt=world({tasks:[L(5,"wednesday","10:00 AM")],kidsTab:true});
  ok("Mom on the Kids tab (momHereCards false) → no ✗", !/mnt-x/.test(kt.card("ellis_math_L0005")));
  const ck=world({tasks:[L(5,"wednesday","10:00 AM")],checked:{ellis_math_L0005:"10:30 AM Oct 7"}});
  ok("a checked card → no ✗", !/mnt-x/.test(ck.card("ellis_math_L0005")));
  const cl=world({tasks:[L(5,"wednesday","10:00 AM")],claimed:{ellis_math_L0005:"10:30 AM Oct 7"}});
  ok("a card sent to Mom (claimed) → no ✗", !/mnt-x/.test(cl.card("ellis_math_L0005")));
  const pu=world({tasks:[L(5,"wednesday","10:00 AM")],momMoves:{ellis_math_L0005:{mode:"push",toDay:"friday",fromDays:["wednesday"],ts:"x"}}});
  ok("an already-pushed card → no ✗ (it isn't today's any more)", !/mnt-x/.test(pu.card("ellis_math_L0005")));
}

console.log("\nNo tap, no record → byte-identical to the hooks-off render; nothing written");
{
  const tasks=[L(5,"wednesday","10:00 AM"),C("rd","read","📖 Independent Reading","wednesday","11:00 AM")];
  const kidOn=world({tasks,mom:false}), kidOff=world({tasks,mom:false,hooksOff:true});
  ok("kid view: the lesson card renders exactly as before", kidOn.card("ellis_math_L0005")===kidOff.card("ellis_math_L0005"));
  ok("kid view: the daily card renders exactly as before", kidOn.card("rd")===kidOff.card("rd"));
  const momOn=world({tasks}), momOff=world({tasks,hooksOff:true});
  const a=momOn.card("rd"), b=momOff.card("rd");
  ok("Mom's view differs from before only by the ✗ span", a.replace(/<span class="mnt-x"[^>]*>&#10007;<\/span>/,"")===b&&a!==b);
  const done=world({tasks,checked:{ellis_math_L0005:"10:30 AM Oct 7",rd:"10:50 AM Oct 7"}}), doneOff=world({tasks,checked:{ellis_math_L0005:"10:30 AM Oct 7",rd:"10:50 AM Oct 7"},hooksOff:true});
  ok("Mom's view of a done card is exactly as before", done.card("rd")===doneOff.card("rd")&&done.card("ellis_math_L0005")===doneOff.card("ellis_math_L0005"));
  ok("no write of any kind", momOn.writes.length===0&&kidOn.writes.length===0);
  ok("the day-done gate reads as before (an open card holds the day)", momOn.q("rtSchoolworkDone('ellis','wednesday')")===false&&momOff.q("rtSchoolworkDone('ellis','wednesday')")===false);
}

console.log("\nLesson or daily?");
{
  const w=world({tasks:[]});
  const is=t=>w.q("mntIsLesson("+JSON.stringify(t)+")");
  ok("a stamped lesson (lid) → lesson", is(L(5,"wednesday","10:00 AM"))===true);
  ok("a lesson placed by its title in the sequence → lesson", is(C("h","hist","📜 History — Lesson 3","wednesday","10:00 AM"))===true);
  ok("a daily-tracked subject → daily, even with a number in the title", is(C("r","read","📖 Independent Reading — 20 min","wednesday","10:00 AM"))===false);
  ok("the Morning Notebook → daily", is(C("mn","morning_nb","📓 Morning Notebook — Morning Notebook","wednesday","10:00 AM"))===false);
  ok("Reflex → daily", is(C("rf","reflex","⚡ Reflex Math","wednesday","10:00 AM"))===false);
  ok("a retrieval slot → daily", is(C("sp","retrieval","🏃 Sprint","wednesday","10:00 AM"))===false);
  ok("a plain subject with no lessons → daily", is(C("a","art","🎨 Art","wednesday","10:00 AM"))===false);
}

console.log("\nA lesson ✗ — the dialog's push, the day chosen for her");
{
  // co-op week: Thursday is not a Math day (allowedDays Mon Tue Wed Fri) → Friday
  const w=world({tasks:[L(5,"wednesday","10:00 AM"),L(6,"friday","10:00 AM")],coop:true});
  w.tap("ellis_math_L0005");
  ok("co-op week, 4-day subject (Mon Tue Wed Fri): Wednesday's ✗ pushes to FRIDAY (Thursday isn't a Math day)", w.writes.length===1&&w.writes[0][0]==="set"&&w.writes[0][1]==="week26/momMoves/ellis_math_L0005"&&w.writes[0][2].mode==="push"&&w.writes[0][2].toDay==="friday", w.writes);
  ok("the record is the dialog's: {mode:push, toDay, fromDays:[today], ts}", JSON.stringify(Object.keys(w.writes[0][2]).sort())===JSON.stringify(["fromDays","mode","toDay","ts"])&&JSON.stringify(w.writes[0][2].fromDays)===JSON.stringify(["wednesday"])&&w.writes[0][2].ts==="10:40 AM Oct 7");
  ok("the same toast as the dialog", w.toasts.length===1&&w.toasts[0]==="Moved to Friday ✓", w.toasts);
  ok("the cascade and a redraw run, as after the dialog's push", w.casc.length===1&&w.renders.length===1);
  ok("only momMoves is written — no bank, spin, history or curriculum/done", onlyMomMoves(w)&&w.banks.length===0&&w.spins.length===0);
  ok("nothing checked, nothing consumed: checked stays empty, the card's own day/time untouched", Object.keys(w.ctx.checked).length===0&&w.q("weekData.tasks[0].day")==="wednesday"&&w.q("weekData.tasks[0].time")==="10:00 AM");
  ok("the lesson now reads as Friday's (effectiveDay) — the sequence intact, L5 before L6", w.q("effectiveDay(weekData.tasks[0])")==="friday"&&w.q("_lessonPos(weekData.tasks[0])")<w.q("_lessonPos(weekData.tasks[1])"));
  ok("it left today's gate: Wednesday reads done with nothing else open", w.q("rtSchoolworkDone('ellis','wednesday')")===true);
  // the pushed card draws the dialog's own "Pushed from Wednesday" label on Friday, no ✗
  const h=w.card("ellis_math_L0005");
  ok("on its new day the card wears the dialog's \"Pushed from Wednesday\" label and no ✗", /Pushed from Wednesday/.test(h)&&!/mnt-x/.test(h));
  // undo = the dialog's own path
  w.writes.length=0; w.q("undoMomMove('ellis_math_L0005')");
  ok("undo (the dialog's ↩ Un-push) removes the one record — a targeted remove", w.writes.length===1&&w.writes[0][0]==="remove"&&w.writes[0][1]==="week26/momMoves/ellis_math_L0005"&&!w.q("momMoves.ellis_math_L0005"));
  ok("…and the card is back on Wednesday with its ✗", w.q("effectiveDay(weekData.tasks[0])")==="wednesday"&&/mnt-x/.test(w.card("ellis_math_L0005")));
}
{
  // week with no co-op: Thursday IS a Math day (noCoopDays Mon Tue Wed Thu) → Thursday
  const w=world({tasks:[L(5,"wednesday","10:00 AM")],coop:false});
  w.tap("ellis_math_L0005");
  ok("a week with NO co-op, same subject (Mon Tue Wed Thu): Wednesday's ✗ pushes to THURSDAY", w.writes.length===1&&w.writes[0][2].toDay==="thursday", w.writes);
}
{
  // Thursday is the kid's day off (co-op / Mom's mark) → the dialog's walk skips it even in a no-co-op pattern
  const w=world({tasks:[L(5,"wednesday","10:00 AM")],coop:false,kidOff:{"2026-10-08":true}});
  w.tap("ellis_math_L0005");
  ok("the kid is off Thursday → Friday: the dialog's walk skips kid-off days, and with no pattern day left this week the ✗ takes the dialog's own next school day", w.writes.length===1&&w.writes[0][2].toDay==="friday", w.writes);
}
{
  // a holiday Thursday
  const w=world({tasks:[L(5,"wednesday","10:00 AM")],coop:false});
  w.ctx.calendarData.holidays={h1:{name:"Fall day",start:"2026-10-08",end:"2026-10-08"}};
  w.tap("ellis_math_L0005");
  ok("a holiday Thursday → Friday (holidays skipped like the dialog)", w.writes.length===1&&w.writes[0][2].toDay==="friday", w.writes);
}
{
  // no day pattern → exactly the dialog's answer
  const w=world({tasks:[C("h3","hist","📜 History — Lesson 3","wednesday","10:00 AM")]});
  const w2=world({tasks:[C("h3","hist","📜 History — Lesson 3","wednesday","10:00 AM")]});
  w.tap("h3"); w2.q("pushTaskForward('h3')");
  ok("a subject with no day pattern → the dialog's next school day (Thursday)", w.writes.length===1&&w.writes[0][2].toDay==="thursday", w.writes);
  ok("…and the record is byte-for-byte what pushTaskForward writes", JSON.stringify(w.writes[0])===JSON.stringify(w2.writes[0]), [w.writes[0],w2.writes[0]]);
}
{
  // last school day of the week → the dialog hides its button; the ✗ says so and writes nothing
  const w=world({today:"friday",tasks:[L(5,"friday","10:00 AM")]});
  w.tap("ellis_math_L0005");
  ok("no school day left this week → the dialog's own words, nothing written", w.writes.length===0&&w.toasts[0]==="No school day left this week — it'll carry over."&&!w.q("momMoves.ellis_math_L0005"), w.toasts);
}
{
  const w=world({tasks:[L(5,"wednesday","10:00 AM")],dry:true}); w.tap("ellis_math_L0005");
  ok("dry-run: the record is held locally, nothing reaches Firebase", w.writes.length===0&&w.q("momMoves.ellis_math_L0005.mode")==="push");
  const nm=world({tasks:[L(5,"wednesday","10:00 AM")],mom:false}); nm.tap("ellis_math_L0005");
  ok("not Mom → nothing happens", nm.writes.length===0&&!nm.q("momMoves.ellis_math_L0005")&&nm.toasts.length===0);
  const ck=world({tasks:[L(5,"wednesday","10:00 AM")],checked:{ellis_math_L0005:"x"}}); ck.tap("ellis_math_L0005");
  ok("a checked card → nothing happens", ck.writes.length===0);
  const cl=world({tasks:[L(5,"wednesday","10:00 AM")],claimed:{ellis_math_L0005:"x"}}); cl.tap("ellis_math_L0005");
  ok("a card sent to Mom → nothing happens", cl.writes.length===0);
}

console.log("\nA daily ✗ — waived for the day; the day can finish");
{
  const tasks=[L(5,"wednesday","10:00 AM"),C("rd","read","📖 Independent Reading","wednesday","11:00 AM"),C("cn","closing_nb","📓 Closing Notebook — Closing Notebook","wednesday","3:50 PM")];
  const w=world({tasks,checked:{ellis_math_L0005:"10:30 AM Oct 7",cn:"10:35 AM Oct 7"}});
  ok("before: Reading is the only open card → the day is not done", w.q("rtSchoolworkDone('ellis','wednesday')")===false&&w.celebs.length===0);
  w.tap("rd");
  ok("one targeted write: week26/momMoves/rd = {mode:\"waive\", ts}", w.writes.length===1&&w.writes[0][0]==="set"&&w.writes[0][1]==="week26/momMoves/rd"&&JSON.stringify(w.writes[0][2])===JSON.stringify({mode:"waive",ts:"10:40 AM Oct 7"}), w.writes);
  ok("rtSchoolworkDone reads TRUE with the waived card the only open one", w.q("rtSchoolworkDone('ellis','wednesday')")===true);
  ok("celebrateDayComplete fires for the kid, today", w.celebs.length===1&&w.celebs[0][0]==="ellis"&&w.celebs[0][1]==="wednesday", w.celebs);
  ok("no bank, no spin, no done record: checked unchanged, bankDirect never called, no curriculum/history write", Object.keys(w.ctx.checked).length===2&&!w.ctx.checked.rd&&w.banks.length===0&&w.spins.length===0&&onlyMomMoves(w));
  ok("the cascade does NOT run (nothing moves); a redraw does", w.casc.length===0&&w.renders.length===1);
  ok("the card stays on its day and time", w.q("weekData.tasks[1].day")==="wednesday"&&w.q("weekData.tasks[1].time")==="11:00 AM"&&w.q("effectiveDay(weekData.tasks[1])")==="wednesday");
  ok("a kid-safe toast", w.toasts.length===1&&w.toasts[0]==="Not today ✓", w.toasts);
  // Mom's render
  const hm=w.card("rd");
  ok("Mom sees the card greyed with \"✗ not today\" and an undo that taps momNotTodayUndo(id)", /mnt-waived/.test(hm)&&/&#10007; not today/.test(hm)&&/momNotTodayUndo\('rd'\)/.test(hm)&&/>undo</.test(hm), hm);
  ok("…with no checkbox and no ✗", !/task-cb/.test(hm)&&!/mnt-x/.test(hm));
  // the kid's render
  w.ctx.momModeActive=false;
  const hk=w.card("rd");
  ok("the kid sees it greyed, \"Mom said not today\", no checkbox, no undo, no ✗", /Mom said not today/.test(hk)&&!/task-cb/.test(hk)&&!/undo/.test(hk)&&!/mnt-x|momNotToday/.test(hk), hk);
  ok("the kid's gate agrees: their day reads done", w.q("rtSchoolworkDone('ellis','wednesday')")===true);
  w.ctx.momModeActive=true;
  // tomorrow: the waived card stays on Wednesday (an unwaived carrying card would roll to today)
  const tm=world({today:"thursday",tasks:[C("rd","art","🎨 Art","wednesday","11:00 AM"),C("rd2","art","🎨 Art 2","wednesday","11:30 AM")],momMoves:{rd:{mode:"waive",ts:"x"}}});
  ok("on Thursday the waived card still reads as Wednesday's (effectiveDay) while its unwaived twin rolls forward", tm.q("effectiveDay(weekData.tasks[0])")==="wednesday"&&tm.q("effectiveDay(weekData.tasks[1])")==="thursday");
  ok("…and it never carries to next week (_carryBlocked)", tm.q("_carryBlocked(weekData.tasks[0],new Set())")===true&&tm.q("_carryBlocked(weekData.tasks[1],new Set())")===false);
  // undo
  const before=world({tasks,checked:{ellis_math_L0005:"10:30 AM Oct 7",cn:"10:35 AM Oct 7"}}).card("rd");
  w.writes.length=0; w.renders.length=0; w.undo("rd");
  ok("undo: one targeted remove of week26/momMoves/rd, the record gone", w.writes.length===1&&w.writes[0][0]==="remove"&&w.writes[0][1]==="week26/momMoves/rd"&&!w.q("momMoves.rd"), w.writes);
  ok("the card is exactly as it was (byte-identical render, ✗ back), the day open again", w.card("rd")===before&&/mnt-x/.test(w.card("rd"))&&w.q("rtSchoolworkDone('ellis','wednesday')")===false);
  ok("…and a redraw ran", w.renders.length===1);
}
{
  const tasks=[L(5,"wednesday","10:00 AM"),C("rd","read","📖 Independent Reading","wednesday","11:00 AM")];
  const w=world({tasks}); w.tap("rd");
  ok("another card still open → the day is not done and no celebration fires", w.q("rtSchoolworkDone('ellis','wednesday')")===false&&w.celebs.length===0);
  const d=world({tasks,dry:true}); d.tap("rd");
  ok("dry-run: the waive is held locally, nothing reaches Firebase", d.writes.length===0&&d.q("momMoves.rd.mode")==="waive");
  d.undo("rd"); ok("dry-run undo: nothing reaches Firebase either", d.writes.length===0&&!d.q("momMoves.rd"));
  const nm=world({tasks,mom:false,momMoves:{rd:{mode:"waive",ts:"x"}}}); nm.undo("rd");
  ok("not Mom → undo does nothing", nm.writes.length===0&&nm.q("momMoves.rd.mode")==="waive");
  const pu=world({tasks,momMoves:{rd:{mode:"push",toDay:"friday",fromDays:["wednesday"],ts:"x"}}}); pu.undo("rd");
  ok("momNotTodayUndo only undoes a waive (a push keeps the dialog's own undo)", pu.writes.length===0&&pu.q("momMoves.rd.mode")==="push");
  const tw=world({tasks,momMoves:{rd:{mode:"waive",ts:"x"}}}); tw.tap("rd");
  ok("a second tap on a waived card writes nothing", tw.writes.length===0);
  const kt=world({tasks}); kt.ctx.tab="moms-plan"; kt.ctx.document={getElementById:id=>id==="content"?{}:null}; kt.tap("rd");
  ok("on Mom's Day the redraw is renderMomsPlan (the kid rows / Schedule), not the whole app", kt.renders.length===1&&kt.renders[0]==="momsplan");
}

console.log("\nThe 8 PM sweep and the re-pack leave a waived daily where it is");
{
  // the real cascadeIntraWeek, the way test_sweep_keeps_dailies drives it
  const FNS=["toMin","fromMin","_parseCheckTs","_dismissed","_normOrderArr","taskDevice","taskSubject","taskTier","capFor","capForDisplay","catchupDayCap","isCatchupCapped",
    "subjNoCarry","applyStickyOrder","packDay","packAround","momClosingSlot","cascadeIntraWeek"].map(fn).join("\n")+"\n"+BLOCK;
  const RealDate=Date;
  const FD=class extends RealDate{ constructor(...a){ if(!a.length) super("2026-10-08T20:06:00"); else super(...a); } static now(){ return new RealDate("2026-10-08T20:06:00").getTime(); } };
  const SUBJ2={ellis:{morning_nb:{noCarry:true},closing_nb:{noCarry:true},read:{tracking:"daily"},art:{}}};
  const tasks=[
    {id:"mn",who:"ellis",day:"thursday",time:"10:00 AM",dur:15,title:"📓 Morning Notebook",subjectKey:"morning_nb",mom:"none",device:"paper"},
    {id:"rd",who:"ellis",day:"thursday",time:"11:00 AM",dur:20,title:"📖 Independent Reading",subjectKey:"read",mom:"none",device:"paper"},
    {id:"a1",who:"ellis",day:"thursday",time:"2:00 PM",dur:30,title:"🎨 Art",subjectKey:"art",mom:"none",device:"paper"},        // waived — plain carrying subject
    {id:"a2",who:"ellis",day:"thursday",time:"2:30 PM",dur:30,title:"🎨 Art 2",subjectKey:"art",mom:"none",device:"paper"},      // its unwaived twin — the sweep moves it
    {id:"cn",who:"ellis",day:"thursday",time:"3:55 PM",dur:20,title:"📓 Closing Notebook",subjectKey:"closing_nb",mom:"none",device:"paper"},
    {id:"mf",who:"ellis",day:"friday",time:"10:00 AM",dur:15,title:"📓 Morning Notebook",subjectKey:"morning_nb",mom:"none",device:"paper"},
  ];
  const env={DAY_DT:WEEK,WK:"week26",ROSTER:["lincoln","ellis","lucy","julian"],weekData:{tasks,babysitter:{}},checked:{},claimed:{},histState:{},
    momMoves:{rd:{mode:"waive",ts:"x"},a1:{mode:"waive",ts:"x"}},currData:{subjects:SUBJ2},
    rulesData:{schoolDay:{defaultStart:"10:00 AM",defaultEnd:"4:15 PM",lunchStart:"1:00 PM",lunchEnd:"2:00 PM"}},
    fbCurrLoaded:true,_cascNowMin:20*60+6,DEFAULT_DAY_CAP:2,smapIsKidOff:()=>null,schedOv:()=>null,schedOvKidOff:()=>null,satCutoffMin:()=>null,satApplyCutoff:()=>{},
    sv:()=>{},dbg:()=>{},renderAll:()=>{},safeWriteTasks:()=>{},lockHeldByOther:()=>false,_dryRun:()=>true,
    db:{ref:()=>({update:()=>Promise.resolve(),set:()=>Promise.resolve()})},Date:FD,
    console,JSON,Math,Object,Array,Set,Map,String,Number,parseInt,isNaN,Promise};
  const keys=Object.keys(env);
  new Function(...keys,"\"use strict\";"+FNS+"; cascadeIntraWeek(true); return null;")(...keys.map(k=>env[k]));
  const at=id=>tasks.find(t=>t.id===id);
  ok("the unwaived Art card moved into the rest of the week (the sweep's full path ran)", at("a2").day!=="thursday", at("a2"));
  ok("the waived Art card stays on Thursday at 2:00 PM", at("a1").day==="thursday"&&at("a1").time==="2:00 PM", at("a1"));
  ok("the waived Reading stays on Thursday at 11:00 AM", at("rd").day==="thursday"&&at("rd").time==="11:00 AM", at("rd"));
  ok("the notebooks are untouched (as before)", at("mn").time==="10:00 AM"&&at("cn").time==="3:55 PM"&&at("mf").day==="friday");
}

console.log("\nThe school-end guard leaves a waived daily on its day");
{
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Set,Map,Date};
  vm.createContext(ctx); vm.runInContext([fn("toMin"),fn("fromMin"),fn("seGuardWeek")].join("\n"),ctx);
  const tasks=[
    {id:"m5",who:"ellis",subjectKey:"math",day:"wednesday",time:"10:00 AM",dur:30,title:"📐 Math — Lesson 5",lid:"L0005"},
    {id:"rd",who:"ellis",subjectKey:"read",day:"wednesday",time:"3:50 PM",dur:40,title:"📖 Independent Reading"},   // waived; runs past 4:15
    {id:"cn",who:"ellis",subjectKey:"closing_nb",day:"wednesday",time:"4:30 PM",dur:10,title:"📓 Closing Notebook"},
  ];
  ctx.T=tasks;
  ctx.O={days:["monday","tuesday","wednesday","thursday","friday"],todayDay:"wednesday",nowMin:10*60+40,toMin:ctx.toMin,fromMin:ctx.fromMin,checked:{},claimed:{},
    win:()=>({start:10*60,end:16*60+15,lunchStart:13*60,lunchEnd:14*60}),kidOff:()=>false,isClass:()=>false,isLesson:t=>!!t.lid,ahead:()=>0};
  const out=vm.runInContext("seGuardWeek(T,O)",ctx);
  const rd=tasks.find(t=>t.id==="rd");
  ok("the waived daily is still Wednesday's — re-timed to fit if need be, never rolled or dropped", rd.day==="wednesday"&&out.deferred.indexOf("rd")<0&&out.dropped.indexOf("rd")<0&&!Object.keys(out.upd).some(p=>p==="rd"||p==="rd/day"), {rd,out});
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
