/*
 * 📖 NOWRECIPE — a meal in a Now / day list opens its recipe in a pop-up (her ask 2026-11-19: "on the now section of the
 * page, when it shows a meal and it has a recipe linked to it, I would like it to be able to be clickable and it pop up the
 * recipe … a fix that goes everywhere"). Her case: ⏲ "Start the crock pot, low 8 hours" in 🔴 Now had no way to the recipe.
 * Covers: a row whose meal is a kitchen recipe gets its own 📖 Recipe tap target (✓ Done keeps working); the tap opens THAT
 * recipe in the grocery list's read-only pop-up (grMealPop — no second viewer); a row with no recipe is unchanged; the tap
 * writes nothing; and every list that draws these rows uses the one helper.
 *                                                    run: node test_now_recipe.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const line=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n",i)+1); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const constLine=name=>{ const i=src.indexOf("const "+name+"="); if(i<0) throw new Error("missing const "+name); return src.slice(i,src.indexOf("\n",i)+1); };

const NR=cut("// NOWRECIPE_START","// NOWRECIPE_END");
const MOMLOOP=cut("// MOMLOOP_START","// MOMLOOP_END");
const MS=cut("// MOMSCHED_LAUNDRY_START","// MOMSCHED_LAUNDRY_END");
const MP=cut("// MEALPREP_BLOCK_START","// MEALPREP_BLOCK_END");
const KIT=[line("kitPrepMins"),fn("kitWhenMin"),fn("kitWhenLabel"),fn("kitIsoPlus"),cut("// KITSIDES_START","// KITSIDES_END"),fn("kitPlanFor"),fn("kitPrepSteps"),
  fn("kitDuePrepHTML"),fn("kitDuePrep"),fn("kitMarkPrep"),fn("kitFlagNowHTML")].join("\n");
const GR=["let _grPend=null;",fn("grPop"),line("grPopClose"),constLine("GR_BTN"),fn("grMealPop")].join("\n");
const H=(h,m)=>h*60+(m||0);
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date()), TOM=iso(new Date(new Date().setDate(new Date().getDate()+1)));

// A tiny DOM: grPop makes one #gr-pop element on <body>.
function el(id){ const e={id,innerHTML:"",attrs:{},children:[],setAttribute(k,v){ this.attrs[k]=v; },getAttribute(k){ return this.attrs[k]; },querySelector:()=>null}; return e; }
function mk(o){
  const ls={}, lsWrites=[], writes=[], renders=[], els={};
  const ctx={console,ROSTER:["k1","k2"],checked:{},momMoves:{},
    getActiveTasks:()=>[], morningComplete:()=>true, bbActive:()=>null, momHere:()=>true, adminPinUnlocked:true,
    cap:s=>String(s||"").charAt(0).toUpperCase()+String(s||"").slice(1),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),   // the app's own esc
    Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; lsWrites.push(k); }}, db:null, LAUNDRY_STAGES:["washer","dryer","fold"],
    laundryData:{}, KID_NAME:{}, taskCard:t=>'', _agLunchRow:()=>null, famIsMomCard:()=>false,
    gwParseDate:s=>{ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }, _todayStr:()=>TODAY,
    kitPlan:o.plan||{}, kitMeals:o.meals||{}, kitPrepDone:o.done||{}, KIT_NB_HOUR:16,
    // ⚠ KITFLAG stubs — only the row's drawing is under test here (test_kitchen_flag.js covers the flag itself)
    kitFlags:o.flags||{}, kitFlagSync:()=>{}, kitMealFlagged:()=>true, kitFlagAvg:()=>({avg:1.5}), kitFlagRotSlot:()=>null,
    kitFlagNextDay:()=>null, kitFlagStars:()=>"★½", kitFlagFmt:x=>x, KIT_FLAG_N:3,
    mwToast:()=>{}, mpGoto:()=>{ renders.push("goto"); }, kitOpenRecipe:mid=>{ renders.push("kitchen:"+mid); },
    renders, writes, tab:"schedule", kid:"mom", day:"thursday"};
  ctx.document={getElementById:id=>els[id]||(id==="content"?{}:null),createElement:()=>el(""),body:{appendChild:e=>{ els[e.id]=e; }}};
  ctx.renderMomsPlan=()=>{ renders.push("plan"); }; ctx.renderAll=()=>{ renders.push("all"); }; ctx.renderAllSoon=ctx.renderAll;
  ctx._mlNowOverride=o.nowMin!=null?o.nowMin:H(10,5); ctx._mlLunchOverride=false;
  Object.defineProperty(ctx,"_todayDay",{get:()=>"thursday"});
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("fromMin")+"\n"+fn("mwTodayIso")+"\n"+MOMLOOP+"\n"+fn("laundrySince")+"\n"+MS+"\n"+KIT+"\n"+MP+"\n"
    +(o.noGrocery?"":GR+"\n")+(o.noHelper?"":NR+"\n"),ctx);
  vm.runInContext("momLoop="+JSON.stringify({cursor:0,order:["k1","k2"]})+";",ctx);
  const T={ctx,writes,renders,lsWrites,els,run:e=>vm.runInContext(e,ctx)};
  T.dbOn=()=>{ ctx.db={ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p]),push:v=>writes.push(["push",p,v])})}; };
  T.pop=()=>(els["gr-pop"]||{}).innerHTML||"";
  T.tap=html=>{ const m=/<button class="now-recipe" onclick="([^"]*)"/.exec(html); if(!m) return false;
    const js=m[1].replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");   // the browser decodes the attribute first
    let stopped=false; ctx.event={stopPropagation:()=>{ stopped=true; }}; vm.runInContext(js,ctx); return stopped; };
  return T;
}
// A generic family: tonight's meal is a kitchen recipe with a slow-cooker step at 10:00; tomorrow's has a night-before step.
const meals={r1:{name:"Slow Cooker Pork",emoji:"🐖",ing:"3 lb pork shoulder\n1 onion",steps:"Season the pork\nCook on low 8 hours",
                 prep:[{when:"10:00",label:"Start the crock pot, low 8 hours",mins:10},{when:"13:00",label:"Shred the pork"}]},
             r2:{name:"Pot Roast",ing:"1 roast",steps:"Roast it",prep:[{when:"nb",label:"Thaw the roast",mins:5}]}};
const plan={[TODAY]:{mid:"r1"},[TOM]:{mid:"r2"}};
const strip=h=>String(h).replace(/<button class="now-recipe"[^>]*>📖 Recipe<\/button>/g,"");

console.log("A — 🔴 Now (Mom's Day + Dad's Day: kitDuePrepHTML)");
{ const T=mk({meals,plan}); const P=T.run("kitDuePrepHTML()");
  ok("the crock-pot step is in 🔴 Now", P.n===1&&/Start the crock pot, low 8 hours/.test(P.html), P.html);
  ok("…with a 📖 Recipe tap target for its meal", /<button class="now-recipe" onclick="event\.stopPropagation\(\);nowRecipeOpen\('r1'\)"[^>]*>📖 Recipe<\/button>/.test(P.html), P.html);
  ok("…its own button, beside ✓ Done (which still ticks via kitMarkPrep)", /kitMarkPrep\(\\?'[^"]*'r1_0'\)|kitMarkPrep\('[0-9-]+','r1_0'\)/.test(P.html)&&P.html.indexOf("✓ Done</button><button class=\"now-recipe\"")>0, P.html);
  ok("the row's look is otherwise unchanged (same as without the helper)", strip(P.html)===mk({meals,plan,noHelper:true}).run("kitDuePrepHTML().html"));
  T.dbOn();
  const mealsBefore=JSON.stringify(T.ctx.kitMeals), doneBefore=JSON.stringify(T.ctx.kitPrepDone), planBefore=JSON.stringify(T.ctx.kitPlan);
  const stopped=T.tap(P.html);
  ok("a tap opens the pop-up with THIS recipe — name, ingredients, steps", /Slow Cooker Pork/.test(T.pop())&&/3 lb pork shoulder/.test(T.pop())&&/Cook on low 8 hours/.test(T.pop())&&!/Pot Roast/.test(T.pop()), T.pop().slice(0,300));
  ok("…the tap stops there (never reaches a row tap)", stopped===true);
  ok("…the pop-up has Close (back to the same screen)", /onclick="grPopClose\(\)"[^>]*>Close<\/button>/.test(T.pop()));
  ok("the tap writes nothing: no Firebase write, no device save, no repaint, the step is NOT ticked",
     T.writes.length===0&&T.lsWrites.length===0&&T.renders.length===0&&JSON.stringify(T.ctx.kitPrepDone)===doneBefore&&JSON.stringify(T.ctx.kitMeals)===mealsBefore&&JSON.stringify(T.ctx.kitPlan)===planBefore,
     {w:T.writes,ls:T.lsWrites,r:T.renders});
  T.run("grPopClose()"); ok("Close empties the pop-up and still writes nothing", T.pop()===""&&T.writes.length===0&&T.lsWrites.length===0);
  ok("the step is still in 🔴 Now after the pop-up (not ticked off)", T.run("kitDuePrepHTML()").n===1);
}
{ const T=mk({meals,plan,nowMin:H(17)}); const P=T.run("kitDuePrepHTML()");
  ok("night-before step for tomorrow's meal opens tomorrow's recipe", /nowRecipeOpen\('r2'\)/.test(P.html)&&T.tap(P.html.slice(P.html.indexOf("Thaw the roast")))&&/Pot Roast/.test(T.pop()), P.html);
}

console.log("B — no linked recipe → the row is exactly as before");
{ ok("nowRecipeBtn: no id / an id that isn't a kitchen recipe → nothing", (()=>{ const T=mk({meals,plan}); return T.run("nowRecipeBtn('')")===""&&T.run("nowRecipeBtn(null)")===""&&T.run("nowRecipeBtn('gone')")===""; })());
  ok("nowRecipeOpen on a missing recipe opens nothing", (()=>{ const T=mk({meals,plan}); T.run("nowRecipeOpen('gone')"); return T.pop()===""; })());
  const T=mk({meals,plan,noGrocery:true});
  ok("a copy without the recipe pop-up (grMealPop) draws the rows byte-for-byte as before", T.run("kitDuePrepHTML().html")===mk({meals,plan,noGrocery:true,noHelper:true}).run("kitDuePrepHTML().html")&&!/now-recipe/.test(T.run("kitDuePrepHTML().html")));
  ok("…and Mom's agenda prep rows too", JSON.stringify(T.run("momSchedPrep('thursday')"))===JSON.stringify(mk({meals,plan,noGrocery:true,noHelper:true}).run("momSchedPrep('thursday')")));
}

console.log("C — Mom's agenda prep rows (momSchedPrep): open, put-off and done rows");
{ const T=mk({meals,plan}); let rows=T.run("momSchedPrep('thursday')");
  const mealOf=r=>/Pot Roast/.test(r.html)?"r2":"r1";   // today's two steps + tomorrow's night-before step
  ok("every prep row carries the 📖 for ITS meal (today's two → tonight's recipe, the night-before → tomorrow's)", rows.length===3&&rows.every(r=>new RegExp("nowRecipeOpen\\('"+mealOf(r)+"'\\)").test(r.html))&&rows.filter(r=>mealOf(r)==="r2").length===1, rows.map(r=>r.html));
  ok("…and keeps ✓ Done (kitMarkPrep) as its own button", rows.every(r=>/kitMarkPrep\(/.test(r.html)));
  ok("…otherwise identical to the rows without the helper", JSON.stringify(rows.map(r=>strip(r.html)))===JSON.stringify(mk({meals,plan,noHelper:true}).run("momSchedPrep('thursday')").map(r=>r.html)));
  T.ctx.kitPrepDone[TODAY]={r1_0:Date.now()}; rows=T.run("momSchedPrep('thursday')");
  ok("a done step's row still opens the recipe", rows.some(r=>/✓ /.test(r.html)&&/nowRecipeOpen\('r1'\)/.test(r.html)));
  T.run("momBlocks["+JSON.stringify(T.run("kitPrepBlockKey("+JSON.stringify({iso:TODAY,mid:"r1",idx:1})+")"))+"]={iso:mwTodayIso(),kind:'prep',at:'skip',startMin:780};");
  rows=T.run("momSchedPrep('thursday')");
  const sk=rows.find(r=>/Shred the pork/.test(r.html));
  ok("a 'Not now' step's row still opens the recipe", rows.length===3&&!!sk&&!/kitPrepNotNow/.test(sk.html)&&/nowRecipeOpen\('r1'\)/.test(sk.html), sk&&sk.html);
  T.dbOn(); T.tap(sk.html);
  ok("a tap from the agenda opens the recipe and writes nothing", /Slow Cooker Pork/.test(T.pop())&&T.writes.length===0&&T.renders.length===0);
}

console.log("D — ⚠ a low-rated meal in 🔴 Now (kitFlagNowHTML)");
{ const T=mk({meals,plan,flags:{r2:{noted:true}}}); const F=T.run("kitFlagNowHTML()");
  ok("the flag row carries the 📖 for that meal, before ✓ Got it", F.n===1&&/nowRecipeOpen\('r2'\)[\s\S]*kitFlagGotIt\('r2'\)/.test(F.html), F.html);
  ok("…otherwise the same row", strip(F.html)===mk({meals,plan,flags:{r2:{noted:true}},noHelper:true}).run("kitFlagNowHTML().html"));
  T.dbOn(); T.tap(F.html); ok("…a tap opens that recipe, writes nothing", /Pot Roast/.test(T.pop())&&T.writes.length===0);
}

console.log("E — an odd recipe id can't break the tap");
{ const odd={"a'b":Object.assign({},meals.r1,{name:"Quote Stew"})}; const T=mk({meals:odd,plan:{[TODAY]:{mid:"a'b"}}});
  const P=T.run("kitDuePrepHTML()"); T.tap(P.html); ok("an id with a quote still opens its recipe", /Quote Stew/.test(T.pop()), P.html);
}

console.log("F — one helper, every list");
const NRB='(typeof nowRecipeBtn==="function"?nowRecipeBtn(';
ok("🔴 Now rows (kitDuePrepHTML) use the helper", fn("kitDuePrepHTML").includes(NRB+"s.mid)"));
ok("Mom's agenda prep rows (momSchedPrep) use it on all three row kinds", fn("momSchedPrep").split(NRB+"s.mid)").length-1===3);
ok("⚠ flag row (kitFlagNowHTML) uses it", fn("kitFlagNowHTML").includes(NRB+"mid)"));
ok("Mom's Day 🔴 Now draws kitDuePrepHTML", /const _dp=kitDuePrepHTML\(\);\s*nowN\+=_dp\.n; h\+=_dp\.html;/.test(fn("renderMomsDay")));
ok("Dad's Day 🔴 Kitchen Now draws the same kitDuePrepHTML", /const _dp=kitDuePrepHTML\(\);[\s\S]{0,300}KITCHEN NOW/.test(fn("renderDadsDay")));
ok("Mom's agenda draws momSchedPrep", /momSchedPrep\(day\)/.test(fn("momAgendaHtml")));
ok("Mom's Day 🔴 Now draws the flag rows", /kitFlagNowHTML\(\)/.test(fn("renderMomsDay")));
ok("no second recipe viewer: the tap opens grMealPop", /grMealPop\(mid\)/.test(NR)&&!/innerHTML|createElement/.test(NR));
ok("the helper never writes (no db / ref / setItem / set( / update( )", !/\bdb\b|\.ref\(|setItem|\.set\(|\.update\(|\.remove\(/.test(NR.replace(/^\s*\/\/.*$/gm,"")));
ok("generic: no family or kid names in the block", !/lincoln|ellis|lucy|julian|adrienne|howe|dewalt|kenzie|sara\b/i.test(NR.replace(/her ask 2026-11-19[^\n]*/,"")));
ok("helper defined once", src.split("function nowRecipeBtn(").length===2&&src.split("function nowRecipeOpen(").length===2);

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
