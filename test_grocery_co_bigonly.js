/* 🛒 Checkout only in store mode (her ask 2026-10-06).  run: node test_grocery_co_bigonly.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const rg=fn("renderGrocery");
ok("the Checkout button is drawn only when grBig (store mode)", /\+\(grBig\?'<button onclick="grDone\(\)"/.test(src));
ok("outside store mode the cart shows a hint instead", /Checkout is in 🏃 Store mode/.test(src));
ok("exactly one grDone() button in the app", (src.match(/onclick="grDone\(\)"/g)||[]).length===1);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
