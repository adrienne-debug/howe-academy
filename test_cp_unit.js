/*
 * Node tests — 📦 CPUNIT, units as data (DESIGN_class_platform_2026-10-28.md §4, §9, §10, §11, §12, §13 row 3, §15; her words 2026-10-28:
 * "a whole new class setup and then unit and test is data pulled so other classes can also use this design when a unit or units are
 * brought in" · "we can use this setup while we're planning it to make sure that we can pull in any unit and turn it into any kind of class").
 *   · where the block sits, how it is hooked (every hook typeof-guarded); Howe / DeWalt / Burris inert, and a Howe kid's (Lincoln's)
 *     ENVUNIT hydrate gives exactly what it gave before;
 *   · units/nc_envirothon: the compiler's every rule passes, COUNTS.json, index.json and index.html's CPU_UNITS are current; 6 sections ·
 *     15 decks, and the card and core counts EXPECTED HERE ARE COUNTED FROM THE DATA (envirothon/nc_envirothon_unit.json), never typed in, so a
 *     trim or a core add only needs `node units/build/compile_unit.js nc_envirothon` (2026-10-28, after Trim 1 met PR 3);
 *   · the compiler's rules on small fixture units (each rule fails when broken), and a new unit's compiled units/<id>.js registers HoweUnits;
 *   · HoweUnits ⇄ HoweEnvirothon (the alias), question ids;
 *   · sections drawn from the class's units: NC Envirothon = today's six stations exactly; plan order; detach; a second unit; the catalog;
 *   · the unit's words and features under the class's; enroll once per attached unit (NC Envirothon as today, another unit by its catalog);
 *   · 📦 Units (Adrienne): NC Envirothon, 6 Stations, its cards and core, Published, Publish; 🏫 Class setup lists it attached; attach /
 *     detach / + Class write one targeted update each; the kid's, the parent's and the teacher's screens are byte-for-byte what they were.
 * Uses the world from test_env_site.js (the real ENVSITE + ENVCONSOLE + ENVCLASSSET + CPCLASS + CPUNIT blocks).     run: node test_cp_unit.js
 */
