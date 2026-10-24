/*
 * ↩︎ UNDOLISTS (her words 2026-10-24: "do we need the ledger i feel like its now redundant" → "cant i just go into the individual
 * lists now and uncheck as well?" → "yes and if dad does on his a dad undid").
 *
 * Checks: (1) Mom unchecking a paid chore on a list (the plain toggle, not the ledger) banks a visible "↩︎ Mom undid" reversal and
 * the routineLog "off" line carries undo:"mom"; (2) Dad — on his own link (_kioskD) or unlocked (dadAwardOk) — gets "↩︎ Dad undid"
 * + undo:"dad"; (3) a kid unchecking on their own device keeps the silent removal; (4) a held (chore-verify) payment is still just
 * removed, for Mom and Dad alike; (5) no database (offline / dry run) doesn't throw; (6) the ledger card is gone from Mom's Day.
 *                                                                                                 run: node test_undo_on_lists.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const CU=cut("// CHOREUNDO_START","// CHOREUNDO_END"), WAVE=cut("// WAVE_START","// WAVE_END"), LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const NAMES=["toggleRtStep","toggleMorningStep","slBefore","slSaveChanged","rlogAppend","bankDirect","bankDirectRemove","laundryAdvance","laundryAdvanceLabel","laundrySince","laundryT",
  "momBlockKey","momBlockFor","momBlocksOnValue","_lbWrite","_lbQ","laundryBlockDone","laundryKidHook","laundryStarts","laundryStartGuess","laundryKidId","mStepDoneOn","rtDoneOn","rtDueOrLate","rtComplete"];
const ISO="2026-10-24";

// who: "mom" (Mom mode), "dadlink" (Dad's own link), "dadopen" (Dad unlocked), "kid" (a kid's own device)
function mk(who,o){
  o=o||{}; const ls={}, writes=[];
  const steps={morning:{lucy:[{emoji:"🦷",label:"Brush Teeth",pts:0,cad:"daily"},{emoji:"🫧",label:"Make your bed",pts:5,cad:"daily"}]},
    chores:{lucy:[{emoji:"🧺",label:"Start a load of laundry",pts:10,cad:"daily"},{emoji:"🍽️",label:"Unload the dishwasher",pts:15,cad:"daily"}]},
    afternoon:{lucy:[]},evening:{lucy:[]}};
  const ref=p=>({set:v=>{ writes.push(["set",p,JSON.parse(JSON.stringify(v))]); },update:v=>{ writes.push(["update",p,JSON.parse(JSON.stringify(v))]); },remove:()=>{ writes.push(["rm",p]); },push:()=>({key:"rl"+writes.length})});
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, db:o.nodb?null:{ref:ref}, _dryRun:()=>false,
    obSet:(p,v)=>{ if(!o.nodb) writes.push(["set",p,JSON.parse(JSON.stringify(v))]); }, obRemove:p=>{ if(!o.nodb) writes.push(["rm",p]); }, obNoteSl:()=>{},   // the real ob* return early with no db
    RT_ABBR:{afternoon:"a",chores:"c",evening:"e"}, SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    ROSTER:["lucy"], KID_NAME:{lucy:"Lucy"}, PACE_KCOL:{}, cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    _todayDay:"saturday", day:"saturday", WK:"week7", activeWk:()=>"week7", slState:{}, bank:{}, routineLog:{}, rtOpen:{}, rtOpenKey:(s,k)=>s+k, mrOpen:{},
    rtStepsFor:(slot,kid)=>steps[slot][kid]||[], morningStepsFor:kid=>steps.morning[kid]||[], morningDueIdx:()=>[0,1], morningComplete:()=>false, dsAutoStart:()=>{},
    stepWindowOk:()=>true, cadDueOn:()=>true, rtLateDays:()=>0, routineEditable:()=>true, rtStepAvail:()=>true, rtAvailable:()=>true, _rtBlockedToast:()=>{},
    zoneBonusFor:()=>0, choreVerifyOn:()=>!!o.verify, rtBonusSettle:()=>{}, rtDayBonusSettle:()=>{}, sv:()=>{}, renderSkylight:()=>{},
    nowTs:()=>"3:10 PM Oct 24", mwTodayIso:()=>ISO, _lbNowMin:()=>15*60+10, laundryData:{}, momBlocks:{}, laundryTimes:{wash:50,dry:60,grace:5},
    momHere:()=>who==="mom", _kioskD:()=>who==="dadlink", dadAwardOk:()=>who==="dadopen",
    tab:"moms-plan", document:{getElementById:()=>({})}, renderMomsPlan:()=>{}, renderAll:()=>{}, mwToast:()=>{}, gwShowToast:()=>{}, confirm:()=>true,
    writes, ls};
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+WAVE+"\n"+NAMES.map(slice).join("\n")+"\n"+CU, ctx);
  return ctx;
}
const adj=(c,kid)=>Object.values((c.bank[kid]||{}).adjustments||{});
const rlog=(c,kid)=>Object.values((((c.routineLog[kid]||{}).week7)||{}).saturday||{});
const bal=(c,kid)=>adj(c,kid).filter(a=>!a.held).reduce((n,a)=>n+(a.amount||0),0);
// The kid checks it on their own device (+15 banked), then the given device unchecks it on the list.
function checkedThenUnchecked(who,o,slot,i){
  slot=slot||"chores"; i=(i==null)?1:i;
  const k=mk("kid",o); if(slot==="morning") k.toggleMorningStep("lucy",i); else k.toggleRtStep(slot,"lucy",i);
  const c=mk(who,o); Object.assign(c,{slState:k.slState,bank:k.bank});
  c.writes.length=0; if(slot==="morning") c.toggleMorningStep("lucy",i); else c.toggleRtStep(slot,"lucy",i);
  return c;
}

console.log("1. Mom unchecks on a list (no ledger): the stars come off as a visible '↩︎ Mom undid'");
{ const c=checkedThenUnchecked("mom");
  const A=adj(c,"lucy");
  ok("back to not done", !c.rtDoneOn("chores","lucy","saturday",1));
  ok("the +15 stays; a −15 '↩︎ Mom undid: Unload the dishwasher' sits beside it", A.length===2&&A.some(a=>a.amount===15)&&A.some(a=>a.amount===-15&&a.note==="↩︎ Mom undid: Unload the dishwasher"), A);
  ok("balance back to 0", bal(c,"lucy")===0);
  ok("routineLog 'off' line with undo:'mom'", rlog(c,"lucy").some(r=>r.act==="off"&&r.undo==="mom"&&r.label==="Unload the dishwasher"&&r.pts===15), rlog(c,"lucy"));
  ok("writes: a targeted set on bank/lucy/adjustments/<new>; nothing removed from the bank", c.writes.some(w=>w[0]==="set"&&/^bank\/lucy\/adjustments\/bd/.test(w[1])&&w[2].amount===-15)&&!c.writes.some(w=>w[0]==="rm"&&/^bank\//.test(w[1])), c.writes);
  const m=checkedThenUnchecked("mom",{},"morning",1);
  ok("a Morning step too: '↩︎ Mom undid: Make your bed', undo:'mom'", adj(m,"lucy").some(a=>a.amount===-5&&a.note==="↩︎ Mom undid: Make your bed")&&rlog(m,"lucy").some(r=>r.act==="off"&&r.undo==="mom"));
  const u=mk("mom"); u.choreRedo("chores","lucy","saturday",1); u.choreUndo("chores","lucy","saturday",1);
  ok("choreUndo (the spot check's ✗) still says Mom undid", adj(u,"lucy").some(a=>a.amount===-15&&/^↩︎ Mom undid: /.test(a.note))&&rlog(u,"lucy").some(r=>r.undo==="mom"));
}
console.log("2. Dad unchecks on his page: '↩︎ Dad undid'");
["dadlink","dadopen"].forEach(function(who){
  const c=checkedThenUnchecked(who);
  ok(who+": a −15 '↩︎ Dad undid: Unload the dishwasher' beside the +15, balance 0", adj(c,"lucy").some(a=>a.amount===-15&&a.note==="↩︎ Dad undid: Unload the dishwasher")&&adj(c,"lucy").some(a=>a.amount===15)&&bal(c,"lucy")===0, adj(c,"lucy"));
  ok(who+": routineLog 'off' with undo:'dad' (never 'mom')", rlog(c,"lucy").some(r=>r.act==="off"&&r.undo==="dad")&&!rlog(c,"lucy").some(r=>r.undo==="mom"), rlog(c,"lucy"));
});
{ const u=mk("dadopen"); u.choreRedo("chores","lucy","saturday",1); u.choreUndo("chores","lucy","saturday",1);
  ok("unlocked Dad's choreUndo says Dad undid", adj(u,"lucy").some(a=>a.amount===-15&&/^↩︎ Dad undid: /.test(a.note))&&rlog(u,"lucy").some(r=>r.undo==="dad")); }
console.log("3. A kid unchecking on their own device: silent removal, as before");
{ const k=mk("kid"); k.toggleRtStep("chores","lucy",1); ok("setup: +15", bal(k,"lucy")===15);
  k.writes.length=0; k.toggleRtStep("chores","lucy",1);
  ok("the +15 entry is removed, no reversal entry", adj(k,"lucy").length===0&&!adj(k,"lucy").some(a=>/undid/.test(a.note||"")));
  ok("the log 'off' line carries no undo", rlog(k,"lucy").some(r=>r.act==="off")&&rlog(k,"lucy").every(r=>!r.undo));
  ok("the bank write is a remove of that entry", k.writes.some(w=>w[0]==="rm"&&/^bank\/lucy\/adjustments\//.test(w[1])), k.writes);
}
console.log("4. A held (chore-verify) payment never reached the kid → still just removed");
["mom","dadlink","dadopen"].forEach(function(who){
  const c=checkedThenUnchecked(who,{verify:true});
  ok(who+": the held entry is removed, no reversal banked", adj(c,"lucy").length===0&&!c.rtDoneOn("chores","lucy","saturday",1), adj(c,"lucy"));
});
console.log("5. No database: the same writes as any check-off (obSet), so no throw and the reversal still shows locally");
{ const c=checkedThenUnchecked("mom",{nodb:true});
  ok("Mom's uncheck with db null: reversal kept locally, nothing written", adj(c,"lucy").some(a=>a.amount===-15&&/Mom undid/.test(a.note))&&c.writes.length===0, c.writes); }
console.log("6. The ledger card is gone from Mom's Day");
{ ok("mdCardKidsToday renders no ledger", !/mdCardChoreLedger|cuLedger/.test(slice("mdCardKidsToday")));
  ok("the ledger functions are gone; choreUndo / choreRedo / laundryUnputaway stay (spResolve, LAUNDRYUNDO use them)", !/function (mdCardChoreLedger|cuLedgerRows|cuLedgerToggle)\(/.test(src)&&/function choreUndo\(/.test(src)&&/function choreRedo\(/.test(src)&&/function laundryUnputaway\(/.test(src)&&/choreUndo\(p\.slot,kid,p\.d,i\)/.test(src));
  ok("What's new no longer points at Today's ledger; it says uncheck on the list, Mom undid / Dad undid", !/\["↩︎ Undo a check-off · Today's ledger"/.test(src)&&/\["↩︎ Undo a check-off",\["In Mom mode, uncheck a checked chore on any list:[^\]]*↩︎ Dad undid/.test(src));
  ok("UNDOLISTS is marked in the CHOREUNDO block with her words", /\/\/ UNDOLISTS \(her words 2026-10-24: "do we need the ledger/.test(CU));
  ok("both check-offs tag the log through cuUndoTag", (src.match(/\(!now&&typeof cuUndoTag==="function"\)\?cuUndoTag\(\):null\)/g)||[]).length===2);
  ok("no 🔀", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
