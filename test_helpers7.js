// test_helpers7.js — 🙋 her rule 10/3: a helper only ever gets Mom-required or May-need-Mom cards. Work the kids do
// alone never goes to a helper, even if a profile has it ticked. Usage: node test_helpers7.js [index.html]
const fs=require("fs"), vm=require("vm"), path=require("path");
const file=process.argv[2]||process.env.HA_INDEX||path.join(__dirname,"index.html");
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m,x){ if(c) pass++; else { fail++; console.log("FAIL:",m,x!==undefined?JSON.stringify(x):""); } }
const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
function lsd(){ const i=src.indexOf("function lessonDayList("); return src.slice(i,src.indexOf("\n}",i)+2); }
function iso(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
const TODAY=iso();
const subs={andrew:{arith:{display:"Arithmetic 2",mom:"required"},facts:{display:"Fact Review",mom:"none"},read:{display:"Reading",mom:"maybe"},
  hw:{display:"Handwriting",mom:"none",momDays:[2]}},makenzie:{piano:{display:"Piano",mom:"none"}}};
function env(tasks){
  const ctx={console,db:null,_dryRun:()=>true,momHere:()=>true,rulesOpen:{helpers:true},pageOn:()=>true,
    DAYS:["wednesday"],DAY_LBL:{wednesday:"Wednesday"},ROSTER:["andrew","makenzie"],currData:{subjects:subs},
    weekData:{tasks},getActiveTasks:()=>tasks,checked:{},cap:s=>s,esc:s=>String(s==null?"":s),toMin:()=>600,
    ampmTo24:s=>s,to12h:s=>s,document:{activeElement:null},Date,Object,Array,String,Number,JSON};
  Object.defineProperty(ctx,"_todayDay",{get:()=>"wednesday"});
  ctx.renderAll=()=>{};
  vm.createContext(ctx); vm.runInContext(lsd()+"\n"+src.slice(a,b)+"\nthis.__set=(h,d,o)=>{helpersData=h;helperDaysData=d;helpersOpen=o||{};};",ctx); return ctx;
}
const C=(id,sk,mom)=>({id,who:"andrew",subjectKey:sk,day:"wednesday",time:"10:00 AM",title:id,mom});
const T=[C("t_arith","arith","required"),C("t_facts","facts","none"),C("t_read","read","maybe"),C("t_hw1","hw","none"),C("t_hw2","hw","required"),C("t_nomom","arith",undefined)];
const D={name:"Dad",createdAt:1,pick:false,help:{andrew:{arith:true,facts:true,read:true,hw:true}}};
let e=env(T); e.__set({d:D},{[TODAY]:{d:{arrived:1}}});
ok(e.helperHolds(T[0])==="d","Mom-required card → helper");
ok(e.helperHolds(T[1])===null,"independent card never goes to a helper, even ticked");
ok(e.helperHolds(T[2])==="d","May-need-Mom card → helper");
ok(e.helperHolds(T[3])===null&&e.helperHolds(T[4])==="d","Mom-on-set-days subject: only the day it needs Mom");
ok(e.helperHolds(T[5])===null,"a card with no Mom setting → not a helper's");
ok(e.helperTasksToday("d").map(t=>t.id).join()==="t_arith,t_read,t_hw2","her list only shows Mom work");
// editor
e.__set({d:D},{},{d:true});
let h=e.helpersCardHTML();
ok(h.includes("Arithmetic 2")&&h.includes("Reading")&&h.includes("Handwriting"),"editor lists required, maybe and set-days subjects");
ok(h.includes("may</span>")&&h.includes("set days</span>"),"editor marks May-need-Mom and set days");
ok(h.includes("Fact Review &times;")&&/line-through[^>]*>Fact Review/.test(h),"an already-ticked independent subject shows struck through to remove");
ok(!h.includes("Piano"),"un-ticked independent subjects aren't offered");
ok(!h.includes(">makenzie<"),"a kid with no Mom subjects isn't listed");
ok(h.includes("Only lessons that need Mom are listed"),"editor explains");
ok(e._hlpSubjEligible({mom:"required"})&&e._hlpSubjEligible({mom:"maybe"})&&e._hlpSubjEligible({mom:"none",momDays:[1]})&&!e._hlpSubjEligible({mom:"none"})&&!e._hlpSubjEligible(null),"eligibility");
console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
