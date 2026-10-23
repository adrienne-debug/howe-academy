/* 🍽 KITDINNEREDIT — ✎ Change a dinner right on the day sheet and the Tonight card, plus the family's word for it (Dinner / Supper).
 *   Her report 2026-10-23: "am I able to edit the meals in the calendar for supper? it looked like I couldn't."
 *   · ✎ Change renders for a planned / owed / eating-out dinner, never an eaten or didn't-happen one, never for a kid
 *   · it opens the SAME library picker the Breakfast / Lunch parts use (search, tag chips, ✎ Type it, ✕ Clear) under the row
 *   · picking a library meal → kitAssign(iso,{mid}) (sides dropped); typing → {txt}; ✕ Clear → null — one targeted write each
 *   · a rotation-written day counts as hand-edited afterwards (KITROT2's own check, not re-implemented); the run keeps it
 *   · 🗓 Plan it on an empty day opens the picker in place; "or plan the week ›" keeps the old route (Mom's Day only)
 *   · Mom's Day's Tonight card gets the same ✎ Change; the card and the sheet each draw only the picker they opened
 *   · settings/mealWords/dinner = "Dinner" | "Supper" flows to every d label; default "Dinner"; one targeted write, Mom only
 *   · with no interaction the sheet renders byte-identically to the app without the block — except the one button
 *   run: node test_kitchen_dinner_edit.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,500)+")":"")); } };
const J=v=>JSON.stringify(v);
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<i) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// KITDINNEREDIT_START","// KITDINNEREDIT_END");

console.log("── the block and its hooks ──");
{ const ka=src.indexOf("// KITDINNEREDIT_START"), kb=src.indexOf("// KITDINNEREDIT_END");
  ok("KITDINNEREDIT block present once, right after KITSLOTS_END", ka>0&&kb>ka&&src.indexOf("// KITDINNEREDIT_START",ka+5)<0&&src.slice(src.indexOf("// KITSLOTS_END"),ka).trim()==="// KITSLOTS_END");
  ok("the picker's kind-\"p\" handlers hand slot \"d\" to the block (one line each)", /^function kitSlotsPickCur\(P\)\{ if\(P\.slot==="d"&&typeof kitDinPickCur==="function"\) return kitDinPickCur\(P\);/m.test(src)&&/^function kitSlotsPickSet\(P,val\)\{ if\(P\.slot==="d"&&typeof kitDinPickSet==="function"\) return kitDinPickSet\(P,val\);/m.test(src));
  const s=fn("calDaySheetHTML");
  ok("day sheet: ✎ Change hooked once, after the row's own buttons, inside if(din)", (s.match(/kitDinEditBtn\(iso,din\.st\)/g)||[]).length===1&&s.indexOf("kitDinEditBtn(iso,din.st)")>s.indexOf("Actually, we ate it")&&s.indexOf("kitDinEditBtn(iso,din.st)")<s.indexOf("} else {\n      h+='<span style=\"flex:1;color:#9ca3af\">No '"));
  ok("day sheet: 🗓 Plan it goes through kitDinPlanBtns, the old route kept as its fallback", /kitDinPlanBtns==="function"\)\?kitDinPlanBtns\(iso\):\(\(typeof tab!=="undefined"&&tab==="moms-plan"&&kitEatGate\(\)\)\?'<button[^\n]*mpGoto\(\\'meals\\'\);kitPickDay/.test(s));
  ok("day sheet: the picker is drawn right under the dinner row, before the sides", s.indexOf('kitDinPickerHTML(iso,"sheet")')>0&&s.indexOf('kitDinPickerHTML(iso,"sheet")')<s.indexOf("kitSidesEditHTML(iso)"));
  ok("day sheet: both Dinner labels and \"No dinner planned\" read the family's word", (s.match(/\(typeof kitDinnerWord==="function"\?kitDinnerWord\(\):"Dinner"\)/g)||[]).length===2&&/No '\+\(typeof kitDinnerWord==="function"\?kitDinnerWord\(\)\.toLowerCase\(\):"dinner"\)\+' planned/.test(s));
  const c=fn("mdCardDinner");
  ok("Tonight card: ✎ Change in the header before 🗓 Plan week, the picker under the header, the word in the title", c.indexOf("kitDinCardBtn(iso,dpl)")>0&&c.indexOf("kitDinCardBtn(iso,dpl)")<c.indexOf("Plan week")&&/kitDinPickerHTML\(iso,"card"\)/.test(c)&&/Tonight\\'s '\+\(typeof kitDinnerWord==="function"\?kitDinnerWord\(\)\.toLowerCase\(\):"dinner"\)\+''/.test(c));
  ok("kitAssign writes only when db && !_dryRun() (the day sheet now writes through it)", /if\(typeof db!=='undefined'&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\)\{   \/\/ KITDINNEREDIT[^\n]*\n    if\(kitPlan\[iso\]\) db\.ref\('kitchen\/plan\/'\+iso\)\.set\(kitPlan\[iso\]\);/.test(fn("kitAssign")));
  ok("kitRotTypeMeta(\"d\") carries the word; the builder's type chips and the old grid's placeholder read it", /return \(t==="d"&&typeof kitDinTypeMeta==="function"\)\?kitDinTypeMeta\(m\):m; \}/.test(fn("kitRotTypeMeta"))&&/t\[1\]\+' '\+kitRotTypeMeta\(t\[0\]\)\[2\]\+'<\/span>'; \}\)\.join\(''\)/.test(src)&&/placeholder="'\+s\[1\]\+' '\+\(s\[0\]==="d"&&typeof kitDinnerWord==="function"\?kitDinnerWord\(\):s\[2\]\)\+'"/.test(src));
  ok("the week list header and the typed-dinner prompt read the word", /This week\\'s '\+\(typeof kitDinnerWord==="function"\?kitDinnerWord\(\)\.toLowerCase\(\):"dinner"\)\+'s'/.test(src)&&/prompt\(\(typeof kitDinnerWord==="function"\?kitDinnerWord\(\):"Dinner"\)\+" plan:"/.test(fn("kitPlanText")));
  ok("Settings ▸ Family rules carries the card; settings/mealWords is listened to with the other settings", /mmRulesCardHTML\(\):''\)\+\(typeof kitDinWordRuleHTML==="function"\?kitDinWordRuleHTML\(\):''\)/.test(fn("renderFamilyRulesWrap"))&&/db\.ref\("settings\/mealWords"\)\.on\("value",s=>\{ if\(typeof kitMealWordsOnValue==="function"&&kitMealWordsOnValue\(s\.val\(\)\)&&typeof renderAll==="function"\) renderAll\(\); \}\);/.test(src));
  const refs=BLOCK.match(/db\.ref\([^)]*\)/g)||[];
  ok("the block's only write is settings/mealWords/dinner, behind db && !_dryRun()", J(refs)===J(["db.ref('settings/mealWords/dinner')"])&&/typeof db!=='undefined'&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\) db\.ref\('settings\/mealWords\/dinner'\)\.set\(w\)/.test(BLOCK));
  ok("the dinner's own write goes through kitAssign — nothing in the block sets kitchen/plan itself", /kitAssign\(P\.iso,val\)/.test(BLOCK)&&!/kitchen\/plan/.test(BLOCK.replace(/\/\/[^\n]*/g,"")));
  ok("no 🔀 anywhere", src.indexOf("🔀")<0);
}

