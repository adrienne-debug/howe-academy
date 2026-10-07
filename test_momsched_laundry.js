/* 🧺 Laundry on the Mom-mode schedule (her ask 2026-10-07).  run: node test_momsched_laundry.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const lt=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
const ms=src.slice(src.indexOf("// MOMSCHED_LAUNDRY_START"), src.indexOf("// MOMSCHED_LAUNDRY_END"));
// Mom's Day "Now — needs you" laundry loop, sliced out verbatim so the two views are checked against each other
const nA=src.indexOf("// Load sitting in the washer too long"), nB=src.indexOf("// Bills that can't wait", nA);
const momDayLoop=src.slice(nA,nB);
function mk(laundry,now){
  const RealDate=Date; const NOW=now;
  function FakeDate(...a){ return a.length?new RealDate(...a):new RealDate(NOW); } FakeDate.now=()=>NOW; FakeDate.prototype=RealDate.prototype;
  const ctx={console,JSON,Math,parseInt,String,Object,Date:FakeDate,laundryData:laundry,_todayDay:"wednesday",day:"wednesday",
    HA_LS:{getItem:()=>null,setItem:()=>{}},db:null,LAUNDRY_STAGES:["washer","dryer","fold"],
    esc:s=>String(s).replace(/</g,"&lt;"),toMin:t=>{ const m=/^(\d+):(\d+) (AM|PM)$/.exec(t||""); if(!m) return null; let h=+m[1]%12; if(m[3]==="PM") h+=12; return h*60+ +m[2]; },
    fromMin:m=>{ const h=Math.floor(m/60), mm=m%60; return ((h%12)||12)+":"+String(mm).padStart(2,"0")+" "+(h<12?"AM":"PM"); },
    taskCard:t=>'<div class="tc">'+t.title+'</div>', _agLunchRow:()=>null, famIsMomCard:()=>false, renders:[]};
  ctx.renderAll=()=>ctx.renders.push("all"); ctx.renderMomsPlan=()=>ctx.renders.push("momsplan"); ctx.document={getElementById:()=>({})};
  vm.createContext(ctx);
  vm.runInContext(fn("laundrySince")+"\n"+lt+"\n"+ms+"\n"+fn("momAgendaHtml")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel")
    +"\nfunction momDayNow(){ let h='',nowN=0; "+momDayLoop+" return h; }",ctx);
  return {run:e=>vm.runInContext(e,ctx),ctx};
}
const T0=new Date(2026,9,7,9,0).getTime();   // Wed 10/7 9:00 AM
const min=n=>n*60000;

console.log("── same time as Mom's Day ──");
{ const L={a:{label:"Towels",stage:"washer",ts:T0}};
  const T=mk(L,T0+min(10));   // defaults: washer 60 + reminder 30 → shows 10:30 AM
  const r=T.run("momSchedLaundry('wednesday')");
  ok("a washer load sits at started + washer minutes + reminder (9:00 + 60 + 30 = 10:30 AM)", r.length===1&&r[0].m===10*60+30, r);
  ok("…which is exactly when Mom's Day starts showing it (not yet at 10:29, yes at 10:30)",
    !/Towels/.test(mk(L,T0+min(89)).run("momDayNow()"))&&/Towels/.test(mk(L,T0+min(90)).run("momDayNow()")));
  const A=T.run("momAgendaHtml([{id:'x',title:'Math',time:'10:30 AM',mom:'required'}])");
  ok("the Mom-mode schedule shows it in the 10:30 row, Mom Needed column, with the Math card", /10:30<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[\s\S]*Towels[\s\S]*<div class="tc">Math<\/div><\/div><div class="mom-col"><div class="mom-empty">/.test(A), A);
  const A2=T.run("momAgendaHtml([])");
  ok("a day with no Mom cards still shows the load (no 'No Mom-needed work' message)", /Towels/.test(A2)&&!/No Mom-needed work/.test(A2));
}
{ const L={a:{label:"Sheets",stage:"dryer",ts:T0}};
  const T=mk(L,T0); T.run("laundryTimes={wash:45,dry:75,grace:15}");
  ok("✎ Times count: dryer 75 + reminder 15 → 10:30 AM", T.run("momSchedLaundry('wednesday')")[0].m===10*60+30);
}
console.log("── same words, same check-off ──");
{ const L={a:{label:"Towels",stage:"washer",ts:T0},b:{label:"Sheets",stage:"dryer",ts:T0}};
  const T=mk(L,T0+min(120)); const day=T.run("momDayNow()"), sch=T.run("momAgendaHtml([])");
  ["Towels","Sheets"].forEach(n=>{
    const pick=h=>{ const i=h.indexOf(n); return h.slice(h.lastIndexOf("<span",i), h.indexOf("</button>",i)+9); };
    ok("'"+n+"' reads the same and has the same button on both pages", pick(day)===pick(sch)&&pick(day).length>40, [pick(day),pick(sch)]);
  });
  ok("the button is laundryAdvance → Dryer / → Fold", /laundryAdvance\('a'\)[^>]*>→ Dryer</.test(sch)&&/laundryAdvance\('b'\)[^>]*>→ Fold</.test(sch));
  T.run("tab='schedule'; laundryAdvance('a')");
  ok("tapping it on the schedule moves the load and repaints the schedule (not Mom's Day)", L.a.stage==="dryer"&&T.ctx.renders.join()==="all", T.ctx.renders);
  T.ctx.renders.length=0; T.run("tab='moms-plan'; laundryAdvance('b')");
  ok("tapping on Mom's Day still repaints Mom's Day", L.b.stage==="fold"&&T.ctx.renders.join()==="momsplan");
}
console.log("── which loads ──");
{ const L={a:{label:"Old",stage:"washer",ts:T0-min(24*60)},f:{label:"Folding",stage:"fold",ts:T0},n:{label:"Late",stage:"washer",ts:new Date(2026,9,7,23,0).getTime()}};
  const T=mk(L,T0+min(5)); const r=T.run("momSchedLaundry('wednesday')");
  ok("a load left from yesterday shows at now; the fold pile doesn't; one due tomorrow doesn't", r.length===1&&r[0].id==="a"&&r[0].m===9*60+5, r);
  ok("only on today's schedule", T.run("momSchedLaundry('thursday')").length===0);
}
console.log("── wiring ──");
ok("the laundry listener repaints the Mom-mode schedule", /if\(tab==="moms-plan"\)\{const el=document\.getElementById\("content"\);if\(el\)renderMomsPlan\(el\);\}\n\s*else if\(tab==="schedule"&&kid==="mom"\) renderAll\(\);   \/\/ MOMSCHED_LAUNDRY/.test(src));
ok("momAgendaHtml is what the Mom-mode schedule renders", /if\(kid==="mom" && unlocked\)\{\n\s*h\+=momAgendaHtml\(tasks\);/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
