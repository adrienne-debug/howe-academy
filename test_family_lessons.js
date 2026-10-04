/*
 * 📚 Lessons for family subjects (step 2, her yes 2026-10-04 — DeWalt BiblioPlan + Space Science).
 * BiblioPlan BY THE CALENDAR (Mon Day 1 · Tue Day 2 · Wed Day 3 · Thu Map work · Fri Presidents; every school week is the
 * next book week), Space Science IN ORDER (×3 days a lesson; one shared place that moves once per check).
 *   run: node test_family_lessons.js
 */
const fs=require("fs"),path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const sl=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice "+a); return src.slice(i,j); };
const FAM=sl("// FAMBLOCK_START","// FAMBLOCK_END"), TG=sl("// FAMTOGETHER_START","// FAMTOGETHER_END"), FL=sl("// FAMLESSONS_START","// FAMLESSONS_END");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const toMin=t=>{ const m=String(t||"").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return NaN; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+(+m[2]); };
const fromMin=v=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
function env(E){
  return new Function("toMin","fromMin","E",`
    var rulesData=E.rulesData, currData=E.currData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState=E.hist||{}, WK="week1", db=E.db||null;
    const ROSTER=["taylor","makenzie","andrew","caleb"], KID_COLOR={};
    function fbArr(v){ if(!v) return v; if(Array.isArray(v)) return v; if(typeof v==="object"){ const k=Object.keys(v); if(k.length&&k.every(x=>/^\\d+$/.test(x))) return k.sort((a,b)=>a-b).map(x=>v[x]); } return v; }
    function cap(s){ return s?s[0].toUpperCase()+s.slice(1):s; } function esc(s){ return String(s==null?"":s).replace(/</g,"&lt;"); }
    function _dryRun(){ return !E.db; } function momHere(){ return true; } function renderAll(){} function dbg(){} function confirm(){ return true; }
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function smapIsKidOff(k,ds){ return !!(E.off&&E.off[k+"|"+ds]); } function coopTimedEndMin(k,ds){ return (E.coop&&E.coop[k+"|"+ds])||0; }
    function planBacked(){ return false; } function cbTodayISO(){ return E.today; } function routineDateISO(d){ return (E.dayISO||{})[d]||""; } var gvShowPast=false;
    var document={getElementById:id=>E.dom&&(id in E.dom)?{value:E.dom[id]}:null};
    const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
    ${FAM}
    ${TG}
    ${FL}
    if(E.prog) famProgress=E.prog;
    return {famLessonMap,famLessonFor,famCheckPre,famBeforeUncheck,famRowHTML,famSittings,famDoneN,famProgBump,famTrackSaveSeq,famTrackSaveWeek,famGridHTML,famDefs,rd:()=>rulesData,checked,histState,weekData};
  `)(toMin,fromMin,E);
}
const SD={defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"};
// DeWalt's calendar: Oct 5–16, a break Oct 19–23, back Oct 26; co-op Thursdays Oct 8 and Oct 22 (home at 3)
const dates=["2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-26","2026-10-27"];
const lessons={andrew:{}}; dates.forEach((d,i)=>lessons.andrew[i+1]={date:d,week:"Wk "+(i<5?1:i<10?2:3)});
const coop={}; ["taylor","makenzie","andrew","caleb"].forEach(k=>{ coop[k+"|2026-10-08"]=900; });
const HIST={key:"h",name:"History",minutes:30,pts:20,track:{mode:"week",book:"BiblioPlan",startDate:"2026-10-05",startWeek:7,total:34,
  days:{Mon:"Day 1",Tue:"Day 2",Wed:"Day 3",Thu:"Map work",Fri:"Presidents"},topics:{7:"France versus Germany; Lady Liberty",8:"The Transcontinental Railroad; Moving Out West",9:"The Emergence of Japan; Immigration to the U.S."}}};
const SCI={key:"s",name:"Science",minutes:30,pts:20,track:{mode:"seq",list:[{t:"Space Science L6 — Terrestrial Planets: Earth and Mars",n:3},{t:"Space Science L7 — The Phases of the Moon",n:3},{t:"Space Science L8 — The Tides and Gravity",n:3}]}};
const FT={name:"Family Time",kids:["taylor","makenzie","andrew","caleb"],days:["Mon","Tue","Wed","Thu","Fri"],at:"lunch",items:[HIST,SCI,{key:"r",name:"Read Aloud",minutes:20}]};
const base=extra=>Object.assign({rulesData:{schoolDay:SD,familyBlocks:{ft:JSON.parse(JSON.stringify(FT))}},currData:{subjects:{},lessons},coop,today:"2026-10-05",dayISO:{monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09"}},extra||{});

console.log("1. History by the calendar (BiblioPlan)");
{ const E=env(base()); const b=E.famDefs().ft, m=E.famLessonMap(b,"ft",b.items[0]);
  ok("Mon 10/5 = BiblioPlan Wk 7 · Day 1 — France versus Germany; Lady Liberty", m.byDate["2026-10-05"]==="BiblioPlan Wk 7 · Day 1 — France versus Germany; Lady Liberty", m.byDate["2026-10-05"]);
  ok("Tue Day 2, Wed Day 3", /Wk 7 · Day 2/.test(m.byDate["2026-10-06"])&&/Wk 7 · Day 3/.test(m.byDate["2026-10-07"]));
  ok("co-op Thursday has no History (map work dropped that week)", !m.byDate["2026-10-08"]);
  ok("Fri = Wk 7 · Presidents", /^BiblioPlan Wk 7 · Presidents/.test(m.byDate["2026-10-09"]), m.byDate["2026-10-09"]);
  ok("next Monday = Wk 8 · Day 1 with its topic; Thu = Wk 8 · Map work", /Wk 8 · Day 1 — The Transcontinental Railroad/.test(m.byDate["2026-10-12"])&&/Wk 8 · Map work/.test(m.byDate["2026-10-15"]));
  ok("a week off (Oct 19–23) doesn't use up a BiblioPlan week: Oct 26 = Wk 9", /Wk 9 · Day 1 — The Emergence of Japan/.test(m.byDate["2026-10-26"]), m.byDate["2026-10-26"]);
  ok("now = today's lesson", /Wk 7 · Day 1/.test(m.now));
  ok("weeks left counted (34 − 7 + 1 = 28)", m.left===28, m.left);
  const b2=JSON.parse(JSON.stringify(b)); b2.items[0].track.total=8; const m2=E.famLessonMap(b2,"ft2",b2.items[0]);
  ok("a book that ends: total 8 → nothing after Wk 8, ends Fri 10/16", !m2.byDate["2026-10-26"]&&m2.ends==="2026-10-16", m2.ends);
}
console.log("2. Science in order (×3 days a lesson)");
{ const E=env(base()); const b=E.famDefs().ft, m=E.famLessonMap(b,"ft",b.items[1]);
  ok("sittings: 3 lessons × 3 = 9", E.famSittings(b.items[1]).length===9);
  ok("Mon L6 day 1 · Tue day 2 · Wed day 3", /L6 .* · day 1 of 3/.test(m.byDate["2026-10-05"])&&/day 2 of 3/.test(m.byDate["2026-10-06"])&&/L6 .*day 3 of 3/.test(m.byDate["2026-10-07"]));
  ok("co-op Thursday skipped, Fri = L7 day 1 (nothing lost)", !m.byDate["2026-10-08"]&&/L7 .* · day 1 of 3/.test(m.byDate["2026-10-09"]), m.byDate["2026-10-09"]);
  ok("ends on the 9th science day (Fri 10/16)", m.ends==="2026-10-16", m.ends);
  ok("after the list: ✓ all done", m.byDate["2026-10-26"]==="✓ all done");
  const E2=env(base({prog:{ft:{s:{done:1}}}})); const m3=E2.famLessonMap(E2.famDefs().ft,"ft",E2.famDefs().ft.items[1]);
  ok("place = 1 done → today shows L6 day 2 (a missed day never skips)", /day 2 of 3/.test(m3.byDate["2026-10-05"]), m3.byDate["2026-10-05"]);
}
{ const E=env(base()); const b=E.famDefs().ft; const h=E.famLessonMap(b,"ft",b.items[0]), s=E.famLessonMap(b,"ft",b.items[1]);
  ok("Grid short forms: 'Wk 7 · Day 1' and 'Space Science L6 · 1/3'", h.short["2026-10-05"]==="Wk 7 · Day 1"&&s.short["2026-10-05"]==="Space Science L6 · 1/3"&&s.short["2026-10-09"]==="Space Science L7 · 1/3", [h.short["2026-10-05"],s.short["2026-10-05"]]); }
console.log("3. checking moves the shared place ONCE per group; Unmark moves it back");
{ const tasks=["taylor","makenzie","andrew","caleb"].map((k,i)=>({id:"s"+i,who:k,day:"monday",famBlock:"ft",famItem:"s"}))
    .concat(["taylor","andrew"].map((k,i)=>({id:"h"+i,who:k,day:"monday",famBlock:"ft",famItem:"h"})));
  const E=env(base({tasks}));
  const p0=E.famCheckPre(tasks[0]);
  ok("first copy: label L6 day 1, first, in-order", /L6 .*day 1 of 3/.test(p0.label)&&p0.first&&p0.seq, p0);
  // what finalizeDone does: mark + record + bump once
  E.checked.s0="1:30 PM"; E.histState.s0={famLabel:p0.label}; E.famProgBump("ft","s",1);
  const p1=E.famCheckPre(tasks[1]);
  ok("second copy (fan-out): same label, NOT first → no second bump", p1.label===p0.label&&!p1.first, p1);
  ok("place = 1", E.famDoneN("ft","s")===1);
  ok("today's checked card keeps its recorded label; tomorrow = day 2", E.famLessonFor(tasks[0])===p0.label&&/day 2 of 3/.test(E.famLessonMap(E.famDefs().ft,"ft",E.famDefs().ft.items[1]).byDate["2026-10-06"]));
  E.famBeforeUncheck("s0");
  ok("Unmark → place back to 0", E.famDoneN("ft","s")===0);
  const ph=E.famCheckPre(tasks[4]);
  ok("History (calendar) checks don't touch any place", ph.seq===false&&/Wk 7 · Day 1/.test(ph.label));
  ok("the card shows 📚 + the lesson", /📚|\\u\{1F4DA\}/.test(E.famRowHTML(tasks[4],false,"taylor"))&&/BiblioPlan Wk 7 · Day 1/.test(E.famRowHTML(tasks[4],false,"taylor")));
}
console.log("4. the editor's list + weeks");
{ const E=env(base({dom:{"famtr-ft-1-list":"Space Science L9 — Asteroids ×3\nSpace Science L10 — The Gas Giants x2\nMarine Biology L1 — Ocean Characteristics","famtr-ft-1-n":"1"}}));
  E.famTrackSaveSeq("ft",1); const l=E.rd().familyBlocks.ft.items[1].track.list;
  ok("lines with ×3 / x2 / none → n 3, 2, 1", l.length===3&&l[0].n===3&&l[0].t==="Space Science L9 — Asteroids"&&l[1].n===2&&l[2].n===1, l);
  const E2=env(base({dom:{"famtr-ft-0-book":"BiblioPlan","famtr-ft-0-sw":"7","famtr-ft-0-start":"2026-10-05","famtr-ft-0-total":"34","famtr-ft-0-dMon":"Day 1","famtr-ft-0-dTue":"Day 2","famtr-ft-0-dWed":"Day 3","famtr-ft-0-dThu":"Map work","famtr-ft-0-dFri":"Presidents","famtr-ft-0-topics":"7: France versus Germany; Lady Liberty\nWeek 8 - The Transcontinental Railroad"}}));
  E2.famTrackSaveWeek("ft",0); const w=E2.rd().familyBlocks.ft.items[0].track;
  ok("weeks saved: start Wk 7 on 10/5, 34 weeks, 5 day roles, topics parsed ('7:' and 'Week 8 -')", w.startWeek===7&&w.total===34&&w.days.Thu==="Map work"&&w.topics["7"]==="France versus Germany; Lady Liberty"&&w.topics["8"]==="The Transcontinental Railroad", w);
}
console.log("5. wiring (source)");
{ const fd=src.slice(src.indexOf("function finalizeDone("),src.indexOf("function finalizeDone(")+9000);
  ok("finalizeDone reads the family lesson BEFORE it checks, records famLabel, bumps once", /_famPre=famCheckPre\(_ft\)/.test(fd)&&/entry\.famLabel=_famPre\.label/.test(fd)&&/_famPre\.first&&_famPre\.seq&&typeof famProgBump==="function"\) famProgBump\(_famPre\.id,_famPre\.key,1\)/.test(fd));
  ok("progress listener", /db\.ref\("famProgress"\)\.on\("value"/.test(src));
  ok("Grid header shows ends / left; cells show the lesson", /'ends '\+famFmtDate\(_lm\.ends\)/.test(src)&&/esc\(_ls\|\|_lb\|\|it\.name\|\|""\)/.test(src));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
