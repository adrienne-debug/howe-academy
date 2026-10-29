/*
 * Node tests — 📏 CPITEMSCALE, the Biltmore stick: the `scale` skill item type (DESIGN_class_platform_2026-10-28.md §4.1b, §13 rows 25–27;
 * RESEARCH_envirothon_skills_2026-10-28.md §4.9, ranked #9 in §5; §8.1 the cards it replaces). A tree's diameter at breast height, then its
 * height in 16-ft logs from one chain, read off a stick drawn from the research's formulas — through the skill engine's three stages
 * (shown → faded → on your own).
 *   · Where the block sits (right after CPITEMID_END), how it hooks (CPSKILL's extension point, one guarded demo line), what it never does.
 *   · THE FORMULAS with known values: S = √(a·D²/(a+D)) (a 10-in tree at about 8.5 in), checked against the sight-line geometry worked
 *     out again here; 16 ft at 66 ft ≈ 6.1 in per log; height = logs × 16 + the partial log. The page and compile agree.
 *   · The data against the unit's own cards (25 in, 66 ft, 16-ft logs, DBH at 4½ ft); compile_unit.js rule 8 (each error caught), COUNTS.json
 *     (items = readings), the catalog entry and CPU_UNITS.
 *   · The maker over many seeds: every tree size comes up, the edge closer than tol to ONE mark, the tolerance per tool, the typed readings.
 *   · The drawing (the right mark is the nearest one to the drawn edge), the miss codes and their words.
 *   · The demo kid: 👀 → ✍️ → 💪, ONE write, summary.skills, "skills learned"; the teacher; a live kid; Howe and Lincoln: nothing on.
 * Every count comes from the unit's data, never typed in.                                              run: node test_cp_item_scale.js
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
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"), GEAR=cut("// CPITEMGEAR_START","// CPITEMGEAR_END"), BLK=cut("// CPITEMSCALE_START","// CPITEMSCALE_END");
const XS="\nfunction envPicsIndex(){ return null; }\nG.sk={ CPSK_TYPES, CPSK_SITTING, _cpsk, cpskRng, cpskFb, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillInput, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillSummary, cpSkillPaceLine, cpSkillFoldRows, cpSkillMissLabel, cpSkillStudyWrap };";
const XC="\nG.c={ CPSC_SCALE, get prev(){ return CPSC_PREV; }, CPSC_READS, cpscOn, cpscKind, cpscReads, cpscDiamMark, cpscLogMark, cpscFeet, cpscLogs, cpscLogsWord, cpscNum, cpscPick, cpscGiven, cpscLit, cpscSvg, cpscSvgDiam, cpscSvgLogs, cpscInput, cpscReg, cpScaleDemoSeed };";
// sc false = the same world without this block (the control)
function W(o){ o=o||{}; const t=o.sc!==false; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+SKL+"\n"+GEAR+"\n"+(t?BLK:"")+XS+(t?XC:"\nG.c=null;")},o.w||{})); w.S=w.G.sk; w.T=w.G.c; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", T0=Date.UTC(2026,9,28,15,0,0), FB="forestry:biltmore";
const SK=(UNIT.skills||[]).find(s=>s.key==="forestry.biltmore"), D=SK&&SK.data, RD=(D&&D.reads)||[], DIA=RD.find(x=>x.key==="diameter"), LOG=RD.find(x=>x.key==="logs");
const card=r=>{ const m=/^(.+)#o(\d+)$/.exec(r), d=m&&LIB.unit.decks.find(x=>x.key===m[1]); return d&&d.cards.find(c=>c.order===+m[2]); };
const near=(a,b,e)=>Math.abs(a-b)<=(e==null?1e-9:e);

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPITEMSCALE_START"), b=src.indexOf("// CPITEMSCALE_END"), e=src.indexOf("// CPITEMID_END\n");
  ok("CPITEMSCALE once, IMMEDIATELY after CPITEMID_END (after CPSKILL, so its registry exists)", a>0&&b>a&&src.indexOf("// CPITEMSCALE_START",a+1)<0&&e+"// CPITEMID_END\n".length===a&&src.indexOf("// CPSKILL_END")<a);
  ok("the header names §4.1b, §13 rows 25–27, the research's §4.9, its #9 rank, §8.1, the formulas, the tolerance, the inline SVG, the miss codes, what isn't built, and the dates",
    /§4\.1b/.test(BLK)&&/§13 rows 25–27/.test(BLK)&&/RESEARCH_envirothon_skills_2026-10-28\.md §4\.9/.test(BLK)&&/ranked #9/.test(BLK)&&/§8\.1/.test(BLK)&&/THE FORMULAS/.test(BLK)&&/S = √\(a·D² \/ \(a \+ D\)\)/.test(BLK)&&/THE TOLERANCE/.test(BLK)&&/inline SVG/.test(BLK)&&/WHICH STEP WAS MISSED/.test(BLK)&&/NOT BUILT/.test(BLK)&&/2026-10-28/.test(BLK)&&/2026-10-29/.test(BLK));
  ok("the block only declares, plus its one registration through CPSKILL's extension point", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let CPSC_PREV=| |})/.test(l)||l==="cpscReg();"));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing and reads nothing: no set / update / remove / once / on, no envsWrite / envcWrite, no db or firebase", !/\.set\(|\.update\(|\.remove\(|\.once\(|\.on\(|envsWrite|envcWrite|\bdb\b|firebase/.test(code));
  ok("no image file and nothing hot-linked: no <img, no http(s) URL but the SVG namespace", !/<img/.test(code)&&!/https?:\/\//.test(code.replace(/http:\/\/www\.w3\.org\/2000\/svg/g,"")));
  ok("no Howe kid name as a code literal; no 'Station' in its strings; no 🔀 in index.html", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/["'][^"'\n]*\bStations?\b/.test(code)&&src.indexOf("\u{1F500}")<0);
  ok("every line naming a CPSKILL function is typeof-guarded and tagged 🧩 CPSKILL", code.split("\n").filter(l=>/cpSkill\w+\(/.test(l)).every(l=>/🧩 CPSKILL/.test(l)&&(l.match(/cpSkill\w+(?=\()/g)||[]).every(f=>new RegExp("typeof "+f+" ?[!=]== ?\"function\"").test(l))));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/📏 CPITEMSCALE/.test(l)&&!/^\s*\/\//.test(l));
  const ds=src.indexOf("function envsDemoStart(){"), de=src.indexOf("\nfunction envsDemoSeedKid"), hk=src.indexOf('  try{ if(typeof cpScaleDemoSeed==="function") cpScaleDemoSeed(data); }catch(e){}   // 📏 CPITEMSCALE');
  ok("ONE hook line outside the block, tagged 📏 CPITEMSCALE and guarded: its own line in envsDemoStart, after CPSKILL's seed (other seeds' places not pinned)", hooks.length===1&&hk>ds&&hk<de&&src.indexOf("cpSkillDemoSeed(data)")<hk, hooks.map(l=>l.trim().slice(0,80)));
  ok("CPSKILL and CPITEMGEAR are untouched by it (no 📏 line inside them)", !/📏/.test(SKL)&&!/📏/.test(GEAR)); }

console.log("\n── the formulas, with known values ──");
{ const w=W(), T=w.T;
  ok("a 10-in tree reads at about 8.5 in on a 25-in stick (the research's example): √(25·100/35) = 8.45", near(T.cpscDiamMark(10,25),Math.sqrt(2500/35))&&Math.round(T.cpscDiamMark(10,25)*10)/10===8.5, T.cpscDiamMark(10,25));
  ok("…and more known marks: 4 in → 3.71, 12 in → 9.86, 20 in → 14.91, 25 in → 17.68 (= √312.5)", [[4,3.71],[12,9.86],[20,14.91],[25,17.68]].every(([d,s])=>Math.round(T.cpscDiamMark(d,25)*100)/100===s), [4,12,20,25].map(d=>T.cpscDiamMark(d,25)));
  // the sight-line geometry, worked out again: the eye at 0, the stick a in out touching the trunk's front, the trunk a circle of radius r
  // centered a + r out; the two tangent lines from the eye cross the stick 2·a·tanθ apart, sinθ = r / (a + r) — the 0 on one, the mark on the other
  const geo=(d,a)=>{ const r=d/2, th=Math.asin(r/(a+r)); return 2*a*Math.tan(th); };
  let bad=null; for(let d=1;d<=40&&!bad;d+=0.25) if(!near(T.cpscDiamMark(d,25),geo(d,25),1e-9)) bad=[d,T.cpscDiamMark(d,25),geo(d,25)];
  ok("S = √(a·D²/(a+D)) IS the sight-line width of a round trunk on the stick (every quarter inch, 1–40 in)", !bad, bad);
  ok("one 16-ft log seen from 66 ft on a stick 25 in from the eye covers 16 × 25 ÷ 66 = 6.06 in (\"about 6.1\"); 4 logs 24.24 in", near(T.cpscLogMark(1,25,66,16),16*25/66)&&Math.round(T.cpscLogMark(1,25,66,16)*10)/10===6.1&&near(T.cpscLogMark(4,25,66,16),4*16*25/66));
  ok("…similar triangles: the log's height in inches ÷ 66 ft in inches = the mark ÷ 25 in", near(T.cpscLogMark(2.5,25,66,16)/25,(2.5*16*12)/(66*12)));
  ok("height = logs × 16 + the partial log: 1 → 16, 2½ → 40, 3 → 48, ½ → 8, 4 → 64", [[1,16],[2.5,40],[3,48],[0.5,8],[4,64],[1.5,24]].every(([l,f])=>T.cpscFeet(l,16)===f));
  ok("the page and compile_unit.js use the same formulas (cpscDiamMark ≡ biltS, cpscLogMark ≡ biltLogMark)", [3,6.5,10,17.2,24,30].every(d=>near(T.cpscDiamMark(d,25),C.biltS(d,25)))&&[0.5,1,2.5,4].every(n=>near(T.cpscLogMark(n,25,66,16),C.biltLogMark(n,25,66,16))));
  ok("the marks crowd together as trees get bigger (each inch's mark is closer to the last)", (()=>{ let g=1e9; for(let d=2;d<=30;d++){ const s=T.cpscDiamMark(d,25)-T.cpscDiamMark(d-1,25); if(!(s<g)) return false; g=s; } return true; })());
  ok("readings written the kid's way: 2.5 → 2½, 0.5 → ½, 1 → '1 log', 3 → '3 logs'", T.cpscLogs(2.5)==="2½"&&T.cpscLogs(0.5)==="½"&&T.cpscLogsWord(1)==="1 log"&&T.cpscLogsWord(3)==="3 logs"&&T.cpscLogsWord(2.5)==="2½ logs");
  ok("what she types is read: '13', '13 in', '2½', '2 1/2', '2.5', '2,5', '½' → numbers; 'ten', '' → none", T.cpscNum("13")===13&&T.cpscNum("13 in")===13&&T.cpscNum("2½")===2.5&&T.cpscNum("2 1/2")===2.5&&T.cpscNum("2.5")===2.5&&T.cpscNum("2,5")===2.5&&T.cpscNum("½")===0.5&&T.cpscNum("3 logs")===3&&T.cpscNum("ten")===null&&T.cpscNum("")===null&&T.cpscNum("1.2.3")===null); }

console.log("\n── the data, against the unit's own cards ──");
{ ok("one scale skill in units/nc_envirothon/unit.json: forestry.biltmore, Forestry, type scale, kind biltmore, core", !!SK&&SK.section==="forestry"&&SK.type==="scale"&&SK.core===true&&D.kind==="biltmore"&&(UNIT.skills||[]).filter(s=>s.type==="scale").length===1);
  ok("two readings in the research's order (\"reads the diameter class or counts logs\"): diameter, then logs — and only the stick", RD.map(x=>x.key).join()==="diameter,logs"&&D.tool==="Biltmore stick"&&!/clinometer|prism|pace|site index|ring/i.test(JSON.stringify(RD)));
  const c=r=>(card(r)||{}).def||"";
  ok("reach 25 in = the card's \"25 inches (the length of the stick)\" (Forestry · Facts #o446)", D.reach===25&&/^25 inches/.test(c("Forestry · Facts#o446")));
  ok("chain 66 ft = \"66 feet (one chain)\" (#o447) and \"Only at 66 feet\" (#o441)", D.chain===66&&/^66 feet \(one chain\)/.test(c("Forestry · Facts#o447"))&&/66 feet/.test(c("Forestry · Facts#o441")));
  ok("log 16 ft = \"16 feet\" (#o439); the feet rule is the card's \"Multiply the number of logs by 16, then add any partial log\" (#o448)", D.log===16&&c("Forestry · Facts#o439")==="16 feet"&&/logs by 16, then add any partial log/.test(c("Forestry · Facts#o448")));
  ok("the usable top is the card's \"an eight-inch diameter or forks\" (#o440); the drawing's top is a fork", /eight-inch diameter or forks/.test(c("Forestry · Facts#o440"))&&/fork/.test(BLK));
  const asks=[].concat(...RD.map(x=>x.ask||[]));
  ok("each question's answer is in its card: 4½ ft (DBH, #o238), 25 inches (#o446), 66 feet (#o447)", asks.length===3&&asks.every(q=>q.src&&card(q.src))&&/4 1\/2 feet/.test(c(asks.find(q=>q.id==="hold:height").src))&&/^4½ feet/.test(asks.find(q=>q.id==="hold:height").answer)&&asks.find(q=>q.id==="hold:reach").answer==="25 inches"&&/^66 feet/.test(asks.find(q=>q.id==="stand").answer));
  ok("every question: 3 different wrong answers, none the right one", asks.every(q=>q.wrong.length===3&&new Set(q.wrong).size===3&&q.wrong.indexOf(q.answer)<0));
  const rep=(SK.replaces||[]).map(card);
  ok("replaces = the research's §8.1 list for the stick: hold it how far, pace how far, height from a log count (real cards)", rep.length===3&&rep.every(Boolean)&&JSON.stringify(rep.map(x=>x.name).sort())===JSON.stringify(["How do you find tree height in feet from a Biltmore stick log count?","How far away from you do you hold a Biltmore stick?","To measure height with a Biltmore stick, how far do you pace from the tree?"]), rep.map(x=>x&&x.name));
  ok("…and keeps what the research keeps (\"Only at 66 feet\", the DBH and Chain terms, rings, BAF), and the sheet/chart ones (prism, site index, a pace)", !(SK.replaces||[]).some(r=>["Forestry · Facts#o441","Forestry · Facts#o456","Forestry · Terms#o238","Forestry · Terms#o236","Forestry · Facts#o434","Forestry · Facts#o453"].indexOf(r)>=0));
  const fq=[].concat(...["pre","post"].map(f=>(LIB.tests.forestry[f]||{items:[]}).items.map(i=>({id:f+"-"+i.n,q:i.q}))));
  ok("tests = the Forestry forms' DBH question (post-12, \"What does DBH stand for?\")", JSON.stringify(SK.tests)==='["post-12"]'&&/DBH/.test((fq.find(x=>x.id==="post-12")||{}).q||""));
  ok("the tolerance per tool: the nearest whole inch (mark 1, tol ½) and the nearest half log (mark ½, tol ¼)", DIA.mark===1&&DIA.tol===0.5&&LOG.mark===0.5&&LOG.tol===0.25&&DIA.min>0&&DIA.max>DIA.min&&LOG.min>0&&LOG.max>LOG.min); }

console.log("\n── compile_unit.js rule 8 (Biltmore stick), COUNTS.json, the catalog entry ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("the unit compiles and is current (--check)", r.ok, r.err);
  ok("COUNTS.json: the stick's items are its readings ("+RD.length+")", COUNTS.skills&&COUNTS.skills["forestry.biltmore"]&&COUNTS.skills["forestry.biltmore"].items===RD.length&&COUNTS.skills["forestry.biltmore"].type==="scale"&&COUNTS.skills["forestry.biltmore"].section==="forestry");
  ok("index.json (the catalog entry) and CPU_UNITS carry it exactly as unit.json has it (its _about stays in unit.json)", JSON.stringify(INDEX.skills.find(s=>s.key===SK.key))===JSON.stringify(C.skillEntry(SK))&&src.indexOf(JSON.stringify(C.skillEntry(SK)))>0&&!("_about" in C.skillEntry(SK)));
  const L=C.loadUnit(REPO,"nc_envirothon"), secs=UNIT.sections.map(s=>s.key), tests={sections:{}}, cp=()=>JSON.parse(JSON.stringify(SK));
  const E=f=>{ const k=cp(); k.tests=[]; f(k); return C.checkSkills([k],secs,L.decks,tests).join(" | "); };
  ok("the real stick passes rule 8 alone", E(()=>{})==="", E(()=>{}));
  ok("rule 8 catches: not type scale · no reach / chain / log · no reads", /is type scale/.test(E(k=>{ k.type="chart"; }))&&/data\.reach must be/.test(E(k=>{ delete k.data.reach; }))&&/data\.chain must be/.test(E(k=>{ k.data.chain=0; }))&&/data\.log must be/.test(E(k=>{ k.data.log="16"; }))&&/needs 1 or more reads/.test(E(k=>{ k.data.reads=[]; })));
  ok("…a read the app doesn't draw · a read twice · no label · min ≥ max · no whole mark between", /key must be one of diameter, logs/.test(E(k=>{ k.data.reads[0].key="clinometer"; }))&&/key twice/.test(E(k=>{ k.data.reads[1].key="diameter"; }))&&/has no label/.test(E(k=>{ k.data.reads[0].label=""; }))&&/min < max/.test(E(k=>{ k.data.reads[0].min=30; }))&&/no whole mark/.test(E(k=>{ k.data.reads[0].min=6.2; k.data.reads[0].max=6.8; })));
  ok("…a tolerance over half a mark (two marks would count) · none · no mark", /tol must be/.test(E(k=>{ k.data.reads[0].tol=1; }))&&/tol must be/.test(E(k=>{ delete k.data.reads[1].tol; }))&&/mark \(the stick's spacing\)/.test(E(k=>{ k.data.reads[1].mark=0; })));
  ok("…a question id that isn't a safe miss code (a dot) or twice · no answer · not 3 different wrong ones · the answer among the wrong · a src that is no card",
    /safe as a database key/.test(E(k=>{ k.data.reads[0].ask[0].id="hold.height"; }))&&/twice/.test(E(k=>{ k.data.reads[1].ask[0].id="hold:height"; }))&&/has no answer/.test(E(k=>{ k.data.reads[0].ask[0].answer=""; }))&&/3 different answers/.test(E(k=>{ k.data.reads[0].ask[0].wrong.pop(); }))&&/3 different answers/.test(E(k=>{ k.data.reads[0].ask[1].wrong[0]="25 inches"; }))&&/is no card/.test(E(k=>{ k.data.reads[1].ask[0].src="Forestry · Facts#o99999"; })));
  ok("…a data.refs entry that is no card", /data\.refs “Forestry · Facts#o0” is no card/.test(E(k=>{ k.data.refs.push("Forestry · Facts#o0"); })));
  ok("a gear skill and a unit with no skills are checked as before; scaleReads is only the stick's", C.checkSkills(undefined,secs,L.decks,tests).length===0&&C.scaleReads({type:"id",data:{kind:"gear",reads:[]}})===null&&C.scaleReads(SK)===RD); }

console.log("\n── the maker, over many seeds ──");
{ const w=W(), S=w.S, T=w.T, M=T.CPSC_SCALE, sk=Object.assign({fb:FB},SK), seen={diameter:{},logs:{}}; let bad=null, N=800;
  ok("registered as the engine's `scale` type (through cpSkillTypeAdd), with no earlier scale maker to keep", S.CPSK_TYPES.scale===M&&T.prev===null&&T.cpscReg()===true);
  for(let seed=1;seed<=N&&!bad;seed++){ const p=M.make(sk,S.cpskRng(seed)), x=p.read, st=p.steps; seen[x.key][p.ans]=(seen[x.key][p.ans]||0)+1;
    const marks=[]; for(let m=x.mark;m<=x.max+2;m+=x.mark) marks.push(Math.round(m*1000)/1000); const counted=marks.filter(m=>Math.abs(m-p.val)<=p.tol+1e-9);
    if(p.ans<x.min||p.ans>x.max||!near((p.ans/x.mark)%1,0,1e-9)) bad=["the answer is a mark between min and max",seed,x.key,p.ans];
    else if(!(Math.abs(p.val-p.ans)<=x.tol*0.7+0.006)) bad=["the drawn edge is within 0.7 × tol of the answer's mark",seed,p.val,p.ans];
    else if(counted.length!==1||counted[0]!==p.ans) bad=["exactly ONE mark is within tol of the edge: the answer",seed,p.val,counted];
    else if(st.length!==3) bad=["3 steps",seed];
    else if(x.key==="diameter"&&(st.map(s=>s.id).join()!=="hold:height,hold:reach,read:diameter"||st[2].answer!==p.ans+" in"||!st[2].read)) bad=["diameter steps",seed,st.map(s=>[s.id,s.answer])];
    else if(x.key==="logs"&&(st.map(s=>s.id).join()!=="stand,read:logs,math:feet"||st[1].answer!==T.cpscLogsWord(p.ans)||st[2].kind!=="num"||st[2].answer!==T.cpscFeet(p.ans,16))) bad=["logs steps",seed,st.map(s=>[s.id,s.answer])];
    else if(!st.filter(s=>s.kind==="pick"&&!s.read).every(s=>s.choices.length===4&&new Set(s.choices).size===4&&s.choices.indexOf(s.answer)>=0)) bad=["each question: 4 different choices, the answer among them",seed]; }
  ok("each problem: a mark between min and max, the edge within 0.7 × tol of it, exactly ONE mark within tol (the answer), 3 steps, 4 choices per question", !bad, bad);
  const want=k=>{ const x=RD.find(r=>r.key===k), o=[]; for(let m=Math.ceil(x.min/x.mark);m<=Math.floor(x.max/x.mark);m++) o.push(Math.round(m*x.mark*1000)/1000); return o; };
  ok("every tree size comes up across seeds: each whole inch "+DIA.min+"–"+DIA.max+", each half log "+LOG.min+"–"+LOG.max, want("diameter").every(v=>seen.diameter[v])&&want("logs").every(v=>seen.logs[v]), [Object.keys(seen.diameter).length,Object.keys(seen.logs).length]);
  ok("both readings come up, about as often", Object.keys(seen).every(k=>Object.values(seen[k]).reduce((a,b)=>a+b,0)>N*0.35));
  const p=M.make(sk,S.cpskRng(5)), q=M.make(sk,S.cpskRng(5));
  ok("the same seed makes the same problem (a try can be made again)", JSON.stringify([p.val,p.steps])===JSON.stringify([q.val,q.steps]));
  // typed readings → her answer: the tool's tolerance around the true edge
  const pd={scale:true,read:DIA,val:13.3,ans:13,tol:0.5,steps:[{},{},{id:"read:diameter",read:true,answer:"13 in"}]}, pl={scale:true,read:LOG,val:2.62,ans:2.5,tol:0.25,steps:[{},{id:"read:logs",read:true,answer:"2½ logs"},{}]};
  ok("diameter (edge at 13.3): 13, '13 in', 13.6 count; 12, 14, 14.5 don't — shown as she wrote them", T.cpscGiven(pd,2,"13")==="13 in"&&T.cpscGiven(pd,2,"13 in")==="13 in"&&T.cpscGiven(pd,2,"13.6")==="13 in"&&T.cpscGiven(pd,2,"12")==="12 in"&&T.cpscGiven(pd,2,"14")==="14 in"&&T.cpscGiven(pd,2,"14.5")==="14.5 in"&&T.cpscGiven(pd,2,"")==="");
  ok("logs (top at 2.62): 2.5, '2½', '2 1/2', 2.7 count; 2, 3, 40 don't; words stay as typed", T.cpscGiven(pl,1,"2.5")==="2½ logs"&&T.cpscGiven(pl,1,"2½")==="2½ logs"&&T.cpscGiven(pl,1,"2 1/2")==="2½ logs"&&T.cpscGiven(pl,1,"2.7")==="2½ logs"&&T.cpscGiven(pl,1,"2")==="2 logs"&&T.cpscGiven(pl,1,"3")==="3 logs"&&T.cpscGiven(pl,1,"40")==="40 logs"&&T.cpscGiven(pl,1,"two")==="two");
  ok("a skill of another kind is not this maker's (no earlier scale maker: no problem)", M.make({type:"scale",data:{kind:"ruler"}},S.cpskRng(1))===null&&M.html({},{})===""&&M.help({},{})===""&&M.note({data:{}})===""&&M.missLabel("read:logs",{data:{}})===null&&M.miss({id:"x"},"1",{})===null); }

console.log("\n── a sitting: diameter, then height, then … (the one she missed more first) ──");
{ const d=demo("kid"), S=d.S;
  S.cpSkillOpen(K,FB,7); const r=S._cpsk.run, keys=[r.prob.read.key];
  const answer=()=>{ const q=S._cpsk.run, p=q.prob; p.steps.forEach((s,i)=>{ if(i<q.from) return; if(s.read) d.T.cpscInput(i,String(p.ans)); else if(s.kind==="pick") S.cpSkillPick(i,s.answer); else S.cpSkillInput(i,String(s.answer)); }); S.cpSkillCheckTry(); S.cpSkillNextTry(); };
  for(let t=1;t<S.CPSK_SITTING;t++){ if(S._cpsk.run.stage==="shown"){ const n0=r.tries.length; for(let i=0;i<10&&r.tries.length===n0;i++) S.cpSkillStep(); } else answer(); keys.push(S._cpsk.run.prob.read.key); }
  ok("a fresh sitting alternates in the research's order: diameter, logs, diameter, logs …", keys.join()==="diameter,logs,diameter,logs,diameter,logs", keys);
  S.cpSkillQuit(); S._cpsk.run=null;
  const ms=d.masteryData; (ms.maya_skills||(ms.maya_skills={})).nc_envirothon=Object.assign({},ms.maya_skills.nc_envirothon,{[FB]:{stage:"faded",fade:1,up:0,down:0,learned:false,tries:[],miss:{"math:partial":2,"read:diameter":1}}});
  S.cpSkillOpen(K,FB,7); ok("with more height misses (math:partial 2 > read:diameter 1), the sitting starts with the height", S._cpsk.run.prob.read.key==="logs"); S._cpsk.run=null; }

console.log("\n── the drawing: inline SVG, made from the formulas ──");
{ const w=W(), T=w.T, M=T.CPSC_SCALE, sk=Object.assign({fb:FB},SK), S=w.S;
  let pd=null, pl=null; for(let s=1;s<200&&!(pd&&pl);s++){ const p=M.make(sk,S.cpskRng(s)); if(p.read.key==="diameter"&&!pd&&p.ans>=18) pd=p; if(p.read.key==="logs"&&!pl&&p.ans%1) pl=p; }
  const hd=T.cpscSvg(D,pd,{}), hdS=T.cpscSvg(D,pd,{show:true,hers:pd.ans-3});
  ok("the diameter view: an <svg> with its viewBox, no image, phone-first (full width up to 440 px, taps don't zoom)", /^<svg viewBox="0 0 400 230"/.test(hd)&&!/<img|<image/.test(hd)&&/width:100%;max-width:440px/.test(hd)&&/touch-action:manipulation/.test(hd));
  // the ticks' x and the trunk's right edge (the 2nd dashed sight line): the answer's tick is the nearest one to the edge
  const ticks=[...hd.matchAll(/<line x1="([\d.]+)" y1="104" x2="[\d.]+" y2="(?:118|113)"/g)].map(m=>+m[1]), edges=[...hd.matchAll(/<line x1="([\d.]+)" y1="98" x2="[\d.]+" y2="152" stroke="#3f2a14"/g)].map(m=>+m[1]);
  const nearest=ticks.reduce((b,x,i)=>Math.abs(x-edges[1])<Math.abs(ticks[b]-edges[1])?i:b,0)+1;
  ok("the trunk's right edge is drawn nearest the answer's tick (tick "+nearest+" of "+ticks.length+", the answer "+pd.ans+")", edges.length===2&&nearest===pd.ans, [edges,ticks.slice(pd.ans-2,pd.ans+1)]);
  ok("the numbers on the stick: 0, and every inch or every other one (they read at 430 px)", /font-weight="900" fill="#1f2937">0<\/text>/.test(hd)&&(hd.match(/<text[^>]*font-weight="700" fill="#1f2937">\d+<\/text>/g)||[]).length>=Math.floor(pd.ans/2));
  ok("nothing tells the number before it's shown; shown: the green bubble at the answer, her wrong reading in red", !/ in<\/text>/.test(hd)&&hdS.indexOf(">"+pd.ans+" in</text>")>0&&/fill="#dc2626">you: /.test(hdS));
  const hl=T.cpscSvg(D,pl,{}), hlS=T.cpscSvg(D,pl,{show:true});
  ok("the height view: viewBox 400 × 400, the stick's log numbers, the usable top dashed red, 'logs' on the stick", /^<svg viewBox="0 0 400 400"/.test(hl)&&/stroke="#dc2626" stroke-width="2\.2" stroke-dasharray="7 4"/.test(hl)&&/logs end at the fork/.test(hl)&&/>logs<\/text>/.test(hl)&&/font-weight="900" fill="#1f2937">1<\/text>/.test(hl));
  const red=+(/<line x1="[\d.]+" y1="([\d.]+)" x2="392" y2="[\d.]+" stroke="#dc2626"/.exec(hl)||[])[1], lt=[...hl.matchAll(/<line x1="176" y1="([\d.]+)" x2="(?:162|168)"/g)].map(m=>+m[1]);
  const ni=lt.reduce((b,y,i)=>Math.abs(y-red)<Math.abs(lt[b]-red)?i:b,0);
  ok("the usable top is drawn nearest the answer's half-log mark (mark "+(ni/2)+", the answer "+pl.ans+")", lt.length>2&&ni/2===pl.ans, [red,lt]);
  ok("the log marks are evenly spaced (6.1 in each at 66 ft, scaled)", lt.every((y,i)=>i<2||near(lt[i-1]-y,lt[0]-lt[1],0.15)));
  ok("shown: the green bubble with the log count", hlS.indexOf(">"+T.cpscLogsWord(pl.ans)+"</text>")>0&&hl.indexOf(T.cpscLogsWord(pl.ans)+"</text>")<0); }

console.log("\n── the miss codes: which step went wrong ──");
{ const w=W(), T=w.T, S=w.S, M=T.CPSC_SCALE, sk=Object.assign({fb:FB},SK);
  const pl={scale:true,data:D,read:LOG,val:2.55,ans:2.5,tol:0.25,typed:{},steps:[{id:"stand"},{id:"read:logs",read:true},{id:"math:feet",kind:"num",answer:40}]};
  ok("logs: she typed 40 (the feet) where the stick reads logs → read:feet; typed 3 → read:logs", (pl.typed[1]="40",M.miss(pl.steps[1],"40 logs",pl))==="read:feet"&&(pl.typed[1]="3",M.miss(pl.steps[1],"3 logs",pl))==="read:logs");
  ok("feet: 32 for 2½ logs (the half log left out) → math:partial; 36 → math:feet; a question → its own id", M.miss(pl.steps[2],"32",pl)==="math:partial"&&M.miss(pl.steps[2],"36",pl)==="math:feet"&&M.miss(pl.steps[0],"25 inches",pl)==="stand");
  const p3=Object.assign({},pl,{ans:3,val:3.05}); ok("…with 3 whole logs there's no half to leave out: 32 → math:feet", M.miss(pl.steps[2],"32",p3)==="math:feet");
  ok("in words for the student and the teacher", S.cpSkillMissLabel(sk,"math:partial")==="the half log — add 8 ft for it (logs × 16 + the partial log)"&&S.cpSkillMissLabel(sk,"read:feet")==="typed feet where the stick reads logs"&&S.cpSkillMissLabel(sk,"read:diameter")==="reading the diameter mark at the tree’s right edge (to the nearest inch)"&&S.cpSkillMissLabel(sk,"hold:reach")===RD[0].ask[1].miss&&S.cpSkillMissLabel(sk,"stand")===LOG.ask[0].miss&&S.cpSkillMissLabel(sk,"weird")==="weird");
  ok("the codes are safe database keys (no . # $ [ ] /)", ["read:diameter","read:logs","read:feet","math:partial","math:feet"].concat([].concat(...RD.map(x=>x.ask.map(q=>q.id)))).every(k=>!/[.#$\[\]\/]/.test(k))); }

console.log("\n── the demo kid: 👀 → ✍️ → 💪 ──");
{ const d=demo("kid"), S=d.S, T=d.T, C0=()=>d.G.content, run=()=>S._cpsk.run;
  const fill=(right)=>{ const r=run(), p=r.prob; p.steps.forEach((s,i)=>{ if(i<r.from) return; if(s.read){ const v=right?p.val:p.ans+(p.read.key==="logs"?1:3); T.cpscInput(i,String(v)); } else if(s.kind==="pick") S.cpSkillPick(i,s.answer); else S.cpSkillInput(i,String(s.answer)); }); };
  const L=S.cpSkillsFor(K), fi=L.findIndex(s=>s.fb===FB), firstAq=L.findIndex(s=>s.section==="aquatics");
  ok("her skills: the Biltmore stick in the Forestry place (from the catalog entry)", fi>=0&&L[fi].section==="forestry"&&(firstAq<0||fi<firstAq), L.map(s=>s.fb));
  ok("the Skills door lists it", /Biltmore stick: diameter and height/.test(C0()));
  S.cpSkillOpen(K,FB,3); const r1=run();
  ok("Go: 👀 Watch it — the diameter first, the trunk and the stick, no reading marked yet, no box to type in", r1.stage==="shown"&&r1.prob.read.key==="diameter"&&/👀 Watch it/.test(C0())&&/<svg viewBox="0 0 400 230"/.test(C0())&&C0().indexOf(">"+r1.prob.ans+" in</text>")<0&&!/cpsc-read/.test(C0()));
  S.cpSkillStep(); S.cpSkillStep(); ok("…step by step: 4½ feet, 25 inches, then the reading marked on the stick", /4½ feet \(breast height\)/.test(C0())&&/25 inches/.test(C0())&&C0().indexOf(">"+r1.prob.ans+" in</text>")>0);
  S.cpSkillStep(); const r2=run();
  ok("Got it → the next worked example is the height: the tree from one chain, the stick upright", r2.prob.read.key==="logs"&&/<svg viewBox="0 0 400 400"/.test(C0()));
  for(let i=0;i<4&&run().stage==="shown";i++) S.cpSkillStep();
  const r3=run();
  ok("after two worked examples: ✍️ Finish it — steps 1–2 done for her, she does the last one", r3.stage==="faded"&&r3.from===2&&r3.prob.read.key==="diameter"&&C0().indexOf(">"+r3.prob.ans+" in</text>")<0);
  ok("…her box: '✏️ Step 3 · your reading', a decimal keypad, in inches, to the nearest whole inch mark", /✏️ Step 3 · your reading/.test(C0())&&/inputmode="decimal"/.test(C0())&&/oninput="cpscInput\(2,this\.value\)"/.test(C0())&&/To the nearest whole inch mark/.test(C0())&&/font-size:17px/.test(C0()));
  S.cpSkillCheckTry(); ok("Check with nothing typed: 'Fill in every step first', nothing counted", !run().checked&&run().tries.length===2);
  fill(true); S.cpSkillCheckTry();
  ok("her reading (the edge's own number, within ½ in) is right: ✓ All right!; the next one hands over one more step", run().checked.ok&&/All right!/.test(C0())&&run().st.fade===2&&C0().indexOf(">"+r3.prob.ans+" in</text>")>0);
  S.cpSkillNextTry(); const r4=run();
  ok("the next ✍️ try is the height: the stand question given, she reads the logs and finds the feet", r4.prob.read.key==="logs"&&r4.from===1&&/✏️ Step 2 · your reading/.test(C0())&&/type 2½ as 2\.5 or 2 1\/2/.test(C0()));
  fill(true); S.cpSkillCheckTry();
  ok("two right in a row: up to 💪 on your own", run().st.stage==="solo"&&/Next: on your own!/.test(C0()));
  S.cpSkillNextTry(); const r5=run();
  ok("💪 on your own: every step hers; the how-to waits behind 'Show the chart'", r5.stage==="solo"&&r5.from===0&&/Show the chart/.test(C0())&&!/How to use the Biltmore stick/.test(C0()));
  fill(false); S.cpSkillCheckTry();
  ok("a misread stick (3 marks off): 'read:diameter', said in words; her reading red on the stick, the right mark green", run().checked.miss==="read:diameter"&&C0().indexOf("Missed at step 3: reading the diameter mark")>0&&/fill="#dc2626">you: /.test(C0())&&C0().indexOf(">"+r5.prob.ans+" in</text>")>0&&/Red = your reading/.test(C0()));
  S.cpSkillNextTry(); const r6=run(), p6=r6.prob, before=d._envs.writes.length;
  ok("the 6th try is the height, on her own", p6.read.key==="logs"&&r6.from===0);
  p6.steps.forEach((s,i)=>{ if(s.read) T.cpscInput(i,String(p6.ans)); else if(s.kind==="pick") S.cpSkillPick(i,s.answer); else S.cpSkillInput(i,String(p6.ans%1?Math.floor(p6.ans)*16:s.answer+16)); });
  S.cpSkillCheckTry(); const miss6=run().checked.miss;
  ok("the feet without the half log (or a log too many) → math:partial / math:feet", miss6===(p6.ans%1?"math:partial":"math:feet"), miss6);
  S.cpSkillNextTry(); const W1=d._envs.writes.slice(before), w1=W1[0]||{};
  ok("the 6th try ends the sitting: ONE write, an update on mastery with maya_skills/nc_envirothon/forestry:biltmore and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&Object.keys(w1.val).some(k=>k==="maya_skills/nc_envirothon/"+FB)&&Object.keys(w1.val).some(k=>/^studyLog\/maya\/skills\/\d{8}$/.test(k))&&Object.keys(w1.val).length===2, W1.map(x=>[x.op,x.path,Object.keys(x.val||{})]));
  const st=w1.val["maya_skills/nc_envirothon/"+FB];
  ok("the state: two misses in a row on her own move her back to ✍️ Finish it; the misses counted by their codes; no reading or tree saved (counts and codes only)", st.stage==="faded"&&st.miss["read:diameter"]===1&&st.miss[miss6]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo"&&!/typed|"val"|cpsc/.test(JSON.stringify(w1.val)));
  const sum=S.cpSkillSummary(K,d.masteryData,T0), nF=S.cpSkillList().filter(s=>s.section==="forestry").length;
  ok("summary.skills: Forestry counts it (stage faded, the miss codes) among its "+nF+" skills", sum.forestry.total===nF&&sum.forestry.stage[FB]==="faded"&&sum.forestry.miss[FB]["read:diameter"]===1);
  ok("the 'skills learned' line (📅 Pace and the station rows) counts it: 'skills learned "+sum.forestry.learned+" of "+nF+"' for Forestry", S.cpSkillPaceLine({skills:sum},"forestry")==="skills learned "+sum.forestry.learned+" of "+nF&&nF>=1);
  S.cpSkillQuit(); d.envsView("scores"); ok("Scores: '🧩 skills learned … of "+nF+"' on Forestry", new RegExp("🧩 skills learned \\d+ of "+nF).test(C0())); }

console.log("\n── the teacher: the note, the classmates' counts, the most-missed step ──");
{ const d=demo("teacher"), S=d.S; d.envcView("setup");
  ok("🏫 Class setup ▸ 🧩 Skills: the Biltmore stick, type scale, core, with its note (2 readings, each at its nearest mark)", /Biltmore stick: diameter and height/.test(d.G.content)&&/scale · core/.test(d.G.content)&&d.G.content.indexOf("📏 "+RD.length+" readings · Tree diameter (DBH) (counts at the nearest whole inch) · Tree height in 16-ft logs (counts at the nearest half log)")>0);
  const studs=d.envcStudents(), withS=studs.filter(x=>x.summary);
  ok("every classmate's summary counts it in Forestry", withS.length>0&&withS.every(x=>x.summary.skills.forestry&&x.summary.skills.forestry.stage[FB]));
  const cal=studs.find(x=>x.sid==="walker_caleb"), nF=S.cpSkillList().filter(s=>s.section==="forestry").length;
  ok("📅 Pace's line reads the summaries: Caleb has learned it ('skills learned … of "+nF+"' in Forestry)", cal.summary.skills.forestry.stage[FB]==="learned"&&/^skills learned [1-9]\d* of /.test(S.cpSkillPaceLine(cal.summary,"forestry")));
  const rows=S.cpSkillFoldRows(studs), tr=rows.find(r=>r.sk.fb===FB);
  ok("the Skills fold: the stick's most-missed step in words — 'the half log — add 8 ft for it … (3)'", !!tr&&tr.top==="math:partial"&&tr.topN===3&&d.G.content.indexOf("Most missed step: the half log — add 8 ft for it (logs × 16 + the partial log) (3)")>0, tr&&[tr.top,tr.topN]);
  ok("the demo writes nothing (the seed is in memory)", d._envs.writes.length===0); }

console.log("\n── a live kid: the stick from the catalog entry ──");
{ const w=W({w:{fam:FAM,remote:{["classSkills/"+CID]:{}}}}), S=w.S; w.initFb();
  Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Forestry · Terms":false}};
  ok("no demo list: the stick is CPU_UNITS' (the compiled unit), in the Forestry place", S.cpSkillList().some(s=>s.fb===FB&&s.type==="scale"&&s.section==="forestry")&&S.cpSkillsFor(K).some(s=>s.fb===FB));
  ok("the door shows it on her study page, and a sitting makes a real problem", /Biltmore stick: diameter and height/.test(S.cpSkillStudyWrap(K,"BODY"))&&(()=>{ S.cpSkillOpen(K,FB,11); const r=S._cpsk.run, okk=!!(r&&r.prob&&r.prob.scale&&r.prob.steps.length===3); S._cpsk.run=null; return okk; })());
  ok("cpScaleDemoSeed does nothing off the demo; typing with no sitting does nothing", w.T.cpScaleDemoSeed({cid:CID,students:{}})===false&&w.T.cpscInput(0,"3")===false); }

console.log("\n── Howe and Lincoln: nothing on ──");
{ const w=W({w:{fam:HOWE}}), T=w.T, S=w.S;
  ok("cpscOn false; no skills listed; the demo seed refuses; Lincoln's summary has no skills (cpSkillSummary null)", T.cpscOn()===false&&S.cpSkillList().length===0&&T.cpScaleDemoSeed({cid:"x",students:{}})===false&&S.cpSkillSummary("lincoln",{lincoln_skills:{nc_envirothon:{[FB]:{learned:true}}}},T0)===null);
  ok("no read, write, listener or element", w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0&&w.G.created.length===0);
  const a=W({w:{fam:HOWE}}), b=W({sc:false,w:{fam:HOWE}});
  ok("the world without this block boots the same for Howe (nothing created, read or written either way)", JSON.stringify([a.G.reads,a.G.writes,a.G.created.length])===JSON.stringify([b.G.reads,b.G.writes,b.G.created.length])&&b.T===null); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
