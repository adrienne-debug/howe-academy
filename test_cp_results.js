/*
 * Node tests — 📊 CPRESULTS, PR 12 of the class platform (DESIGN_class_platform_2026-10-28.md §6.4, §6.3, §6.4.1, §9, §12, §13 row 12,
 * §14 Q11 / Q12 / Q18; her words 2026-10-28: "it definitely needs to tell her what is the most missed questions and also include him, and
 * that way she can come up with review things for class").
 *   · where the block sits and how it is hooked (four typeof-guarded lines, tagged 📊 CPRESULTS); it writes nothing;
 *   · the pure parts: picks, the version-1 map, the key by version (Q11), cpItemAnalysis on fake summaries;
 *   · the summary: a site student's `ans`; LINCOLN through the mirror (his Envirothon check-in and final answers only, through the
 *     version-1 map); Howe without the mirror config byte-identical;
 *   · the Lincoln REPLAY: his mixed records (other subjects too) published with and without the block — the same single update, the
 *     only difference being the answers; nothing written into Howe; his records untouched;
 *   · 📝 Tests ▸ 📊 Class results (demo, 8 sample students): folded, one open at each level, most missed first, who missed it, the
 *     "% right" mark, Go to the question, an edit keeps earlier answers apart; the student page's 📝 Answers; the parent sees none;
 *   · Howe / no edition: every hook says no.                                                       run: node test_cp_results.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const CPT=cut("// CPTESTS_START","// CPTESTS_END"), CPR=cut("// CPRESULTS_START","// CPRESULTS_END");
const API="_cpr, CPR_LOW, cprOn, cprPick, cprRight, cprLetter, cprAnsOf, cprSumOn, cprSumAns, cprKey, cpItemAnalysis, cprForms, cprSummaries, cprAll, cprMostMissed, cprTwin, cprDemoSeed, cprDemoAns, cprTap, cprGo, cprTestsHtml, cprResultsHtml, cprRowMark, cprStudentHtml";
const REV=o=>(o.cpt===false?"":CPT+"\nG.cpt={ _cpct, cpctModel, cpctTap, cpctEditOpen, cpctIn, cpctSave, cpctListHtml, cpctHtml };")+(o.cpr===false?"":"\n"+CPR+"\nG.cpr={ "+API+" };")+"\nG.env={ envSummary, envmPublishAll, envmKids };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o)},o.w||{})); w.R=w.G.cpr||null; w.T=w.G.cpt||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const tests=(LIB.tests), base=(s,f)=>tests[s][f];
const qids=(s,f)=>base(s,f).items.map(it=>f+"-"+it.n);
const clone=x=>JSON.parse(JSON.stringify(x));

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPRESULTS_START"), b=src.indexOf("// CPRESULTS_END");
  ok("one CPRESULTS block, immediately after CPTESTS_END", a>0&&b>a&&src.indexOf("// CPRESULTS_START",a+1)<0&&src.slice(src.indexOf("// CPTESTS_END"),a).trim()==="// CPTESTS_END");
  const head=CPR.slice(0,1200);
  ok("her Q18 words, the date, §6.4, §13 row 12, Q18 and PR 12 in the header", /most missed questions and also include him/.test(head)&&/2026-10-28/.test(head)&&/§6\.4/.test(head)&&/§13 row 12/.test(head)&&/Q18/.test(head)&&/PR 12/.test(head));
  ok("the block only declares (nothing runs at boot)", CPR.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/\bcpr[A-Z]\w*\(/.test(l));
  const want=[["cprSumAns","function envSummary(kid,ctx){"],["cprStudentHtml","function envcStudentHtml(sid){"],["cprTestsHtml","function cpctHtml(){"],["cprRowMark","function cpctRowHtml(F,it,crumb){"]];
  ok("four hook lines outside the block, each typeof-guarded and tagged 📊 CPRESULTS", hooks.length===want.length&&hooks.every(l=>/typeof cpr\w+==="function"/.test(l)&&/📊 CPRESULTS/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  ok("…each inside the function it belongs to (the summary, the student page, 📝 Tests, a question row)", want.every(([fn,host])=>{ const i=src.indexOf(host), j=src.indexOf("\n}",i); return i>0&&src.slice(i,j).indexOf("typeof "+fn+"===\"function\"")>0; }));
  ok("the student page's line comes after the whole final card statement (not inside its map)", /\/\/ 📝 CPFINAL: the class's share \(cpFinalOpensText\)\n  if\(typeof cprStudentHtml==="function"\) h\+=cprStudentHtml\(sid\);/.test(src));
  ok("the row mark comes after the row's detail, the results fold before cpctHtml's sticky bar", /  if\(open\) h\+=cpctDetailHtml\(F,it\);\n  if\(typeof cprRowMark==="function"\) h=cprRowMark\(h,F,it\);/.test(src)&&/  if\(typeof cprTestsHtml==="function"\) h=cprTestsHtml\(h\);[^\n]*\n  if\(typeof requestAnimationFrame==="function"\) requestAnimationFrame\(cpctStick\);/.test(src));
  ok("the summary hook sits right after the tests are read, before the other PRs' summary lines", /if\(Object\.keys\(tests\)\.length\) out\.tests=tests; \}\n  if\(typeof cprSumAns==="function"\) cprSumAns\(kid,out,M\);/.test(src));
  const code=CPR.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing: no ref, set, update, remove, envsWrite, envcWrite or listener", !/\.ref\(|\.set\(|\.update\(|\.remove\(|envsWrite|envcWrite|envcMulti|\bdb\b|\.on\(/.test(code));
  ok("no Howe kid name as a code literal; no 🔀; no hard-coded 'Station' or 'Check-in' in the strings", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPR)&&src.indexOf("\u{1F500}")<0&&!/["'][^"'\n]*\b(Stations?|Check-in)\b/.test(code)); }

console.log("\n── the pure parts ──");
{ const w=W(), R=w.R;
  ok("a pick: an index, -1, or a sorted list (Firebase objects read the same); anything else is dropped", R.cprPick(2)===2&&R.cprPick(-1)===-1&&JSON.stringify(R.cprPick([3,0,1]))==="[0,1,3]"&&JSON.stringify(R.cprPick({0:2,1:0}))==="[0,2]"&&R.cprPick("B")===null&&R.cprPick(1.5)===null&&R.cprPick(-2)===null&&R.cprPick([])===null);
  ok("right = the keyed choice, or exactly the keyed set", R.cprRight(1,1)&&!R.cprRight(2,1)&&R.cprRight([0,2],[0,2])&&!R.cprRight([0],[0,2])&&R.cprRight([0,2],{0:0,1:2})&&!R.cprRight(-1,0));
  ok("letters: B, ACD, – for no answer", R.cprLetter(1)==="B"&&R.cprLetter([0,2,3])==="ACD"&&R.cprLetter(-1)==="–");
  const B=base("forestry","pre");
  const pos=B.items.map((it,i)=>Array.isArray(it.ans)?it.ans:(i%2?it.ans:(it.ans+1)%it.choices.length));
  const v1=R.cprAnsOf({form:B.form,n:B.items.length,answers:pos},B,"pre");
  ok("the version-1 map: positional answers → the unit's question ids, when the record is that very form", !!v1&&JSON.stringify(Object.keys(v1))===JSON.stringify(qids("forestry","pre"))&&v1["pre-2"]===pos[1]);
  ok("…not when the form name or the number of questions differs", R.cprAnsOf({form:"another",n:B.items.length,answers:pos},B,"pre")===null&&R.cprAnsOf({form:B.form,n:3,answers:pos.slice(0,3)},B,"pre")===null&&R.cprAnsOf({answers:[]},B,"pre")===null);
  ok("an attempt's own ans is kept as it is, cleaned (bad ids and picks dropped)", JSON.stringify(R.cprAnsOf({ans:{"pre-1":[3,0],"c-abc":1,"bad id":2,"pre-2":"x"}},B,"pre"))==='{"pre-1":[0,3],"c-abc":1}');
  const it={id:"pre-3",ans:2,edited:true,ts:500,baseAns:1};
  ok("the key by version (Q11): her wording from her change on; the unit's key on the unit's form before it; unknown on an earlier class wording", JSON.stringify(R.cprKey(it,600))==='{"ans":2,"cur":true}'&&JSON.stringify(R.cprKey(it,0))==='{"ans":1,"cur":false}'&&JSON.stringify(R.cprKey(it,300))==='{"ans":null,"cur":false}'&&R.cprKey({id:"c-x",added:true,ts:500,ans:0},400)===null&&R.cprKey({id:"pre-1",ans:0},0).cur===true);
  // cpItemAnalysis on invented summaries
  const form={sk:"s",w:"pre",items:[{id:"pre-1",n:1,q:"one",choices:["a","b","c","d"],ans:0,cards:["d#o1"]},{id:"pre-2",n:2,q:"two",choices:["a","b","c"],ans:[0,2]},{id:"pre-3",n:3,q:"three",choices:["a","b","c","d"],ans:3,edited:true,ts:100,baseAns:2}]};
  const sm=(sid,name,pre)=>({sid,name,summary:{tests:{s:{pre}}}});
  const S=[sm("a","Ann",{right:3,n:3,ans:{"pre-1":0,"pre-2":[0,2],"pre-3":3},formVer:200}),sm("b","Ben",{right:0,n:3,ans:{"pre-1":2,"pre-2":[0],"pre-3":1},formVer:200}),sm("c","Cal",{right:1,n:3,ans:{"pre-1":2,"pre-2":-1,"pre-3":2},formVer:0}),sm("d","Dee",{right:2,n:3}),{sid:"e",name:"Eve",summary:{}}];
  const A=R.cpItemAnalysis(S,form), r=id=>A.rows.find(x=>x.id===id);
  ok("the form: 3 took it with answers, 1 before answers were kept, the one with none isn't counted", A.took===3&&A.before===1);
  ok("…most missed first: Q1 (1 of 3), Q2 (1 of 3, one with no answer), then Q3 (1 of 2 on her wording)", JSON.stringify(A.rows.map(x=>[x.id,x.right,x.took,x.pct]))==='[["pre-1",1,3,33],["pre-2",1,3,33],["pre-3",1,2,50]]', A.rows.map(x=>[x.id,x.right,x.took,x.pct]));
  ok("a row: picks per choice, the most-picked wrong choice, who missed it with their pick, the card links", JSON.stringify(r("pre-1").picks)==="[1,0,2,0]"&&JSON.stringify(r("pre-1").top)==='{"i":2,"n":2}'&&JSON.stringify(r("pre-1").wrong.map(x=>[x.name,x.pick]))==='[["Ben",2],["Cal",2]]'&&JSON.stringify(r("pre-1").cards)==='["d#o1"]');
  ok("select all: picks count each choice; no answer is counted apart", JSON.stringify(r("pre-2").picks)==="[2,0,1]"&&r("pre-2").none===1&&r("pre-2").multi===true);
  ok("an answer to the unit's wording before her edit is kept apart, scored on the unit's key", JSON.stringify(r("pre-3").old)==='{"n":1,"known":1,"right":1}'&&r("pre-3").took===2);
  ok("low = half or more missed it", r("pre-1").low&&r("pre-3").low&&A.low===3&&R.CPR_LOW===50);
  ok("the final is read from post.last", R.cpItemAnalysis([{sid:"x",summary:{tests:{s:{post:{best:{right:1,n:1},last:{right:1,n:1,ans:{"post-1":0}}}}}}}],{sk:"s",w:"post",items:[{id:"post-1",q:"q",choices:["a","b"],ans:0}]}).rows[0].right===1);
  const p={same:false,items:[{id:"pre-1",q:"What is DBH?"}]}, q={same:false,items:[{id:"post-9",q:"what is dbh"}]};
  ok("the same question on the other form: the same wording, or pre-<n> ↔ post-<n> on a same-form final", R.cprTwin(p,p.items[0],q).id==="post-9"&&R.cprTwin({shared:true},{id:"pre-4",q:"x"},{same:true,items:[{id:"post-4",q:"y"}]}).id==="post-4"&&R.cprTwin(p,{id:"pre-2",q:"nope"},q)===null); }

console.log("\n── the summary: a site student ──");
{ const w=W(), now=w.G.now, ans={}; qids("forestry","pre").forEach((id,i)=>{ ans[id]=i%3?0:1; }); ans["c-k1"]=2;
  const M={maya_tests:{forestry:{pre:{form:"x",n:16,right:7,ans,formVer:1234,answers:[0]},post:{t100:{right:3,n:14,date:"2026-10-01",ans:{"post-1":1},formVer:0},t200:{right:9,n:14,date:"2026-10-20",ans:{"post-1":2,"post-2":[0,1]},formVer:1500},best:{right:9,n:14,date:"2026-10-20"}}}}};
  const s=w.G.env.envSummary("maya",{M,u:{decks:[]},now});
  ok("pre gains ans (as the attempt kept it) and formVer", JSON.stringify(s.tests.forestry.pre.ans)===JSON.stringify(ans)&&s.tests.forestry.pre.formVer===1234&&s.tests.forestry.pre.right===7);
  ok("post gains last = the NEWEST final attempt, with its answers; best stays", JSON.stringify(s.tests.forestry.post.last)==='{"right":9,"n":14,"date":"2026-10-20","ans":{"post-1":2,"post-2":[0,1]},"formVer":1500}'&&s.tests.forestry.post.best.right===9); }

console.log("\n── LINCOLN through his mirror, and Howe without it ──");
const lincolnM=()=>{ const P=base("soils","pre"), Q=base("soils","post");
  return { lincoln:[{id:"l1",subject:"Soils and Land Use · Terms",prompt:"Loam",tier:"weekly",status:"active"},{id:"m1",subject:"Math · Facts",prompt:"7 × 8",answer:"56",tier:"daily",status:"active"},{id:"h1",subject:"History · Terms",prompt:"Magna Carta",tier:"weekly",status:"active"}],
    lincoln_tests:{soils:{pre:{form:P.form,date:"2026-10-02",n:P.items.length,right:8,secs:600,ts:1,answers:P.items.map((it,i)=>Array.isArray(it.ans)?it.ans:(i%4?it.ans:-1))},post:{t5:{form:Q.form,date:"2026-10-25",n:Q.items.length,right:12,secs:700,ts:5,answers:Q.items.map(it=>it.ans)},best:{form:Q.form,date:"2026-10-25",n:Q.items.length,right:12}},graduated:{date:"2026-10-25",right:12,n:Q.items.length}},
      mathquiz:{pre:{form:"Math 3",n:2,right:1,answers:[1,2]}}},
    lincoln_settings:{cat_hold:{}}, studyLog:{lincoln:{math:{"20261020":{items:[{deck:"Math · Facts",name:"7 × 8",result:"m"}]}}}}, history:{lincoln:{"20261021":{items:[{id:"m1",result:"m"}]}}} }; };
const HOWE={familyId:"howe",roster:[]}, MCFG={firebase:{apiKey:"k",databaseURL:"https://x-default-rtdb.firebaseio.com",projectId:"x",appId:"1"},classId:"ms-science-2026"};
const unitL=()=>({nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",cardsInCode:false,enrolled:{lincoln:true},decks:[{key:"Soils and Land Use · Terms",station:"soils",n:1,cards:[{name:"Loam",def:"x",group:"Soil Properties"}]}]}});
const WL=(cfg,cpr)=>W({cpr,w:{fam:Object.assign({},HOWE,cfg?{envirothon:cfg}:{}),masteryData:lincolnM(),unitStudies:unitL()}});
{ const w=WL(MCFG), M=w.masteryData, before=clone(M), s=w.G.env.envSummary("lincoln",{M,u:w.unitStudies.nc_envirothon,now:w.G.now});
  ok("his mirror is on (the config is there and he is a mirrored kid)", w.R.cprSumOn("lincoln")===true&&w.R.cprSumOn("ellis")===false&&w.R.cprOn()===false);
  ok("his check-in answers, read through the version-1 map: every question id of the unit's form, formVer 0", JSON.stringify(Object.keys(s.tests.soils.pre.ans))===JSON.stringify(qids("soils","pre"))&&s.tests.soils.pre.ans["pre-1"]===-1&&s.tests.soils.pre.formVer===0);
  ok("his final: post.last with the newest attempt's answers by id", s.tests.soils.post.last.right===12&&JSON.stringify(Object.keys(s.tests.soils.post.last.ans))===JSON.stringify(qids("soils","post"))&&s.tests.soils.post.last.formVer===0);
  const vals=JSON.stringify([s.tests.soils.pre.ans,s.tests.soils.post.last.ans]);
  ok("ONLY his Envirothon forms get answers (a record that is not the unit's form gets none), no other subject, numbers only", !("ans" in s.tests.mathquiz.pre)&&!/Math|History|Magna|7 × 8/.test(JSON.stringify(s.tests))&&!/[a-z]"\s*:\s*"/.test(vals.replace(/"(pre|post)-\d+"/g,"0")), Object.keys(s.tests));
  ok("his records are untouched (the summary is built, nothing is written back)", JSON.stringify(M)===JSON.stringify(before)); }
{ const a=WL(null,true), b=WL(null,false), sa=a.G.env.envSummary("lincoln",{M:a.masteryData,u:a.unitStudies.nc_envirothon,now:a.G.now}), sb=b.G.env.envSummary("lincoln",{M:b.masteryData,u:b.unitStudies.nc_envirothon,now:b.G.now});
  ok("Howe with NO mirror config: his summary is byte-identical with and without the block (no ans, no last)", JSON.stringify(sa)===JSON.stringify(sb)&&!/"ans":/.test(JSON.stringify(sa))&&!sa.tests.soils.post.last);
  const o={tests:{soils:{pre:{right:1,n:2}}}}, j=JSON.stringify(o);
  ok("…cprSumAns hands back the very object, unchanged", a.R.cprSumAns("lincoln",o,a.masteryData)===o&&JSON.stringify(o)===j&&a.R.cprSumOn("lincoln")===false); }

console.log("\n── the Lincoln REPLAY: his publish with and without the block ──");
{ const go=cpr=>{ const w=WL(MCFG,cpr); w.initFb(); const before=clone(w.masteryData); w.G.writes=[];
    const s=w.G.env.envSummary("lincoln",{M:w.masteryData,u:w.unitStudies.nc_envirothon,now:w.G.now}); return {w,before,s}; };
  const A=go(true), B=go(false);
  const strip=s=>{ const x=clone(s); Object.keys(x.tests||{}).forEach(k=>{ const t=x.tests[k]; if(t.pre){ delete t.pre.ans; delete t.pre.formVer; } if(t.post) delete t.post.last; }); return x; };
  ok("REPLAY: with the block, his summary is the old one plus the answers and nothing else (byDeck, weak, days, streak, tests' scores identical)", JSON.stringify(strip(A.s))===JSON.stringify(B.s)&&JSON.stringify(A.s)!==JSON.stringify(B.s));
  ok("REPLAY: nothing from his other subjects reaches the summary (math, history, their misses)", !/Math|History|Magna|7 × 8/.test(JSON.stringify(A.s))&&JSON.stringify(A.s.weak)===JSON.stringify(B.s.weak)&&JSON.stringify(A.s.days)===JSON.stringify(B.s.days));
  ok("REPLAY: nothing is written into Howe, and his records (items, tests, studyLog, history) are untouched", A.w.G.writes.length===0&&JSON.stringify(A.w.masteryData)===JSON.stringify(A.before)&&JSON.stringify(B.w.masteryData)===JSON.stringify(A.before));
  // the publish itself: the mirror's one update carries this same summary (ENVMIRROR's own code, unchanged by this PR)
  const mi=src.slice(src.indexOf("function envmPublishKid(kid,force){"),src.indexOf("\n}",src.indexOf("function envmPublishKid(kid,force){")));
  ok("REPLAY: the publish is still ENVMIRROR's one update of students/<sid> = {summary, meta}; this PR adds no line to it", /const s=envSummary\(kid\)/.test(mi)&&/\.ref\("students\/"\+sid\)\.update\(\{summary:s,meta:meta\}\)/.test(mi)&&mi.indexOf("cpr")<0);
  const eng=["function mstPile","function mastBankEligible","function mastFullBank","function mastApplyScores","function envtFinish(){","function envtForm(station,which){","function _mstSaveInner"].filter(f=>src.indexOf(f)>0);
  ok("the Howe engine is not hooked: no cpr call in the drill, the study pile, the grading or the test taking ("+eng.length+" functions checked)", eng.length>=4&&eng.every(f=>{ const i=src.indexOf(f), j=src.indexOf("\n}",i); return src.slice(i,j).indexOf("cpr")<0; })); }

console.log("\n── 📝 Tests ▸ 📊 Class results (demo, the 8 sample students) ──");
{ const w=demo("teacher"), R=w.R, T=w.T; w.envcView("grid"); w.envcView("cptests"); let h=w.G.content;
  ok("📊 Class results sits above the forms, folded", /id="cpr-res"[^]*Class results · most missed first[^]*id="cpct-list"/.test(h)&&!/cpr-res open/.test(h)&&R._cpr.seeded!=null);
  const X=R.cprAll(), took=f=>X.forms.find(x=>x.key===f).A.took;
  ok("the demo's answers: Forestry check-in, Forestry final, Soils check-in and Soils final have them", took("forestry|pre")>=6&&took("forestry|post")>=4&&took("soils|pre")>=4&&took("soils|post")>=1, X.forms.map(f=>[f.key,f.A.took]));
  const D=w._envc.students, sumOk=Object.keys(D).every(sid=>{ const t=D[sid].summary.tests||{}; return Object.keys(t).every(sk=>{ const p=t[sk].pre; if(!p||!p.ans) return true; const f=X.forms.find(x=>x.key===sk+"|pre"); if(p.n!==f.items.length) return true; return f.items.filter(it=>R.cprRight(R.cprPick(p.ans[it.id]),it.ans)).length===p.right; }); });
  ok("…invented, and adding up to each student's check-in score", sumOk);
  ok("Eli P. (on the Howe Academy app, Lincoln's stand-in) counts", R.cprSummaries().some(s=>s.howe&&s.summary.tests.forestry.pre.ans));
  R.cprTap("open"); h=w.G.content;
  ok("opened: one fold per form with answers, '<N> took it', none open", /cpr-res open/.test(h)&&/Forestry · 📝 Check-in/.test(h)&&/\d+<\/b> took it/.test(h)&&!/cprTap\('row'/.test(h));
  R.cprTap("form","forestry|pre"); h=w.G.content; const rows=X.forms.find(x=>x.key==="forestry|pre").A.rows;
  ok("a form: its rows, most missed first (the share right going up)", rows.every((r,i)=>i===0||rows[i-1].pct<=r.pct)&&h.indexOf("cprTap('row','forestry|pre|"+rows[0].id+"')")<h.indexOf("cprTap('row','forestry|pre|"+rows[rows.length-1].id+"')"));
  ok("…each row: the question, 'N of M right', the most-picked wrong choice, the share (⚠ when half or more missed it)", /\d+ of \d+ right/.test(h)&&/most-picked wrong: [A-E] “/.test(h)&&/class="cpr-pct low">⚠ \d+%/.test(h));
  const top=rows[0]; R.cprTap("row","forestry|pre|"+top.id); h=w.G.content;
  ok("a row opened: every choice with how many picked it, ✓ on the right one, who missed it with their pick, Go to the question", (h.match(/class="cpr-n"/g)||[]).length===top.choices.length&&/✓<div class="cpr-bar">/.test(h)&&new RegExp("Who missed it \\("+top.wrong.length+"\\)").test(h)&&/cprGo\('forestry\|pre','/.test(h));
  ok("PR 16's hook point is left on the row (cpSuggestRowHtml, not defined yet) and the row carries its card links", CPR.indexOf('typeof cpSuggestRowHtml==="function"')>0&&Array.isArray(top.cards)&&top.cards.length>0);
  R.cprTap("form","forestry|post"); ok("one open at each level: opening the final folds the check-in and its row", R._cpr.of==="forestry|post"&&R._cpr.or===null);
  const mm=R.cprMostMissed();
  ok("PR 18's ranking: every answered question across the forms, the share missed first", mm.length>20&&mm.every((x,i)=>i===0||(mm[i-1].missed/mm[i-1].row.took)>=(x.missed/x.row.took)));
  R.cprTap("form","forestry|pre"); R.cprGo("forestry|pre",top.id); h=w.G.content;
  ok("Go to the question: the results fold, and the question is open in the forms below", R._cpr.open===false&&T._cpct.or==="forestry|pre|"+top.id&&/cpcs-row cpct-row open/.test(h));
  ok("the forms' rows show '% right' (⚠ when low)", /class="cpct-badge" style="color:#(b91c1c|15803d)" title="\d+ of \d+ right">(⚠ )?\d+% right/.test(T.cpctListHtml()));
  R.cprTap("open"); w.envcView("grid"); w.envcView("cptests"); h=w.G.content;
  ok("leaving 📝 Tests folds the results back", !/cpr-res open/.test(h)&&R._cpr.open===false); }
{ const w=demo("teacher"), R=w.R, T=w.T; w.envcView("cptests"); const X0=R.cprAll(), r0=X0.by["forestry|pre|pre-3"];
  T.cpctTap("st","forestry"); T.cpctTap("form","forestry|pre"); T.cpctTap("row","forestry|pre|pre-3"); T.cpctEditOpen("forestry|pre|pre-3"); T.cpctIn("q","Which tree part is this, in your class's words?"); T.cpctSave();
  const r1=R.cprAll().by["forestry|pre|pre-3"];
  ok("an edit (Q11): the answers given before it are kept apart, not counted on her new wording", r0.took>0&&r1.took===0&&r1.old.n===r0.took&&r1.old.known===r0.took);
  R.cprTap("open"); R.cprTap("form","forestry|pre"); R.cprTap("row","forestry|pre|pre-3");
  ok("…and its row says so", /answered an earlier wording \(\d+ of \d+ right on the unit’s key\); kept apart/.test(w.G.content)); }

console.log("\n── the student page ▸ 📝 Answers; the parent sees none ──");
{ const w=demo("teacher"), R=w.R; w.envcView("student","ramirez_maya"); let h=w.G.content;
  ok("📝 Answers on the student page, folded by section", /📝 Answers/.test(h)&&/cprTap\('sec','forestry'\)/.test(h)&&/cprTap\('sec','soils'\)/.test(h)&&!/class="cpr-g"/.test(h));
  R.cprTap("sec","forestry"); h=w.G.content;
  ok("a section opened: Question · Check-in · Final side by side, one row per question, ✓ / ✗ with the letter picked (the right one in brackets)", /class="cpr-r hd"><div>Question<\/div><div>Check-in<\/div><div>Final<\/div>/.test(h)&&/class="cpr-c ok">✓ [A-E]+/.test(h)&&/class="cpr-c no">✗ [A-E–]+ <small>\([A-E]+\)<\/small>/.test(h)&&/Only on the final/.test(h));
  R.cprTap("sec","soils"); ok("one open: Soils folds Forestry", R._cpr.so==="soils");
  // the green mark: a Soils question on both forms (the same wording), missed on the check-in and right on the final
  const X=R.cprAll(), p=X.forms.find(f=>f.key==="soils|pre"), q=X.forms.find(f=>f.key==="soils|post"), pi=p.items.find(it=>R.cprTwin(p,it,q)), qi=R.cprTwin(p,pi,q);
  const t=w._envc.students.ramirez_maya.summary.tests.soils; t.pre.ans[pi.id]=(typeof pi.ans==="number")?(pi.ans+1)%pi.choices.length:-1;
  t.post=t.post||{}; t.post.best=t.post.best||{right:1,n:q.items.length}; t.post.last={right:1,n:q.items.length,ans:{[qi.id]:qi.ans},formVer:0}; R._cpr.memo=null;
  w.envcView("student","ramirez_maya"); R._cpr.so="soils"; w.renderAll(); h=w.G.content;
  ok("missed on the check-in, right on the final → the shared row is green with ↑", /class="cpr-r up"[^]*?<span class="cpr-up" aria-label="learned it">↑<\/span>/.test(h)&&/class="cpr-up">↑ 1</.test(h));
  w.envcView("student","kim_theo"); ok("a student with no answers yet says so", /📝 Answers<\/div><div class="envs-muted">No answers yet/.test(w.G.content)); }
{ const w=demo("parent"); const h=w.G.content+(w.envsParentHtml?w.envsParentHtml("maya"):"");
  ok("the parent's page shows scores only, never each answer (Q12)", !/📝 Answers|cpr-g|cpr-res|Who missed it/.test(h)&&w.R.cprOn()===false&&w.R.cprStudentHtml("ramirez_maya")===""); }

console.log("\n── Howe / no edition: every hook says no ──");
{ const w=W({w:{fam:HOWE}}), R=w.R, h='<div><button><span>x</span></button><div id="cpct-list"></div></div>';
  ok("cprOn false; 📝 Tests, the row, the student page, the analysis, the seed, the ranking: nothing", R.cprOn()===false&&R.cprTestsHtml(h)===h&&R.cprRowMark(h,{key:"a|pre"},{id:"pre-1"})===h&&R.cprStudentHtml("howe_lincoln")===""&&R.cprAll()===null&&R.cprDemoSeed()===false&&R.cprMostMissed().length===0);
  const o={tests:{forestry:{pre:{right:1,n:1}}}}; ok("the summary hook hands back the same object, untouched", R.cprSumAns("lincoln",o,{lincoln_tests:{forestry:{pre:{answers:[0]}}}})===o&&!("ans" in o.tests.forestry.pre)); }

console.log("\n── the rules: no new path ──");
{ const RU=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, S=RU.students.$sid;
  ok("students/<sid>/summary: the family's own login (or Adrienne) writes it — the mirror's publish, answers included", /beginsWith\(root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)\.val\(\) \+ '_'\)/.test(S.summary[".write"])&&/admins/.test(S.summary[".write"]));
  ok("…and the class's teacher already reads it (no new rule, §6.4)", /classes\/'\+data\.child\('class'\)\.val\(\)\+'\/teacher'\)\.val\(\) == auth\.uid/.test(S[".read"])); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
