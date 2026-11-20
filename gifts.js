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
// Totals are COMPUTED here, never stored (the esa.js rule). A gift for several people splits its cost evenly between them and
// counts once for each (🤝). Every write = one set/update/remove of ONE record (+ a log line). Nothing here touches schedules.
(function(){
"use strict";
let gfData={}, gfOn=false, gfLoaded=false, gfOcc=null, gfView="people", gfPid=null, gfEdit=null, gfRoot=null, gfAh="";
const GF_STATUS=[["idea","💭 Idea","#64748b"],["ordered","🛒 Ordered","#d97706"],["here","📦 Here","#0f766e"],["wrapped","🎀 Wrapped","#be185d"],["given","🎄 Given","#16a34a"],["returned","↩ Returned","#7c3aed"],["dropped","✕ Dropped","#94a3b8"]];
const GF_NEXT={idea:"ordered",ordered:"here",here:"wrapped",wrapped:"given"};
const GF_DEAD=["returned","dropped"];   // no longer counts toward money or gift counts
const GF_KINDS={
  christmas:{label:"🎄 Christmas",secs:[["santa","🎅","Santa"],["parents","🎁","From Mom & Dad"],["stocking","🧦","Stocking"],["eve","🌙","Christmas Eve box"]]},   // her pick 2026-11-20
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
  if(past.length)h+='<select class="gf-sel" onchange="if(this.value)gfPickOcc(this.value)"><option value="">📜 Past…</option>'+past.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join("")+'</select>';
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
    '<div class="gf-line" style="color:#475569">'+T.count+' present'+(T.count===1?'':'s')+(T.count?' · '+counts(T):'')+'</div></div></div>';
}
function daysTo(iso){const a=new Date(today()+"T12:00:00"),b=new Date(String(iso)+"T12:00:00");const d=Math.round((b-a)/864e5);return isNaN(d)?"":d>1?d+" days to go":d===1?"tomorrow":d===0?"today":"";}
function peopleView(o){
  let h=occHead(o);
  const P=people();
  groups().forEach(g=>{
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
function itemRow(it,pid){
  const s=st(it.status),P=pidsOf(it),others=P.filter(x=>x!==pid).map(x=>(person(x)||{}).name||"?");
  const amt=num(it.paid)!=null?money(num(it.paid)):(num(it.plan)!=null?'<span style="color:#64748b">plan '+money(num(it.plan))+'</span>':'—');
  const nx=GF_NEXT[it.status||"idea"];
  return '<div class="gf-item'+(live(it)?'':' dead')+'"><button class="gf-ib" onclick="gfEditItem(\''+esc(it.id)+'\')"><div class="gf-it"><b>'+esc(it.name)+'</b></div><div class="gf-im">'+chip(s[1],s[2])+
    (P.length>1?chip("🤝 "+(pid?"with "+others.join(", "):P.map(x=>(person(x)||{}).name||"?").join(", ")),"#0e7490"):"")+
    (it.where?'<span>📍 '+esc(it.where)+'</span>':'')+(it.paper?'<span>🎀 '+esc(it.paper)+'</span>':'')+(it.store?'<span>🏬 '+esc(it.store)+'</span>':'')+'</div></button>'+
    '<div class="gf-ia"><div class="gf-amt">'+amt+(P.length>1&&pid&&num(it.paid)!=null?'<small> ('+money(num(it.paid)/P.length)+' each)</small>':'')+'</div><div style="display:flex;gap:4px">'+
    (nx?'<button class="gf-tool gf-mini" title="Next: '+esc(st(nx)[1])+'" onclick="gfNext(\''+esc(it.id)+'\')">'+st(nx)[1].split(" ")[0]+'</button>':'')+
    '<button class="gf-tool gf-mini" title="Move to…" onclick="gfMove(\''+esc(it.id)+'\')">↪</button></div></div></div>';
}
function personView(o,pid){
  const p=person(pid);if(!p){gfView="people";return peopleView(o);}
  const T=personTot(o.id,pid),S=secsOf(o),mine=items(o.id).filter(it=>pidsOf(it).indexOf(pid)>=0);
  let h='<button class="gf-tool" style="margin-bottom:8px" onclick="gfBack()">← Everyone</button>';
  h+='<div class="gf-card"><div class="gf-hd" style="background:'+esc(p.color||"#475569")+'"><span>'+esc(p.name)+' · '+esc(o.name)+'</span><button class="gf-tool gf-hdb" onclick="gfEditPerson(\''+esc(pid)+'\')">✏️</button></div>'+
    '<div class="gf-bd">'+bar(T)+'<div class="gf-line">'+sumLine(T)+'</div><div class="gf-line" style="color:#475569">'+T.count+' present'+(T.count===1?'':'s')+(T.shared?' · 🤝 '+T.shared+' shared':'')+(p.paper?' · 🎀 '+esc(p.paper):'')+'</div>'+
    '<div style="margin-top:6px"><button class="gf-tool" onclick="gfBudget(\''+esc(pid)+'\')">💲 Budget</button></div></div></div>';
  const known=S.map(s=>s.id);
  S.concat(mine.some(it=>known.indexOf(it.sec)<0)?[{id:"",emoji:"📦",name:"No section"}]:[]).forEach(s=>{
    const L=mine.filter(it=>s.id?it.sec===s.id:known.indexOf(it.sec)<0),ST=s.id?personTot(o.id,pid,s.id):null;
    h+='<div class="gf-card"><div class="gf-ghd"><span>'+esc(s.emoji||"")+' '+esc(s.name)+'</span><span class="gf-gsum">'+(ST?money(ST.paid)+(ST.budget!=null?' / '+money(ST.budget):''):'')+'</span>'+
      (s.id?'<button class="gf-tool" onclick="gfNewItem(\''+esc(pid)+'\',\''+esc(s.id)+'\')">＋</button>':'')+'</div>'+(ST&&ST.budget!=null?'<div style="padding:0 14px">'+bar(ST)+'</div>':'')+
      '<div class="gf-bd">'+(L.length?L.map(it=>itemRow(it,pid)).join(""):'<div class="gf-empty">Nothing here yet.</div>')+'</div></div>';
  });
  return h;
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
  h+=field("plan","Planned $","","money")+field("paid","Paid $","","money")+field("store","Store","e.g. Target")+field("link","Link","https://…");
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
  h+='<label class="gf-f wide"><span>Sizes, likes, notes</span><textarea rows="2" oninput="gfSet(\'note\',this.value)">'+esc(f.note)+'</textarea></label>';
  return h+'</div>';
}
function budgetSheet(){
  const f=gfEdit.form,o=occ(f.occ);let h='<div class="gf-form">'+field("budget","Budget for "+esc((o||{}).name||"this occasion"),"","money");
  if(f.secs)secsOf(o).forEach(s=>{h+='<label class="gf-f"><span>'+esc((s.emoji||"")+" "+s.name)+' (optional)</span><input inputmode="decimal" value="'+esc(f.secs[s.id]||"")+'" oninput="gfSecBudget(\''+esc(s.id)+'\',this.value)"></label>';});
  return h+'</div>';
}
function groupSheet(){return '<div class="gf-form">'+field("emoji","Emoji","🏡")+field("name","Group name","e.g. Neighbors")+'</div>';}
function occSheet(){
  const f=gfEdit.form;let h='<div class="gf-form">';
  if(!f.id)h+='<div class="gf-f wide"><span>Kind</span><div class="gf-picks">'+Object.keys(GF_KINDS).map(k=>'<button class="gf-pick'+(f.kind===k?" on":"")+'" onclick="gfSetDraw(\'kind\',\''+k+'\')">'+esc(GF_KINDS[k].label)+'</button>').join("")+'</div></div>';
  h+=field("name","Name","e.g. a birthday 2027")+field("date","Date","","date")+field("budget","Whole budget (optional)","","money");
  if(f.id){h+='<div class="gf-f wide"><span>Sections</span>'+f.secs.map((s,i)=>'<div style="display:flex;gap:6px;margin-top:4px"><input style="width:56px" value="'+esc(s.emoji)+'" oninput="gfSecEdit('+i+',\'emoji\',this.value)"><input value="'+esc(s.name)+'" oninput="gfSecEdit('+i+',\'name\',this.value)"></div>').join("")+
    '<button class="gf-tool" style="margin-top:6px;align-self:flex-start" onclick="gfSecAdd()">＋ Section</button></div>';
    h+='<label class="gf-f wide" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" style="width:auto"'+(f.closed?" checked":"")+' onchange="gfSet(\'closed\',this.checked)"> Done — move it to 📜 Past</label>';}
  return h+'</div>';
}
const SHEETS={item:["Present",itemSheet],move:["↪ Move to…",moveSheet],person:["Person",personSheet],budget:["💲 Budget",budgetSheet],group:["Group",groupSheet],occ:["Occasion",occSheet]};
function sheet(){
  if(!gfEdit)return "";const S=SHEETS[gfEdit.kind];const id=gfEdit.id;
  const title=gfEdit.kind==="move"||gfEdit.kind==="budget"?S[0]:(id?"✏️ "+S[0]:"➕ New "+S[0].toLowerCase());
  const del=id&&(gfEdit.kind==="item"||(gfEdit.kind==="person"&&!/^k_/.test(id))||gfEdit.kind==="group");
  return '<div id="gf-sheet" onclick="if(event.target.id===\'gf-sheet\')gfCancel()"><div class="gf-sh"><button class="gf-x" onclick="gfCancel()">✕</button><div style="font-weight:800;font-size:15px;margin-bottom:8px">'+esc(title)+'</div>'+S[1]()+
    '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap"><button class="gf-tool gf-save" onclick="gfSave()">Save</button><button class="gf-tool" onclick="gfCancel()">Cancel</button>'+
    (gfEdit.kind==="item"&&id?'<button class="gf-tool" onclick="gfMove(\''+esc(id)+'\')">↪ Move to…</button>':'')+
    (del?'<button class="gf-tool" style="margin-left:auto;color:#b5394a;border-color:#fecaca" onclick="gfDelete()">Delete</button>':'')+'</div></div></div>';
}

// ── actions ──────────────────────────────────────────────────────────────────
function gfStartOcc(kind,name,date){
  kind=GF_KINDS[kind]?kind:"other";const t=today();
  if(kind==="christmas"&&!name){const y=+t.slice(0,4)+((t.slice(5)>"12-25")?1:0);name="Christmas "+y;date=y+"-12-25";}
  const secs={};GF_KINDS[kind].secs.forEach((s,i)=>{secs[s[0]]={emoji:s[1],name:s[2],order:i};});
  const id=newId("occasions",slug(name));const rec={name,kind,date:date||"",secs,ts:Date.now()};
  node("occasions")[id]=rec;write("gifts/occasions/"+id,rec,"set");log("Started "+name);
  gfOcc=id;try{HA_LS.setItem("ha_gf_occ",id);}catch(e){}gfView="people";gfDraw();
}
function gfPickOcc(id){gfOcc=id;try{HA_LS.setItem("ha_gf_occ",id);}catch(e){}gfView="people";gfDraw();}
function gfOpenPerson(pid){gfPid=pid;gfView="person";gfDraw();try{window.scrollTo(0,0);}catch(e){}}
function gfBack(){gfView="people";gfDraw();}
function defaultPaper(pids,sec,oid){const s=((occ(oid)||{}).secs||{})[sec];if(s&&s.paper)return s.paper;const p=person(pids[0]);return (p&&p.paper)||"";}
function gfNewItem(pid,sid){
  const oid=curOcc();if(!oid)return;const S=secsOf(occ(oid));const pids=pid?[pid]:[];const sec=sid||(S[0]&&S[0].id)||"";
  gfEdit={kind:"item",id:null,form:{occ:oid,name:"",pids,sec,status:"idea",plan:"",paid:"",store:"",link:"",where:"",paper:defaultPaper(pids,sec,oid),note:""}};gfDraw();
}
function gfEditItem(id){const it=(gfData.items||{})[id];if(!it)return;const f={occ:it.occ,pids:pidsOf(it).slice(),sec:it.sec||"",status:it.status||"idea"};
  ["name","plan","paid","store","link","where","paper","note"].forEach(k=>{f[k]=it[k]==null?"":String(it[k]);});gfEdit={kind:"item",id,form:f};gfDraw();}
function gfMove(id){const it=(gfData.items||{})[id];if(!it)return;gfEdit={kind:"move",id,form:{occ:it.occ,pids:pidsOf(it).slice(),sec:it.sec||"",was:{pids:pidsOf(it).slice(),occ:it.occ,sec:it.sec||""}}};gfDraw();}
function gfSet(k,v){if(!gfEdit)return;gfEdit.form[k]=v;if(k==="name")gfEdit.form.autoName=false;}
function gfSetDraw(k,v){if(!gfEdit)return;const f=gfEdit.form;
  if(k==="sec"&&gfEdit.kind==="item"&&!gfEdit.id&&(!f.paper||f.paper===defaultPaper(f.pids,f.sec,f.occ))){f.sec=v;f.paper=defaultPaper(f.pids,v,f.occ);}
  f[k]=v;if(k==="occ"){const S=secsOf(occ(v));if(!S.some(s=>s.id===f.sec))f.sec=(S[0]&&S[0].id)||"";}
  if(k==="kind"&&!f.id&&(!f.name||f.autoName)){f.name=GF_KINDS[v].label.replace(/^\S+\s/,"")+" "+today().slice(0,4);f.autoName=true;}
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
    ["occ","pids","sec","name","status","plan","paid","store","link","where","paper","note"].forEach(k=>{delete prev[k];});
    const rec=Object.assign(prev,{occ:f.occ,pids:f.pids.slice(),sec:f.sec||"",name,status:f.status||"idea",ts:prev.ts||Date.now()});
    ["store","link","where","paper","note"].forEach(k=>{const v=String(f[k]||"").trim();if(v)rec[k]=v;});
    ["plan","paid"].forEach(k=>{const v=num(f[k]);if(v!=null)rec[k]=v;});
    if(!rec.pids.length)delete rec.pids;
    const iid=id||uid();node("items")[iid]=rec;write("gifts/items/"+iid,rec,"set");
    log((id?"Edited: ":"Added: ")+name+" → "+names(f.pids)+(rec.paid!=null?" "+money(rec.paid):""));
  }else if(kind==="move"){
    const it=gfData.items[id];if(!it){gfEdit=null;return gfDraw();}
    const up={pids:f.pids.length?f.pids.slice():null,occ:f.occ,sec:f.sec||""};
    if(it.paper&&it.paper===defaultPaper(f.was.pids,f.was.sec,f.was.occ)){const np=defaultPaper(f.pids,f.sec,f.occ);if(np)up.paper=np;}   // auto paper follows the new person
    Object.keys(up).forEach(k=>{if(up[k]==null)delete it[k];else it[k]=up[k];});write("gifts/items/"+id,up,"update");
    log("Moved: "+it.name+": "+names(f.was.pids)+" → "+names(f.pids)+(f.occ!==f.was.occ?" ("+((occ(f.occ)||{}).name||"")+")":""));
  }else if(kind==="person"){
    const pid=id||newId("people","p-"+slug(f.name));const kid=/^k_/.test(pid);
    const name=kid?f.name:String(f.name||"").trim();if(!name){toast("Needs a name");return;}
    const up={paper:String(f.paper||"").trim()||null,birthday:f.birthday||null,note:String(f.note||"").trim()||null};
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
    if(!id){gfEdit=null;gfStartOcc(f.kind||"other",name,f.date||"");const o=occ(gfOcc);const b=num(f.budget);if(o&&b!=null){gfData.occasions[gfOcc].budget=b;write("gifts/occasions/"+gfOcc+"/budget",b,"set");}return;}
    const up={name,date:f.date||"",budget:num(f.budget),closed:f.closed?true:null};
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
function gfNewPerson(){gfEdit={kind:"person",id:null,form:{name:"",group:"mom",paper:"",birthday:"",note:""}};gfDraw();}
function gfEditPerson(pid){const p=person(pid);if(!p)return;gfEdit={kind:"person",id:pid,form:{name:p.name||"",group:p.group||"other",paper:p.paper||"",birthday:p.birthday||"",note:p.note||""}};gfDraw();}
function gfBudget(pid){const oid=curOcc(),p=plan(oid,pid),secs={};Object.keys(p.sec||{}).forEach(k=>{secs[k]=String(p.sec[k]);});
  gfEdit={kind:"budget",id:pid,form:{occ:oid,key:pid,label:(person(pid)||{}).name||pid,budget:p.budget==null?"":String(p.budget),secs}};gfDraw();}
function gfGroupBudget(gid){const oid=curOcc(),p=plan(oid,"g_"+gid),g=groups().find(x=>x.id===gid)||{};
  gfEdit={kind:"budget",id:"g_"+gid,form:{occ:oid,key:"g_"+gid,label:g.name||gid,budget:p.budget==null?"":String(p.budget),secs:null}};gfDraw();}
function gfNewGroup(){gfEdit={kind:"group",id:null,form:{name:"",emoji:"👥"}};gfDraw();}
function gfNewOcc(){gfEdit={kind:"occ",id:null,form:{kind:"birthday",name:"",date:"",budget:"",autoName:true}};gfSetDraw("kind","birthday");}
function gfOccEdit(){const o=occ(curOcc());if(!o)return;gfEdit={kind:"occ",id:o.id,form:{name:o.name||"",date:o.date||"",budget:o.budget==null?"":String(o.budget),closed:!!o.closed,secs:secsOf(o).map(s=>({id:s.id,emoji:s.emoji||"",name:s.name||""}))}};gfDraw();}

function gfDraw(){
  if(!gfRoot)return;
  let body;
  if(!gfLoaded)body='<div class="gf-empty" style="padding:40px">Loading presents…</div>';
  else{const oid=curOcc(),o=oid&&occ(oid);body=o?occBar()+(gfView==="person"&&gfPid?personView(o,gfPid):peopleView(o)):emptyView();}
  gfRoot.innerHTML=gfAh+'<div class="gf-wrap"><div class="gf-title">🎁 Gifts</div>'+body+'</div>'+sheet();
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
`;
window.renderGifts=function(el,ah){
  if(typeof momHere==="function"&&!momHere()){el.innerHTML=(ah||"")+'<div class="gf-empty" style="padding:40px">🔒 Mom only.</div>';return;}   // the presents are a secret: no data loads without Mom
  if(!document.getElementById("gf-style")){const s=document.createElement("style");s.id="gf-style";s.textContent=GF_CSS;document.head.appendChild(s);}
  gfRoot=el;gfAh=ah||"";gfListen();gfDraw();
};
Object.assign(window,{gfStartOcc,gfPickOcc,gfOpenPerson,gfBack,gfNewItem,gfEditItem,gfMove,gfSet,gfSetDraw,gfTogglePid,gfSecBudget,gfSecEdit,gfSecAdd,gfCancel,gfSave,gfDelete,gfNext,gfNewPerson,gfEditPerson,gfBudget,gfGroupBudget,gfNewGroup,gfNewOcc,gfOccEdit});
window._gfTest={data:()=>gfData,setData:d=>{gfData=d||{};gfLoaded=true;},people,groups,occs,secsOf,items,personTot,groupTot,occTot,left,share,curOcc,
  setOcc:o=>{gfOcc=o;},view:()=>gfView,edit:()=>gfEdit,draw:gfDraw,setRoot:(el,ah)=>{gfRoot=el;gfAh=ah||"";},reset:()=>{gfOcc=null;gfView="people";gfPid=null;gfEdit=null;}};
})();
