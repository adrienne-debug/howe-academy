/* 🧠 Smarter receipt matching + "not matched = not bought" (her asks 2026-10-06).  run: node test_grocery_smartmatch.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(){
  const pop={innerHTML:""}; let asked=null;
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:()=>({set(){},update(){},remove(){}})}, HA_LS:{getItem:()=>null,setItem(){}}, mwToast:()=>{}, esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", kitCapKey:()=>"k", panAdd:()=>"p1", kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{},
    kitCapAsk:async(c)=>{ asked=c; return '{"store":"Walmart","items":[]}'; },
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  vm.runInContext(`grData.stores={walmart:{name:"Walmart"}};
    grData.items={gb:{name:"Ground beef",stores:["walmart"],done:true},cb:{name:"Chicken breast",stores:["walmart"],done:true},bc:{name:"Baby carrots",stores:["walmart"],done:true},
      ap:{name:"Apples",stores:["walmart"],done:true},as:{name:"Applesauce cups",stores:["walmart"],done:true},mk:{name:"Milk",stores:["walmart"],done:true},
      tp:{name:"Toothpaste",stores:["walmart"],done:true},ic:{name:"Ice cream",stores:["walmart"]}};`,ctx);
  return {run:e=>vm.runInContext(e,ctx),pop,asked:()=>asked};
}
const load=(T,items)=>T.run("_grRc={imgs:[]}; grRcptLoad("+JSON.stringify({store:"WALMART",date:"2026-10-06",total:30,items})+"); grRcptDraw()");
const m=(T)=>T.run("_grRc.rows.map(r=>r.match)");
console.log("── matching ──");
{ const T=mk(); load(T,[{line:"GRND BF 80/20",name:"Ground beef 80/20",price:6.98},{line:"BNLS CHKN BRST",name:"Boneless chicken",price:9.12},{line:"BBY CRT 2LB",name:"Baby carrot",price:1.98}]);
  ok("receipt shorthand matches: GRND BF → Ground beef, BNLS CHKN BRST → Chicken breast, BBY CRT → Baby carrots", JSON.stringify(m(T))==='["i:gb","i:cb","i:bc"]', m(T)); }
{ const T=mk(); load(T,[{line:"GV APPLESAUCE 6CT",name:"Applesauce",price:2.48},{line:"GALA APPLES 3LB",name:"Apples",price:4.05}]);
  ok("best pairs first: applesauce → Applesauce cups and apples → Apples (the first line doesn't take Apples)", JSON.stringify(m(T))==='["i:as","i:ap"]', m(T)); }
{ const T=mk(); load(T,[{line:"XQZ 4471",name:"Batteries",price:5.97}]);
  ok("nothing alike → ➕ not on the list (no wild guess)", JSON.stringify(m(T))==='["x"]', m(T)); }
{ const T=mk(); load(T,[{line:"CRST 3D WHT",name:"Crest toothpaste",price:3.47,list:"Toothpaste"}]);
  ok("Claude's list name wins (it saw her list)", JSON.stringify(m(T))==='["i:tp"]', m(T)); }
{ const T=mk(); T.run("grData.alias={grtvl1gal:'milk'}"); load(T,[{line:"GR TVL 1GAL",name:"Something",price:3.12}]);
  ok("a receipt text she matched before is remembered (alias)", JSON.stringify(m(T))==='["i:mk"]', m(T)); }
console.log("── not matched = not bought ──");
{ const T=mk(); load(T,[{line:"GRND BF",name:"Ground beef",price:6.98},{line:"MILK GAL",name:"Milk",price:3.12}]);
  const h=T.pop.innerHTML;
  ok("checked-off items missing from the receipt default to Didn't get it", /❓ 5 checked off, but not on this receipt<\/b> — not bought — they go back on your list/.test(h), h.slice(h.indexOf("❓"),h.indexOf("❓")+200));
  T.run("_grRc.noOpen=true; grRcptNo('i:tp','kept'); grRcptSave()");
  const d=T.run("grData.items");
  ok("saving puts the unmatched ones back on the list (not bought)…", d.cb&&!d.cb.done&&d.bc&&!d.bc.done&&d.ap&&!d.ap.done);
  ok("…except the one she said she still bought", d.tp&&d.tp.done===true);
  ok("matched items stay in the cart", d.gb&&d.gb.done&&d.mk&&d.mk.done); }
console.log("── menus + Claude ──");
{ const T=mk(); load(T,[{line:"QQQ",name:"Zzz",price:1}]);
  const o=(T.pop.innerHTML.split('<select')[2]||"").match(/>(✓ )?[A-Z][^<]*<\/option>/g)||[]; const names=o.map(x=>x.replace(/^>(✓ )?/,"").replace(/<\/option>$/,""));
  ok("menu is plain A–Z", JSON.stringify(names)===JSON.stringify(names.slice().sort((p,q)=>p.localeCompare(q,undefined,{sensitivity:"base"}))), names); }
(async()=>{ const T=mk(); T.run("_grRc={imgs:['AAA'],busy:false,msg:''}"); await T.run("grRcptRead()"); const t=(T.asked()||[]).filter(x=>x.type==="text").map(x=>x.text).join("\n");
  ok("Claude gets her list names and is asked for the matching one", /Her shopping list \(use these EXACT names\)/.test(t)&&/"Ground beef"/.test(t)&&/"list":"exact name from her shopping list, or null"/.test(t));
  console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); })();
