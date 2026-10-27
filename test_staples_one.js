/* 🧺 STAPLES1 — one staples list with a 🏫 school / 🍳 kitchen tag (her answer 11, 2026-10-26). kitchen/staples and supplies/staples read as
 * one tagged list; writes stay on each item's own path; a new staple asks its tag; a one-list family renders byte-identical.
 * Run: node test_staples_one.js [index.html] */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(process.argv[2]||path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing line "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const LL=cut("// LESSONLINK_START","// LESSONLINK_END"), LR=cut("// LESSONRES_START","// LESSONRES_END"), SN=cut("// SHOPNAME_START","// SHOPNAME_END"), GL=cut("// GROCERY_LIST_START","// GROCERY_LIST_END"), BL=cut("// BUYLINK_START","// BUYLINK_END"), ST=cut("// STAPLES1_START","// STAPLES1_END");
// the Kitchen's 🧺 Staples card: the lines of renderKitchen between its two section comments, run on their own
const RK=fn("renderKitchen"); const KCARD=RK.slice(RK.indexOf("  // ── 🧺 Staples — curated"),RK.indexOf("  // ── 🔁 Standing usuals"));
const KIT=[line("const KIT_STATES="),line("const KIT_STATE_META="),line("const KIT_CATS="),fn("kitStapleCycle"),fn("kitStapleAdd"),fn("kitStapleDel"),fn("kitStapleToggleManage"),fn("kitStapleChip")].join("\n");

console.log("── the block and its hooks ──");
{ const a=src.indexOf("// STAPLES1_START"), b=src.indexOf("// STAPLES1_END"), be=src.indexOf("// BUYLINK_END");
  ok("STAPLES1 block present once, right after BUYLINK_END", a>0&&b>a&&src.indexOf("// STAPLES1_START",a+5)<0&&src.indexOf("// STAPLES1_END",b+5)<0&&src.slice(be,a).trim()==="// BUYLINK_END");
  ok("kitStapleAdd hands a new name to the tag question (guarded, Kitchen first)", (src.match(/if\(typeof stpAskAdd==="function"\)\{ if\(inp\) inp\.value=""; stpAskAdd\(name,"kitchen"\); return; \}/g)||[]).length===1&&fn("kitStapleAdd").indexOf("stpAskAdd")>0);
  ok("lrStapleAdd hands a new name to the tag question (guarded, School first)", (src.match(/if\(typeof stpAskAdd==="function"\)\{ if\(inp\) inp\.value=""; stpAskAdd\(name,"school"\); return; \}/g)||[]).length===1&&fn("lrStapleAdd").indexOf("stpAskAdd")>0);
  ok("the Kitchen card folds the school staples under its own (guarded)", (src.match(/h\+=\(typeof stpOtherHTML==="function"\)\?stpOtherHTML\("kitchen",kitStapleManage\):"";/g)||[]).length===1&&KCARD.indexOf('stpOtherHTML("kitchen"')>0);
  ok("the Sunday list folds the kitchen staples under its own (guarded)", (src.match(/h\+=\(typeof stpOtherHTML==="function"\)\?stpOtherHTML\("school",mom&&lrStapleManage\):"";/g)||[]).length===1&&fn("lrSundayHTML").indexOf('stpOtherHTML("school"')>0);
  ok("the checkout's staple → have goes through the one writer (guarded)", (src.match(/if\(typeof stpSetState==="function"\)\{ const t=stpSetState\(stId,"have"\); if\(t\) return t; \}/g)||[]).length===1&&fn("blStapleHave").indexOf("stpSetState")>0);
  ok("every write in the block goes through stpDb() (db && !_dryRun()) — never a bare db.ref", !/[^p]db\.ref\(/.test(ST.replace(/stpDb\(\)/g,""))&&/function stpDb\(\)\{ return \(typeof db!=="undefined"&&db&&!\(\(typeof _dryRun==="function"\)&&_dryRun\(\)\)\)\?db:null; \}/.test(ST));
  ok("no migration: the block never writes one path from the other's record, never moves or copies an id", !/kitchen\/staples\/"\+id\)\.set\(S\[|supplies\/staples\/"\+id\)\.set\(K\[/.test(ST)&&!/migrat|moveTo|copy/i.test(ST.replace(/\/\/[^\n]*/g,"")));
  ok("no 🔀 in index.html; no Howe kid's name in the block", src.indexOf("\u{1F500}")<0&&!/Lincoln|Ellis|Lucy|Julian/i.test(ST));
}

// ── a world: both staples lists, the Kitchen card, the Sunday list, the Shopping List's checkout ──
const TODAY="2026-10-23";
function mk(o){
  o=o||{}; const writes=[], toasts=[], pop={innerHTML:""}, DOM={}, ls={}, confirms=[];
  const ctx={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,RegExp,Promise,URL,parseInt,parseFloat,isNaN,encodeURIComponent,setTimeout:()=>0,navigator:{},
    currData:{subjects:{},lessons:{},resources:{}}, weekData:{tasks:[]},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p]),on:()=>{},once:()=>{}})},
    momHere:()=>o.mom!==false, _dryRun:()=>!!o.dry, dadAwardOk:()=>false, kitPinGate:(then)=>{ if(o.mom!==false) then(); }, mwToast:m=>toasts.push(m),
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"), cap:s=>s?s.charAt(0).toUpperCase()+s.slice(1):s,
    ROSTER:[], ROSTER_DEF:[], KID_COLOR:{}, WK:"week12", activeWk:()=>"week12", supplies:{}, tab:o.tab||"supplies", cbTodayISO:()=>TODAY, _todayStr:()=>TODAY,
    gvFilled:v=>!!v, _lidNorm:s=>String(s||"").toLowerCase(), planBacked:()=>false, lidsFor:()=>null, lidStamped:()=>false, lidDoneSet:()=>null, lidForTask:()=>null, gwGetSubjects:()=>({}),
    gvCellIdentity:()=>({mode:"stored",text:""}), gvCellLesson:()=>null, taskLessonRef:()=>"",
    renderAll:()=>{ ctx._renders=(ctx._renders||0)+1; }, renderMomsPlan:()=>{ ctx._mpRenders=(ctx._mpRenders||0)+1; }, sv:(k,v)=>{ ls[k]=JSON.stringify(v); }, ld:k=>ls[k]?JSON.parse(ls[k]):null,
    HA_LS:{getItem:k=>ls[k]===undefined?null:ls[k],setItem:(k,v)=>{ ls[k]=String(v); }}, confirm:m=>{ confirms.push(m); return o.no?false:true; }, alert:()=>{}, showTab:()=>{}, mpGoto:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:(id==="content"?{innerHTML:""}:(DOM[id]||null)),createElement:()=>({}),body:{appendChild:()=>{}},querySelectorAll:()=>[]}, _dom:DOM,
    kitOrderList:()=>({need:[],usuals:{}}), kitBuyLog:{}, kitPantry:{}, panAdd:()=>"", panStatus:()=>"fresh", rulesData:null, HA_IS_HOWE:false, gvKid:"", gvMenu:null, kitCapKey:()=>"k",
    kitSettings:{orderDay:o.orderDay||""}, DAYS_ALL:["mon","tue","wed","thu","fri","sat","sun"], kitSetOrderDay:()=>{}, kitUsuals:{} };
  vm.createContext(ctx);
  vm.runInContext("var kitStaples="+JSON.stringify(o.kitchen||{})+"; var kitStapleManage=false;\n"+KIT+"\n"+fn("kitSlug")+"\n"+LL+"\n"+LR+"\n"+SN+"\n"+GL+"\n"+BL+"\n"+(o.noST?"":ST)
    +"\nfunction kitchenCardHTML(){ let h=''; "+KCARD+" return h; }",ctx,{filename:"staples.js"});
  ctx.grRepaint=()=>{}; ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grPaidMathHTML=()=>""; ctx.grWeekNeeds=()=>[]; ctx.mwBanner=()=>""; ctx.momTipsGroceryHTML=()=>""; ctx.mpSubnav=()=>"";
  vm.runInContext("grData.stores={foodlion:{name:'Food Lion',color:'#d6001c'}}; grData.items={};"+(o.school?"Object.assign(lrStaples,"+JSON.stringify(o.school)+");":""),ctx);
  const run=e=>vm.runInContext(e,ctx);
  return {run,ctx,writes,toasts,pop,ls,DOM,confirms,kitchen:()=>run("kitStaples"),school:()=>run("lrStaples"),card:()=>run("kitchenCardHTML()"),sunday:()=>run("lrSundayHTML()")};
}
const KITCHEN={s1:{name:"Milk",state:"have",ts:1},s2:{name:"Eggs",state:"out",ts:2}}, SCHOOL={st1:{name:"Glue sticks",state:"low"},st2:{name:"Printer paper",state:"have"}};

