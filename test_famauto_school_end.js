/*
 * 🏡 FAMCUT: scheduler-picked family time (famAuto) falls to "didn't fit today" at school end like any card, all copies
 * together. DeWalt 2026-10-23: Fact Review for Andrew + Kenzie stayed on the timeline at 4:15 / 5:35 PM after a 4:00 end.
 * Harness copied from test_livingday_fam_sticky.js.   run: node test_famauto_school_end.js
 * Control: BASE_INDEX=<pre-fix index.html> node test_famauto_school_end.js → the late-day cases FAIL on the old code.
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
  const get=id=>laid.find(t=>t.id===id);
  return {laid,at:id=>get(id).time,off:id=>!!get(id)._offDay};
}

console.log("── 🌙 a late day: Fact Review past school end falls to didn't fit, both copies ──");
{
  // DeWalt Friday 10/23 shape: nobody started until late; clock 4:10 PM, nothing checked, Fact Review behind each kid's card.
  const ah=card("andrew","3:15 PM",10,"none","Handwriting"), fa=fam("andrew","4:15 PM",15,"fb1","Fact Review",true);
  const kp=card("makenzie","3:25 PM",10,"none","Penmanship"), fk=fam("makenzie","5:35 PM",15,"fb1","Fact Review",true);
  const r=run({tasks:[ah,fa,kp,fk],nowMin:16*60+10});
  ok("both Fact Review copies flagged didn't fit", r.off(fa.id)&&r.off(fk.id), [r.at(fa.id),r.off(fa.id),r.at(fk.id),r.off(fk.id)]);
  ok("the kids' own late cards fall too (unchanged rule)", r.off(ah.id)&&r.off(kp.id), [r.off(ah.id),r.off(kp.id)]);
}
{
  // Clock 3:45, Andrew is on a 20-min card from 3:30: Fact Review lays after it, 3:50–4:05 → past 4:00 → both off.
  const aw=card("andrew","3:30 PM",20,"none","Working"), fa=fam("andrew","3:50 PM",15,"fb1","Fact Review",true), fk=fam("makenzie","3:50 PM",15,"fb1","Fact Review",true);
  const r=run({tasks:[aw,fa,fk],nowMin:15*60+45});
  ok("a copy that would run past 4:00 → both off", r.off(fa.id)&&r.off(fk.id), [r.at(fa.id),r.off(fa.id),r.at(fk.id),r.off(fk.id)]);
}
{
  // Andrew's Closing Notebook (10 min) is reserved before the end: Fact Review 3:40–3:55 runs into it → both off,
  // even though Kenzie (no closing) would have fit.
  const fa=fam("andrew","3:40 PM",15,"fb1","Fact Review",true), fk=fam("makenzie","3:40 PM",15,"fb1","Fact Review",true);
  const ac=card("andrew","3:55 PM",10,"none","📖 Closing Notebook",{subjectKey:"closing_nb"});   // a kid-run closing (a Mom-run one reserves nothing, same as for any card)
  const r=run({tasks:[fa,fk,ac],nowMin:9*60});
  ok("runs into Andrew's reserved closing minutes → both copies off", r.off(fa.id)&&r.off(fk.id), [r.at(fa.id),r.off(fa.id),r.off(fk.id)]);
  ok("the closing notebook never falls off", !r.off(ac.id), r.at(ac.id));
}

console.log("── ✅ nothing changes when it fits ──");
{
  // Co-op Thursday shape: Fact Review right after co-op at 3:00, clock 2:50 → 3:00–3:15 fits.
  const fa=fam("andrew","3:00 PM",15,"fb1","Fact Review",true), fk=fam("makenzie","3:00 PM",15,"fb1","Fact Review",true);
  const r=run({tasks:[fa,fk],nowMin:14*60+50});
  ok("3:00 PM Fact Review stays on the timeline", !r.off(fa.id)&&!r.off(fk.id)&&r.at(fa.id)==="3:00 PM", [r.at(fa.id),r.off(fa.id)]);
}
{
  // A normal morning: 9:00, clock 9:05.
  const fa=fam("andrew","9:00 AM",15,"fb1","Fact Review",true), fk=fam("makenzie","9:00 AM",15,"fb1","Fact Review",true);
  const r=run({tasks:[fa,fk],nowMin:9*60+5});
  ok("morning Fact Review untouched (9:00, not off)", r.at(fa.id)==="9:00 AM"&&!r.off(fa.id)&&!r.off(fk.id), [r.at(fa.id),r.off(fa.id)]);
}
{
  // Checked copies never fall off, even late.
  const fa=fam("andrew","4:15 PM",15,"fb1","Fact Review",true), fk=fam("makenzie","4:15 PM",15,"fb1","Fact Review",true);
  const r=run({tasks:[fa,fk],nowMin:16*60+40,checked:{[fa.id]:"04:30 PM Oct 5",[fk.id]:"04:30 PM Oct 5"}});
  ok("checked Fact Review is never flagged", !r.off(fa.id)&&!r.off(fk.id), [r.off(fa.id),r.off(fk.id)]);
}
{
  // Lunch-anchored family time (no famAuto) is left exactly as before — never flagged.
  const h1=fam("andrew","3:45 PM",30,"fb0","History",false), h2=fam("makenzie","3:45 PM",30,"fb0","History",false);
  const r=run({tasks:[h1,h2],nowMin:15*60});
  ok("lunch-anchored family time is not cut (unchanged)", !r.off(h1.id)&&!r.off(h2.id)&&r.at(h1.id)==="3:45 PM", [r.at(h1.id),r.off(h1.id)]);
}
{
  // Two different auto items: only the one past the end falls.
  const f1=fam("andrew","2:00 PM",15,"fb1","Fact Review",true), g1=fam("andrew","3:55 PM",15,"fb2","Spelling Bee",true);
  const r=run({tasks:[f1,g1],nowMin:13*60});
  ok("each family item is cut on its own (Fact Review stays, Spelling Bee off)", !r.off(f1.id)&&r.off(g1.id), [r.at(f1.id),r.off(f1.id),r.at(g1.id),r.off(g1.id)]);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
