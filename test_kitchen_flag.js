/*
 * 🍳 KITFLAG (her decisions 2026-10-22, final): FLAG a meal whose kid ratings average under two stars over its last
 * three servings; send Mom ONE note suggesting a swap in the rotation; an EATING-OUT mark on a day drops that meal's
 * ingredients from the grocery list and does not move the rotation.
 *
 *   · threshold math on the real block: three servings under 2★ → flagged ("1.7★"); one high rating lifts it
 *   · fewer than three servings, or one of the three with no kid vote → never flagged; Mom's / Dad's votes never count
 *   · the note fires once (kitchen/flags/{mid} = {at, avg, noted:true}), ✓ Got it clears the row, a lift removes the
 *     record, a new drop flags and notes again; nothing is written off Mom's device, unsynced, or in dry-run
 *   · the real kitRate stamps a kid's vote on the serving eaten within a day and a half (plan/{iso}/rate/{kid})
 *   · Swap… opens the builder on the slot that holds the meal (running rotation first), or the day sheet of the
 *     meal's next planned day when it is in no rotation
 *   · 🍽 Eating out: plan/{iso}/{slot}/out — the grocery feeders skip the meal and its sides, prep steps hide, the
 *     dinner reads "out" (never owed), the move chain hops the day, the rotation stays put; a second tap removes the
 *     leaf and every read comes back exactly as before; kids see text, no buttons
 *   · nothing flagged and nothing out → every hooked read is byte-identical to the same code without the block
 *
 *   run:  node test_kitchen_flag.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing line "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// KITFLAG_START","// KITFLAG_END");
const SIDES=cut("// KITSIDES_START","// KITSIDES_END");
const TODAY="2026-10-23";   // a Friday
const D=(iso,h)=>new Date(iso+"T"+(h||"18")+":30:00").getTime();

console.log("── the block and its hooks ──");
ok("marked block exists, once", src.indexOf("// KITFLAG_START")>0&&src.indexOf("// KITFLAG_END")>src.indexOf("// KITFLAG_START")&&src.split("// KITFLAG_START").length===2);
ok("kitRate hands a kid's vote to the serving", /kitFlagStampRate\(id,kid,next\)/.test(fn("kitRate")));
{ const g=fn("grEatApply"); ok("✓ We ate it stamps the kids' votes on the serving, after the eaten write", g.indexOf("kitFlagServed(E.iso,E.mid)")>g.indexOf("'/eaten').set(plan.eaten)")); }
{ const i=src.indexOf("const _ro=grRanOutHTML();"); ok("Mom's Day 🔴 Now carries the flag rows right after 🛒 ran out", src.slice(i,src.indexOf("\n",src.indexOf("\n",i)+1)).indexOf("kitFlagNowHTML()")>0); }
ok("kitchen/flags listener is wired with the other kitchen nodes", /kitFlagListen\(\);[^\n]*\n\s*db\.ref\("kitchen\/prepDone"\)/.test(src));
ok("library row: ⚠ sits by the name, before the vote chips", /esc\(m\.name\)\+'<\/span>'\+\(typeof kitFlagMark==="function"\?kitFlagMark\(mid\):''\)[^\n]*\n\s*\+kitRateChips\('meal',mid\)/.test(src));
ok("week list: ⚠ and 🍽 eating out on the dinner line and the b/l/s bits", /what\+=kitFlagMark\(pl&&pl\.mid\)\+kitOutLbl\(iso,'d'\)/.test(src)&&/slotBits\.push\([^\n]*kitFlagMark\(sv\.mid\)\+kitOutLbl\(iso,sp\[0\]\)/.test(src));
ok("builder slot: ⚠ by the meal name", /\(v\?esc\(v\)\+\(typeof kitFlagMarkName==="function"\?kitFlagMarkName\(v\):''\):/.test(fn("kitRotBHTML")));
{ const s=fn("calDaySheetHTML");
  ok("day sheet: 🍽 Eating out rides with ➡ Move forward beside ✗ Didn’t happen; an out day offers only the way back", /const _mvBtn=\(typeof kitOutBtn==="function"\?kitOutBtn\(iso,'d'\):''\)\+'<button/.test(s)&&/else if\(din\.st==="out"\) h\+=\(typeof kitOutBtn==="function"\?kitOutBtn\(iso,'d'\):''\);/.test(s)&&/din\.st==="out"\) h\+='<div[^\n]*Eating out<\/div>'/.test(s));
  const kid=s.slice(s.indexOf("if(L.meals&&kidMode)"),s.indexOf("} else if(L.meals)"));
  ok("a kid's day sheet says eating out as text, no button", /din\.st==="out"\?' <span[^<]*eating out<\/span>'/.test(kid)&&!/kitOutToggle|kitOutBtn/.test(kid)); }
ok("b/l/s rows: label by the name, 🍽 Eating out beside ➡ Move (Mom only)", /kitFlagMark\(sv\.mid\)\+kitOutLbl\(iso,sp\[0\]\)/.test(fn("_calSlotRows"))&&/➡ Move<\/button>'\+\(typeof kitOutBtn==="function"\?kitOutBtn\(iso,sp\[0\]\):''\)\)/.test(fn("_calSlotRows")));
ok("month cells say eating out", /nm\+\(typeof kitOutTxt==="function"\?kitOutTxt\(iso,sp\[0\]\):''\)/.test(src)&&/_din\.name\+\(typeof kitOutTxt==="function"\?kitOutTxt\(iso,'d'\):''\)/.test(src));
ok("Mom's Day dinner card: the badge replaces ✓ We ate it", /kitOutIs\(iso,'d'\)\)\?'<span[^\n]*Eating out<\/span>'[^\n]*\n\s*:\(\(dpl&&kitEatGate\(\)\)\?'<button onclick="kitMarkEaten/.test(fn("mdCardDinner")));
ok("prep steps hide on an eating-out day", /kitOutIs\(iso,'d'\)\) return \[\];/.test(fn("kitPrepSteps")));
ok("both grocery feeders read the day through kitOutStrip", /p=kitOutStrip\(iso,p\)/.test(fn("grWeekSources"))&&/p=kitOutStrip\(iso,p\)/.test(fn("grWeekNeeds")));
ok("the move chain treats an out slot as fixed", /kitOutIs\(iso,slot\)/.test(fn("_kitMvFixed")));
ok("the dinner status knows 'out'", /\?"out":\(iso<calToday\(\)/.test(fn("_calDinnerOf")));
{ const refs=(BLOCK.replace(/function kitFlagListen[\s\S]*?\n\}/,"").match(/\.ref\([^)]*\)/g))||[];   // the listener reads kitchen/flags; every other ref writes
  ok("every write in the block is targeted (plan/{iso}/… or flags/{mid}…), never a whole node", refs.length>=8&&refs.every(r=>/\.ref\('kitchen\/(plan|flags)\/'\+/.test(r)), refs);
  ok("writes go through db only when db && !_dryRun()", /function kitFlagDb\(\)\{ return \(typeof db!=='undefined'&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\)\?db:null; \}/.test(BLOCK)&&!/typeof db!=='undefined'&&db\)\s*(db|d)\.ref/.test(BLOCK.replace(/function kitFlagListen[\s\S]*?\n\}/,""))); }

// ── a tiny app around the real slices ──────────────────────────────────────────────────────────
function world(o){
  o=o||{};
  const store={};
  const ctx={console:console, writes:[], toasts:[], gotos:[], renders:0, mom:o.mom!==false, dry:!!o.dry,
    HA_LS:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{ store[k]=String(v); }},
    document:{getElementById:()=>null}, renderMomsPlan:()=>{ ctx.renders++; }, renderAll:()=>{ ctx.renders++; },
    ROSTER:["lincoln","ellis","lucy","julian"], HA_IS_HOWE:false,
    kitMeals:o.meals||{}, kitPlan:o.plan||{}, kitRotations:o.rots||{}, kitPrepDone:{}, kitUsuals:{}, kitPantry:{}, grData:{skipneed:{}},
    mpGoto:v=>ctx.gotos.push(v), kitPinGate:then=>then(), kitRotRender:()=>{ ctx.renders++; }, kitRotPickHTML:()=>'', mwToast:t=>ctx.toasts.push(t),
    kitMealsLSSave:()=>{}, kitSlotText:()=>{}, kitMoveForward:()=>{},
    mpSchMode:"today", mpSchWho:"lincoln", calPreviewMonth:null, calDaySel:null,
    gwParseDate:iso=>new Date(iso+"T12:00:00"),
    grIngParse:l=>({name:String(l).trim(),unit:""}), grIsBasic:()=>false, grNeedSkip:()=>false, grPanFind:()=>null, grFindDup:()=>null, grKey:n=>String(n).toLowerCase(),
    kitRotComingAt:(iso,slot)=>(o.coming&&o.coming[iso+slot])||null, kitRotComingLbl:()=>'coming',
    kitPlanRec:iso=>ctx.kitPlan[iso],
    kitRotEdit:null, kitRotOpen:null,
  };
  ctx.SL_KIDS=ctx.ROSTER.slice();
  ctx.KIT_SLOTS=[["b","🌅","Breakfast"],["l","☀️","Lunch"],["s","🍎","Snack"]];
  ctx.momHere=()=>ctx.mom; ctx._dryRun=()=>ctx.dry; ctx._todayStr=()=>TODAY; ctx.calToday=()=>TODAY;
  ctx.db={ref:p=>({set:v=>ctx.writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>ctx.writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>ctx.writes.push(["remove",p]),on:()=>{}})};
  ctx.kitRotSynced={plan:true,rots:true};
  vm.createContext(ctx);
  const CODE=[ line("const KIT_RATES="), line("const KIT_RATE_META="), line("const KIT_ROT_TYPES="), line("const KIT_ROT_DAYS="), line("const KIT_MOVE_NAMES="),
    line("let kitRotB="), line("let kitRotPick="), "const KIT_ROT_DEFAULT={};",
    fn("esc"), fn("kitIsoPlus"), fn("kitRate"), fn("kitPlanFor"), fn("kitSidesTxt"), fn("kitPlanSlot"), fn("kitPrepMins"), fn("kitPrepSteps"),
    fn("grWeekSources"), fn("grWeekNeeds"), fn("_kitMvGet"), fn("_kitMvFixed"), fn("kitMoveChain"), fn("_calDinnerOf"), fn("_calSlotRows"),
    fn("kitEatGate"), fn("_kitRefresh"), fn("kitRotAll"), fn("kitRotIsoOk"), fn("kitRotStatus"), fn("kitRotTypes"), fn("kitRotTypeMeta"), fn("kitRotNorm"),
    fn("kitRotMealByName"), fn("kitRotBStart"), fn("kitRotBWeeksOf"), fn("kitRotBBlankWeek"), fn("kitRotPickOpen"), fn("kitRotBHTML"),
    SIDES, o.noBlock?"":BLOCK ].join("\n");
  vm.runInContext(CODE,ctx);
  if(!o.noBlock) vm.runInContext("kitFlagSynced="+(o.unsynced?"false":"true"),ctx);
  return {ctx:ctx, run:e=>vm.runInContext(e,ctx), writes:(f)=>ctx.writes.filter(w=>!f||w[1].indexOf(f)===0)};
}
const MEALS=()=>({
  m1:{name:"Tacos",emoji:"🌮",ing:"beef\ntaco shells",prep:[{when:"nb",label:"thaw the beef"}],ratings:{lincoln:"no",ellis:"no",lucy:"like"}},
  m2:{name:"Chili",ing:"beans",ratings:{}},
  m3:{name:"Pizza",ing:"dough\ncheese",ratings:{}},
});
// Tacos: three servings, the kids' votes on each → (1+3) + (1+1+3) + (1) = 10 over 6 votes = 1.67★
const LOW=()=>({
  "2026-10-01":{mid:"m1",eaten:D("2026-10-01"),rate:{lincoln:"no",ellis:"like"}},
  "2026-10-08":{mid:"m1",eaten:D("2026-10-08"),rate:{lincoln:"no",ellis:"no",lucy:"like",mom:"love"}},   // Mom's vote never counts
  "2026-10-15":{mid:"m1",eaten:D("2026-10-15"),rate:{lincoln:"no",dad:"love"}},
});
const ROTS=()=>({ fall:{name:"Fall",emoji:"🍂",startDate:"2026-10-19",endDate:"2026-11-15",types:["d","l"],weeks:[[{d:"Chili",l:"PB&J"},{d:"Tacos",l:"Soup"},{d:"Pizza"},{},{},{},{}]],ts:1} });

console.log("\n── the threshold ──");
{ const w=world({meals:MEALS(),plan:LOW()});
  ok("three servings under 2★ → flagged", w.run("kitMealFlagged('m1')")===true);
  const a=w.run("kitFlagAvg('m1')");
  ok("the average pools every kid vote of the last three servings (10 / 6)", a&&Math.abs(a.avg-10/6)<1e-9&&a.n===6, a);
  ok("servings come newest first", JSON.stringify(a.servings.map(s=>s.iso))==='["2026-10-15","2026-10-08","2026-10-01"]');
  ok("it reads 1.7★", w.run("kitFlagStars(kitFlagAvg('m1').avg)")==="1.7★");
  const mark=w.run("kitFlagMark('m1')");
  ok("⚠ with the number in its title", /⚠/.test(mark)&&/1\.7★ over the last 3/.test(mark), mark);
  ok("the builder's name lookup finds the same ⚠", w.run("kitFlagMarkName('tacos')")===mark&&w.run("kitFlagMarkName('Chili')")==="");
  ok("Chili / Pizza: no servings → no flag, no mark", w.run("kitMealFlagged('m2')")===false&&w.run("kitFlagMark('m2')")===""&&w.run("kitFlagMark('')")==="");
  // one high serving lifts it: (5+5) + (1) + (1+1+3) = 16 over 6 = 2.67★
  w.ctx.kitPlan["2026-10-22"]={mid:"m1",eaten:D("2026-10-22"),rate:{lincoln:"love",ellis:"love"}};
  ok("one high serving lifts it off the flag", w.run("kitMealFlagged('m1')")===false&&Math.abs(w.run("kitFlagAvg('m1').avg")-16/6)<1e-9);
  ok("exactly 2★ is not under", (()=>{ w.ctx.kitPlan["2026-10-22"].rate={lincoln:"like",ellis:"no"}; /* (3+1)+(1)+(1+1+3)=10/6 */ w.ctx.kitPlan["2026-10-15"].rate={lincoln:"like",ellis:"no"}; /* (3+1)+(3+1)+(1+1+3)=13/7 <2 */ w.ctx.kitPlan["2026-10-08"].rate={lincoln:"like",ellis:"like",lucy:"no"}; /* 4+4+7=15/7=2.14 */ return w.run("kitMealFlagged('m1')")===false; })());
}
{ const w=world({meals:MEALS(),plan:{"2026-10-01":{mid:"m1",eaten:D("2026-10-01"),rate:{lincoln:"no"}},"2026-10-08":{mid:"m1",eaten:D("2026-10-08"),rate:{lincoln:"no"}}}});
  ok("two servings, both 🚫 → never flagged", w.run("kitMealFlagged('m1')")===false&&w.run("kitFlagAvg('m1')")===null);
  w.ctx.kitPlan["2026-10-15"]={mid:"m1",eaten:D("2026-10-15"),rate:{mom:"no",dad:"no"}};
  ok("a third serving with only Mom's and Dad's votes doesn't count as rated → no flag", w.run("kitMealFlagged('m1')")===false);
  w.ctx.kitPlan["2026-10-16"]={mid:"m1",skipped:D("2026-10-16"),rate:{lincoln:"no"}};
  w.ctx.kitPlan["2026-10-17"]={mid:"m1"};
  ok("a didn't-happen day and a planned day are not servings", w.run("kitFlagServings('m1').length")===3);
  w.ctx.kitPlan["2026-10-15"].rate.julian="no";
  ok("…one kid vote on it and the three servings flag", w.run("kitMealFlagged('m1')")===true);
}

