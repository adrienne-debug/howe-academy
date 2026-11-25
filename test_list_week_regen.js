/*
 * 📅 LISTWK — a SAME-WEEK regenerate while the list week is a gap week (hub review of break week slice 2, 2026-11-25).
 *
 * gwCommit's same-week path (Mom's 🔄 Regenerate → schedRegenerateNow) re-saves the lists: snapSl = ld(WK+"_sl") || slState, then
 * slState = snapSl, sv(WK+"_sl"), and a WHOLE-NODE db.ref(WK+"/sl").set(snapSl). Before slice 2 the week's own sl listener kept
 * ld(WK+"_sl") fresh and slState WAS that map, so it rewrote what the server had. In a gap week the listener is on gap…/sl, so:
 *   (a) the device's copy of the board week's lists is frozen — a regenerate .set()s it over ticks other tablets made since
 *       (an older-build tablet still writes the board week; a carried chore's amToggle writes <fromWk>/sl);
 *   (b) with no local copy (cleared storage) the fallback is the GAP map — the gap week's ticks written whole over week*;
 *   (c) slState is swapped for last week's map while the gap listener stays silent — the lists read un-ticked and a re-tap pays twice.
 * The 🔄 button is not drawn on a gap day (the Schedule tab shows the "No school week planned" card — break week slice 1), so the
 * hole is reachable only from a screen drawn before the flip or a direct call; it is closed in gwCommit itself.
 *
 * Proved here (the whole app in the sandbox, two tablets: A = this build with Mom, B = the build before, a kid's): on a break
 * Tuesday, after B ticked rows in the board week that A never heard and A ticked gap rows, A runs schedRegenerateNow():
 *   nothing is written under <boardWeek>/sl, the server keeps B's ticks, A's lists still read the gap ticks, a re-tap un-ticks (it
 *   never pays a second time); the same with A's local copy of the board week cleared; the regenerate itself still runs (cards
 *   re-laid, checked kept). A normal week's regenerate writes <WK>/sl exactly as before (test_list_week.js's 300 weeks and the
 *   strip check cover the rest).
 * No kid or family names: the fixture is synthetic.   run: node test_list_week_regen.js
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
// the build before slice 2 (= this file with test_fixtures/list_week_changes.json stripped): the older tablet
function strip(src){ for(let i=HUNKS.length-1;i>=0;i--){ const [o,n]=HUNKS[i]; if(count(src,n)!==1) throw new Error("hunk "+i+" not found once"); src=src.split(n).join(o); } return src; }
const BASE=strip(SRC);
const BASE_PATH=path.join(os.tmpdir(),"list_week_regen_base_"+process.pid+".html");
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


const slKeys=W=>Object.keys(W.db.get("week1/sl")||{}).sort();
async function scene(o){
  const W=await world({name:"regen "+o.tag,cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true),bBase:true});
  await playWeek(W,"2026-11-09");
  for(const iso of ["2026-11-14","2026-11-15","2026-11-16","2026-11-17"]) await W.roll(iso); await W.at("2026-11-17",9,0);
  // B — the build before — still files under week 1: its kid ticks a row A never hears (A's lists listen to gap20261116 now)
  const k0=slKeys(W); W.B.run('day=_todayDay; toggleRtStep("afternoon","kid_b",0);'); await W.flush(4000);   // a row nobody ticked last Tuesday
  const bKey=slKeys(W).filter(k=>k0.indexOf(k)<0).find(k=>/^week1_tuesday_kid_b_/.test(k)&&/step0$/.test(k))||"(none)";
  // A — Mom's tablet, this build — ticks two gap rows for kid_a
  W.A.run('day=_todayDay; toggleMorningStep("kid_a",0); toggleMorningStep("kid_a",1);'); await W.flush(4000);
  if(o.cleared) W.A.run('HA_LS.removeItem("week1_sl");');
  const before=slKeys(W), serverHasB=before.indexOf(bKey)>=0, aKnowsB=W.A.run('!!(ld("week1_sl")||{})["'+bKey+'"]');
  const bank0=Object.values(W.db.get("bank/kid_a/adjustments")||{}).filter(a=>a.wk==="gap20261116"&&a.day==="tuesday").length;
  const m=W.db.log.length;
  W.A.run('__toasts=[]; day=_todayDay; schedRegenerateNow();'); await W.flush(60000);
  const w=logSince(W,m), slW=w.filter(x=>/^\S+ week1\/sl( |\/|$)|^update \S*\s+(.*,)?week1\/sl/.test(x));
  const after=slKeys(W), aState=JSON.parse(W.A.run('JSON.stringify({gapKeys:Object.keys(slState).filter(function(k){ return /^gap20261116_/.test(k); }).length,wkKeys:Object.keys(slState).filter(function(k){ return /^week1_/.test(k); }).length,m0:mStepDoneOn("kid_a","tuesday",0),m1:mStepDoneOn("kid_a","tuesday",1),wk:activeWk(),regen:__toasts.join(" | ")})'));
  W.A.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await W.flush(4000);
  const re=JSON.parse(W.A.run('JSON.stringify({m0:mStepDoneOn("kid_a","tuesday",0)})'));
  const bank1=Object.values(W.db.get("bank/kid_a/adjustments")||{}).filter(a=>a.wk==="gap20261116"&&a.day==="tuesday");
  console.log("  TRACE "+o.tag+": server week1/sl keys before "+before.length+" (B's tick there: "+serverHasB+", A's local copy has it: "+aKnowsB+") → after "+after.length+
    "; writes under week1/sl by the regenerate: "+JSON.stringify(slW)+"; A's slState after: "+JSON.stringify(aState)+"; the re-tap of kid_a's first row → ticked "+re.m0+
    ", kid_a's gap wages entries on Tuesday "+bank0+" → "+bank1.length+" ("+bank1.map(a=>a.amount+" "+a.note).join(", ")+")");
  return {W,before,after,slW,aState,re,bank0,bank1,serverHasB,aKnowsB,bKey,w};
}

(async function(){
  for(const o of [{tag:"(a)+(c) a frozen copy"},{tag:"(b) cleared storage",cleared:true}]){
    console.log(o.tag);
    const R=await scene(o);
    ok(o.tag+": (set-up) a break Tuesday; B's tick is on the server in week1/sl and A never heard it",R.serverHasB&&!R.aKnowsB&&R.aState.wk==="gap20261116");
    ok(o.tag+": the regenerate ran (week 1 re-laid: its tasks written)",R.w.some(x=>/^set week1\/tasks/.test(x)),R.w.filter(x=>/week1/.test(x)).slice(0,6));
    ok(o.tag+": the regenerate wrote NOTHING under week1/sl",R.slW.length===0,R.slW);
    ok(o.tag+": the server's week1/sl is exactly as before — B's tick kept, no gap key in it",JSON.stringify(R.after)===JSON.stringify(R.before)&&R.after.indexOf(R.bKey)>=0&&!R.after.some(k=>/^gap/.test(k)),[R.before.length,R.after.length]);
    ok(o.tag+": A's lists still read the gap week's ticks (slState kept the gap map)",R.aState.m0===true&&R.aState.m1===true&&R.aState.gapKeys>0,R.aState);
    ok(o.tag+": a re-tap un-ticks — no row paid twice (one wages entry per row; the un-tick takes its star back)",R.re.m0===false&&R.bank1.filter(a=>a.amount>0).length===R.bank0,R.bank1.map(a=>a.amount));
  }
  // a normal week: the regenerate still writes <WK>/sl from the week's own map, as before
  { const W=await world({name:"regen normal"}); await tickDay(W,"2026-11-09"); await W.play("2026-11-09","monday",24*60); await W.roll("2026-11-10"); await W.at("2026-11-10",9,0);
    W.B.run('day=_todayDay; toggleMorningStep("kid_a",0);'); await W.flush(4000);
    const m=W.db.log.length; W.A.run('day=_todayDay; schedRegenerateNow();'); await W.flush(60000);
    const slW=logSince(W,m).filter(x=>/^set week1\/sl$|^set week1\/sl /.test(x));
    ok("a normal week: the regenerate re-saves week1/sl whole from the week's own map, as before (one set), and the lists keep their ticks",slW.length===1&&W.A.run('mStepDoneOn("kid_a","tuesday",0)')===true&&W.A.run("activeWk()")==="week1",[slW,logSince(W,m).filter(x=>/sl/.test(x)).slice(0,4)]); }
  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed  ("+Math.round((Date.now()-T0)/1000)+" s)");
  if(fail) process.exit(1);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
