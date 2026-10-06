// test_helpers2.js — 🙋 Helpers slice 2: "Is she here?" / "She left" and the overlay that hands a helper her cards.
// Part A runs the HELPERS block (sessions, helperHolds, writes, strip, pop-up). Part B runs the REAL Mom loop
// (MOMLOOP block) with a helper holding a card: Mom off → her card is NOT greyed/sunk; Mom's next card skips it.
// Usage: node test_helpers2.js [index.html]
const fs=require("fs"), vm=require("vm"), path=require("path");
const file=process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html");
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }

// ── Part A ───────────────────────────────────────────────────────────────────
const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
ok(a>0&&b>a,"HELPERS block present");
const block=src.slice(a,b);
ok(/function helperHolds\(/.test(block),"helperHolds defined");
function iso(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const TODAY=iso();
function env(o){
  o=o||{};
  const writes=[];
  const db={ ref(p){ return { set(v){ writes.push(["set",p,v]); }, remove(){ writes.push(["remove",p]); } }; } };
  const tasks=o.tasks||[];
  const ctx={
    console, writes, renders:0, db:o.noDb?null:db, _dryRun:()=>!!o.dry, momHere:()=>o.mom!==false, kitPinGate:(f,w)=>{ ctx.gated=(ctx.gated||0)+1; ctx.gateWhy=w; }, rulesOpen:{},
    pageOn:k=>k==="helpers"?o.page!==false:true,
    DAYS:["monday","tuesday","wednesday","thursday","friday","saturday"],
    DAY_LBL:{monday:"Monday",tuesday:"Tuesday",wednesday:"Wednesday",thursday:"Thursday",friday:"Friday",saturday:"Saturday"},
    ROSTER:["andrew","makenzie","taylor"], KID_COLOR:{andrew:"#00f"},
    weekData:{tasks}, getActiveTasks:()=>tasks, checked:o.checked||{},
    cap:s=>s[0].toUpperCase()+s.slice(1),
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    toMin:s=>{const m=String(s||"").match(/(\d+):(\d+)\s*(AM|PM)/i);if(!m)return 0;let h=+m[1];if(m[3].toUpperCase()==="PM"&&h!==12)h+=12;if(m[3].toUpperCase()==="AM"&&h===12)h=0;return h*60+ +m[2];},
    to12h:s=>s, ampmTo24:s=>s, confirm:()=>o.confirmAns!==false, prompt:()=>"x",
    document:{activeElement:null,getElementById:()=>null,createElement:()=>({}),body:{appendChild(){}}},
    Date
  };
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.renderAll=()=>{ ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext(block+"\nthis.__s=()=>({helpersData,helperDaysData,helpersPopId});this.__set=(h,d)=>{helpersData=h;helperDaysData=d;};",ctx);
  return ctx;
}
const G={name:"Grandma",icon:"👵",pick:false,createdAt:1,help:{andrew:{phonics:true,spelling:true},makenzie:{aas_4:true}}};
const D={name:"Dad",icon:"👨",pick:true,createdAt:2,help:{andrew:{math:true}}};
const T=[
  {id:"a1",who:"andrew",subjectKey:"phonics",day:"wednesday",time:"9:45 AM",title:"Phonics L12",mom:"required"},
  {id:"a2",who:"andrew",subjectKey:"spelling",day:"wednesday",time:"10:15 AM",title:"Spelling test",mom:"required"},
  {id:"a3",who:"andrew",subjectKey:"math",day:"wednesday",time:"11:00 AM",title:"Math 4.2",mom:"required"},
  {id:"a4",who:"andrew",subjectKey:"phonics",day:"thursday",time:"9:45 AM",title:"Phonics L13",mom:"required"},
  {id:"a1_c",who:"andrew",subjectKey:"phonics",day:"wednesday",time:"9:45 AM",title:"carry twin",mom:"required"},
  {id:"m1",who:"makenzie",subjectKey:"aas_4",day:"wednesday",time:"10:30 AM",title:"AAS 4 test",mom:"required"},
  {id:"t1",who:"taylor",subjectKey:"spelling",day:"wednesday",time:"10:30 AM",title:"Taylor spelling",mom:"required"},
];
let e=env({tasks:T}); e.__set({g:G,d:D},{});
ok(e.helperHolds(T[0])===null,"nobody here → nothing held");
e.helperArrive("g");
let s=e.__s();
ok(s.helperDaysData[TODAY].g.arrived>0&&!s.helperDaysData[TODAY].g.left,"arrive stamps today");
ok(e.writes.length===2&&e.writes[0][1]==="helperDays/"+TODAY+"/g/arrived"&&e.writes[1][0]==="remove"&&e.writes[1][1]==="helperDays/"+TODAY+"/g/left","arrive = leaf writes under helperDays/today/g");
ok(s.helpersPopId==="g","arrive opens her list");
ok(e.helperHolds(T[0])==="g"&&e.helperHolds(T[1])==="g"&&e.helperHolds(T[5])==="g","Grandma holds approved cards today (both kids)");
ok(e.helperHolds(T[2])===null,"not a subject she helps with");
ok(e.helperHolds(T[3])===null,"not another day");
ok(e.helperHolds(T[4])===null,"not a carry twin");
ok(e.helperHolds(T[6])===null,"not a kid she isn't approved for");
ok(e.helperTasksToday("g").map(t=>t.id).join()==="a1,a2,m1","her list = today's approved cards, time order");
// strip + pop-up
let strip=e.helpersStripHTML();
ok(strip.includes("Grandma &#10003; here · 3 to do")&&strip.includes("Dad here?"),"strip: Grandma here w/ count, Dad not",strip.slice(0,300));
let pop=e.helpersPopHTML("g");
ok(pop.includes("Grandma is here")&&pop.includes("Phonics L12")&&pop.includes("AAS 4 test")&&pop.includes("Grandma left"),"pop-up lists her cards + left button");
// pick mode: Dad holds nothing until he ticks
e.writes.length=0; e.helperArrive("d");
ok(e.helperHolds(T[2])===null,"Dad (pick on) holds nothing until he ticks");
pop=e.helpersPopHTML("d"); ok(pop.includes('type="checkbox"')&&pop.includes("stays with Mom"),"pick pop-up shows checkboxes");
e.helperTake("d","a3"); ok(e.helperHolds(T[2])==="d","ticked → Dad holds it");
ok(e.writes.some(w=>w[1]==="helperDays/"+TODAY+"/d/took/a3"&&w[2]===true),"take = took leaf");
e.helperTake("d","a3"); ok(e.helperHolds(T[2])===null,"un-ticked → Mom's again");
// leave → everything back
e.helperLeave("g"); s=e.__s();
ok(s.helperDaysData[TODAY].g.left>0,"left stamped");
ok(e.helperHolds(T[0])===null&&e.helperHolds(T[5])===null,"after she leaves nothing is held → Mom's again");
ok(e.helpersStripHTML().includes("Grandma here?"),"strip asks again after she left");
// leave cancelled
e=env({tasks:T,confirmAns:false}); e.__set({g:G},{}); e.helperArrive("g"); e.helperLeave("g"); ok(e.helperHolds(T[0])==="g","cancelled leave keeps her");
// yesterday's session doesn't count today
e=env({tasks:T}); e.__set({g:G},{"2000-01-01":{g:{arrived:1}}}); ok(e.helperHolds(T[0])===null,"an old day's session never holds today");
// page off → nothing
e=env({tasks:T,page:false}); e.__set({g:G},{[TODAY]:{g:{arrived:1}}}); ok(e.helperHolds(T[0])===null&&e.helpersStripHTML()==="","page off → no hold, no strip");
// profile removed while here → nothing held
e=env({tasks:T}); e.__set({},{[TODAY]:{g:{arrived:1}}}); ok(e.helperHolds(T[0])===null,"deleted profile holds nothing");
// dry-run: local only
e=env({tasks:T,dry:true}); e.__set({g:G},{}); e.helperArrive("g"); ok(e.writes.length===0&&e.helperHolds(T[0])==="g","dry-run: no writes, still works on this screen");
// 🔒 not Mom mode: here / left / tick do nothing, and opening the list asks for the PIN
e=env({tasks:T,mom:false}); e.__set({g:G,d:D},{});
e.helperArrive("g"); ok(e.writes.length===0&&e.helperHolds(T[0])===null,"not Mom: arrive blocked");
e.helpersPopOpen("g"); ok(e.gated===1&&/for Mom/.test(e.gateWhy)&&e.__s().helpersPopId===null,"not Mom: opening asks for the Mom PIN");
ok(e.helpersStripHTML()==="","not Mom: the strip is hidden (Mom mode only)");
e=env({tasks:T,mom:false}); e.__set({g:G,d:D},{[TODAY]:{g:{arrived:1},d:{arrived:1}}});
e.helperLeave("g"); e.helperTake("d","a3"); ok(e.writes.length===0&&e.helperHolds(T[0])==="g"&&e.helperHolds(T[2])===null,"not Mom: leave + tick blocked");
ok(e.helpersStripHTML()==="","not Mom: strip hidden even while she's here");
ok(e.helperChipsHTML().includes("Grandma"),"not Mom: her own list chip still shows");
ok(src.includes("function kitPinGate(then,why){")&&src.includes("(why?esc(why):'Adding, changing or importing recipes is for Mom.')"),"PIN gate takes her words, old wording kept");
// keys
e=env({}); ok(e._hlpKey("a.b/c#d$e[f]g%")==="a%2eb%2fc%23d%24e%5bf%5dg%25","task key made Firebase-safe");
// checked card not counted in "to do"
e=env({tasks:T,checked:{a1:"9:50 AM"}}); e.__set({g:G},{[TODAY]:{g:{arrived:1}}}); ok(e.helpersStripHTML().includes("· 2 to do"),"done cards drop out of the count");
ok(e.helpersPopHTML("g").includes("&#9989;"),"done card shows ✅ in her list");

// ── Part A2: hooks are wired ───────────────────────────────────────────────
ok(src.includes('db.ref("helperDays").orderByKey().limitToLast(3).on("value"'),"session listener wired");
ok(src.includes('h+=helpersStripHTML();'),"strip on today's schedule");
ok(/const verify=needsVerify\(t\)&&!momHereCards\(\)&&!\(typeof helperHolds==="function"&&helperHolds\(t\)\)/.test(src),"helper card is a plain check-off, not 'send to Mom'");
ok(src.includes('if(_hp) entry.helper=helperName(_hp);'),"history remembers the helper");
ok(src.includes("' with '+esc(helperName(_hlpId))")&&src.includes("done with '+esc(histState[srcId].helper)"),"card badge: with / done with");

// ── Part B: the real Mom loop ──────────────────────────────────────────────
const ma=src.indexOf("// MOMLOOP_START"), mb=src.indexOf("// MOMLOOP_END");
ok(ma>0&&mb>ma,"MOMLOOP block present");
const MBLOCK=src.slice(ma,mb);
function fnSlice(name){ const i=src.indexOf("function "+name); return src.slice(i,src.indexOf("\n}",i)+2); }
const UTIL=fnSlice("toMin")+"\n"+fnSlice("fromMin");
function lay(o){
  const tasks=o.tasks;
  const ctx={ console, ROSTER:["lincoln","ellis"], db:null, checked:{}, momMoves:{},
    getActiveTasks:()=>tasks, morningComplete:()=>true, bbActive:()=>null, momHere:()=>true, adminPinUnlocked:true, renderAll:()=>{},
    cap:s=>s, esc:s=>String(s==null?"":s), Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp };
  ctx._mlNowOverride=9*60; ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>"thursday"});
  if(o.held) ctx.helperHolds=t=>(t&&o.held.indexOf(t.id)>=0)?"g":null;
  vm.createContext(ctx); vm.runInContext(UTIL,ctx); vm.runInContext(MBLOCK,ctx);
  vm.runInContext("momLoop="+JSON.stringify(o.momLoop)+";",ctx);
  const laid=vm.runInContext("mlQueueLay("+JSON.stringify(tasks)+")",ctx);
  return { laid, at:id=>laid.find(t=>t.id===id).time, wait:id=>!!laid.find(t=>t.id===id)._momWait, call:x=>vm.runInContext(x,ctx) };
}
const stamp=new Date(); const st=stamp.getFullYear()+"-"+(stamp.getMonth()+1)+"-"+stamp.getDate();
const C=(id,time,mom,sk)=>({id,who:"lincoln",day:"thursday",time,dur:20,mom,title:id,subjectKey:sk||id});
const nb=C("nb","10:00 AM","none","morning_nb"), sp=C("spell","10:20 AM","required","spelling"), ma1=C("math","10:40 AM","required","math"), rd=C("read","11:00 AM","none","reading");
const OFF={cursor:0,order:["lincoln","ellis"],momOff:st};
let r0=lay({tasks:[nb,sp,ma1,rd],momLoop:OFF});
ok(r0.wait("spell")&&r0.wait("math"),"control (no helper): Mom off greys BOTH Mom cards");
let r1=lay({tasks:[nb,sp,ma1,rd],momLoop:OFF,held:["spell"]});
ok(!r1.wait("spell")&&r1.wait("math"),"Mom off + Grandma has spelling: spelling is NOT greyed, math still waits",[r1.wait("spell"),r1.wait("math")]);
ok(r1.at("spell")==="10:20 AM","…and spelling keeps its place in his own day",r1.at("spell"));
ok(r0.at("spell")!=="10:20 AM","(control: without her it sank to the end)",r0.at("spell"));
const ON={cursor:0,order:["lincoln","ellis"]};
let r2=lay({tasks:[nb,sp,ma1,rd],momLoop:ON,held:["spell"]});
ok(r2.call('mlRemaining("lincoln").map(function(t){return t.id;}).join()')==="math","Mom's remaining skips Grandma's card");
ok(r2.call('mlNextCard("lincoln").id')==="math","Mom's next card is math, not spelling");
let r3=lay({tasks:[nb,sp,ma1,rd],momLoop:ON});
ok(r3.call('mlNextCard("lincoln").id')==="spell","control: without her, spelling is Mom's next");
// no helper defined at all → identical lay to the control
let r4=lay({tasks:[nb,sp,ma1,rd],momLoop:OFF,held:[]});
ok(JSON.stringify(r4.laid)===JSON.stringify(r0.laid),"helper here but holding nothing → lay identical to no-helper");

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
