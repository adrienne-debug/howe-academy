/*
 * ↩ SBREOPEN — a study session Mom sends back puts its schedule card back on the kid's day, live, and it stays open until
 * the kid really redoes the sitting. Her ask 2026-11-12: "Can we make it where these study sessions, when I send them back,
 * it doesn't need a reload? It automatically auto-generates it and puts it back? It did send them back when I reloaded it,
 * but then it repopulated and made them disappear again."
 *
 * The live day (Thu 11/12): a kid's study sittings were saved and their daily study cards ticked 11:51–12:01; at 12:54–12:55
 * Mom's ↩ Send back removed today's logs and reopened the sessions, but the cards stayed ✓ — Send back never touched the day —
 * and a kid page did not repaint on a mastery change, so nothing showed until a reload, and after it the cards were still done.
 *
 * Replayed on the SYNTHETIC demo family (no real names or data), two devices on one virtual clock and one fake database
 * (test_fixtures/demo_week_sandbox.js): A = Mom's phone (Mom mode), B = the kid's iPad. kid_c's daily "Reading" card is
 * linked to a study session, as the live daily study cards are.
 *   1. 11:43 the sitting saves; 11:52 the kid ticks the card on B.
 *   2. 12:54 Mom's ↩ Send back on A → with no reload, B shows the card open (checked + history gone), the session sent back.
 *   3. Nothing re-checks it: 15 minutes of cascades; a stale history record on B; the kid's own ✓ on B is refused.
 *   4. The redo sitting saves on B → the kid's ✓ works, and Mom's device A sees that tick (no session-long strip).
 *   run: node test_sendback_reopen.js        (SB_VERBOSE=1 echoes the app's console)
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
const sbCall=(dev,name,...a)=>{ try{ return dev.fn(name)(...a); }catch(e){ return "missing: "+name; } };   // a build without SBREOPEN fails these, it doesn't crash
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const THU="2026-11-12", DAYKEY="20261112", KID="kid_c", SK="reading_app", SID="words";

// ── the family: the demo fixture + one study session linked to kid_c's daily Reading card ──
function familyDb(){
  const d=JSON.parse(JSON.stringify(FX.db));
  d.curriculum.subjects[KID][SK].study=SID;
  d.mastery={};
  d.mastery[KID+"_sessions"]={[SID]:{name:"Word cards",emoji:"\u{1F4DA}",decks:["Words"],kind:"deck",who:"kid"}};
  d.mastery[KID]=["cat","sun","map","pig"].map((w,i)=>({id:"c_w"+i,prompt:w,subject:"Words",status:"active",tier:"daily",tally_dots:i,consecutive_correct:0,cycle:1,drop_count:0,next_due:1}));
  return d;
}
// what a sitting's save writes (mstSave): today's log entry with the cards' state from before it
function sittingEntry(secs){
  return {date:DAYKEY,printNum:1,total:4,correct:4,miss:0,shown:0,secs,items:["cat","sun","map","pig"].map((w,i)=>({id:"c_w"+i,name:w,deck:"Words",result:"c"})),
    sits:[{secs,total:4}],before:[0,1,2,3].map(i=>({id:"c_w"+i,st:{status:"active",tier:"daily",tally_dots:i,consecutive_correct:0,cycle:1,drop_count:0,next_due:1}}))};
}

async function world(){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const db=S.makeDb(familyDb(),clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  const A=S.bootDevice({name:"A (Mom)",dev:"dev_a",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.SB_VERBOSE});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  for(const iso of ["2026-11-09","2026-11-10","2026-11-11",THU]){ clock.now=hm(iso,0,0)+30000; A.fn("dayRollCheck")(); await flush(90000); }
  clock.now=hm(THU,8,0);
  const B=S.bootDevice({name:"B (kid)",dev:"dev_b",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.SB_VERBOSE});
  await flush(60000);
  const W={A,B,db,clock,sched,flush,
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    ref:(dev,p)=>db.api(dev).ref(p),
    at:async(h,m,ms)=>{ const t=hm(THU,h,m); if(t>clock.now) clock.now=t; await flush(ms==null?5000:ms); }};
  W.card=dev=>(dev||A).tasks().find(t=>t&&t.who===KID&&t.subjectKey===SK&&t.day==="thursday"&&!String(t.id).endsWith("_c"));
  W.dbChecked=id=>db.get(W.wk()+"/checked/"+id);
  W.dbHist=id=>db.get(W.wk()+"/history/"+id);
  return W;
}

(async()=>{
  console.log("── the block is marked and the rule cited");
  { const a=SRC.indexOf("// SBREOPEN_START"), b=SRC.indexOf("// SBREOPEN_END");
    ok("SBREOPEN block present with her words and the date",a>=0&&b>a&&/2026-11-12/.test(SRC.slice(a,b))&&/doesn't need a reload/.test(SRC.slice(a,b)));
    const sb=SRC.slice(SRC.indexOf("function mstSendBackDo("),SRC.indexOf("// MSTALERT_END"));
    ok("Send back reopens the card (mstSendBackDo → sbReopen)",/sbReopen\(kid,sid\)/.test(sb));
    const blk=SRC.slice(a,b);
    ok("the reopen writes only targeted paths, never a whole node",/db\.ref\(WK\+"\/checked"\)\.update\(ck\)/.test(blk)&&/db\.ref\(WK\+"\/history"\)\.update\(hu\)/.test(blk)&&!/ref\(WK\+"\/(checked|history)"\)\.set\(/.test(blk));
    ok("the reopen's writes are inert in a dry run",/live=typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)/.test(blk)&&/if\(live\)\{ db\.ref/.test(blk));
    ok("no kid or family name literals in the block",!/\b(lincoln|ellis|lucy|julian|howe|adrienne)\b/i.test(blk)); }

  const W=await world();
  const {A,B,db}=W;
  let card=W.card(A);
  ok("premise: it is Thursday on both devices",A.get("_todayDay")==="thursday"&&B.get("_todayDay")==="thursday",[A.get("_todayDay"),B.get("_todayDay")]);
  ok("premise: kid_c has a Thursday Reading card linked to the study session",!!card&&((A.fn("gwGetSubjects")(KID)||{})[SK]||{}).study===SID,card&&{id:card.id,time:card.time});
  if(!card){ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(1); }
  const id=card.id;

  console.log("\n── 1. 11:43 the sitting saves on the kid's iPad; 11:52 the kid ticks the card");
  await W.at(11,43);
  await W.ref("dev_b","mastery/studyLog/"+KID+"/"+SID+"/"+DAYKEY).set(sittingEntry(548));
  await W.flush(5000);
  await W.at(11,52);
  ok("the kid's ✓ goes through",B.fn("finalizeDone")(id,B.fn("nowTs")())!==false);
  await W.flush(10000);
  ok("premise: checked + history are in the database",!!W.dbChecked(id)&&!!W.dbHist(id),{ck:W.dbChecked(id),h:!!W.dbHist(id)});
  ok("premise: Mom's device shows it done",!!A.get("checked")[id]);
  const staleHist=JSON.parse(JSON.stringify(W.dbHist(id)));

  console.log("\n── 2. 12:54 Mom's ↩ Send back on her phone — the kid's iPad is NOT reloaded");
  await W.at(12,54);
  let repaints=0; const _ras=B.get("renderAllSoon"); B.set("renderAllSoon",function(){ repaints++; return _ras.apply(this,arguments); });
  A.fn("mstSendBackDo")(KID,SID,{sit:0});
  await W.flush(10000);
  ok("the database: the card's check is removed",W.dbChecked(id)==null,W.dbChecked(id));
  ok("the database: the card's history is removed",W.dbHist(id)==null);
  ok("the database: today's sitting log is removed and the send-back is recorded",db.get("mastery/studyLog/"+KID+"/"+SID+"/"+DAYKEY)==null&&!!db.get("mastery/studyBack/"+KID+"/"+SID+"/ts"));
  ok("Mom's device shows the card open",!A.get("checked")[id]);
  ok("the kid's iPad shows the card open — no reload",!B.get("checked")[id],B.get("checked")[id]);
  ok("the kid's iPad knows the session was sent back (its card says redo it)",B.fn("mstSentBackPending")(KID,SID)===true);
  ok("the kid's iPad repainted",repaints>0,repaints);
  card=W.card(B);
  ok("the card is still on today",!!card&&card.day==="thursday",card&&card.day);
  { const laid=(B.fn("mlQueueLay")(JSON.parse(JSON.stringify(B.tasks())))||[]).find(t=>t&&t.id===id);   // the kid's day as drawn: re-laid from now
    ok("…and the kid's day lays it now, not in the past (it ends after 12:54)",!!laid&&toMin(laid.time)+(+laid.dur||20)>toMin("12:54 PM"),laid&&(laid.time+" +"+laid.dur)); }
  ok("its spin is held for the re-tick, not deleted",(()=>{ const r=(A.fn("ld")(W.wk()+"_spin_results")||{})[id]; return !r||A.fn("spinOnceHeld")(r)||!A.fn("spinRecParts")(r).some(p=>p&&p.pts>0&&!p.held); })());

  console.log("\n── 2b. a send-back alone (no card change) repaints a kid page; another mastery write does not");
  { B.set("tab","schedule"); let n=0; const f=B.get("renderAllSoon"); B.set("renderAllSoon",function(){ n++; return f.apply(this,arguments); });
    await W.ref("dev_a","mastery/"+KID+"/0/cue").set("say it slowly"); await W.flush(3000);
    ok("a card-field write to mastery doesn't repaint the page",n===0,n);
    await W.ref("dev_a","mastery/studyBack/"+KID+"/other").update({ts:W.clock.now,date:DAYKEY}); await W.flush(3000);
    ok("a send-back record arriving repaints the page",n>0,n);
    await W.ref("dev_a","mastery/studyBack/"+KID+"/other").remove(); await W.flush(3000); }

  console.log("\n── 3. nothing re-checks it until the kid redoes the sitting");
  await W.at(13,9,60000);
  ok("15 minutes of cascades later: still open in the database",W.dbChecked(id)==null,W.dbChecked(id));
  ok("…and on both devices",!A.get("checked")[id]&&!B.get("checked")[id]);
  B.run("histState["+JSON.stringify(id)+"]="+JSON.stringify(staleHist));
  B.fn("runCascade")(); await W.flush(5000);
  ok("a stale history record on the iPad does not restore the check",W.dbChecked(id)==null&&!B.get("checked")[id],W.dbChecked(id));
  B.run("delete histState["+JSON.stringify(id)+"]");
  ok("the kid's own ✓ before the redo is refused",B.fn("finalizeDone")(id,B.fn("nowTs")())===false);
  await W.flush(5000);
  ok("…nothing was written",W.dbChecked(id)==null&&W.dbHist(id)==null);
  ok("Mom's ✓ is not locked (Mom mode)",sbCall(A,"sbKidLock",W.card(A))===false&&sbCall(B,"sbKidLock",W.card(B))===true);

  console.log("\n── 4. 1:20 the redo sitting saves on the iPad → the kid ticks it, and Mom's phone sees the tick");
  await W.at(13,20);
  await W.ref("dev_b","mastery/studyLog/"+KID+"/"+SID+"/"+DAYKEY).set(sittingEntry(610));
  await W.ref("dev_b","mastery/studyBack/"+KID+"/"+SID).update({redoneTs:W.clock.now,redoSecs:610,redoTotal:4});
  await W.flush(5000);
  ok("the redo clears the hold",sbCall(B,"sbHeld",W.card(B))===false);
  ok("the kid's ✓ after the redo goes through",B.fn("finalizeDone")(id,B.fn("nowTs")())!==false);
  await W.flush(10000);
  ok("the database has the new check",!!W.dbChecked(id),W.dbChecked(id));
  ok("Mom's phone shows it done — her send-back doesn't hide the kid's re-tick",!!A.get("checked")[id],A.get("checked")[id]);

  console.log("\n── 5. a send-back from an earlier day never locks today's card");
  { const B2=B; const b=B2.get("masteryData.studyBack."+KID+"."+SID);
    B2.run("masteryData.studyBack."+KID+"."+SID+"={ts:"+hm("2026-11-11",17,26)+",date:'20261111'}");
    ok("yesterday's un-redone send-back doesn't hold today's card",sbCall(B2,"sbHeld",W.card(B2))===false);
    B2.run("masteryData.studyBack."+KID+"."+SID+"="+JSON.stringify(b)); }

  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
