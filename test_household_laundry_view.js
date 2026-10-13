/*
 * 🧺 HH_LAUNDRY — the Laundry view (her 2026-10-12: "a laundry section that shows who has laundry which days"). A readout of the
 * same rows: machines now, who × weekday grid with a tap-to-edit cell, every few weeks, the once pile.  run: node test_household_laundry_view.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HH_LAUNDRY_END"), CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); const TODAY=iso(new Date());
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, isMom:true, momHere:()=>ctx.isMom, confirm:()=>true, rulesData:{}, calendarData:{holidays:{},vacations:{}},
    laundryData:o.machines||{}, laundrySince:ts=>"9:05 AM",
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{},
    routineCfg2:{chores:{lincoln:[{emoji:"🧺",label:"Start your laundry load",pts:10,cad:"wk:0"},{emoji:"👕",label:"Fold + put away your clothes",pts:15,cad:"wk:0"},{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:2"}],lucy:[{emoji:"🛌",label:"Strip the king and the queen",pts:15,cad:"wk:0"}],ellis:[{emoji:"🦎",label:"Greg's cage: poop out, paper towel checked",pts:5,cad:"daily"}]},afternoon:{}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Lucy + Julian's load",cad:"wk:2",ts:1},mc_b:{label:"Towels load (hot)",cad:"wk:4",ts:1},mc_c:{label:"Wash the shower mats",cad:"2w",ts:1},mc_d:{label:"Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{}, activeWk:()=>"week26", _todayDay:"monday", _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>null}, writes};
  vm.createContext(ctx); vm.runInContext(fn("toMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.hhImport(); ctx.hhTakeover(true);
  ctx.get('householdData.jobs.hh_mom_curtains={label:"Wash the boys\' curtains",emoji:"🪟",cad:"42d",who:"mom",area:"cleaning",room:"boys",status:"active",from:"2027-01-26",src:{kind:"momChore",id:"hh_mom_curtains"},order:60,ts:1}; householdData.jobs.hh_mom_beds={label:"Strip + wash both boys\' beds",emoji:"🛏",cad:"once",hold:true,who:"mom",area:"cleaning",room:"boys",status:"active",src:{kind:"momChore",id:"hh_mom_beds"},order:61,ts:1}; householdOnValue(householdData);');
  ctx.isMom=!o.noMom; ctx.writes.length=0; return ctx;
}
console.log("1. Which rows are laundry");
{ const c=mk(); const ids=c.hhLaundryRows(); const has=l=>ids.some(id=>c.hhJobs()[id].label===l);
  ok("loads, sheets, fold, mats, curtains, the once-job: in", has("Start your laundry load")&&has("Fold + put away your clothes")&&has("Strip the king and the queen")&&has("Lucy + Julian's load")&&has("Towels load (hot)")&&has("Wash the shower mats")&&has("Wash the boys' curtains")&&has("Strip + wash both boys' beds"));
  ok("the kitchen close-down, the vacuum and Greg's paper towel (animals): out", !has("Kitchen close-down")&&!has("Vacuum kitchen")&&!has("Greg's cage: poop out, paper towel checked"));
}
console.log("2. The view");
{ const c=mk({machines:{l1:{label:"Towels",stage:"dryer",ts:1}}}); c.hhGo("laundry"); const el={}; c.renderHousehold(el); const h=el.innerHTML;
  ok("the 🧺 Laundry chip and the machines card: Towels in the dryer since 9:05", /hhGo\('laundry'\)/.test(h)&&/🌀 Towels <span[^>]*>· dryer · since 9:05 AM/.test(h));
  ok("the grid: Lincoln's Mon start + fold, Lucy's Mon strip, Mom's Wed load and Fri towels", /hhLaundryCellPick\('lincoln',0\)[^>]*>(?:(?!<\/td>).)*Start your laundry load(?:(?!<\/td>).)*Fold \+ put away/.test(h)&&/hhLaundryCellPick\('lucy',0\)[^>]*>(?:(?!<\/td>).)*Strip the king/.test(h)&&/hhLaundryCellPick\('mom',2\)[^>]*>(?:(?!<\/td>).)*Lucy \+ Julian/.test(h)&&/hhLaundryCellPick\('mom',4\)[^>]*>(?:(?!<\/td>).)*Towels load/.test(h));
  ok("Monday's header counts three loads; Ellis has no row at all", /Mon<div[^>]*>3</.test(h)&&!/>Ellis</.test(h));
  c.hhLaundryCellPick("mom",2); c.renderHousehold(el); ok("tap Mom · Wed: her load row opens below with ✎ Edit", /Mom · Wed/.test(el.innerHTML)&&/hhEditToggle\('mc_mc_a'\)/.test(el.innerHTML));
  ok("every few weeks: the mats (every 2 weeks, with its need) and the curtains dated Jan 26 (greyed, 'from 01-26')", /🗓 Every few weeks/.test(h)&&/Wash the shower mats/.test(h)&&/Wash the boys' curtains/.test(h)&&/from 01-26/.test(h)&&/hhEditToggle\('mc_mc_c'\)/.test(h));
  ok("the once pile: the boys' beds with Send to Mom", /☑️ Once · 1 in the pile/.test(h)&&/hhOnceSend\('hh_mom_beds','mom'\)/.test(h));
  const k=mk({noMom:true}); k.hhGo("laundry"); const e2={}; k.renderHousehold(e2); ok("a kid's device: the readout, no edit or send buttons", /🧺 In the machines/.test(e2.innerHTML)&&!/hhEditToggle\(/.test(e2.innerHTML)&&!/hhOnceSend\(/.test(e2.innerHTML));
  ok("nothing written by any of it", c.writes.length===0&&k.writes.length===0);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
