/*
 * 🧺 LAUNDRY_MYDAY3 — the Laundry part of 🏡 My day, Mom's Day and Dad's Day (her words 2026-11-21):
 *   (1) "I would like the laundry line today to go above the machines now … because that's what I'm going to be looking at first"
 *   (2) "on the machines now, I want the buttons where I can click through real quickly where it's at in the line, like it is on
 *       household … So those buttons, I would love them to be on mom and dad's day. All these changes need to be on mom and dad's."
 *   (3) "still out could just be removed since it's up at the top for machines now"
 * Runs the real LAUNDRYLINE (llMyDayLaundryHTML, llDadCardHTML), LAUNDRY_SYNC, LAUNDRY_STAGEROW, LAUNDRYEDIT and mdCardLaundry on a
 * made-up family's Tuesday with four loads still out from earlier days. Every write is recorded; nothing touches Firebase.
 * run: node test_laundry_myday3.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LCONST=cut("const LAUNDRY_STAGES=","const LAUNDRY_STALE_MIN");
const LTIMES=cut("// 🧺 LAUNDRYTIMES (her ask","function laundryEditToggle(");
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"), NUDGE=cut("// LAUNDRY_NUDGE_START","// LAUNDRY_NUDGE_END"), SYNC=cut("// LAUNDRY_SYNC_START","// LAUNDRY_SYNC_END");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END"), CU=cut("// CHOREUNDO_START","// CHOREUNDO_END");
const LE=cut("// LAUNDRYEDIT_START","// LAUNDRYEDIT_END"), SR=cut("// LAUNDRY_STAGEROW_START","// LAUNDRY_STAGEROW_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const ts=(d,h)=>new Date(d+"T"+String(h||10).padStart(2,"0")+":00").getTime();
const TUE="2026-10-27", NOW=ts(TUE,15);
// A made-up family: three kids (Avery, Blake, Casey), Mom and Dad. The line's items (home 1 = Tuesday): today's lay is Avery's clothes + the sheets.
const ITEMS={avery:{label:"Avery's clothes",emoji:"👕",order:0,home:1},blake:{label:"Blake's clothes",emoji:"👕",order:1,home:3},casey:{label:"Casey's clothes",emoji:"👗",order:2,home:3},
  sheets:{label:"Big bed sheets",emoji:"🛏",order:3,home:1,doer:"mom"},momdad:{label:"Mom & Dad's clothes",emoji:"👫",order:4,home:3}};
// Four loads still out, each from an EARLIER day (Still out's loads): a dryer, two baskets, a washer.
const LOADS=()=>({
  lC:{label:"Casey's clothes",stage:"dryer",ts:ts("2026-10-24",11),line:"casey",lineDay:"2026-10-24",by:"dad"},
  lS:{label:"Big bed sheets",stage:"basket",ts:ts("2026-10-23",9),line:"sheets",lineDay:"2026-10-20"},
  lM:{label:"Mom & Dad's clothes",stage:"basket",ts:ts("2026-10-21",16),line:"momdad",lineDay:"2026-10-21"},
  lB:{label:"Blake's clothes",stage:"washer",ts:ts("2026-10-26",17),line:"blake",lineDay:"2026-10-26"}});
const LOG={"2026-10-20":{sheets:{at:ts("2026-10-20"),load:"lS",by:"mom"}},"2026-10-21":{momdad:{at:ts("2026-10-21"),load:"lM",by:"mom"}},
  "2026-10-24":{casey:{at:ts("2026-10-24"),load:"lC",by:"dad"}},"2026-10-26":{blake:{at:ts("2026-10-26"),load:"lB",by:"mom"}}};
// who: "mom" (Mom mode on) · "dad" (Dad's own link: momHere() false, _kioskD() true) · "kid" (neither)
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[], asked=[], who=o.who||"mom";
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,RegExp,
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:()=>!!o.dry, momHere:()=>who==="mom", _kioskD:()=>who==="dad", laundryData:o.loads||LOADS(),
    calDateForWeekDay:d=>({tuesday:TUE})[d]||null, day:"tuesday", _todayDay:"tuesday", tab:"moms-plan", renderAll:()=>{}, renderMomsPlan:()=>{},
    document:{getElementById:id=>(id==="content")?{}:null}, calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, rtStepsFor:()=>[], checked:{},
    ROSTER:["avery","blake","casey"], KID_NAME:{avery:"Avery",blake:"Blake",casey:"Casey"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:m=>toasts.push(m), mwTodayIso:()=>TUE, coSchoolEnd:()=>975,
    toMin:()=>null, fromMin:m=>String(m), laundryAirDryHours:()=>8, laundryTimesEditorHTML:()=>"", confirm:t=>{ asked.push(t); return true; },
    writes, toasts, asked};
  class FakeDate extends Date { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
  ctx.Date=FakeDate;
  vm.createContext(ctx);
  vm.runInContext(LCONST+"\n"+LTIMES+"\n"+LL+"\n"+NUDGE+"\n"+SYNC+"\n"+MS+"\n"+CU+"\n"+LE+"\n"+SR+"\n"+fn("_lbWrite")+"\n"+fn("laundrySince")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel")+"\n"+fn("mdCardLaundry")
    +"\nlaundryTimes={wash:50,dry:60,grace:5};laundryBlockMins={move:5,fold:15};",ctx);
  vm.runInContext("llToday=function(){ return '"+TUE+"'; }; llNowMin=function(){ return 600; };",ctx);
  vm.runInContext("laundryLine="+JSON.stringify({caps:{"0":2,"1":2,"2":2,"3":2,"4":1,"5":1,"6":0},asOf:"2026-10-25",homeFrom:"2026-10-05",items:ITEMS,log:LOG})+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const count=(h,s)=>h.split(s).length-1;
const IDS=["lC","lS","lM","lB"];

for(const who of ["mom","dad"]){
  const W=who==="mom"?"Mom":"Dad";
  console.log("1. "+W+"'s 🏡 My day — the order, top to bottom");
  { const c=mk({who}); const h=c.get("llMyDayLaundryHTML('"+who+"')");
    const iL=h.indexOf("🧺 The laundry line"), iT=h.indexOf(">Today<"), iA=h.indexOf("llStart('avery','"+who+"')"), iM=h.indexOf("🫧 Machines now");
    ok(W+": 🧺 The laundry line → Today (today's loads, ✓ Done / 🫧 Start as "+W+") → 🫧 Machines now", iL>=0&&iT>iL&&iA>iT&&iM>iA, [iL,iT,iA,iM]);
    ok(W+": every running load sits under Machines now", IDS.every(id=>h.indexOf("laundryAdvance('"+id+"')")>iM), IDS.map(id=>h.indexOf("laundryAdvance('"+id+"')")));
    ok(W+": a dashed line between the line and Machines now", /border-top:1px dashed var\(--border\)">[\s\S]*🫧 Machines now/.test(h.slice(iA)));
    console.log("2. "+W+": the stage row + ＋ menu on Machines now, like Household");
    IDS.forEach(id=>ok(W+": "+id+" has the stage buttons (ldsrJump) and ＋ 🌬 Air dry / ＋ 🧺 Basket", new RegExp("ldsrJump\\('"+id+"','").test(h)&&(c.get("laundryData."+id+".stage")==="basket"||(h.indexOf("ldsrMenuOpen('"+id+"','air')")>0&&h.indexOf("ldsrMenuOpen('"+id+"','bk')")>0))));
    c.get("ldsrMenuOpen('lB','air')"); const hm=c.get("llMyDayLaundryHTML('"+who+"')");
    ok(W+": ＋ Air dry opens its menu right in My day — Out of washer / Out of dryer", /ldsrAir\('lB','w'\)/.test(hm)&&/ldsrAir\('lB','d'\)/.test(hm));
    c.get("ldsrMenuOpen('lB','bk')"); const hb=c.get("llMyDayLaundryHTML('"+who+"')");
    ok(W+": ＋ Basket opens its menu — Out of washer — wet / Out of dryer — to fold", /ldsrBk\('lB','w'\)/.test(hb)&&/ldsrBk\('lB','d'\)/.test(hb));
    console.log("3. "+W+": Still out is gone; its loads are in Machines now; nothing twice");
    ok(W+": no 'Still out' in My day", h.indexOf("Still out")<0);
    ok(W+": each earlier-day load is listed once in Machines now (one → button each)", IDS.every(id=>count(h,"laundryAdvance('"+id+"')")===1), IDS.map(id=>count(h,"laundryAdvance('"+id+"')")));
    ok(W+": each heading once", count(h,"🧺 The laundry line")===1&&count(h,"🫧 Machines now")===1&&count(h,">Today<")===1);
    ok(W+": today's line row for the sheets still reads its stage (LAUNDRY_SYNC kept: '· 🧺 in the basket'), no Start", /Big bed sheets.*🧺 in the basket/.test(h)&&!/llStart\('sheets'/.test(h));
    ok(W+": ✎ Edit "+(who==="mom"?"is there for Mom":"is NOT there for Dad"), who==="mom"?/laundryEditLoad\('lC'\)/.test(h):!/laundryEditLoad/.test(h));
  }
}

console.log("4. A stage tap on Dad's Day saves exactly what the same tap saves from Household");
{ const hh=mk({who:"mom"}), dd=mk({who:"dad"});
  const hhHtml=hh.get("mdCardLaundry(true,false,true)"), ddHtml=dd.get("llMyDayLaundryHTML('dad')");
  const tap=(h,id,t)=>{ const m=new RegExp("onclick=\"event\\.stopPropagation\\(\\);(ldsrJump\\('"+id+"','"+t+"'\\))").exec(h); return m&&m[1]; };
  const a=tap(hhHtml,"lC","fold"), b=tap(ddHtml,"lC","fold");
  ok("the same onclick on both pages", !!a&&a===b, [a,b]);
  hh.get(a); dd.get(b);
  ok("Household (Mom) and Dad's My day write the same path and payload", hh.writes.length>=1&&JSON.stringify(hh.writes)===JSON.stringify(dd.writes), [hh.writes,dd.writes]);
  ok("…one targeted update on laundry/lC {stage:'fold', ts}", dd.writes.filter(w=>w[1]==="laundry/lC").length===1&&JSON.stringify(dd.writes.find(w=>w[1]==="laundry/lC"))===JSON.stringify(["update","laundry/lC",{ts:NOW,stage:"fold"}]), dd.writes);
  ok("…the load moved on Dad's device", dd.get("laundryData.lC.stage")==="fold");
  const h2=mk({who:"mom"}), d2=mk({who:"dad"}); h2.get("ldsrBk('lB','w')"); d2.get("ldsrBk('lB','w')");
  ok("＋ Basket ▸ Out of washer from Dad = from Household (laundry/lB {ts,stage:wetbasket,bk:w})", JSON.stringify(h2.writes)===JSON.stringify(d2.writes)&&d2.writes.some(w=>w[1]==="laundry/lB"&&w[2].stage==="wetbasket"&&w[2].bk==="w"), [h2.writes,d2.writes]);
  const h3=mk({who:"mom"}), d3=mk({who:"dad"}); h3.get("ldsrAir('lB','w')"); d3.get("ldsrAir('lB','w')");
  ok("＋ Air dry ▸ Out of washer from Dad = from Household", JSON.stringify(h3.writes)===JSON.stringify(d3.writes)&&d3.writes.some(w=>w[1]==="laundry/lB"&&Array.isArray(w[2].cycle)), [h3.writes,d3.writes]);
}

console.log("5. Dad still has no ✎ Edit");
{ const d=mk({who:"dad"}); d.get("laundryEditLoad('lC')");
  ok("laundryEditLoad on Dad's link opens nothing", d.get("laundryEditId")===null);
  ok("laundryEditBtnHTML is '' for Dad", d.get("laundryEditBtnHTML('lC')")==="");
  ok("no Edit sheet drawn for Dad", !/Stage/.test(d.get("laundryEditSheetHTML('lC')")||""));
}

console.log("6. A kid's device: no stage buttons, no taps");
{ const k=mk({who:"kid"}); const h=k.get("mdCardLaundry(true,true,true)");
  ok("plain chips, no ldsrJump / ＋ menu", !/ldsrJump|ldsrMenuOpen/.test(h)&&/Casey's clothes/.test(h), h.slice(0,400));
  ok("ldsrJump / ldsrBk / ldsrAir move nothing, write nothing", k.get("ldsrJump('lC','fold')")===null&&k.get("ldsrBk('lB','w')")===null&&k.get("ldsrAir('lB','w')")===null&&k.writes.length===0&&k.get("laundryData.lC.stage")==="dryer");
}

console.log("7. Dry run (?dryrun=1) on Dad's Day: the load moves on the screen, nothing is written");
{ const d=mk({who:"dad",dry:true}); d.get("ldsrJump('lC','fold')"); d.get("ldsrBk('lB','w')");
  ok("no Firebase write", d.writes.length===0, d.writes);
  ok("the screen copy moved", d.get("laundryData.lC.stage")==="fold"&&d.get("laundryData.lB.stage")==="wetbasket");
}

console.log("8. Nothing to show");
{ ok("no line, nothing running: empty", mk({loads:{}}).get("(laundryLine={},llMyDayLaundryHTML('mom'))")==="");
  const h=mk({loads:{}}).get("llMyDayLaundryHTML('dad')"); ok("a line but nothing running: the line, no Machines now, no stray divider", h.indexOf("🧺 The laundry line")>=0&&h.indexOf("🫧 Machines now")<0&&!/border-top:1px dashed var\(--border\)"><\/div>/.test(h));
}

console.log("9. Wiring and the block");
{ const my=fn("llMyDayLaundryHTML"), dc=fn("llDadCardHTML");
  ok("llMyDayLaundryHTML: llDadCardHTML(who,true) first, then mdCardLaundry(true,true,true)", my.indexOf("llDadCardHTML(who,true)")>0&&my.indexOf("mdCardLaundry(true,true,true)")>my.indexOf("llDadCardHTML(who,true)"));
  ok("llDadCardHTML draws Still out only when not bare", /!bare&&typeof llStillOutHTML==="function"/.test(dc));
  ok("ldsrOn = ldsrPersonOk (Mom, or Dad on his link)", /ldsrPersonOk\(\)/.test(fn("ldsrOn"))&&/momHere\(\)/.test(fn("ldsrPersonOk"))&&/_kioskD\(\)/.test(fn("ldsrPersonOk")));
  ok("✎ Edit stays Mom only", /momHere\(\)/.test(fn("laundryEditBtnHTML"))&&!/_kioskD/.test(fn("laundryEditBtnHTML"))&&!/_kioskD/.test(fn("laundryEditLoad"))&&!/ldsrPersonOk/.test(fn("laundryEditLoad")));
  ok("Household still passes jump", /mdCardLaundry\(true,false,true\)/.test(src));
  const B=cut("// LAUNDRY_MYDAY3_START","// LAUNDRY_MYDAY3_END");
  ok("one marked LAUNDRY_MYDAY3 block, no Firebase write in it", src.split("// LAUNDRY_MYDAY3_START").length===2&&!/\.ref\(|\.set\(|\.update\(/.test(B));
  ok("no 🔀", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
