/*
 * 📅 BWLABEL — break week slice 3: Mom's and Dad's week pages say what week it is (DESIGN_break_week_2026-11-24 §5 row 3;
 * her "Yes, start step 3" 2026-11-25, with her answers 1, 4 and 5).
 *
 * The live case: a week the board doesn't hold (a break week, a week after the plan ends) builds no week, so the board keeps
 * LAST school week. Mom's 🗓 Week grid said "This week · Week N" over last school week's cards with today's weekday lit.
 *
 * Proved here — the WHOLE app runs in the vm sandbox of test_demo_week.js on the synthetic demo family:
 *   1. The change is where it says (test_fixtures/break_week_3_changes.json: every hunk, once); stripped = the code before.
 *   2. World a2 (a calendar break over the plan's skipped week): the Week grid's line, the one tap to last school week (labelled,
 *      no day lit), the ‹ › steps, Mom's check-off path from there exactly as before (her answer 5).
 *   3. World g (the plan has ended, no calendar break): "No school week planned", no back date.
 *   4. World c1, its second break week: the break's own dates; a day off on the first day back moves the back date.
 *   5. Fail open: the plan not loaded → no label at all; the plan and the week's own dates disagree → no dates for last week.
 *   6. ZERO database writes from any of it.
 *   7. 300 random normal weeks (and a one-day holiday inside a real week): every screen touched renders byte-identical to the
 *      code before.
 * No kid or family names: the fixture is synthetic.   run: node test_break_week_3.js
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path"), os=require("os");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const HUNKS=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","break_week_3_changes.json"),"utf8"));
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
const txt=h=>String(h||"").replace(/<style[\s\S]*?<\/style>/g,"").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();

// ── 1. the change, and the same file with it stripped (= the code before this slice) ──
function strip(src){ for(let i=HUNKS.length-1;i>=0;i--){ const [o,n]=HUNKS[i]; if(count(src,n)!==1) throw new Error("hunk "+i+" not found once: "+n.slice(0,120)); src=src.split(n).join(o); } return src; }
console.log("1 · the change is where it should be");
ok("every BWLABEL hunk is in index.html exactly once ("+HUNKS.length+")",HUNKS.every(h=>count(SRC,h[1])===1));
const BASE=strip(SRC);
ok("stripped: no BWLABEL left, the file shorter",BASE.indexOf("BWLABEL")<0&&BASE.indexOf("bwlInfo")<0&&BASE.length<SRC.length);
{ const B=SRC.slice(SRC.indexOf("// 📅 BWLABEL_START"),SRC.indexOf("// 📅 BWLABEL_END")).replace(/\/\/[^\n]*/g,"");
  ok("the block writes nothing and reads no database (display only)",B.length>2000&&!/\.set\(|\.update\(|\.remove\(|\.push\(\)|transaction|obSet|obInc|obRemove|db\.ref|\bsv\(|HA_LS\.setItem/.test(B)); }
ok("one question decides it: bwlInfo() asks boardWeekIsThisWeek() first and is null on a school week",/function bwlInfo\(\)\{\n  try\{\n    if\(typeof boardWeekIsThisWeek!=="function"\|\|boardWeekIsThisWeek\(\)\) return null;/.test(SRC));
const BASE_PATH=path.join(os.tmpdir(),"break_week_3_base_"+process.pid+".html");
fs.writeFileSync(BASE_PATH,BASE);

// ── plan surgery on the fixture copy (the design's sandbox worlds, as test_list_week.js builds them) ──
function gap(db,fromWk,weeks,relabel){
  const c=db.curriculum;
  for(const kid of Object.keys(c.weekDays)){ const wd=c.weekDays[kid], out={};
    for(const lbl of Object.keys(wd)){ const n=+lbl.replace(/\D/g,"");
      if(n>=fromWk){ wd[lbl].forEach(dn=>{ const l=c.lessons[kid][dn]; if(l&&l.date) l.date=addDays(l.date,7*weeks); if(relabel&&l) l.week="Wk "+(n+weeks); }); out[relabel?"Wk "+(n+weeks):lbl]=wd[lbl]; }
      else out[lbl]=wd[lbl]; }
    c.weekDays[kid]=out; }
}
const endPlan=db=>{ const c=db.curriculum; for(const k of Object.keys(c.weekDays)) for(const l of Object.keys(c.weekDays[k])) if(l!=="Wk 1"){ c.weekDays[k][l].forEach(dn=>delete c.lessons[k][dn]); delete c.weekDays[k][l]; } };
const HOL=(s,e,more)=>({holidays:Object.assign({h1:{name:"Fall Break",start:s,end:e,pause:"school"}},more||{})});
const RT={morning:{kid_a:[{label:"Make bed",emoji:"B",pts:1,cad:"daily"},{label:"Brush teeth",emoji:"T",pts:1,cad:"daily"}],kid_b:[{label:"Make bed",emoji:"B",pts:2,cad:"daily"}]},
  afternoon:{kid_a:[{label:"Tidy desk",emoji:"D",pts:1,cad:"daily"}],kid_b:[{label:"Tidy desk",emoji:"D",pts:1,cad:"daily"}]},
  chores:{kid_a:[{label:"Dishes",emoji:"C",pts:2,cad:"daily"}],kid_b:[{label:"Sweep",emoji:"S",pts:3,cad:"daily"}]}};

// ── a world: Mom's tablet (A, Mom mode) and a kid's tablet (B) over one database; week 1 built on its Sunday ──
async function world(o){
  const sun="2026-11-08";
  const clock=S.makeClock(hm(sun,0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const d=JSON.parse(JSON.stringify(FX.db));
  Object.assign(d.calendar,JSON.parse(JSON.stringify(o.cal||{}))); d.config.routines=JSON.parse(JSON.stringify(RT)); if(o.plan) o.plan(d);
  const db=S.makeDb(d,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  const mk=(name,dev,index)=>{ let seed=12345; const M=Object.create(Math); M.random=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const X=S.bootDevice({name,dev,db,clock,sched,family:FX.family,indexPath:index,globals:{Math:M}});
    X.run('__HARNESS_NO_RENDER=true; var __toasts=[]; gwShowToast=function(m){ __toasts.push(String(m)); }; var __pop=""; document.body.insertAdjacentHTML=function(p,h){ __pop=h; };'); return X; };
  const idx=o.base?BASE_PATH:INDEX;
  const A=mk(o.name+" A","dev_a",idx); A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  const B=mk(o.name+" B","dev_b",idx); B.run('haMomOff(); tab="kids";'); await flush(5000);
  const W={A,B,db,clock,flush,devs:[A,B],wk:()=>db.get("ha_active_wk")||A.get("WK")};
  W.board=()=>Object.values(db.get(W.wk()+"/tasks")||{}).filter(t=>t&&t.id);
  W.play=async(iso,dn)=>{ const ck=db.get(W.wk()+"/checked")||{};
    const cards=W.board().filter(t=>t.day===dn&&!ck[t.id]&&!String(t.id).endsWith("_c")&&!t._eowOverflow&&!t._dayDrop&&toMin(t.time)!=null).sort((a,b)=>toMin(a.time)-toMin(b.time)||String(a.id).localeCompare(b.id));
    for(const t of cards){ const end=toMin(t.time)+(+t.dur||20); const at=hm(iso,Math.floor(end/60),end%60); if(at>clock.now) clock.now=at;
      if(!A.tasks().some(x=>x.id===t.id)) continue; A.fn("finalizeDone")(t.id,A.fn("nowTs")()); await flush(4000); } };
  W.roll=async iso=>{ clock.now=hm(iso,0,0)+30000; for(const X of W.devs) X.fn("dayRollCheck")(); await flush(200000); };
  W.at=async(iso,h,m)=>{ clock.now=hm(iso,h,m); for(const X of W.devs) X.fn("dayRollCheck")(); await flush(2000); };
  return W;
}
const tickDay=async(W,iso)=>{ await W.at(iso,8,0); W.B.run('day=_todayDay; toggleMorningStep("kid_a",0); toggleMorningStep("kid_a",1); toggleMorningStep("kid_b",0);'); await W.flush(3000); };
// week 1 played Mon–Thu (Friday's cards left: the leftovers Mom may still check off), a star pool on Monday and Tuesday
const playWeek=async W=>{ for(let i=0;i<5;i++){ const iso=addDays("2026-11-09",i); if(i) await W.roll(iso); await tickDay(W,iso); if(i<4) await W.play(iso,dnOf(iso)); }
  W.A.run('addKidPoints("kid_a",5,"monday"); addKidPoints("kid_a",3,"tuesday");'); await W.flush(3000); };

// every screen this slice touches, read on Mom's tablet (render only)
const RESET='mpSchWkOff=0; mpSchWkDay=null; mpSchDay=null; mpDay=null; if(typeof mpSchWkLast!=="undefined") mpSchWkLast=false; mpSchMode="week"; mpSubView="cal"; ';
const SCREENS=`(function(){ var o={}; ${RESET}
  o.week=mpSchWeekHTML("mom"); o.weekAll=mpSchWeekHTML("all");
  var el={innerHTML:""}; renderDadAll(el); o.dad=el.innerHTML;
  digestWkSel=null; try{ o.report=renderHistoryReport(); }catch(e){ o.report="ERR "+e; }
  return JSON.stringify(o); })()`;
const screens=X=>JSON.parse(X.run(SCREENS));
const WRITE=/^(set|update|remove|inc|transaction|push)\s/;
const writesSince=(W,m)=>W.db.log.slice(m).map(l=>l.op+" "+l.path).filter(x=>WRITE.test(x));
const lit=h=>count(h,"background:#2B7A78;color:#fff\">");   // a Week grid day header lit as today

(async function(){
  // ═══ 2. world a2 ═══
  console.log("2 · world a2 — a calendar break over the plan's skipped week (Fall Break, Mon Nov 16 – Fri Nov 20)");
  const a2=await world({name:"a2",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true)});
  await playWeek(a2);
  // first, the screen as it is before this slice (the same world on the code before)
  const a2o=await world({name:"a2 before",base:true,cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true)});
  await playWeek(a2o);
  for(const W of [a2,a2o]){ await W.roll("2026-11-16"); await W.roll("2026-11-17"); await W.at("2026-11-17",9,0); }
  { const o=screens(a2o.A), t=txt(o.week);
    ok("BEFORE (the code before, break Tuesday): \"This week · Week 1\" over last school week's cards, Tuesday lit as today",/This week Week 1 ›/.test(t)&&t.indexOf("Math — Math 1")>=0&&/Tue •/.test(t)&&lit(o.week)===1,t.slice(0,200)); }
  const m0=a2.db.log.length;
  { const o=screens(a2.A), t=txt(o.week);
    ok("a2 Tue: the Week grid's line — \"No school this week — Fall Break, Nov 16–20 · back Mon Nov 23\"",t.indexOf("No school this week — Fall Break, Nov 16–20 · back Mon Nov 23")>=0,t);
    ok("a2 Tue: its header — \"This week\", this week's own dates (Nov 16–20); no week number, no last week's cards, no day lit",/^‹ This week Nov 16–20 ›/.test(t)&&t.indexOf("Week 1 ›")<0&&t.indexOf("Math — Math 1")<0&&lit(o.week)===0,t);
    ok("a2 Tue: one tap — \"‹ Last school week (Week 1 · Nov 9–13)\"",count(o.week,'onclick="mpSchWkLastSet(true)"')===1&&t.indexOf("‹ Last school week (Week 1 · Nov 9–13)")>=0,t);
    ok("a2 Tue: the All view says the same",txt(o.weekAll)===t); }
  { a2.A.run(RESET+"mpSchWkLastSet(true);"); const h=a2.A.run('mpSchWeekHTML("mom")'), t=txt(h), ho=a2o.A.run(RESET+'var __q=mlQueueLay, __d=dsDoneAtTime; mlQueueLay=function(x){ return x; }; dsDoneAtTime=function(x){ return x; }; var __r=mpSchWeekHTML("mom"); mlQueueLay=__q; dsDoneAtTime=__d; __r');   // the code before, today's column as laid
    ok("a2 Tue, tapped: \"Last school week\", \"Week 1 · Nov 9–13\", ↩ back to this week",/^‹ Last school week Week 1 · Nov 9–13 ↩ back to this week ›/.test(t),t.slice(0,120));
    ok("a2 Tue, tapped: last school week's cards — the same cards the code before drew (today's column as laid, not re-laid live)",t.indexOf("Math — Math 1")>=0&&t.indexOf("Mon Tue Wed Thu Fri")>=0
      &&t.replace(/^.*?› /,"")===txt(ho).replace(/^.*?› /,"").replace("Tue •","Tue"),[t.slice(0,300),txt(ho).slice(0,300)]);
    ok("a2 Tue, tapped: no day lit as today (Tuesday is not this Tuesday)",lit(h)===0&&t.indexOf("•")<0);
    ok("a2 Tue, tapped: Friday's leftover cards still show as not done",/Fri .*Kid/.test(t)&&(t.match(/✓/g)||[]).length<(t.match(/Kid [A-D]/g)||[]).length);
    // her answer 5: from there a day opens that day's agenda, exactly as before (the check-off path is untouched)
    a2.A.run('mpSchDaySet("friday");'); a2o.A.run('mpSchDaySet("friday");');
    const fN=a2.A.run('mpSchBody()'), fO=a2o.A.run('mpSchBody()');
    ok("a2 Tue: Friday from last school week opens Friday's agenda, the check-off boxes byte-identical to the code before",fN===fO&&fN.indexOf("mom-agenda")>=0&&/Friday/.test(txt(fN)),[txt(fN).slice(0,200),txt(fO).slice(0,200)]);
  }
  // ‹ › steps: ‹ this week = the tap; › from last school week = back to the line; ‹ from week 1 has nowhere to go
  { a2.A.run(RESET+'mpSchWkStep(-1);'); const t1=txt(a2.A.run('mpSchWeekHTML("mom")'));
    a2.A.run('mpSchWkStep(1);'); const t2=txt(a2.A.run('mpSchWeekHTML("mom")'));
    a2.A.run(RESET+'mpSchWkLastSet(true);'); const navL=a2.A.run('mpSchWkNavHTML()');
    a2.A.run('mpSchWkStep(1); mpSchWkStep(1);'); const t3=txt(a2.A.run('mpSchWeekHTML("mom")')), off3=a2.A.get("mpSchWkOff");
    a2.A.run('mpSchWkStep(-1);'); const t4=txt(a2.A.run('mpSchWeekHTML("mom")'));
    a2.A.run(RESET+'mpSchWkLastSet(true); mpSchWkBack();'); const t5=txt(a2.A.run('mpSchWeekHTML("mom")'));
    ok("‹ from this week = last school week; › from there = back to the line",/^‹ Last school week Week 1/.test(t1)&&/^‹ This week Nov 16–20 › No school this week/.test(t2),[t1.slice(0,60),t2.slice(0,60)]);
    ok("on last school week (Week 1) the ‹ arrow is off — there is no week before it",/<button disabled aria-label="Previous week"/.test(navL));
    ok("› › from last school week = the line, then Week 2 (read-only, by number — the plan skipped it); ‹ = the line again",off3===1&&/^‹ Week 2 read-only ↩ back to this week ›/.test(t3)&&/^‹ This week Nov 16–20 ›/.test(t4),[t3.slice(0,80),t4.slice(0,60)]);
    ok("↩ back to this week from last school week = the line",/^‹ This week Nov 16–20 › No school this week/.test(t5)); }
  // the break's weekend: Sunday before (counted as Monday) and Saturday after
  { const W=a2; await W.roll("2026-11-21"); await W.at("2026-11-21",10,0); const t=txt(screens(W.A).week);
    ok("a2 Sat Nov 21 (the Saturday after): the same line — the break touches this week",t.indexOf("No school this week — Fall Break, Nov 16–20 · back Mon Nov 23")>=0,t.slice(0,160)); }
  ok("a2: ZERO database writes from every screen and tap above",writesSince(a2,m0).length===0,writesSince(a2,m0).slice(0,5));

  // ═══ 3. world g ═══
  console.log("3 · world g — the plan has ended, no calendar break");
  { const g=await world({name:"g",plan:endPlan}); await playWeek(g); await g.roll("2026-11-16"); await g.roll("2026-11-17"); await g.at("2026-11-17",9,0);
    const m=g.db.log.length, o=screens(g.A), t=txt(o.week);
    ok("g Tue: \"No school week planned\" — her answer 1's words, no back date (no plan week ahead)",/^‹ This week Nov 16–20 › No school week planned ‹ Last school week \(Week 1 · Nov 9–13\)$/.test(t),t);
    g.A.run(RESET+"mpSchWkLastSet(true);"); const tl=txt(g.A.run('mpSchWeekHTML("mom")'));
    ok("g Tue, tapped: last school week, labelled, no day lit",/^‹ Last school week Week 1 · Nov 9–13/.test(tl)&&tl.indexOf("•")<0);
    ok("g: ZERO database writes",writesSince(g,m).length===0);
  }

  // ═══ 4. world c1 — two break weeks; and a day off on the first day back ═══
  console.log("4 · world c1 — a two-week break (Nov 16–27); a day off on the first day back");
  { const c1=await world({name:"c1",cal:HOL("2026-11-16","2026-11-27",{h2:{name:"Teacher Day",date:"2026-11-30",pause:"school"}}),plan:d=>gap(d,2,2,true)});
    await playWeek(c1); for(const iso of ["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22","2026-11-23","2026-11-24"]) await c1.roll(iso);
    await c1.at("2026-11-24",9,0); const m=c1.db.log.length, t=txt(screens(c1.A).week);
    ok("c1 second week (Tue Nov 24): the break's own dates, and back on Tue Dec 1 — Monday Nov 30 is a day off on her calendar",t.indexOf("No school this week — Fall Break, Nov 16–27 · back Tue Dec 1")>=0&&/^‹ This week Nov 23–27 ›/.test(t),t.slice(0,200));
    ok("c1 second week: last school week is still Week 1 · Nov 9–13",t.indexOf("‹ Last school week (Week 1 · Nov 9–13)")>=0);
    ok("c1: ZERO database writes",writesSince(c1,m).length===0);
    ok("date words: across months \"Dec 21 – Jan 2\", one day \"Nov 26\", same month \"Nov 9–13\"",c1.A.fn("_bwlRange")("2026-12-21","2027-01-02")==="Dec 21 – Jan 2"&&c1.A.fn("_bwlRange")("2026-11-26","2026-11-26")==="Nov 26"&&c1.A.fn("_bwlRange")("2026-11-09","2026-11-13")==="Nov 9–13"); }

  // ═══ 5. fail open ═══
  console.log("5 · fail open — leave it off rather than guess");
  { // a fresh a2 on its break Tuesday for the cases
    const f=await world({name:"a2 open",cal:HOL("2026-11-16","2026-11-20"),plan:d=>gap(d,2,1,true)}); await playWeek(f); await f.roll("2026-11-16"); await f.roll("2026-11-17"); await f.at("2026-11-17",9,0);
    const fo=a2o; const m=f.db.log.length;
    const sv=f.A.run('var __cd=currData; currData=null; _bwkMemo=null; JSON.stringify({b:bwlInfo(),w:mpSchWeekHTML("mom")})'), so=fo.A.run('var __cd=currData; currData=null; _bwkMemo=null; JSON.stringify({w:mpSchWeekHTML("mom")})');
    const pv=JSON.parse(sv), po=JSON.parse(so);
    ok("the plan not loaded: no label at all (the board's week counts as this week) — the Week grid byte-identical to the code before",pv.b===null&&pv.w===po.w,[txt(pv.w).slice(0,80),txt(po.w).slice(0,80)]);
    f.A.run('currData=__cd; _bwkMemo=null;'); fo.A.run('currData=__cd; _bwkMemo=null;');
    const dv=JSON.parse(f.A.run('var __dt=DAY_DT; DAY_DT=Object.assign({},DAY_DT,{monday:"November 2",tuesday:"November 3",wednesday:"November 4",thursday:"November 5",friday:"November 6"}); _bwkMemo=null; var r=JSON.stringify(bwlInfo()); DAY_DT=__dt; _bwkMemo=null; r'));
    ok("the plan's range and the week's own dates disagree: still a week with no school, last school week shown as \"Week 1\" with no dates",dv&&dv.lastBtn==="‹ Last school week (Week 1)"&&dv.lastDates==="",dv);
    const nb=JSON.parse(f.A.run('var __n=_nextSchoolDayAfterToday; _nextSchoolDayAfterToday=function(){ return "2026-11-12"; }; var r=JSON.stringify(bwlInfo()); _nextSchoolDayAfterToday=__n; r'));
    ok("a \"next school day\" the plan can't vouch for (in the board's own week or behind it): no back date",nb&&nb.back===null&&nb.line==="No school this week — Fall Break, Nov 16–20",nb);
    const nn=JSON.parse(f.A.run('var __c=calendarData.holidays; calendarData.holidays={hz:{start:"2026-11-16",end:"2026-11-20",pause:"school"}}; _bwkMemo=null; var r=JSON.stringify(bwlInfo()); calendarData.holidays=__c; _bwkMemo=null; r'));
    ok("a break with no name on her calendar: the app's own word for it (\"Holiday\"), as the Schedule card says",nn&&/^No school this week — Holiday, Nov 16–20 · back Mon Nov 23$/.test(nn.line),nn);
    ok("fail-open cases: ZERO database writes",writesSince(f,m).length===0); }

  // ═══ 7. a one-day holiday inside a real week, and 300 random normal weeks — byte-identical to the code before ═══
  console.log("7 · a holiday inside a real week · 300 random normal weeks — byte-identical");
  { const OLD=await world({name:"normal before",base:true}), NEW=await world({name:"normal after"});
    for(const W of [OLD,NEW]){ await tickDay(W,"2026-11-09"); await W.play("2026-11-09","monday"); W.A.run('addKidPoints("kid_a",5,"monday");'); await W.flush(2000); await W.roll("2026-11-10"); }
    const NAV=`(function(){ var o=[]; ${RESET} ["mom","all","kid_a"].forEach(function(w){ o.push(mpSchWeekHTML(w)); }); o.push(mpSchWkNavHTML());
      mpSchWkStep(-1); o.push(mpSchWkNavHTML()); mpSchWkStep(1); o.push(mpSchWkNavHTML()); mpSchWkStep(1); o.push(mpSchWkNavHTML()); mpSchWkBack(); o.push(mpSchWkNavHTML(),String(mpSchWkOff));
      var el={innerHTML:""}; renderDadAll(el); o.push(el.innerHTML); digestWkSel=null; o.push(renderHistoryReport());
      return JSON.stringify(o); })()`;
    for(const W of [OLD,NEW]) for(const X of W.devs) X.run('calendarData.holidays=Object.assign({},calendarData.holidays,{hx:{name:"Teacher Day",date:"2026-11-10",pause:"school"}});');
    ok("holiday inside a real week (Tue): every screen identical to the code before",OLD.A.run(NAV)===NEW.A.run(NAV)&&NEW.A.run("bwlInfo()")===null);
    for(const W of [OLD,NEW]) for(const X of W.devs) X.run('delete calendarData.holidays.hx;');
    const orig=JSON.parse(NEW.A.run("JSON.stringify(weekData.tasks)"));
    let seed=20261125; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
    const WD=["monday","tuesday","wednesday","thursday","friday","saturday"], ISO={monday:"2026-11-09",tuesday:"2026-11-10",wednesday:"2026-11-11",thursday:"2026-11-12",friday:"2026-11-13",saturday:"2026-11-14"};
    let diffs=0, first=null, n=0;
    const m0o=OLD.db.log.length, m0n=NEW.db.log.length;
    for(let it=0;it<300;it++){
      const tasks=JSON.parse(JSON.stringify(orig)), ck={};
      tasks.forEach(t=>{ if(rnd()<0.4) t.day=WD[Math.floor(rnd()*5)]; if(rnd()<0.6) ck[t.id]="9:"+String(10+Math.floor(rnd()*40))+" AM"; });
      const today=WD[Math.floor(rnd()*6)], other=WD[Math.floor(rnd()*6)], who=["mom","all","kid_a","kid_b"][Math.floor(rnd()*4)];
      const set='weekData.tasks='+JSON.stringify(tasks)+'; checked='+JSON.stringify(ck)+'; _todayDay="'+today+'"; day="'+today+'"; ';
      const R=`(function(){ var o=[]; ${RESET} o.push(mpSchWeekHTML("${who}"),mpSchWkNavHTML()); mpSchWkStep(${rnd()<0.5?-1:1}); o.push(mpSchWkNavHTML(),String(mpSchWkOff)); mpSchWkBack();
        var el={innerHTML:""}; renderDadAll(el); o.push(el.innerHTML); digestWkSel=null; o.push(renderHistoryReport());
        return JSON.stringify(o); })()`;
      const rows=[];
      for(const W of [OLD,NEW]){ W.clock.now=hm(ISO[today],8+(it%10),(it*7)%60); W.A.run(set); rows.push(W.A.run(R)); }
      if(rows[0]!==rows[1]){ diffs++; if(!first){ let i=0; while(rows[0][i]===rows[1][i]) i++; first={it,today,who,a:rows[0].slice(Math.max(0,i-150),i+150),b:rows[1].slice(Math.max(0,i-150),i+150)}; } }
      n+=rows[1].length;
    }
    ok("300 normal weeks: the Week grid (every view), its ‹ › steps, Dad's Everyone today, the weekly report — identical to the code before",diffs===0,first);
    ok("…they really drew ("+Math.round(n/1e6)+" MB of screens) and wrote nothing",n>3e6&&writesSince(OLD,m0o).length===0&&writesSince(NEW,m0n).length===0,[n]);
  }

  try{ fs.unlinkSync(BASE_PATH); }catch(e){}
  console.log("\n"+pass+" passed, "+fail+" failed ("+Math.round((Date.now()-T0)/1000)+" s)");
  process.exit(fail?1:0);
})().catch(e=>{ try{ fs.unlinkSync(BASE_PATH); }catch(x){} console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
