/* 📱 Mom's Day tab row wraps on a phone instead of widening the page (her yes 2026-10-06).  run: node test_phone_width.js */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const i=src.indexOf("function mpSubnav("), f=src.slice(i, src.indexOf("\n}",i)+2);
ok("the tab row may wrap to a second line (MPSUBROW 2026-11-02: the buttons sit in .mp-row inside the sticky #mp-subnav)", /<div id="mp-subnav" style="background:#fff;border-bottom:2px solid #DEF2F1"><div class="mp-row" style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px">/.test(f));
ok("tabs keep their own width and never break mid-word", /style="flex:1 1 auto;white-space:nowrap;padding:9px 6px;/.test(f));
ok("all six tabs still there (KITCHENTAB 2026-11-02: Meals · Shopping List · Prep folded into 🍳 Kitchen; SCHOOLTAB: + 🎓 School)", ["🏡 Home Base","🗓 Schedule","🧹 Household","🍳 Kitchen","🎓 School"].every(t=>f.indexOf(t)>=0)&&/❤️ Health/.test(f));   // MPGROUPS: Weigh-In became Health
const k=src.indexOf("function mpKitchenRow("), kr=src.slice(k, src.indexOf("\n}",k)+2);
ok("…and the three live on Kitchen's own row", ["🍽 Menu","'🛒 '+SHOP_LIST_NAME","🧃 Prep"].every(t=>kr.indexOf(t)>=0));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
