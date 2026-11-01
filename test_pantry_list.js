/* 🥫 PAN_LIST — "What's in the house" (her ask 2026-11-01: "Dad needs to see all the food items to see what he can eat
 * or cook. Change how it looks — it's really messy. Easy to look at, alphabetical in each category … know what's in the
 * freezer without opening the doors."). The chip cloud on the Meals tab becomes one list per place; a row tap opens a
 * sheet; spices fold into their own group; 🍽 tags what this week's meals use; a 14-day 🍽 Eaten log.
 * run: node test_pantry_list.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const fn1=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n",i)); };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const writes=[], pops=[], adds=[], mem=[], toasts=[], dels=[];
const iso=(s,n)=>{ const d=new Date(s+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const ctx={console,Math,JSON,Object,Array,String,Number,Date,RegExp,parseInt,isNaN,
  db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
  HA_LS:{getItem:()=>null,setItem:()=>{}}, _todayStr:()=>"2026-11-01", grIsProduceName:()=>false,
  gwParseDate:s=>new Date(s+"T12:00:00"), kitIsoPlus:iso,
  esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),
  grPop:h=>pops.push(h), grPopClose:()=>pops.push(""), GR_BTN:"", SHOP_LIST_NAME:"Shopping List",
  grRepaint:()=>{}, mwToast:m=>toasts.push(m), confirm:()=>true, panDel:id=>dels.push(id),
  grMemUpdate:(n,p)=>mem.push([n,p]), grAdd:(t,by,x)=>adds.push([t,by,x]), grFromPantry:id=>adds.push(["mom",id]),
  grIsBasic:n=>/^(salt|water)$/i.test(n),
  grIngParse:l=>{ const s=String(l).replace(/^[\d\s\/.]+(?:lbs?|tsp|tbsp|cups?)?\s*/i,"").trim(); return s?{name:s}:null; },
  grPanFind:n=>{ const k=Object.keys(ctx.kitPantry).find(id=>String(ctx.kitPantry[id].name).toLowerCase()===String(n).toLowerCase()); return k?{pid:k,how:"exact"}:null; },
  kitPantry:{}, kitMeals:{}, kitPlan:{}, kitStaples:{}};
vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf("const GR_PLACES="),src.indexOf("function grPlaceOf(")),ctx);
["grPlaceOf","grPanSet","panZoneMeta","panStatus","panIsRegular","grPutDate","grPanOldIds"].forEach(n=>vm.runInContext(n==="grPutDate"||n==="grPanOldIds"?fn1(n):fn(n),ctx));
vm.runInContext(line("const PAN_ZONES="),ctx);
vm.runInContext(line("const PAN_ZONE_EMOJI="),ctx);
const P0=src.indexOf("/* PAN_LIST — "), P1=src.indexOf("// PAN_LIST_END");
if(P0<0||P1<P0) throw new Error("PAN_LIST block not found");
vm.runInContext(src.slice(P0,P1),ctx);
const R=e=>vm.runInContext(e,ctx);

// ── a realistic house: every place, a dozen spice jars, one old fridge item ──
R(`kitPantry={
  a1:{name:"white rice",zone:"pantry",addedIso:"2026-10-25",qty:2}, a2:{name:"Black beans",zone:"pantry",addedIso:"2026-10-25",qty:4},
  a3:{name:"cumin",zone:"pantry",addedIso:"2026-10-25"}, a4:{name:"Cajun seasoning",zone:"pantry",addedIso:"2026-10-25"},
  a5:{name:"basil (dried)",zone:"pantry",addedIso:"2026-10-25"}, a6:{name:"roasted red peppers",zone:"pantry",addedIso:"2026-10-25"},
  a7:{name:"saltine crackers",zone:"pantry",addedIso:"2026-10-25"}, a8:{name:"garlic salt",zone:"pantry",addedIso:"2026-10-25"},
  a9:{name:"Mrs. Dash",zone:"pantry",addedIso:"2026-10-25"}, a10:{name:"seasoned rice vinegar",zone:"pantry",addedIso:"2026-10-25"},
  b1:{name:"milk",zone:"fridge",addedIso:"2026-10-30",qty:1}, b2:{name:"Leftover soup",zone:"fridge",addedIso:"2026-09-01"},
  c1:{name:"peas",zone:"freezer",addedIso:"2026-10-01"},
  d1:{name:"ground beef",zone:"deepfreezer",addedIso:"2026-10-01",qty:6}, d2:{name:"Beef shank",zone:"deepfreezer",addedIso:"2026-10-01",qty:0},
  e1:{name:"bananas",zone:"counter",addedIso:"2026-10-31"},
  f1:{name:"paper towels",zone:"household",addedIso:"2026-10-01"},
  g1:{name:"chicken thighs",zone:"produce",addedIso:"2026-10-31"}
}; kitStaples={s1:{name:"milk",state:"have"}};`);

