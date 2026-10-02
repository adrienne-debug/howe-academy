// Blockouts must displace cards for a family with NO Workflow Orders saved (a new family).
// runDisplacement used to return early on `!rulesData.workflow` → the blockout banner showed, nothing moved
// (Dewalt rehearsal 2026-10-01). Source assertion, same style as test_week_boundary.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(name,c)=>{ if(c){pass++;console.log("  ok  - "+name);} else {fail++;console.log("  FAIL- "+name);} };
const i=src.indexOf("function runDisplacement(){"); ok("runDisplacement exists", i>0);
const body=src.slice(i, i+1200);
ok("no early return on a missing workflow node", !/!rulesData\.workflow/.test(body));
ok("still bails only when rules have not loaded at all", /if\(!rulesData\)\{ displacedResult=null; return; \}/.test(body));
ok("per-kid workflow stays optional in the weight function", /const kidWf=wf\[t\.who\];\s*\n\s*if\(!kidWf\) return 0;/.test(src.slice(i,i+4000)));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
