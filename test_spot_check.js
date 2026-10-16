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
 * cleared); (5) the record; (6) Mom gate — nothing drawn, written or rendered off Mom mode; (7) wiring;
 * (8) ⚙ what the draw picks from (her ask 2026-10-15: "I want the draw to only include school cards if that option is picked, so
 * option settings would be great") — settings/spotCheck/types, missing = all on; (9) −pts if not done (her ask: "the option to
 * take off -100 because it's the rules if not done") — settings/spotCheck/penalty {on,pts}, missing = off; (10) 🔎 on Mom's
 * afternoon checklist (her ask: "make the spot check go to Mom's afternoon checklist and say spot check") — a derived row.
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
  const unmark={onclick:null}, confirms=[];
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
    momHere:()=>!o.notMom&&!o.kidTick, _kioskD:()=>!!o.dad, tab:o.tab||"moms-plan", renderMomsPlan:()=>{}, renderAll:()=>{}, mwToast:t=>toasts.push(t), gwShowToast:t=>toasts.push(t), confirm:t=>{ confirms.push(t); return o.confirm!==false; }, dbg:()=>{},
    document:{getElementById:id=>id==="dlg-uncheck"?unmark:({})}, unmark,
    weekData:{tasks:o.tasks||[]}, checked:o.checked||{}, histState:o.hist||{}, effectiveDay:t=>t.day, _ckLogTodayTs:()=>true, needsVerify:t=>!!t.verify,
    DAYS:["monday","tuesday","wednesday","thursday","friday","saturday"], mdTodayName:()=>o.dn||"thursday", scheduleBreakToday:()=>o.brk||null, setTimeout:f=>f(),
    pendingId:null, pendingClaimMode:false, rvSchoolEndMin:()=>o.endMin!=null?o.endMin:0, fromMin:m=>Math.floor(m/60)+":"+String(m%60).padStart(2,"0"),
    writes, toasts, tx, ls, confirms};
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+WAVE+"\n"+NAMES.map(slice).join("\n")+"\n"+CU+"\n"+SP, ctx);
  if(o.spot) vm.runInContext("spotData="+JSON.stringify(o.spot),ctx);
  if(o.set) vm.runInContext("spotSet="+JSON.stringify(o.set),ctx);
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
console.log("(8) ⚙ What the draw picks from — settings/spotCheck/types");
{ const all=c=>{ kidTick(c,"chores",0); kidTick(c,"chores",1); kidTick(c,"morning",1); return c; };
  const c=all(mk({tasks:TASKS,checked:CK,hist:HIST}));
  ok("default (nothing saved): all on — chores, laundry and school in the pool", (()=>{ const t=c.spTypes(), ty=[...new Set(c.spPool("lucy","thursday").map(p=>p.type))].sort().join(); return t.chore&&t.laundry&&t.school&&ty==="chore,laundry,school"; })(), c.spPool("lucy","thursday"));
  const s=all(mk({tasks:TASKS,checked:CK,hist:HIST,set:{types:{chore:false,laundry:false}}}));
  ok("school only: the pool is just the school card", s.spPool("lucy","thursday").map(p=>p.k).join()==="t:t1", s.spPool("lucy","thursday"));
  ok("school only: every draw is school", (()=>{ for(let k=0;k<50;k++){ const pool=c.spPool("lucy","thursday"); if(s.spDraw(pool,3,{}).some(p=>p.type!=="school")) return false; } return true; })());
  const r=all(mk({tasks:TASKS,checked:CK,hist:HIST,set:{types:{chore:false}},spot:{lucy:{level:{n:4,types:{chore:true}}}}}));
  ok("a raised kid with 'chore' kept but Chores off: never a chore, even from a pool that has one", (()=>{ const pool=c.spPool("lucy","thursday"); for(let k=0;k<50;k++){ if(r.spDraw(pool,4,{chore:true}).some(p=>p.type==="chore")) return false; } return true; })());
  ok("…and the real draw for that kid picks only laundry + school", (()=>{ const d=r.spEnsureDraw("lucy",true); return d&&d.picks.length===2&&d.picks.every(p=>p.type!=="chore"); })(), r.spDay("lucy",ISO));
  const m=all(mk({tasks:TASKS,checked:CK,hist:HIST})); const d0=m.spEnsureDraw("lucy",true), k0=d0.picks.map(p=>p.k).join(); m.writes.length=0;
  ok("⚙ tap writes that one switch: settings/spotCheck/types/school = false", m.spSetType("school")===true&&m.writes.length===1&&m.writes[0][0]==="set"&&m.writes[0][1]==="settings/spotCheck/types/school"&&m.writes[0][2]===false, m.writes);
  ok("a mid-day switch leaves today's picks as drawn", m.spEnsureDraw("lucy",true).picks.map(p=>p.k).join()===k0&&m.spDay("lucy",ISO).picks.map(p=>p.k).join()===k0);
  ok("…and the card still lists them", (()=>{ const H=m.mdCardSpotCheck(); return d0.picks.every(p=>H.indexOf(p.label.replace(/</g,"&lt;"))>=0); })());
  m.spSetType("school"); ok("tapped again → back on (true written)", m.writes[1][1]==="settings/spotCheck/types/school"&&m.writes[1][2]===true&&m.spTypes().school);
  const z=all(mk({tasks:TASKS,checked:CK,hist:HIST,set:{types:{chore:false,laundry:false,school:false}}}));
  ok("all off: no draw, nothing written", z.spOn()===false&&z.spEnsureDraw("lucy",true)===null&&z.spEnsureDraw("lucy",false)===null&&z.tx.length===0);
  ok("all off: the card says it's paused (no 🎲 Draw now)", (()=>{ const H=z.mdCardSpotCheck(); return /Spot check is paused — ⚙ to pick what it checks\./.test(H)&&!/spDrawNow/.test(H); })());
  ok("the card has a ⚙ in its header; the sheet opens with three switches", (()=>{ const H=c.mdCardSpotCheck(); c.spSetToggle(); const S=c.mdCardSpotCheck(); return /onclick="spSetToggle\(\)"[^>]*>⚙<\/button>/.test(H)&&!/spSetType/.test(H)&&/spSetType\('chore'\)/.test(S)&&/spSetType\('laundry'\)/.test(S)&&/spSetType\('school'\)/.test(S)&&/Chores/.test(S)&&/Laundry/.test(S)&&/School cards/.test(S); })());
  const k=mk({notMom:true}); ok("off Mom mode: the switch does nothing", k.spSetType("chore")===false&&k.writes.length===0&&k.spTypes().chore);
  const dr=mk({dry:true}); dr.spSetType("chore"); ok("?dryrun=1: switch flips locally, nothing written", dr.spTypes().chore===false&&dr.writes.length===0);
  ok("listener on settings/spotCheck feeds spotSetOnValue", /db\.ref\("settings\/spotCheck"\)\.on\("value",s=>\{ if\(typeof spotSetOnValue==="function"\) spotSetOnValue\(s\.val\(\)\);/.test(src));
}
console.log("(9) −pts if not done — settings/spotCheck/penalty, off unless she turns it on");
{ const PICK="spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'s:chores:1',kind:'step',slot:'chores',i:1,d:'thursday',label:'Unload the dishwasher',type:'chore',pts:15}]}}}";
  const c=mk(); kidTick(c,"chores",1); vm.runInContext(PICK,c);
  ok("off by default (nothing saved): spPenalty().on false, shown amount 100", c.spPenalty().on===false&&c.spPenalty().pts===100);
  c.spResolve("lucy",0,"no");
  ok("off: ✗ takes back only the item's own 15 ⭐ — no penalty entry, no pen on the result", bal(c,"lucy")===0&&!adj(c,"lucy").some(a=>/Spot check: not done/.test(a.note))&&!c.spDay("lucy",ISO).results[0].pen, adj(c,"lucy"));
  ok("off: the confirm says nothing about a penalty", c.confirms.length===1&&!/rule/.test(c.confirms[0]), c.confirms);
  const o=mk({set:{penalty:{on:true,pts:100}}}); kidTick(o,"chores",1); vm.runInContext(PICK,o); o.writes.length=0;
  ok("on: ✗ resolves", o.spResolve("lucy",0,"no")===true);
  ok("on: the item's own 15 ⭐ come back off ('↶ Mom undid')", adj(o,"lucy").some(a=>a.amount===-15&&/↶ Mom undid: Unload the dishwasher/.test(a.note)));
  ok("on: AND −100 banked as '🔎 Spot check: not done — Unload the dishwasher'", adj(o,"lucy").some(a=>a.amount===-100&&a.note==="🔎 Spot check: not done — Unload the dishwasher")&&bal(o,"lucy")===-100, adj(o,"lucy"));
  ok("on: the −100 is a targeted bank/lucy/adjustments/<id> write", o.writes.some(w=>w[0]==="set"&&/^bank\/lucy\/adjustments\/bd/.test(w[1])&&w[2].amount===-100), o.writes);
  ok("on: the confirm names both amounts", /its 15 ⭐ come back off/.test(o.confirms[0])&&/−100 ⭐ more for not doing it/.test(o.confirms[0]), o.confirms);
  ok("on: the result carries pen:100", o.writes.some(w=>w[1]==="spotChecks/lucy/"+ISO+"/results/0"&&w[2].pen===100));
  o.spRecToggle("lucy"); const R=o.spRecord("lucy");
  ok("📜 record shows the penalty", R[0].pen===100&&/✗ not done · −100 ⭐/.test(o.mdCardSpotCheck()));
  const k=mk({set:{penalty:{on:true,pts:100}}}); kidTick(k,"chores",1); vm.runInContext(PICK,k); k.spResolve("lucy",0,"ok");
  ok("on: ✓ Really done takes nothing off", bal(k,"lucy")===15&&!adj(k,"lucy").some(a=>a.amount<0));
  const x=mk({confirm:false,set:{penalty:{on:true,pts:100}}}); kidTick(x,"chores",1); vm.runInContext(PICK,x);
  ok("on, cancelled at the confirm: nothing taken off", x.spResolve("lucy",0,"no")===false&&bal(x,"lucy")===15);
  const a=mk({set:{penalty:{on:true,pts:50}}}); kidTick(a,"chores",1); vm.runInContext(PICK,a); a.spResolve("lucy",0,"no");
  ok("her amount is used (50)", adj(a,"lucy").some(e=>e.amount===-50)&&/−50 ⭐ more/.test(a.confirms[0]));
  const w=mk(); w.writes.length=0; w.spSetPenOn();
  ok("the switch writes settings/spotCheck/penalty/on = true and the shown 100 as pts", w.spPenalty().on&&w.writes.some(e=>e[1]==="settings/spotCheck/penalty/on"&&e[2]===true)&&w.writes.some(e=>e[1]==="settings/spotCheck/penalty/pts"&&e[2]===100), w.writes);
  w.writes.length=0; w.spSetPenPts("75");
  ok("the amount box writes settings/spotCheck/penalty/pts = 75 only", w.spPenalty().pts===75&&w.writes.length===1&&w.writes[0][1]==="settings/spotCheck/penalty/pts"&&w.writes[0][2]===75, w.writes);
  w.writes.length=0; ok("a bad amount writes nothing", w.spSetPenPts("abc")===false&&w.spSetPenPts("-5")===false&&w.writes.length===0);
  w.spSetPenOn(); ok("off again: on = false", !w.spPenalty().on&&w.writes.some(e=>e[1]==="settings/spotCheck/penalty/on"&&e[2]===false));
  w.spSetToggle(); const S=w.mdCardSpotCheck();
  ok("the sheet: '✗ Not done also takes off [75] ⭐' with its switch", /spSetPenOn\(\)/.test(S)&&/✗ Not done also takes off/.test(S)&&/value="75"/.test(S)&&/spSetPenPts\(this\.value\)/.test(S), S);
  const n=mk({notMom:true}); ok("off Mom mode: the switch and the box do nothing", n.spSetPenOn()===false&&n.spSetPenPts(20)===false&&n.writes.length===0);
  const d=mk({dry:true}); d.spSetPenOn(); ok("?dryrun=1: the switch flips locally, nothing written", d.spPenalty().on&&d.writes.length===0);
}
console.log("(10) 🔎 Spot check on Mom's afternoon checklist — derived, never in momChores");
{ const PICKS="spotData={lucy:{'"+ISO+"':{n:2,picks:[{k:'a',label:'A',type:'chore'},{k:'b',label:'B',type:'chore'}]}}}";
  ok("off school days: no row (Sunday; a break day)", mk({dn:"sunday"}).spMomRow()===null&&mk({brk:{name:"Fall break"}}).spMomRow()===null);
  ok("draw off (all switches off): no row", mk({set:{types:{chore:false,laundry:false,school:false}}}).spMomRow()===null);
  ok("off Mom mode: no row", mk({notMom:true}).spMomRow()===null);
  const b=mk(); kidTick(b,"chores",1);
  const r0=b.spMomRow();
  ok("before the draw: '🔎 Spot check — tap to draw', not done", r0&&!r0.drawn&&!r0.done&&/🔎 Spot check — tap to draw/.test(b.spMomRowHTML(r0))&&/onclick="spMomRowTap\(\)"/.test(b.spMomRowHTML(r0)), r0);
  let scrolled=0; b.document.getElementById=id=>id==="sp-card"?{scrollIntoView:()=>{ scrolled++; }}:(id==="dlg-uncheck"?b.unmark:{});
  b.writes.length=0;
  ok("tap before the draw = 🎲 Draw now, then scrolls to the card", b.spMomRowTap()===true&&b.spDay("lucy",ISO)&&b.spDay("lucy",ISO).picks.length===1&&b.tx.length===1&&scrolled===1, b.tx);
  ok("…its only write is the draw's own transaction (nothing to momChores)", b.writes.every(w=>w[0]==="tx"&&/^spotChecks\//.test(w[1])), b.writes);
  const r1=b.spMomRow();
  ok("after the draw: '🔎 Spot check — 1 to check'", r1.drawn&&r1.todo===1&&!r1.done&&/🔎 Spot check — 1 to check/.test(b.spMomRowHTML(r1)));
  b.writes.length=0; b.tx.length=0; scrolled=0;
  ok("tap after the draw only scrolls — no write, no redraw", b.spMomRowTap()===true&&scrolled===1&&b.writes.length===0&&b.tx.length===0);
  const c=mk(); vm.runInContext(PICKS,c);
  ok("two picks, none resolved: 2 to check", c.spMomRow().todo===2&&/2 to check/.test(c.spMomRowHTML(c.spMomRow())));
  c.spResolve("lucy",0,"ok");
  ok("one resolved: 1 to check, not done", c.spMomRow().todo===1&&!c.spMomRow().done);
  c.spResolve("lucy",1,"no");
  ok("every pick resolved (✓ or ✗): done ✓", (()=>{ const r=c.spMomRow(), H=c.spMomRowHTML(r); return r.done&&/✓/.test(H)&&/line-through/.test(H)&&/all checked/.test(H); })());
  ok("the mid-day switch never removes the row while one type is on", mk({set:{types:{chore:false,laundry:false}}}).spMomRow()!==null);
  // the real strip, with her own lists stubbed
  const STRIP=slice("momDayStripHTML")+"\n"+slice("mcSlotOf");
  const strip=(o,slot,mine)=>{ const x=mk(o); if(o.picks) vm.runInContext(o.picks,x);
    Object.assign(x,{MC_SLOTS:{morning:{ic:"☀️",nm:"Morning"},afternoon:{ic:"🌤",nm:"Afternoon"},night:{ic:"🌙",nm:"Night"}},MC_SLOT_ORDER:["morning","afternoon","night"],mpSlotNow:()=>slot,
      mdMine:who=>({dad:who==="dad",list:mine,doneOn:(i,id)=>!!mine[id].done,due:()=>Object.keys(mine),hd:"#000",manage:false,manageFn:"m",todoData:{},todoTog:"t",todoDel:"d",todoInp:"i",todoAdd:"a",emptySlot:()=>"EMPTY",addRow:()=>"",shop:()=>""}),
      _mcRow:(id,c)=>"<row>"+c.label+"</row>",tdRunning:()=>[],laundryData:{},kitSettings:{},wtRowHTML:()=>""});
    vm.runInContext(STRIP,x); return x; };
  const MINE={w:{label:"Wipe counters",slot:"afternoon",done:true},m:{label:"Coffee",slot:"morning"}};
  const s1=strip({picks:PICKS},"afternoon",MINE), H1=s1.momDayStripHTML(ISO,"thursday");
  ok("strip, Afternoon: her own row + '🔎 Spot check — 2 to check'; tab counts it (1/2)", /<row>Wipe counters<\/row>/.test(H1)&&/🔎 Spot check — 2 to check/.test(H1)&&/🌤 Afternoon<div[^>]*>1\/2</.test(H1), H1.slice(0,3000));
  vm.runInContext("spotData.lucy['"+ISO+"'].results={0:{r:'ok'},1:{r:'no'}}",s1); const H2=s1.momDayStripHTML(ISO,"thursday");
  ok("all resolved: the tab reads 2/2 (done counts)", /🌤 Afternoon<div[^>]*>2\/2</.test(H2)&&/all checked/.test(H2));
  const s2=strip({picks:PICKS},"morning",MINE), H3=s2.momDayStripHTML(ISO,"thursday");
  ok("Morning showing: the row isn't in the list, but the Afternoon tab still counts it", !/🔎 Spot check —/.test(H3)&&/🌤 Afternoon<div[^>]*>1\/2</.test(H3)&&/☀️ Morning<div[^>]*>0\/1</.test(H3));
  const s3=strip({dn:"sunday",picks:PICKS},"afternoon",MINE), H4=s3.momDayStripHTML(ISO,"sunday");
  ok("not a school day: no row, the tab is her own 1/1", !/Spot check/.test(H4)&&/🌤 Afternoon<div[^>]*>1\/1</.test(H4));
  const s4=strip({picks:PICKS},"afternoon",MINE), H5=s4.momDayStripHTML(ISO,"thursday","dad");
  ok("Dad's My day: never", !/Spot check/.test(H5));
  const s5=strip({picks:PICKS},"afternoon",{}), H6=s5.momDayStripHTML(ISO,"thursday");
  ok("no afternoon chores of hers: her 'nothing set' prompt stays, the row sits under it", /EMPTY/.test(H6)&&/🔎 Spot check — 2 to check/.test(H6));
  ok("never stored: the block writes nothing to momChores, and the row functions don't touch her lists", !/ref\(['"]momChores|ref\(['"]momday|mcAll\(|mcToggle|momdayData|momChoresData/.test(SP));
  ok("not in the ✎ Edit list (momChoresCardHTML) nor the General tablet lane", !/spMomRow/.test(slice("momChoresCardHTML"))&&!/spMomRow|spotData/.test(slice("renderKioskPerson")));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
