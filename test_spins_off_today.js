/*
 * 🎰 SPINSOFFTODAY — on-time spins OFF for one day (her ask 2026-10-28: "a button on the schedule that for that day can turn
 * the on-time spins off … it only counts for that day and it goes back to whatever the setting is after that. It shouldn't
 * show up if it's already off in settings … an all and a per kid"). Leaf: config/spin_gate/<kid>/offByDate/<iso> = true.
 *                                                                                          run: node test_spins_off_today.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const A=src.indexOf("// SPINSOFFTODAY_START"), B=src.indexOf("// SPINSOFFTODAY_END");
if(A<0||B<0) throw new Error("block markers missing");
const BLOCK=src.slice(A,B);
const ISO="2026-10-28", OTHER="2026-10-29";
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
function mk(o){
  o=o||{}; const writes=[], toasts=[], renders=[];
  const ctx={console,Object,Array,String,Number,Math,JSON,Date,RegExp,Error,
    ROSTER:["kid1","kid2","kid3"], spinGate:o.spinGate||{}, kid:o.kid||"all", day:o.day||"wednesday", _todayDay:"wednesday",
    _todayStr:()=>ISO, routineDateISO:dn=>dn==="wednesday"?ISO:dn==="thursday"?OTHER:null,
    momHere:()=>!o.noMom, momHereCards:()=>!o.noMom, cap, _dryRun:()=>!!o.dry,
    db:o.noDb?null:{ref:()=>({update:u=>writes.push(JSON.parse(JSON.stringify(u)))})},
    gwShowToast:m=>toasts.push(m), renderAll:()=>renders.push(1), dbg:()=>{}, writes, toasts, renders};
  vm.createContext(ctx);
  vm.runInContext(fn("spinGateFor")+"\n"+fn("spinGateEnsure")+"\n"+BLOCK, ctx);
  return ctx;
}
const allOn={kid1:{enabled:true,window:5},kid2:{enabled:true,window:10}};   // kid3 missing = default ON

console.log("The switch shows only for kids whose setting is ON");
{ const c=mk({spinGate:allOn}); const h=c.sotStripHTML();
  ok("Mom, today, three kids ON → All + one chip per kid, all reading on-time", /sotToggleAll\('2026-10-28'\)/.test(h)&&/Kid1 · on-time/.test(h)&&/Kid2 · on-time/.test(h)&&/Kid3 · on-time/.test(h)&&!/Kid\d · off today/.test(h), h);
  const c2=mk({spinGate:{kid1:{enabled:false,window:5},kid2:{enabled:true,window:5},kid3:{enabled:false}}}); const h2=c2.sotStripHTML();
  ok("a kid already OFF in Settings has no switch", !/Kid1/.test(h2)&&!/Kid3/.test(h2)&&/Kid2 · on-time/.test(h2), h2);
  ok("one kid shown → no All button", !/sotToggleAll/.test(h2));
  ok("every kid OFF in Settings → nothing", mk({spinGate:{kid1:{enabled:false},kid2:{enabled:false},kid3:{enabled:false}}}).sotStripHTML()==="");
  ok("not Mom → nothing", mk({spinGate:allOn,noMom:true}).sotStripHTML()==="");
  ok("another day's view → nothing", mk({spinGate:allOn,day:"thursday"}).sotStripHTML()==="");
  const c3=mk({spinGate:allOn,kid:"kid2"}); const h3=c3.sotStripHTML();
  ok("a kid's own view shows just that kid", /Kid2 · on-time/.test(h3)&&!/Kid1/.test(h3)&&!/Kid3/.test(h3)&&!/sotToggleAll/.test(h3), h3);
  ok("the strip is Mom-gated by momHereCards (kids' tab never sees it)", /momHereCards\(\)/.test(BLOCK));
}
console.log("Per kid: one leaf for that date, removed on the way back");
{ const c=mk({spinGate:JSON.parse(JSON.stringify(allOn))});
  ok("flip kid1 off today → ONE leaf config/spin_gate/kid1/offByDate/<iso> = true, one multi-path update", c.sotToggle("kid1",ISO)===true&&c.writes.length===1&&JSON.stringify(c.writes[0])===JSON.stringify({["config/spin_gate/kid1/offByDate/"+ISO]:true}), c.writes);
  ok("…the local gate carries it and the strip reads off today for kid1 only", c.sotOffAt("kid1",ISO)&&!c.sotOffAt("kid2",ISO)&&/Kid1 · off today/.test(c.sotStripHTML())&&/Kid2 · on-time/.test(c.sotStripHTML()));
  ok("…the setting itself is untouched (enabled/window as before)", c.spinGate.kid1.enabled===true&&c.spinGate.kid1.window===5);
  ok("…and re-rendered with a toast", c.renders.length===1&&/Kid1/.test(c.toasts[0]));
  ok("flip again → the leaf goes (null in the same path), nothing else", c.sotToggle("kid1",ISO)===true&&c.writes.length===2&&JSON.stringify(c.writes[1])===JSON.stringify({["config/spin_gate/kid1/offByDate/"+ISO]:null})&&!c.sotOffAt("kid1",ISO), c.writes);
  ok("a kid with no gate record yet gets the defaults + the leaf (never a whole-node set)", c.sotToggle("kid3",ISO)===true&&c.spinGate.kid3.enabled===true&&c.spinGate.kid3.window===5&&c.spinGate.kid3.offByDate[ISO]===true&&Object.keys(c.writes[2]).length===1);
  ok("a kid OFF in Settings → no write", mk({spinGate:{kid1:{enabled:false}}}).sotToggle("kid1",ISO)===false);
  ok("a bad date → no write", c.sotToggle("kid1","today")===false&&c.sotToggle("kid1","")===false);
  const k=mk({spinGate:allOn,noMom:true}); ok("not Mom → no write, nothing flips", k.sotToggle("kid1",ISO)===false&&k.writes.length===0&&!k.sotOffAt("kid1",ISO));
}
console.log("All flips every shown kid");
{ const c=mk({spinGate:{kid1:{enabled:true,window:5},kid2:{enabled:false,window:5},kid3:{enabled:true,window:15}}});
  ok("All off today → one update with one leaf per kid whose setting is ON; the OFF kid gets none", c.sotToggleAll(ISO)===true&&c.writes.length===1&&JSON.stringify(c.writes[0])===JSON.stringify({["config/spin_gate/kid1/offByDate/"+ISO]:true,["config/spin_gate/kid3/offByDate/"+ISO]:true}), c.writes);
  ok("…the All chip now reads back to on-time", /All · back to on-time/.test(c.sotStripHTML()));
  ok("All again → every leaf removed in one update", c.sotToggleAll(ISO)===true&&JSON.stringify(c.writes[1])===JSON.stringify({["config/spin_gate/kid1/offByDate/"+ISO]:null,["config/spin_gate/kid3/offByDate/"+ISO]:null})&&!c.sotOffAt("kid1",ISO)&&!c.sotOffAt("kid3",ISO));
  const one=mk({spinGate:allOn,kid:"kid2"}); one.sotToggleAll(ISO);
  ok("from a kid's own view All touches only that kid", one.writes.length===1&&Object.keys(one.writes[0]).join()==="config/spin_gate/kid2/offByDate/"+ISO);
  const mixed=mk({spinGate:{kid1:{enabled:true,offByDate:{[ISO]:true}},kid2:{enabled:true}}}); mixed.sotToggleAll(ISO);
  ok("one kid already off → All turns the rest off (never flips the off one back)", JSON.stringify(mixed.writes[0])===JSON.stringify({["config/spin_gate/kid1/offByDate/"+ISO]:true,["config/spin_gate/kid2/offByDate/"+ISO]:true,["config/spin_gate/kid3/offByDate/"+ISO]:true}), mixed.writes);   // kid3 has no record = ON by default
}
console.log("Dry run: flips on screen, writes nothing");
{ const c=mk({spinGate:JSON.parse(JSON.stringify(allOn)),dry:true});
  ok("kid toggle → no db write, chip flips", c.sotToggle("kid1",ISO)===true&&c.writes.length===0&&/Kid1 · off today/.test(c.sotStripHTML()));
  ok("All → no db write, every chip flips", c.sotToggleAll(ISO)===true&&c.writes.length===0&&/All · back to on-time/.test(c.sotStripHTML()));
  const n=mk({spinGate:allOn,noDb:true}); ok("no db at all → still flips, no throw", n.sotToggle("kid1",ISO)===true&&n.sotOffAt("kid1",ISO));
  ok("the write sits behind db && !_dryRun()", /if\(db&&!_dryRun\(\)\)\{ try\{ db\.ref\(\)\.update\(upd\); \}/.test(BLOCK));
}
console.log("The gate reads the leaf for the task's date only");
{ const SPT=fn("showPaceToast");
  function gate(o){
    o=o||{}; const pending=[];
    const tasks=[{id:"t1",who:"kid1",day:"wednesday",time:"9:00 AM",dur:20,title:"Math"},{id:"t2",who:"kid1",day:"wednesday",time:"10:00 AM",dur:20,title:"Reading"},
                 {id:"t3",who:"kid1",day:"thursday",time:"9:00 AM",dur:20,title:"Math"},{id:"t4",who:"kid1",day:"thursday",time:"10:00 AM",dur:20,title:"Reading"}];
    const ctx={console,Object,Array,String,Number,Math,JSON,Date,RegExp,Error,
      ROSTER:["kid1","kid2","kid3"], spinGate:o.spinGate||{kid1:{enabled:true,window:5}}, weekData:{tasks}, displacedResult:null, _todayDay:o.today||"wednesday",
      _todayStr:()=>o.todayIso||ISO, routineDateISO:dn=>dn==="wednesday"?ISO:dn==="thursday"?OTHER:null,
      checked:{}, claimed:{}, momMoves:{}, pendingSpins:{}, slotKid:null, slotSpinDay:null, paceToastTimer:null,
      effectiveDay:t=>t.day, dsRetime:x=>x, _dismissed:()=>false, toMin:s=>{ const m=/(\d+):(\d+) (AM|PM)/.exec(s); let h=+m[1]%12; if(m[3]==="PM") h+=12; return h*60+ +m[2]; },
      hasSpun:()=>false, markSpun:()=>{}, hasDayBonus:()=>true, markDayBonus:()=>{}, addPendingSpin:(id,k,d)=>pending.push([id,k,d]), celebrateDayComplete:()=>{},
      renderAll:()=>{}, cap, setTimeout:f=>1, clearTimeout:()=>{}, momHere:()=>true, momHereCards:()=>true, _dryRun:()=>false, db:null, gwShowToast:()=>{}, dbg:()=>{},
      document:{getElementById:()=>({className:"",textContent:"",classList:{add(){},remove(){}}})}, pending};
    vm.createContext(ctx); vm.runInContext(fn("spinGateFor")+"\n"+fn("spinGateEnsure")+"\n"+BLOCK+"\n"+SPT, ctx);
    // the kid checks one of today's two cards 2 hours late (doneMin 11:20 vs a 9:20 end) — isLastTask false, diff = 120 > window
    ctx.late=id=>{ ctx.checked[id]="x"; ctx.showPaceToast(id, 11*60+20); return pending.length; };
    return ctx;
  }
  ok("setting ON, no leaf: a late check-off earns no spin (the gate as before)", gate().late("t1")===0);
  ok("setting ON, no leaf: an on-time check-off spins (the gate as before)", (()=>{ const c=gate(); c.checked.t1="x"; c.showPaceToast("t1", 9*60+18); return c.pending.length===1; })());
  ok("leaf for today → the same late check-off spins", gate({spinGate:{kid1:{enabled:true,window:5,offByDate:{[ISO]:true}}}}).late("t1")===1);
  ok("leaf for ANOTHER date → today's late check-off still earns no spin", gate({spinGate:{kid1:{enabled:true,window:5,offByDate:{[OTHER]:true}}}}).late("t1")===0);
  ok("tomorrow (the leaf's date gone by): the setting rules again", gate({spinGate:{kid1:{enabled:true,window:5,offByDate:{[ISO]:true}}},today:"thursday",todayIso:OTHER}).late("t3")===0);
  ok("the leaf is read by the task's own day, not the device's: a leaf for thursday waives a thursday card checked late on thursday", gate({spinGate:{kid1:{enabled:true,window:5,offByDate:{[OTHER]:true}}},today:"thursday",todayIso:OTHER}).late("t3")===1);
  ok("another kid's leaf does nothing for this kid", gate({spinGate:{kid1:{enabled:true,window:5},kid2:{enabled:true,offByDate:{[ISO]:true}}}}).late("t1")===0);
  ok("setting OFF in Settings: every finished task spins, leaf or not (unchanged)", gate({spinGate:{kid1:{enabled:false,window:5}}}).late("t1")===1);
  ok("a leaf that isn't exactly true is ignored", gate({spinGate:{kid1:{enabled:true,window:5,offByDate:{[ISO]:"yes"}}}}).late("t1")===0);
  ok("the hook is one typeof-guarded line beside the gate", src.split('if(typeof sotOffOn==="function"&&sotOffOn(t.who,taskDay)) gate.enabled=false;').length===2&&/const gate=spinGateFor\(t\.who\);\n  if\(typeof sotOffOn==="function"&&sotOffOn\(t\.who,taskDay\)\) gate\.enabled=false;/.test(src));
}
console.log("Wiring, Settings untouched, hygiene");
{ ok("the strip rides on today's day view beside the helpers strip, typeof-guarded", src.split('if(day===_todayDay){ try{ if(typeof sotStripHTML==="function") h+=sotStripHTML(); }catch(e){} }').length===2);
  ok("the Settings page's gate card is as before (label, toggle, window picker, save)", src.indexOf("<b>On-time spins only</b>")>0&&src.split("const _sg=spinGateFor(kid);").length===2
     &&src.indexOf('function spinGateToggle(kid){ spinGateEnsure(kid); spinGate[kid].enabled=!spinGateFor(kid).enabled; spinGateSave(); renderAll(); }')>0
     &&src.indexOf('function spinGateSetWindow(kid,w){ spinGateEnsure(kid); spinGate[kid].window=w; spinGate[kid].enabled=true; spinGateSave(); renderAll(); }')>0
     &&src.indexOf('function spinGateSave(){ if(db) db.ref("config/spin_gate").set(spinGate); }')>0
     &&src.indexOf('function spinGateFor(kid){ const g=spinGate[kid]||{}; return {enabled: g.enabled!==false, window: g.window||5}; }')>0);
  ok("the block never touches Settings rendering or the setting's own fields", !/renderSettings|spinGateSave|spinGateToggle|spinGateSetWindow|\.enabled=|\.window=/.test(BLOCK.replace(/^\/\/.*$/gm,"")));
  ok("every write in the block is a targeted multi-path update, never a whole-node set", !/\.set\(/.test(BLOCK)&&(BLOCK.match(/db\.ref\(\)\.update\(upd\)/g)||[]).length===1);
  ok("no kid's name in the block", !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb/i.test(BLOCK));
  ok("no 🔀", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
