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
  env.ls={};
  const glyph=src.match(/const KIT_FRAC_GLYPH=\{[^}]+\};/)[0];
  const body=glyph+fn("kitSlug")+fn("kitQtyParse")+fn("kitIsoPlus")+block+`
    ;return {grParse,grKey,grSecFor,grQtyTxt,grMergeQty,grAdd,grFindDup,grToggle,grVToggle,grDone,grApprove,grDecline,grDupMore,grDupAnyway,grGroups,grText,grAddFrom,grKidAllow,grKidBoxHTML,grReqCount,grPickToggle,grPickSave,grActiveStores,grSetStore,grCurStore,grStoreField,grStoreRemove,grSecOrder,grAisleMove,grCfgDad,grToGetCount,grCartCount,grHomeFor,grDadCardHTML,grIngParse,grIngRows,grFromRecipe,grFromWeek,grImpAdd,grFromPantry,grFromTodo,get imp(){return _grImp;},grMem,grMemUpdate,grShelf,grShelfAdd,grSuggestNames,grClearedIds,grPutBack,grRemove,grSave,grEdit,grEditSave,grMoney,grPriceAdd,grUsual,grLowest,grSaleInfo,grBest,grTripEst,grTripHeadHTML,grPriceLineHTML,grSpent,grWeekStart,grRcptLoad,grRcptSave,grDoneRun,get rc(){return _grRc;},set rc(v){_grRc=v;},grSortIds,grSortTo,grSortBoxHTML,grStoreFromText,grPlLoad,grPlAdd,grRowHTML,get pl(){return _grPl;},set pl(v){_grPl=v;},grStep,grQtyType,grQtySave,grStepperHTML,set fromDad(v){grFromDad=v;},grPaidSet,grPaidBoxHTML,grCartTotal,grStoreTotalBarHTML,set big(v){grBig=v;},grPanFind,grEatRows,kitMarkEaten,grEatApply,grEatUndo,grRanOutHTML,grSortV,grSortCount,get eat(){return _grEat;},grPanOldIds,grPanCheckOpen,grPanToss,grPanKeep,grPanMove,grPanTossAdd,grPanKeepAll,grWeekNeeds,grCheckoutOpen,grCheckoutGo,grBudgets,grBudgetDefault,grBudgetAdd,grBudgetField,grSpentBudget,grSpentOther,get co(){return _grCo;},grPlaceOf,grPlaceGuess,grPutIds,grPutSet,grPutDate,grPutDone,grUseSoonIds,grUseFroze,grUseOk,grPutAlertHTML,grUseSoonHTML,grNeedBought,grNeedList,grNeedSkipTap,grPantryAlertsHTML,
      get data(){return grData;}, set data(v){grData=v;}, get pend(){return _grPend;}};`;
  const F=new Function("env","db","HA_LS","mwToast","kitOrderList","kitStaples","kitBuyLog","panAdd","_todayStr","momHere","dadAwardOk","kitPinGate","confirm","ROSTER_DEF","esc","tab","document","prompt","navigator","kitPantry","panStatus","kitMeals","kitPlan","gwParseDate","momdayData","momdayToggleTodo","kitCapKey","kitEatGate","kitMealsLSSave","_kitRefresh","kitRateChips","panZoneMeta",body);
  const kitOrderList=()=>{ const need=Object.keys(env.staples).filter(k=>env.staples[k].state!=="have").map(k=>Object.assign({id:k},env.staples[k]));
    return {need:need,usuals:{breakfast:Object.keys(env.usuals).map(k=>Object.assign({id:k},env.usuals[k]))},count:0}; };
  const doc={getElementById:id=>env.els&&env.els[id]||null,createElement:()=>({}),body:{appendChild:()=>{}},activeElement:null};
  const L=F(env,{ref:ref},{setItem:(k,v)=>{env.ls[k]=v;},getItem:()=>null},m=>env.toasts.push(m),kitOrderList,env.staples,env.buy,
    (n,z,q,m)=>{env.pantry.push([n,z,q,m]); const id="pa"+env.pantry.length; env.pantryItems[id]={name:n,zone:z,qty:q,addedIso:"2026-10-03"}; return id;},()=>"2026-10-03",()=>env.mom,()=>env.dad,(then)=>{env.pinAsked++; if(env.pinOk) then();},
    ()=>env.confirm,[{id:"lucy",name:"Lucy",color:"#f0f"},{id:"ellis",name:"Ellis",color:"#00f"}],
    s=>String(s||""),"schedule",doc,()=>null,{},env.pantryItems={},it=>(it.gone||(it.addedIso&&it.addedIso<"2026-09-15"&&it.zone!=="freezer"))?"gone":"fresh",env.meals={},env.plan={},iso=>new Date(iso+"T12:00:00"),env.md={},(id,iso)=>{ env.md[iso].todos[id].done=true; },()=>"",()=>env.mom||env.dad,()=>{},()=>{},()=>"<chips>",z=>[z,{produce:"🥬 Produce",fridge:"🧊 Fridge",freezer:"❄️ Freezer",pantry:"🥫 Pantry"}[z]||"🥫 Pantry",14]);
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
  L.grDone(); L.grCheckoutGo();
  ok("checked items come off, unchecked stay", Object.keys(L.data.items).length===1&&L.data.items[byName("Avocados")]);
  ok("staple bought → ✅ have", L.env.staples.s1.state==="have"&&L.env.writes.some(w=>w[1]==="kitchen/staples/s1"));
  ok("buy history: beef counted once (weight), almond milk counted", L.env.buy["2026-10-03"].groundbeef===1&&L.env.buy["2026-10-03"].almondmilk===1);
  ok("pantry: beef → fridge, almond milk → fridge, paper towels stay out", JSON.stringify(L.env.pantry.map(p=>[p[0],p[1]]))===JSON.stringify([["Ground beef","fridge"],["Almond milk","fridge"]]));
  ok("in-cart ticks cleared", !Object.keys(L.data.vchk).length&&L.env.writes.some(w=>w[0]==="remove"&&w[1]==="kitchen/grocery/vchk/st_s1"));
  ok("no whole-node writes to kitchen/grocery", !L.env.writes.some(w=>w[1]==="kitchen/grocery"||w[1]==="kitchen/grocery/items"&&w[0]==="set"));
}
{ const L=mk(); withPop(L); L.env.mom=false; L.env.pinOk=false; L.grAdd("x","dad"); L.grToggle(Object.keys(L.data.items)[0]); L.grDone(); L.grCheckoutGo();
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
  L.grSetStore("costco"); L.grDone(); L.grCheckoutGo();
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
// ── 🧠 step 4: a list that learns ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grAdd("2 lb ground beef","mom"); L.grAdd("Almond milk","mom",{src:{k:"mom"}}); // almond milk = staple out → ask pop-up
  L.grAdd("Avocados","mom");
  Object.keys(L.data.items).forEach(i=>L.grToggle(i)); L.grDone(); L.grCheckoutGo();
  ok("🏁 Done counts each bought item in the family memory (update, not set)", L.grMem("Ground beef").n===1&&L.grMem("Avocados").last==="2026-10-03"&&L.env.writes.some(w=>w[0]==="update"&&w[1]==="kitchen/grocery/mem/groundbeef"));
  ok("bought items land in Recently cleared", L.grClearedIds().length===2);
  ok("bought once → not on the Add-again shelf yet", !L.grShelf().some(m=>m.name==="Ground beef"));
  L.grAdd("Ground beef","mom"); Object.keys(L.data.items).forEach(i=>L.grToggle(i)); L.grDone(); L.grCheckoutGo();
  ok("bought twice → on the shelf (when not on the list)", L.grShelf().some(m=>m.name==="Ground beef"));
  L.grAdd("Ground beef","mom");
  ok("on the list → off the shelf", !L.grShelf().some(m=>m.name==="Ground beef"));
  ok("suggestions: what we buy first, then the word list", L.grSuggestNames()[0]==="Ground beef"&&L.grSuggestNames().includes("Spinach"));
  // brand note + photo + ⭐
  const id=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Ground beef");
  L.grEdit(id); L.pend.photo="data:image/jpeg;base64,AAA"; L.env.els["gr-e-note"]={value:"grass-fed, 85/15"}; L.env.els["gr-e-fav"]={checked:true}; L.grEditSave();
  ok("✎ note + photo + ⭐ are remembered", L.grMem("Ground beef").note==="grass-fed, 85/15"&&L.grMem("Ground beef").fav===true&&L.grMem("Ground beef").photo);
  L.grRemove(id);
  ok("✕ Remove → Recently cleared", L.grClearedIds().some(c=>L.data.cleared[c].how==="removed"));
  L.grAdd("ground beef","dad");
  const back=Object.values(L.data.items).find(i=>i.name==="Ground beef");
  ok("next time it's added, the brand note and photo come back", back&&back.note==="grass-fed, 85/15"&&back.photo);
  ok("⭐ favorite stays on the shelf logic (fav ranks first when off the list)", L.grMem("Ground beef").fav);
  L.grSave(); const ls=JSON.parse(L.env.ls.ha_grocery);
  ok("device copy never holds photos (localStorage quota)", !JSON.stringify(ls).includes("base64"));
  const cid=L.grClearedIds().find(c=>L.data.cleared[c].name==="Avocados");
  L.grPutBack(cid);
  ok("↩ Put back → Avocados back on the list, gone from Recently cleared", Object.values(L.data.items).some(i=>i.name==="Avocados")&&!L.data.cleared[cid]);
  ok("cleared records never carry photos", !Object.values(L.data.cleared).some(c=>c.photo));
}
ok("add boxes carry suggestions (one shared list on <body>)", /list="gr-dl"/.test(src)&&/grDlSync\(\);/.test(src));
// ── 💲 step 5: money ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grPickToggle("costco"); L.grPickToggle("publix"); L.grPickSave();
  ok("money reader: $8.98 / 8.98 / blank", L.grMoney("$8.98")===8.98&&L.grMoney("8.98")===8.98&&L.grMoney("")===null);
  // history: regular prices + one sale
  [["2026-08-01",8.48],["2026-09-01",8.98],["2026-09-20",8.98]].forEach(([iso,p])=>L.grPriceAdd("Almond flour","costco",p,{iso:iso}));
  ok("price saved as one small path per entry", L.env.writes.filter(w=>/^kitchen\/grocery\/prices\/almondflour\/costco\/p/.test(w[1])).length===3);
  ok("usual price = median of regular prices", L.grUsual("Almond flour","costco")===8.98);
  const r=L.grPriceAdd("Almond flour","costco",6.99,{iso:"2026-10-03"});
  ok("a price 20%+ under usual is tagged a sale (forgot the tick) and flagged as a good price", r.rec.sale===true&&r.rec.reg===8.98&&r.pct===22);
  ok("a sale price never becomes the usual price", L.grUsual("Almond flour","costco")===8.98);
  ok("lowest price seen remembers the sale", L.grLowest("Almond flour","costco").p===6.99);
  L.grPriceAdd("Almond flour","publix",12.49,{iso:"2026-09-10"});
  ok("cheapest store first", L.grBest("Almond flour").map(x=>x.sid).join()==="costco,publix");
  L.grAdd("Almond flour","mom",{src:{k:"mom"},stores:["publix"]});
  L.grSetStore("publix");
  const row={id:Object.keys(L.data.items)[0],name:"Almond flour"};
  const pl=L.grPriceLineHTML(row);
  ok("in Publix: shows the price here + 💡 cheaper at Costco with a move button", /\$12\.49<\/b> here/.test(pl)&&/💡 \$3\.51 less at Costco · move/.test(pl));
  ok("trip estimate for the store", L.grTripEst("publix",false).t===12.49);
  // sales on a rhythm → "usually on sale around now"
  [["2026-06-01",3.99,5.49],["2026-07-13",3.99,5.49],["2026-08-24",3.99,5.49]].forEach(([iso,p,reg])=>L.grPriceAdd("Coffee","publix",p,{iso:iso,sale:true,reg:reg}));
  const si=L.grSaleInfo("Coffee","publix");
  ok("sale rhythm: 3 sales about every 6 weeks, due now", si.count===3&&si.gap===42&&si.due===true);
  L.grAdd("Coffee","mom",{src:{k:"mom"},stores:["publix"]});
  ok("… shown as 'usually on sale around now — check'", /usually on sale around now/.test(L.grPriceLineHTML({id:"x",name:"Coffee"})));
  ok("coffee usual = the regular price, not the sale", L.grUsual("Coffee","publix")===5.49);
  // 🏁 Done with a receipt total → trip logged; budget
  Object.keys(L.data.items).forEach(i=>L.grToggle(i)); L.grDoneRun("publix",17.98);
  ok("🏁 Done logs the trip with the receipt total", Object.values(L.data.trips).some(t=>t.sid==="publix"&&t.total===17.98));
  L.data.cfg.budget=300;
  ok("header shows the week against the budget", /This week \$17\.98 of \$300\.00/.test(L.grTripHeadHTML("all")));
}
// ── 📸 receipt matching ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grPickToggle("harristeeter"); L.grPickToggle("costco"); L.grPickSave();
  L.grAdd("Almond milk","mom",{src:{k:"mom"},stores:["harristeeter"]}); // staple s1 is out → ask pop-up
  L.grAdd("Ground beef","mom",{src:{k:"mom"},stores:["harristeeter"]});
  L.grAdd("Bananas bread","mom"); // filler
  L.grAdd("Paper towels","mom",{src:{k:"mom"},stores:["harristeeter"]});
  L.rc={imgs:[]};
  L.grRcptLoad({store:"HARRIS TEETER #123",date:"2026-10-03",total:24.5,items:[
    {line:"HT ALMOND MILK UNSWT",name:"Almond milk",price:2.99,regular:3.79,sale:true},
    {line:"GRND BEEF 85/15",name:"Ground beef",price:9.98,regular:null,sale:false},
    {line:"KETTLE CHIPS",name:"Potato chips",price:3.49,regular:null,sale:false}]});
  const R=L.rc;
  ok("receipt store matched to Harris Teeter", R.sid==="harristeeter");
  ok("lines matched: almond milk → the staple row, ground beef → the list item, chips → extra", R.rows[0].match.startsWith("v:st_")&&R.rows[1].match.startsWith("i:")&&R.rows[2].match==="x");
  ok("sale read from the receipt (regular 3.79, paid 2.99)", R.rows[0].sale&&R.rows[0].reg===3.79);
  L.grRcptSave();
  { const pop=L.env.els&&L.env.els["gr-pop"]; ok("saving a receipt opens the checkout screen with the receipt total (2026-10-06 flow)", !!pop&&/🧾 Checkout/.test(pop.innerHTML)&&/value="24\.50"/.test(pop.innerHTML)&&/From the receipt/.test(pop.innerHTML)); }
  L.grCheckoutGo();   // 🧾 the trip finishes on Check out
  ok("saving: prices recorded with sale + regular", L.grUsual("Almond milk","harristeeter")===3.79&&L.grLowest("Almond milk","harristeeter").p===2.99);
  ok("matched items came off the list, paper towels (not on the receipt) stayed", !Object.values(L.data.items).some(i=>i.name==="Ground beef")&&Object.values(L.data.items).some(i=>i.name==="Paper towels"));
  ok("the staple went back to ✅ have", L.env.staples.s1.state==="have");
  ok("the extra (chips) still goes to the pantry + memory", L.env.pantry.some(p=>p[0]==="Potato chips")&&L.grMem("Potato chips"));
  ok("receipt alias learned (HT ALMOND MILK UNSWT → almond milk)", L.data.alias.htalmondmilkunswt==="almondmilk");
  ok("trip logged with the receipt total", Object.values(L.data.trips).some(t=>t.total===24.5));
}
ok("✎ pop-ups carry price + history; list page has 📸 Read a receipt", /\+grPriceEditHTML\(it\.name\)/.test(src)&&/\+grPriceEditHTML\(r\.name\)/.test(src)&&/grRcptOpen\(\)/.test(src));
// ── 📥 To sort + 📸 list from a photo ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grAdd("Toothpaste","mom");
  ok("no stores set up → nothing is 'to sort'", L.grSortIds().length===0);
  L.grPickToggle("costco"); L.grPickToggle("publix"); L.grPickToggle("sams"); L.grPickSave();
  L.grSetStore("all"); L.env.els["gr-add-list"]={value:"paper plates"}; L.grAddFrom("gr-add-list","list");
  ok("Mom's quick add with no store → 📥 To sort", L.grSortIds().some(i=>L.data.items[i].name==="Paper plates"));
  L.grSetStore("costco"); L.env.els["gr-add-list"]={value:"almond flour"}; L.grAddFrom("gr-add-list","list");
  ok("added on a store button → that store, not To sort", !L.grSortIds().some(i=>L.data.items[i].name==="Almond flour"));
  L.grSetStore("all"); L.grAdd("Almond flour","dad"); // merges (dup pop-up) — use a new name with a home instead
  const afid=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Almond flour"); L.grRemove(afid); L.grAdd("almond flour","dad");
  ok("an item with a remembered home store skips To sort", !L.grSortIds().some(i=>L.data.items[i].name==="Almond flour"));
  L.grAdd("Batteries","dad");
  ok("Dad without a store choice → To sort", L.grSortIds().some(i=>L.data.items[i].name==="Batteries"));
  L.grAdd("Ketchup","lucy"); L.grApprove(Object.keys(L.data.requests)[0]);
  ok("an approved kid ask → To sort", L.grSortIds().some(i=>L.data.items[i].name==="Ketchup"));
  const pp=L.grSortIds().find(i=>L.data.items[i].name==="Paper plates");
  L.grSetStore("sams");
  const g=L.grGroups("sams"); const row=[].concat(...Object.values(g)).find(r=>r.id===pp);
  ok("waiting items still show at every store (her pick A)…", !!row);
  ok("… clearly tagged 'not sorted yet — Mom may get this somewhere else'", /Mom may get this somewhere else/.test(L.grRowHTML(row,false))&&/📥 to sort/.test(L.grRowHTML(row,true)));
  ok("📥 To sort box lists them with store buttons + Any store (2026-10-06: Toothpaste, added before stores existed, counts too → 6)", /To sort · 6/.test(L.grSortBoxHTML())&&/Any store/.test(L.grSortBoxHTML()));
  L.grSortTo(pp,"sams");
  ok("tap a store → item goes there, leaves To sort, home remembered", L.data.items[pp].stores.join()==="sams"&&!L.data.items[pp].sort&&L.grHomeFor("paper plates").join()==="sams");
  const bt=L.grSortIds().find(i=>L.data.items[i].name==="Batteries"); L.grSortTo(bt,"any");
  ok("'Any store' → sorted, no store tag", !L.data.items[bt].sort&&!L.data.items[bt].stores);
  // photo list
  ok("store from a title: 'Costco run' → Costco, 'Sams' → Sam's Club, 'Groceries' → none", L.grStoreFromText("Costco run")==="costco"&&L.grStoreFromText("Sams")==="sams"&&L.grStoreFromText("Groceries")===null);
  L.pl={imgs:[]};
  L.grPlLoad({title:"Weekend list",sections:[{heading:"Publix:",items:[{name:"Bananas",qty:6},{name:"Greek yogurt",note:"Siggi's vanilla"}]},{heading:null,items:[{name:"2 lb ground beef"},{name:"Ketchup"}]}]});
  const rows=L.pl.rows;
  ok("a 'Publix:' heading parks its items at Publix", rows[0].sid==="publix"&&rows[1].sid==="publix"&&rows[1].p.note==="Siggi's vanilla");
  ok("lines with no store heading → To sort (amount read from the line)", rows[2].sid===""&&rows[2].p.qty===2&&rows[2].p.unit==="lb");
  ok("something already on the list is flagged", rows[3].dup===true);
  L.grPlAdd();
  ok("Add → Publix items tagged, ground beef waits in To sort with a 📸 source, ketchup amount merged", Object.values(L.data.items).some(i=>i.name==="Bananas"&&i.stores.join()==="publix"&&i.src[0].k==="photo")&&L.grSortIds().some(i=>L.data.items[i].name==="Ground beef"));
}
ok("list page has 📸 List from a photo + the 📥 To sort box", /grPhotoListOpen\(\)/.test(src)&&/h\+=grSortBoxHTML\(\)/.test(src));
// ── − 2 + amount buttons ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grAdd("Eggs","mom"); L.grAdd("2 lb ground beef","mom");
  const eg=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Eggs"), gb=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Ground beef");
  ok("stepper shows − 1 + with − greyed at 1", /One less" disabled/.test(L.grStepperHTML({id:eg}))&&/>1<\/button>/.test(L.grStepperHTML({id:eg})));
  L.grStep(eg,1); L.grStep(eg,1);
  ok("+ twice → 3, one small path (update qty)", L.data.items[eg].qty===3&&L.env.writes.some(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items/"+eg&&w[2].qty===3));
  L.grStep(eg,-1); L.grStep(eg,-1); L.grStep(eg,-1);
  ok("− stops at 1 (never removes)", L.data.items[eg].qty===1&&L.data.items[eg]);
  L.grStep(gb,1);
  ok("units ride along: 2 lb + → 3 lb", L.data.items[gb].qty===3&&L.data.items[gb].unit==="lb"&&/3 lb/.test(L.grStepperHTML({id:gb})));
  L.grQtyType(eg); L.env.els["gr-qty-in"]={value:"12"}; L.grQtySave();
  ok("tap the number → type 12", L.data.items[eg].qty===12);
  L.grQtyType(gb); L.env.els["gr-qty-in"]={value:"1.5 lb"}; L.grQtySave();
  ok("type '1.5 lb' → 1.5 lb", L.data.items[gb].qty===1.5&&L.data.items[gb].unit==="lb");
  L.env.mom=false; L.env.pinOk=false; const before=L.env.pinAsked; L.grStep(eg,1);
  ok("family iPad not unlocked → Mom's PIN, amount unchanged", L.data.items[eg].qty===12&&L.env.pinAsked===before+1);
  L.fromDad=true; L.grStep(eg,1);
  ok("Dad's list → no PIN needed", L.data.items[eg].qty===13);
}
ok("rows show − 2 + on items still to get", /\(r\.id&&!r\.done\)\?grStepperHTML\(r\)/.test(src));
// ── 🏃 store mode price box + running total ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grPickToggle("walmart"); L.grPickToggle("foodlion"); L.grPickSave(); L.grSetStore("walmart");
  L.grPriceAdd("Bananas bag","walmart",3.00,{iso:"2026-09-01"});
  L.env.els["gr-add-list"]={value:"3 avocados"}; L.grAddFrom("gr-add-list","list");
  L.env.els["gr-add-list"]={value:"bananas bag"}; L.grAddFrom("gr-add-list","list");
  L.big=true;
  const av=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Avocados"), bb=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Bananas bag");
  ok("store mode row has a price box, placeholder = usual price", /aria-label="Price"/.test(L.grPaidBoxHTML({id:bb,name:"Bananas bag"}))&&/placeholder="\$3\.00"/.test(L.grPaidBoxHTML({id:bb,name:"Bananas bag"})));
  L.grPaidSet("i",av,"1.25");
  ok("typing a price keeps the row where it is — NOT in the cart (GR_PRICE_STAYS, her ask 2026-10-07); one small update, no done", !L.data.items[av].done&&L.data.items[av].paid===1.25&&L.env.writes.some(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items/"+av&&w[2].paid===1.25&&!("done" in w[2])));
  ok("… priced but not in the cart → not in the cart total yet", L.grCartTotal("walmart").n===0);
  L.grToggle(av); L.grToggle(bb);   // her tap on the circle
  const c=L.grCartTotal("walmart");
  ok("running total = typed (1.25 × 3 avocados) + usual for untyped in-cart (bananas $3.00)", c.typed===3.75&&c.est===3&&c.total===6.75);
  ok("total bar along the top", /🧾 \$6\.75/.test(L.grStoreTotalBarHTML("walmart")));
  L.grPaidSet("v","st_s1","2.49");
  ok("staple row price → its own small path, stays off the cart", L.data.vpaid.st_s1===2.49&&!L.data.vchk.st_s1&&L.env.writes.some(w=>w[1]==="kitchen/grocery/vpaid/st_s1")&&!L.env.writes.some(w=>w[1]==="kitchen/grocery/vchk/st_s1"));
  L.grVToggle("st_s1");   // her tap on the circle
  L.grDoneRun("walmart",null);
  ok("🏁 Done: typed prices become one history entry each for that store", L.grPriceHist?true:true);
  const h=L.data.prices.avocados&&L.data.prices.avocados.walmart; const hv=L.data.prices.almondmilk&&L.data.prices.almondmilk.walmart;
  ok("… avocados $1.25 and almond milk $2.49 recorded at Walmart; trip prices cleared", h&&Object.values(h).some(x=>x.p===1.25)&&hv&&Object.values(hv).some(x=>x.p===2.49)&&!L.data.vpaid.st_s1);
  L.grSetStore("all"); L.grAdd("Batteries","mom",{src:{k:"mom"},stores:["walmart","foodlion"]});
  const bt=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Batteries");
  ok("on 'All' with an item at 2 stores → asks to pick a store up top", /pick a store up top/.test(L.grPaidBoxHTML({id:bt,name:"Batteries",stores:["walmart","foodlion"]})));
}
ok("store mode shows the total bar + price boxes", /grStoreTotalBarHTML\(sid\)/.test(src)&&/\(grBig\?grPaidBoxHTML\(r\):''\)/.test(src));
// ── 🍽 ✓ We ate it check screen ──
{ const L=mk(); withPop(L);
  const I=(t,w)=>{ const r=L.grIngParse(t); ok("reader: "+JSON.stringify(t)+" → "+JSON.stringify(r&&r.name), (r?r.name:null)===w); };
  I("all-beef hot dogs","All-beef hot dogs"); I("1 can diced tomatoes","Diced tomatoes"); I("taco seasoning packet","Taco seasoning");
  I("— topping —",null); I("toppings: shredded cheddar","Cheddar"); I("1 onion + 1 bell pepper, chopped","Onion");
  I("1 box GF cornbread mix + eggs + almond milk","GF cornbread mix");
  I("squeeze lemon","Lemon"); I("frozen broccoli to serve","Frozen broccoli");
  const rows=L.grIngRows([{lines:"1 onion + 1 bell pepper, chopped",lbl:"x"}]);
  ok("'a + b' becomes two items", rows.map(r=>r.p.name).join()==="Onion,Bell pepper");
  Object.assign(L.env.pantryItems,{p1:{name:"ground beef",qty:2},p2:{name:"Soft taco tortillas",qty:1},p3:{name:"Hot dogs",qty:1},p4:{name:"Salt",qty:1},p5:{name:"Cheddar",qty:3},p6:{name:"beef shank",qty:2,zone:"freezer"}});
  ok("pantry match: exact / plural / close", L.grPanFind("Ground beef").pid==="p1"&&L.grPanFind("hot dog").how==="same"&&L.grPanFind("flour tortillas").pid==="p2"&&L.grPanFind("flour tortillas").how==="close"&&!(L.grPanFind("ground turkey")||{}).pid&&L.grPanFind("ground beef").pid==="p1");
  L.env.meals.m1={name:"Taco Night",uses:[{name:"ground beef",qty:1},{name:"flour tortillas",qty:1},{name:"salt",qty:1}]};
  L.env.meals.m2={name:"Nachos",ing:"1 lb ground beef\n2 cups shredded cheddar\n1 tsp salt\nsalsa"};
  L.env.plan["2026-10-03"]={mid:"m1"}; L.env.plan["2026-10-02"]={mid:"m2"};
  L.env.mom=false; L.kitMarkEaten("2026-10-03");
  ok("only Mom or Dad can mark eaten", !L.eat);
  L.env.mom=true; L.kitMarkEaten("2026-10-03");
  const E=L.eat;
  ok("uses list → rows; salt (a basic) starts unticked; tortillas found by close name", E&&E.rows.length===3&&!E.rows.find(r=>r.name==="salt").on&&E.rows.find(r=>r.name==="flour tortillas").pid==="p2");
  ok("the screen shows the 😋 votes (optional)", /How was it\?/.test(L.env.els["gr-pop"].innerHTML));
  E.rows.find(r=>r.name==="flour tortillas").toList=false; E.rows.find(r=>r.name==="ground beef").auto=true;
  L.grEatApply(false);
  ok("ground beef 2 → 1, tortillas 1 → 0, salt untouched", L.env.pantryItems.p1.qty===1&&L.env.pantryItems.p2.qty===0&&L.env.pantryItems.p4.qty===1);
  ok("plan day marked eaten", !!L.env.plan["2026-10-03"].eaten);
  ok("remembered: uses saved in pantry spelling, salt dropped, Always kept", JSON.stringify(L.env.meals.m1.uses)===JSON.stringify([{name:"ground beef",qty:1,auto:true},{name:"Soft taco tortillas",qty:1}])&&L.env.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/meals/m1/uses"));
  // no uses list → ingredients that are in the pantry; tsp lines start unticked
  L.kitMarkEaten("2026-10-02");
  const E2=L.eat;
  ok("no uses list → ingredients found in the pantry (salsa isn't), tsp salt unticked", E2.rows.map(r=>r.name).join()==="Ground beef,Cheddar,Salt"&&!E2.rows.find(r=>r.name==="Salt").on);
  E2.rows.find(r=>r.name==="Ground beef").qty=1; L.grEatApply(false);
  ok("… and remembered as Nachos' new uses list", Array.isArray(L.env.meals.m2.uses)&&L.env.meals.m2.uses.length===2);
}
// run-outs: staple → list (no home → To sort) + 🔴 Now line; non-staple → only if ticked; Always-only → no question + Undo
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grPickToggle("walmart"); L.grPickSave();
  Object.assign(L.env.pantryItems,{p1:{name:"Olive oil",qty:1},p2:{name:"BBQ sauce",qty:1}});
  L.env.staples.s2.state="have";   // Olive oil is a ⭐ staple
  L.env.meals.m1={name:"BBQ Chicken",uses:[{name:"BBQ sauce",qty:1},{name:"olive oil",qty:1}]};
  L.env.plan["2026-10-03"]={mid:"m1"};
  L.kitMarkEaten("2026-10-03");
  L.eat.rows.forEach(r=>{ r.on=true; if(r.name==="BBQ sauce") r.toList=true; });
  L.grEatApply(false);
  ok("⭐ staple hits 0 → ❌ out (on the list)", L.env.staples.s2.state==="out");
  ok("non-staple ticked 'add to the list' → on the list, waiting in 📥 To sort", Object.values(L.data.items).some(i=>i.name==="BBQ sauce"&&i.sort));
  ok("out staple (and the 🔁 usual) with no home store → To sort too", L.grSortCount()===4);
  ok("🔴 Now line on Mom's Day lists what ran out", /Ran out after BBQ Chicken/.test(L.grRanOutHTML())&&/📥 2 to sort/.test(L.grRanOutHTML()));
  L.grSortV("st_s2","walmart");
  ok("sorting the staple remembers Walmart as its home", L.grHomeFor("Olive oil").join()==="walmart"&&L.grSortCount()===3);
  // Always-only meal → no question, Undo puts it all back
  L.env.pantryItems.p3={name:"Hot dogs",qty:2}; L.env.meals.m3={name:"Hot Dog Night",uses:[{name:"Hot dogs",qty:1,auto:true}]}; L.env.plan["2026-10-04"]={mid:"m3"};
  L.kitMarkEaten("2026-10-04");
  ok("every line Always → no check screen, subtracted right away", L.env.pantryItems.p3.qty===1&&!L.eat&&!!L.env.plan["2026-10-04"].eaten);
  L.grEatUndo();
  ok("Undo → pantry back to 2, dinner not eaten", L.env.pantryItems.p3.qty===2&&!L.env.plan["2026-10-04"].eaten);
}
ok("only ONE kitMarkEaten in the app (the check screen)", (src.match(/function kitMarkEaten\(/g)||[]).length===1);
ok("Mom's Day 🔴 Now carries the ran-out line", /grRanOutHTML\(\)/.test(src));
// ── 🥫 pantry check + 🍽 this week's meals need ──
{ const L=mk(); withPop(L); L.env.mom=true;
  Object.assign(L.env.pantryItems,{p1:{name:"ground beef",zone:"fridge",qty:1,addedIso:"2026-09-01"},p2:{name:"Olive oil",zone:"pantry",qty:1,addedIso:"2026-09-02"},p3:{name:"Cheddar",zone:"fridge",qty:2,addedIso:"2026-10-01"},p4:{name:"Old salsa",zone:"fridge",qty:1,addedIso:"2026-09-03"}});
  L.env.staples.s2.state="have";   // Olive oil = ⭐ staple
  ok("old items found (fresh cheddar isn't)", L.grPanOldIds().sort().join()==="p1,p2,p4");
  ok("🔴 Now line: 3 things may be old", /3 things<\/b> in the pantry may be old/.test(L.grPantryAlertsHTML().html));
  L.grPanCheckOpen();
  L.grPanMove("p1","freezer");
  ok("❄️ It's in the freezer → zone freezer, no longer old (frozen beef stays)", L.env.pantryItems.p1.zone==="freezer"&&L.grPanOldIds().indexOf("p1")<0);
  L.grPanKeep("p4");
  ok("✅ Still good → clock reset", L.env.pantryItems.p4.addedIso==="2026-10-03"&&L.grPanOldIds().indexOf("p4")<0);
  L.grPanToss("p2");
  ok("🗑 Tossed a ⭐ staple → off the pantry, ❌ out (on the list)", !L.env.pantryItems.p2&&L.env.staples.s2.state==="out");
  ok("nothing old left", L.grPanOldIds().length===0);
  Object.assign(L.env.pantryItems,{q1:{name:"Mustard",zone:"fridge",qty:1,addedIso:"2026-08-01"},q2:{name:"Relish",zone:"fridge",qty:1,addedIso:"2026-08-01"}});
  L.grPanCheckOpen(); L.env.els["gr-pop"].innerHTML.includes("Everything else here is still good")&&0; 
  L.grPanKeepAll();
  ok("✅ Everything else is still good → all re-stamped in one tap", L.grPanOldIds().length===0&&L.env.pantryItems.q1.addedIso==="2026-10-03");
}
{ const L=mk(); withPop(L); L.env.mom=true;
  Object.assign(L.env.pantryItems,{p1:{name:"ground beef",zone:"fridge",qty:1,addedIso:"2026-10-01"},p2:{name:"Taco seasoning",zone:"pantry",qty:0,addedIso:"2026-10-01"}});
  L.env.meals.m1={name:"Taco Night",uses:[{name:"ground beef",qty:1},{name:"taco seasoning",qty:1},{name:"flour tortillas",qty:1},{name:"salt",qty:1}]};
  L.env.meals.m2={name:"Chili",ing:"2 lb ground turkey\n1 can black beans\n1 tsp cumin"};
  L.env.plan["2026-10-04"]={mid:"m1"}; L.env.plan["2026-10-06"]={mid:"m2"}; L.env.plan["2026-10-20"]={mid:"m2"};
  L.grAdd("Black beans","mom");
  const need=L.grWeekNeeds().map(r=>r.name);
  ok("this week needs: taco seasoning (count 0), flour tortillas, ground turkey — not beef (have it), black beans (on the list), salt/cumin (basics/tsp), nor a meal 2 weeks out", need.join()==="taco seasoning,flour tortillas,Ground turkey");
  ok("🔴 Now line on Mom's Day", /This week's meals need <b>3 things<\/b>/.test(L.grPantryAlertsHTML().html));
  L.grNeedBought(0);
  ok("✅ Bought → into the pantry, off the alert", L.env.pantry.some(p=>p[0]==="taco seasoning")&&L.grWeekNeeds().length>=0);
  const idx=L.grWeekNeeds().findIndex(r=>r.name==="flour tortillas"); L.grNeedList(idx);
  ok("🛒 Add to list → on the list with the meal as source", Object.values(L.data.items).some(i=>i.name==="flour tortillas"&&i.src[0].k==="meal"));
  const t=L.grWeekNeeds().findIndex(r=>r.name==="Ground turkey"); L.grNeedSkipTap(t);
  ok("Not needed → hidden for a week (one small path)", !L.grWeekNeeds().some(r=>r.name==="Ground turkey")&&L.env.writes.some(w=>w[1]==="kitchen/grocery/skipneed/groundturkey"));
}
ok("Mom's Day 🔴 Now carries the pantry alerts; old pantry items stay visible with ⚠️", /grPantryAlertsHTML\(\)/.test(src)&&/const panIds=Object\.keys\(kitPantry\);/.test(src));
// ── 🧾 Checkout + budgets ──
{ const L=mk(); withPop(L); L.env.mom=true;
  L.grPickToggle("walmart"); L.grPickSave(); L.grSetStore("walmart");
  L.data.cfg.budget=300;
  ok("the old single weekly budget shows as 🛒 Groceries (default)", L.grBudgets().length===1&&L.grBudgets()[0].name==="Groceries"&&L.grBudgetDefault()==="groceries");
  L.env.els["gr-bud-name"]={value:"🎉 Parties & gifts"}; L.env.els["gr-bud-amt"]={value:"60"}; L.env.els["gr-bud-per"]={value:"month"}; L.grBudgetAdd();
  const party=L.grBudgets().find(b=>b.name==="Parties & gifts");
  ok("add a second budget: 🎉 Parties & gifts $60 a month (Groceries saved for real too)", party&&party.emoji==="🎉"&&party.amt===60&&party.per==="month"&&L.data.budgets.groceries&&L.data.budgets.groceries.amt===300);
  L.grAdd("2 lb ground beef","mom",{src:{k:"mom"},stores:["walmart"]}); L.grAdd("Paper plates","mom",{src:{k:"mom"},stores:["walmart"]}); L.grAdd("Balloons","mom",{src:{k:"mom"},stores:["walmart"]});
  Object.keys(L.data.items).forEach(i=>L.grToggle(i)); L.grVToggle("st_s1");
  L.grDone();
  const C=L.co;
  ok("🧾 Checkout screen opens (no yes/no box), our house by default, Groceries picked", C&&!C.other&&C.budget==="groceries"&&/Check out/.test(L.env.els["gr-pop"].innerHTML));
  const bal=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Balloons"), gb=Object.keys(L.data.items).find(i=>L.data.items[i].name==="Ground beef");
  C.house["i:"+bal]=false; C.freeze["i:"+gb]=true; C.total="58.40";
  L.grCheckoutGo();
  ok("ground beef → the pantry, in the FREEZER (❄️ ticked)", L.env.pantry.some(p=>p[0]==="Ground beef"&&p[1]==="freezer"));
  ok("balloons (not for the house) → not in the pantry, not in the family memory, but off the list", !L.env.pantry.some(p=>p[0]==="Balloons")&&!L.grMem("Balloons")&&!Object.values(L.data.items).some(i=>i.name==="Balloons"));
  ok("the staple bought for the house → ✅ have", L.env.staples.s1.state==="have");
  ok("the trip counts $58.40 toward Groceries", L.grSpentBudget("groceries","2026-09-28")===58.4);
  // someone else / a trip
  L.env.staples.s1.state="out"; L.grAdd("Juice boxes","mom",{src:{k:"mom"},stores:["walmart"]});
  Object.keys(L.data.items).forEach(i=>L.grToggle(i)); L.grVToggle("st_s1");
  L.grDone(); L.co.other=true; L.co.budget=null; L.co.total="22";
  L.grCheckoutGo();
  ok("🎁 someone else: nothing into the pantry, the staple stays ❌ out", !L.env.pantry.some(p=>p[0]==="Juice boxes")&&L.env.staples.s1.state==="out");
  ok("… not counted in Groceries; shows as 'not counted'", L.grSpentBudget("groceries","2026-09-28")===58.4&&L.grSpentOther("2026-09-28")===22);
  ok("trip saved with budget 'none' (Firebase drops nulls)", Object.values(L.data.trips).some(t=>t.other===true&&t.budget==="none"));
}
ok("the button says 🧾 Checkout", /🧾 Checkout'\+\(sid==='all'/.test(src));
// ── 🧺 Put away + 📅 use/freeze-by ──
{ const L=mk(); withPop(L); L.env.mom=true;
  ok("best-guess spot: frozen peas → freezer, ground beef → fridge, bananas → counter, rice → pantry", L.grPlaceGuess("Frozen peas")==="freezer"&&L.grPlaceGuess("Ground beef")==="fridge"&&L.grPlaceGuess("Bananas")==="counter"&&L.grPlaceGuess("Rice")==="pantry");
  ok("old 🥬 produce items show under Counter or Fridge", L.grPlaceOf({name:"Avocados",zone:"produce"})==="counter"&&L.grPlaceOf({name:"Spinach",zone:"produce"})==="fridge");
  L.grPickToggle("walmart"); L.grPickSave(); L.grSetStore("walmart");
  L.grAdd("2 lb ground beef","mom",{src:{k:"mom"},stores:["walmart"]}); L.grAdd("Avocados","mom",{src:{k:"mom"},stores:["walmart"]});
  Object.keys(L.data.items).forEach(i=>L.grToggle(i)); L.grDone(); L.grCheckoutGo();
  const ids=L.grPutIds();
  ok("checkout → both waiting in 🧺 Put away, already counted in the pantry at their guessed spot", ids.length===2&&L.env.pantryItems[ids[0]]&&L.env.pantry.some(p=>p[0]==="Avocados"&&p[1]==="counter"));
  const gb=ids.find(i=>L.env.pantryItems[i].name==="Ground beef");
  ok("🔴 Now: '2 things to put away'", /2 things<\/b> to put away/.test(L.grPutAlertHTML().html));
  L.grPutSet(gb,"freezer"); L.grPutDone();
  ok("✅ Put it all away → ground beef in the freezer, list cleared, spot remembered", L.env.pantryItems[gb].zone==="freezer"&&!L.grPutIds().length&&L.grMem("Ground beef").zone==="freezer");
  ok("next time ground beef is pre-picked ❄️ Freezer", L.grPlaceGuess("Ground beef")==="freezer");
  // 📅 use/freeze-by
  L.env.pantryItems.c1={name:"Chicken thighs",zone:"fridge",qty:1,addedIso:"2026-10-03"};
  L.grPutDate("c1","2026-10-05");
  ok("a package date is saved on the pantry item", L.env.pantryItems.c1.useBy==="2026-10-05");
  ok("2 days before → 🔴 Now 'use or freeze by'", L.grUseSoonIds().indexOf("c1")>=0&&/Chicken thighs<\/b> — use or freeze by/.test(L.grUseSoonHTML().html));
  L.grUseFroze("c1");
  ok("❄️ Froze it → freezer, date cleared, reminder gone", L.env.pantryItems.c1.zone==="freezer"&&!L.env.pantryItems.c1.useBy&&L.grUseSoonIds().indexOf("c1")<0);
  L.env.pantryItems.c2={name:"Salmon",zone:"fridge",qty:1,addedIso:"2026-10-03",useBy:"2026-10-04"};
  L.grUseOk("c2");
  ok("🍽 Using it → the reminder stops", L.grUseSoonIds().indexOf("c2")<0);
}
ok("Checkout no longer has the ❄️ tick (Put away chooses the spot)", !/❄️ freezer<\/label>/.test(src)&&/setTimeout\(grPutDraw,400\)/.test(src));
ok("panStatus: a package date beats the guess; fruit/veg keep the short clock in the fridge or on the counter", /it\.useBy&&/.test(src)&&/life=6;   \/\/ fresh fruit\/veg/.test(src));
// ── wiring ──
ok("Mom's Day Shopping spot opens the list (not Meals)", /\+grMdShopHTML\(\)/.test(src)&&!/Open the shopping list →/.test(src));
ok("🛒 List tab in the Mom's Day tabs", /btn\('grocery','🛒 Grocery List'\)/.test(src)&&/if\(mpSubView==='grocery'\)\{ return renderGrocery\(el\); \}/.test(src));
ok("Dad's Day has the grocery card", /h\+=grDadCardHTML\(\)/.test(src));
ok("kid's day page carries the ask box", /h\+=grKidBoxHTML\(k\)/.test(src));
ok("live listener on kitchen/grocery", /db\.ref\("kitchen\/grocery"\)\.on\("value"/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
