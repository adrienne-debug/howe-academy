// 🍗 Seasons & Events ▸ an idea ▸ ⏱ Cooking timeline — a big meal's dishes, when we eat, and when each dish starts.
// BIGMEAL slice 1 (a second family's ask 2026-11-21 + their worksheet answers 11/24: "when to start each dish so it all finishes together",
// "where each dish cooks: oven, crockpot, air fryer, stove", "the oven temperature for each dish"; Q11 "I type how long it cooks
// and where. The app works out when to start"). Plan: PLAN_holiday_menu_2026-11-24.md §6 slice 1. Later slices (rest and get-ready
// time, warnings, the day before, the cook view, 🔴 NOW, the tablet lock) are NOT here.
//
// WHERE IT LIVES: a big meal is a planner idea that has an eat time. Its food lines are its dishes; its day is the idea's day.
// This file is lazy: seasons.js loads it (bmLoad) only when Mom taps ⏱ Cooking timeline. It never runs at app start and
// never on a kid's page. It draws one full-screen layer (#bm-layer) above the planner, below the planner's own pop-ups.
//
// DATA (all on the idea — so a 🤫 surprise's meal lives in seasonSecret/ with it and moves with it when the switch changes):
//   <idea>/meal        {eat:"HH:MM" (24-hour), ts}          no eat time = no times at all
//   <idea>/food/<id>   the planner's food line {name, mid?, ts, menu?} + optional:
//                      where:"oven"|"stove"|"slow"|"air"|"pot"|"grill"|"micro"|"x"|"none"   whereTxt (only with "x", ≤20)
//                      cook:<minutes it cooks, 1–2880>       temp:"325" | "low" (≤12, shown as typed)
//   <idea> = seasons/ideas/<sid>/<iid> or seasonSecret/<sid>/<iid> (the planner's base()). An old food line (name only) is a dish
//   with no times — it shows under "Not timed yet". Opening the page writes nothing. No migration.
// THE RULE (slice 1: nothing rests, nothing needs getting ready):  in = eat − cook.  Minutes from midnight of the meal's day;
//   a negative number is the day before. No eat time → no times. No place or no cook time → that dish has no time. NEVER a guess.
// WRITES: this file has no database call of its own. Every write is exact paths, checked against BM_OK (only …/meal and
//   …/food/<id>), then handed to the planner's own apply() (its SN_OK guard, ?dryrun=1 inert). A changed dish writes only the
//   fields that changed, so its menu and ts are never touched.
// SECRET: nothing is drawn unless the Mom switch is on (momHere). If it goes off, the next redraw closes the layer.
(function(){
"use strict";
const BM_WHERE=[["oven","🔥","Oven","into the oven"],["stove","🍳","Stove top","onto the stove"],["slow","🍲","Slow cooker (crockpot)","into the slow cooker"],
  ["air","💨","Air fryer","into the air fryer"],["pot","♨️","Pressure cooker","into the pressure cooker"],["grill","🍖","Grill or smoker","onto the grill"],
  ["micro","📡","Microwave","into the microwave"],["x","✏️","Something else",""],["none","🧊","No cooking","put it out"]];
const BM_OK=/^(seasons\/ideas|seasonSecret)\/[^\/]+\/[^\/]+\/(meal|food\/[^\/]+)(\/|$)/;
const COOK_MAX=2880, DAY=1440;
let bmSid=null, bmIid=null, bmEd=null, bmEl=null, bmMsg="";

function A(){try{return window._snApi||null;}catch(e){return null;}}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function q(s){return esc(String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'"));}   // a value inside an onclick's quoted call
function momOk(){try{return typeof momHere==="function"&&!!momHere();}catch(e){return false;}}
function say(m){try{if(typeof mwToast==="function"){mwToast(m);return;}const a=A();if(a&&a.toast)a.toast(m);}catch(e){}}
function whereRow(w){return BM_WHERE.find(x=>x[0]===w)||null;}

// ── clock ────────────────────────────────────────────────────────────────────
// "16:00" · "4:00 PM" · "4pm" · "4 p.m." → minutes from midnight; anything else → null (never a guess).
function clockMin(t){
  const s=String(t==null?"":t).trim();let m=/^(\d{1,2}):(\d{2})$/.exec(s);
  if(m){const h=+m[1],n=+m[2];return (h<24&&n<60)?h*60+n:null;}
  m=/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m?\.?$/i.exec(s);if(!m)return null;
  const h=+m[1],n=+(m[2]||0);if(h<1||h>12||n>59)return null;
  return (h%12+(/p/i.test(m[3])?12:0))*60+n;
}
function fmtClock(a){const x=((Math.round(a)%DAY)+DAY)%DAY,h=Math.floor(x/60),n=x%60;return (h%12||12)+":"+String(n).padStart(2,"0")+" "+(h>=12?"PM":"AM");}
function hhmm(a){const x=((a%DAY)+DAY)%DAY;return String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0");}
function dayShift(a){return Math.floor(a/DAY);}   // 0 = the meal's day · −1 = the day before
function dur(m){const h=Math.floor(m/60),n=m%60;return (h?h+" h":"")+(h&&n?" ":"")+(n||!h?n+" min":"");}
function eatOf(it){const m=it&&it.meal;return (m&&typeof m==="object")?clockMin(m.eat):null;}

// ── a dish = a food line, read carefully (a bad or missing number is "not set", never 0 minutes) ──
function whereOf(w){return whereRow(w)?w:"";}
function dishOf(L){
  const r=(L&&L.r)||{},w=whereOf(r.where),cooks=!!w&&w!=="none";
  const c=(typeof r.cook==="number"||/^\d+$/.test(String(r.cook==null?"":r.cook)))?Math.floor(+r.cook):NaN;
  return {id:L.id,L,name:String(r.name||"").trim()||"(no name)",mid:r.mid?String(r.mid):"",where:w,
    whereTxt:w==="x"?String(r.whereTxt||"").trim().slice(0,20):"",cook:(cooks&&c>=1&&c<=COOK_MAX)?c:null,
    temp:cooks?String(r.temp==null?"":r.temp).trim().slice(0,12):"",ts:+r.ts||0};
}
function timed(d){return !!d.where&&d.where!=="none"&&d.cook>0;}
function laneKey(d){return d.where==="x"?"x:"+(d.whereTxt.toLowerCase()||"?"):d.where;}
function laneIx(d){const i=BM_WHERE.findIndex(x=>x[0]===d.where);return i<0?99:i;}
// slice 1: nothing rests and nothing needs getting ready, so a dish comes out when we eat.
function plan(eat,D){return D.map(d=>timed(d)&&eat!=null?Object.assign({},d,{out:eat,in:eat-d.cook}):Object.assign({},d,{out:null,in:null}));}
function intoTxt(d){const w=whereRow(d.where);return d.where==="x"?"into the "+(d.whereTxt||"something else"):(w?w[3]:"");}
function tempTxt(t){return /^\d{2,3}$/.test(t)?t+"°":t;}
// The list in time order: each dish's "in" row, then the last row — eat, and what to put out.
function steps(eat,P){
  if(eat==null)return [];
  const S=P.filter(d=>d.in!=null).map(d=>({at:d.in,k:"i",fid:d.id,d}));
  S.sort((a,b)=>a.at-b.at||laneIx(a.d)-laneIx(b.d)||a.d.name.localeCompare(b.d.name));
  S.push({at:eat,k:"eat",out:P.filter(d=>d.in!=null).map(d=>d.name),put:P.filter(d=>d.where==="none").map(d=>d.name)});
  return S;
}
// By place: one group per appliance in use (her own "something else" names each get one), then "No cooking".
function lanes(P){
  const G={},order=[];
  P.filter(d=>timed(d)||d.where==="none").forEach(d=>{const k=laneKey(d);if(!G[k]){G[k]={key:k,where:d.where,name:d.where==="x"?d.whereTxt||"Something else":whereRow(d.where)[2],dishes:[]};order.push(k);}G[k].dishes.push(d);});
  const L=order.map(k=>G[k]).sort((a,b)=>BM_WHERE.findIndex(x=>x[0]===a.where)-BM_WHERE.findIndex(x=>x[0]===b.where)||a.name.localeCompare(b.name));
  L.forEach(g=>g.dishes.sort((a,b)=>(a.in==null?1e9:a.in)-(b.in==null?1e9:b.in)||a.name.localeCompare(b.name)));
  return L;
}
function notTimed(P){return P.filter(d=>!timed(d)&&d.where!=="none");}
function stepWhen(at,day){
  const s=dayShift(at),c=fmtClock(at),a=A();if(!s)return c;
  const why=s===-1?((((at%DAY)+DAY)%DAY)>=17*60?"the night before":"the day before"):(-s)+" days before";
  return (day&&a?a.fmtDay(a.addDays(day,s))+" · ":"")+c+" ("+why+")";
}

// ── the one door for writes: only this meal's own fields, then the planner's apply() ──
function put(up){
  const P=Object.keys(up||{});if(!P.length)return false;
  if(P.some(p=>!BM_OK.test(p))){try{console.warn("bigmeal: refused a write outside the meal",P);}catch(e){}return false;}
  const a=A();if(!a||typeof a.apply!=="function")return false;
  return a.apply(up);
}

// ── what's open ──────────────────────────────────────────────────────────────
function cur(){const a=A();return (a&&bmSid&&bmIid)?a.idea(bmSid,bmIid):null;}
function baseOf(it){const a=A();return a.base(it.sid,it.id,a.hideOf(it));}
function dishesOf(it){const a=A();return a.ideaLines(it,"food").map(dishOf).sort((x,y)=>x.ts-y.ts||x.name.localeCompare(y.name));}
function calTime(it,day){const a=A(),w=a.whens(it).find(x=>x.d===day);return w?clockMin(w.time):null;}

// ── drawing ──────────────────────────────────────────────────────────────────
function chip(t,cls){return '<span class="bm-chip'+(cls?" "+cls:"")+'">'+t+'</span>';}
function stepsHTML(eat,P,day){
  if(eat==null)return '<div class="bm-empty">Put in when you eat. Then each dish’s start time shows here.</div>';
  const S=steps(eat,P);
  return S.map(s=>{
    if(s.k==="eat")return '<div class="bm-step eat"><b>'+esc(stepWhen(s.at,day))+'</b><span>Everything out. Eat!'+(s.put.length?'<small>Put out: '+esc(s.put.join(", "))+'</small>':"")+'</span></div>';
    const d=s.d;return '<div class="bm-step"><b>'+esc(stepWhen(s.at,day))+'</b><span><em>'+esc(d.name)+'</em> — '+esc(intoTxt(d))+(d.temp?' · <span class="bm-nw">'+esc(tempTxt(d.temp))+'</span>':"")+' · <span class="bm-nw">'+dur(d.cook)+'</span></span></div>';
  }).join("");
}
function dishRow(d,eat,day){
  const a=A(),rec=d.mid&&a.recipes()[d.mid],bits=[];
  if(d.temp)bits.push(esc(tempTxt(d.temp)));if(d.cook)bits.push(dur(d.cook));
  if(d.in!=null)bits.push("in at "+esc(stepWhen(d.in,day)));
  if(!d.where)bits.push("where does it cook?");else if(d.where!=="none"&&!d.cook)bits.push("how long does it cook?");
  if(d.mid&&!rec)bits.push("📖 recipe gone from the Kitchen");
  const shop=rec?'<button class="bm-tool" onclick="bmShop(\''+q(d.id)+'\')">🛒 Ingredients</button>':(d.mid?"":'<button class="bm-tool" onclick="bmBuy()">🧺 What to buy</button>');
  return '<div class="bm-dish"><button class="bm-dt" onclick="bmDish(\''+q(d.id)+'\')">'+esc(d.name)+(bits.length?'<small>'+bits.join(" · ")+'</small>':"")+'</button>'+shop+'</div>';
}
function lanesHTML(P,eat,day){
  const L=lanes(P);if(!L.length)return '<div class="bm-empty">No dish has a place and a cook time yet.</div>';
  return L.map(g=>{const w=whereRow(g.where);
    return '<div class="bm-lane"><div class="bm-lh">'+w[1]+" "+esc(g.name)+'</div>'+g.dishes.map(d=>dishRow(d,eat,day)).join("")+'</div>';}).join("");
}
function pageHTML(){
  const a=A(),it=cur();
  const top='<div class="bm-top"><button class="bm-back" onclick="bmClose()">← Back</button>';
  if(!it)return top+'</div><div class="bm-empty">That meal is gone.</div>';
  const day=a.ideaDay(it),eat=eatOf(it),D=dishesOf(it),P=plan(eat,D),NT=notTimed(P),days=Object.keys(a.whens(it).reduce((m,w)=>{m[w.d]=1;return m;},{})).length;
  const ct=day?calTime(it,day):null;
  let h=top+'<div class="bm-title">'+esc(it.emoji||"🍽")+" "+esc(it.t||"")+'</div></div>';
  h+='<div class="bm-sub">'+(day?a.fmtDay(day)+(days>1?" · It is on "+days+" days. This is for the next one.":""):"📅 No day yet — the times still work. Give it a day with 📅 Schedule.")+(a.hideOf(it)?" · 🤫 a surprise — only you see this":"")+'</div>';
  h+='<div class="bm-card bm-eat"><label>🍽 We eat at <input type="time" id="bm-eat" value="'+(eat!=null?hhmm(eat):"")+'" onchange="bmEat(this.value)"></label>'
    +(eat==null&&ct!=null?'<button class="bm-go" onclick="bmEat(\''+hhmm(ct)+'\')">Use '+fmtClock(ct)+' (the calendar time)</button>':"")
    +(bmMsg?'<div class="bm-msg">'+esc(bmMsg)+'</div>':"")+'</div>';
  h+='<div class="bm-cols"><div class="bm-card"><div class="bm-h">⏱ When to start</div>'+stepsHTML(eat,P,day)+'</div>'
    +'<div class="bm-card"><div class="bm-h">🔥 Where it cooks</div>'+lanesHTML(P,eat,day)+'</div></div>';
  if(NT.length)h+='<div class="bm-card"><div class="bm-h">📝 Not timed yet</div><div class="bm-hint">Tap a dish to add where it cooks and how long.</div>'+NT.map(d=>dishRow(d,eat,day)).join("")+'</div>';
  if(!D.length)h+='<div class="bm-empty">No dishes yet. Tap ＋ Add a dish.</div>';
  h+='<div class="bm-acts"><button class="bm-go" onclick="bmDish(\'\')">＋ Add a dish</button></div>';
  h+='<div class="bm-hint">You type how long each dish cooks. The app never guesses a time. Nothing here changes the Menu, the calendar or school.</div>';
  return h+(bmEd?sheetHTML():"");
}
function field(k,label,ph,type,cls){return '<label class="bm-fl'+(cls?" "+cls:"")+'"><span>'+label+'</span><input'+(type?' type="'+type+'"':"")+(type==="number"?' inputmode="numeric" min="0"':"")+' value="'+esc(bmEd.form[k])+'" placeholder="'+esc(ph||"")+'" oninput="bmDishSet(\''+k+'\',this.value)"></label>';}
function sheetHTML(){
  const a=A(),e=bmEd,f=e.form,R=a.recipes(),ids=Object.keys(R).filter(k=>R[k]&&R[k].name).sort((x,y)=>String(R[x].name).localeCompare(String(R[y].name))),cooks=!!f.where&&f.where!=="none";
  let h='<div class="bm-h2">'+(e.fid?"🍽 "+esc(f.name||"Dish"):"＋ Add a dish")+'</div>';
  if(ids.length)h+='<label class="bm-fl wide"><span>A recipe from the Kitchen (optional)</span><select onchange="bmDishMid(this.value)"><option value="">— no recipe, just words —</option>'
    +ids.map(k=>'<option value="'+esc(k)+'"'+(f.mid===k?" selected":"")+'>'+esc((R[k].emoji?R[k].emoji+" ":"")+R[k].name)+'</option>').join("")+'</select></label>';
  h+='<div class="bm-form">'+field("name","Dish","Turkey","","wide")+'</div>';
  h+='<div class="bm-lab">Where does it cook?</div><div class="bm-chips">'+BM_WHERE.map(w=>'<button class="bm-f'+(f.where===w[0]?" on":"")+'" onclick="bmWhere(\''+w[0]+'\')">'+w[1]+" "+w[2]+'</button>').join("")+'</div>';
  if(f.where==="x")h+='<div class="bm-form">'+field("whereTxt","What is it called?","Roaster","","wide")+'</div>';
  if(cooks)h+='<div class="bm-lab">How long does it cook?</div><div class="bm-form">'+field("h","Hours","0","number")+field("m","Minutes","45","number")+field("temp","Temperature (optional)","325 or low")+'</div>';
  if(f.where==="none")h+='<div class="bm-hint">It goes on the table when you eat.</div>';
  h+='<div class="bm-acts bm-foot"><button class="bm-go" onclick="bmDishSave()">'+(e.fid?"Save":"Add")+'</button><button class="bm-tool" onclick="bmDishCancel()">Cancel</button>'
    +(e.fid?'<button class="bm-tool bm-del" onclick="bmDishDel()">'+(e.ask?"Tap again to delete":"Delete")+'</button>':"")+'</div>';
  return '<div class="bm-sheet" onclick="if(event.target===this)bmDishCancel()"><div class="bm-sh"><button class="bm-x" onclick="bmDishCancel()">✕</button>'+h+(e.msg?'<div class="bm-msg">'+esc(e.msg)+'</div>':"")+'</div></div>';
}
const BM_CSS=`
#bm-layer{position:fixed;inset:0;z-index:250;background:#f6f7f5;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:'DM Sans',sans-serif;color:#0f172a}
.bm-wrap{max-width:960px;margin:0 auto;padding:10px 16px 60px;box-sizing:border-box}
.bm-top{display:flex;align-items:center;gap:10px;margin:4px 0 2px}
.bm-back,.bm-tool{border:1.5px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;color:#0f172a;white-space:nowrap}
.bm-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;min-width:0}
.bm-sub{font-size:13px;color:#64748b;margin:2px 0 10px;line-height:1.4}
.bm-card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(43,122,120,.13);padding:10px 14px;margin-bottom:10px;min-width:0}
.bm-eat label{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800;flex-wrap:wrap}
.bm-eat input{font:inherit;font-size:18px;padding:7px 10px;border:2px solid #2B7A78;border-radius:10px;background:#fff;min-width:130px}
.bm-cols{display:grid;gap:0 10px}
@media(min-width:700px){.bm-cols{grid-template-columns:1fr 1fr}}
.bm-h{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#2B7A78;margin:2px 0 8px}
.bm-step{display:flex;gap:10px;padding:8px 0;border-top:1px solid #f1f5f9;font-size:15px;line-height:1.35}
.bm-step b{flex:0 0 96px;font-size:14px}.bm-step span{flex:1;min-width:0}.bm-step em{font-style:normal;font-weight:800}
.bm-step small{display:block;font-size:13px;color:#64748b;margin-top:2px}
.bm-step.eat{color:#166534;font-weight:800}
.bm-nw{white-space:nowrap}
.bm-lane{border-top:1px solid #f1f5f9;padding:6px 0}
.bm-lh{font-size:14px;font-weight:800;padding:2px 0}.bm-lh small{display:block;font-size:12px;font-weight:600;color:#64748b}
.bm-dish{display:flex;align-items:center;gap:6px;min-height:44px;flex-wrap:wrap}
.bm-dt{flex:1 1 180px;min-width:0;text-align:left;background:none;border:none;padding:6px 0;cursor:pointer;font:inherit;font-size:15px;color:inherit}
.bm-dt small{display:block;font-size:12px;color:#64748b;font-weight:600;margin-top:1px}
.bm-go{border:none;background:#2B7A78;color:#fff;border-radius:10px;padding:10px 14px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit}
.bm-acts{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;align-items:center}
.bm-empty{padding:10px;text-align:center;color:#64748b;font-size:13px}
.bm-hint{font-size:12px;color:#64748b;line-height:1.45;margin:4px 0 8px}
.bm-msg{margin-top:8px;font-size:13px;font-weight:700;color:#b45309}
.bm-chip{font-size:11px;font-weight:700;border:1px solid #cbd5e1;border-radius:99px;padding:1px 8px}
.bm-sheet{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:5;display:flex;align-items:flex-end;justify-content:center}
.bm-sh{position:relative;background:#fff;width:100%;max-width:640px;max-height:90vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 16px 28px;box-sizing:border-box}
.bm-x{position:absolute;right:12px;top:10px;border:none;background:#f1f5f9;border-radius:99px;width:34px;height:34px;font-size:15px;cursor:pointer}
.bm-h2{font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin:2px 40px 8px 0}
.bm-lab{font-size:13px;font-weight:800;margin:12px 0 6px}
.bm-chips{display:flex;flex-wrap:wrap;gap:6px}
.bm-f{padding:8px 11px;border-radius:99px;border:1.5px solid #cbd5e1;background:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;color:#475569}
.bm-f.on{background:#DEF2F1;color:#1f5e5c;border-color:#2B7A78}
.bm-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px 10px}
.bm-fl{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:#64748b;margin-top:6px}.bm-fl.wide{grid-column:1/-1}
.bm-fl input,.bm-fl select{font:inherit;font-size:15px;color:#0f172a;padding:9px 10px;border:1.5px solid #cbd5e1;border-radius:9px;background:#fff;width:100%;box-sizing:border-box}
.bm-foot{border-top:1px solid #f1f5f9;padding-top:10px;margin-top:14px}.bm-del{margin-left:auto;color:#b91c1c}
`;
function bmDraw(){
  if(!bmEl)return;
  if(!momOk()||!A()){bmEl.innerHTML="";bmEl.style.display="none";bmSid=bmIid=null;bmEd=null;bmMsg="";return;}   // 🤫 the switch went off: close
  bmEl.style.display="block";bmEl.innerHTML='<div class="bm-wrap">'+pageHTML()+'</div>';
}

// ── taps ─────────────────────────────────────────────────────────────────────
function bmOpen(sid,iid){
  const a=A();if(!momOk()||!a||!a.idea(sid,iid))return;   // no Mom → nothing drawn, nothing attached
  if(!document.getElementById("bm-style")){const s=document.createElement("style");s.id="bm-style";s.textContent=BM_CSS;document.head.appendChild(s);}
  bmEl=document.getElementById("bm-layer");
  if(!bmEl||!bmEl.parentNode){bmEl=document.createElement("div");bmEl.id="bm-layer";(document.body||document.documentElement).appendChild(bmEl);}
  bmSid=sid;bmIid=iid;bmEd=null;bmMsg="";bmDraw();
  try{if(bmEl.scrollTo)bmEl.scrollTo(0,0);}catch(e){}
}
function bmClose(){bmSid=bmIid=null;bmEd=null;bmMsg="";if(bmEl){bmEl.innerHTML="";bmEl.style.display="none";}const a=A();if(a&&a.repaint)a.repaint();}
function bmRefresh(){if(bmEl&&bmSid&&(!bmEd||!momOk()))bmDraw();}   // the planner's data changed (another device too)
function bmEat(v){
  const it=cur();if(!it)return;const m=clockMin(v);
  if(String(v==null?"":v).trim()===""){return;}
  if(m==null){bmMsg="Type a time like 4:00 PM.";bmDraw();return;}
  bmMsg="";const b=baseOf(it),up={};
  if(!(it.meal&&it.meal.eat===hhmm(m)))up[b+"/meal/eat"]=hhmm(m);
  if(!(it.meal&&it.meal.ts))up[b+"/meal/ts"]=Date.now();
  put(up);bmDraw();
}
function bmDish(fid){
  const it=cur();if(!it)return;let f={name:"",mid:"",where:"",whereTxt:"",h:"",m:"",temp:""};
  if(fid){const d=dishesOf(it).find(x=>x.id===fid);if(!d)return;const r=d.L.r||{};
    f={name:String(r.name||""),mid:d.mid,where:d.where,whereTxt:d.whereTxt,h:d.cook?String(Math.floor(d.cook/60)):"",m:d.cook?String(d.cook%60):"",temp:d.temp};}
  bmEd={fid:fid||null,form:f,msg:"",ask:false};bmDraw();
}
function bmDishSet(k,v){if(bmEd&&k in bmEd.form)bmEd.form[k]=String(v==null?"":v);}
function bmWhere(w){if(!bmEd||!whereRow(w))return;bmEd.form.where=bmEd.form.where===w?"":w;bmEd.msg="";bmDraw();}
function bmDishMid(v){if(!bmEd)return;const R=A().recipes(),m=R[v];bmEd.form.mid=m?v:"";if(m&&!bmEd.form.name.trim())bmEd.form.name=String(m.name||"").slice(0,80);bmEd.msg="";bmDraw();}
function bmDishCancel(){bmEd=null;bmDraw();}
function bmDishSave(){
  const e=bmEd,it=cur();if(!e||!it){bmEd=null;bmDraw();return false;}
  const a=A(),f=e.form,R=a.recipes(),L=e.fid?a.line(it.sid,it.id,"food",e.fid):null;if(e.fid&&!L){bmEd=null;bmDraw();return false;}
  const name=f.name.trim().slice(0,80),w=whereOf(f.where),cooks=!!w&&w!=="none";
  if(!name){e.msg="Give the dish a name.";bmDraw();return false;}
  const mid=(f.mid&&(R[f.mid]||(L&&L.r.mid===f.mid)))?f.mid:"",wt=w==="x"?f.whereTxt.trim().slice(0,20):"",temp=cooks?f.temp.trim().slice(0,12):"";
  if(w==="x"&&!wt){e.msg="Type what it cooks in.";bmDraw();return false;}
  let cook=null;
  if(cooks&&(f.h.trim()!==""||f.m.trim()!=="")){
    const h=f.h.trim()===""?0:(/^\d+$/.test(f.h.trim())?+f.h.trim():NaN),m=f.m.trim()===""?0:(/^\d+$/.test(f.m.trim())?+f.m.trim():NaN),t=h*60+m;
    if(!(t>=1&&t<=COOK_MAX)){e.msg="How long must be between 1 minute and 48 hours.";bmDraw();return false;}
    cook=t;
  }
  const want={name,mid:mid||null,where:w||null,whereTxt:wt||null,cook,temp:temp||null},up={};
  if(!L){const rec={name,ts:Date.now()};Object.keys(want).forEach(k=>{if(want[k]!=null&&k!=="name")rec[k]=want[k];});up[baseOf(it)+"/food/"+a.rid("f")]=rec;}
  else{const r=L.r,p=a.lineBase(L,"food")+"/";Object.keys(want).forEach(k=>{const was=r[k]==null||r[k]===""?null:r[k];if(String(was)!==String(want[k]))up[p+k]=want[k];});}
  if(Object.keys(up).length)put(up);
  bmEd=null;bmDraw();return true;
}
function bmDishDel(){
  const e=bmEd,it=cur();if(!e||!e.fid||!it)return;if(!e.ask){e.ask=true;bmDraw();return;}
  const a=A(),L=a.line(it.sid,it.id,"food",e.fid);
  if(L){const up={};up[a.lineBase(L,"food")]=null;if(put(up)&&a.stillOn)a.stillOn([L]);}
  bmEd=null;bmDraw();
}
function bmShop(fid){const a=A(),it=cur();if(it&&a.foodShop)a.foodShop(it.sid,it.id,fid);}
function bmBuy(){const a=A(),it=cur();if(it&&a.lineOpen)a.lineOpen("sup",it.id,"");}   // the planner's own supply pop-up (it sits above this page)

Object.assign(window,{bmOpen,bmClose,bmRefresh,bmEat,bmDish,bmDishSet,bmWhere,bmDishMid,bmDishCancel,bmDishSave,bmDishDel,bmShop,bmBuy});
window._bmTest={clockMin,fmtClock,hhmm,dayShift,dur,dishOf,timed,plan,steps,lanes,notTimed,stepWhen,put,eatOf,OK:BM_OK,WHERE:BM_WHERE,draw:bmDraw,
  state:()=>({sid:bmSid,iid:bmIid,ed:bmEd,el:bmEl,msg:bmMsg})};
})();
