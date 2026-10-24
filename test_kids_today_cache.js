// KIDSTODAYCACHE (her report 2026-10-24: Home Base slow; her yes 2026-10-24: "lets do 4 now"). Slices the real block (and the
// LRCACHE fingerprint it builds on) out of index.html and checks: reuse on the same data, a recount on every kind of change,
// the same answer as counting fresh, and no writes.
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(name,cond)=>{ if(cond){pass++; console.log("  ok  "+name);} else {fail++; console.log("  FAIL "+name);} };
const slice=(s,e)=>{ const a=src.indexOf(s), b=a>0?src.indexOf(e,a+s.length):-1; return a>0&&b>a?src.slice(a,b):""; };
const lr=slice("// LRCACHE_START","// LRCACHE_END").replace("const LR_CACHE_MAX_MS","var LR_CACHE_MAX_MS").replace("let _lrLaidCache","var _lrLaidCache");
const kt=slice("// KIDSTODAYCACHE_START","// KIDSTODAYCACHE_END");
ok("blocks exist", !!lr&&!!kt);
ok("block state is var (an early boot paint can't hit a let/const before its line)", !/^(let|const) /m.test(kt));

// A small world with every input pace reads. paceKidStatus is a stand-in that counts its calls and derives its answer
// from all of them, so a stale reuse would show up as a different answer.
const ctx={ calls:0, now:1e12, today:"2026-10-26", wk:"week28", cwn:28, pwn:{lincoln:28,ellis:28},
  currData:{lessons:{lincoln:{1:{date:"2026-10-26",math:"5B L12"}}},subjects:{lincoln:{math:{display:"Math"}}},done:{},weekDays:{}},
  weekData:{tasks:[{id:"t1",who:"lincoln",title:"Math 5B L12"}]}, calendarData:{holidays:{},coops:{}},
  paceData:{subjects:{lincoln:{math:{label:"Math",total:100}}},plans:{}}, currPaceCum:{lincoln:{math:{28:40}}},
  checked:{}, histState:{}, scheduleOverrides:{}, WK:"week28",
  archive:{week27:{weekLabel:"Week 27",tasks:[{id:"a1",who:"lincoln",title:"Math 5B L11"}],checked:{},history:{}}},
  JSON, Date:{now:()=>ctx.now} };
ctx.lrToday=()=>ctx.today; ctx.activeWk=()=>ctx.wk; ctx.currWeekNum=()=>ctx.cwn;
ctx.paceKidPlan=k=>({start:"2026-04-20",kids:[k]}); ctx.planWeekNum=()=>ctx.pwn.lincoln;
ctx.truth=k=>{ const n=JSON.stringify([ctx.currData,ctx.weekData,ctx.calendarData,ctx.paceData,ctx.currPaceCum,ctx.checked,ctx.histState,ctx.scheduleOverrides,ctx.WK,ctx.archive,ctx.today,ctx.wk,ctx.cwn,ctx.pwn.lincoln]).length;
  return {subjects:1,aheadN:0,onN:n%2,behindN:1-n%2,behindSubs:n%2?[]:["Math"],kid:k,n}; };
ctx.paceKidStatus=k=>{ ctx.calls++; return ctx.truth(k); };
vm.createContext(ctx); vm.runInContext(lr+"\n"+kt,ctx);
const run=(k="lincoln")=>vm.runInContext('paceKidStatusCached("'+k+'",ktPaceSig())',ctx);
const same=(r,k="lincoln")=>JSON.stringify(r)===JSON.stringify(ctx.truth(k));

