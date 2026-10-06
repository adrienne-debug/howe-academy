/*
 * ✅ Notebook answer sheet — how it opens. History: 2026-10-01 she asked for the sheet to open when SHE checks the Morning
 * Notebook (the claim → Approve path was the only place it opened). 2026-10-05 (NBANS) she changed the rule: the sheet
 * never pops up on its own on a kid's device — a Mom-mode "📓 Answers" button on the Morning Notebook card opens it.
 * This test pins the NEW rule: no automatic call on Approve, none on a Mom-mode direct check, the card has the button,
 * the sheet stays Mom-only, and a kid's claim path is untouched.
 *   run:  node test_notebook_check_momtap.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const i=src.indexOf('  dbg("write checked id="+id+" n="+Object.keys(checked).length);');
ok("the direct check-off write is where it was",i>0);
const after=src.slice(i,i+1400);
ok("a Mom-mode direct check of a Morning Notebook does NOT open the sheet any more (NBANS 2026-10-05)",!/nbChkOpen\(t\.who,WK,t\.day\)/.test(after));
const ap=src.slice(src.indexOf("function momApprove("), src.indexOf("\nfunction ", src.indexOf("function momApprove(")+10));
ok("…and Approve does not open it either",!/nbChkOpen/.test(ap));
const tc=src.slice(src.indexOf("function taskCard("), src.indexOf("\nfunction ", src.indexOf("function taskCard(")+10));
ok("instead the Morning Notebook card carries a Mom-mode 📓 Answers button (bank kids only)",/const nbAnsRow=\(!readOnly&&momHere\(\)&&typeof NB_WB_KIDS!=="undefined"&&NB_WB_KIDS\[t\.who\]&&\/Morning Notebook\/\.test\(t\.title\|\|""\)/.test(tc)&&/\+nbAnsRow\+/.test(tc));
ok("the sheet itself stays Mom-only (nbChkOpen bails without momHere)",/function nbChkOpen\(kid,wk,day\)\{\n  if\(!momHere\(\)\|\|!NB_WB_KIDS\[kid\]\) return;/.test(src));
ok("a kid's claim path (send to Mom) is untouched — no sheet call before the claim write",!/pendingClaimMode\)\{[\s\S]{0,600}nbChkOpen/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
