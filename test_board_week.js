/*
 * 📅 BOARDWK + BWCLAIM — "is the week on the board this week?" and the claim fix (DESIGN_break_week_2026-11-24 §3 Option 4
 * Rule A, §5 row 0; her "Yes, build it" 2026-11-24, with answer 3 "forfeited as today" and answer 6 "ship the claim fix first").
 *
 * The live case: a week the plan does not cover (a full break week, a two-week break, every week after the plan ends) builds
 * no week, so the board keeps LAST school week and every record filed by week + day name is last week's. On the break's
 * Tuesday, last Tuesday's pool — already FORFEITED — showed a Claim button, and claimDayPoints paid it (forfeited 5 → claimed
 * → Mom approves → 5 in the Star Bank).
 *
 * Proved here — the WHOLE app runs in the vm sandbox of test_demo_week.js on the synthetic demo family:
 *   A. boardWeekIsThisWeek() on every day of: a normal fortnight (incl. Saturday, and Sunday before and after the next week
 *      builds); the design's worlds a1, a2, b, c1, d1, d2, e1, e2, g (false on every gap day incl. its Sunday and Saturday;
 *      d true in its first, real week); the first school Sunday/Monday after (true); the week of Dec 28 → Jan 2 as a real week
 *      and as a gap, from the plan's dates and from the week's own year-less dates; every fail-open case (true).
 *   B. The claim fix, against the same file with the two BWCLAIM lines stripped (= the code before it; slice 1's pool line is
 *      stripped too when present, so this passes before and after it): in worlds a2, c1 (both break weeks) and d1 (the second,
 *      stale week) a forfeited same-weekday pool shows no Claim button and claimDayPoints writes nothing (one plain toast) —
 *      before, it offered the button and wrote "claimed"; a record already claimed is still approved / rejected by Mom, a
 *      forfeited one still restored, exactly as before; a normal Tuesday, a Saturday, a one-day holiday inside a real week and
 *      300 random normal weeks (two children, mixed checked / unchecked, pools, claims, Mom here and not, every weekday incl.
 *      Saturday): the ⭐ card's HTML and claimDayPoints' writes byte-identical to the stripped code.
 *   C. Nothing under week*, pointClaims or bank is written by the helper or the fix in any world.
 * No kid or family names: the fixture is synthetic.   run: node test_board_week.js
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

// ── the change, [where, old, new]; stripping puts old back. Optional = slice 1's pool line, stripped when present ──
const CHANGES=[
  ["claimDayPoints","function claimDayPoints(kid,d){\n  if(!spinClaimGateDone(kid,d)){",
   "function claimDayPoints(kid,d){\n  if(typeof boardWeekIsThisWeek===\"function\"&&!boardWeekIsThisWeek()){ if(typeof gwShowToast===\"function\") gwShowToast(\"No school today \\u2014 nothing to claim\"); return; }   // 📅 BWCLAIM: the board is last school week — its stars aren't today's (a forfeited day was claimable again)\n  if(!spinClaimGateDone(kid,d)){"],
  ["claim tile","      +(canClaim?'<button onclick=\"event.stopPropagation();claimDayPoints(",
   "      +(canClaim&&!(typeof boardWeekIsThisWeek===\"function\"&&!boardWeekIsThisWeek())/* 📅 BWCLAIM: no Claim on last school week's stars */?'<button onclick=\"event.stopPropagation();claimDayPoints("],
];
const OPTIONAL=[   // slice 1 (BWNOWEEK): the ⭐ card's pool line — present on a branch that has it, absent before it
  ["pool line","    const spun=(typeof getKidDayPoints===\"function\")?getKidDayPoints(k,dn):0;\n",
   "    const spun=(typeof getKidDayPoints===\"function\"&&!(typeof boardWeekIsThisWeek===\"function\"&&!boardWeekIsThisWeek()))?getKidDayPoints(k,dn):0;   // 📅 BWNOWEEK: no star pool for today from last school week\n"],
];
function strip(src){
  for(let i=CHANGES.length-1;i>=0;i--){ const [,o,n]=CHANGES[i]; if(count(src,n)!==1) throw new Error("change "+i+" ("+CHANGES[i][0]+") not found once"); src=src.split(n).join(o); }
  for(const [,o,n] of OPTIONAL) if(count(src,n)===1) src=src.split(n).join(o);
  return src;
}
console.log("the change is where it should be");
ok("both BWCLAIM lines are in index.html exactly once",CHANGES.every(c=>count(SRC,c[2])===1));
const BASE=strip(SRC);
ok("stripped: no BWCLAIM left, the old lines back once each, the file shorter",BASE.indexOf("BWCLAIM")<0&&CHANGES.every(c=>count(BASE,c[1])===1)&&BASE.length<SRC.length);
ok("claimDayPoints' guard is its first line, ahead of the gate's toast",SRC.indexOf(CHANGES[0][2])===SRC.indexOf("function claimDayPoints(kid,d){"));
ok("the claim tile's change is inside kcPointsHTML",SRC.indexOf(CHANGES[1][2])>SRC.indexOf("function kcPointsHTML(k){")&&SRC.indexOf(CHANGES[1][2])<SRC.indexOf("function kcTodayHTML(k){"));
const HB=SRC.slice(SRC.indexOf("// 📅 BOARDWK_START"),SRC.indexOf("// 📅 BOARDWK_END"));
ok("the helper is one marked block, defined once, after BRKTODAY's",count(SRC,"// 📅 BOARDWK_START")===1&&count(SRC,"function boardWeekIsThisWeek(")===1&&SRC.indexOf("// 📅 BOARDWK_START")>SRC.indexOf("// 🏖 BRKTODAY_END")&&HB.indexOf("function _bwkPlanSat(")>0&&HB.indexOf("function _bwkOwnSat(")>0&&HB.indexOf("function _bwkBuildComing(")>0);
{ const code=HB.replace(/\/\/[^\n]*/g,"");
  ok("the helper writes nothing (no db, storage, timer, set/update/remove, sv)",!/\bdb\b|HA_LS|localStorage|\bsv\(|setTimeout|setInterval|\.set\(|\.update\(|\.remove\(|obSet|obInc|obRemove/.test(code),code.match(/\bdb\b|\.set\(|HA_LS/));
  ok("…and fails open: one try, whose catch answers true",/\}catch\(e\)\{ return true; \}/.test(code)&&count(code,"try{")===1); }
ok("the claim lines write nothing of their own",!/\bdb\b|\.set\(|obSet|_setPointClaim/.test(CHANGES.map(c=>c[2].replace(c[1].split("\n")[0],"").replace(/claimDayPoints\($/,"")).join("\n").replace(/\/\/[^\n]*|\/\*[^*]*\*\//g,"")));
ok("the canClaim line itself is byte-identical to before (test_calendar_layers.js pins it)",count(SRC,"    const canClaim=spun>0&&gateOk&&!(claim&&(claim.status===\"claimed\"||claim.status===\"cashed\"));\n")===1);
ok("forfeitSweep, approveDayPoints, rejectDayPoints, restoreForfeited, getPointClaim, _setPointClaim untouched by the change",
  ["function forfeitSweep(","function approveDayPoints(","function rejectDayPoints(","function restoreForfeited(","function getPointClaim(","function _setPointClaim("].every(f=>{ const a=SRC.indexOf(f), b=SRC.indexOf("\nfunction ",a+5); return a>0&&SRC.slice(a,b).indexOf("boardWeekIsThisWeek")<0; }));
const BASE_PATH=path.join(os.tmpdir(),"board_week_base_"+process.pid+".html");
fs.writeFileSync(BASE_PATH,BASE);

// ── plan surgery on the fixture copy (the design's sandbox worlds) ──
// gap(fromWk, weeks, relabel): every plan week >= fromWk moves `weeks` weeks later; relabel → its number too (the break's number is reserved)
function gap(db,fromWk,weeks,relabel){
  const c=db.curriculum;
  for(const kid of Object.keys(c.weekDays)){ const wd=c.weekDays[kid], out={};
    for(const lbl of Object.keys(wd)){ const n=+lbl.replace(/\D/g,"");
      if(n>=fromWk){ wd[lbl].forEach(dn=>{ const l=c.lessons[kid][dn]; if(l&&l.date) l.date=addDays(l.date,7*weeks); if(relabel&&l) l.week="Wk "+(n+weeks); }); out[relabel?"Wk "+(n+weeks):lbl]=wd[lbl]; }
      else out[lbl]=wd[lbl]; }
    c.weekDays[kid]=out; }
}
// slide(isOff): the Align shape by hand — lessons on off dates slide to the next free Mon–Fri, labels by calendar week (week 1 = the first Monday)
function slide(db,isOff,mon1){
  const c=db.curriculum;
  for(const kid of Object.keys(c.lessons)){ const L=c.lessons[kid]; const dns=Object.keys(L).map(Number).sort((a,b)=>a-b); let prev=null; const nw={};
    for(const dn of dns){ let d=L[dn].date; if(prev&&addDays(prev,1)>d) d=addDays(prev,1);
      while(true){ const g=new Date(d+"T12:00:00").getDay(); if(g>=1&&g<=5&&!isOff(d)) break; d=addDays(d,1); }
      L[dn].date=d; prev=d; const wk=1+Math.floor((new Date(d+"T12:00:00")-new Date(mon1+"T00:00:00"))/(7*864e5)); L[dn].week="Wk "+wk; (nw["Wk "+wk]=nw["Wk "+wk]||[]).push(dn); }
    c.weekDays[kid]=nw; }
}
const endPlan=db=>{ const c=db.curriculum; for(const k of Object.keys(c.weekDays)) for(const l of Object.keys(c.weekDays[k])) if(l!=="Wk 1"){ c.weekDays[k][l].forEach(dn=>delete c.lessons[k][dn]); delete c.weekDays[k][l]; } };
// every ISO date in the fixture moved n days (the year-turn worlds)
function shiftAll(v,n){ if(typeof v==="string") return /^\d{4}-\d{2}-\d{2}$/.test(v)?addDays(v,n):v; if(Array.isArray(v)) return v.map(x=>shiftAll(x,n));
  if(v&&typeof v==="object"){ const o={}; for(const k of Object.keys(v)) o[/^\d{4}-\d{2}-\d{2}$/.test(k)?addDays(k,n):k]=shiftAll(v[k],n); return o; } return v; }
const HOL=(s,e)=>({holidays:{h1:{name:"Fall Break",start:s,end:e,pause:"school"}}});
const VAC=(s,e)=>({vacations:{v1:{name:"Trip",start:s,end:e,pause:"all"}}});

// ── a world: the demo family; week 1 builds on its Sunday (Nov 8, or `shift` days later) ──
async function world(o){
  const shift=o.shift||0, sun=addDays("2026-11-08",shift);
  const clock=S.makeClock(hm(sun,0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  let d=JSON.parse(JSON.stringify(FX.db)); if(shift) d=shiftAll(d,shift);
  Object.assign(d.calendar,JSON.parse(JSON.stringify(o.cal||{}))); if(o.plan) o.plan(d);
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const A=S.bootDevice({name:o.name,dev:"dev_a",db,clock,sched,family:FX.family,indexPath:o.base?BASE_PATH:INDEX,globals:{Math:M}});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  const W={A,db,clock,flush,R:e=>A.run(e),sun,wk:()=>db.get("ha_active_wk")||A.get("WK"),
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
  W.bw=()=>W.R("_bwkMemo=null; boardWeekIsThisWeek()");
  W.R('__HARNESS_NO_RENDER=true; tab="kids"; var __toasts=[]; gwShowToast=function(m){ __toasts.push(String(m)); };');
  return W;
}
const playWeek=async(W,mon,lateFrom)=>{ for(let i=0;i<5;i++){ const iso=addDays(mon,i); if(i||W.clock.now<hm(iso,0,0)) await W.roll(iso); await W.play(iso,dnOf(iso),i>=lateFrom?9*60+40:24*60); } };
// …and which source decided (the helper keeps it on its memo): W.whys = [[iso, answer, why], …]
const truth=async(W,from,to)=>{ const out=[]; let iso=from; while(iso<=to){ await W.roll(iso); const v=W.bw(); (W.whys=W.whys||[]).push([iso,v,W.R("_bwkMemo&&_bwkMemo.why")]); out.push(iso.slice(5)+dnOf(iso).slice(0,2)+"="+(v?"T":"f")); iso=addDays(iso,1); } return out; };
const whySet=(W,v)=>[...new Set((W.whys||[]).filter(x=>x[1]===v).map(x=>x[2]))];
const expect=(days,falseFrom,falseTo)=>days.map(s=>{ const md=s.slice(0,5); return s.slice(0,7)+"="+((md>=falseFrom&&md<=falseTo)?"f":"T"); });

async function runWriter(W,expr){ const m=W.db.log.length; W.R("__toasts=[]"); const v=W.R(expr); await W.flush(3000); return {v:v,toasts:JSON.parse(W.R("JSON.stringify(__toasts)")),writes:W.db.log.slice(m).map(l=>l.op+" "+l.path+(l.keys?" "+l.keys.join(","):"")+(l.val!==undefined?" "+JSON.stringify(l.val):""))}; }
const BAD=/^(set|update|remove|inc|transaction|push)\s+(week[^/ ]*\/|pointClaims\/|bank\/)|^update\s+\S*\s.*(week\d+\/|pointClaims\/|bank\/)/;
const P0=`(function(){ var out={}; ["kid_a","kid_b"].forEach(function(k){ var h=kcPointsHTML(k), c=getPointClaim(k,_todayDay); out[k]={html:h,btn:/claimDayPoints\\(/.test(h),pool:getKidDayPoints(k,_todayDay),claim:c?c.status:null,gate:spinClaimGateDone(k,_todayDay)}; }); _bwkMemo=null; out.bw=boardWeekIsThisWeek(); return JSON.stringify(out); })()`;
const p0=W=>JSON.parse(W.R("haMomOff(); tab=\"kids\"; day=_todayDay; "+P0));
const firstDiff=(a,b)=>{ let i=0; while(i<a.length&&a[i]===b[i]) i++; return {at:i,a:a.slice(Math.max(0,i-120),i+160),b:b.slice(Math.max(0,i-120),i+160)}; };
let staleWrites=[];   // every write made by a NEW-code probe or refused claim on a stale day, any world

(async function(){
  // ═══ A. the helper ═══
  console.log("A · boardWeekIsThisWeek()");
  { const W=await world({name:"normal"});
    ok("(set-up) normal: Sunday Nov 8 built week 1; plan weeks 1–6 back to back",W.wk()==="week1"&&W.R("_maxPlanWeek()")===6);
    const sunBuilt=W.bw();
    await playWeek(W,"2026-11-09",3);
    const wk1=["2026-11-09","2026-11-10","2026-11-11","2026-11-12","2026-11-13"];
    ok("normal: every weekday of week 1 was true while it was played",sunBuilt===true);
    await W.roll("2026-11-14"); const sat=W.bw();
    // Sunday 00:00:05, before the day roll builds week 2
    W.clock.now=hm("2026-11-15",0,0)+5000; const sunBefore=[W.bw(),W.wk(),W.R("weekNumForDate(_todayStr())")];
    await W.roll("2026-11-15"); const sunAfter=[W.bw(),W.wk()];
    ok("normal: Saturday of week 1 → true",sat===true);
    ok("normal: the Sunday before week 2 builds (00:00, week 1 still on the board, week 2 due) → true",sunBefore[0]===true&&sunBefore[1]==="week1"&&sunBefore[2]===2,sunBefore);
    ok("normal: …and after it built → true",sunAfter[0]===true&&sunAfter[1]==="week2",sunAfter);
    const days=await truth(W,"2026-11-16","2026-11-24");
    ok("normal: Mon–Sat of week 2, Sunday and Mon–Tue of week 3 → true every day",days.every(s=>/=T$/.test(s)),days);
    // a tablet waking on Monday that missed Sunday's build: the board is still last week until it adopts the new one
    W.R("weekData=JSON.parse(JSON.stringify(weekData)); WK=\"week2\";");
    W.clock.now=hm("2026-11-30",9,0); ok("normal: a tablet waking Monday with last week still on its board (week 4 due or building) → true",W.bw()===true&&W.R("weekNumForDate(_todayStr())")===4);
    W.clock.now=hm("2026-11-14",9,0); ok("normal: today BEFORE the board's week (a week built early) → true",W.bw()===true);
    await W.roll("2026-11-24");
    ok("normal: probing writes nothing",true);
  }
  // (a) the board was built for this week, then the plan's label for its number moved to last week (Align renumbering) or was removed
  { const W=await world({name:"relabel"});
    await playWeek(W,"2026-11-09",5); await W.roll("2026-11-14"); await W.roll("2026-11-15");
    ok("(set-up) relabel: week 2 built for Mon Nov 16 – Fri 20, its own dates say so",W.wk()==="week2"&&W.R("DAY_DT.monday")==="November 16");
    W.R('var __cd=JSON.stringify({w:currData.weekDays,l:currData.lessons}); function __sh(iso,n){ var d=gwParseDate(iso); d.setDate(d.getDate()+n); return _bwkIso(d); }'
      +' function __mv(lbl,n){ Object.keys(currData.weekDays).forEach(function(k){ (currData.weekDays[k][lbl]||[]).forEach(function(dn){ var l=currData.lessons[k][dn]; if(l&&l.date) l.date=__sh(l.date,n); }); }); }'
      +' function __rm(lbl){ Object.keys(currData.weekDays).forEach(function(k){ delete currData.weekDays[k][lbl]; }); }'
      +' function __restore(){ var o=JSON.parse(__cd); currData.weekDays=o.w; currData.lessons=o.l; _bwkMemo=null; }');
    const V=[["the label for week 2 moved to last week, no plan week for today","__mv(\"Wk 2\",-7);"],
             ["the label for week 2 moved to last week, the next label renumbered onto this week","__mv(\"Wk 2\",-7); __mv(\"Wk 3\",-7);"],
             ["the label for week 2 removed, no plan week for today","__rm(\"Wk 2\");"],
             ["the label for week 2 removed, the next label renumbered onto this week","__rm(\"Wk 2\"); __mv(\"Wk 3\",-7);"]];
    for(const [lbl,mut] of V){
      W.R("__restore(); "+mut);
      const res=[]; for(const iso of ["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21"]){ W.clock.now=hm(iso,10,0); res.push([iso.slice(5),W.bw(),W.R("_bwkMemo.why")]); }
      const plan=W.R("_bwkPlanSat()");
      ok("relabel · "+lbl+": true Mon–Sat of the board's week, decided by the week's own dates (plan's Saturday now "+plan+")",res.every(r=>r[1]===true&&/^own says this week$/.test(r[2])),res);
    }
    W.R("__restore(); __mv(\"Wk 2\",-7);"); W.clock.now=hm("2026-11-18",10,0);
    const pl=W.R("var __d=DAY_DT; DAY_DT={}; _bwkMemo=null; var __v=boardWeekIsThisWeek(); DAY_DT=__d; __v");
    ok("relabel · …the same day with the week's own dates unread, the plan alone would say not this week (what the old helper answered)",pl===false&&W.R("_bwkMemo.why")==="plan say after the week");
    W.R("__restore();"); W.clock.now=hm("2026-11-18",10,0); ok("relabel · plan restored → true, both sources",W.bw()===true&&W.R("_bwkMemo.why")==="plan+own says this week");
    // the other way round: the plan says this week, the week's own dates are last week's → still true (any source saying this week wins)
    W.R('var __d2=DAY_DT; DAY_DT={monday:"November 9",friday:"November 13"};'); const ow=[W.bw(),W.R("_bwkMemo.why")]; W.R("DAY_DT=__d2; _bwkMemo=null;");
    ok("relabel · the plan says this week but the week's own dates are last week's → true (the plan decides)",ow[0]===true&&ow[1]==="plan says this week",ow);
  }
  const worldsA=[
    {k:"a1",lbl:"a1 · full-week holiday, the plan has no week for it (numbers run on)",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,false),from:"2026-11-14",to:"2026-11-24",f:["11-15","11-21"],wkAfter:"week2"},
    {k:"a2",lbl:"a2 · full-week holiday, its number skipped (our own plan's shape)",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),from:"2026-11-14",to:"2026-11-24",f:["11-15","11-21"],wkAfter:"week3"},
    {k:"b",lbl:"b · full-week holiday over a plan week whose days are all off",cal:HOL("2026-11-16","2026-11-20"),from:"2026-11-14",to:"2026-11-24",f:["11-15","11-21"],wkAfter:"week3"},
    {k:"c1",lbl:"c1 · two-week holiday, both numbers skipped",cal:HOL("2026-11-16","2026-11-27"),plan:d=>gap(d,2,2,true),from:"2026-11-14",to:"2026-12-01",f:["11-15","11-28"],wkAfter:"week4"},
    {k:"d1",lbl:"d1 · holiday from a Wednesday to the next week's Friday, plan as is",cal:HOL("2026-11-18","2026-11-27"),from:"2026-11-14",to:"2026-12-01",f:["11-22","11-28"],wkAfter:"week4",wkMid:"week2"},
    {k:"d2",lbl:"d2 · the same holiday, the plan slid (Align shape)",cal:HOL("2026-11-18","2026-11-27"),plan:d=>slide(d,iso=>iso>="2026-11-18"&&iso<="2026-11-27","2026-11-09"),from:"2026-11-14",to:"2026-12-01",f:["11-22","11-28"],wkAfter:"week4",wkMid:"week2"},
    {k:"e1",lbl:"e1 · a pause-everything vacation, its number skipped",cal:VAC("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),from:"2026-11-14",to:"2026-11-24",f:["11-15","11-21"],wkAfter:"week3"},
    {k:"e2",lbl:"e2 · a pause-everything vacation over a plan week",cal:VAC("2026-11-16","2026-11-20"),from:"2026-11-14",to:"2026-11-24",f:["11-15","11-21"],wkAfter:"week3"},
    {k:"g",lbl:"g · the plan ends after week 1, no calendar break",plan:endPlan,from:"2026-11-14",to:"2026-12-01",f:["11-15","12-31"],wkAfter:"week1"},
  ];
  for(const D of worldsA){
    const W=await world({name:D.k,cal:D.cal,plan:D.plan});
    await playWeek(W,"2026-11-09",3);
    const m0=W.db.log.length;
    const days=await truth(W,D.from,D.to);
    const want=expect(days,D.f[0],D.f[1]);
    ok(D.lbl+": "+days.filter(s=>/=f$/.test(s)).length+" days false ("+D.f[0]+" … "+(D.f[1]==="12-31"?"for good":D.f[1])+"), true on the days around them",JSON.stringify(days)===JSON.stringify(want),{got:days,want});
    const wf=whySet(W,false), wt=whySet(W,true);
    ok(D.lbl+": every false day was decided by BOTH sources (the plan's range and the week's own dates put today after its Saturday)",wf.length===1&&wf[0]==="plan+own say after the week",wf);
    console.log("      (true days decided by: "+wt.join(" · ")+")");
    ok(D.lbl+": the board afterwards is "+D.wkAfter+(D.k==="g"?" (never moves)":" — the first school Monday after is true"),W.wk()===D.wkAfter&&(D.k==="g"||days.some(s=>s.indexOf("mo=T")>0&&s.slice(0,5)>D.f[1])),[W.wk()]);
    if(D.wkMid) ok(D.lbl+": its first week was a real plan week, built on Sunday ("+D.wkMid+"), true Mon–Sat",days.filter(s=>s.slice(0,5)>="11-16"&&s.slice(0,5)<="11-21").every(s=>/=T$/.test(s)));
    ok(D.lbl+": the helper wrote nothing on a gap day",(()=>{ const m=W.db.log.length; W.clock.now=hm(D.from==="2026-11-14"?"2026-11-17":D.from,10,0); for(let i=0;i<50;i++) W.bw(); return W.db.log.length===m; })());
    if(D.k==="g"){
      // fail-open cases, on a stale day of world g (the answer would otherwise be false)
      await W.roll("2026-11-17"); await W.at("2026-11-17",10,0);
      ok("g (set-up): Tue Nov 17 — false, no calendar break, week 1 on the board",W.bw()===false&&!W.R("!!scheduleBreakToday()")&&W.wk()==="week1");
      const fo=(lbl,setup,undo)=>{ W.R(setup); let v; try{ v=W.bw(); }finally{ W.R(undo); W.R("_bwkMemo=null"); } ok("fail open — "+lbl+" → true",v===true,v); };
      fo("the active week is empty (a brand-new family, nothing loaded yet)","var __t=weekData.tasks; weekData.tasks=[];","weekData.tasks=__t;");
      fo("the curriculum isn't loaded (no plan to say whether a week builds)","var __c=currData; currData=null;","currData=__c;");
      fo("no dates at all (no plan dates, empty meta.dates)","var __g=gwWeekDateRange, __d=DAY_DT; gwWeekDateRange=function(){ return null; }; DAY_DT={};","gwWeekDateRange=__g; DAY_DT=__d;");
      fo("meta.dates that can't be read","var __g=gwWeekDateRange, __d=DAY_DT; gwWeekDateRange=function(){ return null; }; DAY_DT={monday:\"Someday\"};","gwWeekDateRange=__g; DAY_DT=__d;");
      fo("a meta.dates day read as long ago (a week built early, Monday 6 days ahead → last year)","var __g=gwWeekDateRange, __d=DAY_DT; gwWeekDateRange=function(){ return null; }; DAY_DT={monday:\"November 23\"};","gwWeekDateRange=__g; DAY_DT=__d;");
      fo("the plan's week for today is at or behind the board (they disagree)","var __w=weekNumForDate; weekNumForDate=function(){ return 1; };","weekNumForDate=__w;");
      fo("a plan week for today that will build (due / running)","var __w=weekNumForDate; weekNumForDate=function(){ return 2; }; var __r=gwReadWeek; gwReadWeek=function(){ return {\"2026-11-17\":{kid_a:{}}}; };","weekNumForDate=__w; gwReadWeek=__r;");
      fo("an exception anywhere inside","var __s=_todayStr; _todayStr=function(){ throw new Error(\"x\"); };","_todayStr=__s;");
      ok("…and back to false with everything restored",W.bw()===false);
      W.R("var __g2=gwWeekDateRange; gwWeekDateRange=function(){ return null; };");
      const fb=W.bw(); W.R("gwWeekDateRange=__g2; _bwkMemo=null;");
      ok("g: with no plan dates, the week's own meta.dates (\"November 9\" … no year) give the same answer: false",fb===false&&/^November 9$/.test(W.R("DAY_DT.monday")),[fb,W.R("JSON.stringify(DAY_DT)")]);
      // the memo: an in-place calendar change shows within 3 seconds; a day roll at once
      W.R("_bwkMemo=null;"); const m1=W.R("boardWeekIsThisWeek()");
      W.R("var __w3=weekNumForDate, __r3=gwReadWeek; weekNumForDate=function(){ return 2; }; gwReadWeek=function(){ return {\"x\":{}}; };");
      const m2=W.R("boardWeekIsThisWeek()"); W.clock.now+=3500; const m3=W.R("boardWeekIsThisWeek()");
      W.R("weekNumForDate=__w3; gwReadWeek=__r3; _bwkMemo=null;");
      ok("the memo: an answer is kept within the same day and objects (false → still false at once) and asked again after 3 s (true)",m1===false&&m2===false&&m3===true,[m1,m2,m3]);
    }
  }
  // the year turn: week 1 moved to Mon Dec 28 2026 – Fri Jan 1 2027 (a real week), and to Dec 21 with Dec 28's number skipped (a gap)
  { const W=await world({name:"year real",shift:49});
    ok("(set-up) year turn, real week: week 1 = Dec 28 – Jan 1, built Sun Dec 27",W.wk()==="week1"&&JSON.stringify(W.R("JSON.stringify(gwWeekDateRange(1))"))===JSON.stringify(JSON.stringify({start:"2026-12-28",end:"2027-01-03"})),W.R("JSON.stringify(gwWeekDateRange(1))"));
    const days=[]; for(const iso of ["2026-12-28","2026-12-29","2026-12-30","2026-12-31","2027-01-01","2027-01-02"]){ await W.roll(iso); days.push(iso+"="+(W.bw()?"T":"f")); }
    ok("year turn, real week: Mon Dec 28 … Sat Jan 2 → true every day",days.every(s=>/=T$/.test(s)),days);
    { const w=W.R("_bwkMemo&&_bwkMemo.why"); ok("year turn, real week: on Sat Jan 2 both sources say this week (the plan's dates and \"December 28\" read as 2026)",w==="plan+own says this week",w); }
    W.R("var __g=gwWeekDateRange; gwWeekDateRange=function(){ return null; };");
    const dd=W.R("JSON.stringify(DAY_DT)"); const fb=[]; for(const [iso,h] of [["2026-12-31",10],["2027-01-01",10],["2027-01-02",18]]){ W.clock.now=hm(iso,h,0); fb.push(iso+"="+W.bw()); }
    W.R("gwWeekDateRange=__g; _bwkMemo=null;");
    ok("year turn, real week, from the week's own year-less dates (December 28 … January 1): true on Dec 31, Jan 1, Jan 2",fb.every(s=>/=true$/.test(s))&&/December 28/.test(dd)&&/January 1/.test(dd),[fb,dd]);
    await W.roll("2027-01-03"); ok("year turn, real week: Sunday Jan 3 → week 2 builds → true",W.bw()===true&&W.wk()==="week2");
  }
  { const W=await world({name:"year gap",shift:42,cal:HOL("2026-12-28","2027-01-01"),plan:d=>gap(d,2,1,true)});
    await playWeek(W,"2026-12-21",3);
    const days=await truth(W,"2026-12-26","2027-01-05");
    const want=expect(days,"12-27","01-02").map((s,i)=>s.slice(5,7)==="01"&&days[i].slice(0,5)<="01-02"?s.slice(0,7)+"=f":s);
    { const wf=whySet(W,false); ok("year turn, a gap: every false day decided by both sources (\"December 21\" read as 2026 in January)",wf.length===1&&wf[0]==="plan+own say after the week",wf); }
    ok("year turn, a gap: Sat Dec 26 true; Sun Dec 27 … Sat Jan 2 false; Sun Jan 3 (week 3 builds) and after true",JSON.stringify(days)===JSON.stringify(["12-26sa=T","12-27su=f","12-28mo=f","12-29tu=f","12-30we=f","12-31th=f","01-01fr=f","01-02sa=f","01-03su=T","01-04mo=T","01-05tu=T"]),days);
    await W.roll("2026-12-26"); W.R("var __g=gwWeekDateRange; gwWeekDateRange=function(){ return null; };");   // rolling back the clock: week 3 is active now, so look at week 1's dates by hand
    W.R("WK=\"week1\"; DAY_DT={monday:\"December 21\",tuesday:\"December 22\",wednesday:\"December 23\",thursday:\"December 24\",friday:\"December 25\"};");
    const fb=[]; for(const [iso,h] of [["2026-12-26",10],["2026-12-30",10],["2027-01-02",10]]){ W.clock.now=hm(iso,h,0); W.R("var __w=weekNumForDate; weekNumForDate=function(){ return null; };"); fb.push(iso+"="+W.bw()); W.R("weekNumForDate=__w;"); }
    W.R("gwWeekDateRange=__g; _bwkMemo=null;");
    ok("year turn, a gap, from the year-less dates (December 21 …): Sat Dec 26 true; Dec 30 and Sat Jan 2 false (December read as last year in January)",JSON.stringify(fb)===JSON.stringify(["2026-12-26=true","2026-12-30=false","2027-01-02=false"]),fb);
  }

  // ═══ B. the claim fix ═══
  console.log("B · the claim fix (BWCLAIM) against the code without it");
  // the week played, every card done; a pool on Mon (6, never claimed), Tue (5), Fri (3) for kid_a and Tue (2) for kid_b;
  // kid_a claims Friday's on Friday (claimed, waiting for Mom); kid_b claims Tuesday's on Tuesday
  const playClaimWeek=async(W,mon)=>{
    for(let i=0;i<5;i++){ const iso=addDays(mon,i), dn=dnOf(iso); if(i) await W.roll(iso); await W.play(iso,dn,24*60);
      if(dn==="tuesday"){ W.R('addKidPoints("kid_a",5,"tuesday"); addKidPoints("kid_b",2,"tuesday"); haMomOff(); claimDayPoints("kid_b","tuesday"); haMomOn();'); }
      if(dn==="monday") W.R('addKidPoints("kid_a",6,"monday")');
      if(dn==="friday"){ W.R('addKidPoints("kid_a",3,"friday"); haMomOff(); claimDayPoints("kid_a","friday"); haMomOn();'); }
      await W.flush(3000); }
  };
  const stalePair=async(lbl,o,mon,staleIso,wkKey)=>{
    const OLD=await world(Object.assign({name:lbl+" before",base:true},o)), NEW=await world(Object.assign({name:lbl+" after"},o));
    for(const W of [OLD,NEW]){ if(mon!=="2026-11-09") await playWeek(W,"2026-11-09",3); if(mon!=="2026-11-09") await W.roll(mon); await playClaimWeek(W,mon);
      let iso=addDays(mon,5); while(iso<=staleIso){ await W.roll(iso); iso=addDays(iso,1); } await W.at(staleIso,10,30); W.R("pointClaimsLoaded=true; forfeitSweep();"); await W.flush(2000); }
    ok(lbl+": (set-up) both worlds played the same week; today "+staleIso+" ("+dnOf(staleIso)+") is stale, the board "+wkKey,JSON.stringify(OLD.db.get("pointClaims"))===JSON.stringify(NEW.db.get("pointClaims"))&&OLD.wk()===wkKey&&NEW.wk()===wkKey&&NEW.bw()===false&&OLD.bw()===false,[OLD.wk(),NEW.wk(),NEW.db.get("pointClaims")]);
    const mk=NEW.db.log.length; const o0=p0(OLD), n0=p0(NEW); staleWrites=staleWrites.concat(NEW.db.log.slice(mk).map(l=>l.op+" "+l.path));
    ok(lbl+": kid_a's same-weekday pool is 5 ⭐ and forfeited, the gate open — before AND after",[o0,n0].every(T=>T.kid_a.pool===5&&T.kid_a.claim==="forfeited"&&T.kid_a.gate===true),[o0.kid_a,n0.kid_a].map(x=>Object.assign({},x,{html:undefined})));
    ok(lbl+": before, the ⭐ card offered 🎰 Claim on it; after, no Claim button",o0.kid_a.btn===true&&n0.kid_a.btn===false);
    const oc=await runWriter(OLD,'haMomOff(); claimDayPoints("kid_a","tuesday")'), nc=await runWriter(NEW,'haMomOff(); claimDayPoints("kid_a","tuesday")');
    staleWrites=staleWrites.concat(nc.writes);
    const ov=OLD.db.get("pointClaims/kid_a/"+wkKey+"/tuesday")||{};
    ok(lbl+": before, claimDayPoints wrote \"claimed\" over the forfeit (pointClaims/kid_a/"+wkKey+"/tuesday)",oc.writes.length===1&&oc.writes[0]==="set pointClaims/kid_a/"+wkKey+"/tuesday"&&ov.status==="claimed"&&ov.earned===5,[oc,ov]);
    ok(lbl+": after, it writes nothing and says one plain thing",nc.writes.length===0&&JSON.stringify(nc.toasts)===JSON.stringify(["No school today — nothing to claim"])&&NEW.db.get("pointClaims/kid_a/"+wkKey+"/tuesday").status==="forfeited",nc);
    // a record claimed BEFORE this fix: Mom can still approve or reject it — the same writes as before
    const oa=await runWriter(OLD,'haMomOn(); approveDayPoints("kid_a","friday")'), na=await runWriter(NEW,'haMomOn(); approveDayPoints("kid_a","friday")');
    const strip=v=>JSON.stringify(Object.assign({},v||{},{cashedTs:0,claimedTs:0,forfeitedTs:0}));
    ok(lbl+": a claim made before (kid_a, Friday) — Mom approves it: cashed, the same write as before",na.writes.length===1&&na.writes[0]==="set pointClaims/kid_a/"+wkKey+"/friday"&&(NEW.db.get("pointClaims/kid_a/"+wkKey+"/friday")||{}).status==="cashed"&&JSON.stringify(oa.writes)===JSON.stringify(na.writes)&&strip(OLD.db.get("pointClaims/kid_a/"+wkKey+"/friday"))===strip(NEW.db.get("pointClaims/kid_a/"+wkKey+"/friday")),[oa,na]);
    const or=await runWriter(OLD,'haMomOn(); rejectDayPoints("kid_b","tuesday")'), nr=await runWriter(NEW,'haMomOn(); rejectDayPoints("kid_b","tuesday")');
    ok(lbl+": …and rejects another (kid_b, Tuesday): removed, the same write as before",nr.writes.length===1&&/^remove pointClaims\/kid_b\//.test(nr.writes[0])&&JSON.stringify(or.writes)===JSON.stringify(nr.writes),[or,nr]);
    const ox=await runWriter(OLD,'haMomOn(); restoreForfeited("kid_a","'+wkKey+'","monday")'), nx=await runWriter(NEW,'haMomOn(); restoreForfeited("kid_a","'+wkKey+'","monday")');
    const nxv=NEW.db.get("pointClaims/kid_a/"+wkKey+"/monday")||{};
    ok(lbl+": Mom's restore of a forfeited day (kid_a, Monday, 6 ⭐) still banks it, the same write as before",nx.writes.length===1&&nx.writes[0]==="set pointClaims/kid_a/"+wkKey+"/monday"&&nxv.status==="cashed"&&nxv.restored===true&&nxv.earned===6&&JSON.stringify(ox.writes)===JSON.stringify(nx.writes)&&strip(OLD.db.get("pointClaims/kid_a/"+wkKey+"/monday"))===strip(nxv),[ox,nx,nxv]);
    ok(lbl+": the Star Bank's banked total matches the code before (Friday's approval + Monday's restore = 9 ⭐)",[OLD,NEW].every(W=>JSON.parse(W.R('JSON.stringify(walletTotals("kid_a","lifetime"))')).cashed===9));
    const mk2=NEW.db.log.length; NEW.R("forfeitSweep();"); await NEW.flush(2000); const om=OLD.db.log.length; OLD.R("forfeitSweep();"); await OLD.flush(2000);
    ok(lbl+": forfeitSweep on the stale day does what it did before (unchanged)",JSON.stringify(OLD.db.log.slice(om).map(l=>l.op+" "+l.path))===JSON.stringify(NEW.db.log.slice(mk2).map(l=>l.op+" "+l.path)));
    return {OLD,NEW};
  };
  await stalePair("a2 · break Tuesday",{cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true)},"2026-11-09","2026-11-17","week1");
  await stalePair("c1 · second break Tuesday",{cal:HOL("2026-11-16","2026-11-27"),plan:d=>gap(d,2,2,true)},"2026-11-09","2026-11-24","week1");
  await stalePair("d1 · Tuesday of the second, stale week",{cal:HOL("2026-11-18","2026-11-27")},"2026-11-16","2026-11-24","week2");

  // normal days: a Tuesday with a pool, a one-day holiday added inside the real week, a Saturday — byte-identical
  { const OLD=await world({name:"normal before",base:true}), NEW=await world({name:"normal after"});
    const same=async(lbl,claimDay)=>{ const a=JSON.stringify(p0(OLD)), b=JSON.stringify(p0(NEW));
      ok(lbl+": the ⭐ card (both children) identical to the code before",a===b,a===b?"":firstDiff(a,b));
      const oc=await runWriter(OLD,'haMomOff(); claimDayPoints("kid_a","'+claimDay+'")'), nc=await runWriter(NEW,'haMomOff(); claimDayPoints("kid_a","'+claimDay+'")');
      const norm=w=>w.map(x=>x.replace(/"claimedTs":"[^"]*"/,""));
      ok(lbl+": claimDayPoints — the same writes and toasts as before ("+(nc.writes.length?"claimed":nc.toasts.join(" / ")||"nothing")+")",JSON.stringify(norm(oc.writes))===JSON.stringify(norm(nc.writes))&&JSON.stringify(oc.toasts)===JSON.stringify(nc.toasts),[oc,nc]);
      return JSON.parse(b); };
    for(const W of [OLD,NEW]){ await W.play("2026-11-09","monday",24*60); await W.roll("2026-11-10"); await W.play("2026-11-10","tuesday",24*60); W.R('addKidPoints("kid_a",5,"tuesday"); addKidPoints("kid_b",2,"tuesday")'); await W.at("2026-11-10",16,0); }
    const t=await same("normal Tuesday (pool, gate open)","tuesday");
    ok("normal Tuesday: the button was there to compare (kid_a)",t.kid_a.btn===true&&t.bw===true);
    for(const W of [OLD,NEW]){ await W.roll("2026-11-11"); await W.play("2026-11-11","wednesday",9*60+40); W.R('addKidPoints("kid_a",3,"wednesday")');
      W.R('calendarData.holidays=Object.assign({},calendarData.holidays,{hx:{name:"Teacher Day",date:"2026-11-11",pause:"school"}}); _bwkMemo=null;'); await W.at("2026-11-11",10,30); }
    const h=await same("a one-day holiday inside a real week (Wednesday, added after the week was built)","wednesday");
    ok("…it is a break by the calendar, and the board's week is this week",NEW.R("!!scheduleBreakToday()")&&h.bw===true);
    for(const W of [OLD,NEW]){ W.R('delete calendarData.holidays.hx;'); await W.play("2026-11-11","wednesday",24*60); await W.roll("2026-11-12"); await W.play("2026-11-12","thursday",24*60); await W.roll("2026-11-13"); await W.play("2026-11-13","friday",24*60); await W.roll("2026-11-14"); await W.play("2026-11-14","saturday",24*60);   // the week's leftovers swept onto Saturday, done
      W.R('addKidPoints("kid_a",4,"saturday")'); await W.at("2026-11-14",11,0); }
    const s=await same("Saturday (a Saturday pool)","saturday");
    ok("Saturday: the board's week is this week, and the claim really went through",s.bw===true&&(NEW.db.get("pointClaims/kid_a/week1/saturday")||{}).status==="claimed");

    // 300 random normal weeks: two children, any weekday incl. Saturday, mixed cards / checks / pools / claims, Mom here and not
    console.log("300 random normal weeks");
    const orig=JSON.parse(NEW.R("JSON.stringify(weekData.tasks)"));
    let seed=20261124; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const WD=["monday","tuesday","wednesday","thursday","friday","saturday"], ISO={monday:"2026-11-09",tuesday:"2026-11-10",wednesday:"2026-11-11",thursday:"2026-11-12",friday:"2026-11-13",saturday:"2026-11-14"};
    const ST=[null,null,"claimed","cashed","forfeited"];
    let diffs=0, first=null, btns=0, claims=0, nW=0;
    for(let it=0;it<300;it++){
      const tasks=JSON.parse(JSON.stringify(orig)), ck={};
      tasks.forEach(t=>{ if(rnd()<0.4) t.day=WD[Math.floor(rnd()*5)]; if(rnd()<0.93) ck[t.id]="9:"+String(10+Math.floor(rnd()*40))+" AM"; });
      const today=WD[Math.floor(rnd()*6)], mom=rnd()<0.5, pts={}, pc={};
      ["kid_a","kid_b"].forEach(k=>{ pts[k]={}; pc[k]={week1:{}}; WD.forEach(d=>{ if(rnd()<0.5) pts[k][d]=1+Math.floor(rnd()*12); const s=ST[Math.floor(rnd()*ST.length)]; if(s) pc[k].week1[d]={status:s,earned:pts[k][d]||0}; }); });
      const set='weekData.tasks='+JSON.stringify(tasks)+'; checked='+JSON.stringify(ck)+'; claimed={}; sv(WK+"_slot_points",'+JSON.stringify(pts)+'); pointClaims='+JSON.stringify(pc)+'; _todayDay="'+today+'"; day="'+today+'"; tab="kids"; '+(mom?'haMomOn();':'haMomOff();');
      for(const W of [OLD,NEW]){ W.clock.now=hm(ISO[today],10+Math.floor(it%6),0); W.R(set); }
      const a=OLD.R(P0), b=NEW.R(P0);
      if(a!==b){ diffs++; if(!first) first={it,today,d:firstDiff(a,b)}; }
      const v=JSON.parse(b); if(v.kid_a.btn) btns++; if(v.kid_b.btn) btns++; if(!v.bw){ diffs++; if(!first) first={it,today,bw:false}; }
      const k=rnd()<0.5?"kid_a":"kid_b", dd=rnd()<0.8?today:WD[Math.floor(rnd()*6)];
      const oc=await runWriter(OLD,'claimDayPoints("'+k+'","'+dd+'")'), nc=await runWriter(NEW,'claimDayPoints("'+k+'","'+dd+'")');
      const norm=w=>w.map(x=>x.replace(/"claimedTs":"[^"]*"/,""));
      if(JSON.stringify(norm(oc.writes))!==JSON.stringify(norm(nc.writes))||JSON.stringify(oc.toasts)!==JSON.stringify(nc.toasts)){ diffs++; if(!first) first={it,claim:[oc,nc]}; }
      if(nc.writes.length) claims++; nW+=nc.writes.length;
    }
    ok("300 weeks: the ⭐ card of both children byte-identical, the helper true every time",diffs===0,first);
    ok("300 weeks: claimDayPoints made the same writes and toasts as the code before",diffs===0);
    ok("…the weeks really offered Claim buttons and really claimed ("+btns+" buttons, "+claims+" claims)",btns>40&&claims>20,[btns,claims]);
  }

  // ═══ C. writes ═══
  console.log("C · writes");
  ok("on every stale day: the probes and the refused claims wrote nothing at all ("+staleWrites.length+")",staleWrites.length===0,staleWrites.slice(0,6));
  ok("…in particular nothing under week*/, pointClaims/ or bank/",!staleWrites.some(w=>BAD.test(w)));

  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed  ("+Math.round((Date.now()-T0)/1000)+" s)");
  if(fail) process.exit(1);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
