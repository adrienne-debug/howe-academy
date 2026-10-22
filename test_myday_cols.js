/*
 * 🏡 MYDAY_COLS (her ask 2026-10-21: "lets move around my day section, lets do the chores in first column and ongoing under then middle to do
 * and shopping, then last column the laundry line up"). Same pieces, same look — only the columns moved.   run: node test_myday_cols.js
 */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const S=fn("momDayStripHTML");
const at=t=>{ const i=S.indexOf(t); if(i<0) throw new Error("missing in strip: "+t); return i; };
const grid=at("grid-template-columns"), chips=at("MC_SLOT_ORDER.forEach"), ongoing=at("colHd('🧹','Ongoing'"), todo=at("colHd('📝','To-do'"), shop=at("colHd('🛒','Shopping'"), laundry=at("colHd('🧺','Laundry'"), start=at('id="laundry-label"'), line=at("llMyDayLaundryHTML("), wash=at("wtRowHTML(who)"), ask=at("ktAskHTML()");

console.log("The three columns, in her order");
ok("column 1: the time-of-day chips and the chores, then 🧹 Ongoing under them", grid<chips&&chips<ongoing);
ok("…Ongoing is a sub-section of column 1 (dashed divider), not a column of its own", /h\+='<div style="margin-top:10px;padding-top:9px;border-top:1px dashed var\(--border\)">'\+colHd\('🧹','Ongoing'/.test(S)&&/h\+=P\.addRow\(\);\n\s*h\+='<\/div><\/div>';/.test(S));
ok("column 2: 📝 To-do, then 🛒 Shopping under it", ongoing<todo&&todo<shop&&/h\+='<div>'\+colHd\('📝','To-do'/.test(S)&&/h\+='<div style="margin-top:10px;padding-top:9px;border-top:1px dashed var\(--border\)">'\+colHd\('🛒','Shopping'/.test(S));
ok("column 3: 🧺 Laundry — its own column, no dashed top", shop<laundry&&/h\+='<div>'\+colHd\('🧺','Laundry'/.test(S));
ok("…holding the Start-a-load box, Machines now + the line, the kitchen question, 💦 wash today — in that order", laundry<start&&start<line&&line<ask&&ask<wash);
ok("the laundry column is the last thing before the card closes", S.indexOf("h+='</div></div>';",wash)>wash&&S.indexOf("colHd(",wash)<0);
console.log("Nothing else moved");
ok("three column opens inside the grid (chores · to-do · laundry), each closed", (S.match(/\n\s*h\+='<div>'/g)||[]).length===3&&(S.match(/<div style="margin-top:10px;padding-top:9px;border-top:1px dashed var\(--border\)">/g)||[]).length===2);
ok("the grid itself is unchanged (auto-fit, 232px columns)", /grid-template-columns:repeat\(auto-fit,minmax\(232px,1fr\)\);gap:12px/.test(S));
ok("every piece is still there once: to-do box, Start box, grocery add, line rows, spot check, wash today", ["id=\"'+P.todoInp+'\"",'id="laundry-label"',"P.shop()","llParentRowHTML(r,","spMomRowHTML(spR)","wtRowHTML(who)","laundryCyclePickHTML()","llOnceFromBox("].every(t=>(S.split(t).length-1)>=1)&&(S.split('id="laundry-label"').length-1)===1);
ok("marked MYDAY_COLS", /MYDAY_COLS/.test(S));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
