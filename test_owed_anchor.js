/*
 * 🧾 Owed count after a rebuild (her ask 2026-09-23: "rebuilt lincoln and confused why there is still an owed —
 * a rebuild should make no carry over"). Live: a 9:27 AM Rebuild all (before the 10:00 school start) anchored every
 * subject on YESTERDAY (cbPlanTodayISO) → planOwed counted Tuesday's slot → "owed 1" on 9 subjects. And paused
 * subjects showed a growing owed chip (Dictation 4, Wordsmith 4, Written Expression 2, Ellis Singapore 3B 2).
 *   run:  node test_owed_anchor.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const grab=name=>{ const a=src.indexOf("function "+name+"("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
// planOwed with the real pattern engine; the calendar / override lookups stubbed to "a normal week".
const env=`
  var currData, TODAY="2026-09-23";
  function cbTodayISO(){ return TODAY; }
  function planBacked(){ return true; } function lnOf(){ return null; }
  function cbDefaultForm(kid,sk){ return {mode:"timesPerWeek",tpw:"5",allowedDays:["Mon","Tue","Wed","Thu","Fri"]}; }
  function smapIsKidOff(){ return false; } function schedOvKidOff(){ return false; } function schedOv(){ return {}; } function coopBlocksBase(){ return false; }
  function _cbParseDate(s){ return new Date(s+"T12:00:00"); }
  function lidDoneIdx(kid,sk){ return new Set(Object.keys(((currData.done||{})[kid]||{})[sk]||{})); }
`;
const mk=new Function(env+grab("_cbSpread")+"\n"+grab("_pjWeekKey")+"\n"+grab("_pjPatternRows")+"\n"+grab("planOwed")+"\nreturn {planOwed, set:(c,t)=>{ currData=c; if(t) TODAY=t; }};");
const E=mk();
const lessons={}; ["2026-09-21","2026-09-22","2026-09-23","2026-09-24","2026-09-25"].forEach((d,i)=>{ lessons[60+i]={date:d}; });
const subj=(x)=>Object.assign({planAnchor:"2026-09-23",lessonSeq:["a","b","c","d","e","f","g","h"],pacing:{mode:"timesPerWeek"}},x||{});
E.set({subjects:{lincoln:{sk:subj()}},lessons:{lincoln:lessons},done:{lincoln:{sk:{}}}});
ok("anchored TODAY → nothing owed the same day",E.planOwed("lincoln","sk")===0);
E.set({subjects:{lincoln:{sk:subj({planAnchor:"2026-09-22"})}},lessons:{lincoln:lessons},done:{lincoln:{sk:{}}}});
ok("anchored YESTERDAY (the old before-school rebuild) → owed 1 — the bug",E.planOwed("lincoln","sk")===1);
E.set({subjects:{lincoln:{sk:subj({planAnchor:"2026-09-12",paused:true})}},lessons:{lincoln:lessons},done:{lincoln:{sk:{}}}});
ok("a PAUSED subject owes nothing, however old its anchor",E.planOwed("lincoln","sk")===0);
E.set({subjects:{lincoln:{sk:subj({planAnchor:"2026-09-21"})}},lessons:{lincoln:lessons},done:{lincoln:{sk:{}}}});
ok("an unpaused subject behind since Monday still shows its real owed (2)",E.planOwed("lincoln","sk")===2);
ok("the rebuild (cbApply) anchors on cbTodayISO(), never cbPlanTodayISO()",/up\["subjects\/"\+kid\+"\/"\+sk\+"\/planAnchor"\]=cbTodayISO\(\); \}/.test(src)&&!/planAnchor"\]=\(typeof cbPlanTodayISO/.test(src));
ok("the laying itself still uses the before-school day (cbFutureRows / planMaterialize untouched)",/function cbFutureRows[\s\S]{0,200}cbPlanTodayISO/.test(src)&&/const capMin=cbDayCap\(kid\); const today=\(typeof cbPlanTodayISO=='function'\)\?cbPlanTodayISO\(\)/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
