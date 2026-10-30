/*
 * Node tests — 🧠 CPWATCH, PR 17 of the class platform (DESIGN_class_platform_2026-10-28.md §7(a) 4–5, §9, §13 row 17, §14 Q24–Q26).
 * Her words 2026-10-28: "the mom, if she knows her kid and wants to hand it off to a parent drill … then she would need to run it daily. But
 * there needs to be a reminder that if she's pulling things in and it's not getting done, and a message or a warning sent to the teacher."
 *   · Where the block sits and how it hooks (typeof-guarded one-line hooks; Q24's fall-back is CPWATCHFALLBACK's, tested in test_cp_watch_fallback.js).
 *   · cpWatchCalc (pure): waiting, overdue, missed study days from mastery/history + the calendar, the flag, since.
 *   · The parent's 🧠 card and the kid's 🌿 page: the "waiting" line, amber after remindAfterDays, "the teacher has been told" after warn.
 *   · The teacher: ⚠ 🧠 on the grid + the student page card after warnAfterDays / warnAfterCards; Leave it (students/<sid>/reviewQuiet).
 *   · ⚙️ Class settings ▸ Parent drills: the three numbers; summary.review in envSummary; the rule in SITE_RULES.json.
 *   · Howe: Lincoln's summary and pages are untouched.
 * Uses the world from test_env_site.js through its `o.rev` line (CPREVIEW + CPDRILLPARENT + this block + the real engine).  run: node test_cp_watch.js
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
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), PDR=cut("// CPDRILLPARENT_START","// CPDRILLPARENT_END"), WAT=cut("// CPWATCH_START","// CPWATCH_END");
// 📅 CPPACE's calendar (pure): school days + the standard days off
const CAL=[constLine("CPP_CALS"),constLine("CPP_OFF_STD"),...["cppMs","cppStr","cppAdd","cppOk","cppOffStd","cppStudy","cppCal"].map(fn)].join("\n");
const ENG=[constLine("MAST_TIER_INT"),constLine("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","mastCustomDef"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return G.pn!=null?G.pn:400; } function mastPrintLogAppend(){}",
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──")].join("\n");
const PDX=PDR+"\nG.pdr={ _cpdr, cpdrMode, cpdrDue, cpdrInfo, cpdrAsk, cpdrSet, cpdrUnlock, cpdrLocked, cpdrStart, cpdrGrade, cpdrSave, cpdrCardHtml };";
const WX=WAT+"\nG.cpw={ _cpw, CPW_FIELDS, CPW_FIELDS_SET, cpwFields, cpwOn, cpwBetween, cpwStep, cpwRan, cpWatchCalc, cpwNum, cpwCal, cpwToday, cpwState, cpWatchSum, cpWatchDrilled, cpwAhead, cpWatchHtml, cpwTeacher, cpWatchGridChip, cpWatchStudentHtml, cpwQuiet, cpwUnquiet, cpWatchSectHtml, cpWatchDemoSeed };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+CAL+"\n"+PDX+"\n"+(o.cpw===false?"":WX)+"\n"+ENG+"\nG.envSum=envSummary;"},o.w||{})); w.P=w.G.pdr; w.C=w.G.cpw||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", STU="ramirez_maya", JON="tran_jonah", P0=400, J=x=>JSON.stringify(x);
const text=h=>String(h).replace(/<[^>]*>/g,"");
const lastW=w=>w._envs.writes[w._envs.writes.length-1];
async function switchOn(w){ w.envsDemoGo("parent"); if(w.P.cpdrLocked()){ w.el("cpdr-pin","0329"); w.P.cpdrUnlock(); } w.P.cpdrAsk(); await w.P.cpdrSet(true); w.G.pn=P0; w.renderAll(); }
const CALSCH={days:"school",off:{}};

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPWATCH_START"), b=src.indexOf("// CPWATCH_END"), e=src.indexOf("// CPDRILLPARENT_END");
  ok("CPWATCH exactly once, right after CPDRILLPARENT_END", a>0&&b>a&&src.indexOf("// CPWATCH_START",a+1)<0&&src.slice(e,a).trim()==="// CPDRILLPARENT_END");
  ok("the header names the design sections, PR 17, her words and the date", /§13 row 17/.test(WAT)&&/PR 17/.test(WAT)&&/there needs to be a reminder that if she's pulling things in and it's not getting\s*\/\/ done, and a message or a warning sent to the teacher/.test(WAT)&&/2026-10-28/.test(WAT));
  ok("the block only declares (its one load step is the guarded settings add)", WAT.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l))&&/^const CPW_FIELDS_SET=cpwFields\(\);$/m.test(WAT));
  const code=WAT.replace(/^\/\/.*$/mg,"");
  ok("no database ref in the block: the one write goes through envcWrite (→ envsWrite)", !/\.ref\(/.test(code)&&/envcWrite\("students\/"\+sid\+"\/reviewQuiet",rec,"set"\)/.test(fn("cpwQuiet"))&&/envcWrite\("students\/"\+sid\+"\/reviewQuiet",null,"remove"\)/.test(fn("cpwUnquiet")));
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code));
  ok("Q24 (yes, 2026-10-29): cpWatchFallBack is called through a typeof guard and defined only in CPWATCHFALLBACK (test_cp_watch_fallback.js); no fallBackAfterDays in this block", /typeof cpWatchFallBack==="function"/.test(code)&&WAT.indexOf("function cpWatchFallBack(")<0&&src.indexOf("function cpWatchFallBack(")>src.indexOf("// CPWATCHFALLBACK_START")&&!/fallBackAfterDays/.test(code)&&/Q24 → YES/.test(WAT));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🧠 CPWATCH/.test(l));
  ok("every tagged line outside the block is typeof-guarded", hooks.length>0&&hooks.every(l=>/typeof cpWatch\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  ok("envSummary: summary.review from cpWatchSum", /if\(typeof cpWatchSum==="function"\)\{ const rv=cpWatchSum\(kid,M,now\); if\(rv\) out\.review=rv; \}/.test(fn("envSummary")));
  ok("envsStudyHtml: the kid's line above the pile", /if\(typeof cpWatchHtml==="function"\) body=cpWatchHtml\("kid",kid\)\+body;/.test(fn("envsStudyHtml")));
  ok("envcGridHtml: the chip in the name cell; envcStudentHtml: the card before Stations (other one-line hooks may sit between: ↩ CPMOVEBACK 2026-10-30)", /cpWatchGridChip\(s\)/.test(fn("envcGridHtml"))&&/if\(typeof cpWatchStudentHtml==="function"\) h\+=cpWatchStudentHtml\(sid\);[^\n]*\n(?:  if\(typeof cp\w+==="function"\)[^\n]*\n){0,3}  h\+='<div class="envs-card"><div class="envs-h2">Stations/.test(fn("envcStudentHtml")));
  ok("envClsBodyHtml: the Parent drills card; envsDemoStart: Jonah's seed", /if\(typeof cpWatchSectHtml==="function"\) h\+=cpWatchSectHtml\(scope\);/.test(fn("envClsBodyHtml"))&&/cpWatchDemoSeed\(data\)/.test(fn("envsDemoStart")));
  ok("CPDRILLPARENT's own hooks (cpWatchHtml at the card's bottom, cpWatchDrilled after a save) are what this block fills", /cpWatchHtml\("parent",kid,cpdrInfo\(kid\)\)/.test(PDR)&&/cpWatchDrilled\(d\.kid,a\.hist\)/.test(PDR));
  ok("the class's calendar comes through one helper, with PR 22's cpCalOf first (typeof-guarded)", /typeof cpCalOf==="function"/.test(fn("cpwCal"))&&/cppCal\(cls\)/.test(fn("cpwCal"))); }

console.log("\n── the rule: students/<sid>/reviewQuiet ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), r=R.rules.students.$sid.reviewQuiet;
  ok("written by Adrienne or the class's teacher only", r&&/admins\/'\+auth\.uid\)\.val\(\) == true/.test(r[".write"])&&/\/teacher'\)\.val\(\) == auth\.uid/.test(r[".write"])&&!/familyId/.test(r[".write"]));
  ok("…shape {until: 8 digits, by: the writer}, nothing else", /hasChildren\(\['until','by'\]\)/.test(r[".validate"])&&/\[0-9\]\{8\}/.test(r.until[".validate"])&&r.by[".validate"]==="newData.val() == auth.uid"&&r.$other[".validate"]===false);
  ok("the _about line names it", /CPWATCH/.test(R._about)&&/reviewQuiet/.test(R._about)); }

console.log("\n── cpWatchCalc (pure) ──");
{ const w=W(), C=w.C;
  // 2026-10-28 is a Wednesday. School days: Mon–Fri.
  ok("study days strictly between: Fri 23 → Wed 28 = Mon, Tue (2); a weekend never counts", C.cpwBetween(CALSCH,"20261023","20261028")===2&&C.cpwBetween(CALSCH,"20261024","20261026")===0);
  ok("…a day off never counts", C.cpwBetween({days:"school",off:{"2026-10-26":true}},"20261023","20261028")===1);
  ok("cpwStep: 3 study days after Wed 28 = Mon Nov 2; 5 before = Wed 21", C.cpwStep(CALSCH,"20261028",3)==="20261102"&&C.cpwStep(CALSCH,"20261028",-5)==="20261021");
  ok("a drill counts as run when it graded everything it was given (or the limit)", C.cpwRan({total:8,scored:8})&&!C.cpwRan({total:8,scored:5})&&C.cpwRan({total:40,scored:15})&&!C.cpwRan({total:0,scored:0})&&!C.cpwRan(null));
  const due=n=>Array.from({length:n},()=>({next_due:P0-10})), base={cal:CALSCH,today:"20261028",pn:P0,remind:2,warn:3,cards:30};
  const took=Date.UTC(2026,9,19,18);   // Mon Oct 19
  let r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261023":{total:8,scored:8}},takenAt:took,due:due(8)}));
  ok("last run Fri 23 → missed Mon, Tue = 2 → 'remind'", J(r)===J({mode:"parent",lastDrill:"20261023",waiting:8,overdue:8,missed:2,flag:"remind",since:"20261023",asOf:"20261028"}), r);
  r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261023":{total:8,scored:8},"20261026":{total:6,scored:2}},takenAt:took,due:due(8)}));
  ok("a half-done drill on Mon doesn't count as run", r.lastDrill==="20261023"&&r.missed===2, r);
  r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261021":{total:8,scored:8}},takenAt:took,due:due(8)}));
  ok("last run Wed 21 → Thu, Fri, Mon, Tue = 4 → 'warn'", r.missed===4&&r.flag==="warn", r);
  r=C.cpWatchCalc(Object.assign({},base,{hist:{},takenAt:Date.UTC(2026,9,26,20),due:due(8)}));
  ok("never drilled: counted from the day the parent took over (Mon 26 → Tue = 1, no flag)", r.lastDrill===null&&r.since==="20261026"&&r.missed===1&&r.flag===null, r);
  r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261028":{total:5,scored:5}},takenAt:took,due:due(3)}));
  ok("drilled today → missed 0 (today is never missed yet)", r.missed===0&&r.flag===null&&r.lastDrill==="20261028");
  r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261015":{total:5,scored:5}},takenAt:took,due:[]}));
  ok("nothing waiting → missed 0, no flag (no cards = nothing to miss)", r.waiting===0&&r.missed===0&&r.flag===null);
  r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261015":{total:5,scored:5}},takenAt:took,due:[{next_due:P0-1},{next_due:P0}]}));
  ok("missed is never more than the oldest card has waited (1 school day) — a card newly due isn't a week of misses", r.missed===1&&r.overdue===1&&r.flag===null, r);
  r=C.cpWatchCalc(Object.assign({},base,{hist:{"20261027":{total:5,scored:5}},takenAt:took,due:due(31)}));
  ok("31 overdue → 'warn' on the cards, even with 0 missed days; warnAfterCards 0 = days only", r.missed===0&&r.flag==="warn"&&C.cpWatchCalc(Object.assign({},base,{cards:0,hist:{"20261027":{total:5,scored:5}},takenAt:took,due:due(31)})).flag===null); }

console.log("\n── the parent and the kid (demo Maya) ──");
{ const w=demo("parent");
  ok("switch off → no watch at all: no line, summary.review absent", w.C.cpwState(K)===null&&w.C.cpWatchHtml("parent",K)===""&&!("review" in w.G.envSum(K))&&!/waiting for your drill/.test(w.G.content));
  await switchOn(w); const n=w.P.cpdrDue(K,P0).length, st=w.C.cpwState(K);
  ok("switched on today: "+n+" waiting, missed 0, no flag", n>0&&st.waiting===n&&st.missed===0&&st.flag===null&&st.since===st.asOf, st);
  ok("Parent ▸ 🧠 card: '"+n+" review cards waiting for your drill with Maya.' + the demo's next-day button", new RegExp("🧠 "+n+" review cards waiting for your drill with Maya\\.").test(text(w.G.content))&&/onclick="cpwAhead\(\)"/.test(w.G.content));
  w.envsDemoGo("kid");
  ok("Kid ▸ 🌿: '"+n+" review cards are waiting for your drill with Mom or Dad.' above the pile; no demo button", new RegExp("🧠 "+n+" review cards are waiting for your drill with Mom or Dad\\.").test(text(w.G.content))&&w.G.content.indexOf("waiting for your drill")<w.G.content.indexOf("fake-study")&&!/cpwAhead/.test(w.G.content));
  ok("summary.review rides in the summary", J(w.G.envSum(K).review)===J(st));
  w.envsDemoGo("parent"); w.C.cpwAhead(); ok("1 study day on: missed 1, still the plain line", w.C.cpwState(K).missed===1&&w.C.cpwState(K).flag===null);
  w.C.cpwAhead(); const h=text(w.G.content), s2=w.C.cpwState(K);
  ok("2 study days on (remindAfterDays 2): amber — 'Maya’s review drill hasn’t run yet (taken over Wed) · N cards waiting. Maya’s teacher sees this after 3 study days.'", s2.missed===2&&s2.flag==="remind"&&new RegExp("Maya’s review drill hasn’t run yet \\(taken over Wed\\) · "+n+" cards waiting\\. Maya’s teacher sees this after 3 study days\\.").test(h)&&/#fffbeb/.test(w.G.content), h.slice(0,600));
  w.envsDemoGo("kid"); ok("…the kid's line is amber too: 'Your review drill hasn’t run yet …'", /Your review drill hasn’t run yet \(taken over Wed\) · \d+ review cards are waiting for your drill with Mom or Dad\./.test(text(w.G.content))&&/#fffbeb/.test(w.G.content));
  w.envsDemoGo("teacher"); ok("…the teacher sees nothing yet for Maya", !/⚠ 🧠 drill/.test((w.G.content.split("Maya R.")[1]||"").split("</td>")[0]));
  w.envsDemoGo("parent"); w.C.cpwAhead();
  ok("3 study days on (warnAfterDays 3): 'Maya’s teacher has been told.'", w.C.cpwState(K).flag==="warn"&&/Maya’s teacher has been told\./.test(text(w.G.content)));
  w.envsDemoGo("teacher"); ok("…and Teacher ▸ 📋 Class shows ⚠ 🧠 on Maya's row (the demo's own kid is live)", /⚠ 🧠 drill/.test((w.G.content.split("Maya R.")[1]||"").split("</td>")[0]));
  ok("the parent's and kid's lines use the name, never a pronoun", !/\b(her|his|she|he|their)\b/i.test(text(w.C.cpWatchHtml("parent",K)+w.C.cpWatchHtml("kid",K))));
  // the parent drills: the reminder goes, the clock comes back
  w.envsDemoGo("parent"); w.P.cpdrStart(); const d=w.P._cpdr.drill; d.ids.forEach(()=>w.P.cpdrGrade("c")); w.P.cpdrSave();
  const s3=w.C.cpwState(K);
  ok("a drill saved: lastDrill today, nothing waiting, no line; the demo clock is back to today", w.C._cpw.ahead===0&&s3.lastDrill===s3.asOf&&s3.waiting===0&&s3.flag===null&&!/waiting for your drill/.test(text(w.G.content)), s3); }

console.log("\n── the teacher: Jonah ──");
{ const w=demo("teacher"), j=w._envc.students[JON];
  ok("the demo seed: Jonah's parent took over, last drill 5 study days ago, 37 waiting", j.review.mode==="parent"&&j.summary.review.waiting===37&&j.summary.review.missed===4&&j.summary.review.flag==="warn");
  const row=(w.G.content.split("Jonah T.")[1]||"").split("</td>")[0];
  ok("📋 Class: ⚠ 🧠 on Jonah's row, its title the full line", /⚠ 🧠 drill/.test(row)&&/title="Parent drill not run for 4 study days · 37 waiting · since /.test(row), row.slice(0,300));
  ok("…and on nobody else's", (w.G.content.match(/⚠ 🧠 drill/g)||[]).length===1);
  w.envcView("student",JON); const h=text(w.G.content);
  ok("his page: '⚠ Parent drill not run for 4 study days · 37 waiting · since <day>' + Leave it, before Stations", /⚠ Parent drill not run for 4 study days · 37 waiting · since \w{3} \w{3} \d+/.test(h)&&/onclick="cpwQuiet\('tran_jonah'\)">Leave it</.test(w.G.content)&&w.G.content.indexOf("Parent drill not run")<w.G.content.indexOf(">Stations<"));
  ok("…saying what it means and where the numbers are", /Jonah’s parent took the review cards over/.test(h)&&/37 of them are overdue/.test(h)&&/⚙️ Class settings ▸ Parent drills/.test(h));
  const n0=w._envs.writes.length; w.C.cpwQuiet(JON); await w.flush(); const q=lastW(w), until=w.C.cpwStep(w.C.cpwCal(JON),w.C.cpwToday(JON),3);
  ok("Leave it → ONE 'would write': set students/tran_jonah/reviewQuiet {until: 3 study days on, by: the teacher}", w._envs.writes.length===n0+1&&J(q)===J({op:"set",path:"students/"+JON+"/reviewQuiet",val:{until,by:"uid_teacher_demo"}})&&w.G.writes.length===0, q);
  ok("…the card now reads 'Left for now until …' with Undo; the grid chip is gone", /🧠 Left for now<\/b> until /.test(w.G.content)&&/cpwUnquiet\('tran_jonah'\)/.test(w.G.content)&&(w.envcView("grid"),!/⚠ 🧠 drill/.test(w.G.content)));
  w.C._cpw.ahead=4; w.renderAll(); ok("after the quiet days pass and the drill still hasn't run, the ⚠ is back", /⚠ 🧠 drill/.test(w.G.content)&&w.C.cpwTeacher(Object.assign({sid:JON},j)).missed===4+5); w.C._cpw.ahead=0;   // today and the 4 study days after it
  w.C.cpwUnquiet(JON); await w.flush(); ok("Undo → remove students/tran_jonah/reviewQuiet", J(lastW(w))===J({op:"remove",path:"students/"+JON+"/reviewQuiet",val:null})&&!j.reviewQuiet);
  j.review={mode:"sitting",by:"uid_teacher_demo",role:"teacher",at:1}; w.renderAll();
  ok("moved back to the sitting (a teacher's record) → no ⚠ even with an old summary", w.C.cpwTeacher(Object.assign({sid:JON},j))===null&&!/⚠ 🧠 drill/.test(w.G.content)); }
{ const w=demo("teacher"), j=w._envc.students[JON], s=()=>w.C.cpwTeacher(Object.assign({sid:JON},j));
  j.summary.review=Object.assign({},j.summary.review,{missed:1,overdue:2,asOf:w.C.cpwStep(w.C.cpwCal(JON),w.C.cpwToday(JON),-2)});
  ok("a summary worked out 2 study days ago: the console adds those days (1 + 2 = 3 → ⚠)", s().missed===3&&s().show);
  w._envc.cls.settings={study:{warnAfterDays:5}}; ok("⚙️ Tell the teacher after 5 → no ⚠ at 3", s().missed===3&&!s().warn&&w.C.cpwNum("warnAfterDays",JON)===5);
  j.summary.review.overdue=40; ok("…but 40 overdue (≥ 30) still brings it", s().warn);
  w._envc.cls.settings.study.warnAfterCards=0; ok("…and with 0 (days only) it doesn't", !s().warn);
  w._envc.cls.settings.study.warnAfterDays=999; ok("an out-of-range value falls back to the default (3)", w.C.cpwNum("warnAfterDays",JON)===3&&s().warn); }

console.log("\n── ⚙️ Class settings ▸ Parent drills ──");
{ const w=demo("teacher"); w.envcView("classset"); const h=w.G.content;
  ok("the three rows were added from this block (by name, once; the literal untouched)", w.C.CPW_FIELDS_SET===true&&["remindAfterDays","warnAfterDays","warnAfterCards"].every(n=>w.ENVCS_FIELDS.filter(f=>f.name===n).length===1)&&w.ENVCS_SECTS.filter(x=>x[0]==="pdrill").length===1&&w.C.cpwFields()&&w.ENVCS_FIELDS.filter(f=>f.name==="warnAfterDays").length===1&&src.slice(src.indexOf("const ENVCS_FIELDS=["),src.indexOf("// ENVCLASSSET_END")).indexOf("remindAfterDays")<0);
  ok("Class settings shows the Parent drills card with its numbers and defaults (2 · 3 · 30)", /Parent drills/.test(h)&&/Remind the parent after/.test(h)&&/Tell the teacher after/.test(h)&&/…or once this many cards are overdue/.test(h)&&/now: <b>2<\/b> \(default\)/.test(h)&&/now: <b>30<\/b> \(default\)/.test(h));
  w.envClsSave("class","remindAfterDays","4"); await w.flush();
  ok("changing one: one targeted update at classes/<cid>/settings/study through envsWrite", J(lastW(w))===J({op:"update",path:"classes/ms-science-2026/settings/study",val:{remindAfterDays:4}})&&w._envc.cls.settings.study.remindAfterDays===4);
  ok("…and the kid's side reads it (the demo's layers)", (w.envsDemoGo("kid"), w.C.cpwNum("remindAfterDays",STU)===4));
  w.envsDemoGo("teacher"); w._envcs.locks={warnAfterDays:true}; w.envcView("classset");
  ok("Adrienne's 🔒 on one: greyed for the teacher, 'set by Adrienne', the save refused", /🔒 set by Adrienne/.test(w.G.content)&&w.envClsSave("class","warnAfterDays","5")===false);
  w.envcView("student",JON); w._envcs.stuOpen=JON; w.renderAll();
  ok("not on a student's own settings (the numbers are the class's)", w.C.cpWatchSectHtml(JON)===""&&!/Remind the parent after/.test(w.G.content)); }

console.log("\n── live: summary.review from a parent login ──");
{ const w=W(); w._envs.role="parent"; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.familyId="fam"; w._envs.uid="uid_p"; w.G.pn=P0;
  w.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:["D"],handOffAt:"bi_weekly"}};
  w.masteryData.k=[{id:"b",subject:"D",prompt:"Humus",status:"active",tier:"bi_weekly",cycle:1,consecutive_correct:0,next_due:P0-6},{id:"c",subject:"D",prompt:"Silt",status:"active",tier:"monthly",cycle:1,consecutive_correct:0,next_due:P0-6}];
  w.masteryData.history={k:{"20261021":{total:2,scored:2}}};
  w.P._cpdr.revs.fam_k={mode:"parent",by:"uid_p",role:"parent",at:Date.UTC(2026,9,12,18)};
  const r=w.G.envSum("k",{u:{decks:[{key:"D"}]}}).review;
  ok("the summary carries {mode, lastDrill, waiting 2, overdue 2, missed 4, flag warn, since, asOf}", J(r)===J({mode:"parent",lastDrill:"20261021",waiting:2,overdue:2,missed:4,flag:"warn",since:"20261021",asOf:"20261028"}), r);
  ok("…nothing written by working it out", w.G.writes.length===0&&w._envs.writes.length===0);
  ok("a summary built from other data (ctx.M) gets none", !("review" in w.G.envSum("k",{M:{k:[]},u:{decks:[{key:"D"}]}}))); }

console.log("\n── Howe: Lincoln is not touched ──");
{ const H={familyId:"howe",roster:[]}, A=W({w:{fam:H}}), B=W({cpw:false,w:{fam:H}});
  [A,B].forEach(w=>{ w.unitStudies.nc_envirothon={id:"nc_envirothon",enrolled:{lincoln:true},decks:[{key:"Forestry · Terms",cards:[]}]};
    w.masteryData.lincoln=[{id:"L1",subject:"Forestry · Terms",prompt:"Snag",status:"active",tier:"bi_weekly",next_due:1}]; w.masteryData.history={lincoln:{"20261020":{total:3,scored:3}}};
    w._envs.kid="lincoln"; w._envs.role="parent"; w._envs.sid="howe_lincoln"; w.P._cpdr.revs.howe_lincoln={mode:"parent",by:"x",role:"parent",at:1}; });
  ok("the site is off; no state, no summary.review, no lines, no chip", !A.envSiteOn()&&A.C.cpwState("lincoln")===null&&A.C.cpWatchSum("lincoln",A.masteryData,A.G.now)===null&&A.C.cpWatchHtml("parent","lincoln")===""&&A.C.cpWatchHtml("kid","lincoln")===""&&A.C.cpWatchStudentHtml("howe_lincoln")==="");
  const sa=A.G.envSum("lincoln"), sb=B.G.envSum("lincoln"); delete sa.at; delete sb.at;
  ok("his mirrored summary is byte-for-byte the same with the block as without", J(sa)===J(sb)&&!("review" in sa));
  ok("nothing read or written", A.G.writes.length===0&&A.G.reads.length===0&&A.G.listeners.length===0&&A._envs.writes.length===0); }

console.log("\n── the demo page (make_demo.js) carries it ──");
{ const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")), h=buildDemo(src,"test",LIB.tests);
  ok("the built demo holds the block and its hooks", h.indexOf("// CPWATCH_START")>0&&/cpWatchDemoSeed\(data\)/.test(h)&&/cpWatchGridChip\(s\)/.test(h)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
