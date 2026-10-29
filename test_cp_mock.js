/*
 * Node tests — ⏱️ CPMOCK, the timed team mock (RESEARCH_envirothon_skills_2026-10-28.md §4.12, §5 #7, §6 #1; DESIGN_class_platform_2026-10-28.md
 * §4.1b, §5, §8.12, §13 rows 25–27, the `mock` type).
 *   · where the block sits and how it is hooked (three typeof-guarded lines tagged ⏱️ CPMOCK); its only writes go through envcWrite;
 *   · the pure parts: the team key, the class's teams, the score, the record and its shape, the runs, the per-team sums, the item analysis;
 *   · inert: off the site, for a kid or parent, and while the class has ⏱️ Mock run off;
 *   · the demo (teacher): ⏱️ Mock before 🏆 Boards; start a Forestry mock for Oaks (who is here, the captain, the form, the time); answer
 *     a few; hand in → ONE "would set" at teams/<cid>/oaks/mocks/m<ts>; the team sees its score and the missed numbers, not the answers;
 *     the results by team; question by question; 🗑; the clock runs out → handed in as it stood; Quit keeps nothing;
 *   · the class's own forms: her 📝 Tests edits (removed, reworded) reach the mock; no new questions;
 *   · 🖨 the paper version; cpMockScores for team picks; live: one listener on teams/<cid>, one set; dry run nothing; the rules.
 * Uses the world from test_env_site.js.    run: node test_cp_mock.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,700):"")); } };
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const NOW=Date.UTC(2026,9,29,15,0,0);
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const CPT=cut("// CPTESTS_START","// CPTESTS_END"), MK=cut("// CPMOCK_START","// CPMOCK_END");
const API="CPMK_MINS, CPMK_MIN_DEF, _cpmk, cpmkOn, cpMockTeamKey, cpMockTeams, cpmkPickOk, cpMockScore, cpMockRec, cpMockRecOk, cpMockRuns, cpMockSum, cpMockAnalysis, cpmkData, cpMockScores, cpmkForms, cpmkChips, cpmkHtml, cpmkSet, cpmkOpen, cpmkRemove, cpmkStart, cpmkLeft, cpmkTimer, cpmkPick, cpmkGo, cpmkHandIn, cpmkQuit, cpmkClose, cpmkRunHtml, cpmkPrintHtml, cpMockDemoSeed";
const REV=o=>(o.cpt===false?"":CPT+"\nG.cpt={ _cpct, cpctModel, cpctBump };")+(o.mk===false?"":"\n"+MK+"\nG.mk={ "+API+" };");
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o),now:NOW},o.w||{})); w.K=w.G.mk||null; w.T=w.G.cpt||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const txt=h=>String(h).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/\s+/g," ");
const chipsOf=h=>{ const i=h.indexOf('<div class="envs-chips">'), j=h.indexOf("</div>",i); return txt(h.slice(i,j)).trim(); };
const F=LIB.tests.forestry.pre, NF=F.items.length;
// tap the right choice(s) of the question showing
const pickRight=K=>{ const R=K._cpmk.run, it=R.items[R.i]; (Array.isArray(it.ans)?it.ans:[it.ans]).forEach(j=>K.cpmkPick(j)); };

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPMOCK_START"), b=src.indexOf("// CPMOCK_END"), e=src.indexOf("// CPITEMBIOTIC_END\n");
  ok("one CPMOCK block, IMMEDIATELY after CPITEMBIOTIC_END", a>0&&b>a&&src.indexOf("// CPMOCK_START",a+1)<0&&src.indexOf("// CPMOCK_END",b+1)<0&&e+"// CPITEMBIOTIC_END\n".length===a);
  const head=MK.slice(0,2400);
  ok("the header: §4.12, §6, §13 rows 25–27, the date, the NC tip (a captain who breaks ties), her yes", /§4\.12/.test(head)&&/§6/.test(head)&&/§13 rows 25–27/.test(head)&&/2026-10-29/.test(head)&&/a captain who breaks ties/.test(head)&&/her yes/.test(head));
  ok("the block only declares (nothing runs at load)", MK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/\b(cpmk[A-Z]\w*|cpMock[A-Z]\w*)\(/.test(l));
  ok("three hook lines outside the block, each typeof-guarded and tagged ⏱️ CPMOCK", hooks.length===3&&hooks.every(l=>/typeof cp(mk|Mock)\w+==="function"/.test(l)&&/⏱️ CPMOCK/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  const fn=n=>{ const i=src.indexOf(n), j=src.indexOf("\n}",i); return src.slice(i,j); };
  ok("…the chip and the view in envConsoleHtml, the demo seed in envsDemoStart (its own line)", /cpmkChips\(chips\)/.test(fn("function envConsoleHtml(){"))&&/v==="cpmock"&&typeof cpmkHtml==="function"\) h\+=cpmkHtml\(\)/.test(fn("function envConsoleHtml(){"))&&/^  try\{ if\(typeof cpMockDemoSeed==="function"\) cpMockDemoSeed\(data\); \}catch\(e\)\{\}/m.test(fn("function envsDemoStart(){")));
  const lit=fn("function envConsoleHtml(){").split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited", !!lit&&lit.indexOf("cpmock")<0);
  const code=MK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its only writes: envcWrite (the run's one set, 🗑's remove); no db, no Firebase call, no family path", (code.match(/envcWrite\(/g)||[]).length===2&&!/\bdb\.|\.ref\(|\.set\(|\.update\(|envsWrite\(|envcMulti|mastery\//.test(code));
  ok("no section word in its strings (from the class's labels); no Howe kid name; no 🔀", !/["'][^"'\n]*\b(Stations?|station|Check-in|check-in|Final form)\b[^"'\n]*["']/.test(code)&&!/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(MK)&&MK.indexOf("\u{1F500}")<0);
  ok("the team key and run id fit the rules' patterns", /\[\^a-z0-9\]\+/.test(code)&&/"m"\+now/.test(code)); }

console.log("\n── the pure parts ──");
{ const w=W(), K=w.K;
  ok("cpMockTeamKey: Firebase-safe (Oaks → oaks, Team #2 → team_2, blank → \"\", an emoji name → its own code)", K.cpMockTeamKey("Oaks")==="oaks"&&K.cpMockTeamKey(" Team #2 ")==="team_2"&&K.cpMockTeamKey("  ")===""&&/^t[a-z0-9]+$/.test(K.cpMockTeamKey("🦉"))&&K.cpMockTeamKey("🦉")===K.cpMockTeamKey("🦉")&&K.cpMockTeamKey("x".repeat(80)).length===30);
  const T=K.cpMockTeams({a:"Oaks",b:"Pines",c:" oaks ",d:"",e:"Maples"});
  ok("cpMockTeams: one team per key, by name, the blank left out", JSON.stringify(T.map(t=>[t.key,t.sids.length]))==='[["maples",1],["oaks",2],["pines",1]]'&&K.cpMockTeams(null).length===0);
  const items=[{id:"pre-1",q:"q1",choices:["a","b","c"],ans:1},{id:"pre-2",q:"q2",choices:["a","b","c","d"],ans:[0,2]},{id:"c-x",q:"q3",choices:["a","b"],ans:0}];
  const sc=K.cpMockScore(items,[1,[2,0],null]);
  ok("cpMockScore: one per right; select-all is right only for exactly the keyed set (sorted); no answer = -1", sc.right===2&&sc.n===3&&JSON.stringify(sc.ans)==='{"pre-1":1,"pre-2":[0,2],"c-x":-1}'&&K.cpMockScore(items,[0,[0],0]).right===1);
  const runR={sk:"forestry",w:"pre",form:"2026 Area 8 MS Forestry",ver:7,team:{key:"oaks",name:"Oaks"},members:["s1","s2"],captain:"s2",items,mins:25,start:NOW-600000,ans:[1,[0,2],0],out:false};
  const rec=K.cpMockRec(runR,NOW,"t1");
  ok("cpMockRec: the one record (form, formVer, team, members, captain, score, secs, mins, ans, start, at, by)", rec.sk==="forestry"&&rec.w==="pre"&&rec.formVer===7&&rec.team==="Oaks"&&JSON.stringify(rec.members)==='{"s1":true,"s2":true}'&&rec.captain==="s2"&&rec.right===3&&rec.n===3&&rec.secs===600&&rec.mins===25&&rec.at===NOW&&rec.by==="t1"&&!("out" in rec)&&K.cpMockRecOk(rec), rec);
  const late=K.cpMockRec(Object.assign({},runR,{start:NOW-40*60000,out:true}),NOW,"t1");
  ok("…secs never past the time allowed; out:true when the clock ran out", late.secs===25*60&&late.out===true&&K.cpMockRecOk(late));
  const bad=[Object.assign({},rec,{sk:"for/estry"}),Object.assign({},rec,{w:"mid"}),Object.assign({},rec,{right:4}),Object.assign({},rec,{by:""}),Object.assign({},rec,{ans:{"pre.1":1}}),Object.assign({},rec,{ans:{"pre-1":"b"}}),Object.assign({},rec,{members:{s1:1}}),Object.assign({},rec,{mins:0}),Object.assign({},rec,{team:""})];
  ok("cpMockRecOk refuses a bad section, form, score, writer, question id, pick, member, time or team", bad.every(r=>!K.cpMockRecOk(r)));
  const mk=(key,team,sk,w,right,n,at,members,ans,fv)=>({sk,w,team,right,n,at,secs:600,mins:25,members:Object.fromEntries((members||[]).map(s=>[s,true])),ans:ans||{},formVer:fv||0});
  const node={oaks:{mocks:{m1:mk("oaks","Oaks","forestry","pre",8,10,100,["s1","s2"]),m3:mk("oaks","Oaks","forestry","pre",6,10,300,["s1"]),m4:mk("oaks","Oaks","soils","pre",9,10,400,["s1","s2"])}},pines:{mocks:{m2:mk("pines","Pines","forestry","pre",5,10,200,["s3"]),junk:{x:1}}},maples:{name:"x"}};
  const R=K.cpMockRuns(node);
  ok("cpMockRuns: every well-formed run, oldest first", R.map(x=>x.mid).join()==="m1,m2,m3,m4"&&R[1].key==="pines");
  const S=K.cpMockSum(R);
  ok("cpMockSum per team: runs, pct = the mean of each form's LATEST run (Oaks: forestry 60, soils 90 → 75), by section last + best", S.teams.oaks.runs===3&&S.teams.oaks.pct===75&&S.teams.oaks.bySection.forestry.last.pct===60&&S.teams.oaks.bySection.forestry.best.pct===80&&S.teams.oaks.bySection.forestry.runs===2&&S.teams.pines.pct===50, S.teams);
  ok("…per student: the runs they sat and the mean of their latest per form (s2 sat forestry 80 then soils 90 → 85)", S.students.s1.runs===3&&S.students.s1.pct===75&&S.students.s2.runs===2&&S.students.s2.pct===85&&S.students.s3.team==="pines"&&!S.students.s4);
  const its=[{id:"pre-1",q:"q1",choices:["a","b","c"],ans:1},{id:"pre-2",q:"q2",choices:["a","b","c"],ans:2,edited:true,ts:250},{id:"pre-3",q:"q3",choices:["a","b"],ans:0}];
  const RR=[{key:"oaks",mid:"m1",rec:mk("oaks","Oaks","forestry","pre",0,3,100,[],{"pre-1":0,"pre-2":2,"pre-3":0},0)},{key:"oaks",mid:"m3",rec:mk("oaks","Oaks","forestry","pre",0,3,300,[],{"pre-1":1,"pre-2":0,"pre-3":0},300)},{key:"pines",mid:"m2",rec:mk("pines","Pines","forestry","pre",0,3,200,[],{"pre-1":2,"pre-2":2,"pre-3":-1},0)}];
  const A=K.cpMockAnalysis(RR,its);
  ok("cpMockAnalysis: each team's LATEST run (Oaks' m3), the teams by name", A.teams.map(t=>t.key).join()==="oaks,pines"&&A.teams[0].at===300);
  const by=Object.fromEntries(A.rows.map(r=>[r.id,r]));
  ok("…per question every team's pick ✓ / ✗; no answer counts as a miss; a run before she reworded it doesn't count on it", by["pre-1"].right===1&&by["pre-1"].took===2&&by["pre-1"].picks.find(p=>p.key==="pines").pick===2&&by["pre-3"].picks.find(p=>p.key==="pines").ok===false&&by["pre-2"].took===1&&by["pre-2"].picks[0].key==="oaks"&&by["pre-2"].right===0);
  ok("…most missed first (share right, then the form's order)", A.rows.map(r=>r.id).join()==="pre-2,pre-1,pre-3", A.rows.map(r=>[r.id,r.pct])); }

console.log("\n── inert ──");
{ const h=W({w:{fam:{familyId:"howe",roster:[]}}}); h._envs.role="teacher";
  ok("Howe (no site): off, no chip, no page, cpMockScores null", !h.K.cpmkOn()&&h.K.cpmkChips([["boards","B"]]).length===1&&h.K.cpmkHtml()===""&&h.K.cpMockScores("c1")===null);
  const k=demo("kid"); ok("the kid's and the parent's site: off (no console)", !k.K.cpmkOn()&&!/⏱️ Mock/.test(k.G.content)&&!demo("parent").K.cpmkOn());
  const t=demo("teacher"); t._envc.cls.features.mockRun=false; t.envcView("grid");
  ok("the class has ⏱️ Mock run off: no chip, no page", !t.K.cpmkOn()&&chipsOf(t.G.content).indexOf("Mock")<0&&t.K.cpmkHtml()==="");
  const n=W({mk:false,w:{search:"?demo=1&role=teacher"}}); n.envSiteDemoBoot(); n.renderAll();
  ok("without the block the demo boots as before (the hooks are guarded)", /envs-chips/.test(n.G.content)&&chipsOf(n.G.content).indexOf("Mock")<0); }

console.log("\n── the demo: Teacher ▸ ⏱️ Mock ▸ a Forestry mock for Oaks ──");
{ const w=demo("teacher"), K=w.K, cid=w._envc.cid; let h=w.G.content;
  const C=chipsOf(h); ok("the sample class has Mock run on: ⏱️ Mock right before 🏆 Boards", K.cpmkOn()&&/⏱️ Mock 🏆 Boards/.test(C), C);
  w.envcView("cpmock"); h=w.G.content;
  ok("the start card: the three teams with their sizes, the time (25 min picked), Start greyed until picked", /Timed team mock/.test(h)&&/Maples · 2/.test(txt(h))&&/Oaks · 3/.test(txt(h))&&/Pines · 3/.test(txt(h))&&/class="on" onclick="cpmkSet\('mins',25\)"/.test(h)&&/<button class="cpmk-go" disabled/.test(h)&&/Pick a team\./.test(h));
  ok("the results by team: Pines (2 runs) and Maples already ran the Forestry check-in form (the sample runs)", /Results by team/.test(h)&&/Forestry · Check-in \(2026 Area 8 MS Forestry\)/.test(txt(h))&&/Pines.{0,120}2 /.test(txt(h))&&/Maples/.test(txt(h)));
  K.cpmkSet("team","oaks"); h=w.G.content;
  ok("Oaks: its three students here, the captain to pick", /Here today/.test(h)&&/Maya/.test(txt(h))&&/Caleb/.test(txt(h))&&/Pick the captain\./.test(h));
  K.cpmkSet("away","walker_caleb"); K.cpmkSet("cap","ramirez_maya"); K.cpmkSet("sk","forestry"); h=w.G.content;
  ok("Caleb away (struck through, not a captain choice), Maya captain; the form: the class's check-in and final, with their counts", /class="off" onclick="cpmkSet\('away','walker_caleb'\)"/.test(h)&&!/cpmkSet\('cap','walker_caleb'\)/.test(h)&&/Check-in \(2026 Area 8 MS Forestry\) · 15 questions/.test(txt(h))&&/Final \(2022 Area 8 MS Forestry\) · 14 questions/.test(txt(h)));
  K.cpmkSet("w","pre"); h=w.G.content;
  ok("all picked: Start and 🖨 Print open; \"Oaks · 15 questions · 25 minutes\"", !/<button class="cpmk-go" disabled/.test(h)&&/Print the paper version/.test(h)&&/Oaks · 15 questions · 25 minutes/.test(txt(h)));
  const ov=w.el("cpmock-ov"); const before=w._envs.writes.length;
  ok("▶ Start: the run is open on this device", K.cpmkStart()===true&&!!K._cpmk.run&&K._cpmk.run.items.length===NF&&K._cpmk.run.members.slice().sort().join()==="howe-demo_eli,ramirez_maya"&&K._cpmk.run.captain==="ramirez_maya");
  ok("…the countdown 25:00, the answer sheet strip, question 1, the captain line, no right/wrong", /id="cpmk-clock" class="cpmk-clock">25:00/.test(ov.innerHTML)&&(ov.innerHTML.match(/onclick="cpmkGo\(\d+\)" aria-label="question/g)||[]).length===NF&&/Question 1 of 15/.test(txt(ov.innerHTML))&&/Can’t agree\? Maya R\. decides\./.test(txt(ov.innerHTML))&&!/✓|✗/.test(ov.innerHTML));
  ok("a second Start while one runs does nothing", K.cpmkStart()===false);
  const R=K._cpmk.run, I=R.items;
  // answer a few: question 1 is select-all (picked right), 2 right, 3 wrong, jump to 6 and answer it right; the rest empty
  (Array.isArray(I[0].ans)?I[0].ans:[I[0].ans]).forEach(j=>K.cpmkPick(j)); K.cpmkGo(1); K.cpmkPick(I[1].ans); K.cpmkGo(2); K.cpmkPick((I[2].ans+1)%I[2].choices.length);
  K.cpmkGo(5); K.cpmkPick(I[5].ans);
  ok("a pick that isn't a choice does nothing", (K.cpmkPick([0,1]),K.cpmkPick(99),R.ans.filter(a=>a!=null).length===4));
  ok("the sheet keeps each answer; the strip marks answered numbers; tapping a picked choice again clears it", R.ans.filter(a=>a!=null).length===4&&(ov.innerHTML.match(/class="has/g)||[]).length===4&&/class="has at"/.test(ov.innerHTML)&&(K.cpmkPick(I[5].ans),R.ans[5]===null)&&(K.cpmkPick(I[5].ans),R.ans[5]===I[5].ans));
  w.G.now=NOW+11*60000+30000; K.cpmkTimer();
  ok("the clock counts down from the start (13:30 left)", K.cpmkLeft()===13*60+30);
  K.cpmkHandIn();
  const wr=w._envs.writes.slice(before), rec=wr[0]&&wr[0].val;
  ok("📋 Hand in: ONE \"would set\" at teams/<cid>/oaks/mocks/m<ts>", wr.length===1&&wr[0].op==="set"&&wr[0].path==="teams/"+cid+"/oaks/mocks/m"+w.G.now, wr.map(x=>x.path));
  ok("…the record: Forestry check-in form, 3 of 15 right, 11:30 used, Maya and Eli, captain Maya, by the teacher, every answer by question id", K.cpMockRecOk(rec)&&rec.sk==="forestry"&&rec.w==="pre"&&rec.right===3&&rec.n===NF&&rec.secs===690&&rec.mins===25&&JSON.stringify(Object.keys(rec.members).sort())==='["howe-demo_eli","ramirez_maya"]'&&rec.captain==="ramirez_maya"&&rec.by==="uid_teacher_demo"&&Object.keys(rec.ans).length===NF&&rec.ans["pre-"+I[3].n]===-1, rec);
  await w.flush();
  const done=txt(ov.innerHTML);
  ok("the team sees: Oaks, 3 of 15, the time, ✓ / ✗ per question number, and NOT the answers", /Oaks 3 of 15/.test(done)&&/11:30 of 25 minutes/.test(done)&&/1✓/.test(done)&&/3✗/.test(done)&&/The right answers stay with the teacher/.test(done)&&!/Right:/.test(done)&&/Demo — nothing saved\./.test(done));
  ok("nothing touched any database (the demo's writes are a list only)", w.G.writes.length===0);
  K.cpmkClose(); h=w.G.content;
  ok("Done: the results by team now have Oaks (3/15), and Forestry's question-by-question is open", !K._cpmk.run&&/Oaks 3\/15/.test(txt(h))&&/aria-expanded="true">▾ Question by question/.test(h));
  ok("…question by question: the question, the right answer, every team's pick ✓ / ✗ with the letter missed", /Right: /.test(h)&&/cpmk-p ok">✓ Oaks/.test(h)&&/cpmk-p no">✗ Pines · [A-E–]/.test(h)&&/cpmk-p no">✗ Oaks · –/.test(h));
  ok("…the runs, newest first, with the captain", /<b>Oaks<\/b> · Oct 29 · 3\/15 · 11:30 of 25 min · captain Maya/.test(h));
  const S=K.cpMockScores(cid);
  ok("cpMockScores(cid) for team picks: Oaks 20 %, Pines and Maples from the sample runs; Maya sat Oaks' run, Caleb didn't", S&&S.teams.oaks.pct===20&&S.teams.oaks.runs===1&&S.teams.pines.runs===2&&S.teams.maples.runs===1&&S.students.ramirez_maya.pct===20&&!S.students.walker_caleb&&S.students.tran_jonah.team==="pines", S&&S.teams);
  const n0=w._envs.writes.length, mid="m"+w.G.now; K.cpmkRemove("oaks",mid);
  await w.flush();
  ok("🗑 takes a run back: ONE \"would remove\" of that run, and it leaves the results", w._envs.writes.length===n0+1&&w._envs.writes[n0].op==="remove"&&w._envs.writes[n0].path==="teams/"+cid+"/oaks/mocks/"+mid&&!K.cpMockScores(cid).teams.oaks); }

{ const w=demo("teacher"), K=w.K, cid=w._envc.cid; w.envcView("cpmock");
  ["team:oaks","cap:ramirez_maya","sk:forestry","w:post","mins:10"].forEach(x=>{ const p=x.split(":"); K.cpmkSet(p[0],p[0]==="mins"?+p[1]:p[1]); });
  const ov=w.el("cpmock-ov"); K.cpmkStart(); pickRight(K); const n0=w._envs.writes.length;
  w.G.now=NOW+9*60000; K.cpmkTimer();
  ok("under 2 minutes the clock turns amber (1:00 left)", K.cpmkLeft()===60&&/id="cpmk-clock" class="cpmk-clock warn">1:00/.test(K.cpmkRunHtml())&&/class="cpmk-clock">10:00|class="cpmk-clock">9:/.test(ov.innerHTML));
  w.G.now=NOW+10*60000+5000; K.cpmkTimer(); const r=w._envs.writes[n0]&&w._envs.writes[n0].val;
  ok("at 0:00 the sheet is handed in as it stood: out, the whole 10 minutes, the final form, no question asked", w._envs.writes.length===n0+1&&r.out===true&&r.secs===600&&r.mins===10&&r.w==="post"&&r.right===1&&K.cpMockRecOk(r));
  await w.flush(); ok("…the team reads \"Time ran out\"", /Time ran out/.test(ov.innerHTML)); K.cpmkClose();
  K.cpmkSet("w","pre"); K.cpmkStart(); K.cpmkPick(0); const n1=w._envs.writes.length; K.cpmkQuit();
  ok("Quit keeps nothing", !K._cpmk.run&&w._envs.writes.length===n1); }

console.log("\n── the class's own forms: her 📝 Tests edits reach the mock ──");
{ const w=demo("teacher"), K=w.K, cid=w._envc.cid; w.envcView("cpmock");
  const q3=F.items[2], id3="pre-"+q3.n, id4="pre-"+F.items[3].n;
  w.T._cpct.L[cid]={forestry:{pre:{items:{[id3]:{hide:true,by:"uid_teacher_demo",ts:NOW-5000},[id4]:{q:"HER WORDING?",choices:["x","y","z"],ans:1,by:"uid_teacher_demo",ts:NOW-4000},"c-k1":{q:"HER OWN?",choices:["p","q"],ans:0,add:true,by:"uid_teacher_demo",ts:NOW-3000}},ver:NOW-3000}}}; w.T.cpctBump();
  const f=K.cpmkForms().forms.find(x=>x.key==="forestry|pre");
  ok("removed questions leave, her wording and her own question are in, ver = the layer's", f.items.length===NF&&!f.items.some(x=>x.id===id3)&&f.items.find(x=>x.id===id4).q==="HER WORDING?"&&f.items[f.items.length-1].id==="c-k1"&&f.ver===NOW-3000&&f.items.find(x=>x.id===id4).ts===NOW-4000);
  ok("no question that isn't the class's (every id is a unit question or hers)", K.cpmkForms().forms.every(fm=>fm.items.every(it=>/^(pre|post)-\d+$/.test(it.id)||/^c-/.test(it.id))));
  ok("the general section's same-form final (CEI's) is offered once", K.cpmkForms().forms.filter(x=>x.sk==="cei").length===(LIB.tests.cei&&LIB.tests.cei.pre&&LIB.tests.cei.post&&LIB.tests.cei.pre.form===LIB.tests.cei.post.form?1:K.cpmkForms().forms.filter(x=>x.sk==="cei").length));
  ["team:oaks","cap:ramirez_maya","sk:forestry","w:pre"].forEach(x=>{ const p=x.split(":"); K.cpmkSet(p[0],p[1]); });
  w.el("cpmock-ov"); K.cpmkStart(); const R=K._cpmk.run;
  ok("the run asks her form (her wording in it, the removed one gone) and saves its formVer", R.items.some(x=>x.q==="HER WORDING?")&&!R.items.some(x=>x.id===id3)&&R.ver===NOW-3000);
  K.cpmkHandIn(true); const rec=w._envs.writes[w._envs.writes.length-1].val; ok("…the record keeps formVer and answers by her ids", rec.formVer===NOW-3000&&"c-k1" in rec.ans&&!(id3 in rec.ans)); }

console.log("\n── 🖨 the paper version ──");
{ const w=demo("teacher"), K=w.K; w.envcView("cpmock"); ["team:pines","sk:forestry","w:pre","mins:25"].forEach(x=>{ const p=x.split(":"); K.cpmkSet(p[0],p[0]==="mins"?+p[1]:p[1]); });
  const p=K.cpmkPrintHtml(), t=txt(p);
  ok("the form as a team handout: every question with its A–E choices, the time and the captain rule", /^<!doctype html>/.test(p)&&F.items.every(it=>t.indexOf(txt(it.q.replace(/&/g,"&amp;").replace(/</g,"&lt;")).trim().slice(0,40))>=0)&&/15 questions · 25 minutes · one answer sheet per team/.test(t)&&/the captain decides/.test(t));
  ok("the answer sheet (team Pines, captain, members, start / stop, a row of bubbles per question) on its own page", /class="pg"><h2>Answer sheet/.test(p)&&/Team <b>Pines<\/b>/.test(p)&&/Captain/.test(t)&&/Members/.test(t)&&/Start.*Stop/.test(t)&&(p.match(/<div class="r"><b>/g)||[]).length===NF);
  ok("the key on its own page: each number's letter(s), select-all as all its letters", /<h2>Key · /.test(p)&&(p.match(/class="pg"/g)||[]).length===2&&F.items.every((it,i)=>p.indexOf("<div>"+(i+1)+". <b>"+(Array.isArray(it.ans)?it.ans.map(j=>"ABCDE"[j]).join(""):"ABCDE"[it.ans])+"</b></div>")>=0));
  ok("no form picked → nothing to print", (K.cpmkSet("sk","soils"),K.cpmkPrintHtml()==="")); }

console.log("\n── live (not the demo): one listener on teams/<cid>, one set; dry run nothing ──");
{ const cls={teacher:"t1",students:{a:true,b:true},teams:{a:"Oaks",b:"Oaks"},features:{mockRun:true}};
  const remote={"teams/c1":{pines:{mocks:{m1700000000000:{sk:"forestry",w:"pre",team:"Pines",right:6,n:15,at:1,secs:900,mins:25,members:{z:true},ans:{}}}}}};
  const live=dry=>{ const x=W({w:{dry,remote}}); x._envs.role="teacher"; x._envs.uid="t1"; x._envc.sdb=x.firebase.database(); x._envc.cid="c1"; x._envs.cid="c1"; x._envc.cls=cls; x._envc.students={a:{meta:{name:"Ann"}},b:{meta:{name:"Bo"}}}; x._envc.view="cpmock"; return x; };
  const c=live(false), K=c.K, S=K.cpMockScores("c1");
  ok("cpMockScores asks for teams/<cid> once (a listener) and reads the runs", c.G.listeners.filter(l=>l.p==="teams/c1").length===1&&S&&S.teams.pines.runs===1&&(K.cpMockScores("c1"),c.G.listeners.filter(l=>l.p==="teams/c1").length===1));
  ok("before the listener answers: null (another class)", K.cpMockScores("c9")===null);
  ["team:oaks","cap:a","sk:forestry","w:pre"].forEach(x=>{ const p=x.split(":"); K.cpmkSet(p[0],p[1]); });
  c.el("cpmock-ov"); ok("the live start works", K.cpmkStart()===true); pickRight(K); K.cpmkHandIn(true); await c.flush();
  const s=c.G.writes.filter(x=>x[1].indexOf("teams/")===0);
  ok("hand in: ONE Firebase set at teams/c1/oaks/mocks/m<ts>, by t1; the memory waits for the listener", c.G.writes.length===1&&s.length===1&&s[0][0]==="set"&&s[0][1]==="teams/c1/oaks/mocks/m"+NOW&&s[0][2].by==="t1"&&!(K._cpmk.M.c1.oaks), c.G.writes);
  ok("…the team sees it saved (no demo / dry-run line)", !/nothing saved/.test(c.G.els["cpmock-ov"].innerHTML));
  const d=live(true); ["team:oaks","cap:a","sk:forestry","w:pre"].forEach(x=>{ const p=x.split(":"); d.K.cpmkSet(p[0],p[1]); }); d.el("cpmock-ov"); d.K.cpmkStart(); d.K.cpmkHandIn(true); await d.flush();
  ok("?dryrun=1: nothing written, and the team reads \"Dry run — nothing saved\"", d.G.writes.length===0&&/Dry run — nothing saved/.test(d.G.els["cpmock-ov"].innerHTML));
  const e=live(false); e._envc.cls=Object.assign({},cls,{teams:{}}); e.envcView("cpmock");
  ok("a class with no team names says where to set them", /No teams yet\. Give each student a team name in 🏆 Boards/.test(e.K.cpmkHtml())); }

console.log("\n── the rules and the setup note ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), T=R.rules.teams, M=T&&T.$cid.$team.mocks.$mid;
  const who="auth != null && (root.child('classes/'+$cid+'/teacher').val() == auth.uid || root.child('admins/'+auth.uid).val() == true)";
  ok("teams/<cid>: read by the class's teacher and admin only (no student or parent login)", T&&T.$cid[".read"]===who&&!/logins/.test(T.$cid[".read"]));
  ok("…mocks/<mid>: written by them only, by = the writer, the team key and run id patterns, every field shaped, nothing else", M&&M[".write"]===who&&/newData.child\('by'\).val\(\) == auth.uid/.test(M[".validate"])&&/\$team.matches\(\/\^\[a-z0-9_\]\{1,30\}\$\/\)/.test(M[".validate"])&&/\$mid.matches\(\/\^m\[0-9\]\{10,16\}\$\/\)/.test(M[".validate"])&&["sk","w","form","formVer","team","members","captain","n","right","secs","mins","out","ans","start","at","by"].every(k=>M[k])&&M.$other[".validate"]===false&&T.$cid.$team.$other[".validate"]===false);
  ok("the pick shape matches CPTESTS' ans (an index, -1, or a list)", /newData.val\(\) >= -1/.test(M.ans.$q[".validate"])&&/hasChild\('0'\)/.test(M.ans.$q[".validate"]));
  ok("_about says what it is (CPMOCK, the path, who)", /CPMOCK/.test(R._about)&&/teams\/<cid>\/<teamKey>\/mocks\/m<ts>/.test(R._about));
  const setup=fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8");
  ok("SITE_SETUP.md: Team mocks, the switch, the path, publish the rules again", /Team mocks/.test(setup)&&/Mock run/.test(setup)&&/teams\/<cid>\/<team>\/mocks\/m<ts>/.test(setup)&&/`teams` node is live/.test(setup)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
