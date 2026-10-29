/*
 * Node tests — 📝 CPTESTS, PR 11 of the class platform (DESIGN_class_platform_2026-10-28.md §5.2, §5.3, §6.3, §8.4, §12, §13 row 11, §14 Q11;
 * her words 2026-10-28: "super easy for her to quickly go through and see all the questions and the answers … naturally collapsed unless
 * she opens them, and then if she moves on, collapse it back").
 *   · where the block sits and how it is hooked (one typeof-guarded line each, tagged 📝 CPTESTS; the chips array literal not edited);
 *   · the pure cpForm (edit / remove / add / order, the same-form final), the edit box's draft check;
 *   · Howe / DeWalt / Burris and LINCOLN: every hook hands back the very object it was given, even with a full layer in memory; the real
 *     envtForm gives his unit's form untouched and his attempt record gains nothing;
 *   · 📝 Tests (demo): the chip after 📚 Cards; folded; one open at each level; the question only on a row; an opened question's choices, ✓,
 *     cite and covering cards; Left out (read-only); the same-form final; counts from the data; search; chips;
 *   · ✏️ edit (incl. select-all), Use the original, 🙈 remove / ↩ put back (✕ / ↩ on the row), ↑ ↓, ＋ add, Undo — each ONE multi-path
 *     update of classTests/<cid>/<section>/<form> through envsWrite, with ver bumped; the "N took this form" warning;
 *   · the kid (demo): the check-in shows the new wording; removed / added / moved questions; ans + formVer on the attempt;
 *   · live: the kid's boot reads classTests/<cid> ONCE; the console listens while 📝 Tests is open; a save is one update; dry run nothing;
 *   · the rules (classTests/$cid) and envirothon.js's `left` lists.                                                run: node test_cp_tests.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const JSON_T=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_tests.json"),"utf8"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const CPT=cut("// CPTESTS_START","// CPTESTS_END");
const API="cpForm, cpctArr, cpctQok, cpctSame, cpctLayerFor, cpctDraftRec, cpctQid, cpctOn, cpctKidOn, cpctKidLoad, cpctForm, cpctAttempt, cpctStart, cpctLayer, cpctChips, cpctModel, cpctFind, cpctCover, cpctTook, cpctCounts, cpctPass, cpctTap, cpctSearch, cpctHtml, cpctListHtml, cpctChipsHtml, cpctEditOpen, cpctAddOpen, cpctEditCancel, cpctIn, cpctTick, cpctMultiSet, cpctSave, cpctUseOriginal, cpctHide, cpctShow, cpctMove, cpctCommit, cpctUndo, cpctNext";
const CPTX=CPT+"\nG.cpt={ _cpct, "+API+" };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:o.cpt===false?"":CPTX},o.w||{})); w.T=w.G.cpt||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const CID="ms-science-2026";
const Wr=w=>w._envs.writes, last=w=>Wr(w)[Wr(w).length-1];
const open=w=>{ w.envcView("grid"); w.envcView("cptests"); return w.G.content; };   // from another tab, so it opens folded (a demo role switch keeps the view)
const list=w=>w.T.cpctListHtml();
const base=(s,f)=>LIB.tests[s][f];
const flush=()=>new Promise(r=>setImmediate(r));
// a form of three to work on (the pure tests)
const FX=()=>({form:"F",source:"f.docx",n:3,items:[{n:1,q:"one?",choices:["a","b","c","d"],ans:0,cite:"p1",cards:["d#o1"]},{n:2,q:"two?",choices:["a","b","c","d"],ans:[0,2],cite:"p2",cards:[]},{n:4,q:"four?",choices:["t","f"],ans:1,cite:"p4"}]});

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPTESTS_START"), b=src.indexOf("// CPTESTS_END");
  ok("one CPTESTS block, right after CPFINAL_END", a>0&&b>a&&src.indexOf("// CPTESTS_START",a+1)<0&&src.slice(src.indexOf("// CPFINAL_END"),a).trim()==="// CPFINAL_END");
  ok("her words, the date, §6.3, §13 row 11, Q11 and PR 11 in the header", /2026-10-28/.test(CPT.slice(0,900))&&/naturally collapsed unless she opens them/.test(CPT.slice(0,900))&&/§6\.3/.test(CPT.slice(0,900))&&/§13 row 11/.test(CPT.slice(0,900))&&/Q11/.test(CPT.slice(0,900))&&/PR 11/.test(CPT.slice(0,900)));
  ok("the block only declares (nothing runs at boot)", CPT.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const hooks=src.split("\n").filter(l=>/📝 CPTESTS/.test(l)&&(src.indexOf(l)<a||src.indexOf(l)>b));
  const want=["cpctChips","cpctHtml","cpctKidLoad","cpctForm","cpctAttempt"];
  ok("five hook lines outside the block, each typeof-guarded on a cpct function and tagged 📝 CPTESTS", hooks.length===want.length&&hooks.every(l=>/typeof cpct\w+ ?=== ?"function"/.test(l))&&want.every(f=>hooks.some(l=>l.indexOf(f+"(")>=0)), hooks.map(l=>l.trim().slice(0,90)));
  const at=(fn,re)=>{ const i=src.indexOf(fn), j=src.indexOf("\n}",i); return i>0&&re.test(src.slice(i,j+2)); };
  ok("the hooks sit where they belong: envtForm, envtFinish (right after the attempt record), envConsoleHtml (chips after 📚 Cards' two, the view after cpcards), envClsKidLoad (after the card layer's once)",
    at("function envtForm(station,which){",/let f=T&&T\[station\]&&T\[station\]\[which\];\n  if\(f&&typeof cpctForm==="function"\) f=cpctForm\(station,which,f\);[^\n]*\n  return \(f&&Array\.isArray\(f\.items\)&&f\.items\.length\)\?f:null; \}/)&&
    at("function envtFinish(){",/answers:sc\.answers,ts:now\};\n  if\(typeof cpctAttempt==="function"\) cpctAttempt\(rec,S\);/)&&
    /cpceChips\(chips\);[^\n]*\n  if\(typeof cpctChips==="function"\) cpctChips\(chips\);/.test(src)&&/h\+=cpcsHtml\(\);[^\n]*\n  else if\(v==="cptests"&&typeof cpctHtml==="function"\) h\+=cpctHtml\(\);/.test(src)&&
    at("function envClsKidLoad(sdb,cid){",/cpceKidLoad\(sdb,cid\);[^\n]*\n  if\(typeof cpctKidLoad==="function"\) cpctKidLoad\(sdb,cid\);/));
  const lit=src.slice(src.indexOf("function envConsoleHtml(){"),src.indexOf("function envConsoleHtml(){")+3000).split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited", !!lit&&lit.indexOf("cpct")<0&&lit.indexOf("Tests")<0);
  const code=CPT.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("every write goes through envsWrite (one call); its only Firebase call is the kid's ONE once-read of classTests/<cid>", !/\.set\(|\.update\(|\.remove\(|\bdb\.|envcWrite|envcMulti/.test(code)&&(code.match(/\.ref\(/g)||[]).length===1&&/sdb\.ref\("classTests\/"\+cid\)\.once\("value"/.test(code)&&(code.match(/envsWrite\(/g)||[]).length===1);
  ok("no Howe kid name as a code literal; no 🔀; no question text in index.html; no hard-coded 'Station' or 'Check-in' in the block's strings", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPT)&&src.indexOf("\u{1F500}")<0&&["mycorrhizae","D-shaped holes","Emerald Ash Borer"].every(t=>src.indexOf(t)<0)&&!/["'][^"'\n]*\b(Stations?|Check-in)\b/.test(code)); }

console.log("\n── the pure parts: cpForm, the draft, the same-form final ──");
{ const w=W(), T=w.T, f=FX();
  ok("no layer, an empty layer → the VERY same form object", T.cpForm(f,null,"pre")===f&&T.cpForm(f,{},"pre")===f&&T.cpForm(f,{items:{},order:[]},"pre")===f);
  const L={items:{"pre-1":{q:"ONE?",choices:["w","x","y"],ans:2,by:"t",ts:5},"pre-2":{hide:true,by:"t",ts:6},"c-b":{q:"mine 2?",choices:["p","q"],ans:[0,1],add:true,by:"t",ts:9},"c-a":{q:"mine 1?",choices:["p","q"],ans:1,cite:"my page",add:true,by:"t",ts:8},"pre-4":{q:"",choices:["x"],ans:7,by:"t",ts:1}},ver:42};
  const g=T.cpForm(f,L,"pre");
  ok("an edit replaces q / choices / ans, keeps the cite and the card links; a removed question leaves; hers join at the end by when she added them; a bad record is ignored", JSON.stringify(g.items.map(x=>[x.id,x.q,x.choices.length,x.ans,!!x.edited,!!x.added]))===JSON.stringify([["pre-1","ONE?",3,2,true,false],["pre-4","four?",2,1,false,false],["c-a","mine 1?",2,1,false,true],["c-b","mine 2?",2,[0,1],false,true]])&&g.items[0].cite==="p1"&&JSON.stringify(g.items[0].cards)==='["d#o1"]'&&g.items[2].cite==="my page", g.items);
  ok("…n is the new count, ver the layer's, and the unit's form is untouched", g.n===4&&g.ver===42&&g.cls===true&&f.items.length===3&&f.items[0].q==="one?"&&g!==f);
  const all=T.cpForm(f,L,"pre",{all:true});
  ok("opt.all keeps the removed question, flagged", all.items.length===5&&all.items.find(x=>x.id==="pre-2").hidden===true);
  const o=T.cpForm(f,{items:L.items,order:["c-b","pre-4"]},"pre");
  ok("her order goes first; the rest keep their place after it", o.items.map(x=>x.id).join()==="c-b,pre-4,pre-1,c-a");
  ok("an order stored as a Firebase object reads the same", T.cpForm(f,{order:{0:"pre-4",1:"pre-1"}},"pre").items.map(x=>x.id).join()==="pre-4,pre-1,pre-2");
  const sec={pre:{form:"2026 X",source:"x.docx"},post:{form:"2026 X",source:"x.docx"}}, sec2={pre:{form:"2026 X",source:"x.docx"},post:{form:"2022 X",source:"y.docx"}};
  ok("a final with the same form name and source as the check-in is the same form; another isn't", T.cpctSame(sec)===true&&T.cpctSame(sec2)===false&&T.cpctSame(null)===false);
  const lf=T.cpctLayerFor({pre:{items:{"pre-3":{hide:true},"c-z":{q:"z?",choices:["a","b"],ans:0,add:true}},order:["c-z","pre-3"],ver:7}},"post",true);
  ok("the same-form final reads the check-in's layer, pre-<n> as post-<n>, her questions and the version as they are", JSON.stringify(Object.keys(lf.items))==='["post-3","c-z"]'&&lf.order.join()==="c-z,post-3"&&lf.ver===7&&T.cpctLayerFor({pre:{items:{}}},"post",false)===null);
  ok("the draft: a question, 2–5 choices (trailing empties dropped), a tick → {q, choices, ans}; select all → a sorted list", JSON.stringify(T.cpctDraftRec({q:" Q? ",c:["a","b","c","",""],a:[1],multi:false}))==='{"q":"Q?","choices":["a","b","c"],"ans":1}'&&JSON.stringify(T.cpctDraftRec({q:"Q",c:["a","b","c"],a:[2,0],multi:true}).ans)==="[0,2]");
  ok("…and says why it can't be saved: empty question, one choice, a gap, no tick, a tick on an empty choice, too long", [T.cpctDraftRec({q:"",c:["a","b"],a:[0]}),T.cpctDraftRec({q:"Q",c:["a",""],a:[0]}),T.cpctDraftRec({q:"Q",c:["a","","c"],a:[0]}),T.cpctDraftRec({q:"Q",c:["a","b"],a:[]}),T.cpctDraftRec({q:"Q",c:["a","b"],a:[3]}),T.cpctDraftRec({q:"x".repeat(601),c:["a","b"],a:[0]})].every(x=>typeof x==="string"&&x.length>5));
  ok("cpctQok matches the rules: 1–600 / 2–5 choices of 1–300 / a valid index or a sorted list", T.cpctQok({q:"q",choices:["a","b"],ans:1})&&T.cpctQok({q:"q",choices:{0:"a",1:"b",2:"c"},ans:{0:0,1:2}})&&!T.cpctQok({q:"q",choices:["a","b"],ans:2})&&!T.cpctQok({q:"q",choices:["a","b","c"],ans:[2,0]})&&!T.cpctQok({q:"q",choices:["a","b","c","d","e","f"],ans:0})&&!T.cpctQok({q:"q",choices:["a",""],ans:0})&&!T.cpctQok({q:"q",choices:["a","b"],ans:[]}));
  ok("question ids are the unit's (cpuQid: <form>-<n>)", T.cpctQid("pre",{n:3})==="pre-3"&&T.cpctQid("post",{n:12})==="post-12"&&T.cpctQid("pre",{id:"x9",n:1})==="x9"); }

console.log("\n── Howe, DeWalt, Burris and Lincoln: inert ──");
for(const fam of ["howe","dewalt","burris"]){ const w=W({w:{fam:{familyId:fam,roster:[]}}}), T=w.T, L={forestry:{pre:{items:{"pre-3":{q:"NEW",choices:["a","b"],ans:0,by:"t",ts:1}},ver:5}}};
  T._cpct.kid=L; T._cpct.L.c1=L; w._envs.kid="lincoln"; w._envs.role="kid"; w._envc.cid="c1";   // a full layer sitting in memory must still change nothing
  const f=base("forestry","pre"), chips=[["grid","a"],["cpcards","b"]], rec={form:"x",n:1,right:1,answers:[0],ts:1}, rj=JSON.stringify(rec);
  ok(fam+": cpctForm hands back the very same form; cpctAttempt the very same record, unchanged; cpctChips the same array", T.cpctForm("forestry","pre",f)===f&&T.cpctAttempt(rec,{form:f,which:"pre",answers:[0]})===rec&&JSON.stringify(rec)===rj&&T.cpctChips(chips)===chips&&chips.length===2);
  ok(fam+": no console (no page, no start), the boot load reads nothing, a commit writes nothing", T.cpctOn()===false&&T.cpctKidOn()===false&&T.cpctHtml()===""&&T.cpctStart()===false&&T.cpctKidLoad(w.firebase.database(),"c1")===false&&(T.cpctHide("forestry|pre|pre-3"),T.cpctUndo(),true)&&w.G.writes.length===0&&w.G.reads.length===0&&w._envs.writes.length===0); }
{ // the real ENVTEST in the Howe world: open a check-in, finish it, read the record
  const md={lincoln:[],lincoln_settings:{cat_hold:{}},lincoln_tests:{}}, us={nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{lincoln:true},decks:[]}};
  const mk=cpt=>{ const w=W({cpt,w:{fam:{familyId:"howe",roster:[]},masteryData:JSON.parse(JSON.stringify(md)),unitStudies:JSON.parse(JSON.stringify(us))}}); if(w.T){ w.T._cpct.kid={forestry:{pre:{items:{"pre-1":{hide:true,by:"t",ts:1},"pre-3":{q:"NEW",choices:["a","b"],ans:0,by:"t",ts:1}},ver:2}}}; } w._envs.role="kid"; w._envs.kid="lincoln"; return w; };
  const take=w=>{ const opened=w.envt.envtOpen("lincoln","forestry","pre"); const S=w.envt.state; if(!S) return {opened}; const q3=S.form.items[2].q, same=S.form===base("forestry","pre"); S.form.items.forEach(()=>{ w.envt.envtPick(0); w.envt.envtNext(); }); return {opened,q3,same,rec:w.masteryData.lincoln_tests.forestry.pre}; };
  const A=take(mk(undefined)), B=take(mk(false));
  ok("Lincoln takes a check-in: the unit's form (the very same object, the unit's Q3), and his record is byte-identical to the one with no block — no ans, no formVer", A.opened&&A.same&&B.same&&A.q3===base("forestry","pre").items[2].q&&JSON.stringify(A.rec)===JSON.stringify(B.rec)&&!("ans" in A.rec)&&!("formVer" in A.rec), [A.opened,A.same,A.q3,A.rec,B.rec]); }

console.log("\n── 📝 Tests: the chip, folded, one open at a time ──");
{ const w=demo("teacher"), a=demo("admin");
  const chipRow=x=>(x.match(/<div class="envs-chips">([\s\S]*?)<\/div>/)||["",""])[1];
  ok("teacher and Adrienne: 📝 Tests right after 📚 Cards", /cpcards[^]*?📚 Cards<\/button><button[^>]*cptests[^>]*>📝 Tests</.test(chipRow(w.G.content))&&/📚 Cards<\/button><button[^>]*cptests[^>]*>📝 Tests</.test(chipRow(a.G.content)));
  const h=open(w), M=w.T.cpctModel();
  ok("the five sections with a form, in the class's order (General has none)", M.ready&&M.secs.map(s=>s.id).join()==="forestry,soils,aquatics,wildlife,cei", M.secs.map(s=>s.id));
  ok("first open: the section lines and nothing else (no form, no question)", /cpctTap\('st','forestry'\)/.test(h)&&!/cpctTap\('form'/.test(h)&&!/cpctTap\('row'/.test(h));
  const fp=base("forestry","pre").items.length, fq=base("forestry","post").items.length;
  ok("each section line counts its forms from the data: Forestry “Check-in "+fp+" · Final "+fq+"”", new RegExp("Check-in <b>"+fp+"</b></span><span>Final <b>"+fq+"</b>").test(h));
  w.T.cpctTap("st","forestry"); let l=list(w);
  ok("Forestry open: 📝 Check-in and 🎓 Final, each with its form's name, count and “with no core card” (from the links); still no question rows", /📝 Check-in · 2026 Area 8 MS Forestry/.test(l)&&/🎓 Final · 2022 Area 8 MS Forestry/.test(l)&&new RegExp("<b>"+fp+"</b> questions").test(l)&&/with no core card/.test(l)&&!/cpctTap\('row'/.test(l));
  const nocore=w.T.cpctCounts(M.secs[0].forms[0].items).nocore, byHand=base("forestry","pre").items.filter(it=>!w.T.cpctCover(it).core).length;
  ok("“with no core card” is counted from the question → card links ("+nocore+")", nocore===byHand&&new RegExp(nocore+" with no core card").test(l));
  w.T.cpctTap("form","forestry|pre"); l=list(w);
  const rows=(l.match(/class="cpcs-row cpct-row/g)||[]).length;
  ok("the check-in open: one row per question ("+fp+"), the question only — no choices drawn", rows===fp&&!/class="cpct-ch/.test(l));
  ok("Q1 is a select-all question and says so on its row", /Q1<\/span><span class="cpcs-rt"><span class="cpct-qt">[^<]*<\/span><span class="cpct-badge"[^>]*>select all/.test(l));
  w.T.cpctTap("row","forestry|pre|pre-3"); l=list(w); const q3=base("forestry","pre").items[2];
  ok("Q3 opened: its choices A–D with ✓ on the keyed one only, its cite, the form and its number", (l.match(/class="cpct-ch ok"/g)||[]).length===1&&(l.match(/class="cpct-ch/g)||[]).length===q3.choices.length&&l.indexOf("Cite: "+q3.cite)>0&&/2026 Area 8 MS Forestry · question 3/.test(l));
  const cv=w.T.cpctCover(q3);
  ok("…the cards that cover it (§8.4's links, the first 3, ⭐ on core) and the automatic-match warning", cv.cards.length>0&&cv.cards.slice(0,3).every(c=>l.indexOf(c.name.slice(0,30))>0)&&/The match is automatic — check before acting/.test(l));
  ok("…and its buttons: ✏️ Edit · 🙈 Remove for my class · ↑ · ↓", /cpctEditOpen\('forestry\|pre\|pre-3'\)">✏️ Edit/.test(l)&&/cpctHide\('forestry\|pre\|pre-3'\)">🙈 Remove for my class/.test(l)&&/cpctMove\('forestry\|pre\|pre-3',-1\)"/.test(l)&&/cpctMove\('forestry\|pre\|pre-3',1\)"/.test(l));
  w.T.cpctTap("row","forestry|pre|pre-2"); l=list(w);
  ok("opening Q2 folds Q3 (one open at a time)", (l.match(/class="cpct-ch/g)||[]).length===base("forestry","pre").items[1].choices.length&&w.T._cpct.or==="forestry|pre|pre-2");
  w.T.cpctTap("form","forestry|post"); l=list(w);
  ok("opening the final folds the check-in and its open question", w.T._cpct.og==="forestry|post"&&w.T._cpct.or===null&&(l.match(/class="cpcs-row cpct-row/g)||[]).length===fq);
  const left=base("forestry","post").left;
  ok("the final ends with “Left out of the form · "+left.length+"” (folded)", new RegExp("Left out of the form · "+left.length+"<").test(l)&&!/class="cpcs-tag L"/.test(l));
  w.T.cpctTap("left","forestry|post|left"); l=list(w);
  ok("…opened: each left-out question with its number and why, read-only (no buttons)", (l.match(/class="cpcs-tag L"/g)||[]).length===left.length&&left.every(d=>l.indexOf("Q"+d.n+"<")>0)&&l.indexOf("needs a picture")>0&&!/cpctHide\('forestry\|post\|left/.test(l));
  w.T.cpctTap("st","soils"); l=list(w);
  ok("moving to another section folds everything she left", w.T._cpct.os==="soils"&&w.T._cpct.og===null&&w.T._cpct.lo===null&&!/Left out of the form · /.test(l.split("cpct-h-soils")[0]));
  w.T.cpctTap("st","cei"); w.T.cpctTap("form","cei|post"); l=list(w);
  ok("CEI's final says it is the same form as the check-in, with no rows and no ＋ to edit apart", /The same form as the check-in/.test(l)&&/edit it there, and your changes show on both/.test(l)&&!/cpctTap\('row','cei\|post/.test(l)&&!/cpctAddOpen\('cei\|post'\)/.test(l));
  w.envcView("grid"); ok("leaving 📝 Tests folds it all back", w.T._cpct.os===null&&w.T._cpct.og===null); }

console.log("\n── search and chips ──");
{ const w=demo("teacher"); open(w); w.T._cpct.q="mycorrhizae"; let l=list(w);
  ok("search finds the question across every section, with its path, the match marked", /Forestry › Check-in/.test(l)&&/<mark>mycorrhizae<\/mark>/i.test(l)&&/\b1<\/b> question match/.test(l));
  const ch3=base("forestry","pre").items[2].choices[2]; w.T._cpct.q=ch3; l=list(w);
  ok("…choices too (“"+ch3+"”)", /Forestry › Check-in/.test(l)&&l.indexOf("<mark>"+ch3+"</mark>")<0&&new RegExp("Q3<").test(l));
  w.T._cpct.q=base("forestry","pre").items[1].cite.slice(0,12); l=list(w); ok("…and cites", /question(s)? match/.test(l)&&/Forestry › Check-in/.test(l));
  w.T._cpct.q=""; const ch=w.T.cpctChipsHtml();
  ok("a clean class: only “No core card covers it” (✎ / 🙈 / ＋ come once the class has one)", /No core card covers it/.test(ch)&&!/✎ Edited|🙈 Removed|＋ Added/.test(ch));
  w.T.cpctTap("f","nocore"); const M=w.T.cpctModel(), n=M.secs.reduce((s,x)=>s+x.forms.filter(F=>!F.same).reduce((t,F)=>t+F.items.filter(it=>w.T.cpctPass(it)).length,0),0), want=M.secs.reduce((s,x)=>s+x.forms.filter(F=>!F.same).reduce((t,F)=>t+F.items.filter(it=>!w.T.cpctCover(it).core).length,0),0);
  ok("No core card covers it narrows to those questions ("+want+")", n===want&&want>0); }

console.log("\n── ✏️ Edit Forestry Q3: one write, the warning, the kid's check-in ──");
{ const w=demo("teacher"); open(w); const T=w.T; T.cpctTap("st","forestry"); T.cpctTap("form","forestry|pre"); T.cpctTap("row","forestry|pre|pre-3");
  T.cpctEditOpen("forestry|pre|pre-3"); let l=list(w);
  const took=w.envcStudents().filter(s=>s.summary&&s.summary.tests&&s.summary.tests.forestry&&s.summary.tests.forestry.pre).length;
  ok("the edit box: the question, five choice boxes with a tick each (radio: one answer), Select all that apply, Save · Cancel", /id="cpct-eq"/.test(l)&&(l.match(/name="cpct-ea"/g)||[]).length===5&&/type="radio" name="cpct-ea"[^>]*checked[^>]*onchange="cpctTick\(2/.test(l)&&/Select all that apply/.test(l)&&/cpctSave\(\)">Save/.test(l)&&/cpctEditCancel\(\)">Cancel/.test(l)&&!/Use the original/.test(l));
  ok("…and the warning, counted from the class's summaries: “⚠ "+took+" students took this form before; their scores stay as they were”", took>0&&new RegExp("⚠ "+took+" student"+(took===1?"":"s")+" took this form before; their scores stay as they were").test(l)&&T.cpctTook(T.cpctModel().secs[0].forms[0])===took);
  T.cpctIn("q","Which insect leaves D-shaped exit holes as it girdles a tree? (Brittany's wording)");
  T.cpctSave(); const x=last(w);
  ok("Save: ONE update of classTests/<cid>/forestry/pre naming items/pre-3 and ver", Wr(w).length===1&&x.op==="update"&&x.path==="classTests/"+CID+"/forestry/pre"&&JSON.stringify(Object.keys(x.val).sort())==='["items/pre-3","ver"]'&&typeof x.val.ver==="number", x);
  const r=x.val["items/pre-3"];
  ok("…the record: her q, the same choices and answer, by her uid, ts — nothing else", r.q.indexOf("Brittany's wording")>0&&JSON.stringify(r.choices)===JSON.stringify(base("forestry","pre").items[2].choices)&&r.ans===2&&r.by==="uid_teacher_demo"&&typeof r.ts==="number"&&JSON.stringify(Object.keys(r).sort())==='["ans","by","choices","q","ts"]', r);
  ok("…the demo writes nothing to Firebase", w.G.writes.length===0);
  l=list(w);
  ok("the row shows ✎ edited, the form ✎ 1, the open question her wording with the unit's struck through; ✎ Edited chip appears", /✎ edited/.test(l)&&/<span title="edited for your class">✎ 1<\/span>/.test(l)&&/Brittany's wording/.test(l)&&/The unit’s: <s>/.test(l)&&/✎ Edited/.test(T.cpctChipsHtml()));
  ok("a note with Undo shows", (()=>{ const n=w.G.created.find(e=>e.id==="cpct-note"); return n&&/Question changed for your class/.test(n.innerHTML)&&/cpctUndo\(\)/.test(n.innerHTML); })());
  w.envsDemoGo("kid");
  ok("Kid ▸ the Forestry check-in now reads her wording at Q3 (the same form for every kid; the rest as the unit has them)", (()=>{ const f=w.G.cpt&&w.T.cpctForm("forestry","pre",base("forestry","pre")); return f&&f.items[2].q.indexOf("Brittany's wording")>0&&f.items[2].edited&&f.items[0].q===base("forestry","pre").items[0].q&&f.items.length===base("forestry","pre").items.length&&f.ver===x.val.ver; })());
  w.envsDemoGo("teacher"); open(w); T.cpctTap("st","forestry"); T.cpctTap("form","forestry|pre"); T.cpctTap("row","forestry|pre|pre-3"); T.cpctEditOpen("forestry|pre|pre-3");
  ok("editing again offers Use the original", /cpctUseOriginal\(\)">Use the original/.test(list(w)));
  T.cpctUseOriginal(); const y=last(w);
  ok("Use the original: ONE update removing items/pre-3 (null), ver bumped", y.op==="update"&&y.path==="classTests/"+CID+"/forestry/pre"&&y.val["items/pre-3"]===null&&y.val.ver>x.val.ver&&!/✎ edited/.test(list(w)));
  T.cpctEditOpen("forestry|pre|pre-3"); const n0=Wr(w).length; T.cpctSave();
  ok("saving the unit's own wording writes nothing (nothing of hers to keep)", Wr(w).length===n0); }

console.log("\n── select all, ＋ add, 🙈 remove / ↩ put back, ↑ ↓, Undo ──");
{ const w=demo("teacher"); open(w); const T=w.T; T.cpctTap("st","aquatics"); T.cpctTap("form","aquatics|pre");
  const B=base("aquatics","pre"), id2=T.cpctQid("pre",B.items[1]), k2="aquatics|pre|"+id2;
  T.cpctTap("row",k2); T.cpctEditOpen(k2); T.cpctMultiSet(true);
  ok("Select all that apply switches the ticks to checkboxes in place, keeping the draft", /type="checkbox" name="cpct-ea"/.test(list(w))&&T._cpct.edit.d.multi===true);
  T.cpctTick(3,true); T.cpctTick(0,true); T.cpctSave(); let x=last(w);
  ok("…saved as a sorted list of the ticked choices", JSON.stringify(x.val["items/"+id2].ans)===JSON.stringify([0,B.items[1].ans,3].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b)), x.val);
  T.cpctAddOpen("aquatics|pre");
  ok("＋ (the form's header, or ＋ Add a question at its end) opens an empty question with a Cite box", /id="cpct-add"/.test(list(w))&&/id="cpct-ecite"/.test(list(w))&&/＋ Your question/.test(list(w))&&/cpctAddOpen\('aquatics\|pre'\)">＋ Add a question/.test(T.cpctListHtml().replace(/id="cpct-add"[\s\S]*/,""))===false);
  T.cpctIn("q","Which sampling net is towed for plankton?"); ["Kick net","Plankton net","D-net"].forEach((c,j)=>T.cpctIn("c",c,j)); T.cpctTick(1,true); T.cpctIn("cite","pg. 9, the manual");
  T.cpctSave(); x=last(w); const nk=Object.keys(x.val).find(k=>/^items\/c-/.test(k)), rec=x.val[nk];
  ok("＋ Add: ONE update with items/c-<key> = {q, choices, ans, cite, add:true, by, ts} and ver", x.op==="update"&&x.path==="classTests/"+CID+"/aquatics/pre"&&!!nk&&/^items\/c-[a-z0-9]+$/.test(nk)&&rec.add===true&&rec.ans===1&&rec.cite==="pg. 9, the manual"&&JSON.stringify(rec.choices)==='["Kick net","Plankton net","D-net"]'&&rec.by==="uid_teacher_demo", x.val);
  const nid=nk.slice(6), M=T.cpctModel(), F=M.secs.find(s=>s.id==="aquatics").forms[0];
  ok("her question sits at the end of the form, opened, marked ＋", F.items[F.items.length-1].id===nid&&T._cpct.or==="aquatics|pre|"+nid&&/<span class="cpcs-tag Q">＋<\/span>/.test(list(w))&&/Your question/.test(list(w)));
  const id1=T.cpctQid("pre",B.items[0]); T.cpctHide("aquatics|pre|"+id1); x=last(w);
  ok("✕ / 🙈 Remove: ONE update, items/<id> = {hide:true, by, ts}", x.op==="update"&&JSON.stringify(Object.keys(x.val["items/"+id1]).sort())==='["by","hide","ts"]'&&x.val["items/"+id1].hide===true);
  let l=list(w);
  ok("the removed row stays, struck through, marked 🙈 removed, with ↩ on it; the form counts one question fewer and “🙈 1 removed”", /cpct-row[^"]*cpct-hid/.test(l)&&/🙈 removed/.test(l)&&new RegExp("cpctShow\\('aquatics\\|pre\\|"+id1+"'\\)").test(l)&&new RegExp("<b>"+(B.items.length)+"</b> questions").test(l)&&/🙈 1 removed/.test(l));
  w.envsDemoGo("kid"); const kf=T.cpctForm("aquatics","pre",B);
  ok("Kid ▸ Aquatics check-in: without the removed one, her select-all answer, her question last", kf.items.length===B.items.length&&!kf.items.some(it=>it.id===id1)&&Array.isArray(kf.items[0].ans)&&kf.items[kf.items.length-1].id===nid);
  ok("…and envtForm (what the test opens) hands back that same class form", (()=>{ const st=w.envt.envtOpen("maya","aquatics","pre"); const S=w.envt.state; const r=!!st&&S&&S.form===kf; return r; })());
  { const S=w.envt.state; S.form.items.forEach((it,i)=>{ if(Array.isArray(it.ans)) it.ans.forEach(a=>w.envt.envtPick(a)); else w.envt.envtPick(0); w.envt.envtNext(); });
    const rec2=w.masteryData.maya_tests.aquatics.pre;
    ok("the kid finishes: the attempt keeps `answers` and adds ans (by question id) and formVer (the layer's ver)", rec2&&Array.isArray(rec2.answers)&&rec2.answers.length===kf.items.length&&rec2.ans&&JSON.stringify(Object.keys(rec2.ans))===JSON.stringify(kf.items.map(it=>it.id))&&JSON.stringify(rec2.ans[id2])===JSON.stringify(kf.items[0].ans)&&rec2.ans[nid]===0&&rec2.formVer===kf.ver&&kf.ver>0, rec2);
    w.envt.envtClose(); }
  w.envsDemoGo("teacher"); open(w); T.cpctTap("st","aquatics"); T.cpctTap("form","aquatics|pre");
  T.cpctShow("aquatics|pre|"+id1); x=last(w);
  ok("↩ Put back: ONE update clearing it (null — nothing of hers left on that question)", x.val["items/"+id1]===null&&!/cpct-hid/.test(list(w)));
  T.cpctMove("aquatics|pre|"+id1,1); x=last(w);
  ok("↓: ONE update of the order (the whole list) and ver", x.op==="update"&&JSON.stringify(Object.keys(x.val).sort())==='["order","ver"]'&&x.val.order[0]===id2&&x.val.order[1]===id1&&x.val.order.length===B.items.length+1);
  ok("…the first question can't go up, the last can't go down", (T.cpctTap("row","aquatics|pre|"+id2),/cpctMove\('aquatics\|pre\|[^']+',-1\)" disabled/.test(list(w))));
  w.envsDemoGo("kid"); ok("Kid ▸ the moved order", (()=>{ const f=T.cpctForm("aquatics","pre",B); return f.items[0].id===id2&&f.items[1].id===id1; })());
  w.envsDemoGo("teacher"); open(w); T.cpctMove("aquatics|pre|"+id1,-1); x=last(w);
  ok("↑ back to the natural order: the order is cleared (null), not kept", x.val.order===null);
  const n=Wr(w).length; T.cpctUndo(); x=last(w);
  ok("↩︎ Undo: the last change written back as it was (the order again), ONE update", Wr(w).length===n+1&&Array.isArray(x.val.order)&&x.val.order[0]===id2);
  T.cpctUndo(); T.cpctUndo(); x=last(w);
  ok("Undo again and again: the put-back is undone (removed again, re-stamped with her uid)", x.val["items/"+id1]&&x.val["items/"+id1].hide===true&&x.val["items/"+id1].by==="uid_teacher_demo");
  ok("every write was under classTests/<cid>/aquatics/pre, every one an update with ver", Wr(w).every(r=>r.op==="update"&&r.path==="classTests/"+CID+"/aquatics/pre"&&typeof r.val.ver==="number")&&w.G.writes.length===0);
  ok("ver only goes up", Wr(w).every((r,i,a)=>i===0||r.val.ver>a[i-1].val.ver)); }

console.log("\n── the same-form final (CEI): edit once under the check-in ──");
{ const w=demo("teacher"); open(w); const T=w.T; T.cpctTap("st","cei"); T.cpctTap("form","cei|pre"); T.cpctHide("cei|pre|pre-5");
  ok("one write, to the check-in", last(w).path==="classTests/"+CID+"/cei/pre");
  w.envsDemoGo("kid"); const pre=T.cpctForm("cei","pre",base("cei","pre")), post=T.cpctForm("cei","post",base("cei","post"));
  ok("the kid's check-in AND final both leave Q5 out; the final keeps its own post-<n> ids", pre.items.length===base("cei","pre").items.length-1&&post.items.length===base("cei","post").items.length-1&&!post.items.some(it=>it.n===5)&&post.items[0].id==="post-1"); }

console.log("\n── live (not the demo): the kid's boot, the console's listener, one update; dry run nothing ──");
{ const L={forestry:{pre:{items:{"pre-3":{q:"NEW Q3?",choices:["a","b","c","d"],ans:2,by:"t1",ts:5}},ver:5}}};
  const remote={"classTests/c1":L,"classCards/c1":null,"classes/c1/settings":{},"students/fam_k/settings":{}};
  const w=W({w:{remote}}); w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.cid="c1";
  const f=base("forestry","pre");
  ok("before the read: the unit's form, the very same object", w.T.cpctForm("forestry","pre",f)===f);
  w.envsReadShared();
  ok("ONE once of classTests/<cid> at boot, no listener on it", w.G.reads.filter(p=>p==="classTests/c1").length===1&&!w.G.listeners.some(l=>/^classTests/.test(l.p)));
  const g=w.T.cpctForm("forestry","pre",f);
  ok("…then the kid's check-in is the class's form (Q3 her wording, ver 5), and the same object on the next call", g!==f&&g.items[2].q==="NEW Q3?"&&g.ver===5&&w.T.cpctForm("forestry","pre",f)===g);
  w.T.cpctKidLoad(w.firebase.database(),"c1"); ok("a second load reads nothing more; nothing written", w.G.reads.filter(p=>p==="classTests/c1").length===1&&w.G.writes.length===0);
  const p=W({w:{remote}}); p._envs.role="parent"; p._envs.kid="k"; p._envs.sid="fam_k"; p._envs.cid="c1"; p.envsReadShared();
  ok("a parent's login reads it too", p.T.cpctKidOn()&&p.T.cpctForm("forestry","pre",f).items[2].q==="NEW Q3?");
  const t=W({w:{remote}}); t._envs.role="teacher"; ok("a teacher's boot never reads it this way", t.T.cpctKidLoad(t.firebase.database(),"c1")===false&&t.G.reads.length===0);
  const live=dry=>{ const x=W({w:{dry,remote}}); x._envs.role="teacher"; x._envs.uid="t1"; x._envc.sdb=x.firebase.database(); x._envc.cid="c1"; x._envs.cid="c1"; x._envc.view="cptests"; return x; };
  const c=live(false); c.T.cpctChips([]);
  ok("the console listens to classTests/<cid> while 📝 Tests is open", c.G.listeners.some(l=>l.p==="classTests/c1")&&c.T.cpctLayer("c1").forestry.pre.ver===5);
  const F={sk:"forestry",w:"pre",key:"forestry|pre"}; await c.T.cpctCommit(F,{"items/pre-4":{hide:true,by:"t1",ts:9}},"x");
  const u=c.G.writes[c.G.writes.length-1];
  ok("a live save: ONE Firebase update at classTests/c1/forestry/pre naming the item and a ver above the last", c.G.writes.length===1&&u[0]==="update"&&u[1]==="classTests/c1/forestry/pre"&&u[2]["items/pre-4"].hide===true&&u[2].ver>5);
  ok("live, memory waits for the listener (no local change)", !c.T.cpctLayer("c1").forestry.pre.items["pre-4"]);
  const d=live(true); d.T.cpctChips([]); await d.T.cpctCommit(F,{"items/pre-4":{hide:true,by:"t1",ts:9}},"x"); ok("?dryrun=1: nothing written", d.G.writes.length===0);
  const bad=live(false); bad.T.cpctChips([]); await bad.T.cpctCommit(F,{"items/pre.4":{hide:true,by:"t1",ts:9}},"x"); await bad.T.cpctCommit({sk:"for/estry",w:"pre",key:"x"},{"items/pre-4":{hide:true,by:"t1",ts:9}},"x");
  ok("a key the database can't hold is refused, nothing written", bad.G.writes.length===0); }

console.log("\n── the rules (envirothon/SITE_RULES.json) ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, C=R.classTests, f=C&&C.$cid&&C.$cid.$sec&&C.$cid.$sec.$form, I=f&&f.items&&f.items.$item;
  ok("classTests/$cid: read by the class's teacher, Adrienne and the class's own logins", !!C&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(C.$cid[".read"])&&/admins\//.test(C.$cid[".read"])&&/logins\/'\+auth\.uid\+'\/cid'\)\.val\(\) == \$cid/.test(C.$cid[".read"]));
  ok("…written per form by the class's teacher or Adrienne only; the form is pre or post; nothing else under it", !!f&&/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(f[".write"])&&/admins\//.test(f[".write"])&&!/logins/.test(f[".write"])&&/\$form == 'pre' \|\| \$form == 'post'/.test(f[".validate"])&&f.$other[".validate"]===false&&C.$cid[".write"]===undefined);
  ok("an item: by is her own uid, ts; a removal or a question; 2–5 choices; question ≤ 600; a choice ≤ 300; nothing else", !!I&&/newData\.child\('by'\)\.val\(\) == auth\.uid/.test(I[".validate"])&&/hasChildren\(\['by','ts'\]\)/.test(I[".validate"])&&/choices\/1'\)\.exists\(\) && !newData\.child\('choices\/5'\)\.exists\(\)/.test(I[".validate"])&&/<= 600/.test(I.q[".validate"])&&/<= 300/.test(I.choices.$i[".validate"])&&/\[0-4\]/.test(I.choices.$i[".validate"])&&I.$other[".validate"]===false&&/== true/.test(I.hide[".validate"])&&/== true/.test(I.add[".validate"]));
  ok("ans: an index that is one of the choices, or a sorted list of them", /newData\.isNumber\(\)/.test(I.ans[".validate"])&&/choices\/4'\)\.exists\(\)/.test(I.ans[".validate"])&&/newData\.child\('1'\)\.val\(\) > newData\.child\('0'\)\.val\(\)/.test(I.ans[".validate"])&&/parent\(\)\.parent\(\)\.child\('choices\/2'\)/.test(I.ans.$i[".validate"]));
  ok("order is a list of item ids; ver a number", /\[A-Za-z0-9_-\]\{1,40\}/.test(f.order.$i[".validate"])&&/isNumber/.test(f.ver[".validate"]));
  // the records the code writes pass the shape the rules check
  const shape=r=>!!r&&typeof r.by==="string"&&typeof r.ts==="number"&&(r.hide===true||typeof r.q==="string")&&(!r.q||(r.q.length<=600&&Array.isArray(r.choices)&&r.choices.length>=2&&r.choices.length<=5&&r.choices.every(c=>c.length>=1&&c.length<=300)&&(typeof r.ans==="number"?r.ans<r.choices.length:r.ans.every((x,i,a)=>x<r.choices.length&&(i===0||x>a[i-1])))))&&Object.keys(r).every(k=>["q","choices","ans","cite","hide","add","by","ts"].indexOf(k)>=0);
  const w=demo("teacher"); open(w); const T=w.T; T.cpctTap("st","forestry"); T.cpctTap("form","forestry|pre");
  T.cpctEditOpen("forestry|pre|pre-1"); T.cpctIn("q","Edited Q1"); T.cpctSave(); T.cpctHide("forestry|pre|pre-2"); T.cpctAddOpen("forestry|pre"); T.cpctIn("q","Mine?"); T.cpctIn("c","yes",0); T.cpctIn("c","no",1); T.cpctTick(0,true); T.cpctSave(); T.cpctHide("forestry|pre|pre-1");
  const recs=[]; Wr(w).forEach(x=>Object.keys(x.val).forEach(k=>{ if(/^items\//.test(k)&&x.val[k]) recs.push(x.val[k]); }));
  ok("every item record the browser wrote ("+recs.length+") has the shape the rules check", recs.length===4&&recs.every(shape), recs.filter(r=>!shape(r))); }

console.log("\n── envirothon.js carries each form's left-out questions; the demo too ──");
{ const S=Object.keys(LIB.tests); let n=0, ok1=true;
  S.forEach(s=>["pre","post"].forEach(f=>{ const J=JSON_T.stations[s][f].dropped||[], L=LIB.tests[s][f].left||[]; n+=L.length; if(L.length!==J.length||!L.every((d,i)=>d.n===J[i].n&&d.q===J[i].q&&d.why===J[i].why)) ok1=false; }));
  ok("every form's `left` = its JSON drop list, item for item ("+n+" in all)", ok1&&n>0);
  const B=fs.readFileSync(path.join(REPO,"envirothon","build_envirothon_js.py"),"utf8");
  ok("build_envirothon_js.py writes them (as `left`, n / q / why)", /r\["left"\] = \[\{"n": d\["n"\], "q": d\["q"\], "why": d\["why"\]\} for d in fm\["dropped"\]\]/.test(B));
  const MD=require(path.join(REPO,"envirothon","build","make_demo.js")), s=MD.testsScript(MD.demoTests());
  ok("the demo's inline forms carry them", /"left":\[\{"n":16/.test(s)); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
