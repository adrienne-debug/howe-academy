/*
 * 🏆 TROPHYSHELF (her decisions 2026-10-22): a 🏆 Trophies button in a kid's top strip in Kids' Corner opens the Trophy Shelf
 * INSIDE the Corner — Book trophies, Finished curriculum (from curriculum/done), the Reading Log's recent entries, and three streaks (drills · school cards · routine lists) counted on SCHOOL DAYS ONLY from records (weekends,
 * holidays and co-op days are skipped, never broken). best · last · now per streak; a nudge one day from the best. The stars
 * (her decision 2026-10-22, final): a school day that keeps a streak going (now ≥ 2) is OWED, never banked by itself —
 * trophies/streaks/<kid>/<streak>/owed/<iso> = true once per day per streak; the shelf's "⭐ Collect" tap banks 1 ⭐ per owed
 * day and clears them; owed days older than 7 school days drop when a new one is owed; the 🏆 button counts the uncollected
 * stars. A new best pays 5 ⭐ automatically ONCE PER RUN (best = {n,date,runStart}); the same run never pays twice. One line
 * of current streaks on Mom's Day kid rows; with the shelf closed the Corner renders byte-identically to base plus the button.
 *                                                                                                  run: node test_trophy_shelf.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const BLOCK=cut("// TROPHYSHELF_START","// TROPHYSHELF_END");

console.log("0. The block and its hooks");
ok("marked, right after the KIDROWS2 block", src.indexOf("// TROPHYSHELF_START")>src.indexOf("// KIDROWS2_END")&&src.indexOf("// TROPHYSHELF_START")-src.indexOf("// KIDROWS2_END")<40);
{ const refs=BLOCK.match(/db\.ref\([^)]*\)\.(set|update|remove|push)\(/g)||[];
  ok("its Firebase writes are all targeted under trophies/streaks/<kid>/<streak>: best (set) · the streak node (one multi-path update: owed/<iso>, owedDay, the drop's nulls) · owed (the Collect tap's update of nulls) — no remove/push, no whole-node set",
    refs.length===3&&/db\.ref\(base\+"\/best"\)\.set\(b\)/.test(BLOCK)&&/db\.ref\(base\)\.update\(u\)/.test(BLOCK)&&/db\.ref\("trophies\/streaks\/"\+kid\+"\/"\+id\+"\/owed"\)\.update\(gone\)/.test(BLOCK)&&!/db\.ref\([^)]*\)\.(remove|push)\(/.test(BLOCK)&&/, base="trophies\/streaks\/"\+kid\+"\/"\+st\.id;/.test(BLOCK), refs); }
ok("the bonus and the collected stars go through bankDirect with the plain notes", /bankDirect\(kid,TS_BONUS,"beat your best "\+st\.label\+" streak"\)/.test(BLOCK)&&/bankDirect\(kid,TS_DAILY,"kept your "\+st\.label\+" streak going"/.test(BLOCK)&&/TS_BONUS=5, TS_DAILY=1, TS_OWED_DAYS=7\b/.test(BLOCK));
ok("writes only when db && !_dryRun() — the settle and the Collect tap", (BLOCK.match(/typeof db==="undefined"\|\|!db\|\|\(typeof _dryRun==="function"&&_dryRun\(\)\)\) return/g)||[]).length===2);
ok("the Collect tap is the kid's own: kcKid must be the kid; no momHere / Mom code in the block", /if\(typeof kcKid==="undefined"\|\|kcKid!==kid\) return 0;/.test(BLOCK)&&!/momHere|_kioskD|adminPin/.test(BLOCK));
ok("no 🔀", src.indexOf("🔀")<0);
ok("no spot-check section: her rule 2026-10-15 keeps the spot check silent on the kid's side (test_spot_check holds it)", !/spotData|spotChecks|Spot check/.test(BLOCK.replace(/^\/\/.*$/gm,"")));
{ const rk=fn("renderKidsCorner");
  ok("Kids' Corner: the strip hook sits inside the header, one line", (rk.match(/tsStripHTML/g)||[]).length===2&&/\+'<\/div>'\+\(\(typeof tsStripHTML==="function"\)\?tsStripHTML\(k\):''\)\+'<\/div>';/.test(rk));
  ok("…the shelf section draws before the Today | My Lists | Month toggle, only when open", /tsOpenKid===k\) h\+=tsShelfHTML\(k\);\s*\/\/[^\n]*\n\s*h\+=kcCalToggleHTML\(k\);\s*\n\s*h\+=kcModeBodyHTML\(k\);/.test(rk));
  const md=fn("mdCardKidsToday");
  ok("Mom's Day kid row: one line, Mom's Day only (bank && no dadCtl), after the chores line", /esc\(chores\.join\(" · "\)\)\+'<\/div>';\n\s*if\(bank&&dadCtl===undefined&&typeof tsMomLineHTML==="function"\)\{ try\{ h\+=tsMomLineHTML\(kid\); \}catch\(e\)\{\} \}/.test(md)&&(md.match(/tsMomLineHTML/g)||[]).length===2);
}

// ── the world: Lucy, today Fri 2026-10-23. Live week30 Oct 19–23; archived week29 Oct 12–16 and week28 Oct 5–9.
// Off the count: weekends · Mon Oct 12 (holiday) · Wed Oct 14 and Wed Oct 21 (co-op). ──
const TODAY="2026-10-23";
function world(o){
  o=o||{}; const writes=[], banks=[], toasts=[], renders=[], loads=[];
  const h=k=>({date:k}); const hist={lucy:{}}; ["20261005","20261006","20261007","20261008","20261013","20261015","20261016","20261019","20261020","20261022"].forEach(k=>hist.lucy[k]=h(k));
  if(o.drillToday) hist.lucy["20261023"]=h("20261023");
  const masteryData={history:hist,studyLog:{lucy:{sp1:{"20261009":{secs:40}}}}};   // Oct 9: a study session, no drill — still a drills day
  if(o.noStudy) delete masteryData.studyLog.lucy.sp1["20261009"];
  const T=(id,d,who)=>({id:id,who:who||"lucy",day:d,title:"📄 Math — "+id});
  const archive={
    week28:{weekLabel:"week28",dates:{monday:"Oct 5",tuesday:"Oct 6",wednesday:"Oct 7",thursday:"Oct 8",friday:"Oct 9"},
      tasks:[T("a1","monday"),T("a2","monday"),T("b1","tuesday","ellis"),T("c1","wednesday"),T("d1","thursday"),T("e1","friday"),T("e1_c","friday")],
      checked:{a1:"10:00 AM Oct 5",a2:"10:30 AM Oct 5",d1:"11:00 AM Oct 8",e1:"1:00 PM Oct 9"},
      history:{c1_missed:{id:"c1",missed:true},d1:{who:"lucy",title:"x",ts:"11:00 AM Oct 8"}}},
    week29:{weekLabel:"week29",dates:{monday:"Oct 12",tuesday:"Oct 13",wednesday:"Oct 14",thursday:"Oct 15",friday:"Oct 16"},
      tasks:[T("m1","monday"),T("t1","tuesday"),T("w1","wednesday"),T("r1","thursday"),T("f1","friday")],
      checked:{t1:"x",w1:"x",r1:"x"},history:{f1:{who:"lucy",title:"f",ts:"2:00 PM Oct 16"}}}};
  const liveTasks=[T("l1","monday"),T("l2","tuesday"),T("l3","wednesday"),T("l4","thursday"),T("l5","friday")];
  const swDone={monday:true,tuesday:true,wednesday:true,thursday:false,friday:!!o.cardsToday};
  const dayLists={monday:[{slot:"morning",done:true},{slot:"afternoon",done:true}],tuesday:[{slot:"morning",done:true}],wednesday:[{slot:"morning",done:true}],thursday:[{slot:"afternoon",done:true}],friday:o.routinesToday?[{slot:"morning",done:true}]:[{slot:"morning",done:false}]};
  const on=(slot,label,at)=>({slot:slot,label:label,act:"on",at:at||1,pts:0}), off=(slot,label,at)=>({slot:slot,label:label,act:"off",at:at||2,pts:0});
  const routineLog={lucy:{
    week28:{monday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower"),w:{slot:"afternoon",label:"Sweep — waved by Mom",act:"wave",at:3,pts:0}},
            tuesday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower")},wednesday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower")},
            thursday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower",1),c:off("afternoon","Shower",2)},   // un-ticked again → not done
            friday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower")}},
    week29:{monday:{a:on("morning","Brush teeth")},tuesday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower")},wednesday:{},
            thursday:{a:on("morning","Brush teeth"),b:on("afternoon","Shower")},friday:{}}}};
  if(o.loading) delete routineLog.lucy.week28;   // only the two live weeks are on the device (RLWIN)
  const steps={morning:{lucy:[{label:"Brush teeth",cad:"daily"}]},afternoon:{lucy:[{label:"Shower",cad:"daily"},{label:"Sweep",cad:"mon"}]},chores:{lucy:[]},evening:{lucy:[]}};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,
    writes,banks,toasts,renders,loads,
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"), cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    KID_COLOR:{lucy:"#d946ef",ellis:"#0ea5e9"}, KID_NAME:{lucy:"Lucy",ellis:"Ellis"}, ROSTER:["lucy","ellis"], kcLittle:()=>false,
    kcKid:("kcKid" in o)?o.kcKid:"lucy", renderAll:()=>renders.push(1), popOpen:()=>{}, gwShowToast:m=>toasts.push(m),
    calToday:()=>TODAY, activeWk:()=>"week30", WK:"week30", DAY_DT:{monday:"Oct 19",tuesday:"Oct 20",wednesday:"Oct 21",thursday:"Oct 22",friday:"Oct 23"},
    smapIsKidOff:(k,iso)=>iso==="2026-10-12"?"Holiday":null, coopTimedNameFor:(k,iso)=>(iso==="2026-10-14"||iso==="2026-10-21")?"Co-op":null,
    rlHistFull:()=>!o.loading, rlHistReady:()=>{ loads.push(1); return !o.loading; },   // RLWIN: full? / ask for the older weeks
    masteryData, archive, routineLog, checked:{l1:"x",l2:"x",l3:"x"},
    getActiveTasks:()=>liveTasks, effectiveDay:t=>t.day, rtSchoolworkDone:(k,d)=>k==="lucy"&&!!swDone[d],
    rtDayLists:(k,d)=>k==="lucy"?(dayLists[d]||[]):[], activeSlots:()=>["morning","afternoon","chores","evening"],
    morningStepsFor:k=>steps.morning[k]||[], rtStepsFor:(sl,k)=>steps[sl][k]||[], cadDueOn:(cad,dn)=>cad==="daily"||(cad==="mon"&&dn==="monday"),
    trophies:o.trophies||{lucy:{read_bk1:{type:"read",key:"bk1",name:"Charlotte's Web",size:"medium",ts:"03:10 PM Oct 2",points:30},book_math_5A:{type:"book",key:"math",name:"Singapore 5A",ts:"01:00 PM Sep 30",points:20},subject_hist:{type:"subject",key:"hist",name:"Story of the World 2",ts:"02:00 PM Sep 12",points:50}}},
    readingLog:{lucy:{books:{bk1:{title:"Charlotte's Web",size:"medium",status:"done",doneTs:"03:10 PM Oct 2"},bk2:{title:"Frog and Toad",size:"little",status:"active"},bk3:{title:"Owl Moon",size:"little",status:"done",doneTs:"09:00 AM Oct 20"}},
      entries:{e_1:{bookId:"bk2",ts:"04:00 PM Oct 21",day:"wednesday",fromPage:1,toPage:12},e_2:{bookId:"bk2",ts:"04:00 PM Oct 22",day:"thursday",fromPage:12,toPage:24},e_0:{bookId:"bk1",ts:"03:00 PM Oct 2",day:"friday"}}}},
    currData:{subjects:{lucy:{math:{display:"Singapore 5B",lessonIds:["m1","m2","m3"],lessonSeq:["L1","L2","L3"],doneImportedAt:1},
                              sci:{display:"Science",lessonIds:["s1","s2"],lessonSeq:["L1","L2"],doneImportedAt:1},
                              hand:{display:"Handwriting",tracking:"daily",lessonIds:["h1"],lessonSeq:["p1"]}}},
              done:{lucy:{math:{m1:{day:"2026-09-01",ts:"x"},m3:{day:"2026-10-20",ts:"10:00 AM Oct 20"}},sci:{s1:{day:"2026-10-01"}},hand:{h1:{day:"2026-10-01"}}}}},
    bankDirect:(k,p,n)=>{ banks.push([k,p,n]); return "bd1"; },
    _dryRun:()=>!!o.dry};
  if(o.db) ctx.db={ref:p=>({set:v=>writes.push([p,v]),update:v=>writes.push([p,v])})};
  vm.createContext(ctx);
  vm.runInContext(BLOCK,ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  return ctx;
}

console.log("1. School days: weekends, the holiday and the co-op days are skipped, not broken");
{ const w=world();
  ok("Sat/Sun are not school days", !w.tsSchoolDay("lucy","2026-10-17")&&!w.tsSchoolDay("lucy","2026-10-18"));
  ok("the holiday (calendar) is not", !w.tsSchoolDay("lucy","2026-10-12"));
  ok("a co-op day is not", !w.tsSchoolDay("lucy","2026-10-14")&&!w.tsSchoolDay("lucy","2026-10-21"));
  ok("an ordinary weekday is", w.tsSchoolDay("lucy","2026-10-13")&&w.tsSchoolDay("lucy","2026-10-22"));
  const wd=w.tsWeekDays(TODAY);
  ok("week dates resolve to ISO — archive labels and the live week", wd["2026-10-05"].wk==="week28"&&wd["2026-10-05"].dn==="monday"&&!wd["2026-10-05"].live&&wd["2026-10-23"].live&&wd["2026-10-23"].dn==="friday");
  ok("a December label read in January lands in the old year", w.tsLabelIso("Dec 15","2027-01-05")==="2026-12-15"&&w.tsLabelIso("Oct 20","2026-10-23")==="2026-10-20");
  const S=w.tsStreaks("lucy");
  ok("drills: Oct 5–9 (Oct 9 a study session), then 13·15·16, 19·20·22 — one run across the weekend, holiday and co-op days → best 11 · last 0 · now 11",
    S.drills.best===11&&S.drills.last===0&&S.drills.now===11, S.drills);
  const w2=world({noStudy:true}); const S2=w2.tsStreaks("lucy");
  ok("…without the Oct 9 study session that day breaks it: Oct 5–8 (4), then 13…22 (6) → best 6 · last 4 · now 6", S2.drills.best===6&&S2.drills.last===4&&S2.drills.now===6, S2.drills);
  ok("today (not drilled yet) is not counted against the streak — it stands as of Thursday", !S.drills.doneToday&&S.drills.now===11);
  const w3=world({drillToday:true}); ok("…and joins it once done today", w3.tsStreaks("lucy").drills.now===12);
}

console.log("2. Cards and routines come from records, never from today's check marks");
{ const w=world(); const wd=w.tsWeekDays(TODAY);
  ok("archived day, all of Lucy's cards checked → done (the _c twin is not a card)", w.tsCardsDay("lucy","2026-10-05",wd)===true&&w.tsCardsDay("lucy","2026-10-09",wd)===true);
  ok("archived day with a _missed record → not done", w.tsCardsDay("lucy","2026-10-07",wd)===false);
  ok("archived day with a finished history entry but no check → done", w.tsCardsDay("lucy","2026-10-16",wd)===true);
  ok("a day Lucy had no cards (Oct 6 was Ellis's) → nothing to count (null), skipped", w.tsCardsDay("lucy","2026-10-06",wd)===null);
  ok("a day outside every week record → null", w.tsCardsDay("lucy","2026-09-01",wd)===null);
  ok("live week: rtSchoolworkDone decides", w.tsCardsDay("lucy","2026-10-19",wd)===true&&w.tsCardsDay("lucy","2026-10-22",wd)===false);
  const S=w.tsStreaks("lucy");
  ok("cards: 5✓ 7✗ 8✓ 9✓ 13✓ 15✓ 16✓ 19✓ 20✓ 22✗ → best 7 · last 7 · now 0 (Thursday broke it; today still open)", S.cards.best===7&&S.cards.last===7&&S.cards.now===0, S.cards);
  ok("archived routines: ticks vs the due steps — Mon Oct 5 (Sweep waved) done, Thu Oct 8 (Shower un-ticked) not, Wed Oct 14 skipped anyway", w.tsRoutinesDay("lucy","2026-10-05",wd)===true&&w.tsRoutinesDay("lucy","2026-10-08",wd)===false&&w.tsRoutinesDay("lucy","2026-10-13",wd)===true&&w.tsRoutinesDay("lucy","2026-10-16",wd)===false);
  ok("live week routines: rtDayLists decides", w.tsRoutinesDay("lucy","2026-10-19",wd)===true&&w.tsRoutinesDay("lucy","2026-10-23",wd)===false);
  ok("routines: 5✓6✓7✓ 8✗ 9✓13✓15✓ 16✗ 19✓20✓22✓ → three runs of 3 (Oct 9→13→15 is one run: weekend, holiday, co-op skipped) → best 3 · last 3 · now 3", S.routines.best===3&&S.routines.last===3&&S.routines.now===3, S.routines);
  const w2=world({routinesToday:true}); ok("…today's lists all done → now 4, a new best", w2.tsStreaks("lucy").routines.now===4&&w2.tsStreaks("lucy").routines.newBest===true);
  ok("the numbers are cached per kid per day in memory (same key → same days object)", (()=>{ const a=w.get("_tsCache.lucy"); w.tsStreaks("lucy"); return a===w.get("_tsCache.lucy")&&a.key.indexOf(TODAY)===0; })());
  { const l=world({loading:true}); const wl=l.tsWeekDays(TODAY); const SL=l.tsStreaks("lucy");
    ok("only the two live weeks loaded (RLWIN): an older week's day counts as nothing for routines (null), never a break", l.tsRoutinesDay("lucy","2026-10-05",wl)===null&&l.tsRoutinesDay("lucy","2026-10-13",wl)===true);
    ok("…routines then count from what is here (13·15 | 16✗ | 19·20·22 → best 3 · last 2 · now 3) and the numbers say the history isn't whole", SL.routines.best===3&&SL.routines.last===2&&SL.routines.now===3&&SL.ready===false, SL.routines);
    ok("…drills and cards don't depend on it (mastery and the archive are whole on every device)", SL.drills.now===11&&SL.cards.best===7);
    ok("…computing never asks for the older weeks by itself (the key carries the flag; the cache flips when they arrive)", l.loads.length===0&&l.get("_tsCache.lucy").key.indexOf(TODAY+"|0|")===0); }
}

console.log("3. The streak math (pure) — best · last · now, the nudge at best−1 and at best");
{ const w=world(); const D=s=>s.split("").map((c,i)=>({iso:"d"+i,ok:c==="1"}));
  const n1=w.tsNumbers(D("11111011110"),0);   // best 5, last run 4 broken, now 0
  ok("a broken run: best 5 · last 4 · now 0, no nudge", n1.best===5&&n1.last===4&&n1.now===0&&!n1.nudge, n1);
  const n2=w.tsNumbers(D("1111101111"),0);
  ok("one short of the best (now 4 of 5): nudge on", n2.best===5&&n2.last===5&&n2.now===4&&n2.nudge===true&&!n2.newBest, n2);
  const n3=w.tsNumbers(D("11111011111"),0);
  ok("tied with the best (now 5 of 5): nudge on, not yet a new best", n3.now===5&&n3.best===5&&n3.nudge===true&&!n3.newBest, n3);
  const n4=w.tsNumbers(D("111110111111"),0);
  ok("one past it: a new best (6), the nudge line still points at tomorrow", n4.now===6&&n4.best===6&&n4.bestBefore===5&&n4.newBest===true&&n4.nudge===true, n4);
  const n5=w.tsNumbers(D("111"),8);
  ok("the remembered best counts even when the history is shorter (stored 8): best 8 · now 3, no nudge", n5.best===8&&n5.now===3&&!n5.nudge&&!n5.newBest, n5);
  ok("a first day is never a 'best' to pay for (now 1, nothing before)", (()=>{ const n=w.tsNumbers(D("1"),0); return n.now===1&&n.best===1&&!n.newBest&&!n.nudge; })());
  ok("no days → zeros", (()=>{ const n=w.tsNumbers([],0); return n.best===0&&n.last===0&&n.now===0&&!n.nudge; })());
  const S=w.tsStreaks("lucy");
  ok("the strip line names the nearest streak: drills at a new best today", w.tsNudgeText(S)==="new best drills streak — 11 days!", w.tsNudgeText(S));
  const S4={ready:true,drills:{best:5,now:4,nudge:true},cards:{best:0,now:0},routines:{best:0,now:0}};
  ok("…at best−1: two more days", w.tsNudgeText(S4)==="two more days beat your best drills streak");
  const S5={ready:true,drills:{best:5,now:5,nudge:true},cards:{best:0,now:0},routines:{best:7,now:7,nudge:true}};
  ok("…tied: one more day beats it", w.tsNudgeText(S5)==="one more day beats your best drills streak");
  ok("…nothing close → no line", w.tsNudgeText({ready:true,drills:{best:5,now:1},cards:{best:0,now:0},routines:{best:0,now:0}})==="");
}

console.log("4. The new best pays 5 ⭐ automatically, ONCE PER RUN; inert in dry-run / off the kid's page");
{ const w=world({db:true}); const S=w.tsStreaks("lucy");
  ok("the current drills run started Oct 5 (one run across the weekend, holiday and co-op days)", S.drills.runStart==="2026-10-05"&&S.drills.pos["2026-10-22"]===11&&S.drills.pos["2026-10-05"]===1, S.drills.runStart);
  const paid=w.tsBonusSettle("lucy",S);
  ok("drills beat its best (11 > 7 before) → paid once", JSON.stringify(paid.best)==='["drills"]'&&w.banks.length===1&&w.banks[0][0]==="lucy"&&w.banks[0][1]===5&&w.banks[0][2]==="beat your best drills streak", w.banks);
  ok("the best is remembered at trophies/streaks/lucy/drills/best = {n,date,runStart} — the only write (nothing done today → nothing owed)", w.writes.length===1&&w.writes[0][0]==="trophies/streaks/lucy/drills/best"&&w.writes[0][1].n===11&&w.writes[0][1].date===TODAY&&w.writes[0][1].runStart==="2026-10-05", w.writes);
  ok("routines tied its best (3 = 3) → nothing; cards (now 0) → nothing", !paid.best.includes("routines")&&!paid.best.includes("cards")&&paid.owed.length===0);
  ok("a kid-safe toast", w.toasts.length===1&&/\+5/.test(w.toasts[0])&&/beat your best drills streak/.test(w.toasts[0]), w.toasts);
  const S2=w.tsStreaks("lucy"); const again=w.tsBonusSettle("lucy",S2);
  ok("the same best never pays twice: the record now says 11, so best 11 · now 11, no new best", again.best.length===0&&w.banks.length===1&&S2.drills.best===11&&!S2.drills.newBest&&S2.drills.bestToday===true, S2.drills);
  ok("…and the strip still celebrates today's new best", w.tsNudgeText(S2)==="new best drills streak — 11 days!");
  // the flaw she caught 2026-10-22: the next day on the same run is "now > n" again — it must NOT pay again
  const w2=world({db:true,drillToday:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22",runStart:"2026-10-05"}}}}}}); const S3=w2.tsStreaks("lucy");
  const p3=w2.tsBonusSettle("lucy",S3);
  ok("the next day on the SAME run (12 > 11, runStart Oct 5 = stored) → no 5 ⭐: only the owed star for the day kept", S3.drills.now===12&&S3.drills.newBest===true&&p3.best.length===0&&w2.banks.length===0&&JSON.stringify(p3.owed)==='["drills"]', {p3,banks:w2.banks});
  ok("…but best.n and date move silently (12, today) with the same runStart, so the shelf's best stays right", (()=>{ const b=w2.writes.find(x=>x[0]==="trophies/streaks/lucy/drills/best"); return b&&b[1].n===12&&b[1].date===TODAY&&b[1].runStart==="2026-10-05"&&w2.tsStreaks("lucy").drills.best===12; })(), w2.writes);
  ok("…no toast for a silent move", w2.toasts.length===0);
  ok("…the strip still says new best (12 days)", w2.tsNudgeText(w2.tsStreaks("lucy"))==="new best drills streak — 12 days!");
  // a broken run, then a later run that beats the record: pays once more, with its own runStart
  const w4=world({db:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22",runStart:"2026-10-05"}},routines:{best:{n:2,date:"2026-10-07",runStart:"2026-10-05"}}}}},routinesToday:true}); const S4=w4.tsStreaks("lucy");
  const p4=w4.tsBonusSettle("lucy",S4);
  ok("routines: the Oct 5–7 run (stored best 2, runStart Oct 5) broke; the Oct 19→23 run reaches 4 → 5 ⭐ once, runStart Oct 19", S4.routines.now===4&&S4.routines.runStart==="2026-10-19"&&JSON.stringify(p4.best)==='["routines"]'&&w4.banks.some(b=>b[1]===5&&b[2]==="beat your best routine lists streak")&&(w4.writes.find(x=>x[0]==="trophies/streaks/lucy/routines/best")||[])[1].runStart==="2026-10-19", {S4:S4.routines,writes:w4.writes});
  ok("…the same run the next day would not pay again", (()=>{ const r=w4.tsStreaks("lucy").routines; const b=w4.tsBestRec("lucy","routines"); return b.n===4&&b.runStart===r.runStart&&!r.newBest; })());
  // first open: a kid already on a best-ever run gets the one 5 ⭐ that day (the base world above IS that case: no record yet, now 11)
  const f=world({db:true,drillToday:true}); const pf=f.tsBonusSettle("lucy",f.tsStreaks("lucy"));
  ok("first open on a best-ever run, done today: the one 5 ⭐ + today owed, nothing more for the run", JSON.stringify(pf.best)==='["drills"]'&&JSON.stringify(pf.owed)==='["drills"]'&&f.banks.length===1&&f.banks[0][1]===5&&f.tsBestRec("lucy","drills").runStart==="2026-10-05");
  const d=world({db:true,dry:true}); d.tsBonusSettle("lucy",d.tsStreaks("lucy"));
  ok("?dryrun=1 → no bank line, no write", d.banks.length===0&&d.writes.length===0);
  const n=world(); n.tsBonusSettle("lucy",n.tsStreaks("lucy"));
  ok("no db → nothing", n.banks.length===0);
  const l=world({db:true,loading:true,routinesToday:true}); const pl=l.tsBonusSettle("lucy",l.tsStreaks("lucy"));
  ok("older routine weeks not loaded: drills (whole data) still pays; routines looks like a new best (4 > 3 as loaded) but waits and asks for the history instead", JSON.stringify(pl.best)==='["drills"]'&&l.banks.length===1&&l.loads.length===1&&!l.writes.some(w=>/routines/.test(w[0])));
  const r=world({db:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22",runStart:"2026-10-05"}}}}}}); r.tsBonusSettle("lucy",r.tsStreaks("lucy"));
  ok("another device already wrote this best → nothing", r.banks.length===0&&r.writes.length===0);
  const m=world({db:true,kcKid:"ellis"}); m.tsStripHTML("lucy");
  ok("the strip settles only on the kid's own page (another kid's device draws Lucy's strip → no pay)", m.banks.length===0);
  const s=world({db:true}); s.tsStripHTML("lucy");
  ok("…on Lucy's own page the strip settles it", s.banks.length===1&&s.writes.length===1);
  const mm=world({db:true}); mm.tsMomLineHTML("lucy");
  ok("Mom's Day line never pays", mm.banks.length===0&&mm.writes.length===0);
}

console.log("4b. Keeping it going: a star OWED per streak per school day, claimed with ⭐ Collect — never banked by itself");
{ const w=world({db:true,drillToday:true,routinesToday:true,cardsToday:true}); const S=w.tsStreaks("lucy");
  ok("today done for drills (now 12) and routines (now 4); cards (now 1) is not a kept streak yet", S.drills.doneToday&&S.drills.now===12&&S.routines.doneToday&&S.routines.now===4&&S.cards.doneToday&&S.cards.now===1);
  const p=w.tsBonusSettle("lucy",S);
  ok("drills and routines → owed today (cards: now < 2 → nothing)", JSON.stringify(p.owed)==='["drills","routines"]', p);
  ok("recorded at trophies/streaks/lucy/<streak>: owed/2026-10-23 = true + owedDay, one targeted multi-path update each", (()=>{ const U=id=>w.writes.filter(x=>x[0]==="trophies/streaks/lucy/"+id); return U("drills").length===1&&JSON.stringify(U("drills")[0][1])===JSON.stringify({["owed/"+TODAY]:true,owedDay:TODAY})&&U("routines").length===1&&JSON.stringify(U("routines")[0][1])===JSON.stringify({["owed/"+TODAY]:true,owedDay:TODAY})&&U("cards").length===0; })(), w.writes);
  ok("NOTHING banked for the kept days (the 5 ⭐ new bests still bank: drills 11→12 is a first-open best, routines 4 > 3)", w.banks.every(b=>b[1]===5)&&w.banks.length===2, w.banks);
  const before=w.writes.length; const p2=w.tsBonusSettle("lucy",w.tsStreaks("lucy"));
  ok("owed once per day per streak: a second render writes nothing more", p2.owed.length===0&&w.writes.length===before);
  ok("the numbers carry the owed days", w.tsStreaks("lucy").drills.owed.length===1&&w.tsStreaks("lucy").routines.owed.length===1&&w.tsStreaks("lucy").cards.owed.length===0);
  ok("the 🏆 button counts the uncollected stars (2)", /🏆 Trophies <span[^>]*>⭐ 2<\/span>/.test(w.tsStripHTML("lucy")), w.tsStripHTML("lucy"));
  const h=w.tsShelfHTML("lucy");
  ok("the shelf: ⭐ Collect on the drills and routine lists lines, none on school cards; the week line", /tsCollect\('lucy','drills'\)[^<]*>⭐ Collect 1</.test(h)&&/tsCollect\('lucy','routines'\)[^<]*>⭐ Collect 1</.test(h)&&!/tsCollect\('lucy','cards'\)/.test(h)&&/Stars wait a week, then they’re gone/.test(h));
  // the tap
  const nb=w.banks.length, nt=w.toasts.length; const got=w.tsCollect("lucy","drills");
  ok("Collect banks exactly the owed count (1 ⭐) with the plain note, day 12 of the run", got===1&&w.banks.length===nb+1&&w.banks[nb][1]===1&&w.banks[nb][2]==="kept your drills streak going (day 12)", w.banks);
  ok("…clears the owed leaves in one multi-path update of nulls and redraws", w.writes[w.writes.length-1][0]==="trophies/streaks/lucy/drills/owed"&&JSON.stringify(w.writes[w.writes.length-1][1])===JSON.stringify({[TODAY]:null})&&w.tsStreaks("lucy").drills.owed.length===0&&w.renders.length===1);
  ok("…toasts the total", w.toasts.length===nt+1&&/⭐ \+1/.test(w.toasts[nt])&&/drills streak going/.test(w.toasts[nt]), w.toasts);
  ok("…the button is gone from drills, still on routines; the badge says 1", !/tsCollect\('lucy','drills'\)/.test(w.tsShelfHTML("lucy"))&&/tsCollect\('lucy','routines'\)/.test(w.tsShelfHTML("lucy"))&&/⭐ 1<\/span>/.test(w.tsStripHTML("lucy")));
  ok("a second tap banks nothing", w.tsCollect("lucy","drills")===0&&w.banks.length===nb+1);
  ok("…and a later render never owes today again after a collect (owedDay remembers the day): no second star the same day", (()=>{ const n=w.writes.length; const p=w.tsBonusSettle("lucy",w.tsStreaks("lucy")); return p.owed.length===0&&w.writes.length===n&&w.tsOwedDays("lucy","drills").length===0; })());
  // several owed days → several stars, each with its own day number
  const T=(iso,d)=>({[iso]:true}); const w2=world({db:true,drillToday:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22",runStart:"2026-10-05"},owed:{"2026-10-20":true,"2026-10-22":true}}}}}});
  w2.tsBonusSettle("lucy",w2.tsStreaks("lucy"));
  ok("three owed days (Oct 20 · 22 · today) → badge 3, Collect 3", w2.tsOwedDays("lucy","drills").length===3&&/⭐ Collect 3</.test(w2.tsShelfHTML("lucy"))&&/⭐ 3<\/span>/.test(w2.tsStripHTML("lucy")));
  const g=w2.tsCollect("lucy","drills");
  ok("Collect banks 3 × 1 ⭐ — days 10, 11 and 12 of the run — and clears all three", g===3&&w2.banks.filter(b=>b[1]===1).map(b=>b[2]).join("|")==="kept your drills streak going (day 10)|kept your drills streak going (day 11)|kept your drills streak going (day 12)"&&JSON.stringify(w2.writes[w2.writes.length-1][1])===JSON.stringify({"2026-10-20":null,"2026-10-22":null,[TODAY]:null})&&/\+3 — 3 stars/.test(w2.toasts[w2.toasts.length-1]), w2.banks);
  // the cap: three streaks → at most 3 owed a day
  const w3=world({db:true}); const F=n=>({doneToday:true,now:n,newBest:false,runStart:"2026-10-19",pos:{}});
  const p3=w3.tsBonusSettle("lucy",{ready:true,today:TODAY,drills:F(5),cards:F(2),routines:F(3)});
  ok("three streaks kept → 3 owed, no more (one star each)", p3.owed.length===3&&w3.tsOwedCount("lucy")===3&&w3.writes.length===3&&w3.banks.length===0);
  // the week-old drop
  ok("7 school days back from Fri Oct 23 is Fri Oct 9 (Oct 21 co-op, Oct 12 holiday, weekends skipped)", w3.tsOwedFloor("lucy",TODAY)==="2026-10-09");
  const w4=world({db:true,drillToday:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22",runStart:"2026-10-05"},owed:{"2026-10-07":true,"2026-10-08":true,"2026-10-09":true,"2026-10-20":true}}}}}});
  const p4=w4.tsBonusSettle("lucy",w4.tsStreaks("lucy"));
  ok("when today is owed, days older than 7 school days (Oct 7, 8) drop — Oct 9, 20 and today stay", p4.owed.length===1&&w4.tsOwedDays("lucy","drills").join(",")==="2026-10-09,2026-10-20,"+TODAY, w4.tsOwedDays("lucy","drills"));
  ok("…the drop rides the same one multi-path update as today's owed day: nulls for Oct 7 and 8, owed/today true, owedDay", (()=>{ const u=w4.writes.filter(x=>x[0]==="trophies/streaks/lucy/drills"); return u.length===1&&JSON.stringify(u[0][1])===JSON.stringify({"owed/2026-10-07":null,"owed/2026-10-08":null,["owed/"+TODAY]:true,owedDay:TODAY}); })(), w4.writes);
  const w5=world({db:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22",runStart:"2026-10-05"},owed:{"2026-10-07":true}}}}}});
  w5.tsBonusSettle("lucy",w5.tsStreaks("lucy"));
  ok("…nothing drops on a day nothing new is owed (not done today): Oct 7 still waits, no write", w5.tsOwedDays("lucy","drills").length===1&&w5.writes.length===0);
  // nothing without the tap, kid-only, dry-run
  const w6=world({db:true,drillToday:true}); w6.tsStripHTML("lucy"); w6.tsShelfHTML("lucy"); w6.tsMomLineHTML("lucy");
  ok("rendering the strip, the shelf and Mom's line never banks the owed star (only the first-open 5 ⭐)", w6.banks.length===1&&w6.banks[0][1]===5&&w6.tsOwedDays("lucy","drills").length===1);
  const k=world({db:true,kcKid:"ellis",trophies:{streaks:{lucy:{drills:{owed:{"2026-10-22":true}}}}}});
  ok("Collect from another kid's device → nothing", k.tsCollect("lucy","drills")===0&&k.banks.length===0&&k.writes.length===0);
  const dd=world({db:true,dry:true,drillToday:true,trophies:{streaks:{lucy:{drills:{owed:{"2026-10-22":true}}}}}}); dd.tsBonusSettle("lucy",dd.tsStreaks("lucy"));
  ok("?dryrun=1: no owed write, no bank on Collect", dd.writes.length===0&&dd.tsCollect("lucy","drills")===0&&dd.banks.length===0);
  const nd=world({trophies:{streaks:{lucy:{drills:{owed:{"2026-10-22":true}}}}}});
  ok("no db → Collect does nothing", nd.tsCollect("lucy","drills")===0&&nd.banks.length===0);
  const w7=world({db:true,loading:true,routinesToday:true}); const p7=w7.tsBonusSettle("lucy",w7.tsStreaks("lucy"));
  ok("routines kept as loaded but the older weeks missing → waits and asks for the history; no owed write for routines", !p7.owed.includes("routines")&&w7.loads.length===1&&!w7.writes.some(x=>/routines/.test(x[0])));
  { const q=world({db:true,loading:true,routinesToday:true,trophies:{streaks:{lucy:{routines:{best:{n:9,date:"2026-09-01",runStart:"2026-08-20"}}}}}}); q.tsStripHTML("lucy");
    ok("the strip asks for the older weeks when the routines day as loaded is kept (now ≥ 2) even with no best or nudge near", q.loads.length>=1); }
  const one=world({db:true}); const S1={ready:true,today:TODAY,drills:{doneToday:true,now:1,newBest:false,runStart:TODAY,pos:{}},cards:{doneToday:false,now:5},routines:{doneToday:false,now:0}};
  ok("a first day (now 1) owes nothing; a streak not done today owes nothing", one.tsBonusSettle("lucy",S1).owed.length===0&&one.writes.length===0);
  ok("a shelf with nothing owed shows no Collect button and no week line", !/Collect/.test(world().tsShelfHTML("lucy"))&&!/Stars wait/.test(world().tsShelfHTML("lucy")));
  ok("kid-safe: no counting of what a child missed on the shelf with stars waiting", !/miss|wrong|not done|behind|late/i.test(w2.tsShelfHTML("lucy").replace(/<[^>]+>/g," ").replace(/Owl Moon|Story of the World/g,"")));
}

console.log("5. The shelf: sections only when they have something; the bank is a link, not a copy");
{ const w=world(); const h=w.tsShelfHTML("lucy");
  ok("titled for the kid, with a close button", /Lucy’s Trophy Shelf/.test(h)&&/tsToggle\('lucy'\)/.test(h));
  ok("📚 Book trophies: the read book (once — trophy and log book are the same book), the milestone book, the log's other finished book", /Book trophies/.test(h)&&(h.split("Finished curriculum")[0].match(/Charlotte's Web/g)||[]).length===1&&/Singapore 5A/.test(h)&&/Owl Moon/.test(h)&&!/Frog and Toad<\/span>/.test(h.split("Reading log")[0]));
  ok("🎓 Finished curriculum from the done records: Singapore 5B finished Oct 20; Science (last lesson open) and Handwriting (daily) are not", /Finished curriculum/.test(h)&&/Singapore 5B/.test(h)&&/finished Oct 20/.test(h)&&!/>Science</.test(h)&&!/Handwriting/.test(h));
  ok("…a subject finished before its lessons were stamped keeps its trophy (Story of the World 2)", /Story of the World 2/.test(h));
  ok("📖 Reading log: recent entries, newest first, with pages", /Reading log/.test(h)&&h.indexOf("pp. 12–24")<h.indexOf("pp. 1–12")&&/Frog and Toad/.test(h));
  ok("🔥 Streaks: three lines, best · last · now", /Streaks/.test(h)&&/best 11 · last 0 · now 11/.test(h)&&/best 7 · last 7 · now 0/.test(h)&&/best 3 · last 3 · now 3/.test(h));
  { const lines=h.slice(h.indexOf("Streaks")).split('<div style="display:flex;align-items:center;gap:8px;padding:').slice(1); const L=n=>lines.find(x=>x.indexOf(n)>=0)||"";
    ok("…the drills (new best) and routine lists (tied) lines glow, the school cards line does not", lines.length===3&&/#fbbf24/.test(L("drills"))&&/#fbbf24/.test(L("routine lists"))&&!/#fbbf24/.test(L("school cards"))); }
  ok("the Star Bank is a link (popOpen bank), no balance or ledger copied in", /popOpen\('lucy','bank'\)/.test(h)&&!/in your bank/.test(h)&&!/adjustments/.test(h));
  ok("no counting of what a child did wrong", !/miss|wrong|not done|behind|late|no\b/i.test(h.replace(/<[^>]+>/g," ").replace(/Owl Moon|Story of the World/g,"")));
  const l=world({loading:true}); const hl=l.tsShelfHTML("lucy");
  ok("opening the shelf asks for the older routine weeks; until they arrive the routines line says it is still counting while drills and cards show their numbers", l.loads.length>=1&&/routine lists — ⏳ still counting/.test(hl)&&/best 11 · last 0 · now 11/.test(hl)&&!/best 3 · last/.test(hl));
  const e=world(); const he=e.tsShelfHTML("ellis");
  ok("a kid with no records: the friendly line, no sections, still the bank link", /ready for its first trophy/.test(he)&&!/Book trophies|Finished curriculum|Reading log|Streaks/.test(he)&&/popOpen\('ellis','bank'\)/.test(he));
  const se=e.tsStreaks("ellis");
  ok("…and zero streaks", se.drills.best===0&&se.cards.best===0&&se.routines.best===0&&e.tsNudgeText(se)==="");
}

console.log("6. The top strip and Mom's Day line");
{ const w=world(); const s=w.tsStripHTML("lucy");
  ok("🏆 Trophies button (tsToggle) + the nudge line", /🏆 Trophies/.test(s)&&/tsToggle\('lucy'\)/.test(s)&&/✨ new best drills streak — 11 days!/.test(s));
  w.tsToggle("lucy"); ok("tap → open for that kid, redraws", w.get("tsOpenKid")==="lucy"&&w.renders.length===1&&/🏆 Trophies ▴/.test(w.tsStripHTML("lucy")));
  w.tsToggle("lucy"); ok("tap again → closed", w.get("tsOpenKid")==="");
  const e=world(); ok("no nudge, no line (Ellis)", !/✨/.test(e.tsStripHTML("ellis")));
  ok("Mom's Day: one small line of current streaks", w.tsMomLineHTML("lucy")==='<div style="margin-top:3px;font-size:11px;color:#6b6560">🔥 drills 11 · cards 0 · routines 3</div>', w.tsMomLineHTML("lucy"));
  ok("…absent when the kid has no streaks", w.tsMomLineHTML("ellis")==='');
  { const l=world({loading:true}); ok("…absent while the older routine weeks load — and Mom's Day asks for them (her Household cards do too)", l.tsMomLineHTML("lucy")===''&&l.loads.length===1); }
  { const l=world({loading:true}); l.tsStripHTML("lucy"); ok("the strip asks for the older weeks only when the routines streak as loaded has something to decide (Lucy: tied at 3 → yes)", l.loads.length===1);
    const q=world({loading:true}); q.tsStripHTML("ellis"); ok("…and never just to draw the button (Ellis: nothing near → no read)", q.loads.length===0&&!/✨/.test(q.tsStripHTML("ellis"))); }
}

console.log("7. With the shelf closed, Kids' Corner renders byte-identically to base plus the button");
{ const corner=o=>{ const c=world(o); const extra={ _kcLoadKid:()=>{}, kcCalGet:()=>"today", kcEmoji:()=>"🦄", _kcTint:()=>"#eee", kcCalToggleHTML:k=>"TOGGLE", kcModeBodyHTML:k=>"CORNERBODY", kcOtherKidsHTML:k=>"<i>others</i>", window:{scrollTo:()=>{}} };
    Object.keys(extra).forEach(k=>{ c[k]=extra[k]; }); vm.runInContext(fn("renderKidsCorner"),c); return c; };
  const withB=corner(); const el={innerHTML:""}; withB.renderKidsCorner(el); const A=el.innerHTML;
  const base=corner(); ["tsStripHTML","tsShelfHTML","tsOpenKid"].forEach(k=>vm.runInContext(k+"=undefined",base)); const el2={innerHTML:""}; base.renderKidsCorner(el2); const B=el2.innerHTML;
  const strip=withB.tsStripHTML("lucy");
  ok("the Corner = base + the strip, nothing else moved", A.indexOf(strip)>0&&A.replace(strip,"")===B, {a:A.length,b:B.length});
  ok("the strip sits inside the coloured header, after the name row", A.indexOf(strip)<A.indexOf("TOGGLE")&&A.indexOf(strip)>A.indexOf("<i>others</i>"));
  ok("closed → no shelf", !/Trophy Shelf/.test(A));
  withB.tsToggle("lucy"); const el3={innerHTML:""}; withB.renderKidsCorner(el3); const C=el3.innerHTML;
  ok("open → the shelf draws between the header and the Today | My Lists | Month toggle", /Lucy’s Trophy Shelf/.test(C)&&C.indexOf("Trophy Shelf")<C.indexOf("TOGGLE")&&C.indexOf("TOGGLE")<C.indexOf("CORNERBODY"));
  const other=corner({kcKid:"ellis"}); vm.runInContext("tsOpenKid='lucy'",other); const el4={innerHTML:""}; other.renderKidsCorner(el4);
  ok("another kid's page never shows Lucy's open shelf", !/Trophy Shelf/.test(el4.innerHTML));
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
