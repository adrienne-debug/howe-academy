/*
 * test_house_checkoff.js — Household by room, step 4 "Switch on" (DESIGN_household_rooms_2026-11-15 §4.4, §5; HOUSEDAY in index.html):
 * a house chore on the stored plan is checked by CHORE. The whole app runs on two devices (Mom's phone A, a kid's tablet B) over one
 * in-memory Firebase (test_fixtures/house_world.js, a made-up family), so every write below is a real write of the real code.
 *   · two devices open on the same morning: one claim wins, the day is built once, both show the same plan;
 *   · ✓ pays the chore's stars through bankDirect, stores the exact amount and the bank id on houseDay/<iso>/done/<id>, stamps
 *     lastDone / lastBy / doneN / kidRun and keeps what was there in `prev`; the Click-off Log gets its "on" line;
 *   · un-✓ removes exactly that bank entry and puts lastDone / lastBy / counters back (an every-N chore keeps its older date);
 *   · Mom-checks-before-pay holds the stars (held:true); Mom's un-check leaves "↩︎ Mom undid" and the log's undo tag;
 *   · OFF / ON: a chore done under the plan reads done on the old list, its un-check there reverses the plan's own payment, and a
 *     chore checked on the old list reads done on the plan — never paid twice.
 *   run: node test_house_checkoff.js
 */
