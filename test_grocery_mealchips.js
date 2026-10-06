/* 🍽 Recipe tags open the recipe (her ask 2026-10-06).  run: node test_grocery_mealchips.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const pop={innerHTML:""}, opened=[];
const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,db:null,HA_LS:{getItem:()=>null,setItem:()=>{}},mwToast:()=>{},esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
  momHere:()=>true,dadAwardOk:()=>false,kitPinGate:()=>{},kitOrderList:()=>({need:[],usuals:{}}),_todayStr:()=>"2026-10-06",kitOpenRecipe:id=>opened.push(id),
  document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx);
vm.runInContext("var kitMeals={m1:{name:'Burgers',emoji:'🍔',ing:'1 lb ground beef\\nbuns',steps:'Shape patties\\nGrill'},m2:{name:'Crockpot Steak Burrito Bowls',ing:'chuck roast'}};",ctx);
vm.runInContext(src.slice(a,b),ctx); ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grRepaint=()=>{};
const run=e=>vm.runInContext(e,ctx);
ok("parts: two recipes with days", JSON.stringify(run("grMealParts('Burgers (Wed), Crockpot Steak Burrito Bowls (Fri)')"))==='[{"name":"Burgers","day":"Wed"},{"name":"Crockpot Steak Burrito Bowls","day":"Fri"}]');
ok("parts: a recipe name with a comma stays whole", JSON.stringify(run("grMealParts('Chicken, Rice and Beans (Mon)')"))==='[{"name":"Chicken, Rice and Beans","day":"Mon"}]');
ok("parts: no day → the whole label", JSON.stringify(run("grMealParts('meal')"))==='[{"name":"meal","day":""}]');
ok("find by name, case/space-insensitive", run("grMealFind(' burgers ')")==="m1"&&run("grMealFind('Pizza')")===null);
const row=run("grRowHTML({id:'g1',name:'Ground beef',srcs:[{k:'meal',lbl:'Burgers (Wed), Mystery Stew (Fri)'},{k:'mom'}],tags:['🍽 Burgers (Wed), Mystery Stew (Fri)','✍️ Mom'],q:'',done:false,stores:[]},true)");
ok("a known recipe is a chip that opens it (and doesn't trigger the row)", /onclick="event\.stopPropagation\(\);grMealPop\('m1'\)"[^>]*>🍽 Burgers \(Wed\)</.test(row), row.slice(0,400));
ok("an unknown recipe stays a plain tag", /<span style="[^"]*">🍽 Mystery Stew \(Fri\)<\/span>/.test(row)&&!/grMealPop\('[^']*'\)"[^>]*>🍽 Mystery/.test(row));
ok("other tags unchanged (✍️ Mom)", /✍️ Mom<\/span>/.test(row));
const vrow=run("grRowHTML({key:'st_s1',virt:'staple',name:'Almond milk',tags:['🧺 out'],q:'',done:false},true)");
ok("staple rows keep their plain tag", /🧺 out<\/span>/.test(vrow));
run("grMealPop('m1')");
ok("the pop-up shows the recipe: name, ingredients, steps", /🍔 Burgers/.test(pop.innerHTML)&&/• 1 lb ground beef/.test(pop.innerHTML)&&/2\. Grill/.test(pop.innerHTML));
ok("…with Open the full recipe → kitOpenRecipe(m1)", /grPopClose\(\);kitOpenRecipe\('m1'\)/.test(pop.innerHTML));
ok("store mode hides tags as before", !/grMealPop/.test(run("grBig=true; grRowHTML({id:'g1',name:'Ground beef',srcs:[{k:'meal',lbl:'Burgers (Wed)'}],tags:[],q:'',done:false,stores:[]},true)")));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
