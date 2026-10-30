/*
 * Node tests — 🧠 CPWATCHFALLBACK, the automatic fall-back of the parent's review drill (DESIGN_class_platform_2026-10-28.md §7(a) 5,
 * §13 row 17, "Adrienne's answers, 2026-10-29": Q24 → yes). Her answer 2026-10-29: "q24 yes".
 *   · Where the block sits and how it hooks (right after CPWATCH_END; typeof-guarded lines inside CPWATCH).
 *   · ⚙️ Class settings ▸ Parent drills: fallBackAfterDays (3; 0 = never), lockable like the other three.
 *   · cpwfCalc (pure): the study days unrun past the teacher's warning, Leave it's pause.
 *   · The demo: Maya (the real hook, 6 study days) and Jonah (the teacher's page), the notes, exactly once, Leave it pauses it.
 *   · Live: the kid's / parent's own app reads reviewQuiet once and makes ONE set of students/<sid>/review {role:"auto", auto:true, …}.
 *   · SITE_RULES.json: a family login may write role "auto" only while the record is the parent's, with from == its at.
 *   · Howe: Lincoln is not touched.
 * Uses the world from test_env_site.js through its `o.rev` line, like test_cp_watch.js.  run: node test_cp_watch_fallback.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), PDR=cut("// CPDRILLPARENT_START","// CPDRILLPARENT_END"), WAT=cut("// CPWATCH_START","// CPWATCH_END"), FB=cut("// CPWATCHFALLBACK_START","// CPWATCHFALLBACK_END");
const CAL=[constLine("CPP_CALS"),constLine("CPP_OFF_STD"),...["cppMs","cppStr","cppAdd","cppOk","cppOffStd","cppStudy","cppCal"].map(fn)].join("\n");
const ENG=[constLine("MAST_TIER_INT"),constLine("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","mastCustomDef"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return G.pn!=null?G.pn:400; } function mastPrintLogAppend(){}",
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──")].join("\n");
const PDX=PDR+"\nG.pdr={ _cpdr, cpdrMode, cpdrDue, cpdrInfo, cpdrAsk, cpdrSet, cpdrUnlock, cpdrLocked, cpdrStart, cpdrGrade, cpdrSave, cpdrCardHtml, cpdrHeld, cpdrRecOf };";
const WX=WAT+"\nG.cpw={ _cpw, CPW_FIELDS, cpwNum, cpwCal, cpwToday, cpwStep, cpwBetween, cpwState, cpWatchSum, cpwAhead, cpWatchHtml, cpwTeacher, cpWatchStudentHtml, cpwQuiet, cpwUnquiet };";
const FX=FB+"\nG.cpwf={ _cpwf, CPWF_FIELD, CPWF_FIELDS_SET, cpwfFields, cpwfCalc, cpwfIsAuto, cpwfMoveBack, cpWatchFallBack, cpwfNoteHtml, cpwfSoonHtml, cpwfStudentHtml, cpwfDemoAhead };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+CAL+"\n"+PDX+"\n"+WX+"\n"+(o.fb===false?"":FX)+"\n"+ENG+"\nG.envSum=envSummary;"},o.w||{})); w.P=w.G.pdr; w.C=w.G.cpw; w.F=w.G.cpwf||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", STU="ramirez_maya", JON="tran_jonah", P0=400, J=x=>JSON.stringify(x);
const text=h=>String(h).replace(/<[^>]*>/g,"");
const reviewW=w=>w._envs.writes.filter(x=>/^students\/[^/]+\/review$/.test(x.path));
async function switchOn(w){ w.envsDemoGo("parent"); if(w.P.cpdrLocked()){ w.el("cpdr-pin","0329"); w.P.cpdrUnlock(); } w.P.cpdrAsk(); await w.P.cpdrSet(true); w.G.pn=P0; w.renderAll(); }
const CALSCH={days:"school",off:{}};

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPWATCHFALLBACK_START"), b=src.indexOf("// CPWATCHFALLBACK_END"), e=src.indexOf("// CPWATCH_END");
  ok("CPWATCHFALLBACK exactly once, right after CPWATCH_END", a>0&&b>a&&src.indexOf("// CPWATCHFALLBACK_START",a+1)<0&&src.slice(e,a).trim()==="// CPWATCH_END");
  ok("the header names the design sections, Q24, her answer and the date", /§13 row 17/.test(FB)&&/Q24 → yes/.test(FB)&&/"q24 yes"/.test(FB)&&/2026-10-29/.test(FB));
  ok("the block only declares (its one load step is the guarded settings add)", FB.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l))&&/^const CPWF_FIELDS_SET=cpwfFields\(\);$/m.test(FB));
  const code=FB.replace(/^\/\/.*$/mg,"");
  ok("the one write goes through envsWrite (students/<sid>/review, a set); the one database ref is the reviewQuiet read", /envsWrite\("students\/"\+sid\+"\/review",rec,"set"\)/.test(fn("cpwfMoveBack"))&&(code.match(/\.ref\(/g)||[]).length===1&&/ref\("students\/"\+sid\+"\/reviewQuiet"\)\.once\("value"\)/.test(fn("cpwfQuietOf"))&&!/\.(set|update|remove|transaction)\(/.test(code.replace(/envsWrite\([^)]*\)/g,"")));
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code));
  ok("cpWatchFallBack is defined here (CPWATCH only calls it, typeof-guarded)", /^function cpWatchFallBack\(kid,st\)\{/m.test(FB)&&WAT.indexOf("function cpWatchFallBack(")<0&&/if\(typeof cpWatchFallBack==="function"\)\{ try\{ cpWatchFallBack\(kid,st\); \}catch\(e\)\{\} \}/.test(fn("cpWatchSum")));
  const hooks=WAT.split("\n").filter(l=>/cpwf[A-Z]\w*\(/.test(l));
  ok("CPWATCH's lines that call this block are all typeof-guarded (5: the parent's note, the parent's line, the student page note, the card's line ×2)", hooks.length===5&&hooks.every(l=>(l.match(/cpwf[A-Z]\w*\(/g)||[]).every(c=>new RegExp("typeof "+c.slice(0,-1)+'==="function"').test(l))), hooks.map(l=>l.trim().slice(0,100)));
  ok("…and CPWATCH's header says Q24 is yes and where it lives", /Q24 → YES \(her answer 2026-10-29\)/.test(WAT)&&/CPWATCHFALLBACK/.test(WAT));
  ok("no 🔀 anywhere in the block", FB.indexOf("\u{1F500}")<0); }

console.log("\n── the rule: students/$sid/review, role auto ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), r=R.rules.students.$sid.review, W_=r[".write"], V=r[".validate"];
  const fam="$sid.beginsWith(root.child('logins/'+auth.uid+'/familyId').val() + '_')";
  ok("write: any login of the student's family, role auto, only while the record is the parent's and from == its at", W_.indexOf("|| ("+fam+" && newData.child('role').val() == 'auto' && data.child('mode').val() == 'parent' && newData.child('from').val() == data.child('at').val()))")>0);
  ok("…the parent's, the teacher's and Adrienne's branches are still there (a teacher's or admin's sitting holds against the parent)", /admins\/'\+auth\.uid\)\.val\(\) == true/.test(W_)&&/\/teacher'\)\.val\(\) == auth\.uid/.test(W_)&&/role'\)\.val\(\) == 'parent' && !\(data\.child\('mode'\)\.val\(\) == 'sitting' && \(data\.child\('role'\)\.val\(\) == 'teacher' \|\| data\.child\('role'\)\.val\(\) == 'admin'\)\)/.test(W_));
  ok("validate: role auto = auto true, mode sitting, over a parent record, from == its at, a family login, days/after numbers, on 8 digits", V.indexOf("(newData.child('role').val() == 'auto' && newData.child('auto').val() == true && newData.child('mode').val() == 'sitting' && data.child('mode').val() == 'parent' && newData.child('from').val() == data.child('at').val() && "+fam+" && newData.child('days').isNumber() && newData.child('after').isNumber() && newData.child('on').isString() && newData.child('on').val().matches(/^[0-9]{8}$/))")>0&&/newData\.child\('by'\)\.val\(\) == auth\.uid/.test(V));
  // balanced parentheses (a broken rule would not deploy)
  const bal=s=>{ let d=0; for(const ch of s.replace(/'[^']*'/g,"''").replace(/\/\^[^/]*\$\//g,"")){ if(ch==="(") d++; else if(ch===")"){ d--; if(d<0) return false; } } return d===0; };
  ok("…both rules' parentheses balance", bal(W_)&&bal(V));
  ok("the _about line names it", /CPWATCHFALLBACK/.test(R._about)&&/role:'auto'/.test(R._about)&&/exactly once/.test(R._about)); }

console.log("\n── ⚙️ Class settings ▸ Parent drills: fallBackAfterDays ──");
{ const w=demo("teacher"); w.envcView("classset"); const h=w.G.content;
  ok("the fourth row, added from this block (by name, once; CPWATCH's and ENVCLASSSET's literals untouched)", w.F.CPWF_FIELDS_SET===true&&w.ENVCS_FIELDS.filter(f=>f.name==="fallBackAfterDays").length===1&&w.C.CPW_FIELDS.filter(f=>f.name==="fallBackAfterDays").length===1&&w.F.cpwfFields()&&w.ENVCS_FIELDS.filter(f=>f.name==="fallBackAfterDays").length===1&&WAT.replace(/^\/\/.*$/mg,"").indexOf("fallBackAfterDays")<0&&src.slice(src.indexOf("const ENVCS_FIELDS=["),src.indexOf("// ENVCLASSSET_END")).indexOf("fallBackAfterDays")<0);
  const f=w.F.CPWF_FIELD; ok("its shape: study, pdrill, int 0–30, default 3, 0 = never", f.part==="study"&&f.sect==="pdrill"&&f.kind==="int"&&f.min===0&&f.max===30&&f.def===3&&f.zero==="never");
  ok("Class settings shows it in the Parent drills card, after the other three, default 3", /Move the reviews back to the sitting after/.test(h)&&h.indexOf("Move the reviews back to the sitting after")>h.indexOf("…or once this many cards are overdue")&&w.C.cpwNum("fallBackAfterDays",JON)===3);
  w.envClsSave("class","fallBackAfterDays","5"); await w.flush();
  ok("changing it: one targeted update at classes/<cid>/settings/study through envsWrite", J(w._envs.writes[w._envs.writes.length-1])===J({op:"update",path:"classes/ms-science-2026/settings/study",val:{fallBackAfterDays:5}})&&w.C.cpwNum("fallBackAfterDays",JON)===5);
  w._envc.cls.settings.study.fallBackAfterDays=0; ok("0 (never) is a real value", w.C.cpwNum("fallBackAfterDays",JON)===0);
  w._envc.cls.settings.study.fallBackAfterDays=99; ok("out of range → the default (3)", w.C.cpwNum("fallBackAfterDays",JON)===3);
  w._envcs.locks={fallBackAfterDays:true}; w.envcView("classset");
  ok("Adrienne's 🔒 on it: 'set by Adrienne' for the teacher, the save refused", /🔒 set by Adrienne/.test(w.G.content)&&w.envClsSave("class","fallBackAfterDays","4")===false); }

console.log("\n── cpwfCalc (pure) ──");
{ const w=W(), F=w.F, c=o=>F.cpwfCalc(Object.assign({warn:3,fb:3,waiting:10,cal:CALSCH,today:"20261028"},o));
  ok("missed 5 (warned at 3): 2 past the warning, 1 left, not yet", J(c({missed:5}))===J({after:2,left:1,due:false}));
  ok("missed 6 = 3 + 3 → due", J(c({missed:6}))===J({after:3,left:0,due:true}));
  ok("missed 2 (no warning yet): nothing counts", J(c({missed:2}))===J({after:0,left:null,due:false}));
  ok("nothing waiting → never due", !c({missed:9,waiting:0}).due);
  ok("fallBackAfterDays 0 (never) → never due", !c({missed:30,fb:0}).due&&c({missed:30,fb:0}).left===null);
  ok("Leave it until today (or later): paused, 0 counted", J(c({missed:9,quiet:{until:"20261028"}}))===J({after:0,left:3,due:false})&&c({missed:9,quiet:{until:"20261102"}}).after===0);
  ok("Leave it ended Fri Oct 23: only Mon 26, Tue 27 count after it (2 of 6) → not yet", J(c({missed:9,quiet:{until:"20261023"}}))===J({after:2,left:1,due:false}));
  ok("…ended Tue Oct 20: Wed–Fri, Mon, Tue = 5 study days after it, but never more than past the warning (6 − 3 = 3) → due", J(c({missed:6,quiet:{until:"20261020"}}))===J({after:3,left:0,due:true}));
  ok("cpwfIsAuto: only {mode sitting, role auto, auto true}", F.cpwfIsAuto({mode:"sitting",role:"auto",auto:true})&&!F.cpwfIsAuto({mode:"sitting",role:"teacher"})&&!F.cpwfIsAuto({mode:"parent",role:"auto",auto:true})&&!F.cpwfIsAuto(null)); }

console.log("\n── the demo: Maya (the real hook, in her own app) ──");
{ const w=demo("parent"); await switchOn(w); const took=w.P.cpdrRecOf(STU).at, n0=reviewW(w).length;
  for(let i=0;i<5;i++){ w.C.cpwAhead(); await w.flush(); }
  const s5=w.C.cpwState(K), h5=text(w.G.content);
  ok("5 study days on: warned, still the parent's, nothing written", s5.missed===5&&s5.flag==="warn"&&w.P.cpdrMode(K)==="parent"&&reviewW(w).length===n0, s5);
  ok("…the parent's amber line says what comes next", /Maya’s teacher has been told\. If it still isn’t run, the reviews go back to Maya’s 🌿 sitting by themselves\./.test(h5), h5.slice(0,400));
  const day6=w.C.cpwStep(w.C.cpwCal(STU),w.C.cpwToday(STU),1); w.C.cpwAhead(); await w.flush(); const rw=reviewW(w), rec=rw[rw.length-1];
  ok("6 study days on (3 + 3): ONE 'would set' of students/ramirez_maya/review", rw.length===n0+1&&rec.op==="set"&&rec.path==="students/"+STU+"/review", rw);
  const v=rec.val, today=day6;
  ok("…{mode sitting, by the demo's parent, role auto, auto true, at, from (the take-over's at), days 6, after 3, on (the demo's day)}", J(Object.keys(v))===J(["mode","by","role","auto","at","from","days","after","on"])&&v.mode==="sitting"&&v.by==="uid_p_maya"&&v.role==="auto"&&v.auto===true&&typeof v.at==="number"&&v.from===took&&v.days===6&&v.after===3&&v.on===today, v);
  ok("…nothing really written (the demo)", w.G.writes.length===0);
  ok("…the demo's clock is back to today (the record keeps its own day)", w.C._cpw.ahead===0);
  const h=text(w.G.content);
  ok("Parent ▸ 🧠 card: 'Reviews moved back to Maya’s sitting because the drill wasn’t run for 6 study days. Turn your drill back on any time.'", /🌿 Reviews moved back to Maya’s sitting because the drill wasn’t run for 6 study days\. Turn your drill back on any time\./.test(h), h.slice(0,600));
  ok("…the switch reads off and can be turned on again (an auto record doesn't hold)", w.P.cpdrMode(K)===null&&!w.P.cpdrHeld()&&/aria-checked="false"/.test(w.G.content)&&!/Set by the teacher/.test(h)&&!/waiting for your drill/.test(h));
  ok("…no summary.review any more (the watch is off)", !("review" in w.G.envSum(K)));
  w.C.cpwAhead(); await w.flush(); w.renderAll(); await w.flush();
  ok("exactly once: another study day and more renders write nothing more", reviewW(w).length===n0+1);
  w.envsDemoGo("kid"); const hk=text(w.G.content);
  ok("Kid ▸ 🌿: no line about it (the design gives the kid none), no 'waiting' line", !/moved back/i.test(hk)&&!/waiting for your drill/.test(hk));
  w.envsDemoGo("teacher"); w.envcView("student",STU); const ht=text(w.G.content);
  ok("Teacher ▸ Maya's page: '🌿 Reviews moved back to Maya’s sitting by themselves on <day>' (the demo's own kid, live), no ⚠", /🌿 Reviews moved back to Maya’s sitting by themselves on \w{3} \w{3} \d+/.test(ht)&&/wasn’t run for 6 study days \(3 after you were told\)/.test(ht)&&!/⚠ Parent drill not run/.test(ht), ht.slice(0,500));
  w.envsDemoGo("parent"); w.P.cpdrAsk(); await w.P.cpdrSet(true); w.renderAll();
  const S=()=>({mode:w.P.cpdrMode(K),rec:w.P.cpdrRecOf(STU),st:w.C.cpwState(K)});
  ok("the parent turns the drill back on: a parent record again, the note is gone, the count starts again from the new take-over (1 demo day on: no flag)", w.P.cpdrMode(K)==="parent"&&w.P.cpdrRecOf(STU).role==="parent"&&!/Reviews moved back/.test(text(w.G.content))&&w.C.cpwState(K).since==="20261028"&&w.C.cpwState(K).flag===null, S()); }
{ const w=demo("parent"); await switchOn(w); w.F.cpwfDemoAhead(STU); await w.flush();
  ok("the console's demo button on the demo's own kid moves the clock and runs the same hook", w.C._cpw.ahead===1&&reviewW(w).length===1); }

console.log("\n── the demo: Jonah (the teacher's page) ──");
{ const w=demo("teacher"), j=w._envc.students[JON], took=j.review.at; w.envcView("student",JON); const h0=text(w.G.content);
  ok("his ⚠ card says when the reviews go back: after 2 more study days (warned at 3, 4 missed)", /If the drill still isn’t run, Jonah’s reviews go back to Jonah’s own sitting by themselves after 2 more study days\. Leave it holds that too\./.test(h0), h0.slice(0,700));
  ok("…with the demo's next-day button", /onclick="cpwfDemoAhead\('tran_jonah'\)">🧪 Demo: next study day, no drill</.test(w.G.content));
  const n0=reviewW(w).length; w.F.cpwfDemoAhead(JON); await w.flush();
  const rw=reviewW(w), v=(rw[rw.length-1]||{}).val||{};
  ok("one tap (today and the next study day pass: 6 missed) → ONE 'would set' of students/tran_jonah/review, automatic", rw.length===n0+1&&rw[rw.length-1].path==="students/"+JON+"/review"&&v.role==="auto"&&v.auto===true&&v.mode==="sitting"&&v.from===took&&v.days===6&&v.after===3&&v.by==="uid_k_jonah"&&v.on>w.C.cpwToday(JON), v);
  const h=text(w.G.content);
  ok("his page: '🌿 Reviews moved back to Jonah’s sitting by themselves on <day>' + what it means; the ⚠ card is gone", /🌿 Reviews moved back to Jonah’s sitting by themselves on \w{3} \w{3} \d+/.test(h)&&/The parent’s drill wasn’t run for 6 study days \(3 after you were told\)\. Jonah’s own sitting reviews every card now\. The parent can turn the drill back on any time\./.test(h)&&!/⚠ Parent drill not run/.test(h), h.slice(0,700));
  ok("…the day is the demo's day (the record's on)", new RegExp("by themselves on "+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(Date.UTC(+v.on.slice(0,4),+v.on.slice(4,6)-1,+v.on.slice(6))).getUTCDay()]).test(h));
  w.envcView("grid"); ok("📋 Class: no ⚠ 🧠 on Jonah any more", !/⚠ 🧠 drill/.test(w.G.content));
  w.F.cpwfDemoAhead(JON); await w.flush(); ok("exactly once: another tap writes nothing more", reviewW(w).length===n0+1); }
{ const w=demo("teacher"), j=w._envc.students[JON];
  w.C.cpwQuiet(JON); await w.flush(); w.envcView("student",JON);
  ok("Leave it → the Left-for-now card says the move back waits too", /🧠 Left for now<\/b> until /.test(w.G.content)&&/The automatic move back to Jonah’s sitting waits too: 3 study days without the drill after \w{3} \w{3} \d+\./.test(text(w.G.content)), text(w.G.content).slice(0,600));
  const n0=reviewW(w).length; for(let i=0;i<5;i++){ w.F.cpwfDemoAhead(JON); await w.flush(); }
  ok("Leave it pauses it: 5 taps (well past 6 missed) and the reviews are still the parent's", reviewW(w).length===n0&&j.review.mode==="parent"&&w.C.cpwTeacher(Object.assign({sid:JON},j)).missed>6);
  w.F.cpwfDemoAhead(JON); await w.flush();
  ok("…3 study days without the drill after Leave it ended → moved back (once)", reviewW(w).length===n0+1&&w.F.cpwfIsAuto(j.review)&&j.review.after===3); }
{ const w=demo("teacher"), j=w._envc.students[JON]; w.C.cpwQuiet(JON); await w.flush(); w.C.cpwUnquiet(JON); await w.flush();
  const n0=reviewW(w).length; w.F.cpwfDemoAhead(JON); await w.flush();
  ok("Leave it, then ↩ Undo: the fall-back is back on schedule (one tap)", reviewW(w).length===n0+1&&w.F.cpwfIsAuto(j.review)); }
{ const w=demo("teacher"), j=w._envc.students[JON]; w._envc.cls.settings={study:{fallBackAfterDays:0}}; w.envcView("student",JON);
  ok("fallBackAfterDays 0: the card says the reviews stay with the parent", /The reviews stay with the parent until someone moves them back/.test(text(w.G.content)));
  for(let i=0;i<4;i++){ w.F.cpwfDemoAhead(JON); await w.flush(); }
  ok("…and nothing moves", reviewW(w).length===0&&j.review.mode==="parent"); }
{ const w=demo("teacher"), j=w._envc.students[JON]; j.review={mode:"sitting",by:"uid_teacher_demo",role:"teacher",at:1}; w.envcView("student",JON);
  ok("a teacher's own move back is not called automatic (no note, no write)", !/by themselves/.test(text(w.G.content))&&(w.F.cpwfDemoAhead(JON),reviewW(w).length===0)); }

console.log("\n── live: the student's own app (parent and kid logins) ──");
function live(role,o){ o=o||{}; const w=W({w:{remote:o.remote||{}}}); w._envs.role=role; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.familyId="fam"; w._envs.uid=role==="kid"?"uid_k":"uid_p"; w.G.pn=P0;
  w.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:["D"],handOffAt:"bi_weekly"}};
  w.masteryData.k=[{id:"b",subject:"D",prompt:"Humus",status:"active",tier:"bi_weekly",cycle:1,consecutive_correct:0,next_due:P0-8},{id:"c",subject:"D",prompt:"Silt",status:"active",tier:"monthly",cycle:1,consecutive_correct:0,next_due:P0-8}];
  w.masteryData.history={k:{[o.last||"20261016"]:{total:2,scored:2}}};
  w.P._cpdr.revs.fam_k={mode:"parent",by:"uid_p",role:"parent",at:Date.UTC(2026,9,12,18)};
  if(o.study){ w._envcs.loaded=true; w._envcs.kcls={study:o.study}; w._envcs.kstu={}; }
  return w; }
const U={u:{decks:[{key:"D"}]}};
{ const w=live("parent"); const r=w.G.envSum("k",U).review; await w.flush();
  const wr=w.G.writes.filter(x=>x[1]==="students/fam_k/review");
  ok("last drill Fri Oct 16 → 7 study days missed by Wed Oct 28 (warned at 3, 4 past it) → due", r&&r.missed===7&&r.flag==="warn", r);
  ok("…reads students/fam_k/reviewQuiet once, then ONE set of students/fam_k/review", w.G.reads.filter(p=>p==="students/fam_k/reviewQuiet").length===1&&wr.length===1&&wr[0][0]==="set"&&w.G.writes.length===1, w.G.writes);
  const v=wr[0]&&wr[0][2]; ok("…{mode sitting, by the writer (uid_p), role auto, auto true, at, from = the parent record's at, days 7, after 4, on 20261028}", v&&v.mode==="sitting"&&v.by==="uid_p"&&v.role==="auto"&&v.auto===true&&typeof v.at==="number"&&v.from===Date.UTC(2026,9,12,18)&&v.days===7&&v.after===4&&v.on==="20261028", v);
  ok("…on this device at once: the reviews are back in the sitting", w.P.cpdrMode("k")===null&&w.F.cpwfIsAuto(w.P.cpdrRecOf("fam_k")));
  w.G.envSum("k",U); w.G.envSum("k",U); await w.flush();
  ok("exactly once: more summaries write nothing more, read nothing more", w.G.writes.length===1&&w.G.reads.filter(p=>p==="students/fam_k/reviewQuiet").length===1); }
{ const w=live("kid"); w.G.envSum("k",U); await w.flush(); const wr=w.G.writes.filter(x=>x[1]==="students/fam_k/review");
  ok("the kid's login does it too (the kid's app is the one opened every study day): by = the kid's uid", wr.length===1&&wr[0][2].by==="uid_k"&&wr[0][2].role==="auto"); }
{ const w=live("parent",{last:"20261021"}); w.G.envSum("k",U); await w.flush();
  ok("4 missed (warned, 1 past it): nothing read, nothing written", w.G.reads.indexOf("students/fam_k/reviewQuiet")<0&&w.G.writes.length===0); }
{ const w=live("parent",{remote:{"students/fam_k/reviewQuiet":{until:"20261030",by:"uid_t"}}}); w.G.envSum("k",U); await w.flush();
  ok("the teacher's Leave it stands (until Fri Oct 30): read once, nothing written, still the parent's", w.G.reads.filter(p=>p==="students/fam_k/reviewQuiet").length===1&&w.G.writes.length===0&&w.P.cpdrMode("k")==="parent"); }
{ const w=live("parent",{study:{fallBackAfterDays:0}}); w.G.envSum("k",U); await w.flush();
  ok("fallBackAfterDays 0 (never): nothing read, nothing written", w.C.cpwNum("fallBackAfterDays","fam_k")===0&&w.G.reads.length===0&&w.G.writes.length===0); }
{ const w=live("parent",{study:{fallBackAfterDays:5}}); w.G.envSum("k",U); await w.flush();
  ok("fallBackAfterDays 5 (4 past the warning): not yet", w.G.writes.length===0); }
{ const w=live("parent"); const rec=w.P._cpdr.revs.fam_k; w.F.cpWatchFallBack("k",w.C.cpwState("k")); w.P._cpdr.revs.fam_k=Object.assign({},rec,{at:rec.at+1}); await w.flush();
  ok("the record changed while reviewQuiet was being read (the parent turned it on again): nothing written", w.G.writes.length===0); }
{ const w=live("parent"); w.P._cpdr.revs.fam_k={mode:"sitting",by:"uid_t",role:"teacher",at:5}; w.G.envSum("k",U); await w.flush();
  ok("a teacher's hold: no watch, nothing written", w.G.writes.length===0&&w.F.cpWatchFallBack("k",{mode:"parent",missed:9,waiting:2})===false); }

console.log("\n── Howe: Lincoln is not touched ──");
{ const H={familyId:"howe",roster:[]}, A=W({w:{fam:H}}), B=W({fb:false,w:{fam:H}});
  [A,B].forEach(w=>{ w.unitStudies.nc_envirothon={id:"nc_envirothon",enrolled:{lincoln:true},decks:[{key:"Forestry · Terms",cards:[]}]};
    w.masteryData.lincoln=[{id:"L1",subject:"Forestry · Terms",prompt:"Snag",status:"active",tier:"bi_weekly",next_due:1}]; w.masteryData.history={lincoln:{"20261001":{total:3,scored:3}}};
    w._envs.kid="lincoln"; w._envs.role="parent"; w._envs.sid="howe_lincoln"; w.P._cpdr.revs.howe_lincoln={mode:"parent",by:"x",role:"parent",at:1}; });
  ok("the site is off: no fall-back, no notes", !A.envSiteOn()&&A.F.cpWatchFallBack("lincoln",{mode:"parent",missed:30,waiting:5,asOf:"20261028"})===false&&A.F.cpwfNoteHtml("parent","lincoln")===""&&A.C.cpWatchStudentHtml("howe_lincoln")==="");
  const sa=A.G.envSum("lincoln"), sb=B.G.envSum("lincoln"); await A.flush(); delete sa.at; delete sb.at;
  ok("his mirrored summary is byte-for-byte the same with the block as without; nothing read or written", J(sa)===J(sb)&&A.G.writes.length===0&&A.G.reads.length===0&&A.G.listeners.length===0&&A._envs.writes.length===0); }

console.log("\n── the demo page (make_demo.js) carries it ──");
{ const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")), h=buildDemo(src,"test",LIB.tests);
  ok("the built demo holds the block and CPWATCH's hooks into it", h.indexOf("// CPWATCHFALLBACK_START")>0&&h.indexOf("function cpWatchFallBack(")>0&&/typeof cpwfStudentHtml==="function"/.test(h)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
