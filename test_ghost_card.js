// 👻 GHOSTCARD (2026-10-04): DeWalt week1 held 'makenzie_makenzie__aas_4_L0141' = {dur:20} — no id/title/day/who.
// Every schedule render hit t.id.endsWith on it → blank page under the menu. Week cards are now taken in only when real.
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const main=[...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).reduce((a,b)=>b.length>a.length?b:a);
let pass=0, fail=0; const ok=(n,c)=>{ c?pass++:fail++; console.log((c?"  ok  - ":"  FAIL- ")+n); };
const fn=n=>{ const i=main.search(new RegExp("^function "+n+"\\(","m")); if(i<0) throw new Error(n+" missing"); let d=0,j=main.indexOf("{",i);
  for(;j<main.length;j++){ if(main[j]==="{")d++; else if(main[j]==="}"&&--d===0) break; } return main.slice(i,j+1); };
const ctx={}; vm.createContext(ctx); vm.runInContext(fn("_haRealCards"),ctx);
const real={id:"taylor_x_1",who:"taylor",day:"Monday",time:"9:00 AM",title:"Math",dur:30}, ghost={dur:20};
const out=ctx._haRealCards([real,ghost,null]);
ok("the ghost {dur:20} and a null are skipped", out.length===1&&out[0]===real);
ok("real cards pass through untouched (same objects, same order)", ctx._haRealCards([real,real]).every(t=>t===real));
ok("a non-array (empty cache) passes through as-is", ctx._haRealCards(null)===null);
ok("boot load guarded", /const t=ld\(WK\+"_tasks"\); if\(t\) weekData\.tasks=_haRealCards\(t\);[^\n]*\n  weekData\.week=WK;/.test(main));
ok("week-switch load guarded", /weekData\.week=WK;\n\s*const t=ld\(WK\+"_tasks"\); if\(t\) weekData\.tasks=_haRealCards\(t\);/.test(main));
ok("live week listener guarded", /const incoming=_haRealCards\(Object\.values\(s\.val\(\)\)\);/.test(main));
ok("no unguarded live week listener left", !/const incoming=Object\.values\(s\.val\(\)\);/.test(main));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
