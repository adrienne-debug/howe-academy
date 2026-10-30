/*
 * Node tests — 🌲 CPITEMID, ID by part and by sign with look-alike lures: ID Flash generalized as the skill engine's `id` type
 * (DESIGN_class_platform_2026-10-28.md §4.1b, §6.7, §13 rows 25–27; RESEARCH_envirothon_skills_2026-10-28.md §4.4, §4.6, §4.7, ranked #5 in
 * §5). One item's photo of ONE part (bark, leaf, track, skull, pelt, the animal) → what do you see (its card's clue) → which one is it (its
 * look-alikes as the wrong choices), through the three stages (shown → faded → on your own).
 *   · Where the block sits (IMMEDIATELY after ENVIDFLASH_END), its one hook line, what it never does; ENVIDFLASH untouched.
 *   · The data: units/nc_envirothon/unit.json's three ID-by-part skills — every ID item, the research's look-alike pairs, every clue the
 *     item's own card back (src); compile_unit.js rule 8 for kind "parts" (each error caught), COUNTS.json, the catalog entry, CPU_UNITS,
 *     and the "no photo yet" note from envirothon/pics/index.json.
 *   · The maker over many seeds and rounds: the photo is of that part and from the pool; 4 names, look-alikes first; the clue step's choices
 *     are the same items' clues; a part with no photo is never asked; the miss codes and their words; no item twice; the missed first.
 *   · The demo kid: 🌿 ▸ 🧩 Trees by part ▸ Go ▸ Bark — a bark round with look-alikes, 👀 → ✍️ → 💪, ONE write, summary.skills; the
 *     teacher: photos by part and what still needs one, the classmates' counts, "skills learned" (📅 Pace's line), the look-alike that fooled.
 *   · A live kid gets the skills from the catalog entry; Howe and Lincoln: nothing on.
 * Every count comes from the unit's data or the photo index, never typed in.                               run: node test_cp_item_id.js
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
// the pool as it was before the twig photos came in (2026-10-30): every twig / bud shot left out, so "a part with no photo" stays tested
const NOTWIG=Object.fromEntries(Object.entries(PICS).map(([k,L])=>[k,L.filter(p=>!/twig|bud/i.test(p.shot))]));
const UNIT=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const COUNTS=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","COUNTS.json"),"utf8"));
const INDEX=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","index.json"),"utf8"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"),
  GEAR=cut("// CPITEMGEAR_START","// CPITEMGEAR_END"), BLK=cut("// CPITEMID_START","// CPITEMID_END"), FLASH=cut("// ENVIDFLASH_START","// ENVIDFLASH_END");
const XS="\nfunction envPicsIndex(){ return G.pics||null; }\nG.sk={ CPSK_TYPES, CPSK_SITTING, _cpsk, cpskRng, cpskFb, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillSummary, cpSkillPaceLine, cpSkillFoldRows, cpSkillFoldHtml, cpSkillMissLabel, cpSkillSetupHtml, cpSkillStudyWrap };\nG.ph={ _cpph, cpphKey, cpPhotos, cpphShotTags };\nG.ig={ CPIG_ID };";
const XI="\nG.id={ CPII_ID, CPII_MIX, _cpii, get prev(){ return CPII_PREV_ID; }, cpiiOn, cpiiKind, cpiiSlug, cpiiItems, cpiiPartList, cpiiCan, cpiiTell, cpiiPhotos, cpIdPhotoCount, cpIdNeedPhoto, cpIdRoundOf, cpiiOrder, cpiiSet, cpiiClues, cpIdRound, cpiiReg, cpIdDemoSeed };";
// id false = the same world without this block (the control)
function W(o){ o=o||{}; const g=o.id!==false; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+SKL+"\n"+GEAR+"\n"+(g?BLK:"")+XS+(g?XI:"\nG.id=null;")},o.w||{})); w.G.pics=PICS; w.S=w.G.sk; w.P=w.G.ph; w.I=w.G.id; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", T0=Date.UTC(2026,9,28,15,0,0);
const SK=UNIT.skills||[], PARTS=SK.filter(s=>s.data&&s.data.kind==="parts");
const TREES=SK.find(s=>s.key==="forestry.tree_parts"), ANIM=SK.find(s=>s.key==="wildlife.signs"), BUGS=SK.find(s=>s.key==="aquatics.bugs");
const FBT="forestry:tree_parts", FBW="wildlife:signs", FBB="aquatics:bugs";
const nm=s=>String(s).toLowerCase();
const deckItems=k=>{ const d=LIB.unit.decks.find(x=>x.key===k); return [...new Set(d.cards.map(c=>c.item||c.name.split(" · ")[0]))]; };
const cardAt=ref=>{ const m=/^(.*)#o(\d+)$/.exec(ref); const d=m&&LIB.unit.decks.find(x=>x.key===m[1]); return d?d.cards.find(c=>c.order===+m[2]):null; };
// the photo tags each item has in the repo set (CPPHOTOS' shot → tag words, as compile_unit.js reads them)
const repoTags=it=>{ const T={}; Object.keys(PICS).forEach(n=>{ if(nm(n.split(" · ")[0].trim())!==nm(it)) return; PICS[n].forEach(p=>C.shotTags(p.shot).forEach(t=>{ T[t]=1; })); }); return T; };
const hasPart=(x,p)=>{ const T=repoTags(x.name); return (p.tags||[p.tag]).some(t=>T[t]); };
const can=(x,tag)=>!Array.isArray(x.parts)||x.parts.indexOf(tag)>=0;

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPITEMID_START"), b=src.indexOf("// CPITEMID_END"), e=src.indexOf("// ENVIDFLASH_END\n");
  ok("CPITEMID once, IMMEDIATELY after ENVIDFLASH_END", a>0&&b>a&&src.indexOf("// CPITEMID_START",a+1)<0&&e+"// ENVIDFLASH_END\n".length===a);
  ok("the header names §4.1b, §6.7, §13 rows 25–27, the research's §4.4, §4.6, §4.7 and its #5 rank, the pool, the skipped parts and the dates",
    /§4\.1b/.test(BLK)&&/§6\.7/.test(BLK)&&/§13 rows 25–27/.test(BLK)&&/§4\.4, §4\.6, §4\.7/.test(BLK)&&/ranked #5/.test(BLK)&&/THE PICTURE comes from CPPHOTOS/.test(BLK)&&/IS SKIPPED/.test(BLK)&&/2026-10-28/.test(BLK)&&/2026-10-29/.test(BLK));
  ok("the block only declares, plus its one registration (cpiiReg) through CPSKILL's extension point", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let | |})/.test(l)||l==="cpiiReg();"));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing and reads nothing: no set / update / remove / once / on, no envsWrite / envcWrite, no db or firebase", !/\.set\(|\.update\(|\.remove\(|\.once\(|\.on\(|envsWrite|envcWrite|\bdb\b|firebase/.test(code));
  ok("nothing hot-linked: no http(s) URL in its code; pictures only through cpPhotos(item, the part's tags)", !/https?:\/\//.test(code)&&/cpPhotos\(x\.name,/.test(code));
  ok("no Howe kid name as a code literal; no 'Station' in its strings; no 🔀 in index.html", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/["'][^"'\n]*\bStations?\b/.test(code)&&src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🌲 CPITEMID/.test(l)&&!/^\s*\/\//.test(l));
  ok("ONE hook line outside the block, tagged 🌲 CPITEMID and guarded: envsDemoStart, right after the gear's seed", hooks.length===1&&
    /  try\{ if\(typeof cpGearDemoSeed==="function"\) cpGearDemoSeed\(data\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof cpIdDemoSeed==="function"\) cpIdDemoSeed\(data\); \}catch\(e\)\{\}   \/\/ 🌲 CPITEMID/.test(src), hooks.map(l=>l.trim().slice(0,80)));
  ok("ENVIDFLASH (Lincoln's ID Flash in Howe) never names this block, and this block never calls into ID Flash", !/cpii|cpId|CPITEMID/.test(FLASH)&&!/envFlash|envPicsFor|envPicCycle/.test(code)); }

console.log("\n── the data: every ID item, the research's look-alikes, every clue a card's own words ──");
{ ok("three ID-by-part skills in units/nc_envirothon/unit.json: Trees by part (Forestry), Stream bugs by picture (Aquatics), Animals and their signs (Wildlife) — type id, core",
    PARTS.length===3&&!!TREES&&!!ANIM&&!!BUGS&&TREES.section==="forestry"&&BUGS.section==="aquatics"&&ANIM.section==="wildlife"&&PARTS.every(s=>s.type==="id"&&s.core===true));
  ok("the parts: a tree's leaf (needles too), bark, twig, fruit (cones too); an animal itself, its track, skull, pelt; a stream bug itself",
    JSON.stringify(TREES.data.parts.map(p=>[p.tag,p.tags]))===JSON.stringify([["leaf",["leaf","needle"]],["bark",["bark"]],["twig",["twig"]],["fruit",["fruit","cone"]]])&&
    JSON.stringify(ANIM.data.parts.map(p=>p.tag))==='["live","track","skull","pelt"]'&&JSON.stringify(BUGS.data.parts.map(p=>p.tag))==='["live"]');
  const tN=TREES.data.items.map(x=>x.name), aN=ANIM.data.items.map(x=>x.name), bN=BUGS.data.items.map(x=>x.name);
  const fid=deckItems("Forestry · ID"), wid=deckItems("Wildlife · ID"), aqd=LIB.unit.decks.find(d=>d.key==="Aquatic Ecology · ID"), bugs=[...new Set(aqd.cards.filter(c=>/· pollution tolerance group$/.test(c.name)).map(c=>c.item||c.name.split(" · ")[0]))];
  ok("every Forestry ID tree and every Wildlife ID animal is an item (by its card item name); the bugs are the Aquatics ID items with a tolerance-group card",
    tN.slice().sort().join()===fid.slice().sort().join()&&aN.slice().sort().join()===wid.slice().sort().join()&&bN.slice().sort().join()===bugs.slice().sort().join(), [tN.length,fid.length,aN.length,wid.length,bN.length,bugs.length]);
  ok("every item's photo key is in the repo photo index (so the pool finds it)", [].concat(...PARTS.map(s=>s.data.items)).every(x=>Object.keys(PICS).some(k=>nm(k.split(" · ")[0].trim())===nm(x.name))));
  const L=(s,a,b)=>{ const x=s.data.items.find(y=>y.name===a); return !!x&&x.like.indexOf(b)>=0; };
  const pairs=[[TREES,"Loblolly Pine","Shortleaf Pine"],[TREES,"Loblolly Pine","Longleaf Pine"],[TREES,"Shortleaf Pine","Longleaf Pine"],[TREES,"Red Oak","White Oak"],[TREES,"White Oak","Red Oak"],[TREES,"Hickory","Pecan"],[TREES,"Pecan","Hickory"],[TREES,"Elm","Mulberry"],[TREES,"Mulberry","Elm"],
    [ANIM,"Red Fox","Gray Fox"],[ANIM,"Gray Fox","Red Fox"],[ANIM,"Coyote","Red Fox"],[ANIM,"Red Fox","Coyote"],[ANIM,"Beaver","Muskrat"],[ANIM,"Muskrat","Beaver"],[ANIM,"Southern Flying Squirrel","Carolina Northern Flying Squirrel"],[ANIM,"Carolina Northern Flying Squirrel","Southern Flying Squirrel"],
    [BUGS,"Mayfly nymph","Stonefly nymph"],[BUGS,"Mayfly nymph","Damselfly nymph"],[BUGS,"Stonefly nymph","Mayfly nymph"],[BUGS,"Gilled snail","Pouch snail"],[BUGS,"Pouch snail","Gilled snail"],[BUGS,"Fishfly larva","Dobsonfly larva (hellgrammite)"],[BUGS,"Dobsonfly larva (hellgrammite)","Fishfly larva"]];
  ok("the research's look-alike pairs, both ways (pines, red / white oak, hickory / pecan, elm / mulberry; red / gray fox, coyote / fox, beaver / muskrat, the flying squirrels; mayfly / stonefly / damselfly, the snails, fishfly / dobsonfly)", pairs.every(p=>L(...p)), pairs.filter(p=>!L(...p)).map(p=>p[1]+"→"+p[2]));
  ok("every item has 3 look-alikes, each another item of its skill", PARTS.every(s=>s.data.items.every(x=>x.like.length===3&&new Set(x.like).size===3&&x.like.every(l=>l!==x.name&&s.data.items.some(y=>y.name===l)))));
  let bad=[]; PARTS.forEach(s=>s.data.items.forEach(x=>Object.keys(x.tell||{}).forEach(t=>{ const refs=x.src&&x.src[t], cs=(refs||[]).map(cardAt);
    const want=cs.every(Boolean)?cs.map(c=>{ const at=c.name.split(" · ").slice(1).join(" · "); return at.charAt(0).toUpperCase()+at.slice(1)+": "+c.def.trim(); }).join(" · "):null;
    if(!refs||!refs.length||cs.some(c=>!c)||cs.some(c=>(c.item||c.name.split(" · ")[0])!==x.name)||x.tell[t]!==want) bad.push([s.key,x.name,t]); })));
  const nClues=PARTS.reduce((n,s)=>n+s.data.items.reduce((m,x)=>m+Object.keys(x.tell||{}).length,0),0);
  ok("every clue is its card's own words — \"<attribute>: <back>\" for each card src names, the card of that same item (no clue typed in)", nClues>0&&!bad.length, bad.slice(0,6));
  ok("a pelt is a mammal's, a track a mammal's or a bird's: an item that can't show a part has no clue for it", ANIM.data.items.every(x=>Object.keys(x.tell||{}).every(t=>can(x,t)))&&ANIM.data.items.some(x=>Array.isArray(x.parts))); }

console.log("\n── compile_unit.js rule 8 (kind parts), COUNTS.json, the catalog entry, the no-photo note ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("the unit compiles and is current (--check)", r.ok, r.err);
  ok("COUNTS.json counts each ID-by-part skill's items from unit.json", PARTS.every(s=>JSON.stringify(COUNTS.skills[s.key])===JSON.stringify({section:s.section,type:"id",core:true,items:s.data.items.length})));
  ok("index.json (the catalog entry) and CPU_UNITS carry the skills exactly as unit.json has them", JSON.stringify(INDEX.skills)===JSON.stringify(SK.map(C.skillEntry))&&JSON.stringify(r.index.skills)===JSON.stringify(INDEX.skills)&&PARTS.every(s=>src.indexOf('{"key":"'+s.key+'"')>0));
  const gaps=C.partPhotoGaps(REPO,SK), want=[]; PARTS.forEach(s=>s.data.parts.forEach(p=>{ const m=s.data.items.filter(x=>can(x,p.tag)&&!hasPart(x,p)).map(x=>x.name); if(m.length) want.push({skill:s.key,part:p.tag,label:p.label,items:m}); }));
  ok("the no-photo list (per skill and part) comes from envirothon/pics/index.json, and compile prints it as notes", JSON.stringify(gaps)===JSON.stringify(want)&&want.every(g=>r.warn.some(w=>w.indexOf(g.skill+" · "+g.label+": "+g.items.length+" item")===0)), [gaps.length,want.length]);
  ok("…the twig photos (2026-10-30) cover some trees, the note names the rest", gaps.some(g=>g.skill==="forestry.tree_parts"&&g.part==="twig"&&g.items.length>0&&g.items.length<TREES.data.items.length));
  const secs=UNIT.sections.map(s=>s.key), decks=[{key:"Forestry · ID",section:"forestry",cards:[{name:"N1 · bark",order:7,item:"N1"}]}], tests={sections:{}};
  const it=()=>[1,2,3,4].map(i=>({name:"N"+i,like:["N"+(i%4+1)]}));
  const g=f=>{ const k={key:"forestry.parts_x",section:"forestry",type:"id",label:"Parts",core:true,data:{kind:"parts",parts:[{tag:"bark",label:"Bark"},{tag:"leaf",label:"Leaf",tags:["leaf","needle"]}],items:it()}}; if(f) f(k); return k; };
  const E=f=>C.checkSkills([g(f)],secs,decks,tests).join(" | ");
  ok("a good ID-by-part skill passes (a clue naming a real card too)", E()===""&&E(k=>{ k.data.items[0].tell={bark:"Bark: x"}; k.data.items[0].src={bark:["Forestry · ID#o7"]}; })==="", [E(),E(k=>{ k.data.items[0].tell={bark:"Bark: x"}; k.data.items[0].src={bark:["Forestry · ID#o7"]}; })]);
  ok("rule 8 catches: not type id · no parts · a tag that is no photo tag · a part twice · no label · tags not photo tags · fewer than 4 items · a name twice",
    /is type id/.test(E(k=>{ k.type="chart"; }))&&/1 or more parts/.test(E(k=>{ k.data.parts=[]; }))&&/must be a photo tag/.test(E(k=>{ k.data.parts[0].tag="scat"; }))&&/“bark” twice/.test(E(k=>{ k.data.parts[1].tag="bark"; }))&&/has no label/.test(E(k=>{ k.data.parts[0].label=""; }))&&/tags must be photo tags/.test(E(k=>{ k.data.parts[1].tags=["leaves"]; }))&&/4 or more items/.test(E(k=>{ k.data.items.pop(); }))&&/name twice/.test(E(k=>{ k.data.items[1].name="n1"; })));
  ok("…an item's parts not the skill's · a clue for no part (or not the item's) · an empty clue · a clue naming no card · a card that isn't one · a look-alike that isn't another item",
    /parts must be parts of this skill/.test(E(k=>{ k.data.items[0].parts=["skull"]; }))&&/no part of this skill or item/.test(E(k=>{ k.data.items[0].tell={skull:"x"}; k.data.items[0].src={skull:["Forestry · ID#o7"]}; }))&&/no part of this skill or item/.test(E(k=>{ k.data.items[0].parts=["leaf"]; k.data.items[0].tell={bark:"x"}; k.data.items[0].src={bark:["Forestry · ID#o7"]}; }))&&
    /clue is empty/.test(E(k=>{ k.data.items[0].tell={bark:" "}; k.data.items[0].src={bark:["Forestry · ID#o7"]}; }))&&/names no card/.test(E(k=>{ k.data.items[0].tell={bark:"x"}; }))&&/is no card/.test(E(k=>{ k.data.items[0].tell={bark:"x"}; k.data.items[0].src={bark:["Forestry · ID#o9999"]}; }))&&/is not another item/.test(E(k=>{ k.data.items[0].like=["Zebra"]; }))&&/is not another item/.test(E(k=>{ k.data.items[0].like=["N1"]; })));
  ok("compile's photo tags are CPPHOTOS' tags, and its shot words are CPPHOTOS' (the same list, the same regexes)", src.indexOf("const CPPH_TAGS="+JSON.stringify(C.PHOTO_TAGS)+";")>0&&
    (()=>{ const P=W().P, shots=[...new Set([].concat(...Object.values(PICS).map(L=>L.map(p=>p.shot))))]; return shots.length>10&&shots.every(sh=>JSON.stringify(C.shotTags(sh))===JSON.stringify(P.cpphShotTags(sh))); })()); }

console.log("\n── the maker, over many seeds and every round ──");
{ const w=W(), S=w.S, I=w.I, M=I.CPII_ID;
  ok("registered as the engine's `id` type, wrapping the gear's maker (kind gear still the gear's)", S.CPSK_TYPES.id===M&&I.prev===w.G.ig.CPIG_ID&&I.cpiiReg()===true&&S.CPSK_TYPES.id===M);
  const live=demo("kid"), D=live.S, DI=live.I;
  const gear=live.S.cpSkillList().find(s=>s.fb==="forestry:tools");
  ok("a gear skill still makes a gear problem through this maker (delegated)", !!gear&&!!(DI.CPII_ID.make(gear,D.cpskRng(3))||{}).gear);
  [[TREES,FBT],[ANIM,FBW],[BUGS,FBB]].forEach(([U,fb])=>{
    const sk=Object.assign({fb},U), items=U.data.items, rounds=[DI.CPII_MIX].concat(U.data.parts.map(p=>p.tag));
    rounds.forEach(rd=>{ DI._cpii.round[fb]=rd; const eff=DI.cpIdRoundOf(sk), cnt=DI.cpIdPhotoCount(sk).find(c=>c.part.tag===rd);
      if(rd!==DI.CPII_MIX&&!(cnt&&cnt.have)){ ok(U.label+" · "+rd+": no photo of that part in the pool → the round falls back to Mixed", eff===DI.CPII_MIX); return; }
      let bad=null, seen={};
      for(let seed=1;seed<=700&&!bad;seed++){ const p=DI.CPII_ID.make(sk,D.cpskRng(seed)); if(!p){ bad=["no problem",seed]; break; } const st=p.steps, x=p.item, nmS=st[st.length-1], see=st.length===2?st[0]:null; seen[x.name]=1;
        const tags=p.part.tags||[p.part.tag], like=x.like.map(l=>items.find(y=>y.name===l));
        if(rd!==DI.CPII_MIX&&p.part.tag!==rd) bad=["the round's part",seed,p.part.tag];
        else if(!can(x,p.part.tag)) bad=["a part the item can show",seed,x.name,p.part.tag];
        else if(!p.photo||!p.photo.tags.some(t=>tags.indexOf(t)>=0)) bad=["a photo of that part",seed,x.name];
        else if(!D.cpSkillList||!live.P.cpPhotos(x.name,tags).some(q=>q.id===p.photo.id)) bad=["the photo is the pool's (cpPhotos by item + tags)",seed];
        else if(nmS.id!=="name"||nmS.kind!=="pick"||nmS.answer!==x.name||nmS.choices.length!==4||new Set(nmS.choices).size!==4||nmS.choices.indexOf(x.name)<0) bad=["4 names, its own among them",seed];
        else if(!like.every(y=>nmS.choices.indexOf(y.name)>=0)) bad=["its look-alikes are the wrong choices",seed,x.name,nmS.choices];
        else if(DI.cpiiTell(x,p.part.tag)&&items.filter(y=>DI.cpiiTell(y,p.part.tag)).length>1&&!see) bad=["an item with a clue for the part gets the clue step (when another item has one to offer beside it)",seed,x.name];
        else if(see&&items.filter(y=>DI.cpiiTell(y,p.part.tag)).length<2) bad=["no clue step when its clue is the only one of the part (Sweetgum's twig)",seed,x.name];
        else if(see&&(see.id!=="see"||see.answer!==DI.cpiiTell(x,p.part.tag)||new Set(see.choices).size!==see.choices.length||see.choices.length<2||see.choices.length>4||!see.choices.every(c=>items.some(y=>DI.cpiiTell(y,p.part.tag)===c)))) bad=["the clue step: its clue among other items' clues of the same part",seed];
        else if(see&&!p.set.filter(y=>DI.cpiiTell(y,p.part.tag)).every(y=>see.choices.indexOf(DI.cpiiTell(y,p.part.tag))>=0)) bad=["the clues of the same 4 items come first",seed]; }
      const could=items.filter(x=>(rd===DI.CPII_MIX?U.data.parts:U.data.parts.filter(q=>q.tag===rd)).some(q=>can(x,q.tag)&&hasPart(x,q)));
      ok(U.label+" · "+(rd===DI.CPII_MIX?"Mixed":rd)+": the photo is of the part, from the pool; 4 names with the look-alikes; the clue step from the same items' clues", !bad, bad);
      ok(U.label+" · "+(rd===DI.CPII_MIX?"Mixed":rd)+": every item with a photo of it comes up, and no other", could.every(x=>seen[x.name])&&Object.keys(seen).every(n=>could.some(x=>x.name===n)), [could.length,Object.keys(seen).length]); });
    DI._cpii.round[fb]=DI.CPII_MIX; });
  const sk=Object.assign({fb:FBT},TREES), p=DI.CPII_ID.make(sk,D.cpskRng(7)), wrong=p.steps[p.steps.length-1].choices.find(c=>c!==p.item.name), slug=DI.cpiiSlug(p.item.name);
  ok("the miss codes: see:<part>:<item> / name:<part>:<item>~<the one picked>", DI.CPII_ID.miss({id:"see"},"x",p)==="see:"+p.part.tag+":"+slug&&DI.CPII_ID.miss({id:"name"},wrong,p)==="name:"+p.part.tag+":"+slug+"~"+DI.cpiiSlug(wrong));
  ok("…in words for the teacher: the look-alike that fooled them", D.cpSkillMissLabel(sk,"name:bark:loblolly-pine~shortleaf-pine")==="telling the Loblolly Pine by its bark (took it for the Shortleaf Pine)"&&
    D.cpSkillMissLabel(sk,"see:fruit:white-oak")==="what the White Oak’s fruit or cone looks like"&&D.cpSkillMissLabel(Object.assign({fb:FBW},ANIM),"name:live:red-fox~gray-fox")==="telling the Red Fox by its picture (took it for the Gray Fox)"&&D.cpSkillMissLabel(sk,"weird")==="weird");
  ok("the slugs are safe as database keys (no . # $ [ ] /)", PARTS.every(s=>s.data.items.every(x=>/^[a-z0-9-]+$/.test(DI.cpiiSlug(x.name)))));
  ok("a skill of another kind is not this maker's: delegated to the gear's (which has nothing for it either)", M.make({type:"id",data:{kind:"flash"}},S.cpskRng(1))===null&&M.html({},{})===""&&M.note({data:{}})===""&&M.missLabel("name:x",{data:{}})===null);
  const need=DI.cpIdNeedPhoto(sk), cnt=DI.cpIdPhotoCount(sk);
  ok("photos by part and what still needs one come from the pool (each part's count = the items with a repo photo of it)", cnt.every(c=>c.have===TREES.data.items.filter(x=>can(x,c.part.tag)&&hasPart(x,c.part)).length&&c.total===TREES.data.items.filter(x=>can(x,c.part.tag)).length)&&need.length===cnt.filter(c=>c.need.length).length);
  live.G.pics=NOTWIG; live.P._cpph.rmemo=null;   // a pool with no twig photo: the round opens on the class's first one
  const need0=DI.cpIdNeedPhoto(sk), x=TREES.data.items.find(y=>need0.some(n=>n.part==="twig"&&n.items.indexOf(y.name)>=0)), L=live.P._cpph.L[CID]||(live.P._cpph.L[CID]={}), k=live.P.cpphKey(x.name);
  L[k]={ptwig:{url:"data:image/svg+xml;charset=utf-8,%3Csvg%3Etwig%3C%2Fsvg%3E",credit:"A twig",lic:"own",tags:{twig:true},item:x.name,how:"pool",by:"t",ts:1}}; live.P._cpph.ver++; live.P._cpph.rmemo=null;
  DI._cpii.round[FBT]="twig";
  ok("a twig photo added to the class's pool: the twig round opens by itself, with that tree only", DI.cpIdRoundOf(sk)==="twig"&&DI.cpIdPhotoCount(sk).find(c=>c.part.tag==="twig").have===1&&[1,2,3,4,5].every(s=>{ const q=DI.CPII_ID.make(sk,D.cpskRng(s)); return q.item===x&&q.part.tag==="twig"&&q.photo.id==="ptwig"; }));
  delete L[k]; live.G.pics=PICS; live.P._cpph.ver++; live.P._cpph.rmemo=null; DI._cpii.round[FBT]=DI.CPII_MIX; }

console.log("\n── a sitting's order: no item twice, the missed ones first ──");
{ const d=demo("kid"), S=d.S, I=d.I, items=TREES.data.items;
  const doTry=()=>{ const r=S._cpsk.run; if(r.stage==="shown"){ const n0=r.tries.length; for(let i=0;i<10&&r.tries.length===n0;i++) S.cpSkillStep(); return; } r.prob.steps.forEach((st,i)=>{ if(i>=r.from) S.cpSkillPick(i,st.answer); }); S.cpSkillCheckTry(); S.cpSkillNextTry(); };
  const names=[], parts=[]; S.cpSkillOpen(K,FBT,99); for(let t=0;t<S.CPSK_SITTING;t++){ const r=S._cpsk.run; names.push(r.prob.item.name); parts.push(r.prob.part.tag); doTry(); }
  ok("Mixed: 6 tries, 6 different trees, on more than one part (interleaved)", names.length===6&&new Set(names).size===6&&new Set(parts).size>1, [names,parts]);
  S.cpSkillQuit(); const st=d.masteryData.maya_skills.nc_envirothon[FBT]; st.miss={"name:bark:loblolly-pine~shortleaf-pine":3,"see:leaf:white-oak":1};
  S.cpSkillOpen(K,FBT,99); const r=S._cpsk.run, order=r.cpii.order.map(o=>items[o.i].name+"/"+o.tag);
  ok("the tree she missed most comes first, on the part she missed (Loblolly Pine/bark, then White Oak/leaf)", order[0]==="Loblolly Pine/bark"&&order[1]==="White Oak/leaf"&&new Set(r.cpii.order.map(o=>o.i)).size===order.length, order.slice(0,4));
  ok("the first try is Loblolly Pine's bark, its look-alikes Shortleaf / Longleaf / White pine as the wrong names", r.prob.item.name==="Loblolly Pine"&&r.prob.part.tag==="bark"&&["Shortleaf Pine","Longleaf Pine","Eastern White Pine"].every(n=>r.prob.steps[r.prob.steps.length-1].choices.indexOf(n)>=0));
  S._cpsk.run=null; }

console.log("\n── the demo kid: 🌿 ▸ 🧩 Trees by part ▸ Go ▸ Bark — a bark round with look-alikes, 👀 → ✍️ → 💪 ──");
{ const d=demo("kid"), S=d.S, I=d.I, run=()=>S._cpsk.run;
  const mine=S.cpSkillsFor(K).map(s=>s.fb), open=[FBT,FBB,FBW].filter(f=>{ const sec=f.split(":")[0]; return S.cpSkillsFor(K).some(s=>s.section===sec); });
  ok("the demo list grew by exactly the three ID-by-part skills (beside the gear and the sample); she gets those of her open sections (Wildlife isn't sent to her yet)", S._cpsk.demo.nc_envirothon.filter(s=>s.data&&s.data.kind==="parts").length===PARTS.length&&open.indexOf(FBT)>=0&&open.indexOf(FBB)>=0&&open.every(f=>mine.indexOf(f)>=0)&&S.cpSkillList().filter(s=>[FBT,FBB,FBW].indexOf(s.fb)>=0).length===3, mine);
  ok("the Skills door lists Trees by part before Stream bugs by picture (section order), beside the gear and the sample", /🧩 Skills/.test(d.G.content)&&d.G.content.indexOf("Trees by part")>0&&d.G.content.indexOf("Trees by part")<d.G.content.indexOf("Stream bugs by picture")&&/Forestry tools by picture/.test(d.G.content)&&/Biotic index/.test(d.G.content));
  S.cpSkillOpen(K,FBT,5);
  const twigHave=I.cpIdPhotoCount(Object.assign({fb:FBT},TREES)).find(c=>c.part.tag==="twig").have;
  ok("Go: 👀 Watch it, with the round chips (Mixed + every part that has a photo: Twig too, now that the pool has twig photos)", /👀 Watch it/.test(d.G.content)&&/Round:/.test(d.G.content)&&/>Mixed</.test(d.G.content)&&/>Bark</.test(d.G.content)&&/>Leaf</.test(d.G.content)&&twigHave>0&&/>Twig</.test(d.G.content), twigHave);
  I.cpIdRound(FBT,"bark"); const r1=run();
  ok("tap Bark: the same try is made again as a bark round — 'Look at the bark', a bark photo, the try number unchanged", r1.n===1&&r1.prob.part.tag==="bark"&&r1.prob.photo.tags.indexOf("bark")>=0&&/Look at the bark/.test(d.G.content)&&/try 1 of /.test(d.G.content));
  ok("the picture's alt never names it, and its credit waits… (👀 Watch it shows the answer, so the credit is out there)", /alt="The picture to name"/.test(d.G.content)&&/Picture: /.test(d.G.content));
  const n1=r1.prob.steps.length; for(let i=0;i<=n1;i++) S.cpSkillStep(); const r2=run(); ok("still bark on the next worked example", r2.prob.part.tag==="bark"); const n2=r2.prob.steps.length; for(let i=0;i<=n2;i++) S.cpSkillStep();
  // ✍️ — find a seed-free path: step through until a two-step bark problem is in front of her
  const r3=run();
  ok("after two worked examples: ✍️ Finish it on a bark photo — the bark's look is given (lit), she names the tree", r3.stage==="faded"&&r3.prob.part.tag==="bark"&&(r3.prob.steps.length===1?r3.from===0:r3.from===1)&&(r3.prob.steps.length===1||d.G.content.indexOf(I.cpiiTell(r3.prob.item,"bark").replace(/"/g,"&quot;"))>0)&&/Which tree is it\?/.test(d.G.content));
  ok("…no credit before Check (it may hold the name), and the names on offer include its look-alikes", !/Picture: /.test(d.G.content)&&r3.prob.item.like.every(n=>r3.prob.steps[r3.prob.steps.length-1].choices.indexOf(n)>=0));
  const pick=(good,i)=>{ const r=run(), st=r.prob.steps[i]; S.cpSkillPick(i,good?st.answer:st.choices.find(c=>c!==st.answer)); };
  pick(true,r3.prob.steps.length-1); S.cpSkillCheckTry(); ok("a right ✍️ try: ✓ All right!, and the credit shows", run().checked.ok&&/All right!/.test(d.G.content)&&/Picture: /.test(d.G.content));
  S.cpSkillNextTry(); const r4=run(); r4.prob.steps.forEach((s,i)=>{ if(i>=r4.from) pick(true,i); }); S.cpSkillCheckTry();
  ok("two right in a row: up to 💪 on your own", run().st.stage==="solo"&&/Next: on your own!/.test(d.G.content));
  S.cpSkillNextTry(); const r5=run(), last=r5.prob.steps.length-1, wrongName=r5.prob.steps[last].choices.find(c=>c!==r5.prob.item.name);
  ok("💪 on your own: every step hers; the look-alike list behind 'Show the chart'", r5.stage==="solo"&&r5.from===0&&/Show the chart/.test(d.G.content)&&r5.prob.part.tag==="bark");
  r5.prob.steps.forEach((s,i)=>{ if(i<last) pick(true,i); }); S.cpSkillPick(last,wrongName); S.cpSkillCheckTry();
  const code="name:bark:"+I.cpiiSlug(r5.prob.item.name)+"~"+I.cpiiSlug(wrongName);
  ok("a wrong name is saved as the part, the tree and the look-alike picked — and said in words", run().checked.miss===code&&d.G.content.indexOf("telling the "+r5.prob.item.name+" by its bark (took it for the "+wrongName+")")>0, run().checked);
  const before=d._envs.writes.length; S.cpSkillNextTry(); const r6=run(); r6.prob.steps.forEach((s,i)=>pick(true,i)); S.cpSkillCheckTry(); S.cpSkillNextTry();
  const W1=d._envs.writes.slice(before), w1=W1[0]||{};
  ok("the 6th try ends the sitting: ONE write, an update on mastery with maya_skills/nc_envirothon/forestry:tree_parts and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&Object.keys(w1.val).length===2&&Object.keys(w1.val).some(k=>k==="maya_skills/nc_envirothon/"+FBT)&&Object.keys(w1.val).some(k=>/^studyLog\/maya\/skills\/\d{8}$/.test(k)), W1.map(x=>[x.op,x.path]));
  const st=w1.val["maya_skills/nc_envirothon/"+FBT];
  ok("the state: on your own, the look-alike miss counted by its code", st.stage==="solo"&&st.miss[code]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo");
  const sum=S.cpSkillSummary(K,d.masteryData,T0), n=sec=>S.cpSkillList().filter(s=>s.section===sec).length;
  ok("summary.skills counts it: Forestry stage solo with the miss code; each section's total = its skills", sum.forestry.stage[FBT]==="solo"&&sum.forestry.miss[FBT][code]===1&&["forestry","aquatics","wildlife"].every(sec=>sum[sec].total===n(sec)));
  ok("the 'skills learned' line counts the new skills (📅 Pace and the station rows)", ["forestry","aquatics","wildlife"].every(sec=>S.cpSkillPaceLine({skills:sum},sec)==="skills learned 0 of "+n(sec)));
  ok("the round stays on this device only (in memory, no write)", I._cpii.round[FBT]==="bark"&&!d._envs.writes.some(x=>/round/.test(JSON.stringify(x.val||""))));
  S.cpSkillQuit(); }

console.log("\n── the teacher: photos by part, the classmates' counts, the look-alike that fooled them ──");
{ const d=demo("teacher"), S=d.S, I=d.I; d.envcView("setup");
  ok("🏫 Class setup ▸ 🧩 Skills: the three ID-by-part skills, type id, core", ["Trees by part","Stream bugs by picture","Animals and their signs"].every(t=>d.G.content.indexOf(t)>0)&&/id · core/.test(d.G.content));
  const C1=I.cpIdPhotoCount(Object.assign({fb:FBT},TREES)), C2=I.cpIdPhotoCount(Object.assign({fb:FBW},ANIM));
  ok("…under each, photos by part from the pool ('Bark 24 of 24 · Twig 0 of 24 …')", d.G.content.indexOf("🖼 Photos by part: "+C1.map(c=>c.part.label+" "+c.have+" of "+c.total).join(" · "))>0&&d.G.content.indexOf("🖼 Photos by part: "+C2.map(c=>c.part.label+" "+c.have+" of "+c.total).join(" · "))>0);
  const tw=C1.find(c=>c.part.tag==="twig");
  ok("…and what still needs one: each twig-less and fruit-less tree by name, the animals missing a track / skull / pelt", d.G.content.indexOf("Needs a photo · <b>Twig</b>: "+tw.need.join(", "))>0&&tw.have>0&&C1.find(c=>c.part.tag==="fruit").need.every(n=>d.G.content.indexOf(n)>0)&&C2.filter(c=>c.need.length).every(c=>d.G.content.indexOf("Needs a photo · <b>"+c.part.label+"</b>")>0)&&/A round skips an item part with no photo/.test(d.G.content));
  const studs=d.envcStudents(), withS=studs.filter(x=>x.summary), n=sec=>S.cpSkillList().filter(s=>s.section===sec).length;
  ok("every classmate's summary counts the new skills in each section", withS.length>0&&withS.every(x=>["forestry","aquatics","wildlife"].every(sec=>x.summary.skills[sec].total===n(sec)))&&withS.every(x=>x.summary.skills.forestry.stage[FBT]&&x.summary.skills.wildlife.stage[FBW]&&x.summary.skills.aquatics.stage[FBB]));
  const cal=studs.find(x=>x.sid==="walker_caleb");
  ok("📅 Pace's line reads the summaries: Caleb learned all of Wildlife's skills", S.cpSkillPaceLine(cal.summary,"wildlife")==="skills learned "+n("wildlife")+" of "+n("wildlife"));
  const rows=S.cpSkillFoldRows(studs), tr=rows.find(r=>r.sk.fb===FBT), bg=rows.find(r=>r.sk.fb===FBB);
  ok("the Skills fold: Trees by part's most-missed step is the look-alike — 'telling the Loblolly Pine by its bark (took it for the Shortleaf Pine) (3)'", tr&&tr.top==="name:bark:loblolly-pine~shortleaf-pine"&&tr.topN===3&&/Most missed step: telling the Loblolly Pine by its bark \(took it for the Shortleaf Pine\) \(3\)/.test(d.G.content));
  ok("…and the stream bugs': the mayfly taken for the stonefly", bg&&bg.top==="name:live:mayfly-nymph~stonefly-nymph"&&/telling the Mayfly nymph by its picture \(took it for the Stonefly nymph\)/.test(d.G.content));
  ok("the demo writes nothing (the seed is in memory)", d._envs.writes.length===0); }

console.log("\n── a live kid: the skills from the catalog entry ──");
{ const w=W({w:{fam:FAM,remote:{["classSkills/"+CID]:{}}}}), S=w.S; w.initFb();
  Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Soils and Land Use · Terms":true}};
  const L=S.cpSkillList().map(s=>s.fb);
  ok("no demo list: CPU_UNITS (the compiled unit) carries the three ID-by-part skills", [FBT,FBB,FBW].every(f=>L.indexOf(f)>=0)&&S.cpSkillsFor(K).filter(s=>s.data&&s.data.kind==="parts").length===PARTS.length, L);
  ok("the door shows them on her study page", ["Trees by part","Stream bugs by picture","Animals and their signs"].every(t=>S.cpSkillStudyWrap(K,"BODY").indexOf(t)>0));
  ok("a live problem comes from the repo photos (no class layer): a tree part with a photo, never a twig", (()=>{ S.cpSkillOpen(K,FBT,11); const r=S._cpsk.run, o=!!r&&!!r.prob.photo&&r.prob.part.tag!=="twig"&&/^envirothon\/pics\//.test(r.prob.photo.url); S._cpsk.run=null; return o; })());
  ok("cpIdDemoSeed does nothing off the demo", w.I.cpIdDemoSeed({cid:CID,students:{}})===false); }

console.log("\n── Howe and Lincoln: nothing on ──");
{ const w=W({w:{fam:HOWE}}), I=w.I, S=w.S;
  ok("cpiiOn false; no skills listed; no photo counts; the demo seed refuses; Lincoln's summary has no skills", I.cpiiOn()===false&&S.cpSkillList().length===0&&I.cpIdPhotoCount(Object.assign({fb:FBT},TREES)).every(c=>c.have===0)&&I.cpIdDemoSeed({cid:"x",students:{}})===false&&S.cpSkillSummary("lincoln",{lincoln_skills:{nc_envirothon:{[FBT]:{learned:true}}}},T0)===null);
  ok("no read, write, listener or element", w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0&&w.G.created.length===0);
  const a=W({w:{fam:HOWE}}), b=W({id:false,w:{fam:HOWE}});
  ok("the world without this block boots the same for Howe (nothing created, read or written either way)", JSON.stringify([a.G.reads,a.G.writes,a.G.created.length])===JSON.stringify([b.G.reads,b.G.writes,b.G.created.length])&&b.I===null); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
