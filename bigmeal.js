// 🍗 Seasons & Events ▸ an idea ▸ ⏱ Cooking timeline — a big meal's dishes, when we eat, and when each dish starts.
// BIGMEAL slice 1 (a second family's ask 2026-11-21 + their worksheet answers 11/24: "when to start each dish so it all finishes together",
// "where each dish cooks: oven, crockpot, air fryer, stove", "the oven temperature for each dish"; Q11 "I type how long it cooks
// and where. The app works out when to start"). Plan: PLAN_holiday_menu_2026-11-24.md §6 slice 1. Later slices (rest and get-ready
// time, warnings, the day before, the cook view, 🔴 NOW, the tablet lock) are NOT here.
// BIGMEAL slice 2: a dish can rest after cooking and need minutes to get ready first; "Heat the oven" steps; plain warnings when
// the oven needs two temperatures at once, holds more than fits, or an appliance is wanted twice — warnings NEVER block anything;
// "Your kitchen" (how many ovens, dishes at once, burners, slow cookers…) on <idea>/meal/n.
// BIGMEAL slice 3: before the day — a dish made ahead (N days before), a dish a guest brings, who makes each dish, and when to move
// a frozen one to the fridge to thaw; each with a tick-off kept under the meal's day. Guests are just typed names: nothing is sent.
// BIGMEAL slice 4: 👩‍🍳 the COOK VIEW for the kitchen tablet on the day — the tablet's clock, what's next, what's in each appliance
// now, every step with a big tick-off (kept under the meal's day: <idea>/meal/tick/<day>/<step key>), late ones in amber, what's
// still open from before the day, and who's bringing what. It redraws on a tick, on any planner change, when the screen wakes and
// once a minute — ONE setTimeout to the next minute, re-armed each time, cleared on close (never a setInterval). It asks the
// browser to keep the screen on while it's open. While it's open the layer carries class dlg-overlay + inline display:flex, so a
// deploy's reload waits (the app's haBusyReason, up to 30 min). No sound, nothing printed, nothing sent.
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
//                      (slice 2) rest:<minutes it sits after, 1–240>  prep:<minutes to get it ready, 1–600>  big:true (fills the oven)
//                      note:"Baste every 45 min" (≤120)
//                      (slice 3) how:"ahead"|"bring" (absent = cooked that day)  days:<made this many days before, 1–14> (with ahead)
//                      who:"mom"|"dad"|<kid id>  or  whoTxt:"Grandma" (≤40, a guest) — never both    thaw:{days:1–10, lb?:1–60}
//                      A made-ahead or brought dish may still have where + cook: that is "warm it up" on the day.
//   <idea>/meal/tick/<meal day>/<foodId>_<k>  <ms>   her tick-offs (a made ahead · t moved to the fridge · h a guest brought it)
//   <idea>/meal/n      {oven, spots, stove, slow, air, pot, grill, micro} — what this kitchen has (absent = the defaults, or the
//                      numbers of the family's latest other meal, shown until she changes one)
//   <idea> = seasons/ideas/<sid>/<iid> or seasonSecret/<sid>/<iid> (the planner's base()). An old food line (name only) is a dish
//   with no times — it shows under "Not timed yet". Opening the page writes nothing. No migration.
// THE RULE:  out = eat − rest · in = out − cook · start getting it ready = in − prep  (so ready + prep + cook + rest = eat).  Minutes from midnight of the meal's day;
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
const COOK_MAX=2880, DAY=1440, HEAT=15, NEAR=25;   // an oven heats 15 min before a dish goes in · 25° apart can share an oven
// what a kitchen has: [default, lowest, highest, one, many]
const BM_KIT={oven:[1,1,4,"oven","ovens"],spots:[2,1,6,"dish at once","dishes at once"],stove:[4,1,12,"burner","burners"],slow:[1,1,9],air:[1,1,9],pot:[1,1,9],grill:[1,1,9],micro:[1,1,9]};
let bmSid=null, bmIid=null, bmEd=null, bmEl=null, bmMsg="", bmView="plan", bmTimer=null, bmWake=null, bmVisOn=false;

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
function num(v,lo,hi){if(!(typeof v==="number"||/^\d+$/.test(String(v==null?"":v))))return null;const n=Math.floor(+v);return (n>=lo&&n<=hi)?n:null;}
function dishOf(L){
  const r=(L&&L.r)||{},w=whereOf(r.where),cooks=!!w&&w!=="none";
  return {id:L.id,L,name:String(r.name||"").trim()||"(no name)",mid:r.mid?String(r.mid):"",where:w,
    whereTxt:w==="x"?String(r.whereTxt||"").trim().slice(0,20):"",cook:cooks?num(r.cook,1,COOK_MAX):null,
    temp:cooks?String(r.temp==null?"":r.temp).trim().slice(0,12):"",rest:cooks?(num(r.rest,1,240)||0):0,prep:num(r.prep,1,600)||0,
    big:w==="oven"&&r.big===true,note:String(r.note==null?"":r.note).trim().slice(0,120),ts:+r.ts||0,
    how:HOWS.indexOf(r.how)>=0?r.how:"",days:r.how==="ahead"?(num(r.days,1,14)||1):0,
    who:whoOk(r.who)?String(r.who):"",whoTxt:whoOk(r.who)?"":String(r.whoTxt==null?"":r.whoTxt).trim().slice(0,40),
    thaw:(r.thaw&&typeof r.thaw==="object"&&r.how!=="bring"&&num(r.thaw.days,1,10))?{days:num(r.thaw.days,1,10),lb:num(r.thaw.lb,1,60)||0}:null};
}
const HOWS=["ahead","bring"];
function whoOk(w){try{return !!w&&A().people().some(p=>p.id===w);}catch(e){return false;}}
function whoName(d){try{return d.who?A().who(d.who).name:d.whoTxt;}catch(e){return d.whoTxt;}}
function thawDays(lb){const n=num(lb,1,60);return n?Math.min(10,Math.max(1,Math.ceil(n/4))):null;}   // the usual fridge rule: a day for every 4 pounds
// On the table with no cooking on the day: a no-cooking dish, or a made-ahead / brought one with no warm-up.
function putOut(d){return d.where==="none"||(!!d.how&&!timed(d));}
function timed(d){return !!d.where&&d.where!=="none"&&d.cook>0;}
function laneKey(d){return d.where==="x"?"x:"+(d.whereTxt.toLowerCase()||"?"):d.where;}
function laneIx(d){const i=BM_WHERE.findIndex(x=>x[0]===d.where);return i<0?99:i;}
// out = eat − rest · in = out − cook · ready = in − prep. A no-cooking dish that needs getting ready starts at eat − prep.
function plan(eat,D){return D.map(d=>{
  if(eat!=null&&timed(d)){const out=eat-d.rest,inn=out-d.cook;return Object.assign({},d,{out,in:inn,ready:d.prep?inn-d.prep:null});}
  return Object.assign({},d,{out:null,in:null,ready:(eat!=null&&d.where==="none"&&d.prep)?eat-d.prep:null});});}
