/*
 * 🔎 SPOTCHECK (her ask 2026-10-15): "All the things the kids do each day, a rotation or a random pick of a few things handed to
 * Mom to check each day, and keep a record. If things are checked and not actually done, they become something that gets checked
 * more … If a kid has things not done, more things get checked the next time." Silent on the kid's side; a "not done" costs only
 * the item's own points.
 *
 * Checks: (1) the pool — self-checked chores, laundry steps and school cards; Mom-/Dad-checked, waved, helper, Mom-verified and
 * family cards left out; (2) the daily draw — n picks, random, fixed once drawn (a transaction keeps the first device's), drawn at
 * school end or on 🎲 Draw now, dry run writes nothing; (3) ✗ runs CHOREUNDO's undo and reverses the item's own stars, a school card
 * goes through ↩ Unmark; ✓ only records; (4) escalation +1 per ✗ (cap 5) with the type kept, −1 per clean day (floor 2, types
 * cleared); (5) the record; (6) Mom gate — nothing drawn, written or rendered off Mom mode; (7) wiring.
 *                                                                                                 run: node test_spot_check.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const SP=cut("// SPOTCHECK_START","// SPOTCHECK_END"), CU=cut("// CHOREUNDO_START","// CHOREUNDO_END"), WAVE=cut("// WAVE_START","// WAVE_END"), LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const NAMES=["toggleRtStep","toggleMorningStep","rlogAppend","bankDirect","bankDirectRemove","laundryAdvance","laundryAdvanceLabel","laundrySince","laundryT",
  "momBlockKey","momBlockFor","momBlocksOnValue","_lbWrite","_lbQ","laundryBlockDone","laundryKidHook","laundryStarts","laundryStartGuess","laundryKidId","laundryLooseWord","mStepDoneOn","rtDoneOn","rtDueOrLate","rtComplete"];
const ISO="2026-10-15";

function mk(o){
  o=o||{}; const ls={}, writes=[], toasts=[], tx=[];
  const steps={morning:{lucy:[{emoji:"🦷",label:"Brush Teeth",pts:0,cad:"daily"},{emoji:"🫧",label:"Make your bed",pts:5,cad:"daily"}],julian:[]},
    chores:{lucy:[{emoji:"🧺",label:"Start a load of laundry",pts:10,cad:"daily"},{emoji:"🍽️",label:"Unload the dishwasher",pts:15,cad:"daily"},{emoji:"🧹",label:"Sweep the kitchen",pts:8,cad:"daily"}],julian:[]},
    afternoon:{lucy:[],julian:[]},evening:{lucy:[],julian:[]}};
  const ref=p=>({set:v=>{ writes.push(["set",p,JSON.parse(JSON.stringify(v))]); },update:v=>{ writes.push(["update",p,JSON.parse(JSON.stringify(v))]); },remove:()=>{ writes.push(["rm",p]); },push:()=>({key:"rl"+writes.length}),
    transaction:fn=>{ const cur=(o.server||{})[p]||null; const v=fn(cur); tx.push([p,v===undefined?"abort":JSON.parse(JSON.stringify(v))]); if(v!==undefined) writes.push(["tx",p,JSON.parse(JSON.stringify(v))]); }});
  const unmark={onclick:null};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, db:o.nodb?null:{ref:ref}, _dryRun:()=>!!o.dry,
    obSet:(p,v)=>{ writes.push(["set",p,JSON.parse(JSON.stringify(v))]); }, obRemove:p=>{ writes.push(["rm",p]); }, obNoteSl:()=>{},
    RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    ROSTER:["lucy","julian"], KID_NAME:{lucy:"Lucy",julian:"Julian"}, PACE_KCOL:{}, cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    _todayDay:"thursday", day:"thursday", WK:"week7", activeWk:()=>"week7", slState:o.sl||{}, bank:o.bank||{}, routineLog:{}, rtOpen:{}, rtOpenKey:(s,k)=>s+k, mrOpen:{},
    rtStepsFor:(slot,kid)=>steps[slot][kid]||[], morningStepsFor:kid=>steps.morning[kid]||[], morningDueIdx:()=>[0,1], morningComplete:()=>false, dsAutoStart:()=>{},
    stepWindowOk:()=>true, cadDueOn:()=>true, rtLateDays:()=>0, routineEditable:()=>true, rtStepAvail:()=>true, rtAvailable:()=>true, _rtBlockedToast:()=>{},
    zoneBonusFor:()=>0, choreVerifyOn:()=>false, rtBonusSettle:()=>{}, rtDayBonusSettle:()=>{}, sv:()=>{}, renderSkylight:()=>{},
    nowTs:()=>"2:10 PM Oct 15", mwTodayIso:()=>o.iso||ISO, _lbNowMin:()=>14*60+10, laundryData:{}, momBlocks:{}, laundryTimes:{wash:50,dry:60,grace:5},
    momHere:()=>!o.notMom&&!o.kidTick, _kioskD:()=>!!o.dad, tab:o.tab||"moms-plan", renderMomsPlan:()=>{}, renderAll:()=>{}, mwToast:t=>toasts.push(t), gwShowToast:t=>toasts.push(t), confirm:()=>o.confirm!==false, dbg:()=>{},
    document:{getElementById:id=>id==="dlg-uncheck"?unmark:({})}, unmark,
    weekData:{tasks:o.tasks||[]}, checked:o.checked||{}, histState:o.hist||{}, effectiveDay:t=>t.day, _ckLogTodayTs:()=>true, needsVerify:t=>!!t.verify,
    pendingId:null, pendingClaimMode:false, rvSchoolEndMin:()=>o.endMin!=null?o.endMin:0, fromMin:m=>Math.floor(m/60)+":"+String(m%60).padStart(2,"0"),
    writes, toasts, tx, ls};
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+WAVE+"\n"+NAMES.map(slice).join("\n")+"\n"+CU+"\n"+SP, ctx);
  if(o.spot) vm.runInContext("spotData="+JSON.stringify(o.spot),ctx);
  return ctx;
}
const adj=(c,kid)=>Object.values((c.bank[kid]||{}).adjustments||{});
const bal=(c,kid)=>adj(c,kid).filter(a=>!a.held).reduce((n,a)=>n+(a.amount||0),0);
// a kid's own tick: not Mom, not Dad
function kidTick(c,slot,i){ vm.runInContext("momHere=()=>false",c); if(slot==="morning") c.toggleMorningStep("lucy",i); else c.toggleRtStep(slot,"lucy",i); vm.runInContext("momHere=()=>true",c); }
const TASKS=[{id:"t1",who:"lucy",day:"thursday",title:"Math — Lesson 12"},{id:"t2",who:"lucy",day:"thursday",title:"Reading — Ch 4"},{id:"t3",who:"lucy",day:"thursday",title:"Spelling — L8",verify:true},
  {id:"t4",who:"lucy",day:"thursday",title:"Family read-aloud",famBlock:true},{id:"t5",who:"lucy",day:"thursday",title:"Art with Grandma"},{id:"t6",who:"lucy",day:"wednesday",title:"Yesterday's"},{id:"t7",who:"lucy",day:"thursday",title:"Unchecked"}];
const CK={t1:"9:30 AM Oct 15",t2:"10:00 AM Oct 15",t3:"10:30 AM Oct 15",t4:"11:00 AM Oct 15",t5:"11:30 AM Oct 15",t6:"9:00 AM Oct 14"};
const HIST={t1:{id:"t1"},t2:{id:"t2",by:"mom"},t3:{id:"t3"},t4:{id:"t4"},t5:{id:"t5",helper:"Grandma"},t6:{id:"t6"}};

console.log("(1) The pool: what the kid checked off themselves");
{ const c=mk({tasks:TASKS,checked:CK,hist:HIST});
  kidTick(c,"chores",0); kidTick(c,"chores",1); kidTick(c,"morning",1);
  c.mdKidTick("chores","lucy","thursday",2);   // Mom's tick from Kids today
  const P=c.spPool("lucy","thursday"), ks=P.map(p=>p.k).sort();
  ok("the kid's own ticks are in: laundry step, chore, morning step", ks.includes("s:chores:0")&&ks.includes("s:chores:1")&&ks.includes("s:morning:1"), ks);
  ok("types: the laundry step is 'laundry', the rest 'chore'", P.find(p=>p.k==="s:chores:0").type==="laundry"&&P.find(p=>p.k==="s:chores:1").type==="chore");
  ok("Mom's tick is stamped by:'mom' and left out", c.slState["week7_thursday_lucy_cstep2"].by==="mom"&&!ks.includes("s:chores:2"), c.slState);
  ok("a kid's tick carries no by", !("by" in c.slState["week7_thursday_lucy_cstep1"]));
  ok("school: only the kid-checked card t1 (Mom-checked t2, Mom-verified t3, family t4, helper t5, yesterday t6, unchecked t7 out)", P.filter(p=>p.type==="school").map(p=>p.id).join()==="t1", P.filter(p=>p.type==="school"));
  ok("each item carries when it was ticked", P.find(p=>p.k==="t:t1").ts==="9:30 AM"&&P.find(p=>p.k==="s:chores:1").ts==="2:10 PM");
  vm.runInContext("rtWave('chores','lucy','thursday',1)",c);
  ok("a waved chore is out (WAVE)", !c.spPool("lucy","thursday").some(p=>p.k==="s:chores:1"));
  const d=mk({dad:true,notMom:true}); d.toggleRtStep("chores","lucy",1);
  ok("Dad's link: stamped by:'dad', out of the pool", d.slState["week7_thursday_lucy_cstep1"].by==="dad"&&d.spPool("lucy","thursday").length===0);
  ok("finalizeDone stamps the history entry the same way", /entry\.by=_sb/.test(slice("finalizeDone")));
}
console.log("(2) The daily draw: random, n picks, fixed once drawn");
{ const c=mk({tasks:TASKS,checked:CK,hist:HIST});
  kidTick(c,"chores",0); kidTick(c,"chores",1); kidTick(c,"chores",2); kidTick(c,"morning",1);
  ok("spDraw is random within the pool (all 5 items get picked across seeds)", (()=>{ const pool=c.spPool("lucy","thursday"), seen={}; for(let s=0;s<200;s++) c.spDraw(pool,2,{}).forEach(p=>seen[p.k]=1); return Object.keys(seen).length===pool.length; })());
  ok("spDraw never repeats an item and stops at the pool size", (()=>{ const pool=c.spPool("lucy","thursday"); const a=c.spDraw(pool,2,{}), b=c.spDraw(pool,9,{}); return a.length===2&&a[0].k!==a[1].k&&b.length===pool.length; })());
  const r=c.spEnsureDraw("lucy",false);
  ok("drawn (after school end): 2 picks, count 2 recorded", r&&r.picks.length===2&&r.n===2, r);
  ok("written by a transaction on spotChecks/lucy/<iso>", c.tx.length===1&&c.tx[0][0]==="spotChecks/lucy/"+ISO&&c.tx[0][1].picks.length===2, c.tx);
  ok("no undefined fields in the write (Firebase refuses them)", !JSON.stringify(c.tx[0][1]).includes("undefined")&&c.tx[0][1].picks.every(p=>Object.values(p).every(v=>v!==undefined)));
  const k0=r.picks.map(p=>p.k).join();
  ok("fixed for the day: a second call returns the same picks and writes nothing", c.spEnsureDraw("lucy",true).picks.map(p=>p.k).join()===k0&&c.tx.length===1);
  const s=mk({server:{["spotChecks/lucy/"+ISO]:{n:2,picks:[{k:"x"}]}}}); kidTick(s,"chores",1);
  s.spEnsureDraw("lucy",true);
  ok("another device drew first → the transaction aborts (its picks stand)", s.tx.length===1&&s.tx[0][1]==="abort", s.tx);
  const e=mk({endMin:24*60}); kidTick(e,"chores",1);
  ok("before school end: no draw", e.spEnsureDraw("lucy",false)===null&&e.tx.length===0);
  e.spDrawNow("lucy"); ok("🎲 Draw now draws anyway", !!e.spDay("lucy",ISO)&&e.tx.length===1);
  const z=mk(); ok("empty pool: nothing drawn, nothing written", z.spEnsureDraw("lucy",true)===null&&z.writes.length===0);
  const dr=mk({dry:true}); kidTick(dr,"chores",1); dr.writes.length=0;
  ok("?dryrun=1: drawn locally, nothing written", dr.spEnsureDraw("lucy",true).picks.length===1&&dr.writes.length===0&&dr.tx.length===0);
}
console.log("(3) ✓ / ✗ — ✗ is CHOREUNDO's undo for that item");
{ const c=mk(); kidTick(c,"chores",1); kidTick(c,"chores",0);
  ok("setup: +25 banked by the kid", bal(c,"lucy")===25);
  vm.runInContext("spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'s:chores:1',kind:'step',slot:'chores',i:1,d:'thursday',label:'Unload the dishwasher',type:'chore',pts:15},{k:'s:chores:0',kind:'step',slot:'chores',i:0,d:'thursday',label:'Start a load of laundry',type:'laundry',pts:10}]}}}",c);
  c.writes.length=0;
  ok("✗ Not done → the chore is back to not done", c.spResolve("lucy",0,"no")===true&&!c.rtDoneOn("chores","lucy","thursday",1));
  ok("its own 15 ⭐ come back off as '↶ Mom undid' (nothing else docked)", bal(c,"lucy")===10&&adj(c,"lucy").some(a=>a.amount===-15&&/↶ Mom undid: Unload the dishwasher/.test(a.note))&&!adj(c,"lucy").some(a=>a.amount===-100), adj(c,"lucy"));
  ok("the log line says Mom undid it", Object.values(c.routineLog.lucy.week7.thursday).some(r=>r.act==="off"&&r.undo==="mom"));
  ok("result written: spotChecks/lucy/<iso>/results/0 {r:'no', n:2}", c.writes.some(w=>w[0]==="set"&&w[1]==="spotChecks/lucy/"+ISO+"/results/0"&&w[2].r==="no"&&w[2].n===2), c.writes);
  ok("a pick is resolved once", c.spResolve("lucy",0,"ok")===false);
  const n=c.writes.length;
  ok("✓ Really done only records — still done, stars untouched", c.spResolve("lucy",1,"ok")===true&&c.rtDoneOn("chores","lucy","thursday",0)&&bal(c,"lucy")===10&&c.writes.length===n+1&&c.writes[n][2].r==="ok");
  const x=mk({confirm:false}); kidTick(x,"chores",1); vm.runInContext("spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'s:chores:1',kind:'step',slot:'chores',i:1,d:'thursday',label:'Unload the dishwasher',type:'chore',pts:15}]}}}",x);
  ok("✗ cancelled at the confirm: nothing changes", x.spResolve("lucy",0,"no")===false&&x.rtDoneOn("chores","lucy","thursday",1)&&!x.spDay("lucy",ISO).results);
  const m=mk(); kidTick(m,"chores",1);
  vm.runInContext("spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'s:chores:4',kind:'step',slot:'chores',i:4,d:'thursday',label:'Unload the dishwasher',type:'chore',pts:15}]}}}",m);
  ok("the list was edited since the draw: found by its label", m.spResolve("lucy",0,"no")===true&&!m.rtDoneOn("chores","lucy","thursday",1));
  const t=mk({tasks:TASKS,checked:Object.assign({},CK),hist:HIST}); let un=null; t.unmark.onclick=function(){ un=t.pendingId; delete t.checked[t.pendingId]; };
  vm.runInContext("spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'t:t1',kind:'task',id:'t1',d:'thursday',label:'Math — Lesson 12',type:'school',pts:0}]}}}",t);
  ok("a school card ✗ goes back through the card's own ↩ Unmark", t.spResolve("lucy",0,"no")===true&&un==="t1"&&!t.checked.t1);
}
console.log("(4) Escalation: +1 per ✗ (cap 5), the type kept; −1 per clean day (floor 2)");
{ const c=mk(); kidTick(c,"chores",1); kidTick(c,"chores",0); kidTick(c,"chores",2); kidTick(c,"morning",1); kidTick(c,"morning",0);
  ok("starts at 2", c.spLevel("lucy").n===2);
  vm.runInContext("spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'s:chores:0',kind:'step',slot:'chores',i:0,d:'thursday',label:'Start a load of laundry',type:'laundry',pts:10},{k:'s:chores:1',kind:'step',slot:'chores',i:1,d:'thursday',label:'Unload the dishwasher',type:'chore',pts:15}]}}}",c);
  c.writes.length=0; c.spResolve("lucy",0,"no");
  ok("a ✗ → 3 a day, laundry kept in the draw; level written to spotChecks/lucy/level", c.spLevel("lucy").n===3&&c.spLevel("lucy").types.laundry===true&&c.writes.some(w=>w[0]==="set"&&w[1]==="spotChecks/lucy/level"&&w[2].n===3), c.writes);
  c.spResolve("lucy",1,"no"); ok("a second ✗ the same day → 4, chore kept too", c.spLevel("lucy").n===4&&c.spLevel("lucy").types.chore===true);
  vm.runInContext("spotData.lucy.level.n=5",c); vm.runInContext("spotData.lucy['"+ISO+"'].results={}",c); c.spResolve("lucy",0,"no");
  ok("cap 5", c.spLevel("lucy").n===5);
  ok("the kept type is always in the draw while raised", (()=>{ const pool=[{k:"a",type:"chore"},{k:"b",type:"chore"},{k:"c",type:"school"},{k:"d",type:"laundry"},{k:"e",type:"chore"}]; for(let s=0;s<100;s++){ if(!c.spDraw(pool,2,{laundry:true}).some(p=>p.type==="laundry")) return false; } return true; })());
  // clean days
  const day=(n,res)=>({n:n,picks:[{k:"a",type:"chore"},{k:"b",type:"chore"}],results:res});
  const ok2={0:{r:"ok"},1:{r:"ok"}};
  const e=mk({iso:"2026-10-20",spot:{lucy:{level:{n:4,types:{laundry:true},settled:"2026-10-15"},"2026-10-15":day(3,{0:{r:"no"},1:{r:"ok"}}),"2026-10-16":day(4,ok2),"2026-10-17":day(3,{0:{r:"ok"}}),"2026-10-19":day(3,ok2)}}});
  const L=e.spSettle("lucy","2026-10-20");
  ok("two clean days (16th, 19th) → 4−2 = 2; the half-checked 17th changes nothing; types cleared at 2; settled through the 19th", L.n===2&&!Object.keys(L.types).length&&L.settled==="2026-10-19", L);
  ok("settling twice doesn't lower again", e.spSettle("lucy","2026-10-20").n===2);
  const f=mk({iso:"2026-10-20",spot:{lucy:{level:{n:2,types:{},settled:""},"2026-10-16":day(2,ok2),"2026-10-19":day(2,ok2)}}});
  ok("floor 2", f.spSettle("lucy","2026-10-20").n===2);
  const g=mk({iso:"2026-10-20",spot:{lucy:{level:{n:5,types:{chore:true}},"2026-10-19":day(5,ok2)}}});
  ok("one clean day from 5 → 4, the type still kept", (()=>{ const l=g.spSettle("lucy","2026-10-20"); return l.n===4&&l.types.chore===true; })());
  const h=mk({iso:"2026-10-20",spot:{lucy:{level:{n:3,types:{chore:true},settled:"2026-10-15"},"2026-10-19":day(3,ok2)}}}); kidTick(h,"chores",1); kidTick(h,"chores",0); kidTick(h,"chores",2);
  ok("the draw settles first, then draws at the new count (3 → 2 picks)", h.spEnsureDraw("lucy",true).picks.length===2&&h.spLevel("lucy").n===2);
  const r=mk({spot:{lucy:{level:{n:4,types:{}}}}}); [0,1,2].forEach(i=>kidTick(r,"chores",i)); kidTick(r,"morning",0); kidTick(r,"morning",1);
  ok("a raised count draws that many", r.spEnsureDraw("lucy",true).picks.length===4);
}
console.log("(5) The record");
{ const c=mk({spot:{lucy:{level:{n:3},"2026-10-14":{n:2,picks:[{label:"Sweep",type:"chore",emoji:"🧹"},{label:"Math",type:"school"}],results:{0:{r:"no",n:2},1:{r:"ok",n:2}}},"2026-10-15":{n:3,picks:[{label:"Bed",type:"chore"}]}}}});
  const R=c.spRecord("lucy");
  ok("newest first: date, item, result, count at the time; not-yet-checked shows blank", R.length===3&&R[0].iso==="2026-10-15"&&R[0].r===""&&R[0].n===3&&R[1].label==="Sweep"&&R[1].r==="no"&&R[1].n===2&&R[2].r==="ok", R);
  c.spRecToggle("lucy"); const H=c.mdCardSpotCheck();
  ok("📜 record opens on the card with each line", /2026-10-14/.test(H)&&/✗ not done/.test(H)&&/✓ done/.test(H)&&/2\/day/.test(H), H);
}
console.log("The card");
{ const c=mk({tasks:TASKS,checked:CK,hist:HIST}); kidTick(c,"chores",1); kidTick(c,"chores",0);
  const H=c.mdCardSpotCheck();
  ok("🔎 Spot check card: item, who, when ticked, ✓ Really done / ✗ Not done", /🔎<\/span> Spot check · 2 to check/.test(H)&&/Lucy/.test(H)&&/ticked/.test(H)&&/spResolve\('lucy',0,'ok'\)/.test(H)&&/spResolve\('lucy',1,'no'\)/.test(H), H);
  ok("a kid with nothing self-checked says so (no draw button)", /Nothing Julian checked off themselves yet today/.test(H)&&!/spDrawNow\('julian'\)/.test(H));
  const e=mk({endMin:24*60}); kidTick(e,"chores",1);
  ok("before school end: 'drawn at …' + 🎲 Draw now", /Picks are drawn at 24:00/.test(e.mdCardSpotCheck())&&/spDrawNow\('lucy'\)/.test(e.mdCardSpotCheck()));
  const r=mk({spot:{lucy:{level:{n:4}}}}); ok("a raised count shows ▲", /4 a day ▲/.test(r.mdCardSpotCheck()));
}
console.log("(6) Mom gate — nothing off Mom mode");
{ const c=mk({notMom:true,tasks:TASKS,checked:CK,hist:HIST}); c.toggleRtStep("chores","lucy",1); c.writes.length=0;
  ok("no card", c.mdCardSpotCheck()==="");
  ok("no draw, no write", c.spEnsureDraw("lucy",true)===null&&c.writes.length===0&&c.tx.length===0);
  vm.runInContext("spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'s:chores:1',kind:'step',slot:'chores',i:1,d:'thursday',label:'Unload the dishwasher',type:'chore',pts:15}]}}}",c);
  ok("no resolve: still done, bank untouched", c.spResolve("lucy",0,"no")===false&&c.rtDoneOn("chores","lucy","thursday",1)&&bal(c,"lucy")===15&&c.writes.length===0);
  ok("the kid's own tick is the same check-off as before (no new field, no new write)", JSON.stringify(Object.keys(c.slState["week7_thursday_lucy_cstep1"]))==='["done","ts","pts","bid"]');
}
console.log("(7) Wiring");
const KT=slice("mdCardKidsToday");
ok("the card sits under Kids today on Mom's Day only (bank row, no Dad control)", /if\(bank&&dadCtl===undefined&&typeof mdCardSpotCheck==="function"\)\{ try\{ h\+=mdCardSpotCheck\(\); \}catch\(e\)\{\} \}/.test(KT)&&(src.match(/h\+=mdCardSpotCheck\(\)/g)||[]).length===1);
ok("not on Dad's Day, Mom's Day header, kids' pages or the skylight", ["renderMomsDay","renderDadsDay","renderSkylight","mrIndividualHTML"].every(n=>{ try{ return !/mdCardSpotCheck|spotData|spPool/.test(slice(n)); }catch(e){ return true; } }));
ok("kid side: spot-check names appear nowhere outside the block, the listener and the Kids today line", (()=>{ const rest=src.replace(SP,""); const hits=(rest.match(/spotData|mdCardSpotCheck|spResolve|spEnsureDraw|spotOnValue/g)||[]); return hits.length===3; })(), (src.replace(SP,"").match(/spotData|mdCardSpotCheck|spResolve|spEnsureDraw|spotOnValue/g)||[]));
ok("both step check-offs stamp by when Mom / Dad ticks", (src.match(/if\(now&&typeof _spBy==="function"&&_spBy\(\)\) slState\[sk\]\.by=_spBy\(\);/g)||[]).length===2&&/_spBy/.test(slice("toggleRtStep"))&&/_spBy/.test(slice("toggleMorningStep")));
ok("listener on spotChecks, re-render only on Mom's Day in Mom mode", /db\.ref\("spotChecks"\)\.on\("value",s=>\{ spotOnValue\(s\.val\(\)\|\|\{\}\); if\(tab==="moms-plan"&&momHere\(\)\) renderAll\(\); \}\);/.test(src));
ok("writes are targeted: no set() on spotChecks or spotChecks/<kid> as a whole", !/ref\("spotChecks"\)\.set|ref\("spotChecks\/"\+kid\)\.set/.test(SP));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
