/*
 * 🌙 RELAYWIRE — the 8 PM sweep's own moves never trip the relay's "held card changed" wire (slice E demo run, 2026-11-08).
 * Found by test_demo_week.js: every evening the sweep moves today's started-but-unfinished cards into the rest of the week — that is
 * its job — yet _rlwRun's snapshot marked every card at or before "now" as started/held, so the sweep's line read
 * "🌙 8 PM sweep → 14 cards moved · ⚠ 2 held cards changed" about the very cards it was meant to move.
 *   · a run whose why is "sweep" (the 8 PM sweep, ⏩ push) snapshots with no clock: a started card that changes day is a plain move
 *   · any other why keeps the rule: a started card that changes day trips the wire (logged, listed as locked, never a move)
 *   · checked and claimed cards: unchanged either way (never a move; a claimed day change trips the wire)
 *   run:  node test_relay_sweep_wire.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const BLK=src.slice(src.indexOf("// RELAY_START"),src.indexOf("// RELAY4_START"));
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const RealDate=Date;
const frozen=iso=>class F extends RealDate{ constructor(...a){ if(!a.length) super(iso); else super(...a); } static now(){ return new RealDate(iso).getTime(); } };
function run(whys,move){
  const dbgs=[]; const tasks=[{id:"m1",who:"kid_a",subjectKey:"math",day:"thursday",time:"1:05 PM",dur:30,title:"math"},{id:"p1",who:"kid_a",subjectKey:"piano",day:"thursday",time:"3:00 PM",dur:20,title:"piano"},{id:"c1",who:"kid_a",subjectKey:"read",day:"thursday",time:"2:00 PM",dur:20,title:"read"}];
  const ctx={WK:"week2",weekData:{tasks},checked:{},claimed:{c1:1},momMoves:{},HA_DEV_ID:"dev_t",db:null,toMin,fromMin,cap:s=>s,esc:s=>String(s),dbg:m=>dbgs.push(m),gwShowToast(){},renderAll(){},sv(){},
    Date:frozen("2026-11-19T20:00:00"),setTimeout:()=>0,clearTimeout(){},console,JSON,Object,Array,String,Number,Math,RegExp,currData:{subjects:{kid_a:{}}},fxIsClass:()=>false};
  Object.defineProperty(ctx,"_todayDay",{get:()=>"thursday"});
  vm.createContext(ctx); vm.runInContext(BLK,ctx);
  ctx.MOVE=move;
  const d=vm.runInContext("_rlwRun({whys:"+JSON.stringify(whys)+",labels:[\"x\"]},function(){ MOVE(weekData.tasks); })",ctx);
  return {d,dbgs,log:vm.runInContext("relayLogData",ctx),words:e=>vm.runInContext("_rlwWords",ctx)(e)};
}
const sweepMove=T=>{ T.forEach(t=>{ if(t.id==="m1"||t.id==="p1") t.day="friday"; }); };   // the sweep carries both of today's open cards (one started at 1:05, one not yet at 3:00 — 8 PM: both elapsed)
console.log("1. the 8 PM sweep");
{ const r=run(["sweep"],sweepMove);
  ok("both carried cards are plain moves, nothing locked, no tripwire line",r.d.moves.map(m=>m.id).sort().join()==="m1,p1"&&!r.d.locked.length&&!r.dbgs.some(m=>/tripwire/.test(m)),{moves:r.d.moves.map(m=>m.id),locked:r.d.locked,dbgs:r.dbgs});
  const e=Object.values(r.log)[0]; ok("the banner line reads plainly: 2 cards moved, no ⚠",e&&e.n===2&&!e.locked&&!/held/.test(r.words(e)),e&&r.words(e)); }
console.log("2. any other door keeps the wire");
{ const r=run(["kidoff"],sweepMove);
  ok("at 8 PM both of today's cards count as started: a day change trips the wire for each (still listed as moves — the wire logs, it never hides a move)",r.d.locked.sort().join()==="m1,p1"&&r.d.moves.map(m=>m.id).sort().join()==="m1,p1"&&r.dbgs.some(m=>/tripwire/.test(m)&&/m1/.test(m)),{locked:r.d.locked,moves:r.d.moves.map(m=>m.id)}); }
console.log("3. claimed and checked cards, either way");
{ const r=run(["sweep"],T=>{ T.forEach(t=>{ if(t.id==="c1") t.day="friday"; }); });
  ok("a claimed card that changed day under the sweep: never a move, and it still trips the wire (claimed work is frozen)",!r.d.moves.length&&r.d.locked.join()==="c1",r.d);
  const r2=run(["sweep"],T=>{ T.forEach(t=>{ if(t.id==="m1") t.day="friday"; }); }); ok("(control) one started card under the sweep: a plain move",r2.d.moves.length===1&&!r2.d.locked.length); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
