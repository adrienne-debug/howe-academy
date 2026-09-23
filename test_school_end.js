/*
 * ⏰ School day end respected + no stacked cards (her rules 2026-09-23). seGuardWeek is pure: pulled from index.html.
 *   · a fine day is left alone · stacked cards re-lay in order · nothing ends past the day's end
 *   · the lesson furthest ahead of pace gives way and rolls IN SEQUENCE (next sitting; last one deferred to next week)
 *   · daily cards never leave their day · checked / started / fixed-time classes never move · lunch stepped over
 *   · a Mom-required card never overlaps another kid's Mom-required card · kid-off days untouched
 *   run:  node test_school_end.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("function seGuardWeek("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } }
const G=new Function(src.slice(a,j+1)+"\nreturn seGuardWeek;")();
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const DAYS=["monday","tuesday","wednesday","thursday","friday"];
const LESSON={singapore:1,eic:1,mr5:1,rs4k:1,aas:1,wr:1};
const ctx=(x)=>Object.assign({days:DAYS,todayDay:"wednesday",nowMin:9*60,checked:{},claimed:{},
  win:()=>({start:600,end:toMin("4:15 PM"),lunchStart:780,lunchEnd:840}),kidOff:()=>false,isClass:t=>!!t.cls,
  isLesson:t=>!!LESSON[t.subjectKey],ahead:(k,sk)=>({singapore:0,eic:3,mr5:-2,rs4k:1}[sk]||0),toMin,fromMin},x||{});
let N=0; const c=(who,day,time,dur,sk,x)=>Object.assign({id:who+"_"+sk+"_"+(N++),who,day,time,dur,subjectKey:sk,title:sk,mom:"none"},x||{});
const end=t=>toMin(t.time)+(t.dur||20);
const noStack=(tasks,who,day)=>{ const L=tasks.filter(t=>t.who===who&&t.day===day).sort((x,y)=>toMin(x.time)-toMin(y.time)); for(let k=1;k<L.length;k++) if(toMin(L[k].time)<end(L[k-1])) return false; return true; };

console.log("a fine day is left alone");
{ const T=[c("lincoln","thursday","2:00 PM",25,"rs4k"),c("lincoln","thursday","2:25 PM",5,"flash"),c("lincoln","thursday","4:05 PM",5,"closing_nb",{title:"Closing Notebook"})];
  const r=G(T,ctx()); ok("no writes",!Object.keys(r.upd).length,r.upd); }

console.log("stacked cards with room → re-laid in order, nothing rolls");
{ const a1=c("ellis","friday","3:00 PM",15,"wr",{mom:"required"}), a2=c("ellis","friday","3:02 PM",25,"aas",{mom:"required"}), a3=c("ellis","friday","3:15 PM",10,"match",{mom:"required"});
  const T=[c("ellis","friday","10:00 AM",5,"morning_nb"),a1,a2,a3]; const r=G(T,ctx());
  ok("no overlap left",noStack(T,"ellis","friday"),T.map(t=>t.time)); ok("order kept (Word Roots, AAS, Match)",toMin(a1.time)<toMin(a2.time)&&toMin(a2.time)<toMin(a3.time));
  ok("nothing rolled or deferred",!r.rolled.length&&!r.deferred.length); ok("all inside the day",T.every(t=>end(t)<=toMin("4:15 PM"))); }

console.log("Lincoln's Thursday (co-op until 2:00) — the live shape");
{ const th=[["2:00 PM",25,"rs4k"],["2:25 PM",5,"morning_nb"],["2:30 PM",25,"eggspress"],["2:55 PM",25,"german_flash"],["3:20 PM",5,"sci_flash"],["3:25 PM",20,"ind_read"],
    ["3:45 PM",5,"daily_flash"],["3:50 PM",5,"daily_mix"],["3:55 PM",10,"match",{mom:"required"}],["4:10 PM",15,"eic"],["4:10 PM",25,"singapore"],["5:20 PM",25,"mr5"],["6:43 PM",13,"drill",{mom:"required"}],["6:56 PM",5,"closing_nb",{title:"Closing Notebook"}]]
    .map(x=>c("lincoln","thursday",x[0],x[1],x[2],x[3]));
  const fri=["eic","singapore","mr5","rs4k"].map((sk,k)=>c("lincoln","friday",fromMin(toMin("11:30 AM")+k*25),25,sk));
  const T=th.concat(fri); const before=JSON.parse(JSON.stringify(T));
  const r=G(T,ctx());
  const thu=T.filter(t=>t.day==="thursday");
  ok("Thursday ends by 4:15",thu.every(t=>end(t)<=toMin("4:15 PM")),thu.map(t=>t.subjectKey+"@"+t.time));
  ok("no stacked cards on Thursday or Friday",noStack(T,"lincoln","thursday")&&noStack(T,"lincoln","friday"));
  ok("every DAILY card is still on Thursday",["morning_nb","eggspress","german_flash","sci_flash","ind_read","daily_flash","daily_mix","match","drill","closing_nb"].every(sk=>thu.some(t=>t.subjectKey===sk)),thu.map(t=>t.subjectKey));
  ok("the Closing Notebook is the last card of the day",thu.every(t=>t.subjectKey==="closing_nb"||toMin(t.time)<toMin(thu.find(x=>x.subjectKey==="closing_nb").time)));
  // 208 min of work in 135: after the dailies (118) only one short lesson fits. Rolled, furthest ahead first but only a
  // roll that frees room counts; Editor in Chief (15 min) is the one that FITS, so it stays.
  ok("the lessons that fit stay (Editor in Chief, 15 min), the rest rolled",thu.some(t=>t.subjectKey==="eic")&&!thu.some(t=>["rs4k","singapore","mr5"].includes(t.subjectKey)),thu.map(t=>t.subjectKey));
  ok("each rolled lesson moved IN SEQUENCE: Thursday's card took its subject's Friday slot, Friday's waits for next week",
    ["rs4k","singapore","mr5"].every(sk=>{ const ids=before.filter(t=>t.subjectKey===sk).map(t=>t.id); const fr=before.find(t=>t.id===ids[1]);
      const nowThu=T.find(t=>t.id===ids[0]); return nowThu&&nowThu.day==="friday"&&nowThu.time===fr.time&&!T.some(t=>t.id===ids[1])&&r.deferred.indexOf(ids[1])>=0; }));
  ok("deferred cards are ONE null write each (targeted)",r.deferred.every(id=>r.upd[id]===null&&!Object.keys(r.upd).some(p=>p.indexOf(id+"/")===0)));
  ok("rolled lessons keep book order within each subject",["eic","singapore","mr5","rs4k"].every(sk=>{ const L=T.filter(t=>t.subjectKey===sk).sort((x,y)=>(DAYS.indexOf(x.day)-DAYS.indexOf(y.day))||(toMin(x.time)-toMin(y.time))); const ids=before.filter(t=>t.subjectKey===sk).map(t=>t.id); const order=L.map(t=>ids.indexOf(t.id)); return order.every((v,k)=>k===0||v>order[k-1]); }));
  const r2=G(T,ctx()); ok("running it again changes nothing (stable)",!Object.keys(r2.upd).length,r2.upd); }

console.log("the roll that actually fixes the day (live Friday 9/23)");
{ // morning lessons are furthest ahead, but the overflow is AFTER lunch (a Mom card waits for another kid's Mom card)
  // the morning is full to lunch, and its lessons are short — rolling one frees a gap too small for any afternoon card
  const am=[["10:00 AM",60,"daily_a"],["11:00 AM",15,"rs4k"],["11:15 AM",15,"mr5"],["11:30 AM",15,"singapore"],["11:45 AM",75,"daily_b"]].map(x=>c("lincoln","friday",x[0],x[1],x[2]));
  // afternoon: two Mom lessons, an hour of dailies, then a Mom daily that must wait for Ellis's Mom drill (3:55–4:15)
  const pm=[["2:00 PM",25,"aas",{mom:"required"}],["2:25 PM",25,"wr",{mom:"required"}],["2:50 PM",60,"daily_c"],["3:50 PM",20,"daily_d",{mom:"required"}],["4:20 PM",5,"closing_nb",{title:"Closing Notebook"}]].map(x=>c("lincoln","friday",x[0],x[1],x[2],x[3]));
  const ellisDrill=c("ellis","friday","3:55 PM",20,"drill",{mom:"required"});
  const T=am.concat(pm,[ellisDrill]);
  const r=G(T,ctx({ahead:(k,sk)=>({rs4k:3,mr5:2,singapore:1,aas:0,wr:-1}[sk]||0)}));
  ok("only ONE lesson waits for next week, not three",r.deferred.length===1,r.deferred);
  ok("it is an afternoon lesson (the morning ones free nothing after lunch)",["aas","wr"].includes((am.concat(pm).find(t=>t.id===r.deferred[0])||{}).subjectKey));
  ok("the day ends by 4:15 with no Mom card on top of Ellis's",T.filter(t=>t.who==="lincoln").every(t=>end(t)<=toMin("4:15 PM"))&&T.filter(t=>t.who==="lincoln"&&t.mom==="required").every(t=>end(t)<=toMin(ellisDrill.time)||toMin(t.time)>=end(ellisDrill))); }

console.log("never moves what must not move");
{ const done=c("lincoln","friday","3:30 PM",25,"singapore"), cls=c("lincoln","friday","10:00 AM",45,"german",{cls:true}), st=c("lincoln","wednesday","8:30 AM",25,"mr5");
  const T=[cls,done,c("lincoln","friday","3:40 PM",40,"rs4k"),c("lincoln","friday","3:45 PM",30,"eic"),st];
  const r=G(T,ctx({checked:{[done.id]:"x"},todayDay:"wednesday",nowMin:9*60}));
  ok("a checked card keeps its time",done.time==="3:30 PM"); ok("a fixed-time class keeps its time",cls.time==="10:00 AM");
  const r3=G([st,c("lincoln","wednesday","8:40 AM",25,"eic")],ctx({todayDay:"wednesday",nowMin:9*60}));
  ok("a card already started today keeps its time",st.time==="8:30 AM"); }

console.log("Mom, lunch, days off");
{ const lm=c("lucy","friday","11:00 AM",20,"loe",{mom:"required"});
  const e1=c("ellis","friday","10:50 AM",20,"wr",{mom:"required"}), e2=c("ellis","friday","10:55 AM",20,"aas",{mom:"required"});
  const T=[lm,e1,e2]; G(T,ctx());
  ok("Ellis's Mom cards step over Lucy's Mom card (no double-booked Mom)",[e1,e2].every(t=>end(t)<=toMin(lm.time)||toMin(t.time)>=end(lm)),T.map(t=>t.who+" "+t.time));
  const x1=c("ellis","friday","12:50 PM",20,"wr"), x2=c("ellis","friday","12:55 PM",20,"aas"); const T2=[x1,x2]; G(T2,ctx());
  ok("nothing lands on lunch (1–2)",T2.every(t=>end(t)<=780||toMin(t.time)>=840),T2.map(t=>t.time));
  const o1=c("ellis","friday","3:00 PM",25,"wr"), o2=c("ellis","friday","3:01 PM",25,"aas"); const T3=[o1,o2];
  const r=G(T3,ctx({kidOff:(k,d)=>k==="ellis"&&d==="friday"})); ok("a kid's day off is left alone",!Object.keys(r.upd).length); }

console.log("dailies only");
{ const T=["a","b","c","d","e","f","g","h","i","j","k","l"].map((sk,k)=>c("julian","friday",fromMin(toMin("3:00 PM")+k*10),10,"daily_"+sk));
  const r=G(T,ctx()); ok("no lesson to roll → nothing is removed (a daily never leaves its day)",!r.deferred.length&&!r.rolled.length&&T.length===12);
  ok("…and the day is reported, not hidden",r.stuck.indexOf("julian|friday")>=0); }

console.log("wiring");
ok("safeWriteTasks runs it (cascade + Mom push)",/const _se=seGuardWeek\(weekData\.tasks,seGuardCtx\(\)\)/.test(src));
ok("Regenerate runs it before the week is written",/const _se=seGuardWeek\(d\.tasks,seGuardCtx\(\{checked:snapChecked\}\)\)/.test(src));
ok("the re-lay runs it for that kid and merges into its ONE targeted update",/seGuardWeek\(r\.tasksAfter,seGuardCtx\(\{kids:\[kid\],checked:checked\|\|\{\}\}\)\)/.test(src));
ok("pace: furthest ahead is measured against the CURRENT plan (planPace score; a rebuild = normal week)",/ahead:\(kid,sk\)=>\{ try\{ return \(typeof planPace==="function"\)\?\(planPace\(kid,sk\)\.score\|\|0\):0; \}catch\(e\)\{ return 0; \} \}/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