console.log("── spices fold into their own group (pantry only) ──");
["cumin","Cajun seasoning","basil (dried)","garlic salt","Mrs. Dash","ginger (ground)","black pepper","bay leaves","steak rub (Emeril's)","Onion powder","everything bagel seasoning","dill seed","sesame seeds"].forEach(n=>
  ok("spice: "+n, R("panIsSpice("+JSON.stringify(n)+")")));
["roasted red peppers","saltine crackers","seasoned rice vinegar","chia seeds","cocoa powder","baking powder","chili soup mix","Hormel chili","sesame oil (?)","dill pickles"].forEach(n=>
  ok("not a spice: "+n, !R("panIsSpice("+JSON.stringify(n)+")")));

console.log("── the list ──");
let h=R("panListHTML()");
const secs=[...h.matchAll(/data-pan-sec="([a-z]+)"/g)].map(m=>m[1]);
ok("places in GR_PLACES order, 🥶 Deep freezer after ❄️ Freezer, 🧂 inside Pantry", JSON.stringify(secs)===JSON.stringify(["pantry","spice","fridge","freezer","deepfreezer","counter","household"]), secs);
const names=[...h.matchAll(/data-pan-name="([^"]+)"/g)].map(m=>m[1]);
const pantryFood=names.slice(0,names.indexOf("basil (dried)"));
ok("Pantry food rows alphabetical, spices left out of them", JSON.stringify(pantryFood)===JSON.stringify(["black beans","roasted red peppers","saltine crackers","seasoned rice vinegar","white rice"]), pantryFood);
const spiceRows=names.slice(names.indexOf("basil (dried)"),names.indexOf("basil (dried)")+5);
ok("🧂 rows alphabetical", JSON.stringify(spiceRows)===JSON.stringify(["basil (dried)","cajun seasoning","cumin","garlic salt","mrs. dash"]), spiceRows);
ok("old 🥬 produce item shows under a real place (Fridge)", /data-pan-sec="fridge"[\s\S]*data-pan-name="chicken thighs"[\s\S]*data-pan-sec="freezer"/.test(h));
ok("search box #pan-q filters live without a repaint", h.includes('id="pan-q"') && h.includes('oninput="panListFilter(this.value,this)"'));
ok("every row carries data-pan-name (lowercase)", names.length===Object.keys(ctx.kitPantry).length && names.every(n=>n===n.toLowerCase()), names.length);
ok("add row (name + place + ＋ Add) sits up top, before the first place", h.indexOf('id="pan-new"')>0 && h.indexOf('id="pan-new"')<h.indexOf('data-pan-sec=') && h.includes('<option value="deepfreezer">🥶 Deep freezer</option>'));
ok("⚠️ N may be old — check opens Still in the house?", /grPanCheckOpen\(\)[^>]*>⚠️ 1 may be old — check/.test(h));
ok("Fridge summary: count badge + red 1 ⚠️", /data-pan-sec="fridge"[^]*?>3<\/span><span[^>]*color:#b91c1c">1 ⚠️/.test(h));
ok("Pantry badge counts everything in it (food + spices)", /data-pan-sec="pantry"[^]*?>10<\/span>/.test(h));
const openOf=k=>new RegExp('data-pan-sec="'+k+'"[^>]*?data-pan-dflt="\\d" open ').test(h);
ok("Mom: places open by default …", ["pantry","fridge","freezer","deepfreezer","counter"].every(openOf));
ok("… except 🧻 Household and 🧂 Spices", !openOf("household") && !openOf("spice"));
ok("row: name · ×qty", /white rice <span[^>]*>×2<\/span>/.test(h));
ok("row: qty 0 reads 'out'", /Beef shank <span[^>]*>out<\/span>/.test(h));
ok("row: ⭐ for a regular", /milk <span[^>]*>×1<\/span><\/span><span title="a regular/.test(h));
ok("row: status dots — green fresh, red old", /data-pan-name="milk"[^]*?background:#22c55e/.test(h) && /data-pan-name="leftover soup"[^]*?background:#dc2626/.test(h));
ok("no ✎ manage mode, no chips", !h.includes("panToggleManage") && !h.includes("panChip("));

console.log("── 🍽 used by a planned meal (next 7 days) ──");
R(`kitMeals={m1:{name:"Tacos",emoji:"🌮",uses:[{name:"ground beef"},{name:"salt"}]},m2:{name:"Chicken bowls",ing:"1 lb chicken thighs\\n2 cups white rice + 1 tsp cumin"},
  m3:{name:"Soup night",uses:[{name:"Leftover soup"}]},m4:{name:"Peas & rice",uses:[{name:"peas"}]},m5:{name:"Banana oats",uses:[{name:"bananas"}]}};
  kitPlan={"2026-11-03":{mid:"m1"},"2026-11-04":{mid:"m2"},"2026-11-02":{mid:"m3",eaten:1},"2026-11-05":{mid:"m4",skipped:1},"2026-11-09":{mid:"m4"},"2026-11-01":{b:{mid:"m5"}}};`);
const U=R("panUsedByMap()");
ok("dinner `uses` → its weekday", U.d1==="Tue", U);
ok("ingredient lines read like grWeekNeeds (incl. 'a + b' lines)", U.g1==="Wed" && U.a1==="Wed" && U.a3==="Wed", U);
ok("a breakfast slot counts too, today reads 'Today'", U.e1==="Today", U);
ok("an ✓ eaten or ✗ skipped dinner doesn't tag, nor a day past the week", !U.b2 && !U.c1, U);
ok("basics (salt) never tag", !Object.keys(U).some(k=>ctx.kitPantry[k].name==="salt"));
h=R("panListHTML()");
ok("the tag rides the row", /data-pan-name="ground beef"[^]*?🍽 Tue/.test(h));

console.log("── search keeps her place ──");
R(`panQ="beef"`); h=R("panListHTML()");
ok("a repaint while searching hides rows that don't match", /data-pan-name="milk"[^>]*style="display:none/.test(h) && /data-pan-name="ground beef"[^>]*style="display:flex/.test(h));
ok("… hides places with no match and opens the one that has it", /data-pan-sec="fridge"[^>]*style="display:none/.test(h) && /data-pan-sec="deepfreezer"[^>]*open /.test(h));
R(`panQ=""`);
// a tiny DOM for the live filter
const mkRow=n=>({style:{display:"flex"},getAttribute:()=>n});
const rows={pantry:[mkRow("white rice")],spice:[mkRow("cumin")],fridge:[mkRow("milk")]};
const mkDet=(key,rs,dflt)=>({style:{},open:dflt,getAttribute:a=>a==="data-pan-key"?key:(a==="data-pan-dflt"?(dflt?"1":"0"):null),querySelectorAll:()=>rs});
const dets=[mkDet("m:pantry",rows.pantry.concat(rows.spice),true),mkDet("m:spice",rows.spice,false),mkDet("m:fridge",rows.fridge,true)];
ctx.document={getElementById:id=>id==="pan-list"?{querySelectorAll:s=>s==="[data-pan-name]"?rows.pantry.concat(rows.spice,rows.fridge):dets}:null};
R(`panListFilter("CUM")`);
ok("live filter: case-insensitive, row display only", rows.spice[0].style.display==="flex" && rows.pantry[0].style.display==="none" && rows.fridge[0].style.display==="none");
ok("live filter: 🧂 opens, Pantry stays, Fridge hides", dets[1].open===true && dets[1].style.display==="" && dets[0].style.display==="" && dets[2].style.display==="none");
R(`panListFilter("")`);
ok("clearing the box puts every row and place back as they were", rows.fridge[0].style.display==="flex" && dets[2].style.display==="" && dets[1].open===false && dets[0].open===true);
R(`panSecToggle("m:fridge",false)`); ok("a toggle right after a filter isn't taken as her choice", !("m:fridge" in R("panOpenSt")));
R(`_panFilterTs=0; panSecToggle("m:fridge",false)`);
h=R("panListHTML()"); ok("her own close sticks across repaints — Fridge renders closed", R("panOpenSt['m:fridge']")===false && /data-pan-sec="fridge"[^>]*?data-pan-dflt="1" ontoggle/.test(h));
R(`panOpenSt={}`);

console.log("── the row sheet ──");
pops.length=0; R(`panRowSheet("d1")`); let s=pops.pop();
ok("Mom's sheet: name + place, − / n / +, Move to… 6 places, ⭐, 🛒, 📅, ✕ Remove, Close",
  s.includes("ground beef") && s.includes("🥶 Deep freezer") && s.includes("panQtyStep('d1',-1)") && s.includes(">6<") && s.includes("panQtyStep('d1',1)")
  && (s.match(/panRowMove\('d1'/g)||[]).length===6 && s.includes("panToggleRegular('d1')") && s.includes("grFromPantry('d1')") && s.includes('type="date"') && s.includes("panRowDel('d1')") && s.includes("Close"));
writes.length=0; R(`panQtyStep("d1",1)`);
ok("+ writes kitchen/pantry/{id} qty (targeted update)", ctx.kitPantry.d1.qty===7 && writes.length===1 && writes[0][0]==="update" && writes[0][1]==="kitchen/pantry/d1" && writes[0][2].qty===7, writes);
R(`panQtyStep("d2",-1)`); ok("− never goes below 0", ctx.kitPantry.d2.qty===0);
writes.length=0; mem.length=0; R(`panRowMove("c1","deepfreezer")`);
ok("Move to… writes the zone and teaches the list memory", ctx.kitPantry.c1.zone==="deepfreezer" && writes.some(w=>w[1]==="kitchen/pantry/c1"&&w[2].zone==="deepfreezer") && mem[0][1].zone==="deepfreezer", [writes,mem]);
writes.length=0; R(`panRowMove("c1","deepfreezer")`); ok("moving to where it already is writes nothing", writes.length===0);
R(`panRowDate("b1","2026-11-09")`); ok("📅 sets useBy through grPutDate", ctx.kitPantry.b1.useBy==="2026-11-09");
dels.length=0; R(`panRowDel("e1")`); ok("✕ Remove (after confirm) goes through panDel", dels[0]==="e1");
ctx.confirm=()=>false; dels.length=0; R(`panRowDel("e1")`); ok("✕ Remove cancelled → nothing", dels.length===0); ctx.confirm=()=>true;

console.log("── read-only (Dad's Day) ──");
h=R("panListHTML({readonly:true})");
ok("no add row, no checks", !h.includes('id="pan-new"') && !h.includes("grPanCheckOpen") && !h.includes("panClearGone"));
ok("every place closed by default", !/data-pan-sec="[a-z]+"[^>]*? open /.test(h));
ok("rows open the read-only sheet", h.includes("panRowSheet('d1',1)") && !h.includes("panRowSheet('d1')\""));
ok("rows keep name/qty/dot/🍽 used-by", /ground beef <span[^>]*>×7/.test(h) && h.includes("🍽 Tue") && h.includes("background:#22c55e"));
ok("Dad's open/closed is his own (d: keys)", h.includes("data-pan-key=\"d:pantry\""));
pops.length=0; R(`panRowSheet("d1",1)`); s=pops.pop();
ok("Dad's sheet: only 🛒 Add to the list + Close", s.includes("panDadAdd('d1')") && s.includes("Close") && !/panQtyStep|panRowMove|panToggleRegular|panRowDel|grFromPantry|type="date"/.test(s), s);
adds.length=0; R(`panDadAdd("d1")`); ok("🛒 adds as Dad (like his own add box)", adds[0][0]==="ground beef" && adds[0][1]==="dad" && adds[0][2].src.k==="dad", adds);

console.log("── 🍽 Eaten log ──");
R(`kitPlan={"2026-10-19":{mid:"m1",eaten:1},"2026-10-20":{mid:"m1",eaten:1},"2026-10-25":{mid:"m2",skipped:1},"2026-10-30":{txt:"Pizza out"},"2026-11-01":{mid:"m1"}}`);
const L=R("panEatLogHTML()");
const marks=[...L.matchAll(/data-eat="([a-z]+)" onclick="panEatDay\('([\d-]+)'\)/g)].map(m=>m[2].slice(5)+":"+m[1]);
ok("14 pills, oldest first, ending today", marks.length===14 && marks[0].startsWith("10-19") && marks[13].startsWith("11-01"), marks);
ok("✓ eaten · ✗ skipped · – unmarked · blank when no dinner", marks[0]==="10-19:ate" && marks[1]==="10-20:ate" && marks[6]==="10-25:skip" && marks[11]==="10-30:open" && marks[13]==="11-01:open" && marks[2]==="10-21:none", marks);
ok("pill reads 'Mon 10/19 🌮 ✓'", /Mon 10\/19 🌮 <b style="color:#16a34a">✓<\/b>/.test(L));
ok("summary counts", L.includes("2 eaten · 1 skipped"));
ok("tap opens the calendar day sheet (kitFlagSwap's door)", /calDaySel=iso; mpGoto\('cal'\)/.test(fn("panEatDay")));

console.log("── wiring ──");
const rk=fn("renderKitchen");
ok("Meals tab: the 🥫 card is 'What's in the house' and draws panListHTML()", rk.includes("What\\'s in the house") && rk.includes("h+=panListHTML();") && !rk.includes("panChip(") && !rk.includes("panToggleManage()"));
ok("… the 📥 Import panel and sweep checkbox stay", rk.includes("panImportToggle()") && rk.includes('id="pan-sweep"') && rk.includes("panImportApply()"));
ok("🍽 Eaten log sits right under 🗓 This week's dinners, above 📚 Meal library", rk.indexOf("h+=panEatLogHTML();")>rk.indexOf("This week\\'s ") && rk.indexOf("h+=panEatLogHTML();")<rk.indexOf("📚 Meal library"));
ok("panToggleManage / panChip still defined (nothing else breaks)", src.includes("function panToggleManage(") && src.includes("function panChip("));

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
