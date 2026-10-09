/* 💲 Per-unit prices (her ask 2026-10-06: 3 lb apples at $1.35 should ask per lb, then × 3 — for all the types).  run: node test_grocery_perunit.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(){
  const writes=[], pop={innerHTML:""};
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{getItem:()=>null,setItem:()=>{}}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", panAdd:()=>"p1", kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{}; if(ctx.grPutDraw) ctx.grPutDraw=()=>{};
  vm.runInContext(`grData.stores={walmart:{name:"Walmart"}}; grStore="walmart";
    grData.items={ap:{name:"Apples",qty:3,unit:"lb",stores:["walmart"],sec:"produce"},bg:{name:"Chips",qty:2,unit:"bag",stores:["walmart"],sec:"snacks"},
      cn:{name:"Black beans",qty:6,stores:["walmart"],sec:"pantry"},tm:{name:"Tomatoes",qty:0.5,unit:"lb",stores:["walmart"],sec:"produce"},
      mk:{name:"Milk",qty:1,unit:"gallon",stores:["walmart"],sec:"dairy"},br:{name:"Bread",stores:["walmart"],sec:"bakery"}};`,ctx);
  return {run:e=>vm.runInContext(e,ctx),pop,writes,data:()=>vm.runInContext("grData",ctx)};
}
console.log("── her apples: 3 lb, $1.35 ──");
{ const T=mk(); T.run("grPaidSet('i','ap','1.35')");
  ok("typing $1.35 for 3 lb asks: per lb, or for all 3 lb?", /Apples · 3 lb/.test(T.pop.innerHTML)&&/Is \$1\.35 per lb, or for all 3 lb\?/.test(T.pop.innerHTML)&&/\$1\.35 per lb → \$4\.05 total/.test(T.pop.innerHTML)&&/\$1\.35 for all 3 lb/.test(T.pop.innerHTML));
  T.run("grPerSet('ap','unit')");
  ok("typing the price left it off the cart (GR_PRICE_STAYS)", !T.run("grData.items.ap.done"));
  T.run("grToggle('ap')");   // her tap on the circle
  ok("per lb → the cart counts $4.05", T.run("grCartTotal('walmart')").typed===4.05, T.run("grCartTotal('walmart')"));
  ok("the row shows the math", /\$1\.35 per lb × 3 = <b>\$4\.05<\/b>/.test(T.run("grPaidMathHTML({id:'ap'})")));
  ok("the answer is saved on the item and remembered for 'Apples'", T.writes.some(w=>w[1]==="kitchen/grocery/items/ap/paidPer"&&w[2]==="unit")&&T.run("grMem('Apples').per")==="unit");
  T.run("grPerFlip('ap')"); ok("a tap on the line flips it: $1.35 for all 3 lb", T.run("grCartTotal('walmart')").typed===1.35&&/<b>\$1\.35<\/b> for all 3 lb/.test(T.run("grPaidMathHTML({id:'ap'})")));
  T.run("grPerFlip('ap')");
  ok("the receipt check compares her LINE total ($4.05), not $1.35", T.run("grRcptTyped({id:'ap'})")===4.05);
  T.run("grCheckoutOpen('walmart'); grCheckoutGo()");
  const h=T.run("grPriceHist('Apples','walmart')");
  ok("checkout saves the per-lb price with per:'lb'", h.length===1&&h[0].p===1.35&&h[0].per==="lb", h);
  T.run("grData.items.ap2={name:'Apples',qty:2,unit:'lb',stores:['walmart'],sec:'produce'}");
  ok("next week's estimate for 2 lb = $1.35 × 2", T.run("grRowPrice({id:'ap2',name:'Apples'},'walmart')")===2.7, T.run("grRowPrice({id:'ap2',name:'Apples'},'walmart')"));
  T.pop.innerHTML=""; T.run("grPaidSet('i','ap2','1.40')");
  ok("typing a price for Apples again: no question — her answer is remembered", T.pop.innerHTML===""&&T.run("grData.items.ap2.paidPer")==="unit"&&T.run("grPerTotal(grData.items.ap2)")===2.8);
}
console.log("── all the types ──");
{ const T=mk();
  T.run("grPaidSet('i','bg','3.50')"); ok("2 bags → 'per bag, or for all 2 bag?'", /Is \$3\.50 per bag, or for all 2 bag\?/.test(T.pop.innerHTML));
  T.run("grPerSet('bg','all')"); ok("…for all → $3.50 total; checkout would save $1.75 per bag", T.run("grPerTotal(grData.items.bg)")===3.5&&T.run("grPaidMult({id:'bg'})")===1);
  T.pop.innerHTML=""; T.run("grPaidSet('i','cn','0.89')"); ok("6 with no unit → 'each, or for all 6?'", /Is \$0\.89 each, or for all 6\?/.test(T.pop.innerHTML));
  T.run("grPerSet('cn','unit')"); ok("…each → $5.34", T.run("grPerTotal(grData.items.cn)")===5.34);
  T.pop.innerHTML=""; T.run("grPaidSet('i','tm','2.99')"); ok("half a pound asks too (per lb → $1.50)", /per lb/.test(T.pop.innerHTML)&&(T.run("grPerSet('tm','unit')"),T.run("grPerTotal(grData.items.tm)"))===1.5);
  T.pop.innerHTML=""; T.run("grPaidSet('i','mk','3.29')"); ok("exactly 1 gallon → no question", T.pop.innerHTML===""&&T.run("grPerTotal(grData.items.mk)")===3.29);
  T.pop.innerHTML=""; T.run("grPaidSet('i','br','2.50')"); ok("no amount at all → no question", T.pop.innerHTML==="");
  ok("unit words: lbs→lb, ounces→oz, gallons→gallon, pk→pack, doz→dozen, ct→each, loaves→loaf, tubs→tub, tubes→tube", ["lbs","ounces","gallons","pk","doz","ct","loaves","tubs","tubes"].map(u=>T.run("grUnitWord('"+u+"')")).join(",")==="lb,oz,gallon,pack,dozen,each,loaf,tub,tube");
}
{ const T=mk(); T.run("grData.items.ap.paid=1.35"); ok("an item priced before this (her apples now) shows 'per lb or for all 3 lb? Tap to say' on the row", /\$1\.35 — per lb or for all 3 lb\? Tap to say/.test(T.run("grPaidMathHTML({id:'ap'})"))); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
