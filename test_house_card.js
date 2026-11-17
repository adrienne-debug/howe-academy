/*
 * HH_CARD — Household by room, step 2 (DESIGN_household_rooms_2026-11-15 §3.3 / §3.2 / §9): the chore card (one editor for a chore),
 * the room's ⚙ Rules table and 🔍 Checks. Every control on the card must call the setter its old control calls, so this test runs
 * the OLD control's handler (from the old ✎ Edit panel, the Review / Room / Levels pickers, the Week ⏱, the Kitchen row, Give to…,
 * the old + Add form, and the Chores & Stars cadence panel / Lists row) and the CARD's handler (pulled out of the card's HTML) on two
 * copies of the same made-up family, and compares the writes (path and value), the table and the derived lists.
 * Made-up family only (Ava, Ben, Cal; Mom, Dad).
 *   run: node test_house_card.js
 *   BASE_HTML=/path/to/main/index.html node test_house_card.js → "card never opened" compares against that file instead of this
 *   file with the step undone by hand.
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const fnOf=s=>name=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cutOf=s=>(a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a+" / "+b); return s.slice(i,j); };
const fn=fnOf(src), cut=cutOf(src);
const lineOf=(s,start)=>{ const i=s.indexOf(start); if(i<0) throw new Error("missing "+start); return s.slice(i,s.indexOf("\n",i)); };
const HH=cut("// HOUSEHOLD_START","// HH_CARD_END"), KT=cut("// KITCHEN_TAB_START","// KITCHEN_TAB_END");
// The code before this step: BASE_HTML's Household + Kitchen, else this file with the card block taken out and the re-points put back.
let OLD;
if(process.env.BASE_HTML){ const b=fs.readFileSync(process.env.BASE_HTML,"utf8"), bc=cutOf(b); OLD=bc("// HOUSEHOLD_START","// HH_ROOMPAGE_END")+"\n"+bc("// KITCHEN_TAB_START","// KITCHEN_TAB_END"); console.log("(base: "+process.env.BASE_HTML+")"); }
else { const a=HH.indexOf("// HH_CARD_START"); let o=HH.slice(0,a); const R=[["_hhBtn(\"hcAdd()\",'+ Add a chore'","_hhBtn(\"hhAddToggle()\",'+ Add a chore'"],
    ["_hhBtn(\"hcOpen('\"+id+\"')\",'✎ Edit',typeof hcId!==\"undefined\"&&hcId===id,'#2B7A78'); }   // HH_CARD: ✎ Edit opens the chore card","_hhBtn(\"hhEditToggle('\"+id+\"')\",'✎ Edit',hhEditId===id,'#2B7A78'); }"],
    ["(mom?' onclick=\"hcOpen(\\''+id+'\\')\"':'')","(mom?' onclick=\"hhEditToggle(\\''+id+'\\')\"':'')"],
    ["  el.innerHTML=h+(typeof hcCardHTML===\"function\"?hcCardHTML():\"\");   // HH_CARD: the chore card, only while open\n  if(typeof hcKeep===\"function\") hcKeep(el);\n","  el.innerHTML=h;\n"],
    ["  if(mom&&typeof hcRoomToolsHTML===\"function\") h+=hcRoomToolsHTML(hhRmSel,ids);   // HH_CARD: 🔍 Checks · ⚙ Rules\n",""]];
  R.forEach(r=>{ const n=o.split(r[0]).length-1; if(!n) throw new Error("undo: not found "+r[0].slice(0,60)); o=o.split(r[0]).join(r[1]); }); OLD=o+"\n"+KT; }
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
// the Lists row's meal button is drawn inline in the Chores & Stars table, so the old handler is checked against its source text
if(src.indexOf("onclick=\"cpSetMeal('+i+',\\''+(on?'':m)+'\\')\"")<0) throw new Error("the Lists row meal button moved");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop")+"\n"+fn("rtApplyRot");
const CS=["rtCfgEnsure","rtCfgSave","rtCfgSet","rtCadSet","rtCadWeekday","rtCadTime","rtCadWindow","rtCadCycle","rtCadCycleStart","rtCadClearWindow","cadMode","_cpCadPanelHTML","cpSetMeal","cpSetLaundry","cpLaundryBtnHTML","cpLaundryMoveHTML","_lkmSelectHTML","laundryLooseWord","laundryStarts","laundryStartGuess","mealCfg","mcAll","dcAll","stepCycleOk","rtStepsFor","toMin","to12h","ampmTo24"].map(fn).join("\n")
  +"\n"+lineOf(src,"const MEAL_SLOT=")+"\n"+lineOf(src,"const MEAL_EMOJI=")+"\n"+lineOf(src,"const LAUNDRY_KIDMOVE_FROM=")+"\n"+lineOf(src,"const LAUNDRY_KIDMOVE_OPTS=");
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"], DAYS=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const TODAY=isoD(new Date()), T=dayNum(TODAY), MON=T-((new Date(TODAY+"T12:00:00Z").getUTCDay()+6)%7);
const atOf=s=>new Date(s+"T12:00:00").getTime();

// ── the made-up family under Take over: the lists come from this table ──
const K=(o)=>Object.assign({src:{kind:"new"},status:"active",area:"cleaning"},o);
const JOBS=()=>({
  k_counter:K({label:"Wipe the counters",emoji:"🧽",who:"ava",slot:"chores",cad:"daily",room:"kitchen",minutes:5,pts:10,order:0,can:["ava","ben"]}),
  k_towels:K({label:"Wash the towels",emoji:"🧺",who:"ava",slot:"chores",cad:"daily",room:"bathdown",laundry:true,order:1}),
  k_grout:K({label:"Scrub the grout",who:"ava",slot:"chores",cad:"daily",room:"kitchen",level:3,order:2}),
  k_old:K({label:"Old job",who:"ava",slot:"chores",cad:"daily",room:"kitchen",status:"retired",verdict:"retire",order:3}),
  k_mop:K({label:"Mop the floor",who:"ben",slot:"chores",cad:"wk:1,4",room:"kitchen",minutes:15,pts:20,cycW:1,cycN:4,cycStart:isoOf(MON-7),order:0}),
  k_sweep2:K({label:"Sweep kitchen floor again",who:"ben",slot:"chores",cad:"wk:3",room:"kitchen",order:1}),
  o_shelf:K({label:"Fix the shelf",who:"ben",slot:"chores",cad:"once",hold:true,room:"school",order:2}),
  k_lunch:K({label:"Wipe the lunch table",who:"cal",slot:"afternoon",cad:"daily",room:"kitchen",meal:"lunch",since:isoOf(T-3),order:0}),
  k_sweep:K({label:"Sweep the kitchen floor",who:"cal",slot:"chores",cad:"wk:2",order:0}),          // no stored room → the guess
  k_shake:K({label:"Shake the mats",who:"cal",slot:"chores",cad:"3d",room:"entry",order:1,time:"6 PM",to:isoOf(T+30)}),
  e_tub:K({label:"Scrub the tub",who:"cal",slot:"chores",cad:"wk:6",room:"bathup",order:2,can:["cal","mom"]}),
  r_ava:K({label:"Pickup the den",who:"ava",slot:"afternoon",cad:"daily",rot:"pick",area:"pickup",room:"living",order:0}),
  r_ben:K({label:"Pickup the porch",who:"ben",slot:"afternoon",cad:"daily",rot:"pick",area:"pickup",room:"entry",order:0}),
  k_oven:K({label:"Clean the oven",who:"mom",slot:"",cad:"28d",room:"kitchen",src:{kind:"momChore",id:"oven"},order:0}),
  k_fridge:K({label:"Pull out the fridge",who:"dad",slot:"",cad:"42d",room:"kitchen",src:{kind:"dadChore",id:"fridge"},order:0}),
  g_shelves:K({label:"Dust the shelves",who:"grab",cad:"daily",pts:20,room:"living",src:{kind:"grab",i:0},order:0})
});
function LOG(){ const L={ava:{},ben:{},cal:{}}; const put=(kid,s,id,e)=>{ const sun=dayNum(s)-new Date(s+"T12:00:00Z").getUTCDay(), w="w"+sun, d=DN[new Date(s+"T12:00:00Z").getUTCDay()]; L[kid][w]=L[kid][w]||{}; L[kid][w][d]=L[kid][w][d]||{}; L[kid][w][d][id]=Object.assign({ts:"",at:atOf(s),act:"on"},e); };
  for(let n=T-20;n<T;n++){ if(n!==T-2&&n!==T-3) put("ava",isoOf(n),"a"+n,{label:"Wipe the counters",slot:"chores"}); }
  put("ava",isoOf(T-1),"t1",{label:"Wipe the counters",slot:"chores",act:"miss"}); return L; }
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[], dom={};
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:o.dry?()=>true:()=>false, isMom:!o.noMom, momHere:()=>ctx.isMom, confirm:()=>true, rulesData:{}, calendarData:{holidays:{},vacations:{},cleaningDays:{[isoOf(T+3)]:{on:true}}},
    ROSTER:["ava","ben","cal"], SL_KIDS:["ava","ben","cal"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"}, FIRST_KID:"ava",
    KID_NAME:{ava:"Ava",ben:"Ben",cal:"Cal"}, KID_COLOR:{ava:"#aa1111",ben:"#11aa11",cal:"#1111aa"}, MC_DEFAULT:{}, HA_IS_HOWE:false, MC_SLOTS:{morning:{nm:"Morning"},afternoon:{nm:"Afternoon"},night:{nm:"Night"}},
    routineCfg2:{}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[], routineTimes:{}, _rtRotDayNum:()=>T,
    stepWindowOk:()=>true, stepWindowLabel:()=>"", rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[], grabs:[],
    routineLog:LOG(), momdayData:{[isoOf(T-9)]:{chores:{oven:{at:1}}}}, daddayData:{}, momChoresData:{}, dadChoresData:{}, activeWk:()=>"week9", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    routineDateISO:()=>TODAY, cpSlot:"chores", cpKid:"ava", rtCadOpen:null, DAY_DT:{},
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"), mwBanner:s=>"", mpSubnav:v=>"", mwToast:t=>toasts.push(t), gwShowToast:()=>{}, renderAll:()=>{}, renderMomsPlan:()=>{},
    document:{getElementById:id=>dom[id]||null}, writes, toasts, dom};
  vm.createContext(ctx);
  vm.runInContext(CAD+"\n"+ROT+"\n"+CS+"\n"+(o.old?OLD:HH+"\n"+KT), ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  ctx.run=(code,val)=>{ ctx.__el={value:val}; return vm.runInContext("(function(){ "+code+" }).call(__el)",ctx); };
  const hd={jobs:JOBS(),meta:{takeover:o.noTakeover?0:1}}; if(o.levels) hd.levels=o.levels;
  ctx.householdOnValue(hd); ctx.writes.length=0; return ctx;
}
// the derived lists: every slot × kid, raw and on every weekday, field for field; Mom's and Dad's; the table
const KEYS=["emoji","label","pts","cad","time","from","to","rot","zone","laundry","meal","free","cycW","cycN","cycStart","since"];
const norm=st=>{ const o={}; KEYS.forEach(k=>{ const v=st&&st[k]; if(v!==undefined&&v!==null&&v!=="") o[k]=v; }); return o; };
function snap(c){ const out={}; c.SL_SLOTS.forEach(s=>c.ROSTER.forEach(k=>{ out[s+"/"+k]=(c.rtStepsFor(s,k,true)||[]).map(norm); DAYS.forEach(d=>{ out[s+"/"+k+"/"+d]=(c.rtStepsFor(s,k,false,d)||[]).map(x=>x&&x.label); }); }));
  out.mom=JSON.parse(JSON.stringify(c.mcAll())); out.dad=JSON.parse(JSON.stringify(c.dcAll())); out.jobs=JSON.parse(JSON.stringify(c.hhJobs())); return JSON.stringify(out); }
// every on…="…" handler in a piece of HTML
const handlers=h=>{ const out=[], re=/ on(click|change)="([^"]*)"/g; let m; while((m=re.exec(h))) out.push(m[2].replace(/&quot;/g,'"').replace(/&amp;/g,"&")); return out; };
const pick=(h,want)=>handlers(h).find(x=>typeof want==="string"?x===want:want.test(x));
const card=(c,id)=>{ c.hcOpen(id); return c.hcCardHTML(); };
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// ── 1. Every field: the card's control and the old control → identical write, table and derived lists ──
console.log("1. Every inventory row: the card's control writes what the old control writes");
const INV=[];   // [name, id, old: c=>handler code, card: regex|string for the card's handler, value for this.value, prep]
const editPanel=(c,id)=>{ c.get('hhEditId="'+id+'"'); return c.hhEditHTML(id); };
const ed=(id,code)=>c=>pick(editPanel(c,id),code);
const cad=(id)=>c=>{ const j=c.hhJobs()[id], i=c.rtStepsFor(j.slot,j.who,true).findIndex(s=>s._hh===id); return c._cpCadPanelHTML(j.slot,j.who,i,c.rtStepsFor(j.slot,j.who,true)[i]); };
[["name (✎ Edit words)","k_counter",ed("k_counter","hhEditField('k_counter','label',this)"),"hhEditField('k_counter','label',this)","Wipe all the counters"],
 ["emoji (✎ Edit box)","k_counter",ed("k_counter","hhEditField('k_counter','emoji',this)"),"hhEditField('k_counter','emoji',this)","🧴"],
 ["emoji (✎ Edit tap row)","k_counter",ed("k_counter","hhEditSet('k_counter','emoji','🧹')"),"hhEditSet('k_counter','emoji','🧹')"],
 ["stars (✎ Edit)","k_counter",ed("k_counter","hhEditField('k_counter','pts',this)"),"hhEditField('k_counter','pts',this)","15"],
 ["stars on an Up for Grabs row","g_shelves",ed("g_shelves","hhEditField('g_shelves','pts',this)"),"hhEditField('g_shelves','pts',this)","30"],
 ["room (✎ Edit chips)","k_counter",ed("k_counter","hhEditSet('k_counter','room','school')"),"hhEditSet('k_counter','room','school')"],
 ["room (🚪 Room view picker)","k_counter",c=>{ c.get('hhPick="k_counter|room"'); return pick(c.hhPickHTML("k_counter","room"),"hhPickSet('k_counter','room','school')"); },"hhEditSet('k_counter','room','school')"],
 ["room (🍳 → Kitchen pull-in)","k_shake",c=>"hhSet('k_shake','room','kitchen')","hhEditSet('k_shake','room','kitchen')"],
 ["area (✎ Edit)","k_counter",ed("k_counter","hhEditSet('k_counter','area','pickup')"),"hhEditSet('k_counter','area','pickup')"],
 ["area (📋 Review picker)","k_counter",c=>{ c.get('hhPick="k_counter|area"'); return pick(c.hhPickHTML("k_counter","area"),"hhPickSet('k_counter','area','pickup')"); },"hhEditSet('k_counter','area','pickup')"],
 ["level (✎ Edit)","k_counter",ed("k_counter","hhEditSet('k_counter','level',2)"),"hhEditSet('k_counter','level',2)"],
 ["level (🪜 Levels picker)","k_counter",c=>{ c.get('hhPick="k_counter|level"'); return pick(c.hhPickHTML("k_counter","level"),"hhPickSet('k_counter','level',2)"); },"hhEditSet('k_counter','level',2)"],
 ...["wk","nd","2w","28d","42d","asneeded","once","daily"].map(m=>["how often → "+m+" (✎ Edit Days)",m==="daily"?"k_mop":"k_counter",ed(m==="daily"?"k_mop":"k_counter","hhEditCadMode_set('"+(m==="daily"?"k_mop":"k_counter")+"','"+m+"')"),"hhEditCadMode_set('"+(m==="daily"?"k_mop":"k_counter")+"','"+m+"')"]),
 ["on these days: a day on (✎ Edit)","k_mop",ed("k_mop","hhEditDay('k_mop',2)"),"hhEditDay('k_mop',2)"],
 ["on these days: a day off (✎ Edit)","k_mop",ed("k_mop","hhEditDay('k_mop',4)"),"hhEditDay('k_mop',4)"],
 ["every N days: the number (✎ Edit)","k_shake",ed("k_shake","hhEditSet('k_shake','cad',this.value+'d')"),"hhEditSet('k_shake','cad',this.value+'d')","5"],
 ["week of 4 (🔁 cadence panel)","k_counter",c=>pick(cad("k_counter")(c),"rtCadCycle('chores','ava',0,2)"),"hcList('k_counter','cycW',2)"],
 ["week of 4 off (🔁 cadence panel)","k_mop",c=>pick(cad("k_mop")(c),"rtCadCycle('chores','ben',0,0)"),"hcList('k_mop','cycW',0)"],
 ["week 1 starts (🔁 cadence panel)","k_mop",c=>pick(cad("k_mop")(c),"rtCadCycleStart('chores','ben',0,this.value)"),"hcList('k_mop','cycStart',this.value)",isoOf(MON)],
 ["start date (✎ Edit)","k_counter",ed("k_counter","hhEditField('k_counter','from',this)"),"hhEditField('k_counter','from',this)",isoOf(T+2)],
 ["end date (🔁 cadence panel)","k_shake",c=>pick(cad("k_shake")(c),"rtCadWindow('chores','cal',1,'to',this.value)"),"hcList('k_shake','to',this.value)",isoOf(T+60)],
 ["end date cleared (🔁 cadence panel)","k_shake",c=>pick(cad("k_shake")(c),"rtCadWindow('chores','cal',1,'to',this.value)"),"hcList('k_shake','to',this.value)",""],
 ["time of day, a kid (✎ Edit)","k_counter",ed("k_counter","hhEditSet('k_counter','slot','evening')"),"hhEditSet('k_counter','slot','evening')"],
 ["time of day, Mom (✎ Edit)","k_oven",ed("k_oven","hhEditSet('k_oven','slot','night')"),"hhEditSet('k_oven','slot','night')"],
 ["clock time (🔁 cadence panel)","k_shake",c=>pick(cad("k_shake")(c),"rtCadTime('chores','cal',1,this.value)"),"hcList('k_shake','time',this.value)","7 AM"],
 ["after a meal, on (Lists row)","r_ava",c=>{ c.cpSlot="afternoon"; c.cpKid="ava"; return "cpSetMeal(0,'lunch')"; },"hcList('r_ava','meal','lunch')"],
 ["after a meal, off (Lists row)","k_lunch",c=>{ c.cpSlot="afternoon"; c.cpKid="cal"; return "cpSetMeal(0,'')"; },"hcList('k_lunch','meal','')"],
 ["🧺 tag off (Lists row)","k_towels",c=>{ c.cpSlot="chores"; c.cpKid="ava"; return pick(c.cpLaundryBtnHTML(c.rtStepsFor("chores","ava",true)[1],1),"cpSetLaundry(1,false)"); },"hcList('k_towels','laundry',false)"],
 ["🧺 move a load (Lists row)","k_towels",c=>{ c.cpSlot="chores"; c.cpKid="ava"; return pick(c.cpLaundryMoveHTML(c.rtStepsFor("chores","ava",true)[1],1),"cpSetLaundry(1,this.value)"); },"hcList('k_towels','laundry',this.value)","fold"],
 ["who else can (✎ Edit)","k_counter",ed("k_counter","hhCanToggle('k_counter','cal')"),"hhCanToggle('k_counter','cal')"],
 ["who else can, a grown-up (👥 Review picker)","k_counter",c=>{ c.get('hhPick="k_counter|can"'); return pick(c.hhPickHTML("k_counter","can"),"hhCanToggle('k_counter','mom')"); },"hhCanToggle('k_counter','mom')"],
 ["who else can, off (✎ Edit)","k_counter",ed("k_counter","hhCanToggle('k_counter','ben')"),"hhCanToggle('k_counter','ben')"],
 ["minutes (✎ Edit)","k_counter",ed("k_counter","hhEditField('k_counter','minutes',this)"),"hhEditField('k_counter','minutes',this)","12"],
 ["minutes (📆 Week ⏱ 5 → 10)","k_counter",c=>"hhMinutesCycle('k_counter')","hhEditField('k_counter','minutes',this)","10"],
 ["note (📋 Review)","k_counter",c=>pick(c.hhRowHTML("k_counter",c.hhJobs().k_counter),"hhNote('k_counter',this)"),"hhNote('k_counter',this)","Ben on Fridays"],
 ["Retire (✎ Edit)","k_counter",ed("k_counter","hhSet('k_counter','verdict','retire')"),"hhSet('k_counter','verdict','retire')"],
 ["Bring back (✎ Edit)","k_old",ed("k_old","hhSet('k_old','verdict','keep')"),"hhSet('k_old','verdict','keep')"],
 ["Delete for good (📋 Review)","k_old",c=>pick(c.hhRowHTML("k_old",c.hhJobs().k_old),"hhDeleteForGood('k_old')"),"hhDeleteForGood('k_old')"],
 ["Send to the next cleaning day (🍳 Kitchen row)","k_counter",c=>pick(c.ktRowHTML("k_counter",c.hhJobs().k_counter),"ktCleanToggle('k_counter')"),"ktCleanToggle('k_counter')"]
].forEach(r=>INV.push(r));
const cardHandlers=[];
INV.forEach(([name,id,old,want,val])=>{
  const A=mk(), B=mk(), oldCode=old(A); if(!oldCode){ ok(name+": the old control exists", false); return; }
  const H=card(B,id), code=pick(H,want);
  ok(name+": on the card", !!code, want);
  if(!code) return; cardHandlers.push([name,id,code,val]);
  B.writes.length=0; A.run(oldCode,val); B.run(code,val);
  ok(name+": same writes, same table, same lists ("+A.writes.length+" write"+(A.writes.length===1?"":"s")+")", A.writes.length>0&&same(A.writes,B.writes)&&snap(A)===snap(B), {old:A.writes,card:B.writes});
});
// a row can't be both: the list-only fields stay on Chores & Stars before Take over, and say so; they never write the table there
{ const c=mk({noTakeover:true}), H=card(c,"k_shake");
  ok("before Take over: end date / clock time / meal / week of 4 shown, not editable, with the reason", !/hcList\(/.test(H)&&/6 PM/.test(H)&&/Chores &amp; Stars ▸ Lists until Take over/.test(H));
  ok("…and hcList refuses there", c.hcList("k_shake","time","8 AM")===null&&c.writes.length===0); }
{ const c=mk(), H=card(c,"k_grout");
  ok("a row above its level is not on a list: list-only fields read-only, with the reason", !/hcList\(/.test(H)&&/change while the chore is on Ava’s list/.test(H)); }

console.log("2. Give to… from the card = Give to… from a row");
{ const A=mk(), B=mk(); A.hhGiveToggle("k_counter"); const oc=pick(A.hhGiveHTML("k_counter"),"hhGiveTo('k_counter','cal')");
  const H=card(B,"k_counter"), t=pick(H,"hhGiveToggle('k_counter')"); ok("Give to… on the card", !!t); B.run(t); const H2=B.hcCardHTML(), cc=pick(H2,"hhGiveTo('k_counter','cal')");
  ok("its people open on the card", !!cc); B.writes.length=0; A.writes.length=0; A.run(oc); B.run(cc);
  ok("same multi-path update, same table, same lists", A.writes.length===1&&same(A.writes,B.writes)&&snap(A)===snap(B), [A.writes,B.writes]);
  ok("the card stays open on the chore, now Cal's", B.get("hcId")==="k_counter"&&/>Cal</.test(B.hcCardHTML())); }

console.log("3. ＋ Add a chore = an empty card that writes what the old Add form writes");
const normAdd=w=>JSON.parse(JSON.stringify(w).replace(/hh[a-z0-9]{8,}/g,"NEW").replace(/"ts":\d+/g,'"ts":0'));
[["a kid's chore, several days, a room, a level, an area, who else",[["who","ben"],["can","cal"],["can","mom"],["emoji","🧹"],["mode","days"],["day",2],["day",4],["room","school"],["level",2],["area","pickup"],["slot","evening"]],{label:"Sweep the steps",pts:"12"}],
 ["Mom's every-4-weeks chore",[["who","mom"],["mode","28d"],["room","kitchen"],["slot","night"]],{label:"Descale the kettle"}],
 ["a one-time job into the pile",[["who","cal"],["kind","once"],["room","entry"]],{label:"Hang the hooks",pts:"5"}],
 ["a project",[["who","dad"],["kind","project"],["room","bathup"]],{label:"Regrout the tub"}]].forEach(([name,steps,typed])=>{
  const A=mk(), B=mk(); A.hhAddToggle();
  const oldH={who:v=>"hhAddSet('who','"+v+"')",can:v=>"hhAddCan('"+v+"')",emoji:v=>"hhAddSet('emoji','"+v+"')",mode:v=>"hhAddCadMode('"+v+"')",day:v=>"hhAddDay("+v+")",room:v=>"hhAddSet('room','"+v+"')",level:v=>"hhAddSet('level',"+v+")",area:v=>"hhAddSet('area','"+v+"')",slot:v=>"hhAddSet('slot','"+v+"')",kind:v=>"hhAddSet('kind','"+v+"')"};
  const t=pick((()=>{ const el={}; B.renderHousehold(el); return el.innerHTML; })(),"hcAdd()"); B.run(t);
  let all=true;
  steps.forEach(([k,v])=>{ const want=oldH[k](v); const o=pick(A.hhAddHTML(),want), n=pick(B.hcCardHTML(),k==="mode"&&B.get("hhAdd.kind")!=="chore"?"hhAddSet('kind','chore');"+want:want); if(!o||!n){ all=false; console.log("     missing "+k+" "+v+" old:"+!!o+" card:"+!!n); return; } A.run(o); B.run(n); });
  ok(name+": every pick of the old form is on the empty card", all);
  [A,B].forEach(c=>{ c.dom["hh-add-label"]={value:typed.label}; if(typed.pts!==undefined) c.dom["hh-add-pts"]={value:typed.pts}; });
  const so=pick(A.hhAddHTML(),"hhAddSave()"), sn=pick(B.hcCardHTML(),"hcAddSave()"); A.writes.length=0; B.writes.length=0; A.run(so); B.run(sn);
  ok(name+": the same one row, one targeted set", A.writes.length===1&&A.writes[0][0]==="set"&&/^household\/jobs\/hh/.test(A.writes[0][1])&&same(normAdd(A.writes),normAdd(B.writes))&&snap(A).replace(/hh[a-z0-9]{8,}/g,"NEW").replace(/"ts":\d+/g,"")===snap(B).replace(/hh[a-z0-9]{8,}/g,"NEW").replace(/"ts":\d+/g,""), [A.writes,B.writes]);
  ok(name+": the card closes after Save", B.get("hcId")===""&&B.hcCardHTML()===""); });
{ const c=mk(); c.hcAdd("school"); ok("＋ from a room's Check sets the draft's room only (no write)", c.get("hhAdd.room")==="school"&&c.writes.length===0&&/hhAddSet\('room','school'\)/.test(c.hcCardHTML())); }

console.log("4. Nothing is written under dry run or when Mom is not here");
cardHandlers.forEach(([name,id,code,val])=>{
  const d=mk({dry:true}); d.hcOpen(id); d.run(code,val); const n=mk({noMom:true}); n.run(code,val);
  ok(name+": dry run writes nothing; not Mom writes nothing and changes nothing", d.writes.length===0&&n.writes.length===0&&snap(n)===snap(mk({noMom:true})), [d.writes,n.writes]); });
{ const n=mk({noMom:true}); n.hcOpen("k_counter"); n.hcAdd(); ok("not Mom: the card does not open", n.get("hcId")===""&&n.hcCardHTML()===""&&n.hhEditBtn("k_counter")==="");
  n.get('hcId="k_counter"'); ok("…and draws nothing even if its id were set", n.hcCardHTML()==="");
  n.get('hhView="rooms";hhRmSel="kitchen";'); const el={}; n.renderHousehold(el); ok("not Mom: no ⚙ Rules, no 🔍 Checks, no tap-to-open on the room page", !/⚙ Rules|🔍 Checks|hcOpen\(/.test(el.innerHTML)); }

console.log("5. ⚙ Rules: one pill per setting, each the card's own control and setter");
{ const c=mk(), ids=c.hhRoomChores().kitchen, R=c.hcRulesHTML("kitchen",ids);
  ok("one row per chore in the room", ids.length>3&&ids.every(id=>R.indexOf("hcOpen('"+id+"')")>0));
  const P=[["how often","k_counter","hhEditCadMode_set('k_counter',this.value)","2w","hhEditCadMode_set('k_counter','2w')"],
    ["a day initial","k_mop","hhEditDay('k_mop',2)",null,"hhEditDay('k_mop',2)"],
    ["minutes","k_counter","hhEditSet('k_counter','minutes',this.value)","10","hhEditField('k_counter','minutes',this)","10"],
    ["who can (an initial)","k_counter","hhCanToggle('k_counter','cal')",null,"hhCanToggle('k_counter','cal')"],
    ["who can (a grown-up)","k_mop","hhCanToggle('k_mop','dad')",null,"hhCanToggle('k_mop','dad')"],
    ["time of day (Mom's row)","k_oven","hhEditSet('k_oven','slot',this.value)","morning","hhEditSet('k_oven','slot','morning')"],
    ["time of day (a kid's row)","k_counter","hhEditSet('k_counter','slot',this.value)","evening","hhEditSet('k_counter','slot','evening')"],
    ["level","k_counter","hhEditSet('k_counter','level',this.value)","3","hhEditSet('k_counter','level',3)"],
    ["room","k_counter","hhEditSet('k_counter','room',this.value)","living","hhEditSet('k_counter','room','living')"]];
  P.forEach(([name,id,pill,val,cardWant,cardVal])=>{ const A=mk(), B=mk(), Rh=A.hcRulesHTML("kitchen",A.hhRoomChores().kitchen), pc=pick(Rh,pill), cc=pick(card(B,id),cardWant);
    ok("pill: "+name+" — in the table and on the card", !!pc&&!!cc, [!!pc,!!cc]); if(!pc||!cc) return; B.writes.length=0; A.run(pc,val); B.run(cc,cardVal);
    const keys=A.writes.length===1?(A.writes[0][0]==="set"?[A.writes[0][1]]:Object.keys(A.writes[0][2])):[];
    ok("pill: "+name+" — one targeted write under this chore, equal to the card's", A.writes.length===1&&keys.length>=1&&keys.every(k=>k.indexOf("household/jobs/"+id+"/")===0)&&same(A.writes,B.writes)&&snap(A)===snap(B), [A.writes,B.writes]); });
  ok("time of day, a kid's row: slot + its new place at the end of that list (one update, as ✎ Edit writes)", (()=>{ const A=mk(); A.run(pick(A.hcRulesHTML("kitchen",A.hhRoomChores().kitchen),"hhEditSet('k_counter','slot',this.value)"),"evening"); return A.writes.length===1&&same(Object.keys(A.writes[0][2]).sort(),["household/jobs/k_counter/order","household/jobs/k_counter/slot"]); })());
  ok("initials: one per person, two letters where two share a first letter", c.hcIni("ava")==="A"&&c.hcIni("mom")==="M"&&c.hcIni("dad")==="D"&&(()=>{ const x=mk(); x.KID_NAME.ben="Mia"; return x.hcIni("ben")==="Mi"&&x.hcIni("mom")==="Mo"; })());
  ok("no who-can pill on an Up for Grabs row", (()=>{ const x=mk(); return x.hcCtl("g_shelves","can",1)===""&&x.hcCtl("g_shelves","slot",1)===""; })()); }
{ const c=mk(), rows=c.hhRoomChores().kitchen, R=c.hcRulesHTML("kitchen",rows), same1=handlers(R).filter(x=>/^hcCanSame\(/.test(x));
  ok("'same as the row above' on every row but the first", same1.length>=3);
  const h=same1.find(x=>x==="hcCanSame('k_mop','k_counter')")||same1[0], m=/hcCanSame\('([^']+)','([^']+)'\)/.exec(h), id=m[1], above=m[2], want=JSON.parse(JSON.stringify(c.hhCanOf(Object.assign({},c.hhJobs()[id],{can:c.hhCanOf(c.hhJobs()[above])}))));
  const before=JSON.stringify(c.hhJobs()[above]); c.run(h);
  ok("'same as the row above' writes only that chore's can, the row above's people (+ its own owner)", c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="household/jobs/"+id+"/can"&&same(c.writes[0][2],want)&&JSON.stringify(c.hhJobs()[above])===before, [c.writes,want]);
  const d=mk({dry:true}); d.run(h); const n=mk({noMom:true}); n.run(h); ok("…nothing under dry run or without Mom", d.writes.length===0&&n.writes.length===0); }

console.log("6. 🔍 Checks: each fires on a room built for it, quiet otherwise; each line opens the card (one-person: one folded line → ⚙ Rules)");
{ const c=mk(), by=c.hhRoomChores(), kinds=r=>c.hcChecks(r,by[r]||[]).map(x=>x.k);
  const K1=kinds("kitchen"), find=(r,k,id)=>c.hcChecks(r,by[r]).some(x=>x.k===k&&x.id===id);
  const oneIds=r=>(by[r]||[]).filter(id=>{ const j=c.hhJobs()[id]; return j.who!=="grab"&&c.hhCanOf(j).length<2; }), oneOf=r=>c.hcChecks(r,by[r]||[]).filter(x=>x.k==="one");
  ok("only one person can do it: ONE line for the room, no chore on it, opening ⚙ Rules", oneOf("kitchen").length===1&&oneOf("kitchen")[0].id===""&&oneOf("kitchen")[0].rules===1&&oneIds("kitchen").indexOf("k_mop")>=0&&oneIds("kitchen").indexOf("k_counter")<0);
  ok("…its count is that room's one-person chores (Mop counted, the counters and Up for Grabs not)", oneIds("kitchen").length>=1&&oneOf("kitchen")[0].txt===oneIds("kitchen").length+(oneIds("kitchen").length===1?" chore":" chores")+" only one person can do — fill in who-can in ⚙ Rules", oneOf("kitchen")[0].txt);
  ok("…'1 chore' when there is one; no line at all when the count is 0", (()=>{ const ok1=Object.keys(by).find(r=>oneIds(r).length===1), ok0=Object.keys(by).find(r=>r!=="__none"&&(by[r]||[]).length&&oneIds(r).length===0); return !!ok1&&/^1 chore only one person can do/.test(oneOf(ok1)[0].txt)&&!!ok0&&oneOf(ok0).length===0; })());
  ok("…and goes once everyone is filled in", (()=>{ const x=mk(); x.hhRoomChores().kitchen.forEach(id=>{ const j=x.hhJobs()[id]; if(j.who!=="grab") j.can=["ava","ben"]; }); return x.hcChecks("kitchen",x.hhRoomChores().kitchen).every(y=>y.k!=="one"); })());
  ok("no weekly chore owns this room: School (a once-job only) and Living (daily only) — not Kitchen", kinds("school").indexOf("weekly")>=0&&kinds("living").indexOf("weekly")>=0&&K1.indexOf("weekly")<0);
  ok("…never for Not a room", c.hcChecks("any",[]).length===0);
  ok("the same chore twice: the two sweeps, both ways", find("kitchen","twice","k_sweep")&&find("kitchen","twice","k_sweep2")&&kinds("bathup").indexOf("twice")<0);
  ok("no room saved (here by a guess): the sweep with no room, nothing else", find("kitchen","guess","k_sweep")&&c.hcChecks("kitchen",by.kitchen).filter(x=>x.k==="guess").length===1);
  ok("above the level: the grout (Level 3, family on 1) — and quiet once the family is on 3", find("kitchen","level","k_grout")&&mk({levels:{cleaning:{current:3}}}).hcChecks("kitchen",by.kitchen).every(x=>x.k!=="level"));
  ok("a room with nothing to say: no Checks at all, no Checks button", kinds("bathup").length===0&&!/🔍 Checks/.test(c.hcRoomToolsHTML("bathup",by.bathup))&&/⚙ Rules/.test(c.hcRoomToolsHTML("bathup",by.bathup)));
  c.hcFold("kitchen|checks"); const T1=c.hcRoomToolsHTML("kitchen",by.kitchen); const lines=handlers(T1).filter(x=>/^hcOpen\(/.test(x));
  ok("unfolded: a line per other check, each opening that chore's card", lines.length===c.hcChecks("kitchen",by.kitchen).filter(x=>x.id).length&&(c.run(lines[0]),c.get("hcId")===/'([^']+)'/.exec(lines[0])[1]));
  ok("…the Checks count is lines, the one-person line counted once", /🔍 Checks \(\d+\)/.exec(T1)[0]==="🔍 Checks ("+c.hcChecks("kitchen",by.kitchen).length+")");
  const RO=pick(T1,"hcRulesOn('kitchen')"), roBefore=c.hcRoomToolsHTML("kitchen",by.kitchen);
  ok("the one-person line opens this room's ⚙ Rules (and keeps it open on a second tap)", RO==="hcRulesOn('kitchen')"&&!/<table/.test(roBefore)&&(c.run(RO),c.run(RO),/<table/.test(c.hcRoomToolsHTML("kitchen",by.kitchen)))&&/👥 Who can/.test(T1));
  ok("the other checks are as before: one line per chore", ["twice","guess","level"].every(k=>{ const L=c.hcChecks("kitchen",by.kitchen).filter(x=>x.k===k); return L.length&&L.every(x=>x.id&&T1.indexOf("hcOpen('"+x.id+"')")>0); }));
  c.hcFold("school|checks"); ok("'no weekly chore' opens an empty card for this room", pick(c.hcRoomToolsHTML("school",by.school),"hcAdd('school')")==="hcAdd('school')");
  ok("Checks only read", c.writes.length===0); }

console.log("7. The card: every section, history, rotation in words");
{ const c=mk(), H=card(c,"k_counter"), st=c.hhStats(c.hhJobs().k_counter);
  ["1 · Basics","2 · When","3 · Who","4 · How long","5 · History","6 · Actions"].forEach(s=>ok("section "+s, H.indexOf(s)>0));
  ok("History: last done by whom, on time 4 and 8 weeks, late, missed, the note", /Last done \d+\/\d+ by Ava/.test(H)&&H.indexOf("on time 4 wk "+st.done4+"/"+st.due4)>0&&H.indexOf("8 wk "+st.done8+"/"+st.due8)>0&&/late \d+/.test(H)&&/missed 1/.test(H)&&/hhNote\('k_counter',this\)/.test(H));
  const R=card(mk(),"r_ava"); ok("a rotation row: who it takes turns with in words, a button to 🔁 Rotations, no turns built", /🔁 Takes turns with Ben · daily/.test(R)&&/hhGo\('rot'\)/.test(R)&&!/takes turns.*(on|off)/i.test(R.replace(/Takes turns with Ben · daily/,"")));
  const M=card(mk(),"k_oven"); ok("Mom's row: her four times of day, no stars, no kid-list fields", /hhEditSet\('k_oven','slot','night'\)/.test(M)&&!/'pts'/.test(M)&&!/hcList\(/.test(M)&&!/Week of 4/.test(M));
  const G=card(mk(),"g_shelves"); ok("an Up for Grabs row: stars, no who-can, no time of day, no Give to", /'pts'/.test(G)&&!/hhCanToggle/.test(G)&&!/'slot'/.test(G)&&!/hhGiveToggle/.test(G));
  const O=card(mk(),"k_old"); ok("a retired chore: Bring back and Delete for good, no Retire", /hhSet\('k_old','verdict','keep'\)/.test(O)&&/hhDeleteForGood\('k_old'\)/.test(O)&&!/'retire'/.test(O));
  const x=mk(); x.hcOpen("k_counter"); x.hhDeleteForGood("k_counter"); ok("a deleted chore closes its card", x.hcCardHTML()===""&&x.get("hcId")==="");
  ok("opening and closing writes nothing", (()=>{ const y=mk(); y.hcOpen("k_mop"); y.hcCardHTML(); y.hcClose(); return y.writes.length===0&&y.get("hcId")===""; })()); }

console.log("8. Card never opened: every Household view and the 🗺 Rooms page are as before, apart from the re-pointed doors");
{ const views=["rooms","review","habits","week","area","room","levels","rot","kitchen","once","proj","today"];
  const prep='Object.keys(hhJobs()).forEach(function(id){ const j=hhJobs()[id]; ["room|"+hhRoomOf(j),"area|"+(j.area||"cleaning"),"review|"+j.who].forEach(function(k){ hhOpenPerson[k+"|"+j.who]=true; const sl=hhSlotsFor(j.who); hhOpenPerson[k+"|"+j.who+"|"+(sl.indexOf(j.slot||"")>=0?(j.slot||""):sl[0])]=true; }); });hhOpenWho="ava";hhOpenArea="cleaning";hhOpenRoom="kitchen";hhGridSel="ava|'+isoOf(MON+2)+'";';
  const back=h=>h.split("hcOpen(").join("hhEditToggle(").split('_hhBtn("hcAdd()"').join('_hhBtn("hhAddToggle()"').split('onclick="hcAdd()"').join('onclick="hhAddToggle()"');
  [false,true].forEach(noMom=>{
    views.concat(["rooms:kitchen","rooms:kitchen:lanes","rooms:living","rooms:__none"]).forEach(v=>{ const N=mk({noMom}), O=mk({noMom,old:true}); const p=v.split(":");
      [N,O].forEach(c=>{ c.get(prep+'hhView="'+p[0]+'";'+(p[1]?'hhRmSel="'+p[1]+'";':'')+(p[2]?'hhRmLane["kitchen|daily"]=true;hhRmLane["kitchen|weekly"]=true;':'')); });
      const a={}, b={}; N.renderHousehold(a); O.renderHousehold(b); let A=a.innerHTML;
      if(p[0]==="rooms"&&p[1]&&!noMom) A=A.replace(N.hcRoomToolsHTML(p[1],N.hhRoomChores()[p[1]]||[]),"");
      ok((noMom?"not Mom":"Mom")+": "+v+" ("+A.length+" chars)", back(A)===b.innerHTML&&A.length>200, back(A)===b.innerHTML?"":(()=>{ const B=b.innerHTML, X=back(A); let i=0; while(i<X.length&&X[i]===B[i]) i++; return [X.slice(i-80,i+120),B.slice(i-80,i+120)]; })());
      if(noMom) ok("not Mom: "+v+" byte for byte (nothing re-pointed shows)", A===b.innerHTML);
    }); });
  const N=mk(); N.get(prep+'hhView="review";'); const e={}; N.renderHousehold(e);
  ok("the re-pointed doors: ✎ Edit → hcOpen, ＋ Add a chore → hcAdd, and nothing opens the old panel or form", /hcOpen\('k_counter'\)/.test(e.innerHTML)&&/hcAdd\(\)/.test(e.innerHTML)&&!/hhEditToggle|hhAddToggle/.test(e.innerHTML));
  ok("no write from drawing any of it", N.writes.length===0); }

console.log("9. Page weight: the card works only while open");
{ const B=cut("// HH_CARD_START","// HH_CARD_END");
  ok("no listener, no timer, no storage in the block", !/\.on\(|setInterval|setTimeout|addEventListener|HA_LS|localStorage/.test(B));
  ok("no direct db write in the block (every write is an existing setter's)", !/db\.ref|db &&|_hhWrite\(/.test(B));
  ok("no 🔀", src.indexOf("\u{1F500}")<0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
