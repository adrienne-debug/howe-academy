/*
 * test_house_parity.js — Household by room, step 4 "Switch on": MERGING SWITCHES NOTHING ON. The whole app runs (test_fixtures/
 * house_world.js, a made-up family, two devices over one in-memory Firebase) once on this branch and once on main's index.html (the
 * base), with household/meta/engine "off", then "preview", and the same script of taps on both:
 *   kids' check-offs on every list (house, health and animal rows), Mom's ✕ today, Mom's and Dad's own ticks, a Chores & Stars save,
 *   the cleaning-day plan (build, send, a kid's check-off on it), and a day roll into Tuesday.
 * After each step every kid's four lists (raw and on every weekday, with done and waved marks), Mom's and Dad's lists, and the whole
 * database tree must be identical to the base's, and so must the list of writes (op + path, in order).
 * Then with the switch ON: every health and animal row keeps its position, its label and its check mark, before and after.
 *   BASE_HTML=/path/to/main/index.html node test_house_parity.js   (default: `git show origin/main:index.html`)
 */
"use strict";
const fs=require("fs"), os=require("os"), path=require("path"), cp=require("child_process"), W=require(path.join(__dirname,"test_fixtures","house_world.js"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,700)+")":"")); } };
let BASE=process.env.BASE_HTML;
if(!BASE){ try{ const t=path.join(os.tmpdir(),"house_parity_base_"+process.pid+".html"); fs.writeFileSync(t,cp.execSync("git show origin/main:index.html",{cwd:__dirname,maxBuffer:64<<20})); BASE=t; }catch(e){ BASE=null; } }
console.log("(base: "+(BASE||"none — git show failed; comparing off with no switch at all on this branch")+")");
const MON="2026-11-16";
const strip=t=>{ const o=JSON.parse(JSON.stringify(t)); delete o.houseDay; return o; };
const tick=(d,slot,kid,label)=>d.run("(function(){ const s=rtStepsFor('"+slot+"','"+kid+"',false,day)||[]; const i=s.findIndex(function(x){ return x&&x.label==="+JSON.stringify(label)+"&&x.cad!=='none'; }); if(i<0) return -1; "+(slot==="morning"?"toggleMorningStep('"+kid+"',i)":"toggleRtStep('"+slot+"','"+kid+"',i)")+"; return i; })()");
// the script of taps; each step returns a snapshot
async function script(o){
  const w=await W.world({mode:o.mode,index:o.index}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush();
  const snaps=[]; const snap=async(name)=>{ await w.flush(); snaps.push({name,lists:JSON.stringify(W.lists(B)),mom:JSON.stringify(W.lists(A,{days:["monday"]})),tree:JSON.stringify(strip(w.db.tree.root)),writes:w.db.log.map(l=>l.op+" "+l.path+" "+(l.keys||[]).join(",")).join("\n")}); };
  await w.at(2026,11,16,7,0); await snap("Mon 7:00 open");
  tick(B,"morning","kid_a","Brush teeth"); tick(B,"morning","kid_a","Feed the fish"); tick(B,"morning","kid_a","Make your bed"); await snap("morning ticks (health, animal, house)");
  await w.at(2026,11,16,16,30);
  tick(B,"chores","kid_a","Unload the dishwasher"); tick(B,"chores","kid_a","Scoop the litter"); tick(B,"chores","kid_b","Mop the kitchen"); tick(B,"afternoon","kid_b","Pickup the den"); tick(B,"evening","kid_b","Take your vitamin"); await snap("afternoon ticks");
  tick(B,"chores","kid_a","Unload the dishwasher"); await snap("an un-tick");
  A.run("(function(){ const s=rtStepsFor('chores','kid_c',false,'monday'); const i=s.findIndex(function(x){ return x.label==='Toys in the bin'; }); rtWave('chores','kid_c','monday',i); })()"); await snap("Mom's ✕ today");
  A.run("try{ mcToggle('fridge'); dcToggle('trash'); }catch(e){}"); await snap("Mom's and Dad's ticks");
  A.run("routineCfg2.chores.kid_b.push({emoji:'🧺',label:'Fold the towels',pts:5,cad:'daily'}); rtCfgSave();"); await snap("a Chores & Stars save");
  A.run("try{ hhPlanSend('"+MON+"'); }catch(e){ __e=String(e); }"); await snap("cleaning-day plan sent");
  B.run("(function(){ const r=hhPlanRec('"+MON+"'); if(!r||!r.plan) return; const id=Object.keys(r.plan).sort()[0]; kcKid=r.plan[id].who; hhPlanCheck('"+MON+"',id); })()"); await snap("a check-off on the cleaning-day plan");
  await w.at(2026,11,17,7,0); await snap("Tue 7:00 (day roll)");
  return {snaps,w,A,B};
}
(async()=>{
for(const mode of ["off","preview"]){
  console.log("\n── switch "+mode+": every screen and every write is main's ──");
  const N=await script({mode});
  const O=BASE?await script({mode,index:BASE}):await script({mode:null});
  N.snaps.forEach((s,k)=>{ const b=O.snaps[k];
    ok(mode+" · "+s.name+": every kid's lists and Mom's and Dad's lists are identical", s.lists===b.lists&&s.mom===b.mom, [s.lists.length,b.lists.length]);
    ok(mode+" · "+s.name+": the database is identical, write for write", s.tree===b.tree&&s.writes===b.writes, (()=>{ const x=s.writes.split("\n"), y=b.writes.split("\n"); const i=x.findIndex((l,j)=>l!==y[j]); return [i,x[i],y[i]]; })()); });
  ok(mode+" · nothing was ever written under houseDay, and no houseDay listener", !N.w.db.tree.root.houseDay&&!N.w.db.listeners.some(l=>/^houseDay/.test(l.path)));
}

console.log("\n── switch ON: health and animal rows keep their place and their marks ──");
{ const w=await W.world({mode:"off"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,18,30);   // 6:30 PM: the Evening list is open too
  tick(B,"morning","kid_a","Brush teeth"); tick(B,"morning","kid_a","Feed the fish"); tick(B,"chores","kid_a","Scoop the litter"); tick(B,"evening","kid_b","Take your vitamin"); tick(B,"morning","kid_c","Fill the dog's water"); await w.flush();
  const J=W.jobs(), isHA=s=>{ const id=s&&s._hhId; return false; };
  const routineRows=L=>{ const out={}; Object.keys(L).filter(k=>!/raw$/.test(k)&&k.indexOf("/")>0).forEach(k=>{ out[k]=L[k].map((s,i)=>({i,label:s.label,done:s._done,waved:s._waved,cad:s.cad})).filter(r=>{ const j=Object.values(J).find(x=>x.label===r.label); return j&&(j.area==="health"||j.area==="animals"); }); }); return out; };
  const before=routineRows(W.lists(B)), bm=W.lists(A,{days:["monday"]}).mom;
  w.db.api("t").ref("household/meta/engine").set({mode:"on",on:MON}); await w.flush(); await w.tick();
  ok("the plan was built (sanity)", !!w.get("houseDay/"+MON+"/built/ok"));
  const L=W.lists(B), after=routineRows(L);
  ok("every health and animal row: same position, same label, same done mark, same cadence (every kid, list and weekday)", JSON.stringify(before)===JSON.stringify(after), Object.keys(before).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])).slice(0,3));
  ok("…and there are some (sanity: 5 ticked)", Object.values(after).reduce((a,r)=>a+r.filter(x=>x.done&&x.label).length,0)>=5, Object.values(after).reduce((a,r)=>a+r.filter(x=>x.done).length,0));
  ok("every stored row is still at its index (house rows hidden in place, nothing shifted)", Object.keys(L).filter(k=>/monday$/.test(k)).every(k=>{ const raw=L[k.replace(/monday$/,"raw")]; return raw.every((s,i)=>L[k][i]&&L[k][i].label===(B.run("rtStepsFor('"+k.split("/")[0]+"','"+k.split("/")[1]+"',false,'monday')["+i+"].label"))); }));
  ok("Mom's health row is still hers, unchanged", JSON.stringify(W.lists(A,{days:["monday"]}).mom.tea)===JSON.stringify(bm.tea));
  w.db.api("t").ref("household/meta/engine").set({mode:"off",on:MON}); await w.flush();
  ok("…and switching OFF again gives the very same lists as before switch-on", JSON.stringify(routineRows(W.lists(B)))===JSON.stringify(before));
}
if(BASE&&!process.env.BASE_HTML) try{ fs.unlinkSync(BASE); }catch(e){}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})().catch(e=>{ console.log("CRASH",e.stack); process.exit(1); });
