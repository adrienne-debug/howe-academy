/*
 * 🔁 HH_ROTATE — rotations from the Household tab (her "go" 2026-10-11). Start = tag + a "Free day" placeholder row per other
 * kid + the cycle; Join = another kid's own row takes the tag, their placeholder retires; Leave; Add; cycle buttons; Give to…
 * on a member row hands over the turn. The rotation itself (rtApplyRot) is the old one and is exercised on the derived lists.
 *                                                                                      run: node test_household_rotation.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HH_ROTATE_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("_rtRotDayNum")+"\n"+fn("rtApplyRot");   // the real rotation
function mk(o){
  o=o||{}; const writes=[], ls={}, dom={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{},
    routineCfg2:{chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"daily"},{label:"Wipe table",pts:10,cad:"daily"}],lucy:[{emoji:"🧽",label:"Dust dining area",pts:15,cad:"daily"}],ellis:[{label:"Feed Sunny",pts:5,cad:"daily"}]},afternoon:{}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false,
    MC_DEFAULT:{}, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"🌙 Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{}, activeWk:()=>"week26", _todayDay:"saturday", _todayStr:()=>"2026-10-11",
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:id=>dom[id]||null}, dom, writes};
  vm.createContext(ctx); vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+fn("_mcDb")+"\n"+BLOCK, ctx);
  ctx.get=expr=>vm.runInContext(expr,ctx);
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
const VAC="rt_chores_lincoln_vacuum_kitchen", DUST="rt_chores_lucy_dust_dining_area", SUNNY="rt_chores_ellis_feed_sunny";
const members=(c,slot,tag)=>{ const G=c.hhRotGroups()[slot+"|"+tag]; return G?G.members.map(m=>m.kid+(m.free?"*":"")).join(","):""; };
const holders=(c,label)=>c.get("SL_KIDS").filter(k=>(c.rtStepsFor("chores",k,false)||[]).some(s=>s.label===label&&s.cad!=="none"));
console.log("Start a rotation");
{ const c=mk(); c.hhRotOpen(VAC); ok("the panel opens with Lincoln in (he has it now), cycle daily", c.get("hhRot.id")===VAC&&c.get("hhRot.kids.lincoln")===true&&c.get("hhRot.period")==="daily");
  c.hhRotKid("lincoln"); ok("the holder cannot be un-picked", c.get("hhRot.kids.lincoln")===true);
  c.hhRotKid("ellis"); c.hhRotKid("lucy"); c.hhRotPeriod("weekly"); const upd=c.hhRotSave();
  const tag=c.hhJobs()[VAC].rot; ok("the row got a tag made from its slot and words", /^rot_chores_vacuum_kitchen/.test(tag), tag);
  const keys=Object.keys(upd); const frees=keys.filter(k=>/^household\/jobs\/hh[a-z0-9]+$/.test(k)).map(k=>upd[k]);
  ok("one multi-path update: the tag, two placeholder rows, the cycle", c.writes.length===1&&upd["household/jobs/"+VAC+"/rot"]===tag&&frees.length===2&&upd["config/rotationPeriod/"+tag]==="weekly", keys);
  ok("placeholders: Free day, free:true, same slot / area / level, for Ellis and Lucy, appended", frees.every(f=>f.label==="Free day"&&f.free===true&&f.rot===tag&&f.slot==="chores"&&f.area===c.hhJobs()[VAC].area&&f.level===1&&f.cad==="daily")&&frees.map(f=>f.who).sort().join()==="ellis,lucy"&&frees.find(f=>f.who==="lucy").order===1, frees);
  ok("the group reads Lincoln → Ellis* → Lucy*; the cycle reads weekly", members(c,"chores",tag)==="lincoln,ellis*,lucy*"&&c.rtRotPeriod(tag)==="weekly");
  ok("on the derived lists the real rotation runs: exactly one kid holds the vacuum today, the other two have a free turn", holders(c,"Vacuum kitchen").length===1&&holders(c,"Free day").length===0, holders(c,"Vacuum kitchen"));
  ok("their other chores are untouched", c.rtStepsFor("chores","lincoln",true).some(s=>s.label==="Wipe table")&&c.rtStepsFor("chores","ellis",true).some(s=>s.label==="Feed Sunny"));
  c.writes.length=0; c.hhRotOpen(VAC); ok("reopening a rotating row pre-picks its members and cycle", c.get("hhRot.kids.ellis")===true&&c.get("hhRot.kids.lucy")===true&&c.get("hhRot.period")==="weekly");
  c.hhRotKid("lucy"); c.hhRotKid("julian"); const upd2=c.hhRotSave();
  ok("re-shape: Lucy's placeholder retires, Julian gets one, the tag stays", members(c,"chores",tag)==="lincoln,ellis*,julian*"&&Object.keys(upd2).some(k=>/status$/.test(k)&&upd2[k]==="retired")&&upd2["household/jobs/"+VAC+"/rot"]===undefined, upd2);
  c.writes.length=0; c.hhRotOpen(DUST); c.hhRotSave(); ok("only one kid picked → nothing written", c.writes.length===0&&!c.hhJobs()[DUST].rot);
  const d=mk({noMom:true}); d.hhRotOpen(VAC); ok("not Mom → nothing", d.hhRotSave()===null&&d.writes.length===0);
}
console.log("Join, Leave, Add, Cycle");
{ const c=mk(); c.hhRotOpen(VAC); c.hhRotKid("lucy"); c.hhRotKid("ellis"); c.hhRotSave(); const tag=c.hhJobs()[VAC].rot; c.writes.length=0;
  const lucyFree=c.hhRotGroups()["chores|"+tag].members.find(m=>m.kid==="lucy").id;
  const upd=c.hhRotJoin(DUST,tag);
  ok("Lucy's own dust row joins: it takes the tag and her placeholder retires", c.hhJobs()[DUST].rot===tag&&c.hhJobs()[lucyFree].status==="retired"&&members(c,"chores",tag)==="lincoln,ellis*,lucy"&&c.writes.length===1, upd);
  ok("now two jobs travel among three kids: vacuum and dust each held by one kid today, never the same kid", holders(c,"Vacuum kitchen").length===1&&holders(c,"Dust dining area").length===1&&holders(c,"Vacuum kitchen")[0]!==holders(c,"Dust dining area")[0]);
  c.writes.length=0; ok("joining twice → nothing", c.hhRotJoin(DUST,tag)===null&&c.writes.length===0);
  c.writes.length=0; const r=c.hhRotJoin(SUNNY,tag); ok("Ellis's Feed Sunny joins over his placeholder", r!==null&&members(c,"chores",tag)==="lincoln,ellis,lucy");
  c.writes.length=0; c.hhRotLeave(SUNNY); ok("Leave on a real job: the tag drops, the chore stays Ellis's own, still active", !c.hhJobs()[SUNNY].rot&&c.hhJobs()[SUNNY].status==="active"&&members(c,"chores",tag)==="lincoln,lucy"&&c.writes[0][2]["household/jobs/"+SUNNY+"/rot"]===null);
  c.hhRotAddKid("chores",tag,"julian"); ok("Add Julian: a placeholder turn for him", members(c,"chores",tag)==="lincoln,lucy,julian*");
  ok("Add someone already in → nothing", c.hhRotAddKid("chores",tag,"lucy")===null);
  const julFree=c.hhRotGroups()["chores|"+tag].members.find(m=>m.kid==="julian").id; c.hhRotLeave(julFree); ok("Leave on a placeholder retires it", c.hhJobs()[julFree].status==="retired"&&members(c,"chores",tag)==="lincoln,lucy");
  c.writes.length=0; c.hhRotCycle(tag,"2d"); ok("cycle: one write to config/rotationPeriod, read back", c.writes.length===1&&c.writes[0][2]["config/rotationPeriod/"+tag]==="2d"&&c.rtRotPeriod(tag)==="2d");
  ok("a bad cycle is ignored", c.hhRotCycle(tag,"hourly")===null&&c.rtRotPeriod(tag)==="2d");
}
console.log("Give to… on a member row");
{ const c=mk(); c.hhRotOpen(VAC); c.hhRotKid("ellis"); c.hhRotSave(); const tag=c.hhJobs()[VAC].rot; const ellisFree=c.hhRotGroups()["chores|"+tag].members.find(m=>m.kid==="ellis").id;
  c.writes.length=0; const upd=c.hhGiveTo(VAC,"ellis");
  ok("to a kid holding a placeholder: the row moves and the placeholder retires, in one update", c.hhJobs()[VAC].who==="ellis"&&c.hhJobs()[VAC].rot===tag&&c.hhJobs()[ellisFree].status==="retired"&&c.writes.length===1&&upd["household/jobs/"+ellisFree+"/status"]==="retired", upd);
  ok("the group is now Ellis alone (needs one more kid)", members(c,"chores",tag)==="ellis");
  c.hhRotAddKid("chores",tag,"lucy"); c.hhRotJoin(DUST,tag); c.writes.length=0;
  ok("to a kid with a real job in the group → refused, nothing written", c.hhGiveTo(VAC,"lucy")===null&&c.writes.length===0);
  c.hhGiveTo(VAC,"julian"); ok("to a kid outside the group: he joins in Ellis's place", members(c,"chores",tag)==="lucy,julian");
  c.hhGiveTo(VAC,"mom"); ok("to Mom: the tag comes off (Mom's rows do not rotate)", c.hhJobs()[VAC].who==="mom"&&!c.hhJobs()[VAC].rot&&members(c,"chores",tag)==="lucy");
}
console.log("On screen");
{ const c=mk(); const el={}; c.hhGo("rot"); c.renderHousehold(el);
  ok("a 🔁 Rotations chip and an empty view", /hhGo\('rot'\)/.test(el.innerHTML)&&/No rotations yet/.test(el.innerHTML));
  c.hhGiveToggle(VAC); const g=c.hhGiveHTML(VAC); ok("Give to… on a kid's row offers 🔁 Rotate", /hhRotOpen\('rt_chores_lincoln_vacuum_kitchen'\)/.test(g));
  c.hhGiveToggle("mc_mc_a"); ok("…but not on Mom's", !/hhRotOpen/.test(c.hhGiveHTML("mc_mc_a")));
  c.hhRotOpen(VAC); const p=c.hhRotPanelHTML(VAC); ok("the panel: kid chips (Lincoln marked 'has it now'), cycle choices, Save", /Lincoln \(has it now\)/.test(p)&&/hhRotKid\('lucy'\)/.test(p)&&/hhRotPeriod\('weekly'\)/.test(p)&&/hhRotSave\(\)/.test(p));
  ok("opening the panel closed the Give to… picker", c.get("hhGive")==="");
  c.hhRotKid("ellis"); c.hhRotSave(); const tag=c.hhJobs()[VAC].rot; c.hhRotOpen(DUST); const p2=c.hhRotPanelHTML(DUST); ok("another row in the slot is offered 'join' that rotation", new RegExp("hhRotJoin\\('"+DUST+"','"+tag+"'\\)").test(p2)&&/🧹 Vacuum kitchen/.test(p2));
  c.hhGo("rot"); c.renderHousehold(el); ok("the view lists the group: both kids, today's holder, cycle buttons, Leave, Add", /Lincoln/.test(el.innerHTML)&&/Ellis/.test(el.innerHTML)&&/hhRotLeave\(/.test(el.innerHTML)&&new RegExp("hhRotCycle\\('"+tag+"','weekly'\\)").test(el.innerHTML)&&new RegExp("hhRotAddKid\\('chores','"+tag+"','lucy'\\)").test(el.innerHTML)&&/placeholder turn/.test(el.innerHTML));
  const d=mk({noMom:true}); ok("a kid's device: no Rotate, nothing writes", d.hhGiveBtn(VAC)===""&&d.hhRotLeave(VAC)===null&&d.hhRotAddKid("chores","x","lucy")===null&&d.writes.length===0);
}
ok("rtApplyRot itself untouched by this PR", /function rtApplyRot\(slot,kid,steps,dayName\)\{\n  if\(!steps\.some\(s=>s&&s\.rot\)\) return steps;/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
