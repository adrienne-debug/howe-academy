/* 🏡 HH_REVIEW_SLOTFOLD (her ask 2026-10-13: "make the review page also collapsable by time of day per person"): on 📋 Review, inside an open
   person each time of day is its own fold (count · minutes), starting folded — the same fold Area and Room use. Most-behind sort stays flat.
   Harness copied from test_household_tab.js.                                                      run: node test_household_review_fold.js */const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HOUSEHOLD_GRID_END");   // Review + the fold helpers (HH_PERSONFOLD/HH_SLOTFOLD live in the grid block)
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
// a Monday inside the last-4-weeks window (yesterday back 27 days), and the Tuesday/Wednesday after it
const END=dayNum(iso(new Date()))-1; let MON=END-27; while((new Date(isoOf(MON)+"T12:00:00Z").getUTCDay())!==1) MON++;
const MON_ISO=isoOf(MON), TUE_ISO=isoOf(MON+1), WED_ISO=isoOf(MON+2);
const atOf=s=>new Date(s+"T12:00:00").getTime();   // local noon, like a real tap
function mk(o){
  o=o||{}; const writes=[], renders=[], ls={};
  const cfg={afternoon:{lincoln:[{emoji:"🧹",label:"Pickup school room",pts:20,cad:"daily",rot:"downstairs",time:"",from:"",to:""}],
                        ellis:[{emoji:"🛋️",label:"Pickup living room",pts:20,cad:"daily",rot:"downstairs"}],
                        lucy:[{emoji:"🐕",label:"Let Chloe out",pts:0,cad:"daily"},{emoji:"🍽️",label:"Pickup kitchen",pts:20,cad:"daily",rot:"downstairs"},{emoji:"",label:"shower",pts:50,cad:"wk:2,4,6"}]},
             chores:{lucy:[{emoji:"🛌",label:"Take sheets off beds",pts:15,cad:"wk:0",time:""}]}};
  // the log: Lucy's Monday sheets tapped Tuesday (late) + the app's miss on Monday; the right pickup room one day, the wrong room another;
  // a grab claim; Mom's sheets stamped Wednesday
  const g=["Pickup school room","Pickup living room","Pickup kitchen"]; const lucyRoomOn=d=>g[(2+dayNum(d))%3];
  const Y1=isoOf(END), Y2=isoOf(END-1), Y3=isoOf(END-2);
  const dayKey=s=>DN[new Date(s+"T12:00:00Z").getUTCDay()];
  // each tap under its own Sunday-based week key (the app's weeks run Sun→Sat); one key for both broke on Mondays, when yesterday and the day before straddle the week
  const wkOf=s=>"week"+(12+Math.floor((dayNum(s)-new Date(s+"T12:00:00Z").getUTCDay()-dayNum(Y2))/7));
  const jl={}; [[Y1,"p"],[Y2,"q"]].forEach(([d,k])=>{ const w=wkOf(d); jl[w]=jl[w]||{}; jl[w][dayKey(d)]=jl[w][dayKey(d)]||{}; jl[w][dayKey(d)][k]={label:"Brush Teeth",slot:"morning",act:"on",ts:"",at:atOf(d),pts:0}; });
  const log={julian:jl,lucy:{week9:{tuesday:{a:{label:"Take sheets off beds",slot:"chores",act:"on",ts:"",at:atOf(TUE_ISO),pts:15},
                                     b:{label:lucyRoomOn(TUE_ISO),slot:"afternoon",act:"on",ts:"",at:atOf(TUE_ISO),pts:20}},
                           monday:{miss_chores_0:{label:"Take sheets off beds — not done",slot:"chores",act:"miss",ts:"",at:atOf(MON_ISO),pts:15,missed:true}},
                           wednesday:{c:{label:g[(2+dayNum(WED_ISO)+1)%3],slot:"afternoon",act:"on",ts:"",at:atOf(WED_ISO),pts:20},
                                      d:{label:"🧹 Spray and wipe down baseboards",slot:"grab",act:"on",ts:"",at:atOf(WED_ISO),pts:40}}}}};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:o.nodb?null:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))])})},
    _dryRun:o.dry?()=>true:undefined, momHere:()=>!o.noMom,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{julian:[{emoji:"🚿",label:"Shower",pts:50,cad:"wk:0,3,5"}]},chores:{},evening:{}},
    _mrLegacySteps:k=>k==="julian"?[{label:"Brush Teeth",emoji:"🦷",pts:0,cad:"daily"}]:[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, rtDoneOn:(s,k,d,i)=>(s==="afternoon"&&k==="lucy"&&i===0), mStepDoneOn:(k,d,i)=>(k==="julian"&&i===0),
    mcAll:()=>({mc_sheets:{label:"🛏 Wash the sheets",cad:"wk:0"},mc_kclose:{label:"🌙 Kitchen close-down",cad:"daily"}}), dcAll:()=>({}),
    mcDoneOn:(i,id)=>false, gbList:()=>o.grabs||[{emoji:"🧹",label:"Spray and wipe down baseboards",pts:40,cad:"daily"}],
    routineLog:log, momdayData:{[WED_ISO]:{chores:{mc_sheets:1}}}, daddayData:{}, activeWk:()=>"week9",
    _todayDay:"monday", _todayStr:()=>iso(new Date()), cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s),
    mwBanner:s=>"<banner>"+s+"</banner>", mpSubnav:v=>"<nav:"+v+">", mwToast:()=>{}, document:{getElementById:()=>({})}, renderMomsPlan:()=>renders.push(1),
    writes, renders, ls};
  vm.createContext(ctx);
  vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+BLOCK, ctx);
  return ctx;
}
console.log("Review folds by time of day inside a person");
ok("block present once", src.indexOf("// HH_REVIEW_SLOTFOLD")>0&&src.indexOf("// HH_REVIEW_SLOTFOLD",src.indexOf("// HH_REVIEW_SLOTFOLD")+5)<0);
{ const c=mk(); const el={}; c.hhImport(); c.renderHousehold(el);
  ok("everyone folded: no rows yet", /Lucy<\/span><span[^>]*>4 chores/.test(el.innerHTML)&&!/Take sheets off beds/.test(el.innerHTML));
  c.hhToggleWho("lucy"); c.renderHousehold(el);
  const h=el.innerHTML;
  ok("Lucy open → time-of-day folds with count · minutes, rows still folded", /hhPersonToggle\('review','lucy','lucy\|afternoon'\)/.test(h)&&/Afternoon<\/span><span[^>]*>3 · \d+ min/.test(h)&&/hhPersonToggle\('review','lucy','lucy\|chores'\)/.test(h)&&/Chores<\/span><span[^>]*>1 · \d+ min/.test(h)&&!/Take sheets off beds/.test(h)&&!/Let Chloe out/.test(h), h.slice(0,400));
  ok("folds come in day order (Afternoon before Chores), no Morning fold when there's nothing in it", h.indexOf("lucy|afternoon")<h.indexOf("lucy|chores")&&!/lucy\|morning/.test(h));
  c.hhPersonToggle("review","lucy","lucy|chores"); c.renderHousehold(el);
  ok("tap Chores → its rows with numbers, verdict buttons and note box; Afternoon stays folded", /Take sheets off beds/.test(el.innerHTML)&&/4 wk 1\/4/.test(el.innerHTML)&&/hhSet\('rt_chores_lucy_take_sheets_off_beds','verdict','retire'\)/.test(el.innerHTML)&&/hhNote\(/.test(el.innerHTML)&&!/Let Chloe out/.test(el.innerHTML));
  c.hhPersonToggle("review","lucy","lucy|chores"); c.renderHousehold(el);
  ok("tap again → folded", !/Take sheets off beds/.test(el.innerHTML));
  c.hhToggleWho("mom"); c.renderHousehold(el);
  ok("Mom's open group folds by her strip (Any time / Morning / Afternoon / Night), not the kids' slots", /hhPersonToggle\('review','mom','mom\|/.test(el.innerHTML)&&!/hhPersonToggle\('review','mom','mom\|chores'\)/.test(el.innerHTML)&&!/Wash the sheets/.test(el.innerHTML));
  ok("Up for Grabs has no time of day: rows show straight away when opened", (function(){ c.hhToggleWho("grab"); c.renderHousehold(el); return !/hhPersonToggle\('review','grab'/.test(el.innerHTML); })());
  ok("other views unchanged (Area/Room folds keep their own keys)", /hhPersonOpen\("area",a,w\)/.test(src)&&/hhSlotHeadHTML\("room",rid/.test(src));
}
{ const c=mk(); const el={}; c.hhImport(); c.hhToggleWho("lucy"); vm.runInContext("hhSortNeed=true",c); c.renderHousehold(el);
  ok("sort by most behind → flat list, every row shown, no folds", /Take sheets off beds/.test(el.innerHTML)&&/Let Chloe out/.test(el.innerHTML)&&!/hhPersonToggle\('review'/.test(el.innerHTML)); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