console.log("\n── the note: once per flag ──");
{ const w=world({meals:MEALS(),plan:LOW(),rots:ROTS()});
  const r1=w.run("kitFlagNowHTML()");
  const set=w.writes("kitchen/flags/");
  ok("first render on Mom's device writes kitchen/flags/m1 = {at, avg, noted:true}", set.length===1&&set[0][0]==="set"&&set[0][1]==="kitchen/flags/m1"&&set[0][2].noted===true&&set[0][2].avg===1.67&&typeof set[0][2].at==="number", set);
  ok("one row: the meal, the number, the rotation to swap it in", r1.n===1&&/🌮 Tacos<\/b> isn’t landing — 1\.7★ over the last 3\. Swap it in 🍂 Fall\?/.test(r1.html), r1.html);
  ok("✓ Got it and Swap… buttons", /onclick="kitFlagGotIt\('m1'\)"[^>]*>✓ Got it</.test(r1.html)&&/onclick="kitFlagSwap\('m1'\)"[^>]*>Swap…</.test(r1.html));
  const r2=w.run("kitFlagNowHTML()");
  ok("a second render writes nothing more, the row stays", w.writes("kitchen/flags/").length===1&&r2.n===1);
  w.run("kitFlagGotIt('m1')");
  const got=w.writes("kitchen/flags/m1/got");
  ok("✓ Got it writes flags/m1/got and the row goes; the record stays", got.length===1&&got[0][0]==="set"&&w.run("kitFlagNowHTML().n")===0&&w.run("kitFlags").m1.noted===true);
  ok("…and still no second note", w.writes("kitchen/flags/").length===2);
  ok("the ⚠ stays while it is flagged", /⚠/.test(w.run("kitFlagMark('m1')")));
  // a serving that lifts the average clears the record
  w.ctx.kitMeals.m1.ratings={lincoln:"love",ellis:"love",lucy:"love"};
  w.ctx.kitPlan["2026-10-22"]={mid:"m1",eaten:D("2026-10-22")};
  w.run("kitFlagServed('2026-10-22','m1')");
  const up=w.writes("kitchen/plan/2026-10-22/rate");
  ok("✓ We ate it copies the kids' votes onto the serving (one targeted update)", up.length===1&&up[0][0]==="update"&&JSON.stringify(up[0][2])==='{"lincoln":"love","ellis":"love","lucy":"love"}', up);
  ok("…which lifts the meal and removes kitchen/flags/m1", w.run("kitMealFlagged('m1')")===false&&w.writes("kitchen/flags/").slice(-1)[0][0]==="remove"&&w.writes("kitchen/flags/").slice(-1)[0][1]==="kitchen/flags/m1"&&!w.run("kitFlags").m1);
  ok("…no ⚠, no row", w.run("kitFlagMark('m1')")===""&&w.run("kitFlagNowHTML().n")===0);
  // a new drop flags and notes again
  w.ctx.kitMeals.m1.ratings={lincoln:"no",ellis:"no",lucy:"no"};
  w.ctx.kitPlan["2026-10-29"]={mid:"m1",eaten:D("2026-10-29")}; w.run("kitFlagServed('2026-10-29','m1')");
  w.ctx.kitPlan["2026-11-05"]={mid:"m1",eaten:D("2026-11-05")}; w.run("kitFlagServed('2026-11-05','m1')");
  ok("two 🚫 servings after one 😍 serving: 11 over 9 → not yet", w.run("kitMealFlagged('m1')")===false);
  w.ctx.kitPlan["2026-11-12"]={mid:"m1",eaten:D("2026-11-12")}; w.run("kitFlagServed('2026-11-12','m1')");
  const again=w.writes("kitchen/flags/m1").filter(x=>x[0]==="set"&&x[1]==="kitchen/flags/m1");
  ok("a third 🚫 serving flags again and notes again (a fresh record, noted:true, no got)", w.run("kitMealFlagged('m1')")===true&&again.length===2&&again[1][2].noted===true&&again[1][2].got===undefined&&w.run("kitFlagNowHTML().n")===1);
  ok("every flag write is targeted under kitchen/flags/m1 or kitchen/plan/{iso}/rate", w.ctx.writes.every(x=>/^kitchen\/(flags\/m1(\/got)?|plan\/\d{4}-\d\d-\d\d\/rate)$/.test(x[1])), w.ctx.writes.map(x=>x[1]));
}
{ const w=world({meals:MEALS(),plan:LOW(),rots:ROTS(),mom:false});
  const r=w.run("kitFlagNowHTML()");
  ok("not Mom's device: nothing is written, nothing noted", w.ctx.writes.length===0&&r.n===0&&Object.keys(w.run("kitFlags")).length===0);
}
{ const w=world({meals:MEALS(),plan:LOW(),rots:ROTS(),unsynced:true});
  w.run("kitFlagNowHTML()");
  ok("the flags listener hasn't fired yet: nothing is written from a stale copy", w.ctx.writes.length===0);
  w.run("kitFlagSynced=true"); w.ctx.kitRotSynced.plan=false; w.run("kitFlagNowHTML()");
  ok("…nor before the plan listener has", w.ctx.writes.length===0);
}
{ const w=world({meals:MEALS(),plan:LOW(),rots:ROTS(),dry:true});
  w.run("kitFlagNowHTML()"); w.run("kitFlagGotIt('m1')"); w.run("kitFlagServed('2026-10-15','m1')"); w.run("kitOutToggle('2026-10-15','d')");
  ok("?dryrun=1: no write of any kind", w.ctx.writes.length===0);
}

