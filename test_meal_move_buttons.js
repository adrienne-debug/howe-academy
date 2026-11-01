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
    esc:s=>String(s==null?"":s), _todayStr:()=>TODAY, kitDinnerWord:()=>"Dinner",
    kitEatGate:()=>o.gate!==false, GR_BTN:"",
    grPop:h=>{ pop.html=h; }, grPopClose:()=>calls.push(["close"]),
    kitMoveForward:(iso,slot)=>calls.push(["move",iso,slot]), kitMarkSkipped:iso=>calls.push(["skip",iso])};
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
console.log("── the ➡ chooser ──");
{
  const T=mk({plan:{[TODAY]:{mid:"m1",b:{mid:"m3"}},"2026-11-02":{mid:"m2"}}});
  T.run("kitMvChoose('"+TODAY+"')"); const h=T.pop.html||"";
  ok("names the dinner", /Taco night/.test(h));
  ok("offers Dinner only, Whole day and Cancel", /Dinner only/.test(h)&&/Whole day \(breakfast, lunch, snack too\)/.test(h)&&/Cancel/.test(h));
  const oc=onclicks(h);
  T.tap(oc.find(x=>/'d'\)/.test(x)));
  ok("Dinner only → closes, then kitMoveForward(day,'d')", JSON.stringify(T.calls)===JSON.stringify([["close"],["move",TODAY,"d"]]), T.calls);
  T.calls.length=0; T.tap(oc.find(x=>/'all'\)/.test(x)));
  ok("Whole day → closes, then kitMoveForward(day,'all')", JSON.stringify(T.calls)===JSON.stringify([["close"],["move",TODAY,"all"]]), T.calls);
  T.calls.length=0; T.tap(oc[oc.length-1]);
  ok("Cancel only closes — nothing moves", JSON.stringify(T.calls)==='[["close"]]', T.calls);
  const D=mk({plan:{[TODAY]:{mid:"m1"}}}); D.run("kitMvChoose('"+TODAY+"')");
  ok("no breakfast/lunch/snack to move → Whole day isn't offered (it would do the same as Dinner only)", /Dinner only/.test(D.pop.html)&&!/Whole day/.test(D.pop.html));
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
