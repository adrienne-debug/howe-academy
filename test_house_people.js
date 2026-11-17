/*
 * HH_PEOPLE + HOUSEPEOPLE — Household by room, step 3 (DESIGN_household_rooms_2026-11-15 §5, §9 row 3): each person's limits as data
 * (household/people/<who> = {school, weekend, fit}) and the plan-preview switch (household/meta/engine). Proves: with nothing stored
 * the limits are exactly what hhBudget gave before (HH_BUDGET on a school day, Settings ▸ 🧽 Cleaning Day on a weekend — for every
 * person, every day of the week, with and without Cleaning Day numbers); each edit is ONE targeted write; not Mom → nothing;
 * ?dryrun=1 → nothing written; the switch writes only household/meta/engine and can never say "on".
 * Made-up family only (Ava, Ben, Cal; Mom, Dad).
 *   run: node test_house_people.js
 *   BASE_HTML=/path/to/main/index.html node test_house_people.js → "before" = that file's hhBudget, not this file's with the new
 *   clause taken out.
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const testSrc=require("./test_src.js");
const SRC=testSrc();   // index.html with house.js put back at its marker
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fnOf=s=>name=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cutOf=s=>(a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a+" / "+b); return s.slice(i,s.indexOf("\n",j)); };
const fn=fnOf(SRC), cut=cutOf(SRC);
const HH=cut("// HOUSEHOLD_START","// HOUSEPEOPLE_END");
const CAD=SRC.slice(SRC.indexOf("const _CAD_DOW="),SRC.indexOf("function cadLabel("));
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("rtApplyRot");
// "before": main's hhBudget (BASE_HTML) or this one with the HH_PEOPLE clause taken out
const NEWB=fn("hhBudget"), CLAUSE='const own=(typeof hhPeopleLim==="function")?hhPeopleLim(who,d>=5):null; if(own!==null) return own;   /* HH_PEOPLE: her number once she sets one */ ';
let OLDB;
if(process.env.BASE_HTML){ OLDB=fnOf(fs.readFileSync(process.env.BASE_HTML,"utf8"))("hhBudget"); console.log("(base: "+process.env.BASE_HTML+")"); }
else { if(NEWB.split(CLAUSE).length!==2) throw new Error("the HH_PEOPLE clause moved"); OLDB=NEWB.replace(CLAUSE,""); }
OLDB=OLDB.replace("function hhBudget(","function hhBudgetBefore(");
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"), TODAY=isoD(new Date());
const WEEK=["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22"];   // Mon … Sun
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])}),},
    _dryRun:()=>!!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, rulesData:o.rules||{}, calendarData:{},
    ROSTER:["ava","ben","cal"], SL_KIDS:["ava","ben","cal"], SL_SLOTS:["morning","afternoon","chores","evening"], KID_NAME:{ava:"Ava",ben:"Ben",cal:"Cal"},
    routineCfg2:{}, morningRoutineCfg:{}, RT_DEFAULT:{}, momChoresData:{}, dadChoresData:{}, routineLog:{}, _mrLegacySteps:()=>[],
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>null}, writes};
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+HH+"\n"+OLDB+"\nhouseholdData="+JSON.stringify(o.hh||{jobs:{a1:{label:"Sweep",who:"ava",area:"cleaning",cad:"daily",minutes:10,slot:"chores"}}})+";\nthis.HD=function(){ return householdData; };", ctx);
  Object.defineProperty(ctx,"householdData",{get:()=>ctx.HD()});
  return ctx;
}
const WHO=["ava","ben","cal","mom","dad"];

console.log("\n── nothing stored → exactly the old numbers ──");
for(const rules of [{}, {cleaningDay:{minutes:{ava:45,mom:0,dad:200}}}]){
  const c=mk({rules}); const diff=[];
  WHO.concat(["zed"]).forEach(w=>WEEK.forEach(d=>{ const a=c.hhBudget(w,d), b=c.hhBudgetBefore(w,d); if(a!==b) diff.push(w+" "+d+" "+a+"≠"+b); }));
  ok("hhBudget = before, every person × every weekday"+(rules.cleaningDay?" (with Cleaning Day minutes set)":" (Cleaning Day defaults)"), diff.length===0, diff);
  const P=c.hpPeople(); ok("…and the engine's limits are those numbers", WHO.every(w=>P[w].school===c.hhBudgetBefore(w,WEEK[0])&&P[w].weekend===c.hhBudgetBefore(w,WEEK[5])), P);
}
{ const c=mk(); ok("fit defaults: the kids school first, Mom and Dad mixed in", c.hpFitOf("ava")==="school"&&c.hpFitOf("mom")==="mixed"&&c.hpFitOf("dad")==="mixed");
  ok("no switch stored → the preview is off", c.hhEngineMode()==="off"); }
{ const c=mk({hh:{jobs:{},people:{ava:{fit:"mixed"},ben:{school:"",weekend:null}}}}); ok("a person node with no number (or a blank one) still reads the old numbers", ["ava","ben"].every(w=>WEEK.every(d=>c.hhBudget(w,d)===c.hhBudgetBefore(w,d)))); }