console.log("\n── the real kitRate stamps the serving ──");
{ const now=Date.now(), iso="2026-10-22";
  const w=world({meals:{m1:{name:"Tacos",ing:"",ratings:{}}},plan:{[iso]:{mid:"m1",eaten:now-3600e3},"2026-10-01":{mid:"m1",eaten:now-30*864e5,rate:{lincoln:"no"}}}});
  w.run("kitRate('meal','m1','lincoln')");
  ok("Lincoln's tap an hour after dinner: the meal's vote AND the serving's", JSON.stringify(w.ctx.writes)==='[["set","kitchen/meals/m1/ratings/lincoln","love"],["set","kitchen/plan/'+iso+'/rate/lincoln","love"]]'&&w.ctx.kitPlan[iso].rate.lincoln==="love", w.ctx.writes);
  w.ctx.writes.length=0; w.run("kitRate('meal','m1','mom')");
  ok("Mom's tap: the meal only — never the serving", JSON.stringify(w.ctx.writes.map(x=>x[1]))==='["kitchen/meals/m1/ratings/mom"]'&&!w.ctx.kitPlan[iso].rate.mom);
  w.ctx.writes.length=0; w.run("kitRate('meal','m1','lincoln'); kitRate('meal','m1','lincoln'); kitRate('meal','m1','lincoln')");   // like → no → unset
  ok("cycling to unset removes the serving's leaf too", w.ctx.writes.slice(-1)[0][0]==="remove"&&w.ctx.writes.slice(-1)[0][1]==="kitchen/plan/"+iso+"/rate/lincoln"&&!w.ctx.kitPlan[iso].rate);
  w.ctx.kitPlan[iso].eaten=now-3*864e5; w.ctx.writes.length=0; w.run("kitRate('meal','m1','ellis')");
  ok("a serving three days old is left alone", w.ctx.writes.length===1&&w.ctx.writes[0][1]==="kitchen/meals/m1/ratings/ellis");
  ok("a vote on a usual never touches the plan", (()=>{ w.ctx.kitUsuals.u1={name:"Yogurt",ratings:{}}; w.ctx.writes.length=0; w.run("kitRate('usual','u1','lucy')"); return w.ctx.writes.length===1&&w.ctx.writes[0][1]==="kitchen/usuals/u1/ratings/lucy"; })());
}

