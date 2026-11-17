/*
 * 🏡 HH_SYNC_HELD — a Chores & Stars save must not retire a kid's one-time job that is waiting in the ☑️ Once pile
 * (her "Yes, fix it first" 2026-11-16; problem 3 in DESIGN_household_rooms_2026-11-15.md §2.3).
 * While Take over is on, every Chores & Stars save runs hhSyncKids: "steps that are gone are retired". A held once-job is off
 * every list on purpose (hhKidJobIds leaves it out), so the save never saw it and retired it — the ☑️ Once tab then showed it
 * as done. The level gate already had this guard ("a gated-off row is not a deleted row"); the pile now has it too.
 * Made-up family; the real save path (rtCfgSet / rtCfgMove → rtCfgSave → hhSyncKids) sliced from index.html.
 *                                                                                  run: node test_house_sync_keeps_held.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(process.env.BASE_HTML||path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HOUSEHOLD_TAKEOVER_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const EDITOR=fn("rtCfgEnsure")+"\n"+fn("rtCfgSave")+"\n"+fn("rtCfgSet")+"\n"+fn("rtCfgMove")+"\n"+fn("hhIsOnce")+"\n"+fn("hhOnceHeld");
function mk(){
  const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>true, confirm:()=>true,
    ROSTER:["ada","ben"], SL_KIDS:["ada","ben"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{ada:"Ada",ben:"Ben"}, KID_COLOR:{},
    routineCfg2:{chores:{ada:[{label:"Sweep the porch",pts:10,cad:"daily"},{label:"Vacuum hallway",pts:30,cad:"wk:2"}],ben:[{label:"Dust the shelves",pts:15,cad:"wk:2"}]},afternoon:{}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false,
    MC_DEFAULT:{}, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{dc_a:{label:"Dishes",cad:"daily",ts:1}}, activeWk:()=>"week26", _todayDay:"saturday", _todayStr:()=>"2026-10-10",
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>({})}, writes};
  vm.createContext(ctx); vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK+"\n"+EDITOR, ctx);
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
// A one-time job exactly as ＋ Add a chore ▸ One-time writes it (hhAddSave): cad "once", hold true, a kid's row made on the tab.
function pile(c,id,who,extra){ c.hhJobs()[id]=Object.assign({label:"Clean out the toy bin",cad:"once",slot:"chores",pts:20,who:who,src:{kind:"new"},source:"Household tab",area:"cleaning",floor:"",room:"any",level:1,status:"active",verdict:"",note:"",order:9,ts:5,from:"2026-10-10",hold:true},extra||{}); vm.runInContext("householdOnValue(householdData)",c); c.writes.length=0; }
const touched=(c,id)=>c.writes.filter(w=>w[0]==="update").some(w=>Object.keys(w[2]).some(k=>k.indexOf("household/jobs/"+id)===0))||c.writes.some(w=>String(w[1]).indexOf("household/jobs/"+id)===0);
const ADA0="rt_chores_ada_sweep_the_porch", ADA1="rt_chores_ada_vacuum_hallway", BEN0="rt_chores_ben_dust_the_shelves", ONCE="hhonce1";

console.log("The made-up family is set up as expected");
{ const c=mk(); const j=c.hhJobs();
  ok("the three list rows came in and Take over is on", !!j[ADA0]&&!!j[ADA1]&&!!j[BEN0]&&c.hhTakeoverOn(), Object.keys(j));
  pile(c,ONCE,"ada");
  ok("a one-time job in the pile is off the kid's list", c.rtStepsFor("chores","ada",true).length===2&&c.hhOnceHeld(c.hhJobs()[ONCE]));
}

console.log("A Chores & Stars save leaves the pile alone");
{ const c=mk(); pile(c,ONCE,"ada");
  c.rtCfgSet("chores","ada",0,"pts",12);
  const j=c.hhJobs()[ONCE];
  ok("changing a chore's stars: the waiting job is still active", j.status==="active", j.status);
  ok("… still in the pile (hold kept, not marked retire)", j.hold===true&&j.verdict===""&&c.hhOnceHeld(j), j);
  ok("… and nothing was written to its row", !touched(c,ONCE), c.writes);
  ok("the save wrote only what changed: that chore's stars", c.writes.length===1&&c.writes[0][0]==="update"&&JSON.stringify(c.writes[0][2])===JSON.stringify({["household/jobs/"+ADA0+"/pts"]:12}), c.writes);
  c.writes.length=0; c.rtCfgSet("chores","ben",0,"time","16:00");
  ok("a save on ANOTHER kid's list leaves it alone too", c.hhJobs()[ONCE].status==="active"&&c.hhJobs()[ONCE].hold===true&&!touched(c,ONCE), c.writes);
  c.writes.length=0; c.rtCfgMove("chores","ada",0,1);
  ok("moving a chore up or down leaves it alone", c.hhJobs()[ONCE].status==="active"&&c.hhJobs()[ONCE].hold===true&&!touched(c,ONCE), c.writes);
  c.writes.length=0; c.rtCfgSave(); c.rtCfgSave();
  ok("saving again with nothing changed writes nothing", c.writes.length===0, c.writes);
}

console.log("Every kid's pile, and several jobs at once");
{ const c=mk(); pile(c,"hhonce_a","ada"); pile(c,"hhonce_b","ben",{label:"Sort the game shelf",slot:"afternoon"}); pile(c,"hhonce_c","ben",{label:"Wipe the bikes",slot:"evening"});
  c.rtCfgSet("chores","ada",1,"pts",35);
  const j=c.hhJobs();
  ok("three waiting jobs across two kids and three lists all stay", ["hhonce_a","hhonce_b","hhonce_c"].every(id=>j[id].status==="active"&&j[id].hold===true&&!touched(c,id)), c.writes);
}

console.log("After the save, the job still sends");
{ const c=mk(); pile(c,ONCE,"ada"); c.rtCfgSet("chores","ada",0,"pts",12); c.writes.length=0;
  c.hhJobs()[ONCE].hold=false; vm.runInContext("householdOnValue(householdData)",c);   // what Send to… does to the row
  const list=c.rtStepsFor("chores","ada",true).map(s=>s.label);
  ok("sent from the pile: it is on the kid's list", list.length===3&&list.indexOf("Clean out the toy bin")>=0, list);
  c.rtCfgSave();
  ok("a save with it on the list keeps it active", c.hhJobs()[ONCE].status==="active");
}

console.log("What the save still retires (unchanged)");
{ const c=mk(); pile(c,ONCE,"ada");
  c.routineCfg2.chores.ada.splice(1,1); c.rtCfgSave();
  const j=c.hhJobs();
  ok("a chore taken off the list is retired", j[ADA1].status==="retired"&&j[ADA1].verdict==="retire");
  ok("… its neighbours are not", j[ADA0].status==="active"&&j[BEN0].status==="active");
  ok("… and the waiting job is not", j[ONCE].status==="active"&&j[ONCE].hold===true);
}
{ const c=mk(); pile(c,ONCE,"ada",{hold:false});   // a once-job already sent to the kid
  const i=c.routineCfg2.chores.ada.findIndex(s=>s.label==="Clean out the toy bin");
  ok("a sent one-time job is a step on the list", i>=0);
  c.routineCfg2.chores.ada.splice(i,1); c.rtCfgSave();
  ok("taking a SENT one-time job off the list still retires it", c.hhJobs()[ONCE].status==="retired");
}
{ const c=mk(); c.hhSet(BEN0,"level",2); c.writes.length=0;
  ok("a chore above the kid's level is off the list", c.rtStepsFor("chores","ben",true).length===0);
  c.rtCfgSet("chores","ada",0,"pts",12);
  ok("… and a save still does not retire it (the level guard)", c.hhJobs()[BEN0].status==="active"&&!touched(c,BEN0), c.writes);
}

console.log("Who can save");
{ const c=mk(); pile(c,ONCE,"ada"); c.momHere=()=>false; c.routineCfg2.chores.ada[0].pts=99; c.rtCfgSave();
  ok("not Mom → nothing written, nothing retired", c.writes.length===0&&c.hhJobs()[ONCE].status==="active"&&c.hhJobs()[ADA0].pts===10);
}

console.log("Wiring");
{ const sync=fn("hhSyncKids"), sweep=sync.slice(sync.lastIndexOf("Object.keys(jobs).forEach"));
  ok("the retire sweep skips a held row", /hhLevelOut\(j\)&&!j\.hold&&!seen\[id\]/.test(sweep), sweep.slice(0,200));
  ok("the list builder still leaves a held row off the list", /hhLevelOut\(j\)&&!j\.hold;/.test(fn("hhKidJobIds")));
  ok("＋ Add a chore still puts a one-time job in the pile", /if\(kind==="once"\) job\.hold=true;/.test(fn("hhAddSave")));
  ok("every write in the save is one targeted update under household/", (sync.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\(\)\.update\(upd\)/.test(sync)&&!/upd\["(?!household\/)/.test(sync));
  ok("no 🔀", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
