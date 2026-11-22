/*
 * test_fixtures/house_world.js — the world behind test_house_parity.js, test_house_checkoff.js and test_house_hooks.js (Household by
 * room, step 4 "Switch on"). The WHOLE app runs per device (demo_week_sandbox.js: one shared in-memory Firebase with transactions,
 * one virtual clock) on a MADE-UP family — the demo family's kids (kid_a … kid_d) plus a small household table with Take over on:
 * health and animal rows, house rows of every kind the engine hands out (daily, on its days, every N, a rotation), and the rows it
 * never hands out (as needed, a laundry row). No real family's names or data.
 *   const W=require("./test_fixtures/house_world.js");
 *   const w=await W.world({mode:"on"|"preview"|"off", index:<path>, deny:/^houseDay/});   // boots on Sun 11/15, the week builds
 *   await w.at(2026,11,16,7,0);   // move the clock (every device's day roll + the houseDay tick run)
 *   const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB");
 */
"use strict";
process.env.TZ="America/New_York";
const path=require("path");
const S=require(path.join(__dirname,"demo_week_sandbox.js"));
const FX=JSON.parse(require("fs").readFileSync(path.join(__dirname,"living_demo_family.json"),"utf8"));
const K=o=>Object.assign({src:{kind:"routine"},status:"active",area:"cleaning",verdict:"",note:"",level:1},o);
// The table. Mon 11/16 is day 0 of the replay; wk: 0 = Monday.
function jobs(){ return {
  h_a_teeth:K({label:"Brush teeth",emoji:"🪥",who:"kid_a",slot:"morning",cad:"daily",area:"health",order:0}),
  an_a_fish:K({label:"Feed the fish",emoji:"🐟",who:"kid_a",slot:"morning",cad:"daily",area:"animals",order:1,pts:2}),
  c_a_dishes:K({label:"Unload the dishwasher",emoji:"🍽",who:"kid_a",slot:"chores",cad:"daily",minutes:10,pts:10,can:["kid_a","kid_b"],order:2}),
  c_a_vac:K({label:"Vacuum the den",emoji:"🧹",who:"kid_a",slot:"chores",cad:"wk:0,3",minutes:15,pts:15,order:3}),
  c_a_fold:K({label:"Fold + put away your clothes",emoji:"👕",who:"kid_a",slot:"chores",cad:"daily",laundry:true,minutes:10,pts:10,order:4}),
  an_a_cat:K({label:"Scoop the litter",emoji:"🐈",who:"kid_a",slot:"chores",cad:"daily",area:"animals",pts:5,order:5}),
  c_a_morn:K({label:"Make your bed",emoji:"🛏",who:"kid_a",slot:"morning",cad:"daily",minutes:3,pts:3,order:6}),
  p_a_pick:K({label:"Pickup the den",emoji:"🧸",who:"kid_a",slot:"afternoon",cad:"daily",area:"pickup",rot:"pick",minutes:5,pts:5,order:0}),
  c_b_bath:K({label:"Wipe the bathroom sink",emoji:"🚰",who:"kid_b",slot:"chores",cad:"daily",minutes:10,pts:10,can:["kid_b","kid_a"],order:0}),
  c_b_mop:K({label:"Mop the kitchen",emoji:"🪣",who:"kid_b",slot:"chores",cad:"7d",minutes:15,pts:20,lastDone:"2026-11-07",order:1}),
  c_b_lizard:K({label:"Lizard tank spot-clean",emoji:"🦎",who:"kid_b",slot:"chores",cad:"asneeded",minutes:5,pts:5,order:2}),
  h_b_vit:K({label:"Take your vitamin",emoji:"💊",who:"kid_b",slot:"evening",cad:"daily",area:"health",order:0}),
  p_b_pick:K({label:"Pickup the porch",emoji:"🧺",who:"kid_b",slot:"afternoon",cad:"daily",area:"pickup",rot:"pick",minutes:5,pts:5,order:1}),
  an_c_dog:K({label:"Fill the dog's water",emoji:"🐶",who:"kid_c",slot:"morning",cad:"daily",area:"animals",pts:2,order:0}),
  c_c_toys:K({label:"Toys in the bin",emoji:"🧩",who:"kid_c",slot:"chores",cad:"daily",minutes:5,pts:5,can:["kid_c","kid_a"],order:1}),
  c_c_beds:K({label:"Straighten the beds",emoji:"🛌",who:"kid_c",slot:"chores",cad:"daily",minutes:10,pts:5,order:2}),
  m_tea:K({label:"Morning tea",who:"mom",slot:"morning",cad:"daily",area:"health",src:{kind:"momChore",id:"tea"},order:0}),
  m_fridge:K({label:"Wipe the fridge",who:"mom",slot:"",cad:"daily",minutes:10,src:{kind:"momChore",id:"fridge"},order:1,can:["mom","kid_a"]}),
  d_trash:K({label:"Trash to the curb",who:"dad",slot:"",cad:"daily",area:"pickup",minutes:5,src:{kind:"dadChore",id:"trash"},order:0})
}; }
const PEOPLE={kid_a:{school:30,weekend:30},kid_b:{school:30,weekend:30},kid_c:{school:10,weekend:10},kid_d:{school:0,weekend:0},mom:{school:20,weekend:20},dad:{school:15,weekend:15}};
function household(mode){ const h={jobs:jobs(),people:JSON.parse(JSON.stringify(PEOPLE)),meta:{takeover:1}}; if(mode) h.meta.engine={mode:mode,on:"2026-11-09"}; return h; }
// A Firebase that may refuse some paths (the rules not yet allowing houseDay): set / update / transaction / push on a refused path
// fail with permission_denied and change nothing, the way the real server answers.
function guarded(db,deny){
  const api0=db.api; db.api=function(dev){ const a=api0.call(db,dev), ref=a.ref; a.ref=function(p){ const r=ref(p), q=r.orderByKey; r.startAt=function(){ return r; }; r.endAt=function(){ return r; }; return r; }; return a; };   // a key range reads the whole node here
  if(!deny) return db; const api=db.api, bad=p=>deny.test(String(p||"").replace(/^\/+/,"")), err=()=>{ const e=new Error("PERMISSION_DENIED: Permission denied"); e.code="PERMISSION_DENIED"; return e; };
  db.refused=[];
  db.api=function(dev){ const a=api.call(db,dev), ref=a.ref; a.ref=function(p){ const r=ref(p), P=String(p==null?"":p);
      const wrap=(o)=>{ const set=o.set, upd=o.update, tx=o.transaction, child=o.child;
        o.set=function(v){ if(bad(o.path)){ db.refused.push(["set",o.path]); return Promise.reject(err()); } return set.call(o,v); };
        o.remove=(function(rm){ return function(){ if(bad(o.path)){ db.refused.push(["remove",o.path]); return Promise.reject(err()); } return rm.call(o); }; })(o.remove);
        o.update=function(m){ const ks=Object.keys(m||{}).map(k=>(o.path?o.path+"/":"")+k); if(ks.some(bad)){ db.refused.push(["update",ks.filter(bad)]); return Promise.reject(err()); } return upd.call(o,m); };
        o.transaction=function(fn,done){ if(bad(o.path)){ db.refused.push(["tx",o.path]); const e=err(); if(done) done(e,false,null); return Promise.reject(e); } return tx.call(o,fn,done); };
        o.child=function(c){ return wrap(child.call(o,c)); }; return o; };
      return wrap(r); }; return a; };
  return db;
}
// ARCHCORE (PLAN_archive_window slice 3, 2026-11-22): these worlds compare every write and the whole database with OLDER copies of
// the app, which don't keep the smaller past-weeks copy (archiveCore/). A past-weeks write is now ONE update with both halves; here
// the archiveCore half is left out (never stored, never logged — nothing in these worlds reads it) and the archive half is written
// the way those copies wrote it (set, or remove for a null), so the comparisons still catch every other difference.
// test_archive_core_sync.js tests the copy itself.
function archBlind(db){
  const api0=db.api;
  db.api=function(dev){ const a=api0.call(db,dev), ref=a.ref;
    a.ref=function(p){ const r=ref(p); if(String(p==null?"":p).replace(/^\/+|\/+$/g,"")!=="") return r;
      const upd=r.update;
      r.update=function(m){ const ks=Object.keys(m||{}); if(!ks.some(k=>/^archiveCore\//.test(k))) return upd.call(r,m);
        const rest=ks.filter(k=>!/^archiveCore\//.test(k));
        if(rest.length&&rest.every(k=>/^archive\//.test(k))){ rest.forEach(k=>{ const x=a.ref(k); if(m[k]===null||m[k]===undefined) x.remove(); else x.set(m[k]); }); return Promise.resolve(); }
        const o={}; rest.forEach(k=>{ o[k]=m[k]; }); return rest.length?upd.call(r,o):Promise.resolve(); };
      return r; };
    return a; };
  return db;
}
async function world(o){
  o=o||{}; const fx=JSON.parse(JSON.stringify(FX.db)); fx.household=o.household||household(o.mode);
  if(o.tree) Object.assign(fx,o.tree);
  const clock=S.makeClock(new Date(2026,10,15,0,0,30).getTime()); clock.boot=clock.now; const sched=S.makeScheduler(clock);
  const db=archBlind(guarded(S.makeDb(fx,clock,sched),o.deny));   // ARCHCORE: blind to the smaller past-weeks copy (above)
  const index=o.index||process.env.HOUSE_INDEX||path.join(__dirname,"..","index.html")   /* HOUSE_INDEX: another copy (a mutation check) */, devs=[];
  const w={clock,sched,db,devs,index,
    boot(name,dev,bo){ bo=bo||{}; let seed=0; for(const ch of String(dev)) seed=(seed*31+ch.charCodeAt(0))%2147483647; seed=seed||7; const M=Object.create(Math); M.random=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };   // the same keys on every run
      const d=S.bootDevice({name,dev,db,clock,sched,family:FX.family,indexPath:index,globals:{Math:M}}); if(bo.mom) d.momOn(); else d.run("try{ if(typeof haMomOff==='function') haMomOff(); }catch(e){}"); devs.push(d); return d; },
    async flush(ms){ await sched.run(clock.now+(ms==null?5000:ms)); },
    async at(y,m,d,h,mi){ clock.now=new Date(y,m-1,d,h||0,mi||0,0).getTime(); for(const x of devs){ try{ x.fn("dayRollCheck")(); }catch(e){} } await w.flush(); for(const x of devs){ try{ x.run("typeof hdTick==='function'&&hdTick()"); }catch(e){} } await w.flush(); },
    async tick(){ for(const x of devs){ try{ x.run("typeof hdTick==='function'&&hdTick()"); }catch(e){} } await w.flush(); },
    get:(p)=>db.get(p), mark:()=>db.log.length, since:(m)=>db.log.slice(m)
  };
  const A0=w.boot("boot","devBoot",{mom:true}); await w.flush(60000); try{ A0.fn("dayRollCheck")(); }catch(e){} await w.flush(180000);
  devs.splice(devs.indexOf(A0),1);   // the boot device only builds the week; the tests boot their own
  return w;
}
// Everything a person's lists show, by day: each kid's four lists (raw and on each day of the week, with done marks), Mom's and
// Dad's lists. Plan rows keep their chore id (house) so a test can tell them apart.
const SLOTS=["morning","afternoon","chores","evening"], DAYS=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
function lists(d,o){ o=o||{}; return JSON.parse(d.run("(function(){ const out={}; ROSTER.forEach(function(k){ "+JSON.stringify(SLOTS)+".forEach(function(s){ out[s+'/'+k+'/raw']=rtStepsFor(s,k,true); "
  +JSON.stringify(o.days||DAYS)+".forEach(function(dn){ const st=rtStepsFor(s,k,false,dn)||[]; out[s+'/'+k+'/'+dn]=st.map(function(x,i){ return Object.assign({},x,{_done:s==='morning'?mStepDoneOn(k,dn,i):rtDoneOn(s,k,dn,i),_waved:rtWaved(s,k,dn,i)}); }); }); }); });"
  +" out.mom=mcAll(); out.dad=dcAll(); return JSON.stringify(out); })()")); }
module.exports={world,household,jobs,PEOPLE,lists,SLOTS,DAYS,guarded,archBlind,FX};
