/* 💰 BUDGETTAB — Mom's Day ▸ 💰 Budget gets its own sub-row (slices 4 + 8 of PLAN_gift_tracker_budget_2026-11-20.md; her ask 2026-11-20
 * "this is also where the ESA grant and stuff … a new tab in Mom's Day called budget", her pick "Budget only"):
 *   · the row: 📊 Overview · 🎁 Gifts · 💰 ESA & purchases (ESA only when the Purchases page is on); the tab is lit on all three and
 *     reopens the last one on this device (HA_LS 'ha_mp_budget'), first time the Overview
 *   · ESA moved: off the 🎓 School row, Mom HQ's row gone, every setAdminSub('purchases') door lands on Budget ▸ ESA (from anywhere)
 *   · 📊 Overview: one card per pot — Gifts (a door only), ESA (esa.js's esBalance), Groceries (trips vs budgets), Bills (this month)
 *   · read-only: no Firebase reads or writes from the block, and the Overview never reads gifts/ or loads gifts.js
 *   run: node test_budget_tab.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const esaSrc=fs.readFileSync(path.join(__dirname,"esa.js"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const blk=(name)=>{ const a=src.indexOf("// "+name+"_START"), b=src.indexOf("// "+name+"_END"); if(a<0||b<a) throw new Error("missing block "+name); return src.slice(a,b); };
const fn=name=>{ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name); const eol=src.indexOf("\n",i+1), line=src.slice(i+1,eol);
  if(line.split("{").length===line.split("}").length) return line; return src.slice(i+1,src.indexOf("\n}",i+1)+2); };
const BUD=blk("BUDGETTAB"), BUDCODE=BUD.replace(/\/\/[^\n]*/g,"");   // the block's code without its comments

