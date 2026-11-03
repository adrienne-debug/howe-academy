/*
 * 🌤 LL_WHEN (Sara DeWalt's report 2026-11-02, via Adrienne: two loads on a Monday, the second kid's "Start your laundry" sat on her
 * Morning list — the list that opens school — while the first load had the washer; "I tried to change it to an afternoon chore").
 * Replays her Monday shape (plus Mom's Towels, so the cap is 3): Girls' Clothes (one kid) then Boys' Clothes (the other). 🌅 Morning stays the default; 🌤 Afternoon
 * moves that load's Start row to the Afternoon list (and Mom's / Dad's Start row to their Afternoon checklist). One targeted write.
 * run: node test_laundry_when.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const LL=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-11-02";
const MORNING=[{emoji:"🦷",label:"Brush teeth",pts:0,cad:"daily"},{emoji:"🛏️",label:"Make bed",pts:0,cad:"daily"}];
const AFTERNOON=[{emoji:"🧽",label:"Wipe table",pts:5,cad:"daily"}];
const LINE={caps:{"0":3,"1":1},asOf:MON,homeFrom:MON,mode:"home",items:{
  girls:{label:"Girls’ Clothes",emoji:"👕",order:0,doer:"ana"},
  boys:{label:"Boys’ Clothes",emoji:"👕",order:1,home:0,doer:"ben"},
  towels:{label:"Towels",emoji:"🛁",order:3,home:0,doer:"mom"}}};
function mk(o){
  o=o||{}; const writes=[], ls={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,RegExp,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _lbWrite:()=>true, momHere:()=>!o.kid, _kioskD:()=>false, kitPinGate:()=>{ ctx.gated=true; }, gated:false, laundryData:{}, calDateForWeekDay:d=>d==="monday"?MON:null, day:"monday", _todayDay:"monday", tab:"kids", renderAll:()=>{},
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s,
    rtStepsFor:(sl)=>sl==="morning"?MORNING:sl==="afternoon"?AFTERNOON:[],
    ROSTER:["ana","ben"], KID_NAME:{ana:"Ana",ben:"Ben"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>{}, mwToast:()=>{}, writes};
  vm.createContext(ctx); vm.runInContext(LL+"\n"+fn("laundryStartGuess")+"\n"+fn("laundryStarts")+"\n"+fn("laundryKidId")+"\n"+fn("laundryKidHook"),ctx);
  vm.runInContext("llToday=function(){ return '"+MON+"'; }; llNowMin=function(){ return 600; };",ctx);
  vm.runInContext("laundryLine="+JSON.stringify(o.line||LINE)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}
const labels=a=>a.map(s=>s.label);
const btn=(on,t)=>'<b data-on="'+on+'">'+t+'</b>';

console.log("1. Nothing saved: both Start rows on Morning, as before");
{ const c=mk();
  ok("each load reads 🌅 Morning", c.llWhen("girls")==="morning"&&c.llWhen("boys")==="morning");
  ok("Ana's Morning: her rows, then Start your laundry: Girls’ Clothes", labels(c.llRtSteps("morning","ana",MORNING,"monday")).join("|")==="Brush teeth|Make bed|Start your laundry: Girls’ Clothes");
  ok("Ben's Morning: his rows, then Start your laundry: Boys’ Clothes (the row that held his school)", labels(c.llRtSteps("morning","ben",MORNING,"monday")).join("|")==="Brush teeth|Make bed|Start your laundry: Boys’ Clothes");
  ok("Ben's Afternoon: his own rows only", c.llRtSteps("afternoon","ben",AFTERNOON,"monday").length===1);
  ok("the chip reads 🌅 Morning and taps llWhenNext", /llWhenNext\('boys'\)/.test(c.llWhenChip("boys",btn))&&/🌅 Morning/.test(c.llWhenChip("boys",btn)));
  const R=JSON.parse(JSON.stringify(LINE)); R.items.sheets={label:"Sheets",emoji:"🛏",order:4,home:0,doer:"mom",with:"boys"};
  ok("a 🔗 rider (Sheets with Boys’) has no chip — it goes with its host", mk({line:R}).llWhenChip("sheets",btn)==="");
}
console.log("2. Mom taps 🌅 on Boys’ Clothes → 🌤 Afternoon");
{ const c=mk(); c.llWhenNext("boys");
  const up=c.writes.filter(w=>w[0]==="update");
  ok("one write: laundryLine items/boys/when = afternoon", up.length===1&&up[0][1]==="laundryLine"&&JSON.stringify(up[0][2])==='{"items/boys/when":"afternoon"}', c.writes);
  ok("the chip now reads 🌤 Afternoon", c.llWhen("boys")==="afternoon"&&/🌤 Afternoon/.test(c.llWhenChip("boys",btn)));
  ok("Ben's Morning: no laundry row — the list that opens school is just his routine", labels(c.llRtSteps("morning","ben",MORNING,"monday")).join("|")==="Brush teeth|Make bed");
  const af=c.llRtSteps("afternoon","ben",AFTERNOON,"monday");
  ok("Ben's Afternoon: his row, then Start your laundry: Boys’ Clothes (same stars, a line row)", labels(af).join("|")==="Wipe table|Start your laundry: Boys’ Clothes"&&af[1].laundry===true&&af[1].line==="boys"&&af[1].pts===10, af);
  ok("Ana's Girls’ Clothes still on her Morning", labels(c.llRtSteps("morning","ana",MORNING,"monday")).indexOf("Start your laundry: Girls’ Clothes")===2);
  c.writes.length=0; c.laundryKidHook("ben",af[1],"wk_monday_ben_astep1",true);
  const set=c.writes.find(w=>w[0]==="set");
  ok("✓ on the Afternoon row starts the load, Ben's", set&&set[2].line==="boys"&&set[2].by==="ben"&&set[2].stage==="washer", c.writes);
  const af2=c.llRtSteps("afternoon","ben",AFTERNOON,"monday");
  ok("…then Fold + put away joins AFTER it — the Start row keeps its place (index 1), no tick key moves", labels(af2).join("|")==="Wipe table|Start your laundry: Boys’ Clothes|Fold + put away: Boys’ Clothes", labels(af2));
  c.writes.length=0; c.llWhenNext("boys");
  ok("tap again → back to 🌅 Morning: when removed (null), the row back on Morning", JSON.stringify(c.writes.filter(w=>w[0]==="update")[0][2])==='{"items/boys/when":null}'&&c.llWhen("boys")==="morning");
}
console.log("3. Mom's and Dad's checklists follow it");
{ const c=mk(); ok("Towels (Mom's) on her ☀️ Morning by default", c.llParentRows("mom","morning").map(r=>r.label).join()==="Start: Towels");
  c.llWhenNext("towels");
  ok("🌤 Afternoon: off her Morning, Start: Towels on her Afternoon", c.llParentRows("mom","morning").length===0&&c.llParentRows("mom","afternoon").map(r=>r.label).join()==="Start: Towels");
  c.llParentTick("towels","start","mom");
  ok("ticked: Start reads done and Fold + put away follows it on the Afternoon", c.llParentRows("mom","afternoon").map(r=>r.label+(r.done?"✓":"")).join("|")==="Start: Towels✓|Fold + put away: Towels");
}
console.log("4. Who can change it");
{ const k=mk({kid:true}); k.llWhenNext("boys");
  ok("a kid's device asks for Mom's PIN and writes nothing", k.gated&&k.writes.length===0&&k.llWhen("boys")==="morning");
  const d=mk(); d.get("_lbWrite=function(){ return false; }"); d.llWhenNext("boys");
  ok("dry run: nothing reaches the database", d.writes.length===0);
  const x=mk(); x.llWhenNext("nope"); ok("an id not on the line: nothing", x.writes.length===0);
}
console.log("5. Wiring");
{ const C=fn("llCardHTML");
  ok("the chip sits by 👤 on each line row", /btn\("llDoerNext\('"\+id\+"'\)","👤 "\+esc\(llName\(llDoer\(id\)\)\)\)\+llWhenChip\(id,btn\)/.test(C));
  ok("the block is marked", src.indexOf("// LL_WHEN_START")>0&&src.indexOf("// LL_WHEN_END")>src.indexOf("// LL_WHEN_START"));
  ok("no family's kids named in the block", !/\b(lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb)\b/i.test(cut("// LL_WHEN_START","// LL_WHEN_END").replace(/^\/\/.*$/mg,"")));
}
console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
