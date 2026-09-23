// extract dsRetime from a file and run it on stubs
const fs=require("fs"),vm=require("vm");
const src=fs.readFileSync(process.argv[2]||require("path").join(__dirname,"index.html"),"utf8");
const i=src.indexOf("function dsRetime(tasks){"); let depth=0,j=i; for(;j<src.length;j++){ if(src[j]==="{")depth++; else if(src[j]==="}"){ depth--; if(depth===0){ j++; break; } } }
const fn=src.slice(i,j);
const toMin=s=>{ const p=String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); let h=+p[1]%12; if(/pm/i.test(p[3]))h+=12; return h*60+ +p[2]; };
const fromMin=m=>{ let h=Math.floor(m/60),mm=m%60; const ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(mm).padStart(2,"0")+" "+ap; };
let pass=0,fail=0; const ok=(n,c)=>{ c?pass++:fail++; console.log((c?"ok  ":"FAIL")+" - "+n); };
function run(starts,rules,tasks){
  const ctx={toMin,fromMin,_todayDay:"wednesday",dayStarts:{wednesday:starts},checked:{},rulesData:rules,
    currData:{subjects:{lincoln:{outschool_german:{fixedTime:"10:00 AM"},outschool_voice_lessons:{fixedTime:"10:00 AM"},aas:{}}}},
    fxIsClass:s=>!!(s&&s.fixedTime)};
  vm.createContext(ctx); vm.runInContext(fn,ctx); return ctx.dsRetime(tasks);
}

// Lincoln's real Wednesday 9/23: Outschool German 10:00–10:45 (fixed class), notebook 10:45, flash cards 10:50
const T=()=>[{id:"g",day:"wednesday",who:"lincoln",subjectKey:"outschool_german",time:"10:00 AM",dur:45},{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"10:45 AM",dur:5},{id:"a",day:"wednesday",who:"lincoln",subjectKey:"aas",time:"10:50 AM",dur:20}];
const R={schoolDay:{defaultStart:"10:00 AM"}};
let o; const by=id=>o.find(t=>t.id===id).time;
o=run({lincoln:"8:06 AM"},R,T());
ok("ready 8:06 (before school): German stays 10:00", by("g")==="10:00 AM");
ok("ready 8:06: the class goes first — notebook stays 10:45, not pulled onto German", by("n")==="10:45 AM");
ok("ready 8:06: nothing before 10:00", o.every(t=>toMin(t.time)>=600));
o=run({lincoln:"10:30 AM"},R,T());
ok("ready 10:30 (during German): German 10:00, notebook still 10:45 — no gap", by("g")==="10:00 AM"&&by("n")==="10:45 AM");
o=run({lincoln:"11:00 AM"},R,T());
ok("ready 11:00 (after German): German 10:00, notebook shifts to 11:00, AAS 11:05", by("g")==="10:00 AM"&&by("n")==="11:00 AM"&&by("a")==="11:05 AM");
// no class that day: the plain floor
o=run({lincoln:"8:06 AM"},R,[{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"10:00 AM",dur:5},{id:"a",day:"wednesday",who:"lincoln",subjectKey:"aas",time:"10:05 AM",dur:20}]);
ok("no class, ready 8:06: notebook 10:00 (never before school start)", by("n")==="10:00 AM"&&by("a")==="10:05 AM");
o=run({lincoln:"10:30 AM"},R,[{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"10:00 AM",dur:5},{id:"a",day:"wednesday",who:"lincoln",subjectKey:"aas",time:"10:05 AM",dur:20}]);
ok("no class, late start 10:30: day shifts to 10:30", by("n")==="10:30 AM"&&by("a")==="10:35 AM");
// Friday Outschool Voice Lessons 10:00–10:30 (Oct 2–23)
const F=()=>[{id:"v",day:"wednesday",who:"lincoln",subjectKey:"outschool_voice_lessons",time:"10:00 AM",dur:30},{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"10:30 AM",dur:5}];
o=run({lincoln:"8:00 AM"},R,F());
ok("Voice Lessons (Fri class) ready 8:00: class 10:00, notebook 10:30", by("v")==="10:00 AM"&&by("n")==="10:30 AM");
o=run({lincoln:"10:40 AM"},R,F());
ok("Voice Lessons, ready 10:40 (after class): class 10:00, notebook 10:40", by("v")==="10:00 AM"&&by("n")==="10:40 AM");
// the start time follows Settings
o=run({lincoln:"8:06 AM"},{schoolDay:{defaultStart:"9:00 AM"}},[{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"9:30 AM",dur:5}]);
ok("setting changed to 9:00: early finish floors at 9:00", by("n")==="9:00 AM");
o=run({lincoln:"8:06 AM"},{schoolDay:{defaultStart:"10:00 AM",overrides:{wednesday:{start:"11:00 AM"}}}},[{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"11:00 AM",dur:5}]);
ok("Wednesday override 11:00 is the floor", by("n")==="11:00 AM");
console.log(pass+" passed, "+fail+" failed");
