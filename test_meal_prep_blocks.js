/*
 * 🍳 Meal prep steps work like the laundry block (her ask 2026-10-08): each prep step has "how long" (10 min unless the meal
 * says), it is a REAL block on the Mom-mode schedule at its time — her Mom-required cards lay around it — with a ⏱ countdown
 * and ✓ Done / ⏰ 10 min later / Not now. 🏡 Home Base lists due prep during school (no sound) and after school.
 *                                                    run: node test_meal_prep_blocks.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const line=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END");
const LTIMES=src.slice(src.indexOf("// 🧺 LAUNDRYTIMES (her ask"), src.indexOf("\n}\n",src.indexOf("function laundryTimesEditorHTML("))+3);
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const MP=cut("// MEALPREP_BLOCK_START","// MEALPREP_BLOCK_END");
const KIT=[line("kitPrepMins"),fn("kitWhenMin"),fn("kitWhenLabel"),fn("kitIsoPlus"),fn("kitPlanFor"),fn("kitPrepSteps"),fn("kitDuePrepHTML"),
  fn("kitDuePrep"),fn("kitMarkPrep"),fn("_kitEditMealGo"),fn("_kitStash"),fn("kitAddPrepRow"),fn("kitSaveMeal"),fn("kitEditorHTML")].join("\n");
const H=(h,m)=>h*60+(m||0);
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date()), TOM=iso(new Date(new Date().setDate(new Date().getDate()+1)));

let ID=0;
const card=(who,time,dur,mom,title)=>({id:who+"_"+(ID++),who,day:"thursday",mom:mom||"none",time,dur:dur||20,title:title||(who+" card")});
function mk(o){
  const ls={}, writes=[], renders=[];
  const ctx={console,ROSTER:["lucy","ellis","lincoln"],checked:o.checked||{},momMoves:{},
    getActiveTasks:()=>o.tasks||[], morningComplete:()=>true, bbActive:()=>null, momHere:()=>true, adminPinUnlocked:true,
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1), esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:null, LAUNDRY_STAGES:["washer","dryer","fold"],
    laundryData:{}, KID_NAME:{lucy:"Lucy",ellis:"Ellis",lincoln:"Lincoln"},
    taskCard:t=>'<div class="tc">'+t.title+'</div>', _agLunchRow:()=>null, famIsMomCard:()=>false,
    gwParseDate:s=>{ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }, _todayStr:()=>TODAY,
    kitPlan:o.plan||{}, kitMeals:o.meals||{}, kitPrepDone:o.done||{}, KIT_NB_HOUR:16,
    kitEditId:null, kitEditDraft:null, kitEditPrep:[], kitView:null, kitCap:null,
    kitMealsLSSave:()=>{}, mwToast:()=>{}, mpGoto:()=>{}, kitCaptureHTML:()=>'', kitRecipeExtrasEditorHTML:()=>'',
    alert:m=>{ ctx.alerts.push(m); }, alerts:[],
    inputs:{}, renders, writes, tab:o.tab||"schedule", kid:"mom", day:"thursday"};
  ctx.document={getElementById:id=>id==="content"?{}:(ctx.inputs[id]||null)};
  ctx.renderMomsPlan=()=>{ renders.push("plan"); };
  ctx._mlNowOverride=o.nowMin!=null?o.nowMin:H(10); ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>"thursday"});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+LTIMES+"\n"+MS+"\n"
    +KIT+"\n"+MP+"\n"+fn("momAgendaHtml")+"\n"+fn("laundryAdvance")+"\n"+fn("laundryAdvanceLabel"),ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:["lucy","ellis","lincoln"]})+";",ctx);
  const T={ctx,writes,renders,run:e=>vm.runInContext(e,ctx)};
  T.lay=()=>{ const laid=T.run("mlQueueLay("+JSON.stringify(o.tasks)+")"); T.laid=laid; T.at=id=>laid.find(t=>t.id===id).time; return laid; };
  T.agenda=()=>{ T.lay(); ctx.__d=T.laid.filter(t=>t.mom==="required"||t.mom==="maybe"); return T.run("momAgendaHtml(__d)"); };
  T.now=m=>{ ctx._mlNowOverride=m; };
  ctx.renderAll=()=>{ renders.push("all"); };
  T.dbOn=()=>{ ctx.db={ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})}; };
  return T;
}
// Chili tonight: "Start the Instant Pot" at 10:00 for 15 min, "Chop onions" at 1:00 PM with no minutes (→ 10).
// Tomorrow's pot roast: "Thaw the roast" the night before. Lucy has two Mom cards from 10:00, Ellis one after; Lincoln works alone.
const meals={m1:{name:"Chili",prep:[{when:"10:00",label:"Start the Instant Pot",mins:15},{when:"13:00",label:"Chop onions"}]},
             m2:{name:"Pot roast",prep:[{when:"nb",label:"Thaw the roast",mins:5}]}};
const plan={[TODAY]:{mid:"m1"},[TOM]:{mid:"m2"}};
const m1=card("lucy","10:00 AM",20,"required","Math — Lesson 12"), m2=card("lucy","10:20 AM",20,"required","Spelling"),
      e1=card("ellis","10:40 AM",20,"required","Reading"), own=card("lincoln","10:00 AM",30,"none","Independent Reading");
const TASKS=[m1,m2,e1,own];
const K0="kp_"+TODAY+"_m1_0";

console.log("── how long, in the meal editor ──");
{ const T=mk({tasks:TASKS,meals:{old:{name:"Tacos",prep:[{when:"nb",label:"Thaw the beef"}]}},tab:"moms-plan"}); T.dbOn();
  T.run("_kitEditMealGo('old')");
  ok("an old meal's step opens with 10 min", T.run("kitEditPrep[0].mins")===10);
  const E=T.run("kitEditorHTML()");
  ok("the add-step row has a How long? box, 10 by default", /How long\? <input type="number" id="kit-prep-mins" min="1" max="240" value="10"/.test(E));
  ok("each step in the list shows its minutes", /Thaw the beef <span[^>]*>· 10 min<\/span>/.test(E));
  Object.assign(T.ctx.inputs,{"kit-prep-mode":{value:"t"},"kit-prep-time":{value:"16:30"},"kit-prep-label":{value:"Brown the beef"},"kit-prep-mins":{value:"25"}});
  T.run("kitAddPrepRow()");
  ok("＋ Step keeps her 25 min", T.run("JSON.stringify(kitEditPrep[1])")===JSON.stringify({when:"16:30",label:"Brown the beef",mins:25}));
  Object.assign(T.ctx.inputs,{"kit-prep-label":{value:"Warm tortillas"},"kit-prep-mins":{value:""}});
  T.run("kitAddPrepRow()");
  ok("…a blank box → 10", T.run("kitEditPrep[2].mins")===10);
  T.ctx.inputs["kit-name"]={value:"Tacos"}; T.run("kitSaveMeal()");
  const w=T.writes.find(x=>x[1]==="kitchen/meals/old");
  ok("💾 Save writes each step with its minutes (one targeted meal write)", w&&w[0]==="set"&&JSON.stringify(w[2].prep.map(s=>s.mins))==="[10,25,10]", w&&w[2].prep);
}
{ const T=mk({meals,plan});
  ok("kitPrepSteps carries mins (15 given, 10 when the meal never said)", JSON.stringify(T.run("kitPrepSteps('"+TODAY+"').map(s=>s.mins)"))==="[15,10]");
}

console.log("── a REAL block on the Mom-mode schedule ──");
{ const base=mk({tasks:TASKS}); base.lay();
  ok("baseline (no meal): Lucy 10:00 / 10:20, Ellis 10:40, Lincoln 10:00", base.at(m1.id)==="10:00 AM"&&base.at(m2.id)==="10:20 AM"&&base.at(e1.id)==="10:40 AM"&&base.at(own.id)==="10:00 AM");
  const T=mk({tasks:TASKS,meals,plan}); T.lay();
  ok("her Mom cards step over the 10:00–10:15 Instant Pot: Lucy 10:15 / 10:35, Ellis 10:55", T.at(m1.id)==="10:15 AM"&&T.at(m2.id)==="10:35 AM"&&T.at(e1.id)==="10:55 AM", [T.at(m1.id),T.at(m2.id),T.at(e1.id)]);
  ok("the kids' own work keeps going (Lincoln still 10:00)", T.at(own.id)==="10:00 AM");
  const A=T.agenda();
  ok("🔴 Mom Needed shows the block at 10:00 with its 15 min", /10:00<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🍳 <b>Start the Instant Pot<\/b> <span[^>]*>· Chili<\/span> · 15 min/.test(A), A.slice(0,700));
  ok("⏱ countdown — 15 min left at 10:00", /class="kp-cd" data-s="600" data-e="615"[^>]*>⏱ 15 min left</.test(A));
  ok("✓ Done → kitMarkPrep(today, m1_0)", new RegExp("kitMarkPrep\\('"+TODAY+"','m1_0'\\)[^>]*>✓ Done<").test(A));
  ok("⏰ 10 min later and Not now", new RegExp("kitPrepLater\\('"+K0+"'\\)[^>]*>⏰ 10 min later<").test(A)&&new RegExp("kitPrepNotNow\\('"+K0+"'\\)[^>]*>Not now<").test(A));
  ok("Chop onions sits at 1:00 PM for 10 min", /1:00<span class="ampm">PM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🍳 <b>Chop onions<\/b>[^]*?· 10 min/.test(A));
  ok("tomorrow's night-before step sits at 4:00 PM", /4:00<span class="ampm">PM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🌙 <b>Thaw the roast<\/b> <span[^>]*>· Pot roast \(tomorrow\)<\/span> · 5 min/.test(A));
  T.now(H(9,50)); ok("⏱ before it starts: 'in 10 min'", /⏱ in 10 min</.test(T.agenda()));
  T.now(H(10,20)); ok("⏱ past the end: '5 min over'", /⏱ 5 min over</.test(T.agenda()));
  ok("countdown text helper", T.run("kitPrepCdText(600,615,590)")==="⏱ in 10 min"&&T.run("kitPrepCdText(600,615,604)")==="⏱ 11 min left"&&T.run("kitPrepCdText(600,615,630)")==="⏱ 15 min over");
  ok("only on today's schedule", T.run("momSchedPrep('friday')").length===0);
}
{ const T=mk({tasks:TASKS,meals:{m1:{name:"Chili",prep:[{when:"10:00",label:"Start the Instant Pot"}]}},plan:{[TODAY]:{mid:"m1"}}}); T.lay();
  ok("no minutes on the step → a 10-min block (Lucy 10:10)", T.at(m1.id)==="10:10 AM", T.at(m1.id));
}
console.log("── ⏰ 10 min later ──");
{ const T=mk({tasks:TASKS,meals,plan}); T.dbOn(); T.run("kitPrepLater('"+K0+"')");
  const w=T.writes.find(x=>x[1]==="momBlocks/"+TODAY+"/"+K0);
  ok("one targeted write: momBlocks/<today>/kp_… {kind:prep, at:later, startMin:10:10}", w&&w[0]==="set"&&w[2].kind==="prep"&&w[2].at==="later"&&w[2].startMin===H(10,10), T.writes);
  ok("…repaints the schedule", T.renders.includes("all"));
  T.lay();
  ok("the block moves to 10:10–10:25: Lucy's Math waits until 10:25", T.at(m1.id)==="10:25 AM", T.at(m1.id));
  ok("the agenda row moves to 10:10", /10:10<span class="ampm">AM<\/span><\/div><div class="mom-col"><div class="ml-laundry"[^>]*><span[^>]*>🍳 <b>Start the Instant Pot/.test(T.agenda()));
  T.now(H(10,5)); ok("off 🏡 Home Base until 10:10", !/Start the Instant Pot/.test(T.run("kitDuePrepHTML().html")));
  T.now(H(10,10)); ok("…back on at 10:10", /Start the Instant Pot/.test(T.run("kitDuePrepHTML().html")));
  T.now(H(10,12)); T.run("kitPrepLater('"+K0+"')");
  ok("tapped again at 10:12 → 10:22 (from its new start, later of now)", T.run("momBlocks['"+K0+"'].startMin")===H(10,22));
}
{ const T=mk({tasks:TASKS,meals,plan,nowMin:H(9,30)}); T.run("kitPrepLater('"+K0+"')");
  ok("tapped before it starts → 10 min after its own time (10:10)", T.run("momBlocks['"+K0+"'].startMin")===H(10,10));
}
console.log("── Not now ──");
{ const T=mk({tasks:TASKS,meals,plan}); T.dbOn(); T.run("kitPrepNotNow('"+K0+"')");
  ok("one targeted write: at:skip", T.writes.some(x=>x[1]==="momBlocks/"+TODAY+"/"+K0&&x[2].at==="skip"));
  T.lay(); ok("nothing is held — Lucy back at 10:00", T.at(m1.id)==="10:00 AM");
  const A=T.agenda();
  ok("the step stays on the schedule at 10:00 with ✓ Done only", /⏲ <b>Start the Instant Pot<\/b>[^]*?kitMarkPrep\('[^']+','m1_0'\)[^>]*>✓ Done<\/button><\/div>/.test(A)&&!new RegExp("kitPrepLater\\('"+K0+"'\\)").test(A));
  const HB=T.run("kitDuePrepHTML().html");
  ok("…and on 🏡 Home Base, still listed with ✓ Done, no ⏰ / Not now", /Start the Instant Pot/.test(HB)&&!new RegExp("kitPrepLater\\('"+K0+"'\\)").test(HB));
}
console.log("── ✓ Done ──");
{ const T=mk({tasks:TASKS,meals,plan}); T.dbOn(); T.run("kitMarkPrep('"+TODAY+"','m1_0')");
  ok("kitMarkPrep writes kitchen/prepDone/<iso>/m1_0", T.writes.some(x=>x[0]==="set"&&x[1]==="kitchen/prepDone/"+TODAY+"/m1_0"));
  ok("…and repaints the schedule (not Mom's Day) when tapped there", T.renders.includes("all")&&!T.renders.includes("plan"));
  T.lay(); ok("the block ends — Lucy back at 10:00", T.at(m1.id)==="10:00 AM");
  ok("a ✓ row stays on today's timeline", /✓ 🍳 <b>Start the Instant Pot<\/b>/.test(T.agenda()));
  ok("off 🏡 Home Base", !/Start the Instant Pot/.test(T.run("kitDuePrepHTML().html")));
}
{ const T=mk({tasks:TASKS,meals,plan,tab:"moms-plan"}); T.run("kitMarkPrep('"+TODAY+"','m1_0')");
  ok("✓ Done on Mom's Day still repaints Mom's Day", T.renders.includes("plan")&&!T.renders.includes("all"));
}
console.log("── 🏡 Home Base 🔴 NOW ──");
{ const T=mk({tasks:TASKS,meals,plan,nowMin:H(10,5)}); const P=T.run("kitDuePrepHTML()");
  ok("during school: due prep is listed (1 row)", P.n===1&&/⏲ <b>Start the Instant Pot<\/b>/.test(P.html), P.n);
  ok("…with ⏱, ✓ Done, ⏰ 10 min later, Not now", /⏱ 10 min left/.test(P.html)&&/>✓ Done</.test(P.html)&&/>⏰ 10 min later</.test(P.html)&&/>Not now</.test(P.html));
  T.now(H(9,59)); ok("not before its time", T.run("kitDuePrepHTML()").n===0);
  T.now(H(17)); const P2=T.run("kitDuePrepHTML()");
  ok("after school: both of today's steps + tomorrow's night-before", P2.n===3&&/Chop onions/.test(P2.html)&&/🌙 <b>Thaw the roast/.test(P2.html), P2.n);
  T.now(H(15,59)); ok("night-before waits for 4 PM", !/Thaw the roast/.test(T.run("kitDuePrepHTML().html")));
}
ok("no sound: the prep block never chimes", !/bbChime|Audio|speechSynthesis|vibrate/.test(MP)&&!/bbChime|Audio|speechSynthesis/.test(fn("kitDuePrepHTML")));
console.log("── wiring ──");
ok("Home Base 🔴 NOW renders kitDuePrepHTML", /function renderMomsDay\(el\)\{[\s\S]*?const _dp=kitDuePrepHTML\(\);\s*nowN\+=_dp\.n; h\+=_dp\.html;/.test(src));
ok("the agenda gets the prep rows with the laundry rows", /momSchedLaundry\(day,dayTasks\):\[\]\)\.concat\(\(typeof momSchedPrep==="function"\)\?momSchedPrep\(day\):\[\]\)/.test(src));
ok("the Mom chain steps over the prep blocks", /kitPrepBlocksOpen\(\)\.forEach\(function\(b\)\{ _blkIv\.push\(\[b\.startMin,b\.startMin\+b\.mins\]\);/.test(src));
ok("a step done on another device repaints the Mom-mode schedule", /db\.ref\("kitchen\/prepDone"\)\.on\("value"[\s\S]{0,400}else if\(tab==="schedule"&&kid==="mom"\) renderAll\(\);   \/\/ 🍳 MEALPREP_BLOCK/.test(src));
ok("⏰ / Not now ride the momBlocks listener (repaints the schedule)", /db\.ref\("momBlocks\/"\+mwTodayIso\(\)\)\.on\("value"/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
