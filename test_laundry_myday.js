/*
 * 🧺 LL_MYDAY (her ask 2026-10-21: "on the bottom of Dad's Day and Mom's … the laundry where it shows what's currently active and not active.
 * Can we move that up to be merged into the bottom of my day? … for both Mom and for Dad. That way we can really clearly see what is
 * happening in the laundry system."). The 🏡 My day Laundry section now carries 🫧 Machines now (running loads) + 🧺 The laundry line
 * (today's loads with ✓ Done / 🫧 Start, the week grid) for Mom and for Dad; the two bottom cards are gone.  run: node test_laundry_myday.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const BLOCK=cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const MON="2026-10-19", DAYS={monday:"2026-10-19",tuesday:"2026-10-20",wednesday:"2026-10-21",sunday:"2026-10-18"};
const caps=n=>({"0":n,"1":n,"2":n,"3":n,"4":n,"5":n,"6":0});
// Her Monday, cap 2: Lincoln's clothes already in the dryer (started 9:00), Ellis still to go.
const LINE={caps:caps(2),asOf:MON,next:"lincoln",log:{[MON]:{lincoln:{at:1,load:"l1"}}}};
const LOADS={l1:{label:"Lincoln's clothes",stage:"dryer",ts:1,line:"lincoln",lineDay:MON}};
function mk(o){
  o=o||{}; const writes=[], ls={}, renders=[];
  const ctx={LL_DEFAULT_MODE:"rotate", console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))])})},
    _lbWrite:()=>true, isMom:!o.noMom, momHere:()=>ctx.isMom, _kioskD:()=>!!o.dad, kitPinGate:()=>{ ctx.gated=true; }, gated:false,
    calendarData:{holidays:{},vacations:{},kidOverrides:{}}, calNormDate:s=>s, laundryData:JSON.parse(JSON.stringify(o.loads||{})),   /* a copy — a Start tap in one world must not leak into the next */
    calDateForWeekDay:d=>DAYS[d]||null, tab:"moms-plan", renderAll:()=>renders.push("all"),
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), hhRender:()=>renders.push("hh"), mwToast:()=>{},
    // the running-loads card's helpers
    laundrySince:()=>"9:00", laundryDoneTxt:()=>"", laundryTimesEditorHTML:()=>"", momTipLaundryHTML:()=>"", laundryAdvanceLabel:()=>"Move it", laundryMeta:l=>["🌀","In the dryer"],
    writes, renders};
  vm.createContext(ctx);
  vm.runInContext(src.slice(src.indexOf("const LAUNDRY_STAGES"), src.indexOf("\n", src.indexOf("const LAUNDRY_STAGE_META")))+"\nconst LAUNDRY_WET_STAGES=LAUNDRY_STAGES;\n"+BLOCK+"\n"+fn("mdCardLaundry"),ctx);
  vm.runInContext("llToday=function(){ return '"+MON+"'; }; llNowMin=function(){ return 600; };",ctx);
  if(o.line) vm.runInContext("laundryLine="+JSON.stringify(o.line)+";",ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}

