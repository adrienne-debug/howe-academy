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
  const body=fn("kitSlug")+block+`
    ;return {grParse,grKey,grSecFor,grQtyTxt,grMergeQty,grAdd,grFindDup,grToggle,grVToggle,grDone,grApprove,grDecline,grDupMore,grDupAnyway,grGroups,grText,grAddFrom,grKidAllow,grKidBoxHTML,grReqCount,
      get data(){return grData;}, set data(v){grData=v;}, get pend(){return _grPend;}};`;
  const F=new Function("env","db","HA_LS","mwToast","kitOrderList","kitStaples","kitBuyLog","panAdd","_todayStr","momHere","dadAwardOk","kitPinGate","confirm","ROSTER_DEF","esc","tab","document","prompt","navigator",body);
  const kitOrderList=()=>{ const need=Object.keys(env.staples).filter(k=>env.staples[k].state!=="have").map(k=>Object.assign({id:k},env.staples[k]));
    return {need:need,usuals:{breakfast:Object.keys(env.usuals).map(k=>Object.assign({id:k},env.usuals[k]))},count:0}; };
  const doc={getElementById:id=>env.els&&env.els[id]||null,createElement:()=>({}),body:{appendChild:()=>{}},activeElement:null};
  const L=F(env,{ref:ref},{setItem:()=>{},getItem:()=>null},m=>env.toasts.push(m),kitOrderList,env.staples,env.buy,
    (n,z,q,m)=>{env.pantry.push([n,z,q,m]);return "p";},()=>"2026-10-03",()=>env.mom,()=>env.dad,(then)=>{env.pinAsked++; if(env.pinOk) then();},
    ()=>env.confirm,[{id:"lucy",name:"Lucy",color:"#f0f"},{id:"ellis",name:"Ellis",color:"#00f"}],
    s=>String(s||""),"schedule",doc,()=>null,{});
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
  ok("in-cart ticks cleared", !Object.keys(L.data.vchk).length&&L.env.writes.some(w=>w[0]==="remove"&&w[1]==="kitchen/grocery/vchk"));
  ok("no whole-node writes to kitchen/grocery", !L.env.writes.some(w=>w[1]==="kitchen/grocery"||w[1]==="kitchen/grocery/items"&&w[0]==="set"));
}
{ const L=mk(); withPop(L); L.env.mom=false; L.env.pinOk=false; L.grAdd("x","dad"); L.grToggle(Object.keys(L.data.items)[0]); L.grDone();
  ok("🏁 Done needs Mom's PIN (or Dad's code)", Object.keys(L.data.items).length===1&&L.env.pinAsked===1); }
// ── copy text ──
{ const L=mk(); withPop(L); L.grAdd("2 lb ground beef","mom");
  const t=L.grText(); ok("copy text groups by section, includes staples + usuals", /Meat & seafood: Ground beef \(2 lb\)/.test(t)&&/Almond milk/.test(t)&&/Bananas \(×2\)/.test(t)); }
// ── wiring ──
ok("Mom's Day Shopping spot opens the list (not Meals)", /\+grMdShopHTML\(\)/.test(src)&&!/Open the shopping list →/.test(src));
ok("🛒 List tab in the Mom's Day tabs", /btn\('grocery','🛒 List'\)/.test(src)&&/if\(mpSubView==='grocery'\)\{ return renderGrocery\(el\); \}/.test(src));
ok("Dad's Day has the grocery card", /h\+=grDadCardHTML\(\)/.test(src));
ok("kid's day page carries the ask box", /h\+=grKidBoxHTML\(k\)/.test(src));
ok("live listener on kitchen/grocery", /db\.ref\("kitchen\/grocery"\)\.on\("value"/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
