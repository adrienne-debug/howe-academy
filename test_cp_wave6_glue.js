// test_cp_wave6_glue.js — the wave-6 merge (2026-10-29): PR 17 🧠 CPWATCH and PR 22 📅 CPCAL meet. The watch counts a student's missed
// study days on the family's OWN days once the family has some: cpwCal → cpCalOf (CPCAL) → cppStudy (CPPACE) → cpCalStudy for a {wd} calendar.
const fs=require("fs"), path=require("path"), vm=require("vm"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const slice=(a,b)=>{ const i=src.indexOf("// "+a), j=src.indexOf("// "+b); return i>=0&&j>i?src.slice(i,j):""; };
const WATCH=slice("CPWATCH_START","CPWATCH_END"), CAL=slice("CPCAL_START","CPCAL_END"), PACE=slice("CPPACE_START","CPPACE_END");
ok("the three blocks are present once", WATCH&&CAL&&PACE&&["CPWATCH","CPCAL","CPPACE"].every(n=>src.split("// "+n+"_START").length===2));
ok("CPCAL defines cpCalOf(sid), the reader CPWATCH asks first", /\nfunction cpCalOf\(sid\)/.test(CAL)&&/typeof cpCalOf==="function"\)\{ const c=cpCalOf\(sid\)/.test(WATCH));
ok("CPWATCH's study-day rule goes through the pace planner's cppStudy", /function cpwStudyDay\(cal,k\)[^\n]*\n\s*if\(typeof cppStudy==="function"\) return cppStudy\(cal,d\)/.test(WATCH));
// run the chain on a family calendar of Mon/Wed/Fri (wd "135")
function fnSrc(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) return ""; const e=src.indexOf("\n}",i+1), nl=src.indexOf("\n",i+1);
  const one=src.slice(i+1,nl); return /\}\s*(\/\/.*)?$/.test(one)&&one.split("{").length===one.split("}").length?one:src.slice(i+1,e+2); }
const names=["cppMs","cpcalMs","cppStudy","cpcalOk","cpcalWdOf","cpCalStudy","cpwStudyDay"];
const code=names.map(fnSrc).join("\n"); ok("the chain's functions are all found", names.every(n=>fnSrc(n)));
const ctx={envsKeyMs:k=>Date.UTC(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8))}; let ran=false, got="";
try{ vm.createContext(ctx); vm.runInContext(code,ctx); const cal={days:"own",wd:"135",off:{"2026-11-04":true}};
  got=["20261102","20261103","20261104","20261106","20261107"].map(k=>ctx.cpwStudyDay(cal,k)?"1":"0").join(""); ran=true; }catch(e){ got=String(e); }
ok("a Mon/Wed/Fri family: Mon yes, Tue no, Wed off, Fri yes, Sat no (got "+got+")", ran&&got==="10010");
const cls=ctx.cpwStudyDay&&ctx.cpwStudyDay({days:"school",off:{}},"20261103");
ok("…and without a family calendar the class's school days still count (Tue is a study day)", cls===true);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
