/*
 * ✎ HH_EDITOR — every row editable on the Household tab, and the Area / Room views by person (her 2026-10-11). One targeted
 * write per change; a kid's time-of-day change moves the row to the end of the new list; weekdays start today.
 *                                                                                       run: node test_household_editor.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HH_EDITOR_END"), CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); const TODAY=iso(new Date());
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, isMom:true, momHere:()=>ctx.isMom, confirm:()=>true, rulesData:{}, calendarData:{holidays:{},vacations:{}},
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{},
    routineCfg2:{chores:{lincoln:[{emoji:"🧹",label:"Vacuum kitchen",pts:30,cad:"wk:2"},{emoji:"🍽️",label:"Wipe table",pts:10,cad:"daily"}],lucy:[{emoji:"🧽",label:"Dust dining area",pts:15,cad:"wk:2"}]},afternoon:{lincoln:[{emoji:"🧹",label:"Pickup school room",pts:20,cad:"daily"}]}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",slot:"night",ts:1}}, dadChoresData:{}, activeWk:()=>"week26", _todayDay:"saturday", _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:()=>null}, writes};
  vm.createContext(ctx); vm.runInContext(fn("toMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.hhImport(); ctx.hhTakeover(true); ctx.isMom=!o.noMom; ctx.writes.length=0; return ctx;   // set up as Mom, then become the device under test
}
const VAC="rt_chores_lincoln_vacuum_kitchen", WIPE="rt_chores_lincoln_wipe_table", PICK="rt_afternoon_lincoln_pickup_school_room", MOM="mc_mc_a";
const one=(c,path)=>c.writes.length===1&&c.writes[0][0]==="update"&&Object.keys(c.writes[0][2]).length===1&&Object.keys(c.writes[0][2])[0]===path;
console.log("1. Every field, one targeted write each");
{ const c=mk();
  c.hhEditSet(VAC,"label","Vacuum the kitchen floor"); ok("words", c.hhJobs()[VAC].label==="Vacuum the kitchen floor"&&one(c,"household/jobs/"+VAC+"/label")&&c.rtStepsFor("chores","lincoln",true)[0].label==="Vacuum the kitchen floor", c.writes);
  c.writes.length=0; ok("blank words refused", c.hhEditSet(VAC,"label","  ")===null&&c.writes.length===0);
  c.hhEditSet(VAC,"emoji","🧼"); ok("emoji", c.hhJobs()[VAC].emoji==="🧼"&&one(c,"household/jobs/"+VAC+"/emoji"));
  c.writes.length=0; c.hhEditSet(VAC,"pts","45"); ok("stars (kids only; Mom's refused)", c.hhJobs()[VAC].pts===45&&one(c,"household/jobs/"+VAC+"/pts")&&c.hhEditSet(MOM,"pts",5)===null);
  c.writes.length=0; c.hhEditSet(VAC,"slot","afternoon"); const w=c.writes[0][2];
  ok("time of day for a kid: slot + order at the END of the new list, in one update; the list re-derives", c.hhJobs()[VAC].slot==="afternoon"&&w["household/jobs/"+VAC+"/slot"]==="afternoon"&&w["household/jobs/"+VAC+"/order"]===1&&c.rtStepsFor("afternoon","lincoln",true).map(s=>s.label).join("|")==="Pickup school room|Vacuum the kitchen floor"&&c.rtStepsFor("chores","lincoln",true).length===1, w);
  ok("a bad slot refused", c.hhEditSet(VAC,"slot","lunch")===null);
  c.writes.length=0; c.hhEditSet(MOM,"slot","morning"); ok("Mom's time of day uses her strip's slots", c.hhJobs()[MOM].slot==="morning"&&c.mcAll().mc_a.slot==="morning"&&c.hhEditSet(MOM,"slot","chores")===null);
  c.writes.length=0; c.hhEditSet(WIPE,"cad","wk:0,3"); const w2=c.writes[0][2];
  ok("days: Mon + Thu on a daily row — the cad and a start date of today (never born late)", c.hhJobs()[WIPE].cad==="wk:0,3"&&w2["household/jobs/"+WIPE+"/cad"]==="wk:0,3"&&w2["household/jobs/"+WIPE+"/from"]===TODAY);
  c.hhEditDay(WIPE,5); ok("toggle Sat on → Mon, Thu, Sat", c.hhJobs()[WIPE].cad==="wk:0,3,5");
  c.hhEditDay(WIPE,0); ok("toggle Mon off", c.hhJobs()[WIPE].cad==="wk:3,5");
  c.hhEditDay(WIPE,3); c.hhEditDay(WIPE,5); ok("the last day can't be toggled off", c.hhJobs()[WIPE].cad==="wk:5");
  c.hhEditCadMode_set(WIPE,"nd"); ok("Every N days starts at 3", c.hhJobs()[WIPE].cad==="3d"); c.hhEditSet(WIPE,"cad","10d"); ok("…and takes a number", c.hhJobs()[WIPE].cad==="10d");
  ["2w","28d","42d","asneeded","daily","once"].forEach(m=>c.hhEditCadMode_set(WIPE,m)); ok("every 2 / 4 / 6 weeks, as needed, daily, once all take", c.hhJobs()[WIPE].cad==="once");
  ok("a bad cad refused", c.hhEditSet(WIPE,"cad","wk:9")===null&&c.hhEditSet(WIPE,"cad","sometimes")===null);
  c.writes.length=0; c.hhEditSet(WIPE,"from","2026-11-01"); ok("start date", c.hhJobs()[WIPE].from==="2026-11-01"&&one(c,"household/jobs/"+WIPE+"/from")&&c.hhEditSet(WIPE,"from","soon")===null);
  c.writes.length=0; c.hhEditSet(WIPE,"from",""); ok("clearing the start date removes it", c.hhJobs()[WIPE].from===undefined&&c.writes[0][2]["household/jobs/"+WIPE+"/from"]===null);
  c.writes.length=0; c.hhEditSet(VAC,"minutes","25"); c.hhEditSet(VAC,"room","kitchen"); c.hhEditSet(VAC,"level",2); c.hhEditSet(VAC,"area","pickup");
  ok("minutes, room, level, area go through the plan-field writer (one set each)", c.hhJobs()[VAC].minutes===25&&c.hhJobs()[VAC].room==="kitchen"&&c.hhJobs()[VAC].level===2&&c.hhJobs()[VAC].area==="pickup"&&c.writes.length===4&&c.writes.every(x=>x[0]==="set"));
  const k=mk({noMom:true}); ok("not Mom → nothing", k.hhEditSet(VAC,"label","x")===null&&k.hhEditDay(WIPE,1)===null&&k.writes.length===0);
}
console.log("2. On screen");
{ const c=mk(); const row=c.hhRowHTML(VAC,c.hhJobs()[VAC]); ok("✎ Edit on a Review row", /hhEditToggle\('rt_chores_lincoln_vacuum_kitchen'\)/.test(row)&&!/Time of day/.test(row));
  c.hhEditToggle(VAC); const e=c.hhEditHTML(VAC);
  ok("the editor: emoji row, words, stars, four kid slots, the days modes with Mon–Sun, minutes, start date, rooms, levels, areas, who can, Give to…, Retire, Done", /hhEditSet\('rt_chores_lincoln_vacuum_kitchen','emoji','🧹'\)/.test(e)&&/hhEditField\('rt_chores_lincoln_vacuum_kitchen','label',this\)/.test(e)&&/title="stars"/.test(e)&&/'slot','evening'/.test(e)&&/hhEditCadMode_set\('rt_chores_lincoln_vacuum_kitchen','wk'\)/.test(e)&&/hhEditDay\('rt_chores_lincoln_vacuum_kitchen',6\)/.test(e)&&/'minutes',this/.test(e)&&/type="date"/.test(e)&&/'room','living'/.test(e)&&/'level',3\)/.test(e)&&/'area','animals'/.test(e)&&/hhCanToggle\('rt_chores_lincoln_vacuum_kitchen','lucy'\)/.test(e)&&/hhGiveToggle\(/.test(e)&&/'verdict','retire'/.test(e)&&/Done</.test(e));
  ok("Wednesday is marked on the weekday chips", /background:#0e7490;color:#fff[^>]*>Wed</.test(e));
  c.hhEditToggle(MOM); const em=c.hhEditHTML(MOM); ok("Mom's editor: her four slots, no stars box", /'slot','night'/.test(em)&&!/title="stars"/.test(em));
  const k=mk({noMom:true}); ok("a kid's device: no ✎, no editor", k.hhEditBtn(VAC)===""&&!/hhEditToggle/.test(k.hhRowHTML(VAC,k.hhJobs()[VAC])));
}
console.log("3. Area and Room by person");
{ const c=mk(); const el={}; c.hhGo("area"); c.get('hhOpenArea="cleaning"'); c.renderHousehold(el); let h=el.innerHTML;
  ok("the Cleaning card has a heading per person with count and minutes, Lincoln before Lucy — folded by default, no rows showing", /hhPersonToggle\('area','cleaning','lincoln'\)/.test(h)&&/Lincoln<\/span><span[^>]*>2 · \d+ min/.test(h)&&h.indexOf("Lincoln<")<h.indexOf("Lucy<")&&!/hhEditToggle\('/.test(h)&&!/One main chore a day/.test(h));
  c.hhPersonToggle("area","cleaning","lincoln"); c.renderHousehold(el); h=el.innerHTML;
  ok("tap Lincoln: his time-of-day headings (Chores · 2), each folded, no rows yet; Lucy's stay folded", /hhPersonToggle\('area','cleaning','lincoln\|chores'\)/.test(h)&&/Chores<\/span><span[^>]*>2 · \d+ min/.test(h)&&!/hhEditToggle\('/.test(h)&&!/'lucy\|chores'/.test(h));
  c.hhPersonToggle("area","cleaning","lincoln|chores"); c.renderHousehold(el); h=el.innerHTML;
  ok("tap Chores: his two chores rows open with ✎", /hhEditToggle\('rt_chores_lincoln_vacuum_kitchen'\)/.test(h)&&/hhEditToggle\('rt_chores_lincoln_wipe_table'\)/.test(h)&&!/hhEditToggle\('rt_chores_lucy_dust_dining_area'\)/.test(h));
  c.get('hhOpenArea="pickup"'); c.hhPersonToggle("area","pickup","lincoln"); c.renderHousehold(el); ok("Pickup card: Lincoln's Afternoon group, folded", /hhPersonToggle\('area','pickup','lincoln\|afternoon'\)/.test(el.innerHTML)&&!/hhEditToggle\('rt_afternoon_lincoln_pickup_school_room'\)/.test(el.innerHTML));
  c.get('hhOpenArea="cleaning"'); c.hhPersonToggle("area","cleaning","mom"); c.renderHousehold(el); ok("Mom open: her Night group, named from her strip's slots", /hhPersonToggle\('area','cleaning','mom\|night'\)/.test(el.innerHTML)&&/Night<\/span>/.test(el.innerHTML));
  const RV=c.get('hhRoomOf(hhJobs()["'+VAC+'"])'), RD=c.get('hhRoomOf(hhJobs()["rt_chores_lucy_dust_dining_area"])');
  c.hhGo("room"); c.get('hhOpenRoom="'+RV+'"'); c.renderHousehold(el); let r=el.innerHTML; ok("the Room card: a folded heading per person, no rows", new RegExp("hhPersonToggle\\('room','"+RV+"','lincoln'\\)").test(r)&&!/hhEditToggle\('/.test(r));
  c.hhPersonToggle("room",RV,"lincoln"); c.renderHousehold(el); r=el.innerHTML; ok("tap Lincoln in that room: his Chores heading, folded", new RegExp("hhPersonToggle\\('room','"+RV+"','lincoln\\|chores'\\)").test(r)&&!/hhEditToggle\('rt_chores_lincoln_vacuum_kitchen'\)/.test(r));
  c.hhPersonToggle("room",RV,"lincoln|chores"); c.renderHousehold(el); r=el.innerHTML; ok("tap Chores: his row with ✎", /hhEditToggle\('rt_chores_lincoln_vacuum_kitchen'\)/.test(r));
  c.get('hhOpenRoom="'+RD+'"'); c.renderHousehold(el); r=el.innerHTML; ok("another room: Lucy folded there until tapped twice (person, then Chores)", !/hhEditToggle\('rt_chores_lucy_dust_dining_area'\)/.test(r)&&(c.hhPersonToggle("room",RD,"lucy"),c.hhPersonToggle("room",RD,"lucy|chores"),c.renderHousehold(el),/hhEditToggle\('rt_chores_lucy_dust_dining_area'\)/.test(el.innerHTML)));
  c.get('hhOpenRoom="'+RV+'"'); c.hhSortToggle(); c.renderHousehold(el); ok("sorted most-behind-first: no headings at all, every row shows", !/hhPersonToggle\(/.test(el.innerHTML)&&/hhEditToggle\('rt_chores_lincoln_vacuum_kitchen'\)/.test(el.innerHTML));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
