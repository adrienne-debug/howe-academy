/*
 * 📅 LISTWK — break week slice 2: the lists get their own week by the calendar (DESIGN_break_week_2026-11-24 §3 Option 4
 * Rule B, §5 row 2; her go 2026-11-24).
 *
 * The live case: a week the plan does not cover builds no school week, so the board keeps LAST school week and every list
 * record filed by week + day name was last week's. On a break Tuesday the lists showed last Tuesday's ticks, a tap un-ticked
 * them and took the star back, "earned today" was last Tuesday's wages.
 *
 * The change: listWk() is the board's week whenever boardWeekIsThisWeek() is true — every key, path and write byte-for-byte as
 * before — and otherwise this calendar week's own token, "gap" + its Monday (gap20261116). activeWk() — the list code's week —
 * asks listWk(); the school readers (brain breaks, the trophy live week, the lesson roadmap, the Schedule's week number, the
 * week's supplies) ask schoolWk(). The sl listener follows the list week; the wages stamp's totals, the click-off log, Mom's
 * skips, tech taken / grace, the ledger and the list date helpers follow by asking activeWk() / listWk().
 *
 * Proved here — the WHOLE app runs in the vm sandbox of test_demo_week.js on the synthetic demo family:
 *   1. The change is where it says (test_fixtures/list_week_changes.json: every hunk, once); stripped = the code before.
 *   2. Gap worlds a1, a2, b, c1 (two weeks → two list weeks), d1 (its second week, Mon–Fri), e1 (the pause rule), g, and the
 *      Dec 20 → Jan 2 two-week break across the year turn — two devices (Mom's tablet, a kid's): on every gap day the lists
 *      start un-ticked, a tick pays once and shows on the other device, "earned today" and the ⭐ pill are today's, the tick
 *      is filed under the list week (sl, bank stamp, click-off log), last week's records are untouched, and NOTHING is written
 *      under any week* path.
 *   3. The first school week back (a2): cards identical to the code before — ids, days, times — and the archive of the last
 *      school week identical; the lists are back on the board's week.
 *   4. A one-day holiday inside a real week: every list key and write exactly as before.
 *   5. An older build on a second device: what it shows on a gap day; the gap node untouched by it.
 *   6. 300 random normal weeks, two children, two devices: every list write (path and value), every list render, every
 *      "earned" number byte-identical to the code before.
 *   7. The seconds before a real week builds (the hold): a Sunday-midnight roll and a tablet waking on Monday mid-build —
 *      a tap waits with "One moment — this week is loading" and writes nothing; once the week lands it goes to the new
 *      week; nothing ever lands in last week or in a gap week. A build that never comes: the hold lasts 5 minutes from the
 *      first tap, then taps go where they went before this slice (the board's week).
 * No kid or family names: the fixture is synthetic.   run: node test_list_week.js
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path"), os=require("os");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const HUNKS=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","list_week_changes.json"),"utf8"));
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
const monOf=iso=>{ const d=new Date(iso+"T12:00:00"); if(d.getDay()===0) d.setDate(d.getDate()+1); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0"); };

// ── 1. the change, and the same file with it stripped (= the code before this slice) ──
function strip(src){ for(let i=HUNKS.length-1;i>=0;i--){ const [o,n]=HUNKS[i]; if(count(src,n)!==1) throw new Error("hunk "+i+" not found once: "+n.slice(0,120)); src=src.split(n).join(o); } return src; }
console.log("1 · the change is where it should be");
ok("every LISTWK hunk is in index.html exactly once ("+HUNKS.length+")",HUNKS.every(h=>count(SRC,h[1])===1));
const BASE=strip(SRC);
ok("stripped: no LISTWK, no listWk / schoolWk left, the file shorter",BASE.indexOf("LISTWK")<0&&BASE.indexOf("listWk(")<0&&BASE.indexOf("schoolWk(")<0&&BASE.length<SRC.length);
ok("activeWk() — the list code's week — asks listWk(); listWk(w) is w unless the board's week is not this week",
  count(SRC,"function activeWk(){ const w=weekData.week||WK; return (typeof listWk===\"function\")?listWk(w):w; }")===1&&count(SRC,"function listWk(w){ if(w===undefined) w=schoolWk(); const g=lwGap(); return g||w; }")===1&&count(SRC,"function schoolWk(){ return weekData.week||WK; }")===1);
ok("ONE question: lwGap() asks boardWeekIsThisWeek() and nothing else decides",/function lwGap\(\)\{\n  try\{\n    if\(typeof boardWeekIsThisWeek!=="function"\|\|boardWeekIsThisWeek\(\)\) return null;/.test(SRC));
{ const B=SRC.slice(SRC.indexOf("// 📅 LISTWK_START"),SRC.indexOf("// 📅 LISTWK_END")).replace(/\/\/[^\n]*/g,"");
  ok("the block writes nothing (its one database call is the sl listener's read)",!/\.set\(|\.update\(|\.remove\(|\.push\(\)|transaction|obSet|obInc/.test(B)&&count(B,"db.ref(")===1&&/db\.ref\(lwk\+"\/sl"\)/.test(B)); }
ok("the sl listener is no longer inside attachWeekListeners: it asks lwAttachSl(wk), once",count(SRC,"  lwAttachSl(wk);   // 📅 LISTWK")===1&&SRC.slice(SRC.indexOf("function attachWeekListeners("),SRC.indexOf("function attachWeekListeners(")+20000).indexOf('const r2=db.ref(wk+"/sl")')<0);
const BASE_PATH=path.join(os.tmpdir(),"list_week_base_"+process.pid+".html");
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
function shiftAll(v,n){ if(typeof v==="string") return /^\d{4}-\d{2}-\d{2}$/.test(v)?addDays(v,n):v; if(Array.isArray(v)) return v.map(x=>shiftAll(x,n));
  if(v&&typeof v==="object"){ const o={}; for(const k of Object.keys(v)) o[/^\d{4}-\d{2}-\d{2}$/.test(k)?addDays(k,n):k]=shiftAll(v[k],n); return o; } return v; }
const HOL=(s,e)=>({holidays:{h1:{name:"Fall Break",start:s,end:e,pause:"school"}}});
const VAC=(s,e)=>({vacations:{v1:{name:"Trip",start:s,end:e,pause:"all"}}});
// the lists the worlds tick: two kids, a morning list, an afternoon list, chores
const RT={morning:{kid_a:[{label:"Make bed",emoji:"B",pts:1,cad:"daily"},{label:"Brush teeth",emoji:"T",pts:1,cad:"daily"}],kid_b:[{label:"Make bed",emoji:"B",pts:2,cad:"daily"}]},
  afternoon:{kid_a:[{label:"Tidy desk",emoji:"D",pts:1,cad:"daily"}],kid_b:[{label:"Tidy desk",emoji:"D",pts:1,cad:"daily"}]},
  chores:{kid_a:[{label:"Dishes",emoji:"C",pts:2,cad:"daily"}],kid_b:[{label:"Sweep",emoji:"S",pts:3,cad:"daily"}]}};

// ── a world: Mom's tablet (A, Mom mode) and a kid's tablet (B, kid mode) over one database; week 1 built on its Sunday ──
async function world(o){
  const shift=o.shift||0, sun=addDays("2026-11-08",shift);
  const clock=S.makeClock(hm(sun,0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  let d=JSON.parse(JSON.stringify(FX.db)); if(shift) d=shiftAll(d,shift);
  Object.assign(d.calendar,JSON.parse(JSON.stringify(o.cal||{}))); d.config.routines=JSON.parse(JSON.stringify(RT)); if(o.plan) o.plan(d);
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  const mk=(name,dev,index)=>{ let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const X=S.bootDevice({name,dev,db,clock,sched,family:FX.family,indexPath:index,globals:{Math:M}});
    X.run('__HARNESS_NO_RENDER=true; var __toasts=[]; gwShowToast=function(m){ __toasts.push(String(m)); };'); return X; };
  const idx=o.base?BASE_PATH:INDEX;
  const A=mk(o.name+" A","dev_a",idx); A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  const B=mk(o.name+" B","dev_b",o.bBase?BASE_PATH:idx); B.run('haMomOff(); tab="kids";'); await flush(5000);
  const W={A,B,db,clock,flush,sun,wk:()=>db.get("ha_active_wk")||A.get("WK"),devs:[A,B],
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
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; for(const X of W.devs) X.fn("dayRollCheck")(); await flush(200000); };
  W.at=async(iso,h,m)=>{ clock.now=hm(iso,h,m); for(const X of W.devs) X.fn("dayRollCheck")(); await flush(2000); };
  return W;
}
// a school day: the kid ticks both morning steps on B at 8:00, the cards are played, the afternoon list and chores at 4:30
const tickDay=async(W,iso)=>{ await W.at(iso,8,0); W.B.run('day=_todayDay; toggleMorningStep("kid_a",0); toggleMorningStep("kid_a",1); toggleMorningStep("kid_b",0);'); await W.flush(3000);
  await W.at(iso,16,30); W.B.run('day=_todayDay; toggleRtStep("afternoon","kid_a",0); toggleRtStep("chores","kid_a",0); toggleRtStep("chores","kid_b",0);'); await W.flush(3000); };
const playWeek=async(W,mon)=>{ for(let i=0;i<5;i++){ const iso=addDays(mon,i); if(i) await W.roll(iso); await tickDay(W,iso); await W.play(iso,dnOf(iso),24*60); } };
// what a device's lists say about today
const LP=`(function(){ var d=_todayDay, o={wk:activeWk(),gapTok:(typeof lwGap==="function")?lwGap():null,slots:activeSlots().length};
  ["kid_a","kid_b"].forEach(function(k){ o[k]={m0:mStepDoneOn(k,d,0),m1:k==="kid_a"?mStepDoneOn(k,d,1):null,morning:morningComplete(k,d),aft:rtDoneOn("afternoon",k,d,0),ch:rtDoneOn("chores",k,d,0),
    earned:bankEarnedDay(k,d),week:bankEarnedWeek(k),total:earnedDayTotal(k,d),held:bankHeldToday(k,d)}; });
  o.monIso=routineDateISO("monday"); o.friIso=routineDateISO("friday"); o.pureMon=(typeof lwDateISO==="function")?lwDateISO("monday"):null; o.monOff=!!(o.pureMon&&smapIsOff(o.pureMon)); o.friOff=!!(o.pureMon&&smapIsOff(_amIsoAdd(o.pureMon,4))); o.today=_todayDay; try{ o.prev=_prevWkKey(); o.streak=lsStreak("morning","kid_a"); }catch(e){ o.prev="CRASH "+e; }
  return JSON.stringify(o); })()`;
const lp=X=>JSON.parse(X.run(LP));
const WEEKW=/^(set|update|remove|inc|transaction|push)\s+week\d+(\/|$)|^update\s+\S*\s+(.*,)?week\d+\//;   // a write under a week* path (an update at the root lists its keys)
const logSince=(W,m)=>W.db.log.slice(m).map(l=>l.op+" "+l.path+(l.keys?" "+l.keys.join(","):""));

// one gap day on a world: fresh, tick, pays once, the other device sees it, filed under the list week; week1 untouched
async function gapDay(W,iso,opt){
  opt=opt||{};
  await W.at(iso,9,0);
  const tok="gap"+monOf(iso), dn=dnOf(iso), lbl=(opt.lbl||"")+" "+dn.slice(0,3)+" "+iso.slice(5);
  const b0=lp(W.B), a0=lp(W.A);
  if(opt.paused){
    ok(lbl+": a pause-everything day — no list shows (activeSlots() empty), the one-day rule; the list week is still "+tok,b0.slots===0&&a0.slots===0&&b0.wk===tok,[b0.slots,b0.wk]);
    return;
  }
  ok(lbl+": both devices' list week is "+tok+" (the board stays "+W.wk()+")",b0.wk===tok&&a0.wk===tok&&b0.gapTok===tok&&W.wk()!==tok,[b0.wk,a0.wk,W.wk()]);
  ok(lbl+": the lists start un-ticked, \"earned today\" 0, the ⭐ total 0, both devices",["kid_a","kid_b"].every(k=>[b0,a0].every(P=>!P[k].m0&&!P[k].morning&&!P[k].aft&&!P[k].ch&&P[k].earned===0&&P[k].total===0)),b0);
  ok(lbl+": _prevWkKey() meets the gap week without crashing — it returns null (no earlier list week is looked up: slice 4); the 🔥 streak still counts ("+b0.streak+")",b0.prev===null&&typeof b0.streak==="number",[b0.prev,b0.streak]);
  ok(lbl+": the list week's dates are its own (Monday "+b0.pureMon+"); a calendar day off has none, as in a built week's own dates",b0.pureMon.replace(/-/g,"")===monOf(iso)&&b0.monIso===((b0.monOff&&b0.today!=="monday")?null:b0.pureMon)&&b0.friIso===((b0.friOff&&b0.today!=="friday")?null:addDays(b0.pureMon,4)),b0);   // (today always reads its own date)
  const bank0=Object.keys(W.db.get("bank/kid_a/adjustments")||{}).length;
  const pay=+W.B.run('day=_todayDay; rtDailyPay("morning","kid_a",0,morningStepsFor("kid_a")[0])');   // what the row pays today (a daily's pay steps down after missed days — the list week's own days)
  const m=W.db.log.length;
  W.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await W.flush(4000);
  const w=logSince(W,m), b1=lp(W.B), a1=lp(W.A);
  const adj=W.db.get("bank/kid_a/adjustments")||{}, newAdj=Object.keys(adj).slice(bank0).map(k=>adj[k]);
  const slv=W.db.get(tok+"/sl/"+tok+"_"+dn+"_kid_a_mstep0");
  ok(lbl+": a tick on the kid's tablet writes "+tok+"/sl ("+tok+"_"+dn+"_kid_a_mstep0) and pays "+pay+" ⭐ once"+(pay?", stamped wk:"+tok:" (no wages entry)"),!!(slv&&slv.done)&&(pay>0?newAdj.length===1&&newAdj[0].wk===tok&&newAdj[0].day===dn&&newAdj[0].amount===pay:newAdj.length===0),[pay,slv,newAdj,w.slice(0,6)]);
  ok(lbl+": the click-off log files it under routineLog/kid_a/"+tok+"/"+dn,Object.values(W.db.get("routineLog/kid_a/"+tok+"/"+dn)||{}).some(r=>r&&r.act==="on"));
  ok(lbl+": Mom's tablet shows it ticked; \"earned today\" and the ⭐ total are "+pay+" on both",a1.kid_a.m0===true&&b1.kid_a.m0===true&&a1.kid_a.earned===pay&&b1.kid_a.earned===pay&&b1.kid_a.total===pay&&a1.kid_a.total===pay,[a1.kid_a,b1.kid_a]);
  ok(lbl+": nothing written under any week* path by the tick",!w.some(x=>WEEKW.test(x)),w.filter(x=>WEEKW.test(x)));
  // a second tap un-ticks and takes the star back — today's own, not last week's
  const m2=W.db.log.length; W.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await W.flush(4000); const b2=lp(W.B);
  ok(lbl+": tapped again it un-ticks today's and the star comes back off today's (earned 0), nothing under week*",b2.kid_a.m0===false&&b2.kid_a.earned===0&&!logSince(W,m2).some(x=>WEEKW.test(x)));
  W.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await W.flush(3000);
}

(async function(){
  // ═══ 2. gap worlds ═══
  console.log("2 · gap worlds — two devices");
  const WORLDS=[
    {k:"a1",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,false),days:["2026-11-15","2026-11-17","2026-11-20","2026-11-21"]},
    {k:"a2",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),days:["2026-11-15","2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21"],back:"2026-11-23"},
    {k:"b",cal:HOL("2026-11-16","2026-11-20"),days:["2026-11-16","2026-11-19","2026-11-21"]},
    {k:"c1",cal:HOL("2026-11-16","2026-11-27"),plan:d=>gap(d,2,2,true),days:["2026-11-17","2026-11-22","2026-11-24","2026-11-28"]},
    {k:"d1",cal:HOL("2026-11-18","2026-11-27"),days:["2026-11-23","2026-11-24","2026-11-25","2026-11-27"],realWeek2:true},
    {k:"e1",cal:VAC("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),days:["2026-11-15","2026-11-16","2026-11-18","2026-11-21"],paused:["2026-11-16","2026-11-18"]},
    {k:"g",plan:endPlan,days:["2026-11-15","2026-11-16","2026-11-17","2026-11-21","2026-11-24"]},
  ];
  const keep={};
  for(const D of WORLDS){
    console.log("  — world "+D.k);
    const W=await world({name:D.k,cal:D.cal,plan:D.plan});
    await playWeek(W,"2026-11-09");
    if(D.realWeek2){ await W.roll("2026-11-14"); await W.roll("2026-11-15"); await W.roll("2026-11-16"); await tickDay(W,"2026-11-16"); await W.play("2026-11-16","monday",24*60); await W.roll("2026-11-17"); await tickDay(W,"2026-11-17"); await W.play("2026-11-17","tuesday",24*60); }
    const lastWk=W.wk(); const snap=JSON.stringify(W.db.get(lastWk)); const snapLog=JSON.stringify(W.db.get("routineLog/kid_a/"+lastWk));
    const snapBank=JSON.stringify(Object.values(W.db.get("bank/kid_a/adjustments")||{}).filter(a=>a.wk===lastWk));
    const m0=W.db.log.length, toks=new Set();
    for(const iso of D.days){ let r=hm(iso,0,0)+30000; if(W.clock.now<r) await W.roll(iso); await gapDay(W,iso,{lbl:D.k,paused:(D.paused||[]).indexOf(iso)>=0}); toks.add("gap"+monOf(iso)); }
    const all=logSince(W,m0), weekW=all.filter(x=>WEEKW.test(x));
    ok(D.k+": across the gap days ("+D.days.length+") NOTHING was written under any week* path ("+all.length+" writes in all)",weekW.length===0,weekW.slice(0,6));
    ok(D.k+": last school week ("+lastWk+") is exactly as it was — its node, its click-off log, its wages",JSON.stringify(W.db.get(lastWk))===snap&&JSON.stringify(W.db.get("routineLog/kid_a/"+lastWk))===snapLog&&JSON.stringify(Object.values(W.db.get("bank/kid_a/adjustments")||{}).filter(a=>a.wk===lastWk))===snapBank);
    if(D.k==="c1") ok("c1: the two break weeks are two list weeks ("+[...toks].join(", ")+")",toks.size===2&&toks.has("gap20261116")&&toks.has("gap20261123"));
    if(D.k==="a2") keep.a2=W;
  }

  // ═══ the year turn: Dec 20 → Jan 2, two weeks across the new year ═══
  console.log("  — the Dec 20 → Jan 2 two-week break across the year turn");
  { const W=await world({name:"year",shift:35,cal:HOL("2026-12-21","2027-01-01"),plan:d=>gap(d,2,2,true)});
    await playWeek(W,"2026-12-14");
    const snap=JSON.stringify(W.db.get("week1")), m0=W.db.log.length;
    for(const iso of ["2026-12-20","2026-12-23","2026-12-27","2026-12-31","2027-01-01","2027-01-02"]){ await W.roll(iso); await gapDay(W,iso,{lbl:"year"}); }
    ok("year turn: Dec 31 and Jan 1 are one list week (gap20261228, Monday 2026-12-28); the holiday's other days read no date, as in a built week (today, Fri Jan 1, its own)",(await (async()=>{ W.clock.now=hm("2027-01-01",10,0); const p=lp(W.B); return p.wk==="gap20261228"&&p.pureMon==="2026-12-28"&&p.monIso===null&&p.friIso==="2027-01-01"; })()));
    ok("year turn: nothing under week*, week 1 untouched",!logSince(W,m0).some(x=>WEEKW.test(x))&&JSON.stringify(W.db.get("week1"))===snap);
    await W.roll("2027-01-03"); await W.at("2027-01-04",9,0);
    ok("year turn: Sunday Jan 3 the next school week builds and the lists are back on it",W.wk()!=="week1"&&lp(W.B).wk===W.wk(),[W.wk(),lp(W.B).wk]);
  }

  // ═══ 3. the first school week back (a2): cards identical to the code before; the archive of week 1 identical; lists on WK ═══
  console.log("3 · the first school week back");
  { const NEW=keep.a2, OLD=await world({name:"a2 before",base:true,cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true)});
    await playWeek(OLD,"2026-11-09");
    for(const iso of ["2026-11-15","2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21"]){ await OLD.roll(iso); await OLD.at(iso,9,0);
      OLD.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await OLD.flush(4000); OLD.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await OLD.flush(3000); OLD.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await OLD.flush(3000); }
    for(const W of [OLD,NEW]){ await W.roll("2026-11-22"); await W.roll("2026-11-23"); await W.at("2026-11-23",9,0); }
    const cards=W=>W.board().map(t=>[t.id,t.who,t.day,t.time,t.dur,t.title,t.subjectKey].join("|")).sort();
    const a=cards(OLD), b=cards(NEW);
    ok("a2: the week after the break is built on both ("+NEW.wk()+")",OLD.wk()===NEW.wk()&&NEW.wk()==="week3");
    ok("a2: its cards are identical to the code before — ids, kids, days, times, lengths, titles ("+b.length+" of "+a.length+")",JSON.stringify(a)===JSON.stringify(b)&&b.length>40,a.filter((x,i)=>x!==b[i]).slice(0,3));
    const arch=W=>{ const e=W.db.get("archive/week1")||{}; return JSON.stringify({t:e.tasks,c:e.checked,h:e.history,d:e.dates,p:e.slot_points}); };
    ok("a2: the archive of week 1 (tasks, checks, history, dates, pools) identical to the code before",arch(OLD)===arch(NEW)&&arch(NEW).length>1000);
    const p=lp(NEW.B);
    ok("a2: the lists are back on the board's week ("+p.wk+"), un-ticked for the new Monday",p.wk==="week3"&&p.gapTok===null&&!p.kid_a.m0);
    NEW.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await NEW.flush(4000);
    ok("a2: a tick on the first Monday back lands in week3/sl, as on any school day",!!(NEW.db.get("week3/sl/week3_monday_kid_a_mstep0")||{}).done);
    ok("a2: the gap week's node is still there, untouched by the build (gap20261116/sl)",Object.keys(NEW.db.get("gap20261116/sl")||{}).length>0);
    ok("a2 (code before, for the record): its break taps went into week1/sl",Object.keys(OLD.db.get("week1/sl")||{}).some(k=>/^week1_(sunday|saturday)_kid_a_mstep0$/.test(k)));
  }

  // ═══ 4. a one-day holiday inside a real week, and 6. 300 random normal weeks — byte-identical to the code before ═══
  console.log("4 · a holiday inside a real week · 6 · 300 random normal weeks — byte-identical");
  { const OLD=await world({name:"normal before",base:true}), NEW=await world({name:"normal after"});
    const tree=W=>{ const r=JSON.parse(JSON.stringify(W.db.tree.root)); return JSON.stringify(r); };
    for(const W of [OLD,NEW]){ await tickDay(W,"2026-11-09"); await W.play("2026-11-09","monday",24*60); await W.roll("2026-11-10"); }
    // the one-day holiday added on Tuesday after the week was built
    for(const W of [OLD,NEW]){ W.A.run('calendarData.holidays=Object.assign({},calendarData.holidays,{hx:{name:"Teacher Day",date:"2026-11-10",pause:"school"}});'); W.B.run('calendarData.holidays=Object.assign({},calendarData.holidays,{hx:{name:"Teacher Day",date:"2026-11-10",pause:"school"}});'); await tickDay(W,"2026-11-10"); }
    ok("holiday inside a real week: the lists, every key and write, and the whole database identical to the code before",lp(OLD.B)&&JSON.stringify(lp(OLD.B))===JSON.stringify(lp(NEW.B))&&tree(OLD)===tree(NEW)&&lp(NEW.B).wk==="week1"&&NEW.B.run("!!scheduleBreakToday()"),[lp(OLD.B),lp(NEW.B)]);
    for(const W of [OLD,NEW]) for(const X of W.devs) X.run('delete calendarData.holidays.hx;');
    const orig=JSON.parse(NEW.A.run("JSON.stringify(weekData.tasks)"));
    let seed=20261124; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const WD=["monday","tuesday","wednesday","thursday","friday","saturday"], ISO={monday:"2026-11-09",tuesday:"2026-11-10",wednesday:"2026-11-11",thursday:"2026-11-12",friday:"2026-11-13",saturday:"2026-11-14"};
    const RENDER=`(function(){ var o={}; ["kid_a","kid_b"].forEach(function(k){ var sv0=kid; o[k]={pts:kcPointsHTML(k),lists:(typeof kcListsHTML==="function")?kcListsHTML(k):"",chores:(typeof kcChoresHTML==="function")?kcChoresHTML(k):"",
      d:bankEarnedDay(k,_todayDay),w:bankEarnedWeek(k),h:bankHeldToday(k,_todayDay),t:earnedDayTotal(k,_todayDay),ln:rtLateDays("chores",k,0),m:morningComplete(k,_todayDay),iso:routineDateISO("wednesday"),rot:_rtRotDayNum("thursday"),cad:cadDateNum("friday")}; kid=sv0; }); return JSON.stringify(o); })()`;
    const TICKS=[['toggleMorningStep("kid_a",0)'],['toggleMorningStep("kid_a",1)'],['toggleMorningStep("kid_b",0)'],['toggleRtStep("afternoon","kid_a",0)'],['toggleRtStep("chores","kid_b",0)'],['toggleRtStep("chores","kid_a",0)']];
    let diffs=0, first=null, nW=0, nR=0;
    for(let it=0;it<300;it++){
      const tasks=JSON.parse(JSON.stringify(orig)), ck={};
      tasks.forEach(t=>{ if(rnd()<0.4) t.day=WD[Math.floor(rnd()*5)]; if(rnd()<0.6) ck[t.id]="9:"+String(10+Math.floor(rnd()*40))+" AM"; });
      const today=WD[Math.floor(rnd()*6)], mom=rnd()<0.5, onB=rnd()<0.6;
      const set='weekData.tasks='+JSON.stringify(tasks)+'; checked='+JSON.stringify(ck)+'; _todayDay="'+today+'"; day="'+today+'"; tab="kids"; ';
      const ticks=TICKS.filter(()=>rnd()<0.4).map(x=>x[0]);
      const rows=[];
      for(const W of [OLD,NEW]){ W.clock.now=hm(ISO[today],8+(it%10),(it*7)%60); for(const X of W.devs) X.run(set); W.A.run(mom?"haMomOn();":"haMomOff();"); W.B.run("haMomOff();");
        const X=onB?W.B:W.A, m=W.db.log.length; ticks.forEach(t=>X.run("day=_todayDay; "+t+";")); await W.flush(3000);
        rows.push({w:logSince(W,m).join("|"),ra:W.A.run(RENDER),rb:W.B.run(RENDER)}); }
      const [o,n]=rows;
      if(o.w!==n.w||o.ra!==n.ra||o.rb!==n.rb){ diffs++; if(!first){ let i=0; const a=o.w+o.ra+o.rb, b=n.w+n.ra+n.rb; while(a[i]===b[i]) i++; first={it,today,at:i,a:a.slice(Math.max(0,i-150),i+150),b:b.slice(Math.max(0,i-150),i+150)}; } }
      if(it%30===29&&tree(OLD)!==tree(NEW)){ diffs++; if(!first) first={it,tree:true}; }
      nW+=n.w?n.w.split("|").length:0; nR+=ticks.length;
    }
    ok("300 weeks, two devices: every list write (path), every list render (⭐ card, lists, chores), every \"earned\" number and list date identical to the code before",diffs===0,first);
    ok("…and the whole database (values) identical every 30 weeks and at the end",tree(OLD)===tree(NEW));
    ok("…the weeks really ticked and wrote ("+nR+" taps, "+nW+" writes)",nR>400&&nW>800,[nR,nW]);
  }

  // ═══ 5. an older build on the second device during a gap ═══
  console.log("5 · an older build on the kid's tablet");
  { const W=await world({name:"old B",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),bBase:true});
    await playWeek(W,"2026-11-09");
    for(const iso of ["2026-11-14","2026-11-15","2026-11-16","2026-11-17"]) await W.roll(iso); await W.at("2026-11-17",9,0);
    const a0=lp(W.A), oldB=JSON.parse(W.B.run('JSON.stringify({wk:activeWk(),m0:mStepDoneOn("kid_a","tuesday",0),earned:bankEarnedDay("kid_a","tuesday")})'));
    ok("older build: Mom's tablet (this build) reads the gap week, fresh",a0.wk==="gap20261116"&&!a0.kid_a.m0);
    ok("older build: the kid's tablet (the build before) still reads last week (week1): last Tuesday's tick shows done, last Tuesday's wages as today's — as before this slice",oldB.wk==="week1"&&oldB.m0===true&&oldB.earned>0,oldB);
    const m=W.db.log.length; W.A.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await W.flush(4000);
    const bb=JSON.parse(W.B.run('JSON.stringify({m0:mStepDoneOn("kid_a","tuesday",0)})'));
    ok("older build: a tick on Mom's tablet goes to the gap week only; the older tablet ignores the gap node (it still shows last Tuesday's)",!!(W.db.get("gap20261116/sl/gap20261116_tuesday_kid_a_mstep0")||{}).done&&bb.m0===true&&!logSince(W,m).some(x=>WEEKW.test(x)));
  }

  // ═══ 7. the seconds before a real week builds ═══
  console.log("7 · the hold");
  const LOADING="One moment \u2014 this week is loading";
  const tap=(X,what)=>{ X.run("__toasts=[]; day=_todayDay; "+(what||'toggleMorningStep("kid_a",0)')+";"); return JSON.parse(X.run("JSON.stringify(__toasts)")); };
  const slWrites=(W,m)=>logSince(W,m).filter(x=>/\/sl( |\/|$)|^update \S*\/sl /.test(x));
  { const W=await world({name:"hold sunday"});
    await playWeek(W,"2026-11-09"); await W.roll("2026-11-14");
    W.clock.now=hm("2026-11-15",0,0)+5000;   // Sunday 00:00:05 — the clock has turned, the roll hasn't run yet
    const m=W.db.log.length;
    const t1=tap(W.B), t2=tap(W.B,'toggleRtStep("chores","kid_b",0)');
    ok("Sunday 00:00, before the build: the board is week1, a week for today is due — a tap says \""+LOADING+"\" and writes nothing (morning and chores)",JSON.stringify(t1)===JSON.stringify([LOADING])&&JSON.stringify(t2)===JSON.stringify([LOADING])&&logSince(W,m).length===0&&lp(W.B).wk==="week1",[t1,t2,logSince(W,m)]);
    await W.roll("2026-11-15");
    const m2=W.db.log.length, t3=tap(W.B); await W.flush(4000);
    ok("…the roll builds week 2; the same tap now lands in week2/sl (week2_sunday_kid_a_mstep0), no line",W.wk()==="week2"&&t3.length===0&&!!(W.db.get("week2/sl/week2_sunday_kid_a_mstep0")||{}).done,[W.wk(),t3]);
    ok("…nothing landed in week1/sl or any gap week across it",slWrites(W,m).every(x=>/ week2\/sl/.test(x))&&!Object.keys(W.db.tree.root).some(k=>/^gap/.test(k)),slWrites(W,m)); }
  { const W=await world({name:"hold monday"});
    await playWeek(W,"2026-11-09"); await W.roll("2026-11-14");
    const m=W.db.log.length;
    W.clock.now=hm("2026-11-16",7,0); W.B.fn("dayRollCheck")();   // the kid's tablet wakes Monday 7:00 (nobody built on Sunday): its roll starts the build
    const t1=tap(W.B);
    ok("a tablet waking on Monday, its build under way: a tap says \""+LOADING+"\" and writes no tick",JSON.stringify(t1)===JSON.stringify([LOADING])&&slWrites(W,m).length===0,[t1,slWrites(W,m)]);
    await W.flush(200000); for(const X of W.devs) X.fn("dayRollCheck")(); await W.flush(5000);
    const t2=tap(W.B); await W.flush(4000);
    ok("…once week 2 lands the tap goes to week2/sl (week2_monday_kid_a_mstep0)",W.wk()==="week2"&&t2.length===0&&!!(W.db.get("week2/sl/week2_monday_kid_a_mstep0")||{}).done,[W.wk(),t2]);
    ok("…nothing in week1/sl or a gap week",slWrites(W,m).every(x=>/ week2\/sl/.test(x))&&!Object.keys(W.db.tree.root).some(k=>/^gap/.test(k)),slWrites(W,m)); }
  { const W=await world({name:"hold stuck"});
    await playWeek(W,"2026-11-09"); await W.roll("2026-11-14");
    for(const X of W.devs) X.run('autoBuildOnDayRoll=function(){ return false; }; autoGenerateWeekIfNeeded=function(){};');   // a build that never comes (offline, a lock never released)
    W.clock.now=hm("2026-11-15",8,0); const m=W.db.log.length;
    const t1=tap(W.B); W.clock.now+=4*60*1000; const t2=tap(W.B); W.clock.now+=60*1000+1000; const t3=tap(W.B); await W.flush(4000);
    ok("a build that never comes: refused at the first tap and 4 minutes later, with the line",JSON.stringify(t1)===JSON.stringify([LOADING])&&JSON.stringify(t2)===JSON.stringify([LOADING]));
    ok("…from 5 minutes after the first tap the lists don't wait any more: the tap goes where it went before this slice (week1/sl, week1_sunday_kid_a_mstep0) — the family is never trapped",t3.length===0&&!!(W.db.get("week1/sl/week1_sunday_kid_a_mstep0")||{}).done,[t3,slWrites(W,m)]); }
  { const W=await world({name:"hold off"});
    await playWeek(W,"2026-11-09");
    ok("a normal day: lwHold() is false, no line (the 300 weeks above ran every tap through it)",W.B.run("lwHold()")===false&&tap(W.B).length===0); }

  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed  ("+Math.round((Date.now()-T0)/1000)+" s)");
  if(fail) process.exit(1);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
