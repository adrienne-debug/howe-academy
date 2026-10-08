// test_gapfill_fixed_class.js — cascadeIntraWeek's Gap-backfill must never float a fixed-time
// class (fxIsClass on the card's subject) into an earlier gap; a set time stays put (2026-10-08).
// Replays the real Gap-backfill block sliced out of index.html.
const fs=require("fs");
const html=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0;
const ok=(name,c)=>{ if(c){pass++;console.log("PASS "+name);} else {fail++;console.log("FAIL "+name);} };

const a=html.indexOf("  // ── Gap-backfill (resource-aware)");
const b=html.indexOf("  // 🧩 a carried page-book sitting landing beside the day's own sitting folds into one card",a);
ok("Gap-backfill block found",a>0&&b>a);
const block=html.slice(a,b);
ok("GAPFX block sits inside Gap-backfill",block.indexOf("// GAPFX_START")>0&&block.indexOf("// GAPFX_END")>0);
const fxSrc=html.slice(html.indexOf("function fxIsClass("),html.indexOf("\n",html.indexOf("function fxIsClass(")));

const toMin=s=>{ const m=String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); let h=+m[1]%12; if(/pm/i.test(m[3])) h+=12; return h*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };

function replay(tasks,subjects){
  const run=new Function("weekData","currData","checked","toMin","fromMin",
    fxSrc+`
    const dayOrder=["monday"], todayIdx=0, today="tuesday", _nowMin=0;
    const sd={defaultStart:"10:00 AM",lunchStart:"1:00 PM",lunchEnd:"2:00 PM"};
    const _cascDate=d=>"2026-10-05";
    const coopApplyStart=()=>({});
    const taskDevice=t=>t.device||null;
    const taskSubject=t=>t.subjectKey;
    const _isNote=t=>/notebook/i.test(t.title||"");
    const _isClose=t=>/closing/i.test(t.title||"");
    `+block);
  run({tasks},{subjects},{},toMin,fromMin);
  return tasks;
}

// Lincoln: a reading card 10:00–10:20, an idle gap 10:20–11:00, then Outschool German (fixed 11:30).
const subs={lincoln:{
  reading:{name:"Reading"},
  german:{name:"Outschool German",fixedTime:"11:30 AM",allowedDays:["Mon"]},
  typing:{name:"Typing"}}};
const mk=()=>[
  {id:"r1",who:"lincoln",day:"monday",time:"10:00 AM",dur:20,subjectKey:"reading",title:"Reading"},
  {id:"g1",who:"lincoln",day:"monday",time:"11:30 AM",dur:45,subjectKey:"german",title:"German class"},
  {id:"t1",who:"lincoln",day:"monday",time:"12:15 PM",dur:20,subjectKey:"typing",title:"Typing"}];
let out=replay(mk(),subs);
const by=id=>out.find(t=>t.id===id);
ok("fixed-time class stays at 11:30 AM",by("g1").time==="11:30 AM");
ok("ordinary card still floats into the gap (10:20 AM)",by("t1").time==="10:20 AM");

// Control: same card without fixedTime does float — proves the replay exercises the float.
const subs2=JSON.parse(JSON.stringify(subs)); delete subs2.lincoln.german.fixedTime;
out=replay(mk(),subs2);
ok("control: non-class card does float earlier",toMin(out.find(t=>t.id==="g1").time)<toMin("11:30 AM"));

// Family-time exclusion and the existing filter shape are untouched.
ok("famBlock exclusion kept",/!t\.famBlock&&subjCount\[t\.who\+"\|"\+taskSubject\(t\)\]===1&&!_gbFx\(t\)\)/.test(block));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
