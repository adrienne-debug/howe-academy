/*
 * 🧺 BASKET (her ask 2026-10-21: "there should also be a step that is after dryer that says basket … a choice of will you fold or will this be
 * in basket needs to be asked so it can hopefully be bypassed … and then also be able to edit the to basket as well"). The dryer's forward tap
 * asks "Fold now, or into the basket?"; Basket = a side stage with a fresh clock; from it the button is Folded ✓; ↶ = back to the dryer; the
 * nudge treats it like the fold pile; ✎ Times can set it; a kid's Folded takes a basket load.   run: node test_laundry_basket.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const CONSTS=src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_WET_STAGES")))+"\n"+cut("const LAUNDRY_EDIT_STAGES",";")+";\n"+cut("const LAUNDRY_KIDMOVE_FROM",";")+";\n";
const CYCLE=cut("// LAUNDRY_CYCLE_START","// LAUNDRY_CYCLE_END"), BASKET=cut("// BASKET_START","// BASKET_END");
const H=h=>h*3600000;
function mk(o){
  o=o||{}; const writes=[], toasts=[], ls={}, dom={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,
    laundryData:JSON.parse(JSON.stringify(o.loads||{})), laundryTimes:{wash:60,dry:60,grace:30,foldHrs:3}, momBlocks:{},
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, _lbWrite:()=>true, momHere:()=>true,
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    esc:s=>String(s==null?"":s), mwToast:t=>toasts.push(t), tab:"moms-plan", renderMomsPlan:()=>{}, renderAll:()=>{}, _cuRe:()=>{}, _cuDropBlock:()=>null, momBlockKey:(id,s)=>id+"_"+s,
    laundrySince:()=>"4:10 PM", lcDefMins:k=>k==="dry"?60:45,
    document:{getElementById:id=>dom[id]||null,body:{appendChild:w=>{ dom[w.id]=w; }},createElement:()=>({id:"",innerHTML:""})},
    writes, toasts, dom};
  vm.createContext(ctx);
  vm.runInContext(CONSTS+"\n"+CYCLE+"\n"+BASKET+"\n"+["laundryAdvance","laundryAdvanceLabel","laundryBackStage","laundryBack","_cuCycleMin","_cuMomOk","_cuStageName","laundryNudgeKind","laundryNudgeRowHTML","laundryT","laundryFoldHrs","laundryKidMovePick","laundryBlockStep","laundryMeta"].map(fn).join("\n"),ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.ask=()=>ctx.get("_lbkId"); ctx.askHTML=()=>(ctx.dom["lbk-wrap"]||{}).innerHTML||""; return ctx;
}
const NOW=Date.now();

console.log("1. A plain load leaves the dryer: the question first");
{ const c=mk({loads:{l1:{label:"Lucy's clothes",stage:"dryer",ts:NOW-H(1.5)}}});
  c.get("laundryAdvance('l1')");
  ok("tapping the dryer's button asks — the load stays in the dryer, nothing written", c.ask()==="l1"&&c.get("laundryData.l1.stage")==="dryer"&&c.writes.length===0, [c.ask(),c.writes]);
  const h=c.askHTML(); ok("the question: '<load> — out of the dryer · Fold now, or into the basket?' with 👕 Fold now · 🧺 Basket · Not yet", /Lucy's clothes — out of the dryer/.test(h)&&/Fold now, or into the basket\?/.test(h)&&/laundryBasketAnswer\('fold'\)/.test(h)&&/laundryBasketAnswer\('basket'\)/.test(h)&&/>Not yet</.test(h));
  c.get("laundryBasketAnswer()"); ok("Not yet: the question closes, the load is still in the dryer", c.ask()===null&&c.askHTML()===""&&c.get("laundryData.l1.stage")==="dryer");
  c.get("laundryAdvance('l1')"); c.get("laundryBasketAnswer('fold')");
  ok("Fold now = the old path: the fold pile, one laundry/l1 write", c.get("laundryData.l1.stage")==="fold"&&c.writes.length===1&&c.writes[0][1]==="laundry/l1"&&c.writes[0][2].stage==="fold");
}
console.log("2. Into the basket, and out again");
{ const c=mk({loads:{l1:{label:"Lucy's clothes",stage:"dryer",ts:NOW-H(1.5)}}});
  c.get("laundryAdvance('l1')"); c.get("laundryBasketAnswer('basket')");
  ok("Basket: stage basket, fresh clock, written under laundry/l1", c.get("laundryData.l1.stage")==="basket"&&c.get("laundryData.l1.ts")>=NOW&&c.writes[0][2].stage==="basket");
  ok("its words: 🧺 In the basket; its button: Folded ✓", c.get("_cuStageName('basket')")==="🧺 In the basket"&&c.get("laundryAdvanceLabel('basket',laundryData.l1)")==="Folded ✓");
  c.writes.length=0; c.get("laundryAdvance('l1')");
  ok("Folded ✓ from the basket goes straight to the fold pile — no second question", c.ask()===null&&c.get("laundryData.l1.stage")==="fold"&&c.writes.length===1);
  const b=mk({loads:{l1:{label:"L",stage:"basket",ts:NOW}}});
  ok("↶ from the basket = back to the dryer", b.get("laundryBackStage(laundryData.l1)")==="dryer"&&(b.get("laundryBack('l1')"),b.get("laundryData.l1.stage")==="dryer")&&b.writes.some(w=>w[0]==="update"&&w[2].stage==="dryer"));
}
console.log("3. The NOW nudge: a basket is clean clothes sitting, not a sour washer");
{ const c=mk({loads:{l1:{label:"L",stage:"basket",ts:NOW-H(2)}}});
  ok("2 h in the basket (fold hours 3): quiet", c.get("laundryNudgeKind(laundryData.l1)")==="");
  c.get("laundryData.l1.ts="+(NOW-H(4))); ok("4 h: a 'basket' nudge — '… has been in the basket since … — fold it', never 'sours'", c.get("laundryNudgeKind(laundryData.l1)")==="basket"&&/in the basket since 4:10 PM — fold it/.test(c.get("laundryNudgeRowHTML({l:laundryData.l1,kind:'basket'})"))&&!/sours/.test(c.get("laundryNudgeRowHTML({l:laundryData.l1,kind:'basket'})")));
}
console.log("4. A custom-cycle load (wash → dry) does the same");
{ const c=mk({loads:{l1:{label:"Towels",stage:"dryer",step:1,ts:NOW-H(1),cycle:[{k:"wash"},{k:"dry"}]}}});
  c.get("laundryAdvance('l1')"); ok("its last step done → the question", c.ask()==="l1"&&c.get("laundryData.l1.stage")==="dryer");
  c.get("laundryBasketAnswer('basket')"); ok("Basket: stage basket, step past the last", c.get("laundryData.l1.stage")==="basket"&&c.get("laundryData.l1.step")===2);
  ok("its button: Folded ✓ (no cycle step to name)", c.get("laundryAdvanceLabel('basket',laundryData.l1)")==="Folded ✓");
  c.get("laundryBack('l1')"); ok("↶: back on its dry step (dryer, step 1)", c.get("laundryData.l1.stage")==="dryer"&&c.get("laundryData.l1.step")===1, c.get("laundryData.l1"));
  c.get("laundryAdvance('l1')"); c.get("laundryBasketAnswer('fold')"); ok("Fold now from the cycle: the fold pile", c.get("laundryData.l1.stage")==="fold");
}
console.log("5. Kids, the editor, the cards");
{ const c=mk({loads:{a:{label:"A",stage:"basket",ts:NOW-H(1)},b:{label:"B",stage:"washer",ts:NOW}}});
  ok("a kid's 'Folded' move takes the basket load", c.get("laundryKidMovePick('fold')")==="a");
  ok("✎ Times offers the basket between dryer and fold", JSON.stringify(c.get("LAUNDRY_EDIT_STAGES"))==='["bin","prewash","washer","dryer","basket","fold"]');
  ok("the basket's schedule block is the folding", c.get("laundryBlockStep('basket')")==="fold");
  ok("Machines now: the trail shows 🧺 basket as the current chip between the dryer and folded", /\(l\.stage==="basket"\?STG\.slice\(0,STG\.indexOf\("fold"\)\)\.concat\(\["basket","fold"\]\):STG\)/.test(fn("mdCardLaundry")));
  ok("the laundry tab's machines list, Dad's schedule and Mom's schedule all know the stage", /l\.stage==="basket"\); \}\);/.test(fn("hhLaundryHTML"))&&/l\.stage==="fold"\|\|l\.stage==="basket"\)\{ place/.test(fn("dadSchedLaundry"))&&/fold=l\.stage==="fold"\|\|l\.stage==="basket"/.test(fn("momSchedLaundry"))&&/is in the basket/.test(fn("momSchedLaundry")));
  ok("the line's words for a kid's load in the basket", /l\.stage==="basket"\?"🧺 in the basket"/.test(fn("llLoadStage"))&&/l\.stage==="basket"\?"🧺 in the basket"/.test(fn("llAwayStageWords")));
  ok("marked block; its only writes go through laundryAdvance", src.indexOf("// BASKET_START")>0&&src.indexOf("// BASKET_END")>src.indexOf("// BASKET_START")&&!/db\.ref/.test(BASKET));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
