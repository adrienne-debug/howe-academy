/*
 * Node tests — 📐 CPITEMTRIANGLE, the soil texture triangle: the `chart` skill item type (DESIGN_class_platform_2026-10-28.md §4.1b,
 * §13 rows 25–27; RESEARCH_envirothon_skills_2026-10-28.md §4.1, ranked #4 in §5; §8.1 the cards it replaces). Given % clay / silt / sand,
 * the student draws the clay line, puts the dot where the silt and sand lines cross it, and names the class — through the skill engine's
 * three stages (shown → faded → on your own).
 *   · Where the block sits (right after CPSENDEARLY_END), how it hooks (CPSKILL's extension point, one guarded demo line), what it never does.
 *   · THE BOUNDARIES: the unit's 12 class rules against the Soil Survey Manual's definitions written out again here, on every half percent
 *     of the triangle; known points, the boundary and corner points of every class; the shapes tile the triangle.
 *   · compile_unit.js rule 8 for a ternary chart (each error caught), COUNTS.json (items = classes), the catalog entry and CPU_UNITS.
 *   · The maker over many seeds: whole percents adding to 100, the class right, tol from every boundary, 3 steps, 4 names; a sitting's 6
 *     different classes, the misnamed ones first, all 12 over sittings.
 *   · The geometry (percents ↔ the chart), the taps, the miss codes (axis / line / name) and their words; the inline SVG.
 *   · The demo kid: 👀 → ✍️ (lines drawn → one line drawn) → 💪, ONE write, summary.skills; the teacher: the note, the classmates' counts,
 *     "skills learned" (📅 Pace's line), the most-missed step; a live kid from the catalog; Howe and Lincoln: nothing on.
 * Every count comes from the unit's data, never typed in.                                          run: node test_cp_item_triangle.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
const C=require("./units/build/compile_unit.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const UNIT=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const COUNTS=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","COUNTS.json"),"utf8"));
const INDEX=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","index.json"),"utf8"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"), GEAR=cut("// CPITEMGEAR_START","// CPITEMGEAR_END"), BLK=cut("// CPITEMTRIANGLE_START","// CPITEMTRIANGLE_END");
const XS="\nfunction envPicsIndex(){ return null; }\nG.sk={ CPSK_TYPES, CPSK_SITTING, _cpsk, cpskRng, cpskFb, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillSummary, cpSkillPaceLine, cpSkillFoldRows, cpSkillMissLabel, cpSkillStudyWrap };";
const XT="\nG.t={ CPT_CHART, CPT_PREV, CPT_TRI, CPT_VB, CPT_COLOR, cptOn, cptChart, cptAx, cptTol, cptP, cptTerms, cptClassOf, cptPool, cptOrder, cptNear, cptXY, cptPt, cptEnds, cptWrongAxis, cptSvg, cptLit, cptLayers, cptActive, cptGiven, cptTap, cptUndo, cpTriangleDemoSeed };";
// tri false = the same world without this block (the control)
function W(o){ o=o||{}; const t=o.tri!==false; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+SKL+"\n"+GEAR+"\n"+(t?BLK:"")+XS+(t?XT:"\nG.t=null;")},o.w||{})); w.S=w.G.sk; w.T=w.G.t; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", T0=Date.UTC(2026,9,28,15,0,0), FBT="soils:texture_triangle";
const SK=(UNIT.skills||[]).find(s=>s.key==="soils.texture_triangle"), D=SK&&SK.data, CL=(D&&D.classes)||[];
const byKey=k=>CL.find(c=>c.key===k);
// THE SOIL SURVEY MANUAL'S DEFINITIONS (USDA NRCS Handbook 18, 2017, ch. 3), written out again here as plain ifs — the unit's rules must agree
function usda(c,s,a){
  if(s+1.5*c<15) return "sand";
  if(s+1.5*c>=15&&s+2*c<30) return "loamy_sand";
  if((c>=7&&c<20&&a>52&&s+2*c>=30)||(c<7&&s<50&&s+2*c>=30)) return "sandy_loam";
  if(c>=7&&c<27&&s>=28&&s<50&&a<=52) return "loam";
  if((s>=50&&c>=12&&c<27)||(s>=50&&s<80&&c<12)) return "silt_loam";
  if(s>=80&&c<12) return "silt";
  if(c>=20&&c<35&&s<28&&a>45) return "sandy_clay_loam";
  if(c>=27&&c<40&&a>20&&a<=45) return "clay_loam";
  if(c>=27&&c<40&&a<=20) return "silty_clay_loam";
  if(c>=35&&a>45) return "sandy_clay";
  if(c>=40&&s>=40) return "silty_clay";
  if(c>=40&&a<=45&&s<40) return "clay";
  return null;
}
// [clay, silt, sand, class]: the test's own example (2022 Soils Q6), common textbook points, and the boundary and corner points of every class
const KNOWN=[[30,40,30,"clay_loam"],[20,40,40,"loam"],[10,70,20,"silt_loam"],[50,30,20,"clay"],[5,10,85,"loamy_sand"],[15,15,70,"sandy_loam"],[30,10,60,"sandy_clay_loam"],[45,45,10,"silty_clay"],[33,60,7,"silty_clay_loam"],[3,92,5,"silt"],[2,3,95,"sand"],[42,5,53,"sandy_clay"],
  [0,0,100,"sand"],[100,0,0,"clay"],[0,100,0,"silt"],
  [40,40,20,"silty_clay"],[40,39,21,"clay"],[39,40,21,"clay_loam"],[60,40,0,"silty_clay"],[60,39,1,"clay"],[40,60,0,"silty_clay"],[39,61,0,"silty_clay_loam"],
  [40,15,45,"clay"],[40,14,46,"sandy_clay"],[55,0,45,"clay"],[54,0,46,"sandy_clay"],[35,20,45,"clay_loam"],[35,19,46,"sandy_clay"],[34,20,46,"sandy_clay_loam"],[35,0,65,"sandy_clay"],[34,0,66,"sandy_clay_loam"],
  [27,28,45,"clay_loam"],[26,28,46,"loam"],[27,27,46,"sandy_clay_loam"],[27,53,20,"silty_clay_loam"],[27,52,21,"clay_loam"],[26,54,20,"silt_loam"],[27,50,23,"clay_loam"],[26,50,24,"silt_loam"],[26,49,25,"loam"],
  [27,73,0,"silty_clay_loam"],[26,74,0,"silt_loam"],[12,80,8,"silt_loam"],[11,80,9,"silt"],[12,88,0,"silt_loam"],[11,89,0,"silt"],[0,80,20,"silt"],[0,79,21,"silt_loam"],
  [0,50,50,"silt_loam"],[0,49,51,"sandy_loam"],[7,50,43,"silt_loam"],[7,49,44,"loam"],[7,41,52,"loam"],[6,42,52,"sandy_loam"],[7,40,53,"sandy_loam"],[7,28,65,"sandy_loam"],
  [20,28,52,"loam"],[20,27,53,"sandy_clay_loam"],[19,28,53,"sandy_loam"],[20,0,80,"sandy_clay_loam"],[19,0,81,"sandy_loam"],[15,0,85,"sandy_loam"],[14,1,85,"loamy_sand"],
  [10,0,90,"loamy_sand"],[9,0,91,"sand"],[0,15,85,"loamy_sand"],[0,14,86,"sand"],[0,30,70,"sandy_loam"],[0,29,71,"loamy_sand"],[2,12,86,"loamy_sand"],[2,11,87,"sand"]];
// the chart's VIEW box and a fake element, so cptTap can be given a point
const tapAt=(w,pt)=>{ const z=w.T.cptXY(w.S._cpsk.run.sk.data,pt), vb=w.T.CPT_VB.split(" ").map(Number); return w.T.cptTap({clientX:z[0],clientY:z[1]},{getBoundingClientRect:()=>({left:0,top:0,width:vb[2],height:vb[3]})}); };
const P3=(c,s,a)=>({clay:c,silt:s,sand:a});

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPITEMTRIANGLE_START"), b=src.indexOf("// CPITEMTRIANGLE_END"), e=src.indexOf("// CPSENDEARLY_END\n");
  ok("CPITEMTRIANGLE once, IMMEDIATELY after CPSENDEARLY_END (after CPSKILL, so its registry exists)", a>0&&b>a&&src.indexOf("// CPITEMTRIANGLE_START",a+1)<0&&e+"// CPSENDEARLY_END\n".length===a&&src.indexOf("// CPSKILL_END")<a);
  ok("the header names §4.1b, §13 rows 25–27, the research's §4.1, its #4 rank and §8.1, the exact rules, the inline SVG, the miss codes, what isn't built, and the dates", /§4\.1b/.test(BLK)&&/§13 rows\s*\n?\/\/ 25–27|§13 rows 25–27/.test(BLK)&&/RESEARCH_envirothon_skills_2026-10-28\.md §4\.1/.test(BLK)&&/ranked #4/.test(BLK)&&/§8\.1/.test(BLK)&&/Soil Survey Manual's own rule/.test(BLK)&&/inline SVG/.test(BLK)&&/WHICH STEP WAS MISSED/.test(BLK)&&/NOT BUILT/.test(BLK)&&/2026-10-28/.test(BLK)&&/2026-10-29/.test(BLK));
  ok("the block only declares, plus its one registration through CPSKILL's extension point", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)||/^if\(typeof cpSkillTypeAdd==="function"\) cpSkillTypeAdd\("chart",CPT_CHART\);/.test(l)));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n").replace(/_cpt\.(pool|fn)\.set\(/g,"memo(");   // (its two in-memory memos are WeakMaps)
  ok("it writes nothing and reads nothing: no set / update / remove / once / on, no envsWrite / envcWrite, no db or firebase", !/\.set\(|\.update\(|\.remove\(|\.once\(|\.on\(|envsWrite|envcWrite|\bdb\b|firebase/.test(code));
  ok("no image file and nothing hot-linked: no <img, no http(s) URL but the SVG namespace", !/<img/.test(code)&&!/https?:\/\//.test(code.replace(/http:\/\/www\.w3\.org\/2000\/svg/g,"")));
  ok("no Howe kid name as a code literal; no 'Station' in its strings; no 🔀 in index.html", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/["'][^"'\n]*\bStations?\b/.test(code)&&src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/📐 CPITEMTRIANGLE/.test(l)&&!/^\s*\/\//.test(l));
  ok("ONE hook line outside the block, tagged 📐 CPITEMTRIANGLE and guarded: envsDemoStart, its last line (after the skill seeds; other skill seeds may sit between: wave-8 merge 2026-10-29)", hooks.length===1&&
    /  try\{ masteryKid="maya"; \}catch\(e\)\{\}\n(?:  try\{ if\(typeof cp\w+DemoSeed[^\n]*\n){0,3}  try\{ if\(typeof cpTriangleDemoSeed==="function"\) cpTriangleDemoSeed\(data\); \}catch\(e\)\{\}   \/\/ 📐 CPITEMTRIANGLE[^\n]*\n\}\nfunction envsDemoSeedKid/.test(src)&&src.indexOf("cpSkillDemoSeed(data)")<src.indexOf("cpTriangleDemoSeed(data)"), hooks.map(l=>l.trim().slice(0,80)));
  ok("CPSKILL and CPITEMGEAR are untouched by it (no 📐 line inside them)", !/📐/.test(SKL)&&!/📐/.test(GEAR)); }

console.log("\n── the data: the USDA triangle, in the unit ──");
{ ok("one chart skill in units/nc_envirothon/unit.json: soils.texture_triangle, Soils, type chart, kind ternary, core", !!SK&&SK.section==="soils"&&SK.type==="chart"&&SK.core===true&&D.kind==="ternary"&&(UNIT.skills||[]).filter(s=>s.type==="chart").length===1);
  ok("the three axes: clay (top), silt (bottom right), sand (bottom left), each with the side it is read on and the way its lines run", JSON.stringify(D.axes.map(a=>a.key))==='["clay","silt","sand"]'&&D.axes.every(a=>a.side&&a.dir)&&/across/.test(D.axes[0].dir)&&/down and to the left/.test(D.axes[1].dir)&&/up and to the left/.test(D.axes[2].dir));
  const twelve=["sand","loamy sand","sandy loam","loam","silt loam","silt","sandy clay loam","clay loam","silty clay loam","sandy clay","silty clay","clay"];
  ok("the 12 USDA texture classes, each with the manual's words, a rule, a shape and a label spot", CL.length===12&&twelve.every(n=>CL.some(c=>c.label===n))&&CL.every(c=>c.words&&Array.isArray(c.rule)&&Array.isArray(c.poly)&&Array.isArray(c.at)), CL.map(c=>c.label));
  const card=r=>{ const m=/^(.+)#o(\d+)$/.exec(r), d=LIB.unit.decks.find(x=>x.key===m[1]); return d&&d.cards.find(c=>c.order===+m[2]); }, rep=(SK.replaces||[]).map(card);
  ok("replaces = the research's §8.1 list: the 'Texture triangle' term, 'Sand texture class · makeup', 'Silt texture class · makeup' (real cards)", rep.length===3&&rep.every(Boolean)&&JSON.stringify(rep.map(c=>c.name).sort())===JSON.stringify(["Sand texture class · makeup","Silt texture class · makeup","Texture triangle"]), rep.map(c=>c&&c.name));
  ok("…and keeps the cards the research keeps (the '12 classes' fact is not replaced)", !(SK.replaces||[]).some(r=>{ const c=card(r); return c&&/How many texture classes/.test(c.name); }));
  const soilsQ=[].concat(...["pre","post"].map(f=>(LIB.tests.soils[f]||{items:[]}).items.map(i=>({f,i}))));
  ok("tests is empty: no triangle question is in the app's Soils forms (they are picture questions the forms leave out)", Array.isArray(SK.tests)&&SK.tests.length===0&&!soilsQ.some(x=>/triangle|% ?clay|percent clay/i.test(x.i.q)));
  ok("the kid's and the teacher's words come from the data (This soil is · Which texture class is the dot in? · tol 4)", D.thing==="This soil is"&&D.nameLbl==="Which texture class is the dot in?"&&D.tol===4); }

console.log("\n── the boundaries, exactly ──");
{ const w=W(), T=w.T; let bad=null, n=0;
  for(let c2=0;c2<=200&&!bad;c2++) for(let s2=0;c2+s2<=200;s2++){ const c=c2/2, s=s2/2, a=100-c-s, want=usda(c,s,a), got=T.cptClassOf(D,P3(c,s,a)); n++; if(!got||got.key!==want){ bad=[c,s,a,want,got&&got.key]; break; } }
  ok("on EVERY half percent of the triangle ("+n+" points), the unit's rules give the Soil Survey Manual's class", !bad, bad);
  bad=null; for(let c=0;c<=100&&!bad;c++) for(let s=0;c+s<=100;s++){ const a=100-c-s, L=C.ternClassesAt(CL,["clay","silt","sand"],P3(c,s,a)); if(L.length!==1){ bad=[c,s,a,L.map(x=>x.key)]; break; } }
  ok("…and every point is in exactly ONE class's rule (no gap, no overlap — a boundary belongs to one side)", !bad, bad);
  const miss=KNOWN.filter(k=>{ const g=T.cptClassOf(D,P3(k[0],k[1],k[2])); return !g||g.key!==k[3]||usda(k[0],k[1],k[2])!==k[3]; });
  ok(KNOWN.length+" known points — the 2022 Soils Q6 example (30% clay, 40% silt → clay loam), the corners and both sides of every boundary — all right", miss.length===0&&KNOWN.every(k=>k[0]+k[1]+k[2]===100), miss);
  ok("every one of the 12 classes is among the known points", CL.every(c=>KNOWN.some(k=>k[3]===c.key)));
  // every quarter percent strictly inside a class's shape (not on an edge) is that class — the drawing matches the rules
  const inside=(poly,x,y)=>{ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const a=poly[i], b=poly[j]; if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; };
  const nearEdge=(poly,x,y)=>poly.some((a,i)=>{ const b=poly[(i+1)%poly.length], dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy, t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/L)); return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<0.05; });
  bad=null; let inN=0; CL.forEach(c=>{ for(let x=0.125;x<100&&!bad;x+=0.25) for(let y=0.125;x+y<100;y+=0.25){ if(!inside(c.poly,x,y)||nearEdge(c.poly,x,y)) continue; inN++; const g=T.cptClassOf(D,T.cptP(D,x,y)); if(!g||g.key!==c.key){ bad=[c.key,x,y,g&&g.key]; break; } } });
  ok("every quarter-percent point inside a class's drawn shape ("+inN+" points) is that class (the drawing matches the rules)", !bad&&inN>70000, bad||inN);
  const area=CL.reduce((s,c)=>s+C.ternArea(c.poly),0);
  ok("the 12 shapes tile the triangle (their areas add to 5000 percent², the whole)", Math.abs(area-5000)<1e-9, area);
  ok("each class name is drawn inside its own class", CL.every(c=>{ const g=T.cptClassOf(D,T.cptP(D,c.at[0],c.at[1])); return g&&g.key===c.key; }), CL.filter(c=>{ const g=T.cptClassOf(D,T.cptP(D,c.at[0],c.at[1])); return !g||g.key!==c.key; }).map(c=>c.key));
  ok("the page and compile read a rule the same way (cptTerms ≡ ternTerms)", ["silt+1.5clay","silt+2clay","clay","2silt+sand","mud","silt+"].every(e=>JSON.stringify(T.cptTerms(e,["clay","silt","sand"]))===JSON.stringify(C.ternTerms(e,["clay","silt","sand"])))); }

console.log("\n── compile_unit.js rule 8 (ternary), COUNTS.json, the catalog entry ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("the unit compiles and is current (--check)", r.ok, r.err);
  ok("COUNTS.json: the triangle's items are its classes ("+CL.length+")", COUNTS.skills&&COUNTS.skills["soils.texture_triangle"]&&COUNTS.skills["soils.texture_triangle"].items===CL.length&&COUNTS.skills["soils.texture_triangle"].type==="chart"&&COUNTS.skills["soils.texture_triangle"].section==="soils");
  ok("index.json (the catalog entry) and CPU_UNITS carry it exactly as unit.json has it", JSON.stringify(INDEX.skills.find(s=>s.key===SK.key))===JSON.stringify(C.skillEntry(SK))&&src.indexOf(JSON.stringify(C.skillEntry(SK)))>0);
  const secs=UNIT.sections.map(s=>s.key), decks=[], tests={sections:{}}, cp=()=>JSON.parse(JSON.stringify(SK));
  const E=f=>{ const k=cp(); f(k); return C.checkSkills([k],secs,decks,tests).join(" | "); };
  const R=k=>{ k.replaces=[]; };   // (its replaces are checked against the real decks in the full compile above)
  ok("the real triangle passes rule 8 alone", E(R)==="", E(R));
  ok("rule 8 catches: not type chart · not 3 axes · tol out of range", /is type chart/.test(E(k=>{ R(k); k.type="id"; }))&&/needs 3 axes/.test(E(k=>{ R(k); k.data.axes.pop(); }))&&/needs 3 axes/.test(E(k=>{ R(k); k.data.axes[1].key="clay"; }))&&/tol must be/.test(E(k=>{ R(k); k.data.tol=25; })));
  ok("…a class key twice · a label twice · a bad key", /key twice/.test(E(k=>{ R(k); k.data.classes[1].key="sand"; }))&&/label twice/.test(E(k=>{ R(k); k.data.classes[1].label="Sand"; }))&&/key must be/.test(E(k=>{ R(k); k.data.classes[0].key="Bad Key"; })));
  ok("…a rule it can't read (an unknown axis, an unknown op, no number) · a shape off the triangle · a name spot off it",
    /rule must be/.test(E(k=>{ R(k); k.data.classes[0].rule=[[["mud","<",15]]]; }))&&/rule must be/.test(E(k=>{ R(k); k.data.classes[0].rule=[[["silt","≠",15]]]; }))&&/rule must be/.test(E(k=>{ R(k); k.data.classes[0].rule=[[["silt","<","15"]]]; }))&&/poly must be/.test(E(k=>{ R(k); k.data.classes[0].poly=[[0,0],[0,15],[90,20]]; }))&&/at \(where its name goes\)/.test(E(k=>{ R(k); k.data.classes[0].at=[80,30]; })));
  ok("…a GAP (a class left out: points in no class, and the shapes no longer cover the triangle)", (()=>{ const m=E(k=>{ R(k); k.data.classes.splice(k.data.classes.findIndex(c=>c.key==="loam"),1); }); return /points are in no class/.test(m)&&/must tile it/.test(m); })());
  ok("…an OVERLAP (sand's < 15 loosened to <= 15: the boundary points are in two classes)", /points are in two classes, e\.g\. [^|]*\(sand, loamy_sand\)/.test(E(k=>{ R(k); k.data.classes.find(c=>c.key==="sand").rule=[[["silt+1.5clay","<=",15]]]; })));
  ok("…a shape that isn't its class (two shapes swapped)", /middle of its shape is not in its rule/.test(E(k=>{ R(k); const a=k.data.classes.find(c=>c.key==="silt"), b=k.data.classes.find(c=>c.key==="sand"), t=a.poly; a.poly=b.poly; b.poly=t; })));
  ok("a gear skill and a unit with no skills are checked as before", C.checkSkills(undefined,secs,decks,tests).length===0&&C.skillClasses({data:{kind:"gear",items:[]}})===null); }

console.log("\n── the maker, over many seeds ──");
{ const w=W(), S=w.S, T=w.T, M=T.CPT_CHART, sk=Object.assign({fb:FBT},SK), TOL=T.cptTol(D), seen={}, tols={}; let bad=null, fives=0, N=600;
  ok("registered as the engine's `chart` type (through cpSkillTypeAdd), with no earlier chart maker to keep", S.CPSK_TYPES.chart===M&&T.CPT_PREV===null);
  for(let seed=1;seed<=N&&!bad;seed++){ const p=M.make(sk,S.cpskRng(seed)), P=p.pt, st=p.steps; seen[p.cls.key]=(seen[p.cls.key]||0)+1; if(P.clay%5===0&&P.silt%5===0) fives++;
    const tol=p.tol; tols[p.cls.key]=Math.min(tols[p.cls.key]||99,tol);
    if(![P.clay,P.silt,P.sand].every(v=>Number.isInteger(v)&&v>=3&&v<=100)||P.clay+P.silt+P.sand!==100) bad=["whole percents adding to 100, 3% or more of each",seed,P];
    else if(!(tol>=2&&tol<=TOL)) bad=["its tap tolerance is 2 to tol",seed,tol];
    else if(T.cptClassOf(D,P)!==p.cls||usda(P.clay,P.silt,P.sand)!==p.cls.key) bad=["the class is the point's",seed,P,p.cls.key];
    else if(st.length!==3||st.map(s=>s.id).join()!=="line,dot,name"||!st[0].tap||!st[1].tap||st[2].tap) bad=["3 steps: line, dot (taps), name",seed];
    else if(st[0].answer!==P.clay+"% clay"||st[1].answer!==P.clay+"% clay · "+P.silt+"% silt · "+P.sand+"% sand"||st[2].answer!==p.cls.label) bad=["the answers",seed,st.map(s=>s.answer)];
    else if(st[2].choices.length!==4||new Set(st[2].choices).size!==4||st[2].choices.indexOf(p.cls.label)<0||!st[2].choices.every(n=>CL.some(c=>c.label===n))) bad=["4 different class names, the right one among them",seed,st[2].choices];
    else { for(let da=-tol;da<=tol&&!bad;da++) for(let db=-tol;db<=tol;db++){ if(Math.abs(da+db)>tol) continue; const c=P.clay+da, s=P.silt+db; if(c<0||s<0||c+s>100) continue; if(usda(c,s,100-c-s)!==p.cls.key){ bad=["at least its tolerance ("+tol+") from every other class",seed,P,[c,s]]; break; } } } }
  ok("each problem: whole percents adding to 100 (3% or more of each), its class right, at least its tolerance (2–"+TOL+") from every other class, 3 steps, 4 class names", !bad, bad);
  ok("the tap tolerance is tol ("+TOL+") for every class but the small sand (some 1 less) and the thin loamy sand (1 less)", CL.every(c=>tols[c.key]===(["sand","loamy_sand"].indexOf(c.key)>=0?TOL-1:TOL)), tols);
  ok("every one of the 12 classes comes up across seeds", CL.every(c=>seen[c.key]>0), seen);
  ok("most problems use 5s like the tests do (clay and silt both multiples of 5 in over 40%)", fives/N>0.4, fives/N);
  const p=M.make(sk,S.cpskRng(5)), q=M.make(sk,S.cpskRng(5));
  ok("the same seed makes the same problem (a try can be made again)", JSON.stringify(p.pt)===JSON.stringify(q.pt)&&JSON.stringify(p.steps)===JSON.stringify(q.steps));
  const P0=P3(30,40,30), near=T.cptNear(D,P0,byKey("clay_loam")).map(c=>c.key);
  ok("the other names are where a wrong-way reading lands first (30/40/30: clay and silt swapped → clay; silt and sand swapped → still clay loam, so not offered)", near[0]==="clay"&&near.indexOf("clay_loam")<0&&near.length>=3, near);
  ok("every class can make a problem (its practice points: "+CL.map(c=>c.key+" "+(((T.cptPool(D)[c.key]||{}).pts||[]).length)).join(", ")+")", CL.every(c=>((T.cptPool(D)[c.key]||{}).pts||[]).length>0));
  ok("a skill of another kind is not this maker's (no earlier chart maker: no problem)", M.make({type:"chart",data:{kind:"xy"}},S.cpskRng(1))===null&&M.html({},{})===""&&M.note({data:{}})===""&&M.missLabel("axis:clay",{data:{}})===null); }

console.log("\n── a sitting's classes: 6 different, the misnamed ones first, all 12 over sittings ──");
{ const d=demo("kid"), S=d.S, T=d.T;
  const doTry=()=>{ const r=S._cpsk.run; if(r.stage==="shown"){ const n0=r.tries.length; for(let i=0;i<10&&r.tries.length===n0;i++) S.cpSkillStep(); return; } r.prob.steps.forEach((st,i)=>{ if(i>=r.from) S.cpSkillPick(i,st.answer); }); S.cpSkillCheckTry(); S.cpSkillNextTry(); };
  const cls=[]; S.cpSkillOpen(K,FBT,99); for(let t=0;t<S.CPSK_SITTING;t++){ cls.push(S._cpsk.run.prob.cls.key); doTry(); }
  ok("6 tries, 6 different classes (the order is seeded by the sitting)", cls.length===6&&new Set(cls).size===6, cls);
  S.cpSkillQuit(); const union=new Set();
  for(let seed=1;seed<=12;seed++){ S.cpSkillOpen(K,FBT,seed); const o=S._cpsk.run.cpt.order; if(o.length===CL.length&&new Set(o).size===CL.length) o.slice(0,6).forEach(k=>union.add(k)); S._cpsk.run=null; }
  ok("a sitting's order holds all 12 classes once; over 12 sittings every class is among the first 6", union.size===CL.length, [...union]);
  const st=d.masteryData.maya_skills.nc_envirothon[FBT]; st.miss={"name:silt":3,"name:loam":1,"axis:silt":4};
  S.cpSkillOpen(K,FBT,99); const order=S._cpsk.run.cpt.order;
  ok("the classes she misnamed come first, most first (silt 3, then loam); a line miss doesn't reorder", order[0]==="silt"&&order[1]==="loam"&&new Set(order).size===CL.length&&S._cpsk.run.prob.cls.key==="silt", order); S._cpsk.run=null; }

console.log("\n── the geometry: percents ↔ the chart ──");
{ const w=W(), T=w.T, TR=T.CPT_TRI, eq=(a,b)=>Math.abs(a[0]-b[0])<1e-9&&Math.abs(a[1]-b[1])<1e-9;
  ok("100% clay is the top corner, 100% silt the bottom right, 100% sand the bottom left", eq(T.cptXY(D,P3(100,0,0)),TR.T)&&eq(T.cptXY(D,P3(0,100,0)),TR.R)&&eq(T.cptXY(D,P3(0,0,100)),TR.L));
  let bad=null; for(let i=0;i<200&&!bad;i++){ const c=(i*37)%101, s=(i*53)%(101-c), p=P3(c,s,100-c-s), z=T.cptXY(D,p), b=T.cptPt(D,z[0],z[1]); if(["clay","silt","sand"].some(k=>Math.abs(b[k]-p[k])>1e-9)) bad=[p,b]; }
  ok("a point on the chart reads back as its percents (cptPt undoes cptXY)", !bad, bad);
  const seg=(i,v)=>T.cptEnds(D,i,v).map(q=>T.cptXY(D,q)), dir=s=>{ const dx=s[1][0]-s[0][0], dy=s[1][1]-s[0][1], l=Math.hypot(dx,dy); return [dx/l,dy/l]; }, par=(a,b)=>Math.abs(a[0]*b[1]-a[1]*b[0])<1e-9;
  ok("a clay line runs straight across; a silt line runs parallel to the clay side (down to the left); a sand line parallel to the silt side (up to the left)", par(dir(seg(0,30)),[1,0])&&par(dir(seg(1,40)),dir([TR.L,TR.T]))&&par(dir(seg(2,30)),dir([TR.R,TR.T])));
  ok("each line starts at its tick: clay on the left side (silt 0), silt on the right side (sand 0), sand on the bottom (clay 0)", T.cptEnds(D,0,30)[0].silt===0&&T.cptEnds(D,1,40)[0].sand===0&&T.cptEnds(D,2,30)[0].clay===0);
  ok("the wrong way from a tick keeps the next axis on: clay → sand, silt → clay, sand → silt", T.cptWrongAxis(0)===2&&T.cptWrongAxis(1)===0&&T.cptWrongAxis(2)===1);
  const pts=[[30,40,30]]; ok("the three lines of 30/40/30 meet at one point", (()=>{ const A=seg(0,30), B=seg(1,40), Cc=seg(2,30), X=T.cptXY(D,P3(...pts[0])), on=(s,p)=>Math.abs((s[1][0]-s[0][0])*(p[1]-s[0][1])-(s[1][1]-s[0][1])*(p[0]-s[0][0]))<1e-6; return on(A,X)&&on(B,X)&&on(Cc,X); })()); }

console.log("\n── the miss codes: which line went the wrong way ──");
{ const w=W(), T=w.T, S=w.S, M=T.CPT_CHART, cl=byKey("clay_loam"), steps=[{id:"line",i:0},{id:"dot",i:1},{id:"name",i:2}];
  const pr=taps=>({tri:true,data:D,pt:P3(30,40,30),cls:cl,tol:4,steps,taps});
  ok("the clay line tapped on the line that leaves the 30 tick the other way (sand stays 70) → axis:clay", M.miss(steps[0],"0% clay",pr({0:P3(0,30,70)}))==="axis:clay");
  ok("the clay line at the wrong number (20%) → line:clay", M.miss(steps[0],"20% clay",pr({0:P3(20,40,40)}))==="line:clay");
  ok("the dot where the SAND line went the wrong way (silt stays 70) → axis:sand", M.miss(steps[1],"x",pr({1:P3(30,70,0)}))==="axis:sand");
  ok("the dot where the SILT line went the wrong way (clay stays 60) → axis:silt", M.miss(steps[1],"x",pr({1:P3(60,10,30)}))==="axis:silt");
  ok("the dot a little off (7 points of silt) → line:silt; the right dot, the wrong name → name:clay_loam", M.miss(steps[1],"x",pr({1:P3(30,47,23)}))==="line:silt"&&M.miss(steps[2],"clay",pr({}))==="name:clay_loam");
  const sk=Object.assign({fb:FBT},SK);
  ok("in words for the student and the teacher", S.cpSkillMissLabel(sk,"axis:silt")==="following a silt line the wrong way — silt lines run down and to the left ↙"&&S.cpSkillMissLabel(sk,"line:clay")==="finding the clay percent on the left side"&&S.cpSkillMissLabel(sk,"name:clay_loam")==="naming the class at the dot (clay loam)"&&S.cpSkillMissLabel(sk,"weird")==="weird");
  ok("the codes are safe database keys (no . # $ [ ] /)", ["axis:clay","axis:silt","axis:sand","line:clay","line:silt","line:sand"].concat(CL.map(c=>"name:"+c.key)).every(k=>!/[.#$\[\]\/]/.test(k))); }

console.log("\n── the chart: inline SVG ──");
{ const w=W(), T=w.T, h=T.cptSvg(D,{}), ht=T.cptSvg(D,{tap:true,lines:[{i:0,v:30,kind:"ans"},{i:1,v:40,kind:"mine"},{i:2,v:30,kind:"bad"}],dots:[{pt:P3(30,40,30),kind:"ans"}],fill:byKey("clay_loam")});
  ok("an <svg> with its viewBox, no image, no tap handler unless it is her turn to tap", /^<svg viewBox="0 0 400 338"/.test(h)&&!/<img|<image/.test(h)&&!/onclick/.test(h)&&/onclick="cptTap\(event,this\)"/.test(ht)&&/cursor:crosshair/.test(ht));
  ok("every class name drawn once", CL.every(c=>{ const parts=c.label.length>9?[c.label.slice(0,c.label.lastIndexOf(" ")),c.label.slice(c.label.lastIndexOf(" ")+1)]:[c.label]; return parts.every(t=>h.indexOf(">"+t+"</tspan>")>0); }));
  ok("27 tick numbers (10–90 on each side) and the three side titles, with the way each grows", (h.match(/>[1-9]0<\/text>/g)||[]).length===27&&/Percent clay →/.test(h)&&/Percent silt →/.test(h)&&/← Percent sand/.test(h));
  ok("the lines in their colours: an answer solid, hers dashed, a wrong one red; the class lit in yellow; the dot", ht.indexOf('stroke="'+T.CPT_COLOR[0]+'" stroke-width="3.2" stroke-linecap="round"/>')>0&&ht.indexOf('stroke="'+T.CPT_COLOR[1]+'" stroke-width="3.2" stroke-linecap="round" stroke-dasharray')>0&&ht.indexOf('stroke="#dc2626" stroke-width="3.2"')>0&&/fill="#fde68a"/.test(ht)&&/<circle/.test(ht)&&!/<circle/.test(h));
  ok("the chart is phone-first: full width up to 440 px, no page scroll sideways, taps don't zoom", /width:100%;max-width:440px/.test(h)&&/touch-action:manipulation/.test(h)); }

console.log("\n── the demo kid: 👀 → ✍️ (the lines drawn → one line drawn) → 💪 ──");
{ let seed=0, d=null, S=null, T=null;
  // a sitting whose 5th try (the first 💪) has 10% clay or more, so the clay line has a wrong way to go
  for(let s=1;s<300;s++){ const t=demo("kid"); t.S.cpSkillOpen(K,FBT,s); const r=t.S._cpsk.run, o=r.cpt.order; t.S._cpsk.run=null; const k=o[4], c=byKey(k);
    if(c&&["clay","clay_loam","silty_clay","sandy_clay","silty_clay_loam","sandy_clay_loam"].indexOf(k)>=0){ seed=s; d=t; S=t.S; T=t.T; t.renderAll(); break; } }
  const run=()=>S._cpsk.run, C0=()=>d.G.content, ans=h=>(h.match(/stroke-width="3\.2" stroke-linecap="round"\/>/g)||[]).length;
  ok("the Skills door lists the texture triangle in the Soils place (Forestry, Soils, Aquatics)", /Soil texture triangle/.test(C0())&&C0().indexOf("Forestry tools by picture")<C0().indexOf("Soil texture triangle")&&C0().indexOf("Soil texture triangle")<C0().indexOf("Biotic index"), seed);
  ok("her skills: the triangle beside the others (from the catalog entry)", S.cpSkillsFor(K).map(s=>s.fb).join()==="forestry:tools,"+FBT+",aquatics:biotic_index,aquatics:gear");
  S.cpSkillOpen(K,FBT,seed); const r1=run();
  ok("Go: 👀 Watch it — the percents, the chart, step 1 lit: ONE line (clay), no dot yet", /👀 Watch it/.test(C0())&&/This soil is/.test(C0())&&C0().indexOf(r1.prob.pt.clay+"% clay")>0&&/<svg viewBox/.test(C0())&&ans(C0())===1&&!/<circle/.test(C0())&&!/onclick="cptTap/.test(C0()));
  S.cpSkillStep(); ok("…step 2: the silt and sand lines, and the dot where all three meet", ans(C0())===3&&/<circle/.test(C0())&&!/fill="#fde68a"/.test(C0()));
  S.cpSkillStep(); ok("…step 3: the class lights up, its name and its rule in words", /fill="#fde68a"/.test(C0())&&C0().indexOf(r1.prob.cls.words.replace(/&/g,"&amp;"))>0);
  S.cpSkillStep(); const n2=run().prob.steps.length; for(let i=0;i<=n2;i++) S.cpSkillStep();
  const r3=run();
  ok("after two worked examples: ✍️ Finish it — the three lines and the dot are drawn, she names the class", r3.stage==="faded"&&r3.from===2&&ans(C0())===3&&/<circle/.test(C0())&&/Read the class where the dot is/.test(C0())&&!/onclick="cptTap/.test(C0()));
  S.cpSkillPick(2,r3.prob.steps[2].answer); S.cpSkillCheckTry();
  ok("a right ✍️ try: ✓ All right!; the next one hands over one more step", run().checked.ok&&/All right!/.test(C0())&&run().st.fade===2);
  S.cpSkillNextTry(); const r4=run();
  ok("the next ✍️ try: ONE line drawn (clay) — she puts the dot and names the class (the research's faded step)", r4.stage==="faded"&&r4.from===1&&ans(C0())===1&&!/<circle/.test(C0())&&/onclick="cptTap\(event,this\)"/.test(C0())&&C0().indexOf("Tap where the "+r4.prob.pt.silt+"% silt and "+r4.prob.pt.sand+"% sand lines cross the clay line")>0);
  ok("a tap off the triangle is refused (“Tap inside the triangle”) and fills nothing", d.T.cptTap({clientX:2,clientY:2},{getBoundingClientRect:()=>({left:0,top:0,width:400,height:338})})===false&&run().ans[1]==null&&/Tap inside the triangle/.test(BLK));
  const P4=r4.prob.pt; tapAt(d,P3(P4.clay+2,P4.silt-1,P4.sand-1));
  ok("her tap (2 points off, within tol) is drawn where she tapped, dashed — no snapping, no readout before Check", run().ans[1]===r4.prob.steps[1].answer&&/stroke="#0f172a" stroke-width="3"/.test(C0())&&C0().indexOf("% clay · ")===C0().lastIndexOf("% clay · ")&&/Take back my last tap/.test(C0()));
  T.cptUndo(); ok("↺ takes the tap back", run().ans[1]==null&&!run().prob.taps[1]);
  tapAt(d,P4); S.cpSkillPick(2,r4.prob.steps[2].answer); S.cpSkillCheckTry();
  ok("two right in a row: up to 💪 on your own", run().st.stage==="solo"&&/Next: on your own!/.test(C0()));
  S.cpSkillNextTry(); const r5=run(), P5=r5.prob.pt;
  ok("💪 on your own: no line drawn, she taps the clay line first; the how-to waits behind 'Show the chart'", r5.stage==="solo"&&r5.from===0&&ans(C0())===0&&C0().indexOf("Tap anywhere on the "+P5.clay+"% clay line.")>0&&/Show the chart/.test(C0())&&!/How to read the triangle/.test(C0()));
  tapAt(d,P3(0,P5.clay,100-P5.clay));   // from the clay tick the wrong way: sand stays 100 − clay
  ok("her first tap fills the clay line; the second the dot", run().prob.taps[0]&&C0().indexOf("Tap where the")>0);
  tapAt(d,P5); S.cpSkillPick(2,r5.prob.steps[2].answer); S.cpSkillCheckTry();
  ok("Check: the clay line went the wrong way → 'axis:clay', said in words; her line red, the right lines solid", run().checked.miss==="axis:clay"&&run().checked.step===0&&C0().indexOf("Missed at step 1: following a clay line the wrong way")>0&&/stroke="#dc2626" stroke-width="3\.2"/.test(C0())&&ans(C0())===3&&/Red dashes = your tap/.test(C0()));
  const before=d._envs.writes.length; S.cpSkillNextTry(); const r6=run(); tapAt(d,r6.prob.pt); tapAt(d,r6.prob.pt); S.cpSkillPick(2,r6.prob.steps[2].answer); S.cpSkillCheckTry(); S.cpSkillNextTry();
  const W1=d._envs.writes.slice(before), w1=W1[0]||{};
  ok("the 6th try ends the sitting: ONE write, an update on mastery with maya_skills/nc_envirothon/soils:texture_triangle and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&Object.keys(w1.val).some(k=>k==="maya_skills/nc_envirothon/"+FBT)&&Object.keys(w1.val).some(k=>/^studyLog\/maya\/skills\/\d{8}$/.test(k))&&Object.keys(w1.val).length===2, W1.map(x=>[x.op,x.path,Object.keys(x.val||{})]));
  const st=w1.val["maya_skills/nc_envirothon/"+FBT];
  ok("the state: on your own, the miss counted by its code, no tap or problem saved (counts and codes only)", st.stage==="solo"&&st.miss["axis:clay"]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo"&&!/taps|"pt"/.test(JSON.stringify(w1.val)));
  const sum=S.cpSkillSummary(K,d.masteryData,T0);
  ok("summary.skills: Soils 0 of 1 (stage solo, the miss code)", sum.soils.total===1&&sum.soils.learned===0&&sum.soils.stage[FBT]==="solo"&&sum.soils.miss[FBT]["axis:clay"]===1);
  ok("the 'skills learned' line (📅 Pace and the station rows) counts it: 'skills learned 0 of 1' for Soils", S.cpSkillPaceLine({skills:sum},"soils")==="skills learned 0 of 1");
  S.cpSkillQuit(); d.envsView("scores"); ok("Scores: '🧩 skills learned 0 of 1' on Soils", (()=>{ const c=C0(), i=c.indexOf("Soils"); return i>=0&&/🧩 skills learned 0 of 1/.test(c); })()); }

console.log("\n── the teacher: the note, the classmates' counts, the most-missed step ──");
{ const d=demo("teacher"), S=d.S; d.envcView("setup");
  ok("🏫 Class setup ▸ 🧩 Skills: the texture triangle, type chart, core, with its note (12 classes, a new mix each try)", /Soil texture triangle/.test(d.G.content)&&/chart · core/.test(d.G.content)&&d.G.content.indexOf("📐 "+CL.length+" classes · each try is a new clay / silt / sand mix that adds up to 100")>0);
  const studs=d.envcStudents(), withS=studs.filter(x=>x.summary);
  ok("every classmate's summary counts it in Soils", withS.length>0&&withS.every(x=>x.summary.skills.soils&&x.summary.skills.soils.total===1&&x.summary.skills.soils.stage[FBT]));
  const cal=studs.find(x=>x.sid==="walker_caleb");
  ok("📅 Pace's line reads the summaries: Caleb 'skills learned 1 of 1' in Soils", S.cpSkillPaceLine(cal.summary,"soils")==="skills learned 1 of 1");
  const rows=S.cpSkillFoldRows(studs), tr=rows.find(r=>r.sk.fb===FBT);
  ok("the Skills fold: the triangle's most-missed step in words — 'following a silt line the wrong way … (3)'", !!tr&&tr.top==="axis:silt"&&tr.topN===3&&d.G.content.indexOf("Most missed step: following a silt line the wrong way — silt lines run down and to the left ↙ (3)")>0, tr&&[tr.top,tr.topN]);
  ok("the demo writes nothing (the seed is in memory)", d._envs.writes.length===0); }

console.log("\n── a live kid: the triangle from the catalog entry ──");
{ const w=W({w:{fam:FAM,remote:{["classSkills/"+CID]:{}}}}), S=w.S; w.initFb();
  Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Soils and Land Use · Terms":true}};
  ok("no demo list: the triangle is CPU_UNITS' (the compiled unit), in the Soils place", S.cpSkillList().some(s=>s.fb===FBT&&s.type==="chart"&&s.section==="soils")&&S.cpSkillsFor(K).some(s=>s.fb===FBT));
  ok("the door shows it on her study page, and a sitting makes a real problem", /Soil texture triangle/.test(S.cpSkillStudyWrap(K,"BODY"))&&(()=>{ S.cpSkillOpen(K,FBT,11); const r=S._cpsk.run, okk=!!(r&&r.prob&&r.prob.tri&&r.prob.steps.length===3); S._cpsk.run=null; return okk; })());
  ok("cpTriangleDemoSeed does nothing off the demo", w.T.cpTriangleDemoSeed({cid:CID,students:{}})===false); }

console.log("\n── Howe and Lincoln: nothing on ──");
{ const w=W({w:{fam:HOWE}}), T=w.T, S=w.S;
  ok("cptOn false; no skills listed; the demo seed refuses; Lincoln's summary has no skills (cpSkillSummary null)", T.cptOn()===false&&S.cpSkillList().length===0&&T.cpTriangleDemoSeed({cid:"x",students:{}})===false&&S.cpSkillSummary("lincoln",{lincoln_skills:{nc_envirothon:{[FBT]:{learned:true}}}},T0)===null);
  ok("a tap or an undo with no sitting does nothing", T.cptTap({clientX:1,clientY:1},{getBoundingClientRect:()=>({left:0,top:0,width:1,height:1})})===false&&T.cptUndo()===false);
  ok("no read, write, listener or element", w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0&&w.G.created.length===0);
  const a=W({w:{fam:HOWE}}), b=W({tri:false,w:{fam:HOWE}});
  ok("the world without this block boots the same for Howe (nothing created, read or written either way)", JSON.stringify([a.G.reads,a.G.writes,a.G.created.length])===JSON.stringify([b.G.reads,b.G.writes,b.G.created.length])&&b.T===null); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
