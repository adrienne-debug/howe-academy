/*
 * 👕 FOLDREADY (her report 2026-11-20: a child's Afternoon list said "Fold + put away" while his load had not been through the dryer —
 * "it shouldn't show up until it says that it is in the basket or out of the dryer on mom's end"; her picks 2026-11-21: "Show it, never
 * hold the list"). Runs the real LAUNDRYLINE (FOLDREADY inside it), LAUNDRY_CYCLE, LAUNDRY_SYNC blocks, the split-half helpers, and the
 * list code that counts rows (cadDueOn, rtComplete, rtSlotDone, rtBonusSettle, rtLateDays, mdSlotCounts, rtSlotHTML) on a made-up family.
 * Every write is recorded; nothing touches Firebase.
 * run: node test_fold_ready.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"), CYC=cut("// LAUNDRY_CYCLE_START","// LAUNDRY_CYCLE_END"), SYNC=cut("// LAUNDRY_SYNC_START","// LAUNDRY_SYNC_END");
const LIST=["cadDueOn","cadLabel","rtDueOrLate","rtComplete","rtSlotDone","rtBonusFor","rtBonusSettle","rtLateDays","rtDoneOn","mdLateDays","mdSlotCounts","rtSlotHTML"].map(fn).join("\n");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const ts=(d,h)=>new Date(d+"T"+String(h||10).padStart(2,"0")+":00").getTime();
const MON="2026-11-16", TUE="2026-11-17";
const DAYS={monday:MON,tuesday:TUE};
// a made-up family: two kids, each running their own loads
const ITEMS={kipc:{label:"Kip's clothes",emoji:"👕",order:0,doer:"kip"},kipt:{label:"Kip's towels",emoji:"🛁",order:1,doer:"kip"},wrenc:{label:"Wren's clothes",emoji:"👗",order:2,doer:"wren"}};
const AFT=[{emoji:"🐟",label:"Feed the fish",pts:3,cad:"daily"},{emoji:"🗂",label:"Tidy desk",pts:2,cad:"daily"}];
function mk(o){
  o=o||{}; const writes=[], ls={}, today=o.day||MON, dn=o.dayName||"monday";
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, _dryRun:()=>false, momHere:()=>true, _kioskD:()=>false, laundryData:o.loads||{}, laundryTimes:{},
    calDateForWeekDay:d=>DAYS[d]||null, day:dn, _todayDay:dn, tab:"kids", renderAll:()=>{}, document:{getElementById:()=>null},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    ROSTER:["kip","wren"], KID_NAME:{kip:"Kip",wren:"Wren"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes,
    // the list code's world
    slState:{}, routineBonus:{afternoon:{kip:5}}, rtOpen:{}, bank:[], unbank:[], lateMisses:[],
    activeWk:()=>"wk1", nowTs:()=>"3:00 PM", slBefore:()=>({}), slSaveChanged:()=>{}, rlogAppend:()=>{}, choreVerifyOn:()=>false,
    stepWindowOk:()=>true, stepWindowLabel:()=>"", rtWaved:()=>false, rtAvailable:()=>true, rtStepAvail:()=>true, rtIsOpen:()=>true, rtOpenKey:(s,k)=>s+k,
    routineEditable:()=>true, routineLockNote:()=>"", mealOf:()=>"", mealOpen:()=>false, amGet:()=>null, amIso:d=>d, rtWaitAsBefore:()=>true,
    rtWaitCut:(st,n)=>n, SL_SLBL:{afternoon:"Afternoon"}, SL_STIM:{afternoon:""}, rtFmtHour:h=>h+"", rtAfternoonHour:()=>15, rtEveningHour:()=>18,
    getSlot:()=>({}), DAYS_ALL:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]};
  ctx.bankDirect=(k,p,n)=>{ ctx.bank.push([k,p,n]); return "b"+ctx.bank.length; }; ctx.bankDirectRemove=(k,b)=>{ ctx.unbank.push([k,b]); };
  ctx._rtLogLateMiss=(...a)=>{ ctx.lateMisses.push(a); };
  vm.createContext(ctx);
  vm.runInContext(LL+"\n"+CYC+"\n"+SYNC+"\n"+fn("laundrySplitHalfId")+"\n"+fn("laundrySplitHung")+"\n"+LIST+"\nconst RT_ABBR={afternoon:'a',chores:'c',evening:'e'};",ctx);
  vm.runInContext("llToday=function(){ return '"+today+"'; }; llNowMin=function(){ return 900; };",ctx);
  if(o.line!==null) vm.runInContext("laundryLine="+JSON.stringify(Object.assign({caps:{"0":3,"1":3,"2":3,"3":3,"4":3,"5":0,"6":0},asOf:MON,homeFrom:MON,items:ITEMS,log:o.log||{}},o.line||{}))+";",ctx);
  vm.runInContext("rtStepsFor=function(sl,kid,raw,d){ const b=sl==='afternoon'?AFT_:[]; return raw?b:llRtSteps(sl,kid,b,d||day); };",Object.assign(ctx,{AFT_:o.aft||AFT}));
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
// Kip's clothes went in Monday morning (load A); stage as given
const one=(stage,extra)=>mk({log:{[MON]:{kipc:{at:ts(MON,9),load:"A",by:"kip"}}},loads:{A:Object.assign({label:"Kip's clothes",stage:stage,ts:ts(MON,9),line:"kipc",lineDay:MON,by:"kip"},extra||{})}});
const fold=c=>c.rtStepsFor("afternoon","kip",false,"monday")[2];

console.log("1. Each stage: not ready → hidden in place; out of the dryer / dry basket → shown, never due");
["prewash","washer","wetbasket","dryer","airdry","custom","bin"].forEach(s=>{ const c=one(s), r=fold(c);
  ok("stage "+s+": the Fold row is still at index 2, but hidden (cad none, not ready)", c.rtStepsFor("afternoon","kip",false,"monday").length===3&&r.laundry==="lineFold"&&r.line==="kipc"&&r.cad==="none"&&r.llHidden===true&&!r.foldReady, r); });
["fold","basket"].forEach(s=>{ const c=one(s), r=fold(c);
  ok("stage "+s+": shown as an extra row (cad asneeded, ready), same label + stars", r.cad==="asneeded"&&r.foldReady===true&&!r.llHidden&&r.label==="Fold + put away: Kip's clothes"&&r.pts===15&&r.laundry==="lineFold", r); });
{ const c=one("dryer",{bk:"d"}); ok("a dryer load only MARKED for the basket (bk d) is not ready yet", fold(c).cad==="none");
  const w=one("wetbasket",{bk:"w"}); ok("wet basket (out of the washer, waiting for the dryer) is not ready", fold(w).cad==="none");
  const b=one("basket",{bk:"d"}); ok("dry basket (out of the dryer) is ready", fold(b).cad==="asneeded");
  ok("THE test is one small pure function: fold / basket only", c.llFoldReady({stage:"fold"})&&c.llFoldReady({stage:"basket"})&&!c.llFoldReady({stage:"airdry"})&&!c.llFoldReady({stage:"wetbasket"})&&!c.llFoldReady(null)&&/^function llFoldReady\(l\)\{ return !!l&&\(l\.stage==="fold"\|\|l\.stage==="basket"\); \}/.test(fn("llFoldReady"))); }
{ const c=one("washer"), r=mk({log:{}}); ok("no Fold row at all before the load goes in (as before)", r.rtStepsFor("afternoon","kip",false,"monday").length===2);
  ok("the Morning list is untouched by FOLDREADY", c.rtStepsFor("morning","kip",false,"monday").every(s=>s.laundry!=="lineFold")); }

console.log("2. Custom cycles and split loads");
{ const c=one("washer",{cycle:[{k:"wash",m:40},{k:"custom",n:"Soak",m:30},{k:"dry",m:50}],step:0});
  const adv=()=>c.get("lcAdvance(laundryData.A); llMemoReset(); laundryData.A.stage");
  ok("cycle step 1 (wash): hidden", fold(c).cad==="none");
  ok("cycle step 2 (custom Soak): hidden", adv()==="custom"&&fold(c).cad==="none");
  ok("cycle step 3 (dry): hidden", adv()==="dryer"&&fold(c).cad==="none");
  ok("after its last step (the fold pile): shown", adv()==="fold"&&fold(c).cad==="asneeded"); }
{ const c=one("airdry",{hang:true,cycle:[{k:"airdry",m:480}],step:0});
  ok("hang it all: still hanging → hidden", fold(c).cad==="none");
  c.get("laundryData.A.stage='fold'; laundryData.A.step=1; llMemoReset()"); ok("taken down to the fold pile → shown", fold(c).cad==="asneeded"); }
{ const c=one("fold",{label:"Kip's clothes — dryer half",split:{part:"dry"}}); c.get("laundryData.A_h={label:\"Kip's clothes — hanging\",stage:'airdry',ts:"+ts(MON,10)+",hang:true,cycle:[{k:'airdry',m:480}],step:0,split:{of:'A',part:'hang'}}");
  ok("split: dryer half folded but the hung half still hanging → hidden", fold(c).cad==="none");
  c.get("laundryData.A_h.stage='fold'; llMemoReset()"); ok("split: both halves at the fold pile → shown", fold(c).cad==="asneeded");
  c.get("delete laundryData.A; laundryData.A_h.stage='airdry'; llMemoReset()"); ok("split: dryer half put away, hung half still hanging → hidden", fold(c).cad==="none"&&!c.llKidRowLineDone(fold(c)));
  c.get("laundryData.A_h.stage='basket'; llMemoReset()"); ok("split: hung half down in the basket → shown", fold(c).cad==="asneeded");
  c.get("delete laundryData.A_h; llMemoReset()"); ok("split: both away → shown, and the row reads done", fold(c).cad==="asneeded"&&c.llKidRowLineDone(fold(c))); }

console.log("3. Two loads: the first not ready, the second ready — indexes never move");
{ const c=mk({log:{[MON]:{kipc:{at:ts(MON,9),load:"A",by:"kip"},kipt:{at:ts(MON,9),load:"B",by:"kip"}}},
  loads:{A:{label:"Kip's clothes",stage:"dryer",ts:ts(MON,9),line:"kipc",lineDay:MON},B:{label:"Kip's towels",stage:"fold",ts:ts(MON,11),line:"kipt",lineDay:MON}}});
  const s1=c.rtStepsFor("afternoon","kip",false,"monday");
  ok("4 rows: fish, desk, clothes (hidden), towels (shown)", s1.length===4&&s1[2].line==="kipc"&&s1[2].cad==="none"&&s1[3].line==="kipt"&&s1[3].cad==="asneeded", s1.map(s=>[s.label,s.cad]));
  c.get("slState['wk1_monday_kip_astep3']={done:true,ts:'2:00 PM',pts:15,bid:'b9'}");   // Kip ticks his towels (row 3)
  c.get("laundryData.A.stage='fold'; llMemoReset()");   // later the clothes come out of the dryer
  const s2=c.rtStepsFor("afternoon","kip",false,"monday");
  ok("clothes ready now: same 4 rows in the same order, both shown", s2.length===4&&s2.map(s=>s.line||s.label).join()===s1.map(s=>s.line||s.label).join()&&s2[2].cad==="asneeded"&&s2[3].cad==="asneeded");
  ok("the towels' tick stays on the towels; the clothes row is not ticked", c.rtDoneOn("afternoon","kip","monday",3)&&!c.rtDoneOn("afternoon","kip","monday",2)); }

console.log("4. The list never waits on a Fold row; the 🏁 bonus is never taken back");
{ const c=one("washer"), base=()=>c.rtStepsFor("afternoon","kip",false,"monday");
  const due=()=>base().filter((st,i)=>c.rtDueOrLate("afternoon","kip","monday",i,st)).length;
  const tick=i=>{ c.get("slState['wk1_monday_kip_astep"+i+"']={done:true,ts:'3:00 PM',pts:3,bid:null}"); const prev=c.get("slState['wk1_monday_kip_afternoon']"), all=c.rtComplete("afternoon","kip","monday");
    c.get("slState['wk1_monday_kip_afternoon']={done:"+all+",ts:''}"); c.rtBonusSettle("afternoon","kip","wk1","monday",prev,all,due()); return all; };
  ok("while the load washes: 2 due rows (the Fold row is not one)", due()===2&&c.mdSlotCounts("afternoon","kip","monday").due===2);
  ok("fish ticked: not done yet", tick(0)===false&&c.bank.length===0);
  ok("desk ticked: the Afternoon list is done and the 🏁 bonus pays (5 ⭐)", tick(1)===true&&c.bank.length===1&&c.bank[0][1]===5&&c.rtSlotDone("kip","afternoon","monday"));
  c.get("laundryData.A.stage='fold'; llMemoReset()");   // out of the dryer after the list was finished
  const prev=c.get("slState['wk1_monday_kip_afternoon']"), all=c.rtComplete("afternoon","kip","monday"); c.rtBonusSettle("afternoon","kip","wk1","monday",prev,all,due());
  ok("the Fold row turns up after: the list stays done, the bonus is not taken back", all===true&&c.unbank.length===0&&c.rtSlotDone("kip","afternoon","monday")&&c.get("slState['wk1_monday_kip_afternoon'].bonusBid")==="b1");
  ok("…and still 2 due (2/2 on Mom's Kids today count too)", due()===2&&c.mdSlotCounts("afternoon","kip","monday").due===2&&c.mdSlotCounts("afternoon","kip","monday").done===2);
  ok("never late, never a \"— not done\"", c.rtLateDays("afternoon","kip",2)===0&&c.rtLateDays("afternoon","kip",2,true)===0&&c.lateMisses.length===0); }
{ const c=one("basket"), due=()=>c.rtStepsFor("afternoon","kip",false,"monday").filter((st,i)=>c.rtDueOrLate("afternoon","kip","monday",i,st)).length;
  c.get("slState['wk1_monday_kip_astep0']={done:true}; slState['wk1_monday_kip_astep1']={done:true}");
  ok("a ready Fold row still open: the list counts as finished and the bonus can pay", c.rtComplete("afternoon","kip","monday")&&due()===2&&!c.rtDoneOn("afternoon","kip","monday",2)); }

console.log("5. What the kid's Afternoon list draws");
{ const w=one("dryer"); w.get("slState['wk1_monday_kip_astep0']={done:true}; slState['wk1_monday_kip_astep1']={done:true}");
  const h=w.rtSlotHTML("afternoon","kip");
  ok("in the dryer: no Fold row drawn, 2/2, the list done", !/Fold \+ put away/.test(h)&&/2\/2/.test(h)&&/sl-check-row done/.test(h)&&w.lateMisses.length===0, h.slice(0,300));
  const r=one("fold"); r.get("slState['wk1_monday_kip_astep0']={done:true}");
  const g=r.rtSlotHTML("afternoon","kip");
  ok("out of the dryer: the row is drawn, tappable at its own index, with its stars and a '🧺 ready to fold' tag; count stays 1/2", /Fold \+ put away: Kip's clothes/.test(g)&&/toggleRtStep\('afternoon','kip',2\)/.test(g)&&/🧺 ready to fold/.test(g)&&!/as needed/.test(g)&&/\+15 ⭐/.test(g)&&/1\/2/.test(g));
  r.get("slState['wk1_monday_kip_astep1']={done:true}");
  ok("the other rows ticked, the Fold row open: the list reads done (2/2)", /sl-check-row done/.test(r.rtSlotHTML("afternoon","kip"))&&/2\/2/.test(r.rtSlotHTML("afternoon","kip")));
  const o=one("fold"); o.get("slState['wk1_monday_kip_astep2']={done:true,auto:'line',pts:0}"); const k=o.rtSlotHTML("afternoon","kip");
  ok("a ticked Fold row drops the 'ready' tag", /Fold \+ put away/.test(k)&&!/ready to fold/.test(k));
  ok("a plain ✋ as-needed row elsewhere keeps its tag", /as needed/.test(mk({aft:[{label:"Lizard tank",cad:"asneeded",pts:4}]}).rtSlotHTML("afternoon","kip"))); }

console.log("6. ✓ puts it away, un-✓ brings it back (FOLD_BACK), the auto-tick follows the line");
{ const c=one("fold"), r=fold(c);
  c.llKidRowHook("kip",r,true);
  ok("✓ the ready row: the load is put away (laundry/A removed, away note written)", !c.get("laundryData.A")&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/A")&&c.writes.some(w=>w[0]==="update"&&w[2]["log/"+MON+"/kipc/away"]), c.writes);
  ok("put away: the row still shows (ticked state comes from the line)", fold(c).cad==="asneeded"&&c.llKidRowLineDone(fold(c)));
  c.llKidRowHook("kip",fold(c),false);
  ok("un-✓: the load is back in the fold pile and the row shows again, not done", c.get("laundryData.A.stage")==="fold"&&fold(c).cad==="asneeded"&&!c.llKidRowLineDone(fold(c))); }
{ const c=one("dryer"); c.get("laundryData.A.stage='fold'; llPutAway('A'); llMemoReset()");   // put away from the dryer straight (Mom's tap)
  c.get("var _b=laundryLine.log['"+MON+"'].kipc.away.load; _b.stage='dryer'"); c.llUnputawayLine("kipc"); c.get("llMemoReset()");
  ok("brought back to the dryer: hidden again", c.get("laundryData.A.stage")==="dryer"&&fold(c).cad==="none"); }
{ const c=one("washer"); c.get("activeWk=function(){ return 'wk1'; }");
  c.get("slState['wk1_monday_kip_astep2']={done:true,ts:'',pts:0,bid:null,auto:'line'}"); c.get("rtComplete=function(){ return false; }; morningComplete=function(){ return false; }");
  c.llSyncKidRows();
  ok("a stale automatic tick on a hidden row comes off (the load is in the machines)", c.get("slState['wk1_monday_kip_astep2'].done")===false); }

console.log("7. Tomorrow, other kids, families without the line");
{ const c=mk({day:TUE,dayName:"tuesday",log:{[MON]:{kipc:{at:ts(MON,9),load:"A",by:"kip"}}},loads:{A:{label:"Kip's clothes",stage:"basket",ts:ts(MON,16),line:"kipc",lineDay:MON,by:"kip"}}});
  ok("Monday's load still in the basket Tuesday: on Kip's 🧺 Your laundry card (llKidOutLoads), as before", c.llKidOutLoads("kip",TUE).map(o=>o.id).join()==="A");
  ok("…and not a row on Tuesday's Afternoon list, so it holds nothing there", c.rtStepsFor("afternoon","kip",false,"tuesday").length===2); }
{ const c=one("washer"); ok("today's own load in the washer is not on the card's 'out' rows either (unchanged)", c.llKidOutLoads("kip",MON).length===0); }
{ const c=mk({log:{[MON]:{kipc:{at:ts(MON,9),load:"A"}}},loads:{A:{label:"Kip's clothes",stage:"washer",ts:ts(MON,9),line:"kipc",lineDay:MON},Z:{label:"Kip's clothes",stage:"washer",ts:ts("2026-11-14",9),line:"kipc",lineDay:"2026-11-14"}}});
  c.get("delete laundryData.A; laundryLine.log['"+MON+"'].kipc.away={at:1,load:{stage:'fold'}}; llMemoReset()");
  ok("today's load away but an earlier load of the item still in the washer (what ✓ would put away): hidden", fold(c).cad==="none"); }
{ const c=one("washer"); ok("Wren's lists don't get Kip's Fold row", c.rtStepsFor("afternoon","wren",false,"monday").length===2); }
{ const c=mk({line:null}); const S=c.get("AFT_"), out=c.llRtSteps("afternoon","kip",S,"monday");
  ok("no laundry line: the list comes back untouched (same array)", out===S&&!c.llDrivesKid("kip")); }
{ ok("no new writes: FOLDREADY has no db / llWrite / slState writes", !/db\.ref|llWrite|slState\[|_lbWrite|HA_LS/.test(cut("// FOLDREADY_START","// FOLDREADY_END")));
  ok("the Fold row is built by llFoldRow (no literal cad daily left there)", /out\.push\(llFoldRow\(kid,id,iso\)\)/.test(fn("_llRtStepsRaw"))&&!/laundry:"lineFold"/.test(fn("_llRtStepsRaw"))); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
