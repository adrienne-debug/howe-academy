/*
 * 🧺 LAUNDRY_SPLIT (Adrienne's 2026-10-22 fix list, item 5 — Sara DeWalt's asks too). Three laundry asks in one block:
 *   W1 Wet basket — after the washer a load may wait, wet, in a basket so the washer is free (stage wetbasket, between washer and dryer;
 *      the washer's tap asks where; "🧺 Waiting for the dryer"; a gentle nudge after settings/laundry/wetBasketMins, default 90).
 *   W2 Hang-to-dry split — all to the dryer, all hung, or part hung: two tracked halves of ONE load ("Towels — dryer half" /
 *      "Towels — hanging", the existing airdry stage timed by settings/laundry/airDryHours, default 8); done only when both are put away.
 *   W3 Load alerts — Mom's free text per load; a confirm pop-up when the load leaves the washer; "Not yet" leaves it in the washer.
 *   An unsplit load with no alert that goes to the dryer is written exactly as before.   run: node test_laundry_split.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const CONSTS=src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_WET_STAGES")))+"\n"+cut("const LAUNDRY_EDIT_STAGES",";")+";\n"+cut("const LAUNDRY_KIDMOVE_FROM",";")+";\nconst LAUNDRY_FOLDED_BTN=\"Folded ✓\";\n";
const CYCLE=cut("// LAUNDRY_CYCLE_START","// LAUNDRY_CYCLE_END"), SPLIT=cut("// LAUNDRY_SPLIT_START","// LAUNDRY_SPLIT_END"), BASKET=cut("// BASKET_START","// BASKET_END");
const H=h=>h*3600000, M=m=>m*60000;
const FNS=["laundryAdvance","laundryAdvanceLabel","laundryBackStage","laundryBack","_cuCycleMin","_cuMomOk","_cuStageName","laundryNudgeKind","laundryNudgeList","laundryNudgeRowHTML","laundryT","laundryFoldHrs","laundryDoneAt","laundryDoneTxt",
  "laundryKidMovePick","laundryBlockStep","laundryMeta","laundryTimesEditorHTML","laundryTimesSave","laundryEditSheetHTML","laundryEditSave","_leHM","_leRe","_leCycleTok","_leCycleOpts",
  "_lbQ","llLoadStage","llKidRowLineDone","llParentTick","llPutAway","llNoteAway","llAwayDay","llUnputawayLine","llAwayStageWords","llStart","llEdSave","llEdLoadHTML"];
// A small world: the loads, Mom here, every write recorded, a DOM that remembers what was painted, the laundry line with one item (Towels) started today.
function mk(o){
  o=o||{}; const writes=[], toasts=[], ls={}, dom={}, vals=o.vals||{};
  const line=o.line||{};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,
    laundryData:JSON.parse(JSON.stringify(o.loads||{})), laundryTimes:{wash:60,dry:60,grace:30,foldHrs:3}, momBlocks:{}, laundryLine:line, laundryEditId:null, laundryEditOpen:true,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, _lbWrite:()=>true, momHere:()=>true, _cuDropBlock:()=>null, _cuRe:()=>{}, momBlockKey:(id,s)=>id+"_"+s, laundryBlockDone:()=>{},
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    esc:s=>String(s==null?"":s), cap:s=>s.charAt(0).toUpperCase()+s.slice(1), mwToast:t=>toasts.push(t), tab:"moms-plan", renderMomsPlan:()=>{}, renderAll:()=>{}, hhRender:()=>{},
    laundrySince:()=>"9:05 AM", ROSTER:[], KID_NAME:{},
    // the laundry line's own helpers, enough for llStart / llNoteAway / llUnputawayLine / llLoadStage / llParentTick / llEdSave
    llToday:()=>"2026-10-22", llStore:()=>{ ctx.stored=(ctx.stored||0)+1; }, llWrite:u=>writes.push(["ll",Object.assign({},u)]), llSyncKidRows:()=>{ ctx.synced=(ctx.synced||0)+1; return 0; },
    llAll:()=>line.items||{}, llItems:()=>line.items||{}, llOrder:()=>Object.keys(line.items||{}), llLog:()=>[], llPeople:()=>["mom","dad","lucy"], llRiders:()=>[], llBlanketsDueOn:()=>[], llEnsureItems:()=>{}, llBedAskItems:()=>[], llRerender:()=>{},
    llLabelFull:id=>((line.items||{})[id]||{}).label||id, llUnstart:()=>{}, llKnown:()=>true, llWith:()=>"", llLineOrder:()=>Object.keys(line.items||{}), llChange:f=>f(), llMomGo:f=>f(), _llVal:id=>vals[id]||"", _llInp:"", llEdId:o.llEdId||"",
    llDayLog:iso=>{ const L=Object.assign({},(line.log&&line.log[iso])||{}); return L; },
    document:{getElementById:id=>dom[id]||(vals[id]!=null?{value:vals[id]}:null),body:{appendChild:w=>{ dom[w.id]=w; }},createElement:()=>({id:"",innerHTML:""})},
    writes, toasts, dom, vals};
  vm.createContext(ctx);
  vm.runInContext(CONSTS+"\n"+CYCLE+"\n"+SPLIT+"\n"+BASKET+"\n"+FNS.map(fn).join("\n"),ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.whereId=()=>ctx.get("_lspId"); ctx.alertId=()=>ctx.get("_lspAlertId"); ctx.pop=()=>(ctx.dom["lsp-wrap"]||{}).innerHTML||""; ctx.basketPop=()=>(ctx.dom["lbk-wrap"]||{}).innerHTML||"";
  ctx.L=()=>ctx.get("laundryData"); return ctx;
}
const NOW=Date.now();

console.log("0. The block, its markers, its words");
{ ok("one // LAUNDRY_SPLIT_START … // LAUNDRY_SPLIT_END block, after the LAUNDRY_CYCLE code", src.indexOf("// LAUNDRY_SPLIT_START")>src.indexOf("// LAUNDRY_CYCLE_END")&&src.indexOf("// LAUNDRY_SPLIT_END")>src.indexOf("// LAUNDRY_SPLIT_START")&&src.split("// LAUNDRY_SPLIT_START").length===2);
  ok("stage wetbasket in LAUNDRY_STAGE_META: 🧺 Waiting for the dryer — the after-dryer basket still there", /wetbasket:\["🧺","Waiting for the dryer"\]/.test(CONSTS)&&/basket:\["🧺","In the basket"\]/.test(CONSTS));
  ok("airdry is the hung half's stage — no second air-dry stage", (CONSTS.match(/airdry:/g)||[]).length===1&&!/hangdry|airdry2|hanging:\[/.test(SPLIT));
  ok("no 🔀 anywhere", src.indexOf("🔀")<0);
  ok("every Firebase write in the block is targeted: laundry/<id>, laundry/<id>_h, settings/laundry, the line's own multi-path update", /db\.ref\('laundry\/'\+id\)\.update\(up\)/.test(SPLIT)&&/db\.ref\('laundry\/'\+hid\)\.set\(h\)/.test(SPLIT)&&/db\.ref\('settings\/laundry'\)\.update\(ch\)/.test(SPLIT)&&!/\.ref\(['"]laundry['"]\)/.test(SPLIT)&&!/\.set\(laundryData\)/.test(SPLIT));
}
console.log("1. W1 — the washer's tap asks where; Not yet moves nothing");
{ const c=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW-H(1.2)}}});
  c.get("laundryAdvance('l1')");
  ok("the question is up, the load is still in the washer, nothing written", c.whereId()==="l1"&&c.L().l1.stage==="washer"&&c.writes.length===0, [c.whereId(),c.writes]);
  const h=c.pop();
  ok("'Towels — out of the washer · Where is it going?' with Into the dryer · A basket for now · Hang it all · Hang some · Not yet", /Towels — out of the washer/.test(h)&&/Where is it going\?/.test(h)&&/laundrySplitWhereAnswer\('dryer'\)/.test(h)&&/laundrySplitWhereAnswer\('wetbasket'\)/.test(h)&&/laundrySplitWhereAnswer\('hang'\)/.test(h)&&/laundrySplitWhereAnswer\('split'\)/.test(h)&&/>Not yet</.test(h));
  c.get("laundrySplitWhereAnswer()"); ok("Not yet: the question closes, the load is in the washer, no write", c.whereId()===null&&c.pop()===""&&c.L().l1.stage==="washer"&&c.writes.length===0);
}
{ const c=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW}}}); c.get("laundryAdvance('l1')"); c.get("laundryData.l1.stage='dryer'");
  c.get("laundrySplitWhereAnswer('wetbasket')"); ok("the load moved on another device while the question was up: the answer is dropped, nothing written", c.L().l1.stage==="dryer"&&c.writes.length===0&&c.whereId()===null);
  const a=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW,alert:"x"}}}); a.get("laundryAdvance('l1','dryer')"); a.get("laundryData.l1.stage='dryer'"); a.get("laundryAlertAnswer(true)");
  ok("the same for a stale alert answer", a.writes.length===0&&a.alertId()===null); }
console.log("2. An unsplit load with no alert → the dryer: byte for byte the old write");
{ const c=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW-H(1.2)}}});
  c.get("laundryAdvance('l1')"); c.get("laundrySplitWhereAnswer('dryer')");
  const w=c.writes.filter(x=>x[1]==="laundry/l1");
  ok("one laundry/l1 set — stage dryer, label, ts and nothing else (no split / hang / alert fields)", w.length===1&&w[0][0]==="set"&&JSON.stringify(Object.keys(w[0][2]).sort())==='["label","stage","ts"]'&&w[0][2].stage==="dryer"&&w[0][2].label==="Towels", w);
  ok("the record in memory is the same three fields", JSON.stringify(Object.keys(c.L().l1).sort())==='["label","stage","ts"]');
  ok("no basket nudge, no toast of this block's — the old path ran", c.toasts.length===0);
  const d=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW-H(1.2)}}}); d.get("laundryAdvance('l1','dryer')");
  ok("laundryAdvance(id,'dryer') straight: the same one write, no question", d.whereId()===null&&d.writes.length===1&&d.writes[0][2].stage==="dryer");
}
console.log("3. W1 — into the wet basket, its words, its nudge, out again");
{ const c=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW-H(1.2)}}});
  c.get("laundryAdvance('l1')"); c.get("laundrySplitWhereAnswer('wetbasket')");
  ok("stage wetbasket, a fresh clock — one targeted laundry/l1 update {stage,ts}", c.L().l1.stage==="wetbasket"&&c.L().l1.ts>=NOW&&c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][1]==="laundry/l1"&&JSON.stringify(Object.keys(c.writes[0][2]).sort())==='["stage","ts"]', c.writes);
  ok("it reads 🧺 Waiting for the dryer; its button is → Dryer; no machine clock (no 'done at')", c.get("laundryMeta(laundryData.l1)[1]")==="Waiting for the dryer"&&c.get("_cuStageName('wetbasket')")==="🧺 Waiting for the dryer"&&c.get("laundryAdvanceLabel('wetbasket',laundryData.l1)")==="→ Dryer"&&c.get("laundryDoneAt(laundryData.l1)")===0);
  ok("the toast: Towels — waiting for the dryer", /Towels — waiting for the dryer/.test(c.toasts[0]));
  c.get("laundryData.l1.ts="+(NOW-M(60))); ok("60 min in (default 90): quiet", c.get("laundryNudgeKind(laundryData.l1)")==="");
  c.get("laundryData.l1.ts="+(NOW-M(95))); ok("95 min: a 'wetbasket' nudge — gentle words, never 'sours'", c.get("laundryNudgeKind(laundryData.l1)")==="wetbasket"&&/Towels<\/b> has been waiting for the dryer since 9:05 AM — move it along when the dryer's free/.test(c.get("laundryNudgeRowHTML({id:'l1',l:laundryData.l1,kind:'wetbasket'})"))&&!/sours/.test(c.get("laundryNudgeRowHTML({id:'l1',l:laundryData.l1,kind:'wetbasket'})")));
  ok("her minutes: settings/laundry/wetBasketMins 30 → the nudge at 60 min", (c.get("laundrySplitSettingsOnValue({wetBasketMins:30})"),c.get("laundryData.l1.ts="+(NOW-M(60))),c.get("laundryNudgeKind(laundryData.l1)")==="wetbasket"));
  ok("the nudge list carries it", c.get("laundryNudgeList(Date.now()).map(x=>x.kind).join()")==="wetbasket");
  c.writes.length=0; c.get("laundryAdvance('l1')");
  ok("its → Dryer asks again — without the basket (it's already in one)", c.whereId()==="l1"&&/Towels — out of the basket/.test(c.pop())&&/laundrySplitWhereAnswer\('dryer'\)/.test(c.pop())&&!/laundrySplitWhereAnswer\('wetbasket'\)/.test(c.pop())&&/laundrySplitWhereAnswer\('hang'\)/.test(c.pop()));
  c.get("laundrySplitWhereAnswer('dryer')");
  ok("into the dryer: stage dryer, fresh clock, laundry/l1 update {stage,ts}", c.L().l1.stage==="dryer"&&c.writes.length===1&&c.writes[0][2].stage==="dryer"&&JSON.stringify(Object.keys(c.writes[0][2]).sort())==='["stage","ts"]');
  const b=mk({loads:{l1:{label:"Towels",stage:"wetbasket",ts:NOW}}});
  ok("↶ from the wet basket = back to the washer, finished now (ts = now − wash minutes), laundry/l1 update", b.get("laundryBackStage(laundryData.l1)")==="washer"&&(b.get("laundryBack('l1')"),b.L().l1.stage==="washer")&&Math.abs(b.L().l1.ts-(NOW-M(60)))<5000&&b.writes.some(w=>w[0]==="update"&&w[1]==="laundry/l1"&&w[2].stage==="washer"));
  ok("✎ Times offers the wet basket after the washer", JSON.stringify(b.get("LAUNDRY_EDIT_STAGES"))==='["bin","prewash","washer","wetbasket","dryer","basket","fold"]');
  const k=mk({loads:{l1:{label:"Towels",stage:"wetbasket",ts:NOW}}});
  ok("a kid's 'move it to the dryer' chore still takes washer loads only — a wet basket is the parent's move", k.get("laundryKidMovePick('dryer')")===null);
}
console.log("4. W1 — a custom-cycle load (prewash → wash → dry) waits in the wet basket too, then goes on to its own dry step");
{ const cy=[{k:"prewash",m:30},{k:"wash",m:50},{k:"dry",m:70}];
  const c=mk({loads:{l1:{label:"Sheets",stage:"washer",step:1,ts:NOW-H(1),cycle:cy}}});
  ok("on its wash step the next tap is the washer's question", (c.get("laundryAdvance('l1')"),c.whereId()==="l1"));
  c.get("laundrySplitWhereAnswer('wetbasket')"); ok("wet basket: stage wetbasket, step kept (1), the cycle untouched", c.L().l1.stage==="wetbasket"&&c.L().l1.step===1&&c.L().l1.cycle.length===3);
  ok("its words and clock: Waiting for the dryer, nothing 'done at', no sour nudge after its wash minutes", c.get("laundryMeta(laundryData.l1)[1]")==="Waiting for the dryer"&&c.get("laundryDoneAt(laundryData.l1)")===0&&(c.get("laundryData.l1.ts="+(NOW-M(85))),c.get("laundryNudgeKind(laundryData.l1)")===""));
  c.writes.length=0; c.get("laundryAdvance('l1')"); c.get("laundrySplitWhereAnswer('dryer')");
  ok("→ Dryer: its own dry step (stage dryer, step 2), laundry/l1 update {stage,ts,step}", c.L().l1.stage==="dryer"&&c.L().l1.step===2&&c.writes[0][2].step===2&&c.writes[0][2].stage==="dryer");
  const p=mk({loads:{l1:{label:"Sheets",stage:"prewash",step:0,ts:NOW,cycle:cy}}}); p.get("laundryAdvance('l1')");
  ok("on its prewash step (a wash still to come) there is no question — straight to the wash step as before", p.whereId()===null&&p.L().l1.stage==="washer"&&p.L().l1.step===1);
  const a=mk({loads:{l1:{label:"Wool",stage:"washer",step:0,ts:NOW,cycle:[{k:"wash"},{k:"airdry",m:300}]}}}); a.get("laundryAdvance('l1')");
  ok("a cycle whose next step is its own air dry: no question, the cycle's own path", a.whereId()===null&&a.L().l1.stage==="airdry"&&a.L().l1.step===1);
}
console.log("5. W2 — hang it all");
{ const c=mk({loads:{l1:{label:"Sweaters",stage:"washer",ts:NOW-H(1)}}});
  c.get("laundryAdvance('l1')"); c.get("laundrySplitWhereAnswer('hang')");
  const l=c.L().l1;
  ok("stage airdry, hang:true, one air-dry step of 8 h (settings/laundry/airDryHours default), step 0, fresh clock", l.stage==="airdry"&&l.hang===true&&l.step===0&&l.cycle.length===1&&l.cycle[0].k==="airdry"&&l.cycle[0].m===480&&l.ts>=NOW, l);
  ok("one laundry/l1 update {stage,ts,hang,cycle,step}", c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][1]==="laundry/l1"&&JSON.stringify(Object.keys(c.writes[0][2]).sort())==='["cycle","hang","stage","step","ts"]');
  ok("it reads 🌬 Hanging to dry (lcMeta asks the block first); its button: Dry ✓ — take it down", c.get("laundryMeta(laundryData.l1)").join(" ")==="🌬 Hanging to dry"&&c.get("laundryAdvanceLabel('airdry',laundryData.l1)")==="Dry ✓ — take it down");
  ok("dry at ts + 8 h; quiet at 7 h, the airdry nudge after 8 h 30 (her grace)", c.get("laundryDoneAt(laundryData.l1)")===l.ts+H(8)&&(c.get("laundryData.l1.ts="+(NOW-H(7))),c.get("laundryNudgeKind(laundryData.l1)")==="")&&(c.get("laundryData.l1.ts="+(NOW-H(8.6))),c.get("laundryNudgeKind(laundryData.l1)")==="airdry"));
  ok("her hours: settings/laundry/airDryHours 4 → the next hang is a 4 h step", (c.get("laundrySplitSettingsOnValue({airDryHours:4})"),c.get("laundryAirDryStep()[0].m")===240));
  c.writes.length=0; c.get("laundryAdvance('l1')");
  ok("Dry ✓ — take it down: the dryer's fold-or-basket question, worded for a hung load", c.get("_lbkId")==="l1"&&/Sweaters — dry, take it down/.test(c.basketPop())&&!/out of the dryer/.test(c.basketPop()));
  c.get("laundryBasketAnswer('fold')"); ok("Fold now → the fold pile, then ✓ Put away as always", c.L().l1.stage==="fold"&&c.get("laundryAdvanceLabel('fold',laundryData.l1)")==="✓ Put away");
  const b=mk({loads:{l1:{label:"Sweaters",stage:"airdry",hang:true,step:0,ts:NOW,cycle:[{k:"airdry",m:480}]}}});
  ok("↶ on a hung load = back to the washer, plain again (no hang, no cycle, no step)", b.get("laundryBackStage(laundryData.l1)")==="washer"&&(b.get("laundryBack('l1')"),b.L().l1.stage==="washer")&&b.L().l1.hang===undefined&&b.L().l1.cycle===undefined&&b.L().l1.step===undefined&&b.writes.some(w=>w[0]==="update"&&w[2].hang===null&&w[2].cycle===null), b.L().l1);
  const cy=[{k:"wash",m:50},{k:"dry",m:70}], d=mk({loads:{l1:{label:"Sheets",stage:"washer",step:0,ts:NOW,cycle:cy}}}); d.get("laundryAdvance('l1')"); d.get("laundrySplitWhereAnswer('hang')");
  ok("a cycle load hung: its cycle kept aside (was) …", d.L().l1.stage==="airdry"&&d.L().l1.was&&d.L().l1.was.cycle.length===2&&d.L().l1.was.step===0);
  d.get("laundryBack('l1')"); ok("… and ↶ puts it back on its wash step, cycle restored", d.L().l1.stage==="washer"&&d.L().l1.step===0&&d.L().l1.cycle.length===2&&d.L().l1.hang===undefined&&d.L().l1.was===undefined, d.L().l1);
}
console.log("6. W2 — hang some, the rest to the dryer: two halves of one load");
{ const c=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW-H(1),line:"towels",lineDay:"2026-10-22",by:"dad"}}});
  c.get("laundryAdvance('l1')"); c.get("laundrySplitWhereAnswer('split')");
  const A=c.L().l1, B=c.L().l1_h;
  ok("the dryer half keeps the id: 'Towels — dryer half', stage dryer, split {part:dryer, half:l1_h}", A&&A.label==="Towels — dryer half"&&A.stage==="dryer"&&A.split&&A.split.part==="dryer"&&A.split.half==="l1_h"&&A.ts>=NOW, A);
  ok("the hung half is laundry/l1_h: 'Towels — hanging', airdry, hang, one 8 h air-dry step, split {of:l1, part:hang}", B&&B.label==="Towels — hanging"&&B.stage==="airdry"&&B.hang===true&&B.cycle[0].k==="airdry"&&B.cycle[0].m===480&&B.split.of==="l1"&&B.split.part==="hang", B);
  ok("the hung half is the same line load, the same person's (line, lineDay, by copied)", B.line==="towels"&&B.lineDay==="2026-10-22"&&B.by==="dad");
  ok("writes: laundry/l1 update {label,split,stage,ts} + laundry/l1_h set — nothing else", c.writes.length===2&&c.writes[0][0]==="update"&&c.writes[0][1]==="laundry/l1"&&JSON.stringify(Object.keys(c.writes[0][2]).sort())==='["label","split","stage","ts"]'&&c.writes[1][0]==="set"&&c.writes[1][1]==="laundry/l1_h", c.writes);
  ok("the toast says both", /Towels — the dryer half is in the dryer, the rest is hanging/.test(c.toasts[0]));
  ok("My day reads them plainly: dryer half 'In the dryer', hanging half 'Hanging to dry'", c.get("laundryMeta(laundryData.l1)[1]")==="In the dryer"&&c.get("laundryMeta(laundryData.l1_h)").join(" ")==="🌬 Hanging to dry");
  ok("each half runs its own path: → Folded ✓ for the dryer half, Dry ✓ — take it down for the hung one; the dryer's clock vs 8 h", c.get("laundryAdvanceLabel('dryer',laundryData.l1)")==="Folded ✓"&&c.get("laundryAdvanceLabel('airdry',laundryData.l1_h)")==="Dry ✓ — take it down"&&c.get("laundryDoneAt(laundryData.l1)")===A.ts+M(60)&&c.get("laundryDoneAt(laundryData.l1_h)")===B.ts+H(8));
  ok("neither half can split again (a half back in the washer offers dryer / basket only)", c.get("laundrySplitCanSplit('l1',laundryData.l1)")===false&&c.get("laundrySplitCanSplit('l1_h',laundryData.l1_h)")===false);
  const cy=[{k:"wash",m:50},{k:"dry",m:70},{k:"custom",n:"Steam",m:10}], d=mk({loads:{l1:{label:"Sheets",stage:"washer",step:0,ts:NOW,cycle:cy}}}); d.get("laundryAdvance('l1')"); d.get("laundrySplitWhereAnswer('split')");
  ok("a cycle load split: the dryer half goes on with its own steps (dry, step 1, Steam next); the hung half has none of them", d.L().l1.stage==="dryer"&&d.L().l1.step===1&&d.L().l1.cycle.length===3&&d.L().l1_h.cycle.length===1&&d.L().l1_h.cycle[0].k==="airdry");
}
console.log("7. W2 — the line: done only when both halves are put away; the Fold un-tick brings both back");
{ const line={items:{towels:{label:"Towels",emoji:"🛁"}},log:{"2026-10-22":{towels:{at:NOW-H(2),load:"l1",by:"mom"}}}};
  const c=mk({line,loads:{l1:{label:"Towels — dryer half",stage:"dryer",ts:NOW-H(1),line:"towels",lineDay:"2026-10-22",split:{part:"dryer",half:"l1_h"}},l1_h:{label:"Towels — hanging",stage:"airdry",hang:true,step:0,ts:NOW-H(1),cycle:[{k:"airdry",m:480}],line:"towels",lineDay:"2026-10-22",split:{of:"l1",part:"hang"}}}});
  const st={laundry:"lineFold",line:"towels"};
  ok("Dad's card / the kid's card: both halves in one line — '🌀 dryer half in the dryer · 🌬 hanging to dry'", c.get("llLoadStage('towels','2026-10-22')")==="🌀 dryer half in the dryer · 🌬 hanging to dry");
  ok("the kid's Fold row: not done (both halves out)", c.get("llKidRowLineDone("+JSON.stringify(st)+")")===false);
  c.get("llPutAway('l1')");
  ok("the dryer half put away: laundry/l1 removed, its away note on the log (log/<day>/towels/away), the hung half still hanging", !c.L().l1&&c.L().l1_h&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/l1")&&line.log["2026-10-22"].towels.away&&line.log["2026-10-22"].towels.away.load.split.part==="dryer");
  ok("the line reads '✓ dryer half put away · 🌬 hanging to dry'; the Fold row is STILL not done", c.get("llLoadStage('towels','2026-10-22')")==="✓ dryer half put away · 🌬 hanging to dry"&&c.get("llKidRowLineDone("+JSON.stringify(st)+")")===false);
  c.get("llParentTick('towels','fold','mom')");
  ok("Mom's Fold tick now puts the HUNG half away: laundry/l1_h removed, its own note (log/<day>/towels/awayH)", !c.L().l1_h&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/l1_h")&&line.log["2026-10-22"].towels.awayH&&line.log["2026-10-22"].towels.awayH.load.label==="Towels — hanging"&&c.writes.some(w=>w[0]==="ll"&&w[1]["log/2026-10-22/towels/awayH"]));
  ok("now the load is done: the Fold row ticks, the line says ✓ put away", c.get("llKidRowLineDone("+JSON.stringify(st)+")")===true&&c.get("llLoadStage('towels','2026-10-22')")==="✓ put away");
  c.writes.length=0; c.get("llUnputawayLine('towels')");
  ok("the Fold un-tick brings BOTH halves back, to where they were (fold half in the dryer, hung half on the line), fresh clocks, both notes cleared", c.L().l1&&c.L().l1.stage==="dryer"&&c.L().l1_h&&c.L().l1_h.stage==="airdry"&&c.L().l1.ts>=NOW&&!line.log["2026-10-22"].towels.away&&!line.log["2026-10-22"].towels.awayH, c.L());
  ok("writes: laundry/l1 set, laundry/l1_h set, one line update clearing both notes; the kid's rows re-synced", c.writes.filter(w=>w[0]==="set").map(w=>w[1]).sort().join()==="laundry/l1,laundry/l1_h"&&c.writes.some(w=>w[0]==="ll"&&w[1]["log/2026-10-22/towels/away"]===null&&w[1]["log/2026-10-22/towels/awayH"]===null)&&c.synced>0);
  ok("the Fold row un-ticks again", c.get("llKidRowLineDone("+JSON.stringify(st)+")")===false);
  // an unsplit load keeps the old note and the old un-tick
  const line2={items:{towels:{label:"Towels"}},log:{"2026-10-22":{towels:{at:NOW-H(2),load:"l1",by:"mom"}}}}, u=mk({line:line2,loads:{l1:{label:"Towels",stage:"fold",ts:NOW,line:"towels",lineDay:"2026-10-22"}}});
  u.get("llPutAway('l1')"); ok("unsplit: put away → the old away note only, no awayH", line2.log["2026-10-22"].towels.away&&!line2.log["2026-10-22"].towels.awayH&&u.get("llKidRowLineDone("+JSON.stringify(st)+")")===true);
  u.get("llUnputawayLine('towels')"); ok("unsplit: the old un-tick brings it back as before", u.L().l1&&u.L().l1.stage==="fold"&&!line2.log["2026-10-22"].towels.away);
  const w=mk({line:line2,loads:{l1:{label:"Towels",stage:"wetbasket",ts:NOW,line:"towels",lineDay:"2026-10-22"}}});
  ok("the line reads a wet basket: 🧺 waiting for the dryer", w.get("llLoadStage('towels','2026-10-22')")==="🧺 waiting for the dryer");
}
console.log("8. W3 — the alert: typed on the line's ✎ (the builder), it rides the load, and shows when the load leaves the washer");
{ const line={items:{towels:{label:"Towels",emoji:"🛁",order:0}}}, c=mk({line,llEdId:"towels",vals:{"lle-label":"Towels","lle-emoji":"🛁","lle-with":"","lle-alert":"  pull the 3 shirts to air dry  "}});
  ok("the ✎ form has an ⚠️ Alert field", /id="lle-alert"/.test(c.get("llEdLoadHTML('towels')"))&&/⚠️ Alert/.test(c.get("llEdLoadHTML('towels')")));
  c.get("llEdSave('towels')");
  ok("Save: items/towels/alert = the text, trimmed — one targeted laundryLine write", line.items.towels.alert==="pull the 3 shirts to air dry"&&c.writes.some(w=>w[0]==="ll"&&w[1]["items/towels/alert"]==="pull the 3 shirts to air dry"), c.writes);
  c.vals["lle-alert"]=""; c.writes.length=0; c.get("llEdSave('towels')");
  ok("blank clears it (items/towels/alert null)", line.items.towels.alert===undefined&&c.writes.some(w=>w[0]==="ll"&&w[1]["items/towels/alert"]===null));
  line.items.towels.alert="check the stain on Lucy's dress";
  c.get("llStart('towels')");
  const lid=Object.keys(c.L())[0], l=c.L()[lid];
  ok("🫧 Start copies the alert onto the load (laundry/<id> set carries alert)", l&&l.stage==="washer"&&l.alert==="check the stain on Lucy's dress"&&c.writes.some(w=>w[0]==="set"&&w[1]==="laundry/"+lid&&w[2].alert==="check the stain on Lucy's dress"));
  c.writes.length=0; c.toasts.length=0;
  c.get("laundryAdvance('"+lid+"')"); c.get("laundrySplitWhereAnswer('dryer')");
  ok("→ Dryer: the alert pop-up first — the load is still in the washer, nothing written", c.alertId()===lid&&c.L()[lid].stage==="washer"&&c.writes.length===0);
  const h=c.pop();
  ok("'Towels — before it moves on' + Mom's words + ✓ Yes, done / Not yet", /Towels — before it moves on/.test(h)&&/check the stain on Lucy's dress/.test(h)&&/laundryAlertAnswer\(true\)[^>]*>✓ Yes, done</.test(h)&&/laundryAlertAnswer\(false\)[^>]*>Not yet</.test(h));
  c.get("laundryAlertAnswer(false)");
  ok("Not yet: the pop-up closes, the load stays in the washer, no write", c.alertId()===null&&c.pop()===""&&c.L()[lid].stage==="washer"&&c.writes.length===0);
  c.get("laundryAdvance('"+lid+"')"); c.get("laundrySplitWhereAnswer('dryer')"); c.get("laundryAlertAnswer(true)");
  ok("Yes, done: into the dryer — the old laundry/<id> set, the alert still on the record for ↶", c.L()[lid].stage==="dryer"&&c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][2].stage==="dryer"&&c.L()[lid].alert==="check the stain on Lucy's dress");
  ok("the pop-ups are gone", c.alertId()===null&&c.whereId()===null&&c.pop()==="");
  // washer → wet basket shows it too; the wet basket → dryer does not (already answered)
  const b=mk({loads:{l1:{label:"Darks",stage:"washer",ts:NOW,alert:"take out the red sock"}}});
  b.get("laundryAdvance('l1')"); b.get("laundrySplitWhereAnswer('wetbasket')");
  ok("washer → wet basket: the alert first, 'Not yet' holds it in the washer", b.alertId()==="l1"&&b.L().l1.stage==="washer"&&(b.get("laundryAlertAnswer(false)"),b.L().l1.stage==="washer"));
  b.get("laundryAdvance('l1')"); b.get("laundrySplitWhereAnswer('wetbasket')"); b.get("laundryAlertAnswer(true)");
  ok("Yes, done → the wet basket", b.L().l1.stage==="wetbasket");
  b.get("laundryAdvance('l1')"); b.get("laundrySplitWhereAnswer('dryer')");
  ok("out of the wet basket: no second alert, straight to the dryer", b.alertId()===null&&b.L().l1.stage==="dryer");
  const s=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW,alert:"pull the 3 shirts"}}}); s.get("laundryAdvance('l1')"); s.get("laundrySplitWhereAnswer('split')"); s.get("laundryAlertAnswer(true)");
  ok("a split after the alert: both halves made, the hung half carries no alert of its own", s.L().l1.stage==="dryer"&&s.L().l1_h&&s.L().l1_h.alert===undefined);
  const k=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW}}}); k.get("laundryAdvance('l1')"); k.get("laundrySplitWhereAnswer('dryer')");
  ok("no alert on the load: no pop-up, the move is immediate", k.alertId()===null&&k.L().l1.stage==="dryer");
}
console.log("9. W3 — a running load's ✎ (Mom only) sets the alert too: laundry/<id>/alert");
{ const c=mk({loads:{l1:{label:"Towels",stage:"washer",ts:NOW-H(1)}}}); c.get("laundryEditId='l1'");
  const h=c.get("laundryEditSheetHTML('l1')"); ok("the sheet has an ⚠️ Alert row", /⚠️ Alert/.test(h)&&/id="le-alert-l1"/.test(h));
  c.vals["le-alert-l1"]="check Lucy's dress"; c.vals["le-name-l1"]="Towels"; c.vals["le-stage-l1"]="washer"; c.vals["le-ts-l1"]=c.get("_leHM(laundryData.l1.ts)"); c.vals["le-by-l1"]="mom";
  const up=c.get("laundryEditSave('l1')");
  ok("Save: laundry/l1 update {alert} only", JSON.stringify(up)==='{"alert":"check Lucy\'s dress"}'&&c.L().l1.alert==="check Lucy's dress"&&c.writes.some(w=>w[0]==="update"&&w[1]==="laundry/l1"&&w[2].alert==="check Lucy's dress"), [up,c.writes]);
  c.get("laundryEditId='l1'"); c.vals["le-alert-l1"]=""; c.writes.length=0; const up2=c.get("laundryEditSave('l1')");
  ok("blank clears it (alert null, the field gone)", up2.alert===null&&c.L().l1.alert===undefined);
}
console.log("10. ✎ Times: the two settings, written to settings/laundry only when changed");
{ const c=mk({});
  const h=c.get("laundryTimesEditorHTML()");
  ok("two more rows: the wet basket's minutes (90) and the air-dry hours (8)", /id="laundry-t-wetbasket"[^>]*value="90"/.test(h)&&/id="laundry-t-airdry"[^>]*value="8"/.test(h)&&/A wet basket nudges me after/.test(h)&&/Hung laundry is dry after/.test(h));
  c.vals["laundry-t-wash"]="60"; c.vals["laundry-t-dry"]="60"; c.vals["laundry-t-grace"]="30"; c.vals["laundry-t-foldhrs"]="3"; c.vals["laundry-t-wetbasket"]="90"; c.vals["laundry-t-airdry"]="8";
  c.get("laundryTimesSave()");
  ok("unchanged → settings/laundryTimes as before, nothing under settings/laundry", c.writes.some(w=>w[1]==="settings/laundryTimes")&&!c.writes.some(w=>w[1]==="settings/laundry"));
  c.vals["laundry-t-wetbasket"]="45"; c.vals["laundry-t-airdry"]="12"; c.writes.length=0; c.get("laundryTimesSave()");
  ok("changed → one settings/laundry update {wetBasketMins:45, airDryHours:12}, read back at once", c.writes.some(w=>w[0]==="update"&&w[1]==="settings/laundry"&&w[2].wetBasketMins===45&&w[2].airDryHours===12)&&c.get("laundryWetBasketMins()")===45&&c.get("laundryAirDryHours()")===12);
  c.vals["laundry-t-airdry"]="99"; c.writes.length=0; c.get("laundryTimesSave()");
  ok("out of range (99 h) is ignored — kept at 12", c.get("laundryAirDryHours()")===12&&!c.writes.some(w=>w[1]==="settings/laundry"));
  const d=mk({}); d.get("_lbWrite=function(){ return false; }"); d.vals["laundry-t-wetbasket"]="20"; d.get("laundryTimesSave()");
  ok("?dryrun=1: the setting is read locally, nothing written", d.get("laundryWetBasketMins()")===20&&d.writes.length===0);
}
console.log("11. Nothing else moved: the dryer's question, the basket, the fold pile are untouched");
{ const c=mk({loads:{l1:{label:"L",stage:"dryer",ts:NOW-H(2)}}});
  c.get("laundryAdvance('l1')"); ok("out of the dryer: the BASKET question as before, not this block's", c.get("_lbkId")==="l1"&&c.whereId()===null&&/out of the dryer/.test(c.basketPop()));
  c.get("laundryBasketAnswer('basket')"); ok("Basket → stage basket", c.L().l1.stage==="basket");
  c.writes.length=0; c.get("laundryAdvance('l1')"); ok("Folded ✓ from the basket → the fold pile, one write", c.L().l1.stage==="fold"&&c.writes.length===1);
  c.get("laundryAdvance('l1')"); ok("✓ Put away → gone (laundry/l1 removed)", !c.L().l1&&c.writes.some(w=>w[0]==="rm"&&w[1]==="laundry/l1"));
  const b=mk({loads:{l1:{label:"💦 Sheets",stage:"bin",wet:true,ts:NOW}}}); b.get("laundryAdvance('l1')"); b.get("laundryAdvance('l1')");
  ok("💦 bin → prewash → washer as before; the question comes only now, out of the (second) wash", b.L().l1.stage==="washer"&&b.whereId()===null&&(b.get("laundryAdvance('l1')"),b.whereId()==="l1"));
}
console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
