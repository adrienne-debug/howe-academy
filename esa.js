// 💰 Mom HQ ▸ Purchases — orders, wishlist and TWO budgets (ESA grant · family money). Stage C, 2026-09-13.
// Data (all under esa/, loaded by index.html into the global `esaData`; this file is lazy-loaded by
// renderPurchasesView the first time the tab opens, like library.js for Books):
//   esa/orders/<id>   {n, vendor, items, amount, fund:"esa"|"family", category, status, placed, arrived, classwallet, risk, notes, books?, bins?}
//   esa/wishlist/<id> {item, est, wave, station, schedule, status:"idea"|"next"|"ordered"|"dropped"|"denied", fund, notes}
//   esa/credits/<id>  {vendor, amount, what, status:"open"|"resolved"}
//   esa/budget/esa    {year, total}          esa/budget/family {year, total?}
//   esa/log/<push>    {at, text}
// Balances are COMPUTED here, never stored. Every write = one set/update/remove of ONE record (+ a log line).
// Mom HQ is already behind the Admin code, so there is no second gate. Nothing here touches schedules.
(function(){
"use strict";
let esView="balance", esFund="all", esStatus="all", esEdit=null, esQ="";
const ES_STATUS={pending:["⏳ pending","#d97706"],approved:["✅ approved","#16a34a"],arrived:["📦 arrived","#0f766e"],partial:["📦 partial","#0e7490"],denied:["❌ denied","#dc2626"],returned:["↩ returned","#7c3aed"],cancelled:["✕ cancelled","#94a3b8"]};
const ES_WISH={idea:["💭 idea","#64748b"],next:["⭐ next","#d97706"],ordered:["🛒 ordered","#16a34a"],dropped:["✕ dropped","#94a3b8"],denied:["❌ denied","#dc2626"]};
const ES_WAVES=[["1","Wave 1 — infrastructure"],["2","Wave 2 — if Wave 1 gets used"],["3","Wave 3 — follow what caught fire"],["carolina","Carolina"],["timberdoodle","Timberdoodle"],["consumables","Consumables"],["free","Free first"],["services","Services & subscriptions"],["non-grant","Non-grant shopping"],["parking","Parking lot"]];
const COUNTS=["approved","arrived","partial"];   // money the grant has actually committed
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function money(n){n=+n||0;return "$"+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",");}
function data(){return (typeof esaData!=="undefined"&&esaData)||{};}
function list(node){const o=data()[node]||{};return Object.keys(o).map(id=>Object.assign({id},o[id]));}
function today(){return (typeof _todayStr==="function")?_todayStr():new Date().toISOString().slice(0,10);}
function dry(){return typeof _dryRun==="function"&&_dryRun();}
function write(path,val,op){if(typeof db==="undefined"||!db||dry())return;const r=db.ref(path);if(op==="set")r.set(val);else if(op==="remove")r.remove();else if(op==="push")r.push(val);else r.update(val);}
function log(text){const rec={at:Date.now(),text:String(text).slice(0,200)};const d=data();(d.log=d.log||{})["local"+rec.at]=rec;write("esa/log",rec,"push");}
function toast(m){if(typeof gwShowToast==="function")gwShowToast(m);}
function slug(t){return String(t||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50)||"item";}
function newId(node,base){let id=base,n=2;const o=data()[node]||{};while(o[id])id=base+"-"+(n++);return id;}
function chip(t,c,solid){return '<span class="es-chip" style="'+(solid?"background:"+c+";color:#fff;border-color:"+c:"color:"+c+";border-color:"+c+"55")+'">'+esc(t)+'</span>';}

// ── balances ─────────────────────────────────────────────────────────────────
function esBalance(fund){
  const O=list("orders").filter(o=>(o.fund||"esa")===fund);
  const sum=f=>O.filter(f).reduce((a,o)=>a+(+o.amount||0),0);
  const b=(data().budget||{})[fund]||{};
  const committed=sum(o=>COUNTS.includes(o.status)), pending=sum(o=>o.status==="pending"), denied=sum(o=>o.status==="denied"), returned=sum(o=>o.status==="returned"||o.status==="cancelled");
  const total=+b.total||0;
  return {fund,year:b.year||"",total,committed,pending,denied,returned,placed:committed+pending,remaining:total?total-committed:null,ifPending:total?total-committed-pending:null,count:O.length};
}
function esBalanceCard(fund){
  const B=esBalance(fund), col=fund==="esa"?"#2563eb":"#b5394a", nm=fund==="esa"?"💰 ESA grant (Lincoln)":"💳 Family money";
  let h='<div class="es-card"><div class="es-hd" style="background:'+col+'">'+nm+(B.year?' <span style="opacity:.85;font-weight:600">· '+esc(B.year)+'</span>':'')+'<span style="margin-left:auto;font-weight:600;font-size:11.5px">'+B.count+' order'+(B.count===1?'':'s')+'</span></div><div class="es-bd">';
  const row=(l,v,c,b)=>'<div class="es-row"><span>'+l+'</span><b style="'+(c?'color:'+c+';':'')+(b?'font-size:15px':'')+'">'+v+'</b></div>';
  if(B.total){h+=row("Grant total",money(B.total));h+=row("Approved / arrived",money(B.committed),"#16a34a");h+=row("Pending approval",money(B.pending),"#d97706");
    h+=row("Denied",money(B.denied),"#dc2626");h+=row("<b>Remaining</b>",money(B.remaining),null,true);h+=row("Remaining if pending clears",money(B.ifPending),"#475569");}
  else{h+=row("Spent (approved / arrived)",money(B.committed),null,true);h+=row("Pending",money(B.pending),"#d97706");if(B.returned)h+=row("Returned / cancelled",money(B.returned),"#7c3aed");}
  h+='<div style="margin-top:8px"><button class="es-tool" onclick="esBudgetEdit(\''+fund+'\')">✏️ '+(B.total?"Edit total":"Set a total")+'</button></div>';
  h+='</div></div>';
  return h;
}
function esBudgetEdit(fund){const b=(data().budget||{})[fund]||{};const t=prompt("Total for "+(fund==="esa"?"the ESA grant":"family school money")+" this school year (blank = none):",b.total||"");if(t===null)return;
  const rec={year:b.year||"2026-27",total:+String(t).replace(/[^0-9.]/g,"")||null};(data().budget=data().budget||{})[fund]=rec;write("esa/budget/"+fund,rec,"set");log("Budget "+fund+" total → "+(rec.total?money(rec.total):"none"));esDraw();}

// ── views ────────────────────────────────────────────────────────────────────
function esNav(){
  const b=(k,l)=>'<button class="es-nav'+(esView===k?" on":"")+'" onclick="esGo(\''+k+'\')">'+l+'</button>';
  return '<div class="es-navrow">'+b("balance","⚖ Balance")+b("orders","🧾 Orders")+b("wishlist","🛍 Wishlist")+'</div>';
}
function esOrderRow(o){
  const st=ES_STATUS[o.status]||[o.status||"?","#64748b"];
  return '<button class="es-item" onclick="esEditStart(\'orders\',\''+esc(o.id)+'\')"><div class="es-it"><b>'+(o.n?'#'+esc(o.n)+' · ':'')+esc(o.vendor||"")+'</b> <span style="color:#475569">'+esc(o.items||"")+'</span></div>'+
    '<div class="es-im">'+chip(st[0],st[1])+chip(o.fund==="family"?"💳 family":"💰 ESA",o.fund==="family"?"#b5394a":"#2563eb")+(o.category?chip(o.category,"#64748b"):"")+(o.placed?'<span>'+esc(o.placed)+'</span>':'')+(o.arrived?'<span>📦 '+esc(o.arrived)+'</span>':'')+'</div>'+
    '<div class="es-amt">'+money(o.amount)+'</div></button>';
}
function esOrdersView(){
  let O=list("orders").sort((a,b)=>String(b.placed||"").localeCompare(String(a.placed||""))||String(b.n||0).localeCompare(String(a.n||0)));
  if(esFund!=="all")O=O.filter(o=>(o.fund||"esa")===esFund); if(esStatus!=="all")O=O.filter(o=>o.status===esStatus);
  if(esQ){const w=esQ.toLowerCase().split(/\s+/).filter(Boolean);O=O.filter(o=>{const hay=[o.vendor,o.items,o.category,o.notes,o.n].join(" ").toLowerCase();return w.every(x=>hay.includes(x));});}
  const sel=(name,cur,opts)=>'<select class="es-sel" onchange="esFilter(\''+name+'\',this.value)">'+opts.map(x=>'<option value="'+x[0]+'"'+(x[0]===cur?" selected":"")+'>'+esc(x[1])+'</option>').join("")+'</select>';
  let h='<div class="es-filters"><input class="es-q" type="search" placeholder="Search orders…" value="'+esc(esQ)+'" oninput="esFilter(\'q\',this.value)">'+
    sel("fund",esFund,[["all","Both budgets"],["esa","💰 ESA"],["family","💳 Family"]])+sel("status",esStatus,[["all","Any status"]].concat(Object.entries(ES_STATUS).map(([k,v])=>[k,v[0]])))+
    '<button class="es-tool" onclick="esNew(\'orders\')">➕ Order</button></div>';
  h+='<div style="font-size:11.5px;color:var(--muted);margin:2px 0 6px">'+O.length+' order'+(O.length===1?'':'s')+' · '+money(O.reduce((a,o)=>a+(+o.amount||0),0))+'</div>';
  h+=O.length?O.map(esOrderRow).join(""):'<div class="es-empty">No orders yet — ➕ Order, or "Buy" from the wishlist.</div>';
  return h;
}
function esWishView(){
  const W=list("wishlist"); const byWave={}; W.forEach(w=>{(byWave[w.wave||"parking"]=byWave[w.wave||"parking"]||[]).push(w);});
  let h='<div class="es-filters"><button class="es-tool" onclick="esNew(\'wishlist\')">➕ Wish</button><span style="font-size:11.5px;color:var(--muted)">'+W.length+' item'+(W.length===1?'':'s')+' · open est. '+money(W.filter(w=>w.status==="idea"||w.status==="next").reduce((a,w)=>a+(+w.est||0),0))+'</span></div>';
  ES_WAVES.forEach(([k,label])=>{const L=(byWave[k]||[]).sort((a,b)=>(a.status==="next"?0:1)-(b.status==="next"?0:1));if(!L.length)return;
    h+='<div class="es-wave">'+esc(label)+' <span style="color:var(--muted);font-weight:600">· '+L.length+'</span></div>';
    L.forEach(w=>{const st=ES_WISH[w.status]||[w.status||"?","#64748b"];
      h+='<div class="es-item" style="cursor:default"><div style="flex:1;min-width:0"><div class="es-it"><b>'+esc(w.item)+'</b>'+(w.station?' <span style="color:#475569">· '+esc(w.station)+'</span>':'')+'</div>'+
        '<div class="es-im">'+chip(st[0],st[1])+chip(w.fund==="family"?"💳 family":"💰 ESA",w.fund==="family"?"#b5394a":"#2563eb")+(w.schedule?'<span>🗓 '+esc(w.schedule)+'</span>':'')+(w.notes?'<span>'+esc(w.notes)+'</span>':'')+'</div></div>'+
        '<div class="es-amt">'+(w.est!=null&&w.est!==""?money(w.est):"—")+'</div>'+
        '<div style="display:flex;flex-direction:column;gap:4px"><button class="es-tool" onclick="esEditStart(\'wishlist\',\''+esc(w.id)+'\')">✏️</button>'+((w.status==="idea"||w.status==="next")?'<button class="es-tool" style="background:#111827;color:#fff;border-color:#111827" onclick="esBuy(\''+esc(w.id)+'\')">Buy</button>':'')+'</div></div>';});
  });
  if(!W.length)h+='<div class="es-empty">Nothing on the wishlist.</div>';
  return h;
}
function esBalanceView(){
  let h='<div class="es-two">'+esBalanceCard("esa")+esBalanceCard("family")+'</div>';
  const C=list("credits").filter(c=>c.status!=="resolved");
  h+='<div class="es-card"><div class="es-hd" style="background:#7c3aed">↩ Open credits & returns<button class="es-tool" style="margin-left:auto" onclick="esNew(\'credits\')">➕</button></div><div class="es-bd">'+
    (C.length?C.map(c=>'<button class="es-item" onclick="esEditStart(\'credits\',\''+esc(c.id)+'\')"><div class="es-it"><b>'+esc(c.vendor)+'</b> <span style="color:#475569">'+esc(c.what)+'</span></div><div class="es-amt">'+money(c.amount)+'</div></button>').join(""):'<div class="es-empty">None open.</div>')+'</div></div>';
  const L=list("log").sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,25);
  h+='<div class="es-card"><div class="es-hd" style="background:#475569">📜 Log</div><div class="es-bd">'+(L.length?L.map(l=>'<div class="es-log"><span>'+esc(new Date(l.at||0).toLocaleDateString("en-US",{month:"short",day:"numeric"}))+'</span>'+esc(l.text)+'</div>').join(""):'<div class="es-empty">Nothing logged yet.</div>')+'</div></div>';
  return h;
}

