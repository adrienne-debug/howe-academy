// test_helpers3.js — 🙋 a helper's own list: the "👵 Grandma" chip at the top while she's here, her filtered
// schedule and its header. Usage: node test_helpers3.js [index.html]
const fs=require("fs"), vm=require("vm"), path=require("path");
const file=process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html");
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }
const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
ok(a>0&&b>a,"HELPERS block present");
const block=src.slice(a,b);
ok(/var helperView=null;/.test(block),"helperView is a var (safe before boot reaches it)");
function iso(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const TODAY=iso();
function env(o){
  o=o||{}; const tasks=o.tasks||[];
  const ctx={ console, db:null, _dryRun:()=>true, momHere:()=>true, rulesOpen:{}, renders:0, shown:null,
    pageOn:k=>k==="helpers"?o.page!==false:true, DAYS:["wednesday"], DAY_LBL:{wednesday:"Wednesday"}, ROSTER:["andrew","makenzie"],
    weekData:{tasks}, getActiveTasks:()=>tasks, checked:o.checked||{}, cap:s=>s,
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
    toMin:s=>{const m=String(s||"").match(/(\d+):(\d+)\s*(AM|PM)/i);if(!m)return 0;let h=+m[1];if(m[3].toUpperCase()==="PM"&&h!==12)h+=12;if(m[3].toUpperCase()==="AM"&&h===12)h=0;return h*60+ +m[2];},
    kid:"mom", day:"monday", tab:o.tab||"schedule", schedShowAdmin:true, schedShowHistory:false, schedShowPace:false, schedShowBoard:false, schedShowPeek:false,
    document:{activeElement:null,getElementById:()=>null}, window:{scrollTo(){}}, Date };
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.renderAll=()=>{ ctx.renders++; }; ctx.showTab=t=>{ ctx.shown=t; ctx.tab=t; };
  vm.createContext(ctx);
  vm.runInContext(block+"\nthis.__set=(h,d)=>{helpersData=h;helperDaysData=d;};",ctx);
  return ctx;
}
const G={name:"Grandma",icon:"👵",pick:false,createdAt:1,help:{andrew:{spelling:true}}};
const D={name:"Dad",icon:"👨",pick:true,createdAt:2,help:{andrew:{math:true}}};
const T=[{id:"s1",who:"andrew",subjectKey:"spelling",day:"wednesday",time:"10:00 AM",mom:"required",title:"Spelling test"},
         {id:"s2",who:"andrew",subjectKey:"spelling",day:"wednesday",time:"11:00 AM",mom:"required",title:"Spelling 2"},
         {id:"m1",who:"andrew",subjectKey:"math",day:"wednesday",time:"10:30 AM",mom:"required",title:"Math"}];
let e=env({tasks:T}); e.__set({g:G,d:D},{});
ok(e.helperChipsHTML()==="","nobody here → no chips");
e.__set({g:G,d:D},{[TODAY]:{g:{arrived:1},d:{arrived:1}}});
let chips=e.helperChipsHTML();
ok(chips.includes("👵 Grandma")&&chips.includes("👨 Dad")&&chips.indexOf("Grandma")<chips.indexOf("Dad"),"both here → both chips, in order",chips);
e.selHelper("g");
ok(e.helperView==="g"&&e.kid==="all"&&e.day==="wednesday"&&e.schedShowAdmin===false,"chip → her list on today's schedule");
ok(e.helperChipsHTML().includes('kid-btn active" data-helper="g"'),"her chip lights up");
let head=e.helperViewHeadHTML("wednesday");
ok(head.includes("Grandma&rsquo;s list")&&head.includes("2 to do"),"header: her name + count",head);
ok(e.helperViewHeadHTML("thursday")==="","header only on today");
e.checked.s1="10:05 AM"; ok(e.helperViewHeadHTML("wednesday").includes("1 to do"),"a kid's check-off drops the count");
e.checked.s2="11:02 AM"; ok(e.helperViewHeadHTML("wednesday").includes("All done"),"all done message");
// she leaves → view clears itself
e.__set({g:G,d:D},{[TODAY]:{g:{arrived:1,left:2},d:{arrived:1}}});
ok(e.helperViewActive()===false&&e.helperView===null,"she left → her list closes");
ok(!e.helperChipsHTML().includes("Grandma"),"…and her chip is gone");
e.selHelper("g"); ok(e.helperView===null,"can't open a list for someone not here");
// Dad, pick on: his list is only what he ticked
e.selHelper("d"); ok(e.helperView==="d","Dad's chip opens his list");
ok(e.helperViewHeadHTML("wednesday").includes("Nothing for Dad today"),"nothing ticked → nothing on his list");
// page off → nothing
e=env({tasks:T,page:false}); e.__set({g:G},{[TODAY]:{g:{arrived:1}}}); ok(e.helperChipsHTML()===""&&!e.helperViewActive(),"page off → no chip, no list");
// from another tab
e=env({tasks:T,tab:"moms-plan"}); e.__set({g:G},{[TODAY]:{g:{arrived:1}}}); e.selHelper("g"); ok(e.shown==="schedule","chip from another tab goes to the schedule");
// wiring
ok(src.includes('+ ((typeof helperChipsHTML==="function")?helperChipsHTML():"")'),"chips in the kid row");
ok(src.includes("function selKid(k){\n  try{ helperView=null; }catch(e){}"),"any other chip leaves her list");
ok(src.includes('else if(typeof helperViewActive==="function"&&helperViewActive()) allDay=allDay.filter(t=>helperHolds(t)===helperView);'),"All schedule filtered to her cards");
ok(src.includes("h+=helperViewHeadHTML(day);"),"header on the day");
ok(src.includes('(k===kid&&!(k==="all"&&typeof helperViewActive==="function"&&helperViewActive()))'),"All chip not lit on her list");
console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
