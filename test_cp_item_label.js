/*
 * Node tests — 🏷 CPITEMLABEL, label the diagram: the `label` skill item type (DESIGN_class_platform_2026-10-28.md §4.1b, §13 rows 25–27;
 * RESEARCH_envirothon_skills_2026-10-28.md §4.8, ranked #8 in §5; §4.10 the soil profile; §8.1 the card it replaces). A drawing with
 * numbered spots; the student taps a spot and picks its name — through the skill engine's three stages (shown → faded → on your own).
 *   · Where the block sits (right after CPITEMTRIANGLE_END), its own prefix (no name of another block's), how it hooks (CPSKILL's
 *     extension point, one guarded demo line), what it never does.
 *   · The unit's diagrams: the soil profile's six horizons top to bottom, an Aquatics diagram, every part's words and its real cards.
 *   · compile_unit.js rule 8 for a diagram (each error caught), the page and compile allowing the same shapes, COUNTS.json (items = parts).
 *   · The drawing is data: only the allowed shapes and attributes reach the page; the maker over many seeds; the miss codes and words.
 *   · The demo kid: 👀 → ✍️ → 💪 on the soil profile, ONE write, summary.skills, "skills learned"; the teacher: the note, the classmates'
 *     counts, the most-missed step; a live kid from the catalog; Howe and Lincoln: nothing on.
 * Every count comes from the unit's data, never typed in.                                              run: node test_cp_item_label.js
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
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"), GEAR=cut("// CPITEMGEAR_START","// CPITEMGEAR_END"), BLK=cut("// CPITEMLABEL_START","// CPITEMLABEL_END");
const XS="\nfunction envPicsIndex(){ return null; }\nG.sk={ CPSK_TYPES, CPSK_SITTING, _cpsk, cpskRng, cpskFb, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillSummary, cpSkillPaceLine, cpSkillFoldRows, cpSkillMissLabel, cpSkillStudyWrap };";
const XT="\nG.t={ CPLD_LABEL, CPLD_PREV, CPLD_R, CPLD_EL, CPLD_AT, CPLD_VAL, cpldOn, cpldDiagram, cpldAsk, cpldEl, cpldState, cpldActive, cpldSvg, cpldKey, cpldTap, cpldPick, cpldLow, cpLabelDemoSeed };";
// lbl false = the same world without this block (the control)
function W(o){ o=o||{}; const t=o.lbl!==false; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+SKL+"\n"+GEAR+"\n"+(t?BLK:"")+XS+(t?XT:"\nG.t=null;")},o.w||{})); w.S=w.G.sk; w.T=w.G.t; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", T0=Date.UTC(2026,9,28,15,0,0);
const LS=(UNIT.skills||[]).filter(s=>s&&s.data&&s.data.kind==="diagram"), SOIL=LS.find(s=>s.key==="soils.horizons"), FBS="soils:horizons";
const cardOf=r=>{ const m=/^(.+)#o(\d+)$/.exec(r), d=m&&LIB.unit.decks.find(x=>x.key===m[1]); return d&&d.cards.find(c=>c.order===+m[2]); };
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPITEMLABEL_START"), b=src.indexOf("// CPITEMLABEL_END"), e=src.indexOf("// CPITEMTRIANGLE_END\n");
  ok("CPITEMLABEL once, IMMEDIATELY after CPITEMTRIANGLE_END (after CPSKILL, so its registry exists)", a>0&&b>a&&src.indexOf("// CPITEMLABEL_START",a+1)<0&&e+"// CPITEMTRIANGLE_END\n".length===a&&src.indexOf("// CPSKILL_END")<a);
  ok("the header names §4.1b, §13 rows 25–27, the research's §4.8, its #8 rank, §4.10 and §8.1, the miss code, what isn't built, and the dates", /§4\.1b/.test(BLK)&&/§13 rows\s*\n?\/\/ ?25–27|§13 rows 25–27/.test(BLK)&&/RESEARCH_envirothon_skills_2026-10-28\.md §4\.8/.test(BLK)&&/ranked #8/.test(BLK)&&/§4\.10/.test(BLK)&&/§8\.1/.test(BLK)&&/mix:<right>:<given>/.test(BLK)&&/NOT BUILT/.test(BLK)&&/2026-10-28/.test(BLK)&&/2026-10-29/.test(BLK));
  ok("the block only declares, plus its one registration through CPSKILL's extension point", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)||/^if\(typeof cpSkillTypeAdd==="function"\) cpSkillTypeAdd\("label",CPLD_LABEL\);/.test(l)));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing and reads nothing: no set / update / remove / once / on, no envsWrite / envcWrite, no db or firebase", !/\.set\(|\.update\(|\.remove\(|\.once\(|\.on\(|envsWrite|envcWrite|\bdb\b|firebase/.test(code));
  ok("no image file and nothing hot-linked: no <img, no http(s) URL but the SVG namespace", !/<img|<image/.test(code)&&!/https?:\/\//.test(code.replace(/http:\/\/www\.w3\.org\/2000\/svg/g,"")));
  ok("no Howe kid name as a code literal; no 'Station' in its strings; no 🔀 in index.html", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/["'][^"'\n]*\bStations?\b/.test(code)&&src.indexOf("\u{1F500}")<0);
  const names=(BLK.match(/^(?:function|const) (\w+)/gm)||[]).map(s=>s.replace(/^(function|const) /,"")), rest=src.slice(0,a)+src.slice(b);
  ok("its own prefix (cpld / CPLD_ — CPLOCKS has cpl / CPL_): none of its "+names.length+" names is declared anywhere else", names.length>10&&names.every(n=>/^(cpld|CPLD_|cpLabel)/.test(n))&&names.every(n=>!new RegExp("(function|const|let|var) "+n+"\\b").test(rest)), names.filter(n=>new RegExp("(function|const|let|var) "+n+"\\b").test(rest)));
  const hooks=rest.split("\n").filter(l=>/🏷 CPITEMLABEL/.test(l)&&!/^\s*\/\//.test(l)&&!/^\s*"/.test(l));
  ok("ONE hook line outside the block, tagged 🏷 CPITEMLABEL and guarded: in envsDemoStart, after the engine's own seed", hooks.length===1&&/^  try\{ if\(typeof cpLabelDemoSeed==="function"\) cpLabelDemoSeed\(data\); \}catch\(e\)\{\}   \/\/ 🏷 CPITEMLABEL/.test(hooks[0])&&(()=>{ const i=src.indexOf("function envsDemoStart("), j=src.indexOf("\n}\n",i), k=src.indexOf(hooks[0]); return k>i&&k<j&&src.indexOf("cpSkillDemoSeed(data)")<k; })(), hooks.map(l=>l.trim().slice(0,80)));
  ok("its one cpSkill* call is typeof-guarded and tagged 🧩 CPSKILL (CPSKILL's rule for every outside line)", code.split("\n").filter(l=>/cpSkill\w+\(/.test(l)).every(l=>/🧩 CPSKILL/.test(l)&&(l.match(/cpSkill\w+(?=\()/g)||[]).every(f=>new RegExp("typeof "+f+" ?[!=]== ?\"function\"").test(l))));
  ok("CPSKILL and CPITEMGEAR are untouched by it (no 🏷 line inside them)", !/🏷/.test(SKL)&&!/🏷/.test(GEAR)); }

console.log("\n── the data: our own diagrams, in the unit ──");
{ ok("label skills in units/nc_envirothon/unit.json ("+LS.map(s=>s.key).join(", ")+"): each type label, kind diagram; the soil profile and an Aquatics one among them", LS.length>=2&&LS.every(s=>s.type==="label")&&!!SOIL&&LS.some(s=>s.section==="aquatics"));
  const P=SOIL.data.parts, byY=P.slice().sort((a,b)=>(a.ty!=null?a.ty:a.y)-(b.ty!=null?b.ty:b.y));
  ok("the soil profile: the six master horizons O, A, E, B, C, R, drawn top to bottom in that order", JSON.stringify(byY.map(p=>p.label))===JSON.stringify(["O horizon","A horizon","E horizon","B horizon","C horizon","R horizon"]));
  ok("…its words come from its cards (A topsoil, B subsoil, E eluviation, R bedrock), each src a real card of the unit", /Topsoil/.test(P.find(p=>p.key==="a").words)&&/Subsoil/.test(P.find(p=>p.key==="b").words)&&/eluviation/.test(P.find(p=>p.key==="e").words)&&/Bedrock/.test(P.find(p=>p.key==="r").words)&&P.every(p=>Array.isArray(p.src)&&p.src.every(cardOf)));
  ok("…replaces = the research's §8.1 one card, 'O horizon · position' (every horizon term card stays)", JSON.stringify((SOIL.replaces||[]).map(r=>cardOf(r)&&cardOf(r).name))==='["O horizon · position"]');
  const forms=s=>[].concat(...["pre","post"].map(f=>((LIB.tests[s.section]||{})[f]||{items:[]}).items.map(i=>f+"-"+i.n)));
  ok("every skill's tests are real questions of its section's forms", LS.every(s=>(s.tests||[]).every(q=>forms(s).indexOf(q)>=0)));
  ok("every part has words, every src a real card; every part label is unique in its diagram", LS.every(s=>s.data.parts.every(p=>p.words&&(!p.src||p.src.every(cardOf)))&&new Set(s.data.parts.map(p=>p.label.toLowerCase())).size===s.data.parts.length));
  ok("the drawings are our own shapes: no image, no URL, no text that isn't the drawing's", LS.every(s=>!/<|https?:|data:|url\(/i.test(JSON.stringify(s.data.art))));
  ok("phone-first: every drawing is at most 360 wide, so a badge ("+2*19+" units) is 36 px or more on a 430 px phone (measured in Chrome: see the hand-over)", LS.every(s=>s.data.vb[0]<=360)); }

console.log("\n── compile_unit.js rule 8 (diagram), COUNTS.json, the catalog entry ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("the unit compiles and is current (--check)", r.ok, r.err);
  ok("COUNTS.json: a diagram's items are its parts", LS.every(s=>COUNTS.skills[s.key]&&COUNTS.skills[s.key].items===s.data.parts.length&&COUNTS.skills[s.key].type==="label"&&COUNTS.skills[s.key].section===s.section));
  ok("index.json (the catalog entry) and CPU_UNITS carry each exactly as unit.json has it (no _about)", LS.every(s=>JSON.stringify(INDEX.skills.find(x=>x.key===s.key))===JSON.stringify(C.skillEntry(s))&&src.indexOf(JSON.stringify(C.skillEntry(s)))>0)&&!INDEX.skills.some(s=>s._about));
  const w=W(), T=w.T;
  ok("the page and compile allow the same shapes and attributes, and the same badge size", T.CPLD_R===C.LABEL_R&&JSON.stringify(T.CPLD_EL)===JSON.stringify(C.LABEL_EL)&&JSON.stringify(T.CPLD_AT)===JSON.stringify(C.LABEL_AT));
  const secs=UNIT.sections.map(s=>s.key), cards={}; LIB.unit.decks.forEach(d=>d.cards.forEach(c=>{ cards[d.key+"#o"+c.order]=1; }));
  const cp=()=>JSON.parse(JSON.stringify(SOIL)), E=f=>{ const k=cp(); f(k); return C.checkDiagram(k,"x",cards).join(" | "); };
  ok("every real diagram passes alone", LS.every(s=>C.checkDiagram(s,"x",cards).length===0), LS.map(s=>C.checkDiagram(s,"x",cards)));
  ok("catches: not type label · a bad size · under 3 parts · ask out of range", /is type label/.test(E(k=>{ k.type="id"; }))&&/vb must be/.test(E(k=>{ k.data.vb=[360]; }))&&/3 or more parts/.test(E(k=>{ k.data.parts=k.data.parts.slice(0,2); }))&&/ask must be/.test(E(k=>{ k.data.ask=99; })));
  ok("…a key twice · a label twice · a bad key · no words · a src that is no card", /key twice/.test(E(k=>{ k.data.parts[1].key="o"; }))&&/label twice/.test(E(k=>{ k.data.parts[1].label="o HORIZON"; }))&&/key must be/.test(E(k=>{ k.data.parts[0].key="O hz"; }))&&/has no words/.test(E(k=>{ k.data.parts[0].words=""; }))&&/is no card/.test(E(k=>{ k.data.parts[0].src=["Nope#o1"]; })));
  ok("…a spot whose badge leaves the drawing · two spots touching · a leader end outside · half a leader · a leader through another spot", /whole badge inside/.test(E(k=>{ k.data.parts[0].x=350; }))&&/touch/.test(E(k=>{ k.data.parts[1].y=k.data.parts[0].y+10; }))&&/leader's end/.test(E(k=>{ k.data.parts[0].tx=999; }))&&/needs both tx and ty/.test(E(k=>{ delete k.data.parts[0].ty; }))&&/the leader of “O horizon” runs through the spot of “R horizon”/.test(E(k=>{ const o=k.data.parts.find(p=>p.key==="o"), rr=k.data.parts.find(p=>p.key==="r"); o.x=rr.x; o.y=24; o.tx=rr.x; o.ty=rr.y+30; })));
  ok("…a spot pointing at ANOTHER part (the B horizon's leader ending in the C horizon) · at no part at all", /points at “C horizon”/.test(E(k=>{ const b=k.data.parts.find(p=>p.key==="b"), c=k.data.parts.find(p=>p.key==="c"); b.ty=c.ty; }))&&/points at none of its shapes/.test(E(k=>{ k.data.parts[0].tx=340; k.data.parts[0].ty=5; })));
  ok("…a part with no shape the check can read · a part shape with a transform · a shape naming an unknown part", /needs a shape the check can read/.test(E(k=>{ k.data.art.forEach(e=>{ if(e.part==="r") delete e.part; }); }))&&/can't have a transform/.test(E(k=>{ const e=k.data.art.find(x=>x.part==="o"); e.a.transform="rotate(5)"; }))&&/is not one of the parts/.test(E(k=>{ k.data.art[0].part="zz"; })));
  ok("…a shape that isn't allowed (an image, a script) · an attribute that isn't (onclick, href, style) · a value that isn't (quotes, <, javascript:)",
    /el must be one of/.test(E(k=>{ k.data.art.push({el:"image",a:{href:"x.png"}}); }))&&/el must be one of/.test(E(k=>{ k.data.art.push({el:"script",a:{}}); }))&&
    ["onclick","href","style"].every(n=>new RegExp("“"+n+"” is not allowed").test(E(k=>{ k.data.art[0].a[n]="x"; })))&&
    ['#fff" onclick="x','<b>',"javascript:alert(1)"].every(v=>/has a value that isn't allowed/.test(E(k=>{ k.data.art[0].a.fill=v; }))));
  ok("…text in the drawing that names a part (the whole label, or its telling word: 'Benthic' for the benthic zone)", /names a part \(“o horizon”\)/.test(E(k=>{ k.data.art.push({el:"text",a:{x:10,y:10},text:"O horizon here"}); }))&&(()=>{ const L=JSON.parse(JSON.stringify(LS.find(s=>s.key==="aquatics.lake_zones"))); L.data.art.push({el:"text",a:{x:5,y:5},text:"benthic"}); const m=C.checkDiagram(L,"x",cards).join(); L.data.art[L.data.art.length-1].text="Sun"; return /names a part \(“benthic”\)/.test(m)&&C.checkDiagram(L,"x",cards).length===0; })());
  ok("checkSkills runs it for a diagram (and leaves every other kind alone)", C.checkSkills([Object.assign(cp(),{type:"id",replaces:[],tests:[]})],secs,LIB.unit.decks,{sections:{}}).some(m=>/is type label/.test(m))&&C.labelParts({data:{kind:"gear",items:[]}})===null); }

console.log("\n── the drawing is data: only the allowed shapes reach the page ──");
{ const w=W(), T=w.T;
  ok("an allowed shape is drawn with its attributes", T.cpldEl({el:"rect",a:{x:1,y:2,width:3,height:4,fill:"#abc"}})==='<rect x="1" y="2" width="3" height="4" fill="#abc"/>');
  ok("an unknown element draws nothing; an unknown attribute or an unsafe value is dropped; text is escaped", T.cpldEl({el:"script",a:{}})===""&&T.cpldEl({el:"image",a:{href:"x"}})===""&&T.cpldEl({el:"rect",a:{x:1,onclick:"alert(1)",fill:'#fff" onload="x'}})==='<rect x="1"/>'&&T.cpldEl({el:"text",a:{x:1},text:"<b>&"})==='<text x="1">&lt;b&gt;&amp;</text>'); }

console.log("\n── the maker, over many seeds ──");
{ const w=W(), S=w.S, T=w.T, M=T.CPLD_LABEL; let bad=null;
  ok("registered as the engine's `label` type (through cpSkillTypeAdd), with no earlier label maker to keep", S.CPSK_TYPES.label===M&&T.CPLD_PREV===null);
  LS.forEach(SK=>{ const sk=Object.assign({fb:S.cpskFb(SK.key)},SK), D=SK.data, n=T.cpldAsk(D), seen={}, firsts={};
    for(let seed=1;seed<=300&&!bad;seed++){ const p=M.make(sk,S.cpskRng(seed)), st=p.steps;
      st.forEach(s=>{ seen[s.part]=(seen[s.part]||0)+1; }); firsts[st[0].part]=1;
      if(st.length!==n||new Set(st.map(s=>s.part)).size!==n) bad=[SK.key,"ask spots, all different",seed];
      else if(!st.every((s,i)=>s.kind==="pick"&&s.id==="spot"+(i+1)&&s.answer===D.parts.find(x=>x.key===s.part).label&&s.label==="Which "+(D.noun||"part")+" is spot "+(i+1)+"?"&&s.work===D.parts.find(x=>x.key===s.part).words)) bad=[SK.key,"one step per spot: its question, its part's label and words",seed];
      else if(JSON.stringify(p.names.slice().sort())!==JSON.stringify(D.parts.map(x=>x.label).sort())) bad=[SK.key,"every name of the diagram offered",seed];
      else if(p.spots.map(x=>x.key).join()!==st.map(s=>s.part).join()) bad=[SK.key,"the spots are the steps' parts in order",seed]; }
    if(!bad&&!D.parts.every(x=>seen[x.key]>0)) bad=[SK.key,"every part comes up",seen];
    if(!bad&&Object.keys(firsts).length<Math.min(3,D.parts.length)) bad=[SK.key,"spot 1 is not always the same part",firsts]; });
  ok("every diagram: ask spots (all different, in a new numbering), one step per spot with its part's label and words, every name offered, every part comes up", !bad, bad);
  const sk=Object.assign({fb:FBS},SOIL), p=M.make(sk,S.cpskRng(5)), q=M.make(sk,S.cpskRng(5));
  ok("the same seed makes the same problem (a try can be made again)", JSON.stringify(p.steps)===JSON.stringify(q.steps)&&JSON.stringify(p.names)===JSON.stringify(q.names));
  ok("a skill of another kind is not this maker's (no earlier label maker: no problem)", M.make({type:"label",data:{kind:"map"}},S.cpskRng(1))===null&&M.html({},{})===""&&M.note({data:{}})===""&&M.missLabel("mix:a:b",{data:{}})===null);
  ok("the soil profile's note for the teacher: 6 horizons, each try numbers 5 of them", M.note(sk).indexOf("A soil profile · "+SOIL.data.parts.length+" horizons · each try numbers "+SOIL.data.ask+" of them in a new order")>0); }

console.log("\n── the miss codes: which name went where ──");
{ const w=W(), S=w.S, M=w.T.CPLD_LABEL, sk=Object.assign({fb:FBS},SOIL), p=M.make(sk,S.cpskRng(3)), st=p.steps[0], other=SOIL.data.parts.find(x=>x.key!==st.part);
  ok("a wrong name → mix:<right>:<given>", M.miss(st,other.label,p)==="mix:"+st.part+":"+other.key);
  const L=LS.find(s=>s.key==="aquatics.lake_zones"), lk=Object.assign({fb:"aquatics:lake_zones"},L);
  ok("in words for the student and the teacher: 'calling the B horizon the C horizon', 'calling the benthic zone the littoral zone'", S.cpSkillMissLabel(sk,"mix:b:c")==="calling the B horizon the C horizon"&&S.cpSkillMissLabel(lk,"mix:benthic:littoral")==="calling the benthic zone the littoral zone"&&M.missLabel("mix:b:other",sk)==="naming the B horizon"&&M.missLabel("weird",sk)===null);
  ok("the codes are safe database keys (no . # $ [ ] /)", LS.every(s=>s.data.parts.every(a=>s.data.parts.every(b=>!/[.#$\[\]\/]/.test("mix:"+a.key+":"+b.key))))); }

console.log("\n── the demo kid: 👀 → ✍️ → 💪 on the soil profile ──");
{ const d=demo("kid"), S=d.S, T=d.T, run=()=>S._cpsk.run, C0=()=>d.G.content, badges=h=>(h.match(/role="button" aria-label="Spot \d+"/g)||[]).length, taps=h=>(h.match(/<g onclick="cpldTap\(/g)||[]).length;
  ok("the Skills door lists every diagram among her skills (from the catalog entry)", LS.every(s=>S.cpSkillsFor(K).some(x=>x.fb===S.cpskFb(s.key))&&C0().indexOf(esc(s.label))>0));
  S.cpSkillOpen(K,FBS,77); const r1=run(), n=r1.prob.steps.length;
  ok("Go: 👀 Watch it — the drawing, "+n+" numbered spots, spot 1 labeled (its horizon lit yellow, its words under it), nothing to tap", /👀 Watch it/.test(C0())&&/<svg viewBox="0 0 360 420"/.test(C0())&&badges(C0())===n&&taps(C0())===0&&/fill="#fde047" fill-opacity="0.55"/.test(C0())&&C0().indexOf("Spot 1 is the "+esc(T.cpldLow(r1.prob.steps[0].answer))+".")>0&&C0().indexOf(esc(r1.prob.steps[0].work))>0);
  for(let i=1;i<n;i++) S.cpSkillStep(); ok("…'Next step' labels one more spot at a time; then all are labeled", run().shown===n&&C0().indexOf("Spot "+n+" is the")>0&&/Got it/.test(C0()));
  S.cpSkillStep(); for(let i=0;i<=n;i++) S.cpSkillStep();
  const r3=run();
  ok("after two worked examples: ✍️ Finish it — all but the last spot labeled; spot "+n+" is hers, in hand, with every name offered", r3.stage==="faded"&&r3.from===n-1&&T.cpldActive(r3.prob,r3)===n-1&&taps(C0())===1&&C0().indexOf("Spot "+n+": Which horizon is it?")>0&&r3.prob.names.every(nm=>C0().indexOf("cpldPick("+(n-1)+",'"+nm+"')")>0));
  ok("a tap on a labeled spot does nothing; on hers, it is in hand", T.cpldTap(0)===false&&T.cpldTap(n-1)===true);
  T.cpldPick(n-1,r3.prob.steps[n-1].answer);
  ok("her pick is her answer for the step, shown on her chip", run().ans[n-1]===r3.prob.steps[n-1].answer&&C0().indexOf(esc(r3.prob.steps[n-1].answer)+"</span></button>")>0);
  ok("a name that isn't the diagram's is refused", T.cpldPick(n-1,"Z horizon")===false);
  S.cpSkillCheckTry(); ok("a right ✍️ try: ✓ All right!; the next one hands over one more spot", run().checked.ok&&/All right!/.test(C0())&&run().st.fade===2);
  S.cpSkillNextTry(); const r4=run();
  ok("the next ✍️ try: the last TWO spots are hers; picking one brings up the other by itself", r4.from===n-2&&T.cpldActive(r4.prob,r4)===n-2&&T.cpldPick(n-2,r4.prob.steps[n-2].answer)&&T.cpldActive(r4.prob,run())===n-1);
  T.cpldPick(n-1,r4.prob.steps[n-1].answer); S.cpSkillCheckTry();
  ok("two right in a row: up to 💪 on your own", run().st.stage==="solo"&&/Next: on your own!/.test(C0()));
  S.cpSkillNextTry(); const r5=run(), P5=r5.prob;
  ok("💪 on your own: every spot hers (a badge to tap for each), spot 1 in hand; the words wait behind 'Show the chart'", r5.stage==="solo"&&r5.from===0&&taps(C0())===n&&T.cpldActive(P5,r5)===0&&/Show the chart/.test(C0())&&!/in words<\/summary>/.test(C0()));
  ok("the spot in hand lights its part right over its own shapes, so what is drawn inside it later stays on top (the tree: the cambium's yellow sits between its ring and the sapwood)", (()=>{ const TR=LS.find(s=>s.key==="forestry.tree_layers"), D=TR.data, cam=D.parts.find(x=>x.key==="cambium"), sp=D.parts.find(x=>x.key==="sapwood");
    const pr={lbl:true,data:D,spots:[cam,sp],names:D.parts.map(x=>x.label),steps:[{part:"cambium",answer:cam.label},{part:"sapwood",answer:sp.label}],act:0}, rr={stage:"solo",from:0,ans:{},checked:null};
    const h=T.cpldSvg(D,pr,rr), ring=h.indexOf('r="118" fill="#84cc16"'), glow=h.indexOf('fill="#fde047" fill-opacity="0.55"'), sap=h.indexOf('r="115" fill="#f1d9a6"');
    return ring>0&&glow>ring&&sap>glow&&h.indexOf('fill-opacity="0.55"',glow+40)<0; })());
  ok("tapping a part of the drawing picks its spot (its shape carries cpldTap)", C0().indexOf('onclick="cpldTap(0)" style="cursor:pointer"/>')>0||new RegExp('<polygon[^>]*onclick="cpldTap\\(\\d\\)"').test(C0()));
  const wrongAt=1, given=SOIL.data.parts.find(x=>x.key!==P5.steps[wrongAt].part).label;
  P5.steps.forEach((s,i)=>T.cpldPick(i,i===wrongAt?given:s.answer)); S.cpSkillCheckTry();
  const code="mix:"+P5.steps[wrongAt].part+":"+SOIL.data.parts.find(x=>x.label===given).key;
  ok("Check: spot 2 named wrong → its mix-up code, said in words; that badge red, the right name shown", run().checked.miss===code&&run().checked.step===wrongAt&&C0().indexOf("Missed at step 2: "+esc(S.cpSkillMissLabel(run().sk,code)))>0&&/fill="#dc2626"/.test(C0())&&C0().indexOf("→ "+esc(P5.steps[wrongAt].answer))>0);
  const before=d._envs.writes.length; S.cpSkillNextTry(); const r6=run(); r6.prob.steps.forEach((s,i)=>T.cpldPick(i,s.answer)); S.cpSkillCheckTry(); S.cpSkillNextTry();
  const W1=d._envs.writes.slice(before), w1=W1[0]||{};
  ok("the 6th try ends the sitting: ONE write, an update on mastery with maya_skills/nc_envirothon/soils:horizons and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&Object.keys(w1.val).some(k=>k==="maya_skills/nc_envirothon/"+FBS)&&Object.keys(w1.val).some(k=>/^studyLog\/maya\/skills\/\d{8}$/.test(k))&&Object.keys(w1.val).length===2, W1.map(x=>[x.op,x.path,Object.keys(x.val||{})]));
  const st=w1.val["maya_skills/nc_envirothon/"+FBS];
  ok("the state: on your own, the mix-up counted by its code, no drawing or numbering saved (counts and codes only)", st.stage==="solo"&&st.miss[code]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo"&&!/spots|names|"art"/.test(JSON.stringify(w1.val)));
  const sum=S.cpSkillSummary(K,d.masteryData,T0), soilsN=S.cpSkillList().filter(s=>s.section==="soils").length;
  ok("summary.skills: Soils counts the profile (stage solo, the mix-up code), out of every Soils skill", sum.soils.total===soilsN&&sum.soils.learned===0&&sum.soils.stage[FBS]==="solo"&&sum.soils.miss[FBS][code]===1);
  ok("the 'skills learned' line (📅 Pace and the station rows): 'skills learned 0 of "+soilsN+"' for Soils", S.cpSkillPaceLine({skills:sum},"soils")==="skills learned 0 of "+soilsN); }

console.log("\n── the teacher: the note, the classmates' counts, the most-missed step ──");
{ const d=demo("teacher"), S=d.S; d.envcView("setup");
  ok("🏫 Class setup ▸ 🧩 Skills: every diagram, type label, core, with its note", LS.every(s=>d.G.content.indexOf(esc(s.label))>0)&&/label · core/.test(d.G.content)&&d.G.content.indexOf("🏷 A soil profile · 6 horizons")>0);
  const studs=d.envcStudents(), withS=studs.filter(x=>x.summary);
  ok("every classmate's summary counts each diagram in its section", withS.length>0&&withS.every(x=>LS.every(s=>x.summary.skills[s.section]&&x.summary.skills[s.section].stage[S.cpskFb(s.key)])));
  const cal=studs.find(x=>x.sid==="walker_caleb"), o=cal.summary.skills.soils;
  ok("📅 Pace's line reads the summaries: Caleb has the profile learned ('skills learned "+o.learned+" of "+o.total+"' in Soils)", o.stage[FBS]==="learned"&&S.cpSkillPaceLine(cal.summary,"soils")==="skills learned "+o.learned+" of "+o.total);
  const rows=S.cpSkillFoldRows(studs), tr=rows.find(r=>r.sk.fb===FBS);
  ok("the Skills fold: the profile's most-missed step in words — 'calling the A horizon the E horizon (6)'", !!tr&&tr.top==="mix:a:e"&&tr.topN===6&&d.G.content.indexOf("Most missed step: calling the A horizon the E horizon (6)")>0, tr&&[tr.top,tr.topN]);
  ok("the demo writes nothing (the seed is in memory)", d._envs.writes.length===0); }

console.log("\n── a live kid: the diagrams from the catalog entry ──");
{ const w=W({w:{fam:FAM,remote:{["classSkills/"+CID]:{}}}}), S=w.S; w.initFb();
  Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Soils and Land Use · Terms":true}};
  ok("no demo list: the profile is CPU_UNITS' (the compiled unit), in the Soils place", S.cpSkillList().some(s=>s.fb===FBS&&s.type==="label"&&s.section==="soils")&&S.cpSkillsFor(K).some(s=>s.fb===FBS));
  ok("the door shows it on her study page, and a sitting makes a real problem", /Label the soil profile/.test(S.cpSkillStudyWrap(K,"BODY"))&&(()=>{ S.cpSkillOpen(K,FBS,11); const r=S._cpsk.run, okk=!!(r&&r.prob&&r.prob.lbl&&r.prob.steps.length===SOIL.data.ask); S._cpsk.run=null; return okk; })());
  ok("cpLabelDemoSeed does nothing off the demo", w.T.cpLabelDemoSeed({cid:CID,students:{}})===false); }

console.log("\n── Howe and Lincoln: nothing on ──");
{ const w=W({w:{fam:HOWE}}), T=w.T, S=w.S;
  ok("cpldOn false; no skills listed; the demo seed refuses; Lincoln's summary has no skills (cpSkillSummary null)", T.cpldOn()===false&&S.cpSkillList().length===0&&T.cpLabelDemoSeed({cid:"x",students:{}})===false&&S.cpSkillSummary("lincoln",{lincoln_skills:{nc_envirothon:{[FBS]:{learned:true}}}},T0)===null);
  ok("a tap or a pick with no sitting does nothing", T.cpldTap(0)===false&&T.cpldPick(0,"O horizon")===false);
  ok("no read, write, listener or element", w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0&&w.G.created.length===0);
  const a=W({w:{fam:HOWE}}), b=W({lbl:false,w:{fam:HOWE}});
  ok("the world without this block boots the same for Howe (nothing created, read or written either way)", JSON.stringify([a.G.reads,a.G.writes,a.G.created.length])===JSON.stringify([b.G.reads,b.G.writes,b.G.created.length])&&b.T===null); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
