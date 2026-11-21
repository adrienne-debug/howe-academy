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
// GIFTS_DAD (👨 Dad sharing, her answer "dad can too if given permission from mom and that can be per person per holiday", plan §5.1)
//   — see GIFTS_DAD_START: gifts/share/<oid>/<pid> = "look"|"edit" (absent = off) · gifts/people/<pid>.isDad · giftShare/<oid> = true
//   (own top node, no names — all Dad's Day reads before his code). The ONE other way this file's data loads: Dad's Day ▸ 🎁 Gifts,
//   after Dad's code is typed that visit (window.renderGiftsDad) — only what Mom shared is ever drawn there.
// GIFTS slice 5 (⏰ reminders, plan §3.6) — see GIFTS_REMIND_START: computed lines at the top of Gifts and in Home Base's 🔴 NOW
//   (window.giftNowLines — Mom only, never a present's name). gifts/occasions/<oid>.orderBy = her "order the last presents by" date.
// GIFTS_GROUPS (her ask + "yes" 2026-11-20) — see GIFTS_GROUPS_START: 👧 Kids · <each group> buttons on People (always opens on Kids);
//   gifts/groups/<gid>/secs/<sid> {name, emoji, order}  a group's OWN sections, kept across occasions (none = one 🎁 Gifts, unsaved);
//   the kids keep the occasion's sections. Section choices follow the (first) person's group.
// Totals are COMPUTED here, never stored (the esa.js rule). A gift for several people splits its cost evenly between them and
// counts once for each (🤝). Every write = one set/update/remove of ONE record (+ a log line). Nothing here touches schedules.
(function(){
"use strict";
let gfShF="all", gfShN=0, gfShKey="", gfData={}, gfOn=false, gfLoaded=false, gfOcc=null, gfView="people", gfPid=null, gfEdit=null, gfRoot=null, gfAh="", gfSelOn=false, gfSel={};
const GF_STATUS=[["idea","💭 Idea","#64748b"],["ordered","🛒 Ordered","#d97706"],["here","📦 Here","#0f766e"],["wrapped","🎀 Wrapped","#be185d"],["out","🎄 Under the tree","#15803d"],["packed","🚗 Packed","#0369a1"],["given","✅ Given","#16a34a"],["returned","↩ Returned","#7c3aed"],["dropped","✕ Dropped","#94a3b8"]];
const GF_NEXT={idea:"ordered",ordered:"here",here:"wrapped",wrapped:"given",out:"given",packed:"given"};
function nextOf(it){const s=it.status||"idea";if(s==="wrapped")return atHome(it)?"out":"packed";return GF_NEXT[s];}   // JOURNEY: wrapped → 🎄 under the tree (home) or 🚗 packed (somewhere else) → ✅ given
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
function share(it,pid){const P=pidsOf(it);if(P.indexOf(pid)<0)return 0;   // SPLIT: her own split when she set one, else even
  const sp=it.split;if(sp&&typeof sp==="object"){const tot=P.reduce((a,x)=>a+(+sp[x]>0?+sp[x]:0),0);if(tot>0)return (+sp[pid]>0?+sp[pid]:0)/tot;}
  return 1/P.length;}
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
    dadSeesLine(o)+   // GIFTS_DAD: 👨 Dad sees: …
    (o.closed?'<div class="gf-line" style="color:#64748b">📜 Past — ✏️ and untick Done to reopen it.</div>':'')+'</div></div>';   // GIFTS_OCC
}
function daysTo(iso){const a=new Date(today()+"T12:00:00"),b=new Date(String(iso)+"T12:00:00");const d=Math.round((b-a)/864e5);return isNaN(d)?"":d>1?d+" days to go":d===1?"tomorrow":d===0?"today":"";}
function peopleView(o){
  let h=occHead(o)+stashCard(o);   // STASH: presents on hold, offered to this holiday
  const star=occStar(o);   // GIFTS_OCC: a birthday's person first and open; everyone else folds under "Others giving or getting"
  if(star)h+=starCard(o,star)+othersBtn(o,star);
  const P=people().filter(p=>p.id!==star);
  if(!star||gfOthersOpen===o.id)h+=grpBar();   // GIFTS_GROUPS: 👧 Kids · each group · ＋ Group
  if(!star||gfOthersOpen===o.id)groups().filter(g=>g.id===curGrp()).forEach(g=>{   // GIFTS_GROUPS: only the group she picked
    const ps=P.filter(p=>(p.group||"other")===g.id);if(!ps.length)return;
    const T=groupTot(o.id,g.id);
    h+='<div class="gf-card"><div class="gf-ghd"><span>'+esc(g.emoji||"")+' '+esc(g.name)+'</span><span class="gf-gsum">'+money(T.paid)+(T.budget!=null?' / '+money(T.budget):'')+'</span>'+
      '<button class="gf-tool" onclick="gfGroupBudget(\''+esc(g.id)+'\')">💲</button></div>'+(T.budget!=null?'<div style="padding:0 14px">'+bar(T)+'</div>':'')+grpSecLine(g)+dadGroupRow(o,g)+'<div class="gf-bd">';   // GIFTS_GROUPS · GIFTS_DAD: 👨 share the whole group
    ps.forEach(p=>{const PT=personTot(o.id,p.id);
      h+='<button class="gf-prow" onclick="gfOpenPerson(\''+esc(p.id)+'\')"><span class="gf-dot" style="background:'+esc(p.color||"#94a3b8")+'"></span>'+
        '<span class="gf-pn">'+esc(p.name)+'<span class="gf-pc">'+(PT.count?PT.count+' present'+(PT.count===1?'':'s')+(PT.shared?' · 👤 '+(PT.count-PT.shared)+' own · 🤝 '+PT.shared+' shared':'')+' · '+counts(PT):'nothing yet')+'</span>'+bar(PT)+'</span>'+
        '<span class="gf-amt">'+money(PT.paid)+(PT.budget!=null?'<small> / '+money(PT.budget)+'</small>':'')+'</span></button>';});
    h+='</div></div>';
  });
  const nobody=items(o.id).filter(it=>!pidsOf(it).length);
  if(nobody.length)h+='<div class="gf-card"><div class="gf-ghd"><span>💭 Not for anyone yet</span></div><div class="gf-bd">'+nobody.map(it=>itemRow(it,null)).join("")+'</div></div>';
  h+='<div class="gf-acts"><button class="gf-tool" onclick="gfNewItem(null,null)">＋ Present</button><button class="gf-tool" onclick="gfNewPerson()">＋ Person</button><button class="gf-tool" onclick="gfTagsToggle()">🏷 Want · need · wear · read: '+(tagsOn()?'on':'off')+'</button></div>';   // GIFTS_GROUPS: ＋ Group is on the group bar · WNWR
  return h;
}
function needsChips(it){const n=it.needs||{};return (n.batt?'<span>🔋 '+esc(n.batt===true?"batteries":n.batt)+'</span>':'')+(n.build?'<span>🔧 assemble</span>':'')+(n.charge?'<span>🔌 charge</span>':'');}
function dueChip(it){if(!it.due||it.status!=="ordered")return "";const late=String(it.due)<today();return late?chip("📦 late — due "+shortDate(it.due),"#dc2626"):'<span>📦 by '+esc(shortDate(it.due))+'</span>';}
function shortDate(iso){const d=new Date(String(iso)+"T12:00:00");return isNaN(d)?String(iso):d.toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function itemRow(it,pid){
  const s=st(it.status),P=pidsOf(it),nm=x=>(person(x)||{}).name||"?";
  const who=pid?(P.length>1?chip("🤝 with "+P.filter(x=>x!==pid).map(nm).join(", "),"#0e7490"):""):(P.length?chip((P.length>1?"🤝 ":"👤 ")+P.map(nm).join(", "),P.length>1?"#0e7490":"#334155"):chip("🗄 no one yet","#64748b"));
  const amt=num(it.paid)!=null?money(num(it.paid)):(num(it.plan)!=null?'<span style="color:#64748b">plan '+money(num(it.plan))+'</span>':'—');
  const nx=nextOf(it),picked=!!gfSel[it.id];
  const onHold=it.occ===GF_HOLD?chip("🗄 on hold","#7c3aed"):"";   // STASH
  return '<div class="gf-item'+(live(it)?'':' dead')+(picked?' picked':'')+'"><button class="gf-ib" onclick="'+(gfSelOn?'gfPick':'gfEditItem')+'(\''+esc(it.id)+'\')">'+(gfSelOn?'<span class="gf-box">'+(picked?'✓':'')+'</span>':'')+'<div class="gf-it"><b>'+esc(it.name)+'</b></div><div class="gf-im">'+chip(s[1],s[2])+onHold+who+
    dueChip(it)+(it.where?'<span>📍 '+esc(it.where)+'</span>':'')+(it.paper?'<span>🎀 '+esc(it.paper)+'</span>':'')+(it.store?'<span>🏬 '+esc(it.store)+'</span>':'')+rcptChip(it)+needsChips(it)+'</div></button>'+
    '<div class="gf-ia"><div class="gf-amt">'+amt+(P.length>1&&pid&&num(it.paid)!=null?'<small> ('+money(Math.round(num(it.paid)*share(it,pid)*100)/100)+(it.split?' their share':' each')+')</small>':'')+kindChip(it)+'</div>'+(gfSelOn?'':'<div style="display:flex;gap:4px">'+
    (nx?'<button class="gf-tool gf-mini" title="Next: '+esc(st(nx)[1])+'" onclick="gfNext(\''+esc(it.id)+'\')">'+st(nx)[1].split(" ")[0]+'</button>':'')+
    '<button class="gf-tool gf-mini" title="Move to…" onclick="gfMove(\''+esc(it.id)+'\')">↪</button></div>')+'</div></div>';
}
function personView(o,pid){
  const p=person(pid);if(!p){gfView="people";return peopleView(o);}
  const T=personTot(o.id,pid),S=secsFor(o,[pid]),mine=items(o.id).filter(it=>pidsOf(it).indexOf(pid)>=0);
  let h='<button class="gf-tool" style="margin-bottom:8px" onclick="gfBack()">← Everyone</button>';
  h+='<div class="gf-card"><div class="gf-hd" style="background:'+esc(p.color||"#475569")+'"><span>'+esc(p.name)+' · '+esc(o.name)+'</span><button class="gf-tool gf-hdb" onclick="gfEditPerson(\''+esc(pid)+'\')">✏️</button></div>'+
    '<div class="gf-bd">'+bar(T)+'<div class="gf-line">'+sumLine(T)+'</div><div class="gf-line" style="color:#475569">'+T.count+' present'+(T.count===1?'':'s')+(T.shared?' · 👤 '+(T.count-T.shared)+' just theirs · 🤝 '+T.shared+' shared':'')+(p.paper?' · 🎀 '+esc(p.paper):'')+'</div>'+
    (p.sizes?'<div class="gf-line">👕 '+esc(p.sizes)+'</div>':'')+   // GIFTS_OCC
    '<div style="margin-top:6px"><button class="gf-tool" onclick="gfBudget(\''+esc(pid)+'\')">💲 Budget</button></div></div></div>';
  h+=dadShareCard(o,pid);   // GIFTS_DAD: 👨 Share with Dad — off · look · edit, this holiday
  h+=lastTime(o,pid);   // GIFTS_OCC: 🕰 what they got before
  h+=wishCard(o,pid);   // GIFTS_WISH: 💌 a kid's own wish list
  h+=kindRow(mine,pid);   // WNWR: the kid's want · need · wear · read · do boxes
  h+=ownSharedRow(mine);   // OWNSHARED: All · Just theirs · Shared (by how many kids)
  const known=S.map(s=>s.id);
  S.concat(mine.some(it=>known.indexOf(it.sec)<0)?[{id:"",emoji:"📦",name:"No section"}]:[]).forEach(s=>{
    const L=mine.filter(it=>(s.id?it.sec===s.id:known.indexOf(it.sec)<0)&&ownSharedPass(it)),ST=s.id?personTot(o.id,pid,s.id):null;
    h+='<div class="gf-card"><div class="gf-ghd"><span>'+esc(s.emoji||"")+' '+esc(s.name)+'</span><span class="gf-gsum">'+(ST?money(ST.paid)+(ST.budget!=null?' / '+money(ST.budget):''):'')+'</span>'+
      (s.id?'<button class="gf-tool" onclick="gfNewItem(\''+esc(pid)+'\',\''+esc(s.id)+'\')">＋</button>':'')+'</div>'+(ST&&ST.budget!=null?'<div style="padding:0 14px">'+bar(ST)+'</div>':'')+
      '<div class="gf-bd">'+(L.length?L.map(it=>itemRow(it,pid)).join(""):'<div class="gf-empty">'+(gfShF==="all"?'Nothing here yet.':'None of these here.')+'</div>')+'</div></div>';
  });
  return h;
}
// OWNSHARED_START (her ask + yes 2026-11-20: "when you … click on the kid, I would like the option to see all those things separated for
// the things that are individual … how many individual items they have as well versus how many group items. And then there should also
// be a filter for like the group items if it has, all 4 kids or if it just has 2 kids"): a kid's page counts 👤 just theirs vs 🤝 shared,
// and filters the list — All · 👤 Just theirs · 🤝 Shared, then by how many kids share it. Opens on All every time (gfOpenPerson);
// display only — the money is unchanged (a kid still carries their share of a shared present).
function ownSharedPass(it){const n=pidsOf(it).length;if(gfShF==="own")return n===1;if(gfShF==="shared")return n>1&&(!gfShN||n===gfShN);return true;}
function ownSharedRow(mine){
  const L=mine.filter(live),own=L.filter(it=>pidsOf(it).length===1).length,sh=L.filter(it=>pidsOf(it).length>1);if(!sh.length)return "";   // nothing shared → no filter
  const b=(on,click,lbl)=>'<button class="gf-vw'+(on?" on":"")+'" onclick="'+click+'">'+lbl+'</button>';
  let h='<div class="gf-views" style="margin:0 0 8px">'+b(gfShF==="all","gfShareSet('all')","All ("+L.length+")")+b(gfShF==="own","gfShareSet('own')","👤 Just theirs ("+own+")")+b(gfShF==="shared","gfShareSet('shared')","🤝 Shared ("+sh.length+")")+'</div>';
  if(gfShF==="shared"){const kidsN=kids().length,by={};sh.forEach(it=>{const n=pidsOf(it).length;by[n]=(by[n]||0)+1;});
    h+='<div class="gf-views" style="margin:-4px 0 10px">'+b(!gfShN,"gfShareSize(0)","All shared")+Object.keys(by).map(Number).sort((a,b)=>b-a).map(n=>b(gfShN===n,"gfShareSize("+n+")",(n===kidsN?"With everyone ("+n+")":n+" kids")+" · "+by[n])).join("")+'</div>';}
  return h;
}
function gfShareSet(f){gfShF=f;gfShN=0;gfDraw();}
function gfShareSize(n){gfShF="shared";gfShN=+n||0;gfDraw();}
// OWNSHARED_END

// ── the Christmas views (slice 2) ─────────────────────────────────────────────
const GF_VIEWS=[["people","👨‍👩‍👧 People"],["even","⚖️ Even"],["wrap","🎀 To wrap"],["where","📍 Where"],["coming","📦 Coming"],["shop","🛍 Shop"],["closet","🗄 Stash"],["going","🚗 Going"],["eve","🌙 Eve"],["receipts","🧾 Receipts"]];
const GF_SELECTABLE=["person","wrap","where","coming","shop","closet","going"];
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
  const L=items(o.id).filter(it=>it.status==="here"||it.status==="ordered");   // JOURNEY: everything bought and not wrapped (🛒 ones not here yet)
  let h=intro("Everything bought and not wrapped yet, grouped by paper — one roll out at a time. 🛒 Ordered ones aren't here yet.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Nothing waiting to be wrapped. 🎀</div></div>';
  groupBy(L,it=>it.paper,"No paper picked yet").forEach(g=>{
    const here=g.items.filter(it=>it.status==="here");
    h+=listCard("🎀 "+esc(g.label),g.items.length+" to wrap",g.items,here.length?'<button class="gf-tool" onclick="gfBulkIds(\''+here.map(it=>it.id).join(",")+'\',\'wrapped\')">'+(here.length===g.items.length?'All wrapped':here.length+' here — wrapped')+'</button>':'');});
  return h;
}
function whereView(o){
  const L=items(o.id).filter(it=>live(it)&&it.status!=="given"&&it.status!=="idea").concat(held().filter(it=>it.status!=="idea"));   // STASH: held presents are still in the house
  let h=intro("Every present in the house, by where it's hidden — and the ones under the tree or packed to go.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Nothing in the house yet.</div></div>';
  // JOURNEY: 📍 needs a spot first (here or wrapped, no spot yet) — ☑ Select several, then 📍 Put in…
  const spotOf=it=>it.status==="out"?"\u0001🎄 Under the tree":it.status==="packed"?"\u0001🚗 Packed for "+(giveAt(it)||"somewhere"):(it.where||"");
  const need=L.filter(it=>!spotOf(it)&&it.status!=="ordered"),notYet=L.filter(it=>!spotOf(it)&&it.status==="ordered"),rest=L.filter(it=>spotOf(it));
  if(need.length)h+=listCard('<span style="color:#b45309">📍 Needs a spot</span>',need.length+"",need,gfSelOn?'':'<button class="gf-tool" onclick="gfSpotPick(\''+need.map(it=>it.id).join(",")+'\')">📍 Put in…</button>');
  groupBy(rest,spotOf,"").forEach(g=>{const lbl=String(g.label).replace(/^\u0001/,"");h+=listCard((/^\u0001/.test(g.label)?"":"📍 ")+esc(lbl),g.items.length+"",g.items);});
  if(notYet.length)h+=listCard("📦 Not here yet",notYet.length+"",notYet);
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
function closetView(o){
  const H=held();   // STASH: on hold for a future holiday
  let hh="";
  if(H.length){hh+=intro("🗄 On hold for a future holiday — bought already, waiting for its day. Bring one into "+esc((o&&o.name)||"this holiday")+" and give it a person and section.");
    hh+='<div class="gf-acts" style="margin-bottom:8px"><button class="gf-tool gf-save" onclick="gfBringIn(\''+H.map(it=>it.id).join(",")+'\')">Bring all '+H.length+' into '+esc((o&&o.name)||"this holiday")+'</button></div>';
    hh+='<div class="gf-card"><div class="gf-ghd"><span>🗄 On hold</span><span class="gf-gsum">'+H.length+' · '+money(H.reduce((a,it)=>a+(num(it.paid)||0),0))+' paid</span></div><div class="gf-bd">'+
      H.map(it=>itemRow(it,null).replace('<div class="gf-ia">','<div class="gf-ia"><button class="gf-tool gf-mini" onclick="gfBringIn(\''+esc(it.id)+'\')">Bring in</button>')).join("")+'</div></div>';}
  const L=items().filter(it=>live(it)&&!pidsOf(it).length&&it.occ!==GF_HOLD);
  if(!L.length&&H.length)return hh+'<div class="gf-acts"><button class="gf-tool" onclick="gfNewItem(null,null)">＋ Closet present</button></div>';
  return hh+closetNoOne(L);
}
function closetNoOne(L){
  let h=intro("Bought ahead or saved for later, not for anyone yet. ↪ hands one to a person (or another occasion) when its day comes.");
  h+='<div class="gf-acts" style="margin-bottom:10px"><button class="gf-tool" onclick="gfNewItem(null,null)">＋ Closet present</button></div>';
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">The gift closet is empty.</div></div>';
  groupBy(L,it=>(occ(it.occ)||{}).name,"").forEach(g=>{h+=listCard("🗄 "+esc(g.label),g.items.length+"",g.items);});
  return h;
}
// STASH_START (her ask + yes 2026-11-20: "every year … I end up buying a few extra things that I end up keeping to use for other holidays …
// push send to, and it could be a different holiday, or it can even be like hold for another holiday, and then when a new holiday is
// picked or created, then I could pull that out"): 📤 Send to… on a present = ↪ Move with the holiday picker first, plus
// "🗄 Hold for a future holiday". A held present has occ "_hold" (+ heldFrom): it leaves every holiday's totals, counts, Even, Eve and
// reminders, but stays on 📍 Where (it's still in the house). 🗄 Stash lists them with "Bring in"; a card on People offers them whenever
// any are waiting. Bringing one in = ONE update {occ, sec} on that present (its person stays; the section becomes the holiday's first one
// for that person when its old one isn't there). What she paid then counts toward the holiday it joins.
const GF_HOLD="_hold";
function held(){return items().filter(it=>it.occ===GF_HOLD&&live(it)).sort((a,b)=>(b.ts||0)-(a.ts||0));}
function gfSendTo(id){gfMove(id);}
function gfBringIn(csv){
  const oid=curOcc(),o=occ(oid);if(!o)return;const S=secsOf(o),ids=String(csv||"").split(",").filter(Boolean);let n=0;
  ids.forEach(id=>{const it=(gfData.items||{})[id];if(!it||it.occ!==GF_HOLD)return;
    const sec=S.some(s=>s.id===it.sec)?it.sec:((S[0]&&S[0].id)||"");const up={occ:oid,sec,heldFrom:null};
    it.occ=oid;it.sec=sec;delete it.heldFrom;write("gifts/items/"+id,up,"update");n++;});
  if(n){log("🗄 Brought "+n+" present"+(n===1?"":"s")+" from the Stash into "+o.name);toast("✓ "+n+" in "+o.name+" — give "+(n===1?"it":"them")+" a person and section");}
  gfDraw();
}
function stashCard(o){
  const H=held();if(!H.length||!o||o.closed)return "";
  return '<div class="gf-card"><div class="gf-bd" style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">🗄</span><span style="flex:1;font-size:13px">You have <b>'+H.length+' present'+(H.length===1?'':'s')+' on hold</b> — bring any into '+esc(o.name)+'?</span><button class="gf-tool" onclick="gfGo(\'closet\')">Open Stash</button></div></div>';
}
// STASH_END
// JOURNEY_START (her ask + "yes to all of those" 2026-11-20: "no presents have been wrapped, so they should all be in the to wrap area …
// the location, they should be all there waiting for a location … eventually things would be under the tree … but for like taking it
// to other family and other places, they may still not be under the tree until they're given. So really think that part out"):
//   💭 idea → 🛒 ordered → 📦 here → 🎀 wrapped ─┬─ 🎄 under the tree (given at home) ─┐
//                                               └─ 🚗 packed for <place>  ─────────────┴─ ✅ given
//  · each present is given at 🏠 home or a place (giveAt: "home" | "Grandma's house" | blank = its person's group's usual place
//    gifts/groups/<gid>.giveAt, else home). 🌙 Eve's gather list is the home presents; a tick = 🎄 under the tree; ✅ All opened = given.
//  · 🚗 Going: one card per place — how many, wrapped / packed, each one ticks 🚗 packed; ✅ All given after the visit.
//  · 🎀 To wrap = everything bought and not wrapped (🛒 ones aren't here yet); 📍 Where puts 📍 Needs a spot first, then the spots,
//    🎄 under the tree, 🚗 packed for each place, 📦 not here yet; 📍 Put in… stores several at once (☑ Select or the Needs-a-spot card).
//  · a receipt's order more than 2 weeks old defaults to 📦 here (her 32 Woot/Amazon presents all came in as 🛒 ordered).
//  Every write = one targeted update per present (status / where / giveAt) or the group's giveAt.
function giveAt(it){
  const v=String(it.giveAt||"").trim();if(v)return v.toLowerCase()==="home"?"":v;
  const p=person(pidsOf(it)[0]);if(!p||(p.group||"other")==="kids")return "";const g=(gfData.groups||{})[p.group||"other"];return (g&&g.giveAt)||"";
}
function atHome(it){return !giveAt(it);}
function placeChoices(){const seen={},out=[];items().forEach(it=>{const v=String(it.giveAt||"").trim();if(v&&v.toLowerCase()!=="home"&&!seen[v.toLowerCase()]){seen[v.toLowerCase()]=1;out.push(v);}});
  Object.values(gfData.groups||{}).forEach(g=>{const v=String((g&&g.giveAt)||"").trim();if(v&&!seen[v.toLowerCase()]){seen[v.toLowerCase()]=1;out.push(v);}});return out.slice(0,10);}
function giveAtField(f){
  const cur=String(f.giveAt||"").trim(),dflt=giveAt({giveAt:"",pids:f.pids||[]});
  const pick=(v,lbl,on)=>'<button class="gf-pick'+(on?" on":"")+'" onclick="gfSetDraw(\'giveAt\','+esc(JSON.stringify(v))+')">'+esc(lbl)+'</button>';
  return '<div class="gf-f wide"><span>🎁 Given at'+(dflt?' (usually '+esc(dflt)+' for this group)':'')+'</span><div class="gf-picks">'+
    pick("",dflt?"Usual — "+dflt:"🏠 Home",!cur)+(dflt?pick("home","🏠 Home",cur.toLowerCase()==="home"):"")+placeChoices().filter(v=>v!==dflt).map(v=>pick(v,"🚗 "+v,cur===v)).join("")+'</div>'+
    '<input value="'+esc(cur.toLowerCase()==="home"?"":cur)+'" placeholder="Somewhere else? e.g. Grandma\'s house" oninput="gfSet(\'giveAt\',this.value)" style="margin-top:4px"></div>';
}
function goingView(o){
  const L=items(o.id).filter(it=>live(it)&&!atHome(it));
  let h=intro("Presents given somewhere other than home — one list per place. Tick each one as it's packed; after the visit, ✅ marks them given.");
  if(!L.length)return h+'<div class="gf-card"><div class="gf-empty">Everything is given at home. Pick a place under "🎁 Given at" on a present — or give a group its usual place (✏️ Sections on that group).</div></div>';
  groupBy(L,giveAt,"").forEach(g=>{
    const left=g.items.filter(it=>it.status!=="given"),wr=g.items.filter(it=>["wrapped","packed","given"].indexOf(it.status)>=0).length,pk=g.items.filter(it=>it.status==="packed").length;
    h+='<div class="gf-card"><div class="gf-ghd"><span>🚗 '+esc(g.label)+'</span><span class="gf-gsum">'+g.items.length+' · '+wr+' wrapped · '+pk+' packed</span>'+(left.length?'<button class="gf-tool" onclick="gfGivenAt(\''+left.map(it=>it.id).join(",")+'\')">✅ All given</button>':'')+'</div><div class="gf-bd">'+
      g.items.map(it=>{const on=it.status==="packed"||it.status==="given",P=pidsOf(it).map(x=>(person(x)||{}).name||"?").join(" + ")||"no one",unwr=["idea","ordered","here"].indexOf(it.status||"idea")>=0;
        return '<button class="gf-tick'+(on?" on":"")+'" onclick="gfPack(\''+esc(it.id)+'\')"><span class="gf-box">'+(on?'✓':'')+'</span><span><b>'+esc(it.name)+'</b> — '+esc(P)+(it.where?' · 📍 '+esc(it.where):'')+(it.paper?' · 🎀 '+esc(it.paper):'')+(unwr?' · <i style="color:#b45309">not wrapped</i>':'')+(it.status==="given"?' · ✅ given':'')+'</span></button>';}).join("")+'</div></div>';});
  return h;
}
function gfPack(id){const it=(gfData.items||{})[id];if(!it||it.status==="given")return;const to=it.status==="packed"?(it.wasStatus||"wrapped"):"packed";
  const up={status:to,wasStatus:to==="packed"?(it.status||"wrapped"):null};it.status=to;if(up.wasStatus)it.wasStatus=up.wasStatus;else delete it.wasStatus;write("gifts/items/"+id,up,"update");gfDraw();}
function gfOpened(csv){const n=setStatus(String(csv||"").split(",").filter(Boolean),"given");if(n)log("✅ "+n+" present"+(n===1?"":"s")+" opened");gfDraw();}
function gfGivenAt(csv){const ids=String(csv||"").split(",").filter(Boolean);if(!ids.length||!confirm("Mark "+ids.length+" present"+(ids.length===1?"":"s")+" given?"))return;const n=setStatus(ids,"given");if(n)log("✅ "+n+" present"+(n===1?"":"s")+" given");gfDraw();}
function gfSpotPick(csv){const ids=String(csv||"").split(",").filter(Boolean);if(!ids.length)return;gfEdit={kind:"spot",id:null,form:{ids,where:""}};gfDraw();}
function spotSheet(){const f=gfEdit.form;return '<div class="gf-form"><div class="gf-sub wide" style="margin:0">Where are these '+f.ids.length+' going? Pick a spot or type a new one.</div><div class="gf-f wide">'+field("where","📍 Spot","e.g. master closet, top shelf")+picks("where",distinct("where"))+'</div></div>';}
function spotSave(f){const w=String(f.where||"").trim().slice(0,80);if(!w){toast("Pick or type a spot");return false;}let n=0;
  f.ids.forEach(id=>{const it=(gfData.items||{})[id];if(!it||it.where===w)return;it.where=w;write("gifts/items/"+id,{where:w},"update");n++;});
  if(n)log("📍 "+n+" present"+(n===1?"":"s")+" → "+w);gfSel={};gfSelOn=false;return true;}
// JOURNEY_END
// SPLITTAGS_START (her "finish all the builds needed for the gift tracker" 2026-11-20 — the two pieces left from the plan):
//  · SPLIT (plan §3.3, her shared-gift ask: "some gifts will be split between kids"): a shared present splits evenly unless she sets
//    her own — on the present sheet, with 2+ people picked, "Split: even ▸ my own" shows a % box per person. Saved as
//    items.split {<pid>: number} only when it isn't even; every total, Even and "their share" follow it. One present = one set.
//  · WNWR (plan Q9, her pick left open → optional, off until she turns it on): 🏷 Want · need · wear · read (· do). The switch is
//    gifts/settings/tags (ONE set). On: a present gets an optional kind, shown as a chip, and each kid's page shows the five boxes
//    with how many of each. Off: nothing shows and nothing is asked; a kind saved earlier is kept.
const GF_KINDS_WNWR=[["want","💝","Want"],["need","🧰","Need"],["wear","👕","Wear"],["read","📚","Read"],["do","🎟","Do"]];
function tagsOn(){return !!((gfData.settings||{}).tags);}
function gfTagsToggle(){const on=!tagsOn();node("settings").tags=on?true:null;if(!on)delete gfData.settings.tags;write("gifts/settings/tags",on?true:null,on?"set":"remove");log("🏷 Want/need/wear/read "+(on?"on":"off"));gfDraw();}
function kindOf(k){return GF_KINDS_WNWR.find(x=>x[0]===k);}
function kindChip(it){const k=tagsOn()&&kindOf(it.kind);return k?' <span class="gf-chip" style="color:#7c3aed;border-color:#7c3aed55;vertical-align:middle">'+k[1]+' '+k[2]+'</span>':'';}
function kindField(f){
  if(!tagsOn())return "";
  return '<div class="gf-f wide"><span>🏷 Kind (optional)</span><div class="gf-picks">'+GF_KINDS_WNWR.map(k=>'<button class="gf-pick'+(f.kind===k[0]?" on":"")+'" onclick="gfSetDraw(\'kind\',\''+(f.kind===k[0]?"":k[0])+'\')">'+k[1]+' '+k[2]+'</button>').join("")+'</div></div>';
}
function kindRow(mine,pid){
  const p=person(pid);if(!tagsOn()||!p||(p.group||"other")!=="kids")return "";const L=mine.filter(live);
  return '<div class="gf-card"><div class="gf-bd" style="display:flex;gap:6px;padding:10px 12px">'+GF_KINDS_WNWR.map(k=>{const n=L.filter(it=>it.kind===k[0]).length;
    return '<div class="gf-kind'+(n?" on":"")+'"><div style="font-size:18px">'+k[1]+'</div><div>'+k[2]+'</div><b>'+(n||"—")+'</b></div>';}).join("")+'</div></div>';
}
function splitField(f){
  if(!f.pids||f.pids.length<2)return "";const own=!!f.split;
  let h='<div class="gf-f wide"><span>🤝 Split the cost</span><div class="gf-picks"><button class="gf-pick'+(own?"":" on")+'" onclick="gfSplitMode(0)">Even</button><button class="gf-pick'+(own?" on":"")+'" onclick="gfSplitMode(1)">My own split</button></div>';
  if(own)h+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'+f.pids.map(x=>'<label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#334155">'+esc((person(x)||{}).name||"?")+
    '<input inputmode="decimal" style="width:64px" value="'+esc(f.split[x]==null?"":f.split[x])+'" oninput="gfSplitSet(\''+esc(x)+'\',this.value)">%</label>').join("")+'</div><div class="gf-sub" style="margin:4px 0 0">Any numbers work — 60 and 40, or 2 and 1. They\'re shared out in that proportion.</div>';
  return h+'</div>';
}
function gfSplitMode(on){const f=gfEdit&&gfEdit.form;if(!f)return;if(on){const even=Math.round(1000/f.pids.length)/10;f.split=f.split||{};f.pids.forEach(x=>{if(f.split[x]==null||f.split[x]==="")f.split[x]=String(even);});}else f.split=null;gfDraw();}
function gfSplitSet(pid,v){const f=gfEdit&&gfEdit.form;if(f&&f.split)f.split[pid]=v;}
function splitClean(f){   // her split, only for the people still picked, only when it isn't even
  if(!f.split||!f.pids||f.pids.length<2)return null;const out={};let any=false;f.pids.forEach(x=>{const v=num(f.split[x]);out[x]=v!=null&&v>0?v:0;if(out[x]>0)any=true;});
  if(!any)return null;const vals=f.pids.map(x=>out[x]);return vals.every(v=>Math.abs(v-vals[0])<1e-9)?null:out;
}
// SPLITTAGS_END

function eveDone(oid,key){return !!(((gfData.eve||{})[oid]||{}).done||{})[key];}
function eveLines(oid){const L=(((gfData.eve||{})[oid]||{}).lines)||{};return Object.keys(L).map(id=>Object.assign({id},L[id])).sort((a,b)=>(a.order||0)-(b.order||0));}
function eveView(o){
  const all=items(o.id).filter(live),out=all.filter(it=>atHome(it)&&["here","wrapped","out","given"].indexOf(it.status)>=0),under=out.filter(it=>it.status==="out"||it.status==="given");   // JOURNEY: home presents only; tick = 🎄 under the tree
  let h=intro("Christmas Eve: walk the house spot by spot and tick each present as it goes under the tree. Presents going somewhere else are on 🚗 Going. Then the jobs, the counts per kid, and your own list.");
  // the gather list
  const opened=under.filter(it=>it.status==="out");
  h+='<div class="gf-card"><div class="gf-ghd"><span>🎄 Gather — '+under.length+' of '+out.length+' under the tree</span>'+(opened.length?'<button class="gf-tool" onclick="gfOpened(\''+opened.map(it=>it.id).join(",")+'\')">✅ All opened</button>':'')+'</div><div class="gf-bd">';
  if(!out.length)h+='<div class="gf-empty">No presents in the house yet.</div>';
  groupBy(out,it=>it.where,"📍 Not written down").forEach(g=>{
    h+='<div class="gf-spot">'+(g.key?"📍 ":"")+esc(g.label)+'</div>'+g.items.map(it=>{const on=it.status==="out"||it.status==="given",P=pidsOf(it).map(x=>(person(x)||{}).name||"?").join(" + ")||"no one",sec=((o.secs||{})[it.sec]||{});
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
    S.map(s=>'<tr><th>'+esc((s.emoji||"")+" "+s.name)+'</th>'+kids().map(p=>{const L=all.filter(it=>it.sec===s.id&&pidsOf(it).indexOf(p.id)>=0);const u=L.filter(it=>it.status==="out"||it.status==="given").length;return '<td><b>'+u+'</b> / '+L.length+'</td>';}).join("")+'</tr>').join("")+
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
  return '<div class="gf-selbar"><b>'+n+' picked</b>'+(n?'<button class="gf-pick" onclick="gfSpotPick(\''+Object.keys(gfSel).join(",")+'\')">📍 Put in…</button>':'')+(n?GF_STATUS.map(s=>'<button class="gf-pick" onclick="gfBulk(\''+s[0]+'\')">'+esc(s[1])+'</button>').join(""):'<span style="color:#cbd5e1">— tap presents to pick them</span>')+'</div>';
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
  const f=gfEdit.form;const S=secsFor(occ(oid),f.pids);   // GIFTS_GROUPS: the first person's group's sections
  return '<div class="gf-f wide"><span>Section</span><div class="gf-picks">'+S.map(s=>'<button class="gf-pick'+(f.sec===s.id?" on":"")+'" onclick="gfSetDraw(\'sec\',\''+esc(s.id)+'\')">'+esc((s.emoji||"")+" "+s.name)+'</button>').join("")+'</div></div>';
}
function itemSheet(){
  const f=gfEdit.form;let h='<div class="gf-form">';
  h+='<label class="gf-f wide"><span>What</span><input value="'+esc(f.name)+'" placeholder="e.g. LEGO treehouse" oninput="gfSet(\'name\',this.value)"></label>';
  h+=forPicker()+splitField(f)+secPicker(f.occ)+kindField(f);   // SPLIT · WNWR
  h+='<div class="gf-f wide"><span>Status</span><div class="gf-picks">'+GF_STATUS.map(s=>'<button class="gf-pick'+(f.status===s[0]?" on":"")+'" onclick="gfSetDraw(\'status\',\''+s[0]+'\')">'+esc(s[1])+'</button>').join("")+'</div></div>';
  h+=field("plan","Planned $","","money")+field("paid","Paid $","","money")+field("store","Store","e.g. Target")+field("link","Link","https://…")+field("due","📦 Coming by","","date");
  h+='<div class="gf-f wide"><span>Christmas Eve jobs</span><div class="gf-picks">'+[["batt","🔋 Batteries"],["build","🔧 Assembly"],["charge","🔌 Charge it"]].map(x=>'<button class="gf-pick'+(f.needs[x[0]]?" on":"")+'" onclick="gfNeed(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div></div>';
  if(f.needs.batt)h+=field("batt","Which batteries","e.g. AA ×4");
  h+='<div class="gf-f wide">'+field("where","📍 Where it's hidden","e.g. master closet, top shelf")+picks("where",distinct("where"))+'</div>';
  h+='<div class="gf-f wide">'+field("paper","🎀 Wrapping paper","e.g. gold stars")+picks("paper",distinct("paper"))+'</div>';
  h+=giveAtField(f);   // JOURNEY
  h+='<label class="gf-f wide"><span>Notes</span><textarea rows="2" oninput="gfSet(\'note\',this.value)">'+esc(f.note)+'</textarea></label>';
  return h+'</div>';
}
function moveSheet(){
  const f=gfEdit.form,held=f.occ===GF_HOLD;
  return '<div class="gf-form"><div class="gf-sub wide">Who it\'s for and which holiday — everything else (what you paid, where it is, its status, its receipt) goes with it.</div>'+
    '<label class="gf-f wide"><span>📤 Send to</span><select onchange="gfSetDraw(\'occ\',this.value)">'+occs().filter(o=>!o.closed||o.id===f.occ).map(o=>'<option value="'+esc(o.id)+'"'+(o.id===f.occ?" selected":"")+'>'+esc(o.name)+'</option>').join("")+
    '<option value="'+GF_HOLD+'"'+(held?" selected":"")+'>🗄 Hold for a future holiday (Stash)</option></select></label>'+
    (held?'<div class="gf-sub wide" style="margin:0">It leaves this holiday\'s totals and lists and waits in 🗄 Stash — still on 📍 Where. Bring it into any holiday later.</div>':forPicker()+secPicker(f.occ))+'</div>';
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
  if(f.secs)secsFor(o,[f.key]).forEach(s=>{h+='<label class="gf-f"><span>'+esc((s.emoji||"")+" "+s.name)+' (optional)</span><input inputmode="decimal" value="'+esc(f.secs[s.id]||"")+'" oninput="gfSecBudget(\''+esc(s.id)+'\',this.value)"></label>';});   // GIFTS_GROUPS: a person in a group gets that group's sections
  return h+'</div>';
}
function evenSheet(){return '<div class="gf-form"><div class="gf-sub wide">Flag a kid as behind when they are more than…</div>'+field("pct","% behind in dollars","15","money")+field("n","gifts behind","2","money")+'</div>';}
function groupSheet(){return '<div class="gf-form">'+field("emoji","Emoji","🏡")+field("name","Group name","e.g. Neighbors")+'</div>';}
function occSheet(){   // OCCFIX (2026-11-20): editing an occasion shows its Sections + Done again — the checks read f.id, which the form never has, so they hid since slice 1
  const f=gfEdit.form;let h='<div class="gf-form">';
  if(!gfEdit.id)h+='<div class="gf-f wide"><span>Kind</span><div class="gf-picks">'+Object.keys(GF_KINDS).map(k=>'<button class="gf-pick'+(f.kind===k?" on":"")+'" onclick="gfSetDraw(\'kind\',\''+k+'\')">'+esc(GF_KINDS[k].label)+'</button>').join("")+'</div></div>';
  h+=occForPicker(f);   // GIFTS_OCC: whose birthday
  h+=field("name","Name","e.g. a birthday 2027")+field("date","Date","","date")+field("budget","Whole budget (optional)","","money");
  h+=remOrderField(f);   // GIFTS_REMIND: 🚚 her order-by date
  if(gfEdit.id){h+='<div class="gf-f wide"><span>Sections</span>'+f.secs.map((s,i)=>'<div style="display:flex;gap:6px;margin-top:4px"><input style="width:56px" value="'+esc(s.emoji)+'" oninput="gfSecEdit('+i+',\'emoji\',this.value)"><input value="'+esc(s.name)+'" oninput="gfSecEdit('+i+',\'name\',this.value)"></div>').join("")+
    '<button class="gf-tool" style="margin-top:6px;align-self:flex-start" onclick="gfSecAdd()">＋ Section</button></div>';
    h+='<label class="gf-f wide" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" style="width:auto"'+(f.closed?" checked":"")+' onchange="gfSet(\'closed\',this.checked)"> Done — move it to 📜 Past</label>';}
  return h+'</div>';
}
const SHEETS={spot:["📍 Put in…",spotSheet],gsecs:["Sections",grpSecsSheet],even:["⚖️ When is a kid behind?",evenSheet],item:["Present",itemSheet],move:["↪ Move to…",moveSheet],person:["Person",personSheet],budget:["💲 Budget",budgetSheet],group:["Group",groupSheet],occ:["Occasion",occSheet],rcpt:["Receipt",rcptSheet]};
function sheet(){return gfEdit?'<div id="gf-sheet" onclick="if(event.target.id===\'gf-sheet\')gfCancel()"><div class="gf-sh">'+sheetInner()+'</div></div>':"";}
function sheetInner(){   // what's inside the pop-up (SHEETINPLACE redraws only this when the same pop-up stays open)
  const S=SHEETS[gfEdit.kind];const id=gfEdit.id;
  const title=gfEdit.kind==="move"||gfEdit.kind==="budget"||gfEdit.kind==="even"||gfEdit.kind==="spot"?S[0]:(id?"✏️ "+S[0]:"➕ New "+S[0].toLowerCase());
  const del=id&&(gfEdit.kind==="item"||(gfEdit.kind==="person"&&!/^k_/.test(id))||gfEdit.kind==="group");
  return '<button class="gf-x" onclick="gfCancel()">✕</button><div style="font-weight:800;font-size:15px;margin-bottom:8px">'+esc(title)+'</div>'+S[1]()+
    '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap"><button class="gf-tool gf-save" onclick="gfSave()">Save</button><button class="gf-tool" onclick="gfCancel()">Cancel</button>'+
    (gfEdit.kind==="item"&&id?'<button class="gf-tool" onclick="gfMove(\''+esc(id)+'\')">↪ Move to…</button><button class="gf-tool" onclick="gfSendTo(\''+esc(id)+'\')">📤 Send to…</button>':'')+
    (del?'<button class="gf-tool" style="margin-left:auto;color:#b5394a;border-color:#fecaca" onclick="gfDelete()">Delete</button>':'')+'</div>';
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
function gfOpenPerson(pid){gfPid=pid;gfView="person";gfShF="all";gfShN=0;gfDraw();try{window.scrollTo(0,0);}catch(e){}}
function gfBack(){gfView="people";gfDraw();}
function defaultPaper(pids,sec,oid){const s=((occ(oid)||{}).secs||{})[sec];if(s&&s.paper)return s.paper;const p=person(pids[0]);return (p&&p.paper)||"";}
function gfNewItem(pid,sid){
  const oid=curOcc();if(!oid)return;const pids=pid?[pid]:[];const S=secsFor(occ(oid),pids);const sec=sid||(S[0]&&S[0].id)||"";
  gfEdit={kind:"item",id:null,form:{occ:oid,name:"",pids,sec,status:"idea",plan:"",paid:"",store:"",link:"",due:"",where:"",paper:defaultPaper(pids,sec,oid),note:"",giveAt:"",needs:{},batt:"",split:null,kind:""}};gfDraw();
}
function gfEditItem(id){const it=(gfData.items||{})[id];if(!it)return;const f={occ:it.occ,pids:pidsOf(it).slice(),sec:it.sec||"",status:it.status||"idea"};
  ["name","plan","paid","store","link","due","where","paper","note","giveAt"].forEach(k=>{f[k]=it[k]==null?"":String(it[k]);});
  const n=it.needs||{};f.needs={batt:!!n.batt,build:!!n.build,charge:!!n.charge};f.batt=n.batt&&n.batt!==true?String(n.batt):"";
  f.kind=it.kind||"";f.split=null;if(it.split&&typeof it.split==="object"){f.split={};f.pids.forEach(x=>{f.split[x]=it.split[x]==null?"":String(it.split[x]);});}   // SPLIT · WNWR
  gfEdit={kind:"item",id,form:f};gfDraw();}
function gfNeed(k){if(!gfEdit||!gfEdit.form.needs)return;gfEdit.form.needs[k]=!gfEdit.form.needs[k];gfDraw();}
function gfMove(id){const it=(gfData.items||{})[id];if(!it)return;gfEdit={kind:"move",id,form:{occ:it.occ,pids:pidsOf(it).slice(),sec:it.sec||"",was:{pids:pidsOf(it).slice(),occ:it.occ,sec:it.sec||""}}};gfDraw();}
function gfSet(k,v){if(!gfEdit)return;gfEdit.form[k]=v;if(k==="name")gfEdit.form.autoName=false;if(k==="date")gfEdit.form.autoDate=false;}
function gfSetDraw(k,v){if(!gfEdit)return;const f=gfEdit.form;
  if(k==="sec"&&gfEdit.kind==="item"&&!gfEdit.id&&(!f.paper||f.paper===defaultPaper(f.pids,f.sec,f.occ))){f.sec=v;f.paper=defaultPaper(f.pids,v,f.occ);}
  f[k]=v;if(k==="occ"){const S=secsFor(occ(v),f.pids);if(!S.some(s=>s.id===f.sec))f.sec=(S[0]&&S[0].id)||"";}
  if(k==="kind"&&!f.id&&(!f.name||f.autoName)){f.name=GF_KINDS[v].label.replace(/^\S+\s/,"")+" "+today().slice(0,4);f.autoName=true;}
  if(k==="kind")occAuto(f);   // GIFTS_OCC
  gfDraw();}
function gfTogglePid(pid){if(!gfEdit)return;const f=gfEdit.form;const auto=gfEdit.kind==="item"&&!gfEdit.id&&(!f.paper||f.paper===defaultPaper(f.pids,f.sec,f.occ));
  const i=f.pids.indexOf(pid);if(i>=0)f.pids.splice(i,1);else f.pids.push(pid);grpSecFix(f);if(auto)f.paper=defaultPaper(f.pids,f.sec,f.occ);gfDraw();}
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
    ["occ","pids","sec","name","status","plan","paid","store","link","due","where","paper","note","needs","giveAt","split","kind"].forEach(k=>{delete prev[k];});
    const rec=Object.assign(prev,{occ:f.occ,pids:f.pids.slice(),sec:f.sec||"",name,status:f.status||"idea",ts:prev.ts||Date.now()});
    {const sp=splitClean(f);if(sp)rec.split=sp;if(tagsOn()&&f.kind)rec.kind=f.kind;else if(!tagsOn()&&id&&(gfData.items[id]||{}).kind)rec.kind=gfData.items[id].kind;}   // SPLIT · WNWR (a tag set earlier survives the switch being off)
    {const ga=String(f.giveAt||"").trim();if(ga)rec.giveAt=ga;}   // JOURNEY: "home", a place, or blank = the group's usual
    ["store","link","due","where","paper","note"].forEach(k=>{const v=String(f[k]||"").trim();if(v)rec[k]=v;});
    const nd={};if(f.needs&&f.needs.batt)nd.batt=String(f.batt||"").trim()||true;if(f.needs&&f.needs.build)nd.build=true;if(f.needs&&f.needs.charge)nd.charge=true;if(Object.keys(nd).length)rec.needs=nd;
    ["plan","paid"].forEach(k=>{const v=num(f[k]);if(v!=null)rec[k]=v;});
    if(!rec.pids.length)delete rec.pids;
    if(!id&&f.wish)rec.wish=f.wish;   // GIFTS_WISH: the kid's wish it came from ("<kid>/<wid>")
    const iid=id||uid();node("items")[iid]=rec;write("gifts/items/"+iid,rec,"set");
    log((id?"Edited: ":"Added: ")+name+" → "+names(f.pids)+(rec.paid!=null?" "+money(rec.paid):""));
  }else if(kind==="rcpt"){if(!rcptSave())return;   // GIFTS_RCPT
  }else if(kind==="spot"){if(!spotSave(f))return;   // JOURNEY
  }else if(kind==="gsecs"){grpSecsSave(f);   // GIFTS_GROUPS
  }else if(kind==="even"){
    const rec={pct:Math.max(0,num(f.pct)==null?15:num(f.pct)),n:Math.max(1,num(f.n)==null?2:Math.round(num(f.n)))};
    node("settings").even=rec;write("gifts/settings/even",rec,"set");log("Even-steven: "+rec.pct+"% or "+rec.n+" gifts");
  }else if(kind==="move"){
    const it=gfData.items[id];if(!it){gfEdit=null;return gfDraw();}
    const held=f.occ===GF_HOLD,up={pids:f.pids.length?f.pids.slice():null,occ:f.occ,sec:held?(it.sec||""):(f.sec||"")};   // STASH: held keeps its person + section until it's brought in
    if(held&&f.was.occ!==GF_HOLD)up.heldFrom=f.was.occ;
    if(it.paper&&it.paper===defaultPaper(f.was.pids,f.was.sec,f.was.occ)){const np=defaultPaper(f.pids,f.sec,f.occ);if(np)up.paper=np;}   // auto paper follows the new person
    Object.keys(up).forEach(k=>{if(up[k]==null)delete it[k];else it[k]=up[k];});write("gifts/items/"+id,up,"update");
    log(f.occ===GF_HOLD?"🗄 On hold: "+it.name+" (from "+((occ(f.was.occ)||{}).name||"")+")":"Moved: "+it.name+": "+names(f.was.pids)+" → "+names(f.pids)+(f.occ!==f.was.occ?" ("+((occ(f.occ)||{}).name||"")+")":""));
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
    if(f.orderBy!==undefined)up.orderBy=isIso(f.orderBy)?f.orderBy:null;   // GIFTS_REMIND: in the same ONE update
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
function gfNext(id){const it=(gfData.items||{})[id];if(!it)return;const nx=nextOf(it);if(!nx)return;it.status=nx;write("gifts/items/"+id,{status:nx},"update");log(it.name+" → "+st(nx)[1]);gfDraw();}
function gfGo(v){gfView=v;gfSelOn=false;gfSel={};gfDraw();try{window.scrollTo(0,0);}catch(e){}}
function gfSelToggle(){gfSelOn=!gfSelOn;gfSel={};gfDraw();}
function gfPick(id){if(gfSel[id])delete gfSel[id];else gfSel[id]=1;gfDraw();}
function setStatus(ids,status){let n=0;ids.forEach(id=>{const it=(gfData.items||{})[id];if(!it||it.status===status)return;it.status=status;write("gifts/items/"+id,{status},"update");n++;});return n;}   // one targeted update per present
function gfBulk(status){const ids=Object.keys(gfSel);if(!ids.length)return;const n=setStatus(ids,status);if(n)log(n+" present"+(n===1?"":"s")+" → "+st(status)[1]);gfSel={};gfSelOn=false;toast("✓ "+n+" → "+st(status)[1]);gfDraw();}
function gfBulkIds(csv,status){const n=setStatus(String(csv||"").split(",").filter(Boolean),status);if(n)log(n+" present"+(n===1?"":"s")+" → "+st(status)[1]);gfDraw();}
function gfGather(id){const it=(gfData.items||{})[id];if(!it)return;const to=it.status==="out"||it.status==="given"?(it.wasStatus||"wrapped"):"out";   // JOURNEY: tick = 🎄 under the tree
  const up={status:to,wasStatus:to==="out"?(it.status||"wrapped"):null};it.status=to;if(up.wasStatus)it.wasStatus=up.wasStatus;else delete it.wasStatus;write("gifts/items/"+id,up,"update");gfDraw();}
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
function gfNewPerson(){gfEdit={kind:"person",id:null,form:{name:"",group:curGrp()!=="kids"?curGrp():"mom",paper:"",birthday:"",sizes:"",note:""}};gfDraw();}
function gfEditPerson(pid){const p=person(pid);if(!p)return;gfEdit={kind:"person",id:pid,form:{name:p.name||"",group:p.group||"other",paper:p.paper||"",birthday:p.birthday||"",sizes:p.sizes||"",note:p.note||""}};gfDraw();}
function gfBudget(pid){const oid=curOcc(),p=plan(oid,pid),secs={};Object.keys(p.sec||{}).forEach(k=>{secs[k]=String(p.sec[k]);});
  gfEdit={kind:"budget",id:pid,form:{occ:oid,key:pid,label:(person(pid)||{}).name||pid,budget:p.budget==null?"":String(p.budget),secs}};gfDraw();}
function gfGroupBudget(gid){const oid=curOcc(),p=plan(oid,"g_"+gid),g=groups().find(x=>x.id===gid)||{};
  gfEdit={kind:"budget",id:"g_"+gid,form:{occ:oid,key:"g_"+gid,label:g.name||gid,budget:p.budget==null?"":String(p.budget),secs:null}};gfDraw();}
function gfNewGroup(){gfEdit={kind:"group",id:null,form:{name:"",emoji:"👥"}};gfDraw();}
function gfNewOcc(){gfEdit={kind:"occ",id:null,form:{kind:"birthday",name:"",date:"",budget:"",autoName:true}};gfSetDraw("kind","birthday");}
function gfOccEdit(){const o=occ(curOcc());if(!o)return;gfEdit={kind:"occ",id:o.id,form:{kind:o.kind||"other",for:o.for||null,name:o.name||"",date:o.date||"",budget:o.budget==null?"":String(o.budget),orderBy:o.orderBy||"",closed:!!o.closed,secs:secsOf(o).map(s=>({id:s.id,emoji:s.emoji||"",name:s.name||""}))}};gfDraw();}

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
  +'{"store":"store name","date":"YYYY-MM-DD or null","orderNo":"order number as printed, or null","total":number or null,"returnBy":"YYYY-MM-DD or null","subtotal":number or null,"discount":number or null,"tax":number or null,"lines":[{"text":"the item as printed","name":"a short plain name for it (a few words)","qty":whole number,"price":number,"taxed":true or false or null,"idea":"the exact idea name from her list below, or null"}]}\n'
  +'price = what was paid for that line after any discount printed ON THAT LINE — always the LINE total for all of its items: when it prints "N @ $X", X is the price of ONE, so price = N × X (2 @ 9.99 = 19.98; 3 @ $30.99 = 92.97). A crossed-out or "reference" price is never the price. subtotal = the items subtotal printed (null if none). discount = the total of the ORDER-LEVEL discounts printed below the items — coupons, promo codes, "Prime discount", savings, rewards — as a POSITIVE number (90.46 for "-$90.46"); never a discount already taken off a line, never a gift card or payment; null if none. qty = how many of the item that line is (2 @ 9.99 → 2; 1 when no count is printed). tax = the sales tax total printed on it (null if none is shown). taxed = whether that line is marked as taxed (stores print a letter such as T, X or A beside taxed lines; false when it is marked not taxed; null when the receipt does not show). returnBy = only a return-by date or the end of a return window that is PRINTED on it; never work one out yourself. '
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
function rcRow(oid,t,p){const S=secsFor(occ(oid),[]);return {t:t||"",p:p==null?"":String(p),pids:[],sec:(S[0]&&S[0].id)||"",nog:false,idea:null,useIdea:false,taxed:null,of:""};}
// RCPTTAX (her ask 2026-11-20: "is there a way to include in a receipt and figure out the tax per item … one item I had three of, and it
// just did it as one thing … maybe it should pull it out three different times also so it could do the tax as well"):
//  · a line Claude reads as qty N (2–12) becomes N rows, each 1/N of the line's price (cents split so they add up exactly), "1 of 3"…
//  · the receipt's tax is shared across the taxed lines by price — every line on the receipt, a "not a gift" one too, so the presents
//    only carry their own share; lines marked not taxed get none (when the receipt marks none either way, every line is taxed).
//    The shares are worked out in whole cents (leftover cents to the lines nearest the next cent), so they add up to the tax exactly.
//  · a present's paid = its price + its tax share (what it really cost — her pick 2026-11-20), and its tax share is kept on it as tax.
// RCPTDISC (her report 2026-11-20, a Woot order: "it didnt account for the discount and accounted for the price before the discount
// which was significant" — a −$90.46 "Prime discount" below the items was skipped, and "3 @ $30.99" was read as $30.99 for all three):
//  · Claude also reads the items subtotal and the order-level discount (coupons, promos, "Prime discount" — never a gift card).
//  · the discount is shared across the lines by price, in whole cents that add up exactly (the tax rule's way), and the TAX is then
//    shared on what each line cost after its discount;  a present's paid = price − its discount share + its tax share.
//  · "N @ $X" read as $X for the whole line: when the prices only add up to the printed subtotal as each × N, they are each × N.
//  · the check screen adds it up — items − discount + tax — against the receipt's total: ✓ when it matches, ⚠ when it doesn't.
// RCPTNET (her ask 2026-11-20: "id rather see the real number i think other families will be confused"): each line on the check
// screen spells out "$17.99 − $10.80 off + $0.50 tax = $7.69" before Save, and the 🧾 list leads with what each line really cost.
function rcShares(rows,amt,on,base){   // share a cents amount across rows by weight (base cents), leftover cents to the nearest-next
  const T=Math.round((num(amt)||0)*100),out=rows.map(()=>0);if(!T)return out;const sum=base.reduce((a,b,i)=>a+(on[i]?b:0),0);if(!sum)return out;
  const fr=[];let given=0;rows.forEach((r,i)=>{if(!on[i])return;const x=T*base[i]/sum;out[i]=Math.floor(x);given+=out[i];fr.push([x-out[i],i]);});
  fr.sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,T-given).forEach(z=>{out[z[1]]++;});return out.map(c=>c/100);
}
function rcDiscShares(rows,disc){const P=rows.map(r=>Math.round((num(r.p)||0)*100));return rcShares(rows,disc,P.map(p=>p>0),P);}
function rcTaxShares(rows,tax,disc){
  const D=rcDiscShares(rows,disc),T=Math.round((num(tax)||0)*100),P=rows.map((r,i)=>Math.max(0,Math.round((num(r.p)||0)*100)-Math.round(D[i]*100))),out=rows.map(()=>0);if(!T)return out;
  const marked=rows.some(r=>r.taxed===true||r.taxed===false),on=rows.map((r,i)=>P[i]>0&&(marked?r.taxed!==false:true));
  const base=P.reduce((a,p,i)=>a+(on[i]?p:0),0);if(!base)return out;
  const fr=[];let given=0;rows.forEach((r,i)=>{if(!on[i])return;const x=T*P[i]/base;out[i]=Math.floor(x);given+=out[i];fr.push([x-out[i],i]);});
  fr.sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,T-given).forEach(z=>{out[z[1]]++;});   // the leftover cents go to the lines closest to the next cent
  return out.map(c=>c/100);
}
function rcSplit(price,n){const c=Math.round((num(price)||0)*100),b=Math.floor(c/n),r=c-b*n;return Array.from({length:n},(_,k)=>(b+(k<r?1:0))/100);}
function rcptLoad(f,d,oid){   // Claude's answer → the form; what she already typed wins
  d=d||{};if(!String(f.store||"").trim()&&d.store)f.store=String(d.store).slice(0,60);
  if((!f.iso||f.iso===today())&&isoOk(d.date))f.iso=isoOk(d.date);   // the sheet starts on today; the printed date beats that
  if(!String(f.orderNo||"").trim()&&d.orderNo)f.orderNo=String(d.orderNo).slice(0,60);
  if(num(f.total)==null&&num(d.total)!=null)f.total=String(num(d.total));if(!f.returnBy&&isoOk(d.returnBy))f.returnBy=isoOk(d.returnBy);
  if(num(f.tax)==null&&num(d.tax)!=null)f.tax=String(num(d.tax));   // RCPTTAX
  if(num(f.discount)==null&&num(d.discount)!=null&&num(d.discount)>0)f.discount=String(num(d.discount));   // RCPTDISC
  const L0=(Array.isArray(d.lines)?d.lines:[]).filter(l=>l&&(l.name||l.text)),sub=num(d.subtotal);   // RCPTDISC: "3 @ $30.99" read as the line → each × 3
  const qOf=l=>Math.max(1,Math.min(12,Math.round(+l.qty)||1)),s1=L0.reduce((a,l)=>a+(num(l.price)||0),0),s2=L0.reduce((a,l)=>a+(num(l.price)||0)*qOf(l),0);
  const each=sub!=null&&Math.abs(s1-sub)>0.015&&Math.abs(s2-sub)<=0.02;
  if(!f.statusSet){const age=isoOk(f.iso)?Math.round((new Date(today()+"T12:00:00")-new Date(f.iso+"T12:00:00"))/864e5):0;f.status=f.orderNo&&age<=14?"ordered":"here";}   // JOURNEY: an order from more than 2 weeks ago has come
  const used=[];f.rows=[];(Array.isArray(d.lines)?d.lines:[]).filter(l=>l&&(l.name||l.text)).forEach(l=>{
    const nm=String(l.name||l.text).trim().slice(0,140),q=Math.max(1,Math.min(12,Math.round(+l.qty)||1)),tx=l.taxed===true||l.taxed===false?l.taxed:null;   // RCPTTAX: ×3 → three rows
    const prices=num(l.price)==null?Array(q).fill(null):(each?Array(q).fill(num(l.price)):rcSplit(l.price,q));
    prices.forEach((p,k)=>{const r=rcRow(oid,nm,p);r.taxed=tx;if(q>1)r.of=(k+1)+" of "+q;
      const iid=matchIdea((l.text||"")+" "+(l.name||""),k?null:l.idea,oid,used);if(iid){used.push(iid);r.idea=iid;r.useIdea=true;}
      f.rows.push(r);});});
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
function gfRcptNew(){if(!curOcc())return;gfEdit={kind:"rcpt",id:null,form:{files:[],store:"",iso:today(),orderNo:"",total:"",tax:"",discount:"",returnBy:"",status:"here",statusSet:false,rows:[],read:false,busy:false,adding:false,msg:""}};gfDraw();}
function gfRcptDrop(i){const f=rcF();if(!f)return;f.files.splice(i,1);gfDraw();}
function gfRcSet(i,k,v){const r=rcR(i);if(r)r[k]=v;}
function gfRcPid(i,pid){const r=rcR(i);if(!r)return;r.nog=false;const j=r.pids.indexOf(pid);if(j>=0)r.pids.splice(j,1);else r.pids.push(pid);gfDraw();}
function gfRcNone(i){const r=rcR(i);if(!r)return;r.pids=[];r.nog=false;gfDraw();}
function gfRcNog(i){const r=rcR(i);if(!r)return;r.nog=!r.nog;if(r.nog){r.pids=[];r.useIdea=false;}gfDraw();}
function gfRcSec(i,sid){const r=rcR(i);if(r)r.sec=sid;gfDraw();}
function gfRcUseIdea(i){const r=rcR(i);if(!r||!r.idea)return;r.useIdea=!r.useIdea;if(r.useIdea)r.nog=false;gfDraw();}
function gfRcIdea(i,iid){const f=rcF(),r=rcR(i);if(!r)return;f.rows.forEach((o,j)=>{if(j!==i&&iid&&o.idea===iid){o.idea=null;o.useIdea=false;}});r.idea=iid||null;r.useIdea=!!iid;if(iid)r.nog=false;gfDraw();}
function gfRcTaxed(i){const r=rcR(i);if(!r)return;r.taxed=r.taxed===false?true:false;gfDraw();}   // RCPTTAX: tap "+ tax" / "no tax" to flip it
function gfRcRedraw(){if(rcF())gfDraw();}
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
  h+=field("store","Store","e.g. Target")+field("iso","Date","","date")+field("total","Total $","","money")+field("tax","Tax $","","money")+field("discount","Order discount $","","money")+field("orderNo","Order #","optional")+field("returnBy","⏰ Return by","","date");
  if(f.rows.length){
    h+='<div class="gf-f wide"><span>These presents are…</span><div class="gf-picks">'+[["ordered","🛒 On the way"],["here","📦 Here"]].map(s=>'<button class="gf-pick'+(f.status===s[0]?" on":"")+'" onclick="gfRcStatus(\''+s[0]+'\')">'+s[1]+'</button>').join("")+'</div></div>';
    h+='<div class="gf-sub wide" style="margin:4px 0 0">Each line: who it\'s for (tap two or more = 🤝 shared), the section — or 🗄 no one yet, or ✕ not a gift.</div>';
  }
  const shares=rcTaxShares(f.rows,f.tax,f.discount),anyTax=num(f.tax)>0,dsh=rcDiscShares(f.rows,f.discount),anyDisc=num(f.discount)>0;   // RCPTTAX · RCPTDISC
  if(f.rows.length){const it=f.rows.reduce((a,r)=>a+(num(r.p)||0),0),calc=Math.round((it-(num(f.discount)||0)+(num(f.tax)||0))*100)/100,tot=num(f.total);   // RCPTDISC: does it add up?
    const okSum=tot==null||Math.abs(calc-tot)<=0.02;
    h+='<div class="gf-sub wide" style="margin:2px 0 0;font-weight:700;color:'+(okSum?'#15803d':'#b45309')+'">'+(okSum?'✓ ':'⚠ ')+'Items '+money(it)+(anyDisc?' − '+money(num(f.discount))+' off':'')+(anyTax?' + '+money(num(f.tax))+' tax':'')+' = '+money(calc)+(tot!=null?(okSum?' — matches the receipt':' — the receipt says '+money(tot)+'. Check the prices, the discount and the tax before you save.'):'')+'</div>';}
  f.rows.forEach((r,i)=>{
    const idea=r.idea&&(gfData.items||{})[r.idea];
    h+='<div class="gf-rcrow'+(r.nog?" nog":"")+'"><div style="display:flex;gap:6px;align-items:center"><input class="gf-in" value="'+esc(r.t)+'" placeholder="What is it?" oninput="gfRcSet('+i+',\'t\',this.value)">'+
      '<input class="gf-in" style="flex:none;width:76px" inputmode="decimal" value="'+esc(r.p)+'" placeholder="$" oninput="gfRcSet('+i+',\'p\',this.value)" onchange="gfRcRedraw()"><button class="gf-tool gf-mini" title="Take this line off" onclick="gfRcDel('+i+')">✕</button></div>';
    const pn=num(r.p),net=pn==null?null:Math.round((pn-(dsh[i]||0)+(shares[i]||0))*100)/100;   // RCPTNET: the real cost, shown before Save
    if(r.of||anyTax||anyDisc)h+='<div class="gf-im" style="margin-top:0">'+(r.of?chip("×"+r.of.split(" of ")[1]+" · "+r.of,"#0e7490"):'')+(pn!=null&&(anyDisc||anyTax)?'<span>'+money(pn)+'</span>':'')+(anyDisc&&dsh[i]?'<span style="color:#15803d;font-weight:700">− '+money(dsh[i])+' off</span>':'')+(anyTax?'<button class="gf-pick" style="padding:2px 9px;font-size:11px" onclick="gfRcTaxed('+i+')">'+(shares[i]?'+ '+money(shares[i])+' tax':'no tax')+'</button>':'')+(net!=null&&(anyDisc||anyTax)?'<span class="gf-rcnet">= '+money(net)+'</span>':'')+'</div>';   // RCPTTAX · RCPTDISC · RCPTNET
    if(idea)h+='<button class="gf-tick'+(r.useIdea?" on":"")+'" onclick="gfRcUseIdea('+i+')"><span class="gf-box">'+(r.useIdea?'✓':'')+'</span><span>💭 That\'s your idea <b>'+esc(idea.name)+'</b>'+(pidsOf(idea).length?' ('+esc(names(pidsOf(idea)))+')':'')+' — mark it bought</span></button>';
    if(!(r.useIdea&&idea)){
      h+='<div class="gf-picks">';groups().forEach(g=>{people().filter(p=>(p.group||"other")===g.id).forEach(p=>{const on=r.pids.indexOf(p.id)>=0;
        h+='<button class="gf-pick'+(on?" on":"")+'" style="'+(on?"background:"+esc(p.color||"#0f172a")+";border-color:"+esc(p.color||"#0f172a"):"")+'" onclick="gfRcPid('+i+',\''+esc(p.id)+'\')">'+esc(p.name)+'</button>';});});
      h+='<button class="gf-pick'+(!r.nog&&!r.pids.length?" on":"")+'" onclick="gfRcNone('+i+')">🗄 No one yet</button><button class="gf-pick'+(r.nog?" on":"")+'" onclick="gfRcNog('+i+')">✕ Not a gift</button></div>';
      if(!r.nog&&r.pids.length)h+='<div class="gf-picks">'+rcSecs(o,r).map(s=>'<button class="gf-pick'+(r.sec===s.id?" on":"")+'" onclick="gfRcSec('+i+',\''+esc(s.id)+'\')">'+esc((s.emoji||"")+" "+s.name)+'</button>').join("")+'</div>';
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
  const lines=[],todo=[],shares=rcTaxShares(rows,f.tax,f.discount),dsh=rcDiscShares(rows,f.discount),tax=num(f.tax),disc=num(f.discount)>0?num(f.discount):null;let made=0,bought=0;   // RCPTTAX · RCPTDISC
  rows.forEach((r,ri)=>{const t=String(r.t||"").trim().slice(0,140),p=num(r.p),sh=shares[ri]||0,ds=dsh[ri]||0,line={t};if(p!=null)line.p=p;if(ds)line.disc=ds;if(sh)line.tax=sh;
    if(!r.nog){const fill={status,rcpt:rid};if(p!=null)fill.paid=Math.round((p-ds+sh)*100)/100;if(ds)fill.disc=ds;if(sh)fill.tax=sh;if(store)fill.store=store;if(ret)fill.returnBy=ret;if(ord)fill.orderNo=ord;
      const idea=r.useIdea&&r.idea&&(gfData.items||{})[r.idea];
      if(idea){line.item=r.idea;todo.push(()=>{Object.assign(idea,fill);write("gifts/items/"+r.idea,fill,"update");});bought++;}
      else{const iid=uid()+lines.length,pids=r.pids.slice(),rec=Object.assign({occ:oid,sec:r.sec||"",name:t,ts:Date.now()},fill);if(pids.length)rec.pids=pids;
        const pp=defaultPaper(pids,rec.sec,oid);if(pp)rec.paper=pp;line.item=iid;todo.push(()=>{node("items")[iid]=rec;write("gifts/items/"+iid,rec,"set");});made++;}}
    lines.push(line);});
  const sum=lines.reduce((a,l)=>a+(l.p||0),0)-(disc||0)+(tax||0),total=num(f.total)!=null?num(f.total):(lines.some(l=>l.p!=null)?Math.round(sum*100)/100:null);
  const rec={store,iso:isoOk(f.iso)||today(),lines,photoCount:f.files.length,occ:oid,ts:Date.now()};if(total!=null)rec.total=total;if(tax)rec.tax=tax;if(disc)rec.discount=disc;if(ord)rec.orderNo=ord;if(ret)rec.returnBy=ret;
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
        return '<div class="gf-rcline">'+(it?'<button class="gf-ib" onclick="gfEditItem(\''+esc(l.item)+'\')"><b>'+esc(l.t)+'</b>':'<span style="flex:1;color:#94a3b8">'+esc(l.t))+'<span class="gf-pc">'+esc(where)+'</span>'+(it?'</button>':'</span>')+'<span class="gf-amt">'+(l.p!=null&&(l.disc||l.tax)?money(Math.round((l.p-(l.disc||0)+(l.tax||0))*100)/100)+'<small> ('+money(l.p)+(l.disc?' − '+money(l.disc)+' off':'')+(l.tax?' + '+money(l.tax)+' tax':'')+')</small>':(l.p!=null?money(l.p):''))+'</span></div>';}).join("")+'</div>';}
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
.gf-kind{flex:1;text-align:center;border:1.5px dashed var(--border);border-radius:10px;padding:6px 2px;font-size:11px;font-weight:700;color:#94a3b8}
.gf-kind.on{border-style:solid;border-color:#7c3aed;color:#5b21b6;background:#f5f3ff}
.gf-kind b{display:block;font-size:14px}
.gf-rcnet{font-weight:900;color:#0f172a;font-size:12.5px}
.gf-rcline{display:flex;align-items:center;gap:8px;border-top:1px solid #f1f5f9;padding:7px 0;font-size:13px}
.gf-rcline .gf-pc{display:block;font-weight:500;font-size:11.5px;color:#64748b}
`;
Object.assign(window,{gfRcTaxed,gfRcRedraw,gfRcptNew,gfRcptPick,gfRcptDrop,gfRcptRead,gfRcSet,gfRcPid,gfRcNone,gfRcNog,gfRcSec,gfRcUseIdea,gfRcIdea,gfRcAdd,gfRcDel,gfRcStatus,gfRcptToggle,gfRcptPdf});
const RC_TEST={discShares:rcDiscShares,taxShares:rcTaxShares,split:rcSplit,load:rcptLoad,prompt:RC_PROMPT,firstJson,matchIdea,ideas,rcpts,photos:gfPhotos,open:()=>gfRcOpen,addFile:(url,pdf)=>{const f=rcF();if(f)f.files.push({url,pdf:!!pdf});}};
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
  const p=person(pid),T=personTot(o.id,pid),S=secsFor(o,[pid]),ord=s=>{const i=S.findIndex(x=>x.id===s);return i<0?99:i;};
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

// GIFTS_DAD_START — 👨 Dad sharing (her answer 2026-11-20 to "Who can see the gift list?": "dad can too if given permission from
// mom and that can be per person per holiday etc"; plan §5 answer 1. She never picked look-only or edit, so Mom picks per share:
// off · 👀 look · ✏️ edit).
// MOM'S SIDE (inside Gifts, Mom only as always):
//   · a person's page: 👨 Share with Dad — Off · 👀 Look · ✏️ Edit, for THIS holiday.   gifts/share/<oid>/<pid> = "look" | "edit"
//     (absent = off) — ONE targeted set / remove per person. A new holiday starts with nothing shared.
//   · a group card: the same three buttons set everyone in the group — one write EACH, only for the people whose share changes.
//   · the occasion card: "👨 Dad sees: <name> (edit), <name> (look)".
//   · "👨 This person is Dad" tick on a person who isn't a kid: gifts/people/<pid>.isDad (ONE update). That person can never be
//     shared (ticking it takes his shares away, one remove each), and a present whose pids include him NEVER renders on Dad's side,
//     whatever else is shared. One Dad at a time (ticking another unticks the first).
//   · giftShare/<oid> = true — its OWN top node (the giftPhotos pattern), no names: "something is shared for this holiday". Written
//     only when a holiday goes from nothing shared to something (set) or back (remove). It is all index.html reads to decide whether
//     Dad's Day shows "🎁 Gifts 🔒" — index.html still never reads gifts/.
// DAD'S SIDE (Dad's Day ▸ 🎁 Gifts → window.renderGiftsDad, drawn by this block only):
//   · THE SECRET: nothing under gifts/ is read until Dad's code has been typed THIS visit — index.html's giftDadOpen() (dadPinOk at
//     its lock screen; his ?kiosk=dad link alone is never enough, nor are his 🔒 Star controls). renderGiftsDad draws nothing and
//     starts no listener without it. Leaving the page, the screen sleeping, or 5 quiet minutes locks it again (index.html) and
//     gfDadLock() then stops the gifts/ listener and drops the data from this device's memory (unless Mom is using this device).
//   · he sees ONLY the holidays with someone shared, ONLY those people, ONLY their presents for that holiday: name, status,
//     planned / paid, 📍 where, 🎀 paper — and that person's own budget bar. A present shared with someone who is NOT shared with him
//     shows as "🤝 shared" and names only the people he is shared on (the safer pick: never a name he wasn't given).
//   · his totals add up only the presents he can see (so a hidden one can't be worked out from the sum).
//   · 👀 look = rows with no buttons at all (a present that is also for an ✏️ person is still read-only on the 👀 person's page).
//     ✏️ edit = ＋ a present for that person (ONE set: occ, pids:[that person], sec, name,
//     status, plan?, paid?, store?, where?, paper?, by:"dad") and, on a present, status / where / paper / paid (ONE update of just
//     the fields he changed). He can't move, re-assign, rename or delete anything. A 📜 Past holiday is look-only.
//   · never on his side: people not shared, ⚖️ Even, 🧾 receipts, the 🗄 Stash, presents for no one, wish lists, group / holiday
//     budgets and totals, reminders, notes, links — or anything for HIM.
//   · every change he makes is logged "Dad: …" in gifts/log.
// Honest limit: the database has one lock per family, so once unlocked Dad's device downloads the whole gifts/ node — the app just
// never shows him the rest. And the gift view is only as secret as Dad's code.
const GD_MODES=[["","Off"],["look","👀 Look"],["edit","✏️ Edit"]];
let gdRoot=null, gdAh="", gdOcc=null, gdPid=null, gdEdit=null;
function dadIds(){const S=gfData.people||{},o={};Object.keys(S).forEach(id=>{if(S[id]&&S[id].isDad&&!S[id].gone&&!/^k_/.test(id))o[id]=1;});return o;}
function shareRaw(oid,pid){const v=((gfData.share||{})[oid]||{})[pid];return v==="look"||v==="edit"?v:"";}
function shareMode(oid,pid){if(!oid||!pid||dadIds()[pid])return "";return people().some(p=>p.id===pid)?shareRaw(oid,pid):"";}   // what Dad really gets: never Dad himself, never someone taken off the list
function sharedPeople(oid){return people().filter(p=>shareMode(oid,p.id));}
function shareAny(oid){return sharedPeople(oid).length>0;}
function modeWord(m){return m==="edit"?"edit":m==="look"?"look":"off";}
function flagSync(oid,was){const now=shareAny(oid);if(now!==was)write("giftShare/"+oid,now?true:null,now?"set":"remove");}   // the no-names flag Dad's Day reads
function setShare(oid,pid,mode){   // ONE targeted write for this person — false when nothing changed
  mode=mode==="look"||mode==="edit"?mode:"";if(dadIds()[pid])mode="";
  if(shareRaw(oid,pid)===mode)return false;
  const S=node("share"),O=S[oid]=S[oid]||{};
  if(mode){O[pid]=mode;write("gifts/share/"+oid+"/"+pid,mode,"set");}
  else{delete O[pid];if(!Object.keys(O).length)delete S[oid];write("gifts/share/"+oid+"/"+pid,null,"remove");}
  return true;
}
function gfShareDad(pid,mode){
  const oid=curOcc(),o=occ(oid),p=person(pid);if(!o||!p)return;
  if(dadIds()[pid]){toast("That's Dad — his presents are never shared");return;}
  const was=shareAny(oid);
  if(setShare(oid,pid,mode)){flagSync(oid,was);log("👨 Dad + "+p.name+" for "+o.name+": "+modeWord(shareRaw(oid,pid)));}
  gfDraw();
}
function gfShareGroup(gid,mode){
  const oid=curOcc(),o=occ(oid);if(!o)return;const g=groups().find(x=>x.id===gid)||{},D=dadIds();
  const P=people().filter(p=>(p.group||"other")===gid&&!D[p.id]),was=shareAny(oid);let n=0;
  P.forEach(p=>{if(setShare(oid,p.id,mode))n++;});   // one write each, only where it changes
  if(n){flagSync(oid,was);const m=mode==="look"||mode==="edit"?mode:"";log("👨 Dad + "+(g.name||gid)+" ("+n+") for "+o.name+": "+modeWord(m));toast("✓ "+(g.name||"Group")+" — "+(m?"Dad can "+m:"not shared"));}
  gfDraw();
}
function gfDadIs(pid,on){   // "👨 This person is Dad" — never a kid; his shares go, everywhere
  const P=node("people"),cur=P[pid];if(!cur||/^k_/.test(pid))return;on=!!on;
  const was={};occs().forEach(o=>{was[o.id]=shareAny(o.id);});
  if(on){
    Object.keys(dadIds()).forEach(x=>{if(x!==pid){delete P[x].isDad;write("gifts/people/"+x,{isDad:null},"update");}});   // one Dad at a time
    cur.isDad=true;write("gifts/people/"+pid,{isDad:true},"update");
    Object.keys(gfData.share||{}).forEach(oid=>{if(shareRaw(oid,pid))setShare(oid,pid,"");});
  }else{if(!cur.isDad)return;delete cur.isDad;write("gifts/people/"+pid,{isDad:null},"update");}
  occs().forEach(o=>flagSync(o.id,was[o.id]));
  log("👨 "+(cur.name||pid)+(on?" is Dad — presents for him never show on his side":" is no longer marked as Dad"));gfDraw();
}
function dadStyle(){
  if(typeof document==="undefined"||!document.getElementById)return;
  try{if(!document.getElementById("gf-style")){const s=document.createElement("style");s.id="gf-style";s.textContent=GF_CSS+RC_CSS+OCC_CSS+GRP_CSS;document.head.appendChild(s);}   // Dad's side opens without Mom's page ever drawing
    if(!document.getElementById("gf-dad-style")){const s=document.createElement("style");s.id="gf-dad-style";s.textContent=DAD_CSS;document.head.appendChild(s);}}catch(e){}
}
function dadPickRow(cur,call){return GD_MODES.map(m=>'<button class="gf-pick'+(cur===m[0]?" on":"")+'" onclick="'+call(m[0])+'">'+m[1]+'</button>').join("");}
function dadShareCard(o,pid){   // Mom: on a person's page
  const p=person(pid);if(!o||!p)return "";dadStyle();
  const kid=/^k_/.test(pid),isD=!!dadIds()[pid],m=shareMode(o.id,pid),nm=esc(p.name),on=esc(o.name);
  let h='<div class="gf-card gf-dadc"><div class="gf-ghd"><span>👨 Share with Dad</span><span class="gf-gsum">'+on+'</span></div><div class="gf-bd">';
  if(isD)h+='<div class="gf-sub" style="margin:0">This is Dad. Presents for him never show on his side, and he can\'t be shared.</div>';
  else{h+='<div class="gf-picks">'+dadPickRow(m,v=>"gfShareDad('"+esc(pid)+"','"+v+"')")+'</div><div class="gf-sub" style="margin:6px 0 0">'+
      (m==="edit"?"✏️ Dad sees "+nm+"'s presents for "+on+" and can add one, or change a present's status, spot, paper and what was paid."
       :m==="look"?"👀 Dad sees "+nm+"'s presents for "+on+" — looking only."
       :"Off — Dad doesn't see "+nm+" for "+on+".")+
      ' He opens it from Dad\'s Day ▸ 🎁 Gifts with his code. Every holiday starts with nothing shared.</div>';
    if(!Object.keys(dadIds()).length)h+='<div class="gf-sub" style="margin:6px 0 0;color:#b45309">Is Dad on your list? Open his page and tick “This person is Dad” so presents for him never show on his side.</div>';}
  if(!kid&&(gfData.people||{})[pid])h+='<label class="gf-dadis"><input type="checkbox"'+(isD?" checked":"")+' onchange="gfDadIs(\''+esc(pid)+'\',this.checked)"> 👨 This person is Dad</label>';
  return h+'</div></div>';
}
function dadGroupRow(o,g){   // Mom: on a group card — the whole group in one tap
  if(!o||!g)return "";const D=dadIds(),P=people().filter(p=>(p.group||"other")===g.id&&!D[p.id]);if(!P.length)return "";dadStyle();
  const M=P.map(p=>shareMode(o.id,p.id)),all=M.every(x=>x===M[0])?M[0]:null,n=M.filter(Boolean).length;
  return '<div class="gf-dadg"><span>👨 Share all with Dad'+(n&&all===null?' · '+n+' of '+P.length+' shared':'')+'</span>'+dadPickRow(all,v=>"gfShareGroup('"+esc(g.id)+"','"+v+"')")+'</div>';
}
function dadSeesLine(o){   // Mom: on the occasion card
  if(!o)return "";const P=sharedPeople(o.id);if(!P.length)return "";
  return '<div class="gf-line">👨 Dad sees: '+P.map(p=>esc(p.name)+' ('+modeWord(shareMode(o.id,p.id))+')').join(", ")+'</div>';
}
// ── Dad's side ──
function dadIn(){try{return typeof giftDadOpen==="function"&&giftDadOpen()===true;}catch(e){return false;}}   // his code, typed this visit (index.html)
function dadOccs(){return occs().filter(o=>shareAny(o.id));}
function dadCurOcc(){
  const O=dadOccs();if(gdOcc&&O.some(o=>o.id===gdOcc))return gdOcc;
  const t=today(),open=O.filter(o=>!o.closed),next=open.find(o=>String(o.date||"")>=t)||open[open.length-1]||O[O.length-1];
  return gdOcc=next?next.id:null;
}
function dadSees(it,oid){const D=dadIds(),P=pidsOf(it);return !!it&&it.occ===oid&&P.length>0&&!P.some(x=>D[x])&&P.some(x=>shareMode(oid,x));}   // never one for Dad, never one for no one
function dadItems(oid,pid){return items(oid).filter(it=>dadSees(it,oid)&&(!pid||pidsOf(it).indexOf(pid)>=0));}
function dadCanEdit(it,pid){   // on <pid>'s page: only when THAT person is shared as ✏️ edit — a 👀 look page is read-only all the way down
  const o=it&&occ(it.occ);return !!o&&!o.closed&&dadSees(it,it.occ)&&!!pid&&pidsOf(it).indexOf(pid)>=0&&shareMode(it.occ,pid)==="edit";}
function dadTot(oid,pid){const T=tally(dadItems(oid,pid),it=>share(it,pid));T.budget=num(plan(oid,pid).budget);return T;}   // only what he can see + that person's own budget
function dadModeChip(m){return m==="edit"?chip("✏️ you can edit","#2C5F8A"):chip("👀 look only","#64748b");}
function dadRow(it,pid,oid){
  const s=st(it.status),others=pidsOf(it).filter(x=>x!==pid),seen=others.filter(x=>shareMode(oid,x)).map(x=>(person(x)||{}).name||"?");
  const who=others.length?chip("🤝 shared"+(seen.length?" with "+seen.join(", "):""),"#0e7490"):"";   // only names he was given
  const paid=num(it.paid),pl=num(it.plan),can=dadCanEdit(it,pid);
  const amt=paid!=null?money(paid):(pl!=null?'<span style="color:#64748b">plan '+money(pl)+'</span>':'—');
  const inner='<div class="gf-it"><b>'+esc(it.name)+'</b></div><div class="gf-im">'+chip(s[1],s[2])+who+(it.where?'<span>📍 '+esc(it.where)+'</span>':'')+(it.paper?'<span>🎀 '+esc(it.paper)+'</span>':'')+(paid!=null&&pl!=null?'<span>planned '+money(pl)+'</span>':'')+'</div>';
  return '<div class="gf-item'+(live(it)?'':' dead')+'">'+(can?'<button class="gf-ib" onclick="gdEditItem(\''+esc(it.id)+'\')">'+inner+'</button>':'<div class="gf-ib gd-ro">'+inner+'</div>')+
    '<div class="gf-ia"><div class="gf-amt">'+amt+'</div>'+(can?'<span class="gd-pen">✏️</span>':'')+'</div></div>';
}
function dadOccBar(){const O=dadOccs(),cur=dadCurOcc();if(O.length<2)return "";
  return '<div class="gf-occs">'+O.map(o=>'<button class="gf-occ'+(o.id===cur?" on":"")+'" onclick="gdPickOcc(\''+esc(o.id)+'\')">'+esc(o.name)+'</button>').join("")+'</div>';}
function dadListView(o){
  const P=sharedPeople(o.id);
  let h='<div class="gf-card"><div class="gf-hd"><span>'+esc(o.name)+'</span>'+(o.date&&!o.closed?'<span class="gf-days">'+daysTo(o.date)+'</span>':'')+'</div><div class="gf-bd"><div class="gf-line" style="color:#475569">Mom shared '+P.length+' '+(P.length===1?'person':'people')+' with you'+(o.closed?' — this one is over, so it\'s look only':'')+'. Everything else stays a surprise.</div></div></div>';
  h+='<div class="gf-card"><div class="gf-bd">'+P.map(p=>{const T=dadTot(o.id,p.id),m=o.closed?"look":shareMode(o.id,p.id);
    return '<button class="gf-prow" onclick="gdOpen(\''+esc(p.id)+'\')"><span class="gf-dot" style="background:'+esc(p.color||"#94a3b8")+'"></span>'+
      '<span class="gf-pn">'+esc(p.name)+' '+dadModeChip(m)+'<span class="gf-pc">'+(T.count?T.count+' present'+(T.count===1?'':'s')+' · '+counts(T):'nothing yet')+'</span>'+bar(T)+'</span>'+
      '<span class="gf-amt">'+money(T.paid)+(T.budget!=null?'<small> / '+money(T.budget)+'</small>':'')+'</span></button>';}).join("")+'</div></div>';
  return h;
}
function dadPersonView(o,pid){
  const p=person(pid),m0=shareMode(o.id,pid);if(!p||!m0){gdPid=null;return dadListView(o);}
  const m=o.closed?"look":m0,T=dadTot(o.id,pid),S=secsFor(o,[pid]),mine=dadItems(o.id,pid),known=S.map(s=>s.id);
  let h='<button class="gf-tool" style="margin-bottom:8px" onclick="gdBack()">← Everyone shared</button>';
  h+='<div class="gf-card"><div class="gf-hd" style="background:'+esc(p.color||"#475569")+'"><span>'+esc(p.name)+' · '+esc(o.name)+'</span></div><div class="gf-bd">'+bar(T)+'<div class="gf-line">'+sumLine(T)+'</div>'+
    '<div class="gf-line" style="color:#475569">'+T.count+' present'+(T.count===1?'':'s')+' · '+dadModeChip(m)+'</div>'+
    (m==="edit"?'<div class="gf-sub" style="margin:6px 0 0">Tap a present to change its status, spot, paper or what was paid. ＋ adds one for '+esc(p.name)+'.</div>':'')+'</div></div>';
  S.concat(mine.some(it=>known.indexOf(it.sec)<0)?[{id:"",emoji:"📦",name:"No section"}]:[]).forEach(s=>{
    const L=mine.filter(it=>s.id?it.sec===s.id:known.indexOf(it.sec)<0);if(!L.length&&m!=="edit")return;
    h+='<div class="gf-card"><div class="gf-ghd"><span>'+esc(s.emoji||"")+' '+esc(s.name)+'</span><span class="gf-gsum"></span>'+(m==="edit"&&s.id?'<button class="gf-tool" onclick="gdNew(\''+esc(pid)+'\',\''+esc(s.id)+'\')">＋</button>':'')+'</div>'+
      '<div class="gf-bd">'+(L.length?L.map(it=>dadRow(it,pid,o.id)).join(""):'<div class="gf-empty">Nothing here yet.</div>')+'</div></div>';});
  if(!mine.length&&m!=="edit")h+='<div class="gf-card"><div class="gf-empty">No presents for '+esc(p.name)+' yet.</div></div>';
  return h;
}
function gdField(k,label,ph,type){const f=gdEdit.form;return '<label class="gf-f"><span>'+label+'</span><input id="gd-f-'+k+'"'+(type==="money"?' inputmode="decimal"':'')+' value="'+esc(f[k])+'" placeholder="'+esc(ph||"")+'" oninput="gdSet(\''+k+'\',this.value)"></label>';}
function gdSheetInner(){   // every box has an id (gd-f-<field>) so the app's own repaint (_preserveUI) puts his cursor back mid-typing
  const E=gdEdit,f=E.form,nw=E.kind==="new",o=occ(dadCurOcc()),it=nw?null:(gfData.items||{})[E.id];
  let h='<button class="gf-x" onclick="gdCancel()">✕</button><div style="font-weight:800;font-size:15px;margin-bottom:8px">'+(nw?"➕ New present for "+esc((person(E.pid)||{}).name||""):"✏️ "+esc((it||{}).name||"Present"))+'</div><div class="gf-form">';
  if(nw){h+='<label class="gf-f wide"><span>What</span><input id="gd-f-name" value="'+esc(f.name)+'" placeholder="e.g. LEGO treehouse" oninput="gdSet(\'name\',this.value)"></label>';
    h+='<div class="gf-f wide"><span>Section</span><div class="gf-picks">'+secsFor(o,[E.pid]).map(s=>'<button class="gf-pick'+(f.sec===s.id?" on":"")+'" onclick="gdSetDraw(\'sec\',\''+esc(s.id)+'\')">'+esc((s.emoji||"")+" "+s.name)+'</button>').join("")+'</div></div>';}
  h+='<div class="gf-f wide"><span>Status</span><div class="gf-picks">'+GF_STATUS.map(s=>'<button class="gf-pick'+(f.status===s[0]?" on":"")+'" onclick="gdSetDraw(\'status\',\''+s[0]+'\')">'+esc(s[1])+'</button>').join("")+'</div></div>';
  if(nw)h+=gdField("plan","Planned $","","money");
  h+=gdField("paid","Paid $","","money");
  if(nw)h+=gdField("store","Store","e.g. Target");
  h+='<div class="gf-f wide">'+gdField("where","📍 Where it's hidden","e.g. garage, top shelf")+'</div><div class="gf-f wide">'+gdField("paper","🎀 Wrapping paper","e.g. gold stars")+'</div></div>';
  return h+'<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap"><button class="gf-tool gf-save" onclick="gdSave()">Save</button><button class="gf-tool" onclick="gdCancel()">Cancel</button></div>';
}
function gdSheet(){return gdEdit?'<div id="gd-sheet" onclick="if(event.target.id===\'gd-sheet\')gdCancel()"><div class="gf-sh">'+gdSheetInner()+'</div></div>':"";}
function gdDraw(){
  if(!gdRoot)return;
  if(!dadIn()){gdEdit=null;gdRoot.innerHTML=gdAh+'<div class="gf-empty" style="padding:40px">🔒 Locked.</div>';return;}
  let body;
  if(!gfLoaded)body='<div class="gf-empty" style="padding:40px">Loading…</div>';
  else{const oid=dadCurOcc(),o=oid&&occ(oid);
    body=o?dadOccBar()+(gdPid?dadPersonView(o,gdPid):dadListView(o)):'<div class="gf-card"><div class="gf-empty" style="padding:24px">Nothing is shared with you right now.</div></div>';
    if(!o)gdEdit=null;}
  gdRoot.innerHTML=gdAh+'<div id="gd-page"><div class="gf-wrap"><div class="gf-title">🎁 Gifts <span class="gd-tag">shared with Dad</span></div>'+body+'</div></div>'+gdSheet();
}
function dadOnData(){if(gdRoot&&!gdEdit)gdDraw();}   // gifts/ changed (Mom shared or bought something) while he's looking
function gdPickOcc(id){gdOcc=id;gdPid=null;gdEdit=null;gdDraw();}
function gdOpen(pid){gdPid=pid;gdEdit=null;gdDraw();try{window.scrollTo(0,0);}catch(e){}}
function gdBack(){gdPid=null;gdEdit=null;gdDraw();}
function gdCancel(){gdEdit=null;gdDraw();}
function gdSet(k,v){if(gdEdit)gdEdit.form[k]=v;}
function gdSetDraw(k,v){if(!gdEdit)return;gdEdit.form[k]=v;let sh=null;try{sh=gdRoot&&gdRoot.querySelector&&gdRoot.querySelector("#gd-sheet .gf-sh");}catch(e){}
  if(sh){const keep=sh.scrollTop||0;sh.innerHTML=gdSheetInner();try{sh.scrollTop=keep;}catch(e){}}else gdDraw();}   // the pop-up keeps its place (SHEETINPLACE)
function gdEditItem(id){
  const it=(gfData.items||{})[id];if(!dadIn()||!it||!dadCanEdit(Object.assign({id},it),gdPid))return;
  gdEdit={kind:"edit",id,pid:gdPid,form:{status:it.status||"idea",where:it.where||"",paper:it.paper||"",paid:it.paid==null?"":String(it.paid)}};gdDraw();
}
function gdNew(pid,sid){
  const oid=dadCurOcc(),o=occ(oid);if(!dadIn()||!o||o.closed||shareMode(oid,pid)!=="edit")return;
  const S=secsFor(o,[pid]),sec=S.some(s=>s.id===sid)?sid:((S[0]&&S[0].id)||"");
  gdEdit={kind:"new",id:null,pid,form:{name:"",sec,status:"idea",plan:"",paid:"",store:"",where:"",paper:defaultPaper([pid],sec,oid)}};gdDraw();
}
function gdSave(){
  if(!gdEdit)return;if(!dadIn()){gdEdit=null;return gdDraw();}
  const E=gdEdit,f=E.form,stOk=GF_STATUS.some(s=>s[0]===f.status);
  if(E.kind==="edit"){
    const it=(gfData.items||{})[E.id];if(!it||!dadCanEdit(Object.assign({id:E.id},it),E.pid)){gdEdit=null;return gdDraw();}
    const up={},said=[];   // ONLY status / where / paper / paid, and only what he changed
    if(stOk&&f.status!==(it.status||"idea")){up.status=f.status;said.push(st(f.status)[1]);}
    [["where","📍"],["paper","🎀"]].forEach(x=>{const v=String(f[x[0]]||"").trim().slice(0,80);if(v!==String(it[x[0]]||"")){up[x[0]]=v||null;said.push(x[1]+" "+(v||"cleared"));}});
    const pd=num(f.paid);if(pd!==num(it.paid)){up.paid=pd;said.push(pd==null?"paid cleared":"paid "+money(pd));}
    if(Object.keys(up).length){Object.keys(up).forEach(k=>{if(up[k]==null)delete it[k];else it[k]=up[k];});
      write("gifts/items/"+E.id,up,"update");log("Dad: "+it.name+" — "+said.join(" · "));toast("✓ Saved");}
  }else{
    const pid=E.pid,oid=dadCurOcc(),o=occ(oid),p=person(pid);if(!o||o.closed||!p||shareMode(oid,pid)!=="edit"){gdEdit=null;return gdDraw();}
    const name=String(f.name||"").trim().slice(0,140);if(!name){toast("What is it?");return;}
    const S=secsFor(o,[pid]),rec={occ:oid,pids:[pid],sec:S.some(s=>s.id===f.sec)?f.sec:((S[0]&&S[0].id)||""),name,status:stOk?f.status:"idea",ts:Date.now(),by:"dad"};
    ["store","where","paper"].forEach(k=>{const v=String(f[k]||"").trim().slice(0,80);if(v)rec[k]=v;});
    ["plan","paid"].forEach(k=>{const v=num(f[k]);if(v!=null)rec[k]=v;});
    const iid=uid();node("items")[iid]=rec;write("gifts/items/"+iid,rec,"set");
    log("Dad: added "+name+" → "+p.name+(rec.paid!=null?" "+money(rec.paid):""));toast("✓ Added");
  }
  gdEdit=null;gdDraw();
}
function gfDadLock(){   // index.html: he left the page, the screen slept, or 5 quiet minutes — forget it all on this device
  gdRoot=null;gdEdit=null;gdPid=null;gdOcc=null;
  let mom=false;try{mom=typeof momHere==="function"&&momHere();}catch(e){}
  if(mom||!gfOn)return;   // Mom's own Gifts on this device keeps its listener
  try{if(typeof db!=="undefined"&&db){const r=db.ref("gifts");if(r&&typeof r.off==="function")r.off();}}catch(e){}
  gfData={};gfLoaded=false;gfOn=false;
}
window.renderGiftsDad=function(el,ah){
  if(!el)return;
  if(!dadIn()){gdRoot=null;el.innerHTML=(ah||"")+'<div class="gf-empty" style="padding:40px">🔒 Dad\'s code first.</div>';return;}   // no code this visit → nothing is read, nothing is drawn
  dadStyle();gdRoot=el;gdAh=ah||"";gfListen();gdDraw();
};
const DAD_CSS=`
.gf-dadc .gf-bd{padding-top:4px}
.gf-dadis{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12.5px;font-weight:700;color:#334155;cursor:pointer}
.gf-dadis input{width:18px;height:18px;flex:none}
.gf-dadg{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:4px 14px 0;font-size:11.5px;color:#64748b;font-weight:700}
.gf-dadg span{flex:1;min-width:120px}
.gf-dadg .gf-pick{padding:3px 9px;font-size:11.5px}
#gd-sheet{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:300;display:flex;align-items:flex-end;justify-content:center}
.gd-tag{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:800;color:#2C5F8A;background:#e0ecf7;border-radius:99px;padding:2px 9px;vertical-align:middle;margin-left:6px}
.gd-ro{cursor:default}
.gd-pen{font-size:12px;opacity:.6}
`;
Object.assign(window,{gfShareDad,gfShareGroup,gfDadIs,gfDadLock,gdPickOcc,gdOpen,gdBack,gdCancel,gdSet,gdSetDraw,gdEditItem,gdNew,gdSave});
window._gfDadTest={shareMode,shareRaw,shareAny,sharedPeople,dadIds,dadOccs,dadItems,dadSees,dadCanEdit,dadTot,dadSeesLine,dadGroupRow,dadShareCard,edit:()=>gdEdit,pid:()=>gdPid,root:()=>gdRoot,on:()=>gfOn,loaded:()=>gfLoaded,draw:gdDraw};
// GIFTS_DAD_END

// GIFTS_REMIND_START — ⏰ Reminders, slice 5 (plan §3.6 "Reminders (inside Mom's Day only)" + §4 slice 5: "⏰ return windows (and
// early buys whose window ends before the 25th) · 📦 late orders · 🚚 order-by date · 🎀 left to wrap · 🔎 Jan 2 'never marked given'
// — on the Budget tab and in 🔴 NOW on Home Base"). Computed from the presents + receipts every time, never stored. Each reminder is
// {kind, text, n, view, occ}; a tap opens that view on that occasion.
//   🌙 eve     Christmas Eve from 5 PM: time to gather → 🌙 Eve
//   ⏰ return  a present's return window (its own returnBy, else its receipt's) closes within 7 days; a receipt with no present on it
//              counts on its own · given / returned / dropped presents never nag → 🧾 Receipts
//   📦 late    ordered presents past their 📦 coming-by date ("3 orders should have come by now") → 📦 Coming
//   🚚 orderby from 7 days before the occasion's order-by date: "Order the last presents by Tue Dec 15 — N ideas not bought yet" → 🛍 Shop.
//              The date is hers: gifts/occasions/<oid>.orderBy, set on ✏️ (Christmas with none = Dec 15; USPS Ground's 2025 cut-off
//              was Dec 17, so Dec 15 leaves two days' room)
//   🎀 wrap    the 7 days before an occasion: presents here and not wrapped → 🎀 To wrap
//   ⏰ early   bought early: a return window that ends BEFORE the occasion (plan §3.6 "anything bought before November gets a nudge if
//              its normal return window ends before the 25th") — once it's 7 days off it moves to the ⏰ return line → 🧾 Receipts
//   🔎 hidden  Jan 2–10 after a Christmas: presents bought but never marked given — "still hidden?" (55% of parents find one later) → 📍 Where
// The SAME lines show at the top of Gifts and in 🔴 NOW on Mom's Day ▸ 🏡 Home Base: index.html never reads gifts/ itself (plan §3.7) —
// it asks window.giftNowLines(), which answers [] for anyone but Mom and on Dad's TV (?kiosk=dad), starts the gifts/ listener only for
// Mom, answers [] until gifts/ is in, then asks Home Base to repaint ONCE (giftNowRepaint, index.html's GIFTS block).
// SECRET: a line says "presents", never a present's name or who it's for — Home Base can be seen by a kid walking by. Names stay
// inside Gifts. Her rule 2026-11-20 ("reword the santa section in case a kid sees it … so the reminders don't pop up saying it"):
// no reminder ever names a section either (no "Santa") — only counts and neutral words (presents, orders, ideas, to wrap).
// Data: only gifts/occasions/<oid>.orderBy, inside the occasion sheet's ONE update.
const REM_DAYS=7, REM_EVE_HOUR=17, REM_ORDER_BY="12-15";
const REM_KINDS=["eve","return","late","orderby","wrap","early","hidden"];   // most urgent first
const REM_WD=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], REM_MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let gfNowWant=false;   // Home Base asked for its lines → repaint it once when gifts/ first arrives
function isIso(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||""));}
function dayDiff(a,b){return Math.round((new Date(String(b)+"T12:00:00")-new Date(String(a)+"T12:00:00"))/864e5);}
function addDays(iso,n){const d=new Date(String(iso)+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function remDate(iso){const d=new Date(String(iso)+"T12:00:00");return isNaN(d)?String(iso):REM_WD[d.getDay()]+" "+REM_MO[d.getMonth()]+" "+d.getDate();}
function remWhen(t,iso){const d=dayDiff(t,iso);return d===0?"today":d===1?"tomorrow":remDate(iso);}
function plural(n,w){return n+" "+w+(n===1?"":"s");}
function occWord(o){return o.kind==="christmas"?"Christmas":o.kind==="birthday"?"the birthday":o.kind==="easter"?"Easter":"the day";}   // never the occasion's own name on Home Base
function orderByOf(o){if(!o)return "";if(isIso(o.orderBy))return o.orderBy;return o.kind==="christmas"&&isIso(o.date)?o.date.slice(0,4)+"-"+REM_ORDER_BY:"";}
function retBy(it){if(isIso(it.returnBy))return it.returnBy;const r=it.rcpt&&(gfData.receipts||{})[it.rcpt];return r&&isIso(r.returnBy)?r.returnBy:"";}
function bareRcpts(oid){   // receipts for this occasion that no present came from (she typed just the total) — their window still matters
  const R=gfData.receipts||{},I=gfData.items||{};
  return Object.keys(R).map(id=>Object.assign({id},R[id])).filter(r=>r.occ===oid&&isIso(r.returnBy)&&!(r.lines||[]).some(l=>l&&l.item&&I[l.item])&&!Object.keys(I).some(k=>I[k].rcpt===r.id));
}
function giftReminders(t,hour){
  t=isIso(t)?t:today();if(hour==null)hour=new Date().getHours();
  const out=[],byOcc={},md=t.slice(5);
  items().forEach(it=>{(byOcc[it.occ]=byOcc[it.occ]||[]).push(it);});
  const add=(kind,o,n,view,text)=>{out.push({kind,text,n,view,occ:o.id,occName:o.name||"",date:o.date||""});};
  occs().forEach(o=>{
    const L=(byOcc[o.id]||[]).filter(live),open=!o.closed,dd=isIso(o.date)?dayDiff(t,o.date):null,word=occWord(o);
    const unGiven=L.filter(it=>(it.status||"idea")!=="given"),inHouse=L.filter(it=>["here","wrapped","out","packed"].indexOf(it.status)>=0);   // JOURNEY: 🎄 / 🚗 aren't given yet
    // 🌙 Christmas Eve, from 5 PM
    if(open&&o.kind==="christmas"&&dd===1&&hour>=REM_EVE_HOUR&&L.length){const setOut=L.filter(it=>atHome(it)&&(it.status==="here"||it.status==="wrapped"));add("eve",o,setOut.length,"eve","🌙 Time to gather"+(setOut.length?" — "+plural(setOut.length,"present")+" to set out":"")+" · open 🌙 Eve");}   // JOURNEY: the home ones not under the tree yet
    // ⏰ a return window closes within 7 days
    const soon=unGiven.filter(it=>it.status!=="idea"&&retBy(it)&&dayDiff(t,retBy(it))>=0&&dayDiff(t,retBy(it))<=REM_DAYS);
    const bare=bareRcpts(o.id).filter(r=>dayDiff(t,r.returnBy)>=0&&dayDiff(t,r.returnBy)<=REM_DAYS);
    if(soon.length||bare.length){
      const n=soon.length+bare.length,first=soon.map(retBy).concat(bare.map(r=>r.returnBy)).sort()[0];
      const what=[soon.length?plural(soon.length,"present"):"",bare.length?plural(bare.length,"receipt"):""].filter(Boolean).join(" and ");
      add("return",o,n,"receipts",n===1?"⏰ The return window for "+what+" closes "+remWhen(t,first):"⏰ Return windows close this week for "+what+" — the first "+remWhen(t,first));
    }
    // 📦 ordered and should be here by now
    const late=L.filter(it=>it.status==="ordered"&&isIso(it.due)&&it.due<t);
    if(late.length)add("late",o,late.length,"coming","📦 "+plural(late.length,"order")+" should have come by now");
    // 🚚 her order-by date, from 7 days before it
    const ob=orderByOf(o),dob=ob?dayDiff(t,ob):null,ideasLeft=L.filter(it=>(it.status||"idea")==="idea");
    if(open&&ob&&dob>=0&&dob<=REM_DAYS&&(dd==null||dd>=0)&&ideasLeft.length)
      add("orderby",o,ideasLeft.length,"shop","🚚 Order the last presents by "+remWhen(t,ob)+" — "+plural(ideasLeft.length,"idea")+" not bought yet");
    // 🎀 the week of: still to wrap
    const toWrap=L.filter(it=>it.status==="here"||it.status==="ordered");   // JOURNEY: everything bought, not wrapped
    if(open&&dd!=null&&dd>=0&&dd<=REM_DAYS&&toWrap.length)
      add("wrap",o,toWrap.length,"wrap","🎀 "+plural(toWrap.length,"present")+" still to wrap — "+word+(dd===0?" is today":dd===1?" is tomorrow":" in "+dd+" days"));
    // ⏰ bought early: the window ends before the day (and isn't this week's ⏰ line yet)
    const early=open&&dd!=null&&dd>0?unGiven.filter(it=>{const r=retBy(it);return it.status!=="idea"&&r&&r<o.date&&dayDiff(t,r)>REM_DAYS;}):[];
    if(early.length){const first=early.map(retBy).sort()[0];
      add("early",o,early.length,"receipts",early.length===1?"⏰ 1 present's return window ends "+remDate(first)+" — before "+word:"⏰ "+early.length+" presents' return windows end before "+word+" — the first "+remDate(first));}
    // 🔎 Jan 2–10 after Christmas: bought, never marked given
    if(o.kind==="christmas"&&isIso(o.date)&&o.date<t&&md>="01-02"&&md<="01-10"&&+t.slice(0,4)===+o.date.slice(0,4)+1&&inHouse.length)
      add("hidden",o,inHouse.length,"where","🔎 "+plural(inHouse.length,"present")+" never got marked given — still hidden?");
  });
  return out.sort((a,b)=>REM_KINDS.indexOf(a.kind)-REM_KINDS.indexOf(b.kind)||String(a.date).localeCompare(String(b.date)));
}
function giftNowLines(){   // 🔴 NOW on Home Base — Mom only, never Dad's TV; [] until gifts/ is in
  try{if(typeof momHere!=="function"||!momHere())return [];if(typeof _kioskD==="function"&&_kioskD())return [];}catch(e){return [];}
  gfNowWant=true;gfListen();if(!gfLoaded)return [];
  return giftReminders(today()).map(r=>({kind:r.kind,text:r.text,n:r.n,view:r.view,occ:r.occ}));   // no occasion name, no present names
}
function nowRepaint(){if(!gfNowWant)return;try{if(typeof giftNowRepaint==="function")giftNowRepaint();}catch(e){}}
function gfRemGo(view,oid,quiet){   // a reminder tapped (here, or on Home Base with quiet = index.html opens Gifts itself)
  if(oid&&occ(oid)){gfOcc=oid;try{HA_LS.setItem("ha_gf_occ",oid);}catch(e){}}
  gfView=GF_VIEWS.some(v=>v[0]===view)?view:"people";gfSelOn=false;gfSel={};gfEdit=null;
  if(!quiet){gfDraw();try{window.scrollTo(0,0);}catch(e){}}
}
function remCard(){   // top of the Gifts page, above the occasions + views
  if(!gfLoaded)return "";const R=giftReminders(today());if(!R.length)return "";
  if(typeof document!=="undefined"&&document.getElementById&&!document.getElementById("gf-rem-style")){try{const s=document.createElement("style");s.id="gf-rem-style";s.textContent=REM_CSS;document.head.appendChild(s);}catch(e){}}
  const many=occs().filter(o=>!o.closed).length>1,cur=curOcc();
  return '<div class="gf-card gf-rem"><div class="gf-bd">'+R.map(r=>'<button class="gf-remrow'+(r.view===gfView&&r.occ===cur?" on":"")+'" onclick="gfRemGo(\''+esc(r.view)+'\',\''+esc(r.occ)+'\')"><span class="gf-pn">'+esc(r.text)+
    (many||r.occ!==cur?'<span class="gf-pc">'+esc(r.occName)+'</span>':'')+'</span><span class="gf-remgo">›</span></button>').join("")+'</div></div>';
}
function remOrderField(f){   // ✏️ occasion (gfEdit.id — the form itself has no id): her own order-by date (Christmas with none = Dec 15)
  if(!gfEdit||!gfEdit.id)return "";const def=f.kind==="christmas"&&isIso(f.date)?f.date.slice(0,4)+"-"+REM_ORDER_BY:"";
  return field("orderBy","🚚 Order the last presents by"+(def?" (empty = "+shortDate(def)+")":""),"","date");
}
const REM_CSS=`
.gf-rem{border:2px solid #fcd34d;box-shadow:none}
.gf-rem .gf-bd{padding:4px 12px}
.gf-remrow{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:none;border-top:1px solid #fef3c7;padding:8px 0;cursor:pointer;font:inherit;color:inherit}
.gf-remrow:first-child{border-top:none}
.gf-remrow .gf-pn{font-size:13px;font-weight:700}
.gf-remrow.on .gf-pn{color:#92400e}
.gf-remgo{font-size:18px;font-weight:800;color:#b45309}
`;
Object.assign(window,{gfRemGo,giftNowLines,giftReminders});
window._gfRemTest={giftReminders,orderByOf,retBy,remDate,nowWant:()=>gfNowWant,setNowWant:v=>{gfNowWant=!!v;},setLoaded:v=>{gfLoaded=!!v;},on:()=>gfOn,setOn:v=>{gfOn=!!v;}};
// GIFTS_REMIND_END

// GIFTS_GROUPS_START — group buttons + each group's own sections (her ask 2026-11-20: "I do like having the four kids there easy
// because they're the ones I'm going to be buying for the most. But then maybe a button beside it that has the other group … if you
// click that button, it then shows that group and makes like the kids disappear unless you click back to the kids button, but the
// kids should be open … And then those wouldn't have the categories that the kids have … connect those with whatever groups that
// particular group has made" — and her "yes" to this design the same day).
//   · 👨‍👩‍👧 People: a row of buttons — 👧 Kids · each group that has people · ＋ Group. Gifts always OPENS on Kids (a fresh visit;
//     a redraw while she's on the page keeps her pick). A group's button shows only that group (its people, its total + budget bar);
//     the occasion card on top keeps the whole occasion's total (everyone).
//   · A group other than Kids has its OWN sections, kept across occasions: gifts/groups/<gid>/secs/<sid> {name, emoji, order}.
//     None saved = one section 🎁 Gifts (id "gifts", nothing written until she edits). ✏️ Sections in that group's view adds and
//     renames — ONE update per section that changed (when a group has none saved yet, 🎁 Gifts is saved with her first change, so
//     presents already in it stay in it). The kids keep the occasion's sections (gifts/occasions/<oid>/secs).
//   · Section choices follow the person (the first one picked): a kid → the occasion's sections, anyone else → their group's — in
//     the present sheet, ↪ Move, the person page, their 💲 budget sheet and the receipt check screen's per-line chips. A present
//     whose section isn't in its person's list shows under 📦 No section (as before).
const GRP_GIFTS={id:"gifts",emoji:"🎁",name:"Gifts",order:0};
let gfGrp="kids";   // the group button she picked (People view)
function grpSecs(gid){
  const s=(((gfData.groups||{})[gid])||{}).secs||{};
  const L=Object.keys(s).filter(id=>s[id]&&typeof s[id]==="object").map(id=>Object.assign({id},s[id])).sort((a,b)=>(a.order||0)-(b.order||0));
  return L.length?L:[Object.assign({virtual:true},GRP_GIFTS)];
}
function grpOfPids(pids){const p=(pids||[]).length?person(pids[0]):null;return p?(p.group||"other"):"kids";}   // no one yet → the occasion's
function secsFor(o,pids){const g=grpOfPids(pids);return g==="kids"?secsOf(o):grpSecs(g);}
function grpSecFix(f){const S=secsFor(occ(f.occ),f.pids);if(!S.some(s=>s.id===f.sec))f.sec=(S[0]&&S[0].id)||"";}   // a new person → their group's first section
function rcSecs(o,r){const S=secsFor(o,r.pids);if(!S.some(s=>s.id===r.sec))r.sec=(S[0]&&S[0].id)||"";return S;}   // a receipt line's chips follow its person
function grpTabs(){const P=people();return groups().filter(g=>g.id!=="kids"&&P.some(p=>(p.group||"other")===g.id));}
function curGrp(){return gfGrp!=="kids"&&grpTabs().some(g=>g.id===gfGrp)?gfGrp:"kids";}
function grpOpen(el){let here=false;try{here=!!(el&&el.querySelector&&el.querySelector("#gf-page"));}catch(e){}if(!here)gfGrp="kids";}
function grpBar(){
  const cur=curGrp(),K=groups().find(g=>g.id==="kids")||{emoji:"👧",name:"Kids"};
  const b=(id,g)=>'<button class="gf-grp'+(cur===id?" on":"")+'" onclick="gfGroup(\''+esc(id)+'\')">'+esc((g.emoji?g.emoji+" ":"")+g.name)+'</button>';
  return '<div class="gf-grps">'+b("kids",K)+grpTabs().map(g=>b(g.id,g)).join("")+'<button class="gf-grp add" onclick="gfNewGroup()">＋ Group</button></div>';
}
function grpSecLine(g){
  if(g.id==="kids")return "";
  return '<div class="gf-grpsec"><span>'+grpSecs(g.id).map(s=>esc((s.emoji||"")+" "+s.name)).join(" · ")+(g.giveAt?' · 🚗 given at '+esc(g.giveAt):'')+'</span><button class="gf-tool gf-mini" onclick="gfGrpSecs(\''+esc(g.id)+'\')">✏️ Sections</button></div>';
}
function gfGroup(gid){gfGrp=gid||"kids";gfDraw();}
function gfGrpSecs(gid){gfEdit={kind:"gsecs",id:gid,form:{gid,giveAt:(((gfData.groups||{})[gid])||{}).giveAt||"",secs:grpSecs(gid).map(s=>({id:s.id,emoji:s.emoji||"",name:s.name||"",virtual:!!s.virtual}))}};gfDraw();}
function grpSecsSheet(){
  const f=gfEdit.form,g=groups().find(x=>x.id===f.gid)||{};
  return '<div class="gf-form"><div class="gf-sub wide" style="margin:0">'+esc((g.emoji?g.emoji+" ":"")+(g.name||""))+' — these sections are for everyone in this group, every occasion. The kids keep the occasion\'s own sections.</div>'+
    '<div class="gf-f wide"><span>Sections</span>'+f.secs.map((s,i)=>'<div style="display:flex;gap:6px;margin-top:4px"><input style="width:56px" value="'+esc(s.emoji)+'" oninput="gfSecEdit('+i+',\'emoji\',this.value)"><input value="'+esc(s.name)+'" placeholder="e.g. Stocking" oninput="gfSecEdit('+i+',\'name\',this.value)"></div>').join("")+
    '<button class="gf-tool" style="margin-top:6px;align-self:flex-start" onclick="gfSecAdd()">＋ Section</button></div>'+
    '<div class="gf-f wide">'+field("giveAt","🎁 Usually given at (blank = 🏠 home)","e.g. Grandma's house")+picks("giveAt",placeChoices())+'</div></div>';   // JOURNEY
}
function grpSecsSave(f){   // ONE update per section that changed, under gifts/groups/<gid>/secs/<sid>
  const gid=f.gid,G=node("groups"),g=G[gid]=Object.assign({},G[gid]||{}),secs=g.secs=Object.assign({},g.secs||{});
  {const ga=String(f.giveAt||"").trim().slice(0,60);if(ga!==(g.giveAt||"")){if(ga)g.giveAt=ga;else delete g.giveAt;write("gifts/groups/"+gid,{giveAt:ga||null},"update");}}   // JOURNEY: the group's usual place
  const rows=f.secs.map(s=>({s,nm:String(s.name||"").trim().slice(0,40),em:String(s.emoji||"").trim()||"🎁"})).filter(x=>x.nm);
  const same=(x,old)=>old&&old.name===x.nm&&old.emoji===x.em;
  const any=rows.some(x=>!x.s.id||!same(x,x.s.virtual?GRP_GIFTS:secs[x.s.id]));   // anything new or renamed?
  let next=Math.max(Object.keys(secs).reduce((m,k)=>Math.max(m,+(secs[k].order)||0),-1)+1,rows.some(x=>x.s.virtual)?1:0),n=0;   // 🎁 Gifts keeps 0
  rows.forEach(x=>{
    if(!any)return;const old=x.s.virtual?null:secs[x.s.id];if(old&&same(x,old))return;
    const sid=x.s.id||newId2(secs,slug(x.nm)),rec={name:x.nm,emoji:x.em,order:old?(+old.order||0):x.s.virtual?0:next++};
    secs[sid]=Object.assign({},old||{},rec);write("gifts/groups/"+gid+"/secs/"+sid,rec,"update");n++;
  });
  if(!Object.keys(secs).length)delete g.secs;
  if(n)log("Sections for "+((groups().find(x=>x.id===gid)||{}).name||gid)+": "+grpSecs(gid).map(s=>s.name).join(", "));
}
const GRP_CSS=`
.gf-grps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.gf-grp{padding:8px 14px;border-radius:12px;border:1.5px solid var(--border);background:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;color:#334155}
.gf-grp.on{background:#0f172a;color:#fff;border-color:#0f172a}
.gf-grp.add{border-style:dashed;color:#64748b;font-size:12px}
.gf-grpsec{display:flex;align-items:center;gap:8px;padding:2px 14px 0;font-size:11.5px;color:#64748b;font-weight:600}
.gf-grpsec span{flex:1;min-width:0}
`;
Object.assign(window,{gfGroup,gfGrpSecs});
const GRP_TEST={secsFor,grpSecs,grpTabs,cur:()=>curGrp(),set:g=>{gfGrp=g;},open:grpOpen};
// GIFTS_GROUPS_END

function gfDraw(){
  if(!gfRoot)return;
  let body;
  if(!gfLoaded)body='<div class="gf-empty" style="padding:40px">Loading presents…</div>';
  else{const oid=curOcc(),o=oid&&occ(oid);
    const V={even:evenView,wrap:wrapView,where:whereView,coming:comingView,shop:shopView,closet:closetView,going:goingView,eve:eveView,receipts:rcptView};
    body=(!o||gfView==="people"?bdayNudges():"")+   // GIFTS_OCC: 🎂 at the top of Gifts
      remCard()+   // GIFTS_REMIND: ⏰ reminders above the occasions + views
      (o?occBar()+viewNav()+(gfView==="person"&&gfPid?personView(o,gfPid):V[gfView]?V[gfView](o):peopleView(o)):emptyView());}
  // SHEETSCROLL (her report 2026-11-20, adding a receipt: "every time I click something, it jumps it back up to the top"): every tap
  // redraws the page AND the open pop-up, and a fresh pop-up starts scrolled to the top. Keep the pop-up's place when the SAME pop-up
  // is still open after the redraw (a different one — ↪ Move from a present, say — still starts at the top).
  // SHEETINPLACE (her report 2026-11-20, after SHEETSCROLL went live: "it was fixed and now not working again" — tapping ✕ Not a gift
  // on a receipt still bounced to the top): putting the scroll back after rebuilding the pop-up isn't enough on every browser (a
  // phone/iPad browser can reset it after the rebuild). So while the SAME pop-up stays open, the pop-up itself is never rebuilt:
  // the page behind it and the pop-up's insides are redrawn in place, and the pop-up box — and its scroll — simply stays.
  const shKey=gfEdit?gfEdit.kind+":"+(gfEdit.id||""):"";let shTop=0;
  const page=gfAh+'<div class="gf-wrap"><div class="gf-title">🎁 Gifts</div>'+body+'</div>'+selBar();
  let pageEl=null,shEl=null;try{pageEl=gfRoot.querySelector&&gfRoot.querySelector("#gf-page");shEl=gfRoot.querySelector&&gfRoot.querySelector("#gf-sheet .gf-sh");}catch(e){}
  if(gfEdit&&shKey&&shKey===gfShKey&&pageEl&&shEl){
    const keep=shEl.scrollTop||0;pageEl.innerHTML=page;shEl.innerHTML=sheetInner();
    if((shEl.scrollTop||0)!==keep){try{shEl.scrollTop=keep;}catch(e){}}
    return;
  }
  try{const old=document.querySelector&&document.querySelector(".gf-sh");if(old&&shKey&&shKey===gfShKey)shTop=old.scrollTop||0;}catch(e){}
  gfRoot.innerHTML='<div id="gf-page">'+page+'</div>'+sheet();
  gfShKey=shKey;
  if(shTop){try{const nw=document.querySelector&&document.querySelector(".gf-sh");if(nw)nw.scrollTop=shTop;}catch(e){}}
}
function gfListen(){
  if(gfOn)return;gfOn=true;
  if(typeof db==="undefined"||!db){gfLoaded=true;return;}
  db.ref("gifts").on("value",s=>{const first=!gfLoaded;gfData=s.val()||{};gfLoaded=true;try{if(typeof tab!=="undefined"&&tab==="moms-plan"&&typeof mpSubView!=="undefined"&&mpSubView==="gifts"&&!gfEdit)gfDraw();}catch(e){}
    dadOnData();   // GIFTS_DAD: Dad's own view (only ever mounted after his code) repaints too
    if(first)nowRepaint();});   // GIFTS_REMIND: Home Base asked before gifts/ was in → its 🔴 NOW lines, once
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
  if(!document.getElementById("gf-style")){const s=document.createElement("style");s.id="gf-style";s.textContent=GF_CSS+RC_CSS+OCC_CSS+GRP_CSS;document.head.appendChild(s);}
  grpOpen(el);   // GIFTS_GROUPS: a fresh visit opens on 👧 Kids
  gfRoot=el;gfAh=ah||"";gfListen();gfDraw();
};
Object.assign(window,{gfTagsToggle,gfSplitMode,gfSplitSet,gfPack,gfOpened,gfGivenAt,gfSpotPick,gfSendTo,gfBringIn,gfShareSet,gfShareSize,gfGo,gfSelToggle,gfPick,gfBulk,gfBulkIds,gfGather,gfEveTick,gfLineAdd,gfLineTick,gfLineDel,gfLinesCopy,gfEvenEdit,gfNeed,gfStartOcc,gfPickOcc,gfOpenPerson,gfBack,gfNewItem,gfEditItem,gfMove,gfSet,gfSetDraw,gfTogglePid,gfSecBudget,gfSecEdit,gfSecAdd,gfCancel,gfSave,gfDelete,gfNext,gfNewPerson,gfEditPerson,gfBudget,gfGroupBudget,gfNewGroup,gfNewOcc,gfOccEdit});
window._gfTest={giveAt,atHome,nextOf,reminders:(t,h)=>giftReminders(t,h),held,evenData,behind,evenSet,sel:()=>gfSel,selOn:()=>gfSelOn,data:()=>gfData,setData:d=>{gfData=d||{};gfLoaded=true;},people,groups,occs,secsOf,items,personTot,groupTot,occTot,left,share,curOcc,
  setOcc:o=>{gfOcc=o;},view:()=>gfView,edit:()=>gfEdit,draw:gfDraw,setRoot:(el,ah)=>{gfRoot=el;gfAh=ah||"";},reset:()=>{gfGrp="kids";gfOcc=null;gfView="people";gfPid=null;gfEdit=null;gfRcOpen=null;gfOthersOpen=null;},rc:RC_TEST,oc:OCC_TEST,gr:GRP_TEST};
})();