// ── add / edit sheet ─────────────────────────────────────────────────────────
const FIELDS={
  orders:[["n","Order #","13"],["vendor","Vendor","Timberdoodle"],["items","What","Grammar for the WTM Purple bundle",1],["amount","Amount $","117.38"],["fund","Budget",null,["esa","💰 ESA"],["family","💳 Family"]],["category","Category submitted","curriculum / ELA"],["status","Status",null].concat(Object.entries(ES_STATUS).map(([k,v])=>[k,v[0]])),["placed","Placed (date)","2026-08-28"],["arrived","Arrived (date)",""],["classwallet","ClassWallet #",""],["risk","Risk note","",1],["notes","Notes","",1]],
  wishlist:[["item","Item","Celestron MicroDirect 1080p",1],["est","Estimate $","130"],["wave","Wave",null].concat(ES_WAVES),["station","Station / where it lives","STA-F2"],["schedule","When it's used","Tue/Thu lab"],["status","Status",null].concat(Object.entries(ES_WISH).map(([k,v])=>[k,v[0]])),["fund","Budget",null,["esa","💰 ESA"],["family","💳 Family"]],["notes","Notes","",1]],
  credits:[["vendor","Vendor","Timberdoodle"],["amount","Amount $","24.99"],["what","What","duplicate Mind Benders L3",1],["status","Status",null,["open","open"],["resolved","resolved"]]]};
