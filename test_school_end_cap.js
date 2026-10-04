// ⏰ SCHOOL_END_CAP (2026-10-04, her rule): the week generator never lays a weekday card past school end.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; function ok(n,c){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} }
const i=src.indexOf("function gwBuildDayTasks("); const body=src.slice(i,i+3000);
ok("weekday cutoff is school end", /const cutoff=\(dayName!=="saturday"\)\?r\.schoolEnd:Math\.max\(r\.schoolEnd,17\*60\);/.test(body));
ok("the old 5 PM-unless-Theater rule is gone", !/theater&&dayName!=="friday"&&dayName!=="saturday"\)\?r\.schoolEnd/.test(src));
const cut=(dayName,r)=>(dayName!=="saturday")?r.schoolEnd:Math.max(r.schoolEnd,17*60);
ok("Thursday ends at 4:00 when school ends at 4:00", cut("thursday",{schoolEnd:960})===960);
ok("Saturday keeps its catch-up allowance (5 PM)", cut("saturday",{schoolEnd:960})===1020);
ok("past-cutoff book lessons still roll on (day-bound dailies don't)", /if\(!_dayBound&&String\(dp\.reason\|\|""\)\.includes\("CUTOFF"\)\) _cut\.push\(dp\)/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
