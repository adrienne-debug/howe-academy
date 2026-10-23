/*
 * 🏆 TROPHYSHELF (her decisions 2026-10-22): a 🏆 Trophies button in a kid's top strip in Kids' Corner opens the Trophy Shelf
 * INSIDE the Corner — Book trophies, Finished curriculum (from curriculum/done), the Reading Log's recent entries, and three streaks (drills · school cards · routine lists) counted on SCHOOL DAYS ONLY from records (weekends,
 * holidays and co-op days are skipped, never broken). best · last · now per streak; a nudge one day from the best; 5 ⭐ once
 * the day a streak beats its best, remembered at trophies/streaks/<kid>/<streak>/best; one line of current streaks on Mom's
 * Day kid rows; with the shelf closed the Corner renders byte-identically to base plus the button.
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
ok("its only Firebase write is the remembered best (one targeted set)", (BLOCK.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\("trophies\/streaks\/"\+kid\+"\/"\+st\.id\+"\/best"\)\.set\(best\)/.test(BLOCK)&&!/db\.ref\([^)]*\)\.(update|remove|push)\(/.test(BLOCK));
ok("the bonus goes through bankDirect with the plain note", /bankDirect\(kid,TS_BONUS,"beat your best "\+st\.label\+" streak"\)/.test(BLOCK)&&/TS_BONUS=5\b/.test(BLOCK));
ok("writes only when db && !_dryRun()", /typeof db==="undefined"\|\|!db\|\|\(typeof _dryRun==="function"&&_dryRun\(\)\)\) return \[\]/.test(BLOCK));
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
  if(o.db) ctx.db={ref:p=>({set:v=>writes.push([p,v])})};
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

console.log("4. The bonus pays once, records the best, and stays inert in dry-run / off the kid's page");
{ const w=world({db:true}); const S=w.tsStreaks("lucy");
  const paid=w.tsBonusSettle("lucy",S);
  ok("drills beat its best (11 > 7 before) → paid once", JSON.stringify(paid)==='["drills"]'&&w.banks.length===1&&w.banks[0][0]==="lucy"&&w.banks[0][1]===5&&w.banks[0][2]==="beat your best drills streak", w.banks);
  ok("the best is remembered at trophies/streaks/lucy/drills/best = {n,date} — the only write", w.writes.length===1&&w.writes[0][0]==="trophies/streaks/lucy/drills/best"&&w.writes[0][1].n===11&&w.writes[0][1].date===TODAY, w.writes);
  ok("routines tied its best (3 = 3) → nothing", !paid.includes("routines")&&!paid.includes("cards"));
  ok("a kid-safe toast", w.toasts.length===1&&/\+5/.test(w.toasts[0])&&/beat your best drills streak/.test(w.toasts[0]), w.toasts);
  const S2=w.tsStreaks("lucy"); const again=w.tsBonusSettle("lucy",S2);
  ok("the same best never pays twice: the record now says 11, so best 11 · now 11, no new best", again.length===0&&w.banks.length===1&&S2.drills.best===11&&!S2.drills.newBest&&S2.drills.bestToday===true, S2.drills);
  ok("…and the strip still celebrates today's new best", w.tsNudgeText(S2)==="new best drills streak — 11 days!");
  const w2=world({db:true,drillToday:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:TODAY}}}}}}); const S3=w2.tsStreaks("lucy");
  ok("tomorrow's extension (12 > 11) is a new best again — one more 5 ⭐", S3.drills.now===12&&S3.drills.newBest===true&&w2.tsBonusSettle("lucy",S3).length===1&&w2.writes[0][1].n===12);
  const d=world({db:true,dry:true}); d.tsBonusSettle("lucy",d.tsStreaks("lucy"));
  ok("?dryrun=1 → no bank line, no write", d.banks.length===0&&d.writes.length===0);
  const n=world(); n.tsBonusSettle("lucy",n.tsStreaks("lucy"));
  ok("no db → nothing", n.banks.length===0);
  const l=world({db:true,loading:true,routinesToday:true}); const pl=l.tsBonusSettle("lucy",l.tsStreaks("lucy"));
  ok("older routine weeks not loaded: drills (whole data) still pays; routines looks like a new best (4 > 3 as loaded) but waits and asks for the history instead", JSON.stringify(pl)==='["drills"]'&&l.banks.length===1&&l.loads.length===1&&!l.writes.some(w=>/routines/.test(w[0])));
  const r=world({db:true,trophies:{streaks:{lucy:{drills:{best:{n:11,date:"2026-10-22"}}}}}}); r.tsBonusSettle("lucy",r.tsStreaks("lucy"));
  ok("another device already wrote this best → nothing", r.banks.length===0&&r.writes.length===0);
  const m=world({db:true,kcKid:"ellis"}); m.tsStripHTML("lucy");
  ok("the strip settles only on the kid's own page (another kid's device draws Lucy's strip → no pay)", m.banks.length===0);
  const s=world({db:true}); s.tsStripHTML("lucy");
  ok("…on Lucy's own page the strip settles it", s.banks.length===1&&s.writes.length===1);
  const mm=world({db:true}); mm.tsMomLineHTML("lucy");
  ok("Mom's Day line never pays", mm.banks.length===0&&mm.writes.length===0);
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
