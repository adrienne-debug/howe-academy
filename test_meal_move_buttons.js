/* ➡ / ✗ where she taps (her ask 2026-11-01: "if something isn't eaten I would like it to be able to shift the whole
 * schedule to the next day — I think something similar exists, but check"). The calendar's ➡ Move forward and ✗ Didn't
 * happen, now also on the 🍽️ dinner card and on each row of 🗓 This week's dinners.
 * run: node test_meal_move_buttons.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// MEAL_MOVE_BTNS_START"), b=src.indexOf("// MEAL_MOVE_BTNS_END");
if(a<0||b<0){ console.error("MEAL_MOVE_BTNS markers missing"); process.exit(1); }
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const TODAY="2026-11-01";
function mk(o){
  o=o||{}; const calls=[], pop={html:null};
  const ctx={console,Math,JSON,Object,Array,String,Date,RegExp,
    kitPlan:o.plan||{}, kitMeals:{m1:{name:"Taco night"},m2:{name:"Chili"},m3:{name:"Pancakes"}},
    esc:s=>String(s==null?"":s), _todayStr:()=>TODAY, kitDinnerWord:()=>o.word||"Dinner",
    kitEatGate:()=>o.gate!==false, GR_BTN:"",
    grPop:h=>{ pop.html=h; }, grPopClose:()=>calls.push(["close"]),
    kitMoveForward:(iso,slot,to)=>calls.push(to?["move",iso,slot,to]:["move",iso,slot]), kitMarkSkipped:iso=>calls.push(["skip",iso])};
  vm.createContext(ctx);
  ["gwParseDate","kitIsoPlus","kitOutIs","kitPlanSlot","kitSlotsHas","_kitMvGet","_kitMvFixed","kitMoveChain"].forEach(n=>{ try{ vm.runInContext(fn(n),ctx); }catch(e){} });
  vm.runInContext("const KIT_MOVE_NAMES={d:['dinner','dinners'],b:['breakfast','breakfasts'],l:['lunch','lunches'],s:['snack','snacks']};",ctx);
  ctx.kitPlanFor=iso=>{ const p=ctx.kitPlan[iso]; if(!p) return null; if(p.mid) return {mid:p.mid,meal:ctx.kitMeals[p.mid]||null}; if(p.txt) return {txt:p.txt}; return null; };
  vm.runInContext(src.slice(a,b),ctx);
  // the onclicks are run against the same context, so a test can "tap" a button
  const tap=h=>vm.runInContext(h.replace(/event\.stopPropagation\(\);/,"__stopped=true;"),ctx);
  return {ctx,calls,pop,run:e=>vm.runInContext(e,ctx),tap};
}
const onclicks=h=>{ const out=[]; const re=/onclick="([^"]*)"/g; let m; while((m=re.exec(h))) out.push(m[1]); return out; };

console.log("── the dinner card strip ──");
{
  const T=mk({plan:{[TODAY]:{mid:"m1"}}}); const h=T.run("kitMvCardHTML('"+TODAY+"')");
  ok("a planned dinner tonight shows ➡ Didn’t eat it — push a day", /➡ Didn’t eat it — push a day/.test(h));
  ok("…and ✗ Didn’t happen", /✗ Didn’t happen/.test(h));
  const oc=onclicks(h);
  ok("➡ opens the chooser (not a move straight away)", oc[0]==="kitMvChoose('"+TODAY+"')", oc);
  ok("✗ calls kitMarkSkipped for that day", oc[1]==="kitMarkSkipped('"+TODAY+"')", oc);
  ok("a typed dinner counts too", /push a day/.test(mk({plan:{[TODAY]:{txt:"Leftovers"}}}).run("kitMvCardHTML('"+TODAY+"')")));
  ok("eaten → nothing", mk({plan:{[TODAY]:{mid:"m1",eaten:1}}}).run("kitMvCardHTML('"+TODAY+"')")==="");
  ok("didn’t happen → nothing", mk({plan:{[TODAY]:{mid:"m1",skipped:1}}}).run("kitMvCardHTML('"+TODAY+"')")==="");
  ok("eating out → nothing", mk({plan:{[TODAY]:{mid:"m1",d:{out:true}}}}).run("kitMvCardHTML('"+TODAY+"')")==="");
  ok("no dinner planned → nothing", mk({plan:{[TODAY]:{b:{txt:"Eggs"}}}}).run("kitMvCardHTML('"+TODAY+"')")==="");
  ok("no plan at all → nothing", mk().run("kitMvCardHTML('"+TODAY+"')")==="");
  ok("a kid (gate closed) → nothing", mk({gate:false,plan:{[TODAY]:{mid:"m1"}}}).run("kitMvCardHTML('"+TODAY+"')")==="");
}
console.log("── the ➡ chooser: pick which meal(s) ──");
{
  // her ask 2026-11-01: "pick which meals so maybe just supper or all or just lunch"
  const T=mk({word:"Supper",plan:{[TODAY]:{mid:"m1",b:{mid:"m3"},l:{txt:"Salad jar"}},"2026-11-02":{mid:"m2"}}});
  T.run("kitMvChoose('"+TODAY+"')"); const h=T.pop.html||"";
  ok("names the meals", /Taco night/.test(h)&&/Pancakes/.test(h)&&/Salad jar/.test(h));
  ok("offers Supper only (the family's word), Breakfast only, Lunch only, Whole day, Cancel", /🍽 Supper only/.test(h)&&/🌅 Breakfast only/.test(h)&&/☀️ Lunch only/.test(h)&&/🗓 Whole day/.test(h)&&/Cancel/.test(h));
  ok("no Snack only — nothing's planned for snack", !/Snack only/.test(h));
  const oc=onclicks(h);
  [["d","Supper"],["b","Breakfast"],["l","Lunch"],["all","Whole day"]].forEach(x=>{
    T.calls.length=0; T.tap(oc.find(o=>o.indexOf("kitMoveForward('"+TODAY+"','"+x[0]+"')")>=0));
    ok(x[1]+" → closes, then kitMoveForward(day,'"+x[0]+"')", JSON.stringify(T.calls)===JSON.stringify([["close"],["move",TODAY,x[0]]]), T.calls);
  });
  ok("📅 Move to a day… is offered", /📅 Move to a day…/.test(h)&&oc.indexOf("kitMvToPick('"+TODAY+"')")>=0, oc);
  T.calls.length=0; T.tap(oc[oc.length-1]);
  ok("Cancel only closes — nothing moves", JSON.stringify(T.calls)==='[["close"]]', T.calls);
  const D=mk({plan:{[TODAY]:{mid:"m1"}}}); D.run("kitMvChoose('"+TODAY+"')");
  ok("only dinner planned → Dinner only, no Whole day, no Breakfast/Lunch", /Dinner only/.test(D.pop.html)&&!/Whole day|Breakfast only|Lunch only/.test(D.pop.html));
  const O=mk({plan:{[TODAY]:{mid:"m1",l:{txt:"Out",out:true},s:{txt:"Apples"}}}}); O.run("kitMvChoose('"+TODAY+"')");
  ok("an eating-out lunch isn't offered (it stays put)", !/Lunch only/.test(O.pop.html)&&/Snack only/.test(O.pop.html));
  const K=mk({gate:false,plan:{[TODAY]:{mid:"m1"}}}); K.run("kitMvChoose('"+TODAY+"')");
  ok("a kid can't open it", K.pop.html===null);
  const E=mk({plan:{[TODAY]:{mid:"m1",eaten:1}}}); E.run("kitMvChoose('"+TODAY+"')");
  ok("an eaten dinner can't be pushed", E.pop.html===null);
}
console.log("── the week grid row ──");
{
  const T=mk({plan:{[TODAY]:{mid:"m1"},"2026-11-03":{mid:"m2"},"2026-11-04":{mid:"m2",eaten:1},"2026-11-05":{txt:"Soup",skipped:1}}});
  const tn=T.run("kitMvRowBtns('"+TODAY+"')"), oc=onclicks(tn);
  ok("tonight's row: ➡ and ✗", oc.length===2&&/➡/.test(tn)&&/✗/.test(tn), oc);
  ok("both stop the tap reaching the row (the row still opens the picker)", oc.every(x=>x.indexOf("event.stopPropagation();")===0), oc);
  ok("➡ from the grid moves dinner only", oc[0]==="event.stopPropagation();kitMoveForward('"+TODAY+"','d')", oc[0]);
  ok("✗ marks it didn’t happen", oc[1]==="event.stopPropagation();kitMarkSkipped('"+TODAY+"')", oc[1]);
  T.tap(oc[0]); ok("tapping ➡ calls kitMoveForward(day,'d')", JSON.stringify(T.calls)===JSON.stringify([["move",TODAY,"d"]]), T.calls);
  const fut=T.run("kitMvRowBtns('2026-11-03')");
  ok("a later day: ➡ only (✗ is for tonight, as in the calendar)", /➡/.test(fut)&&!/✗/.test(fut));
  ok("eaten row → nothing", T.run("kitMvRowBtns('2026-11-04')")==="");
  ok("didn’t-happen row → nothing", T.run("kitMvRowBtns('2026-11-05')")==="");
  ok("empty day → nothing", T.run("kitMvRowBtns('2026-11-06')")==="");
  ok("a kid → nothing", mk({gate:false,plan:{[TODAY]:{mid:"m1"}}}).run("kitMvRowBtns('"+TODAY+"')")==="");
}
console.log("── 📅 Move to a day: the pickers ──");
{
  // her ask 2026-11-01: "move to a particular day and that day pushes everything ahead but the prior stay the same"
  const plan={[TODAY]:{mid:"m1",l:{txt:"Salad jar"}},"2026-11-03":{mid:"m2",l:{txt:"Soup"}},"2026-11-04":{mid:"m3",eaten:1}};
  const T=mk({plan});
  T.run("kitMvToPick('"+TODAY+"')"); let h=T.pop.html||"";
  ok("two meals planned → asks which one first (Dinner / Lunch / Whole day)", /Move which one\?/.test(h)&&/Dinner only/.test(h)&&/Lunch only/.test(h)&&/Whole day/.test(h)&&!/Breakfast only/.test(h));
  ok("…and those taps go on to the day list, not a move", onclicks(h).some(x=>x==="kitMvToPick('"+TODAY+"','l')")&&!onclicks(h).some(x=>/kitMoveForward|kitMoveTo/.test(x)));
  T.run("kitMvToPick('"+TODAY+"','d')"); h=T.pop.html||"";
  const days=onclicks(h).filter(x=>/kitMoveTo\(/.test(x)), dayBtns=(h.match(/<button [^>]*style="[^"]*display:flex;gap:10px/g)||[]);
  ok("the day list shows the next 14 days", dayBtns.length===14, dayBtns.length);
  ok("…starting tomorrow (Mon 11/2)", /Mon, 11\/2/.test(h)&&!/Sun, 11\/1</.test(h), h.slice(0,400));
  ok("…with what's planned that day, or — empty", /Chili/.test(h)&&/— empty/.test(h));
  ok("an eaten day is shown but can't be picked (the slide hops it)", /✓ eaten — skipped over/.test(h)&&!days.some(x=>/'2026-11-04'/.test(x))&&days.length===13, days.length);
  T.calls.length=0; T.tap(days.find(x=>/'2026-11-03'/.test(x)));
  ok("picking Tue 11/3 → closes, then kitMoveTo → kitMoveForward(day,'d','2026-11-03')", JSON.stringify(T.calls)===JSON.stringify([["close"],["move",TODAY,"d","2026-11-03"]]), T.calls);
  T.run("kitMvToPick('"+TODAY+"','l')"); h=T.pop.html||"";
  ok("Lunch's day list shows each day's lunch", /Soup/.test(h)&&!/Chili/.test(h));
  T.run("kitMvToPick('"+TODAY+"','all')"); h=T.pop.html||"";
  ok("Whole day's list shows every planned meal that day", /Chili/.test(h)&&/Soup/.test(h)&&/Move the whole day to/.test(h));
  ok("Back and Cancel are there", /‹ Back/.test(h)&&/Cancel/.test(h));
  const S=mk({plan:{[TODAY]:{mid:"m1"}}}); S.run("kitMvToPick('"+TODAY+"')");
  ok("only one meal planned → straight to the day list", /Move Taco night to…/.test(S.pop.html||""));
  const K=mk({gate:false,plan}); K.run("kitMvToPick('"+TODAY+"','d')");
  ok("a kid can't open it", K.pop.html===null);
}
console.log("── 📅 Move to a day: the move itself (real kitMoveForward) ──");
{
  const line=s=>{ const i=src.indexOf(s); return src.slice(i,src.indexOf("\n",i)+1); };
  const CODE=[line("const KIT_MOVE_NAMES="),fn("_kitMvGet"),line("function _kitMvFixed("),fn("kitMoveChain"),fn("kitMoveForward"),fn("kitIsoPlus"),fn("kitOutIs"),fn("gwParseDate"),fn("kitEatGate")].join("\n");
  function world(o){
    o=o||{};
    const ctx={console,Math,JSON,Object,Array,String,Date,RegExp,updates:[],sets:[],confirms:[],toasts:[],
      momHere:()=>!o.kid, confirm:m=>{ ctx.confirms.push(m); return !o.cancel; }, mwToast:m=>ctx.toasts.push(m),
      HA_LS:{getItem:()=>null,setItem:()=>{}}, _kitRefresh:()=>{}, _todayStr:()=>TODAY, esc:s=>String(s), GR_BTN:"",
      kitDinnerWord:()=>"Dinner", kitPlanSlot:(iso,s)=>{ const v=(ctx.kitPlan[iso]||{})[s]; return v?(v.mid?{mid:v.mid,meal:ctx.kitMeals[v.mid]}:{txt:v.txt}):null; },
      db:{ref:p=>({update:v=>{ ctx.updates.push([p,v]); return Promise.resolve(); },set:v=>ctx.sets.push([p,v]),remove:()=>ctx.sets.push([p,null])})},
      kitPlan:JSON.parse(JSON.stringify(o.plan||{})), kitPrepDone:JSON.parse(JSON.stringify(o.prep||{})),
      kitMeals:{m1:{name:"Taco night"},m2:{name:"Chili"},m3:{name:"Pancakes"},m4:{name:"Stir fry"},m5:{name:"Soup"},m6:{name:"Pizza"}}};
    vm.createContext(ctx); vm.runInContext(CODE,ctx); vm.runInContext(src.slice(a,b),ctx);
    return {ctx,run:e=>vm.runInContext(e,ctx)};
  }
  const din=(W,d)=>{ const p=W.ctx.kitPlan[d]; return p?(p.mid||p.txt||null):null; };
  // Sun A · Mon B · Tue C · Wed D · Thu E (eaten) · Fri F · Sat empty
  const WEEK={"2026-11-01":{mid:"m1"},"2026-11-02":{mid:"m2"},"2026-11-03":{mid:"m3"},"2026-11-04":{mid:"m4"},"2026-11-05":{mid:"m5",eaten:1},"2026-11-06":{mid:"m6"}};
  const PREP={"2026-11-01":{"m1_0":1},"2026-11-04":{"m4_1":1}};
  const W=world({plan:WEEK,prep:PREP}); W.run("kitMoveTo('2026-11-01','2026-11-04','d')");
  ok("the moved meal lands on the target (Wed gets Taco night)", din(W,"2026-11-04")==="m1", W.ctx.kitPlan);
  ok("the day it left is empty", din(W,"2026-11-01")===null);
  ok("the days between stay the same (Mon Chili, Tue Pancakes)", din(W,"2026-11-02")==="m2"&&din(W,"2026-11-03")==="m3");
  ok("the chain from the target slides: Wed's Stir fry hops the eaten Thu to Fri, Fri's Pizza to Sat", din(W,"2026-11-06")==="m4"&&din(W,"2026-11-07")==="m6", W.ctx.kitPlan);
  ok("the eaten Thursday never moves", din(W,"2026-11-05")==="m5"&&W.ctx.kitPlan["2026-11-05"].eaten===1);
  ok("prep ticks travel with their dinner", (W.ctx.kitPrepDone["2026-11-04"]||{}).m1_0===1&&(W.ctx.kitPrepDone["2026-11-06"]||{}).m4_1===1&&!W.ctx.kitPrepDone["2026-11-01"], W.ctx.kitPrepDone);
  ok("ONE multi-path update under kitchen/, nothing set", W.ctx.updates.length===1&&W.ctx.updates[0][0]==="kitchen"&&W.ctx.sets.length===0, W.ctx.updates.map(u=>u[0]));
  const up=W.ctx.updates[0][1]||{};
  ok("…and it never touches the days between", !Object.keys(up).some(k=>/2026-11-0[23]/.test(k)), Object.keys(up));
  const q=W.ctx.confirms[0]||"";
  ok("asks first, in plain words: lands Wed, what slides, which days stay", /^Move Taco night to Wednesday, Nov 4\?/.test(q)&&/Wed, Nov 4's dinner and everything after slide a day/.test(q)&&/Mon, Nov 2 – Tue, Nov 3 stay the same/.test(q), q);
  const X=world({plan:WEEK}); X.run("kitMoveTo('2026-11-01','2026-11-05','d')");
  ok("picking the eaten day itself → it lands on the next free one (Fri), Pizza to Sat", din(X,"2026-11-06")==="m1"&&din(X,"2026-11-07")==="m6"&&din(X,"2026-11-04")==="m4", X.ctx.kitPlan);
  const E=world({plan:{"2026-11-01":{mid:"m1"},"2026-11-03":{mid:"m3"}}}); E.run("kitMoveTo('2026-11-01','2026-11-05','d')");
  ok("an empty target: lands there, nothing else moves", din(E,"2026-11-05")==="m1"&&din(E,"2026-11-03")==="m3"&&/Nothing else moves/.test(E.ctx.confirms[0]), [E.ctx.kitPlan,E.ctx.confirms[0]]);
  // target = tomorrow is exactly ➡ push a day
  const P=world({plan:WEEK,prep:PREP}), M=world({plan:WEEK,prep:PREP});
  P.run("kitMoveForward('2026-11-01','d')"); M.run("kitMoveTo('2026-11-01','2026-11-02','d')");
  ok("target = tomorrow → the same plan as ➡ push a day", JSON.stringify(P.ctx.kitPlan)===JSON.stringify(M.ctx.kitPlan), [P.ctx.kitPlan,M.ctx.kitPlan]);
  ok("…the same write", JSON.stringify(P.ctx.updates)===JSON.stringify(M.ctx.updates));
  ok("…the same prep ticks", JSON.stringify(P.ctx.kitPrepDone)===JSON.stringify(M.ctx.kitPrepDone));
  ok("…and the same question", P.ctx.confirms[0]===M.ctx.confirms[0], [P.ctx.confirms[0],M.ctx.confirms[0]]);
  // 'all' moves every filled slot
  const A=world({plan:{"2026-11-01":{mid:"m1",b:{txt:"Eggs"},l:{txt:"Salad"}},"2026-11-03":{mid:"m2",l:{txt:"Soup"}}}});
  A.run("kitMoveTo('2026-11-01','2026-11-03','all')");
  const p3=A.ctx.kitPlan["2026-11-03"]||{}, p4=A.ctx.kitPlan["2026-11-04"]||{};
  ok("'all': dinner, breakfast and lunch all land on the target", p3.mid==="m1"&&(p3.b||{}).txt==="Eggs"&&(p3.l||{}).txt==="Salad", p3);
  ok("'all': the target's own meals slide a day", p4.mid==="m2"&&(p4.l||{}).txt==="Soup", p4);
  ok("'all': the day it left is gone, the day between untouched", !A.ctx.kitPlan["2026-11-01"]&&!A.ctx.kitPlan["2026-11-02"], A.ctx.kitPlan);
  ok("'all': still ONE update", A.ctx.updates.length===1, A.ctx.updates.length);
  ok("'all': the question lists each meal", /Move ALL of/.test(A.ctx.confirms[0])&&/dinner \(Taco night\)/.test(A.ctx.confirms[0])&&/lunch \(Salad\)/.test(A.ctx.confirms[0])&&/Mon, Nov 2 stays the same/.test(A.ctx.confirms[0]), A.ctx.confirms[0]);
  const C=world({plan:WEEK,cancel:true}); C.run("kitMoveTo('2026-11-01','2026-11-04','d')");
  ok("Cancel on the question → nothing changes, nothing written", JSON.stringify(C.ctx.kitPlan)===JSON.stringify(WEEK)&&C.ctx.updates.length===0);
  const K=world({plan:WEEK,kid:true}); K.run("kitMoveTo('2026-11-01','2026-11-04','d')");
  ok("a kid → nothing", K.ctx.updates.length===0&&K.ctx.confirms.length===0);
  const B=world({plan:WEEK}); B.run("kitMoveTo('2026-11-04','2026-11-02','d'); kitMoveTo('2026-11-04','2026-11-04','d')");
  ok("a target on or before the day → nothing", B.ctx.updates.length===0&&B.ctx.confirms.length===0);
}
console.log("── wiring in index.html ──");
{
  const card=fn("mdCardDinner");
  ok("the dinner card calls kitMvCardHTML(iso)", /kitMvCardHTML\(iso\)/.test(card));
  ok("…right under the header, before the picker", card.indexOf("kitMvCardHTML(iso)")<card.indexOf("kitDinPickerHTML(iso,\"card\")")&&card.indexOf("kitMvCardHTML(iso)")>card.indexOf("Plan week"));
  ok("✓ We ate it is still on the card", /✓ We ate it/.test(card));
  const rk=fn("renderKitchen");
  ok("the week grid row calls kitMvRowBtns(iso)", /kitMvRowBtns\(iso\)/.test(rk));
  const row=rk.slice(rk.lastIndexOf("<div onclick=\"kitPickDay(",rk.indexOf("kitMvRowBtns(iso)")),rk.indexOf("kitMvRowBtns(iso)"));
  ok("the row it sits in still opens the day picker on tap", /onclick="kitPickDay\(/.test(row)&&row.length<1500, row.length);
  ok("nothing new writes to the database (no db.ref in the block)", !/db\.ref|\.set\(|\.update\(/.test(src.slice(a,b)));
  ok("no 🔀 crept in", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