const MEALS={m1:{name:"Burgers",emoji:"🍔",ing:"1 lb ground beef\nburger buns"},m2:{name:"Tacos",emoji:"🌮",ing:"corn tortillas\nground beef",tags:["kid"]},
  m3:{name:"Roasted Broccoli",emoji:"🥦",ing:"broccoli",tags:["side"]},m4:{name:"Oatmeal",emoji:"🥣",ing:"rolled oats\nmilk"}};
// ── a tiny app around the real slices (o.base = the app without the KITDINNEREDIT block, every hook idle) ──
function world(o){
  o=o||{};
  const W={writes:[],toasts:[],renders:0,mom:!("mom" in o)||o.mom,dry:!!o.dry,prompt:null,gotos:[],ls:{},today:o.today||"2026-10-26"};
  const ref=p=>({set:v=>W.writes.push(["set",p,JSON.parse(J(v))]),update:v=>{ W.writes.push(["update",p,JSON.parse(J(v))]); return Promise.resolve(); },remove:()=>W.writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,Promise,
    db:{ref:ref},HA_LS:{getItem:k=>(k in W.ls?W.ls[k]:null),setItem:(k,v)=>{ W.ls[k]=String(v); }},mwToast:m=>W.toasts.push(m),esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    momHere:()=>W.mom,_dryRun:()=>W.dry,dadAwardOk:()=>false,_kioskD:()=>false,kitPinGate:(then)=>{ if(W.mom) then(); },
    _todayStr:()=>W.today,calToday:()=>W.today,gwParseDate:iso=>new Date(iso+"T12:00:00"),kitOpenRecipe:()=>{},wbMomEyes:()=>false,KID_COLOR:{lucy:"#777"},kcAddIso:null,
    renderAll:()=>{ W.renders++; },renderMomsPlan:()=>{ W.momsPlanRenders=(W.momsPlanRenders||0)+1; },prompt:()=>W.prompt,mpGoto:v=>W.gotos.push(v),
    momdayGet:()=>"",kitRateChips:()=>"",kitPrepSteps:()=>[],kitWhenLabel:w=>w,kitFlagMark:()=>"",kitPlanText:()=>{},kitMoveForward:()=>{},
    kitPantry:{},kitPrepDone:{},tab:o.tab||"schedule",momdayData:{},HA_IS_HOWE:false,
    document:{getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx);
  const run=e=>vm.runInContext(e,ctx);
  run(fn("kitIsoPlus"));
  run("var kitMeals="+J(o.meals||MEALS)+"; var kitPlan="+J(o.plan||{})+"; var kitRotations="+J(o.rots||{})+"; var kitPickIso=null, kitRotOpen=null, kitRotSaveOpen=false, kitEditId=null, kitView=null;");
  run(cut("// KITSIDES_START","// KITSIDES_END"));
  run([line("const KIT_ROT_DEFAULT="),line("const KIT_SLOTS="),line("const KIT_TAGS="),line("const KIT_ROT_DAYS="),line("const KIT_MOVE_NAMES="),
       fn("kitPlanFor"),fn("kitSidesTxt"),fn("kitPlanSlot"),fn("_calDinnerOf"),fn("_calSlotRows"),fn("kitEatGate"),fn("_kitRefresh"),fn("kitAssign"),fn("kitPickDay"),
       fn("_kitMvGet"),fn("_kitMvFixed"),fn("kitMoveChain"),fn("kitOutIs"),fn("kitOutBtn"),fn("kitOutLbl"),fn("kitOutTxt"),
       fn("kitRotAll"),fn("kitRotEnsure"),fn("kitRotMealByName"),fn("kitRotSlotVal"),fn("kitRotSlotName"),fn("kitRotMondayOf"),fn("kitRotRender"),
       cut("// KIT_ROT_EDIT_START","// KIT_ROT_EDIT_END"),cut("// KITROT2_START","// KITROT2_END"),cut("// KITSLOTS_START","// KITSLOTS_END"),
       fn("calDaySheetHTML"),fn("mdCardDinner")].join("\n"));
  if(!o.base) run(BLOCK);
  run("kitRotSynced.plan=true; kitRotSynced.rots=true;");
  W.run=run; W.ctx=ctx; W.plan=()=>run("kitPlan"); W.planWrites=()=>W.writes.filter(w=>/^kitchen\/plan/.test(w[1]));
  W.sheet=(iso,who)=>run("calDaySheetHTML('"+iso+"',{meals:true},_calDinnerOf,"+(who?"'"+who+"'":"null")+",{noWork:true,noClose:true,flat:true})");
  W.card=iso=>run("mdCardDinner('"+iso+"')");
  W.pick=()=>run("kitRotPick");
  return W;
}
const MON="2026-10-26", TUE="2026-10-27", FRI="2026-10-23", SUN="2026-10-25";   // MON = today in this world; FRI/SUN are past
const CHG=iso=>new RegExp('<button class="act" style="background:#fff7ed;color:#9a3412" onclick="kitDinPickOpen\\(\''+iso+'\',\'sheet\'\\)">✎ Change</button>');
const PLAN={[MON]:{mid:"m1",sideList:[{mid:"m3"}],b:{mid:"m4"}},[TUE]:{txt:"Leftovers"},[FRI]:{mid:"m2"},[SUN]:{mid:"m1",eaten:1761436800000},
  "2026-10-24":{mid:"m2",skipped:1761350400000},"2026-10-28":{mid:"m2",d:{out:true}}};

console.log("\n── ✎ Change: where it shows ──");
{ const W=world({plan:PLAN});
  const today=W.sheet(MON);
  ok("today, planned: ✓ We ate it · ✗ Didn’t happen · ➡ Move forward · 🍽 Eating out, then ✎ Change", /✓ We ate it/.test(today)&&/➡ Move forward/.test(today)&&/Eating out/.test(today)&&CHG(MON).test(today)&&today.indexOf("✎ Change")>today.indexOf("Eating out"));
  ok("a planned day ahead (typed dinner): ➡ Move forward, then ✎ Change", CHG(TUE).test(W.sheet(TUE))&&/➡ Move forward/.test(W.sheet(TUE)));
  ok("an owed day (past, not marked): ✎ Change", CHG(FRI).test(W.sheet(FRI))&&/Not marked yet/.test(W.sheet(FRI)));
  ok("an eating-out day: the way back and ✎ Change", CHG("2026-10-28").test(W.sheet("2026-10-28"))&&/Eating out ✓/.test(W.sheet("2026-10-28")));
  ok("an eaten day: no ✎ Change (its buttons as before)", !/✎ Change/.test(W.sheet(SUN))&&/✓ Eaten/.test(W.sheet(SUN)));
  ok("a didn’t-happen day: no ✎ Change (Actually, we ate it stays)", !/✎ Change/.test(W.sheet("2026-10-24"))&&/Actually, we ate it/.test(W.sheet("2026-10-24")));
  ok("a kid’s view: the dinner as text — no ✎ Change, no meal buttons (only the Corner’s ＋ Add something)", !/✎ Change|kitDinPickOpen|We ate it|Move forward/.test(W.sheet(MON,"lucy"))&&/<span class="lbl">Dinner<\/span><span style="flex:1"><b>🍔 Burgers/.test(W.sheet(MON,"lucy")));
  ok("nothing written just by looking", W.writes.length===0);
  const K=world({plan:PLAN,mom:false});
  ok("not Mom (no gate): no ✎ Change, no Plan it", !/✎ Change|Plan it/.test(K.sheet(MON))&&!/Plan it/.test(K.sheet("2026-10-30")));
}
console.log("\n── byte-identical to the app without the block, except the one button ──");
{ const A=world({plan:PLAN}), B=world({plan:PLAN,base:true});
  [MON,TUE,FRI,"2026-10-28"].forEach(iso=>{ const a=A.sheet(iso), b=B.sheet(iso); const btn=a.match(CHG(iso)); ok(iso+": the sheet with the block = the base sheet + ✎ Change", !!btn&&a.replace(btn[0],"")===b&&a!==b); });
  [SUN,"2026-10-24"].forEach(iso=>ok(iso+": an eaten / didn’t-happen day is byte-identical", A.sheet(iso)===B.sheet(iso)));
  ok("a kid’s sheet is byte-identical", A.sheet(MON,"lucy")===B.sheet(MON,"lucy"));
  ok("the Tonight card with the block = the base card + ✎ Change", (()=>{ const a=A.card(MON), b=B.card(MON); const m=a.match(/<button onclick="kitDinPickOpen\('2026-10-26','card'\)"[^>]*>✎ Change<\/button>/); return !!m&&a.replace(m[0],"")===b; })());
}

console.log("\n── the picker: the same one the Breakfast / Lunch parts use ──");
{ const W=world({plan:PLAN});
  W.run("kitDinPickOpen('"+MON+"','sheet')");
  ok("tap ✎ Change → kitRotPick = {kind:p, iso, slot:d, src:sheet}, the screen repaints", J(W.pick())===J({q:"",tag:"",kind:"p",iso:MON,slot:"d",src:"sheet"})&&W.renders===1);
  const h=W.sheet(MON);
  ok("the sheet draws the library picker under the dinner row: header, search, a tag chip, the meals, ✎ Type it, ✕ Clear, Close", /🍽 Dinner · Mon, Oct 26 · now: Burgers/.test(h)&&/oninput="kitRotPickQ\(this\.value\)"/.test(h)&&/kitRotPickTag\('kid'\)/.test(h)&&/kitRotPickGo\('m2'\)/.test(h)&&/kitRotPickTyped\(\)/.test(h)&&/kitRotPickClear\(\)/.test(h)&&/kitRotPickClose\(\)/.test(h), h);
  ok("…once (the Breakfast row doesn’t draw it too), right after the row and before the 🥗 sides", (h.match(/kitRotPickQ/g)||[]).length===1&&h.indexOf("kitRotPickQ")<h.indexOf("kitSideAddTyped")&&h.indexOf("kitRotPickQ")>h.indexOf("✎ Change"));
  ok("the open button is lit", /style="background:#B45309;color:#fff" onclick="kitDinPickOpen\('2026-10-26','sheet'\)">✎ Change/.test(h));
  ok("the current dinner’s chip is marked", /data-rotpick="m1"[^>]*border:1\.5px solid #B45309;background:#fff7ed/.test(h));
  ok("the Tonight card does NOT draw this picker (it was opened from the sheet)", !/kitRotPickQ/.test(W.card(MON)));
  W.run("kitRotPickGo('m2')");
  const p=W.plan()[MON];
  ok("picking Tacos → kitAssign: the dinner changes, the sides go, breakfast stays", J(p)===J({b:{mid:"m4"},mid:"m2"}), p);
  ok("ONE targeted write: set kitchen/plan/{iso}", J(W.writes)===J([["set","kitchen/plan/"+MON,{b:{mid:"m4"},mid:"m2"}]]), W.writes);
  ok("the picker closes and the screen repaints", W.pick()===null&&W.renders===2&&!/kitRotPickQ/.test(W.sheet(MON)));
  ok("the sheet now says Tacos", /<b>🌮 Tacos<\/b>/.test(W.sheet(MON)));
  W.run("kitDinPickOpen('"+MON+"','sheet')"); W.prompt="Breakfast for dinner"; W.run("kitRotPickTyped()");
  ok("✎ Type it → kitAssign(iso,{txt})", J(W.plan()[MON])===J({b:{mid:"m4"},txt:"Breakfast for dinner"})&&J(W.writes[1])===J(["set","kitchen/plan/"+MON,{b:{mid:"m4"},txt:"Breakfast for dinner"}]));
  W.run("kitDinPickOpen('"+MON+"','sheet')"); W.run("kitRotPickClear()");
  ok("✕ Clear → kitAssign(iso,null): the day’s plan node is removed (as the week list’s ✕ Clear)", W.plan()[MON]===undefined&&J(W.writes[2])===J(["remove","kitchen/plan/"+MON]));
  W.run("kitDinPickOpen('"+TUE+"','sheet')"); W.run("kitDinPickOpen('"+TUE+"','sheet')");
  ok("tapping ✎ Change again closes the picker", W.pick()===null);
  W.run("kitDinPickOpen('"+TUE+"','sheet')"); W.run("kitRotPickClose()");
  ok("Close closes it and repaints the sheet’s own screen", W.pick()===null);
}
{ const W=world({plan:PLAN,dry:true});
  W.run("kitDinPickOpen('"+MON+"','sheet')"); W.run("kitRotPickGo('m2')");
  ok("dry-run: the screen copy changes, nothing is written", W.plan()[MON].mid==="m2"&&W.writes.length===0);
  const K=world({plan:PLAN,mom:false});
  K.run("kitDinPickOpen('"+MON+"','sheet')");
  ok("no gate: the picker doesn’t open", K.pick()===null);
  K.run("kitSlotsPickSet({kind:'p',iso:'"+MON+"',slot:'d'},{mid:'m2'})");
  ok("no gate: a stray set writes nothing", K.plan()[MON].mid==="m1"&&K.writes.length===0);
}

console.log("\n── a rotation’s day counts as hand-edited afterwards (KITROT2’s own check) ──");
{ const ROT={fall:{name:"Fall",emoji:"🍂",startDate:"2026-10-19",endDate:"2026-11-15",types:["d"],weeks:[[{d:"Burgers",sd:"Roasted Broccoli"},{d:"Tacos"},{d:"Burgers"},{d:"Tacos"},{d:"Burgers"},{d:"Tacos"},{d:"Burgers"}]],ts:1}};
  const plan={[MON]:{mid:"m1",sideList:[{mid:"m3"}],fromRot:{d:{id:"fall",wk:0,dow:0}}},[TUE]:{mid:"m2",fromRot:{d:{id:"fall",wk:0,dow:1}}}};
  const W=world({plan:plan,rots:ROT});
  const r0=W.run("kitRotRunPlan(kitRotAll().fall,'fall',{from:'"+MON+"'})");
  ok("before: the rotation’s own dinner is not hand-edited; the run counts the day as its own (same) and fills only the days after", W.run("kitRotHandEdited('"+MON+"',['d'])")===false&&r0.same===2&&r0.kept.length===0&&r0.days.indexOf(MON)<0&&!Object.keys(r0.up).some(k=>k.indexOf(MON)===0||k.indexOf(TUE)===0), r0);
  W.run("kitDinPickOpen('"+MON+"','sheet')"); W.run("kitRotPickGo('m2')");
  ok("after ✎ Change: the stamp stays on the day, the dinner differs → hand-edited", J(W.plan()[MON])===J({fromRot:{d:{id:"fall",wk:0,dow:0}},mid:"m2"})&&W.run("kitRotHandEdited('"+MON+"',['d'])")===true);
  const run=W.run("kitRotRunPlan(kitRotAll().fall,'fall',{from:'"+MON+"'})");
  ok("the running rotation keeps the day (never writes it back); the days after still fill", J(run.kept)===J([MON])&&run.days.indexOf(MON)<0&&run.days.length>0&&!Object.keys(run.up).some(k=>k.indexOf(MON)===0), run);
  W.run("kitDinPickOpen('"+TUE+"','sheet')"); W.run("kitRotPickClear()");
  ok("✕ Clear on a rotation-written day keeps its stamp ({fromRot} alone, set not removed) and counts as hand-edited", J(W.plan()[TUE])===J({fromRot:{d:{id:"fall",wk:0,dow:1}}})&&J(W.writes[1])===J(["set","kitchen/plan/"+TUE,{fromRot:{d:{id:"fall",wk:0,dow:1}}}])&&W.run("kitRotHandEdited('"+TUE+"',['d'])")===true);
  W.ctx.kitRotations.winter={name:"Winter",emoji:"❄",startDate:"2026-11-16",endDate:"2026-12-13",types:["d"],weeks:[[{d:"Tacos"},{d:"Burgers"},{d:"Tacos"},{d:"Burgers"},{d:"Tacos"},{d:"Burgers"},{d:"Tacos"}]],ts:2};
  const h=W.sheet("2026-11-16");   // the next rotation's first day: queued, not on the calendar yet
  ok("a queued “coming” day shows ✎ Change (no 🍽 Eating out, as before)", CHG("2026-11-16").test(h)&&/coming · ❄ Winter/.test(h)&&!/Eating out/.test(h), h);
  W.run("kitDinPickOpen('2026-11-16','sheet')");
  ok("…its picker reads what is REALLY on the calendar: nothing yet, so no ✕ Clear", /kitRotPickQ/.test(W.sheet("2026-11-16"))&&!/now: /.test(W.sheet("2026-11-16"))&&!/kitRotPickClear/.test(W.sheet("2026-11-16")));
  W.run("kitRotPickGo('m1')");
  ok("picking there puts a real dinner on the day — hers now (no stamp), so the coming rotation will keep it", J(W.plan()["2026-11-16"])===J({mid:"m1"})&&W.run("kitRotHandEdited('2026-11-16',['d'])")===true&&W.run("kitRotComingAt('2026-11-16','d')")===null);
}

console.log("\n── 🗓 Plan it on an empty day ──");
{ const W=world({plan:PLAN,tab:"moms-plan"});
  const h=W.sheet("2026-10-30");
  ok("Mom’s Day: No dinner planned · 🗓 Plan it opens the picker here · “or plan the week ›” keeps the old route", /No dinner planned<\/span><button class="act" style="background:#fff7ed;color:#c2410c" onclick="kitDinPickOpen\('2026-10-30','sheet'\)">🗓 Plan it<\/button><span onclick="mpGoto\('meals'\);kitPickDay\('2026-10-30'\)"[^>]*>or plan the week ›<\/span>/.test(h), h);
  W.run("kitDinPickOpen('2026-10-30','sheet')");
  const o=W.sheet("2026-10-30");
  ok("tap → the picker opens under the row, no ✕ Clear (nothing to clear)", /kitRotPickQ/.test(o)&&/🍽 Dinner · Fri, Oct 30/.test(o)&&!/kitRotPickClear/.test(o)&&!/now: /.test(o));
  W.run("kitRotPickGo('m1')");
  ok("picking plans the day: kitAssign(iso,{mid}) — one targeted set", J(W.plan()["2026-10-30"])===J({mid:"m1"})&&J(W.writes)===J([["set","kitchen/plan/2026-10-30",{mid:"m1"}]]));
  const S=world({plan:PLAN});
  ok("Schedule ▸ Calendar: 🗓 Plan it too, without the Meals link (that page is Mom’s Day’s)", /kitDinPickOpen\('2026-10-30','sheet'\)">🗓 Plan it<\/button><\/div>/.test(S.sheet("2026-10-30"))&&!/plan the week/.test(S.sheet("2026-10-30")));
  const B=world({plan:PLAN,tab:"moms-plan",base:true});
  ok("(base, for the record: Plan it left the sheet for Meals)", /onclick="mpGoto\('meals'\);kitPickDay\('2026-10-30'\)">🗓 Plan it/.test(B.sheet("2026-10-30")));
}

console.log("\n── Mom’s Day: the Tonight card ──");
{ const W=world({plan:PLAN,tab:"moms-plan"});
  const c=W.card(MON);
  ok("a planned dinner: ✎ Change in the header, between ✓ We ate it and 🗓 Plan week", /✓ We ate it<\/button><button onclick="kitDinPickOpen\('2026-10-26','card'\)"[^>]*>✎ Change<\/button><button onclick="mpGoto\('meals'\)"/.test(c), c);
  ok("an eaten day: no ✎ Change", !/✎ Change/.test(W.card(SUN)));
  ok("an empty day: no ✎ Change (Tap to jot stays)", !/✎ Change/.test(W.card("2026-10-30"))&&/Tap to jot/.test(W.card("2026-10-30")));
  W.run("kitDinPickOpen('"+MON+"','card')");
  ok("tap → the picker opens in the card, under the header", /Plan week →<\/button><\/span><\/div><div style="padding:0 14px 10px"><div style="padding:8px 10px;background:#fff;border:1\.5px dashed #B45309/.test(W.card(MON))&&/now: Burgers/.test(W.card(MON)));
  ok("…and the “Also today” sheet on the same page does NOT draw it", !/kitRotPickQ/.test(W.sheet(MON)));
  W.run("kitRotPickGo('m2')");
  ok("picking writes through kitAssign, same as the sheet", J(W.plan()[MON])===J({b:{mid:"m4"},mid:"m2"})&&W.writes.length===1&&W.pick()===null&&/🌮 Tacos/.test(W.card(MON)));
  const K=world({plan:PLAN,mom:false});
  ok("no gate: no ✎ Change on the card", !/✎ Change/.test(K.card(MON)));
}

console.log("\n── the word: Dinner by default, Supper when the family says so ──");
{ const W=world({plan:PLAN,tab:"moms-plan"});
  ok("default: Dinner", W.run("kitDinnerWord()")==="Dinner"&&W.run("kitRotTypeMeta('d')[2]")==="Dinner"&&/<span class="lbl">Dinner<\/span>/.test(W.sheet(MON))&&/Tonight\'s dinner/.test(W.card(MON))&&/No dinner planned/.test(W.sheet("2026-10-30")));
  ok("the Family rules card: two choices, Dinner checked", /The evening meal/.test(W.run("kitDinWordRuleHTML()"))&&/name="kit-din-word" checked onchange="kitDinnerWordSet\('Dinner'\)"/.test(W.run("kitDinWordRuleHTML()"))&&/name="kit-din-word"  onchange="kitDinnerWordSet\('Supper'\)"/.test(W.run("kitDinWordRuleHTML()")));
  W.run("kitDinnerWordSet('Supper')");
  ok("Mom picks Supper: ONE targeted write, settings/mealWords/dinner = \"Supper\", kept on the device, the screen repaints", J(W.writes)===J([["set","settings/mealWords/dinner","Supper"]])&&W.ls.ha_kit_mealwords==='{"dinner":"Supper"}'&&W.renders===1);
  ok("the day sheet: Mom’s label and the kid’s label say Supper", /<span class="lbl">Supper<\/span>/.test(W.sheet(MON))&&/<span class="lbl">Supper<\/span><span style="flex:1"><b>🍔 Burgers/.test(W.sheet(MON,"lucy")));
  ok("an empty day: No supper planned", /No supper planned/.test(W.sheet("2026-10-30")));
  ok("the Tonight card: Tonight’s supper", /Tonight\'s supper/.test(W.card(MON)));
  ok("the picker header / builder / This month label: 🍽 Supper (kitRotTypeMeta); b / l / s unchanged", W.run("kitRotTypeMeta('d')[2]")==="Supper"&&W.run("kitRotTypeMeta('b')[2]")==="Breakfast"&&W.run("kitRotTypeMeta('b_veg')[2]")==="Breakfast · vegetable"&&W.run("kitRotKindsTxt(['d','l'])")==="suppers, lunches");
  W.run("kitDinPickOpen('"+MON+"','sheet')");
  ok("the open picker says 🍽 Supper · Mon, Oct 26", /🍽 Supper · Mon, Oct 26 · now: Burgers/.test(W.sheet(MON)));
  ok("the Family rules card now checks Supper", /checked onchange="kitDinnerWordSet\('Supper'\)"/.test(W.run("kitDinWordRuleHTML()")));
  W.run("kitDinnerWordSet('Brunch')");
  ok("an unknown word is ignored (still Supper, no write)", W.run("kitDinnerWord()")==="Supper"&&W.writes.length===1);
  ok("the live listener: a changed word says so (repaint), the same word doesn’t; a bad value falls back to Dinner", W.run("kitMealWordsOnValue({dinner:'Supper'})")===false&&W.run("kitMealWordsOnValue({dinner:'Dinner'})")===true&&W.run("kitMealWordsOnValue({dinner:'x'})")===false&&W.run("kitDinnerWord()")==="Dinner"&&W.run("kitMealWordsOnValue(null)")===false);
  const D=world({plan:PLAN,dry:true}); D.run("kitDinnerWordSet('Supper')");
  ok("dry-run: the word changes on screen, nothing is written", D.run("kitDinnerWord()")==="Supper"&&D.writes.length===0);
  const K=world({plan:PLAN,mom:false}); K.run("kitDinnerWordSet('Supper')");
  ok("not Mom: no change, no write", K.run("kitDinnerWord()")==="Dinner"&&K.writes.length===0);
  const L=world({plan:PLAN}); L.ls.ha_kit_mealwords='{"dinner":"Supper"}'; L.run("kitMealWordsLoad()");
  ok("a kid’s device reads the word from its own copy before sign-in", L.run("kitDinnerWord()")==="Supper"&&/<span class="lbl">Supper<\/span>/.test(L.sheet(MON,"lucy")));
  ok("nothing else renamed: the stored type list, the move names and the import words stay as they were", /const KIT_ROT_TYPES=\[\["d","🍽","Dinner"\]/.test(src)&&/d:\["dinner","dinners"\]/.test(src)&&/sw==="dinner"\|\|sw==="supper"/.test(src));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
