/*
 * 🧺 LAUNDRYLINE step 6 — Dad sees it, kids see theirs (her "go on with 6" 2026-10-16: "there needs to be consideration like where dad
 * sees all of this"). Dad's Day: today's loads (who, where, 🫧 Start as his), the question, 🤒, the week grid — no settings. A kid's
 * Day page: "🧺 Your laundry", a DERIVED card (never in the week tasks) for the loads that kid runs that day.  run: node test_laundry_views.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", DAYS={monday:"2026-10-19",tuesday:"2026-10-20",wednesday:"2026-10-21",sunday:"2026-10-18"};
function mk(o){
  o=o||{}; const writes=[], ls={}, renders=[];
  const ctx={LL_DEFAULT_MODE:"rotate",   // these replay the plain rotation; 📅 home days: test_laundry_home.js
    console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:Object.assign({holidays:{},vacations:{},kidOverrides:{}},o.cal||{}), calNormDate:s=>s, laundryData:o.loads||{},
    calDateForWeekDay:d=>DAYS[d]||null, tab:o.tab||"moms-plan", renderAll:()=>renders.push("all"),
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>renders.push("hh"), mwToast:()=>{}, writes, renders};
  vm.createContext(ctx); vm.runInContext(BLOCK,ctx);
  vm.runInContext("llToday=function(){ return '"+(o.day||MON)+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const caps=n=>({"0":n,"1":n,"2":n,"3":n,"4":n,"5":n,"6":0});

console.log("1. Dad's Day");
{ const c=mk({noMom:true,dad:true,line:{caps:caps(2),asOf:MON,next:"lincoln",jump:{[MON]:{w1:{label:"Towels",at:1}}},log:{[MON]:{lincoln:{at:1,load:"l1"}}}},loads:{l1:{label:"Lincoln's clothes",stage:"dryer"}},cal:{kidOverrides:{}}});
  const h=c.llDadCardHTML();
  ok("the card: today's jump-in, Lincoln (👤 Lincoln · 🌀 in the dryer) — cap 2 with the towels holding one", /💦 Towels/.test(h)&&/Lincoln's clothes <span[^>]*>· 👤 Lincoln · 🌀 in the dryer/.test(h)&&!/Ellis's clothes/.test(h.split("This week")[0]), h.slice(0,900));
  ok("no Start on a load that's in; 🤒 there; the week grid with Start as his; no settings", !/llStart\('lincoln'/.test(h)&&/llMomSick\(\)/.test(h)&&/This week/.test(h)&&!/llCapStep|llMove|llDoerNext|llBump|llX/.test(h));
  const d=mk({noMom:true,dad:true,line:{caps:caps(2),asOf:MON}}); const dh=d.llDadCardHTML();
  ok("his Start buttons start it as his (list + grid)", /llStart\('lincoln','dad'\)/.test(dh)&&(dh.match(/llStart\('ellis','dad'\)/g)||[]).length===2, dh.match(/llStart\([^)]*\)/g));
  d.llStart("lincoln","dad"); const set=d.writes.find(w=>w[0]==="set"); ok("…by:dad on the load and the log", set[2].by==="dad"&&d.get("laundryLine.log['"+MON+"'].lincoln.by")==="dad");
  ok("once it's in, the card names who started it (Dad), not the usual doer", /Lincoln's clothes <span[^>]*>· 👤 Dad · 🫧 in the washer/.test(d.llDadCardHTML()));
  ok("not set up: nothing on his Day", mk({dad:true}).llDadCardHTML()==="");
  ok("wired after his bills, before the running loads", /llDadCardHTML\(\); \}catch\(e\)\{\}   \/\/ 🧺 LAUNDRYLINE step 6: the line on Dad's Day\n  try\{ h\+=mdCardLaundry\(true\)/.test(src));
}
console.log("2. A kid's Day page");
{ const c=mk({tab:"kids",noMom:true,line:{caps:caps(2),asOf:MON}});
  const h=c.llKidCardHTML("lincoln","monday");
  ok("Lincoln, Monday: 🧺 Your laundry · Lincoln's clothes · 🫧 It's in the washer", /🧺 Your laundry/.test(h)&&/Lincoln's clothes/.test(h)&&/llStart\('lincoln','lincoln'\)"[^>]*>🫧 It's in the washer/.test(h), h);
  ok("Lucy has nothing Monday", c.llKidCardHTML("lucy","monday")==="");
  ok("Lucy, Tuesday: her load shown ahead — no button on a later day", /Your laundry · Tue/.test(c.llKidCardHTML("lucy","tuesday"))&&!/llStart\(/.test(c.llKidCardHTML("lucy","tuesday")));
  ok("a day already gone: nothing", mk({day:"2026-10-20",line:{caps:caps(2),asOf:MON}}).llKidCardHTML("lincoln","monday")==="");
  ok("Mom & Dad's / Towels never land on a kid", ["lincoln","ellis","lucy","julian"].every(k=>!/Towels|Mom &/.test(c.llKidCardHTML(k,"wednesday"))));
  c.llStart("lincoln","lincoln"); const set=c.writes.find(w=>w[0]==="set");
  ok("the kid's tap: the same load, by:lincoln, logged by:lincoln", set&&set[2].by==="lincoln"&&set[2].line==="lincoln"&&c.get("laundryLine.log['"+MON+"'].lincoln.by")==="lincoln");
  ok("the kid page re-renders (renderAll), not Mom's plan", c.renders[c.renders.length-1]==="all");
  c.get("laundryData['"+set[1].slice(8)+"']").stage="dryer"; const after=c.llKidCardHTML("lincoln","monday");
  ok("after: ✓ 🧺 Your laundry · 🌀 in the dryer, no button", /✓ 🧺 Your laundry/.test(after)&&/🌀 in the dryer/.test(after)&&!/llStart\(/.test(after));
}
console.log("3. Who runs it decides whose card");
{ const c=mk({tab:"kids",line:{caps:caps(2),asOf:MON,cover:{[MON]:{lincoln:"ellis"}}},cal:{kidOverrides:{lincoln:{[MON]:{school:false}}}}});
  ok("Lincoln off, Ellis covering: Ellis's card has Lincoln's clothes (and his own), Lincoln's has none", /Lincoln's clothes/.test(c.llKidCardHTML("ellis","monday"))&&/Ellis's clothes/.test(c.llKidCardHTML("ellis","monday"))&&c.llKidCardHTML("lincoln","monday")==="");
  const w=mk({tab:"kids",line:{caps:caps(2),asOf:MON,cover:{[MON]:{lincoln:"wait"}}}});
  ok("⏸ waiting a day: not on his card today", w.llKidCardHTML("lincoln","monday")==="");
  const m=mk({tab:"kids",line:{caps:caps(2),asOf:MON,next:"momdad",cover:{[MON]:{towels:"lucy"}},momSick:{[MON]:true}}});
  ok("Mom sick, Lucy doing Towels: on Lucy's card", /Towels/.test(m.llKidCardHTML("lucy","monday")));
  ok("not set up: no card", mk({tab:"kids"}).llKidCardHTML("lincoln","monday")==="");
}
console.log("4. Derived, never written");
{ const c=mk({tab:"kids",line:{caps:caps(2),asOf:MON}}); c.llKidCardHTML("lincoln","monday"); c.llDadCardHTML();
  ok("drawing the cards writes nothing", c.writes.length===0);
  ok("wired after the 🏡 House card on the kid's Day page", /hhHouseCardHTML\(kid,day,tasks\); \}catch\(e\)\{\} \}[^\n]*\n  if\(_singleKid&&typeof llKidCardHTML==="function"\)\{ try\{ h\+=llKidCardHTML\(kid,day\)/.test(src));
  const code=BLOCK.split("\n").map(l=>l.replace(/^\s*\/\/.*$/,"").replace(/\s\/\/ .*$/,"")).join("\n");
  const noSync=code.replace(/function llSyncKidRows\([\s\S]*?\n  return n; \}/,"");   // 🧺 LINE_CHORES sync writes routine ticks (wk/sl via slSaveChanged), never cards
  ok("the block's code never touches week tasks (no tasks path anywhere; activeWk only in the routine-tick sync)", !/ref\([^)]*tasks|["']tasks["']|\/tasks/.test(code)&&!/activeWk\(/.test(noSync)&&/function llSyncKidRows/.test(code));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