const fs=require("fs"), path=require("path"), os=require("os");
const {world,src,CPU,REPO}=require("./test_env_site.js");
const C=require("./units/build/compile_unit.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const CID="ms-science-2026";
function demo(role,o){ const w=world(Object.assign({fam:FAM,search:"?demo=1&role="+(role||"teacher")},o||{})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function view(w,v){ w.envcView(v); return w.G.content; }
const INDEX=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","index.json"),"utf8"));
// what the data says, counted here (never a typed number): the source cards + unit.json's deck → section map
const EXP=(()=>{ const U=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8")), SRC=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));
  const sec={}, e={cards:0,core:0,sec}; U.sections.forEach(x=>{ sec[x.key]={cards:0,core:0,decks:0,label:x.label,emoji:x.emoji}; });
  SRC.decks.forEach(d=>{ const k=(U.decks.find(x=>x.key===d.key)||{}).section, n=d.cards.length, c=d.cards.filter(x=>x.core).length; e.cards+=n; e.core+=c; if(sec[k]){ sec[k].cards+=n; sec[k].core+=c; sec[k].decks++; } });
  return e; })();
const N=n=>Number(n).toLocaleString("en-US"), RX=t=>new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
const SUM="6 Stations · 15 decks · "+N(EXP.cards)+" cards · "+N(EXP.core)+" core", SUM_SETUP="6 Stations · "+N(EXP.cards)+" cards · "+N(EXP.core)+" core";
// a small second unit, as the catalog would carry it
const FIX={id:"word_roots",ver:1,title:"Word Roots",short:"Word Roots",emoji:"\u{1F524}",sections:[{key:"roots_sep",label:"September",short:"Sep",emoji:"",order:0},{key:"roots_oct",label:"October",short:"Oct",emoji:"",order:1}],
  decks:{"Roots · September":{section:"roots_sep",kind:"terms",mode:"flip",n:12,core:0,order:0},"Roots · October":{section:"roots_oct",kind:"terms",mode:"flip",n:12,core:0,order:1}},cards:24,core:0,labels:{section:"Month",sections:"Months"},features:{},file:"units/word_roots.js"};
function tmpRoot(){ return fs.mkdtempSync(path.join(os.tmpdir(),"cpunit-")); }
function put(root,rel,obj){ const p=path.join(root,rel); fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,typeof obj==="string"?obj:JSON.stringify(obj,null,1)); }
function fixUnit(over){ const u={id:"fix_unit",ver:1,title:"Fixture Unit",emoji:"\u{1F9EA}",labels:{section:"Chapter",sections:"Chapters"},
  sections:[{key:"ch1",label:"Chapter 1"},{key:"ch2",label:"Chapter 2"}],
  decks:[{key:"Fix · Ch 1",section:"ch1",mode:"flip",kind:"terms",cards:[{name:"alpha",def:"first",group:"G1",order:1,src:"p.1",core:true},{name:"beta",def:"second",group:"G1",order:2,src:"p.1"}]},
         {key:"Fix · Ch 2",section:"ch2",mode:"flash",kind:"facts",cards:[{name:"gamma",def:"third",group:"G2",order:1,src:"p.2",core:true}]}]};
  return Object.assign(u,over||{}); }
function fixTests(){ return {ver:1,sections:{ch1:{pre:{form:"2026",source:"x",items:[{n:1,q:"Q1?",choices:["a","b"],ans:1,cite:"p.1"},{n:2,q:"Q2?",choices:["a","b","c"],ans:[0,2],cite:"p.1"}]}}}}; }
const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPUNIT_START"), b=src.indexOf("// CPUNIT_END"), c=src.indexOf("// CPCLASS_END");
  ok("CPUNIT right after CPCLASS_END, once", a>0&&b>a&&src.indexOf("// CPUNIT_START",a+1)<0&&src.slice(c,a).trim()==="// CPCLASS_END");
  ok("the block only declares (nothing runs at boot)", CPU.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let | |})/.test(l)));
  ok("her words and the date are in the block header", /2026-10-28/.test(CPU)&&/unit and test is data pulled so other/.test(CPU)&&/any kind of class/.test(CPU));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPU)&&src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/📦 CPUNIT/.test(l));
  ok("11 tagged lines outside the block, every one typeof-guarded", hooks.length===11&&hooks.every(l=>/typeof cpu\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,70)));
  const body=f=>{ const i=src.indexOf("function "+f+"("); return i<0?"":src.slice(i,src.indexOf("\n}\n",i)+2); };
  ok("envsStations, envsAutoEnroll, envHydrateAll each hand over on their FIRST line", ["envsStations","envsAutoEnroll","envHydrateAll"].every(f=>/^function \w+\(\)\{\n  if\(typeof cpu\w+==="function"\)/.test(body(f))));
  ok("the console: the 📦 Units chip (admin, before 🔑 Admin) and its screen; the demo seed", /if\(admin&&typeof cpuUnitsHtml==="function"\) chips\.splice\(chips\.findIndex\(x=>x\[0\]==="admin"\),0,\["units"/.test(body("envConsoleHtml"))&&/v==="units"&&admin&&typeof cpuUnitsHtml==="function"/.test(body("envConsoleHtml"))&&/typeof cpuDemoStart==="function"\) cpuDemoStart\(data\)/.test(src));
  ok("CPCLASS: cpLabel / cpFeature read the unit under the class; 🏫 Class setup draws 📦 Units; + Class ticks and saves the units", /function cpLabel\([^\n]*typeof cpuLabel==="function"&&cpuLabel\(key,cls\)/.test(src)&&/function cpFeature\([^\n]*typeof cpuFeature==="function"/.test(src)&&/typeof cpuSetupHtml==="function"\)\?cpuSetupHtml\(\)/.test(body("cpSetupHtml"))&&/cpuNewUnitsHtml\(\)/.test(body("cpAdminClassHtml"))&&/c\.rec\.units=cpuNewUnits\(\)/.test(body("cpClassAdd"))); }

console.log("\n── Howe, DeWalt, Burris: inert ──");
{ for(const fid of ["howe","dewalt","burris"]){ const w=world({fam:{familyId:fid,roster:[]}}), u=w.cpu;
    ok(fid+": every CPUNIT entry says no (no sections, enroll, hydrate, registry, catalog watch, screens, words, writes)", u.cpuOn()===false&&u.cpuStations()===null&&u.cpuAutoEnroll()===false&&u.cpuHydrateAll()===false&&u.cpuReg()===null&&u.cpuUnit("nc_envirothon")===null&&u.win.HoweUnits===undefined&&u.cpuWatch("word_roots")===false&&u.cpuAdminWatch()===false&&u.cpuUnitsHtml()===""&&u.cpuSetupHtml()===""&&u.cpuNewUnitsHtml()===""&&u.cpuLabel("section")===""&&u.cpuFeature("teams")===null&&u.cpuAttached().length===0&&u.cpuPublish("nc_envirothon")===false&&u.cpuAttach("nc_envirothon",true)===false);
    ok(fid+": nothing created, no CSS, no listener, no read, no write", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0&&w.G.content==="");
    const n=world({fam:{familyId:fid,roster:[]},noCpu:true}); ok(fid+": envsStations is the same with or without the block", JSON.stringify(w.envsStations())===JSON.stringify(n.envsStations())); }
  // a Howe kid's own ENVUNIT hydrate (Lincoln's thin record) — the real ENVUNIT block, with and without CPUNIT beside it
  const LIB=require(path.join(REPO,"envirothon.js"));
  const ENVUNIT=src.slice(src.indexOf("// ENVUNIT_START"),src.indexOf("// ENVUNIT_END"));
  const howe=withCpu=>new Function("LIB","HA",`const window={HoweEnvirothon:LIB,HA_FAMILY:HA}; const STARTER_UNITS={}; let tab="units"; let unitStudies={}; const masteryData={}; let db=null;
    const document={ createElement(){ throw new Error("no element on Howe"); }, head:{ appendChild(){} }, getElementById(){ return null; } }; const location={hostname:"adrienne-debug.github.io"};
    function envSiteOn(){ return false; } function envsDemo(){ return false; } const _envs={cls:null}; ${withCpu?CPU:""}
    ${ENVUNIT}
    unitStudies.nc_envirothon=envUnitRecord(); const before=JSON.stringify(unitStudies);
    const r=envHydrateAll(); return { r, before, after:unitStudies, cards:unitStudies.nc_envirothon.decks.reduce((s,d)=>s+(d.cards||[]).length,0), cpu:${withCpu?"{ s:cpuStations(), e:cpuAutoEnroll(), h:cpuHydrateAll(), g:cpuGeneric(unitStudies.nc_envirothon), reg:cpuReg(), units:window.HoweUnits }":"null"} };`)(LIB,{familyId:"howe",roster:[]});
  const A=howe(false), B=howe(true);
  ok("Howe kid: envHydrateAll hydrates Lincoln's "+N(EXP.cards)+" cards the same with CPUNIT in the page (same return, same record, same cards)", A.r===true&&B.r===true&&A.cards===EXP.cards&&B.cards===EXP.cards&&JSON.stringify(A.after)===JSON.stringify(B.after));
  ok("Howe kid: each new hook hands back nothing (null / false), and no HoweUnits is made", B.cpu.s===null&&B.cpu.e===false&&B.cpu.h===false&&B.cpu.reg===null&&B.cpu.units===undefined&&B.cpu.g===false); }

console.log("\n── units/nc_envirothon: the data, the counts, the catalog entry ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("compile_unit.js --check: every rule passes and COUNTS.json / index.json / index.html's CPU_UNITS are current", r.ok, r.err);
  ok("6 sections · 15 decks · "+N(EXP.cards)+" cards · "+N(EXP.core)+" core — the compiler's counts are the data's", Object.keys(r.counts.sections).length===6&&Object.keys(r.counts.decks).length===15&&r.counts.cards===EXP.cards&&r.counts.core===EXP.core&&INDEX.cards===EXP.cards&&INDEX.core===EXP.core);
  const S=r.counts.sections;
  ok("per section (cards / core) = the data: "+Object.keys(EXP.sec).map(k=>k+" "+EXP.sec[k].cards+"/"+EXP.sec[k].core).join(" · "), Object.keys(EXP.sec).every(k=>S[k].cards===EXP.sec[k].cards&&S[k].core===EXP.sec[k].core&&S[k].decks===EXP.sec[k].decks), S);
  ok("the 110 fronts with . or / are allowed only through rules.codedFronts (a note, not an error)", r.warn.some(w=>/^110 fronts/.test(w)));
  ok("tests: 5 sections with a check-in and a final (forestry 15/14 · soils 15/17 · aquatics 14/13 · wildlife 15/14 · cei 20/20)", JSON.stringify(r.counts.tests)===JSON.stringify({forestry:{pre:15,post:14},soils:{pre:15,post:17},aquatics:{pre:14,post:13},wildlife:{pre:15,post:14},cei:{pre:20,post:20}}), r.counts.tests);
  const w=world({fam:FAM}), ED=src.slice(src.indexOf("const ENV_DECKS=["),src.indexOf("const ENV_CARD_COUNT="));
  const ENV_DECKS=new Function(ED+"; return ENV_DECKS;")(), D=w.cpu.cpuDecks(INDEX);
  ok("the catalog's decks are ENV_DECKS exactly: same keys in the same order, same mode, kind, section (= station id) and card count", D.length===15&&ENV_DECKS.every((d,i)=>D[i].key===d[0]&&D[i].mode===d[1]&&D[i].section===d[3]&&D[i].kind===d[4]&&D[i].n===d[5]));
  ok("CPU_UNITS.nc_envirothon in index.html is units/nc_envirothon/index.json (the compiler's catalog entry), and the only built-in unit", JSON.stringify(w.cpu.CPU_UNITS)===JSON.stringify({nc_envirothon:INDEX}));
  ok("the entry carries the unit's labels (Station · Stations · Check-in · Final · species · Key Concept), its features, envirothon.js and the alias", INDEX.labels.section==="Station"&&INDEX.labels.sections==="Stations"&&INDEX.labels.pre==="Check-in"&&INDEX.labels.post==="Final"&&INDEX.labels.item==="species"&&INDEX.labels.concept==="Key Concept"&&INDEX.features.idFlash===true&&INDEX.features.mockRun===false&&INDEX.file==="envirothon.js"&&INDEX.global==="HoweEnvirothon");
  ok("the entry is small (no card) — under 4 KB", Buffer.byteLength(JSON.stringify(INDEX))<4096&&!/"def"|"cards":\[/.test(JSON.stringify(INDEX)));
  const U=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8")), T=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","tests.json"),"utf8"));
  ok("unit.json keeps the cards in ONE place (cards.from the envirothon JSON) and the compiled file is envirothon.js (no 1.5 MB copy)", U.cards.from==="envirothon/nc_envirothon_unit.json"&&U.build.file==="envirothon.js"&&!U.decks.some(d=>d.cards)&&T.from==="envirothon/nc_envirothon_tests.json"&&!fs.existsSync(path.join(REPO,"units","nc_envirothon.js")));
  const L=C.loadUnit(REPO,"nc_envirothon");
  ok("every question has its stable id <form>-<n> (pre-1 … post-20), unique in its form", Object.values(L.tests.sections).every(t=>["pre","post"].every(f=>{ const ids=t[f].items.map(i=>i.id); return ids.every((id,k)=>id===f+"-"+t[f].items[k].n)&&new Set(ids).size===ids.length; })));
  ok("--all --check exits 0 (the CLI)", (()=>{ try{ require("child_process").execFileSync(process.execPath,[path.join(REPO,"units","build","compile_unit.js"),"--all","--check"],{stdio:"pipe"}); return true; }catch(e){ return false; } })()); }