console.log("── the block ──");
ok("BUDGETTAB marked once, with her words + date", src.split("// BUDGETTAB_START").length===2&&/BUDGETTAB_START — [^\n]*\n\/\/ \(her ask 2026-11-20: "this is also where the ESA grant/.test(src));
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris|sara|melanie/i.test(BUD));
ok("no Firebase in the block (no db, no .ref) — display + navigation only", !/\bdb\b|\.ref\(/.test(BUDCODE));
ok("the block never touches gifts/ data or gifts.js (the Gifts card is a door only)", !/gifts\/|gifts\.js|renderGifts|gfData|_gf/.test(BUDCODE));
ok("esa.js hands its own esBalance to the page (one truth for the grant numbers)", /window\.esBalance=esBalance;/.test(esaSrc));

function world(o){
  o=o||{}; const LS=Object.assign({},o.ls||{}); const log=[], refs=[], scripts=[], drawn={};
  const content={id:"content",innerHTML:""};
  const ctx={ console, Date, Math, JSON, String, Object, Array, parseFloat, parseInt, isNaN,
    HA_LS:{getItem:k=>(k in LS?LS[k]:null),setItem:(k,v)=>{ LS[k]=String(v); }},
    SHOP_LIST_NAME:"Shopping List", ROSTER:["ava","ben"], cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    pageOn:k=>!(o.off||[]).includes(k), momHere:()=>o.mom!==false, mwBanner:s=>'<div class="md-banner">'+s+'</div>',
    mdFrameOn:()=>false, mdFrameOpen:t=>log.push("frame:"+t), msvOpenAdmin:()=>log.push("msvOpenAdmin"), mdSmoothCalNow:()=>false, msvEnter:()=>log.push("msvEnter"),
    showTab:t=>{ log.push("showTab:"+t); ctx.tab=t; ctx.momSchedView=false; },
    renderMomsPlan:el=>{ log.push("renderMomsPlan:"+ctx.mpSubView); }, renderAll:()=>log.push("renderAll"),
    ssJumpTo:id=>log.push("jump:"+id), setTimeout:(f)=>{ f(); return 0; }, scrollTo:()=>{}, location:{hostname:"localhost"},
    db:{ ref:p=>{ refs.push(p); return { on(){}, once(){}, set(){ refs.push("WRITE "+p); }, update(){ refs.push("WRITE "+p); }, remove(){ refs.push("WRITE "+p); }, push(){ refs.push("WRITE "+p); } }; } },
    _dryRun:()=>false, gwShowToast(){}, _todayStr:()=>o.today||"2026-11-20",
    document:{ getElementById:id=>id==="content"?content:null, createElement:t=>({tagName:t}), head:{appendChild:s=>{ scripts.push(s.src||s.id||s.tagName); }}, activeElement:null } };
  ctx.window=ctx; vm.createContext(ctx);
  ctx.billsData=o.bills||{}; ctx.esaData=o.esa||{};
  ctx.grData={items:{},trips:(o.trips||{}),budgets:(o.budgets||{}),cfg:(o.grCfg||{})};
  const code=["var tab="+JSON.stringify(o.tab||"moms-plan")+", mpSubView="+JSON.stringify(o.view||"plan")+", momSchedView="+(!!o.msv)+", adminSubTab='hq', currInnerTab='builder', mdFrameTab=null, kid='all', schedShowAdmin=false;",
    fn("esc"), fn("gwParseDate"), fn("grWeekStart"), fn("grSpent"), fn("grBudgets"), fn("grBudgetDefault"), fn("grPeriodStart"), fn("grSpentBudget"),
    fn("mpSubnav"), blk("KITCHENTAB"), blk("SCHOOLTAB"), blk("MPGROUPS"), BUD, blk("PURCHASES"), fn("mpGoto")].join("\n");
  vm.runInContext(code,ctx);
  if(o.esaJs) vm.runInContext(esaSrc,ctx);
  else ctx.renderPurchases=(el,ah)=>{ drawn.esa=ah; el.innerHTML=ah+"<purchases-page>"; };
  return {ctx,LS,log,refs,scripts,drawn,content};
}

console.log("── the 💰 Budget row ──");
{ const w=world(), c=w.ctx;
  const h=c.mpSubnav("budget");
  ok("the Budget tab is lit on the Overview and reopens the last Budget page", /<button onclick="mpGoto\(mpBudgetLast\(\)\)" style="[^"]*color:#fff;background:#2B7A78[^"]*">💰 Budget<\/button>/.test(h));
  ok("three chips in her order: 📊 Overview · 🎁 Gifts · 💰 ESA & purchases, inside the sticky menu", /<div id="mp-budget-row" class="mp-sub"><button onclick="mpGoto\('budget'\)"[^>]*>📊 Overview<\/button><button onclick="mpGoto\('gifts'\)"[^>]*>🎁 Gifts<\/button><button onclick="mpGoto\('esa'\)"[^>]*>💰 ESA &amp; purchases<\/button><\/div><\/div>$|<div id="mp-budget-row" class="mp-sub"><button onclick="mpGoto\('budget'\)"[^>]*>📊 Overview<\/button><button onclick="mpGoto\('gifts'\)"[^>]*>🎁 Gifts<\/button><button onclick="mpGoto\('esa'\)"[^>]*>💰 ESA & purchases<\/button><\/div><\/div>$/.test(h));
  ["budget","gifts","esa"].forEach(v=>{ const x=c.mpSubnav(v);
    ok("on '"+v+"': Budget lit, its chip outlined, no other sub-row", /color:#fff;background:#2B7A78[^>]*>💰 Budget/.test(x)&&new RegExp("mpGoto\\('"+v+"'\\)\" style=\"[^\"]*border:1.5px solid #2B7A78").test(x)&&!/mp-school-row|mp-kitchen-row|mp-home-row/.test(x)); });
  ok("on a School page the Budget row isn't drawn and Budget isn't lit", (()=>{ const x=c.mpSubnav("history"); return x.indexOf("mp-budget-row")<0&&!/color:#fff;background:#2B7A78[^>]*>💰 Budget/.test(x); })());
  ok("a family with the Purchases page off: Overview · Gifts only", (()=>{ const x=world({off:["purchases"]}).ctx.mpSubnav("budget"); return x.indexOf("mpGoto('esa')")<0&&x.indexOf("📊 Overview")>0&&x.indexOf("🎁 Gifts")>0; })());
}

console.log("── the tab remembers (this device only) ──");
{ const w=world(), c=w.ctx;
  ok("first time: the Overview", c.mpBudgetLast()==="budget");
  c.mpGoto("gifts"); ok("after 🎁 Gifts → Gifts, saved in HA_LS 'ha_mp_budget'", c.mpBudgetLast()==="gifts"&&w.LS.ha_mp_budget==="gifts");
  c.mpGoto("esa"); ok("after 💰 ESA → ESA", c.mpBudgetLast()==="esa");
  c.mpGoto("meals"); c.mpGoto("plan"); ok("other pages don't change it", c.mpBudgetLast()==="esa");
  ok("a saved 'esa' with Purchases switched off → the Overview", world({off:["purchases"],ls:{ha_mp_budget:"esa"}}).ctx.mpBudgetLast()==="budget");
  ok("junk in HA_LS → the Overview", world({ls:{ha_mp_budget:"purch"}}).ctx.mpBudgetLast()==="budget");
  ok("never synced (no Firebase path)", w.refs.length===0, w.refs);
}

console.log("── ESA moved in ──");
{ ok("the School row has no 💰 Purchases chip", world().ctx.mpSchoolRow("notebook").indexOf("purchases")<0);
  ok("Mom HQ has no Purchases & ESA row (her pick \"Budget only\")", !/_hqRowFn\("setAdminSub\('purchases'\)"|"Purchases & ESA","Orders/.test(fn("renderMomHQ"))&&/_hqGroup\("👪","Family & App",\[[^\n]*\n    _hqRow\("settings"[^\n]*\n  \]\);/.test(fn("renderMomHQ")));
  const w=world({view:"hist"}); w.ctx.mpAdminRoute("purchases");
  ok("setAdminSub('purchases') on a Mom's Day page → Budget ▸ ESA", w.ctx.mpSubView==="esa");
  const s=world({tab:"schedule",view:"plan"}); const r=s.ctx.mpAdminRoute("purchases");
  ok("…from the Schedule (its Admin hub 💰 tab) too: into Mom's Day, Budget ▸ ESA", r===true&&s.ctx.mpSubView==="esa"&&s.log.indexOf("showTab:moms-plan")>=0);
  const m=world({msv:true,view:"cal"}); m.ctx.mpAdminRoute("purchases");
  ok("…and from inside ▸ Schedule (MSV)", m.ctx.mpSubView==="esa"&&m.log.indexOf("showTab:moms-plan")>=0);
  const off=world({tab:"schedule",off:["purchases"]});
  ok("Purchases switched off → not routed (setAdminSub then lands on HQ as before)", off.ctx.mpAdminRoute("purchases")===false&&off.ctx.mpSubView==="plan");
  ok("setAdminSub still asks mpAdminRoute first; its off-switch fallback is kept", /if\(typeof mpAdminRoute==="function"&&mpAdminRoute\(s\)\) return;/.test(fn("setAdminSub"))&&/s==="purchases"&&!pageOn\("purchases"\)/.test(fn("setAdminSub")));
  const o=world({view:"wins"}); o.ctx.mpSchoolOpen("purchases"); ok("an old mpSchoolOpen('purchases') lands on Budget ▸ ESA", o.ctx.mpSubView==="esa");
  ok("the esa/ feed repaints Budget ▸ ESA and the Overview (not the old 'purch')", /db\.ref\("esa"\)\.on\("value",s=>\{ esaData=s\.val\(\)\|\|\{\}; try\{ if\(adminSubTab==="purchases"\|\|\(tab==="moms-plan"&&\(mpSubView==="esa"\|\|mpSubView==="budget"\)\)\) renderAllSoon\(\);/.test(src)&&src.indexOf('"purch"')<0);
}

console.log("── 💰 ESA & purchases page ──");
{ const w=world({view:"esa"}); w.ctx.renderMPEsa(w.content);
  ok("the Purchases page under her banner + the menu (Budget lit, ESA outlined)", /^<div class="md-banner">Orders, wishlist, the ESA grant and family money<\/div><div id="mp-subnav"/.test(w.drawn.esa)&&/mpGoto\('esa'\)" style="[^"]*border:1.5px solid #2B7A78/.test(w.drawn.esa)&&/<purchases-page>$/.test(w.content.innerHTML));
  const n=world({view:"esa",mom:false}); n.ctx.renderMPEsa(n.content);
  ok("not Mom → 🔒 Mom only, the page isn't drawn", /Mom only/.test(n.content.innerHTML)&&!n.drawn.esa);
  const f=world({view:"esa",off:["purchases"]}); f.ctx.renderMPEsa(f.content);
  ok("Purchases switched off → the Overview instead", f.ctx.mpSubView==="budget"&&/Every pot of money at a glance/.test(f.content.innerHTML)&&!f.drawn.esa);
  const l=world({view:"esa"}); delete l.ctx.renderPurchases; l.ctx.renderMPEsa(l.content);
  ok("esa.js not loaded yet → loading line + esa.js asked for once (lazy, like before)", /Loading purchases/.test(l.content.innerHTML)&&l.scripts.length===1&&l.scripts[0]==="esa.js");
}

console.log("── 📊 Overview ──");
const ESA={budget:{esa:{year:"2026-27",total:14000}},orders:{
  a:{fund:"esa",amount:1000,status:"approved"}, b:{fund:"esa",amount:500,status:"pending"}, c:{fund:"esa",amount:200,status:"denied"},
  d:{fund:"family",amount:50,status:"arrived"}}};
const TRIPS={t1:{iso:"2026-11-17",total:50},t2:{iso:"2026-11-19",est:30.25},t3:{iso:"2026-11-18",total:20,other:true},t4:{iso:"2026-11-03",total:100},t5:{iso:"2026-10-28",total:70}};
const BUDGETS={g:{name:"Groceries",emoji:"🛒",amt:200,per:"week",dflt:true,ts:1}};
const BILLS={el:{name:"Electric",amt:"$120",dueDay:5,freq:"monthly",paidThrough:"2026-11"},wa:{name:"Water",amt:"45.50",dueDay:22,freq:"monthly"},
  net:{name:"Internet",amt:"",dueDay:28,freq:"monthly",paidThrough:"2026-10"},car:{name:"Car tags",amt:"300",freq:"yearly",dueMonth:11,dueDay:30,paidThrough:"2025"},
  ins:{name:"Insurance",amt:"900",freq:"yearly",dueMonth:3,dueDay:1}};
{ const w=world({view:"budget",esaJs:true,esa:ESA,trips:TRIPS,budgets:BUDGETS,bills:BILLS}); const c=w.ctx;
  c.renderMPBudget(w.content); const h=w.content.innerHTML;
  const card=id=>{ const i=h.indexOf('id="bud-'+id+'"'); if(i<0) return ""; const j=h.indexOf('id="bud-',i+5); return h.slice(i,j<0?h.length:j); };
  ok("banner + menu on top (Overview outlined), then four cards: Gifts · ESA · Groceries · Bills", /^<div class="md-banner">Every pot of money at a glance<\/div><div id="mp-subnav"/.test(h)&&/mpGoto\('budget'\)" style="[^"]*border:1.5px solid #2B7A78/.test(h)&&["gifts","esa","grocery","bills"].map(k=>h.indexOf('id="bud-'+k+'"')).every((v,i,a)=>v>0&&(!i||v>a[i-1])));
  ok("🎁 Gifts: a door only — 'Open gifts', taps to Gifts", /Open gifts/.test(card("gifts"))&&/onclick="mpGoto\('gifts'\)"/.test(card("gifts"))&&!/\$\d/.test(card("gifts")));
  const e=card("esa");
  ok("💰 ESA: esa.js's numbers — remaining $13,000 of $14,000, $1,000 approved, $500 pending (denied not counted)", /Remaining<\/b><\/span><b[^>]*>\$13,000</.test(e)&&/Grant total<\/span><b[^>]*>\$14,000</.test(e)&&/Approved \/ arrived<\/span><b[^>]*>\$1,000</.test(e)&&/Pending approval<\/span><b[^>]*>\$500</.test(e), e);
  ok("…the school year and family money ($50 spent) too; taps to Budget ▸ ESA", /School year 2026-27/.test(e)&&/Family money spent<\/span><b[^>]*>\$50</.test(e)&&/onclick="mpGoto\('esa'\)"/.test(e));
  const g=card("grocery");
  ok("🛒 Groceries: the budget against this week ($80.25 of $200 — the 'other' trip doesn't count)", /🛒 Groceries · this week<\/span><b[^>]*>\$80\.25 of \$200</.test(g), g);
  ok("…every trip this week ($100.25) and this month ($200.25); taps to the Grocery List", /All trips this week<\/span><b[^>]*>\$100\.25</.test(g)&&/All trips this month<\/span><b[^>]*>\$200\.25</.test(g)&&/onclick="mpGoto\('grocery'\)"/.test(g), g);
  const b=card("bills");
  ok("💳 Bills this month: 3 still due $345.50 · 1 paid $120 · $465.50 (March's yearly bill left out)", /Still due \(3\)<\/span><b[^>]*>\$345\.50</.test(b)&&/Paid \(1\)<\/span><b[^>]*>\$120</.test(b)&&/This month<\/b><\/span><b[^>]*>\$465\.50</.test(b), b);
  ok("…'1 with no amount typed'", /1 with no amount typed/.test(b));
  const t=w.log.length; c.budBillsOpen(); ok("tapping Bills opens Home Base at its 💳 Bills section", c.mpSubView==="plan"&&w.log.slice(t).indexOf("jump:bills")>=0);
  ok("the Overview read nothing from Firebase and wrote nothing (no db.ref at all)", w.refs.length===0, w.refs);
  ok("the Overview never loads gifts.js", !w.scripts.some(s=>/gifts/.test(String(s))), w.scripts);
  ok("the numbers are computed, the data untouched", JSON.stringify(c.esaData)===JSON.stringify(ESA)&&JSON.stringify(c.billsData)===JSON.stringify(BILLS)&&JSON.stringify(c.grData.trips)===JSON.stringify(TRIPS));
}
{ const w=world({view:"budget",esa:ESA}); w.ctx.renderMPBudget(w.content);
  ok("esa.js not loaded yet → the ESA card says Loading… and esa.js (only) is asked for", /id="bud-esa"[\s\S]*Loading…/.test(w.content.innerHTML)&&w.scripts.length===1&&w.scripts[0]==="esa.js", w.scripts);
  ok("…its load repaints the Overview", /mpSubView==="esa"\|\|mpSubView==="budget"\)\)\) renderAll\(\);/.test(blk("PURCHASES"))); }
{ const w=world({view:"budget",esaJs:true}); w.ctx.renderMPBudget(w.content); const h=w.content.innerHTML;
  ok("a new family (nothing yet): No orders yet · No trips yet · No bills yet", /No orders yet/.test(h)&&/No trips yet/.test(h)&&/No bills yet/.test(h)); }
{ const w=world({view:"budget",off:["purchases"]}); w.ctx.renderMPBudget(w.content);
  ok("Purchases switched off → no ESA card, esa.js not loaded", w.content.innerHTML.indexOf('id="bud-esa"')<0&&w.scripts.length===0); }
{ const w=world({view:"budget",mom:false,bills:BILLS}); w.ctx.renderMPBudget(w.content);
  ok("not Mom → 🔒 Mom only, no numbers", /Mom only/.test(w.content.innerHTML)&&!/\$\d/.test(w.content.innerHTML)); }

console.log("── wiring ──");
{ const mp=fn("renderMomsPlanView");
  ok("renderMomsPlanView routes 'budget' → renderMPBudget and 'esa' → renderMPEsa (next to 'gifts')", /if\(mpSubView==='gifts'\)\{ return renderMPGifts\(el\); \}[^\n]*\n  if\(mpSubView==='budget'\)\{ return renderMPBudget\(el\); \}[^\n]*\n  if\(mpSubView==='esa'\)\{ return renderMPEsa\(el\); \}/.test(mp));
  ok("'budget' and 'esa' are not Today views (SS_OTHER_VIEWS); 'purch' is gone", (()=>{ const l=JSON.parse(src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/)[1]); return l.indexOf("budget")>=0&&l.indexOf("esa")>=0&&l.indexOf("purch")<0&&l.indexOf("gifts")>=0; })());
  ok("the two new banner lines fit a phone (≤ 50 chars)", ["Every pot of money at a glance","Orders, wishlist, the ESA grant and family money"].every(s=>s.length<=50&&BUD.indexOf("mwBanner('"+s+"')")>0));
  ok("Gifts' own page is unchanged (renderMPGifts draws mpSubnav('gifts') — the Budget row comes with it)", /const top=mwBanner\('Presents, budgets and hiding spots'\)\+mpSubnav\('gifts'\);/.test(blk("GIFTS"))); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
