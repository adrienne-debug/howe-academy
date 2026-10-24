/* 👶 PREKFLAG (audit 2026-10-24): Pre-K exemptions follow the family's own school-age flag, not the name "julian".
 * run: node test_prek_flag.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unterminated "+name); };
function fam(roster){ const ctx={ROSTER:roster.map(k=>k.id),SCHOOL_KIDS:roster.filter(k=>k.schoolAge).map(k=>k.id)}; vm.createContext(ctx); vm.runInContext(fnIn(src,"isPreK"),ctx); return ctx; }
const H=fam([{id:"lincoln",schoolAge:true},{id:"ellis",schoolAge:true},{id:"lucy",schoolAge:true},{id:"julian",schoolAge:false}]);
const B=fam([{id:"zuri",schoolAge:true},{id:"d3",schoolAge:false}]);
const D=fam([{id:"taylor",schoolAge:true},{id:"makenzie",schoolAge:true},{id:"andrew",schoolAge:true},{id:"caleb",schoolAge:true}]);
ok("Howe: Julian is Pre-K, the other three aren't (same as before)", H.isPreK("julian")&&!H.isPreK("lincoln")&&!H.isPreK("ellis")&&!H.isPreK("lucy"));
ok("Burris: 3D is Pre-K (schoolAge:false), Zuri isn't", B.isPreK("d3")&&!B.isPreK("zuri"));
ok("DeWalt: nobody is Pre-K (Caleb is school-age in their settings)", ["taylor","makenzie","andrew","caleb"].every(k=>!D.isPreK(k)));
ok("not a kid on the roster (all, mom, a Howe name in another family, empty) → not Pre-K", !B.isPreK("all")&&!B.isPreK("mom")&&!B.isPreK("julian")&&!B.isPreK("")&&!B.isPreK(null));
const fns=["isScheduleUnlocked","techLost"];
ok("the morning gate never locks a Pre-K schedule (isScheduleUnlocked)", /if\(isPreK\(kidFilter\)\) return true;/.test(fnIn(src,"isScheduleUnlocked")));
ok("the lose-tech rule exempts Pre-K (techLost)", /if\(isPreK\(kid\)\) return false;/.test(fnIn(src,"techLost")));
ok("the tech-rule kid list and the board unlock use the flag", /if\(isPreK\(kid\)\) return;   \/\/ PREKFLAG\n      var lost=techLost/.test(src)&&/var schedUnl=mDone\|\|isPreK\(kid\);/.test(src));
ok("no Pre-K check by the name julian is left in those four places", !/kidFilter === "julian"|schedUnl=mDone\|\|kid==="julian"/.test(src)&&!/if\(kid==="julian"\) return false;\s+\/\/ Pre-K/.test(src));
ok("isPreK sits right after SCHOOL_KIDS", src.indexOf("function isPreK(")>src.indexOf("const SCHOOL_KIDS")&&src.indexOf("function isPreK(")-src.indexOf("const SCHOOL_KIDS")<600);
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
