// test_helper_give.js — 🙋 HELPERGIVE (her ask 2026-10-08): "Give Grandma more today". On a day a helper comes, Mom ticks
// any of today's unchecked Mom-required cards (any kid, any time); they are the helper's for TODAY ONLY
// (helperGive/<date>/<helperId>/<taskKey>), lay inside her window through the living-day lay (MOMLOOP), show
// "👵 with Grandma", and come off Mom's loop. ↩ Undo puts a card back. The regular help list never changes.
// Part 1 runs the HELPERS block; part 2 replays the lay (mlQueueLay) with the handoff in place.
// Usage: node test_helper_give.js [index.html]
const fs=require("fs"), vm=require("vm"), path=require("path");
const file=process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html");
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }
function slice(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error(name+" not found"); return src.slice(i,src.indexOf("\n}",i)+2); }
const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
const g0=src.indexOf("// HELPERGIVE_START"), g1=src.indexOf("// HELPERGIVE_END");
ok(a>0&&b>a&&g0>a&&g1>g0&&g1<b,"HELPERGIVE block sits inside HELPERS");
function iso(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const TODAY=iso();
const TIME=slice("toMin")+"\n"+slice("fromMin");

// ── Part 1: data, rules and the button ───────────────────────────────────────────────
function env(tasks,o){
  o=o||{};
  const writes=[];
  const db={ref:p=>({set:v=>writes.push(["set",p,v]),remove:()=>writes.push(["remove",p]),update:v=>writes.push(["update",p,v])})};
  const ctx={console,db:o.db===false?null:db,_dryRun:()=>false,momHere:()=>o.mom!==false,rulesOpen:{},pageOn:()=>true,
    DAYS:["wednesday"],ROSTER:["lucy","ellis"],weekData:{tasks},getActiveTasks:()=>tasks,checked:o.checked||{},
    cap:s=>String(s).charAt(0).toUpperCase()+String(s).slice(1),esc:s=>String(s==null?"":s),document:{activeElement:null,getElementById:()=>null,createElement:()=>({}),body:{appendChild:()=>{}}},
    kitPinGate:()=>{ ctx.__gated=(ctx.__gated||0)+1; },Date,Object,Array,String,Number,JSON,Math,parseInt,isNaN,RegExp};
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.renderAll=()=>{};
  vm.createContext(ctx);
  vm.runInContext(TIME+"\n"+src.slice(a,b)+"\nthis.__set=(h,d,g)=>{helpersData=h;helperDaysData=d||{};helperGiveData=g||{};};this.__give=()=>helperGiveData;",ctx);
  ctx.__writes=writes;
  return ctx;
}
const C=(id,who,sk,time,mom,extra)=>Object.assign({id,who,subjectKey:sk,day:"wednesday",time,dur:20,title:id,mom:mom||"required"},extra||{});
const T=[C("l_math1","lucy","math","10:00 AM"),C("l_math2","lucy","math","2:00 PM"),C("l_read","lucy","read","11:00 AM"),
  C("e_sci","ellis","sci","1:00 PM"),C("e_free","ellis","free","10:00 AM","none"),C("e_done","ellis","hist","10:30 AM"),C("e_c","ellis","sci","9:00 AM",null,{id:"e_sci_c"})];
const G={name:"Grandma",icon:"👵",createdAt:1,pick:false,days:{wednesday:{start:"9:30 AM",end:"12:00 PM"}},help:{lucy:{read:true}}};
const NOWIN={name:"Sitter",icon:"🧑",createdAt:2,days:{friday:{start:"9:00 AM",end:"11:00 AM"}},help:{}};

let e=env(T,{checked:{e_done:true}});
e.__set({g:G,s:NOWIN});
ok(e.helperWinToday("g").s===570&&e.helperWinToday("g").e===720,"her window today = her regular hours");
ok(e.helperWinToday("s")===null,"a helper with no hours today has no window");
let btn=e.helperGiveBtnsHTML();
ok(btn.includes("Give Grandma more today")&&!btn.includes("Give Sitter"),"the button shows only for a helper who comes today",btn);
ok(env(T,{mom:false}).helperGiveBtnsHTML()===""||(()=>{ const x=env(T,{mom:false}); x.__set({g:G}); return x.helperGiveBtnsHTML()===""; })(),"no button outside Mom mode");
{ const x=env(T,{mom:false}); x.__set({g:G}); ok(x.helperGiveBtnsHTML()==="","kids never see the button"); x.helperGiveToggle("g","l_read"); ok(x.__gated===1&&!x.__writes.length,"a hand-off off Mom mode asks for the Mom PIN and writes nothing"); }
ok(!btn.includes("&#8617; Undo"),"nothing given yet → no undo rows");
const cands=e.helperGiveCands().map(t=>t.id);
ok(cands.join()==="l_math1,l_read,e_sci,l_math2","checklist = ALL of today's unchecked Mom-required cards, any kid, in time order (no independent, done or carry cards)",cands);
let pop=e.helperGivePopHTML("g");
ok(pop.includes("Give Grandma more today")&&pop.includes("l_math1")&&pop.includes("e_sci")&&pop.includes("2 of this subject go together"),"the checklist pop lists them");
ok(e.helperHolds(T[0])===null,"before she's given anything, Lucy's math is Mom's");

// Give Lucy's math 2 → both math lessons go (lessons stay in order), one targeted multi-path write.
e.helperGiveToggle("g","l_math2");
const w=e.__writes;
ok(w.length===1&&w[0][0]==="update"&&w[0][1]==="helperGive/"+TODAY,"one multi-path update under helperGive/<today>",w);
ok(w[0][2]&&w[0][2]["g/l_math1"]&&w[0][2]["g/l_math2"]&&w[0][2]["g/l_math2"].who==="lucy"&&w[0][2]["g/l_math2"].sk==="math","a kid's lessons of one subject go together",w[0][2]);
ok(e.helperGivenTo(T[0])==="g"&&e.helperGivenTo(T[1])==="g","both math lessons are Grandma's");
ok(e.helperHolds(T[0])==="g","helperHolds → her id even before she checks in (so it leaves Mom's loop and shows her badge)");
ok(e.helperGivenWin(T[1]).s===570,"the lay gets her window");
ok(e.helperTasksToday("g").map(t=>t.id).join()==="l_math1,l_read,l_math2","her list = her regular cards + what Mom gave her",e.helperTasksToday("g").map(t=>t.id));
ok(JSON.stringify(G.help)===JSON.stringify({lucy:{read:true}}),"the regular help list is unchanged");
btn=e.helperGiveBtnsHTML();
ok((btn.match(/&#8617; Undo/g)||[]).length===2&&btn.includes("👵 Lucy · l_math1"),"the button lists what she has, each with ↩ Undo",btn);
ok(e.helperGivePopHTML("g").includes("checked onchange=\"helperGiveToggle('g','l_math1')"),"given cards show ticked");

// Not a Mom-required card / another day / a helper with no hours today → never given.
ok(e.helperGivenTo(Object.assign({},T[0],{day:"thursday"}))===null,"another day's card is not given");
e.__set({g:G,s:NOWIN},{}, {[TODAY]:{s:{l_read:{at:1}}}});
ok(e.helperGivenTo(T[2])===null,"a give to a helper who doesn't come today does nothing");
e.__set({g:G},{}, {["2001-01-01"]:{g:{l_read:{at:1}}}});
ok(e.helperGivenTo(T[2])===null,"yesterday's hand-off means nothing today (today only)");

// Undo puts the subject back.
e=env(T); e.__set({g:G},{}, {[TODAY]:{g:{l_math1:{at:1},l_math2:{at:1}}}});
e.helperGiveToggle("g","l_math1");
ok(e.__writes[0][2]["g/l_math1"]===null&&e.__writes[0][2]["g/l_math2"]===null,"↩ Undo removes the subject's hand-off (a null leaf, targeted)",e.__writes[0][2]);
ok(e.helperGivenTo(T[0])===null&&e.helperHolds(T[0])===null,"…and the card is Mom's again");

// She left → Mom's again; one helper per card.
e=env(T); e.__set({g:G},{[TODAY]:{g:{arrived:1,left:2}}}, {[TODAY]:{g:{e_sci:{at:1}}}});
ok(e.helperHolds(T[3])===null,"she left → what she didn't finish is Mom's again");
const G2=Object.assign({},G,{name:"Dad",icon:"👨",createdAt:3});
e=env(T); e.__set({g:G,d:G2},{}, {[TODAY]:{g:{e_sci:{at:1}}}});
e.helperGiveToggle("d","e_sci");
ok(e.__writes[0][2]["d/e_sci"]&&e.__writes[0][2]["g/e_sci"]===null,"giving a card to another helper takes it off the first",e.__writes[0][2]);
ok(e.helperGivenTo(T[3])==="d","…so it's Dad's");

// Dry run: mirrored locally, no write.
e=env(T,{db:false}); e.__set({g:G});
e.helperGiveToggle("g","e_sci");
ok(e.helperGivenTo(T[3])==="g"&&!e.__writes.length,"dry run / no db: works on screen, writes nothing");

// The wiring.
ok(/db\.ref\("helperGive"\)\.orderByKey\(\)\.limitToLast\(3\)\.on\("value"/.test(src),"helperGive listener (last 3 days only)");
ok(/helperGiveBtnsHTML\(\)[^\n]*HELPERGIVE[^\n]*\n/.test(src.slice(src.indexOf("function renderMomsDay"),src.indexOf("function renderMomsDay")+8000)),"button on Mom's Day");
ok(/if\(day===_todayDay\)\{ try\{ h\+=helperGiveBtnsHTML\(\); \}/.test(src),"button on today's schedule (Mom mode only, inside the function)");
ok(!/db\.ref\("helperGive"\)\.set\(/.test(src),"never a whole-node set of helperGive");

// ── Part 2: the living-day lay puts handed cards in her window ─────────────────────────
const ma=src.indexOf("// MOMLOOP_START"), mb=src.indexOf("// MOMLOOP_END");
function lay(tasks,o){
  o=o||{};
  const given=o.given||{};   // taskId → helper window {id,s,e}
  const ctx={console,ROSTER:["lucy","ellis"],db:null,checked:o.checked||{},momMoves:{},getActiveTasks:()=>tasks,
    morningComplete:()=>true,bbActive:()=>null,momHere:()=>true,renderAll:()=>{},
    cap:s=>String(s),esc:s=>String(s==null?"":s),Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp};
  ctx.helperGivenWin=t=>given[t.id]||null;
  ctx.helperHolds=t=>given[t.id]?given[t.id].id:null;
  ctx._mlNowOverride=o.nowMin||9*60; ctx._mlEndOverride=o.endMin||(16*60+15); ctx._mlLunchOverride=[13*60,14*60];
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  vm.createContext(ctx); vm.runInContext(TIME,ctx); vm.runInContext(src.slice(ma,mb),ctx);
  vm.runInContext("momLoop="+JSON.stringify(o.momLoop||{cursor:0,order:["lucy","ellis"]})+";",ctx);
  const laid=vm.runInContext("mlQueueLay("+JSON.stringify(tasks)+")",ctx);
  const at=id=>ctx.toMin(laid.find(t=>t.id===id).time);
  return {laid,at,ctx};
}
const W={id:"g",s:9*60+30,e:12*60};
const L=(id,who,time,mom,dur,sk,title)=>({id,who,day:"wednesday",time,dur:dur||20,mom:mom||"none",subjectKey:sk||id,title:title||id});
const overl=(r,ids)=>{ for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){ const x=r.laid.find(t=>t.id===ids[i]), y=r.laid.find(t=>t.id===ids[j]); if(x.who!==y.who) continue; const xs=r.at(x.id), ys=r.at(y.id); if(xs<ys+(y.dur||20)&&ys<xs+(x.dur||20)) return ids[i]+"×"+ids[j]; } return null; };
{
  // Lucy: Morning Notebook 10:00, two Mom math lessons at 1:30/2:30 PM, own reading 10:20. Ellis: Mom science 10:00.
  const ts=[L("l_nb","lucy","10:00 AM","none",20,"morning_nb","Morning Notebook"),L("l_own","lucy","10:20 AM"),
    L("l_m1","lucy","2:30 PM","required",30,"math"),L("l_m2","lucy","3:00 PM","required",30,"math"),
    L("e_sci","ellis","10:00 AM","required",30,"sci"),L("e_own","ellis","10:30 AM"),L("e_hist","ellis","11:00 AM","required",20,"hist")];
  const base=lay(ts);
  const r=lay(ts,{given:{l_m1:W,l_m2:W,e_hist:W}});
  ok(r.at("l_m1")>=W.s&&r.at("l_m2")+30<=W.e,"handed math lands inside Grandma's 9:30–12 window",[r.at("l_m1"),r.at("l_m2")]);
  ok(r.at("l_m1")>=r.at("l_nb")+20,"…after Lucy's Morning Notebook (notebook first)",[r.at("l_nb"),r.at("l_m1")]);
  ok(r.at("l_m1")<r.at("l_m2"),"lessons stay in order");
  ok(r.at("e_hist")>=W.s&&r.at("e_hist")+20<=W.e,"Ellis's handed history is in her window too",r.at("e_hist"));
  // Grandma's own clock: never two of her cards at once.
  const hs=["l_m1","l_m2","e_hist"].map(id=>[r.at(id),r.at(id)+(id==="e_hist"?20:30)]).sort((x,y)=>x[0]-y[0]);
  ok(hs.every((x,i)=>!i||x[0]>=hs[i-1][1]),"Grandma has one kid at a time",hs);
  ok(!overl(r,["l_nb","l_own","l_m1","l_m2"])&&!overl(r,["e_sci","e_own","e_hist"]),"nothing overlaps on a kid's timeline",overl(r,["l_nb","l_own","l_m1","l_m2"])||overl(r,["e_sci","e_own","e_hist"]));
  ok(r.at("e_hist")>=r.at("e_sci")+30||r.at("e_hist")+20<=r.at("e_sci"),"Ellis's helper card steps around his Mom block");
  // Mom's loop no longer carries them.
  ok(r.ctx.mlRemaining("lucy").length===0,"Lucy's math is off Mom's loop");
  ok(r.ctx.mlRemaining("ellis").map(t=>t.id).join()==="e_sci","Ellis keeps only his science with Mom");
  ok(base.ctx.mlRemaining("lucy").length===2,"(without the hand-off they are Mom's)");
  // Nothing handed → the lay is unchanged.
  const same=lay(ts,{given:{}});
  ok(ts.every(t=>same.at(t.id)===base.at(t.id)),"no hand-off → the day lays exactly as before");
}
{
  // Mid-morning: it's 10:40, Lucy is in the middle of her reading (in hand since 10:30) — the handed card waits for it.
  const ts=[L("l_read","lucy","10:30 AM","none",30),L("l_m","lucy","2:00 PM","required",20,"math"),L("l_after","lucy","11:00 AM")];
  const r=lay(ts,{nowMin:10*60+40,given:{l_m:W}});
  ok(r.at("l_read")===630,"the card in hand keeps its place",r.at("l_read"));
  ok(r.at("l_m")>=660&&r.at("l_m")+20<=W.e,"the handed card lays after it, inside her window",r.at("l_m"));
  ok(!overl(r,["l_read","l_m","l_after"]),"Lucy's next card steps over the helper slot",[r.at("l_m"),r.at("l_after")]);
}
{
  // Mom off today: the handed card still lays in the helper's window (she isn't Mom), and the kid's own cards go around it.
  const ts=[L("l_a","lucy","9:30 AM"),L("l_m","lucy","2:00 PM","required",30,"math"),L("l_b","lucy","10:00 AM")];
  const r=lay(ts,{given:{l_m:W},momLoop:{cursor:0,order:["lucy","ellis"],momOff:"x"}});
  ok(r.at("l_m")>=W.s&&r.at("l_m")+30<=W.e&&!overl(r,["l_a","l_m","l_b"]),"Mom-off day: still in her window, no overlap",[r.at("l_a"),r.at("l_m"),r.at("l_b")]);
  ok(!r.laid.find(t=>t.id==="l_m")._momWait,"…and not greyed as waiting for Mom");
}
{
  // Too much to fit by her end: the card still lays (never lost), right after.
  const ts=[L("l_m1","lucy","2:00 PM","required",120,"math"),L("l_m2","lucy","3:00 PM","required",60,"read")];
  const r=lay(ts,{given:{l_m1:W,l_m2:W}});
  ok(r.at("l_m2")===r.at("l_m1")+120,"overflow past her window lays right behind, not lost",[r.at("l_m1"),r.at("l_m2")]);
}
console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
