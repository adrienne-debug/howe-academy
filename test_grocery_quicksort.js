// 🏬 Quick sort from All (her ask 2026-10-04): store buttons on unsorted rows, 💡 suggestion only, ☐ Sort several.
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
      grSortGuess,grSecGuess,grQsChipsHTML,grQsToggle,grQsPick,grQsAll,grQsSend,grQsKeys,grQsBarHTML,grQsBtnHTML,grSortItem,grSortVirt,get qs(){return grQs;},get qsSel(){return grQsSel;},
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


const setup=()=>{ const L=mk(); withPop(L); L.env.mom=true;
  L.data.stores={wm:{name:"Walmart",color:"#0071ce",trips:5},ht:{name:"Harris Teeter",color:"#00843d",trips:3}}; return L; };
const sortRow=(L,id)=>{ const g=L.grGroups("all"); let r=null; Object.keys(g).forEach(k=>g[k].forEach(x=>{ if(x.id===id) r=x; })); return r; };
// ── store buttons on an unsorted row (All) ──
{ const L=setup(); L.grAdd("Zorblax","mom"); const id=Object.keys(L.data.items)[0];
  ok("new item with no home waits to sort", L.data.items[id].sort===true);
  const h=L.grRowHTML(sortRow(L,id),true);
  ok("All row shows each store button + Any", h.indexOf("grSortTo('"+id+"','wm')")>0&&h.indexOf("grSortTo('"+id+"','ht')")>0&&h.indexOf("grSortTo('"+id+"','any')")>0);
  ok("buttons don't also tick the cart", (h.match(/event\.stopPropagation\(\);grSortTo/g)||[]).length===3);
  ok("no guess → no ✓ and no 💡", h.indexOf("✓ Walmart?")<0&&h.indexOf("💡")<0);
  ok("a store's own view shows no buttons", L.grRowHTML(sortRow(L,id),false).indexOf("grSortTo(")<0);
  L.grSortTo(id,"ht");
  ok("one tap: store set, home remembered, out of To sort", JSON.stringify(L.data.items[id].stores)==='["ht"]'&&!L.data.items[id].sort&&JSON.stringify(L.data.home.zorblax)==='["ht"]');
  ok("… row no longer shows buttons", L.grRowHTML(sortRow(L,id),true).indexOf("grSortTo(")<0);
}
// ── 💡 suggestion: shown, never applied on its own ──
{ const L=setup(); L.data.prices={plantains:{ht:{p1:{p:0.69,iso:"2026-09-20"}}}};
  L.grAdd("Plantains","mom"); const id=Object.keys(L.data.items)[0];
  const g=L.grSortGuess("Plantains","produce");
  ok("bought it at one store → suggests it", g&&g.sid==="ht"&&/Harris Teeter/.test(g.why));
  const h=L.grRowHTML(sortRow(L,id),true);
  ok("suggested button reads ✓ Harris Teeter? + why", h.indexOf("✓ Harris Teeter?")>0&&h.indexOf("💡 you&#39;ve")<0&&h.indexOf("💡 you've bought it at Harris Teeter")>0);
  ok("suggestion does NOT move it (still to sort, no store)", L.data.items[id].sort===true&&!L.data.items[id].stores);
  L.grSortTo(id,"wm");
  ok("tapping another store = no → goes there + becomes its home", JSON.stringify(L.data.items[id].stores)==='["wm"]'&&JSON.stringify(L.data.home.plantains)==='["wm"]');
}
{ const L=setup(); L.data.prices={milk:{wm:{a:{p:3.48,iso:"2026-09-01"}},ht:{b:{p:4.29,iso:"2026-09-02"}}}};
  const g=L.grSortGuess("Milk","dairy");
  ok("priced at two → cheapest, with the price", g&&g.sid==="wm"&&/cheapest at Walmart \(\$3\.48\)/.test(g.why));
}
{ const L=setup(); L.data.home={apples:["ht"],carrots:["ht"],lettuce:["wm"],rice:["wm"],beans:["wm"]};
  const g=L.grSortGuess("Celery","produce");
  ok("no price → the store most of that section comes from", g&&g.sid==="ht"&&/most of your Produce comes from Harris Teeter/.test(g.why));
  L.data.home={apples:["ht"]};
  ok("one item isn't a pattern → no guess", L.grSortGuess("Celery","produce")===null);
  L.data.home={apples:["ht"],carrots:["ht"],lettuce:["wm"],kale:["wm"]};
  ok("a tie isn't a majority → no guess", L.grSortGuess("Celery","produce")===null);
  L.data.stores.ht.hidden=true; L.data.home={apples:["ht"],carrots:["ht"]};
  ok("hidden store is never suggested", L.grSortGuess("Celery","produce")===null);
}
// ── staples/usuals with no home get the buttons too ──
{ const L=setup(); const g=L.grGroups("all"); let v=null; Object.keys(g).forEach(k=>g[k].forEach(x=>{ if(x.key==="st_s1") v=x; }));
  ok("out staple with no home is a sort row", v&&v.sort);
  const h=L.grRowHTML(v,true);
  ok("… with grSortV buttons", h.indexOf("grSortV('st_s1','wm')")>0&&h.indexOf("grSortV('st_s1','any')")>0);
}
// ── ☐ Sort several ──
{ const L=setup(); L.grAdd("Zorblax","mom"); L.grAdd("Flibber","mom"); L.grAdd("Quux","mom");
  const ids=Object.keys(L.data.items);
  ok("button shows count on All", /Sort several · 📥 5/.test(L.grQsBtnHTML()));   // 3 items + 2 virt (Almond milk out, Bananas usual)
  L.grQsToggle(); ok("sort several on", L.qs===true);
  const h=L.grRowHTML(sortRow(L,ids[0]),true);
  ok("in sort several: tick box, no cart circle, no per-row buttons", h.indexOf('role="checkbox"')>0&&h.indexOf("Put in the cart")<0&&h.indexOf("grSortTo(")<0&&h.indexOf("grQsPick('i:"+ids[0]+"')")>0);
  ok("bar: nothing ticked → buttons disabled", /Tick the items, then pick a store/.test(L.grQsBarHTML())&&/disabled/.test(L.grQsBarHTML()));
  L.grQsSend("wm"); ok("send with none ticked → just a nudge, nothing moves", L.env.toasts.pop()==="Tick the items to sort first"&&ids.every(i=>L.data.items[i].sort));
  L.grQsPick("i:"+ids[0]); L.grQsPick("i:"+ids[1]); L.grQsPick("v:st_s1");
  ok("bar says Send 3 to:", /Send 3 to:/.test(L.grQsBarHTML()));
  L.grQsPick("i:"+ids[1]); ok("tap again unticks", /Send 2 to:/.test(L.grQsBarHTML()));
  L.env.mom=false; L.env.pinOk=false; L.grQsSend("ht");
  ok("not Mom → PIN asked, nothing moved", L.env.pinAsked===1&&L.data.items[ids[0]].sort===true);
  L.env.mom=true; L.grQsSend("ht");
  ok("send: both to Harris Teeter, homes remembered", JSON.stringify(L.data.items[ids[0]].stores)==='["ht"]'&&JSON.stringify(L.data.home.zorblax)==='["ht"]'&&JSON.stringify(L.data.home.almondmilk)==='["ht"]');
  ok("unticked one untouched", L.data.items[ids[1]].sort===true);
  ok("toast counts them", L.env.toasts.pop()==="🏬 2 → Harris Teeter");
  ok("ticks cleared, still in sort several (more left)", Object.keys(L.qsSel).length===0&&L.qs===true);
  L.grQsAll(); ok("Tick all ticks every one left", L.grQsKeys().length===3&&L.grQsKeys().every(k=>L.qsSel[k]));
  L.grQsAll(); ok("… again unticks all", Object.keys(L.qsSel).length===0);
  L.grQsAll(); L.grQsSend("any");
  ok("Any store: items storeless, not to sort; usual home = any", !L.data.items[ids[1]].stores&&!L.data.items[ids[1]].sort&&L.data.home.bananas==="any");
  ok("nothing left → sort several closes itself", L.qs===false&&L.grQsKeys().length===0);
}
{ const L=setup(); L.grAdd("Zorblax","mom"); const id=Object.keys(L.data.items)[0];
  L.grQsToggle(); L.grQsPick("i:"+id); L.grSortTo(id,"wm"); L.env.toasts.length=0;
  L.grQsSend("ht"); ok("a tick on something already sorted elsewhere is ignored", JSON.stringify(L.data.items[id].stores)==='["wm"]'&&L.env.toasts.pop()==="Tick the items to sort first");
}
// ── wiring in the page ──
const rg=fn("renderGrocery");
ok("List tab: Sort several button only on All with something to sort", /\(sid==='all'&&grSortCount\(\)\)\?grQsBtnHTML\(\)/.test(rg));
ok("List tab: send bar only on All while sorting", /if\(sid==='all'&&grQs\) h\+=grQsBarHTML\(\)/.test(rg));
ok("block markers present once", src.split("// GR_QUICKSORT_START").length===2&&src.split("// GR_QUICKSORT_END").length===2);
ok("no 🔀 added", src.indexOf("\u{1F500}")<0);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
