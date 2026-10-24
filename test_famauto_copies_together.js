/*
 * 🔗 FAMSPLIT: every copy of a scheduler-picked family card shows at ONE time, whatever times the copies were stored at
 * and whatever order they come in. DeWalt 2026-10-23: Fact Review read 4:15 PM for Andrew and 5:35 PM for Kenzie.
 * Harness copied from test_livingday_fam_sticky.js.   run: node test_famauto_copies_together.js
 * Control: BASE_INDEX=<pre-fix index.html> node test_famauto_copies_together.js → the split cases FAIL on the old code.
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(process.env.BASE_INDEX||path.join(__dirname,"index.html"),"utf8");
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
    rulesData:{schoolDay:{defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"}},
    currData:null };
  ctx._mlNowOverride=o.nowMin; ctx._mlLunchOverride=[12*60,13*60];
  Object.defineProperty(ctx,"_todayDay",{get:()=>"monday"});
  vm.createContext(ctx); vm.runInContext(HELPERS,ctx); vm.runInContext(BLOCK,ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:ctx.ROSTER})+";",ctx);
  const laid=vm.runInContext("mlQueueLay("+JSON.stringify(tasks)+")",ctx);
  return {laid,at:id=>laid.find(t=>t.id===id).time};
}

console.log("── 🔗 copies stored at different times show at one time ──");
{
  // DeWalt Friday 10/23 at 4:10 PM: Andrew's copy stored 4:15 behind Handwriting, Kenzie's stored 5:35 behind Penmanship.
  ID=0;
  const ah=card("andrew","3:15 PM",10,"none","Handwriting"), fa=fam("andrew","4:15 PM",15,"fb1","Fact Review",true);
  const kp=card("makenzie","3:25 PM",10,"none","Penmanship"), fk=fam("makenzie","5:35 PM",15,"fb1","Fact Review",true);
  const r=run({tasks:[ah,fa,kp,fk],nowMin:16*60+10});
  ok("Andrew's and Kenzie's Fact Review show at the same time", r.at(fa.id)===r.at(fk.id), [r.at(fa.id),r.at(fk.id)]);
  ok("…never before now (4:10 PM)", m(r.at(fa.id))>=16*60+10, r.at(fa.id));
  ok("…and not at Kenzie's late stored 5:35", r.at(fk.id)!=="5:35 PM", r.at(fk.id));
  // Same day, Kenzie's cards listed first: the answer must not depend on list order.
  const r2=run({tasks:[kp,fk,ah,fa],nowMin:16*60+10});
  ok("list order doesn't matter (same time either way)", r2.at(fa.id)===r.at(fa.id)&&r2.at(fk.id)===r.at(fk.id), [r.at(fa.id),r2.at(fa.id),r2.at(fk.id)]);
}
{
  // Before school (clock 8:00): copies stored 9:00 and 9:15, both the first card of each kid's day.
  ID=0;
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:15 AM",15,"fb1","Fact Review",true);
  const r=run({tasks:[fa,fk],nowMin:8*60});
  ok("morning copies 9:00 / 9:15 show at one time", r.at(fa.id)===r.at(fk.id), [r.at(fa.id),r.at(fk.id)]);
  const r2=run({tasks:[fk,fa],nowMin:8*60});
  ok("…in either list order", r2.at(fa.id)===r.at(fa.id)&&r2.at(fk.id)===r.at(fk.id), [r.at(fa.id),r2.at(fa.id)]);
}
{
  // Mid-morning: Andrew's copy stored 10:00 behind his card, Kenzie's stored 10:30 behind hers; clock 9:30.
  ID=0;
  const aw=card("andrew","9:30 AM",20,"none","AAS"), fa=fam("andrew","10:00 AM",15,"fb1","Fact Review",true);
  const kw=card("makenzie","9:30 AM",30,"none","IEW"), fk=fam("makenzie","10:30 AM",15,"fb1","Fact Review",true);
  const r=run({tasks:[aw,fa,kw,fk],nowMin:9*60+30});
  ok("mid-morning split 10:00 / 10:30 shows at one time", r.at(fa.id)===r.at(fk.id), [r.at(fa.id),r.at(fk.id)]);
  ok("…after BOTH kids' current cards (≥ 10:00, Kenzie's IEW ends 10:00)", m(r.at(fa.id))>=10*60, r.at(fa.id));
}

console.log("── ✅ copies already together are unchanged ──");
{
  ID=0;
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:00 AM",15,"fb1","Fact Review",true);
  const aa=card("andrew","9:15 AM",10,"none","AAS");
  const r=run({tasks:[fa,fk,aa],nowMin:8*60});
  ok("together at 9:00 before school → still 9:00 for both", r.at(fa.id)==="9:00 AM"&&r.at(fk.id)==="9:00 AM", [r.at(fa.id),r.at(fk.id)]);
  ok("…and Andrew's next card keeps 9:15", r.at(aa.id)==="9:15 AM", r.at(aa.id));
}
{
  // Checked copies never move.
  ID=0;
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:20 AM",15,"fb1","Fact Review",true);
  const r=run({tasks:[fa,fk],nowMin:10*60,checked:{[fa.id]:"09:10 AM Oct 5",[fk.id]:"09:30 AM Oct 5"}});
  ok("checked copies keep their own times", r.at(fa.id)==="9:00 AM"&&r.at(fk.id)==="9:20 AM", [r.at(fa.id),r.at(fk.id)]);
}
{
  // Lunch-anchored family time (no famAuto) is never touched, even if its copies differ.
  ID=0;
  const h1=fam("andrew","1:00 PM",30,"fb0","History",false), h2=fam("makenzie","1:30 PM",30,"fb0","History",false);
  const r=run({tasks:[h1,h2],nowMin:9*60});
  ok("lunch-anchored family time unchanged (1:00 / 1:30)", r.at(h1.id)==="1:00 PM"&&r.at(h2.id)==="1:30 PM", [r.at(h1.id),r.at(h2.id)]);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
