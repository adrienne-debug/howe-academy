/*
 * HOUSEPERSON + HOUSEPREVIEW — Household by room, step 3 (DESIGN_household_rooms_2026-11-15 §3.4, §4.3, §9 row 3, §12): 👤 By person,
 * the room grid's next 4 weeks and "Tomorrow would look like this", all from the engine in house.js, all ONLY on the Household tab.
 * Proves:
 *   · By person: the preview switch, a "Loading…" line until house.js is here, routines as on the lists now, 🌅 carries, the plan's
 *     house chores (minutes vs limit, moved off), seven bars, Settings calling the existing setters, Habits for that person only.
 *   · Room pages: with the switch off nothing changes; on preview the grid gains 28 future rows and the Tomorrow panel = the engine.
 *   · THE ONE RULE (parity): with the switch off AND on preview (limits and fit edited, every view drawn) every kid's four lists,
 *     Mom's and Dad's lists and the table are identical to what main gives for the same data; no write lands outside
 *     household/people and household/meta/engine; drawing writes nothing.
 *   · Nothing outside the Household tab reads household/meta/engine or calls into house.js.
 * Made-up family only (Ava, Ben, Cal; Mom, Dad).
 *   run: node test_house_preview.js
 *   BASE_HTML=/path/to/main/index.html node test_house_preview.js → the parity check also runs main's Household code on the same data.
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const testSrc=require("./test_src.js");
const SRC=testSrc(), RAW=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"), HJS=fs.readFileSync(path.join(__dirname,"house.js"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fnOf=s=>name=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cutOf=s=>(a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a+" / "+b); return s.slice(i,s.indexOf("\n",j)); };
const fn=fnOf(SRC), cut=cutOf(SRC);
const HH=cut("// HOUSEHOLD_START","// HOUSEPREVIEW_END");
const LIB=s=>{ const f=fnOf(s); return s.slice(s.indexOf("const _CAD_DOW="),s.indexOf("function cadLabel("))+f("cadLabel")+"\nlet rotationPeriod={};\n"+["_rotKey","rtRotPeriod","_rtRotHop","rtApplyRot","rtCfgEnsure","rtCfgSave","stepCycleOk","rtStepsFor","toMin","to12h","ampmTo24","mcAll","dcAll"].map(f).join("\n"); };
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); }, isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const TODAY=isoD(new Date()), T=dayNum(TODAY), DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"], DAYS=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const K=o=>Object.assign({src:{kind:"new"},status:"active",area:"cleaning"},o);
const JOBS=()=>({
  h_teeth:K({label:"Brush teeth",who:"ava",slot:"morning",cad:"daily",area:"health",order:0}),
  h_vit:K({label:"Take vitamins",who:"ben",slot:"morning",cad:"daily",area:"health",order:0}),
  a_fish:K({label:"Feed the fish",who:"cal",slot:"afternoon",cad:"daily",area:"animals",order:0}),
  k_counter:K({label:"Wipe the counters",emoji:"🧽",who:"ava",slot:"chores",cad:"daily",room:"kitchen",minutes:10,order:1,can:["ava","ben"]}),
  k_floor:K({label:"Sweep the kitchen",who:"ava",slot:"chores",cad:"daily",room:"kitchen",minutes:15,order:2}),
  k_sink:K({label:"Scrub the sink",who:"ava",slot:"chores",cad:"daily",room:"kitchen",minutes:10,order:3,can:["ava","mom"]}),
  k_oven:K({label:"Clean the oven",who:"cal",slot:"chores",cad:"3d",room:"kitchen",minutes:30,order:1}),
  k_mop:K({label:"Mop the floor",who:"ben",slot:"chores",cad:"wk:0,1,2,3,4,5,6",room:"kitchen",minutes:15,order:1}),
  r_ava:K({label:"Pickup the den",who:"ava",slot:"afternoon",cad:"daily",rot:"pick",area:"pickup",room:"living",order:5,minutes:5}),
  r_ben:K({label:"Pickup the porch",who:"ben",slot:"afternoon",cad:"daily",rot:"pick",area:"pickup",room:"entry",order:5,minutes:5}),
  m_tea:K({label:"Morning tea",who:"mom",slot:"morning",cad:"daily",area:"health",src:{kind:"momChore",id:"tea"},order:0}),
  m_fridge:K({label:"Wipe the fridge",who:"mom",slot:"",cad:"daily",room:"kitchen",minutes:10,src:{kind:"momChore",id:"fridge"},order:1}),
  d_trash:K({label:"Trash to the curb",who:"dad",slot:"",cad:"daily",area:"pickup",room:"kitchen",minutes:5,src:{kind:"dadChore",id:"trash"},order:0}),
  o_shelf:K({label:"Fix the shelf",who:"ben",slot:"chores",cad:"once",hold:true,room:"kitchen",order:9}),
  g_dust:K({label:"Dust the shelves",who:"grab",cad:"daily",pts:20,room:"living",src:{kind:"grab",i:0},order:0})
});
function mk(o){
  o=o||{}; const writes=[], ls={}, loads=[], bonus=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,Promise,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p]),on:()=>{}})},
    _dryRun:()=>!!o.dry, isMom:!o.noMom, momHere:()=>ctx.isMom, confirm:()=>true, rulesData:{}, calendarData:{holidays:{},vacations:{},cleaningDays:{}},
    ROSTER:["ava","ben","cal"], SL_KIDS:["ava","ben","cal"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"}, FIRST_KID:"ava",
    KID_NAME:{ava:"Ava",ben:"Ben",cal:"Cal"}, KID_COLOR:{ava:"#aa1111",ben:"#11aa11",cal:"#1111aa"}, MC_DEFAULT:{}, HA_IS_HOWE:false,
    routineCfg2:{}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[], routineTimes:{}, _rtRotDayNum:()=>T,
    stepWindowOk:()=>true, rtDoneOn:(s,k,d,i)=>k==="cal"&&s==="afternoon"&&i===0, mStepDoneOn:(k,d,i)=>k==="ava"&&i===0, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[], grabs:[],
    routineLog:{}, momdayData:{}, daddayData:{}, momChoresData:{}, dadChoresData:{}, activeWk:()=>"week9", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    routineDateISO:()=>TODAY, DAY_DT:{}, rlHistReady:()=>true, rlLoadingHTML:()=>"",
    amList:k=>k==="ava"?[{id:"x",label:"Put away shoes",emoji:"👟",fromIso:isoOf(T-1),dueIso:TODAY,slot:"chores"},{id:"y",label:"Old one",fromIso:isoOf(T-5),dueIso:isoOf(T-4),done:{iso:isoOf(T-4)}}]:[],
    rtBonusFor:()=>0, rtBonusSet:(s,k,v)=>bonus.push([s,k,v]), ready:o.ready!==false, haLazyReady:n=>n==="house"&&ctx.ready, haLazyLoad:n=>{ loads.push(n); return { then:()=>{} }; },
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"), mwBanner:s=>"", mpSubnav:v=>"", mwToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{},
    document:{getElementById:()=>null}, writes, loads, bonus};
  vm.createContext(ctx);
  vm.runInContext(LIB(o.base||SRC)+"\n"+(o.base?cutOf(o.base)("// HOUSEHOLD_START","// HH_CARD_END"):HH)+"\nthis.HD=function(){ return householdData; }; this.get=function(e){ return eval(e); };", ctx);
  const hd={jobs:JOBS(),meta:{takeover:1}}; if(o.hd) Object.assign(hd,o.hd);
  ctx.householdOnValue(hd); ctx.writes.length=0; return ctx;
}
const handlers=h=>{ const out=[], re=/ on(click|change)="([^"]*)"/g; let m; while((m=re.exec(h))) out.push(m[2].replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&#39;/g,"'")); return out; };
const rows=h=>(h.match(/<tr/g)||[]).length;

// ── 👤 By person ─────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── 👤 By person ──");
{ const c=mk({ready:false}); const h=c.hhPersonDoor();
  ok("house.js not here yet → 'Loading the plan preview…' and ONE fetch of house.js", /Loading the plan preview/.test(h)&&c.loads.join()==="house"); }
{ const c=mk(); c.get('hhView="person"'); const h=c.hhPersonDoor();
  ok("switch off: Mom sees '🔭 Show the plan preview' (hhEngineTap(true)) and no plan", handlers(h).includes("hhEngineTap(true)")&&!/WOULD give/.test(h)&&!/This week/.test(h));
  ok("…routines as on the lists now: Ava's 'Brush teeth', ticked (✅) from her morning check-off", /✅<\/span><span><\/span><span style="flex:1">Brush teeth/.test(h));
  ok("…🌅 'Put away shoes' sent to her morning list shows; a finished one does not", /Put away shoes/.test(h)&&/from /.test(h)&&!/Old one/.test(h));
  ok("…house chores are NOT in her routines list", !/Wipe the counters/.test(h.slice(0,h.indexOf("⚙ Settings"))));
  ok("drawing By person wrote nothing", c.writes.length===0);
}
{ const c=mk({hd:{meta:{takeover:1,engine:{mode:"preview",on:isoOf(T-2)}}}}); c.get('hhView="person"');
  const h=c.hhPersonDoor(), run=c.hpRun(), d0=run[0];
  ok("preview on: 'the plan WOULD give today' with Ava's minutes against her limit", /WOULD give today/.test(h)&&h.indexOf(d0.used.ava+' / '+d0.limit.ava+' min')>0, {used:d0.used.ava,lim:d0.limit.ava});
  const mine=(d0.list.ava||[]).filter(id=>d0.plan[id].house);
  ok("…every house chore the engine gives Ava today is listed and opens its card", mine.length>0&&mine.every(id=>handlers(h).includes("hcOpen('"+id+"')")), mine);
  const moved=Object.keys(d0.plan).filter(id=>d0.plan[id].from==="ava").concat(d0.over.filter(o=>o.turn==="ava").map(o=>o.id));
  ok("…what moved off her today is listed (→ name / → Grabs)", moved.length>0&&/Moved off them today/.test(h)&&moved.every(id=>handlers(h).includes("hcOpen('"+id+"')")), moved);
  ok("…seven bars: today and the 6 days after", /📆 This week/.test(h)&&(h.match(/width:62px;font-weight:800;color:/g)||[]).length===7);
  ok("…routine rows open their card too (health is edited here)", handlers(h).includes("hcOpen('h_teeth')"));
  ok("…and 'Stop showing it' turns the preview off", handlers(h).includes("hhEngineTap(false)"));
  ok("drawing the preview wrote nothing", c.writes.length===0);
  // Settings: every control calls an existing setter
  const H=handlers(h);
  ok("Settings: school / weekend limit → hpLimitSet, fit → hpFitSet, level → hhLevelSetFor (the existing setter)", ["hpLimitSet('ava','school',this.value)","hpLimitSet('ava','weekend',this.value)","hpFitSet('ava','mixed')","hpFitSet('ava','school')","hhLevelSetFor('ava',0)","hhLevelSetFor('ava',2)"].every(x=>H.includes(x)), H.filter(x=>/Set/.test(x)));
  ok("…whole-list bonus per list and whole-day bonus → hpBonusSet (→ rtBonusSet)", ["morning","afternoon","chores","evening","day"].every(sl=>H.includes("hpBonusSet('"+sl+"','ava',this.value)")));
  ok("…'mixed in / school first' says in plain words that nothing uses it yet", /nothing uses this yet/.test(h));
  ok("…reordering rows points to Chores &amp; Stars (its setter rewrites the whole list; left out here)", /Chores &amp; Stars ▸ Lists/.test(h)&&!H.some(x=>/rtCfgMove|cpMove/.test(x)));
  c.hpBonusSet("chores","ava","7"); ok("hpBonusSet calls rtBonusSet(slot, kid, value) for Mom", JSON.stringify(c.bonus)===JSON.stringify([["chores","ava","7"]]));
  const d=mk({dry:true}); d.hpBonusSet("chores","ava","7"); const n=mk({noMom:true}); n.hpBonusSet("chores","ava","7");
  ok("…but not under ?dryrun=1 (rtBonusSet itself would write) and not for anyone else", d.bonus.length===0&&n.bonus.length===0);
  const m=mk({noMom:true,hd:{meta:{takeover:1,engine:{mode:"preview",on:TODAY}}}}); const hm=m.hpPersonHTML();
  ok("not Mom: no settings inputs, no switch, chores don't open a card", !handlers(hm).some(x=>/hpLimitSet|hpFitSet|hhLevelSetFor|hpBonusSet|hhEngineTap|hcOpen/.test(x)));
  c.hpPick("mom"); const hmom=c.hpPersonHTML();
  ok("Mom's page: her health row 'Morning tea' from her list, her plan minutes, no kid bonuses", /Morning tea/.test(hmom)&&/WOULD give today/.test(hmom)&&!/hpBonusSet/.test(hmom));
}
{ const c=mk(); const all=c.hhHabitsHTML(), one=c.hhHabitsHTML("ava");
  const old=fnOf(SRC)("hhHabitsHTML").replace("function hhHabitsHTML(only){   // HH_PEOPLE: only = one person (👤 By person ▸ Habits); none = everyone, as before","function hhHabitsHTMLBefore(){").replace("HH_WHO.forEach(function(w){ if(only&&w!==only) return;","HH_WHO.forEach(function(w){");
  vm.runInContext(old,c);
  ok("Habits: everyone's view is unchanged (no argument = as before)", all===c.hhHabitsHTMLBefore()&&/Ava/.test(all)&&/Ben/.test(all));
  ok("…By person ▸ Habits = that person only", /Ava/.test(one)&&!/>Ben</.test(one)&&!/>Cal</.test(one)); }

// ── room pages ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── room pages ──");
{ const c=mk(); c.get('hhView="rooms"; hhRmSel="kitchen"'); const off=c.hhRoomsPageHTML();
  ok("switch off: the kitchen grid is the past 2 weeks + today, no preview, no Tomorrow panel", !/🔭/.test(off)&&!/Tomorrow would/.test(off)&&c.loads.length===0);
  const offRows=rows(off);
  const p=mk({hd:{meta:{takeover:1,engine:{mode:"preview",on:TODAY}}}}); p.get('hhView="rooms"; hhRmSel="kitchen"'); const on=p.hhRoomsPageHTML(), run=p.hpRun();
  ok("preview on: 28 more rows (the next 4 weeks)", rows(on)===offRows+28, {off:offRows,on:rows(on)});
  ok("…the past and today are drawn exactly as with the switch off", on.slice(0,on.indexOf('<tr style="background:#fbfdff"'))===off.slice(0,off.indexOf("</table>")));
  ok("…future squares are the plan (dashed, 'Plan preview'); overflow shows as 'Grab'", /title="Plan preview"/.test(on)&&(run.slice(1).some(d=>d.over.some(o=>p.hhJobs()[o.id].room==="kitchen"))?/>Grab</.test(on):true));
  ok("…the note says what the future rows are, in plain words", /plan preview: who the plan WOULD give each chore/.test(on));
  const d1=run[1];
  ok("Tomorrow would look like this: every person, minutes vs limit = the engine's day 2", /Tomorrow would look like this/.test(on)&&["ava","ben","cal","mom","dad"].every(w=>on.indexOf(d1.used[w]+' / '+d1.limit[w]+' min')>0));
  ok("…every overflow is listed with whose turn and who could take it from Up for Grabs", on.indexOf("Would go to Up for Grabs ("+d1.over.length+")")>0&&d1.over.every(o=>handlers(on).includes("hcOpen('"+o.id+"')")));
  ok("…tight made-up day: Ava's turn is moved or overflows (she has 20 min, her chores ask 35+)", d1.over.some(o=>o.turn==="ava")||Object.values(d1.plan).some(x=>x.from==="ava"));
  ok("…and the Whole house page has the panel too", (p.get('hhRmSel=""'),/Tomorrow would look like this/.test(p.hhRoomsPageHTML())));
  ok("drawing the room pages wrote nothing", p.writes.length===0);
  const q=mk({ready:false,hd:{meta:{takeover:1,engine:{mode:"preview",on:TODAY}}}}); q.get('hhRmSel="kitchen"'); const lq=q.hhRoomsPageHTML();
  ok("preview on but house.js still loading: today's grid as before + 'Loading…', one fetch", /Loading the plan preview/.test(lq)&&rows(lq)===offRows&&q.loads.length>=1&&q.loads.every(x=>x==="house"));
}

// ── THE ONE RULE: parity ────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n── nothing changes on any kid's, Mom's or Dad's list ──");
const KEYS=["emoji","label","pts","cad","time","from","to","rot","zone","laundry","meal","free","cycW","cycN","cycStart","since","slot"];
const norm=st=>{ const o={}; KEYS.forEach(k=>{ const v=st&&st[k]; if(v!==undefined&&v!==null&&v!=="") o[k]=v; }); return o; };
function snap(c){ const out={}; c.SL_SLOTS.forEach(s=>c.ROSTER.forEach(k=>{ out[s+"/"+k]=(c.rtStepsFor(s,k,true)||[]).map(norm); DAYS.forEach(d=>{ out[s+"/"+k+"/"+d]=(c.rtStepsFor(s,k,false,d)||[]).map(norm); }); }));
  out.mom=c.mcAll(); out.dad=c.dcAll(); out.momData=c.momChoresData; out.dadData=c.dadChoresData; out.jobs=c.hhJobs(); return JSON.stringify(out); }
{
  const a=mk(), base=snap(a);
  const b=mk(); b.hpEngineSet(true);
  ["ava","ben","cal","mom","dad"].forEach(w=>{ b.hpLimitSet(w,"school","5"); b.hpLimitSet(w,"weekend","0"); b.hpFitSet(w,"mixed"); b.hpPick(w); b.hpPersonHTML(); });
  b.get('hhView="rooms"'); ["","kitchen","living","entry"].forEach(r=>{ b.get('hhRmSel="'+r+'"'); b.hhRoomsPageHTML(); });
  ok("switch on preview, every limit and fit edited, every view drawn: the four lists × every day, Mom's, Dad's and the table are identical", snap(b)===base);
  ok("…every write was household/people/<who>/<field> or household/meta/engine", b.writes.length===16&&b.writes.every(w=>/^household\/people\/(ava|ben|cal|mom|dad)\/(school|weekend|fit)$/.test(w[1])||w[1]==="household/meta/engine"), b.writes.map(w=>w[1]));
  const c=mk(); c.hpEngineSet(true); c.hpEngineSet(false); ok("switch on and off again: identical too", snap(c)===base);
  if(process.env.BASE_HTML){ const B=fs.readFileSync(process.env.BASE_HTML,"utf8"); const m=mk({base:B}); console.log("(base: "+process.env.BASE_HTML+")");
    ok("main's Household code on the same data gives the same lists, Mom's, Dad's and table", snap(m)===base);
    const m2=mk({base:B,hd:{people:{ava:{school:5,weekend:0,fit:"mixed"}},meta:{takeover:1,engine:{mode:"preview",on:TODAY}}}});
    ok("…and main given the new nodes (people, meta/engine) ignores them: same lists", JSON.stringify(JSON.parse(snap(m2)).jobs)===JSON.stringify(JSON.parse(base).jobs)&&snap(m2)===base); }
}

// ── nothing outside the Household tab reads the switch or calls into house.js ─────────────────────────────────────────────
console.log("\n── only the Household tab reaches the preview ──");
{
  const P=require("./perf_budget_measure.js"), cm=P.scanJs(RAW).cm;   // comments and strings blanked by the same scanner the perf guard uses
  const L=cm.split("\n");
  const enclosing=i=>{ for(let k=i;k>=0;k--){ const m=/^\s*(?:async\s+)?function\s+([\w$]+)\s*\(/.exec(L[k]); if(m) return m[1]; if(/^(const|let) HA_LAZY_FILES|^function haLazyReady/.test(L[k])) return "LAZYSPLIT"; } return "?"; };
  const hpNames=[...new Set([...(RAW.slice(RAW.indexOf("// HOUSEENG_START"),RAW.indexOf("// HOUSEENG_END"))+"\n"+HJS.slice(HJS.indexOf("// HOUSEPEOPLE_START"),HJS.indexOf("// HOUSEPREVIEW_END"))).matchAll(/^(?:function\s+([\w$]+)|(?:const|let)\s+([\w$]+))/gm)].map(m=>m[1]||m[2]))];
  // ↑ the preview's own blocks (step 3). The Household page code HOUSESLIM moved into house.js has its own door and its own check (test_house_slim.js).
  const glue=["hhEngineMode","hhHouseReady","hhHouseLoadingHTML","hhRoomFuture","hhRoomsTailHTML","hhPersonDoor","hhEngineTap"];
  const allowed=new Set(["renderHousehold","hhRoomGridHTML","hhRoomsPageHTML","_hhRmSq","haLazyReady","LAZYSPLIT","hdOn"].concat(glue));   // hdOn: HOUSEDAY's one door (house step 4) reads the switch through hhEngineMode
  const bad=[]; L.forEach((l,i)=>{ hpNames.concat(glue).forEach(n=>{ if(new RegExp("(^|[^\\w$.])"+n.replace(/\$/g,"\\$")+"\\s*\\(").test(l)&&!new RegExp("function\\s+"+n+"\\s*\\(").test(l)){ const f=enclosing(i); if(!allowed.has(f)) bad.push((i+1)+" "+n+" in "+f); } }); });
  ok("every call to house.js or the preview glue in index.html is in the Household tab's own drawing (renderHousehold, the room grid / page, the glue)", bad.length===0, bad.slice(0,6));
  const eng=[]; RAW.split("\n").forEach((l,i)=>{ if(/meta\.engine|meta&&householdData\.meta\.engine|household\/meta\/engine/.test(l.replace(/\/\/.*$/,""))){ const f=enclosing(i); if(f!=="hhEngineMode"&&f!=="hdOv") eng.push((i+1)+" "+f); } });
  ok("index.html reads household/meta/engine in one place only (hhEngineMode; and HOUSEDAY's hdOv for the switch-on date, house step 4)", eng.length===0, eng);
  ok("renderHousehold is the Household tab's renderer (its banner and subnav are the Household ones)", /mpSubnav\('house'\)/.test(fnOf(RAW)("renderHousehold")));
  ok("haLazyLoad(\"house\") is asked only by the glue (hhHouseReady, hhEngineTap) and HOUSESLIM's page door (hhSlimReady)", [...RAW.matchAll(/haLazyLoad\("house"\)/g)].length===3&&/haLazyLoad\("house"\)/.test(fnOf(RAW)("hhSlimReady"))&&/haLazyLoad\("house"\)/.test(fnOf(RAW)("hhHouseReady"))&&/haLazyLoad\("house"\)/.test(fnOf(RAW)("hhEngineTap")));
  ok("the kids' lists, the Mom loop, check-offs and the cleaning-day plan don't mention any of it", ["rtStepsFor","hhDeriveKids","hhDerivePerson","hhSyncKids","rtCfgSave","hhPlanBuild","hhPlanCheck","hhMaterialize","momSchedHouse","hhHouseCardHTML"].every(f=>!/hhEngine|hhPeople|hhHouse(Ready|Loading)|hhRoomFuture|hpPeople|HouseEng|house\.js/.test(fnOf(RAW)(f))));
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
