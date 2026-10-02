// 💻 Device lanes in the day's re-lay (her ask 2026-10-01): a computer / tablet card steps over OTHER kids' cards on the
// same device up to the family's count (Settings ▸ Device Rules). Lunch, Mom-time and the fine-day rule stay as they were.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
const a=src.indexOf("function seGuardWeek("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } }
const G=new Function("tasks","o",src.slice(i+1,j));
const toMin=s=>{ const m=/(\d+):(\d+) (AM|PM)/.exec(s||""); if(!m) return null; let h=+m[1]%12; if(m[3]==="PM") h+=12; return h*60+ +m[2]; };
const fromMin=m=>{ const h=Math.floor(m/60), mm=m%60, ap=h>=12?"PM":"AM"; return ((h%12)||12)+":"+String(mm).padStart(2,"0")+" "+ap; };
const DAYS=["monday","tuesday","wednesday","thursday","friday"];
const lane=t=>t.device==="computer"?"computer":(t.device==="ipad"||t.device==="phone")?"screen":null;
const ctx=(x)=>Object.assign({days:DAYS,todayDay:"tuesday",nowMin:8*60+30,checked:{},claimed:{},win:()=>({start:540,end:toMin("3:00 PM"),lunchStart:720,lunchEnd:765}),
  kidOff:()=>false,isClass:()=>false,isLesson:()=>true,ahead:()=>0,lane,laneCap:l=>l==="computer"?1:2,toMin,fromMin},x||{});
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const T=(id,who,time,dur,device,extra)=>Object.assign({id,who,day:"tuesday",time,dur,device:device||"paper",subjectKey:id,title:id},extra||{});
const timeOf=(tasks,r,id)=>{ const u=r.upd[id]; return u&&u.time?u.time:tasks.find(t=>t.id===id).time; };
{ const tasks=[T("a_pc","andrew","9:00 AM",20,"computer"),T("c_pc","caleb","9:00 AM",15,"computer")];
  const r=G(tasks,ctx()); const ta=toMin(timeOf(tasks,r,"a_pc")), tc=toMin(timeOf(tasks,r,"c_pc")); const overlap=ta<tc+15&&tc<ta+20;
  ok("one computer: the two cards no longer overlap and exactly one moved", !overlap&&r.retimed.length===1); }
{ const tasks=[T("a_pc","andrew","9:00 AM",20,"computer"),T("c_pc","caleb","9:00 AM",15,"computer")];
  const r=G(tasks,ctx({laneCap:()=>2})); ok("two computers: both stay at 9:00", timeOf(tasks,r,"a_pc")==="9:00 AM"&&timeOf(tasks,r,"c_pc")==="9:00 AM"&&!r.retimed.length); }
{ const tasks=[T("a","andrew","9:00 AM",20,"ipad"),T("c","caleb","9:00 AM",20,"ipad"),T("m","makenzie","9:00 AM",20,"ipad")];
  const r=G(tasks,ctx()); const times=["a","c","m"].map(k=>timeOf(tasks,r,k)); ok("two tablets, three cards: exactly one moves to 9:20", times.filter(x=>x==="9:20 AM").length===1&&times.filter(x=>x==="9:00 AM").length===2); }
{ const tasks=[T("a_pc","andrew","11:45 AM",20,"computer"),T("c_pc","caleb","11:50 AM",20,"computer")];
  const r=G(tasks,ctx()); const moved=r.retimed[0]; const tmv=toMin(timeOf(tasks,r,moved)); ok("stepping over a computer card never lands in lunch (12:00–12:45)", r.retimed.length===1&&(tmv>=765||tmv+20<=720)); }
{ const tasks=[T("a_p","andrew","9:00 AM",20),T("c_p","caleb","9:00 AM",20),T("a_pc","andrew","9:20 AM",20,"computer"),T("c_pc","caleb","9:40 AM",20,"computer")];
  const r=G(tasks,ctx()); ok("a fine day (paper cards at the same time, computer cards already apart) is left alone", !r.retimed.length&&!r.rolled.length); }
{ const tasks=[T("t_m","taylor","9:00 AM",25,"paper",{mom:"required"}),T("c_pc","caleb","9:00 AM",15,"computer"),T("c_m","caleb","9:20 AM",20,"paper",{mom:"required"}),T("a_pc","andrew","9:00 AM",20,"computer")];
  const r=G(tasks,ctx()); const cm=toMin(timeOf(tasks,r,"c_m")); ok("a kid re-laid for a device clash still steps his Mom card over another kid's Mom time", cm>=toMin("9:25 AM")); }
{ const tasks=[T("a_pc","andrew","9:00 AM",20,"computer"),T("c_pc","caleb","9:00 AM",15,"computer")];
  const r=G(tasks,ctx({checked:{a_pc:"x"}})); ok("a finished card no longer holds the device", timeOf(tasks,r,"c_pc")==="9:00 AM"); }
ok("ctx builder hands the guard the lane helpers", /lane:t=>\{ try\{ const l=\(typeof _efLane==="function"\)\?_efLane\(t\):null;/.test(src)&&/laneCap:l=>/.test(src));
// ── display pass (dsRetime): today only, lane clashes only, never a roll ──
{ const tasks=[T("a_pc","andrew","10:45 AM",20,"computer"),T("c_pc","caleb","10:45 AM",15,"computer")];
  const r=G(tasks,ctx({displayOnly:true,nowMin:10*60+44})); const ta=toMin(timeOf(tasks,r,"a_pc")), tc=toMin(timeOf(tasks,r,"c_pc"));
  ok("display pass: a shifted day with two kids on one computer at the same time steps one over", r.retimed.length===1&&!(ta<tc+15&&tc<ta+20)); }
{ const tasks=[T("t1","taylor","2:30 PM",25),T("t2","taylor","2:40 PM",25)];
  const r=G(tasks,ctx({displayOnly:true,nowMin:14*60})); ok("display pass leaves a stacked / late day alone (no lane clash)", !r.retimed.length&&!r.rolled.length); }
{ const tasks=[T("a_pc","andrew","2:50 PM",20,"computer"),T("c_pc","caleb","2:50 PM",20,"computer"),T("w","caleb","9:00 AM",20,"paper",{day:"wednesday"})];
  const r=G(tasks,ctx({displayOnly:true,nowMin:14*60+49})); ok("display pass never rolls a card to another day", !r.rolled.length&&!r.deferred.length&&tasks.every(t=>t.id!=="w"||t.day==="wednesday")&&tasks.filter(t=>t.day==="tuesday").length===2); }
{ const tasks=[T("a_pc","andrew","9:00 AM",20,"computer"),T("c_pc","caleb","9:00 AM",15,"computer",{day:"wednesday"})];
  const r=G(tasks,ctx({displayOnly:true,nowMin:8*60+30})); ok("display pass touches today only", !r.retimed.length); }
ok("render pipeline: the Mom-queue lay is wrapped by the lane pass", /function mlQueueLay\(tasks\)\{ return _mlLanePass\(_mlQueueLayCore\(tasks\)\); \}/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