console.log("── one reader over both paths, each item tagged by where it lives ──");
{ const W=mk({kitchen:KITCHEN,school:SCHOOL});
  const all=W.run("staplesAll()");
  ok("staplesAll(): four items A–Z, kitchen ones tagged kitchen, school ones tagged school", all.map(s=>s.name+":"+s.tag).join("|")==="Eggs:kitchen|Glue sticks:school|Milk:kitchen|Printer paper:school", all);
  ok("…each keeps its own id, state and (kitchen) ts", all.find(s=>s.id==="s2").state==="out"&&all.find(s=>s.id==="s2").ts===2&&all.find(s=>s.id==="st1").state==="low"&&all.find(s=>s.id==="st1").ts===undefined);
  ok("staplesAll('school') / ('kitchen') filter by tag", W.run("staplesAll('school')").length===2&&W.run("staplesAll('kitchen')").map(s=>s.id).join()==="s2,s1");
  ok("stpTagOf / stpPath: the item's own path", W.run("stpTagOf('s1')")==="kitchen"&&W.run("stpPath('s1')")==="kitchen/staples/s1"&&W.run("stpTagOf('st1')")==="school"&&W.run("stpPath('st1')")==="supplies/staples/st1"&&W.run("stpPath('nope')")==="");
  ok("the Sunday list's own readers are unchanged: lrStaplesAll() is still the school list only", W.run("lrStaplesAll()").map(s=>s.id).join()==="st1,st2"&&W.run("lrBuildList().staples").map(s=>s.id).join()==="st1");
  ok("the Kitchen's own readers are unchanged: kitStaples is still the kitchen map only", Object.keys(W.kitchen()).join()==="s1,s2");
}
console.log("── each screen shows the one list: its own tag open, the other folded ──");
{ const W=mk({kitchen:KITCHEN,school:SCHOOL});
  const card=W.card();
  ok("the Kitchen card: its own chips as before (kitStapleChip, kitStapleCycle)…", /kitStapleCycle\('s1'\)/.test(card)&&/kitStapleCycle\('s2'\)/.test(card));
  ok("…then '🏫 School staples (2 · 1 low or out) ▸' folded, with the school chips tapping stpCycle", /<details[^>]*><summary[^>]*>🏫 School staples \(2 · 1 low or out\) ▸<\/summary>/.test(card)&&/stpCycle\('st1'\)/.test(card)&&/stpCycle\('st2'\)/.test(card)&&/🟡 Glue sticks/.test(card), card.slice(card.indexOf("<details"),card.indexOf("<details")+300));
  ok("…and the school chips are not in the open row", card.indexOf("stpCycle('st1')")>card.indexOf("<details"));
  const sun=W.sunday();
  ok("the Sunday list: its own 🧷 Staples as before (lrStapleCycle)…", /lrStapleCycle\('st1'\)/.test(sun)&&/lrStapleCycle\('st2'\)/.test(sun));
  ok("…then '🍳 Kitchen staples (2 · 1 low or out) ▸' folded, with the kitchen chips tapping stpCycle", /<details[^>]*><summary[^>]*>🍳 Kitchen staples \(2 · 1 low or out\) ▸<\/summary>/.test(sun)&&/stpCycle\('s2'\)/.test(sun)&&/❌ Eggs/.test(sun));
  ok("…the folded section says the chips live on the other page and change there too", /live on the 🍳 Meals page/.test(sun)&&/live on the 🧺 Sunday list/.test(card));
  ok("the folded section's chips carry →🛒 for a low/out one (BUYLINK) and the title names the tag", /title="🍳 Kitchen staple — tap: have → low → out"/.test(sun)&&/blPickOpen\('','s2'\)/.test(sun));
}
console.log("── have / low / out from either screen — each write on the item's OWN path ──");
{ const W=mk({kitchen:KITCHEN,school:SCHOOL,tab:"moms-plan"});
  W.run("stpCycle('st1')");
  ok("a school staple tapped from the Kitchen: low → out, ONE set supplies/staples/st1 = {name,state} (the Sunday list's own shape)", W.school().st1.state==="out"&&W.writes.length===1&&W.writes[0][0]==="set"&&W.writes[0][1]==="supplies/staples/st1"&&JSON.stringify(W.writes[0][2])==='{"name":"Glue sticks","state":"out"}', W.writes);
  ok("…nothing under kitchen/staples, and the Kitchen repainted (Mom's Day)", !W.writes.some(w=>/kitchen\/staples/.test(w[1]))&&W.ctx._mpRenders===1);
  W.writes.length=0; W.run("stpCycle('s2')");
  ok("a kitchen staple tapped from the Sunday list: out → have, ONE set kitchen/staples/s2 = {name,state,ts} (the Kitchen's own shape)", W.kitchen().s2.state==="have"&&W.writes.length===1&&W.writes[0][1]==="kitchen/staples/s2"&&W.writes[0][2].state==="have"&&W.writes[0][2].name==="Eggs"&&typeof W.writes[0][2].ts==="number", W.writes);
  ok("…the local copies follow (ha_kit_staples / ha_lr_staples)", /"have"/.test(W.ls.ha_kit_staples)&&/"out"/.test(W.ls.ha_lr_staples));
  W.writes.length=0; W.run("stpCycle('st1')"); W.run("stpCycle('st1')");
  ok("out → have → low: the full cycle", W.school().st1.state==="low"&&W.writes.length===2);
  const S=mk({kitchen:KITCHEN,school:SCHOOL,tab:"supplies"}); S.run("stpCycle('s1')");
  ok("from the Sunday list tab: the tap lands (renderSupplies redraws #content, no throw)", S.kitchen().s1.state==="low"&&S.writes.length===1&&S.writes[0][1]==="kitchen/staples/s1");
  const K=mk({kitchen:KITCHEN,school:SCHOOL,mom:false}); K.run("stpCycle('st1')"); K.run("stpCycle('s1')");
  ok("not Mom: a school staple keeps the Sunday list's gate (nothing), a kitchen staple keeps the Kitchen's open tap (as its own chips)", K.school().st1.state==="low"&&K.kitchen().s1.state==="low"&&K.writes.length===1&&K.writes[0][1]==="kitchen/staples/s1");
  ok("stpSetState on an id that lives nowhere → '' and no write", W.run("stpSetState('zzz','have')")===""&&!W.writes.some(w=>/zzz/.test(w[1])));
  ok("the Kitchen's own chip tap (kitStapleCycle) and the Sunday list's (lrStapleCycle) are as before", fn("kitStapleCycle").indexOf("kitchen/staples/")>0&&fn("lrStapleCycle").indexOf("supplies/staples/")>0&&!/stp/.test(fn("kitStapleCycle"))&&!/stp/.test(fn("lrStapleCycle")));
}
console.log("── ✕ from either screen ──");
{ const W=mk({kitchen:KITCHEN,school:SCHOOL});
  W.run("stpDel('st2')"); W.run("stpDel('s1')");
  ok("remove: asks, then ONE remove on the item's own path each", W.confirms.length===2&&W.writes.filter(w=>w[0]==="remove").map(w=>w[1]).join()==="supplies/staples/st2,kitchen/staples/s1"&&!W.school().st2&&!W.kitchen().s1, W.writes);
  const N=mk({kitchen:KITCHEN,school:SCHOOL,no:true}); N.run("stpDel('st1')");
  ok("…No → nothing", N.school().st1&&N.writes.length===0);
  ok("manage mode draws ✕ on the folded chips too", /stpDel\('st1'\)/.test(mk({kitchen:KITCHEN,school:SCHOOL}).run("stpOtherHTML('kitchen',true)"))&&!/stpDel/.test(mk({kitchen:KITCHEN,school:SCHOOL}).run("stpOtherHTML('kitchen',false)")));
}
console.log("── a new staple asks its tag ──");
{ const W=mk({kitchen:KITCHEN,school:SCHOOL});
  W.DOM["kit-staple-new"]={value:"  Oat milk  "}; W.run("kitStapleAdd()");
  ok("the Kitchen's ＋ Add: nothing written yet — a pop-up asks 🍳 Kitchen (first) or 🏫 School", W.writes.length===0&&/<b>Oat milk<\/b> — which staples\?/.test(W.pop.innerHTML)&&W.pop.innerHTML.indexOf("stpAskGo('kitchen')")<W.pop.innerHTML.indexOf("stpAskGo('school')")&&W.DOM["kit-staple-new"].value==="", W.pop.innerHTML.slice(0,200));
  W.run("stpAskGo('kitchen')");
  const kid=Object.keys(W.kitchen()).find(k=>W.kitchen()[k].name==="Oat milk");
  ok("🍳 Kitchen → kitchen/staples/s… = {name,state:'have',ts} — the Kitchen's own id scheme and shape", !!kid&&/^s[a-z0-9]+$/.test(kid)&&W.writes.length===1&&W.writes[0][1]==="kitchen/staples/"+kid&&W.writes[0][2].state==="have"&&typeof W.writes[0][2].ts==="number"&&W.pop.innerHTML==="", W.writes);
  W.writes.length=0; W.DOM["kit-staple-new"]={value:"Dry-erase markers"}; W.run("kitStapleAdd()"); W.run("stpAskGo('school')");
  const sid=Object.keys(W.school()).find(k=>W.school()[k].name==="Dry-erase markers");
  ok("🏫 School from the Kitchen → supplies/staples/st… = {name,state:'have'} — the Sunday list's own id scheme and shape; nothing under kitchen/staples", !!sid&&/^st[a-z0-9]+$/.test(sid)&&W.writes.length===1&&W.writes[0][1]==="supplies/staples/"+sid&&JSON.stringify(W.writes[0][2])==='{"name":"Dry-erase markers","state":"have"}', W.writes);
  W.writes.length=0; W.DOM["lr-staple-new"]={value:"Cardstock"}; W.run("lrStapleAdd()");
  ok("the Sunday list's Add asks too, 🏫 School first", W.writes.length===0&&W.pop.innerHTML.indexOf("stpAskGo('school')")<W.pop.innerHTML.indexOf("stpAskGo('kitchen')")&&W.DOM["lr-staple-new"].value==="");
  W.run("stpAskGo('kitchen')");
  ok("…🍳 Kitchen from the Sunday list → kitchen/staples/s…", W.writes.length===1&&/^kitchen\/staples\/s/.test(W.writes[0][1])&&W.writes[0][2].name==="Cardstock");
  W.writes.length=0; W.DOM["lr-staple-new"]={value:"Tape"}; W.run("lrStapleAdd()"); W.run("_stpAsk=null; grPopClose()");
  ok("Cancel → nothing written", W.writes.length===0&&!Object.values(W.school()).some(s=>s.name==="Tape"));
  W.DOM["kit-staple-new"]={value:"   "}; W.run("kitStapleAdd()");
  ok("a blank name never asks", W.pop.innerHTML===""&&W.writes.length===0);
  const K=mk({kitchen:KITCHEN,school:SCHOOL,mom:false}); K.DOM["kit-staple-new"]={value:"Juice"}; K.run("kitStapleAdd()"); K.run("stpAskGo('school')");
  ok("not Mom: 🏫 School writes nothing (the Sunday list's gate, as before); 🍳 Kitchen still adds (the Kitchen never had a gate)", K.writes.length===0&&(K.DOM["kit-staple-new"]={value:"Juice"},K.run("kitStapleAdd()"),K.run("stpAskGo('kitchen')"),K.writes.length===1&&/^kitchen\/staples\//.test(K.writes[0][1])));
  const L=mk({kitchen:KITCHEN,school:SCHOOL,mom:false}); L.DOM["lr-staple-new"]={value:"Juice"}; L.run("lrStapleAdd()");
  ok("not Mom on the Sunday list: lrStapleAdd's own gate stops it before the question", L.pop.innerHTML===""&&L.writes.length===0);
}
console.log("── checkout → ✅ have on either path (BUYLINK's finisher through the one writer) ──");
{ const W=mk({kitchen:{s2:{name:"Eggs",state:"out",ts:2}},school:{st1:{name:"Glue sticks",state:"out"}}});
  W.run("grData.items={a:{name:'Glue sticks',sec:'other',src:[{k:'lr'}],ref:{st:'st1'},done:true,ts:1},b:{name:'Eggs',sec:'dairy',src:[{k:'lr'}],ref:{st:'s2'},done:true,ts:1}}");
  W.run("grDoneRun('all',0,{})");
  ok("a bought school staple → supplies/staples/st1 = {name,state:'have'}", W.writes.some(w=>w[0]==="set"&&w[1]==="supplies/staples/st1"&&JSON.stringify(w[2])==='{"name":"Glue sticks","state":"have"}')&&W.school().st1.state==="have", W.writes.filter(w=>/staples/.test(w[1])));
  ok("a bought kitchen staple → kitchen/staples/s2 = {name,state:'have',ts}", W.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/staples/s2"&&w[2].state==="have"&&typeof w[2].ts==="number")&&W.kitchen().s2.state==="have");
  ok("…one staple write each, no cross-writes", W.writes.filter(w=>/staples\//.test(w[1])).length===2);
  ok("blStapleHave answers the tag it found", W.run("blStapleHave('st1')")==="school"&&W.run("blStapleHave('s2')")==="kitchen"&&W.run("blStapleHave('zz')")==="");
}
console.log("── a one-list family renders byte-identical (DeWalt, Burris) ──");
{ const A=mk({kitchen:KITCHEN}), B=mk({kitchen:KITCHEN,noST:true});
  ok("kitchen staples only: the Kitchen's 🧺 Staples card is byte-identical with and without the block", A.card()===B.card()&&A.card().length>200);
  const A2=mk({school:SCHOOL}), B2=mk({school:SCHOOL,noST:true});
  ok("school staples only: the Sunday list is byte-identical with and without the block", A2.sunday()===B2.sunday()&&A2.sunday().length>200);
  ok("…their Kitchen card shows the school staples folded (the one visible change for them, and only on the Kitchen)", A2.card()!==B2.card()&&A2.card().replace(/<details[\s\S]*?<\/details>/,"")===B2.card()&&/🏫 School staples \(2 · 1 low or out\) ▸/.test(A2.card()));
  const A3=mk(), B3=mk({noST:true});
  ok("no staples at all: both screens byte-identical", A3.card()===B3.card()&&A3.sunday()===B3.sunday());
  ok("stpOtherHTML is '' whenever the other tag has nothing", mk({kitchen:KITCHEN}).run("stpOtherHTML('kitchen')")===""&&mk({school:SCHOOL}).run("stpOtherHTML('school')")===""&&mk().run("stpOtherHTML('kitchen')")==="");
  const M=mk({kitchen:KITCHEN}), N=mk({kitchen:KITCHEN,noST:true});
  ok("a kitchen-only family's Sunday list shows the kitchen staples folded (the one visible change for them, and only on the Sunday list)", M.sunday()!==N.sunday()&&M.sunday().replace(/<details[\s\S]*?<\/details>/,"")===N.sunday());
}
console.log("── dry run ──");
{ const W=mk({kitchen:KITCHEN,school:SCHOOL,dry:true});
  W.run("stpCycle('st1')"); W.run("stpCycle('s1')"); W.DOM["kit-staple-new"]={value:"Oat milk"}; W.run("kitStapleAdd()"); W.run("stpAskGo('kitchen')"); W.run("stpDel('st2')");
  ok("?dryrun=1: taps, adds and removes change memory, write nothing", W.school().st1.state==="out"&&W.kitchen().s1.state==="low"&&Object.values(W.kitchen()).some(s=>s.name==="Oat milk")&&!W.school().st2&&W.writes.length===0, W.writes);
  ok("stpDb() is null in dry run", W.run("stpDb()")===null);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