console.log("\n── Swap… ──");
{ const w=world({meals:MEALS(),plan:LOW(),rots:ROTS()});
  const rs=w.run("kitFlagRotSlot('m1')");
  ok("finds the slot that holds Tacos: Fall, week 1, Tue, dinner", rs&&rs.id==="fall"&&rs.w===0&&rs.i===1&&rs.slot==="d"&&rs.name==="Fall", rs);
  w.run("kitFlagSwap('m1')");
  ok("opens the builder on Fall with that slot's picker open, on the Meals page", w.run("kitRotB&&kitRotB.id")==="fall"&&w.run("JSON.stringify(kitRotPick)")==='{"q":"","tag":"","kind":"b","w":0,"i":1,"slot":"d"}'&&w.ctx.gotos.slice(-1)[0]==="meals", [w.run("kitRotB&&kitRotB.id"),w.run("kitRotPick")]);
  ok("the builder shows ⚠ on that slot and only there", (()=>{ const h=w.run("kitRotBHTML()"); return (h.match(/⚠/g)||[]).length===1&&/Tacos<span[^>]*>⚠<\/span>/.test(h); })());
  ok("a lunch rotation is found in its lunch slot", (()=>{ w.ctx.kitRotations={lun:{name:"Lunches",types:["l"],weeks:[[{d:"Tacos",l:"Soup"},{l:"Tacos"}]]}}; const r=w.run("kitFlagRotSlot('m1')"); return r&&r.id==="lun"&&r.i===1&&r.slot==="l"; })());
  ok("a running rotation wins over an ended one that also holds it", (()=>{ w.ctx.kitRotations={old:{name:"Old",startDate:"2026-01-05",endDate:"2026-02-01",weeks:[[{d:"Tacos"}]]},fall:ROTS().fall}; return w.run("kitFlagRotSlot('m1').id")==="fall"; })());
}
{ const w=world({meals:MEALS(),plan:Object.assign(LOW(),{"2026-10-24":{mid:"m2"},"2026-10-27":{mid:"m3",l:{mid:"m1"}}})});
  ok("in no rotation: null", w.run("kitFlagRotSlot('m1')")===null);
  ok("the note offers its next planned day instead", /Swap it on Tue, Oct 27\?/.test(w.run("kitFlagNowHTML().html")));
  w.run("kitFlagSwap('m1')");
  ok("Swap… opens the calendar's day sheet on that day (month view, family lens)", w.ctx.calDaySel==="2026-10-27"&&w.ctx.calPreviewMonth==="2026-10"&&w.ctx.mpSchMode==="month"&&w.ctx.mpSchWho==="all"&&w.ctx.gotos.slice(-1)[0]==="cal"&&w.run("kitRotB")===null);
  delete w.ctx.kitPlan["2026-10-27"]; w.ctx.gotos.length=0; w.run("kitFlagSwap('m1')");
  ok("planned nowhere: the Meals page", w.ctx.gotos.join()==="meals"&&/Swap it for something else\?/.test(w.run("kitFlagNowHTML().html")));
}

