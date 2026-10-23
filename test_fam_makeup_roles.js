/*
 * 📚 FAMMAKEUP_ROLES — make up a missed family-lesson day BY ITS WEEKDAY ROLE (Sara DeWalt's answers 2026-10-16).
 *   A skipped reading day (Day 1/2/3) doubles onto the next day the subject runs; a skipped Presidents Friday waits for the next
 *   Presidents day. track.missedByRole = {"Presidents":"same"} rides on a week-by-week track beside track.missed ("next").
 *   "Finish last week first": owed days are made up oldest first, never more than 2 lessons on a card (her cap).
 *   Real FAMBLOCK + FAMTOGETHER + FAMBLOCKOUT + FAMLESSONS code on stubs (fixtures from test_fam_makeup).
 *   run: node test_fam_makeup_roles.js
 */
const fs=require("fs"),path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const sl=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice "+a); return src.slice(i,j); };
const FAM=sl("// FAMBLOCK_START","// FAMBLOCK_END"), TG=sl("// FAMTOGETHER_START","// FAMTOGETHER_END"), BO=sl("// FAMBLOCKOUT_START","// FAMBLOCKOUT_END"), FL=sl("// FAMLESSONS_START","// FAMLESSONS_END");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const toMin=t=>{ const m=String(t||"").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return NaN; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+(+m[2]); };
const fromMin=v=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
function env(E){
  return new Function("toMin","fromMin","E",`
    var rulesData=E.rulesData, currData=E.currData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState=E.hist||{}, WK="week2", db=null, archive=E.archive||{};
    var blockouts={}, window={HA_FAMILY:{familyId:"dewalt"}}, SITTER_NAME="Maggie", _todayDay=E.todayDay||"monday";
    const ROSTER=["taylor","makenzie","andrew","caleb"], KID_COLOR={}, DAYS_ALL=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
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
    ${BO}
    ${FL}
    if(E.prog) famProgress=E.prog;
    const writes=[], _fw=famWrite; famWrite=function(p,v){ writes.push([p,v===undefined?undefined:JSON.parse(JSON.stringify(v===null?null:v))]); return _fw(p,v); };
    return {famLessonMap,famLessonFor,famCheckPre,famMissedMode,famMissedModeFor,famMissedAny,famRoles,famRoleKey,famRoleMissed,famOwedList,famTrackSaveWeek,famTrackSaveSeq,famTrackSetMissed,famTrackSetMissedRole,famLessonsEditorHTML,famGridHTML,famBoMakeupNote,famBoRowHTML,famDefs,rd:()=>rulesData,writes,checked,histState,weekData};
  `)(toMin,fromMin,E);
}
const SD={defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"};
// DeWalt's calendar (from test_fam_makeup): Wk 1 Oct 5–9 (co-op Thu Oct 8), Wk 2 Oct 12–16 (co-op Thu Oct 15), break Oct 19–23, Wk 3 from Oct 26
const dates=["2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"];
const lessons={andrew:{}}; dates.forEach((d,i)=>lessons.andrew[i+1]={date:d,week:"Wk "+(i<5?1:i<10?2:3)});
const KIDS=["taylor","makenzie","andrew","caleb"];
const coop={}; KIDS.forEach(k=>{ coop[k+"|2026-10-08"]=900; coop[k+"|2026-10-15"]=900; });
const HIST=()=>({key:"h",name:"History",minutes:30,pts:20,track:{mode:"week",book:"BiblioPlan",startDate:"2026-10-05",startWeek:7,total:34,
  days:{Mon:"Day 1",Tue:"Day 2",Wed:"Day 3",Thu:"Map work",Fri:"Presidents"},topics:{7:"France versus Germany; Lady Liberty",8:"The Transcontinental Railroad; Moving Out West",9:"The Emergence of Japan"}}});
const SCI=()=>({key:"s",name:"Science",minutes:30,pts:20,track:{mode:"seq",list:[{t:"Space Science L6 — Terrestrial Planets",n:3},{t:"Space Science L7 — The Phases of the Moon",n:3},{t:"Space Science L8 — The Tides and Gravity",n:3}]}});
const FT=(h,s)=>({name:"Family Time",kids:KIDS,days:["Mon","Tue","Wed","Thu","Fri"],at:"lunch",items:[h||HIST(),s||SCI(),{key:"r",name:"Read Aloud",minutes:20}]});
const W7="BiblioPlan Wk 7 · ", T7=" — France versus Germany; Lady Liberty", W8="BiblioPlan Wk 8 · ", T8=" — The Transcontinental Railroad; Moving Out West";
const LAB={monday:W7+"Day 1"+T7,tuesday:W7+"Day 2"+T7,wednesday:W7+"Day 3"+T7,thursday:W7+"Map work"+T7,friday:W7+"Presidents"+T7};
// Week 1 as the archive holds it: a History card every day in `ran` (default Mon/Tue/Wed/Fri — co-op Thu had none); the days in `skipped` were never checked.
function week1Archive(skipped,ran){
  ran=ran||["monday","tuesday","wednesday","friday"]; skipped=skipped||[]; const tasks=[], checked={}, history={};
  ran.forEach(dn=>{ KIDS.forEach((kid,i)=>{ const id="w1_h_"+dn+"_"+i; tasks.push({id,who:kid,day:dn,famBlock:"ft",famItem:"h",title:"🏡 h"});
    if(skipped.indexOf(dn)<0){ checked[id]="1:30 PM"; history[id]={id,famLabel:LAB[dn]}; } }); });
  return {week1:{weekLabel:"week1",tasks,checked,history,dates:{monday:"Oct 5",tuesday:"Oct 6",wednesday:"Oct 7",thursday:"Oct 8",friday:"Oct 9"}}};
}
const WK1={monday:"2026-10-05",tuesday:"2026-10-06",wednesday:"2026-10-07",thursday:"2026-10-08",friday:"2026-10-09"};
const WK2={monday:"2026-10-12",tuesday:"2026-10-13",wednesday:"2026-10-14",thursday:"2026-10-15",friday:"2026-10-16"};
const base=extra=>Object.assign({rulesData:{schoolDay:SD,familyBlocks:{ft:FT()}},currData:{subjects:{},lessons},coop,today:"2026-10-12",dayISO:WK2,archive:week1Archive(["friday"]),prog:{ft:{s:{done:3}}}},extra||{});
// Sara's shape: readings double onto the next day (track), Presidents waits for the next Presidents day (role).
const dewalt=(E,i,roles,mode,from)=>{ const tr=E.rd().familyBlocks.ft.items[i===undefined?0:i].track; if(mode===null) delete tr.missed; else tr.missed=mode||"next"; tr.missedFrom=from===undefined?"2026-10-05":from; if(roles) tr.missedByRole=roles; else delete tr.missedByRole; };
const map=(E,i)=>{ const b=E.famDefs().ft; return E.famLessonMap(b,"ft",b.items[i||0]); };
const noCoopThu8=()=>{ const c={}; KIDS.forEach(k=>{ c[k+"|2026-10-15"]=900; }); return c; };
const twoPlus=s=>/\+.*\+/.test(String(s||""));

console.log("1. Sara's shape — missed='next' + {Presidents:'same'}: a skipped Tuesday reading doubles onto Wednesday");
{ // this week is week 1, today is Wednesday Oct 7; Monday was checked, Tuesday was not
  const tasks=[], checked={}, hist={}; ["monday","tuesday","wednesday","friday"].forEach(dn=>KIDS.forEach((k,i)=>{ const id="h_"+dn+"_"+i; tasks.push({id,who:k,day:dn,famBlock:"ft",famItem:"h"}); if(dn==="monday"){ checked[id]="12:30 PM"; hist[id]={famLabel:LAB.monday}; } }));
  const E=env(base({today:"2026-10-07",dayISO:WK1,archive:{},tasks,checked,hist})); dewalt(E,0,{Presidents:"same"}); const h=map(E);
  ok("owed = [Tue Oct 6]", JSON.stringify(h.owed)==='["2026-10-06"]', h.owed);
  ok("Wed Oct 7 = Wk 7 · Day 3 + Wk 7 · Day 2 (missed Oct 6) — the reading follows the track's 'next day'", h.byDate["2026-10-07"]===W7+"Day 3"+T7+" + Wk 7 · Day 2 (missed Oct 6)", h.byDate["2026-10-07"]);
  ok("Grid short form 'Wk 7 · Day 3 + Wk 7 · Day 2'; madeUp[Wed] = Oct 6", h.short["2026-10-07"]==="Wk 7 · Day 3 + Wk 7 · Day 2"&&h.madeUp["2026-10-07"]==="2026-10-06", h.short["2026-10-07"]);
  ok("Fri Oct 9 stays a single Presidents", h.byDate["2026-10-09"]===W7+"Presidents"+T7, h.byDate["2026-10-09"]);
  ok("the card reads the doubled label (famLessonFor)", E.famLessonFor(tasks.find(t=>t.day==="wednesday"))===h.byDate["2026-10-07"]);
  ok("famMissedModeFor: Tue (Day 2) → next, Fri (Presidents) → same, Sat (no role) → the track's next", E.famMissedModeFor(E.rd().familyBlocks.ft.items[0].track,"2026-10-06")==="next"&&E.famMissedModeFor(E.rd().familyBlocks.ft.items[0].track,"2026-10-09")==="same"&&E.famMissedModeFor(E.rd().familyBlocks.ft.items[0].track,"2026-10-10")==="next");
}
console.log("2. Sara's shape — a skipped Presidents Friday waits for the NEXT Friday (not Monday)");
{ const E=env(base()); dewalt(E,0,{Presidents:"same"}); const h=map(E);
  ok("owed = [Fri Oct 9]", JSON.stringify(h.owed)==='["2026-10-09"]', h.owed);
  ok("Mon Oct 12 is a single Day 1 even though the track says 'next day'", h.byDate["2026-10-12"]===W8+"Day 1"+T8, h.byDate["2026-10-12"]);
  ok("Fri Oct 16 = Wk 8 · Presidents + Wk 7 · Presidents (missed Oct 9) — same words as today's same-weekday case", h.byDate["2026-10-16"]===W8+"Presidents"+T8+" + Wk 7 · Presidents (missed Oct 9)", h.byDate["2026-10-16"]);
  ok("Grid: 'Wk 8 · Presidents + Wk 7 · Presidents'; madeUp[Fri 10/16] = Oct 9", h.short["2026-10-16"]==="Wk 8 · Presidents + Wk 7 · Presidents"&&h.madeUp["2026-10-16"]==="2026-10-09", h.short["2026-10-16"]);
  ok("Family Grid cell carries it; editor status says 1 to make up", /Wk 8 · Presidents \+ Wk 7 · Presidents/.test(E.famGridHTML())&&/1 to make up/.test(E.famLessonsEditorHTML("ft",E.famDefs().ft,E.famDefs().ft.items[0],0,false)));
  const th=KIDS.map((k,i)=>({id:"f"+i,who:k,day:"friday",famBlock:"ft",famItem:"h"})); const E2=env(base({tasks:th})); dewalt(E2,0,{Presidents:"same"}); const p=E2.famCheckPre(th[0]);
  ok("Mom's check on Friday records both and which day it made up", /\+ Wk 7 · Presidents \(missed Oct 9\)$/.test(p.label)&&p.madeUp==="2026-10-09"&&p.first&&!p.seq, p);
  const E3=env(base()); dewalt(E3,0,{Presidents:"same"},"same"); const h3=map(E3);
  ok("with the track itself on 'same' the answer is the same Friday", h3.byDate["2026-10-16"]===h.byDate["2026-10-16"]&&h3.byDate["2026-10-12"]===h.byDate["2026-10-12"]);
}
console.log("3. mixed: Thu map work + Fri presidents both skipped → map work doubles Monday, presidents next Friday");
{ const E=env(base({coop:noCoopThu8(),archive:week1Archive(["thursday","friday"],["monday","tuesday","wednesday","thursday","friday"])})); dewalt(E,0,{Presidents:"same"}); const h=map(E);
  ok("owed = [Thu Oct 8, Fri Oct 9], oldest first", JSON.stringify(h.owed)==='["2026-10-08","2026-10-09"]', h.owed);
  ok("Mon Oct 12 = Wk 8 · Day 1 + Wk 7 · Map work (missed Oct 8)", h.byDate["2026-10-12"]===W8+"Day 1"+T8+" + Wk 7 · Map work (missed Oct 8)", h.byDate["2026-10-12"]);
  ok("Tue Oct 13 single; Fri Oct 16 = Presidents + Wk 7 · Presidents (missed Oct 9)", h.byDate["2026-10-13"]===W8+"Day 2"+T8&&h.byDate["2026-10-16"]===W8+"Presidents"+T8+" + Wk 7 · Presidents (missed Oct 9)", [h.byDate["2026-10-13"],h.byDate["2026-10-16"]]);
  ok("madeUp: Mon = Oct 8, Fri = Oct 9, nothing else", JSON.stringify(h.madeUp)===JSON.stringify({"2026-10-12":"2026-10-08","2026-10-16":"2026-10-09"}), h.madeUp);
  // the same with the roles spelled out and the track on 'skip': readings are NOT made up, map work and presidents are
  const E2=env(base({coop:noCoopThu8(),archive:week1Archive(["wednesday","thursday","friday"],["monday","tuesday","wednesday","thursday","friday"])})); dewalt(E2,0,{Presidents:"same","Map work":"next"},null); const h2=map(E2);
  ok("track 'skip' + {Presidents:same, Map work:next}: Wed's reading is not owed, Thu + Fri are", JSON.stringify(h2.owed)==='["2026-10-08","2026-10-09"]', h2.owed);
  ok("Mon = Day 1 + Map work, Fri = Presidents + Presidents, Tue/Wed single", /\+ Wk 7 · Map work \(missed Oct 8\)$/.test(h2.byDate["2026-10-12"])&&/\+ Wk 7 · Presidents \(missed Oct 9\)$/.test(h2.byDate["2026-10-16"])&&h2.byDate["2026-10-13"]===W8+"Day 2"+T8&&h2.byDate["2026-10-14"]===W8+"Day 3"+T8, h2.short);
  ok("famMissedAny is true with the track on skip (a role makes up)", E2.famMissedAny(E2.rd().familyBlocks.ft.items[0].track)===true);
  const E3=env(base({coop:noCoopThu8(),archive:week1Archive(["thursday","friday"],["monday","tuesday","wednesday","thursday","friday"])})); dewalt(E3,0,{Presidents:"skip"}); const h3=map(E3);
  ok("a role on 'skip' under a 'next' track: presidents never owed, map work still doubles Monday", JSON.stringify(h3.owed)==='["2026-10-08"]'&&/Map work \(missed Oct 8\)$/.test(h3.byDate["2026-10-12"])&&h3.byDate["2026-10-16"]===W8+"Presidents"+T8, h3.owed);
}
console.log("4. the cap holds — never more than 2 lessons on a card; the rest waits its turn");
{ const E=env(base({archive:week1Archive(["tuesday","wednesday","friday"])})); dewalt(E,0,{Presidents:"same"}); const h=map(E);
  ok("owed = [Tue Oct 6, Wed Oct 7, Fri Oct 9]", JSON.stringify(h.owed)==='["2026-10-06","2026-10-07","2026-10-09"]', h.owed);
  ok("Mon takes Day 2, Tue takes Day 3, Wed is single, Fri takes Presidents", h.short["2026-10-12"]==="Wk 8 · Day 1 + Wk 7 · Day 2"&&h.short["2026-10-13"]==="Wk 8 · Day 2 + Wk 7 · Day 3"&&h.short["2026-10-14"]==="Wk 8 · Day 3"&&h.short["2026-10-16"]==="Wk 8 · Presidents + Wk 7 · Presidents", h.short);
  ok("no card anywhere carries three lessons", dates.every(d=>!twoPlus(h.byDate[d])&&!twoPlus(h.short[d])));
  ok("madeUp Mon = Oct 6, Tue = Oct 7, Fri = Oct 9", h.madeUp["2026-10-12"]==="2026-10-06"&&h.madeUp["2026-10-13"]==="2026-10-07"&&h.madeUp["2026-10-16"]==="2026-10-09", h.madeUp);
  // two Presidents Fridays missed (Oct 9, Oct 16), seen from Monday Oct 26: Fri Oct 30 takes the older one; the other waits past the window
  const arch=week1Archive(["friday"]); const w2tasks=[], w2ck={}, w2h={}; ["monday","tuesday","wednesday","friday"].forEach(dn=>KIDS.forEach((k,i)=>{ const id="w2_h_"+dn+"_"+i; w2tasks.push({id,who:k,day:dn,famBlock:"ft",famItem:"h"}); if(dn!=="friday"){ w2ck[id]="1:30 PM"; w2h[id]={id,famLabel:"wk8 "+dn}; } }));
  arch.week2={weekLabel:"week2",tasks:w2tasks,checked:w2ck,history:w2h,dates:{monday:"Oct 12",tuesday:"Oct 13",wednesday:"Oct 14",thursday:"Oct 15",friday:"Oct 16"}};
  const E2=env(base({today:"2026-10-26",dayISO:{monday:"2026-10-26",tuesday:"2026-10-27",wednesday:"2026-10-28",thursday:"2026-10-29",friday:"2026-10-30"},archive:arch})); dewalt(E2,0,{Presidents:"same"}); const h2=map(E2);
  ok("two missed Fridays owed, oldest first", JSON.stringify(h2.owed)==='["2026-10-09","2026-10-16"]', h2.owed);
  ok("Fri Oct 30 = Wk 9 · Presidents + Wk 7 · Presidents (missed Oct 9) — ONE make-up; Oct 16 waits for the Friday after", /^BiblioPlan Wk 9 · Presidents — The Emergence of Japan \+ Wk 7 · Presidents \(missed Oct 9\)$/.test(h2.byDate["2026-10-30"])&&!twoPlus(h2.byDate["2026-10-30"])&&Object.values(h2.madeUp).indexOf("2026-10-16")<0, h2.byDate["2026-10-30"]);
  ok("Mon–Thu of week 3 untouched by the Presidents debt", ["2026-10-26","2026-10-27","2026-10-28","2026-10-29"].every(d=>!/\+/.test(h2.byDate[d]||"")), h2.short);
}
console.log("5. finish last week first — already how the owed queue works (oldest first, one per open day), proven here");
{ // plain 'next', no roles: a week cut short after Monday
  const E=env(base({archive:week1Archive(["tuesday","wednesday","friday"])})); dewalt(E,0,null); const h=map(E);
  ok("owed in date order", JSON.stringify(h.owed)==='["2026-10-06","2026-10-07","2026-10-09"]', h.owed);
  ok("Mon = Day 1 + Wk 7 · Day 2, Tue = Day 2 + Wk 7 · Day 3, Wed = Day 3 + Wk 7 · Presidents — last week's days first, in order", h.byDate["2026-10-12"]===W8+"Day 1"+T8+" + Wk 7 · Day 2 (missed Oct 6)"&&h.byDate["2026-10-13"]===W8+"Day 2"+T8+" + Wk 7 · Day 3 (missed Oct 7)"&&h.byDate["2026-10-14"]===W8+"Day 3"+T8+" + Wk 7 · Presidents (missed Oct 9)", h.short);
  ok("Fri Oct 16 is back to a single lesson; the queue is empty", h.byDate["2026-10-16"]===W8+"Presidents"+T8&&Object.keys(h.madeUp).length===3);
  ok("the make-ups land in the order they were missed", JSON.stringify(["2026-10-12","2026-10-13","2026-10-14"].map(d=>h.madeUp[d]))===JSON.stringify(h.owed));
  // a short week with Sara's shape: Monday after shows last week's Day 3 + this Monday's Day 1; Presidents keeps its own Friday
  const E2=env(base({archive:week1Archive(["wednesday","friday"])})); dewalt(E2,0,{Presidents:"same"}); const h2=map(E2);
  ok("Sara's short week: Mon = Wk 8 · Day 1 + Wk 7 · Day 3 (missed Oct 7); Tue single; Fri = Presidents + Presidents", h2.byDate["2026-10-12"]===W8+"Day 1"+T8+" + Wk 7 · Day 3 (missed Oct 7)"&&h2.byDate["2026-10-13"]===W8+"Day 2"+T8&&h2.short["2026-10-16"]==="Wk 8 · Presidents + Wk 7 · Presidents", h2.short);
  ok("the roles block adds no ordering code of its own (famLessonMap's queue is untouched)", !/FAMMAKEUP_ROLES/.test(src.slice(src.indexOf("function famLessonMap("),src.indexOf("function famLessonFor("))));
}
console.log("6. the helpers: roles, keys, in-order tracks");
{ const E=env(base()); const tr=E.rd().familyBlocks.ft.items[0].track, seq=E.rd().familyBlocks.ft.items[1].track;
  ok("famRoles lists the distinct roles in weekday order", JSON.stringify(E.famRoles(tr))==='["Day 1","Day 2","Day 3","Map work","Presidents"]', E.famRoles(tr));
  ok("two weekdays with one role → one row", JSON.stringify(E.famRoles({mode:"week",days:{Mon:"Reading",Tue:"Reading",Fri:"Presidents"}}))==='["Reading","Presidents"]');
  ok("famRoleKey keeps ordinary labels, swaps Firebase's forbidden characters", E.famRoleKey("Map work")==="Map work"&&E.famRoleKey(" Presidents ")==="Presidents"&&E.famRoleKey("Map/Presidents.1")==="Map_Presidents_1");
  seq.missed="next"; seq.missedFrom="2026-10-05"; seq.missedByRole={Presidents:"same"};
  ok("an in-order track ignores missedByRole (no roles, mode = the track's)", E.famRoles(seq).length===0&&E.famMissedModeFor(seq,"2026-10-09")==="next"&&E.famRoleMissed(seq,"Presidents")==="");
  ok("a bad value in missedByRole is ignored", E.famRoleMissed({mode:"week",days:{Fri:"Presidents"},missedByRole:{Presidents:"tomorrow"}},"Presidents")===""&&E.famMissedModeFor({mode:"week",days:{Fri:"Presidents"},missedByRole:{Presidents:"tomorrow"}},"2026-10-09")==="skip");
  ok("famMissedAny: skip track + all roles skip → false; skip track + one role next → true; next track → true", !E.famMissedAny({mode:"week",days:{Fri:"Presidents"},missedByRole:{Presidents:"skip"}})&&E.famMissedAny({mode:"week",days:{Fri:"Presidents"},missedByRole:{Presidents:"next"}})&&E.famMissedAny({mode:"seq",missed:"next"}));
  const Es=env(base()), Es0=env(base()); [Es,Es0].forEach(X=>{ const t=X.rd().familyBlocks.ft.items[1].track; t.missed="next"; t.missedFrom="2026-10-05"; }); Es.rd().familyBlocks.ft.items[1].track.missedByRole={Presidents:"same"}; const s=map(Es,1), s0=map(Es0,1);
  ok("Science (in order) with a stray missedByRole maps exactly as plain 'next' does (two sittings Monday)", s.short["2026-10-12"]==="Space Science L7 · 1/3 + Space Science L7 · 2/3"&&JSON.stringify([s.byDate,s.short,s.madeUp,s.owed])===JSON.stringify([s0.byDate,s0.short,s0.madeUp,s0.owed]), [s.owed,s0.owed]);
}
console.log("7. the editor — one row per role under 'If a day is missed', a leaf per role in Firebase");
{ const E=env(base()); dewalt(E,0,{Presidents:"same"}); const b=E.famDefs().ft; const ed=E.famLessonsEditorHTML("ft",b,b.items[0],0,true);
  ok("the track's own picker is still there, 'next' selected, counting from", /<select onchange="famTrackSetMissed\('ft',0,'missed',this\.value\)"/.test(ed)&&/value="next" selected/.test(ed)&&/counting from/.test(ed));
  ok("five role rows: Day 1, Day 2, Day 3, Map work, Presidents", ["Day 1","Day 2","Day 3","Map work","Presidents"].every(r=>new RegExp("famTrackSetMissedRole\\('ft',0,'"+r+"',this\\.value\\)").test(ed))&&(ed.match(/famTrackSetMissedRole\(/g)||[]).length===5);
  ok("Presidents row: 'next presidents day' selected; readings say 'next same weekday'", /Presidents:<\/span><select[^>]*><option value="">Same as above \(next day it runs\)<\/option><option value="next">Make it up the next day it runs<\/option><option value="same" selected>Make it up on the next presidents day<\/option><option value="skip">Skip it<\/option>/.test(ed)&&/Day 1:<\/span><select[^>]*><option value="" selected>Same as above \(next day it runs\)<\/option>.*?<option value="same">Make it up on the next same weekday<\/option>/.test(ed), ed.slice(ed.indexOf("Presidents:"),ed.indexOf("Presidents:")+500));
  ok("the rows sit under the picker, before the cap note", ed.indexOf("famTrackSetMissedRole")>ed.indexOf("famTrackSetMissed('ft',0,'missed'")&&ed.indexOf("famTrackSetMissedRole")<ed.indexOf("Never more than 2 lessons"));
  const edS=E.famLessonsEditorHTML("ft",b,b.items[1],1,true);
  ok("an in-order track has no role rows", !/famTrackSetMissedRole/.test(edS)&&/If a day is missed/.test(edS));
  ok("read-only view: no pickers", !/famTrackSetMissedRole/.test(E.famLessonsEditorHTML("ft",b,b.items[0],0,false)));
  // the writes
  const E2=env(base()); E2.rd().familyBlocks.ft.items[0].track.missedFrom=undefined; delete E2.rd().familyBlocks.ft.items[0].track.missedFrom;
  E2.famTrackSetMissedRole("ft",0,"Presidents","same");
  ok("one leaf written: ft/items/0/track/missedByRole/Presidents = same — plus counting-from (today) since there was none", JSON.stringify(E2.writes)===JSON.stringify([["ft/items/0/track/missedFrom","2026-10-12"],["ft/items/0/track/missedByRole/Presidents","same"]]), E2.writes);
  let tr=E2.rd().familyBlocks.ft.items[0].track;
  ok("in memory: missedByRole.Presidents = same, missedFrom = today, track.missed untouched (skip)", tr.missedByRole.Presidents==="same"&&tr.missedFrom==="2026-10-12"&&!tr.missed, tr);
  ok("it takes effect: Fri Oct 16 doubles even though the track is on skip (counting from today → Oct 9 not owed yet; move the date back)", (()=>{ E2.famTrackSetMissed("ft",0,"missedFrom","2026-10-05"); return map(E2).short["2026-10-16"]==="Wk 8 · Presidents + Wk 7 · Presidents"; })(), map(E2).short);
  E2.writes.length=0; E2.famTrackSetMissedRole("ft",0,"Map work","next");
  ok("a second role: only its own leaf (counting-from already set)", JSON.stringify(E2.writes)===JSON.stringify([["ft/items/0/track/missedByRole/Map work","next"]]), E2.writes);
  E2.writes.length=0; E2.famTrackSetMissedRole("ft",0,"Presidents","");
  ok("'Same as above' removes the leaf (null) and the key is gone; the other role stays", JSON.stringify(E2.writes)===JSON.stringify([["ft/items/0/track/missedByRole/Presidents",null]])&&!("Presidents" in E2.rd().familyBlocks.ft.items[0].track.missedByRole)&&E2.rd().familyBlocks.ft.items[0].track.missedByRole["Map work"]==="next", E2.writes);
  E2.writes.length=0; E2.famTrackSetMissedRole("ft",0,"Presidents","skip");
  ok("'skip' for a role is a real value (writes the leaf, no counting-from)", JSON.stringify(E2.writes)===JSON.stringify([["ft/items/0/track/missedByRole/Presidents","skip"]]), E2.writes);
  E2.writes.length=0; E2.famTrackSetMissedRole("ft",0,"Geography","next"); E2.famTrackSetMissedRole("ft",0,"Presidents","tomorrow"); E2.famTrackSetMissedRole("ft",1,"Presidents","same"); E2.famTrackSetMissedRole("ft",0,"","next");
  ok("a role that isn't in the week, a bad value, an in-order track, an empty role → nothing written", E2.writes.length===0, E2.writes);
  // the track's own picker set to skip keeps counting-from while a role still makes up
  const E3=env(base()); dewalt(E3,0,{Presidents:"same"}); E3.famTrackSetMissed("ft",0,"missed","skip"); tr=E3.rd().familyBlocks.ft.items[0].track;
  ok("track → skip: missed cleared, counting-from KEPT (Presidents still makes up), roles kept", !tr.missed&&tr.missedFrom==="2026-10-05"&&tr.missedByRole.Presidents==="same", tr);
  ok("…and the editor still shows counting-from and the cap note", /counting from/.test(E3.famLessonsEditorHTML("ft",E3.famDefs().ft,E3.famDefs().ft.items[0],0,true))&&/Never more than 2 lessons/.test(E3.famLessonsEditorHTML("ft",E3.famDefs().ft,E3.famDefs().ft.items[0],0,true)));
  const E4=env(base()); dewalt(E4,0,{Presidents:"skip"},"next"); E4.famTrackSetMissed("ft",0,"missed","skip"); tr=E4.rd().familyBlocks.ft.items[0].track;
  ok("track → skip with no role making up: counting-from cleared as before", !tr.missed&&!tr.missedFrom, tr);
  // Save weeks keeps the roles, trims a role that no longer exists
  const E5=env(base({dom:{"famtr-ft-0-book":"BiblioPlan","famtr-ft-0-sw":"7","famtr-ft-0-start":"2026-10-05","famtr-ft-0-total":"34","famtr-ft-0-dMon":"Day 1","famtr-ft-0-dFri":"Presidents","famtr-ft-0-topics":""}}));
  dewalt(E5,0,{Presidents:"same","Map work":"next"}); E5.famTrackSaveWeek("ft",0); tr=E5.rd().familyBlocks.ft.items[0].track;
  ok("Save weeks: missed/missedFrom ride along, Presidents kept, Map work (no longer a day) dropped", tr.missed==="next"&&tr.missedFrom==="2026-10-05"&&JSON.stringify(tr.missedByRole)==='{"Presidents":"same"}', tr);
  const E6=env(base({dom:{"famtr-ft-0-book":"BiblioPlan","famtr-ft-0-sw":"7","famtr-ft-0-start":"2026-10-05","famtr-ft-0-total":"34","famtr-ft-0-dMon":"Day 1","famtr-ft-0-dFri":"Presidents","famtr-ft-0-topics":""}}));
  dewalt(E6,0,{Presidents:"same"},null); E6.famTrackSaveWeek("ft",0); tr=E6.rd().familyBlocks.ft.items[0].track;
  ok("Save weeks with the track on skip: the role and counting-from still ride along", !tr.missed&&tr.missedFrom==="2026-10-05"&&tr.missedByRole.Presidents==="same", tr);
  const E7=env(base({dom:{"famtr-ft-0-list":"Space Science L6 ×3","famtr-ft-0-n":"1"}})); dewalt(E7,0,{Presidents:"same"}); E7.famTrackSaveSeq("ft",0); tr=E7.rd().familyBlocks.ft.items[0].track;
  ok("switching the subject to in-order drops the roles (they mean nothing there)", tr.mode==="seq"&&tr.missed==="next"&&!tr.missedByRole, tr);
}
console.log("8. the missed-card note (FAMBLOCKOUT) says what really happens to THAT day");
{ const E=env(base({dayISO:WK2})); dewalt(E,0,{Presidents:"same"});
  const fri={id:"x1",who:"andrew",day:"friday",famBlock:"ft",famItem:"h"}, tue={id:"x2",who:"andrew",day:"tuesday",famBlock:"ft",famItem:"h"};
  ok("a missed Friday: 'made up next Fri'; a missed Tuesday: 'made up the next day it runs'", E.famBoMakeupNote(fri)==="made up next Fri"&&E.famBoMakeupNote(tue)==="made up the next day it runs", [E.famBoMakeupNote(fri),E.famBoMakeupNote(tue)]);
  ok("the card row carries it", /made up next Fri/.test(E.famBoRowHTML(fri,{missed:"everyone’s out (all day)",out:"all day"})));
}
console.log("9. no missedByRole → byte-identical to before (the cases test_fam_makeup pins)");
{ const E=env(base()); dewalt(E,0,null,"same"); const h=map(E);
  ok("'same': Fri 10/16 = Wk 8 · Presidents + Wk 7 · Presidents (missed Oct 9); Mon untouched", h.byDate["2026-10-16"]===W8+"Presidents"+T8+" + Wk 7 · Presidents (missed Oct 9)"&&h.byDate["2026-10-12"]===W8+"Day 1"+T8);
  const E2=env(base()); dewalt(E2,0,null,"next"); const h2=map(E2);
  ok("'next': Mon 10/12 = Wk 8 · Day 1 + Wk 7 · Presidents (missed Oct 9); Fri single", h2.byDate["2026-10-12"]===W8+"Day 1"+T8+" + Wk 7 · Presidents (missed Oct 9)"&&h2.byDate["2026-10-16"]===W8+"Presidents"+T8);
  const E3=env(base()); const h3=map(E3);
  ok("default skip: nothing owed, nothing doubled", h3.owed.length===0&&!Object.keys(h3.madeUp).length&&h3.byDate["2026-10-16"]===W8+"Presidents"+T8);
  const tr=E2.rd().familyBlocks.ft.items[0].track;
  ok("famMissedModeFor = famMissedMode on every date when there is no missedByRole", dates.every(d=>E2.famMissedModeFor(tr,d)===E2.famMissedMode(tr))&&E.famMissedAny(E.rd().familyBlocks.ft.items[0].track)&&!E3.famMissedAny(E3.rd().familyBlocks.ft.items[0].track));
  ok("an empty missedByRole {} changes nothing either", (()=>{ const E4=env(base()); dewalt(E4,0,{},"next"); const h4=map(E4); return JSON.stringify([h4.byDate,h4.short,h4.madeUp,h4.owed])===JSON.stringify([h2.byDate,h2.short,h2.madeUp,h2.owed]); })());
  ok("the editor for a track with no roles set offers every row on 'Same as above'", (E3.famLessonsEditorHTML("ft",E3.famDefs().ft,E3.famDefs().ft.items[0],0,true).match(/<option value="" selected>Same as above \(skip it\)<\/option>/g)||[]).length===5);
}
console.log("10. wiring (source)");
{ const i0=src.indexOf("// FAMMAKEUP_END"), i1=src.indexOf("// FAMMAKEUP_ROLES_START"), i2=src.indexOf("// FAMMAKEUP_ROLES_END"), i3=src.indexOf("// FAMLESSONS_END");
  ok("the block sits right after FAMMAKEUP_END, inside FAMLESSONS", i0>0&&i1>i0&&i1-i0<40&&i2>i1&&i3>i2&&src.indexOf("// FAMMAKEUP_ROLES_START",i1+1)<0);
  const MU=sl("// FAMMAKEUP_START","// FAMMAKEUP_END");
  ok("famOwedList asks famMissedAny and the missed day's own mode; famMakeupLands asks the missed day's mode", /if\(!tr\|\|!famMissedAny\(tr\)\) return \[\];/.test(MU)&&/hasLesson\(d\)&&famMissedModeFor\(tr,d\)!=="skip"&&!made\[d\]/.test(MU)&&/famMakeupLands\(tr,missed,d\)\{ return d>missed&&\(famMissedModeFor\(tr,missed\)==="same"\?/.test(MU));
  ok("famKeepMissed hands the roles along; the track's 'skip' keeps counting-from while a role makes up", /return famKeepMissedRoles\(oldTr,newTr\); \}/.test(FL)&&/if\(val==="skip"\)\{ delete tr\.missed; if\(!famMissedAny\(tr\)\) delete tr\.missedFrom; \}/.test(FL));
  ok("every write is targeted through famWrite (config/rules/familyBlocks/…): no db.ref for missedByRole", /famWrite\(id\+"\/items\/"\+i\+"\/track\/missedByRole\/"\+k,val\|\|null\)/.test(FL)&&!/db\.ref\([^)]*missedByRole/.test(src));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
