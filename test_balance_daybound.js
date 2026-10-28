/* CKDAYBOUND (Adrienne, 2026-10-28 7:30 AM, Sara's day 10/27: "Why is Kenzie's checkup on spelling not working? It didn't show up in her
 * schedule at all yesterday."): gwAutoBalance evened DeWalt's week 4 by STACKING the one cap-less, un-planned, Friday-allowed subject —
 * the daily 🩺 "Checkup Spelling" card — onto the light Friday: five there, none Mon–Thu (Taylor's Wednesday one → Friday too).
 * A day-bound subject (Daily tracking / noCarry) runs once on each of its days and never stacks. Replays the live week-4 shape.
 *   run: node test_balance_daybound.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } };
const ALL=["Mon","Tue","Wed","Thu","Fri"], MT=["Mon","Tue","Wed","Thu"];
// the fourth-grader's live subjects 2026-10-25 (keys renamed; minutes, caps, plan-backing and this week's day sets as live)
function subjectsOf(){ return { kid_a:{
  book_a:{minutes:10,allowedDays:ALL,noCoopDays:ALL,planId:"p",rules:"sequential",timesPerWeek:5},
  book_b:{minutes:20,allowedDays:["Mon","Tue","Wed","Fri"],noCoopDays:MT,planId:"p",rules:"sequential",timesPerWeek:4},
  book_c:{minutes:30,allowedDays:["Mon","Tue","Wed","Fri"],noCoopDays:MT,planId:"p",rules:"sequential",timesPerWeek:4},
  book_d:{minutes:20,allowedDays:["Mon","Tue","Wed","Fri"],noCoopDays:MT,planId:"p",rules:"sequential",timesPerWeek:4},
  handwriting:{minutes:10,allowedDays:["Mon","Tue","Wed","Fri"],noCoopDays:MT,cap:1,timesPerWeek:4},
  memory:{minutes:20,allowedDays:["Mon","Tue","Wed","Fri"],noCoopDays:MT,cap:1,timesPerWeek:4},
  piano:{minutes:20,allowedDays:ALL,noCoopDays:ALL,cap:1,timesPerWeek:5},
  reading:{minutes:30,allowedDays:ALL,cap:1,timesPerWeek:5},
  typing:{minutes:20,allowedDays:["Mon","Tue","Wed"],rules:"sequential",timesPerWeek:3},
  checkup_spelling:{display:"Checkup Spelling",minutes:10,allowedDays:ALL,mom:"required",noCarry:true,rules:"sequential",study:"checkup_x",timesPerWeek:5,tracking:"daily"},
  loose:{display:"Loose daily",minutes:10,allowedDays:ALL,rules:"sequential",timesPerWeek:5}   // a plain cap-less subject, neither Daily nor noCarry (control)
} }; }
const DATES=["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"];
function preBalance(){   // what the slot walker + daily inject hand the balancer: lessons Mon–Thu, dailies on their days, the check-up every day
  const d={}; DATES.forEach(x=>d[x]={kid_a:{}});
  const put=(dates,k)=>dates.forEach(x=>d[x].kid_a[k]="TMP");
  put(DATES,"book_a"); put(DATES.slice(0,4),"book_b"); put(DATES.slice(0,4),"book_c"); put(DATES.slice(0,4),"book_d");
  put(DATES.slice(0,4),"handwriting"); put(DATES.slice(0,4),"memory"); put(DATES,"piano"); put(DATES,"reading"); put(DATES.slice(0,3),"typing");
  put(DATES,"checkup_spelling"); put(DATES,"loose");
  return d;
}
function run(subjects){
  const ctx={console,Math,String,Object,Array,Number,parseInt,isNaN,JSON,Set,Map,Date,RegExp};
  ctx.ROSTER=["kid_a"]; ctx.rulesData={schoolDay:{defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"},stackGap:40};
  ctx.currData={subjects}; ctx.gwGetSubjects=k=>subjects[k]||{}; ctx.planBacked=(k,sk)=>!!((subjects[k]||{})[sk]||{}).planId;
  ctx.coopWeekHas=()=>false; ctx.noCoopDaysOf=s=>(s&&Array.isArray(s.noCoopDays)&&s.noCoopDays.length)?s.noCoopDays.map(String):null;
  ctx.smapIsKidOff=()=>false; ctx.schedOvKidOff=()=>false; ctx.schedOv=()=>null; ctx.coopTimedEndMin=()=>0; ctx.coopBlocksBase=()=>false; ctx.famAutoUnits=()=>[]; ctx.dbg=()=>{};
  ctx.toMin=s=>{ const m=/(\d+):(\d+)\s*(AM|PM)/i.exec(s); if(!m) return 0; let h=+m[1]%12; if(/pm/i.test(m[3])) h+=12; return h*60+ +m[2]; };
  ctx.gwParseDate=d=>{ const [y,m,dd]=d.split("-").map(Number); return new Date(y,m-1,dd); };
  ctx.gwRules=()=>({schoolStart:540,schoolEnd:960,lunchStart:720,lunchEnd:780,stackGap:40});
  vm.createContext(ctx);
  vm.runInContext("const DEFAULT_DAY_CAP=2;\n"+fnIn(src,"capFor")+"\n"+fnIn(src,"subjDaysFor")+"\n"+fnIn(src,"gwAutoBalance"),ctx);
  return ctx.gwAutoBalance(preBalance(),{},[],null);
}
const cnt=v=>v===undefined?0:(Array.isArray(v)?v.length:1);
const out=run(subjectsOf());
const perDay=DATES.map(d=>cnt(out[d].kid_a.checkup_spelling));
console.log("── the live week-4 shape ──");
ok("the check-up card runs once on every school day, Mon–Fri: "+perDay.join("/"), perDay.join()==="1,1,1,1,1", out);
ok("Friday never stacks it (the live week had five there)", perDay[4]===1);
ok("the plain cap-less daily subject still balances exactly as before (stacking allowed to close a 40+ minute gap)", cnt(out[DATES[4]].kid_a.loose)>1, DATES.map(d=>cnt(out[d].kid_a.loose)));
ok("lessons and cap-1 dailies are untouched (plan-backed = cap 1; their Friday is not allowed this week)", DATES.slice(0,4).every(d=>out[d].kid_a.book_b&&out[d].kid_a.handwriting)&&!out[DATES[4]].kid_a.book_b);
// the same subject typed Daily with no noCarry flag (the Add sheet writes tracking:"daily"; study-linked cards also get noCarry)
const s2=subjectsOf(); delete s2.kid_a.checkup_spelling.noCarry; const out2=run(s2);
ok("Daily tracking alone is enough to hold the card on its day", DATES.map(d=>cnt(out2[d].kid_a.checkup_spelling)).join()==="1,1,1,1,1");
const s3=subjectsOf(); delete s3.kid_a.checkup_spelling.noCarry; delete s3.kid_a.checkup_spelling.tracking; const out3=run(s3);
ok("control: without either flag the balancer stacks it onto Friday (the bug, kept for a plain subject)", cnt(out3[DATES[4]].kid_a.checkup_spelling)>1, DATES.map(d=>cnt(out3[d].kid_a.checkup_spelling)));
console.log("── wiring ──");
const bal=fnIn(src,"gwAutoBalance");
ok("the guard sits in the stacking branch, right after the cap-1 rule", /capFor\(kid,key,DEFAULT_DAY_CAP\)===1\) continue;[^\n]*\n(\s*\/\/[^\n]*\n)*\s*if\(subjects\[key\]&&\(subjects\[key\]\.noCarry\|\|subjects\[key\]\.tracking==="daily"\)\) continue;/.test(bal));
ok("CKDAYBOUND block is marked", bal.indexOf("CKDAYBOUND_START")>0&&bal.indexOf("CKDAYBOUND_END")>bal.indexOf("CKDAYBOUND_START"));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
