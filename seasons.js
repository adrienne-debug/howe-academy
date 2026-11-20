// 🎉 Mom's Day ▸ 🗓 Schedule ▸ Seasons & Events — a bucket list for a season or an event, whose ideas get onto the family calendar.
// SEASONS slice 1 (her ask 2026-11-20 + "finish the builds"): "a planner for either an event or for a season, like Christmas season.
// And it would have like all the things that each person wants to do. And then did it get scheduled, and like a schedule button is
// what I envision, and when it's scheduled … This wouldn't be school … a summer bucket list … super, super duper adjustable."
// Plan: PLAN_season_planner_2026-11-20.md (slice 1 = this file: seasons, ideas, who wants each, ⭐, the 📅 Schedule button, ✓ did it,
// 🌙 not this year, the 🤫 Surprise switch. Supplies, to-dos, food, the kids' page, repeating nights and wrap-up are later slices).
// Her answers 2026-11-20: lives at Mom's Day ▸ 🗓 Schedule · THREE ⭐ per person per season · a scheduled idea shows to the whole
// family unless it's a surprise · every idea has a 🤫 Surprise switch — "option for mom to make it a surprise to where it wouldnt
// show and could hint or not hint depending on the options clicked": ✨ hint = the calendar says only "A surprise";
// 🤐 no hint = nothing on the calendar at all (Mom still sees its date here).
//
// Data (loaded ONLY by this file, which only runs inside Mom's Day for Mom — never at app start):
//   seasons/list/<sid>            {name, emoji, kind, start?, end?, stars?, closed?, ts}                       ONE set per season
//   seasons/ideas/<sid>/<iid>     {t, emoji?, by, want:{<who>:true}, star:{<who>:true}, size?, note?,
//                                  ev:{<eventId>:true}, did?:"YYYY-MM-DD", skip?:true, ts}                     an idea everyone may see
//   seasonSecret/<sid>/<iid>      the SAME record + hide:"hint"|"none", and for 🤐: on:{<id>:{d, time?}}        a 🤫 surprise — its real
//                                  words live ONLY here, a node no kid page ever reads (the later kids' page reads seasons/ideas only)
//   calendar/events/<eventId>     the calendar's OWN record {title, date, time, who, emoji, addedBy} — what 📅 Schedule writes.
//                                  A ✨ hint's event is {title:"A surprise", emoji:"✨"}: the real words never reach the calendar.
// THE DATE IS NEVER STORED ON AN IDEA: an idea is "scheduled" while one of its ev ids is still in the calendar, and its date and time
// are that event's. Move or remove the event in the calendar and the idea follows. (🤐 has no event, so its date is in `on`.)
// SCHOOL IS NEVER TOUCHED: every write goes through apply(), which refuses any path outside seasons/, seasonSecret/ and
// calendar/events/. Family events are display-only in the app — no scheduler, generator or re-lay code reads them — and this file
// never writes holidays, vacations, co-ops, kid days off or Family Time.
// Every write is ONE multi-path update of exact records/fields (db.ref().update), and only when !_dryRun() (?dryrun=1 stays inert).
// who = a roster kid id, "mom", "dad" or "family". Counts, open days and Everyone's picks are worked out on screen, never stored.
(function(){
"use strict";
let snData={}, snSecret={}, snOn=false, snLoaded=false, snGot=0, snSid=null, snFilter="all", snEdit=null, snRoot=null, snAh="", snFor={}, snPast=false, snFocus=false;
const SN_STARS=3;   // her answer 2026-11-20: "three ⭐ each per season"
const SN_KINDS=[["holiday","🎄","Holiday season"],["summer","☀️","Summer bucket list"],["season","🍂","A season"],["trip","🧳","Trip"],["party","🎂","Party or event"],["someday","💭","Someday list"]];
const SN_SIZES=[["quick","⚡","Quick"],["home","🏠","At home"],["out","🚗","Outing"]];
const SN_HIDE=[["","👀","Everyone can see it"],["hint","✨","Surprise, with a hint"],["none","🤐","Surprise, no hint"]];
const SN_HINT_TITLE="A surprise", SN_HINT_EMOJI="✨";
const SN_FILTERS=[["all","All"],["todo","Not scheduled yet"],["sched","Scheduled"],["done","Done"],["skip","🌙 Not this year"]];
const SN_MOM={id:"mom",name:"Mom",color:"#b5394a"}, SN_DAD={id:"dad",name:"Dad",color:"#1d4ed8"}, SN_FAM={id:"family",name:"Everyone",color:"#2B7A78"};
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function today(){return (typeof _todayStr==="function")?_todayStr():new Date().toISOString().slice(0,10);}
function dry(){return typeof _dryRun==="function"&&_dryRun();}
function live(){return typeof db!=="undefined"&&!!db&&!dry();}
function toast(m){if(typeof gwShowToast==="function")gwShowToast(m);}
function rid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function slug(t){return String(t||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"season";}
function isIso(s){return /^\d{4}-\d{2}-\d{2}$/.test(String(s||""));}
function dOf(iso){const p=String(iso).split("-");return new Date(Date.UTC(+p[0],+p[1]-1,+p[2],12));}
function addDays(iso,n){const d=dOf(iso);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function daysTo(a,b){return Math.round((dOf(b)-dOf(a))/864e5);}
function fmtDay(iso){if(!isIso(iso))return "";const d=dOf(iso);return DOW[d.getUTCDay()]+" "+MON[d.getUTCMonth()]+" "+d.getUTCDate();}
function fmtShort(iso){if(!isIso(iso))return "";const d=dOf(iso);return MON[d.getUTCMonth()]+" "+d.getUTCDate();}
function mins(t){const m=/^\s*(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?\s*$/i.exec(String(t||""));if(!m)return 9999;let h=+m[1]%12;if(m[3]&&m[3].toLowerCase()==="p")h+=12;else if(!m[3])h=+m[1];return h*60+(+m[2]||0);}
function byTime(a,b){return mins(a.time)-mins(b.time)||String(a.time).localeCompare(String(b.time));}
function keys(o){return (o&&typeof o==="object")?Object.keys(o).filter(k=>o[k]):[];}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}

// ── the one door for writes ──────────────────────────────────────────────────
// up = {"full/path": value | null}. Mirrors it locally, then ONE multi-path update. Any path outside this feature's own two nodes
// and the calendar's family events is refused — nothing here can reach the school schedule.
const SN_OK=/^(seasons\/(list|ideas)\/[^\/]+|seasonSecret\/[^\/]+\/[^\/]+|calendar\/events\/[^\/]+)(\/|$)/;
function setIn(o,parts,v){
  for(let i=0;i<parts.length-1;i++){if(o[parts[i]]==null||typeof o[parts[i]]!=="object"){if(v==null)return;o[parts[i]]={};}o=o[parts[i]];}
  const k=parts[parts.length-1];if(v==null)delete o[k];else o[k]=clone(v);
}
function cal(){try{return (typeof calendarData!=="undefined"&&calendarData)||{};}catch(e){return {};}}
function evs(){return cal().events||{};}
function apply(up){
  const P=Object.keys(up);if(!P.length)return false;
  if(P.some(p=>!SN_OK.test(p))){try{console.warn("seasons: refused a write outside its own nodes",P);}catch(e){}return false;}
  P.forEach(p=>{const a=p.split("/"),v=up[p];
    if(a[0]==="seasons")setIn(snData,a.slice(1),v);
    else if(a[0]==="seasonSecret")setIn(snSecret,a.slice(1),v);
    else{const c=cal();if(!c.events)c.events={};setIn(c.events,a.slice(2),v);}});
  if(live())db.ref().update(up);
  return true;
}

// ── what's there ─────────────────────────────────────────────────────────────
function seasons(){const o=snData.list||{};return Object.keys(o).filter(id=>o[id]&&typeof o[id]==="object").map(id=>Object.assign({id},o[id]))
  .sort((a,b)=>String(a.start||"9999").localeCompare(String(b.start||"9999"))||(a.ts||0)-(b.ts||0));}
function season(sid){const o=(snData.list||{})[sid];return o?Object.assign({id:sid},o):null;}
function curSid(){
  const S=seasons();if(snSid&&S.some(s=>s.id===snSid))return snSid;
  let saved=null;try{saved=HA_LS.getItem("ha_sn_sid");}catch(e){}
  if(saved&&S.some(s=>s.id===saved))return snSid=saved;
  const open=S.filter(s=>!s.closed);const pick=open[0]||S[0];return snSid=pick?pick.id:null;
}
function hideOf(it){return (it&&(it.hide==="hint"||it.hide==="none"))?it.hide:"";}
function base(sid,iid,hide){return (hide?"seasonSecret/":"seasons/ideas/")+sid+"/"+iid;}
function rawIdea(sid,iid){const s=(snSecret[sid]||{})[iid];if(s&&typeof s==="object")return s;const p=((snData.ideas||{})[sid]||{})[iid];return (p&&typeof p==="object")?p:null;}
function ideasOf(sid){
  const pub=(snData.ideas||{})[sid]||{},sec=snSecret[sid]||{},out=[];
  Object.keys(sec).forEach(id=>{if(sec[id]&&typeof sec[id]==="object")out.push(Object.assign({id,sid},sec[id],{hide:hideOf(sec[id])||"none"}));});
  Object.keys(pub).forEach(id=>{if(pub[id]&&typeof pub[id]==="object"&&!(sec[id]&&typeof sec[id]==="object"))out.push(Object.assign({id,sid},pub[id],{hide:""}));});
  return out;
}
function idea(sid,iid){return ideasOf(sid).find(it=>it.id===iid)||null;}
// When an idea is on: its calendar events that still exist (the calendar is the one truth), plus a 🤐 idea's own dates.
function whens(it){
  const E=evs(),out=[];
  keys(it.ev).forEach(id=>{const e=E[id];if(e&&isIso(e.date))out.push({k:"ev",id,d:e.date,time:e.time||""});});
  const on=it.on||{};Object.keys(on).forEach(id=>{const o=on[id];if(o&&isIso(o.d))out.push({k:"on",id,d:o.d,time:o.time||""});});
  return out.sort((a,b)=>a.d.localeCompare(b.d)||byTime(a,b));
}
// todo = not scheduled yet · sched = a day still ahead (or today) · past = its day went by, not marked · done · skip = 🌙
function state(it){if(it.skip)return "skip";if(it.did)return "done";const W=whens(it);if(!W.length)return "todo";const t=today();return W.some(w=>w.d>=t)?"sched":"past";}
function counts(sid){const c={n:0,todo:0,sched:0,past:0,done:0,skip:0};ideasOf(sid).forEach(it=>{c.n++;c[state(it)]++;});return c;}
function roster(){try{return (typeof ROSTER_DEF!=="undefined"&&Array.isArray(ROSTER_DEF))?ROSTER_DEF:[];}catch(e){return [];}}
function people(){return roster().map(k=>({id:k.id,name:k.name,color:k.color||"#64748b",kid:true})).concat([SN_MOM,SN_DAD]);}
function who(id){return id==="family"?SN_FAM:(people().find(p=>p.id===id)||{id,name:String(id||""),color:"#64748b"});}
function starMax(s){const n=+((s||{}).stars);return n>0?Math.floor(n):SN_STARS;}
function starsUsed(sid,w,exceptIid){return ideasOf(sid).filter(it=>it.id!==exceptIid&&it.star&&it.star[w]).length;}
// Everyone's picks: for each person, how many of the ideas they want have a day (or happened). ⚠ = they have wishes and none has a
// day, or one of their ⭐ has no day. "Everyone" wishes are the family's, so they are not counted for any one person.
function picks(sid){
  const I=ideasOf(sid),has=it=>{const s=state(it);return s==="sched"||s==="past"||s==="done";};
  return people().map(p=>{const mine=I.filter(it=>it.want&&it.want[p.id]),st=I.filter(it=>it.star&&it.star[p.id]);
    const got=mine.filter(has).length,stMiss=st.filter(it=>!has(it)).length;
    return {id:p.id,name:p.name,color:p.color,n:mine.length,got,stars:st.length,stMiss,warn:(mine.length>0&&got===0)||stMiss>0};}).filter(x=>x.n>0);
}
// What the calendar already has on a day (read-only): family events, breaks, co-ops, and 🤐 surprises (they aren't on the calendar).
function evOwner(){const m={};seasons().forEach(s=>ideasOf(s.id).forEach(it=>keys(it.ev).forEach(id=>{m[id]=it;})));return m;}
function dayInfo(iso,own){
  const E=evs(),events=[],secret=[];own=own||evOwner();
  Object.keys(E).forEach(id=>{const e=E[id];if(e&&e.date===iso){const it=own[id];events.push({id,emoji:e.emoji||"🎉",title:e.title||"Event",time:e.time||"",real:(it&&hideOf(it)==="hint")?it.t:""});}});
  events.sort(byTime);
  seasons().forEach(s=>ideasOf(s.id).forEach(it=>{const on=it.on||{};Object.keys(on).forEach(k=>{if(on[k]&&on[k].d===iso)secret.push({t:it.t,time:on[k].time||""});});}));
  let breaks=[],coops=[];
  try{if(typeof calBreaksOn==="function")breaks=calBreaksOn(iso).filter(b=>b.kind!=="cleaning").map(b=>b.name);}catch(e){}
  try{if(typeof coopsOnDate==="function")coops=coopsOnDate(iso).map(c=>c.name||"Co-op");}catch(e){}
  return {iso,events,secret,breaks,coops,n:events.length+secret.length+coops.length,open:!(events.length||secret.length||coops.length)};
}
// Open days left = days from today to the season's end with nothing on them. A count, never a rule.
function openDays(s){
  if(!s||!isIso(s.end))return null;const t=today();if(s.end<t)return null;
  const from=(isIso(s.start)&&s.start>t)?s.start:t,own=evOwner();let n=0,d=from,i=0;
  while(d<=s.end&&i++<400){if(dayInfo(d,own).open)n++;d=addDays(d,1);}
  return n;
}

// ── drawing ──────────────────────────────────────────────────────────────────
function whoChip(id,star){const p=who(id);return '<span class="sn-who" style="background:'+esc(p.color)+'">'+esc(p.name)+(star?" ⭐":"")+'</span>';}
function whenTxt(w){return fmtDay(w.d)+(w.time?" · "+esc(w.time):"");}
function hideChip(it){const h=hideOf(it);return h==="hint"?'<span class="sn-chip sec">✨ surprise, hint</span>':(h==="none"?'<span class="sn-chip sec">🤐 surprise, no hint</span>':"");}
function sizeChip(it){const z=SN_SIZES.find(x=>x[0]===it.size);return z?'<span class="sn-chip">'+z[1]+" "+z[2]+'</span>':"";}
function statusLine(it,st,W){
  if(st==="skip")return '<span class="sn-st skip">🌙 not this year</span>';
  if(st==="done")return '<span class="sn-st done">✅ did it'+(isIso(it.did)?" · "+fmtDay(it.did):"")+'</span>';
  if(st==="todo")return '<span class="sn-st todo">not scheduled yet</span>';
  const up=W.filter(w=>w.d>=today()),w=(st==="sched"?up[0]:W[W.length-1]),more=W.length-1;
  const tail=hideOf(it)==="none"?" · not on the calendar":(hideOf(it)==="hint"?" · calendar says ✨ "+SN_HINT_TITLE:"");
  if(st==="past")return '<span class="sn-st past">📅 was '+whenTxt(w)+' — did it happen?</span>';
  return '<span class="sn-st sched">'+(hideOf(it)==="none"?"🤐 ":"📅 ")+whenTxt(w)+(more>0?" +"+more+" more":"")+tail+'</span>';
}
function itemHTML(it){
  const st=state(it),W=whens(it),id=esc(it.id),wants=keys(it.want);
  let b="";
  if(st==="todo")b='<button class="sn-go" onclick="snSched(\''+id+'\')">📅 Schedule</button>';
  else if(st==="sched")b='<button class="sn-tool" onclick="snDid(\''+id+'\')">✓ Did it</button><button class="sn-tool" onclick="snSched(\''+id+'\',\''+esc(W.filter(w=>w.d>=today())[0].id)+'\')">↪ Move</button>';
  else if(st==="past")b='<button class="sn-go" onclick="snDid(\''+id+'\')">✓ Yes</button><button class="sn-tool" onclick="snSched(\''+id+'\',\''+esc(W[W.length-1].id)+'\')">↪ Move</button><button class="sn-tool" onclick="snSkip(\''+id+'\')">🌙</button>';
  else if(st==="skip")b='<button class="sn-tool" onclick="snUnskip(\''+id+'\')">↩ Bring back</button>';
  return '<div class="sn-item'+(st==="skip"||st==="done"?" dim":"")+'"><button class="sn-ib" onclick="snOpenIdea(\''+id+'\')">'
    +'<div class="sn-it">'+esc(it.emoji||"")+(it.emoji?" ":"")+'<b>'+esc(it.t||"(no name)")+'</b> '+hideChip(it)+sizeChip(it)+'</div>'
    +'<div class="sn-im">'+wants.map(w=>whoChip(w,it.star&&it.star[w])).join("")+statusLine(it,st,W)+'</div>'
    +(it.note?'<div class="sn-note">'+esc(it.note)+'</div>':"")+'</button>'+(b?'<div class="sn-ia">'+b+'</div>':"")+'</div>';
}
function order(I){   // needs a tap first → not scheduled (most ⭐ first) → scheduled, soonest first → done → 🌙
  const rank={past:0,todo:1,sched:2,done:3,skip:4},t=today();
  return I.map(it=>{const st=state(it),W=whens(it),up=W.filter(w=>w.d>=t)[0];return {it,st,key:up?up.d:(W[0]?W[0].d:""),stars:keys(it.star).length};})
    .sort((a,b)=>rank[a.st]-rank[b.st]||(a.st==="todo"?b.stars-a.stars:0)||String(a.key).localeCompare(String(b.key))||(a.it.ts||0)-(b.it.ts||0)).map(x=>x.it);
}
function datesLine(s){
  const t=today();let h="";
  if(isIso(s.start)||isIso(s.end))h=(isIso(s.start)?fmtShort(s.start):"")+(isIso(s.start)&&isIso(s.end)?" – ":"")+(isIso(s.end)?(isIso(s.start)?"":"until ")+fmtShort(s.end):"");
  let c="";
  if(isIso(s.start)&&s.start>t){const n=daysTo(t,s.start);c="starts in "+n+" day"+(n===1?"":"s");}
  else if(isIso(s.end)){const n=daysTo(t,s.end);c=n<0?"ended":(n===0?"last day":n+" day"+(n===1?"":"s")+" left");}
  return h+(h&&c?" · ":"")+c;
}
function headHTML(s){
  const c=counts(s.id),P=picks(s.id),od=openDays(s),sched=c.sched+c.past;
  let h='<div class="sn-card"><div class="sn-hd"><div class="sn-hdt"><span>'+esc(s.emoji||"🎉")+" "+esc(s.name)+'</span><span class="sn-days">'+esc(datesLine(s))+'</span></div>'
    +'<button class="sn-tool sn-hdb" onclick="snEditSeason()">✏️</button></div><div class="sn-bd">';
  if(!c.n)h+='<div class="sn-line">Nothing on the list yet. Add what everyone wants to do, then tap 📅 Schedule on each one.</div>';
  else{
    h+='<div class="sn-line"><b>'+c.n+'</b> idea'+(c.n===1?"":"s")+' · <b style="color:#0f766e">'+sched+'</b> scheduled · <b style="color:#b45309">'+c.todo+'</b> not yet · <b>'+c.done+'</b> done'+(c.skip?' · '+c.skip+' 🌙':"")+'</div>';
    if(od!=null)h+='<div class="sn-line">'+od+' open day'+(od===1?"":"s")+' left'+(isIso(s.end)?' before '+fmtShort(s.end):"")+(c.todo?' · '+c.todo+' idea'+(c.todo===1?"":"s")+' still waiting for a day':"")+'</div>';
    if(c.past)h+='<div class="sn-line" style="color:#b45309">'+c.past+' went by — did '+(c.past===1?"it":"they")+' happen?</div>';
    if(P.length)h+='<div class="sn-picks"><span class="sn-pl">Everyone’s picks</span>'+P.map(x=>'<span class="sn-pick'+(x.warn?" warn":"")+'"><i style="background:'+esc(x.color)+'"></i>'+esc(x.name)+' '+x.got+' of '+x.n+(x.stars?' ⭐'+(x.stMiss?"":"✓"):"")+(x.warn?" ⚠":"")+'</span>').join("")+'</div>';
  }
  return h+'</div></div>';
}
function addHTML(){
  const P=people().concat([SN_FAM]);
  return '<div class="sn-add"><div class="sn-addrow"><input id="sn-new" placeholder="Add an idea…" maxlength="80" onkeydown="if(event.key===\'Enter\')snQuickAdd()"><button class="sn-go" onclick="snQuickAdd()">＋ Add</button></div>'
    +'<div class="sn-forrow"><span class="sn-pl">Who wants it</span>'+P.map(p=>'<button class="sn-pchip'+(snFor[p.id]?" on":"")+'" style="--c:'+esc(p.color)+'" onclick="snForToggle(\''+esc(p.id)+'\')">'+esc(p.name)+'</button>').join("")+'</div></div>';
}
function listHTML(s){
  const all=order(ideasOf(s.id)),f=snFilter;
  const I=all.filter(it=>{const st=state(it);return f==="all"||(f==="sched"?(st==="sched"||st==="past"):st===f);});
  const c=counts(s.id),n={all:c.n,todo:c.todo,sched:c.sched+c.past,done:c.done,skip:c.skip};
  let h='<div class="sn-filters">'+SN_FILTERS.filter(x=>x[0]!=="skip"||c.skip||f==="skip").map(x=>'<button class="sn-f'+(f===x[0]?" on":"")+'" onclick="snFilterSet(\''+x[0]+'\')">'+x[1]+' '+n[x[0]]+'</button>').join("")+'</div>';
  if(!I.length)return h+(all.length?'<div class="sn-empty">Nothing here.</div>':"");
  return h+I.map(itemHTML).join("");
}
function barHTML(S,sid){
  const open=S.filter(s=>!s.closed),past=S.filter(s=>s.closed);
  let h='<div class="sn-occs">'+open.map(s=>'<button class="sn-occ'+(s.id===sid?" on":"")+'" onclick="snPick(\''+esc(s.id)+'\')">'+esc(s.emoji||"🎉")+" "+esc(s.name)+'</button>').join("")
    +'<button class="sn-occ" onclick="snNewSeason()">＋ New</button>'+(past.length?'<button class="sn-occ" onclick="snPastToggle()">📜 Past '+past.length+'</button>':"")+'</div>';
  if(past.length&&(snPast||past.some(s=>s.id===sid)))h+='<div class="sn-occs">'+past.map(s=>'<button class="sn-occ'+(s.id===sid?" on":"")+'" onclick="snPick(\''+esc(s.id)+'\')">📜 '+esc(s.name)+'</button>').join("")+'</div>';
  return h;
}
function startHTML(){
  return '<div class="sn-card sn-start"><div class="sn-h2">A bucket list that gets onto the calendar</div>'
    +'<div class="sn-sub">Make one for a season or an event. Add what everyone wants to do. Then tap 📅 Schedule on an idea to put it on the family calendar.</div>'
    +'<div class="sn-kinds">'+SN_KINDS.map(k=>'<button class="sn-kind" onclick="snNewSeason(\''+k[0]+'\')">'+k[1]+'<span>'+k[2]+'</span></button>').join("")+'</div></div>';
}
function draw(){
  if(!snRoot)return;
  let h=snAh+'<div class="sn-wrap" id="sn-page"><div class="sn-title">🎉 Seasons &amp; Events</div>';
  if(!snLoaded)h+='<div class="sn-empty" style="padding:30px">Opening…</div>';
  else{
    const S=seasons(),sid=curSid(),s=sid?season(sid):null;
    if(!S.length)h+=startHTML();
    else{h+=barHTML(S,sid);if(s)h+=headHTML(s)+(s.closed?"":addHTML())+listHTML(s);}
  }
  snRoot.innerHTML=h+'</div>'+sheetHTML();
  if(snFocus){snFocus=false;try{const e=document.getElementById("sn-new");if(e&&e.focus)e.focus();}catch(e){}}
}

// ── the pop-ups ──────────────────────────────────────────────────────────────
function field(k,label,ph,type,cls){const f=snEdit.form;return '<label class="sn-fl'+(cls?" "+cls:"")+'"><span>'+label+'</span><input'+(type?' type="'+type+'"':"")+' value="'+esc(f[k])+'" placeholder="'+esc(ph||"")+'" oninput="snSet(\''+k+'\',this.value)"></label>';}
function seasonSheet(){
  const f=snEdit.form,isNew=!snEdit.id;
  let h='<div class="sn-h2">'+(isNew?"New season or event":"✏️ "+esc(f.name||""))+'</div>';
  if(isNew)h+='<div class="sn-chips">'+SN_KINDS.map(k=>'<button class="sn-f'+(f.kind===k[0]?" on":"")+'" onclick="snKind(\''+k[0]+'\')">'+k[1]+" "+k[2]+'</button>').join("")+'</div>';
  h+='<div class="sn-form">'+field("name","Name","Christmas, Summer bucket list, Our trip…","","wide")+field("emoji","Picture","🎉")+field("start","Starts (optional)","","date")+field("end","Ends (optional)","","date")+'</div>';
  if(!isNew)h+='<label class="sn-check"><input type="checkbox"'+(f.closed?" checked":"")+' onchange="snSet(\'closed\',this.checked)"> Done — move it to 📜 Past</label>';
  h+='<div class="sn-acts"><button class="sn-tool sn-save" onclick="snSave()">Save</button><button class="sn-tool" onclick="snCancel()">Cancel</button>';
  if(!isNew&&!ideasOf(snEdit.id).length)h+='<button class="sn-tool sn-del" onclick="snDelSeason()">'+(snEdit.ask?"Tap again to delete":"Delete")+'</button>';
  return h+'</div>'+(snEdit.msg?'<div class="sn-msg">'+esc(snEdit.msg)+'</div>':"");
}
function ideaSheet(){
  const f=snEdit.form,sid=snEdit.sid,it=idea(sid,snEdit.id),s=season(sid),max=starMax(s);
  const P=people().concat([SN_FAM]);
  let h='<div class="sn-h2">'+esc(f.emoji||"")+" "+esc(f.t||"Idea")+'</div><div class="sn-form">'+field("t","What","Gingerbread houses","","wide")+field("emoji","Picture","🎄")+'</div>';
  h+='<div class="sn-lab">Who wants it <small>— tap a name, then ☆ for the ones that matter most ('+max+' ⭐ each)</small></div><div class="sn-chips">'
    +P.map(p=>{const on=!!f.want[p.id],st=!!f.star[p.id];
      return '<span class="sn-wp"><button class="sn-pchip'+(on?" on":"")+'" style="--c:'+esc(p.color)+'" onclick="snWant(\''+esc(p.id)+'\')">'+esc(p.name)+'</button>'
        +(on&&p.id!=="family"?'<button class="sn-star'+(st?" on":"")+'" onclick="snStar(\''+esc(p.id)+'\')">'+(st?"⭐":"☆")+'</button>':"")+'</span>';}).join("")+'</div>';
  h+='<div class="sn-lab">How big <small>— optional</small></div><div class="sn-chips">'+SN_SIZES.map(z=>'<button class="sn-f'+(f.size===z[0]?" on":"")+'" onclick="snSize(\''+z[0]+'\')">'+z[1]+" "+z[2]+'</button>').join("")+'</div>';
  h+='<div class="sn-lab">🤫 Surprise</div><div class="sn-chips">'+SN_HIDE.map(x=>'<button class="sn-f'+(f.hide===x[0]?" on":"")+'" onclick="snHide(\''+x[0]+'\')">'+x[1]+" "+x[2]+'</button>').join("")+'</div>'
    +'<div class="sn-sub">'+(f.hide==="hint"?"The family calendar will only say “✨ "+SN_HINT_TITLE+"” on its day. The real words stay here, with you."
      :(f.hide==="none"?"Nothing goes on the family calendar. Only you see its day, here.":"When it has a day, the whole family sees it on the calendar."))+'</div>';
  h+='<label class="sn-fl wide"><span>Note</span><textarea rows="2" oninput="snSet(\'note\',this.value)" placeholder="Anything to remember">'+esc(f.note)+'</textarea></label>';
  if(it){
    const st=state(it),W=whens(it),id=esc(it.id);
    h+='<div class="sn-lab">When</div>';
    if(!W.length)h+='<div class="sn-sub">'+(st==="skip"?"🌙 Not this year.":"Not scheduled yet.")+'</div>';
    W.forEach(w=>{h+='<div class="sn-when"><span>'+(w.k==="on"?"🤐 ":"📅 ")+whenTxt(w)+'</span><button class="sn-tool" onclick="snSched(\''+id+'\',\''+esc(w.id)+'\')">↪ Move</button><button class="sn-tool" onclick="snUnsched(\''+id+'\',\''+esc(w.id)+'\')">✕ Take off</button></div>';});
    h+='<div class="sn-acts">'+(st==="skip"?"":'<button class="sn-go" onclick="snSched(\''+id+'\')">'+(W.length?"＋ Another day":"📅 Schedule")+'</button>')
      +(st==="done"?'<button class="sn-tool" onclick="snUndid(\''+id+'\')">↩ Not done after all</button>':(st==="skip"?"":'<button class="sn-tool" onclick="snDid(\''+id+'\')">✓ We did it</button>'))
      +(st==="skip"?'<button class="sn-tool" onclick="snUnskip(\''+id+'\')">↩ Bring it back</button>':(st==="done"?"":'<button class="sn-tool" onclick="snSkip(\''+id+'\')">🌙 Not this year</button>'))+'</div>';
  }
  h+='<div class="sn-acts sn-foot"><button class="sn-tool sn-save" onclick="snSave()">Save</button><button class="sn-tool" onclick="snCancel()">Cancel</button>'
    +'<button class="sn-tool sn-del" onclick="snDelIdea()">'+(snEdit.ask?"Tap again to delete":"Delete")+'</button></div>';
  return h+(snEdit.msg?'<div class="sn-msg">'+esc(snEdit.msg)+'</div>':"");
}
function schedRange(s,more){
  const t=today(),from=(s&&isIso(s.start)&&s.start>t)?s.start:t;
  let to=(s&&isIso(s.end)&&s.end>=from)?s.end:addDays(from,41);
  if(daysTo(from,to)>91)to=addDays(from,91);
  if(more)to=addDays(to,28*more);
  return {from,to};
}
function schedSheet(){
  const e=snEdit,it=idea(e.sid,e.id);if(!it)return '<div class="sn-sub">That idea is gone.</div>';
  const s=season(e.sid),h0=hideOf(it),mv=e.move?whens(it).find(w=>w.id===e.move):null,R=schedRange(s,e.more||0),own=evOwner();
  let h='<div class="sn-h2">'+(mv?"↪ Move":"📅 Schedule")+' — '+esc(it.t)+'</div>';
  h+='<div class="sn-sub">'+(mv?"Now on "+whenTxt(mv)+". ":"")+(h0==="hint"?"✨ The family calendar will only say “"+SN_HINT_TITLE+"”."
    :(h0==="none"?"🤐 Nothing goes on the family calendar. Only you see the day, here.":"Tap a day. It goes on the family calendar for everyone."))+'</div>';
  h+='<div class="sn-form">'+field("time","Time (optional)","2:00 PM");
  if(h0!=="none")h+='<label class="sn-fl"><span>For</span><select onchange="snSet(\'who\',this.value)"><option value="family"'+(e.form.who==="family"?" selected":"")+'>The whole family</option>'
    +roster().map(k=>'<option value="'+esc(k.id)+'"'+(e.form.who===k.id?" selected":"")+'>'+esc(k.name)+'</option>').join("")+'</select></label>';
  h+='</div><div class="sn-chips"><button class="sn-f'+(e.openOnly?"":" on")+'" onclick="snDaysOpen(false)">All days</button><button class="sn-f'+(e.openOnly?" on":"")+'" onclick="snDaysOpen(true)">Open days only</button></div><div class="sn-daylist">';
  let d=R.from,i=0,shown=0;
  while(d<=R.to&&i++<200){
    const x=dayInfo(d,own),cur=mv&&mv.d===d;
    if(!e.openOnly||x.open){shown++;
      const bits=x.events.map(v=>esc(v.emoji)+" "+esc(v.title)+(v.real?" ("+esc(v.real)+")":"")+(v.time?" "+esc(v.time):"")).concat(x.secret.map(v=>"🤐 "+esc(v.t)+(v.time?" "+esc(v.time):""))).concat(x.coops.map(c=>"🏫 "+esc(c)));
      h+='<button class="sn-day'+(x.open?" open":"")+(cur?" cur":"")+'" onclick="snPickDay(\''+d+'\')"><b>'+fmtDay(d)+(d===today()?" · today":"")+'</b>'
        +'<span>'+(x.open?"nothing on":bits.join(" · "))+(x.breaks.length?' <i>'+esc(x.breaks.join(", "))+'</i>':"")+(x.n>=2?' <em>already '+x.n+' things</em>':"")+'</span></button>';}
    d=addDays(d,1);
  }
  if(!shown)h+='<div class="sn-empty">No open days in these dates.</div>';
  h+='</div><div class="sn-acts"><button class="sn-tool" onclick="snDaysMore()">Show 4 more weeks</button></div>'
    +'<div class="sn-form">'+field("any","Or any other day","","date")+'<div class="sn-fl"><span>&nbsp;</span><button class="sn-tool" onclick="snPickAny()">Put it there</button></div></div>'
    +'<div class="sn-acts sn-foot"><button class="sn-tool" onclick="snCancel()">Cancel</button></div>';
  return h+(e.msg?'<div class="sn-msg">'+esc(e.msg)+'</div>':"");
}
function sheetHTML(){
  if(!snEdit)return "";
  const inner=snEdit.type==="season"?seasonSheet():(snEdit.type==="sched"?schedSheet():ideaSheet());
  return '<div id="sn-sheet" onclick="if(event.target.id===\'sn-sheet\')snCancel()"><div class="sn-sh"><button class="sn-x" onclick="snCancel()">✕</button>'+inner+'</div></div>';
}

// ── seasons ──────────────────────────────────────────────────────────────────
function kindDefaults(kind){
  const t=today(),y=+t.slice(0,4),m=+t.slice(5,7),K=SN_KINDS.find(k=>k[0]===kind)||["","🎉",""];
  const f={kind:K[0]||"season",emoji:K[1],name:"",start:"",end:""};
  if(kind==="holiday"&&m>=10){f.name="Christmas "+y;f.start=t;f.end=y+"-12-31";}
  else if(kind==="summer"){const sy=m<=8?y:y+1;f.name="Summer "+sy+" bucket list";f.start=sy+"-06-01";f.end=sy+"-08-31";}
  else if(kind==="season"){f.name=(m<=2||m===12?"Winter":m<=5?"Spring":m<=8?"Summer":"Fall")+" "+y;}
  else if(kind==="someday")f.name="Someday list";
  return f;
}
function snNewSeason(kind){const f=kindDefaults(kind||"");f.auto=true;snEdit={type:"season",id:null,form:f};draw();}
function snKind(kind){if(!snEdit||snEdit.type!=="season")return;const f=snEdit.form,d=kindDefaults(kind);
  f.kind=d.kind;f.emoji=d.emoji;if(f.auto||!String(f.name).trim()){f.name=d.name;f.start=d.start;f.end=d.end;f.auto=true;}draw();}
function snEditSeason(){const s=season(curSid());if(!s)return;snEdit={type:"season",id:s.id,form:{name:s.name||"",emoji:s.emoji||"",start:s.start||"",end:s.end||"",closed:!!s.closed}};draw();}
function saveSeason(){
  const f=snEdit.form,name=String(f.name||"").trim().slice(0,60);
  if(!name){snEdit.msg="Give it a name first.";draw();return;}
  const start=isIso(f.start)?f.start:"",end=isIso(f.end)?f.end:"";
  if(start&&end&&end<start){snEdit.msg="It ends before it starts — check the two dates.";draw();return;}
  const emoji=String(f.emoji||"").trim().slice(0,8)||"🎉",up={};
  if(!snEdit.id){
    let sid=slug(name),n=2;const L=snData.list||{};while(L[sid]||snSecret[sid]||(snData.ideas||{})[sid])sid=slug(name)+"-"+(n++);
    const rec={name,emoji,kind:f.kind||"season",ts:Date.now()};if(start)rec.start=start;if(end)rec.end=end;
    up["seasons/list/"+sid]=rec;apply(up);snSid=sid;try{HA_LS.setItem("ha_sn_sid",sid);}catch(e){}
    snEdit=null;snFilter="all";snFocus=true;toast("Started "+emoji+" "+name);draw();return;
  }
  const s=season(snEdit.id)||{},b="seasons/list/"+snEdit.id+"/";
  if(name!==s.name)up[b+"name"]=name;if(emoji!==(s.emoji||""))up[b+"emoji"]=emoji;
  if(start!==(s.start||""))up[b+"start"]=start||null;if(end!==(s.end||""))up[b+"end"]=end||null;
  if(!!f.closed!==!!s.closed)up[b+"closed"]=f.closed?true:null;
  apply(up);snEdit=null;draw();
}
function snDelSeason(){
  if(!snEdit||snEdit.type!=="season"||!snEdit.id)return;
  if(ideasOf(snEdit.id).length){snEdit.msg="It still has ideas on it. Move it to 📜 Past instead.";draw();return;}
  if(!snEdit.ask){snEdit.ask=true;draw();return;}
  const up={};up["seasons/list/"+snEdit.id]=null;apply(up);snEdit=null;snSid=null;draw();
}
function snPick(sid){snSid=sid;try{HA_LS.setItem("ha_sn_sid",sid);}catch(e){}snFilter="all";draw();}
function snPastToggle(){snPast=!snPast;draw();}
function snFilterSet(f){snFilter=SN_FILTERS.some(x=>x[0]===f)?f:"all";draw();}
function snForToggle(w){if(snFor[w])delete snFor[w];else snFor[w]=true;const e=(typeof document!=="undefined")?document.getElementById("sn-new"):null,v=e?e.value:"";draw();
  try{const n=document.getElementById("sn-new");if(n&&v){n.value=v;}}catch(x){}}

// ── ideas ────────────────────────────────────────────────────────────────────
function snQuickAdd(){
  const sid=curSid();if(!sid)return;
  const e=document.getElementById("sn-new"),t=String((e&&e.value)||"").trim().slice(0,80);
  if(!t){try{if(e&&e.focus)e.focus();}catch(x){}return;}
  const rec={t,by:"mom",ts:Date.now()};const w=keys(snFor);if(w.length){rec.want={};w.forEach(k=>{rec.want[k]=true;});}
  const up={};up[base(sid,rid("i"),"")]=rec;apply(up);
  if(snFilter!=="all"&&snFilter!=="todo")snFilter="all";
  snFocus=true;draw();
}
function snOpenIdea(iid){
  const sid=curSid(),it=idea(sid,iid);if(!it)return;
  snEdit={type:"idea",sid,id:iid,form:{t:it.t||"",emoji:it.emoji||"",want:clone(it.want)||{},star:clone(it.star)||{},size:it.size||"",note:it.note||"",hide:hideOf(it)}};draw();
}
function snSet(k,v){if(!snEdit)return;snEdit.form[k]=v;if(k==="name")snEdit.form.auto=false;}
function snWant(w){if(!snEdit||snEdit.type!=="idea")return;const f=snEdit.form;if(f.want[w]){delete f.want[w];delete f.star[w];}else f.want[w]=true;snEdit.msg="";draw();}
function snStar(w){
  if(!snEdit||snEdit.type!=="idea"||w==="family")return;const f=snEdit.form;if(!f.want[w])return;
  if(f.star[w]){delete f.star[w];snEdit.msg="";}
  else{const max=starMax(season(snEdit.sid));
    if(starsUsed(snEdit.sid,w,snEdit.id)>=max){snEdit.msg=who(w).name+" has used all "+max+" ⭐ on this list. Take one off another idea first.";draw();return;}
    f.star[w]=true;snEdit.msg="";}
  draw();
}
function snSize(z){if(!snEdit||snEdit.type!=="idea")return;snEdit.form.size=(snEdit.form.size===z)?"":z;draw();}
function snHide(h){if(!snEdit||snEdit.type!=="idea")return;snEdit.form.hide=(h==="hint"||h==="none")?h:"";draw();}
function eventFor(it,hide,d,time,forWho){   // the calendar's own record — a ✨ hint never carries the real words
  const hint=hide==="hint";
  return {title:hint?SN_HINT_TITLE:String(it.t||"Event").slice(0,60),date:d,time:String(time||"").slice(0,12),who:forWho||"family",emoji:hint?SN_HINT_EMOJI:(String(it.emoji||"").slice(0,8)||"🎉"),addedBy:"mom"};
}
function newEvId(d){return "ev_"+d.replace(/-/g,"")+"_"+Math.random().toString(36).slice(2,7);}
function sameMap(a,b){const x=keys(a).sort().join(","),y=keys(b).sort().join(",");return x===y;}
// Save the idea pop-up. Same kind of idea → only the fields that changed. A change of the 🤫 switch MOVES the record between
// seasons/ideas and seasonSecret, and makes the calendar match: real words, "A surprise", or nothing at all.
function saveIdea(){
  const e=snEdit,f=e.form,sid=e.sid,iid=e.id,old=rawIdea(sid,iid);if(!old){snEdit=null;draw();return false;}
  const t=String(f.t||"").trim().slice(0,80);if(!t){e.msg="It needs a few words.";draw();return false;}
  const emoji=String(f.emoji||"").trim().slice(0,8),note=String(f.note||"").trim().slice(0,400),size=SN_SIZES.some(z=>z[0]===f.size)?f.size:"";
  const want={},star={};keys(f.want).forEach(k=>{want[k]=true;});keys(f.star).forEach(k=>{if(want[k]&&k!=="family")star[k]=true;});
  const h0=((snSecret[sid]||{})[iid])?(hideOf(old)||"none"):"",h1=(f.hide==="hint"||f.hide==="none")?f.hide:"",up={},E=evs();
  const liveEv=keys(old.ev).filter(id=>E[id]);
  if(h0===h1){
    const b=base(sid,iid,h0)+"/";
    if(t!==old.t)up[b+"t"]=t;if(emoji!==(old.emoji||""))up[b+"emoji"]=emoji||null;if(note!==(old.note||""))up[b+"note"]=note||null;
    if(size!==(old.size||""))up[b+"size"]=size||null;
    if(!sameMap(want,old.want))up[b+"want"]=keys(want).length?want:null;if(!sameMap(star,old.star))up[b+"star"]=keys(star).length?star:null;
    if(h0===""&&(t!==old.t||emoji!==(old.emoji||"")))liveEv.forEach(id=>{up["calendar/events/"+id+"/title"]=t.slice(0,60);up["calendar/events/"+id+"/emoji"]=emoji||"🎉";});
  }else{
    const rec=clone(old);rec.t=t;
    [["emoji",emoji],["note",note],["size",size]].forEach(p=>{if(p[1])rec[p[0]]=p[1];else delete rec[p[0]];});
    if(keys(want).length)rec.want=want;else delete rec.want;if(keys(star).length)rec.star=star;else delete rec.star;
    delete rec.hide;delete rec.ev;delete rec.on;
    const ev={},on={},oldOn=old.on||{};
    if(h1==="none"){   // off the calendar: each event becomes a date kept here
      liveEv.forEach(id=>{const x=E[id];up["calendar/events/"+id]=null;const o={d:x.date};if(x.time)o.time=x.time;on[rid("o")]=o;});
      Object.keys(oldOn).forEach(k=>{if(oldOn[k]&&isIso(oldOn[k].d))on[k]=clone(oldOn[k]);});
    }else{             // onto the calendar: real words, or only "A surprise"
      liveEv.forEach(id=>{ev[id]=true;const x=eventFor(rec,h1,E[id].date,E[id].time,E[id].who);up["calendar/events/"+id+"/title"]=x.title;up["calendar/events/"+id+"/emoji"]=x.emoji;});
      Object.keys(oldOn).forEach(k=>{const o=oldOn[k];if(!o||!isIso(o.d))return;const id=newEvId(o.d);up["calendar/events/"+id]=eventFor(rec,h1,o.d,o.time,"family");ev[id]=true;});
    }
    if(h1)rec.hide=h1;if(keys(ev).length)rec.ev=ev;if(Object.keys(on).length)rec.on=on;
    up[base(sid,iid,h1)]=rec;if(base(sid,iid,h1)!==base(sid,iid,h0))up[base(sid,iid,h0)]=null;
  }
  apply(up);return true;
}
function snSave(){if(!snEdit)return;if(snEdit.type==="season"){saveSeason();return;}if(snEdit.type!=="idea")return;if(saveIdea()){snEdit=null;draw();}}
function flush(iid){return !(snEdit&&snEdit.type==="idea"&&snEdit.id===iid)||saveIdea();}   // a button inside the idea pop-up keeps what she typed first
function snCancel(){snEdit=null;draw();}
function snDelIdea(){
  if(!snEdit||snEdit.type!=="idea")return;
  if(!snEdit.ask){snEdit.ask=true;draw();return;}
  const sid=snEdit.sid,iid=snEdit.id,it=idea(sid,iid),up={};if(!it){snEdit=null;draw();return;}
  keys(it.ev).forEach(id=>{if(evs()[id])up["calendar/events/"+id]=null;});
  up[base(sid,iid,hideOf(it))]=null;apply(up);snEdit=null;toast("Removed "+(it.t||"the idea"));draw();
}

// ── 📅 Schedule ──────────────────────────────────────────────────────────────
function snSched(iid,moveId){
  const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;
  const mv=moveId?whens(it).find(w=>w.id===moveId):null,E=evs();
  snEdit={type:"sched",sid,id:iid,move:mv?mv.id:null,openOnly:false,more:0,form:{time:mv?mv.time:"",who:(mv&&mv.k==="ev"&&E[mv.id]&&E[mv.id].who)||"family",any:""}};draw();
}
function snDaysOpen(v){if(!snEdit||snEdit.type!=="sched")return;snEdit.openOnly=!!v;draw();}
function snDaysMore(){if(!snEdit||snEdit.type!=="sched")return;snEdit.more=(snEdit.more||0)+1;draw();}
function snPickAny(){if(!snEdit||snEdit.type!=="sched")return;const d=snEdit.form.any;if(!isIso(d)){snEdit.msg="Pick a date first.";draw();return;}snPickDay(d);}
// One tap on a day. An idea everyone can see (or a ✨ hint) → ONE family event + the idea's link to it. A 🤐 → its date kept here only.
// Moving = the SAME event gets its new date (the calendar stays the one truth).
function snPickDay(d){
  const e=snEdit;if(!e||e.type!=="sched"||!isIso(d))return;
  const it=idea(e.sid,e.id);if(!it){snEdit=null;draw();return;}
  const h=hideOf(it),b=base(e.sid,e.id,h),time=String(e.form.time||"").trim().slice(0,12),forWho=(e.form.who&&e.form.who!=="family"&&roster().some(k=>k.id===e.form.who))?e.form.who:"family",up={};
  const mv=e.move?whens(it).find(w=>w.id===e.move):null;
  if(mv&&mv.k==="ev"){up["calendar/events/"+mv.id+"/date"]=d;up["calendar/events/"+mv.id+"/time"]=time;up["calendar/events/"+mv.id+"/who"]=forWho;}
  else if(mv){const o={d};if(time)o.time=time;up[b+"/on/"+mv.id]=o;}
  else if(h==="none"){const o={d};if(time)o.time=time;up[b+"/on/"+rid("o")]=o;}
  else{const id=newEvId(d);up["calendar/events/"+id]=eventFor(it,h,d,time,forWho);up[b+"/ev/"+id]=true;}
  if(it.skip)up[b+"/skip"]=null;
  apply(up);snEdit=null;toast((h==="none"?"🤐 ":"📅 ")+(it.t||"Idea")+" → "+fmtDay(d));draw();
}
function offPaths(it,b,only,up){   // take an idea's day(s) off: the event goes, and the idea's link to it
  whens(it).forEach(w=>{if(only&&w.id!==only)return;if(w.k==="ev"){up["calendar/events/"+w.id]=null;up[b+"/ev/"+w.id]=null;}else up[b+"/on/"+w.id]=null;});
  return up;
}
function snUnsched(iid,whenId){
  const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;
  const up=offPaths(it,base(sid,iid,hideOf(it)),whenId||null,{});apply(up);snEdit=null;toast("Taken off — it’s back to not scheduled yet");draw();
}
function snDid(iid){
  const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;
  const t=today(),past=whens(it).filter(w=>w.d<=t),up={};
  up[base(sid,iid,hideOf(it))+"/did"]=past.length?past[past.length-1].d:t;if(it.skip)up[base(sid,iid,hideOf(it))+"/skip"]=null;
  apply(up);snEdit=null;toast("✅ "+(it.t||"Done"));draw();
}
function snUndid(iid){const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;const up={};up[base(sid,iid,hideOf(it))+"/did"]=null;apply(up);snEdit=null;draw();}
function snSkip(iid){   // 🌙 Not this year: parked without guilt — and off the calendar
  const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;
  const b=base(sid,iid,hideOf(it)),up=offPaths(it,b,null,{});up[b+"/skip"]=true;apply(up);snEdit=null;toast("🌙 Not this year");draw();
}
function snUnskip(iid){const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;const up={};up[base(sid,iid,hideOf(it))+"/skip"]=null;apply(up);snEdit=null;draw();}

// ── loading: only for Mom, only once this page is opened ─────────────────────
function onPage(){try{return typeof tab!=="undefined"&&tab==="moms-plan"&&typeof mpSubView!=="undefined"&&mpSubView==="seasons";}catch(e){return false;}}
function snListen(){
  if(snOn)return;snOn=true;
  if(typeof db==="undefined"||!db){snLoaded=true;return;}
  const got=()=>{if(++snGot>=2)snLoaded=true;if(snLoaded&&onPage()&&!snEdit)draw();};
  let a=false,b=false;
  db.ref("seasons").on("value",s=>{snData=s.val()||{};if(!a){a=true;got();}else if(onPage()&&!snEdit)draw();});
  db.ref("seasonSecret").on("value",s=>{snSecret=s.val()||{};if(!b){b=true;got();}else if(onPage()&&!snEdit)draw();});
}
const SN_CSS=`
.sn-wrap{padding:10px 12px 40px;max-width:760px;margin:0 auto;font-family:'DM Sans',sans-serif}
.sn-title{font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin:8px 0 8px}
.sn-h2{font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin:4px 34px 6px 0}
.sn-sub{font-size:12.5px;color:var(--muted);line-height:1.45;margin:4px 0 10px}
.sn-occs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.sn-occ{padding:7px 12px;border-radius:99px;border:1.5px solid var(--border);background:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;color:#475569}
.sn-occ.on{background:#2B7A78;color:#fff;border-color:#2B7A78}
.sn-card{background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(43,122,120,.13);overflow:hidden;margin-bottom:10px}
.sn-start{text-align:center;padding:20px 16px}
.sn-start .sn-h2{margin-right:0}
.sn-kinds{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:10px}
.sn-kind{border:1.5px solid var(--border);background:#fff;border-radius:12px;padding:12px 8px;font-size:24px;cursor:pointer;font-family:inherit;color:#0f172a}
.sn-kind span{display:block;font-size:12.5px;font-weight:800;margin-top:4px}
.sn-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;color:#fff;font-weight:800;font-size:15px;background:#2B7A78}
.sn-hdt{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px}
.sn-days{font-size:11.5px;font-weight:700;opacity:.92}
.sn-hdb{flex:none;background:rgba(255,255,255,.92)!important}
.sn-bd{padding:8px 14px 12px}
.sn-line{font-size:13px;margin-top:5px;line-height:1.45}
.sn-picks{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}
.sn-pl{font-size:11px;font-weight:800;color:#64748b;margin-right:2px}
.sn-pick{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;border:1.5px solid var(--border);border-radius:99px;padding:2px 9px;white-space:nowrap}
.sn-pick i{width:9px;height:9px;border-radius:50%;display:inline-block}
.sn-pick.warn{border-color:#f59e0b;background:#fffbeb;color:#92400e}
.sn-add{background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:8px;margin-bottom:10px}
.sn-addrow{display:flex;gap:6px}
.sn-addrow input{flex:1;min-width:0;font:inherit;font-size:15px;padding:9px 10px;border:1.5px solid var(--border);border-radius:9px}
.sn-forrow{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-top:7px}
.sn-pchip{border:1.5px solid var(--c);color:var(--c);background:#fff;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}
.sn-pchip.on{background:var(--c);color:#fff}
.sn-wp{display:inline-flex;align-items:center;gap:2px}
.sn-star{border:none;background:none;font-size:18px;cursor:pointer;padding:2px 4px;color:#94a3b8;line-height:1}
.sn-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.sn-f{padding:5px 10px;border-radius:99px;border:1.5px solid var(--border);background:#fff;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;color:#475569}
.sn-f.on{background:#DEF2F1;color:#1f5e5c;border-color:#2B7A78}
.sn-item{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:8px 10px;margin-bottom:6px}
.sn-item.dim{opacity:.6}
.sn-ib{flex:1 1 200px;min-width:0;text-align:left;background:none;border:none;padding:0;cursor:pointer;font:inherit;color:inherit}
.sn-ia{display:flex;gap:5px;margin-left:auto}
.sn-it{font-size:14px;line-height:1.3}
.sn-im{display:flex;flex-wrap:wrap;gap:4px 6px;margin-top:5px;align-items:center}
.sn-note{font-size:11.5px;color:#64748b;margin-top:4px;white-space:pre-wrap}
.sn-who{font-size:10.5px;font-weight:800;color:#fff;border-radius:99px;padding:1px 8px;white-space:nowrap}
.sn-chip{font-size:10px;font-weight:700;border:1px solid #cbd5e1;color:#475569;border-radius:99px;padding:1px 7px;white-space:nowrap}
.sn-chip.sec{border-color:#a78bfa;color:#6d28d9;background:#f5f3ff}
.sn-st{font-size:12px;font-weight:800}
.sn-st.todo{color:#b45309}.sn-st.sched{color:#0f766e}.sn-st.past{color:#b45309}.sn-st.done{color:#15803d}.sn-st.skip{color:#64748b}
.sn-tool{border:1.5px solid var(--border);background:#fff;border-radius:9px;padding:6px 10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;color:#0f172a;white-space:nowrap}
.sn-go{border:none;background:#2B7A78;color:#fff;border-radius:9px;padding:7px 12px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap}
.sn-save{background:#111827;color:#fff;border-color:#111827;padding:8px 16px}
.sn-del{margin-left:auto;color:#b91c1c}
.sn-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}
.sn-foot{border-top:1px solid #f1f5f9;padding-top:10px;margin-top:12px}
.sn-empty{padding:10px;text-align:center;color:var(--muted);font-size:12.5px}
.sn-msg{margin-top:8px;font-size:12.5px;font-weight:700;color:#b45309}
.sn-lab{font-size:12px;font-weight:800;margin:12px 0 5px}
.sn-lab small{font-weight:600;color:#64748b}
.sn-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.sn-check{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin-top:10px}
.sn-when{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;margin-bottom:5px}
.sn-when span{flex:1}
#sn-sheet{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:300;display:flex;align-items:flex-end;justify-content:center}
.sn-sh{position:relative;background:#fff;width:100%;max-width:640px;max-height:90vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 16px 28px;box-sizing:border-box;font-family:'DM Sans',sans-serif}
.sn-x{position:absolute;right:12px;top:10px;border:none;background:var(--bg);border-radius:99px;width:32px;height:32px;font-size:15px;cursor:pointer}
.sn-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px 10px;margin-top:6px}
.sn-fl{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:var(--muted);margin-top:6px}
.sn-fl.wide{grid-column:1/-1}
.sn-fl input,.sn-fl select,.sn-fl textarea{font:inherit;font-size:14px;font-weight:500;color:#0f172a;padding:8px 9px;border:1.5px solid var(--border);border-radius:9px;background:#fff;font-family:inherit;width:100%;box-sizing:border-box}
.sn-daylist{margin-top:8px;display:flex;flex-direction:column;gap:5px}
.sn-day{display:flex;flex-direction:column;gap:2px;text-align:left;border:1.5px solid var(--border);border-radius:10px;background:#fff;padding:8px 10px;cursor:pointer;font-family:inherit;color:#0f172a}
.sn-day b{font-size:13.5px}
.sn-day span{font-size:11.5px;color:#475569;line-height:1.4}
.sn-day i{font-style:normal;color:#64748b}
.sn-day em{font-style:normal;font-weight:800;color:#b45309}
.sn-day.open{border-color:#86efac;background:#f0fdf4}
.sn-day.open span{color:#15803d;font-weight:700}
.sn-day.cur{border-color:#2B7A78;border-width:2.5px}
`;
window.renderSeasons=function(el,ah){
  if(typeof momHere==="function"&&!momHere()){el.innerHTML=(ah||"")+'<div class="sn-empty" style="padding:40px;text-align:center">🔒 Mom only.</div>';return;}   // surprises live here: nothing loads without Mom
  if(!document.getElementById("sn-style")){const s=document.createElement("style");s.id="sn-style";s.textContent=SN_CSS;document.head.appendChild(s);}
  snRoot=el;snAh=ah||"";snListen();draw();
};
Object.assign(window,{snNewSeason,snKind,snEditSeason,snDelSeason,snPick,snPastToggle,snFilterSet,snForToggle,snQuickAdd,snOpenIdea,snSet,snWant,snStar,snSize,snHide,snSave,snCancel,snDelIdea,
  snSched,snDaysOpen,snDaysMore,snPickAny,snPickDay,snUnsched,snDid,snUndid,snSkip,snUnskip});
window._snTest={data:()=>snData,secret:()=>snSecret,setData:(d,s)=>{snData=d||{};snSecret=s||{};snLoaded=true;},reset:()=>{snSid=null;snFilter="all";snEdit=null;snFor={};snPast=false;},
  setRoot:(el,ah)=>{snRoot=el;snAh=ah||"";},draw,edit:()=>snEdit,seasons,season,ideasOf,idea,whens,state,counts,picks,openDays,dayInfo,mins,starsUsed,starMax,apply,schedRange,kindDefaults,fmtDay,curSid,OK:SN_OK};
})();
