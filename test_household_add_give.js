/*
 * 🏡 HH_ADDGIVE — "+ Add a chore" and "Give to…" on the Household tab (her "go" 2026-10-11). Add = one row, one targeted set,
 * on the list right away under Take over, a weekday row starts today. Give to = the same row with a new owner (one multi-path
 * update on that row only), at the end of the new person's list; Mom's ✎ edits still find a row given to her.
 *                                                                                      run: node test_household_add_give.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HH_ADDGIVE_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date());
function mk(o){
  o=o||{}; const writes=[], ls={}, dom={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true,
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{},
    routineCfg2:{chores:{lincoln:[{label:"Vacuum kitchen",pts:30,cad:"wk:2"},{label:"Wipe table",pts:10,cad:"daily"}],lucy:[{label:"Dust dining area",pts:15,cad:"wk:2"}]},afternoon:{}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false,
    MC_DEFAULT:{}, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"🌙 Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{dc_a:{label:"Dishes",cad:"daily",ts:1}}, activeWk:()=>"week26", _todayDay:"saturday", _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:id=>dom[id]||null}, dom, writes};
  vm.createContext(ctx); vm.runInContext(CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+fn("_mcDb")+"\n"+BLOCK, ctx);
  ctx.get=expr=>vm.runInContext(expr,ctx);   // `let` state (hhAdd, hhAddOpen) is not on the global
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
const LINC="rt_chores_lincoln_vacuum_kitchen", LUCY="rt_chores_lucy_dust_dining_area";
console.log("+ Add a chore");
{ const c=mk(); c.hhAddSet("who","lincoln"); c.hhAddSet("slot","chores"); c.hhAddSet("cad","wk:0"); c.hhAddSet("room","living"); c.hhAddSet("level",1);
  c.dom["hh-add-label"]={value:"Fluff the couch pillows"}; c.dom["hh-add-emoji"]={value:"🛋️"}; c.dom["hh-add-pts"]={value:"15"};
  const id=c.hhAddSave(); const j=c.hhJobs()[id];
  ok("one targeted set of household/jobs/<id>", c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="household/jobs/"+id, c.writes);
  ok("the row: words, emoji, stars, who, slot, day, room, floor from the room, level, src new, source Household tab", j&&j.label==="Fluff the couch pillows"&&j.emoji==="🛋️"&&j.pts===15&&j.who==="lincoln"&&j.slot==="chores"&&j.cad==="wk:0"&&j.room==="living"&&j.floor==="down"&&j.level===1&&j.src.kind==="new"&&j.source==="Household tab"&&j.status==="active", j);
  ok("a weekday chore begins today (never born late)", j.from===TODAY, j.from);
  ok("it is appended: order after his two steps, so their check-off indexes keep", j.order===2&&c.rtStepsFor("chores","lincoln",true).map(s=>s.label).join("|")==="Vacuum kitchen|Wipe table|Fluff the couch pillows");
  ok("the form closed and the words cleared", c.get("hhAddOpen")===false&&c.get("hhAdd.label")===""&&c.get("hhAdd.pts")==="");
  c.writes.length=0; c.dom["hh-add-label"]={value:"   "}; ok("no name → nothing written", c.hhAddSave()===null&&c.writes.length===0);
}
{ const c=mk(); c.hhAddSet("who","mom"); ok("picking Mom resets the time-of-day to Any time", c.get("hhAdd.slot")==="");
  c.hhAddSet("slot","night"); c.hhAddSet("cad","daily"); c.dom["hh-add-label"]={value:"Wipe the stove"}; c.dom["hh-add-pts"]={value:"99"};
  const id=c.hhAddSave(); const j=c.hhJobs()[id];
  ok("Mom's row: src momChore keyed by the row id, night slot, no stars, no from", j.src.kind==="momChore"&&j.src.id===id&&j.slot==="night"&&j.pts===0&&j.from===undefined, j);
  ok("it is on her strip right away, with her other chore still there", !!c.mcAll()[id]&&c.mcAll()[id].slot==="night"&&!!c.mcAll().mc_a);
  c.writes.length=0; c._mcDb("mom",id,"cad","wk:1"); ok("her ✎ edit of the day finds that same row (no new row)", c.writes.length===1&&c.writes[0][0]==="update"&&Object.keys(c.writes[0][2]).join()==="household/jobs/"+id+"/cad"&&c.hhJobs()[id].cad==="wk:1", c.writes);
}
{ const c=mk(); c.hhAddSet("who","lucy"); c.hhAddSet("level",2); c.dom["hh-add-label"]={value:"Wipe the baseboards"};
  const id=c.hhAddSave(); ok("a Level 2 row for a Level 1 person is in the table but not on her list yet", !!c.hhJobs()[id]&&c.hhJobs()[id].level===2&&c.rtStepsFor("chores","lucy",true).length===1);
  c.hhLevelSetFor("lucy",2); ok("…and arrives when she moves up", c.rtStepsFor("chores","lucy",true).length===2);
  const d=mk({noMom:true}); d.dom["hh-add-label"]={value:"X"}; ok("not Mom → no row, no write", d.hhAddSave()===null&&d.writes.length===0);
}
console.log("HH_SYNC_BYID: a strip save finds a row that has no src.id");
{ const c=mk(); c.get('householdData.jobs.hh_mom_x={label:"Kitchen close-down",cad:"daily",slot:"night",pts:0,who:"mom",source:"walk-through",area:"cleaning",status:"active",verdict:"",note:"",order:9,ts:1}; householdOnValue(householdData);');
  ok("the payload row is on her strip under its own id", !!c.mcAll().hh_mom_x);
  c.writes.length=0; c._mcDb("mom","hh_mom_x","cad","wk:1");
  ok("her ✎ edit lands on that row — no mc_hh_mom_x duplicate", c.hhJobs().hh_mom_x.cad==="wk:1"&&!c.hhJobs().mc_hh_mom_x&&c.writes.length===1&&Object.keys(c.writes[0][2]).join()==="household/jobs/hh_mom_x/cad", c.writes);
  c.get('householdData.jobs.hh_mom_x.status="retired"; householdOnValue(householdData);'); c.writes.length=0; c._mcDb("mom","hh_mom_y",null,{label:"New one",cad:"daily",ts:2});
  ok("a retired row is never matched; a truly new one still makes a row", !!c.hhJobs().mc_hh_mom_y&&c.hhJobs().hh_mom_x.status==="retired");
}
console.log("Give to…");
{ const c=mk(); const upd=c.hhGiveTo(LINC,"lucy");
  ok("one multi-path update on that row only: who, order (end of Lucy's list), from = today", c.writes.length===1&&c.writes[0][0]==="update"&&Object.keys(upd).every(k=>k.indexOf("household/jobs/"+LINC+"/")===0)&&upd["household/jobs/"+LINC+"/who"]==="lucy"&&upd["household/jobs/"+LINC+"/order"]===1&&upd["household/jobs/"+LINC+"/from"]===TODAY, upd);
  ok("Lucy's list: her step, then the vacuum; Lincoln keeps only the table", c.rtStepsFor("chores","lucy",true).map(s=>s.label).join("|")==="Dust dining area|Vacuum kitchen"&&c.rtStepsFor("chores","lincoln",true).map(s=>s.label).join("|")==="Wipe table");
  ok("stars and days ride along", c.hhJobs()[LINC].pts===30&&c.hhJobs()[LINC].cad==="wk:2");
  c.writes.length=0; ok("to the same person / to the pool / to nobody → nothing", c.hhGiveTo(LINC,"lucy")===null&&c.hhGiveTo(LINC,"grab")===null&&c.hhGiveTo(LINC,"nana")===null&&c.hhGiveTo("nope","mom")===null&&c.writes.length===0);
}
{ const c=mk(); const upd=c.hhGiveTo(LINC,"mom"); const j=c.hhJobs()[LINC];
  ok("kid → Mom: src momChore keyed by the row id, chores slot → Any time", j.who==="mom"&&j.src.kind==="momChore"&&j.src.id===LINC&&j.slot==="", j);
  ok("it is on Mom's strip, off Lincoln's list", !!c.mcAll()[LINC]&&c.mcAll()[LINC].label==="Vacuum kitchen"&&c.rtStepsFor("chores","lincoln",true).length===1);
  c.writes.length=0; c._mcDb("mom",LINC,null,null); ok("her ✕ retires that row (found by src.id)", c.hhJobs()[LINC].status==="retired"&&!c.mcAll()[LINC]);
}
{ const c=mk(); const upd=c.hhGiveTo("mc_mc_a","julian"); const j=c.hhJobs()["mc_mc_a"];
  ok("Mom → Julian: src new, slot chores, order 0 (his first)", j.who==="julian"&&j.src.kind==="new"&&j.slot==="chores"&&j.order===0, j);
  ok("on Julian's list, off Mom's strip", c.rtStepsFor("chores","julian",true).length===1&&!c.mcAll().mc_a);
  const d=mk(); d.hhGiveTo("dc_dc_a","mom"); ok("Dad → Mom: momChore src, on her strip, off his", d.hhJobs()["dc_dc_a"].src.kind==="momChore"&&!!d.mcAll()["dc_dc_a"]&&!d.dcAll().dc_a);
  const e=mk({noMom:true}); ok("not Mom → nothing", e.hhGiveTo(LINC,"lucy")===null&&e.writes.length===0);
}
console.log("On screen");
{ const c=mk(); const el={}; c.renderHousehold(el);
  ok("the + Add a chore button sits under the view chips", /hhAddToggle\(\)/.test(el.innerHTML)&&el.innerHTML.indexOf("hhAddToggle()")>el.innerHTML.indexOf("hhGo('today')"));
  c.hhAddToggle(); c.renderHousehold(el); ok("open: a name box, who / time / days / room / level pickers, Save", /id="hh-add-label"/.test(el.innerHTML)&&/hhAddSet\('who','lucy'\)/.test(el.innerHTML)&&/hhAddSet\('cad','wk:0'\)/.test(el.innerHTML)&&/hhAddSet\('room','living'\)/.test(el.innerHTML)&&/hhAddSet\('level',2\)/.test(el.innerHTML)&&/hhAddSave\(\)/.test(el.innerHTML));
  const row=c.hhRowHTML(LINC,c.hhJobs()[LINC]); ok("a Review row has → Give to…", /hhGiveToggle\('rt_chores_lincoln_vacuum_kitchen'\)/.test(row));
  c.hhGiveToggle(LINC); const g=c.hhGiveHTML(LINC); ok("the picker lists everyone but Lincoln and the pool", /hhGiveTo\('rt_chores_lincoln_vacuum_kitchen','lucy'\)/.test(g)&&/'mom'\)/.test(g)&&!/'lincoln'\)/.test(g)&&!/'grab'\)/.test(g));
  ok("opening Give to… closes the add form", c.get("hhAddOpen")===false);
  const d=mk({noMom:true}); ok("a kid's device sees neither button", d.hhAddHTML()===""&&d.hhGiveBtn(LINC)==="");
}
console.log("HH_ADD_FORM: emoji row and the Area pick");
{ const c=mk(); c.hhAddToggle(); c.dom["hh-add-label"]={value:"Wipe the kids table"}; c.dom["hh-add-pts"]={value:"10"};
  c.hhAddSet("emoji","🧽"); ok("tapping an emoji fills it in and keeps the words and stars she typed", c.get("hhAdd.emoji")==="🧽"&&c.get("hhAdd.label")==="Wipe the kids table"&&c.get("hhAdd.pts")==="10");
  const el={}; c.renderHousehold(el); ok("the row of emoji is there, the tapped one marked; the box shows it", /hhAddSet\('emoji','🧹'\)/.test(el.innerHTML)&&/#e6f4f3[^>]*>🧽</.test(el.innerHTML)&&/id="hh-add-emoji" value="🧽"/.test(el.innerHTML));
  ok("the Area pick shows the guess from her words (Cleaning) and says which areas wait", /hhAddSet\('area',''\)[^>]*>Guess from the words \(Cleaning\)</.test(el.innerHTML)&&/Cleaning · waits for the level/.test(el.innerHTML)&&/Health · always on/.test(el.innerHTML));
  c.dom["hh-add-emoji"]={value:"🧽"}; c.hhAddSet("area","health"); const id=c.hhAddSave(); const j=c.hhJobs()[id];
  ok("her pick beats the guess: Health, so no gate (on the list at any level), no floor", j.area==="health"&&j.emoji==="🧽"&&j.floor===""&&c.rtStepsFor("chores","lincoln",true).some(s=>s.label==="Wipe the kids table"));
  ok("the pick resets after Save", c.get("hhAdd.area")===""&&c.get("hhAdd.emoji")==="");
  c.hhAddSet("level",3); c.dom["hh-add-label"]={value:"Wipe the kids table"}; const id2=c.hhAddSave(); ok("left on Guess: Cleaning, and a Level 3 row waits for the gate", c.hhJobs()[id2].area==="cleaning"&&!c.rtStepsFor("chores","lincoln",true).some(s=>s._hh===id2));
  ok("no duplicate emoji in the row", c.get("new Set(HH_EMOJI).size===HH_EMOJI.length")===true);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
