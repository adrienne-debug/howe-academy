/*
 * Node tests — 🪲 CPITEMBIOTIC, the biotic index worksheet: the second real skill item type, the full `sheet` (DESIGN_class_platform_2026-10-28.md
 * §4.1b, §6.7, §13 rows 25–27; RESEARCH_envirothon_skills_2026-10-28.md §4.3, ranked #2 in §5). What was found in a stream → name the one in
 * the picture → sort each kind into its group → # found per group (kinds, not animals) → × 3 / 2 / 1, added → the rating, through the skill
 * engine's three stages (shown → faded → on your own).
 *   · Where the block sits (right after CPITEMGEAR_END), how it hooks (CPSKILL's extension point, one guarded demo line), what it never does.
 *   · The data: units/nc_envirothon/unit.json's skill against the unit's own cards (the 29 "· pollution tolerance group" cards, the × and the
 *     ranges cards), the Area 8 question it links, the cards it can replace; compile_unit.js rule 8 for a tally sheet; COUNTS.json; the
 *     "Make the Poor card core" change.
 *   · The maker over many seeds, both forms (2026's list, 2022's counts + picture): every answer recomputed from the problem, every rating
 *     comes up, a sitting deals every rating and never the same counts twice; the miss codes and their words.
 *   · The pictures: from the CPPHOTOS pool by item + tag only; the 📷 placeholder; a kind with no photo is never the picture question.
 *   · The demo kid: 👀 → ✍️ (the rating, then the index too) → 💪, ONE write, summary.skills; the teacher: the photo note, the most-missed
 *     step in words, 📅 Pace's "skills learned" line. A live kid gets it from the catalog entry; Howe and Lincoln: nothing on.
 * Every count comes from the unit's data, never typed in.                                              run: node test_cp_item_biotic.js
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
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"), GEAR=cut("// CPITEMGEAR_START","// CPITEMGEAR_END"), BLK=cut("// CPITEMBIOTIC_START","// CPITEMBIOTIC_END"), PACE=cut("// CPPACE_START","// CPPACE_END");
const XS="\nfunction envPicsIndex(){ return G.pics||null; }\nG.sk={ CPSK_TYPES, CPSK_SITTING, CPSK_SHEET, CPSK_DEMO_SKILL, _cpsk, cpskRng, cpskFb, cpskStepOk, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillInput, cpSkillHelp, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillSummary, cpSkillPaceLine, cpSkillFoldRows, cpSkillMissLabel, cpSkillSetupHtml, cpSkillStudyWrap };\nG.ph={ _cpph, cpphKey, cpPhotos };\nG.pace={ cpPaceFlush, cppOpen };";
const XB="\nG.ib={ CPIB_SHEET, CPIB_TAGS, CPIB_PREV_SHEET, cpibOn, cpibMine, cpibSlug, cpibItems, cpibGroups, cpibRatings, cpibPhotos, cpBioticNeedPhoto, cpibSet, cpBioticDemoSeed };";
// biotic false = the same world without this block (the control)
function W(o){ o=o||{}; const b=o.biotic!==false; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+SKL+"\n"+GEAR+"\n"+(b?BLK:"")+"\n"+PACE+XS+(b?XB:"\nG.ib=null;")},o.w||{})); w.G.pics=PICS; w.S=w.G.sk; w.P=w.G.ph; w.I=w.G.ib; w.PC=w.G.pace; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", T0=Date.UTC(2026,9,28,15,0,0);
const BI=(UNIT.skills||[]).find(s=>s.data&&s.data.kind==="tally"), FB=BI?BI.key.replace(/\./g,":"):"";
const ITEMS=BI?BI.data.items:[], GROUPS=BI?BI.data.groups:[], RATINGS=BI?BI.data.ratings.slice().sort((a,b)=>b.min-a.min):[];
const nm=s=>String(s).toLowerCase(), dash=s=>String(s).replace(/[–—]/g,"-").replace(/\s+/g," ").replace(/ ?- ?/g,"-").trim().toLowerCase();
const card=(deck,o)=>LIB.unit.decks.find(d=>d.key===deck).cards.find(c=>c.order===o);
const AF="Aquatic Ecology · Facts", AID="Aquatic Ecology · ID";
// recompute a problem's answers from what it shows (rows / given + the picture), not from its steps
function expect(p){ const G=p.groups, cnt=p.form==="list"?G.map(g=>p.rows.filter(r=>r.g===g.key).length):G.map((g,i)=>p.given[i]+(p.pic.group===g.key?1:0));
  const total=G.reduce((a,g,i)=>a+cnt[i]*g.weight,0), band=RATINGS.find(r=>total>=r.min); return {cnt,total,band}; }

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPITEMBIOTIC_START"), b=src.indexOf("// CPITEMBIOTIC_END"), e=src.indexOf("// CPITEMGEAR_END\n");
  ok("CPITEMBIOTIC once, IMMEDIATELY after CPITEMGEAR_END", a>0&&b>a&&src.indexOf("// CPITEMBIOTIC_START",a+1)<0&&src.indexOf("// CPITEMBIOTIC_END",b+1)<0&&e+"// CPITEMGEAR_END\n".length===a);
  ok("the header names §4.1b, §6.7, §13 rows 25–27, the research's §4.3 and its #2 rank, the Area 8 questions, the pool, the placeholder, the sample it replaces, and the dates",
    /§4\.1b/.test(BLK)&&/§6\.7/.test(BLK)&&/§13 rows 25–27/.test(BLK)&&/RESEARCH_envirothon_skills_2026-10-28\.md §4\.3/.test(BLK)&&/ranked #2/.test(BLK)&&/2022 Aquatics Q17–20/.test(BLK)&&/2026 Aquatics Q13–15/.test(BLK)&&/THE PICTURES come from CPPHOTOS/.test(BLK)&&/placeholder/.test(BLK)&&/IT REPLACES the CPSKILL sample/.test(BLK)&&/2026-10-28/.test(BLK)&&/2026-10-29/.test(BLK));
  ok("the block only declares, plus its one registration through CPSKILL's extension point", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)||/^if\(typeof cpSkillTypeAdd==="function"\) cpSkillTypeAdd\("sheet",CPIB_SHEET\);/.test(l)));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing and reads nothing: no set / update / remove / once / on, no envsWrite / envcWrite, no db or firebase", !/\.set\(|\.update\(|\.remove\(|\.once\(|\.on\(|envsWrite|envcWrite|\bdb\b|firebase/.test(code));
  ok("nothing hot-linked: no http(s) URL in the block's code; pictures only through cpPhotos", !/https?:\/\//.test(code)&&/cpPhotos\(it,tags\)/.test(code));
  ok("no Howe kid name as a code literal; no 'Station' in its strings; no 🔀 in index.html", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/["'][^"'\n]*\bStations?\b/.test(code)&&src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🪲 CPITEMBIOTIC/.test(l)&&!/^\s*\/\//.test(l));
  ok("one hook line outside the block, tagged 🪲 CPITEMBIOTIC and guarded: envsDemoStart, after the gear seed and masteryKid (other skill seeds may sit between: wave-8 merge 2026-10-29)", hooks.length===1&&
    /  try\{ if\(typeof cpGearDemoSeed==="function"\) cpGearDemoSeed\(data\); \}catch\(e\)\{\}[^\n]*\n(?:  try\{ if\(typeof cp\w+DemoSeed[^\n]*\n){0,3}  try\{ masteryKid="maya"; \}catch\(e\)\{\}\n  try\{ if\(typeof cpBioticDemoSeed==="function"\) cpBioticDemoSeed\(data\); \}catch\(e\)\{\}   \/\/ 🪲 CPITEMBIOTIC/.test(src), hooks.map(l=>l.trim().slice(0,80)));
  ok("CPSKILL keeps its own sample and minimal maker (its tests use them); this block keeps that maker for any other sheet", /const CPSK_DEMO_SKILL=/.test(SKL)&&/cpSkillTypeAdd\("sheet",CPSK_SHEET\)/.test(SKL)&&/CPIB_PREV_SHEET=\(typeof CPSK_TYPES!=="undefined"&&CPSK_TYPES\.sheet\)/.test(BLK)); }

console.log("\n── the data: the unit's skill against the unit's own cards ──");
{ const tol=LIB.unit.decks.find(d=>d.key===AID).cards.filter(c=>/ · pollution tolerance group$/.test(c.name));
  const gnum=c=>+(/^Group (\d)/.exec(c.def)||[])[1], gkey=n=>GROUPS[n-1]&&GROUPS[n-1].key;
  ok("one tally worksheet in units/nc_envirothon/unit.json: aquatics.biotic_index, Aquatics, type sheet, core, labelled 'Biotic index'", !!BI&&BI.key==="aquatics.biotic_index"&&BI.section==="aquatics"&&BI.type==="sheet"&&BI.core===true&&BI.label==="Biotic index"&&UNIT.skills.filter(s=>s.data&&s.data.kind==="tally").length===1);
  ok("its kinds are exactly the unit's '· pollution tolerance group' cards: the same names (the cards' item, so photos are found), each in the card's group", tol.length===ITEMS.length&&tol.every(c=>{ const x=ITEMS.find(y=>y.name===c.item); return x&&x.group===gkey(gnum(c))&&x.src.indexOf(c.name)>0; }), [tol.length,ITEMS.length]);
  ok("three groups, sensitive → tolerant, weighted as the unit's cards say (Group 1 × "+card(AF,365).def+", Group 2 × "+card(AF,366).def+", Group 3 × "+card(AF,367).def+")", GROUPS.length===3&&GROUPS.map(g=>g.weight).join()===[365,366,367].map(o=>card(AF,o).def).join()&&/sensitive/.test(GROUPS[0].label)&&/moderately sensitive/.test(GROUPS[1].label)&&/tolerant/.test(GROUPS[2].label));
  const rc=[368,369,370,371].map(o=>card(AF,o).def);   // "23 or more", "17-22", "11-16", "0-10"
  ok("the ratings are the unit's range cards ("+rc.join(" · ")+")", RATINGS.length===4&&RATINGS.map(r=>r.label).join()==="Excellent,Good,Fair,Poor"&&RATINGS.every((r,i)=>parseInt(rc[i],10)===r.min&&dash(r.choice).indexOf(dash(rc[i]))===0));
  const q=LIB.tests.aquatics.pre.items.find(i=>"pre-"+i.n===BI.tests[0]);
  ok("it links the biotic-index chart question of the 2026 Area 8 check-in (pre-15), and the rating choices are worded as that form prints them", BI.tests.length===1&&!!q&&/biotic index rating/.test(q.q)&&q.choices.length===RATINGS.length&&q.choices.every((c,i)=>dash(c)===dash(RATINGS[i].choice)), BI.tests);
  const bf=LIB.unit.decks.find(d=>d.key===AF).cards.filter(c=>/biotic index/i.test(c.name)).map(c=>AF+"#o"+c.order), term=LIB.unit.decks.find(d=>d.key==="Aquatic Ecology · Terms").cards.find(c=>c.name==="Biotic index");
  ok("it can replace the "+bf.length+" biotic-index fact cards (the research's §8.1), and keeps the 'Biotic index' term card", JSON.stringify(BI.replaces)===JSON.stringify(bf)&&BI.replaces.indexOf("Aquatic Ecology · Terms#o"+term.order)<0);
  ok("every kind has a source and look-alikes that are other kinds of the skill", ITEMS.every(x=>x.src&&Array.isArray(x.like)&&x.like.length&&x.like.every(l=>ITEMS.some(y=>y!==x&&y.name===l))));
  ok("both Area 8 forms, a sample of 5–9 kinds as the research says, up to 4 animals of a kind", JSON.stringify(BI.data.forms)==='["list","chart"]'&&JSON.stringify(BI.data.pick)==="[5,9]"&&BI.data.chartPick[0]>=1&&BI.data.most===4); }

console.log("\n── make the Poor card core; compile_unit.js rule 8, COUNTS.json, the catalog entry ──");
{ const poor=LIB.unit.decks.find(d=>d.key===AF).cards.find(c=>/rates as Poor\?$/.test(c.name)), json=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));
  const jp=json.decks.find(d=>d.key===AF).cards.find(c=>c.order===poor.order);
  ok("the Poor 0–10 card is core in the unit data and in envirothon.js (the last biotic-index card that wasn't)", poor.core===true&&jp.core===true&&poor.def==="0-10"&&BI.replaces.every(r=>{ const o=+r.split("#o")[1]; return card(AF,o).core===true; }));
  const core=LIB.unit.decks.reduce((a,d)=>a+d.cards.filter(c=>c.core).length,0), aq=LIB.unit.decks.filter(d=>d.section==="aquatics"||/^Aquatic/.test(d.key)).reduce((a,d)=>a+d.cards.filter(c=>c.core).length,0);
  ok("COUNTS.json's core = the cards' ("+COUNTS.core+"), Aquatics "+COUNTS.sections.aquatics.core, COUNTS.core===core&&COUNTS.sections.aquatics.core===aq&&COUNTS.decks[AF].core===LIB.unit.decks.find(d=>d.key===AF).cards.filter(c=>c.core).length);
  const r=C.compile("nc_envirothon",{check:true});
  ok("the unit compiles and is current (--check)", r.ok, r.err);
  ok("COUNTS.json counts the worksheet's kinds from unit.json", JSON.stringify(COUNTS.skills[BI.key])===JSON.stringify({section:"aquatics",type:"sheet",core:true,items:ITEMS.length}));
  ok("index.json (the catalog entry) and CPU_UNITS carry it exactly as unit.json has it (its own _about stays in unit.json)", JSON.stringify(INDEX.skills.find(s=>s.key===BI.key))===JSON.stringify(C.skillEntry(BI))&&!("_about" in C.skillEntry(BI))&&src.indexOf('{"key":"aquatics.biotic_index","section":"aquatics","type":"sheet"')>0);
  const have=new Set(Object.keys(PICS).map(k=>nm(k.split(" · ")[0]).trim())), want=ITEMS.filter(x=>!have.has(nm(x.item||x.name))).map(x=>x.name), gaps=C.tallyPhotoGaps(REPO,UNIT.skills);
  ok("the no-photo list comes from envirothon/pics/index.json ("+want.length+" kinds), and compile prints it as a note only when there is one", JSON.stringify(gaps.map(g=>g.name))===JSON.stringify(want)&&(want.length?r.warn.some(w=>w.indexOf(want.length+" worksheet kind")===0):!r.warn.some(w=>/worksheet kind/.test(w))), r.warn);
  ok("the gear note still lists gear items only (the worksheet's kinds aren't 'gear')", C.gearPhotoGaps(REPO,UNIT.skills).every(g=>g.skill!==BI.key));
  const secs=UNIT.sections.map(s=>s.key), decks=[{key:AF,section:"aquatics",cards:[{name:"x",order:371}]}], tests={sections:{aquatics:{pre:{items:[{id:"pre-15"}]}}}};
  const t=o=>{ const k=JSON.parse(JSON.stringify(Object.assign({},BI,{replaces:[AF+"#o371"]}))); delete k._about; if(o) o(k); return C.checkSkills([k],secs,decks,tests); };
  ok("the unit's worksheet passes rule 8", t().length===0, t());
  ok("rule 8 catches, for a tally sheet: not type sheet · fewer than 2 groups · a group key twice · no weight · fewer than 4 kinds · a kind twice · a kind in no group · no source · a look-alike that isn't a kind",
    /is type sheet/.test(t(k=>{ k.type="chart"; }).join())&&/2 or more groups/.test(t(k=>{ k.data.groups.splice(1); k.data.items.forEach(x=>{ x.group="g1"; }); }).join())&&/key “g1” twice/.test(t(k=>{ k.data.groups[1].key="g1"; }).join())&&/weight must be a number/.test(t(k=>{ k.data.groups[0].weight="3"; }).join())
    &&/4 or more items/.test(t(k=>{ k.data.items=k.data.items.slice(0,3).map(x=>Object.assign(x,{like:[]})); }).join())&&/name twice/.test(t(k=>{ k.data.items[1].name=k.data.items[0].name; }).join())&&/is not one of the skill's groups/.test(t(k=>{ k.data.items[0].group="g9"; }).join())&&/has no source/.test(t(k=>{ delete k.data.items[0].src; }).join())&&/is not another item/.test(t(k=>{ k.data.items[0].like=["Zebra"]; }).join()));
  ok("…ratings without a number min or two at one min · a bad pick · an unknown form", /needs a label and a number min/.test(t(k=>{ k.data.ratings[0].min="23"; }).join())&&/two ratings start at/.test(t(k=>{ k.data.ratings[1].min=23; }).join())&&/pick must be/.test(t(k=>{ k.data.pick=[9,5]; }).join())&&/forms must be/.test(t(k=>{ k.data.forms=["essay"]; }).join())); }

console.log("\n── the maker, over many seeds and both forms ──");
{ const w=W(), S=w.S, I=w.I, M=I.CPIB_SHEET, sk=Object.assign({fb:FB},BI);
  ok("registered as the engine's `sheet` type, keeping CPSKILL's minimal maker for other sheets", S.CPSK_TYPES.sheet===M&&I.CPIB_PREV_SHEET===S.CPSK_SHEET);
  let bad=null; const bands={list:{},chart:{}}, counts={}, seenPic={}, seenKind={};
  for(let seed=1;seed<=600&&!bad;seed++){ const p=M.make(sk,S.cpskRng(seed)), st=p.steps, ex=expect(p), ids=st.map(s=>s.id);
    bands[p.form][ex.band.label]=1; counts[p.form+":"+ex.cnt.join("-")]=1; if(p.photo) seenPic[p.pic.name]=1; (p.rows||[]).forEach(r=>{ seenKind[r.name]=1; });
    const cs=GROUPS.map(g=>st.find(s=>s.id==="count:"+g.key)), m=st.find(s=>s.id==="math"), rg=st.find(s=>s.id==="range");
    if(!p.photo) bad=["every kind has a repo photo → every problem has its picture question",seed];
    else if(ids[0]!=="id"||st[0].answer!==p.pic.name||st[0].choices.length!==4||new Set(st[0].choices).size!==4||st[0].choices.indexOf(p.pic.name)<0) bad=["step 1 names the one in the picture among 4",seed];
    else if(!p.pic.like.slice(0,3).every(l=>st[0].choices.indexOf(l)>=0)) bad=["its look-alikes come first",seed,p.pic.name];
    else if(cs.some((s,i)=>!s||s.answer!==ex.cnt[i])||m.answer!==ex.total||rg.answer!==ex.band.choice||rg.choices.join()!==RATINGS.map(r=>r.choice).join()) bad=["the counts, the index and the rating recompute",seed,p.form];
    else if(ids.slice(-5).join()!=="count:g1,count:g2,count:g3,math,range") bad=["the chart's steps come last (so the fade hands over the rating, then the index)",seed];
    else if(p.form==="list"){ const k=p.rows.length, sorts=st.filter(s=>s.id==="sort");
      if(k<5||k>9) bad=["5–9 kinds",seed,k]; else if(new Set(p.rows.map(r=>r.name)).size!==k) bad=["a kind once in the list",seed];
      else if(!p.rows.some(r=>r.n>1)) bad=["at least one kind seen more than once",seed];
      else if(sorts.length!==k||sorts.some((s,i)=>s.x!==p.rows[i].name||s.answer!==GROUPS.find(g=>g.key===p.rows[i].g).short||s.choices.join()!=="Group 1,Group 2,Group 3")) bad=["one sort step per kind, in the list's order",seed];
      else if(p.rows.filter(r=>r.pic).length!==1||!p.rows.find(r=>r.pic).name===p.pic.name) bad=["one kind is the picture",seed];
      else if(cs.some((s,i)=>s.alt!==p.rows.filter(r=>r.g===GROUPS[i].key).reduce((a,r)=>a+r.n,0))) bad=["the animals count kept to catch counting animals",seed]; }
    else { const sorts=st.filter(s=>s.id==="sort"), gi=GROUPS.findIndex(g=>g.key===p.pic.group);
      if(sorts.length!==1||sorts[0].x!==p.pic.name||p.rows.length) bad=["one sort step: the picture's kind",seed];
      else if(cs[gi].less!==ex.cnt[gi]-1||cs.some((s,i)=>i!==gi&&s.less!=null)) bad=["the picture's group keeps 'one less' to catch leaving it out",seed];
      else if(ex.cnt.reduce((a,c)=>a+c,0)<BI.data.chartPick[0]||ex.cnt.reduce((a,c)=>a+c,0)>BI.data.chartPick[1]) bad=["the chart's kinds in chartPick",seed]; } }
  ok("600 problems: the picture question, the sort, the counts, the index and the rating all recompute from what the problem shows", !bad, bad);
  ok("every rating comes up in both forms", ["list","chart"].every(f=>RATINGS.every(r=>bands[f][r.label])), bands);
  ok("problems vary: many different count sets, every kind in some list, many kinds as the picture", Object.keys(counts).length>=60&&ITEMS.every(x=>seenKind[x.name])&&Object.keys(seenPic).length>=ITEMS.length-2, [Object.keys(counts).length,Object.keys(seenPic).length]);
  const p=M.make(sk,S.cpskRng(3)), st=p.steps, c1=st.find(s=>s.id==="count:g1"), lst=(()=>{ for(let s=1;s<200;s++){ const q=M.make(sk,S.cpskRng(s)); if(q.form==="list"&&q.steps.some(x=>/^count:/.test(x.id)&&x.alt!==x.answer)) return q; } })();
  const cA=lst.steps.find(x=>/^count:/.test(x.id)&&x.alt!==x.answer), ch=(()=>{ for(let s=1;s<200;s++){ const q=M.make(sk,S.cpskRng(s)); if(q.form==="chart") return q; } })(), cP=ch.steps.find(x=>x.less!=null);
  ok("the miss codes: id:<kind> · group:<kind> · count:individuals · count:picture · group:<group> · math · range",
    M.miss(st[0],"x",p)==="id:"+I.cpibSlug(p.pic.name)&&M.miss(st[1],"x",p)==="group:"+I.cpibSlug(st[1].x)&&M.miss(cA,String(cA.alt),lst)==="count:individuals"&&M.miss(cP,String(cP.less),ch)==="count:picture"&&M.miss(c1,"99",p)==="group:g1"&&M.miss(st.find(s=>s.id==="math"),"0",p)==="math"&&M.miss(st.find(s=>s.id==="range"),"x",p)==="range");
  ok("…and in words for the teacher", S.cpSkillMissLabel(sk,"count:individuals")==="counted animals, not kinds"&&S.cpSkillMissLabel(sk,"count:picture")==="left the one in the picture out of the count"&&S.cpSkillMissLabel(sk,"group:g2")==="the Group 2 count"&&S.cpSkillMissLabel(sk,"group:scud")==="which group the Scud is in"&&S.cpSkillMissLabel(sk,"id:dobsonfly-larva-hellgrammite")==="naming the Dobsonfly larva (hellgrammite) by its picture"&&S.cpSkillMissLabel(sk,"math")==="the multiply-and-add"&&S.cpSkillMissLabel(sk,"range")==="picked the wrong rating");
  ok("the slugs are safe as database keys (no . # $ [ ] /)", ITEMS.every(x=>/^[a-z0-9-]+$/.test(I.cpibSlug(x.name))));
  ok("a sheet of CPSKILL's own shape still goes to its minimal maker (the sample: 3 counts, the index, the rating)", (()=>{ const q=M.make(S.CPSK_DEMO_SKILL,S.cpskRng(1)); return q&&!q.tally&&q.steps.length===5&&q.steps[3].id==="math"; })()&&M.make({type:"sheet",data:{kind:"other"}},S.cpskRng(1))===null); }

console.log("\n── a sitting: every rating, both forms, no counts twice ──");
{ const d=demo("kid"), S=d.S;
  for(const seed of [5,17,99]){ S.cpSkillOpen(K,FB,seed); const seen=[], forms=[];
    for(let t=0;t<S.CPSK_SITTING;t++){ const r=S._cpsk.run, ex=expect(r.prob); seen.push([ex.band.label,r.prob.form,ex.cnt.join("-")]); forms.push(r.prob.form);
      if(r.stage==="shown"){ const n0=r.tries.length; for(let i=0;i<30&&r.tries.length===n0;i++) S.cpSkillStep(); } else { r.prob.steps.forEach((st,i)=>{ if(i>=r.from) (st.kind==="pick"?S.cpSkillPick:S.cpSkillInput)(i,String(st.answer)); }); S.cpSkillCheckTry(); S.cpSkillNextTry(); } }
    ok("sitting seed "+seed+": the first 4 tries bring all 4 ratings, the forms alternate (list, chart, …), no count set twice", new Set(seen.slice(0,4).map(x=>x[0])).size===4&&forms.join()==="list,chart,list,chart,list,chart"&&new Set(seen.map(x=>x[1]+x[2])).size===seen.length, seen);
    S.cpSkillQuit(); d.masteryData.maya_skills={}; } }

console.log("\n── the pictures: from the pool by item + tag; the placeholder ──");
{ const d=demo("kid"), S=d.S, I=d.I, P=d.P, sk=Object.assign({fb:FB},BI);
  ok("every kind has a picture in the pool (the repo set)", I.cpBioticNeedPhoto(sk).length===ITEMS.filter(x=>!PICS[Object.keys(PICS).find(k=>nm(k.split(" · ")[0])===nm(x.name))]).length&&I.cpBioticNeedPhoto(sk).length===0);
  ok("the lookup is by item + the skill's tags (live, drawing, specimen)", JSON.stringify(BI.data.tags)==='["live","drawing","specimen"]'&&I.cpibPhotos(sk,ITEMS[0]).length===P.cpPhotos(ITEMS[0].name,BI.data.tags).length&&I.cpibPhotos(sk,ITEMS[0]).length>0);
  // hide every photo of one kind (the class layer's 🙈), so it has none
  const x=ITEMS.find(y=>y.name==="Scud"), k=P.cpphKey(x.name), L=P._cpph.L[CID]||(P._cpph.L[CID]={});
  L[k]={_hide:Object.fromEntries(P.cpPhotos(x.name).map(p=>[p.id,true]))}; P._cpph.ver++; P._cpph.rmemo=null;
  ok("with its photos hidden, the Scud needs a photo (and the list names it)", I.cpBioticNeedPhoto(sk).map(y=>y.name).join()==="Scud");
  let saw=false, asPic=false; for(let s=1;s<=300;s++){ const p=I.CPIB_SHEET.make(sk,S.cpskRng(s)); if(p.pic&&p.pic.name==="Scud"&&p.photo) asPic=true;
    if(p.form==="list"&&p.rows.some(r=>r.name==="Scud")&&!saw){ saw=true; S._cpsk.run={sk,stage:"solo",from:0,checked:null}; const h=I.CPIB_SHEET.html(p,sk); S._cpsk.run=null;
      ok("a list with the Scud: its tile shows the 📷 placeholder, the others their pictures (the picture's own tile points up to it)", /title="Photo needed">📷/.test(h)&&(h.match(/<img /g)||[]).length===p.rows.length-1&&/👆 the picture/.test(h)); } }
  ok("…and the Scud is never the picture question", saw&&!asPic);
  delete L[k]; P._cpph.ver++; P._cpph.rmemo=null;
  let p=null; for(let s=1;s<99&&!p;s++){ const q=I.CPIB_SHEET.make(sk,S.cpskRng(s)); if(q.form==="list") p=q; }
  S._cpsk.run={sk,stage:"solo",from:0,checked:null}; const h1=I.CPIB_SHEET.html(p,sk);
  ok("on your own: the picture's name and credit stay hidden, its tile says 'the picture', the chart shows ? for every number", h1.indexOf('alt="The one in the picture"')>0&&h1.indexOf(">"+p.pic.name)<0&&h1.indexOf(p.pic.name+": ")<0&&/👆 the picture/.test(h1)&&(h1.match(/>\?</g)||[]).length===2*GROUPS.length+1);
  S._cpsk.run.checked={ok:true,wrong:{}}; const h2=I.CPIB_SHEET.html(p,sk);
  ok("…after Check: its name and credit, and the chart filled in (# found, totals, the index)", h2.indexOf(p.pic.name+": ")>0&&!/>\?</.test(h2)&&h2.indexOf(">"+p.total+"<")>0);
  S._cpsk.run={sk,stage:"faded",from:p.steps.length-1,checked:null}; const h3=I.CPIB_SHEET.html(p,sk);
  ok("✍️ with only the rating left: the sort and the chart are filled in for her", !/>\?</.test(h3)&&h3.indexOf(">"+p.total+"<")>0); S._cpsk.run=null;
  const hp=I.CPIB_SHEET.help(p,sk);
  ok("the help is the chart: every group's kinds with its number, and the ratings", /The chart/.test(hp)&&ITEMS.every(y=>hp.indexOf(y.name)>0)&&RATINGS.every(r=>hp.indexOf(r.choice)>0)); }

console.log("\n── the demo kid: 👀 → ✍️ → 💪 on the real worksheet ──");
{ const d=demo("kid"), S=d.S, run=()=>S._cpsk.run;
  ok("the demo's sample gave way to the unit's real worksheet (the same key), beside the gear skills", S._cpsk.demo.nc_envirothon.some(s=>s.key===BI.key&&s.data.kind==="tally"&&Array.isArray(s.data.items))&&!S._cpsk.demo.nc_envirothon.some(s=>s===S.CPSK_DEMO_SKILL)&&S.cpSkillsFor(K).some(s=>s.fb===FB));
  ok("the Skills door lists Biotic index", /🧩 Skills/.test(d.G.content)&&/Biotic index/.test(d.G.content));
  S.cpSkillOpen(K,FB,7); const r1=run();
  ok("Go: 👀 Watch it — the stream sample (2026's list form) with its pictures, the Area 8 chart, the first step lit", r1.stage==="shown"&&r1.prob.form==="list"&&/👀 Watch it/.test(d.G.content)&&/What you found in the stream/.test(d.G.content)&&/# found/.test(d.G.content)&&/× value/.test(d.G.content)&&/<img src="/.test(d.G.content));
  for(let i=0;i<=r1.prob.steps.length;i++) S.cpSkillStep(); const r2=run();
  ok("the second worked example is 2022's form: the counts given, one more in the picture", r2.stage==="shown"&&r2.prob.form==="chart"&&/Besides the one in the picture, you also found/.test(d.G.content));
  for(let i=0;i<=r2.prob.steps.length;i++) S.cpSkillStep(); const r3=run(), n3=r3.prob.steps.length;
  ok("then ✍️ Finish it: everything is done but the rating, which she picks", r3.stage==="faded"&&r3.from===n3-1&&/Do the last step/.test(d.G.content)&&d.G.content.indexOf("23 or more – Excellent")>0);
  const fill=(right,from)=>{ const r=run(); r.prob.steps.forEach((st,i)=>{ if(i<r.from) return; const v=right?String(st.answer):(st.kind==="pick"?st.choices.find(c=>c!==st.answer):String(st.answer+1)); (st.kind==="pick"?S.cpSkillPick:S.cpSkillInput)(i,v); }); };
  fill(true); S.cpSkillCheckTry(); ok("a right ✍️ try: ✓ All right!; next she does the index too", run().checked.ok&&/All right!/.test(d.G.content)&&run().st.fade===2);
  S.cpSkillNextTry(); const r4=run(); ok("the next ✍️ try: the index and the rating are hers", r4.stage==="faded"&&r4.from===r4.prob.steps.length-2);
  fill(true); S.cpSkillCheckTry(); ok("two right in a row: up to 💪 on your own", run().st.stage==="solo"&&/Next: on your own!/.test(d.G.content));
  S.cpSkillNextTry(); const r5=run();
  ok("💪 on your own: every step hers — the picture, the sort, the chart — and the guide behind 'Show the chart'", r5.stage==="solo"&&r5.from===0&&/Show the chart/.test(d.G.content)&&r5.prob.steps[0].id==="id");
  // she counts animals instead of kinds in the first group where that differs (a list), else misses the picture's one (a chart)
  const c=r5.prob.steps.findIndex(s=>/^count:/.test(s.id)&&((s.alt!=null&&s.alt!==s.answer)||s.less!=null)), cs=r5.prob.steps[c];
  fill(true); S.cpSkillInput(c,String(cs.alt!=null&&cs.alt!==cs.answer?cs.alt:cs.less)); S.cpSkillCheckTry();
  const code=r5.prob.form==="list"?"count:individuals":"count:picture";
  ok("a miss is saved as the step that went wrong ("+code+") and said in words", run().checked.miss===code&&d.G.content.indexOf("Missed at step "+(c+1)+": "+S.cpSkillMissLabel(run().sk,code))>0);
  const before=d._envs.writes.length; S.cpSkillNextTry(); fill(true); S.cpSkillCheckTry(); S.cpSkillNextTry();
  const W1=d._envs.writes.slice(before), w1=W1[0]||{};
  ok("the 6th try ends the sitting: ONE write, an update on mastery with maya_skills/nc_envirothon/aquatics:biotic_index and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&Object.keys(w1.val).length===2&&Object.keys(w1.val).some(k=>k==="maya_skills/nc_envirothon/"+FB)&&Object.keys(w1.val).some(k=>/^studyLog\/maya\/skills\/\d{8}$/.test(k)), W1.map(x=>[x.op,x.path,Object.keys(x.val||{})]));
  const st=w1.val["maya_skills/nc_envirothon/"+FB];
  ok("the state: on your own, the miss counted by its code, the stages tried in order; the write holds no problem, no picture, no answer", st.stage==="solo"&&st.miss[code]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo"&&!/envirothon\/pics|"rows"|"choices"/.test(JSON.stringify(w1.val)));
  const sum=S.cpSkillSummary(K,d.masteryData,T0), nAq=S.cpSkillList().filter(s=>s.section==="aquatics").length;
  ok("summary.skills: Aquatics 0 of "+nAq+" (the worksheet on your own, with its miss code)", sum.aquatics.total===nAq&&sum.aquatics.learned===0&&sum.aquatics.stage[FB]==="solo"&&sum.aquatics.miss[FB][code]===1);
  ok("the 'skills learned' line counts it: 'skills learned 0 of "+nAq+"' for Aquatics", S.cpSkillPaceLine({skills:sum},"aquatics")==="skills learned 0 of "+nAq); S.cpSkillQuit(); }

console.log("\n── the teacher: the photo note, the most-missed step, 📅 Pace ──");
{ const d=demo("teacher"), S=d.S; d.envcView("setup");
  ok("🏫 Class setup ▸ 🧩 Skills: Biotic index, a sheet, core, with how many kinds have a photo and what a sitting brings", /Biotic index/.test(d.G.content)&&/sheet · core/.test(d.G.content)&&d.G.content.indexOf("🖼 "+ITEMS.length+" of "+ITEMS.length+" kinds have a photo")>0&&/both Area 8 forms/.test(d.G.content));
  const studs=d.envcStudents(), rows=S.cpSkillFoldRows(studs), bi=rows.find(r=>r.sk.fb===FB);
  ok("the Skills fold: the worksheet's most-missed step in words — the classmates' seeded counts carried over from the sample", !!bi&&bi.top==="count:individuals"&&d.G.content.indexOf("Most missed step: counted animals, not kinds ("+bi.topN+")")>0&&bi.learned===1, bi&&[bi.top,bi.topN,bi.learned]);
  const cal=studs.find(x=>x.sid==="walker_caleb"), A=cal.summary.skills.aquatics, nAq=A.total, nL=Object.keys(A.stage).filter(k=>A.stage[k]==="learned").length, line="skills learned "+nL+" of "+nAq;
  ok("📅 Pace's line from the summaries: Caleb '"+line+"' in Aquatics (the worksheet among the learned, counted with every Aquatics skill)", S.cpSkillPaceLine(cal.summary,"aquatics")===line&&A.stage[FB]==="learned"&&nAq===S.cpSkillList().filter(s=>s.section==="aquatics").length);
  d.envcView("pace"); for(let i=0;i<6;i++){ const n=d.PC.cpPaceFlush(); d.renderAll(); if(!n) break; } d.PC.cppOpen("walker_caleb"); for(let i=0;i<6;i++){ const n=d.PC.cpPaceFlush(); d.renderAll(); if(!n) break; }
  ok("Teacher ▸ 📅 Pace ▸ Caleb: '🧩 "+line+"' under Aquatic Ecology", d.G.content.indexOf("🧩 "+line)>0);
  ok("the demo writes nothing (the seed is in memory)", d._envs.writes.length===0); }

console.log("\n── a live kid: the worksheet from the catalog entry ──");
{ const w=W({w:{fam:FAM,remote:{["classSkills/"+CID]:{}}}}), S=w.S; w.initFb();
  Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Soils and Land Use · Terms":true}};
  ok("no demo list: the skills are CPU_UNITS' (the compiled unit), the worksheet among them", S.cpSkillList().some(s=>s.fb===FB&&s.data.kind==="tally")&&S.cpSkillsFor(K).some(s=>s.fb===FB));
  ok("it opens on a real problem, the picture from the repo set", (()=>{ S.cpSkillOpen(K,FB,11); const r=S._cpsk.run, okk=!!r&&r.prob.tally&&!!r.prob.photo&&/^envirothon\/pics\//.test(r.prob.photo.url)&&/Biotic index/.test(S.cpSkillStudyWrap(K,"")); S._cpsk.run=null; return okk; })());
  ok("cpBioticDemoSeed does nothing off the demo", w.I.cpBioticDemoSeed({cid:CID,students:{}})===false); }

console.log("\n── Howe and Lincoln: nothing on ──");
{ const w=W({w:{fam:HOWE}}), I=w.I, S=w.S;
  ok("cpibOn false; no skills listed; the demo seed refuses; Lincoln's summary has no skills (cpSkillSummary null)", I.cpibOn()===false&&S.cpSkillList().length===0&&I.cpBioticDemoSeed({cid:"x",students:{}})===false&&S.cpSkillSummary("lincoln",{lincoln_skills:{nc_envirothon:{[FB]:{learned:true}}}},T0)===null);
  ok("no read, write, listener or element", w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0&&w.G.created.length===0);
  const a=W({w:{fam:HOWE}}), b=W({biotic:false,w:{fam:HOWE}});
  ok("the world without this block boots the same for Howe (nothing created, read or written either way)", JSON.stringify([a.G.reads,a.G.writes,a.G.created.length])===JSON.stringify([b.G.reads,b.G.writes,b.G.created.length])&&b.I===null); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
