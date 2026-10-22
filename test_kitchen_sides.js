/* 🥗 KITSIDES — sides as a list, linked or plain, feeding the grocery list (Sara DeWalt's ask 2026-10-22).
 *   · the old one-line sides text still shows; the first edit turns it into one plain side (that day only)
 *   · a rotation's sd slot (old string or a list of names) links a side the library knows, types the rest
 *   · display = the sides joined with " · ", a linked side with its emoji — Mom's Day, week list, calendar, Corner
 *   · a linked side's ingredients reach the grocery list once, through the meal-chip path a dinner uses
 *   · a plain side is ONE grocery item under the dinner's chip; the same side on two days → one item
 *   · ➡ Move forward carries the list; kitAssign drops it; no sides → byte-identical to before
 *   run: node test_kitchen_sides.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const J=v=>JSON.stringify(v);
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const line=s=>{ const i=src.indexOf(s); if(i<0) throw new Error("missing "+s); return src.slice(i,src.indexOf("\n",i)+1); };
const ka=src.indexOf("// KITSIDES_START"), kb=src.indexOf("// KITSIDES_END");
ok("KITSIDES block present once", ka>0&&kb>ka&&src.indexOf("// KITSIDES_START",ka+5)<0);
const ga=src.indexOf("// GROCERY_LIST_START"), gb=src.indexOf("// GROCERY_LIST_END");

// ── a tiny app ──
function world(o){
  o=o||{};
  const W={writes:[],toasts:[],pins:0,renders:0,confirms:0,mom:!("mom" in o)||o.mom,dry:!!o.dry,els:{}};
  const ref=p=>({set:v=>W.writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>W.writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>W.writes.push(["remove",p])});
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,
    db:{ref:ref},HA_LS:{getItem:()=>null,setItem:()=>{}},mwToast:m=>W.toasts.push(m),esc:s=>String(s==null?"":s).replace(/</g,"&lt;"),
    momHere:()=>W.mom,_dryRun:()=>W.dry,dadAwardOk:()=>false,_kioskD:()=>false,kitPinGate:(then,why)=>{ W.pins++; W.pinWhy=why; },
    kitOrderList:()=>({need:[],usuals:{}}),_todayStr:()=>"2026-10-26",calToday:()=>"2026-10-26",gwParseDate:iso=>new Date(iso+"T12:00:00"),
    kitOpenRecipe:()=>{},renderAll:()=>{ W.renders++; },renderMomsPlan:()=>{ W.renders++; },confirm:()=>{ W.confirms++; return true; },
    kitPantry:o.pantry||{},panStatus:()=>"fresh",kitStaples:{},kitPrepDone:{},tab:"schedule",ROSTER_DEF:[],momdayData:{},prompt:()=>null,navigator:{},
    document:{getElementById:id=>W.els[id]||null,createElement:()=>({}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx);
  const run=e=>vm.runInContext(e,ctx);
  run(src.match(/const KIT_FRAC_GLYPH=\{[^}]+\};/)[0]+fn("kitSlug")+fn("kitQtyParse")+fn("kitIsoPlus"));
  run("var kitMeals="+J(o.meals||{m1:{name:"Burgers",emoji:"🍔",ing:"1 lb ground beef\nbuns"},m2:{name:"Roasted Broccoli",emoji:"🥦",ing:"broccoli\nolive oil",tags:["side"]},m3:{name:"Tacos",emoji:"🌮",ing:"corn tortillas"}})
     +"; var kitPlan="+J(o.plan||{})+"; var kitPickIso=null; var kitRotations={};");
  run(src.slice(ka,kb));
  run(src.slice(ga,gb)); ctx.grPriceLineHTML=()=>""; ctx.grStepperHTML=()=>""; ctx.grPaidBoxHTML=()=>""; ctx.grRepaint=()=>{};
  run([fn("kitPlanFor"),fn("kitSidesTxt"),fn("_calDinnerOf"),fn("kitRotMealByName"),fn("kitRotSlotVal"),fn("kitRotSlotName"),fn("kitRotPlanFor"),fn("kitRotCapture"),
       line("const KIT_MOVE_NAMES="),fn("_kitMvGet"),fn("_kitMvFixed"),fn("kitMoveChain"),fn("kitMoveForward"),fn("kitEatGate"),fn("_kitRefresh"),fn("kitAssign"),line("const KIT_TAGS=")].join("\n"));
  W.run=run; W.ctx=ctx; W.plan=()=>run("kitPlan"); W.planWrites=()=>W.writes.filter(w=>/^kitchen\/plan\//.test(w[1]));
  return W;
}
const MON="2026-10-26";   // a Monday; today in this world

console.log("\n── the old one-line text still works ──");
{ const W=world({plan:{[MON]:{mid:"m1",sides:"peas · rice"}}});
  const pl=W.run("kitPlanFor('"+MON+"')");
  ok("kitPlanFor shows the old text", pl.sides==="peas · rice"&&W.run("kitSidesTxt(kitPlanFor('"+MON+"'))")==="peas · rice");
  ok("…and hangs no list on it", !("sideList" in pl), Object.keys(pl));
  ok("the calendar / Corner line is unchanged", W.run("_calDinnerOf('"+MON+"')").name==="🍔 Burgers · peas · rice");
  ok("the week's shopping splits the old text as before", J(W.run("grWeekSources('"+MON+"',7)"))===J([{lines:"1 lb ground beef\nbuns",lbl:"Burgers (Mon)"},{lines:"peas\nrice",lbl:"sides (Mon)"}]));
}

console.log("\n── the first edit migrates the text into one plain side (that day only) ──");
{ const W=world({plan:{[MON]:{mid:"m1",sides:"peas · rice"},"2026-10-27":{mid:"m3",sides:"beans"}}});
  W.els["kit-side-in-"+MON]={value:"  steamed broccoli "};
  W.run("kitSideAddTyped('"+MON+"')");
  const p=W.plan()[MON];
  ok("the day's list = the old text as ONE plain side, then the new one", J(p.sideList)===J([{txt:"peas · rice"},{txt:"steamed broccoli"}]), p);
  ok("the old text is left in place on that day", p.sides==="peas · rice");
  ok("ONE targeted write: kitchen/plan/{iso}/sideList", J(W.planWrites())===J([["set","kitchen/plan/"+MON+"/sideList",[{txt:"peas · rice"},{txt:"steamed broccoli"}]]]), W.planWrites());
  ok("the other day is untouched (no list, text as it was)", !("sideList" in W.plan()["2026-10-27"])&&W.plan()["2026-10-27"].sides==="beans");
  ok("display now reads from the list", W.run("kitSidesTxt(kitPlanFor('"+MON+"'))")==="peas · rice · steamed broccoli");
  ok("the screen repaints", W.renders===1);
  W.els["kit-side-in-"+MON]={value:"   "}; W.run("kitSideAddTyped('"+MON+"')");
  ok("a blank entry writes nothing", W.planWrites().length===1);
}

console.log("\n── editing: add from the library, remove, empty, Mom-only, dry-run ──");
{ const W=world({plan:{[MON]:{mid:"m1",sideList:[{txt:"rice"}]}}});
  W.run("kitSideAddMid('"+MON+"','m2')");
  ok("a library side joins the list as {mid}", J(W.plan()[MON].sideList)===J([{txt:"rice"},{mid:"m2"}]));
  W.run("kitSideAddMid('"+MON+"','m2')");
  ok("the same recipe twice is not added twice (no write)", W.plan()[MON].sideList.length===2&&W.planWrites().length===1);
  W.run("kitSideAddMid('"+MON+"','nope')");
  ok("an unknown recipe id does nothing", W.planWrites().length===1);
  W.run("kitSideRemove('"+MON+"',0)");
  ok("✕ removes by position", J(W.plan()[MON].sideList)===J([{mid:"m2"}])&&J(W.planWrites()[1])===J(["set","kitchen/plan/"+MON+"/sideList",[{mid:"m2"}]]));
  W.run("kitSideRemove('"+MON+"',5)");
  ok("an out-of-range remove writes nothing", W.planWrites().length===2);
  W.run("kitSideRemove('"+MON+"',0)");
  const p=W.plan()[MON];
  ok("removing the last side clears the list AND the old text in one targeted update", !("sideList" in p)&&!("sides" in p)&&p.mid==="m1"&&J(W.planWrites()[2])===J(["update","kitchen/plan/"+MON,{sideList:null,sides:null}]), W.planWrites()[2]);
  ok("kitPlanFor then shows no sides at all", !("sides" in W.run("kitPlanFor('"+MON+"')")));
}
{ const W=world({plan:{[MON]:{mid:"m1",sides:"peas"}},mom:false});
  W.els["kit-side-in-"+MON]={value:"rice"}; W.run("kitSideAddTyped('"+MON+"')");
  ok("not Mom → her PIN is asked and nothing is written or changed", W.pins===1&&/Mom/.test(W.pinWhy)&&W.planWrites().length===0&&!("sideList" in W.plan()[MON]));
}
{ const W=world({plan:{[MON]:{mid:"m1"}},dry:true});
  W.els["kit-side-in-"+MON]={value:"rice"}; W.run("kitSideAddTyped('"+MON+"')");
  ok("?dryrun=1 keeps the change on the device only", J(W.plan()[MON].sideList)===J([{txt:"rice"}])&&W.writes.length===0);
}

console.log("\n── the day sheet's Sides editor ──");
{ const W=world({plan:{[MON]:{mid:"m1",sideList:[{mid:"m2"},{txt:"rice"}]}}});
  const h=W.run("kitSidesEditHTML('"+MON+"')");
  ok("a Sides row with each side as a chip", /class="lbl">Sides</.test(h)&&/🥦 Roasted Broccoli/.test(h)&&/>rice</.test(h));
  ok("each chip has ✕ → kitSideRemove(iso, i)", /kitSideRemove\('2026-10-26',0\)/.test(h)&&/kitSideRemove\('2026-10-26',1\)/.test(h));
  ok("a linked side opens its recipe", /kitOpenRecipe\('m2'\)/.test(h));
  ok("a text box to type a side (Enter or ＋ Add)", /id="kit-side-in-2026-10-26"/.test(h)&&/kitSideAddTyped\('2026-10-26'\)/.test(h));
  ok("the library picker lists only meals tagged side", /<option value="m2">/.test(h)&&!/<option value="m1">/.test(h)&&!/<option value="m3">/.test(h));
  const W2=world({meals:{m1:{name:"Burgers",emoji:"🍔"},m3:{name:"Apple slices"}},plan:{[MON]:{mid:"m1"}}});
  const h2=W2.run("kitSidesEditHTML('"+MON+"')");
  ok("no side-tagged meals → the whole library, A–Z", /none yet/.test(h2)&&h2.indexOf('<option value="m3">')<h2.indexOf('<option value="m1">'));
  ok("the editor sits under the dinner row on the Mom view of the day sheet", /if\(din&&kitEatGate\(\)&&typeof kitSidesEditHTML==="function"\) h\+=kitSidesEditHTML\(iso\);/.test(src));
  ok("KIT_TAGS has the side tag", W.run("KIT_TAGS.some(t=>t[0]==='side')"));
}

console.log("\n── display: joined with ' · ', linked ones with their emoji ──");
{ const W=world({plan:{[MON]:{mid:"m1",sideList:[{mid:"m2"},{txt:"rice"}]},"2026-10-27":{txt:"Pizza night",sideList:[{txt:"salad"}]},"2026-10-28":{mid:"m1",sideList:[{mid:"gone"}]}}});
  ok("linked + plain", W.run("kitSidesTxt(kitPlanFor('"+MON+"'))")==="🥦 Roasted Broccoli · rice");
  ok("kitPlanFor also hands over the resolved list", J(W.run("kitPlanFor('"+MON+"').sideList.map(s=>s.mid?s.mid+':'+s.meal.name:s.txt)"))===J(["m2:Roasted Broccoli","rice"]));
  ok("the calendar / Corner line", W.run("_calDinnerOf('"+MON+"')").name==="🍔 Burgers · 🥦 Roasted Broccoli · rice");
  ok("a typed dinner keeps its sides too", W.run("_calDinnerOf('2026-10-27')").name==="Pizza night · salad");
  ok("a side whose recipe was deleted says so instead of vanishing", W.run("kitSidesTxt(kitPlanFor('2026-10-28'))")==="(side removed)");
  ok("Firebase's {0:…,1:…} shape reads as a list", W.run("kitSidesJoin(kitSideRaw({sideList:{0:{txt:'a'},1:{mid:'m2'}}}).map(kitSideResolve))")==="a · 🥦 Roasted Broccoli");
}

console.log("\n── rotations: the sd slot ──");
{ const W=world();
  const plan=W.run("kitRotPlanFor({weeks:[[{d:'Burgers',sd:['roasted broccoli','Rice']},{d:'Tacos',sd:'Roasted Broccoli · rice'},{d:'Tacos',sd:'peas · rice'},{d:'Burgers'}]]},'"+MON+"')");
  ok("a list of names: a library match links (case-insensitive), the rest is plain", J(plan[MON].sideList)===J([{mid:"m2"},{txt:"Rice"}])&&plan[MON].mid==="m1");
  ok("the old string, split on ·, resolves the same way", J(plan["2026-10-27"].sideList)===J([{mid:"m2"},{txt:"rice"}]));
  ok("an old string nobody's library knows → plain sides", J(plan["2026-10-28"].sideList)===J([{txt:"peas"},{txt:"rice"}])&&!("sides" in plan["2026-10-28"]));
  ok("no sd → no sides and no list (as before)", J(plan["2026-10-29"])===J({mid:"m1"}));
  const W2=world({plan:{[MON]:{mid:"m1",sideList:[{mid:"m2"},{txt:"rice"}]},"2026-10-27":{mid:"m3",sides:"beans"},"2026-10-28":{mid:"m3"}}});
  const cap=W2.run("kitRotCapture('"+MON+"',1)").weeks[0];
  ok("capture saves a list of names", J(cap[0].sd)===J(["Roasted Broccoli","rice"]));
  ok("…the old text as it was, and nothing when a day has none", cap[1].sd==="beans"&&!("sd" in cap[2]));
  ok("the editor shows a saved list as one line", W.run("kitRotSdStr(['Roasted Broccoli','rice'])")==="Roasted Broccoli · rice"&&W.run("kitRotSdStr('peas · rice')")==="peas · rice"&&W.run("kitRotSdStr(null)")==="");
}

console.log("\n── grocery: the week's shopping ──");
{ const W=world({plan:{[MON]:{mid:"m1",sideList:[{mid:"m2"},{txt:"steamed broccoli"}]},"2026-10-27":{mid:"m3",sideList:[{txt:"rice"}]},"2026-10-28":{txt:"Pizza night",sideList:[{txt:"rice"}]},"2026-10-29":{mid:"m1",sideList:[{txt:"peas · corn"}]}},
                  pantry:{p1:{name:"Steamed broccoli",zone:"fridge",addedIso:"2026-10-25"}}});
  const srcs=W.run("grWeekSources('"+MON+"',7)");
  ok("a linked side rides as its own recipe — the meal-chip path a dinner uses", J(srcs[1])===J({lines:"broccoli\nolive oil",lbl:"Roasted Broccoli (Mon)"}));
  ok("a plain side is one line, tagged to the dinner and the day", J(srcs[2])===J({lines:"steamed broccoli",lbl:"Burgers (Mon)"})&&J(srcs[4])===J({lines:"rice",lbl:"Tacos (Tue)"}));
  ok("…under a typed dinner's name too", J(srcs[5])===J({lines:"rice",lbl:"Pizza night (Wed)"}));
  ok("a migrated 'peas · corn' side still becomes two lines", J(srcs[7])===J({lines:"peas\ncorn",lbl:"Burgers (Thu)"}));
  const rows=W.run("grIngRows(grWeekSources('"+MON+"',7))");
  const names=rows.map(r=>r.p.name);
  ok("the linked side's ingredients reach the list once each", names.filter(n=>n==="Broccoli").length===1&&names.filter(n=>n==="Olive oil").length===1, names);
  const sb=rows.find(r=>r.p.name==="Steamed broccoli");
  ok("the plain side is ONE item named by its text", sb&&names.filter(n=>n==="Steamed broccoli").length===1&&J(sb.meals)===J(["Burgers (Mon)"]));
  ok("…and starts unticked when it is already in the pantry", sb&&sb.why==="🥫 in pantry"&&sb.on===false, sb);
  const rice=rows.find(r=>r.p.name==="Rice");
  ok("the same plain side on two days → ONE row carrying both days", rice&&names.filter(n=>n==="Rice").length===1&&J(rice.meals)===J(["Tacos (Tue)","Pizza night (Wed)"]), rice);
  W.ctx.__rows=rows; W.run("_grImp={title:'t',rows:__rows,many:true}; grImpAdd()");   // _grImp is a let inside the block — set it from inside
  const items=W.run("Object.values(grData.items)");
  ok("adding the week makes one Rice item with the meal chip of both days", items.filter(i=>i.name==="Rice").length===1&&J(items.find(i=>i.name==="Rice").src)===J([{k:"meal",lbl:"Tacos (Tue), Pizza night (Wed)"}]), items.find(i=>i.name==="Rice"));
  ok("the pantry item was left off (unticked)", !items.some(i=>i.name==="Steamed broccoli"));
  W.run("_grImp={title:'t',rows:grIngRows(grWeekSources('"+MON+"',7)),many:true}; grImpAdd()");
  ok("adding again merges into the same items — no duplicates", W.run("Object.values(grData.items)").filter(i=>i.name==="Rice").length===1&&W.run("Object.values(grData.items)").filter(i=>i.name==="Broccoli").length===1);
}

console.log("\n── ➡ Move forward carries the list; kitAssign drops it ──");
{ const W=world({plan:{[MON]:{mid:"m1",sideList:[{mid:"m2"},{txt:"rice"}]},"2026-10-27":{txt:"Tacos"}}});
  W.run("kitMoveForward('"+MON+"','d')");
  const P=W.plan(), up=W.writes.find(w=>w[0]==="update"&&w[1]==="kitchen")[2];
  ok("Burgers + its sides land on Tuesday; Tacos (no sides) on Wednesday", P["2026-10-27"].mid==="m1"&&J(P["2026-10-27"].sideList)===J([{mid:"m2"},{txt:"rice"}])&&P["2026-10-28"].txt==="Tacos"&&!("sideList" in P["2026-10-28"])&&!(MON in P), P);
  ok("the write carries the list to the new day and clears the old", J(up["plan/2026-10-27/sideList"])===J([{mid:"m2"},{txt:"rice"}])&&up["plan/"+MON+"/sideList"]===null, up);
  ok("a day that never had a list gets no sideList path", !("plan/2026-10-28/sideList" in up), Object.keys(up));
  W.run("kitAssign('2026-10-27',{mid:'m3'})");
  ok("picking a different dinner drops the old sides and the list", J(P["2026-10-27"])===J({mid:"m3"}), P["2026-10-27"]);
}

console.log("\n── no sides anywhere → byte-identical to before ──");
{ const W=world({plan:{[MON]:{mid:"m1"},"2026-10-27":{txt:"Tacos"},"2026-10-28":{mid:"m3",l:{mid:"m2"}}}});
  ok("kitPlanFor: exactly {mid, meal}", J(W.run("kitPlanFor('"+MON+"')"))===J({mid:"m1",meal:{name:"Burgers",emoji:"🍔",ing:"1 lb ground beef\nbuns"}}));
  ok("kitPlanFor: exactly {txt}", J(W.run("kitPlanFor('2026-10-27')"))===J({txt:"Tacos"}));
  ok("the calendar line", W.run("_calDinnerOf('"+MON+"')").name==="🍔 Burgers"&&W.run("_calDinnerOf('2026-10-27')").name==="Tacos");
  ok("the week's shopping sources", J(W.run("grWeekSources('"+MON+"',7)"))===J([{lines:"1 lb ground beef\nbuns",lbl:"Burgers (Mon)"},{lines:"corn tortillas",lbl:"Tacos (Wed)"},{lines:"broccoli\nolive oil",lbl:"Roasted Broccoli (Wed)"}]));
  W.run("kitMoveForward('"+MON+"','d')");
  const up=W.writes.find(w=>w[0]==="update"&&w[1]==="kitchen")[2];
  ok("Move forward writes only mid/txt/sides paths, as before", Object.keys(up).every(k=>/\/(mid|txt|sides)$/.test(k)), Object.keys(up));
  ok("a rotation day with no sd writes no sides keys", J(W.run("kitRotPlanFor({weeks:[[{d:'Burgers',b:'Oatmeal'}]]},'"+MON+"')")["2026-10-26"])===J({mid:"m1",b:{txt:"Oatmeal"}}));
  ok("kitSidesEditHTML needs a dinner on screen — the sheet only calls it when there is one", /if\(din&&kitEatGate\(\)/.test(src));
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
