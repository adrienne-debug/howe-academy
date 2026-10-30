/*
 * Node tests — ↩ CPMOVEBACK, the teacher's "Move reviews back to Maya's sitting" (DESIGN_class_platform_2026-10-28.md §13 row 13),
 * built 2026-10-30 on Adrienne's "Yes, build it". The button sits in CPWATCH's ⚠ card and on the student page while a parent drills;
 * it writes {mode:"sitting", role:"teacher"|"admin"} (a hold the parent's switch respects); ↩ Let the parent choose again removes it.
 * Uses the world from test_env_site.js like test_cp_watch_fallback.js.  run: node test_cp_move_back.js
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
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), PDR=cut("// CPDRILLPARENT_START","// CPDRILLPARENT_END"), WAT=cut("// CPWATCH_START","// CPWATCH_END"), FB=cut("// CPWATCHFALLBACK_START","// CPWATCHFALLBACK_END"), MB=cut("// CPMOVEBACK_START","// CPMOVEBACK_END");
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
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+CAL+"\n"+PDX+"\n"+WX+"\n"+(o.fb===false?"":FX)+"\n"+(o.mb===false?"":MB+"\nG.mb={ _cpmb, cpmbOn, cpmbRec, cpmbHeld, cpdrMoveBackHtml, cpMoveBackStudentHtml, cpmbAsk, cpmbCancel, cpmbDo, cpmbRelease };")+"\n"+ENG+"\nG.envSum=envSummary;"},o.w||{})); w.P=w.G.pdr; w.C=w.G.cpw; w.F=w.G.cpwf||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", STU="ramirez_maya", JON="tran_jonah", P0=400, J=x=>JSON.stringify(x);
const text=h=>String(h).replace(/<[^>]*>/g,"");
const reviewW=w=>w._envs.writes.filter(x=>/^students\/[^/]+\/review$/.test(x.path));
async function switchOn(w){ w.envsDemoGo("parent"); if(w.P.cpdrLocked()){ w.el("cpdr-pin","0329"); w.P.cpdrUnlock(); } w.P.cpdrAsk(); await w.P.cpdrSet(true); w.G.pn=P0; w.renderAll(); }
const CALSCH={days:"school",off:{}};

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPMOVEBACK_START"), b=src.indexOf("// CPMOVEBACK_END"), e=src.indexOf("// CPWATCHFALLBACK_END");
  ok("CPMOVEBACK exactly once, right after CPWATCHFALLBACK_END", a>0&&b>a&&src.indexOf("// CPMOVEBACK_START",a+1)<0&&src.slice(e,a).trim()==="// CPWATCHFALLBACK_END");
  ok("the header names §13 row 13, her yes and the date", /§13 row 13/.test(MB)&&/"Yes, build it"/.test(MB)&&/2026-10-30/.test(MB));
  ok("CPWATCH's ⚠ card calls cpdrMoveBackHtml (typeof-guarded, tagged ↩ CPMOVEBACK)", /if\(typeof cpdrMoveBackHtml==="function"\)\{ try\{ h\+=cpdrMoveBackHtml\(sid\)\|\|""; \}catch\(e\)\{\} \}   \/\/ ↩ CPMOVEBACK/.test(fn("cpWatchStudentHtml")));
  ok("envcStudentHtml calls cpMoveBackStudentHtml right after the watch card (typeof-guarded, tagged)", /h\+=cpWatchStudentHtml\(sid\);[^\n]*\n  if\(typeof cpMoveBackStudentHtml==="function"\) h\+=cpMoveBackStudentHtml\(sid\);   \/\/ ↩ CPMOVEBACK/.test(fn("envcStudentHtml")));
  ok("the block only declares (nothing runs at boot) and writes only through envsWrite", MB.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |\})/.test(l))&&!/firebase\.|db\.ref/.test(MB)&&(MB.match(/envsWrite\(/g)||[]).length===2); }

console.log("\n── Jonah: the button inside the ⚠ card ──");
{ const w=demo("teacher"), j=w._envc.students[JON]; w.envcView("student",JON); const h0=w.G.content;
  ok("the ⚠ card has '↩ Move reviews back to Jonah’s sitting', next to Leave it", /⚠ Parent drill not run/.test(text(h0))&&/onclick="cpmbAsk\('tran_jonah'\)">↩ Move reviews back to Jonah’s sitting</.test(h0)&&/>Leave it</.test(h0));
  ok("…and only once on the page (the plain card steps aside while the ⚠ card shows)", (h0.match(/cpmbAsk\('tran_jonah'\)/g)||[]).length===1);
  w.G.mb.cpmbAsk(JON); const h1=text(w.G.content);
  ok("a tap asks first: what happens, Move them back / Cancel", /Move Jonah’s review cards back to Jonah’s own 🌿 sitting\?/.test(h1)&&/“🔒 Set by the teacher”/.test(h1)&&/↩ Move them back/.test(h1)&&/Cancel/.test(h1));
  w.G.mb.cpmbCancel(); ok("Cancel: back to the button, nothing written", !/Move them back/.test(text(w.G.content))&&reviewW(w).length===0);
  w.G.mb.cpmbAsk(JON); await w.G.mb.cpmbDo(JON); await w.flush();
  const rw=reviewW(w), v=(rw[0]||{}).val||{};
  ok("Move them back → ONE 'would set' of students/tran_jonah/review = {mode sitting, by, role teacher, at}", rw.length===1&&rw[0].op==="set"&&J(Object.keys(v))===J(["mode","by","role","at"])&&v.mode==="sitting"&&v.role==="teacher"&&typeof v.at==="number", rw);
  ok("…nothing really written (the demo)", w.G.writes.length===0);
  const h2=text(w.G.content);
  ok("his page: the ⚠ card is gone; '🔒 Jonah reviews every card in the 🌿 sitting · moved back by you on …' + Let the parent choose again", !/⚠ Parent drill not run/.test(h2)&&/🔒 Jonah reviews every card in the 🌿 sitting · moved back by you on \w{3} \w{3} \d+/.test(h2)&&/↩ Let the parent choose again/.test(h2), h2.slice(0,500));
  ok("…it is a hold (CPDRILLPARENT's own reading)", w.P.cpdrHeld(j.review));
  w.envcView("grid"); ok("📋 Class: no ⚠ 🧠 on Jonah", !/⚠ 🧠 drill/.test(w.G.content));
  w.envcView("student",JON); await w.G.mb.cpmbRelease(JON); await w.flush();
  const rw2=reviewW(w);
  ok("↩ Let the parent choose again → ONE 'would remove' of students/tran_jonah/review; the page shows neither card", rw2.length===2&&rw2[1].op==="remove"&&rw2[1].path==="students/"+JON+"/review"&&!("review" in j)&&!/Let the parent choose again|Move reviews back/.test(text(w.G.content))); }

console.log("\n── Maya: the plain card (no warning), and the parent's switch ──");
{ const w=demo("parent"); await switchOn(w); w.envsDemoGo("teacher"); w.envcView("student",STU); const h0=w.G.content;
  ok("no warning yet → '🧠 Maya’s parent drills the review cards …' with the button", !/⚠ Parent drill not run/.test(text(h0))&&/🧠 Maya’s parent drills the review cards/.test(text(h0))&&/cpmbAsk\('ramirez_maya'\)">↩ Move reviews back to Maya’s sitting</.test(h0), text(h0).slice(0,500));
  const n0=reviewW(w).length; w.G.mb.cpmbAsk(STU); await w.G.mb.cpmbDo(STU); await w.flush();
  ok("Move them back → one more 'would set', role teacher", reviewW(w).length===n0+1&&reviewW(w)[n0].val.role==="teacher");
  w.envsDemoGo("parent"); const hp=text(w.G.content);
  ok("Parent ▸ 🧠 card: '🔒 Set by the teacher: Maya reviews every card in the 🌿 sitting', no switch", /🔒 Set by the teacher: Maya reviews every card in the 🌿 sitting/.test(hp)&&w.P.cpdrHeld()&&w.P.cpdrMode(K)!=="parent", hp.slice(0,500));
  w.envsDemoGo("teacher"); w.envcView("student",STU); await w.G.mb.cpmbRelease(STU); await w.flush();
  w.envsDemoGo("parent"); const hp2=w.G.content;
  ok("…let the parent choose again → the switch is back (off), the parent can turn it on", !w.P.cpdrHeld()&&/role="switch" aria-checked="false"/.test(hp2)&&!/Set by the teacher/.test(text(hp2))); }

console.log("\n── who sees it ──");
{ const w=demo("kid"); w.renderAll();
  ok("the kid's and parent's pages never draw it (no console)", w.G.mb.cpdrMoveBackHtml(STU)===""&&w.G.mb.cpMoveBackStudentHtml(STU)===""&&!/Move reviews back/.test(w.G.content)); }
{ const w=demo("teacher"); w.envcView("student","morales_avery");
  ok("a student whose reviews are in the sitting (no record): nothing drawn", !/Move reviews back|Let the parent choose again/.test(w.G.content)); }
{ const w=demo("teacher"); w.envcView("student",JON); w.F.cpwfDemoAhead(JON); await w.flush(); await w.flush(); const h=text(w.G.content);
  ok("after the automatic move back (PR 17's fall-back): its note only — no button, no hold card", /Reviews moved back to Jonah’s sitting by themselves/.test(h)&&!/Move reviews back to Jonah|Let the parent choose again/.test(h)); }
{ const rules=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon/SITE_RULES.json"),"utf8")), R=rules.rules.students.$sid.review, V=R[".validate"];
  ok("SITE_RULES: the teacher (or an admin) may write the record and may remove it (no rule change was needed)", /classes\/'\+root\.child\('students\/'\+\$sid\+'\/class'\)\.val\(\)\+'\/teacher'\)\.val\(\) == auth\.uid/.test(R[".write"])&&/newData\.child\('role'\)\.val\(\) == 'teacher'/.test(V)&&/newData\.child\('role'\)\.val\(\) == 'admin'/.test(V)); }
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
