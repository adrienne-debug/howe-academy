/* 🥪 KITSLOTS — lunch and breakfast as four parts: main · vegetable · fruit · extra (her decision 2026-10-22, built 2026-10-23).
 *   · the old {mid}|{txt} slot keeps working everywhere; a plan with no parts reads byte-identical to before
 *   · the FIRST edit of a day's breakfast/lunch migrates {mid|txt} into parts.main — ONE targeted write, that day only
 *   · display = the parts joined with " · ", a linked part with its emoji (Mom's Day, week list, calendar, day sheet, Corner)
 *   · the day sheet's Breakfast / Lunch rows carry the four fields; a kid's view is text only, no buttons
 *   · rotations: a builder b/l slot takes the four parts; Run maps each by name and writes {parts} in its one update;
 *     hand-edit detection compares the parts; an old one-name slot still writes {mid|txt}
 *   · grocery: a linked part reaches the list once through the meal-chip path; a text veg/fruit/extra is one item
 *   · ➡ Move forward carries parts; didn't-happen leaves them; kitAssign keeps / drops them exactly as {mid|txt}
 *   run: node test_kitchen_slots.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const J=v=>JSON.stringify(v);
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<i) throw new Error("missing "+a); return src.slice(i,j); };
const ka=src.indexOf("// KITSLOTS_START"), kb=src.indexOf("// KITSLOTS_END");
ok("KITSLOTS block present once, right after KITROT2_END", ka>0&&kb>ka&&src.indexOf("// KITSLOTS_START",ka+5)<0&&src.slice(src.indexOf("// KITROT2_END"),ka).trim()==="// KITROT2_END");

const MEALS={m1:{name:"Burgers",emoji:"🍔",ing:"1 lb ground beef\nburger buns"},m2:{name:"Tacos",emoji:"🌮",ing:"corn tortillas\nground beef"},
  m3:{name:"Roasted Broccoli",emoji:"🥦",ing:"broccoli",tags:["side"]},m4:{name:"Oatmeal",emoji:"🥣",ing:"rolled oats\nmilk",tags:["kid"]},m5:{name:"Fruit Salad",emoji:"🍓",ing:"strawberries\ngrapes"}};
// ── a tiny app around the real slices (o.base = the app as it was: the KITSLOTS block left out, every hook idle) ──
function world(o){
  o=o||{};
  const W={writes:[],toasts:[],confirms:[],pins:0,renders:0,mom:!("mom" in o)||o.mom,dry:!!o.dry,yes:true,prompt:null,els:{},today:o.today||"2026-10-26",opened:[]};
  const ref=p=>({set:v=>W.writes.push(["set",p,JSON.parse(J(v))]),update:v=>{ W.writes.push(["update",p,JSON.parse(J(v))]); return Promise.resolve(); },remove:()=>W.writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,Promise,
    db:{ref:ref},HA_LS:{getItem:()=>null,setItem:()=>{}},mwToast:m=>W.toasts.push(m),esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    momHere:()=>W.mom,_dryRun:()=>W.dry,dadAwardOk:()=>false,_kioskD:()=>false,kitPinGate:(then,why)=>{ if(W.mom) then(); else { W.pins++; W.pinWhy=why; } },
    _todayStr:()=>W.today,calToday:()=>W.today,gwParseDate:iso=>new Date(iso+"T12:00:00"),kitWkIso:()=>"2026-11-02",kitOpenRecipe:id=>W.opened.push(id),
    renderAll:()=>{ W.renders++; },renderMomsPlan:()=>{ W.momsPlanRenders=(W.momsPlanRenders||0)+1; },confirm:m=>{ W.confirms.push(m); return W.yes; },prompt:()=>W.prompt,
    kitPantry:o.pantry||{},panStatus:()=>"fresh",kitStaples:{},kitPrepDone:{},tab:"schedule",ROSTER_DEF:[],momdayData:{},navigator:{},HA_IS_HOWE:false,
    document:{getElementById:id=>W.els[id]||null,querySelectorAll:()=>[],createElement:()=>({}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx);
  const run=e=>vm.runInContext(e,ctx);
  run(src.match(/const KIT_FRAC_GLYPH=\{[^}]+\};/)[0]+fn("kitSlug")+fn("kitQtyParse")+fn("kitIsoPlus"));
  run("var kitMeals="+J(o.meals||MEALS)+"; var kitPlan="+J(o.plan||{})+"; var kitRotations="+J(o.rots||{})+"; var kitPickIso=null, kitRotOpen=null, kitRotSaveOpen=false, kitWkImportOpen=false, kitEditId=null, kitView=null;");
  run(cut("// KITSIDES_START","// KITSIDES_END"));
  run(cut("// GROCERY_LIST_START","// GROCERY_LIST_END")); ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grRepaint=()=>{};
  run([line("const KIT_ROT_DEFAULT="),line("const KIT_SLOTS="),line("const KIT_TAGS="),line("const KIT_ROT_DAYS="),line("const KIT_MOVE_NAMES="),
       fn("kitPlanFor"),fn("kitSidesTxt"),fn("kitPlanSlot"),fn("kitSlotText"),fn("_calDinnerOf"),fn("_calSlotRows"),fn("kitEatGate"),fn("_kitRefresh"),fn("kitAssign"),fn("kitMarkSkipped"),
       fn("_kitMvGet"),fn("_kitMvFixed"),fn("kitMoveChain"),fn("kitMoveForward"),
       fn("kitRotAll"),fn("kitRotEnsure"),fn("kitRotMealByName"),fn("kitRotSlotVal"),fn("kitRotSlotName"),fn("kitRotMondayOf"),fn("kitRotPlanFor"),fn("kitRotCapture"),fn("kitRotRender"),fn("kitRotApply"),
       cut("// KIT_ROT_EDIT_START","// KIT_ROT_EDIT_END"),cut("// KITROT2_START","// KITROT2_END")].join("\n"));
  if(!o.base) run(cut("// KITSLOTS_START","// KITSLOTS_END"));
  run("kitRotSynced.plan=true; kitRotSynced.rots=true;");
  W.run=run; W.ctx=ctx; W.plan=()=>run("kitPlan"); W.planWrites=()=>W.writes.filter(w=>/^kitchen\/plan/.test(w[1]));
  return W;
}
const MON="2026-10-26", TUE="2026-10-27", WED="2026-10-28";   // MON = today in this world
const BL=["b","🌅","Breakfast"], LL=["l","☀️","Lunch"];

console.log("\n── the old shape still renders (nothing migrates by itself) ──");
{ const W=world({plan:{[MON]:{mid:"m1",b:{mid:"m4"},l:{txt:"PB&J"}}}});
  ok("kitPlanSlot: a linked slot is exactly {mid, meal}", J(W.run("kitPlanSlot('"+MON+"','b')"))===J({mid:"m4",meal:MEALS.m4}));
  ok("kitPlanSlot: a typed slot is exactly {txt}", J(W.run("kitPlanSlot('"+MON+"','l')"))===J({txt:"PB&J"}));
  const kid=W.run("_calSlotRows('"+MON+"','lucy')");
  ok("a kid's day sheet: text only, no buttons", /Breakfast<\/span><span style="flex:1">🌅 <b>🥣 Oatmeal<\/b>/.test(kid.html)&&/☀️ <b>PB&J<\/b>/.test(kid.html)&&!/<button/.test(kid.html)&&kid.n===2);
  const mom=W.run("_calSlotRows('"+MON+"',null)");
  ok("Mom's day sheet: the Breakfast row shows the same line, ➡ Move, then main · veg · fruit · extra fields", /🌅 <b>🥣 Oatmeal<\/b>/.test(mom.html)&&/kitMoveForward\('2026-10-26','b'\)/.test(mom.html)&&/>main<\/span> 🥣 Oatmeal/.test(mom.html)&&/＋ veg</.test(mom.html)&&/＋ fruit</.test(mom.html)&&/＋ extra</.test(mom.html));
  ok("…the typed lunch sits in its main field", />main<\/span> PB&amp;J|>main<\/span> PB&J/.test(mom.html));
  ok("…and nothing was written just by looking", W.writes.length===0&&J(W.plan()[MON].b)===J({mid:"m4"}));
  ok("snack keeps its one slot — no fields", !/kitSlotsPick\('2026-10-26','s/.test(mom.html));
}

console.log("\n── the first edit migrates {mid|txt} into parts.main — ONE targeted write, that day only ──");
{ const W=world({plan:{[MON]:{mid:"m1",b:{mid:"m4"},l:{txt:"PB&J"},s:{txt:"Popcorn"}},[TUE]:{b:{mid:"m4"}}}});
  W.run("kitSlotsSet('"+MON+"','b','fruit',{txt:'banana'})");
  const p=W.plan()[MON];
  ok("breakfast = {parts:{main: the old Oatmeal, fruit: banana}}", J(p.b)===J({parts:{main:{mid:"m4"},fruit:{txt:"banana"}}}), p.b);
  ok("ONE write: set kitchen/plan/{iso}/b", J(W.writes)===J([["set","kitchen/plan/"+MON+"/b",{parts:{main:{mid:"m4"},fruit:{txt:"banana"}}}]]), W.writes);
  ok("the rest of the day is untouched (dinner, lunch, snack as they were)", p.mid==="m1"&&J(p.l)===J({txt:"PB&J"})&&J(p.s)===J({txt:"Popcorn"}));
  ok("the other day keeps the old shape", J(W.plan()[TUE].b)===J({mid:"m4"}));
  ok("the screen repaints", W.renders===1);
  W.run("kitSlotsSet('"+MON+"','l','veg',{mid:'m3'})");
  ok("a typed lunch migrates the same way: main = its text, veg = the linked recipe", J(W.plan()[MON].l)===J({parts:{main:{txt:"PB&J"},veg:{mid:"m3"}}}));
  W.run("kitSlotsSet('"+MON+"','l','main',{txt:'Turkey wrap'})");
  ok("changing the main keeps the other parts", J(W.plan()[MON].l)===J({parts:{main:{txt:"Turkey wrap"},veg:{mid:"m3"}}}));
  W.run("kitSlotsClear('"+MON+"','l_veg')"); W.run("kitSlotsClear('"+MON+"','l')");
  ok("clearing the last part removes the slot — one targeted remove of kitchen/plan/{iso}/l", !("l" in W.plan()[MON])&&J(W.writes[W.writes.length-1])===J(["remove","kitchen/plan/"+MON+"/l"]), W.writes[W.writes.length-1]);
  W.run("kitSlotsClear('"+TUE+"','b')");
  ok("a day with nothing else on it goes away with its last part", !(TUE in W.plan())&&J(W.writes[W.writes.length-1])===J(["remove","kitchen/plan/"+TUE]));
  ok("parts always land in order main · veg · fruit · extra", J(Object.keys(W.run("kitSlotsSet('"+MON+"','b','veg',{txt:'carrots'}); kitSlotsSet('"+MON+"','b','extra',{txt:'crackers'}); kitPlan['"+MON+"'].b.parts")))===J(["main","veg","fruit","extra"]));
}

console.log("\n── the four fields work the rotations' library picker (search, tag chips, ✎ Type it) ──");
{ const W=world({plan:{[MON]:{b:{txt:"Toast"}}}});
  W.run("kitSlotsPick('"+MON+"','b_fruit')");
  ok("a field opens the picker on that part (kind p) and repaints the sheet, not Mom's plan", J(W.run("[kitRotPick.kind,kitRotPick.iso,kitRotPick.slot]"))===J(["p",MON,"b_fruit"])&&W.renders===1&&!W.momsPlanRenders);
  const row=W.run("_calSlotRows('"+MON+"',null)").html;
  ok("the picker shows under the row: search, the library, ✎ Type it", /🌅 Breakfast · fruit · Mon, Oct 26/.test(row)&&/kitRotPickQ\(this\.value\)/.test(row)&&/kitRotPickGo\('m5'\)/.test(row)&&/kitRotPickTyped\(\)/.test(row));
  ok("tag chips when the library has tags", /kitRotPickTag\('kid'\)/.test(row));
  W.run("kitRotPickGo('m5')");
  ok("picking from the library links that part and closes the picker", J(W.plan()[MON].b)===J({parts:{main:{txt:"Toast"},fruit:{mid:"m5"}}})&&W.run("kitRotPick")===null);
  W.run("kitSlotsPick('"+MON+"','b_veg')"); W.prompt="  cucumbers "; W.run("kitRotPickTyped()");
  ok("✎ Type it puts text in that part, trimmed", J(W.plan()[MON].b.parts.veg)===J({txt:"cucumbers"}));
  W.run("kitSlotsPick('"+MON+"','b_veg')");
  ok("the picker shows what the part holds now", /now: cucumbers/.test(W.run("_calSlotRows('"+MON+"',null)").html)&&W.run("kitRotPickCur()")==="cucumbers");
  W.run("kitRotPickClear()");
  ok("✕ Clear in the picker clears that part", !("veg" in W.plan()[MON].b.parts));
  W.run("kitSlotsPick('"+MON+"','b_extra')"); W.run("kitRotPickClose()");
  ok("Close repaints the sheet (never Mom's plan)", W.run("kitRotPick")===null&&!W.momsPlanRenders);
  ok("every write was a targeted set of kitchen/plan/{iso}/b", W.writes.length===3&&W.writes.every(w=>w[0]==="set"&&w[1]==="kitchen/plan/"+MON+"/b"), W.writes);
  ok("kitRotTypeMeta names a part key", J(W.run("kitRotTypeMeta('l_fruit')"))===J(["l_fruit","☀️","Lunch · fruit"])&&J(W.run("kitRotTypeMeta('b')"))===J(["b","🌅","Breakfast"]));
}
{ const W=world({plan:{[MON]:{b:{mid:"m4"}}},mom:false});
  W.run("kitSlotsSet('"+MON+"','b','fruit',{txt:'banana'})"); W.run("kitSlotsPick('"+MON+"','b_fruit')");
  ok("not Mom or Dad → nothing changes, nothing opens, nothing is written", J(W.plan()[MON].b)===J({mid:"m4"})&&W.writes.length===0&&W.run("kitRotPick")===null);
  ok("…and the kid-side sheet has no fields at all", !/kitSlotsPick/.test(W.run("_calSlotRows('"+MON+"',null)").html));
}
{ const W=world({plan:{[MON]:{b:{mid:"m4"}}},dry:true});
  W.run("kitSlotsSet('"+MON+"','b','fruit',{txt:'banana'})");
  ok("?dryrun=1 keeps the change on the device only", J(W.plan()[MON].b.parts.fruit)===J({txt:"banana"})&&W.writes.length===0);
}

console.log("\n── display everywhere = the parts joined with ' · ', a linked part with its emoji ──");
{ const W=world({plan:{[MON]:{mid:"m1",b:{parts:{main:{mid:"m4"},veg:{txt:"carrots"},fruit:{mid:"m5"},extra:{txt:"crackers"}}},l:{parts:{fruit:{txt:"apple"}}}},[TUE]:{l:{parts:{main:{mid:"gone"},extra:{txt:"chips"}}}}}});
  const sv=W.run("kitPlanSlot('"+MON+"','b')");
  ok("kitPlanSlot hands back the joined line as txt (no mid, so no tap opens one recipe)", sv.txt==="🥣 Oatmeal · carrots · 🍓 Fruit Salad · crackers"&&!("mid" in sv)&&!("meal" in sv));
  ok("…and the resolved parts, in order", J(sv.parts.map(x=>x.key+":"+(x.mid?x.meal.name:x.txt)))===J(["main:Oatmeal","veg:carrots","fruit:Fruit Salad","extra:crackers"]));
  ok("empty parts render nothing — a lunch that is only a fruit is just 'apple'", W.run("kitPlanSlot('"+MON+"','l')").txt==="apple");
  ok("a part whose recipe was deleted says so instead of vanishing", W.run("kitPlanSlot('"+TUE+"','l')").txt==="(meal removed) · chips");
  ok("a parts slot with every part empty reads as nothing planned", W.run("kitPlanSlot")&&W.run("kitSlotsView({parts:{main:{txt:'  '}}})")===null);
  const kid=W.run("_calSlotRows('"+MON+"','lucy')").html;
  ok("the Kids' Corner / kid day sheet shows the one line, no buttons", /🌅 <b>🥣 Oatmeal · carrots · 🍓 Fruit Salad · crackers<\/b>/.test(kid)&&/☀️ <b>apple<\/b>/.test(kid)&&!/<button|kitSlotsPick/.test(kid));
  const mom=W.run("_calSlotRows('"+MON+"',null)").html;
  ok("Mom's row: the same line, then each part as a chip with ✕ and 📖 on a linked one", /<b>🥣 Oatmeal · carrots · 🍓 Fruit Salad · crackers<\/b>/.test(mom)&&/kitSlotsClear\('2026-10-26','b_veg'\)/.test(mom)&&/kitOpenRecipe\('m5'\)/.test(mom)&&/kitSlotsPick\('2026-10-26','b_extra'\)/.test(mom));
  // the other three screens read kitPlanSlot's (sv.txt||"") — the line reaches them without code of their own
  const momsDay=src.slice(src.indexOf("const anySlot=kitPlanSlot(iso,'b')"),src.indexOf("const anySlot=kitPlanSlot(iso,'b')")+900);
  ok("Mom's Day rows read sv.meal ? name : sv.txt", /const val=sv\?\(sv\.meal\?sv\.meal\.name:\(sv\.txt\|\|""\)\):"";/.test(momsDay));
  ok("the week list reads the same (KITFLAG may wrap the line for an eating-out slot)", /slotBits\.push\(sp\[1\]\+' '\+[^\n]*esc\(sv\.meal\?sv\.meal\.name:\(sv\.txt\|\|""\)\)/.test(src));
  ok("the calendar month cell reads the same", /const nm=sv\.meal\?\(\(sv\.meal\.emoji\?sv\.meal\.emoji\+" ":""\)\+\(sv\.meal\.name\|\|""\)\):\(sv\.txt\|\|""\); if\(nm\) items\.push/.test(src));
  ok("Mom's Day's tap on a parts slot edits the MAIN only (the hook sits in kitSlotText)", /if\(typeof kitSlotsPrompt==="function"&&kitSlotsPrompt\(iso,slot\)\) return;/.test(fn("kitSlotText")));
  W.prompt="Tacos"; W.run("kitSlotText('"+MON+"','b')");
  ok("…a typed name the library knows links; carrots, the fruit salad and the crackers stay", J(W.plan()[MON].b)===J({parts:{main:{mid:"m2"},veg:{txt:"carrots"},fruit:{mid:"m5"},extra:{txt:"crackers"}}})&&W.writes.length===1&&W.writes[0][1]==="kitchen/plan/"+MON+"/b");
  W.prompt=null; W.run("kitSlotText('"+MON+"','b')");
  ok("…Cancel writes nothing", W.writes.length===1);
}

console.log("\n── rotations: the builder's b/l slots take the four parts; Run maps each by name ──");
{ const W=world();
  const up=W.run("kitRotDayUp({types:['d','b','l']},{day:{d:'Burgers',b:{main:'oatmeal',veg:'carrots',fruit:'fruit salad'},l:'PB&J'}})");
  ok("a four-part slot: each part by case-insensitive library match → {mid}, else {txt}", J(up.b)===J({parts:{main:{mid:"m4"},veg:{txt:"carrots"},fruit:{mid:"m5"}}}), up.b);
  ok("an old one-name slot still writes {mid|txt} exactly as before", J(up.l)===J({txt:"PB&J"})&&J(up.mid)===J("m1"));
  ok("a parts slot with nothing in it writes nothing", !("b" in W.run("kitRotDayUp({types:['b']},{day:{b:{main:'',veg:' '}}})")));
  ok("a main-only object is the one name (so it writes the old shape)", J(W.run("kitRotDayUp({types:['b']},{day:{b:{main:'Oatmeal'}}})").b)===J({mid:"m4"}));
  const pf=W.run("kitRotPlanFor({weeks:[[{d:'Tacos',b:{main:'Toast',fruit:'Banana'},l:'Leftovers'}]]},'"+MON+"')")[MON];
  ok("the old Apply (kitRotPlanFor) maps the same way", J(pf)===J({mid:"m2",b:{parts:{main:{txt:"Toast"},fruit:{txt:"Banana"}}},l:{txt:"Leftovers"}}), pf);
  ok("kitRotSlotName on a parts slot = the names, ' · ' joined (what the rotation stores)", W.run("kitRotSlotName({parts:{main:{mid:'m4'},veg:{txt:'carrots'},fruit:{mid:'m5'}}})")==="Oatmeal · carrots · Fruit Salad");
  ok("kitSlotsRotStr on a rotation slot matches it", W.run("kitSlotsRotStr({main:'Oatmeal',veg:'carrots',fruit:'Fruit Salad'})")==="Oatmeal · carrots · Fruit Salad"&&W.run("kitSlotsRotStr('PB&J')")==="PB&J"&&W.run("kitSlotsRotStr(null)")==="");
  // the builder
  const rows=W.run("kitRotBWeeksOf({weeks:[[{d:'Tacos',b:{main:'Oatmeal',fruit:'banana'},l:'PB&J'}]]})")[0];
  ok("✎ Edit loads a stored four-part slot as main + b_fruit; the one-name lunch as its main", rows[0].b==="Oatmeal"&&rows[0].b_fruit==="banana"&&!("b_veg" in rows[0])&&rows[0].l==="PB&J"&&!("l_fruit" in rows[0]));
  W.run("kitRotB={id:null,name:'Fall',emoji:'',types:['d','b','l'],weeks:[kitRotBBlankWeek()]}");
  W.run("kitRotBSet(0,0,'b','Oatmeal',true); kitRotBSet(0,0,'b_veg','carrots',true); kitRotBSet(0,1,'l','PB&J',true); kitRotBSet(0,2,'l_fruit','apple',true)");
  const clean=W.run("kitRotBClean(kitRotB)")[0];
  ok("Save: a slot with another part filled is {main, veg, …}; a main-only slot is the one name; a fruit alone is {fruit}", J(clean[0].b)===J({main:"Oatmeal",veg:"carrots"})&&clean[1].l==="PB&J"&&J(clean[2].l)===J({fruit:"apple"})&&!("b" in clean[1]), clean);
  const bh=W.run("kitRotBHTML()");
  ok("the builder's breakfast cell is four small cells, each → the picker on its part", /kitRotBPick\(0,0,'b'\)/.test(bh)&&/kitRotBPick\(0,0,'b_veg'\)/.test(bh)&&/kitRotBPick\(0,0,'b_fruit'\)/.test(bh)&&/kitRotBPick\(0,0,'b_extra'\)/.test(bh)&&/kitRotBPick\(0,0,'l_extra'\)/.test(bh));
  ok("…dinner and snack cells are as they were", /kitRotBPick\(0,0,'d'\)/.test(bh)&&!/kitRotBPick\(0,0,'d_veg'\)/.test(bh));
  W.run("kitRotBPick(0,0,'b_veg')");
  ok("the builder's picker opens on the part — header names it", /🌅 Breakfast · vegetable · week 1 · Mon · now: carrots/.test(W.run("kitRotBHTML()")));
  W.run("kitRotPickGo('m3')");
  ok("picking sets that part by name", W.run("kitRotB.weeks[0][0].b_veg")==="Roasted Broccoli");
  const stored={name:"Fall",types:["d","b","l"],weeks:[[{b:{main:"Oatmeal",veg:"Roasted Broccoli"}},{l:"PB&J"},{l:{fruit:"apple"}},{},{},{},{}]]};
  ok("✎ Edit → Save with nothing changed writes nothing (parts compare as parts)", J(W.run("kitRotBDiff("+J(stored)+",kitRotB,'Fall','')"))==="{}");
  W.run("kitRotBSet(0,0,'b_fruit','banana',true)");
  ok("…one part changed → one path, the whole slot as {main,veg,fruit}", J(W.run("kitRotBDiff("+J(stored)+",kitRotB,'Fall','')"))===J({"weeks/0/0/b":{main:"Oatmeal",veg:"Roasted Broccoli",fruit:"banana"}}));
  ok("a week with only a fruit counts as filled", W.run("kitRotBWeekFilled([{l_fruit:'apple'}])")===true&&W.run("kitRotBWeekFilled([{d:'',b:''}])")===false);
  const cap=W.run("kitPlan['"+MON+"']={b:{parts:{main:{mid:'m4'},fruit:{txt:'banana'}}},l:{mid:'m2'}}; kitRotCapture('"+MON+"',1)").weeks[0][0];
  ok("capture keeps the parts as names; the one-name lunch as before", J(cap.b)===J({main:"Oatmeal",fruit:"banana"})&&cap.l==="Tacos"&&cap.s===""&&cap.d==="");
}

console.log("\n── ▶ Run writes parts per day inside its one update; hand-edit detection sees them ──");
{ const rot={name:"Fall",emoji:"🍂",types:["b","l"],startDate:MON,endDate:WED,weeks:[[{b:{main:"Oatmeal",fruit:"banana"},l:"PB&J"},{b:"Toast",l:{main:"Turkey wrap",veg:"carrots",extra:"chips"}},{b:{main:"oatmeal",veg:"celery"}},{},{},{},{}]]};
  const W=world({rots:{fall:rot}});
  W.els["kit-rot-from-fall"]={value:MON}; W.els["kit-rot-to-fall"]={value:WED}; W.els["kit-rot-ow-fall"]={checked:false};
  W.run("kitRotApply('fall')");
  const ups=W.writes.filter(w=>w[0]==="update"&&w[1]==="kitchen/plan");
  ok("ONE multi-path update under kitchen/plan", ups.length===1, W.writes.map(w=>w[0]+" "+w[1]));
  const up=ups[0][2];
  ok("Monday's breakfast = {parts} as the slot's value, lunch the old shape; both stamped", J(up[MON+"/b"])===J({parts:{main:{mid:"m4"},fruit:{txt:"banana"}}})&&J(up[MON+"/l"])===J({txt:"PB&J"})&&J(up[MON+"/fromRot/b"])===J({id:"fall",wk:0,dow:0})&&J(up[MON+"/fromRot/l"])===J({id:"fall",wk:0,dow:0}), up);
  ok("Tuesday's lunch = three parts (no fruit written)", J(up[TUE+"/l"])===J({parts:{main:{txt:"Turkey wrap"},veg:{txt:"carrots"},extra:{txt:"chips"}}})&&J(up[TUE+"/b"])===J({txt:"Toast"}));
  ok("no other keys on those days", Object.keys(up).every(k=>/\/(b|l|fromRot\/[bl])$/.test(k)), Object.keys(up));
  ok("the calendar then shows the line", W.run("kitPlanSlot('"+MON+"','b')").txt==="🥣 Oatmeal · banana"&&W.run("kitPlanSlot('"+TUE+"','l')").txt==="Turkey wrap · carrots · chips");
  ok("a day the run wrote is not hand-edited", W.run("kitRotHandEdited('"+MON+"',['b','l'])")===false&&W.run("kitRotHandEdited('"+TUE+"',['b','l'])")===false);
  W.run("kitSlotsSet('"+MON+"','b','veg',{txt:'carrots'})");
  ok("adding a part by hand makes that slot hand-edited (the rotation keeps its hands off)", W.run("kitRotHandEdited('"+MON+"',['b'])")===true&&W.run("kitRotHandEdited('"+MON+"',['l'])")===false);
  W.run("kitSlotsClear('"+MON+"','b_veg')");
  ok("…and putting it back makes it match again", W.run("kitRotHandEdited('"+MON+"',['b'])")===false);
  W.run("kitSlotsSet('"+WED+"','b','fruit',{txt:'apple'})");
  ok("a different part on Wednesday's four-part slot is hand-edited too", W.run("kitRotHandEdited('"+WED+"',['b'])")===true);
  ok("a parts slot whose names match a one-name rotation slot is not hand-edited", W.run("kitPlan['"+TUE+"'].b={parts:{main:{mid:'m4'}}}; kitRotations.fall.weeks[0][1].b='Oatmeal'; kitRotHandEdited('"+TUE+"',['b'])")===false);
  ok("the 🗓 This month cell names the parts", /Oatmeal · banana/.test(W.run("kitRotMonthHTML()")));
  // the run again: a hand-edited day is kept and listed
  const n0=W.writes.length; W.run("kitRotApply('fall')");
  ok("running again keeps the hand-edited Wednesday and says so", /1 day you changed by hand will be kept — Oct 28/.test(W.confirms[W.confirms.length-1])&&W.plan()[WED].b.parts.fruit.txt==="apple");
  ok("…and the queued/running helpers see a parts slot as food", W.run("kitRotHas({b:{parts:{fruit:{txt:'x'}}}},'b')")===true&&W.run("kitRotHas({b:{parts:{}}},'b')")===false&&W.run("kitRotHas({b:{mid:'m4'}},'b')")===true);
}

console.log("\n── grocery: a linked part through the meal-chip path, a text part one item ──");
{ const W=world({plan:{[MON]:{mid:"m1",b:{parts:{main:{mid:"m4"},veg:{txt:"carrots"},fruit:{mid:"m5"},extra:{txt:"crackers"}}},l:{parts:{main:{txt:"Turkey wrap"},fruit:{txt:"apple"}}}},[TUE]:{l:{parts:{veg:{txt:"carrots"}}},s:{mid:"m5"}}}});
  const srcs=W.run("grWeekSources('"+MON+"',7)");
  ok("the linked main rides as its recipe — the chip a dinner gets", J(srcs[1])===J({lines:"rolled oats\nmilk",lbl:"Oatmeal (Mon)"}), srcs);
  ok("a text veg is one line chipped to the main's name and the day", J(srcs[2])===J({lines:"carrots",lbl:"Oatmeal (Mon)"}));
  ok("a linked fruit rides as its own recipe", J(srcs[3])===J({lines:"strawberries\ngrapes",lbl:"Fruit Salad (Mon)"}));
  ok("a text extra, one line", J(srcs[4])===J({lines:"crackers",lbl:"Oatmeal (Mon)"}));
  ok("a text main is the meal's name — it shops nothing; its fruit is chipped to it", J(srcs[5])===J({lines:"apple",lbl:"Turkey wrap (Mon)"})&&!srcs.some(s=>s.lines==="Turkey wrap"));
  ok("no main → the slot's name (Lunch)", J(srcs[6])===J({lines:"carrots",lbl:"Lunch (Tue)"}));
  ok("a snack stays as it was", J(srcs[7])===J({lines:"strawberries\ngrapes",lbl:"Fruit Salad (Tue)"})&&srcs.length===8);
  const rows=W.run("grIngRows(grWeekSources('"+MON+"',7))"); const names=rows.map(r=>r.p.name);
  ok("the linked part's ingredients reach the list once each", names.filter(n=>n==="Rolled oats").length===1&&names.filter(n=>n==="Milk").length===1&&names.filter(n=>n==="Strawberries").length===1, names);
  const car=rows.find(r=>r.p.name==="Carrots");
  ok("the same text part on two days → ONE item carrying both chips", car&&names.filter(n=>n==="Carrots").length===1&&J(car.meals)===J(["Oatmeal (Mon)","Lunch (Tue)"]), car);
  const needs=W.run("grWeekNeeds()").map(r=>r.name);
  ok("This week's meals need counts every linked part's recipe", needs.indexOf("Rolled oats")>=0&&needs.indexOf("Strawberries")>=0, needs);
  ok("…and not the text parts", !needs.some(n=>/carrots|apple|crackers/i.test(n)));
  const W2=world({plan:{[MON]:{b:{parts:{main:{mid:"m4"}}}}},pantry:{p1:{name:"Rolled oats",zone:"pantry",addedIso:"2026-10-25"}}});
  ok("a migrated linked main (parts.main only) feeds exactly what the old {mid} fed", J(W2.run("grWeekSources('"+MON+"',7)"))===J([{lines:"rolled oats\nmilk",lbl:"Oatmeal (Mon)"}]));
}

console.log("\n── ➡ Move forward carries parts; didn't happen leaves them; kitAssign keeps / drops them like {mid|txt} ──");
{ const P={parts:{main:{mid:"m4"},fruit:{txt:"banana"}}};
  const W=world({plan:{[MON]:{mid:"m1",b:P},[TUE]:{b:{txt:"Toast"}}}});
  W.run("kitMoveForward('"+MON+"','b')");
  const up=W.writes.find(w=>w[0]==="update"&&w[1]==="kitchen")[2];
  ok("Oatmeal + banana land on Tuesday, Toast on Wednesday", J(W.plan()[TUE].b)===J(P)&&J(W.plan()[WED].b)===J({txt:"Toast"})&&!("b" in W.plan()[MON]));
  ok("the one update carries the parts as the slot's value and clears Monday's", J(up["plan/"+TUE+"/b"])===J(P)&&up["plan/"+MON+"/b"]===null&&J(up["plan/"+WED+"/b"])===J({txt:"Toast"})&&Object.keys(up).length===3, up);
  W.run("kitMarkSkipped('"+TUE+"')");
  ok("✗ Didn't happen stamps the day only — breakfast parts stay", J(W.plan()[TUE].b)===J(P)&&J(W.writes[W.writes.length-1].slice(0,2))===J(["set","kitchen/plan/"+TUE+"/skipped"]));
  W.run("kitAssign('"+TUE+"',{mid:'m2'})");
  ok("a different dinner keeps the breakfast parts (as it keeps b/l/s)", W.plan()[TUE].mid==="m2"&&J(W.plan()[TUE].b)===J(P));
  W.run("kitAssign('"+TUE+"',null)");
  ok("✕ clearing the day drops the whole day, parts with it", !(TUE in W.plan()));
}

console.log("\n── a plan with no parts is byte-identical to the app before this block (display, rotations, grocery, move) ──");
{ const plan={[MON]:{mid:"m1",b:{mid:"m4"},l:{txt:"PB&J"},sideList:[{mid:"m3"}]},[TUE]:{txt:"Pizza night",l:{mid:"m5"},s:{txt:"Popcorn"}},[WED]:{b:{txt:"Toast"}}};
  const rot={name:"Fall",types:["d","b","l"],startDate:MON,endDate:WED,weeks:[[{d:"Burgers",sd:"peas · rice",b:"Oatmeal",l:"PB&J"},{d:"Tacos",b:"Toast"},{l:"Leftovers"},{},{},{},{}]]};
  const A=world({plan:JSON.parse(J(plan)),rots:{fall:rot}}), B=world({plan:JSON.parse(J(plan)),rots:{fall:rot},base:true});
  const probe=W=>W.run("JSON.stringify({b:kitPlanSlot('"+MON+"','b'),l:kitPlanSlot('"+MON+"','l'),l2:kitPlanSlot('"+TUE+"','l'),s:kitPlanSlot('"+TUE+"','s'),x:kitPlanSlot('"+TUE+"','b'),kid:_calSlotRows('"+MON+"','lucy'),kid2:_calSlotRows('"+TUE+"','julian'),din:_calDinnerOf('"+MON+"'),gs:grWeekSources('"+MON+"',7),gn:grWeekNeeds(),run:kitRotRunPlan(kitRotations.fall,'fall',{}),hand:[kitRotHandEdited('"+MON+"',['b','l']),kitRotHandEdited('"+WED+"',['b'])],cap:kitRotCapture('"+MON+"',1),pf:kitRotPlanFor(kitRotations.fall,'"+MON+"'),rows:kitRotBWeeksOf(kitRotations.fall),diff:kitRotEditDiff(kitRotations.fall,kitRotBWeeksOf(kitRotations.fall)),q:kitRotQueuedFor('"+MON+"')})");
  ok("kitPlanSlot, the kid sheet, the dinner line, both grocery reads, the run, hand-edit, capture, Apply, the builder's load and diff: identical", probe(A)===probe(B), [probe(A),probe(B)]);
  A.run("kitMoveForward('"+MON+"','b')"); B.run("kitMoveForward('"+MON+"','b')");
  ok("Move forward writes the very same paths and values", J(A.writes)===J(B.writes)&&A.writes.length>0);
  A.run("kitRotApply('fall')"); B.run("kitRotApply('fall')");
  ok("▶ Run writes the very same update", J(A.writes)===J(B.writes)&&J(A.plan())===J(B.plan()));
  ok("kitPlanSlot keeps its exact shapes", J(A.run("kitPlanSlot('"+WED+"','b')"))===J({txt:"Toast"})&&J(A.run("kitPlanSlot('"+TUE+"','l')"))===J({mid:"m5",meal:MEALS.m5}));
  ok("no 🔀 anywhere", src.indexOf("🔀")<0);
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
