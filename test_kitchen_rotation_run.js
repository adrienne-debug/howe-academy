/* 📅 KITROT2 — build a rotation in the app, run it from a start date to a cut-off, queue the next one (her decisions
 *   2026-10-22, final; built 2026-10-23).
 *   · run: week-1 day-1 is the start's weekday (earlier weekdays of week 1 unused); weeks repeat; the cut-off is the
 *     last day written, even mid-cycle; only covered meal kinds, only filled slots — ONE multi-path update under
 *     kitchen/plan, every day stamped kitchen/plan/{iso}/fromRot = {id, wk, dow}
 *   · a day changed by hand is listed in the confirm and kept; replaced only when the run comes back with {choice:"replace"}
 *     (GROSYNC 2026-10-23: the "overwrite those too" tick is gone — in the app the three-choice sheet asks every time; here the
 *     block is not loaded, so kitRotRun falls through to its confirm and the choice is passed by hand)
 *   · a queued rotation (start still ahead) writes nothing; kitRotQueuedFor says what it will put there; on its start
 *     date (Mom's device) its days are written; one running rotation per meal kind — the other is asked to end the day before
 *   · 🗓 This month: a cell edit is that day's targeted calendar write only, never the rotation; the day is then ✎ hand-edited
 *   · the grocery feeders see queued days through the same helper the calendar uses — no feeder code of their own
 *   · a family with no rotations reads byte-identical plan and grocery
 *   run: node test_kitchen_rotation_run.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const J=v=>JSON.stringify(v);
const S=v=>JSON.stringify(v,(k,x)=>(x&&typeof x==="object"&&!Array.isArray(x))?Object.keys(x).sort().reduce((o,kk)=>{ o[kk]=x[kk]; return o; },{}):x);   // key-order-blind
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<i) throw new Error("missing "+a); return src.slice(i,j); };
const ka=src.indexOf("// KITROT2_START"), kb=src.indexOf("// KITROT2_END");
ok("KITROT2 block present once, after the typed editor's block", ka>0&&kb>ka&&src.indexOf("// KITROT2_START",ka+5)<0&&src.indexOf("// KIT_ROT_EDIT_END")<ka);
const block=src.slice(ka,kb);
ok("the block documents the record shapes the next sessions build on", /kitchen\/rotations\/\{id\} = \{name, emoji\?, note\?, weeks/.test(block)&&/types:\["d","b","l","s"\]/.test(block)&&/kitchen\/plan\/\{iso\}\/fromRot\/\{kind\} = \{id, wk, dow\}/.test(block));

const MEALS={m1:{name:"Burgers",emoji:"🍔",ing:"1 lb ground beef\nburger buns"},m2:{name:"Tacos",emoji:"🌮",ing:"corn tortillas\nground beef"},m3:{name:"Roasted Broccoli",emoji:"🥦",ing:"broccoli",tags:["side"]},m4:{name:"Oatmeal",ing:"rolled oats",tags:["kid"]}};
const ROT={name:"Fall",emoji:"🍂",types:["d","b"],weeks:[
  [{d:"Burgers",b:"Oatmeal",l:"PB&J"},{d:"Tacos"},{d:"Pizza night"},{d:"Burgers",sd:"peas · rice"},{},{d:"Tacos"},{d:"Burgers"}],
  [{d:"Tacos"},{d:"Burgers"},{d:"Tacos"},{d:"Soup"},{d:"Burgers"},{},{d:"Tacos"}]]};
// ── a tiny app around the real slices ──
function world(o){
  o=o||{};
  const W={writes:[],toasts:[],confirms:[],pins:0,renders:0,mom:!("mom" in o)||o.mom,dry:!!o.dry,yes:true,prompt:null,els:{},today:o.today||"2026-10-26"};
  const ref=p=>({set:v=>W.writes.push(["set",p,JSON.parse(J(v))]),update:v=>W.writes.push(["update",p,JSON.parse(J(v))]),remove:()=>W.writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,
    db:{ref:ref},HA_LS:{getItem:()=>null,setItem:()=>{}},mwToast:m=>W.toasts.push(m),esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    momHere:()=>W.mom,_dryRun:()=>W.dry,dadAwardOk:()=>false,_kioskD:()=>false,kitPinGate:(then,why)=>{ if(W.mom) then(); else { W.pins++; W.pinWhy=why; } },
    _todayStr:()=>W.today,calToday:()=>W.today,gwParseDate:iso=>new Date(iso+"T12:00:00"),kitWkIso:()=>"2026-11-02",
    renderAll:()=>{ W.renders++; },renderMomsPlan:()=>{ W.renders++; },confirm:m=>{ W.confirms.push(m); return W.yes; },prompt:()=>W.prompt,
    kitPantry:{},panStatus:()=>"fresh",kitStaples:{},kitPrepDone:{},tab:"schedule",ROSTER_DEF:[],momdayData:{},navigator:{},HA_IS_HOWE:false,
    document:{getElementById:id=>W.els[id]||null,querySelectorAll:()=>[],createElement:()=>({}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx);
  const run=e=>vm.runInContext(e,ctx);
  run(src.match(/const KIT_FRAC_GLYPH=\{[^}]+\};/)[0]+fn("kitSlug")+fn("kitQtyParse")+fn("kitIsoPlus"));
  run("var kitMeals="+J(o.meals||MEALS)+"; var kitPlan="+J(o.plan||{})+"; var kitRotations="+J(o.rots||{})+"; var kitPickIso=null, kitRotOpen=null, kitRotSaveOpen=false, kitWkImportOpen=false, kitEditId=null, kitView=null;");
  run(cut("// KITSIDES_START","// KITSIDES_END"));
  run(cut("// GROCERY_LIST_START","// GROCERY_LIST_END")); ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grRepaint=()=>{};
  run([line("const KIT_ROT_DEFAULT="),line("const KIT_SLOTS="),line("const KIT_TAGS="),line("const KIT_ROT_DAYS="),
       fn("kitPlanFor"),fn("kitSidesTxt"),fn("kitPlanSlot"),fn("_calDinnerOf"),fn("kitEatGate"),fn("_kitRefresh"),fn("kitAssign"),
       fn("kitRotAll"),fn("kitRotEnsure"),fn("kitRotMealByName"),fn("kitRotSlotVal"),fn("kitRotSlotName"),fn("kitRotMondayOf"),fn("kitRotPlanFor"),fn("kitRotCapture"),
       fn("kitRotRender"),fn("kitRotToggle"),fn("kitRotSaveToggle"),fn("kitRotApply"),fn("kitRotSave"),fn("kitRotDel"),fn("kitRotationsCardHTML"),
       cut("// KIT_ROT_EDIT_START","// KIT_ROT_EDIT_END"),block].join("\n"));
  run("kitRotSynced.plan=true; kitRotSynced.rots=true;");   // the live snapshots have arrived (the listeners flip these)
  W.run=run; W.ctx=ctx; W.plan=()=>run("kitPlan"); W.rots=()=>run("kitRotations");
  W.planWrites=()=>W.writes.filter(w=>/^kitchen\/plan/.test(w[1])); W.rotWrites=()=>W.writes.filter(w=>/^kitchen\/rotations/.test(w[1]));
  W.setRot=(id,rot)=>run("kitRotations["+J(id)+"]="+J(rot));
  W.el=(id,v)=>{ W.els[id]=v; };
  W.runBtn=(id,from,to,ow)=>{ W.el("kit-rot-from-"+id,{value:from}); W.el("kit-rot-to-"+id,{value:to}); W.el("kit-rot-ow-"+id,{checked:!!ow}); run("kitRotApply("+J(id)+")"); };
  return W;
}

console.log("\n── the grid: week-1 day-1 is the start date's weekday ──");
{ const W=world(); const rot=Object.assign({},ROT,{startDate:"2026-10-28",endDate:"2026-11-10"});   // Wed → Tue, two weeks on
  const at=iso=>W.run("kitRotDayAt("+J(rot)+","+J(iso)+")");
  ok("Wed start → week 1, Wednesday (the earlier weekdays of week 1 are unused)", J([at("2026-10-28").wk,at("2026-10-28").dow])==="[0,2]"&&at("2026-10-26")===null&&at("2026-10-27")===null);
  ok("the next Monday is week 2 day 1", J([at("2026-11-02").wk,at("2026-11-02").dow])==="[1,0]"&&at("2026-11-02").day.d==="Tacos");
  ok("weeks repeat — the Monday after is week 1 again", J([at("2026-11-09").wk,at("2026-11-09").dow])==="[0,0]"&&at("2026-11-09").day.d==="Burgers");
  ok("after the cut-off → nothing", at("2026-11-11")===null);
  const sun=Object.assign({},ROT,{startDate:"2026-11-01",endDate:"2026-11-30"});
  ok("a Sunday start uses only week 1's Sunday, then week 2 begins Monday", J([W.run("kitRotDayAt("+J(sun)+",'2026-11-01')").wk,W.run("kitRotDayAt("+J(sun)+",'2026-11-01')").dow,W.run("kitRotDayAt("+J(sun)+",'2026-11-02')").wk])==="[0,6,1]");
  ok("status is derived: upcoming / running / ended, blank without dates", W.run("[kitRotStatus("+J(rot)+",'2026-10-26'),kitRotStatus("+J(rot)+",'2026-11-01'),kitRotStatus("+J(rot)+",'2026-11-11'),kitRotStatus("+J(ROT)+",'2026-11-01')].join()")==="upcoming,running,ended,");
  ok("a rotation without types covers all four; types narrow it", W.run("kitRotTypes({}).join()+'|'+kitRotTypes("+J(ROT)+").join()+'|'+kitRotTypes({types:['s','x']}).join()")==="d,b,l,s|d,b|s");
}

console.log("\n── the run: mid-week start, cut-off mid-cycle, only covered + filled slots, every day stamped ──");
{ const W=world({today:"2026-10-28"});   // a Wednesday — the start
  const rot=Object.assign({},ROT,{startDate:"2026-10-28",endDate:"2026-11-10"});
  const plan=W.run("kitRotRunPlan("+J(rot)+",'fall',{})");
  const days=Object.keys(plan.up).map(k=>k.split("/")[0]).filter((v,i,a)=>a.indexOf(v)===i);
  ok("first day written is the start (Wed) — nothing on the Monday or Tuesday before it", days[0]==="2026-10-28"&&!days.some(d=>d<"2026-10-28"));
  ok("last day written is the cut-off, mid-cycle — nothing after it", days[days.length-1]==="2026-11-10"&&!days.some(d=>d>"2026-11-10")&&plan.up["2026-11-10/mid"]==="m2");
  ok("a blank rotation day gets nothing, not even a stamp (Fri wk1, Sat wk2)", !days.includes("2026-10-30")&&!days.includes("2026-11-07"));
  ok("a library name links ({mid}), an unknown name is typed ({txt}), the other key cleared", plan.up["2026-10-28/txt"]==="Pizza night"&&plan.up["2026-10-28/mid"]===null&&plan.up["2026-11-02/mid"]==="m2"&&plan.up["2026-11-02/txt"]===null);
  ok("the 🥦 side rides along as a side list; a dinner without one clears the old sides", J(plan.up["2026-10-29/sideList"])===J([{txt:"peas"},{txt:"rice"}])&&plan.up["2026-10-29/sides"]===null&&plan.up["2026-11-02/sideList"]===null);
  ok("a covered breakfast is written; the lunch on the same rotation day is NOT (uncovered kind)", J(plan.up["2026-11-09/b"])===J({mid:"m4"})&&!("2026-11-09/l" in plan.up)&&!Object.keys(plan.up).some(k=>/\/(l|s)$/.test(k)));
  ok("every written day carries a stamp {id, wk, dow} under each kind it filled — and only those", days.every(d=>Object.keys(plan.up).some(k=>k.indexOf(d+"/fromRot/")===0&&plan.up[k].id==="fall"))&&J(plan.up["2026-11-09/fromRot/d"])===J({id:"fall",wk:0,dow:0})&&J(plan.up["2026-11-09/fromRot/b"])===J({id:"fall",wk:0,dow:0})&&!("2026-10-28/fromRot/b" in plan.up)&&!Object.keys(plan.up).some(k=>/\/fromRot$/.test(k)));
  ok("the pure planner touches neither kitPlan nor the database", Object.keys(W.plan()).length===0&&W.writes.length===0);
  ok("no dates → nothing", Object.keys(W.run("kitRotRunPlan("+J(ROT)+",'fall',{}).up")).length===0);
  // ▶ Run through the card's button: dates from the row, confirm, ONE multi-path update + the rotation's dates
  W.setRot("fall",ROT);
  W.runBtn("fall","2026-10-28","2026-11-10");
  const pw=W.planWrites();
  ok("one multi-path update under kitchen/plan (never a whole-node set)", pw.length===1&&pw[0][0]==="update"&&pw[0][1]==="kitchen/plan"&&pw[0][2]["2026-10-28/txt"]==="Pizza night");
  ok("the rotation keeps only its dates (targeted update), nothing else written", J(W.rotWrites().filter(w=>!/_seeded/.test(w[1])).map(w=>[w[0],w[1],Object.keys(w[2]).sort().join()]))===J([["update","kitchen/rotations/fall","endDate,startDate,ts"]])&&W.writes.filter(w=>!/_seeded/.test(w[1])).length===2, W.writes);
  ok("the confirm says what it does", /Run 🍂 Fall from Wed, Oct 28 until Tue, Nov 10\?/.test(W.confirms[0])&&/12 days get its dinners, breakfasts\./.test(W.confirms[0]));
  ok("local plan updated and stamped; the typed day keeps no mid", W.plan()["2026-10-28"].txt==="Pizza night"&&!("mid" in W.plan()["2026-10-28"])&&J(W.plan()["2026-10-29"].fromRot)===J({d:{id:"fall",wk:0,dow:3}}));
  ok("running again with nothing changed → no plan write ('already there')", (W.writes.length=0, W.runBtn("fall","2026-10-28","2026-11-10"), W.planWrites().length===0&&/12 already there/.test(W.confirms[W.confirms.length-1])));
  ok("cancel writes nothing", (W.writes.length=0, W.yes=false, W.runBtn("fall","2026-10-28","2026-12-01"), W.writes.length===0&&W.rots().fall.endDate==="2026-11-10"));
}

console.log("\n── hand edits are kept: listed in the confirm, skipped unless the run comes back with choice 'replace' ──");
{ const W=world({today:"2026-10-28",plan:{"2026-10-29":{mid:"m2",b:{txt:"eggs"}},"2026-11-03":{txt:"Grandma's"},"2026-11-05":{l:{txt:"PB&J"}},"2026-11-04":{mid:"m1",eaten:123}}});
  W.setRot("fall",ROT);
  W.runBtn("fall","2026-10-28","2026-11-10");
  const up=W.planWrites()[0][2];
  ok("the confirm lists the hand-planned days by date and says they are kept", /2 days you changed by hand will be kept — Oct 29, Nov 3\.$/.test(W.confirms[0])&&!/overwrite/.test(W.confirms[0]), W.confirms[0]);
  ok("…days in one month list as 'Oct 14, 20, 27'", W.run("kitRotDaysTxt(['2026-10-14','2026-10-20','2026-10-27','2026-11-02'])")==="Oct 14, 20, 27, Nov 2");
  ok("…and they are not in the update", !Object.keys(up).some(k=>/^2026-10-29\//.test(k)||/^2026-11-03\//.test(k)));
  ok("a day with only an uncovered kind of its own (a lunch) is not hand-edited for the dinner — it merges", up["2026-11-05/txt"]==="Soup"&&W.plan()["2026-11-05"].l.txt==="PB&J"&&W.plan()["2026-11-05"].txt==="Soup");
  ok("an eaten day is never rewritten", !Object.keys(up).some(k=>/^2026-11-04\//.test(k))&&W.plan()["2026-11-04"].eaten===123);
  ok("the kept days still hold what she typed", W.plan()["2026-10-29"].mid==="m2"&&W.plan()["2026-11-03"].txt==="Grandma's");
  W.writes.length=0; W.confirms.length=0;
  W.run("kitRotRun('fall',{choice:'replace',from:'2026-10-28',to:'2026-11-10'})");   // the sheet's "Replace my day" (GROSYNC) — no second confirm
  const up2=W.planWrites()[0][2];
  ok("replace: the hand-planned days are written and stamped; a slot the rotation leaves blank (Thu breakfast) stays hers; nothing asked again", up2["2026-10-29/mid"]==="m1"&&!("2026-10-29/b" in up2)&&W.plan()["2026-10-29"].b.txt==="eggs"&&up2["2026-11-03/mid"]==="m1"&&up2["2026-11-03/fromRot/d"].dow===1&&W.confirms.length===0);
  ok("replace: the eaten day is still left alone", !Object.keys(up2).some(k=>/^2026-11-04\//.test(k)));
  ok("the run row has no overwrite tick any more (the sheet asks instead)", !/kit-rot-ow-/.test(W.run("kitRotRunRowHTML('fall',kitRotations.fall,'2026-11-02')")));
  // a day a run wrote, then changed by hand: the stamp says what it should be
  ok("a stamped day with the rotation's own food is not hand-edited", W.run("kitRotHandEdited('2026-10-28',['d'])")===false);
  W.run("kitPlan['2026-10-28'].txt='Leftovers'");
  ok("…changing its dinner makes it hand-edited; its breakfast kind is judged on its own", W.run("kitRotHandEdited('2026-10-28',['d'])")===true&&W.run("kitRotHandEdited('2026-10-28',['b'])")===false);
  W.run("kitPlan['2026-10-29'].sideList=[{txt:'peas'}]");
  ok("swapping the sides on a stamped dinner counts as a hand edit too", W.run("kitRotHandEdited('2026-10-29',['d'])")===true);
  // ✕ Clear on a stamped day keeps the stamp so the running rotation doesn't fill it again
  W.writes.length=0; W.run("kitAssign('2026-11-02',null)");
  ok("✕ Clear on a day a rotation wrote keeps {fromRot} (set, not remove) — the blank then counts as hand-edited", J(W.plan()["2026-11-02"])===J({fromRot:{d:{id:"fall",wk:1,dow:0}}})&&J(W.writes)===J([["set","kitchen/plan/2026-11-02",{fromRot:{d:{id:"fall",wk:1,dow:0}}}]])&&W.run("kitRotHandEdited('2026-11-02',['d'])")===true);
  W.run("kitPlan['2026-12-01']={txt:'x'}"); W.writes.length=0; W.run("kitAssign('2026-12-01',null)");
  ok("✕ Clear on an ordinary day still removes the node, as before", !W.plan()["2026-12-01"]&&J(W.writes)===J([["remove","kitchen/plan/2026-12-01"]]));
  W.writes.length=0; W.today="2026-10-30"; W.run("kitRotAutoStart()");
  ok("auto-start on a later day leaves the hand-edited and cleared days alone (no write)", W.planWrites().length===0);
}

console.log("\n── the queue: nothing written until the start date; the calendar, week list and grocery see the days ──");
{ const W=world({plan:{"2026-10-27":{mid:"m1"}}});
  W.setRot("fall",ROT);
  W.runBtn("fall","2026-11-02","2026-11-15");   // today is 10-26: a week ahead
  ok("queued: the confirm says so and NOTHING goes to kitchen/plan", /Queue 🍂 Fall from Mon, Nov 2 until Sun, Nov 15\?/.test(W.confirms[0])&&W.planWrites().length===0&&Object.keys(W.plan()).join()==="2026-10-27");
  ok("queued: only its dates are stored", J(W.rotWrites().filter(w=>!/_seeded/.test(w[1])).map(w=>[w[0],w[1],Object.keys(w[2]).sort().join()]))===J([["update","kitchen/rotations/fall","endDate,startDate,ts"]])&&W.rots().fall.startDate==="2026-11-02");
  const q=W.run("kitRotQueuedFor('2026-11-03')");
  ok("kitRotQueuedFor says what it will put there — the rotation, its week/day, the record", q&&q.id==="fall"&&q.name==="Fall"&&q.wk===0&&q.dow===1&&J(q.rec)===J({mid:"m2"})&&q.types.join()==="d");
  ok("…nothing for a day outside its dates or a blank rotation day", W.run("kitRotQueuedFor('2026-11-01')")===null&&W.run("kitRotQueuedFor('2026-11-06')")===null);
  ok("kitPlanRec hands the queued day back; a real day is the very record", J(W.run("kitPlanRec('2026-11-03')"))===J({mid:"m2"})&&W.run("kitPlanRec('2026-10-27')===kitPlan['2026-10-27']")===true&&W.run("kitPlanRec('2026-12-25')")===undefined);
  ok("kitPlanFor / kitPlanSlot resolve the queued meal like a planned one", W.run("kitPlanFor('2026-11-03').meal.name")==="Tacos"&&W.run("kitPlanSlot('2026-11-02','b').meal.name")==="Oatmeal");
  ok("the calendar's dinner line shows it (planned, not owed)", J(W.run("_calDinnerOf('2026-11-03')")).includes('"🌮 Tacos"')&&W.run("_calDinnerOf('2026-11-03').st")==="planned");
  ok("kitRotComingAt names the rotation for the queued slot, null for a real one or a kind it doesn't bring", J(W.run("kitRotComingAt('2026-11-03','d')"))===J({id:"fall",name:"Fall",emoji:"🍂"})&&W.run("kitRotComingAt('2026-10-27','d')")===null&&W.run("kitRotComingAt('2026-11-03','l')")===null&&W.run("kitRotComingLbl(kitRotComingAt('2026-11-03','d'))")==="coming · 🍂 Fall");
  // 🛒 the grocery feeders: no code of their own — the same helper
  const srcs=W.run("grWeekSources('2026-10-26',14)");
  ok("🛒 Shop two weeks out: the queued Tuesday's Tacos reach the grocery list with their day", srcs.some(s=>s.lbl==="Tacos (Tue)"&&/corn tortillas/.test(s.lines))&&srcs.some(s=>s.lbl==="Burgers (Tue)"), srcs.map(s=>s.lbl));
  ok("…and the queued Monday breakfast too", srcs.some(s=>s.lbl==="Oatmeal (Mon)"));
  ok("…while a 7-day shop before the start sees only what is really planned", J(W.run("grWeekSources('2026-10-26',7)").map(s=>s.lbl))===J(["Burgers (Tue)"]));
  W.today="2026-11-01";
  ok("'what this week needs' counts a queued day's meal", W.run("grWeekNeeds()").some(r=>/corn tortillas/i.test(r.name)&&r.meals.some(m=>/Tacos/.test(m))));
  ok("no feeder code of its own: grWeekSources and grWeekNeeds read through kitPlanRec", /kitPlanRec\(iso\)/.test(fn("grWeekSources"))&&/kitPlanRec\(iso\)/.test(fn("grWeekNeeds"))&&!/kitRotQueuedFor/.test(fn("grWeekSources")+fn("grWeekNeeds")));
  // a hand-planned day inside the queue keeps its own dinner — nothing is painted on it
  W.run("kitPlan['2026-11-02']={txt:'Birthday dinner'}");
  ok("a day she planned by hand stays hers — nothing 'coming' is painted on it (the run keeps it)", W.run("kitPlanRec('2026-11-02')===kitPlan['2026-11-02']")===true&&W.run("kitRotQueuedFor('2026-11-02')")===null&&W.run("kitRotComingAt('2026-11-02','b')")===null&&!W.run("grWeekSources('2026-11-02',1)").some(s=>/Oatmeal/.test(s.lbl)));
  // the start date comes: on Mom's device the days are written, from today on, with stamps; a hand-planned day kept
  W.today="2026-11-02"; W.writes.length=0;
  W.mom=false; ok("not Mom's device → nothing written", W.run("kitRotAutoStart()")===0&&W.writes.length===0); W.mom=true;
  W.run("kitRotSynced.plan=false"); ok("before the live plan has arrived → nothing written (never from a stale device copy)", W.run("kitRotAutoStart()")===0&&W.writes.length===0); W.run("kitRotSynced.plan=true");
  const n=W.run("kitRotAutoStart()"); const up=W.planWrites()[0]&&W.planWrites()[0][2];
  ok("on the start date Mom's device writes the running rotation's days (one multi-path update), stamped", n===11&&W.planWrites().length===1&&W.planWrites()[0][1]==="kitchen/plan"&&up["2026-11-03/mid"]==="m2"&&J(up["2026-11-03/fromRot/d"])===J({id:"fall",wk:0,dow:1})&&up["2026-11-15/mid"]==="m2"&&!up["2026-11-16/mid"]);
  ok("her birthday dinner is kept — that day is not written at all", !Object.keys(up).some(k=>/^2026-11-02\//.test(k))&&J(W.plan()["2026-11-02"])===J({txt:"Birthday dinner"}));
  ok("now it is running: nothing is 'coming' any more, the plan is the truth", W.run("kitRotQueuedFor('2026-11-03')")===null&&W.run("kitRotComingAt('2026-11-03','d')")===null&&W.run("kitPlanRec('2026-11-03')===kitPlan['2026-11-03']")===true);
  W.writes.length=0; W.run("kitRotAutoStart()"); W.run("kitRotAutoStart()");
  ok("auto-start is idempotent — a second render writes nothing", W.writes.length===0);
  ok("a ✕ Clear on a written day stays cleared across renders", (W.run("kitAssign('2026-11-05',null)"), W.writes.length=0, W.run("kitRotAutoStart()"), W.planWrites().length===0&&J(W.plan()["2026-11-05"])===J({fromRot:{d:{id:"fall",wk:0,dow:3}}})));
}

console.log("\n── one running rotation per meal kind ──");
{ const W=world();
  W.setRot("fall",Object.assign({},ROT,{startDate:"2026-10-19",endDate:"2026-11-15"}));   // running dinners + breakfasts
  W.setRot("win",{name:"Winter",emoji:"❄️",types:["d"],weeks:[[{d:"Soup"},{d:"Tacos"},{d:"Burgers"},{d:"Stew"},{d:"Pizza"},{d:"Leftovers"},{d:"Roast"}]]});
  W.setRot("snk",{name:"Snacks",types:["s"],weeks:[[{s:"Apples"},{s:"Popcorn"},{},{},{},{},{}]]});
  ok("the next one for the same kind defaults to the day after the running one ends", W.run("kitRotNextStart('win',['d'],'2026-11-02')")==="2026-11-16"&&W.run("kitRotNextStart('snk',['s'],'2026-11-02')")==="2026-11-02");
  ok("the card's run row shows that default for Winter", /id="kit-rot-from-win" value="2026-11-16"/.test(W.run("kitRotationsCardHTML()"))&&/id="kit-rot-to-win" value="2026-11-22"/.test(W.run("kitRotationsCardHTML()")));
  ok("rendering the card on Mom's device wrote the running rotation's days (auto-start), stamped per kind", W.planWrites().length===1&&J(W.plan()["2026-10-27"].fromRot)===J({d:{id:"fall",wk:1,dow:1}}));
  W.writes.length=0;
  W.runBtn("snk","2026-10-26","2026-11-08");
  ok("a different kind (snacks) runs alongside with no question asked — its own stamp beside Fall's", W.confirms.length===1&&!/End/.test(W.confirms[0])&&W.planWrites().length===1&&J(W.plan()["2026-10-27"].fromRot)===J({d:{id:"fall",wk:1,dow:1},s:{id:"snk",wk:0,dow:1}})&&W.plan()["2026-10-27"].mid==="m1"&&W.plan()["2026-10-27"].s.txt==="Popcorn");
  W.writes.length=0; W.confirms.length=0;
  W.runBtn("win","2026-11-02","2026-11-29");
  ok("starting Winter's dinners while Fall runs asks to end Fall the day before", W.confirms.length===2&&/One rotation runs the dinners at a time\./.test(W.confirms[0])&&/End 🍂 Fall on Sun, Nov 1 so ❄️ Winter takes over on Mon, Nov 2\? Days it filled after that are cleared unless you changed them\./.test(W.confirms[0]), W.confirms);
  const tw=W.planWrites();
  ok("yes → Fall's cut-off moves (targeted update) and its unedited dinners after Nov 1 are cleared — Winter is queued, nothing of its own on the calendar yet", W.rots().fall.endDate==="2026-11-01"&&W.rotWrites().some(w=>w[1]==="kitchen/rotations/fall"&&w[2].endDate==="2026-11-01"&&Object.keys(w[2]).sort().join()==="endDate,ts")&&W.rots().win.startDate==="2026-11-02"&&tw.length===1&&Object.keys(tw[0][2]).every(k=>tw[0][2][k]===null&&k>="2026-11-02"&&k<="2026-11-16")&&tw[0][2]["2026-11-03/mid"]===null&&tw[0][2]["2026-11-03/fromRot/d"]===null&&S(W.plan()["2026-11-03"])===S({s:{txt:"Popcorn"},fromRot:{s:{id:"snk",wk:0,dow:1}}})&&!W.plan()["2026-11-04"]&&S(W.plan()["2026-11-02"])===S({s:{txt:"Apples"},fromRot:{s:{id:"snk",wk:0,dow:0}}})&&W.plan()["2026-11-01"].mid==="m2", tw);
  ok("…so Winter's Soup now shows as 'coming' on Nov 2, beside the snack", W.run("kitRotQueuedFor('2026-11-02').rec.txt")==="Soup"&&S(W.run("kitPlanRec('2026-11-02')"))===S({s:{txt:"Apples"},fromRot:{s:{id:"snk",wk:0,dow:0}},txt:"Soup"}));
  ok("status now: Fall running until Nov 1, Winter upcoming", W.run("kitRotStatus(kitRotations.fall,'2026-10-26')+'/'+kitRotStatus(kitRotations.win,'2026-10-26')")==="running/upcoming");
  W.writes.length=0; W.confirms.length=0; W.yes=false;
  W.runBtn("win","2026-10-28","2026-11-29");
  ok("no → nothing changes", W.writes.length===0&&W.rots().fall.endDate==="2026-11-01"); W.yes=true;
  // a hand-off that starts TODAY: Fall's clearing and the newcomer's keys land in one update — the newcomer's win
  W.writes.length=0; W.confirms.length=0;
  W.setRot("now",{name:"Now",types:["d"],weeks:[[{d:"Stew"},{d:"Stew"},{d:"Stew"},{d:"Stew"},{d:"Stew"},{d:"Stew"},{d:"Stew"}]]});
  W.run("kitRotations.fall.endDate='2026-11-15'; kitRotations.win.startDate='2026-11-16'");   // put Fall back to running through Nov 15, Winter after it
  W.runBtn("now","2026-10-26","2026-11-01");
  const hu=W.planWrites()[0][2];
  ok("Fall is asked to end Oct 25; on the days both touch (Fall's clearing + Now's run) Now's Stew wins, the snack beside it untouched", /End 🍂 Fall on Sun, Oct 25/.test(W.confirms[0])&&W.rots().fall.endDate==="2026-10-25"&&W.planWrites().length===1&&hu["2026-10-26/txt"]==="Stew"&&hu["2026-10-26/mid"]===null&&hu["2026-10-26/fromRot/d"].id==="now"&&hu["2026-11-01/txt"]==="Stew"&&!Object.keys(hu).some(k=>k.slice(0,10)<"2026-10-26"||k.slice(0,10)>"2026-11-01")&&W.plan()["2026-10-27"].txt==="Stew"&&W.plan()["2026-10-27"].s.txt==="Popcorn"&&W.plan()["2026-10-27"].fromRot.d.id==="now"&&W.plan()["2026-10-27"].fromRot.s.id==="snk", hu);
  W.run("kitRotations.now.startDate='2026-10-19'; kitRotations.now.endDate='2026-10-25'; kitRotations.win.startDate='2026-11-02'");   // Now out of the way (ended); Winter queued from Nov 2 again
  W.writes.length=0; W.toasts.length=0; W.confirms.length=0;
  W.setRot("spr",{name:"Spring",types:["d"],weeks:[[{d:"Salad"},{},{},{},{},{},{}]]});
  W.runBtn("spr","2026-10-27","2026-11-05");   // would run into queued Winter's start
  ok("a rotation already queued for those meals from a later date blocks with a toast — nothing written", W.writes.length===0&&W.confirms.length===0&&/❄️ Winter already has those meals from Mon, Nov 2/.test(W.toasts[W.toasts.length-1]), W.toasts);
  ok("kitRotClash is pure and kind-aware", W.run("kitRotClash('spr',['d'],'2026-10-27','2026-11-05').map(r=>r.id).join()")==="win"&&W.run("kitRotClash('spr',['d'],'2026-10-20','2026-11-05').map(r=>r.id).join()")==="fall,win,now"&&W.run("kitRotClash('spr',['l'],'2026-10-20','2026-11-05').length")===0);
}

console.log("\n── 🗓 This month: calendar days in rotation shape; a cell is that day's write only ──");
{ const W=world({today:"2026-11-04"});
  W.setRot("fall",Object.assign({},ROT,{startDate:"2026-11-04",endDate:"2026-11-24"}));
  W.run("kitRotAutoStart()"); W.writes.length=0; W.today="2026-11-10";
  let h=W.run("kitRotMonthHTML()");
  ok("renders for the running rotation, November, with Mon..Sun headers and a row per covered kind", /This month — November · 🍂 Fall/.test(h)&&/Mon 2</.test(h)&&/🍽 Dinner/.test(h)&&/🌅 Breakfast/.test(h)&&!/☀️ Lunch/.test(h));
  ok("cells show what the calendar really has and tap to edit that day", /onclick="kitRotMPick\('2026-11-10','d'\)"[^>]*>Burgers</.test(h)&&/onclick="kitRotMPick\('2026-11-16','b'\)"[^>]*>Oatmeal</.test(h), h.match(/kitRotMPick\('2026-11-1[06]'[^<]*</g));
  ok("days outside the run are greyed, not tappable", !/kitRotMPick\('2026-11-02'/.test(h)&&!/kitRotMPick\('2026-11-25'/.test(h));
  W.run("kitRotMPick('2026-11-11','d')");
  ok("tapping opens the picker on that cell (Mom/Dad gate)", J(W.run("[kitRotPick.kind,kitRotPick.iso,kitRotPick.slot]"))===J(["m","2026-11-11","d"])&&/From the library — search/.test(W.run("kitRotMonthHTML()"))&&/data-rotpick="m1"/.test(W.run("kitRotMonthHTML()")));
  W.run("kitRotPickGo('m1')");
  ok("picking a meal = ONE targeted update on that day — the rotation is untouched", J(W.writes)===J([["update","kitchen/plan/2026-11-11",{mid:"m1",txt:null,sides:null,sideList:null}]])&&W.rots().fall.weeks[1][2].d==="Tacos"&&W.run("kitRotPick")===null);
  ok("that day now counts as hand-edited and shows ✎ in the month view", W.run("kitRotHandEdited('2026-11-11',['d'])")===true&&/✎ Burgers/.test(W.run("kitRotMonthHTML()")));
  W.writes.length=0; W.prompt="Grandma's"; W.run("kitRotMPick('2026-11-12','d'); kitRotPickTyped()");
  ok("✎ Type it → {txt}, same targeted write", J(W.writes)===J([["update","kitchen/plan/2026-11-12",{mid:null,txt:"Grandma's",sides:null,sideList:null}]])&&W.plan()["2026-11-12"].txt==="Grandma's"&&W.plan()["2026-11-12"].fromRot.d.id==="fall");
  W.writes.length=0; W.run("kitRotMPick('2026-11-16','b'); kitRotPickClear()");
  ok("✕ Clear on a breakfast cell clears just that slot", J(W.writes)===J([["update","kitchen/plan/2026-11-16",{b:null}]])&&!("b" in W.plan()["2026-11-16"])&&W.plan()["2026-11-16"].mid==="m1");
  W.mom=false; W.writes.length=0; W.run("kitRotDaySet('2026-11-13','d',{mid:'m2'})");
  ok("a kid's screen can't edit a day", W.writes.length===0&&W.plan()["2026-11-13"].mid==="m1"); W.mom=true;
  ok("re-running Fall lists the three days changed in the month view", (W.confirms.length=0, W.yes=false, W.runBtn("fall","2026-11-04","2026-11-24"), /3 days you changed by hand will be kept — Nov 11, 12, 16/.test(W.confirms[0])), W.confirms);
  ok("nothing is 'coming' on a month with no queued rotation", !/coming/.test(W.run("kitRotMonthHTML()")));
}

console.log("\n── the builder: ＋ New rotation from the library ──");
{ const W=world({mom:false});
  W.run("kitRotBNew()");
  ok("＋ New rotation is behind the Mom PIN", W.pins===1&&/for Mom/.test(W.pinWhy)&&W.run("kitRotB")===null); W.mom=true;
  W.run("kitRotBNew()");
  ok("opens empty: dinners only, one blank week", J(W.run("[kitRotB.id,kitRotB.name,kitRotB.types,kitRotB.weeks.length,kitRotB.weeks[0].length]"))===J([null,"",["d"],1,7]));
  W.run("kitRotBType('b'); kitRotBType('s'); kitRotBType('s')");
  ok("meal kinds toggle, kept in d/b/l/s order; the last one can't be dropped", W.run("kitRotB.types.join()")==="d,b"&&(W.run("kitRotBType('d'); kitRotBType('b'); kitRotB.types.join()")==="b")&&/Keep at least one/.test(W.toasts[W.toasts.length-1]));
  W.run("kitRotBType('d'); kitRotBWeeks(3)");
  ok("weeks 1–8: set to 3", W.run("kitRotB.weeks.length")===3&&W.run("kitRotBWeeks(12); kitRotB.weeks.length")===8&&W.run("kitRotBWeeks(2); kitRotB.weeks.length")===2);
  let h=W.run("kitRotBHTML()");
  ok("the grid: a tappable cell per covered kind per day, the 🥦 side as a one-line box beside the dinner, week tools", (h.match(/onclick="kitRotBPick\(/g)||[]).length===28&&(h.match(/placeholder="🥦 peas · rice"/g)||[]).length===14&&/kitRotBCopy\(0\)/.test(h)&&/kitRotBMove\(1,-1\)/.test(h)&&/kitRotBDelWeek\(1\)/.test(h)&&/covers/.test(h));
  W.run("kitRotBPick(0,1,'d')"); h=W.run("kitRotBHTML()");
  ok("tapping a slot offers the library (search, a tag filter since the library has tags) or ✎ Type it", /🔎 From the library — search/.test(h)&&/kitRotPickTag\('side'\)/.test(h)&&/kitRotPickTag\('kid'\)/.test(h)&&!/kitRotPickTag\('gf'\)/.test(h)&&/data-rotpick="m2"[^>]*>🌮 Tacos</.test(h)&&/kitRotPickTyped\(\)/.test(h));
  W.run("kitRotPickTag('side')"); h=W.run("kitRotBHTML()");
  ok("the tag filter narrows the chips; search filters in place", /data-rotpick="m3"/.test(h)&&!/data-rotpick="m1"/.test(h)&&/oninput="kitRotPickQ\(this\.value\)"/.test(h));
  W.run("kitRotPickTag('side'); kitRotPickGo('m2')");
  ok("picking fills the slot with the meal's NAME and closes the picker", W.run("kitRotB.weeks[0][1].d")==="Tacos"&&W.run("kitRotPick")===null);
  W.prompt="Grandma's lasagna"; W.run("kitRotBPick(0,2,'d'); kitRotPickTyped()");
  ok("✎ Type it fills a typed name", W.run("kitRotB.weeks[0][2].d")==="Grandma's lasagna");
  W.run("kitRotBSet(0,1,'sd','peas · rice',true); kitRotBPick(0,1,'b'); kitRotPickGo('m4')");
  W.run("kitRotBCopy(0)");
  ok("⧉ copy a week to the next", J(W.run("kitRotB.weeks[1]"))===J(W.run("kitRotB.weeks[0]"))&&W.run("kitRotB.weeks[1]!==kitRotB.weeks[0]")===true);
  W.run("kitRotBSet(1,0,'d','Soup'); kitRotBMove(1,-1)");
  ok("reorder weeks", W.run("kitRotB.weeks[0][0].d")==="Soup"&&W.run("kitRotB.weeks[1][0].d")==="");
  W.run("kitRotBPick(1,1,'d'); kitRotPickClear()");
  ok("delete a slot", W.run("kitRotB.weeks[1][1].d")===""&&W.run("kitRotB.weeks[0][1].d")==="Tacos");
  W.run("kitRotBCopy(1); kitRotBDelWeek(2)");
  ok("remove a week", W.run("kitRotB.weeks.length")===2);
  W.writes.length=0; W.toasts.length=0; W.run("kitRotBSave()");
  ok("save without a name → toast, nothing written", /Name the rotation/.test(W.toasts[0])&&W.writes.length===0);
  W.el("kit-rotb-name",{value:" Winter "}); W.el("kit-rotb-emoji",{value:"❄️"}); W.run("kitRotBSave()");
  const w=W.writes.find(x=>x[0]==="set"&&/^kitchen\/rotations\/r[0-9a-z]+_b\d+$/.test(x[1]));
  ok("save: ONE new kitchen/rotations/{id} record — names, the side as its one-line text, blank and uncovered slots left out", !!w&&w[2].name==="Winter"&&w[2].emoji==="❄️"&&J(w[2].types)===J(["d","b"])&&J(w[2].weeks[0][1])===J({d:"Tacos",sd:"peas · rice",b:"Oatmeal"})&&J(w[2].weeks[0][0])===J({d:"Soup"})&&J(w[2].weeks[1][0])===J({})&&W.writes.filter(x=>!/_seeded/.test(x[1])).length===1, W.writes);
  ok("…no dates yet: 'not scheduled', the builder closes and the card opens on it", W.run("kitRotStatus(kitRotAll()[Object.keys(kitRotAll())[0]])")===""&&W.run("kitRotB")===null&&W.run("kitRotOpen")===Object.keys(W.run("kitRotAll()"))[0]);
  ok("the card offers ＋ New rotation and the run row", /kitRotBNew\(\)/.test(W.run("kitRotationsCardHTML()"))&&/not scheduled/.test(W.run("kitRotationsCardHTML()"))&&/▶ Run/.test(W.run("kitRotationsCardHTML()")));
  // ✎ Edit on a saved rotation opens the builder; Save is a targeted update of only what changed
  W.setRot("fall",ROT); W.writes.length=0;
  W.run("kitRotEditStart('fall')");
  ok("✎ Edit opens the builder on the saved rotation, all slots loaded (uncovered lunch kept in the working copy)", W.run("kitRotB.id")==="fall"&&W.run("kitRotB.types.join()")==="d,b"&&W.run("kitRotB.weeks[0][0].l")==="PB&J"&&W.run("kitRotEdit")===null);
  W.run("kitRotBSet(0,4,'d','Fish'); kitRotBType('s'); kitRotBWeeks(1)");
  W.el("kit-rotb-name",{value:"Fall"}); W.el("kit-rotb-emoji",{value:"🍂"}); W.run("kitRotBSave()");
  ok("save: one multi-path update under the rotation — the traded slot, the dropped week, the new kinds, ts", J(W.writes.map(x=>[x[0],x[1],Object.keys(x[2]).sort().join()]))===J([["update","kitchen/rotations/fall","ts,types,weeks/0/4/d,weeks/1"]])&&W.writes[0][2]["weeks/1"]===null&&J(W.writes[0][2].types)===J(["d","b","s"]), W.writes);
  ok("…local copy matches: 1 week, Friday = Fish, the lunch untouched", W.rots().fall.weeks.length===1&&W.rots().fall.weeks[0][4].d==="Fish"&&W.rots().fall.weeks[0][0].l==="PB&J");
  W.run("kitRotEditStart('fall'); kitRotBTyped()");
  ok("⌨ Type the whole grid reaches the typed editor with what's built", W.run("kitRotB")===null&&W.run("kitRotEdit.id")==="fall"&&W.run("kitRotEdit.weeks[0][4].d")==="Fish"&&(W.run("kitRotEditHTML(kitRotEdit)").match(/<input type="text" list="kit-rot-meal-names"/g)||[]).length===35);
  W.run("kitRotEditCancel(); kitRotEditStart('fall'); kitRotDel('fall')");
  ok("deleting a rotation closes its builder", W.run("kitRotB")===null&&!("fall" in W.rots()));
}

console.log("\n── dry-run is inert; a family with no rotations reads byte-identical plan and grocery ──");
{ const W=world({dry:true,plan:{"2026-10-27":{mid:"m1"}}});
  W.setRot("fall",ROT);
  W.runBtn("fall","2026-10-26","2026-11-08");
  const nw=()=>W.writes.filter(x=>!/_seeded/.test(x[1])).length;   // the old seed sentinel is the one pre-existing write that ignores dry-run
  ok("?dryrun=1: the run updates the device copy but writes nothing", nw()===0&&W.plan()["2026-10-28"].txt==="Pizza night");
  W.run("kitRotDaySet('2026-10-28','d',{mid:'m1'}); kitRotBNew(); kitRotBSet(0,0,'d','Soup'); kitRotB.name='X'; kitRotBSave()");
  ok("…and so do a month-view edit and a build", nw()===0&&W.plan()["2026-10-28"].mid==="m1"&&Object.keys(W.run("kitRotAll()")).length===2);
}
{ const PLAN={"2026-10-26":{mid:"m1",sides:"peas · rice",b:{txt:"eggs"}},"2026-10-28":{txt:"Leftovers",eaten:1},"2026-10-30":{mid:"m2",sideList:[{mid:"m3"}],l:{mid:"m4"}}};
  const W=world({plan:PLAN});
  const base=W.run("(function(){ "+[fn("kitPlanFor"),fn("kitPlanSlot"),fn("grWeekSources"),fn("grWeekNeeds")].join("\n").replace(/\(typeof kitPlanRec==='function'\)\?kitPlanRec\(iso\):kitPlan\[iso\]/g,"kitPlan[iso]")+"; return {f:kitPlanFor,s:kitPlanSlot,g:grWeekSources,n:grWeekNeeds}; })()");
  const days=["2026-10-25","2026-10-26","2026-10-27","2026-10-28","2026-10-30","2026-11-30"];
  ok("the hooks are in place (kitPlanFor, kitPlanSlot, grWeekSources, grWeekNeeds read through kitPlanRec)", [fn("kitPlanFor"),fn("kitPlanSlot"),fn("grWeekSources"),fn("grWeekNeeds")].every(f=>/\(typeof kitPlanRec==='function'\)\?kitPlanRec\(iso\):kitPlan\[iso\]/.test(f)));
  ok("no rotations: kitPlanRec is the very record for every day", days.every(d=>W.run("kitPlanRec("+J(d)+")===kitPlan["+J(d)+"]")));
  ok("no rotations: kitPlanFor and kitPlanSlot byte-identical to the base", days.every(d=>J(W.run("kitPlanFor("+J(d)+")"))===J(base.f(d))&&["b","l","s"].every(s=>J(W.run("kitPlanSlot("+J(d)+","+J(s)+")"))===J(base.s(d,s)))));
  ok("no rotations: the week's shopping and needs byte-identical to the base", J(W.run("grWeekSources('2026-10-25',14)"))===J(base.g("2026-10-25",14))&&J(W.run("grWeekNeeds()"))===J(base.n()));
  ok("no rotations: the card has no month view, nothing is 'coming'", W.run("kitRotMonthHTML()")===""&&days.every(d=>W.run("kitRotComingAt("+J(d)+",'d')")===null));
  ok("an unscheduled legacy rotation (no dates) changes nothing either", (W.setRot("fall",ROT), days.every(d=>W.run("kitPlanRec("+J(d)+")===kitPlan["+J(d)+"]"))&&W.run("kitRotAutoStart()")===0));
}

console.log("\n── wiring (regex on the live source) ──");
{ const card=fn("kitRotationsCardHTML");
  ok("card: auto-start, ＋ New rotation, the builder, the run row, This month", /kitRotAutoStart\(\)/.test(card)&&/kitRotBNew\(\)/.test(card)&&/kitRotBHTML\(\)/.test(card)&&/kitRotRunRowHTML\(id,r,nextMon\)/.test(card)&&/kitRotMonthHTML\(\)/.test(card)&&!/>Apply</.test(card));
  ok("card: ✎ Edit still calls kitRotEditStart (the typed editor's test) which hands off to the builder", /kitRotEditStart\(\\''\+id\+'\\'\)/.test(card)&&/kitRotBStart\(id\); return;/.test(fn("kitRotEditStart")));
  ok("kitRotApply routes to kitRotRun", /^function kitRotApply\(id\)\{\n  if\(typeof kitRotRun==='function'\) return kitRotRun\(id\);/.test(fn("kitRotApply")));
  ok("kitRotDel closes an open builder", /kitRotBClose\(id\)/.test(fn("kitRotDel")));
  ok("the kitchen/plan and kitchen/rotations listeners flip the synced flags auto-start waits for", /kitPlan\[k\]=v\[k\]; \}\);\n\s*if\(typeof kitRotSynced!=="undefined"\) kitRotSynced\.plan=true;/.test(src)&&/kitRotations\[k\]=v\[k\]; \}\);\n\s*if\(typeof kitRotSynced!=="undefined"\) kitRotSynced\.rots=true;/.test(src)&&/!kitRotSynced\.plan\|\|!kitRotSynced\.rots\) return 0;/.test(fn("kitRotAutoStart")));
  ok("kitAssign keeps a rotation day's stamp on ✕ Clear", /kitRotClearKeep\(iso\)/.test(fn("kitAssign"))&&/if\(kitPlan\[iso\]\) db\.ref\('kitchen\/plan\/'\+iso\)\.set\(kitPlan\[iso\]\)/.test(fn("kitAssign")));
  const wk=fn("renderKitchen");
  ok("week list: a queued day is pale and labelled, with no ✕ Clear for it", /kitRotComingAt\(iso,'d'\)/.test(wk)&&/kitRotComingLbl\(_cm\)/.test(wk)&&/\(_cm\?'opacity:\.6;':''\)/.test(wk)&&/if\(pl&&!_cm\) h\+='<span onclick="kitAssign/.test(wk));
  const cal=fn("calRenderMonthPreview");
  ok("calendar month: dinner and b/l/s lines carry the 'coming' class; the CSS makes it pale", /"gmd-meal "\+_din\.st\+\(\(typeof kitRotComingAt==="function"&&kitRotComingAt\(iso,'d'\)\)\?" coming":""\)/.test(cal)&&/c:"gmd-meal"\+\(\(typeof kitRotComingAt==="function"&&kitRotComingAt\(iso,sp\[0\]\)\)\?" coming":""\)/.test(cal)&&/\.gmd-meal\.coming\{color:#b7a99a;font-style:italic\}/.test(src));
  ok("day sheet: the dinner row and the b/l/s rows say 'coming · <rotation>'", /kitRotComingLbl\(_cm\)\):'planned'/.test(fn("calDaySheetHTML"))&&/kitRotComingLbl\(kitRotComingAt\(iso,sp\[0\]\)\)/.test(fn("_calSlotRows")));
  ok("every database write in the block goes through db && !_dryRun()", /function kitRotDb\(\)\{ return \(typeof db!=='undefined'&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\)\?db:null; \}/.test(block)&&!/[^t]db\.ref\(/.test(block.replace(/kitRotDb\(\)/g,"")));
  ok("no whole-node set of kitchen/plan or kitchen/rotations in the block", !/ref\('kitchen\/plan'\)\.set|ref\('kitchen\/rotations'\)\.set/.test(block));
  ok("kid-safe: no 🔀 in index.html", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
