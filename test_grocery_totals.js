/* 🛒 Totals match the view (her rule 2026-10-06). Sarah 10/5: the 🧾 bar on All read $8.58 — only her one store-tagged item counted.
 * run: node test_grocery_totals.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(){
  const writes=[];
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{getItem:()=>null,setItem:()=>{}}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", document:{getElementById:()=>null,createElement:()=>({}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext(`grData.stores={foodlion:{name:"Food Lion"},aldi:{name:"Aldi"}};
    grData.items={g1:{name:"Bacon",stores:["foodlion"],done:true},g2:{name:"Milk",done:true},g3:{name:"Eggs",done:true},g4:{name:"Saffron",done:true},g5:{name:"Rice",done:false}};
    grData.prices={bacon:{foodlion:{p1:{p:8,iso:"2026-10-05"}}},milk:{foodlion:{p2:{p:2.5,iso:"2026-10-05"}}},
      eggs:{foodlion:{p3:{p:4,iso:"2026-10-01"}},aldi:{p4:{p:3,iso:"2026-10-05"}}},rice:{aldi:{p5:{p:2,iso:"2026-10-05"}}}};`,ctx);
  return {run:e=>vm.runInContext(e,ctx),writes};
}
const T=mk();
console.log("── which store's price counts ──");
ok("a store chip → that store", T.run("grEstStore({name:'Eggs'},'foodlion')")==="foodlion");
ok("All, item tagged to one store → that store", T.run("grEstStore({name:'Bacon',stores:['foodlion']},'all')")==="foodlion");
ok("All, untagged → the store it was last priced at (Eggs: Aldi 10/5 beats Food Lion 10/1)", T.run("grEstStore({name:'Eggs'},'all')")==="aldi");
ok("All, never priced anywhere → none", T.run("grEstStore({name:'Saffron'},'all')")===null);
ok("a price at a store she no longer has doesn't count", (T.run("grData.prices.saffron={costco:{p9:{p:9,iso:'2026-10-06'}}}"), T.run("grEstStore({name:'Saffron'},'all')"))===null);
console.log("── the 🧾 bar and the header match the view ──");
const all=T.run("grCartTotal('all')");
ok("All: every cart item with a price anywhere counts (8 + 2.5 + 3 = 13.50), Saffron 'no price'", all.total===13.5&&all.nMiss===1, all);
const fl=T.run("grCartTotal('foodlion')");
ok("Food Lion chip: only Food Lion prices (8 + 2.5 + 4 = 14.50)", fl.total===14.5&&fl.nMiss===1, fl);
const al=T.run("grCartTotal('aldi')");
ok("Aldi chip: only Aldi prices (Eggs 3), the rest 'no price'", al.total===3, al);
ok("whole-list estimate on All exists and adds the not-yet-in-cart Rice (13.50 + 2)", T.run("grTripEst('all',false)").t===15.5, T.run("grTripEst('all',false)"));
ok("the header shows an estimate on All", /about \$15\.50/.test(T.run("grTripHeadHTML('all')")), T.run("grTripHeadHTML('all')"));
ok("the bar on All shows 'whole list ≈'", /whole list ≈ \$15\.50/.test(T.run("grStoreTotalBarHTML('all')")));
console.log("── store mode on All: the price box ──");
ok("an untagged item gets a price box (placeholder = its estimate store's usual), not 'pick a store'", /placeholder="\$3\.00"/.test(T.run("grPaidBoxHTML({id:'g3',name:'Eggs'})")), T.run("grPaidBoxHTML({id:'g3',name:'Eggs'})").slice(0,140));
ok("…an item never priced anywhere still says pick a store", /pick a store up top/.test(T.run("grPaidBoxHTML({id:'g4',name:'Saffron'})")));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
