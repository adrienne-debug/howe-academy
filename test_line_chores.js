/*
 * 🧺 LINE_CHORES (her ask 2026-10-18: "will the laundry show up in the persons chore/ morning / afternoon / evening list and then start
 * when they click?"; picks: start row on Morning; "if the wash gets clicked in morning then fold shows up in afternoon list"). Replays
 * Lincoln's real rows: old laundry rows hidden IN PLACE (indices kept), the line's rows appended; ✓ starts / puts away the line load.
 * run: node test_line_chores.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", TUE="2026-10-20";
const DAYS={monday:MON,tuesday:TUE};
// Lincoln's real chores rows (household/jobs 2026-10-17): Start your laundry load (wk:0, laundry:true), Fold + put away (wk:0), kitchen shelves.
const LINCOLN_CHORES=[{emoji:"🧺",label:"Start your laundry load",pts:10,cad:"wk:0",laundry:true},{emoji:"👕",label:"Fold + put away your clothes",pts:15,cad:"wk:0"},{emoji:"🧼",label:"Open kitchen shelves: empty, wash, refill",pts:20,cad:"wk:5"}];
const MORNING=[{emoji:"🫧",label:"Mouthwash",pts:2,cad:"daily"},{emoji:"👕",label:"Get clothes on",pts:2,cad:"daily"}];
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>true, laundryData:{}, calDateForWeekDay:d=>DAYS[d]||null, day:o.dayName||"monday", _todayDay:o.dayName||"monday", tab:"kids", renderAll:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    rtStepsFor:(sl,kid,raw)=>sl==="chores"?LINCOLN_CHORES:sl==="morning"?MORNING:[],
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL+"\n"+fn("laundryStartGuess")+"\n"+fn("laundryStarts")+"\n"+fn("laundryKidId")+"\n"+fn("laundryKidHook"),ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line!==null) vm.runInContext("laundryLine="+JSON.stringify(o.line||{caps:{"0":2,"1":1,"2":2,"3":1,"4":3,"5":0,"6":0},asOf:MON,homeFrom:MON})+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}

console.log("1. Lincoln's lists on his Monday");
{ const c=mk(); const ch=c.llRtSteps("chores","lincoln",LINCOLN_CHORES,"monday"), mo=c.llRtSteps("morning","lincoln",MORNING,"monday"), af=c.llRtSteps("afternoon","lincoln",[],"monday");
  ok("chores: the old Start + Fold rows stay in place (index 0, 1) but read cad none; the shelves row untouched", ch.length===3&&ch[0].cad==="none"&&ch[0].label==="Start your laundry load"&&ch[1].cad==="none"&&ch[2].cad==="wk:5"&&!ch[2].llHidden, ch.map(s=>[s.label,s.cad]));
  ok("morning: his two rows first, then 🧺 Start your laundry: Lincoln's clothes (10 ⭐, his old row's value)", mo.length===3&&mo[0].label==="Mouthwash"&&mo[1].label==="Get clothes on"&&mo[2].label==="Start your laundry: Lincoln's clothes"&&mo[2].pts===10&&mo[2].laundry===true&&mo[2].line==="lincoln", mo.map(s=>s.label));
  ok("afternoon: nothing yet (it hasn't gone in)", af.length===0);
  const tu=c.llRtSteps("morning","lincoln",MORNING,"tuesday"); ok("Tuesday (Ellis's day): no laundry row for Lincoln", tu.length===2);
}
console.log("2. ✓ in the morning → the line load starts; then fold shows in the afternoon");
{ const c=mk(); const row=c.llRtSteps("morning","lincoln",MORNING,"monday")[2];
  c.laundryKidHook("lincoln",row,"wk_monday_lincoln_mstep2",true);
  const set=c.writes.find(w=>w[0]==="set"), up=c.writes.find(w=>w[0]==="update");
  ok("✓ Start: the line load is in the washer, Lincoln's, logged on the line", set&&set[2].line==="lincoln"&&set[2].by==="lincoln"&&set[2].stage==="washer"&&up[2]["log/"+MON+"/lincoln"].by==="lincoln", [set,up]);
  ok("…no separate lk_ load was made (the old hook skipped)", !c.writes.some(w=>/laundry\/lk_/.test(w[1])));
  const af=c.llRtSteps("afternoon","lincoln",[],"monday");
  ok("afternoon now has 👕 Fold + put away: Lincoln's clothes (15 ⭐, his old fold row's value)", af.length===1&&af[0].label==="Fold + put away: Lincoln's clothes"&&af[0].pts===15&&af[0].laundry==="lineFold", af);
  c.writes.length=0; c.laundryKidHook("lincoln",row,"k",true); ok("✓ again: nothing more (already in)", c.writes.length===0);
  const lid=set[1].slice(8); c.writes.length=0; c.laundryKidHook("lincoln",af[0],"k2",true);
  ok("✓ Fold + put away: the load is put away (laundry/<id> removed)", c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+lid)&&!c.get("laundryData")[lid], c.writes);
}
console.log("3. Un-✓ the start while it's still in the washer → back in line");
{ const c=mk(); const row=c.llRtSteps("morning","lincoln",MORNING,"monday")[2]; c.laundryKidHook("lincoln",row,"k",true); c.writes.length=0;
  c.laundryKidHook("lincoln",row,"k",false); ok("one null on the log; Monday's Lincoln is waiting again", c.writes.length===1&&c.writes[0][2]["log/"+MON+"/lincoln"]===null&&c.llProject(MON,1,false)[0].started.length===0, c.writes);
  const b=mk({dayName:"tuesday"}); const r2=b.llRtSteps("morning","lincoln",MORNING,"monday")[2]; b.get("day='monday'"); b.get("_todayDay='tuesday'"); b.laundryKidHook("lincoln",r2,"k",true);
  ok("back-filling yesterday's list starts nothing", b.writes.length===0);
}
console.log("4. When the line doesn't cover him");
{ const m=mk({line:{caps:{"0":2},asOf:MON,homeFrom:MON,items:{lincoln:{label:"Lincoln's clothes",order:0,doer:"mom"}}}});
  ok("Lincoln's load run by Mom: his lists are exactly as stored", m.llRtSteps("chores","lincoln",LINCOLN_CHORES,"monday")===LINCOLN_CHORES&&m.llRtSteps("morning","lincoln",MORNING,"monday")===MORNING);
  const n=mk({line:null}); ok("no line set up: untouched", n.llRtSteps("chores","lincoln",LINCOLN_CHORES,"monday")===LINCOLN_CHORES);
  ok("a non-laundry row with the word 'wash' (kitchen shelves) is never hidden", !mk().llOldLaundryRow(LINCOLN_CHORES[2]));
}
console.log("5. Ellis covering (Lincoln off)");
{ const c=mk({line:{caps:{"0":2,"1":1},asOf:MON,homeFrom:MON,cover:{[MON]:{lincoln:"ellis"}}}});
  ok("Ellis's Morning gets 'Start your laundry: Lincoln's clothes'; Lincoln's doesn't", /Lincoln's clothes/.test(c.llRtSteps("morning","ellis",MORNING,"monday").map(s=>s.label).join())&&c.llRtSteps("morning","lincoln",MORNING,"monday").length===2);
}
console.log("5b. Mom's and Dad's checklists (her ask 2026-10-18: \"go to my checklist and dad as well\")");
{ const L={caps:{"0":3},asOf:MON,homeFrom:MON,items:{lincoln:{label:"Lincoln's clothes",order:0},sheets:{label:"King + queen sheets",emoji:"🛏",order:1,home:0,doer:"mom"},towels:{label:"Towels",emoji:"🛁",order:2,home:0,doer:"both"}}};
  const c=mk({line:L}); const mm=c.llParentRows("mom","morning"), dm=c.llParentRows("dad","morning");
  ok("Mom's ☀️ Morning: Start: King + queen sheets, Start: Towels (Mom or Dad) — not Lincoln's", mm.map(r=>r.label).join("|")==="Start: King + queen sheets|Start: Towels"&&mm.every(r=>!r.done), mm);
  ok("Dad's ☀️ Morning: only Start: Towels (Mom or Dad)", dm.map(r=>r.label).join("|")==="Start: Towels", dm);
  ok("no Afternoon rows yet", c.llParentRows("mom","afternoon").length===0);
  c.llParentTick("towels","start","dad"); const set=c.writes.find(w=>w[0]==="set");
  ok("Dad ticks Start: Towels → the line load, his (by dad)", set&&set[2].line==="towels"&&set[2].by==="dad", set);
  ok("…now ticked on both checklists, and 🌤 Afternoon has Fold + put away: Towels for both", c.llParentRows("mom","morning").find(r=>r.id==="towels").done&&c.llParentRows("dad","morning").find(r=>r.id==="towels").done&&c.llParentRows("mom","afternoon").map(r=>r.label).join()==="Fold + put away: Towels"&&c.llParentRows("dad","afternoon").length===1);
  const lid=set[1].slice(8); c.writes.length=0; c.llParentTick("towels","fold","mom");
  ok("Mom ticks Fold + put away → put away (laundry/<id> removed), the row reads done", c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+lid)&&c.llParentRows("mom","afternoon")[0].done, c.writes);
  const u=mk({line:L}); u.llParentTick("sheets","start","mom"); u.writes.length=0; u.llParentTick("sheets","start","mom");
  ok("ticking Start again while it's still in the washer: back in line", u.writes.length===1&&u.writes[0][2]["log/"+MON+"/sheets"]===null, u.writes);
  ok("the row: blue, '🧺 line', a ✓ circle", /🧺 line/.test(c.llParentRowHTML(mm[0],"mom"))&&/llParentTick\('sheets','start','mom'\)/.test(c.llParentRowHTML(mm[0],"mom")));
  ok("no line set up: no rows", mk({line:null}).llParentRows("mom","morning").length===0);
  const M=fn("momDayStripHTML"); ok("the checklist counts them in the slot and draws them under her own rows (today only)", /_lr=typeof llParentRows==="function"&&typeof llToday==="function"&&iso===llToday\(\)\?llParentRows\(P\.dad\?"dad":"mom",sl\)/.test(M)&&/tot=ids\.length\+sp\+_lr\.length/.test(M)&&/h\+=_lrc\.map\(r=>llParentRowHTML\(r,P\.dad\?"dad":"mom"\)\)/.test(M));
}
console.log("5c. Ticked everywhere at once (her rule 2026-10-18: \"checked off automatically if they are checked off in any other areas\")");
{ const c=mk(); const saved=[];
  c.get("slState={}; activeWk=function(){ return 'week30'; }; nowTs=function(){ return '9:05 AM'; }; slBefore=function(){ return {}; }; morningComplete=function(){ return false; }; rtComplete=function(){ return false; };");
  c.get("var _base=rtStepsFor; rtStepsFor=function(sl,kid,raw,dn){ const b=_base(sl,kid,raw); return raw?b:llRtSteps(sl,kid,b,dn||'monday'); };");
  c.slSaveChanged=(wk,b)=>saved.push(wk); c.get("slSaveChanged=this.slSaveChanged");
  c.llStart("lincoln");   // Mom starts it from Home Base
  const m=c.get("slState['week30_monday_lincoln_mstep2']");
  ok("Mom starts Lincoln's load on Home Base → his Morning row reads ✓ (auto, 0 ⭐), saved once", m&&m.done===true&&m.pts===0&&m.auto==="line"&&saved.length===1, [m,saved]);
  const lid=Object.keys(c.get("laundryData"))[0]; c.llPutAway(lid);
  const f=c.get("slState['week30_monday_lincoln_astep0']"); ok("put away anywhere → his Afternoon 'Fold + put away' reads ✓ (auto)", f&&f.done===true&&f.auto==="line", f);
  const u=mk(); u.get("slState={}; activeWk=function(){ return 'week30'; }; nowTs=function(){ return ''; }; slBefore=function(){ return {}; }; slSaveChanged=function(){}; morningComplete=function(){ return false; }; rtComplete=function(){ return false; };");
  u.get("var _base=rtStepsFor; rtStepsFor=function(sl,kid,raw,dn){ const b=_base(sl,kid,raw); return raw?b:llRtSteps(sl,kid,b,dn||'monday'); };");
  u.llStart("lincoln"); const ul=Object.keys(u.get("laundryData"))[0]; u.llUnlog(ul,u.get("laundryData")[ul]);
  ok("back in line (✕ in the washer) → the automatic ✓ comes off", u.get("slState['week30_monday_lincoln_mstep2'].done")===false);
  const k=mk(); k.get("slState={week30_monday_lincoln_mstep2:{done:true,pts:30,bid:'b1'}}; activeWk=function(){ return 'week30'; }; nowTs=function(){ return ''; }; slBefore=function(){ return {}; }; slSaveChanged=function(){}; morningComplete=function(){ return false; }; rtComplete=function(){ return false; };");
  k.get("var _base=rtStepsFor; rtStepsFor=function(sl,kid,raw,dn){ const b=_base(sl,kid,raw); return raw?b:llRtSteps(sl,kid,b,dn||'monday'); };");
  k.llStart("lincoln"); const kl=Object.keys(k.get("laundryData"))[0]; k.llUnlog(kl,k.get("laundryData")[kl]);
  ok("Lincoln's OWN tick (paid 30 ⭐) is never undone by the line", k.get("slState['week30_monday_lincoln_mstep2'].done")===true&&k.get("slState['week30_monday_lincoln_mstep2'].pts")===30);
  ok("Home Base's ✓ Put away syncs too", /if\(l\.line&&typeof llSyncKidRows==="function"\) llSyncKidRows\(\);/.test(fn("laundryAdvance")));
}
console.log("6. Wiring");
ok("rtStepsFor appends the line's rows; the raw (editor) path is untouched", /if\(raw\) return steps;[^\n]*\n\s*const _r=rtApplyRot\(slot,kid,steps,dayName\);\n\s*return \(typeof llRtSteps==="function"\)\?llRtSteps\(slot,kid,_r,dayName\):_r;/.test(src));
ok("Morning's ✓ calls the laundry hook only for the line's own row", /if\(_st&&_st\.line&&typeof laundryKidHook==="function"\) laundryKidHook\(kid,_st,sk,now\);/.test(fn("toggleMorningStep")));
ok("the laundry hook hands line rows over first", /^function laundryKidHook\(kid,st,sk,now\)\{\n  if\(st&&st\.line&&typeof llKidRowHook==="function"\)\{ llKidRowHook\(kid,st,now\); return; \}/.test(fn("laundryKidHook")));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
