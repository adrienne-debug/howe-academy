/* 📥 Never-sorted items count as To sort once she has stores · "Any store" is a remembered choice · 🏃 store mode asks which store
 * (her yeses 2026-10-06).  run: node test_grocery_sortstore.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(stores){
  const writes=[], pop={innerHTML:""}, ls={};
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", panAdd:()=>"p1", kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext("grData.stores="+JSON.stringify(stores===undefined?{foodlion:{name:"Food Lion"},aldi:{name:"Aldi"}}:stores)+";"
    +"grData.items={g1:{name:'Corn',sec:'produce'},g2:{name:'Bacon',sec:'meat',stores:['foodlion']},g3:{name:'Paper towels',sec:'household',any:true},g4:{name:'Oreos',sec:'snacks',sort:true}};",ctx);
  return {run:e=>vm.runInContext(e,ctx),data:()=>vm.runInContext("grData",ctx),pop,writes};
}
console.log("── 📥 never sorted = To sort (once there are stores) ──");
{ const T=mk();
  const ids=T.run("grSortIds()");
  ok("Corn (no store, never chose Any store) is To sort", ids.indexOf("g1")>=0);
  ok("Oreos (flagged) is To sort; Bacon (Food Lion) and Paper towels (chose Any store) are not", ids.indexOf("g4")>=0&&ids.indexOf("g2")<0&&ids.indexOf("g3")<0);
  const g=T.run("grGroups('all')"), row=[].concat(...Object.values(g)).find(r=>r.id==="g1");
  ok("its row is tagged 📥 to sort on All", row&&row.sort===true&&/📥 to sort/.test(T.run("grRowHTML("+JSON.stringify(row)+",true)")));
  const N=mk({}); ok("no stores set up yet → nothing is To sort", N.run("grSortIds()").length===1&&N.run("grSortIds()")[0]==="g4");
}
console.log("── 👍 Any store is remembered ──");
{ const T=mk(); T.run("grSortTo('g1','any')"); const d=T.data();
  ok("picking Any store: untagged, not to-sort, remembered on the item and as its home", !d.items.g1.stores&&!d.items.g1.sort&&d.items.g1.any===true&&d.home.corn==="any"&&T.run("grSortIds()").indexOf("g1")<0);
  T.run("grSortTo('g1','aldi')"); ok("then a store: tagged, the Any-store mark cleared", JSON.stringify(T.data().items.g1.stores)==='["aldi"]'&&!T.data().items.g1.any);
  T.run("grSortTo('g1','any'); delete grData.items.g1; grCreate({name:'Corn'},{k:'mom'},null)");
  const nid=Object.keys(T.data().items).find(k=>T.data().items[k].name==="Corn");
  ok("next time Corn is added it lands as Any store (not To sort)", T.data().items[nid].any===true&&!T.data().items[nid].sort);
  T.run("grMoveCheaper('g3','aldi')"); ok("'less at Aldi · move' clears the Any-store mark", !T.data().items.g3.any&&JSON.stringify(T.data().items.g3.stores)==='["aldi"]');
}
{ const T=mk(); T.run("grQmTo('i','g3','sort')"); ok("the move sheet's To sort clears an Any-store choice", T.data().items.g3.sort===true&&!T.data().items.g3.any); }
{ const T=mk(); T.run("grQmTo('i','g1','any')"); ok("the move sheet's Any store remembers it", T.data().items.g1.any===true&&T.data().home.corn==="any"); }
console.log("── 🏃 which store are you at? ──");
{ const T=mk(); T.run("grStore='all'; grBig=false; grBigToggle()");
  ok("from All: store mode asks which store first (still off)", T.run("grBig")===false&&/Which store are you at\?/.test(T.pop.innerHTML)&&/Food Lion/.test(T.pop.innerHTML)&&/Aldi/.test(T.pop.innerHTML)&&/More than one store/.test(T.pop.innerHTML));
  T.run("grBigStart('foodlion')"); ok("picking Food Lion: store mode on, at Food Lion", T.run("grBig")===true&&T.run("grStore")==="foodlion");
}
{ const T=mk(); T.run("grStore='all'; grBig=false; grBigToggle(); grBigStart('all')"); ok("'More than one store' → store mode on the whole list", T.run("grBig")===true&&T.run("grStore")==="all"); }
{ const T=mk(); T.run("grStore='aldi'; grBig=false; grBigToggle()"); ok("already on a store chip → straight into store mode, no question", T.run("grBig")===true&&T.pop.innerHTML===""); }
{ const T=mk({foodlion:{name:"Food Lion"}}); T.run("grStore='all'; grBig=false; grBigToggle()"); ok("only one store → straight in at that store", T.run("grBig")===true&&T.run("grStore")==="foodlion"); }
{ const T=mk({}); T.run("grStore='all'; grBig=false; grBigToggle()"); ok("no stores at all → straight in on All", T.run("grBig")===true); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
