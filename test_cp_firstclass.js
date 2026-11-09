// test_cp_firstclass.js — CPFIRSTCLASS (2026-11-08): the first live sign-in on a brand-new class site sat on "Loading the class…" forever.
// envConsoleHtml waited for a class before drawing any view, but the only place to create the first class (+ Class) is the 🔑 Admin
// view behind that wait. Now the admin's Admin view draws with no class, and the waiting card tells the admin where to go.
const fs=require("fs"), path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const i=src.indexOf("function envConsoleHtml(){"), j=src.indexOf("\n}\n",i); const FN=i>=0?src.slice(i,j):"";
ok("envConsoleHtml is present once", i>=0&&src.split("function envConsoleHtml(){").length===2);
const guard=FN.split("\n").filter(l=>/Loading the class…/.test(l));
ok("one waiting line, and the admin's Admin view is excepted from it", guard.length===1&&/if\(!cls&&!envsDemo\(\)&&!\(admin&&v==="admin"\)\) return/.test(guard[0]));
ok("the admin with zero classes is told to open 🔑 Admin → + Class", /admin&&_envc\.classes&&!Object\.keys\(_envc\.classes\)\.length\)\?'No class yet — open \\u\{1F511\} Admin and add the first one with \+ Class\.'/.test(guard[0]));
ok("everyone else (and the admin before the classes listener answers) still sees Loading the class…", /:'Loading the class…'/.test(guard[0]));
// the Admin view itself never needs a class: it reads _envc.classes / _envc.teachers and envcStudents() (which tolerates a null class)
const a=src.indexOf("function envcAdminHtml(){"), b=src.indexOf("\n}\n",a); const ADM=a>=0?src.slice(a,b):"";
ok("envcAdminHtml does not read _envc.cls directly", ADM&&!/_envc\.cls\b/.test(ADM));
ok("envcStudents tolerates a null class", /function envcStudents\(\)\{ const ids=Object\.keys\(\(_envc\.cls&&_envc\.cls\.students\)\|\|\{\}\)/.test(src));
// the chips row (with 🔑 Admin for the admin) is built before the wait, so the admin can reach the view
ok("the chips row is drawn before the waiting line", FN.indexOf("<div class=\"envs-chips\">")>=0&&FN.indexOf("<div class=\"envs-chips\">")<FN.indexOf("Loading the class…"));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
