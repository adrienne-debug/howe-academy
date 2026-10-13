/* 🛒 GR_NEARDUP — "some things were doubles and the checklist should recognize and combine or ask to combine" (her words 2026-10-13).
   "Rice" vs "White rice" / "GF rotini" vs "Pasta gluten free rotini" → the app ASKS (Same → combine · Keep both · No need); never merges on its own.
   run: node test_grocery_neardup.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
ok("block present once", src.indexOf("// GR_NEARDUP_START")>0&&src.indexOf("// GR_NEARDUP_END")>src.indexOf("// GR_NEARDUP_START")&&src.indexOf("// GR_NEARDUP_START",src.indexOf("// GR_NEARDUP_START")+5)<0);
function mk(){
  const pop={innerHTML:""}, toasts=[], writes=[];
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:p=>({set(v){writes.push(["set",p,v]);},update(v){writes.push(["update",p,v]);},remove(){writes.push(["remove",p]);}})}, HA_LS:{getItem:()=>null,setItem(){}}, mwToast:m=>toasts.push(m), esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-13", kitCapKey:()=>"k", panAdd:()=>"p1", kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{}, ROSTER_DEF:[{id:"lincoln",name:"Lincoln"}],
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext(`grData.stores={walmart:{name:"Walmart"}};
    grData.items={wr:{name:"White rice",qty:1,unit:"bag",stores:["walmart"],src:[{k:"meal",lbl:"Curry"}]},
      pr:{name:"Pasta gluten free rotini",qty:2,unit:"box",stores:["walmart"],src:[{k:"mom"}],done:true,doneTs:5},
      ch:{name:"Chicken thighs",qty:5,unit:"lb",stores:["walmart"],src:[{k:"mom"}]}};`,ctx);
  return {run:e=>vm.runInContext(e,ctx),pop,toasts,writes,items:()=>vm.runInContext("grData.items",ctx),names:()=>vm.runInContext("Object.keys(grData.items).map(k=>grData.items[k].name).sort()",ctx)};
}
console.log("── finding the near ones ──");
{ const T=mk();
  ok("Rice → White rice", T.run("(grNearDup('Rice')||{}).id")==="wr");
  ok("GF rotini → Pasta gluten free rotini (gluten free = GF)", T.run("(grNearDup('GF rotini')||{}).id")==="pr");
  ok("Gluten-free rotini pasta → the same row", T.run("(grNearDup('Gluten-free rotini pasta')||{}).id")==="pr");
  ok("Thighs → Chicken thighs (plurals ignored)", T.run("(grNearDup('thigh')||{}).id")==="ch");
  ok("an exact name is not a near one (grFindDup's job)", T.run("grNearDup('White rice')")===null);
  ok("Brown sugar matches nothing", T.run("grNearDup('Brown sugar')")===null);
  ok("Chicken broth is not Chicken thighs (broth isn't in it)", T.run("grNearDup('Chicken broth')")===null); }
console.log("── typing: it asks, never merges on its own ──");
{ const T=mk(); const r=T.run("grAdd('2 bag rice','mom')");
  ok("grAdd returns ask and nothing is written yet", r==="ask"&&T.writes.length===0&&T.names().length===3, [r,T.writes.length]);
  const h=T.pop.innerHTML;
  ok("the pop-up names both and asks Same thing?", /<b>Rice<\/b> · 2 bag looks like <b>White rice<\/b>, already on the list · <b>1 bag<\/b> · Walmart/.test(h)&&/Same thing\?/.test(h)&&/Same — combine/.test(h)&&/Keep both/.test(h)&&/No need/.test(h), h);
  T.run("grNearSame()");
  const it=T.items().wr;
  ok("Same → the amount is added to White rice (2 + 1 bag → 3 bag), source kept + mom added", it.qty===3&&it.unit==="bag"&&it.src.length===2&&it.src[1].k==="mom"&&T.names().length===3, it);
  ok("…written to the one row only", T.writes.length===1&&T.writes[0][1]==="kitchen/grocery/items/wr", T.writes);
  ok("pop-up closed", T.pop.innerHTML===""&&T.run("_grNearPend")===null); }
{ const T=mk(); T.run("grAdd('rice','mom')"); T.run("grNearBoth()");
  ok("Keep both → a new Rice row beside White rice", T.names().join("|")==="Chicken thighs|Pasta gluten free rotini|Rice|White rice"&&T.items().wr.qty===1, T.names()); }
{ const T=mk(); T.run("grAdd('rice','mom')"); T.run("grNearSkip()");
  ok("No need → nothing added, nothing changed", T.names().length===3&&T.writes.length===0&&T.pop.innerHTML===""); }
{ const T=mk(); T.run("grAdd('1 box GF rotini','dad')"); T.run("grNearSame()"); const it=T.items().pr;
  ok("combining into a row already in the cart unticks it (asked for more)", it.done===undefined&&it.doneTs===undefined&&it.qty===3, it); }
{ const T=mk(); const r=T.run("grAdd('rice','lincoln')");
  ok("a kid's request is untouched (goes to Mom as before, no near pop-up)", r==="req"&&T.pop.innerHTML===""&&Object.keys(T.run("grData.requests")).length===1, r); }
console.log("── meal import: the near ones wait, one question each ──");
{ const T=mk();
  T.run(`_grImp={rows:[{on:true,p:{name:"Rice",qty:1,unit:"bag"},meals:["Curry"]},{on:true,p:{name:"GF rotini",qty:1,unit:"box"},meals:["Pasta night"]},{on:true,p:{name:"Onions",qty:3},meals:["Curry"]},{on:true,p:{name:"White rice",qty:1,unit:"bag"},meals:["Stir fry"]}]}; grImpAdd()`);
  ok("plain rows added, exact ones merged, near ones held back", T.names().join("|")==="Chicken thighs|Onions|Pasta gluten free rotini|White rice"&&T.items().wr.qty===2, T.names());
  ok("toast counts them", /1 added · 1 already on the list, amounts added · 2 to look at/.test(T.toasts[T.toasts.length-2]||T.toasts.join("|")), T.toasts);
  ok("first question is Rice vs White rice, with 1 more waiting", /<b>Rice<\/b>.*<b>White rice<\/b>/.test(T.pop.innerHTML)&&/1 more to look at/.test(T.pop.innerHTML), T.pop.innerHTML);
  T.run("grNearSame()");
  ok("then GF rotini vs Pasta gluten free rotini", /<b>GF rotini<\/b>.*<b>Pasta gluten free rotini<\/b>/.test(T.pop.innerHTML)&&!/more to look at/.test(T.pop.innerHTML), T.pop.innerHTML);
  T.run("grNearBoth()");
  ok("done: Rice folded into White rice (3), GF rotini kept as its own row, pop-up closed", T.items().wr.qty===3&&T.names().indexOf("GF rotini")>=0&&T.pop.innerHTML===""&&T.run("_grNearQ.length")===0, T.names()); }
console.log("── photo import ──");
{ const T=mk();
  T.run(`_grPl={rows:[{on:true,p:{name:"Rice",qty:1},sid:"walmart"},{on:true,p:{name:"Bananas",qty:6}}]}; grPlAdd()`);
  ok("Bananas added, Rice waits for her answer", T.names().indexOf("Bananas")>=0&&T.names().indexOf("Rice")<0&&/<b>Rice<\/b>/.test(T.pop.innerHTML), T.names());
  T.run("grNearBoth()");
  ok("Keep both from a photo keeps the store she was on", T.run("Object.keys(grData.items).filter(k=>grData.items[k].name==='Rice').map(k=>grData.items[k].stores)")[0][0]==="walmart"); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
