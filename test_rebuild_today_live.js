/*
 * 🌞 RTLIVE — a Mom's rebuild or regenerate DURING the school day acts on the rest of TODAY, not only tomorrow.
 * Her four rules (2026-11-12, "we need the schedule live for changes current not tomorrow" → "yes"):
 *   1. During the school day, a rebuild or regenerate treats the rest of today as open, from now until school ends.
 *   2. Cards already checked or claimed stay exactly as they are (day, time, id, check).
 *   3. Today's OPEN lesson cards stay on today. A regenerate never deletes them.
 *   4. A subject due today by its day rules (Days, or the no-co-op days in a week with no co-op — subjDaysFor) with no card
 *      today gets one, laid after now, only if it fits before school ends; otherwise it goes to the next school day as before.
 *
 * Replays the live case (a family copy, week 6, Thu 2026-11-12) on the SYNTHETIC demo family (no real names or data): one kid's
 * two Builder-paced subjects run Mon/Tue/Wed/Fri, with Mon–Thu in a week with no co-op; Friday is a holiday. The 10:32 AM
 * Rebuild all laid nothing on Thursday for the third such subject, which had no card; the 10:56 AM Regenerate REMOVED the two
 * open Thursday cards (one at 11:29 AM, one at 2:50 PM) and did not lay them again.
 *
 * The whole app runs in the vm sandbox of test_demo_week.js (test_fixtures/demo_week_sandbox.js), one virtual clock.
 *   run: node test_rebuild_today_live.js        (RT_VERBOSE=1 echoes the app's console)
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

// ── the family: the demo fixture, reshaped like the live week ──
function familyDb(){
  const d=JSON.parse(JSON.stringify(FX.db));
  d.calendar.holidays={day_off:{name:"Day off",start:"2026-11-13",end:"2026-11-13",pause:"school"}};
  const subs=d.curriculum.subjects[KID];
  SUBJ.forEach(sk=>{ const s=subs[sk]; s.allowedDays=["Mon","Tue","Wed","Fri"]; s.noCoopDays=["Mon","Tue","Wed","Thu"]; s.timesPerWeek=4; s.pacing=Object.assign({},s.pacing,{tpw:4}); });
  // the Grid's cells were laid on the Days (Mon/Tue/Wed/Fri) before the no-co-op days were set — no Thursday cell
  const L=d.curriculum.lessons[KID]; Object.keys(L).forEach(dn=>{ const r=L[dn]; if(r&&new Date(r.date+"T12:00:00").getDay()===4) SUBJ.forEach(sk=>{ delete r[sk]; }); });
  // Art's cells follow the same Days (the fixture had it on Fridays only)
  const art=subs.art.lessonSeq.slice(); Object.keys(L).map(Number).sort((a,b)=>a-b).forEach(dn=>{ const r=L[dn]; delete r.art; const g=new Date(r.date+"T12:00:00").getDay(); if(g!==4&&art.length) r.art=art.shift(); });
  return d;
}

// ── one world: boot Sunday 11/8, week 1 builds itself, Mon–Wed are played (every card checked), Thursday morning ──
async function world(){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const db=S.makeDb(familyDb(),clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  const A=S.bootDevice({name:"A (Mom)",dev:"dev_a",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.RT_VERBOSE});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  const W={A,db,clock,sched,flush,
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id),
    checked:()=>db.get(W.wk()+"/checked")||{},
    ref:p=>db.api("dev_t").ref(p)};
  // play a day: check off every card (at its end time) that ends by `untilMin`
  // (Thursday: the three subjects' cards are left open — they are what the replay is about)
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
  for(const iso of ["2026-11-09","2026-11-10","2026-11-11"]){ if(iso!=="2026-11-09") await W.roll(iso); else clock.now=hm(iso,8,0); await W.play(iso); }
  await W.roll(THU);
  W.mine=sk=>W.board().filter(t=>t.who===KID&&t.subjectKey===sk&&!String(t.id).endsWith("_c"));
  W.thu=sk=>W.mine(sk).filter(t=>t.day==="thursday"&&!t._eowOverflow&&!t._dayDrop);
  W.rebuildAll=async(atMs)=>{ clock.now=atMs; A.set("cbKid",KID); A.fn("cbRebuildAll")(); await flush(60000); };
  W.regenerate=async(atMs)=>{ clock.now=atMs; A.fn("schedRegenerateNow")(); await flush(60000); };
  W.dropThu=async sk=>{ for(const t of W.thu(sk)){ await W.ref(W.wk()+"/tasks/"+t.id).remove(); } await flush(5000); };
  W.setTime=async(t,time)=>{ await W.ref(W.wk()+"/tasks/"+t.id+"/time").set(time); await flush(5000); };
  W.snapChecked=()=>{ const ck=W.checked(), o={}; W.board().forEach(t=>{ if(ck[t.id]) o[t.id]={day:t.day,time:t.time,ck:ck[t.id]}; }); return o; };
  W.sameChecked=(before)=>{ const now=W.snapChecked(); const bad=[]; Object.keys(before).forEach(id=>{ const a=before[id], b=now[id]; if(!b||b.day!==a.day||b.time!==a.time||b.ck!==a.ck) bad.push(id+" "+JSON.stringify(a)+" → "+JSON.stringify(b||null)); }); return bad; };
  // outside the school day a regenerate still re-mints a daily under a new id (unchanged): every check survives on its own day
  W.checksByKey=()=>{ const ck=W.checked(), o={}; W.board().forEach(t=>{ if(ck[t.id]){ const k=t.who+"|"+(t.title||"")+"|"+t.day; (o[k]=o[k]||[]).push(ck[t.id]); } }); Object.keys(o).forEach(k=>o[k].sort()); return JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]])); };
  W.doubled=()=>{ const c={}, out=[]; W.board().forEach(t=>{ if(!t.lid||String(t.id).endsWith("_c")||t._eowOverflow) return; const k=t.who+"/"+t.subjectKey+"/"+t.lid; c[k]=(c[k]||0)+1; if(c[k]===2) out.push(k); }); return out; };
  W.endMin=()=>A.fn("dtEM")("thursday",toMin("3:30 PM"),THU);
  return W;
}

(async()=>{
  console.log("── the block is marked and the rule cited");
  ok("RTLIVE block present with her rules and the date",SRC.indexOf("// RTLIVE_START")>=0&&SRC.indexOf("// RTLIVE_END")>SRC.indexOf("// RTLIVE_START")&&/2026-11-12/.test(SRC.slice(SRC.indexOf("// RTLIVE_START"),SRC.indexOf("// RTLIVE_END"))));

  console.log("\n── 1. the live case: Thu 10:32 AM Rebuild all, then 10:56 AM Regenerate");
  {
    const W=await world();
    ok("premise: week 1 built and Mon–Wed played; it is Thursday",W.wk()==="week1"&&W.A.get("_todayDay")==="thursday",{wk:W.wk(),day:W.A.get("_todayDay")});
    ok("premise: Math and Phonics each have a Thursday card (their no-co-op days); Art's is taken off (the live 'no card')",W.thu("math").length===1&&W.thu("phonics").length===1&&W.thu("art").length===1,SUBJ.map(sk=>sk+":"+W.thu(sk).length));
    await W.play(THU,toMin("10:25 AM"));
    await W.setTime(W.thu("phonics")[0],"11:29 AM"); await W.setTime(W.thu("math")[0],"2:50 PM"); await W.dropThu("art");
    const keep={math:W.thu("math")[0], phonics:W.thu("phonics")[0]};
    ok("premise: two OPEN lesson cards later today (11:29 AM, 2:50 PM), Art has none",!W.checked()[keep.math.id]&&!W.checked()[keep.phonics.id]&&!W.thu("art").length);
    const ck0=W.snapChecked();
    ok("premise: some of today's cards are already checked",Object.values(ck0).some(c=>c.day==="thursday"),Object.keys(ck0).length);

    await W.rebuildAll(hm(THU,10,32));
    const art=W.thu("art");
    ok("rule 4 (rebuild): Art — due today, no card — gets ONE card on Thursday",art.length===1,W.mine("art").map(t=>t.day+" "+t.time+" "+t.lid));
    if(art.length){ const a=art[0], st=toMin(a.time);
      ok("rule 4: it is laid after now (10:32) and ends by school end",st>=toMin("10:32 AM")&&st+(+a.dur||30)<=W.endMin(),a.time+" +"+a.dur);
      const s=W.A.get("currData.subjects."+KID+".art"); const done=new Set(Object.keys(W.A.get("currData.done."+KID+".art")||{}));
      ok("rule 4: it carries Art's next undone lesson",a.lid===s.lessonIds.find(l=>!done.has(l)),{lid:a.lid});
      ok("rule 4: it is open (not checked)",!W.checked()[a.id]); }
    ok("rule 3 (rebuild): the two open Thursday cards are still on Thursday with their lessons",W.thu("math").some(t=>t.lid===keep.math.lid)&&W.thu("phonics").some(t=>t.lid===keep.phonics.lid),{math:W.thu("math").map(t=>t.lid+" "+t.time),phon:W.thu("phonics").map(t=>t.lid+" "+t.time)});
    ok("rule 2 (rebuild): every checked card is exactly as it was (day, time, check)",!W.sameChecked(ck0).length,W.sameChecked(ck0));
    ok("no lesson is on two cards",!W.doubled().length,W.doubled());

    const ck1=W.snapChecked(); const artId=(W.thu("art")[0]||{}).id;
    await W.regenerate(hm(THU,10,56));
    ok("the regenerate ran (week rewritten from now)",W.db.debug.some(d=>/regen: committed wk1/.test(d.msg)),W.db.debug.slice(-5).map(d=>d.msg));
    ok("rule 3 (regenerate): Phonics' open 11:29 AM card is still on Thursday, same card",W.thu("phonics").some(t=>t.id===keep.phonics.id),W.mine("phonics").map(t=>t.day+" "+t.time+" "+t.id));
    ok("rule 3 (regenerate): Math's open 2:50 PM card is still on Thursday, same card",W.thu("math").some(t=>t.id===keep.math.id),W.mine("math").map(t=>t.day+" "+t.time+" "+t.id));
    ok("rule 3 (regenerate): the Art card the rebuild laid today is still on Thursday",!!artId&&W.thu("art").some(t=>t.id===artId),W.mine("art").map(t=>t.day+" "+t.time+" "+t.id));
    ok("rule 2 (regenerate): every checked card is exactly as it was",!W.sameChecked(ck1).length,W.sameChecked(ck1));
    ok("no lesson is on two cards after the regenerate",!W.doubled().length,W.doubled());
    ok("no open card of these subjects sits before now today",SUBJ.every(sk=>W.thu(sk).every(t=>W.checked()[t.id]||toMin(t.time)>=toMin("10:56 AM"))),SUBJ.map(sk=>W.thu(sk).map(t=>t.time)));
  }

  console.log("\n── 2. mid-day Regenerate alone: the subject due today with no card gets one after now");
  {
    const W=await world();
    await W.play(THU,toMin("10:25 AM")); await W.dropThu("art");
    const ck0=W.snapChecked();
    await W.regenerate(hm(THU,10,56));
    const art=W.thu("art");
    ok("rule 4 (regenerate): Art gets one Thursday card",art.length===1,W.mine("art").map(t=>t.day+" "+t.time+" "+t.lid));
    if(art.length) ok("rule 4: laid after now and ends by school end",toMin(art[0].time)>=toMin("10:56 AM")&&toMin(art[0].time)+(+art[0].dur||30)<=W.endMin(),art[0].time);
    ok("rule 2: checked cards untouched",!W.sameChecked(ck0).length,W.sameChecked(ck0));
    ok("no lesson on two cards",!W.doubled().length,W.doubled());
  }

  console.log("\n── 3. before school: unchanged (today is laid by its pattern like any day)");
  {
    const W=await world();
    W.clock.now=hm(THU,8,20); await W.dropThu("art");
    await W.rebuildAll(hm(THU,8,30));
    ok("a rebuild at 8:30 AM lays Art on Thursday (the 🌅 before-school rule, as before)",W.thu("art").length===1,W.mine("art").map(t=>t.day+" "+t.time));
    await W.regenerate(hm(THU,8,40));
    ok("a regenerate at 8:40 AM keeps Math, Phonics and Art each once on Thursday",SUBJ.every(sk=>W.thu(sk).length===1),SUBJ.map(sk=>sk+":"+W.thu(sk).map(t=>t.time).join("/")));
    ok("before school nothing is laid before the day's start",SUBJ.every(sk=>W.thu(sk).every(t=>toMin(t.time)>=toMin("9:00 AM"))));
    ok("no lesson on two cards",!W.doubled().length,W.doubled());
  }

  console.log("\n── 4. after school ends: nothing is laid on today");
  {
    const W=await world();
    await W.play(THU,toMin("3:30 PM")); await W.dropThu("art");
    const thu0=W.board().filter(t=>t.day==="thursday").map(t=>t.id).sort().join();
    await W.rebuildAll(hm(THU,15,45));
    ok("a rebuild at 3:45 PM lays nothing on Thursday",!W.thu("art").length&&W.board().filter(t=>t.day==="thursday").map(t=>t.id).sort().join()===thu0,W.mine("art").map(t=>t.day+" "+t.time));
    const ck1=W.checksByKey(), thu1=W.board().filter(t=>t.day==="thursday"&&!W.checked()[t.id]).length;
    await W.regenerate(hm(THU,15,50));
    ok("a regenerate at 3:50 PM lays no Art card on Thursday",!W.thu("art").length,W.mine("art").map(t=>t.day+" "+t.time));
    ok("…and no new open card on Thursday",W.board().filter(t=>t.day==="thursday"&&!W.checked()[t.id]).length<=thu1);
    ok("every check survives on its own day (the after-school regenerate is unchanged)",W.checksByKey()===ck1);
  }

  console.log("\n── 5. mid-day but it doesn't fit before school ends: not laid on today");
  {
    const W=await world();
    await W.play(THU,toMin("3:05 PM")); await W.dropThu("art");
    await W.rebuildAll(hm(THU,15,10));
    ok("a rebuild at 3:10 PM (30-min Art, school ends 3:30, Closing Notebook still to come) lays no Art card today",!W.thu("art").length,W.mine("art").map(t=>t.day+" "+t.time));
    ok("…and the day still ends by school end",W.board().filter(t=>t.who===KID&&t.day==="thursday"&&!W.checked()[t.id]&&!t._dayDrop&&!t._eowOverflow).every(t=>toMin(t.time)+(+t.dur||0)<=W.endMin()),W.board().filter(t=>t.who===KID&&t.day==="thursday").map(t=>t.time+" "+t.subjectKey));
  }

  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
