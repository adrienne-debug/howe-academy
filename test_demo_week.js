/*
 * 🧪 DEMO WEEK — slice E of PLAN_living_schedule_finish_2026-11-08.md (her words 11/8: "run demo runs and find any issues …
 * make sure that no subjects get skipped or deleted or anything along those lines").
 *
 * The WHOLE app (index.html's main script) runs in a vm sandbox — see test_fixtures/demo_week_sandbox.js — on a SYNTHETIC family
 * (test_fixtures/living_demo_family.json: four fake kids, plan-backed lessons, dailies with pattern days, a fixed-time class,
 * a timed co-op, a Mom-required subject, Sunday catch-up for one kid, a sitter Tuesday). Two devices share one in-memory
 * Firebase tree: A is Mom's (every door is tapped here), B is a kid's tablet (it only listens, and checks cards off).
 * One virtual clock. Every real engine runs for real: the Sunday self-build (AUTOBUILD), the one re-lay door (RELAY…RELAY4),
 * the subject re-lay (REPROJ), the cascade, the school-end guard, the 8 PM sweep, the strip (THISWEEK), the claim.
 *
 * The replay (week 2 of the fixture, Mon 2026-11-16 … Sun 2026-11-22; week 1 is played first so there is history to carry):
 *   Sun 00:00 self-build (both devices awake) → Mon 9:40 a Grid ✕ (off this day) on one subject → Mon 10:05 a card checked early →
 *   Tue add a subject (a daily; and a sequenced one, built) → Tue a kid off for Wed (📅 strip; Undo, redo) → Wed ⏰ day times for Thu
 *   (Undo, redo) → Wed a lesson-text edit on today's open card (list save) → Thu delete a subject → Thu 8 PM sweep →
 *   Fri Saturday on (📅 strip; the Saturday tab + its dailies — Undo, redo, off, on) → Sat → next Sunday 00:00 (week 3 builds; carries).
 * After EVERY step the same checks run (see CHECKS below). Each failure names the cards and the rule; the report
 * (REPORT_living_demo_2026-11-08.md) says which are real bugs and which are harness gaps.
 *
 *   run:  node test_demo_week.js            (DEMO_VERBOSE=1 echoes the app's console; DEMO_JSON=<path> writes the step table)
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const VERBOSE=!!process.env.DEMO_VERBOSE;

let pass=0, fail=0; const STEPS=[];
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,900)+")":"")); } }
const ms=(y,m,d,h,mi,s)=>new Date(y,m-1,d,h||0,mi||0,s||0).getTime();
const isoOf=t=>{ const d=new Date(t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const ABBR={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
const dnOf=iso=>DN[new Date(iso+"T12:00:00").getDay()];
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };

// ── the world ──
const clock=S.makeClock(ms(2026,11,8,0,0,30)); clock.boot=clock.now;
const sched=S.makeScheduler(clock);
const db=S.makeDb(FX.db,clock,sched);
const boot=(name,dev)=>S.bootDevice({name,dev,db,clock,sched,family:FX.family,indexPath:INDEX,verbose:VERBOSE});
async function flush(msAhead){ await sched.run(clock.now+(msAhead==null?30000:msAhead)); }
let A=null, B=null;
const devices=()=>[A,B].filter(Boolean);
const WK=()=>db.get("ha_active_wk")||A.get("WK");
const WN=()=>parseInt(String(WK()).replace(/\D/g,""),10);
const boardObj=()=>db.get(WK()+"/tasks")||{};
const board=()=>Object.values(boardObj()).filter(t=>t&&t.id);
const checkedMap=()=>db.get(WK()+"/checked")||{};
const claimedMap=()=>db.get(WK()+"/claimed")||{};
const relayLog=()=>db.get(WK()+"/relayLog")||{};
const subjects=()=>A.get("currData.subjects")||{};
const todayIso=()=>isoOf(clock.now);
const nowMin=()=>{ const d=new Date(clock.now); return d.getHours()*60+d.getMinutes(); };
const fpOf=tasks=>tasks.map(t=>t.id+"|"+t.day+"|"+t.time+"|"+(t.title||"")).sort().join(",");
const snapOf=tasks=>{ const o={}; tasks.forEach(t=>{ o[t.id]={day:t.day,time:t.time,title:t.title||"",eo:!!t._eowOverflow,dd:!!t._dayDrop}; }); return o; };
const isNb=t=>t.subjectKey==="morning_nb"||t.subjectKey==="closing_nb";
const CHECK_SNAP={};   // id → {day,time,title} the moment the check settled (C5)
const SEEN_LIDS={};    // week → kid/sk → Set of lesson ids that were ever on that week's board (the F4 premise)
function noteSeen(){ const w=WN(); const m=SEEN_LIDS[w]=SEEN_LIDS[w]||{}; board().forEach(t=>{ if(t&&t.lid&&t.who&&t.subjectKey){ const k=t.who+"/"+t.subjectKey; (m[k]=m[k]||new Set()).add(t.lid); } }); }
const dbgSince=(mark,re)=>db.debug.slice(mark).map(d=>d.msg).filter(m=>!re||re.test(String(m)));

// ── the week's dates and each subject's pattern (what the app itself reads) ──
function weekDates(wn){ const r=A.fn("gwWeekDateRange")(wn); if(!r) return {}; const mon=new Date(r.start+"T12:00:00"); const out={}; DN.slice(1).forEach((dn,i)=>{ const d=new Date(mon); d.setDate(d.getDate()+i); out[dn]=isoOf(d.getTime()); }); return out; }
function satOn(wn){ try{ return !!A.fn("gwEffectiveConfig")(wn).saturday; }catch(e){ return false; } }
// does subject sk run for kid on that date, by the app's own rules (pattern days, class dates, kid off, co-op block, ✕'d day)?
function runsOn(kid,sk,s,iso,dn){
  if(!s||s.paused) return false;
  if(A.fn("smapIsKidOff")(kid,iso)) return false;
  try{ if(A.fn("_ovOffX")(kid,iso,false)) return false; }catch(e){}
  const dow=ABBR[dn];
  if(s.fixedTime) return !!A.fn("fxRunsOn")(s,iso,dn);
  const al=(s.allowedDays||[]).map(String);
  if(al.length&&al.indexOf(dow)<0) return false;
  if(/\b(first|last)\b/.test(String(s.rules||""))) return true;   // bookends: every school day the kid has
  try{ if(A.fn("_ovRmX")(kid,iso,sk,false)) return false; }catch(e){}   // a co-op no-Mom day, or ✕'d off for it
  if(s.tracking!=="daily"&&!s.planId&&!/\b(first|last)\b/.test(String(s.rules||""))) return false;   // a card-only subject: the engine has no re-lay for it (a subject added on the Add sheet is born plan-backed — ADDPB, F2)
  if(s.tracking!=="daily"&&s.planId){ const left=(s.lessonSeq||[]).length-Object.keys((((A.get("currData.done")||{})[kid]||{})[sk])||{}).length; if(left<=0) return false; }
  return true;
}

// ── CHECKS — the same list after every step ──
// C1 pattern · C2 no-double · C3 no-lost (list order) · C4 no open card on a past day · C5 checked cards never move / keep their text ·
// C6 class pinned · C7 Morning first, Closing last · C8 day start/end/lunch · C9 no two cards stacked · C12 the second device sees the same week
function checkAll(ctx){
  ctx=ctx||{}; ctx.notes=ctx.notes||[]; const F=[]; const add=(code,msg,x)=>F.push({code,msg,x});
  const wn=WN(), dates=weekDates(wn), tIso=todayIso(), nMin=nowMin(), tasks=board(), ck=checkedMap(), cl=claimedMap(), subs=subjects();
  const sat=satOn(wn); const days=DN.slice(1,6).concat(sat?["saturday"]:[]);
  const dayIso=dn=>dates[dn];
  const dayTimes=(dn,iso)=>A.fn("dtDay")(dn,iso);
  const live=t=>t&&t.id&&!String(t.id).endsWith("_c");
  const onTimeline=t=>live(t)&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null;
  const past=dn=>dayIso(dn)<tIso;
  const future=dn=>dayIso(dn)>tIso;
  // C1 + C2 + C3
  Object.keys(subs).forEach(kid=>{ Object.keys(subs[kid]).forEach(sk=>{ const s=subs[kid][sk]; if(!s||s.paused) return;
    const mine=tasks.filter(t=>live(t)&&t.who===kid&&t.subjectKey===sk);
    days.forEach(dn=>{ const iso=dayIso(dn); if(!iso||past(dn)) return;
      if(dn===tIso&&false) return;
      const want=runsOn(kid,sk,s,iso,dn); const have=mine.filter(t=>t.day===dn&&!t._eowOverflow);
      if(want&&!have.length){
        // today after the start: a card may have been checked and healed, or the day is running — only a MISSING card for a day not yet started counts
        const st=dayTimes(dn,iso).s; if(iso===tIso&&nMin>=st) return;
        // a card the sweep carried OFF this day to a later one (a day too short to hold it) is displaced, not lost: noted, not a failure
        const displaced=mine.find(t=>(t.cascadedFrom===dn||t.rolledFrom===dn)&&t.day!==dn&&!ck[t.id]);
        if(displaced){ ctx.notes.push("C1 displaced: "+kid+"/"+sk+" "+dn+" → "+displaced.day+" "+displaced.time+" (sweep)"); return; }
        // a plan-backed subject with no later card this week either: the school-end guard deferred its lesson off the week (the day was too short) — next week's build serves it first (C3 and the week-turn check prove nothing is lost)
        if(s.planId&&!mine.some(t=>!ck[t.id]&&dayIso(t.day)>iso)){ ctx.notes.push("C1 deferred: "+kid+"/"+sk+" has no card on "+dn+" and none later this week (guard: day too short) — next week serves it"); return; }
        add("C1","missing card: "+kid+"/"+sk+" on "+dn+" "+iso,{pattern:(s.allowedDays||[]).join("/"),dbg:dbgSince(ctx.dbgMark,new RegExp(sk)).slice(-4)}); }
      const openHere=have.filter(t=>!ck[t.id]); let capHere=1; try{ capHere=Math.max(1,A.fn("capFor")(kid,sk,A.get("DEFAULT_DAY_CAP"))||1); }catch(e){}
      if(openHere.length>capHere) add("C2","doubled: "+kid+"/"+sk+" has "+openHere.length+" open cards on "+dn+" (cap "+capHere+")",openHere.map(t=>t.id+" "+t.time));
      else if(openHere.length>1) ctx.notes.push("C2 two sittings (within cap "+capHere+"): "+kid+"/"+sk+" "+dn);
    });
    // C3: for a plan-backed subject the open lessons on the board are the earliest undone lessons, in list order, no gap
    if(s.planId&&Array.isArray(s.lessonIds)){
      const done=new Set(Object.keys((((A.get("currData.done")||{})[kid]||{})[sk])||{}));
      const undone=s.lessonIds.filter(l=>!done.has(l));
      const open=mine.filter(t=>!ck[t.id]&&!cl[t.id]&&t.lid).map(t=>t.lid);
      const openSet=new Set(open);
      if(open.length!==openSet.size) add("C2","the same lesson twice on the board: "+kid+"/"+sk,open);
      const prefix=undone.slice(0,openSet.size);
      const missing=prefix.filter(l=>!openSet.has(l)), extra=open.filter(l=>prefix.indexOf(l)<0);
      if(missing.length||extra.length) add("C3","lesson order gap: "+kid+"/"+sk+" — skipped "+missing.join(",")+(extra.length?" · on the board out of turn "+extra.join(","):""),{board:open,nextUndone:undone.slice(0,open.length+2)});
    }
  }); });
  // C4: no open lesson on a day already over (dailies and boxed cards may: a missed day is just missed)
  tasks.forEach(t=>{ if(!live(t)||ck[t.id]||cl[t.id]) return; if(!dates[t.day]||!past(t.day)) return; if(t._eowOverflow||t._dayDrop) return;
    const s=((subs[t.who]||{})[t.subjectKey]); if(s&&(s.tracking==="daily"||s.noCarry||s.fixedTime)) return; if(isNb(t)) return;
    add("C4","open card left on a past day: "+t.who+" "+t.day+" "+t.time+" "+(t.title||t.id)); });
  // C5: a checked card stays exactly where (and what) it was when checked
  Object.keys(CHECK_SNAP).forEach(id=>{ const t=tasks.find(x=>x.id===id); const sn=CHECK_SNAP[id]; if(!t){ if(sn.wk===wn) add("C5","checked card gone from the board: "+id+" ("+sn.title+")"); return; }
    if(t.day!==sn.day||t.time!==sn.time||(t.title||"")!==sn.title) add("C5","checked card changed: "+id,{was:sn,now:{day:t.day,time:t.time,title:t.title}}); });
  // C6: a class sits at its clock time on each of its dates
  Object.keys(subs).forEach(kid=>Object.keys(subs[kid]).forEach(sk=>{ const s=subs[kid][sk]; if(!s||!s.fixedTime||s.paused) return;
    days.forEach(dn=>{ const iso=dayIso(dn); if(!iso||past(dn)||!A.fn("fxRunsOn")(s,iso,dn)||A.fn("smapIsKidOff")(kid,iso)) return;
      const c=tasks.filter(t=>live(t)&&t.who===kid&&t.subjectKey===sk&&t.day===dn);
      c.forEach(t=>{ if(ck[t.id]) return; if(t.time!==s.fixedTime) add("C6","class not at its time: "+kid+"/"+sk+" "+dn+" at "+t.time+" (set "+s.fixedTime+")"); }); }); }));
  // C7, C8, C9 per kid and day
  days.forEach(dn=>{ const iso=dayIso(dn); if(!iso||past(dn)) return; const W=dayTimes(dn,iso);
    const kids=Array.from(new Set(tasks.map(t=>t.who)));
    kids.forEach(kid=>{
      const mine=tasks.filter(t=>onTimeline(t)&&t.who===kid&&t.day===dn);
      const open=mine.filter(t=>!ck[t.id]);
      const isCls=t=>{ const s=(subs[kid]||{})[t.subjectKey]; return !!(s&&s.fixedTime); };
      const morn=open.find(t=>t.subjectKey==="morning_nb"), close=open.find(t=>t.subjectKey==="closing_nb");
      if(morn){ const ahead=open.filter(t=>t!==morn&&!isCls(t)&&toMin(t.time)<toMin(morn.time)); if(ahead.length&&!(iso===tIso&&nMin>=W.s)) add("C7","Morning Notebook not first: "+kid+" "+dn+" notebook "+morn.time,ahead.map(t=>t.time+" "+t.subjectKey)); }
      if(close){ const after=open.filter(t=>t!==close&&toMin(t.time)+(+t.dur||20)>toMin(close.time)); if(after.length) add("C7","Closing Notebook not last: "+kid+" "+dn+" closing "+close.time,after.map(t=>t.time+"+"+t.dur+" "+t.subjectKey)); }
      open.forEach(t=>{ const a=toMin(t.time), b=a+(+t.dur||20);
        if(iso===tIso&&a<nMin) return;   // today's running day: a card already begun keeps its time
        if(a<W.s&&!isCls(t)) add("C8","before the day's start: "+kid+" "+dn+" "+t.time+" "+t.subjectKey+" (start "+A.fn("fromMin")(W.s)+")");
        if(b>W.e&&dn!=="saturday") add("C8","past the day's end: "+kid+" "+dn+" "+t.time+"+"+t.dur+" "+t.subjectKey+" (end "+A.fn("fromMin")(W.e)+")");
        if(W.le>W.ls&&a<W.le&&b>W.ls&&!isCls(t)) add("C8","on lunch: "+kid+" "+dn+" "+t.time+"+"+t.dur+" "+t.subjectKey); });
      const sorted=open.slice().sort((x,y)=>toMin(x.time)-toMin(y.time));
      for(let i=1;i<sorted.length;i++){ const p=sorted[i-1], q=sorted[i]; if(toMin(q.time)<toMin(p.time)+(+p.dur||20)){ if(iso===tIso&&toMin(p.time)<nMin) continue; add("C9","stacked: "+kid+" "+dn+" "+p.time+"+"+p.dur+" "+p.subjectKey+" ⟂ "+q.time+" "+q.subjectKey); } }
    });
  });
  // C12: the second device shows the same week and never re-laid
  if(B){ const fa=fpOf(A.tasks()), fb=fpOf(B.tasks()), fd=fpOf(tasks);
    if(fa!==fd) add("C12","Mom's device differs from the database",{aOnly:A.tasks().filter(t=>!boardObj()[t.id]).map(t=>t.id).slice(0,5),n:[A.tasks().length,tasks.length]});
    if(fb!==fd) add("C12","the kid's device differs from the database",{bOnly:B.tasks().filter(t=>!boardObj()[t.id]).map(t=>t.id).slice(0,5),n:[B.tasks().length,tasks.length]});
    const foreign=Object.values(relayLog()).filter(e=>e&&e.dev&&e.dev!==A.id&&!e.built); if(foreign.length) add("C12","a re-lay ran on the kid's device",foreign.map(e=>e.label)); }
  return F;
}
// C14: the relayLog is coherent
function checkRelayLog(){
  const F=[]; const L=relayLog(); const keys=Object.keys(L).sort();
  if(keys.length>10) F.push({code:"C14",msg:"relayLog holds "+keys.length+" entries (max 10)"});
  keys.forEach(k=>{ const e=L[k]; if(!e||String(e.at)!==k) F.push({code:"C14",msg:"entry key ≠ at: "+k}); if(!e.label||!e.why) F.push({code:"C14",msg:"entry without label/why: "+k});
    if(!e.built){ const n=((e.moves||[]).length+(e.removed||[]).length+(e.added||[]).length+(e.boxed||[]).length); if(n!==e.n) F.push({code:"C14",msg:"entry n≠parts: "+k+" n="+e.n+" parts="+n}); } });
  return F;
}
// C10: "what moved" lists exactly the open cards whose day/time changed in this step (held/class cards excepted)
function checkWhatMoved(pre,post,entry,ckPre){
  const F=[]; if(!entry) return F;
  const held=id=>{ const t=post[id]||pre[id]; return !!(t&&A.fn("_rlwIsClass")({who:(boardObj()[id]||{}).who,subjectKey:(boardObj()[id]||{}).subjectKey})); };
  const moved=Object.keys(pre).filter(id=>post[id]&&!ckPre[id]&&!held(id)&&(pre[id].day!==post[id].day||pre[id].time!==post[id].time||pre[id].eo!==post[id].eo));
  const removed=Object.keys(pre).filter(id=>!post[id]&&!ckPre[id]);
  const added=Object.keys(post).filter(id=>!pre[id]);
  const em=(entry.moves||[]).map(m=>m.id), er=(entry.removed||[]).map(c=>c.id), ea=(entry.added||[]);
  const diff=(a,b)=>({notListed:a.filter(x=>b.indexOf(x)<0),listedButStill:b.filter(x=>a.indexOf(x)<0)});
  const dm=diff(moved,em), dr=diff(removed,er), da=diff(added,ea);
  if(dm.notListed.length||dm.listedButStill.length) F.push({code:"C10",msg:"what-moved ≠ the cards that moved",x:{movedNotListed:dm.notListed.map(id=>id+" "+pre[id].day+" "+pre[id].time+"→"+post[id].day+" "+post[id].time),listedButDidNotMove:dm.listedButStill}});
  if(dr.notListed.length||dr.listedButStill.length) F.push({code:"C10",msg:"what-moved 'removed' ≠ the cards removed",x:dr});
  if(da.notListed.length||da.listedButStill.length) F.push({code:"C10",msg:"what-moved 'added' ≠ the cards added",x:da});
  return F;
}
function writesSummary(ws){
  const by={}; ws.forEach(w=>{ const k=w.op+" "+w.path.replace(/\/[^/]+$/,(m)=>/^\/(kid_|20\d\d|-P|L\d|[0-9]{13})/.test(m)?"/*":m); by[k]=(by[k]||0)+1; });
  const whole=ws.filter(w=>w.whole).map(w=>w.op+" "+w.path+" ("+w.dev+", "+w.n+" cards)");
  const byDev={}; ws.forEach(w=>{ byDev[w.dev]=(byDev[w.dev]||0)+1; });
  return {total:ws.length,byDev,whole,top:Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,n])=>n+"× "+k)};
}
function newestRelay(before){ const L=relayLog(); const keys=Object.keys(L).sort(); const fresh=keys.filter(k=>!before[k]); return fresh.length?L[fresh[fresh.length-1]]:null; }
// every what-moved entry a step wrote, as one (a step with two doors — S4 adds two subjects — writes two lines; C10 judges them together)
function stepRelays(before){ const L=relayLog(); const fresh=Object.keys(L).sort().filter(k=>!before[k]&&!L[k].built).map(k=>L[k]); if(fresh.length<2) return null;
  return {moves:[].concat(...fresh.map(e=>e.moves||[])),removed:[].concat(...fresh.map(e=>e.removed||[])),added:[].concat(...fresh.map(e=>e.added||[]))}; }

// ── one step: set the clock, snapshot, act, settle, check, record ──
async function step(name,atMs,act,o){
  o=o||{}; clock.now=atMs;
  const pre=snapOf(board()), ckPre=Object.assign({},checkedMap()), mark=db.log.length, dbgMark=db.debug.length, logBefore=Object.assign({},relayLog());
  console.log("\n── "+name+" — "+new Date(atMs).toString().slice(0,24));
  let actOut=null; try{ actOut=await act(); }catch(e){ ok(name+": the door ran without throwing",false,String(e&&e.stack||e).slice(0,400)); }
  await flush(o.settleMs==null?30000:o.settleMs);
  noteSeen(); const post=snapOf(board()), ws=db.log.slice(mark), entry=newestRelay(logBefore);
  const notes=[]; const F=checkAll({dbgMark,notes}).concat(checkRelayLog());
  if(o.expectRelay){ if(!entry) F.push({code:"C10",msg:"no what-moved entry was written for this step"}); else { const p2=Object.assign({},pre); (o.ignoreIds||[]).forEach(id=>{ delete p2[id]; }); const q2=Object.assign({},post); (o.ignoreIds||[]).forEach(id=>{ delete q2[id]; }); F.push(...checkWhatMoved(p2,q2,stepRelays(logBefore)||entry,ckPre)); } }
  if(process.env.DEMO_DUMP){ const k=process.env.DEMO_DUMP; board().filter(t=>t.who===k).sort((a,b)=>DN.indexOf(a.day)-DN.indexOf(b.day)||toMin(a.time)-toMin(b.time)).forEach(t=>console.log("      "+t.day.slice(0,3)+" "+String(t.time).padStart(8)+" +"+t.dur+" "+(checkedMap()[t.id]?"✓":" ")+" "+t.subjectKey+" "+(t.lid||"")+(t.cascadedFrom?" ↩"+t.cascadedFrom.slice(0,3):"")+(t._eowOverflow?" [box]":"")+(t._dayDrop?" [day-box]":""))); }
  const wsum=writesSummary(ws);
  wsum.whole.forEach(w=>{ if(/\(dev_b/.test(w)) F.push({code:"C15",msg:"whole-node write from the kid's device: "+w}); else notes.push("C15 whole-node write (the cascade's own): "+w); });
  const errs=sched.errors.splice(0); errs.forEach(e=>F.push({code:"ERR",msg:"a timer threw: "+e.err.split("\n")[0]}));
  const rec={name,at:new Date(atMs).toString().slice(0,24),failures:F,notes,writes:wsum,entry:entry?{label:entry.label,why:entry.why,n:entry.n,moves:(entry.moves||[]).length,removed:(entry.removed||[]).length,added:(entry.added||[]).length,locked:(entry.locked||[]).length,undo:(entry.undo||[]).length}:null,
    dbg:db.debug.slice(dbgMark).map(d=>d.msg).filter(m=>/relay|reproject|school end|cascade heal|wrote tasks|sweep|auto-gen|built itself|deferred|didn't fit|dropped|tripwire|skipped/i.test(String(m))).slice(0,30),cards:board().length,actOut};
  STEPS.push(rec);
  const codes={}; F.forEach(f=>{ codes[f.code]=(codes[f.code]||0)+1; });
  ok(name+": checks "+(F.length?"— "+Object.entries(codes).map(([c,n])=>c+"×"+n).join(" "):"all clear")+" · "+ws.length+" writes"+(entry?" · "+entry.label+" → "+entry.n:"")+(notes.length?" · "+notes.length+" note(s)":""),!F.length,F.slice(0,6).map(f=>f.code+" "+f.msg+(f.x?" "+JSON.stringify(f.x).slice(0,220):"")).join(" || "));
  notes.forEach(n=>console.log("      note: "+n));
  if(VERBOSE) rec.dbg.forEach(m=>console.log("      dbg: "+m));
  return {pre,post,entry,ws,F,rec};
}
// the kids check their cards off through the day (device B), leaving `leave` (ids) undone; snapshots for C5
async function playDay(iso,leaveFn){
  const dn=dnOf(iso); const ck0=checkedMap();
  const cards=board().filter(t=>t.id&&!String(t.id).endsWith("_c")&&t.day===dn&&!ck0[t.id]&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null).sort((a,b)=>toMin(a.time)-toMin(b.time)||String(a.id).localeCompare(b.id));
  let n=0, blocked=[];
  for(const t of cards){ if(leaveFn&&leaveFn(t)) continue; if(A.fn("smapIsKidOff")(t.who,iso)) continue; const endMin=toMin(t.time)+(+t.dur||20); const at=hm(iso,Math.floor(endMin/60),endMin%60); if(at>clock.now) clock.now=at;
    const dev=B||A; const live=dev.tasks().find(x=>x.id===t.id); if(!live) continue;
    const r=dev.fn("finalizeDone")(t.id,dev.fn("nowTs")()); await flush(4000);
    if(r===false){ blocked.push(t.id); continue; } n++;
    const now=boardObj()[t.id]; if(now) CHECK_SNAP[t.id]={day:now.day,time:now.time,title:now.title||"",wk:WN()}; }
  return {checked:n,blocked};
}
async function rollDay(iso){ clock.now=hm(iso,0,0)+30000; devices().forEach(d=>{ try{ d.fn("dayRollCheck")(); }catch(e){ sched.errors.push({at:clock.now,err:"dayRollCheck "+d.name+": "+e}); } }); await flush(90000); }
async function sweepAt(iso){ clock.now=hm(iso,20,0); const r=A.fn("mlEveningSweep")(false); await flush(30000); return r; }

(async()=>{
  console.log("0. boot — Sunday 2026-11-08 00:00, a brand-new family tree, Mom's device awake");
  A=boot("A (Mom)","dev_a"); A.momOn(); await flush(500);
  ok("the whole app booted in the sandbox (curriculum, rules, calendar, archive, mastery arrived)",A.get("fbCurrLoaded")===true&&A.get("fbCheckedLoaded")===true&&A.get("fbArchiveLoaded")===true&&A.get("_haMastReady")===true&&A.get("rulesLoaded")===true,{logs:A.logs.slice(-5)});
  ok("the roster is the synthetic family (no real names anywhere in the sandbox)",JSON.stringify(A.get("ROSTER"))==='["kid_a","kid_b","kid_c","kid_d"]'&&!/lincoln|ellis|lucy|julian|howe|dewalt|burris|maggie/i.test(JSON.stringify(FX)));
  // F1 (ABFIRST) — a brand-new family: no ha_active_wk, no week node at all. The Sunday 00:00 roll builds week 1 by itself, with the claim
  ok("F1 premise: an empty database (no ha_active_wk, no week node) and a curriculum",db.get("ha_active_wk")==null&&!db.get("week1")&&!db.get("week3")&&!!A.get("currData.subjects.kid_a"));
  { const mark=db.log.length; A.fn("dayRollCheck")(); await flush(90000);
    const ws=db.log.slice(mark), txs=ws.filter(w=>w.op==="tx"&&w.path==="week1/meta/building"&&w.committed), sets=ws.filter(w=>w.op==="set"&&w.path==="week1/tasks");
    ok("F1: week 1 built itself at Sunday 00:00 — one committed building claim, the tasks written, Mom's note, ha_active_wk = week1",Object.keys(db.get("week1/tasks")||{}).length>60&&txs.length===1&&sets.length>=1&&db.get("ha_active_wk")==="week1"&&Object.values(db.get("week1/relayLog")||{}).some(e=>e.built&&/Week 1 built itself/.test(e.label)),{n:Object.keys(db.get("week1/tasks")||{}).length,tx:txs.length,sets:sets.length,wk:db.get("ha_active_wk"),dbg:dbgSince(0,/auto-gen|built itself|skipped/).slice(-4)});
    ok("F1: the empty week never counted as 'loaded' for anything but the self-build (no sweep, no cascade write before the build)",!ws.slice(0,ws.findIndex(w=>w.op==="tx")).some(w=>/^week\d+\/(tasks|checked|history)/.test(w.path)),ws.slice(0,6).map(w=>w.op+" "+w.path));
    const mark2=db.log.length; A.set("_abRollDay",null); A.set("_autoGenTried",false); A.fn("dayRollCheck")(); A.fn("autoGenerateWeekIfNeeded")(); await flush(90000);
    const ws2=db.log.slice(mark2).filter(w=>/^week\d+\/(tasks|meta)|^ha_active_wk/.test(w.path));
    ok("F1: a second run does nothing (the week exists, ha_active_wk is written — no claim, no tasks write)",!ws2.length&&!A.fn("_abFirstWeek")(),ws2.map(w=>w.op+" "+w.path)); }
  ok("week 1 has the class pinned at its time on its Wednesday",board().some(t=>t.subjectKey==="german_class"&&t.day==="wednesday"&&t.time==="10:00 AM"));
  STEPS.push({name:"S0 bootstrap: week 1 built (Sun 11/08)",at:"Sun Nov 08 2026 00:00",failures:checkAll({dbgMark:0}),writes:writesSummary(db.log.slice(0)),cards:board().length});
  ok("S0 checks on the freshly built week 1",!STEPS[0].failures.length,STEPS[0].failures.slice(0,6).map(f=>f.code+" "+f.msg));

  console.log("\n1. week 1 plays out (Mon 11/09 – Fri 11/13): the kid's tablet boots Monday, cards are checked off, two lessons a day are left, the 8 PM sweep runs");
  clock.now=hm("2026-11-09",8,0); B=boot("B (kid)","dev_b"); await flush(5000);
  ok("the kid's device adopted week 1 from the tree (same cards as Mom's)",fpOf(B.tasks())===fpOf(board()),{b:B.tasks().length,db:board().length,wk:B.get("WK")});
  for(const iso of ["2026-11-09","2026-11-10","2026-11-11","2026-11-12","2026-11-13"]){
    if(iso!=="2026-11-09") await rollDay(iso);
    const dn=dnOf(iso); let left=0; const r=await playDay(iso,t=>{ if(left<2&&!isNb(t)&&(t.subjectKey==="math"||t.subjectKey==="spelling")&&(dn==="wednesday"||dn==="friday")){ left++; return true; } return false; });
    const sw=await sweepAt(iso);
    console.log("   "+iso+": checked "+r.checked+(r.blocked.length?", blocked by the order guard: "+r.blocked.length:"")+", sweep "+(sw?"ran":"did not run"));
  }
  { const F=checkAll({dbgMark:0}).concat(checkRelayLog()); STEPS.push({name:"S0b week 1 played (Fri 11/13 8 PM)",at:"Fri Nov 13 2026 20:00",failures:F,writes:writesSummary(db.log.slice(0)),cards:board().length});
    ok("week 1 after five days: checks "+(F.length?F.map(f=>f.code).join(" "):"all clear"),!F.length,F.slice(0,8).map(f=>f.code+" "+f.msg)); }
  const wk1Open=board().filter(t=>!checkedMap()[t.id]&&!String(t.id).endsWith("_c")&&t.lid).map(t=>t.who+"/"+t.subjectKey+" "+t.lid);
  console.log("   week 1 ends with "+wk1Open.length+" open lesson cards (they must come first in week 2): "+wk1Open.join(", "));

  console.log("\n2. the replay week");
  // S1 — Sunday 00:00: both devices awake → the self-build (claim)
  { const mark=db.log.length; const before=Object.assign({},relayLog());
    const r=await step("S1 Sun 00:00 self-build (both devices awake)",hm("2026-11-15",0,0)+30000,async()=>{ devices().forEach(d=>d.fn("dayRollCheck")()); },{settleMs:120000,noWholeNode:false});
    const ws=db.log.slice(mark);
    const txs=ws.filter(w=>w.op==="tx"&&w.path==="week2/meta/building"), sets=ws.filter(w=>w.op==="set"&&w.path==="week2/tasks");
    ok("S1: week 2 is the active week on both devices",WK()==="week2"&&A.get("WK")==="week2"&&B.get("WK")==="week2",{db:WK(),a:A.get("WK"),b:B.get("WK")});
    ok("S1: the week built ONCE — one committed building claim, one whole-node tasks write from the commit (the post-commit sweep may add one)",txs.filter(t=>t.committed).length===1&&sets.length>=1&&sets.length<=2&&new Set(sets.map(s=>s.dev)).size===1,{tx:txs.map(t=>t.dev+":"+t.committed),sets:sets.map(s=>s.dev)});
    const note=Object.values(relayLog()).find(e=>e.built); ok("S1: Mom's note names the week, the sitter Tuesday and Sunday catch-up",!!note&&/Week 2 built itself/.test(note.label)&&/sitter Tue/.test(note.label)&&/Sunday catch-up for Kid A/.test(note.label),note&&note.label);
    const carried=board().filter(t=>String(t.id).endsWith("_c")); const servedFirst=wk1Open.filter(x=>{ const [ks,l]=x.split(" "); const [k,s]=ks.split("/"); return board().some(t=>t.who===k&&t.subjectKey===s&&t.lid===l); });
    ok("S1: every lesson left open in week 1 is on week 2's board (nothing lost at the week turn; plan-backed lessons are re-served, not twinned)",servedFirst.length===wk1Open.length&&carried.length===0,{open:wk1Open.length,served:servedFirst.length,twins:carried.length});
    ok("S1: the sitter Tuesday is on the board week (week2/babysitter) and kid_c starts after the sitter leaves",!!db.get("week2/babysitter")&&board().filter(t=>t.who==="kid_c"&&t.day==="tuesday"&&!isNb(t)).every(t=>toMin(t.time)>=toMin("1:00 PM")),{bs:db.get("week2/babysitter"),kc:board().filter(t=>t.who==="kid_c"&&t.day==="tuesday").map(t=>t.time+" "+t.subjectKey)});
    ok("S1: kid_b's Thursday (timed co-op until 1:00) starts after the co-op and holds no Mom-required lesson",board().filter(t=>t.who==="kid_b"&&t.day==="thursday").every(t=>toMin(t.time)>=toMin("1:00 PM")&&t.subjectKey!=="math"),board().filter(t=>t.who==="kid_b"&&t.day==="thursday").map(t=>t.time+" "+t.subjectKey)); }

  // Monday 11/16
  await rollDay("2026-11-16");
  { // S2 — Mon 9:40: the Grid's ✕ (off this day) on kid_b / spelling for Wednesday
    const dnWed=Object.keys(A.get("currData.lessons.kid_b")).find(dn=>A.get("currData.lessons.kid_b")[dn].date==="2026-11-18");
    const preWed=board().filter(t=>t.who==="kid_b"&&t.subjectKey==="spelling").map(t=>t.day+" "+t.lid).sort();
    const r=await step("S2 Mon 9:40 Grid ✕ — kid_b Spelling off Wednesday",hm("2026-11-16",9,40),async()=>{ A.fn("gvMenuOff")("kid_b",dnWed,"spelling"); },{expectRelay:true});
    const postWed=board().filter(t=>t.who==="kid_b"&&t.subjectKey==="spelling");
    ok("S2: Wednesday holds no Spelling card any more; the later lessons slid up in order (Mon, Fri)",!postWed.some(t=>t.day==="wednesday"&&!checkedMap()[t.id])&&postWed.filter(t=>t.day==="friday").length===1,{before:preWed,after:postWed.map(t=>t.day+" "+t.lid).sort(),mode:r.rec.dbg.filter(m=>/reproject/.test(m))}); }
  { // S3 — Mon 10:05: kid_a checks a later card early (Piano) → the rotation; then it never moves
    const piano=board().find(t=>t.who==="kid_a"&&t.subjectKey==="piano"&&t.day==="monday"&&!checkedMap()[t.id]);
    const r=await step("S3 Mon 10:05 a card checked early (kid_a Piano)",hm("2026-11-16",10,5),async()=>{ if(!piano) throw new Error("no open Piano card Monday"); const res=B.fn("finalizeDone")(piano.id,B.fn("nowTs")()); return {id:piano.id,res,was:piano.time}; },{settleMs:8000});
    const now=boardObj()[piano&&piano.id]; if(now) CHECK_SNAP[piano.id]={day:now.day,time:now.time,title:now.title||"",wk:WN()};
    ok("S3: the check landed (checked on the tree, same title), the card is on Monday",!!piano&&!!checkedMap()[piano.id]&&now&&now.title===piano.title&&now.day==="monday",{was:piano&&piano.time,now:now&&now.time,dbg:r.rec.dbg.filter(m=>/bump/.test(m))}); }
  await playDay("2026-11-16",t=>t.subjectKey==="math"&&t.who==="kid_a");   // kid_a's Math stays open today
  await sweepAt("2026-11-16");
  // Tuesday 11/17
  await rollDay("2026-11-17");
  { // S4 — Tue 9:15: add a subject — a daily (lays now) and a sequenced one (Built)
    const r=await step("S4 Tue 9:15 add a subject (daily Music Tue/Thu for kid_c; sequenced Geography Mon/Wed/Fri for kid_b, built)",hm("2026-11-17",9,15),async()=>{
      A.set("ceAddKid","kid_c"); A.run('document.getElementById("ce-add-name").value="Music"');
      A.set("ceAddForm",{name:"Music",device:"paper",mom:"none",minutes:15,days:"Tue Thu",rules:"",total:0,lessonSource:"auto",prefix:"Lesson",manualLessons:"",daysPerLesson:1,allowedDays:[],priority:"normal",carryoverCap:2,stickyWith:"",stickyOrder:"after",tracking:"daily",timesPerWeek:2,fixedTime:"",fixedDates:[],joinUrl:""});
      A.fn("ceAddSave")(); await flush(8000);
      A.set("ceAddKid","kid_b"); A.run('document.getElementById("ce-add-name").value="Geography"');
      A.set("ceAddForm",{name:"Geography",device:"paper",mom:"none",minutes:20,days:"Mon Wed Fri",rules:"sequential",total:20,startAt:1,lessonSource:"auto",prefix:"Geo",manualLessons:"",daysPerLesson:1,allowedDays:[],priority:"normal",carryoverCap:2,stickyWith:"",stickyOrder:"after",tracking:"sequenced",timesPerWeek:3,fixedTime:"",fixedDates:[],joinUrl:""});
      A.fn("ceAddSave")(); await flush(8000);
      const built=A.fn("_gvRelaySubject")("kid_b","geography","built"); return {built};
    },{expectRelay:true});
    const music=board().filter(t=>t.who==="kid_c"&&t.subjectKey==="music"), geo=board().filter(t=>t.who==="kid_b"&&t.subjectKey==="geography");
    ok("S4: the new daily (Tue/Thu) has its cards for today and Thursday",music.some(t=>t.day==="tuesday")&&music.some(t=>t.day==="thursday")&&music.length===2,music.map(t=>t.day+" "+t.time));
    const geoWant=["wednesday","friday"].filter(dn=>runsOn("kid_b","geography",A.get("currData.subjects.kid_b.geography"),weekDates(2)[dn],dn));
    ok("F2 (ADDPB): the sequenced subject added and Built mid-week is born plan-backed and lays this week — one card on each remaining pattern day (Wed, Fri), its first lessons in list order",A.fn("planBacked")("kid_b","geography")&&geoWant.length===2&&geoWant.every(dn=>geo.filter(t=>t.day===dn).length===1)&&geo.length===2&&geo.map(t=>t.lid).sort().join()===A.get("currData.subjects.kid_b.geography").lessonIds.slice(0,2).join(),{cards:geo.map(t=>t.day+" "+t.time+" "+t.lid),planBacked:A.fn("planBacked")("kid_b","geography"),want:geoWant,dbg:r.rec.dbg.filter(m=>/eography|isn't paced|relay/.test(m)).slice(0,4)});
    ok("F2: Mom's what-moved line names the new subject (its cards are in 'added', so Undo takes them off again)",Object.values(relayLog()).some(e=>/Geography added/.test(e.label)&&(e.added||[]).some(id=>geo.some(t=>t.id===id))),Object.values(relayLog()).map(e=>e.label)); }
  await playDay("2026-11-17",t=>t.subjectKey==="spelling");
  { // S5 — Tue 3:00 PM: kid_b off Wednesday (the 📅 strip) — then Undo, check the exact restore, redo
    const wedBefore=board().filter(t=>t.who==="kid_b"&&t.day==="wednesday"&&!checkedMap()[t.id]).map(t=>t.subjectKey+" "+t.lid).sort();
    const r=await step("S5 Tue 3:00 PM kid_b off Wednesday (📅 This week)",hm("2026-11-17",15,0),async()=>{ A.fn("twsToggleKid")("kid_b","2026-11-18"); },{expectRelay:true});
    const wedAfter=board().filter(t=>t.who==="kid_b"&&t.day==="wednesday"&&!checkedMap()[t.id]&&!t._eowOverflow);
    ok("S5: the mark is on the calendar and kid_b's open Wednesday lessons left the day (dailies may stay: a missed day is just missed)",!!(db.get("calendar/kidOverrides/kid_b/2026-11-18")||{}).school===false&&!wedAfter.some(t=>t.lid),{before:wedBefore,still:wedAfter.map(t=>t.subjectKey+" "+t.time)});
    // Undo
    const e=r.entry; const pre=r.pre; const mark=db.log.length;
    if(e){ A.fn("relayUndo")(String(e.at)); await flush(8000);
      const now=snapOf(board()); const movedIds=(e.moves||[]).map(m=>m.id);
      const back=movedIds.filter(id=>now[id]&&pre[id]&&now[id].day===pre[id].day&&now[id].time===pre[id].time);
      ok("S5 Undo: the mark is gone and every listed card is back exactly where it was",db.get("calendar/kidOverrides/kid_b/2026-11-18")==null&&back.length===movedIds.length&&!!(relayLog()[String(e.at)]||{}).undone,{listed:movedIds.length,back:back.length,notBack:movedIds.filter(id=>back.indexOf(id)<0).map(id=>id+" "+JSON.stringify(now[id])+" vs "+JSON.stringify(pre[id])).slice(0,4)});
      const uw=db.log.slice(mark); ok("S5 Undo: one multi-path update, no whole-node write",uw.filter(w=>w.op==="update").length>=1&&!uw.some(w=>w.whole),uw.map(w=>w.op+" "+w.path));
      const F=checkAll({dbgMark:db.debug.length}); ok("S5 Undo: the week checks clean after the undo",!F.length,F.slice(0,5).map(f=>f.code+" "+f.msg));
      // redo
      await step("S5b Tue 3:05 PM kid_b off Wednesday again (after Undo)",hm("2026-11-17",15,5),async()=>{ A.fn("twsToggleKid")("kid_b","2026-11-18"); },{expectRelay:true}); }
    else ok("S5 Undo: a relayLog entry to undo",false); }
  await sweepAt("2026-11-17");
  // Wednesday 11/18
  await rollDay("2026-11-18");
  { // S6 — Wed 8:30: ⏰ day times for Thursday 11:00–2:30 → Undo → redo
    const r=await step("S6 Wed 8:30 ⏰ Thursday 11:00 AM–2:30 PM",hm("2026-11-18",8,30),async()=>{ A.fn("dtOpen")("2026-11-19"); A.fn("dtSet")("s","11:00"); A.fn("dtSet")("e","14:30"); A.fn("dtSave")(); },{expectRelay:true});
    const thu=board().filter(t=>t.day==="thursday"&&!checkedMap()[t.id]&&!t._eowOverflow&&!t._dayDrop);
    ok("S6: Thursday's leaf is written and every open Thursday card sits inside 11:00–2:30",!!db.get("config/rules/schoolDay/byDate/2026-11-19")&&thu.every(t=>toMin(t.time)>=toMin("11:00 AM")&&toMin(t.time)+(+t.dur||20)<=toMin("2:30 PM")),{outside:thu.filter(t=>!(toMin(t.time)>=toMin("11:00 AM")&&toMin(t.time)+(+t.dur||20)<=toMin("2:30 PM"))).map(t=>t.who+" "+t.time+"+"+t.dur+" "+t.subjectKey),deferred:r.rec.dbg.filter(m=>/school end|deferred/.test(m))});
    const e=r.entry; if(e){ A.fn("relayUndo")(String(e.at)); await flush(8000); const now=snapOf(board()); const ids=(e.moves||[]).map(m=>m.id); const back=ids.filter(id=>now[id]&&r.pre[id]&&now[id].day===r.pre[id].day&&now[id].time===r.pre[id].time);
      ok("S6 Undo: the ⏰ leaf is gone and the listed cards are back",db.get("config/rules/schoolDay/byDate/2026-11-19")==null&&back.length===ids.length,{listed:ids.length,back:back.length,notBack:ids.filter(id=>back.indexOf(id)<0).slice(0,4)});
      await step("S6b Wed 8:35 ⏰ Thursday 11:00–2:30 again (after Undo)",hm("2026-11-18",8,35),async()=>{ A.fn("dtOpen")("2026-11-19"); A.fn("dtSet")("s","11:00"); A.fn("dtSet")("e","14:30"); A.fn("dtSave")(); },{expectRelay:true}); } }
  { // S7 — Wed 10:30: a lesson-text edit on today's open card (kid_a Math, the list save)
    const todayCard=board().find(t=>t.who==="kid_a"&&t.subjectKey==="math"&&t.day==="wednesday"&&!checkedMap()[t.id]);
    const s=A.get("currData.subjects.kid_a.math"); const idx=todayCard?s.lessonIds.indexOf(todayCard.lid):-1; const oldText=idx>=0?s.lessonSeq[idx]:null;
    const r=await step("S7 Wed 10:30 lesson text edit on today's open card (kid_a Math, ✎ list save)",hm("2026-11-18",10,30),async()=>{
      if(!todayCard||idx<0) throw new Error("no open Math card today / lid not on the list");
      const lines=s.lessonSeq.slice(); lines[idx]=oldText+" (review)"; A.set("ceEditKid","kid_a"); A.set("ceEditKey","math"); A.run('document.getElementById("ce-conv-lines").value='+JSON.stringify(lines.join("\n")));
      A.fn("ceConvApply")(); return {id:todayCard.id,oldText,oldTime:todayCard.time}; },{expectRelay:true});
    const now=boardObj()[todayCard&&todayCard.id];
    ok("S7: today's open card carries the new text, keeps its id, day and time; the list keeps the lesson's id",!!now&&/\(review\)/.test(now.title||"")&&now.day==="wednesday"&&now.time===todayCard.time&&A.get("currData.subjects.kid_a.math").lessonIds[idx]===todayCard.lid,{now:now&&{title:now.title,day:now.day,time:now.time},was:todayCard&&{title:todayCard.title,time:todayCard.time},mode:r.rec.dbg.filter(m=>/reproject/.test(m))}); }
  await playDay("2026-11-18",t=>t.subjectKey==="reading"&&t.who==="kid_a");
  await sweepAt("2026-11-18");
  // Thursday 11/19
  await rollDay("2026-11-19");
  { // S8 — Thu 9:30: delete a subject (kid_a History)
    const histCards=board().filter(t=>t.who==="kid_a"&&t.subjectKey==="history"); const histChecked=histCards.filter(t=>checkedMap()[t.id]).map(t=>t.id);
    const r=await step("S8 Thu 9:30 delete a subject (kid_a History)",hm("2026-11-19",9,30),async()=>{ A.set("ceEditKid","kid_a"); A.set("ceEditKey","history"); A.fn("ceDeleteSubject")(); },{expectRelay:true,ignoreIds:histCards.map(t=>t.id)});
    const left=board().filter(t=>t.who==="kid_a"&&t.subjectKey==="history");
    ok("S8: the subject is gone from the record, its open cards are off the week, its checked cards stay as records",!A.get("currData.subjects.kid_a").history&&left.every(t=>checkedMap()[t.id])&&left.length===histChecked.length,{had:histCards.length,left:left.map(t=>t.day+" "+t.id),dbg:r.rec.dbg.slice(0,4)}); }
  await playDay("2026-11-19",t=>(t.subjectKey==="math"&&t.who==="kid_c")||(t.subjectKey==="phonics"&&t.who==="kid_c"));
  { // S9 — Thu 8 PM sweep
    const openBefore=board().filter(t=>t.day==="thursday"&&!checkedMap()[t.id]&&t.lid&&!t._eowOverflow).map(t=>t.who+"/"+t.subjectKey+" "+t.lid);
    const r=await step("S9 Thu 8:00 PM the sweep",hm("2026-11-19",20,0),async()=>{ return A.fn("mlEveningSweep")(false); },{expectRelay:true,noWholeNode:false});
    const stillThu=board().filter(t=>t.day==="thursday"&&!checkedMap()[t.id]&&t.lid&&!t._eowOverflow&&!t._dayDrop);
    ok("S9: Thursday's unfinished lessons moved into Friday (or the box), none left open on Thursday; the sweep ran once (marker)",r.rec.actOut===true&&!stillThu.length&&!!db.get("week2/eveningSweep/thursday"),{before:openBefore,still:stillThu.map(t=>t.who+"/"+t.subjectKey+" "+t.time)});
    ok("S9: the sweep's line does not call its own moves of today's started-but-unfinished cards 'held cards changed' (the tripwire is for other doors)",!!r.entry&&!(r.entry.locked&&r.entry.locked.length),r.entry&&{label:r.entry.label,locked:r.entry.locked});
    ok("S9: the sweep's one whole-node tasks write is the cascade's own (known), from Mom's device only",r.ws.filter(w=>w.whole).every(w=>w.dev===A.id)&&r.ws.filter(w=>w.whole).length<=1,r.ws.filter(w=>w.whole).map(w=>w.dev+" "+w.path)); }
  // Friday 11/20
  await rollDay("2026-11-20");
  { // S10 — Fri 9:00: Saturday on (the 📅 strip) → the Saturday tab + the dailies that name Saturday (F3, TWSSAT) → Undo → redo → off → on
    const satDaily=t=>t.day==="saturday"&&((t.who==="kid_a"&&t.subjectKey==="piano")||(t.who==="kid_b"&&t.subjectKey==="baking"));
    const r=await step("S10 Fri 9:00 Saturday on (📅 This week)",hm("2026-11-20",9,0),async()=>{ A.fn("twsToggleSaturday")(); },{expectRelay:true});
    const satCards=board().filter(satDaily);
    ok("S10: weekConfig/2/saturday is true and the effective config says Saturday on",db.get("weekConfig/2/saturday")===true&&satOn(2));
    ok("F3 (TWSSAT): the board week has its Saturday tab (week2/meta/dates/saturday, the build's own words) on both devices",db.get("week2/meta/dates/saturday")==="November 21"&&A.get("DAY_DT.saturday")==="November 21"&&B.get("DAY_DT.saturday")==="November 21",{db:db.get("week2/meta/dates/saturday"),a:A.get("DAY_DT.saturday"),b:B.get("DAY_DT.saturday")});
    ok("F3: the dailies that name Saturday are laid on it (kid_a Piano, kid_b Baking); no lesson was laid on Saturday by the toggle",satCards.length===2&&!r.entry.added.some(id=>{ const t=boardObj()[id]; return !t||!satDaily(t); }),{sat:board().filter(t=>t.day==="saturday").map(t=>t.who+"/"+t.subjectKey+" "+t.time),added:r.entry&&r.entry.added});
    ok("F3: the what-moved line names them and lists their cards as added",!!r.entry&&/Piano \(Kid A\)/.test(r.entry.label)&&/Baking \(Kid B\)/.test(r.entry.label)&&satCards.every(t=>(r.entry.added||[]).indexOf(t.id)>=0),r.entry&&{label:r.entry.label,added:r.entry.added});
    ok("F3: the writes are targeted (the setting, the date leaf, the cards) — no whole-node write",!r.ws.some(w=>w.whole)&&r.ws.some(w=>w.op==="update"),r.ws.map(w=>w.op+" "+w.path).slice(0,8));
    const e=r.entry; if(e){ A.fn("relayUndo")(String(e.at)); await flush(8000);
      ok("S10 Undo: the setting, the Saturday tab and the Saturday dailies are gone again",!db.get("weekConfig/2/saturday")&&!satOn(2)&&db.get("week2/meta/dates/saturday")==null&&!board().some(satDaily)&&!A.get("DAY_DT.saturday")&&!B.get("DAY_DT.saturday"),{cfg:db.get("weekConfig/2/saturday"),date:db.get("week2/meta/dates/saturday"),sat:board().filter(satDaily).map(t=>t.id)});
      const F=checkAll({dbgMark:db.debug.length}); ok("S10 Undo: the week checks clean after the undo",!F.length,F.slice(0,5).map(f=>f.code+" "+f.msg));
      await step("S10b Fri 9:05 Saturday on again (after Undo)",hm("2026-11-20",9,5),async()=>{ A.fn("twsToggleSaturday")(); },{expectRelay:true});
      ok("S10b: the tab and both Saturday dailies are back",db.get("week2/meta/dates/saturday")==="November 21"&&board().filter(satDaily).length===2); }
    const other=board().filter(t=>t.day==="saturday"&&!satDaily(t));
    const r3=await step("S10c Fri 9:10 Saturday off",hm("2026-11-20",9,10),async()=>{ A.fn("twsToggleSaturday")(); },{expectRelay:true});
    ok("S10c: Saturday off takes the Saturday dailies off; the tab "+(other.length?"stays (the sweep's overflow card sits there) and the line says so":"goes"),!board().some(t=>satDaily(t)&&!checkedMap()[t.id])&&(other.length?db.get("week2/meta/dates/saturday")==="November 21"&&/the Saturday tab stays \(1 card on it\)/.test(r3.entry&&r3.entry.label):db.get("week2/meta/dates/saturday")==null),{other:other.map(t=>t.who+"/"+t.subjectKey),date:db.get("week2/meta/dates/saturday"),label:r3.entry&&r3.entry.label});
    await step("S10d Fri 9:15 Saturday on (for the rest of the replay)",hm("2026-11-20",9,15),async()=>{ A.fn("twsToggleSaturday")(); },{expectRelay:true});
    ok("S10d: Saturday is on with both Saturday dailies (the tab was kept, so only the cards are written)",satOn(2)&&board().filter(satDaily).length===2); }
  await playDay("2026-11-20",t=>t.subjectKey==="math"&&t.who==="kid_b");
  await sweepAt("2026-11-20");
  // Saturday 11/21
  { const r=await step("S11 Sat 00:00 the day rolls (no build)",hm("2026-11-21",0,0)+30000,async()=>{ devices().forEach(d=>d.fn("dayRollCheck")()); },{settleMs:60000});
    ok("S11: Saturday is not a new week — nothing built, week 2 still active",WK()==="week2"&&!db.get("week3/tasks"),{wk:WK()}); }
  // Sunday 11/22 — the next week builds
  const wk2Open=board().filter(t=>!checkedMap()[t.id]&&!String(t.id).endsWith("_c")&&t.lid&&subjects()[t.who]&&subjects()[t.who][t.subjectKey]).map(t=>t.who+"/"+t.subjectKey+" "+t.lid);
  { const mark=db.log.length;
    const r=await step("S12 Sun 00:00 the next week builds (both devices awake)",hm("2026-11-22",0,0)+30000,async()=>{ devices().forEach(d=>d.fn("dayRollCheck")()); },{settleMs:120000,noWholeNode:false});
    const ws=db.log.slice(mark); const txs=ws.filter(w=>w.op==="tx"&&w.path==="week3/meta/building"&&w.committed), sets=ws.filter(w=>w.op==="set"&&w.path==="week3/tasks");
    ok("S12: week 3 is active on both devices, built once",WK()==="week3"&&A.get("WK")==="week3"&&B.get("WK")==="week3"&&txs.length===1&&sets.length>=1&&sets.length<=2,{wk:WK(),a:A.get("WK"),b:B.get("WK"),tx:txs.length,sets:sets.length});
    const served=wk2Open.filter(x=>{ const [ks,l]=x.split(" "); const [k,s]=ks.split("/"); return board().some(t=>t.who===k&&t.subjectKey===s&&t.lid===l); });
    ok("S12: every lesson left open in week 2 is served in week 3 (nothing lost or skipped at the turn)",served.length===wk2Open.length,{open:wk2Open.length,served:served.length,missing:wk2Open.filter(x=>served.indexOf(x)<0).slice(0,8)});
    ok("S12: week 2 is archived with its checks and history",!!db.get("archive/week2")&&Object.keys((db.get("archive/week2")||{}).checked||{}).length>0);
    const added=["kid_c/music","kid_b/geography"]; const inWk3=added.map(x=>{ const [k,s]=x.split("/"); return x+":"+board().filter(t=>t.who===k&&t.subjectKey===s).length; });
    const geo3=board().filter(t=>t.who==="kid_b"&&t.subjectKey==="geography"), gsub=A.get("currData.subjects.kid_b.geography"), gdone=Object.keys(((A.get("currData.done")||{}).kid_b||{}).geography||{});
    const gPat=["monday","wednesday","friday"].filter(dn=>!A.fn("smapIsKidOff")("kid_b",weekDates(3)[dn]));
    ok("F2 (ADDPB): week 3 deals ONE Geography card per pattern day (no catch-up doubling), the next undone lessons in order",gPat.every(dn=>geo3.filter(t=>t.day===dn).length===1)&&geo3.length===gPat.length&&geo3.slice().sort((a,b)=>DN.indexOf(a.day)-DN.indexOf(b.day)).map(t=>t.lid).join()===gsub.lessonIds.filter(l=>gdone.indexOf(l)<0).slice(0,gPat.length).join(),{cards:geo3.map(t=>t.day+" "+t.time+" "+t.lid),pattern:gPat,done:gdone});
    ok("S12: the subjects added mid-week are in the new week; the deleted one is not",board().some(t=>t.who==="kid_c"&&t.subjectKey==="music")&&board().some(t=>t.who==="kid_b"&&t.subjectKey==="geography")&&!board().some(t=>t.who==="kid_a"&&t.subjectKey==="history"),inWk3);
    // Sunday catch-up for kid_a: what shows on Sunday's tab
    clock.now=hm("2026-11-22",9,0); const set=A.fn("sucSet")(); const sunCards=set?Array.from(set):[];
    // kid_a's lessons that were on week 2's board at some point and are still not done = what "fell behind" last week (the harness's own account, to judge SUCPB by)
    const behindA=[]; Object.keys(SEEN_LIDS[2]||{}).filter(k=>/^kid_a\//.test(k)).forEach(k=>{ const [kid,sk]=k.split("/"); const done=((A.get("currData.done")||{})[kid]||{})[sk]||{}; SEEN_LIDS[2][k].forEach(l=>{ if(!done[l]) behindA.push(k+" "+l); }); });
    const sunIds=new Set(sunCards); const sunList=board().filter(t=>sunIds.has(t.id));
    const arch=db.get("archive/week2")||{}; const r6=board().find(t=>t.who==="kid_a"&&t.subjectKey==="reading"&&t.lid==="L0006");
    ok("F4 (SUCPB) premise: kid_a's Reading L0006 was sent to next week in week 2 (S8) and the archive of week 2 says so (deferred)",behindA.indexOf("kid_a/reading L0006")>=0&&((arch.deferred||{}).kid_a||{}).reading&&arch.deferred.kid_a.reading.indexOf("L0006")>=0&&!!r6,{behind:behindA,deferred:arch.deferred||null});
    ok("F4 (SUCPB): Sunday's tab shows kid_a's deferred Reading L0006 (Sunday catch-up on for kid_a)",!!r6&&sunIds.has(r6.id),{sunday:sunList.map(t=>t.who+"/"+t.subjectKey+" "+t.day+" "+t.lid)});
    ok("F4: Sunday shows only what week 2 still owed — kid_a's plan-backed lessons from the archive (open at the close or sent to next week), each subject's earliest cards; nothing for a kid without Sunday catch-up",sunList.length>0&&sunList.every(t=>t.who==="kid_a"&&t.lid&&behindA.indexOf(t.who+"/"+t.subjectKey+" "+t.lid)>=0),{sunday:sunList.map(t=>t.who+"/"+t.subjectKey+" "+t.lid),behind:behindA});
    // a lesson checked off on Sunday keeps its place; the others stay on Sunday
    if(r6){ const before=Array.from(sunIds).sort().join(); clock.now=hm("2026-11-22",9,40); B.fn("finalizeDone")(r6.id,B.fn("nowTs")()); await flush(6000);
      const after=Array.from(A.fn("sucSet")()||[]).sort().join();
      ok("F4: checking the Sunday Reading off keeps every other Sunday card on Sunday (the count is read from the board, not from 'done')",after===before&&!!checkedMap()[r6.id],{before,after}); } }

  // ── the table ──
  console.log("\n3. steps × checks");
  const codes=["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","C12","C14","C15","ERR"];
  console.log("   step | "+codes.join(" | ")+" | writes | whole-node");
  STEPS.forEach(s=>{ const by={}; (s.failures||[]).forEach(f=>{ by[f.code]=(by[f.code]||0)+1; }); console.log("   "+s.name.slice(0,60).padEnd(60)+" | "+codes.map(c=>String(by[c]||"·").padStart(3)).join(" | ")+" | "+String((s.writes||{}).total||0).padStart(5)+" | "+((s.writes||{}).whole||[]).length); });
  if(process.env.DEMO_JSON){ fs.writeFileSync(process.env.DEMO_JSON,JSON.stringify({steps:STEPS,pass,fail,debugLines:db.debug.length},null,1)); console.log("   step table written to "+process.env.DEMO_JSON); }
  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.log("HARNESS ERROR",e&&e.stack||e); process.exit(2); });
