/*
 * 🧺 FOLD_BACK (her ask 2026-10-21: Lucy ticked "Fold" while her clothes were still in the washer — the load vanished from Machines now and
 * her un-tick did nothing; "yes i would" to: un-ticking a Fold row puts the load back, to the machine it was really in, from any device).
 * Putting a line load away leaves a note beside its day-log entry; the un-tick reads it back.   run: node test_fold_back.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const WED="2026-10-21";
// Lucy's Wednesday: her chores rows — Start (laundry:true) and Fold (lineFold) are the line's own rows (llRtSteps builds them).
const LUCY_CHORES=[{emoji:"🧺",label:"Start your laundry load",pts:5,cad:"wk:2",laundry:true},{emoji:"👕",label:"Fold + put away your clothes",pts:5,cad:"wk:2"}];
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>!o.kid, _kioskD:()=>false, laundryData:{}, calDateForWeekDay:d=>({wednesday:WED})[d]||null, day:"wednesday", _todayDay:"wednesday", tab:"kids", renderAll:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    rtStepsFor:(sl,kid,raw)=>sl==="chores"?LUCY_CHORES:[],
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:t=>toasts.push(t), writes, toasts};
  vm.createContext(ctx); vm.runInContext(LL,ctx);
  vm.runInContext("llToday=function(){ return '"+WED+"'; }; llNowMin=function(){ return 900; }; laundryLine={caps:{'0':2,'1':2,'2':2,'3':2,'4':2,'5':2,'6':0},asOf:'"+WED+"',next:'lucy'};"
    +"slState={}; activeWk=function(){ return 'week28'; }; nowTs=function(){ return '3:40 PM'; }; slBefore=function(){ return {}; }; slSaveChanged=function(){}; morningComplete=function(){ return false; }; rtComplete=function(){ return false; };"
    +"var _base=rtStepsFor; rtStepsFor=function(sl,kid,raw,dn){ const b=_base(sl,kid,raw); return raw?b:llRtSteps(sl,kid,b,dn||'wednesday'); };",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const foldStep=c=>[].concat(c.get("rtStepsFor('afternoon','lucy',false,'wednesday')"),c.get("rtStepsFor('chores','lucy',false,'wednesday')")).find(s=>s.laundry==="lineFold");   // the line puts the Fold row in the afternoon list

console.log("1. Her day replayed: Lucy starts her load (washer), ticks Fold by mistake, Mom un-ticks it");
{ const c=mk({kid:true}); c.get("llStart('lucy','lucy')"); const lid=Object.keys(c.get("laundryData"))[0];
  ok("the load is in the washer, logged to Lucy", c.get("laundryData")[lid].stage==="washer"&&c.get("laundryLine.log['"+WED+"'].lucy.load")===lid);
  const st=foldStep(c); ok("her chores list has the line's Fold row", !!st&&st.line==="lucy");
  c.writes.length=0; c.get("llKidRowHook('lucy',"+JSON.stringify(st)+",true)");   // her tick: put away
  ok("tick Fold → the load leaves Machines now (laundry/<id> removed) …", !c.get("laundryData")[lid]&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+lid));
  const note=c.get("laundryLine.log['"+WED+"'].lucy.away");
  ok("… and a note sits beside her day-log entry: the load as it was (stage washer), targeted write log/<day>/lucy/away", !!note&&note.load&&note.load.stage==="washer"&&c.writes.some(w=>w[0]==="update"&&w[1]==="laundryLine"&&w[2]["log/"+WED+"/lucy/away"]&&w[2]["log/"+WED+"/lucy/away"].load.stage==="washer"), note);
  ok("her Fold row reads ✓ (auto); the line says put away", c.get("slState['week28_wednesday_lucy_astep0']").done===true&&c.get("llLoadStage('lucy','"+WED+"')")==="✓ put away");
  c.writes.length=0; c.get("llKidRowHook('lucy',"+JSON.stringify(st)+",false)");   // the un-tick (hers, or Mom's from the lists — same hook)
  const back=c.get("laundryData")[lid];
  ok("un-tick Fold → the load is back in Machines now, in the WASHER (where it really was), same id, fresh clock", !!back&&back.stage==="washer"&&back.line==="lucy"&&back.lineDay===WED&&back.ts>note.at-1, back);
  ok("written back under laundry/<id>; the note cleared (log/<day>/lucy/away = null)", c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/"+lid&&w[2].stage==="washer")&&c.writes.some(w=>w[0]==="update"&&w[2]["log/"+WED+"/lucy/away"]===null)&&!c.get("laundryLine.log['"+WED+"'].lucy.away"));
  ok("her Fold row un-ticks itself (the auto ✓ comes off); the line says in the washer again", c.get("slState['week28_wednesday_lucy_astep0']").done===false&&c.get("llLoadStage('lucy','"+WED+"')")==="🫧 in the washer");
  ok("the toast says where it went", /Lucy's clothes — back, 🫧 in the washer/.test(c.toasts[c.toasts.length-1]), c.toasts);
  ok("a second un-tick does nothing (the load is already there)", c.get("llUnputawayLine('lucy')")===false);
}
console.log("2. From the dryer / the fold pile it comes back to that stage");
{ const c=mk(); c.get("llStart('lucy')"); const lid=Object.keys(c.get("laundryData"))[0]; c.get("laundryData['"+lid+"'].stage='dryer'");
  c.get("llPutAway('"+lid+"')"); c.get("llUnputawayLine('lucy')"); ok("dryer → put away → un-tick: back in the dryer", c.get("laundryData")[lid].stage==="dryer");
  c.get("laundryData['"+lid+"'].stage='fold'"); c.get("llPutAway('"+lid+"')"); c.get("llUnputawayLine('lucy')"); ok("fold pile → put away → un-tick: back in the fold pile", c.get("laundryData")[lid].stage==="fold");
}
console.log("3. Mom's / Dad's own Fold checklist row");
{ const c=mk(); c.get("llStart('lucy')"); const lid=Object.keys(c.get("laundryData"))[0];
  c.get("llParentTick('lucy','fold','mom')"); ok("✓ the Fold row = put away", !c.get("laundryData")[lid]);
  c.get("llParentTick('lucy','fold','mom')"); ok("un-✓ the Fold row = back (same note)", !!c.get("laundryData")[lid]&&c.get("laundryData")[lid].stage==="washer");
}
console.log("4. No note, nothing to bring back (today's Lucy load, put away before this shipped)");
{ const c=mk(); c.get("laundryLine.log={'"+WED+"':{lucy:{at:1,by:'lucy',load:'gone'}}}"); ok("un-tick with no note: false, nothing written", c.get("llUnputawayLine('lucy')")===false&&!c.writes.some(w=>w[0]==="set")); }
console.log("5. Wiring");
{ ok("marked block", src.indexOf("// FOLD_BACK_START")>0&&src.indexOf("// FOLD_BACK_END")>src.indexOf("// FOLD_BACK_START"));
  ok("every put-away leaves the note: llPutAway, Home Base's forward button (laundryAdvance), a kid's move (laundryKidMove)", /llNoteAway\(lid,l\)/.test(fn("llPutAway"))&&/llNoteAway\(id,l\)/.test(fn("laundryAdvance"))&&/llNoteAway\(id,l\)/.test(fn("laundryKidMove")));
  ok("the kid's un-tick and the parent row both call llUnputawayLine", /lineFold"&&!now\) llUnputawayLine\(id\)/.test(fn("llKidRowHook"))&&/else llUnputawayLine\(id\)/.test(fn("llParentTick")));
  const B=cut("// FOLD_BACK_START","// FOLD_BACK_END");
  ok("writes in the block: laundry/<id> set and laundryLine multi-path update only, behind _lbWrite", (B.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\('laundry\/'\+e\.load\)\.set\(rec\)/.test(B)&&/_lbWrite\(\)\) db\.ref/.test(B)&&(B.match(/llWrite\(u\)/g)||[]).length===2);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
