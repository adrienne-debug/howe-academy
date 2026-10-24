/*
 * ↩︎ LAUNDRYUNDO (her report 2026-10-23, ~11:30 PM: "I accidentally clicked … the put it away button and it fell off the laundry, so I can't
 * pull it back. Maybe … an undo button at the bottom … And then if something else gets hit, then you can assume that it was meant to happen."
 * Her yes 2026-10-24: the undo bar, a "Put away today" list on every device until the next morning, "↩︎ Undo" for "↶" app-wide.)
 * Checks: (1) the bar after ✓ Put away, its ↩︎ Undo brings the load back exactly; (2) the next laundry tap replaces it and the undo reverses only
 * that one; a stage step goes back to the stage, step and clock it had (blocks dropped); a start goes back in line; ✓ Done comes off;
 * a kid's own row tick makes no bar; a stale bar undoes nothing; a kid undoes their own tap; (3) Put away today: from Firebase on ANY device,
 * ↩︎ Undo — back to folded, last night's until 8 AM, Mom/Dad only; (4) a load from an earlier lineDay comes back (Ellis's Bed);
 * (5) dry run writes nothing; (6) no "↶" left in a UI string; (7) wiring.                                    run: node test_laundry_undo.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"), CU=cut("// CHOREUNDO_START","// CHOREUNDO_END"), LU=cut("// LAUNDRYUNDO_START","// LAUNDRYUNDO_END"), LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const NAMES=["laundryAdvance","laundryAdvanceLabel","laundrySince","laundryT","momBlockKey","momBlocksOnValue","_lbWrite","_lbQ","laundryBlockDone"];
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date()), MON="2026-10-19", WED="2026-10-21";
const LUCY_CHORES=[{emoji:"🧺",label:"Start your laundry load",pts:5,cad:"wk:2",laundry:true},{emoji:"👕",label:"Fold + put away your clothes",pts:5,cad:"wk:2"}];
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[], els={};
  const ref=p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])});
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:ref}, _dryRun:()=>!!o.dry,
    momHere:()=>!o.kid&&!o.dad, dadAwardOk:()=>false, _kioskD:()=>!!o.dad, kcKid:o.kid||null, laundryData:o.laundry||{}, momBlocks:o.blocks||{}, laundryTimes:{wash:50,dry:60,grace:5},
    calDateForWeekDay:d=>({wednesday:WED})[d]||null, day:"wednesday", _todayDay:"wednesday", tab:"moms-plan", renderAll:()=>{}, renderMomsPlan:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, rtStepsFor:(sl,kid,raw)=>sl==="chores"?LUCY_CHORES:[],
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), mwTodayIso:()=>TODAY, _lbNowMin:()=>14*60, esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:t=>toasts.push(t), kitPinGate:()=>{}, confirm:()=>true,
    document:{body:{appendChild:e=>{ els[e.id]=e; }},createElement:()=>({id:"",innerHTML:""}),getElementById:id=>els[id]||null},
    writes, toasts, ls, els};
  vm.createContext(ctx); vm.runInContext(LCONST+"\n"+NAMES.map(fn).join("\n")+"\n"+LL+"\n"+CU+"\n"+LU,ctx);
  vm.runInContext("llToday=function(){ return '"+WED+"'; }; llNowMin=function(){ return 900; }; laundryLine={caps:{'0':2,'1':2,'2':2,'3':2,'4':2,'5':2,'6':0},asOf:'"+WED+"',next:'lucy'};"
    +"slState={}; activeWk=function(){ return 'week28'; }; nowTs=function(){ return '3:40 PM'; }; slBefore=function(){ return {}; }; slSaveChanged=function(){}; morningComplete=function(){ return false; }; rtComplete=function(){ return false; };"
    +"var _base=rtStepsFor; rtStepsFor=function(sl,kid,raw,dn){ const b=_base(sl,kid,raw); return raw?b:llRtSteps(sl,kid,b,dn||'wednesday'); };",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.bar=()=>(els["lu-wrap"]||{}).innerHTML||""; return ctx;
}
const awayW=(c,id)=>c.writes.filter(w=>w[1]==="laundryAway"&&w[2]&&Object.keys(w[2]).some(k=>k.endsWith("/"+id)));

console.log("1. ✓ Put away by mistake → the bar → ↩︎ Undo brings the load back exactly as it was");
{ const L0={label:"Towels",stage:"fold",ts:1111}; const c=mk({laundry:{l1:Object.assign({},L0)}});
  ok("no bar before any tap", c.bar()===""&&c.get("luLast")===null);
  c.get("laundryAdvance('l1')");
  ok("put away: laundry/l1 removed", !c.laundryData.l1&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/l1"));
  ok("the bar: '🧺 Towels — put away' with ↩︎ Undo (text-style ↩︎, no ↶)", /🧺 Towels — put away/.test(c.bar())&&/onclick="luUndo\(\)"/.test(c.bar())&&c.bar().indexOf("↩︎ Undo")>=0&&c.bar().indexOf("↶")<0, c.bar());
  ok("the bar sits fixed at the bottom of the screen", /position:fixed/.test(c.bar())&&/bottom:calc\(14px/.test(c.bar()));
  const aw=awayW(c,"l1")[0];
  ok("every device's record: one targeted laundryAway update <today>/l1 = {load as it was, at, by:mom}", !!aw&&aw[0]==="update"&&aw[2][TODAY+"/l1"].load.stage==="fold"&&aw[2][TODAY+"/l1"].load.ts===1111&&aw[2][TODAY+"/l1"].by==="mom"&&aw[2][TODAY+"/l1"].at>0, aw);
  c.writes.length=0; ok("↩︎ Undo → true", c.get("luUndo()")===true);
  ok("the load is back exactly as it was (stage fold, its own clock)", JSON.stringify(c.laundryData.l1)===JSON.stringify(L0), c.laundryData.l1);
  ok("written back: laundry/l1 set to the old record; its laundryAway record nulled", c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/l1"&&w[2].ts===1111)&&c.writes.some(w=>w[1]==="laundryAway"&&w[2][TODAY+"/l1"]===null), c.writes);
  ok("the bar is gone; a second ↩︎ Undo does nothing", c.bar()===""&&c.get("luUndo()")===false);
  ok("only targeted writes (no whole-node set of laundry / laundryAway)", c.writes.every(w=>w[1]!=="laundry"&&!(w[0]==="set"&&w[1]==="laundryAway")));
  ok("the toast says it is back", /Undone — 🧺 Towels is back/.test(c.toasts[c.toasts.length-1]), c.toasts); }

console.log("2. The next laundry tap replaces the bar; ↩︎ Undo reverses only that one step (stage, step, clock back; blocks dropped)");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"washer",ts:1000},l2:{label:"Sheets",stage:"washer",ts:2000}},
    blocks:{l2_washer:{iso:TODAY,start:600,dur:5},l2_dryer:{iso:TODAY,start:700,dur:5}}});
  c.get("laundryAdvance('l1')"); ok("the washer asks where it is going first — nothing moves, no bar", c.bar()===""&&c.laundryData.l1.stage==="washer"); c.get("laundryAdvance('l1','dryer')"); ok("Towels → dryer: the bar says so", /🌀 Towels — in the dryer/.test(c.bar()), c.bar());
  c.get("laundryAdvance('l2','dryer')"); ok("Sheets → dryer: the bar is Sheets' now (Towels' undo is gone)", /🌀 Sheets — in the dryer/.test(c.bar())&&!/Towels/.test(c.bar()), c.bar());
  c.writes.length=0; c.get("luUndo()");
  ok("Sheets back in the washer with its own clock; Towels stays in the dryer", c.laundryData.l2.stage==="washer"&&c.laundryData.l2.ts===2000&&c.laundryData.l1.stage==="dryer");
  ok("today's blocks for both stages dropped (the question comes back), targeted removes", !c.momBlocks.l2_washer&&!c.momBlocks.l2_dryer&&c.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+TODAY+"/l2_washer")&&c.writes.some(w=>w[0]==="rm"&&w[1]==="momBlocks/"+TODAY+"/l2_dryer"), c.writes);
  ok("one set of laundry/l2 back to washer; nothing written for Towels", c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/l2"&&w[2].stage==="washer")&&!c.writes.some(w=>w[1]==="laundry/l1"));
  ok("no bar after the undo", c.bar()===""); }
{ const c=mk({laundry:{l1:{label:"Towels",stage:"dryer",ts:1000}}});
  c.get("laundryAdvance('l1','basket')"); ok("→ basket: the bar", /Towels — in the basket/.test(c.bar()), c.bar());
  c.get("luUndo()"); ok("↩︎ Undo → back in the dryer, its clock as it was", c.laundryData.l1.stage==="dryer"&&c.laundryData.l1.ts===1000); }

console.log("3. 🫧 Start → ↩︎ Undo puts it back in line; ✓ Done → ↩︎ Undo takes it back");
{ const c=mk(); c.get("llStart('lucy','mom')"); const lid=Object.keys(c.laundryData)[0];
  ok("started: in the washer, logged; the bar says started", !!lid&&c.get("laundryLine.log['"+WED+"'].lucy.load")===lid&&/🫧 Lucy's clothes — started/.test(c.bar()), c.bar());
  c.writes.length=0; c.get("luUndo()");
  ok("↩︎ Undo: the load is gone (laundry/<id> removed) and the log entry is off (back in line)", !c.laundryData[lid]&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+lid)&&!c.get("laundryLine.log['"+WED+"'].lucy"), c.writes); }
{ const c=mk(); c.get("llMarkDone('lucy','mom')");
  ok("✓ Done: recorded; the bar says done today", c.get("llIsDoneOnly('lucy','"+WED+"')")===true&&/✓ Lucy's clothes — done today/.test(c.bar()), c.bar());
  c.writes.length=0; c.get("luUndo()");
  ok("↩︎ Undo → llUndone: the record comes off (log/<day>/lucy null)", c.get("llIsDoneOnly('lucy','"+WED+"')")===false&&c.writes.some(w=>w[1]==="laundryLine"&&w[2]["log/"+WED+"/lucy"]===null)); }

console.log("4. A kid's own row tick makes no bar (un-ticking is its undo) but lands on the list; a stale bar undoes nothing; a kid undoes their own tap");
{ const c=mk({kid:"lucy"}); c.get("llStart('lucy','lucy')"); const lid=Object.keys(c.laundryData)[0]; c.get("luLast=null; luPaint()");
  const st=[].concat(c.get("rtStepsFor('afternoon','lucy',false,'wednesday')"),c.get("rtStepsFor('chores','lucy',false,'wednesday')")).find(s=>s.laundry==="lineFold");
  c.get("llKidRowHook('lucy',"+JSON.stringify(st)+",true)");
  ok("Lucy ticks Fold: put away, no bar", !c.laundryData[lid]&&c.bar()===""&&c.get("luLast")===null&&c.get("_luQ")===0);
  ok("… but it is on every device's list, by Lucy", (awayW(c,lid)[0]||[])[2]&&awayW(c,lid)[0][2][TODAY+"/"+lid].by==="lucy"); }
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:5}}}); c.get("laundryAdvance('l1')");
  c.get("laundryData.l1={label:'Towels',stage:'fold',ts:9}; luPaint()");   // another device brought it back meanwhile
  ok("the load came back elsewhere → the bar goes by itself", c.bar()===""); c.writes.length=0;
  ok("and an undo then writes nothing", c.get("luUndo()")===false&&c.writes.length===0); }
{ const c=mk({kid:"lincoln",laundry:{l1:{label:"Lincoln's clothes",stage:"washer",ts:7,by:"lincoln"}}});
  c.get("laundryAdvance('l1','dryer')"); ok("a kid's device: his tap → the bar", /Lincoln's clothes — in the dryer/.test(c.bar()));
  c.get("luUndo()"); ok("he undoes his own tap without Mom mode", c.laundryData.l1.stage==="washer"&&c.laundryData.l1.ts===7); }

console.log("5. 🧺 Put away today — from Firebase, on ANY device: ↩︎ Undo — back to folded");
{ const rec={load:{label:"Ellis's clothes",stage:"fold",ts:3,by:"ellis"},at:Date.now()-60000,by:"ellis"};
  const B=mk(); B.get("luAwayOnValue("+JSON.stringify({[TODAY]:{la:rec}})+")");   // device B never tapped it
  const h=B.get("luAwayRowsHTML()");
  ok("device B lists it: 🧺 Put away today · Ellis's clothes · by Ellis · ↩︎ Undo — back to folded", /🧺 Put away today/.test(h)&&/Ellis's clothes/.test(h)&&/· Ellis/.test(h)&&/luUnputaway\('la'\)/.test(h)&&h.indexOf("↩︎ Undo — back to folded")>=0, h);
  ok("the Household view and My day call it", /luAwayRowsHTML\(\)/.test(fn("hhLaundryHTML"))&&/luAwayRowsHTML\(true\)/.test(fn("llMyDayLaundryHTML")));
  B.writes.length=0; const r=B.get("luUnputaway('la')");
  ok("↩︎ Undo: back in the fold pile with a fresh clock", !!r&&B.laundryData.la.stage==="fold"&&B.laundryData.la.ts>rec.at&&B.laundryData.la.by==="ellis");
  ok("writes: laundry/la set + laundryAway <today>/la null", B.writes.some(w=>w[0]==="set"&&w[1]==="laundry/la")&&B.writes.some(w=>w[1]==="laundryAway"&&w[2][TODAY+"/la"]===null), B.writes);
  ok("it leaves the list", B.get("luAwayRowsHTML()")===""); }
{ const K=mk({kid:"lucy"}); K.get("luAwayOnValue("+JSON.stringify({[TODAY]:{la:{load:{label:"X",stage:"fold"},at:1}}})+")");
  ok("a kid's device: no list, and luUnputaway refuses", K.get("luAwayRowsHTML()")===""&&K.get("luUnputaway('la')")===null&&!K.laundryData.la);
  const D=mk({dad:true}); D.get("luAwayOnValue("+JSON.stringify({[TODAY]:{la:{load:{label:"X",stage:"fold"},at:1}}})+")");
  ok("Dad on his link sees it", /luUnputaway\('la'\)/.test(D.get("luAwayRowsHTML()"))); }
{ const c=mk(); const d0=new Date(2026,9,24,7,0), d1=new Date(2026,9,24,9,0), y=iso(new Date(2026,9,23,12));
  c.get("luAwayOnValue("+JSON.stringify({[y]:{ln:{load:{label:"Late towels",stage:"fold"},at:new Date(2026,9,23,23,30).getTime()}}})+")");
  ok("last night's 11:30 PM put-away is still listed at 7 AM", c.get("luAwayList("+d0.getTime()+")").map(a=>a.id).join()==="ln");
  ok("… and gone by 9 AM", c.get("luAwayList("+d1.getTime()+")").length===0); }
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:1}}}); c.get("laundryAway={'2026-01-01':{old:{load:{},at:1}}}"); c.get("laundryAdvance('l1')");
  ok("a put-away write drops days older than yesterday in the same targeted update", awayW(c,"l1")[0][2]["2026-01-01"]===null); }
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:1}}}); c.get("laundryAdvance('l1')"); c.get("laundryUnputaway('l1')");
  ok("the ledger's own ↩︎ back-to-folded also takes it off every device's list", c.writes.some(w=>w[1]==="laundryAway"&&w[2][TODAY+"/l1"]===null)); }

console.log("6. A load started on an earlier day comes back (Ellis's Bed: started 10/19, put away 10/21)");
{ const note={at:5,load:{label:"Ellis's Bed",line:"ellis",lineDay:MON,stage:"fold",ts:4,by:"ellis"}};
  const c=mk(); c.get("laundryLine.log={'"+MON+"':{ellis:{at:1,by:'ellis',load:'lb',away:"+JSON.stringify(note)+"}}}");
  ok("llAwayDay finds the note under its own lineDay", c.get("llAwayDay('ellis')")===MON);
  c.writes.length=0; ok("the Fold un-tick (llUnputawayLine) brings it back", c.get("llUnputawayLine('ellis')")===true&&c.laundryData.lb&&c.laundryData.lb.stage==="fold"&&c.laundryData.lb.lineDay===MON, c.laundryData);
  ok("its note cleared under ITS day (log/<10-19>/ellis/away = null), laundry/lb set", c.writes.some(w=>w[1]==="laundryLine"&&w[2]["log/"+MON+"/ellis/away"]===null)&&c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/lb"), c.writes); }
{ const load={label:"Ellis's Bed",line:"ellis",lineDay:MON,stage:"fold",ts:4,by:"ellis"};
  const c=mk(); c.get("laundryLine.log={'"+MON+"':{ellis:{at:1,by:'ellis',load:'lb',away:{at:5,load:"+JSON.stringify(load)+"}}}}; luAwayOnValue({'"+TODAY+"':{lb:{load:"+JSON.stringify(load)+",at:Date.now(),by:'ellis'}}})");
  c.writes.length=0; c.get("luUnputaway('lb')");
  ok("from the list: back to folded, and the line's note under 10/19 is cleared too", c.laundryData.lb.stage==="fold"&&c.writes.some(w=>w[1]==="laundryLine"&&w[2]["log/"+MON+"/ellis/away"]===null)&&!c.get("laundryLine.log['"+MON+"'].ellis.away")); }

console.log("7. Dry run writes nothing (the bar and the list still work on the device)");
{ const c=mk({dry:true,laundry:{l1:{label:"Towels",stage:"fold",ts:1}}}); c.get("laundryAdvance('l1')");
  ok("put away: bar shows, nothing written", /put away/.test(c.bar())&&c.writes.length===0);
  c.get("luUndo()"); ok("undo: back locally, nothing written", c.laundryData.l1&&c.laundryData.l1.stage==="fold"&&c.writes.length===0);
  c.get("laundryAdvance('l1')"); c.get("luUnputaway('l1')"); ok("list restore: nothing written", c.laundryData.l1&&c.writes.length===0); }

console.log("8. ↩︎ for ↶ in every UI string (her: \"the undo button looks like a shower head\")");
{ // the same scan the change used: a ↶ inside a string literal is UI; comments keep theirs
  const bad=[]; src.split("\n").forEach((line,ix)=>{ if(line.indexOf("↶")<0) return; let q=null;
    for(let i=0;i<line.length;i++){ const ch=line[i], n=line[i+1];
      if(q){ if(ch==="\\"){ i++; continue; } if(ch===q){ q=null; continue; } if(ch==="↶"){ bad.push(ix+1); break; } continue; }
      if(ch==="/"&&n==="/") break; if(ch==="/"&&n==="*"){ const e=line.indexOf("*/",i+2); if(e<0) break; i=e+1; continue; }
      if(ch==="'"||ch==='"'||ch==="`") q=ch; else if(ch==="↶"){ bad.push(ix+1); break; } } });
  ok("no ↶ left in a string in index.html", bad.length===0, bad);
  ok("the labels keep their words: ↩︎ undo, ↩︎ Mom undid (the ledger's ↩︎ Undo / ↩︎ undone / ↩︎ Today's ledger left with it, UNDOLISTS 2026-10-24)", ["↩︎ undo","↩︎ Mom undid"].every(t=>src.indexOf(t)>=0));
  ok("↩ is always the text style (U+FE0E after it) in what this change wrote", (LU.match(/↩(?!︎)/g)||[]).length===0); }