const r1=run(); ok("first draw counts", ctx.calls===1&&same(r1));
const r2=run(); ok("same data → reused, no recount, same answer", ctx.calls===1&&same(r2));
r2.behindSubs.push("junk"); r2.behindN=99; ok("a caller changing its copy can't spoil the kept answer", same(run())&&ctx.calls===1);
let n=1; const change=(label,fn)=>{ fn(); const r=run(); n++; ok(label+" → recounted, same as counting fresh", ctx.calls===n&&same(r)); const r3=run(); ok("  …then reused", ctx.calls===n&&same(r3)); };
change("a check-off (checked, in place)", ()=>{ ctx.checked.t1=true; });
change("this week's history (in place)", ()=>{ ctx.histState.t1={ts:1,who:"lincoln",title:"Math 5B L12"}; });
change("a curriculum check-off (done)", ()=>{ ctx.currData.done={lincoln:{math:{L12:{src:"manual"}}}}; });
change("a lesson change", ()=>{ ctx.currData.lessons.lincoln[2]={date:"2026-10-27",math:"5B L13"}; });
change("a subject change", ()=>{ ctx.currData.subjects.lincoln.math.rules="sequential"; });
change("this week's cards", ()=>{ ctx.weekData.tasks.push({id:"t2",who:"lincoln",title:"Math 5B L13"}); });
change("the calendar (holiday)", ()=>{ ctx.calendarData.holidays.h1={date:"2026-10-30"}; });
change("the calendar (co-op)", ()=>{ ctx.calendarData.coops.c1={mode:"timed",kids:["lincoln"],dates:["2026-10-28"]}; });
change("a schedule override", ()=>{ ctx.scheduleOverrides["2026-10-27"]={lincoln:{dayOff:true}}; });
change("a pace setting", ()=>{ ctx.paceData.subjects.lincoln.math.paceAdjust=3; });
change("the expected-pace table", ()=>{ ctx.currPaceCum.lincoln.math[29]=45; });
change("archive: a week added", ()=>{ ctx.archive.week26={weekLabel:"Week 26",tasks:[],checked:{},history:{}}; });
change("archive: a check removed in place (walk-back)", ()=>{ ctx.archive.week27.checked.a1=true; });
change("archive: history edited in place", ()=>{ ctx.archive.week27.history.a1={ts:1,who:"lincoln",title:"Math 5B L11"}; });
change("WK", ()=>{ ctx.WK="week29"; });
change("a new active week", ()=>{ ctx.wk="week29"; });
change("a new day", ()=>{ ctx.today="2026-10-27"; });
change("the school week number", ()=>{ ctx.cwn=29; });
change("the plan week number (Sunday night)", ()=>{ ctx.pwn.lincoln=29; });
ctx.now+=5*60*1000+1; run(); n++; ok("older than 5 minutes → recounted", ctx.calls===n);
run("ellis"); n++; ok("another kid has its own entry", ctx.calls===n); run(); ok("…and Lincoln's is still kept", ctx.calls===n);
ctx.JSON={stringify:()=>{ throw new Error("boom"); }}; run(); run(); n+=2; ok("no fingerprint → never reused", ctx.calls===n);

// Wiring: the 🧒 Kids today card fingerprints once and asks the cached pace for each kid; paceKidStatus itself is untouched.
const card=slice("function mdCardKidsToday(","\nfunction ");
ok("Kids today card fingerprints once per draw", /const _ktSig=\(typeof ktPaceSig==="function"\)\?ktPaceSig\(\):null;\s*\/\/[^\n]*\n\s*SL_KIDS\.forEach/.test(card));
ok("Kids today card reads the cached pace (plain count only if the cache is missing)", card.indexOf('const ps=(typeof paceKidStatusCached==="function")?paceKidStatusCached(kid,_ktSig):paceKidStatus(kid);')>0);
ok("paceKidStatus still counts the same way", /function paceKidStatus\(k\)\{[\s\S]*?paceAutoCount\(k,kws,null,sk\)[\s\S]*?return \{subjects:keys\.length,aheadN,onN,behindN,behindSubs\};\n\}/.test(src));
ok("block writes nothing", !/db\.ref|\.set\(|\.update\(|\.remove\(|HA_LS|localStorage/.test(kt));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
