/* ✨ What's new + 👋 Mom-only how-to banners (her ask 2026-10-06).  run: node test_momnews.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// MOMNEWS_START"), b=src.indexOf("// MOMNEWS_END");
if(a<0||b<0){ console.error("MOMNEWS markers missing"); process.exit(1); }
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
console.log("── wiring ──");
ok("the ✨ row rides on both From Adrienne spots (Mom's Day card + Mom HQ)", (src.match(/const rows=\(typeof wnRowHTML==="function"\?wnRowHTML\(\):""\)\+wsRowsHTML\(now\)/g)||[]).length===2);
ok("listens for settings/momTips and settings/whatsNewSeen", /db\.ref\("settings\/momTips"\)\.on\("value"/.test(src)&&/db\.ref\("settings\/whatsNewSeen"\)\.on\("value"/.test(src));
ok("schedule banners sit right above the Mom loop strip (strip line untouched)", /h\+=momTipsScheduleHTML\(!!mlStripHTML\(\)\); \}catch\(e\)\{\} \}   \/\/ MOMNEWS[^\n]*\n  if\(day===_todayDay\)\{ try\{ h\+=mlStripHTML\(\); \}catch\(e\)\{\} \}/.test(src));
ok("grocery banners at the top of the list; checkout banner at the top of checkout", /try\{ h\+=momTipsGroceryHTML\(\); \}catch\(e\)\{\}/.test(src)&&/let h=\(typeof momTipCheckoutHTML==="function"\?momTipCheckoutHTML\(\):""\)\+'<div style="font-weight:800;font-size:16px">🧾 Checkout'/.test(src));
function mk(o){
  o=o||{}; const writes=[], ls=Object.assign({},o.ls||{}), pinAsked=[];
  const ctx={console,Math,JSON,Object,Array,String,
    HA_LS:{getItem:k=>ls[k]===undefined?null:ls[k],setItem:(k,v)=>{ ls[k]=String(v); },removeItem:k=>{ delete ls[k]; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),remove:()=>writes.push(["remove",p])})},
    momHere:()=>o.mom!==false, tipWho:()=>o.who||"mom", momModeActive:o.momMode!==false, grBig:!!o.big, _grCo:null,
    HA_IS_HOWE:!!o.howe, esc:s=>String(s==null?"":s), kitPinGate:(fn,why)=>pinAsked.push(why), renderAll:()=>{}, grCheckoutDraw:()=>{ ctx.coRedraw=(ctx.coRedraw||0)+1; },
    document:{getElementById:()=>null,createElement:()=>({style:{},remove(){}}),body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(src.slice(a,b),ctx);
  return {run:e=>vm.runInContext(e,ctx),writes,ls,pinAsked,ctx};
}
console.log("── 👋 banners: Mom only, one tap clears them everywhere ──");
{ const T=mk(); const h=T.run("momTipsScheduleHTML(true)");
  ok("Mom in Mom mode sees: Mom mode is on · How the day moves now · How your Mom loop works", /Mom mode is on for this device/.test(h)&&/How the day moves now/.test(h)&&/How your Mom loop works/.test(h));
  ok("no loop strip on screen → no loop banner", !/How your Mom loop works/.test(T.run("momTipsScheduleHTML(false)")));
  T.run("momTipGotIt('dayflow','')");
  ok("Got it writes one leaf: settings/momTips/dayflow = true", T.writes.some(w=>w[0]==="set"&&w[1]==="settings/momTips/dayflow"&&w[2]===true));
  ok("…and it's gone here", !/How the day moves now/.test(T.run("momTipsScheduleHTML(true)")));
  const T2=mk(); T2.run("momTipsOnValue({dayflow:true})");
  ok("…and gone on her other devices once the sync lands", !/How the day moves now/.test(T2.run("momTipsScheduleHTML(true)"))&&/Mom mode is on/.test(T2.run("momTipsScheduleHTML(true)")));
}
{ ok("not in Mom mode → no banners at all", mk({mom:false}).run("momTipsScheduleHTML(true)+momTipsGroceryHTML()+momTipCheckoutHTML()")==="");
  ok("Dad (or a helper) in Mom-ish mode → no banners", mk({who:"dad"}).run("momTipsScheduleHTML(true)+momTipsGroceryHTML()+momTipCheckoutHTML()")==="");
  ok("Mom-mode banner only while Mom mode is actually on", !/Mom mode is on/.test(mk({momMode:false}).run("momTipsScheduleHTML(true)")));
}
{ const T=mk(); ok("grocery list banner; the store-mode one waits for store mode", /How the grocery list works/.test(T.run("momTipsGroceryHTML()"))&&!/Shopping in the store/.test(T.run("momTipsGroceryHTML()")));
  ok("in store mode both show", /Shopping in the store/.test(mk({big:true}).run("momTipsGroceryHTML()")));
  const C=mk(); ok("checkout banner", /Checking out/.test(C.run("momTipCheckoutHTML()")));
  C.run("_grCo={sid:'all'}; momTipGotIt('grcheckout','co')"); ok("its Got it redraws the checkout screen (stays open)", C.ctx.coRedraw===1&&C.run("momTipCheckoutHTML()")==="");
}
console.log("── ✨ What's new ──");
{ const F=mk(); const row=F.run("wnRowHTML()");
  ok("family app: the ✨ row shows on the From Adrienne card", /✨|✨/.test(row)&&/New in the app — Oct 6/.test(row)&&/tap to read/.test(row));
  ok("Howe's own app: no row", mk({howe:true}).run("wnRowHTML()")==="");
  F.run("wnGotIt()");
  ok("✓ Got it writes settings/whatsNewSeen = this update's id", F.writes.some(w=>w[0]==="set"&&w[1]==="settings/whatsNewSeen"&&w[2]==="2026-10-06"));
  ok("…and the row is gone", F.run("wnRowHTML()")==="");
  const F2=mk(); F2.run("whatsNewOnValue('2026-10-06')"); ok("…gone on her other devices too", F2.run("wnRowHTML()")==="");
  const K=mk({mom:false}); K.run("wnTap()"); ok("opening it outside Mom mode asks for Mom's code", K.pinAsked.length===1&&/for Mom/.test(K.pinAsked[0]));
  ok("the notes cover schedule, Mom mode, grocery list, store mode + checkout, laundry", F.run("WHATS_NEW[0].sections.map(s=>s[0]).join('|')").split("|").length===5);
  ok("…including this afternoon's: PDF receipts, per-lb prices, Kids' Corner, laundry times", /PDF/.test(F.run("JSON.stringify(WHATS_NEW)"))&&/per lb/.test(F.run("JSON.stringify(WHATS_NEW)"))&&/Kids' Corner/.test(F.run("JSON.stringify(WHATS_NEW)"))&&/✎ Times/.test(F.run("JSON.stringify(WHATS_NEW)")));
  ok("a laundry how-to banner exists for Mom", /Laundry times/.test(mk().run("momTipLaundryHTML()"))&&mk({mom:false}).run("momTipLaundryHTML()")==="");
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