console.log("\n── Mom edits a number: one targeted write ──");
{ const c=mk();
  ok("school-day limit → household/people/ava/school only", c.hpLimitSet("ava","school","40")===40&&JSON.stringify(c.writes)===JSON.stringify([["set","household/people/ava/school",40]]), c.writes);
  ok("…hhBudget reads it on every school day; the weekend and everyone else unchanged", WEEK.slice(0,5).every(d=>c.hhBudget("ava",d)===40)&&c.hhBudget("ava",WEEK[5])===c.hhBudgetBefore("ava",WEEK[5])&&c.hhBudget("ben",WEEK[0])===c.hhBudgetBefore("ben",WEEK[0]));
  c.writes.length=0; c.hpLimitSet("cal","weekend",0);
  ok("weekend limit 0 is a real number → household/people/cal/weekend = 0, read on Sat and Sun", JSON.stringify(c.writes)===JSON.stringify([["set","household/people/cal/weekend",0]])&&c.hhBudget("cal",WEEK[5])===0&&c.hhBudget("cal",WEEK[6])===0&&c.hhBudget("cal",WEEK[0])===c.hhBudgetBefore("cal",WEEK[0]));
  c.writes.length=0; c.hpFitSet("mom","school");
  ok("mixed in / school first → household/people/mom/fit only", JSON.stringify(c.writes)===JSON.stringify([["set","household/people/mom/fit","school"]])&&c.hpFitOf("mom")==="school");
  c.writes.length=0; c.hpLimitSet("ava","school","");
  ok("blank clears that one number (removes the path) → back to the old number", JSON.stringify(c.writes)===JSON.stringify([["rm","household/people/ava/school"]])&&c.hhBudget("ava",WEEK[0])===c.hhBudgetBefore("ava",WEEK[0]));
  c.writes.length=0;
  [["ava","school","-1"],["ava","school","601"],["ava","school","abc"],["ava","school","2.5"],["ava","nap","10"],["grab","school","10"],["zed","school","10"]].forEach(a=>c.hpLimitSet(...a));
  c.hpFitSet("ava","sometimes"); c.hpFitSet("grab","mixed");
  ok("bad numbers, unknown fields and people, Up for Grabs → nothing written", c.writes.length===0, c.writes);
  ok("the table is untouched by limit edits", JSON.stringify(c.householdData.jobs)===JSON.stringify({a1:{label:"Sweep",who:"ava",area:"cleaning",cad:"daily",minutes:10,slot:"chores"}}));
}
{ const c=mk({noMom:true}); c.hpLimitSet("ava","school",40); c.hpFitSet("ava","mixed"); c.hpEngineSet(true);
  ok("not Mom → nothing written, nothing changed", c.writes.length===0&&c.hhBudget("ava",WEEK[0])===c.hhBudgetBefore("ava",WEEK[0])&&!c.householdData.people&&c.hhEngineMode()==="off"); }
{ const c=mk({dry:true}); c.hpLimitSet("ava","school",40); c.hpFitSet("ava","mixed"); c.hpEngineSet(true); c.hpEngineSet(false);
  ok("?dryrun=1 → nothing written", c.writes.length===0); }

console.log("\n── the plan-preview switch ──");
{ const c=mk(); const r=c.hpEngineSet(true);
  ok("Show the plan preview → household/meta/engine = {mode:preview, on:today}, nothing else", JSON.stringify(c.writes)===JSON.stringify([["set","household/meta/engine",{mode:"preview",on:TODAY}]])&&c.hhEngineMode()==="preview", c.writes);
  c.householdData.meta.engine.on="2026-11-01"; c.writes.length=0; c.hpEngineSet(false);
  ok("off → {mode:off} and the switch-on date is kept", JSON.stringify(c.writes)===JSON.stringify([["set","household/meta/engine",{mode:"off",on:"2026-11-01"}]])&&c.hhEngineMode()==="off");
  c.writes.length=0; c.hpEngineSet(true);
  ok("on again → the first switch-on date stands (never-done every-N chores keep their dates)", c.writes.length===1&&c.writes[0][2].on==="2026-11-01");
  c.writes.length=0; c.hpEngineSet("on"); c.hpEngineSet(2);
  ok("it can never write mode \"on\" (that is step 4)", c.writes.every(w=>w[2].mode==="preview"));
  const c2=mk(); c2.hpEngineSet(false); ok("off when it was never on → nothing written", c2.writes.length===0);
  const c3=mk({hh:{jobs:{},meta:{takeover:5,engine:{mode:"on",on:"2026-11-01"}}}}); ok("a stored mode other than preview reads as off here (nothing in step 3 acts on 'on')", c3.hhEngineMode()==="off");
  ok("the switch keeps every other meta field (takeover stays)", (c3.hpEngineSet(true),c3.householdData.meta.takeover===5));
}

console.log("\n── every write this step can make ──");
{ const HJ=fs.readFileSync(path.join(__dirname,"house.js"),"utf8"), files=HJ.slice(HJ.indexOf("// HOUSEENG_START"),HJ.indexOf("// HOUSEPREVIEW_END"))+"\n"+cut("// HH_PEOPLE_START","// HH_PEOPLE_END");   // this step's blocks (HOUSESLIM moved older Household code into house.js too; its writes are unchanged and tested where they were)
  const refs=[...files.matchAll(/db\.ref\(([^)]*)\)/g)].map(m=>m[1]);
  ok("every db.ref in house.js and HH_PEOPLE is household/people/<who>/<field> or household/meta/engine", refs.length>0&&refs.every(r=>/^"household\/people\/"\+who\+"\/"\+field$|^"household\/people\/"\+who\+"\/fit"$|^"household\/meta\/engine"$/.test(r)), refs);
  ok("every one of them sits behind _hhWrite() on its line", files.split("\n").filter(l=>/db\.ref\(/.test(l)).every(l=>/if\(_hhWrite\(\)\)/.test(l)));
  ok("no update() / whole-node write in house.js", !/db\.ref\(\)|\.update\(/.test(files)); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
