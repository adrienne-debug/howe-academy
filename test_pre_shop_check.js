/* 🛒 PRESHOP — the Pre-shop check (her ask 2026-11-01: a Sunday review before the order — every recipe planned for the
 * next 7 days, each ingredient ✓ have / ✗ out / ? check, counts running DOWN as the week's meals use things up, one tap
 * per line to 🛒 add or ✓ we have it, "Actually we're out" on a ✓ line, a summary at the top).
 * Loads the real matching helpers (grPanFind, grIngParse, grKey …) and the PRESHOP block; the list, the pantry write and
 * Firebase are fakes that record what they were asked to do.
 * run: node test_pre_shop_check.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// PRESHOP_START"), b=src.indexOf("// PRESHOP_END");
if(a<0||b<0){ console.error("PRESHOP markers missing"); process.exit(1); }
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const fn1=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n",i)); };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const TODAY="2026-11-01";   // a Sunday

function mk(o){
  o=o||{};
  const writes=[], toasts=[], pop={html:null}, created=[];
  const ctx={console,Math,JSON,Object,Array,String,Number,Date,RegExp,parseInt,parseFloat,isNaN,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    _dryRun:()=>!!o.dry, HA_LS:{getItem:()=>null,setItem:()=>{}}, _todayStr:()=>o.today||TODAY,
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
    grPop:h=>{ pop.html=h; }, grPopClose:()=>{ pop.html=""; }, GR_BTN:"", SHOP_LIST_NAME:"Shopping List",
    grRepaint:()=>{}, mwToast:m=>toasts.push(m), grSave:()=>{}, grGate:then=>then(),
    kitOutStrip:(iso,p)=>p,
    kitPantry:o.pantry||{}, kitMeals:o.meals||{}, kitPlan:o.plan||{}, kitStaples:o.staples||{}, kitSettings:o.settings||{},
    grData:{items:o.items||{},skipneed:o.skipneed||{}}};
  // on the list = a real item by the same name, or a ⭐ staple marked low/out (those are virtual list rows)
  ctx.grFindDup=n=>{ const k=ctx.grKey(n);
    const id=Object.keys(ctx.grData.items).find(i=>ctx.grKey(ctx.grData.items[i].name)===k); if(id) return {kind:"item",id:id};
    const s=Object.keys(ctx.kitStaples).find(i=>(ctx.kitStaples[i].state==="out"||ctx.kitStaples[i].state==="low")&&ctx.grKey(ctx.kitStaples[i].name)===k);
    return s?{kind:"virt"}:null; };
  ctx.grCreate=(p,srcx,stores)=>{ const id="g"+created.length; ctx.grData.items[id]=Object.assign({},p,{src:[srcx]}); created.push([p,srcx]); return id; };
  vm.createContext(ctx);
  [line("const GR_PAN_STOP="),line("const GR_BASICS="),line("const GR_ING_UNITS="),line("const GR_ING_DROP="),line("const KIT_FRAC_GLYPH="),line("const KIT_PARTS="),
   fn("gwParseDate"),fn("kitIsoPlus"),fn("grKey"),fn1("grPanSig"),fn("grPanFind"),fn1("grIsStapleName"),fn("grIngParse"),fn1("grIsBasic"),fn1("grNeedSkip"),
   fn1("kitSlug"),fn("kitQtyParse"),fn1("kitSlotsPartVal"),fn("kitSlotsParts"),fn1("kitSlotsList"),fn("kitSideRaw"),fn("grPanSet")].forEach(c=>vm.runInContext(c,ctx));
  vm.runInContext(src.slice(a,b),ctx);
  const run=e=>vm.runInContext(e,ctx);
  const tap=h=>vm.runInContext(h,ctx);
  return {ctx,writes,toasts,pop,created,run,tap};
}
const lineOf=(r,dayIso,meal,name)=>{ const d=r.days.find(x=>x.iso===dayIso); const m=d&&d.items.find(x=>x.name===meal); return m&&m.lines.find(l=>l.name===name); };
const onclicks=h=>{ const out=[]; const re=/onclick="([^"]*)"/g; let m; while((m=re.exec(h))) out.push(m[1]); return out; };

const PANTRY={
  p1:{name:"frozen peas",zone:"freezer",qty:1,addedIso:"2026-10-25"},
  p2:{name:"ground beef",zone:"deepfreezer",qty:3,addedIso:"2026-10-25"},
  p3:{name:"Black beans",zone:"pantry",qty:0,addedIso:"2026-10-25"},
  p4:{name:"white rice",zone:"pantry",addedIso:"2026-10-25"},          // not counted
  p5:{name:"Worcestershire sauce",zone:"fridge",qty:1,addedIso:"2026-10-25"},
  p6:{name:"tortillas",zone:"pantry",qty:2,addedIso:"2026-10-25"}};
const MEALS={
  m1:{name:"Shepherd's Pie",emoji:"🥧",uses:[{name:"frozen peas",qty:1},{name:"ground beef",qty:2}]},
  m2:{name:"Fried Rice",uses:[{name:"frozen peas",qty:1},{name:"white rice",qty:1}]},
  m3:{name:"Pizza Quesadillas",uses:[{name:"tortillas",qty:1},{name:"pizza sauce",qty:1}]},
  m4:{name:"Bean Tacos",uses:[{name:"black beans",qty:2},{name:"tortillas",qty:1},{name:"bananas",qty:1}]},
  m5:{name:"Old Chili",ing:"1 lb ground beef\n2 cans black beans\n1 tsp cumin\nsalt\n3 avocados\n1 cup white rice"},
  m6:{name:"Oatmeal",uses:[{name:"oats",qty:1}]}};

console.log("── the running tally ──");
{
  const T=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m1"},"2026-11-04":{mid:"m2"}}});
  const r=T.run("grPreShop('"+TODAY+"')");
  const a1=lineOf(r,"2026-11-02","Shepherd's Pie","frozen peas"), a2=lineOf(r,"2026-11-04","Fried Rice","frozen peas");
  ok("first recipe gets the last bag of peas → ✓ have", a1&&a1.st==="have", a1);
  ok("…and it says how many are left after it", a1&&/have 1 → 0 left/.test(a1.why), a1&&a1.why);
  ok("second recipe needing peas → ✗ out (the earlier one used it up)", a2&&a2.st==="out", a2);
  ok("…and says who used it", a2&&/goes to Mon · Shepherd's Pie/.test(a2.why), a2&&a2.why);
  const beef=lineOf(r,"2026-11-02","Shepherd's Pie","ground beef");
  ok("uses qty counts: 3 beef − 2 → ✓, 1 left", beef&&beef.st==="have"&&/→ 1 left/.test(beef.why), beef);
  const rice=lineOf(r,"2026-11-04","Fried Rice","white rice");
  ok("an uncounted pantry item is ✓ have", rice&&rice.st==="have"&&/not counted/.test(rice.why), rice);
  const g=r.groups.find(x=>x.name==="frozen peas");
  ok("peas are one group across both recipes, need 2 vs have 1 → add 1", g&&g.need===2&&g.qty===1&&g.bad, g);
  ok("summary: 2 recipes · 1 to buy · 0 to check", r.sum.recipes===2&&r.sum.buy===1&&r.sum.check===0, r.sum);
  ok("summary text", T.run("grPreShopSumTxt(grPreShop('"+TODAY+"').sum)")==="7 days · 2 recipes · 1 to buy · 0 to check");
  // the same two dinners the other way round: now Fried Rice gets the peas
  const T2=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m2"},"2026-11-04":{mid:"m1"}}});
  const r2=T2.run("grPreShop('"+TODAY+"')");
  ok("date order decides who gets it", lineOf(r2,"2026-11-02","Fried Rice","frozen peas").st==="have"&&lineOf(r2,"2026-11-04","Shepherd's Pie","frozen peas").st==="out");
  // only 1 left but a recipe needs 2
  const T3=mk({pantry:{p2:{name:"ground beef",zone:"freezer",qty:1}},meals:MEALS,plan:{"2026-11-02":{mid:"m1"}}});
  const b3=lineOf(T3.run("grPreShop('"+TODAY+"')"),"2026-11-02","Shepherd's Pie","ground beef");
  ok("1 in the house, needs 2 → ✗ only 1 left", b3&&b3.st==="out"&&/only 1 left · this needs 2/.test(b3.why), b3);
}

console.log("── ✗ out, ? check, close guesses ──");
{
  const T=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-03":{mid:"m3"},"2026-11-05":{mid:"m4"}}});
  const r=T.run("grPreShop('"+TODAY+"')");
  const sauce=lineOf(r,"2026-11-03","Pizza Quesadillas","pizza sauce");
  ok("pizza sauce: grPanFind only has a close guess (Worcestershire) → ? check, never ✓", sauce&&sauce.st==="check", sauce);
  ok("…with the guess as a hint", sauce&&/is it the Worcestershire sauce\?/.test(sauce.why), sauce&&sauce.why);
  const ban=lineOf(r,"2026-11-05","Bean Tacos","bananas");
  ok("no pantry match at all → ? check · not on the house list", ban&&ban.st==="check"&&/not on the house list/.test(ban.why), ban);
  const bb=lineOf(r,"2026-11-05","Bean Tacos","black beans");
  ok("matched but qty 0 → ✗ out — 0 in the house (case/plural-blind match)", bb&&bb.st==="out"&&/0 in the house/.test(bb.why), bb);
  const t2=lineOf(r,"2026-11-05","Bean Tacos","tortillas");
  ok("tortillas: 2 − 1 (Tue) − 1 (Thu) → still ✓, 0 left", t2&&t2.st==="have"&&/have 1 → 0 left/.test(t2.why), t2);
  ok("summary: 1 to buy (beans), 2 to check (sauce, bananas)", r.sum.buy===1&&r.sum.check===2, r.sum);
  const gb=r.groups.find(x=>x.name==="Black beans");
  ok("🛒 Add qty = the week's shortfall (need 2, have 0)", gb&&gb.qty===2, gb);
}

console.log("── a recipe with no uses: its ing lines ──");
{
  const T=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m5"}}});
  const r=T.run("grPreShop('"+TODAY+"')"); const rec=r.days[1].items[0];
  const names=rec.lines.map(l=>l.name.toLowerCase());
  ok("spoon amounts and basics are skipped (cumin tsp, salt)", names.indexOf("cumin")<0&&names.indexOf("salt")<0, names);
  ok("ground beef / black beans / avocados / white rice are checked", ["ground beef","black beans","avocados","white rice"].every(n=>names.indexOf(n)>=0), names);
  const cans=rec.lines.find(l=>/black beans/i.test(l.name)), av=rec.lines.find(l=>/avocado/i.test(l.name)), lb=rec.lines.find(l=>/ground beef/i.test(l.name));
  ok("\"2 cans black beans\" needs 2", cans&&cans.need===2, cans);
  ok("\"3 avocados\" needs 3", av&&av.need===3, av);
  ok("\"1 lb ground beef\" needs 1 (a weight is one of what's on the shelf)", lb&&lb.need===1, lb);
  ok("the can unit rides along for the list add", r.groups[cans.gi].unit==="cans", r.groups[cans.gi]);
}

console.log("── ⭐ staples ──");
{
  const T=mk({pantry:{},meals:{m1:{name:"Smoothies",uses:[{name:"bananas",qty:1},{name:"milk",qty:1},{name:"yogurt",qty:1}]}},
    staples:{s1:{name:"bananas",state:"out"},s2:{name:"Milk",state:"low"},s3:{name:"yogurt",state:"have"}},plan:{"2026-11-02":{b:{mid:"m1"}}}});
  const r=T.run("grPreShop('"+TODAY+"')");
  const L=n=>lineOf(r,"2026-11-02","Smoothies",n);
  ok("staple out → ✗", L("bananas").st==="out"&&/staple — marked out/.test(L("bananas").why));
  ok("staple low → ⚠", L("milk").st==="low");
  ok("staple have → ✓", L("yogurt").st==="have");
  ok("out/low staples are already on the list (staple rows) → counted as on the list, not to buy", r.sum.buy===0&&r.sum.onList===2, r.sum);
  const h=(T.run("grPreShopOpen('"+TODAY+"')"),T.pop.html);
  ok("the sheet says 🛒 on the list for them, no Add button", (h.match(/🛒 on the list/g)||[]).length===2&&!/grPreShopAdd\(/.test(h));
  // staple + pantry both: the staple saying out wins over a count
  const T2=mk({pantry:{p1:{name:"bananas",zone:"counter",qty:4}},meals:{m1:{name:"Smoothies",uses:[{name:"bananas",qty:1}]}},staples:{s1:{name:"bananas",state:"out"}},plan:{"2026-11-02":{mid:"m1"}}});
  ok("staple marked out beats a pantry count", lineOf(T2.run("grPreShop('"+TODAY+"')"),"2026-11-02","Smoothies","bananas").st==="out");
}

console.log("── skipneed: \"we have it\" ──");
{
  const T=mk({pantry:{},meals:MEALS,plan:{"2026-11-02":{mid:"m6"}},skipneed:{oats:"2026-11-05"}});
  const r=T.run("grPreShop('"+TODAY+"')"); const l=lineOf(r,"2026-11-02","Oatmeal","oats");
  ok("an unmatched line she said we have → shows ✓ (skip)", l&&l.st==="check"&&l.view==="skip", l);
  ok("…and doesn't count as to check", r.sum.check===0&&r.sum.buy===0, r.sum);
  T.run("grPreShopOpen('"+TODAY+"')");
  ok("the sheet says \"you said we have it\" with ↩ Undo", /you said we have it/.test(T.pop.html)&&/grPreShopUndo\(0\)/.test(T.pop.html));
  const T2=mk({pantry:{},meals:MEALS,plan:{"2026-11-02":{mid:"m6"}},skipneed:{oats:"2026-10-30"}});
  ok("an expired skip doesn't count", lineOf(T2.run("grPreShop('"+TODAY+"')"),"2026-11-02","Oatmeal","oats").view==="check");
}

console.log("── the taps ──");
{
  // ✓ We have it → skipneed/{slug} = today+6 (one targeted multi-path update)
  const T=mk({pantry:{},meals:MEALS,plan:{"2026-11-02":{mid:"m6"}}});
  T.run("grPreShopOpen('"+TODAY+"')");
  const oc=onclicks(T.pop.html);
  ok("a ? line has 🛒 Add and ✓ We have it", oc.indexOf("grPreShopAdd(0)")>=0&&oc.indexOf("grPreShopHave(0)")>=0, oc);
  T.tap("grPreShopHave(0)");
  ok("✓ We have it writes kitchen/grocery/skipneed {oats: today+6}", JSON.stringify(T.writes)===JSON.stringify([["update","kitchen/grocery/skipneed",{oats:"2026-11-07"}]]), T.writes);
  ok("…and the line now shows we have it", /you said we have it/.test(T.pop.html));
  T.tap("grPreShopUndo(0)");
  ok("↩ Undo removes just that slug", JSON.stringify(T.writes[1])===JSON.stringify(["update","kitchen/grocery/skipneed",{oats:null}]), T.writes[1]);
  ok("…and the ? line is back", /grPreShopHave\(0\)/.test(T.pop.html));
  // 🛒 Add → grCreate with the week's shortfall
  const T2=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m1"},"2026-11-04":{mid:"m2"}}});
  T2.run("grPreShopOpen('"+TODAY+"')");
  const gi=T2.run("_grPS").res.groups.find(g=>g.name==="frozen peas").gi;
  T2.tap("grPreShopAdd("+gi+")");
  ok("🛒 Add puts frozen peas ×1 on the list, labelled with the meals", T2.created.length===1&&T2.created[0][0].name==="frozen peas"&&T2.created[0][0].qty===1&&T2.created[0][1].k==="meal"&&/Mon · Shepherd's Pie, Wed · Fried Rice/.test(T2.created[0][1].lbl), T2.created);
  ok("…the ✗ line now says 🛒 on the list and the summary drops to 0 to buy", /🛒 on the list/.test(T2.pop.html)&&T2.run("_grPS").res.sum.buy===0&&T2.run("_grPS").res.sum.onList===1);
  T2.tap("grPreShopAdd("+gi+")");
  ok("a second tap doesn't add it twice", T2.created.length===1);
  // Actually we're out → pantry qty 0 + list add
  const T3=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m1"}}});
  T3.run("grPreShopOpen('"+TODAY+"')");
  const g3=T3.run("_grPS").res.groups.find(g=>g.name==="ground beef");
  ok("a ✓ line has Actually we're out", onclicks(T3.pop.html).indexOf("grPreShopOut("+g3.gi+")")>=0);
  T3.tap("grPreShopOut("+g3.gi+")");
  const pw=T3.writes.find(w=>w[1]==="kitchen/pantry/p2");
  ok("Actually we're out writes kitchen/pantry/p2 {qty:0} (targeted update)", pw&&pw[0]==="update"&&pw[2].qty===0&&Object.keys(pw[2]).sort().join()==="qty,ts", pw);
  ok("…and adds ground beef ×2 to the list", T3.created.length===1&&T3.created[0][0].name==="ground beef"&&T3.created[0][0].qty===2, T3.created);
  ok("…and the line is now ✗ on the list", T3.run("_grPS").res.groups[g3.gi].lines[0].st==="out"&&T3.run("_grPS").res.groups[g3.gi].dup);
  ok("nothing else was written", T3.writes.length===1, T3.writes);
  // a ✓ staple → Actually we're out flips the staple (it then rides the list as a staple row — no extra item)
  const T4=mk({pantry:{},meals:{m1:{name:"Smoothies",uses:[{name:"yogurt",qty:1}]}},staples:{s3:{name:"yogurt",state:"have"}},plan:{"2026-11-02":{mid:"m1"}}});
  T4.run("grPreShopOpen('"+TODAY+"')"); T4.tap("grPreShopOut(0)");
  ok("✓ staple → Actually we're out → kitchen/staples/s3 {state:out}", T4.writes.length===1&&T4.writes[0][0]==="update"&&T4.writes[0][1]==="kitchen/staples/s3"&&T4.writes[0][2].state==="out", T4.writes);
  ok("…no separate list item (the staple row is the list line)", T4.created.length===0&&/🛒 on the list/.test(T4.pop.html));
  // dry run writes nothing to Firebase
  const T5=mk({pantry:{},meals:MEALS,plan:{"2026-11-02":{mid:"m6"}},dry:true});
  T5.run("grPreShopOpen('"+TODAY+"')"); T5.tap("grPreShopHave(0)");
  ok("?dryrun=1 → ✓ We have it stays local", T5.writes.length===0&&T5.ctx.grData.skipneed.oats==="2026-11-07");
  // opening the sheet writes nothing
  const T6=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m1"},"2026-11-03":{mid:"m3"}}});
  T6.run("grPreShopOpen('"+TODAY+"')"); T6.run("grPreShopHide(1)"); T6.run("grPreShopHide(0)");
  ok("opening / switching the view writes nothing", T6.writes.length===0&&T6.created.length===0);
}

console.log("── the 7-day window ──");
{
  const plan={"2026-10-31":{mid:"m6"},"2026-11-01":{mid:"m6"},"2026-11-07":{mid:"m6"},"2026-11-08":{mid:"m6"}};
  const T=mk({pantry:{},meals:MEALS,plan:plan});
  const r=T.run("grPreShop('"+TODAY+"')");
  ok("7 days, start day through start+6", r.days.length===7&&r.days[0].iso==="2026-11-01"&&r.days[6].iso==="2026-11-07"&&r.to==="2026-11-07", r.days.map(d=>d.iso));
  ok("the day before and the 8th day are left out → 2 recipes", r.sum.recipes===2, r.sum);
  ok("a Monday start runs Mon–Sun", T.run("grPreShop('2026-11-02').days.map(d=>d.iso).join()")==="2026-11-02,2026-11-03,2026-11-04,2026-11-05,2026-11-06,2026-11-07,2026-11-08");
  ok("no start → today", T.run("grPreShop().from")===TODAY);
}

console.log("── what counts as a recipe ──");
{
  const plan={
    "2026-11-01":{mid:"m6",eaten:true,b:{txt:"Berry-kale smoothies"},l:{mid:"m3"},s:{txt:"Popcorn + fruit"}},
    "2026-11-02":{txt:"Leftovers buffet",sides:"steamed broccoli"},
    "2026-11-03":{mid:"m1",skipped:true},
    "2026-11-04":{mid:"m2",sideList:[{mid:"m6"},{txt:"salad"}]},
    "2026-11-05":{b:{parts:{main:{mid:"m6"},fruit:{txt:"banana"}}}},
    "2026-11-06":{mid:"gone-id"}};
  const T=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:plan});
  const r=T.run("grPreShop('"+TODAY+"')");
  const d=iso=>r.days.find(x=>x.iso===iso).items;
  ok("typed breakfast/snack → text-only rows, no lines", d("2026-11-01").filter(x=>x.txt!=null).map(x=>x.slot+":"+x.txt).join("|")==="b:Berry-kale smoothies|s:Popcorn + fruit", d("2026-11-01"));
  ok("a lunch with a recipe is checked; an eaten dinner is not", d("2026-11-01").filter(x=>x.mid).map(x=>x.slot+":"+x.mid).join()==="l:m3");
  ok("typed dinner + old sides text → two text rows", d("2026-11-02").map(x=>x.slot+":"+x.txt).join("|")==="d:Leftovers buffet|side:steamed broccoli");
  ok("a skipped dinner drops out", d("2026-11-03").length===0);
  ok("a recipe used as a side is checked too; a plain side is text", d("2026-11-04").map(x=>x.slot+":"+(x.mid||x.txt)).join()==="d:m2,side:m6,side:salad");
  ok("breakfast parts: the recipe part checked, the fruit part text", d("2026-11-05").map(x=>x.slot+":"+(x.mid||x.txt)).join()==="b:m6,b:banana");
  ok("a removed recipe shows as text, not a crash", d("2026-11-06")[0].txt==="(recipe removed)");
  ok("recipes counted: m3, m2, m6 (side), m6 (breakfast) = 4", r.sum.recipes===4, r.sum);
  T.run("grPreShopOpen('"+TODAY+"')");
  ok("the sheet shows the 7 typed rows (2 + 2 + salad + banana + removed recipe) as \"typed in, nothing to check\"", (T.pop.html.match(/typed in, nothing to check/g)||[]).length===7, (T.pop.html.match(/typed in, nothing to check/g)||[]).length);
  T.run("grPreShopHide(1)");
  ok("\"Just what needs you\" hides ✓ lines and typed rows", !/typed in, nothing to check/.test(T.pop.html)&&!/Actually we\'re out/.test(T.pop.html)&&/grPreShopHave\(/.test(T.pop.html));
}

console.log("── the sheet ──");
{
  const T=mk({pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m1"},"2026-11-04":{mid:"m2"},"2026-11-05":{mid:"m4"}}});
  T.run("grPreShopOpen('"+TODAY+"')"); const h=T.pop.html;
  ok("title first (so a redraw keeps her scroll place)", h.indexOf('🛒 Pre-shop check</div>')>0&&h.indexOf('</div>')===h.indexOf('🛒 Pre-shop check</div>')+'🛒 Pre-shop check'.length);
  ok("summary at the top: 7 days · 3 recipes · 2 to buy · 1 to check", /7 days · 3 recipes · <span[^>]*>2 to buy<\/span> · <span[^>]*>1 to check<\/span>/.test(h), T.run("_grPS").res.sum);
  ok("one block per day, all 7", (h.match(/text-transform:uppercase/g)||[]).length===7);
  ok("empty days say Nothing planned", /Nothing planned/.test(h));
  ok("✗ / ? buttons are thumb-sized (min-height 40px)", /min-height:40px[^"]*">🛒 Add/.test(h));
  ok("🛒 Add shows the amount when it's more than 1", /🛒 Add 2</.test(h));
  ok("the sheet widens past the 340px pop-up", /max-width:620px!important/.test(h));
  ok("Done closes", onclicks(h).indexOf("grPreShopClose()")>=0);
  ok("names are escaped", (()=>{ const T2=mk({pantry:{},meals:{m1:{name:"<b>x</b>",uses:[{name:"<i>y</i>"}]}},plan:{"2026-11-02":{mid:"m1"}}}); T2.run("grPreShopOpen('"+TODAY+"')"); return !/<b>x<\/b>|<i>y<\/i>/.test(T2.pop.html); })());
}

console.log("── 🔴 Now row on order day ──");
{
  const base={pantry:JSON.parse(JSON.stringify(PANTRY)),meals:MEALS,plan:{"2026-11-02":{mid:"m1"},"2026-11-04":{mid:"m2"}}};
  const T=mk(base);
  const n=T.run("grPreShopNowHTML()");
  ok("Sunday with no order day picked → the row shows", n.n===1&&/Pre-shop check<\/b> — 1 to buy/.test(n.html)&&/onclick="grPreShopOpen\(\)"/.test(n.html), n);
  ok("not on a Monday", mk(Object.assign({},base,{today:"2026-11-02"})).run("grPreShopNowHTML()").n===0);
  ok("an order day picked in Settings wins (monday)", mk(Object.assign({},base,{today:"2026-11-02",settings:{orderDay:"monday"}})).run("grPreShopNowHTML()").n===1
    &&mk(Object.assign({},base,{settings:{orderDay:"monday"}})).run("grPreShopNowHTML()").n===0);
  ok("nothing to buy or check → no row", mk({pantry:{p2:{name:"ground beef",qty:9}},meals:{m1:{name:"Burgers",uses:[{name:"ground beef",qty:1}]}},plan:{"2026-11-02":{mid:"m1"}}}).run("grPreShopNowHTML()").n===0);
}

console.log("── wired in ──");
{
  ok("grPantryAlertsHTML adds the Now row", /const _ps=grPreShopNowHTML\(\); n\+=_ps\.n; h\+=_ps\.html;/.test(fn("grPantryAlertsHTML")));
  ok("the Grocery page has the 🛒 Pre-shop check button (not for Dad's read-only list)", /\+\(grFromDad\?'':'<div><button onclick="grPreShopOpen\(\)"[^\n]*🛒 Pre-shop check/.test(src));
  ok("…right after the \"This week's meals need\" button", src.indexOf('onclick="grPreShopOpen()"')-src.indexOf("meals need '+grWeekNeeds().length+' — check")<400);
  ok("grWeekNeeds itself is untouched (no PRESHOP inside it)", !/PRESHOP|grPreShop/.test(fn("grWeekNeeds")));
  ok("no 🔀 in the block", src.slice(a,b).indexOf("\u{1F500}")<0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
