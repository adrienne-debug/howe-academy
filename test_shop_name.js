/* 🛒 SHOPNAME — the Grocery List is the "Shopping List" (her answer 10, 2026-10-26: "change the name to shopping list and other
 * stores can be added and seperated there"). Labels only: every visible name reads SHOP_LIST_NAME; the data (kitchen/grocery/…),
 * grData, the gr* names and the test files keep their names. Run: node test_shop_name.js [index.html] */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(process.argv[2]||path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const GL=cut("// GROCERY_LIST_START","// GROCERY_LIST_END"), SN=cut("// SHOPNAME_START","// SHOPNAME_END");

console.log("── the block ──");
{ const a=src.indexOf("// SHOPNAME_START"), b=src.indexOf("// SHOPNAME_END"), ge=src.indexOf("// GROCERY_LIST_END");
  ok("SHOPNAME block present once", a>0&&b>a&&src.indexOf("// SHOPNAME_START",a+5)<0&&src.indexOf("// SHOPNAME_END",b+5)<0);
  ok("…right after GROCERY_LIST_END", src.slice(ge,a).trim()==="// GROCERY_LIST_END");
  ok("the constant is \"Shopping List\"", /const SHOP_LIST_NAME="Shopping List";/.test(SN));
  ok("the block writes nothing (no db.ref, no set)", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(SN));
}

// ── a sliced app: the grocery block + the Mom's Day sub-nav, booted on a fixture ──
function mk(o){
  o=o||{}; const writes=[], toasts=[], pop={innerHTML:""}, ls={}, pins=[];
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, mwToast:m=>toasts.push(m), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    momHere:()=>o.mom!==false, dadAwardOk:()=>false, kitPinGate:(then,why)=>{ pins.push(why||""); }, _dryRun:()=>!!o.dry,
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-27", panAdd:()=>"p1", kitStaples:{}, kitBuyLog:{}, kitPantry:{}, tab:"moms-plan", renderAll:()=>{}, renderMomsPlan:()=>{},
    ROSTER_DEF:o.roster||[], HA_IS_HOWE:!!o.howe, mwBanner:sub=>'<div class="md-banner">'+sub+'</div>', momTipsGroceryHTML:()=>"", mpSubView:"grocery", momSchedView:false,
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>({}),body:{appendChild:()=>{}},querySelectorAll:()=>[]}};
  vm.createContext(ctx);
  vm.runInContext(fn("kitSlug")+"\n"+SN+"\n"+GL+"\n"+fn("mpSubnav"),ctx);
  ctx.grRepaint=()=>{}; ctx.grWeekNeeds=()=>[]; ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>"";
  vm.runInContext("grData.stores="+JSON.stringify(o.stores||{})+"; grData.items="+JSON.stringify(o.items||{})+"; grData.home="+JSON.stringify(o.home||{})+";",ctx);
  return {run:e=>vm.runInContext(e,ctx),ctx,writes,toasts,pop,pins,data:()=>vm.runInContext("grData",ctx)};
}
const FIX={stores:{foodlion:{name:"Food Lion",color:"#d6001c"},hobbylobby:{name:"Hobby Lobby",color:"#1e40af"}},
  items:{g1:{name:"Eggs",sec:"dairy",qty:2,unit:"dozen",src:[{k:"mom"}],stores:["foodlion"]},g2:{name:"Glue sticks",sec:"other",src:[{k:"mom"}],stores:["hobbylobby"]},g3:{name:"Bananas",sec:"produce",src:[{k:"dad"}],done:true,doneTs:5}},
  roster:[{id:"k1",name:"Kenzie",color:"#f0f"}]};
const GROC=/[Gg]rocery [Ll]ist|🛒 Grocery/;
const render=(T,sid)=>{ T.run("grSetStore("+JSON.stringify(sid||"all")+")"); const el={innerHTML:""}; T.run("renderGrocery")(el); return el.innerHTML; };

