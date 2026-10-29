/*
 * Node tests — 💡 CPSUGGEST, PR 16 of the class platform (DESIGN_class_platform_2026-10-28.md §8.4, §6.3, §6.4, §8.6, §9, §13 row 16; her
 * words 2026-10-28: "a pace target that gives her all the data and can manipulate things where she can see where kids need to be and also
 * kind of help her know what she needs, questions to take out, etc.").
 *   · the block and its typeof-guarded hooks (cppSections, cpctModel, cpctDetailHtml; CPPACE's and CPRESULTS's own hook points); its writes
 *     go only through envcWrite / cpctCommit / cpceCommit;
 *   · the live matcher: compile_unit.js's rule, so on every unit question it gives the very links compile_unit.js wrote; her added question
 *     and her edited wording get theirs live; 🔗 Check the links saves her ticks on the item (its ts kept) and takes them off again;
 *   · the item analysis: an opened row shows the linked cards and "No core card covers it";
 *   · 💡 on 📅 Pace (demo): at most 8, Q7 first; Do it opens 📝 Tests at Q7; Wildlife ID: Do it shows the dates moving BEFORE anything is
 *     written, 🙈 Hide = one update of classCards, and the plan counts them out; the student and plan fixes are what-ifs; Not now / Bring back;
 *   · 🔒 CPLOCKS: no Do it on a locked part; Adrienne keeps hers;
 *   · the rules; Howe / no edition: every hook says no.                                              run: node test_cp_suggest.js
 * Uses the world from test_env_site.js; its `o.rev` line injects the blocks this one reads (locks, pace, calendar, send, tests, results).
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const SG=cut("// CPSUGGEST_START","// CPSUGGEST_END");
const BLOCKS=["CPLOCKS","CPPACE","CPCAL","CPSEND","CPTESTS","CPRESULTS"].map(n=>cut("// "+n+"_START","// "+n+"_END")).join("\n");
const API="CPSG_MAX, _cpsg, cpsgGive, cpsgNpd, cpsgCoreOnly, cpsgOn, cpSuggestMatch, cpsgCards, cpSuggestLinks, cpSuggestRowHtml, cpSuggestTickHtml, cpSuggestDecks, cpSuggestHtml, cpsgId, cpsgAnd, cpsgList, cpsgShown, cpsgCtx, cpsgOpen, cpsgHide, cpsgGoTest, cpsgOpenCard, cpsgNotNow, cpsgBack, cpsgAside, cpsgTkOpen, cpsgTk, cpsgTkSave, cpsgTkAuto, cpsgTkFind, cpsgWeak";
const OTHER="cppSections, cppDraft, cppInputs, cpPacePlan, cpPaceFlush, _cpp, _cpct, cpctModel, cpctFind, cpctTap, cpctAddOpen, cpctEditOpen, cpctIn, cpctTick, cpctSave, cpctListHtml, cprAll, cprTap, _cpr";
const REV=o=>BLOCKS+"\n"+(o.sg===false?"":SG+"\nG.sg={ "+API+" };")+"\nG.o={ "+OTHER+" };";
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const NOW=Date.UTC(2026,9,29,15,0,0);
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o),now:NOW},o.w||{})); w.S=w.G.sg||null; w.O=w.G.o; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const settle=w=>{ for(let i=0;i<10;i++){ const n=w.O.cpPaceFlush(); w.renderAll(); if(!n) break; } return w.G.content; };
const pace=(role,o)=>{ const w=demo(role,o); w.envcView("pace"); settle(w); return w; };
const text=h=>String(h).replace(/<[^>]+>/g," ").replace(/\s+/g," ");
const writes=(w,from)=>w._envs.writes.slice(from||0);
const CID="ms-science-2026";

const run=async()=>{
console.log("── the block and its hooks ──");
{ const a=src.indexOf("// CPSUGGEST_START"), b=src.indexOf("// CPSUGGEST_END"), head=SG.slice(0,1400);
  ok("one CPSUGGEST block, with her words, the date, §8.4, §13 row 16 and PR 16 in the header", a>0&&b>a&&src.indexOf("// CPSUGGEST_START",a+1)<0&&/questions to take out/.test(head)&&/2026-10-28/.test(head)&&/§8\.4/.test(head)&&/§13 row 16/.test(head)&&/PR 16/.test(head));
  ok("the block only declares (nothing runs at boot)", SG.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/💡 CPSUGGEST/.test(l));
  ok("its hook lines outside the block are tagged 💡 CPSUGGEST and typeof-guarded", hooks.length>0&&hooks.every(l=>/typeof cpSuggest\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  const inFn=(host,fn)=>{ const i=src.indexOf(host), j=src.indexOf("\n}",i); return i>0&&src.slice(i,j).indexOf('typeof '+fn+'==="function"')>0; };
  ok("…in cppSections (the hidden cards), cpctModel (the live links) and cpctDetailHtml (🔗 Check the links)", inFn("function cppSections(){","cpSuggestDecks")&&inFn("function cpctModel(){","cpSuggestLinks")&&inFn("function cpctDetailHtml(F,it){","cpSuggestTickHtml"));
  ok("CPPACE's and CPRESULTS's hook points call it (cpSuggestHtml under the table, cpSuggestRowHtml on a row)", inFn("function cpPaceHtml(){","cpSuggestHtml")&&inFn("function cprDetailHtml(f,r){","cpSuggestRowHtml"));
  const code=SG.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its writes go only through envcWrite / cpctCommit / cpceCommit (no ref, set, update, remove, listener of its own)", !/\.ref\(|[^p]\.set\(|\.update\(|\.remove\(|\.on\(|envcMulti|\bdb\b/.test(code)&&/envcWrite\(/.test(code)&&/cpctCommit\(/.test(code)&&/cpceCommit\(/.test(code));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(SG)&&src.indexOf("\u{1F500}")<0); }

console.log("\n── the live matcher ──");
{ const w=demo("teacher"), S=w.S; w.envcView("cptests"); const X=S.cpsgCards();
  ok("the class's cards and the sections that have tests are read from 📚 Cards' own index", !!X&&X.C.length>0&&X.T.forestry===true&&!X.T.general);
  let n=0, same=0, bad=[]; Object.keys(LIB.tests).forEach(sk=>["pre","post"].forEach(f=>{ const fm=LIB.tests[sk][f]; if(!fm) return;
    fm.items.forEach(it=>{ n++; const got=S.cpSuggestMatch(it,sk,X.C,X.T), want=Array.isArray(it.cards)?it.cards:[]; if(JSON.stringify(got)===JSON.stringify(want)) same++; else if(bad.length<3) bad.push([sk,f,it.n,got,want]); }); }));
  ok("on every unit question ("+n+") it gives exactly the links compile_unit.js wrote", n>0&&same===n, bad);
  const card=X.C.find(c=>c.kind==="term"&&c.sec==="forestry"&&c.name.length>=6), q={q:"Which of these is the "+card.name.toLowerCase()+"?",choices:["one","two"],ans:0};
  ok("a question naming a term's front links that card (whole words, any case); a near-miss word doesn't", S.cpSuggestMatch(q,"forestry",X.C,X.T).indexOf(card.id)>=0&&S.cpSuggestMatch({q:"x "+card.name.toLowerCase()+"zz",choices:["a","b"],ans:0},"forestry",[card],X.T).length===0);
  ok("a card of another tested section doesn't link; a section with no tests does", S.cpSuggestMatch(q,"soils",[card],X.T).length===0&&S.cpSuggestMatch(q,"soils",[Object.assign({},card,{sec:"general",id:"g#o1"})],X.T).length===1);
  const fact=X.C.find(c=>c.kind==="fact"&&c.sec==="soils"&&c.def.split(" ").length>=3);
  ok("a fact links when its back holds the keyed answer", S.cpSuggestMatch({q:"Pick one.",choices:["nothing here",fact.def],ans:1},"soils",[fact],X.T).length===1&&S.cpSuggestMatch({q:"Pick one.",choices:[fact.def,"nothing"],ans:1},"soils",[fact],X.T).length===0); }
{ const w=demo("teacher"), S=w.S, O=w.O; w.envcView("cptests"); const X=S.cpsgCards(), card=X.C.find(c=>c.kind==="term"&&c.sec==="forestry"&&c.core&&c.name.length>=6);
  O.cpctAddOpen("forestry|pre"); O.cpctIn("q","In your own words, what does "+card.name.toLowerCase()+" mean?"); O.cpctIn("c","It grows",0); O.cpctIn("c","It rests",1); O.cpctTick(0,true); O.cpctSave();
  const F=O.cpctModel().secs.find(s=>s.id==="forestry").forms.find(f=>f.w==="pre"), it=F.items.find(x=>x.added);
  ok("her added question gets its links live (it carried none)", !!it&&it.live===true&&it.ticked===false&&it.cards.indexOf(card.id)>=0&&JSON.stringify(it.cards)===JSON.stringify(it.autoCards));
  const key="forestry|pre|"+it.id; w.renderAll(); let h=w.G.content;
  ok("…saving it opened it", O._cpct.or===key);
  ok("…opened: the cards that cover it (⭐ on core), 'matched live', and 🔗 Check the links", /Cards that cover it: <span class="cpct-lk core">⭐ /.test(h)&&/Matched live from your question/.test(h)&&/cpsgTkOpen\('forestry\|pre\|/.test(h));
  S.cpsgTkOpen(key); h=w.G.content;
  ok("🔗 Check the links: the matched cards ticked, a search box, Save the links", /Tick the cards that teach it/.test(h)&&/type="checkbox" checked onchange="cpsgTk\(/.test(h)&&/id="cpsg-tk-q"/.test(h)&&/cpsgTkSave\(\)/.test(h));
  const other=X.C.find(c=>c.sec==="forestry"&&c.kind==="fact"&&c.id!==card.id); S._cpsg.tk.q=other.name.slice(0,6); w.renderAll();
  ok("…the search finds the section's fronts to tick", w.G.content.indexOf("cpsgTk('"+other.id.replace(/'/g,"\\'"))>=0||/cpsg-tk-res">(<label|<div class="cpcs-meta">No card)/.test(w.G.content));
  const ts0=writes(w).slice(-1)[0].val["items/"+it.id].ts; w.G.now+=3600000;   // an hour later: the save must keep the item's ts
  const before=w._envs.writes.length; it.cards.forEach(id=>S.cpsgTk(id,false)); S.cpsgTk(other.id,true); S.cpsgTkSave();
  const wr=writes(w,before), up=wr[0], rec=up&&up.val["items/"+it.id];
  ok("Save the links: ONE update of classTests/<cid>/forestry/pre — the item with her ticks (and the form's ver)", wr.length===1&&up.op==="update"&&up.path==="classTests/"+CID+"/forestry/pre"&&JSON.stringify(rec.cards)===JSON.stringify([other.id])&&typeof up.val.ver==="number", wr);
  ok("…the item's ts is kept (the results' versions don't move) and by is her own uid", rec.ts===ts0&&up.val.ver>ts0&&rec.by===w._envs.uid, [rec.ts,ts0]);
  const it2=O.cpctFind(O.cpctModel(),key).it;
  ok("…the question now reads her ticks", it2.ticked===true&&JSON.stringify(it2.cards)===JSON.stringify([other.id]));
  S.cpsgTkOpen(key); ok("…'Use the automatic match' is offered once she has ticks", /cpsgTkAuto\(\)/.test(w.G.content));
  const b2=w._envs.writes.length; S.cpsgTkAuto(); const r2=writes(w,b2)[0].val["items/"+it.id];
  ok("Use the automatic match: the ticks come off the item (nothing else of it changes)", !("cards" in r2)&&r2.q===rec.q&&r2.ts===rec.ts&&O.cpctFind(O.cpctModel(),key).it.ticked===false);
  // her edited wording of a unit question
  O.cpctTap("row","forestry|pre|pre-3"); O.cpctEditOpen("forestry|pre|pre-3"); O.cpctIn("q","Which is the "+card.name.toLowerCase()+", in your class's words?"); O.cpctSave();
  const e=O.cpctFind(O.cpctModel(),"forestry|pre|pre-3").it, base=LIB.tests.forestry.pre.items.find(x=>x.n===3);
  ok("her edited wording gets its links live, not the unit wording's", e.edited&&e.live&&e.cards.indexOf(card.id)>=0&&JSON.stringify(e.cards)!==JSON.stringify(base.cards));
  w.renderAll(); ok("…its opened row says so and offers 🔗 Check the links", /Matched live from your wording/.test(w.G.content)&&/cpsgTkOpen\('forestry\|pre\|pre-3'\)/.test(w.G.content));
  const u=O.cpctFind(O.cpctModel(),"forestry|pre|pre-4").it; ok("a unit question she didn't touch keeps compile_unit.js's links", !u.live&&JSON.stringify(u.cards)===JSON.stringify(LIB.tests.forestry.pre.items.find(x=>x.n===4).cards)); }

console.log("\n── the item analysis: the linked cards on each row ──");
{ const w=demo("teacher"), O=w.O; w.envcView("cptests"); w.renderAll(); O.cprTap("open"); O.cprTap("form","forestry|pre"); O.cprTap("row","forestry|pre|pre-7"); const h=w.G.content;
  const r=O.cprAll().by["forestry|pre|pre-7"];
  ok("Q7 opened: 'No core card covers it', its linked cards, and that the match is automatic", r.took>0&&/<span class="cpct-warn">No core card covers it\.<\/span> Linked cards: <span class="cpct-lk">/.test(h)&&/The match is automatic — check before acting/.test(h));
  O.cprTap("row","forestry|pre|pre-3"); ok("a covered question: 'Cards that teach it' with ⭐ on the core ones", /Cards that teach it: <span class="cpct-lk core">⭐ /.test(w.G.content)); }

console.log("\n── 💡 Suggestions on 📅 Pace (demo, the 8 sample students) ──");
{ const w=pace("teacher"), S=w.S, O=w.O; let h=w.G.content;
  const sh=S.cpsgShown(S.cpsgCtx()), items=(h.match(/class="cpsg-it" id="cpsg-/g)||[]).length;
  ok("💡 Suggestions sits under the student table, at most "+S.CPSG_MAX+", each with Not now", /Every student against the plan[^]*id="cpsg"[^]*💡 Suggestions/.test(h)&&items===sh.length&&items>0&&items<=S.CPSG_MAX&&(h.match(/cpsgNotNow\('/g)||[]).length===items);
  ok("…it says plainly that each is only a suggestion and nothing changes by itself", /Each one is only a suggestion/.test(h)&&/Nothing changes by itself/.test(h));
  ok("the first: 'Q7 (Forestry check-in): … and no core card covers it', with its linked cards shown", sh[0].kind==="nocore"&&/^Q7 \(Forestry check-in\): \d+ of \d+ right, and no core card covers it$/.test(sh[0].t)&&/Linked cards: /.test(text(h.slice(h.indexOf('id="cpsg"')))), sh[0].t);
  ok("every question it names: 3+ answers, 40% or fewer right, and no core card", sh.filter(s=>s.kind==="nocore").every(s=>s.r.took>=3&&s.r.pct<=40&&!s.cv.core));
  const wild=sh.find(s=>s.id==="notest~wildlife~id");
  ok("'… Wildlife ID cards are not core and on no test' is there", !!wild&&/^[\d,]+ Wildlife ID cards are not core and on no test$/.test(wild.t), sh.map(s=>s.t));
  const kinds=sh.map(s=>s.kind); ok("the most useful first: the questions, then the cards on no test, then the plan and the students", kinds.indexOf("nocore")<kinds.indexOf("notest")&&kinds.indexOf("notest")<kinds.indexOf("miss")&&kinds.indexOf("miss")<kinds.indexOf("student"));
  // Do it on Q7
  const w0=w._envs.writes.length; w.G.content=""; (new Function("S",sh[0].go.replace(/^(\w+)\(/,"return S.$1(")))(S);
  ok("Do it on Q7: 📝 Tests opens at Q7 (the section, the check-in and the question open), nothing written", w._envc.view==="cptests"&&O._cpct.or==="forestry|pre|pre-7"&&O._cpct.og==="forestry|pre"&&/cpcs-row cpct-row open" id="cpct-h-forestry_pre_pre-7"/.test(w.G.content)&&writes(w,w0).length===0); }
{ const w=pace("teacher"), S=w.S, O=w.O, id="notest~wildlife~id", w0=w._envs.writes.length;
  const deck=()=>O.cppSections().find(s=>s.id==="wildlife").decks.find(d=>/ID/.test(d.key)), n0=deck().n, core0=deck().core;
  S.cpsgOpen(id); const h=w.G.content, panel=text(h.slice(h.indexOf('class="cpsg-buy"'),h.indexOf('</div></div>',h.indexOf('class="cpsg-buy"'))+600));
  const m=/The last new card comes: (\w+ \d+, \d{4}) → (\w+ \d+, \d{4})/.exec(panel), g=S.cpsgShown(S.cpsgCtx()).find(s=>s.id===id).g.cards.length;
  ok("Do it on Wildlife ID: what hiding them buys, worked out BEFORE anything is written", /Hiding these [\d,]+ for your class/.test(panel)&&/of the core cards learned/.test(panel)&&/min a day/.test(panel)&&/Cards to study/.test(panel)&&writes(w,w0).length===0, panel.slice(0,500));
  ok("…the finish date moves: the day the last new card comes is earlier", !!m&&new Date(m[2])<new Date(m[1]), m&&m.slice(1));
  ok("…and only then 🙈 Hide the N for my class (and Cancel)", new RegExp("🙈 Hide the "+g.toLocaleString("en-US")+" for my class").test(h)&&/cpsgHide\('notest~wildlife~id'\)/.test(h)&&/cpsgOpen\(''\)/.test(h));
  S.cpsgHide(id); const wr=writes(w,w0);
  ok("🙈 Hide: ONE multi-path update of classCards/<cid>, every card hidden by her", wr.length===1&&wr[0].op==="update"&&wr[0].path==="classCards/"+CID&&Object.keys(wr[0].val).length===g&&Object.keys(wr[0].val).every(k=>/^Wildlife · ID\/o\d+$/.test(k)&&wr[0].val[k].hide===true&&wr[0].val[k].by===w._envs.uid), wr.map(x=>[x.op,x.path]));
  ok("…the plan counts them out of the deck (its core count stays)", deck().n===n0-g&&deck().core===core0, [n0,deck().n,g]);
  w.envcView("pace"); ok("…and the suggestion is gone", !S.cpsgShown(S.cpsgCtx()).some(s=>s.id===id)&&!/cpsg-notest~wildlife~id/.test(w.G.content)); }
{ const w=pace("teacher"), S=w.S, O=w.O, w0=w._envs.writes.length, ctx=S.cpsgCtx(), st=S.cpsgShown(ctx).find(s=>s.kind==="student");
  ok("a student short of their pace: '<name> needs N new cards a day (~M min) and gets K'", !!st&&/ needs \d+ new cards a day \(~\d+ min\) and gets \d+$/.test(st.t), st&&st.t);
  (new Function("S",st.go.replace(/^(\w+)\(/,"return S.$1(")))(S);
  ok("Do it: their own New cards a day as a what-if, their row open — nothing written until Save", O.cppDraft().stu[st.r.sid]===st.n.n&&O._cpp.open===st.r.sid&&writes(w,w0).length===0&&/What-if: [^<]*a student.s New cards a day/.test(w.G.content));
  const mi=S.cpsgShown(S.cpsgCtx()).find(s=>s.kind==="miss");
  ok("the plan misses the target: '… can't make 95% by <goal> at N a day'", !!mi&&/ can’t make \d+% by \w+ at \d+ a day$/.test(mi.t), mi&&mi.t);
  (new Function("S",mi.go.replace(/^(\w+)\(/,"return S.$1(")))(S);
  ok("Do it: the plan's own fix tried on the bar (a what-if), nothing written", O.cppDraft().npd===mi.need.n&&writes(w,w0).length===0&&/What-if: [^<]*New cards a day/.test(w.G.content)); }
{ const w=pace("teacher"), S=w.S, ctx=S.cpsgCtx(), easy=S.cpsgList(ctx).find(s=>s.kind==="easy");
  ok("a question almost everyone gets right, also on the final: Do it opens the final's question", !!easy&&/is right for almost everyone: \d+ of \d+$/.test(easy.t)&&easy.r.pct>=90&&(new Function("S",easy.go.replace(/^(\w+)\(/,"return S.$1(")))(S)&&w.O._cpct.og===easy.o.key&&w.O._cpct.or===easy.o.key+"|"+easy.tw.id);
  const w2=pace("teacher"), X=w2.S.cpsgCards(), c=X.C.find(x=>x.core&&x.sec==="forestry"&&x.kind==="term"), ST=w2._envc.students, ids=Object.keys(ST).slice(0,3);
  ids.forEach(sid=>{ const sm=ST[sid].summary=ST[sid].summary||{}; sm.weak=Object.assign({},sm.weak||{},{[c.deck]:[{n:c.name,m:3,d:1}]}); });
  const wk=w2.S.cpsgWeak().find(s=>s.c.id===c.id);
  ok("a core card in many students' weak lists: '“<front>” is missed by 3 of N'", !!wk&&new RegExp("is missed by 3 of "+Object.keys(ST).length+"$").test(wk.t));
  w2.S.cpsgOpenCard(c.i); ok("…Do it opens that card in 📚 Cards (its section, its folder, the card)", w2._envc.view==="cpcards"&&/cpcs-r-/.test(w2.G.content)&&w2.G.content.indexOf("cpcsTap('row',"+c.i+")")>=0); }
{ const w=pace("teacher"), S=w.S, id=S.cpsgShown(S.cpsgCtx())[0].id, w0=w._envs.writes.length;
  S.cpsgNotNow(id); await w.flush(); const wr=writes(w,w0);
  ok("Not now: ONE set of classes/<cid>/dismissed/<id> = {by, ts, t}", wr.length===1&&wr[0].op==="set"&&wr[0].path==="classes/"+CID+"/dismissed/"+id&&wr[0].val.by===w._envs.uid&&typeof wr[0].val.ts==="number"&&/no core card covers it/.test(wr[0].val.t), wr);
  w.renderAll(); ok("…it doesn't come back; 'Set aside · 1' lists it", !S.cpsgShown(S.cpsgCtx()).some(s=>s.id===id)&&/Set aside · 1/.test(w.G.content));
  S.cpsgAside(); ok("…opened, with ↩ Bring back", /cpsgBack\('/.test(w.G.content));
  S.cpsgBack(id); await w.flush(); const wb=writes(w,w0+1);
  ok("↩ Bring back: ONE remove of that record, and it is back", wb.length===1&&wb[0].op==="remove"&&wb[0].path==="classes/"+CID+"/dismissed/"+id&&S.cpsgShown(S.cpsgCtx()).some(s=>s.id===id));
  const st=S.cpsgShown(S.cpsgCtx()).find(x=>x.kind==="student"), w1=w._envs.writes.length; S.cpsgNotNow(st.id); await w.flush(); const ws=writes(w,w1)[0];
  ok("a student's suggestion set aside keeps no name or pace in the class record (the class's families read it)", ws&&ws.val.t.indexOf(st.r.name)<0&&!/\d+ new cards/.test(ws.val.t), ws&&ws.val);
  S._cpsg.aside=true; w.renderAll(); ok("…while her own Set aside list still reads it as it stands", w.G.content.indexOf(st.t.replace(/’/g,"’"))>=0||text(w.G.content).indexOf(st.r.name+" needs")>=0);
  ok("ids are safe Firebase keys, stable and distinct", /^[A-Za-z0-9_~-]{1,100}$/.test(S.cpsgId("nocore",["forestry|pre","pre-7"]))&&S.cpsgId("nocore",["forestry|pre","pre-7"])===S.cpsgId("nocore",["forestry|pre","pre-7"])&&S.cpsgId("weak",["a.b","x"])!==S.cpsgId("weak",["a_b","x"])&&S.cpsgId("notest",["wildlife","id"])==="notest~wildlife~id");
  ok("the names read as a list", S.cpsgAnd(["A"],0)==="A"&&S.cpsgAnd(["A","B"],0)==="A and B"&&S.cpsgAnd(["A","B","C"],2)==="A, B, C and 2 more"); }
{ const w=demo("teacher"); ok("the demo writes to no database at all (every write is a toast)", w.G.writes.length===0); }

console.log("\n── 🔒 CPLOCKS: no Do it on a locked part ──");
{ const w=pace("teacher"), S=w.S; w._envc.cls.locks={tests:true,cards:true,byName:"Adrienne"}; w.renderAll(); const h=w.G.content, sh=S.cpsgShown(S.cpsgCtx());
  const q=sh.find(s=>s.kind==="nocore"), c=sh.find(s=>s.kind==="notest");
  ok("tests and cards locked: their suggestions show '🔒 Set by Adrienne' and no Do it (Not now stays)", q.lock==="Adrienne"&&c.lock==="Adrienne"&&/🔒 Set by Adrienne/.test(h)&&h.indexOf(q.go)<0&&h.indexOf(c.go)<0&&/cpsgNotNow\('/.test(h));
  const w0=w._envs.writes.length; ok("…and 🙈 Hide refuses, writing nothing", S.cpsgHide(c.id)===false&&writes(w,w0).length===0);
  w.envcView("cptests"); w.O.cpctAddOpen("forestry|pre"); ok("…🔗 Check the links isn't offered on a locked form", S.cpSuggestTickHtml({key:"forestry|pre",sk:"forestry",w:"pre"},{id:"c-x",added:true,live:true,cards:[],q:"q"}).indexOf("cpsgTkOpen")<0);
  const st=sh.find(s=>s.kind==="student"); ok("the unlocked parts keep their Do it", !!st&&!st.lock&&h.indexOf(st.go)>=0); }
{ const w=pace("admin"), S=w.S; w._envc.cls.locks={tests:true,cards:true,byName:"Adrienne"}; w.renderAll(); const sh=S.cpsgShown(S.cpsgCtx());
  ok("Adrienne (admin) keeps every Do it on her own locks", sh.length>0&&sh.every(s=>!s.lock)&&w.G.content.indexOf(sh[0].go)>=0); }

console.log("\n── the rules ──");
{ const RU=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, D=RU.classes.$cid.dismissed, C=RU.classTests.$cid.$sec.$form.items.$item.cards;
  ok("classes/<cid>/dismissed: the class's teacher writes (Adrienne through the class's own rule), an id of safe characters, by = her own uid", !!D&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(D[".write"])&&/\$id\.matches/.test(D.$id[".validate"])&&/newData\.child\('by'\)\.val\(\) == auth\.uid/.test(D.$id[".validate"])&&D.$id.$other[".validate"]===false&&!!D.$id.t);
  ok("classTests items take `cards`: a short list of card ids", !!C&&/\$i\.matches/.test(C.$i[".validate"])&&/#/.test(C.$i[".validate"])); }

console.log("\n── Howe / no edition: every hook says no ──");
{ const w=W({w:{fam:HOWE}}), S=w.S, items=[{id:"c-1",added:true,q:"cambium",choices:["a","b"],ans:0,cards:[]}], secs=[{id:"x",decks:[{key:"d",n:5,core:2}]}], j=JSON.stringify(items), k=JSON.stringify(secs);
  ok("cpsgOn false; 💡, the row, the ticks: nothing", S.cpsgOn()===false&&S.cpSuggestHtml({d:{},inp:{},plan:null})===""&&S.cpSuggestRowHtml({id:"pre-1",cards:[]},{items:[]})===""&&S.cpSuggestTickHtml({key:"a|pre"},items[0])==="");
  ok("the live links and the deck counts hand back the same objects, untouched", S.cpSuggestLinks("x",items,{})===items&&JSON.stringify(items)===j&&S.cpSuggestDecks(secs)===secs&&JSON.stringify(secs)===k);
  ok("the taps do nothing", S.cpsgNotNow("x")===false&&S.cpsgHide("x")===false&&S.cpsgGoTest("a|pre","pre-1")===false&&w.G.writes.length===0&&w._envs.writes.length===0); }
{ const w=pace("teacher",{sg:false}); ok("📅 Pace without the block: no 💡 (CPPACE's hook is guarded)", !/💡 Suggestions/.test(w.G.content)&&/Every student against the plan/.test(w.G.content)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
