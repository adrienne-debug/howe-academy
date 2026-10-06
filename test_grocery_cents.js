/* 🛒 grMoney reads a price typed without the leading zero (".86" = 86 cents). Sarah 2026-10-05: black beans saved as $86.
 * run: node test_grocery_cents.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const i=src.indexOf("function grMoney("); if(i<0){ console.error("grMoney not found"); process.exit(1); }
const ctx={Math,String,parseFloat}; vm.createContext(ctx); vm.runInContext(src.slice(i,src.indexOf("\n",i)),ctx);
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const M=v=>vm.runInContext("grMoney("+JSON.stringify(v)+")",ctx);
ok('".86" → 0.86 (not 86)', M(".86")===0.86, M(".86"));
ok('"$.86" → 0.86', M("$.86")===0.86, M("$.86"));
ok('"0.86" → 0.86', M("0.86")===0.86);
ok('"86" → 86 (whole dollars still whole dollars)', M("86")===86);
ok('"$1.19" → 1.19', M("$1.19")===1.19);
ok('"12.79" → 12.79', M("12.79")===12.79);
ok('"1,250.50" → 1250.5', M("1,250.50")===1250.5);
ok('" 3 " → 3', M(" 3 ")===3);
ok('"." → null', M(".")===null);
ok('"" → null', M("")===null);
ok('"abc" → null', M("abc")===null);
ok('"0" → null (nothing paid)', M("0")===null);
ok('"-5" → null', M("-5")===null);
ok('".5" → 0.5', M(".5")===0.5);
ok('"2.999" rounds to 3', M("2.999")===3);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
