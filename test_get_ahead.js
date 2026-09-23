/*
 * ⏩ Get ahead + the day's end (her design 2026-09-23):
 *   · the day ENDS when every card is done or sent to Mom → celebrate on the kid's screen, afternoon chores open
 *   · only work that FELL OFF today feeds in automatically; later days' lessons are ⏩ Get ahead CHOICES
 *   · each subject's next lesson from a later day THIS week, most behind first; nothing moves until checked off
 *   · checked early → flagged gotAhead → +50% of its spin straight to the bank, no cap; un-check takes it back
 *   run:  node test_get_ahead.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
function slice(n){ const i=src.indexOf("function "+n); return src.slice(i,src.indexOf("\n}",i)+2); }
let ID=0; const card=(who,day,time,dur,mom,sk,title,x)=>Object.assign({id:sk+"_"+(ID++),who,day,time,dur,mom:mom||"none",subjectKey:sk,title:title||sk},x||{});
function world(o){
  const ctx={console,weekData:{tasks:o.tasks},checked:o.checked||{},claimed:o.claimed||{},momMoves:{},_todayDay:"wednesday",day:o.viewDay||"wednesday",
    effectiveDay:t=>t.day,currExpectedBase:(k,sk)=>(o.behind||{})[sk]===undefined?null:(o.behind||{})[sk],computeSubjectCursor:()=>0,WK:"week24",
    planPace:(k,sk)=>({behind:(o.behind||{})[sk]||0,ahead:0,score:-((o.behind||{})[sk]||0)}),
    subjNoCarry:t=>/retrieval|reflex/.test(t.subjectKey),mlMomOff:()=>false,mlNow:()=>({kid:o.momWith===undefined?null:o.momWith}),
    taskLessonRef:t=>(t.title.split(" — ")[1]||""),esc:s=>String(s==null?"":s),cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),
    Object,String,Array,Math,Date,RegExp,parseInt,JSON,Set};
  vm.createContext(ctx); vm.runInContext(slice("toMin")+"\n"+slice("fromMin")+"\n"+cut("// EFPULL_START","// EFPULL_END")+"\n"+cut("// GETAHEAD_START","// GETAHEAD_END"),ctx);
  return {ctx,run:e=>vm.runInContext(e,ctx)};
}
console.log("⏩ what Get ahead offers");
{ ID=0;
  const done=card("lincoln","wednesday","10:00 AM",25,"none","singapore_l","Singapore — L2");
  const sgF=card("lincoln","friday","11:30 AM",25,"maybe","singapore_l","Singapore — L3"), sgF2=card("lincoln","friday","12:00 PM",25,"maybe","singapore_l","Singapore — L4");
  const mr=card("lincoln","thursday","2:00 PM",25,"maybe","mr_pages","MR5 — pp.288"), ws=card("lincoln","thursday","3:00 PM",25,"required","writeshop","WriteShop — 1b");
  const rsOpenToday=card("lincoln","wednesday","3:00 PM",25,"maybe","rs4k","RS4K — Ch2"), rsFri=card("lincoln","friday","1:00 PM",25,"maybe","rs4k","RS4K — Ch3");
  const drillFri=card("lincoln","friday","3:00 PM",13,"required","retrieval","Daily Drill"), nbFri=card("lincoln","friday","10:00 AM",5,"none","morning_nb","📖 Morning Notebook");
  const sentThu=card("lincoln","thursday","11:00 AM",25,"none","geo","Geography — Pg 7");
  const W=world({tasks:[done,sgF,sgF2,mr,ws,rsOpenToday,rsFri,drillFri,nbFri,sentThu],checked:{[done.id]:"x"},claimed:{[sentThu.id]:"x"},behind:{mr_pages:1,writeshop:3,singapore_l:0}});
  const L=W.run("gaCandidates('lincoln')"); const ids=L.map(x=>x.card.id);
  ok("each subject offers only its NEXT lesson (Singapore L3, not L4)",ids.indexOf(sgF.id)>=0&&ids.indexOf(sgF2.id)<0);
  ok("most behind first (WriteShop 3, MR5 1, Singapore 0)",ids[0]===ws.id&&ids[1]===mr.id&&ids[2]===sgF.id,L.map(x=>x.card.title));
  ok("a subject with open work TODAY isn't offered (RS4K)",ids.indexOf(rsFri.id)<0);
  ok("daily cards and notebooks are never offered",ids.indexOf(drillFri.id)<0&&ids.indexOf(nbFri.id)<0);
  ok("a lesson already sent to Mom isn't offered again",ids.indexOf(sentThu.id)<0);
  const h=W.run("gaRender('lincoln')");
  ok("the list says what it is and taps into the normal check (tapTask)",/⏩ Get ahead/.test(h)&&h.indexOf("tapTask('"+sgF.id+"')")>=0&&/\+50%/.test(h));
  const W2=world({tasks:[done,ws],checked:{[done.id]:"x"},momWith:"ellis",behind:{writeshop:3}});
  const h2=W2.run("gaRender('lincoln')");
  ok("a Mom-required lesson shows 'needs Mom' while Mom is with someone else (no button)",/needs Mom/.test(h2)&&h2.indexOf("tapTask('"+ws.id+"')")<0);
  const W3=world({tasks:[done,sgF],checked:{[done.id]:"x"},viewDay:"thursday"});
  ok("only on TODAY's view",W3.run("gaRender('lincoln')")==="");
}
console.log("🎉 the day's end");
ok("the day is done when every card is checked OR sent to Mom",/return ts\.length===0\?true:ts\.every\(t=>!!checked\[t\.id\]\|\|!!\(typeof claimed!=="undefined"&&claimed&&claimed\[t\.id\]\)\);/.test(src));
ok("sending the last card to Mom celebrates on the KID's screen (fire-once)",/gwShowToast\("Sent to Mom to check ✓"\);\n    \/\/ 🎉[^\n]*\n    try\{ if\(effectiveDay\(t\)===_todayDay&&rtSchoolworkDone\(t\.who,_todayDay\)\) setTimeout\(function\(\)\{ celebrateDayComplete\(t\.who,_todayDay\); \},600\);/.test(src));
ok("celebrateDayComplete is fire-once for that day (celeb_used)",/function celebrateDayComplete\(kid,d0\)\{\n  const d=d0\|\|day;\n  if\(hasCelebrated\(kid,d\)\) return;/.test(src));
ok("the end-of-day box shows 'Day done' while the rest waits for Mom — points only after her OK",/kidDayDone<kidDayTasks\.length && kidDayDone\+kidDaySent===kidDayTasks\.length/.test(src)&&/your points unlock once she does/.test(src));
ok("⏩ Get ahead shows only once the day is done",/if\(kidDayTasks\.length && kidDayDone\+kidDaySent===kidDayTasks\.length\) h\+=gaRender\(kid\);/.test(src));
ok("early finish feeds in ONLY work that fell off today",/\.filter\(function\(p\)\{ return \(p\.card\.rolledFrom===today\|\|p\.card\.cascadedFrom===today\); \}\)/.test(src));
console.log("⭐ the bonus");
ok("checked before its day → flagged gotAhead by the check-off heal (moves only when checked)",/if\(_ga\)\{ t\.gotAhead=t\.day; if\(hist\[id\]\) hist\[id\]\.gotAhead=t\.day; \}/.test(src)&&/_mu\[id\+"\/gotAhead"\]=t\.gotAhead/.test(src));
ok("the WHOLE amount — spin + half of it (20 → 30) — goes straight to the bank, not the day pool; no cap",/var _gaOn=!!\(_gaT&&_gaT\.gotAhead&&outcome\.pts>0\), _gaTot=_gaOn\?\(outcome\.pts\+Math\.round\(outcome\.pts\*0\.5\)\):0/.test(src)&&/_gaBid=bankDirect\(k,_gaTot,/.test(src)&&/if\(!_gaOn\) addKidPoints\(k,outcome\.pts,d\);/.test(src)&&!/gaCap|GA_CAP/.test(src));
{ const tot=p=>p+Math.round(p*0.5); ok("spin 20 → 30 banked; spin 25 → 38; spin 0 → nothing",tot(20)===30&&tot(25)===38); }
ok("Mom's reset-spin takes a got-ahead spin back out of the bank, not the pool",/if\(sr\[taskId\]\.gaBid&&typeof bankDirectRemove==="function"\)\{ try\{ bankDirectRemove\(kid,sr\[taskId\]\.gaBid\); \}catch\(e\)\{\} \}/.test(src));
ok("un-checking takes the bonus back",/if\(_sr&&_sr\.gaBid&&typeof bankDirectRemove==="function"\) bankDirectRemove\(_sr\.kid,_sr\.gaBid\);/.test(src));
console.log("↩ the school-end rule marks what fell off");
{ const a=src.indexOf("function seGuardWeek("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } }
  const G=new Function(src.slice(a,j+1)+"\nreturn seGuardWeek;")();
  const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
  const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
  const th=[card("lincoln","thursday","2:00 PM",120,"none","dailies"),card("lincoln","thursday","4:00 PM",25,"none","mr5")], fr=card("lincoln","friday","11:30 AM",25,"none","mr5");
  const T=th.concat([fr]);
  G(T,{days:["monday","tuesday","wednesday","thursday","friday"],todayDay:"wednesday",nowMin:540,checked:{},claimed:{},win:()=>({start:600,end:toMin("4:15 PM"),lunchStart:780,lunchEnd:840}),kidOff:()=>false,isClass:()=>false,isLesson:t=>t.subjectKey==="mr5",ahead:()=>0,toMin,fromMin});
  ok("a lesson rolled off Thursday carries rolledFrom:'thursday'",th[1].day==="friday"&&th[1].rolledFrom==="thursday",[th[1].day,th[1].rolledFrom]); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
