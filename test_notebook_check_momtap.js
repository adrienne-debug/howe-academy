/*
 * ✅ Lincoln's notebook answer sheet opens when MOM checks his Morning Notebook herself (her ask 2026-10-01: "when he
 * clicked finished his notebook it then showed his answers for me… I would like that back"). A Mom-mode tap checks the
 * card directly and skips the claim → Approve path (the only place the sheet opened), so on 10/1 she checked it while
 * walking the kids' cards and the sheet never came. Now the direct check-off makes the same call Approve makes, Mom-only.
 *   run:  node test_notebook_check_momtap.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const i=src.indexOf('  dbg("write checked id="+id+" n="+Object.keys(checked).length);');
ok("the direct check-off write is where it was",i>0);
const after=src.slice(i,i+1400);
ok("right after it, a Mom-mode check of a Morning Notebook opens the answer sheet (same call as Approve)",
  /try\{ if\(momHere\(\)&&typeof nbChkOpen==="function"&&typeof NB_WB_KIDS!=="undefined"&&NB_WB_KIDS\[t\.who\]&&\/Morning Notebook\/\.test\(t\.title\|\|""\)\) nbChkOpen\(t\.who,WK,t\.day\); \}catch\(e\)\{\}/.test(after));
ok("…and Approve still opens it too",/try\{ if\(NB_WB_KIDS\[t\.who\]&&\/Morning Notebook\/\.test\(t\.title\|\|""\)\) nbChkOpen\(t\.who,WK,t\.day\); \}catch\(e\)\{\}/.test(src));
ok("the sheet itself stays Mom-only (nbChkOpen bails without momHere)",/function nbChkOpen\(kid,wk,day\)\{\n  if\(!momHere\(\)\|\|!NB_WB_KIDS\[kid\]\) return;/.test(src));
ok("a kid's claim path (send to Mom) is untouched — no sheet call before the claim write",!/pendingClaimMode\)\{[\s\S]{0,600}nbChkOpen/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
