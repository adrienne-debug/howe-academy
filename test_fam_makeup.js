/*
 * 📚 FAMMAKEUP — "If a day is missed" for family subjects (her ask 2026-10-11: DeWalt's Friday Oct 9 block was skipped).
 *   skip (default) = today's behaviour · next = the owed lesson doubles onto the next day the subject runs ·
 *   same (week mode) = it waits for the next same weekday. Cap: never more than 2 lessons on a card (her words: "cap at 2 a day").
 * Real FAMBLOCK + FAMTOGETHER + FAMLESSONS code on stubs; records come from this week and the archive.
 *   run: node test_fam_makeup.js
 */
const fs=require("fs"),path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const sl=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice "+a); return src.slice(i,j); };
const FAM=sl("// FAMBLOCK_START","// FAMBLOCK_END"), TG=sl("// FAMTOGETHER_START","// FAMTOGETHER_END"), FL=sl("// FAMLESSONS_START","// FAMLESSONS_END");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const toMin=t=>{ const m=String(t||"").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return NaN; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+(+m[2]); };
const fromMin=v=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
function env(E){
  return new Function("toMin","fromMin","E",`
    var rulesData=E.rulesData, currData=E.currData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState=E.hist||{}, WK="week2", db=null, archive=E.archive||{};
    const ROSTER=["taylor","makenzie","andrew","caleb"], KID_COLOR={};
    function fbArr(v){ if(!v) return v; if(Array.isArray(v)) return v; if(typeof v==="object"){ const k=Object.keys(v); if(k.length&&k.every(x=>/^\\d+$/.test(x))) return k.sort((a,b)=>a-b).map(x=>v[x]); } return v; }
    function cap(s){ return s?s[0].toUpperCase()+s.slice(1):s; } function esc(s){ return String(s==null?"":s).replace(/</g,"&lt;"); }
    function _dryRun(){ return true; } function momHere(){ return true; } function renderAll(){} function dbg(){} function confirm(){ return true; } function alert(){}
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function smapIsKidOff(k,ds){ return !!(E.off&&E.off[k+"|"+ds]); } function coopTimedEndMin(k,ds){ return (E.coop&&E.coop[k+"|"+ds])||0; }
    function planBacked(){ return false; } function cbTodayISO(){ return E.today; } function routineDateISO(d){ return (E.dayISO||{})[d]||null; } var gvShowPast=false;
    var document={getElementById:id=>E.dom&&(id in E.dom)?{value:E.dom[id]}:null};
    const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
    ${FAM}
    ${TG}
    ${FL}
    if(E.prog) famProgress=E.prog;
    return {famLessonMap,famLessonFor,famCheckPre,famBeforeUncheck,famDoneN,famProgBump,famTrackSaveWeek,famTrackSaveSeq,famTrackSetMissed,famMissedMode,famOwedList,famRecordAt,famMadeUpSet,famGridHTML,famLessonsEditorHTML,famDefs,rd:()=>rulesData,checked,histState,weekData};
  `)(toMin,fromMin,E);
}
const SD={defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"};
// DeWalt's calendar: Wk 1 Oct 5–9 (co-op Thu Oct 8), Wk 2 Oct 12–16 (co-op Thu Oct 15), break Oct 19–23, Wk 3 from Oct 26
const dates=["2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"];
const lessons={andrew:{}}; dates.forEach((d,i)=>lessons.andrew[i+1]={date:d,week:"Wk "+(i<5?1:i<10?2:3)});
const KIDS=["taylor","makenzie","andrew","caleb"];
const coop={}; KIDS.forEach(k=>{ coop[k+"|2026-10-08"]=900; coop[k+"|2026-10-15"]=900; });
const HIST=()=>({key:"h",name:"History",minutes:30,pts:20,track:{mode:"week",book:"BiblioPlan",startDate:"2026-10-05",startWeek:7,total:34,
  days:{Mon:"Day 1",Tue:"Day 2",Wed:"Day 3",Thu:"Map work",Fri:"Presidents"},topics:{7:"France versus Germany; Lady Liberty",8:"The Transcontinental Railroad; Moving Out West",9:"The Emergence of Japan"}}});
const SCI=()=>({key:"s",name:"Science",minutes:30,pts:20,track:{mode:"seq",list:[{t:"Space Science L6 — Terrestrial Planets",n:3},{t:"Space Science L7 — The Phases of the Moon",n:3},{t:"Space Science L8 — The Tides and Gravity",n:3}]}});
const FT=(h,s)=>({name:"Family Time",kids:KIDS,days:["Mon","Tue","Wed","Thu","Fri"],at:"lunch",items:[h||HIST(),s||SCI(),{key:"r",name:"Read Aloud",minutes:20}]});
// Week 1 as the archive holds it: cards Mon/Tue/Wed/Fri (co-op Thu had none); Mon–Wed checked with their labels, FRIDAY NOT.
function week1Archive(o){
  o=o||{}; const tasks=[], checked={}, history={};
  const lab={h:{monday:"BiblioPlan Wk 7 · Day 1 — France versus Germany; Lady Liberty",tuesday:"BiblioPlan Wk 7 · Day 2 — France versus Germany; Lady Liberty",wednesday:"BiblioPlan Wk 7 · Day 3 — France versus Germany; Lady Liberty"},
             s:{monday:"Space Science L6 — Terrestrial Planets · day 1 of 3",tuesday:"Space Science L6 — Terrestrial Planets · day 2 of 3",wednesday:"Space Science L6 — Terrestrial Planets · day 3 of 3"}};
  ["monday","tuesday","wednesday","friday"].forEach(dn=>{ ["h","s"].forEach(k=>{ KIDS.forEach((kid,i)=>{ const id="w1_"+k+"_"+dn+"_"+i; tasks.push({id,who:kid,day:dn,famBlock:"ft",famItem:k,title:"🏡 "+k});
    if(dn!=="friday"||(o.fridayDone||[]).indexOf(k)>=0){ checked[id]="1:30 PM"; history[id]={id,famLabel:lab[k][dn]||("fri "+k)}; } }); }); });
  return {week1:{weekLabel:"week1",tasks,checked,history,dates:{monday:"Oct 5",tuesday:"Oct 6",wednesday:"Oct 7",thursday:"Oct 8",friday:"Oct 9"}}};
}
const WK2={monday:"2026-10-12",tuesday:"2026-10-13",wednesday:"2026-10-14",thursday:"2026-10-15",friday:"2026-10-16"};
const base=extra=>Object.assign({rulesData:{schoolDay:SD,familyBlocks:{ft:FT()}},currData:{subjects:{},lessons},coop,today:"2026-10-12",dayISO:WK2,archive:week1Archive(),prog:{ft:{s:{done:3}}}},extra||{});
const setMissed=(E,i,mode,from)=>{ const its=E.rd().familyBlocks.ft.items; its[i].track.missed=mode; its[i].track.missedFrom=from===undefined?"2026-10-05":from; };
const map=(E,i)=>{ const b=E.famDefs().ft; return E.famLessonMap(b,"ft",b.items[i]); };

console.log("1. default = skip: exactly today's behaviour, nothing owed");
{ const E=env(base()); const h=map(E,0), s=map(E,1);
  ok("History Mon 10/12 = Wk 8 · Day 1, Fri 10/16 = Wk 8 · Presidents (no doubling)", /^BiblioPlan Wk 8 · Day 1 — The Transcontinental/.test(h.byDate["2026-10-12"])&&h.byDate["2026-10-16"]==="BiblioPlan Wk 8 · Presidents — The Transcontinental Railroad; Moving Out West", h.byDate["2026-10-16"]);
  ok("Science Mon 10/12 = L7 day 1 (the place never skipped — the book just slid)", /L7 .* · day 1 of 3$/.test(s.byDate["2026-10-12"]), s.byDate["2026-10-12"]);
  ok("nothing owed, nothing made up", h.owed.length===0&&s.owed.length===0&&!Object.keys(h.madeUp).length&&!Object.keys(s.madeUp).length);
  ok("archived Friday is read as NOT recorded; archived Wednesday IS (label from the archive)", E.famRecordAt("ft","h","2026-10-09")===null&&/Wk 7 · Day 3/.test((E.famRecordAt("ft","h","2026-10-07")||{}).label));
}
console.log("2. History — 'same weekday': the missed Presidents Friday doubles onto NEXT Friday");
{ const E=env(base()); setMissed(E,0,"same"); const h=map(E,0);
  ok("owed = [Fri Oct 9] only — co-op Thursday is not a miss, checked days are not", JSON.stringify(h.owed)===JSON.stringify(["2026-10-09"]), h.owed);
  ok("Mon 10/12 untouched (wrong weekday)", h.byDate["2026-10-12"]==="BiblioPlan Wk 8 · Day 1 — The Transcontinental Railroad; Moving Out West", h.byDate["2026-10-12"]);
  ok("Fri 10/16 = Wk 8 · Presidents + Wk 7 · Presidents (missed Oct 9)", h.byDate["2026-10-16"]==="BiblioPlan Wk 8 · Presidents — The Transcontinental Railroad; Moving Out West + Wk 7 · Presidents (missed Oct 9)", h.byDate["2026-10-16"]);
  ok("Grid short form: 'Wk 8 · Presidents + Wk 7 · Presidents'", h.short["2026-10-16"]==="Wk 8 · Presidents + Wk 7 · Presidents", h.short["2026-10-16"]);
  ok("madeUp[Fri 10/16] = Oct 9", h.madeUp["2026-10-16"]==="2026-10-09");
  ok("'Next:' line shows today's lesson and 1 to make up", /Wk 8 · Day 1/.test(h.now)&&/1 to make up/.test(E.famLessonsEditorHTML("ft",E.famDefs().ft,E.famDefs().ft.items[0],0,false)));
  ok("Family Grid cell carries the doubled lesson", /Wk 8 · Presidents \+ Wk 7 · Presidents/.test(E.famGridHTML()));
}
console.log("3. History — 'next day it runs': it doubles onto Monday instead");
{ const E=env(base()); setMissed(E,0,"next"); const h=map(E,0);
  ok("Mon 10/12 = Wk 8 · Day 1 + Wk 7 · Presidents (missed Oct 9)", /^BiblioPlan Wk 8 · Day 1 — The Transcontinental Railroad; Moving Out West \+ Wk 7 · Presidents \(missed Oct 9\)$/.test(h.byDate["2026-10-12"]), h.byDate["2026-10-12"]);
  ok("Fri 10/16 back to a single lesson", h.byDate["2026-10-16"]==="BiblioPlan Wk 8 · Presidents — The Transcontinental Railroad; Moving Out West");
}
console.log("4. Science — 'next': two sittings Monday, the book is back on pace");
{ const E=env(base()); setMissed(E,1,"next"); const s=map(E,1);
  ok("owed = [Fri Oct 9]", JSON.stringify(s.owed)===JSON.stringify(["2026-10-09"]), s.owed);
  ok("Mon 10/12 = L7 day 1 of 3 + L7 day 2 of 3", s.byDate["2026-10-12"]==="Space Science L7 — The Phases of the Moon · day 1 of 3 + Space Science L7 — The Phases of the Moon · day 2 of 3", s.byDate["2026-10-12"]);
  ok("short: 'Space Science L7 · 1/3 + Space Science L7 · 2/3'", s.short["2026-10-12"]==="Space Science L7 · 1/3 + Space Science L7 · 2/3", s.short["2026-10-12"]);
  ok("Tue = day 3 of 3, Wed = L8 day 1 — everything after moves up one sitting", /L7 .*day 3 of 3$/.test(s.byDate["2026-10-13"])&&/L8 .*day 1 of 3$/.test(s.byDate["2026-10-14"]));
  const E0=env(base()); const s0=map(E0,1);
  ok("the book ends one run day earlier than with skip", s.ends<s0.ends, [s.ends,s0.ends]);
  ok("'same' is meaningless for in-order lessons → treated as skip", (()=>{ const E2=env(base()); setMissed(E2,1,"same"); return E2.famMissedMode(E2.famDefs().ft.items[1].track)==="skip"&&map(E2,1).owed.length===0; })());
}
console.log("5. the cap — never more than 2 on a day; the rest waits");
{ // two misses: week 1 ran Thu too (no co-op) and both Thu + Fri were skipped
  const c2={}; KIDS.forEach(k=>{ c2[k+"|2026-10-15"]=900; });
  const arch=week1Archive(); ["h","s"].forEach(k=>KIDS.forEach((kid,i)=>arch.week1.tasks.push({id:"w1_"+k+"_thursday_"+i,who:kid,day:"thursday",famBlock:"ft",famItem:k,title:"🏡 "+k})));
  const E=env(base({coop:c2,archive:arch})); setMissed(E,1,"next"); setMissed(E,0,"next"); const s=map(E,1), h=map(E,0);
  ok("Science owed = [Thu Oct 8, Fri Oct 9]", JSON.stringify(s.owed)===JSON.stringify(["2026-10-08","2026-10-09"]), s.owed);
  ok("Mon takes ONE (L7 1/3 + 2/3), Tue takes the other (L7 3/3 + L8 1/3) — never three", s.short["2026-10-12"]==="Space Science L7 · 1/3 + Space Science L7 · 2/3"&&s.short["2026-10-13"]==="Space Science L7 · 3/3 + Space Science L8 · 1/3"&&!/\+.*\+/.test(s.byDate["2026-10-12"]), [s.short["2026-10-12"],s.short["2026-10-13"]]);
  ok("madeUp Mon = Oct 8 (oldest first), Tue = Oct 9", s.madeUp["2026-10-12"]==="2026-10-08"&&s.madeUp["2026-10-13"]==="2026-10-09");
  ok("History 'next': Mon gets Map work, Tue gets Presidents", /\+ Wk 7 · Map work/.test(h.byDate["2026-10-12"])&&/\+ Wk 7 · Presidents/.test(h.byDate["2026-10-13"]), [h.short["2026-10-12"],h.short["2026-10-13"]]);
  const E2=env(base({coop:c2,archive:arch})); setMissed(E2,0,"same"); const h2=map(E2,0);
  ok("History 'same': Fri 10/16 takes Presidents; Thu's Map work skips co-op Thu 10/15 and waits for Thu 10/29", h2.madeUp["2026-10-16"]==="2026-10-09"&&h2.madeUp["2026-10-29"]==="2026-10-08"&&!h2.madeUp["2026-10-12"]&&!h2.madeUp["2026-10-13"], h2.madeUp);
}
console.log("6. counting-from and days that don't count");
{ const E=env(base()); setMissed(E,0,"same","2026-10-10"); ok("missedFrom after the miss → not owed", map(E,0).owed.length===0);
  const E2=env(base()); setMissed(E2,0,"same",""); ok("no counting-from date → nothing owed (never a surprise)", map(E2,0).owed.length===0);
  const E3=env(base({archive:week1Archive({fridayDone:["h"]})})); setMissed(E3,0,"same"); setMissed(E3,1,"next");
  ok("Friday's History WAS checked (archive) → not owed; Science still is", map(E3,0).owed.length===0&&JSON.stringify(map(E3,1).owed)===JSON.stringify(["2026-10-09"]));
  const E4=env(base({today:"2026-10-09",dayISO:{monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09"},archive:{}})); setMissed(E4,0,"same","2026-10-09");
  ok("on Friday itself (not yet done) today is not a miss", map(E4,0).owed.length===0&&!map(E4,0).madeUp["2026-10-09"], map(E4,0).owed);
}
console.log("7. Mom's one check records both, moves the place by 2, Unmark takes both back; siblings follow");
{ const tasks=KIDS.map((k,i)=>({id:"s"+i,who:k,day:"monday",famBlock:"ft",famItem:"s"}));
  const E=env(base({tasks})); setMissed(E,1,"next");
  const p0=E.famCheckPre(tasks[0]);
  ok("first copy: label = both sittings, madeUp = Oct 9, first, seq", /day 1 of 3 \+ .*day 2 of 3$/.test(p0.label)&&p0.madeUp==="2026-10-09"&&p0.first&&p0.seq, p0);
  // what finalizeDone does now: mark + record (famLabel, famMadeUp) + bump once + once more for the make-up
  E.checked.s0="1:30 PM"; E.histState.s0={famLabel:p0.label,famMadeUp:p0.madeUp}; E.famProgBump("ft","s",1); E.famProgBump("ft","s",1);
  ok("place = 5", E.famDoneN("ft","s")===5);
  const p1=E.famCheckPre(tasks[1]);
  ok("second copy: same label, same madeUp, NOT first", p1.label===p0.label&&p1.madeUp==="2026-10-09"&&!p1.first, p1);
  const s=map(E,1);
  ok("today shows what was recorded; nothing owed any more; Tue = L7 day 3", s.byDate["2026-10-12"]===p0.label&&s.owed.length===0&&/day 3 of 3$/.test(s.byDate["2026-10-13"]), [s.owed,s.byDate["2026-10-13"]]);
  ok("madeUp set knows Oct 9 was made up", E.famMadeUpSet("ft","s")["2026-10-09"]===true);
  E.famBeforeUncheck("s0");
  ok("Unmark → place back to 3 (both sittings taken back)", E.famDoneN("ft","s")===3, E.famDoneN("ft","s"));
  const th=KIDS.map((k,i)=>({id:"h"+i,who:k,day:"friday",famBlock:"ft",famItem:"h"}));
  const E2=env(base({tasks:th})); setMissed(E2,0,"same"); const ph=E2.famCheckPre(th[0]);
  ok("History Friday card: label carries the make-up, madeUp Oct 9, no place to move", /\+ Wk 7 · Presidents \(missed Oct 9\)$/.test(ph.label)&&ph.madeUp==="2026-10-09"&&ph.seq===false, ph);
  ok("famLessonFor on the card = the doubled label", E2.famLessonFor(th[1])===ph.label);
}
console.log("8. the setting: saved with the block, rides through re-saves, skip clears it");
{ const E=env(base()); E.famTrackSetMissed("ft",0,"missed","same"); let tr=E.rd().familyBlocks.ft.items[0].track;
  ok("'same' saved, counting from today by default", tr.missed==="same"&&tr.missedFrom==="2026-10-12", tr);
  E.famTrackSetMissed("ft",0,"missedFrom","2026-10-05"); tr=E.rd().familyBlocks.ft.items[0].track; ok("counting-from date saved", tr.missedFrom==="2026-10-05");
  E.famTrackSetMissed("ft",0,"missedFrom","bogus"); ok("a bad date is ignored", E.rd().familyBlocks.ft.items[0].track.missedFrom==="2026-10-05");
  E.famTrackSetMissed("ft",1,"missed","same"); ok("'same' refused for in-order lessons", !E.rd().familyBlocks.ft.items[1].track.missed);
  E.famTrackSetMissed("ft",1,"missed","next"); ok("'next' saved on Science", E.rd().familyBlocks.ft.items[1].track.missed==="next");
  const E2=env(base({dom:{"famtr-ft-0-book":"BiblioPlan","famtr-ft-0-sw":"7","famtr-ft-0-start":"2026-10-05","famtr-ft-0-total":"34","famtr-ft-0-dMon":"Day 1","famtr-ft-0-dFri":"Presidents","famtr-ft-0-topics":"","famtr-ft-1-list":"Space Science L6 ×3","famtr-ft-1-n":"1"}}));
  setMissed(E2,0,"same"); setMissed(E2,1,"next"); E2.famTrackSaveWeek("ft",0); E2.famTrackSaveSeq("ft",1);
  const w=E2.rd().familyBlocks.ft.items[0].track, q=E2.rd().familyBlocks.ft.items[1].track;
  ok("Save weeks / Save lessons keep the missed setting", w.missed==="same"&&w.missedFrom==="2026-10-05"&&w.days.Fri==="Presidents"&&q.missed==="next"&&q.list.length===1, [w,q]);
  E.famTrackSetMissed("ft",0,"missed","skip"); tr=E.rd().familyBlocks.ft.items[0].track; ok("skip clears both fields", !tr.missed&&!tr.missedFrom, tr);
  const ed=E.famLessonsEditorHTML("ft",E.famDefs().ft,E.famDefs().ft.items[1],1,true);
  ok("editor shows the control with the choice selected + counting-from; no 'same' for in-order", /If a day is missed/.test(ed)&&/value="next" selected/.test(ed)&&/counting from/.test(ed)&&!/value="same"/.test(ed));
  const edH=env(base()).famLessonsEditorHTML("ft",E.famDefs().ft,E.famDefs().ft.items[0],0,true);
  ok("week-by-week editor offers 'same weekday'; skip selected hides counting-from", /value="same"/.test(edH)&&/value="skip" selected/.test(edH)&&!/counting from/.test(edH));
}
console.log("9. wiring (source)");
{ const fd=src.slice(src.indexOf("function finalizeDone("),src.indexOf("function finalizeDone(")+9000);
  ok("finalizeDone records famMadeUp and bumps once more for a make-up day", /entry\.famMadeUp=_famPre\.madeUp/.test(fd)&&/_famPre\.first&&_famPre\.seq&&_famPre\.madeUp&&typeof famProgBump==="function"\) famProgBump\(_famPre\.id,_famPre\.key,1\)/.test(fd));
  const bu=src.slice(src.indexOf("function famBeforeUncheck("),src.indexOf("function famBeforeUncheck(")+1200);
  ok("famBeforeUncheck takes the make-up sitting back too", /_h&&_h\.famMadeUp\) famProgBump\(t\.famBlock,t\.famItem,-1\)/.test(bu));
  ok("no new Firebase paths: the setting rides in config/rules/familyBlocks items, records in history", !/db\.ref\([^)]*famMadeUp/.test(src)&&!/db\.ref\([^)]*missedFrom/.test(src));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
