/* 💲 GR_PRICE_STAYS (her ask 2026-10-07): typing a price in 🏃 store mode never moves the row — "when I clicked to next thing it
   disappeared" (Apples 3 lb, $1.25 went into the folded cart). Only the circle puts it in the cart.  run: node test_grocery_price_stays.js */
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
    kitOrderList:()=>({need:[{id:"s1",name:"Maple syrup",state:"out"}],usuals:{}}), _todayStr:()=>"2026-10-07", panAdd:()=>"p1", kitStaples:{s1:{name:"Maple syrup",state:"out"}}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{}; if(ctx.grPutDraw) ctx.grPutDraw=()=>{};
  vm.runInContext(`grData.stores={walmart:{name:"Walmart"}}; grStore="walmart"; grBig=true; grData.home.maplesyrup=["walmart"];
    grData.items={ap:{name:"Apples",qty:3,unit:"lb",stores:["walmart"],sec:"produce"},mk:{name:"Milk",qty:1,unit:"gallon",stores:["walmart"],sec:"dairy"}};`,ctx);
  return {run:e=>vm.runInContext(e,ctx),pop,writes};
}
const toGet=(T,nm)=>{ const g=T.run("grGroups('walmart')"); let r=null; Object.keys(g).forEach(k=>g[k].forEach(x=>{ if(x.name===nm) r=x; })); return r; };
{ const T=mk();
  T.run("grPaidSet('i','mk','3.29')");
  const r=toGet(T,"Milk");
  ok("her test: typed a price → the row is still on the to-get list (not done)", r&&!r.done&&!T.run("grData.items.mk.done"));
  ok("… the price is kept and the box shows it green", T.run("grData.items.mk.paid")===3.29&&/value="3\.29"/.test(T.run("grPaidBoxHTML({id:'mk',name:'Milk',stores:['walmart']})"))&&/#16a34a/.test(T.run("grPaidBoxHTML({id:'mk',name:'Milk',stores:['walmart']})")));
  ok("… one write, paid only — done/doneTs never touched", T.writes.length===1&&T.writes[0][0]==="update"&&T.writes[0][1]==="kitchen/grocery/items/mk"&&!("done" in T.writes[0][2])&&!("doneTs" in T.writes[0][2]));
  ok("… not counted in the cart total until it's in the cart", T.run("grCartTotal('walmart')").n===0);
  T.run("grToggle('mk')");
  ok("tapping the circle puts it in the cart, with its typed price", T.run("grData.items.mk.done")===true&&T.run("grCartTotal('walmart')").typed===3.29);
  T.run("grPaidSet('i','mk','3.49')");
  ok("changing the price of something already in the cart leaves it in the cart", T.run("grData.items.mk.done")===true&&T.run("grData.items.mk.paid")===3.49);
  T.run("grPaidSet('i','mk','')");
  ok("clearing the price leaves it in the cart too", T.run("grData.items.mk.done")===true&&!T.run("grData.items.mk.paid"));
}
{ const T=mk();
  T.run("grPaidSet('v','st_s1','8.99')");
  ok("staple/usual row: price saved, row NOT checked off", T.run("grData.vpaid.st_s1")===8.99&&!T.run("grData.vchk.st_s1")&&!T.writes.some(w=>w[1]==="kitchen/grocery/vchk/st_s1"));
  const r=toGet(T,"Maple syrup"); ok("… still on the to-get list", r&&!r.done);
}
{ const T=mk();   // her apples: 3 lb — the per-lb question still comes up, the row still stays
  T.run("grPaidSet('i','ap','1.25')");
  ok("3 lb apples: still asks per lb or for all (GR_PERUNIT) and stays off the cart", /per lb, or for all 3 lb\?/.test(T.pop.innerHTML)&&!T.run("grData.items.ap.done"));
  T.run("grPerSet('ap','unit')"); T.run("grToggle('ap')");
  ok("… per lb, then circle → cart counts $3.75", T.run("grCartTotal('walmart')").typed===3.75, T.run("grCartTotal('walmart')"));
}
ok("block marker present", src.indexOf("GR_PRICE_STAYS")>0);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
