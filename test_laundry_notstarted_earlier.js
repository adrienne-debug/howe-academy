/*
 * ↩ LE_BACKLINE for an EARLIER day's load (her "Yes, fix it" 2026-11-21): a kid ticked "Start your laundry" on Friday 2:02 PM and
 * did not start it; on Saturday the load still read "in the washer" and ✎ Edit had no "Not started" choice (today's loads only).
 * Now a line load from an earlier day, still on its first step, whose own day's log entry points at it, gets
 * "↩ Not started <Day> — back on the laundry line". Save = the line's own un-start for THAT day + the kid's tick on that day undone
 * the way Mom's ↩︎ undo does it (choreUndo). A tick in an earlier WEEK is left (slState holds this week only), and the toast says so.
 * Runs the real LAUNDRYLINE, LAUNDRYEDIT, CHOREUNDO, toggleMorningStep, mdKidTick and rtBonusSettle in a vm, on fixed dates.
 * "Byte-for-byte as before" compares against index.html at commit 5f47ff42 (pinned, never origin/main).
 * Made-up family (amos, bea, cy, dee).                                       run: node test_laundry_notstarted_earlier.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm"), cp=require("child_process");
const SRC=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const PIN="5f47ff42";   // the app before this change
let OLD=null; try{ OLD=cp.execSync("git show "+PIN+":index.html",{cwd:__dirname,maxBuffer:64<<20}).toString("utf8"); }catch(e){}
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,700)+")":"")); } };
const J=JSON.stringify; const CJ=v=>J(v,(k,x)=>(x&&typeof x==="object"&&!Array.isArray(x))?Object.keys(x).sort().reduce((o,q)=>(o[q]=x[q],o),{}):x);   // key order never matters

// Fixed dates: Mon 2026-11-16 … Sun 11-22 is week7 (Mon..Sun, as gwWeekDateRange dates it); week8 starts Mon 11-23.
// The brief: the week turns over on Sunday — so on Sunday activeWk() is already week8 here (its days dated 11-23…11-29).
const ISO=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DAYS={fri:["2026-11-20","friday","week7"],sat:["2026-11-21","saturday","week7"],sun:["2026-11-22","sunday","week8"],mon:["2026-11-23","monday","week8"],thu:["2026-11-19","thursday","week7"]};
const MON={week7:"2026-11-16",week8:"2026-11-23"};
const MS_OF=(iso,h,m)=>{ const p=iso.split("-").map(Number); return new Date(p[0],p[1]-1,p[2],h,m||0).getTime(); };
const MORNING=[{emoji:"🫧",label:"Mouthwash",pts:2,cad:"daily"},{emoji:"👕",label:"Get clothes on",pts:2,cad:"daily"}];
// Bea's clothes go every day here (rotate, cap 2 = both items each day) unless a test passes its own line.
const LINE=()=>({caps:{"0":2,"1":2,"2":2,"3":2,"4":2,"5":2,"6":2},asOf:"2026-11-16",homeFrom:"2026-11-16",mode:"rotate",
  items:{bea:{label:"Bea's clothes",order:0,doer:"bea"},towels:{label:"Towels",order:1,doer:"mom"}}});

function slicer(src){
  const slice=name=>{ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found: "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(d===0) return src.slice(i,k+1);} } throw new Error("unbalanced: "+name); };
  const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
  return {slice,cut};
}
function mk(o){
  o=o||{}; const src=o.src||SRC, S=slicer(src);
  const ls={}, writes=[], toasts=[], renders=[], inputs={}, bankLog=[], undos=[], slSaves=[], rlog=[];
  let seed=7; const M=Object.create(Math); M.random=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math:M,JSON,RegExp,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, _dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(J(v))]),update:v=>writes.push(["update",p,JSON.parse(J(v))]),remove:()=>writes.push(["rm",p])})},
    ROSTER:["amos","bea","cy","dee"], KID_NAME:{amos:"Amos",bea:"Bea",cy:"Cy",dee:"Dee"}, SL_SLOTS:["morning","afternoon","chores","evening"], RT_ABBR:{afternoon:"a",chores:"c",evening:"e"},
    DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"),
    laundryData:{}, momHere:()=>!o.notMom, _kioskD:()=>false, dadAwardOk:()=>false, tab:"moms-plan", checked:{}, coSchoolEnd:()=>17*60,
    toMin:()=>null, fromMin:m=>String(m), laundryTimesEditorHTML:()=>"", mwToast:t=>toasts.push(t),
    renderMomsPlan:()=>renders.push("plan"), renderAll:()=>renders.push("all"), hhRender:()=>renders.push("hh"), renderSkylight:()=>{},
    document:{getElementById:id=>(id==="content")?{}:(inputs[id]||null)},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, _hhIsoLocal:ms=>ISO(new Date(ms)),
    slState:{}, prevSlState:null, mrOpen:{}, nowTs:()=>"2:02 PM", slBefore:()=>({}), rlogAppend:(...a)=>rlog.push(a),
    routineEditable:()=>true, _rtBlockedToast:()=>{}, zoneBonusFor:()=>0, choreVerifyOn:()=>false, _spBy:()=>"", dsAutoStart:()=>{}, rtDayBonusSettle:()=>{},
    routineBonus:{morning:{bea:5}}, bank:{amos:{adjustments:{}},bea:{adjustments:{}},cy:{adjustments:{}},dee:{adjustments:{}}}, _bid:0,
    writes, toasts, renders, inputs, bankLog, undos, slSaves, rlog};
  ctx.bankDirect=(kid,amt,note)=>{ const id="b"+(++ctx._bid); ctx.bank[kid].adjustments[id]={amount:amt,note}; bankLog.push(["pay",kid,amt,note,id]); return id; };
  ctx.bankDirectRemove=(kid,id)=>{ delete ctx.bank[kid].adjustments[id]; bankLog.push(["remove",kid,id]); };
  // SLTARGET's slSaveChanged writes <wk>/sl/<key> for each changed key — recorded here so the writes can be listed.
  ctx.slBefore=()=>{ const b={}; Object.keys(ctx.slState).forEach(k=>{ b[k]=J(ctx.slState[k]); }); return b; };
  ctx.slSaveChanged=(wk,b)=>{ Object.keys(ctx.slState).forEach(k=>{ if(J(ctx.slState[k])!==b[k]) slSaves.push(wk+"/sl/"+k); }); };
  class FakeDate extends Date { constructor(...a){ if(a.length) super(...a); else super(FakeDate.now()); } static now(){ return ctx._now; } }
  ctx.Date=FakeDate;
  ctx.setDay=(k,h,m)=>{ const D=DAYS[k]; ctx._now=MS_OF(D[0],h==null?10:h,m==null?30:m); ctx.day=D[1]; ctx._todayDay=D[1]; ctx._wk=D[2]; };
  ctx.activeWk=()=>ctx._wk; ctx._prevWkKey=()=>ctx._wk==="week8"?"week7":"week6";
  ctx.calDateForWeekDay=(dn,wn)=>{ const i=ctx.DAYS_ALL.indexOf(dn); if(i<0) return null; const p=MON[ctx._wk].split("-").map(Number); return ISO(new Date(p[0],p[1]-1,p[2]+i)); };
  ctx.mwTodayIso=()=>ISO(new Date(ctx._now));
  ctx.setDay(o.start||"fri");
  vm.createContext(ctx);
  vm.runInContext(S.cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END")+"\n"+S.cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN")+"\n"+S.cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle(")+"\n"
    +S.cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END")+"\n"+S.cut("// CHOREUNDO_START","// CHOREUNDO_END")+"\n"+S.cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END")+"\n"
    +["toggleMorningStep","mdKidTick","rtBonusFor","rtBonusSettle","mStepDoneOn","morningStepsFor","laundryKidHook","laundryStarts","laundryStartGuess","laundryKidId"].map(S.slice).join("\n")
    +"\nlaundryTimes={wash:50,dry:60,grace:5};laundryBlockMins={move:5,fold:15};"
    +"var _rtMomTick=false; function hdAt(){ return null; } function morningDueIdx(kid){ return morningStepsFor(kid).map(function(s,i){ return i; }); }"
    +"function morningComplete(kid,d){ return morningDueIdx(kid).every(function(i){ return mStepDoneOn(kid,d,i); }); } function rtComplete(){ return false; }"
    +"function rtStepsFor(slot,kid,raw,dn){ const b=slot==='morning'&&kid==='bea'?MORNING_:[]; return raw?b:llRtSteps(slot,kid,b,dn); } var MORNING_="+J(MORNING)+";"
    +"laundryLine="+J(o.line||LINE())+";",ctx);
  const T={ctx,writes,toasts,renders,inputs,bankLog,undos,slSaves,rlog,run:e=>vm.runInContext(e,ctx)};
  T.wrap=n=>T.run("(function(){ const f="+n+"; "+n+"=function(){ undos.push(["+J(n)+"].concat([].slice.call(arguments))); return f.apply(null,arguments); }; })()");
  T.sheet=id=>T.run("laundryEditId="+J(id)+"; laundryEditSheetHTML("+J(id)+")");
  T.opts=id=>{ const h=T.sheet(id), k=String(id).replace(/[^A-Za-z0-9_-]/g,"_"), i=h.indexOf('id="le-stage-'+k+'"'), seg=h.slice(i,h.indexOf('</select>',i)); const out=[]; seg.replace(/<option value="([^"]*)"( selected)?>([^<]*)</g,(m,v,s,t)=>out.push({v,sel:!!s,t})); return out; };
  T.save=(id,stage)=>{ const k=String(id).replace(/[^A-Za-z0-9_-]/g,"_"), O=T.opts(id), sel=O.find(x=>x.sel);
    inputs['le-name-'+k]={value:T.run("laundryData["+J(id)+"].label")}; inputs['le-stage-'+k]={value:stage!=null?stage:(sel?sel.v:(O[0]||{}).v)};
    inputs['le-ts-'+k]={value:T.run("_leHM(laundryData["+J(id)+"].ts)")}; inputs['le-by-'+k]={value:T.run("laundryData["+J(id)+"].by||'mom'")}; inputs['le-wet-'+k]={checked:!!T.run("laundryData["+J(id)+"].wet")};
    T.run("laundryEditId="+J(id)); return T.run("laundryEditSave("+J(id)+")"); };
  T.loadId=()=>T.run("Object.keys(laundryData).find(function(k){ return laundryData[k].line==='bea'; })");
  // Bea's own taps on day k: Mouthwash, Get clothes on, then Start your laundry at 2:02 PM (the list completes → 🏁 bonus).
  T.kidDay=(k,noStart)=>{ ctx.setDay(k,14,2); T.run("_rtMomTick=false; momHere=function(){ return false; }; toggleMorningStep('bea',0); toggleMorningStep('bea',1);"+(noStart?"":" toggleMorningStep('bea',2);")+" momHere=function(){ return "+(!o.notMom)+"; };"); };
  T.next=(k,h,m)=>{ ctx.setDay(k,h,m); T.run("llRoll(); llHealLog();"); };   // a new day: the listener's roll + heal, as every device does
  T.clear=()=>{ writes.length=0; toasts.length=0; renders.length=0; bankLog.length=0; undos.length=0; slSaves.length=0; rlog.length=0; };
  T.sum=kid=>Object.values(ctx.bank[kid].adjustments).reduce((a,b)=>a+b.amount,0);
  return T;
}
const SK=(wk,dn,i)=>wk+"_"+dn+"_bea_mstep"+i, LK=(wk,dn)=>wk+"_"+dn+"_bea_morning";

console.log("── (a) Bea's own Start tick Friday 2:02 PM, nothing else; Saturday Mom ✎ → ↩ Not started Friday ──");
{ const T=mk(); const before={extras:J(T.run("laundryLine.extras||null")),log:J(T.run("laundryLine.log||null"))};
  T.kidDay("fri"); const id=T.loadId(), sumBeforeStart=T.sum("bea")-T.run("slState['"+SK("week7","friday",2)+"'].pts")-T.run("routineBonus.morning.bea");
  ok("Friday: her Morning row 2 is Start your laundry: Bea's clothes, ticked by her (no auto), 10 ⭐ stored, 🏁 bonus paid", T.run("slState['"+SK("week7","friday",2)+"'].done")&&!T.run("slState['"+SK("week7","friday",2)+"'].auto")&&T.run("slState['"+SK("week7","friday",2)+"'].pts")===10&&!!T.run("slState['"+LK("week7","friday")+"'].bonusBid"), T.run("slState"));
  ok("…the load is in the washer, lineDay Friday, by bea; the line's Friday log points at it", !!id&&T.run("laundryData['"+id+"'].stage")==="washer"&&T.run("laundryData['"+id+"'].lineDay")==="2026-11-20"&&T.run("laundryData['"+id+"'].by")==="bea"&&T.run("laundryLine.log['2026-11-20'].bea.load")===id);
  T.next("sat"); T.clear();
  ok("Saturday: the load still reads in the washer (the live case)", T.run("laundryData['"+id+"'].stage")==="washer"&&T.run("llLoadStage('bea','2026-11-20')")!=="");
  const O=T.opts(id);
  ok("✎ offers ↩ Not started Friday — back on the laundry line (first, never pre-selected)", O[0].v==="line"&&O[0].t==="↩ Not started Friday — back on the laundry line"&&!O[0].sel, O);
  ok("…🫧 In the washer is the one selected; no 🪣 Wash today (the same list today's loads get)", O.filter(x=>x.sel).length===1&&O.find(x=>x.sel).v==="washer"&&!O.some(x=>x.v==="bin"), O);
  T.wrap("choreUndo"); T.wrap("cuUnpay"); T.clear();
  const r=T.save(id,"line");
  ok("Save: {backLine:true}; laundry/<id> removed", r&&r.backLine&&!T.run("laundryData['"+id+"']"));
  ok("…the db writes are exactly: laundry/<id> remove + laundryLine update {log/2026-11-20/bea: null}", J(T.writes)===J([["rm","laundry/"+id],["update","laundryLine",{"log/2026-11-20/bea":null}]]), T.writes);
  ok("…the check-off writes (SLTARGET, <wk>/sl/<key>) are only her Friday Start row and Friday's Morning list record", J(T.slSaves.slice().sort())===J(["week7/sl/"+LK("week7","friday"),"week7/sl/"+SK("week7","friday",2)].sort()), T.slSaves);
  ok("…the line's Friday log is as before the tick (empty) and its extras untouched", J(T.run("laundryLine.log['2026-11-20']||{}"))==="{}"&&J(T.run("laundryLine.extras||null"))===before.extras, T.run("laundryLine.log"));
  ok("…her Friday Start row is un-ticked through choreUndo('morning','bea','friday',2), once", T.undos.filter(u=>u[0]==="choreUndo").length===1&&J(T.undos.find(u=>u[0]==="choreUndo").slice(1))===J(["morning","bea","friday",2])&&!T.run("slState['"+SK("week7","friday",2)+"'].done"), T.undos);
  ok("…the stars come back off through cuUnpay: −10 '↩︎ Mom undid: Start your laundry: Bea's clothes' (the stored amount)", T.undos.filter(u=>u[0]==="cuUnpay").length===1&&T.bankLog.filter(b=>b[0]==="pay").length===1&&T.bankLog.some(b=>b[0]==="pay"&&b[2]===-10&&b[3]==="↩︎ Mom undid: Start your laundry: Bea's clothes"), T.bankLog);
  ok("…the 🏁 Morning bonus is removed and Friday's list reads not done", T.bankLog.some(b=>b[0]==="remove")&&!T.run("slState['"+LK("week7","friday")+"'].done")&&!T.run("slState['"+LK("week7","friday")+"'].bonusBid"), [T.bankLog,T.run("slState['"+LK("week7","friday")+"']")]);
  ok("…the bank is back exactly to before her Start tick", T.sum("bea")===sumBeforeStart, [T.sum("bea"),sumBeforeStart]);
  ok("…the history line says Mom undid it (routineLog 'off', undo:mom) under Friday", T.rlog.some(a=>a[1]==="morning"&&a[2]==="Start your laundry: Bea's clothes"&&a[3]==="off"&&a[4]===10&&a[5]&&a[5].undo==="mom"), T.rlog);
  ok("…one toast: ↩ Bea's clothes is back on the laundry line (no 'left' words)", J(T.toasts)===J(["↩ Bea's clothes is back on the laundry line"]), T.toasts);
  ok("…the sheet is closed", T.run("laundryEditId")===null);
  ok("…Friday's list no longer carries a Start row (that day's log is empty)", !T.run("morningStepsFor('bea')").some||!T.run("rtStepsFor('morning','bea',false,'friday')").some(s=>s.line==="bea"));
}

console.log("── (b) where the Start row shows afterwards (the line's own rules, after the Saturday roll) ──");
{ // rotate, cap 2 = every day: Saturday's line already lays Bea's clothes → her Saturday Morning list has Start, unticked.
  const T=mk(); T.kidDay("fri"); const id=T.loadId(); T.next("sat"); T.save(id,"line");
  const st=T.run("rtStepsFor('morning','bea',false,'saturday')");
  ok("every-day line: Saturday's Morning list has Start your laundry: Bea's clothes, not ticked", st.some(s=>s.line==="bea")&&!T.run("slState['"+SK("week7","saturday",2)+"']"), st.map(s=>s.label));
}
const HOME=()=>({caps:{"0":1,"1":1,"2":1,"3":1,"4":1,"5":1,"6":0},asOf:"2026-11-20",homeFrom:"2026-11-16",mode:"home",
  items:{amos:{label:"Amos's clothes",order:0,doer:"amos",home:0},cy:{label:"Cy's clothes",order:1,doer:"cy",home:1},dee:{label:"Dee's clothes",order:2,doer:"dee",home:2},towels:{label:"Towels",order:3,doer:"mom",home:3},bea:{label:"Bea's clothes",order:4,doer:"bea",home:4},sheets:{label:"Sheets",order:5,doer:"mom",home:5}}});
const ROT=()=>Object.assign(HOME(),{mode:"rotate",next:"bea"});
const FACT={};
[["home days (each load has a weekday; Bea's = Friday)",HOME],["rotate, one load a day",ROT]].forEach(function(c){
  const T=mk({line:c[1]()}); T.ctx.setDay("fri",9,0);
  ok(c[0]+": Friday's line lays Bea's clothes", T.run("llProjectNow(1)[0].loads").indexOf("bea")>=0, T.run("llProjectNow(1)[0].loads"));
  T.kidDay("fri"); const id=T.loadId(); T.next("sat",9,0);
  const satBefore=T.run("llProjectNow(1)[0].loads"); T.save(id,"line");
  const R=T.run("llProjectNow(14)"), sat=R[0].loads, d=R.findIndex(x=>x.loads.indexOf("bea")>=0);
  const when=d<0?"not in the next 14 days":R[d].iso||("+"+d);
  FACT[c[0]]={satBefore,satAfter:sat,next:d<0?null:T.run("llAddDays(llToday(),"+d+")")};
  ok(c[0]+": after ↩ on Saturday (roll done), Saturday's line is unchanged — Bea's clothes is NOT put on today", J(sat)===J(satBefore)&&sat.indexOf("bea")<0&&!T.run("rtStepsFor('morning','bea',false,'saturday')").some(s=>s.line==="bea"), {satBefore,sat});
  ok(c[0]+": it comes up on the line's next lay of it: "+FACT[c[0]].next, d>0, R.map(x=>x.loads));
});
{ // the same without Saturday's roll (asOf still Friday — a device that has not rolled): the 8 PM rule brings it to the front
  const T=mk({line:HOME()}); T.kidDay("fri"); const id=T.loadId(); T.ctx.setDay("sat",9,0); T.save(id,"line");
  const sat=T.run("llProjectNow(1)[0].loads"); FACT.noRoll=sat;
  ok("home days, roll NOT yet saved (asOf Friday): Saturday's lay = "+J(sat)+" (the line re-walks Friday with it unstarted)", Array.isArray(sat), sat);
}

console.log("── (c) across the week change: tick Saturday (week7), fix Sunday / Monday (week8) ──");
[["sun","not loaded",null],["sun","loaded",true],["mon","not loaded",null],["mon","loaded",true]].forEach(function(c){
  const T=mk(); T.kidDay("sat"); const id=T.loadId(), sk=SK("week7","saturday",2), tick=J(T.run("slState['"+sk+"']")), sumAfterTick=T.sum("bea");
  T.next(c[0]); if(c[2]) T.run("prevSlState=JSON.parse(JSON.stringify(slState))"); const prevBefore=J(T.run("prevSlState")), slBeforeFix=J(T.run("slState"));
  const O=T.opts(id); T.wrap("choreUndo"); T.clear(); T.save(id,"line");
  const tag=c[0]+", last week's check-offs "+c[1];
  ok(tag+": offered as ↩ Not started Saturday — back on the laundry line", O[0].v==="line"&&O[0].t==="↩ Not started Saturday — back on the laundry line", O);
  ok(tag+": Save: load gone, log/2026-11-21/bea nulled — exactly those two writes", J(T.writes)===J([["rm","laundry/"+id],["update","laundryLine",{"log/2026-11-21/bea":null}]]), T.writes);
  ok(tag+": her Saturday tick is left as it was (slState / prevSlState unchanged), no choreUndo, no check-off writes", J(T.run("slState"))===slBeforeFix&&J(T.run("prevSlState"))===prevBefore&&J(T.run("slState['"+sk+"']"))===tick&&!T.undos.length&&!T.slSaves.length, T.undos);
  ok(tag+": the stars are left (no bank change) and the toast says so", !T.bankLog.length&&T.sum("bea")===sumAfterTick&&J(T.toasts)===J(["↩ Bea's clothes is back on the laundry line. Any ⭐ Bea got for it on Saturday were left — take them off in the Star Bank if you want"]), T.toasts);
});
{ // Mom started it from the line chip on Saturday (row auto-ticked, 0 ⭐): next week's fix has nothing to say about stars
  const T=mk(); T.ctx.setDay("sat",9,0); T.run("llStart('bea')"); const id=T.loadId(); T.next("mon"); T.clear(); T.save(id,"line");
  ok("Mom's own Start, fixed next week: plain toast (no stars to leave)", J(T.toasts)===J(["↩ Bea's clothes is back on the laundry line"]), T.toasts);
}
{ // Mom's own Start on Friday (auto-ticked row, 0 ⭐), fixed Saturday: no choreUndo, no bank change
  const T=mk(); T.ctx.setDay("fri",9,0); T.run("llStart('bea')"); const id=T.loadId(); T.next("sat"); T.wrap("choreUndo"); T.clear(); T.save(id,"line");
  ok("Mom started it Friday (auto tick): Saturday's ↩ removes the load, no choreUndo, no star change", !T.run("laundryData['"+id+"']")&&!T.undos.length&&!T.bankLog.length, [T.undos,T.bankLog]);
}
{ // over a week old: the date, not a weekday
  const T=mk(); T.ctx.setDay("thu",9,0); T.run("llStart('bea')"); const id=T.loadId(); T.run("laundryData['"+id+"'].lineDay='2026-11-12'; laundryLine.log['2026-11-12']=laundryLine.log['2026-11-19']; delete laundryLine.log['2026-11-19'];");
  T.ctx.setDay("thu",10,0); const O=T.opts(id);
  ok("a load from 7+ days ago reads ↩ Not started 11/12 — …", O[0].t==="↩ Not started 11/12 — back on the laundry line", O);
}

console.log("── (d) NOT offered: Edit list byte-for-byte as before (pinned "+PIN+") ──");
if(!OLD){ ok("git show "+PIN+":index.html is readable", false); }
else {
  const cases=[
    ["an earlier-day load moved on: 🌀 dryer", T=>{ T.run("laundryData[ID].stage='dryer'"); }],
    ["an earlier-day load moved on: 🧺 basket", T=>{ T.run("laundryData[ID].stage='basket'"); }],
    ["an earlier-day load moved on: 👕 fold pile", T=>{ T.run("laundryData[ID].stage='fold'"); }],
    ["an earlier-day load moved on: 🪣 Wash today bin", T=>{ T.run("laundryData[ID].stage='bin'"); }],
    ["an earlier-day split half", T=>{ T.run("laundryData[ID].split={of:'zz',part:'hang'}"); }],
    ["an earlier-day 💦 jump-in", T=>{ T.run("laundryData[ID].jumpDay='2026-11-20'"); }],
    ["an earlier-day 🔗 rider entry", T=>{ T.run("laundryLine.log['2026-11-20'].bea.with='towels'"); }],
    ["an earlier-day load whose log entry points elsewhere", T=>{ T.run("laundryLine.log['2026-11-20'].bea.load='zz'"); }],
    ["an earlier-day load with no log entry", T=>{ T.run("delete laundryLine.log['2026-11-20'].bea"); }],
    ["a load not from the line", T=>{ T.run("delete laundryData[ID].line; delete laundryData[ID].lineDay"); }],
  ];
  cases.forEach(function(c){
    const run=src=>{ const T=mk({src}); T.kidDay("fri"); const id=T.loadId(); T.next("sat"); T.run("var ID="+J(id)); c[1](T); T.clear(); const h=T.sheet(id), O=T.opts(id); T.save(id,"line"); return {h,O,w:T.writes,t:T.toasts,has:!!T.run("laundryData[ID]")}; };
    const a=run(SRC), b=run(OLD);
    ok(c[0]+": no ↩ choice; the sheet HTML is byte-for-byte the pinned app's", !a.O.some(x=>x.v==="line")&&a.h===b.h, [a.O,b.O]);
    ok(c[0]+": a hand-made 'line' value on Save does the same as before", J(a.w)===J(b.w)&&J(a.t)===J(b.t)&&a.has===b.has, [a.w,b.w]);
  });
  // a 🌀 cycle load: step 0 earlier day → offered; step 1 → not, byte-for-byte
  { const L=LINE(); L.items.bea.cycle=[{k:"wash"},{k:"dry"}];
    const T=mk({line:L}); T.kidDay("fri"); const id=T.loadId(); T.next("sat");
    ok("a 🌀 cycle load on step 0 from Friday: offered (s0 selected)", T.run("lcStep(laundryData['"+id+"'])")===0&&T.opts(id)[0].t==="↩ Not started Friday — back on the laundry line"&&T.opts(id).find(x=>x.sel).v==="s0", T.opts(id));
    const run=src=>{ const T=mk({src,line:L}); T.kidDay("fri"); const id=T.loadId(); T.next("sat"); T.run("laundryData['"+id+"'].step=1; laundryData['"+id+"'].stage=lcStageOf(lcSteps(laundryData['"+id+"']),1)"); return T.sheet(id); };
    const a=run(SRC), b=run(OLD); ok("a 🌀 cycle load on step 1 from Friday: not offered, sheet byte-for-byte the pinned app's", a===b&&a.indexOf('value="line"')<0); }
}

console.log("── (e) a load started TODAY: everything exactly as before (pinned "+PIN+") ──");
if(OLD){
  const scen=[["kid's own tick today, ↩ from the washer",T=>{ T.kidDay("sat"); T.ctx.setDay("sat",14,30); return T.loadId(); },null],
    ["kid's own tick today, Mom moved it to the dryer, ↩",T=>{ T.kidDay("sat"); T.ctx.setDay("sat",14,30); const id=T.loadId(); T.save(id,"dryer"); return id; },null],
    ["Mom's 🫧 Start today (auto tick), ↩ from 🪣 bin",T=>{ T.ctx.setDay("sat",9,0); T.run("llStart('bea')"); const id=T.loadId(); T.save(id,"bin"); return id; },null]];
  scen.forEach(function(c){
    const run=src=>{ const T=mk({src}); const id=c[1](T); T.clear(); const h=T.sheet(id); T.save(id,"line");
      return J({h,w:T.writes,t:T.toasts,b:T.bankLog,s:T.slSaves,r:T.rlog,sl:T.run("slState"),ll:T.run("laundryLine"),ld:T.run("laundryData"),bank:T.ctx.bank}); };
    const a=run(SRC), b=run(OLD);
    ok(c[0]+": sheet, writes, toasts, bank, check-offs, line and loads identical to the pinned app", a===b, a===b?undefined:[a.slice(0,400),b.slice(0,400)]);
  });
}

console.log("── (f) Mom only; dry run; riders + blanket ──");
{ const T=mk({notMom:true}); T.kidDay("fri"); const id=T.loadId(); T.next("sat"); T.clear();
  ok("not Mom: no sheet, laundryEditBackLine refuses, nothing written", T.run("laundryEditId='"+id+"'; laundryEditSheetHTML('"+id+"')")===""&&T.run("laundryEditBackLine('"+id+"')")===false&&!!T.run("laundryData['"+id+"']")&&!T.writes.length); }
{ const T=mk({dry:true}); T.kidDay("fri"); const id=T.loadId(); T.next("sat"); T.clear(); T.save(id,"line");
  ok("dry run: no db writes", T.writes.length===0, T.writes);
  ok("…the local view still goes back (load gone, Friday's log empty, her row un-ticked here)", !T.run("laundryData['"+id+"']")&&J(T.run("laundryLine.log['2026-11-20']||{}"))==="{}"&&!T.run("slState['"+SK("week7","friday",2)+"'].done")); }
{ const L=LINE(); L.items.towels.with="bea"; L.extras={blanket:{label:"Bea's blanket",emoji:"🛏",every:2,unit:"w",last:"2026-11-01",next:"2026-11-19",rideWith:"bea",order:0}};
  const T=mk({line:L}); const before=CJ(T.run("laundryLine.extras"));
  T.kidDay("fri"); const id=T.loadId();
  ok("Friday's Start logged the rider and the blanket with it; the blanket's dates moved to Friday", T.run("laundryLine.log['2026-11-20'].towels.with")==="bea"&&T.run("laundryLine.log['2026-11-20'].blanket.load")===id&&T.run("laundryLine.extras.blanket.last")==="2026-11-20"&&!T.run("laundryLine.extras.blanket.next"), T.run("laundryLine.log"));
  T.next("sat"); T.clear(); T.save(id,"line");
  ok("Save Saturday: rider + blanket entries nulled, blanket last/next restored, in one laundryLine update", J(T.writes)===J([["rm","laundry/"+id],["update","laundryLine",{"log/2026-11-20/bea":null,"log/2026-11-20/towels":null,"log/2026-11-20/blanket":null,"extras/blanket/last":"2026-11-01","extras/blanket/next":"2026-11-19"}]]), T.writes);
  ok("…the line's extras are exactly as before the tick (same keys and values)", CJ(T.run("laundryLine.extras"))===before, [T.run("laundryLine.extras"),before]); }
{ // its Mom block (Friday's) goes too
  const T=mk(); T.kidDay("fri"); const id=T.loadId(); const key=T.run("momBlockKey('"+id+"','washer')"); T.run("momBlocks["+J(key)+"]={iso:'2026-11-20',label:'x'}"); T.next("sat"); T.clear(); T.save(id,"line");
  ok("its Friday Mom block is removed at momBlocks/2026-11-20/<key>", T.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/2026-11-20/"+key)&&!T.run("momBlocks["+J(key)+"]"), T.writes); }

console.log("\nFACTS (where the Start row shows after ↩ on Saturday):\n"+J(FACT,null,1));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
