// test_helpers4.js — 👨 Dad checks himself in from Dad's Day: request → Mom approves (default), or self-on when
// Mom turns approval off; he can pick his cards and say he's done; nobody else gets this. Usage: node test_helpers4.js [index.html]
const fs=require("fs"), vm=require("vm"), path=require("path");
const file=process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html");
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }
const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
const block=src.slice(a,b);
ok(/function helperDadId\(/.test(block),"Dad block present");
function iso(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const TODAY=iso();
function env(o){
  o=o||{}; const tasks=o.tasks||[]; const writes=[];
  const ctx={ console, writes, db:{ref(p){ return {set(v){ writes.push(["set",p,v]); },remove(){ writes.push(["remove",p]); }}; }}, _dryRun:()=>false,
    momHere:()=>!!o.mom, dadUnlocked:!!o.dad, _kioskD:()=>!!o.kioskD, rulesOpen:{}, renders:0,
    kitPinGate:(f,w)=>{ ctx.gated=(ctx.gated||0)+1; ctx.gateWhy=w; },
    pageOn:k=>k==="helpers"?o.page!==false:true, DAYS:["wednesday"], DAY_LBL:{wednesday:"Wednesday"}, ROSTER:["andrew"],
    weekData:{tasks}, getActiveTasks:()=>tasks, checked:o.checked||{}, cap:s=>s,
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
    toMin:()=>600, kid:"all", day:"wednesday", tab:"schedule",
    confirm:()=>true, document:{activeElement:null,getElementById:()=>null,createElement:()=>({}),body:{appendChild(){}}}, window:{scrollTo(){}}, Date };
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.renderAll=()=>{ ctx.renders++; }; ctx.showTab=()=>{};
  vm.createContext(ctx);
  vm.runInContext(block+"\nthis.__set=(h,d)=>{helpersData=h;helperDaysData=d;};this.__s=()=>({helpersData,helperDaysData});",ctx);
  return ctx;
}
const DAD=()=>({name:"Dad",icon:"👨",pick:true,dadPage:true,createdAt:2,help:{andrew:{math:true}}});
const G=()=>({name:"Grandma",icon:"👵",pick:false,createdAt:1,help:{andrew:{spelling:true}}});
const T=[{id:"m1",who:"andrew",subjectKey:"math",day:"wednesday",time:"10:00 AM",title:"Math 4.2"}];

// default: his tap asks Mom
let e=env({dad:true,tasks:T}); e.__set({g:G(),d:DAD()},{});
ok(e.helperDadId()==="d","the Dad profile is found");
let card=e.helperDadCardHTML();
ok(card.includes("ready to help with school")&&card.includes("Mom says yes"),"Dad's Day: the button, with 'Mom says yes'",card);
e.helperDadRequest();
let s=e.__s().helperDaysData[TODAY].d;
ok(s.requested>0&&!s.arrived,"his tap = a request, not on yet");
ok(e.writes.length===1&&e.writes[0][1]==="helperDays/"+TODAY+"/d/requested","request = one leaf write");
ok(e.helperIsHere("d")===false&&e.helperRequested("d")===true,"requested, not here");
ok(e.helperDadCardHTML().includes("Waiting for Mom"),"Dad's Day says waiting");
ok(e.helpersStripHTML()==="","not Mom mode: no strip at all");
e.momHere=()=>true; ok(e.helpersStripHTML().includes("Dad wants to help")&&e.helpersStripHTML().includes("Approve"),"Mom mode: schedule strip shows Dad wants to help · Approve"); e.momHere=()=>false;
// Dad can't approve himself
e.helperApprove("d"); ok(e.gated===1&&!e.helperIsHere("d"),"Dad (not Mom) tapping Approve hits the Mom PIN");
// Dad cancels
e.helperDadCancel(); ok(!e.helperRequested("d"),"he can cancel his ask");
// Mom approves
e=env({mom:true,tasks:T}); e.__set({d:DAD()},{[TODAY]:{d:{requested:5}}});
e.helperApprove("d"); s=e.__s().helperDaysData[TODAY].d;
ok(s.arrived>0&&!s.requested&&e.helperIsHere("d"),"Mom's Approve switches him on");
// Mom declines
e=env({mom:true,tasks:T}); e.__set({d:DAD()},{[TODAY]:{d:{requested:5}}}); e.helperDecline("d"); ok(!e.helperRequested("d")&&!e.helperIsHere("d"),"Not now clears the ask");
// self-in setting: straight on
e=env({dad:true,tasks:T}); const d2=DAD(); d2.selfIn=true; e.__set({d:d2},{});
ok(e.helperDadCardHTML().includes("come off Mom")&&!e.helperDadCardHTML().includes("Mom says yes"),"self-in wording");
e.helperDadRequest(); ok(e.helperIsHere("d")&&!e.helperRequested("d"),"approval off → his tap switches him on");
// here: his card, pick, done
e=env({dad:true,tasks:T}); e.__set({d:DAD()},{[TODAY]:{d:{arrived:1}}});
card=e.helperDadCardHTML(); ok(card.includes("You're helping")&&card.includes("My list")&&card.includes("Pick my cards")&&card.includes("I'm done helping"),"here: list, pick, done",card);
e.helpersPopOpen("d"); ok(!e.gated,"he can open his own pick list without the Mom PIN");
e.helperTake("d","m1"); ok(e.helperHolds(T[0])==="d","he can tick his own card");
e.helperLeave("d"); ok(!e.helperIsHere("d"),"'I'm done helping' checks him out");
// he can't act for Grandma
e=env({dad:true,tasks:T}); e.__set({g:G(),d:DAD()},{[TODAY]:{g:{arrived:1}}});
e.helperLeave("g"); ok(e.helperIsHere("g"),"Dad can't check Grandma out");
e.helpersPopOpen("g"); ok(e.gated===1,"Dad opening Grandma's list hits the PIN");
e.helperArrive("d"); ok(!e.helperIsHere("d"),"helperArrive itself stays Mom-only");
// not on Dad's page (a kid's tablet): nothing
e=env({tasks:T}); e.__set({d:DAD()},{}); e.helperDadRequest(); ok(e.writes.length===0,"off Dad's page: no request");
e.__set({d:DAD()},{[TODAY]:{d:{arrived:1}}}); e.helperLeave("d"); e.helperTake("d","m1"); ok(e.helperIsHere("d")&&e.writes.length===0,"off Dad's page: can't leave/tick for him");
// kiosk=dad counts as his page
e=env({kioskD:true,tasks:T}); e.__set({d:DAD()},{}); e.helperDadRequest(); ok(e.helperRequested("d"),"his ?kiosk=dad link works too");
// nobody marked Dad → no card; page off → no card
e=env({dad:true}); e.__set({g:G()},{}); ok(e.helperDadCardHTML()==="","no Dad profile → no card");
e=env({dad:true,page:false}); e.__set({d:DAD()},{}); ok(e.helperDadCardHTML()==="","page off → no card");
// two marked: the first one wins
e=env({dad:true}); const d3=DAD(); d3.createdAt=9; e.__set({x:Object.assign(G(),{dadPage:true}),d:d3},{}); ok(e.helperDadId()==="x","first by created wins");
// settings toggles write one leaf each
e=env({mom:true}); e.__set({d:{name:"Dad",createdAt:1}},{}); e.helpersToggleDadPage("d"); e.helpersToggleSelfIn("d");
ok(e.__s().helpersData.d.dadPage===true&&e.__s().helpersData.d.selfIn===true,"profile toggles");
ok(e.writes.map(w=>w[1]).join()==="config/helpers/d/dadPage,config/helpers/d/selfIn","toggles = leaf writes");
// wiring
ok(src.includes('try{ h+=helperDadCardHTML(); }catch(e){}'),"card on Dad's Day");
ok(src.includes("Checks in from &#128104; Dad&rsquo;s Day")&&src.includes("Mom approves when he checks in"),"profile settings");
console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