console.log("9. Wiring");
{ ok("marked block", src.indexOf("// LAUNDRYUNDO_START")>0&&src.indexOf("// LAUNDRYUNDO_END")>src.indexOf("// LAUNDRYUNDO_START"));
  ok("laundryAdvance / llPutAway / llStart snap and note; ✓ Done notes", ["laundryAdvance","llPutAway","llStart"].every(n=>/luSnap\(\)/.test(fn(n))&&/luNote\(_lu\)/.test(fn(n)))&&/luNoteDone\(item\)/.test(fn("llMarkDone")));
  ok("llKidRowHook quiets the bar and always lets go (finally)", /_luQ\+\+/.test(fn("llKidRowHook"))&&/finally \{ if\(typeof _luQ!=="undefined"\) _luQ--; \}/.test(fn("llKidRowHook")));
  ok("every put away writes the record (laundryAwayRemember → luAwayWrite)", /luAwayWrite\(id,l\)/.test(fn("laundryAwayRemember")));
  ok("listeners: laundryAway read on every device; the bar re-checks when laundry/ changes", /db\.ref\("laundryAway"\)\.on\("value"/.test(src)&&/luAwayOnValue\(s\.val\(\)\)/.test(src)&&/luPaint\(\); \}catch\(e\)\{\}   \/\/ ↩︎ LAUNDRYUNDO/.test(src));
  ok("every write in the block is laundry/<id>, laundryAway (update), or through llWrite / _cuDropBlock", (LU.match(/db\.ref\([^)]*\)/g)||[]).every(r=>/db\.ref\('laundry\/'\+/.test(r)||/db\.ref\('laundryAway'\)/.test(r)), LU.match(/db\.ref\([^)]*\)/g));
  ok("laundryAway only ever updated (multi-path), never set whole", !/ref\('laundryAway'\)\.set/.test(LU)&&!/ref\("laundryAway"\)\.set/.test(src)); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
