/*
 * 📓 BUMPCLOSE — the early check-off rotation keeps the Closing Notebook last (slice E demo run, 2026-11-08).
 * Found by test_demo_week.js: Piano (20 min, laid 10:00) checked early at 10:05 took Reading's 9:35 slot; Reading (25 min) slid into
 * Piano's 10:00 and ran to 10:25 — under the 10:20 Closing Notebook, so the stored day had the wrap-up inside a lesson.
 *   · the rotation itself is unchanged (done takes the earliest slot, the skipped slide one later, chained by duration)
 *   · an open Closing Notebook that would start inside the rotated group moves to the group's new end (one targeted time write)
 *   · a Closing already after the group stays; a checked or claimed Closing never moves; another kid's Closing is untouched
 *   run:  node test_bump_closing.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
function run(tasks,checked,claimed,doneId){
  const writes=[];
  const ctx={WK:"wk",toMin,fromMin,dbg:()=>{},sv:()=>{},_dryRun:()=>false,lastTasksWrite:0,checked:checked||{},claimed:claimed||{},console,JSON,Object,Array,String,Number,Math,RegExp,
    db:{ref:p=>({update:o=>{ writes.push({p,o}); }})},currData:{subjects:{kid_a:{},kid_b:{}}},fxIsClass:()=>false};
  vm.createContext(ctx); vm.runInContext(fn("taskTierOf")+"\n"+fn("_rlwIsClass")+"\n"+fn("bumpSkippedInTier"),ctx);
  ctx.weekData={tasks:JSON.parse(JSON.stringify(tasks))};
  vm.runInContext("bumpSkippedInTier(weekData.tasks.find(t=>t.id==="+JSON.stringify(doneId)+"))",ctx);
  const R={}; ctx.weekData.tasks.forEach(t=>R[t.id]=t.time); return {R,writes};
}
const day=(o)=>[{id:"nb",who:"kid_a",day:"monday",time:"9:00 AM",dur:5,title:"📄 Morning Notebook — Morning Notebook",subjectKey:"morning_nb",mom:"none",device:"paper"},
  {id:"read",who:"kid_a",day:"monday",time:"9:35 AM",dur:25,title:"📖 Reading — Reading 4",subjectKey:"reading",mom:"none",device:"book"},
  {id:"piano",who:"kid_a",day:"monday",time:"10:00 AM",dur:20,title:"📄 Piano — Piano",subjectKey:"piano",mom:"none",device:"paper"},
  {id:"close",who:"kid_a",day:"monday",time:(o&&o.closeAt)||"10:20 AM",dur:5,title:"📄 Closing Notebook — Closing Notebook",subjectKey:"closing_nb",mom:"none",device:"paper"},
  {id:"b_close",who:"kid_b",day:"monday",time:"10:20 AM",dur:5,title:"📄 Closing Notebook — Closing Notebook",subjectKey:"closing_nb",mom:"none",device:"paper"}];
console.log("1. the demo case: Piano (laid 10:00) checked early at 10:05 — Reading slides into 10:00 and runs to 10:25");
{ const {R,writes}=run(day(),{piano:"10:05 AM Nov 16"},{}, "piano");
  ok("the rotation as before: Piano takes 9:35, Reading takes 10:00",R.piano==="9:35 AM"&&R.read==="10:00 AM",R);
  ok("the Closing Notebook follows the group's new end: 10:25",R.close==="10:25 AM",R);
  ok("another kid's Closing is untouched",R.b_close==="10:20 AM");
  ok("one targeted update, three time paths, never the whole node",writes.length===1&&writes[0].p==="wk/tasks"&&Object.keys(writes[0].o).sort().join()==="close/time,piano/time,read/time",writes); }
console.log("2. a Closing already after the group stays where it is");
{ const {R}=run(day({closeAt:"10:30 AM"}),{piano:"10:05 AM Nov 16"},{},"piano"); ok("10:30 stays 10:30",R.close==="10:30 AM",R); }
console.log("3. a checked or claimed Closing is a record — never moved");
{ const {R}=run(day(),{piano:"10:05 AM Nov 16",close:"10:21 AM Nov 16"},{},"piano"); ok("checked Closing keeps 10:20",R.close==="10:20 AM",R);
  const r2=run(day(),{piano:"10:05 AM Nov 16"},{close:1},"piano"); ok("claimed Closing keeps 10:20",r2.R.close==="10:20 AM",r2.R); }
console.log("4. nothing skipped → nothing written (the done card was already first)");
{ const T=day(); T.find(t=>t.id==="piano").time="9:35 AM"; T.find(t=>t.id==="read").time="10:00 AM"; const {R,writes}=run(T,{piano:"9:40 AM Nov 16"},{},"piano"); ok("no write",!writes.length&&R.close==="10:20 AM",writes); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