console.log("\n── 🍽 Eating out ──");
const PLAN=()=>({
  "2026-10-22":{mid:"m3"},                                              // yesterday, not marked (owed)
  [TODAY]:{mid:"m1",sides:"peas · rice",l:{mid:"m2"},b:{txt:"toast"}},
  "2026-10-24":{mid:"m3",s:{mid:"m2"}},
  "2026-10-25":{mid:"m2"},
});
{ const w=world({meals:MEALS(),plan:PLAN()});
  const snap=()=>JSON.stringify({src:w.run("grWeekSources(_todayStr(),7)"),needs:w.run("grWeekNeeds()"),prep:w.run("kitPrepSteps(_todayStr())"),din:w.run("_calDinnerOf(_todayStr())"),rows:w.run("_calSlotRows(_todayStr(),null)"),chain:w.run("kitMoveChain('2026-10-22','d')"),plan:w.ctx.kitPlan});
  const before=snap();
  ok("before: Tacos, its sides and the lunch all shop; prep tonight; the chain from yesterday lands on today", /Tacos \(Fri\)/.test(before)&&/sides \(Fri\)/.test(before)&&/Chili \(Fri\)/.test(before)&&/thaw the beef/.test(before)&&JSON.parse(before).chain[1].iso===TODAY&&JSON.parse(before).din.st==="planned");
  w.run("kitOutToggle('"+TODAY+"','d')");
  ok("one targeted write: plan/{iso}/d/out = true; the meal stays on the day", JSON.stringify(w.ctx.writes)==='[["set","kitchen/plan/'+TODAY+'/d/out",true]]'&&w.ctx.kitPlan[TODAY].mid==="m1"&&w.ctx.kitPlan[TODAY].d.out===true, w.ctx.writes);
  const out=JSON.parse(snap());
  ok("the grocery feeders drop Tacos and its sides, keep the lunch", !out.src.some(s=>/Tacos|sides/.test(s.lbl))&&out.src.some(s=>s.lbl==="Chili (Fri)")&&!out.needs.some(n=>/beef|taco/.test(n.name))&&out.needs.some(n=>n.name==="beans"), out.src);
  ok("no prep steps tonight", out.prep.length===0);
  ok("the dinner reads 'out' — never owed, never asked", out.din.st==="out"&&out.din.name==="🌮 Tacos · peas · rice");
  ok("the move chain hops the day (yesterday's dinner lands on Saturday) and the day's own dinner can't move", out.chain[1].iso==="2026-10-24"&&w.run("kitMoveChain('"+TODAY+"','d')")===null);
  ok("the rotation stays put: no other day changed, no other write", JSON.stringify(Object.keys(w.ctx.kitPlan).filter(k=>k!==TODAY).map(k=>w.ctx.kitPlan[k]))===JSON.stringify(Object.keys(PLAN()).filter(k=>k!==TODAY).map(k=>PLAN()[k]))&&w.ctx.writes.length===1);
  ok("the button shows it is on; the label and the cell text say so", /Eating out ✓/.test(w.run("kitOutBtn('"+TODAY+"','d')"))&&/eating out/.test(w.run("kitOutLbl('"+TODAY+"','d')"))&&w.run("kitOutTxt('"+TODAY+"','d')")===" · eating out"&&w.run("kitOutTxt('"+TODAY+"','l')")==="");
  w.run("kitOutToggle('"+TODAY+"','l')");
  ok("lunch too: plan/{iso}/l/out = true, its {mid} intact", w.ctx.writes[1][1]==="kitchen/plan/"+TODAY+"/l/out"&&w.ctx.writes[1][2]===true&&w.ctx.kitPlan[TODAY].l.mid==="m2");
  const rows=w.run("_calSlotRows(_todayStr(),null).html");
  ok("Mom's b/l/s rows: 'eating out' on the lunch, 🍽 Eating out buttons beside ➡ Move", /Chili<\/b>[^\n]*eating out/.test(rows)&&/kitOutToggle\('2026-10-23','l'\)"[^>]*>🍽 Eating out ✓</.test(rows)&&/kitOutToggle\('2026-10-23','b'\)"[^>]*>🍽 Eating out</.test(rows));
  const kid=w.run("_calSlotRows(_todayStr(),'lincoln').html");
  ok("a kid's rows: the text, no button", /eating out/.test(kid)&&!/<button/.test(kid));
  ok("…and the lunch left the grocery feeders (Saturday's snack Chili still needs its beans)", !w.run("grWeekSources(_todayStr(),7)").some(s=>/Chili \(Fri\)/.test(s.lbl))&&w.run("grWeekNeeds()").some(n=>n.name==="beans"&&n.meals.join()==="Chili (Sat),Chili (Sun)"), w.run("grWeekNeeds()"));
  w.run("kitOutToggle('"+TODAY+"','d'); kitOutToggle('"+TODAY+"','l')");
  ok("tapping again removes the leaves (remove, not a whole-slot write)", JSON.stringify(w.ctx.writes.slice(2))==='[["remove","kitchen/plan/'+TODAY+'/d/out"],["remove","kitchen/plan/'+TODAY+'/l/out"]]'&&!("d" in w.ctx.kitPlan[TODAY])&&JSON.stringify(w.ctx.kitPlan[TODAY].l)==='{"mid":"m2"}');
  ok("…and every read is exactly what it was", snap()===before);
  ok("four toasts, Mom's device re-drew", w.ctx.toasts.length===4&&w.ctx.renders===4);
}
{ const w=world({meals:MEALS(),plan:PLAN(),mom:false});
  w.run("kitOutToggle('"+TODAY+"','d')");
  ok("a kid's device can't mark it", w.ctx.writes.length===0&&!w.ctx.kitPlan[TODAY].d);
}
{ const w=world({meals:MEALS(),plan:PLAN(),coming:{"2026-10-26d":{name:"Fall"}}});
  ok("a queued 'coming' day isn't on the calendar yet: no button, and a tap writes nothing", w.run("kitOutBtn('2026-10-26','d')")===""&&(w.run("kitOutToggle('2026-10-26','d')"),w.ctx.writes.length===0)&&w.run("kitOutBtn('"+TODAY+"','d')")!=="");
  ok("a bad slot writes nothing", (w.run("kitOutToggle('"+TODAY+"','x')"),w.ctx.writes.length===0));
  ok("kitOutStrip hands back the very same object when nothing is out", w.run("kitOutStrip('"+TODAY+"',kitPlan['"+TODAY+"'])===kitPlan['"+TODAY+"']")===true&&w.run("kitOutStrip('x',null)")===null);
}

