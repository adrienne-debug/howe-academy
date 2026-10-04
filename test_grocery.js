// 🛒 Grocery list slice 1 (2026-10-03): sections, amounts, duplicates, kid requests, Dad direct, 🏁 done.
const fs=require("fs"); const src=fs.readFileSync(process.argv[2]||(__dirname+"/index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
ok("grocery block present once", a>0&&b>a&&src.indexOf("// GROCERY_LIST_START",a+5)<0);
const block=src.slice(a,b);
const mk=()=>{
  const env={writes:[],toasts:[],staples:{s1:{name:"Almond milk",state:"out"},s2:{name:"Olive oil",state:"have"}},usuals:{u1:{name:"Bananas",cat:"breakfast",qty:2}},pantry:[],buy:{},mom:false,dad:false,confirm:true,pinAsked:0};
  const ref=p=>({set:v=>env.writes.push(["set",p,v]),update:v=>env.writes.push(["update",p,v]),remove:()=>env.writes.push(["remove",p])});
  const glyph=src.match(/const KIT_FRAC_GLYPH=\{[^}]+\};/)[0];
  const body=glyph+fn("kitSlug")+fn("kitQtyParse")+fn("kitIsoPlus")+block+`
    ;return {grParse,grKey,grSecFor,grQtyTxt,grMergeQty,grAdd,grFindDup,grToggle,grVToggle,grDone,grApprove,grDecline,grDupMore,grDupAnyway,grGroups,grText,grAddFrom,grKidAllow,grKidBoxHTML,grReqCount,grPickToggle,grPickSave,grActiveStores,grSetStore,grCurStore,grStoreField,grStoreRemove,grSecOrder,grAisleMove,grCfgDad,grToGetCount,grCartCount,grHomeFor,grDadCardHTML,grIngParse,grIngRows,grFromRecipe,grFromWeek,grImpAdd,grFromPantry,grFromTodo,get imp(){return _grImp;},
      get data(){return grData;}, set data(v){grData=v;}, get pend(){return _grPend;}};`;
  const F=new Function("env","db","HA_LS","mwToast","kitOrderList","kitStaples","kitBuyLog","panAdd","_todayStr","momHere","dadAwardOk","kitPinGate","confirm","ROSTER_DEF","esc","tab","document","prompt","navigator","kitPantry","panStatus","kitMeals","kitPlan","gwParseDate","momdayData","momdayToggleTodo","kitCapKey",body);
  const kitOrderList=()=>{ const need=Object.keys(env.staples).filter(k=>env.staples[k].state!=="have").map(k=>Object.assign({id:k},env.staples[k]));
    return {need:need,usuals:{breakfast:Object.keys(env.usuals).map(k=>Object.assign({id:k},env.usuals[k]))},count:0}; };
  const doc={getElementById:id=>env.els&&env.els[id]||null,createElement:()=>({}),body:{appendChild:()=>{}},activeElement:null};
  const L=F(env,{ref:ref},{setItem:()=>{},getItem:()=>null},m=>env.toasts.push(m),kitOrderList,env.staples,env.buy,
    (n,z,q,m)=>{env.pantry.push([n,z,q,m]);return "p";},()=>"2026-10-03",()=>env.mom,()=>env.dad,(then)=>{env.pinAsked++; if(env.pinOk) then();},
    ()=>env.confirm,[{id:"lucy",name:"Lucy",color:"#f0f"},{id:"ellis",name:"Ellis",color:"#00f"}],
    s=>String(s||""),"schedule",doc,()=>null,{},env.pantryItems={},it=>it.gone?"gone":"fresh",env.meals={},env.plan={},iso=>new Date(iso+"T12:00:00"),env.md={},(id,iso)=>{ env.md[iso].todos[id].done=true; },()=>"");
  L.env=env; return L;
};
// grPop needs document.getElementById("gr-pop") — stub one in
const withPop=L=>{ const pop={innerHTML:""}; L.env.els={"gr-pop":pop}; return pop; };

// ── sections ──
const L=mk();
const sec=(n,want)=>ok("section: "+n+" → "+want, L.grSecFor(n,{})===want);
sec("Baby spinach","produce"); sec("Peanut butter","pantry"); sec("Butter","dairy"); sec("Ice cream","frozen"); sec("Heavy cream","dairy");
sec("Frozen chicken nuggets","frozen"); sec("Chicken broth","pantry"); sec("Chicken thighs","meat"); sec("Chocolate chips","baking"); sec("Tortilla chips","snacks");
sec("Green beans","produce"); sec("Black beans","pantry"); sec("Paper towels","household"); sec("Dish soap","household"); sec("Eggs","dairy"); sec("Eggplant","other");
sec("Tomatoes","produce"); sec("Watermelon","produce"); sec("Corn tortillas","bakery"); sec("Black pepper","baking"); sec("Almond flour","baking"); sec("Toothpaste","personal"); sec("Zorblax","other");
ok("her own move wins over the word list", L.grSecFor("Coconut milk",{coconutmilk:"pantry"})==="pantry");
// ── amounts ──
const P=(t,w)=>{ const r=L.grParse(t); ok("parse: "+JSON.stringify(t)+" → "+JSON.stringify(r), JSON.stringify(r)===JSON.stringify(w)); };
P("2 lb ground beef",{name:"Ground beef",qty:2,unit:"lb"}); P("eggs x2",{name:"Eggs",qty:2}); P("eggs ×3",{name:"Eggs",qty:3});
P("3 avocados",{name:"Avocados",qty:3}); P("ground beef 2 lb",{name:"Ground beef",qty:2,unit:"lb"}); P("milk",{name:"Milk"}); P("  ",null);
P("1 bag of spinach",{name:"Spinach",qty:1,unit:"bag"});
ok("amount text: ×2 / 3 lb / blank for 1", L.grQtyTxt({qty:2})==="×2"&&L.grQtyTxt({qty:3,unit:"lb"})==="3 lb"&&L.grQtyTxt({qty:1})==="");
ok("merge: same unit adds up", JSON.stringify(L.grMergeQty({name:"x",qty:2,unit:"lb"},{qty:1,unit:"lb"}))===JSON.stringify({name:"x",qty:3,unit:"lb"}));
ok("merge: plain counts add (blank = 1)", L.grMergeQty({name:"x"},{qty:2}).qty===3);
ok("merge: different units ride along", L.grMergeQty({name:"x",qty:2,unit:"cups"},{qty:1}).extra==="×1");
ok("same-thing key: plurals + case", L.grKey("Eggs")===L.grKey("egg")&&L.grKey("Tomatoes")===L.grKey("tomato")&&L.grKey("Strawberries")===L.grKey("strawberry")&&L.grKey("Glass")!==L.grKey("Glas"));

// ── Mom adds; duplicate pop-up; +1 more ──
{ const L=mk(); withPop(L);
  ok("Mom adds straight on", L.grAdd("2 eggs","mom")==="add");
  const id=Object.keys(L.data.items)[0], it=L.data.items[id];
  ok("item saved with section + source + one path write", it.sec==="dairy"&&it.src[0].k==="mom"&&L.env.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/items/"+id));
  ok("adding it again asks instead of doubling", L.grAdd("Egg","dad")==="ask"&&Object.keys(L.data.items).length===1);
  L.grDupMore();
  ok("＋1 more → ×3, Dad added as a second source", L.data.items[id].qty===3&&L.data.items[id].src.map(s=>s.k).join()==="mom,dad");
  ok("a staple that's out counts as already on the list", L.grFindDup("almond milk").kind==="virt");
  ok("… and 'Add it anyway' makes a real item", L.grAdd("Almond milk","mom")==="ask"&&(L.grDupAnyway(),Object.keys(L.data.items).length===2));
}
// ── kids request; Mom approves ──
{ const L=mk(); withPop(L);
  ok("kid add → a request, not the list", L.grAdd("ketchup","lucy")==="req"&&!Object.keys(L.data.items).length&&Object.keys(L.data.requests).length===1);
  ok("kid asking twice → 'already asked'", L.grAdd("Ketchup","ellis")==="dup"&&Object.keys(L.data.requests).length===1);
  ok("kid asking for something on the list → 'already on the list', no request", L.grAdd("bananas","ellis")==="dup");
  const rid=Object.keys(L.data.requests)[0];
  L.env.pinOk=false; L.grApprove(rid);
  ok("approve needs Mom's PIN (no PIN → nothing changes)", L.env.pinAsked===1&&Object.keys(L.data.requests).length===1);
  L.env.mom=true; L.grApprove(rid);
  const it=L.data.items[Object.keys(L.data.items)[0]];
  ok("approved → on the list with Lucy as the source, off Mom's waiting list", it&&it.src[0].k==="kid"&&it.src[0].who==="lucy"&&L.grReqCount()===0);
  ok("… and the answer is kept for Lucy today", L.data.requests[rid].st==="yes"&&L.data.requests[rid].dIso==="2026-10-03"&&L.env.writes.some(w=>w[0]==="update"&&w[1]==="kitchen/grocery/requests/"+rid));
}
// ── kid's day box + Mom's pick of kids ──
{ const L=mk(); withPop(L);
  ok("no box on a kid's day until Mom turns them on", L.grKidBoxHTML("lucy")==="");
  L.env.pinOk=false; L.grKidAllow("lucy");
  ok("turning a kid on needs Mom's PIN", !L.data.kids.lucy&&L.env.pinAsked===1);
  L.env.mom=true; L.grKidAllow("lucy");
  ok("Mom turns Lucy on → one small path", L.data.kids.lucy===true&&L.env.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/kids/lucy"));
  ok("Lucy's day shows the box, Ellis's doesn't", /Need something from the store/.test(L.grKidBoxHTML("lucy"))&&L.grKidBoxHTML("ellis")==="");
  L.env.mom=false; L.env.els["gr-add-kid-lucy"]={value:"ketchup"}; L.grAddFrom("gr-add-kid-lucy","lucy");
  ok("Lucy asks from her day → request as Lucy (no picker, no PIN)", Object.values(L.data.requests).some(r=>r.kid==="lucy"&&r.name==="Ketchup")&&L.env.pinAsked===1);
  ok("her box shows ⏳ Waiting for Mom", /Ketchup[\s\S]*Waiting for Mom/.test(L.grKidBoxHTML("lucy")));
  L.env.els["gr-add-kid-ellis"]={value:"candy"}; L.grAddFrom("gr-add-kid-ellis","ellis");
  ok("a kid Mom hasn't turned on can't send", !Object.values(L.data.requests).some(r=>r.kid==="ellis"));
  L.env.mom=true; L.grDecline(Object.keys(L.data.requests)[0]);
  ok("Mom says no → Lucy sees 'Not this time'", /Not this time/.test(L.grKidBoxHTML("lucy")));
}
// ── Mom's Day box is Mom's: PIN when not unlocked, no picker ──
{ const L=mk(); const pop=withPop(L); L.env.els["gr-add-md"]={value:"apples"};
  L.env.pinOk=false; L.grAddFrom("gr-add-md","md");
  ok("Mom's Day, not unlocked → asks for Mom's PIN, adds nothing, no kid picker", L.env.pinAsked===1&&!Object.keys(L.data.items).length&&!Object.keys(L.data.requests).length&&!/Lucy/.test(pop.innerHTML));
  L.env.pinOk=true; L.grAddFrom("gr-add-md","md");
  ok("right PIN → straight on the list as Mom", Object.values(L.data.items).some(i=>i.name==="Apples"&&i.src[0].k==="mom"));
  L.env.els["gr-add-dad"]={value:"batteries"}; const before=L.env.pinAsked; L.grAddFrom("gr-add-dad","dad");
  ok("Dad's Day adds straight on, no PIN", Object.values(L.data.items).some(i=>i.name==="Batteries"&&i.src[0].k==="dad")&&L.env.pinAsked===before);
}
// ── 🏁 done ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grAdd("2 lb ground beef","mom"); L.grAdd("Paper towels","mom"); L.grAdd("3 avocados","mom");
  const ids=Object.keys(L.data.items); const nm={}; ids.forEach(i=>nm[L.data.items[i].name]=i); const byName=n=>nm[n];
  L.grToggle(byName("Ground beef")); L.grToggle(byName("Paper towels")); L.grVToggle("st_s1");
  ok("in-cart tick on a staple is its own small path", L.env.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/vchk/st_s1"));
  L.grDone();
  ok("checked items come off, unchecked stay", Object.keys(L.data.items).length===1&&L.data.items[byName("Avocados")]);
  ok("staple bought → ✅ have", L.env.staples.s1.state==="have"&&L.env.writes.some(w=>w[1]==="kitchen/staples/s1"));
  ok("buy history: beef counted once (weight), almond milk counted", L.env.buy["2026-10-03"].groundbeef===1&&L.env.buy["2026-10-03"].almondmilk===1);
  ok("pantry: beef → fridge, almond milk → fridge, paper towels stay out", JSON.stringify(L.env.pantry.map(p=>[p[0],p[1]]))===JSON.stringify([["Ground beef","fridge"],["Almond milk","fridge"]]));
  ok("in-cart ticks cleared", !Object.keys(L.data.vchk).length&&L.env.writes.some(w=>w[0]==="remove"&&w[1]==="kitchen/grocery/vchk/st_s1"));
  ok("no whole-node writes to kitchen/grocery", !L.env.writes.some(w=>w[1]==="kitchen/grocery"||w[1]==="kitchen/grocery/items"&&w[0]==="set"));
}
{ const L=mk(); withPop(L); L.env.mom=false; L.env.pinOk=false; L.grAdd("x","dad"); L.grToggle(Object.keys(L.data.items)[0]); L.grDone();
  ok("🏁 Done needs Mom's PIN (or Dad's code)", Object.keys(L.data.items).length===1&&L.env.pinAsked===1); }
// ── copy text ──
{ const L=mk(); withPop(L); L.grAdd("2 lb ground beef","mom");
  const t=L.grText(); ok("copy text groups by section, includes staples + usuals", /Meat & seafood: Ground beef \(2 lb\)/.test(t)&&/Almond milk/.test(t)&&/Bananas \(×2\)/.test(t)); }
// ── 🏬 stores ──
{ const L=mk(); withPop(L); L.env.mom=true;
  ok("no stores yet → none active", L.grActiveStores().length===0);
  L.grPickToggle("walmart"); L.grPickToggle("costco"); L.grPickToggle("publix"); L.env.els["gr-store-own"]={value:"Farmers market"}; L.grPickSave();
  const ids=L.grActiveStores();
  ok("picked 3 chains + her own → 4 stores, each one small path", ids.length===4&&L.env.writes.filter(w=>w[0]==="set"&&/^kitchen\/grocery\/stores\/[^/]+$/.test(w[1])).length===4);
  L.grStoreField("costco","trips",5); L.grStoreField("publix","pin",true);
  ok("chips: 📌 pinned first, then most trips", L.grActiveStores().slice(0,2).join()==="publix,costco");
  L.grStoreField("walmart","hidden",true);
  ok("a hidden store drops off the chips but keeps its record", L.grActiveStores().indexOf("walmart")<0&&L.data.stores.walmart);
  L.grStoreField("walmart","hidden",false);
  L.grSetStore("costco"); L.env.els["gr-add-list"]={value:"almond flour"}; L.grAddFrom("gr-add-list","list");
  const af=Object.values(L.data.items).find(i=>i.name==="Almond flour");
  ok("added on the Costco chip → tagged Costco and Costco becomes its home", af&&af.stores.join()==="costco"&&L.grHomeFor("almond flour").join()==="costco");
  L.grSetStore("all"); L.env.els["gr-add-list"]={value:"bananas bread"}; L.grAddFrom("gr-add-list","list");
  L.grStoreRemove; // exists
  // next time almond flour comes back on "All" it goes to Costco by itself
  const afid=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Almond flour"); delete L.data.items[afid];
  L.grAdd("Almond flour","dad");
  ok("its home store is remembered next time", Object.values(L.data.items).find(i=>i.name==="Almond flour").stores.join()==="costco");
  ok("Costco shows its items + untagged; Publix doesn't show Costco-only items", L.grToGetCount("costco")>L.grToGetCount("publix")||L.grToGetCount("costco")===L.grToGetCount("publix")+1);
  L.grAisleMove("costco","baking",-1);
  ok("aisle order per store moves a section earlier", L.grSecOrder("costco").indexOf("baking")===L.grSecOrder("walmart").indexOf("baking")-1);
  // done at Costco: only Costco + untagged in-cart items
  L.grAdd("Paper towels","mom",{src:{k:"mom"},stores:["walmart"]});
  Object.keys(L.data.items).forEach(i=>L.grToggle(i));
  L.grSetStore("costco"); L.grDone();
  ok("🏁 Done at Costco keeps Walmart-only items on the list", Object.values(L.data.items).some(i=>i.name==="Paper towels")&&!Object.values(L.data.items).some(i=>i.name==="Almond flour"));
  ok("… and counts a Costco trip", L.data.stores.costco.trips===6);
  L.grToggle(Object.keys(L.data.items).find(i=>L.data.items[i].name==="Paper towels"));   // back to to-get
  ok("Dad's card shows where to buy (store buttons)", /Walmart/.test(L.grDadCardHTML()));
  ok("Dad picks a store only when Mom allows it", !/gr-add-dad-store/.test(L.grDadCardHTML())&&(L.grCfgDad(),/gr-add-dad-store/.test(L.grDadCardHTML())));
  L.grStoreRemove("walmart");
  ok("removing a store untags its items (they go to any store)", !Object.values(L.data.items).find(i=>i.name==="Paper towels").stores);
  L.grSetStore("all");
  const t=L.grText(); ok("copy text on All is grouped by store", /Costco:|Any store:/.test(t));
}
// ── 🍽 step 3: recipes, the week, pantry, to-dos ──
{ const L=mk(); withPop(L);
  const I=(t,w)=>{ const r=L.grIngParse(t); ok("ingredient: "+JSON.stringify(t)+" → "+JSON.stringify(r), JSON.stringify(r)===JSON.stringify(w)); };
  I("2 1/2 cups chopped yellow onion (about 1 large)",{name:"Yellow onion",qty:2.5,unit:"cups"});
  I("1 lb ground beef",{name:"Ground beef",qty:1,unit:"lb"});
  I("3 cloves garlic, minced",{name:"Garlic",qty:3,unit:"cloves"});
  I("1 lemon, juiced",{name:"Lemon",qty:1});
  I("½ tsp sea salt",{name:"Sea salt",qty:0.5,unit:"tsp"});
  I("2 large eggs",{name:"Eggs",qty:2});
  I("For the sauce:",null);
  I("- 1 (14 oz) can coconut milk",{name:"Coconut milk",qty:1,unit:"can"});
  I("Fresh cilantro, for garnish",{name:"Cilantro"});
  I("1-2 jalapeños",{name:"Jalapeños",qty:1});
  L.env.meals.m1={name:"Taco night",ing:"1 lb ground beef\n1 onion\n2 cloves garlic\n1 tsp salt\n8 corn tortillas"};
  L.env.meals.m2={name:"Chili",ing:"2 lb ground beef\n2 onions\n1 can black beans"};
  L.env.pantryItems.p1={name:"Garlic",zone:"produce"}; L.env.staples.s3={name:"Corn tortillas",state:"have"};
  L.grAdd("Black beans","mom");
  const rows=L.grIngRows([{lines:L.env.meals.m1.ing,lbl:"Taco night"},{lines:L.env.meals.m2.ing,lbl:"Chili"}]);
  const R=n=>rows.find(r=>r.p.name===n);
  ok("same food from two meals combines: beef 1 lb + 2 lb = 3 lb", R("Ground beef")&&R("Ground beef").p.qty===3&&R("Ground beef").meals.join()==="Taco night,Chili");
  ok("onion + onions combine → 3", R("Onion")&&R("Onion").p.qty===3);
  ok("in the pantry → unticked", R("Garlic")&&!R("Garlic").on&&/pantry/.test(R("Garlic").why));
  ok("a ✅ have staple → unticked", R("Corn tortillas")&&!R("Corn tortillas").on);
  ok("salt is a basic → unticked", R("Salt")&&!R("Salt").on);
  ok("already on the list → unticked and says so", R("Black beans")&&!R("Black beans").on&&/on list/.test(R("Black beans").why));
  ok("new things start ticked", R("Ground beef").on&&R("Onion").on);
  L.env.mom=true; L.grFromRecipe("m2");
  ok("recipe → tick-list pop-up (nothing added yet)", L.imp&&L.imp.rows.length===3&&Object.values(L.data.items).length===1);
  L.imp.rows.forEach(r=>r.on=true); L.grImpAdd();
  const beans=Object.values(L.data.items).filter(i=>i.name==="Black beans");
  ok("Add → new items land with the meal as source; a ticked duplicate adds to the existing line", Object.values(L.data.items).some(i=>i.name==="Ground beef"&&i.src[0].k==="meal"&&i.src[0].lbl==="Chili")&&beans.length===1&&beans[0].extra==="1 can");
  L.env.plan["2026-10-03"]={mid:"m1",sides:"peas · rice"}; L.env.plan["2026-10-05"]={mid:"m2",eaten:true,l:{mid:"m2"}}; L.env.plan["2026-10-20"]={mid:"m2"};
  L.grFromWeek();
  const names=L.imp.rows.map(r=>r.p.name);
  ok("week: dinners + sides + planned lunches in the next 7 days; eaten dinners and later weeks left out", names.includes("Peas")&&names.includes("Rice")&&names.includes("Corn tortillas")&&names.includes("Black beans")&&L.imp.many);
  L.env.pantryItems.p2={name:"Avocados",zone:"produce"}; L.grFromPantry("p2");
  ok("🛒 on a pantry chip → on the list", Object.values(L.data.items).some(i=>i.name==="Avocados"));
  L.env.md["2026-10-03"]={todos:{t1:{text:"buy batteries",ts:1}}}; L.grFromTodo("t1","2026-10-03");
  ok("→🛒 on a to-do: 'buy batteries' → Batteries on the list, to-do checked off", Object.values(L.data.items).some(i=>i.name==="Batteries"&&i.src[0].k==="todo")&&L.env.md["2026-10-03"].todos.t1.done===true);
}
{ const L=mk(); withPop(L); L.env.meals.m1={name:"Tacos",ing:"1 lb beef"}; L.env.pinOk=false; L.grFromRecipe("m1"); L.grImpAdd();
  ok("adding from a recipe needs Mom's PIN when not unlocked", !Object.keys(L.data.items).length&&L.env.pinAsked===1); }
ok("recipe card has the 🛒 Add ingredients button", /grFromRecipe\(/.test(src)&&/🛒 Add ingredients to the grocery list/.test(src));
ok("Meals week header + list page have Shop-for-the-week", (src.match(/onclick="grFromWeek\(\)"/g)||[]).length===2);
ok("pantry chips + Mom's Day to-dos have 🛒 buttons", /grFromPantry\(/.test(src)&&/grFromTodo\(/.test(src));
// ── wiring ──
ok("Mom's Day Shopping spot opens the list (not Meals)", /\+grMdShopHTML\(\)/.test(src)&&!/Open the shopping list →/.test(src));
ok("🛒 List tab in the Mom's Day tabs", /btn\('grocery','🛒 Grocery List'\)/.test(src)&&/if\(mpSubView==='grocery'\)\{ return renderGrocery\(el\); \}/.test(src));
ok("Dad's Day has the grocery card", /h\+=grDadCardHTML\(\)/.test(src));
ok("kid's day page carries the ask box", /h\+=grKidBoxHTML\(k\)/.test(src));
ok("live listener on kitchen/grocery", /db\.ref\("kitchen\/grocery"\)\.on\("value"/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
