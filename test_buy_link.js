/* 🧺→🛒 BUYLINK — the Sunday list and the Shopping List are linked (her ask 2026-10-24: "it can all link if things need to be bought
 * to the lists"; her answer 10, 2026-10-26: one list, each item under its store). Run: node test_buy_link.js [index.html] */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(process.argv[2]||path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const LL=cut("// LESSONLINK_START","// LESSONLINK_END"), LR=cut("// LESSONRES_START","// LESSONRES_END"), SN=cut("// SHOPNAME_START","// SHOPNAME_END"), GL=cut("// GROCERY_LIST_START","// GROCERY_LIST_END"), BL=cut("// BUYLINK_START","// BUYLINK_END");

console.log("── the block and its hooks ──");
{ const a=src.indexOf("// BUYLINK_START"), b=src.indexOf("// BUYLINK_END"), se=src.indexOf("// SHOPNAME_END");
  ok("BUYLINK block present once, right after SHOPNAME_END", a>0&&b>a&&src.indexOf("// BUYLINK_START",a+5)<0&&src.indexOf("// BUYLINK_END",b+5)<0&&src.slice(se,a).trim()==="// SHOPNAME_END");
  ok("grCreate carries p.ref onto the item (one item, one write)", (src.match(/if\(p\.ref&&typeof p\.ref==="object"\) it\.ref=p\.ref;   \/\/ BUYLINK/g)||[]).length===1);
  ok("grAdd passes extra.ref through", (src.match(/if\(extra&&extra\.ref&&typeof extra\.ref==="object"\) p\.ref=extra\.ref;   \/\/ BUYLINK/g)||[]).length===1);
  ok("the checkout finisher calls blOnBought once per bought item (guarded)", (src.match(/if\(typeof blOnBought==="function"\) blOnBought\(id,it\);/g)||[]).length===1&&fn("grDoneRun").indexOf("blOnBought(id,it)")>0);
  ok("lrItemRowHTML draws the chip (guarded)", (src.match(/\(typeof blRowChipHTML==="function"\?blRowChipHTML\(it\):""\)/g)||[]).length===1&&fn("lrItemRowHTML").indexOf("blRowChipHTML")>0);
  ok("lrStapleChip draws the staple button (guarded)", (src.match(/\(typeof blStapleBtnHTML==="function"\?blStapleBtnHTML\(s\):""\)/g)||[]).length===1&&fn("lrStapleChip").indexOf("blStapleBtnHTML")>0);
  ok("lrSundayHTML runs the rule on draw (guarded, try/catch)", (src.match(/try\{ if\(typeof blAutoSend==="function"\) blAutoSend\(L\); \}catch\(e\)\{\}/g)||[]).length===1);
  ok("every write in the block goes through blDb() (db && !_dryRun()) — never a bare db.ref", !/[^l]db\.ref\(/.test(BL.replace(/blDb\(\)/g,""))&&/function blDb\(\)\{ return \(typeof db!=="undefined"&&db&&!blDry\(\)\)\?db:null; \}/.test(BL));
  ok("the block never writes the rule, Purchases or ESA", !/config\/rules/.test(BL.replace(/\/\/[^\n]*/g,""))&&!/\bESA\b|purchase|esaData|esa\//i.test(BL.replace(/\/\/[^\n]*/g,"")));
  ok("no 🔀 in index.html; no Howe kid's name in the block", src.indexOf("\u{1F500}")<0&&!/Lincoln|Ellis|Lucy|Julian/i.test(BL));
}

// ── a world: LESSONLINK + LESSONRES (the Sunday list) + SHOPNAME + GROCERY_LIST + BUYLINK, on a fixture ──
const TODAY="2026-10-23";   // a Friday → this week Mon 10/19–Sun 10/25 (week12), next week 10/26–11/1 (week13)
function fixture(){ return {
  subjects:{ kenzie:{ math:{display:"Math",lessonSeq:["Lesson 11","Lesson 12","Lesson 13"],lessonIds:["L11","L12","L13"],doneImportedAt:"2026-08-01"} },
             caleb:{ science:{display:"Science",lessonSeq:["Ch.2","Ch.3"],lessonIds:["S2","S3"],doneImportedAt:"2026-08-01"} } },
  done:{},
  lessons:{ kenzie:{1:{date:"2026-10-22",math:"Lesson 12"},2:{date:"2026-10-27",math:"Lesson 13"}}, caleb:{1:{date:"2026-10-28",science:"Ch.3"}} },
  resources:{ kenzie:{ math:{ L12:{supplies:[{name:"glue stick",qty:"2",kids:true}],books:[{title:"Charlotte's Web",by:"E. B. White"}]}, L13:{orders:[{name:"Protractor",url:"https://shop.example/p"}]} } },
              caleb:{ science:{ S3:{supplies:[{name:"baking soda",kids:true}]} } } } }; }
function mk(o){
  o=o||{}; const writes=[], toasts=[], pop={innerHTML:""}, DOM={}, ls={};
  const dry=!!o.dry;
  const ctx={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,RegExp,Promise,URL,parseInt,parseFloat,isNaN,encodeURIComponent,setTimeout:()=>0,navigator:{},
    currData:o.currData||fixture(), weekData:{tasks:[]},
    db:{ref:p=>({set:v=>{ if(!o.dbDead) writes.push(["set",p,v]); },update:v=>{ if(!o.dbDead) writes.push(["update",p,v]); },remove:()=>{ if(!o.dbDead) writes.push(["remove",p]); },on:()=>{},once:()=>{}})},
    momHere:()=>o.mom!==false, _dryRun:()=>dry, dadAwardOk:()=>false, kitPinGate:(then)=>{ if(o.mom!==false) then(); }, mwToast:m=>toasts.push(m),
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"), cap:s=>s?s.charAt(0).toUpperCase()+s.slice(1):s,
    ROSTER:["kenzie","caleb"], ROSTER_DEF:[{id:"kenzie",name:"Kenzie",color:"#f0f"},{id:"caleb",name:"Caleb",color:"#0f0"}], KID_COLOR:{kenzie:"#1e3a5f",caleb:"#2b7a78"},
    WK:"week12", activeWk:()=>"week12", supplies:o.supplies||{}, tab:"supplies", cbTodayISO:()=>TODAY, _todayStr:()=>TODAY,
    gvFilled:v=>!!(v&&v!=="—"&&String(v).trim()), _lidNorm:s=>String(s==null?"":s).replace(/\s+/g," ").trim().toLowerCase(), planBacked:()=>false,
    renderAll:()=>{ ctx._renders=(ctx._renders||0)+1; }, renderMomsPlan:()=>{}, sv:(k,v)=>{ ls[k]=JSON.stringify(v); }, ld:k=>ls[k]?JSON.parse(ls[k]):null,
    HA_LS:{getItem:k=>ls[k]===undefined?null:ls[k],setItem:(k,v)=>{ ls[k]=String(v); }}, confirm:()=>true, alert:()=>{}, showTab:()=>{}, mpGoto:v=>{ ctx._goto=v; },
    document:{getElementById:id=>id==="gr-pop"?pop:(DOM[id]||null),createElement:()=>({}),body:{appendChild:()=>{}},querySelectorAll:()=>[]}, _dom:DOM,
    kitOrderList:()=>({need:Object.keys(o.kitStaples||{}).filter(k=>o.kitStaples[k].state!=="have").map(k=>Object.assign({id:k},o.kitStaples[k])),usuals:{}}),
    kitStaples:o.kitStaples||{}, kitBuyLog:{}, kitPantry:{}, panAdd:()=>"", panStatus:()=>"fresh", rulesData:o.rules===undefined?null:o.rules, HA_IS_HOWE:false,
    gvKid:"kenzie", gvMenu:null, kitCapKey:()=>"sk-ant-test" };
  ctx.lidsFor=(kid,sk)=>{ const s=(((ctx.currData||{}).subjects||{})[kid]||{})[sk]; return (s&&Array.isArray(s.lessonIds)&&Array.isArray(s.lessonSeq)&&s.lessonIds.length===s.lessonSeq.length)?s.lessonIds:null; };
  ctx.lidStamped=(kid,sk)=>{ const s=(((ctx.currData||{}).subjects||{})[kid]||{})[sk]; return !!(s&&s.doneImportedAt&&ctx.lidsFor(kid,sk)); };
  ctx.lidDoneSet=(kid,sk)=>ctx.lidStamped(kid,sk)?new Set(Object.keys(((((ctx.currData||{}).done||{})[kid]||{})[sk])||{})):null;
  ctx.taskLessonRef=t=>{ const m=String(t&&t.title||"").match(/[—–]\s*(.+)$/); return m?m[1].trim():""; };
  ctx.lidForTask=()=>null; ctx.gwGetSubjects=kid=>((ctx.currData||{}).subjects||{})[kid]||{};
  ctx.gvCellIdentity=(kid,dn,sk)=>({mode:"stored",text:String(((((ctx.currData||{}).lessons||{})[kid]||{})[dn]||{})[sk]||"")});
  ctx.gvCellLesson=(kid,dn,sk)=>{ const text=ctx.gvCellIdentity(kid,dn,sk).text; const ids=ctx.lidsFor(kid,sk); if(!ids) return null; const seq=ctx.currData.subjects[kid][sk].lessonSeq; const i=seq.findIndex(x=>ctx._lidNorm(x)===ctx._lidNorm(text)); return i<0?null:{i:i,lid:ids[i]}; };
  vm.createContext(ctx);
  vm.runInContext(fn("kitSlug")+"\n"+LL+"\n"+LR+"\n"+SN+"\n"+GL+"\n"+(o.noBL?"":BL),ctx,{filename:"buylink.js"});
  ctx.grRepaint=()=>{ ctx._grRepaints=(ctx._grRepaints||0)+1; }; ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grPaidMathHTML=()=>""; ctx.grWeekNeeds=()=>[]; ctx.mwBanner=s=>'<b>'+s+'</b>'; ctx.momTipsGroceryHTML=()=>""; ctx.mpSubnav=()=>"";
  vm.runInContext("grData.stores="+JSON.stringify(o.stores||{foodlion:{name:"Food Lion",color:"#d6001c"},hobby:{name:"Hobby Lobby",color:"#1e40af"}})+"; grData.items="+JSON.stringify(o.items||{})+"; grData.home={};"
    +(o.lrStaples?"Object.assign(lrStaples,"+JSON.stringify(o.lrStaples)+");":""),ctx);
  const run=e=>vm.runInContext(e,ctx);
  return {run,ctx,writes,toasts,pop,ls,DOM,data:()=>run("grData"),list:()=>run("lrBuildList()"),items:()=>run("grData.items"),
    item:name=>run("lrBuildList().items").find(x=>x.name===name), sunday:()=>run("lrSundayHTML()"), shop:sid=>{ run("grSetStore("+JSON.stringify(sid||"all")+")"); const el={innerHTML:""}; run("renderGrocery")(el); return el.innerHTML; }};
}
const sets=(W,re)=>W.writes.filter(w=>w[0]==="set"&&re.test(w[1]));

console.log("── the fixture ──");
{ const W=mk(); const L=W.list();
  ok("the Sunday list has Kenzie's glue stick (×2, this week), Charlotte's Web (book), the Protractor (next week, to order) and Caleb's baking soda", L.items.map(i=>i.name).sort().join("|")==="Charlotte's Web|Protractor|baking soda|glue stick", L.items.map(i=>i.name));
  const g=W.item("glue stick"); ok("…glue stick: id lr_kenzie_math_supplies_glue_stick, week 0, detail '2'", g.id==="lr_kenzie_math_supplies_glue_stick"&&g.weeks.join()==="0"&&g.detail==="2");
  ok("…the Protractor is next week only (week13)", W.item("Protractor").weeks.join()==="1"&&W.run("lrWk(1)")==="week13");
}
console.log("── send once → ONE Shopping List item, with ref, under the picked store ──");
{ const W=mk(); const g=W.item("glue stick");
  const r=W.run("blSend")(g,"hobby");
  const I=W.items(), ids=Object.keys(I);
  ok("one item made, not linked to an old one", r&&!r.linked&&ids.length===1, r);
  const it=I[ids[0]];
  ok("…name, ×2 from the Sunday qty, under Hobby Lobby, ref = {lr:<lrItemId>, wk:'week12'}", it.name==="glue stick"&&it.qty===2&&(it.stores||[]).join()==="hobby"&&it.ref&&it.ref.lr===g.id&&it.ref.wk==="week12", it);
  ok("…its source tag says 🧺 Sunday list · Kenzie", it.src&&it.src[0].k==="lr"&&it.src[0].lbl==="🧺 Sunday list · Kenzie");
  ok("…ONE targeted write: kitchen/grocery/items/<id> with the ref inside (no separate ref write)", sets(W,/^kitchen\/grocery\/items\//).length===1&&sets(W,/^kitchen\/grocery\/items\//)[0][2].ref.lr===g.id&&!W.writes.some(w=>/\/ref$/.test(w[1])), W.writes.map(w=>w[1]));
  ok("…and the list row for it shows the 🛒 under Hobby Lobby", /glue stick/.test(W.shop("hobby"))&&/Sunday list · Kenzie/.test(W.shop("hobby")));
  ok("…the toast names the store list", W.toasts.some(t=>t==="🛒 glue stick → Hobby Lobby list"), W.toasts);
  ok("the book: 'by E. B. White' rides as the note, no qty", (W.run("blSend")(W.item("Charlotte's Web"),"")||{}).id&&Object.values(W.items()).some(x=>x.name==="Charlotte's Web"&&x.note==="by E. B. White"&&!x.qty&&x.sort));
  console.log("── send twice → no second row ──");
  const n0=W.writes.length; const r2=W.run("blSend")(g,"foodlion");
  ok("the second send finds the link and stops: same id, 'already', no write, still one glue-stick row", r2&&r2.already&&r2.id===Object.keys(W.items()).find(i=>W.items()[i].name==="glue stick")&&W.writes.length===n0&&Object.values(W.items()).filter(x=>x.name==="glue stick").length===1, r2);
  ok("…and says so", W.toasts.some(t=>/glue stick is already on the Hobby Lobby list/.test(t)), W.toasts);
}
console.log("── an exact match already on the list is LINKED, never doubled (grFindDup first) ──");
{ const W=mk({items:{g9:{name:"Glue Sticks",sec:"other",src:[{k:"mom"}],sort:true,ts:1}}}); const g=W.item("glue stick");
  const r=W.run("blSend")(g,"hobby");
  ok("Mom's own 'Glue Sticks' row is the link (grKey: plural + case)", r&&r.linked&&r.id==="g9"&&Object.keys(W.items()).length===1, r);
  const it=W.items().g9;
  ok("…ref set on it, the picked store filled in because it had none, 📥 to-sort flag gone", it.ref&&it.ref.lr===g.id&&it.ref.wk==="week12"&&(it.stores||[]).join()==="hobby"&&!it.sort, it);
  ok("…ONE targeted update on kitchen/grocery/items/g9 (ref + stores + sort:null), no set of the whole list", W.writes.length===1&&W.writes[0][0]==="update"&&W.writes[0][1]==="kitchen/grocery/items/g9"&&W.writes[0][2].ref.lr===g.id&&W.writes[0][2].stores.join()==="hobby"&&W.writes[0][2].sort===null, W.writes);
  ok("…the toast says it was already there and is now linked", W.toasts.some(t=>/was already on the Hobby Lobby list — linked/.test(t)), W.toasts);
  const W2=mk({items:{g8:{name:"glue stick",sec:"other",src:[{k:"dad"}],stores:["foodlion"],ts:1}}});
  W2.run("blSend")(W2.item("glue stick"),"hobby");
  ok("a match that already has a store keeps its store (Food Lion), only the ref is written", W2.items().g8.stores.join()==="foodlion"&&W2.writes.length===1&&JSON.stringify(Object.keys(W2.writes[0][2]))==='["ref"]');
}
console.log("── the row chip: → 🛒 before, 'on the … list' after; kids never see either ──");
{ const W=mk(); const g=W.item("glue stick");
  const before=W.run("blRowChipHTML")(g);
  ok("Mom: a → 🛒 button that opens the store question for this row", /blPickOpen\('lr_kenzie_math_supplies_glue_stick'\)/.test(before)&&/→ 🛒/.test(before), before);
  ok("…the Sunday list draws it on every row (4 rows → 4 buttons)", (W.sunday().match(/→ 🛒/g)||[]).length===4);
  W.run("blSend")(g,"hobby");
  const after=W.run("blRowChipHTML")(g);
  ok("after the send: '🛒 on the Hobby Lobby list' which opens the Shopping List at Hobby Lobby", /🛒 on the Hobby Lobby list/.test(after)&&/blGo\('hobby'\)/.test(after)&&!/→ 🛒/.test(after), after);
  W.run("blGo('hobby')"); ok("…blGo sets the store chip and goes to the list page", W.run("grStore")==="hobby"&&W.ctx._goto==="grocery"&&W.run("grFromDad")===false);
  ok("…the Sunday list now shows 3 → 🛒 and one 'on the … list' chip", (W.sunday().match(/→ 🛒/g)||[]).length===3&&(W.sunday().match(/🛒 on the Hobby Lobby list/g)||[]).length===1);
  W.run("grToggle")(Object.keys(W.items())[0]);
  ok("in the cart → the chip says so", /on the Hobby Lobby list · in the cart/.test(W.run("blRowChipHTML")(g)));
  const K=mk({mom:false}); K.run("grData.items="+JSON.stringify(W.items()));
  ok("a kid's device: no → 🛒, no 'on the list' chip, and blSend does nothing", K.run("blRowChipHTML")(g)===""&&!/🛒/.test(K.sunday().replace(/🛒 To order/g,""))&&K.run("blSend")(g,"hobby")===null&&K.writes.length===0);
}
console.log("── the store question: the family's stores, Any store, ＋ Add a store ──");
{ const W=mk(); const g=W.item("glue stick");
  W.run("blPickOpen('lr_kenzie_math_supplies_glue_stick')");
  const h=W.pop.innerHTML;
  ok("the pop-up names the item and offers Food Lion, Hobby Lobby, Any store and an ＋ Add a store box", /<b>glue stick<\/b> → which store\?/.test(h)&&/blPickGo\('foodlion'\)/.test(h)&&/blPickGo\('hobby'\)/.test(h)&&/blPickGo\(''\)/.test(h)&&/id="bl-store-new"/.test(h)&&/Add a store \(Hobby Lobby…\)/.test(h), h.slice(0,300));
  W.DOM["bl-store-new"]={value:"Michaels"}; W.run("blPickAdd()");
  const S=W.data().stores, sid=Object.keys(S).find(k=>S[k].name==="Michaels");
  ok("＋ Add a store: Michaels is now one of the family's stores (kitchen/grocery/stores/<sid>, grStorePut's own shape)", !!sid&&/^c/.test(sid)&&sets(W,new RegExp("^kitchen/grocery/stores/"+sid+"$")).length===1&&S[sid].color&&S[sid].ts, S);
  const it=Object.values(W.items())[0];
  ok("…and the item went straight under it, linked", it&&it.name==="glue stick"&&it.stores.join()===sid&&it.ref.lr===g.id, it);
  ok("…the pop-up closed, the Sunday list redrew", W.pop.innerHTML===""&&W.run("_blPick")===null);
  ok("adding a store that exists (any case) reuses it — no second Hobby Lobby", W.run("blStoreAdd('hobby lobby')")==="hobby"&&Object.keys(W.data().stores).length===3);
  const W2=mk(); W2.run("blPickOpen('lr_kenzie_math_supplies_glue_stick')"); W2.run("blPickGo('')");
  ok("Any store → the item lands in 📥 To sort with its ref", Object.values(W2.items())[0].sort===true&&Object.values(W2.items())[0].ref.lr===g.id);
  ok("the pop-up outside Mom mode never opens", (mk({mom:false}).run("blPickOpen('lr_kenzie_math_supplies_glue_stick')"),true)&&mk({mom:false}).pop.innerHTML==="");
}
console.log("── checkout → the tick lands on the Sunday list, for the right week ──");
{ const W=mk(); W.run("blSend")(W.item("glue stick"),"hobby"); W.run("blSend")(W.item("Protractor"),"hobby");
  const I=W.items(); const gid=Object.keys(I).find(i=>I[i].name==="glue stick"), pid=Object.keys(I).find(i=>I[i].name==="Protractor");
  ok("the Protractor's ref is for NEXT week (week13)", I[pid].ref.wk==="week13");
  W.run("grToggle")(gid); W.run("grToggle")(pid); W.writes.length=0;
  W.run("grDoneRun('hobby',12.5,{})");
  ok("🧾 checkout at Hobby Lobby: ONE set week12/supplies/lr_kenzie_math_supplies_glue_stick = true", sets(W,/^week12\/supplies\//).length===1&&W.writes.some(w=>w[0]==="set"&&w[1]==="week12/supplies/lr_kenzie_math_supplies_glue_stick"&&w[2]===true), W.writes.map(w=>w[1]));
  ok("…and ONE set week13/supplies/lr_kenzie_math_orders_protractor = true (the week it was sent for)", W.writes.some(w=>w[0]==="set"&&w[1]==="week13/supplies/lr_kenzie_math_orders_protractor"&&w[2]===true));
  ok("…this week's tick is in memory too, so the Sunday list redraws ticked", W.run("supplies['lr_kenzie_math_supplies_glue_stick']")===true&&W.run("lrTicked('lr_kenzie_math_supplies_glue_stick',0)")===true);
  ok("…both rows left the list (the finisher's own path), and sit in 🧾 cleared with their ref", Object.keys(W.items()).length===0&&W.run("grData.cleared")[gid].ref.lr==="lr_kenzie_math_supplies_glue_stick");
  ok("…the Sunday list rows are ticked and carry no buy chip any more (got it) — the two unbought rows keep → 🛒", (W.sunday().match(/sup-item done/g)||[]).length===2&&(W.sunday().match(/→ 🛒/g)||[]).length===2&&!/🛒 on the/.test(W.sunday()), W.sunday().match(/→ 🛒|sup-item done/g));
  const N=mk(); N.run("grData.items={x1:{name:'Milk',sec:'dairy',src:[{k:'mom'}],done:true,ts:1}}"); N.writes.length=0; N.run("grDoneRun('all',3,{})");
  ok("an item with no ref: the finisher is as before — no supplies write", !N.writes.some(w=>/supplies/.test(w[1]))&&N.writes.some(w=>w[1]==="kitchen/grocery/items/x1"&&w[0]==="remove"));
}
console.log("── a staple round-trips: → 🛒 as out, bought → ✅ have on its OWN path ──");
{ const W=mk({lrStaples:{st1:{name:"Glue sticks",state:"out"},st2:{name:"Printer paper",state:"have"}}});
  const chips=W.sunday();
  ok("the Sunday list's out staple carries →🛒; the stocked one does not", /blPickOpen\('','st1'\)/.test(chips)&&!/blPickOpen\('','st2'\)/.test(chips), chips.match(/blPickOpen[^"]*/g));
  W.run("blPickOpen('','st1')"); W.run("blPickGo('foodlion')");
  const I=W.items(), id=Object.keys(I)[0];
  ok("one Shopping List item for the staple, ref = {st:'st1'}, under Food Lion, tagged 🧷 staple", Object.keys(I).length===1&&I[id].name==="Glue sticks"&&I[id].ref.st==="st1"&&I[id].stores.join()==="foodlion"&&I[id].src[0].lbl==="🧷 staple", I);
  ok("…the chip now says it is on the list", /blGo\('foodlion'\)" title="On the Shopping List"/.test(W.sunday()));
  ok("sending it again → no second row", W.run("blSendStaple")(W.run("lrStaplesAll()").find(s=>s.id==="st1"),"hobby").already&&Object.keys(W.items()).length===1);
  W.run("grToggle")(id); W.writes.length=0; W.run("grDoneRun('foodlion',4,{})");
  ok("bought → supplies/staples/st1 = {name, state:'have'} (its own path), nothing under kitchen/staples", W.writes.some(w=>w[0]==="set"&&w[1]==="supplies/staples/st1"&&w[2].state==="have"&&w[2].name==="Glue sticks")&&!W.writes.some(w=>/kitchen\/staples/.test(w[1])), W.writes);
  ok("…in memory too: the chip is ✅ have, the →🛒 is gone", W.run("lrStaples.st1.state")==="have"&&!/blPickOpen\('','st1'\)/.test(W.sunday()));
  const K=mk({kitStaples:{k1:{name:"Almond milk",state:"out",ts:1}}});
  K.run("grData.items={q1:{name:'Almond milk',sec:'dairy',src:[{k:'mom'}],ref:{st:'k1'},done:true,ts:1}}"); K.writes.length=0; K.run("grDoneRun('all',3,{})");
  ok("a kitchen staple's id → kitchen/staples/<id> (its own path), state have", K.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/staples/k1"&&w[2].state==="have")&&!K.writes.some(w=>/supplies\/staples/.test(w[1]))&&K.run("kitStaples.k1.state")==="have");
  const V=mk({kitStaples:{k1:{name:"Almond milk",state:"out",ts:1}}});
  ok("a kitchen staple that already rides the list live (a virtual row) is not doubled", V.run("blSendStaple")({id:"k1",name:"Almond milk",state:"out"},"foodlion").virt===true&&Object.keys(V.items()).length===0&&V.toasts.some(t=>/already on the Shopping List \(🧺 staple\)/.test(t)));
}
console.log("── the family rule: config/rules/buy = {auto:true, store:{…}} sends each new item to its kind's store on draw ──");
{ const W=mk({rules:{buy:{auto:true,store:{supplies:"hobby",books:"foodlion"}}}});
  W.sunday();
  const I=W.items(), by=n=>Object.values(I).find(x=>x.name===n);
  ok("one draw → the 4 items are on the Shopping List, each once, each with its ref", Object.keys(I).length===4&&["glue stick","Charlotte's Web","Protractor","baking soda"].every(n=>by(n)&&by(n).ref&&by(n).ref.lr), Object.values(I).map(x=>x.name));
  ok("supplies → Hobby Lobby (glue stick, baking soda); books → Food Lion; orders (no store in the rule) → 📥 To sort", by("glue stick").stores.join()==="hobby"&&by("baking soda").stores.join()==="hobby"&&by("Charlotte's Web").stores.join()==="foodlion"&&by("Protractor").sort===true&&!by("Protractor").stores);
  ok("…four targeted item writes (+ grCreate's own first-pick home memory, kitchen/grocery/home/<slug>), nothing else", W.writes.filter(w=>/^kitchen\/grocery\/items\//.test(w[1])).length===4&&W.writes.every(w=>w[0]==="set"&&/^kitchen\/grocery\/(items|home)\//.test(w[1])), W.writes.map(w=>w[1]));
  ok("…quiet: no toasts, no list repaint storm", W.toasts.length===0);
  const n=W.writes.length; W.sunday(); W.sunday();
  ok("drawing again sends nothing more (already linked)", W.writes.length===n&&Object.keys(W.items()).length===4);
  const I2=W.items(); const gid=Object.keys(I2).find(i=>I2[i].name==="glue stick"); W.run("grToggle")(gid); W.run("grDoneRun('hobby',5,{})"); const n2=W.writes.length; W.sunday();
  ok("after a checkout the bought item is ticked and cleared → the next draw does NOT send it again", Object.keys(W.items()).length===3&&W.writes.length===n2);
  const T=mk({rules:{buy:{auto:true,store:{supplies:"hobby"}}},supplies:{lr_kenzie_math_supplies_glue_stick:true}}); T.sunday();
  ok("an item already ticked for its week is not sent", !Object.values(T.items()).some(x=>x.name==="glue stick")&&Object.keys(T.items()).length===3);
  const R=mk({rules:{buy:{auto:true,store:{supplies:"nope"}}}}); R.sunday();
  ok("a store id the family no longer has → the item still goes, to 📥 To sort", Object.values(R.items()).find(x=>x.name==="glue stick").sort===true);
  const K=mk({rules:{buy:{auto:true,store:{supplies:"hobby"}}},mom:false}); K.sunday();
  ok("the rule runs only on Mom's device: a kid's draw sends nothing", Object.keys(K.items()).length===0&&K.writes.length===0);
  const F=mk({rules:{buy:{auto:false,store:{supplies:"hobby"}}}}); F.sunday();
  ok("auto:false → taps only", Object.keys(F.items()).length===0&&F.writes.length===0);
}
console.log("── no rule (DeWalt, Burris today) → nothing happens on draw ──");
{ const W=mk(); W.sunday(); W.sunday();
  ok("rulesData null: the draw writes nothing and makes no item", W.writes.length===0&&Object.keys(W.items()).length===0);
  const E=mk({rules:{minMinutes:{grace:2}}}); E.sunday();
  ok("rules without buy: the same", E.writes.length===0&&Object.keys(E.items()).length===0&&E.run("blRule()")===null);
}
console.log("── dry run ──");
{ const W=mk({dry:true,items:{g9:{name:"Glue stick",sec:"other",src:[{k:"mom"}],ts:1}},lrStaples:{st1:{name:"Glue sticks",state:"out"}}});
  W.run("blSend")(W.item("glue stick"),"hobby");
  ok("?dryrun=1: linking an existing row changes memory but writes nothing", W.items().g9.ref&&W.items().g9.ref.lr==="lr_kenzie_math_supplies_glue_stick"&&W.writes.length===0, W.writes);
  W.run("grData.items.g9.done=true; grData.items.x2={name:'Paper',sec:'other',src:[{k:'mom'}],ref:{st:'st1'},done:true,ts:1}"); W.run("grDoneRun('all',0,{})");
  ok("…the checkout's tick and staple→have write nothing either (grDoneRun's own writes aside)", !W.writes.some(w=>/supplies/.test(w[1])&&w[0]==="set"&&(w[2]===true||(w[2]&&w[2].state))), W.writes.filter(w=>/supplies/.test(w[1])));
  ok("in the real app every db.ref() is neutralised under ?dryrun=1, so grCreate's own write is inert too", /if\(_dryRun\(\)\)\{\s*try\{\s*const _origRef=db\.ref\.bind\(db\);/.test(src));
  const D=mk({dry:true,rules:{buy:{auto:true,store:{supplies:"hobby"}}}}); D.ctx.db={ref:p=>({set:()=>{ D.ctx._dryWrites=(D.ctx._dryWrites||0)+1; },update:()=>{},remove:()=>{}})};
  ok("blDb() is null in dry run — the block never reaches db", D.run("blDb()")===null);
}
console.log("── another family with no ref anywhere renders byte-identical (DeWalt dry-run shape) ──");
{ const items={d1:{name:"Milk",sec:"dairy",src:[{k:"mom"}],stores:["foodlion"],ts:1},d2:{name:"Crayons",sec:"other",src:[{k:"dad"}],sort:true,ts:2}};
  const A=mk({items:items}), B=mk({items:items,noBL:true});
  ok("the Shopping List page (All + a store) with no ref on any item: byte-identical with and without the block", A.shop("all")===B.shop("all")&&A.shop("foodlion")===B.shop("foodlion"));
  const KA=mk({items:items,mom:false}), KB=mk({items:items,mom:false,noBL:true});
  ok("a kid's Sunday list: byte-identical with and without the block", KA.sunday()===KB.sunday());
  const MA=mk({items:items}), MB=mk({items:items,noBL:true});
  ok("Mom's Sunday list differs only by the → 🛒 button on each row", MA.sunday().replace(/<button onclick="blPickOpen\([^"]*\)"[^>]*>→ 🛒<\/button>/g,"")===MB.sunday()&&MA.sunday()!==MB.sunday());
  ok("…and the → 🛒 button never carries a kid's name or an answer", !/Kenzie|Caleb/.test((MA.sunday().match(/<button onclick="blPickOpen[^>]*>→ 🛒<\/button>/g)||[]).join("")));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