console.log("\n── nothing flagged, nothing out → byte-identical to the code without the block ──");
{ const plan=()=>Object.assign(PLAN(),{"2026-10-01":{mid:"m1",eaten:D("2026-10-01"),rate:{lincoln:"love",ellis:"like"}},"2026-10-08":{mid:"m1",eaten:D("2026-10-08"),rate:{lincoln:"like"}},"2026-10-15":{mid:"m1",eaten:D("2026-10-15"),rate:{lincoln:"like",lucy:"love"}}});
  const A=world({meals:MEALS(),plan:plan(),rots:ROTS()}), B=world({meals:MEALS(),plan:plan(),rots:ROTS(),noBlock:true});
  const reads=w=>{ const o={}; for(let i=-1;i<7;i++){ const iso=w.run("kitIsoPlus('"+TODAY+"',"+i+")"); o[iso]=[w.run("kitPrepSteps('"+iso+"')"),w.run("_calDinnerOf('"+iso+"')"),w.run("_calSlotRows('"+iso+"',null).html").replace(/<button class="act"[^>]*kitOutToggle[^>]*>[^<]*<\/button>/g,""),w.run("_calSlotRows('"+iso+"','lucy')"),w.run("kitMoveChain('"+iso+"','d')"),w.run("kitMoveChain('"+iso+"','l')")]; }
    o.src=w.run("grWeekSources('"+TODAY+"',14)"); o.needs=w.run("grWeekNeeds()"); w.run("kitRotBStart('fall')"); o.builder=w.run("kitRotBHTML()");
    w.run("kitRate('meal','m1','lincoln')"); o.writes=w.ctx.writes; return JSON.stringify(o); };
  const a=reads(A), b=reads(B);
  ok("prep · dinner status · day-sheet rows (Mom's minus the new 🍽 button, a kid's as is) · move chains · both grocery feeders · the builder · a vote's writes: identical", a===b, a.length+" vs "+b.length);
  ok("Mom's rows differ from base only by the new 🍽 Eating out buttons", /kitOutToggle\('2026-10-23','l'\)"[^>]*>🍽 Eating out</.test(A.run("_calSlotRows('"+TODAY+"',null).html"))&&!/kitOutToggle/.test(B.run("_calSlotRows('"+TODAY+"',null).html")));
  ok("…and they are not trivially empty", /thaw the beef/.test(a)&&/Tacos \(Fri\)/.test(a)&&/kitRotBPick/.test(a)&&/ratings\/lincoln/.test(a));
  ok("the rated-but-fine meal carries no ⚠ and no row", A.run("kitFlagMark('m1')")===""&&A.run("kitFlagNowHTML().n")===0&&A.ctx.writes.filter(x=>/flags/.test(x[1])).length===0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
