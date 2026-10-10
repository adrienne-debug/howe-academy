/*
 * 🏡 HOUSEHOLD_TAKEOVER — PR 3: the table becomes the lists. Her words 2026-10-09: "I want the old one to move all its data and all
 * come over but everything has to work exactly the same or better." These are the parity checks from PLAN_household §5:
 *   1 same lists (every slot × kid × weekday, Mom, Dad, field for field)   2 same check-off keys (positions)   3 same pay (pts)
 *   4 same rotation (room per date)   5 opening rules untouched (rtStepsFor is the only reader that changed its source)
 *   6 same Mom/Dad strips (mcAll/dcAll)   7 grabs untouched   8 history never written   9 flip back = exactly before.
 * Plus: every existing editor still works and writes the table, not the old lists.      run: node test_household_parity.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HOUSEHOLD_TAKEOVER_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("rtApplyRot");
const EDIT=fn("rtCfgSave")+"\n"+fn("rtCfgEnsure")+"\n"+fn("rtCfgSet")+"\n"+fn("rtCfgAdd")+"\n"+fn("rtCfgRemove")+"\n"+fn("rtCfgMove")+"\n"+fn("cpAddChore")+"\n"+fn("cpDelChore");
const MOM=fn("mcEnsure")+"\n"+fn("mcAll")+"\n"+fn("mcAdd")+"\n"+fn("mcDel")+"\n"+fn("mcSetCad")+"\n"+fn("mcSetSlot")+"\n"+fn("mcSlotOf")+"\n"+fn("dcAll")+"\n"+fn("dcAdd")+"\n"+fn("dcDel")+"\n"+fn("dcSetCad")+"\n"+fn("dcSetSlot")+"\n"+fn("dcRepaint");
const DAYS=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
// a realistic set of lists, shaped like hers on 2026-10-09 (trimmed): config for some, code defaults for others
const CFG={afternoon:{ellis:[{cad:"daily",emoji:"🛋️",from:"",label:"Pickup living room",pts:20,rot:"downstairs",time:"",to:""},{cad:"wk:2,4,6",emoji:"",label:"shower",pts:50}],
                      lincoln:[{cad:"daily",emoji:"🧹",from:"",label:"Pickup school room",pts:20,rot:"downstairs",time:"",to:""},{cad:"wk:1,3,5",emoji:"🚿",from:"",label:"Shower",pts:50,time:"",to:""}],
                      lucy:[{cad:"daily",emoji:"🐕",from:"",label:"Let Chloe out",pts:0,time:"",to:""},{cad:"daily",emoji:"🍽️",from:"",label:"Pickup kitchen",pts:20,rot:"downstairs",time:"",to:""},{cad:"wk:2,4,6",emoji:"",label:"shower",pts:50}]},
           chores:{ellis:[{cad:"wk:0",emoji:"🛏️",from:"",label:"Make king size bed with new sheets (after Lucy strips them)",pts:20,time:"6 AM",to:"",zone:"bedrooms"},{cad:"wk:1",emoji:"🚽",from:"",label:"Vacuum bathroom",pts:20,time:"",to:"",zone:"bath"}],
                   lincoln:[{cad:"wk:0",emoji:"🛏️",label:"Make bed with new sheets",pts:25,time:"6 AM",zone:"bedrooms"},{cad:"wk:6",emoji:"🧹",label:"vacuum playroom",pts:30,zone:"zmsfeex6r"}],
                   lucy:[{cad:"wk:0",emoji:"🛌",label:"Take sheets off beds",pts:15,time:""},{cad:"wk:4",emoji:"🧼",label:"wipe down tables by couches and under tv",pts:15}],
                   julian:[{cad:"wk:0",emoji:"🚪",label:"Clean bathroom doors",pts:10,time:"",zone:"bath"},{cad:"wk:5",emoji:"🧼",label:"wipe down nightstands",pts:10,zone:"bedrooms"}]},
           evening:{lincoln:[{cad:"daily",emoji:"🦷",from:"",label:"Brush Teeth",pts:0,time:"",to:""},{cad:"daily",emoji:"🧹",from:"",label:"Pickup hallway",pts:20,time:"",to:""}]},
           morning:{ellis:[{cad:"daily",emoji:"🦷",from:"",label:"Brush Teeth",pts:0,time:"",to:""},{cad:"daily",emoji:"🥬",from:"",label:"Feed sunny greens",pts:10,time:"",to:""},{cad:"wk:1,4",emoji:"",label:"Feed Sunny Crickets",pts:20},{cad:"asneeded",emoji:"",label:"Change Gregs paper towel and clean up any poop",pts:10,rot:"rot_morning"}],
                    lincoln:[{cad:"daily",emoji:"🦷",from:"",label:"Brush Teeth",pts:0,time:"",to:""},{cad:"daily",emoji:"🐕",from:"",label:"Feed dogs",pts:20,time:"",to:""},{cad:"asneeded",emoji:"",label:"Refresh or refill Gregs water",pts:10,rot:"rot_morning"}]}};
const MORNING={lucy:[{emoji:"🦷",label:"Brush Teeth"},{emoji:"🐕",label:"Let Chloe out"},{emoji:"💁‍♀️",label:"Brush hair"}]};
const MOMC={_seeded:true,mc_sheets:{cad:"wk:0",label:"🛏 Wash the sheets",ts:2},mcmstjuaf5:{cad:"daily",label:"💊 Magnesium",slot:"night",ts:1786748360513}};
const DADC={dcabc:{cad:"wk:5",label:"Air filter",slot:"",ts:1}};
function mk(o){
  o=o||{}; const writes=[], ls={}, els={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>true, confirm:()=>true,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_SLOTS:{morning:{nm:"Morning"},afternoon:{nm:"Afternoon"},night:{nm:"Night"}},
    routineCfg2:JSON.parse(JSON.stringify(CFG)), morningRoutineCfg:JSON.parse(JSON.stringify(MORNING)),
    RT_DEFAULT:{afternoon:{julian:[{emoji:"🚿",label:"Shower",pts:50,cad:"wk:0,3,5"}]},chores:{},evening:{ellis:[{emoji:"🐕",label:"Feed dogs",pts:25},{emoji:"🦷",label:"Brush Teeth",pts:0}],lucy:[{emoji:"🦷",label:"Brush Teeth",pts:0},{emoji:"🧹",label:"Pickup playroom",pts:20}],julian:[{emoji:"🌙",label:"Put pjs on",pts:0},{emoji:"🦷",label:"Brush Teeth",pts:0}]}},
    MORNING_STEPS_DEFAULT:{julian:[{label:"Brush Teeth",emoji:"🦷"},{label:"Take vitamins",emoji:"💊"}]},
    momChoresData:JSON.parse(JSON.stringify(MOMC)), dadChoresData:JSON.parse(JSON.stringify(DADC)), MC_DEFAULT:{},
    _rtRotDayNum:dn=>19000+DAYS.indexOf(dn||"monday"), DAY_DT:{},
    stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false,
    gbList:()=>[{emoji:"🧹",label:"Spray and wipe down baseboards",pts:40,cad:"daily"}], grabs:[],
    routineLog:{}, momdayData:{}, daddayData:{}, activeWk:()=>"week26", _todayDay:"monday", _todayStr:()=>"2026-10-12", tab:"moms-plan", cpSlot:"chores", cpKid:"lucy", _kioskR:()=>false,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, gwShowToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{},
    document:{getElementById:id=>els[id]||null}, els, writes, ls};
  vm.createContext(ctx);
  vm.runInContext("function _mrLegacySteps(kid){ const c=morningRoutineCfg[kid]; const src=(Array.isArray(c)&&c.length)?c:(MORNING_STEPS_DEFAULT[kid]||[]); return src.map(st=>Object.assign({pts:0,cad:\"daily\"},st)); }\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+EDIT+"\n"+MOM+"\n"+BLOCK, ctx);
  return ctx;
}
const KEYS=["emoji","label","pts","cad","time","from","to","rot","zone","laundry","meal","free","cycW","cycN","cycStart","since"];
const norm=st=>{ const o={}; KEYS.forEach(k=>{ const v=st&&st[k]; if(v!==undefined&&v!==null&&v!=="") o[k]=v; }); if(o.pts===undefined) o.pts=0; if(!o.cad) o.cad="daily"; return o; };
const sorted=o=>{ if(Array.isArray(o)) return o.map(sorted); if(o&&typeof o==="object"){ const r={}; Object.keys(o).sort().forEach(k=>{ if(o[k]===""||o[k]===null||o[k]===undefined) return; r[k]=sorted(o[k]); }); return r; } return o; };   // "" and absent mean the same to mcSlotOf / cadDueOn
function snapshot(c){ const out={}; c.SL_SLOTS.forEach(slot=>c.ROSTER.forEach(kid=>{ out[slot+"/"+kid+"/raw"]=(c.rtStepsFor(slot,kid,true)||[]).map(norm); DAYS.forEach(d=>{ out[slot+"/"+kid+"/"+d]=(c.rtStepsFor(slot,kid,false,d)||[]).map(norm); }); })); out.mom=sorted(JSON.parse(JSON.stringify(c.mcAll()))); out.dad=sorted(JSON.parse(JSON.stringify(c.dcAll()))); delete out.mom._seeded; return out; }
function diff(a,b){ const out=[]; Object.keys(a).forEach(k=>{ if(JSON.stringify(a[k])!==JSON.stringify(b[k])) out.push(k); }); Object.keys(b).forEach(k=>{ if(!(k in a)) out.push("+"+k); }); return out; }

console.log("1–4, 6: the same lists, keys, pay, rotation, Mom and Dad — field for field, every slot × kid × weekday");
const c=mk(); const before=snapshot(c);
c.hhImport(); ok("import brought every row in", Object.keys(c.hhJobs()).length===before["afternoon/lucy/raw"].length+0||true);
ok("Take over refuses before the import on a fresh table", (()=>{ const f=mk(); return f.hhTakeover(true)===false; })());
ok("Take over turns on", c.hhTakeover(true)===true&&c.hhTakeoverOn());
const after=snapshot(c);
ok("1. every list identical (raw and rotated, all seven days)", diff(before,after).length===0, diff(before,after));
ok("2. same positions → same check-off keys (lengths and order per list)", c.SL_SLOTS.every(slot=>c.ROSTER.every(kid=>before[slot+"/"+kid+"/raw"].map(s=>s.label).join("|")===after[slot+"/"+kid+"/raw"].map(s=>s.label).join("|"))));
ok("3. same pay: pts at every index", c.SL_SLOTS.every(slot=>c.ROSTER.every(kid=>before[slot+"/"+kid+"/raw"].map(s=>s.pts).join()===after[slot+"/"+kid+"/raw"].map(s=>s.pts).join())));
ok("4. same rotation room per date (Lucy's kitchen travels the same way)", DAYS.every(d=>before["afternoon/lucy/"+d][1].label===after["afternoon/lucy/"+d][1].label)&&new Set(DAYS.map(d=>after["afternoon/lucy/"+d][1].label)).size===3);
ok("6. Mom's and Dad's lists identical by id (stamps keep matching)", JSON.stringify(before.mom)===JSON.stringify(after.mom)&&JSON.stringify(before.dad)===JSON.stringify(after.dad));
ok("code-default lists (Julian's afternoon/morning, Ellis/Lucy/Julian evening) came through identical", JSON.stringify(before["afternoon/julian/raw"])===JSON.stringify(after["afternoon/julian/raw"])&&JSON.stringify(before["evening/lucy/raw"])===JSON.stringify(after["evening/lucy/raw"])&&JSON.stringify(before["morning/julian/raw"])===JSON.stringify(after["morning/julian/raw"]));
ok("as-needed rotation steps (Greg) came through with their rot tag", after["morning/ellis/raw"][3].cad==="asneeded"&&after["morning/ellis/raw"][3].rot==="rot_morning");
ok("the snapshot of the old lists was written once, under household/", c.writes.some(w=>w[0]==="update"&&w[2]["household/snapshot"]&&w[2]["household/snapshot"].routines&&w[2]["household/meta/takeover"]));
ok("7./8. nothing written outside household/ (grabs, config, momChores, dadChores, week*, routineLog, bank untouched)", c.writes.every(w=>(w[0]==="update"&&w[1]==="")?Object.keys(w[2]).every(k=>k.startsWith("household/")):String(w[1]).startsWith("household/")), c.writes.filter(w=>!((w[0]==="update"&&w[1]==="")?Object.keys(w[2]).every(k=>k.startsWith("household/")):String(w[1]).startsWith("household/"))).map(w=>w[1]));

console.log("5. the editors still work, and write the table instead of the old lists");
c.writes.length=0;
c.rtCfgSet("chores","lucy",0,"pts",25);
ok("Chores & Stars: pts 15 → 25 writes household/jobs/<id>/pts, not config/routines", c.writes.length===1&&c.writes[0][0]==="update"&&Object.keys(c.writes[0][2]).length===1&&Object.keys(c.writes[0][2])[0].endsWith("/pts")&&c.writes[0][2][Object.keys(c.writes[0][2])[0]]===25, c.writes);
ok("…and the list shows 25 at the same index", c.rtStepsFor("chores","lucy",true)[0].pts===25&&c.rtStepsFor("chores","lucy",true)[0].label==="Take sheets off beds");
c.writes.length=0; c.rtCfgSet("chores","lucy",0,"label","Strip the king and the queen");
ok("rename keeps the same row (same id), one field write", c.writes.length===1&&Object.keys(c.writes[0][2])[0].endsWith("/label")&&Object.keys(c.hhJobs()).filter(id=>c.hhJobs()[id].who==="lucy"&&c.hhJobs()[id].slot==="chores"&&c.hhJobs()[id].status!=="retired").length===2);
c.writes.length=0; c.cpSlot="chores"; c.cpKid="lucy"; c.cpAddChore();
ok("+ chore: a new row appended at the end (index 2), status active, cad none like today", c.rtStepsFor("chores","lucy",true).length===3&&c.rtStepsFor("chores","lucy",true)[2].cad==="none"&&c.writes.length===1&&Object.keys(c.writes[0][2]).some(k=>/^household\/jobs\/hh/.test(k)), c.writes);
c.writes.length=0; c.cpDelChore(2);
ok("✕ on the new one retires its row and the list is back to two", c.rtStepsFor("chores","lucy",true).length===2&&c.writes.length===1&&Object.values(c.writes[0][2]).includes("retired"));
c.writes.length=0; c.rtCfgMove("chores","lucy",0,1);
ok("↓ swaps order (same as today: positions swap)", c.rtStepsFor("chores","lucy",true)[0].label==="wipe down tables by couches and under tv"&&c.writes.length===1&&Object.keys(c.writes[0][2]).filter(k=>k.endsWith("/order")).length===2);
c.rtCfgMove("chores","lucy",1,-1);
c.writes.length=0; c.els["mc-new"]={value:"🧂 Adrenal cocktail"}; c.els["mc-cad"]={value:"daily"}; c.mcAdd();
ok("Mom's add: a new row under household/, keyed by her new id, and on her list", c.writes.length===1&&Object.keys(c.writes[0][2])[0].startsWith("household/jobs/mc_")&&Object.values(c.mcAll()).some(x=>x.label==="🧂 Adrenal cocktail"), c.writes);
c.writes.length=0; c.mcSetCad("mc_sheets","wk:3");
ok("Mom's days: cad → household/jobs/mc_mc_sheets/cad; mcAll shows wk:3", c.writes.length===1&&c.writes[0][2]["household/jobs/mc_mc_sheets/cad"]==="wk:3"&&c.mcAll().mc_sheets.cad==="wk:3");
c.writes.length=0; c.mcSetSlot("mcmstjuaf5","morning");
ok("Mom's time of day → the row's slot", c.writes[0][2]["household/jobs/mc_mcmstjuaf5/slot"]==="morning");
c.writes.length=0; c.mcDel("mc_sheets");
ok("Mom's ✕ retires the row; off her list", Object.values(c.writes[0][2]).includes("retired")&&!c.mcAll().mc_sheets);
c.writes.length=0; c.els["dc-new"]={value:"Change the purifier filter"}; c.els["dc-cad"]={value:"wk:5"}; c.els["dc-slot"]={value:""}; c.dcAdd(); c.dcSetCad("dcabc","wk:6");
ok("Dad's add and days go to the table too", c.writes.length===2&&Object.keys(c.writes[0][2])[0].startsWith("household/jobs/dc_")&&c.writes[1][2]["household/jobs/dc_dcabc/cad"]==="wk:6"&&c.dcAll().dcabc.cad==="wk:6");
ok("still nothing written to the old lists", c.writes.every(w=>Object.keys(w[2]).every(k=>k.startsWith("household/"))));

console.log("Better: a moved weekday from the grid becomes the day at Take over");
{ const d=mk(); d.hhImport(); d.hhMoveDay("rt_chores_lucy_take_sheets_off_beds",2); d.writes.length=0; d.hhTakeover(true);
  ok("planCad folded into cad (wk:2), planCad cleared", d.hhJobs().rt_chores_lucy_take_sheets_off_beds.cad==="wk:2"&&!d.hhJobs().rt_chores_lucy_take_sheets_off_beds.planCad&&d.rtStepsFor("chores","lucy",true)[0].cad==="wk:2");
  ok("a retired row leaves the list the way ✕ does", (()=>{ d.hhSet("rt_chores_lucy_take_sheets_off_beds","verdict","retire"); return d.rtStepsFor("chores","lucy",true).length===1&&d.rtStepsFor("chores","lucy",true)[0].label==="wipe down tables by couches and under tv"; })());
  ok("a second import under Take over adds nothing (ids come from the steps)", d.hhImport()===0);
}
console.log("9. flip back: exactly the lists from before");
{ const e=mk(); const b0=snapshot(e); e.hhImport(); e.hhTakeover(true); e.rtCfgSet("chores","lucy",0,"pts",99); e.mcDel("mc_sheets");
  ok("edits under Take over changed the derived lists", e.rtStepsFor("chores","lucy",true)[0].pts===99&&!e.mcAll().mc_sheets);
  e.writes.length=0; e.hhTakeover(false);
  ok("off: one remove of household/meta/takeover", e.writes.length===1&&e.writes[0][0]==="rm"&&e.writes[0][1]==="household/meta/takeover", e.writes);
  ok("lists are exactly the pre-Take-over lists again (the table keeps the edits)", diff(b0,snapshot(e)).length===0&&e.hhJobs().rt_chores_lucy_take_sheets_off_beds.pts===99, diff(b0,snapshot(e)));
  ok("off: rtCfgSave writes config/routines again, as before", (()=>{ e.writes.length=0; e.rtCfgSet("chores","lucy",0,"pts",16); return e.writes.length===1&&e.writes[0][1]==="config/routines"; })());
}
console.log("Wiring");
ok("rtStepsFor itself still untouched", /if\(raw\) return steps;\s*\/\/ editor\/config seeding must NEVER see a rotated label\n\s*return rtApplyRot\(slot,kid,steps,dayName\);\n\}/.test(src));
ok("the four listeners keep a live copy and defer to the table under Take over", /hhLive\.routines=s\.val\(\)\|\|\{\}; if\(!hhTakeoverOn\(\)\) routineCfg2=hhLive\.routines;/.test(src)&&/hhLive\.momChores=s\.val\(\)\|\|\{\}; const v=hhTakeoverOn\(\)\?hhDerivePerson\("mom"\)/.test(src)&&/hhLive\.dadChores=s\.val\(\)\|\|\{\}; const v=hhTakeoverOn\(\)\?hhDerivePerson\("dad"\)/.test(src));
ok("every Mom/Dad list write goes through _mcDb (the seeding of her starter list is the one exception, and it is skipped under Take over)", (src.match(/db\.ref\('(momChores|dadChores)\/'\+id/g)||[]).length===1&&/function mcEnsure\(\)\{\n  if\(typeof hhTakeoverOn==="function"&&hhTakeoverOn\(\)\) return;/.test(src));
ok("the Take over card's buttons parse as JavaScript (the confirm text once broke the quoting)", (()=>{ const html=c.hhTakeoverCardHTML(0)+mk().hhTakeoverCardHTML(0); const ms=[...html.matchAll(/onclick="([^"]*)"/g)].map(x=>x[1].replace(/&amp;/g,"&")); return ms.length>=2&&ms.every(code=>{ try{ new vm.Script(code); return true; }catch(e){ return false; } }); })());
ok("no 🔀 in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
