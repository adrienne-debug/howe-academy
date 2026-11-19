/*
 * ↩ LE_BACKLINE (her words 2026-11-19): Lincoln ticked "Start your laundry: Lincoln's clothes" at 10:05 without doing it; Mom's
 * ✎ → 🪣 Wash today left the load under "On the machines now" and the line still read it 🫧 in the washer (no Start / Done). "It should
 * go back to the laundry line and change the in the washer status back, so that way it will show the options for done and start again."
 * A load the line started TODAY gets "↩ Not started — back on the laundry line" in place of Wash today, at any stage; saving it =
 * the line's own un-start (llUnstart(id,true)) + the kid's own tick un-ticked the way Mom's ↩︎ undo does it (choreUndo).
 * Runs the real LAUNDRYLINE, LAUNDRYEDIT, CHOREUNDO, toggleMorningStep, mdKidTick and rtBonusSettle in a vm.
 *                                                                                       run: node test_laundry_edit_backline.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
function slice(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); }
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const LTIMES=cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle(");
const CU=cut("// CHOREUNDO_START","// CHOREUNDO_END");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const LE=cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END");
const MIDNIGHT=(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
const at=m=>MIDNIGHT+m*60000, H=(h,m)=>h*60+(m||0);
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date(MIDNIGHT)), YDAY=iso(new Date(MIDNIGHT-864e5));
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date(MIDNIGHT).getDay()];
const MORNING=[{emoji:"🫧",label:"Mouthwash",pts:2,cad:"daily"},{emoji:"👕",label:"Get clothes on",pts:2,cad:"daily"}];
const WK="week7", SK=WK+"_"+DN+"_lincoln_mstep2", MK=WK+"_"+DN+"_lincoln_morning";
// Lincoln's clothes go every day here (caps 1 each day, his home day = today) so the row is on his Morning list whatever day it runs.
const LINE=()=>({caps:{"0":2,"1":2,"2":2,"3":2,"4":2,"5":2,"6":2},asOf:TODAY,homeFrom:TODAY,mode:"rotate",
  items:{lincoln:{label:"Lincoln's clothes",order:0,doer:"lincoln"},towels:{label:"Towels",order:1,doer:"mom"}}});

function mk(o){
  o=o||{}; const ls={}, writes=[], toasts=[], renders=[], inputs={}, bankLog=[], undos=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, SL_SLOTS:["morning","afternoon","chores","evening"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
    laundryData:{}, momHere:()=>!o.notMom, _kioskD:()=>false, dadAwardOk:()=>false, tab:"moms-plan", checked:{}, coSchoolEnd:()=>H(16,15),
    toMin:()=>null, fromMin:m=>String(m), laundryTimesEditorHTML:()=>"", mwTodayIso:()=>TODAY, mwToast:t=>toasts.push(t),
    renderMomsPlan:()=>renders.push("plan"), renderAll:()=>renders.push("all"), hhRender:()=>renders.push("hh"), renderSkylight:()=>{},
    document:{getElementById:id=>(id==="content")?{}:(inputs[id]||null)},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, calDateForWeekDay:d=>d===DN?TODAY:null, _hhIsoLocal:ms=>iso(new Date(ms)),
    day:DN, _todayDay:DN, activeWk:()=>WK, slState:{}, mrOpen:{}, nowTs:()=>"10:05 AM", slBefore:()=>({}), slSaveChanged:()=>{}, rlogAppend:()=>{},
    routineEditable:()=>true, _rtBlockedToast:()=>{}, zoneBonusFor:()=>0, choreVerifyOn:()=>false, _spBy:()=>"", dsAutoStart:()=>{}, rtDayBonusSettle:()=>{},
    routineBonus:{morning:{lincoln:5}},
    bank:{lincoln:{adjustments:{}}}, _bid:0,
    writes, toasts, renders, inputs, bankLog, undos};
  ctx.bankDirect=(kid,amt,note)=>{ const id="b"+(++ctx._bid); ctx.bank[kid].adjustments[id]={amount:amt,note}; bankLog.push(["pay",kid,amt,note,id]); return id; };
  ctx.bankDirectRemove=(kid,id)=>{ delete ctx.bank[kid].adjustments[id]; bankLog.push(["remove",kid,id]); };
  class FakeDate extends Date { constructor(...a){ if(a.length) super(...a); else super(FakeDate.now()); } static now(){ return at(ctx._nowM); } }
  ctx.Date=FakeDate; ctx._nowM=o.nowMin||H(10,30);
  vm.createContext(ctx);
  vm.runInContext(LL+"\n"+LCONST+"\n"+LTIMES+"\n"+MS+"\n"+CU+"\n"+LE+"\n"
    +["toggleMorningStep","mdKidTick","rtBonusFor","rtBonusSettle","mStepDoneOn","morningStepsFor","laundryKidHook","laundryStarts","laundryStartGuess","laundryKidId"].map(slice).join("\n")
    +"\nlaundryTimes={wash:50,dry:60,grace:5};laundryBlockMins={move:5,fold:15};"
    +"var _rtMomTick=false; function hdAt(){ return null; } function morningDueIdx(kid){ return morningStepsFor(kid).map(function(s,i){ return i; }); }"
    +"function morningComplete(kid,d){ return morningDueIdx(kid).every(function(i){ return mStepDoneOn(kid,d,i); }); } function rtComplete(){ return false; }"
    +"function rtStepsFor(slot,kid,raw,dn){ const b=slot==='morning'&&kid==='lincoln'?MORNING_:[]; return raw?b:llRtSteps(slot,kid,b,dn); } var MORNING_="+JSON.stringify(MORNING)+";"
    +"laundryLine="+JSON.stringify(o.line||LINE())+";",ctx);
  const T={ctx,writes,toasts,renders,inputs,bankLog,run:e=>vm.runInContext(e,ctx)};
  T.wrap=n=>T.run("(function(){ const f="+n+"; "+n+"=function(){ undos.push(["+JSON.stringify(n)+"].concat([].slice.call(arguments))); return f.apply(null,arguments); }; })()");
  T.sheet=id=>T.run("laundryEditId="+JSON.stringify(id)+"; laundryEditSheetHTML("+JSON.stringify(id)+")");
  T.opts=id=>{ const h=T.sheet(id), k=String(id).replace(/[^A-Za-z0-9_-]/g,"_"), i=h.indexOf('id="le-stage-'+k+'"'), seg=h.slice(i,h.indexOf('</select>',i)); const out=[]; seg.replace(/<option value="([^"]*)"( selected)?>([^<]*)</g,(m,v,s,t)=>out.push({v,sel:!!s,t})); return out; };
  T.save=(id,stage)=>{ const k=String(id).replace(/[^A-Za-z0-9_-]/g,"_"), O=T.opts(id), sel=O.find(x=>x.sel);
    inputs['le-name-'+k]={value:T.run("laundryData["+JSON.stringify(id)+"].label")}; inputs['le-stage-'+k]={value:stage!=null?stage:(sel?sel.v:(O[0]||{}).v)};
    inputs['le-ts-'+k]={value:T.run("_leHM(laundryData["+JSON.stringify(id)+"].ts)")}; inputs['le-by-'+k]={value:T.run("laundryData["+JSON.stringify(id)+"].by||'mom'")}; inputs['le-wet-'+k]={checked:!!T.run("laundryData["+JSON.stringify(id)+"].wet")};
    T.run("laundryEditId="+JSON.stringify(id)); return T.run("laundryEditSave("+JSON.stringify(id)+")"); };
  T.loadId=()=>T.run("Object.keys(laundryData).find(function(k){ return laundryData[k].line==='lincoln'; })");
  T.kidTick=()=>{ T.ctx._nowM=H(10,5); T.run("_rtMomTick=false; momHere=function(){ return false; }; toggleMorningStep('lincoln',2); momHere=function(){ return "+(!o.notMom)+"; };"); T.ctx._nowM=o.nowMin||H(10,30); };
  return T;
}
const started=T=>T.run("llLog(llToday())").indexOf("lincoln")>=0;
const lineWords=T=>T.run("llLoadStage('lincoln',llToday())");

console.log("── (a) Lincoln's own tick at 10:05, Mom ✎ → 🪣 Wash today (the live case), then ↩ back on the line ──");
{ const T=mk(); T.run("slState["+JSON.stringify(MK)+"]={done:false}"); T.run("slState['"+WK+"_"+DN+"_lincoln_mstep0']={done:true,pts:2}; slState['"+WK+"_"+DN+"_lincoln_mstep1']={done:true,pts:2};");
  ok("his Morning list has row 2 = Start your laundry: Lincoln's clothes", T.run("morningStepsFor('lincoln')[2].label")==="Start your laundry: Lincoln's clothes");
  T.kidTick(); const id=T.loadId();
  ok("his own tick: the line load is in the washer, the row ticked by him with stars (no auto), the 🏁 list bonus paid", !!id&&T.run("laundryData['"+id+"'].stage")==="washer"&&T.run("slState['"+SK+"'].done")&&!T.run("slState['"+SK+"'].auto")&&T.run("slState['"+SK+"'].pts")>0&&!!T.run("slState['"+MK+"'].bonusBid"), T.run("slState"));
  T.save(id,"bin");   // Mom's first attempt today: ✎ → Wash today
  ok("✎ → Wash today (today's code): the load sits at bin, the line still reads it started, the log still points at it", T.run("laundryData['"+id+"'].stage")==="bin"&&started(T)&&T.run("laundryLine.log[llToday()].lincoln.load")===id);
  ok("…and un-ticking his row on his own does nothing to the load (old guard intact)", (()=>{ T.run("llKidRowHook('lincoln',morningStepsFor('lincoln')[2],false)"); return !!T.run("laundryData['"+id+"']")&&started(T); })());
  const O=T.opts(id);
  ok("✎ now offers ↩ Not started — back on the laundry line", O.some(x=>x.v==="line"&&x.t==="↩ Not started — back on the laundry line"&&!x.sel), O);
  ok("…the stage it's at is shown honestly and selected: 🪣 Wash today (where it is now) — the only bin option, not a destination", O.filter(x=>x.v==="bin").length===1&&O.find(x=>x.v==="bin").sel&&/where it is now/.test(O.find(x=>x.v==="bin").t)&&O.filter(x=>x.sel).length===1, O);
  ok("…the new choice is never pre-selected", !O.find(x=>x.v==="line").sel);
  ok("saving the sheet as drawn changes nothing (still bin)", (()=>{ T.writes.length=0; T.save(id); return T.run("laundryData['"+id+"'].stage")==="bin"&&!T.writes.some(w=>w[0]==="rm"); })());
  T.writes.length=0; T.toasts.length=0; T.renders.length=0; T.bankLog.length=0; T.ctx.undos.length=0; T.wrap("choreUndo"); T.wrap("cuUnpay");
  const r=T.save(id,"line");
  ok("Save ↩: laundry/<id> removed (leaves On the machines now)", r&&r.backLine&&T.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+id)&&!T.run("laundryData['"+id+"']"), T.writes);
  ok("…laundryLine log/<today>/lincoln nulled in one targeted update", T.writes.some(w=>w[0]==="update"&&w[1]==="laundryLine"&&w[2]["log/"+TODAY+"/lincoln"]===null), T.writes);
  ok("…no whole-node writes", !T.writes.some(w=>w[0]==="set"&&(w[1]==="laundry"||w[1]==="laundryLine")));
  ok("…the line reads it not started and offers 🫧 Start (llLoadStage empty)", !started(T)&&lineWords(T)==="", lineWords(T));
  ok("…his row is un-ticked through choreUndo (Mom's ↩︎ undo), once", T.ctx.undos.filter(u=>u[0]==="choreUndo").length===1&&T.ctx.undos.find(u=>u[0]==="choreUndo").slice(1).join()===["morning","lincoln",DN,2].join()&&!T.run("slState['"+SK+"'].done"), T.ctx.undos);
  ok("…its stars come back off through cuUnpay once: −10 '↩︎ Mom undid: Start your laundry: Lincoln's clothes'", T.ctx.undos.filter(u=>u[0]==="cuUnpay").length===1&&T.bankLog.filter(b=>b[0]==="pay"&&b[2]===-10&&/Mom undid: Start your laundry: Lincoln's clothes/.test(b[3])).length===1, T.bankLog);
  ok("…the Morning list reads not done and the 🏁 bonus line is removed (as Mom un-ticking that one row does)", !T.run("slState['"+MK+"'].done")&&!T.run("slState['"+MK+"'].bonusBid")&&T.bankLog.some(b=>b[0]==="remove"), [T.run("slState['"+MK+"']"),T.bankLog]);
  ok("…one toast: ↩ Lincoln's clothes is back on the laundry line; the page redraws", T.toasts.filter(t=>/back on the laundry line/.test(t)).length===1&&T.toasts.includes("↩ Lincoln's clothes is back on the laundry line")&&T.renders.length>0, [T.toasts,T.renders]);
  ok("…the sheet is closed", T.run("laundryEditId")===null);
  T.kidTick(); const id2=T.loadId();
  ok("he can tick it for real now: a new load in the washer, the line reads it started", !!id2&&id2!==id&&started(T)&&T.run("laundryData['"+id2+"'].stage")==="washer");
}
console.log("── (b) the same from the dryer ──");
{ const T=mk(); T.kidTick(); const id=T.loadId(); T.save(id,"dryer");
  ok("in the dryer: the line still counts it", T.run("laundryData['"+id+"'].stage")==="dryer"&&started(T));
  const O=T.opts(id); ok("✎ offers ↩ back on the line, no 🪣 Wash today at all, 🌀 dryer selected", O[0].v==="line"&&!O.some(x=>/Wash today/.test(x.t))&&O.find(x=>x.sel).v==="dryer", O);
  T.ctx.undos.length=0; T.wrap("choreUndo"); T.writes.length=0; T.save(id,"line");
  ok("Save: load removed, log nulled, row un-ticked, line offers Start", !T.run("laundryData['"+id+"']")&&!started(T)&&!T.run("slState['"+SK+"'].done")&&T.ctx.undos.filter(u=>u[0]==="choreUndo").length===1);
  T.run("momBlocks={}");
}
console.log("── (b2) its Mom block for the stage it's in goes too (as llUnstart drops it) ──");
{ const T=mk(); T.kidTick(); const id=T.loadId(); T.save(id,"dryer"); const key=T.run("momBlockKey('"+id+"','dryer')");
  T.run("momBlocks["+JSON.stringify(key)+"]={iso:'"+TODAY+"',label:'x'}"); T.writes.length=0; T.save(id,"line");
  ok("momBlocks/<today>/<id>_dryer removed", T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+TODAY+"/"+key)&&!T.run("momBlocks["+JSON.stringify(key)+"]"), T.writes);
}
console.log("── (c) Mom started it (🫧 Start on the line) → the kid row was the automatic tick ──");
{ const T=mk(); T.run("llStart('lincoln')"); const id=T.loadId();
  ok("his row reads ticked by the line (auto, 0 ⭐)", T.run("slState['"+SK+"'].auto")==="line"&&T.run("slState['"+SK+"'].pts")===0, T.run("slState['"+SK+"']"));
  T.save(id,"bin"); T.wrap("choreUndo"); T.bankLog.length=0; T.save(id,"line");
  ok("↩: load gone, line not started, row un-ticked by llSyncKidRows — no choreUndo, no star change", !T.run("laundryData['"+id+"']")&&!started(T)&&!T.run("slState['"+SK+"'].done")&&!T.ctx.undos.some(u=>u[0]==="choreUndo")&&T.bankLog.length===0, [T.ctx.undos,T.bankLog]);
}
console.log("── (d) loads that keep today's list ──");
{ const T=mk(); T.run("laundryData.x1={label:'Towels',stage:'dryer',ts:"+at(H(9,0))+"}");
  const O=T.opts("x1"); ok("a load not from the line: exactly today's list (🪣 Wash today first, no ↩)", O.map(x=>x.v).join()==="bin,prewash,washer,wetbasket,dryer,basket,fold"&&O[0].t==="🪣 Wash today"&&O.find(x=>x.sel).v==="dryer", O);
  T.run("laundryData.y1={label:\"Lincoln's clothes\",stage:'dryer',ts:"+at(H(9,0))+",line:'lincoln',lineDay:'"+YDAY+"'}; laundryLine.log={}; laundryLine.log['"+YDAY+"']={lincoln:{at:1,load:'y1',by:'lincoln'}};");
  const P=T.opts("y1"); ok("a line load from an earlier day: today's list, Wash today still there", P.map(x=>x.v).join()==="bin,prewash,washer,wetbasket,dryer,basket,fold"&&!P.some(x=>x.v==="line"), P);
  ok("…and a hand-made 'line' value on Save does nothing to it", (()=>{ T.writes.length=0; T.save("y1","line"); return !!T.run("laundryData.y1")&&!T.writes.some(w=>w[0]==="rm"); })());
  T.run("laundryData.z1={label:\"Lincoln's clothes\",stage:'washer',ts:1,line:'lincoln',lineDay:'"+TODAY+"'}; laundryLine.log['"+TODAY+"']={lincoln:{at:1,load:'zz',by:'mom'}};");
  ok("today's line load whose log entry points at another load: today's list", !T.opts("z1").some(x=>x.v==="line"));
  T.run("laundryData.r1={label:'Towels',stage:'washer',ts:1,line:'towels',lineDay:'"+TODAY+"'}; laundryLine.log['"+TODAY+"'].towels={at:1,load:'r1',by:'mom',with:'lincoln'};");
  ok("a 🔗 rider entry: today's list", !T.opts("r1").some(x=>x.v==="line"));
  T.run("laundryData.s1={label:'L — hanging',stage:'airdry',ts:1,line:'lincoln',lineDay:'"+TODAY+"',split:{of:'zz',part:'hang'},cycle:[{k:'airdry'}],step:0}; laundryLine.log['"+TODAY+"'].lincoln={at:1,load:'s1',by:'mom'};");
  ok("a split half: no ↩ choice", !T.opts("s1").some(x=>x.v==="line"));
  const N=mk({notMom:true}); N.kidTick(); const nid=N.loadId();
  ok("not Mom: no sheet, and laundryEditBackLine refuses", N.run("laundryEditId='"+nid+"'; laundryEditSheetHTML('"+nid+"')")===""&&N.run("laundryEditBackLine('"+nid+"')")===false&&!!N.run("laundryData['"+nid+"']"));
}
console.log("── (d2) a 🌀 cycle line load past its first step ──");
{ const L=LINE(); L.items.lincoln.cycle=[{k:"wash"},{k:"dry"}]; const T=mk({line:L}); T.kidTick(); const id=T.loadId();
  ok("it is a cycle load on its first step", T.run("lcHas(laundryData['"+id+"'])&&lcStep(laundryData['"+id+"'])===0"));
  T.run("laundryData['"+id+"'].step=1; laundryData['"+id+"'].stage=lcStageOf(lcSteps(laundryData['"+id+"']),1)");
  const O=T.opts(id); ok("✎ offers ↩ first; its dry step selected; no Wash today", O[0].v==="line"&&O.find(x=>x.sel).v==="s1"&&!O.some(x=>x.v==="bin"), O);
  T.save(id,"line"); ok("Save: load gone, line not started, row un-ticked", !T.run("laundryData['"+id+"']")&&!started(T)&&!T.run("slState['"+SK+"'].done"));
}
console.log("── (e) dry run: nothing is written ──");
{ const T=mk({dry:true}); T.kidTick(); const id=T.loadId(); T.writes.length=0; T.save(id,"bin"); T.save(id,"line");
  ok("no db writes at all", T.writes.length===0, T.writes);
  ok("…the local view still goes back (load gone here, line not started)", !T.run("laundryData['"+id+"']")&&!started(T));
}
console.log("── (f) old guards: a kid's un-tick and ✕ on a load that moved on are still refused ──");
{ const T=mk(); T.kidTick(); const id=T.loadId(); T.save(id,"dryer"); T.writes.length=0;
  T.run("momHere=function(){ return false; }; toggleMorningStep('lincoln',2); momHere=function(){ return true; };");
  ok("Lincoln un-ticks his row with the load in the dryer: the load stays, the line still counts it", !!T.run("laundryData['"+id+"']")&&started(T)&&!T.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+id));
  ok("llUnstart(id) with no flag: still false", T.run("llUnstart('"+id+"')")===false&&!!T.run("laundryData['"+id+"']"));
  ok("llUnlog(id,l) with no flag: the log stays", (T.run("llUnlog('"+id+"',laundryData['"+id+"'])"),T.run("laundryLine.log[llToday()].lincoln.load"))===id);
}
console.log("── source ──");
{ const blk=cut("// LE_BACKLINE_START","// LE_BACKLINE_END");
  ok("no kid or family names in the new block", !/lincoln|ellis|lucy|julian|adrienne|howe/i.test(blk.replace(/^\/\/.*$/gm,"")));
  ok("the un-start reuses llUnstart (no second remover) and the un-tick reuses choreUndo (no second star reversal)", /llUnstart\(id,true\)/.test(blk)&&/choreUndo\(/.test(blk)&&!/bankDirect/.test(blk)&&!/db\.ref/.test(blk));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
