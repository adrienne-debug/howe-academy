// CPRULESGUARD + CPHOWEMETA (2026-11-09): an admin or teacher has no logins row, so a rule that concatenates logins/<uid>/familyId
// FIRST errors and denies the whole read (seen live: admin read of students/<sid> → PERMISSION_DENIED while classes read fine).
const fs=require("fs"), assert=require("assert");
const src=require("./test_src.js")(__dirname+"/index.html");
const D=JSON.parse(fs.readFileSync(__dirname+"/envirothon/SITE_RULES.json","utf8")), R=D.rules, S=R.students.$sid;
const ADMIN="root.child('admins/'+auth.uid).val() == true";
const FAM="$sid.beginsWith(root.child('logins/'+auth.uid+'/familyId').val() + '_')";
const G="(root.child('logins/'+auth.uid+'/familyId').exists() && "+FAM+")";
let n=0; const ok=(c,m)=>{ assert(c,m); n++; };
const all=[]; (function walk(o,p){ Object.keys(o).forEach(k=>{ const v=o[k]; if(typeof v==="string"){ if(v.indexOf(FAM)>=0) all.push([p+" "+k,v]); } else if(v&&typeof v==="object") walk(v,p+"/"+k); }); })(R,"");
ok(all.length===13&&all.reduce((a,[,v])=>a+v.split(FAM).length-1,0)===14,"thirteen rules carry the family clause, fourteen occurrences (review write has two; CPSIBLINGS added students/$sid/logins/kid + kidAt)");
all.forEach(([where,v])=>{ ok(v.split(FAM).length-1===v.split(G).length-1,"every family clause is guarded by .exists(): "+where); ok(v.indexOf("(root.child('logins/'+auth.uid+'/familyId').exists() && (root.child")<0,"…and only once: "+where); });
["summary","weeks","drillPick"].forEach(k=>ok(S[k][".write"]==="auth != null && ("+ADMIN+" || "+G+")",k+": admin first, then the guarded family"));
ok(S[".read"].indexOf(ADMIN)<S[".read"].indexOf(FAM)&&S[".read"].indexOf("(data.child('class').exists() && root.child('classes/'+data.child('class').val()")>0,"students read: admin first, teacher clause guarded on class");
ok(S.meta[".write"].indexOf(ADMIN)<S.meta[".write"].indexOf(FAM)&&S.meta[".write"].indexOf("newData.parent().child('class').exists() && root.child('classes/'+newData.parent().child('class').val()+'/teacher').val() == auth.uid")>0,"meta: admin first + the same-update class clause (teacher's + Student writes meta and class together)");
ok(S.app[".write"].indexOf("newData.parent().child('class')")>0,"app keeps its same-update class clause");
["review","calendar"].forEach(k=>ok(S[k][".write"].indexOf("(root.child('students/'+$sid+'/class').exists() && root.child('classes/'+root.child('students/'+$sid+'/class').val()+'/teacher')")>=0,k+": teacher-of-student clause guarded"));
ok(R.scores.$cid.$sid[".read"]==="auth != null && "+G&&R.drills.$cid.$sid[".read"]==="auth != null && "+G,"scores/drills per-student reads: guarded, family only (unchanged scope)");
ok(/CPRULESGUARD/.test(D._about),"_about notes it");
// balanced parentheses everywhere
all.forEach(([where,v])=>ok((v.match(/\(/g)||[]).length===(v.match(/\)/g)||[]).length,"balanced: "+where));
// the console's Howe-at-home add writes a whole meta record
const m=src.match(/function envcAddHowe\(\)\{[\s\S]*?\n\}/); ok(m,"envcAddHowe found");
ok(m[0].indexOf('"/meta/name"')<0&&/\["students\/"\+sid\+"\/meta"\]:\{familyId:fid,kid,name:\(name\|\|kid\)\.slice\(0,40\),at:Date\.now\(\)\}/.test(m[0]),"Howe add writes meta = {familyId, kid, name, at} (never meta/name alone)");
ok(/\["students\/"\+sid\+"\/class"\]:_envc\.cid/.test(m[0])&&/\["students\/"\+sid\+"\/app"\]:"howe"/.test(m[0])&&/\["classes\/"\+_envc\.cid\+"\/students\/"\+sid\]:true/.test(m[0]),"…alongside class, app howe and the class membership");
console.log("test_cp_rules_guard: "+n+" ok");
