/*
 * 🚫 FAMBLOCKOUT — a blockout during family time (her two holes 2026-10-22, session C of the 10/22 pack).
 *   · a timed / full-day blockout over a kid during the block → that kid's copy is OUT ("Out — <blockout>"), not checkable,
 *     not counted toward the kid's day-done; the other copies are untouched
 *   · everyone covered, or Mom's own blockout on a Mom-led block → the block is MISSED ("Missed — <why>") and the date is
 *     owed to the make-up the same day; nothing moves to another slot or day
 *   · a NEW lesson track defaults "If a day is missed" to "next day" for every family but Howe's; existing tracks untouched
 *   · the editor says the setting in plain words; with no blockouts everything is byte-identical to base
 * Real FAMBLOCK + FAMTOGETHER + FAMBLOCKOUT + FAMLESSONS code on stubs (the env() of test_fam_makeup), the real
 * rtSchoolworkDone, and the real runDisplacement replayed in a sandbox.
 *   run: node test_fam_blockout.js
 */
const fs=require("fs"),path=require("path"),vm=require("vm"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const sl=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice "+a); return src.slice(i,j); };
const FAM=sl("// FAMBLOCK_START","// FAMBLOCK_END"), TG=sl("// FAMTOGETHER_START","// FAMTOGETHER_END"), BO=sl("// FAMBLOCKOUT_START","// FAMBLOCKOUT_END"), FL=sl("// FAMLESSONS_START","// FAMLESSONS_END");
const grab=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("fn "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const toMin=t=>{ const m=String(t||"").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return 0; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+(+m[2]); };
const fromMin=v=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
// withBo=false → the environment exactly as test_fam_makeup builds it (no FAMBLOCKOUT code at all) — the "base" to compare against
function env(E,withBo){
  return new Function("toMin","fromMin","E",`
    var rulesData=E.rulesData, currData=E.currData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, histState=E.hist||{}, WK="week2", db=null, archive=E.archive||{};
    var blockouts=E.blockouts||{}, window=E.window, SITTER_NAME="Maggie", _todayDay=E.todayDay||"monday";
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
    ${withBo?BO:""}
    ${FL}
    if(E.prog) famProgress=E.prog;
    const X={famLessonMap,famLessonFor,famCheckPre,famDoneN,famTrackStart,famTrackSaveSeq,famTrackSaveWeek,famMissedMode,famOwedList,famRowHTML,famSiblings,famGroup,famLessonsEditorHTML,famGridHTML,famDefs,famItems,rd:()=>rulesData,checked,weekData,setBo:b=>{ blockouts=b; }};
    if(typeof famBoState==="function") Object.assign(X,{famBoState,famBoMissedAt,famBoMarkMissed,famBoSig,famBoName,famBoMark,famBoTrackDefault,famBoMissedWords,famBoRowHTML});
    return X;
  `)(toMin,fromMin,E);
}
const SD={defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"};
const dates=["2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"];
const lessons={andrew:{}}; dates.forEach((d,i)=>lessons.andrew[i+1]={date:d,week:"Wk "+(i<5?1:i<10?2:3)});
const KIDS=["taylor","makenzie","andrew","caleb"];
const coop={}; KIDS.forEach(k=>{ coop[k+"|2026-10-08"]=900; coop[k+"|2026-10-15"]=900; });
const HIST=()=>({key:"h",name:"History",minutes:30,pts:20,track:{mode:"week",book:"BiblioPlan",startDate:"2026-10-05",startWeek:7,total:34,
  days:{Mon:"Day 1",Tue:"Day 2",Wed:"Day 3",Thu:"Map work",Fri:"Presidents"},topics:{7:"France versus Germany; Lady Liberty",8:"The Transcontinental Railroad; Moving Out West",9:"The Emergence of Japan"}}});
const SCI=()=>({key:"s",name:"Science",minutes:30,pts:20,track:{mode:"seq",list:[{t:"Space Science L6 — Terrestrial Planets",n:3},{t:"Space Science L7 — The Phases of the Moon",n:3},{t:"Space Science L8 — The Tides and Gravity",n:3}]}});
const FT=(o)=>Object.assign({name:"Family Time",kids:KIDS,days:["Mon","Tue","Wed","Thu","Fri"],at:"lunch",items:[HIST(),SCI(),{key:"r",name:"Read Aloud",minutes:20}]},o||{});
const WK2={monday:"2026-10-12",tuesday:"2026-10-13",wednesday:"2026-10-14",thursday:"2026-10-15",friday:"2026-10-16"};
// This week's laid cards: History 1:00, Science 1:30, Read Aloud 2:00 — one copy per kid per day (Thu = co-op, no cards)
function weekCards(){ const out=[]; ["monday","tuesday","wednesday","friday"].forEach(dn=>{ [["h","1:00 PM",30],["s","1:30 PM",30],["r","2:00 PM",20]].forEach(([k,tm,dur])=>{ KIDS.forEach(kid=>out.push({id:"w2_"+k+"_"+dn+"_"+kid,who:kid,day:dn,time:tm,dur,famBlock:"ft",famItem:k,title:"🏡 "+k})); }); }); return out; }
const card=(E,k,dn,kid)=>E.weekData.tasks.find(t=>t.id==="w2_"+k+"_"+dn+"_"+kid);
const base=extra=>Object.assign({rulesData:{schoolDay:SD,familyBlocks:{ft:FT()}},currData:{subjects:{},lessons},coop,today:"2026-10-12",todayDay:"monday",dayISO:WK2,archive:{},prog:{ft:{s:{done:3}}},tasks:weekCards()},extra||{});
const setMissed=(E,i,mode,from)=>{ const its=E.rd().familyBlocks.ft.items; its[i].track.missed=mode; its[i].track.missedFrom=from===undefined?"2026-10-12":from; };
const map=(E,i)=>{ const b=E.famDefs().ft; return E.famLessonMap(b,"ft",b.items[i]); };
const TIMED=(kids,s,e,day)=>({day:day||"monday",type:"timed",kids,start:s,end:e,created:1});
const FULL=(kids,day)=>({day:day||"monday",type:"fullDay",kids,created:1});

console.log("1. a timed blockout on ONE kid: his copies in the window are out, everyone else's are normal");
{ const E=env(base({blockouts:{b1:TIMED(["andrew"],"1:00 PM","2:00 PM")}}),true);
  const aH=card(E,"h","monday","andrew"), aS=card(E,"s","monday","andrew"), aR=card(E,"r","monday","andrew"), mH=card(E,"h","monday","makenzie");
  ok("Andrew's History (1:00–1:30) is out — named by the blockout's window", JSON.stringify(E.famBoState(aH))===JSON.stringify({out:"1:00 PM–2:00 PM"}), E.famBoState(aH));
  ok("Andrew's Science (1:30–2:00) is out too", !!E.famBoState(aS)&&!E.famBoState(aS).missed);
  ok("Andrew's Read Aloud (2:00–2:20) is NOT — the blockout ended", E.famBoState(aR)===null, E.famBoState(aR));
  ok("Makenzie's History is untouched; Tuesday's cards are untouched", E.famBoState(mH)===null&&E.famBoState(card(E,"h","tuesday","andrew"))===null);
  ok("not missed: the block still runs for the others", !E.famBoState(aH).missed&&!E.famBoMissedAt("ft","h","2026-10-12"));
  const rowA=E.famRowHTML(aH,false,"andrew"), rowM=E.famRowHTML(mH,false,"makenzie");
  ok("Andrew's card reads 'Out — 1:00 PM–2:00 PM' (still shows the lesson)", /Out — 1:00 PM–2:00 PM/.test(rowA)&&/Wk 8 · Day 1/.test(rowA)&&!/Mom checks this off/.test(rowA), rowA);
  ok("Makenzie's card is the normal one", /Mom checks this off for everyone/.test(rowM)&&!/Out —/.test(rowM));
  ok("Mom's one check skips Andrew: his copy is not among Makenzie's siblings", E.famSiblings(mH).map(t=>t.who).sort().join()==="caleb,taylor");
  ok("the dialog's 'everyone' (famGroup) names the three who are there", E.famGroup(mH).map(t=>t.who).sort().join()==="caleb,makenzie,taylor");
  ok("a blockout from 1:45 takes Science but not History", (()=>{ const E2=env(base({blockouts:{b1:TIMED(["andrew"],"1:45 PM","3:00 PM")}}),true); return E2.famBoState(card(E2,"h","monday","andrew"))===null&&!!E2.famBoState(card(E2,"s","monday","andrew")); })());
  ok("a checked copy is never out (it happened)", (()=>{ const E2=env(base({blockouts:{b1:TIMED(["andrew"],"1:00 PM","2:00 PM")},checked:{w2_h_monday_andrew:"1:20 PM"}}),true); return E2.famBoState(card(E2,"h","monday","andrew"))===null; })());
  ok("nothing moved: every card keeps its day and time", E.weekData.tasks.every(t=>t.day==="monday"?/PM$/.test(t.time):true)&&card(E,"h","monday","andrew").time==="1:00 PM");
}
console.log("2. a full-day blockout on everyone: the block is MISSED, and the date is owed the same day");
{ const E=env(base({blockouts:{b1:FULL(KIDS)}}),true);
  const st=E.famBoState(card(E,"h","monday","taylor"));
  ok("every copy: missed — everyone's out (all day)", KIDS.every(k=>{ const s=E.famBoState(card(E,"h","monday",k)); return s&&s.missed==="everyone’s out (all day)"; }), st);
  ok("famBoMissedAt knows the date; Tuesday is clean", E.famBoMissedAt("ft","h","2026-10-12")==="everyone’s out (all day)"&&E.famBoMissedAt("ft","h","2026-10-13")==="");
  ok("the card reads 'Missed — everyone’s out (all day) · not made up (skip)' while the setting is skip", /Missed — everyone’s out \(all day\)/.test(E.famRowHTML(card(E,"h","monday","taylor"),false,"taylor"))&&/not made up \(skip\)/.test(E.famRowHTML(card(E,"h","monday","taylor"),false,"taylor")));
  ok("skip (default): nothing owed, nothing doubled — today's behaviour", map(E,0).owed.length===0&&map(E,1).owed.length===0&&!/\+/.test(map(E,0).byDate["2026-10-13"]));
  setMissed(E,0,"next"); setMissed(E,1,"next"); const h=map(E,0), s=map(E,1);
  ok("History 'next': Mon 10/12 is owed TODAY (not tomorrow)", JSON.stringify(h.owed)===JSON.stringify(["2026-10-12"]), h.owed);
  ok("it lands on the next run day: Tue = Wk 8 · Day 2 + Wk 8 · Day 1 (missed Oct 12)", h.byDate["2026-10-13"]==="BiblioPlan Wk 8 · Day 2 — The Transcontinental Railroad; Moving Out West + Wk 8 · Day 1 (missed Oct 12)"&&h.madeUp["2026-10-13"]==="2026-10-12", h.byDate["2026-10-13"]);
  ok("today's own card is NOT doubled onto itself", h.byDate["2026-10-12"]==="BiblioPlan Wk 8 · Day 1 — The Transcontinental Railroad; Moving Out West"&&!h.madeUp["2026-10-12"], h.byDate["2026-10-12"]);
  ok("Science 'next': Monday takes no sitting; Tue = L7 day 1 + day 2, madeUp Tue = Oct 12", !s.byDate["2026-10-12"]&&s.short["2026-10-13"]==="Space Science L7 · 1/3 + Space Science L7 · 2/3"&&s.madeUp["2026-10-13"]==="2026-10-12", [s.byDate["2026-10-12"],s.short["2026-10-13"]]);
  ok("the missed card still says what it would have been (next sitting)", E.famLessonFor(card(E,"s","monday","taylor"))==="Space Science L7 — The Phases of the Moon · day 1 of 3");
  ok("the card now says '· made up the next day it runs'", /made up the next day it runs/.test(E.famRowHTML(card(E,"h","monday","taylor"),false,"taylor")));
  ok("'same weekday': the missed Monday waits for Mon 10/26 (break week between)", (()=>{ setMissed(E,0,"same"); const h2=map(E,0); return h2.madeUp["2026-10-26"]==="2026-10-12"&&!h2.madeUp["2026-10-13"]; })());
  ok("the Family Grid carries the doubled lesson", /Wk 8 · Day 2 \+ Wk 8 · Day 1/.test((setMissed(E,0,"next"),E.famGridHTML())));
  // the day after: the blockout is still this week's, the date is past — same answer
  const E2=env(base({blockouts:{b1:FULL(KIDS)},today:"2026-10-13",todayDay:"tuesday"}),true); setMissed(E2,0,"next");
  ok("on Tuesday the owed day still lands on Tuesday", map(E2,0).madeUp["2026-10-13"]==="2026-10-12");
  // one kid checked → it happened for the group
  const E3=env(base({blockouts:{b1:FULL(KIDS)},checked:{w2_h_monday_taylor:"1:20 PM"}}),true);
  ok("a checked copy means it happened: the others read out, not missed", E3.famBoState(card(E3,"h","monday","andrew")).missed===undefined&&E3.famBoMissedAt("ft","h","2026-10-12")==="");
  // three of four covered → out, not missed
  const E4=env(base({blockouts:{b1:FULL(["taylor","makenzie","andrew"])}}),true);
  ok("three of four out → three 'Out', Caleb normal, not missed", !E4.famBoState(card(E4,"h","monday","andrew")).missed&&E4.famBoState(card(E4,"h","monday","caleb"))===null&&!E4.famBoMissedAt("ft","h","2026-10-12"));
  // a future day's blockout, entered today
  const E5=env(base({blockouts:{b1:FULL(KIDS,"tuesday")}}),true); setMissed(E5,0,"next"); const h5=map(E5,0);
  ok("a blockout on TOMORROW: Tuesday is missed now, its lesson lands on Wednesday, today untouched", h5.madeUp["2026-10-14"]==="2026-10-13"&&!h5.madeUp["2026-10-13"]&&!/\+/.test(h5.byDate["2026-10-12"]), h5.madeUp);
}
console.log("3. Mom's own blockout: a Mom-led block is missed; a kids-only block runs");
{ const sit={day:"monday",type:"babysitter",kids:KIDS,start:"12:00 PM",end:"3:00 PM",momReturn:"3:00 PM",created:1};
  const E=env(base({blockouts:{b1:sit}}),true); const st=E.famBoState(card(E,"h","monday","andrew"));
  ok("sitter hours over a Mom-led block → Missed — Mom’s out (Maggie hours — Mom back 3:00 PM)", st&&st.mom&&st.missed==="Mom’s out (Maggie hours — Mom back 3:00 PM)", st);
  ok("every copy says so; the date is owed", KIDS.every(k=>E.famBoState(card(E,"h","monday",k)).missed)&&/Mom’s out/.test(E.famBoMissedAt("ft","h","2026-10-12")));
  ok("Mom back at 1:30 → History (1:00) missed, Science (1:30) not", (()=>{ const E2=env(base({blockouts:{b1:Object.assign({},sit,{momReturn:"1:30 PM"})}}),true); return !!E2.famBoState(card(E2,"h","monday","andrew"))&&E2.famBoState(card(E2,"s","monday","andrew"))===null; })());
  const K=env(base({rulesData:{schoolDay:SD,familyBlocks:{ft:FT({momLeads:false})}},blockouts:{b1:sit}}),true);
  ok("kids-only block (momLeads:false): nothing — the sitter keeps the kids home", KIDS.every(k=>K.famBoState(card(K,"h","monday",k))===null)&&K.famBoMissedAt("ft","h","2026-10-12")==="");
  const M=env(base({blockouts:{b1:TIMED(["mom"],"1:00 PM","2:00 PM")}}),true);
  ok("a blockout naming 'mom' (session B's shape) over a Mom-led block → missed", /Mom’s out \(1:00 PM–2:00 PM\)/.test((M.famBoState(card(M,"h","monday","taylor"))||{}).missed||""));
  const M2=env(base({rulesData:{schoolDay:SD,familyBlocks:{ft:FT({momLeads:false})}},blockouts:{b1:TIMED(["mom"],"1:00 PM","2:00 PM")}}),true);
  ok("…and nothing on a kids-only block", M2.famBoState(card(M2,"h","monday","taylor"))===null);
}
console.log("4. a NEW track's default per family; existing tracks untouched");
{ const fresh=()=>({rulesData:{schoolDay:SD,familyBlocks:{ft:FT({items:[{key:"n",name:"Nature",minutes:20}]})}}});
  const D=env(base(Object.assign(fresh(),{window:{HA_FAMILY:{familyId:"dewalt"}}})),true); D.famTrackStart("ft",0,"seq"); let tr=D.rd().familyBlocks.ft.items[0].track;
  ok("DeWalt, new in-order track: missed = next, counting from today", tr.mode==="seq"&&tr.missed==="next"&&tr.missedFrom==="2026-10-12", tr);
  const D2=env(base(Object.assign(fresh(),{window:{HA_FAMILY:{familyId:"dewalt"}}})),true); D2.famTrackStart("ft",0,"week"); tr=D2.rd().familyBlocks.ft.items[0].track;
  ok("DeWalt, new week-by-week track: missed = next too", tr.mode==="week"&&tr.missed==="next"&&tr.missedFrom==="2026-10-12", tr);
  const H=env(base(Object.assign(fresh(),{window:{HA_FAMILY:{familyId:"howe"}}})),true); H.famTrackStart("ft",0,"seq"); tr=H.rd().familyBlocks.ft.items[0].track;
  ok("Howe: no missed field (skip)", tr.mode==="seq"&&!tr.missed&&!tr.missedFrom, tr);
  const N=env(base(fresh()),true); N.famTrackStart("ft",0,"seq"); tr=N.rd().familyBlocks.ft.items[0].track;
  ok("no HA_FAMILY at all (Howe's own site) → skip", !tr.missed, tr);
  ok("famMissedMode reads the default as 'next'", D.famMissedMode(D.rd().familyBlocks.ft.items[0].track)==="next");
  // existing tracks: DeWalt's two live ones have no missed field — nothing here touches them
  const X=env(base({window:{HA_FAMILY:{familyId:"dewalt"}},dom:{"famtr-ft-0-book":"BiblioPlan","famtr-ft-0-sw":"7","famtr-ft-0-start":"2026-10-05","famtr-ft-0-total":"34","famtr-ft-0-dMon":"Day 1","famtr-ft-0-topics":"","famtr-ft-1-list":"Space Science L6 ×3","famtr-ft-1-n":"1"}}),true);
  const before=JSON.stringify(X.rd().familyBlocks.ft.items.slice(0,2).map(i=>i.track.missed));
  ok("existing tracks start without the field", before==="[null,null]", before);
  X.famTrackSaveWeek("ft",0); X.famTrackSaveSeq("ft",1); map(X,0); map(X,1);
  ok("re-saving the lessons / drawing the map on DeWalt's site leaves them untouched (still skip)", JSON.stringify(X.rd().familyBlocks.ft.items.slice(0,2).map(i=>i.track.missed))==="[null,null]"&&X.famMissedMode(X.rd().familyBlocks.ft.items[0].track)==="skip");
  ok("famBoTrackDefault never overrides a set value", X.famBoTrackDefault({mode:"week",missed:"same",missedFrom:"2026-10-01"}).missed==="same");
}
console.log("5. the editor says the setting in plain words");
{ const E=env(base(),true); const b=()=>E.famDefs().ft;
  const ro=i=>E.famLessonsEditorHTML("ft",b(),b().items[i],i,false), ed=i=>E.famLessonsEditorHTML("ft",b(),b().items[i],i,true);
  ok("read-only: 'If a day is missed: skip'", /If a day is missed: skip/.test(ro(0))&&/If a day is missed: skip/.test(ro(1)));
  setMissed(E,0,"same"); setMissed(E,1,"next");
  ok("'same weekday' / 'next day' — in the read-only view and above the editor's own control", /If a day is missed: same weekday/.test(ro(0))&&/If a day is missed: next day/.test(ro(1))&&/If a day is missed: same weekday/.test(ed(0))&&/<select onchange="famTrackSetMissed/.test(ed(0)));
  ok("the words are the FAMBLOCKOUT helper's", E.famBoMissedWords({mode:"seq",missed:"next"})==="If a day is missed: next day"&&E.famBoMissedWords({mode:"seq",missed:"same"})==="If a day is missed: skip");
}
console.log("6. session B's hook: a date marked missed by hand is owed the same way, and the map notices");
{ const E=env(base(),true); setMissed(E,0,"next"); const h0=map(E,0);
  ok("nothing marked: nothing owed", h0.owed.length===0);
  E.famBoMarkMissed("ft","h","2026-10-13","Mom’s off today");
  const st=E.famBoState(card(E,"h","tuesday","andrew")), h1=map(E,0);
  ok("Tuesday's copies read Missed — Mom’s off today", st&&st.marked&&st.missed==="Mom’s off today"&&/Missed — Mom’s off today/.test(E.famRowHTML(card(E,"h","tuesday","andrew"),false,"andrew")), st);
  ok("the map was rebuilt (memo reset): Tue owed, lands Wed", JSON.stringify(h1.owed)===JSON.stringify(["2026-10-13"])&&h1.madeUp["2026-10-14"]==="2026-10-13", [h1.owed,h1.madeUp]);
  E.famBoMarkMissed("ft","h","2026-10-13","");
  ok("cleared: back to nothing", map(E,0).owed.length===0&&E.famBoState(card(E,"h","tuesday","andrew"))===null);
  ok("a blockout added later also rebuilds the map (the signature changed)", (()=>{ const a=map(E,0); E.setBo({b1:FULL(KIDS)}); const b=map(E,0); return a!==b&&b.madeUp["2026-10-13"]==="2026-10-12"; })());
}
console.log("7. day-done (the real rtSchoolworkDone): an out copy doesn't hold the kid's day open");
{ const E=env(base({blockouts:{b1:TIMED(["andrew"],"1:00 PM","2:00 PM")},checked:{}}),true);
  const RT=new Function("E","famBoState","famCelebOf","famDefs","checked","claimed","getActiveTasks","_todayDay","effectiveDay","_rtSwTodayLay",grab("rtSchoolworkDone")+"; return rtSchoolworkDone;");
  const own={id:"own_andrew",who:"andrew",day:"monday",time:"10:00 AM",dur:30,title:"Math"};
  const tasks=E.weekData.tasks.filter(t=>t.day==="monday").concat([own,Object.assign({},own,{id:"own_mak",who:"makenzie"})]);
  const chk={own_andrew:"10:30 AM",own_mak:"10:30 AM"}; KIDS.forEach(k=>{ chk["w2_r_monday_"+k]="2:20 PM"; });   // Read Aloud done for all
  const rt=RT(E,E.famBoState,()=>"",()=>({}),chk,{},()=>tasks,"monday",t=>t.day,()=>null);
  ok("Andrew: own work done, Read Aloud done, History + Science OUT → his day is done", rt("andrew","monday")===true);
  ok("Makenzie: her History + Science are still open → not done", rt("makenzie","monday")===false);
  chk.w2_h_monday_makenzie="1:30 PM"; chk.w2_s_monday_makenzie="2:00 PM";
  ok("…until Mom checks them", rt("makenzie","monday")===true);
  const rt0=RT(E,E.famBoState,()=>"",()=>({}),{own_andrew:"10:30 AM"},{},()=>tasks,"monday",t=>t.day,()=>null);
  ok("Andrew's Read Aloud (not out) still holds his day", rt0("andrew","monday")===false);
}
console.log("8. the real runDisplacement, replayed: the copy is stamped _famOut, nothing family moves, the rest is as before");
{ const NOW=grab("runDisplacement"), HOOK='if(t.famBlock){ if(typeof famBoMark==="function") famBoMark(t,bo); return; }';
  ok("the hook is the one family line in runDisplacement", NOW.indexOf(HOOK)>0&&NOW.split("famBoMark").length===3);
  const BASE=NOW.replace(HOOK,"if(t.famBlock) return;");
  const E=env(base(),true);
  const mon=weekCards().filter(t=>t.day==="monday").concat([{id:"own_a",who:"andrew",day:"monday",time:"10:00 AM",dur:30,title:"Math",mom:"none"},{id:"own_t",who:"taylor",day:"tuesday",time:"10:00 AM",dur:30,title:"Math",mom:"none"}]);
  const strip=r=>r&&{tasks:r.tasks.map(t=>{ const o=Object.assign({},t); delete o._famOut; return o; }),carryOver:r.carryOver};
  // the function on a Proxy global: every name it reaches for is a stub here, and an unknown one fails loudly
  const disp=(fn,bos,mark)=>{
    const stubs={toMin,fromMin,blockouts:bos,weekData:{tasks:JSON.parse(JSON.stringify(mon))},rulesData:{schoolDay:SD,workflow:{}},currData:{subjects:{}},checked:{},claimed:{},momMoves:{},coManualSat:{},displacedResult:null,_todayDay:"monday",_dispNowMin:9*60,
      DAY_DT:{monday:"Oct 12",tuesday:"Oct 13",wednesday:"Oct 14",thursday:"Oct 15",friday:"Oct 16"},DAY_LBL:{},console,JSON,Math,Object,Array,String,Set,Date,Number,parseInt,parseFloat,isNaN,isFinite,RegExp,Boolean,Infinity,NaN,undefined,
      wfWithDefaults:w=>w||{},capForDisplay:()=>999,taskTier:()=>"independent",taskSubject:t=>t.title||"",wfMatch:()=>false,coopApplyStart:()=>{},calDateForWeekDay:()=>null,packAround:()=>{},smapIsKidOff:()=>false,momClosingSlot:()=>null,satApplyCutoff:()=>{},buildSubjectLessons:()=>[],auditSchedule:()=>({}),dbg:()=>{},safeWriteTasks:()=>{},sv:()=>{},subjNoCarry:t=>!!t.famBlock,WK:"week2",lastAudit:null,gwRules:()=>({}),famBoMark:mark};
    const sb=new Proxy(stubs,{has:()=>true,get:(t,k)=>(k in t)?t[k]:(typeof k==="symbol"?undefined:(()=>{ throw new Error("runDisplacement needs "+String(k)); })()),set:(t,k,v)=>{ t[k]=v; return true; }});
    vm.createContext(sb); vm.runInContext(fn+"\nrunDisplacement();",sb); return stubs.displacedResult; };
  let withHook=null, withoutHook=null, none=null;
  try{ none=disp(NOW,{},E.famBoMark); withHook=disp(NOW,{b1:FULL(["andrew"])},E.famBoMark); withoutHook=disp(BASE,{b1:FULL(["andrew"])},null); }
  catch(e){ ok("runDisplacement replays in the sandbox",false,String(e.message)); }
  ok("no blockouts: null, exactly as base (both bail before the hook)", none===null&&disp(BASE,{},null)===null);
  if(withHook&&withoutHook){
    const fam=withHook.tasks.filter(t=>t.famBlock&&t.who==="andrew"&&t.day==="monday");
    ok("a full-day blockout on Andrew: his three family copies are stamped _famOut = 'all day'", fam.length===3&&fam.every(t=>t._famOut==="all day"), fam.map(t=>t._famOut));
    ok("…and kept their day and time (never displaced)", fam.every(t=>t.day==="monday"&&!t._displaced)&&fam.map(t=>t.time).join()==="1:00 PM,1:30 PM,2:00 PM");
    ok("nobody else's copy is stamped", withHook.tasks.filter(t=>t.famBlock&&t._famOut).length===3);
    ok("Andrew's own Math left Monday, as before", (withHook.tasks.concat(withHook.carryOver)).some(t=>t.id==="own_a"&&(t._displaced||t.day!=="monday")));
    ok("apart from the stamp, the result is byte-identical to base", JSON.stringify(strip(withHook))===JSON.stringify(strip(withoutHook)));
    ok("a 1–2 PM blockout that touches only family time displaces nothing (null) — the card reads out through famBoState (check 1)", disp(NOW,{b1:TIMED(["andrew"],"1:00 PM","2:00 PM")},E.famBoMark)===null);
  }
}
console.log("9. source: the hooks sit where they must");
{ ok("FAMBLOCKOUT block sits between FAMTOGETHER_END and FAMLESSONS_START", src.indexOf("// FAMTOGETHER_END")<src.indexOf("// FAMBLOCKOUT_START")&&src.indexOf("// FAMBLOCKOUT_END")<src.indexOf("// FAMLESSONS_START"));
  const tap=src.slice(src.indexOf("function tapTask(id){"),src.indexOf("function tapTask(id){")+2500);
  ok("tapTask: an out / missed copy only says so, before the kid's and Mom's family paths", tap.indexOf("famBoState(t)")>0&&tap.indexOf("famBoState(t)")<tap.indexOf("if(t.famBlock&&!momHereCards()){")&&/return; \}   \/\/ 🚫 FAMBLOCKOUT: not checkable/.test(tap));
  ok("famSiblings skips an out copy (Mom's one check, the ratings, the dialog's names)", /x\.day===t\.day&&!\(typeof famBoState==="function"&&famBoState\(x\)\); \}\);   \/\/ 🚫 FAMBLOCKOUT/.test(FAM));
  ok("rtSchoolworkDone leaves an open out copy out of the count", /&&!\(t\.famBlock&&typeof famBoState==="function"&&famBoState\(t\)\)&&!\(\(t\._offDay\|\|t\._dayDrop\)&&!checked\[t\.id\]\)/.test(grab("rtSchoolworkDone")));
  ok("the block celebration doesn't wait on an out copy", /_famCelebCards[\s\S]{0,300}famBoState\(t\)\)/.test(src.slice(src.indexOf("function _famCelebCards"),src.indexOf("function _famCelebCards")+400)));
  ok("the carry guard is unchanged (family time was already day-bound)", /if\(t\.famBlock\) return true;   \/\/ 👨‍👩‍👧 family time happens at its time or not at all/.test(src));
  ok("no Firebase write anywhere in the block (display + defaults only)", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(BO));
  ok("the block never moves a card: no .day= / .time= assignment", !/\.(day|time)\s*=[^=]/.test(BO));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0);
}
console.log("10. with no blockouts, the cards and the lesson maps are byte-identical to the environment without FAMBLOCKOUT");
{ const A=env(base(),true), B=env(base(),false);
  const sA=JSON.stringify([map(A,0),map(A,1)]), sB=JSON.stringify([map(B,0),map(B,1)]);
  ok("lesson maps identical (History + Science)", sA===sB);
  const rows=E=>E.weekData.tasks.map(t=>E.famRowHTML(t,false,t.who)).join("\n");
  ok("every card row identical", rows(A)===rows(B));
  ok("famSiblings identical", JSON.stringify(A.famSiblings(card(A,"h","monday","andrew")).map(t=>t.id))===JSON.stringify(B.famSiblings(card(B,"h","monday","andrew")).map(t=>t.id)));
  ok("famBoState null for every card, famBoMissedAt '' for every date", A.weekData.tasks.every(t=>A.famBoState(t)===null)&&dates.every(d=>A.famBoMissedAt("ft","h",d)===""));
  const eA=A.famLessonsEditorHTML("ft",A.famDefs().ft,A.famDefs().ft.items[0],0,true), eB=B.famLessonsEditorHTML("ft",B.famDefs().ft,B.famDefs().ft.items[0],0,true);
  ok("the editor differs only by the plain-words line", eA!==eB&&eA.replace(/ · <span style="font-weight:600;color:var\(--muted\)">If a day is missed: skip<\/span>/,"")===eB);
}
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
