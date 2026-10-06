/* 🧒 Kids' Corner cards are always the kid's, even with Mom mode left on (her yes 2026-10-06).  run: node test_kidscorner_cards.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const seg=(start)=>{ const a=src.indexOf(start); const m=/\n(function |document\.getElementById\()/g; m.lastIndex=a+10; const r=m.exec(src); return src.slice(a, r?r.index:src.length); };
const ctx={}; vm.createContext(ctx);
const mh=src.match(/function momHere\(\)\{[^\n]*\}/)[0], mhc=src.match(/function momHereCards\(\)\{[^\n]*\}/);
ok("momHereCards is defined", !!mhc);
vm.runInContext("var momModeActive=true, adminPinUnlocked=true, tab='kids';\n"+mh+"\n"+mhc[0],ctx);
ok("Mom mode on, Kids' Corner → cards act as the kid's", vm.runInContext("momHere()===true&&momHereCards()===false",ctx));
vm.runInContext("tab='schedule'",ctx); ok("Mom mode on, Schedule → cards act as Mom's, as before", vm.runInContext("momHereCards()===true",ctx));
vm.runInContext("tab='kids'; momModeActive=false; adminPinUnlocked=false",ctx); ok("Mom mode off anywhere → kid's", vm.runInContext("momHereCards()===false",ctx));
for(const [lbl,start] of [["the card (taskCard)","function taskCard("],["tapping a card (tapTask)","function tapTask("],["the check-off dialog's OK","document.getElementById(\"dlg-ok\").onclick=()=>{"]]){
  const s=seg(start); ok(lbl+" reads momHereCards(), never momHere()", s.indexOf("momHereCards()")>=0&&!/momHere\(\)/.test(s.replace(/momHereCards\(\)/g,"")));
}
ok("approve / reject a claim on a card follows the card rule", /if\(momHereCards\(\)&&!readOnly\)\{\s*dr='<div class="done-row"[^\n]*Claimed/.test(src));
ok("a kid's tap on Kids' Corner goes through Mom's check (verify) even in Mom mode", /const verify=needsVerify\(t\)&&!momHereCards\(\)/.test(src));
ok("push / dismiss in the tap dialog follows the card rule", /if\(momHereCards\(\)&&!t\.id\.endsWith\("_c"\)&&!t\.famBlock\)\{/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
