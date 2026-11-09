/*
 * ✎ RPPAT_TEXT — a held card still takes the list's text on a re-lay (slice E demo run, 2026-11-08).
 * Found by test_demo_week.js: Wednesday 10:30, the lesson text of today's open Math card was changed on the list (✎ Save list). The
 * re-lay ran in "start from tomorrow" mode (mid-day), today's card was frozen (its lesson `taken`), _rpPatternWant minted no want for
 * it, and _reprojectPlan left it with the old title — the edit showed tomorrow, not today.
 *   · _rpPatternWant: a live card whose lesson is taken (today's frozen card, a started card) and whose title no longer ends with its
 *     list text joins `desired` with the same id / day / time and the list's text as its title (gwTaskTitle)
 *   · a card whose text is current adds nothing; a checked card adds nothing; the pattern slots after today are unchanged
 *   · _reprojectPlan on that `desired`: the held card is retitled in place (one <id>/title write), never moved
 *   run:  node test_rppat_retitle.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3]==="PM"?12:0))*60+ +m[2]; };
const fromMin=n=>{ let h=Math.floor(n/60), m=n%60, ap=h>=12?"PM":"AM"; h=h%12||12; return h+":"+String(m).padStart(2,"0")+" "+ap; };
const SEQ=["Math 1","Math 2","Math 3","Math 4","Math 5","Math 6","Math 7","Math 8"], IDS=SEQ.map((_,i)=>"L"+String(i+1).padStart(4,"0"));
const WEEK={monday:"2026-11-16",tuesday:"2026-11-17",wednesday:"2026-11-18",thursday:"2026-11-19",friday:"2026-11-20"};
function world(seq){
  const ctx={console,JSON,Object,Array,String,Number,Math,RegExp,toMin,fromMin,
    currData:{subjects:{kid_a:{math:{display:"Math",device:"paper",mom:"none",minutes:30,lessonSeq:seq,lessonIds:IDS,planId:"kid_a__math",doneImportedAt:"x",allowedDays:["Mon","Tue","Wed","Thu","Fri"],cap:1}}},done:{kid_a:{math:{L0001:{},L0002:{},L0003:{}}}}},
    planBacked:()=>true,
    planMaterialize:()=>({assignments:[{date:"2026-11-18",lid:"L0005",text:seq[4]},{date:"2026-11-19",lid:"L0006",text:seq[5]},{date:"2026-11-20",lid:"L0007",text:seq[6]}],extras:[]}),
    calDateForWeekDay:(d)=>WEEK[d]||null,
    gwTaskTitle:(kid,sk,text)=>"📄 Math — "+text,
    momClosingSlot:(c,all,from)=>from};
  vm.createContext(ctx); vm.runInContext("const _RP_DAYS=[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\"];\n"+fn("_rpPatternWant")+"\n"+fn("_reprojectPlan"),ctx);
  return ctx;
}
const card=(lid,day,time,title)=>({id:"kid_a_kid_a__math_"+lid,who:"kid_a",subjectKey:"math",day,time,dur:30,lid,title:title||("📄 Math — "+SEQ[IDS.indexOf(lid)]),mom:"none",device:"paper"});
const live=()=>[card("L0004","tuesday","1:00 PM"),card("L0005","wednesday","9:05 AM"),card("L0006","thursday","11:05 AM"),card("L0007","friday","9:05 AM")];
console.log("1. the demo: Wednesday 10:30, 'Math 5' renamed 'Math 5 (review)' on the list, re-lay mode tomorrow (today frozen)");
{ const seq=SEQ.slice(); seq[4]="Math 5 (review)"; const W=world(seq);
  W.LIVE=live(); W.CK={"kid_a_kid_a__math_L0004":"x"};
  const pw=vm.runInContext('_rpPatternWant("kid_a","math",{wn:2,todayDay:"wednesday",nowMin:630,toMin:toMin,mode:"tomorrow",dayCap:1,blockedDays:[],liveTasks:LIVE,genTasks:[],checked:CK,claimed:{}})',W);
  const w5=pw.desired.find(t=>t.id==="kid_a_kid_a__math_L0005");
  ok("today's frozen card is in `desired` with the list's new text, same id, same day and time",!!w5&&w5.title==="📄 Math — Math 5 (review)"&&w5.day==="wednesday"&&w5.time==="9:05 AM",w5);
  ok("…and it took no pattern slot: the slots after today are Thursday and Friday, as before",pw.slots.join()==="thursday,friday"&&pw.lessons.filter(x=>!/^wednesday/.test(x)).join(",")==="thursday L0006,friday L0007",{slots:pw.slots,lessons:pw.lessons});
  ok("the checked Tuesday card (lesson done) adds nothing",!pw.desired.some(t=>t.id==="kid_a_kid_a__math_L0004"));
  // the diff
  W.PW=pw;
  const r=vm.runInContext('_reprojectPlan("kid_a","math",LIVE,PW.desired,{todayDay:"wednesday",nowMin:630,checked:CK,claimed:PW.claimed,dayCtx:()=>({start:540,end:930,lunchStart:720,lunchEnd:765}),packAround:()=>[],toMin:toMin,fromMin:fromMin,dayCap:1,lidOrder:'+JSON.stringify(IDS)+',allowedDays:["Mon","Tue","Wed","Thu","Fri"],doneLids:["L0001","L0002","L0003"],dropUnwanted:true,patternForward:true,freshToday:false,blockedDays:[]})',W);
  ok("_reprojectPlan retitles today's card in place: one <id>/title write, no day or time write",r.upd["kid_a_kid_a__math_L0005/title"]==="📄 Math — Math 5 (review)"&&r.upd["kid_a_kid_a__math_L0005/day"]===undefined&&r.upd["kid_a_kid_a__math_L0005/time"]===undefined,r.upd);
  ok("the card is listed as retitled, not moved; Thursday and Friday keep their cards",r.summary.retitled.indexOf("kid_a_kid_a__math_L0005")>=0&&!r.summary.moved.length&&!r.summary.removed.length,r.summary); }
console.log("2. nothing changed on the list → nothing added, nothing written for today's card");
{ const W=world(SEQ.slice()); W.LIVE=live(); W.CK={"kid_a_kid_a__math_L0004":"x"};
  const pw=vm.runInContext('_rpPatternWant("kid_a","math",{wn:2,todayDay:"wednesday",nowMin:630,toMin:toMin,mode:"tomorrow",dayCap:1,blockedDays:[],liveTasks:LIVE,genTasks:[],checked:CK,claimed:{}})',W);
  ok("today's card is not in desired (its text is current)",!pw.desired.some(t=>t.id==="kid_a_kid_a__math_L0005")); }
console.log("3. a checked card whose list text changed stays a record");
{ const seq=SEQ.slice(); seq[3]="Math 4 (fixed)"; const W=world(seq); W.LIVE=live(); W.CK={"kid_a_kid_a__math_L0004":"x"};
  const pw=vm.runInContext('_rpPatternWant("kid_a","math",{wn:2,todayDay:"wednesday",nowMin:630,toMin:toMin,mode:"tomorrow",dayCap:1,blockedDays:[],liveTasks:LIVE,genTasks:[],checked:CK,claimed:{}})',W);
  ok("the checked Tuesday card is not in desired",!pw.desired.some(t=>t.id==="kid_a_kid_a__math_L0004")); }
console.log("4. a started card earlier today (mode today) takes the text too");
{ const seq=SEQ.slice(); seq[4]="Math 5 (review)"; const W=world(seq); W.LIVE=live(); W.CK={"kid_a_kid_a__math_L0004":"x"};
  const pw=vm.runInContext('_rpPatternWant("kid_a","math",{wn:2,todayDay:"wednesday",nowMin:630,toMin:toMin,mode:"today",dayCap:1,blockedDays:[],liveTasks:LIVE,genTasks:[],checked:CK,claimed:{}})',W);
  const w5=pw.desired.find(t=>t.id==="kid_a_kid_a__math_L0005"); ok("the 9:05 card (started by 10:30) is in desired with the new text, unmoved",!!w5&&w5.title==="📄 Math — Math 5 (review)"&&w5.time==="9:05 AM",w5); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
