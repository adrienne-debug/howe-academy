/*
 * ⏰ DAYDROP — a daily that doesn't fit before school end drops for that day, never runs past the end
 * (her rule 2026-10-08). Replay of the live incident: DeWalt co-op Thursday (timed co-op 9:45–2:00, school end 4:00),
 * a regenerate laid Makenzie's Reading 4:15–4:45 — log "daily-only overflow makenzie|thursday".
 *   · future day / today before school: the latest daily past the end is removed (targeted null write), the rest fit
 *   · notebooks never drop · Closing Notebook stays last · lessons still roll first · today's running day is unchanged
 *   run:  node test_daily_drop.js
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
const LESSON={singapore:1};
const END=toMin("4:00 PM");
const ctx=x=>Object.assign({days:DAYS,todayDay:"monday",nowMin:8*60,checked:{},claimed:{},
  win:()=>({start:toMin("9:00 AM"),end:END,lunchStart:toMin("12:00 PM"),lunchEnd:toMin("12:30 PM")}),kidOff:()=>false,
  isClass:t=>!!t.cls,isLesson:t=>!!LESSON[t.subjectKey],ahead:()=>0,toMin,fromMin},x||{});
let N=0; const c=(who,day,time,dur,sk,x)=>Object.assign({id:who+"_"+sk+"_"+(N++),who,day,time,dur,subjectKey:sk,title:sk,mom:"none"},x||{});
const end=t=>toMin(t.time)+(t.dur||20);
const thursday=()=>{ const coop=c("makenzie","thursday","9:45 AM",255,"coop",{cls:true,title:"DeWalt Co-op"});
  const nb=c("makenzie","thursday","2:00 PM",10,"morning_nb",{title:"📖 Morning Notebook"}),
    m=c("makenzie","thursday","2:10 PM",45,"math_daily"), sp=c("makenzie","thursday","2:55 PM",30,"spelling_daily"),
    w=c("makenzie","thursday","3:25 PM",30,"writing_daily"), rd=c("makenzie","thursday","3:55 PM",30,"reading",{title:"Reading"}),
    cl=c("makenzie","thursday","4:25 PM",5,"closing_nb",{title:"Closing Notebook"});
  return {coop,nb,m,sp,w,rd,cl,T:[coop,nb,m,sp,w,rd,cl]}; };

console.log("live replay: DeWalt co-op Thursday, school end 4:00 (regenerate on Monday)");
{ const X=thursday(); const r=G(X.T,ctx());
  ok("no card of Makenzie's ends past 4:00",X.T.filter(t=>t.who==="makenzie"&&!t.cls).every(t=>end(t)<=END),X.T.map(t=>t.subjectKey+" "+t.time));
  ok("Reading (laid last) drops for the day — not 4:15–4:45",r.dropped.indexOf(X.rd.id)>=0&&X.T.indexOf(X.rd)<0,r.dropped);
  ok("…as a targeted removal of that one card",r.upd[X.rd.id]===null&&!Object.keys(r.upd).some(p=>p.indexOf(X.rd.id+"/")===0),r.upd);
  ok("only what's needed drops (math, spelling, writing stay)",r.dropped.length===1&&[X.m,X.sp,X.w].every(t=>X.T.indexOf(t)>=0),r.dropped);
  ok("notebooks never drop; Closing Notebook stays last",X.T.indexOf(X.nb)>=0&&X.T.indexOf(X.cl)>=0&&X.T.filter(t=>!t.cls&&t!==X.cl).every(t=>toMin(t.time)<toMin(X.cl.time)),X.cl.time);
  ok("the co-op never moves",X.coop.time==="9:45 AM");
  ok("not reported as overflow any more",r.stuck.indexOf("makenzie|thursday")<0,r.stuck);
  ok("nothing rolled or deferred (there are no lessons)",!r.rolled.length&&!r.deferred.length); }

console.log("today before school counts as not started");
{ const X=thursday(); const r=G(X.T,ctx({todayDay:"thursday",nowMin:toMin("8:30 AM")}));
  ok("Reading drops on the morning of",r.dropped.indexOf(X.rd.id)>=0&&X.T.filter(t=>!t.cls).every(t=>end(t)<=END),r.dropped); }

console.log("today's running day is unchanged (living day keeps its 'didn't fit' list)");
{ const X=thursday(); const r=G(X.T,ctx({todayDay:"thursday",nowMin:toMin("1:59 PM")}));
  ok("nothing dropped mid-day",!r.dropped.length&&X.T.length===7,r.dropped);
  ok("…still reported as overflow",r.stuck.indexOf("makenzie|thursday")>=0,r.stuck); }

console.log("lessons still roll first; checked cards never drop");
{ const X=thursday(); const sg=c("makenzie","thursday","3:55 PM",30,"singapore"); const sg2=c("makenzie","friday","10:00 AM",30,"singapore");
  X.T.splice(X.T.indexOf(X.rd),1,sg); X.T.push(sg2); const r=G(X.T,ctx());
  ok("a lesson in the way rolls (in sequence) instead of a daily dropping",r.rolled.indexOf(sg.id)>=0&&!r.dropped.length,[r.rolled,r.dropped]); }
{ const X=thursday(); const r=G(X.T,ctx({checked:{[X.rd.id]:true}}));
  ok("a checked Reading never drops",X.T.indexOf(X.rd)>=0&&r.dropped.indexOf(X.rd.id)<0,r.dropped); }

console.log("a day that fits is left alone");
{ const X=thursday(); X.T.splice(X.T.indexOf(X.rd),1); X.cl.time="3:55 PM"; const r=G(X.T,ctx());
  ok("no writes, nothing dropped",!Object.keys(r.upd).length&&!r.dropped.length,r.upd); }

console.log("wiring");
ok("marked block lives inside the school-end guard",src.indexOf("// DAYDROP_START")>src.indexOf("// SCHOOLEND_START")&&src.indexOf("// DAYDROP_END")<src.indexOf("// SCHOOLEND_END"));
ok("Regenerate saves and logs drops",/_se\.deferred\.length\|\|_se\.dropped\.length\)\{ sv\(WK\+"_tasks",d\.tasks\)/.test(src));
ok("safeWriteTasks logs drops",/_se\.deferred\.length\|\|_se\.dropped\.length\) dbg\("⏰ school end \("\+reason/.test(src));
ok("the re-lay counts drops as removed",/r\.summary\.removed\.concat\(_se\.deferred,_se\.dropped\|\|\[\]\)/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
