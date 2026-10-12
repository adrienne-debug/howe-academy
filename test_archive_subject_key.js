// 🔑 Archive completion keys are Firebase-safe (DeWalt 2026-10-12: Taylor's "Saxon Math 8/7" made the
// week-handover archive write throw → auto-generate / Generate / Apply all went silent, Week 2 never built).
// Run: node test_archive_subject_key.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const i=src.indexOf("function _wcVals("), j=src.indexOf("// ── DIGEST (W0)",i);
if(i<0||j<0) throw new Error("completion block not found");
const f=new Function(src.slice(i,j)+";return buildWeekCompletion;")();
const BAD=/[.#$\/\[\]]/;
const tasks=[
  {id:"t1",who:"taylor",title:"Saxon Math 8/7 — Lesson 12",subjectKey:"saxon_math_8_7"},
  {id:"t2",who:"taylor",title:"Saxon Math 8/7 — Lesson 13",subjectKey:"saxon_math_8_7"},
  {id:"t3",who:"taylor",title:"Mr. Q's Science [Unit 1] #2 — $5 lab",subjectKey:"sci"},
  {id:"t4",who:"andrew",title:"Arithmetic 2 — Lesson 4",subjectKey:"arithmetic_2"},
  {id:"t5",who:"andrew",title:"",subjectKey:"a/b"},
];
const c=f(tasks,{t1:"9:00 AM Oct 5"},{});
const keys=Object.values(c.byKid).flatMap(r=>Object.keys(r.subs));
ok(keys.length===4,"four subject labels: "+keys.join(" | "));
ok(keys.every(k=>!BAD.test(k)),"no label contains . # $ / [ ] (Firebase key rules)");
ok(!!c.byKid.taylor.subs["Saxon Math 8-7"],"\"Saxon Math 8/7\" is stored as \"Saxon Math 8-7\"");
ok(c.byKid.taylor.subs["Saxon Math 8-7"].planned===2&&c.byKid.taylor.subs["Saxon Math 8-7"].done===1,"both 8/7 cards land on the one label, done count intact");
ok(!!c.byKid.taylor.subs["Mr- Q's Science -Unit 1- -2"],"every forbidden character becomes a dash");
ok(!!c.byKid.andrew.subs["Arithmetic 2"],"a plain label is unchanged");
ok(!!c.byKid.andrew.subs["a-b"],"the subjectKey fallback is made safe too");
ok(c.planned===5&&c.done===1,"totals unchanged by the key rule");
ok(src.indexOf("// ARCHKEY_START")>0&&src.indexOf("// ARCHKEY_END")>src.indexOf("// ARCHKEY_START"),"ARCHKEY block marked");
if(fail){console.log(fail+" failed");process.exit(1);} console.log("all passed");
