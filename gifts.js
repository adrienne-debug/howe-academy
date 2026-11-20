// 🎁 Mom's Day ▸ 💰 Budget ▸ Gifts — the present tracker. GIFTS slice 1 (her ask + "Yes, start slice 1" 2026-11-20):
// "a christmas list, present tracker … start off similar to the ESA grant … separate each item per kid, or even per person …
// pick like a holiday … track how much you've spent on each of those people … section off like stocking versus like Christmas
// Eve present … a place to put where that Christmas present is located … what kind of wrapping paper it has" + "a budget for it
// versus how much you paid for it" + "some gifts will be split between kids … one or two of the kids … all of the kids" +
// "move this gift to … a different person" + "categories of people … mom's side of the family, dad's side of the family".
// Plan: PLAN_gift_tracker_budget_2026-11-20.md (slice 1 = this file; views, receipts, reminders, Dad sharing come later).
// Data (all under gifts/, loaded ONLY by this file, which only runs inside Mom's Day for Mom — never at app start, never on a
// kid's device or Dad's TV; the presents are a secret):
//   gifts/occasions/<oid>   {name, kind:"christmas"|"birthday"|"easter"|"other", date, budget?, closed?, ts,
//                            secs:{<sid>:{name, emoji, order, paper?}}}
//   gifts/groups/<gid>      {name, emoji, order, gone?}         her own groups + changes to the starter ones (GF_GROUPS)
//   gifts/people/<pid>      {name, group, kid?, paper?, birthday?, note?, gone?, ts}   kids are k_<roster id>, drawn from the
//                            family list until something about them is saved
//   gifts/plan/<oid>/<pid>  {budget?, sec?:{<sid>:$}}           a person's budget for one occasion (+ optional per section)
//   gifts/plan/<oid>/g_<gid> {budget?}                          a group's budget for one occasion
//   gifts/items/<iid>       {occ, pids:[…], sec, name, status, plan?, paid?, store?, link?, where?, paper?, note?, ts}
//   gifts/log/<push>        {at, text}
// GIFTS slice 2 (her "Yes, slice 2" 2026-11-20) — the Christmas views, read from the same presents:
//   ⚖️ Even (the kids side by side: dollars AND number of gifts, her pick) · 🎀 To wrap (by paper) · 📍 Where (by hiding spot) ·
//   📦 Coming (ordered, by "coming by") · 🛍 Shop (ideas, by store) · 🗄 Closet (presents for no one yet) · 🌙 Eve (the gather list,
//   counts per kid, batteries / assembly / charging, her own lines) · ☑ Select to change several presents' status at once.
//   New on a present: due ("coming by" date) · needs {batt:"AA ×4"|true, build:true, charge:true}.
//   gifts/eve/<oid>/done/<iid>_<batt|build|charge> = ts      a ticked Christmas Eve job
//   gifts/eve/<oid>/lines/<id> {text, order, done?}           her own Christmas Eve lines
//   gifts/settings/even {pct, n}                              when ⚖️ flags a kid behind (default 15% or 2 gifts)
// GIFTS slice 3 (📸 Receipts, her ask "submit receipts, like have a picture" 2026-11-20) — see GIFTS_RCPT_START below:
//   gifts/receipts/<rid> {store, iso, orderNo?, total?, returnBy?, lines:[{t, p?, item?}], photoCount, occ, ts}
//   giftPhotos/<rid> [dataURL, …]  ← its own top node, read only when she opens that receipt
//   New on a present: rcpt (the receipt it came from) · returnBy · orderNo.
// GIFTS slice 6 (any occasion + history + birthdays, plan §3.2 / §4 "Lucy turns 9 in 30 days — start her list?") — see GIFTS_OCC_START:
//   gifts/occasions/<oid>.for = <pid>   a birthday is about ONE person (their People view puts them first; everyone else folds away)
//   gifts/people/<pid>.sizes            "shirt 8 · pants 8 slim · shoe 1Y", shown on their page
//   🎂 nudge (birthday within 30 days, no occasion yet — nothing written until she taps) · 🕰 Last time strip · 📜 Past with totals.
// GIFTS slice 7 (kids' wish lists, plan §3.7 / §4) — see GIFTS_WISH_START: a kid's page shows their own wishes/<kid> list;
//   💭 Add as an idea → a present with wish:"<kid>/<wid>". Nothing is ever written under wishes/ about a present (the secret).
// Totals are COMPUTED here, never stored (the esa.js rule). A gift for several people splits its cost evenly between them and
// counts once for each (🤝). Every write = one set/update/remove of ONE record (+ a log line). Nothing here touches schedules.
(function(){
"use strict";
let gfData={}, gfOn=false, gfLoaded=false, gfOcc=null, gfView="people", gfPid=null, gfEdit=null, gfRoot=null, gfAh="", gfSelOn=false, gfSel={};
const GF_STATUS=[["idea","💭 Idea","#64748b"],["ordered","🛒 Ordered","#d97706"],["here","📦 Here","#0f766e"],["wrapped","🎀 Wrapped","#be185d"],["given","🎄 Given","#16a34a"],["returned","↩ Returned","#7c3aed"],["dropped","✕ Dropped","#94a3b8"]];
const GF_NEXT={idea:"ordered",ordered:"here",here:"wrapped",wrapped:"given"};
const GF_DEAD=["returned","dropped"];   // no longer counts toward money or gift counts
const GF_KINDS={
  christmas:{label:"🎄 Christmas",secs:[["special","⭐","Special"],["parents","🎁","From Mom & Dad"],["stocking","🧦","Stocking"],["eve","🌙","Christmas Eve box"]]},   // her pick 2026-11-20 · NOSANTA (her ask 2026-11-20: "reword the santa section in case a kid sees it while working"; her word "⭐ Special")
  birthday:{label:"🎂 Birthday",secs:[["main","🎁","Main gift"],["party","🎈","Party"],["small","🧁","Small things"]]},
  easter:{label:"🐣 Easter",secs:[["basket","🧺","Basket"],["main","🎁","Gift"]]},
  other:{label:"🎁 Other",secs:[["gifts","🎁","Gifts"]]}};
const GF_GROUPS=[["kids","👧","Kids"],["mom","👩","Mom's side"],["dad","👨","Dad's side"],["friends","🤝","Friends"],["teachers","🍎","Teachers"],["other","🎁","Everyone else"]];
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function money(n){n=+n||0;return "$"+n.toFixed(2).replace(/\.00$/,"").replace(/\B(?=(\d{3})+(?!\d))/g,",");}
function num(v){v=String(v==null?"":v).replace(/[^0-9.\-]/g,"");return v===""||isNaN(+v)?null:+v;}
function today(){return (typeof _todayStr==="function")?_todayStr():new Date().toISOString().slice(0,10);}
function dry(){return typeof _dryRun==="function"&&_dryRun();}
function write(path,val,op){if(typeof db==="undefined"||!db||dry())return;const r=db.ref(path);if(op==="set")r.set(val);else if(op==="remove")r.remove();else if(op==="push")r.push(val);else r.update(val);}
function log(text){const rec={at:Date.now(),text:String(text).slice(0,200)};const d=gfData;(d.log=d.log||{})["local"+rec.at]=rec;write("gifts/log",rec,"push");}
function toast(m){if(typeof gwShowToast==="function")gwShowToast(m);}
function slug(t){return String(t||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"x";}
function newId(node,base){let id=base,n=2;const o=gfData[node]||{};while(o[id])id=base+"-"+(n++);return id;}
function uid(){return "g"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function node(n){return gfData[n]=gfData[n]||{};}
function chip(t,c,solid){return '<span class="gf-chip" style="'+(solid?"background:"+c+";color:#fff;border-color:"+c:"color:"+c+";border-color:"+c+"55")+'">'+esc(t)+'</span>';}
function st(k){return GF_STATUS.find(s=>s[0]===k)||GF_STATUS[0];}

// ── what's there ─────────────────────────────────────────────────────────────
function occs(){const o=gfData.occasions||{};return Object.keys(o).map(id=>Object.assign({id},o[id])).sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))||String(a.name).localeCompare(String(b.name)));}
function occ(oid){const o=(gfData.occasions||{})[oid];return o?Object.assign({id:oid},o):null;}
function secsOf(o){const s=(o&&o.secs)||{};return Object.keys(s).map(id=>Object.assign({id},s[id])).sort((a,b)=>(a.order||0)-(b.order||0));}
function groups(){
  const S=gfData.groups||{};const out=GF_GROUPS.map((g,i)=>Object.assign({id:g[0],emoji:g[1],name:g[2],order:i},S[g[0]]||{}));
  Object.keys(S).forEach(id=>{if(!GF_GROUPS.some(g=>g[0]===id))out.push(Object.assign({id,order:99},S[id]));});
  return out.filter(g=>!g.gone).sort((a,b)=>(a.order||0)-(b.order||0));
}
function roster(){try{return (typeof ROSTER_DEF!=="undefined"&&Array.isArray(ROSTER_DEF))?ROSTER_DEF:[];}catch(e){return [];}}
function people(){
  const S=gfData.people||{};
  const kids=roster().map(k=>Object.assign({id:"k_"+k.id,name:k.name,group:"kids",kid:k.id,color:k.color},S["k_"+k.id]||{},{name:k.name,kid:k.id,color:k.color}));
  const rest=Object.keys(S).filter(id=>!/^k_/.test(id)).map(id=>Object.assign({id},S[id]));
  return kids.concat(rest).filter(p=>!p.gone);
}
function person(pid){return people().find(p=>p.id===pid)||((gfData.people||{})[pid]?Object.assign({id:pid},gfData.people[pid]):null);}
function items(oid){const o=gfData.items||{};return Object.keys(o).map(id=>Object.assign({id},o[id])).filter(it=>!oid||it.occ===oid);}
function pidsOf(it){return Array.isArray(it.pids)?it.pids.filter(Boolean):(it.pids&&typeof it.pids==="object"?Object.values(it.pids):[]);}
function live(it){return GF_DEAD.indexOf(it.status)<0;}
function curOcc(){
  const O=occs();if(gfOcc&&O.some(o=>o.id===gfOcc))return gfOcc;
  let saved=null;try{saved=HA_LS.getItem("ha_gf_occ");}catch(e){}
  if(saved&&O.some(o=>o.id===saved))return gfOcc=saved;
  const t=today(),open=O.filter(o=>!o.closed);const next=open.find(o=>String(o.date||"")>=t)||open[open.length-1]||O[O.length-1];
  return gfOcc=next?next.id:null;
}

// ── money (computed, never stored) ───────────────────────────────────────────
function plan(oid,key){return ((gfData.plan||{})[oid]||{})[key]||{};}
function share(it,pid){const P=pidsOf(it);return P.indexOf(pid)<0?0:1/P.length;}
function tally(list,w){   // w(it) = this item's weight for whoever we're adding up (1 for the whole occasion)
  const T={paid:0,toBuy:0,count:0,shared:0,by:{}};
  list.forEach(it=>{const f=w(it);if(!f||!live(it))return;
    const paid=num(it.paid),pl=num(it.plan);
    if(paid!=null)T.paid+=paid*f;else if(pl!=null)T.toBuy+=pl*f;
    T.count++;if(pidsOf(it).length>1)T.shared++;T.by[it.status||"idea"]=(T.by[it.status||"idea"]||0)+1;});
  return T;
}
function personTot(oid,pid,sid){const T=tally(items(oid).filter(it=>!sid||it.sec===sid),it=>share(it,pid));const p=plan(oid,pid);T.budget=sid?num((p.sec||{})[sid]):num(p.budget);return T;}
function groupTot(oid,gid){
  const ids=people().filter(p=>(p.group||"other")===gid).map(p=>p.id);
  const T=tally(items(oid),it=>pidsOf(it).reduce((a,pid)=>a+(ids.indexOf(pid)>=0?share(it,pid):0),0));
  T.budget=num(plan(oid,"g_"+gid).budget);return T;
}
function occTot(oid){const T=tally(items(oid),()=>1);const o=occ(oid)||{};T.budget=num(o.budget);return T;}
function left(T){return T.budget==null?null:T.budget-T.paid-T.toBuy;}

// ── drawing ──────────────────────────────────────────────────────────────────
function bar(T){
  if(T.budget==null||!(T.budget>0))return "";
  const p=Math.min(100,T.paid/T.budget*100),q=Math.min(100-p,T.toBuy/T.budget*100),over=T.paid+T.toBuy>T.budget+0.005;
  return '<div class="gf-bar"><i style="width:'+p.toFixed(1)+'%;background:'+(over?"#dc2626":"#16a34a")+'"></i><i style="width:'+q.toFixed(1)+'%;background:'+(over?"#fca5a5":"#bbf7d0")+'"></i></div>';
}
function sumLine(T){
  let h='<b>'+money(T.paid)+'</b> paid';
  if(T.toBuy)h+=' · '+money(T.toBuy)+' still to buy';
  if(T.budget!=null){const L=left(T);h+=' · budget '+money(T.budget)+' · <b style="color:'+(L<-0.005?"#dc2626":"#16a34a")+'">'+(L<-0.005?money(-L)+" over":money(L)+" left")+'</b>';}
  return h;
}
function counts(T){return GF_STATUS.filter(s=>T.by[s[0]]).map(s=>'<span title="'+esc(s[1])+'">'+s[1].split(" ")[0]+T.by[s[0]]+'</span>').join(" ");}
function occBar(){
  const O=occs(),cur=curOcc();
  let h='<div class="gf-occs">'+O.filter(o=>!o.closed||o.id===cur).map(o=>'<button class="gf-occ'+(o.id===cur?" on":"")+'" onclick="gfPickOcc(\''+esc(o.id)+'\')">'+esc(o.name)+'</button>').join("");
  h+='<button class="gf-occ" onclick="gfNewOcc()">＋ Occasion</button>';
  const past=O.filter(o=>o.closed&&o.id!==cur);
  if(past.length)h+='<select class="gf-sel" onchange="if(this.value)gfPickOcc(this.value)"><option value="">📜 Past…</option>'+past.slice().reverse().map(o=>'<option value="'+esc(o.id)+'">'+esc(pastLabel(o))+'</option>').join("")+'</select>';   // GIFTS_OCC: totals, newest first
  return h+'</div>';
}
function emptyView(){
  const t=today(),y=+t.slice(0,4)+((t.slice(5)>"12-25")?1:0);
  return '<div class="gf-card gf-start"><div style="font-size:40px">🎄</div><div class="gf-h2">Christmas '+y+'</div>'+
    '<div class="gf-sub">Every kid is already on the list. Add anyone else, give each person a budget, and track every present — what you planned, what you paid, where it\'s hidden and which paper it\'s in.</div>'+
    '<button class="gf-big" onclick="gfStartOcc(\'christmas\')">Start Christmas '+y+'</button>'+
    '<div style="margin-top:10px"><button class="gf-tool" onclick="gfNewOcc()">Or start a birthday or another occasion</button></div></div>';
}
function occHead(o){
  const T=occTot(o.id);
  return '<div class="gf-card"><div class="gf-hd"><span>'+esc(o.name)+'</span>'+(o.date?'<span class="gf-days">'+daysTo(o.date)+'</span>':'')+
    '<button class="gf-tool gf-hdb" onclick="gfOccEdit()">✏️</button></div><div class="gf-bd">'+bar(T)+'<div class="gf-line">'+sumLine(T)+'</div>'+
    '<div class="gf-line" style="color:#475569">'+T.count+' present'+(T.count===1?'':'s')+(T.count?' · '+counts(T):'')+'</div>'+
    (o.closed?'<div class="gf-line" style="color:#64748b">📜 Past — ✏️ and untick Done to reopen it.</div>':'')+'</div></div>';   // GIFTS_OCC
}
function daysTo(iso){const a=new Date(today()+"T12:00:00"),b=new Date(String(iso)+"T12:00:00");const d=Math.round((b-a)/864e5);return isNaN(d)?"":d>1?d+" days to go":d===1?"tomorrow":d===0?"today":"";}
function peopleView(o){
  let h=occHead(o);
  const star=occStar(o);   // GIFTS_OCC: a birthday's person first and open; everyone else folds under "Others giving or getting"
  if(star)h+=starCard(o,star)+othersBtn(o,star);
  const P=people().filter(p=>p.id!==star);
  if(!star||gfOthersOpen===o.id)groups().forEach(g=>{
    const ps=P.filter(p=>(p.group||"other")===g.id);if(!ps.length)return;
    const T=groupTot(o.id,g.id);
    h+='<div class="gf-card"><div class="gf-ghd"><span>'+esc(g.emoji||"")+' '+esc(g.name)+'</span><span class="gf-gsum">'+money(T.paid)+(T.budget!=null?' / '+money(T.budget):'')+'</span>'+
      '<button class="gf-tool" onclick="gfGroupBudget(\''+esc(g.id)+'\')">💲</button></div>'+(T.budget!=null?'<div style="padding:0 14px">'+bar(T)+'</div>':'')+'<div class="gf-bd">';
    ps.forEach(p=>{const PT=personTot(o.id,p.id);
      h+='<button class="gf-prow" onclick="gfOpenPerson(\''+esc(p.id)+'\')"><span class="gf-dot" style="background:'+esc(p.color||"#94a3b8")+'"></span>'+
        '<span class="gf-pn">'+esc(p.name)+'<span class="gf-pc">'+(PT.count?PT.count+' present'+(PT.count===1?'':'s')+' · '+counts(PT):'nothing yet')+'</span>'+bar(PT)+'</span>'+
        '<span class="gf-amt">'+money(PT.paid)+(PT.budget!=null?'<small> / '+money(PT.budget)+'</small>':'')+'</span></button>';});
    h+='</div></div>';
  });
  const nobody=items(o.id).filter(it=>!pidsOf(it).length);
  if(nobody.length)h+='<div class="gf-card"><div class="gf-ghd"><span>💭 Not for anyone yet</span></div><div class="gf-bd">'+nobody.map(it=>itemRow(it,null)).join("")+'</div></div>';
  h+='<div class="gf-acts"><button class="gf-tool" onclick="gfNewItem(null,null)">＋ Present</button><button class="gf-tool" onclick="gfNewPerson()">＋ Person</button><button class="gf-tool" onclick="gfNewGroup()">＋ Group</button></div>';
  return h;
}
function needsChips(it){const n=it.needs||{};return (n.batt?'<span>🔋 '+esc(n.batt===true?"batteries":n.batt)+'</span>':'')+(n.build?'<span>🔧 assemble</span>':'')+(n.charge?'<span>🔌 charge</span>':'');}
function dueChip(it){if(!it.due||it.status!=="ordered")return "";const late=String(it.due)<today();return late?chip("📦 late — due "+shortDate(it.due),"#dc2626"):'<span>📦 by '+esc(shortDate(it.due))+'</span>';}
function shortDate(iso){const d=new Date(String(iso)+"T12:00:00");return isNaN(d)?String(iso):d.toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function itemRow(it,pid){
  const s=st(it.status),P=pidsOf(it),nm=x=>(person(x)||{}).name||"?";
  const who=pid?(P.length>1?chip("🤝 with "+P.filter(x=>x!==pid).map(nm).join(", "),"#0e7490"):""):(P.length?chip((P.length>1?"🤝 ":"👤 ")+P.map(nm).join(", "),P.length>1?"#0e7490":"#334155"):chip("🗄 no one yet","#64748b"));
  const amt=num(it.paid)!=null?money(num(it.paid)):(num(it.plan)!=null?'<span style="color:#64748b">plan '+money(num(it.plan))+'</span>':'—');
  const nx=GF_NEXT[it.status||"idea"],picked=!!gfSel[it.id];
  return '<div class="gf-item'+(live(it)?'':' dead')+(picked?' picked':'')+'"><button class="gf-ib" onclick="'+(gfSelOn?'gfPick':'gfEditItem')+'(\''+esc(it.id)+'\')">'+(gfSelOn?'<span class="gf-box">'+(picked?'✓':'')+'</span>':'')+'<div class="gf-it"><b>'+esc(it.name)+'</b></div><div class="gf-im">'+chip(s[1],s[2])+who+
    dueChip(it)+(it.where?'<span>📍 '+esc(it.where)+'</span>':'')+(it.paper?'<span>🎀 '+esc(it.paper)+'</span>':'')+(it.store?'<span>🏬 '+esc(it.store)+'</span>':'')+rcptChip(it)+needsChips(it)+'</div></button>'+
    '<div class="gf-ia"><div class="gf-amt">'+amt+(P.length>1&&pid&&num(it.paid)!=null?'<small> ('+money(num(it.paid)/P.length)+' each)</small>':'')+'</div>'+(gfSelOn?'':'<div style="display:flex;gap:4px">'+
    (nx?'<button class="gf-tool gf-mini" title="Next: '+esc(st(nx)[1])+'" onclick="gfNext(\''+esc(it.id)+'\')">'+st(nx)[1].split(" ")[0]+'</button>':'')+
    '<button class="gf-tool gf-mini" title="Move to…" onclick="gfMove(\''+esc(it.id)+'\')">↪</button></div>')+'</div></div>';
}
function personView(o,pid){
  const p=person(pid);if(!p){gfView="people";return peopleView(o);}
  const T=personTot(o.id,pid),S=secsOf(o),mine=items(o.id).filter(it=>pidsOf(it).indexOf(pid)>=0);
  let h='<button class="gf-tool" style="margin-bottom:8px" onclick="gfBack()">← Everyone</button>';
  h+='<div class="gf-card"><div class="gf-hd" style="background:'+esc(p.color||"#475569")+'"><span>'+esc(p.name)+' · '+esc(o.name)+'</span><button class="gf-tool gf-hdb" onclick="gfEditPerson(\''+esc(pid)+'\')">✏️</button></div>'+
    '<div class="gf-bd">'+bar(T)+'<div class="gf-line">'+sumLine(T)+'</div><div class="gf-line" style="color:#475569">'+T.count+' present'+(T.count===1?'':'s')+(T.shared?' · 🤝 '+T.shared+' shared':'')+(p.paper?' · 🎀 '+esc(p.paper):'')+'</div>'+
    (p.sizes?'<div class="gf-line">👕 '+esc(p.sizes)+'</div>':'')+   // GIFTS_OCC
    '<div style="margin-top:6px"><button class="gf-tool" onclick="gfBudget(\''+esc(pid)+'\')">💲 Budget</button></div></div></div>';
  h+=lastTime(o,pid);   // GIFTS_OCC: 🕰 what they got before
  h+=wishCard(o,pid);   // GIFTS_WISH: 💌 a kid's own wish list
  const known=S.map(s=>s.id);
  S.concat(mine.some(it=>known.indexOf(it.sec)<0)?[{id:"",emoji:"📦",name:"No section"}]:[]).forEach(s=>{
    const L=mine.filter(it=>s.id?it.sec===s.id:known.indexOf(it.sec)<0),ST=s.id?personTot(o.id,pid,s.id):null;
    h+='<div class="gf-card"><div class="gf-ghd"><span>'+esc(s.emoji||"")+' '+esc(s.name)+'</span><span class="gf-gsum">'+(ST?money(ST.paid)+(ST.budget!=null?' / '+money(ST.budget):''):'')+'</span>'+
      (s.id?'<button class="gf-tool" onclick="gfNewItem(\''+esc(pid)+'\',\''+esc(s.id)+'\')">＋</button>':'')+'</div>'+(ST&&ST.budget!=null?'<div style="padding:0 14px">'+bar(ST)+'</div>':'')+
      '<div class="gf-bd">'+(L.length?L.map(it=>itemRow(it,pid)).join(""):'<div class="gf-empty">Nothing here yet.</div>')+'</div></div>';
  });
  return h;
}

// ── the Christmas views (slice 2) ─────────────────────────────────────────────
const GF_VIEWS=[["people","👨‍👩‍👧 People"],["even","⚖️ Even"],["wrap","🎀 To wrap"],["where","📍 Where"],["coming","📦 Coming"],["shop","🛍 Shop"],["closet","🗄 Closet"],["eve","🌙 Eve"],["receipts","🧾 Receipts"]];
const GF_SELECTABLE=["person","wrap","where","coming","shop","closet"];
function viewNav(){
  return '<div class="gf-views">'+GF_VIEWS.map(v=>'<button class="gf-vw'+((gfView===v[0]||(gfView==="person"&&v[0]==="people"))?" on":"")+'" onclick="gfGo(\''+v[0]+'\')">'+v[1]+'</button>').join("")+'<button class="gf-vw add" onclick="gfRcptNew()">📸 Add a receipt</button>'+
    (GF_SELECTABLE.indexOf(gfView)>=0?'<button class="gf-vw sel'+(gfSelOn?" on":"")+'" onclick="gfSelToggle()">'+(gfSelOn?"✕ Done picking":"☑ Select")+'</button>':'')+'</div>';
}
function groupBy(list,keyFn,emptyLabel){
  const G={},label={};list.forEach(it=>{const raw=String(keyFn(it)||"").trim(),k=raw.toLowerCase();(G[k]=G[k]||[]).push(it);if(raw&&!label[k])label[k]=raw;});
  return Object.keys(G).sort((a,b)=>(a===""?1:0)-(b===""?1:0)||a.localeCompare(b)).map(k=>({key:k,label:k===""?emptyLabel:label[k],items:G[k]}));
}
function listCard(title,sub,list,extra){
  return '<div class="gf-card"><div class="gf-ghd"><span>'+title+'</span><span class="gf-gsum">'+(sub||"")+'</span>'+(extra||"")+'</div><div class="gf-bd">'+list.map(it=>itemRow(it,null)).join("")+'</div></div>';
}
function intro(t){return '<div class="gf-sub" style="margin:0 2px 10px">'+t+'</div>';}
function kids(){return people().filter(p=>p.group==="kids");}
function evenSet(){const e=((gfData.settings||{}).even)||{};return {pct:e.pct!=null?+e.pct:15,n:e.n!=null?+e.n:2};}
function evenData(oid){
  const K=kids(),S=secsOf(occ(oid));
  const row=sid=>K.map(p=>{const T=personTot(oid,p.id,sid);return {pid:p.id,amt:T.paid+T.toBuy,paid:T.paid,count:T.count};});
  return {kids:K,all:row(null),secs:S.map(s=>({sec:s,cells:row(s.id)}))};
}
function behind(cells){   // which kids are behind the one furthest ahead, by dollars and by count (her pick: both)
  const E=evenSet(),maxA=Math.max(0,...cells.map(c=>c.amt)),maxN=Math.max(0,...cells.map(c=>c.count));
  return cells.map(c=>({amt:maxA>0&&(maxA-c.amt)/maxA*100>E.pct+1e-9,count:maxN-c.count>=E.n,gapA:maxA-c.amt,gapN:maxN-c.count}));
}
function evenView(o){
  const D=evenData(o.id),E=evenSet();if(!D.kids.length)return intro("No kids on the family list.");
  const cell=(c,b)=>'<td class="'+(b.amt||b.count?"gf-behind":"")+'"><b>'+money(c.amt)+'</b><br><span>'+c.count+' gift'+(c.count===1?'':'s')+'</span></td>';
  let h=intro("Each kid's presents — what's paid plus what's still planned, and how many. A shared present counts for each kid it's for, with their share of the cost. <b style=\"color:#b45309\">Amber</b> = more than "+E.pct+"% or "+E.n+" gifts behind. <button class=\"gf-tool gf-mini\" onclick=\"gfEvenEdit()\">✏️</button>");
  h+='<div class="gf-card" style="overflow-x:auto"><table class="gf-even"><tr><th></th>'+D.kids.map(p=>'<th><span class="gf-dot" style="display:inline-block;background:'+esc(p.color||"#94a3b8")+'"></span> '+esc(p.name)+'</th>').join("")+'</tr>';
  const bA=behind(D.all);h+='<tr class="gf-tot"><th>All</th>'+D.all.map((c,i)=>cell(c,bA[i])).join("")+'</tr>';
  D.secs.forEach(r=>{const b=behind(r.cells);h+='<tr><th>'+esc((r.sec.emoji||"")+" "+r.sec.name)+'</th>'+r.cells.map((c,i)=>cell(c,b[i])).join("")+'</tr>';});
  h+='</table></div>';
  const notes=[];D.all.forEach((c,i)=>{const b=bA[i],p=D.kids[i];if(b.amt||b.count)notes.push(esc(p.name)+' is '+[b.amt?money(b.gapA):"",b.count?b.gapN+" gift"+(b.gapN===1?"":"s"):""].filter(Boolean).join(" and ")+' behind');});
  h+=notes.length?'<div class="gf-card"><div class="gf-bd" style="color:#b45309;font-weight:700;font-size:13px">⚖️ '+notes.join(' · ')+'</div></div>':'<div class="gf-card"><div class="gf-bd" style="color:#16a34a;font-weight:700;font-size:13px">⚖️ Everyone is even.</div></div>';
  return h;
}
function wrapView(o){
  const L=items(o.id).filter(it=>it.status==="here");
  let h=intro("Here and not wrapped yet, grouped by paper — one roll out at a time.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Nothing waiting to be wrapped. 🎀</div></div>';
  groupBy(L,it=>it.paper,"No paper picked yet").forEach(g=>{
    h+=listCard("🎀 "+esc(g.label),g.items.length+" to wrap",g.items,'<button class="gf-tool" onclick="gfBulkIds(\''+g.items.map(it=>it.id).join(",")+'\',\'wrapped\')">All wrapped</button>');});
  return h;
}
function whereView(o){
  const L=items(o.id).filter(it=>live(it)&&it.status!=="given"&&it.status!=="idea");
  let h=intro("Every present in the house, by where it's hidden.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Nothing in the house yet.</div></div>';
  groupBy(L,it=>it.where,"📍 Not written down").forEach(g=>{h+=listCard((g.key?"📍 ":"")+esc(g.label),g.items.length+"",g.items);});
  return h;
}
function comingView(o){
  const t=today(),L=items(o.id).filter(it=>it.status==="ordered").sort((a,b)=>(a.due?0:1)-(b.due?0:1)||String(a.due||"").localeCompare(String(b.due||"")));
  const late=L.filter(it=>it.due&&it.due<t),rest=L.filter(it=>!(it.due&&it.due<t));
  let h=intro("Ordered and not here yet. Tap 📦 when it arrives.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Nothing on the way.</div></div>';
  if(late.length)h+=listCard('<span style="color:#dc2626">⏰ Late</span>',late.length+"",late);
  if(rest.length)h+=listCard("📦 On the way",rest.length+"",rest);
  return h;
}
function shopView(o){
  const L=items(o.id).filter(it=>it.status==="idea");
  let h=intro("Ideas still to buy, by store — the planned $ add up per store.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Nothing left to buy. 🎉</div></div>';
  groupBy(L,it=>it.store,"🏬 No store yet").forEach(g=>{const sum=g.items.reduce((a,it)=>a+(num(it.plan)||0),0);h+=listCard((g.key?"🏬 ":"")+esc(g.label),sum?"plan "+money(sum):"",g.items);});
  return h;
}
function closetView(){
  const L=items().filter(it=>live(it)&&!pidsOf(it).length);
  let h=intro("Bought ahead or saved for later, not for anyone yet. ↪ hands one to a person (or another occasion) when its day comes.");
  h+='<div class="gf-acts" style="margin-bottom:10px"><button class="gf-tool" onclick="gfNewItem(null,null)">＋ Closet present</button></div>';
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">The gift closet is empty.</div></div>';
  groupBy(L,it=>(occ(it.occ)||{}).name,"").forEach(g=>{h+=listCard("🗄 "+esc(g.label),g.items.length+"",g.items);});
  return h;
}
function eveDone(oid,key){return !!(((gfData.eve||{})[oid]||{}).done||{})[key];}
function eveLines(oid){const L=(((gfData.eve||{})[oid]||{}).lines)||{};return Object.keys(L).map(id=>Object.assign({id},L[id])).sort((a,b)=>(a.order||0)-(b.order||0));}
function eveView(o){
  const all=items(o.id).filter(live),out=all.filter(it=>["here","wrapped","given"].indexOf(it.status)>=0),under=out.filter(it=>it.status==="given");
  let h=intro("Christmas Eve: walk the house spot by spot and tick each present as it goes under the tree. Then the jobs, the counts per kid, and your own list.");
  // the gather list
  h+='<div class="gf-card"><div class="gf-ghd"><span>🎄 Gather — '+under.length+' of '+out.length+' out</span></div><div class="gf-bd">';
  if(!out.length)h+='<div class="gf-empty">No presents in the house yet.</div>';
  groupBy(out,it=>it.where,"📍 Not written down").forEach(g=>{
    h+='<div class="gf-spot">'+(g.key?"📍 ":"")+esc(g.label)+'</div>'+g.items.map(it=>{const on=it.status==="given",P=pidsOf(it).map(x=>(person(x)||{}).name||"?").join(" + ")||"no one",sec=((o.secs||{})[it.sec]||{});
      return '<button class="gf-tick'+(on?" on":"")+'" onclick="gfGather(\''+esc(it.id)+'\')"><span class="gf-box">'+(on?'✓':'')+'</span><span><b>'+esc(it.name)+'</b> — '+esc(P)+(sec.name?' · '+esc((sec.emoji||"")+" "+sec.name):'')+(it.paper?' · 🎀 '+esc(it.paper):'')+(it.status==="here"?' · <i style="color:#b45309">not wrapped</i>':'')+'</span></button>';}).join("");
  });
  h+='</div></div>';
  // jobs from the presents
  const jobs=[];all.forEach(it=>{const n=it.needs||{};if(n.batt)jobs.push([it,"batt","🔋 Batteries in"+(n.batt!==true?" ("+n.batt+")":"")]);if(n.build)jobs.push([it,"build","🔧 Put together"]);if(n.charge)jobs.push([it,"charge","🔌 Charge it"]);});
  h+='<div class="gf-card"><div class="gf-ghd"><span>🔋 Jobs</span><span class="gf-gsum">'+jobs.filter(j=>eveDone(o.id,j[0].id+"_"+j[1])).length+' of '+jobs.length+'</span></div><div class="gf-bd">';
  const batts=all.map(it=>(it.needs||{}).batt).filter(b=>b&&b!==true);
  if(batts.length)h+='<div class="gf-sub" style="margin:0 0 6px">Batteries to have on hand: '+esc(batts.join(" · "))+'</div>';
  h+=jobs.length?jobs.map(j=>{const k=j[0].id+"_"+j[1],on=eveDone(o.id,k);return '<button class="gf-tick'+(on?" on":"")+'" onclick="gfEveTick(\''+esc(k)+'\')"><span class="gf-box">'+(on?'✓':'')+'</span><span>'+esc(j[2])+' — <b>'+esc(j[0].name)+'</b></span></button>';}).join(""):'<div class="gf-empty">Tick 🔋 batteries, 🔧 assembly or 🔌 charge on a present and it shows up here.</div>';
  h+='</div></div>';
  // counts per kid, per section
  const S=secsOf(o);
  h+='<div class="gf-card" style="overflow-x:auto"><div class="gf-ghd"><span>🧮 Count check</span></div><table class="gf-even"><tr><th></th>'+kids().map(p=>'<th>'+esc(p.name)+'</th>').join("")+'</tr>'+
    S.map(s=>'<tr><th>'+esc((s.emoji||"")+" "+s.name)+'</th>'+kids().map(p=>{const L=all.filter(it=>it.sec===s.id&&pidsOf(it).indexOf(p.id)>=0);const u=L.filter(it=>it.status==="given").length;return '<td><b>'+u+'</b> / '+L.length+'</td>';}).join("")+'</tr>').join("")+
    '</table><div class="gf-sub" style="margin:4px 14px 10px">Out / planned for each kid.</div></div>';
  // her own lines
  const L=eveLines(o.id);
  h+='<div class="gf-card"><div class="gf-ghd"><span>📝 My Christmas Eve list</span></div><div class="gf-bd">'+L.map(l=>'<div style="display:flex;align-items:center;gap:6px"><button class="gf-tick'+(l.done?" on":"")+'" style="flex:1" onclick="gfLineTick(\''+esc(l.id)+'\')"><span class="gf-box">'+(l.done?'✓':'')+'</span><span>'+esc(l.text)+'</span></button><button class="gf-tool gf-mini" onclick="gfLineDel(\''+esc(l.id)+'\')">✕</button></div>').join("")+
    '<div style="display:flex;gap:6px;margin-top:6px"><input id="gf-line" class="gf-in" placeholder="e.g. cookies + milk out" onkeydown="if(event.key===\'Enter\')gfLineAdd()"><button class="gf-tool" onclick="gfLineAdd()">＋</button></div>';
  const prev=occs().filter(x=>x.id!==o.id&&x.kind===o.kind&&eveLines(x.id).length&&String(x.date||"")<String(o.date||"")).pop();
  if(!L.length&&prev)h+='<button class="gf-tool" style="margin-top:8px" onclick="gfLinesCopy(\''+esc(prev.id)+'\')">Copy last time\'s list ('+esc(prev.name)+')</button>';
  h+='</div></div>';
  return h;
}
function selBar(){
  if(!gfSelOn)return "";const n=Object.keys(gfSel).length;
  return '<div class="gf-selbar"><b>'+n+' picked</b>'+(n?GF_STATUS.map(s=>'<button class="gf-pick" onclick="gfBulk(\''+s[0]+'\')">'+esc(s[1])+'</button>').join(""):'<span style="color:#cbd5e1">— tap presents to pick them</span>')+'</div>';
}

// ── sheets: present · move · person · budget · group · occasion ──────────────
function field(k,label,ph,type){const f=gfEdit.form;return '<label class="gf-f"><span>'+label+'</span><input'+(type?' type="'+type+'"':'')+(type==="money"?' inputmode="decimal"':'')+' value="'+esc(f[k])+'" placeholder="'+esc(ph||"")+'" oninput="gfSet(\''+k+'\',this.value)"></label>';}
function picks(k,vals){return vals.length?'<div class="gf-picks">'+vals.map(v=>'<button class="gf-pick" onclick="gfSetDraw(\''+k+'\','+esc(JSON.stringify(v))+')">'+esc(v)+'</button>').join("")+'</div>':"";}
function distinct(k){const seen={},out=[];items().sort((a,b)=>(b.ts||0)-(a.ts||0)).forEach(it=>{const v=String(it[k]||"").trim();if(v&&!seen[v.toLowerCase()]){seen[v.toLowerCase()]=1;out.push(v);}});return out.slice(0,12);}
function forPicker(){
  const f=gfEdit.form;let h='<div class="gf-f wide"><span>For (tap everyone it\'s for — two or more = 🤝 shared)</span><div class="gf-picks">';
  groups().forEach(g=>{people().filter(p=>(p.group||"other")===g.id).forEach(p=>{const on=f.pids.indexOf(p.id)>=0;
    h+='<button class="gf-pick'+(on?" on":"")+'" style="'+(on?"background:"+esc(p.color||"#0f172a")+";border-color:"+esc(p.color||"#0f172a"):"")+'" onclick="gfTogglePid(\''+esc(p.id)+'\')">'+esc(p.name)+'</button>';});});
  return h+'</div></div>';
}
function secPicker(oid){
  const f=gfEdit.form;const S=secsOf(occ(oid));
  return '<div class="gf-f wide"><span>Section</span><div class="gf-picks">'+S.map(s=>'<button class="gf-pick'+(f.sec===s.id?" on":"")+'" onclick="gfSetDraw(\'sec\',\''+esc(s.id)+'\')">'+esc((s.emoji||"")+" "+s.name)+'</button>').join("")+'</div></div>';
}
function itemSheet(){
  const f=gfEdit.form;let h='<div class="gf-form">';
  h+='<label class="gf-f wide"><span>What</span><input value="'+esc(f.name)+'" placeholder="e.g. LEGO treehouse" oninput="gfSet(\'name\',this.value)"></label>';
  h+=forPicker()+secPicker(f.occ);
  h+='<div class="gf-f wide"><span>Status</span><div class="gf-picks">'+GF_STATUS.map(s=>'<button class="gf-pick'+(f.status===s[0]?" on":"")+'" onclick="gfSetDraw(\'status\',\''+s[0]+'\')">'+esc(s[1])+'</button>').join("")+'</div></div>';
  h+=field("plan","Planned $","","money")+field("paid","Paid $","","money")+field("store","Store","e.g. Target")+field("link","Link","https://…")+field("due","📦 Coming by","","date");
  h+='<div class="gf-f wide"><span>Christmas Eve jobs</span><div class="gf-picks">'+[["batt","🔋 Batteries"],["build","🔧 Assembly"],["charge","🔌 Charge it"]].map(x=>'<button class="gf-pick'+(f.needs[x[0]]?" on":"")+'" onclick="gfNeed(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div></div>';
  if(f.needs.batt)h+=field("batt","Which batteries","e.g. AA ×4");
  h+='<div class="gf-f wide">'+field("where","📍 Where it's hidden","e.g. master closet, top shelf")+picks("where",distinct("where"))+'</div>';
  h+='<div class="gf-f wide">'+field("paper","🎀 Wrapping paper","e.g. gold stars")+picks("paper",distinct("paper"))+'</div>';
  h+='<label class="gf-f wide"><span>Notes</span><textarea rows="2" oninput="gfSet(\'note\',this.value)">'+esc(f.note)+'</textarea></label>';
  return h+'</div>';
}
function moveSheet(){
  const f=gfEdit.form;
  return '<div class="gf-form"><div class="gf-sub wide">Pick who it\'s for now — everything else (what you paid, where it is, its status) goes with it.</div>'+forPicker()+
    '<label class="gf-f wide"><span>Occasion</span><select onchange="gfSetDraw(\'occ\',this.value)">'+occs().map(o=>'<option value="'+esc(o.id)+'"'+(o.id===f.occ?" selected":"")+'>'+esc(o.name)+'</option>').join("")+'</select></label>'+secPicker(f.occ)+'</div>';
}
function personSheet(){
  const f=gfEdit.form,kid=/^k_/.test(f.id||"");
  let h='<div class="gf-form">'+(kid?'<div class="gf-f wide"><span>Name</span><b style="font-size:14px;color:#0f172a">'+esc(f.name)+'</b></div>':field("name","Name","e.g. Grandma Jo"));
  if(!kid)h+='<label class="gf-f"><span>Group</span><select onchange="gfSet(\'group\',this.value)">'+groups().filter(g=>g.id!=="kids").map(g=>'<option value="'+esc(g.id)+'"'+(g.id===f.group?" selected":"")+'>'+esc(g.emoji+" "+g.name)+'</option>').join("")+'</select></label>';
  h+=field("paper","🎀 Their paper (fills in on new presents)","e.g. pink snowflakes")+field("birthday","Birthday","","date");
  h+='<div class="gf-f wide">'+field("sizes","👕 Sizes","e.g. shirt 8 · pants 8 slim · shoe 1Y")+'</div>';   // GIFTS_OCC
  h+='<label class="gf-f wide"><span>Likes, notes</span><textarea rows="2" oninput="gfSet(\'note\',this.value)">'+esc(f.note)+'</textarea></label>';
  return h+'</div>';
}
function budgetSheet(){
  const f=gfEdit.form,o=occ(f.occ);let h='<div class="gf-form">'+field("budget","Budget for "+esc((o||{}).name||"this occasion"),"","money");
  if(f.secs)secsOf(o).forEach(s=>{h+='<label class="gf-f"><span>'+esc((s.emoji||"")+" "+s.name)+' (optional)</span><input inputmode="decimal" value="'+esc(f.secs[s.id]||"")+'" oninput="gfSecBudget(\''+esc(s.id)+'\',this.value)"></label>';});
  return h+'</div>';
}
function evenSheet(){return '<div class="gf-form"><div class="gf-sub wide">Flag a kid as behind when they are more than…</div>'+field("pct","% behind in dollars","15","money")+field("n","gifts behind","2","money")+'</div>';}
function groupSheet(){return '<div class="gf-form">'+field("emoji","Emoji","🏡")+field("name","Group name","e.g. Neighbors")+'</div>';}
function occSheet(){   // OCCFIX (2026-11-20): editing an occasion shows its Sections + Done again — the checks read f.id, which the form never has, so they hid since slice 1
  const f=gfEdit.form;let h='<div class="gf-form">';
  if(!gfEdit.id)h+='<div class="gf-f wide"><span>Kind</span><div class="gf-picks">'+Object.keys(GF_KINDS).map(k=>'<button class="gf-pick'+(f.kind===k?" on":"")+'" onclick="gfSetDraw(\'kind\',\''+k+'\')">'+esc(GF_KINDS[k].label)+'</button>').join("")+'</div></div>';
  h+=occForPicker(f);   // GIFTS_OCC: whose birthday
  h+=field("name","Name","e.g. a birthday 2027")+field("date","Date","","date")+field("budget","Whole budget (optional)","","money");
  if(gfEdit.id){h+='<div class="gf-f wide"><span>Sections</span>'+f.secs.map((s,i)=>'<div style="display:flex;gap:6px;margin-top:4px"><input style="width:56px" value="'+esc(s.emoji)+'" oninput="gfSecEdit('+i+',\'emoji\',this.value)"><input value="'+esc(s.name)+'" oninput="gfSecEdit('+i+',\'name\',this.value)"></div>').join("")+
    '<button class="gf-tool" style="margin-top:6px;align-self:flex-start" onclick="gfSecAdd()">＋ Section</button></div>';
    h+='<label class="gf-f wide" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" style="width:auto"'+(f.closed?" checked":"")+' onchange="gfSet(\'closed\',this.checked)"> Done — move it to 📜 Past</label>';}
  return h+'</div>';
}
const SHEETS={even:["⚖️ When is a kid behind?",evenSheet],item:["Present",itemSheet],move:["↪ Move to…",moveSheet],person:["Person",personSheet],budget:["💲 Budget",budgetSheet],group:["Group",groupSheet],occ:["Occasion",occSheet],rcpt:["Receipt",rcptSheet]};
function sheet(){
  if(!gfEdit)return "";const S=SHEETS[gfEdit.kind];const id=gfEdit.id;
  const title=gfEdit.kind==="move"||gfEdit.kind==="budget"||gfEdit.kind==="even"?S[0]:(id?"✏️ "+S[0]:"➕ New "+S[0].toLowerCase());
  const del=id&&(gfEdit.kind==="item"||(gfEdit.kind==="person"&&!/^k_/.test(id))||gfEdit.kind==="group");
  return '<div id="gf-sheet" onclick="if(event.target.id===\'gf-sheet\')gfCancel()"><div class="gf-sh"><button class="gf-x" onclick="gfCancel()">✕</button><div style="font-weight:800;font-size:15px;margin-bottom:8px">'+esc(title)+'</div>'+S[1]()+
    '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap"><button class="gf-tool gf-save" onclick="gfSave()">Save</button><button class="gf-tool" onclick="gfCancel()">Cancel</button>'+
    (gfEdit.kind==="item"&&id?'<button class="gf-tool" onclick="gfMove(\''+esc(id)+'\')">↪ Move to…</button>':'')+
    (del?'<button class="gf-tool" style="margin-left:auto;color:#b5394a;border-color:#fecaca" onclick="gfDelete()">Delete</button>':'')+'</div></div></div>';
}

// ── actions ──────────────────────────────────────────────────────────────────
function gfStartOcc(kind,name,date,extra){   // extra (GIFTS_OCC) = {for?, budget?} — rides in the same ONE set
  kind=GF_KINDS[kind]?kind:"other";const t=today();
  if(kind==="christmas"&&!name){const y=+t.slice(0,4)+((t.slice(5)>"12-25")?1:0);name="Christmas "+y;date=y+"-12-25";}
  const secs={};GF_KINDS[kind].secs.forEach((s,i)=>{secs[s[0]]={emoji:s[1],name:s[2],order:i};});
  const id=newId("occasions",slug(name));const rec=Object.assign({name,kind,date:date||"",secs,ts:Date.now()},extra||{});
  node("occasions")[id]=rec;write("gifts/occasions/"+id,rec,"set");log("Started "+name);
  gfOcc=id;try{HA_LS.setItem("ha_gf_occ",id);}catch(e){}gfView="people";gfDraw();
}
function gfPickOcc(id){gfOcc=id;try{HA_LS.setItem("ha_gf_occ",id);}catch(e){}gfView="people";gfDraw();}
function gfOpenPerson(pid){gfPid=pid;gfView="person";gfDraw();try{window.scrollTo(0,0);}catch(e){}}
function gfBack(){gfView="people";gfDraw();}
function defaultPaper(pids,sec,oid){const s=((occ(oid)||{}).secs||{})[sec];if(s&&s.paper)return s.paper;const p=person(pids[0]);return (p&&p.paper)||"";}
function gfNewItem(pid,sid){
  const oid=curOcc();if(!oid)return;const S=secsOf(occ(oid));const pids=pid?[pid]:[];const sec=sid||(S[0]&&S[0].id)||"";
  gfEdit={kind:"item",id:null,form:{occ:oid,name:"",pids,sec,status:"idea",plan:"",paid:"",store:"",link:"",due:"",where:"",paper:defaultPaper(pids,sec,oid),note:"",needs:{},batt:""}};gfDraw();
}
function gfEditItem(id){const it=(gfData.items||{})[id];if(!it)return;const f={occ:it.occ,pids:pidsOf(it).slice(),sec:it.sec||"",status:it.status||"idea"};
  ["name","plan","paid","store","link","due","where","paper","note"].forEach(k=>{f[k]=it[k]==null?"":String(it[k]);});
  const n=it.needs||{};f.needs={batt:!!n.batt,build:!!n.build,charge:!!n.charge};f.batt=n.batt&&n.batt!==true?String(n.batt):"";
  gfEdit={kind:"item",id,form:f};gfDraw();}
function gfNeed(k){if(!gfEdit||!gfEdit.form.needs)return;gfEdit.form.needs[k]=!gfEdit.form.needs[k];gfDraw();}
function gfMove(id){const it=(gfData.items||{})[id];if(!it)return;gfEdit={kind:"move",id,form:{occ:it.occ,pids:pidsOf(it).slice(),sec:it.sec||"",was:{pids:pidsOf(it).slice(),occ:it.occ,sec:it.sec||""}}};gfDraw();}
function gfSet(k,v){if(!gfEdit)return;gfEdit.form[k]=v;if(k==="name")gfEdit.form.autoName=false;if(k==="date")gfEdit.form.autoDate=false;}
function gfSetDraw(k,v){if(!gfEdit)return;const f=gfEdit.form;
  if(k==="sec"&&gfEdit.kind==="item"&&!gfEdit.id&&(!f.paper||f.paper===defaultPaper(f.pids,f.sec,f.occ))){f.sec=v;f.paper=defaultPaper(f.pids,v,f.occ);}
  f[k]=v;if(k==="occ"){const S=secsOf(occ(v));if(!S.some(s=>s.id===f.sec))f.sec=(S[0]&&S[0].id)||"";}
  if(k==="kind"&&!f.id&&(!f.name||f.autoName)){f.name=GF_KINDS[v].label.replace(/^\S+\s/,"")+" "+today().slice(0,4);f.autoName=true;}
  if(k==="kind")occAuto(f);   // GIFTS_OCC
  gfDraw();}
function gfTogglePid(pid){if(!gfEdit)return;const f=gfEdit.form;const auto=gfEdit.kind==="item"&&!gfEdit.id&&(!f.paper||f.paper===defaultPaper(f.pids,f.sec,f.occ));
  const i=f.pids.indexOf(pid);if(i>=0)f.pids.splice(i,1);else f.pids.push(pid);if(auto)f.paper=defaultPaper(f.pids,f.sec,f.occ);gfDraw();}
function gfSecBudget(sid,v){if(gfEdit&&gfEdit.form.secs)gfEdit.form.secs[sid]=v;}
function gfSecEdit(i,k,v){if(gfEdit&&gfEdit.form.secs[i])gfEdit.form.secs[i][k]=v;}
function gfSecAdd(){if(!gfEdit)return;gfEdit.form.secs.push({id:null,emoji:"🎁",name:""});gfDraw();}
function gfCancel(){gfEdit=null;gfDraw();}
function names(pids){return pids.map(x=>(person(x)||{}).name||"?").join(" + ")||"no one";}
function gfSave(){
  if(!gfEdit)return;const {kind,id,form:f}=gfEdit;
  if(kind==="item"){
    const name=String(f.name||"").trim();if(!name){toast("What is it?");return;}
    const prev=id?Object.assign({},gfData.items[id]||{}):{};   // fields this sheet doesn't show (later slices) ride along
    ["occ","pids","sec","name","status","plan","paid","store","link","due","where","paper","note","needs"].forEach(k=>{delete prev[k];});
    const rec=Object.assign(prev,{occ:f.occ,pids:f.pids.slice(),sec:f.sec||"",name,status:f.status||"idea",ts:prev.ts||Date.now()});
    ["store","link","due","where","paper","note"].forEach(k=>{const v=String(f[k]||"").trim();if(v)rec[k]=v;});
    const nd={};if(f.needs&&f.needs.batt)nd.batt=String(f.batt||"").trim()||true;if(f.needs&&f.needs.build)nd.build=true;if(f.needs&&f.needs.charge)nd.charge=true;if(Object.keys(nd).length)rec.needs=nd;
    ["plan","paid"].forEach(k=>{const v=num(f[k]);if(v!=null)rec[k]=v;});
    if(!rec.pids.length)delete rec.pids;
    if(!id&&f.wish)rec.wish=f.wish;   // GIFTS_WISH: the kid's wish it came from ("<kid>/<wid>")
    const iid=id||uid();node("items")[iid]=rec;write("gifts/items/"+iid,rec,"set");
    log((id?"Edited: ":"Added: ")+name+" → "+names(f.pids)+(rec.paid!=null?" "+money(rec.paid):""));
  }else if(kind==="rcpt"){if(!rcptSave())return;   // GIFTS_RCPT
  }else if(kind==="even"){
    const rec={pct:Math.max(0,num(f.pct)==null?15:num(f.pct)),n:Math.max(1,num(f.n)==null?2:Math.round(num(f.n)))};
    node("settings").even=rec;write("gifts/settings/even",rec,"set");log("Even-steven: "+rec.pct+"% or "+rec.n+" gifts");
  }else if(kind==="move"){
    const it=gfData.items[id];if(!it){gfEdit=null;return gfDraw();}
    const up={pids:f.pids.length?f.pids.slice():null,occ:f.occ,sec:f.sec||""};
    if(it.paper&&it.paper===defaultPaper(f.was.pids,f.was.sec,f.was.occ)){const np=defaultPaper(f.pids,f.sec,f.occ);if(np)up.paper=np;}   // auto paper follows the new person
    Object.keys(up).forEach(k=>{if(up[k]==null)delete it[k];else it[k]=up[k];});write("gifts/items/"+id,up,"update");
    log("Moved: "+it.name+": "+names(f.was.pids)+" → "+names(f.pids)+(f.occ!==f.was.occ?" ("+((occ(f.occ)||{}).name||"")+")":""));
  }else if(kind==="person"){
    const pid=id||newId("people","p-"+slug(f.name));const kid=/^k_/.test(pid);
    const name=kid?f.name:String(f.name||"").trim();if(!name){toast("Needs a name");return;}
    const up={paper:String(f.paper||"").trim()||null,birthday:f.birthday||null,sizes:String(f.sizes||"").trim().slice(0,120)||null,note:String(f.note||"").trim()||null};   // sizes: GIFTS_OCC
    if(!kid){up.name=name;up.group=f.group||"other";}else{up.group="kids";up.kid=pid.slice(2);}
    if(!id)up.ts=Date.now();
    const cur=node("people")[pid]=Object.assign({},node("people")[pid]||{});Object.keys(up).forEach(k=>{if(up[k]==null)delete cur[k];else cur[k]=up[k];});
    write("gifts/people/"+pid,up,"update");log((id?"Edited person: ":"Added person: ")+name);
  }else if(kind==="budget"){
    const b=num(f.budget),rec={};if(b!=null)rec.budget=b;
    if(f.secs){const s={};Object.keys(f.secs).forEach(k=>{const v=num(f.secs[k]);if(v!=null)s[k]=v;});if(Object.keys(s).length)rec.sec=s;}
    (node("plan")[f.occ]=node("plan")[f.occ]||{})[f.key]=rec;write("gifts/plan/"+f.occ+"/"+f.key,Object.keys(rec).length?rec:null,Object.keys(rec).length?"set":"remove");
    log("Budget "+f.label+" → "+(b!=null?money(b):"none"));
  }else if(kind==="group"){
    const name=String(f.name||"").trim();if(!name){toast("Needs a name");return;}
    const gid=id||newId("groups",slug(name));const up={name,emoji:String(f.emoji||"").trim()||"👥"};if(!id)up.order=50+groups().length;
    node("groups")[gid]=Object.assign({},node("groups")[gid]||{},up);write("gifts/groups/"+gid,up,"update");log((id?"Renamed group: ":"Added group: ")+name);
  }else if(kind==="occ"){
    const name=String(f.name||"").trim();if(!name){toast("Needs a name");return;}
    if(!id){gfEdit=null;gfStartOcc(f.kind||"other",name,f.date||"",occExtra(f));return;}   // GIFTS_OCC: for + budget in the ONE set
    const up={name,date:f.date||"",budget:num(f.budget),closed:f.closed?true:null};
    if(f.kind==="birthday")up.for=f.for||null;   // GIFTS_OCC
    const o=gfData.occasions[id];Object.keys(up).forEach(k=>{if(up[k]==null)delete o[k];else o[k]=up[k];});write("gifts/occasions/"+id,up,"update");
    const secs=o.secs=o.secs||{};let nextOrder=Object.keys(secs).reduce((m,k)=>Math.max(m,+(secs[k].order)||0),-1)+1;
    f.secs.forEach((s,i)=>{const nm=String(s.name||"").trim();if(!nm)return;const sid=s.id||newId2(secs,slug(nm));const rec={name:nm,emoji:String(s.emoji||"").trim()||"🎁",order:s.id?((secs[s.id]||{}).order||0):nextOrder++};
      const old=secs[sid]||{};if(old.name===rec.name&&old.emoji===rec.emoji&&s.id)return;secs[sid]=Object.assign({},old,rec);write("gifts/occasions/"+id+"/secs/"+sid,rec,"update");});
    log("Edited "+name);
  }
  gfEdit=null;toast("✓ Saved");gfDraw();
}
function newId2(o,base){let id=base,n=2;while(o[id])id=base+"-"+(n++);return id;}
function gfDelete(){
  if(!gfEdit||!gfEdit.id)return;const {kind,id}=gfEdit;
  if(kind==="item"){const it=gfData.items[id]||{};if(!confirm("Delete \""+(it.name||"this")+"\"? (↪ Move or ✕ Dropped keep it on the record.)"))return;delete gfData.items[id];write("gifts/items/"+id,null,"remove");log("Deleted: "+(it.name||id));}
  else if(kind==="person"){const p=person(id)||{};if(!confirm("Take "+(p.name||"them")+" off the list? Their past presents stay on the record."))return;
    const has=items().some(it=>pidsOf(it).indexOf(id)>=0);
    if(has){node("people")[id]=Object.assign({},gfData.people[id]||{},{gone:true});write("gifts/people/"+id,{gone:true},"update");}else{delete gfData.people[id];write("gifts/people/"+id,null,"remove");}
    log("Removed person: "+(p.name||id));if(gfPid===id)gfView="people";}
  else if(kind==="group"){const g=groups().find(x=>x.id===id)||{};if(people().some(p=>(p.group||"other")===id)){toast("Move the people in "+g.name+" to another group first");return;}
    if(!confirm("Delete the group \""+(g.name||id)+"\"?"))return;node("groups")[id]=Object.assign({},gfData.groups[id]||{},{gone:true});write("gifts/groups/"+id,{gone:true},"update");log("Removed group: "+(g.name||id));}
  gfEdit=null;gfDraw();
}
function gfNext(id){const it=(gfData.items||{})[id];if(!it)return;const nx=GF_NEXT[it.status||"idea"];if(!nx)return;it.status=nx;write("gifts/items/"+id,{status:nx},"update");log(it.name+" → "+st(nx)[1]);gfDraw();}
function gfGo(v){gfView=v;gfSelOn=false;gfSel={};gfDraw();try{window.scrollTo(0,0);}catch(e){}}
function gfSelToggle(){gfSelOn=!gfSelOn;gfSel={};gfDraw();}
function gfPick(id){if(gfSel[id])delete gfSel[id];else gfSel[id]=1;gfDraw();}
function setStatus(ids,status){let n=0;ids.forEach(id=>{const it=(gfData.items||{})[id];if(!it||it.status===status)return;it.status=status;write("gifts/items/"+id,{status},"update");n++;});return n;}   // one targeted update per present
function gfBulk(status){const ids=Object.keys(gfSel);if(!ids.length)return;const n=setStatus(ids,status);if(n)log(n+" present"+(n===1?"":"s")+" → "+st(status)[1]);gfSel={};gfSelOn=false;toast("✓ "+n+" → "+st(status)[1]);gfDraw();}
function gfBulkIds(csv,status){const n=setStatus(String(csv||"").split(",").filter(Boolean),status);if(n)log(n+" present"+(n===1?"":"s")+" → "+st(status)[1]);gfDraw();}
function gfGather(id){const it=(gfData.items||{})[id];if(!it)return;const to=it.status==="given"?(it.wasStatus||"wrapped"):"given";
  const up={status:to,wasStatus:to==="given"?(it.status||"wrapped"):null};it.status=to;if(up.wasStatus)it.wasStatus=up.wasStatus;else delete it.wasStatus;write("gifts/items/"+id,up,"update");gfDraw();}
function eveNode(oid){const e=node("eve");return e[oid]=e[oid]||{};}
function gfEveTick(key){const oid=curOcc();if(!oid)return;const d=eveNode(oid).done=eveNode(oid).done||{};if(d[key]){delete d[key];write("gifts/eve/"+oid+"/done/"+key,null,"remove");}else{d[key]=Date.now();write("gifts/eve/"+oid+"/done/"+key,d[key],"set");}gfDraw();}
function gfLineAdd(){const oid=curOcc(),el=document.getElementById("gf-line");const t=String((el&&el.value)||"").trim();if(!oid||!t)return;
  const L=eveNode(oid).lines=eveNode(oid).lines||{};const id=uid(),rec={text:t.slice(0,140),order:Object.keys(L).length};L[id]=rec;write("gifts/eve/"+oid+"/lines/"+id,rec,"set");gfDraw();
  const n=document.getElementById("gf-line");if(n&&n.focus)n.focus();}
function gfLineTick(id){const oid=curOcc(),l=((eveNode(oid).lines)||{})[id];if(!l)return;l.done=!l.done;write("gifts/eve/"+oid+"/lines/"+id+"/done",l.done?true:null,l.done?"set":"remove");if(!l.done)delete l.done;gfDraw();}
function gfLineDel(id){const oid=curOcc(),L=eveNode(oid).lines||{};if(!L[id])return;delete L[id];write("gifts/eve/"+oid+"/lines/"+id,null,"remove");gfDraw();}
function gfLinesCopy(from){const oid=curOcc();if(!oid)return;const L=eveNode(oid).lines=eveNode(oid).lines||{};
  eveLines(from).forEach((l,i)=>{const id=uid()+i,rec={text:l.text,order:i};L[id]=rec;write("gifts/eve/"+oid+"/lines/"+id,rec,"set");});log("Copied the Christmas Eve list from "+((occ(from)||{}).name||""));gfDraw();}
function gfEvenEdit(){const E=evenSet();gfEdit={kind:"even",id:null,form:{pct:String(E.pct),n:String(E.n)}};gfDraw();}
function gfNewPerson(){gfEdit={kind:"person",id:null,form:{name:"",group:"mom",paper:"",birthday:"",sizes:"",note:""}};gfDraw();}
function gfEditPerson(pid){const p=person(pid);if(!p)return;gfEdit={kind:"person",id:pid,form:{name:p.name||"",group:p.group||"other",paper:p.paper||"",birthday:p.birthday||"",sizes:p.sizes||"",note:p.note||""}};gfDraw();}
function gfBudget(pid){const oid=curOcc(),p=plan(oid,pid),secs={};Object.keys(p.sec||{}).forEach(k=>{secs[k]=String(p.sec[k]);});
  gfEdit={kind:"budget",id:pid,form:{occ:oid,key:pid,label:(person(pid)||{}).name||pid,budget:p.budget==null?"":String(p.budget),secs}};gfDraw();}
function gfGroupBudget(gid){const oid=curOcc(),p=plan(oid,"g_"+gid),g=groups().find(x=>x.id===gid)||{};
  gfEdit={kind:"budget",id:"g_"+gid,form:{occ:oid,key:"g_"+gid,label:g.name||gid,budget:p.budget==null?"":String(p.budget),secs:null}};gfDraw();}
function gfNewGroup(){gfEdit={kind:"group",id:null,form:{name:"",emoji:"👥"}};gfDraw();}
function gfNewOcc(){gfEdit={kind:"occ",id:null,form:{kind:"birthday",name:"",date:"",budget:"",autoName:true}};gfSetDraw("kind","birthday");}
function gfOccEdit(){const o=occ(curOcc());if(!o)return;gfEdit={kind:"occ",id:o.id,form:{kind:o.kind||"other",for:o.for||null,name:o.name||"",date:o.date||"",budget:o.budget==null?"":String(o.budget),closed:!!o.closed,secs:secsOf(o).map(s=>({id:s.id,emoji:s.emoji||"",name:s.name||""}))}};gfDraw();}

// GIFTS_WISH_START — 💌 a kid's own wish list on their page, slice 7 (her answer "Kids' wish lists → yes, later" + her yes to
// building it, 2026-11-20; plan §3.7 + §4 slice 7: "Mom sees them as 💭 ideas on that kid's page. The kid's list never shows what
// was bought."). The kids write wishes/<kid>/<wid> {text?, stars?, hasPhoto?, ts} from Kids' Corner (wishes.js); the picture is
// wishPhotos/<kid>/<wid>, read here only when she taps it. Mom only (this file only runs for Mom inside Mom's Day):
//   · "💌 Their wish list" card on a kid's page — words, ⭐s, 🖼 picture on tap, newest first
//   · 💭 Add as an idea → the normal new-present sheet, prefilled (the wish's words, for that kid, this occasion); the present it
//     makes keeps wish:"<kid>/<wid>" (gifts/items, ONE set as always) and the wish then shows "✓ on your list" — HERE only.
//   · ✕ Remove → one multi-path remove of the wish + its photo (it goes off the kid's list too — she's asked first).
// THE SECRET: nothing about a present is ever written under wishes/ — the kid's list can't change because of what she did here.
let gfWishes={}, gfWishOn=false, gfWishLoaded=false, gfWishPic=null, gfWishAll={};   // all kids' wishes · the picture open (kid/wid) · kids whose whole list is unfolded
const gfWishPh={};   // "kid/wid" → dataURL | "loading" | "err"
const WISH_SHOW=5;
function wishListen(){
  if(gfWishOn)return;gfWishOn=true;
  if(typeof db==="undefined"||!db){gfWishLoaded=true;return;}
  db.ref("wishes").on("value",s=>{gfWishes=s.val()||{};gfWishLoaded=true;if(gfView==="person"&&!gfEdit)gfDraw();});
}
function wishesOf(kid){const o=(gfWishes||{})[kid]||{};return Object.keys(o).filter(w=>o[w]&&typeof o[w]==="object").map(w=>Object.assign({id:w},o[w])).sort((a,b)=>(b.ts||0)-(a.ts||0));}
function wishLinked(kid,wid){const key=kid+"/"+wid;return items().filter(it=>it.wish===key&&live(it));}   // any occasion
function wishStyle(){if(typeof document==="undefined"||document.getElementById("gf-wish-style"))return;const s=document.createElement("style");s.id="gf-wish-style";s.textContent=WISH_CSS;document.head.appendChild(s);}
function wishRow(kid,w){
  const key=kid+"/"+w.id,L=wishLinked(kid,w.id),on=gfWishPic===key,P=gfWishPh[key];
  const when=w.ts?new Date(w.ts).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"";
  let h='<div class="gf-wish"><div class="gf-wrow">'+(w.hasPhoto?'<button class="gf-wpic" title="See the picture" onclick="gfWishPicShow(\''+esc(kid)+'\',\''+esc(w.id)+'\')">🖼</button>':'')+
    '<span class="gf-pn">'+(w.text?esc(w.text):'<i style="font-weight:600;color:#64748b">a picture</i>')+'<span class="gf-pc">'+(w.stars?"⭐".repeat(Math.min(3,+w.stars||0))+" · ":"")+esc(when)+'</span></span>'+
    (L.length?chip("✓ on your list · "+st(L[0].status)[1],"#16a34a"):'<button class="gf-tool gf-mini" onclick="gfWishAdd(\''+esc(kid)+'\',\''+esc(w.id)+'\')">💭 Add as an idea</button>')+
    '<button class="gf-tool gf-mini" title="Remove this wish" onclick="gfWishDel(\''+esc(kid)+'\',\''+esc(w.id)+'\')">✕</button></div>';
  if(on)h+='<div class="gf-wbig">'+(P&&P!=="loading"&&P!=="err"?'<img src="'+esc(P)+'" alt="">':'<div class="gf-sub" style="margin:4px 0">'+(P==="err"?"The picture couldn't load right now.":"Loading the picture…")+'</div>')+'</div>';
  return h+'</div>';
}
function wishCard(o,pid){
  const p=person(pid);if(!p||!p.kid)return "";wishListen();wishStyle();
  const kid=p.kid,W=wishesOf(kid),all=!!gfWishAll[kid],show=all?W:W.slice(0,WISH_SHOW);
  let h='<div class="gf-card"><div class="gf-ghd"><span>💌 Their wish list</span><span class="gf-gsum">'+(gfWishLoaded?W.length:'')+'</span></div><div class="gf-bd">';
  if(!gfWishLoaded)h+='<div class="gf-empty">Loading…</div>';
  else if(!W.length)h+='<div class="gf-empty">'+esc(p.name)+' hasn\'t added any wishes yet — Kids\' Corner ▸ 🎁 My wish list.</div>';
  else{h+=show.map(w=>wishRow(kid,w)).join("");
    if(W.length>WISH_SHOW)h+='<button class="gf-tool" style="margin-top:6px" onclick="gfWishMore(\''+esc(kid)+'\')">'+(all?"Show fewer":"Show all "+W.length)+'</button>';}
  return h+'</div></div>';
}
function gfWishPicShow(kid,wid){
  const key=kid+"/"+wid;gfWishPic=gfWishPic===key?null:key;
  if(gfWishPic&&gfWishPh[key]===undefined){
    if(typeof db==="undefined"||!db)gfWishPh[key]="err";
    else{gfWishPh[key]="loading";db.ref("wishPhotos/"+kid+"/"+wid).once("value").then(s=>{gfWishPh[key]=s.val()||"err";if(!gfEdit)gfDraw();}).catch(()=>{gfWishPh[key]="err";if(!gfEdit)gfDraw();});}
  }
  gfDraw();
}
function gfWishMore(kid){gfWishAll[kid]=!gfWishAll[kid];gfDraw();}
function gfWishAdd(kid,wid){
  const w=wishesOf(kid).find(x=>x.id===wid);if(!w)return;
  gfNewItem("k_"+kid);if(!gfEdit||gfEdit.kind!=="item")return;   // this occasion, its first section, for that kid, their paper
  gfEdit.form.name=String(w.text||"").slice(0,140);gfEdit.form.wish=kid+"/"+wid;gfDraw();
}
function gfWishDel(kid,wid){
  const w=((gfWishes||{})[kid]||{})[wid];if(!w)return;const nm=(person("k_"+kid)||{}).name||"their";
  if(!confirm("Take "+(w.text?"\""+w.text+"\"":"this picture")+" off "+nm+"'s wish list? It goes off their list too."))return;
  delete gfWishes[kid][wid];delete gfWishPh[kid+"/"+wid];if(gfWishPic===kid+"/"+wid)gfWishPic=null;
  if(typeof db!=="undefined"&&db&&!dry()){const up={};up["wishes/"+kid+"/"+wid]=null;if(w.hasPhoto)up["wishPhotos/"+kid+"/"+wid]=null;db.ref().update(up);}
  gfDraw();
}
const WISH_CSS=`
.gf-wish{border-top:1px solid #f1f5f9;padding:7px 0}
.gf-wish:first-child{border-top:none}
.gf-wrow{display:flex;align-items:center;gap:8px}
.gf-wrow .gf-pn{flex:1;min-width:0;word-wrap:break-word}
.gf-wrow .gf-chip{white-space:normal;text-align:center}
.gf-wpic{border:1.5px solid var(--border);background:#f8fafc;border-radius:9px;width:36px;height:36px;font-size:17px;cursor:pointer;flex:none}
.gf-wbig img{width:100%;max-width:420px;border-radius:10px;border:1px solid #e2e8f0;margin-top:6px;display:block}
`;
Object.assign(window,{gfWishPicShow,gfWishMore,gfWishAdd,gfWishDel});
window._gfWishTest={setWishes:d=>{gfWishes=d||{};gfWishLoaded=true;},wishes:()=>gfWishes,wishesOf,wishLinked,photos:gfWishPh,on:()=>gfWishOn};
// GIFTS_WISH_END

// GIFTS_RCPT_START — 📸 Receipts, slice 3 (her ask 2026-11-20: "submit receipts, like have a picture"; plan §3.5; her answer to
// question 6: "each line gets its own person"). Snap up to 6 photos (shrunk on this device, ≈⅓ MB each) or pick a PDF / screenshot
// (an Amazon order page) → the family Claude key reads store, date, order #, total, every line and a printed return-by date, and
// says which 💭 idea a line probably is → a check screen, one row per line: who it's for (tap 2+ = 🤝 shared) · section · 🗄 no one
// yet · ✕ not a gift; a line that is one of her ideas offers "mark that idea bought" instead of a new present. NOTHING saves until
// she taps Save. No Claude key → she still attaches the photos and types the total (and any lines) by hand.
//   gifts/receipts/<rid>  {store, iso, orderNo?, total?, returnBy?, lines:[{t, p?, item?}], photoCount, occ, ts}
//                         (p = the line's price: the plan wrote "$", but Firebase forbids "$" in a key; item = the present it became)
//   giftPhotos/<rid>      [dataURL, …]  its OWN top node, read only when she opens that receipt — never at start (the page-size /
//                         LG-speed rule; the messages/messagePhotos pattern). A PDF is kept as a data:application/pdf URL.
//   each present it made or marked bought gets paid, store, status (🛒 on the way / 📦 here — her pick on the check screen),
//   rcpt:<rid>, returnBy?, orderNo?  — one targeted set (new) or update (an idea) per present.
const RC_MAX=6, RC_PDF_MAX=4*1024*1024;
let gfRcOpen=null;const gfPhotos={};   // the receipt open in the list · photos read so far this visit (rid → [urls] | "loading" | "err")
const RC_PROMPT='Read this receipt or online order (photos of ONE paper receipt, a screenshot, or a PDF such as an Amazon order page). The items are holiday presents. Reply with ONLY strict JSON, no prose:\n'
  +'{"store":"store name","date":"YYYY-MM-DD or null","orderNo":"order number as printed, or null","total":number or null,"returnBy":"YYYY-MM-DD or null","lines":[{"text":"the item as printed","name":"a short plain name for it (a few words)","price":number,"idea":"the exact idea name from her list below, or null"}]}\n'
  +'price = what was actually paid for that line after any discount — always the LINE total (2 @ 9.99 = 19.98). returnBy = only a return-by date or the end of a return window that is PRINTED on it; never work one out yourself. '
  +'Several photos are one receipt from top to bottom and neighbouring photos may overlap: list each line ONCE. Skip tax, subtotal, total, shipping, bag fees, payment and change lines. Never invent lines or prices.';
function claudeKey(){try{return (typeof kitCapKey==="function"&&kitCapKey())||"";}catch(e){return "";}}
function firstJson(txt){   // the first complete top-level {…} (the grocery reader's rule, GR_RCPTLONG) — null when it never closed
  const t=String(txt==null?"":txt),i=t.indexOf("{");if(i<0)return null;let depth=0,inStr=false,bs=false;
  for(let j=i;j<t.length;j++){const c=t[j];if(inStr){if(bs)bs=false;else if(c==="\\")bs=true;else if(c==='"')inStr=false;continue;}
    if(c==='"')inStr=true;else if(c==="{")depth++;else if(c==="}"){depth--;if(depth===0)return t.slice(i,j+1);}}
  return null;
}
function isoOk(v){v=String(v||"").trim();return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:"";}
function ideas(oid){return items(oid).filter(it=>(it.status||"idea")==="idea");}
const RC_SKIP=["the","and","for","with","set","pack","pk","kit","new","toy","toys","kids","gift"];
function toks(s){return String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").split(/\s+/).filter(w=>w.length>=3&&RC_SKIP.indexOf(w)<0);}
function matchIdea(line,guess,oid,used){   // Claude's pick first (exact name), else most of the idea's words are in the line
  const L=ideas(oid).filter(it=>used.indexOf(it.id)<0),g=String(guess||"").trim().toLowerCase();
  if(g){const hit=L.find(it=>String(it.name||"").trim().toLowerCase()===g);if(hit)return hit.id;}
  const lt=toks(line);let best=null,bs=0;
  L.forEach(it=>{const w=toks(it.name);if(!w.length)return;const s=w.filter(x=>lt.indexOf(x)>=0).length/w.length;if(s>bs){bs=s;best=it.id;}});
  return bs>=0.6?best:null;
}
function rcRow(oid,t,p){const S=secsOf(occ(oid));return {t:t||"",p:p==null?"":String(p),pids:[],sec:(S[0]&&S[0].id)||"",nog:false,idea:null,useIdea:false};}
function rcptLoad(f,d,oid){   // Claude's answer → the form; what she already typed wins
  d=d||{};if(!String(f.store||"").trim()&&d.store)f.store=String(d.store).slice(0,60);
  if((!f.iso||f.iso===today())&&isoOk(d.date))f.iso=isoOk(d.date);   // the sheet starts on today; the printed date beats that
  if(!String(f.orderNo||"").trim()&&d.orderNo)f.orderNo=String(d.orderNo).slice(0,60);
  if(num(f.total)==null&&num(d.total)!=null)f.total=String(num(d.total));if(!f.returnBy&&isoOk(d.returnBy))f.returnBy=isoOk(d.returnBy);
  if(!f.statusSet)f.status=f.orderNo?"ordered":"here";
  const used=[];f.rows=(Array.isArray(d.lines)?d.lines:[]).filter(l=>l&&(l.name||l.text)).map(l=>{
    const r=rcRow(oid,String(l.name||l.text).trim().slice(0,140),num(l.price));const iid=matchIdea((l.text||"")+" "+(l.name||""),l.idea,oid,used);
    if(iid){used.push(iid);r.idea=iid;r.useIdea=true;}return r;});
  f.read=true;
}
function dataParts(url){const m=/^data:([^;,]+);base64,(.*)$/.exec(String(url||""));return m?{type:m[1],b64:m[2]}:null;}
async function gfRcptRead(){
  const E=gfEdit;if(!E||E.kind!=="rcpt")return;const f=E.form,key=claudeKey(),oid=curOcc();
  if(!key){f.msg="Reading needs the family Claude key (Admin ▸ Settings ▸ ✨ AI key). You can still type it in below.";return gfDraw();}
  if(!f.files.length){f.msg="Add a photo or a PDF first.";return gfDraw();}
  f.busy=true;f.msg="";gfDraw();
  try{
    const imgs=f.files.filter(x=>!x.pdf),pdfs=f.files.filter(x=>x.pdf),content=[];
    imgs.forEach((x,i)=>{const d=dataParts(x.url);if(!d)return;if(imgs.length>1)content.push({type:"text",text:"Photo "+(i+1)+" of "+imgs.length+(i===0?" (top of the receipt)":i===imgs.length-1?" (bottom)":"")});
      content.push({type:"image",source:{type:"base64",media_type:d.type,data:d.b64}});});
    pdfs.forEach((x,i)=>{const d=dataParts(x.url);if(!d)return;content.push({type:"text",text:"PDF"+(pdfs.length>1?" "+(i+1)+" of "+pdfs.length:"")});content.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:d.b64}});});
    const I=ideas(oid).map(it=>JSON.stringify(String(it.name||"")));
    content.push({type:"text",text:RC_PROMPT+(I.length?"\nHer present ideas (name a line's idea ONLY when it is clearly that item): "+I.join("; "):"\nShe has no ideas on her list — idea is always null.")});
    const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
      headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-sonnet-5",max_tokens:8000,messages:[{role:"user",content}]})});
    if(!resp.ok){const t=await resp.text();throw new Error("Claude "+resp.status+" — "+String(t).slice(0,120));}
    const data=await resp.json();
    if(data.stop_reason==="max_tokens")throw new Error("That receipt came back incomplete — try again, or fewer photos at a time.");
    const txt=(data.content||[]).filter(b=>b&&b.type==="text").map(b=>b.text).join(""),js=firstJson(txt);
    if(js==null)throw new Error("Claude didn't send back a receipt — try a clearer photo.");
    let d;try{d=JSON.parse(js);}catch(pe){throw new Error("Claude's answer didn't come out readable — try again.");}
    rcptLoad(f,d,oid);
    f.msg=f.rows.length?"✓ Read "+f.rows.length+" line"+(f.rows.length===1?"":"s")+" — say who each is for, then Save.":"Claude found no lines — type them in below, or just the total.";
  }catch(e){f.msg=String(e&&e.message||e);}
  f.busy=false;if(gfEdit===E)gfDraw();
}
function shrinkTo(file,max,q){return new Promise((res,rej)=>{const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{try{const r=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",q));}catch(e){rej(e);}};
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("Couldn't read a photo."));};img.src=url;});}
async function shrink(file){let out=await shrinkTo(file,1600,0.78);if(out.length>420000)out=await shrinkTo(file,1280,0.65);return out;}   // msgShrink's sizes
function readUrl(file){return new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res(String(rd.result||""));rd.onerror=()=>rej(new Error("Couldn't open that file."));rd.readAsDataURL(file);});}
async function gfRcptPick(input){
  const E=gfEdit;if(!E||E.kind!=="rcpt")return;const f=E.form,files=[].slice.call((input&&input.files)||[]);try{input.value="";}catch(e){}
  const room=RC_MAX-f.files.length;f.msg=files.length>room?"Only "+RC_MAX+" fit on one receipt — the first "+Math.max(0,room)+" were added.":"";f.adding=true;gfDraw();
  for(const x of files.slice(0,Math.max(0,room))){
    try{if(/pdf/i.test(x.type||"")||/\.pdf$/i.test(x.name||"")){if(x.size>RC_PDF_MAX){f.msg="That PDF is too big to keep (over 4 MB) — a screenshot of the order page works too.";continue;}f.files.push({url:await readUrl(x),pdf:true});}
      else f.files.push({url:await shrink(x),pdf:false});}catch(e){f.msg="One file couldn't be read — try a different one.";}
  }
  f.adding=false;if(gfEdit===E)gfDraw();
}
function rcF(){return gfEdit&&gfEdit.kind==="rcpt"?gfEdit.form:null;}
function rcR(i){const f=rcF();return f&&f.rows[i];}
function gfRcptNew(){if(!curOcc())return;gfEdit={kind:"rcpt",id:null,form:{files:[],store:"",iso:today(),orderNo:"",total:"",returnBy:"",status:"here",statusSet:false,rows:[],read:false,busy:false,adding:false,msg:""}};gfDraw();}
function gfRcptDrop(i){const f=rcF();if(!f)return;f.files.splice(i,1);gfDraw();}
function gfRcSet(i,k,v){const r=rcR(i);if(r)r[k]=v;}
function gfRcPid(i,pid){const r=rcR(i);if(!r)return;r.nog=false;const j=r.pids.indexOf(pid);if(j>=0)r.pids.splice(j,1);else r.pids.push(pid);gfDraw();}
function gfRcNone(i){const r=rcR(i);if(!r)return;r.pids=[];r.nog=false;gfDraw();}
function gfRcNog(i){const r=rcR(i);if(!r)return;r.nog=!r.nog;if(r.nog){r.pids=[];r.useIdea=false;}gfDraw();}
function gfRcSec(i,sid){const r=rcR(i);if(r)r.sec=sid;gfDraw();}
function gfRcUseIdea(i){const r=rcR(i);if(!r||!r.idea)return;r.useIdea=!r.useIdea;if(r.useIdea)r.nog=false;gfDraw();}
function gfRcIdea(i,iid){const f=rcF(),r=rcR(i);if(!r)return;f.rows.forEach((o,j)=>{if(j!==i&&iid&&o.idea===iid){o.idea=null;o.useIdea=false;}});r.idea=iid||null;r.useIdea=!!iid;if(iid)r.nog=false;gfDraw();}
function gfRcAdd(){const f=rcF();if(!f)return;f.rows.push(rcRow(curOcc(),"",null));gfDraw();}
function gfRcDel(i){const f=rcF();if(!f)return;f.rows.splice(i,1);gfDraw();}
function gfRcStatus(s){const f=rcF();if(!f)return;f.status=s;f.statusSet=true;gfDraw();}
function rcptSheet(){
  const f=gfEdit.form,oid=curOcc(),o=occ(oid),S=secsOf(o),key=claudeKey(),I=ideas(oid);
  let h='<div class="gf-form"><div class="gf-f wide"><span>📸 Photos of the receipt, or a PDF / screenshot of the order ('+f.files.length+' of '+RC_MAX+')</span><div class="gf-rcph">'+
    f.files.map((x,i)=>'<div class="gf-rcth">'+(x.pdf?'<div class="gf-rcpdf">📄 PDF</div>':'<img src="'+esc(x.url)+'">')+'<button onclick="gfRcptDrop('+i+')">✕</button></div>').join("")+
    (f.files.length<RC_MAX?'<label class="gf-rcadd"><input type="file" accept="image/*,application/pdf,.pdf" multiple onchange="gfRcptPick(this)" style="display:none">'+(f.adding?'⏳':'＋ 📸')+'</label>':'')+'</div></div>';
  h+=key?'<div class="gf-f wide"><button class="gf-tool gf-save" style="align-self:flex-start"'+(f.busy||!f.files.length?' disabled':'')+' onclick="gfRcptRead()">'+(f.busy?'⏳ Reading…':'✨ Read it')+'</button></div>'
    :'<div class="gf-sub wide" style="color:#92400e;margin:0">No Claude key on this device, so it can\'t read the receipt — type the total (and the presents, if you like) below. The photos still save as proof for returns.</div>';
  if(f.msg)h+='<div class="gf-sub wide" style="margin:0;font-weight:700;color:'+(/^✓/.test(f.msg)?"#15803d":"#b45309")+'">'+esc(f.msg)+'</div>';
  h+=field("store","Store","e.g. Target")+field("iso","Date","","date")+field("total","Total $","","money")+field("orderNo","Order #","optional")+field("returnBy","⏰ Return by","","date");
  if(f.rows.length){
    h+='<div class="gf-f wide"><span>These presents are…</span><div class="gf-picks">'+[["ordered","🛒 On the way"],["here","📦 Here"]].map(s=>'<button class="gf-pick'+(f.status===s[0]?" on":"")+'" onclick="gfRcStatus(\''+s[0]+'\')">'+s[1]+'</button>').join("")+'</div></div>';
    h+='<div class="gf-sub wide" style="margin:4px 0 0">Each line: who it\'s for (tap two or more = 🤝 shared), the section — or 🗄 no one yet, or ✕ not a gift.</div>';
  }
  f.rows.forEach((r,i)=>{
    const idea=r.idea&&(gfData.items||{})[r.idea];
    h+='<div class="gf-rcrow'+(r.nog?" nog":"")+'"><div style="display:flex;gap:6px;align-items:center"><input class="gf-in" value="'+esc(r.t)+'" placeholder="What is it?" oninput="gfRcSet('+i+',\'t\',this.value)">'+
      '<input class="gf-in" style="flex:none;width:76px" inputmode="decimal" value="'+esc(r.p)+'" placeholder="$" oninput="gfRcSet('+i+',\'p\',this.value)"><button class="gf-tool gf-mini" title="Take this line off" onclick="gfRcDel('+i+')">✕</button></div>';
    if(idea)h+='<button class="gf-tick'+(r.useIdea?" on":"")+'" onclick="gfRcUseIdea('+i+')"><span class="gf-box">'+(r.useIdea?'✓':'')+'</span><span>💭 That\'s your idea <b>'+esc(idea.name)+'</b>'+(pidsOf(idea).length?' ('+esc(names(pidsOf(idea)))+')':'')+' — mark it bought</span></button>';
    if(!(r.useIdea&&idea)){
      h+='<div class="gf-picks">';groups().forEach(g=>{people().filter(p=>(p.group||"other")===g.id).forEach(p=>{const on=r.pids.indexOf(p.id)>=0;
        h+='<button class="gf-pick'+(on?" on":"")+'" style="'+(on?"background:"+esc(p.color||"#0f172a")+";border-color:"+esc(p.color||"#0f172a"):"")+'" onclick="gfRcPid('+i+',\''+esc(p.id)+'\')">'+esc(p.name)+'</button>';});});
      h+='<button class="gf-pick'+(!r.nog&&!r.pids.length?" on":"")+'" onclick="gfRcNone('+i+')">🗄 No one yet</button><button class="gf-pick'+(r.nog?" on":"")+'" onclick="gfRcNog('+i+')">✕ Not a gift</button></div>';
      if(!r.nog&&r.pids.length)h+='<div class="gf-picks">'+S.map(s=>'<button class="gf-pick'+(r.sec===s.id?" on":"")+'" onclick="gfRcSec('+i+',\''+esc(s.id)+'\')">'+esc((s.emoji||"")+" "+s.name)+'</button>').join("")+'</div>';
    }
    if(!r.nog&&I.length)h+='<select class="gf-sel" style="margin-top:6px" onchange="gfRcIdea('+i+',this.value)"><option value="">'+(r.idea?"Not one of my ideas":"Or it\'s one of my 💭 ideas…")+'</option>'+I.map(it=>'<option value="'+esc(it.id)+'"'+(it.id===r.idea?" selected":"")+'>'+esc(it.name)+(pidsOf(it).length?' — '+esc(names(pidsOf(it))):'')+'</option>').join("")+'</select>';
    h+='</div>';
  });
  h+='<div class="gf-f wide"><button class="gf-tool" style="align-self:flex-start" onclick="gfRcAdd()">＋ A line by hand</button></div>';
  return h+'</div>';
}
function rcptSave(){   // photos (own node) → the receipt (ONE set) → one set/update per present it made or marked bought
  const f=gfEdit.form,oid=curOcc();if(f.busy||f.adding){toast("Still reading — one moment");return false;}
  const rows=f.rows.filter(r=>String(r.t||"").trim()||num(r.p)!=null);
  if(rows.some(r=>!r.nog&&!(r.useIdea&&r.idea)&&!String(r.t||"").trim())){toast("Each present needs a name");return false;}
  if(!f.files.length&&!rows.length&&num(f.total)==null){toast("Add a photo or type the total");return false;}
  const rid=uid(),store=String(f.store||"").trim().slice(0,60),ord=String(f.orderNo||"").trim().slice(0,60),ret=isoOk(f.returnBy),status=f.status==="ordered"?"ordered":"here";
  if(f.files.length){const urls=f.files.map(x=>x.url);gfPhotos[rid]=urls;write("giftPhotos/"+rid,urls,"set");}
  const lines=[],todo=[];let made=0,bought=0;
  rows.forEach(r=>{const t=String(r.t||"").trim().slice(0,140),p=num(r.p),line={t};if(p!=null)line.p=p;
    if(!r.nog){const fill={status,rcpt:rid};if(p!=null)fill.paid=p;if(store)fill.store=store;if(ret)fill.returnBy=ret;if(ord)fill.orderNo=ord;
      const idea=r.useIdea&&r.idea&&(gfData.items||{})[r.idea];
      if(idea){line.item=r.idea;todo.push(()=>{Object.assign(idea,fill);write("gifts/items/"+r.idea,fill,"update");});bought++;}
      else{const iid=uid()+lines.length,pids=r.pids.slice(),rec=Object.assign({occ:oid,sec:r.sec||"",name:t,ts:Date.now()},fill);if(pids.length)rec.pids=pids;
        const pp=defaultPaper(pids,rec.sec,oid);if(pp)rec.paper=pp;line.item=iid;todo.push(()=>{node("items")[iid]=rec;write("gifts/items/"+iid,rec,"set");});made++;}}
    lines.push(line);});
  const sum=lines.reduce((a,l)=>a+(l.p||0),0),total=num(f.total)!=null?num(f.total):(lines.some(l=>l.p!=null)?Math.round(sum*100)/100:null);
  const rec={store,iso:isoOk(f.iso)||today(),lines,photoCount:f.files.length,occ:oid,ts:Date.now()};if(total!=null)rec.total=total;if(ord)rec.orderNo=ord;if(ret)rec.returnBy=ret;
  node("receipts")[rid]=rec;write("gifts/receipts/"+rid,rec,"set");todo.forEach(fn=>fn());
  log("🧾 Receipt: "+(store||"a store")+(total!=null?" "+money(total):"")+(made?" · "+made+" new present"+(made===1?"":"s"):"")+(bought?" · "+bought+" idea"+(bought===1?"":"s")+" bought":""));
  gfView="receipts";gfRcOpen=rid;return true;
}
function rcpts(oid){
  const R=gfData.receipts||{},I=gfData.items||{},t=today(),open=r=>r.returnBy&&r.returnBy>=t;
  return Object.keys(R).map(id=>Object.assign({id},R[id])).filter(r=>r.occ===oid||(r.lines||[]).some(l=>l&&l.item&&I[l.item]&&I[l.item].occ===oid))
    .sort((a,b)=>(open(b)?1:0)-(open(a)?1:0)||(open(a)?String(a.returnBy).localeCompare(String(b.returnBy)):String(b.iso||"").localeCompare(String(a.iso||"")))||(b.ts||0)-(a.ts||0));
}
function retChip(iso,label){if(!iso)return "";const t=today();if(iso<t)return '<span style="color:#94a3b8">⏰ return window closed</span>';
  const d=Math.round((new Date(iso+"T12:00:00")-new Date(t+"T12:00:00"))/864e5);return d<=7?chip("⏰ "+(label||"return by")+" "+shortDate(iso)+(d===0?" — today":" — "+d+" day"+(d===1?"":"s")),"#d97706"):'<span>⏰ '+esc((label||"return by")+" "+shortDate(iso))+'</span>';}
function rcptChip(it){if(!it.rcpt)return "";return '<span>🧾 receipt</span>'+(it.returnBy&&live(it)&&it.status!=="given"?retChip(it.returnBy):"");}
function gfRcptToggle(rid){
  gfRcOpen=gfRcOpen===rid?null:rid;const r=(gfData.receipts||{})[rid];
  if(gfRcOpen&&r&&r.photoCount&&!gfPhotos[rid]){
    if(typeof db==="undefined"||!db)gfPhotos[rid]="err";
    else{gfPhotos[rid]="loading";db.ref("giftPhotos/"+rid).once("value").then(s=>{gfPhotos[rid]=[].concat(s.val()||[]).filter(Boolean);if(!gfEdit)gfDraw();}).catch(()=>{gfPhotos[rid]="err";if(!gfEdit)gfDraw();});}
  }
  gfDraw();
}
function gfRcptPdf(rid,i){const u=(gfPhotos[rid]||[])[i];if(!u)return;try{fetch(u).then(r=>r.blob()).then(b=>{window.open(URL.createObjectURL(b),"_blank");});}catch(e){}}
function rcptPhotos(r){
  const P=gfPhotos[r.id];if(!r.photoCount)return '<div class="gf-sub" style="margin:4px 0">No photos — typed in by hand.</div>';
  if(P==="loading"||!P)return '<div class="gf-sub" style="margin:4px 0">Loading '+r.photoCount+' photo'+(r.photoCount===1?'':'s')+'…</div>';
  if(P==="err"||!P.length)return '<div class="gf-sub" style="margin:4px 0">The photos couldn\'t load right now.</div>';
  return '<div class="gf-rcbig">'+P.map((u,i)=>/^data:application\/pdf/.test(u)?'<button class="gf-tool" onclick="gfRcptPdf(\''+esc(r.id)+'\','+i+')">📄 Open the PDF</button>':'<img src="'+esc(u)+'">').join("")+'</div>';
}
function rcptView(o){
  const L=rcpts(o.id),I=gfData.items||{};
  let h=intro("Every receipt for "+esc(o.name)+" — the ones whose return window closes soonest on top. Tap one for its photos and lines.");
  h+='<div class="gf-acts" style="margin-bottom:10px"><button class="gf-tool gf-save" onclick="gfRcptNew()">📸 Add a receipt</button></div>';
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">No receipts yet. Snap one (or pick an Amazon order PDF) and Claude fills in what you paid.</div></div>';
  L.forEach(r=>{const on=gfRcOpen===r.id,its=(r.lines||[]).map(l=>l&&l.item&&I[l.item]).filter(Boolean);
    h+='<div class="gf-card"><button class="gf-prow" style="border:none;padding:10px 14px" onclick="gfRcptToggle(\''+esc(r.id)+'\')"><span style="font-size:20px">🧾</span><span class="gf-pn">'+esc(r.store||"Receipt")+
      '<span class="gf-pc">'+esc(shortDate(r.iso))+(r.orderNo?' · #'+esc(r.orderNo):'')+' · '+(its.length?its.map(it=>esc(it.name)).join(", "):'no presents')+'</span><span class="gf-im" style="margin-top:2px">'+retChip(r.returnBy)+'</span></span>'+
      '<span class="gf-amt">'+(r.total!=null?money(r.total):'—')+'</span></button>';
    if(on){h+='<div class="gf-bd">'+rcptPhotos(r)+(r.lines||[]).map(l=>{const it=l&&l.item&&I[l.item];if(!l)return "";
        const where=it?(pidsOf(it).length?names(pidsOf(it)):"🗄 no one yet")+(((o.secs||{})[it.sec]||{}).name?" · "+((o.secs||{})[it.sec].emoji||"")+" "+o.secs[it.sec].name:""):(l.item?"present deleted":"✕ not a gift");
        return '<div class="gf-rcline">'+(it?'<button class="gf-ib" onclick="gfEditItem(\''+esc(l.item)+'\')"><b>'+esc(l.t)+'</b>':'<span style="flex:1;color:#94a3b8">'+esc(l.t))+'<span class="gf-pc">'+esc(where)+'</span>'+(it?'</button>':'</span>')+'<span class="gf-amt">'+(l.p!=null?money(l.p):'')+'</span></div>';}).join("")+'</div>';}
    h+='</div>';});
  return h;
}
const RC_CSS=`
.gf-rcph{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.gf-rcth{position:relative;width:64px;height:64px;border-radius:9px;overflow:hidden;border:1.5px solid var(--border)}
.gf-rcth img{width:100%;height:100%;object-fit:cover;display:block}
.gf-rcth button{position:absolute;top:2px;right:2px;border:none;border-radius:99px;width:20px;height:20px;font-size:10px;background:rgba(15,23,42,.7);color:#fff;cursor:pointer;padding:0}
.gf-rcpdf{display:flex;align-items:center;justify-content:center;height:100%;font-size:12px;font-weight:800;color:#b91c1c;background:#fef2f2}
.gf-rcadd{display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:9px;border:1.5px dashed #94a3b8;font-size:13px;font-weight:800;color:#334155;cursor:pointer;background:#f8fafc}
.gf-rcrow{grid-column:1/-1;border:1.5px solid var(--border);border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px;min-width:0}
.gf-rcrow.nog{opacity:.6;background:#f8fafc}
.gf-rcrow .gf-in{min-width:0}
.gf-rcrow .gf-tick{border-top:none;padding:2px 0}
.gf-rcrow .gf-tick.on span:last-child{color:#0f172a;text-decoration:none}
.gf-rcbig{display:flex;flex-direction:column;gap:8px;margin:4px 0 8px}
.gf-rcbig img{width:100%;border-radius:8px;border:1px solid #e2e8f0}
.gf-rcline{display:flex;align-items:center;gap:8px;border-top:1px solid #f1f5f9;padding:7px 0;font-size:13px}
.gf-rcline .gf-pc{display:block;font-weight:500;font-size:11.5px;color:#64748b}
`;
Object.assign(window,{gfRcptNew,gfRcptPick,gfRcptDrop,gfRcptRead,gfRcSet,gfRcPid,gfRcNone,gfRcNog,gfRcSec,gfRcUseIdea,gfRcIdea,gfRcAdd,gfRcDel,gfRcStatus,gfRcptToggle,gfRcptPdf});
const RC_TEST={prompt:RC_PROMPT,firstJson,matchIdea,ideas,rcpts,photos:gfPhotos,open:()=>gfRcOpen,addFile:(url,pdf)=>{const f=rcF();if(f)f.files.push({url,pdf:!!pdf});}};
// GIFTS_RCPT_END

// GIFTS_OCC_START — any occasion + history + birthdays, slice 6 (her ask 2026-11-20: "being able to pick other things besides
// Christmas, like birthdays"; plan §3.2 "old occasions are kept (closed), never deleted — that is how 'what did we give Grandma last
// year?' works" + §4 slice 6 "a person's birthday → 'Lucy turns 9 in 30 days — start her list?'; close an occasion; 'last year'
// strip on each person; sizes").
//   · A birthday is about ONE person: gifts/occasions/<oid>.for = <pid>, picked with the person chips when it's made (the name fills
//     in "<name>'s birthday <year>" and the date from their birthday, next one coming). Its People view puts that person first and
//     open — presents, budget, ＋ Present — and folds everyone else under "Others giving or getting" (closed until she opens it).
//   · 🎂 nudge at the top of Gifts: a person whose birthday is within 30 days and who has no occasion for it yet. NOTHING is written
//     until she taps it; the tap = ONE set of the birthday occasion (with for). Age only when the birth year is known.
//   · 🕰 Last time on a person's page: their presents from earlier occasions of the same kind (and their last birthday), newest
//     first, 8 at most — read-only.
//   · gifts/people/<pid>.sizes — saved in the person's ONE update, shown on their page.
//   · 📜 Past lists each closed occasion with what was paid and how many presents; reopening = ✏️, untick Done.
const OCC_DAYS=30, OCC_PAST_MAX=8;
let gfOthersOpen=null;   // the birthday occasion whose "Others giving or getting" is unfolded (closed by default)
function pad2(n){return String(n).padStart(2,"0");}
function bdayOn(m,d,y){if(m===2&&d===29&&!(y%4===0&&(y%100!==0||y%400===0)))d=28;return y+"-"+pad2(m)+"-"+pad2(d);}
function nextBday(b,from){   // "YYYY-MM-DD" (or "--MM-DD" / "MM-DD" with no year) → the next one on or after `from`
  const m=/^(?:(\d{4})-|--)?(\d{1,2})-(\d{1,2})$/.exec(String(b||"").trim());if(!m)return null;
  const mo=+m[2],da=+m[3];if(mo<1||mo>12||da<1||da>31)return null;from=from||today();
  let y=+from.slice(0,4),iso=bdayOn(mo,da,y);if(iso<from)iso=bdayOn(mo,da,++y);
  const by=m[1]?+m[1]:0,age=by>=1900&&y-by>=1?y-by:null;
  return {iso,year:y,age,days:Math.round((new Date(iso+"T12:00:00")-new Date(from+"T12:00:00"))/864e5)};
}
function bdayName(p,year){return String((p&&p.name)||"").trim()+"'s birthday "+year;}
function bdayOcc(pid,iso){const t=today();return occs().find(o=>o.kind==="birthday"&&o.for===pid&&(o.date===iso||(!o.closed&&String(o.date||"")>=t)))||null;}
function nudges(){
  return people().filter(p=>p.birthday).map(p=>({p,nb:nextBday(p.birthday)})).filter(x=>x.nb&&x.nb.days<=OCC_DAYS&&!bdayOcc(x.p.id,x.nb.iso))
    .sort((a,b)=>a.nb.days-b.nb.days||String(a.p.name).localeCompare(String(b.p.name)));
}
function whenTxt(d){return d===0?"today":d===1?"tomorrow":"in "+d+" days";}
function bdayNudges(){
  return nudges().map(x=>{const p=x.p,nb=x.nb;
    return '<div class="gf-card gf-nudge"><button class="gf-prow" onclick="gfBdayStart(\''+esc(p.id)+'\')"><span style="font-size:22px">🎂</span><span class="gf-pn">'+
      esc(p.name)+(nb.age!=null?' turns '+nb.age:"'s birthday is")+' on '+esc(shortDate(nb.iso))+' — start their list?<span class="gf-pc">'+whenTxt(nb.days)+' · one tap makes '+esc(bdayName(p,nb.year))+'</span></span>'+
      '<span class="gf-tool">Start</span></button></div>';}).join("");
}
function gfBdayStart(pid){
  const p=person(pid),nb=p&&nextBday(p.birthday);if(!nb)return;
  const have=bdayOcc(pid,nb.iso);if(have)return gfPickOcc(have.id);
  gfStartOcc("birthday",bdayName(p,nb.year),nb.iso,{for:pid});
}
function occExtra(f){const x={},b=num(f.budget);if(f.kind==="birthday"&&f.for)x.for=f.for;if(b!=null)x.budget=b;return x;}
function occAuto(f){   // a new birthday with its person picked: name + date fill in until she types her own
  if(f.id||f.kind!=="birthday"||!f.for)return;const p=person(f.for);if(!p)return;
  const nb=nextBday(p.birthday);if(nb&&(f.autoDate||!f.date)){f.date=nb.iso;f.autoDate=true;}
  if(f.autoName||!f.name){f.name=bdayName(p,(f.date||today()).slice(0,4));f.autoName=true;}
}
function occForPicker(f){
  if(f.kind!=="birthday")return "";
  return '<div class="gf-f wide"><span>Whose birthday?</span><div class="gf-picks">'+people().map(p=>{const on=f.for===p.id;
    return '<button class="gf-pick'+(on?" on":"")+'" style="'+(on?"background:"+esc(p.color||"#0f172a")+";border-color:"+esc(p.color||"#0f172a"):"")+'" onclick="gfOccFor(\''+esc(p.id)+'\')">'+esc(p.name)+(p.birthday?' 🎂':'')+'</button>';}).join("")+'</div></div>';
}
function gfOccFor(pid){if(!gfEdit||gfEdit.kind!=="occ")return;const f=gfEdit.form;f.for=f.for===pid?null:pid;occAuto(f);gfDraw();}
function occStar(o){return o&&o.kind==="birthday"&&o.for&&people().some(p=>p.id===o.for)?o.for:null;}
function starCard(o,pid){
  const p=person(pid),T=personTot(o.id,pid),S=secsOf(o),ord=s=>{const i=S.findIndex(x=>x.id===s);return i<0?99:i;};
  const mine=items(o.id).filter(it=>pidsOf(it).indexOf(pid)>=0).sort((a,b)=>ord(a.sec)-ord(b.sec)||(a.ts||0)-(b.ts||0));
  const nb=nextBday(p.birthday,o.date||today());
  let h='<div class="gf-card"><div class="gf-hd" style="background:'+esc(p.color||"#475569")+'"><span>🎂 '+esc(p.name)+(nb&&nb.age!=null&&nb.iso===o.date?' · turns '+nb.age:'')+'</span>'+
    '<button class="gf-tool gf-hdb" onclick="gfOpenPerson(\''+esc(pid)+'\')">Their page →</button></div><div class="gf-bd">'+bar(T)+'<div class="gf-line">'+sumLine(T)+'</div>'+
    (p.sizes?'<div class="gf-line">👕 '+esc(p.sizes)+'</div>':'')+
    '<div class="gf-acts" style="margin:6px 0 8px"><button class="gf-tool" onclick="gfNewItem(\''+esc(pid)+'\','+(S[0]?'\''+esc(S[0].id)+'\'':'null')+')">＋ Present</button><button class="gf-tool" onclick="gfBudget(\''+esc(pid)+'\')">💲 Budget</button></div>';
  h+=mine.length?mine.map(it=>itemRow(it,pid)).join(""):'<div class="gf-empty">Nothing on their list yet.</div>';
  return h+'</div></div>';
}
function othersBtn(o,pid){
  const n=items(o.id).filter(it=>pidsOf(it).some(x=>x!==pid)).length,on=gfOthersOpen===o.id;
  return '<button class="gf-tool gf-others" onclick="gfOthers()">'+(on?'▾':'▸')+' Others giving or getting'+(n?' · '+n+' present'+(n===1?'':'s'):'')+'</button>';
}
function gfOthers(){const oid=curOcc();gfOthersOpen=gfOthersOpen===oid?null:oid;gfDraw();}
function pastGifts(o,pid){   // their presents from earlier occasions of the same kind + their last birthday, newest first
  const t=today(),d=String(o.date||t),ref=d<t?d:t,before=x=>x&&x.id!==o.id&&String(x.date||"")<ref;   // already happened: before this occasion AND before today
  const lastB=occs().filter(x=>before(x)&&x.kind==="birthday"&&x.for===pid).pop();
  const O={};occs().forEach(x=>{if(before(x)&&(x.kind===o.kind||(lastB&&x.id===lastB.id)))O[x.id]=x;});
  return items().filter(it=>O[it.occ]&&pidsOf(it).indexOf(pid)>=0&&["idea","dropped"].indexOf(it.status||"idea")<0)
    .sort((a,b)=>String(O[b.occ].date||"").localeCompare(String(O[a.occ].date||""))||(b.ts||0)-(a.ts||0)).slice(0,OCC_PAST_MAX)
    .map(it=>({id:it.id,name:it.name,paid:num(it.paid),status:it.status||"idea",occ:O[it.occ].name,shared:pidsOf(it).length>1}));
}
function lastTime(o,pid){
  const L=pastGifts(o,pid);if(!L.length)return "";
  return '<div class="gf-card"><div class="gf-ghd"><span>🕰 Last time</span><span class="gf-gsum">'+L.length+'</span></div><div class="gf-bd">'+L.map(r=>{const s=st(r.status);
    return '<div class="gf-past"><span class="gf-pn">'+esc(r.name)+'<span class="gf-pc">'+esc(r.occ)+(r.shared?' · 🤝 shared':'')+' · '+esc(s[1])+'</span></span><span class="gf-amt">'+(r.paid!=null?money(r.paid):'—')+'</span></div>';}).join("")+'</div></div>';
}
function pastLabel(o){const T=occTot(o.id);return o.name+" — "+money(T.paid)+" paid · "+T.count+" present"+(T.count===1?"":"s");}
const OCC_CSS=`
.gf-nudge{border:2px solid #f9a8d4;box-shadow:none}
.gf-nudge .gf-prow{border-top:none;padding:10px 12px}
.gf-nudge .gf-tool{background:#be185d;color:#fff;border-color:#be185d}
.gf-others{display:block;width:100%;text-align:left;margin:0 0 10px;padding:9px 12px;color:#475569}
.gf-past{display:flex;align-items:center;gap:8px;border-top:1px solid #f1f5f9;padding:7px 0}
.gf-past .gf-pn{font-size:13px;font-weight:700}
`;
Object.assign(window,{gfBdayStart,gfOccFor,gfOthers});
const OCC_TEST={nextBday,nudges,pastGifts,occStar,bdayName,pastLabel,othersOpen:()=>gfOthersOpen};
// GIFTS_OCC_END

function gfDraw(){
  if(!gfRoot)return;
  let body;
  if(!gfLoaded)body='<div class="gf-empty" style="padding:40px">Loading presents…</div>';
  else{const oid=curOcc(),o=oid&&occ(oid);
    const V={even:evenView,wrap:wrapView,where:whereView,coming:comingView,shop:shopView,closet:closetView,eve:eveView,receipts:rcptView};
    body=(!o||gfView==="people"?bdayNudges():"")+   // GIFTS_OCC: 🎂 at the top of Gifts
      (o?occBar()+viewNav()+(gfView==="person"&&gfPid?personView(o,gfPid):V[gfView]?V[gfView](o):peopleView(o)):emptyView());}
  gfRoot.innerHTML=gfAh+'<div class="gf-wrap"><div class="gf-title">🎁 Gifts</div>'+body+'</div>'+selBar()+sheet();
}
function gfListen(){
  if(gfOn)return;gfOn=true;
  if(typeof db==="undefined"||!db){gfLoaded=true;return;}
  db.ref("gifts").on("value",s=>{gfData=s.val()||{};gfLoaded=true;try{if(typeof tab!=="undefined"&&tab==="moms-plan"&&typeof mpSubView!=="undefined"&&mpSubView==="gifts"&&!gfEdit)gfDraw();}catch(e){}});
}
const GF_CSS=`
.gf-wrap{padding:10px 12px 40px;max-width:760px;margin:0 auto;font-family:'DM Sans',sans-serif}
.gf-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin:8px 0 6px}
.gf-h2{font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin:4px 0}
.gf-sub{font-size:12.5px;color:var(--muted);line-height:1.45;margin:4px 0 12px}
.gf-occs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.gf-occ{padding:7px 12px;border-radius:99px;border:1.5px solid var(--border);background:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;color:#475569}
.gf-occ.on{background:#2B7A78;color:#fff;border-color:#2B7A78}
.gf-sel{padding:6px 8px;border:1.5px solid var(--border);border-radius:99px;background:#fff;font-size:12px;font-family:inherit}
.gf-card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(43,122,120,.13);overflow:hidden;margin-bottom:10px}
.gf-start{text-align:center;padding:22px 18px}
.gf-big{border:none;background:#b91c1c;color:#fff;border-radius:12px;padding:12px 22px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit}
.gf-hd{display:flex;align-items:center;gap:8px;padding:10px 14px;color:#fff;font-weight:800;font-size:14px;background:#b91c1c}
.gf-hdb{margin-left:auto;background:rgba(255,255,255,.9)!important}
.gf-days{font-size:11.5px;font-weight:700;opacity:.9}
.gf-bd{padding:8px 14px 12px}
.gf-line{font-size:12.5px;margin-top:5px;line-height:1.4}
.gf-ghd{display:flex;align-items:center;gap:8px;padding:10px 14px 4px;font-weight:800;font-size:13.5px}
.gf-gsum{margin-left:auto;font-size:12.5px;color:#475569}
.gf-bar{display:flex;height:7px;border-radius:99px;background:#f1f5f9;overflow:hidden;margin:6px 0 2px}
.gf-bar i{display:block;height:100%}
.gf-prow{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#fff;border:none;border-top:1px solid #f1f5f9;padding:9px 0;cursor:pointer;font:inherit;color:inherit}
.gf-dot{width:12px;height:12px;border-radius:50%;flex:none}
.gf-pn{flex:1;min-width:0;font-weight:800;font-size:13.5px}
.gf-pc{display:block;font-weight:500;font-size:11.5px;color:#64748b}
.gf-amt{font-weight:800;font-size:13.5px;white-space:nowrap;text-align:right}
.gf-amt small{font-weight:600;color:#64748b;font-size:11px}
.gf-item{display:flex;gap:8px;align-items:center;border:1.5px solid var(--border);border-radius:10px;padding:7px 8px;margin-bottom:6px}
.gf-item.dead{opacity:.55}
.gf-ib{flex:1;min-width:0;text-align:left;background:none;border:none;padding:0;cursor:pointer;font:inherit;color:inherit}
.gf-ia{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.gf-it{font-size:13px;line-height:1.3}
.gf-im{display:flex;flex-wrap:wrap;gap:4px 8px;margin-top:4px;font-size:11px;color:#475569;align-items:center}
.gf-chip{font-size:10px;font-weight:700;border:1px solid;border-radius:99px;padding:1px 7px;white-space:nowrap}
.gf-tool{border:1.5px solid var(--border);background:#fff;border-radius:9px;padding:5px 10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;color:#0f172a}
.gf-mini{padding:3px 8px;font-size:13px}
.gf-save{background:#111827;color:#fff;border-color:#111827;padding:8px 16px}
.gf-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.gf-empty{padding:10px;text-align:center;color:var(--muted);font-size:12.5px}
#gf-sheet{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:300;display:flex;align-items:flex-end;justify-content:center}
.gf-sh{position:relative;background:#fff;width:100%;max-width:640px;max-height:90vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 16px 28px;box-sizing:border-box;font-family:'DM Sans',sans-serif}
.gf-x{position:absolute;right:12px;top:10px;border:none;background:var(--bg);border-radius:99px;width:32px;height:32px;font-size:15px;cursor:pointer}
.gf-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px 10px}
.gf-f{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:var(--muted)}
.gf-f.wide,.gf-sub.wide{grid-column:1/-1}
.gf-f input,.gf-f select,.gf-f textarea{font:inherit;font-size:14px;font-weight:500;color:#0f172a;padding:8px 9px;border:1.5px solid var(--border);border-radius:9px;background:#fff;font-family:inherit;width:100%;box-sizing:border-box}
.gf-picks{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px}
.gf-pick{border:1.5px solid var(--border);background:#fff;border-radius:99px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#334155}
.gf-pick.on{background:#0f172a;color:#fff;border-color:#0f172a}
.gf-views{display:flex;flex-wrap:wrap;gap:5px;margin:-2px 0 10px}
.gf-vw{padding:6px 10px;border-radius:99px;border:1.5px solid transparent;background:none;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;color:#6b7280}
.gf-vw.on{background:#DEF2F1;border-color:#2B7A78;color:#1f5e5c}
.gf-vw.sel{margin-left:auto;border-color:var(--border);background:#fff;color:#0f172a}
.gf-vw.add{border-color:var(--border);background:#fff;color:#0f172a}
.gf-vw.sel.on{background:#0f172a;color:#fff;border-color:#0f172a}
.gf-even{width:100%;border-collapse:collapse;font-size:12.5px}
.gf-even th,.gf-even td{padding:7px 4px;border-bottom:1px solid #f1f5f9;text-align:center;white-space:nowrap}
.gf-even th:first-child{text-align:left;font-weight:700;color:#475569;white-space:normal;min-width:64px;max-width:92px;font-size:11.5px;padding-left:10px}
.gf-even td span{color:#64748b;font-size:11px}
.gf-even tr.gf-tot td,.gf-even tr.gf-tot th{background:#f8fafc}
.gf-even td.gf-behind{background:#fef3c7;color:#92400e}
.gf-box{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:2px solid #94a3b8;border-radius:6px;margin-right:8px;flex:none;font-weight:900;color:#fff;vertical-align:middle}
.gf-item.picked{border-color:#0f172a;background:#f8fafc}
.gf-item.picked .gf-box,.gf-tick.on .gf-box{background:#16a34a;border-color:#16a34a}
.gf-ib .gf-box{float:left;margin-top:2px}
.gf-tick{display:flex;align-items:flex-start;gap:2px;width:100%;text-align:left;background:none;border:none;border-top:1px solid #f1f5f9;padding:8px 0;cursor:pointer;font:inherit;font-size:13px;color:inherit;line-height:1.35}
.gf-tick.on span:last-child{color:#94a3b8;text-decoration:line-through}
.gf-spot{font-weight:800;font-size:12.5px;color:#0f172a;margin:10px 0 2px}
.gf-in{flex:1;padding:8px 10px;border:1.5px solid var(--border);border-radius:9px;font-size:14px;font-family:inherit}
.gf-selbar{position:fixed;left:0;right:0;bottom:0;z-index:250;background:#0f172a;color:#fff;padding:10px 12px calc(10px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px}
.gf-selbar .gf-pick{background:#fff}
`;
window.renderGifts=function(el,ah){
  if(typeof momHere==="function"&&!momHere()){el.innerHTML=(ah||"")+'<div class="gf-empty" style="padding:40px">🔒 Mom only.</div>';return;}   // the presents are a secret: no data loads without Mom
  if(!document.getElementById("gf-style")){const s=document.createElement("style");s.id="gf-style";s.textContent=GF_CSS+RC_CSS+OCC_CSS;document.head.appendChild(s);}
  gfRoot=el;gfAh=ah||"";gfListen();gfDraw();
};
Object.assign(window,{gfGo,gfSelToggle,gfPick,gfBulk,gfBulkIds,gfGather,gfEveTick,gfLineAdd,gfLineTick,gfLineDel,gfLinesCopy,gfEvenEdit,gfNeed,gfStartOcc,gfPickOcc,gfOpenPerson,gfBack,gfNewItem,gfEditItem,gfMove,gfSet,gfSetDraw,gfTogglePid,gfSecBudget,gfSecEdit,gfSecAdd,gfCancel,gfSave,gfDelete,gfNext,gfNewPerson,gfEditPerson,gfBudget,gfGroupBudget,gfNewGroup,gfNewOcc,gfOccEdit});
window._gfTest={evenData,behind,evenSet,sel:()=>gfSel,selOn:()=>gfSelOn,data:()=>gfData,setData:d=>{gfData=d||{};gfLoaded=true;},people,groups,occs,secsOf,items,personTot,groupTot,occTot,left,share,curOcc,
  setOcc:o=>{gfOcc=o;},view:()=>gfView,edit:()=>gfEdit,draw:gfDraw,setRoot:(el,ah)=>{gfRoot=el;gfAh=ah||"";},reset:()=>{gfOcc=null;gfView="people";gfPid=null;gfEdit=null;gfRcOpen=null;gfOthersOpen=null;},rc:RC_TEST,oc:OCC_TEST};
})();
