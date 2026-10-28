// 🧺 PUTAWAY_REPAINT (her report 2026-10-28): ✓ Put away on a kid's Day page showed the toast but the row stayed until the minute
// tick — llPutAway never redrew, and the laundry listener redraws only Mom's pages. Now llPutAway redraws the page the tap came from.
// run: node test_putaway_repaint.js
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log(" ok - "+n); } else { fail++; console.log(" FAIL- "+n+(x!==undefined?" "+JSON.stringify(x):"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0,seen=false; for(let k=i;k<src.length;k++){ const c=src[k]; if(c==="{"){d++;seen=true;} else if(c==="}"){ d--; if(seen&&d===0) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); };
function world(o){
  const calls={renderAll:0,renderMomsPlan:0,memo:0,writes:[],toasts:[],sync:0};
  const LD={L1:{label:"Lincoln's clothes",stage:"basket",ts:1}, L2:{label:"Bedding",stage:"fold",ts:2}};
  const ctx={console,JSON,Object,Array,String,Date,Math,
    laundryData:LD, HA_LS:{setItem(){}}, tab:o.tab, kid:o.kid||"lincoln",
    _lbWrite:()=>!o.dry, db:{ref:p=>({remove:()=>calls.writes.push(p)})},
    luSnap:()=>null, luNote(){}, laundryBlockDone(){}, laundryAwayRemember(){}, llNoteAway(){}, llSyncKidRows(){ calls.sync++; },
    mwToast:m=>calls.toasts.push(m), llMemoReset(){ calls.memo++; },
    renderAll(){ calls.renderAll++; }, renderMomsPlan(){ calls.renderMomsPlan++; },
    document:{getElementById:id=>id==="content"?{}:null}};
  vm.createContext(ctx);
  vm.runInContext(fn("llPutAway")+"\n"+fn("llRerender")+"\n"+fn("hhRender"),ctx);
  return {ctx,calls,LD};
}
console.log("── a kid's Day page (Schedule tab) ──");
{ const W=world({tab:"schedule",kid:"lincoln"}); W.ctx.llPutAway("L1");
  ok("the load is gone from laundryData", !W.LD.L1 && !!W.LD.L2);
  ok("one targeted remove of laundry/L1", W.calls.writes.length===1 && W.calls.writes[0]==="laundry/L1", W.calls.writes);
  ok("the toast still shows", W.calls.toasts.length===1 && /put away!/.test(W.calls.toasts[0]));
  ok("the page is redrawn (renderAll once) — the row goes at once", W.calls.renderAll===1 && W.calls.renderMomsPlan===0, W.calls);
  ok("the laundry memo is reset before the redraw", W.calls.memo===1);
  ok("the kid's Fold rows still sync", W.calls.sync===1); }
console.log("── Mom's / Dad's My day (moms-plan) ──");
{ const W=world({tab:"moms-plan",kid:"mom"}); W.ctx.llPutAway("L2");
  ok("moms-plan redraws through renderMomsPlan, not renderAll", W.calls.renderMomsPlan===1 && W.calls.renderAll===0, W.calls); }
console.log("── dry run ──");
{ const W=world({tab:"schedule",dry:true}); W.ctx.llPutAway("L1");
  ok("dry run writes nothing", W.calls.writes.length===0);
  ok("…and still redraws (the listener never fires in a dry run)", W.calls.renderAll===1); }
console.log("── an unknown load ──");
{ const W=world({tab:"schedule"}); W.ctx.llPutAway("nope");
  ok("nothing happens: no write, no toast, no redraw", W.calls.writes.length===0 && W.calls.toasts.length===0 && W.calls.renderAll===0); }
console.log("── structure ──");
{ const f=fn("llPutAway");
  ok("the redraw line is guarded by typeof and wrapped in try", /try\{ if\(typeof llMemoReset==="function"\) llMemoReset\(\); if\(typeof llRerender==="function"\) llRerender\(\); \}catch\(x\)\{\}/.test(f));
  ok("PUTAWAY_REPAINT tag present once", (src.match(/PUTAWAY_REPAINT \(her report/g)||[]).length===1);
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
