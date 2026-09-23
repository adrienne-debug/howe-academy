/*
 * 🎯 Priority, slice 2 (her yes 2026-09-23):
 *   · behind/ahead are measured against the CURRENT plan (planPace) — a rebuild makes it a normal week
 *   · the day order (re-lay/sweep AND a freshly generated day) puts a daily missed 2+ running, then the most-behind
 *     lessons, right after the morning notebook / first-of-day subjects; a hand-set Lesson-Map order still wins
 *   · C: room left on a LATER day → an extra sitting for the most-behind subject (cap, allowed days, Mom's time, lunch,
 *     closing last, day ends on time); never today once school has started
 *   run:  node test_priority_week.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const grab=name=>{ const a=src.indexOf("function "+name+"("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };

console.log("📈 planPace — against the CURRENT plan");
{ const env=`var currData, TODAY="2026-09-23", checked={};
    function cbTodayISO(){ return TODAY; } function planBacked(){ return true; } function lnOf(){ return null; }
    function cbDefaultForm(){ return {mode:"timesPerWeek",tpw:"5",allowedDays:["Mon","Tue","Wed","Thu","Fri"]}; }
    function smapIsKidOff(){ return false; } function schedOvKidOff(){ return false; } function schedOv(){ return {}; } function coopBlocksBase(){ return false; }
    function _cbParseDate(s){ return new Date(s+"T12:00:00"); }`;
  const P=new Function(env+grab("_cbSpread")+"\n"+grab("_pjWeekKey")+"\n"+grab("_pjPatternRows")+"\n"+"let _ppCache={key:'',at:0,map:{}};\n"+grab("planPace")+"\nreturn {planPace,set:(c)=>{ currData=c; _ppCache={key:'',at:0,map:{}}; }};")();
  const lessons={}; ["2026-09-21","2026-09-22","2026-09-23","2026-09-24","2026-09-25"].forEach((d,i)=>{ lessons[60+i]={date:d}; });
  const mk=(anchor,done,x)=>({subjects:{lincoln:{sk:Object.assign({planAnchor:anchor,lessonSeq:["a","b","c","d","e","f"]},x||{})}},lessons:{lincoln:lessons},done:{lincoln:{sk:done||{}}},lastEdit:Math.random()});
  P.set(mk("2026-09-23")); ok("rebuilt today → a normal week (behind 0, ahead 0)",JSON.stringify(P.planPace("lincoln","sk"))==='{"behind":0,"ahead":0,"score":0}');
  P.set(mk("2026-09-21",{L1:{day:"2026-09-21"}})); ok("rebuilt Monday, one of two past sittings done → 1 behind",P.planPace("lincoln","sk").behind===1);
  P.set(mk("2026-09-21",{L1:{day:"2026-09-21"},L2:{day:"2026-09-22"},L3:{day:"2026-09-23"},L4:{day:"2026-09-23"}})); ok("four done through today against three due → 1 ahead",P.planPace("lincoln","sk").ahead===1&&P.planPace("lincoln","sk").score===1);
  P.set(mk("2026-09-12",{},{paused:true})); ok("paused → never behind",P.planPace("lincoln","sk").behind===0);
  ok("_efBehind (Get ahead, early finish, the Mom block) now reads planPace",/function _efBehind\(kid,sk\)\{\n  try\{ return \(typeof planPace==="function"\)\?\(planPace\(kid,sk\)\.behind\|\|0\):0; \}/.test(src)); }

console.log("🎯 A — the day order");
ok("re-lay / sweep: most-needed first after morning / first-of-day; a hand-set Lesson-Map order still wins",/if\(r&&t\.subjectKey&&r\[t\.subjectKey\]!==undefined\) return r\[t\.subjectKey\];\n      const cw=cascadeWeight\(t,dn\);[\s\S]{0,300}if\(cw>=0&&cw<1000&&typeof prNeed==="function"\)\{ const n=prNeed\(t\); if\(n>0\) return -0\.5-n\/1e6; \}/.test(src));
ok("a freshly generated day: the same, inside the middle group only (first/last untouched)",/if\(e\.base===0&&_wr>=0&&_wr<1000&&typeof prNeed==="function"\)\{ var _n=prNeed\(/.test(src));
{ const rank=n=>n>0?(-0.5-n/1e6):null;
  ok("ranks: morning notebook (-1) < missed daily (-0.501…) < behind lesson (-0.5001…) < Workflow step 0",-1<rank(1007)&&rank(1007)<rank(104)&&rank(104)<0); }

console.log("🎯 C — extra sittings when there's room");
{ const X=new Function(grab("prExtraCore")+"\nreturn prExtraCore;")();
  let N=0; const c=(who,day,time,dur,sk,x)=>Object.assign({id:who+"_"+sk+"_"+(N++),who,day,time,dur,subjectKey:sk,title:sk,mom:"none"},x||{});
  const base=(x)=>Object.assign({days:["monday","tuesday","wednesday","thursday","friday"],todayDay:"wednesday",beforeSchool:false,nowMin:12*60,
    win:()=>({start:600,end:toMin("4:15 PM"),lunchStart:780,lunchEnd:840}),kidOff:()=>false,toMin,fromMin},x||{});
  const lessonsFor=(sk,n,start)=>Array.from({length:n},(_,i)=>({lid:"L"+(start+i),id:"lincoln_lincoln__"+sk+"_L"+(start+i),title:sk+" — L"+(start+i)}));
  // Thursday has room (day ends 2:30); Singapore is 2 behind, WriteShop 1 behind
  const T=[c("lincoln","wednesday","10:00 AM",60,"x"),c("lincoln","thursday","10:00 AM",120,"dailies"),c("lincoln","thursday","12:00 PM",25,"singapore"),c("lincoln","thursday","2:25 PM",5,"closing_nb",{title:"Closing Notebook"}),
    c("lincoln","friday","10:00 AM",360,"full"),c("lincoln","friday","4:05 PM",5,"closing_nb",{title:"Closing Notebook"})];
  const subs=()=>[{sk:"singapore",behind:2,cap:2,days:[],dur:25,mom:"maybe",next:lessonsFor("singapore",2,50)},{sk:"writeshop",behind:1,cap:1,days:["thursday","friday"],dur:25,mom:"required",next:lessonsFor("writeshop",1,7)}];
  const r=X(T,base({subjects:()=>subs()}));
  const thu=T.filter(t=>t.day==="thursday").sort((a,b)=>toMin(a.time)-toMin(b.time));
  ok("never today once school has started (nothing added on Wednesday)",!r.added.some(t=>t.day==="wednesday"));
  ok("Thursday's room gets the most-behind first: a second Singapore (its cap is 2)",r.added.some(t=>t.day==="thursday"&&t.subjectKey==="singapore"),r.added.map(t=>t.subjectKey+"@"+t.day+" "+t.time));
  ok("…then WriteShop (1 behind) — never over a subject's per-day cap",r.added.filter(t=>t.subjectKey==="singapore"&&t.day==="thursday").length===1&&r.added.some(t=>t.subjectKey==="writeshop"));
  ok("the day still ends by 4:15 and the Closing Notebook stays last",thu.every(t=>toMin(t.time)+t.dur<=toMin("4:15 PM"))&&thu[thu.length-1].subjectKey==="closing_nb",thu.map(t=>t.subjectKey+"@"+t.time));
  ok("nothing lands on lunch",r.added.every(t=>toMin(t.time)+t.dur<=780||toMin(t.time)>=840));
  ok("a full Friday gets nothing extra",!r.added.some(t=>t.day==="friday"));
  ok("each extra is a real lesson card (id = kid_plan_lid, lid, marked catchUp) written as ONE path",r.added.every(t=>t.lid&&/_L\d+$/.test(t.id)&&t.catchUp&&r.upd[t.id]===t));
  const r0=X([c("lincoln","thursday","10:00 AM",60,"x")],base({subjects:()=>subs().map(x=>Object.assign(x,{behind:0}))}));
  ok("nothing behind (a normal week after a rebuild) → nothing added",!r0.added.length);
  const ell=c("ellis","thursday","2:00 PM",30,"eMom",{mom:"required"});
  const T2=[c("lincoln","thursday","10:00 AM",240,"dailies"),ell];
  const r2=X(T2,base({subjects:()=>[{sk:"writeshop",behind:1,cap:1,days:[],dur:25,mom:"required",next:lessonsFor("writeshop",1,7)}]}));
  ok("a Mom-required extra never lands on another kid's Mom time",r2.added.every(t=>toMin(t.time)+25<=toMin(ell.time)||toMin(t.time)>=toMin(ell.time)+30),r2.added.map(t=>t.time));
  const r3=X([c("lincoln","wednesday","10:00 AM",60,"x")],base({beforeSchool:true,subjects:()=>subs()}));
  ok("before school starts, today counts as a day that can take an extra",r3.added.some(t=>t.day==="wednesday")); }
console.log("wiring");
ok("the sweep / Mom push (safeWriteTasks) adds extras, then seqFill keeps book order",/const _px=prExtraCore\(weekData\.tasks,prExtraCtx\(\)\); if\(_px\.added\.length\)\{[^\n]*seqFillNormalize\(weekData\.tasks,reason\+"\+catchup"\)/.test(src));
ok("Regenerate adds extras too, then seqFill",/const _px=prExtraCore\(d\.tasks,prExtraCtx\(\{checked:snapChecked\}\)\);[^\n]*seqFillNormalize\(d\.tasks,"regenerate\+catchup"\)/.test(src));
ok("only plan-backed lessons get extras — never paused subjects, classes or dailies",/if\(!s\|\|s\.paused\|\|!\(typeof planBacked==="function"&&planBacked\(kid,sk\)\)\) return;\n      if\(typeof fxIsClass==="function"&&fxIsClass\(s\)\) return;/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
