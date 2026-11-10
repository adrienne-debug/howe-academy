/*
 * ⏰ RELAYGUARD — the one re-lay door runs the school-end guard on pass A even when nothing sweeps (slice E demo run, 2026-11-08).
 * Found by test_demo_week.js: ⏰ Thursday 11:00–2:30 set on Wednesday → relayWeek("daytimes") → the cascade's QUIET path (no past-day
 * card to move) re-packed Thursday but never ran seGuardWeek (only the sweeping path does, inside safeWriteTasks), so a kid's Typing
 * 2:20–2:35 and Closing 2:35 stayed past the 2:30 finish.
 *   0. shape: pass A is cascade → runCascade → _rlwGuard → pass B; the guard uses seGuardWeek + seGuardCtx and writes targeted paths
 *   1. the guard writes ONE targeted update of exactly seGuardWeek's paths, stamps lastTasksWrite, logs; nothing to do → no write
 *   2. ?dryrun=1 → memory only, no write; a guard that throws → null, nothing written; no seGuardWeek → null
 *   run:  node test_relay_guard.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
console.log("0. shape");
{ const fire=fn("_rlwFire"); ok("pass A: the sweep, then runCascade, then the guard, then pass B",/cascadeIntraWeek\(\); if\(typeof runCascade==="function"\) runCascade\(\); _rlwGuard\(pend\); _rlwChain\(pend\.subjects\|\|\[\],pend,fin\);/.test(fire));
  const g=fn("_rlwGuard"); ok("the guard is seGuardWeek with the app's own context, writing WK/tasks targeted",/seGuardWeek\(weekData\.tasks,seGuardCtx\(\)\)/.test(g)&&/db\.ref\(WK\+"\/tasks"\)\.update\(se\.upd\)/.test(g)&&!/\.set\(/.test(g));
  ok("no kid or family names",!/lincoln|ellis|lucy|julian|taylor|kenzie|andrew|caleb|howe|dewalt|burris/i.test(g)); }
function run(o){
  const writes=[], dbgs=[];
  const ctx={WK:"week9",weekData:{tasks:o.tasks||[{id:"a"}]},sv:()=>{},dbg:m=>dbgs.push(m),lastTasksWrite:0,_dryRun:()=>!!o.dry,console,JSON,Object,Array,String,Date,
    db:o.noDb?null:{ref:p=>({update:u=>{ writes.push({p,u}); }})},
    seGuardCtx:()=>({ctx:1}),seGuardWeek:o.guard===undefined?((t,c)=>({upd:{"t1/time":"2:00 PM","t2":null},retimed:["t1"],rolled:[],deferred:["t2"],dropped:[],stuck:[]})):o.guard};
  if(o.noGuard) delete ctx.seGuardWeek;
  vm.createContext(ctx); vm.runInContext(fn("_rlwGuard"),ctx);
  const r=vm.runInContext("_rlwGuard("+JSON.stringify(o.pend||{whys:["daytimes"]})+")",ctx);
  return {r,writes,dbgs,stamp:ctx.lastTasksWrite};
}
console.log("1. the write");
{ const w=run({});
  ok("one targeted update on week9/tasks with exactly the guard's paths",w.writes.length===1&&w.writes[0].p==="week9/tasks"&&JSON.stringify(w.writes[0].u)===JSON.stringify({"t1/time":"2:00 PM","t2":null}),w.writes);
  ok("lastTasksWrite is stamped (the own-echo guard)",w.stamp>0);
  ok("the line says what it did, named after the door",w.dbgs.some(m=>/school end \(relay daytimes\): re-laid 1, rolled 0, deferred 1/.test(m)),w.dbgs);
  ok("the result is the guard's",w.r&&w.r.retimed[0]==="t1"); }
{ const w=run({guard:()=>({upd:{},retimed:[],rolled:[],deferred:[],dropped:[],stuck:[]})}); ok("nothing to do → no write, no line",!w.writes.length&&!w.dbgs.length&&w.r&&w.r.upd); }
console.log("2. the guards");
{ const w=run({dry:true}); ok("?dryrun=1 → memory only",!w.writes.length&&w.dbgs.length===1); }
{ const w=run({guard:()=>{ throw new Error("boom"); }}); ok("a guard that throws → null, nothing written, one skip line",w.r===null&&!w.writes.length&&w.dbgs.some(m=>/relay guard skip/.test(m))); }
{ const w=run({noGuard:true}); ok("no seGuardWeek (an old sandbox) → null",w.r===null&&!w.writes.length); }
{ const w=run({noDb:true}); ok("no db → the memory is kept, nothing written",!w.writes.length&&w.r&&w.r.retimed[0]==="t1"); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