function intoTxt(d){const w=whereRow(d.where);return d.where==="x"?"into the "+(d.whereTxt||"something else"):(w?w[3]:"");}
function tempTxt(t){return /^\d{2,3}$/.test(t)?t+"°":t;}
// The list in time order: heat the oven · a dish comes out (and rests) · start getting one ready · one goes in · then eat.
// "Heat the oven" only when the oven is cold: no other oven dish is in it in the 15 minutes before this one goes in.
const RANK={heat:0,o:1,r:2,i:3,eat:4};
function tempN(t){const m=/(\d{2,3})/.exec(String(t==null?"":t));return m?+m[1]:null;}
function steps(eat,P){
  if(eat==null)return [];
  const S=[],ov=P.filter(d=>d.in!=null&&d.where==="oven").sort((a,b)=>a.in-b.in);
  ov.forEach(d=>{const hot=ov.some(o=>o!==d&&o.in<d.in&&o.out>d.in-HEAT);if(!hot&&!S.some(x=>x.k==="heat"&&x.at===d.in-HEAT))S.push({at:d.in-HEAT,k:"heat",d,key:d.id+"_heat"});});   // keyed by the dish, so a tick survives a changed eat time
  P.forEach(d=>{if(d.ready!=null)S.push({at:d.ready,k:"r",d,key:d.id+"_r"});
    if(d.in!=null){S.push({at:d.in,k:"i",d,key:d.id+"_i"});if(d.rest)S.push({at:d.out,k:"o",d,key:d.id+"_o"});}});
  S.forEach(x=>{x.fid=x.d.id;});
  S.sort((a,b)=>a.at-b.at||RANK[a.k]-RANK[b.k]||laneIx(a.d)-laneIx(b.d)||a.d.name.localeCompare(b.d.name));
  S.push({at:eat,k:"eat",key:"eat",out:P.filter(d=>d.in!=null&&!d.rest).map(d=>d.name),put:P.filter(putOut).map(d=>d.name)});
  return S;
}
// By place: one group per appliance in use (her own "something else" names each get one), then "No cooking".
function lanes(P){
  const G={},order=[];
  P.filter(d=>timed(d)||putOut(d)).forEach(d=>{const t=timed(d),k=t?laneKey(d):"none",w=t?d.where:"none";if(!G[k]){G[k]={key:k,where:w,name:w==="x"?d.whereTxt||"Something else":whereRow(w)[2],dishes:[]};order.push(k);}G[k].dishes.push(d);});
  const L=order.map(k=>G[k]).sort((a,b)=>BM_WHERE.findIndex(x=>x[0]===a.where)-BM_WHERE.findIndex(x=>x[0]===b.where)||a.name.localeCompare(b.name));
  L.forEach(g=>g.dishes.sort((a,b)=>(a.in==null?1e9:a.in)-(b.in==null?1e9:b.in)||a.name.localeCompare(b.name)));
  return L;
}
// ── your kitchen, and the warnings ────────────────────────────────────────────
function kitN(raw){const n={};Object.keys(BM_KIT).forEach(k=>{const v=raw&&typeof raw==="object"?num(raw[k],BM_KIT[k][1],BM_KIT[k][2]):null;n[k]=v||BM_KIT[k][0];});return n;}
function hasN(m){return !!(m&&typeof m==="object"&&m.n&&typeof m.n==="object"&&Object.keys(m.n).some(k=>BM_KIT[k]));}
function kitchenOf(it){   // her numbers · else the family's latest other meal's (shown, not saved, until she changes one) · else the defaults
  if(it&&hasN(it.meal))return {n:kitN(it.meal.n),from:"own"};
  const a=A();let best=null;
  try{a.seasons().forEach(s=>a.ideasOf(s.id).forEach(x=>{if(it&&x.id===it.id&&x.sid===it.sid)return;if(hasN(x.meal)&&(!best||(+x.meal.ts||0)>(+best.meal.ts||0)))best=x;}));}catch(e){}
  return best?{n:kitN(best.meal.n),from:"copy",src:best}:{n:kitN(null),from:"default"};
}
function capOf(n,key){return BM_KIT[key]?n[key]:1;}
// At every moment a dish goes in or comes out: oven dishes grouped by temperature (25° apart = the same setting; a dish with no
// temperature joins the first group — it takes room but is never "a different temperature"); each group needs ceil(dishes ÷ dishes-at-once) ovens (a dish that fills the oven
// counts as a full oven). More ovens needed than she has → "temp" when there are more temperatures than ovens, else "full".
// Any other appliance: more dishes in it than she has → "one" ("stove" for burners). The same warning over touching moments is ONE.
function clashes(P,n){
  const T=P.filter(d=>d.in!=null),pts=[...new Set(T.reduce((a,d)=>a.concat([d.in,d.out]),[]))].sort((a,b)=>a-b),out=[];
  [...new Set(T.map(laneKey))].forEach(key=>{let cur=null;
    for(let i=0;i<pts.length-1;i++){
      const t=pts[i],B=T.filter(d=>laneKey(d)===key&&d.in<=t&&t<d.out).sort((a,b)=>a.in-b.in||a.name.localeCompare(b.name));let k=null,G=null;
      if(key==="oven"&&B.length){G=[];const add=(g,d)=>{g.w+=d.big?n.spots:1;g.d.push(d);};
        B.filter(d=>tempN(d.temp)!=null).forEach(d=>{const tn=tempN(d.temp);let g=G.find(x=>Math.abs(x.t-tn)<=NEAR);if(!g){g={t:tn,w:0,d:[]};G.push(g);}add(g,d);});
        B.filter(d=>tempN(d.temp)==null).forEach(d=>{if(!G.length)G.push({t:null,w:0,d:[]});add(G[0],d);});   // no temperature: fits with any — it still takes room
        const need=G.reduce((a,g)=>a+Math.ceil(g.w/n.spots),0);if(need>n.oven)k=G.filter(g=>g.t!=null).length>n.oven?"temp":"full";}
      else if(key!=="oven"&&B.length>capOf(n,key))k=key==="stove"?"stove":"one";
      const ids=B.map(d=>d.id).sort().join(",");
      if(k&&cur&&cur.k===k&&cur.ids===ids&&cur.to===t)cur.to=pts[i+1];
      else if(k){cur={k,key,from:t,to:pts[i+1],ids,dishes:B,groups:G};out.push(cur);}
      else cur=null;
    }});
  return out.sort((a,b)=>a.from-b.from);
}
function andList(x){return x.length<2?x.join(""):x.slice(0,-1).join(", ")+" and "+x[x.length-1];}
function theTxt(d){return intoTxt(d).replace(/^(into|onto) /,"");}
function warnText(c,n,day){
  const when="From "+stepWhen(c.from,day)+" to "+stepWhen(c.to,day),D=c.dishes,nm=andList(D.map(d=>d.name));
  if(c.k==="temp"){const G=c.groups.filter(g=>g.t!=null).sort((a,b)=>a.t-b.t);
    return when+", the oven needs "+andList(G.map(g=>g.t+"° for "+andList(g.d.map(d=>d.name))))+". "+(n.oven===1?(G.length===2?"One oven can’t do both.":"One oven can’t do them all."):"Your "+n.oven+" ovens can’t do "+G.length+" temperatures at once.");}
  if(c.k==="full"){const big=D.filter(d=>d.big).map(d=>d.name);
    return when+", "+D.length+" dishes are in the oven: "+nm+". "+(n.oven===1?"Your oven fits "+n.spots:"Your "+n.oven+" ovens fit "+n.oven*n.spots)+" at once."+(big.length?" "+andList(big)+(big.length>1?" each fill":" fills")+" a whole oven.":"");}
  if(c.k==="stove")return when+", "+D.length+" dishes are on the stove: "+nm+". You have "+n.stove+" burner"+(n.stove===1?"":"s")+".";
  return when+", "+D.length+" dishes want "+theTxt(D[0])+": "+nm+".";
}
function notTimed(P){return P.filter(d=>!timed(d)&&!putOut(d));}
// ── before the day (slice 3) ──────────────────────────────────────────────────
// thaw: move it to the fridge thaw.days before · ahead: make it days before · bring: grouped by who brings it. Dates come from
// the meal's day each time (nothing stored as a date), so they move when the day moves.
function before(D,day){
  const a=A(),at=n=>day&&a?a.addDays(day,-n):"",list=[];
  D.forEach(d=>{if(d.thaw)list.push({k:"t",d,n:d.thaw.days,day:at(d.thaw.days),key:d.id+"_t"});if(d.how==="ahead")list.push({k:"a",d,n:d.days,day:at(d.days),key:d.id+"_a"});});
  list.sort((x,y)=>y.n-x.n||(x.k===y.k?0:(x.k==="t"?-1:1))||x.d.name.localeCompare(y.d.name));
  const by={},order=[];D.filter(d=>d.how==="bring").forEach(d=>{const n=whoName(d)||"",k=n.toLowerCase();if(!by[k]){by[k]={name:n,dishes:[]};order.push(k);}by[k].dishes.push(d);});
  const bring=order.map(k=>by[k]).sort((x,y)=>(!x.name)-(!y.name)||x.name.localeCompare(y.name));
  return {list,bring};
}
function names(sid){   // guest names typed before in this season — chips to tap
  const a=A(),m={};try{a.ideasOf(sid).forEach(it=>a.ideaLines(it,"food").forEach(L=>{const d=dishOf(L);if(d.whoTxt&&!m[d.whoTxt.toLowerCase()])m[d.whoTxt.toLowerCase()]=d.whoTxt;}));}catch(e){}
  return Object.keys(m).sort().map(k=>m[k]).slice(0,12);
}
function ticksOf(it,day){const t=it&&it.meal&&it.meal.tick;return (day&&t&&typeof t==="object"&&t[day]&&typeof t[day]==="object")?t[day]:{};}
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
function stepTxt(s){
  const d=s.d,nw=t=>'<span class="bm-nw">'+t+'</span>';
  if(s.k==="heat")return "Heat the oven"+(tempN(d.temp)!=null?" to "+nw(esc(tempTxt(d.temp))):"");
  if(s.k==="r")return "Start <em>"+esc(d.name)+"</em> ("+nw(dur(d.prep))+" to get it ready)";
  if(s.k==="o")return "<em>"+esc(d.name)+"</em> comes out · rests "+nw(dur(d.rest));
  return "<em>"+esc(d.name)+"</em> — "+esc(d.how?"warm it up "+(d.where==="stove"||d.where==="grill"?"on ":"in ")+theTxt(d):intoTxt(d))+(d.temp?" · "+nw(esc(tempTxt(d.temp))):"")+" · "+nw(dur(d.cook));
}
function stepsHTML(eat,P,day){
  if(eat==null)return '<div class="bm-empty">Put in when you eat. Then each dish’s start time shows here.</div>';
  return steps(eat,P).map(s=>{
    if(s.k==="eat")return '<div class="bm-step eat"><b>'+esc(stepWhen(s.at,day))+'</b><span>Everything out. Eat!'+(s.put.length?'<small>Put out: '+esc(s.put.join(", "))+'</small>':"")+'</span></div>';
    return '<div class="bm-step'+(s.k==="heat"?" heat":"")+'"><b>'+esc(stepWhen(s.at,day))+'</b><span>'+stepTxt(s)+'</span></div>';
  }).join("");
}
function warnHTML(C,n,day){
  return C.map(c=>{const btn=(c.k==="one"&&BM_KIT[c.key])||c.k==="stove";
    return '<div class="bm-warn">⚠ '+esc(warnText(c,n,day))+(btn?' <button class="bm-tool" onclick="bmHave(\''+c.key+'\','+c.dishes.length+')">I have '+c.dishes.length+(c.k==="stove"?" burners":"")+'</button>':"")+'</div>';}).join("");
}
function kitHTML(K){
  const n=K.n,row=(k,lbl)=>'<div class="bm-kit"><span>'+lbl+'</span><button class="bm-tool" onclick="bmKit(\''+k+'\',-1)"'+(n[k]<=BM_KIT[k][1]?" disabled":"")+'>−</button><b>'+n[k]+'</b><button class="bm-tool" onclick="bmKit(\''+k+'\',1)"'+(n[k]>=BM_KIT[k][2]?" disabled":"")+'>＋</button></div>';
  const extra=["slow","air","pot","grill","micro"].filter(k=>n[k]>1).map(k=>n[k]+" × "+whereRow(k)[2].toLowerCase());
  return '<div class="bm-card"><div class="bm-h">🏠 Your kitchen</div>'+row("oven","🔥 Ovens")+row("spots","Dishes in one oven at once")+row("stove","🍳 Burners")
    +(extra.length?'<div class="bm-hint">Also: '+esc(extra.join(" · "))+'</div>':"")
    +(K.from==="copy"?'<div class="bm-hint">Same as '+esc(K.src.t||"your last meal")+'. Change it here for this meal.</div>':"")+'</div>';
}
function dishRow(d,eat,day){
  const a=A(),rec=d.mid&&a.recipes()[d.mid],bits=[];
  if(d.temp)bits.push(esc(tempTxt(d.temp)));if(d.cook)bits.push(dur(d.cook));
  if(d.prep)bits.push(dur(d.prep)+" to get ready");if(d.rest)bits.push("rests "+dur(d.rest));if(d.big)bits.push("fills the oven");
  if(d.where==="oven"&&d.cook&&!d.temp)bits.push('<span class="bm-chip">no temperature</span>');
  if(d.in!=null)bits.push("in at "+esc(stepWhen(d.in,day))+(d.rest?" · out "+esc(stepWhen(d.out,day)):""));
  if(d.how==="ahead")bits.push("📦 made "+d.days+" day"+(d.days===1?"":"s")+" before"+(whoName(d)?" by "+esc(whoName(d)):""));
  else if(d.how==="bring")bits.push("🚗 "+(whoName(d)?esc(whoName(d))+" brings it":"someone brings it — who?"));
  else if(whoName(d))bits.push("👩‍🍳 "+esc(whoName(d))+" makes it");
  if(d.thaw)bits.push("🧊 thaws "+d.thaw.days+" day"+(d.thaw.days===1?"":"s")+" in the fridge");
  if(d.note)bits.push("📝 "+esc(d.note));
  if(!d.where&&!d.how)bits.push("where does it cook?");else if(d.where!=="none"&&!d.cook)bits.push("how long does it cook?");
  if(d.mid&&!rec)bits.push("📖 recipe gone from the Kitchen");
  const shop=d.how==="bring"?"":rec?'<button class="bm-tool" onclick="bmShop(\''+q(d.id)+'\')">🛒 Ingredients</button>':(d.mid?"":'<button class="bm-tool" onclick="bmBuy()">🧺 What to buy</button>');
  return '<div class="bm-dish"><button class="bm-dt" onclick="bmDish(\''+q(d.id)+'\')">'+esc(d.name)+(bits.length?'<small>'+bits.join(" · ")+'</small>':"")+'</button>'+shop+'</div>';
}
function beforeHTML(it,D,day){
  const B=before(D,day);if(!B.list.length&&!B.bring.length)return "";
  const a=A(),T=ticksOf(it,day),t=a.today(),tk=key=>day?'<button class="bm-tk'+(T[key]?" on":"")+'" onclick="bmTick(\''+q(key)+'\')" aria-label="Done">'+(T[key]?"✅":"☐")+'</button>':"";
  let h='<div class="bm-card"><div class="bm-h">🧊 Before the day</div>'+(day?"":'<div class="bm-hint">📅 Give it a day to get dates and reminders.</div>');
  B.list.forEach(x=>{const d=x.d,late=day&&x.day<t&&!T[x.key],w=whoName(d);
    const what=x.k==="t"?"Move "+d.name+" to the fridge to thaw"+(d.thaw.lb?" ("+d.thaw.lb+" lb)":""):"Make "+d.name+(w?" — "+w:"");
    h+='<div class="bm-row'+(T[x.key]?" done":"")+'">'+tk(x.key)+'<span><b>'+esc(day?a.fmtDay(x.day):"")+'</b>'+(day?" — ":"")+esc(what)+' <small>('+x.n+" day"+(x.n===1?"":"s")+' before)</small>'+(late?' <i class="bm-late">late</i>':"")+'</span></div>';});
  if(B.bring.length)h+='<div class="bm-lab">🚗 Who brings what</div>'+B.bring.map(g=>g.dishes.map(d=>'<div class="bm-row'+(T[d.id+"_h"]?" done":"")+'">'+tk(d.id+"_h")+'<span><b>'+esc(g.name||"Nobody yet")+':</b> '+esc(d.name)+(T[d.id+"_h"]?" <small>— it’s here</small>":"")+'</span></div>').join("")).join("");
  return h+'</div>';
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
  const ct=day?calTime(it,day):null,K=kitchenOf(it),C=eat!=null?clashes(P,K.n):[];
  let h=top+'<div class="bm-title">'+esc(it.emoji||"🍽")+" "+esc(it.t||"")+'</div>'+(eat!=null?'<button class="bm-go bm-cookbtn" onclick="bmCook()">👩‍🍳 Cook view</button>':"")+'</div>';
  h+='<div class="bm-sub">'+(day?a.fmtDay(day)+(days>1?" · It is on "+days+" days. This is for the next one.":""):"📅 No day yet — the times still work. Give it a day with 📅 Schedule.")+(a.hideOf(it)?" · 🤫 a surprise — only you see this":"")+'</div>';
  h+='<div class="bm-card bm-eat"><label>🍽 We eat at <input type="time" id="bm-eat" value="'+(eat!=null?hhmm(eat):"")+'" onchange="bmEat(this.value)"></label>'
    +(eat==null&&ct!=null?'<button class="bm-go" onclick="bmEat(\''+hhmm(ct)+'\')">Use '+fmtClock(ct)+' (the calendar time)</button>':"")
    +(bmMsg?'<div class="bm-msg">'+esc(bmMsg)+'</div>':"")+'</div>';
  if(C.length)h+='<div class="bm-warns">'+warnHTML(C,K.n,day)+'<div class="bm-hint">These are only warnings. Change a dish or your kitchen, or ignore them.</div></div>';
  else if(eat!=null&&P.some(d=>d.in!=null))h+='<div class="bm-ok">✓ Nothing clashes.</div>';
  h+='<div class="bm-cols"><div class="bm-card"><div class="bm-h">⏱ When to start</div>'+stepsHTML(eat,P,day)+'</div>'
    +'<div class="bm-card"><div class="bm-h">🔥 Where it cooks</div>'+lanesHTML(P,eat,day)+'</div></div>';
  h+=beforeHTML(it,D,day);
  if(NT.length)h+='<div class="bm-card"><div class="bm-h">📝 Not timed yet</div><div class="bm-hint">Tap a dish to add where it cooks and how long.</div>'+NT.map(d=>dishRow(d,eat,day)).join("")+'</div>';
  if(!D.length)h+='<div class="bm-empty">No dishes yet. Tap ＋ Add a dish.</div>';
  h+='<div class="bm-acts"><button class="bm-go" onclick="bmDish(\'\')">＋ Add a dish</button></div>'+kitHTML(K);
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
  h+='<div class="bm-lab">How does it get made?</div><div class="bm-chips">'+[["","🍳 Cooked that day"],["ahead","📦 Made before the day"],["bring","🚗 Someone brings it"]].map(x=>'<button class="bm-f'+(f.how===x[0]?" on":"")+'" onclick="bmHow(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div>';
  if(f.how==="ahead")h+='<div class="bm-form">'+field("days","How many days before?","1","number")+'</div>';
  const P=a.people(),G=names(e.sid);
  h+='<div class="bm-lab">'+(f.how==="bring"?"Who brings it?":"Who makes it? (optional)")+'</div><div class="bm-chips">'+P.map(x=>'<button class="bm-f'+(f.who===x.id&&!f.whoTxt.trim()?" on":"")+'" onclick="bmWho(\''+q(x.id)+'\')">'+esc(x.name)+'</button>').join("")
    +G.map(g=>'<button class="bm-f'+(f.whoTxt.trim().toLowerCase()===g.toLowerCase()?" on":"")+'" onclick="bmGuest(\''+q(g)+'\')">'+esc(g)+'</button>').join("")+'</div>'
    +'<div class="bm-form">'+field("whoTxt","Or someone else (a guest)","Grandma","","wide")+'</div>';
  h+='<div class="bm-lab">'+(f.how?"Warm it up on the day? (optional)":"Where does it cook?")+'</div><div class="bm-chips">'+BM_WHERE.map(w=>'<button class="bm-f'+(f.where===w[0]?" on":"")+'" onclick="bmWhere(\''+w[0]+'\')">'+w[1]+" "+w[2]+'</button>').join("")+'</div>';
  if(f.where==="x")h+='<div class="bm-form">'+field("whereTxt","What is it called?","Roaster","","wide")+'</div>';
  if(cooks)h+='<div class="bm-lab">How long does it cook?</div><div class="bm-form">'+field("h","Hours","0","number")+field("m","Minutes","45","number")+field("temp","Temperature (optional)","325 or low")+'</div>'
    +'<div class="bm-form">'+field("prep","Minutes to get it ready first (optional)","20","number")+field("rest","Minutes it rests after (optional)","45","number")+'</div>'
    +(f.where==="oven"?'<label class="bm-check"><input type="checkbox"'+(f.big?" checked":"")+' onchange="bmDishSet(\'big\',this.checked?\'1\':\'\')"> It fills the whole oven (nothing else fits beside it)</label>':"");
  if(f.where==="none")h+='<div class="bm-form">'+field("prep","Minutes to get it ready (optional)","15","number")+'</div>';
  h+='<div class="bm-form">'+field("note","Note (optional)","Baste every 45 minutes","","wide")+'</div>';
  if(f.where==="none")h+='<div class="bm-hint">It goes on the table when you eat.</div>';
  if(f.how!=="bring")h+='<div class="bm-lab">🧊 Frozen? (optional)</div><div class="bm-form">'+field("thawD","Move to the fridge — days before","4","number")+field("thawLb","…or its weight in pounds","16","number")+'</div>'
    +'<div class="bm-hint">Usual rule: 1 day in the fridge for every 4 pounds. Check your package.</div>';
  h+='<div class="bm-acts bm-foot"><button class="bm-go" onclick="bmDishSave()">'+(e.fid?"Save":"Add")+'</button><button class="bm-tool" onclick="bmDishCancel()">Cancel</button>'
    +(e.fid?'<button class="bm-tool bm-del" onclick="bmDishDel()">'+(e.ask?"Tap again to delete":"Delete")+'</button>':"")+'</div>';
  return '<div class="bm-sheet" onclick="if(event.target===this)bmDishCancel()"><div class="bm-sh"><button class="bm-x" onclick="bmDishCancel()">✕</button>'+h+(e.msg?'<div class="bm-msg">'+esc(e.msg)+'</div>':"")+'</div></div>';
}
// ── 👩‍🍳 the cook view (slice 4) ─────────────────────────────────────────────────
// now = minutes from midnight of the meal's day by the TABLET's clock (the day before is negative). _mlNowMin (the app's clock
// helper, tests set it) when there, else the device clock.
function clockNow(){try{if(typeof _mlNowMin==="function"){const m=_mlNowMin();if(typeof m==="number"&&m>=0&&m<DAY)return m;}}catch(e){}const d=new Date();return d.getHours()*60+d.getMinutes();}
function nowAbs(day){const a=A();return (day&&a?a.daysTo(day,a.today()):0)*DAY+clockNow();}
// next = the first step not ticked · late = not ticked and its time went by (never after the meal's day) · inNow per appliance:
// ticked in and not yet out ("in"), or not ticked but the plan says it should be in by now ("should").
function stateAt(S,P,T,now,after){
  const open=S.filter(s=>!T[s.key]),late=after?[]:open.filter(s=>now>s.at),inNow=[];
  P.filter(d=>d.in!=null).forEach(d=>{const i=!!T[d.id+"_i"],out=d.rest?!!T[d.id+"_o"]:!!T.eat;
    if(i&&!out)inNow.push({d,how:"in"});else if(!i&&!out&&!after&&d.in<=now&&now<d.out)inNow.push({d,how:"should"});});
  return {next:open[0]||null,late,inNow};
}
function untilTxt(n){if(n<=0)return "now";return dur(n);}
function cookStepHTML(s,T,now,after,day){
  const done=!!T[s.key],lateBy=(!done&&!after&&now>s.at)?now-s.at:0,a=A(),mid=s.d&&s.d.mid,rec=mid&&a.recipes()[mid];
  const txt=s.k==="eat"?"Everything out. Eat!"+(s.put.length?"<small>Put out: "+esc(s.put.join(", "))+"</small>":""):stepTxt(s);
  const pop=(s.k==="i"&&rec&&typeof grMealPop==="function")?'<button class="bm-tool" onclick="bmRecipe(\''+q(mid)+'\')">📖</button>':"";
  return '<div class="bm-cs'+(done?" done":"")+(lateBy?" late":"")+(s.k==="eat"?" eat":"")+'"><button class="bm-ctk'+(done?" on":"")+'" onclick="bmTick(\''+q(s.key)+'\')" aria-label="Done">'+(done?"✅":"☐")+'</button>'
    +'<b>'+esc(stepWhen(s.at,day))+'</b><span>'+txt+(lateBy?' <i class="bm-late">late '+dur(lateBy)+'</i>':"")+'</span>'+pop+'</div>';
}
function cookHTML(){
  const a=A(),it=cur();if(!it)return '<div class="bm-top"><button class="bm-back" onclick="bmClose()">← Back</button></div><div class="bm-empty">That meal is gone.</div>';
  const day=a.ideaDay(it),eat=eatOf(it),D=dishesOf(it),P=plan(eat,D),S=steps(eat,P),T=ticksOf(it,day),dd=day?a.daysTo(a.today(),day):0,after=dd<0,now=nowAbs(day),st=stateAt(S,P,T,now,after);
  let h='<div class="bm-top"><button class="bm-back" onclick="bmCookClose()">✕ Close</button><div class="bm-title">👩‍🍳 '+esc(it.t||"")+'</div></div>';
  h+='<div class="bm-clock"><div class="bm-now">It is '+fmtClock(clockNow())+'</div><div class="bm-sub">'
    +(dd>0?"This is for "+esc(a.fmtDay(day))+" (in "+dd+" day"+(dd===1?"":"s")+").":(after?"This was "+esc(a.fmtDay(day))+".":(eat!=null?"We eat at "+fmtClock(eat)+(now<eat?" · "+untilTxt(eat-now)+" to go":(now===eat?" · now!":"")):"No eat time yet.")))+'</div>'
    +(momOk()?'<label class="bm-small">Change the eat time <input type="time" value="'+(eat!=null?hhmm(eat):"")+'" onchange="bmEat(this.value)"></label>':"")+(bmMsg?'<div class="bm-msg">'+esc(bmMsg)+'</div>':"")+'</div>';
  if(eat==null)return h+'<div class="bm-empty">Put in when you eat first. Then every step shows here.</div>';
  const nx=st.next;
  let left='<div class="bm-card bm-next"><div class="bm-h">⏭ Next</div>'+(nx?'<div class="bm-nx"><b>'+esc(stepWhen(nx.at,day))+'</b> — '+(nx.k==="eat"?"Everything out. Eat!":stepTxt(nx))+'<small>'+(dd>0||after?"":(now<nx.at?"in "+dur(nx.at-now):(now===nx.at?"now":"late "+dur(now-nx.at))))+'</small></div>':'<div class="bm-nx">✅ All done. Enjoy!</div>')+'</div>';
  const byLane={};st.inNow.forEach(x=>{const k=laneKey(x.d);(byLane[k]=byLane[k]||{d:x.d,L:[]}).L.push(x);});
  left+='<div class="bm-card"><div class="bm-h">🔥 Cooking now</div>'+(Object.keys(byLane).length?Object.keys(byLane).map(k=>{const g=byLane[k],w=whereRow(g.d.where);
      return '<div class="bm-in"><b>'+w[1]+" "+esc(g.d.where==="x"?g.d.whereTxt:w[2])+'</b>'+g.L.map(x=>'<div class="'+(x.how==="should"?"bm-should":"")+'">'+esc(x.d.name)+' <small>'+fmtClock(x.d.in)+"–"+fmtClock(x.d.out)+(x.how==="should"?" · should be in — tick it":"")+'</small></div>').join("")+'</div>';}).join(""):'<div class="bm-empty">Nothing is cooking.</div>')+'</div>';
  const B=before(D,day),open=B.list.filter(x=>!T[x.key]);
  let right=open.length?'<div class="bm-card bm-open"><div class="bm-h">🧊 Still open from before the day</div>'+open.map(x=>'<div class="bm-row"><button class="bm-tk" onclick="bmTick(\''+q(x.key)+'\')">☐</button><span>'+esc((x.k==="t"?"Move "+x.d.name+" to the fridge":"Make "+x.d.name))+' <small>('+esc(day?a.fmtDay(x.day):x.n+" days before")+')</small></span></div>').join("")+'</div>':"";
  right+='<div class="bm-card"><div class="bm-h">⏱ Every step</div>'+S.map(x=>cookStepHTML(x,T,now,after,day)).join("")+'</div>';
  if(B.bring.length)right+='<div class="bm-card"><div class="bm-h">🚗 Coming with guests</div>'+B.bring.map(g=>g.dishes.map(d=>'<div class="bm-row'+(T[d.id+"_h"]?" done":"")+'"><button class="bm-tk'+(T[d.id+"_h"]?" on":"")+'" onclick="bmTick(\''+q(d.id+"_h")+'\')">'+(T[d.id+"_h"]?"✅":"☐")+'</button><span>'+esc(d.name)+' — '+esc(g.name||"nobody yet")+'</span></div>').join("")).join("")+'</div>';
  return h+'<div class="bm-cook"><div class="bm-cl">'+left+'</div><div class="bm-cr">'+right+'</div></div>';
}
function armMinute(){disarm();if(bmView!=="cook"||!bmSid||typeof setTimeout!=="function")return;const ms=60000-(Date.now()%60000)+50;bmTimer=setTimeout(()=>{bmTimer=null;if(bmView==="cook"&&bmSid)bmDraw();},ms);}
function disarm(){if(bmTimer!=null){try{clearTimeout(bmTimer);}catch(e){}bmTimer=null;}}
function wakeOn(){try{if(typeof navigator!=="undefined"&&navigator.wakeLock&&navigator.wakeLock.request&&!bmWake)navigator.wakeLock.request("screen").then(l=>{if(bmView==="cook"&&bmSid)bmWake=l;else{try{l.release();}catch(e){}}}).catch(()=>{});}catch(e){}}
function wakeOff(){try{if(bmWake&&bmWake.release)bmWake.release();}catch(e){}bmWake=null;}
function bmVis(){try{if(document.visibilityState==="visible"&&bmView==="cook"&&bmSid){bmWake=null;wakeOn();bmDraw();}}catch(e){}}   // the screen woke: catch up, keep it on
function visOn(on){try{if(typeof document.addEventListener!=="function"||on===bmVisOn)return;if(on)document.addEventListener("visibilitychange",bmVis);else document.removeEventListener("visibilitychange",bmVis);bmVisOn=on;}catch(e){}}
function cookOff(){disarm();wakeOff();visOn(false);}
const BM_CSS=`
#bm-layer{position:fixed;inset:0;z-index:250;background:#f6f7f5;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:'DM Sans',sans-serif;color:#0f172a}
.bm-wrap{max-width:960px;margin:0 auto;padding:10px 16px 60px;box-sizing:border-box}
.bm-top{display:flex;align-items:center;gap:10px;margin:4px 0 2px}
.bm-back,.bm-tool{border:1.5px solid #cbd5e1;background:#fff;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;color:#0f172a;white-space:nowrap}
.bm-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;min-width:0;flex:1}.bm-cookbtn{flex:none}
.bm-sub{font-size:13px;color:#64748b;margin:2px 0 10px;line-height:1.4}
.bm-card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(43,122,120,.13);padding:10px 14px;margin-bottom:10px;min-width:0}
.bm-eat label{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800;flex-wrap:wrap}
.bm-eat input{font:inherit;font-size:18px;padding:7px 10px;border:2px solid #2B7A78;border-radius:10px;background:#fff;min-width:130px}
.bm-cols{display:grid;gap:0 10px;grid-template-columns:minmax(0,1fr)}
@media(min-width:700px){.bm-cols{grid-template-columns:1fr 1fr}}
.bm-h{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#2B7A78;margin:2px 0 8px}
.bm-step{display:flex;gap:10px;padding:8px 0;border-top:1px solid #f1f5f9;font-size:15px;line-height:1.35}
.bm-step b{flex:0 0 96px;font-size:14px}.bm-step span{flex:1;min-width:0}.bm-step em{font-style:normal;font-weight:800}
.bm-step small{display:block;font-size:13px;color:#64748b;margin-top:2px}
.bm-step.eat{color:#166534;font-weight:800}
.bm-nw{white-space:nowrap}
.bm-step.heat{color:#b45309}
.bm-warns{margin-bottom:10px}.bm-warn{background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:9px 12px;margin-bottom:6px;font-size:14px;font-weight:700;color:#92400e;line-height:1.4}
.bm-warn .bm-tool{margin-left:6px;padding:5px 10px}
.bm-ok{background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:14px;font-weight:800;color:#166534}
.bm-kit{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:14px}.bm-kit span{flex:1}.bm-kit b{min-width:22px;text-align:center;font-size:16px}
.bm-tool:disabled{opacity:.4}
.bm-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #f1f5f9;font-size:14px;line-height:1.35}.bm-row span{flex:1;min-width:0}
.bm-row small{color:#64748b;font-weight:600}.bm-row.done span{color:#64748b;text-decoration:line-through}
.bm-tk{flex:none;width:44px;height:44px;border:1.5px solid #cbd5e1;border-radius:10px;background:#fff;font-size:20px;cursor:pointer;line-height:1}
.bm-tk.on{border-color:#86efac;background:#f0fdf4}
.bm-late{font-style:normal;font-size:11px;font-weight:800;color:#fff;background:#d97706;border-radius:99px;padding:1px 7px;margin-left:2px;white-space:nowrap;display:inline-block}
.bm-clock{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(43,122,120,.13);padding:10px 14px;margin:6px 0 10px}
.bm-now{font-size:30px;font-weight:800;line-height:1.1}.bm-clock .bm-sub{font-size:17px;color:#334155;font-weight:700;margin:4px 0}
.bm-small{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#64748b;flex-wrap:wrap}.bm-small input{font:inherit;padding:5px 8px;border:1.5px solid #cbd5e1;border-radius:8px}
.bm-cook{display:grid;gap:0 12px;grid-template-columns:minmax(0,1fr)}@media(min-width:700px){.bm-cook{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:start}.bm-cl{position:sticky;top:8px}}
.bm-nx{font-size:22px;line-height:1.3}.bm-nx small{display:block;font-size:16px;font-weight:800;color:#b45309;margin-top:4px}
.bm-in{padding:6px 0;border-top:1px solid #f1f5f9;font-size:18px}.bm-in div{font-size:17px;margin:2px 0 2px 6px}.bm-in small{color:#64748b;font-weight:600}
.bm-should{color:#94a3b8}.bm-open{border:2px solid #fcd34d}
.bm-cs{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #f1f5f9;font-size:19px;line-height:1.3}
.bm-cs b{flex:0 0 92px;font-size:17px}.bm-cs span{flex:1;min-width:0}.bm-cs small{display:block;font-size:15px;color:#64748b}
.bm-cs.done span,.bm-cs.done b{color:#94a3b8;text-decoration:line-through}.bm-cs.late b{color:#b45309}.bm-cs.eat{color:#166534;font-weight:800}
.bm-ctk{flex:none;width:58px;height:58px;border:2px solid #cbd5e1;border-radius:12px;background:#fff;font-size:28px;cursor:pointer;line-height:1}.bm-ctk.on{border-color:#86efac;background:#f0fdf4}
#bm-layer{flex-direction:column;align-items:stretch}.bm-wrap{flex:none;width:100%}
.bm-check{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;margin-top:10px}
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
  if(!momOk()||!A()){cookOff();bmEl.innerHTML="";bmEl.className="";bmEl.style.display="none";bmSid=bmIid=null;bmEd=null;bmMsg="";bmView="plan";return;}   // 🤫 the switch went off: close
  const cook=bmView==="cook";
  bmEl.className=cook?"dlg-overlay":"";bmEl.style.display=cook?"flex":"block";   // the cook view holds back a deploy's reload (haBusyReason)
  bmEl.innerHTML='<div class="bm-wrap">'+(cook?cookHTML():pageHTML())+'</div>';
  if(cook)armMinute();
}

// ── taps ─────────────────────────────────────────────────────────────────────
function bmOpen(sid,iid){
  const a=A();if(!momOk()||!a||!a.idea(sid,iid))return;   // no Mom → nothing drawn, nothing attached
  if(!document.getElementById("bm-style")){const s=document.createElement("style");s.id="bm-style";s.textContent=BM_CSS;document.head.appendChild(s);}
  bmEl=document.getElementById("bm-layer");
  if(!bmEl||!bmEl.parentNode){bmEl=document.createElement("div");bmEl.id="bm-layer";(document.body||document.documentElement).appendChild(bmEl);}
  cookOff();bmSid=sid;bmIid=iid;bmEd=null;bmMsg="";bmView="plan";bmDraw();
  try{if(bmEl.scrollTo)bmEl.scrollTo(0,0);}catch(e){}
}
function bmClose(){cookOff();bmSid=bmIid=null;bmEd=null;bmMsg="";bmView="plan";if(bmEl){bmEl.innerHTML="";bmEl.className="";bmEl.style.display="none";}const a=A();if(a&&a.repaint)a.repaint();}
function bmCook(){if(!cur())return;bmEd=null;bmMsg="";bmView="cook";wakeOn();visOn(true);bmDraw();try{if(bmEl.scrollTo)bmEl.scrollTo(0,0);}catch(e){}}
function bmCookClose(){cookOff();bmView="plan";bmMsg="";bmDraw();}
function bmRecipe(mid){try{if(typeof grMealPop==="function"&&A().recipes()[mid])grMealPop(mid);}catch(e){}}   // read-only recipe pop-up, writes nothing
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
  const it=cur();if(!it)return;let f={name:"",mid:"",where:"",whereTxt:"",h:"",m:"",temp:"",prep:"",rest:"",big:"",note:"",how:"",days:"",who:"",whoTxt:"",thawD:"",thawLb:""};
  if(fid){const d=dishesOf(it).find(x=>x.id===fid);if(!d)return;const r=d.L.r||{};
    f={name:String(r.name||""),mid:d.mid,where:d.where,whereTxt:d.whereTxt,h:d.cook?String(Math.floor(d.cook/60)):"",m:d.cook?String(d.cook%60):"",temp:d.temp,prep:d.prep?String(d.prep):"",rest:d.rest?String(d.rest):"",big:d.big?"1":"",note:d.note,how:d.how,days:d.how==="ahead"?String(d.days):"",who:d.who,whoTxt:d.whoTxt,thawD:d.thaw?String(d.thaw.days):"",thawLb:d.thaw&&d.thaw.lb?String(d.thaw.lb):""};}
  bmEd={fid:fid||null,sid:it.sid,form:f,msg:"",ask:false};bmDraw();
}
function bmDishSet(k,v){if(bmEd&&k in bmEd.form)bmEd.form[k]=String(v==null?"":v);}
function bmWhere(w){if(!bmEd||!whereRow(w))return;bmEd.form.where=bmEd.form.where===w?"":w;bmEd.msg="";bmDraw();}
function bmDishMid(v){if(!bmEd)return;const R=A().recipes(),m=R[v];bmEd.form.mid=m?v:"";if(m&&!bmEd.form.name.trim())bmEd.form.name=String(m.name||"").slice(0,80);bmEd.msg="";bmDraw();}
function bmHow(v){if(!bmEd||(v&&HOWS.indexOf(v)<0))return;bmEd.form.how=bmEd.form.how===v?"":v;bmEd.msg="";bmDraw();}
function bmWho(id){if(!bmEd||!whoOk(id))return;const f=bmEd.form;f.who=(f.who===id&&!f.whoTxt.trim())?"":id;f.whoTxt="";bmDraw();}
function bmGuest(n){if(!bmEd)return;bmEd.form.whoTxt=String(n||"").slice(0,40);bmEd.form.who="";bmDraw();}
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
  const mins=(v,hi)=>{const t=String(v||"").trim();if(t==="")return 0;return (/^\d+$/.test(t)&&+t<=hi)?+t:NaN;};
  const prep=(cooks||w==="none")?mins(f.prep,600):0,rest=cooks?mins(f.rest,240):0;
  if(isNaN(prep)){e.msg="Getting it ready must be 0 to 600 minutes.";bmDraw();return false;}
  if(isNaN(rest)){e.msg="Resting must be 0 to 240 minutes.";bmDraw();return false;}
  const how=HOWS.indexOf(f.how)>=0?f.how:"",dS=String(f.days||"").trim(),days=how==="ahead"?(dS===""?1:num(dS,1,14)):null;
  if(how==="ahead"&&days==null){e.msg="Made before the day must be 1 to 14 days.";bmDraw();return false;}
  const whoTxt=f.whoTxt.trim().slice(0,40),who=whoTxt?"":(whoOk(f.who)?f.who:"");
  let thaw=null;const tD=String(f.thawD||"").trim(),tL=String(f.thawLb||"").trim();
  if(how!=="bring"&&(tD!==""||tL!=="")){
    const lb=tL===""?0:num(tL,1,60);if(lb==null){e.msg="Pounds must be 1 to 60.";bmDraw();return false;}
    const dd=tD===""?thawDays(lb):num(tD,1,10);if(dd==null){e.msg="Thawing must be 1 to 10 days.";bmDraw();return false;}
    thaw={days:dd};if(lb)thaw.lb=lb;
  }
  const want={how:how||null,days,who:who||null,whoTxt:whoTxt||null,thaw,name,mid:mid||null,where:w||null,whereTxt:wt||null,cook,temp:temp||null,prep:prep||null,rest:rest||null,big:(w==="oven"&&f.big)?true:null,note:f.note.trim().slice(0,120)||null},up={};
  if(!L){const rec={name,ts:Date.now()};Object.keys(want).forEach(k=>{if(want[k]!=null&&k!=="name")rec[k]=want[k];});up[baseOf(it)+"/food/"+a.rid("f")]=rec;}
  else{const r=L.r,p=a.lineBase(L,"food")+"/";Object.keys(want).forEach(k=>{const was=r[k]==null||r[k]===""?null:r[k];if(JSON.stringify(was)!==JSON.stringify(want[k]))up[p+k]=want[k];});}
  if(Object.keys(up).length)put(up);
  bmEd=null;bmDraw();return true;
}
function bmDishDel(){
  const e=bmEd,it=cur();if(!e||!e.fid||!it)return;if(!e.ask){e.ask=true;bmDraw();return;}
  const a=A(),L=a.line(it.sid,it.id,"food",e.fid);
  if(L){const up={};up[a.lineBase(L,"food")]=null;if(put(up)&&a.stillOn)a.stillOn([L]);}
  bmEd=null;bmDraw();
}
// "I have 2" · ＋ / − on Your kitchen. A meal still showing the latest other meal's numbers saves those too, so nothing jumps.
function bmHave(key,val){
  const it=cur();if(!it||!BM_KIT[key])return;const K=kitchenOf(it),v=num(val,BM_KIT[key][1],BM_KIT[key][2]);if(v==null)return;
  const b=baseOf(it)+"/meal/n/",up={};
  if(K.from==="copy")Object.keys(K.n).forEach(k=>{if(K.n[k]!==BM_KIT[k][0])up[b+k]=K.n[k];});
  if(K.from!=="own"||K.n[key]!==v)up[b+key]=v;
  if(Object.keys(up).length)put(up);bmDraw();
}
function bmKit(key,delta){const it=cur();if(it&&BM_KIT[key])bmHave(key,kitchenOf(it).n[key]+delta);}
// ☐ / ✅ a before-the-day line (made it · in the fridge · it's here) — kept under the meal's day, so a moved day starts clean.
function bmTick(key){
  const it=cur(),a=A();if(!it||!/^[A-Za-z0-9_-]{1,60}$/.test(String(key||"")))return;const day=a.ideaDay(it);if(!day)return;
  const on=!!ticksOf(it,day)[key],up={};up[baseOf(it)+"/meal/tick/"+day+"/"+key]=on?null:Date.now();put(up);bmDraw();
}
function bmShop(fid){const a=A(),it=cur();if(it&&a.foodShop)a.foodShop(it.sid,it.id,fid);}
function bmBuy(){const a=A(),it=cur();if(it&&a.lineOpen)a.lineOpen("sup",it.id,"");}   // the planner's own supply pop-up (it sits above this page)

Object.assign(window,{bmCook,bmCookClose,bmRecipe,bmHow,bmWho,bmGuest,bmTick,bmHave,bmKit,bmOpen,bmClose,bmRefresh,bmEat,bmDish,bmDishSet,bmWhere,bmDishMid,bmDishCancel,bmDishSave,bmDishDel,bmShop,bmBuy});
window._bmTest={nowAbs,stateAt,clockNow,cook:()=>({view:bmView,timer:bmTimer!=null,wake:!!bmWake,vis:bmVisOn}),before,names,thawDays,putOut,ticksOf,whoName,tempN,clashes,kitchenOf,kitN,warnText,HEAT,NEAR,KIT:BM_KIT,clockMin,fmtClock,hhmm,dayShift,dur,dishOf,timed,plan,steps,lanes,notTimed,stepWhen,put,eatOf,OK:BM_OK,WHERE:BM_WHERE,draw:bmDraw,
  state:()=>({sid:bmSid,iid:bmIid,ed:bmEd,el:bmEl,msg:bmMsg})};
})();
