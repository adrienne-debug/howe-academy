/*
 * 📅 BWNOWEEK — break week slice 1: "is the board this week?" folded into schoolOffToday(), plus the four Rule A items
 * (DESIGN_break_week_2026-11-24 §3 Option 4 Rule A, §5 row 1; her "Yes, build it" 2026-11-24, answer 1 for the words).
 *
 * The live case: a week the plan does not cover with NO calendar break (every week after the plan ends — world g) has no
 * guard at all: Kids' Corner, Mom's Today, Dad's Day and the board showed last week's same-day cards as today's. On a break
 * week the weekend days (the Sunday it starts, the Saturday it ends) are not calendar break days, so the same. And on any
 * such day the ⭐ card showed last week's star pool as today's, a check-off could fire the day celebration and the day-bonus
 * spin, the morning list wrote a day start into last week's record, and the 8 PM sweep ran on last week and wrote its marker.
 *
 * The change: schoolOffToday() is also true when boardWeekIsThisWeek() is false, so every BRKTODAY guard and Kids' Corner
 * (now asking schoolOffToday()) follow; the "No school today" line says "No school week planned" when no break is behind
 * it; and, TODAY only, when the board's week is not this week: no star pool line, no celebrateDayComplete, no day-bonus spin,
 * no dsAutoStart write, mlEveningSweep does nothing (no move, no marker). Zero new writes anywhere.
 *
 * Proved here — the WHOLE app runs in the vm sandbox of test_demo_week.js on the synthetic demo family, twice: the code with
 * every BWNOWEEK change stripped (= the branch before this slice) and the code as it is:
 *   1. World g (the plan ends after week 1): Mon, Tue, Sat, Sun of the week after — Kids' Corner, Mom's Today (Mom, All,
 *      each kid), Dad's Day, the board's 📅 pills show no school card and the line; before, last week's cards. No pool line;
 *      celebrateDayComplete, the day-bonus spin, dsAutoStart and mlEveningSweep (8 PM and Mom's ⏩) write nothing — before,
 *      each wrote into last week's record.
 *   2. Break weekends (world a2: the Sunday the break starts, the Saturday it ends): the same.
 *   3. Worlds a2, b, c1 (both weeks), d1 (both weeks), e2, Mon–Fri of the break: every surface BRKTODAY already guards is
 *      byte-identical to the code before (equality, not an assertion of looks); the four items as above.
 *   4. A holiday inside a real week (d1's first Wednesday; a one-day holiday added on a Tuesday after its week was built, its
 *      cards still laid): the four items exactly as before (pool, celebration,
 *      day bonus, day start, sweep all as BRKTODAY left them) — and which of them BRKTODAY covers is printed.
 *   5. 300 random normal weeks (two children, mixed checked / unchecked, pools, Mom here and not, every weekday incl.
 *      Saturday, the evening too): every touched function's output and writes byte-identical to the code before.
 *   6. Nothing under week*, pointClaims or bank is written by the slice on any stale day, in any world.
 * No kid or family names: the fixture is synthetic.   run: node test_break_week_1.js
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
const addDays=(iso,n)=>{ const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dnOf=iso=>DN[new Date(iso+"T12:00:00").getDay()];
const BW='typeof boardWeekIsThisWeek==="function"&&!boardWeekIsThisWeek()';

// ── every change, [where, old, new]; stripping puts old back (= the code before this slice) ──
const CHANGES=[
  ["schoolOffToday","function schoolOffToday(){ try{ return !!scheduleBreakToday(); }catch(e){ return false; } }\n",
   "// 📅 BWNOWEEK (slice 1 of DESIGN_break_week_2026-11-24, 2026-11-24): …and also a day whose week the board doesn't hold — a week the plan\n"
   +"//   doesn't cover with no calendar break (every week after the plan ends), the weekend days of a break — boardWeekIsThisWeek().\n"
   +"function schoolOffToday(){ try{ return !!scheduleBreakToday()||("+BW+"); }catch(e){ return false; } }\n"],
  ["the line","  let b=null; try{ b=scheduleBreakToday(); }catch(e){ b=null; } if(!b) return \"\";\n",
   "  let b=null; try{ b=scheduleBreakToday(); }catch(e){ b=null; } if(!b&&"+BW+") b={type:\"noweek\"};   // 📅 BWNOWEEK: no break behind it (the line below draws her answer 1's words)\n  if(!b) return \"\";\n"],
  ["Kids' Corner cards","    if(typeof scheduleBreakToday===\"function\"&&scheduleBreakToday()) return [];   // 🏖 KC_BREAK (her report 2026-11-24:",
   "    if(typeof schoolOffToday===\"function\"&&schoolOffToday()) return [];   // 🏖 KC_BREAK → 📅 BWNOWEEK: asks schoolOffToday() (a break day, or a week the board doesn't hold) (her report 2026-11-24:"],
  ["Kids' Corner line","      let _brk=null; try{ _brk=(typeof scheduleBreakToday===\"function\")?scheduleBreakToday():null; }catch(e){}   // 🏖 KC_BREAK: a break day names the break\n",
   "      let _brk=null; try{ _brk=(typeof scheduleBreakToday===\"function\")?scheduleBreakToday():null; }catch(e){}   // 🏖 KC_BREAK: a break day names the break\n"
   +"      if(!_brk&&"+BW+") _brk={type:\"noweek\"};   // 📅 BWNOWEEK: no break behind it (the line below draws her answer 1's words)\n"],
  ["the line's words","  return '<div style=\"padding:22px 14px;text-align:center;font-size:15px;font-weight:700;color:var(--muted)\">'+(b.type===\"cleaning\"?'No school today \\u2014 it\\u2019s cleaning day \\u{1F9FD}':'No school today \\u2014 '+esc(b.name)+' \\u{1F389}')+'</div>';\n","  return '<div style=\"padding:22px 14px;text-align:center;font-size:15px;font-weight:700;color:var(--muted)\">'+(b.type===\"noweek\"?'No school week planned \\u{1F389}':b.type===\"cleaning\"?'No school today \\u2014 it\\u2019s cleaning day \\u{1F9FD}':'No school today \\u2014 '+esc(b.name)+' \\u{1F389}')+'</div>';   // 📅 BWNOWEEK: no break behind it — her answer 1's words alone\n"],
  ["Kids' Corner line's words","      h+='<div style=\"padding:22px 14px;text-align:center;font-size:15px;font-weight:700;color:var(--muted)\">'+(_brk?(_brk.type===\"cleaning\"?'No school today \\u2014 it\\u2019s cleaning day \\u{1F9FD}':'No school today \\u2014 '+esc(_brk.name)+' \\u{1F389}'):'No school cards today \\u{1F389}')+'</div>';\n","      h+='<div style=\"padding:22px 14px;text-align:center;font-size:15px;font-weight:700;color:var(--muted)\">'+(_brk?(_brk.type===\"noweek\"?'No school week planned \\u{1F389}':_brk.type===\"cleaning\"?'No school today \\u2014 it\\u2019s cleaning day \\u{1F9FD}':'No school today \\u2014 '+esc(_brk.name)+' \\u{1F389}'):'No school cards today \\u{1F389}')+'</div>';   // 📅 BWNOWEEK: no break behind it — her answer 1's words alone\n"],
  ["pool line","    const spun=(typeof getKidDayPoints===\"function\")?getKidDayPoints(k,dn):0;\n",
   "    const spun=(typeof getKidDayPoints===\"function\"&&!("+BW+"))?getKidDayPoints(k,dn):0;   // 📅 BWNOWEEK: no star pool for today from last school week\n"],
  ["celebration","function celebrateDayComplete(kid,d0){\n  const d=d0||day;\n  if(hasCelebrated(kid,d)) return;\n",
   "function celebrateDayComplete(kid,d0){\n  const d=d0||day;\n  if(hasCelebrated(kid,d)) return;\n  if(d===_todayDay&&"+BW+") return;   // 📅 BWNOWEEK: no day celebration today on last school week's cards (and no celeb_used write)\n"],
  ["day bonus","  const dayBonusClaimed=hasDayBonus(t.who, taskDay);\n",
   "  const dayBonusClaimed=hasDayBonus(t.who, taskDay)||(taskDay===_todayDay&&"+BW+");   // 📅 BWNOWEEK: no day-bonus spin today on last school week's cards\n"],
  ["day start","function dsAutoStart(kid){\n  try{\n    if(dsFor(kid)) return;\n",
   "function dsAutoStart(kid){\n  try{\n    if("+BW+") return;   // 📅 BWNOWEEK: no day start on a week the board doesn't hold (it would land in last school week's record)\n    if(dsFor(kid)) return;\n"],
  ["sweep","    if(typeof fbTasksLoaded!==\"undefined\"&&!fbTasksLoaded) return false;\n    const marker=(eveningSweeps||{})[_todayDay];\n",
   "    if(typeof fbTasksLoaded!==\"undefined\"&&!fbTasksLoaded) return false;\n    if("+BW+") return false;   // 📅 BWNOWEEK: the sweep rests on last school week — nothing moved, no marker written\n    const marker=(eveningSweeps||{})[_todayDay];\n"],
];
function strip(src){
  for(let i=CHANGES.length-1;i>=0;i--){ const [,o,n]=CHANGES[i]; if(count(src,n)!==1) throw new Error("change "+i+" ("+CHANGES[i][0]+") not found once"); src=src.split(n).join(o); }
  return src;
}
console.log("the change is where it should be");
ok("every BWNOWEEK change is in index.html exactly once ("+CHANGES.length+")",CHANGES.every(c=>count(SRC,c[2])===1),CHANGES.filter(c=>count(SRC,c[2])!==1).map(c=>c[0]));
const BASE=strip(SRC);
ok("stripped: no BWNOWEEK left, every old line back once, the file shorter",BASE.indexOf("BWNOWEEK")<0&&CHANGES.every(c=>count(BASE,c[1])===1)&&BASE.length<SRC.length);
ok("stripped: the helper and the claim fix (slice 0) are still there — this slice is all that's taken out",count(BASE,"function boardWeekIsThisWeek(")===1&&count(BASE,"BWCLAIM")===2);
const C=nm=>CHANGES.find(c=>c[0]===nm);
ok("ONE question: every change asks boardWeekIsThisWeek() (or schoolOffToday(), which asks it) — no second way to decide (the two words lines only draw a type the asking lines set)",CHANGES.filter(c=>!/words$/.test(c[0])).every(c=>c[2].indexOf("boardWeekIsThisWeek()")>0||c[2].indexOf("schoolOffToday()")>0));
{ const added=CHANGES.map(c=>c[2].split("\n").filter(l=>c[1].indexOf(l)<0).join("\n")).join("\n").replace(/\/\/[^\n]*|\/\*[^*]*\*\//g,"");
  ok("the changes write nothing (no db, storage, timer, set/update/remove, sv)",!/\bdb\b|HA_LS|localStorage|\bsv\(|setTimeout|\.set\(|\.update\(|\.remove\(|obSet|obInc/.test(added),added.match(/\bdb\b|\.set\(|\.update\(/)); }
ok("today only: the celebration and the day bonus ask about _todayDay; the day start and the sweep only ever touch today",/d===_todayDay&&typeof boardWeekIsThisWeek/.test(C("celebration")[2])&&/taskDay===_todayDay&&typeof boardWeekIsThisWeek/.test(C("day bonus")[2]));
ok("the sweep's guard sits ahead of its marker check and its lock (it stops — it never moves anything else)",SRC.indexOf(C("sweep")[2])>SRC.indexOf("function mlEveningSweep(force){")&&SRC.indexOf(C("sweep")[2])<SRC.indexOf("haClaimSchedLock(\"cascade\"",SRC.indexOf("function mlEveningSweep(force){")));
ok("the words: her answer's \"No school week planned 🎉\" alone, in the line and in Kids' Corner — nothing else invented",count(SRC,"'No school week planned \\u{1F389}'")===2&&count(SRC,"No school week planned")===2&&count(SRC,'{type:"noweek"}')===2&&SRC.indexOf("No school today \\u2014 No school week")<0);
const BASE_PATH=path.join(os.tmpdir(),"break_week_1_base_"+process.pid+".html");
fs.writeFileSync(BASE_PATH,BASE);

// ── plan surgery on the fixture copy (the design's sandbox worlds) ──
function gap(db,fromWk,weeks,relabel){
  const c=db.curriculum;
  for(const kid of Object.keys(c.weekDays)){ const wd=c.weekDays[kid], out={};
    for(const lbl of Object.keys(wd)){ const n=+lbl.replace(/\D/g,"");
      if(n>=fromWk){ wd[lbl].forEach(dn=>{ const l=c.lessons[kid][dn]; if(l&&l.date) l.date=addDays(l.date,7*weeks); if(relabel&&l) l.week="Wk "+(n+weeks); }); out[relabel?"Wk "+(n+weeks):lbl]=wd[lbl]; }
      else out[lbl]=wd[lbl]; }
    c.weekDays[kid]=out; }
}
const endPlan=db=>{ const c=db.curriculum; for(const k of Object.keys(c.weekDays)) for(const l of Object.keys(c.weekDays[k])) if(l!=="Wk 1"){ c.weekDays[k][l].forEach(dn=>delete c.lessons[k][dn]); delete c.weekDays[k][l]; } };
const HOL=(s,e)=>({holidays:{h1:{name:"Fall Break",start:s,end:e,pause:"school"}}});
const VAC=(s,e)=>({vacations:{v1:{name:"Trip",start:s,end:e,pause:"all"}}});

// ── a world: the demo family, week 1 (Mon Nov 9 … Fri Nov 13) built on Sunday and played; pools on every weekday ──
const KIDS=["kid_a","kid_b","kid_c","kid_d"];
async function world(o){
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const d=JSON.parse(JSON.stringify(FX.db)); Object.assign(d.calendar,JSON.parse(JSON.stringify(o.cal||{}))); if(o.plan) o.plan(d);
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
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; A.fn("dayRollCheck")(); await flush(200000); };
  W.at=async(iso,h,m)=>{ clock.now=hm(iso,h,m); await flush(2000); };
  W.R('__HARNESS_NO_RENDER=true; tab="kids"; var __celebs=0; _showCelebration=function(){ __celebs++; }; gwShowToast=function(){};');
  return W;
}
const playWeek=async(W,mon,lateFrom)=>{ for(let i=0;i<5;i++){ const iso=addDays(mon,i), dn=dnOf(iso); if(i) await W.roll(iso); await W.play(iso,dn,i>=lateFrom?9*60+40:24*60);
  W.R('addKidPoints("kid_a",'+(3+i)+',"'+dn+'"); addKidPoints("kid_b",2,"'+dn+'")'); await W.flush(2000); } };
// the scene a probe reads: kid mode, three kids' morning lists done (so the board's 📅 pill counts), a store open after school
const SCENE=`(function(){ haMomOff(); tab="kids"; day=_todayDay;
  ["kid_a","kid_b","kid_c"].forEach(function(k){ slState[activeWk()+"_"+_todayDay+"_"+k+"_morning"]={done:true}; });
  storeCfg=Object.assign({},storeCfg||{},{open:true,mode:"afterSchool",hour:16,closedFor:{}}); _bwkMemo=null; })()`;
// every surface BRKTODAY / KC_BREAK guard — the "school today" screens
const PS=`(function(){ var out={}, sv0={kid:kid,day:day}; try{
  ${JSON.stringify(KIDS)}.forEach(function(k){ var o=out[k]={};
    o.kc=_kcTodayCards(k).map(function(t){ return t.id; }); o.kcSchool=kcSchoolHTML(k);
    o.ag=mpSchAgendaHTML(k,mdTodayName()); o.board=_boardTaskCounts(k,_todayDay);
    o.store=storeOpenFor(k); o.pm=rtAvailable("afternoon",k,_todayDay); o.ml=mlRemaining(k).map(function(t){ return t.id; });
  });
  out.mom=mpSchAgendaHTML("mom",mdTodayName()); out.all=mpSchAgendaHTML("all",mdTodayName());
  out.dad=(function(){ var el={innerHTML:""}; renderDadAll(el); return el.innerHTML; })();
  out.pills=(function(){ var el={innerHTML:""}; renderMomBoard(el); return el.innerHTML.match(/\u{1F4C5} [^<]*/gu)||[]; })();
  out.off=schoolOffToday(); out.line=brkTodayLineHTML(); out.dc=dcTodayGroups().length;
  }finally{ kid=sv0.kid; day=sv0.day; } return JSON.stringify(out); })()`;
// the four Rule A items (+ the ⭐ card): pool line, celebration, day bonus, day start, sweep — what each shows and writes
const POOL=`(function(){ var o={}; ["kid_a","kid_b"].forEach(function(k){ var h=kcPointsHTML(k); o[k]={pool:h.indexOf("\\u{1F3B0} Spins")>=0,html:h}; }); return JSON.stringify(o); })()`;
const WCELEB='(function(){ sv(WK+"_celeb_used",{}); __celebs=0; celebrateDayComplete("kid_a",_todayDay); return __celebs; })()';
// a check-off of kid_a's last card today: hasSpun true (so no ordinary spin muddies it) and no SPINONCE record — only the day bonus could spin
const WBONUS='(function(){ sv(WK+"_day_bonus_used",{}); var ts=weekData.tasks.filter(function(x){ return x.who==="kid_a"&&effectiveDay(x)===_todayDay&&!/lunch/i.test(x.title||""); }); if(!ts.length) return "none";'
  +' ts.forEach(function(x){ checked[x.id]=checked[x.id]||"9:00 AM"; }); var h1=hasSpun, h2=spinOnceHas; hasSpun=function(){ return true; }; spinOnceHas=function(){ return false; };'
  +' try{ showPaceToast(ts[0].id); } finally{ hasSpun=h1; spinOnceHas=h2; } return hasDayBonus("kid_a",_todayDay)?"bonus":"no bonus"; })()';
const WDS='(function(){ dayStarts[_todayDay]={}; dsAutoStart("kid_a"); return JSON.stringify(dayStarts[_todayDay]); })()';
const WSWEEP=f=>'(function(){ eveningSweeps={}; return mlEveningSweep('+f+'); })()';
async function runWriter(W,expr){ const m=W.db.log.length; const v=W.R(expr); await W.flush(5000); return {v:v,writes:W.db.log.slice(m).map(l=>l.op+" "+l.path+(l.keys?" "+l.keys.join(","):""))}; }
const BAD=/(^|\s|,)(week[^/ ]*\/|pointClaims\/|bank\/)/;
const tagsBalanced=h=>["div","span","button"].every(t=>count(h,"<"+t+">")+count(h,"<"+t+" ")===count(h,"</"+t+">"));
const cnt=h=>(String(h).match(/class="task-cb/g)||[]).length;
const firstDiff=(a,b)=>{ let i=0; while(i<a.length&&a[i]===b[i]) i++; return {at:i,a:a.slice(Math.max(0,i-120),i+160),b:b.slice(Math.max(0,i-120),i+160)}; };
const NOWEEK='>No school week planned \u{1F389}</div>';
let staleWrites=[];

// the four items on a stale day, before vs after → [{item, before, after}]
async function fourItems(OLD,NEW,iso,lbl){
  for(const W of [OLD,NEW]) W.R(SCENE);
  const op=JSON.parse(OLD.R(POOL)), np=JSON.parse(NEW.R(POOL));
  const r={};
  r.celeb=[await runWriter(OLD,WCELEB),await runWriter(NEW,WCELEB)];
  r.bonus=[await runWriter(OLD,WBONUS),await runWriter(NEW,WBONUS)];
  r.ds=[await runWriter(OLD,WDS),await runWriter(NEW,WDS)];
  for(const W of [OLD,NEW]) await W.at(iso,20,5);
  r.sweep=[await runWriter(OLD,'haMomOn(); '+WSWEEP(false)),await runWriter(NEW,'haMomOn(); '+WSWEEP(false))];
  r.push=[await runWriter(OLD,WSWEEP(true)),await runWriter(NEW,WSWEEP(true))];
  for(const W of [OLD,NEW]) W.R("haMomOff();");
  staleWrites=staleWrites.concat(...["celeb","bonus","ds","sweep","push"].map(k=>r[k][1].writes));
  return {op,np,r};
}
function checkFour(lbl,F,wk,dn,withPool){
  const {op,np,r}=F;
  if(withPool) ok(lbl+": before, the ⭐ card showed last "+dn+"'s 🎰 pool as today's; after, no pool line (both children)",op.kid_a.pool&&op.kid_b.pool&&!np.kid_a.pool&&!np.kid_b.pool,[op.kid_a.pool,np.kid_a.pool]);
  else ok(lbl+": no pool line after (both children)",!np.kid_a.pool&&!np.kid_b.pool);
  ok(lbl+": celebrateDayComplete — before it celebrated and wrote "+wk+"/celeb_used; after nothing, no write",r.celeb[0].v===1&&r.celeb[0].writes.some(w=>w.indexOf(wk+"/celeb_used")>=0)&&r.celeb[1].v===0&&r.celeb[1].writes.length===0,r.celeb);
  if(r.bonus[0].v==="bonus") ok(lbl+": the day-bonus spin — before it spun (wrote "+wk+"/day_bonus_used); after no bonus, no write",r.bonus[0].writes.some(w=>w.indexOf(wk+"/day_bonus_used/kid_a_"+dn)>=0)&&r.bonus[1].v==="no bonus"&&r.bonus[1].writes.length===0,r.bonus);
  else ok(lbl+": the day-bonus spin — no school card today to finish (before: "+r.bonus[0].v+"); after no bonus, no write",r.bonus[0].writes.length===0&&r.bonus[1].v!=="bonus"&&r.bonus[1].writes.length===0,r.bonus);
  ok(lbl+": dsAutoStart — before it wrote "+wk+"/dayStart/"+dn+"/kid_a; after no day start, no write",r.ds[0].writes.some(w=>w==="set "+wk+"/dayStart/"+dn+"/kid_a")&&r.ds[1].v==="{}"&&r.ds[1].writes.length===0,r.ds);
  ok(lbl+": the 8 PM sweep — before it ran on "+wk+" and wrote its marker; after it does nothing (no move, no marker)",r.sweep[0].v===true&&r.sweep[0].writes.some(w=>w==="set "+wk+"/eveningSweep/"+dn)&&r.sweep[1].v===false&&r.sweep[1].writes.length===0,r.sweep);
  ok(lbl+": Mom's ⏩ push — after it does nothing either (before: "+(r.push[0].v?"ran":"didn't run")+")",r.push[1].v===false&&r.push[1].writes.length===0,r.push);
}

(async function(){
  // ═══ 1. world g — the plan ends after week 1, no calendar break ═══
  console.log("1 · world g: the plan ends after week 1, no calendar break");
  { const OLD=await world({name:"g before",base:true,plan:endPlan}), NEW=await world({name:"g after",plan:endPlan});
    for(const W of [OLD,NEW]) await playWeek(W,"2026-11-09",5);
    for(const [iso,h] of [["2026-11-16",10],["2026-11-17",10],["2026-11-21",11],["2026-11-22",11]]){
      const dn=dnOf(iso), lbl="g · "+dn.slice(0,3)+" "+iso.slice(5);
      for(const W of [OLD,NEW]){ await W.roll(iso); await W.at(iso,h,0); W.R(SCENE); }
      ok(lbl+": (set-up) no calendar break, week 1 still on the board, the board's week is not this week",[OLD,NEW].every(W=>!W.R("!!scheduleBreakToday()")&&W.wk()==="week1"&&W.R("boardWeekIsThisWeek()")===false));
      const m=NEW.db.log.length; const o=JSON.parse(OLD.R(PS)), n=JSON.parse(NEW.R(PS)); staleWrites=staleWrites.concat(NEW.db.log.slice(m).map(l=>l.op+" "+l.path));
      const weekday=dn!=="saturday"&&dn!=="sunday";
      if(weekday){
        ok(lbl+": before, Kids' Corner listed last "+dn+"'s cards as today's, Mom's Today and Dad's Day drew them, the board counted them",KIDS.slice(0,3).every(k=>o[k].kc.length>0)&&cnt(o.all)>0&&cnt(o.dad)>0&&o.pills.some(p=>p!=="\u{1F4C5} 0/0"),[KIDS.map(k=>o[k].kc.length),cnt(o.all),o.pills]);
      }
      ok(lbl+": after, Kids' Corner has no cards and says \"No school today — No school week planned\"",KIDS.every(k=>n[k].kc.length===0&&n[k].kcSchool.indexOf(NOWEEK)>0),KIDS.map(k=>n[k].kcSchool.slice(0,300)));
      ok(lbl+": after, Mom's Today (Mom, All, each kid) — no school card, the line once",cnt(n.mom)+cnt(n.all)===0&&KIDS.every(k=>cnt(n[k].ag)===0&&n[k].ag.indexOf(NOWEEK)>0)&&n.all.indexOf(NOWEEK)>0&&count(n.all,"No school week planned")===1&&count(n.all,"No school today")===0&&n.mom.indexOf(NOWEEK)>0);
      ok(lbl+": after, Dad's Day — the same (Dad gets what Mom gets)",cnt(n.dad)===0&&n.dad.indexOf(NOWEEK)>0&&count(n.dad,"No school week planned")===1&&count(n.dad,"No school today")===0);
      ok(lbl+": after, the board's 📅 pills read 0/0, nothing left for the Mom loop, no Today's-card group",n.pills.length>0&&n.pills.every(p=>p==="\u{1F4C5} 0/0")&&KIDS.every(k=>n[k].board.total===0&&n[k].ml.length===0)&&n.dc===0,n.pills);
      ok(lbl+": after, schoolOffToday() is true and the line names no break: \"No school week planned\"",n.off===true&&n.line.indexOf(NOWEEK)>0&&o.off===false&&o.line==="");
      ok(lbl+": all views balanced",[n.mom,n.all,n.dad].concat(KIDS.map(k=>n[k].kcSchool)).every(tagsBalanced));
      const F=await fourItems(OLD,NEW,iso,lbl);
      checkFour(lbl,F,"week1",dn,weekday);
      for(const W of [OLD,NEW]) await W.at(iso,21,0);
    }
  }

  // ═══ 2–3. break worlds: weekend days (the four items + the surfaces), Mon–Fri (surfaces equal to before) ═══
  const BREAKS=[
    {k:"a2",lbl:"a2 · full-week holiday, its number skipped",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),days:["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20"],weekend:["2026-11-15","2026-11-21"],wk:"week1"},
    {k:"b",lbl:"b · full-week holiday over an all-off plan week",cal:HOL("2026-11-16","2026-11-20"),days:["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20"],wk:"week1"},
    {k:"c1",lbl:"c1 · two-week holiday",cal:HOL("2026-11-16","2026-11-27"),plan:d=>gap(d,2,2,true),days:["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-23","2026-11-24","2026-11-25","2026-11-26","2026-11-27"],wk:"week1"},
    {k:"d1",lbl:"d1 · holiday Wed – the next Fri",cal:HOL("2026-11-18","2026-11-27"),days:["2026-11-18","2026-11-19","2026-11-20","2026-11-23","2026-11-24","2026-11-25","2026-11-26","2026-11-27"],wk:"week2",inside:"2026-11-18"},
    {k:"e2",lbl:"e2 · pause-everything vacation over a plan week",cal:VAC("2026-11-16","2026-11-20"),days:["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20"],wk:"week1"},
  ];
  for(const D of BREAKS){
    console.log("2/3 · "+D.lbl);
    const OLD=await world({name:D.k+" before",base:true,cal:D.cal,plan:D.plan}), NEW=await world({name:D.k+" after",cal:D.cal,plan:D.plan});
    for(const W of [OLD,NEW]){ await playWeek(W,"2026-11-09",3); if(D.k==="d1"){ await W.roll("2026-11-14"); await W.roll("2026-11-15"); await W.roll("2026-11-16"); await W.play("2026-11-16","monday",24*60); await W.roll("2026-11-17"); await W.play("2026-11-17","tuesday",24*60); W.R('addKidPoints("kid_a",4,"tuesday"); addKidPoints("kid_b",2,"tuesday")'); await W.flush(2000); } }
    let diffs=[], staleDays=0, checked=0;
    const allDays=D.days.concat(D.weekend||[]).sort();
    for(const iso of allDays){
      for(const W of [OLD,NEW]){ await W.roll(iso); await W.at(iso,10,30); W.R(SCENE); }
      const weekend=(D.weekend||[]).indexOf(iso)>=0, stale=NEW.R("boardWeekIsThisWeek()")===false;
      if(stale) staleDays++;
      const m=NEW.db.log.length; const a=OLD.R(PS), b=NEW.R(PS); if(stale) staleWrites=staleWrites.concat(NEW.db.log.slice(m).map(l=>l.op+" "+l.path));
      if(weekend){
        const o=JSON.parse(a), n=JSON.parse(b), dn=dnOf(iso), lbl=D.k+" · break "+(dn==="sunday"?"Sunday (it starts)":"Saturday (it ends)")+" "+iso.slice(5);
        ok(lbl+": not a calendar break day; the board's week is not this week",!NEW.R("!!scheduleBreakToday()")&&stale);
        ok(lbl+": before, schoolOffToday() was false; after true, and every Today view, Kids' Corner and Dad say \"No school week planned\" with no cards",o.off===false&&n.off===true&&KIDS.every(k=>n[k].kc.length===0&&n[k].kcSchool.indexOf(NOWEEK)>0&&cnt(n[k].ag)===0)&&n.all.indexOf(NOWEEK)>0&&n.dad.indexOf(NOWEEK)>0&&cnt(n.dad)===0);
        if(dn==="saturday"){ const F=await fourItems(OLD,NEW,iso,lbl); checkFour(lbl,F,D.wk,dn,false); for(const W of [OLD,NEW]) await W.at(iso,21,0); }
        else { const F=await fourItems(OLD,NEW,iso,lbl);
          ok(lbl+": no pool line; celebration, day bonus, day start, sweep and ⏩ write nothing",!F.np.kid_a.pool&&["celeb","bonus","ds","sweep","push"].every(k=>F.r[k][1].writes.length===0)&&F.r.celeb[1].v===0&&F.r.sweep[1].v===false,F.r);
          for(const W of [OLD,NEW]) await W.at(iso,21,0); }
        continue;
      }
      checked++;
      if(a!==b) diffs.push({iso,d:firstDiff(a,b)});
      if(D.inside===iso){
        // a one-day-style break INSIDE a real week: the board's week is this week → the four items exactly as before
        ok(D.k+" · Wed "+iso.slice(5)+" is a holiday inside a real week (week2 built Sunday): the board's week is this week",NEW.R("boardWeekIsThisWeek()")===true&&NEW.R("!!scheduleBreakToday()")&&NEW.wk()==="week2");
        for(const W of [OLD,NEW]) W.R('addKidPoints("kid_a",3,"wednesday"); addKidPoints("kid_b",1,"wednesday")');
        const op=OLD.R(POOL), np=NEW.R(POOL);
        const c=[await runWriter(OLD,WCELEB),await runWriter(NEW,WCELEB)], bo=[await runWriter(OLD,WBONUS),await runWriter(NEW,WBONUS)], ds=[await runWriter(OLD,WDS),await runWriter(NEW,WDS)];
        for(const W of [OLD,NEW]) await W.at(iso,20,5);
        const sw=[await runWriter(OLD,'haMomOn(); '+WSWEEP(false)),await runWriter(NEW,'haMomOn(); '+WSWEEP(false))];
        const same=p=>p[0].v===p[1].v&&JSON.stringify(p[0].writes)===JSON.stringify(p[1].writes);
        ok("holiday inside a real week: the ⭐ card (pool line "+(JSON.parse(np).kid_a.pool?"shown":"none")+") identical to before",op===np);
        ok("holiday inside a real week: celebrateDayComplete identical to before ("+c[1].v+" celebration, "+c[1].writes.length+" write) — BRKTODAY does not guard it",same(c),c);
        ok("holiday inside a real week: the day bonus identical to before ("+bo[1].v+", "+bo[1].writes.length+" writes) — BRKTODAY does not guard it",same(bo),bo);
        ok("holiday inside a real week: dsAutoStart identical to before ("+ds[1].writes.length+" write) — BRKTODAY does not guard it",same(ds),ds);
        ok("holiday inside a real week: the 8 PM sweep identical to before (ran: "+sw[1].v+", marker written: "+sw[1].writes.some(w=>/eveningSweep/.test(w))+") — BRKTODAY does not guard it",same(sw),sw);
        for(const W of [OLD,NEW]){ W.R("haMomOff();"); await W.at(iso,21,0); }
      }
    }
    ok(D.lbl+": Mon–Fri of the break ("+checked+" days) — Kids' Corner, Mom's Today, Dad's Day, the board, the store, the afternoon list, the Mom loop: byte-identical to the code before (BRKTODAY already covers them)",checked>0&&diffs.length===0,diffs[0]);
    ok(D.lbl+": stale days seen: "+staleDays,staleDays>=(D.k==="d1"?5:D.days.length));
  }
  // the four items on a break weekday (a2, Tuesday): same as world g
  { const cal=HOL("2026-11-16","2026-11-20"), plan=d=>gap(d,2,1,true);
    const OLD=await world({name:"a2 tue before",base:true,cal,plan}), NEW=await world({name:"a2 tue after",cal,plan});
    for(const W of [OLD,NEW]){ await playWeek(W,"2026-11-09",5); for(const iso of ["2026-11-14","2026-11-15","2026-11-16","2026-11-17"]) await W.roll(iso); await W.at("2026-11-17",10,30); }
    const F=await fourItems(OLD,NEW,"2026-11-17","a2 · break Tuesday");
    checkFour("a2 · break Tuesday",F,"week1","tuesday",true);
  }

  // ═══ 5. 300 random normal weeks ═══
  console.log("5 · no gap: every touched function identical to the code before over 300 random weeks");
  { const OLD=await world({name:"random before",base:true}), NEW=await world({name:"random after"});
    for(const W of [OLD,NEW]){ await W.play("2026-11-09","monday",11*60); await W.roll("2026-11-10"); await W.at("2026-11-10",10,30); W.R(SCENE); }
    // a one-day holiday added on Tuesday after the week was built: Tuesday's cards are still laid, the board's week IS this week
    { for(const W of [OLD,NEW]){ await W.play("2026-11-10","tuesday",24*60); W.R('addKidPoints("kid_a",4,"tuesday"); calendarData.holidays=Object.assign({},calendarData.holidays,{hx:{name:"Teacher Day",date:"2026-11-10",pause:"school"}}); _bwkMemo=null;'); await W.at("2026-11-10",15,0); W.R(SCENE); }
      ok("one-day holiday with cards: a break by the calendar, the board's week is this week, Tuesday's cards laid",NEW.R("schoolOffToday()")&&NEW.R("boardWeekIsThisWeek()")===true&&NEW.board().some(t=>t.day==="tuesday"));
      const same=p=>p[0].v===p[1].v&&JSON.stringify(p[0].writes)===JSON.stringify(p[1].writes);
      const pl=[OLD.R(POOL),NEW.R(POOL)], c=[await runWriter(OLD,WCELEB),await runWriter(NEW,WCELEB)], bo=[await runWriter(OLD,WBONUS),await runWriter(NEW,WBONUS)], ds=[await runWriter(OLD,WDS),await runWriter(NEW,WDS)];
      for(const W of [OLD,NEW]) await W.at("2026-11-10",20,5);
      const sw=[await runWriter(OLD,'haMomOn(); '+WSWEEP(false)),await runWriter(NEW,'haMomOn(); '+WSWEEP(false))];
      ok("one-day holiday with cards: the ⭐ card's pool line ("+(JSON.parse(pl[1]).kid_a.pool?"shown":"none")+") identical — BRKTODAY does not guard it",pl[0]===pl[1]&&JSON.parse(pl[1]).kid_a.pool);
      ok("one-day holiday with cards: celebrateDayComplete identical ("+c[1].v+" celebration, "+c[1].writes.length+" write) — BRKTODAY does not guard it",same(c)&&c[1].v===1,c);
      ok("one-day holiday with cards: the day bonus identical ("+bo[1].v+", "+bo[1].writes.length+" writes) — BRKTODAY does not guard it",same(bo)&&bo[1].v==="bonus",bo);
      ok("one-day holiday with cards: dsAutoStart identical ("+ds[1].writes.length+" write) — BRKTODAY does not guard it",same(ds)&&ds[1].writes.length===1,ds);
      ok("one-day holiday with cards: the 8 PM sweep identical (ran: "+sw[1].v+") — BRKTODAY does not guard it",same(sw)&&sw[1].v===true,sw);
      for(const W of [OLD,NEW]){ W.R('haMomOff(); delete calendarData.holidays.hx; _bwkMemo=null;'); await W.at("2026-11-10",21,0); W.R(SCENE); } }
    const orig=JSON.parse(NEW.R("JSON.stringify(weekData.tasks)"));
    let seed=20261124; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const WD=["monday","tuesday","wednesday","thursday","friday","saturday"], ISO={monday:"2026-11-09",tuesday:"2026-11-10",wednesday:"2026-11-11",thursday:"2026-11-12",friday:"2026-11-13",saturday:"2026-11-14"};
    let diffs=0, first=null, nCards=0, nW=0, nCeleb=0, nBonus=0, nDs=0, nSweep=0;
    for(let it=0;it<300;it++){
      const tasks=JSON.parse(JSON.stringify(orig)), ck={};
      tasks.forEach(t=>{ if(rnd()<0.4) t.day=WD[Math.floor(rnd()*5)]; if(rnd()<0.6) ck[t.id]="9:"+String(10+Math.floor(rnd()*40))+" AM"; });
      const today=WD[Math.floor(rnd()*6)], mom=rnd()<0.5, eve=rnd()<0.2, pts={};
      ["kid_a","kid_b"].forEach(k=>{ pts[k]={}; WD.forEach(d=>{ if(rnd()<0.5) pts[k][d]=1+Math.floor(rnd()*12); }); });
      const set='weekData.tasks='+JSON.stringify(tasks)+'; checked='+JSON.stringify(ck)+'; claimed={}; sv(WK+"_slot_points",'+JSON.stringify(pts)+'); _todayDay="'+today+'"; day="'+today+'"; '+SCENE.replace('haMomOff(); tab="kids"; day=_todayDay;','')+';'+(mom?' haMomOn();':' haMomOff();')+' eveningSweeps={};';
      for(const W of [OLD,NEW]){ W.clock.now=hm(ISO[today],eve?20:10+(it%6),eve?10:0); W.R(set); }
      const a=OLD.R(PS)+OLD.R(POOL), b=NEW.R(PS)+NEW.R(POOL);
      if(a!==b){ diffs++; if(!first) first={it,today,d:firstDiff(a,b)}; }
      nCards+=cnt(JSON.parse(NEW.R(PS)).all);
      const ws=[WCELEB,WBONUS,WDS].concat(eve&&it%3===0?[WSWEEP(false)]:[]);
      for(const w of ws){ const x=await runWriter(OLD,w), y=await runWriter(NEW,w);
        const norm=r=>JSON.stringify([r.v,r.writes]).replace(/"\d{1,2}:\d\d [AP]M"/g,"T");
        if(norm(x)!==norm(y)){ diffs++; if(!first) first={it,today,w:w.slice(0,40),x,y}; }
        nW+=y.writes.length; if(w===WCELEB&&y.v===1) nCeleb++; if(w===WBONUS&&y.v==="bonus") nBonus++; if(w===WDS&&y.writes.length) nDs++; if(w.indexOf("mlEveningSweep")>0&&y.v===true) nSweep++; }
      for(const W of [OLD,NEW]) W.R("weekData.tasks="+JSON.stringify(orig)+";");
    }
    ok("300 weeks: Kids' Corner, Mom's Today, Dad's Day, the board, store, afternoon, Mom loop, the line, the ⭐ card (pool) — identical to the code before",diffs===0,first);
    ok("…and celebrateDayComplete, the day bonus, dsAutoStart and the 8 PM sweep returned the same and wrote the same",diffs===0);
    ok("…the weeks really had cards and the writers really wrote ("+nCards+" cards on All, "+nCeleb+" celebrations, "+nBonus+" day bonuses, "+nDs+" day starts, "+nSweep+" sweeps, "+nW+" writes)",nCards>1500&&nCeleb>100&&nBonus>50&&nDs>100&&nSweep>5,[nCards,nCeleb,nBonus,nDs,nSweep,nW]);
  }

  // ═══ 6. writes ═══
  console.log("6 · writes");
  ok("on every stale day, in every world: the slice's probes and guarded writers wrote nothing at all ("+staleWrites.length+")",staleWrites.length===0,staleWrites.slice(0,8));
  ok("…in particular nothing under week*, pointClaims or bank",!staleWrites.some(w=>BAD.test(w)));

  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed  ("+Math.round((Date.now()-T0)/1000)+" s)");
  if(fail) process.exit(1);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