console.log("── the rendered list views say Shopping List, never Grocery List ──");
{ const T=mk(FIX);
  const all=render(T,"all");
  ok("the list page (All) — header reads 🛒 Shopping List", /🛒 Shopping List<\/?span|🛒 Shopping List<span/.test(all)&&!GROC.test(all), all.match(/🛒 [^<]{0,30}/g));
  ok("…its banner line names the Shopping List", /The Shopping List — everything lands here/.test(all));
  ok("…the Mom's Day chip reads 🛒 Shopping List", /mpGoto\('grocery'\)[^>]*>🛒 Shopping List<\/button>/.test(all));
  ok("…and the 💰 Groceries budget word, store names and sections are untouched", /Food Lion/.test(all)&&/Hobby Lobby/.test(all)&&/🥛 Dairy/.test(all));
  const st=render(T,"hobbylobby");
  ok("a store's page shows the store's name, no Grocery List anywhere", /🛒 Hobby Lobby/.test(st)&&/Glue sticks/.test(st)&&!GROC.test(st));
  const md=T.run("grMdShopHTML()");
  ok("Mom's Day widget: 'Add to the Shopping List…' + 'Open the Shopping List · n to get'", /Add to the Shopping List…/.test(md)&&/🛒 Open the Shopping List · 2 to get/.test(md)&&!GROC.test(md), md);
  const dadCard=T.run("grDadCardHTML()"), dadShop=T.run("grDadShopHTML()");
  ok("Dad's Day card + his add box read Shopping List", /🛒 Shopping List<span/.test(dadCard)&&/Add to the Shopping List…/.test(dadShop)&&!GROC.test(dadCard+dadShop));
  T.run("grSetStore('all')"); const txt=T.run("grText()");
  ok("📋 Copy: the text header is '🛒 Shopping List — <date>'", /^🛒 Shopping List — 2026-10-27/.test(txt)&&!GROC.test(txt), txt.split("\n")[0]);
  T.run("grSetStore('foodlion')"); const txtS=T.run("grText()");
  ok("…and per store: '🛒 Shopping List — Food Lion — <date>'", /^🛒 Shopping List — Food Lion — 2026-10-27/.test(txtS), txtS.split("\n")[0]);
  const E=mk({stores:FIX.stores}); E.run("grSetStore('all')");
  ok("an empty list copies as '🛒 The Shopping List is empty.'", E.run("grText()")==="🛒 The Shopping List is empty.");
  ok("the add box's default placeholder", /placeholder="Add to the Shopping List…"/.test(T.run('grAddRowHTML("x","list")')));
  ok("the Mom's Day sub-nav chip is 🛒 Shopping List and still routes to 'grocery'", /mpGoto\('grocery'\)[^>]*>🛒 Shopping List<\/button>/.test(T.run("mpSubnav('plan')")));
}
console.log("── the Mom-PIN lines and the toasts ──");
{ const T=mk(Object.assign({},FIX,{mom:false}));
  T.run("grAddFrom")&&0; T.ctx.document.getElementById=id=>id==="gr-pop"?T.pop:(id==="gr-add-md"?{value:"milk"}:null);
  T.run("grAddFrom('gr-add-md','md')");
  ok("a kid's device adding from Mom's Day: 'Adding to the Shopping List from here is for Mom…'", T.pins.some(w=>/Adding to the Shopping List from here is for Mom/.test(w))&&!T.pins.some(w=>GROC.test(w)), T.pins);
  T.run("grGate(function(){})");
  ok("grGate: 'Changing or clearing the Shopping List is for Mom.'", T.pins.some(w=>w==="Changing or clearing the Shopping List is for Mom."), T.pins);
  const M=mk(FIX); T.ctx.document.getElementById=()=>null;
  ok("Mom adds → the toast stays '🛒 Added <item>'", M.run("grAdd('2 lb apples','mom')")==="add"&&M.toasts.some(t=>/^🛒 Added Apples/.test(t)), M.toasts);
}
console.log("── writes still go to kitchen/grocery/… (data paths unchanged) ──");
{ const T=mk(FIX);
  T.run("grAdd('paper towels','mom')");
  const id=Object.keys(T.data().items).find(i=>T.data().items[i].name==="Paper towels");
  ok("a new item is one targeted set at kitchen/grocery/items/<id>", !!id&&T.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/items/"+id));
  ok("no write path mentions a 'shopping' node", !T.writes.some(w=>/shop/i.test(w[1])));
  ok("grData, grAdd, grCreate, grFindDup, grStores, grDone keep their names", ["let grData=","function grAdd(","function grCreate(","function grFindDup(","function grStores(","function grDoneRun("].every(s=>GL.indexOf(s)>=0));
  ok("the kitchen/grocery/ paths in the block are all still there (none renamed)", (GL.match(/kitchen\/grocery\//g)||[]).length>=40&&!/kitchen\/shopping/.test(src));
  ok("the Mom's Day route key stays 'grocery' (saved devices keep opening the list)", /if\(mpSubView==='grocery'\)\{ return renderGrocery\(el\); \}/.test(src)&&/SS_OTHER_VIEWS=\[[^\]]*"grocery"/.test(src));
  ok("💰 the Groceries budget line keeps its food word", /name:"Groceries",emoji:"🛒"/.test(GL));
}
console.log("── nothing visible says Grocery List any more (source scan) ──");
{ const lines=src.split("\n"); const left=[];
  const wnA=src.indexOf("const WHATS_NEW=["), wnB=src.indexOf("function wnCurrent(");
  let pos=0;
  lines.forEach((l,i)=>{ const start=pos; pos+=l.length+1;
    const code=l.replace(/^\s*\/\/.*$/,"").replace(/\s\/\/ .*$/,"").replace(/\/\*.*?\*\//g,"");   // comments don't show
    if(!/[Gg]rocery [Ll]ist/.test(code)) return;
    if(/<summary>🛒 Full Grocery List/.test(l)) return;                 // the Prep guide's own food list (a reference page, not this list)
    if(start>=wnA&&start<wnB) return;                                    // the dated What's new notes: the new one names the old name on purpose, the older ones keep their wording
    left.push((i+1)+": "+l.trim().slice(0,100)); });
  ok("no visible 'Grocery list' string left outside comments, the Prep food guide and the old dated notes", left.length===0, left);
  ok("every renamed label reads the constant (28 reads outside the block's own line)", (src.match(/SHOP_LIST_NAME/g)||[]).length>=29);
  ok("'Groceries' as a food word stays (the budget, the receipt prompt's 'grocery receipt')", /grocery receipt/.test(src)&&/Groceries/.test(src));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0);
}
console.log("── the What's new note ──");
{ const a=src.indexOf("// MOMNEWS_START"), b=src.indexOf("// MOMNEWS_END");
  const ctx={console,JSON,Object,Array,String,HA_LS:{getItem:()=>null,setItem:()=>{}},db:null,momHere:()=>true,tipWho:()=>"mom",momModeActive:true,grBig:false,_grCo:null,HA_IS_HOWE:false,esc:s=>String(s==null?"":s),kitPinGate:()=>{},renderAll:()=>{},document:{getElementById:()=>null,createElement:()=>({style:{},remove(){}}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(SN+"\n"+src.slice(a,b),ctx);
  const w=vm.runInContext("WHATS_NEW[0]",ctx);
  ok("the newest note is dated 2026-10-27 and leads with the rename", w.id==="2026-10-27"&&/Grocery List is now the Shopping List/.test(w.sections[0][0]));
  const J=JSON.stringify(w);
  ok("…says it is the same list in the same place, that stores stay separate (＋ Add a store), and that nothing moved", /Same list, same place/.test(J)&&/Add a store/.test(J)&&/Nothing moved/.test(J));
  ok("…names no Howe kid (it goes to every family)", !/Lincoln|Ellis|Lucy|Julian/.test(J));
  ok("a family that read the Oct 22–23 note sees this one; a device that read it does not", (vm.runInContext("whatsNewOnValue('2026-10-23'); wnRowHTML()",ctx).indexOf("Oct 27")>=0)&&(vm.runInContext("whatsNewOnValue('2026-10-27'); wnRowHTML()",ctx).indexOf("tap to read")<0));
  ok("the 👋 list tip reads 'How the Shopping List works'", /How the Shopping List works/.test(vm.runInContext("momTipsGroceryHTML()",ctx)));
}
console.log("── another family (DeWalt-shaped: one Mom, one Dad, their own stores) renders the same labels ──");
{ const T=mk({stores:{walmart:{name:"Walmart",color:"#0071ce"},aldi:{name:"Aldi",color:"#00205b"}},items:{d1:{name:"Milk",sec:"dairy",src:[{k:"mom"}],stores:["walmart"]}},roster:[{id:"k1",name:"Caleb",color:"#0f0"},{id:"k2",name:"Taylor",color:"#f00"}],howe:false});
  const all=render(T,"all"), md=T.run("grMdShopHTML()"), dad=T.run("grDadCardHTML()");
  ok("DeWalt-shaped fixture: list page, Mom's Day widget and Dad's card all read Shopping List, no Grocery List", /🛒 Shopping List/.test(all)&&/Open the Shopping List · 1 to get/.test(md)&&/🛒 Shopping List<span/.test(dad)&&!GROC.test(all+md+dad));
  ok("…dry run: a render writes nothing", T.writes.length===0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
