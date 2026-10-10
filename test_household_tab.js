/*
 * 🏡 HOUSEHOLD — the Household tab on Mom's Day, PR 2 (her ask 2026-10-09; her "go" 2026-10-09). READ-ONLY on every live list:
 * "Bring in every chore" copies the kids' four lists (config, morningRoutine or code defaults), momChores, dadChores and Up for Grabs
 * into household/jobs/<id> field for field with a guessed area + floor; the Review view shows last 4 / 8 weeks from routineLog
 * (the review's method) and takes Keep / Change / Retire + a note; Today lists everyone's day. Every write targeted, under household/.
 *                                                                                                    run: node test_household_tab.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HOUSEHOLD_END");
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
  const jl={}; [[Y1,"p"],[Y2,"q"]].forEach(([d,k])=>{ jl[dayKey(d)]=jl[dayKey(d)]||{}; jl[dayKey(d)][k]={label:"Brush Teeth",slot:"morning",act:"on",ts:"",at:atOf(d),pts:0}; });
  const log={julian:{week12:jl},lucy:{week9:{tuesday:{a:{label:"Take sheets off beds",slot:"chores",act:"on",ts:"",at:atOf(TUE_ISO),pts:15},
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

console.log("Bring in every chore: one for one, fields intact, one multi-path update under household/");
{ const c=mk(); const rows=c.hhLiveRows();
  ok("11 live rows (3+1+1 afternoon, 1 chores, Julian's default shower + default morning, 2 Mom, 1 grab)", rows.length===11, rows.map(r=>r.id));
  const pk=rows.find(r=>r.id==="rt_afternoon_lucy_pickup_kitchen"); ok("Pickup kitchen keeps rot, pts, cad, slot", !!pk&&pk.fields.rot==="downstairs"&&pk.fields.pts===20&&pk.fields.cad==="daily"&&pk.fields.slot==="afternoon", pk);
  ok("empty strings dropped, pts defaulted", JSON.stringify(rows.find(r=>r.id==="rt_afternoon_lincoln_pickup_school_room").fields)===JSON.stringify({emoji:"🧹",label:"Pickup school room",pts:20,cad:"daily",rot:"downstairs",slot:"afternoon"}));
  ok("sources named", rows.find(r=>r.who==="julian"&&/shower/i.test(r.id)).source==="code default"&&pk.source==="config/routines"&&rows.find(r=>r.who==="mom").source==="momChores");
  const n=c.hhImport(); ok("import returns 11", n===11);
  ok("exactly one write: a root multi-path update", c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][1]==="", c.writes.map(w=>w[0]+" "+w[1]));
  const keys=Object.keys(c.writes[0][2]); ok("every key under household/", keys.every(k=>k.startsWith("household/")));
  ok("11 jobs + imported + importedN", keys.filter(k=>k.startsWith("household/jobs/")).length===11&&keys.includes("household/meta/imported")&&keys.includes("household/meta/importedN"));
  const j=c.writes[0][2]["household/jobs/rt_afternoon_lucy_pickup_kitchen"]; ok("job row = fields + who/src/source/area/floor/status/verdict/note/order", !!j&&j.who==="lucy"&&j.src.kind==="routine"&&j.src.slot==="afternoon"&&j.src.i===1&&j.status==="active"&&j.verdict===""&&j.note===""&&typeof j.order==="number");
  ok("no undefined values (Firebase would reject)", JSON.stringify(c.writes[0][2]).indexOf("undefined")<0);
  ok("second import adds nothing and writes nothing", c.hhImport()===0&&c.writes.length===1);
  ok("re-rendered", c.renders.length>=1);
}
console.log("Ids: long labels keep their whole slug; same label twice on one list → _2");
{ const c=mk({grabs:[{label:"Clean toilet inside, spray and wipe down, lift lid downstairs",pts:40,cad:"daily"},{label:"Clean toilet inside, spray and wipe down, lift lid mom's bathroom",pts:40,cad:"daily"},{label:"Clean toilet inside, spray and wipe down, lift lid top of stairs",pts:40,cad:"daily"},{label:"Organize school books",pts:5,cad:"daily"},{label:"Organize school books",pts:5,cad:"daily"}]});
  const ids=c.hhLiveRows().filter(r=>r.who==="grab").map(r=>r.id);
  ok("three toilets → three ids", new Set(ids.slice(0,3)).size===3&&ids[0]==="gb_clean_toilet_inside_spray_and_wipe_down_lift_lid_downstairs", ids);
  ok("duplicate label → _2", ids[3]==="gb_organize_school_books"&&ids[4]==="gb_organize_school_books_2", ids);
  const n=c.hhImport(); ok("import count equals the table size", n===Object.keys(c.hhJobs()).length&&n===15, [n,Object.keys(c.hhJobs()).length]);
}
console.log("Guesses: area and floor from the words");
{ const c=mk(); c.hhImport(); const J=c.hhJobs();
  ok("Brush Teeth → health", J.rt_morning_julian_brush_teeth.area==="health");
  ok("Let Chloe out → animals", J.rt_afternoon_lucy_let_chloe_out.area==="animals");
  ok("Pickup kitchen → pickup, down", J.rt_afternoon_lucy_pickup_kitchen.area==="pickup"&&J.rt_afternoon_lucy_pickup_kitchen.floor==="down");
  ok("Take sheets off beds → cleaning, up", J.rt_chores_lucy_take_sheets_off_beds.area==="cleaning"&&J.rt_chores_lucy_take_sheets_off_beds.floor==="up");
  ok("shower → health, and no floor (floors are for house work only)", J.rt_afternoon_lucy_shower.area==="health"&&J.rt_afternoon_lucy_shower.floor==="");
  ok("Mom's Wash the sheets → cleaning/up; Kitchen close-down → cleaning/down", J.mc_mc_sheets.area==="cleaning"&&J.mc_mc_sheets.floor==="up"&&J.mc_mc_kclose.floor==="down");
  ok("baseboards grab → cleaning, ask", J.gb_spray_and_wipe_down_baseboards.area==="cleaning"&&J.gb_spray_and_wipe_down_baseboards.floor==="ask");
}
console.log("Keep / Change / Retire, area, floor, note: targeted field writes");
{ const c=mk(); c.hhImport(); c.writes.length=0;
  c.hhSet("rt_chores_lucy_take_sheets_off_beds","verdict","retire");
  ok("retire → verdict + status, two targeted sets", c.writes.length===2&&c.writes[0][1]==="household/jobs/rt_chores_lucy_take_sheets_off_beds/verdict"&&c.writes[0][2]==="retire"&&c.writes[1][1]==="household/jobs/rt_chores_lucy_take_sheets_off_beds/status"&&c.writes[1][2]==="retired", c.writes);
  ok("retired stays in the table", !!c.hhJobs().rt_chores_lucy_take_sheets_off_beds);
  c.writes.length=0; c.hhSet("rt_chores_lucy_take_sheets_off_beds","verdict","keep"); ok("keep → status back to active", c.writes[1][2]==="active");
  c.writes.length=0; c.hhCycle("rt_afternoon_lucy_pickup_kitchen","floor"); ok("floor cycles down → up with one set", c.writes.length===1&&c.writes[0][1].endsWith("/floor")&&c.writes[0][2]==="up");
  c.writes.length=0; c.hhNote("rt_afternoon_lucy_pickup_kitchen",{value:"move to Tue"}); ok("note set", c.writes.length===1&&c.writes[0][2]==="move to Tue");
  c.writes.length=0; c.hhSet("rt_afternoon_lucy_pickup_kitchen","label","hacked"); c.hhSet("nope","verdict","keep"); ok("unknown field / unknown id: nothing", c.writes.length===0);
  const d=mk({noMom:true}); ok("not Mom → import and set do nothing", d.hhImport()===0&&d.writes.length===0);
  const e=mk({dry:true}); e.hhImport(); ok("?dryrun=1 → no writes, table filled locally", e.writes.length===0&&Object.keys(e.hhJobs()).length===11);
  const f=mk({nodb:true}); f.hhImport(); ok("db null → no throw", Object.keys(f.hhJobs()).length===11);
}
console.log("The numbers (last 4 / 8 weeks), the review's method");
{ const c=mk(); c.hhImport(); const J=c.hhJobs();
  const sh=c.hhStats(J.rt_chores_lucy_take_sheets_off_beds);
  ok("Lucy sheets: 4 Mondays in 4 wks, 8 in 8; done 1 (tapped Tuesday) = late 1; app miss 1", sh.due4===4&&sh.due8===8&&sh.done8===1&&sh.late8===1&&sh.miss8===1&&sh.last===MON_ISO, sh);
  const pk=c.hhStats(J.rt_afternoon_lucy_pickup_kitchen);
  ok("Pickup kitchen: due daily (56 / 28); the right room counts, the wrong room doesn't", pk.due8===56&&pk.due4===28&&pk.done8===1&&pk.late8===0, pk);
  ok("rotation label on a date follows roster order + day hop", c.hhRotLabelOn(J.rt_afternoon_lucy_pickup_kitchen,TUE_ISO)===["Pickup school room","Pickup living room","Pickup kitchen"][(2+dayNum(TUE_ISO))%3]);
  const ms=c.hhStats(J.mc_mc_sheets); ok("Mom's sheets: stamped Wednesday for Monday → done 1, late 1", ms.due8===8&&ms.done8===1&&ms.late8===1, ms);
  const gb=c.hhStats(J.gb_spray_and_wipe_down_baseboards); ok("grab claim found despite the emoji in the log label", gb.done8===1&&gb.due8===56, gb);
  const sw=c.hhStats(J.rt_afternoon_lucy_shower); ok("shower wk:2,4,6 → 12 in 4 wks, 24 in 8", sw.due4===12&&sw.due8===24, sw);
  const kc=c.hhStats(J.mc_mc_kclose); ok("a daily Mom chore never stamped: 0/56", kc.due8===56&&kc.done8===0);
  ok("asneeded / none are never due", c.hhStats({cad:"asneeded",who:"lucy",slot:"morning",label:"x"}).due8===0);
}
console.log("📈 Habits: daily items, 28 dots, streaks");
{ const c=mk(); c.hhImport(); const J=c.hhJobs();
  const hb=c.hhHabit(J.rt_morning_julian_brush_teeth);
  ok("Julian's teeth: 28 dots, last two green, streak 2, best 2, 2/28", hb.dots.length===28&&hb.dots[27]===true&&hb.dots[26]===true&&hb.dots[25]===false&&hb.cur===2&&hb.best===2&&hb.done4===2, hb);
  const pk=c.hhHabit(J.rt_afternoon_lucy_pickup_kitchen); ok("pickup kitchen: one green dot (the right room), streak 0", pk.done4===1&&pk.cur===0, pk);
  const el={}; c.hhGo("habits"); c.renderHousehold(el);
  ok("Habits view: people with area headers, dots and 🔥 chips; weekly items left out; no grabs", /Julian<\/div>/.test(el.innerHTML)&&/🧼 Health/.test(el.innerHTML)&&/🔥 2 days/.test(el.innerHTML)&&!/Take sheets off beds/.test(el.innerHTML)&&!/baseboards/.test(el.innerHTML)&&(el.innerHTML.match(/width:9px/g)||[]).length>=28*5);
  ok("Mom's daily Kitchen close-down is a habit row (stamps)", /Kitchen close-down/.test(el.innerHTML));
  const e=mk(); const el2={}; e.hhGo("habits"); e.renderHousehold(el2); ok("empty table → pointer to Review", /Bring in every chore on 📋 Review first/.test(el2.innerHTML));
}
console.log("Views and wiring");
{ const c=mk(); const el={}; c.renderHousehold(el);
  ok("empty table → the Bring-in button and the live count", /Bring in every chore/.test(el.innerHTML)&&/\(11 rows\)/.test(el.innerHTML)&&/<nav:house>/.test(el.innerHTML));
  c.hhImport(); c.renderHousehold(el);
  ok("groups per person with counts", /Lucy<\/span><span[^>]*>4 chores/.test(el.innerHTML)&&/Mom<\/span><span[^>]*>2 chores/.test(el.innerHTML)&&/Up for Grabs/.test(el.innerHTML));
  ok("tally chips", /Keep 0/.test(el.innerHTML)&&/no call yet 11/.test(el.innerHTML));
  c.hhToggleWho("lucy"); c.renderHousehold(el);
  ok("open group shows rows with numbers, slot headers, verdict buttons, note box", /Take sheets off beds/.test(el.innerHTML)&&/4 wk 1\/4/.test(el.innerHTML)&&/Chores<\/div>/.test(el.innerHTML)&&/hhSet\('rt_chores_lucy_take_sheets_off_beds','verdict','retire'\)/.test(el.innerHTML)&&/hhNote\(/.test(el.innerHTML));
  c.hhGo("today"); c.renderHousehold(el);
  ok("Today: morning ticks come from the morning key (Julian's Brush Teeth ✅)", /Julian[\s\S]*✅<\/span><span>🦷<\/span><span style="flex:1">Brush Teeth/.test(el.innerHTML));
  ok("Today: Lucy's Monday list with the done tick and Mom's due chores", /Let Chloe out/.test(el.innerHTML)&&/✅/.test(el.innerHTML)&&/Take sheets off beds/.test(el.innerHTML)&&/Wash the sheets/.test(el.innerHTML)&&!/shower/.test(el.innerHTML.split("Lucy")[1].split("Julian")[0]), el.innerHTML.slice(0,200));
  ok("sub-nav chip + dispatch + listener", /btn\('house','🧹 Household'\)/.test(src)&&/if\(mpSubView==='house'\)\{ return renderHousehold\(el\); \}/.test(src)&&/db\.ref\("household"\)\.on\("value"/.test(src));
  ok("the block writes only under household/", !/db\.ref\("(config|momChores|dadChores|week|routineLog|bank|laundry)/.test(BLOCK)&&!/\.set\(routineCfg2\)/.test(BLOCK));
  ok("rtStepsFor itself untouched", /if\(raw\) return steps;\s*\/\/ editor\/config seeding must NEVER see a rotated label\n\s*return rtApplyRot\(slot,kid,steps,dayName\);\n\}/.test(src));
  ok("no 🔀 in index.html", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
