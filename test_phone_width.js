/* 📱 Mom's Day tab row wraps on a phone instead of widening the page (her yes 2026-10-06).  run: node test_phone_width.js */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const i=src.indexOf("function mpSubnav("), f=src.slice(i, src.indexOf("\n}",i)+2);
ok("the tab row may wrap to a second line", /display:flex;flex-wrap:wrap;gap:4px;background:#fff;border-bottom:2px solid #DEF2F1/.test(f));
ok("tabs keep their own width and never break mid-word", /style="flex:1 1 auto;white-space:nowrap;padding:9px 6px;/.test(f));
ok("all six tabs still there", ["🏡 Today","🗓 Calendar","🍽 Meals","🛒 Grocery List","🧃 Prep"].every(t=>f.indexOf(t)>=0)&&/Weigh-In/.test(f));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
