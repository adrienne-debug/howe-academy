/*
 * Node tests for the ✏️ Editor in Chief skill engine — slice 2 (2026-09-20).
 * Her design: the SKILL is the unit, not the book — rule sheet left, that skill's pages right,
 * first book first; Mom grades against the key and logs found / missed / extra.
 *
 *   · score = (found − extra) ÷ total; an extra mark costs him, never below 0
 *   · a skill's pool runs Beginning 1 first, then Beginning 2, exercise pages only
 *   · a printed page lands on the right PDF page, and on the key page where its answers START
 *   · the shape Firebase really returns (no [] / null) doesn't break anything
 *   · a kid's view gets the rules and never the key; Mom's check gets the key and not the rules
 *   · the ✏️ button on a kid's Mastery page is OFF until Mom turns it on
 *
 *   run:  node test_eic.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const sb={window:{},console}; sb.window.window=sb.window; vm.createContext(sb);
vm.runInContext("var window=this.window;"+fs.readFileSync(path.join(__dirname,"eic.js"),"utf8"),sb);
const E=sb.window._eicTest;
// Firebase never stores [] or null — prune the local twins the same way so the tests see the LIVE shape.
function prune(o){ if(Array.isArray(o)) return o.map(prune); if(o&&typeof o==="object"){ const r={}; Object.keys(o).forEach(k=>{ const v=prune(o[k]); if(v===null||v===undefined) return; if(Array.isArray(v)&&!v.length) return; if(typeof v==="object"&&!Array.isArray(v)&&!Object.keys(v).length) return; r[k]=v; }); return r; } return o; }
const dir=path.join(process.env.HOME,"Desktop/HoweCurriculum/eic_tags");
const T={"editor-in-chief-beginning-1":prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_beg1_tags.json"),"utf8"))),
         "editor-in-chief-beginning-2":prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_beg2_tags.json"),"utf8")))};
const B1="editor-in-chief-beginning-1", B2="editor-in-chief-beginning-2";

console.log("score math");
ok("12 found, 2 missed, 1 extra = 79% (not a green)",E.eicPct(12,2,1)===79,E.eicPct(12,2,1));
ok("14 of 14 clean = 100%",E.eicPct(14,0,0)===100);
ok("12 of 14, no extras = 86%",E.eicPct(12,2,0)===86);
ok("more extras than finds floors at 0",E.eicPct(2,10,5)===0);
ok("nothing entered = no score",E.eicPct(0,0,0)===null);
ok("a negative entry = no score",E.eicPct(-1,3,0)===null&&E.eicPct(5,1,-2)===null);

console.log("skills and pools");
const S=E.eicSkills(T);
ok("capitalization then punctuation lead the list",S[0].key==="capitalization"&&S[1].key==="punctuation",S.slice(0,2));
ok("the two books' article lessons are ONE skill",S.filter(s=>/^a_an|^an_and/.test(s.key)).length===1);
ok("23 skills across both books (16 + 18, 11 shared)",S.length===23,S.length);
const cap=E.eicPool(T,"capitalization");
ok("capitalization pool = Beg 1 p2,3 then Beg 2 p3,4,5",JSON.stringify(cap.map(p=>[p.book===B1?1:2,p.page]))==="[[1,2],[1,3],[2,3],[2,4],[2,5]]",cap);
ok("rules ride with their own book (Beg 1 p1 · Beg 2 p1–2)",JSON.stringify(cap[0].rules)==="[1]"&&JSON.stringify(cap[4].rules)==="[1,2]");
const pun=E.eicPool(T,"punctuation");
ok("punctuation pool = Beg 1 p6,7 then Beg 2 p8,9,10",JSON.stringify(pun.map(p=>p.page))==="[6,7,8,9,10]",pun.map(p=>p.page));
ok("no pool ever holds a rule, review or answer page",S.every(s=>E.eicPool(T,s.key).every(p=>(T[p.book].pages["p"+p.page]||{}).role==="exercise")));
ok("every skill has at least two pages (room for two greens)",S.every(s=>E.eicPool(T,s.key).length>=2));

console.log("pages");
ok("Beg 1 printed p2 = PDF page 7",E.eicPdf(T,B1,2)===7);
ok("Beg 2 printed p3 = PDF page 5",E.eicPdf(T,B2,3)===5);
ok("PDF page → printed is the inverse",E.eicPrinted(T,B1,7)===2&&E.eicPrinted(T,B2,5)===3);
ok("last printed page stays inside each PDF (97 / 149)",E.eicPdf(T,B1,92)===97&&E.eicPdf(T,B2,147)===149);
ok("Beg 1 p2 answers start on key p68",E.eicKeyPage(T,B1,2)===68);
ok("Beg 2 p3 answers start on key p100",E.eicKeyPage(T,B2,3)===100);
ok("Beg 2 p19 (Karate Kicks) answers start on key p107",E.eicKeyPage(T,B2,19)===107,E.eicKeyPage(T,B2,19));
ok("a rule page has no key page and no paragraphs",E.eicKeyPage(T,B2,1)===null&&E.eicParagraphs(T,B2,1).length===0);
ok("a page knows its skill; a review page has none",E.eicSkillOf(T,B2,4)==="capitalization"&&E.eicSkillOf(T,B2,31)===null);
ok("Beg 1 'An and A' pages answer to the shared skill",E.eicSkillOf(T,B1,10)==="a_an_and_the");
ok("every exercise page in both books finds a key page",[B1,B2].every(b=>Object.keys(T[b].pages).filter(k=>T[b].pages[k].role==="exercise").every(k=>E.eicKeyPage(T,b,+k.slice(1))>0)));

console.log("log and workbook link");
const L={a:{book:B2,page:3,pct:60,ts:1},b:{book:B2,page:3,pct:90,ts:5},c:{book:B1,page:3,pct:70,ts:9}};
ok("newest sitting for a page wins",E.eicLast(L,B2,3).pct===90);
ok("same page number in the other book is a different page",E.eicLast(L,B1,3).pct===70);
ok("no sittings = nothing",E.eicLast(L,B2,4)===null);
const W=[{id:"x",name:"09758BEPEICBeg1"},{id:"y",name:"Editor in Chief Beginning 2 (photos, Ellis)"},{id:"z",name:"01556BEPReadingDetBeg"}];
ok("name guess finds each book",E.eicWorkbook(W,B1).id==="x"&&E.eicWorkbook(W,B2).id==="y");
ok("Reading Detective is never mistaken for one",E.eicWorkbook([W[2]],B1)===null);
ok("an explicit link beats the guess",E.eicWorkbook(W.concat([{id:"q",name:"scan.pdf",tagsBook:B2}]),B2).id==="q");
ok("two look-alikes = no guess, ask Mom",E.eicWorkbook([W[0],{id:"x2",name:"EIC Beginning 1 copy"}],B1)===null);

console.log("step pools — every other page (her call 9/20)");
const SP=E.eicStepPools(T,"capitalization"), key=a=>a.map(p=>(p.book===B1?"B1":"B2")+"p"+p.page).join(",");
ok("capitalization step 1 = B1p2, B2p3, B2p5",key(SP[1])==="B1p2,B2p3,B2p5",key(SP[1]));
ok("capitalization step 2 = B1p3, B2p4",key(SP[2])==="B1p3,B2p4",key(SP[2]));
const PP=E.eicStepPools(T,"punctuation");
ok("punctuation step 1 = B1p6, B2p8, B2p10 · step 2 = B1p7, B2p9",key(PP[1])==="B1p6,B2p8,B2p10"&&key(PP[2])==="B1p7,B2p9");
ok("no page is in both steps, none is lost",S.every(s=>{const q=E.eicStepPools(T,s.key),all=E.eicPool(T,s.key);return q[1].length+q[2].length===all.length&&!q[1].some(a=>q[2].some(b=>a.book===b.book&&a.page===b.page));}));
ok("a page knows its step",E.eicStepOf(T,B1,2)===1&&E.eicStepOf(T,B1,3)===2&&E.eicStepOf(T,B2,4)===2&&E.eicStepOf(T,B2,5)===1);
ok("a rule page has no step; a review page is step 3 (the reviews, 2026-09-22)",E.eicStepOf(T,B2,1)===null&&E.eicStepOf(T,B2,31)===3);

console.log("the two-greens gate");
const P1=SP[1], sit=(book,page,pct,ts,step)=>({book,page,pct,ts,step:step||1,skill:"capitalization"});
const G=(L,D)=>E.eicGate(L,D||{},"capitalization",1,P1);
let g=G({});
ok("nothing sat: not cleared, next = the first page of the first book",!g.cleared&&!g.empty&&g.streak===0&&g.next.book===B1&&g.next.page===2);
g=G({a:sit(B1,2,90,1)});
ok("one green: streak 1, next = Beg 2 p3",g.streak===1&&!g.cleared&&g.next.book===B2&&g.next.page===3);
g=G({a:sit(B1,2,90,1),b:sit(B2,3,85,2)});
ok("two greens in a row: cleared, nothing next",g.cleared&&g.next===null&&!g.empty);
g=G({a:sit(B1,2,79,1),b:sit(B2,3,85,2)});
ok("79% is not a green — amber then green = streak 1, one page left",g.streak===1&&!g.cleared&&g.next.page===5);
g=G({a:sit(B1,2,90,1),b:sit(B2,3,60,2),c:sit(B2,5,90,3)});
ok("green, amber, green: NOT cleared (not in a row), pool empty → Mom decides",!g.cleared&&g.empty&&g.next===null&&g.streak===1);
ok("exactly 80 counts as green",G({a:sit(B1,2,80,1),b:sit(B2,3,80,2)}).cleared);
ok("a step-2 sitting never feeds step 1's gate",G({a:sit(B1,2,90,1),b:sit(B1,3,95,2,2)}).streak===1);
ok("another skill's sitting never feeds it either",G({a:sit(B1,2,90,1),b:{book:B1,page:6,pct:95,ts:2,step:1,skill:"punctuation"}}).sittings===1);
const Lgag={a:sit(B1,2,90,1),b:sit(B2,3,60,2),c:sit(B2,5,90,3)};
g=G(Lgag,{d:{skill:"capitalization",step:1,action:"redo",ts:4}});
ok("Redo: round 2, pages open again from the first, the earlier green still counts",g.round===2&&!g.empty&&g.next.book===B1&&g.next.page===2&&g.streak===1);
g=G(Object.assign({e:sit(B1,2,88,5)},Lgag),{d:{skill:"capitalization",step:1,action:"redo",ts:4}});
ok("…so one more green after the Redo clears it",g.cleared);
g=G(Lgag,{d:{skill:"capitalization",step:1,action:"moveon",ts:4}});
ok("Move on: cleared, and it says Mom moved him",g.cleared&&g.moved&&g.next===null);
ok("a decision for another skill or step changes nothing",G(Lgag,{d:{skill:"punctuation",step:1,action:"moveon",ts:4},f:{skill:"capitalization",step:2,action:"moveon",ts:5}}).empty);
ok("cleared stays cleared even if a later page goes badly",G({a:sit(B1,2,90,1),b:sit(B2,3,85,2),c:sit(B2,5,40,3)}).cleared);
ok("an empty step pool is never 'out of pages'",!E.eicGate({}, {}, "x", 2, []).empty);

console.log("step 2 — counts covered, opens after step 1");
ok("the four step-2 pages carry their covers (12 · 14 · 13 · 13 circles)",E.eicCover(T,B1,3).length===12&&E.eicCover(T,B1,7).length===14&&E.eicCover(T,B2,4).length===13&&E.eicCover(T,B2,9).length===13);
ok("every cover box is a real box inside the page",[[B1,3],[B1,7],[B2,4],[B2,9]].every(([b,p])=>E.eicCover(T,b,p).every(c=>c.length===4&&c[0]>=0&&c[3]<=1&&c[2]>c[0]&&c[3]>c[1])));
ok("covers hide NUMBERS only: no box is wider than ~3.5% of the page (a word would be)",[[B1,3],[B1,7],[B2,4],[B2,9]].every(([b,p])=>E.eicCover(T,b,p).every(c=>(c[2]-c[0])<0.035)));
ok("a step-1 page and a rule page have no covers",E.eicCover(T,B1,2).length===0&&E.eicCover(T,B2,1).length===0);
const bad={x:{pages:{p1:{cover:[[0.1,0.1,0.2],[0.5,0.5,0.4,0.6],["a",0,1,1],[0.1,0.1,0.2,0.2]]}}}};
ok("malformed boxes are dropped, a good one survives",E.eicCover(bad,"x",1).length===1);
ok("covers survive Firebase handing back objects instead of lists",E.eicCover({x:{pages:{p1:{cover:{0:{0:0.1,1:0.1,2:0.2,3:0.2}}}}}},"x",1).length===1);
const PR=(L,D)=>E.eicProgress(T,L,D||{},"capitalization");
ok("fresh: he is on step 1",PR({}).step===1);
const s1={a:sit(B1,2,90,1),b:sit(B2,3,85,2)};
let pr=PR(s1);
ok("step 1 cleared → step 2, next = Beg 1 p3",pr.step===2&&pr.gate.next.book===B1&&pr.gate.next.page===3);
pr=PR(Object.assign({c:sit(B1,3,90,3,2)},s1));
ok("one green in step 2: one more to go, next = Beg 2 p4",pr.step===2&&pr.gate.streak===1&&pr.gate.next.book===B2&&pr.gate.next.page===4);
pr=PR(Object.assign({c:sit(B1,3,90,3,2),d:sit(B2,4,82,4,2)},s1));
ok("both step-2 pages green → step 3 (reviews)",pr.step===3);
pr=PR(Object.assign({c:sit(B1,3,90,3,2),d:sit(B2,4,70,4,2)},s1));
ok("step 2 has two pages: one miss = out of pages → Mom decides",pr.step===2&&pr.gate.empty);
pr=PR(Object.assign({c:sit(B1,3,90,3,2),d:sit(B2,4,70,4,2)},s1),{r:{skill:"capitalization",step:2,action:"redo",ts:5}});
ok("Redo on step 2 reopens its pages, round 2",pr.step===2&&!pr.gate.empty&&pr.gate.round===2&&pr.gate.next.page===3);
ok("a step-2 green never clears step 1",PR({c:sit(B1,3,95,1,2),d:sit(B2,4,95,2,2)}).step===1);

console.log("index.html hooks");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const i=src.indexOf("function wbOpen("), body=src.slice(i,src.indexOf("\n}",i));
ok("Mom's check view (ans) never also shows the rules",/const rules=\(!ans&&opts&&Array\.isArray\(opts\.rules\)\)/.test(body));
ok("the key still needs Mom's eyes",/\|\|!wbMomEyes\(\)\) ans=0;/.test(body));
ok("rules pane is image-only (no canvas inside it)",!/wb-rules-hold[\s\S]*?<canvas[\s\S]*?id=\\?"wb-hold/.test(body));
ok("📊 Score is Mom-only and EIC-only",src.indexOf('((v.eic&&wbMomEyes()&&window.eicScoreOpen)?btn("📊 Score","eicScoreOpen()"):"")')>0);
ok("kid's ✏️ button is OFF unless mastery/<kid>_settings/eic",src.indexOf('if(((masteryData||{})[masteryKid+"_settings"]||{}).eic) h+=\'<button onclick="eicPanelOpen(')>0);
ok("eic.js is lazy — no <script src> at boot",!/<script[^>]+src=["']eic\.js/.test(src));
const e=fs.readFileSync(path.join(__dirname,"eic.js"),"utf8");
const ee=fs.readFileSync(path.join(__dirname,"eic.js"),"utf8");
ok("Redo / Move on only fire when the pool really ran out, and only for Mom",/function decide\(skill,step,action\)\{\s*if\(busy\|\|!mom\(\)/.test(ee)&&/if\(!g\.empty\) return;/.test(ee));
ok("a step-2 page can't be scored until step 1 is cleared",/eicStepOf\(TK\(wbView\.kid\),bk,printed\)===2&&skill&&!eicProgress\(TK\(wbView\.kid\),logs,decs,skill\)\.g1\.cleared\)\{ toast\(/.test(ee));
ok("Redo never deletes his writing (no workbookWork writes anywhere)",!/workbookWork/.test(ee));
ok("the log line carries the page's real step",/step:eicStepOf\(TK\(wbView\.kid\),bk,printed\)\|\|1/.test(ee));
ok("covers are painted only when it is NOT Mom's eyes",/const cover=\(!wbMomEyes\(\)&&opts&&Array\.isArray\(opts\.cover\)\)/.test(src));
ok("covers sit under the ink canvas and ignore touches",/class=\\?"wb-cover\\?" style=\\?"position:absolute;pointer-events:none;background:#fff/.test(src)&&src.indexOf('class="wb-cover"')<src.indexOf('<canvas id="wb-ink"'));
ok("a kid on an EIC page gets no ◀ ▶",src.indexOf('((v.eic&&!wbMomEyes())?"":btn("◀","wbGo(-1)"))')>0&&src.indexOf('((v.eic&&!wbMomEyes())?"":btn("▶","wbGo(1)"))')>0);
ok("…and wbGo itself refuses for him",/async function wbGo\(d\)\{\s*if\(!wbView\) return;[^\n]*\n\s*if\(wbView\.eic&&!wbMomEyes\(\)\) return;/.test(src));
ok("Reading Detective (no eic tag) keeps its arrows",!/if\(!wbMomEyes\(\)\) return;\s*\/\/ ✏️ EIC/.test(src));
ok("a kid can't open a step-2 page early or without its covers",/if\(step===2&&!mom\(\)\)\{[\s\S]{0,200}g1\.cleared\)\{ toast[\s\S]{0,120}if\(!cover\.length\)\{ toast/.test(ee));
ok("eic.js never writes a whole node",!/db\.ref\("(eic|workbooks|mastery|library)"\)\.(set|update|remove)/.test(e)&&!/db\.ref\("eic\/"\+\w+\)\.(set|remove)/.test(e));
ok("eic.js never touches weeks, curriculum or config",!/db\.ref\([^)]*(week|curriculum|config|settings\/)/.test(e.replace(/_settings/g,"")));

console.log("🗓 the schedule's doorway (her ask 2026-09-22)");
{
  const N=(L,D,m)=>E.eicNextSitting(T,L||{},D||{},!!m);
  let n=N({});
  ok("nothing sat → capitalization, step 1, Beg 1 p2",n&&n.skill==="capitalization"&&n.step===1&&n.book===B1&&n.page===2,n);
  n=N({a:sit(B1,2,90,1)});
  ok("one green → the next capitalization page (Beg 2 p3)",n&&n.skill==="capitalization"&&n.page===3&&n.book===B2,n);
  n=N({a:sit(B1,2,90,1),b:sit(B2,3,90,2)});
  ok("capitalization step 1 cleared → its step-2 page (covers exist for Beg 1 p3)",n&&n.skill==="capitalization"&&n.step===2&&n.book===B1&&n.page===3,n);
  n=N({a:sit(B1,2,90,1),b:sit(B2,3,60,2),c:sit(B2,5,90,3)});
  ok("capitalization pool empty (Mom decides) → the doorway moves to punctuation",n&&n.skill==="punctuation"&&n.step===1,n);
  ok("the card title drops the page numbers",/function eicCardTitle\(t\)\{ const ref=\(typeof taskLessonRef==="function"\)\?taskLessonRef\(t\)/.test(fs.readFileSync(path.join(__dirname,"index.html"),"utf8")));
  const ih=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
  ok("a linked card shows the doorway instead of the book-page link",/const wbRow=\(_wbl&&!_eicL\)\?/.test(ih)&&/eicOpenNextFor\(\\''\+t\.who\+'\\'\)/.test(ih)&&/wbRow\+eicRow\+/.test(ih));
  ok("linked only when the kid's ✏️ switch is on and the card is that kid's Editor in Chief subject",/function eicLinked\(t\)\{ try\{ return !!\(t&&t\.who&&eicIsSubject\(t\.who,t\.subjectKey\)&&/.test(ih));
  ok("Lincoln's subject (key 'conventions', display 'Editor in Chief') counts as Editor in Chief",/function eicIsSubject\(kid,sk\)\{ try\{ if\(sk==="editor_chief"\) return true;[\s\S]{0,200}\/\^\\s\*editor in chief\\b\/i\.test/.test(ih)&&/x\.who===kid&&eicIsSubject\(kid,x\.subjectKey\)/.test(ih));
  ok("saving a score checks off today's card",/if\(typeof eicCheckCard==="function"\) eicCheckCard\(k\);/.test(ee)&&/function eicCheckCard\(kid\)\{[\s\S]{0,500}effectiveDay\(x\)===_todayDay[\s\S]{0,300}finalizeDone\(t\.id,ts,null\)/.test(ih));
}
console.log("✍ Mom's manual marks (her ask 2026-09-22)");
{
  const man=(book,page,pct,ts,step)=>({book,page,pct,ts,step:step||1,skill:"capitalization",manual:true});
  let g=G({a:man(B1,2,100,1),b:man(B2,3,100,2)});
  ok("two pages marked Passed clear step 1, exactly like two scored greens",g.cleared,g);
  g=G({a:man(B1,2,100,1),b:man(B2,3,0,2)});
  ok("Passed then Not yet = streak broken, one page left",!g.cleared&&g.streak===0&&g.next&&g.next.page===5,g);
  g=G({},{d:{skill:"capitalization",step:1,action:"moveon",ts:1,manual:true}});
  ok("'Mark step done' clears the step at any time — no need to run the pool dry",g.cleared&&g.next===null);
  const n=E.eicNextSitting(T,{},{d:{skill:"capitalization",step:1,action:"moveon",ts:1,manual:true}},true);
  ok("…and the doorway moves on to capitalization step 2",n&&n.skill==="capitalization"&&n.step===2,n);
  const t0=E.eicManualTs("2026-09-10"), t1=E.eicManualTs("2026-09-11");
  ok("a back-dated mark sorts by its date (so the streak reads in the order he did them)",t0<t1&&t1<Date.now());
  ok("the ✍ chip and the step-done button are Mom-only",/\(M\?chip\("\\u270D","eicManual\(/.test(ee)&&/if\(cur<3&&M&&!g\.empty\) h\+=/.test(ee));
  ok("a manual 'step done' shows under its skill with a remove that deletes only that one decision",/function delDec\(id\)\{[\s\S]{0,160}decs\[id\]\.manual[\s\S]{0,200}db\.ref\("eic\/"\+kid\+"\/decisions\/"\+id\)\.remove\(\)/.test(ee)&&/eicDelDec\(/.test(ee));
  ok("manual marks write one log line / one decision, never a whole node",/const r=db\.ref\("eic\/"\+kid\+"\/log"\)\.push\(\); r\.set\(rec\)/.test(ee)&&/const r=db\.ref\("eic\/"\+kid\+"\/decisions"\)\.push\(\); r\.set\(rec\)/.test(ee));
}
console.log("🪜 Level 1 + Level 2, each kid's own ladder (2026-09-22)");
{
  const L1="editor-in-chief-level-1", L2="editor-in-chief-level-2";
  const TA=Object.assign({},T,{[L1]:prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_lv1_tags.json"),"utf8"))),[L2]:prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_lv2_tags.json"),"utf8")))});
  ok("Ellis's ladder = Beg 1 → Beg 2 → Level 1",JSON.stringify(E.eicLadder("ellis"))===JSON.stringify([B1,B2,L1]));
  ok("Lincoln's ladder = Beg 1 → Beg 2 → Level 1 → Level 2",JSON.stringify(E.eicLadder("lincoln"))===JSON.stringify([B1,B2,L1,L2]));
  ok("any other kid gets the two Beginning books",JSON.stringify(E.eicLadder("lucy"))===JSON.stringify([B1,B2]));
  const TE=E.eicTagsFor(TA,"ellis"), TL=E.eicTagsFor(TA,"lincoln");
  const capE=E.eicPool(TE,"capitalization"), capL=E.eicPool(TL,"capitalization");
  ok("Ellis's capitalization pool runs Beg 1, Beg 2, then Level 1 — never Level 2",capE.map(p=>p.book).join()===[B1,B1,B2,B2,B2,L1,L1,L1,L1].join(),capE.map(p=>(p.book===L1?"L1":p.book===B1?"B1":p.book===B2?"B2":"L2")+p.page));
  ok("Lincoln's adds Level 2 after Level 1",capL.length===13&&capL.slice(-4).every(p=>p.book===L2)&&capL[9].book===L2);
  const spE=E.eicStepPools(TE,"capitalization");
  ok("adding books never changes which Beginning pages are step 1 or step 2",JSON.stringify(spE[1].slice(0,3).map(p=>p.page))==="[2,3,5]"&&JSON.stringify(spE[2].slice(0,2).map(p=>p.page))==="[3,4]");
  ok("every Level 1 / Level 2 step-2 page carries covers, so a kid can open it",[TE,TL].every(TT=>E.eicSkills(TT).every(s=>E.eicStepPools(TT,s.key)[2].filter(p=>p.book===L1||p.book===L2).every(p=>E.eicCover(TT,p.book,p.page).length>0))));
  ok("in fact every Level 1 / Level 2 editing page carries covers",[L1,L2].every(b=>Object.keys(TA[b].pages).filter(k=>TA[b].pages[k].role==="exercise").every(k=>(TA[b].pages[k].cover||[]).length>0)));
  ok("Level 1 page p9 (Lonesome George's lesson) lands on PDF page 14 and its key starts on p109",E.eicPdf(TE,L1,9)===14&&E.eicKeyPage(TE,L1,9)===109,[E.eicPdf(TE,L1,9),E.eicKeyPage(TE,L1,9)]);
  ok("Level 1's homograph multiple-choice pages are never in a pool",E.eicSkills(TE).every(s=>E.eicPool(TE,s.key).every(p=>!(p.book===L1&&(p.page===89||p.page===90)))));
  ok("Level-only skills show up for Ellis (content, verbs…) but Level 2-only skills don't (clauses and phrases)",E.eicSkills(TE).some(s=>s.key==="content")&&!E.eicSkills(TE).some(s=>s.key==="clauses_and_phrases")&&E.eicSkills(TL).some(s=>s.key==="clauses_and_phrases"));
  ok("EVERY step-2 page on both ladders now carries covers (Beginning books' later skills done 2026-09-22)",[TE,TL].every(TT=>E.eicSkills(TT).every(s=>E.eicStepPools(TT,s.key)[2].every(p=>E.eicCover(TT,p.book,p.page).length>0))));
  ok("the panel lists every skill by default",/showAll=true/.test(ee));
  ok("eic.js reads every pool through the kid's ladder",!/\(tags,/.test(ee)&&/function TK\(k\)\{ return eicTagsFor\(tags\|\|\{\},k\|\|kid\); \}/.test(ee));
}
console.log("🔁 step 3 — the reviews (her \"go to step 3\" 2026-09-22)");
{
  const L1="editor-in-chief-level-1", L2="editor-in-chief-level-2";
  const TA=Object.assign({},T,{[L1]:prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_lv1_tags.json"),"utf8"))),[L2]:prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_lv2_tags.json"),"utf8")))});
  const TE=E.eicTagsFor(TA,"ellis"), TL=E.eicTagsFor(TA,"lincoln"), R="review";
  const tag=p=>(p.book===B1?"B1":p.book===B2?"B2":p.book===L1?"L1":"L2")+"p"+p.page;
  const PE=E.eicReviewPool(TE), PL=E.eicReviewPool(TL);
  ok("Ellis's review pool = every review page on his ladder (18 + 16 + 19)",PE.length===53,PE.length);
  ok("Lincoln's adds Level 2's 19",PL.length===72,PL.length);
  ok("cumulative reviews come first, book by book: Beg 1 p16 leads",tag(PE[0])==="B1p16"&&tag(PE[1])==="B1p17"&&!PE[0].mini,PE.slice(0,3).map(tag));
  const firstMini=PE.findIndex(p=>p.mini);
  ok("…then every Mini Review as reserve (Beg 1 p8 first), never mixed back in",firstMini===31&&tag(PE[firstMini])==="B1p8"&&PE.slice(firstMini).every(p=>p.mini)&&PE.slice(0,firstMini).every(p=>!p.mini),[firstMini,tag(PE[firstMini]||{})]);
  ok("Beginning 2's Final Review and Level 1's Final Review are cumulative",PE.some(p=>tag(p)==="B2p98"&&!p.mini)&&PE.some(p=>tag(p)==="L1p105"&&!p.mini));
  ok("no Level 2 page ever reaches Ellis",!PE.some(p=>p.book===L2));
  ok("every review page is a review page and carries its covers",[PE,PL].every(P=>P.every(p=>(TA[p.book].pages["p"+p.page]||{}).role==="review"&&E.eicCover(TA,p.book,p.page).length>0)));
  ok("no review page is in any skill's pool",E.eicSkills(TL).every(s=>E.eicPool(TL,s.key).every(p=>!PL.some(q=>q.book===p.book&&q.page===p.page))));
  // unlock
  const mv=(skill,step,ts)=>({skill,step,action:"moveon",ts,manual:true});
  const D2={a:mv("capitalization",1,1),b:mv("capitalization",2,2),c:mv("punctuation",1,3),d:mv("punctuation",2,4)};
  ok("locked with nothing done",!E.eicReviews(TE,{},{}).unlocked);
  ok("still locked with capitalization cleared but punctuation not",!E.eicReviews(TE,{},{a:D2.a,b:D2.b,c:D2.c}).unlocked);
  ok("opens once capitalization AND punctuation have both cleared step 2",E.eicReviews(TE,{},D2).unlocked);
  // the count
  ok("said 7, true 6 + 1 = 7 → ok",E.eicCountOk(7,6,1));
  ok("off by one either way is still ok",E.eicCountOk(8,6,1)&&E.eicCountOk(6,6,1));
  ok("off by two is not",!E.eicCountOk(5,6,1)&&!E.eicCountOk(9,6,1));
  ok("no guess is never ok",!E.eicCountOk(null,6,1)&&!E.eicCountOk("",6,1));
  ok("count key = book_pN_rRound (no periods for Firebase)",E.eicCountKey(B1,16,2)==="editor-in-chief-beginning-1_p16_r2");
  // the gate
  const rs=(book,page,pct,ts,countOk,extra)=>Object.assign({book,page,pct,ts,step:3,skill:R},countOk==null?{}:{countOk},extra||{});
  const GR=(L,D)=>E.eicGate(L,D||{},R,3,PE);
  let g=GR({a:rs(B1,16,90,1,false),b:rs(B1,17,95,2,true)});
  ok("90% with the count wrong is NOT a green — streak 1 after the next green",!g.cleared&&g.streak===1&&tag(g.next)==="B1p32",[g.streak,g.next&&tag(g.next)]);
  g=GR({a:rs(B1,16,90,1,true),b:rs(B1,17,85,2,true)});
  ok("two greens in a row with the count right each time clears the reviews",g.cleared);
  g=GR({a:rs(B1,16,100,1,null,{manual:true}),b:rs(B1,17,100,2,null,{manual:true})});
  ok("Mom's ✍ Passed marks count as greens (no guess needed)",g.cleared);
  g=GR({a:rs(B1,16,70,1,true)});
  ok("found under 80% is not a green even with the count right",g.streak===0);
  ok("a step-1 sitting on a review page never counts toward step 3",GR({a:Object.assign(rs(B1,16,100,1,true),{step:1}),b:rs(B1,17,100,2,true)}).streak===1);
  // the doorway
  let n=E.eicNextSitting(TE,{},D2,false);
  ok("once open, the card's doorway deals the first review page — to the kid too (covers exist)",n&&n.skill===R&&n.step===3&&tag(n)==="B1p16",n);
  n=E.eicNextSitting(TE,{a:rs(B1,16,90,5,true)},D2,false);
  ok("…then the next one",n&&tag(n)==="B1p17",n);
  n=E.eicNextSitting(TE,{},{a:D2.a,b:D2.b,c:D2.c},false);
  ok("while locked, the doorway stays on the skills (punctuation step 2)",n&&n.skill==="punctuation"&&n.step===2,n);
  n=E.eicNextSitting(TE,{x:rs(B1,16,90,5,true),y:rs(B1,17,90,6,true)},D2,true);
  const third=E.eicSkills(TE)[2].key;
  ok("reviews cleared → the doorway goes to step 4 (the Iowa set) before any other skill",n&&n.skill==="iowa"&&n.iowa==="capitalization",n);
  ok("the Redo / Move-on check reads the review pool for step 3",/function poolFor\(T,skill,step\)\{ return skill===REV\?eicReviewPool\(T\)/.test(ee)&&/eicGate\(logs,decs,skill,step,poolFor\(TK\(\),skill,step\)\)/.test(ee));
  // the kid's guess + Mom's score
  const ih=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
  ok("the viewer bar shows 🔢 How many? for the KID only",/\(\(v\.eic&&!wbMomEyes\(\)&&window\.eicCountBtn\)\?window\.eicCountBtn\(v\):""\)/.test(ih));
  ok("the button only appears on a review page",/function countCtx\(v\)\{[\s\S]{0,200}if\(!eicIsReview\(T,bk,printed\)\) return null;/.test(ee));
  ok("a locked guess is never overwritten (read first, even from another device)",/if\(old&&old\.said!=null\)\{ done\(old\); return; \}/.test(ee)&&/db\.ref\("eic\/"\+c\.k\+"\/counts\/"\+c\.key\)/.test(ee));
  ok("Mom's score on a review page logs said / total / countOk under 'review' step 3",/if\(rec\.step===3\)\{ rec\.skill=REV; rec\.total=v\.found\+v\.missed; rec\.countOk=eicCountOk\(v\.said,v\.found,v\.missed\);/.test(ee));
  ok("a kid never opens a review page before the reviews open, or without covers",/if\(step===3&&!mom\(\)\)\{\s*if\(!eicReviews\(TK\(\),logs,decs\)\.unlocked\)/.test(ee));
  ok("the cover rides along on step 3 pages",/cover=\(step===2\|\|step===3\)\?eicCover\(TK\(\),bk,printed\):\[\]/.test(ee));
}
console.log("🧪 step 4 — Iowa practice player (slice B, 2026-09-22)");
{
  const bank=JSON.parse(fs.readFileSync(path.join(__dirname,"eic_iowa.json"),"utf8")), I=bank.items;
  const sets=[["beginning","capitalization"],["beginning","punctuation"],["level","capitalization"],["level","punctuation"]];
  ok("the bank ships with the app: 160 passages, 40 in each of the four sets",I.length===160&&sets.every(([b,k])=>I.filter(x=>x.bank===b&&x.skill===k).length===40));
  ok("every set has 10 clean passages and 10 errors on each line",sets.every(([b,k])=>[1,2,3,4].every(a=>I.filter(x=>x.bank===b&&x.skill===k&&x.answer===a).length===10)));
  ok("every passage has 3 lines; an error's fix names its own line; a clean one has no fix",I.every(x=>x.lines.length===3&&(x.answer===4?x.fix===null:(x.fix&&x.fix.line===x.answer&&x.fix.text!==x.lines[x.answer-1]))));
  ok("ids are unique",new Set(I.map(x=>x.id)).size===160);
  ok("Ellis gets the Beginning sets, Lincoln the Level sets, anyone else Beginning",E.eicIowaLevel("ellis")==="beginning"&&E.eicIowaLevel("lincoln")==="level"&&E.eicIowaLevel("lucy")==="beginning");
  let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)%2147483648; return seed/2147483648; };
  const s1=E.eicIowaPick(I,"beginning","capitalization",{},10,rnd);
  ok("a set = 10 passages, all from his level and that skill, none twice",s1.length===10&&s1.every(x=>x.bank==="beginning"&&x.skill==="capitalization")&&new Set(s1.map(x=>x.id)).size===10);
  ok("…with 2 or 3 clean passages",[2,3].includes(s1.filter(x=>x.answer===4).length),s1.filter(x=>x.answer===4).length);
  const L={}; let t=1, seen=new Set(), overlap=0;
  for(let k=0;k<3;k++){ const st=E.eicIowaPick(I,"level","punctuation",L,10,rnd); st.forEach(x=>{ if(seen.has(x.id)) overlap++; seen.add(x.id); }); L["s"+k]={ts:t++,skill:"punctuation",items:st.map(x=>x.id),timed:true,pct:50}; }
  ok("three sets in a row never repeat a passage (unseen ones come first)",overlap===0&&seen.size===30,[overlap,seen.size]);
  seed=11; const a=E.eicIowaPick(I,"level","punctuation",{},10,rnd).map(x=>x.id).join();
  seed=11; const b=E.eicIowaPick(I,"level","punctuation",{t:{ts:1,skill:"punctuation",items:I.slice(120,140).map(x=>x.id),trial:true}},10,rnd).map(x=>x.id).join();
  ok("Mom's try-outs never use up his unseen passages",a===b);
  const sc=E.eicIowaScore(s1,s1.map((x,i)=>i<8?x.answer:(x.answer===4?1:4)));
  ok("scoring: 8 right of 10 = 80%, the two misses listed with what he tapped",sc.right===8&&sc.pct===80&&sc.miss.length===2&&sc.miss[0].n===9);
  ok("an unanswered passage (time ran out) is a miss",E.eicIowaScore(s1,[s1[0].answer]).right===1);
  const G=E.eicIowaGreen;
  ok("green = 80%+, timed, finished inside the clock",G({pct:80,timed:true,timeUp:false})&&!G({pct:79,timed:true}));
  ok("untimed, out of time, or Mom's try-out is never green",!G({pct:100,timed:false})&&!G({pct:100,timed:true,timeUp:true})&&!G({pct:100,timed:true,trial:true}));
  ok("a try-out is Mom-only and always marked practice",/if\(trial&&!mom\(\)\) return;/.test(ee)&&/window\.eicIowaTry=sk=>iowaStart\(sk,\{trial:true,timed:iowaTimed\}\)/.test(ee));
  ok("a finished set writes ONE log line (push), never a whole node",/const r=db\.ref\("eic\/"\+R\.kid\+"\/iowa"\)\.push\(\); r\.set\(rec\)/.test(ee));
  ok("the bank loads fresh past the Pages cache",/"eic_iowa\.json\?v="\+Date\.now\(\)/.test(ee));
}
console.log("⏱ step 4 for the kids — gate + doorway (slice C, 2026-09-22)");
{
  const L1="editor-in-chief-level-1";
  const TE=E.eicTagsFor(Object.assign({},T,{[L1]:prune(JSON.parse(fs.readFileSync(path.join(dir,"eic_lv1_tags.json"),"utf8")))}),"ellis");
  const mv=(skill,step,ts)=>({skill,step,action:"moveon",ts,manual:true});
  const D2={a:mv("capitalization",1,1),b:mv("capitalization",2,2),c:mv("punctuation",1,3),d:mv("punctuation",2,4)};
  const D3=Object.assign({},D2,{r:mv("review",3,5)});
  const set=(skill,pct,ts,x)=>Object.assign({skill,pct,ts,timed:true,timeUp:false,items:[]},x||{});
  let ip=E.eicIowaProgress(TE,{},D2,{});
  ok("locked while the reviews aren't cleared",!ip.unlocked&&ip.cur===null&&!ip.skills.capitalization.open);
  ip=E.eicIowaProgress(TE,{},D3,{});
  ok("reviews cleared → the capitalization set opens first; punctuation waits",ip.unlocked&&ip.cur==="capitalization"&&ip.skills.capitalization.open&&!ip.skills.punctuation.open);
  ip=E.eicIowaProgress(TE,{},D3,{a:set("capitalization",90,1)});
  ok("one green = one more to go",ip.skills.capitalization.streak===1&&!ip.skills.capitalization.cleared);
  ip=E.eicIowaProgress(TE,{},D3,{a:set("capitalization",90,1),b:set("capitalization",80,2)});
  ok("two greens in a row graduate capitalization and open punctuation",ip.skills.capitalization.cleared&&ip.cur==="punctuation"&&ip.skills.punctuation.open);
  ip=E.eicIowaProgress(TE,{},D3,{a:set("capitalization",90,1),b:set("capitalization",100,2,{timeUp:true}),c:set("capitalization",90,3)});
  ok("a set where time ran out breaks the streak",!ip.skills.capitalization.cleared&&ip.skills.capitalization.streak===1);
  ip=E.eicIowaProgress(TE,{},D3,{a:set("capitalization",100,1,{trial:true}),b:set("capitalization",100,2,{trial:true})});
  ok("Mom's try-outs never count toward graduating",!ip.skills.capitalization.cleared&&ip.skills.capitalization.sets===0);
  ip=E.eicIowaProgress(TE,{},Object.assign({},D3,{m:mv("iowa_capitalization",4,6)}),{});
  ok("Mom's ✓ Mark done graduates it",ip.skills.capitalization.cleared&&ip.skills.capitalization.moved&&ip.cur==="punctuation");
  ip=E.eicIowaProgress(TE,{},D3,{a:set("capitalization",90,1),b:set("capitalization",90,2),c:set("punctuation",85,3),d:set("punctuation",95,4)});
  ok("both graduated → step 4 done",ip.cur===null&&ip.skills.punctuation.cleared);
  let n=E.eicNextSitting(TE,{},D3,false,{});
  ok("the schedule card's doorway deals the Iowa set right after the reviews",n&&n.skill==="iowa"&&n.step===4&&n.iowa==="capitalization",n);
  n=E.eicNextSitting(TE,{},D3,false,{a:set("capitalization",90,1),b:set("capitalization",90,2)});
  ok("…then the punctuation set",n&&n.iowa==="punctuation",n);
  n=E.eicNextSitting(TE,{},D3,false,{a:set("capitalization",90,1),b:set("capitalization",90,2),c:set("punctuation",90,3),d:set("punctuation",90,4)});
  const third=E.eicSkills(TE)[2].key;
  ok("both graduated → the doorway moves on to the next skill ("+third+")",n&&n.skill===third,n);
  n=E.eicNextSitting(TE,{},D2,false,{});
  ok("reviews not cleared → never an Iowa set",!(n&&n.iowa),n);
  ok("the card opens the set (timed) instead of a page",/if\(n&&n\.iowa\)\{ iowaStart\(n\.iowa,\{timed:true\}\); return; \}/.test(ee));
  ok("a kid's ▶ Start a set is always timed and only when that set is open",/window\.eicIowaStart=sk=>\{ const g=eicIowaProgress\(TK\(\),logs,decs,iowaLogs\)\.skills\[sk\]; if\(!g\|\|!g\.open\|\|g\.cleared\)/.test(ee)&&/iowaStart\(sk,\{timed:true\}\); \};/.test(ee));
  ok("a finished real set checks off today's card; a try-out never does",/const saved=\(\)=>\{ if\(!R\.trial\)\{ try\{ if\(typeof eicCheckCard==="function"\) eicCheckCard\(R\.kid\);/.test(ee));
  ok("a second set the same day skips the passages he just had (kept locally at once)",/const tmp="local"\+now; if\(R\.kid===kid\) iowaLogs\[tmp\]=rec;/.test(ee));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