console.log("\n── the compiler's rules, on fixture units ──");
{ const root=tmpRoot(); put(root,"units/fix_unit/unit.json",fixUnit()); put(root,"units/fix_unit/tests.json",fixTests());
  let r=C.compile("fix_unit",{root,write:true});
  ok("a good unit compiles: COUNTS.json, index.json and units/fix_unit.js written", r.ok&&fs.existsSync(path.join(root,"units/fix_unit/COUNTS.json"))&&fs.existsSync(path.join(root,"units/fix_unit/index.json"))&&fs.existsSync(path.join(root,"units/fix_unit.js")), r.err);
  const sb={window:{}, module:{}}; new Function("window","module",fs.readFileSync(path.join(root,"units/fix_unit.js"),"utf8"))(sb.window,sb.module);
  const lib=sb.window.HoweUnits&&sb.window.HoweUnits.fix_unit;
  ok("units/fix_unit.js registers window.HoweUnits.fix_unit = {id, ver, index, unit (decks with their cards, family = Key Concept), tests (with ids)}", lib&&lib.id==="fix_unit"&&lib.index.cards===3&&lib.index.core===2&&lib.unit.decks[0].cards.length===2&&lib.unit.decks[0].cards[0].family==="G1"&&lib.tests.ch1.pre.items[1].id==="pre-2");
  ok("--check right after: current", C.compile("fix_unit",{root,check:true}).ok);
  const bad=(over,re,label,tests)=>{ const R=tmpRoot(); put(R,"units/fix_unit/unit.json",typeof over==="function"?over(fixUnit()):fixUnit(over)); if(tests!==null) put(R,"units/fix_unit/tests.json",tests||fixTests()); const x=C.compile("fix_unit",{root:R}); ok(label, !x.ok&&x.err.some(e=>re.test(e)), x.err); };
  bad(u=>{ u.decks[0].key="Fix.Ch 1"; return u; },/deck key “Fix\.Ch 1” is not safe/,"rule 1: a deck key with . is refused");
  bad(u=>{ u.sections[0].key="ch/1"; u.decks[0].section="ch/1"; return u; },/section key “ch\/1” is not safe/,"rule 1: a section key with / is refused");
  bad(u=>{ u.decks[0].cards[0].name="a.b"; return u; },/front “a\.b” is not safe/,"rule 1: a front with . is refused unless rules.codedFronts");
  ok("rule 1: …and allowed with rules.codedFronts (a note)", (()=>{ const R=tmpRoot(); const u=fixUnit({rules:{codedFronts:true}}); u.decks[0].cards[0].name="a.b"; put(R,"units/fix_unit/unit.json",u); const x=C.compile("fix_unit",{root:R}); return x.ok&&x.warn.some(w=>/^1 fronts/.test(w)); })());
  bad({id:"Fix-Unit"},/unit id/,"rule 1: the unit id must be [a-z][a-z0-9_]*");
  ok("rule 2: a section key or deck key another unit already uses is refused", (()=>{ const R=tmpRoot(); put(R,"units/fix_unit/unit.json",fixUnit()); put(R,"units/other/unit.json",{id:"other",title:"O",sections:[{key:"ch2"}],decks:[{key:"Fix · Ch 1",section:"ch2"}]}); const x=C.compile("fix_unit",{root:R}); return !x.ok&&x.err.some(e=>/section key “ch2” is also in unit other/.test(e))&&x.err.some(e=>/deck key “Fix · Ch 1” is also in unit other/.test(e)); })());
  ok("rule 2: …and the real repo's NC Envirothon keys are guarded the same way (forestry, Forestry · Terms)", (()=>{ const R=tmpRoot(); const u=fixUnit(); u.sections[0].key="forestry"; u.decks[0].section="forestry"; put(R,"units/fix_unit/unit.json",u); put(R,"units/nc_envirothon/unit.json",fs.readFileSync(path.join(REPO,"units/nc_envirothon/unit.json"),"utf8")); const x=C.compile("fix_unit",{root:R}); return !x.ok&&x.err.some(e=>/section key “forestry” is also in unit nc_envirothon/.test(e)); })());
  bad(u=>{ u.decks[1].section="ch9"; return u; },/names section “ch9”/,"rule 3: a deck must name one of the unit's sections");
  bad(u=>{ u.sections.push({key:"ch3",label:"Empty"}); return u; },/section “ch3” has no deck/,"rule 3: every section has a deck");
  bad({labels:{chapter:"x"}},/labels\.chapter is not one of/,"rule 3: labels use only the known words");
  bad({features:{teams:"yes"}},/features\.teams must be true or false/,"rule 3: features are true or false");
  bad(u=>{ delete u.decks[0].cards[1].src; return u; },/has no source/,"rule 4: every card has a source (nothing made up)");
  bad(u=>{ u.decks[0].cards[1].def=""; return u; },/has no back/,"rule 4: every card has a back");
  bad(u=>{ u.decks[0].cards[1].order=1; return u; },/order 1 twice/,"rule 4: order is unique in its deck");
  // rule 5 against the COUNTS.json just written in `root`
  const again=(mut)=>{ const u=fixUnit(); mut(u); put(root,"units/fix_unit/unit.json",u); return C.compile("fix_unit",{root}); };
  r=again(u=>{ u.decks[0].cards.splice(0,1); });
  ok("rule 5: dropping a shipped card (order 1) is refused — order is append-only", !r.ok&&r.err.some(e=>/shipped order 1 dropped or renumbered/.test(e)), r.err);
  r=again(u=>{ u.decks[0].cards[1].order=7; });
  ok("rule 5: renumbering a shipped card is refused", !r.ok&&r.err.some(e=>/shipped order 2 dropped or renumbered/.test(e)), r.err);
  r=again(u=>{ u.decks.splice(1,1); u.sections.splice(1,1); });
  ok("rule 5: a shipped deck can't disappear", !r.ok&&r.err.some(e=>/deck “Fix · Ch 2” shipped before and is gone/.test(e)), r.err);
  r=again(u=>{ u.decks[0].cards.push({name:"delta",def:"fourth",group:"G1",order:3,src:"p.3"}); u.decks[0].cards[0].name="alpha (edited)"; });
  ok("rule 5: a new card above the top is fine, and so is editing a front (its key is its order)", r.ok, r.err);
  put(root,"units/fix_unit/unit.json",fixUnit());
  ok("rule 7: --check finds COUNTS.json stale after a change, and the plain run fixes it", (()=>{ const u=fixUnit(); u.decks[0].cards.push({name:"delta",def:"fourth",group:"G1",order:3,src:"p.3"}); put(root,"units/fix_unit/unit.json",u); const a=C.compile("fix_unit",{root,check:true}); const b=C.compile("fix_unit",{root,write:true}); const c=C.compile("fix_unit",{root,check:true}); return !a.ok&&a.err.some(e=>/COUNTS\.json is not current/.test(e))&&b.ok&&c.ok; })());
  bad(fixUnit(),/the answer isn't one of its 2 choices/,"rule 6: a test answer must point at a choice",{ver:1,sections:{ch1:{pre:{form:"x",items:[{n:1,q:"Q?",choices:["a","b"],ans:2}]}}}});
  bad(fixUnit(),/id “pre-1” twice/,"rule 6: question ids are unique in their form",{ver:1,sections:{ch1:{pre:{form:"x",items:[{n:1,q:"Q?",choices:["a","b"],ans:0},{n:1,q:"Q2?",choices:["a","b"],ans:1}]}}}});
  bad(fixUnit(),/section “ch7” isn't the unit's/,"rule 6: a test's section must be the unit's",{ver:1,sections:{ch7:{pre:{form:"x",items:[]}}}});
  ok("tests are optional per unit (no tests.json is fine)", (()=>{ const R=tmpRoot(); put(R,"units/fix_unit/unit.json",fixUnit()); return C.compile("fix_unit",{root:R}).ok; })());
  ok("a unit built elsewhere (build.file) must be current: a stale file is refused", (()=>{ const R=tmpRoot(); put(R,"units/fix_unit/unit.json",fixUnit({build:{file:"fix.js",by:"x"}}));
    put(R,"fix.js","module.exports={unit:{decks:[{key:'Fix · Ch 1',cards:[{name:'alpha',core:true}]},{key:'Fix · Ch 2',cards:[{name:'gamma',core:true}]}]}};"); const x=C.compile("fix_unit",{root:R}); return !x.ok&&x.err.some(e=>/fix\.js is stale for “Fix · Ch 1”/.test(e)); })());
  ok("index.html's CPU_UNITS is a compile output: a plain run rewrites the unit's entry (others kept, ids sorted), --check flags it stale", (()=>{ const R=tmpRoot(); put(R,"units/fix_unit/unit.json",fixUnit());
    put(R,"index.html",'<script>\n// CPUNIT_START\nconst CPU_UNITS={"zz_other":{"id":"zz_other"}};   // = units/<id>/index.json — WRITTEN by units/build/compile_unit.js\nconst CPU_DEFAULT=[];\n</script>\n');
    const a=C.compile("fix_unit",{root:R,write:true}), h=fs.readFileSync(path.join(R,"index.html"),"utf8"), cat=C.catalogIn(R);
    const b=C.compile("fix_unit",{root:R,check:true}); const u=fixUnit(); u.decks[0].cards[1].core=true; put(R,"units/fix_unit/unit.json",u);
    const c=C.compile("fix_unit",{root:R,check:true}), d=C.compile("fix_unit",{root:R,write:true}), e=C.compile("fix_unit",{root:R,check:true});
    return a.ok&&a.page&&Object.keys(cat.cur).join()==="fix_unit,zz_other"&&cat.cur.fix_unit.core===2&&/\nconst CPU_DEFAULT=\[\];/.test(h)&&/WRITTEN by units\/build\/compile_unit\.js\n/.test(h)&&b.ok&&!b.page
      &&!c.ok&&c.err.some(x=>/index\.html's CPU_UNITS\.fix_unit is not current/.test(x))&&d.ok&&C.catalogIn(R).cur.fix_unit.core===3&&e.ok; })());
  ok("ranges / unranges round-trip (the shipped orders in COUNTS.json)", C.ranges([3,1,2,5,7,6])==="1-3,5-7"&&JSON.stringify(C.unranges("1-3,5-7"))==="[1,2,3,5,6,7]"); }

console.log("\n── HoweUnits and the HoweEnvirothon alias ──");
{ const DEMO_LIB={demo:true,tests:{}}, w=demo("kid",{lib:DEMO_LIB}), R=w.cpu.cpuReg();
  ok("on the site the registry exists, and HoweUnits.nc_envirothon IS window.HoweEnvirothon (the same object)", R&&w.cpu.win.HoweUnits===R&&R.nc_envirothon===w.cpu.win.HoweEnvirothon&&R.nc_envirothon===DEMO_LIB);
  const lib={unit:{decks:[]},tests:{}}, x=world({fam:FAM,lib}); x.envSiteDemoBoot();
  ok("the global wins: envirothon.js's HoweEnvirothon becomes HoweUnits.nc_envirothon", x.cpu.cpuUnit("nc_envirothon")===lib);
  const y=world({fam:FAM}); y.cpu.win.HoweUnits={nc_envirothon:lib}; y.envSiteDemoBoot();
  ok("…and a units/ file that registers HoweUnits.nc_envirothon gets HoweEnvirothon as its alias (ENVUNIT, ENVTEST, ENVIDFLASH keep reading it)", y.cpu.cpuReg()&&y.cpu.win.HoweEnvirothon===lib);
  ok("cpuLoad of an already loaded unit resolves at once; of an unknown unit refuses", await x.cpu.cpuLoad("nc_envirothon").then(l=>l===lib)&&await x.cpu.cpuLoad("nope").then(()=>false,()=>true));
  ok("question ids: its own id, else <form>-<n>", w.cpu.cpuQid("pre",{n:3})==="pre-3"&&w.cpu.cpuQid("post",{n:12,id:"post-12b"})==="post-12b"); }

console.log("\n── the class's sections come from its units ──");
{ const w=demo("teacher"), n=demo("teacher",{noCpu:true}), u=w.cpu, cls=w._envc.cls;
  const strip=a=>a.map(s=>({id:s.id,label:s.label,short:s.short,decks:s.decks}));
  ok("NC Envirothon attached → exactly today's six stations: same ids, labels, short names, decks (key, kind, n, mode), same order", JSON.stringify(strip(w.envsStations()))===JSON.stringify(n.envsStations()), [strip(w.envsStations())[2],n.envsStations()[2]]);
  ok("each station also says its emoji and its unit", w.envsStations().every(s=>s.unit==="nc_envirothon")&&w.envsStations().find(s=>s.id==="forestry").emoji==="\u{1F332}");
  ok("the demo class has NC Envirothon attached; a class with no units record reads it as attached (today's class)", JSON.stringify(cls.units)===JSON.stringify({nc_envirothon:true})&&JSON.stringify(u.cpuAttached({name:"x"}))==='["nc_envirothon"]'&&JSON.stringify(u.cpuAttached(null))==='["nc_envirothon"]');
  ok("plan.<key>.order reorders (Wildlife first), the rest keep the unit's order", u.cpuStations(Object.assign({},cls,{plan:{wildlife:{order:-1}}})).map(s=>s.id).join(" ")==="wildlife general forestry soils aquatics cei");
  ok("detached ({nc_envirothon:false}) → no sections at all (never today's stations by mistake)", u.cpuStations({units:{nc_envirothon:false}}).length===0);
  u._cpu.cat.word_roots={index:FIX};
  ok("a second unit from the catalog: its sections follow NC Envirothon's, with its own decks", u.cpuStations({units:{nc_envirothon:true,word_roots:true}}).map(s=>s.id).join(" ")==="general forestry soils aquatics wildlife cei roots_sep roots_oct"&&u.cpuStations({units:{word_roots:true}})[1].decks[0].key==="Roots · October");
  ok("a unit missing from the catalog is skipped, never guessed", u.cpuStations({units:{nope_unit:true}}).length===0);
  const L=world({fam:FAM}); L._envs.role="kid"; L._envs.cls={units:{word_roots:true}}; L.G.remote["units/word_roots/index"]=FIX;
  const s0=L.cpu.cpuStations(), s1=L.cpu.cpuStations();
  ok("live: a unit the code doesn't carry is read from units/<id>/index (one listener), then its sections appear", s0.length===0&&L.G.listeners.filter(l=>l.p==="units/word_roots/index").length===1&&s1.map(s=>s.id).join(" ")==="roots_sep roots_oct"&&(L.cpu.cpuStations(),L.G.listeners.filter(l=>/^units\//.test(l.p)).length===1)); }

console.log("\n── the words and features: the unit's, under the class's ──");
{ const w=demo("teacher"), cp=w.cp, u=w.cpu; u._cpu.cat.word_roots={index:FIX}; u._cpu.cat.plain_unit={index:Object.assign({},FIX,{id:"plain_unit",labels:{},features:{teams:true}})};
  ok("NC Envirothon: Station · Stations · Check-in · Final · species · Key Concept", ["section","sections","pre","post","item","concept"].map(k=>cp.cpLabel(k)).join("|")==="Station|Stations|Check-in|Final|species|Key Concept");
  ok("the class's own word wins (Eco Club calls it a Topic)", cp.cpLabel("section",Object.assign({},w._envc.cls,{labels:{section:"Topic"}}))==="Topic");
  ok("a unit with its own words (Word Roots: Month / Months) — and the plain word where it has none (Pre-test)", cp.cpLabel("section",{units:{word_roots:true}})==="Month"&&cp.cpLabel("sections",{units:{word_roots:true}})==="Months"&&cp.cpLabel("pre",{units:{word_roots:true}})==="Pre-test");
  ok("a unit with no words at all reads the plain ones, never Envirothon's (Section · Post-test · Topic)", cp.cpLabel("section",{units:{plain_unit:true}})==="Section"&&cp.cpLabel("post",{units:{plain_unit:true}})==="Post-test"&&cp.cpLabel("concept",{units:{plain_unit:true}})==="Topic");
  ok("features: NC Envirothon's (teams, boards, specialists, ID Flash on; mock run off); a unit without them → off; the class's own switch wins", cp.cpFeature("teams")===true&&cp.cpFeature("idFlash")===true&&cp.cpFeature("mockRun")===false&&cp.cpFeature("teams",{units:{word_roots:true}})===false&&cp.cpFeature("teams",{units:{plain_unit:true}})===true&&cp.cpFeature("teams",{units:{nc_envirothon:true},features:{teams:false}})===false); }

console.log("\n── enroll: once per attached unit ──");
function tickMs(w,ms){ const T=w.G.timers||[], i=T.findIndex(t=>t.ms===ms); if(i<0) return false; const t=T.splice(i,1)[0]; t.fn(); return true; }
function kidWorld(cls){ const w=world({fam:FAM,mastReady:true,unitsReady:true}); w._envs.role="kid"; w._envs.kid="maya"; w._envs.dbUrl="x"; w._envs.cls=cls; w.initFb(); return w; }
{ const w=kidWorld({units:{nc_envirothon:true,word_roots:true}}); w.cpu._cpu.cat.word_roots={index:FIX};
  const r=w.envsAutoEnroll(); await w.flush();
  const tx=w.G.writes.filter(x=>x[0]==="transaction");
  ok("two units attached: the first (by id) starts — its thin record from the catalog, by transaction, every deck bank-only", r===true&&tx.length===1&&tx[0][1]==="unitStudies/nc_envirothon");
  tickMs(w,1500); await w.flush();
  ok("NC Envirothon enrolls exactly as today (6 stages through _ustApply/_ustWrite, its 🌿 session), then the next unit starts", w.G.ust.filter(x=>x[0]==="apply").length===6&&w.G.sessionMade==="maya"&&w.unitStudies.nc_envirothon.enrolled.maya===true&&w.G.writes.filter(x=>x[0]==="transaction").map(x=>x[1]).join(",")==="unitStudies/nc_envirothon,unitStudies/word_roots");
  const rec=w.G.writes.find(x=>x[0]==="transaction"&&x[1]==="unitStudies/word_roots")[2];
  ok("Word Roots' record: thin (cardsInCode, no card), its two sections as stages, both decks bank-only on their stage, its title and emoji", rec.cardsInCode===true&&rec.starter==="word_roots"&&rec.stages.length===2&&rec.decks.length===2&&rec.decks.every(d=>d.bankOnly===true&&!d.cards)&&rec.decks[1].stage===1&&rec.decks[1].station==="roots_oct"&&rec.title==="Word Roots"&&rec.cardCount===24);
  ok("…it waits while its cards aren't in memory yet (its file still loading), and tries again in 2.5 s", (()=>{ tickMs(w,1500); return w._envs.autoEnroll==="working"&&(w.G.timers||[]).some(t=>t.ms===2500); })()&&!w.unitStudies.word_roots.enrolled);
  w.unitStudies.word_roots.decks.forEach((d,i)=>{ d.cards=[{name:"r"+i,def:"x",stage:i,order:1}]; }); tickMs(w,2500); await w.flush();
  ok("then Word Roots enrolls: its 2 stages applied and written, enrolled/<kid>, one session under its own id (create-only), state done", w.G.ust.filter(x=>x[0]==="write").length===8&&w.unitStudies.word_roots.enrolled.maya===true&&w.masteryData.maya_sessions&&w.masteryData.maya_sessions.word_roots&&w.masteryData.maya_sessions.word_roots.name==="Word Roots"&&w.G.writes.some(x=>x[0]==="set"&&x[1]==="mastery/maya_sessions/word_roots")&&w._envs.autoEnroll==="done", w.G.ust);
  ok("the only set is Word Roots' session (NC Envirothon's is ENVUNIT's own envEnrollSession, as today)", w.G.writes.filter(x=>x[0]==="set").map(x=>x[1]).join(",")==="mastery/maya_sessions/word_roots");
  ok("a further call does nothing (and a late timer can't enroll a unit twice)", w.envsAutoEnroll()===false&&w.G.ust.length===16&&(()=>{ while(w.tick()); return w.G.ust.length===16; })());
  const d=kidWorld({units:{nc_envirothon:false}}); ok("NC Envirothon detached → nothing enrolled, nothing written", d.envsAutoEnroll()===false&&d.G.writes.length===0&&d._envs.autoEnroll==="done");
  const e=kidWorld(null); e.unitStudies.nc_envirothon={id:"nc_envirothon",starter:"nc_envirothon",enrolled:{maya:true},stages:[{n:0}],decks:[]};
  e._envs.cls={units:{nc_envirothon:true,word_roots:true}}; e.cpu._cpu.cat.word_roots={index:FIX};
  ok("a unit attached LATER is enrolled at the next paint (no reload): only the new unit's transaction", e.envsAutoEnroll()===true&&(await e.flush(),e.G.writes.filter(x=>x[0]==="transaction").map(x=>x[1]).join(","))==="unitStudies/word_roots");
  const g=kidWorld(null); g.unitStudies.word_roots={id:"word_roots",starter:"word_roots",cardsInCode:true,decks:[{key:"Roots · September",stage:0}]};
  g.cpu._cpu.cat.word_roots={index:FIX}; g.cpu.win.HoweUnits={word_roots:{unit:{decks:[{key:"Roots · September",cards:[{name:"bio",def:"life",group:"Greek",order:1,src:"p.1"}]}]}}};
  ok("its cards come from HoweUnits.word_roots in memory (stage = its deck's, family = Key Concept); NC Envirothon's are not touched", g.cpu.cpuHydrateAll()===true&&g.unitStudies.word_roots.decks[0].cards[0].stage===0&&g.unitStudies.word_roots.decks[0].cards[0].family==="Greek"&&g.cpu.cpuGeneric({cardsInCode:true,starter:"nc_envirothon"})===false&&g.G.writes.length===0); }

console.log("\n── 🔑 Adrienne ▸ 📦 Units ──");
{ const w=demo("admin"); const h=w.G.content;
  ok("Adrienne's console has the 📦 Units chip, before 🔑 Admin; the teacher's has none", /📦 Units<\/button><button[^>]*>🔑 Admin/.test(h)&&!/📦 Units/.test(demo("teacher").G.content));
  const v=view(w,"units");
  ok("📦 Units: NC Envirothon · v1 · "+SUM, /NC Envirothon/.test(v)&&/v1/.test(v)&&RX(SUM).test(v));
  ok("…one row per station with its emoji, label, decks, cards and core, as the data counts them", Object.keys(EXP.sec).every(k=>{ const x=EXP.sec[k]; return v.indexOf("<tr><td>"+x.emoji+" "+x.label.replace(/&/g,"&amp;")+'</td><td class="c">'+x.decks+'</td><td class="c">'+N(x.cards)+'</td><td class="c">'+N(x.core)+"</td></tr>")>=0; })&&(v.match(/<tr><td>/g)||[]).length===6);
  ok("…✓ Published v1 (the demo's catalog), the classes using it, the Publish button, how a new unit comes in", /✓ Published v1/.test(v)&&/Attached to: <b>MS Science 2026-27<\/b>/.test(v)&&/cpuPublish\('nc_envirothon'\)/.test(v)&&/compile_unit\.js/.test(v));
  const n=w._envs.writes.length; w.cpu.cpuPublish("nc_envirothon"); await w.flush(); const pw=w._envs.writes[w._envs.writes.length-1];
  ok("Publish (demo): one 'would set' of units/nc_envirothon/index = the catalog entry; nothing else", w._envs.writes.length===n+1&&pw.op==="set"&&pw.path==="units/nc_envirothon/index"&&JSON.stringify(pw.val)===JSON.stringify(INDEX)&&w.G.writes.length===0);
  w.cpu._cpu.cat={}; ok("not published yet → says so", /Not published yet/.test(view(w,"units")));
  w.cpu._cpu.cat={nc_envirothon:{index:Object.assign({},INDEX,{cards:1})}}; ok("an older catalog copy → says so", /The catalog has an older copy/.test(view(w,"units")));
  const fbOrder=v=>(v&&typeof v==="object"&&!Array.isArray(v))?Object.fromEntries(Object.keys(v).sort().map(k=>[k,fbOrder(v[k])])):Array.isArray(v)?v.map(fbOrder):v; w.cpu._cpu.cat={nc_envirothon:{index:fbOrder(INDEX)}};
  ok("…but the same entry with its keys in Firebase's order is current", w.cpu.cpuPubState("nc_envirothon")==="current");
  const t=demo("teacher"); ok("a teacher can't reach it (view falls back to the class grid) and can't publish", !/📦 Units/.test(view(t,"units"))&&t.cpu.cpuPublish("nc_envirothon")===false&&t.cpu.cpuUnitsHtml()==="");
  const L=world({fam:FAM}); L._envs.role="admin"; L._envs.uid="a1"; L._envc.sdb=L.firebase.database(); L._envc.cid="c1"; L._envc.cls={name:"C1"}; L._envc.classes={c1:L._envc.cls};
  L.G.remote["units"]={nc_envirothon:{index:INDEX},word_roots:{index:FIX,trim:{x:1}}}; L.cpu.cpuUnitsHtml();
  ok("live: Adrienne's 📦 Units reads the whole catalog once (units) and lists a published unit the code doesn't carry", L.G.listeners.filter(l=>l.p==="units").length===1&&(L.cpu.cpuUnitsHtml(),L.G.listeners.filter(l=>l.p==="units").length===1)&&/Word Roots/.test(L.cpu.cpuUnitsHtml())&&/From the catalog/.test(L.cpu.cpuUnitsHtml())); }

console.log("\n── 🏫 Class setup ▸ 📦 Units; attach, detach, + Class ──");
{ const t=demo("teacher"), v=view(t,"setup");
  ok("Teacher ▸ 🏫 Class setup lists NC Envirothon attached: "+SUM_SETUP+", “Units are attached by Adrienne”, no button", /📦 Units/.test(v)&&/NC Envirothon/.test(v)&&RX(SUM_SETUP).test(v)&&/✓ Attached/.test(v)&&/Units are attached by Adrienne/.test(v)&&!/cpuAttach\(/.test(v)&&/Its stations come from these units/.test(v));
  ok("the teacher can't attach or detach", t.cpu.cpuAttach("nc_envirothon",false)===false&&t._envs.writes.length===0);
  const a=demo("admin"); a.cpu._cpu.cat.word_roots={index:FIX}; const va=view(a,"setup");
  ok("Adrienne: Detach on NC Envirothon, “+ Attach” on a catalog unit not attached, the nothing-is-deleted line", /cpuAttach\('nc_envirothon',false\)">Detach/.test(va)&&/cpuAttach\('word_roots',true\)">\+ Attach/.test(va)&&/Nothing is deleted/.test(va));
  a.cpu.cpuAttach("word_roots",true); await a.flush(); let wr=a._envs.writes[a._envs.writes.length-1];
  ok("attach: ONE targeted update at classes/<cid>/units = {nc_envirothon:true, word_roots:true}; the class's sections grow", wr.op==="update"&&wr.path==="classes/"+CID+"/units"&&JSON.stringify(wr.val)===JSON.stringify({nc_envirothon:true,word_roots:true})&&a.envsStations().length===8);
  a.cpu.cpuAttach("nc_envirothon",false); await a.flush(); wr=a._envs.writes[a._envs.writes.length-1];
  ok("detach: the same one update with nc_envirothon:false; its stations leave the class (nothing removed)", JSON.stringify(wr.val)===JSON.stringify({nc_envirothon:false,word_roots:true})&&a.envsStations().map(s=>s.id).join(" ")==="roots_sep roots_oct"&&!a._envs.writes.some(x=>x.op==="remove"));
  ok("PURE: a class with no units record starts from NC Envirothon, so attaching a second unit keeps it", JSON.stringify(a.cpu.cpuUnitsAfter({name:"x"},"word_roots",true))===JSON.stringify({nc_envirothon:true,word_roots:true})&&JSON.stringify(a.cpu.cpuUnitsAfter({units:{nc_envirothon:true}},"nc_envirothon",false))===JSON.stringify({nc_envirothon:false}));
  const b=demo("admin"); view(b,"admin"); const vb=b.G.content;
  ok("+ Class: a Units row with NC Envirothon ticked", /Units:<\/span>/.test(vb)&&/id="cpu-new-nc_envirothon" checked/.test(vb));
  b.el("envc-cls-id","eco-club"); b.el("envc-cls-name","Eco Club"); b.cp.cpClassAdd(); await b.flush(); let cw=b._envs.writes[b._envs.writes.length-1];
  ok("+ Class (nothing unticked) → classes/eco-club.units = {nc_envirothon:true}", cw.op==="update"&&cw.path==="/"&&JSON.stringify(cw.val["classes/eco-club"].units)===JSON.stringify({nc_envirothon:true}));
  const c=demo("admin"); c.el("envc-cls-id","word-club"); c.el("envc-cls-name","Word Club"); c.el("cpu-new-nc_envirothon").checked=false; c.cp.cpClassAdd(); await c.flush(); cw=c._envs.writes[c._envs.writes.length-1];
  ok("+ Class with NC Envirothon unticked → {nc_envirothon:false} (kept as false, so the class doesn't fall back to it)", JSON.stringify(cw.val["classes/word-club"].units)===JSON.stringify({nc_envirothon:false})); }

console.log("\n── nothing else moves: kid, parent and teacher screens are what they were ──");
{ const pages=(o)=>{ const r={};
    const k=demo("kid",o); r.kid=k.G.content; k.envsView("scores"); r.scores=k.G.content;
    const p=demo("parent",o); r.parent=p.G.content;
    const t=demo("teacher",o); r.grid=t.G.content; t.envcView("send"); r.send=t.G.content; t.envcView("strong"); r.strong=t.G.content; t.envcView("student","ramirez_maya"); r.student=t.G.content;
    return r; };
  const A=pages({}), B=pages({noCpu:true});
  Object.keys(A).forEach(k=>ok(k+": byte-for-byte the same with CPUNIT in the page", A[k]===B[k]&&A[k].length>500, [A[k].length,B[k].length])); }

console.log("\n── the rules file, the setup note, the demo ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules;
  ok("units/<id>/index: every login reads, only an admin writes, the shape and the id are checked; the units root is admin-only", /admins/.test(R.units[".read"])&&R.units.$unitId.index[".read"]==="auth != null"&&/admins/.test(R.units.$unitId.index[".write"])&&/hasChildren\(\['id','title','ver','sections','decks'\]\)/.test(R.units.$unitId.index[".validate"])&&/== \$unitId/.test(R.units.$unitId.index[".validate"]));
  ok("classes/<cid>/units/<id>: true | false, admin only (inherits the class's admin write; no teacher child rule)", /newData\.isBoolean\(\)/.test(R.classes.$cid.units.$unitId[".validate"])&&!R.classes.$cid.units[".write"]&&/admins/.test(R.classes.$cid[".write"]));
  ok("SITE_SETUP.md explains 📦 Units, attach / detach and bringing in a unit", /📦 Units/.test(fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8"))&&/compile_unit\.js/.test(fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8")));
  const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")); const html=buildDemo(src,"test",{});
  ok("make_demo carries the block (the demo shows 📦 Units)", html.indexOf("// CPUNIT_START")>0&&html.indexOf("function cpuUnitsHtml(")>0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
