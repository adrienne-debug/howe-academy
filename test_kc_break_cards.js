/*
 * 🏖 KC_BREAK — Kids' Corner shows no school cards on a break day (her report 2026-11-24: "the kids schedule still shows
 * schoolwork that has been checked off, but there's no schoolwork today because they're on break. So if they're on break,
 * there shouldn't be anything there." — then "Yes, fix it").
 *
 * The live case: a calendar holiday (pause "school") covers the whole week. No week is built for a full break week, so the
 * active week is still LAST week's, and _kcTodayCards picked its cards by day name only — on the Tuesday of the break it
 * listed last week's Tuesday cards (all checked), and the ⭐ card said "📖 School N of N cards — done!".
 * The fix: on a day scheduleBreakToday() returns a break (the Schedule tab's own rule — holiday, vacation or cleaning day),
 * _kcTodayCards returns none, so the list, the 📖 School line and the 🙋 picker all follow; the empty line names the break.
 *
 * What is proved here (the WHOLE app runs in the vm sandbox of test_demo_week.js, on the synthetic demo family):
 *   1. The bug, on the code with KC_BREAK stripped (= origin/main before this change): break Tuesday → last week's Tuesday
 *      cards, all checked, "📖 School N of N"; break Thursday → last week's unfinished Thursday cards counted ("N of M").
 *   2. With KC_BREAK: no cards, the break line, no "📖 School" line, the 🙋 picker empty, no lock, no Brain Break — on break
 *      Tuesday and on break Thursday.
 *   3. Each break type (full-week holiday, one-day holiday, vacation "all", cleaning day); the day before a break starts and the
 *      day after it ends draw exactly what the stripped code draws.
 *   4. A one-day holiday added after this week was built (cards laid on that day name): no cards that day, the other days
 *      untouched.
 *   5. No break: _kcTodayCards, kcSchoolHTML, kcPointsHTML and hrKidCards byte-identical to the stripped code over 300
 *      random weeks (two kids, mixed checked / unchecked, Mom here and not).
 *   6. On a break day, Kids' Corner ▸ Today (Together, ⭐ card, lists, Brain Break, lock, "Also today") equals what the
 *      stripped code draws for a day with no school cards — only the empty-state line differs. HTML balanced, ids unique.
 *   7. Nothing is written: rendering on a break day makes no database write.
 * No kid or family names: the fixture is synthetic.   run: node test_kc_break_cards.js
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path"), os=require("os");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const SRC=fs.readFileSync(INDEX,"utf8");

let pass=0, fail=0;
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,700)+")":"")); } }
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };

// ── the change, and the same file with the change stripped (= the code before it) ──
const CUT1="    if(typeof scheduleBreakToday===\"function\"&&scheduleBreakToday()) return [];   // \u{1F3D6} KC_BREAK";
const NEW2a="      let _brk=null; try{ _brk=(typeof scheduleBreakToday===\"function\")?scheduleBreakToday():null; }catch(e){}   // \u{1F3D6} KC_BREAK: a break day names the break\n";
const NEW2b="'+(_brk?(_brk.type===\"cleaning\"?'No school today \\u2014 it\\u2019s cleaning day \\u{1F9FD}':'No school today \\u2014 '+esc(_brk.name)+' \\u{1F389}'):'No school cards today \\u{1F389}')+'";
const OLD2b="No school cards today \\u{1F389}";
const count=(s,x)=>s.split(x).length-1;
function strip(src){
  const a=src.indexOf(CUT1); const b=src.indexOf("\n",a);
  let out=src.slice(0,a)+src.slice(b+1);
  out=out.replace(NEW2a,"").replace(NEW2b,OLD2b);
  return out;
}
console.log("the change is where it should be");
ok("_kcTodayCards opens with the break check (once)",count(SRC,CUT1)===1&&SRC.indexOf(CUT1)>SRC.indexOf("function _kcTodayCards(")&&SRC.indexOf(CUT1)<SRC.indexOf("function kcSchoolHTML("));
ok("kcSchoolHTML's empty line names the break (once each)",count(SRC,NEW2a)===1&&count(SRC,NEW2b)===1&&SRC.indexOf(NEW2b)>SRC.indexOf("function kcSchoolHTML(")&&SRC.indexOf(NEW2b)<SRC.indexOf("function kcChoresHTML("));
const BASE=strip(SRC);
ok("stripped, the file has no KC_BREAK left and the old empty line once",BASE.indexOf("KC_BREAK")<0&&count(BASE,"No school cards today \\u{1F389}</div>';")===1&&BASE.length<SRC.length);
ok("stripped, _kcTodayCards and kcSchoolHTML read as before (the decision is the only line in _kcTodayCards)",
  BASE.slice(BASE.indexOf("function _kcTodayCards("),BASE.indexOf("function kcSchoolHTML(")).indexOf("scheduleBreakToday")<0&&
  BASE.slice(BASE.indexOf("function kcSchoolHTML("),BASE.indexOf("function kcChoresHTML(")).indexOf("scheduleBreakToday")<0);
ok("the change writes nothing (no db, no storage, no timer)",!/\bdb\b|HA_LS|localStorage|setTimeout|\.set\(|\.update\(/.test(SRC.slice(SRC.indexOf("function _kcTodayCards("),SRC.indexOf("function kcChoresHTML(")).split("\n").filter(l=>l.indexOf("KC_BREAK")>=0).join("\n").replace(/\/\/[^\n]*/g,"")));
ok("the Schedule tab's rule is the same one function (holiday, vacation, cleaning day)",/const _brk=scheduleBreakToday\(\);\n\s*if\(_brk\)\{ el\.innerHTML=\(_brk\.type==="cleaning"/.test(SRC));
const BASE_PATH=path.join(os.tmpdir(),"kc_break_base_"+process.pid+".html");
fs.writeFileSync(BASE_PATH,BASE);

// ── a world: the demo family, week 1 (Mon 2026-11-09 … Fri 11-13) built on Sunday and played ──
async function world(o){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const d=JSON.parse(JSON.stringify(FX.db)); Object.assign(d.calendar,JSON.parse(JSON.stringify(o.cal||{})));
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const A=S.bootDevice({name:o.name,dev:"dev_a",db,clock,sched,family:FX.family,indexPath:o.base?BASE_PATH:INDEX,globals:{Math:M}});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);          // Sunday: week 1 builds itself
  const W={A,db,clock,flush,R:e=>A.run(e),
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id),
    checked:()=>db.get(W.wk()+"/checked")||{}};
  W.play=async(iso,dn,untilMin)=>{                     // check off that day's cards that end by untilMin, in time order
    const ck=W.checked();
    const cards=W.board().filter(t=>t.day===dn&&!ck[t.id]&&!String(t.id).endsWith("_c")&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null)
      .sort((a,b)=>toMin(a.time)-toMin(b.time)||String(a.id).localeCompare(b.id));
    for(const t of cards){ const end=toMin(t.time)+(+t.dur||20); if(end>untilMin) continue;
      const at=hm(iso,Math.floor(end/60),end%60); if(at>clock.now) clock.now=at;
      if(!A.tasks().some(x=>x.id===t.id)) continue;
      A.fn("finalizeDone")(t.id,A.fn("nowTs")()); await flush(4000); }
  };
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; A.fn("dayRollCheck")(); await flush(90000); };
  W.at=async(iso,h,m)=>{ clock.now=hm(iso,h,m); await flush(2000); };
  // what the kid sees (Mom mode off, Kids' Corner tab)
  W.view=k=>{ const r=W.R('(function(){ var c=_kcTodayCards("'+k+'"); return JSON.stringify({ids:c.map(function(t){ return t.id+"|"+t.day+"|"+t.time; }),'
    +'open:c.filter(function(t){ return !checked[t.id]; }).length,school:kcSchoolHTML("'+k+'"),points:kcPointsHTML("'+k+'"),'
    +'pick:hrKidCards("'+k+'").map(function(t){ return t.id; })}); })()'); return JSON.parse(r); };
  W.R('__HARNESS_NO_RENDER=true; tab="kids";');
  return W;
}
const kidMode=W=>W.R('haMomOff(); tab="kids";');
const DAYS5=[["2026-11-09","monday"],["2026-11-10","tuesday"],["2026-11-11","wednesday"],["2026-11-12","thursday"],["2026-11-13","friday"]];
async function playWeek(W,lateUntil){   // Mon–Wed every card done; Thu + Fri only the first part of the morning (the rest left open)
  for(let i=0;i<DAYS5.length;i++){ if(i) await W.roll(DAYS5[i][0]); await W.play(DAYS5[i][0],DAYS5[i][1],i<3?24*60:lateUntil); }
}
const KIDS=["kid_a","kid_b","kid_c","kid_d"];
const SCHOOL_LINE=/📖 School<\/span><span[^>]*>([^<]*)</;
const tagsBalanced=h=>["div","span","button"].every(t=>count(h,"<"+t+">")+count(h,"<"+t+" ")===count(h,"</"+t+">"));
const dupIds=h=>{ const ids=(h.match(/\sid="[^"]+"/g)||[]).map(x=>x.slice(5,-1)); return ids.filter((x,i)=>ids.indexOf(x)!==i); };
const EMPTY_RE=/<div style="padding:22px 14px;text-align:center;font-size:15px;font-weight:700;color:var\(--muted\)">[^<]*<\/div>/;

(async function(){
  // ── 1 + 2. the live case: a holiday covers the whole week after week 1 ──
  const FALL={holidays:{h1:{name:"Fall Break",start:"2026-11-16",end:"2026-11-20",pause:"school"}}};
  const OLD=await world({name:"before",base:true,cal:FALL}), NEW=await world({name:"after",cal:FALL});
  for(const W of [OLD,NEW]){ await playWeek(W,9*60+40); for(const iso of ["2026-11-14","2026-11-15","2026-11-16","2026-11-17"]) await W.roll(iso); await W.at("2026-11-17",10,30); kidMode(W); }
  console.log("the break week: no new week, the active week is still last week's");
  ok("both worlds: today is Tuesday 2026-11-17, a break, and the active week is still week 1",[OLD,NEW].every(W=>W.R("_todayStr()")==="2026-11-17"&&W.R("_todayDay")==="tuesday"&&W.wk()==="week1"&&JSON.parse(W.R("JSON.stringify(scheduleBreakToday())")).name==="Fall Break"),[NEW.wk(),NEW.R("_todayStr()")]);
  ok("both worlds played the same week (same board, same checks)",JSON.stringify(OLD.checked())===JSON.stringify(NEW.checked())&&OLD.board().length===NEW.board().length&&OLD.board().length>40);

  console.log("before the fix (KC_BREAK stripped): break Tuesday");
  const oT={}; KIDS.forEach(k=>oT[k]=OLD.view(k));
  ok("every kid gets last week's Tuesday cards",KIDS.every(k=>oT[k].ids.length>0&&oT[k].ids.every(x=>x.split("|")[1]==="tuesday")),KIDS.map(k=>oT[k].ids.length));
  ok("…all of them already checked (nothing open)",KIDS.every(k=>oT[k].open===0));
  ok("kcSchoolHTML draws them as cards",KIDS.every(k=>count(oT[k].school,'class="task-cb')===oT[k].ids.length));
  ok("the ⭐ card says \"📖 School N of N cards — done!\"",KIDS.every(k=>{ const m=SCHOOL_LINE.exec(oT[k].points); return m&&m[1]===oT[k].ids.length+" of "+oT[k].ids.length+" cards \u2014 done!"; }),KIDS.map(k=>(SCHOOL_LINE.exec(oT[k].points)||[])[1]));
  ok("a school-age kid sees the Morning-list lock on a break day",["kid_a","kid_b","kid_c"].some(k=>oT[k].school.indexOf("Finish your Morning list")>0));

  console.log("after the fix: break Tuesday");
  const nT={}; KIDS.forEach(k=>nT[k]=NEW.view(k));
  ok("no school cards for any kid",KIDS.every(k=>nT[k].ids.length===0&&count(nT[k].school,'class="task-cb')===0),KIDS.map(k=>nT[k].ids.length));
  ok("one plain line names the break",KIDS.every(k=>nT[k].school.indexOf(">No school today \u2014 Fall Break \u{1F389}</div>")>0&&nT[k].school.indexOf("No school cards today")<0));
  ok("no \"📖 School\" line on the ⭐ card",KIDS.every(k=>nT[k].points.length>200&&nT[k].points.indexOf("\u{1F4D6} School")<0));
  ok("the 🙋 picker is empty",KIDS.every(k=>nT[k].pick.length===0));
  ok("no lock, no look-ahead, no Brain Break",KIDS.every(k=>nT[k].school.indexOf("\u{1F512}")<0&&nT[k].school.indexOf("Look ahead")<0&&nT[k].school.indexOf("time-slots")<0));
  ok("the ⭐ card is otherwise what the old code draws (the School line is the only difference)",KIDS.every(k=>oT[k].points.replace(/<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #f1f5f9"><span style="flex:0 0 78px;font-weight:800;color:#15803d">✓ 📖 School<\/span>.*?<\/div>/,"")===nT[k].points));

  console.log("break Thursday (last week's unfinished Thursday cards)");
  for(const W of [OLD,NEW]){ await W.roll("2026-11-18"); await W.roll("2026-11-19"); await W.at("2026-11-19",10,30); kidMode(W); }
  const oH={}, nH={}; KIDS.forEach(k=>{ oH[k]=OLD.view(k); nH[k]=NEW.view(k); });
  ok("before: last week's Thursday cards, some left open, counted on the ⭐ card (\"N of M cards\") and offered in the 🙋 picker",
    KIDS.some(k=>oH[k].open>0)&&KIDS.every(k=>oH[k].ids.every(x=>x.split("|")[1]==="thursday"))&&KIDS.filter(k=>oH[k].open>0).every(k=>{ const m=SCHOOL_LINE.exec(oH[k].points); return m&&m[1]===(oH[k].ids.length-oH[k].open)+" of "+oH[k].ids.length+" cards"&&oH[k].pick.length===oH[k].open; }),
    KIDS.map(k=>[oH[k].ids.length,oH[k].open,(SCHOOL_LINE.exec(oH[k].points)||[])[1]]));
  ok("before: those open leftovers are drawn as missed (greyed ×, no ✓ box to tap)",KIDS.filter(k=>oH[k].open>0).every(k=>count(oH[k].school,'>&times;</div>')>=oH[k].open));
  ok("after: no cards, the break line, no School line, empty picker",KIDS.every(k=>nH[k].ids.length===0&&nH[k].pick.length===0&&nH[k].points.indexOf("\u{1F4D6} School")<0&&nH[k].school.indexOf("No school today \u2014 Fall Break \u{1F389}")>0));

  console.log("Kids' Corner ▸ Today on a break day = the old code's page for a day with no school cards");
  const writes0=NEW.db.log.length;
  for(const momOn of [false,true]){
    for(const k of KIDS){
      [OLD,NEW].forEach(W=>W.R((momOn?'haMomOn();':'haMomOff();')+' tab="kids"; kcKid="'+k+'";'));
      const n=NEW.R('kcTodayHTML("'+k+'")');
      const o=OLD.R('(function(){ var keep=_kcTodayCards; _kcTodayCards=function(){ return []; }; try{ return kcTodayHTML("'+k+'"); } finally{ _kcTodayCards=keep; } })()');
      ok((momOn?"Mom here":"kid mode")+", "+k+": the same page, only the empty line differs (\"No school cards today\" → the break line)",
        o.indexOf("No school cards today")>0&&n.indexOf("No school today \u2014 Fall Break")>0&&n.replace(EMPTY_RE,"")===o.replace(EMPTY_RE,""),[n.length,o.length]);
      ok("…balanced tags, no duplicate ids",tagsBalanced(n)&&dupIds(n).length===0,dupIds(n));
    }
  }
  { const n=NEW.R('kcTodayHTML("kid_a")');
    ok("top to bottom: ⭐ card, the break line, then \"Also today\" with the break as a calendar row",n.indexOf("in your bank")>=0&&n.indexOf("in your bank")<n.indexOf("No school today")&&n.indexOf("No school today")<n.indexOf("Also today")&&n.indexOf("Fall Break",n.indexOf("Also today"))>0); }
  ok("drawing writes nothing",NEW.db.log.length===writes0,NEW.db.log.slice(writes0).map(l=>l.op+" "+l.path));
  kidMode(OLD); kidMode(NEW);

  // ── 3 + 4. the break types, a break inside this week, and the days around it ──
  console.log("each break type, on a day the active week IS this week (Wed 2026-11-11)");
  const TYPES=[
    ["one-day holiday (school)",{holidays:{h:{name:"Teacher Day",date:"2026-11-11",pause:"school"}}},"No school today \u2014 Teacher Day \u{1F389}"],
    ["vacation (everything)",{vacations:{v:{name:"Beach Trip",start:"2026-11-11",end:"2026-11-11",pause:"all"}}},"No school today \u2014 Beach Trip \u{1F389}"],
    ["cleaning day",{cleaningDays:{"2026-11-11":{at:1,by:"mom"}}},"No school today \u2014 it\u2019s cleaning day \u{1F9FD}"],
    ["a name with markup is escaped",{holidays:{h:{name:"Fun <b>Day</b>",date:"2026-11-11",pause:"school"}}},"No school today \u2014 Fun &lt;b&gt;Day&lt;/b&gt; \u{1F389}"]
  ];
  for(const [lbl,cal,line] of TYPES){
    const O=await world({name:"before "+lbl,base:true}), N=await world({name:"after "+lbl});
    for(const W of [O,N]){ await W.play("2026-11-09","monday",10*60); await W.roll("2026-11-10"); await W.play("2026-11-10","tuesday",10*60); await W.at("2026-11-10",10,40); kidMode(W); }
    const same=(dn)=>KIDS.every(k=>JSON.stringify(O.view(k))===JSON.stringify(N.view(k)));
    ok(lbl+": the day before (Tue) is exactly what the old code draws",same());
    // Mom adds the break for Wednesday after the week was built: Wednesday's cards are laid on that day name
    for(const W of [O,N]){ W.R('(function(c){ for(var key in c){ calendarData[key]=Object.assign({},calendarData[key]||{},c[key]); } })('+JSON.stringify(cal)+')'); await W.roll("2026-11-11"); await W.at("2026-11-11",10,30); kidMode(W); }
    ok(lbl+": Wednesday is a break by the Schedule tab's rule",N.R("!!scheduleBreakToday()")&&O.R("!!scheduleBreakToday()"));
    const ov={}, nv={}; KIDS.forEach(k=>{ ov[k]=O.view(k); nv[k]=N.view(k); });
    ok(lbl+": before, Wednesday's cards (and unfinished ones rolled forward) still showed",KIDS.some(k=>ov[k].ids.length>0),KIDS.map(k=>[ov[k].ids.length,ov[k].open]));
    ok(lbl+": after, no school cards, the line, no School line, empty picker",KIDS.every(k=>nv[k].ids.length===0&&nv[k].pick.length===0&&nv[k].school.indexOf(">"+line+"</div>")>0&&nv[k].points.indexOf("\u{1F4D6} School")<0),nv.kid_a.school.slice(-260));
    ok(lbl+": the board is untouched — the cards are still in the week (nothing removed, nothing written for them)",JSON.stringify(O.board().map(t=>t.id).sort())===JSON.stringify(N.board().map(t=>t.id).sort())&&N.board().some(t=>t.day==="wednesday"));
    for(const W of [O,N]){ await W.roll("2026-11-12"); await W.at("2026-11-12",10,30); kidMode(W); }
    ok(lbl+": the day after (Thu) is exactly what the old code draws",same());
    ok(lbl+": …and Thursday has cards again",KIDS.some(k=>N.view(k).ids.length>0));
  }

  console.log("the day before a full-week break and the day after it");
  { const O=await world({name:"before around",base:true,cal:{holidays:{h:{name:"Midweek Break",start:"2026-11-10",end:"2026-11-11",pause:"school"}}}}),
          N=await world({name:"after around",cal:{holidays:{h:{name:"Midweek Break",start:"2026-11-10",end:"2026-11-11",pause:"school"}}}});
    for(const W of [O,N]){ await W.play("2026-11-09","monday",10*60); await W.at("2026-11-09",10,40); kidMode(W); }
    ok("Monday (before Tue–Wed break): identical to the old code, with cards",KIDS.every(k=>JSON.stringify(O.view(k))===JSON.stringify(N.view(k)))&&KIDS.some(k=>N.view(k).ids.length>0));
    for(const W of [O,N]){ await W.roll("2026-11-10"); await W.at("2026-11-10",10,30); kidMode(W); }
    ok("Tuesday (in the break): no cards after the fix",KIDS.every(k=>N.view(k).ids.length===0&&N.view(k).school.indexOf("Midweek Break")>0));
    for(const W of [O,N]){ await W.roll("2026-11-11"); await W.roll("2026-11-12"); await W.at("2026-11-12",10,30); kidMode(W); }
    ok("Thursday (after it ends): identical to the old code, with cards",KIDS.every(k=>JSON.stringify(O.view(k))===JSON.stringify(N.view(k)))&&KIDS.some(k=>N.view(k).ids.length>0));
  }

  // ── 5. no break: byte-identical over random weeks ──
  console.log("no break: byte-identical to the old code over 300 random weeks");
  { const O=await world({name:"before random",base:true}), N=await world({name:"after random"});
    for(const W of [O,N]){ await W.play("2026-11-09","monday",11*60); await W.roll("2026-11-10"); await W.at("2026-11-10",10,30); }
    const orig=JSON.parse(N.R("JSON.stringify(weekData.tasks)"));
    let seed=20261124; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const DN=["monday","tuesday","wednesday","thursday","friday"];
    let diffs=0, firstDiff=null, nCards=0, nOpen=0;
    for(let it=0;it<300;it++){
      const tasks=JSON.parse(JSON.stringify(orig)), ck={};
      tasks.forEach(t=>{ if(t.who==="kid_a"||t.who==="kid_b"){ if(rnd()<0.5) t.day=DN[Math.floor(rnd()*5)]; if(rnd()<0.45) ck[t.id]="9:"+String(10+Math.floor(rnd()*40))+" AM"; } });
      const mom=rnd()<0.5, today=DN[Math.floor(rnd()*5)];
      const set='weekData.tasks='+JSON.stringify(tasks)+'; checked='+JSON.stringify(ck)+'; histState={}; _todayDay="'+today+'"; day="'+today+'"; '+(mom?'haMomOn();':'haMomOff();')+' tab="kids";';
      O.R(set); N.R(set);
      for(const k of ["kid_a","kid_b"]){
        const a=JSON.stringify(O.view(k)), b=JSON.stringify(N.view(k));
        if(a!==b){ diffs++; if(!firstDiff) firstDiff={it,k,a:a.slice(0,300),b:b.slice(0,300)}; }
        const v=JSON.parse(b); nCards+=v.ids.length; nOpen+=v.open;
      }
    }
    ok("300 weeks × 2 kids: _kcTodayCards, kcSchoolHTML, kcPointsHTML and hrKidCards identical",diffs===0,firstDiff);
    ok("…and the weeks really had cards, checked and open",nCards>600&&nOpen>100&&nOpen<nCards,[nCards,nOpen]);
  }

  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed");
  if(fail) process.exit(1);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
