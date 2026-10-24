// LRSKIP (her report + yes 2026-10-24): the due-soon/Sunday lists lay out only subjects that have resources attached;
// photo capture (lrCapLaid) still lays every subject. Slices the real lrLaidLessons from index.html.
const fs=require("fs"), vm=require("vm"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  "+n);} else {fail++;console.log("  FAIL "+n);} };
function fnSrc(n){ const i=src.indexOf("\nfunction "+n+"("); const eol=src.indexOf("\n",i+1); const line=src.slice(i+1,eol); let d=0; for(const c of line){ if(c==="{")d++; else if(c==="}")d--; } if(d===0) return line; return src.slice(i+1,src.indexOf("\n}",i+1)+2); }
const ctx={ laid:[], res:{},
  currData:{ lessons:{lincoln:{1:{date:"2026-10-26",math:"5B L12",sci:"Ch 4",art:"Lesson 3"}}}, subjects:{lincoln:{math:{},sci:{},art:{}}} } };
vm.createContext(ctx);
vm.runInContext(fnSrc("lrLaidLessons")+"\n"+'function lrSubjects(k){ return (currData.subjects||{})[k]||{}; }\nfunction lrRoot(){ return res; }\nfunction lrToday(){ return "2026-10-24"; }\nfunction lrFilled(t){ return !!String(t||"").trim(); }\nfunction lrKeyForText(k,sk,t){ return sk+"|"+t; }\nfunction planBacked(){ return true; }\nfunction gvDerivedColumn(k,sk){ laid.push(sk); return {byDate:{}}; }',ctx);
const run=(only)=>{ ctx.laid=[]; const out=vm.runInContext('lrLaidLessons("lincoln","2026-10-26","2026-11-01",'+(only?"true":"false")+')',ctx); return {out, laid:ctx.laid.slice()}; };
let r=run(true); ok("no resources anywhere → nothing laid, nothing listed", r.laid.length===0&&r.out.length===0);
r=run(false); ok("photo capture path (no flag) still lays every subject", r.laid.sort().join(",")==="art,math,sci"&&r.out.length===3);
ctx.res={lincoln:{sci:{_subject:{supplies:[{name:"beaker"}]}}}};
r=run(true); ok("only the subject with supplies is laid", r.laid.join(",")==="sci"&&r.out.length===1&&r.out[0].sk==="sci");
const all=run(false).out.filter(x=>x.sk==="sci"); ok("its lessons are identical to the full lay", JSON.stringify(all)===JSON.stringify(r.out));
ctx.res={lincoln:{art:{}}}; r=run(true); ok("an empty resources record doesn't count", r.laid.length===0);
ok("the cached due-soon path passes the flag", /lrLaidLessons\(kid,fromISO,toISO,true\)/.test(src));
ok("lrCapLaid still calls without it", /function lrCapLaid[\s\S]{0,800}lrLaidLessons\(kid,[^)]*\)/.test(src) && !/function lrCapLaid[\s\S]{0,800}lrLaidLessons\([^)]*true\)/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
