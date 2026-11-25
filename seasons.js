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
//   calendar/events/<eventId>     the calendar's OWN record {title, date, time, who, emoji, addedBy, mins?, hold?} — what 📅 Schedule
//                                  writes. A ✨ hint's event is {title:"A surprise", emoji:"✨"}: the real words never reach the calendar.
//                                  mins = how long it lasts (only when start + end make a readable length); hold:true = ⏰ school is
//                                  planned around it (only with mins). Both are only ever written as a value or removed — never false/0.
// THE DATE IS NEVER STORED ON AN IDEA: an idea is "scheduled" while one of its ev ids is still in the calendar, and its date and time
// are that event's. Move or remove the event in the calendar and the idea follows. (🤐 has no event, so its date is in `on`.)
// SCHOOL IS NEVER TOUCHED: every write goes through apply(), which refuses any path outside seasons/, seasonSecret/ and
// calendar/events/. A family event is display-only UNLESS it holds its time (⏰ hold:true + mins): the scheduler reads a held event
// (index.html EVHOLD) and lays school around it. This file never runs scheduler code itself: after a write that makes, changes or
// removes an event, apply() hands each one to the calendar's ONE re-plan door, evHoldRelay — which decides by itself whether anything
// needs re-planning. This file never writes holidays, vacations, co-ops, kid days off or Family Time.
// Every write is ONE multi-path update of exact records/fields (db.ref().update), and only when !_dryRun() (?dryrun=1 stays inert).
// who = a roster kid id, "mom", "dad" or "family". Counts, open days and Everyone's picks are worked out on screen, never stored.
//
// SEASONS slice 2 (her "Planner slice 2" 2026-11-20; plan §4.3 🎟/🧺/✅, §4.6, §4.8; her answers 8 + 10): supplies, to-dos and a
// book-by date on an idea, supplies and to-dos for the whole season, the 🧺 Supplies and ✅ To-dos views, and the due ones in
// 🔴 NOW on Home Base (window.seasonNowLines — Mom only, never Dad's TV).
//   on an idea (so a 🤫 surprise's lines live in seasonSecret/ with it):
//       bookBy?:"YYYY-MM-DD", booked?:true,
//       sup/<id>   {name, qty?, have?:true, gr?:<its Shopping List row id>}
//       todo/<id>  {t, who, due?:"YYYY-MM-DD" | before?:<days before the idea's day>, done?:"YYYY-MM-DD", list?:"YYYY-MM-DD"}
//   seasons/extra/<sid>/sup/<id> · seasons/extra/<sid>/todo/<id>     the same lines for the whole season (no `before`)
//   momday/<iso>/todos/sn<todoId>  {text, done, ts, src:"season", sn}   ONLY from "→ My list today": one copy on Mom's own daily list
//   kitchen/grocery/items/<id>     ONLY through the Kitchen's own grCreate (🛒 To the list — her answer 8: "one tap", never by itself)
//                                  with ref:{sn:"<sid>/<iid|->/<supId>"} and src {k:"season", lbl}; this file keeps just `gr`.
// "N days before" is never turned into a date in the data: the due day is worked out from the idea's day each time, so it moves
// by itself when the idea moves. A to-do is done when it is ticked here OR its copy on Mom's list is ticked.
// 🤫 A SURPRISE'S NAME NEVER LEAVES THIS PAGE: its Shopping List label is the season only, its 🔴 NOW line is a count with no
// words, and its copy on Mom's list says only "A surprise to-do". (The supply's own name is what she chose to put on the list.)
//
// SEASONS slice 3 (her "Yes, kids' page" 2026-11-21): seasons/list/<sid>.kids = true opens ONE season to the kids — off until she
// taps 🧒 Open it to the kids (one field, its only home is the season's header). The kids' page is its own file (seasonkid.js, in
// Kids' Corner ▸ ✨ Our plans): it reads seasons/list and that season's seasons/ideas only, so nothing in seasonSecret/ can reach it.
// A kid's idea arrives here as an ordinary idea with by:<kid>; this page marks it "💡 <name>'s idea".
//
// SEASONJOBS step A (her yes to "Dad & kid to-dos" 2026-11-21; her answers: a to-do shows on its DUE DAY, with a per-to-do option to
// show it some days ahead · Dad's land on his list BY THEMSELVES, no tap): a to-do whose who is "dad" and that has a day goes onto
// Dad's OWN running to-do list as ONE copy, the same shape as Mom's copy:
//   dadday/<show day>/todos/sn<todoId>  {text, done, ts, src:"season", sn:"<sid>/<iid|->/<todoId>"}   show day = due day − ahead
//   on the to-do:  ahead?:<days early, 1–30>   dadOn?:"YYYY-MM-DD" (the day its copy was put on; so a copy Dad ✕'d is not sent again)
// No new reader: Dad's list already shows today's plus unfinished ones from earlier days and hides later days (index.html tdRunning),
// so a copy put on a later day simply appears on that day. dadSync() (Mom's device only, after everything has loaded, never in a dry
// run) works out what his list SHOULD hold and fixes the difference: it adds, re-words, moves (removing the old day's copy), and takes
// off any unticked copy whose to-do was deleted, done here, re-assigned, lost its day, became a 🤫 surprise, or whose idea/season was
// deleted, 🌙 parked, ✓ done or 📜 closed. A copy Dad ticked is never touched or re-added; his tick makes the to-do done here, and
// Mom's tick here ticks his copy in the same update. 🤫 A SURPRISE'S TO-DOS NEVER GO TO DAD'S LIST (dadday is read by every device);
// the row says so.
//
// SEASONJOBS step B (same yes; her answers: a kid's to-do shows on its due day or some days ahead · ⭐ for it is an OPTION — a number
// she sets per to-do, 0 unless she sets it): a to-do whose who is a roster kid and that has a day goes to that kid's own jobs:
//   seasonJobs/<kid>/<todoId>  {t, for, show, due, stars?, sn, ts}   written by Mom's device (outSync), ONE record per job
//                              + done:"YYYY-MM-DD", bid?:<the bank entry it paid>   written by the kid's tick (seasonkid.js) or hers here
//   on the to-do:  stars?:<1–50>   jobFor?:<kid>  (whose jobs it went to — so a job a kid already did is never sent to anyone again)
// The kid sees it in Kids' Corner ▸ ✨ Our plans ▸ Your jobs from its show day (seasonkid.js reads seasonJobs/<that kid> only).
// ⭐ PAY THE WAY EVERY KID CHECK-OFF IN THE APP PAYS (routine steps, Up for Grabs, a once-job on a cleaning day): on the tick, through
// the app's own bankDirect(kid, stars, label, choreVerifyOn(kid)) — so it is HELD for Mom's check exactly when that kid's chore check
// is on, and released or ✗'d in the same held list — and the entry's id is kept on the job (bid). An un-tick takes back exactly that
// entry (cuUnpay when Mom/Dad undoes a paid one, else bankDirectRemove). A job already holding a bid is never paid again. A job a kid
// ticked is history: re-wording, re-assigning or deleting the to-do never touches it, so its stars are never stranded or doubled.
// 🤫 a surprise's to-dos never go to a kid. Nothing here ever gates school, the morning gate, a routine or a missed chore — this is
// its own list on its own page.
//
// SEASONREPEAT slice 7 (her "Repeating nights" 2026-11-22; her words 11/21: "multiple options even pick the days and add them as well"):
// the 📅 Schedule pop-up has three ways — One day (as before) · Every week (the next 2–12 of one weekday) · Pick days (tap up to 20,
// then add them all at once). EACH DAY IS ITS OWN ORDINARY calendar/events/<id> record — the same one a single tap makes — linked
// in the idea's ev:{} (🤐: its own date in on:{}). Nothing new is stored and no calendar code changes: the calendar has no
// "repeating" events. A day the idea is already on is skipped, never doubled; a day that went by can't be added. ✕ Take off still
// works per day, and "✕ Take all N days off" clears them together; deleting or 🌙 parking the idea takes every day off.
// "Its day" = the next day still to come (today counts), else the last one — for its row, the kids' countdown and the sort. Its
// to-dos ("N days before", Dad's list, a kid's jobs, 🔴 NOW) count back from its FIRST day: a to-do happens once, not every night.
//
// SEASONFOOD slice 4 (her "Food → Kitchen" 2026-11-22; plan §4.7): an idea can hold FOOD lines — a recipe from the family's own
// Kitchen, or just words:   food/<id>  {name, mid?:<kitchen/meals id>, ts, menu?:{<"YYYY-MM-DD">:{s:"d"|"b"|"l"|"s", side?:true}}}
// (on the idea, so a 🤫 surprise's food lives in seasonSecret/ with it). Things to buy for word-food are ordinary supply lines.
// THE KITCHEN IS WRITTEN ONLY THROUGH ITS OWN FUNCTIONS — nothing under kitchen/ is in SN_OK:
//   🛒 Ingredients → grIngRows + grImpOpen, the Kitchen's own tick sheet (what grFromRecipe opens: the pantry, staples and what is
//      already on the list start unticked), labelled like supplies ("🎄 Season · Idea"; a 🤫 idea: the season only).
//   🍽 Put on the Menu → kitRotDaySet(day, slot, {mid}|{txt}) for the meal itself, kitSideAddMid / kitSideChange for a dinner side.
//      It picks one of the idea's days still to come (the next one first) and Dinner/Breakfast/Lunch/Snack. If that spot already has
//      something it ASKS: replace · add as a side (dinner) · leave it — never a quiet overwrite. menu/<day> remembers where it went
//      only after the Kitchen really has it, so the row can say "On the Menu — Fri Dec 5, snack" and ✕ take it off again.
//   Nothing on the Menu or the Shopping List is ever moved or removed by itself: the idea's day moving, a day taken off, the food
//   line deleted, the idea deleted or 🌙 parked — its Menu spots stay and the row (or a toast) says so plainly, with a ✕.
//   🤫 A SURPRISE'S FOOD NEVER GOES ON THE MENU (every device shows the Menu); its ingredients may go to the list, labelled with the
//   season only — the same rule supplies follow.
(function(){
"use strict";
let snData={}, snSecret={}, snOn=false, snLoaded=false, snGot=0, snSid=null, snFilter="all", snEdit=null, snRoot=null, snAh="", snFor={}, snPast=false, snFocus=false;
let snView="ideas", snAsk=null, snNowWant=false;
let snDdFresh=false;   // SEASONJOBS fix (hub review 11/21): Dad's list has come from the server at least once — never sync against a stale copy
let snJobs={}, snJobsOk=false;   // SEASONJOBS step B: seasonJobs/ (every kid's season jobs) — Mom's device only
const SN_BOOK_DAYS=7, SN_NOW_MAX=5;   // 🎟 a book-by date shows in 🔴 NOW from a week ahead · NOW lists at most this many lines
const SN_STARS=3;   // her answer 2026-11-20: "three ⭐ each per season"
const SN_WEEKS_MIN=2, SN_WEEKS_MAX=12, SN_PICK_MAX=20;   // SEASONREPEAT: "every week" puts 2–12 on · "pick days" adds up to 20 at once
const SN_KINDS=[["holiday","🎄","Holiday season"],["summer","☀️","Summer bucket list"],["season","🍂","A season"],["trip","🧳","Trip"],["party","🎂","Party or event"],["someday","💭","Someday list"]];
const SN_SIZES=[["quick","⚡","Quick"],["home","🏠","At home"],["out","🚗","Outing"]];
const SN_HIDE=[["","👀","Everyone can see it"],["hint","✨","Surprise, with a hint"],["none","🤐","Surprise, no hint"]];
const SN_HINT_TITLE="A surprise", SN_HINT_EMOJI="✨";
const SN_FILTERS=[["all","All"],["todo","Not scheduled yet"],["sched","Scheduled"],["done","Done"],["skip","🌙 Not this year"]];
const SN_MOM={id:"mom",name:"Mom",color:"#b5394a"}, SN_DAD={id:"dad",name:"Dad",color:"#1d4ed8"}, SN_FAM={id:"family",name:"Everyone",color:"#2B7A78"};
const SN_MEALS=[["d","🍽","Dinner"],["b","🌅","Breakfast"],["l","☀️","Lunch"],["s","🍎","Snack"]];   // SEASONFOOD: the Kitchen's own slots
const SN_MODES=[["one","One day"],["week","Every week"],["pick","Pick days"]], SN_DOWL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
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
// Slice 2 adds two: seasons/extra/<sid> (whole-season lines) and ONE kind of record on Mom's own to-do list — momday/<day>/todos/sn<id>.
// SEASONJOBS step A adds ONE more: the same kind of sn-record on Dad's own to-do list — dadday/<day>/todos/sn<id>.
// Step B adds a kid's job record: seasonJobs/<kid>/<todoId> (the bank is reached only through the app's own bankDirect).
const SN_OK=/^(seasons\/(list|ideas|extra)\/[^\/]+|seasonSecret\/[^\/]+\/[^\/]+|calendar\/events\/[^\/]+|(momday|dadday)\/\d{4}-\d{2}-\d{2}\/todos\/sn[^\/]+|seasonJobs\/[^\/]+\/[^\/]+)(\/|$)/;
function setIn(o,parts,v){
  for(let i=0;i<parts.length-1;i++){if(o[parts[i]]==null||typeof o[parts[i]]!=="object"){if(v==null)return;o[parts[i]]={};}o=o[parts[i]];}
  const k=parts[parts.length-1];if(v==null)delete o[k];else o[k]=clone(v);
}
function cal(){try{return (typeof calendarData!=="undefined"&&calendarData)||{};}catch(e){return {};}}
function evs(){return cal().events||{};}
function apply(up){
  const P=Object.keys(up);if(!P.length)return false;
  if(P.some(p=>!SN_OK.test(p))){try{console.warn("seasons: refused a write outside its own nodes",P);}catch(e){}return false;}
  const EV=[],was={},LK={};P.forEach(p=>{const a=p.split("/");if(a[0]==="calendar"&&a[2]&&EV.indexOf(a[2])<0){EV.push(a[2]);was[a[2]]=clone(evs()[a[2]]||null);}});   // SEASONHOLD: each event before
  P.forEach(p=>{if(up[p]===null&&SN_EVLINK.test(p)&&linkNow(p)===true)LK[p]=true;});   // …and each idea→event link this write takes off
  P.forEach(p=>{const a=p.split("/"),v=up[p];
    if(a[0]==="seasons")setIn(snData,a.slice(1),v);
    else if(a[0]==="seasonSecret")setIn(snSecret,a.slice(1),v);
    else if(a[0]==="momday"){try{if(typeof momdayData!=="undefined"&&momdayData){setIn(momdayData,a.slice(1),v);if(!dry())HA_LS.setItem("momday_data",JSON.stringify(momdayData));}}catch(e){}}
    else if(a[0]==="seasonJobs")setIn(snJobs,a.slice(1),v);
    else if(a[0]==="dadday"){try{if(typeof daddayData!=="undefined"&&daddayData){setIn(daddayData,a.slice(1),v);if(!dry())HA_LS.setItem("ha_dadday",JSON.stringify(daddayData));}}catch(e){}}
    else{const c=cal();if(!c.events)c.events={};setIn(c.events,a.slice(2),v);}});
  if(live())db.ref().update(up);
  if(live())relay(EV,was,LK);   // SEASONHOLD: only after a real write
  return true;
}
// SEASONHOLD: after a REAL write (never ?dryrun=1), every event it made, changed or removed goes to the calendar's one re-plan door.
// The door re-plans only when a held block on the built week appears, changes or goes (several within 2 s = one re-plan, one Undo).
// A HELD day taken off (✕ one · take all off · 🌙): the door's Undo brings the calendar event back — so the idea's link to it goes in
// the SAME Undo (relayWeek joins calls within 2 s into one re-plan and merges its undo list by path). Deleting the idea or switching
// it to 🤐 takes no link path off, so its Undo brings back only the event (left as it was — the hub's call 11/23).
const SN_EVLINK=/^(seasons\/ideas|seasonSecret)\/[^\/]+\/[^\/]+\/ev\/[^\/]+$/;
function linkNow(p){const a=p.split("/");let o=a[0]==="seasons"?snData:snSecret;for(let i=1;i<a.length&&o!=null;i++)o=(typeof o==="object")?o[a[i]]:undefined;return o;}
function relay(ids,was,LK){
  if(typeof evHoldRelay!=="function")return;
  ids.forEach(id=>{try{
    const now=clone(evs()[id]||null);
    if(evHoldRelay(id,was[id],now)===true&&!now&&typeof relayWeek==="function"){
      const back=Object.keys(LK||{}).filter(p=>p.slice(p.lastIndexOf("/")+1)===id).map(p=>({p,was:true}));
      if(back.length)relayWeek("calendar",{undo:back});
    }
  }catch(e){try{console.warn("seasons: re-plan door",e);}catch(x){}}});
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
function people(){return roster().map(k=>({id:k.id,name:k.name,color:k.color||"#64748b",kid:true})).concat([SN_MOM,SN_DAD].map(p=>{const n=(typeof haAdult==="function")?haAdult(p.id,p.name):p.name;return n===p.name?p:Object.assign({},p,{name:n});}));}   // 🏡 HHNAMES: a household's adults by name
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

// ── lines: supplies and to-dos, on an idea or on the whole season (slice 2) ──
// A line = {id, sid, iid ("" = the whole season), it (its idea or null), r (the record)}.
function ideaLines(it,kind){const o=(it&&it[kind])||{};return Object.keys(o).filter(id=>o[id]&&typeof o[id]==="object").map(id=>({id,sid:it.sid,iid:it.id,it,r:o[id]}));}
function lines(sid,kind){
  const X=((snData.extra||{})[sid]||{})[kind]||{};
  let out=Object.keys(X).filter(id=>X[id]&&typeof X[id]==="object").map(id=>({id,sid,iid:"",it:null,r:X[id]}));
  ideasOf(sid).forEach(it=>{out=out.concat(ideaLines(it,kind));});
  return out;
}
function line(sid,iid,kind,lid){return lines(sid,kind).find(L=>L.id===lid&&L.iid===(iid||""))||null;}
function lineBase(L,kind){return (L.iid?base(L.sid,L.iid,hideOf(L.it)):"seasons/extra/"+L.sid)+"/"+kind+"/"+L.id;}
function parked(L){return !!(L.it&&L.it.skip);}   // 🌙 not this year: its lines rest too
function ideaDay(it){if(!it)return "";const W=whens(it),t=today(),up=W.filter(w=>w.d>=t)[0];return up?up.d:(W.length?W[W.length-1].d:"");}
// SEASONREPEAT: an idea on several days. Its to-dos count back from its FIRST day (a to-do happens once, not every night — and one
// that was missed stays "late" instead of hopping to the next night). With one day, first day = its day, exactly as before.
function firstDay(it){const W=it?whens(it):[];return W.length?W[0].d:"";}
function nightsOf(it){const m={};whens(it).forEach(w=>{m[w.d]=true;});return m;}   // the days it is already on
function weekDates(from,dow,n){let d=from,i=0;while(dOf(d).getUTCDay()!==dow&&i++<7)d=addDays(d,1);const out=[];for(let k=0;k<n;k++)out.push(addDays(d,7*k));return out;}
// ✅ a to-do's day: its own date, or N days before the idea's day — worked out now, so it moves when the idea moves
function tdDue(L){const r=L.r;if(isIso(r.due))return r.due;if(L.it&&r.before!=null&&+r.before>=0){const d=firstDay(L.it);return d?addDays(d,-Math.floor(+r.before)):"";}return "";}
function mdTodos(iso){try{return ((typeof momdayData!=="undefined"&&momdayData&&momdayData[iso])||{}).todos||{};}catch(e){return {};}}
function tdCopy(L){return isIso(L.r.list)?(mdTodos(L.r.list)["sn"+L.id]||null):null;}   // its copy on Mom's own list, if she made one and it's still there
function tdDone(L){const c=tdCopy(L),d=dadCopy(L),j=kidCopy(L);return !!(L.r.done||(c&&c.done)||(d&&d.done)||(j&&j.done));}
// ── 👨 a to-do for Dad on his own list (SEASONJOBS step A) ──
const SN_AHEAD_MAX=30;
function ddTodos(iso){try{return ((typeof daddayData!=="undefined"&&daddayData&&daddayData[iso])||{}).todos||{};}catch(e){return {};}}
function dadCopy(L){return isIso(L.r.dadOn)?(ddTodos(L.r.dadOn)["sn"+L.id]||null):null;}   // its copy on Dad's list, if it's still there
function ahead(r){const n=Math.floor(+r.ahead);return n>0?Math.min(n,SN_AHEAD_MAX):0;}
function showDay(L){const d=tdDue(L);return d?addDays(d,-ahead(L.r)):"";}   // her answer 1: its due day, or "ahead" days before it
// Why a to-do is NOT on Dad's list ("" = it should be). The one rule the sync and Mom's row both use.
function dadWhy(L){return (L.r.who||"mom")!=="dad"?"who":outWhy(L);}
function kidWhy(L){return (kidPageOk()&&isKidId(L.r.who))?outWhy(L):"who";}   // SEASONJOBS step B: the same rule for a kid's jobs
function outWhy(L){
  const s=season(L.sid);if(!s||s.closed)return "closed";
  if(L.it&&hideOf(L.it))return "secret";
  if(L.it&&(L.it.skip||L.it.did))return "rest";
  if(tdDone(L))return "done";
  return showDay(L)?"":"noday";
}
// ── 🧒 a to-do for a kid → their own jobs (SEASONJOBS step B) ──
const SN_STARS_MAX=50;
function isKidId(w){return !!w&&roster().some(k=>k.id===w);}
// KIDPAGE guard: kids' jobs need the page's kids' side (index.html SEASONKID block + seasonkid.js). skJobsN is that block's job
// counter, so it is there only where a kid can see and tick a job. An older page without it: a kid's to-do is a plain to-do with
// their name — no seasonJobs read or write, no job chips, no ⭐, no pay, no 🧒 Open it to the kids. Old kids/jobFor/stars just sit.
function kidPageOk(){return typeof skJobsN==="function";}
function kidCopy(L){const k=L.r.jobFor;return (k&&typeof k==="string"&&kidPageOk())?(((snJobs[k]||{})[L.id])||null):null;}   // its job record, where it was sent
function jobStars(r){const n=Math.floor(+((r||{}).stars));return n>0?Math.min(n,SN_STARS_MAX):0;}
function jobRec(L){const it=L.it,s=season(L.sid)||{},r={t:String(L.r.t||"").slice(0,120),for:(it?((it.emoji?it.emoji+" ":"")+(it.t||"")):((s.emoji||"🎉")+" "+(s.name||""))).trim(),show:showDay(L),due:tdDue(L),sn:L.sid+"/"+(L.iid||"-")+"/"+L.id};
  const st=jobStars(L.r);if(st)r.stars=st;return r;}
function jobLabel(t){return "🎉 "+String(t||"").slice(0,80);}
// Pay / take back ONE job's stars through the app's own bank functions (see the header). Returns the fields to write on the job.
function jobPay(k,c,on){
  const f={};if(dry())return f;
  if(on){if(c&&+c.stars>0&&!c.bid&&typeof bankDirect==="function"){let bid=null;try{bid=bankDirect(k,+c.stars,jobLabel(c.t),(typeof choreVerifyOn==="function"&&choreVerifyOn(k)))||null;}catch(e){}if(bid)f.bid=bid;}}
  else if(c&&c.bid){try{if(!(typeof cuUnpay==="function"&&cuUnpay(k,c.bid,jobLabel(c.t)))&&typeof bankDirectRemove==="function")bankDirectRemove(k,c.bid);}catch(e){}f.bid=null;}
  return f;
}
function lineOf(sn,lid){const p=String(sn||"").split("/");return p.length===3&&p[2]===lid?line(p[0],p[1]==="-"?"":p[1],"todo",lid):null;}
function dadPlan(){const want={};seasons().forEach(s=>lines(s.id,"todo").forEach(L=>{if(!dadWhy(L))want[showDay(L)+"/sn"+L.id]=L;}));return want;}
// Make Dad's list hold exactly what dadPlan says — ONE update, only the differences, never a copy he ticked.
// Mom's device only, once the planner AND the calendar have loaded ("N days before" needs the calendar), and never in a dry run.
function dadSync(){
  if(!snLoaded||!live()||!snDdFresh)return 0;   // never on a stale copy of Dad's list (a ✕'d copy could come back as a ghost; a ticked one could be removed)
  try{if(typeof momHere!=="function"||!momHere())return 0;if(typeof _kioskD==="function"&&_kioskD())return 0;}catch(e){return 0;}
  const c0=cal();if(!c0.events||typeof c0.events!=="object")return 0;
  let D={};try{D=(typeof daddayData!=="undefined"&&daddayData)||{};}catch(e){}
  const want=dadPlan(),up={};
  if(snJobsOk&&kidPageOk())kidPlanUp(up);   // SEASONJOBS step B: the kids' jobs, in the same update (never on a page with no kids' side)
  Object.keys(D).forEach(iso=>{if(!isIso(iso))return;const T=(D[iso]||{}).todos||{};
    Object.keys(T).forEach(k=>{const c=T[k];if(k.indexOf("sn")!==0||!c||typeof c!=="object"||c.src!=="season"||c.done||want[iso+"/"+k])return;
      up["dadday/"+iso+"/todos/"+k]=null;   // its to-do is gone, changed, moved, done here or no longer Dad's
      const L=lineOf(c.sn,k.slice(2));if(L&&L.r.dadOn===iso)up[lineBase(L,"todo")+"/dadOn"]=null;});});
  Object.keys(want).forEach(key=>{const L=want[key],iso=key.slice(0,10),k=key.slice(11),c=ddTodos(iso)[k],txt=mineText(L),b=lineBase(L,"todo")+"/dadOn";
    if(c&&typeof c==="object"){if(c.text!==txt)up["dadday/"+iso+"/todos/"+k+"/text"]=txt;if(L.r.dadOn!==iso)up[b]=iso;return;}
    if(L.r.dadOn===iso)return;   // it was put there and Dad ✕'d it off his own list: not sent again unless its day changes
    up["dadday/"+iso+"/todos/"+k]={text:txt,done:false,ts:Date.now(),src:"season",sn:L.sid+"/"+(L.iid||"-")+"/"+L.id};up[b]=iso;});
  if(!Object.keys(up).length)return 0;
  apply(up);return Object.keys(up).length;
}
function kidPlanUp(up){
  const want={};seasons().forEach(s=>lines(s.id,"todo").forEach(L=>{if(!kidWhy(L))want[L.r.who+"/"+L.id]=L;}));
  Object.keys(snJobs||{}).forEach(k=>{const J=snJobs[k];if(!J||typeof J!=="object")return;
    Object.keys(J).forEach(id=>{const c=J[id];if(!c||typeof c!=="object"||c.done||want[k+"/"+id])return;
      up["seasonJobs/"+k+"/"+id]=null;   // gone, changed hands, done here, a surprise now, or its season closed — a job the kid did stays
      const L=lineOf(c.sn,id);if(L&&L.r.jobFor===k)up[lineBase(L,"todo")+"/jobFor"]=null;});});
  Object.keys(want).forEach(key=>{const L=want[key],k=L.r.who,id=L.id,c=(snJobs[k]||{})[id],rec=jobRec(L),P="seasonJobs/"+k+"/"+id,b=lineBase(L,"todo")+"/jobFor";
    if(c&&typeof c==="object"){["t","for","show","due","stars","sn"].forEach(f=>{const nv=rec[f]==null?null:rec[f],ov=c[f]==null?null:c[f];if(nv!==ov)up[P+"/"+f]=nv;});if(L.r.jobFor!==k)up[b]=k;return;}
    up[P]=Object.assign(rec,{ts:Date.now()});up[b]=k;});
}
let snSyncT=null;
function syncSoon(){if(snSyncT)return;try{snSyncT=setTimeout(()=>{snSyncT=null;try{dadSync();}catch(e){}},80);}catch(e){snSyncT=null;}}
// What Mom's row says about Dad's list.
function kidNote(L){   // SEASONJOBS step B: where a kid's to-do stands with their jobs
  if(!isKidId(L.r.who))return "";
  const n=esc(who(L.r.who).name),why=kidWhy(L),c=kidCopy(L),sd=showDay(L),t=today(),chip=x=>'<span class="sn-chip dad">'+x+'</span>',st=jobStars(L.r),sc=st?chip("⭐ "+st):"";
  if(why==="secret")return '<div class="sn-secnote">🤫 Stays here. A surprise’s to-dos never go to '+n+'’s jobs.</div>';
  if(why==="done")return (c&&c.done&&!L.r.done)?chip("✓ "+n+" did it"+(c.bid?" · ⭐ "+(+c.stars||0):"")):"";
  if(why==="noday")return chip("Goes to "+n+"’s jobs once it has a day")+sc;
  if(why)return "";
  if(c&&L.r.jobFor===L.r.who)return chip(sd>t?"In "+n+"’s jobs from "+esc(fmtShort(sd)):"✓ In "+n+"’s jobs")+sc;
  return chip("Going to "+n+"’s jobs")+sc;
}
function dadNote(L){
  if((L.r.who||"mom")!=="dad")return kidNote(L);
  const why=dadWhy(L),c=dadCopy(L),sd=showDay(L),t=today(),chip=x=>'<span class="sn-chip dad">'+x+'</span>';
  if(why==="secret")return '<div class="sn-secnote">🤫 Stays here. A surprise’s to-dos never go to Dad’s list.</div>';
  if(why==="done")return (c&&c.done&&!L.r.done)?chip("✓ Dad ticked it"):"";
  if(why==="noday")return chip("Goes on Dad’s list once it has a day");
  if(why)return "";
  if(c&&L.r.dadOn===sd)return chip(sd>t?"On Dad’s list from "+esc(fmtShort(sd)):"✓ On Dad’s list");
  if(L.r.dadOn===sd)return chip("Dad took it off his list");
  return chip("Going on Dad’s list");
}
function tdState(L){   // done · late (its day went by) · due (today) · open
  if(tdDone(L))return "done";if(L.it&&L.it.did)return "open";
  const d=tdDue(L),t=today();return !d?"open":(d<t?"late":(d===t?"due":"open"));
}
// 🧺 a supply: have · list (its row is on the Shopping List) · was (it was sent and the row is gone: bought?) · need
function grItems(){try{return (typeof grData!=="undefined"&&grData&&grData.items)||{};}catch(e){return {};}}
function supState(L){const r=L.r;if(r.have)return "have";if(r.gr)return grItems()[r.gr]?"list":"was";return "need";}
// 🎟 book by: "" none · booked · late · soon (within a week) · later
function bookState(it){if(!it||!isIso(it.bookBy))return "";if(it.booked)return "booked";const n=daysTo(today(),it.bookBy);return n<0?"late":(n<=SN_BOOK_DAYS?"soon":"later");}
// What a Shopping List row says it is for. 🤫 A surprise names the season only — never the idea.
function shopLabel(sid,it){const s=season(sid)||{};return ((s.emoji||"🎉")+" "+(s.name||"")).trim()+((it&&!hideOf(it)&&it.t)?" · "+it.t:"");}

// ── drawing ──────────────────────────────────────────────────────────────────
function whoChip(id,star){const p=who(id);return '<span class="sn-who" style="background:'+esc(p.color)+'">'+esc(p.name)+(star?" ⭐":"")+'</span>';}
function whenTxt(w){return fmtDay(w.d)+(w.time?" · "+esc(w.time):"");}
function hideChip(it){const h=hideOf(it);return h==="hint"?'<span class="sn-chip sec">✨ surprise, hint</span>':(h==="none"?'<span class="sn-chip sec">🤐 surprise, no hint</span>':"");}
function byChip(it){const k=roster().find(r=>r.id===it.by);return k?'<span class="sn-chip kid">💡 '+esc(k.name)+'’s idea</span>':"";}   // slice 3: a kid added it in Kids' Corner
function sizeChip(it){const z=SN_SIZES.find(x=>x[0]===it.size);return z?'<span class="sn-chip">'+z[1]+" "+z[2]+'</span>':"";}
function statusLine(it,st,W){
  if(st==="skip")return '<span class="sn-st skip">🌙 not this year</span>';
  if(st==="done")return '<span class="sn-st done">✅ did it'+(isIso(it.did)?" · "+fmtDay(it.did):"")+'</span>';
  if(st==="todo")return '<span class="sn-st todo">not scheduled yet</span>';
  const up=W.filter(w=>w.d>=today()),w=(st==="sched"?up[0]:W[W.length-1]),more=up.length-1;   // SEASONREPEAT: "+N more" = days still to come
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
    +'<div class="sn-it">'+esc(it.emoji||"")+(it.emoji?" ":"")+'<b>'+esc(it.t||"(no name)")+'</b> '+hideChip(it)+sizeChip(it)+byChip(it)+'</div>'
    +'<div class="sn-im">'+wants.map(w=>whoChip(w,it.star&&it.star[w])).join("")+statusLine(it,st,W)+(st==="skip"?"":extraChips(it))+'</div>'
    +(it.note?'<div class="sn-note">'+esc(it.note)+'</div>':"")+'</button>'+(b?'<div class="sn-ia">'+b+'</div>':"")+'</div>';
}
function bookChip(it){const b=bookState(it);return !b?"":(b==="booked"?'<span class="sn-chip">🎟 booked</span>':'<span class="sn-chip'+(b==="later"?"":" warn")+'">🎟 book by '+fmtShort(it.bookBy)+(b==="late"?" — late":"")+'</span>');}
function extraChips(it){   // on an idea's row: what it still needs
  const S=ideaLines(it,"sup").filter(L=>{const x=supState(L);return x==="need"||x==="was";}).length,T=ideaLines(it,"todo").filter(L=>!tdDone(L)),late=T.some(L=>{const x=tdState(L);return x==="late"||x==="due";});
  const F=ideaLines(it,"food").length;   // SEASONFOOD: only when it has food — an idea with none looks as before
  const E=eatTxt(it);   // BIGMEAL: an idea with an eat time is a big meal — a chip; one with none looks as before
  return (S?'<span class="sn-chip">🧺 '+S+' to get</span>':"")+(F?'<span class="sn-chip">🍿 '+F+' food</span>':"")+(E?'<span class="sn-chip">⏱ eat '+E+'</span>':"")+(T.length?'<span class="sn-chip'+(late?" warn":"")+'">✅ '+T.length+' to do</span>':"")+bookChip(it);
}
// One supply line: ☐ have it · its name (tap to change) · 🛒 To the list. The "already on the list / in the pantry" say-so comes first.
function supRow(L){
  const st=supState(L),a="'"+esc(L.sid)+"','"+esc(L.iid)+"','"+esc(L.id)+"'",ask=(snAsk&&snAsk.key===L.sid+"/"+L.iid+"/"+L.id)?snAsk:null;
  let h='<div class="sn-ln'+(st==="have"?" dim":"")+'"><button class="sn-tick'+(st==="have"?" on":"")+'" onclick="snSupHave('+a+')">'+(st==="have"?"☑":"☐")+'</button>'
    +'<button class="sn-lt" onclick="snLine(\'sup\',\''+esc(L.iid)+'\',\''+esc(L.id)+'\')">'+esc(L.r.name)+(+L.r.qty>0?' <b>× '+(+L.r.qty)+'</b>':"")
    +'<small>'+(st==="have"?"have it":(st==="list"?"🛒 on the Shopping List":(st==="was"?"was on the Shopping List — got it? tick the box":"")))+'</small></button>';
  if(st==="need"||st==="was")h+='<button class="sn-tool" onclick="snSupList('+a+')">🛒 '+(st==="was"?"Again":"To the list")+'</button>';
  h+='</div>';
  if(ask)h+='<div class="sn-ask"><span>'+(ask.why==="on"?"“"+esc(L.r.name)+"” is already on the Shopping List.":"You may already have it ("+esc(ask.txt)+").")+'</span>'
    +(ask.dup?'<button class="sn-tool" onclick="snSupSame('+a+')">✓ It’s the same one</button>':"")+(ask.why==="have"?'<button class="sn-tool" onclick="snSupHave('+a+')">☑ Have it</button>':"")
    +'<button class="sn-tool" onclick="snSupList('+a+',1)">🛒 Add anyway</button><button class="sn-tool" onclick="snAskNo()">Leave it</button></div>';
  return h;
}
function beforeTxt(n){n=Math.floor(+n);return n===0?"on its day":n+" day"+(n===1?"":"s")+" before";}
function dueTxt(L){
  const r=L.r,d=tdDue(L),rel=!!(L.it&&r.before!=null&&!isIso(r.due));
  if(!d)return rel?beforeTxt(r.before)+" — no day yet":"";
  const n=daysTo(today(),d);return (n===0?"today":(n===1?"tomorrow":fmtDay(d)))+(rel?" ("+beforeTxt(r.before)+")":"");
}
// One to-do line: ☐ done · its words (tap to change) · who · when · → My list today
function todoRow(L,showFor){
  const st=tdState(L),a="'"+esc(L.sid)+"','"+esc(L.iid)+"','"+esc(L.id)+"'",w=who(L.r.who||"mom"),due=dueTxt(L),s=season(L.sid)||{};
  const bits=[esc(w.name)];if(due)bits.push((st==="late"?"overdue · ":"")+esc(due));
  if(showFor)bits.push(L.it?esc((L.it.emoji?L.it.emoji+" ":"")+(L.it.t||""))+(hideOf(L.it)?" 🤫":""):"all of "+esc(s.name||""));
  const dn=dadNote(L),toDad=dn&&!(L.it&&hideOf(L.it));   // SEASONJOBS: a Dad to-do goes on HIS list by itself — no "→ My list today"
  let h='<div class="sn-ln'+(st==="done"?" dim":"")+(st==="late"?" late":"")+(dn&&!toDad?" wrap":"")+'"><button class="sn-tick'+(st==="done"?" on":"")+'" onclick="snTodoTick('+a+')">'+(st==="done"?"☑":"☐")+'</button>'
    +'<button class="sn-lt" onclick="snLine(\'todo\',\''+esc(L.iid)+'\',\''+esc(L.id)+'\')">'+esc(L.r.t)+'<small>'+bits.join(" · ")+'</small></button>';
  if(st!=="done"&&!toDad)h+=tdCopy(L)?'<span class="sn-chip">✓ on your list</span>':'<button class="sn-tool" onclick="snTodoMine('+a+')">→ My list today</button>';
  return h+dn+'</div>';
}
function supSort(A){return A.slice().sort((a,b)=>(supState(a)==="have")-(supState(b)==="have"));}
function todoSort(A){const rank={late:0,due:1,open:2,done:3};return A.map(L=>({L,st:tdState(L),d:tdDue(L)})).sort((a,b)=>rank[a.st]-rank[b.st]||String(a.d||"9999").localeCompare(String(b.d||"9999")));}
function sendAllBtn(sid,iid,A){const n=A.filter(L=>supState(L)==="need").length;return n>1?'<button class="sn-tool" onclick="snSupAll(\''+esc(sid)+'\',\''+esc(iid)+'\')">🛒 Send all '+n+'</button>':"";}
function viewsHTML(s){
  const S=lines(s.id,"sup").filter(L=>!parked(L)),T=lines(s.id,"todo").filter(L=>!parked(L));
  const need=S.filter(L=>{const x=supState(L);return x==="need"||x==="was";}).length,open=T.filter(L=>!tdDone(L)).length,late=T.filter(L=>tdState(L)==="late").length;
  const nf=lines(s.id,"food").filter(L=>!parked(L)).length;
  const V=[["ideas","💡 Ideas",""],["sup","🧺 Supplies",need?need+" to get":""],["food","🍿 Food",nf?nf+"":""],["todo","✅ To-dos",open?open+" open"+(late?" · "+late+" overdue":""):""]];
  return '<div class="sn-views">'+V.map(v=>'<button class="sn-v'+(snView===v[0]?" on":"")+(v[0]==="todo"&&late?" late":"")+'" onclick="snViewSet(\''+v[0]+'\')">'+v[1]+(v[2]?'<small>'+v[2]+'</small>':"")+'</button>').join("")+'</div>';
}
// 🧺 Supplies: each idea's lines, soonest day first, then "Not scheduled yet", then the ones for the whole season.
function supViewHTML(s){
  const all=lines(s.id,"sup").filter(L=>!parked(L)),own=all.filter(L=>!L.iid),by={};
  all.filter(L=>L.iid).forEach(L=>{(by[L.iid]=by[L.iid]||{it:L.it,L:[]}).L.push(L);});
  const G=Object.keys(by).map(k=>Object.assign(by[k],{day:ideaDay(by[k].it)})).sort((a,b)=>String(a.day||"9999").localeCompare(String(b.day||"9999"))||(a.it.ts||0)-(b.it.ts||0));
  let h='<div class="sn-sub">What each idea needs. <b>🛒 To the list</b> puts one line on the Shopping List. Nothing goes there by itself.</div>',none=false;
  G.forEach(g=>{
    if(!g.day&&!none){none=true;h+='<div class="sn-gh2">Not scheduled yet</div>';}
    h+='<div class="sn-grp"><div class="sn-gh"><button class="sn-gt" onclick="snOpenIdea(\''+esc(g.it.id)+'\')">'+(g.day?"For "+fmtDay(g.day)+" — ":"")+esc(g.it.emoji||"")+' <b>'+esc(g.it.t||"")+'</b> '+hideChip(g.it)+'</button>'
      +sendAllBtn(s.id,g.it.id,g.L)+'</div>'+supSort(g.L).map(supRow).join("")+'</div>';
  });
  h+='<div class="sn-gh2">For all of '+esc(s.name||"it")+'</div><div class="sn-grp">'+(own.length?'<div class="sn-gh"><span class="sn-gt"></span>'+sendAllBtn(s.id,"",own)+'</div>':"")
    +supSort(own).map(supRow).join("")+'<div class="sn-acts"><button class="sn-tool" onclick="snLine(\'sup\',\'\',\'\')">＋ Add supplies</button></div></div>';
  if(!G.length)h+='<div class="sn-empty">To add what one idea needs, open the idea in 💡 Ideas.</div>';
  return h;
}
// ✅ To-dos: overdue on top, then soonest first, then the ones with no day yet, then done.
function todoViewHTML(s){
  const A=todoSort(lines(s.id,"todo").filter(L=>!parked(L))),name={late:"Overdue",due:"Today",soon:"Coming up",none:"No day yet",done:"Done"};
  let h='<div class="sn-acts" style="margin:0 0 4px"><button class="sn-go" onclick="snLine(\'todo\',\'\',\'\')">＋ Add a to-do</button></div>'
    +'<div class="sn-sub">This adds one for all of '+esc(s.name||"it")+'. For one idea, open the idea in 💡 Ideas.</div>',last="";
  if(!A.length)return h+'<div class="sn-empty">No to-dos yet.</div>';
  A.forEach(x=>{const g=x.st==="open"?(x.d?"soon":"none"):x.st;
    if(g!==last){h+=(last?'</div>':"")+'<div class="sn-gh2'+(g==="late"?" late":"")+'">'+name[g]+'</div><div class="sn-grp">';last=g;}
    h+=todoRow(x.L,true);});
  return h+'</div>';
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
  if(!s.closed&&kidPageOk())h+='<div class="sn-kids'+(s.kids?" on":"")+'"><span>'+(s.kids?"🧒 <b>Open to the kids.</b> They see it in Kids’ Corner ▸ ✨ Our plans, add ideas, ✋ and ⭐. Surprises never show there.":"🧒 Only you see this list.")+'</span>'
    +'<button class="sn-tool" onclick="snKids()">'+(s.kids?"Close it to the kids":"Open it to the kids")+'</button></div>';
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
  if(snLoaded)syncSoon();
  let h=snAh+'<div class="sn-wrap" id="sn-page"><div class="sn-title">🎉 Seasons &amp; Events</div>';
  if(!snLoaded)h+='<div class="sn-empty" style="padding:30px">Opening…</div>';
  else{
    const S=seasons(),sid=curSid(),s=sid?season(sid):null;
    if(!S.length)h+=startHTML();
    else{h+=barHTML(S,sid);if(s)h+=headHTML(s)+viewsHTML(s)+(snView==="sup"?supViewHTML(s):snView==="food"?foodViewHTML(s):(snView==="todo"?todoViewHTML(s):(s.closed?"":addHTML())+listHTML(s)));}
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
  let h='<div class="sn-h2">'+esc(f.emoji||"")+" "+esc(f.t||"Idea")+'</div>'+(it&&byChip(it)?'<div class="sn-sub">'+byChip(it)+' — added in Kids’ Corner.</div>':"")+'<div class="sn-form">'+field("t","What","Gingerbread houses","","wide")+field("emoji","Picture","🎄")+'</div>';
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
    if(W.length>1)h+='<div class="sn-acts"><button class="sn-tool sn-del" onclick="snUnschedAll(\''+id+'\')">'+(snEdit.askOff?"Tap again to take all "+W.length+" off":"✕ Take all "+W.length+" days off")+'</button></div>';   // SEASONREPEAT
    h+='<div class="sn-acts">'+(st==="skip"?"":'<button class="sn-go" onclick="snSched(\''+id+'\')">'+(W.length?"＋ Another day":"📅 Schedule")+'</button>')
      +(st==="done"?'<button class="sn-tool" onclick="snUndid(\''+id+'\')">↩ Not done after all</button>':(st==="skip"?"":'<button class="sn-tool" onclick="snDid(\''+id+'\')">✓ We did it</button>'))
      +(st==="skip"?'<button class="sn-tool" onclick="snUnskip(\''+id+'\')">↩ Bring it back</button>':(st==="done"?"":'<button class="sn-tool" onclick="snSkip(\''+id+'\')">🌙 Not this year</button>'))+'</div>';
    // slice 2: 🎟 book by · 🧺 supplies · ✅ to-dos
    const SU=supSort(ideaLines(it,"sup")),TD=todoSort(ideaLines(it,"todo")).map(x=>x.L);
    h+='<div class="sn-lab">🎟 Book by <small>— tickets, a table, a sitter (optional)</small></div><div class="sn-form">'+field("bookBy","Book it by","","date")
      +'<label class="sn-check"><input type="checkbox"'+(f.booked?" checked":"")+' onchange="snSet(\'booked\',this.checked)"> Booked</label></div>';
    h+='<div class="sn-lab">🧺 Supplies</div>'+(hideOf(it)&&SU.length?'<div class="sn-sub">🤫 On the Shopping List these say only “'+esc(shopLabel(sid,it))+'”, never this idea’s name. The thing’s own name does show there.</div>':"")
      +SU.map(supRow).join("")+'<div class="sn-acts"><button class="sn-tool" onclick="snLine(\'sup\',\''+id+'\',\'\')">＋ Add supplies</button>'+sendAllBtn(sid,it.id,SU)+'</div>';
    h+='<div class="sn-lab">🍿 Food</div>'+ideaLines(it,"food").sort(foodSort).map(L=>foodRow(L,false)).join("")+'<div class="sn-acts"><button class="sn-tool" onclick="snLine(\'food\',\''+id+'\',\'\')">＋ Add food</button><button class="sn-tool" onclick="snMeal(\''+id+'\')">⏱ Cooking timeline</button></div>';   // SEASONFOOD · BIGMEAL: the meal's own page (bigmeal.js)
    h+='<div class="sn-lab">✅ To-dos</div>'+TD.map(L=>todoRow(L,false)).join("")+'<div class="sn-acts"><button class="sn-tool" onclick="snLine(\'todo\',\''+id+'\',\'\')">＋ Add a to-do</button></div>';
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
    :(h0==="none"?"🤐 Nothing goes on the family calendar. Only you see the day, here.":((!mv&&e.mode&&e.mode!=="one")?"Each day goes on the family calendar for everyone.":"Tap a day. It goes on the family calendar for everyone.")))+'</div>';
  h+='<div class="sn-form">'+field("time","Time (optional)","2:00 PM")+holdRows(e,h0);
  if(h0!=="none")h+='<label class="sn-fl"><span>For</span><select onchange="snSet(\'who\',this.value)"><option value="family"'+(e.form.who==="family"?" selected":"")+'>The whole family</option>'
    +roster().map(k=>'<option value="'+esc(k.id)+'"'+(e.form.who===k.id?" selected":"")+'>'+esc(k.name)+'</option>').join("")+'</select></label>';
  h+='</div>';
  const mode=mv?"one":(e.mode||"one"),had=nightsOf(it),t=today(),foot='<div class="sn-acts sn-foot"><button class="sn-tool" onclick="snCancel()">Cancel</button></div>';
  // SEASONREPEAT: one day (as before) · the same weekday for some weeks · several days picked by hand. Moving is always one day.
  if(!mv)h+='<div class="sn-chips sn-modes">'+SN_MODES.map(m=>'<button class="sn-f'+(mode===m[0]?" on":"")+'" onclick="snMode(\''+m[0]+'\')">'+m[1]+'</button>').join("")+'</div>';
  if(mode==="week"){
    const f=e.form,n=f.n,D=weekDates(R.from,f.dow,n),add=D.filter(d=>!had[d]);
    h+='<div class="sn-lab">Which day</div><div class="sn-chips">'+DOW.map((x,i)=>'<button class="sn-f'+(f.dow===i?" on":"")+'" onclick="snDow('+i+')">'+x+'</button>').join("")+'</div>'
      +'<div class="sn-lab">How many weeks</div><div class="sn-chips sn-n"><button class="sn-f" onclick="snWeeks(-1)"'+(n<=SN_WEEKS_MIN?" disabled":"")+'>−</button><b>'+n+'</b><button class="sn-f" onclick="snWeeks(1)"'+(n>=SN_WEEKS_MAX?" disabled":"")+'>＋</button></div>'
      +'<div class="sn-sub">The next '+n+' '+SN_DOWL[f.dow]+'s, starting '+fmtDay(D[0])+'. Each one goes on as its own day.</div><div class="sn-daylist">'
      +D.map(d=>dayRow(d,dayInfo(d,own),had[d]?" had":"","",had[d]?"already on — skipped":(s&&isIso(s.end)&&d>s.end?"after the season ends":""))).join("")+'</div>'
      +'<div class="sn-acts"><button class="sn-go" onclick="snPutWeeks()"'+(add.length?"":" disabled")+'>📅 Put '+add.length+' on</button></div>'+foot;
    return h+(e.msg?'<div class="sn-msg">'+esc(e.msg)+'</div>':"");
  }
  const pick=mode==="pick",S=pick?keys(e.form.sel).filter(d=>!had[d]&&d>=t).sort():[];
  h+='<div class="sn-chips"><button class="sn-f'+(e.openOnly?"":" on")+'" onclick="snDaysOpen(false)">All days</button><button class="sn-f'+(e.openOnly?" on":"")+'" onclick="snDaysOpen(true)">Open days only</button></div>';
  if(pick)h+='<div class="sn-sub">Tap the days you want (up to '+SN_PICK_MAX+'), then add them all at once.'+(S.length?' Picked: '+S.map(fmtShort).join(", ")+'.':"")+'</div>'
    +'<div class="sn-acts"><button class="sn-go" onclick="snPutPicked()"'+(S.length?"":" disabled")+'>📅 Add '+S.length+' day'+(S.length===1?"":"s")+'</button></div>';
  h+='<div class="sn-daylist">';
  let d=R.from,i=0,shown=0;
  while(d<=R.to&&i++<200){
    const x=dayInfo(d,own),cur=mv&&mv.d===d;
    if(!e.openOnly||x.open){shown++;
      h+=!pick?dayRow(d,x,cur?" cur":"","snPickDay"):(had[d]?dayRow(d,x," had","","already on"):dayRow(d,x,e.form.sel[d]?" pick":"","snPickToggle",e.form.sel[d]?"✓ picked":""));}
    d=addDays(d,1);
  }
  if(!shown)h+='<div class="sn-empty">No open days in these dates.</div>';
  h+='</div><div class="sn-acts"><button class="sn-tool" onclick="snDaysMore()">Show 4 more weeks</button></div>'
    +'<div class="sn-form">'+field("any","Or any other day","","date")+'<div class="sn-fl"><span>&nbsp;</span><button class="sn-tool" onclick="snPickAny()">'+(pick?"Pick it":"Put it there")+'</button></div></div>'
    +foot;
  return h+(e.msg?'<div class="sn-msg">'+esc(e.msg)+'</div>':"");
}
// One day in the Schedule pop-up, with what is already on it — so she sees busy days before she adds. fn "" = not tappable.
function dayRow(d,x,cls,fn,note){
  const bits=x.events.map(v=>esc(v.emoji)+" "+esc(v.title)+(v.real?" ("+esc(v.real)+")":"")+(v.time?" "+esc(v.time):"")).concat(x.secret.map(v=>"🤐 "+esc(v.t)+(v.time?" "+esc(v.time):""))).concat(x.coops.map(c=>"🏫 "+esc(c)));
  const T=fn?"button":"div";
  return '<'+T+' class="sn-day'+(x.open?" open":"")+cls+'"'+(fn?' onclick="'+fn+'(\''+d+'\')"':"")+'><b>'+fmtDay(d)+(d===today()?" · today":"")+(note?" · "+note:"")+'</b>'
    +'<span>'+(x.open?"nothing on":bits.join(" · "))+(x.breaks.length?' <i>'+esc(x.breaks.join(", "))+'</i>':"")+(x.n>=2?' <em>already '+x.n+' things</em>':"")+'</span></'+T+'>';
}
// The pop-up for ONE supply or to-do line (new or a change), for an idea or for the whole season.
function lineSheet(){
  const e=snEdit,f=e.form,it=e.iid?idea(e.sid,e.iid):null,s=season(e.sid)||{},isNew=!e.id;
  const whose='<div class="sn-sub">For '+(it?esc((it.emoji?it.emoji+" ":"")+(it.t||"")):"all of "+esc(s.name||"it"))+'.</div>';
  let h;
  if(e.kind==="food")h=foodSheet(e,f,it,whose,isNew);
  else if(e.kind==="sup"){
    h='<div class="sn-h2">🧺 '+(isNew?"Add supplies":"Supply")+'</div>'+whose+'<div class="sn-form">'
      +(isNew?field("name","What do you need?","4 gingerbread kits, frosting, gumdrops","","wide"):field("name","What","","","wide")+field("qty","How many (optional)","","number"))+'</div>'
      +(isNew?'<div class="sn-sub">Commas make more than one line. A number in front is how many.</div>':"");
  }else{
    const day=it?firstDay(it):"",many=it?whens(it).length>1:false;
    h='<div class="sn-h2">✅ To-do</div>'+whose+'<div class="sn-form">'+field("t","What needs doing","Print the scavenger hunt","","wide")+'</div>'
      +'<div class="sn-lab">Who</div><div class="sn-chips">'+people().map(p=>'<button class="sn-pchip'+(f.who===p.id?" on":"")+'" style="--c:'+esc(p.color)+'" onclick="snLineWho(\''+esc(p.id)+'\')">'+esc(p.name)+'</button>').join("")+'</div>'
      +'<div class="sn-form">'+field("due","When — a date (optional)","","date")+(it?field("before","…or days before its day","3","number"):"")+'</div>'
      +(it?'<div class="sn-sub">“Days before” moves by itself when the idea moves. '+(many?"It’s on more than one day, so this counts back from the first one, "+fmtDay(day)+". The to-do happens once, not every time.":(day?"Its day is "+fmtDay(day)+" right now.":"It has no day yet, so the to-do waits for one."))+'</div>':"")
      +((kidPageOk()&&isKidId(f.who))?((it&&hideOf(it))?'<div class="sn-sub">🤫 This idea is a surprise, so its to-dos stay on this page. They never go to a kid.</div>'
        :'<div class="sn-form">'+field("ahead","Show it to "+esc(who(f.who).name)+" early — days ahead","0","number")+field("stars","⭐ for doing it (optional)","0","number")+'</div><div class="sn-sub">'+esc(who(f.who).name)+' sees it in Kids’ Corner ▸ ✨ Our plans ▸ Your jobs, on the day it’s due (or this many days ahead), and ticks it there. Stars pay only if you put a number here — on the tick, the same way a chore pays.</div>'):"")
      +(f.who==="dad"?((it&&hideOf(it))?'<div class="sn-sub">🤫 This idea is a surprise, so its to-dos stay on this page. They never go to Dad’s list.</div>'
        :'<div class="sn-form">'+field("ahead","Show it on Dad’s list early — days ahead","0","number")+'</div><div class="sn-sub">Dad’s to-dos go on his own list by themselves, on the day they’re due (or this many days ahead). When he ticks it, it’s ticked here too.</div>'):"");
  }
  h+='<div class="sn-acts sn-foot"><button class="sn-tool sn-save" onclick="snSave()">'+(isNew?"Add":"Save")+'</button><button class="sn-tool" onclick="snCancel()">Cancel</button>'
    +(isNew?"":'<button class="sn-tool sn-del" onclick="snLineDel()">'+(e.ask?"Tap again to delete":"Delete")+'</button>')+'</div>';
  return h+(e.msg?'<div class="sn-msg">'+esc(e.msg)+'</div>':"");
}
function sheetHTML(){
  if(!snEdit)return "";
  const inner=snEdit.type==="season"?seasonSheet():snEdit.type==="menu"?menuSheet():(snEdit.type==="sched"?schedSheet():(snEdit.type==="line"?lineSheet():ideaSheet()));
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
    let sid=slug(name),n=2;const L=snData.list||{};while(L[sid]||snSecret[sid]||(snData.ideas||{})[sid]||(snData.extra||{})[sid])sid=slug(name)+"-"+(n++);
    const rec={name,emoji,kind:f.kind||"season",ts:Date.now()};if(start)rec.start=start;if(end)rec.end=end;
    up["seasons/list/"+sid]=rec;apply(up);snSid=sid;try{HA_LS.setItem("ha_sn_sid",sid);}catch(e){}
    snEdit=null;snFilter="all";snFocus=true;toast("Started "+emoji+" "+name);draw();return;
  }
  const s=season(snEdit.id)||{},b="seasons/list/"+snEdit.id+"/";
  if(name!==s.name)up[b+"name"]=name;if(emoji!==(s.emoji||""))up[b+"emoji"]=emoji;
  if(start!==(s.start||""))up[b+"start"]=start||null;if(end!==(s.end||""))up[b+"end"]=end||null;
  if(!!f.closed!==!!s.closed)up[b+"closed"]=f.closed?true:null;
  const sidNow=snEdit.id,renamed=name!==s.name||emoji!==(s.emoji||"");
  apply(up);if(renamed)relabelSeason(sidNow);   // SEASONRELABEL: rows already on the Shopping List follow the season's new name
  snEdit=null;draw();
}
function snDelSeason(){
  if(!snEdit||snEdit.type!=="season"||!snEdit.id)return;
  if(ideasOf(snEdit.id).length){snEdit.msg="It still has ideas on it. Move it to 📜 Past instead.";draw();return;}
  if(!snEdit.ask){snEdit.ask=true;draw();return;}
  const up={};up["seasons/list/"+snEdit.id]=null;if((snData.extra||{})[snEdit.id])up["seasons/extra/"+snEdit.id]=null;apply(up);snEdit=null;snSid=null;draw();
}
function snKids(){   // slice 3: ONE field — is this season open to the kids? (off until she taps)
  const s=season(curSid());if(!s||s.closed||!kidPageOk())return;const up={};up["seasons/list/"+s.id+"/kids"]=s.kids?null:true;apply(up);
  toast(s.kids?"🧒 Closed to the kids":"🧒 The kids can see it now — never the surprises");draw();
}
function snPick(sid){snSid=sid;try{HA_LS.setItem("ha_sn_sid",sid);}catch(e){}snFilter="all";snAsk=null;draw();}
function snViewSet(v){snView=(v==="sup"||v==="todo"||v==="food")?v:"ideas";snAsk=null;draw();}
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
  snEdit={type:"idea",sid,id:iid,form:{t:it.t||"",emoji:it.emoji||"",want:clone(it.want)||{},star:clone(it.star)||{},size:it.size||"",note:it.note||"",hide:hideOf(it),bookBy:it.bookBy||"",booked:!!it.booked}};draw();
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
  const liveEv=keys(old.ev).filter(id=>E[id]),t0=old.t,bookBy=isIso(f.bookBy)?f.bookBy:"",booked=!!(bookBy&&f.booked);
  if(h0===h1){
    const b=base(sid,iid,h0)+"/";
    if(t!==old.t)up[b+"t"]=t;if(emoji!==(old.emoji||""))up[b+"emoji"]=emoji||null;if(note!==(old.note||""))up[b+"note"]=note||null;
    if(size!==(old.size||""))up[b+"size"]=size||null;
    if(bookBy!==(old.bookBy||""))up[b+"bookBy"]=bookBy||null;if(booked!==!!old.booked)up[b+"booked"]=booked?true:null;
    if(!sameMap(want,old.want))up[b+"want"]=keys(want).length?want:null;if(!sameMap(star,old.star))up[b+"star"]=keys(star).length?star:null;
    if(h0===""&&(t!==old.t||emoji!==(old.emoji||"")))liveEv.forEach(id=>{up["calendar/events/"+id+"/title"]=t.slice(0,60);up["calendar/events/"+id+"/emoji"]=emoji||"🎉";});
  }else{
    const rec=clone(old);rec.t=t;
    [["emoji",emoji],["note",note],["size",size],["bookBy",bookBy],["booked",booked]].forEach(p=>{if(p[1])rec[p[0]]=p[1];else delete rec[p[0]];});
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
  apply(up);
  if(t!==t0||h0!==h1){const now=idea(sid,iid);if(now)relabel(now);}   // rows it already sent to the Shopping List follow its name and its 🤫 switch
  return true;
}
function snSave(){if(!snEdit)return;if(snEdit.type==="season"){saveSeason();return;}if(snEdit.type==="line"){saveLine();return;}if(snEdit.type!=="idea")return;if(saveIdea()){snEdit=null;draw();}}
function flush(iid){return !(snEdit&&snEdit.type==="idea"&&snEdit.id===iid)||saveIdea();}   // a button inside the idea pop-up keeps what she typed first
function snCancel(){if(snEdit&&(snEdit.type==="line"||snEdit.type==="menu")){lineClose();return;}snEdit=null;snAsk=null;draw();}
function snDelIdea(){
  if(!snEdit||snEdit.type!=="idea")return;
  if(!snEdit.ask){snEdit.ask=true;draw();return;}
  const sid=snEdit.sid,iid=snEdit.id,it=idea(sid,iid),up={};if(!it){snEdit=null;draw();return;}
  keys(it.ev).forEach(id=>{if(evs()[id])up["calendar/events/"+id]=null;});
  up[base(sid,iid,hideOf(it))]=null;apply(up);snEdit=null;toast("Removed "+(it.t||"the idea"));stillOn(ideaLines(it,"food"));draw();
}

// ── 📅 Schedule ──────────────────────────────────────────────────────────────
function snSched(iid,moveId){
  const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;
  const mv=moveId?whens(it).find(w=>w.id===moveId):null,E=evs(),mr=(mv&&mv.k==="ev")?E[mv.id]:null;
  const dow=dOf(ideaDay(it)||schedRange(season(sid),0).from).getUTCDay();   // "every week" starts on its own weekday, else today's
  snEdit={type:"sched",sid,id:iid,move:mv?mv.id:null,mode:"one",openOnly:false,more:0,form:{time:mv?mv.time:"",who:(mr&&mr.who)||"family",any:"",dow,n:4,sel:{},
    end:holdEndOf(mr),hold:!!(mr&&holdOk()&&evHeld(mr))}};draw();
}
// ── SEASONHOLD (her "Yes, add it" 2026-11-23): ⏰ an Ends box + "Hold this time" on the 📅 Schedule pop-up — the calendar form's
// own rule (index.html EVHOLD: evHoldFormRow / evHoldTick / evHoldEntry), same words. Mom's lens only (momHere), never for a 🤐
// (no event, nothing to hold). An old index.html without the ev* helpers → no boxes, and a ↪ Move leaves mins/hold as they were.
const SN_HOLD_WHY="To hold the time, give a start and an end like 2:30 PM and 4:00 PM.";
function holdOk(){return typeof evHoldMins==="function"&&typeof evHeld==="function"&&typeof momHere==="function"&&!!momHere();}
function schedEnd(e){return String(e.form.end||"").trim().slice(0,12);}
function holdLen(e){return holdOk()?evHoldMins(schedTime(e),schedEnd(e)):null;}
function holdEndOf(r){   // a ↪ Move's Ends box: start + mins, as the calendar form shows it
  if(!r||!holdOk()||typeof evMin!=="function"||typeof fromMin!=="function")return "";
  const s=evMin(r.time),n=+r.mins;return (s!=null&&n>0&&s+n<=1440)?fromMin(s+n):"";
}
// what the pop-up adds to an event: {} · {mins} · {mins, hold:true}. null = ⏰ ticked without a readable length → say why, save nothing.
function holdBits(e,h){
  if(h==="none"||!holdOk())return {};
  const n=holdLen(e);if(e.form.hold&&n==null)return null;
  const x={};if(n!=null){x.mins=n;if(e.form.hold)x.hold=true;}return x;
}
function holdNo(e){e.msg=SN_HOLD_WHY;e.holdWhy=true;draw();}
function holdRows(e,h){
  if(h==="none"||!holdOk())return "";
  return field("end","Ends (optional)","4:00 PM")
    +'<label class="sn-hold"><input type="checkbox"'+(e.form.hold?" checked":"")+' onchange="snHold(this)"> ⏰ Hold this time — school is planned around it</label>'
    +'<div class="sn-sub sn-holdwhy'+(e.holdWhy?" no":"")+'">'+SN_HOLD_WHY+'</div>';
}
function snHold(el){   // as evHoldTick: ticking it without a readable start + end un-ticks it, and the line under it turns red
  const e=snEdit;if(!e||e.type!=="sched"||!el)return;
  if(!el.checked){e.form.hold=false;return;}
  if(holdLen(e)!=null){e.form.hold=true;if(e.holdWhy){e.holdWhy=false;draw();}return;}
  el.checked=false;e.form.hold=false;e.holdWhy=true;draw();
}
function snDaysOpen(v){if(!snEdit||snEdit.type!=="sched")return;snEdit.openOnly=!!v;draw();}
function snDaysMore(){if(!snEdit||snEdit.type!=="sched")return;snEdit.more=(snEdit.more||0)+1;draw();}
function snPickAny(){if(!snEdit||snEdit.type!=="sched")return;const d=snEdit.form.any;if(!isIso(d)){snEdit.msg="Pick a date first.";draw();return;}if(snEdit.mode==="pick"&&!snEdit.move){snPickToggle(d);return;}snPickDay(d);}
// ── SEASONREPEAT (slice 7): one idea on several days ──
function schedMany(){return !!(snEdit&&snEdit.type==="sched"&&!snEdit.move);}
function snMode(m){if(!schedMany())return;snEdit.mode=(m==="week"||m==="pick")?m:"one";snEdit.msg="";draw();}
function snDow(i){if(!schedMany())return;i=Math.floor(+i);if(i>=0&&i<7)snEdit.form.dow=i;draw();}
function snWeeks(dn){if(!schedMany())return;const f=snEdit.form;f.n=Math.max(SN_WEEKS_MIN,Math.min(SN_WEEKS_MAX,(Math.floor(+f.n)||4)+(Math.sign(+dn)||0)));draw();}
function snPickToggle(d){
  if(!schedMany()||!isIso(d))return;const e=snEdit,S=e.form.sel,it=idea(e.sid,e.id);e.msg="";
  if(S[d])delete S[d];
  else if(d<today())e.msg="That day has gone by.";
  else if(it&&nightsOf(it)[d])e.msg="It’s already on that day.";
  else if(keys(S).length>=SN_PICK_MAX)e.msg="That’s "+SN_PICK_MAX+". Add these first, then pick more.";
  else S[d]=true;
  draw();
}
function snPutWeeks(){if(!schedMany())return 0;const e=snEdit;return putNights(weekDates(schedRange(season(e.sid),0).from,e.form.dow,e.form.n));}
function snPutPicked(){if(!schedMany())return 0;return putNights(keys(snEdit.form.sel));}
// Several days at once: each is its OWN ordinary calendar event (the same record one tap makes; a ✨ hint's says only "A surprise"),
// or for 🤐 its own date kept here — all in ONE update. A day it is already on is skipped, never doubled; a day gone by is never added.
function putNights(D){
  const e=snEdit,it=idea(e.sid,e.id);if(!it){snEdit=null;draw();return 0;}
  const h=hideOf(it),b=base(e.sid,e.id,h),have=nightsOf(it),t=today(),up={},got=[],hb=holdBits(e,h);let skip=0;
  if(hb===null){holdNo(e);return 0;}   // ⏰ ticked but no readable length: say why, save nothing
  D.slice().sort().forEach(d=>{if(!isIso(d)||d<t)return;if(have[d]){skip++;return;}if(got.length>=SN_PICK_MAX)return;have[d]=true;got.push(d);nightPaths(it,h,b,d,schedTime(e),schedWho(e),up,hb);});
  if(!got.length){e.msg=skip?"It’s already on "+(skip===1?"that day.":"those days."):"Pick a day first.";draw();return 0;}
  if(it.skip)up[b+"/skip"]=null;
  apply(up);snEdit=null;toast((h==="none"?"🤐 ":"📅 ")+(it.t||"Idea")+" → "+got.length+" day"+(got.length===1?"":"s")+(skip?" ("+skip+" already on)":""));draw();
  return got.length;
}
function snUnschedAll(iid){   // take every day off at once (one ✕ per day is still on each row)
  if(!snEdit||snEdit.type!=="idea"||snEdit.id!==iid)return;
  if(!snEdit.askOff){snEdit.askOff=true;draw();return;}
  snUnsched(iid);
}
function schedTime(e){return String(e.form.time||"").trim().slice(0,12);}
function schedWho(e){return (e.form.who&&e.form.who!=="family"&&roster().some(k=>k.id===e.form.who))?e.form.who:"family";}
function nightPaths(it,h,b,d,time,forWho,up,hb){   // ONE new day for an idea: a calendar event (+ ⏰ hb {mins?,hold?}) + the idea's link to it, or a 🤐 date
  if(h==="none"){let k;do k=rid("o");while(up[b+"/on/"+k]);const o={d};if(time)o.time=time;up[b+"/on/"+k]=o;}
  else{let id;do id=newEvId(d);while(up["calendar/events/"+id]);up["calendar/events/"+id]=Object.assign(eventFor(it,h,d,time,forWho),hb||{});up[b+"/ev/"+id]=true;}
  return up;
}
// One tap on a day. An idea everyone can see (or a ✨ hint) → ONE family event + the idea's link to it. A 🤐 → its date kept here only.
// Moving = the SAME event gets its new date (the calendar stays the one truth).
function snPickDay(d){
  const e=snEdit;if(!e||e.type!=="sched"||!isIso(d))return;
  const it=idea(e.sid,e.id);if(!it){snEdit=null;draw();return;}
  const h=hideOf(it),b=base(e.sid,e.id,h),time=schedTime(e),forWho=schedWho(e),up={},hb=holdBits(e,h);
  if(hb===null){holdNo(e);return;}   // ⏰ ticked but no readable length: say why, save nothing
  const mv=e.move?whens(it).find(w=>w.id===e.move):null;
  if(mv&&mv.k==="ev"){const p="calendar/events/"+mv.id+"/";up[p+"date"]=d;up[p+"time"]=time;up[p+"who"]=forWho;
    if(holdOk()){up[p+"mins"]=hb.mins||null;up[p+"hold"]=hb.hold?true:null;}}   // ⏰ the new length/switch, or cleared (never false/0)
  else if(mv){const o={d};if(time)o.time=time;up[b+"/on/"+mv.id]=o;}
  else nightPaths(it,h,b,d,time,forWho,up,hb);
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
  const b=base(sid,iid,hideOf(it)),up=offPaths(it,b,null,{});up[b+"/skip"]=true;apply(up);snEdit=null;toast("🌙 Not this year");stillOn(ideaLines(it,"food"));draw();
}
function snUnskip(iid){const sid=curSid();if(!flush(iid))return;const it=idea(sid,iid);if(!it)return;const up={};up[base(sid,iid,hideOf(it))+"/skip"]=null;apply(up);snEdit=null;draw();}

// ── slice 2: supplies · to-dos · book by ─────────────────────────────────────
function atHome(){try{return typeof tab!=="undefined"&&tab==="moms-plan"&&!(typeof momSchedView!=="undefined"&&momSchedView)&&(typeof mpSubView==="undefined"||!mpSubView||mpSubView==="plan");}catch(e){return false;}}
function homeRepaint(){if(!atHome())return;try{const el=document.getElementById("content");if(el&&typeof renderMomsPlan==="function")renderMomsPlan(el);}catch(e){}}
function repaint(){if(onPage())draw();else homeRepaint();}   // these buttons are tapped on this page, or in 🔴 NOW on Home Base
function snLine(kind,iid,lid){   // open the pop-up: lid "" = a new line · iid "" = for the whole season
  const sid=curSid();if(!sid||(kind!=="sup"&&kind!=="todo"&&kind!=="food")||(kind==="food"&&!iid))return;   // SEASONFOOD: food belongs to an idea
  const back=!!(iid&&snEdit&&snEdit.type==="idea"&&snEdit.id===iid);if(back&&!flush(iid))return;
  if(iid&&!idea(sid,iid))return;const L=lid?line(sid,iid,kind,lid):null;if(lid&&!L)return;const r=L?L.r:{};
  snAsk=null;snEdit={type:"line",kind,sid,iid:iid||"",id:lid||null,back,form:kind==="food"?{name:r.name||"",mid:r.mid||""}:kind==="sup"?{name:r.name||"",qty:(+r.qty>0)?String(r.qty):""}
    :{t:r.t||"",who:r.who||"mom",due:isIso(r.due)?r.due:"",before:(r.before!=null&&!isIso(r.due))?String(r.before):"",ahead:ahead(r)?String(ahead(r)):"",stars:jobStars(r)?String(jobStars(r)):""}};draw();
}
function lineClose(){const e=snEdit;snEdit=null;if(e&&e.back&&e.iid&&idea(e.sid,e.iid)){snOpenIdea(e.iid);return;}draw();}
function snLineWho(w){if(!snEdit||snEdit.type!=="line"||snEdit.kind!=="todo")return;snEdit.form.who=w;draw();}
function snFoodMid(v){if(!snEdit||snEdit.type!=="line"||snEdit.kind!=="food")return;const f=snEdit.form,m=recipes()[v];f.mid=m?v:"";if(m&&!String(f.name||"").trim())f.name=String(m.name||"").slice(0,80);snEdit.msg="";draw();}
function saveLine(){
  const e=snEdit,f=e.form,it=e.iid?idea(e.sid,e.iid):null;if(e.iid&&!it){snEdit=null;draw();return;}
  const L=e.id?line(e.sid,e.iid,e.kind,e.id):null;if(e.id&&!L){lineClose();return;}
  const b=(it?base(e.sid,e.iid,hideOf(it)):"seasons/extra/"+e.sid)+"/"+e.kind+"/",up={};
  if(e.kind==="food"){if(!foodSave(e,f,L,b,up))return;}
  else if(e.kind==="sup"){
    if(!L){
      const parts=String(f.name||"").split(/[,\n]/).map(x=>x.trim()).filter(Boolean).slice(0,30);
      if(!parts.length){e.msg="Type what you need first.";draw();return;}
      parts.forEach((p,i)=>{const m=/^(\d{1,3})\s*x?\s+(.+)$/i.exec(p),rec={name:(m?m[2]:p).slice(0,80)};if(m&&+m[1]>0)rec.qty=+m[1];up[b+rid("u")+i]=rec;});
    }else{
      const name=String(f.name||"").trim().slice(0,80),q=Math.max(0,Math.floor(+f.qty)||0);
      if(!name){e.msg="It needs a name.";draw();return;}
      if(name!==L.r.name)up[b+e.id+"/name"]=name;if(q!==(+L.r.qty||0))up[b+e.id+"/qty"]=q>0?q:null;
    }
  }else{
    const t=String(f.t||"").trim().slice(0,120);if(!t){e.msg="It needs a few words.";draw();return;}
    const w=people().some(p=>p.id===f.who)?f.who:"mom",bn=String(f.before==null?"":f.before).trim()===""?null:Math.floor(+f.before);
    const before=(it&&bn!=null&&bn>=0&&bn<=365)?bn:null,due=(before==null&&isIso(f.due))?f.due:"";
    const ah=(w==="dad"||isKidId(w))?ahead({ahead:f.ahead}):0;   // SEASONJOBS: days early on Dad's list / in a kid's jobs (blank = on its day)
    const st=isKidId(w)?jobStars({stars:f.stars}):0;   // step B: ⭐ for a kid's job — 0 unless she sets it
    if(!L){const rec={t,who:w};if(before!=null)rec.before=before;else if(due)rec.due=due;if(ah)rec.ahead=ah;if(st)rec.stars=st;up[b+rid("t")]=rec;}
    else{
      const r=L.r,p=b+e.id+"/";
      if(t!==r.t)up[p+"t"]=t;if(w!==(r.who||"mom"))up[p+"who"]=w;
      if(due!==(isIso(r.due)?r.due:""))up[p+"due"]=due||null;if(before!==(r.before!=null?Math.floor(+r.before):null))up[p+"before"]=before;
      if(ah!==ahead(r))up[p+"ahead"]=ah||null;if(st!==jobStars(r))up[p+"stars"]=st||null;
    }
  }
  apply(up);lineClose();
}
function snLineDel(){
  const e=snEdit;if(!e||e.type!=="line"||!e.id)return;if(!e.ask){e.ask=true;draw();return;}
  const L=line(e.sid,e.iid,e.kind,e.id);if(L){const up={};up[lineBase(L,e.kind)]=null;apply(up);if(e.kind==="food")stillOn([L]);}lineClose();
}
// 🧺 ☐ have it — her own tick (plan §4.6: "First version: you tick 'have it' yourself")
function snSupHave(sid,iid,lid){const L=line(sid,iid,"sup",lid);if(!L)return;const up={};up[lineBase(L,"sup")+"/have"]=L.r.have?null:true;apply(up);snAsk=null;repaint();}
// 🛒 To the list — ONE TAP per line, never by itself (her answer 8). The Shopping List row is made by the Kitchen's own grCreate, with
// a back-link (ref.sn) and a label; here only the row's id is kept on the line. If the list already has it, or the pantry or staples
// say she has it, the line SAYS SO FIRST and nothing is sent until she picks.
function canShop(){
  if(dry()){toast("Dry run — nothing is sent");return false;}
  if(typeof grCreate!=="function"){toast("The Shopping List isn’t ready — try again in a moment");return false;}
  return true;
}
function shopCheck(name){let dup=null,have="";try{if(typeof grFindDup==="function")dup=grFindDup(name)||null;}catch(e){}try{if(typeof grHaveIt==="function")have=grHaveIt(name)||"";}catch(e){}return {dup,have};}
function shopSend(L){
  const p={name:String(L.r.name||"").slice(0,80),ref:{sn:L.sid+"/"+(L.iid||"-")+"/"+L.id}};if(+L.r.qty>0)p.qty=+L.r.qty;
  let gid="";try{gid=grCreate(p,{k:"season",lbl:shopLabel(L.sid,L.it)},null);}catch(e){gid="";}
  if(!gid)return false;const up={};up[lineBase(L,"sup")+"/gr"]=gid;apply(up);return true;
}
function snSupList(sid,iid,lid,force){
  const L=line(sid,iid,"sup",lid);if(!L)return;
  if(supState(L)==="list"){toast("Already on the Shopping List");return;}
  if(!canShop())return;
  if(!force){const c=shopCheck(L.r.name);if(c.dup||c.have){snAsk={key:sid+"/"+(iid||"")+"/"+lid,why:c.dup?"on":"have",txt:c.have,dup:(c.dup&&c.dup.kind==="item"&&c.dup.id)||""};repaint();return;}}
  snAsk=null;if(shopSend(L))toast("🛒 "+L.r.name+" → Shopping List");repaint();
}
function snSupSame(sid,iid,lid){   // "It's the same one": link this line to the row that is already on the list — nothing new is added
  const L=line(sid,iid,"sup",lid),g=snAsk&&snAsk.dup;if(!L||!g||!grItems()[g])return;
  const up={};up[lineBase(L,"sup")+"/gr"]=g;apply(up);snAsk=null;repaint();
}
function snAskNo(){snAsk=null;repaint();}
function snSupAll(sid,iid){   // "send all for this idea": every line still needed — the ones the list or the house may already have are left to ask one by one
  if(!canShop())return;let sent=0,held=0;
  lines(sid,"sup").filter(L=>L.iid===(iid||"")&&supState(L)==="need").forEach(L=>{const c=shopCheck(L.r.name);if(c.dup||c.have){held++;return;}if(shopSend(L))sent++;});
  snAsk=null;toast("🛒 "+sent+" sent to the Shopping List"+(held?" · "+held+" may already be there or in the house — tap those":""));repaint();
}
function relabelLines(Ls){   // these supply lines' OWN rows on the Shopping List get the label they should have now (a row linked with "the same one" is never touched)
  if(dry()||typeof grPut!=="function")return;const G=grItems();
  Ls.forEach(L=>{const g=L.r.gr&&G[L.r.gr],lbl=shopLabel(L.sid,L.it),mine=L.sid+"/"+(L.iid||"-")+"/";
    if(!g||!g.ref||String(g.ref.sn||"").indexOf(mine)!==0||!Array.isArray(g.src)||!g.src.some(x=>x&&x.k==="season"&&x.lbl!==lbl))return;
    const c=clone(g);c.src.forEach(x=>{if(x&&x.k==="season")x.lbl=lbl;});try{grPut(L.r.gr,c);}catch(e){}});
}
function relabel(it){relabelLines(ideaLines(it,"sup"));}   // an idea was renamed or its 🤫 switch changed
// SEASONRELABEL (her "fix this" 2026-11-21): the SEASON was renamed (or its emoji changed) — every row it already sent to the Shopping
// List follows: its ideas' lines and its whole-season lines. A 🤫 idea's rows still carry the season only, never the idea.
function relabelSeason(sid){relabelLines(lines(sid,"sup"));}
// ✅ tick a to-do. If it has a copy on Mom's own list, that copy is ticked in the SAME update (and un-ticked the same way).
function snTodoTick(sid,iid,lid){
  const L=line(sid,iid,"todo",lid);if(!L)return;const on=!tdDone(L),t=today(),up={};
  up[lineBase(L,"todo")+"/done"]=on?t:null;
  if(tdCopy(L)){const m="momday/"+L.r.list+"/todos/sn"+lid+"/";up[m+"done"]=on;up[m+"doneOn"]=on?t:null;}
  if(dadCopy(L)){const m="dadday/"+L.r.dadOn+"/todos/sn"+lid;
    if(on&&L.r.dadOn>t){up[m]=null;up[lineBase(L,"todo")+"/dadOn"]=null;}   // SEASONJOBS fix: not showing yet → off his list (her un-tick lets the sync put it back)
    else{up[m+"/done"]=on;up[m+"/doneOn"]=on?t:null;}}   // showing → crossed off today, gone tomorrow, like anything he ticks
  const j=kidCopy(L);if(j){const k=L.r.jobFor,m="seasonJobs/"+k+"/"+lid;
    if(on&&isIso(j.show)&&j.show>t){up[m]=null;up[lineBase(L,"todo")+"/jobFor"]=null;}   // hub fix: not showing yet → off their jobs, NO pay (her un-tick lets the sync send it again)
    else{const f=jobPay(k,j,on);up[m+"/done"]=on?t:null;if("bid" in f)up[m+"/bid"]=f.bid;}}   // step B: showing → ticked, and pays like a chore
  apply(up);repaint();
}
// → My list today: ONE copy onto Mom's own daily to-do list (her answer 10, Mom's half). The to-do remembers the day (`list`), so it
// can't be copied twice; a 🤫 surprise's copy never carries its words.
function mineText(L){
  if(L.it&&hideOf(L.it))return "🤫 A surprise to-do — see 🎉 Seasons & Events";
  const s=season(L.sid)||{};return String(L.r.t||"").slice(0,120)+" ("+(L.it?((L.it.emoji?L.it.emoji+" ":"")+(L.it.t||"")):((s.emoji||"🎉")+" "+(s.name||""))).trim()+")";
}
function snTodoMine(sid,iid,lid){
  const L=line(sid,iid,"todo",lid);if(!L||tdDone(L))return;
  if(tdCopy(L)){toast("It’s already on your list");return;}
  const t=today(),up={};
  up["momday/"+t+"/todos/sn"+lid]={text:mineText(L),done:false,ts:Date.now(),src:"season",sn:sid+"/"+(iid||"-")+"/"+lid};
  up[lineBase(L,"todo")+"/list"]=t;apply(up);toast("→ On your list today");repaint();
}
function snBooked(sid,iid){const it=idea(sid,iid);if(!it||!isIso(it.bookBy))return;const up={};up[base(sid,iid,hideOf(it))+"/booked"]=it.booked?null:true;apply(up);repaint();}

// ── 🍿 SEASONFOOD slice 4: food → the Kitchen (plan §4.7) ──────────────────────
// Reads the Kitchen's own data (kitMeals, kitPlan / kitPlanRec); writes it ONLY through the Kitchen's own functions.
function recipes(){try{return (typeof kitMeals!=="undefined"&&kitMeals)||{};}catch(e){return {};}}
function kRec(iso){try{if(typeof kitPlanRec==="function")return kitPlanRec(iso)||{};return ((typeof kitPlan!=="undefined"&&kitPlan)||{})[iso]||{};}catch(e){return {};}}
function sidesOf(iso){let p={};try{p=((typeof kitPlan!=="undefined"&&kitPlan)||{})[iso]||{};if(typeof kitSideStart==="function")return kitSideStart(p)||[];}catch(e){}return Array.isArray(p.sideList)?p.sideList:[];}   // the list kitSideRemove counts in
function recipeOf(L){const m=L.r.mid&&recipes()[L.r.mid];return m||null;}
function foodVal(L){return recipeOf(L)?{mid:L.r.mid}:{txt:String(L.r.name||"").slice(0,80)};}   // what goes on the Menu: the recipe, or the words
function foodSort(a,b){return (a.r.ts||0)-(b.r.ts||0)||String(a.r.name).localeCompare(String(b.r.name));}
function mealName(t){const m=SN_MEALS.find(x=>x[0]===t);return m?m[2].toLowerCase():"";}
function sameVal(x,v){if(!x||typeof x!=="object"||!v)return false;if(x.parts&&x.parts.main)x=x.parts.main;
  return v.mid?x.mid===v.mid:(!x.mid&&String(x.txt||"").trim().toLowerCase()===String(v.txt||"").trim().toLowerCase()&&!!String(v.txt||"").trim());}
function slotVal(rec,t){return t==="d"?((rec.mid||rec.txt)?{mid:rec.mid,txt:rec.txt}:null):(rec[t]||null);}
function slotName(rec,t){
  try{if(typeof kitRotRecName==="function"){const n=kitRotRecName(rec,t);if(n)return n;}}catch(e){}
  const v=slotVal(rec,t);if(!v)return "";const m=v.mid&&recipes()[v.mid];return m?(m.name||"a meal"):(v.txt||(v.parts?"a meal":(v.mid?"a meal":"")));
}
// Is this food really on the Menu there now? (v = what was put on; a placement is matched by what it put, so renaming the line
// or changing its recipe later never makes a real Menu entry look gone)
function menuAt(iso,t,side,v){if(side)return sidesOf(iso).some(x=>sameVal(x,v));return sameVal(slotVal(kRec(iso),t),v);}
function placeVal(p){return p&&p.mid?{mid:p.mid}:{txt:p&&p.txt};}
function menuDays(it){const t=today(),o=[];(it?whens(it):[]).forEach(w=>{if(w.d>=t&&o.indexOf(w.d)<0)o.push(w.d);});return o;}   // its days still to come, today counts
function nokit(){toast("The Kitchen isn’t ready — try again in a moment");}
function foodRow(L,showFor){
  const a="'"+esc(L.sid)+"','"+esc(L.iid)+"','"+esc(L.id)+"'",m=recipeOf(L),sec=!!(L.it&&hideOf(L.it)),D=menuDays(L.it),t=today(),mine=L.it?nightsOf(L.it):{};
  const bits=[];if(L.r.mid)bits.push(m?"📖 Kitchen recipe":"📖 recipe gone from the Kitchen — words now");if(sec)bits.push("🤫 stays off the Menu");
  if(showFor&&L.it)bits.push(esc((L.it.emoji?L.it.emoji+" ":"")+(L.it.t||"")));
  let h='<div class="sn-ln wrap"><button class="sn-lt" onclick="snLine(\'food\',\''+esc(L.iid)+'\',\''+esc(L.id)+'\')">'+esc(L.r.name)+(bits.length?'<small>'+bits.join(" · ")+'</small>':"")+'</button>';
  if(m)h+='<button class="sn-tool" onclick="snFoodShop('+a+')">🛒 Ingredients</button>';
  if(!sec)h+=D.length?'<button class="sn-tool" onclick="snMenu('+a+')">🍽 Menu</button>':'<span class="sn-chip">🍽 Menu waits for a day</span>';
  h+='</div>';
  const M=L.r.menu||{};
  Object.keys(M).filter(isIso).sort().forEach(iso=>{const p=M[iso];if(!p||typeof p!=="object")return;
    const on=menuAt(iso,p.s,!!p.side,placeVal(p)),late=iso<t,stray=on&&!late&&!mine[iso],ask=snAsk&&snAsk.key==="off/"+L.id+"/"+iso;
    const txt=!on?"Was on the Menu for "+fmtDay(iso)+" — not there now (changed in the Kitchen)"
      :(late?"Was on the Menu — ":"On the Menu — ")+fmtDay(iso)+", "+mealName(p.s)+(p.side?" (a side)":"")+(stray?" · still there, but it’s not one of this idea’s days now":"");
    const btn=!on?'<button class="sn-tool" onclick="snMenuOff('+a+',\''+iso+'\')">✕ Forget it</button>'
      :(late?"":'<button class="sn-tool" onclick="snMenuOff('+a+',\''+iso+'\')">'+(ask?"Tap again — that dinner’s sides come off too":"✕ Take it off the Menu")+'</button>');
    h+='<div class="sn-mn'+(!on||stray?" old":"")+'"><span>🍽 '+txt+'</span>'+btn+'</div>';});
  return h;
}
// The 🍿 Food view: every food with its day — a holiday menu at a glance.
function foodViewHTML(s){
  const all=lines(s.id,"food").filter(L=>!parked(L)&&L.it),by={};
  all.forEach(L=>{(by[L.iid]=by[L.iid]||{it:L.it,L:[]}).L.push(L);});
  const G=Object.keys(by).map(k=>Object.assign(by[k],{day:ideaDay(by[k].it)})).sort((a,b)=>String(a.day||"9999").localeCompare(String(b.day||"9999"))||(a.it.ts||0)-(b.it.ts||0));
  let h='<div class="sn-sub">Every food with its day. To add food, open an idea in 💡 Ideas. Nothing goes on the Menu or the Shopping List by itself.</div>',none=false;
  G.forEach(g=>{
    if(!g.day&&!none){none=true;h+='<div class="sn-gh2">Not scheduled yet</div>';}
    const more=menuDays(g.it).length-1;
    h+='<div class="sn-grp"><div class="sn-gh"><button class="sn-gt" onclick="snOpenIdea(\''+esc(g.it.id)+'\')">'+(g.day?fmtDay(g.day)+(more>0?" +"+more+" more":"")+" — ":"")+esc(g.it.emoji||"")+' <b>'+esc(g.it.t||"")+'</b> '+hideChip(g.it)+(eatTxt(g.it)?'<span class="sn-chip">⏱ eat '+eatTxt(g.it)+'</span>':"")+'</button><button class="sn-tool" onclick="snMeal(\''+esc(g.it.id)+'\')">⏱ Timeline</button></div>'   // BIGMEAL: ⏱ the meal's page
      +g.L.sort(foodSort).map(L=>foodRow(L,false)).join("")+'</div>';
  });
  if(!G.length)h+='<div class="sn-empty">No food yet. Open an idea in 💡 Ideas and tap ＋ Add food.</div>';
  return h;
}
// The food pop-up: a recipe from the Kitchen, or just words. Never a dead end when the Kitchen has no recipes yet.
function foodSheet(e,f,it,whose,isNew){
  const R=recipes(),ids=Object.keys(R).filter(k=>R[k]&&R[k].name).sort((a,b)=>String(R[a].name).localeCompare(String(R[b].name))),gone=!!(f.mid&&!R[f.mid]);
  let h='<div class="sn-h2">🍿 '+(isNew?"Add food":"Food")+'</div>'+whose;
  if(ids.length)h+='<div class="sn-form"><label class="sn-fl wide"><span>A recipe from the Kitchen (optional)</span><select onchange="snFoodMid(this.value)"><option value="">— no recipe, just words —</option>'
    +ids.map(k=>'<option value="'+esc(k)+'"'+(f.mid===k?" selected":"")+'>'+esc((R[k].emoji?R[k].emoji+" ":"")+R[k].name)+'</option>').join("")+'</select></label></div>';
  h+='<div class="sn-form">'+field("name","What food",ids.length?"Picked above, or type it":"Popcorn","","wide")+'</div>';
  if(gone)h+='<div class="sn-sub">📖 Its recipe was taken out of the Kitchen, so it is just words now. Pick another recipe, or keep the words.</div>';
  h+=ids.length?'<div class="sn-sub">With a recipe, 🛒 sends its ingredients to the Shopping List (you tick what you need). With words only, add what to buy as 🧺 supplies.</div>'
    :'<div class="sn-sub">No recipes in the Kitchen yet. That’s fine: type the food and it works the same. Recipes live in Mom’s Day ▸ 🍽 Meals ▸ 📚 Meal library. Add one there and you can pick it here.</div>';
  if(it&&hideOf(it))h+='<div class="sn-sub">🤫 This idea is a surprise, so its food stays on this page. It never goes on the Menu, because the whole family sees the Menu.</div>';
  return h;
}
function foodSave(e,f,L,b,up){
  const R=recipes(),name=String(f.name||"").trim().slice(0,80),mid=(f.mid&&(R[f.mid]||(L&&L.r.mid===f.mid)))?String(f.mid):"";
  if(!name){e.msg="Pick a recipe or type the food.";draw();return false;}
  if(!L){const rec={name,ts:Date.now()};if(mid)rec.mid=mid;up[b+rid("f")]=rec;}
  else{if(name!==L.r.name)up[b+e.id+"/name"]=name;if(mid!==(L.r.mid||""))up[b+e.id+"/mid"]=mid||null;}
  return true;
}
// 🛒 Ingredients: the Kitchen's own tick sheet for ONE recipe (what grFromRecipe opens), labelled like the supplies.
function snFoodShop(sid,iid,lid){
  const L=line(sid,iid,"food",lid),m=L&&recipeOf(L);if(!m)return;
  if(dry()){toast("Dry run — nothing is sent");return;}
  if(typeof grIngRows!=="function"||typeof grImpOpen!=="function"){toast("The Shopping List isn’t ready — try again in a moment");return;}
  grImpOpen("Add ingredients — "+(m.name||L.r.name),grIngRows([{lines:m.ing,lbl:shopLabel(sid,L.it)}]),"This recipe has no ingredients yet. Add them in 🍽 Meals ▸ 📚 Meal library.");
}
// 🍽 Put on the Menu: one of the idea's days still to come (the next one first) · dinner / breakfast / lunch / snack.
function snMenu(sid,iid,lid){
  const L=line(sid,iid,"food",lid);if(!L||!L.it)return;
  if(hideOf(L.it)){toast("🤫 A surprise’s food stays on this page");return;}
  const D=menuDays(L.it);if(!D.length){toast("It needs a day first — 📅 Schedule the idea");return;}
  const back=!!(snEdit&&snEdit.type==="idea"&&snEdit.id===iid);if(back&&!flush(iid))return;
  const M=L.r.menu||{},last=Object.keys(M).sort().map(k=>M[k]).filter(p=>p&&SN_MEALS.some(x=>x[0]===p.s)).pop();
  snAsk=null;snEdit={type:"menu",sid,iid,id:lid,back,day:D[0],slot:last?last.s:"d"};draw();
}
function snMenuDay(d){if(!snEdit||snEdit.type!=="menu"||!isIso(d))return;const it=idea(snEdit.sid,snEdit.iid);if(menuDays(it).indexOf(d)<0)return;snEdit.day=d;snEdit.msg="";draw();}
function snMenuSlot(t){if(!snEdit||snEdit.type!=="menu"||!SN_MEALS.some(x=>x[0]===t))return;snEdit.slot=t;snEdit.msg="";draw();}
function menuHere(L,d){const p=(L.r.menu||{})[d];return (p&&menuAt(d,p.s,!!p.side,placeVal(p)))?p:null;}   // already on the Menu that day (any meal)
function menuSheet(){
  const e=snEdit,L=line(e.sid,e.iid,"food",e.id),foot='<div class="sn-acts sn-foot"><button class="sn-tool" onclick="snCancel()">Cancel</button></div>';
  if(!L||!L.it)return '<div class="sn-sub">That food is gone.</div>'+foot;
  const D=menuDays(L.it),m=recipeOf(L);if(D.indexOf(e.day)<0)e.day=D[0]||"";
  let h='<div class="sn-h2">🍽 Put on the Menu — '+esc(L.r.name)+'</div><div class="sn-sub">For '+esc((L.it.emoji?L.it.emoji+" ":"")+(L.it.t||""))+". "+(m?"It goes on as the Kitchen’s recipe.":"It goes on as words (no recipe).")+'</div>';
  if(!e.day||hideOf(L.it))return h+'<div class="sn-empty">'+(hideOf(L.it)?"🤫 A surprise’s food stays on this page.":"It has no day still to come. 📅 Schedule the idea first.")+'</div>'+foot;
  h+='<div class="sn-lab">Which day</div><div class="sn-chips">'+D.map(d=>'<button class="sn-f'+(e.day===d?" on":"")+'" onclick="snMenuDay(\''+d+'\')">'+fmtDay(d)+'</button>').join("")+'</div>';
  h+='<div class="sn-lab">Which meal</div><div class="sn-chips">'+SN_MEALS.map(x=>'<button class="sn-f'+(e.slot===x[0]?" on":"")+'" onclick="snMenuSlot(\''+x[0]+'\')">'+x[1]+" "+x[2]+'</button>').join("")+'</div>';
  const rec=kRec(e.day),cur=slotName(rec,e.slot),sides=e.slot==="d"?sidesOf(e.day):[],busy=!!cur||sides.length>0,here=menuHere(L,e.day);
  const now=cur?esc(cur)+(sides.length?" + "+sides.length+" side"+(sides.length===1?"":"s"):""):(sides.length?sides.length+" side"+(sides.length===1?"":"s")+", no main dish":"nothing yet");
  h+='<div class="sn-sub"><b>'+fmtDay(e.day)+", "+mealName(e.slot)+' now:</b> '+now+'</div>';
  if(here)h+='<div class="sn-msg">It’s already on the Menu that day ('+mealName(here.s)+(here.side?", a side":"")+'). Take it off from the food’s row first to move it.</div>';
  else if(!busy)h+='<div class="sn-acts"><button class="sn-go" onclick="snMenuGo(\'put\')">🍽 Put it on</button></div>';
  else h+='<div class="sn-ask"><span>That spot already has '+now+'. What should happen?</span><button class="sn-tool" onclick="snMenuGo(\'replace\')">Replace it'+(sides.length?" (its sides come off too)":"")+'</button>'
    +(e.slot==="d"?'<button class="sn-tool" onclick="snMenuGo(\'side\')">＋ Add as a side</button>':"")+'<button class="sn-tool" onclick="snCancel()">Leave it</button></div>';
  return h+foot+(e.msg?'<div class="sn-msg">'+esc(e.msg)+'</div>':"");
}
// put = the spot is empty · replace = she chose it · side = a dinner side. NEVER a quiet overwrite: "put" on a busy spot asks instead.
function snMenuGo(how){
  const e=snEdit;if(!e||e.type!=="menu")return false;const L=line(e.sid,e.iid,"food",e.id);if(!L||!L.it||hideOf(L.it))return false;
  const d=e.day,t=e.slot,side=how==="side";
  if(menuDays(L.it).indexOf(d)<0||!SN_MEALS.some(x=>x[0]===t)||(side&&t!=="d")||menuHere(L,d))return false;
  if(dry()){toast("Dry run — nothing is sent");return false;}
  const rec=kRec(d),busy=!!slotName(rec,t)||(t==="d"&&sidesOf(d).length>0);
  if(how==="put"&&busy){e.msg="That spot has something on it now. Pick one of the choices.";draw();return false;}
  const v=foodVal(L);
  try{
    if(side){if(v.mid&&typeof kitSideAddMid==="function")kitSideAddMid(d,v.mid);else if(typeof kitSideChange==="function")kitSideChange(d,l=>l.some(x=>sameVal(x,v))?null:l.concat([v]));else{nokit();return false;}}
    else{if(typeof kitRotDaySet!=="function"){nokit();return false;}kitRotDaySet(d,t,v);}
  }catch(x){nokit();return false;}
  if(!menuAt(d,t,side,v)){e.msg="The Menu didn’t change.";draw();return false;}   // e.g. the Kitchen asked for a PIN first
  const p={s:t};if(side)p.side=true;Object.assign(p,v);const up={};up[lineBase(L,"food")+"/menu/"+d]=p;apply(up);
  toast("🍽 "+L.r.name+" → "+fmtDay(d)+", "+mealName(t)+(side?" (a side)":""));lineClose();return true;
}
// ✕ off the Menu — only what this food put there, and only if it is still there (else the planner just forgets it).
function snMenuOff(sid,iid,lid,iso){
  const L=line(sid,iid,"food",lid);if(!L)return;const p=(L.r.menu||{})[iso];if(!p)return;
  if(dry()){toast("Dry run — nothing is sent");return;}
  const v=placeVal(p),side=!!p.side,on=menuAt(iso,p.s,side,v);
  if(on){
    if(iso<today())return;
    if(side){if(typeof kitSideRemove!=="function"){nokit();return;}kitSideRemove(iso,sidesOf(iso).findIndex(x=>sameVal(x,v)));}
    else{if(typeof kitRotDaySet!=="function"){nokit();return;}
      const k="off/"+L.id+"/"+iso;if(p.s==="d"&&sidesOf(iso).length&&!(snAsk&&snAsk.key===k)){snAsk={key:k};repaint();return;}   // a dinner's sides come off with it: ask once
      kitRotDaySet(iso,p.s,null);}
    if(menuAt(iso,p.s,side,v)){snAsk=null;repaint();return;}   // the Kitchen didn't take it off (a PIN was asked) — keep the record
  }
  snAsk=null;const up={};up[lineBase(L,"food")+"/menu/"+iso]=null;apply(up);toast(on?"🍽 Taken off the Menu":"Forgotten");repaint();
}
// Deleting a food line, deleting or 🌙 parking its idea never touches the Menu — it says so.
function stillOn(Ls){
  const t=today(),A=[];Ls.forEach(L=>{const M=L.r.menu||{};Object.keys(M).filter(isIso).forEach(d=>{const p=M[d];if(p&&d>=t&&menuAt(d,p.s,!!p.side,placeVal(p)))A.push(fmtShort(d));});});
  if(A.length)toast("🍽 Its food is still on the Menu ("+A.join(", ")+"). Change it in 🍽 Meals if you want it off.");
  return A.length;
}

// ── 🔴 NOW on Home Base (Mom only; index.html's SEASONS block asks for this) ──
// Due = a to-do whose day is today or went by; a 🎟 book-by date within a week or past. Not for 🌙 or done ideas, not for a 📜 past
// season, and not a to-do that already sits on Mom's own list. A 🤫 surprise is only COUNTED here — a kid may walk past Home Base.
function nowItems(){
  const out=[];
  seasons().filter(s=>!s.closed).forEach(s=>{
    lines(s.id,"todo").forEach(L=>{if(parked(L)||(L.it&&L.it.did)||tdCopy(L)||(!dadWhy(L)&&dadCopy(L))||(!kidWhy(L)&&kidCopy(L)))return;const st=tdState(L);if(st==="late"||st==="due")out.push({k:"todo",sid:s.id,L,d:tdDue(L),late:st==="late",sec:!!(L.it&&hideOf(L.it))});});
    ideasOf(s.id).forEach(it=>{if(it.skip||it.did)return;const b=bookState(it);if(b==="late"||b==="soon")out.push({k:"book",sid:s.id,it,d:it.bookBy,late:b==="late",sec:!!hideOf(it)});});
  });
  return out.sort((a,b)=>String(a.d).localeCompare(String(b.d)));
}
function seasonNowLines(){
  const none={n:0,html:""};
  try{if(typeof momHere!=="function"||!momHere())return none;if(typeof _kioskD==="function"&&_kioskD())return none;}catch(e){return none;}
  snNowWant=true;snListen();if(!snLoaded)return none;
  syncSoon();   // SEASONJOBS: Home Base redraws when Dad's list or the planner changes — Dad's copies catch up here
  const A=nowItems();if(!A.length)return none;
  const open=A.filter(x=>!x.sec),sec=A.filter(x=>x.sec),row='display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:7px 10px;background:#f0fdfa;border-left:3px solid #2B7A78;border-radius:8px;margin-bottom:6px';
  const btn=(fn,lbl,solid)=>'<button onclick="'+fn+'" style="padding:4px 10px;border-radius:8px;border:'+(solid?"none;background:#16a34a;color:#fff":"1.5px solid #99f6e4;background:#fff;color:#0f766e")+';font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit">'+lbl+'</button>';
  const txt=(main,sub,late,full)=>'<span style="flex:1 1 '+(full?"100%":"170px")+';min-width:0;font-size:13px;font-weight:700">'+main+' <span style="font-weight:700;color:'+(late?"#b91c1c":"#6b6560")+'">· '+sub+'</span></span>';
  const when=x=>{const n=daysTo(today(),x.d);return x.late?"overdue · "+fmtDay(x.d):(n===0?"today":(n===1?"tomorrow":fmtDay(x.d)));};
  let h='<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#6b6560;margin:10px 0 6px">🎉 Seasons &amp; Events</div>';
  open.slice(0,SN_NOW_MAX).forEach(x=>{
    if(x.k==="todo"){const L=x.L,a="'"+esc(L.sid)+"','"+esc(L.iid)+"','"+esc(L.id)+"'",w=L.r.who&&L.r.who!=="mom"?who(L.r.who).name+" · ":"";
      h+='<div style="'+row+'">'+txt("✅ "+esc(L.r.t)+' <span style="color:#6b6560">· '+esc(L.it?(L.it.t||""):((season(L.sid)||{}).name||""))+'</span>',esc(w)+when(x),x.late,true)+btn("snTodoMine("+a+")","→ My list today")+btn("snTodoTick("+a+")","✓ Done",true)+'</div>';}
    else h+='<div style="'+row+'">'+txt("🎟 Book "+esc(x.it.t||""),"by "+fmtDay(x.d)+(x.late?" — late":""),x.late)+btn("snBooked('"+esc(x.sid)+"','"+esc(x.it.id)+"')","✓ Booked",true)+'</div>';
  });
  const more=Math.max(0,open.length-SN_NOW_MAX),first=(sec[0]||open[SN_NOW_MAX]||open[0]);
  if(more||sec.length)h+='<div style="'+row+'">'+'<span style="flex:1 1 170px;min-width:0;font-size:13px;font-weight:700">'+[more?"+"+more+" more":"",sec.length?"🤫 "+sec.length+" surprise thing"+(sec.length===1?" needs":"s need")+" you":""].filter(Boolean).join(" · ")+'</span>'
    +btn("snNowOpen('"+esc(first.sid)+"')","Open ›")+'</div>';
  return {n:A.length,html:h};
}
function snNowOpen(sid){if(sid&&season(sid)){snSid=sid;try{HA_LS.setItem("ha_sn_sid",sid);}catch(e){}}snView="todo";snEdit=null;snAsk=null;try{if(typeof mpGoto==="function")mpGoto("seasons");}catch(e){}}

// ── 🍗 BIGMEAL slice 1: an idea's ⏱ Cooking timeline lives in its own lazy file, bigmeal.js (PLAN_holiday_menu_2026-11-24.md) ──
// This file only opens it: the chips, the two ⏱ buttons, the loader, and window._snApi — the planner's own readers and its ONE write
// door apply(), handed to bigmeal.js on purpose (it never reads _snTest). bigmeal.js has no database call of its own.
// If bigmeal.js can't load, the planner works exactly as before; a toast says so and the next tap tries again.
function eatTxt(it){const m=/^(\d{1,2}):(\d{2})$/.exec(String(((it||{}).meal||{}).eat||""));if(!m||+m[1]>23||+m[2]>59)return "";const h=+m[1];return (h%12||12)+":"+m[2]+" "+(h>=12?"PM":"AM");}
function bmHook(){try{if(typeof window.bmRefresh==="function")window.bmRefresh();}catch(e){}}
let bmLoading=false,bmThen=null;
function bmLoad(then){
  if(typeof window.bmOpen==="function"){then();return;}
  bmThen=then;if(bmLoading)return;bmLoading=true;
  const s=document.createElement("script");let gh=false;try{gh=/github\.io$/.test(location.hostname);}catch(e){}
  s.src=gh?("bigmeal.js?v="+Date.now()):"bigmeal.js";
  s.onload=()=>{bmLoading=false;const f=bmThen;bmThen=null;if(f&&typeof window.bmOpen==="function")f();};
  s.onerror=()=>{bmLoading=false;bmThen=null;toast("Couldn’t load the cooking timeline. Check the internet and tap again.");};
  document.head.appendChild(s);
}
function snMeal(iid){
  const sid=curSid();if(!sid||!idea(sid,iid))return;
  if(snEdit&&snEdit.type==="idea"&&snEdit.id===iid){if(!flush(iid))return;snEdit=null;snAsk=null;draw();}   // keep what she typed in the idea first
  bmLoad(()=>{try{window.bmOpen(sid,iid);}catch(e){}});
}

// ── loading: only for Mom — when this page is opened, or when Home Base asks for its 🔴 NOW lines ──
function onPage(){try{return typeof tab!=="undefined"&&tab==="moms-plan"&&typeof mpSubView!=="undefined"&&mpSubView==="seasons";}catch(e){return false;}}
function snListen(){
  if(snOn)return;snOn=true;
  if(typeof db==="undefined"||!db){snLoaded=true;return;}
  const got=()=>{if(++snGot>=2&&!snLoaded){snLoaded=true;if(snNowWant)homeRepaint();}if(snLoaded&&onPage()&&!snEdit)draw();};   // Home Base asked for its lines → repaint it ONCE when the data is in
  let a=false,b=false;
  try{db.ref("dadday").once("value",()=>{snDdFresh=true;syncSoon();});}catch(e){}   // SEASONJOBS fix: wait for the server's answer for Dad's list (the app's own listener keeps daddayData current after)
  db.ref("seasons").on("value",s=>{snData=s.val()||{};if(!a){a=true;got();}else if(onPage()&&!snEdit)draw();if(snLoaded)syncSoon();bmHook();});
  db.ref("seasonSecret").on("value",s=>{snSecret=s.val()||{};if(!b){b=true;got();}else if(onPage()&&!snEdit)draw();if(snLoaded)syncSoon();bmHook();});
  if(kidPageOk())db.ref("seasonJobs").on("value",s=>{snJobs=s.val()||{};snJobsOk=true;if(snLoaded){if(onPage()&&!snEdit)draw();syncSoon();}bmHook();});   // SEASONJOBS step B: the kids' ticks come back here
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
.sn-hold{grid-column:1/-1;display:flex;gap:6px;align-items:center;cursor:pointer;font-size:13px;font-weight:600;color:#0f172a}
.sn-holdwhy{grid-column:1/-1;font-size:11px;margin:-4px 0 2px}.sn-holdwhy.no{color:#b91c1c;font-weight:700}
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
.sn-day.pick{border-color:#2B7A78;border-width:2.5px;background:#DEF2F1}
.sn-day.had{opacity:.6;cursor:default}
.sn-modes{margin-top:12px}.sn-n{align-items:center}.sn-n b{min-width:28px;text-align:center;font-size:15px}
.sn-f:disabled,.sn-go:disabled{opacity:.45;cursor:default}
.sn-views{display:flex;gap:6px;margin-bottom:10px}
.sn-v{flex:1;min-width:0;padding:7px 4px;border-radius:10px;border:1.5px solid var(--border);background:#fff;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;color:#475569}
.sn-v small{display:block;font-size:10.5px;font-weight:700;color:#64748b;margin-top:1px}
.sn-v.late small{color:#b91c1c}
.sn-v.on{background:#2B7A78;color:#fff;border-color:#2B7A78}
.sn-v.on small{color:#d1fae5}
.sn-ln{display:flex;align-items:center;gap:6px;padding:6px 0;border-top:1px solid #f1f5f9}
.sn-ln.dim{opacity:.55}
.sn-tick{flex:none;border:none;background:none;font-size:21px;line-height:1;cursor:pointer;padding:2px 4px;color:#475569;font-family:inherit}
.sn-tick.on{color:#15803d}
.sn-lt{flex:1;min-width:0;text-align:left;background:none;border:none;padding:0;cursor:pointer;font:inherit;font-size:13.5px;color:inherit}
.sn-lt small{display:block;font-size:11px;color:#64748b;font-weight:600;margin-top:1px}
.sn-ln.late .sn-lt small{color:#b91c1c;font-weight:800}
.sn-ask{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#fffbeb;border:1.5px solid #fcd34d;border-radius:9px;padding:7px 9px;margin:2px 0 6px;font-size:12.5px;font-weight:700;color:#92400e}
.sn-ask span{flex:1 1 100%}
.sn-grp{background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;margin-bottom:8px}
.sn-grp .sn-acts{margin:6px 0 2px}
.sn-gh{display:flex;align-items:center;gap:8px;padding:2px 0 4px}
.sn-gt{flex:1;min-width:0;text-align:left;background:none;border:none;padding:0;font:inherit;font-size:13.5px;cursor:pointer;color:inherit}
.sn-gh2{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#64748b;margin:12px 0 6px}
.sn-gh2.late{color:#b91c1c}
.sn-chip.kid{border-color:#93c5fd;color:#1d4ed8;background:#eff6ff}
.sn-chip.dad{white-space:normal;flex:0 1 auto;max-width:150px;line-height:1.3;padding:2px 7px}
.sn-ln.wrap{flex-wrap:wrap}
.sn-mn{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:-2px 0 6px 6px;font-size:11.5px;font-weight:700;color:#166534}
.sn-mn.old{color:#92400e}.sn-mn .sn-tool{padding:2px 8px;font-size:11px}
.sn-secnote{flex:1 0 100%;font-size:11px;font-weight:700;color:#6d28d9;padding:0 0 0 34px;line-height:1.35}
.sn-kids{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;font-size:12.5px;line-height:1.4;color:#475569}
.sn-kids span{flex:1 1 200px}
.sn-kids.on span{color:#0f766e}
.sn-chip.warn{border-color:#f59e0b;color:#92400e;background:#fffbeb}
`;
window.renderSeasons=function(el,ah){
  if(typeof momHere==="function"&&!momHere()){el.innerHTML=(ah||"")+'<div class="sn-empty" style="padding:40px;text-align:center">🔒 Mom only.</div>';return;}   // surprises live here: nothing loads without Mom
  if(!document.getElementById("sn-style")){const s=document.createElement("style");s.id="sn-style";s.textContent=SN_CSS;document.head.appendChild(s);}
  snRoot=el;snAh=ah||"";snListen();draw();
};
Object.assign(window,{snMeal,snNewSeason,snKind,snEditSeason,snDelSeason,snPick,snPastToggle,snFilterSet,snForToggle,snQuickAdd,snOpenIdea,snSet,snWant,snStar,snSize,snHide,snSave,snCancel,snDelIdea,
  snSched,snDaysOpen,snDaysMore,snPickAny,snPickDay,snUnsched,snMode,snDow,snWeeks,snPickToggle,snPutWeeks,snPutPicked,snUnschedAll,snHold,snDid,snUndid,snSkip,snUnskip,
  snKids,snViewSet,snLine,snLineWho,snLineDel,snFoodMid,snFoodShop,snMenu,snMenuDay,snMenuSlot,snMenuGo,snMenuOff,snSupHave,snSupList,snSupSame,snAskNo,snSupAll,snTodoTick,snTodoMine,snBooked,snNowOpen,seasonNowLines});
window._snApi={apply,today,dry,esc,rid,isIso,addDays,daysTo,fmtDay,fmtShort,toast,season,seasons,curSid,idea,ideasOf,ideaLines,line,lineBase,base,hideOf,whens,ideaDay,state,
  recipes,recipeOf,people,who,stillOn,repaint,loaded:()=>snLoaded,foodShop:snFoodShop,lineOpen:snLine};   // BIGMEAL: what bigmeal.js may use
window._snTest={data:()=>snData,secret:()=>snSecret,setData:(d,s)=>{snData=d||{};snSecret=s||{};snLoaded=true;},reset:()=>{snSid=null;snFilter="all";snEdit=null;snFor={};snPast=false;snView="ideas";snAsk=null;},
  lines,line,tdDue,tdState,tdDone,supState,bookState,shopLabel,nowItems,ideaDay,view:()=>snView,ask:()=>snAsk,
  setRoot:(el,ah)=>{snRoot=el;snAh=ah||"";},draw,edit:()=>snEdit,seasons,season,ideasOf,idea,whens,state,counts,picks,openDays,dayInfo,mins,starsUsed,starMax,apply,schedRange,kindDefaults,fmtDay,curSid,OK:SN_OK,
  dadSync,dadPlan,dadWhy,dadCopy,dadNote,showDay,tdDue,tdDone,line,lines,syncPending:()=>!!snSyncT,ddFresh:v=>{if(v!==undefined)snDdFresh=!!v;return snDdFresh;},
  kidWhy,kidCopy,kidNote,jobRec,jobStars,firstDay,nightsOf,weekDates,putNights,recipes,menuAt,menuDays,foodRow,menuSheet,menuGo:snMenuGo,jobs:()=>snJobs,setJobs:j=>{snJobs=j||{};snJobsOk=!!j;}};
})();