function esNew(kind){const f={};FIELDS[kind].forEach(x=>{f[x[0]]="";});if(kind==="orders"){f.fund="esa";f.status="pending";f.placed=today();}if(kind==="wishlist"){f.fund="esa";f.status="idea";f.wave="1";}if(kind==="credits")f.status="open";esEdit={kind,id:null,form:f};esDraw();}
function esEditStart(kind,id){const r=(data()[kind]||{})[id];if(!r)return;const f={};FIELDS[kind].forEach(x=>{f[x[0]]=r[x[0]]==null?"":String(r[x[0]]);});esEdit={kind,id,form:f};esDraw();}
function esSet(k,v){if(esEdit)esEdit.form[k]=v;}
function esCancel(){esEdit=null;esDraw();}
function esRecord(kind,f){const r={};FIELDS[kind].forEach(x=>{const k=x[0];let v=String(f[k]==null?"":f[k]).trim();if(k==="amount"||k==="est"){v=v.replace(/[^0-9.\-]/g,"");r[k]=v===""?null:+v;}else r[k]=v||null;});return r;}
function esSave(){
  if(!esEdit)return;const {kind,form}=esEdit;const rec=esRecord(kind,form);
  const need=kind==="orders"?["vendor","amount"]:kind==="wishlist"?["item"]:["vendor","amount"];
  for(const k of need){if(rec[k]==null||rec[k]===""){toast("Needs "+k);return;}}
  Object.keys(rec).forEach(k=>{if(rec[k]===null)delete rec[k];});
  const prev=esEdit.id?((data()[kind]||{})[esEdit.id]||{}):{};
  const id=esEdit.id||newId(kind,(kind==="orders"?(rec.n?"order-"+rec.n+"-":"")+slug(rec.vendor):slug(rec.item||rec.vendor)));
  if(prev.books)rec.books=prev.books;if(prev.bins)rec.bins=prev.bins;if(prev.fromWish)rec.fromWish=prev.fromWish;
  ((data()[kind]=data()[kind]||{}))[id]=rec;
  write("esa/"+kind+"/"+id,rec,"set");
  const what=kind==="orders"?("Order "+(rec.n?"#"+rec.n+" ":"")+rec.vendor+" "+money(rec.amount)+" → "+rec.status):kind==="wishlist"?("Wish: "+rec.item+" → "+rec.status):("Credit "+rec.vendor+" "+money(rec.amount)+" → "+rec.status);
  log((esEdit.id?"Edited: ":"Added: ")+what);
  esEdit=null;toast("✓ Saved");esDraw();
}
function esDelete(){if(!esEdit||!esEdit.id)return;if(!confirm("Delete this?"))return;const {kind,id}=esEdit;const r=(data()[kind]||{})[id]||{};delete data()[kind][id];write("esa/"+kind+"/"+id,null,"remove");log("Deleted "+kind.slice(0,-1)+": "+(r.vendor||r.item||id));esEdit=null;esDraw();}
// Wishlist → order: one new order (pending, same budget) + the wish marked ordered with a pointer.
function esBuy(wid){
  const w=(data().wishlist||{})[wid];if(!w)return;
  const id=newId("orders",slug(w.item));
  const rec={vendor:"",items:w.item,amount:+w.est||0,fund:w.fund||"esa",category:"",status:"pending",placed:today(),notes:w.notes||"",fromWish:wid};
  (data().orders=data().orders||{})[id]=rec;write("esa/orders/"+id,rec,"set");
  const wp={status:"ordered",notes:((w.notes?w.notes+" ":"")+"→ order "+id).trim()};Object.assign(w,wp);write("esa/wishlist/"+wid,wp,"update");
  log("Bought from wishlist: "+w.item+" "+money(rec.amount)+" ("+rec.fund+")");
  esEdit={kind:"orders",id,form:(()=>{const f={};FIELDS.orders.forEach(x=>{f[x[0]]=rec[x[0]]==null?"":String(rec[x[0]]);});return f;})()};
  esView="orders";esDraw();toast("Order started — fill in the vendor and amount");
}
function esSheet(){
  if(!esEdit)return "";const {kind,id,form}=esEdit;const title=(id?"✏️ Edit ":"➕ New ")+(kind==="orders"?"order":kind==="wishlist"?"wish":"credit");
  let h='<div id="es-sheet" onclick="if(event.target.id===\'es-sheet\')esCancel()"><div class="es-sh"><button class="es-x" onclick="esCancel()">✕</button><div style="font-weight:800;font-size:15px;margin-bottom:8px">'+title+'</div><div class="es-form">';
  FIELDS[kind].forEach(x=>{const [k,label,ph,wide]=x;
    if(x.length>3&&Array.isArray(x[3])){h+='<label class="es-f"><span>'+label+'</span><select onchange="esSet(\''+k+'\',this.value)">'+x.slice(3).map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===form[k]?" selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select></label>';}
    else if(wide===1){h+='<label class="es-f wide"><span>'+label+'</span><textarea rows="2" placeholder="'+esc(ph||"")+'" oninput="esSet(\''+k+'\',this.value)">'+esc(form[k])+'</textarea></label>';}
    else{h+='<label class="es-f"><span>'+label+'</span><input value="'+esc(form[k])+'" placeholder="'+esc(ph||"")+'" '+(/date/.test(label)?'type="date" ':'')+'oninput="esSet(\''+k+'\',this.value)"></label>';}
  });
  h+='</div><div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap"><button class="es-tool" style="background:#111827;color:#fff;border-color:#111827;padding:8px 14px" onclick="esSave()">Save</button><button class="es-tool" style="padding:8px 12px" onclick="esCancel()">Cancel</button>'+(id?'<button class="es-tool" style="margin-left:auto;color:#b5394a;border-color:#fecaca" onclick="esDelete()">Delete</button>':'')+'</div></div></div>';
  return h;
}
function esGo(v){esView=v;esDraw();}
function esFilter(k,v){if(k==="fund")esFund=v;else if(k==="status")esStatus=v;else esQ=v;esDraw();}
let esRoot=null, esAh="";
function esDraw(){
  if(!esRoot)return;
  const keep=document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains("es-q");const pos=keep?document.activeElement.selectionStart:0;
  esRoot.innerHTML=esAh+'<div class="es-wrap"><div class="es-title">💰 Purchases</div>'+esNav()+(esView==="orders"?esOrdersView():esView==="wishlist"?esWishView():esBalanceView())+'</div>'+esSheet();
  if(keep){const q=esRoot.querySelector(".es-q");if(q){q.focus();try{q.setSelectionRange(pos,pos);}catch(e){}}}
}
const ES_CSS=`
.es-wrap{padding:10px 12px 40px;max-width:900px;margin:0 auto}
.es-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin:8px 0 6px}
.es-navrow{display:flex;gap:6px;margin-bottom:10px}
.es-nav{flex:1;padding:8px 6px;border-radius:10px;border:1.5px solid var(--border);background:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--muted)}
.es-nav.on{background:#111827;color:#fff;border-color:#111827}
.es-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}
.es-card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(43,122,120,.13);overflow:hidden;margin-bottom:10px}
.es-hd{display:flex;align-items:center;gap:8px;padding:10px 14px;color:#fff;font-weight:800;font-size:13px}
.es-bd{padding:8px 14px 12px}
.es-row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
.es-filters{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px}
.es-q{flex:1 1 160px;padding:8px 10px;border:1.5px solid var(--border);border-radius:9px;font-size:13px;font-family:'DM Sans',sans-serif}
.es-sel{padding:7px 8px;border:1.5px solid var(--border);border-radius:9px;background:#fff;font-size:12px;font-family:'DM Sans',sans-serif}
.es-tool{border:1.5px solid var(--border);background:#fff;border-radius:9px;padding:5px 10px;font-size:12px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;color:#0f172a}
.es-item{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:8px 10px;margin-bottom:6px;cursor:pointer;font:inherit;color:inherit}
.es-item:hover{border-color:#94a3b8}
.es-it{font-size:13px;line-height:1.3}
.es-im{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;font-size:11px;color:#475569;align-items:center}
.es-amt{margin-left:auto;font-weight:800;font-size:14px;white-space:nowrap}
.es-chip{font-size:10px;font-weight:700;border:1px solid;border-radius:99px;padding:1px 7px;white-space:nowrap}
.es-wave{font-weight:800;font-size:12.5px;margin:12px 0 6px;color:#0f172a}
.es-empty{padding:16px;text-align:center;color:var(--muted);font-size:12.5px}
.es-log{display:flex;gap:10px;font-size:12px;padding:4px 0;border-bottom:1px solid #f1f5f9}
.es-log span{flex:none;color:var(--muted);min-width:48px}
#es-sheet{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:300;display:flex;align-items:flex-end;justify-content:center}
.es-sh{position:relative;background:#fff;width:100%;max-width:640px;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 18px 28px;box-sizing:border-box}
.es-x{position:absolute;right:12px;top:10px;border:none;background:var(--bg);border-radius:99px;width:32px;height:32px;font-size:15px;cursor:pointer}
.es-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px 10px}
.es-f{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:var(--muted)}
.es-f.wide{grid-column:1/-1}
.es-f input,.es-f select,.es-f textarea{font:inherit;font-size:13px;font-weight:500;color:#0f172a;padding:7px 9px;border:1.5px solid var(--border);border-radius:9px;background:#fff;font-family:'DM Sans',sans-serif;width:100%;box-sizing:border-box}
`;
window.renderPurchases=function(el,ah){
  if(!document.getElementById("es-style")){const st=document.createElement("style");st.id="es-style";st.textContent=ES_CSS;document.head.appendChild(st);}
  esRoot=el;esAh=ah||"";esDraw();
};
window.esGo=esGo;window.esFilter=esFilter;window.esNew=esNew;window.esEditStart=esEditStart;window.esSet=esSet;window.esSave=esSave;window.esCancel=esCancel;window.esDelete=esDelete;window.esBuy=esBuy;window.esBudgetEdit=esBudgetEdit;
window._esTest={esBalance,esRecord,slug,newId,list,money,view:()=>esView,edit:()=>esEdit,setView:v=>{esView=v;},draw:esDraw,setRoot:(el,ah)=>{esRoot=el;esAh=ah||"";}};
})();
