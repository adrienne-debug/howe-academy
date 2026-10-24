// LRCACHE (her report 2026-10-24: Home Base slow; her yes: "keep the due-soon list and rebuild it only when lessons, plans or
// check-offs change"). Slices the real block out of index.html and checks reuse + every invalidation.
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
const a=src.indexOf("// LRCACHE_START"), b=src.indexOf("// LRCACHE_END");
let pass=0, fail=0; const ok=(name,cond)=>{ if(cond){pass++; console.log("  ok  "+name);} else {fail++; console.log("  FAIL "+name);} };
ok("block exists", a>0&&b>a);
const block=src.slice(a,b).replace("const LR_CACHE_MAX_MS","var LR_CACHE_MAX_MS").replace("let _lrLaidCache","var _lrLaidCache");
const ctx={ calls:0, now:1000000, today:"2026-10-26", wk:"week28",
  currData:{lessons:{lincoln:{1:{date:"2026-10-26",math:"5B L12"}}},subjects:{lincoln:{math:{name:"Math"}}},done:{}},
  weekData:{tasks:{}}, calendarData:{holidays:{}}, JSON, Date:{now:()=>ctx.now} };
ctx.lrToday=()=>ctx.today; ctx.activeWk=()=>ctx.wk;
ctx.lrLaidLessons=(k,f,t)=>{ ctx.calls++; return [{kid:k,from:f,to:t,n:ctx.calls}]; };
vm.createContext(ctx); vm.runInContext(block,ctx);
const run=()=>vm.runInContext('lrLaidLessonsCached("lincoln","2026-10-26","2026-11-01")',ctx);
const r1=run(); ok("first call lays", ctx.calls===1);
const r2=run(); ok("same data → reused, no new lay", ctx.calls===1&&r2===r1);
ctx.currData.done={lincoln:{math:{"5B L12":true}}}; run(); ok("a check-off (done) → re-laid", ctx.calls===2);
run(); ok("…then reused again", ctx.calls===2);
ctx.currData.lessons.lincoln[2]={date:"2026-10-27",math:"5B L13"}; run(); ok("a lesson change → re-laid", ctx.calls===3);
ctx.currData.subjects.lincoln.math.paused=true; run(); ok("a plan/subject change → re-laid", ctx.calls===4);
ctx.weekData.tasks.t1={kid:"lincoln"}; run(); ok("this week's cards change → re-laid", ctx.calls===5);
ctx.calendarData.holidays["2026-10-30"]=true; run(); ok("calendar change → re-laid", ctx.calls===6);
ctx.today="2026-10-27"; run(); ok("a new day → re-laid", ctx.calls===7);
ctx.wk="week29"; run(); ok("a new active week → re-laid", ctx.calls===8);
ctx.now+=5*60*1000+1; run(); ok("older than 5 minutes → re-laid", ctx.calls===9);
vm.runInContext('lrLaidLessonsCached("ellis","2026-10-26","2026-11-01")',ctx); ok("another kid has its own entry", ctx.calls===10);
ctx.JSON={stringify:()=>{ throw new Error("boom"); }}; run(); run(); ok("no fingerprint → never reused", ctx.calls===12);
ok("lrBuildList uses the cached lay for both weeks", (src.match(/lrLaidLessonsCached\(kid,w[01]\.from,w[01]\.to,_laySig\)/g)||[]).length===2);
ok("block writes nothing", !/db\.ref|\.set\(|\.update\(/.test(block));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
