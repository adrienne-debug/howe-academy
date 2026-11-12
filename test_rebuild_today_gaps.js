/*
 * 🌞 RTGAPS — two gaps in RTLIVE ("a mid-day rebuild or regenerate acts on the rest of TODAY"), her "Yes, fix both" 2026-11-12.
 * Both were found by a family copy testing mid-day on Thu 2026-11-12, after RTLIVE was live there:
 *   1. ➕ make-up on TODAY after school starts made no card. The ➕ wrote scheduleOverrides/<today>/<kid>/added/<sk> and nothing
 *      re-laid. Now it lays one card today by rule 4's placement (after now, ending by school end, the next lesson); one that can't
 *      fit lays nothing and a toast says so. Before school, after school end and on other days: exactly as before.
 *   2. A lesson marked done for today with no card was not counted: the mark re-paced the subject and rule 4 laid the NEXT lesson
 *      on today — a 5th sitting in a 4×/week week. Now a lesson marked done for a date is that day's sitting and counts toward that
 *      ISO week's ×/wk (rule 4's check, and the Grid's dealt charge plan._wkUsed).
 *
 * The SYNTHETIC demo family (no real names or data), reshaped like the live week as test_rebuild_today_live.js does: one kid's
 * Builder-paced subjects run Mon/Tue/Wed/Fri at 4×/week, with Mon–Thu in a week with no co-op; Friday is a holiday.
 * The whole app runs in the vm sandbox of test_demo_week.js (test_fixtures/demo_week_sandbox.js), one virtual clock.
 *   run: node test_rebuild_today_gaps.js        (RT_VERBOSE=1 echoes the app's console)
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const SRC=fs.readFileSync(INDEX,"utf8");

let pass=0, fail=0;
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,700)+")":"")); } }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dnOf=iso=>DN[new Date(iso+"T12:00:00").getDay()];
const THU="2026-11-12", KID="kid_c", SUBJ=["math","phonics","art"];

// ── the family: the demo fixture, reshaped like the live week. o.notThu: Art's Days only (Thursday is not one of its days),
// o.tpw: Art's ×/wk, o.noHoliday: Friday is a school day ──
function familyDb(o){
  o=o||{};
  const d=JSON.parse(JSON.stringify(FX.db));
  if(!o.noHoliday) d.calendar.holidays={day_off:{name:"Day off",start:"2026-11-13",end:"2026-11-13",pause:"school"}};
  const subs=d.curriculum.subjects[KID];
  SUBJ.forEach(sk=>{ const s=subs[sk]; s.allowedDays=["Mon","Tue","Wed","Fri"]; s.noCoopDays=["Mon","Tue","Wed","Thu"]; s.timesPerWeek=4; s.pacing=Object.assign({},s.pacing,{tpw:4}); });
  if(o.notThu) delete subs.art.noCoopDays;
  if(o.tpw){ subs.art.timesPerWeek=o.tpw; subs.art.pacing.tpw=o.tpw; }
  const L=d.curriculum.lessons[KID]; Object.keys(L).forEach(dn=>{ const r=L[dn]; if(r&&new Date(r.date+"T12:00:00").getDay()===4) SUBJ.forEach(sk=>{ delete r[sk]; }); });
  const art=subs.art.lessonSeq.slice(); Object.keys(L).map(Number).sort((a,b)=>a-b).forEach(dn=>{ const r=L[dn]; delete r.art; const g=new Date(r.date+"T12:00:00").getDay(); if(g!==4&&art.length) r.art=art.shift(); });
  return d;
}

// ── one world: boot Sunday 11/8, week 1 builds itself, Mon–Wed are played (every card checked), Thursday morning ──
async function world(o){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const db=S.makeDb(familyDb(o),clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  const A=S.bootDevice({name:"A (Mom)",dev:"dev_a",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.RT_VERBOSE});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  A.run("globalThis.__toasts=[]; gwShowToast=function(m){ globalThis.__toasts.push(String(m)); };");
  const W={A,db,clock,sched,flush,
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id),
    checked:()=>db.get(W.wk()+"/checked")||{},
    ref:p=>db.api("dev_t").ref(p),
    toasts:()=>A.get("globalThis.__toasts").slice()};
  W.play=async(iso,untilMin)=>{
    const dn=dnOf(iso); const ck=W.checked();
    const cards=W.board().filter(t=>t.day===dn&&!ck[t.id]&&!String(t.id).endsWith("_c")&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null)
      .sort((a,b)=>toMin(a.time)-toMin(b.time)||String(a.id).localeCompare(b.id));
    for(const t of cards){ const end=toMin(t.time)+(+t.dur||20); if(untilMin!=null&&end>untilMin) continue; if(iso===THU&&t.who===KID&&SUBJ.indexOf(t.subjectKey)>=0) continue;
      const at=hm(iso,Math.floor(end/60),end%60); if(at>clock.now) clock.now=at;
      if(!A.tasks().some(x=>x.id===t.id)) continue;
      A.fn("finalizeDone")(t.id,A.fn("nowTs")()); await flush(4000); }
  };
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; A.fn("dayRollCheck")(); await flush(90000); };
  W.days=async(list)=>{ for(const iso of list){ if(iso!=="2026-11-09") await W.roll(iso); else clock.now=hm(iso,8,0); await W.play(iso); } };
  W.mine=sk=>W.board().filter(t=>t.who===KID&&t.subjectKey===sk&&!String(t.id).endsWith("_c"));
  W.on=(sk,day)=>W.mine(sk).filter(t=>t.day===day&&!t._eowOverflow&&!t._dayDrop);
  W.thu=sk=>W.on(sk,"thursday");
  W.dropOn=async(sk,day)=>{ for(const t of W.on(sk,day)){ if(!W.checked()[t.id]) await W.ref(W.wk()+"/tasks/"+t.id).remove(); } await flush(5000); };
  W.dropThu=sk=>W.dropOn(sk,"thursday");
  W.makeup=async(atMs,iso,sk)=>{ clock.now=atMs; A.fn("lmAddSubj")(KID,iso,sk); await flush(60000); };
  W.markDone=async(atMs,sk,dayISO)=>{ clock.now=atMs; const s=A.get("currData.subjects."+KID+"."+sk); const lid=W.nextLid(sk); const text=s.lessonSeq[s.lessonIds.indexOf(lid)];
    A.fn("_ceMarkDoneApply")(KID,sk,[text],dayISO||""); await flush(60000); return lid; };
  W.rebuildAll=async(atMs)=>{ clock.now=atMs; A.set("cbKid",KID); A.fn("cbRebuildAll")(); await flush(60000); };
  W.regenerate=async(atMs)=>{ clock.now=atMs; A.fn("schedRegenerateNow")(); await flush(60000); };
  W.nextLid=sk=>{ const s=A.get("currData.subjects."+KID+"."+sk); const done=new Set(Object.keys(A.get("currData.done."+KID+"."+sk)||{})); return s.lessonIds.find(l=>!done.has(l)); };
  W.snapChecked=()=>{ const ck=W.checked(), o={}; W.board().forEach(t=>{ if(ck[t.id]) o[t.id]={day:t.day,time:t.time,ck:ck[t.id]}; }); return o; };
  W.sameChecked=(before)=>{ const now=W.snapChecked(); const bad=[]; Object.keys(before).forEach(id=>{ const a=before[id], b=now[id]; if(!b||b.day!==a.day||b.time!==a.time||b.ck!==a.ck) bad.push(id); }); return bad; };
  W.boardSig=()=>W.board().map(t=>t.id+"@"+t.day+" "+t.time+(t._dayDrop?" D":"")+(t._eowOverflow?" E":"")).sort().join("|");
  W.doubled=()=>{ const c={}, out=[]; W.board().forEach(t=>{ if(!t.lid||String(t.id).endsWith("_c")||t._eowOverflow) return; const k=t.who+"/"+t.subjectKey+"/"+t.lid; c[k]=(c[k]||0)+1; if(c[k]===2) out.push(k); }); return out; };
  W.endMin=()=>A.fn("dtEM")("thursday",toMin("3:30 PM"),THU);
  W.added=sk=>{ const a=((((db.get("scheduleOverrides")||{})[THU]||{})[KID]||{}).added)||{}; return a[sk]; };
  return W;
}
const desc=ts=>ts.map(t=>t.day+" "+t.time+" "+t.lid);

(async()=>{
  console.log("── the block is marked and the rule cited");
  {
    const a=SRC.indexOf("// RTGAPS_START"), b=SRC.indexOf("// RTGAPS_END");
    ok("RTGAPS block present with her words and the date",a>=0&&b>a&&/Yes, fix both/.test(SRC.slice(a,b))&&/2026-11-12/.test(SRC.slice(a,b)));
    ok("the ➕ door (lmAddSubj) calls the make-up re-lay",/function lmAddSubj[\s\S]{0,400}rtlMakeupRelay\(kid,dateStr,sk\)/.test(SRC));
  }

  console.log("\n── GAP 1a. the live case: ➕ make-up on today mid-day, on a subject due today with no card");
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    await W.play(THU,toMin("10:25 AM")); await W.dropThu("art");
    ok("premise: Art has no Thursday card",!W.thu("art").length,desc(W.mine("art")));
    const ck0=W.snapChecked(), want=W.nextLid("art");
    await W.makeup(hm(THU,10,32),THU,"art");
    ok("the ➕ is saved as a make-up on today",W.added("art")===true,W.added("art"));
    const art=W.thu("art");
    ok("➕ on today lays ONE Art card on Thursday",art.length===1,desc(W.mine("art")));
    if(art.length){ const st=toMin(art[0].time);
      ok("…after now (10:32) and ending by school end",st>=toMin("10:32 AM")&&st+(+art[0].dur||30)<=W.endMin(),art[0].time+" +"+art[0].dur);
      ok("…carrying Art's next undone lesson",art[0].lid===want,{lid:art[0].lid,want});
      ok("…open (not checked)",!W.checked()[art[0].id]); }
    ok("checked cards untouched",!W.sameChecked(ck0).length,W.sameChecked(ck0));
    ok("no lesson on two cards",!W.doubled().length,W.doubled());
    ok("Math and Phonics keep their one Thursday card",W.thu("math").length===1&&W.thu("phonics").length===1,{m:desc(W.thu("math")),p:desc(W.thu("phonics"))});
  }

  console.log("\n── GAP 1b. a make-up rides on top: today is not one of its days AND its ×/wk is used up");
  {
    const W=await world({notThu:true,tpw:3}); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    await W.play(THU,toMin("10:25 AM"));
    ok("premise: Art (Mon/Tue/Wed/Fri, 3×/wk) has its three cards Mon–Wed and none Thursday",!W.thu("art").length&&W.mine("art").filter(t=>!t._eowOverflow).length===3,desc(W.mine("art")));
    await W.rebuildAll(hm(THU,10,30));
    ok("premise: a mid-day rebuild alone lays nothing on Thursday (not due)",!W.thu("art").length,desc(W.mine("art")));
    await W.makeup(hm(THU,10,40),THU,"art");
    const art=W.thu("art");
    ok("➕ on today lays one Art card on Thursday anyway",art.length===1,desc(W.mine("art")));
    if(art.length) ok("…after now and ending by school end",toMin(art[0].time)>=toMin("10:40 AM")&&toMin(art[0].time)+(+art[0].dur||30)<=W.endMin(),art[0].time);
    ok("no lesson on two cards",!W.doubled().length,W.doubled());
  }

  console.log("\n── GAP 1c. mid-day but it doesn't fit before school ends: nothing laid, and a toast says so");
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    await W.play(THU,toMin("3:05 PM")); await W.dropThu("art");
    const sig0=W.boardSig();
    await W.makeup(hm(THU,15,10),THU,"art");
    ok("no Art card on Thursday",!W.thu("art").length,desc(W.mine("art")));
    ok("a toast says the make-up doesn't fit today",W.toasts().some(m=>/make-up doesn’t fit before school ends today/.test(m)),W.toasts());
    ok("nothing else on the board moved",W.boardSig()===sig0);
  }

  console.log("\n── GAP 1d. before school, after school end, another day: exactly as before (the ➕ only saves)");
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    W.clock.now=hm(THU,8,20); await W.dropThu("art");
    const sig0=W.boardSig();
    await W.makeup(hm(THU,8,30),THU,"art");
    ok("before school: the ➕ is saved",W.added("art")===true);
    ok("before school: the board is unchanged",W.boardSig()===sig0,desc(W.mine("art")));
  }
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    await W.play(THU,toMin("3:30 PM")); await W.dropThu("art");
    const sig0=W.boardSig();
    await W.makeup(hm(THU,15,45),THU,"art");
    ok("after school end: the board is unchanged",W.boardSig()===sig0,desc(W.mine("art")));
    ok("after school end: no toast",!W.toasts().length,W.toasts());
  }
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    await W.play(THU,toMin("10:25 AM")); await W.dropThu("art");
    const sig0=W.boardSig();
    await W.makeup(hm(THU,10,32),"2026-11-16","art");
    ok("mid-day, a ➕ on another day (next Monday): the board is unchanged",W.boardSig()===sig0,desc(W.mine("art")));
  }

  console.log("\n── GAP 2a. the live case: Mark done today on a subject with no card today → no extra card");
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10","2026-11-11"]); await W.roll(THU);
    await W.play(THU,toMin("10:25 AM")); await W.dropThu("art");
    const ck0=W.snapChecked(), n0=W.mine("art").length;
    const lid=await W.markDone(hm(THU,11,51),"art","");
    const rec=(W.db.get("curriculum/done/"+KID+"/art")||{})[lid]||{};
    ok("premise: the lesson is recorded done today by hand",rec.day===THU&&rec.src==="manual",rec);
    ok("no Art card is laid on Thursday (today's sitting is the hand-marked lesson)",!W.thu("art").length,desc(W.mine("art")));
    ok("no Art card was added anywhere this week",W.mine("art").length===n0,desc(W.mine("art")));
    ok("rule 4 reads it: rtlDueToday is false for Art",W.A.fn("rtlDueToday")(KID,"art",{todayDay:"thursday",todayISO:THU,tasks:W.A.tasks()})===false);
    await W.rebuildAll(hm(THU,12,5));
    ok("a mid-day Rebuild all after it lays no Art card on Thursday either",!W.thu("art").length,desc(W.mine("art")));
    await W.regenerate(hm(THU,12,15));
    ok("…nor a mid-day Regenerate",!W.thu("art").length,desc(W.mine("art")));
    ok("checked cards untouched",!W.sameChecked(ck0).length,W.sameChecked(ck0));
    ok("a ➕ make-up today is satisfied by the hand-marked lesson too",W.A.run("scheduleOverrides['"+THU+"']={"+KID+":{added:{art:true}}}; rtlDueToday('"+KID+"','art',{todayDay:'thursday',todayISO:'"+THU+"',tasks:weekData.tasks})")===false);
  }

  console.log("\n── GAP 2b. counts toward the week's ×/wk: Mon–Wed had THREE sittings, one of them marked by hand (no card)");
  {
    const W=await world(); await W.days(["2026-11-09","2026-11-10"]); await W.roll("2026-11-11");   // Wednesday morning, nothing played yet
    // Wednesday's Art card is taken off and its lesson marked done by hand for Wednesday; Thursday's Art card taken off too
    const wedArt=W.on("art","wednesday")[0];
    ok("premise: Art has an open Wednesday card",!!wedArt&&!W.checked()[wedArt.id],desc(W.mine("art")));
    if(wedArt) await W.ref(W.wk()+"/tasks/"+wedArt.id).remove();
    await W.dropOn("art","thursday"); await W.flush(5000);
    const lid=W.nextLid("art");
    W.A.run("(currData.done."+KID+".art=currData.done."+KID+".art||{})['"+lid+"']={day:'2026-11-11',src:'manual',via:'mark'}");
    ok("rtlDueToday (Wednesday) is false: the hand-marked lesson is today's sitting",W.A.fn("rtlDueToday")(KID,"art",{todayDay:"wednesday",todayISO:"2026-11-11",tasks:W.A.tasks()})===false);
    ok("Thursday, 3 sittings this week (Mon, Tue cards + Wednesday by hand) of 4: rule 4 still lays Thursday's",W.A.fn("rtlDueToday")(KID,"art",{todayDay:"thursday",todayISO:THU,tasks:W.A.tasks()})===true);
    W.A.run("currData.done."+KID+".art['L9999']={day:'2026-11-10',src:'manual',via:'mark'}");
    ok("…and with a 4th done by hand (Tuesday) the week is full: not due",W.A.fn("rtlDueToday")(KID,"art",{todayDay:"thursday",todayISO:THU,tasks:W.A.tasks()})===false);
    W.A.run("delete currData.done."+KID+".art['L9999']");
  }

  console.log("\n── GAP 2c. the plain path: the Grid's dealt charge (plan._wkUsed) counts a lesson done by hand with no card");
  {
    const W=await world({noHoliday:true}); await W.days(["2026-11-09","2026-11-10","2026-11-11"]);
    W.clock.now=hm("2026-11-11",15,45); await W.flush(5000);
    await W.dropOn("art","thursday"); await W.dropOn("art","friday");
    const planThisWeek=()=>{ const col=W.A.fn("gvDerivedColumn")(KID,"art")||{}; const bd=col.byDate||{}; return Object.keys(bd).filter(d=>d>"2026-11-11"&&d<="2026-11-15"&&bd[d]&&bd[d].src!=="card").sort(); };
    const before=planThisWeek();
    ok("premise: Mon–Wed cards (3 of 4) → the Grid projects ONE more sitting this week",before.length===1,{before,art:desc(W.mine("art"))});
    const tue=W.on("art","tuesday")[0];
    ok("premise: Art has a Tuesday card",!!tue);
    // Tuesday's sitting becomes a lesson marked done by hand (no card): the same three sittings
    if(tue){ const ck=W.checked()[tue.id]; W.A.run("weekData.tasks=weekData.tasks.filter(function(t){ return t.id!=='"+tue.id+"'; })");
      const L=W.A.get("currData.done."+KID+".art")||{}; const recLid=Object.keys(L).find(l=>L[l]&&L[l].taskId===tue.id)||tue.lid;
      W.A.run("currData.done."+KID+".art['"+recLid+"']={day:'2026-11-10',src:'manual',via:'mark'}");
      const mid=planThisWeek();
      ok("Tuesday by hand instead of on a card: still ONE more sitting this week (it charges the week like a card)",mid.length===1,{mid,ck});
      W.A.run("currData.done."+KID+".art['L9998']={day:'2026-11-11',src:'manual',via:'mark'}");
      const after=planThisWeek();
      ok("a 4th sitting done by hand (Wednesday): the Grid projects nothing more this week",after.length===0,after);
      W.A.run("delete currData.done."+KID+".art['L9998']");
    }
  }

  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
