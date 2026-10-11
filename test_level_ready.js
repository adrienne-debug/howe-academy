/*
 * 🪜 LEVELREADY — "Lincoln is ready for Level 2" in 🔴 Now (her ask 2026-10-10). One line per person whose own meter reads three
 * full weeks at 80%+, ▴ Move up and Not now; it rides the reminder list (badge + ding). Nothing moves on its own.
 *                                                                                              run: node test_level_ready.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// LEVELREADY_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const dow=s=>(new Date(s+"T12:00:00Z").getUTCDay()+6)%7;
const TODAY=iso(new Date()), N=dayNum(TODAY), MON=N-dow(TODAY);
const atOf=s=>new Date(s+"T12:00:00").getTime();
function mk(o){
  o=o||{}; const writes=[], ls={};
  // Lucy did her Monday chore + daily pickup every day for the 22 days before this Monday; Lincoln did nothing
  const cfg={afternoon:{lucy:[{emoji:"🍽️",label:"Pickup kitchen",pts:20,cad:"daily"}],lincoln:[{emoji:"🧹",label:"Pickup school room",pts:20,cad:"daily"}]},chores:{lucy:[{emoji:"🛌",label:"Take sheets off beds",pts:15,cad:"wk:0"}]}};
  const log={lucy:{}}; const s0=MON-1-21;
  for(let n=s0;n<MON;n++){ const wk="wk"+Math.floor((n-s0)/7), s=isoOf(n), dk=DN[new Date(s+"T12:00:00Z").getUTCDay()]; log.lucy[wk]=log.lucy[wk]||{}; log.lucy[wk][dk]={p:{label:"Pickup kitchen",slot:"afternoon",act:"on",ts:"",at:atOf(s),pts:20}}; if(dow(s)===0) log.lucy[wk][dk].a={label:"Take sheets off beds",slot:"chores",act:"on",ts:"",at:atOf(s),pts:15}; }
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:log, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true}, dadChoresData:{}, activeWk:()=>"week26", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>({})}, writes};
  vm.createContext(ctx); vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
console.log("Who is ready");
{ const c=mk(); const L=c.hhLevelReadyList();
  ok("Lucy (three weeks at 100%) is ready for Level 2; Lincoln (0%) is not; nobody else has rows", L.length===1&&L[0].who==="lucy"&&L[0].next===2, L);
  const now=c.hhLevelReadyNowHTML(); ok("the Now line names her, with ▴ Move up and Not now", now.n===1&&/<b>Lucy<\/b> is ready for Level 2/.test(now.html)&&/hhLevelSetFor\('lucy',2\)/.test(now.html)&&/hhLevelReadySeen\('lucy',2\)/.test(now.html));
  c.writes.length=0; c.hhLevelReadySeen("lucy",2);
  ok("Not now: one targeted write, the line goes away", c.writes.length===1&&c.writes[0][1]==="household/levels/lucy/readySeen"&&c.writes[0][2]===2&&c.hhLevelReadyList().length===0);
  c.hhLevelSetFor("lucy",2); ok("moved to 2: her meter is now read at level 2 (still 100% here) and the line is for Level 3", (()=>{ const L2=c.hhLevelReadyList(); return L2.length===1&&L2[0].next===3; })());
  c.hhLevelSetFor("lucy",3); ok("at 3 there is nothing above: no line", c.hhLevelReadyList().length===0);
  const d=mk({noMom:true}); d.hhLevelReadySeen("lucy",2); ok("not Mom → no write", d.writes.length===0);
  const e=mk(); e.hhLevelReadySeen("lucy",9); e.hhLevelReadySeen("lucy",1); ok("bad levels ignored", e.writes.length===0);
}
console.log("Wiring");
ok("Now section draws it", /try\{ const _lr=hhLevelReadyNowHTML\(\); nowN\+=_lr\.n; h\+=_lr\.html; \}catch\(e\)\{\}/.test(src));
ok("it rides the reminder list (badge + ding)", /hhLevelReadyList\(\)\.forEach\(it=>add\("remind","level_"\+it\.who\+"_"\+it\.next\)\)/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