"use strict";
const path=require("path"), W=require(path.join(__dirname,"test_fixtures","house_world.js"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
const MON="2026-11-16";
const idx=(d,slot,kid,id,dn)=>d.run("(rtStepsFor('"+slot+"','"+kid+"',false,'"+(dn||"monday")+"')||[]).findIndex(function(s){ return s&&s.house==='"+id+"'; })");
const rawIdx=(d,slot,kid,id)=>d.run("(rtStepsFor('"+slot+"','"+kid+"',true)||[]).findIndex(function(s){ return s&&s._hh==='"+id+"'; })");
const bankOf=(w,kid)=>w.get("bank/"+kid+"/adjustments")||{};
const sum=o=>Object.values(o).reduce((a,x)=>a+(x&&!x.held?(x.amount||0):0),0);
const tick=(d,slot,kid,i)=>d.run(slot==="morning"?"toggleMorningStep('"+kid+"',"+i+")":"toggleRtStep('"+slot+"','"+kid+"',"+i+")");

(async()=>{
console.log("\n── two devices open on the same morning ──");
{ const w=await W.world({mode:"on"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush();
  const m=w.mark(); await w.at(2026,11,16,7,0);
  const tx=w.since(m).filter(l=>l.op==="tx"&&l.path==="houseDay/"+MON+"/built");
  ok("both devices asked for the claim; exactly one won", tx.length>=2&&tx.filter(l=>l.committed).length===1, tx.map(l=>[l.dev,l.committed]));
  const ups=w.since(m).filter(l=>l.op==="update"&&(l.keys||[]).some(k=>k.indexOf("houseDay/"+MON+"/plan/")===0));
  ok("the day was written once, by the winner, in one update of targeted paths", ups.length===1&&ups[0].keys.every(k=>/^houseDay\/2026-11-16\/(plan|over|miss)\/[\w]+$|^houseDay\/2026-11-16\/built\/(ok|sig)$/.test(k)), ups.map(u=>[u.dev,u.keys.length]));
  const pa=A.run("JSON.stringify(houseDayData['"+MON+"'].plan)"), pb=B.run("JSON.stringify(houseDayData['"+MON+"'].plan)");
  ok("both devices show the same stored plan", pa===pb&&pa.length>20);
  await w.tick(); ok("a later tick builds nothing again", w.since(m).filter(l=>l.op==="update"&&(l.keys||[]).some(k=>k.indexOf("/plan/")>0)).length===1);
  // a second world where the first claim is held by a device that dies before writing: after the claim's 2 minutes another device builds
  const w2=await W.world({mode:"on"}); const C=w2.boot("C","devC",{mom:true}); await w2.flush();
  w2.db.tree.root.houseDay=Object.assign({},w2.db.tree.root.houseDay,{[MON]:{built:{dev:"devDead",at:new Date(2026,10,16,6,59).getTime()}}});
  await w2.at(2026,11,16,7,0); ok("a fresh claim held by another device: nobody builds yet", !w2.get("houseDay/"+MON+"/built/ok"));
  await w2.at(2026,11,16,7,3); ok("…after 2 minutes the claim is stale and this device builds the day", !!w2.get("houseDay/"+MON+"/built/ok")&&w2.get("houseDay/"+MON+"/built/dev")==="devC");
}

console.log("\n── ✓ pays, un-✓ takes back exactly what was paid ──");
const w=await W.world({mode:"on"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,16,30);
{ const i=idx(B,"chores","kid_a","c_a_dishes"); ok("the plan row is on kid_a's Chores list", i>=0, i);
  const b0=sum(bankOf(w,"kid_a")); tick(B,"chores","kid_a",i); await w.flush();
  const d=w.get("houseDay/"+MON+"/done/c_a_dishes")||{}, J=w.get("household/jobs/c_a_dishes");
  ok("✓ stores who, the amount and the bank id", d.who==="kid_a"&&d.pts===10&&!!d.bid, d);
  ok("✓ pays 10 ⭐ through the bank (one entry, that id)", sum(bankOf(w,"kid_a"))-b0===10&&!!bankOf(w,"kid_a")[d.bid]);
  ok("✓ stamps lastDone / lastBy / doneN / kidRun", J.lastDone===MON&&J.lastBy==="kid_a"&&J.doneN===1&&J.kidRun===1, J);
  ok("✓ keeps what was there before in prev (no date yet: stored as nothing)", d.prev&&!d.prev.lastDone&&d.prev.doneN===0&&d.prev.kidRun===0, d.prev);
  const rl=Object.values(((w.get("routineLog/kid_a")||{})[B.get("activeWk()")]||{}).monday||{}); ok("✓ writes the Click-off Log 'on' line", rl.some(x=>x.act==="on"&&x.label==="Unload the dishwasher"&&x.pts===10));
  ok("both devices read it as done (by chore)", A.run("rtDoneOn('chores','kid_a','monday',"+idx(A,"chores","kid_a","c_a_dishes")+")")===true&&B.run("rtDoneOn('chores','kid_a','monday',"+i+")")===true);
  const ok0=rawIdx(B,"chores","kid_a","c_a_dishes"), mk=(w.get(B.get("activeWk()")+"/sl")||{})[B.get("activeWk()")+"_monday_kid_a_cstep"+ok0];
  ok("the owner's own (hidden) old row is marked done with 0 ⭐ (hd)", mk&&mk.done===true&&mk.pts===0&&mk.hd===MON, mk);
  tick(B,"chores","kid_a",i); await w.flush();
  const J2=w.get("household/jobs/c_a_dishes");
  ok("un-✓ removes the done record", !w.get("houseDay/"+MON+"/done/c_a_dishes"));
  ok("un-✓ removes exactly that bank entry (balance back where it was)", sum(bankOf(w,"kid_a"))===b0&&!bankOf(w,"kid_a")[d.bid]);
  ok("un-✓ puts lastDone / lastBy / counters back (none before)", !J2.lastDone&&!J2.lastBy&&!J2.doneN&&!J2.kidRun, J2);
  const mk2=(w.get(B.get("activeWk()")+"/sl")||{})[B.get("activeWk()")+"_monday_kid_a_cstep"+ok0]; ok("…and clears the owner mark", !(mk2&&mk2.done));
}
{ const i=idx(B,"chores","kid_b","c_b_mop"); tick(B,"chores","kid_b",i); await w.flush();
  ok("an every-N chore: ✓ moves lastDone to today", w.get("household/jobs/c_b_mop/lastDone")===MON);
  tick(B,"chores","kid_b",i); await w.flush();
  ok("…and un-✓ puts its older date back (2026-11-07)", w.get("household/jobs/c_b_mop/lastDone")==="2026-11-07");
}
console.log("\n── Mom-checks-before-pay and Mom's undo ──");
{ B.set("choreVerify",{kid_a:true}); const i=idx(B,"chores","kid_a","c_a_dishes"); tick(B,"chores","kid_a",i); await w.flush();
  const d=w.get("houseDay/"+MON+"/done/c_a_dishes"), a=bankOf(w,"kid_a")[d.bid];
  ok("Mom checks first → the stars are held (held:true), not spendable", a&&a.held===true&&a.amount===10, a);
  tick(B,"chores","kid_a",i); await w.flush(); ok("un-✓ of a held one removes it", !bankOf(w,"kid_a")[d.bid]); B.set("choreVerify",{});
  tick(B,"chores","kid_a",i); await w.flush(); const d2=w.get("houseDay/"+MON+"/done/c_a_dishes"), b1=sum(bankOf(w,"kid_a"));
  const j=idx(A,"chores","kid_a","c_a_dishes"); A.run("mdKidTick('chores','kid_a','monday',"+j+")"); await w.flush();
  const adj=Object.values(bankOf(w,"kid_a"));
  ok("Mom's un-check keeps the paid entry and banks the reversal as “↩︎ Mom undid”", !!bankOf(w,"kid_a")[d2.bid]&&adj.some(x=>x.amount===-10&&/Mom undid/.test(x.note))&&sum(bankOf(w,"kid_a"))===b1-10);
  const rl=Object.values(((w.get("routineLog/kid_a")||{})[A.get("activeWk()")]||{}).monday||{}); ok("…and the log's off line carries undo:mom", rl.some(x=>x.act==="off"&&x.undo==="mom"));
  ok("…and the plan record is gone", !w.get("houseDay/"+MON+"/done/c_a_dishes"));
}
console.log("\n── OFF / ON: never paid twice ──");
{ const i=idx(B,"chores","kid_c","c_c_toys"); const b0=sum(bankOf(w,"kid_c")); tick(B,"chores","kid_c",i); await w.flush(); const d=w.get("houseDay/"+MON+"/done/c_c_toys");
  ok("done under the plan: 5 ⭐", sum(bankOf(w,"kid_c"))-b0===5);
  w.db.api("test").ref("household/meta/engine").set({mode:"off",on:"2026-11-09"}); await w.flush();
  const r=rawIdx(B,"chores","kid_c","c_c_toys");
  ok("switched OFF: the old row is back and reads done", B.run("(rtStepsFor('chores','kid_c',false,'monday')||[])["+r+"].cad")!=="none"&&B.run("rtDoneOn('chores','kid_c','monday',"+r+")")===true);
  tick(B,"chores","kid_c",r); await w.flush();
  ok("its un-check there reverses the plan's own payment (balance back, bank id gone, record gone)", sum(bankOf(w,"kid_c"))===b0&&!bankOf(w,"kid_c")[d.bid]&&!w.get("houseDay/"+MON+"/done/c_c_toys"));
  tick(B,"chores","kid_c",r); await w.flush(); ok("checked again on the old list: paid once (5 ⭐)", sum(bankOf(w,"kid_c"))-b0===5);
  w.db.api("test").ref("household/meta/engine").set({mode:"on",on:"2026-11-09"}); await w.flush();
  const i2=idx(B,"chores","kid_c","c_c_toys"); ok("switched ON again: the plan row reads done (checked on the list)", i2>=0&&B.run("rtDoneOn('chores','kid_c','monday',"+i2+")")===true);
  const n0=Object.keys(bankOf(w,"kid_c")).length; tick(B,"chores","kid_c",i2); await w.flush();
  ok("…and tapping it is the old row's un-check (not a second pay)", sum(bankOf(w,"kid_c"))===b0&&B.run("rtDoneOn('chores','kid_c','monday',"+i2+")")===false, [sum(bankOf(w,"kid_c"))-b0,Object.keys(bankOf(w,"kid_c")).length-n0]);
  tick(B,"chores","kid_c",i2); await w.flush(); ok("…and a fresh ✓ pays once, by chore", sum(bankOf(w,"kid_c"))-b0===5&&!!w.get("houseDay/"+MON+"/done/c_c_toys"));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})().catch(e=>{ console.log("CRASH",e.stack); process.exit(1); });
