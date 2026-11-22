// ✨ Kids' Corner ▸ Our plans — the kids' side of 🎉 Seasons & Events (slice 3; her "Yes, kids' page" 2026-11-21;
// PLAN_season_planner_2026-11-20.md §4.9–4.10 and her answers 3–7: kids "add ideas + see the plan" · a kid's idea goes "straight on
// the list" · "three ⭐ each per season" · a scheduled idea shows to the whole family "unless it's a surprise" · "option for mom to
// make it a surprise to where it wouldnt show and could hint or not hint").
// Loaded lazily by index.html's SEASONKID block the first time a kid taps ✨ Our plans — never at app start. This is NOT Mom's
// seasons.js and it runs none of her logic.
//
// WHAT A KID SEES: only a season Mom switched "open to the kids" (seasons/list/<sid>.kids === true, and not 📜 past). In it: each
// idea's picture + words, who wants it, and its day as a countdown in sleeps. Never a note, a supply, a to-do or a book-by date.
// WHAT A KID CAN DO: add an idea in words (it is theirs: by = the kid) · ✋ me too on any idea · put THREE ⭐ per season · take off
// their OWN idea while nobody has given it a day or added anything to it. A kid cannot schedule, change or remove anyone else's idea.
// THE APP NEVER SUGGESTS AN IDEA (her rule: the wish is theirs): no starter list, no examples, no picture palette.
//
// 🤫 SURPRISES: a surprise's record lives only in Mom's secret node, and THIS FILE NEVER READS IT — not a listener, not a one-time
// read; it does not even name it. So a 🤐 no-hint surprise shows a kid nothing at all. A ✨ hint shows only what the family calendar
// already shows every device: an event that says "A surprise" on its day (the cover event Mom's page wrote). Nothing links it to an idea.
//
// Reads (only while the page is open; all stop when it closes):  seasons/list  ·  seasons/ideas/<sid> for each season open to the kids
//   (+ calendarData.events, which every device already has).
// Writes — ONE multi-path update per tap, each path checked by okPath() for THIS kid, only when !_dryRun():
//   seasons/ideas/<sid>/<new id>          {t, by:<kid>, want:{<kid>:true}, ts}     a NEW idea, marked as theirs
//   seasons/ideas/<sid>/<iid>/want/<kid>  true | null                               ✋ me too (their own mark only)
//   seasons/ideas/<sid>/<iid>/star/<kid>  true | null                               ⭐ (their own mark only)
//   seasons/ideas/<sid>/<iid>             null                                      their OWN idea, only while it has no day and nothing on it
//
// 🧹 YOUR JOBS (SEASONJOBS step B, her yes to "Dad & kid to-dos" 2026-11-21): a planner to-do Mom gave THIS kid shows at the top of
// this page from its show day (its due day, or the days ahead she picked), and the kid ticks it. Read: seasonJobs/<this kid> ONLY
// (Mom's device writes those records; a surprise's to-dos are never sent). Writes, checked by okPath() for this kid:
//   seasonJobs/<kid>/<id>/done   "today" | null      only their own job, once it is showing
//   seasonJobs/<kid>/<id>/bid    <bank entry id> | null   the stars it paid — through the app's OWN bankDirect, the way every chore pays
// ⭐ pay only if Mom put a number on it: on the tick, bankDirect(kid, stars, label, choreVerifyOn(kid)) (held for Mom's check when that
// kid's chore check is on); un-tick takes back exactly that entry; a job already holding a bid is never paid twice.
// A job never gates school, the morning gate, a routine or a missed chore: it lives only on this page.
(function(){
"use strict";
let skList={}, skIdeas={}, skFor=null, skListRef=null, skListCb=null, skLoaded=false, skSid=null, skDraft=null, skAsk=null, skMsg="";
const skRefs={};   // sid → {r, cb}: one listener per season that is open to the kids
let skJobs={}, skJobRef=null, skJobCb=null, skJobsOk=false;   // 🧹 seasonJobs/<this kid> — their jobs from the planner
const SK_STARS=3;   // her answer 2026-11-20: "three ⭐ each per season" — the same count Mom's page uses (a season's own `stars` wins)
const SK_MAX=30, SK_TEXT=60;   // ideas one kid may add to one season · letters in an idea
const SK_HINT_TITLE="A surprise", SK_HINT_EMOJI="✨";   // what Mom's page writes on the calendar for a ✨ hint
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function today(){return (typeof _todayStr==="function")?_todayStr():new Date().toISOString().slice(0,10);}
function dry(){return typeof _dryRun==="function"&&_dryRun();}
function live(){return typeof db!=="undefined"&&!!db&&!dry();}
function toast(m){if(typeof gwShowToast==="function")gwShowToast(m);}
function little(k){try{return typeof kcLittle==="function"&&kcLittle(k);}catch(e){return false;}}
function isIso(s){return /^\d{4}-\d{2}-\d{2}$/.test(String(s||""));}
function dOf(iso){const p=String(iso).split("-");return new Date(Date.UTC(+p[0],+p[1]-1,+p[2],12));}
function daysTo(a,b){return Math.round((dOf(b)-dOf(a))/864e5);}
function fmtDay(iso){if(!isIso(iso))return "";const d=dOf(iso);return DOW[d.getUTCDay()]+" "+MON[d.getUTCMonth()]+" "+d.getUTCDate();}
function keys(o){return (o&&typeof o==="object")?Object.keys(o).filter(k=>o[k]):[];}
function roster(){try{return (typeof ROSTER_DEF!=="undefined"&&Array.isArray(ROSTER_DEF))?ROSTER_DEF:[];}catch(e){return [];}}
function isKid(k){return !!k&&roster().some(r=>r.id===k);}
function who(id){
  if(id==="mom")return {name:"Mom",color:"#b5394a"};if(id==="dad")return {name:"Dad",color:"#1d4ed8"};if(id==="family")return {name:"Everyone",color:"#2B7A78"};
  const r=roster().find(x=>x.id===id);return r?{name:r.name,color:r.color||"#64748b"}:{name:String(id||""),color:"#64748b"};
}
function col(k){return who(k).color;}
function evs(){try{return (typeof calendarData!=="undefined"&&calendarData&&calendarData.events)||{};}catch(e){return {};}}

// ── listening: only while the page is open ───────────────────────────────────
function listen(k){
  if(skFor===k)return;stop();skFor=k;
  if(typeof db==="undefined"||!db){skLoaded=true;return;}
  skListRef=db.ref("seasons/list");skListCb=s=>{if(skFor!==k)return;skList=s.val()||{};skLoaded=true;sync();paint();};
  skListRef.on("value",skListCb);
  skJobRef=db.ref("seasonJobs/"+k);skJobCb=s=>{if(skFor!==k)return;skJobs=s.val()||{};skJobsOk=true;paint();};   // 🧹 their jobs only
  skJobRef.on("value",skJobCb);
}
function sync(){   // listen to the ideas of the seasons that are open to the kids — and to no other season's
  if(typeof db==="undefined"||!db)return;
  const want=openSeasons().map(s=>s.id),k=skFor;
  Object.keys(skRefs).forEach(sid=>{if(want.indexOf(sid)>=0)return;try{skRefs[sid].r.off("value",skRefs[sid].cb);}catch(e){}delete skRefs[sid];delete skIdeas[sid];});
  want.forEach(sid=>{if(skRefs[sid])return;const r=db.ref("seasons/ideas/"+sid),cb=s=>{if(skFor!==k||!skRefs[sid])return;skIdeas[sid]=s.val()||{};paint();};skRefs[sid]={r,cb};r.on("value",cb);});
}
function stop(){
  if(skListRef){try{skListRef.off("value",skListCb);}catch(e){}}
  if(skJobRef){try{skJobRef.off("value",skJobCb);}catch(e){}}skJobRef=null;skJobCb=null;skJobs={};skJobsOk=false;
  Object.keys(skRefs).forEach(sid=>{try{skRefs[sid].r.off("value",skRefs[sid].cb);}catch(e){}delete skRefs[sid];});
  skListRef=null;skListCb=null;skFor=null;skList={};skIdeas={};skLoaded=false;skSid=null;skDraft=null;skAsk=null;skMsg="";
}

// ── what's there (for a kid) ─────────────────────────────────────────────────
function openSeasons(){
  return Object.keys(skList||{}).filter(id=>{const s=skList[id];return s&&typeof s==="object"&&s.kids===true&&!s.closed;}).map(id=>Object.assign({id},skList[id]))
    .sort((a,b)=>String(a.start||"9999").localeCompare(String(b.start||"9999"))||(a.ts||0)-(b.ts||0));
}
function curSid(){const S=openSeasons();if(skSid&&S.some(s=>s.id===skSid))return skSid;return skSid=S[0]?S[0].id:null;}
// An idea a kid may see: a plain record with words. Anything carrying a surprise mark is dropped (none should ever be here).
function ideas(sid){const o=skIdeas[sid]||{};return Object.keys(o).filter(id=>o[id]&&typeof o[id]==="object"&&typeof o[id].t==="string"&&!o[id].hide&&!o[id].skip).map(id=>Object.assign({id},o[id]));}
function when(it){   // its day, from the family calendar: the next one, else the last one that went by
  const E=evs(),t=today(),W=keys(it.ev).map(id=>E[id]).filter(e=>e&&isIso(e.date)).map(e=>({d:e.date,time:e.time||""})).sort((a,b)=>a.d.localeCompare(b.d));
  return W.filter(w=>w.d>=t)[0]||W[W.length-1]||null;
}
function state(it){if(it.did)return "done";const w=when(it);return !w?"none":(w.d>=today()?"soon":"past");}
function covers(s){   // ✨ "A surprise" days: straight from the family calendar, inside this season's dates. Nothing else is known here.
  const E=evs(),t=today();
  return Object.keys(E).map(id=>E[id]).filter(e=>e&&e.title===SK_HINT_TITLE&&e.emoji===SK_HINT_EMOJI&&isIso(e.date)&&e.date>=t&&(!isIso(s.start)||e.date>=s.start)&&(!isIso(s.end)||e.date<=s.end))
    .map(e=>({d:e.date,time:e.time||""}));
}
function starMax(s){const n=+((s||{}).stars);return n>0?Math.floor(n):SK_STARS;}
function starsUsed(sid,k){return ideas(sid).filter(it=>it.star&&it.star[k]).length;}
function canRemove(it,k){return !!(it&&typeof it==="object"&&it.by===k&&!it.did&&!keys(it.ev).length&&!it.sup&&!it.todo&&!it.bookBy);}

// 🧹 their jobs that show today: from the show day on; a done one stays (ticked) for the rest of the day it was done
function jobs(){const t=today(),o=skJobs||{};return Object.keys(o).filter(id=>{const j=o[id];return j&&typeof j==="object"&&typeof j.t==="string"&&isIso(j.show)&&j.show<=t&&(!j.done||j.done===t);})
  .map(id=>Object.assign({id},o[id])).sort((a,b)=>(!!a.done-!!b.done)||String(a.due||"9999").localeCompare(String(b.due||"9999"))||(a.ts||0)-(b.ts||0));}

// ── the one door for a kid's writes ──────────────────────────────────────────
function okJob(p,v,k){   // 🧹 seasonJobs/<this kid>/<id>/done|bid — their own job, once it is showing
  const m=/^seasonJobs\/([^\/]+)\/([^\/]+)\/(done|bid)$/.exec(p);if(!m||m[1]!==k||!isKid(k))return false;
  const j=(skJobs||{})[m[2]];if(!j||typeof j!=="object"||!isIso(j.show)||j.show>today())return false;
  return m[3]==="done"?(v===null||v===today()):(v===null||(typeof v==="string"&&v.length>0&&v.length<60));
}
function okPath(p,v,k){
  if(/^seasonJobs\//.test(p))return okJob(p,v,k);
  const m=/^seasons\/ideas\/([^\/]+)\/([^\/]+)(?:\/(want|star)\/([^\/]+))?$/.exec(p);if(!m||!isKid(k))return false;
  const s=skList[m[1]];if(!s||s.kids!==true||s.closed)return false;                 // only a season Mom opened to the kids
  const cur=(skIdeas[m[1]]||{})[m[2]];
  if(m[3])return m[4]===k&&!!cur&&typeof cur==="object"&&(v===true||v===null);    // this kid's OWN ✋ / ⭐, on an idea that is there
  if(v===null)return canRemove(cur,k);                                                // their OWN idea, with no day and nothing on it
  return !cur&&!!v&&typeof v==="object"&&v.by===k&&typeof v.t==="string";            // a NEW idea, marked as theirs
}
function apply(up,k){
  const P=Object.keys(up);if(!P.length||P.some(p=>!okPath(p,up[p],k))){if(P.length){try{console.warn("our plans: refused a write",P);}catch(e){}}return false;}
  P.forEach(p=>{const a=p.split("/"),v=up[p],sid=a[2],iid=a[3];
    if(a[0]==="seasonJobs"){const j=skJobs[a[2]];if(j){if(v===null)delete j[a[3]];else j[a[3]]=v;}return;}
    const S=skIdeas[sid]||(skIdeas[sid]={});
    if(a.length===4){if(v===null)delete S[iid];else S[iid]=JSON.parse(JSON.stringify(v));}
    else{const o=S[iid][a[4]]||(S[iid][a[4]]={});if(v===null)delete o[a[5]];else o[a[5]]=true;}});
  if(live())db.ref().update(up);
  return true;
}

// ── drawing ──────────────────────────────────────────────────────────────────
function sleeps(n){return n<=0?"today!":(n===1?"in 1 sleep":"in "+n+" sleeps");}
function dayLine(w){return fmtDay(w.d)+(w.time?" · "+esc(w.time):"");}
function whoChips(it){return keys(it.want).map(w=>{const p=who(w);return '<span class="sk-who" style="background:'+esc(p.color)+'">'+esc(p.name)+((it.star&&it.star[w])?" ⭐":"")+'</span>';}).join("");}
function card(k,it){
  const st=state(it),w=when(it),id=esc(it.id),mine=!!(it.want&&it.want[k]),star=!!(it.star&&it.star[k]),c=col(k);
  const by=it.by===k?"your idea":(isKid(it.by)?esc(who(it.by).name)+"’s idea":"");
  let badge="";
  if(st==="soon")badge='<div class="sk-count" style="background:'+c+'"><b>'+sleeps(daysTo(today(),w.d))+'</b><span>'+dayLine(w)+'</span></div>';
  else if(st==="done")badge='<div class="sk-count done"><b>✅ we did it</b></div>';
  let h='<div class="sk-card'+(st==="done"?" dim":"")+'"><div class="sk-main"><div class="sk-em">'+esc(it.emoji||"💡")+'</div><div class="sk-wt"><div class="sk-words">'+esc(it.t)+'</div>'
    +'<div class="sk-whos">'+whoChips(it)+(by?'<span class="sk-by">'+by+'</span>':"")+(st==="past"?'<span class="sk-by">its day was '+fmtDay(w.d)+'</span>':"")+'</div></div>'+badge+'</div>';
  if(st!=="done"){
    h+='<div class="sk-acts"><button class="sk-btn sk-me'+(mine?" on":"")+'" style="'+(mine?"background:"+c+";border-color:"+c+";color:#fff":"border-color:"+c+";color:"+c)+'" onclick="skMe(\''+id+'\')">✋ '+(mine?"I want this ✓":"Me too")+'</button>'
      +'<button class="sk-btn sk-star'+(star?" on":"")+'" aria-label="Star" onclick="skStar(\''+id+'\')">'+(star?"⭐":"☆")+'</button>';
    if(canRemove(it,k))h+=skAsk===it.id?'<button class="sk-btn sk-rm" onclick="skRemove(\''+id+'\')">Tap again to take it off</button><button class="sk-btn" onclick="skKeep()">Keep it</button>'
      :'<button class="sk-btn sk-del" aria-label="Take my idea off" onclick="skRemove(\''+id+'\')">✕</button>';
    h+='</div>';
  }
  return h+'</div>';
}
function jobCard(k,j){   // 🧹 one job: a big tick, the words, what it's for, when, and ⭐ if Mom put stars on it
  const n=j.due?daysTo(today(),j.due):null,c=col(k),on=!!j.done;
  const when=on?"Done!":(n==null?"":(n<0?"was due "+fmtDay(j.due):"due "+sleeps(n)));
  return '<div class="sk-card sk-job'+(on?" done":"")+'"><div class="sk-main"><button class="sk-tick" style="border-color:'+c+';'+(on?"background:"+c+";color:#fff":"color:"+c)+'" onclick="skJob(\''+esc(j.id)+'\')">'+(on?"✓":"")+'</button>'
    +'<div class="sk-wt"><div class="sk-words">'+esc(j.t)+'</div>'+(j.for?'<div class="sk-for">for '+esc(j.for)+'</div>':"")+'</div></div>'
    +'<div class="sk-row">'+(when?'<span class="sk-badge'+(n!=null&&n<0&&!on?" late":"")+'">'+esc(when)+'</span>':"")+(+j.stars>0?'<span class="sk-badge star">⭐ '+(+j.stars)+'</span>':"")+'</div></div>';
}
function coverCard(k,x){return '<div class="sk-card"><div class="sk-main"><div class="sk-em">'+SK_HINT_EMOJI+'</div><div class="sk-wt"><div class="sk-words">'+SK_HINT_TITLE+'</div></div>'
  +'<div class="sk-count" style="background:'+col(k)+'"><b>'+sleeps(daysTo(today(),x.d))+'</b><span>'+dayLine(x)+'</span></div></div></div>';}
function composer(k){
  const c=col(k),d=skDraft,can=!!String(d.text||"").trim();
  return '<div class="sk-card sk-comp" style="border-color:'+c+'"><label class="sk-lbl">What do you want to do?<input id="sk-text" class="sk-in" maxlength="'+SK_TEXT+'" autocomplete="off" placeholder="Type your idea" value="'+esc(d.text||"")+'" oninput="skSet(this.value)" onkeydown="if(event.key===\'Enter\')skAdd()"></label>'
    +(skMsg?'<div class="sk-note">'+esc(skMsg)+'</div>':"")
    +'<div class="sk-acts"><button class="sk-btn sk-go" style="background:'+c+';border-color:'+c+';opacity:'+(can?1:.45)+'" '+(can?"":"disabled ")+'onclick="skAdd()">✓ Add my idea</button><button class="sk-btn" onclick="skCancel()">Cancel</button></div></div>';
}
function inner(k){
  const c=col(k);
  let h='<div class="sk-top"><button class="sk-btn sk-back" style="border-color:'+c+';color:'+c+'" onclick="skBack()">← Back</button>'
    +'<div><div class="sk-title">✨ Our plans</div><div class="sk-sub">Things we want to do. Mom picks the days.</div></div></div>';
  if(!skLoaded)return h+'<div class="sk-empty">Opening…</div>';
  const J=jobs();if(J.length)h+='<div class="sk-h">🧹 Your jobs</div>'+J.map(j=>jobCard(k,j)).join("");   // 🧹 SEASONJOBS step B
  const S=openSeasons(),sid=curSid(),s=S.find(x=>x.id===sid);
  if(!s)return h+(J.length?"":'<div class="sk-empty">Nothing to plan yet.</div>');
  if(S.length>1)h+='<div class="sk-tabs">'+S.map(x=>'<button class="sk-btn'+(x.id===sid?" on":"")+'" style="'+(x.id===sid?"background:"+c+";border-color:"+c+";color:#fff":"")+'" onclick="skPick(\''+esc(x.id)+'\')">'+esc(x.emoji||"🎉")+" "+esc(x.name||"")+'</button>').join("")+'</div>';
  else h+='<div class="sk-season">'+esc(s.emoji||"🎉")+" "+esc(s.name||"")+'</div>';
  if(!skIdeas[sid]&&typeof db!=="undefined"&&db)return h+'<div class="sk-empty">Opening…</div>';   // this season's ideas are still on their way
  const I=ideas(sid),max=starMax(s),used=Math.min(max,starsUsed(sid,k)),left=max-used,mineN=I.filter(it=>it.by===k).length;
  h+='<div class="sk-stars">'+"⭐".repeat(used)+"☆".repeat(left)+' <span>'+(left?left+" star"+(left===1?"":"s")+" left — tap ☆ on what you want most":"all your stars are out")+'</span></div>';
  if(skDraft)h+=composer(k);
  else if(mineN>=SK_MAX)h+='<div class="sk-empty">You added a lot! Take one off to add another.</div>';
  else h+='<button class="sk-btn sk-add" style="border-color:'+c+';color:'+c+'" onclick="skNew()">＋ Add an idea</button>';
  if(skMsg&&!skDraft)h+='<div class="sk-note">'+esc(skMsg)+'</div>';
  const t=today(),soon=I.filter(it=>state(it)==="soon").map(it=>({d:when(it).d,h:card(k,it)})).concat(covers(s).map(x=>({d:x.d,h:coverCard(k,x)}))).sort((a,b)=>a.d.localeCompare(b.d));
  const wait=I.filter(it=>{const x=state(it);return x==="none"||x==="past";}).sort((a,b)=>(!!(b.star&&b.star[k])-!!(a.star&&a.star[k]))||keys(b.star).length-keys(a.star).length||(a.ts||0)-(b.ts||0));
  const done=I.filter(it=>state(it)==="done");
  if(soon.length)h+='<div class="sk-h">Coming up</div>'+soon.map(x=>x.h).join("");
  if(wait.length)h+='<div class="sk-h">No day yet</div>'+wait.map(it=>card(k,it)).join("");
  if(done.length)h+='<div class="sk-h">We did it</div>'+done.map(it=>card(k,it)).join("");
  if(!soon.length&&!wait.length&&!done.length&&!skDraft)h+='<div class="sk-empty">No ideas yet.</div>';
  return h;
}
// A re-draw (a listener, or any redraw of the Corner) keeps the kid's typing: the box gets focus back.
function keepFocus(){
  let had=false,pos=0;try{const a=document.activeElement;if(a&&a.id==="sk-text"){had=true;pos=a.selectionStart||String(a.value||"").length;}}catch(e){}
  return ()=>{if(!had)return;setTimeout(()=>{try{const e=document.getElementById("sk-text");if(e&&document.activeElement!==e){e.focus();e.setSelectionRange(pos,pos);}}catch(x){}},0);};
}
function paint(){if(!skFor)return;try{if(typeof tab!=="undefined"&&tab!=="kids"){stop();return;}}catch(e){}   // the kid left Kids' Corner: stop listening
  const el=document.getElementById("sk-root");if(!el)return;const back=keepFocus();el.innerHTML=inner(skFor);back();}
function style(){if(document.getElementById("sk-style"))return;const s=document.createElement("style");s.id="sk-style";s.textContent=SK_CSS;document.head.appendChild(s);}
window.seasonKidPageHTML=function(k){
  if(!isKid(k))return "";listen(k);style();const back=keepFocus();back();
  return '<div id="sk-root" class="sk-page'+(little(k)?" sk-little":"")+'">'+inner(k)+'</div>';
};
window.seasonKidStop=stop;

// ── the kid's taps ───────────────────────────────────────────────────────────
function skPick(sid){skSid=sid;skDraft=null;skAsk=null;skMsg="";paint();}
function skNew(){if(!skFor||!curSid())return;skDraft={text:""};skMsg="";skAsk=null;paint();setTimeout(()=>{try{const e=document.getElementById("sk-text");if(e)e.focus();}catch(x){}},0);}
function skCancel(){skDraft=null;skMsg="";paint();}
function skSet(v){if(!skDraft)return;const had=!!String(skDraft.text||"").trim();skDraft.text=String(v||"").slice(0,SK_TEXT);if(had!==!!String(skDraft.text).trim()||skMsg){skMsg="";paint();}}   // re-draw only when Add turns on / off
function skAdd(){
  const k=skFor,sid=curSid(),d=skDraft;if(!k||!sid||!d)return;
  const t=String(d.text||"").trim().replace(/\s+/g," ").slice(0,SK_TEXT);if(!t)return;
  const I=ideas(sid),low=t.toLowerCase();
  if(I.some(it=>String(it.t).trim().toLowerCase()===low)){skMsg="That one is on the list already. Tap ✋ on it.";return paint();}
  if(I.filter(it=>it.by===k).length>=SK_MAX){skMsg="You added a lot! Take one off to add another.";return paint();}
  const iid="k"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),rec={t,by:k,want:{},ts:Date.now()};rec.want[k]=true;
  const up={};up["seasons/ideas/"+sid+"/"+iid]=rec;
  if(!apply(up,k)){skMsg="That didn’t work — try again.";return paint();}
  skDraft=null;skMsg="";toast("✨ On the list");paint();
}
function skMe(iid){   // ✋ me too — and taking it back takes their ⭐ back with it
  const k=skFor,sid=curSid(),it=sid&&(skIdeas[sid]||{})[iid];if(!k||!it)return;
  const b="seasons/ideas/"+sid+"/"+iid+"/",on=!(it.want&&it.want[k]),up={};
  up[b+"want/"+k]=on?true:null;if(!on&&it.star&&it.star[k])up[b+"star/"+k]=null;
  skMsg="";skAsk=null;apply(up,k);paint();
}
function skStar(iid){   // ⭐ — three per season; a star also says "me too"
  const k=skFor,sid=curSid(),it=sid&&(skIdeas[sid]||{})[iid];if(!k||!it)return;
  const b="seasons/ideas/"+sid+"/"+iid+"/",up={},max=starMax(skList[sid]);
  if(it.star&&it.star[k])up[b+"star/"+k]=null;
  else{
    if(starsUsed(sid,k)>=max){skMsg="All "+max+" of your stars are out. Tap a ⭐ to take one back first.";skAsk=null;return paint();}
    up[b+"star/"+k]=true;if(!(it.want&&it.want[k]))up[b+"want/"+k]=true;
  }
  skMsg="";skAsk=null;apply(up,k);paint();
}
// Kiosk browsers can't show confirm(), so the second tap is the yes.
function skRemove(iid){
  const k=skFor,sid=curSid(),it=sid&&(skIdeas[sid]||{})[iid];if(!k||!it||!canRemove(it,k))return;
  if(skAsk!==iid){skAsk=iid;return paint();}
  skAsk=null;const up={};up["seasons/ideas/"+sid+"/"+iid]=null;apply(up,k);paint();
}
function skKeep(){skAsk=null;paint();}
// 🧹 tick / un-tick one of their jobs. Stars go through the app's own bank (see the header) — checked FIRST, paid only if the write is allowed.
function skJob(id){
  const k=skFor,j=(skJobs||{})[id];if(!k||!j)return;const on=!j.done,P="seasonJobs/"+k+"/"+id+"/",up={};up[P+"done"]=on?today():null;
  if(!okPath(P+"done",up[P+"done"],k))return;
  if(!dry()){
    if(on){if(+j.stars>0&&!j.bid&&typeof bankDirect==="function"){let bid=null;try{bid=bankDirect(k,+j.stars,"🎉 "+String(j.t).slice(0,80),(typeof choreVerifyOn==="function"&&choreVerifyOn(k)))||null;}catch(e){}if(bid)up[P+"bid"]=bid;}}
    else if(j.bid){try{if(!(typeof cuUnpay==="function"&&cuUnpay(k,j.bid,"🎉 "+String(j.t).slice(0,80)))&&typeof bankDirectRemove==="function")bankDirectRemove(k,j.bid);}catch(e){}up[P+"bid"]=null;}
  }
  apply(up,k);if(on&&+j.stars>0)toast("⭐ +"+(+j.stars)+" — nice work!");paint();
}
Object.assign(window,{skPick,skNew,skCancel,skSet,skAdd,skMe,skStar,skRemove,skKeep,skJob});
window._skTest={jobs,okJob,setJobs:j=>{skJobs=j||{};skJobsOk=true;},jobData:()=>skJobs,setData:(list,ideasBySid)=>{skList=list||{};skIdeas=ideasBySid||{};skLoaded=true;},setFor:k=>{skFor=k;},list:()=>skList,data:()=>skIdeas,draft:()=>skDraft,msg:()=>skMsg,
  inner,ideas,openSeasons,covers,state,when,canRemove,okPath,apply,starsUsed,starMax,sleeps,refs:()=>Object.keys(skRefs),HINT:[SK_HINT_TITLE,SK_HINT_EMOJI],STARS:SK_STARS};

const SK_CSS=`
.sk-page{padding:12px 12px 80px;max-width:720px;margin:0 auto;font-family:'DM Sans',sans-serif}
.sk-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.sk-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700}
.sk-sub{font-size:13px;color:var(--muted);font-weight:600;margin-top:2px}
.sk-btn{border:2px solid #cbd5e1;background:#fff;border-radius:14px;padding:10px 14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;color:#0f172a;min-height:44px}
.sk-back{flex:none}
.sk-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.sk-season{font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin-bottom:8px}
.sk-stars{font-size:22px;letter-spacing:2px;margin-bottom:10px}
.sk-stars span{display:block;font-size:13px;font-weight:700;color:#475569;letter-spacing:0;margin-top:2px}
.sk-add{display:block;width:100%;padding:18px 14px;font-size:20px;border-radius:16px;margin-bottom:12px;border-style:dashed}
.sk-h{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin:16px 0 8px}
.sk-card{background:#fff;border-radius:16px;box-shadow:0 4px 18px rgba(43,122,120,.12);border:2px solid transparent;padding:12px;margin-bottom:10px}
.sk-card.dim{opacity:.7}
.sk-main{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px}
.sk-em{flex:none;width:52px;height:52px;border-radius:14px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:30px}
.sk-wt{flex:1 1 130px;min-width:0}
.sk-words{font-size:18px;font-weight:800;color:#0f172a;line-height:1.25;word-wrap:break-word}
.sk-whos{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;margin-top:5px}
.sk-who{font-size:12px;font-weight:800;color:#fff;border-radius:99px;padding:2px 9px;white-space:nowrap}
.sk-by{font-size:12px;font-weight:700;color:#64748b}
.sk-count{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;border-radius:14px;padding:8px 10px;text-align:center;max-width:100%;margin-left:auto}
.sk-count b{font-size:16px;line-height:1.15}
.sk-count span{font-size:11px;font-weight:700;opacity:.95;margin-top:2px}
.sk-count.done{background:#dcfce7;color:#166534}
.sk-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}
.sk-me{flex:1 1 140px}
.sk-star{flex:none;width:56px;font-size:24px;padding:4px 0;color:#94a3b8;line-height:1}
.sk-star.on{border-color:#f59e0b;background:#fffbeb}
.sk-del{flex:none;width:44px;padding:0;font-size:18px;color:#64748b;border-color:#e2e8f0}
.sk-rm{background:#fef2f2;border-color:#fca5a5;color:#b91c1c}
.sk-comp{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.sk-comp .sk-acts{margin-top:0}
.sk-lbl{display:flex;flex-direction:column;gap:6px;font-size:15px;font-weight:800;color:#334155}
.sk-in{font:inherit;font-size:18px;font-weight:600;padding:12px;border:2px solid #cbd5e1;border-radius:12px;width:100%;box-sizing:border-box;color:#0f172a}
.sk-go{flex:1;color:#fff;font-size:17px;padding:14px}
.sk-note{font-size:14px;font-weight:700;color:#b45309;margin-bottom:10px}
.sk-empty{padding:22px 10px;text-align:center;color:var(--muted);font-size:16px;font-weight:600}
.sk-little .sk-title{font-size:26px}
.sk-little .sk-words{font-size:22px}
.sk-little .sk-em{width:68px;height:68px;font-size:40px}
.sk-little .sk-btn{font-size:18px;min-height:56px}
.sk-little .sk-star{width:68px;font-size:32px}
.sk-little .sk-add{font-size:24px;padding:22px 14px}
.sk-little .sk-wt{flex-basis:170px}
.sk-little .sk-count{flex:1 1 100%;flex-direction:row;gap:10px;align-items:baseline}
.sk-little .sk-count b{font-size:19px}
.sk-little .sk-count span{font-size:13px;margin-top:0}
.sk-job .sk-main{flex-wrap:nowrap}
.sk-tick{flex:none;width:52px;height:52px;border-radius:14px;border:3px solid #cbd5e1;background:#fff;font-size:28px;font-weight:900;cursor:pointer;font-family:inherit;line-height:1}
.sk-job.done .sk-words{text-decoration:line-through;opacity:.6}
.sk-for{font-size:13px;font-weight:700;color:#64748b;margin-top:2px}
.sk-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;padding-left:64px}
.sk-badge{font-size:13px;font-weight:800;border-radius:99px;padding:3px 10px;background:#f1f5f9;color:#334155}
.sk-badge.late{background:#fef2f2;color:#b91c1c}
.sk-badge.star{background:#fffbeb;color:#92400e}
.sk-little .sk-tick{width:68px;height:68px;font-size:36px}
.sk-little .sk-row{padding-left:0}
.sk-little .sk-badge{font-size:15px}
`;
})();
