/*
 * 📒 LAUNDRY_LEDGER (her words 2026-10-28, from Sara's day: "The laundry undo on the bottom that shows up and doesn't go away she is not
 * liking. I am not liking. Instead we need to go with a ledger. I would put that underneath the laundry to-do list, in the household laundry
 * section, and it be collapsed unless clicked and then naturally go back collapsed if moved away from that page. And that means it could
 * also show up on the My Day part."). Runs the real LAUNDRYLINE, CHOREUNDO, LAUNDRYUNDO and LAUNDRY_LEDGER blocks plus laundryAdvance;
 * every write is recorded, nothing touches Firebase.
 * Checks: (1) the bar is gone — no #lu-wrap after any laundry action; (2) the fold renders collapsed in both places; (3) one tap opens it;
 * (4) it folds again on a tab or page change; (5) rows newest first — this device's steps, put-aways from any device, loads still out, ✓ Done;
 * (6) undo is the path the bar used (luUndo on the same record) and the old put-away undo; (7) dry run: opens, lists, writes nothing;
 * (8) wiring and no kid's name in the block.                                                              run: node test_laundry_ledger.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"), CU=cut("// CHOREUNDO_START","// CHOREUNDO_END"), LU=cut("// LAUNDRYUNDO_START","// LAUNDRYUNDO_END"), LG=cut("// LAUNDRY_LEDGER_START","// LAUNDRY_LEDGER_END"), LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const NAMES=["laundryAdvance","laundryAdvanceLabel","laundrySince","laundryT","momBlockKey","momBlocksOnValue","_lbWrite","_lbQ","laundryBlockDone"];
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const WED="2026-10-28", T=h=>new Date(WED+"T00:00").getTime()+Math.round(h*3600e3);   // h may be 10.5
const RealDate=Date;
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[], els={content:{innerHTML:""}}, renders=[];
  const ref=p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])});
  function FakeDate(){ return arguments.length?new (Function.prototype.bind.apply(RealDate,[null].concat([].slice.call(arguments)))):new RealDate(ctx._now); }   // the clock the test sets
  FakeDate.now=()=>ctx._now;
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date:FakeDate,RegExp,Error,_now:T(9),
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:ref}, _dryRun:()=>!!o.dry,
    momHere:()=>!o.kid&&!o.dad, dadAwardOk:()=>!!o.dad, _kioskD:()=>!!o.dad, kcKid:o.kid||null, laundryData:o.laundry||{}, momBlocks:{}, laundryTimes:{wash:50,dry:60,grace:5},
    calDateForWeekDay:d=>({wednesday:WED})[d]||null, day:"wednesday", _todayDay:"wednesday", tab:"moms-plan", mpSubView:"house", hhView:"laundry", renderAll:()=>{ renders.push("all"); }, renderMomsPlan:()=>{ renders.push("mp"); },
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, rtStepsFor:()=>[],
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new RealDate(ms)), mwTodayIso:()=>WED, _lbNowMin:()=>14*60, esc:s=>String(s==null?"":s), hhRender:()=>{ renders.push("hh"); }, mwToast:t=>toasts.push(t), kitPinGate:(go)=>{ ctx.gated=true; }, confirm:()=>true, gated:false,
    document:{body:{appendChild:e=>{ els[e.id]=e; }},createElement:()=>({id:"",innerHTML:""}),getElementById:id=>els[id]||null},
    writes, toasts, ls, els, renders};
  vm.createContext(ctx); vm.runInContext(LCONST+"\n"+NAMES.map(fn).join("\n")+"\n"+LL+"\n"+CU+"\n"+LU+"\n"+LG,ctx);
  vm.runInContext("llToday=function(){ return '"+WED+"'; }; llNowMin=function(){ return 900; }; laundryLine={caps:{'0':2,'1':2,'2':2,'3':2,'4':2,'5':2,'6':0},asOf:'"+WED+"',next:'lucy',log:{}};"
    +"slState={}; activeWk=function(){ return 'week28'; }; nowTs=function(){ return '9:00 AM'; }; slBefore=function(){ return {}; }; slSaveChanged=function(){}; morningComplete=function(){ return false; }; rtComplete=function(){ return false; };",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.at=h=>{ ctx._now=T(h); }; ctx.bar=()=>(els["lu-wrap"]||{}).innerHTML||"";
  ctx.html=bare=>vm.runInContext("luLgHTML("+(bare?"true":"")+")",ctx); ctx.rows=()=>vm.runInContext("luLgRows()",ctx); ctx.open=()=>vm.runInContext("luLgToggle()",ctx);
  return ctx;
}
const undoOf=h=>(h.match(/onclick="event\.stopPropagation\(\);([^"]*)"/g)||[]).map(s=>s.replace(/^onclick="event\.stopPropagation\(\);/,"").replace(/"$/,""));

console.log("1. The bar is gone: no laundry action leaves anything at the bottom");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:T(8)},l2:{label:"Sheets",stage:"washer",ts:T(8)}}});
  c.get("laundryAdvance('l1')"); ok("✓ Put away: nothing at the bottom — #lu-wrap is never created", !c.els["lu-wrap"]&&c.bar()===""&&!c.laundryData.l1);
  c.at(9.5); c.get("laundryAdvance('l2','dryer')"); ok("→ Dryer: still nothing", !c.els["lu-wrap"]&&c.bar()==="");
  c.get("llStart('lucy','mom')"); ok("🫧 Start: still nothing", !c.els["lu-wrap"]&&c.bar()==="");
  c.get("llMarkDone('ellis','mom')"); ok("✓ Done: still nothing", !c.els["lu-wrap"]&&c.bar()==="");
  c.get("luPaint()"); ok("the laundry listener's own luPaint (a load changed on another device) draws nothing either", !c.els["lu-wrap"]&&c.bar()==="");
  ok("luPaint hands every step to the ledger before the bar code (the one-line hunk)", /^function luPaint\(\)\{[^\n]*\n  if\(typeof luLgNote==="function"\)\{ luLgNote\(\); return; \}/m.test(src));
  ok("the four steps are on the ledger, this device, newest first", c.get("luSteps.map(s=>s.words).join('|')")==="✓ Ellis's clothes — done today|🫧 Lucy's clothes — started|🌀 Sheets — in the dryer|🧺 Towels — put away", c.get("luSteps.map(s=>s.words)"));
  ok("each remembers who tapped (Mom here)", c.get("luSteps.every(s=>s.by==='mom')")); }
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:T(8)}}}); c.get("luLast={did:[{id:'l1',before:null,after:{stage:'fold'}}],at:1,words:'x'}; var w=document.createElement('div'); w.id='lu-wrap'; w.innerHTML='<b>stale</b>'; document.body.appendChild(w); luPaint()");
  ok("a leftover #lu-wrap is emptied, never refilled", c.bar()==="", c.bar()); }

console.log("2. The fold — '📒 Laundry ledger', collapsed by default, in both places");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"dryer",ts:T(8)}}});
  const h=c.html(false), b=c.html(true);
  ok("Household ▸ Laundry: a card with the fold line only — ▸, no rows, no ↩︎ Undo", /📒 Laundry ledger/.test(h)&&/▸/.test(h)&&!/▾/.test(h)&&h.indexOf("↩︎ Undo")<0&&!/Towels/.test(h)&&/data-lulg="1"/.test(h)&&/background:#fff;border-radius:12px/.test(h), h);
  ok("My day (bare): the same fold under a dashed rule, collapsed", /📒 Laundry ledger/.test(b)&&/▸/.test(b)&&!/Towels/.test(b)&&/border-top:1px dashed/.test(b)&&!/border-radius:12px/.test(b), b);
  ok("the fold line is one button → luLgToggle()", (h.match(/onclick="luLgToggle\(\)"/g)||[]).length===1&&(b.match(/onclick="luLgToggle\(\)"/g)||[]).length===1);
  ok("luLgOpen starts false; the state lives in memory only (no HA_LS / localStorage in the block)", c.get("luLgOpen")===false&&!/HA_LS|localStorage/.test(LG)); }

console.log("3. One tap opens it");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"dryer",ts:T(8),by:"dad"}}});
  c.open(); const h=c.html(false);
  ok("tap: open (▾), rows drawn, the page it opened on remembered", c.get("luLgOpen")===true&&c.get("luLgAt")==="moms-plan|house|laundry"&&/▾/.test(h)&&/Towels/.test(h), h);
  ok("the tap re-renders the page (_cuRe → renderMomsPlan / renderAll), writes nothing", c.renders.length>=1&&c.writes.length===0, c.renders);
  c.open(); ok("tap again: folded", c.get("luLgOpen")===false&&/▸/.test(c.html(false))&&!/Towels/.test(c.html(false))); }

console.log("4. It folds again whenever the page or tab is left");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"dryer",ts:T(8)}}});
  c.open(); c.get("luLgLeave()"); ok("showTab (luLgLeave): folded", c.get("luLgOpen")===false);
  c.open(); c.get("mpSubView=null; luLgPage()"); ok("Household → Mom's Day (renderMomsPlan → luLgPage with another page key): folded", c.get("luLgOpen")===false);
  c.get("mpSubView='house'; luLgPage()"); ok("… and coming back to Household finds it folded, not re-opened", c.get("luLgOpen")===false&&/▸/.test(c.html(false)));
  c.open(); c.get("luLgPage()"); ok("the same page re-rendering (a load changed) keeps it open", c.get("luLgOpen")===true&&/▾/.test(c.html(false)));
  c.get("hhView='review'"); ok("drawn under another Household chip it reads folded (the key differs) even before luLgPage runs", /▸/.test(c.html(false)));
  c.get("hhView='laundry'"); c.open(); c.get("tab='schedule'; luLgLeave()"); c.get("tab='moms-plan'; luLgPage()");
  ok("to the Schedule tab and back: folded", c.get("luLgOpen")===false);
  ok("wired: renderMomsPlan's first line calls luLgPage; showTab calls luLgLeave right after tab=t", /^function renderMomsPlan\(el\)\{\n  try\{ if\(typeof luLgPage==="function"\) luLgPage\(\); \}catch\(e\)\{\}/m.test(src)&&/\n  tab=t;\n[^\n]*kcStudyKid[^\n]*\n  try\{ if\(typeof luLgLeave==="function"\) luLgLeave\(\); \}catch\(e\)\{\}/.test(src)); }

console.log("5. The rows — newest first: this device's steps, put-aways on any device, loads still out, today's ✓ Done");
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:T(7)},l2:{label:"Sheets",stage:"washer",ts:T(7)},l9:{label:"Rags",stage:"dryer",ts:T(6),by:"dad"}}});
  c.at(8); c.get("laundryAdvance('l1')");            // Mom puts Towels away at 8
  c.at(9); c.get("laundryAdvance('l2','dryer')");    // Sheets → dryer at 9
  c.at(10); c.get("llStart('lucy','mom')");          // Lucy's clothes started at 10
  c.at(11); c.get("llMarkDone('ellis','mom')");      // Ellis's done (no load) at 11
  // another device: a put-away at 10:30 (laundryAway), a load in the washer on the line since 8:30 (log entry), Rags in the dryer since 6 by Dad
  c.get("luAwayOnValue({'"+WED+"':{lz:{load:{label:'Kitchen towels',stage:'fold',ts:1},at:"+T(10.5)+",by:'ellis'}}})");
  c.get("laundryData.l8={label:'Julian\\'s clothes',stage:'washer',ts:"+T(8.5)+",line:'julian',lineDay:'"+WED+"'}; laundryLine.log['"+WED+"'].julian={at:"+T(8.5)+",load:'l8',by:'mom'}");
  c.at(12); c.open(); const R=c.rows(), h=c.html(true);
  ok("order, newest first: Ellis done 11 · Kitchen towels put away 10:30 (other device) · Lucy started 10 · Sheets dryer 9 · Julian's started 8:30 (other device) · Towels put away 8 · Rags dryer 6",
    R.map(r=>r.words).join("|")==="✓ Ellis's clothes — done today|🧺 Kitchen towels — put away|🫧 Lucy's clothes — started|🌀 Sheets — in the dryer|🫧 Julian's clothes — started|🧺 Towels — put away|🌀 Rags — in the dryer", R.map(r=>[r.words,r.at]));
  ok("no load twice: this device's valid steps cover their loads (Sheets, Lucy's, Towels appear once)", R.filter(r=>/Sheets/.test(r.words)).length===1&&R.filter(r=>/Lucy/.test(r.words)).length===1&&R.filter(r=>/Towels —/.test(r.words)).length===1);
  ok("who: Mom on this device's steps, Ellis on the other device's put-away, Dad on the load he started; a move from elsewhere names no one", R[0].by==="mom"&&R[1].by==="ellis"&&R[4].by==="mom"&&R[6].by===""&&R[3].by==="mom", R.map(r=>r.by));
  ok("when: a clock time today", /· 11:00 AM/.test(h)&&/· 10:30 AM/.test(h)&&/· 6:00 AM/.test(h), h);
  ok("undo on every row where it is meaningful: luLgUndo on this device's steps, luUnputaway on the other device's put-away, llUnstart for the line load still in the washer, laundryBack for Rags in the dryer, llUndone for ✓ Done",
    R[0].undo==="luLgUndo(0)"&&R[1].undo==="luUnputaway('lz')"&&R[2].undo==="luLgUndo(1)"&&R[3].undo==="luLgUndo(2)"&&/^llUnstart\('l8'\)/.test(R[4].undo)&&R[5].undo==="luLgUndo(3)"&&R[6].undo==="laundryBack('l9')", R.map(r=>r.undo));
  ok("the HTML carries each as ↩︎ Undo (text-style ↩︎, no ↶)", undoOf(h).length===7&&(h.match(/↩︎ Undo/g)||[]).length===7&&h.indexOf("↶")<0, undoOf(h));
  ok("the ✓ Done row's undo is llUndone — not luLgUndo twice", undoOf(h).filter(u=>/llUndone/.test(u)).length===0&&R[0].undo==="luLgUndo(0)");   // this device's own done step covers it
  c.get("luSteps.length=0"); const R2=c.rows();
  ok("on a device that tapped nothing (no steps): the same loads from Firebase — Ellis's ✓ Done from the log with llUndone, Sheets with laundryBack", R2.find(r=>/Ellis/.test(r.words)).undo==="llUndone('ellis')"&&R2.find(r=>/Sheets/.test(r.words)).undo==="laundryBack('l2')"&&R2.find(r=>/Towels —/.test(r.words)).undo==="luUnputaway('l1')", R2.map(r=>[r.words,r.undo]));
  ok("a load moved on elsewhere: its step stays listed without undo", (()=>{ const d=mk({laundry:{a:{label:"Caps",stage:"fold",ts:1}}}); d.get("laundryAdvance('a')"); d.get("laundryData.a={label:'Caps',stage:'fold',ts:9}"); d.open(); const r=d.rows(); return r.length===2&&r[0].words==="🧺 Caps — put away"&&r[0].undo===""&&r[1].undo==="laundryBack('a')"; })());
  ok("capped at 15 rows, newest kept", (()=>{ const d=mk({laundry:{}}); for(let i=0;i<20;i++){ d.at(5+i*0.25); d.get("laundryData.x"+i+"={label:'L"+i+"',stage:'fold',ts:1}; laundryAdvance('x"+i+"')"); } d.open(); const r=d.rows(); return r.length===15&&r[0].words==="🧺 L19 — put away"&&d.get("luSteps.length")===15; })()); }
{ const c=mk({laundry:{}}); c.open(); ok("nothing to list → 'Nothing yet today.'", /Nothing yet today\./.test(c.html(false))&&c.rows().length===0); }

console.log("6. Undo is the path the bar used — luUndo on the same record; put-aways keep their old undo; nothing she could undo is lost");
{ const L0={label:"Towels",stage:"fold",ts:1111}; const c=mk({laundry:{l1:Object.assign({},L0),l2:{label:"Sheets",stage:"washer",ts:2000}}});
  c.at(8); c.get("laundryAdvance('l1')"); c.at(9); c.get("laundryAdvance('l2','dryer')"); c.open();
  ok("two steps, both with ↩︎ Undo (the bar kept only the last)", c.rows().filter(r=>/luLgUndo/.test(r.undo)).length===2);
  c.writes.length=0; ok("↩︎ Undo on the OLDER step (Towels put away) → true", c.get("luLgUndo(1)")===true);
  ok("Towels is back exactly as it was (stage fold, its own clock)", JSON.stringify(c.laundryData.l1)===JSON.stringify(L0), c.laundryData.l1);
  ok("the writes the bar's undo made: laundry/l1 set to the old record; its laundryAway record nulled; nothing else", c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/l1"&&w[2].ts===1111)&&c.writes.some(w=>w[1]==="laundryAway"&&w[2][WED+"/l1"]===null)&&c.writes.every(w=>w[1]==="laundry/l1"||w[1]==="laundryAway"), c.writes);
  ok("that step left the ledger; Sheets' step stays, still undoable", c.get("luSteps.length")===1&&/Sheets/.test(c.get("luSteps[0].words"))&&c.rows().find(r=>/Sheets/.test(r.words)).undo==="luLgUndo(0)");
  ok("the toast says it is back", /Undone — 🧺 Towels is back/.test(c.toasts[c.toasts.length-1]), c.toasts);
  c.writes.length=0; ok("Sheets' undo → back in the washer with its clock", c.get("luLgUndo(0)")===true&&c.laundryData.l2.stage==="washer"&&c.laundryData.l2.ts===2000&&c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/l2"&&w[2].stage==="washer"));
  ok("ledger empty of steps; a bad index undoes nothing", c.get("luSteps.length")===0&&c.get("luLgUndo(0)")===false&&c.get("luLgUndo(7)")===false); }
{ const c=mk(); c.get("llStart('lucy','mom')"); const lid=Object.keys(c.laundryData)[0]; c.open();
  c.writes.length=0; c.get("luLgUndo(0)");
  ok("a started line load's undo: laundry/<id> removed, its log entry off (back in line) — llUnstart, as the bar did", !c.laundryData[lid]&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/"+lid)&&!c.get("laundryLine.log['"+WED+"'].lucy"), c.writes); }
{ const c=mk(); c.get("llMarkDone('lucy','mom')"); c.open(); c.writes.length=0; c.get("luLgUndo(0)");
  ok("✓ Done's undo → llUndone (log/<day>/lucy null)", c.get("llIsDoneOnly('lucy','"+WED+"')")===false&&c.writes.some(w=>w[1]==="laundryLine"&&w[2]["log/"+WED+"/lucy"]===null)); }
{ const rec={load:{label:"Ellis's clothes",stage:"fold",ts:3,by:"ellis"},at:T(8),by:"ellis"};
  const B=mk(); B.get("luAwayOnValue("+JSON.stringify({[WED]:{la:rec}})+")"); B.open();
  ok("another device's put-away: listed with luUnputaway (the old Put away today undo)", B.rows()[0].undo==="luUnputaway('la')"&&/Ellis's clothes — put away/.test(B.html(false)));
  B.writes.length=0; B.get("luUnputaway('la')");
  ok("↩︎ Undo: back in the fold pile, laundry/la set + laundryAway <today>/la null; off the ledger's put-aways", B.laundryData.la.stage==="fold"&&B.writes.some(w=>w[0]==="set"&&w[1]==="laundry/la")&&B.writes.some(w=>w[1]==="laundryAway"&&w[2][WED+"/la"]===null)&&!B.rows().some(r=>/put away/.test(r.words)));
  const K=mk({kid:"lucy",laundry:{l9:{label:"Rags",stage:"dryer",ts:T(6)}}}); K.get("luAwayOnValue("+JSON.stringify({[WED]:{la:rec}})+")"); K.get("laundryAdvance('l9','basket')"); K.open();
  ok("a kid's device: their own tap has ↩︎ Undo (as the bar allowed); another device's put-away and Mom's back-a-stage do not", K.rows().find(r=>/Rags/.test(r.words)).undo==="luLgUndo(0)"&&K.rows().find(r=>/Ellis/.test(r.words)).undo===""&&K.get("luSteps[0].by")==="lucy");
  const D=mk({dad:true,laundry:{l9:{label:"Rags",stage:"dryer",ts:T(6)}}}); D.get("luAwayOnValue("+JSON.stringify({[WED]:{la:rec}})+")"); D.open();
  ok("Dad on his link: the put-away undo and the back-a-stage undo, as before", D.rows().find(r=>/Ellis/.test(r.words)).undo==="luUnputaway('la')"&&D.rows().find(r=>/Rags/.test(r.words)).undo==="laundryBack('l9')"); }
{ const c=mk({laundry:{l1:{label:"Towels",stage:"fold",ts:5}}}); c.get("laundryAdvance('l1')"); c.get("laundryData.l1={label:'Towels',stage:'fold',ts:9}"); c.open(); c.writes.length=0;
  ok("a stale step (the load came back elsewhere): no undo offered, and luLgUndo writes nothing", c.rows()[0].undo===""&&c.get("luLgUndo(0)")===false&&c.writes.length===0&&/moved on since/.test(c.toasts[c.toasts.length-1])); }

console.log("7. Dry run: opens, lists, undo writes nothing");
{ const c=mk({dry:true,laundry:{l1:{label:"Towels",stage:"fold",ts:1},l2:{label:"Sheets",stage:"washer",ts:2}}});
  c.get("laundryAdvance('l1')"); c.get("laundryAdvance('l2','dryer')"); c.open();
  ok("opens and lists both steps; nothing written so far", c.get("luLgOpen")===true&&c.rows().length===2&&c.writes.length===0);
  c.get("luLgUndo(1)"); c.get("luLgUndo(0)"); ok("both undone locally (Towels back folded, Sheets back in the washer); nothing written", c.laundryData.l1&&c.laundryData.l1.stage==="fold"&&c.laundryData.l2.stage==="washer"&&c.writes.length===0);
  c.get("luAwayOnValue({'"+WED+"':{la:{load:{label:'X',stage:'fold'},at:1}}})"); c.get("luUnputaway('la')"); c.get("luLgToggle(); luLgToggle()");
  ok("a put-away undo and the fold toggles: nothing written", c.laundryData.la&&c.writes.length===0); }

console.log("8. Wiring");
{ const i=src.indexOf("// LAUNDRY_LEDGER_START"), j=src.indexOf("// LAUNDRY_LEDGER_END");
  ok("one marked block, right after LAUNDRY_SYNC_END", i>0&&j>i&&src.indexOf("// LAUNDRY_SYNC_END\n// LAUNDRY_LEDGER_START")>0&&src.split("// LAUNDRY_LEDGER_START").length===2);
  ok("the block writes nothing itself (no db.ref) — every undo is a function that already existed", !/db\.ref/.test(LG));
  ok("Household ▸ Laundry: the fold under the 🧺 card (the to-do list), before the schedule; the old bottom Put away today list is gone", (()=>{ const f=fn("hhLaundryHTML"); const a=f.indexOf("mdCardLaundry(true)"), b=f.indexOf("luLgHTML()"), d=f.indexOf("llWeekCardHTML()"); return a>0&&b>a&&d>b&&!/luAwayRowsHTML/.test(f); })());
  ok("My day: the fold under the laundry line card (bare), the Put away today rows folded into it", (()=>{ const f=fn("llMyDayLaundryHTML"); return f.indexOf("luLgHTML(true)")>f.indexOf("llDadCardHTML(who,true)")&&!/luAwayRowsHTML/.test(f); })());
  ok("luLgUndo is luUndo on the same record (the bar's path); luLgRows reuses luAwayList / luValid / _luWords", /luLast=s; const ok=luUndo\(\)/.test(LG)&&/luAwayList\(\)/.test(LG)&&/luValid\(s\)/.test(LG)&&/_luWords\(/.test(LG));
  ok("no kid's name and no 🔀 in the block", !/Lincoln|Ellis|Lucy|Julian|Taylor|Makenzie|Andrew|Caleb|🔀/.test(LG));
  ok("↩ is always the text style (U+FE0E after it) in the block", (LG.match(/↩(?!︎)/g)||[]).length===0); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
