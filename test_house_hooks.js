/*
 * test_house_hooks.js — Household by room, step 4 "Switch on" (DESIGN_household_rooms_2026-11-15 §6 "List features", §4.3 doors,
 * §4.5 school first, §12 🌅 Send to next morning; HOUSEDAY in index.html, HOUSESWITCH in house.js). The whole app runs on a Mom
 * device (A) and a kid's tablet (B) over one in-memory Firebase (test_fixtures/house_world.js, a made-up family).
 *   1. The §6 checklist — ONE check per hook, each fails if that hook ignores a house row on the plan: rtComplete · rtSlotDone ·
 *      the late badge (rtLateDays = the plan's late) · rtWave (✕ today = skip) · cuUnpay (Mom's undo) · spPool (spot check) · the
 *      whole-list bonus · choresGateDone · mdSlotCounts · boardStatPop (Kids today pop-up, time of the tick) · kcChoresHTML (Kids'
 *      Corner) · slCellState · the morning gate · mdKidTick (Mom's tick) · the habits calendar.
 *   2. Carry: an overflow is first in line tomorrow with its late badge; a set-day chore dropped when its next day comes is logged
 *      "— not done" under the day it was due.
 *   3. 🌅 (§12): a carry opened BEFORE switch-on still points at its own row and finishes it there; one sent from a plan row is
 *      finished by chore (the three records), and a daily sent to the morning is still on its own next day.
 *   4. School first: house chores on a school-first kid's Chores list wait for school / the afternoon hour; a Morning-time chore
 *      does not; nothing waits with the switch off.
 *   5. Doors: → Give to…, Kid Off, the re-lay question (Re-lay today too / Keep today), 🔁 Re-lay today; Mom's and Dad's own ticks.
 *   6. Refused saves: the ON tap proves a houseDay save first — refused → the switch stays as it was and Mom is told; with the
 *      switch on and the save refused, that day's lists are the old ones (never empty) and By person says why.
 *   run: node test_house_hooks.js
 */
"use strict";
const fs=require("fs"), path=require("path"), W=require(path.join(__dirname,"test_fixtures","house_world.js"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,600)+")":"")); } };
const MON="2026-11-16", TUE="2026-11-17", WED="2026-11-18", HJS=fs.readFileSync(path.join(__dirname,"house.js"),"utf8");
const idx=(d,slot,kid,id,dn)=>d.run("(rtStepsFor('"+slot+"','"+kid+"',false,'"+(dn||d.get("_todayDay"))+"')||[]).findIndex(function(s){ return s&&s.house==='"+id+"'; })");
const rawIdx=(d,slot,kid,id)=>d.run("(rtStepsFor('"+slot+"','"+kid+"',true)||[]).findIndex(function(s){ return s&&s._hh==='"+id+"'; })");
const tick=(d,slot,kid,i)=>d.run(slot==="morning"?"toggleMorningStep('"+kid+"',"+i+")":"toggleRtStep('"+slot+"','"+kid+"',"+i+")");
const bankOf=(w,kid)=>Object.values(w.get("bank/"+kid+"/adjustments")||{});
const logOf=(w,d,kid,dn)=>Object.values(((w.get("routineLog/"+kid)||{})[d.get("activeWk()")]||{})[dn]||{});
const J=x=>JSON.stringify(x);

