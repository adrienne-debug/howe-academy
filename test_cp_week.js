/*
 * Node tests — 📊 CPWEEK, PR 23 of the class platform (DESIGN_class_platform_2026-10-28.md §8.11, §9, §13 row 23, §14 Q34; the class
 * syllabus 2026-10-28: teams are chosen on "completion of study times — synopsis of studied material once a week").
 *   · where the block sits and how it is hooked (six typeof-guarded lines tagged 📊 CPWEEK); its only writes are the weekly snapshot's;
 *   · the pure parts: ISO weeks, the even split, the day walk (the mirror's own totals), the week record, completion, the synopsis;
 *   · envSummary: days.<date>.by.<section> = {n,c,m,secs} for the site kid AND Lincoln's mirror, and nothing else changes (replay);
 *   · the snapshot: students/<sid>/weeks/<YYYY-Www>, the last 2 finished weeks, once each (sent again only when they change), through
 *     envsWrite on the class site and through the mirror's own app for Lincoln (no planned, no pace; nothing into Howe's database);
 *     nothing in dry run, the demo or while the season is locked;
 *   · 📊 Weekly in the demo (teacher): the chip after ⚠️ Most missed, Last week picked, a row per student, the synopsis, per section, 🖨 Print;
 *   · the parent's 📊 This week: the same synopsis, ◀ ▶; Howe / DeWalt / Burris: nothing; ⚙️ Weekly summary (the target); the rule.
 * Uses the world from test_env_site.js.    run: node test_cp_week.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,700):"")); } };
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const NOW=Date.UTC(2026,9,29,15,0,0);   // Thu Oct 29, 2026: this week is 2026-W44 (Oct 26 – Nov 1), last week 2026-W43
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const CPT=cut("// CPTESTS_START","// CPTESTS_END"), CPR=cut("// CPRESULTS_START","// CPRESULTS_END"), CPP=cut("// CPPACE_START","// CPPACE_END"), SEND=cut("// CPSEND_START","// CPSEND_END"),
  CAL=cut("// CPCAL_START","// CPCAL_END"), CPM=cut("// CPMISSED_START","// CPMISSED_END"), WK=cut("// CPWEEK_START","// CPWEEK_END");
const API="CPWK_ROW, CPWK_FIELDS_SET, _cpwk, cpwkOn, cpwkSite, cpWeekId, cpWeekStart, cpWeekDays, cpWeekShift, cpWeekLabel, cpwkSplit, cpWeekDayAgg, cpWeekSum, cpWeekRec, cpWeekDone, cpwkNorm, cpwkPlanned, cpwkTarget, cpwkFor, cpwkOwn, cpwkWorking, cpwkTests, cpwkStrong, cpWeekSynopsis, cpwkView, cpWeekStudy, cpWeekSnap, cpWeekPub, cpwkDemoSeed, cpwkChips, cpwkTap, cpwkHtml, cpwkPrintHtml, cpWeekParentHtml, cpwkSectHtml";
const REV=o=>[CPT,CPR,CPP,SEND,CAL,CPM,o.wk===false?"":WK+"\nG.wk={ "+API+" };","G.env={ envSummary, envmPublishKid };"].join("\n");
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o),now:NOW},o.w||{})); w.K=w.G.wk||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const txt=h=>String(h).replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ");
const chipsOf=h=>{ const i=h.indexOf('<div class="envs-chips">'), j=h.indexOf("</div>",i); return txt(h.slice(i,j)).trim(); };
const strip=s=>JSON.parse(JSON.stringify(s,(k,v)=>k==="by"?undefined:v));
// a small study log: two sections, a mixed sitting (math cards share the time), a drill day (history: never counted)
const FD="Forestry · Terms", SD="Soils and Land Use · Terms";
const U={decks:[{key:FD,station:"forestry",n:4},{key:SD,station:"soils",n:3}]};
function log(){ const it=(id,deck,result)=>({id,name:id,deck,result});
  return {studyLog:{k:{envirothon:{
      "20261020":{date:"20261020",total:5,correct:3,miss:1,secs:300,items:[it("a",FD,"c"),it("b",FD,"m"),it("c",FD,"shown"),it("d",SD,"c"),it("e",SD,"c")]},
      "20261022":{date:"20261022",total:3,secs:200,sits:[{secs:120},{secs:60}],items:[it("a",FD,"c"),it("f",SD,"m"),it("g",SD,"shown")]},
      "20261027":{date:"20261027",total:2,secs:100,items:[it("a",FD,"c"),it("b",FD,"c")]}},
    daily:{"20261021":{date:"20261021",total:4,secs:400,items:[it("a",FD,"c"),it("m1","Math","c"),it("m2","Math","m"),it("m3","Math","c")]}}}},
    history:{k:{"20261023":{items:[{id:"a",result:"m"}]}}},
    k:[{id:"a",subject:FD,prompt:"a",tier:"weekly",status:"active"},{id:"b",subject:FD,prompt:"b",tier:"daily",status:"active"},{id:"d",subject:SD,prompt:"d",tier:"daily",status:"active"}]}; }

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPWEEK_START"), b=src.indexOf("// CPWEEK_END");
  ok("one CPWEEK block, immediately after CPMISSED_END", a>0&&b>a&&src.indexOf("// CPWEEK_START",a+1)<0&&src.slice(src.indexOf("// CPMISSED_END"),a).trim()==="// CPMISSED_END");
  const head=WK.slice(0,1600);
  ok("the syllabus words, the date, §8.11, §13 row 23 and PR 23 in the header", /completion of study times — synopsis of studied material once a week/.test(head)&&/2026-10-28/.test(head)&&/§8\.11/.test(head)&&/§13 row 23/.test(head)&&/PR 23/.test(head));
  ok("the block only declares (its one load-time line adds ⚙️ Weekly summary to ENVCLASSSET's lists)", WK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l))&&/const CPWK_FIELDS_SET=cpwkFields\(\);/.test(WK));
  const out=src.slice(0,a)+src.slice(b), calls=out.split("\n").filter(l=>/\b(cpwk[A-Z]\w*|cpWeek[A-Z]\w*)\(/.test(l)), hooks=calls.filter(l=>/📊 CPWEEK/.test(l));
  ok("six hook lines outside the block, each typeof-guarded and tagged 📊 CPWEEK", hooks.length===6&&hooks.every(l=>/typeof cp(wk|Week)\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  ok("…any later reader (PR 24's 🏅 Team picks reads cpWeekStudy) calls it typeof-guarded too", calls.every(l=>/typeof cp(wk|Week)\w+==="function"/.test(l)), calls.filter(l=>!/typeof cp(wk|Week)\w+==="function"/.test(l)).map(l=>l.trim().slice(0,90)));
  const fn=n=>{ const i=src.indexOf(n), j=src.indexOf("\n}",i); return src.slice(i,j); };
  ok("…in envSummary (after CPWATCH's line), envmPublishKid, envConsoleHtml (chip + view), envsParentHtml and envClsBodyHtml", /cpWatchSum[\s\S]*cpWeekSum\(kid,out,M,u\)/.test(fn("function envSummary(kid,ctx){"))&&/cpWeekPub\(kid,sid,_envm\.edb\)/.test(fn("function envmPublishKid(kid,force){"))&&/cpwkChips\(chips\)/.test(fn("function envConsoleHtml(){"))&&/v==="cpweek"&&typeof cpwkHtml/.test(fn("function envConsoleHtml(){"))&&/cpWeekParentHtml\(kid\)/.test(fn("function envsParentHtml(){"))&&/cpwkSectHtml\(scope\)/.test(fn("function envClsBodyHtml(")));
  ok("the mirror's publish is still its one update of students/<sid> = {summary, meta}", src.indexOf('ref("students/"+sid).update({summary:s,meta:meta})')>0);
  const lit=src.slice(src.indexOf("function envConsoleHtml(){"),src.indexOf("function envConsoleHtml(){")+3000).split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited; ENVCS_FIELDS / ENVCS_SECTS literals neither", !!lit&&lit.indexOf("cpweek")<0&&src.slice(src.indexOf("const ENVCS_FIELDS=["),src.indexOf("const _envcs=")).indexOf("weekTarget")<0);
  const code=WK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its only writes: the snapshot, through envsWrite on the site or the mirror's app for Lincoln (one set each); no db, no listener, no update/remove", (code.match(/envsWrite\(/g)||[]).length===1&&(code.match(/\.set\(/g)||[]).length===1&&/edb\.ref\(path\)\.set\(rec\)/.test(code)&&/envsWrite\(path,rec,"set"\)/.test(code)&&!/\bdb\b|\.on\(|\.update\(|\.remove\(|envcMulti|envcWrite/.test(code));
  ok("no Envirothon word in its strings (section, check-in / final come from the labels); no Howe kid name; no pronoun in the synopsis; no 🔀", !/["'][^"'\n]*\b(Stations?|station|Check-in|check-in|Key Concepts?|species)\b[^"'\n]*["']/.test(code)&&!/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(WK)&&src.indexOf("\u{1F500}")<0); }

console.log("\n── the pure parts ──");
{ const w=W(), K=w.K;
  ok("cpWeekId: ISO weeks, Monday first (Thu Oct 29 2026 → W44; Sun Nov 1 → W44; Mon Nov 2 → W45; Jan 1 2026 → W01; Jan 1 2027 → 2026-W53)", K.cpWeekId("2026-10-29")==="2026-W44"&&K.cpWeekId("20261101")==="2026-W44"&&K.cpWeekId("2026-11-02")==="2026-W45"&&K.cpWeekId("2026-01-01")==="2026-W01"&&K.cpWeekId("2027-01-01")==="2026-W53"&&K.cpWeekId("2026-13-01")==="");
  ok("cpWeekStart / cpWeekDays / cpWeekShift / cpWeekLabel", K.cpWeekStart("2026-W44")==="2026-10-26"&&K.cpWeekDays("2026-W44").join()==="2026-10-26,2026-10-27,2026-10-28,2026-10-29,2026-10-30,2026-10-31,2026-11-01"&&K.cpWeekShift("2026-W44",-1)==="2026-W43"&&K.cpWeekShift("2026-W53",1)==="2027-W01"&&K.cpWeekLabel("2026-W43")==="Mon Oct 19 – Sun 25"&&K.cpWeekLabel("2026-W44")==="Mon Oct 26 – Sun Nov 1");
  const sp=K.cpwkSplit(10,[["a",1],["b",1],["c",1]]), sp0=K.cpwkSplit(7,[["a",0],["b",0]]);
  ok("cpwkSplit: whole parts that always add up (largest remainder; no weight → all to the first)", sp.a+sp.b+sp.c===10&&sp.a===4&&sp.b===3&&sp0.a===7&&sp0.b===0);
  const L=log(), A=K.cpWeekDayAgg("k",L,U);
  ok("cpWeekDayAgg: study sittings only, the unit's decks only (math left out, the drill day never counts)", JSON.stringify(Object.keys(A).sort())==='["20261020","20261021","20261022","20261027"]'&&!A["20261023"]&&A["20261021"].n===1&&A["20261021"].secs===100);
  ok("…by section {n,c,m,secs} that add up to the day: Oct 20 forestry 3 (2 graded, 1 shown) · soils 2; 300 s shared by cards", JSON.stringify(A["20261020"])==='{"n":5,"c":3,"m":1,"secs":300,"by":{"forestry":{"n":3,"c":1,"m":1,"secs":180},"soils":{"n":2,"c":2,"m":0,"secs":120}}}', A["20261020"]);
  ok("…a day of several sittings counts their time (sits 120 + 60)", A["20261022"].secs===180&&A["20261022"].by.forestry.secs+A["20261022"].by.soils.secs===180);
  const S=w.G.env.envSummary("k",{M:L,u:U,now:NOW});
  ok("…the same totals as the mirror's own days (n, c, m, secs) on every day", Object.keys(S.days).every(k=>["n","c","m","secs"].every(f=>S.days[k][f]===A[k][f])));
  const R=K.cpWeekRec(A,"2026-W43",5,null);
  ok("cpWeekRec: the week's days, minutes, new (shown, not graded), reviewed (answered), missed, per section", JSON.stringify(R)==='{"days":3,"planned":5,"secs":580,"learned":2,"reviewed":7,"missed":2,"bySection":{"forestry":{"days":3,"secs":340,"learned":1,"reviewed":4,"missed":1},"soils":{"days":2,"secs":240,"learned":1,"reviewed":3,"missed":1}}}', R);
  ok("…upTo leaves out the days after today (the week still running)", K.cpWeekRec(A,"2026-W43",3,"2026-10-21").days===2&&K.cpWeekRec(A,"2026-W44",4,"2026-10-26").days===0&&K.cpWeekRec(A,"2026-W44",4,"2026-10-27").days===1);
  ok("cpWeekDone: days (no more than planned) ÷ planned; null with nothing planned", K.cpWeekDone({days:4,planned:5})===80&&K.cpWeekDone({days:6,planned:5})===100&&K.cpWeekDone({days:2,planned:0})===null&&K.cpWeekDone({days:2,planned:null})===null);
  const nm=K.cpwkNorm({days:"3",secs:61.4,learned:2,reviewed:-1,missed:1,bySection:{forestry:{days:1}},pace:"on",junk:1});
  ok("cpwkNorm: a snapshot read back: numbers only, empties filled, a known pace kept", nm.days===3&&nm.secs===61&&nm.reviewed===0&&nm.planned===null&&nm.bySection.forestry.secs===0&&nm.pace==="on"&&!("junk" in nm)&&!("pace" in K.cpwkNorm({days:1,pace:"fast"})));
  const T=K.cpwkStrong({bySection:{a:{reviewed:40,missed:4},b:{reviewed:9,missed:0},c:{reviewed:20,missed:1}}});
  ok("cpwkStrong: the best share right with at least 10 answered", T==="c"&&K.cpwkStrong({bySection:{a:{reviewed:9,missed:0}}})===null);
  const sec=x=>({forestry:"Forestry",soils:"Soils"})[x]||x;
  const syn=K.cpWeekSynopsis({name:"Maya R.",rec:{days:4,planned:5,secs:3120,learned:31,reviewed:118,missed:14},strong:"forestry",working:["Soil Genesis"],pace:{k:"on",goal:"Area"},tests:[],secName:sec,word:x=>x});
  ok("cpWeekSynopsis: the design's example, in plain sentences", syn==="Maya studied 4 of 5 planned days (52 min). Met 31 new cards and reviewed 118, missing 14. Strongest: Forestry. Working on: Soil Genesis. On pace for Area.", syn);
  const s2=K.cpWeekSynopsis({name:"Jonah",rec:{days:6,planned:5,secs:0,learned:1,reviewed:0,missed:0},cur:true,tests:[{sec:"soils",w:"Check-in",right:8,n:15},{sec:"forestry",w:"Final",right:14,n:15,grad:true}],pace:{k:"behind",t:"▼ needs 26 a day",goal:"Area"},secName:sec,word:x=>x});
  ok("…more days than planned, so far, the tests taken, behind with the reason", s2==="Jonah studied 6 days so far, more than the 5 planned (0 min). Met 1 new card and reviewed 0. Took the Soils check-in (8 of 15). Took the Forestry final (14 of 15) and passed it. Behind pace for Area (needs 26 a day).", s2);
  ok("…no study, no plan, no record", K.cpWeekSynopsis({name:"Theo K.",rec:{days:0,planned:5}})==="Theo studied 0 of 5 planned days."&&K.cpWeekSynopsis({name:"Eli",rec:{days:2,planned:null,secs:120,learned:0,reviewed:3,missed:0}})==="Eli studied 2 days (2 min). Met 0 new cards and reviewed 3, missing 0."&&/no study record reaches back/.test(K.cpWeekSynopsis({name:"Eli",rec:null})));
  ok("…never a pronoun", [syn,s2].every(t=>!/\b(she|he|her|his|him|they|their|them)\b/i.test(t))); }

console.log("\n── envSummary: days.<date>.by.<section>, the site kid and Lincoln's mirror; nothing else moves ──");
for(const fam of [FAM,{familyId:"howe",roster:[]}]){ const L=log(), A=W({w:{fam}}), B=W({wk:false,w:{fam}});
  const a=A.G.env.envSummary("k",{M:L,u:U,now:NOW}), b=B.G.env.envSummary("k",{M:L,u:U,now:NOW}), who=fam.edition?"the site kid":"Howe (Lincoln's mirror)";
  ok(who+": every day gains by.<section> = {n,c,m,secs} adding up to the day", Object.keys(a.days).length===4&&Object.keys(a.days).every(k=>{ const d=a.days[k], B2=Object.values(d.by); return B2.length&&["n","c","m","secs"].every(f=>B2.reduce((s,x)=>s+x[f],0)===d[f])&&B2.every(x=>JSON.stringify(Object.keys(x))==='["n","c","m","secs"]'); }));
  ok(who+": REPLAY — without the by split the summary is exactly the old one (byDeck, weak, streak, days, tests)", JSON.stringify(strip(a))===JSON.stringify(strip(b))&&JSON.stringify(a)!==JSON.stringify(b)&&!("by" in (Object.values(b.days)[0]||{})));
  ok(who+": counts only, the unit's sections only (no card, no other subject); Howe's records untouched, nothing written", !/Math|"m1"|"a"/.test(JSON.stringify(a.days))&&A.G.writes.length===0&&JSON.stringify(L)===JSON.stringify(log())); }

console.log("\n── the snapshot: students/<sid>/weeks/<YYYY-Www> ──");
{ const L=log(), mk=fam=>W({w:{fam,masteryData:L,unitStudies:{nc_envirothon:Object.assign({id:"nc_envirothon"},U)}}});
  // Lincoln: through his mirror's own app; no planned, no pace
  const w=mk({familyId:"howe",roster:[]}), K=w.K, sent=[], edb={ref(p){ return {set(v){ sent.push([p,v]); return Promise.resolve(); }}; }};
  const S=K.cpWeekSnap("k","howe_k",L,U,"2026-10-29");
  ok("cpWeekSnap: the last 2 finished weeks (W43, W42), from the whole study log", JSON.stringify(Object.keys(S))==='["2026-W43","2026-W42"]'&&S["2026-W43"].days===3&&S["2026-W42"].days===0);
  const n=K.cpWeekPub("k","howe_k",edb);
  ok("Lincoln (Howe): ONE set per week through the mirror's app, at students/howe_k/weeks/<wk>", n===2&&sent.length===2&&sent.every(x=>/^students\/howe_k\/weeks\/2026-W4[23]$/.test(x[0])));
  const r43=(sent.find(x=>/W43$/.test(x[0]))||[])[1]||{};
  ok("…counts only: {days, secs, learned, reviewed, missed, bySection}, no planned, no pace (Howe has no class calendar or plan)", JSON.stringify(Object.keys(r43))==='["days","secs","learned","reviewed","missed","bySection"]'&&r43.days===3&&r43.reviewed===7&&JSON.stringify(Object.keys(r43.bySection))==='["forestry","soils"]');
  ok("…nothing into Howe's database (the shared fake db saw no write), his records untouched", w.G.writes.length===0&&JSON.stringify(L)===JSON.stringify(log()));
  ok("…sent again only when a week changes (a hash per week in HA_LS)", K.cpWeekPub("k","howe_k",edb)===0&&sent.length===2&&/2026-W43/.test(w.HA_LS.getItem("ha_cpwk_howe_k")));
  L.studyLog.k.envirothon["20261023"]={date:"20261023",total:1,secs:30,items:[{id:"b",name:"b",deck:FD,result:"c"}]};
  ok("…a late sitting changes last week → that week alone goes again", K.cpWeekPub("k","howe_k",edb)===1&&sent.length===3&&/W43$/.test(sent[2][0])&&sent[2][1].days===4);
  const wd=W({w:{fam:{familyId:"howe",roster:[]},dry:true,masteryData:log(),unitStudies:{nc_envirothon:Object.assign({id:"nc_envirothon"},U)}}}), sd=[];
  ok("dry run: nothing", wd.K.cpWeekPub("k","howe_k",{ref(p){ return {set(v){ sd.push(p); return Promise.resolve(); }}; }})===0&&sd.length===0);
  w._envm.locked=true; L.studyLog.k.envirothon["20261019"]={date:"20261019",total:1,secs:30,items:[{id:"b",name:"b",deck:FD,result:"c"}]};
  ok("the season locked: nothing", K.cpWeekPub("k","howe_k",edb)===0&&sent.length===3); w._envm.locked=false;
  const fails=[], edbF={ref(p){ return {set(v){ fails.push(p); return Promise.reject(new Error("PERMISSION_DENIED")); }}; }}, w2=mk({familyId:"howe",roster:[]});
  w2.K.cpWeekPub("k","howe_k",edbF); await w2.flush();
  ok("a refused write is forgotten, so the next publish sends it again", fails.length===2&&!/2026-W43/.test(w2.HA_LS.getItem("ha_cpwk_howe_k")||"")&&(w2.K.cpWeekPub("k","howe_k",edbF),fails.length===4));
  // the class site: through envsWrite, with planned (the family's study days)
  const ws=mk(FAM); const m=ws.K.cpWeekPub("k","envirothon_k",null), wr=ws.G.writes.filter(x=>/weeks/.test(x[1]));
  ok("the class site: through envsWrite, one set per week, with planned (Mon–Fri: 5)", m===2&&wr.length===2&&wr.every(x=>x[0]==="set"&&/^students\/envirothon_k\/weeks\/2026-W4[23]$/.test(x[1]))&&wr.every(x=>x[2].planned===5));
  const wdm=demo("parent"); ok("the demo: nothing is sent", wdm.K.cpWeekPub("maya","ramirez_maya",edb)===0&&!wdm._envs.writes.some(x=>/weeks/.test(x.path))); }

console.log("\n── Howe, DeWalt, Burris; the kid's page: nothing ──");
["howe","dewalt","burris"].forEach(f=>{ const w=W({w:{fam:{familyId:f,roster:[]}}}), K=w.K, chips=[["grid","a"],["cpmissed","b"]];
  ok(f+": cpwkOn false; the chips come back untouched; no view, no parent card, no Class settings section; nothing written", K.cpwkOn()===false&&K.cpwkChips(chips)===chips&&chips.length===2&&K.cpwkHtml()===""&&K.cpWeekParentHtml("k")===""&&K.cpwkSectHtml("class")===""&&w.G.writes.length===0); });
{ const k=demo("kid"); ok("the kid's page: no 📊 Weekly, no This week", !/cpwkTap|This week|Weekly study/.test(k.G.content)); }

console.log("\n── 📊 Weekly in the demo (teacher) ──");
{ const w=demo("teacher"), K=w.K;
  let h=w.G.content; const ch=chipsOf(h);
  ok("the chip sits right after ⚠️ Most missed, for the teacher and for Adrienne", /Most missed 📊 Weekly/.test(ch)&&/Most missed 📊 Weekly/.test(chipsOf(demo("admin").G.content)), ch);
  w.envcView("cpweek"); h=w.G.content; let t=txt(h);
  ok("it opens on Last week (Mon Oct 19 – Sun 25), with 8 week chips (This week, Last week, Oct 12 …)", K._cpwk.wk==="2026-W43"&&/Mon Oct 19 – Sun 25/.test(t)&&(h.match(/cpwkTap\('wk'/g)||[]).length===8&&/This week Last week Oct 12 Oct 5/.test(t)&&/class="on" onclick="cpwkTap\('wk','2026-W43'\)"/.test(h));
  ok("the target line: completion = days ÷ planned, target 80%, how many met it; 🖨 Print the class", /Completion = days studied ÷ the family’s planned study days · target 80%/.test(t)&&/\d of 8 met it/.test(t)&&/🖨 Print the class/.test(t));
  const S=w.envcStudents(), V=S.map(s=>K.cpwkView(s,"2026-W43"));
  ok("one row per student (8), each folded, with days of planned, minutes, new, reviewed, missed", (h.match(/class="cpwk-row"/g)||[]).length===8&&V.every(v=>t.indexOf(v.name)>=0)&&/\d of 5 d (✓|·) \d+% · \d+ min · \d+ new · \d+ reviewed · \d+ missed/.test(t));
  const maya=V.find(v=>v.sid==="ramirez_maya");
  const mrow=w._envc.students.ramirez_maya, mdays=K.cpWeekRec(mrow.summary.days,"2026-W43",5,null);
  ok("Maya last week: 7 days studied (5 planned) = 100% ✓, a section split, new cards; the snapshot her app would have sent = her summary's days", maya.rec.days===7&&maya.rec.planned===5&&maya.rec.from==="week"&&maya.rec.learned>0&&Object.keys(maya.rec.bySection).length>=2&&maya.pct===100&&maya.met===true&&["days","secs","learned","reviewed","missed"].every(f=>mdays[f]===maya.rec[f])&&JSON.stringify(mdays.bySection)===JSON.stringify(maya.rec.bySection), maya.rec);
  ok("…the pace verdict (📅 Pace's own), her struggle areas (2), on the row", !!maya.pace&&/on|ahead|behind/.test(maya.pace.k)&&maya.working.length===2&&new RegExp("Working on: "+maya.working.join(" · ").replace(/[()]/g,".")).test(t));
  K.cpwkTap("row","ramirez_maya"); h=w.G.content; t=txt(h.slice(h.indexOf('<div class="cpwk-row open"')));
  ok("tapping Maya opens the synopsis: plain sentences from the numbers", new RegExp("^ ?▾ Maya R\\.").test(t)&&t.indexOf("Maya studied 7 days, more than the 5 planned ("+Math.round(maya.rec.secs/60)+" min). Met "+maya.rec.learned+" new cards and reviewed "+maya.rec.reviewed+", missing "+maya.rec.missed+".")>=0&&/Working on: /.test(t)&&/(On|Ahead of|Behind) pace for /.test(t), t.slice(0,400));
  ok("…and the same numbers per section (days, min, new, reviewed, missed)", /cpwk-sec/.test(h)&&/Forestry \d+ \d+ \d+ \d+ \d+/.test(t)&&/section days min new reviewed missed/i.test(t)||/Station days min new reviewed missed/.test(t));
  ok("one row open at a time", (K.cpwkTap("row","tran_jonah"),(w.G.content.match(/cpwk-row open/g)||[]).length===1&&K._cpwk.open==="tran_jonah"));
  K.cpwkTap("wk","2026-W44"); t=txt(w.G.content);
  ok("This week: 'so far', planned days up to today (Mon–Thu: 4), the row folded again", /Mon Oct 26 – Sun Nov 1 · so far/.test(t)&&K.cpwkView(w.envcStudents().find(s=>s.sid==="ramirez_maya"),"2026-W44").rec.planned===4&&K._cpwk.open==="");
  K.cpwkTap("wk","2026-W40"); const m40=K.cpwkView(w.envcStudents().find(s=>s.sid==="ramirez_maya"),"2026-W40");
  ok("an older week reads the sample snapshot (students/<sid>/weeks), with its pace", m40.rec.from==="week"&&m40.rec.planned>0&&!!m40.pace&&/2026-W40/.test(JSON.stringify(Object.keys(w._envc.students.ramirez_maya.weeks))));
  ok("the demo banner says the older weeks are invented; nothing written", /Sample weeks\./.test(txt(w.G.content))&&!w._envs.writes.some(x=>/weeks/.test(x.path)));
  const P=K.cpwkPrintHtml("2026-W43");
  ok("🖨 Print: a plain sheet, the week, every student with the synopsis and the section numbers", /^<!doctype html>/.test(P)&&/Mon Oct 19 – Sun 25/.test(P)&&V.every(v=>P.indexOf(v.name.replace(/&/g,"&amp;"))>0)&&P.indexOf("Maya studied 7 days, more than the 5 planned")>0&&(P.match(/<table>/g)||[]).length>=5);
  const st=K.cpWeekStudy(w.envcStudents().find(s=>s.sid==="ramirez_maya"));
  ok("cpWeekStudy (PR 24 reads it): completion over the finished weeks with a plan → {pct, met, weeks}", st.weeks>=10&&st.pct>0&&st.pct<=100&&st.met>=0&&st.met<=st.weeks);
  w.envcView("grid"); w.envcView("cpweek"); ok("leaving the tab folds the open row", K._cpwk.open===""); }

console.log("\n── the parent's 📊 This week ──");
{ const w=demo("parent"), K=w.K; let h=w.G.content, t=txt(h);
  ok("the parent page shows 📊 This week, the week's dates, the synopsis, the completion line", /📊 This week/.test(t)&&/Mon Oct 26 – Sun Nov 1/.test(t)&&/Maya studied \d of 4 planned days so far/.test(t)&&/Study completion: \d+% of the planned days so far · the class aims for 80%/.test(t));
  ok("…◀ for an earlier week, ▶ greyed on this week", /aria-label="An earlier week"/.test(h)&&/aria-label="A later week" disabled/.test(h));
  K.cpwkTap("pb",1); t=txt(w.G.content); const v=K.cpwkView(Object.assign({sid:"ramirez_maya"},w._envc.students.ramirez_maya),"2026-W43",{name:"Maya",parent:true});
  const tv=K.cpwkView(Object.assign({sid:"ramirez_maya"},w._envc.students.ramirez_maya),"2026-W43",{name:"Maya"}), noW=x=>x.replace(/ Working on: [^.]*\./,"");
  ok("◀ Last week: the same synopsis the teacher sees (the numbers, strongest, tests, pace — the parent's Working on is from the weak cards only)", /📊 Last week/.test(t)&&t.indexOf(v.text)>=0&&/Maya studied 7 days, more than the 5 planned/.test(v.text)&&noW(v.text)===noW(tv.text)&&/pace for Area\./.test(v.text), [v.text,tv.text]);
  for(let i=0;i<10;i++) K.cpwkTap("pb",1); ok("back 7 weeks at most", K._cpwk.pback===7);
  ok("no class question analysis on the parent's page (Q12): the struggle areas come from the weak cards", !/Most missed|cpmTap/.test(w.G.content)); }

console.log("\n── ⚙️ Class settings ▸ Weekly summary ──");
{ const w=demo("teacher"), K=w.K;
  ok("the row is added from the block, once: weekTarget, 1–100, default 80, saved under study", K.CPWK_FIELDS_SET===true&&w.ENVCS_FIELDS.filter(f=>f.name==="weekTarget").length===1&&w.ENVCS_SECTS.filter(s=>s[0]==="week").length===1&&K.CPWK_ROW.part==="study"&&K.CPWK_ROW.def===80);
  w.envcView("classset"); const t=txt(w.G.content);
  ok("⚙️ Class settings shows Weekly summary ▸ Study completion target (%)", /Weekly summary/.test(t)&&/Study completion target \(%\)/.test(t));
  const n0=w._envs.writes.length; w.envClsSave("class","weekTarget",70); await w.flush(); const wr=w._envs.writes.slice(n0);
  ok("saving it: one targeted write at classes/<cid>/settings/study (ENVCLASSSET's own save)", wr.length===1&&/^classes\/ms-science-2026\/settings\/study/.test(wr[0].path)&&JSON.stringify(wr[0].val).indexOf('70')>=0, wr);
  w.envcView("cpweek"); ok("…and 📊 Weekly reads the new target", K.cpwkTarget("")===70&&/target 70%/.test(txt(w.G.content)));
  ok("a student page doesn't repeat it (the class's number)", K.cpwkSectHtml("ramirez_maya")===""); }

console.log("\n── without CPPACE / CPMISSED: still works (typeof-guarded extras) ──");
{ const src2=REV({}).replace(CPP,"").replace(CPM,""), w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:src2,now:NOW,search:"?demo=1&role=teacher"})); w.envSiteDemoBoot(); w.renderAll(); w.envcView("cpweek");
  ok("rows and the synopsis still come (no pace line; the struggle from the weak cards)", /Weekly study summary/.test(w.G.content)&&(w.G.content.match(/class="cpwk-row"/g)||[]).length===8&&!/pace for/.test(txt(w.G.wk.cpwkView(w.envcStudents()[0],"2026-W43").text))); }

console.log("\n── the rule (envirothon/SITE_RULES.json) ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, S=R.students.$sid, V=S.weeks&&S.weeks.$wk;
  ok("students/$sid/weeks: written like the summary (the family's own login, or admin)", !!V&&S.weeks[".write"]===S.summary[".write"]);
  ok("…$wk is YYYY-Www with days, secs, learned, reviewed, missed; numbers in range; pace ahead|on|behind; nothing else", /\[0-9\]\{4\}-W\[0-9\]\{2\}/.test(V[".validate"])&&/hasChildren\(\['days','secs','learned','reviewed','missed'\]\)/.test(V[".validate"])&&/<= 7/.test(V.days[".validate"])&&/<= 7/.test(V.planned[".validate"])&&/isNumber/.test(V.secs[".validate"])&&/ahead\|on\|behind/.test(V.pace[".validate"])&&V.$other[".validate"]===false&&V.bySection.$sec.$other[".validate"]===false);
  ok("…the ids the block makes pass the pattern", /^[0-9]{4}-W[0-9]{2}$/.test(W().K.cpWeekId("2026-10-29"))); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
