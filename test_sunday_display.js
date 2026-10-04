// ☀️ SUNDAY_DISPLAY (2026-10-04): Sunday's header shows a date and its tab leads the row — display only.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} }
const sortRow=ds=>{ const DAYS_ALL=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]; return ds.slice().sort((a,b)=>(a==="sunday"?-1:DAYS_ALL.indexOf(a))-(b==="sunday"?-1:DAYS_ALL.indexOf(b))); };
ok("Sunday leads the tab row", sortRow(["monday","tuesday","friday","sunday"]).join()==="sunday,monday,tuesday,friday");
ok("weekdays keep Monday-first order", sortRow(["friday","monday","saturday","wednesday"]).join()==="monday,wednesday,friday,saturday");
ok("the tab row uses the Sunday-first sort", /ds\.sort\(\(a,b\)=>\(a==="sunday"\?-1:DAYS_ALL\.indexOf\(a\)\)-\(b==="sunday"\?-1:DAYS_ALL\.indexOf\(b\)\)\);/.test(src));
ok("DAYS_ALL (the Monday-first logic list) is unchanged", /const DAYS_ALL = \["monday","tuesday","wednesday","thursday","friday","saturday","sunday"\];/.test(src));
ok("DAYS (school days) still has no Sunday", /const DAYS = \["monday","tuesday","wednesday","thursday","friday","saturday"\];/.test(src));
const i=src.indexOf("function _dayDate(d){"); const body=src.slice(i,i+1400);
ok("Sunday's header: today's date when today is Sunday", /if\(d==="sunday"\)\{\s*if\(d===_todayDay\) return new Date\(\)\.toLocaleDateString/.test(body));
// the Monday − 1 fallback, evaluated
const md=new Date("October 5, 2026"); md.setDate(md.getDate()-1);
ok("otherwise the day before that week's Monday", md.toLocaleDateString("en-US",{month:"long",day:"numeric"})==="October 4" && /md\.setDate\(md\.getDate\(\)-1\)/.test(body));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
