/*
 * 🏡 HH_POINTER — under Take over the Chores & Stars page points to the Household tab (the plan's "Lists → pointer";
 * her "go" 2026-10-11). A door, a line about what lives there; the editor keeps working.     run: node test_chores_pointer.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,200)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const ctx={}; vm.createContext(ctx); vm.runInContext(fn("cpHouseholdPointerHTML"),ctx);
const h=vm.runInContext("cpHouseholdPointerHTML()",ctx);
ok("says where the lists live and what to do there", /Household now/.test(h)&&/Add a chore, give one to someone, start a rotation and set levels there/.test(h));
ok("a door to Mom's Day ▸ Household", /onclick="mpGoto\('house'\)"/.test(h)&&/Open Household/.test(h));
ok("the editor still works and saves there", /Edits here still work and are saved there/.test(h));
const page=fn("renderChorePlan");
ok("shown only under Take over, before the tabs", /if\(typeof hhTakeoverOn==="function"&&hhTakeoverOn\(\)\) h\+=cpHouseholdPointerHTML\(\);/.test(page)&&page.indexOf("cpHouseholdPointerHTML()")<page.indexOf("_cpTabsHTML()"));
ok("the old one-line banner is gone", src.indexOf("Edits here are saved there.")<0);
ok("mpGoto opens Mom's Day on that sub-view", /function mpGoto\(v\)\{ mpSubView=v;/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
