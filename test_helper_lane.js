// test_helper_lane.js — 🙋 HELPERLANE (her ask 2026-11-08): cards a helper (Grandma, Dad, anyone from the helper chips) has
// leave Mom's 🔴 / 🟡 lineup and her time, and sit in their own lane under it — "👵 With Grandma · 3 cards · 35 min", folded
// shut, opens to the cards. The kid's card still says "with Grandma". She leaves / Mom hands it back → back in Mom's lineup
// exactly as before. Nobody holding a card → the Mom view is byte-for-byte what main drew (snapshot below, taken from main).
// The replay runs the real HELPERS block (helperHolds, HELPERGIVE, HELPERLANE), the real Mom loop lay (MOMLOOP), then the Mom
// view the way renderSchedule draws it (helperLaneSplit, the untouched momAgendaHtml, then helperLaneHTML; main: momAgendaHtml alone); taskCard is stood in for by its own badge lines (sliced from it).
// Usage: node test_helper_lane.js [index.html]      Re-take the snapshot: node test_helper_lane.js --snapshot <main's index.html>
const fs=require("fs"), vm=require("vm"), path=require("path"), crypto=require("crypto");
const SNAP=process.argv[2]==="--snapshot";
const file=SNAP?process.argv[3]:(process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html"));
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0,st=false; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{"){d++;st=true;} else if(src[k]==="}"){d--; if(st&&d===0) return src.slice(i,k+1);} } }
const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
const ma=src.indexOf("// MOMLOOP_START"), mb=src.indexOf("// MOMLOOP_END");
const TC=fn("taskCard"), BADGE=TC.slice(TC.indexOf("  const bcls="),TC.indexOf("  if(t.famBlock) mb="));
function iso(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const TODAY=iso();

// Two kids, a Mom morning. Grandma helps kidA with phonics + spelling and kidB with reading (3 cards, 15+10+10 = 35 min).
const C=(id,who,sk,time,dur,mom,title)=>({id,who,subjectKey:sk,day:"wednesday",time,dur,title:title||id,mom:mom||"required"});
const T=[C("a_nb","kidA","morning_nb","10:00 AM",20,"none","Morning Notebook"),C("a_ph","kidA","phonics","10:20 AM",15),C("a_sp","kidA","spelling","10:45 AM",10),
  C("a_ma","kidA","math","11:15 AM",30),C("b_rd","kidB","reading","10:30 AM",10),C("b_ma","kidB","math","11:00 AM",30),C("b_wr","kidB","writing","11:45 AM",20,"maybe"),
  C("b_own","kidB","art","10:00 AM",20,"none")];
const G={name:"Grandma",icon:"👵",pick:false,createdAt:1,help:{kidA:{phonics:true,spelling:true},kidB:{reading:true}}};
const D={name:"Dad",icon:"👨",pick:true,createdAt:2,help:{kidA:{math:true},kidB:{math:true}}};
const NOHELP={name:"Sitter",icon:"🧑",pick:false,createdAt:3,help:{kidA:{art:true}}};

function env(o){
  o=o||{};
  const writes=[];
  const db={ref:p=>({set:v=>writes.push(["set",p,v]),remove:()=>writes.push(["remove",p]),update:v=>writes.push(["update",p,v])})};
  const ctx={console,db,_dryRun:()=>false,momHere:()=>true,adminPinUnlocked:true,pageOn:k=>k==="helpers"?o.page!==false:true,rulesOpen:{},
    ROSTER:["kidA","kidB"],weekData:{tasks:T},getActiveTasks:()=>T,checked:o.checked||{},histState:{},momMoves:{},
    morningComplete:()=>true,bbActive:()=>null,confirm:()=>true,kitPinGate:()=>{},
    cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    document:{activeElement:null,getElementById:()=>null,createElement:()=>({}),body:{appendChild(){}}},
    kid:o.kid||"mom",day:"wednesday",rulesData:{schoolDay:{}},Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp};
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx._mlNowOverride=9*60+40; ctx._mlLunchOverride=false; ctx._mlEndOverride=16*60+15;
  ctx.renders=0; ctx.renderAll=()=>{ ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("_agLunchFmt")+"\n"+fn("_agLunchRow")+"\n"+src.slice(a,b)+"\n"+src.slice(ma,mb)+"\n"+fn("momAgendaHtml")
    +"\nfunction badge(t){ const done=!!checked[t.id], srcId=t.id; "+BADGE+" return mb; }"
    +"\nfunction taskCard(t){ return '<i data-card=\"'+t.id+'\">'+badge(t)+'</i>'; }"
    +"\nmomLoop={cursor:0,order:[\"kidA\",\"kidB\"]};"
    +"\nthis.__set=(h,d,g)=>{helpersData=h||{};helperDaysData=d||{};helperGiveData=g||{};};",ctx);
  ctx.__set(o.helpers,o.days,o.give);
  ctx.writes=writes;
  // renderSchedule's order: lay the living day, then Mom's view of it (her cards only).
  ctx.view=()=>{ const laid=vm.runInContext("mlQueueLay("+JSON.stringify(T)+")",ctx);
    const mine=laid.filter(t=>t.mom==="required"||t.mom==="maybe");
    if(typeof ctx.helperLaneSplit!=="function") return ctx.momAgendaHtml(mine);   // main
    const hl=ctx.helperLaneSplit(mine); return ctx.momAgendaHtml(hl.lanes.length?hl.mine:mine)+(hl.lanes.length?ctx.helperLaneHTML(hl.lanes):""); };   // renderSchedule's lines
  ctx.rem=k=>vm.runInContext('mlRemaining("'+k+'").map(function(t){return t.id;}).join()',ctx);
  return ctx;
}
const here=id=>({[TODAY]:{[id]:{arrived:1}}});
const cardsIn=h=>(h.match(/data-card="([^"]+)"/g)||[]).map(x=>x.slice(11,-1));
const split=h=>{ const i=h.indexOf('<div class="helper-lane"'); return i<0?{mom:h,lane:""}:{mom:h.slice(0,i),lane:h.slice(i)}; };
const durOf=id=>T.find(t=>t.id===id).dur;
const sha=s=>crypto.createHash("sha256").update(s).digest("hex").slice(0,16);

// ── No helper holding anything → byte-for-byte what main drew ─────────────────────────────────────────────────────
const NONE={
  "no helpers at all":{},
  "helpers page off, Grandma checked in":{page:false,helpers:{g:G},days:here("g")},
  "Grandma set up, not here":{helpers:{g:G}},
  "Grandma checked in, nothing of hers today":{helpers:{s:NOHELP},days:here("s")},
  "Grandma came and left":{helpers:{g:G},days:{[TODAY]:{g:{arrived:1,left:2}}}},
  "Dad here, picked nothing":{helpers:{d:D},days:here("d")},
};
const got={}; Object.keys(NONE).forEach(k=>{ got[k]=env(NONE[k]).view(); });
if(SNAP){ const out={}; Object.keys(got).forEach(k=>{ out[k]=[sha(got[k]),got[k].length]; }); console.log(JSON.stringify(out,null,1)); process.exit(0); }
// Taken from origin/main e5cbab4 (before HELPERLANE) with: node test_helper_lane.js --snapshot <main's index.html>
const MAIN={
 "no helpers at all": ["3b216f1be65a5a53",1763],
 "helpers page off, Grandma checked in": ["3b216f1be65a5a53",1763],
 "Grandma set up, not here": ["3b216f1be65a5a53",1763],
 "Grandma checked in, nothing of hers today": ["3b216f1be65a5a53",1763],
 "Grandma came and left": ["3b216f1be65a5a53",1763],
 "Dad here, picked nothing": ["3b216f1be65a5a53",1763]
};
Object.keys(NONE).forEach(k=>ok(sha(got[k])===MAIN[k][0]&&got[k].length===MAIN[k][1],"no helper holding a card → identical to main: "+k,[sha(got[k]),got[k].length]));
const BASE=got["no helpers at all"];
ok(cardsIn(BASE).join()==="a_ph,a_sp,a_ma,b_rd,b_ma,b_wr"&&BASE.indexOf("helper-lane")<0,"control: every Mom card is in her lineup, no lane",cardsIn(BASE));

// ── Grandma checked in: her 3 cards leave Mom's lineup and her time ──────────────────────────────────────────────
let e=env({helpers:{g:G},days:here("g")});
let h=e.view(), s=split(h);
const GR=["a_ph","a_sp","b_rd"];
ok(GR.every(id=>e.helperHolds(T.find(t=>t.id===id))==="g"),"helperHolds gives Grandma phonics, spelling, reading");
ok(GR.every(id=>cardsIn(s.mom).indexOf(id)<0)&&cardsIn(s.mom).join()==="a_ma,b_ma,b_wr","Mom's lineup = only what's still hers",cardsIn(s.mom));
const momMin=ids=>ids.filter(id=>T.find(t=>t.id===id).mom==="required").reduce((m,id)=>m+durOf(id),0);
ok(momMin(cardsIn(BASE))===95&&momMin(cardsIn(s.mom))===60,"Mom Needed minutes 95 → 60 (Grandma's 35 are off her list)",[momMin(cardsIn(BASE)),momMin(cardsIn(s.mom))]);
ok(e.rem("kidA")==="a_ma"&&e.rem("kidB")==="b_ma","her time: the Mom loop's remaining work skips Grandma's cards",[e.rem("kidA"),e.rem("kidB")]);
const e0=env({});
{ const at=(x,id)=>x.toMin(vm.runInContext("mlQueueLay("+JSON.stringify(T)+")",x).find(t=>t.id===id).time);
  ok(at(e0,"b_ma")===11*60+25&&at(e,"b_ma")===10*60+50&&at(e,"a_ma")===10*60+20,"her time: Mom's next block moves up into the time Grandma freed (kidB math 11:25 → 10:50)",[at(e0,"b_ma"),at(e,"b_ma"),at(e,"a_ma")]); }
ok(e0.rem("kidA")==="a_ph,a_sp,a_ma"&&e0.rem("kidB")==="b_rd,b_ma","(control: without Grandma they are Mom's)",[e0.rem("kidA"),e0.rem("kidB")]);
ok(s.lane.indexOf('data-helper-lane="g"')>0&&(s.lane.match(/class="helper-lane"/g)||[]).length===1,"one lane, Grandma's, under the lineup");
ok(s.lane.indexOf("👵 With Grandma &middot; 3 cards &middot; 35 min")>0,"the lane reads 👵 With Grandma · 3 cards · 35 min",s.lane.replace(/<[^>]+>/g," "));
ok(cardsIn(s.lane).length===0&&s.lane.indexOf("&#9656; Show")>0&&s.lane.indexOf('aria-expanded="false"')>0,"folded shut by default");
const w0=e.writes.length;
e.helperLaneToggle("g"); h=e.view(); s=split(h);
ok(cardsIn(s.lane).join()==="b_rd,a_ph,a_sp"&&s.lane.indexOf("&#9662; Hide")>0,"tap → it opens to her 3 cards, in time order",cardsIn(s.lane));
ok(e.writes.length===w0&&e.renders>0,"opening the lane writes nothing (this screen's own memory) and repaints");
ok(s.lane.indexOf("👵 with Grandma — KidA")>0&&s.lane.indexOf("👵 with Grandma — KidB")>0,"inside the lane each card says who has it, for which kid");
e.helperLaneToggle("g"); ok(cardsIn(split(e.view()).lane).length===0,"tap again → folded");
// The kid's own card keeps saying "with Grandma" (same badge as main).
const ek=env({helpers:{g:G},days:here("g"),kid:"kidA"});
ok(ek.badge(T[1]).replace(/<[^>]+>/g,"")==="👵 with Grandma"&&ek.badge(T[3]).replace(/<[^>]+>/g,"")==="Mom Required","kid's card: 👵 with Grandma (and Mom's own card still Mom Required)");
ok(TC.indexOf("' with '+esc(helperName(_hlpId))+(kid===\"mom\"?\" — \"+klbl:\"\")")>0,"taskCard's helper badge is untouched");
// A card done with Grandma stays in her lane, counted as done.
let ed=env({helpers:{g:G},days:here("g"),checked:{a_ph:"10:31 AM"}});
s=split(ed.view());
ok(cardsIn(s.mom).indexOf("a_ph")<0&&s.lane.indexOf("3 cards &middot; 35 min")>0&&s.lane.indexOf("1 done")>0,"a card she finished stays in her lane · 1 done",s.lane.replace(/<[^>]+>/g," "));

// ── She leaves → the cards are back in Mom's lineup, exactly as before ────────────────────────────────────────────
e.helperLeave("g");
h=e.view();
ok(h.indexOf("helper-lane")<0&&cardsIn(h).join()===cardsIn(BASE).join(),"she left → no lane, every card back in Mom's lineup",cardsIn(h));
ok(h===BASE,"…and the Mom view is byte-for-byte what it was before she came");
ok(e.rem("kidA")==="a_ph,a_sp,a_ma","…and back in Mom's time");

// ── Mom hands a card over for today (HELPERGIVE) and back (↩ Undo) ───────────────────────────────────────────────
const GW=Object.assign({},G,{help:{},days:{wednesday:{start:"9:30 AM",end:"12:00 PM"}}});
let eg=env({helpers:{g:GW}});
ok(eg.view()===BASE,"a helper who comes today but holds nothing → unchanged");
eg.helperGiveToggle("g","b_ma");
s=split(eg.view());
ok(cardsIn(s.mom).indexOf("b_ma")<0&&s.lane.indexOf("1 card &middot; 30 min")>0,"handed math → off her lineup, into the lane (1 card · 30 min)",s.lane.replace(/<[^>]+>/g," "));
eg.helperGiveToggle("g","b_ma");
ok(eg.view()===BASE,"↩ Undo → back in Mom's lineup exactly as before");

// ── Two helpers → two lanes, oldest helper first; Dad's lane holds only what he picked ───────────────────────────
let e2=env({helpers:{g:G,d:D},days:{[TODAY]:{g:{arrived:1},d:{arrived:1,took:{a_ma:true}}}}});
s=split(e2.view());
const lanes=(s.lane.match(/data-helper-lane="(\w+)"/g)||[]).map(x=>x.slice(18,-1));
ok(lanes.join()==="g,d","Grandma's lane, then Dad's",lanes);
ok(s.lane.indexOf("👨 With Dad &middot; 1 card &middot; 30 min")>0&&cardsIn(s.mom).join()==="b_ma,b_wr","Dad picked kidA's math → his lane; Mom keeps kidB's math + writing",cardsIn(s.mom));
// Everything with helpers → the empty-list line, then the lanes.
const ALL={name:"Grandma",icon:"👵",pick:false,createdAt:1,help:{kidA:{phonics:true,spelling:true,math:true},kidB:{reading:true,math:true,writing:true}}};
s=split(env({helpers:{g:ALL},days:here("g")}).view());
ok(cardsIn(s.mom).length===0&&s.mom.indexOf("No Mom-needed work scheduled this day")>0&&s.lane.indexOf("6 cards &middot; 115 min")>0,"all of it with Grandma → Mom's empty-list line + her lane",s.lane.replace(/<[^>]+>/g," "));

// ── The wiring ────────────────────────────────────────────────────────────────────────────────────────────────────
const la=src.indexOf("// HELPERLANE_START"), lb=src.indexOf("// HELPERLANE_END");
ok(la>a&&lb>la&&lb<b,"HELPERLANE block sits inside HELPERS");
const LANE=src.slice(la,lb), AG=fn("momAgendaHtml"), RS=fn("renderSchedule");
ok(AG.indexOf("helperLane")<0,"momAgendaHtml itself is untouched (test_dads_day_helper holds it byte-identical to main)");
ok(/const _hLane=\(kid==="mom"&&typeof helperLaneSplit==="function"\)\?helperLaneSplit\(tasks\):null;[^\n]*\n  if\(_hLane&&_hLane\.lanes\.length\) tasks=_hLane\.mine;[^\n]*\n  if\(kid==="mom"\)\{\n    h\+=momAgendaHtml\(tasks\);\n    if\(_hLane&&_hLane\.lanes\.length\) h\+=helperLaneHTML\(_hLane\.lanes\);/.test(RS),"renderSchedule: Mom view only, typeof-guarded split, then the lanes under her agenda");
ok(!/db\.ref|\.set\(|\.update\(|HA_LS/.test(LANE),"the lane writes nothing anywhere");
ok(!/["'`](lincoln|ellis|lucy|julian|andrew|makenzie|taylor)["'`]/i.test(LANE)&&!/\b(Howe|DeWalt|Sara)\b/.test(LANE),"no kid or family names as literals");
ok(LANE.indexOf("\u{1F500}")<0,"no 🔀");

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
