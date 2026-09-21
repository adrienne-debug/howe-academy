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
ok("eic.js never writes a whole node",!/db\.ref\("(eic|workbooks|mastery|library)"\)\.(set|update|remove)/.test(e)&&!/db\.ref\("eic\/"\+\w+\)\.(set|remove)/.test(e));
ok("eic.js never touches weeks, curriculum or config",!/db\.ref\([^)]*(week|curriculum|config|settings\/)/.test(e.replace(/_settings/g,"")));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
