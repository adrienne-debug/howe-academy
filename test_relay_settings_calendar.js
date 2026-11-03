/*
 * 🔁 RELAY2 — Settings + Calendar through the one re-lay door (her word "continue next slice" 2026-11-03; step 4, slice 2).
 *   0. shape: one RELAY2 block; saveRules, calSave, calDeleteHoliday/Vacation, calSaveOverride/calDeleteOverride hooked;
 *      the cascade's later-day strand reads smapIsKidOff; no kid or family names in the block
 *   1. the rules diff: only keys the scheduler lays by count; a save that changed nothing it reads re-lays nothing
 *   2. after a rules save: relayWeek("settings") labelled by what changed, Undo = those keys back (targeted, gone when new)
 *   3. on the board: a date or range touching Mon–Sat of the plan week; next week → nothing
 *   4. the REAL saveRules / calSave / delete / override functions call through; the mirror updates on this device
 *   5. the REAL cascade: a holiday or vacation on a later day moves that day's open lessons now; today keeps the narrow rule
 *   run:  node test_relay_settings_calendar.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const BLK=src.slice(src.indexOf("// RELAY2_START"),src.indexOf("// RELAY2_END"));

console.log("0. shape");
{ ok("one RELAY2 block, after RELAY_END",src.indexOf("// RELAY2_START")>src.indexOf("// RELAY_END")&&src.indexOf("// RELAY2_START",src.indexOf("// RELAY2_START")+1)<0);
  ok("no kid or family names in the block",!/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|caleb|sara|howe|dewalt|burris/i.test(BLK));
  ok("saveRules keeps the previous rules and calls _rlwAfterRules",/const _prev=rulesData;/.test(fn("saveRules"))&&/_rlwAfterRules\(_prev,r\)/.test(fn("saveRules")));
  ok("calSave, the deletes and the override save/delete call _rlwAfterCalendar",["calSave","calDeleteHoliday","calDeleteVacation","calSaveOverride","calDeleteOverride"].every(f=>/_rlwAfterCalendar\(/.test(fn(f))));
  ok("the cascade's later-day strand reads smapIsKidOff; today's rule unchanged",/_offLater=!!\(_dsL&&smapIsKidOff\(t\.who,_dsL\)\)/.test(fn("cascadeIntraWeek"))&&/if\(_kidOffToday\(t\.who\)\)\{/.test(fn("cascadeIntraWeek")));
  ok("the block writes nothing itself (no db.ref)",!/db\.ref\(/.test(BLK)); }

function world(o){
  o=o||{}; const log={relay:[],writes:[],removes:[],toasts:[],renders:0};
  const ctx={console,JSON,Object,Array,String,Number,parseInt,isNaN,Date,RegExp,Math,
    rulesData:o.rules===undefined?{schoolDay:{defaultStart:"9:00 AM"},hideCarryoverKids:{}}:o.rules,
    calendarData:o.calendar||{holidays:{},vacations:{},kidOverrides:{}},
    relayWeek:(w,i)=>log.relay.push([w,i]),
    stDsOf:dn=>({monday:"2026-11-02",tuesday:"2026-11-03",wednesday:"2026-11-04",thursday:"2026-11-05",friday:"2026-11-06",saturday:"2026-11-07"})[dn]||null,
    stDateWords:iso=>"D"+iso.slice(-2),cap:s=>s,
    db:{ref:p=>({set:v=>log.writes.push([p,v]),remove:()=>log.removes.push(p)})},
    document:{getElementById:id=>({value:(o.form||{})[id]||""}),createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
    setTimeout:()=>1,confirm:()=>o.confirm!==false,alert:m=>log.toasts.push(m),renderAll:()=>{ log.renders++; },
    calGenId:n=>"id_"+n.toLowerCase(),calAddMode:null,calEditId:o.editId||null,calOverrideKid:null,gwShowToast:m=>log.toasts.push(m)};
  vm.createContext(ctx); vm.runInContext(BLK,ctx);
  ["saveRules","calSave","calDeleteHoliday","calDeleteVacation","calSaveOverride","calDeleteOverride"].forEach(f=>vm.runInContext(fn(f),ctx));
  return {ctx,log,call:e=>vm.runInContext(e,ctx)};
}

console.log("1. the rules diff");
{ const w=world();
  ok("School Day Times changed → schoolDay",w.call('JSON.stringify(_rlwRulesDiff({schoolDay:{defaultStart:"9:00 AM"}},{schoolDay:{defaultStart:"10:00 AM"}}))')==='["schoolDay"]');
  ok("hide carry-over / catch-up mode / sitter name → nothing",w.call('JSON.stringify(_rlwRulesDiff({hideCarryoverKids:{}},{hideCarryoverKids:{a:true},catchupMode:"auto",sitterName:"x"}))')==='[]');
  ok("the same rules → nothing",w.call('JSON.stringify(_rlwRulesDiff({schoolDay:{a:1},devices:{computer:2}},{devices:{computer:2},schoolDay:{a:1}}))')==='[]');
  ok("Saturday overflow, cutoff, devices, stack gap, workflow, with-sitter all count",w.call('JSON.stringify(_rlwRulesDiff({},{saturdayOverflow:false,saturday:{cutoff:"12:00 PM"},devices:{computer:1},stackGap:5,workflow:{},withSitter:["k"]}))')==='["saturdayOverflow","saturday","devices","stackGap","workflow","withSitter"]'); }

console.log("2. after a rules save");
{ const w=world();
  const keys=w.call('JSON.stringify(_rlwAfterRules({schoolDay:{defaultStart:"9:00 AM"},saturdayOverflow:true},{schoolDay:{defaultStart:"10:00 AM"},saturdayOverflow:true,devices:{computer:2}}))');
  ok("returns the changed keys",keys==='["schoolDay","devices"]',keys);
  const r=w.log.relay[0];
  ok("relayWeek('settings') with a plain label",r&&r[0]==="settings"&&r[1].label==="⚙️ School Day Times, Devices",r);
  ok("Undo = each key back as it was, targeted; a new key goes",JSON.stringify(r[1].undo)==='[{"p":"config/rules/schoolDay","was":{"defaultStart":"9:00 AM"}},{"p":"config/rules/devices","gone":true}]',r[1].undo);
  w.call('_rlwAfterRules({hideCarryoverKids:{}},{hideCarryoverKids:{k:true}})');
  ok("a save that changed nothing the scheduler reads → no re-lay",w.log.relay.length===1); }

console.log("3. on the board");
{ const w=world();
  ok("a date of the plan week",w.call('_rlwOnBoard("2026-11-05","2026-11-05")')===true);
  ok("a range that covers Thu–Mon",w.call('_rlwOnBoard("2026-11-05","2026-11-09")')===true);
  ok("next week → no",w.call('_rlwOnBoard("2026-11-09","2026-11-13")')===false);
  ok("last week → no",w.call('_rlwOnBoard("2026-10-26","2026-11-01")')===false);
  ok("no start → no",w.call('_rlwOnBoard("","")')===false);
  ok("_rlwAfterCalendar: on the board → relayWeek('calendar') with the entry's Undo",w.call('_rlwAfterCalendar("🗓 X","calendar/holidays/x",null,"2026-11-05","2026-11-05")')===true&&w.log.relay[0][0]==="calendar"&&w.log.relay[0][1].undo[0].gone===true&&w.log.relay[0][1].label==="🗓 X");
  ok("…off the board → nothing",w.call('_rlwAfterCalendar("🗓 X","calendar/holidays/x",null,"2026-11-12","2026-11-12")')===false&&w.log.relay.length===1); }

console.log("4. the real functions");
{ const w=world();
  w.call('saveRules({schoolDay:{defaultStart:"10:00 AM"},hideCarryoverKids:{}})');
  ok("saveRules: the whole node is written as before, rulesData follows",w.log.writes[0][0]==="config/rules"&&w.call("rulesData.schoolDay.defaultStart")==="10:00 AM");
  ok("…and the week re-lays, Undo = School Day Times back to 9:00",w.log.relay.length===1&&w.log.relay[0][1].label==="⚙️ School Day Times"&&w.log.relay[0][1].undo[0].was.defaultStart==="9:00 AM",w.log.relay);
  w.call('saveRules({schoolDay:{defaultStart:"10:00 AM"},hideCarryoverKids:{k:true}})');
  ok("hiding a carry-over box → written, no re-lay",w.log.writes.length===2&&w.log.relay.length===1); }
{ const w=world({form:{"cal-add-name":"Teacher day","cal-add-start":"2026-11-05","cal-add-end":"","cal-add-pause":"school"}});
  w.call('calSave("holiday")');
  ok("a holiday on Thursday: written at calendar/holidays/<id>, mirror updated, re-lay with Undo = gone",w.log.writes[0][0]==="calendar/holidays/id_teacher day"&&w.call("calendarData.holidays['id_teacher day'].name")==="Teacher day"&&w.log.relay.length===1&&w.log.relay[0][1].label==="🗓 Teacher day"&&w.log.relay[0][1].undo[0].gone===true,w.log.relay);
  w.call('calDeleteHoliday("id_teacher day")');
  ok("removing it: targeted remove, mirror cleared, re-lay with Undo = the entry back",w.log.removes[0]==="calendar/holidays/id_teacher day"&&w.call("Object.keys(calendarData.holidays).length")===0&&w.log.relay[1][1].label==="🗓 Teacher day removed"&&w.log.relay[1][1].undo[0].was.name==="Teacher day",w.log.relay[1]); }
{ const w=world({form:{"cal-add-name":"Beach","cal-add-start":"2026-11-16","cal-add-end":"2026-11-20","cal-add-pause":"everything"}});
  w.call('calSave("vacation")');
  ok("a vacation two weeks out: written, no re-lay (nothing on the board)",w.log.writes.length===1&&w.log.relay.length===0); }
{ const w=world({form:{"cal-ov-date":"2026-11-05","cal-ov-type":"off","cal-ov-note":"dentist"}});
  w.call('calSaveOverride("kid_a")');
  ok("a kid off Thursday from the Month page: written, mirror, re-lay 😷 with Undo = gone",w.log.writes[0][0]==="calendar/kidOverrides/kid_a/2026-11-05"&&w.call("calendarData.kidOverrides.kid_a['2026-11-05'].school")===false&&w.log.relay[0][1].label==="😷 kid_a off D05"&&w.log.relay[0][1].undo[0].gone===true,w.log.relay);
  w.call('calDeleteOverride("kid_a","2026-11-05")');
  ok("removing the mark: targeted remove, re-lay with Undo = the mark back",w.log.removes[0]==="calendar/kidOverrides/kid_a/2026-11-05"&&w.log.relay[1][1].undo[0].was.school===false,w.log.relay[1]); }
{ const w=world({form:{"cal-ov-date":"2026-11-05","cal-ov-type":"off"},confirm:false});
  w.call('calDeleteOverride("kid_a","2026-11-05")'); ok("'Remove?' declined → nothing",!w.log.removes.length&&!w.log.relay.length); }

console.log("5. the real cascade — a holiday / vacation on a later day");
{
  const FNS=["toMin","fromMin","_parseCheckTs","_dismissed","_normOrderArr","taskDevice","taskSubject","taskTier","capFor","capForDisplay","catchupDayCap","isCatchupCapped","subjNoCarry","applyStickyOrder","packDay","packAround","cascadeIntraWeek","calNormDate","smapIsOff","smapIsKidOff"].map(fn).join("\n");
  const RealDate=Date;
  const frozen=iso=>class F extends RealDate{ constructor(...a){ if(!a.length) super(iso+"T09:00:00"); else super(...a); } static now(){ return new RealDate(iso+"T09:00:00").getTime(); } };
  const mk=(id,who,day,time,o)=>Object.assign({id,who,day,time,dur:25,device:"paper",mom:"none",title:"📄 "+(o&&o.sk||"subj")+" — L"+((o&&o.L)||id),subjectKey:(o&&o.sk)||"subj_"+id},o||{});
  const WEEK={monday:"November 2",tuesday:"November 3",wednesday:"November 4",thursday:"November 5",friday:"November 6"};
  function run(cfg){
    const env={DAY_DT:WEEK,WK:"week5",ROSTER:["kid_a","kid_b"],weekData:{tasks:cfg.tasks},checked:cfg.checked||{a_m1:"10:20 AM Nov 2"},claimed:cfg.claimed||{},histState:{},momMoves:{},
      currData:{subjects:{kid_a:{},kid_b:{}}},rulesData:{},fbCurrLoaded:true,_cascNowMin:cfg.nowMin||toMin("10:30 AM"),DEFAULT_DAY_CAP:2,
      calendarData:Object.assign({holidays:{},vacations:{},kidOverrides:{}},cfg.calendar||{}),coopFullDayFor:()=>null,
      schedOv:()=>null,schedOvKidOff:()=>null,satCutoffMin:()=>null,satApplyCutoff:()=>{},sv:()=>{},dbg:()=>{},renderAll:()=>{},safeWriteTasks:()=>{},lockHeldByOther:()=>false,_dryRun:()=>true,
      db:{ref:()=>({update:()=>Promise.resolve(),set:()=>Promise.resolve()})},Date:frozen("2026-11-03"),console,JSON,Math,Object,Array,Set,Map,String,Number,parseInt,isNaN,Promise};
    const keys=Object.keys(env); new Function(...keys,"\"use strict\";"+FNS+"; cascadeIntraWeek(); return null;")(...keys.map(k=>env[k])); return cfg.tasks;
  }
  const week=()=>[mk("a_m1","kid_a","monday","10:00 AM",{sk:"math",L:1}),mk("a_t1","kid_a","tuesday","10:00 AM",{sk:"math",L:2}),
    mk("a_w1","kid_a","wednesday","10:00 AM",{sk:"math",L:3}),mk("a_w2","kid_a","wednesday","10:30 AM",{sk:"read"}),mk("a_wn","kid_a","wednesday","9:55 AM",{sk:"morning_nb",title:"📖 Morning Notebook — Morning Notebook",dur:5}),
    mk("a_th1","kid_a","thursday","10:00 AM",{sk:"math",L:4}),mk("a_th2","kid_a","thursday","10:30 AM",{sk:"read"}),mk("a_f1","kid_a","friday","10:00 AM",{sk:"math",L:5}),
    mk("b_th1","kid_b","thursday","10:00 AM",{sk:"math"}),mk("b_t1","kid_b","tuesday","11:00 AM",{sk:"math"})];
  { const T=run({tasks:week(),calendar:{holidays:{h1:{name:"Teacher day",start:"2026-11-05",end:"2026-11-05"}}}});
    ok("a holiday on Thursday: both kids' Thursday lessons leave it",!T.some(t=>t.day==="thursday"&&["a_th1","a_th2","b_th1"].includes(t.id)),T.filter(t=>t.day==="thursday").map(t=>t.id));
    ok("…they land on Wednesday / Friday, never Thursday",["a_th1","a_th2","b_th1"].every(id=>["wednesday","friday"].includes(T.find(x=>x.id===id).day)),["a_th1","a_th2","b_th1"].map(id=>T.find(x=>x.id===id).day));
    const math=T.filter(t=>t.who==="kid_a"&&t.subjectKey==="math").sort((a,b)=>["monday","tuesday","wednesday","thursday","friday"].indexOf(a.day)-["monday","tuesday","wednesday","thursday","friday"].indexOf(b.day)||toMin(a.time)-toMin(b.time));
    ok("kid A's math stays in lesson order",math.map(t=>t.title.slice(-2)).join(",")==="L1,L2,L3,L4,L5",math.map(t=>t.title.slice(-2)+"@"+t.day)); }
  { const T=run({tasks:week(),calendar:{vacations:{v1:{name:"Beach",start:"2026-11-05",end:"2026-11-08"}}}});
    ok("a vacation Thu–Sun: Thursday's lessons move to Wednesday (the only open day left) or carry",["a_th1","a_th2","b_th1"].every(id=>{ const t=T.find(x=>x.id===id); return t.day==="wednesday"||t._eowOverflow; }),["a_th1","a_th2","b_th1"].map(id=>{ const t=T.find(x=>x.id===id); return t.day+(t._eowOverflow?"(carry)":""); }));
    ok("Friday's own lesson, now on a vacation day, moves too",(function(){ const t=T.find(x=>x.id==="a_f1"); return t.day==="wednesday"||!!t._eowOverflow; })()); }
  { const T=run({tasks:week(),calendar:{holidays:{h1:{name:"Today off",start:"2026-11-03",end:"2026-11-03"}}}});
    ok("a holiday TODAY keeps today's narrow rule: today's cards stay (the 8 PM sweep handles today)",T.filter(t=>t.day==="tuesday").length===2,T.filter(t=>t.day==="tuesday").map(t=>t.id)); }
  { const T=week(); const before=JSON.stringify(T.map(t=>[t.id,t.day,t.time])); run({tasks:T});
    ok("no calendar entry → byte-identical",JSON.stringify(T.map(t=>[t.id,t.day,t.time]))===before); }
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
