/*
 * 🌞 Living-day lay: scheduler-picked family time moves with the day (all copies together) and a sticky "after" card
 * slides with its partner — at the end of the kid's Mom block when the partner is Mom work. Her reports 2026-10-05/06.
 * Harness copied from test_momloop_school_floor.js.   run: node test_livingday_fam_sticky.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// MOMLOOP_START"), b=src.indexOf("// MOMLOOP_END");
if(a<0||b<0){ console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK=src.slice(a,b);
function slice(name){ const i=src.indexOf("function "+name); if(i<0){ console.error(name+" not found"); process.exit(1); } return src.slice(i,src.indexOf("\n}",i)+2); }
const HELPERS=slice("toMin")+"\n"+slice("fromMin");
let pass=0, fail=0;
function ok(name,cond,extra){ if(cond){ pass++; console.log("  ok  - "+name); } else { fail++; console.log("  FAIL- "+name+(extra!==undefined?"  ("+JSON.stringify(extra)+")":"")); } }
const m=s=>{ const x=/(\d+):(\d+)\s*([AP]M)/.exec(s); return (+x[1]%12+(x[3]==="PM"?12:0))*60+ +x[2]; };
let ID=0;
function card(who,time,dur,mom,title,extra){ return Object.assign({ id:who+"_"+(ID++), who, day:"monday", mom:mom||"none", time, dur:dur||20, title:title||(who+" card") },extra||{}); }
function fam(who,time,dur,block,item,auto){ return card(who,time,dur,"none","🏡 "+item,{famBlock:block,famItem:item,famAuto:!!auto}); }
function run(o){
  o=o||{}; const tasks=o.tasks||[];
  const ctx={ console, ROSTER:o.roster||["taylor","makenzie","andrew","caleb"], db:null, checked:o.checked||{}, momMoves:{},
    getActiveTasks:()=>tasks, morningComplete:()=>true, bbActive:()=>null, momHere:()=>true, adminPinUnlocked:true, renderAll:()=>{},
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s),
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,
    rulesData:o.rulesData||{schoolDay:{defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"}},
    currData:o.currData||null };
  ctx._mlNowOverride=(typeof o.nowMin==="number")?o.nowMin:9*60;
  if(o.lunchWin!==undefined) ctx._mlLunchOverride=o.lunchWin; else ctx._mlLunchOverride=[12*60,13*60];
  if(o.coopEnd){ ctx.routineDateISO=()=>"2026-10-05"; ctx.coopTimedEndMin=(k,ds)=>(ds==="2026-10-05"&&o.coopEnd[k])||0; }
  Object.defineProperty(ctx,"_todayDay",{get:()=>"monday"});
  vm.createContext(ctx); vm.runInContext(HELPERS,ctx); vm.runInContext(BLOCK,ctx);
  vm.runInContext("momLoop="+JSON.stringify(o.momLoop||{cursor:0,order:ctx.ROSTER})+";",ctx);
  if(o.momOff) vm.runInContext("momLoop.momOff=_mlDayStamp();",ctx);
  if(o.momHold) vm.runInContext("momHold="+JSON.stringify(o.momHold)+";",ctx);
  const laid=vm.runInContext("mlQueueLay("+JSON.stringify(tasks)+")",ctx);
  const at=id=>laid.find(t=>t.id===id).time;
  return {laid,at,call:e=>vm.runInContext(e,ctx)};
}

console.log("── 🕰 a card starts when the one before it was finished — never the clock (her rule 2026-10-06) ──");
{
  // Andrew this morning: Fact Review (family) checked 9:10, AAS printed 9:15, Arithmetic 9:25. Clock 9:12.
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), aa=card("andrew","9:15 AM",10,"none","AAS"), ar=card("andrew","9:25 AM",20,"required","Arithmetic");
  const r=run({tasks:[fa,aa,ar],nowMin:9*60+12,checked:{[fa.id]:"09:10 AM Oct 5"}});
  ok("the next card starts at the check-off (AAS 9:10, not its printed 9:15)", r.at(aa.id)==="9:10 AM", r.at(aa.id));
  ok("the card behind it chains from its end (Arithmetic 9:20)", r.at(ar.id)==="9:20 AM", r.at(ar.id));
}
{
  // Kenzie: Piano (printed 9:25 after the re-slot) checked 9:34; Penmanship stored 9:45, Reading 9:55. Clock 9:36.
  const pi=card("makenzie","9:25 AM",20,"none","Piano"), pe=card("makenzie","9:45 AM",10,"none","Penmanship"), rd=card("makenzie","9:55 AM",30,"none","Reading");
  const r=run({tasks:[pi,pe,rd],nowMin:9*60+36,checked:{[pi.id]:"09:34 AM Oct 5"}});
  ok("a lower card checked first: the next open card starts at THAT check-off (Penmanship 9:34, not the re-slotted 9:45)", r.at(pe.id)==="9:34 AM", r.at(pe.id));
  ok("…and Reading follows it (9:44)", r.at(rd.id)==="9:44 AM", r.at(rd.id));
}
{
  // Nothing checked yet, clock 9:30: the first card holds at its slot (they are on it); the rest never sit before now.
  const a=card("taylor","9:15 AM",10,"none","A"), b=card("taylor","9:25 AM",10,"none","B"), c=card("taylor","9:35 AM",10,"none","C");
  const r=run({tasks:[a,b,c],nowMin:9*60+30});
  ok("first card (10 min) past its end slides to end at now (9:20), not dragged to 9:30", r.at(a.id)==="9:20 AM", r.at(a.id));
  ok("the card behind it lays from now (B 9:30), the next keeps its printed gap (C 9:40)", r.at(b.id)==="9:30 AM"&&r.at(c.id)==="9:40 AM", [r.at(b.id),r.at(c.id)]);
}
{
  // The card in hand runs into lunch: it stays (they are working on it); only the cards behind it step over lunch.
  const p=card("taylor","11:00 AM",20,"none","Prev"), w=card("taylor","11:30 AM",30,"none","Working"), n=card("taylor","12:00 PM",20,"none","Next");
  const r=run({tasks:[p,w,n],nowMin:11*60+50,checked:{[p.id]:"11:25 AM Oct 5"}});
  ok("in-hand card starts at the last check (11:25) and does NOT drop below lunch", r.at(w.id)==="11:25 AM", r.at(w.id));
  ok("the card behind it steps over lunch (1:00 PM)", r.at(n.id)==="1:00 PM", r.at(n.id));
  const r2=run({tasks:[p,w,n],nowMin:12*60+5,checked:{[p.id]:"11:25 AM Oct 5"}});
  ok("past its end it slides to end at now (12:05 → 11:35), still above lunch", r2.at(w.id)==="11:35 AM", r2.at(w.id));
  const r4=run({tasks:[p,w,n],nowMin:12*60+35,checked:{[p.id]:"11:25 AM Oct 5"}});
  ok("once the slide would start inside lunch (12:35 → 12:05) it picks up after lunch (1:00 PM)", r4.at(w.id)==="1:00 PM", r4.at(w.id));
  const r3=run({tasks:[p,w,n],nowMin:12*60+15,checked:{[p.id]:"12:10 PM Oct 5"}});
  ok("a card whose START falls inside lunch lays after lunch (checked 12:10 → 1:00 PM)", r3.at(w.id)==="1:00 PM", r3.at(w.id));
}
{
  // A long gap after the last check: the in-hand card holds at the check time; everything behind it slides from now.
  const p=card("taylor","9:00 AM",10,"none","Prev"), w=card("taylor","9:15 AM",10,"none","Working"), n=card("taylor","9:25 AM",10,"none","Next");
  const r=run({tasks:[p,w,n],nowMin:10*60+30,checked:{[p.id]:"09:10 AM Oct 5"}});
  ok("long gap: the in-hand card (10 min) slides to end at now (10:20) and the rest lay from now (10:30)", r.at(w.id)==="10:20 AM"&&r.at(n.id)==="10:30 AM", [r.at(w.id),r.at(n.id)]);
}
{
  // Mom's timeline respects the new start: the kid's in-hand card started at the check; Mom's block comes right after it.
  const p=card("taylor","9:00 AM",10,"none","Prev"), w=card("taylor","9:15 AM",20,"none","Working"), mm=card("taylor","9:35 AM",20,"required","Saxon");
  const r=run({tasks:[p,w,mm],nowMin:9*60+14,checked:{[p.id]:"09:08 AM Oct 5"},momLoop:{cursor:0,order:["taylor"]}});
  ok("buffer at the check (9:08) and Mom's card right behind it (9:28)", r.at(w.id)==="9:08 AM"&&r.at(mm.id)==="9:28 AM", [r.at(w.id),r.at(mm.id)]);
}

{
  // ⏳ The slide (her yes 2026-10-06): a 20-min card at 10:00 reads 10:00 until 10:20; at 10:21 it reads 10:01, at 10:30 it reads 10:10.
  const a=card("taylor","10:00 AM",20,"none","A"), b=card("taylor","10:20 AM",10,"none","B");
  ok("before its end it holds (10:15 → 10:00)", run({tasks:[a,b],nowMin:10*60+15}).at(a.id)==="10:00 AM");
  ok("10:21 → 10:01", run({tasks:[a,b],nowMin:10*60+21}).at(a.id)==="10:01 AM", run({tasks:[a,b],nowMin:10*60+21}).at(a.id));
  const r=run({tasks:[a,b],nowMin:10*60+30});
  ok("10:30 → 10:10, and the card behind it lays from now (10:30)", r.at(a.id)==="10:10 AM"&&r.at(b.id)==="10:30 AM", [r.at(a.id),r.at(b.id)]);
}

console.log("── 🏡 scheduler-picked family time lays like any card, all copies together ──");
{
  // Live DeWalt Monday: Fact Review 9:00 for Andrew + Kenzie (in hand for both), AAS 9:15 each; clock 9:30, nothing checked.
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:00 AM",15,"fb1","Fact Review",true);
  const aa=card("andrew","9:15 AM",10,"none","AAS"), ka=card("makenzie","9:15 AM",10,"none","AAS 4"), kp=card("makenzie","9:25 AM",10,"none","Penmanship");
  const r=run({tasks:[fa,fk,aa,ka,kp],nowMin:9*60+30});
  ok("in hand for both and nothing checked → past its end it slides to end at now (9:15 both)", r.at(fa.id)==="9:15 AM"&&r.at(fk.id)==="9:15 AM", [r.at(fa.id),r.at(fk.id)]);
  ok("the cards behind it lay from now (AAS 9:30 both)", r.at(aa.id)==="9:30 AM"&&r.at(ka.id)==="9:30 AM", [r.at(aa.id),r.at(ka.id)]);
  ok("…then chain (Penmanship 9:40)", r.at(kp.id)==="9:40 AM", r.at(kp.id));
}
{
  // Andrew checked his notebook at 9:20; the family card (next for him) starts there — and Kenzie's copy moves with it.
  const nb=card("andrew","9:00 AM",10,"none","Morning Notebook"), fa=fam("andrew","9:10 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:10 AM",15,"fb1","Fact Review",true);
  const ka=card("makenzie","9:25 AM",10,"none","AAS 4");
  const r=run({tasks:[nb,fa,fk,ka],nowMin:9*60+22,checked:{[nb.id]:"09:20 AM Oct 5"}});
  ok("family card starts at Andrew's check (9:20) for BOTH copies", r.at(fa.id)==="9:20 AM"&&r.at(fk.id)==="9:20 AM", [r.at(fa.id),r.at(fk.id)]);
  ok("Kenzie's own card steps past the moved family window (AAS 9:35)", r.at(ka.id)==="9:35 AM", r.at(ka.id));
}
{
  // One member is at a timed co-op until 11:00 → the family card waits for the LATEST member, for everyone.
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:00 AM",15,"fb1","Fact Review",true);
  const aa=card("andrew","9:15 AM",10,"none","AAS"), ka=card("makenzie","9:15 AM",10,"none","AAS 4");
  const r=run({tasks:[fa,fk,aa,ka],nowMin:9*60+5,coopEnd:{makenzie:11*60}});
  ok("latest member wins: both copies at 11:00 (Kenzie home from co-op)", r.at(fa.id)==="11:00 AM"&&r.at(fk.id)==="11:00 AM", [r.at(fa.id),r.at(fk.id)]);
  ok("Andrew's own work fills the morning (AAS 9:15)", r.at(aa.id)==="9:15 AM", r.at(aa.id));
  ok("Kenzie's own work waits for her and steps past the family card (AAS 11:15)", r.at(ka.id)==="11:15 AM", r.at(ka.id));
}
{
  // A checked family card never moves; a member's checked card is never covered.
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:00 AM",15,"fb1","Fact Review",true);
  const aa=card("andrew","9:15 AM",10,"none","AAS");
  const r=run({tasks:[fa,fk,aa],nowMin:9*60+30,checked:{[fa.id]:"09:10 AM Oct 5",[fk.id]:"09:10 AM Oct 5"}});
  ok("checked copies stay at 9:00", r.at(fa.id)==="9:00 AM"&&r.at(fk.id)==="9:00 AM", [r.at(fa.id),r.at(fk.id)]);
}
{
  // Lunch-anchored family time (no famAuto) is still held exactly where it is.
  const h1=fam("andrew","1:00 PM",30,"fb0","History",false), h2=fam("makenzie","1:00 PM",30,"fb0","History",false);
  const aa=card("andrew","9:15 AM",10,"none","AAS"), ab=card("andrew","9:25 AM",10,"none","Next");
  const r=run({tasks:[h1,h2,aa,ab],nowMin:9*60+40});
  ok("lunch-anchored family time stays at 1:00 PM", r.at(h1.id)==="1:00 PM"&&r.at(h2.id)==="1:00 PM", [r.at(h1.id),r.at(h2.id)]);
  ok("…the in-hand card slides to end at now (9:30) and the next lays from now (9:40)", r.at(aa.id)==="9:30 AM"&&r.at(ab.id)==="9:40 AM", [r.at(aa.id),r.at(ab.id)]);
}
{
  // A family card behind someone's current card lays after it, stepping over lunch.
  const w=card("andrew","11:30 AM",20,"none","Working"), fa=fam("andrew","11:50 AM",30,"fb1","Fact Review",true), fk=fam("makenzie","11:50 AM",30,"fb1","Fact Review",true);
  const r=run({tasks:[w,fa,fk],nowMin:11*60+55});
  ok("family card behind Andrew's card: after it and never before now, over lunch → 1:00 PM both", r.at(fa.id)==="1:00 PM"&&r.at(fk.id)==="1:00 PM", [r.at(fa.id),r.at(fk.id)]);
}

console.log("── 🔗 sticky 'after' slides with its partner: end of the kid's Mom block ──");
const CURR={subjects:{taylor:{saxon:{display:"Saxon Math 8/7",mom:"required"},practice:{display:"Math practice",rules:"sticky",stickyWith:"saxon",stickyOrder:"after"},gram:{display:"Grammar",mom:"required"},read:{display:"Reading"}},
  makenzie:{apol:{display:"Apologia",mom:"required"}}}};
{
  // Taylor: Saxon (Mom) 9:52, practice 10:22, Reading 10:42. Kenzie's Mom block is first in the loop (Apologia 9:00, 40 min) and
  // Mom starts at 9:30 → Kenzie 9:30–10:10, then Taylor's Saxon 10:10–10:40. Practice must follow Saxon, not sit at 10:22 under it.
  const sx=card("taylor","9:52 AM",30,"required","Saxon",{subjectKey:"saxon"}), pr=card("taylor","10:22 AM",20,"none","Practice",{subjectKey:"practice"}), rd=card("taylor","10:42 AM",30,"none","Reading",{subjectKey:"read"});
  const ap=card("makenzie","9:00 AM",40,"required","Apologia",{subjectKey:"apol"});
  const r=run({tasks:[sx,pr,rd,ap],nowMin:9*60+30,currData:CURR,momLoop:{cursor:0,order:["makenzie","taylor"]}});
  ok("Mom's block: Kenzie 9:30, then Taylor's Saxon 10:10", r.at(ap.id)==="9:30 AM"&&r.at(sx.id)==="10:10 AM", [r.at(ap.id),r.at(sx.id)]);
  ok("practice slides to the END of Taylor's Mom block (10:40), not its printed 10:22", r.at(pr.id)==="10:40 AM", r.at(pr.id));
  ok("Reading follows the practice (11:00)", r.at(rd.id)==="11:00 AM", r.at(rd.id));
}
{
  // Two Mom cards for Taylor (Saxon + Grammar) → the practice waits for the whole block, not just Saxon.
  const sx=card("taylor","9:52 AM",30,"required","Saxon",{subjectKey:"saxon"}), pr=card("taylor","10:22 AM",20,"none","Practice",{subjectKey:"practice"}), gr=card("taylor","2:00 PM",20,"required","Grammar",{subjectKey:"gram"});
  const r=run({tasks:[sx,pr,gr],nowMin:9*60,currData:CURR,momLoop:{cursor:0,order:["taylor"]}});
  ok("Mom block strings Saxon 9:52 + Grammar 10:22", r.at(sx.id)==="9:52 AM"&&r.at(gr.id)==="10:22 AM", [r.at(sx.id),r.at(gr.id)]);
  ok("practice lands after the WHOLE Mom block (10:42)", r.at(pr.id)==="10:42 AM", r.at(pr.id));
}
{
  const sx=card("taylor","11:30 AM",30,"required","Saxon",{subjectKey:"saxon"}), pr=card("taylor","12:00 PM",20,"none","Practice",{subjectKey:"practice"});
  const r=run({tasks:[sx,pr],nowMin:11*60,currData:CURR,momLoop:{cursor:0,order:["taylor"]}});
  ok("lunch may sit between the pair (practice 1:00 PM)", r.at(pr.id)==="1:00 PM", r.at(pr.id));
}
{
  const pr=card("taylor","10:22 AM",20,"none","Practice",{subjectKey:"practice"}), rd=card("taylor","10:42 AM",30,"none","Reading",{subjectKey:"read"});
  const r=run({tasks:[pr,rd],nowMin:9*60,currData:CURR,momLoop:{cursor:0,order:["taylor"]}});
  ok("no partner today → printed slot holds (10:22)", r.at(pr.id)==="10:22 AM", r.at(pr.id));
}
{
  const sx=card("taylor","9:52 AM",30,"required","Saxon",{subjectKey:"saxon"}), pr=card("taylor","10:22 AM",20,"none","Practice",{subjectKey:"practice"}), rd=card("taylor","10:42 AM",30,"none","Reading",{subjectKey:"read"});
  const r=run({tasks:[sx,pr,rd],nowMin:9*60+30,currData:CURR,momOff:true,momLoop:{cursor:0,order:["taylor"]}});
  ok("Mom off: Reading first (9:52, the queue starts at the first slot), Saxon greyed after (10:22), practice behind Saxon (10:52)", r.at(rd.id)==="9:52 AM"&&r.at(sx.id)==="10:22 AM"&&r.at(pr.id)==="10:52 AM", [r.at(rd.id),r.at(sx.id),r.at(pr.id)]);
}
{
  const sx=card("taylor","9:52 AM",30,"required","Saxon",{subjectKey:"saxon"}), pr=card("taylor","10:22 AM",20,"none","Practice",{subjectKey:"practice"});
  const r=run({tasks:[sx,pr],nowMin:9*60,currData:CURR,momLoop:{cursor:0,order:["taylor"]}});
  ok("Saxon keeps 9:52 (practice did not push Mom's block) and practice sits right behind it (10:22)", r.at(sx.id)==="9:52 AM"&&r.at(pr.id)==="10:22 AM", [r.at(sx.id),r.at(pr.id)]);
}

console.log("── 🧪 control: before the day starts (nothing checked, clock 6:00 AM) every day lays exactly as before ──");
if(process.env.BASE_INDEX){
  const bsrc=fs.readFileSync(process.env.BASE_INDEX,"utf8"); const ba=bsrc.indexOf("// MOMLOOP_START"), bb=bsrc.indexOf("// MOMLOOP_END"); const BBLOCK=bsrc.slice(ba,bb);
  let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  let same=0, diff=0;
  for(let it=0; it<1500; it++){
    ID=0; const kids=["taylor","makenzie","andrew"]; const tasks=[];
    kids.forEach(k=>{ const n=1+Math.floor(rnd()*4); let t=9*60+Math.floor(rnd()*30); for(let i=0;i<n;i++){ const d=[10,15,20][Math.floor(rnd()*3)]; tasks.push(card(k,fromMinS(t),d,rnd()<0.4?"required":"none","c")); t+=d+Math.floor(rnd()*10); } });   // morning only: the generator never lays a card across lunch
    if(rnd()<0.3) tasks.push(fam("taylor","1:00 PM",30,"fb0","History",false));
    const checked={};
    const o={tasks,nowMin:6*60,checked,momOff:rnd()<0.15,momLoop:{cursor:Math.floor(rnd()*3),order:kids}};
    const A=JSON.stringify(run(o).laid);
    const ctx2={console,ROSTER:kids,db:null,checked,momMoves:{},getActiveTasks:()=>tasks,morningComplete:()=>true,bbActive:()=>null,momHere:()=>true,adminPinUnlocked:true,renderAll:()=>{},cap:s=>s,esc:s=>s,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,rulesData:{schoolDay:{defaultStart:"9:00 AM",defaultEnd:"4:00 PM"}},currData:null};
    ctx2._mlNowOverride=o.nowMin; ctx2._mlLunchOverride=[12*60,13*60]; Object.defineProperty(ctx2,"_todayDay",{get:()=>"monday"});
    vm.createContext(ctx2); vm.runInContext(HELPERS,ctx2); vm.runInContext(BBLOCK,ctx2); vm.runInContext("momLoop="+JSON.stringify(o.momLoop)+";"+(o.momOff?"momLoop.momOff=_mlDayStamp();":""),ctx2);
    const B=JSON.stringify(vm.runInContext("mlQueueLay("+JSON.stringify(tasks)+")",ctx2));
    if(A===B) same++; else diff++;
  }
  ok("1500 random days (nothing checked, before school) byte-identical to the base lay", diff===0, {same,diff});
} else console.log("  (set BASE_INDEX=<path to base index.html> to run the control)");
function fromMinS(x){ const h=Math.floor(x/60), mm=x%60; return ((h%12)||12)+":"+String(mm).padStart(2,"0")+" "+(h<12?"AM":"PM"); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
