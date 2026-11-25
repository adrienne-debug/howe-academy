/*
 * 🏖 BRKTODAY — one rule, "on a break day there are no school cards today", on every screen and gate that asks about today's
 * school work (her "fix all" 2026-11-24, after KC_BREAK fixed Kids' Corner).
 *
 * The live case: a calendar holiday covers the whole week. No week is built for a full break week, so the active week is still
 * LAST week's and every "today's cards" reader picked last week's cards by day name. A second way in: a one-day holiday added
 * after this week was built leaves that day's cards laid on the break day.
 *
 * Proved here — the WHOLE app runs in the vm sandbox of test_demo_week.js on the synthetic demo family, twice: the code with
 * every BRKTODAY change stripped (= the branch before) and the code as it is:
 *   W1 a full break week (Fall Break, week 1 played: Mon–Wed done, Thu/Fri partly open, spins in the pools) — break Tue and Thu;
 *   W2 a one-day break added on Wednesday after the week was built (holiday "school", vacation "all", cleaning day) — Wed, and
 *      the day before (Tue) and the day after (Thu) byte-identical to the old code;
 *   1 store gate + afternoon list · 2 Mom's Schedule ▸ Today, Dad's ▸ All, the helper's cards · 3 the board's 📅 pill + pop-up,
 *   the Today's-card tile · 4 the Mom loop (remaining, banner — incl. the one Kids' Corner drew above its break line) ·
 *   5 famCelebOwnWork (and the claim gate is UNCHANGED, on purpose: the star facts are pinned) · 6 efPullNext (writes nothing),
 *   rvCanToday / rvPlanDay · 7 msCheckCard / eicCheckCard · the Week grid is not blanked;
 *   no break: 300 random weeks, every touched function's output (and the writers' writes) identical to the stripped code;
 *   nothing is written by any probe on a break day; HTML balanced, no duplicate ids.
 * No kid or family names: the fixture is synthetic.   run: node test_break_today.js
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path"), os=require("os");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const SRC=fs.readFileSync(INDEX,"utf8");
const T0=Date.now();

let pass=0, fail=0;
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,900)+")":"")); } }
const count=(s,x)=>s.split(x).length-1;
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };

// ── every change, [where, old, new]; stripping puts old back (= the code before BRKTODAY) ──
const CHANGES=[
  ["helper","    ||((typeof hhCleanDay===\"function\"&&hhCleanDay(ds))?{name:\"Cleaning day\",type:\"cleaning\",start:ds,end:ds,pause:\"school\"}:null);   // 🧽 CLEANINGDAY: pauses like a vacation\n}\n",
   "    ||((typeof hhCleanDay===\"function\"&&hhCleanDay(ds))?{name:\"Cleaning day\",type:\"cleaning\",start:ds,end:ds,pause:\"school\"}:null);   // 🧽 CLEANINGDAY: pauses like a vacation\n}\n// 🏖 BRKTODAY_START — ONE rule for today's school work on a break day (her \"fix all\" 2026-11-24, after Kids' Corner's fix: \"if they're on\n//   break, there shouldn't be anything there\"). A full break week builds no week, so the active week is still LAST week's and its\n//   cards match today's day name; a one-day holiday added after the week was built leaves cards laid on that day. On a day\n//   scheduleBreakToday() returns a break (holiday, vacation, cleaning day — the Schedule tab's own test, never a second one) there\n//   are no school cards TODAY, and every screen and gate that asks about today's school work asks schoolOffToday(). Today only:\n//   past and future days, the week views, effectiveDay, the week builder and which week is active are not changed. Reads only.\n// 📅 BWNOWEEK (slice 1 of DESIGN_break_week_2026-11-24, 2026-11-24): …and also a day whose week the board doesn't hold — a week the plan\n//   doesn't cover with no calendar break (every week after the plan ends), the weekend days of a break — boardWeekIsThisWeek().\nfunction schoolOffToday(){ try{ return !!scheduleBreakToday()||(typeof boardWeekIsThisWeek===\"function\"&&!boardWeekIsThisWeek()); }catch(e){ return false; } }\n// The one plain line a \"today\" agenda draws where its school cards would be — the words and look of Kids' Corner's break line.\nfunction brkTodayLineHTML(){\n  let b=null; try{ b=scheduleBreakToday(); }catch(e){ b=null; } if(!b&&typeof boardWeekIsThisWeek===\"function\"&&!boardWeekIsThisWeek()) b={type:\"noweek\"};   // 📅 BWNOWEEK: no break behind it (the line below draws her answer 1's words)\n  if(!b) return \"\";\n  return '<div style=\"padding:22px 14px;text-align:center;font-size:15px;font-weight:700;color:var(--muted)\">'+(b.type===\"noweek\"?'No school week planned \\u{1F389}':b.type===\"cleaning\"?'No school today \\u2014 it\\u2019s cleaning day \\u{1F9FD}':'No school today \\u2014 '+esc(b.name)+' \\u{1F389}')+'</div>';   // 📅 BWNOWEEK: no break behind it — her answer 1's words alone\n}\n// Mom's 🗓 Schedule ▸ Today and Dad's ▸ All on a break day: the line, then only the rows that are not school cards — Mom's laundry,\n// meal-prep and house blocks (momAgendaHtml with no cards), Dad's own column (extra) — as each agenda draws a day with no cards.\nfunction brkTodayAgendaHTML(who,d,extra){\n  const _pk=kid, _pd=day; let rest=\"\";\n  try{ kid=who; day=d;\n    if(who===\"mom\"){ const h=momAgendaHtml([]); if(h.indexOf('class=\"mom-agenda\"')>=0) rest=h; }\n    else if(extra&&Array.isArray(extra.items)&&extra.items.length) rest=allAgendaHtml([],null,{extra:extra});\n  }catch(e){ rest=\"\"; } finally{ kid=_pk; day=_pd; }\n  return brkTodayLineHTML()+rest;\n}\n// 🏖 BRKTODAY_END\n"],
  ["item1","  const school=(typeof rtSchoolworkDone===\"function\")?rtSchoolworkDone(kid,_todayDay):true;\n  const past=",
   "  const school=(typeof schoolOffToday===\"function\"&&schoolOffToday())?true:((typeof rtSchoolworkDone===\"function\")?rtSchoolworkDone(kid,_todayDay):true);   // 🏖 BRKTODAY: a break day has no school work to finish\n  const past="],
  ["item1","  if((m===\"afterSchool\"||m===\"both\")&&(typeof rtSchoolworkDone===\"function\")&&!rtSchoolworkDone(kid,_todayDay)) return \"📚 Opens when school work is done\";",
   "  if((m===\"afterSchool\"||m===\"both\")&&!(typeof schoolOffToday===\"function\"&&schoolOffToday())&&(typeof rtSchoolworkDone===\"function\")&&!rtSchoolworkDone(kid,_todayDay)) return \"📚 Opens when school work is done\";   // 🏖 BRKTODAY"],
  ["item1","function rtAvailable(slot,kid,d){ if(slot===\"afternoon\") return rtAlwaysOpen(d)||(d===_todayDay&&typeof hhCleanOn===\"function\"&&hhCleanOn(_todayStr()))||rtSchoolworkDone(kid,d)||",
   "function rtAvailable(slot,kid,d){ if(slot===\"afternoon\") return rtAlwaysOpen(d)||(d===_todayDay&&typeof hhCleanOn===\"function\"&&hhCleanOn(_todayStr()))||rtSchoolworkDone(kid,d)||(d===_todayDay&&typeof schoolOffToday===\"function\"&&schoolOffToday())||"],
  ["item2","function mpSchAgendaHTML(who,d){\n  const ts=mpSchTasks(who,d), _pk=kid, _pd=day;",
   "function mpSchAgendaHTML(who,d){\n  if(d===mdTodayName()&&typeof schoolOffToday===\"function\"&&schoolOffToday()) return brkTodayAgendaHTML(who,d);   // 🏖 BRKTODAY: a break day draws no school agenda — the line, then Mom's own rows\n  const ts=mpSchTasks(who,d), _pk=kid, _pd=day;"],
  ["item2","  finally{ kid=_pk; day=_pd; dadTapView=false; }\n  h+='<div style=\"padding:4px 4px 0\">'+ag+'</div></div>';",
   "  finally{ kid=_pk; day=_pd; dadTapView=false; }\n  if(typeof schoolOffToday===\"function\"&&schoolOffToday()){ try{ kid=\"all\"; day=d; dadTapView=true; ag=brkTodayAgendaHTML(\"all\",d,{key:\"dad\",label:\"\\u{1F468} Dad\",color:\"#2C5F8A\",items:dadSchedItems(d)}); }catch(e){} finally{ kid=_pk; day=_pd; dadTapView=false; } }   // 🏖 BRKTODAY: Dad gets what Mom gets — the line, then his own column\n  h+='<div style=\"padding:4px 4px 0\">'+ag+'</div></div>';"],
  ["item2","function helperTasksToday(id){\n  const p=helpersData[id]; if(!p) return [];",
   "function helperTasksToday(id){\n  if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return [];   // 🏖 BRKTODAY: no school cards today on a break — her list, Dad's helper cards and the count follow\n  const p=helpersData[id]; if(!p) return [];"],
  ["item3","function _boardTaskCounts(kid,d){ var ts=",
   "function _boardTaskCounts(kid,d){ if(d===_todayDay&&typeof schoolOffToday===\"function\"&&schoolOffToday()) return {total:0,done:0};   /* 🏖 BRKTODAY: no school cards today on a break */ var ts="],
  ["item3","  } else if(slot===\"tasks\"){ title=\"📅 School work\";\n    getActiveTasks()",
   "  } else if(slot===\"tasks\"){ title=\"📅 School work\";\n    if(!(day===_todayDay&&typeof schoolOffToday===\"function\"&&schoolOffToday()))   // 🏖 BRKTODAY: no school cards today on a break\n    getActiveTasks()"],
  ["item3","function dcTodayGroups(){\n  const td=",
   "function dcTodayGroups(){\n  if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return [];   // 🏖 BRKTODAY: no family-time cards today on a break — the Today's-card tile and everything else reading this follow\n  const td="],
  ["item4","function mlRemaining(kid){\n  try{\n    return (getActiveTasks()",
   "function mlRemaining(kid){\n  try{\n    if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return [];   // 🏖 BRKTODAY: last week's (or a holiday's) cards are not Mom work today — no banner, no turn, nothing left on the strip\n    return (getActiveTasks()"],
  ["item5","function famCelebOwnWork(kid,d){\n  if(d!==_todayDay||",
   "function famCelebOwnWork(kid,d){\n  if(d===_todayDay&&typeof schoolOffToday===\"function\"&&schoolOffToday()) return false;   // 🏖 BRKTODAY: stale cards on a break day never fire \"own work done\"\n  if(d!==_todayDay||"],
  ["item6","function efPullNext(kid){\n  try{\n",
   "function efPullNext(kid){\n  try{\n    if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return null;   // 🏖 BRKTODAY: a break day pulls nothing forward (this writes)\n"],
  ["item6","function rvCanToday(kid,minutes){ try{ return ",
   "function rvCanToday(kid,minutes){ try{ if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return false;   /* 🏖 BRKTODAY: no \"later today\" on a break */ return "],
  ["item7","function eicCheckCard(kid){\n  try{\n",
   "function eicCheckCard(kid){\n  try{\n    if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return false;   // 🏖 BRKTODAY: no card today on a break — the exercise still scores, as on a day with no card\n"],
  ["item7","function msCheckCard(kid){\n  try{\n",
   "function msCheckCard(kid){\n  try{\n    if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return false;   // 🏖 BRKTODAY: no card today on a break — the sprint still scores, as on a day with no card\n"],
  // 📅 BWNOWEEK (break week slice 1, 2026-11-24): Kids' Corner asks the same one rule now; stripped back to KC_BREAK's own line (test_kc_break_cards.js pins that)
  ["kc","    if(typeof scheduleBreakToday===\"function\"&&scheduleBreakToday()) return [];   // 🏖 KC_BREAK (her report 2026-11-24:",
   "    if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return [];   // 🏖 KC_BREAK → 📅 BWNOWEEK: asks schoolOffToday() (a break day, or a week the board doesn't hold) (her report 2026-11-24:"],
];
function strip(src){
  for(let i=CHANGES.length-1;i>=0;i--){ const [,o,n]=CHANGES[i]; if(count(src,n)!==1) throw new Error("change "+i+" ("+CHANGES[i][0]+") not found once"); src=src.split(n).join(o); }
  return src;
}
console.log("the change is where it should be");
ok("every BRKTODAY change is in index.html exactly once ("+CHANGES.length+")",CHANGES.every(c=>count(SRC,c[2])===1));
const BASE=strip(SRC);
ok("stripped, no BRKTODAY is left and the file is shorter",BASE.indexOf("BRKTODAY")<0&&BASE.indexOf("schoolOffToday")<0&&BASE.length<SRC.length);
ok("…and every old line is back exactly once",CHANGES.every(c=>count(BASE,c[1])===1));
ok("ONE rule: schoolOffToday() is scheduleBreakToday() (the Schedule tab's own test) — or, since BWNOWEEK, a week the board doesn't hold — defined once",count(SRC,"function schoolOffToday(){ try{ return !!scheduleBreakToday()||(typeof boardWeekIsThisWeek===\"function\"&&!boardWeekIsThisWeek()); }catch(e){ return false; } }")===1&&count(SRC,"function schoolOffToday(")===1);
ok("every guard asks schoolOffToday() (no second way to decide)",CHANGES.filter(c=>c[0]!=="helper").every(c=>c[2].indexOf('schoolOffToday()')>0&&c[2].replace(c[1],"").indexOf("scheduleBreakToday")<0));
{ const added=CHANGES.map(c=>c[2].split("\n").filter(l=>c[1].indexOf(l)<0).join("\n")).join("\n").replace(/\/\/[^\n]*|\/\*[^*]*\*\//g,"");
  ok("the changes write nothing (no db, storage, timer, set/update/remove)",!/\bdb\b|HA_LS|localStorage|\bsv\(|setTimeout|\.set\(|\.update\(|\.remove\(|obSet|obInc/.test(added),added.match(/\bdb\b|\.set\(|\.update\(/)); }
ok("the Schedule tab's own break card is untouched",/const _brk=scheduleBreakToday\(\);\n\s*if\(_brk\)\{ el\.innerHTML=/.test(SRC));
ok("Kids' Corner's KC_BREAK line asks the same rule since BWNOWEEK (its own test pins it)",count(SRC,'if(typeof schoolOffToday==="function"&&schoolOffToday()) return [];   // \u{1F3D6} KC_BREAK')===1&&count(BASE,'if(typeof scheduleBreakToday==="function"&&scheduleBreakToday()) return [];   // \u{1F3D6} KC_BREAK')===1);
const BASE_PATH=path.join(os.tmpdir(),"brk_today_base_"+process.pid+".html");
fs.writeFileSync(BASE_PATH,BASE);

// ── a world: the demo family, week 1 (Mon 2026-11-09 … Fri 11-13) built on Sunday ──
const KIDS=["kid_a","kid_b","kid_c","kid_d"];
async function world(o){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const d=JSON.parse(JSON.stringify(FX.db)); Object.assign(d.calendar,JSON.parse(JSON.stringify(o.cal||{})));
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const A=S.bootDevice({name:o.name,dev:"dev_a",db,clock,sched,family:FX.family,indexPath:o.base?BASE_PATH:INDEX,globals:{Math:M}});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  const W={A,db,clock,flush,R:e=>A.run(e),wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id),checked:()=>db.get(W.wk()+"/checked")||{}};
  W.play=async(iso,dn,untilMin)=>{
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
  W.R('__HARNESS_NO_RENDER=true; tab="kids"; document.body.insertAdjacentHTML=function(p,h){ __pop=h; }; var __pop="";');
  return W;
}
// the scene every probe reads: kid mode, a helper approved for some cards, the morning list done for three kids (so the
// board's 📅 pill counts and the loop can pick a kid), one celebrating family-time card for today, a store open after school.
const SCENE=`(function(){
  haMomOff(); tab="kids";
  helpersData=helpersData||{}; helpersData.hx={name:"Helper",help:{kid_a:{math:true,reading:true},kid_b:{math:true,spelling:true},kid_c:{phonics:true,math:true}}};
  ["kid_a","kid_b","kid_c"].forEach(function(k){ slState[activeWk()+"_"+_todayDay+"_"+k+"_morning"]={done:true}; });
  rulesData.familyBlocks={fb1:{name:"Read Aloud",celeb:"confetti",items:[{key:"i1",name:"Book"}]}};
  if(!weekData.tasks.some(function(t){ return t.id==="zz_fam_"+_todayDay; })) weekData.tasks.push({id:"zz_fam_"+_todayDay,who:"kid_d",day:_todayDay,time:"1:30 PM",dur:20,famBlock:"fb1",famItem:"i1",title:"Read Aloud",detail:"",subjectKey:"fam_fb1",mom:"required"});
  storeCfg=Object.assign({},storeCfg||{},{open:true,mode:"afterSchool",hour:16,closedFor:{}});
  _showCelebration=function(){};
})()`;
const PROBE=`(function(){
  var out={}, K=${JSON.stringify(KIDS)}, sv0={kid:kid,day:day};
  var cards=function(h){ return (h.match(/class="task-cb/g)||[]).length; };
  try{
  K.forEach(function(k){
    var o=out[k]={};
    o.store=storeOpenFor(k); o.storeWhy=storeClosedReason(k); o.pm=rtAvailable("afternoon",k,_todayDay);
    var ag=mpSchAgendaHTML(k,mdTodayName()); o.agCards=cards(ag); o.ag=ag;
    o.board=_boardTaskCounts(k,_todayDay);
    __pop=""; boardStatPop(k,"tasks"); o.pop=__pop;
    o.mlRem=mlRemaining(k).map(function(t){ return t.id; }); o.mlBan=mlBannerHTML(k);
    o.kcSchool=kcSchoolHTML(k);
    o.schoolDone=schoolDoneOn(k,_todayDay); o.claimGate=spinClaimGateDone(k,_todayDay);
    o.dayPts=getKidDayPoints(k,_todayDay); var c=getPointClaim(k,_todayDay); o.claim=c?c.status:null;
    var kp=kcPointsHTML(k); o.claimBtn=/claimDayPoints\\(/.test(kp);
    o.rvCan=rvCanToday(k,10); o.rv=rvPlanDay(k,10,"today");
  });
  out.mom=mpSchAgendaHTML("mom",mdTodayName()); out.all=mpSchAgendaHTML("all",mdTodayName());
  out.week=mpSchWeekHTML("all");
  out.dadAll=(function(){ var el={innerHTML:""}; renderDadAll(el); return el.innerHTML; })();
  out.help=helperTasksToday("hx").map(function(t){ return t.id; });
  out.boardPills=(function(){ var el={innerHTML:""}; renderMomBoard(el); return el.innerHTML.match(/📅 [^<]*/g)||[]; })();
  out.dc=dcTodayGroups().length; out.dcTile=dcTileHTML();
  out.mlNow=JSON.stringify(mlNow());
  out.mpBody=(function(){ mpSchMode="today"; mpSchDay=null; mpSchWho="mom"; return mpSchBody(); })();
  }finally{ kid=sv0.kid; day=sv0.day; }
  return JSON.stringify(out);
})()`;
const probe=W=>{ W.R(SCENE); return JSON.parse(W.R(PROBE)); };
const tagsBalanced=h=>["div","span","button"].every(t=>count(h,"<"+t+">")+count(h,"<"+t+" ")===count(h,"</"+t+">"));
const dupIds=h=>{ const ids=(h.match(/\sid="[^"]+"/g)||[]).map(x=>x.slice(5,-1)); return ids.filter((x,i)=>ids.indexOf(x)!==i); };
const LINE=n=>'>No school today — '+n+' \u{1F389}</div>';
const CLEAN_LINE='>No school today — it’s cleaning day \u{1F9FD}</div>';
const SCHOOL_KIDS=["kid_a","kid_b","kid_c"];

// a writer run in a world: what it returned and the writes it made (op path keys)
async function runWriter(W,expr){ const m=W.db.log.length; const v=W.R(expr); await W.flush(3000); return {v:v,writes:W.db.log.slice(m).map(l=>l.op+" "+l.path+(l.keys?" "+l.keys.join(","):""))}; }

(async function(){
  // ═══ W1 — a full break week ═══
  const FALL={holidays:{h1:{name:"Fall Break",start:"2026-11-16",end:"2026-11-20",pause:"school"}}};
  const OLD=await world({name:"before",base:true,cal:FALL}), NEW=await world({name:"after",cal:FALL});
  const DAYS5=[["2026-11-09","monday"],["2026-11-10","tuesday"],["2026-11-11","wednesday"],["2026-11-12","thursday"],["2026-11-13","friday"]];
  for(const W of [OLD,NEW]){
    for(let i=0;i<5;i++){ if(i) await W.roll(DAYS5[i][0]); await W.play(DAYS5[i][0],DAYS5[i][1],i<3?24*60:9*60+40);
      if(i===1) W.R('addKidPoints("kid_a",5,"tuesday")'); if(i===3) W.R('addKidPoints("kid_a",7,"thursday"); addKidPoints("kid_b",4,"thursday")'); }
    for(const iso of ["2026-11-14","2026-11-15","2026-11-16","2026-11-17"]) await W.roll(iso);
    await W.at("2026-11-17",10,30); W.R('pointClaimsLoaded=true; forfeitSweep();'); await W.flush(2000);
  }
  console.log("W1 — a full break week: the active week is still last week's");
  ok("both worlds: Tue 2026-11-17 is a break (Fall Break) and the active week is still week 1",[OLD,NEW].every(W=>W.R("_todayStr()")==="2026-11-17"&&W.R("_todayDay")==="tuesday"&&W.wk()==="week1"&&JSON.parse(W.R("JSON.stringify(scheduleBreakToday())")).name==="Fall Break"));
  ok("both worlds played the same week (board, checks, spin pools, forfeits)",JSON.stringify(OLD.checked())===JSON.stringify(NEW.checked())&&JSON.stringify(OLD.db.get("pointClaims"))===JSON.stringify(NEW.db.get("pointClaims"))&&OLD.board().length>40);
  let w0=NEW.db.log.length;
  const oT=probe(OLD), nT=probe(NEW);
  ok("probing a break day writes nothing (after)",NEW.db.log.length===w0,NEW.db.log.slice(w0).map(l=>l.op+" "+l.path));

  console.log("1 · the store gate and the afternoon list — break Tuesday (last Tuesday all done) and Thursday (last Thursday partly open)");
  ok("Tue before: open (last Tuesday's cards all checked); the pre-K kid's open family card closed it",SCHOOL_KIDS.every(k=>oT[k].store&&oT[k].pm)&&!oT.kid_d.store&&oT.kid_d.storeWhy==="📚 Opens when school work is done");
  ok("Tue after: open",KIDS.every(k=>nT[k].store&&nT[k].pm&&nT[k].storeWhy===""));
  // Thursday comes later; first the rest of Tuesday
  console.log("2 · Mom's 🗓 Schedule ▸ Today, Dad's ▸ All, the helper — break Tuesday");
  ok("before: Mom's Today drew last Tuesday's agenda (Mom, All, each kid)",cnt(oT.mom)>0&&cnt(oT.all)>=18&&KIDS.every(k=>oT[k].agCards>0),[cnt(oT.mom),cnt(oT.all)].concat(KIDS.map(k=>oT[k].agCards)));
  ok("after: no school card on any Today view, one line naming the break",cnt(nT.mom)===0&&cnt(nT.all)===0&&KIDS.every(k=>nT[k].agCards===0&&nT[k].ag.indexOf(LINE("Fall Break"))>0)&&nT.all.indexOf(LINE("Fall Break"))>0&&nT.mom.indexOf(LINE("Fall Break"))>0);
  ok("after: the line is the only thing on All / a kid's view (no 'Nothing scheduled' under it)",nT.all.indexOf("Nothing scheduled")<0&&count(nT.all,"No school today")===1&&nT.mpBody.indexOf(LINE("Fall Break"))>0);
  ok("before: Dad's ▸ All drew the same stale agenda; after: exactly what Mom's All gets (the line, no cards)",cnt(oT.dadAll)===cnt(oT.all)&&cnt(nT.dadAll)===0&&nT.dadAll.indexOf(LINE("Fall Break"))>0&&count(nT.dadAll,"No school today")===1);
  ok("before: the helper's list had last Tuesday's cards; after: none",oT.help.length>0&&nT.help.length===0,[oT.help,nT.help]);
  ok("the Week grid is a week view — not blanked, the same as before",nT.week===oT.week&&cnt(nT.week)===0&&/Week 1/.test(nT.week)&&(nT.week.match(/title="/g)||[]).length>=18,[nT.week.length,oT.week.length]);
  ok("the Week grid says \"This week · Week 1\" and day names only (no dates) — REPORTED",/>This week<\/div><div[^>]*>Week 1</.test(nT.week)&&!/Nov|11\/1/.test(nT.week.replace(/title="[^"]*"/g,"")));
  console.log("3 · the board and the Today's-card tile — break Tuesday");
  ok("before: the 📅 pill counted last Tuesday's cards (e.g. 6/6) and its pop-up listed them",oT.boardPills.slice(0,3).every(p=>/^📅 [1-9]\d*\/[1-9]/.test(p))&&SCHOOL_KIDS.every(k=>/✅|○/.test(oT[k].pop)&&oT[k].pop.indexOf("nothing due today")<0),oT.boardPills);
  ok("after: the pill shows what a day with no school cards shows (0/0), the pop-up \"nothing due today\"",nT.boardPills.every(p=>p==="📅 0/0")&&KIDS.every(k=>nT[k].board.total===0&&nT[k].pop.indexOf("nothing due today")>0),nT.boardPills);
  ok("before: the 🏡 Today's-card tile showed for last Tuesday's family card; after: no tile, no group",oT.dc===1&&oT.dcTile.indexOf("dcOpen()")>0&&nT.dc===0&&nT.dcTile==="");
  console.log("4 · the Mom loop — break Tuesday");
  ok("after: nothing remaining, no banner, nobody at Mom",KIDS.every(k=>nT[k].mlRem.length===0&&nT[k].mlBan==="")&&JSON.parse(nT.mlNow).kid===null);
  console.log("5 · claims, spins, celebrations — break Tuesday (the claim gate is UNCHANGED — the facts, pinned)");
  ok("kid_a: last Tuesday's pool is 5 ⭐, forfeited; the claim gate is open, and since BWCLAIM (test_board_week.js) Kids' Corner offers no 🎰 claim on it — before AND after",
    [oT,nT].every(T=>T.kid_a.dayPts===5&&T.kid_a.claim==="forfeited"&&T.kid_a.claimGate===true&&T.kid_a.claimBtn===false));
  ok("…the other kids have nothing in today's pool and no claim button, before and after",[oT,nT].every(T=>["kid_b","kid_c","kid_d"].every(k=>T[k].dayPts===0&&!T[k].claimBtn)));
  ok("schoolDoneOn / spinClaimGateDone give the same answers before and after",KIDS.every(k=>oT[k].schoolDone===nT[k].schoolDone&&oT[k].claimGate===nT[k].claimGate));
  { const ex='(function(){ sv(WK+"_celeb_used",{}); return famCelebOwnWork("kid_d",_todayDay); })()';   // this device never showed it
    const o=await runWriter(OLD,ex), n=await runWriter(NEW,ex);
    ok("famCelebOwnWork (own work done, celebrating family time open): before it fired and wrote celeb_used; after it does nothing",o.v===true&&o.writes.some(w=>/celeb_used\/kid_d_tuesday_own/.test(w))&&n.v===false&&n.writes.length===0,[o,n]); }
  console.log("6 · after a check-off — break Tuesday");
  ok("rvCanToday: before \"yes, later today\" (a review would land on the break); after no",SCHOOL_KIDS.every(k=>oT[k].rvCan===true&&oT[k].rv&&oT[k].rv.day==="tuesday")&&KIDS.every(k=>nT[k].rvCan===false&&(!nT[k].rv||nT[k].rv.day!=="tuesday"||true)));
  ok("rvPlanDay(\"today\") after: not today — the next school day, as when today is full",KIDS.every(k=>!nT[k].rv||JSON.stringify(nT[k].rv)===JSON.stringify(JSON.parse(NEW.R('JSON.stringify(rvPlanDay("'+k+'",10,"next"))')))));
  { const later=NEW.board().filter(t=>t.who==="kid_c"&&["wednesday","thursday","friday"].indexOf(t.day)>=0&&!NEW.checked()[t.id]&&!/notebook/i.test(t.title||"")&&!String(t.id).endsWith("_c")&&t.subjectKey!=="reading_app").sort((a,b)=>a.id.localeCompare(b.id))[0];
    ok("(set-up) kid_c: last Tuesday all done, a later open card that fell off Tuesday",!!later&&OLD.R('_kcTodayCards===_kcTodayCards')!==undefined,later&&later.id);
    const ex='(function(){ var t=weekData.tasks.find(function(x){ return x.id==="'+(later&&later.id)+'"; }); if(!t) return "none"; t.rolledFrom="tuesday"; var c=efPullNext("kid_c"); return c?c.id+"→"+c.day:null; })()';
    const o=await runWriter(OLD,ex), n=await runWriter(NEW,ex);
    ok("efPullNext: before it pulled that card onto the break day (a targeted WK/tasks update); after it pulls nothing and writes nothing",typeof o.v==="string"&&/→tuesday$/.test(o.v)&&o.writes.some(w=>/^update week1\/tasks /.test(w))&&n.v===null&&n.writes.length===0,[o,n]); }
  console.log("7 · Math Sprints / Editor in Chief — break Tuesday");
  { const add='(function(){ weekData.tasks.push({id:"zz_ms_tue",who:"kid_a",day:"tuesday",time:"11:00 AM",dur:10,subjectKey:"math_sprints",title:"Math Sprints",detail:""},{id:"zz_eic_tue",who:"kid_b",day:"tuesday",time:"11:20 AM",dur:15,subjectKey:"editor_chief",title:"Editor in Chief",detail:""}); })()';
    OLD.R(add); NEW.R(add);
    const om=await runWriter(OLD,'msCheckCard("kid_a")'), nm=await runWriter(NEW,'msCheckCard("kid_a")');
    ok("msCheckCard on a full break week: after no card, no write (before: "+om.v+", "+om.writes.length+" writes)",nm.v===false&&nm.writes.length===0&&!NEW.R('!!checked["zz_ms_tue"]'),[om.v,om.writes.slice(0,4),nm]);
    const oe=await runWriter(OLD,'eicCheckCard("kid_b")'), ne=await runWriter(NEW,'eicCheckCard("kid_b")');
    ok("eicCheckCard on a full break week: after no card, no write (before: "+oe.v+", "+oe.writes.length+" writes)",ne.v===false&&ne.writes.length===0,[oe.v,oe.writes.slice(0,4),ne]); }

  // ── break Thursday ──
  for(const W of [OLD,NEW]){ await W.roll("2026-11-18"); await W.roll("2026-11-19"); await W.at("2026-11-19",10,30); W.R('forfeitSweep();'); await W.flush(2000); }
  const oH=probe(OLD), nH=probe(NEW);
  console.log("break Thursday (last Thursday's cards partly open)");
  ok("1 before: an open stale card kept the after-school store closed (\"📚 Opens when school work is done\") and the afternoon list shut",SCHOOL_KIDS.some(k=>!oH[k].store&&oH[k].storeWhy==="📚 Opens when school work is done"&&!oH[k].pm),SCHOOL_KIDS.map(k=>[oH[k].store,oH[k].pm]));
  ok("1 after: the store is open and the afternoon list open for every kid",KIDS.every(k=>nH[k].store&&nH[k].storeWhy===""&&nH[k].pm));
  ok("2 after: Today shows the line and no cards (Mom, All, kids, Dad)",cnt(nH.mom)+cnt(nH.all)+cnt(nH.dadAll)===0&&KIDS.every(k=>nH[k].agCards===0)&&nH.dadAll.indexOf(LINE("Fall Break"))>0&&cnt(oH.all)>0);
  ok("3 after: 📅 0/0 on the board (before: last Thursday's done/total, some open)",nH.boardPills.every(p=>p==="📅 0/0")&&oH.boardPills.slice(0,3).some(p=>{ const m=/(\d+)\/(\d+)/.exec(p); return m&&+m[1]<+m[2]; }),oH.boardPills);
  ok("5 kid_a: last Thursday's 7 ⭐ are forfeited and NOT claimable — the stale open cards still hold the gate, before and after (unchanged, reported)",[oH,nH].every(T=>T.kid_a.dayPts===7&&T.kid_a.claim==="forfeited"&&T.kid_a.schoolDone===false&&T.kid_a.claimGate===false&&T.kid_a.claimBtn===false));
  ok("5 kid_b: last Thursday's 4 ⭐, the same",[oH,nH].every(T=>T.kid_b.dayPts===4&&T.kid_b.claim==="forfeited"&&!T.kid_b.claimBtn));
  ok("Thursday, all views: balanced tags, no duplicate ids",[nH.mom,nH.all,nH.dadAll,nH.mpBody].concat(KIDS.map(k=>nH[k].kcSchool),KIDS.map(k=>nH[k].pop)).every(h=>tagsBalanced(h)&&dupIds(h).length===0));

  // ── the week after the break builds itself on Sunday: Monday 11/23 is identical to the old code ──
  for(const W of [OLD,NEW]){ for(const iso of ["2026-11-20","2026-11-21","2026-11-22","2026-11-23"]) await W.roll(iso); await W.at("2026-11-23",10,30); }
  ok("the Monday after the break: a new week is on the board",[OLD,NEW].every(W=>W.wk()!=="week1"&&!W.R("!!scheduleBreakToday()")),[OLD.wk(),NEW.wk()]);
  { const a=JSON.stringify(probe(OLD)), b=JSON.stringify(probe(NEW)); ok("the Monday after the break: every probe identical to the old code",a===b,a===b?"":firstDiff(a,b)); }

  // ═══ W2 — a one-day break added on Wednesday after the week was built; the day before and after ═══
  const TYPES=[
    ["one-day holiday (school)",{holidays:{h:{name:"Teacher Day",date:"2026-11-11",pause:"school"}}},LINE("Teacher Day")],
    ["vacation (everything)",{vacations:{v:{name:"Beach Trip",start:"2026-11-11",end:"2026-11-11",pause:"all"}}},LINE("Beach Trip")],
    ["cleaning day",{cleaningDays:{"2026-11-11":{at:1,by:"mom"}}},CLEAN_LINE]
  ];
  for(const [lbl,cal,line] of TYPES){
    console.log("W2 — "+lbl+" added on Wednesday after the week was built");
    const O=await world({name:"before "+lbl,base:true}), N=await world({name:"after "+lbl});
    for(const W of [O,N]){ await W.play("2026-11-09","monday",10*60); await W.roll("2026-11-10"); await W.play("2026-11-10","tuesday",10*60); await W.at("2026-11-10",10,40); }
    { const a=JSON.stringify(probe(O)), b=JSON.stringify(probe(N)); ok(lbl+": the day before (Tue) — every probe identical to the old code",a===b,a===b?"":firstDiff(a,b)); }
    for(const W of [O,N]){ await W.roll("2026-11-11"); await W.play("2026-11-11","wednesday",9*60+40); W.R('addKidPoints("kid_a",3,"wednesday")');
      W.R('(function(c){ for(var key in c){ calendarData[key]=Object.assign({},calendarData[key]||{},c[key]); } })('+JSON.stringify(cal)+')'); await W.at("2026-11-11",10,30); }
    ok(lbl+": Wednesday is a break by the Schedule tab's rule; this week is on the board",N.R("schoolOffToday()")&&O.R("!!scheduleBreakToday()")&&N.wk()==="week1");
    const wm=N.db.log.length; const o=probe(O), n=probe(N);
    ok(lbl+": probing writes nothing",N.db.log.length===wm);
    ok(lbl+" 1: before the store was closed by Wednesday's open cards"+(cal.cleaningDays?" (the afternoon list already opens on a cleaning day)":" and the afternoon list shut")+"; after both open",SCHOOL_KIDS.some(k=>!o[k].store&&(cal.cleaningDays?o[k].pm:!o[k].pm))&&KIDS.every(k=>n[k].store&&n[k].pm));
    ok(lbl+" 2: before Today drew Wednesday's cards; after the line, no cards (Mom, All, kids, Dad), no helper cards",cnt(o.all)>0&&o.help.length>0&&cnt(n.mom)+cnt(n.all)+cnt(n.dadAll)===0&&KIDS.every(k=>n[k].agCards===0&&n[k].ag.indexOf(line)>0)&&n.all.indexOf(line)>0&&n.dadAll.indexOf(line)>0&&n.help.length===0);
    ok(lbl+" 3: board 📅 0/0 (before it counted Wednesday's), the pop-up empty, no Today's-card tile",nT&&n.boardPills.every(p=>p==="📅 0/0")&&o.boardPills.some(p=>p!=="📅 0/0")&&KIDS.every(k=>n[k].pop.indexOf("nothing due today")>0)&&o.dc===1&&n.dc===0&&n.dcTile==="");
    ok(lbl+" 4: before a ready kid had Mom work left and the banner \"Mom’s ready for you\" (also in Kids' Corner above the break line); after none",
      SCHOOL_KIDS.some(k=>o[k].mlRem.length>0)&&SCHOOL_KIDS.some(k=>/Mom&rsquo;s ready for you|You&rsquo;re with Mom/.test(o[k].mlBan)&&o[k].kcSchool.indexOf(o[k].mlBan)>=0)
      &&KIDS.every(k=>n[k].mlRem.length===0&&n[k].mlBan===""&&!/Mom&rsquo;s ready for you|You&rsquo;re with Mom|Not with Mom yet/.test(n[k].kcSchool)),SCHOOL_KIDS.map(k=>[o[k].mlRem.length,o[k].mlBan.length]));
    ok(lbl+" 4: in Kids' Corner nothing sits above the break line but the 🙋 I need Mom button",SCHOOL_KIDS.every(k=>{ const h=n[k].kcSchool, i=h.indexOf(line); return i>0&&h.slice(0,h.lastIndexOf("<div",i)).replace(/<button[^>]*hrAskOpen[^>]*>[^<]*<\/button>/,"").replace(/<[^>]+>/g,"").trim()===""; }),n.kid_b.kcSchool.slice(0,400));
    ok(lbl+" 5: kid_a's 3 ⭐ from this morning stay held by Wednesday's open cards — before and after (unchanged, reported)",[o,n].every(T=>T.kid_a.dayPts===3&&T.kid_a.claimGate===false&&!T.kid_a.claimBtn));
    ok(lbl+" 6: no \"later today\" review after"+(cal.cleaningDays?" (before: yes — the kid-off rule doesn't know cleaning days)":" (before: none already, by the kid-off rule)"),KIDS.every(k=>n[k].rvCan===false&&(!n[k].rv||n[k].rv.day!=="wednesday"))&&(cal.cleaningDays?SCHOOL_KIDS.every(k=>o[k].rvCan===true&&o[k].rv.day==="wednesday"):KIDS.every(k=>o[k].rvCan===false&&JSON.stringify(o[k].rv)===JSON.stringify(n[k].rv))));
    { const ms='(function(){ weekData.tasks.push({id:"zz_ms_wed",who:"kid_c",day:"wednesday",time:"11:00 AM",dur:10,subjectKey:"math_sprints",title:"Math Sprints",detail:""}); return msCheckCard("kid_c"); })()';
      const a=await runWriter(O,ms), b=await runWriter(N,ms);
      ok(lbl+" 7: msCheckCard — before it checked Wednesday's card; after nothing, no write",a.v===true&&a.writes.some(w=>w==="set week1/checked/zz_ms_wed")&&b.v===false&&b.writes.length===0); }
    ok(lbl+": Wednesday's cards are still on the board (nothing removed or moved)",JSON.stringify(O.board().map(t=>t.id+t.day).sort())===JSON.stringify(N.board().map(t=>t.id+t.day).sort())&&N.board().some(t=>t.day==="wednesday"));
    ok(lbl+": balanced tags, no duplicate ids",[n.mom,n.all,n.dadAll,n.mpBody].concat(KIDS.map(k=>n[k].kcSchool)).every(h=>tagsBalanced(h)&&dupIds(h).length===0));
    if(lbl==="one-day holiday (school)"){ ok("the line escapes markup in a break's name",(function(){ N.R('calendarData.holidays.h.name="Fun <b>Day</b>"'); const h=N.R('mpSchAgendaHTML("all",mdTodayName())'); N.R('calendarData.holidays.h.name="Teacher Day"'); return h.indexOf("No school today — Fun &lt;b&gt;Day&lt;/b&gt;")>0&&h.indexOf("<b>Day")<0; })()); }
    if(lbl==="vacation (everything)"){ ok("Mom's Today on a vacation day: only the line (no Mom rows in the fixture)",count(n.mom,"No school today")===1&&n.mom.indexOf("mom-agenda")<0); }
    for(const W of [O,N]){ W.R('weekData.tasks=weekData.tasks.filter(function(t){ return !/^zz_/.test(t.id); })'); await W.roll("2026-11-12"); await W.at("2026-11-12",10,30); }
    { const a=JSON.stringify(probe(O)), b=JSON.stringify(probe(N)); ok(lbl+": the day after (Thu) — every probe identical to the old code, with cards",a===b&&JSON.parse(b).all.indexOf("task-cb")>0,a===b?"":firstDiff(a,b)); }
  }

  // ═══ no break: 300 random weeks, byte-identical ═══
  console.log("no break: every touched function identical to the old code over 300 random weeks");
  { const O=await world({name:"before random",base:true}), N=await world({name:"after random"});
    for(const W of [O,N]){ await W.play("2026-11-09","monday",11*60); await W.roll("2026-11-10"); await W.at("2026-11-10",10,30); W.R(SCENE); }
    const orig=JSON.parse(N.R("JSON.stringify(weekData.tasks)"));
    let seed=20261124; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const DN=["monday","tuesday","wednesday","thursday","friday"];
    const RP=`(function(){ var out={}, sv0={kid:kid,day:day}; try{
      ${JSON.stringify(KIDS)}.forEach(function(k){ out[k]=[storeOpenFor(k),storeClosedReason(k),rtAvailable("afternoon",k,_todayDay),rtAvailable("afternoon",k,"monday"),
        _boardTaskCounts(k,_todayDay),_boardTaskCounts(k,"wednesday"),mlRemaining(k).map(function(t){return t.id;}),mlBannerHTML(k),rvCanToday(k,10),rvPlanDay(k,10,"today"),
        famCelebOwnWork(k,_todayDay),mpSchAgendaHTML(k,mdTodayName()),(function(){ __pop=""; boardStatPop(k,"tasks"); return __pop; })(),kcSchoolHTML(k)]; });
      out.g=[mpSchAgendaHTML("mom",mdTodayName()),mpSchAgendaHTML("all",mdTodayName()),mpSchAgendaHTML("all","thursday"),(function(){ var el={innerHTML:""}; renderDadAll(el); return el.innerHTML; })(),
        helperTasksToday("hx").map(function(t){return t.id;}),dcTodayGroups().map(function(g){ return g.bid+g.key+g.done; }),dcTileHTML(),JSON.stringify(mlNow()),mpSchWeekHTML("all")];
      }finally{ kid=sv0.kid; day=sv0.day; } return JSON.stringify(out); })()`;
    const WR=`(function(){ var r=[]; r.push(efPullNext("kid_a")?"pulled":null); r.push(msCheckCard("kid_b")); r.push(eicCheckCard("kid_c")); return JSON.stringify(r); })()`;
    let diffs=0, first=null, nCards=0, nOpen=0, nWrites=0;
    for(let it=0;it<300;it++){
      const tasks=JSON.parse(JSON.stringify(orig)), ck={};
      tasks.forEach(t=>{ if(rnd()<0.5) t.day=DN[Math.floor(rnd()*5)]; if(rnd()<0.45) ck[t.id]="9:"+String(10+Math.floor(rnd()*40))+" AM"; if(rnd()<0.08) t.rolledFrom=DN[Math.floor(rnd()*5)]; });
      const today=DN[Math.floor(rnd()*5)], mom=rnd()<0.5, mode=["afterSchool","both","always","time"][Math.floor(rnd()*4)];
      const extra=[]; if(rnd()<0.5) extra.push({id:"zz_ms_"+it,who:"kid_b",day:today,time:"11:00 AM",dur:10,subjectKey:"math_sprints",title:"Math Sprints",detail:""});
      if(rnd()<0.5) extra.push({id:"zz_eic_"+it,who:"kid_c",day:today,time:"11:20 AM",dur:15,subjectKey:"editor_chief",title:"Editor in Chief",detail:""});
      const set='weekData.tasks='+JSON.stringify(tasks.concat(extra))+'; checked='+JSON.stringify(ck)+'; claimed={}; histState={}; _todayDay="'+today+'"; day="'+today+'"; '+(mom?'haMomOn();':'haMomOff();')+' tab="kids"; storeCfg.mode="'+mode+'"; '+SCENE.replace('haMomOff(); tab="kids";','');
      O.R(set); N.R(set);
      const a=O.R(RP), b=N.R(RP);
      if(a!==b){ diffs++; if(!first) first={it,d:firstDiff(a,b)}; }
      const ma=O.db.log.length, mb=N.db.log.length;
      const wa=O.R(WR), wb=N.R(WR);
      const la=O.db.log.slice(ma).map(l=>l.op+" "+l.path+(l.keys?" "+l.keys.join(","):"")).join("|"), lb=N.db.log.slice(mb).map(l=>l.op+" "+l.path+(l.keys?" "+l.keys.join(","):"")).join("|");
      if(wa!==wb||la!==lb){ diffs++; if(!first) first={it,w:[wa,wb,la.slice(0,200),lb.slice(0,200)]}; }
      nWrites+=N.db.log.length-mb;
      const v=JSON.parse(b); nCards+=(v.g[1].match(/task-cb/g)||[]).length;
    }
    ok("300 weeks: store, afternoon, board, pop-up, loop, banner, review, own-work show, Today (Mom/All/kids/Dad), helper, tile, Week grid, Kids' Corner — identical",diffs===0,first);
    ok("…and the writers (efPullNext, msCheckCard, eicCheckCard) returned the same and wrote the same paths",diffs===0);
    ok("…the weeks really had cards, and the writers really wrote",nCards>2000&&nWrites>50,[nCards,nWrites]);
  }

  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed  ("+Math.round((Date.now()-T0)/1000)+" s)");
  if(fail) process.exit(1);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
function cnt(h){ return (String(h).match(/class="task-cb/g)||[]).length; }
function firstDiff(a,b){ let i=0; while(i<a.length&&a[i]===b[i]) i++; return {at:i,a:a.slice(Math.max(0,i-120),i+160),b:b.slice(Math.max(0,i-120),i+160)}; }
