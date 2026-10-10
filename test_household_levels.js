/*
 * 🪜 HH_LEVEL_PERSON — levels per person (her ask 2026-10-10: "could we do levels per person? … I also want the test for me too").
 * household/levels/<who>/current pins a person; without one they follow the family dial. The gate asks the person's level; the
 * ready meter can be read per person. Mom and Dad included.                                   run: node test_household_levels.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HOUSEHOLD_TAKEOVER_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
function mk(){
  const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>true, confirm:()=>true,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{},
    routineCfg2:{chores:{lincoln:[{label:"Vacuum kitchen",pts:30,cad:"wk:2"}],lucy:[{label:"Dust dining area",pts:15,cad:"wk:2"}]},afternoon:{}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false,
    MC_DEFAULT:{}, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"🌙 Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{dc_a:{label:"Dishes",cad:"daily",ts:1}}, activeWk:()=>"week26", _todayDay:"saturday", _todayStr:()=>"2026-10-10",
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>({})}, writes};
  vm.createContext(ctx); vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
const LINC="rt_chores_lincoln_vacuum_kitchen", LUCY="rt_chores_lucy_dust_dining_area";
console.log("Per-person dial, with the family dial as the default");
{ const c=mk(); c.hhSet(LINC,"level",2); c.hhSet(LUCY,"level",2); c.hhSet("mc_mc_a","level",2); c.hhSet("dc_dc_a","level",2);
  ok("everyone follows the family dial (1): the level-2 rows are off every list", c.rtStepsFor("chores","lincoln",true).length===0&&c.rtStepsFor("chores","lucy",true).length===0&&!c.mcAll().mc_a&&!c.dcAll().dc_a);
  ok("levels read: family 1, each person follows it", c.hhLevelCur()===1&&c.hhLevelCurFor("lincoln")===1&&c.hhLevelOwn("lincoln")===0);
  c.writes.length=0; c.hhLevelSetFor("lincoln",2);
  ok("Lincoln pinned at 2: one targeted write", c.writes.length===1&&c.writes[0][1]==="household/levels/lincoln/current"&&c.writes[0][2]===2, c.writes);
  ok("Lincoln's row is on his list; Lucy's still isn't", c.rtStepsFor("chores","lincoln",true).length===1&&c.rtStepsFor("chores","lucy",true).length===0);
  c.hhLevelSetFor("mom",2); ok("Mom pinned at 2: her row is on her strip; Dad's isn't", !!c.mcAll().mc_a&&!c.dcAll().dc_a);
  c.hhLevelSet(2); ok("family to 2: Lucy and Dad follow it", c.rtStepsFor("chores","lucy",true).length===1&&!!c.dcAll().dc_a);
  c.hhLevelSetFor("lucy",1); ok("Lucy pinned back to 1 while the family is at 2: hers leaves again", c.rtStepsFor("chores","lucy",true).length===0&&c.rtStepsFor("chores","lincoln",true).length===1);
  c.writes.length=0; c.hhLevelSetFor("lucy",0); ok("'follow family' removes her pin (one remove) and she follows 2", c.writes.length===1&&c.writes[0][0]==="rm"&&c.writes[0][1]==="household/levels/lucy"&&c.rtStepsFor("chores","lucy",true).length===1);
  c.writes.length=0; c.hhLevelSetFor("grab",2); c.hhLevelSetFor("nobody",2); c.hhLevelSetFor("ellis",7); ok("bad targets ignored", c.writes.length===0);
  const d=mk(); d.momHere=()=>false; d.hhLevelSetFor("lincoln",2); ok("not Mom → nothing", d.writes.length===0&&d.hhLevelOwn("lincoln")===0);
}
console.log("The meter per person");
{ const c=mk(); const all=c.hhReady(1), mom=c.hhReady(1,"mom"), dad=c.hhReady(1,"dad"), lin=c.hhReady(1,"lincoln");
  ok("the family meter counts everyone's house rows; a person's counts theirs", all.rows===mom.rows+dad.rows+lin.rows+c.hhReady(1,"lucy").rows+c.hhReady(1,"ellis").rows+c.hhReady(1,"julian").rows&&mom.rows===1&&dad.rows===1);
  const el={}; c.hhGo("levels"); c.renderHousehold(el);
  ok("Levels view: the family dial plus a card per person with ▾ ▴ and a meter, Mom and Dad included", /Ready for the next level\? \(the family\)/.test(el.innerHTML)&&/Mom · Level 1/.test(el.innerHTML)&&/Dad · Level 1/.test(el.innerHTML)&&/hhLevelSetFor\('mom',2\)/.test(el.innerHTML)&&/follows the family/.test(el.innerHTML)&&!/Up for Grabs · Level/.test(el.innerHTML));
  c.hhLevelSetFor("mom",2); c.renderHousehold(el); ok("a pinned person shows 'own' and a 'follow family' button", /Mom · Level 2/.test(el.innerHTML)&&/hhLevelSetFor\('mom',0\)/.test(el.innerHTML));
}
console.log("Wiring"); ok("the gate asks the person's level", /hhLevelOf\(j\)<=hhLevelCurFor\(j\.who\)/.test(src)); ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
