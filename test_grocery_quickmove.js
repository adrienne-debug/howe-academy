/* 🛒 Row taps (her ask 2026-10-06): only the circle checks off; the rest of the row opens a quick move-to-store sheet.
 * run: node test_grocery_quickmove.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
if(a<0||b<0){ console.error("grocery markers missing"); process.exit(1); }
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(o){
  o=o||{}; const writes=[], toasts=[], pop={innerHTML:""};
  const ref=p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,
    db:{ref}, HA_LS:{getItem:()=>null,setItem:()=>{}}, mwToast:m=>toasts.push(m), esc:s=>String(s==null?"":s),
    momHere:()=>o.mom!==false, dadAwardOk:()=>false, kitPinGate:()=>{}, tab:"moms-plan", renderAll:()=>{},
    kitOrderList:()=>({need:[{id:"s1",name:"Almond milk",state:"out"}],usuals:{}}), _todayStr:()=>"2026-10-06",
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx);
  vm.runInContext(fn("kitSlug"),ctx);
  vm.runInContext(src.slice(a,b),ctx);
  ctx.grRepaint=()=>{}; ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>"";
  vm.runInContext("grData.stores="+JSON.stringify(o.noStores?{}:{foodlion:{name:"Food Lion",color:"#d6001c"},aldi:{name:"Aldi",color:"#00205b"}})+";"
    +"grData.items="+JSON.stringify({g1:{name:"Black beans",sec:"pantry",src:[{k:"mom"}]},g2:{name:"Bacon",sec:"meat",stores:["foodlion"],src:[{k:"mom"}]},g3:{name:"Oreos",sec:"snacks",sort:true,src:[{k:"mom"}]}})+";"
    +"grData.home="+JSON.stringify({bacon:["foodlion"]})+";",ctx);
  return {ctx,writes,toasts,pop,run:e=>vm.runInContext(e,ctx),data:()=>vm.runInContext("grData",ctx)};
}

console.log("── the row: circle checks off, the rest of the row moves ──");
{
  const T=mk(); const row=T.run("grRowHTML({id:'g1',name:'Black beans',tags:[],q:'',done:false,stores:[]},true)");
  const circle=row.match(/<div onclick="([^"]*)" role="button" aria-label="Put in the cart"/), name=row.match(/<div onclick="([^"]*)" role="button" aria-label="Move to a different store"/);
  ok("the circle still checks it off", circle&&/grToggle\('g1'\)/.test(circle[1]), circle&&circle[1]);
  ok("the name area opens the move sheet, not the check", name&&/grQuickMove\('i','g1'\)/.test(name[1])&&!/grToggle/.test(name[1]), name&&name[1]);
  ok("grToggle appears exactly once in the row (the circle)", (row.match(/grToggle\(/g)||[]).length===1);
  const vrow=T.run("grRowHTML({key:'st_s1',virt:'staple',name:'Almond milk',tags:['🧺 out'],q:'',done:false},true)");
  ok("a staple row's name opens the move sheet too", /grQuickMove\('v','st_s1'\)/.test(vrow)&&(vrow.match(/grVToggle\(/g)||[]).length===1);
  const big=T.run("grBig=true; grRowHTML({id:'g1',name:'Black beans',tags:[],q:'',done:false,stores:[]},true)"); T.run("grBig=false");
  ok("store mode: same (circle checks, name moves)", /grQuickMove\('i','g1'\)/.test(big)&&(big.match(/grToggle\(/g)||[]).length===1);
}
console.log("── the sheet ──");
{
  const T=mk(); T.run("grQuickMove('i','g2')"); const h=T.pop.innerHTML;
  ok("lists her stores, Any store, To sort and Cancel", /Food Lion/.test(h)&&/Aldi/.test(h)&&/Any store/.test(h)&&/To sort/.test(h)&&/Cancel/.test(h));
  ok("marks the store it's at now (Bacon → Food Lion)", /Food Lion<\/span><span[^>]*>now</.test(h));
  T.pop.innerHTML=""; T.run("grQuickMove('i','g3')");
  ok("an unsorted item shows To sort as now", /To sort — decide later<\/span><span[^>]*>now</.test(T.pop.innerHTML));
  T.pop.innerHTML=""; T.run("grQuickMove('i','g1')");
  ok("an item nobody sorted yet (no store, never 'Any store') shows To sort as now (2026-10-06)", /To sort — decide later<\/span><span[^>]*>now</.test(T.pop.innerHTML));
  T.pop.innerHTML=""; T.run("grData.items.g1.any=true; grQuickMove('i','g1'); delete grData.items.g1.any");
  ok("an item she set to Any store shows Any store as now", /Any store<\/span><span[^>]*>now</.test(T.pop.innerHTML));
  const N=mk({noStores:true}); N.run("grQuickMove('i','g1')");
  ok("no stores yet → the full edit opens instead", /✎ Black beans/.test(N.pop.innerHTML), N.pop.innerHTML.slice(0,80));
  const G=mk({mom:false}); G.run("grQuickMove('i','g1')");
  ok("not Mom and no PIN → nothing opens", G.pop.innerHTML==="");
}
console.log("── moving ──");
{
  const T=mk(); T.run("grQmTo('i','g1','aldi')"); const d=T.data();
  ok("to a store: tagged there, not to-sort, remembered as home", JSON.stringify(d.items.g1.stores)==='["aldi"]'&&!d.items.g1.sort&&JSON.stringify(d.home.blackbeans)==='["aldi"]', [d.items.g1,d.home.blackbeans]);
  ok("…written to the item and the home path only", T.writes.some(w=>w[1]==="kitchen/grocery/items/g1")&&T.writes.some(w=>w[1]==="kitchen/grocery/home/blackbeans"));
  ok("…and the sheet closes", T.pop.innerHTML==="");
  T.run("grQmTo('i','g2','any')");
  ok("Any store: untagged, not to-sort, remembered (any + home 'any')", !T.data().items.g2.stores&&!T.data().items.g2.sort&&T.data().items.g2.any===true&&T.data().home.bacon==="any");
  T.run("grQmTo('i','g2','sort')"); const e=T.data();
  ok("To sort: flagged, untagged, Any-store choice and home forgotten", e.items.g2.sort===true&&!e.items.g2.stores&&!e.items.g2.any&&e.home.bacon===undefined, [e.items.g2,e.home.bacon]);
}
{
  const T=mk(); T.run("grQmTo('v','st_s1','foodlion')");
  ok("a staple to a store → its home is that store", JSON.stringify(T.data().home.almondmilk)==='["foodlion"]');
  T.run("grQmTo('v','st_s1','any')");
  ok("a staple to Any store → home 'any'", T.data().home.almondmilk==="any");
  T.run("grQmTo('v','st_s1','sort')");
  ok("a staple to To sort → home forgotten", T.data().home.almondmilk===undefined);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
