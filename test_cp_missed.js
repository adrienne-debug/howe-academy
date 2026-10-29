/*
 * Node tests — ⚠️ CPMISSED, PR 18 of the class platform (DESIGN_class_platform_2026-10-28.md §6.4.1, §6.4, §8.2, §9, §13 row 18, §14 Q12 /
 * Q18; her words 2026-10-28: "it definitely needs to tell her what is the most missed questions and also include him, and that way she can
 * come up with review things for class, and it will help her to say what they are struggling with").
 *   · where the block sits and how it is hooked (two typeof-guarded console lines, tagged ⚠️ CPMISSED); its only write is the review list;
 *   · the mirror's weak list grows to ≤ 10 fronts a deck (ENVM_WEAK), fronts only;
 *   · the pure parts: cpWeakRank (the class's weak lists added up), cpStruggle (by Key Concept, behind vs still missing it), cpmRec;
 *   · Howe / DeWalt / Burris and the kid's and parent's pages: nothing;
 *   · ⚠️ Most missed in the demo (8 sample students): the chip after 📝 Tests, folded, one fold and one row open, the ranked questions
 *     with who missed and the cards that teach each one, the section chips and the form switch, the weak cards, the struggle rows tied to
 *     the pace, the review list (one set of classes/<cid>/review/<listId> each change), 🖥 Show on screen, 🖨 Print;
 *   · the rule in envirothon/SITE_RULES.json.
 * Uses the world from test_env_site.js (its `o.rev` line injects CPTESTS + CPRESULTS + CPPACE + this block).    run: node test_cp_missed.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const CPT=cut("// CPTESTS_START","// CPTESTS_END"), CPR=cut("// CPRESULTS_START","// CPRESULTS_END"), CPP=cut("// CPPACE_START","// CPPACE_END"), CPM=cut("// CPMISSED_START","// CPMISSED_END");
const API="CPM_BEHIND, CPM_LIST_MAX, _cpm, cpmOn, cpmChips, cpmFoldAll, cpWeakRank, cpStruggle, cpmQs, cpmWs, cpmLearn, cpmData, cpmDemoSeed, cpmTap, cpmLists, cpmCur, cpmItems, cpmIn, cpmRec, cpmSave, cpmToggle, cpmAddMany, cpmGroupAdd, cpmRename, cpmPickList, cpmNewList, cpmItem, cpmShow, cpmShowNav, cpmShowAns, cpmShowHtml, cpmPrintHtml, cpmHtml";
const REV=o=>[CPT,CPR,o.pace===false?"":CPP,o.cpm===false?"":CPM+"\nG.cpm={ "+API+" };","G.cpr={ cprMostMissed, cprAll };","G.env={ envSummary };"].join("\n");
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o)},o.w||{})); w.M=w.G.cpm||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const txt=h=>String(h).replace(/<[^>]+>/g," ").replace(/\s+/g," ");
const chipsOf=h=>{ const i=h.indexOf('<div class="envs-chips">'), j=h.indexOf("</div>",i); return txt(h.slice(i,j)).trim(); };

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPMISSED_START"), b=src.indexOf("// CPMISSED_END");
  ok("one CPMISSED block, immediately after CPRESULTS_END", a>0&&b>a&&src.indexOf("// CPMISSED_START",a+1)<0&&src.slice(src.indexOf("// CPRESULTS_END"),a).trim()==="// CPRESULTS_END");
  const head=CPM.slice(0,1400);
  ok("her words, the date, §6.4.1, §13 row 18 and PR 18 in the header", /most missed questions and also include him/.test(head)&&/what they are struggling with/.test(head)&&/2026-10-28/.test(head)&&/§6\.4\.1/.test(head)&&/§13 row 18/.test(head)&&/PR 18/.test(head));
  ok("the block only declares (nothing runs at boot)", CPM.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/\bcpm[A-Z]\w*\(/.test(l));
  ok("two hook lines outside the block, each typeof-guarded and tagged ⚠️ CPMISSED, both in envConsoleHtml", hooks.length===2&&hooks.every(l=>/typeof cpm\w+==="function"/.test(l)&&/CPMISSED/.test(l))&&(()=>{ const i=src.indexOf("function envConsoleHtml(){"), j=src.indexOf("\n}",i), body=src.slice(i,j); return /typeof cpmChips==="function"\) cpmChips\(chips\);/.test(body)&&/v==="cpmissed"&&typeof cpmHtml==="function"\) h\+=cpmHtml\(\);/.test(body); })(), hooks.map(l=>l.trim().slice(0,90)));
  const lit=src.slice(src.indexOf("function envConsoleHtml(){"),src.indexOf("function envConsoleHtml(){")+3000).split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited", !!lit&&lit.indexOf("cpmissed")<0);
  const code=CPM.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its only write is the review list, through envcWrite (no ref, set, update, remove, envsWrite, envcMulti, db, listener)", !/\.ref\(|\.set\(|\.update\(|\.remove\(|envsWrite|envcMulti|\bdb\b|\.on\(/.test(code)&&(code.match(/envcWrite\(/g)||[]).length===1&&/envcWrite\("classes\/"\+cid\+"\/review\/"\+id,rec\)/.test(code));
  ok("no Envirothon word in its strings (section, pre / post, Key Concept words come from the labels); no Howe kid name; no 🔀", !/["'][^"'\n]*\b(Stations?|station|Check-in|check-in|Key Concepts?|species)\b[^"'\n]*["']/.test(code)&&!/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPM)&&src.indexOf("\u{1F500}")<0); }

console.log("\n── the mirror's weak list: ≤ 10 fronts a deck (was 5) ──");
{ const w=W(), now=w.G.now, items=[]; for(let i=0;i<14;i++) items.push({id:"i"+i,subject:"D",prompt:"Front "+String(i).padStart(2,"0"),tier:"daily",status:"active",drop_count:i+1});
  const s=w.G.env.envSummary("maya",{M:{maya:items},u:{decks:[{key:"D",n:14}]},now}), L=s.weak.D||[];
  ok("ENVM_WEAK is 10, and the comment says so", /ENVM_WEAK=10,/.test(src)&&/weak \(≤10 fronts per deck/.test(src)&&/≤10 per deck \(⚠️ CPMISSED, PR 18/.test(src));
  ok("14 cards with drops → the 10 weakest, most drops first, fronts only {n,m,d,t}", L.length===10&&L[0].n==="Front 13"&&L[9].n==="Front 04"&&L.every(r=>JSON.stringify(Object.keys(r))==='["n","m","d","t"]')); }

console.log("\n── the pure parts ──");
{ const w=W(), M=w.M;
  const S=[{sid:"a",name:"Ann",summary:{weak:{D:[{n:"x",m:3,d:1},{n:"y",m:0,d:1}],E:{0:{n:"z",m:1,d:0}}}}},{sid:"b",name:"Ben",summary:{weak:{D:[{n:"x",m:1,d:0}]}}},{sid:"c",name:"Cal",summary:{}},null];
  const R=M.cpWeakRank(S,{c:{D:[{n:"x",m:2,d:0}]},a:{D:[{n:"x",m:9,d:9}]}});
  ok("cpWeakRank: each front once per student (the summary's row wins over an extra one), misses and drops added up, who has it", JSON.stringify(R.map(r=>[r.deck,r.n,r.m,r.d,r.who.map(x=>x.name).join("+")]))==='[["D","x",6,1,"Ann+Ben+Cal"],["E","z",1,0,"Ann"],["D","y",0,1,"Ann"]]', R.map(r=>[r.deck,r.n,r.m,r.d,r.who.map(x=>x.name).join("+")]));
  ok("…Firebase objects read like arrays; nothing in → nothing out", M.cpWeakRank([],null).length===0&&M.cpWeakRank(null).length===0);
  const g1={key:"s|g0",label:"Soil Genesis"}, g2={key:"s|g1",label:"Soil Properties"}, g3={key:"s|id|0",label:"Loblolly"};
  const byId={a:{sec:"s",kind:"term",g:g1},b:{sec:"s",kind:"fact",g:g1},c:{sec:"s",kind:"term",g:g2},d:{sec:"s",kind:"id",item:"Loblolly",g:g3}};
  const qs=[{key:"s|pre|pre-1",missed:5,took:8,cards:["a","b"]},{key:"s|pre|pre-2",missed:2,took:8,cards:["c","zz"]}], ws=[{c:byId.c,who:[1,2,3,4]},{c:byId.d,who:[1]},{c:null,who:[1,2]}];
  const G=M.cpStruggle(qs,ws,byId,g=>({pct:{"s|g0":30,"s|g1":80,"s|id|0":60}[g.key],est:g.key==="s|g1",n:5}));
  ok("cpStruggle: questions through their cards (once per Key Concept), weak cards by their card, most missed first", JSON.stringify(G.map(g=>[g.label,g.q.length,g.w.length,g.score]))==='[["Soil Properties",1,1,6],["Soil Genesis",1,0,5],["Loblolly",0,1,1]]', G.map(g=>[g.label,g.q.length,g.w.length,g.score]));
  ok("…behind = under CPM_BEHIND (60%) learned; at 60 or more it's 'still missing it'; ≈ when estimated", M.CPM_BEHIND===60&&G.find(g=>g.label==="Soil Genesis").behind===true&&G.find(g=>g.label==="Soil Properties").behind===false&&G.find(g=>g.label==="Loblolly").behind===false&&G.find(g=>g.label==="Soil Properties").est===true&&G[2].id===true);
  const r=M.cpmRec("  Friday review  ",["q:s|pre|pre-1","q:s|pre|pre-1","c:D#o3","bad","x:y","q:"],"uid_t",123);
  ok("cpmRec: her name trimmed, keys only (q: / c:), each once, at and by", JSON.stringify(r)==='{"name":"Friday review","items":["q:s|pre|pre-1","c:D#o3"],"at":123,"by":"uid_t"}');
  ok("…an empty name gets one; at most CPM_LIST_MAX (40) items; a name at most 60 long", M.cpmRec("",[],"u",1).name==="Class review"&&M.cpmRec("x",Array.from({length:50},(_,i)=>"q:s|pre|pre-"+i),"u",1).items.length===40&&M.CPM_LIST_MAX===40&&M.cpmRec("y".repeat(80),[],"u",1).name.length===60); }

console.log("\n── Howe, DeWalt, Burris; the kid's and the parent's pages: nothing ──");
["howe","dewalt","burris"].forEach(f=>{ const w=W({w:{fam:{familyId:f,roster:[]}}}), M=w.M, chips=[["grid","a"],["cptests","b"]];
  ok(f+": cpmOn false; the chips come back untouched; no page; taps and saves do nothing; nothing written", M.cpmOn()===false&&M.cpmChips(chips)===chips&&chips.length===2&&M.cpmHtml()===""&&(M.cpmTap("fold","q"),M._cpm.fold===null)&&(M.cpmToggle("q:a|pre|pre-1"),true)&&w.G.writes.length===0&&w._envs.writes.length===0); });
{ const k=demo("kid"), p=demo("parent");
  ok("the kid's and the parent's pages: no ⚠️ Most missed, cpmOn false (Q12: the parent never sees the class's misses)", k.M.cpmOn()===false&&p.M.cpmOn()===false&&!/cpmTap|Most missed/.test(k.G.content)&&!/cpmTap|Most missed/.test(p.G.content)); }

console.log("\n── ⚠️ Most missed in the demo (teacher) ──");
{ const w=demo("teacher"), M=w.M;
  let h=w.G.content; const ch=chipsOf(h);
  ok("the chip sits right after 📝 Tests, for the teacher and for Adrienne", /Tests ⚠️ Most missed/.test(ch)&&/Tests ⚠️ Most missed/.test(chipsOf(demo("admin").G.content)), ch);
  w.envcView("cpmissed"); h=w.G.content; const t=txt(h);
  ok("it opens folded: four folds (questions, cards, struggle, review list), none open, with their counts", /📝 Most-missed questions \d+ missed by someone top: \d+ of \d+/.test(t)&&/🃏 Most-missed cards · study sittings \+ drills \d+ cards in students’ weak lists/.test(t)&&/🧭 What they’re struggling with by Key Concept · \d+/.test(t)&&/📋 Review list for class 0 items/.test(t)&&!/cpcs-fold open/.test(h), t.slice(0,900));
  ok("the sample banner says the answers are invented; the Howe Academy app's students count", /Sample answers\./.test(t)&&/Howe Academy app/.test(t));
  ok("section chips (All + only sections with misses) and the check-in / final switch, words from the labels", /All stations/.test(t)&&/Forestry/.test(t)&&/Soils/.test(t)&&/Check-in \+ final Check-in Final/.test(t)&&!/Wildlife/.test(t.slice(0,t.indexOf("Sample answers"))));
  const D=M.cpmData(), mm=w.G.cpr.cprMostMissed().filter(x=>x.missed>0);
  ok("the questions are CPRESULTS' ranking (share who missed, then the count), misses only, every form", D.qs.length===mm.length&&D.qs.length>5&&D.qs.every((x,i)=>x.key===mm[i].key&&x.row.id===mm[i].row.id)&&D.qs.every((x,i)=>i===0||x.missed/x.row.took<=D.qs[i-1].missed/D.qs[i-1].row.took));
  ok("Eli P. (on the Howe Academy app, like Lincoln) is counted among who missed", D.qs.some(x=>x.row.wrong.some(y=>y.name==="Eli P.")));
  M.cpmTap("fold","q"); h=w.G.content;
  ok("opening a fold opens only that one; 10 rows, then Show 10 more", (h.match(/cpcs-fold open/g)||[]).length===1&&(h.match(/cpmTap\('row','q:/g)||[]).length===Math.min(10,D.qs.length)&&(D.qs.length<=10||/Show \d+ more · \d+ left/.test(h)));
  const x=D.qs[0], k="q:"+x.key+"|"+x.row.id; ok("a row: the crumb, the question, \"N of M missed\" and the most-picked wrong choice", new RegExp("Forestry check-in · Q"+x.row.n).test(txt(h))&&new RegExp(x.missed+" of "+x.row.took+" missed").test(txt(h)));
  M.cpmTap("row",k); h=w.G.content; let o=txt(h.slice(h.indexOf('cpcs-row open')));
  ok("opened: every choice with how many picked it, ✓ on the right one", x.row.choices.every(c=>o.indexOf(c.slice(0,20))>=0)&&/✓/.test(o));
  ok("…who missed it, with their pick", new RegExp("Who missed it \\("+x.row.wrong.length+"\\)").test(o)&&x.row.wrong.every(y=>o.indexOf(y.name)>=0));
  const cs=(x.row.cards||[]).map(id=>D.M.byId[id]).filter(Boolean);
  ok("…the cards that teach it (or 'No card covers it'), and ＋ Add to review list", (cs.length?/The cards that teach it \(tap one for its back\)/.test(o)&&o.indexOf(cs[0].name.slice(0,30))>=0:/No card covers it/.test(o))&&/＋ Add to review list/.test(o));
  if(cs.length){ M.cpmTap("card",cs[0].id); h=w.G.content; ok("tapping a card opens its back right there", h.indexOf(String(cs[0].def).slice(0,30).replace(/&/g,"&amp;").replace(/</g,"&lt;"))>0&&/cpm-lk[^"]*on/.test(h)); }
  const noCard=D.qs.find(q=>!(q.row.cards||[]).some(id=>D.M.byId[id]));
  if(noCard){ const i=D.qs.indexOf(noCard); for(let n=10;n<=i;n+=10) M.cpmTap("more","q"); M.cpmTap("row","q:"+noCard.key+"|"+noCard.row.id); ok("a question no card covers says so (Show more pages to it)", /No card covers it/.test(txt(w.G.content))); }
  M.cpmTap("fold","w"); h=w.G.content;
  ok("opening the next fold folds the last (one fold, no row open)", (h.match(/cpcs-fold open/g)||[]).length===1&&/id="cpm-f-w"/.test(h)&&M._cpm.row===null);
  ok("weak cards: misses×2 + drops first; 'N misses · K of 8 students'; each mapped to its card", D.ws.length>10&&D.ws.every((w2,i)=>i===0||w2.score<=D.ws[i-1].score)&&/\d+ misses .*\d+ of 8 students/.test(txt(h))&&D.ws.filter(w2=>!w2.c).every(w2=>/Forestry · (Terms|ID)|Soils and Land Use · Terms/.test(w2.deck)));
  ok("the demo's study misses are in memory only: no summary's weak list changed", Object.values(w._envc.students).every(s=>!s.summary||!s.summary.weak||Object.values(s.summary.weak).every(L=>L.length<=3)));
  const wc=D.ws.find(w2=>w2.c); M.cpmTap("row","w:"+wc.deck+"|"+wc.n); o=txt(w.G.content.slice(w.G.content.indexOf("cpcs-row open")));
  ok("an opened weak card: its back, its source, the tests it's on, whose weak list, ＋ Add", o.indexOf(String(wc.c.def).slice(0,25))>=0&&/Source:/.test(o)&&/(On the tests|On no test question)/.test(o)&&/In the weak lists of:/.test(o)&&/＋ Add to review list/.test(o));
  M.cpmTap("fold","g"); h=w.G.content; o=txt(h);
  ok("struggle rows: by Key Concept, missed questions + weak cards, behind vs still missing it (both kinds in the demo)", D.gs.length>5&&/Behind on cards — \d+% of its core learned/.test(o)&&/Learned the cards \(\d+%\) — still missing it/.test(o)&&D.gs.some(g=>g.behind)&&D.gs.some(g=>!g.behind)&&D.gs.every(g=>g.behind===(g.pct<60)));
  const gb=D.gs.find(g=>g.behind&&g.q.length), gs=D.gs.find(g=>!g.behind&&g.q.some(q=>"q:"+q.key!==k));
  M.cpmTap("row","g:"+gb.key); o=txt(w.G.content.slice(w.G.content.indexOf("cpcs-row open")));
  ok("behind: 'check 📅 Pace before reteaching', its questions, a 📅 Pace button", /check 📅 Pace before reteaching/.test(o)&&/Questions:/.test(o)&&/envcView\('pace'\)/.test(w.G.content));
  { const i=D.gs.indexOf(gs); for(let n=8;n<=i;n+=8) M.cpmTap("more","g"); }
  M.cpmTap("row","g:"+gs.key); o=txt(w.G.content.slice(w.G.content.indexOf("cpcs-row open")));
  ok("still missing it: 'review in class', ＋ Add its questions to the review list", /review in class/.test(o)&&/＋ Add its questions to the review list/.test(o));
  ok("the learned share reads the Key Concept's own counts (the demo's, not estimated) for the students who have the section", D.gs.every(g=>g.est===false&&g.n>0));
  // the chips
  M.cpmTap("sec","soils"); const Ds=M.cpmData();
  ok("a section chip: only that section's questions and weak cards; its Key Concepts (a General card that teaches a Soils question comes too); the open fold stays", Ds.qs.length>0&&Ds.qs.every(q=>q.sk==="soils")&&Ds.ws.every(w2=>w2.sec==="soils")&&Ds.gs.every(g=>g.sec==="soils"||(g.w.length===0&&g.q.every(q=>q.x.sk==="soils")))&&M._cpm.fold==="g");
  M.cpmTap("sec","all"); M.cpmTap("form","post"); const Dp=M.cpmData();
  ok("the final switch: final questions only (the weak cards don't change)", Dp.qs.length>0&&Dp.qs.every(q=>q.w==="post")&&Dp.ws.length===D.ws.length);
  M.cpmTap("form","both");
  // the review list
  ok("the review list starts empty: 'Tap ＋ Add to review list'", (M.cpmTap("fold","r"),/Empty\. Tap ＋ Add to review list/.test(txt(w.G.content))));
  const n0=w._envs.writes.length; M.cpmToggle(k); await w.flush();
  const wr=w._envs.writes.slice(n0), L=M.cpmLists();
  ok("＋ Add: ONE set of classes/<cid>/review/<listId> = {name, items, at, by}, through envsWrite (demo: would write)", wr.length===1&&wr[0].op==="set"&&/^classes\/ms-science-2026\/review\/r[a-z0-9]{1,15}$/.test(wr[0].path)&&JSON.stringify(Object.keys(wr[0].val))==='["name","items","at","by"]'&&JSON.stringify(wr[0].val.items)===JSON.stringify([k])&&wr[0].val.by==="uid_teacher_demo"&&/^Class review /.test(wr[0].val.name), wr);
  ok("…and the list is there (the class record the console holds), the row says ✓ in review", L.length===1&&M.cpmIn(k)&&(M.cpmTap("fold","q"),/✓ in review/.test(w.G.content)));
  M.cpmGroupAdd(gs.key); await w.flush(); const n1=M.cpmItems().length;
  ok("＋ Add its questions: every question of that Key Concept, each once, in the same list (one more set)", n1===1+gs.q.filter(q=>"q:"+q.key!==k).length&&w._envs.writes.length===n0+2&&w._envs.writes[n0+1].path===wr[0].path);
  M.cpmToggle(k); await w.flush(); ok("tapping ✓ again takes it off (one set)", !M.cpmIn(k)&&M.cpmItems().length===n1-1&&w._envs.writes.length===n0+3);
  M.cpmRename("Nov 12 class"); await w.flush(); ok("renaming the list saves its name", M.cpmCur().name==="Nov 12 class"&&w._envs.writes[w._envs.writes.length-1].val.name==="Nov 12 class");
  M.cpmTap("fold","r"); o=txt(w.G.content);
  ok("the list fold: its name, numbered items with their crumbs, ✕, 🖥 Show on screen, 🖨 Print", /Review list for class \d+ items Nov 12 class/.test(o)&&/1 [A-Z][a-z]+ (check-in|final) · Q\d+/.test(o)&&/🖥 Show on screen/.test(o)&&/🖨 Print/.test(o)&&/aria-label="Take it off the list"/.test(w.G.content));
  ok("no student's name goes into a list", !/Maya|Jonah|Priya|Caleb|Nora|Theo|Avery|Eli/.test(JSON.stringify(w._envs.writes.filter(x=>/review/.test(x.path)))));
  M._cpm.show={i:0,ans:false}; const s0=txt(M.cpmShowHtml()); M.cpmShowAns(); const s1=txt(M.cpmShowHtml()); M.cpmShowNav(-1); const s2=txt(M.cpmShowHtml());
  const it0=M.cpmItem(M.cpmItems()[0]), itL=M.cpmItem(M.cpmItems()[M.cpmItems().length-1]);
  ok("🖥 Show on screen: one item, big, its choices; Show the answer shows the right letter(s); ← wraps to the last", new RegExp("^ ?1 of "+M.cpmItems().length).test(s0)&&s0.indexOf(it0.front.slice(0,30))>=0&&/Show the answer/.test(s0)&&s1.indexOf(it0.back.slice(0,20))>=0&&/Hide the answer/.test(s1)&&s2.indexOf(itL.front.slice(0,30))>=0&&M._cpm.show.ans===false);
  M.cpmShow(false); ok("✕ Close", M._cpm.show===null&&M.cpmShowHtml()==="");
  const P=M.cpmPrintHtml();
  ok("🖨 Print: a plain sheet, the list's name, each question with its choices and the answer", /^<!doctype html>/.test(P)&&/Nov 12 class/.test(P)&&(P.match(/<li>/g)||[]).length===M.cpmItems().length&&P.indexOf(it0.back.slice(0,20).replace(/&/g,"&amp;"))>0&&/class="a"/.test(P));
  M.cpmNewList(); ok("＋ New list: the next ＋ starts another list; both stay to pick from", M.cpmCur()===null&&(M.cpmToggle(k),await w.flush(),M.cpmLists().length===2&&M.cpmItems().length===1));
  M.cpmPickList(L[0].id); ok("picking a saved list opens it again", M.cpmCur().id===L[0].id&&M.cpmCur().name==="Nov 12 class");
  w.envcView("grid"); w.envcView("cpmissed");
  ok("leaving the tab folds it back", M._cpm.fold===null&&M._cpm.row===null&&!/cpcs-fold open/.test(w.G.content));
  ok("a card item reads its front and back; a gone key reads null", (()=>{ const c=D.ws.find(w2=>w2.c).c, it=M.cpmItem("c:"+c.id); return it&&it.front===c.name&&it.back===c.def&&M.cpmItem("c:nope")===null&&M.cpmItem("q:x|pre|pre-1")===null; })()); }

console.log("\n── without CPPACE: still works (the pace is a typeof-guarded extra) ──");
{ const w=demo("teacher",{pace:false}), M=w.M; w.envcView("cpmissed"); const D=M.cpmData();
  ok("questions, cards and Key Concepts still come", D.qs.length>0&&D.ws.length>0&&D.gs.length>0&&/Most-missed questions/.test(w.G.content)); }

console.log("\n── the rule (envirothon/SITE_RULES.json) ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, C=R.classes.$cid, V=C.review&&C.review.$listId;
  ok("classes/$cid/review: the class's teacher writes (Adrienne through classes/$cid); a list id r…", !!V&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(C.review[".write"])&&/admins/.test(C[".write"])&&/\^r\[a-z0-9\]/.test(V[".validate"]));
  ok("…{name ≤ 60, items: q:/c: keys ≤ 200, at, by = the writer}, nothing else", /length <= 60/.test(V.name[".validate"])&&/\(q\|c\):/.test(V.items.$i[".validate"])&&/<= 200/.test(V.items.$i[".validate"])&&/isNumber/.test(V.at[".validate"])&&/auth\.uid/.test(V.by[".validate"])&&V.$other[".validate"]===false);
  ok("…the ids the console makes pass the id pattern", /^r[a-z0-9]{1,15}$/.test("r"+Date.now().toString(36))); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
