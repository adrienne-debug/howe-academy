/*
 * FXPIN — fixed-time classes are pinned everywhere (her report 2026-11-04: Outschool German fixed 10:00 AM on 11/04, the saved
 * card at 11:30 after a sweep on a device whose curriculum copy didn't know the class, the screen showing 11:15).
 *   0. shape: the Day page's Mom-loop lay holds a class (movable + the kid's held windows); the guard context gives a class's
 *      clock time (classAt); the guard puts a class card back there before judging the day; the relay door marks a class as
 *      held — never a "move" on the what-moved line, any change to it trips the wire
 *   1. the guard (pure): a class card laid elsewhere goes back to its clock time (one time write), checked / claimed never;
 *      a day stacked by that is re-laid around the class; the display pass heals too and never rolls; a class that doesn't
 *      meet that day is left alone; a past day is left alone
 *   2. the relay diff: a class whose time changed is not a move, it trips the wire; the words say "changed"
 *   run:  node test_fixed_time_pinned.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };

console.log("0. shape");
{ const core=fn("_mlQueueLayCore");
  ok("the Mom-loop lay: a class is not movable and is one of the kid's held windows",/const _mlIsClass=function\(t\)/.test(core)&&/&&!_mlIsClass\(t\)/.test(core)&&/\|\|_mlIsClass\(x\)\)&&!_mlFinished/.test(core));
  const ctx=fn("seGuardCtx"); ok("the guard context gives a class's clock time on its date (classAt), null otherwise",/classAt:t=>\{/.test(ctx)&&/fxWindow\(s,ds,/.test(ctx));
  const g=fn("seGuardWeek"); ok("the guard puts a class card back at its clock time before judging the day (unchecked, unclaimed, today and later)",/if\(typeof o\.classAt==="function"\)\{ tasks\.forEach/.test(g)&&/if\(skip\(t\)\|\|ck\[t\.id\]\|\|cl\[t\.id\]\) return; const di=dIx\(t\); if\(di<0\|\|\(ti>=0&&di<ti\)\) return;/.test(g));
  const BLK=src.slice(src.indexOf("// RELAY_START"),src.indexOf("// RELAY_END"));
  ok("the relay door: a class is held (snapshot), never a move, any change trips the wire",/function _rlwIsClass\(t\)/.test(BLK)&&/\|\|_rlwIsClass\(t\); \}\}\);/.test(BLK)&&/if\(\(dayCh&&\(b\.cl\|\|b\.st\)\)\|\|b\.fx\) out\.locked\.push\(t\.id\);/.test(BLK)&&/if\(b\.ck\|\|b\.cl\|\|b\.fx\) return;/.test(BLK)&&/held card"\+\(e\.locked\.length===1\?"":"s"\)\+" changed"/.test(BLK));
  ok("no kid or family names in the new code",!/lincoln|ellis|lucy|julian|taylor|kenzie|andrew|caleb|howe|dewalt|burris/i.test(fn("_rlwIsClass")+fn("seGuardCtx").split("classAt")[1].split("\n")[0]));
}

console.log("1. the guard");
const G=new Function("toMin","fromMin",fn("seGuardWeek")+"; return seGuardWeek;")(toMin,fromMin);
const DAYS=["monday","tuesday","wednesday","thursday","friday"];
function week(){ return [
  {id:"m1",who:"kid_a",subjectKey:"math",day:"monday",time:"10:00 AM",dur:25,title:"math"},
  {id:"cls_mon",who:"kid_a",subjectKey:"class",day:"monday",time:"11:30 AM",dur:45,title:"class"},
  {id:"nb",who:"kid_a",subjectKey:"morning_nb",day:"wednesday",time:"9:00 AM",dur:5,title:"📖 Morning Notebook"},
  {id:"w1",who:"kid_a",subjectKey:"math",day:"wednesday",time:"9:05 AM",dur:25,title:"math"},
  {id:"geo",who:"kid_a",subjectKey:"geo",day:"wednesday",time:"11:15 AM",dur:15,title:"geo"},
  {id:"cls",who:"kid_a",subjectKey:"class",day:"wednesday",time:"11:30 AM",dur:45,title:"class"},
  {id:"read",who:"kid_a",subjectKey:"read",day:"wednesday",time:"12:15 PM",dur:20,title:"read"},
  {id:"b1",who:"kid_b",subjectKey:"math",day:"wednesday",time:"10:00 AM",dur:25,title:"math b"}]; }
const O=(x)=>Object.assign({days:DAYS,todayDay:"tuesday",nowMin:10*60+30,checked:{},claimed:{},toMin,fromMin,
  win:()=>({start:9*60,end:16*60+15,lunchStart:13*60,lunchEnd:14*60}),kidOff:()=>false,
  isClass:t=>t.subjectKey==="class",isLesson:t=>t.subjectKey==="math"||t.subjectKey==="geo",ahead:()=>0,
  classAt:t=>(t.subjectKey==="class"&&t.day==="wednesday")?10*60:null},x||{});
{ const t=week(); const r=G(t,O());
  const c=t.find(x=>x.id==="cls");
  ok("a class saved at 11:30 with its clock time 10:00 → back at 10:00, one time write, listed as retimed",c.time==="10:00 AM"&&r.upd["cls/time"]==="10:00 AM"&&r.retimed.indexOf("cls")>=0&&!r.upd["cls/day"],r.upd);
  ok("…the rest of a day that is fine stays where it is (a 25-min gap after math is not a reason to move)",t.find(x=>x.id==="geo").time==="11:15 AM"&&t.find(x=>x.id==="read").time==="12:15 PM"&&Object.keys(r.upd).join()==="cls/time",r.upd);
  ok("…a class on a day it doesn't meet (classAt null) is left alone; the other kid untouched",t.find(x=>x.id==="cls_mon").time==="11:30 AM"&&t.find(x=>x.id==="b1").time==="10:00 AM");
  ok("…nothing rolled or deferred",!r.rolled.length&&!r.deferred.length&&!r.dropped.length); }
{ const t=week(); const r=G(t,O({checked:{cls:"10:00 AM Nov 4"}}));
  ok("a checked class card is a record — never moved",t.find(x=>x.id==="cls").time==="11:30 AM"&&!r.upd["cls/time"]); }
{ const t=week(); const r=G(t,O({claimed:{cls:1}}));
  ok("a claimed class card is held where it is",t.find(x=>x.id==="cls").time==="11:30 AM"&&!r.upd["cls/time"]); }
{ const t=week(); t.find(x=>x.id==="geo").time="10:10 AM"; const r=G(t,O());
  const c=t.find(x=>x.id==="cls"), g=t.find(x=>x.id==="geo");
  const gs=toMin(g.time), ge=gs+15;
  ok("a day stacked by the heal (geo 10:10 under the 10:00–10:45 class) is re-laid around the class — the class stays at 10:00, geo lands clear of it",c.time==="10:00 AM"&&!(gs<10*60+45&&ge>10*60)&&r.retimed.indexOf("geo")>=0,{c:c.time,g:g.time}); }
{ const t=week(); const r=G(t,O({displayOnly:true,todayDay:"wednesday",nowMin:9*60+50}));
  ok("the display pass (today only) heals the class on screen too, and never rolls",t.find(x=>x.id==="cls").time==="10:00 AM"&&!r.rolled.length&&!r.deferred.length); }
{ const t=week(); const r=G(t,O({todayDay:"thursday",nowMin:10*60,classAt:t=>(t.subjectKey==="class")?10*60:null}));
  ok("a past day's class card is left alone (Monday class 11:30 with clock time 10:00, today Thursday)",t.find(x=>x.id==="cls_mon").time==="11:30 AM"&&t.find(x=>x.id==="cls").time==="11:30 AM"&&!Object.keys(r.upd).length,r.upd); }
{ const t=week(); const r=G(t,O({classAt:undefined}));
  ok("no classAt in the context (an older caller) → exactly as before",t.find(x=>x.id==="cls").time==="11:30 AM"&&!Object.keys(r.upd).length); }
{ const t=week(); const r=G(t,O({classAt:()=>{ throw new Error("boom"); }}));
  ok("a classAt that throws is a null",!Object.keys(r.upd).length); }

console.log("2. the relay diff");
{ const BLK=src.slice(src.indexOf("// RELAY_START"),src.indexOf("// RELAY_END"));
  const ctx={console,JSON,Math,Object,Array,String,Number,parseInt,isNaN,RegExp,Date,toMin,fromMin,cap:s=>s,esc:s=>String(s),dbg:()=>{},
    currData:{subjects:{kid_a:{class:{fixedTime:"10:00 AM"},math:{}}}},fxIsClass:s=>!!(s&&s.fixedTime)};
  vm.createContext(ctx); vm.runInContext(BLK,ctx);
  ctx.T=[{id:"cls",who:"kid_a",subjectKey:"class",day:"wednesday",time:"10:00 AM",dur:45},{id:"w1",who:"kid_a",subjectKey:"math",day:"wednesday",time:"9:05 AM",dur:25}];
  vm.runInContext('before=_rlwSnapOf(T,{checked:{},claimed:{},momMoves:{},todayDay:"tuesday",nowMin:630,isHeld:function(t){ return _rlwIsClass(t); }}); T[0].time="11:30 AM"; T[1].time="9:30 AM"; d=_rlwDiff(before,T);',ctx);
  const d=vm.runInContext("d",ctx);
  ok("a class whose time changed is NOT a move; the lesson that moved is",d.moves.map(m=>m.id).join()==="w1"&&d.n===1,d);
  ok("…it trips the wire",d.locked.join()==="cls");
  ok("…the words say a held card changed",/1 held card changed/.test(vm.runInContext('_rlwWords({label:"x",moves:d.moves,removed:[],locked:d.locked})',ctx)));
  ok("_rlwIsClass: by the subject's set time; a subject without one, or none, is not a class",vm.runInContext('_rlwIsClass(T[0])&&!_rlwIsClass(T[1])&&!_rlwIsClass({who:"kid_z",subjectKey:"q"})',ctx)===true); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