console.log("1. Mom's 🏡 My day: machines now, then the line, as Mom");
{ const c=mk({line:LINE,loads:LOADS}); const h=c.get("llMyDayLaundryHTML('mom')");
  const iM=h.indexOf("🫧 Machines now"), iL=h.indexOf("🧺 The laundry line"), iT=h.indexOf(">Today<"), iG=h.indexOf("llWeekNav(");
  ok("order: 🫧 Machines now → 🧺 The laundry line → Today — and NO week grid inside My day (her 2026-10-21: \"i do not like the this week laundry thing in my day\")", iM>=0&&iL>iM&&iT>iL&&iG<0, [iM,iL,iT,iG]);
  ok("machines now shows Lincoln's clothes in the dryer with its Move button, no blue card header", /Lincoln's clothes/.test(h.slice(iM,iL))&&/laundryAdvance\('l1'\)/.test(h)&&!/<span>🧺<\/span> Laundry<span style="flex:1">/.test(h));
  ok("the line: Ellis is today's open load with ✓ Done and 🫧 Start — logged as MOM", /llMarkDone\('ellis','mom'\)/.test(h)&&/llStart\('ellis','mom'\)/.test(h)&&!/'dad'\)/.test(h));
  ok("the started load shows in the line too, with its stage, and no buttons", /Lincoln's clothes <span[^>]*>· 👤 [^<]*· 🌀/.test(h)&&!/llStart\('lincoln'/.test(h), h.match(/Lincoln's clothes <span[^<]*/g));
  ok("bare: no white card chrome of its own (a dashed divider inside the section instead)", !/box-shadow:0 2px 10px/.test(h)&&/border-top:1px dashed var\(--border\)/.test(h));
  c.get("llStart('ellis','mom')"); const started=Object.keys(c.laundryData).filter(k=>k!=="l1"); ok("tapping Start as Mom: the load has no 'by' (hers), like the old chips", started.length===1&&!c.laundryData[started[0]].by, c.laundryData);
}
console.log("2. Dad's 🏡 My day: the same, as Dad");
{ const c=mk({noMom:true,dad:true,line:LINE,loads:LOADS}); const h=c.get("llMyDayLaundryHTML('dad')");
  ok("Ellis's buttons are his: llStart('ellis','dad') / llMarkDone('ellis','dad')", /llMarkDone\('ellis','dad'\)/.test(h)&&/llStart\('ellis','dad'\)/.test(h));
  ok("Dad's card by itself is unchanged: llDadCardHTML() still draws the full card as Dad", (function(){ const d=c.get("llDadCardHTML()"); return /box-shadow:0 2px 10px/.test(d)&&/llStart\('ellis','dad'\)/.test(d)&&/llWeekNav\(/.test(d); })());
}
console.log("3. Nothing to show → nothing drawn (the strip stays byte-identical when laundry isn't set up)");
{ ok("no line, nothing running: empty string", mk().get("llMyDayLaundryHTML('mom')")==="");
  ok("a line but nothing running: the line only, no 'Machines now'", (function(){ const h=mk({line:LINE}).get("llMyDayLaundryHTML('mom')"); return h.indexOf("🫧 Machines now")<0&&h.indexOf("🧺 The laundry line")>=0; })());
  ok("something running but no line: machines now only", (function(){ const h=mk({loads:LOADS}).get("llMyDayLaundryHTML('mom')"); return h.indexOf("🫧 Machines now")>=0&&h.indexOf("🧺 The laundry line")<0; })());
  ok("mdCardLaundry(true) — the old full card — is byte-for-byte what it was (bare off)", /<span>🧺<\/span> Laundry<span style="flex:1">/.test(mk({loads:LOADS}).get("mdCardLaundry(true)")));
}
console.log("4. Wiring");
{ const strip=fn("momDayStripHTML"), dad=fn("renderDadsDay"), mom=fn("renderMomsDay");
  ok("the strip's Laundry section: Start box → llMyDayLaundryHTML(mom|dad) → the kitchen question → wash today", (function(){ const a=strip.indexOf('id="laundry-label"'), b=strip.indexOf("llMyDayLaundryHTML(P.dad?'dad':'mom')"), c=strip.indexOf("ktAskHTML()"), d=strip.indexOf("wtRowHTML(who)"); return a>0&&b>a&&c>b&&d>c; })());
  ok("the strip no longer draws the old chips", strip.indexOf("llStripHTML(")<0);
  ok("Dad's Day: no llDadCardHTML() and no mdCardLaundry(true) at the bottom any more", dad.indexOf("llDadCardHTML(")<0&&dad.indexOf("mdCardLaundry(")<0&&/LL_MYDAY/.test(dad));
  ok("Mom's Day: no mdCardLaundry(true) at the bottom any more", mom.indexOf("mdCardLaundry(")<0&&/LL_MYDAY/.test(mom));
  ok("marked block", src.indexOf("// LL_MYDAY_START")>0&&src.indexOf("// LL_MYDAY_END")>src.indexOf("// LL_MYDAY_START"));
  ok("no new Firebase write in the block", !/\.ref\(|\.set\(|\.update\(/.test(cut("// LL_MYDAY_START","// LL_MYDAY_END")));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
