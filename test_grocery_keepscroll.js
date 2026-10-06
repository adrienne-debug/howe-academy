/* 📜 A grocery pop-up keeps its place when it redraws (her report 2026-10-06).  run: node test_grocery_keepscroll.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const i=src.indexOf("function grPop("), f=src.slice(i, src.indexOf("\n}",i)+2);
// a tiny DOM: innerHTML replaces the box; the box remembers scrollTop
function mkDom(){
  const w={attrs:{},_box:null,get innerHTML(){ return this._h||""; },set innerHTML(v){ this._h=v; this._box=v?{scrollTop:0}:null; },
    querySelector(sel){ return sel===".gr-pop-box"?this._box:null; },getAttribute(k){ return this.attrs[k]===undefined?null:this.attrs[k]; },setAttribute(k,v){ this.attrs[k]=v; }};
  return {w, document:{getElementById:id=>id==="gr-pop"?w:null,createElement:()=>w,body:{appendChild(){}}}};
}
const D=mkDom(), ctx={document:D.document,String}; vm.createContext(ctx); vm.runInContext(f,ctx);
const RC='<div style="font-weight:800;font-size:15px">📸 Read a receipt</div><div>rows…</div>';
vm.runInContext("grPop("+JSON.stringify(RC)+")",ctx); D.w._box.scrollTop=640;
vm.runInContext("grPop("+JSON.stringify(RC.replace("rows…","rows (a chip tapped)"))+")",ctx);
ok("tapping an option redraws the receipt but keeps her place (640)", D.w._box.scrollTop===640, D.w._box.scrollTop);
vm.runInContext("grPop("+JSON.stringify('<div style="font-weight:800;font-size:16px">🧾 Checkout</div>')+")",ctx);
ok("a different pop-up (checkout) starts at the top", D.w._box.scrollTop===0);
vm.runInContext("grPop('')",ctx); vm.runInContext("grPop("+JSON.stringify(RC)+")",ctx);
ok("closing and opening again starts at the top", D.w._box.scrollTop===0);
ok("receipt reading: a weighed line's price is the LINE total (4.05 for 3 lb @ 1.35), qty is the weight", /always the LINE total\. Items sold by weight[^\n]*price is 4\.05 and qty is 3, never 1\.35/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
