/* 🗓 Tapping a dinner's name in This week's dinners opens its recipe pop-up (her ask 2026-10-07).  run: node test_kit_week_recipe.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// KIT_WKRECIPE_START"), b=src.indexOf("// KIT_WKRECIPE_END");
const ga=src.indexOf("// GROCERY_LIST_START"), gb=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
ok("the block is marked", a>0&&b>a);
const pop={innerHTML:""}, opened=[], writes=[];
const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,
  db:{ref:p=>{ writes.push(p); return {set(){},update(){},remove(){}}; }},_dryRun:()=>false,
  HA_LS:{getItem:()=>null,setItem:()=>{}},mwToast:()=>{},esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
  momHere:()=>true,dadAwardOk:()=>false,kitPinGate:()=>{},kitOrderList:()=>({need:[],usuals:{}}),_todayStr:()=>"2026-10-07",kitOpenRecipe:id=>opened.push(id),
  document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx);
vm.runInContext("var kitMeals={m1:{name:'Burgers',emoji:'🍔',ing:'1 lb ground beef\\nbuns',steps:'Shape patties\\nGrill'}};",ctx);
vm.runInContext(src.slice(ga,gb),ctx);
vm.runInContext(src.slice(a,b),ctx);
const run=e=>vm.runInContext(e,ctx);

const h=run("kitWkNameHTML({mid:'m1',meal:kitMeals.m1})");
ok("the dinner's name opens the recipe pop-up (grMealPop), not the day picker", /<b onclick="event\.stopPropagation\(\);grMealPop\('m1'\)"[^>]*>🍔 Burgers<\/b>/.test(h), h);
ok("it reads as tappable", /cursor:pointer/.test(h)&&/aria-label="Open the recipe"/.test(h));
ok("no meal → nothing", run("kitWkNameHTML({txt:'Tacos'})")===""&&run("kitWkNameHTML(null)")==="");
ok("names are escaped", /&lt;i>/.test(run("kitWkNameHTML({mid:'m9',meal:{name:'<i>x'}})")));

// The tap → the grocery list's own pop-up shows the recipe
run("grMealPop('m1')");
ok("the pop-up shows the recipe: name, ingredients, steps", /🍔 Burgers/.test(pop.innerHTML)&&/• 1 lb ground beef/.test(pop.innerHTML)&&/2\. Grill/.test(pop.innerHTML));
ok("…with Open the full recipe → kitOpenRecipe(m1)", /grPopClose\(\);kitOpenRecipe\('m1'\)/.test(pop.innerHTML));
ok("opening it writes nothing", writes.length===0, writes);

// Wiring: the week row uses it; the row itself still opens the day picker; no second pop-up was built
const rk=fn("renderKitchen");
ok("This week's dinners renders the name through kitWkNameHTML", /if\(pl&&pl\.meal\) what=kitWkNameHTML\(pl\)/.test(rk));
ok("the row still opens the day picker", /onclick="kitPickDay\(/.test(rk));
ok("one recipe pop-up: grMealPop is defined once", (src.match(/function grMealPop\(/g)||[]).length===1);
ok("the new block builds no pop-up of its own", !/grPop\(|position:fixed|createElement/.test(src.slice(a,b)));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
