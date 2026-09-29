/*
 * 🔁 Catch-up extras must not loop with the cascade (live 2026-09-28 20:53–20:54: ten cascade passes, one more Ellis
 * Mathematical Reasoning card each — 202 → 221 cards. planPace.behind stays 1 until a done lands; the cascade parked
 * each extra as _eowOverflow; prExtraCore's day count skipped parked cards, so Friday looked empty every pass).
 *   · an extra already dealt (and still undone) counts against "behind"
 *   · a subject holding a parked (_eowOverflow) card has no room — nothing more is dealt
 *   · a parked card still holds its day's slot for the per-day cap
 *   run:  node test_catchup_loop.js            (HA_SRC=path/to/index.html to test another build)
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
const base=(x)=>Object.assign({days:["monday","tuesday","wednesday","thursday","friday"],todayDay:"monday",beforeSchool:false,nowMin:20*60+53,checked:{},
  win:()=>({start:600,end:toMin("4:15 PM"),lunchStart:780,lunchEnd:840}),kidOff:()=>false,toMin,fromMin},x||{});
// Ellis MR as planPace sees it all evening: 1 behind, next lessons in book order, Mon/Tue/Fri, cap 1
const lessonsFor=(n,start)=>Array.from({length:n},(_,i)=>({lid:"L0"+(start+i),id:"ellis_ellis__mathematical_reasoning_L0"+(start+i),title:"Mathematical Reasoning — pp. "+(start+i)}));
const mr=(behind)=>[{sk:"mathematical_reasoning",behind:behind==null?1:behind,cap:1,days:["monday","tuesday","friday"],dur:25,mom:"maybe",next:lessonsFor(12,353)}];
const week=()=>[c("ellis","monday","10:00 AM",300,"dailies"),c("ellis","tuesday","10:00 AM",300,"dailies"),c("ellis","tuesday","3:40 PM",25,"mathematical_reasoning"),
  c("ellis","wednesday","10:00 AM",300,"dailies"),c("ellis","thursday","10:00 AM",300,"dailies"),
  c("ellis","friday","10:00 AM",240,"dailies"),c("ellis","friday","2:40 PM",25,"aas"),c("ellis","friday","4:05 PM",5,"closing_nb",{title:"Closing Notebook"})];

console.log("🔁 the live loop, replayed");
{ const T=week();
  const r1=X(T,base({subjects:()=>mr()}));
  ok("pass 1: Friday has room → one MR extra (pp. 353) at 3:05 PM",r1.added.length===1&&r1.added[0].day==="friday"&&r1.added[0].time==="3:05 PM"&&r1.added[0].lid==="L0353",r1.added.map(t=>t.day+" "+t.time+" "+t.lid));
  // the cascade cannot place it under the subject's carry-over ceiling → parks it
  r1.added[0]._eowOverflow=true;
  const r2=X(T,base({subjects:()=>mr()}));
  ok("pass 2 (extra parked as overflow, plan still says 1 behind): nothing more is dealt",r2.added.length===0,r2.added.map(t=>t.lid));
  const r3=X(T,base({subjects:()=>mr()}));
  ok("pass 3: still nothing — the loop is broken",r3.added.length===0);
  ok("the week holds exactly one MR extra, not ten",T.filter(t=>t.subjectKey==="mathematical_reasoning"&&t.catchUp).length===1); }

console.log("🔁 an extra already dealt counts against behind");
{ const T=week();
  const r1=X(T,base({subjects:()=>mr()}));
  ok("pass 1 deals one extra",r1.added.length===1);
  const r2=X(T,base({subjects:()=>mr()}));
  ok("pass 2, extra still open on Friday, plan still 1 behind → nothing (Friday is at cap AND the dealt extra covers the debt)",r2.added.length===0,r2.added.map(t=>t.day+" "+t.lid));
  const r3=X(T,base({subjects:()=>mr(2)}));
  ok("2 behind with one open extra dealt → exactly one more, on another allowed day (Tuesday, cap 1 there is already taken → none) or none",r3.added.length<=1&&r3.added.every(t=>t.day!=="friday"),r3.added.map(t=>t.day+" "+t.lid));
  const T2=week(); const r4=X(T2,base({subjects:()=>mr()})); const done={}; done[r4.added[0].id]="3:30 PM Sep 28";
  const r5=X(T2,base({checked:done,subjects:()=>mr()}));
  ok("a CHECKED extra no longer covers the debt (planPace will have counted it) — Friday at cap, so still nothing on Friday",r5.added.every(t=>t.day!=="friday")); }

console.log("🔁 a parked card holds its slot");
{ const T=week(); T.push(c("ellis","friday","3:05 PM",25,"mathematical_reasoning",{_eowOverflow:true}));
  const r=X(T,base({subjects:()=>mr(3)}));
  ok("subject with a parked card → no extras anywhere (no room proven)",r.added.length===0,r.added.map(t=>t.day+" "+t.lid)); }

console.log("🔁 the real week25 snapshot (2026-09-28 21:10, 221 cards)");
{ const p=path.join(__dirname,"test_fixtures","week25_tasks_2026-09-28_loop.json");
  if(fs.existsSync(p)){
    const obj=JSON.parse(fs.readFileSync(p,"utf8")); const T=Object.keys(obj).map(k=>obj[k]);
    const before=T.length;
    const r=X(T,base({subjects:kid=>kid==="ellis"?[{sk:"mathematical_reasoning",behind:1,cap:1,days:["monday","tuesday","friday"],dur:25,mom:"maybe",next:lessonsFor(5,363)}]:[]}));
    ok("Ellis MR (10 parked + 3 open extras already) gets nothing more",r.added.length===0&&T.length===before,r.added.map(t=>t.day+" "+t.lid));
  } else ok("fixture present (test_fixtures/week25_tasks_2026-09-28_loop.json)",false); }

console.log("wiring");
ok("prExtraCore subtracts undone catchUp cards and skips a subject with a parked card",/const dealt=mine\.filter\(t=>t\.catchUp&&!ck\[t\.id\]\)\.length, parked=mine\.some\(t=>!!t\._eowOverflow\);/.test(src));
ok("the per-day count no longer skips parked cards",/const count=tasks\.filter\(t=>t&&t\.who===kid&&t\.day===day&&t\.subjectKey===x\.sk&&!String\(t\.id\|\|""\)\.endsWith\("_c"\)/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