(async()=>{
console.log("\n── 1. the §6 list features, one check per hook ──");
{ const tree={config:Object.assign({},W.FX.db.config,{routineBonus:{chores:{kid_c:7}}})};
  const w=await W.world({mode:"on",tree}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,16,30);
  const i=idx(B,"chores","kid_c","c_c_toys"); ok("kid_c's Chores list has the plan row (and its old rows are hidden in place)", i>=0&&B.run("(rtStepsFor('chores','kid_c',false,'monday')||[]).filter(function(s){ return s.hdHidden; }).length")===2, i);
  ok("rtComplete: not complete while the plan row is open", B.run("rtComplete('chores','kid_c','monday')")===false);
  ok("rtSlotDone: not done while the plan row is open", B.run("rtSlotDone('kid_c','chores','monday')")===false);
  ok("choresGateDone: closed while the plan row is open", B.run("choresGateDone('kid_c','monday')")===false);
  ok("mdSlotCounts: the plan row is counted as due, not done", J(B.run("mdSlotCounts('chores','kid_c','monday')"))===J({due:1,done:0})||B.run("mdSlotCounts('chores','kid_c','monday').due")===1, B.run("mdSlotCounts('chores','kid_c','monday')"));
  ok("kcChoresHTML (Kids' Corner) lists the plan row", /Toys in the bin/.test(B.run("kcChoresHTML('kid_c')")));
  tick(B,"chores","kid_c",i); await w.flush();
  ok("rtComplete: complete once the plan row is checked", A.run("rtComplete('chores','kid_c','monday')")===true);
  ok("rtSlotDone / the list's own record flips to done", A.run("rtSlotDone('kid_c','chores','monday')")===true&&(w.get(A.get("activeWk()")+"/sl")||{})[A.get("activeWk()")+"_monday_kid_c_chores"].done===true);
  ok("slCellState reads it done", A.run("(function(){ const d=day; day='monday'; try{ return slCellState('chores','kid_c').done; } finally{ day=d; } })()")===true);
  ok("whole-list bonus: 7 ⭐ banked the moment the last plan row is checked", bankOf(w,"kid_c").some(a=>a.amount===7));
  ok("mdSlotCounts: counted done", B.run("mdSlotCounts('chores','kid_c','monday').done")===1);
  A.run("document.body.insertAdjacentHTML=function(p,h){ __pop=h; }; boardStatPop('kid_c','chores','monday')");
  ok("boardStatPop (Kids today pop-up): the plan row, ticked, with its time", /Toys in the bin/.test(A.get("__pop"))&&A.get("__pop").indexOf(w.get("houseDay/"+MON+"/done/c_c_toys").ts)>0);
  ok("spPool (spot check): a kid's own tick on a plan row is in the pool", A.run("spPool('kid_c','monday')").some(p=>p.label==="Toys in the bin"&&p.pts===5));
  ok("cuUnpay (Mom's undo): her un-check banks “↩︎ Mom undid”", (A.run("mdKidTick('chores','kid_c','monday',"+idx(A,"chores","kid_c","c_c_toys","monday")+")"),await w.flush(),bankOf(w,"kid_c").some(a=>a.amount===-5&&/Mom undid/.test(a.note))));
  ok("…and the bonus is taken back with the list (no longer complete)", bankOf(w,"kid_c").filter(a=>a.amount===7).length===0&&A.run("rtComplete('chores','kid_c','monday')")===false);
  // ✕ today = skip this time
  const j=idx(A,"chores","kid_a","c_a_dishes","monday"); A.run("rtWave('chores','kid_a','monday',"+j+")"); await w.flush();
  ok("rtWave on a plan row stores houseDay/<day>/skip/<id> and lastSkip", !!w.get("houseDay/"+MON+"/skip/c_a_dishes")&&w.get("household/jobs/c_a_dishes/lastSkip")===MON);
  ok("rtWaved reads it on both devices; it is no longer due on the list", A.run("rtWaved('chores','kid_a','monday',"+j+")")===true&&B.run("rtWaved('chores','kid_a','monday',"+idx(B,"chores","kid_a","c_a_dishes","monday")+")")===true);
  ok("…the waved line is in the Click-off Log", logOf(w,A,"kid_a","monday").some(x=>x.act==="wave"&&/Unload the dishwasher/.test(x.label)));
  A.run("rtWave('chores','kid_a','monday',"+j+")"); await w.flush();
  ok("a second ✕ today puts it back (skip, lastSkip and the log line gone)", !w.get("houseDay/"+MON+"/skip/c_a_dishes")&&!w.get("household/jobs/c_a_dishes/lastSkip")&&!logOf(w,A,"kid_a","monday").some(x=>x.act==="wave"));
  // the morning gate: a Morning-time house chore on the plan holds the Morning list like any row
  const m=idx(B,"morning","kid_a","c_a_morn"); ok("morning gate: a Morning-time plan row is on the Morning list", m>=0);
  B.run("toggleMorningStep('kid_a',"+B.run("morningStepsFor('kid_a').findIndex(function(s){ return s.label==='Brush teeth'; })")+");toggleMorningStep('kid_a',"+B.run("morningStepsFor('kid_a').findIndex(function(s){ return s.label==='Feed the fish'; })")+")"); await w.flush();
  ok("…morningComplete stays false until it is checked", B.run("morningComplete('kid_a','monday')")===false);
  tick(B,"morning","kid_a",m); await w.flush(); ok("…and true once it is", B.run("morningComplete('kid_a','monday')")===true);
  tick(B,"chores","kid_c",idx(B,"chores","kid_c","c_c_toys")); B.run("toggleMorningStep('kid_c',morningStepsFor('kid_c').findIndex(function(s){ return s.label===\"Fill the dog's water\"; }))"); await w.flush();
  await w.at(2026,11,17,7,0);
  ok("the habits calendar reads a past plan row by chore (kid_c did everything on Monday → a done day)", A.run("_calChoresFor('kid_c','"+MON+"')").some(c=>c.house==="c_c_toys")&&A.run("_calHabitsDone('kid_c','"+MON+"')")===true, A.run("_calHabitsDone('kid_c','"+MON+"')"));
}

console.log("\n── 2. carry and the logged miss ──");
{ const w=await W.world({mode:"on"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,7,0);
  ok("Monday: Vacuum the den (Mon + Thu) does not fit kid_a's 30 minutes — it fit nobody", !!w.get("houseDay/"+MON+"/over/c_a_vac")&&!w.get("houseDay/"+MON+"/plan/c_a_vac"));
  w.db.api("t").ref("household/people/kid_a/school").set(60); await w.flush(); await w.at(2026,11,17,7,0);
  const p=w.get("houseDay/"+TUE+"/plan/c_a_vac")||{};
  const pa=Object.values(w.get("houseDay/"+TUE+"/plan")||{}).filter(x=>x.who==="kid_a");
  ok("Tuesday: it is carried, first in line among kid_a's house chores, 1 day late", p.who==="kid_a"&&p.why==="carried"&&p.late===1&&pa.every(x=>x===p||x.order>p.order), p);
  const i=idx(B,"chores","kid_a","c_a_vac","tuesday"); ok("rtLateDays gives the plan's late (the red badge)", i>=0&&B.run("(function(){ const d=day; day='tuesday'; try{ return rtLateDays('chores','kid_a',"+i+"); } finally{ day=d; } })()")===1);
  ok("…and the list draws the late badge", /1 day late/.test(B.run("(function(){ const d=day; day='tuesday'; try{ return rtSlotHTML('chores','kid_a'); } finally{ day=d; } })()")));
  const b=w.get("houseDay/"+TUE+"/plan/c_b_mop")||{}; ok("an every-N chore past its date stays due and gets later (no carry record needed)", b.k==="every"&&b.late===3&&b.since==="2026-11-14", b);
  w.db.api("t").ref("household/people/kid_a/school").set(5); await w.flush(); await w.at(2026,11,18,7,0);
  await w.at(2026,11,19,7,0);
  ok("Thursday (its own next day): Monday's Vacuum is dropped — not on Thursday twice", !!(w.get("houseDay/2026-11-19/over/c_a_vac")||w.get("houseDay/2026-11-19/plan/c_a_vac"))&&!!w.get("houseDay/2026-11-19/miss/c_a_vac"));
  ok("…it fit nobody on Wednesday (kid_a's limit cut to 5), so Thursday's drop is Mom's to see — no kid gets a “— not done” line", (w.get("houseDay/2026-11-19/miss/c_a_vac")||{}).nobody===1&&!Object.values(((w.get("routineLog/kid_a")||{})[A.get("activeWk()")]||{})).some(dd=>Object.keys(dd).some(k=>k==="miss_h_c_a_vac")), w.get("houseDay/2026-11-19/miss/c_a_vac"));
}

console.log("\n── 2b. a miss is a kid's only if the chore was on that kid's list (hub review 2026-11-17) ──");
{ const allMiss=w=>{ const out=[]; const RL=w.get("routineLog")||{}; Object.keys(RL).forEach(k=>Object.keys(RL[k]||{}).forEach(wk=>Object.keys(RL[k][wk]||{}).forEach(dn=>Object.keys(RL[k][wk][dn]||{}).forEach(key=>{ if(/^miss_h_/.test(key)) out.push(k+"/"+dn+"/"+key); })))); return out; };
  const w=await W.world({mode:"on"}); const A=w.boot("A","devA",{mom:true}); await w.flush(); await w.at(2026,11,16,7,0);
  ok("Monday: Straighten the beds (daily) fits nobody — it is on no list", !!w.get("houseDay/"+MON+"/over/c_c_beds")&&!w.get("houseDay/"+MON+"/plan/c_c_beds"));
  await w.at(2026,11,17,7,0);
  const m=w.get("houseDay/"+TUE+"/miss/c_c_beds");
  ok("Tuesday (its next day): no “— not done” line for anyone — it was never on a kid's list", allMiss(w).length===0, allMiss(w));
  ok("…Mom still sees it dropped (miss marked fit nobody, no who)", !!m&&m.nobody===1&&!m.who, m);
  const w2=await W.world({mode:"on"}); const B=w2.boot("B","devB",{mom:true}); await w2.flush();
  w2.db.api("t").ref("household/people/kid_a/school").set(60); await w2.flush(); await w2.at(2026,11,16,7,0);
  ok("Monday: Vacuum the den (Mon + Thu) is on kid_a's list", (w2.get("houseDay/"+MON+"/plan/c_a_vac")||{}).who==="kid_a");
  await w2.at(2026,11,17,7,0); await w2.at(2026,11,18,7,0); await w2.at(2026,11,19,7,0);
  const L=allMiss(w2).filter(x=>/miss_h_c_a_vac$/.test(x));
  ok("left undone and dropped Thursday (its next day): exactly one line, kid_a's, under Monday (the day it was due)", L.length===1&&L[0]==="kid_a/monday/miss_h_c_a_vac", allMiss(w2));
  ok("…and no other kid line at all (every other drop that week only ever fit nobody)", allMiss(w2).length===1, allMiss(w2));
}

console.log("\n── 3. 🌅 Send to next morning (§12) ──");
{ const w=await W.world({mode:"preview"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,18,0);
  const r=rawIdx(A,"chores","kid_a","c_a_dishes"); A.run("amSend('chores','kid_a','monday',"+r+")"); await w.flush();
  const key=MON+"_cstep"+r; ok("before switch-on: a carry by position", !!w.get("amCarry/kid_a/"+key));
  w.db.api("t").ref("household/meta/engine").set({mode:"on",on:MON}); await w.flush(); await w.at(2026,11,17,7,0);
  ok("after switch-on the morning list still shows it, by its own label", B.run("amFor('kid_a','tuesday').map(function(x){ return x.label; })").indexOf("Unload the dishwasher")>=0);
  ok("…and the raw row at that position is still its own chore", B.run("rtStepsFor('chores','kid_a',true)["+r+"]._hh")==="c_a_dishes");
  B.run("amToggle('kid_a','"+key+"')"); await w.flush();
  const sk=B.get("activeWk()")+"_monday_kid_a_cstep"+r, s=(w.get(B.get("activeWk()")+"/sl")||{})[sk];
  ok("finishing it writes Monday's check-off on that same row (with pts and am)", s&&s.done&&s.pts===10&&s.am===TUE, s);
  ok("…the carry's own done and the history line", !!w.get("amCarry/kid_a/"+key+"/done")&&logOf(w,B,"kid_a","monday").some(x=>x.act==="on"&&x.am===TUE));
  ok("Tuesday's own Unload the dishwasher (a daily) is still on Tuesday's plan", !!w.get("houseDay/"+TUE+"/plan/c_a_dishes"));
  // a plan row sent to the morning: by chore
  await w.at(2026,11,17,18,0); const i=idx(A,"chores","kid_a","c_a_dishes","tuesday"); A.run("amSend('chores','kid_a','tuesday',"+i+")"); await w.flush();
  const hk=TUE+"_ch_c_a_dishes"; ok("a plan row is sent by chore id (amCarry/<kid>/<day>_ch_<id>, house:<id>)", (w.get("amCarry/kid_a/"+hk)||{}).house==="c_a_dishes");
  ok("…the pop-up reads it as sent (amGet by chore)", A.run("!!amGet('kid_a','chores',"+i+",'"+TUE+"')")===true);
  await w.at(2026,11,18,7,0); B.run("amToggle('kid_a','"+hk+"')"); await w.flush();
  const d=w.get("houseDay/"+TUE+"/done/c_a_dishes")||{};
  ok("finishing it writes Tuesday's done by chore (pts, bank id, am)", d.who==="kid_a"&&d.pts===10&&!!d.bid&&d.am===WED, d);
  ok("…the carry's done and the history line under Tuesday", !!w.get("amCarry/kid_a/"+hk+"/done")&&logOf(w,B,"kid_a","tuesday").some(x=>x.act==="on"&&x.house==="c_a_dishes"));
  ok("…and Tuesday's plan row now reads done", A.run("rtDoneOn('chores','kid_a','tuesday',"+idx(A,"chores","kid_a","c_a_dishes","tuesday")+")")===true);
}

console.log("\n── 4. school first ──");
{ const w=await W.world({mode:"on"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,10,0);
  const i=idx(B,"chores","kid_c","c_c_toys"), st=B.run("rtStepsFor('chores','kid_c')["+i+"]");
  ok("10 AM: a school-first kid's house chore on the Chores list is locked", B.run("rtStepAvail('chores','kid_c','monday',rtStepsFor('chores','kid_c')["+i+"])")===false);
  tick(B,"chores","kid_c",i); await w.flush(); ok("…a tap does nothing", !w.get("houseDay/"+MON+"/done/c_c_toys"));
  const sc=B.run("rtStepsFor('chores','kid_c').findIndex(function(s){ return s.label==='Scoop the litter'; })"); ok("…an animal row on the same list is not locked", B.run("rtStepAvail('chores','kid_a','monday',{label:'Scoop the litter'})")===true);
  ok("a Morning-time plan row is open before school", B.run("rtStepAvail('morning','kid_a','monday',morningStepsFor('kid_a')["+idx(B,"morning","kid_a","c_a_morn")+"])")===true);
  w.db.api("t").ref("household/people/kid_c/fit").set("mixed"); await w.flush(); ok("set to mixed in: open now", B.run("rtStepAvail('chores','kid_c','monday',rtStepsFor('chores','kid_c')["+i+"])")===true);
  w.db.api("t").ref("household/people/kid_c/fit").set("school"); await w.flush();
  ok("Mom's tick passes the lock (KIDTICK)", (A.run("mdKidTick('chores','kid_c','monday',"+idx(A,"chores","kid_c","c_c_toys")+")"),await w.flush(),!!w.get("houseDay/"+MON+"/done/c_c_toys")));
  await w.at(2026,11,16,16,5); ok("at the afternoon hour it opens", B.run("rtStepAvail('chores','kid_c','monday',rtStepsFor('chores','kid_c')["+idx(B,"chores","kid_c","c_c_beds")+"]||{house:'x'})")!==false);
  const w2=await W.world({mode:"off"}); const C=w2.boot("C","devC"); await w2.flush(); await w2.at(2026,11,16,10,0);
  const r=rawIdx(C,"chores","kid_c","c_c_toys"); ok("switch off: the old Chores row is open at 10 AM, as today", C.run("rtStepAvail('chores','kid_c','monday',rtStepsFor('chores','kid_c')["+r+"])")===true);
}

console.log("\n── 5. the doors ──");
{ const w=await W.world({mode:"on"}); const A=w.boot("A","devA",{mom:true}), B=w.boot("B","devB"); await w.flush(); await w.at(2026,11,16,8,0);
  A.run(HJS); B.run(HJS);   // Give to…, Re-lay and the question are Mom's taps on the Household page (house.js)
  ok("→ Give to… someone not ticked on the card is refused", A.run("hdGive('"+MON+"','c_c_beds','kid_a')")===null);
  const g=A.run("hdGive('"+MON+"','c_a_dishes','kid_b')"); await w.flush();
  ok("→ Give to… kid_b (ticked on the card): one plan path, from kid_a", g&&w.get("houseDay/"+MON+"/plan/c_a_dishes/who")==="kid_b"&&w.get("houseDay/"+MON+"/plan/c_a_dishes/from")==="kid_a");
  ok("…it leaves kid_a's list and is on kid_b's (both devices)", idx(B,"chores","kid_a","c_a_dishes")<0&&idx(B,"chores","kid_b","c_a_dishes")>=0&&idx(A,"chores","kid_b","c_a_dishes")>=0);
  ok("a kid can't give", (B.run("hdGive('"+MON+"','c_a_dishes','kid_a')"))===null);
  // Kid Off
  w.db.api("t").ref("calendar/kidOverrides/kid_b/"+MON).set({school:false,note:"Sick"}); await w.flush(); await w.tick();
  const pb=w.get("houseDay/"+MON+"/plan")||{}; ok("😷 Kid Off: kid_b's unstarted house chores are handed out again (none left on kid_b)", !Object.values(pb).some(p=>p.who==="kid_b"), Object.keys(pb).filter(k=>pb[k].who==="kid_b"));
  ok("…to someone ticked with room, else onto “fit nobody”", (pb.c_b_bath&&pb.c_b_bath.who==="kid_a"&&pb.c_b_bath.from==="kid_b")||!!w.get("houseDay/"+MON+"/over/c_b_bath"), pb.c_b_bath);
  ok("…health rows stay with kid_b", B.run("rtStepsFor('evening','kid_b',false,'monday').some(function(s){ return s.label==='Take your vitamin'; })"));
  // the re-lay question, Keep / Re-lay
  ok("no question while nothing changed", A.run("hdAsking('"+MON+"')")===false);
  w.db.api("t").ref("household/people/kid_c/school").set(20); await w.flush();
  ok("a limit edit after today was laid → the question", A.run("hdAsking('"+MON+"')")===true&&B.run("hdAsking('"+MON+"')")===false);
  A.run("hdKeep('"+MON+"')"); await w.flush(); ok("Keep today, start tomorrow: asked no more, today unchanged", A.run("hdAsking('"+MON+"')")===false&&!!w.get("houseDay/"+MON+"/over/c_c_beds"));
  const m0=w.mark(); A.run("hdRelay('"+MON+"')"); await w.flush();
  ok("🔁 Re-lay today: Straighten the beds now fits kid_c", (w.get("houseDay/"+MON+"/plan/c_c_beds")||{}).who==="kid_c"&&!w.get("houseDay/"+MON+"/over/c_c_beds"));
  ok("…one update of targeted houseDay paths only", w.since(m0).filter(l=>l.op!=="tx").every(l=>(l.keys||[l.path]).every(k=>/^houseDay\/2026-11-16\/(plan|over)\/\w+$|^houseDay\/2026-11-16\/(built\/sig|keep)$/.test(k))), w.since(m0).map(l=>l.keys||l.path));
  ok("…a kid's device can't re-lay", B.run("hdRelay('"+MON+"')")===null);
  // the 🏡 House card on a kid's day and Mom's house blocks read the plan
  { const kc=A.run("hhCleanRows('kid_a','"+MON+"','monday')").map(x=>x.id), mr=A.run("hhCleanRows('mom','"+MON+"','monday')").map(x=>x.id);
    const pl=w.get("houseDay/"+MON+"/plan")||{}, mine=Object.keys(pl).filter(id=>pl[id].who==="kid_a").sort();
    ok("🏡 House card (hhCleanRows): exactly kid_a's plan rows (after the hand-overs above), once each, plus the rows the engine never hands out", JSON.stringify(kc.filter(x=>x!=="c_a_fold").sort())===JSON.stringify(mine)&&kc.indexOf("c_a_fold")>=0, [kc,mine]);
    ok("…Mom's house blocks: her plan row once", mr.filter(x=>x==="m_fridge").length===1, mr); }
  // Mom's and Dad's own lists
  ok("Mom's list: her own rows + today's plan row (by chore, today only)", (function(){ const m=A.run("mcAll()"); return m.tea&&m.fridge&&m.fridge.hd==="m_fridge"&&m.fridge.cad==="wk:0"; })(), A.run("mcAll()"));
  A.run("mcToggle('fridge')"); await w.flush(); const md=w.get("houseDay/"+MON+"/done/m_fridge")||{};
  ok("Mom's tick: her stamp + the plan's done (0 ⭐) + last-done", !!w.get("momday/"+MON+"/chores/fridge")&&md.who==="mom"&&md.pts===0&&w.get("household/jobs/m_fridge/lastDone")===MON);
  A.run("mcToggle('fridge')"); await w.flush(); ok("…un-tick puts it all back", !w.get("momday/"+MON+"/chores/fridge")&&!w.get("houseDay/"+MON+"/done/m_fridge")&&!w.get("household/jobs/m_fridge/lastDone"));
  A.run("dcToggle('trash')"); await w.flush(); ok("Dad's tick: the plan's done by chore", (w.get("houseDay/"+MON+"/done/d_trash")||{}).who==="dad");
}

console.log("\n── 6. refused saves ──");
{ const w=await W.world({mode:"preview",deny:/^houseDay/}); const A=w.boot("A","devA",{mom:true}); await w.flush(); await w.at(2026,11,16,8,0);
  A.run(HJS); A.run("var __told=''; mwToast=function(m){ __told=m; }; rlHistReady();"); await w.flush();
  const p=A.run("hpSwitchOn()"); await w.flush(); await (p&&p.then?p:Promise.resolve());  await w.flush();
  ok("ON with houseDay refused: the switch stays as it was (preview)", w.get("household/meta/engine/mode")==="preview");
  ok("…Mom is told in plain words that the rules need a line for houseDay", /refused/.test(A.get("__told"))&&/houseDay/.test(A.get("__told")), A.get("__told"));
  ok("…and no last-done date was written", !Object.values(w.get("household/jobs")).some(j=>j.lastDone&&j.lastDone!=="2026-11-07"));
  const w2=await W.world({mode:"preview"}); const C=w2.boot("C","devC",{mom:true}); await w2.flush(); await w2.at(2026,11,16,8,0);
  C.run(HJS); C.run("var __told=''; mwToast=function(m){ __told=m; }; rlHistReady();"); await w2.flush(); const m=w2.mark(); C.run("hpSwitchOn()"); await w2.flush(); await w2.tick();
  ok("ON allowed: proves houseDay/<today>/hello first, then switch + last-done fill in ONE update", w2.get("household/meta/engine/mode")==="on"&&w2.get("household/meta/engine/on")===MON&&!!w2.get("houseDay/"+MON+"/hello")
    &&w2.since(m).filter(l=>l.op==="update"&&(l.keys||[]).indexOf("household/meta/engine")>=0).length===1, w2.since(m).map(l=>l.op+" "+(l.keys||l.path)));
  ok("…today's plan is then built", !!w2.get("houseDay/"+MON+"/built/ok"));
  C.run("hpSwitchOff()"); await w2.flush(); ok("OFF: one targeted write, mode off", w2.get("household/meta/engine/mode")==="off");
  const w3=await W.world({mode:"on",deny:/^houseDay/}); const D=w3.boot("D","devD",{mom:true}), E=w3.boot("E","devE"); await w3.flush(); await w3.at(2026,11,16,8,0);
  ok("switch on, save refused: nothing stored, and the device knows why", !w3.get("houseDay")&&D.run("!!_hdBad&&_hdBad.iso==='"+MON+"'"));
  const L=W.lists(E,{days:["monday"]});
  ok("…that day's lists are the old ones: every kid's house rows on their own lists, none hidden, no plan rows", Object.keys(L).filter(k=>/monday/.test(k)).every(k=>L[k].every(s=>!s.house&&!s.hdHidden))&&L["chores/kid_a/monday"].some(s=>s.label==="Unload the dishwasher"));
  D.run(HJS); D.run("hpSel='kid_a'"); const h=D.run("hpPersonHTML()");
  ok("…and Mom sees why on 👤 By person", /could not be saved/.test(h)&&/houseDay/.test(h));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})().catch(e=>{ console.log("CRASH",e.stack); process.exit(1); });
