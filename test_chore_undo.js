/*
 * ↶ CHOREUNDO (her ask 2026-10-15): "For the laundry check-off I need an undo button. The kids checked off that they did it and
 * I'd be like, no, it didn't. Or if I clicked the wrong one … no, this didn't actually get done; yes, this is actually done …
 * move this, this didn't get done, move it back."
 *
 * Checks: (1) ↶ Undo returns a checked chore to not done; (2) the wages come back off as a logged REVERSAL (a −paid bank entry
 * "↶ Mom undid", the +paid entry left standing, routineLog "off" with undo:"mom"), a held payment is removed as before, and a kid's
 * own uncheck is untouched; (3) ✓ Done re-checks and banks again; (4) the ledger card renders both ways; (5) Mom gate — nothing
 * moves and nothing renders without Mom; (6) laundry ↶ back a stage (washer ← dryer ← fold ← put away; wet: bin ← prewash ←
 * washer), today's blocks for both stages removed (no orphan — audit hole 10), dry run writes nothing; (7) wiring.
 *                                                                                                 run: node test_chore_undo.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const CU=cut("// CHOREUNDO_START","// CHOREUNDO_END"), WAVE=cut("// WAVE_START","// WAVE_END"), LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const NAMES=["toggleRtStep","toggleMorningStep","rlogAppend","bankDirect","bankDirectRemove","laundryAdvance","laundryAdvanceLabel","laundrySince","laundryT",
  "momBlockKey","momBlockFor","momBlocksOnValue","_lbWrite","_lbQ","laundryBlockDone","laundryKidHook","laundryStarts","laundryStartGuess","laundryKidId","mStepDoneOn","rtDoneOn","rtDueOrLate","rtComplete"];
const ISO="2026-10-15";

function mk(o){
  o=o||{}; const ls={}, writes=[], toasts=[];
  const steps={morning:{lucy:[{emoji:"🦷",label:"Brush Teeth",pts:0,cad:"daily"},{emoji:"🫧",label:"Make your bed",pts:5,cad:"daily"}]},
    chores:{lucy:[{emoji:"🧺",label:"Start a load of laundry",pts:10,cad:"daily"},{emoji:"🍽️",label:"Unload the dishwasher",pts:15,cad:"daily"}]},
    afternoon:{lucy:[]},evening:{lucy:[]}};
  const ref=p=>({set:v=>{ writes.push(["set",p,JSON.parse(JSON.stringify(v))]); },update:v=>{ writes.push(["update",p,JSON.parse(JSON.stringify(v))]); },remove:()=>{ writes.push(["rm",p]); },push:()=>({key:"rl"+writes.length})});
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, db:o.nodb?null:{ref:ref}, _dryRun:()=>!!o.dry,
    obSet:(p,v)=>{ writes.push(["set",p,JSON.parse(JSON.stringify(v))]); }, obRemove:p=>{ writes.push(["rm",p]); }, obNoteSl:()=>{},
    RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    ROSTER:["lucy"], KID_NAME:{lucy:"Lucy"}, PACE_KCOL:{}, cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    _todayDay:"thursday", day:"thursday", WK:"week7", activeWk:()=>"week7", slState:o.sl||{}, bank:o.bank||{}, routineLog:{}, rtOpen:{}, rtOpenKey:(s,k)=>s+k, mrOpen:{},
    rtStepsFor:(slot,kid)=>steps[slot][kid]||[], morningStepsFor:kid=>steps.morning[kid]||[], morningDueIdx:()=>[0,1], morningComplete:()=>false, dsAutoStart:()=>{},
    stepWindowOk:()=>true, cadDueOn:()=>true, rtLateDays:()=>0, routineEditable:()=>true, rtStepAvail:()=>!!o.unlocked, rtAvailable:()=>!!o.unlocked, _rtBlockedToast:()=>{},
    zoneBonusFor:()=>0, choreVerifyOn:()=>!!o.verify, rtBonusSettle:()=>{}, rtDayBonusSettle:()=>{}, sv:()=>{}, renderSkylight:()=>{},
    nowTs:()=>"2:10 PM Oct 15", mwTodayIso:()=>ISO, _lbNowMin:()=>14*60+10, laundryData:o.laundry||{}, momBlocks:o.blocks||{}, laundryTimes:{wash:50,dry:60,grace:5},
    momHere:()=>!o.notMom, tab:"moms-plan", document:{getElementById:()=>({})}, renderMomsPlan:()=>{}, renderAll:()=>{}, mwToast:t=>toasts.push(t), gwShowToast:t=>toasts.push(t), confirm:()=>true,
    writes, toasts, ls};
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+WAVE+"\n"+NAMES.map(slice).join("\n")+"\n"+CU, ctx);
  return ctx;
}
const adj=(c,kid)=>Object.values((c.bank[kid]||{}).adjustments||{});
const rlog=(c,kid)=>Object.values((((c.routineLog[kid]||{}).week7)||{}).thursday||{});
const bal=(c,kid)=>adj(c,kid).filter(a=>!a.held).reduce((n,a)=>n+(a.amount||0),0);

console.log("(1)(2) ↶ Undo a chore the kid checked: back to not done, the stars come back off as a logged reversal");
{ const c=mk();
  ok("setup: Mom's ✓ Done (kid's own check-off path) checks it and banks +15", c.choreRedo("chores","lucy","thursday",1)===true&&c.rtDoneOn("chores","lucy","thursday",1)&&bal(c,"lucy")===15, adj(c,"lucy"));
  const before=adj(c,"lucy").length; c.writes.length=0;
  ok("↶ Undo → not done", c.choreUndo("chores","lucy","thursday",1)===true&&!c.rtDoneOn("chores","lucy","thursday",1));
  const A=adj(c,"lucy");
  ok("the +15 entry is NOT deleted; a −15 '↶ Mom undid' entry is added beside it", A.length===before+1&&A.some(a=>a.amount===15)&&A.some(a=>a.amount===-15&&/↶ Mom undid: Unload the dishwasher/.test(a.note)&&a.src==="earn"&&a.day==="thursday"&&a.wk==="week7"), A);
  ok("the balance is back where it was (0)", bal(c,"lucy")===0);
  ok("routineLog: an 'off' line carrying undo:'mom' (act stays 'off' so the Household numbers read it)", rlog(c,"lucy").some(r=>r.act==="off"&&r.undo==="mom"&&r.label==="Unload the dishwasher"&&r.pts===15), rlog(c,"lucy"));
  ok("bank write is a targeted set on bank/lucy/adjustments/<new id>; nothing removes the original", c.writes.some(w=>w[0]==="set"&&/^bank\/lucy\/adjustments\/bd/.test(w[1])&&w[2].amount===-15)&&!c.writes.some(w=>w[0]==="rm"&&/^bank\//.test(w[1])), c.writes);
  ok("undo on a not-done chore does nothing", (()=>{ const n=c.writes.length; return c.choreUndo("chores","lucy","thursday",1)===false&&c.writes.length===n; })());
  ok("(3) ✓ Done again → done, +15 banked again (net 15)", c.choreRedo("chores","lucy","thursday",1)===true&&c.rtDoneOn("chores","lucy","thursday",1)&&bal(c,"lucy")===15);
  ok("choreFlip goes both ways", c.choreFlip("chores","lucy","thursday",1)===true&&!c.rtDoneOn("chores","lucy","thursday",1)&&c.choreFlip("chores","lucy","thursday",1)===true&&c.rtDoneOn("chores","lucy","thursday",1)&&bal(c,"lucy")===15);
}
console.log("Morning steps too; a 0⭐ step flips with no bank entry");
{ const c=mk();
  c.choreRedo("morning","lucy","thursday",1); c.choreRedo("morning","lucy","thursday",0);
  ok("morning: +5 banked, both done", bal(c,"lucy")===5&&c.mStepDoneOn("lucy","thursday",1)&&c.mStepDoneOn("lucy","thursday",0));
  c.choreUndo("morning","lucy","thursday",1); c.choreUndo("morning","lucy","thursday",0);
  ok("undo: −5 reversal, both not done, only one reversal entry (0⭐ step banks nothing)", bal(c,"lucy")===0&&adj(c,"lucy").filter(a=>a.amount<0).length===1&&!c.mStepDoneOn("lucy","thursday",1)&&!c.mStepDoneOn("lucy","thursday",0));
  ok("morning log lines carry undo:'mom'", rlog(c,"lucy").filter(r=>r.undo==="mom").length===2);
}
console.log("A held (chore-verify) payment never reached the kid → removed, as before; a kid's own uncheck is unchanged");
{ const c=mk({verify:true});
  c.choreRedo("chores","lucy","thursday",1); const held=adj(c,"lucy"); ok("setup: held +15", held.length===1&&held[0].held===true);
  c.choreUndo("chores","lucy","thursday",1); ok("undo removes the held entry, no reversal entry", adj(c,"lucy").length===0&&!c.rtDoneOn("chores","lucy","thursday",1));
  const k=mk({unlocked:true}); k.toggleRtStep("chores","lucy",1); k.toggleRtStep("chores","lucy",1);
  ok("the kid's own check + uncheck: entry removed, no reversal line, log 'off' without undo", adj(k,"lucy").length===0&&rlog(k,"lucy").every(r=>!r.undo));
}
console.log("(5) Mom gate");
{ const c=mk({notMom:true,sl:{"week7_thursday_lucy_cstep1":{done:true,pts:15,bid:"b1"}},bank:{lucy:{adjustments:{b1:{amount:15,src:"earn"}}}}});
  ok("not Mom: undo refused, still done, bank untouched, nothing written", c.choreUndo("chores","lucy","thursday",1)===false&&c.rtDoneOn("chores","lucy","thursday",1)&&adj(c,"lucy").length===1&&c.writes.length===0);
  ok("not Mom: ✓ Done refused", c.choreRedo("chores","lucy","thursday",0)===false&&!c.rtDoneOn("chores","lucy","thursday",0));
  ok("not Mom: the ledger renders nothing, no ↶ undo button", c.mdCardChoreLedger()===""&&c.choreUndoBtnHTML("chores","lucy","thursday",1)==="");
  ok("not Mom: laundry ↶ refused", (()=>{ const d=mk({notMom:true,laundry:{l1:{label:"Towels",stage:"dryer",ts:1}}}); return d.laundryBack("l1")===null&&d.laundryData.l1.stage==="dryer"&&d.laundryBackBtnHTML("l1",d.laundryData.l1)===""; })());
}
console.log("(4) The ledger");
{ const c=mk({sl:{"week7_thursday_lucy_cstep1":{done:true,ts:"9:05 AM Oct 15",pts:15,bid:"b1"}},bank:{lucy:{adjustments:{b1:{amount:15,src:"earn"}}}},
    laundry:{l1:{label:"Towels",stage:"dryer",ts:1},l2:{label:"💦 Sheets (king)",stage:"bin",ts:2,wet:true}}});
  ok("collapsed: header counts done / open / loads", (()=>{ const h=c.mdCardChoreLedger(); return /Today’s ledger · ✓ 1 · ☐ 3 · 🧺 2/.test(h)&&!/choreUndo/.test(h); })(), c.mdCardChoreLedger());
  vm.runInContext("cuLedgerOpen=true",c); const h=c.mdCardChoreLedger();
  ok("open: the done chore has ↶ Undo (with its check time), the open ones ✓ Done", /choreUndo\('chores','lucy','thursday',1\)/.test(h)&&/9:05 AM/.test(h)&&/choreRedo\('chores','lucy','thursday',0\)/.test(h)&&/choreRedo\('morning','lucy','thursday',1\)/.test(h), h);
  ok("open: laundry rows — Towels ↶ back to the washer + → Fold; the bin load has no ↶", /laundryBack\('l1'\)/.test(h)&&/In the washer/.test(h)&&/→ Fold/.test(h)&&!/laundryBack\('l2'\)/.test(h));
  c.choreUndo("chores","lucy","thursday",1); const h2=c.mdCardChoreLedger();
  ok("after an undo the row shows ☐ + ✓ Done and '↶ undone'", /choreRedo\('chores','lucy','thursday',1\)/.test(h2)&&/↶ undone/.test(h2));
  const w=mk(); vm.runInContext("rtWave('chores','lucy','thursday',0)",w); vm.runInContext("cuLedgerOpen=true",w);
  ok("a waved chore stays WAVE's, not in the ledger", !/choreRedo\('chores','lucy','thursday',0\)/.test(w.mdCardChoreLedger()));
  ok("Kids today 📋 lists: a done row gets ↶ undo, its ✅ tap flips through the ledger path", (()=>{ const k=mk({sl:{"week7_thursday_lucy_cstep1":{done:true}}}); const t=k.mdKidListsHTML("lucy","thursday"); return /choreUndo\('chores','lucy','thursday',1\)/.test(t)&&/choreFlip\('chores','lucy','thursday',1\)/.test(t); })());
}
console.log("(6) Laundry: move back a stage");
{ const now=Date.now();
  const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:now-5000,by:"mom"}},blocks:{"l1_fold":{iso:ISO,load:"l1",stage:"fold",at:"now",mins:10},"l1_dryer":{iso:ISO,load:"l1",stage:"dryer",at:"now",mins:15,done:true}}});
  const r=c.laundryBack("l1");
  ok("fold → dryer", r&&r.from==="fold"&&r.to==="dryer"&&c.laundryData.l1.stage==="dryer"&&c.laundryData.l1.by==="mom");
  ok("shown finished in the dryer now (ts = now − dry minutes)", Math.abs(c.laundryData.l1.ts-(Date.now()-60*60000))<5000);
  ok("today's blocks for both stages are removed (no orphan, the question comes back)", !c.momBlocks.l1_fold&&!c.momBlocks.l1_dryer);
  ok("writes: targeted — laundry/l1 update {stage,ts} + two momBlocks removes", c.writes.length===3&&c.writes.some(w=>w[0]==="update"&&w[1]==="laundry/l1"&&w[2].stage==="dryer"&&Object.keys(w[2]).length===2)&&c.writes.filter(w=>w[0]==="rm"&&/^momBlocks\/2026-10-15\/l1_(fold|dryer)$/.test(w[1])).length===2, c.writes);
  c.laundryBack("l1"); ok("dryer → washer (ts = now − wash minutes)", c.laundryData.l1.stage==="washer"&&Math.abs(c.laundryData.l1.ts-(Date.now()-50*60000))<5000);
  ok("washer is the first stage: no further back", c.laundryBack("l1")===null&&c.laundryData.l1.stage==="washer");
  const wet=mk({laundry:{w1:{label:"💦 Towels",stage:"washer",ts:1,wet:true}}});
  ok("wet load: washer → prewash → bin, then stop", wet.laundryBack("w1").to==="prewash"&&wet.laundryBack("w1").to==="bin"&&wet.laundryBack("w1")===null);
  const dry=mk({dry:true,laundry:{l1:{label:"Towels",stage:"dryer",ts:1}}});
  ok("?dryrun=1: moves locally, writes nothing", dry.laundryBack("l1").to==="washer"&&dry.writes.length===0);
  const nod=mk({nodb:true,laundry:{l1:{label:"Towels",stage:"dryer",ts:1}}});
  ok("db null: no throw", nod.laundryBack("l1").to==="washer");
}
console.log("Put away → ↶ back to the fold pile (this device remembers today's)");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:1,by:"taylor"}},blocks:{"l1_fold":{iso:ISO,load:"l1",stage:"fold",at:"now",mins:10}}});
  c.laundryAdvance("l1");
  ok("✓ Put away deletes the load as before (laundry/l1 removed) and remembers it here", !c.laundryData.l1&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/l1")&&c.laundryAwayList().length===1);
  vm.runInContext("cuLedgerOpen=true",c); ok("the ledger lists it with ↶ back to the fold pile", /laundryUnputaway\('l1'\)/.test(c.mdCardChoreLedger()));
  c.writes.length=0; const rec=c.laundryUnputaway("l1");
  ok("restored to the fold pile, same label and by", rec&&c.laundryData.l1.stage==="fold"&&c.laundryData.l1.by==="taylor"&&c.laundryData.l1.label==="Towels");
  ok("writes: laundry/l1 set + the done fold block removed", c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/l1"&&w[2].stage==="fold")&&c.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/2026-10-15/l1_fold")&&!c.momBlocks.l1_fold, c.writes);
  ok("gone from the remembered list; a second restore does nothing", c.laundryAwayList().length===0&&c.laundryUnputaway("l1")===null);
  const old=mk(); old.ls.ha_laundry_away=JSON.stringify({iso:"2026-10-14",v:{l9:{load:{label:"Old",stage:"fold"},at:1}}});
  ok("yesterday's memory is ignored", old.laundryAwayList().length===0&&old.laundryUnputaway("l9")===null);
}
console.log("A kid's 'Start a load' undone by Mom takes the load off (KIDLAUNDRY, still in the washer)");
{ const c=mk(); c.choreRedo("chores","lucy","thursday",0); const id=c.laundryKidId("week7_thursday_lucy_cstep0");
  ok("checking it put a load in the washer", !!c.laundryData[id]&&c.laundryData[id].stage==="washer");
  c.choreUndo("chores","lucy","thursday",0); ok("undo: the load is gone and the +10 reversed", !c.laundryData[id]&&bal(c,"lucy")===0);
}
console.log("(7) Wiring");
ok("both check-offs route the uncheck through cuUnpay and tag the log line", (src.match(/cuUnpay\(kid,cur\.bid,/g)||[]).length===2&&(src.match(/\{undo:"mom"\}:null\)/g)||[]).length===2);
ok("rlogAppend takes the extra fields", /function rlogAppend\(kid,slot,label,act,pts,extra\)/.test(src));
ok("the ledger sits under Kids today on Mom's Day only (bank row, no Dad control); renderMomsDay untouched", /if\(bank&&dadCtl===undefined&&typeof mdCardChoreLedger==="function"\)\{ try\{ h\+=mdCardChoreLedger\(\); \}catch\(e\)\{\} \}/.test(slice("mdCardKidsToday"))&&(src.match(/h\+=mdCardChoreLedger\(\)/g)||[]).length===1&&!/mdCardChoreLedger/.test(slice("renderMomsDay"))&&!/mdCardChoreLedger/.test(slice("renderDadsDay")));
ok("Laundry card: a ↶ before the forward button; ✓ Put away remembers the load", /laundryBackBtnHTML\(id,l\)/.test(src)&&/laundryAwayRemember\(id,l\)/.test(slice("laundryAdvance")));
ok("laundryDel also drops the load's block (audit hole 10, 2026-10-15; see test_laundry_tiny.js)", /_cuDropBlock\(id,l\.stage\)/.test(slice("laundryDel")));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
