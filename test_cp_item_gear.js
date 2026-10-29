/*
 * Node tests — 🧰 CPITEMGEAR, the first real skill item type: gear and tool pictures (DESIGN_class_platform_2026-10-28.md §4.1b, §6.7,
 * §13 rows 25, 26, 29; RESEARCH_envirothon_skills_2026-10-28.md §4.5, ranked #1 in §5). A picture of a field tool → what is it → what is
 * it for, through the skill engine's three stages (shown → faded → on your own).
 *   · Where the block sits (right after CPSKILL_END), how it hooks (CPSKILL's extension point, two guarded lines), what it never does.
 *   · The data: units/nc_envirothon/unit.json `skills`, the research's two lists; compile_unit.js rule 8 (each error caught), COUNTS.json,
 *     the catalog entry and CPU_UNITS carry it; the "no photo yet" list comes from envirothon/pics/index.json.
 *   · The maker over many seeds: 4 choices, look-alikes first, the same 4 for name and use, 2 steps with a photo and 1 without, the miss
 *     codes and their words, no item twice in a sitting, the missed items first.
 *   · The picture: from the CPPHOTOS pool by item + tag only; the "📷 Photo needed" box; the credit hidden until the name is out.
 *   · The demo kid: 👀 → ✍️ (the name given, the use hers) → 💪, ONE write, summary.skills; the teacher: the photo note under the skill,
 *     the classmates' counts, "skills learned" from the summaries (📅 Pace's line), the most-missed step in words.
 *   · A live kid gets the unit's skills from the catalog entry; Howe and Lincoln: nothing on.
 * Every count comes from the unit's data, never typed in.                                              run: node test_cp_item_gear.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
const C=require("./units/build/compile_unit.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const UNIT=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const COUNTS=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","COUNTS.json"),"utf8"));
const INDEX=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","index.json"),"utf8"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"), BLK=cut("// CPITEMGEAR_START","// CPITEMGEAR_END");
const XS="\nfunction envPicsIndex(){ return G.pics||null; }\nG.sk={ CPSK_TYPES, CPSK_SITTING, _cpsk, cpskRng, cpskFb, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillSummary, cpSkillPaceLine, cpSkillFoldRows, cpSkillFoldHtml, cpSkillMissLabel, cpSkillSetupHtml, cpSkillStudyWrap };\nG.ph={ _cpph, cpphKey, cpPhotos };";
const XG="\nG.ig={ CPIG_ID, CPIG_TAGS, CPIG_PREV_ID, CPIG_DEMO_SVG, cpigOn, cpigGear, cpigSlug, cpigItems, cpigPhotos, cpGearNeedPhoto, cpigOrder, cpigSet, cpGearDemoSeed };";
// gear false = the same world without this block (the control)
function W(o){ o=o||{}; const g=o.gear!==false; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+SKL+"\n"+(g?BLK:"")+XS+(g?XG:"\nG.ig=null;")},o.w||{})); w.G.pics=PICS; w.S=w.G.sk; w.P=w.G.ph; w.I=w.G.ig; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", T0=Date.UTC(2026,9,28,15,0,0);
const SK=UNIT.skills||[], FOR=SK.find(s=>s.key==="forestry.tools"), AQ=SK.find(s=>s.key==="aquatics.gear");
const FBF="forestry:tools", FBA="aquatics:gear";
const nm=s=>String(s).toLowerCase();

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPITEMGEAR_START"), b=src.indexOf("// CPITEMGEAR_END"), e=src.indexOf("// CPSKILL_END\n");
  ok("CPITEMGEAR once, IMMEDIATELY after CPSKILL_END", a>0&&b>a&&src.indexOf("// CPITEMGEAR_START",a+1)<0&&e+"// CPSKILL_END\n".length===a);
  ok("the header names §4.1b, §6.7, §13 rows 25, 26, 29, the research's §4.5 and its #1 rank, the pool, the placeholder, no new cards, and the dates", /§4\.1b/.test(BLK)&&/§6\.7/.test(BLK)&&/§13 rows\s*\n?\/\/ 25, 26, 29|§13 rows 25, 26, 29/.test(BLK)&&/RESEARCH_envirothon_skills_2026-10-28\.md §4\.5/.test(BLK)&&/ranked #1/.test(BLK)&&/THE PICTURE comes from CPPHOTOS/.test(BLK)&&/Photo needed/.test(BLK)&&/NO NEW CARDS/.test(BLK)&&/2026-10-28/.test(BLK)&&/2026-10-29/.test(BLK));
  ok("the block only declares, plus its one registration through CPSKILL's extension point", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)||/^if\(typeof cpSkillTypeAdd==="function"\) cpSkillTypeAdd\("id",CPIG_ID\);/.test(l)));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing and reads nothing: no set / update / remove / once / on, no envsWrite / envcWrite, no db or firebase", !/\.set\(|\.update\(|\.remove\(|\.once\(|\.on\(|envsWrite|envcWrite|\bdb\b|firebase/.test(code));
  ok("nothing hot-linked here: no http(s) URL in the block's code but the SVG namespace of the demo drawings; pictures only through cpPhotos", !/https?:\/\//.test(code.replace(/http:\/\/www\.w3\.org\/2000\/svg/g,""))&&/cpPhotos\(it,tags\)/.test(code));
  ok("no Howe kid name as a code literal; no 'Station' in its strings; no 🔀 in index.html", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/["'][^"'\n]*\bStations?\b/.test(code)&&src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🧰 CPITEMGEAR/.test(l)&&!/^\s*\/\//.test(l));
  ok("two hook lines outside the block, each tagged 🧰 CPITEMGEAR and guarded: envsDemoStart (after CPSKILL's seed) and CPSKILL's type note", hooks.length===2&&
    /  try\{ if\(typeof cpSkillDemoSeed==="function"\) cpSkillDemoSeed\(data\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof cpGearDemoSeed==="function"\) cpGearDemoSeed\(data\); \}catch\(e\)\{\}   \/\/ 🧰 CPITEMGEAR/.test(src)&&
    /const T=CPSK_TYPES\[s\.type\]; if\(!s\.hide&&T&&typeof T\.note==="function"\)\{ try\{ h\+=T\.note\(s\)\|\|""; \}catch\(e\)\{\} \} \}\);   \/\/ 🧰 CPITEMGEAR/.test(SKL), hooks.map(l=>l.trim().slice(0,80)));
  ok("…the type note line sits inside cpSkillSetupHtml (one per skill row)", /function cpSkillSetupHtml\(\)\{[\s\S]*?T\.note\(s\)[\s\S]*?\n\}/.test(SKL)); }

console.log("\n── the data: the research's two lists, in the unit ──");
{ const RF=[/d-tape/,/biltmore stick/,/clinometer/,/abney level/,/increment borer/,/wedge prism/,/caliper/,/chain/], RA=[/secchi disc/,/^d-net/,/kick net/,/surber sampler/,/eckman dredge/,/seine/,/dip net/,/plankton net/,/water sampl/,/flow meter/];
  const fn=FOR?FOR.data.items.map(x=>nm(x.name)):[], an=AQ?AQ.data.items.map(x=>nm(x.name)):[];
  ok("two skills in units/nc_envirothon/unit.json: forestry.tools (Forestry) and aquatics.gear (Aquatics), type id, kind gear, core", !!FOR&&!!AQ&&SK.filter(s=>s.data&&s.data.kind==="gear").length===2&&FOR.section==="forestry"&&AQ.section==="aquatics"&&[FOR,AQ].every(s=>s.type==="id"&&s.core===true&&s.data.kind==="gear"));
  ok("Forestry tools = the research's 8 (d-tape, Biltmore stick, clinometer, Abney level, increment borer, wedge prism, calipers, chain/tape)", fn.length===RF.length&&RF.every(re=>fn.filter(n=>re.test(n)).length===1), fn);
  ok("Sampling gear = the research's 10 (Secchi disc, D-net, kick net, Surber sampler, Eckman dredge, seine, dip net, plankton net, water sampling bottle, flow meter)", an.length===RA.length&&RA.every(re=>an.filter(n=>re.test(n)).length===1), an);
  ok("every item has a use, a source, look-alikes from its own skill", [FOR,AQ].every(s=>s.data.items.every(x=>x.use&&x.src&&Array.isArray(x.like)&&x.like.length&&x.like.every(l=>s.data.items.some(y=>nm(y.name)===nm(l)&&y!==x)))));
  const cardFronts=new Set([].concat(...LIB.unit.decks.map(d=>d.cards.map(c=>nm(c.name)))));
  const tools=FOR.data.items.map(x=>nm(x.item||x.name));
  ok("each forestry tool's photo key is the front of its own card (a photo added on that card in 📚 Cards is found by the skill)", tools.every(t=>cardFronts.has(t)), tools.filter(t=>!cardFronts.has(t)));
  const ek=AQ.data.items.find(x=>/eckman/i.test(x.name)), q16=LIB.tests.aquatics.post.items.find(i=>"post-"+i.n==="post-16");
  ok("the aquatics skill links the one gear question in the app's forms (post-16, the Eckman dredge), and its use says bottom mud as the 2022 key does", AQ.tests.join()==="post-16"&&/Eckman/i.test(q16.q)&&/bottom mud/.test(q16.choices[q16.ans])&&/bottom mud/.test(ek.use));
  const chk=[].concat(FOR.data.items,AQ.data.items).filter(x=>x.check);
  ok("an item whose use isn't in the study documents yet says so (check:true, its source names the handout)", chk.length>0&&chk.every(x=>/Aquatic Sampling Equipment handout|Equipment List/.test(x.src))); }

console.log("\n── compile_unit.js rule 8, COUNTS.json, the catalog entry ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("the unit compiles and is current (--check)", r.ok, r.err);
  ok("COUNTS.json counts each skill's items from unit.json", JSON.stringify(COUNTS.skills)===JSON.stringify(Object.fromEntries(SK.map(s=>[s.key,{section:s.section,type:s.type,core:s.core===true,items:(s.data.items||s.data.classes||s.data.parts||s.data.reads||[]).length}]))));   // 📐 CPITEMTRIANGLE: a chart counts its classes · 🏷 CPITEMLABEL: a diagram its parts
  ok("index.json (the catalog entry) and CPU_UNITS carry the skills exactly as unit.json has them", JSON.stringify(INDEX.skills)===JSON.stringify(SK.map(C.skillEntry))&&JSON.stringify(r.index.skills)===JSON.stringify(INDEX.skills)&&new RegExp('"skills":\\[\\{"key":"forestry\\.tools"').test(src));
  const gaps=C.gearPhotoGaps(REPO,SK), have=new Set(Object.keys(PICS).map(k=>nm(k.split(" · ")[0]).trim())), want=[].concat(...SK.map(s=>(s.data.items||[]).filter(x=>!have.has(nm(x.item||x.name))).map(x=>x.name)));
  ok("the no-photo list comes from envirothon/pics/index.json, and compile prints it as a note", JSON.stringify(gaps.map(g=>g.name))===JSON.stringify(want)&&(want.length?r.warn.some(w=>w.indexOf(want.length+" gear item")===0&&want.every(n=>w.indexOf(n)>0)):!r.warn.some(w=>/gear item/.test(w))), r.warn);
  const secs=UNIT.sections.map(s=>s.key), decks=[{key:"Forestry · Terms",section:"forestry",cards:[{name:"Caliper",order:234}]}], tests={sections:{aquatics:{post:{items:[{id:"post-16"}]}}}};
  const g=o=>Object.assign({key:"aquatics.gear",section:"aquatics",type:"id",label:"Gear",core:true,steps:["a"],tests:["post-16"],data:{kind:"gear",items:[1,2,3,4].map(i=>({name:"N"+i,use:"U"+i,src:"S",like:["N"+(i%4+1)]}))}},o);
  const E=o=>C.checkSkills([g(o)],secs,decks,tests), Es=L=>C.checkSkills(L,secs,decks,tests);
  ok("a good gear skill passes", E({}).length===0, E({}));
  ok("rule 8 catches: a bad key · a key twice · a section not the unit's · an unknown type · no label · core not a boolean · steps not words",
    /key must be/.test(E({key:"Bad Key"}).join())&&/key twice/.test(Es([g({}),g({})]).join())&&/isn't the unit's/.test(E({section:"nope"}).join())&&/type “essay”/.test(E({type:"essay"}).join())&&/no label/.test(E({label:""}).join())&&/core must be/.test(E({core:"yes"}).join())&&/steps must be/.test(E({steps:[1]}).join()));
  ok("…a test id not in that section's forms · a replaces that is no card (a real one passes)", /not in the aquatics forms/.test(E({tests:["post-99"]}).join())&&/which is no card/.test(E({replaces:["Forestry · Terms#o9999"]}).join())&&E({replaces:["Forestry · Terms#o234"]}).length===0);
  const items=f=>{ const it=[1,2,3,4].map(i=>({name:"N"+i,use:"U"+i,src:"S",like:["N"+(i%4+1)]})); f(it); return {data:{kind:"gear",items:it}}; };
  ok("…a gear skill: not type id · fewer than 4 items · a name twice · no use · no source · two items with one use · a look-alike that isn't another item",
    /is type id/.test(E({type:"chart"}).join())&&/4 or more items/.test(E(items(it=>it.pop())).join())&&/name twice/.test(E(items(it=>{ it[1].name="n1"; })).join())&&/has no use/.test(E(items(it=>{ it[0].use=""; })).join())&&/has no source/.test(E(items(it=>{ delete it[0].src; })).join())&&/share the use/.test(E(items(it=>{ it[1].use="U1"; })).join())&&/is not another item/.test(E(items(it=>{ it[0].like=["N1"]; })).join())&&/is not another item/.test(E(items(it=>{ it[0].like=["Zebra"]; })).join()));
  ok("a unit with no skills compiles as before (no skills key in the entry or COUNTS)", !("skills" in C.makeIndex({id:"x",title:"X",sections:[]},[],null))&&!("skills" in C.makeCounts({id:"x",sections:[]},[],null,null))&&C.checkSkills(undefined,secs,decks,tests).length===0); }

console.log("\n── the maker, over many seeds ──");
{ const w=W(), S=w.S, I=w.I, M=I.CPIG_ID, sk=Object.assign({fb:FBA},AQ), items=AQ.data.items;
  ok("registered as the engine's `id` type (through cpSkillTypeAdd), with no earlier id maker to keep", S.CPSK_TYPES.id===M&&I.CPIG_PREV_ID===null);
  let bad=null, seenItems={};
  for(let seed=1;seed<=400&&!bad;seed++){ const p=M.make(sk,S.cpskRng(seed)), st=p.steps, x=p.item; seenItems[x.name]=1;
    const names=p.photo?st[0].choices:null, uses=st[st.length-1].choices, set=uses.map(u=>items.find(y=>y.use===u)), like=x.like.map(l=>items.find(y=>nm(y.name)===nm(l)));
    if(p.photo) bad=["no photo in the pool → no name step",seed];
    else if(st.length!==1||st[0].id!=="use"||st[0].kind!=="pick") bad=["one step: the use",seed];
    else if(uses.length!==4||new Set(uses).size!==4||uses.indexOf(x.use)<0||st[0].answer!==x.use) bad=["4 different uses, the item's among them",seed];
    else if(set.some(y=>!y)) bad=["every choice is an item's use",seed];
    else if(!like.slice(0,3).every(y=>set.indexOf(y)>=0)) bad=["its look-alikes come first",seed,x.name]; }
  ok("no photo in the pool: one step, 'What is it for?', 4 different uses from the skill's own items, the item's look-alikes among them", !bad, bad);
  ok("problems vary: every item comes up across seeds", items.every(x=>seenItems[x.name]), Object.keys(seenItems).length);
  // a class photo for every item (the demo's layer shape), so every problem has a picture
  const d=demo("kid"), D=d.S, DI=d.I, L=d.P._cpph.L[CID]||(d.P._cpph.L[CID]={});
  items.forEach((x,i)=>{ L[d.P.cpphKey(x.item||x.name)]={["ptest"+i]:{url:"data:image/svg+xml;charset=utf-8,%3Csvg%3E"+i+"%3C%2Fsvg%3E",credit:"Test credit "+i,lic:"own",tags:{gear:true},item:x.name,how:"pool",by:"t",ts:1}}; });
  d.P._cpph.ver++; d.P._cpph.rmemo=null;
  bad=null; for(let seed=1;seed<=200&&!bad;seed++){ const p=DI.CPIG_ID.make(sk,D.cpskRng(seed)), st=p.steps, x=p.item;
    if(!p.photo) bad=["a photo",seed]; else if(st.length!==2||st[0].id!=="name"||st[1].id!=="use"||st[0].label!=="What is it?"||st[1].label!=="What is it for?") bad=["two steps: name, use",seed];
    else if(st[0].answer!==x.name||st[1].answer!==x.use||st[0].choices.length!==4||new Set(st[0].choices).size!==4) bad=["the answers, 4 names",seed];
    else if(JSON.stringify(st[0].choices.map(n=>items.find(y=>y.name===n).use))!==JSON.stringify(st[1].choices)) bad=["the same 4 items, in the same order, for name and use",seed]; }
  ok("with a photo: two steps — 'What is it?' (4 names) then 'What is it for?' (the same 4 items' uses, same order)", !bad, bad);
  const p=DI.CPIG_ID.make(sk,D.cpskRng(5)), wrongN=p.steps[0].choices.find(c=>c!==p.steps[0].answer), slug=DI.cpigSlug(p.item.name);
  ok("the miss codes: name:<item> / use:<item>", DI.CPIG_ID.miss(p.steps[0],wrongN,p)==="name:"+slug&&DI.CPIG_ID.miss(p.steps[1],"x",p)==="use:"+slug);
  ok("…and in words for the teacher ('what the Eckman dredge is for')", D.cpSkillMissLabel(sk,"use:eckman-dredge")==="what the Eckman dredge is for"&&D.cpSkillMissLabel(sk,"name:d-net")==="telling the D-net by its picture"&&D.cpSkillMissLabel(sk,"weird")==="weird");
  ok("a skill of another kind is not this maker's (no earlier id maker: no problem)", M.make({type:"id",data:{kind:"flash"}},S.cpskRng(1))===null&&M.html({},{})===""&&M.note({data:{}})===""&&M.missLabel("use:x",{data:{}})===null);
  ok("the slug is safe as a database key (no . # $ [ ] /)", items.every(x=>/^[a-z0-9-]+$/.test(DI.cpigSlug(x.name)))); }

console.log("\n── a sitting's order: no item twice, the missed ones first ──");
{ const d=demo("kid"), S=d.S, I=d.I, sk=S.cpSkillList().find(s=>s.fb===FBA), items=AQ.data.items;
  // one try, right: a worked example is stepped through to "Got it"; any other stage is picked and checked
  const doTry=()=>{ const r=S._cpsk.run; if(r.stage==="shown"){ const n0=r.tries.length; for(let i=0;i<10&&r.tries.length===n0;i++) S.cpSkillStep(); return; } r.prob.steps.forEach((st,i)=>{ if(i>=r.from) S.cpSkillPick(i,st.answer); }); S.cpSkillCheckTry(); S.cpSkillNextTry(); };
  const names=[]; S.cpSkillOpen(K,FBA,99); for(let t=0;t<S.CPSK_SITTING;t++){ const r=S._cpsk.run; names.push(r.prob.item.name); doTry(); }
  ok("6 tries, 6 different items (the order is seeded by the sitting)", names.length===6&&new Set(names).size===6, names);
  S.cpSkillQuit(); S.cpSkillOpen(K,FBA,99); const again=S._cpsk.run.prob.item.name; S._cpsk.run=null;
  const st=d.masteryData.maya_skills.nc_envirothon[FBA]; st.miss={"use:eckman-dredge":3,"name:kick-net":1,"use:seine":1};
  S.cpSkillOpen(K,FBA,99); const order=S._cpsk.run.cpig.order.map(i=>items[i].name);
  ok("the items she missed come first, most-missed first (Eckman dredge 3, then Kick net and Seine)", order[0]==="Eckman dredge"&&order.slice(1,3).sort().join()==="Kick net,Seine"&&new Set(order).size===items.length, order);
  ok("the same sitting seed (and no misses) gives the same order", again===names[0], [again,names[0]]); S._cpsk.run=null; }

console.log("\n── the picture: from the pool by item + tag; the placeholder ──");
{ const d=demo("kid"), S=d.S, I=d.I, P=d.P, sk=Object.assign({fb:FBF},FOR);
  const need=I.cpGearNeedPhoto(sk).map(x=>x.name), drawn=FOR.data.items.filter(x=>I.CPIG_DEMO_SVG[x.name]).map(x=>x.name);
  ok("in the demo, the forestry items with a demo drawing have a picture and every other needs one", drawn.length>0&&need.length===FOR.data.items.length-drawn.length&&drawn.every(n=>need.indexOf(n)<0), need);
  const x=FOR.data.items.find(y=>need.indexOf(y.name)>=0), k=P.cpphKey(x.item||x.name), L=P._cpph.L[CID];
  L[k]={ptrack:{url:"data:image/svg+xml;charset=utf-8,%3Csvg%3Et%3C%2Fsvg%3E",credit:"c",lic:"own",tags:{track:true},item:x.name,how:"pool",by:"t",ts:1}}; P._cpph.ver++; P._cpph.rmemo=null;
  ok("a photo tagged only 'track' is never used for gear", I.cpigPhotos(sk,x).length===0);
  L[k].plive={url:"data:image/svg+xml;charset=utf-8,%3Csvg%3El%3C%2Fsvg%3E",credit:"Untagged credit",lic:"own",tags:{live:true},item:x.name,how:"pool",by:"t",ts:2}; P._cpph.ver++; P._cpph.rmemo=null;
  ok("an item's photo without the gear tag still counts (a teacher's untagged photo) — never a track or skull", I.cpigPhotos(sk,x).map(p=>p.id).join()==="plive");
  L[k].pgear={url:"data:image/svg+xml;charset=utf-8,%3Csvg%3Eg%3C%2Fsvg%3E",credit:"Gear credit",lic:"own",tags:{gear:true},item:x.name,how:"pool",by:"t",ts:3}; P._cpph.ver++; P._cpph.rmemo=null;
  ok("with a gear-tagged photo, the lookup is by item + tag (cpPhotos(item, tags))", I.cpigPhotos(sk,x).map(p=>p.id).join()==="pgear"&&JSON.stringify(I.CPIG_TAGS)==='["gear","drawing"]');
  delete L[k]; P._cpph.ver++; P._cpph.rmemo=null;
  const p0={gear:true,item:x,photo:null,steps:[{id:"use",label:"What is it for?",kind:"pick",choices:[],answer:x.use}]}, h0=I.CPIG_ID.html(p0,sk);
  ok("no photo: the clear '📷 Photo needed' box, with the item's name and why only the use is asked", /📷/.test(h0)&&/Photo needed/.test(h0)&&h0.indexOf(x.name.replace(/&/g,"&amp;"))>0&&/asks only what it is for/.test(h0)&&!/<img/.test(h0));
  const ph=I.cpigPhotos(sk,FOR.data.items.find(y=>y.name===drawn[0]))[0], p1={gear:true,item:FOR.data.items.find(y=>y.name===drawn[0]),photo:ph,steps:[{id:"name"},{id:"use"}]};
  S._cpsk.run={sk,stage:"solo",from:0,checked:null}; const h1=I.CPIG_ID.html(p1,sk);
  ok("with a photo: the picture from the pool, its alt never names the item, and the credit waits until the name is out", /<img src="data:image\/svg\+xml/.test(h1)&&/alt="The picture to name"/.test(h1)&&h1.indexOf(drawn[0])<0&&!/Picture: /.test(h1));
  S._cpsk.run.checked={ok:true}; ok("…after Check, the credit shows", /Picture: Demo drawing — not a photo/.test(I.CPIG_ID.html(p1,sk))); S._cpsk.run=null;
  const hp=I.CPIG_ID.help(p1,sk); ok("the help is the gear list (every item and what it's for)", /The gear list/.test(hp)&&FOR.data.items.every(y=>hp.indexOf(y.name.replace(/&/g,"&amp;"))>0)); }

console.log("\n── the demo kid: 👀 → ✍️ → 💪 on a gear item ──");
{ // a sitting seed whose 3rd try (the first ✍️) is an item with a picture, so the name is given and the use is hers
  let seed=0, d=null, S=null; for(let s=1;s<300;s++){ const t=demo("kid"); const order=(()=>{ t.S.cpSkillOpen(K,FBF,s); const r=t.S._cpsk.run, o=r.cpig.order; t.S._cpsk.run=null; return o; })();
    if(t.I.CPIG_DEMO_SVG[FOR.data.items[order[2]].name]&&!t.I.CPIG_DEMO_SVG[FOR.data.items[order[4]].name]){ seed=s; d=t; S=t.S; t.renderAll(); break; } }
  const run=()=>S._cpsk.run;
  ok("the Skills door lists the unit's two gear skills beside the sample (Forestry first, the section order)", /🧩 Skills/.test(d.G.content)&&d.G.content.indexOf("Forestry tools by picture")>0&&d.G.content.indexOf("Sampling gear by picture")>d.G.content.indexOf("Forestry tools by picture")&&/Biotic index/.test(d.G.content), seed);
  ok("her skills: forestry.tools, aquatics.biotic_index, aquatics.gear (from the catalog entry, beside the demo's sample)", S.cpSkillsFor(K).map(s=>s.fb).join()==="forestry:tools,aquatics:biotic_index,aquatics:gear"&&S._cpsk.demo.nc_envirothon.length===3);
  S.cpSkillOpen(K,FBF,seed); const n1=run().prob.steps.length;
  ok("Go: 👀 Watch it — the item, then each step lit with its answer", /👀 Watch it/.test(d.G.content)&&/🧰 /.test(d.G.content)&&/What is it for\?/.test(d.G.content));
  for(let i=0;i<=n1;i++) S.cpSkillStep(); const n2=run().prob.steps.length; for(let i=0;i<=n2;i++) S.cpSkillStep();
  const r3=run();
  ok("after two worked examples: ✍️ Finish it on a pictured tool — the picture shows, 'What is it?' is given (lit), she picks what it's for", r3.stage==="faded"&&!!r3.prob.photo&&r3.prob.steps.length===2&&r3.from===1&&/<img src="data:image\/svg\+xml/.test(d.G.content)&&d.G.content.indexOf(r3.prob.item.name)>0&&/Do the last step/.test(d.G.content));
  const pick=(ok,i)=>{ const r=run(), st=r.prob.steps[i]; S.cpSkillPick(i,ok?st.answer:st.choices.find(c=>c!==st.answer)); };
  pick(true,1); S.cpSkillCheckTry(); ok("a right ✍️ try: ✓ All right!; the next one hands over the name too", run().checked.ok&&/All right!/.test(d.G.content)&&run().st.fade===2);
  S.cpSkillNextTry(); const r4=run();
  ok("the next ✍️ try: she does every step of it", r4.stage==="faded"&&r4.from===0);
  r4.prob.steps.forEach((s,i)=>pick(true,i)); S.cpSkillCheckTry(); ok("two right in a row: up to 💪 on your own", run().st.stage==="solo"&&/Next: on your own!/.test(d.G.content));
  S.cpSkillNextTry(); const r5=run();
  ok("💪 on your own (this item has no picture yet): the '📷 Photo needed' box and only 'What is it for?'; the list behind 'Show the chart'", r5.stage==="solo"&&r5.from===0&&!r5.prob.photo&&r5.prob.steps.length===1&&/Photo needed/.test(d.G.content)&&/Show the chart/.test(d.G.content));
  pick(false,0); S.cpSkillCheckTry(); const slug=d.I.cpigSlug(r5.prob.item.name);
  ok("a miss is saved as the step and the item ('use:<item>') and said in words", run().checked.miss==="use:"+slug&&d.G.content.indexOf("Missed at step 1: what the "+r5.prob.item.name)>0);
  const before=d._envs.writes.length; S.cpSkillNextTry(); run().prob.steps.forEach((s,i)=>pick(true,i)); S.cpSkillCheckTry(); S.cpSkillNextTry();
  const W1=d._envs.writes.slice(before), w1=W1[0]||{};
  ok("the 6th try ends the sitting: ONE write, an update on mastery with maya_skills/nc_envirothon/forestry:tools and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&Object.keys(w1.val).some(k=>k==="maya_skills/nc_envirothon/"+FBF)&&Object.keys(w1.val).some(k=>/^studyLog\/maya\/skills\/\d{8}$/.test(k))&&Object.keys(w1.val).length===2, W1.map(x=>[x.op,x.path,Object.keys(x.val||{})]));
  const st=w1.val["maya_skills/nc_envirothon/"+FBF];
  ok("the state: on your own, the miss counted by its code", st.stage==="solo"&&st.miss["use:"+slug]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo");
  const sum=S.cpSkillSummary(K,d.masteryData,T0);
  ok("summary.skills: Forestry 0 of 1 (stage solo, the miss code), Aquatics 0 of 2", sum.forestry.total===1&&sum.forestry.learned===0&&sum.forestry.stage[FBF]==="solo"&&sum.forestry.miss[FBF]["use:"+slug]===1&&sum.aquatics.total===2&&sum.aquatics.stage[FBA]==="new");
  ok("the 'skills learned' line (📅 Pace and the station rows) counts it: 'skills learned 0 of 1' for Forestry, '0 of 2' for Aquatics", S.cpSkillPaceLine({skills:sum},"forestry")==="skills learned 0 of 1"&&S.cpSkillPaceLine({skills:sum},"aquatics")==="skills learned 0 of 2");
  S.cpSkillQuit(); d.envsView("scores"); ok("Scores: '🧩 skills learned 0 of 1' on Forestry and '0 of 2' on Aquatics", /🧩 skills learned 0 of 1/.test(d.G.content)&&/🧩 skills learned 0 of 2/.test(d.G.content)); }

console.log("\n── the teacher: the photo note, the classmates' counts, the most-missed step ──");
{ const d=demo("teacher"), S=d.S, I=d.I; d.envcView("setup");
  const drawn=it=>it.filter(x=>I.CPIG_DEMO_SVG[x.name]), fN=FOR.data.items.length, aN=AQ.data.items.length, fD=drawn(FOR.data.items), aD=drawn(AQ.data.items);
  ok("🏫 Class setup ▸ 🧩 Skills: both gear skills, type id, core", /Forestry tools by picture/.test(d.G.content)&&/Sampling gear by picture/.test(d.G.content)&&/id · core/.test(d.G.content));
  ok("…under each, how many items have a photo and which still need one (from the pool)", d.G.content.indexOf("🖼 "+fD.length+" of "+fN+" items have a photo · needs a photo: ")>0&&d.G.content.indexOf("🖼 "+aD.length+" of "+aN+" items have a photo · needs a photo: ")>0&&FOR.data.items.filter(x=>fD.indexOf(x)<0).every(x=>d.G.content.indexOf(x.name.replace(/&/g,"&amp;"))>0)&&/Until it has one, an item asks only what it is for/.test(d.G.content));
  const studs=d.envcStudents(), withS=studs.filter(x=>x.summary);
  ok("every classmate's summary counts the gear skills (Forestry 1, Aquatics 2 with the sample)", withS.length>0&&withS.every(x=>x.summary.skills.forestry.total===1&&x.summary.skills.aquatics.total===2&&x.summary.skills.forestry.stage[FBF]));
  const cal=studs.find(x=>x.sid==="walker_caleb");
  ok("📅 Pace's line reads the summaries: Caleb 'skills learned 1 of 1' in Forestry", S.cpSkillPaceLine(cal.summary,"forestry")==="skills learned 1 of 1");
  const rows=S.cpSkillFoldRows(studs), ag=rows.find(r=>r.sk.fb===FBA);
  ok("the Skills fold ranks three skills; the gear's most-missed step in words: 'what the Eckman dredge is for (3)'", rows.length===3&&ag.top==="use:eckman-dredge"&&ag.topN===3&&/Most missed step: what the Eckman dredge is for \(3\)/.test(d.G.content));
  ok("the demo writes nothing (the seed is in memory)", d._envs.writes.length===0); }

console.log("\n── a live kid: the unit's skills from the catalog entry ──");
{ const w=W({w:{fam:FAM,remote:{["classSkills/"+CID]:{}}}}), S=w.S; w.initFb();
  Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Soils and Land Use · Terms":true}};
  const gearOnly=L=>L.filter(s=>s.data&&s.data.kind==="gear");   // 📐 CPITEMTRIANGLE: the unit has other skills too (the texture triangle)
  ok("no demo list: the skills are CPU_UNITS' (the compiled unit) — Forestry tools and Sampling gear", gearOnly(S.cpSkillList()).map(s=>s.fb).join()==="forestry:tools,aquatics:gear"&&gearOnly(S.cpSkillsFor(K)).length===2);
  ok("the door shows them on her study page", /Forestry tools by picture/.test(S.cpSkillStudyWrap(K,"BODY"))&&/Sampling gear by picture/.test(S.cpSkillStudyWrap(K,"BODY")));
  ok("no picture in the pool yet (the repo set has no gear) → every live problem asks what it is for, with the placeholder", (()=>{ S.cpSkillOpen(K,FBA,11); const r=S._cpsk.run, okk=!r.prob.photo&&r.prob.steps.length===1&&/Photo needed/.test(w.G.content||S.cpSkillStudyWrap(K,"")); S._cpsk.run=null; return okk; })());
  ok("cpGearDemoSeed does nothing off the demo", w.I.cpGearDemoSeed({cid:CID,students:{}})===false); }

console.log("\n── Howe and Lincoln: nothing on ──");
{ const w=W({w:{fam:HOWE}}), I=w.I, S=w.S;
  ok("cpigOn false; no skills listed; the demo seed refuses; Lincoln's summary has no skills (cpSkillSummary null)", I.cpigOn()===false&&S.cpSkillList().length===0&&I.cpGearDemoSeed({cid:"x",students:{}})===false&&S.cpSkillSummary("lincoln",{lincoln_skills:{nc_envirothon:{[FBF]:{learned:true}}}},T0)===null);
  ok("no read, write, listener or element", w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0&&w.G.created.length===0);
  const a=W({w:{fam:HOWE}}), b=W({gear:false,w:{fam:HOWE}});
  ok("the world without this block boots the same for Howe (nothing created, read or written either way)", JSON.stringify([a.G.reads,a.G.writes,a.G.created.length])===JSON.stringify([b.G.reads,b.G.writes,b.G.created.length])&&b.I===null); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
