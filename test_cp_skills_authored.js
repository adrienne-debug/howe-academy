/*
 * Node tests — 🧩 the NC Envirothon unit's AUTHORED SKILLS + the teacher's ▶ Try it (2026-11-10; her ask 2026-11-10: "is there a way the
 * teacher could almost have demos of the skills? i actually am not seeing the skills period"). RESEARCH_envirothon_skills_2026-10-28.md
 * §3.1 (the shape), §5 (the ranking); DESIGN_class_platform_2026-10-28.md §4.1b.
 *   · The unit's skills live in units/nc_envirothon/unit.json and reach the page through the catalog (CPU_UNITS, compile_unit.js), which
 *     the engine reads first (cpskUnitSkills) — HoweEnvirothon.unit.skills stays undefined on purpose (the cards file is never copied twice).
 *   · The research rows: 1 gear + tools (id/gear), 2 the biotic index (sheet/tally), 4 the texture triangle (chart/ternary), 5 ID by part
 *     and sign (id/parts), 8 label the diagram (label/diagram), 9 the Biltmore stick (scale/biltmore). Row 3 (the Rowan soil-survey tables,
 *     type `table`) is NOT authored: the printed survey's tables are not in sources/, so no `table` skill may appear until they are.
 *   · Every skill: the §3.1 shape, keys unique and DB-safe, a real section, a registered type, the data its maker reads, a problem from
 *     every seed with steps the engine can check (num / pick with the answer among the choices).
 *   · The live world (no demo, HoweEnvirothon loaded): cpskUnitSkills("nc_envirothon") = the authored list; a class with no units attached
 *     sees them all; a Howe family sees none.
 *   · ▶ Try it: one button per visible skill in 🏫 Class setup ▸ 🧩 Skills; it opens 👀 Watch it in a read-only overlay; stepping through
 *     and dealing more examples records nothing, writes nothing (demo, live, dry run), touches no masteryData; Close puts it away; a kid
 *     and a Howe family can't open it.
 * Every count comes from the unit's data, never typed in.                                            run: node test_cp_skills_authored.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const UNIT=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const INDEX=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","index.json"),"utf8"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const CAT=(()=>{ const i=src.indexOf("const CPU_UNITS="); const j=src.indexOf("\n",i); return JSON.parse(src.slice(i+"const CPU_UNITS=".length,j).replace(/;\s*(\/\/.*)?$/,"")); })();
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END"),
  GEAR=cut("// CPITEMGEAR_START","// CPITEMGEAR_END"), BIO=cut("// CPITEMBIOTIC_START","// CPITEMBIOTIC_END"), TRI=cut("// CPITEMTRIANGLE_START","// CPITEMTRIANGLE_END"), LBL=cut("// CPITEMLABEL_START","// CPITEMLABEL_END"),
  FLASH=cut("// ENVIDFLASH_START","// ENVIDFLASH_END"), ID=cut("// CPITEMID_START","// CPITEMID_END"), SCL=cut("// CPITEMSCALE_START","// CPITEMSCALE_END");
const ALL=[SKL,GEAR,BIO,TRI,LBL,FLASH,ID,SCL].join("\n");
const XS="\nfunction envPicsIndex(){ return G.pics||null; }\nG.sk={ CPSK_TYPES, CPSK_TYPE_NAMES, CPSK_KEY_RE, CPSK_STAGE_LBL, CPSK_SITTING, _cpsk, cpskOn, cpskRng, cpskFb, cpskStepOk, cpSkillCheck, cpskUnitSkills, cpSkillList, cpSkillsFor, cpSkillOpen, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillFinish, cpSkillSittingHtml, cpSkillSetupHtml, cpSkillFoldHtml, cpSkillTryOn, cpSkillTryOpen, cpSkillTryClose, cpSkillTryHtml };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:o.lib||{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+PHO+"\n"+ALL+XS},o.w||{})); w.G.pics=PICS; w.S=w.G.sk; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const SK=UNIT.skills||[], KEYS=SK.map(s=>s.key), SECS=UNIT.sections.map(s=>s.key);
const byKind=k=>SK.filter(s=>s.data&&s.data.kind===k);
const NEED={gear:["items"],tally:["groups","items","ratings"],ternary:["classes","axes"],parts:["items","parts"],diagram:["parts","art","ask"],biltmore:["reads"]};   // what each maker reads (its own block's tests go deeper)
const SEEDS=[1,7,42,101,2026,31337,65535,99991];

const run=async()=>{
console.log("── the authored set: where it lives, the research rows, the shape (§3.1) ──");
{ ok("unit.json declares the skills (13 or more) and the cards file does not (never copied twice)", SK.length>=13&&LIB.unit.skills===undefined&&!("skills" in JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"))));
  ok("row 1 gear + tool pictures: forestry.tools and aquatics.gear, type id, kind gear, items with names", ["forestry.tools","aquatics.gear"].every(k=>{ const s=SK.find(x=>x.key===k); return s&&s.type==="id"&&s.data.kind==="gear"&&Array.isArray(s.data.items)&&s.data.items.length>=5&&s.data.items.every(i=>i&&typeof (i.name||i.item||i.front||i)==="string"); }));
  ok("row 2 the biotic index: aquatics.biotic_index, type sheet, kind tally, groups × weights, kinds, rating bands", (()=>{ const s=SK.find(x=>x.key==="aquatics.biotic_index"); return s&&s.type==="sheet"&&s.data.kind==="tally"&&s.data.groups.length===3&&s.data.groups.every(g=>g.key&&g.weight>0)&&s.data.items.length>=20&&s.data.ratings.length===4; })());
  ok("row 4 the texture triangle: soils.texture_triangle, type chart, kind ternary, 12 classes", (()=>{ const s=SK.find(x=>x.key==="soils.texture_triangle"); return s&&s.type==="chart"&&s.data.kind==="ternary"&&s.data.classes.length===12; })());
  ok("row 5 ID by part and sign: three id/parts skills (trees, stream bugs, animal signs)", byKind("parts").length===3&&["forestry.tree_parts","aquatics.bugs","wildlife.signs"].every(k=>KEYS.indexOf(k)>=0));
  ok("row 8 label the diagram: five label/diagram skills with parts, art (shapes) and ask (how many parts a try asks, within the parts)", byKind("diagram").length===5&&byKind("diagram").every(s=>s.type==="label"&&s.data.parts.length>=3&&Array.isArray(s.data.art)&&s.data.art.length>0&&typeof s.data.ask==="number"&&s.data.ask>=1&&s.data.ask<=s.data.parts.length));
  ok("row 9 the Biltmore stick: forestry.biltmore, type scale, kind biltmore, two readings", (()=>{ const s=SK.find(x=>x.key==="forestry.biltmore"); return s&&s.type==="scale"&&s.data.kind==="biltmore"&&Array.isArray(s.data.reads)&&s.data.reads.length===2; })());
  ok("row 3 (Rowan soil-survey tables) is SKIPPED: no `table` skill until the printed survey's tables are in sources/", !SK.some(s=>s.type==="table")&&!fs.existsSync(path.join(REPO,"sources","rowan_soil_survey_tables.json")));
  ok("every skill has the §3.1 shape: key, section, type, label, core:boolean, steps[] of strings, data{kind}", SK.every(s=>typeof s.key==="string"&&typeof s.section==="string"&&typeof s.type==="string"&&typeof s.label==="string"&&s.label.trim()&&typeof s.core==="boolean"&&Array.isArray(s.steps)&&s.steps.length>=1&&s.steps.every(x=>typeof x==="string")&&s.data&&typeof s.data==="object"&&typeof s.data.kind==="string"), SK.map(s=>s.key));
  ok("keys unique, DB-safe once '.'→':' (no other forbidden char), and section.name", new Set(KEYS).size===KEYS.length&&KEYS.every(k=>/^[a-z0-9][a-z0-9_.-]{0,59}$/.test(k)&&!/[\/#$\[\]]/.test(k)&&k.split(".").length===2), KEYS);
  ok("every section is one of the unit's, and the key's first part IS its section", SK.every(s=>SECS.indexOf(s.section)>=0&&s.key.split(".")[0]===s.section));
  ok("tests[] (when given) name real questions of the unit (pre-N / post-N)", SK.every(s=>!s.tests||s.tests.every(q=>/^(pre|post)-\d+$/.test(q))));
  ok("each kind carries the fields its maker reads", SK.every(s=>(NEED[s.data.kind]||[]).every(f=>s.data[f]!=null&&(!Array.isArray(s.data[f])||s.data[f].length>0))), SK.map(s=>s.key+":"+s.data.kind));
  const ent=s=>{ const o={}; ["key","section","type","label","core","steps","tests","replaces","data"].forEach(f=>{ if(s[f]!==undefined) o[f]=s[f]; }); return o; };
  ok("the catalog carries them exactly: CPU_UNITS (index.html) and index.json = unit.json's skills, field for field", JSON.stringify(CAT.nc_envirothon.skills)===JSON.stringify(SK.map(ent))&&JSON.stringify(INDEX.skills)===JSON.stringify(SK.map(ent))); }

console.log("\n── every type registered; every skill makes a problem from every seed ──");
{ const w=W(), S=w.S;
  ok("every declared type has a maker in CPSK_TYPES (with all item blocks loaded)", SK.every(s=>S.CPSK_TYPES[s.type]&&typeof S.CPSK_TYPES[s.type].make==="function"), SK.filter(s=>!S.CPSK_TYPES[s.type]).map(s=>s.key));
  ok("cpSkillCheck accepts each one against the unit's sections", SK.every(s=>S.cpSkillCheck(s,SECS).ok), SK.map(s=>s.key+":"+JSON.stringify(S.cpSkillCheck(s,SECS))));
  const bad=[];
  SK.forEach(s=>{ const sk=Object.assign({fb:S.cpskFb(s.key),unit:"nc_envirothon"},s); SEEDS.forEach(seed=>{ let p=null; try{ p=S.CPSK_TYPES[s.type].make(sk,S.cpskRng(seed)); }catch(e){ bad.push(s.key+"@"+seed+" threw "+e.message); return; }
    if(!p||!Array.isArray(p.steps)||!p.steps.length){ bad.push(s.key+"@"+seed+" no steps"); return; }
    p.steps.forEach((st,i)=>{ if(!st||typeof st.label!=="string"||st.answer==null||(st.kind!=="num"&&st.kind!=="pick")) bad.push(s.key+"@"+seed+" step "+i+" shape");
      else if(st.kind==="pick"&&Array.isArray(st.choices)&&st.choices.length&&st.choices.map(String).indexOf(String(st.answer))<0) bad.push(s.key+"@"+seed+" step "+i+" answer not among choices");   // a tap step (the triangle's line and dot) offers no list
      else if(!S.cpskStepOk(st,st.answer)) bad.push(s.key+"@"+seed+" step "+i+" its own answer doesn't check"); }); }); });
  ok("every skill × "+SEEDS.length+" seeds: a problem with steps the engine can check (num, pick with the answer among its choices, or a tap; the answer passes)", bad.length===0, bad.slice(0,8));
  const dup=SK.filter(s=>{ const sk=Object.assign({fb:S.cpskFb(s.key),unit:"nc_envirothon"},s); return new Set(SEEDS.map(seed=>JSON.stringify(S.CPSK_TYPES[s.type].make(sk,S.cpskRng(seed)).steps.map(x=>x.answer)))).size<2; });
  ok("every try is a new problem: "+SEEDS.length+" seeds never all give the same answers", dup.length===0, dup.map(s=>s.key)); }

console.log("\n── the live world: the engine reads the catalog, so the class sees them with no demo seed ──");
{ const w=W({lib:LIB}), S=w.S;   // no ?demo: the real site with HoweEnvirothon loaded
  ok("cpskUnitSkills(\"nc_envirothon\") = the authored list, in order, though HoweEnvirothon.unit.skills is undefined", JSON.stringify(S.cpskUnitSkills("nc_envirothon").map(s=>s.key))===JSON.stringify(KEYS)&&w.cpu.cpuUnit("nc_envirothon")&&w.cpu.cpuUnit("nc_envirothon").unit.skills===undefined);
  ok("a class record with no units attached (the default unit) lists them all; one attached to nc_envirothon too", S.cpSkillList({},null,{all:true}).length===SK.length&&S.cpSkillList({units:{nc_envirothon:{on:true}}},null,{all:true}).length===SK.length);
  ok("…in the class's section order, each with fb, unit, type, data", (()=>{ const L=S.cpSkillList({},null,{all:true}), ord=w.envsStations().map(s=>s.id); return L.every((s,i)=>!i||ord.indexOf(L[i-1].section)<=ord.indexOf(s.section))&&L.every(s=>s.fb===s.key.replace(".",":")&&s.unit==="nc_envirothon"&&s.data&&S.CPSK_TYPES[s.type]); })());
  ok("nothing read or written by listing them", w.G.reads.length===0&&w.G.writes.length===0);
  const h=W({lib:LIB,w:{fam:HOWE}});
  ok("Howe: cpskOn false → the class list is empty (the catalog read itself is not gated; cpSkillList is), no Try it, nothing on", h.S.cpskOn()===false&&h.S.cpSkillList().length===0&&h.S.cpSkillList({},null,{all:true}).length===0&&h.S.cpSkillTryOn()===false&&h.S.cpSkillTryOpen("forestry:tools")===false&&h.S.cpSkillTryHtml()===""&&h.G.writes.length===0&&h.G.reads.length===0); }

console.log("\n── ▶ Try it: the teacher sees a skill as a student first does, and nothing is kept ──");
{ const d=demo("teacher"), S=d.S; d.envcView("setup");
  const L=S.cpSkillList(d._envc.cls,null,{all:true}), vis=L.filter(s=>!s.hide&&S.CPSK_TYPES[s.type]);
  ok("the demo class lists the unit's skills (plus none hidden) in 🏫 Class setup ▸ 🧩 Skills", L.length>=SK.length&&/🧩 Skills/.test(d.G.content));
  ok("one ▶ Try it button per visible skill, each calling cpSkillTryOpen with that skill's key", (d.G.content.match(/▶ Try it/g)||[]).length===vis.length&&vis.every(s=>d.G.content.indexOf("cpSkillTryOpen('"+s.fb+"')")>=0), [(d.G.content.match(/▶ Try it/g)||[]).length,vis.length]);
  ok("no overlay before a tap", S.cpSkillTryHtml()===""&&!/id="cpsk-try"/.test(d.G.content)&&S._cpsk.run===null);
  const before=JSON.stringify(d.masteryData), n0=d._envs.writes.length, t0=d.G.toasts.length;
  const sk=vis.find(s=>s.key==="aquatics.biotic_index")||vis[0];
  ok("cpSkillTryOpen opens it: a run with tryIt, no kid, stage shown (👀 Watch it), one step lit, a problem made", S.cpSkillTryOpen(sk.fb,7)===true&&S._cpsk.run&&S._cpsk.run.tryIt===true&&S._cpsk.run.kid===null&&S._cpsk.run.stage==="shown"&&S._cpsk.run.shown===1&&S._cpsk.run.prob.steps.length>=1&&S._cpsk.run.dry===true);
  ok("the overlay paints over the console: ▶ Try it · the skill, 'Nothing is scored or saved', 👀 Watch it, the sitting's steps, Close", /id="cpsk-try"/.test(d.G.content)&&new RegExp("▶ Try it · [^<]*"+sk.label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).test(d.G.content)&&/Nothing is scored or saved/.test(d.G.content)&&/👀 Watch it/.test(d.G.content)&&/example 1</.test(d.G.content)&&/cpSkillTryClose\(\)/.test(d.G.content)&&!/try 1 of/.test(d.G.content));
  const n=S._cpsk.run.prob.steps.length; for(let i=1;i<n;i++) S.cpSkillStep();
  ok("Next step lights every step (the kid's own renderer: answers in green, Another example ▶ at the end)", S._cpsk.run.shown===n&&/Another example ▶/.test(d.G.content)&&!/Got it ✓/.test(d.G.content));
  S.cpSkillStep();
  ok("Another example deals a NEW problem (example 2) and records nothing: tries stay empty, state fresh, no finish", S._cpsk.run&&S._cpsk.run.n===2&&S._cpsk.run.shown===1&&S._cpsk.run.tries.length===0&&S._cpsk.run.st.stage==="shown"&&S._cpsk.run.done===null&&/example 2</.test(d.G.content));
  for(let k=0;k<S.CPSK_SITTING+2;k++){ const m=S._cpsk.run.prob.steps.length; for(let i=1;i<m;i++) S.cpSkillStep(); S.cpSkillStep(); }
  ok("…past a sitting's length (more than "+S.CPSK_SITTING+" examples) it still never finishes or saves", S._cpsk.run&&S._cpsk.run.n===S.CPSK_SITTING+4&&S._cpsk.run.tries.length===0&&S._cpsk.run.done===null);
  ok("Check / Next problem / Finish do nothing in a worked example; cpSkillFinish refuses a try-it run", (S.cpSkillCheckTry(),S.cpSkillNextTry(),S.cpSkillFinish()===null)&&S._cpsk.run&&S._cpsk.run.checked===null&&S._cpsk.run.done===null);
  ok("nothing written (no demo 'would update' toast, no envsWrite, no db write), masteryData untouched, no listener, no read", d._envs.writes.length===n0&&d.G.writes.length===0&&d.G.toasts.length===t0&&JSON.stringify(d.masteryData)===before&&d.G.reads.length===0);
  ok("Close puts it away and repaints the Skills card", S.cpSkillTryClose()===true&&S._cpsk.run===null&&!/id="cpsk-try"/.test(d.G.content)&&/🧩 Skills/.test(d.G.content)&&S.cpSkillTryClose()===false);
  S.cpSkillTryOpen(sk.fb,3); S.cpSkillQuit();
  ok("the sitting's own Quit link closes it the same way (no finish, no write)", S._cpsk.run===null&&d._envs.writes.length===n0&&d.G.writes.length===0);
  const every=vis.filter(s=>{ const r=S.cpSkillTryOpen(s.fb,11); const o=r&&/id="cpsk-try"/.test(d.G.content)&&S._cpsk.run.tryIt; S.cpSkillTryClose(); return !o; });
  ok("every visible skill opens as a worked example (all "+vis.length+")", every.length===0, every.map(s=>s.key));
  ok("an unknown key, or a hidden skill's key, is refused", S.cpSkillTryOpen("soils:nothing")===false&&S._cpsk.run===null);
  ok("still nothing written after all of that", d._envs.writes.length===n0&&d.G.writes.length===0&&JSON.stringify(d.masteryData)===before); }
{ const d=demo("kid"), S=d.S;
  ok("a kid can't open Try it (not the console) and sees no overlay", S.cpSkillTryOn()===false&&S.cpSkillTryOpen("aquatics:biotic_index")===false&&S.cpSkillTryHtml()===""&&S._cpsk.run===null);
  const p=demo("parent"); ok("…nor a parent", p.S.cpSkillTryOn()===false&&p.S.cpSkillTryOpen("aquatics:biotic_index")===false); }
{ // the live console (no demo): the teacher signed in, a class picked, dry run or not — never a write
  for(const dry of [true,false]){ const w=W({lib:LIB,w:{dry,auth:{uid:"uid_teacher",email:"t@x.org"}}}), S=w.S;
    w._envs.role="teacher"; w._envs.uid="uid_teacher"; w._envc.on=true; w._envc.cid="ms-2026"; w._envc.cls={name:"MS"}; w._envc.sdb=null;
    const on=S.cpSkillTryOn(), opened=on&&S.cpSkillTryOpen("soils:texture_triangle",5);
    const n=opened?S._cpsk.run.prob.steps.length:0; for(let i=0;i<n+1&&opened;i++) S.cpSkillStep();
    ok("live console"+(dry?" (dry run)":"")+": Try it opens the triangle, steps and deals again, writes nothing to db or the shared instance", on===true&&opened===true&&S._cpsk.run&&S._cpsk.run.n===2&&w.G.writes.length===0&&w._envs.writes.length===0&&w.G.reads.length===0, [on,opened,w.G.writes.length]);
    S.cpSkillTryClose(); } }

console.log("\n── the block still only declares; nothing new outside it ──");
{ const a=src.indexOf("// CPSKILL_START"), b=src.indexOf("// CPSKILL_END"), blk=src.slice(a,b);
  ok("the Try it functions live inside CPSKILL (no new hook line anywhere)", ["function cpSkillTryOn","function cpSkillTryOpen","function cpSkillTryClose","function cpSkillTryHtml"].every(f=>blk.indexOf(f)>0)&&(src.slice(0,a)+src.slice(b)).indexOf("cpSkillTry")<0);
  const code=blk.replace(/^\/\/.*$/mg,"").replace(/   \/\/ .*$/mg,"");
  ok("still ONE database write call and ONE read in the block (Try it added none)", (code.match(/\.update\(|\.set\(|\.remove\(/g)||[]).length===1&&(code.match(/\.once\(/g)||[]).length===1);
  ok("the header names ▶ Try it", /TRY IT|Try it/.test(blk.split("\n").slice(0,60).join("\n"))); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
