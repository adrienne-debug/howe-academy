/* 🛒 GROSYNC — the grocery list follows meal changes (Adrienne's decisions 2026-10-23, final).
 *   · Shop for the week records, per item, which planned meal asked for how much: items/{id}/srcs/{iso}_{slot}_{mid} = {qty,unit?,meal,day};
 *     qty = manual + the sum of its srcs; an item without srcs is untouched
 *   · a meal that comes off a day in the next 14 days (a different dinner, ✗ didn't happen, 🍽 eating out, a move out of the window,
 *     a Run replacing the day) → ONE sheet "<Meal> (Tue) came off the plan. Pull its items from the list?" listing only THAT meal's
 *     amounts — a shared item shrinks, a sole item is removed, a bought item starts unticked; Keep writes nothing
 *   · the same meal moving to another day inside the window never asks — its srcs key moves
 *   · a meal added to a day when the list already holds Shop-for-the-week items → "Add <Meal> (Thu)'s items?" with have / pantry / new,
 *     added through the very path Shop for the week uses
 *   · ▶ Run with hand-planned days: one sheet, three choices (drop · slide · replace), asked every time, nothing remembered; the slide
 *     chains past the kept day into the next week and the cut-off drops the overflow and names it
 *   · the Snack row shows on every day for Mom (same picker), not for a kid; ✕ Clear in the dinner picker leaves b/l/s
 *   · a family with no list gets no prompts; with no meal change everything reads byte-identically to the app without the block
 *   run: node test_grocery_sync.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,700)+")":"")); } };
const J=v=>JSON.stringify(v);
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<i) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// GROSYNC_START","// GROSYNC_END");

console.log("── the block and its hooks ──");
{ const ka=src.indexOf("// GROSYNC_START"), kb=src.indexOf("// GROSYNC_END");
  ok("GROSYNC block present once, right after GROCERY_LIST_END", ka>0&&kb>ka&&src.indexOf("// GROSYNC_START",ka+5)<0&&src.slice(src.indexOf("// GROCERY_LIST_END"),ka).replace(/\/\/ ([A-Z0-9_]+)_START[\s\S]*?\/\/ \1_END\n/g,"").trim()==="// GROCERY_LIST_END");
  const watch=/if\(typeof grSyncWatch==="function"\) grSyncWatch\(\);/;
  ["kitAssign","kitSideSave","kitSlotsSet","kitSlotText","kitMarkSkipped","kitMoveForward","kitOutToggle","kitRotDaySet","kitRotRun"].forEach(f=>{ const s=fn(f); ok("plan-change hook in "+f+" — one line, guarded", (s.match(/grSyncWatch/g)||[]).length===2&&watch.test(s)); });
  ok("kitRotAutoStart and kitRotRunWrite are NOT hooked (the queued→running hand-off changes nothing for the shopper)", !/grSync/.test(fn("kitRotAutoStart"))&&!/grSync/.test(fn("kitRotRunWrite")));
  ok("kitRotRun: the plan is laid before the clash check, hands kept days to the sheet, skips its confirm when a choice comes back", /if\(!queued&&plan\.kept\.length&&!choice&&typeof grSyncRunAsk==="function"\)\{ grSyncRunAsk\(id,draft,plan\); return; \}/.test(fn("kitRotRun"))&&/if\(!choice&&!confirm\(msg\)\) return;/.test(fn("kitRotRun"))&&fn("kitRotRun").indexOf("grSyncRunAsk")<fn("kitRotRun").indexOf("kitRotClash(id,types,from,to)")&&!/kit-rot-ow-/.test(fn("kitRotRun")));
  ok("kitRotRunPlan counts a slid stamp as the rotation's own", /st&&st\.id===id&&\(st\.slid\|\|\(st\.wk===info\.wk&&st\.dow===info\.dow\)\)/.test(fn("kitRotRunPlan")));
  ok("the run row has no overwrite tick", !/kit-rot-ow-/.test(fn("kitRotRunRowHTML")));
  ok("_calSlotRows: the Snack row hook sits after the KITSLOTS b/l line, guarded", /sp\[0\]==="s"&&typeof grSyncSnackRowHTML==="function"\)\{ html\+=grSyncSnackRowHTML\(iso,sp\); n\+\+; return; \}/.test(fn("_calSlotRows"))&&fn("_calSlotRows").indexOf("grSyncSnackRowHTML")>fn("_calSlotRows").indexOf("kitSlotsRowHTML(iso,sp)"));
  ok("the picker's kind-\"p\" handlers hand slot \"s\" here, after the KITDINNEREDIT line", /^function kitSlotsPickCur\(P\)\{ if\(P\.slot==="d"[^\n]*\n  if\(P\.slot==="s"&&typeof grSyncSnackCur==="function"\) return grSyncSnackCur\(P\);/m.test(src)&&/^function kitSlotsPickSet\(P,val\)\{ if\(P\.slot==="d"[^\n]*\n  if\(P\.slot==="s"&&typeof grSyncSnackSet==="function"\) return grSyncSnackSet\(P,val\);/m.test(src));
  ok("kitDinPickSet: ✕ Clear (null) comes here before kitAssign", /if\(!val&&typeof grSyncDinClear==="function"\) return grSyncDinClear\(P\.iso\);/.test(fn("kitDinPickSet"))&&/kitAssign\(P\.iso,val\)/.test(fn("kitDinPickSet")));
  ok("grFromWeek tags its rows; grImpAdd / the near-dup path record srcs after the list's own write", /const rows=grIngRows\(src\); if\(typeof grSyncRows==="function"\) grSyncRows\(rows,_todayStr\(\),7\);/.test(fn("grFromWeek"))&&/grPut\(dup\.id,it\); merged\+\+; if\(typeof grSyncRec==="function"\) grSyncRec\(dup\.id,r\);/.test(fn("grImpAdd"))&&/const nid=grCreate\(r\.p,src,null\); added\+\+; if\(typeof grSyncRec==="function"\) grSyncRec\(nid,r\);/.test(fn("grImpAdd"))&&/grSyncRec\(id,P\.row\)/.test(fn("grNearSame"))&&/grSyncRec\(nid,P\.row\)/.test(fn("grNearBoth")));
  ok("grSetQty keeps manual true", /if\(typeof grSyncManual==="function"\) grSyncManual\(id\);/.test(fn("grSetQty")));
  ok("grWeekNeeds is unchanged (no sync code in it)", !/grSync|srcs/.test(fn("grWeekNeeds")));
  const refs=(BLOCK.replace(/\/\/[^\n]*/g,"").match(/d\.ref\('[^']*'(?:\+[^)]*)?\)/g)||[]).map(s=>s.replace(/\+[^)]*\)$/,"+…)"));
  ok("every write in the block goes through grSyncDb (db && !_dryRun) and only to kitchen/grocery/items… or kitchen/plan/{iso}", refs.length>0&&refs.every(r=>/^d\.ref\('kitchen\/(grocery\/items|plan\/')/.test(r))&&!/\bdb\.ref\(/.test(BLOCK.replace(/\/\/[^\n]*/g,"")), refs);
  ok("nothing in the block remembers a Run choice", !/HA_LS\.setItem\('ha_(?!kit_plan')/.test(BLOCK)&&!/localStorage/.test(BLOCK));
  ok("no 🔀 anywhere", src.indexOf("🔀")<0);
}

// ── a tiny app around the real slices (o.base = the app without the GROSYNC block, every hook idle) ──
const MEALS={m1:{name:"Tacos",emoji:"🌮",ing:"1 lb ground beef\n8 corn tortillas\n1 cup salsa"},m2:{name:"Burgers",emoji:"🍔",ing:"1 lb ground beef\nburger buns"},
  m3:{name:"Roasted Broccoli",emoji:"🥦",ing:"2 heads broccoli",tags:["side"]},m4:{name:"Oatmeal",emoji:"🥣",ing:"rolled oats\nmilk"},
  m5:{name:"Chili",emoji:"🌶",ing:"1 lb ground beef\n2 cans beans"},m6:{name:"Fruit Salad",emoji:"🍓",ing:"strawberries\ngrapes"}};
function world(o){
  o=o||{};
  const W={writes:[],toasts:[],confirms:[],renders:0,mom:!("mom" in o)||o.mom,dry:!!o.dry,yes:true,prompt:null,els:{},ls:{},today:o.today||"2026-10-26",pop:{innerHTML:""}};
  const ref=p=>({set:v=>W.writes.push(["set",p,JSON.parse(J(v))]),update:v=>{ W.writes.push(["update",p,JSON.parse(J(v))]); return Promise.resolve(); },remove:()=>W.writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,Promise,setTimeout:()=>0,navigator:{},
    db:{ref:ref},HA_LS:{getItem:k=>(k in W.ls?W.ls[k]:null),setItem:(k,v)=>{ W.ls[k]=String(v); }},mwToast:m=>W.toasts.push(m),
    momHere:()=>W.mom,_dryRun:()=>W.dry,dadAwardOk:()=>false,_kioskD:()=>false,kitPinGate:(then)=>{ if(W.mom) then(); },
    _todayStr:()=>W.today,calToday:()=>W.today,gwParseDate:iso=>new Date(iso+"T12:00:00"),kitOpenRecipe:()=>{},wbMomEyes:()=>false,KID_COLOR:{lucy:"#777"},kcAddIso:null,
    renderAll:()=>{ W.renders++; },renderMomsPlan:()=>{ W.renders++; },confirm:m=>{ W.confirms.push(m); return W.yes; },prompt:()=>W.prompt,mpGoto:()=>{},
    kitFlagMark:()=>"",kitRateChips:()=>"",kitPrepSteps:()=>[],kitWhenLabel:w=>w,kitPlanText:()=>{},kitOrderList:()=>({need:[],usuals:{}}),panStatus:()=>"fresh",
    kitPantry:o.pantry||{},kitStaples:{},kitPrepDone:{},tab:"schedule",ROSTER_DEF:[],momdayData:{},HA_IS_HOWE:false,
    document:{getElementById:id=>id==="gr-pop"?W.pop:(W.els[id]||null),querySelectorAll:()=>[],createElement:()=>W.pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx);
  const run=e=>vm.runInContext(e,ctx);
  run(line("const KIT_FRAC_GLYPH=")+fn("esc")+fn("kitSlug")+fn("kitQtyParse")+fn("kitIsoPlus"));
  run("var kitMeals="+J(o.meals||MEALS)+"; var kitPlan="+J(o.plan||{})+"; var kitRotations="+J(o.rots||{})+"; var kitPickIso=null, kitRotOpen=null, kitRotSaveOpen=false, kitWkImportOpen=false, kitEditId=null, kitView=null;");
  run(cut("// KITSIDES_START","// KITSIDES_END"));
  run(cut("// SHOPNAME_START","// SHOPNAME_END"));   // SHOPNAME: the list's name constant
  run(cut("// GROCERY_LIST_START","// GROCERY_LIST_END")); ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grRepaint=()=>{ W.renders++; };
  run([line("const KIT_ROT_DEFAULT="),line("const KIT_SLOTS="),line("const KIT_TAGS="),line("const KIT_ROT_DAYS="),line("const KIT_MOVE_NAMES="),
       fn("kitPlanFor"),fn("kitSidesTxt"),fn("kitPlanSlot"),fn("kitSlotText"),fn("_calDinnerOf"),fn("_calSlotRows"),fn("kitEatGate"),fn("_kitRefresh"),fn("kitAssign"),fn("kitMarkSkipped"),
       fn("_kitMvGet"),fn("_kitMvFixed"),fn("kitMoveChain"),fn("kitMoveForward"),fn("kitOutIs"),fn("kitOutToggle"),fn("kitOutLbl"),fn("kitOutBtn"),fn("kitOutStrip"),fn("kitFlagDb"),fn("kitFlagPlanLS"),
       fn("kitRotAll"),fn("kitRotEnsure"),fn("kitRotMealByName"),fn("kitRotSlotVal"),fn("kitRotSlotName"),fn("kitRotMondayOf"),fn("kitRotPlanFor"),fn("kitRotCapture"),fn("kitRotRender"),fn("kitRotApply"),
       cut("// KIT_ROT_EDIT_START","// KIT_ROT_EDIT_END"),cut("// KITROT2_START","// KITROT2_END"),cut("// KITSLOTS_START","// KITSLOTS_END"),cut("// KITDINNEREDIT_START","// KITDINNEREDIT_END"),
       fn("calDaySheetHTML")].join("\n"));
  if(!o.base) run(BLOCK);
  run("kitRotSynced.plan=true; kitRotSynced.rots=true;");
  if(o.items) run("grData.items="+J(o.items));
  W.run=run; W.ctx=ctx; W.plan=()=>run("kitPlan"); W.items=()=>run("grData.items");
  W.item=name=>{ const I=W.items(); const id=Object.keys(I).find(k=>I[k].name===name); return id?Object.assign({id:id},I[id]):null; };
  W.gw=()=>W.writes.filter(w=>/^kitchen\/grocery/.test(w[1])); W.pw=()=>W.writes.filter(w=>/^kitchen\/plan/.test(w[1]));
  W.act=code=>{ run(code); if(!o.base) run("grSyncReconcile()"); return W.pop.innerHTML; };   // a hook's snapshot, then the reconcile the microtask would run
  W.sheet=(iso,who)=>run("calDaySheetHTML('"+iso+"',{meals:true},_calDinnerOf,"+(who?"'"+who+"'":"null")+",{noWork:true,noClose:true,flat:true})");
  W.setRot=(id,rot)=>run("kitRotations["+J(id)+"]="+J(rot));
  W.runBtn=(id,from,to)=>{ W.els["kit-rot-from-"+id]={value:from}; W.els["kit-rot-to-"+id]={value:to}; run("kitRotApply("+J(id)+")"); if(!o.base) run("grSyncReconcile()"); return W.pop.innerHTML; };
  W.shop=()=>{ run("grFromWeek()"); run("grImpAdd()"); };
  return W;
}
const MON="2026-10-26", TUE="2026-10-27", WED="2026-10-28", THU="2026-10-29", FRI="2026-10-30", SAT="2026-10-31", SUN="2026-11-01";
const PLAN=()=>({[MON]:{mid:"m1",sideList:[{mid:"m3"}]},[TUE]:{mid:"m2"},[WED]:{b:{mid:"m4"}}});
const strip=h=>String(h).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

console.log("\n── 1. Shop for the week records who asked for how much ──");
{ const W=world({plan:PLAN(),items:{x1:{name:"Milk",src:[{k:"mom"}],ts:1},x2:{name:"Eggs",qty:12,src:[{k:"mom"}],ts:1}}});
  W.run("grFromWeek()");
  const rows=W.run("_grImp.rows"); const beef=rows.find(r=>r.p.name==="Ground beef");
  ok("the preview rows carry their per-meal amounts (ground beef: Tacos Mon 1 lb + Burgers Tue 1 lb = 2 lb)", beef&&beef.p.qty===2&&beef.p.unit==="lb"&&J(beef.srcs)===J([{key:MON+"_d_m1",meal:"Tacos",day:"Mon",qty:1,unit:"lb"},{key:TUE+"_d_m2",meal:"Burgers",day:"Tue",qty:1,unit:"lb"}]), beef);
  ok("a side's lines are keyed to the side (sd) and a breakfast's to its slot", J(rows.find(r=>r.p.name==="Broccoli").srcs)===J([{key:MON+"_sd_m3",meal:"Roasted Broccoli",day:"Mon",qty:2,unit:"heads"}])&&rows.find(r=>r.p.name==="Rolled oats").srcs[0].key===WED+"_b_m4");
  W.run("_grImp.rows.find(r=>r.p.name==='Milk').on=true");   // "on list" rows start unticked, as Shop for the week always did — she ticks it
  W.run("grImpAdd()");
  const it=W.item("Ground beef");
  ok("the item: qty 2 lb, two srcs, no manual", it&&it.qty===2&&it.unit==="lb"&&J(it.srcs)===J({[MON+"_d_m1"]:{qty:1,meal:"Tacos",day:"Mon",unit:"lb"},[TUE+"_d_m2"]:{qty:1,meal:"Burgers",day:"Tue",unit:"lb"}})&&it.manual===undefined, it);
  const up=W.gw().find(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items/"+it.id);
  ok("…written as ONE targeted update of items/{id}/srcs/{key} after the list's own set", !!up&&J(up[2])===J({["srcs/"+MON+"_d_m1"]:{qty:1,meal:"Tacos",day:"Mon",unit:"lb"},["srcs/"+TUE+"_d_m2"]:{qty:1,meal:"Burgers",day:"Tue",unit:"lb"}})&&W.gw().findIndex(w=>w[0]==="set"&&w[1]==="kitchen/grocery/items/"+it.id)<W.gw().indexOf(up), W.gw());
  const milk=W.item("Milk");
  ok("an item she already had gets the meal's src and manual = what was hers (Milk ×1 + Oatmeal's milk → qty 2, manual 1)", milk.qty===2&&milk.manual===1&&J(Object.keys(milk.srcs))===J([WED+"_b_m4"])&&W.gw().some(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items/x1"&&w[2].manual===1&&w[2]["srcs/"+WED+"_b_m4"]), milk);
  const eggs=W.item("Eggs");
  ok("an item no meal asked for is untouched — no srcs, no write", eggs.qty===12&&!eggs.srcs&&eggs.manual===undefined&&!W.gw().some(w=>w[1].indexOf("/x2")>0));
  ok("a line with no amount counts as 1 (burger buns → qty 1 src)", W.item("Burger buns").srcs[TUE+"_d_m2"].qty===1&&!("unit" in W.item("Burger buns").srcs[TUE+"_d_m2"]));
  W.writes.length=0; W.run("grSetQty('"+it.id+"',5)");
  ok("she retypes the amount → manual = the part no meal asked for (5 − 2 = 3), one targeted write", W.item("Ground beef").manual===3&&W.gw().some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/items/"+it.id+"/manual"&&w[2]===3));
  W.writes.length=0; W.run("grSetQty('"+it.id+"',2)");
  ok("…and back to the meals' sum → manual leaves (null)", W.item("Ground beef").manual===undefined&&W.gw().some(w=>w[1]==="kitchen/grocery/items/"+it.id+"/manual"&&w[2]===null));
}

console.log("\n── 2. a meal comes off the plan → the pull sheet (only that meal's amounts) ──");
{ const W=world({plan:PLAN()}); W.shop(); W.writes.length=0;
  const h=W.act("kitAssign('"+TUE+"',{mid:'m5'})");   // Burgers → Chili on Tuesday
  ok("the sheet names the meal and the day", /🛒 Burgers \(Tue\) came off the plan\./.test(h)&&/Pull its items from the list\?/.test(h), strip(h).slice(0,200));
  const A=W.run("_grSyncAsk");
  ok("it lists only Burgers' amounts: ground beef −1 lb (2 lb → 1 lb), burger buns 1 → 0 · off the list — tortillas and salsa are not on it", A.kind==="pull"&&A.rows.length===2&&A.rows[0].name==="Ground beef"&&A.rows[0].minusTxt==="−1 lb"&&A.rows[0].resultTxt==="2 lb → 1 lb"&&A.rows[0].on&&A.rows[1].name==="Burger buns"&&A.rows[1].resultTxt==="1 → 0 · off the list"&&A.rows[1].remove&&!/Corn tortillas|Salsa/.test(h), A.rows.map(r=>[r.name,r.minusTxt,r.resultTxt]));
  ok("nothing on the list changed yet (the dinner write is the only one)", W.gw().length===0&&W.pw().length===1);
  const beefId=W.item("Ground beef").id, bunsId=W.item("Burger buns").id;
  W.run("grSyncPullGo()");
  const beef=W.item("Ground beef");
  ok("Pull: the shared item shrinks to the other meal's amount and keeps only Tacos' src", beef.qty===1&&J(Object.keys(beef.srcs))===J([MON+"_d_m1"]));
  ok("…the sole item is removed (and lands in ↩ Put back's cleared)", !W.item("Burger buns")&&W.gw().some(w=>w[0]==="remove"&&w[1]==="kitchen/grocery/items/"+bunsId)&&W.gw().some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/cleared/"+bunsId));
  const up=W.gw().find(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items");
  ok("…ONE targeted multi-path update: srcs key null + qty", !!up&&J(up[2])===J({[beefId+"/srcs/"+TUE+"_d_m2"]:null,[beefId+"/qty"]:1}), up);
  ok("…and the pop-up moves on to the add sheet for Chili", /Add Chili \(Tue\)’s items\?/.test(W.pop.innerHTML), strip(W.pop.innerHTML).slice(0,120));
}
{ const W=world({plan:PLAN()}); W.shop();
  const bunsId=W.item("Burger buns").id; W.run("grToggle('"+bunsId+"')"); W.writes.length=0;   // buns already in the cart
  const h=W.act("kitAssign('"+TUE+"',{mid:'m5'})");
  const A=W.run("_grSyncAsk");
  ok("an item already bought starts unticked and says so", A.rows[1].name==="Burger buns"&&A.rows[1].on===false&&A.rows[1].done&&/already bought/.test(h));
  W.run("grSyncPullGo()");
  ok("Pull leaves the unticked bought item alone (still on the list, in the cart, its src kept)", !!W.item("Burger buns")&&W.item("Burger buns").done===true&&!!W.item("Burger buns").srcs[TUE+"_d_m2"]&&W.item("Ground beef").qty===1);
}
{ const W=world({plan:PLAN()}); W.shop(); W.writes.length=0;
  const h=W.act("kitMarkSkipped('"+MON+"')");   // ✗ Didn't happen → the dinner AND its side come off the list's view
  ok("✗ Didn't happen asks for the dinner and its side together", /Tacos, Roasted Broccoli \(Mon\) came off the plan\./.test(h)&&/Pull their items/.test(h), strip(h).slice(0,160));
  const A=W.run("_grSyncAsk");
  ok("…ground beef −1 lb (2 lb → 1 lb), tortillas, salsa and broccoli off the list", A.rows.map(r=>r.name).join("|")==="Ground beef|Corn tortillas|Salsa|Broccoli"&&A.rows[0].resultTxt==="2 lb → 1 lb"&&A.rows.slice(1).every(r=>r.remove));
  W.run("grSyncPullKeep()");
  ok("Keep: nothing written to the list; the plan's one write is the skipped stamp", W.gw().length===0&&J(W.pw().map(w=>w[1]))===J(["kitchen/plan/"+MON+"/skipped"])&&W.pop.innerHTML===""&&W.item("Ground beef").qty===2);
}
{ const W=world({plan:PLAN()}); W.shop(); W.writes.length=0;
  const h=W.act("kitOutToggle('"+MON+"','d')");
  ok("🍽 Eating out asks too", /Tacos, Roasted Broccoli \(Mon\) came off the plan/.test(h));
  W.run("grSyncPullKeep()");
  const h2=W.act("kitOutToggle('"+MON+"','d')");   // back on the plan
  ok("…and back on the plan offers the items again (the list still has them → 'on the list')", /Add the items for Tacos, Roasted Broccoli \(Mon\)\?/.test(h2)&&/on the list \(have 2 lb, \+1 lb\)/.test(h2), strip(h2).slice(0,300));
}
{ const W=world({plan:PLAN(),dry:true}); W.shop();
  const mine=()=>W.writes.filter(w=>/^kitchen\/plan/.test(w[1])||w[0]==="remove"||w[1]==="kitchen/grocery/items"||(w[0]==="update"&&Object.keys(w[2]).some(k=>/^srcs\/|^manual$/.test(k)))||/\/manual$/.test(w[1]));   // the block's own writes (the list's own item sets were never dry-run guarded)
  ok("dry run: the srcs are kept on the device copy only — no srcs / manual write", mine().length===0&&!!W.item("Ground beef")&&!!W.item("Ground beef").srcs);
  const h=W.act("kitAssign('"+TUE+"',{mid:'m5'})"); W.run("grSyncPullGo()"); W.run("grImpAdd()");
  ok("dry run: the sheets show; Pull and Add change the device copy only — no plan, srcs, qty or remove write", /Burgers \(Tue\) came off the plan/.test(h)&&mine().length===0&&W.item("Ground beef").qty===2&&!!W.item("Ground beef").srcs[TUE+"_d_m5"]&&!W.item("Burger buns"), mine());
}

console.log("\n── 3. the same meal moving inside the window never asks — its srcs key moves ──");
{ const W=world({plan:PLAN()}); W.shop(); W.writes.length=0;
  const h=W.act("kitMoveForward('"+TUE+"','d')");   // Burgers Tue → Wed (Wed had no dinner)
  ok("no sheet", h===""&&W.run("_grSyncAsk")===null&&W.plan()[WED].mid==="m2");
  const beef=W.item("Ground beef");
  ok("the item's src moved with the meal (key and day)", J(Object.keys(beef.srcs).sort())===J([MON+"_d_m1",WED+"_d_m2"])&&beef.srcs[WED+"_d_m2"].day==="Wed"&&beef.qty===2);
  const up=W.gw().find(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items");
  ok("…ONE targeted update: old key null, new key set", !!up&&up[2][beef.id+"/srcs/"+TUE+"_d_m2"]===null&&J(up[2][beef.id+"/srcs/"+WED+"_d_m2"])===J({qty:1,meal:"Burgers",day:"Wed",unit:"lb"})&&W.gw().length===1, up);
  // a dinner with its side moves: both keys move
  W.writes.length=0; const h2=W.act("kitMoveForward('"+MON+"','d')");   // Tacos + broccoli Mon → Tue (Tue is empty now)
  ok("a dinner and its side move together, nothing asked", h2===""&&!!W.item("Broccoli").srcs[TUE+"_sd_m3"]&&!!W.item("Ground beef").srcs[TUE+"_d_m1"]);
}
{ const far=W=>W.run("kitIsoPlus(_todayStr(),13)");
  const W=world({plan:{}}); const d13=far(W); W.run("kitPlan["+J(d13)+"]={mid:'m6'}"); W.run("grData.items.s1={name:'Strawberries',qty:1,src:[{k:'meal',lbl:'Fruit Salad (Sun)'}],srcs:{["+J(d13+"_d_m6")+"]:{qty:1,meal:'Fruit Salad',day:'Sun'}}}");
  const h=W.act("kitMoveForward("+J(d13)+",'d')");
  ok("a move OUT of the 14-day window asks to pull", /Fruit Salad \([A-Z][a-z]{2}\) came off the plan/.test(h), strip(h).slice(0,120));
}

console.log("\n── 4. a meal added to a shopped week → the add sheet (have / pantry / new), Shop for the week's own merge ──");
{ const W=world({plan:PLAN(),pantry:{p1:{name:"Beans",zone:"pantry"}}}); W.shop(); W.writes.length=0;
  const h=W.act("kitAssign('"+THU+"',{mid:'m5'})");   // Chili added on Thursday
  ok("the sheet asks about the new meal", /🛒 Add Chili \(Thu\)’s items\?/.test(h));
  const rows=W.run("_grImp.rows");
  ok("ground beef: on the list (have 2 lb, +1 lb), ticked", rows[0].p.name==="Ground beef"&&rows[0].why==="on the list (have 2 lb, +1 lb)"&&rows[0].on===true);
  ok("beans: in the pantry ✓, unticked", rows[1].p.name==="Beans"&&rows[1].why==="in the pantry ✓"&&rows[1].on===false);
  ok("the rows carry Chili's srcs", J(rows[0].srcs)===J([{key:THU+"_d_m5",meal:"Chili",day:"Thu",qty:1,unit:"lb"}]));
  W.run("grImpAdd()");
  const beef=W.item("Ground beef");
  ok("Add → merged like Shop for the week: 3 lb, three srcs; beans left off", beef.qty===3&&J(Object.keys(beef.srcs).sort())===J([MON+"_d_m1",TUE+"_d_m2",THU+"_d_m5"])&&!W.item("Beans"));
  ok("…its src recorded with ONE targeted update", W.gw().some(w=>w[0]==="update"&&w[1]==="kitchen/grocery/items/"+beef.id&&J(w[2])===J({["srcs/"+THU+"_d_m5"]:{qty:1,meal:"Chili",day:"Thu",unit:"lb"}})));
  W.writes.length=0; const h2=W.act("kitAssign('"+FRI+"',{mid:'m6'})");
  ok("a meal whose lines are all new says 'new' on each", /Add Fruit Salad \(Fri\)’s items\?/.test(h2)&&W.run("_grImp.rows").every(r=>r.why==="new"&&r.on));
  W.run("_grImp=null;grPopClose()");
  ok("Cancel writes nothing to the list", W.gw().length===0);
}
{ const W=world({plan:PLAN()}); W.shop(); W.writes.length=0;
  const h=W.act("kitSideAddMid('"+TUE+"','m3')");
  ok("a side added → the add sheet for the side", /Add Roasted Broccoli \(Tue\)’s items\?/.test(h)&&/on the list \(have 2 heads, \+2 heads\)/.test(h), strip(h).slice(0,200));
  W.run("grImpAdd()");
  ok("…merged onto the broccoli item with the side's own key", W.item("Broccoli").qty===4&&!!W.item("Broccoli").srcs[TUE+"_sd_m3"]);
  W.writes.length=0; const h2=W.act("kitSideRemove('"+TUE+"',0)");
  ok("the side removed → the pull sheet for just that side (broccoli 4 heads → 2 heads)", /Roasted Broccoli \(Tue\) came off the plan/.test(h2)&&W.run("_grSyncAsk").rows[0].resultTxt==="4 heads → 2 heads");
}
{ const W=world({plan:PLAN()}); W.shop(); W.writes.length=0;
  const h=W.act("kitSlotsSet('"+THU+"','b','main',{mid:'m4'})");
  ok("a breakfast part added → the add sheet", /Add Oatmeal \(Thu\)’s items\?/.test(h));
  W.run("_grImp=null;grPopClose()"); W.writes.length=0;
  const h2=W.act("kitSlotsSet('"+WED+"','b','main',null)");
  ok("a breakfast part cleared → the pull sheet (rolled oats off, milk stays)", /Oatmeal \(Wed\) came off the plan/.test(h2)&&W.run("_grSyncAsk").rows.map(r=>r.name+":"+r.resultTxt).join("|")==="Rolled oats:1 → 0 · off the list|Milk:1 → 0 · off the list");
}

console.log("\n── 5. a family with no list, or a list no meal fed, is never asked ──");
{ const W=world({plan:PLAN()});
  const h=W.act("kitAssign('"+TUE+"',{mid:'m5'})");
  ok("no list → a dinner change asks nothing", h===""&&W.run("_grSyncAsk")===null&&W.run("_grImp")===null&&W.gw().length===0);
  W.run("grData.items={a:{name:'Paper towels',src:[{k:'mom'}]}}");
  const h2=W.act("kitAssign('"+THU+"',{mid:'m6'})");
  ok("a list she typed herself (nothing from a meal) → still nothing asked, the item untouched", h2===""&&J(W.items())===J({a:{name:"Paper towels",src:[{k:"mom"}]}}));
  const h3=W.act("kitMarkSkipped('"+MON+"')");
  ok("a meal with nothing on the list → nothing asked", h3==="");
}

console.log("\n── 6. ▶ Run with hand-planned days: one sheet, three choices, asked every time ──");
const ROT={name:"Fall",emoji:"🍂",types:["d"],startDate:MON,endDate:"2026-11-08",weeks:[
  [{d:"Tacos"},{d:"Burgers"},{d:"Chili"},{d:"Fruit Salad"},{d:"Oatmeal"},{d:"Roasted Broccoli"},{d:"Leftovers"}],
  [{d:"Chili"},{d:"Tacos"},{d:"Oatmeal"},{d:"Burgers"},{d:"Fruit Salad"},{d:"Leftovers"},{d:"Roasted Broccoli"}]]};
const NOV=d=>"2026-11-0"+d;
{ const W=world({plan:{[WED]:{txt:"Grandma's"}},rots:{fall:ROT}});
  const h=W.runBtn("fall",MON,"2026-11-08");
  ok("the sheet replaces the confirm: no confirm, nothing written", W.confirms.length===0&&W.writes.length===0&&/▶ Run 🍂 Fall from Mon, Oct 26 until Sun, Nov 8/.test(h), strip(h).slice(0,160));
  ok("it lists the hand-planned day with what she planned", /1 day you planned by hand is in those dates:/.test(h)&&/Wed, Oct 28<\/b> · Grandma&#39;s|Wed, Oct 28<\/b> · Grandma's/.test(h), strip(h).slice(0,400));
  ok("three choices, in her words", /grSyncRunGo\('drop'\)[^>]*>Keep my day and drop that meal/.test(h)&&/grSyncRunGo\('slide'\)[^>]*>Keep my day and slide the rotation around it/.test(h)&&/grSyncRunGo\('replace'\)[^>]*>Replace my day/.test(h));
  ok("the slide choice says what won't fit before the cut-off", /Roasted Broccoli won’t fit before Nov 8 and will be left off\./.test(h), strip(h).slice(-300));
  ok("13 days get its dinners (the kept Wednesday aside)", /13 days get its dinners\./.test(h));
  // drop = today's keep
  W.run("grSyncRunGo('drop'); grSyncReconcile()");
  const up=W.pw()[0];
  ok("drop: Wednesday stays Grandma's and is not in the update; the other days get the rotation's dinners; no confirm", W.plan()[WED].txt==="Grandma's"&&!Object.keys(up[2]).some(k=>k.indexOf(WED)===0)&&W.plan()[THU].mid==="m6"&&J(W.plan()[THU].fromRot)===J({d:{id:"fall",wk:0,dow:3}})&&W.plan()[NOV(3)].mid==="m1"&&W.confirms.length===0&&W.pop.innerHTML==="");
  ok("the choice is not remembered anywhere on the device", !Object.keys(W.ls).some(k=>!/^ha_kit_(plan|rotations)$/.test(k)), Object.keys(W.ls));
  W.writes.length=0;
  const h2=W.runBtn("fall",MON,"2026-11-08");
  ok("running again asks again (same sheet, no default)", /Keep my day and drop that meal/.test(h2)&&W.writes.length===0&&W.confirms.length===0);
  W.run("_grSyncAsk=null;grPopClose()");
}
{ const W=world({plan:{[WED]:{txt:"Grandma's"},[THU]:{mid:"m6",fromRot:{d:{id:"fall",wk:0,dow:3}}}},rots:{fall:ROT},
    items:{s1:{name:"Strawberries",qty:1,src:[{k:"meal",lbl:"Fruit Salad (Thu)"}],srcs:{[THU+"_d_m6"]:{qty:1,meal:"Fruit Salad",day:"Thu"}}}}});
  W.runBtn("fall",MON,"2026-11-08"); W.run("grSyncRunGo('slide'); grSyncReconcile()");
  const P=W.plan();
  ok("slide: Wednesday stays hers; Thursday gets Wednesday's Chili with a slid stamp", P[WED].txt==="Grandma's"&&P[THU].mid==="m5"&&J(P[THU].fromRot)===J({d:{id:"fall",wk:0,dow:2,slid:true}}));
  ok("…every later dinner is one day later: Fri Fruit Salad, Sat Oatmeal, Sun Roasted Broccoli, Mon Nov 2 Leftovers", P[FRI].mid==="m6"&&P[SAT].mid==="m4"&&P[SUN].mid==="m3"&&P[NOV(2)].txt==="Leftovers"&&J(P[NOV(2)].fromRot)===J({d:{id:"fall",wk:0,dow:6,slid:true}}));
  ok("…the slide chains into week 2: Tue Nov 3 Chili (wk 2 Mon), Sun Nov 8 Leftovers (wk 2 Sat)", P[NOV(3)].mid==="m5"&&J(P[NOV(3)].fromRot)===J({d:{id:"fall",wk:1,dow:0,slid:true}})&&P[NOV(8)].txt==="Leftovers"&&P[NOV(8)].fromRot.d.dow===5);
  ok("…the cut-off is a hard stop: nothing written after Nov 8 (week 2's Sunday is dropped)", !P["2026-11-09"]&&!Object.keys(W.pw()[0][2]).some(k=>k.slice(0,10)>"2026-11-08"));
  ok("Monday and Tuesday (before her day) are as the rotation lays them, stamps plain", P[MON].mid==="m1"&&J(P[MON].fromRot)===J({d:{id:"fall",wk:0,dow:0}})&&P[TUE].mid==="m2");
  ok("a slid day is not hand-edited, and kitRotRunPlan leaves it alone (same) — the auto-start never snaps it back", W.run("kitRotHandEdited('"+NOV(3)+"',['d'])")===false&&(()=>{ const r=W.run("kitRotRunPlan(kitRotations.fall,'fall',{from:_todayStr()})"); return Object.keys(r.up).length===0&&J(r.kept)===J([WED])&&r.same===13; })()&&(W.writes.length=0, W.run("kitRotAutoStart()"), W.pw().length===0));
  ok("grocery: Fruit Salad's src followed it Thu → Fri with no pull sheet; the add sheet is for the new meals", J(Object.keys(W.item("Strawberries").srcs))===J([FRI+"_d_m6"])&&W.item("Strawberries").srcs[FRI+"_d_m6"].day==="Fri"&&/Add the items for /.test(W.pop.innerHTML)&&!/came off the plan/.test(W.pop.innerHTML), strip(W.pop.innerHTML).slice(0,200));
  W.run("_grImp=null;grPopClose()");
  W.writes.length=0; const h3=W.runBtn("fall",MON,"2026-11-08");
  ok("running again after a slide still asks (the kept Wednesday), and nothing was written", /Keep my day and slide/.test(h3)&&W.writes.length===0);
}
{ const W=world({plan:{[WED]:{txt:"Grandma's"}},rots:{fall:ROT}});
  W.runBtn("fall",MON,"2026-11-08"); W.run("grSyncRunGo('replace'); grSyncReconcile()");
  ok("replace = today's overwrite: Wednesday gets Chili, stamped plain; no confirm", W.plan()[WED].mid==="m5"&&!("txt" in W.plan()[WED])&&J(W.plan()[WED].fromRot)===J({d:{id:"fall",wk:0,dow:2}})&&W.confirms.length===0);
}
{ const W=world({plan:{},rots:{fall:ROT}});
  const h=W.runBtn("fall",MON,"2026-11-08");
  ok("no hand-planned days → the old confirm, no sheet", h===""&&W.confirms.length===1&&/Run 🍂 Fall from Mon, Oct 26 until Sun, Nov 8\?/.test(W.confirms[0])&&W.pw().length===1);
}
{ const sl=(plan,from)=>{ const W=world({plan:plan,rots:{fall:ROT}}); return W.run("grSyncRotSlidePlan(kitRotations.fall,'fall',"+J({from:from})+")"); };
  const r=sl({[WED]:{txt:"Grandma's"},[SAT]:{txt:"Pizza night"}},MON);
  ok("pure slide plan: two kept days shift by two in all; both named in dropped", J(r.kept)===J([WED,SAT])&&r.up[THU+"/mid"]==="m5"&&r.up[SUN+"/mid"]==="m4"&&r.up[SUN+"/fromRot/d"].dow===4&&r.up[SUN+"/fromRot/d"].slid===true&&r.dropped.map(x=>x.name).join("|")==="Leftovers|Roasted Broccoli", r.dropped);
  const r2=sl({[WED]:{txt:"Grandma's"},[THU]:{mid:"m6",fromRot:{d:{id:"fall",wk:0,dow:3}}}},MON);
  ok("an earlier run's own day in the slide's path is rewritten (its stamp is this rotation's, not hers)", r2.up[THU+"/mid"]==="m5"&&r2.up[THU+"/fromRot/d"].slid===true);
  const r3=sl({[WED]:{txt:"Grandma's"},[THU]:{mid:"m1",eaten:5}},MON);
  ok("an eaten day is never rewritten; the slide hops it", !Object.keys(r3.up).some(k=>k.indexOf(THU)===0)&&r3.up[FRI+"/mid"]==="m6");
}

console.log("\n── 7. the Snack row on every day (Mom), the one slot through the picker ──");
{ const W=world({plan:{[MON]:{mid:"m1"}},items:{g:{name:"Grapes",qty:1,src:[{k:"meal",lbl:"x"}]}}});
  const mom=W.run("_calSlotRows('"+MON+"',null)"), kid=W.run("_calSlotRows('"+MON+"','lucy')");
  ok("Mom sees a Snack row on an empty day: 'nothing yet' and ✎", mom.n===3&&/<span class="lbl">Snack<\/span><span style="flex:1;min-width:130px">🍎 <span style="color:#9ca3af">nothing yet<\/span>/.test(mom.html)&&/grSyncSnackPick\('2026-10-26'\)/.test(mom.html)&&!/➡ Move<\/button>/.test(mom.html.slice(mom.html.indexOf("Snack"))));
  ok("a kid sees no snack row on that day", kid.n===0&&!/Snack/.test(kid.html));
  W.mom=false; ok("…nor a kid on a shared screen", !/Snack/.test(W.run("_calSlotRows('"+MON+"',null)").html)); W.mom=true;
  ok("the day sheet carries it too (Mom), not the kid's", /<span class="lbl">Snack<\/span>/.test(W.sheet(MON))&&!/Snack/.test(W.sheet(MON,"lucy")));
  W.run("grSyncSnackPick('"+MON+"')");
  ok("✎ opens the same library picker on slot s", J(W.run("kitRotPick"))===J({q:"",tag:"",kind:"p",iso:MON,slot:"s"})&&/🍎 Snack · Mon, Oct 26/.test(W.run("_calSlotRows('"+MON+"',null)").html)&&/kitRotPickGo\('m6'\)/.test(W.run("_calSlotRows('"+MON+"',null)").html));
  W.writes.length=0; const h=W.act("kitRotPickGo('m6')");
  ok("picking a meal = ONE targeted update of the s slot; picker closed; the row shows it with ➡ Move", J(W.pw())===J([["update","kitchen/plan/"+MON,{s:{mid:"m6"}}]])&&W.run("kitRotPick")===null&&W.plan()[MON].mid==="m1"&&/🍓 Fruit Salad<\/b>/.test(W.run("_calSlotRows('"+MON+"',null)").html)&&/kitMoveForward\('2026-10-26','s'\)/.test(W.run("_calSlotRows('"+MON+"',null)").html));
  ok("…and the list is offered the snack's items", /Add Fruit Salad \(Mon\)’s items\?/.test(h)&&/on the list \(have 1, \+1\)/.test(h)); W.run("_grImp=null;grPopClose()");
  W.prompt="Popcorn"; W.writes.length=0; W.run("grSyncSnackPick('"+MON+"'); kitRotPickTyped()");
  ok("✎ Type it → {txt}", J(W.pw())===J([["update","kitchen/plan/"+MON,{s:{txt:"Popcorn"}}]])&&W.run("kitSlotsPickCur({kind:'p',iso:'"+MON+"',slot:'s'})")==="Popcorn");
  W.writes.length=0; W.run("grSyncSnackPick('"+MON+"'); kitRotPickClear()");
  ok("✕ Clear → {s:null}, the dinner untouched", J(W.pw())===J([["update","kitchen/plan/"+MON,{s:null}]])&&!("s" in W.plan()[MON])&&W.plan()[MON].mid==="m1");
  W.run("kitPlan['"+TUE+"']={s:{txt:'Apples'}}"); W.writes.length=0; W.run("grSyncSnackPick('"+TUE+"'); kitRotPickClear()");
  ok("clearing the only thing on a day removes the day (the update's null empties the node)", !W.plan()[TUE]&&J(W.pw())===J([["update","kitchen/plan/"+TUE,{s:null}]]));
  W.mom=false; W.writes.length=0; W.run("grSyncSnackSet({iso:'"+MON+"',slot:'s'},{mid:'m6'})");
  ok("a kid's screen can't set the snack", W.writes.length===0&&!("s" in W.plan()[MON]));
}

console.log("\n── 8. ✕ Clear in the dinner picker clears only the dinner ──");
{ const plan={[MON]:{mid:"m1",sideList:[{mid:"m3"}],b:{mid:"m4"},l:{txt:"PB&J"},s:{txt:"Popcorn"},fromRot:{d:{id:"fall",wk:0,dow:0}}}};
  const W=world({plan:JSON.parse(J(plan)),rots:{fall:ROT},items:{g:{name:"Ground beef",qty:1,unit:"lb",src:[{k:"meal",lbl:"Tacos (Mon)"}],srcs:{[MON+"_d_m1"]:{qty:1,unit:"lb",meal:"Tacos",day:"Mon"}}}}});
  W.run("kitDinPickOpen('"+MON+"','sheet')"); W.writes.length=0;
  const h=W.act("kitRotPickClear()");
  ok("the dinner, its sides go; breakfast, lunch, snack and the stamp stay", J(W.plan()[MON])===J({b:{mid:"m4"},l:{txt:"PB&J"},s:{txt:"Popcorn"},fromRot:{d:{id:"fall",wk:0,dow:0}}}));
  ok("ONE targeted update of the dinner's keys — not a set of the day", J(W.pw())===J([["update","kitchen/plan/"+MON,{mid:null,txt:null,sides:null,sideList:null}]])&&W.run("kitRotPick")===null);
  ok("the cleared stamped day counts as hand-edited (the running rotation won't refill it)", W.run("kitRotHandEdited('"+MON+"',['d'])")===true);
  ok("…and the list is asked to pull Tacos", /Tacos \(Mon\) came off the plan/.test(h));
  const B=world({plan:JSON.parse(J(plan)),base:true}); B.run("kitDinPickOpen('"+MON+"','sheet')"); B.writes.length=0; B.run("kitRotPickClear()");
  ok("(before this block the same tap set the whole day to its stamp — b/l/s gone)", J(B.plan()[MON])===J({fromRot:{d:{id:"fall",wk:0,dow:0}}})&&B.pw()[0][0]==="set");
  W.writes.length=0; W.run("kitAssign('"+MON+"',null)");
  ok("the Meals page week-list ✕ Clear is unchanged (whole day, stamp kept)", J(W.plan()[MON])===J({fromRot:{d:{id:"fall",wk:0,dow:0}}})&&W.pw()[0][0]==="set");
  W.mom=false; W.run("kitPlan['"+TUE+"']={mid:'m2',b:{mid:'m4'}}"); W.writes.length=0; W.run("grSyncDinClear('"+TUE+"')");
  ok("a kid's screen can't clear a dinner", W.writes.length===0&&W.plan()[TUE].mid==="m2");
}

console.log("\n── 9. no meal change → byte-identical to the app without the block ──");
{ const plan={[MON]:{mid:"m1",sideList:[{mid:"m3"}],b:{mid:"m4"},l:{txt:"PB&J"}},[TUE]:{txt:"Pizza night",s:{txt:"Popcorn"}},[WED]:{mid:"m2",fromRot:{d:{id:"fall",wk:0,dow:2}}}};
  const items={a:{name:"Ground beef",qty:2,unit:"lb",src:[{k:"meal",lbl:"Tacos (Mon)"}]},b:{name:"Eggs",qty:12,src:[{k:"mom"}]}};
  const A=world({plan:JSON.parse(J(plan)),rots:{fall:ROT},items:JSON.parse(J(items))}), B=world({plan:JSON.parse(J(plan)),rots:{fall:ROT},items:JSON.parse(J(items)),base:true});
  const probe=W=>J({gs:W.run("grWeekSources('"+MON+"',7)"),gn:W.run("grWeekNeeds()"),run:W.run("kitRotRunPlan(kitRotations.fall,'fall',{from:_todayStr()})"),kid:W.run("_calSlotRows('"+MON+"','lucy')"),kid2:W.run("_calSlotRows('"+TUE+"','julian')"),ks:W.sheet(MON,"lucy"),ks2:W.sheet(TUE,"lucy"),din:W.run("_calDinnerOf('"+MON+"')"),hand:W.run("kitRotHandEdited('"+WED+"',['d'])"),ps:W.run("kitPlanSlot('"+TUE+"','s')")});
  ok("grocery feeders, the run plan, hand-edit, the kid's rows and sheets: identical", probe(A)===probe(B), [probe(A).slice(0,300)]);
  const snack=A.run("grSyncSnackRowHTML('"+MON+"',KIT_SLOTS[2])");
  ok("Mom's sheet differs only by the Snack row", A.sheet(MON).replace(snack,"")===B.sheet(MON)&&A.sheet(MON)!==B.sheet(MON));
  const snack2=A.run("grSyncSnackRowHTML('"+TUE+"',KIT_SLOTS[2])"), oldRow=B.run("_calSlotRows('"+TUE+"',null).html");
  ok("…on a day with a snack the old row is swapped for the new one (name, ✎, ➡ Move)", A.run("_calSlotRows('"+TUE+"',null).html").endsWith(snack2)&&A.run("_calSlotRows('"+TUE+"',null).html").replace(snack2,"")===oldRow.replace(/<div class="row"><span class="lbl">Snack<\/span>[\s\S]*$/,"")&&/<b>Popcorn<\/b>/.test(snack2)&&/<b>Popcorn<\/b>/.test(oldRow)&&/kitMoveForward\('2026-10-27','s'\)/.test(snack2));
  A.shop(); B.shop();
  const sets=W=>J(W.writes.filter(w=>w[0]==="set").map(w=>[w[1].replace(/items\/g[a-z0-9]+/,"items/ID"),w[2].name,w[2].qty,w[2].unit]));
  ok("Shop for the week writes the very same items (the block adds only the srcs updates)", sets(A)===sets(B)&&B.writes.every(w=>w[0]==="set")&&A.writes.filter(w=>w[0]==="update").every(w=>Object.keys(w[2]).every(k=>/^srcs\/|^manual$/.test(k))), [sets(A),sets(B)]);
  ok("an item with no srcs reads the same in both (Eggs untouched)", J(A.items().b)===J(B.items().b)&&J(A.items().a.src)===J(B.items().a.src)&&A.items().a.qty===B.items().a.qty);
  A.writes.length=0; B.writes.length=0; A.yes=B.yes=true; A.run("kitMoveForward('"+WED+"','d')"); B.run("kitMoveForward('"+WED+"','d')"); A.run("grSyncReconcile()");
  ok("Move forward writes the same plan paths (plus the block's srcs move only)", J(A.pw())===J(B.pw())&&B.gw().length===0&&A.gw().length===1&&A.gw()[0][1]==="kitchen/grocery/items");
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
