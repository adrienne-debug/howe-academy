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
    currData:{subjects:{lincoln:{outschool_german:{fixedTime:"10:00 AM"},aas:{}}}},
    fxIsClass:s=>!!(s&&s.fixedTime)};
  vm.createContext(ctx); vm.runInContext(fn,ctx); return ctx.dsRetime(tasks);
}
const T=()=>[{id:"g",day:"wednesday",who:"lincoln",subjectKey:"outschool_german",time:"10:00 AM"},{id:"a",day:"wednesday",who:"lincoln",subjectKey:"aas",time:"10:45 AM"},{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"10:00 AM"}];
const R={schoolDay:{defaultStart:"10:00 AM"}};
let o=run({lincoln:"8:06 AM"},R,T()); const by=id=>o.find(t=>t.id===id).time;
ok("early routine finish (8:06): German stays 10:00", by("g")==="10:00 AM");
ok("early routine finish: nothing before 10:00", o.every(t=>toMin(t.time)>=600));
ok("early routine finish: AAS unchanged 10:45", by("a")==="10:45 AM");
o=run({lincoln:"10:30 AM"},R,T());
ok("late start 10:30: German still 10:00 (set time)", by("g")==="10:00 AM");
ok("late start 10:30: notebook shifts to 10:30", by("n")==="10:30 AM");
ok("late start 10:30: AAS shifts to 11:15", by("a")==="11:15 AM");
o=run({lincoln:"8:06 AM"},{schoolDay:{defaultStart:"9:00 AM"}},[{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"9:30 AM"}]);
ok("setting changed to 9:00: early finish floors at 9:00", by("n")==="9:00 AM");
o=run({lincoln:"8:06 AM"},{schoolDay:{defaultStart:"10:00 AM",overrides:{wednesday:{start:"11:00 AM"}}}},[{id:"n",day:"wednesday",who:"lincoln",subjectKey:"morning_nb",time:"11:00 AM"}]);
ok("Wednesday override 11:00 is the floor", by("n")==="11:00 AM");
console.log(pass+" passed, "+fail+" failed");
