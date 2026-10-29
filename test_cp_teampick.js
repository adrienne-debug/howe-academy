/*
 * Node tests — 🏅 CPTEAMPICK, PR 24 of the class platform (DESIGN_class_platform_2026-10-28.md §8.12, §9.1, §13 row 24, §14 Q35 + Q36; the
 * class syllabus 2026-10-28: teams are chosen on attendance, presentation scores, test scores and completion of study times).
 *   · where the block sits and how it is hooked (two typeof-guarded lines in envConsoleHtml tagged 🏅 CPTEAMPICK); its only writes go
 *     through envcWrite → envsWrite;
 *   · the pure parts: attendance, presentations, tests (a check-in shown, never counted), strong in, the weights, the score and its
 *     working, the ranking and every sort, the attendance days;
 *   · 🏅 Team picks in the demo (teacher): the chip after 📊 Weekly, the goals line, a row per student, sort by study completion, the open
 *     row's working; 🙋 take attendance for a meeting (one targeted write a tap, Everyone else in ONE update); the weights; nothing saved
 *     just by looking — a ranking only;
 *   · 🔒 CPLOCKS: the sixth switch, the bar over the tab, greyed for the teacher, refused in the browser; Adrienne still writes;
 *   · features.teams off → no chip, no view; Howe / DeWalt / Burris, the kid and the parent: nothing; the rules.
 * Uses the world from test_env_site.js.    run: node test_cp_teampick.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,700):"")); } };
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const CID="ms-science-2026";
const NOW=Date.UTC(2026,9,29,15,0,0);   // Thu Oct 29, 2026: the sample meetings Sep 15, Sep 29, Oct 13 and Oct 27 are behind us
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PRE=["CPTESTS","CPRESULTS","CPPACE","CPSEND","CPCAL","CPMISSED"].map(n=>cut("// "+n+"_START","// "+n+"_END"));
const CPL=cut("// CPLOCKS_START","// CPLOCKS_END"), WK=cut("// CPWEEK_START","// CPWEEK_END"), TP=cut("// CPTEAMPICK_START","// CPTEAMPICK_END");
const TPF=(TP.match(/^function (\w+)/gm)||[]).map(s=>s.slice(9));
const SPEC_STUB='function cpSpecStrongBtn(sid,sec){ return \'<i data-spec="\'+sid+\'|\'+sec+\'"></i>\'; }';
function REV(o){ return [o.cpl===false?"":CPL,...PRE,o.wk===false?"":WK,o.spec?SPEC_STUB:"",TP,(o.wk===false?"":"G.wkStudy=cpWeekStudy;"),"G.tp={ _cptp, CPTP_CRIT, CPTP_W_DEF, CPTP_PART, "+TPF.join(", ")+" };",
  o.cpl===false?"":"G.cpl={ CPL_PARTS, CPL_VIEW, cpLockSet, cpLocked, cpLockBarHtml, cpLockSetupHtml };"].join("\n"); }
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o),now:NOW},o.w||{})); w.T=w.G.tp||null; w.L=w.G.cpl||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const txt=h=>String(h).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ");
const chipsOf=h=>{ const i=h.indexOf('<div class="envs-chips">'), j=h.indexOf("</div>",i); return txt(h.slice(i,j)).trim(); };
const view=(w,v)=>{ w.envcView("grid"); w.envcView(v); return w.G.content; };
const Wr=w=>w._envs.writes, last=w=>Wr(w)[Wr(w).length-1];
const rowNames=h=>(h.match(/<span class="nm">(?:▾ )?([^<]*)<\/span>/g)||[]).map(x=>x.replace(/<[^>]+>/g,"").replace(/^▾ /,""));

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPTEAMPICK_START"), b=src.indexOf("// CPTEAMPICK_END");
  ok("one CPTEAMPICK block, immediately after CPWEEK_END", a>0&&b>a&&src.indexOf("// CPTEAMPICK_START",a+1)<0&&src.slice(src.indexOf("// CPWEEK_END"),a).trim()==="// CPWEEK_END");
  const head=TP.slice(0,1400);
  ok("the design (§8.12, §13 row 24, PR 24), the syllabus, the date and 'a ranking only' in the header", /§8\.12/.test(head)&&/§13 row 24/.test(head)&&/PR 24/.test(head)&&/2026-10-28/.test(head)&&/RANKING ONLY/.test(head)&&/attendance, presentation scores, test scores/.test(head));
  ok("the block only declares (its one load-time line adds the 🏅 lock switch to CPLOCKS)", TP.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)||l==="cptpLockPart();")&&TP.split("\n").filter(l=>l==="cptpLockPart();").length===1);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/\bcptp[A-Z]\w*\(/.test(l));
  ok("two hook lines outside the block, each typeof-guarded and tagged 🏅 CPTEAMPICK", hooks.length===2&&hooks.every(l=>/typeof cptp\w+==="function"/.test(l)&&/🏅 CPTEAMPICK/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  const fn=src.slice(src.indexOf("function envConsoleHtml(){"),src.indexOf("\n}",src.indexOf("function envConsoleHtml(){")));
  ok("…in envConsoleHtml: the chip right after CPWEEK's chip line, the view right after CPWEEK's view", /cpwkChips\(chips\);[^\n]*\n\s*if\(typeof cptpChips==="function"\) cptpChips\(chips\);/.test(fn)&&/h\+=cpwkHtml\(\);[^\n]*\n\s*else if\(v==="cpteams"&&typeof cptpHtml==="function"\) h\+=cptpHtml\(\);/.test(fn));
  const lit=fn.split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited", !!lit&&lit.indexOf("cpteams")<0);
  const code=TP.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its only write is ONE envcWrite (→ envsWrite); no db, no firebase, no listener, no set/update/remove of its own", (code.match(/envcWrite\(/g)||[]).length===1&&!/firebase|\.ref\(|\.on\(|\.set\(|\.update\(|\.remove\(|envsWrite\(|envcMulti\(|_envc\.sdb/.test(code));
  ok("no Envirothon word in its strings (pre / post come from the labels); no Howe kid name; no 🔀", !/["'][^"'\n]*\b(Stations?|station|Check-in|check-in|Key Concepts?|species|Area|State)\b[^"'\n]*["']/.test(code)&&!/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(TP)&&TP.indexOf("\u{1F500}")<0);
  ok("no team is saved, picked or announced: no teams/ or boards/ path, no 'announce' write", !/["'](classes\/["']\+[^\n]*\/teams\/|boards\/)/.test(code)&&!/teams\/["']\+/.test(code)); }

console.log("\n── the pure parts ──");
{ const T=W().T;
  const a=T.cptpAttOf({"2026-09-15":true,"2026-09-29":false,"2026-10-13":true,"bad":true,"2026-10-27":"yes"});
  ok("cptpAttOf: here ÷ taken (true|false only, real dates only)", a.here===2&&a.of===3&&a.pct===67&&T.cptpAttOf(null).pct===null&&T.cptpAttOf({}).of===0);
  const p=T.cptpPresOf({forestry:{presentation:4,presMax:5},soils:{presentation:5,presMax:5},attendance:{"2026-09-15":true},aquatics:{test:20}});
  ok("cptpPresOf: every section's presentation together (attendance is not a section), out of the shared max", p.n===2&&p.sum===9&&p.max===10&&p.pct===90&&p.outOf===5&&T.cptpPresTxt(p)==="4.5 / 5 (2)");
  const p2=T.cptpPresOf({a:{presentation:8,presMax:10},b:{presentation:4,presMax:5}});
  ok("…mixed maxes: the share scaled to 5; none → –", p2.pct===80&&p2.outOf===5&&T.cptpPresTxt(p2)==="4 / 5 (2)"&&T.cptpPresTxt(T.cptpPresOf({}))==="–");
  const t=T.cptpTestsOf({forestry:{test:22,testMax:25}},{tests:{forestry:{pre:{right:13,n:20},post:{best:{right:18,n:20}}},soils:{pre:{right:2,n:20}}}});
  ok("cptpTestsOf: her tests · the app's check-in → final; the share = mean of hers (88) and the finals' (90); the check-in never counts", t.cls.r===22&&t.cls.n===25&&t.pre.r===15&&t.pre.n===40&&t.post.r===18&&t.post.n===20&&t.pct===89&&T.cptpTestTxt(t)==="22/25 · 15/40 → 18/20");
  const t2=T.cptpTestsOf({},{tests:{forestry:{pre:{right:3,n:20}}}});
  ok("…only a check-in: shown, the share stays empty", t2.pct===null&&T.cptpTestTxt(t2)==="3/20 → –"&&T.cptpTestTxt(T.cptpTestsOf({},{}))==="–");
  const S=[{sid:"a"},{sid:"b"},{sid:"c"}], stns=[{id:"general"},{id:"x"},{id:"y"}];
  const rk=(S,st)=>({x:[{sid:"b",score:90},{sid:"a",score:80}],y:[{sid:"a",score:95},{sid:"b",score:70}],general:[{sid:"c",score:99}]})[st.id]||[];
  const M=T.cptpStrongMap(S,stns,rk);
  ok("cptpStrongMap: each student's best place in Who is strong where's own ranking (General left out, as that view does)", M.a.sec==="y"&&M.a.rank===1&&M.b.sec==="x"&&M.b.rank===1&&!M.c&&JSON.stringify(T.cptpStrongMap(S,stns,null))==="{}");
  ok("cptpWeights: the defaults (the four equal, Strong in shown not counted), whole numbers 0–3 over them, junk ignored", JSON.stringify(T.cptpWeights(null))==='{"att":1,"pres":1,"tests":1,"study":1,"strong":0}'&&JSON.stringify(T.cptpWeights({teamPick:{w:{att:3,pres:0,tests:1.5,study:9,strong:2,zz:1}}}))==='{"att":3,"pres":0,"tests":1,"study":1,"strong":2}'&&T.cptpEqual(T.cptpWeights({}))&&!T.cptpEqual(T.cptpWeights({teamPick:{w:{att:2}}})));
  const sc=T.cptpScore({att:100,pres:90,tests:null,study:80,strong:50},{att:1,pres:1,tests:1,study:2,strong:0});
  ok("cptpScore: the weighted mean of what the student has (no test → left out; Off → left out) and its working", sc.score===88&&sc.sw===4&&T.cptpWorking(sc)==="(100×1 + 90×1 + 80×2) ÷ 4 = 88"&&T.cptpScore({att:null},T.CPTP_W_DEF).score===null&&T.cptpWorking(T.cptpScore({},T.CPTP_W_DEF))==="nothing to count yet");
  const mk=(name,v,score)=>({name,v,sc:{score}}), R=[mk("Bo",{study:50},70),mk("Al",{study:90},70),mk("Cy",{study:null},null),mk("Di",{study:70},95)];
  const r1=T.cptpRank(R,"rank");
  ok("cptpRank: by the score, ties share a place (A–Z inside), nothing to count → no place, last", r1.map(r=>r.name+r.place).join()==="Di1,Al2,Bo2,Cynull");
  ok("…sort by a column (nulls last, the score breaks ties) or A–Z; the places stay the combined ones", T.cptpRank(R,"study").map(r=>r.name).join()==="Al,Di,Bo,Cy"&&T.cptpRank(R,"name").map(r=>r.name+r.place).join()==="Al2,Bo2,Cynull,Di1");
  const D=T.cptpDays({meetings:{"2026-09-15":{what:"A"},"2026-10-27":{sec:"soils"},"2026-11-10":{what:"C"}}},"2026-10-29");
  ok("cptpDays: today first (not a meeting), then the meetings up to today, newest first; none ahead of today", D.map(d=>d.date+(d.meet?"m":"")).join()==="2026-10-29,2026-10-27m,2026-09-15m"&&T.cptpDays({meetings:{"2026-10-29":{what:"X"}}},"2026-10-29").length===1); }

console.log("\n── Howe, DeWalt, Burris; the kid's and the parent's page: nothing ──");
["howe","dewalt","burris"].forEach(f=>{ const w=W({w:{fam:{familyId:f,roster:[]}}}), T=w.T, chips=[["grid","a"],["cpweek","b"]];
  ok(f+": cptpOn false; the chips come back untouched; no view; nothing written", T.cptpOn()===false&&T.cptpChips(chips)===chips&&chips.length===2&&T.cptpHtml()===""&&T.cptpAttSet("2026-10-27","x",true)===false&&T.cptpWSet("att",2)===false&&w.G.writes.length===0&&w._envs.writes.length===0); });
["kid","parent"].forEach(r=>{ const k=demo(r); ok("the "+r+"'s page: no 🏅 Team picks", !/cptp|Team picks/.test(k.G.content)); });

console.log("\n── 🏅 Team picks in the demo (teacher) ──");
{ const w=demo("teacher"), T=w.T;
  ok("the chip sits right after 📊 Weekly, for the teacher and for Adrienne", /📊 Weekly 🏅 Team picks/.test(chipsOf(w.G.content))&&/📊 Weekly 🏅 Team picks/.test(chipsOf(demo("admin").G.content)), chipsOf(w.G.content));
  const n0=Wr(w).length; let h=view(w,"cpteams"), t=txt(h);
  ok("the title and the line that it is a ranking only: it never picks, saves or announces a team", /🏅 Team picks A ranking to help you pick teams\. It never picks, saves or announces a team/.test(t));
  ok("the class's goals with each one's note: the first goal, then the next one's “top 7 MS teams at Area qualify”", /🎯 Area Mar 22 · State Apr 23 · top 7 MS teams at Area qualify/.test(t), t.slice(0,600));
  ok("the demo banner says the sample scores are invented", /Sample scores\./.test(t));
  const names=rowNames(h), R=T.cptpRows();
  ok("one row per student (8), ranked by the score, each with 🙋 🎤 📝 📊 💪", names.length===8&&(h.match(/class="cptp-row"/g)||[]).length===8&&R.every((r,i)=>i===0||R[i-1].sc.score>=r.sc.score)&&names.join()===R.map(r=>r.name).join()&&/#1 Maya R\. \d+ 🙋 \d of \d 🎤 [\d.]+ \/ 5 📝 /.test(t), names);
  const maya=R.find(r=>r.sid==="ramirez_maya");
  ok("Maya: her presentation (5/5), her test 22/25 with the app's check-in → final, study completion from 📊 Weekly, strong in Forestry #1", T.cptpPresTxt(maya.pres)==="5 / 5"&&/^22\/25 · \d+\/\d+ → \d+\/\d+$/.test(T.cptpTestTxt(maya.tests))&&maya.study.weeks===12&&maya.study.pct>0&&maya.strong&&maya.strong.sec==="forestry"&&maya.strong.rank===1, [maya.pres,maya.tests,maya.study,maya.strong]);
  ok("…study completion is CPWEEK's own cpWeekStudy over the last 12 weeks", JSON.stringify(maya.study)===JSON.stringify(w.G.wkStudy(w.envcStudents().find(s=>s.sid==="ramirez_maya"),12)));
  T.cptpTap("sort","study"); h=w.G.content; const byStudy=T.cptpRows();
  ok("sort by 📊 Study: the rows by study completion, the chip lit, the column in bold; the places stay the combined ones", rowNames(h).join()===byStudy.map(r=>r.name).join()&&byStudy.every((r,i)=>i===0||(byStudy[i-1].v.study==null?r.v.study==null:(r.v.study==null||byStudy[i-1].v.study>=r.v.study)))&&/class="on" aria-pressed="true" onclick="cptpTap\('sort','study'\)"/.test(h)&&/<span class="by">📊 /.test(h)&&byStudy.some((r,i)=>r.place!==i+1));
  T.cptpTap("row","ramirez_maya"); t=txt(w.G.content);
  ok("tapping Maya opens her numbers, each one's share and weight, and the working", t.indexOf("Score = "+T.cptpWorking(maya.sc))>0&&/🙋 Attendance \d of \d \d+% ×1/.test(t)&&/💪 Strong in Forestry #1 \d+% off/.test(t)&&/Check-in → Final is the app’s; only the final counts\./.test(t)&&/Open Maya R\.’s page/.test(t));
  ok("one row open at a time", (T.cptpTap("row","tran_jonah"),(w.G.content.match(/cptp-row open/g)||[]).length===1&&T._cptp.open==="tran_jonah"));
  for(const s of ["rank","att","pres","tests","strong","name","bogus"]) T.cptpTap("sort",s);
  ok("every sort works; an unknown one is ignored; looking and sorting write nothing", T._cptp.sort==="name"&&Wr(w).length===n0);
  w.envcView("grid"); w.envcView("cpteams"); ok("leaving the tab folds the open row", T._cptp.open===""); }

console.log("\n── 🙋 take attendance for a meeting ──");
{ const w=demo("teacher"), T=w.T; let h=view(w,"cpteams"), t=txt(h);
  ok("the meetings up to today, newest first, plus Today; the sample ones before the last are taken (✓), Oct 27 is not", /🙋 Take attendance/.test(t)&&/Today Oct 27 · Soils Oct 13 · Soils ✓ Sep 29 · Forestry ✓ Sep 15 · Forestry ✓/.test(t)&&!/Nov 10/.test(t.slice(t.indexOf("Take attendance"))), t.slice(t.indexOf("Take attendance"),t.indexOf("Take attendance")+300));
  T.cptpTap("att","2026-10-27"); h=w.G.content; t=txt(h);
  ok("picking Oct 27: ✓ Here / ✗ Away per student (8), all not taken, ✓ Everyone else is here", (h.match(/✓ Here<\/button>/g)||[]).length===8&&(h.match(/✗ Away<\/button>/g)||[]).length===8&&/Oct 27: 0 here · 0 away · 8 not taken/.test(t)&&/✓ Everyone else is here/.test(t));
  const before=T.cptpAttOf(w._envc.scores.ramirez_maya.attendance), n0=Wr(w).length;
  ok("tapping ✓ Here for Maya: ONE targeted write, scores/<cid>/ramirez_maya/attendance/2026-10-27 = true, through envsWrite", T.cptpAttSet("2026-10-27","ramirez_maya",true)===true&&(await w.flush(),Wr(w).length===n0+1)&&last(w).op==="update"&&last(w).path==="/"&&JSON.stringify(last(w).val)==='{"scores/'+CID+'/ramirez_maya/attendance/2026-10-27":true}', last(w));
  h=w.G.content; const after=T.cptpAttOf(w._envc.scores.ramirez_maya.attendance);
  ok("…her ✓ lights, the count line moves, her attendance is one more of one more", /class="here" aria-pressed="true" aria-label="Maya R\. here"/.test(h)&&/Oct 27: 1 here · 0 away · 7 not taken/.test(txt(h))&&after.here===before.here+1&&after.of===before.of+1);
  T.cptpAttSet("2026-10-27","tran_jonah",false); await w.flush();
  ok("✗ Away for Jonah: false", last(w).val["scores/"+CID+"/tran_jonah/attendance/2026-10-27"]===false&&w._envc.scores.tran_jonah.attendance["2026-10-27"]===false&&/aria-label="Jonah T\. away" onclick="cptpAttSet\('2026-10-27','tran_jonah',null\)"/.test(w.G.content));
  T.cptpAttSet("2026-10-27","ramirez_maya",null); await w.flush();
  ok("tapping the lit one clears it (null)", last(w).val["scores/"+CID+"/ramirez_maya/attendance/2026-10-27"]===null&&!("2026-10-27" in w._envc.scores.ramirez_maya.attendance));
  const n1=Wr(w).length; T.cptpAttRest("2026-10-27"); await w.flush(); const up=last(w).val;
  ok("✓ Everyone else is here: ONE update, true for the 7 not taken, Jonah's ✗ left alone", Wr(w).length===n1+1&&Object.keys(up).length===7&&Object.values(up).every(v=>v===true)&&!("scores/"+CID+"/tran_jonah/attendance/2026-10-27" in up)&&/Oct 27: 7 here · 1 away · 0 not taken/.test(txt(w.G.content)));
  ok("…again: nothing left to take, nothing written", T.cptpAttRest("2026-10-27")===false&&Wr(w).length===n1+1);
  ok("refused: a day after today, a bad date, someone not in the class, a value that isn't true / false / null", T.cptpAttSet("2026-11-10","ramirez_maya",true)===false&&T.cptpAttSet("2026-02-30","ramirez_maya",true)===false&&T.cptpAttSet("2026-10-27","nobody",true)===false&&T.cptpAttSet("2026-10-27","ramirez_maya","yes")===false&&Wr(w).length===n1+1);
  T.cptpTap("att","2026-10-27"); ok("tapping the picked day again closes it", T._cptp.att===""&&!/✓ Here<\/button>/.test(w.G.content)); }

console.log("\n── ⚖️ the weights ──");
{ const w=demo("teacher"), T=w.T; let h=view(w,"cpteams");
  ok("folded: “⚖️ Weights: equal” and the four counted", /▸ ⚖️ Weights: equal/.test(txt(h))&&/🙋 Attend\. ×1 · 🎤 Pres\. ×1 · 📝 Tests ×1 · 📊 Study ×1/.test(txt(h))&&!/cptpWSet/.test(h));
  T.cptpTap("w"); h=w.G.content;
  ok("open: Off · ×1 · ×2 · ×3 for each of the five (Strong in Off by default), Equal greyed while equal", (h.match(/onchange="cptpWSet\('/g)||[]).length===5&&/Off \(shown, not counted\) · default/.test(txt(h))&&/disabled onclick="cptpWEqual\(\)"/.test(h));
  const top0=T.cptpRows()[0].sid, n0=Wr(w).length;
  ok("setting 📊 Study ×3: ONE update of classes/<cid>/teamPick/w/study, by and at", T.cptpWSet("study",3)===true&&(await w.flush(),Wr(w).length===n0+1)&&JSON.stringify(Object.keys(last(w).val))==='["classes/'+CID+'/teamPick/w/study","classes/'+CID+'/teamPick/by","classes/'+CID+'/teamPick/at"]'&&last(w).val["classes/"+CID+"/teamPick/w/study"]===3&&last(w).val["classes/"+CID+"/teamPick/by"]==="uid_teacher_demo"&&last(w).val["classes/"+CID+"/teamPick/at"]===NOW, last(w));
  const m=T.cptpRows().find(r=>r.sid==="ramirez_maya");
  ok("…the ranking re-weighs at once (study counts 3 of 6) and shows “your own”", m.sc.sw===6&&m.sc.parts.find(p=>p.k==="study").w===3&&/Weights: your own/.test(txt(w.G.content)));
  ok("the same value again, a weight above 3 or not whole, an unknown criterion: nothing written", T.cptpWSet("study",3)===false&&T.cptpWSet("study",4)===false&&T.cptpWSet("study",1.5)===false&&T.cptpWSet("luck",1)===false&&Wr(w).length===n0+1);
  T.cptpWEqual(); await w.flush();
  ok("Equal: one update putting back the defaults (only what differs), by and at", JSON.stringify(Object.keys(last(w).val))==='["classes/'+CID+'/teamPick/w/study","classes/'+CID+'/teamPick/by","classes/'+CID+'/teamPick/at"]'&&last(w).val["classes/"+CID+"/teamPick/w/study"]===1&&T.cptpEqual(T.cptpWeights(w._envc.cls))&&T.cptpRows()[0].sid===top0); }

console.log("\n── the specialist button (CPSPECIALIST's, typeof-guarded) ──");
{ const w=demo("teacher",{spec:true}), T=w.T; view(w,"cpteams"); T.cptpTap("row","walker_caleb");
  ok("the open row carries 🏅 Make specialist for their best section", /<i data-spec="walker_caleb\|soils"><\/i>/.test(w.G.content));
  const w2=demo("teacher"); view(w2,"cpteams"); w2.T.cptpTap("row","walker_caleb"); ok("…and nothing without CPSPECIALIST", !/data-spec/.test(w2.G.content)&&/Open Caleb W\.’s page/.test(txt(w2.G.content))); }

console.log("\n── 🔒 CPLOCKS: the team picks switch ──");
{ const w=demo("admin"), T=w.T, L=w.L;
  ok("CPLOCKS gains 🏅 the team picks once, and the bar sits over the tab", L.CPL_PARTS.filter(p=>p.k==="teams").length===1&&L.CPL_VIEW.cpteams==="teams"&&T.cptpLockPart()===0&&L.CPL_PARTS.filter(p=>p.k==="teams").length===1);
  let t=txt(view(w,"cpteams"));
  ok("Adrienne sees the switch over the tab: “The team picks is open to the teacher” · 🔒 Lock", /🔓 The team picks (is|are) open to the teacher/.test(t)&&/cpLockSet\('teams',true\)/.test(w.G.content), t.slice(0,800));
  ok("…and in 🏫 Class setup's lock list", /🏅 The team picks/.test(txt(view(w,"setup"))));
  const n0=Wr(w).length; L.cpLockSet("teams",true); await w.flush();
  ok("locking it: one update of classes/<cid>/locks {teams, byName}", Wr(w).length===n0+1&&last(w).path==="classes/"+CID+"/locks"&&last(w).val.teams===true&&last(w).val.byName==="Adrienne"&&L.cpLocked("teams")===true);
  ok("Adrienne still writes while it is locked", T.cptpCan()===true&&T.cptpAttSet("2026-10-27","ramirez_maya",true)===true);
  w.envsDemoGo("teacher"); t=txt(view(w,"cpteams")); const h=w.G.content, n1=Wr(w).length;
  ok("the teacher: “🔒 Set by Adrienne” over the tab; the ranking still shows", /🔒 Set by Adrienne · The team picks (is|are) locked for your class\. Attendance and the weights are greyed; the ranking still shows\./.test(t)&&(h.match(/class="cptp-row"/g)||[]).length===8);
  T.cptpTap("att","2026-10-27"); T.cptpTap("w");
  ok("…✓ Here / ✗ Away, Everyone else and the weights are greyed", /🙋 Take attendance 🔒/.test(txt(w.G.content))&&(w.G.content.match(/<button class="[^"]*" disabled aria-pressed/g)||[]).length===16&&/<button class="envs-btn" disabled onclick="cptpAttRest/.test(w.G.content)&&(w.G.content.match(/<select class="envs-in" disabled/g)||[]).length===5);
  ok("…and refused in the browser with the toast, nothing written", T.cptpAttSet("2026-10-27","tran_jonah",true)===false&&T.cptpAttRest("2026-10-27")===false&&T.cptpWSet("att",2)===false&&T.cptpWEqual()===false&&Wr(w).length===n1); }

console.log("\n── features.teams off ──");
{ const w=demo("teacher"); w._envc.cls.features=Object.assign({},w._envc.cls.features||{},{teams:false}); w.renderAll(); const T=w.T;
  ok("no 🏅 Team picks chip, no view, no write", !/Team picks/.test(chipsOf(w.G.content))&&T.cptpOn()===false&&T.cptpHtml()===""&&T.cptpAttSet("2026-10-27","ramirez_maya",true)===false);
  w._envc.cls.features.teams=true; w.renderAll(); ok("…on again: the chip is back", /🏅 Team picks/.test(chipsOf(w.G.content))); }

console.log("\n── without CPWEEK or CPLOCKS: still works (typeof-guarded extras) ──");
{ const w=demo("teacher",{wk:false,cpl:false}); const h=view(w,"cpteams"), t=txt(h);
  ok("rows still come, study completion reads –, no lock bar", (h.match(/class="cptp-row"/g)||[]).length===8&&/📊 – /.test(t)&&!/Set by/.test(t)&&w.T.cptpLockPart()===0); }

console.log("\n── the rules (envirothon/SITE_RULES.json) ──");
{ const J=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), R=J.rules, A=R.scores.$cid.$sid.attendance, V=A&&A.$date[".validate"];
  ok("scores/$cid/$sid/attendance/$date: a real date key, true | false", !!V&&/\$date\.matches\(\/\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$\/\)/.test(V)&&/newData\.isBoolean\(\)/.test(V));
  ok("…refused while locks/teams is on (unless admin) and when features/teams is false; the family still reads its own child's scores", /locks\/teams'\)\.val\(\) != true/.test(V)&&/admins\/'\+auth\.uid\)\.val\(\) == true/.test(V)&&/features\/teams'\)\.val\(\) != false/.test(V)&&/familyId/.test(R.scores.$cid.$sid[".read"]));
  const P=R.classes.$cid.teamPick;
  ok("classes/$cid/teamPick: the class's teacher, refused while locks/teams is on", !!P&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(P[".write"])&&/locks\/teams'\)\.val\(\) != true/.test(P[".write"]));
  ok("…w/<att|pres|tests|study|strong> numbers 0–3, by = the writer, at a number, nothing else", /att\|pres\|tests\|study\|strong/.test(P.w.$k[".validate"])&&/>= 0/.test(P.w.$k[".validate"])&&/<= 3/.test(P.w.$k[".validate"])&&/== auth\.uid/.test(P.by[".validate"])&&/isNumber/.test(P.at[".validate"])&&P.$other[".validate"]===false);
  ok("…the keys the block writes match the rule", W().T.CPTP_CRIT.map(c=>c.k).every(k=>new RegExp("^("+"att|pres|tests|study|strong"+")$").test(k)));
  ok("locks/teams is a boolean like every lock; features/teams already allowed", /isBoolean/.test(R.classes.$cid.locks.$k[".validate"])&&/teams/.test(R.classes.$cid.features.$k[".validate"]));
  ok("the _about notes it (2026-10-29, CPTEAMPICK)", /CPTEAMPICK/.test(J._about)&&/attendance\/<YYYY-MM-DD>/.test(J._about)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
