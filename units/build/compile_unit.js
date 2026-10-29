#!/usr/bin/env node
// 📦 CPUNIT — compile one unit of the class platform (DESIGN_class_platform_2026-10-28.md §4.1, §4.3, §10, §11; PR 3). Her words
// 2026-10-28: "a whole new class setup and then unit and test is data pulled so other classes can also use this design when a unit or
// units are brought in" · "we can use this setup while we're planning it to make sure that we can pull in any unit and turn it into any
// kind of class".
//   node units/build/compile_unit.js <unitId>            check every rule, then write units/<id>/COUNTS.json + index.json (+ units/<id>.js)
//   node units/build/compile_unit.js <unitId> --check    check every rule and that COUNTS.json / index.json are current; writes nothing
//   node units/build/compile_unit.js --all [--check]     every unit under units/
// Reads units/<id>/unit.json and units/<id>/tests.json. A unit's cards sit on its decks (decks[].cards) or come `from` one other JSON
// (NC Envirothon's stay in envirothon/nc_envirothon_unit.json, so the 1.5 MB is never copied twice); its tests sit inline
// ({sections:{<key>:{pre,post}}}) or come `from` one other JSON (ENVTEST's forms). Every question gets its stable id <form>-<n>.
// The compiled file: units/<id>.js registering window.HoweUnits[<id>] = {id, ver, index, unit, tests} — or, for a unit with
// `build.file` (NC Envirothon: envirothon.js, window.HoweEnvirothon), the file its own builder already writes; then this script only
// checks that file is current (same decks, same card counts, same forms).
// THE RULES (each one an error that stops the build; test_cp_unit.js runs them):
//   1. ids and keys: the unit id is [a-z][a-z0-9_]*; every section key and deck key is safe as a Firebase key (no . # $ [ ] / or
//      control characters). A card front must be too, unless the unit says rules.codedFronts (its backs then save under the app's coded
//      key, mastDefKey — NC Envirothon has 110 such fronts).
//   2. deck keys and section keys are unique across EVERY unit in the repo (a deck key is the kid's subject, a section key the test path).
//   3. every deck names a section of the unit; every section has a deck; labels only use the known words; features are booleans.
//   4. every card has a front, a back and a source; `order` is a whole number, unique in its deck.
//   5. order is append-only against the last COUNTS.json: no shipped order is dropped or renumbered, new cards take orders above the old
//      top (a card's class-layer key is its order, §6.2). A shipped deck can't disappear.
//   6. tests: every section key is the unit's; question ids are unique in their form; every answer points at a choice.
//   7. --check: COUNTS.json, index.json and the unit's entry in index.html's CPU_UNITS are exactly what this run makes.
// 📚 CPCARDSSEE (PR 9, §8.4): QUESTION ↔ CARD LINKS. Each question's cards are worked out here, once, and written to units/<id>/LINKS.json
// ({<section>:{<questionId>:["<deckKey>#o<order>", …]}}), so they are reviewed in the repo like the cards themselves. A unit's compiled
// units/<id>.js carries them on each question as `cards`; a unit with build.file gets them from its own builder (NC Envirothon:
// build_envirothon_js.py reads LINKS.json into envirothon.js), and --check fails while that file's links differ. The rule (the mockup's
// matcher, the same 515 links): a TERM links when its front is in the question or the keyed answer (whole words, any case, 4+ letters);
// an ITEM card (ID) when its item is; a FACT when the keyed answer is in its back or its back in the keyed answer. A card can link to a
// question of its own section, or of any section with no tests of its own (Envirothon's General concepts). The matcher only proposes.
// 🧰 CPITEMGEAR (2026-10-29, the first real skill; DESIGN_class_platform_2026-10-28.md §4.1b, §13 row 26): a unit's `skills` (unit.json,
// beside its decks) are checked here (rule 8) and ride in the catalog entry (index.json / CPU_UNITS, which the 🧩 skill engine reads
// first) and in COUNTS.json (key → section, type, items, core). 8. every skill key is [a-z0-9][a-z0-9_.-]* and unique, its section is the
// unit's, its type one of the engine's, its label set, its tests ids of that section's forms, its replaces "<deck>#o<order>" of a real
// card; a `gear` skill (type id, data.kind "gear") has 4+ items, each with a unique name, a use, a source, and look-alikes that are items
// of the same skill. A note (not an error) lists the gear items the repo's photo set (envirothon/pics/index.json) has no photo for.
// 🌲 CPITEMID (2026-10-29; RESEARCH_envirothon_skills_2026-10-28.md §4.4, §4.6, §4.7): an ID-by-part skill (type id, data.kind "parts") has
// 1+ parts {tag (a photo tag of the pool), label, tags?} and 4+ items {name, like:[look-alikes, items of the same skill], parts?:[the
// part tags it can show, default all], tell?:{<part>: clue}, src?:{<part>:["<deck>#o<order>", …]}} — every clue names the real cards it
// was taken from. Its note lists the item parts the repo
// set has no photo for (a round skips those until one is added to the pool).
// Nothing here touches a database. The catalog entry (index.json) is what 📦 Units ▸ Publish writes to units/<id>/index (§4.3), and the
// same object is CPU_UNITS[<id>] in index.html: a plain run REWRITES that one line (`const CPU_UNITS={…};` in the CPUNIT block), so a data
// change (a trim, a core add) is the data files + one compile run, never a hand edit of index.html (2026-10-28, after Trim 1 met PR 3).
"use strict";
const fs=require("fs"), path=require("path");
const REPO=path.resolve(__dirname,"..","..");
const LABEL_KEYS=["section","sections","pre","post","item","concept"];
const FEATURE_KEYS=["teams","boards","specialists","idFlash","mockRun"];
const SKILL_TYPES=["chart","table","sheet","label","id","scale","mock","rubric"], SKILL_KEY=/^[a-z0-9][a-z0-9_.-]{0,59}$/;   // 🧰 CPITEMGEAR: the engine's CPSK_TYPE_NAMES / CPSK_KEY_RE
const PHOTO_TAGS=["leaf","bark","twig","fruit","flower","cone","needle","track","skull","pelt","live","specimen","gear","drawing","diagram"];   // 🌲 CPITEMID: CPPHOTOS' CPPH_TAGS
const FB_BAD=/[.#$\[\]\/\u0000-\u001f\u007f]/;
function fbSafe(k){ return typeof k==="string"&&k.length>0&&Buffer.byteLength(k,"utf8")<=768&&!FB_BAD.test(k); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
// [1,2,3,5,6] → "1-3,5-6" (and back): the shipped orders, kept small in COUNTS.json
function ranges(nums){ const a=[...new Set(nums)].sort((x,y)=>x-y), out=[]; for(let i=0;i<a.length;){ let j=i; while(j+1<a.length&&a[j+1]===a[j]+1) j++; out.push(a[i]===a[j]?String(a[i]):a[i]+"-"+a[j]); i=j+1; } return out.join(","); }
function unranges(s){ const out=[]; String(s||"").split(",").filter(Boolean).forEach(r=>{ const m=/^(\d+)(?:-(\d+))?$/.exec(r); if(!m) return; const a=+m[1], b=m[2]?+m[2]:a; for(let i=a;i<=b;i++) out.push(i); }); return out; }
function unitIds(root){ const d=path.join(root,"units"); if(!fs.existsSync(d)) return []; return fs.readdirSync(d).filter(n=>fs.existsSync(path.join(d,n,"unit.json"))).sort(); }
// the unit with its cards on its decks
function loadUnit(root,id){
  const dir=path.join(root,"units",id), u=readJson(path.join(dir,"unit.json"));
  let from=null; if(u.cards&&u.cards.from){ const src=readJson(path.join(root,u.cards.from)); from={}; (src.decks||[]).forEach(d=>{ if(d&&d.key) from[d.key]=d.cards||[]; }); }
  const decks=(u.decks||[]).map(d=>Object.assign({},d,{cards:from?(from[d.key]||null):(d.cards||null)}));
  let tests=null; const tp=path.join(dir,"tests.json");
  if(fs.existsSync(tp)){ const t=readJson(tp); tests={ver:t.ver||1,sections:{}};
    const sections=t.from?(readJson(path.join(root,t.from)).stations||{}):(t.sections||{});
    Object.keys(sections).forEach(k=>{ const st=sections[k]||{}, rec={}; if(st.label) rec.label=st.label; if(st.emoji) rec.emoji=st.emoji;
      ["pre","post"].forEach(f=>{ const fm=st[f]; if(!fm) return; const r={form:fm.form||"",source:fm.source||"",items:(fm.items||[]).map(it=>({id:it.id||(f+"-"+it.n),n:it.n,q:it.q,choices:it.choices,ans:it.ans,cite:it.cite||""}))};
        if(fm.note) r.note=fm.note; rec[f]=r; });
      tests.sections[k]=rec; }); }
  const skills=Array.isArray(u.skills)?u.skills:null;   // 🧰 CPITEMGEAR
  return {u,decks,tests,skills,fromCards:!!from};
}
// 📚 CPCARDSSEE: the question → card links (§8.4) — PURE
function linkNorm(x){ return String(x==null?"":x).toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim(); }
function linkHas(needle,hay){ const n=linkNorm(needle); if(n.length<4) return false; return (" "+linkNorm(hay)+" ").indexOf(" "+n+" ")>=0; }
function questionLinks(decks,tests){
  const out={}; if(!tests||!tests.sections) return out; const tested=new Set(Object.keys(tests.sections)), cards=[];
  (decks||[]).forEach(d=>(d.cards||[]).forEach(c=>{ if(c&&Number.isInteger(c.order)) cards.push({id:d.key+"#o"+c.order,s:d.section,kind:c.kind||(c.item?"id":d.kind==="terms"?"term":"fact"),c}); }));
  Object.keys(tests.sections).sort().forEach(k=>["pre","post"].forEach(f=>{ const fm=tests.sections[k][f]; if(!fm) return;
    fm.items.forEach(it=>{ const a=(Array.isArray(it.ans)?it.ans:[it.ans]).filter(i=>Number.isInteger(i)&&i>=0&&i<(it.choices||[]).length), key=a.map(i=>it.choices[i]).join(" "), hay=String(it.q||"")+" "+key;
      const L=cards.filter(x=>{ if(x.s!==k&&tested.has(x.s)) return false;
        if(x.kind==="id") return linkHas(x.c.item,hay);
        if(x.kind==="term") return linkHas(x.c.name,hay);
        return linkNorm(key).length>=4&&(linkHas(key,x.c.def)||linkHas(x.c.def,key)); }).map(x=>x.id);
      (out[k]=out[k]||{})[String(it.id)]=L; }); }));
  return out;
}
// 📤 CPSEND (PR 31, §6.8): a section's Key Concepts, from its cards' `concept` numbers — {id:"k<n>", label}, in the unit's order (the
// order is n itself, so it isn't stored twice: the catalog entry stays under PR 3's 4 KB). The id never uses
// the name (. # $ [ ] / in a name can't break a release key; renaming a Key Concept never changes it). The label is the first card's
// group. A section whose cards carry no concept number has none, and gets 📤 on the section and its decks only.
function sectionConcepts(decks,sec){
  const by={}; (decks||[]).forEach(d=>{ if(d.section!==sec) return; (d.cards||[]).forEach(c=>{ const n=c&&Number(c.concept);
    if(!c||c.concept==null||c.concept===""||!Number.isInteger(n)||n<1) return; if(!by[n]) by[n]={id:"k"+n,label:String(c.group||c.family||("Key Concept "+n))}; }); });
  return Object.keys(by).map(Number).sort((a,b)=>a-b).map(n=>by[n]);
}
// 📤 CPSEND: every key a send-out of this unit may use — section keys, deck keys and <section>~k<n> (units/<id>/RELEASE_KEYS.json; the
// release rules in envirothon/SITE_RULES.json allow exactly the union of every unit's list, test_cp_send.js)
function releaseKeys(idx){ const out=[]; (idx.sections||[]).forEach(s=>{ out.push(s.key); (s.concepts||[]).forEach(k=>out.push(s.key+"~"+k.id)); }); Object.keys(idx.decks||{}).forEach(k=>out.push(k)); return out; }
// the catalog entry (§4.3): small, no cards — the console draws the grid, the ticks and the counts from it
function makeIndex(u,decks,skills){
  const d={}; decks.forEach((x,i)=>{ const c=x.cards||[]; d[x.key]={section:x.section,kind:x.kind||"",mode:x.mode||"flash",n:c.length,core:c.filter(y=>y&&y.core).length,order:i}; });
  const idx={id:u.id,ver:u.ver||1,title:u.title,short:u.short||u.title,emoji:u.emoji||"",
    sections:(u.sections||[]).map((s,i)=>{ const o={key:s.key,label:s.label||s.key,short:s.short||s.label||s.key,emoji:s.emoji||"",order:s.order!=null?s.order:i};
      const k=sectionConcepts(decks,s.key); if(k.length) o.concepts=k; return o; }),   // 📤 CPSEND: the section's Key Concepts (§6.8)
    decks:d,cards:decks.reduce((s,x)=>s+(x.cards||[]).length,0),core:decks.reduce((s,x)=>s+(x.cards||[]).filter(y=>y&&y.core).length,0),
    labels:Object.assign({},u.labels||{}),features:Object.assign({},u.features||{}),file:(u.build&&u.build.file)||("units/"+u.id+".js")};
  if(u.build&&u.build.global) idx.global=u.build.global;
  if(skills&&skills.length) idx.skills=skills.map(skillEntry);   // 🧰 CPITEMGEAR: the skill engine reads a unit's skills from its catalog entry first
  return idx;
}
function makeCounts(u,decks,tests,skills){
  const c={id:u.id,ver:u.ver||1,cards:0,core:0,sections:{},decks:{},tests:{}};
  (u.sections||[]).forEach(s=>{ c.sections[s.key]={cards:0,core:0,decks:0}; });
  decks.forEach(d=>{ const cs=d.cards||[], n=cs.length, core=cs.filter(x=>x&&x.core).length, o=cs.map(x=>x&&x.order).filter(Number.isInteger);
    c.decks[d.key]={section:d.section,n,core,maxOrder:o.length?Math.max(...o):0,orders:ranges(o)}; c.cards+=n; c.core+=core;
    const s=c.sections[d.section]; if(s){ s.cards+=n; s.core+=core; s.decks++; } });
  if(tests) Object.keys(tests.sections).forEach(k=>{ const t=tests.sections[k], r={}; ["pre","post"].forEach(f=>{ if(t[f]) r[f]=t[f].items.length; }); c.tests[k]=r; });
  if(skills&&skills.length){ c.skills={}; skills.forEach(k=>{ const it=skillItems(k); const ip=partItems(k); c.skills[k.key]={section:k.section,type:k.type,core:k.core===true,items:it?it.length:ip?ip.length:0}; }); }   // 🧰 CPITEMGEAR · 🌲 CPITEMID
  return c;
}
// 🧰 CPITEMGEAR: a skill as the catalog carries it (the unit.json record, its keys in a fixed order) — PURE
function skillEntry(k){ const o={}; ["key","section","type","label","core","steps","tests","replaces","data"].forEach(f=>{ if(k[f]!==undefined) o[f]=k[f]; }); return o; }
function skillItems(k){ return (k&&k.data&&k.data.kind==="gear"&&Array.isArray(k.data.items))?k.data.items:null; }
function partItems(k){ return (k&&k.data&&k.data.kind==="parts"&&Array.isArray(k.data.items))?k.data.items:null; }   // 🌲 CPITEMID
// 🌲 CPITEMID: an ID-by-part skill's own checks (inside rule 8) — [errors]; cards = {"<deck>#o<order>":1}
function checkParts(k,at,cards){
  const err=[], E=m=>err.push(m), P=k.data.parts, I=partItems(k)||[], names={}, tags={};
  if(k.type!=="id") E(at+": an ID-by-part skill is type id");
  if(!Array.isArray(P)||!P.length) E(at+": data.parts must list 1 or more parts");
  else P.forEach((p,j)=>{ const pa=at+" part "+(j+1);
    if(!p||PHOTO_TAGS.indexOf(p.tag)<0){ E(pa+": tag must be a photo tag ("+PHOTO_TAGS.join(", ")+")"); return; }
    if(tags[p.tag]) E(pa+": “"+p.tag+"” twice"); tags[p.tag]=1;
    if(typeof p.label!=="string"||!p.label.trim()) E(pa+" (“"+p.tag+"”) has no label");
    if(p.tags!=null&&(!Array.isArray(p.tags)||!p.tags.length||p.tags.some(t=>PHOTO_TAGS.indexOf(t)<0))) E(pa+" (“"+p.tag+"”): tags must be photo tags"); });
  if(I.length<4) E(at+": an ID-by-part skill needs 4 or more items (each try offers 4 names)");
  I.forEach((x,j)=>{ const ia=at+" item "+(j+1)+(x&&x.name?" (“"+x.name+"”)":"");
    if(!x||typeof x.name!=="string"||!x.name.trim()){ E(ia+" has no name"); return; }
    if(names[x.name.toLowerCase()]) E(ia+": name twice"); names[x.name.toLowerCase()]=1;
    if(x.parts!=null&&(!Array.isArray(x.parts)||!x.parts.length||x.parts.some(t=>!tags[t]))) E(ia+": parts must be parts of this skill");
    if(x.tell!=null){ if(typeof x.tell!=="object"||Array.isArray(x.tell)) E(ia+": tell must be {part: clue}");
      else Object.keys(x.tell).forEach(t=>{ if(!tags[t]||(Array.isArray(x.parts)&&x.parts.indexOf(t)<0)) E(ia+": a clue for “"+t+"”, which is no part of this skill or item"); if(typeof x.tell[t]!=="string"||!x.tell[t].trim()) E(ia+": the “"+t+"” clue is empty");
        const S=x.src&&x.src[t]; if(!Array.isArray(S)||!S.length) E(ia+": the “"+t+"” clue names no card (src)"); else S.forEach(r=>{ if(!cards[r]) E(ia+": the “"+t+"” clue's card “"+r+"” is no card"); }); }); } });
  I.forEach(x=>{ if(x&&x.like!=null){ if(!Array.isArray(x.like)) E(at+" item “"+x.name+"”: like must be a list"); else x.like.forEach(n=>{ if(!names[String(n).toLowerCase()]||String(n).toLowerCase()===String(x.name).toLowerCase()) E(at+" item “"+x.name+"”: look-alike “"+n+"” is not another item of this skill"); }); } });
  return err;
}
// 🌲 CPITEMID: the repo set's photo tags for a shot (CPPHOTOS' cpphShotTags, the same words)
function shotTags(shot){ const s=String(shot||"").toLowerCase(), t=[]; const on=(re,tag)=>{ if(re.test(s)&&t.indexOf(tag)<0) t.push(tag); };
  on(/lea(f|ves)|foliage|fall color/,"leaf"); on(/bark/,"bark"); on(/twig|bud/,"twig"); on(/fruit|acorn|berr|nut|seed|pod/,"fruit"); on(/flower/,"flower"); on(/cone/,"cone"); on(/needle/,"needle");
  on(/track/,"track"); on(/skull/,"skull"); on(/pelt/,"pelt"); on(/specimen|antler/,"specimen"); on(/drawing/,"drawing"); on(/diagram/,"diagram"); on(/gear|tool/,"gear");
  if(!t.length) t.push("live"); return t; }
// 🌲 CPITEMID: each ID-by-part skill's item parts with no photo in the repo set — [{skill, part, label, items:[names]}]
function partPhotoGaps(root,skills){
  const p=path.join(root,"envirothon","pics","index.json"), have={}; if(fs.existsSync(p)){ try{ const J=readJson(p); Object.keys(J).forEach(n=>{ const it=String(n).split(" · ")[0].trim().toLowerCase(), H=have[it]=have[it]||{};
    (Array.isArray(J[n])?J[n]:[]).forEach(ph=>shotTags(ph&&ph.shot).forEach(t=>{ H[t]=1; })); }); }catch(e){} }
  const out=[]; (skills||[]).forEach(k=>{ const I=partItems(k); if(!I) return; (k.data.parts||[]).forEach(pt=>{ const want=pt.tags||[pt.tag];
    const miss=I.filter(x=>!(Array.isArray(x.parts)&&x.parts.indexOf(pt.tag)<0)&&!want.some(t=>(have[String(x.name).trim().toLowerCase()]||{})[t])).map(x=>x.name); if(miss.length) out.push({skill:k.key,part:pt.tag,label:pt.label,items:miss}); }); });
  return out;
}
// rule 8 — the unit's skills: [errors]
function checkSkills(skills,secKeys,decks,tests){
  const err=[], E=m=>err.push(m); if(skills==null) return err; if(!Array.isArray(skills)){ E("skills must be a list"); return err; }
  const keys={}, cards={}; decks.forEach(d=>(d.cards||[]).forEach(c=>{ if(c&&Number.isInteger(c.order)) cards[d.key+"#o"+c.order]=1; }));
  skills.forEach((k,i)=>{ const at="skill "+(i+1)+(k&&k.key?" (“"+k.key+"”)":"");
    if(!k||typeof k!=="object"){ E(at+" is not a record"); return; }
    if(!SKILL_KEY.test(String(k.key||""))) E(at+": key must be [a-z0-9][a-z0-9_.-]*, up to 60"); else if(keys[k.key]) E(at+": key twice"); else keys[k.key]=1;
    if(secKeys.indexOf(k.section)<0) E(at+": section “"+k.section+"” isn't the unit's");
    if(SKILL_TYPES.indexOf(k.type)<0) E(at+": type “"+k.type+"” is not one of "+SKILL_TYPES.join(", "));
    if(typeof k.label!=="string"||!k.label.trim()) E(at+" has no label");
    if(k.core!=null&&typeof k.core!=="boolean") E(at+": core must be true or false");
    if(k.steps!=null&&(!Array.isArray(k.steps)||k.steps.some(x=>typeof x!=="string"||!x.trim()))) E(at+": steps must be a list of words");
    const forms=(tests&&tests.sections&&tests.sections[k.section])||{}, qids={}; ["pre","post"].forEach(f=>{ if(forms[f]) forms[f].items.forEach(it=>{ qids[String(it.id)]=1; }); });
    if(k.tests!=null){ if(!Array.isArray(k.tests)) E(at+": tests must be a list"); else k.tests.forEach(q=>{ if(!qids[String(q)]) E(at+": test question “"+q+"” is not in the "+k.section+" forms"); }); }
    if(k.replaces!=null){ if(!Array.isArray(k.replaces)) E(at+": replaces must be a list"); else k.replaces.forEach(r=>{ if(!cards[r]) E(at+": replaces “"+r+"”, which is no card"); }); }
    if(k.data&&k.data.kind==="gear"){ const I=skillItems(k)||[], names={};
      if(k.type!=="id") E(at+": a gear skill is type id");
      if(I.length<4) E(at+": a gear skill needs 4 or more items (each try offers 4 names)");
      if(k.data.tags!=null&&(!Array.isArray(k.data.tags)||!k.data.tags.every(t=>typeof t==="string"&&t))) E(at+": data.tags must be a list of photo tags");
      I.forEach((x,j)=>{ const ia=at+" item "+(j+1)+(x&&x.name?" (“"+x.name+"”)":"");
        if(!x||typeof x.name!=="string"||!x.name.trim()){ E(ia+" has no name"); return; }
        if(names[x.name.toLowerCase()]) E(ia+": name twice"); names[x.name.toLowerCase()]=1;
        if(typeof x.use!=="string"||!x.use.trim()) E(ia+" has no use (what it's for)");
        if(!x.src) E(ia+" has no source");
        if(x.item!=null&&(typeof x.item!=="string"||!x.item.trim())) E(ia+": item (its photo key) must be a name"); });
      const U={}; I.forEach(x=>{ if(x&&x.use){ if(U[x.use]) E(at+": two items share the use “"+x.use+"”"); U[x.use]=1; } });
      I.forEach(x=>{ if(x&&x.like!=null){ if(!Array.isArray(x.like)) E(at+" item “"+x.name+"”: like must be a list"); else x.like.forEach(n=>{ if(!names[String(n).toLowerCase()]||String(n).toLowerCase()===String(x.name).toLowerCase()) E(at+" item “"+x.name+"”: look-alike “"+n+"” is not another item of this skill"); }); } }); }
    if(k.data&&k.data.kind==="parts") checkParts(k,at,cards).forEach(E); });   // 🌲 CPITEMID
  return err;
}
// 🧰 CPITEMGEAR: the gear items with no photo in the repo set (envirothon/pics/index.json, card name → photos; the item is the name before " · ")
function gearPhotoGaps(root,skills){
  const p=path.join(root,"envirothon","pics","index.json"), have={}; if(fs.existsSync(p)){ try{ Object.keys(readJson(p)).forEach(n=>{ have[String(n).split(" · ")[0].trim().toLowerCase()]=1; }); }catch(e){} }
  const out=[]; (skills||[]).forEach(k=>(skillItems(k)||[]).forEach(x=>{ const item=String(x.item||x.name).trim(); if(!have[item.toLowerCase()]) out.push({skill:k.key,name:x.name,item}); })); return out;
}
function check(root,id,{u,decks,tests,skills},old,others){
  const err=[], warn=[], E=m=>err.push(m);
  if(!/^[a-z][a-z0-9_]{0,39}$/.test(String(u.id||""))) E("unit id “"+u.id+"” must be [a-z][a-z0-9_]*, up to 40");
  if(u.id!==id) E("unit.json id “"+u.id+"” is not its folder “"+id+"”");
  if(!u.title) E("the unit needs a title");
  const secKeys=(u.sections||[]).map(s=>s&&s.key), deckKeys=decks.map(d=>d.key);
  if(!secKeys.length) E("the unit has no sections"); if(!deckKeys.length) E("the unit has no decks");
  secKeys.forEach(k=>{ if(!fbSafe(k)) E("section key “"+k+"” is not safe as a Firebase key"); });
  deckKeys.forEach(k=>{ if(!fbSafe(k)) E("deck key “"+k+"” is not safe as a Firebase key"); });
  const dup=a=>a.filter((x,i)=>a.indexOf(x)!==i);
  dup(secKeys).forEach(k=>E("section key “"+k+"” twice in the unit")); dup(deckKeys).forEach(k=>E("deck key “"+k+"” twice in the unit"));
  (others||[]).forEach(o=>{ (o.sections||[]).forEach(k=>{ if(secKeys.indexOf(k)>=0) E("section key “"+k+"” is also in unit "+o.id); }); (o.decks||[]).forEach(k=>{ if(deckKeys.indexOf(k)>=0) E("deck key “"+k+"” is also in unit "+o.id); }); });
  decks.forEach(d=>{ if(secKeys.indexOf(d.section)<0) E("deck “"+d.key+"” names section “"+d.section+"”, which the unit doesn't have"); });
  secKeys.forEach(k=>{ if(!decks.some(d=>d.section===k)) E("section “"+k+"” has no deck"); });
  Object.keys(u.labels||{}).forEach(k=>{ const v=u.labels[k]; if(LABEL_KEYS.indexOf(k)<0) E("labels."+k+" is not one of "+LABEL_KEYS.join(", ")); else if(typeof v!=="string"||!v.trim()||v.length>30) E("labels."+k+" must be 1 to 30 characters"); });
  Object.keys(u.features||{}).forEach(k=>{ if(FEATURE_KEYS.indexOf(k)<0) E("features."+k+" is not one of "+FEATURE_KEYS.join(", ")); else if(typeof u.features[k]!=="boolean") E("features."+k+" must be true or false"); });
  let coded=0;
  decks.forEach(d=>{ if(!Array.isArray(d.cards)){ E("deck “"+d.key+"” has no cards"+(u.cards&&u.cards.from?" in "+u.cards.from:"")); return; }
    const seen={}; d.cards.forEach((c,i)=>{ const at="deck “"+d.key+"” card "+(i+1);
      if(!c||typeof c.name!=="string"||!c.name.trim()){ E(at+" has no front"); return; }
      if(c.def==null||String(c.def).trim()==="") E(at+" (“"+c.name+"”) has no back");
      if(!c.src) E(at+" (“"+c.name+"”) has no source");
      if(!fbSafe(c.name)){ if(u.rules&&u.rules.codedFronts) coded++; else E(at+" front “"+c.name+"” is not safe as a Firebase key (or set rules.codedFronts)"); }
      if(!Number.isInteger(c.order)||c.order<1) E(at+" (“"+c.name+"”) needs a whole-number order");
      else if(seen[c.order]) E("deck “"+d.key+"”: order "+c.order+" twice"); else seen[c.order]=1; }); });
  if(coded) warn.push(coded+" fronts hold . # $ [ ] / — their backs save under the coded key (rules.codedFronts)");
  if(old&&old.decks) Object.keys(old.decks).forEach(k=>{ const d=decks.find(x=>x.key===k); if(!d){ E("deck “"+k+"” shipped before and is gone (order is append-only)"); return; }
    const was=unranges(old.decks[k].orders), now=new Set((d.cards||[]).map(c=>c&&c.order)), top=old.decks[k].maxOrder||0;
    const lost=was.filter(o=>!now.has(o)); if(lost.length) E("deck “"+k+"”: shipped order"+(lost.length>1?"s ":" ")+lost.slice(0,8).join(", ")+(lost.length>8?"…":"")+" dropped or renumbered (order is append-only)");
    const wasS=new Set(was), low=[...now].filter(o=>Number.isInteger(o)&&!wasS.has(o)&&o<=top); if(low.length) E("deck “"+k+"”: new order"+(low.length>1?"s ":" ")+low.slice(0,8).join(", ")+" sit below the shipped top "+top+" (new cards go above it)"); });
  if(tests) Object.keys(tests.sections).forEach(k=>{ if(secKeys.indexOf(k)<0) E("tests: section “"+k+"” isn't the unit's");
    ["pre","post"].forEach(f=>{ const fm=tests.sections[k][f]; if(!fm) return; const ids={};
      fm.items.forEach((it,i)=>{ const at="tests "+k+"."+f+" item "+(i+1);
        if(!fbSafe(String(it.id))) E(at+": id “"+it.id+"” is not safe as a key"); if(ids[it.id]) E(at+": id “"+it.id+"” twice"); ids[it.id]=1;
        const n=Array.isArray(it.choices)?it.choices.length:0, a=Array.isArray(it.ans)?it.ans:[it.ans];
        if(!it.q||!n) E(at+": no question or no choices"); else if(!a.length||a.some(x=>!Number.isInteger(x)||x<0||x>=n)) E(at+": the answer isn't one of its "+n+" choices"); }); }); });
  checkSkills(skills,secKeys,decks,tests).forEach(E);   // 🧰 CPITEMGEAR: rule 8
  const gaps=gearPhotoGaps(root,skills); if(gaps.length) warn.push(gaps.length+" gear item"+(gaps.length===1?" has":"s have")+" no photo in the repo set yet: "+gaps.map(g=>g.name).join(", "));
  partPhotoGaps(root,skills).forEach(g=>warn.push(g.skill+" · "+g.label+": "+g.items.length+" item"+(g.items.length===1?" has":"s have")+" no photo in the repo set yet: "+g.items.join(", ")));   // 🌲 CPITEMID
  return {err,warn};
}
// the compiled file for a unit without build.file
function makeJs(u,idx,decks,tests,links){
  const unit={id:u.id,ver:u.ver||1,title:u.title,emoji:u.emoji||"",desc:u.desc||"",labels:u.labels||{},sections:u.sections||[],
    decks:decks.map(d=>({key:d.key,section:d.section,mode:d.mode||"flash",kind:d.kind||"",introCap:d.introCap||3,groupBy:d.groupBy||"group",
      cards:(d.cards||[]).map(c=>Object.assign({},c,{family:c.family!=null?c.family:c.group}))}))};
  if(Array.isArray(u.skills)&&u.skills.length) unit.skills=u.skills.map(skillEntry);   // 🧰 CPITEMGEAR
  const T=tests?JSON.parse(JSON.stringify(tests.sections)):{};   // 📚 CPCARDSSEE: each question carries its cards (§8.4)
  Object.keys(T).forEach(k=>["pre","post"].forEach(f=>{ if(T[k][f]) T[k][f].items.forEach(it=>{ it.cards=((links||{})[k]||{})[String(it.id)]||[]; }); }));
  const lib={id:u.id,ver:u.ver||1,index:idx,unit,tests:T};
  return "/* GENERATED by units/build/compile_unit.js from units/"+u.id+"/unit.json — do not hand-edit. Registers window.HoweUnits."+u.id+" (📦 CPUNIT). */\n"+
    "(function(){ \"use strict\"; var lib="+JSON.stringify(lib)+";\n"+
    "  if (typeof window !== \"undefined\") { window.HoweUnits = window.HoweUnits || {}; window.HoweUnits["+JSON.stringify(u.id)+"] = lib; }\n"+
    "  if (typeof module !== \"undefined\" && module.exports) module.exports = lib;\n})();\n";
}
// a unit built elsewhere (build.file): its file must be current with the data this script just read
function checkBuilt(root,u,decks,tests){
  const err=[], f=path.join(root,u.build.file); if(!fs.existsSync(f)) return ["build.file "+u.build.file+" is missing — run "+(u.build.by||"its builder")];
  let lib; try{ delete require.cache[require.resolve(f)]; lib=require(f); }catch(e){ return ["build.file "+u.build.file+" doesn't load: "+e.message]; }
  const by={}; ((lib&&lib.unit&&lib.unit.decks)||[]).forEach(d=>{ by[d.key]=d.cards||[]; });
  decks.forEach(d=>{ const c=by[d.key]; if(!c) err.push(u.build.file+" has no deck “"+d.key+"”"); else if(c.length!==(d.cards||[]).length||c.filter(x=>x&&x.core).length!==(d.cards||[]).filter(x=>x&&x.core).length) err.push(u.build.file+" is stale for “"+d.key+"” — run "+(u.build.by||"its builder")); });
  Object.keys(by).forEach(k=>{ if(!decks.some(d=>d.key===k)) err.push(u.build.file+" has deck “"+k+"” that unit.json doesn't list"); });
  if(tests){ const T=(lib&&lib.tests)||{}; Object.keys(tests.sections).forEach(k=>{ ["pre","post"].forEach(f=>{ const a=tests.sections[k][f], b=T[k]&&T[k][f]; if(a&&(!b||(b.items||[]).length!==a.items.length)) err.push(u.build.file+" is stale for the "+k+" "+f+" form — run "+(u.build.by||"its builder")); }); }); }
  return err;
}
// 📚 CPCARDSSEE: a build.file unit's compiled questions carry exactly LINKS.json's cards ([] where none) — "" when current
function builtLinksErr(root,u,links){
  let lib; try{ const f=path.join(root,u.build.file); delete require.cache[require.resolve(f)]; lib=require(f); }catch(e){ return ""; }
  const T=(lib&&lib.tests)||{}; let bad=0;
  Object.keys(links||{}).forEach(k=>["pre","post"].forEach(f=>{ const fm=T[k]&&T[k][f]; if(!fm) return; (fm.items||[]).forEach(it=>{ const want=links[k][it.id!=null?String(it.id):f+"-"+it.n]||[]; if(JSON.stringify(it.cards||null)!==JSON.stringify(want)) bad++; }); }));
  return bad?u.build.file+"'s question links are not current ("+bad+" questions) — run "+(u.build.by||"its builder"):"";
}
function stable(v){ return JSON.stringify(v,null,1)+"\n"; }
// index.html's catalog line: {html, cur} where cur = the parsed CPU_UNITS, or null when the page has no such line (a fixture root)
const CAT_RE=/^const CPU_UNITS=(\{.*\});(   \/\/ [^\n]*)$/m;
function catalogIn(root){ const p=path.join(root,"index.html"); if(!fs.existsSync(p)) return null; const html=fs.readFileSync(p,"utf8"), m=CAT_RE.exec(html); if(!m) return null; return {p,html,cur:JSON.parse(m[1])}; }
function catalogWith(cat,id,idx){ const o={}; Object.keys(Object.assign({},cat.cur,{[id]:idx})).sort().forEach(k=>{ o[k]=k===id?idx:cat.cur[k]; }); return cat.html.replace(CAT_RE,(a,j,c)=>"const CPU_UNITS="+JSON.stringify(o)+";"+c); }
// PURE-ish: everything for one unit; writes only when opts.write
function compile(id,opts){
  opts=opts||{}; const root=opts.root||REPO, dir=path.join(root,"units",id);
  if(!fs.existsSync(path.join(dir,"unit.json"))) return {ok:false,err:["no units/"+id+"/unit.json"],warn:[]};
  let L; try{ L=loadUnit(root,id); }catch(e){ return {ok:false,err:["couldn't read the unit: "+e.message],warn:[]}; }
  const cp=path.join(dir,"COUNTS.json"), ip=path.join(dir,"index.json"), old=fs.existsSync(cp)?readJson(cp):null;
  const others=unitIds(root).filter(x=>x!==id).map(x=>{ try{ const o=readJson(path.join(root,"units",x,"unit.json")); return {id:x,sections:(o.sections||[]).map(s=>s.key),decks:(o.decks||[]).map(d=>d.key)}; }catch(e){ return {id:x,sections:[],decks:[]}; } });
  const r=check(root,id,L,old,others);
  const counts=makeCounts(L.u,L.decks,L.tests,L.skills), index=makeIndex(L.u,L.decks,L.skills), links=L.tests?questionLinks(L.decks,L.tests):null, lp=path.join(dir,"LINKS.json");
  const rkeys=releaseKeys(index), rp=path.join(dir,"RELEASE_KEYS.json");   // 📤 CPSEND
  if(!r.err.length&&L.u.build&&L.u.build.file) r.err.push(...checkBuilt(root,L.u,L.decks,L.tests));
  const js=(L.u.build&&L.u.build.file)?null:makeJs(L.u,index,L.decks,L.tests,links), jp=path.join(root,"units",id+".js");
  if(opts.check&&!r.err.length){
    if(!old||stable(old)!==stable(counts)) r.err.push("units/"+id+"/COUNTS.json is not current — run node units/build/compile_unit.js "+id);
    if(!fs.existsSync(ip)||stable(readJson(ip))!==stable(index)) r.err.push("units/"+id+"/index.json is not current — run node units/build/compile_unit.js "+id);
    if(js!=null&&(!fs.existsSync(jp)||fs.readFileSync(jp,"utf8")!==js)) r.err.push("units/"+id+".js is not current — run node units/build/compile_unit.js "+id);
    if(links&&(!fs.existsSync(lp)||stable(readJson(lp))!==stable(links))) r.err.push("units/"+id+"/LINKS.json is not current — run node units/build/compile_unit.js "+id);   // 📚 CPCARDSSEE
    if(!fs.existsSync(rp)||stable(readJson(rp))!==stable(rkeys)) r.err.push("units/"+id+"/RELEASE_KEYS.json is not current — run node units/build/compile_unit.js "+id);   // 📤 CPSEND
    if(links&&L.u.build&&L.u.build.file){ const e=builtLinksErr(root,L.u,links); if(e) r.err.push(e); }
    const cat=catalogIn(root); if(cat&&JSON.stringify(cat.cur[id])!==JSON.stringify(index)) r.err.push("index.html's CPU_UNITS."+id+" is not current — run node units/build/compile_unit.js "+id); }
  const ok=!r.err.length;
  if(ok&&opts.write){ fs.writeFileSync(cp,stable(counts)); fs.writeFileSync(ip,stable(index)); fs.writeFileSync(rp,stable(rkeys)); if(js!=null) fs.writeFileSync(jp,js);
    if(links){ fs.writeFileSync(lp,stable(links)); if(L.u.build&&L.u.build.file){ const e=builtLinksErr(root,L.u,links); if(e) r.warn.push(e); } }   // 📚 CPCARDSSEE
    const cat=catalogIn(root); if(cat){ const h=catalogWith(cat,id,index); if(h!==cat.html) fs.writeFileSync(cat.p,h); r.page=h!==cat.html; } }
  return {ok,err:r.err,warn:r.warn,counts,index,js,links,releaseKeys:rkeys,unit:L.u,page:!!r.page};
}
module.exports={compile,checkSkills,skillEntry,skillItems,gearPhotoGaps,partItems,checkParts,partPhotoGaps,shotTags,PHOTO_TAGS,SKILL_TYPES,sectionConcepts,releaseKeys,catalogIn,catalogWith,CAT_RE,check,loadUnit,makeIndex,makeCounts,makeJs,questionLinks,linkNorm,linkHas,fbSafe,ranges,unranges,unitIds,LABEL_KEYS,FEATURE_KEYS,REPO};
if(require.main===module){
  const a=process.argv.slice(2), chk=a.includes("--check"), all=a.includes("--all"), ids=all?unitIds(REPO):a.filter(x=>!x.startsWith("--"));
  if(!ids.length){ console.error("usage: node units/build/compile_unit.js <unitId>|--all [--check]"); process.exit(2); }
  let bad=0;
  ids.forEach(id=>{ const r=compile(id,{check:chk,write:!chk});
    r.warn.forEach(w=>console.log("  note  "+id+": "+w));
    if(!r.ok){ bad++; r.err.forEach(e=>console.log("  ERROR "+id+": "+e)); return; }
    const c=r.counts; console.log((chk?"ok    ":"wrote ")+id+": "+Object.keys(c.sections).length+" sections, "+Object.keys(c.decks).length+" decks, "+c.cards.toLocaleString("en-US")+" cards, "+c.core.toLocaleString("en-US")+" core"+(chk?"":" → units/"+id+"/COUNTS.json, index.json"+(r.js!=null?", units/"+id+".js":"")+(r.links?", LINKS.json":"")+(r.page?", index.html CPU_UNITS":""))); });
  process.exit(bad?1:0);
}
