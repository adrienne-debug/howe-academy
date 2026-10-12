/*
 * 🗓 WEEKEND — the catch-up pass deals nothing into a week that is already over (her yes 2026-10-11).
 * Live Sat 2026-10-10 8:00 PM (week26, Mon 10/5–Fri 10/9): the cascade's catch-up logged "+16 extra sitting(s) —
 * lincoln aas monday, lincoln grammar… monday, lincoln mr_pages wednesday, …" and +7 more at 11:07 PM. "saturday" is
 * not one of the week's days, so DAYS.indexOf gave -1 and the pass started from MONDAY — past days. Each landed as a
 * "⚠ out of sequence — … (mon 3:49 PM, open) sits before … (tue, ✓ checked)" line, then was parked in the box (35 box
 * cards by Sunday). A Sunday regenerate of the COMING week is not over and still deals from Monday, exactly as before.
 *   run:  node test_catchup_weekend.js            (HA_SRC=path/to/index.html to test another build)
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(process.env.HA_SRC||path.join(__dirname,"index.html"),"utf8");
const grab=name=>{ const a=src.indexOf("function "+name+"("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const X=new Function(grab("prExtraCore")+"\nreturn prExtraCore;")();
let N=0; const c=(who,day,time,dur,sk,x)=>Object.assign({id:who+"_"+sk+"_"+(N++),who,day,time,dur,subjectKey:sk,title:sk,mom:"none"},x||{});
const base=(x)=>Object.assign({days:["monday","tuesday","wednesday","thursday","friday"],todayDay:"wednesday",beforeSchool:false,nowMin:20*60,checked:{},
  win:()=>({start:600,end:toMin("4:15 PM"),lunchStart:780,lunchEnd:840}),kidOff:()=>false,toMin,fromMin},x||{});
// Lincoln's grammar as planPace saw it Saturday evening: 1 behind, next lesson L0005, Mon/Wed/Fri, cap 1
const lessons=(n,start)=>Array.from({length:n},(_,i)=>({lid:"L000"+(start+i),id:"lincoln_lincoln__grammar_L000"+(start+i),title:"Grammar — Lesson "+(start+i)}));
const gram=(behind)=>[{sk:"grammar",behind:behind==null?1:behind,cap:1,days:["monday","wednesday","friday"],dur:25,mom:"none",next:lessons(4,5)}];
// every weekday has room before 4:15 (dailies end 3:00 PM)
const week=()=>["monday","tuesday","wednesday","thursday","friday"].map(d=>c("lincoln",d,"10:00 AM",300,"dailies"))
  .concat([c("lincoln","tuesday","3:05 PM",25,"grammar"),c("lincoln","friday","4:05 PM",5,"closing_nb",{title:"Closing Notebook"})]);

console.log("🗓 Saturday evening, the week is over");
{ const T=week(); const n0=T.length;
  const r=X(T,base({todayDay:"saturday",weekOver:true,subjects:()=>gram()}));
  ok("nothing is dealt into a finished week",r.added.length===0,r.added.map(t=>t.day+" "+t.lid));
  ok("no card was pushed onto a past day",T.length===n0);
  const r3=X(week(),base({todayDay:"saturday",weekOver:true,subjects:()=>gram(3)}));
  ok("…even 3 behind",r3.added.length===0,r3.added.map(t=>t.day+" "+t.lid)); }

console.log("🗓 Sunday night, the COMING week was just generated — not over");
{ const T=week();
  const r=X(T,base({todayDay:"sunday",weekOver:false,subjects:()=>gram()}));
  ok("one extra is dealt, starting from Monday",r.added.length===1&&r.added[0].day==="monday"&&r.added[0].lid==="L0005",r.added.map(t=>t.day+" "+t.lid)); }

console.log("🗓 mid-week is untouched");
{ const T=week();
  const r=X(T,base({todayDay:"wednesday",weekOver:false,subjects:()=>gram()}));
  ok("Wednesday evening → the extra lands on a later allowed day (Friday)",r.added.length===1&&r.added[0].day==="friday",r.added.map(t=>t.day+" "+t.lid));
  const r2=X(week(),base({todayDay:"wednesday",subjects:()=>gram()}));
  ok("a caller that never sets weekOver behaves exactly as before",r2.added.length===1&&r2.added[0].day==="friday",r2.added.map(t=>t.day+" "+t.lid)); }

console.log("🗓 the app wires it up");
{ const ctx=grab("prExtraCtx"), guard=grab("seGuardCtx");
  ok("seGuardCtx hands out dayISO",/dayISO:iso/.test(guard));
  ok("prExtraCtx computes weekOver from the week's last school day vs today",/weekOver=!!\(_li&&_li<_t\)/.test(ctx)&&/base\.days\[base\.days\.length-1\]/.test(ctx));
  ok("…and passes it to the core",/weekOver:weekOver/.test(ctx));
  ok("prExtraCore honors it before picking a first day",/if\(o\.weekOver\) return out;\s*\n\s*const firstDi=/.test(grab("prExtraCore"))); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
