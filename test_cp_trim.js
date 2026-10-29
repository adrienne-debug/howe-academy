/*
 * Node tests — ✂️ CPTRIM, PR 27 of the class platform, the LAST step (DESIGN_class_platform_2026-10-28.md §6.6, §9, §13 row 27, §14 Q39–Q44;
 * RESEARCH_envirothon_skills_2026-10-28.md §8). Her words 2026-10-28: "if these skills then make it where we can take out cards because we dont
 * want to overload and make it impossible to complete this study that is a final step that will need to be completed we want to be efficient."
 *   · the block (right after CPCARDSEDIT_END, only declares, 8 typeof-guarded hooks tagged ✂️ CPTRIM, writes only through envsWrite /
 *     cpceCommit); unit.json is untouched (its core count is the compiled one);
 *   · Howe / no edition and LINCOLN: every hook hands back what it was given, reads and writes nothing, even with trims in memory;
 *   · the view: the ✂️ Trim chip, the goal and the live numbers (CPPACE's planner), the four steps + Rule D + ✂️ Trimmed so far, each with
 *     its reason text; opening it writes nothing;
 *   · Trim 1 (PR #163, #172) is read from the unit as it is: its cards are counted once as "already optional", never offered again;
 *   · the guards: an ID item keeps a core card; a card on a test stays in unless the skill that replaces it is learned by 4 in 5 of the
 *     class (then one by one); picture cards are never in "Accept this group"; Rule B's worth-keeping cards arrive skipped; the skill-live
 *     gate (built, not hidden, replacesWhen: "which group?", photos per part, the class's tick);
 *   · Accept this group = one confirm, ONE multi-path update, Undo; per card Accept (✂️ Make optional / 🙈 Hide) and Skip; 🔗 Merge for
 *     Baseflow with both backs; ✏️ Shorten; ↩ Put back one or a whole step by its `why`; the goal; 🔒 CPLOCKS;
 *   · Adrienne's unit layer (units/<id>/trim, admin only) and a teacher's "Keep it for my class";
 *   · the kid (site only): a class trim makes the card non-core in memory; a unit hide leaves the bank; the live boot reads the unit trims once;
 *   · the rules.                                                                                          run: node test_cp_trim.js
 * Uses the world from test_env_site.js; its `o.rev` line injects the blocks the view reads (locks, pace, suggestions, photos, skills, items).
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const TR=cut("// CPTRIM_START","// CPTRIM_END");
const BLOCKS=["CPLOCKS","CPPACE","CPCAL","CPSUGGEST","CPPHOTOS","CPSKILL","CPITEMGEAR","CPITEMBIOTIC","CPITEMTRIANGLE","CPITEMLABEL","CPITEMID","CPITEMSCALE"].map(n=>cut("// "+n+"_START","// "+n+"_END")).join("\n");
const API="_cptr, CPTR_RULES, CPTR_STEPS, cptrOn, cptrModel, cptrGroupRows, cptrCounts, cptrListHtml, cptrChipHtml, cptrToggle, cptrTap, cptrAccept, cptrAsk, cptrOne, cptrSkip, cptrTick, cptrMergeSave, cptrMergeOpen, cptrShortOpen, cptrShortSave, cptrPutOne, cptrPutBack, cptrKeep, cptrGoalOpen, cptrGoalSave, cptrGoalRec, cptrGoal, cptrRecNext, cptrRecBack, cptrKeepRec, cptrCore, cptrPaceTxt, cptrDecks, cptrIndex, cptrHydrate, cptrKidIdx, cptrKidLoad, cptrState, cptrUndo, cptrStart";
const OTHER="cpPaceFlush, cppSections, cpcsIndex, cpceUndo, cpceNext, cpceKidIdx, envtCoreCount: (typeof envtCoreCount==='function'?envtCoreCount:null), CPSK_TYPES";
const REV=o=>BLOCKS+"\n"+(o.tr===false?"G.t=null;":TR+"\nG.t={ "+API+" };")+"\nG.o={ "+OTHER+" };";
const LIB=require(path.join(REPO,"envirothon.js"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const NOW=Date.UTC(2026,9,29,15,0,0), CID="ms-science-2026", UID="nc_envirothon";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV(o),now:NOW},o.w||{})); w.T=w.G.t; w.O=w.G.o; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const settle=w=>{ for(let i=0;i<12;i++){ const n=w.O.cpPaceFlush(); w.renderAll(); if(!n) break; } return w.G.content; };
const trim=(role,o)=>{ const w=demo(role,o); w.envcView("cpcards"); w.T.cptrToggle(); settle(w); return w; };
const view=w=>{ w.renderAll(); return w.G.content; };
const text=h=>String(h).replace(/<[^>]+>/g," ").replace(/\s+/g," ");
const Wr=w=>w._envs.writes, last=w=>Wr(w)[Wr(w).length-1];
const card=(w,deck,name)=>w.O.cpcsIndex().C.find(c=>c.deck===deck&&c.name===name);
const rowOf=(X,id)=>{ let r=null; [].concat(...X.subs.map(s=>s.rows),X.A,X.B,X.C).some(x=>{ if(x.c.id===id){ r=x; return true; } return false; }); return r; };
const sub=(X,key)=>X.subs.find(s=>s.d.key===key);
const nowCore=w=>{ const m=/Now: <b>([\d,]+)<\/b> core/.exec(view(w)); return m?+m[1].replace(/,/g,""):null; };
const nowMin=w=>{ settle(w); const m=/Now: <b>[\d,]+<\/b> core · (\d+) a day · ~(\d+) min/.exec(view(w)); return m?{npd:+m[1],min:+m[2]}:null; };
const BIO="Aquatic Ecology · Facts", BIO_IDS=[365,366,367,368,369,370,371,372].map(n=>BIO+"#o"+n);
const UNITCORE=()=>{ let n=0; LIB.unit.decks.forEach(d=>(d.cards||[]).forEach(c=>{ if(c&&c.core===true) n++; })); return n; };
const COUNTS=JSON.parse(fs.readFileSync(path.join(REPO,"units/nc_envirothon/COUNTS.json"),"utf8"));

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPTRIM_START"), b=src.indexOf("// CPTRIM_END"), e=src.indexOf("// CPCARDSEDIT_END"), head=TR.slice(0,1600);
  ok("one CPTRIM block, IMMEDIATELY after CPCARDSEDIT_END", a>0&&b>a&&src.indexOf("// CPTRIM_START",a+1)<0&&src.slice(e,a).trim()==="// CPCARDSEDIT_END");
  ok("its header: her words, the date, §6.6, §13 row 27, PR 27, the research §8", /we dont want to overload and make it impossible to complete this study/.test(head)&&/2026-10-28/.test(head)&&/§6\.6/.test(head)&&/§13 row 27/.test(head)&&/PR 27/.test(head)&&/§8\.1–§8\.4/.test(head));
  ok("…and it says nothing is trimmed by the block itself, and what reaches Lincoln", /nothing is trimmed by this block or by this PR/.test(TR)&&/LINCOLN: nothing here reaches him/.test(TR));
  ok("the block only declares (nothing runs at boot)", TR.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/✂️ CPTRIM/.test(l));
  ok("8 hook lines outside the block, each tagged ✂️ CPTRIM and typeof-guarded on a cptr function", hooks.length===8&&hooks.every(l=>(l.match(/cptr\w+(?=\()/g)||[]).every(f=>new RegExp('typeof '+f+'==="function"').test(l))), hooks.map(l=>l.trim().slice(0,90)));
  const names=out.split("\n").filter(l=>/\bcptr[A-Z]\w*\(/.test(l));
  ok("…and no other line outside the block names a cptr function", names.length===8, names.map(l=>l.trim().slice(0,80)));
  const inFn=(host,fn)=>{ const i=src.indexOf(host), j=src.indexOf("\n}",i); return i>0&&src.slice(i,j).indexOf('typeof '+fn+'==="function"')>0; };
  ok("…in cpcsIndex, cpcsChipsHtml, cpcsListHtml, cppSections, cpceNext, cpceKidIdx, envHydrate, envClsKidLoad", inFn("function cpcsIndex(){","cptrIndex")&&inFn("function cpcsChipsHtml(){","cptrChipHtml")&&inFn("function cpcsListHtml(){","cptrListHtml")&&inFn("function cppSections(){","cptrDecks")&&inFn("function cpceNext(","cptrKeepRec")&&inFn("function cpceKidIdx(){","cptrKidIdx")&&inFn("function envHydrate(u,lib){","cptrHydrate")&&inFn("function envClsKidLoad(sdb,cid){","cptrKidLoad"));
  ok("…the kid's load sits after the class card, test and photo layers' (their tests pin that order)", /cpphKidLoad\(sdb,cid\);[^\n]*\n  if\(typeof cptrKidLoad==="function"\) cptrKidLoad\(sdb,cid\);/.test(src)&&/cpceKidLoad\(sdb,cid\);[^\n]*\n  if\(typeof cpctKidLoad==="function"\)/.test(src));
  const code=TR.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("its writes go only through envsWrite / cpceCommit (no set / update / remove / listener of its own; the one read is the kid's .once)", !/\.set\(|\.update\(|\.remove\(|\.on\(|\bdb\./.test(code)&&/envsWrite\(/.test(code)&&/cpceCommit\(/.test(code)&&(code.match(/\.once\(/g)||[]).length===1&&/ref\("units\/"\+id\+"\/trim"\)\.once/.test(code));
  ok("it never names cpSkill* (CPSKILL's own rule) and no Howe kid as a code literal; no 🔀", !/cpSkill\w+/.test(code)&&!/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(TR)&&src.indexOf("\u{1F500}")<0);
  ok("unit.json is untouched: the card file's core count is still the compiled one ("+COUNTS.core+")", UNITCORE()===COUNTS.core&&COUNTS.core===1528, [UNITCORE(),COUNTS.core]); }

console.log("\n── Howe, DeWalt, no edition, and LINCOLN: inert ──");
{ const w=W({w:{fam:HOWE}}), T=w.T, h="<b>x</b>", S=[{id:"forestry",decks:[{key:"Forestry · Terms",n:5,core:3}]}], I={L:{},hide:{},def:{},add:{},any:false};
  const u={decks:[{key:BIO,cards:[{name:"How do you get the Biotic Index Value?",core:true}]}]}, before=JSON.stringify(u);
  T._cptr.kid[UID]={[BIO]:{o372:{name:"How do you get the Biotic Index Value?",core:false,why:"skill:aquatics.biotic_index",by:"u",ts:1}}};
  ok("cptrOn false; the chip list, the list hook and the deck counts come back untouched", T.cptrOn()===false&&T.cptrChipHtml(h)===h&&T.cptrListHtml({ready:true})===undefined&&T.cptrDecks(S)===S&&S[0].decks[0].core===3);
  ok("Lincoln's records: a unit trim in memory changes nothing (cptrHydrate false, the record byte-identical); the kid index is handed back as is", T.cptrHydrate(u)===false&&JSON.stringify(u)===before&&T.cptrKidIdx(I)===I&&!Object.keys(I.hide).length);
  ok("no boot read for a Howe kid (the unit trims are never fetched in Howe)", T.cptrKidLoad(w.db||{ref(){ throw new Error("read"); }},CID)===false&&w.G.reads.length===0);
  ok("taps do nothing: toggle, accept, one, skip, goal", (T.cptrToggle(),T._cptr.on===false)&&T.cptrAccept("A",true)===0&&T.cptrOne("x","A","core")===false&&T.cptrSkip("x",true)===false&&T.cptrGoalSave()===false);
  ok("…and nothing created, no listener, no read, no write", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0); }

console.log("\n── the view: ✂️ Trim in 📚 Cards, the goal, the live numbers, the groups ──");
{ const w=demo("teacher"); w.envcView("cpcards"); let h=view(w);
  ok("📚 Cards has a ✂️ Trim chip", /onclick="cptrToggle\(\)">✂️ Trim<\/button>/.test(h));
  const n0=Wr(w).length; w.T.cptrToggle(); settle(w); h=view(w);
  ok("tapping it shows the Trim view in the list area (the other chips step aside)", /id="cptr"/.test(h)&&!/cpcsTap\('f','core'\)/.test(h)&&/cptr-chip on/.test(h));
  ok("the goal line: 95% of core by Area (Mar 22) … in ≤ 45 min a day, with change", /Goal: 95% of core by Area \(Mar 22\) on the class’s study days in ≤ 45 min a day/.test(text(h))&&/cptrGoalOpen\(\)/.test(h), text(h).slice(0,400));
  const m=nowMin(w);
  ok("Now: the class's core count (1,528, the unit as it is) · New cards a day · minutes, from CPPACE's planner", nowCore(w)===1528&&m&&m.npd>0&&m.min>0, m);
  ok("over the goal: the line says how far, and that sending a late section out earlier helps more", m.min<=45?/✓ 95% of core/.test(view(w)):/min a day, \d+ over\. Wildlife opens Jan 4: sending it out earlier helps more than any one rule/.test(text(view(w))), text(view(w)).slice(0,600));
  ok("the steps, each a folded group: skills, Rule A, Rule B, Rule C, Rule D, ✂️ Trimmed so far", ["1. A skill replaces it","2. Rule A · one card per front","3. Rule B · catch-all facts","4. Rule C · ID attributes","Rule D · long backs","✂️ Trimmed so far"].every(t=>h.indexOf(t)>=0)&&(h.match(/cptrTap\('g','(skill|A|B|C|D|T)'\)/g)||[]).length===6);
  ok("…every group opens to its reason text", CPTR_REASONS(w).every(Boolean), CPTR_REASONS(w));
  ok("opening it all wrote nothing", Wr(w).length===n0); }

console.log("\n── Trim 1 is already in the unit: counted once, never offered again ──");
{ const w=trim("teacher"), X=w.T.cptrModel();
  ok("Rule A: Trim 1's 72 copies are already optional; none is offered as a core trim (each only to hide or merge)", X.done.A===72&&X.A.length===72&&X.A.every(r=>r.core===false&&r.act==="hide"), [X.done.A,X.A.length]);
  ok("Rule B: 38 already optional; only the 7 kept on review are left, and they arrive skipped (worth keeping)", X.done.B===38&&X.B.length===7&&X.B.every(r=>r.g&&r.g.skip&&/^worth keeping: /.test(r.g.skip)));
  ok("Rule C: 69 already optional (101 − the 32 Adrienne put back); the 32 she put back are offered, never by the group", X.done.C===69&&X.C.length===32&&w.T.cptrGroupRows(X,"C").length===0);
  ok("…the 27 Wildlife \"· class\" cards carry her reason: the syllabus lists classification to class", X.C.filter(r=>/ · class$/.test(r.c.name)).length===27&&X.C.filter(r=>/ · class$/.test(r.c.name)).every(r=>/Classification to class/.test(r.note)));
  ok("no card is in two steps (cumulative, never counting a card twice)", (()=>{ const s=new Set(); return [].concat(...X.subs.map(x=>x.rows),X.A,X.B,X.C).every(r=>{ if(s.has(r.c.id)) return false; s.add(r.c.id); return true; }); })());
  ok("the research's keep cards are protected from every rule (Biotic index, the pine needle cards, Mallard wing color)", ["Biotic index","Loblolly Pine · needles per bundle","Mallard Duck · wing color"].every(n=>![].concat(...X.subs.map(x=>x.rows),X.A,X.B,X.C).some(r=>r.c.name===n))); }

console.log("\n── the guards ──");
{ const w=trim("teacher"), X=w.T.cptrModel(), byName=n=>[].concat(...X.subs.map(x=>x.rows),X.A,X.B,X.C).find(r=>r.c.name===n);
  const sw=byName("Sourwood · seed plant group");
  ok("an ID item keeps a core card: Sourwood's only core card is guarded, with why", sw&&sw.g&&/the last core card for Sourwood/.test(sw.g.block), sw&&sw.g);
  const bg=byName("Blackgum · seed plant group");
  ok("…Blackgum has a second core card now (its mast card), so its seed plant group card is offered — one by one, as a picture card", bg&&bg.g&&/a picture card: accept it on its own/.test(bg.g.solo));
  const tc=X.C.find(r=>r.qs.length);
  ok("a card on a test that no skill replaces stays in: \"⚠ on Wildlife … Q…: a card on a test stays in\"", tc&&/^⚠ on Wildlife (check-in|final) Q\d+: a card on a test stays in/.test(tc.g.block), tc&&tc.g);
  const good=rowOf(X,BIO+"#o369");
  ok("a skill card on a test waits until 4 in 5 of the class learned the skill (Biotic index: now 1 of 8)", good&&/^⚠ on Aquatics check-in Q15: it can come out once 4 in 5 of the class have learned Biotic index \(now 1 of 8\)/.test(good.g.block), good&&good.g);
  ok("picture cards (ID) are never in Accept this group: Rule C's group takes none, the skill group none of the tree, bug or wildlife cards", w.T.cptrGroupRows(X,"C").length===0&&w.T.cptrGroupRows(X,"skill").every(r=>r.c.kind!=="id"));
  ok("the 7 worth-keeping Rule B cards are skipped, with the research's note (\"2021 Forestry Q5 was about Biltmore\")", X.B.some(r=>/2021 Forestry Q5 was about Biltmore/.test(r.g.skip)));
  ok("a guarded card can't be trimmed at the tap either (no write, a toast with why)", (()=>{ const n=Wr(w).length; return w.T.cptrOne(sw.c.id,"C","core")===false&&w.T.cptrOne(good.c.id,"skill","core")===false&&Wr(w).length===n; })());
  view(w); w.T.cptrTap("g","C"); w.T.cptrTap("d","C|Forestry · ID"); w.T._cptr.more["C|Forestry · ID"]=999; w.T.cptrTap("r",sw.c.id); const h=view(w);
  ok("opened, a guarded card shows why it can't be trimmed, and no Accept", /the last core card for Sourwood: an ID item keeps at least one/.test(h)&&h.indexOf("cptrOne('"+sw.c.id)<0);
  ok("the group's bar says nothing can be accepted as a group", /Nothing here can be accepted as a group: look at each card below\./.test(h)); }

console.log("\n── the skill-live gate (replaces, replacesWhen) ──");
{ const w=trim("teacher"), X=w.T.cptrModel();
  ok("Survey tables: 🔒 no skill yet (5 core cards wait)", sub(X,"soils.survey_tables").S.live===false&&/no skill yet/.test(sub(X,"soils.survey_tables").S.why)&&sub(X,"soils.survey_tables").rows.length===5);
  ok("Macro groups: 🔒 needs the “which group?” picture mode (the research: that AND the biotic index)", sub(X,"aquatics.bugs").S.live===false&&/which group/.test(sub(X,"aquatics.bugs").S.why)&&sub(X,"aquatics.bugs").rows.filter(r=>r.core).length===31);
  const tp=sub(X,"forestry.tree_parts");
  ok("Tree parts: live, but each card waits on 2 photos of its part (\"needs N more bark photos of …\")", tp.S.live===true&&tp.rows.length===51&&tp.rows.every(r=>r.g&&(/^🔒 needs \d more \w+ photos? of /.test(r.g.block)||/last core card/.test(r.g.block))), tp.rows.slice(0,2).map(r=>r.g));
  ok("Biotic index, the triangle, horizons, the Biltmore stick: live (their unit replaces lists)", ["aquatics.biotic_index","soils.texture_triangle","soils.horizons","forestry.biltmore"].every(k=>sub(X,k).S.live===true)&&sub(X,"aquatics.biotic_index").rows.length===8);
  const tf=sub(X,"soils.texture_feel");
  ok("Texture by feel: 🔒 until the class ticks that it did the flow-chart activity", tf.S.live===false&&tf.S.tick==="texture_feel"&&tf.rows.length===16);
  const n=Wr(w).length; w.T.cptrTick("texture_feel");
  ok("☑ We did it: ONE set of classes/<cid>/trimTicks/texture_feel {by, ts}; the activity's cards are offered", Wr(w).length===n+1&&last(w).op==="set"&&last(w).path==="classes/"+CID+"/trimTicks/texture_feel"&&last(w).val.by===w._envs.uid&&sub(w.T.cptrModel(),"soils.texture_feel").S.live===true);
  const w2=trim("teacher"); w2.O.CPSK_TYPES.sheet=undefined; w2.T._cptr.memo=null;
  ok("a skill whose type isn't built is 🔒 (\"its skill type isn’t built yet\")", /isn’t built yet/.test(sub(w2.T.cptrModel(),"aquatics.biotic_index").S.why)); }

console.log("\n── Accept this group: one confirm, ONE update, Undo; the live numbers move ──");
{ const w=trim("teacher"), T=w.T; const c0=nowCore(w), m0=nowMin(w), S0=w.O.cppSections().find(s=>s.id==="aquatics").decks.find(d=>d.key===BIO).core;
  T.cptrTap("g","skill"); T.cptrTap("d","skill|aquatics.biotic_index"); let h=view(w);
  ok("Biotic index: “✓ live · learned by 1 of 8”, Accept these · 7", /Biotic index/.test(h)&&/✓ live · learned by 1 of 8/.test(h)&&/Accept these · 7<\/button>/.test(h));
  const n=Wr(w).length; T.cptrAccept("skill|aquatics.biotic_index");
  ok("the first tap only asks (inline), nothing written", Wr(w).length===n&&/Take 7 cards out of the core for your class\?/.test(view(w)));
  T.cptrAccept("skill|aquatics.biotic_index",true); const wr=last(w);
  ok("Yes: ONE multi-path update of classCards/<cid>, 7 records {name, core:false, why:skill:aquatics.biotic_index, by, ts}", Wr(w).length===n+1&&wr.op==="update"&&wr.path==="classCards/"+CID&&Object.keys(wr.val).length===7&&Object.keys(wr.val).every(k=>{ const r=wr.val[k]; return k.indexOf(BIO+"/o")===0&&r.core===false&&r.why==="skill:aquatics.biotic_index"&&r.by===w._envs.uid&&typeof r.ts==="number"&&typeof r.name==="string"&&!("hide" in r); }), wr);
  ok("…the guarded card (on the test) is not in it", !(BIO+"/o369" in wr.val));
  const m1=nowMin(w);
  ok("the top line: core 1,528 → 1,521; New a day / minutes re-run (never up)", c0===1528&&nowCore(w)===1521&&m1&&m1.min<=m0.min&&m1.npd<=m0.npd, [c0,nowCore(w),m0,m1]);
  ok("📚 Cards and 📅 Pace read the same: the cards lose ⭐ (unit core kept as ucore); the deck's core count drops by 7", card(w,BIO,"How do you get the Biotic Index Value?").core===false&&card(w,BIO,"How do you get the Biotic Index Value?").ucore===true&&w.O.cppSections().find(s=>s.id==="aquatics").decks.find(d=>d.key===BIO).core===S0-7);
  ok("✂️ Trimmed so far lists them under 🧩 Biotic index", (T.cptrTap("g","T"),/🧩 Biotic index/.test(view(w)))&&T.cptrModel().trimmed.filter(t=>t.layer==="class").length===7);
  w.O.cpceUndo(); const u=last(w);
  ok("Undo: ONE update putting the 7 records back as they were (removed)", u.op==="update"&&u.path==="classCards/"+CID&&Object.keys(u.val).length===7&&Object.values(u.val).every(v=>v===null)&&nowCore(w)===1528); }

console.log("\n── one card: ✂️ Make optional · 🙈 Hide · Skip ──");
{ const w=trim("teacher"), T=w.T, X=T.cptrModel(), be=X.C.find(r=>r.c.name==="Bald Eagle · class");
  T.cptrTap("g","C"); T.cptrTap("d","C|Wildlife · ID"); T.cptrTap("r",be.c.id); let h=view(w);
  ok("a picture card opened: its back, ✂️ Make optional, 🙈 Hide, Skip", h.indexOf("cptrOne('"+be.c.id+"','C','core')")>0&&h.indexOf("cptrOne('"+be.c.id+"','C','hide')")>0&&h.indexOf("cptrSkip('"+be.c.id+"',true)")>0);
  const n=Wr(w).length; T.cptrOne(be.c.id,"C","core"); const wr=last(w);
  ok("✂️ Make optional: ONE set of classCards/<cid>/Wildlife · ID/o<n> {name, core:false, why:trim:C}", Wr(w).length===n+1&&wr.op==="set"&&wr.path==="classCards/"+CID+"/Wildlife · ID/o"+be.c.o&&wr.val.core===false&&wr.val.why==="trim:C"&&wr.val.name==="Bald Eagle · class", wr);
  ok("…the core count drops by one", nowCore(w)===1527);
  const bb=X.C.find(r=>r.c.name==="Black Bear · class"); T.cptrSkip(bb.c.id,true); const sk=last(w);
  ok("Skip: classes/<cid>/dismissed/trim~<id> {by, ts, t} (the suggestions' Not now node); the card shows skipped", sk.op==="set"&&/^classes\/ms-science-2026\/dismissed\/trim~[a-z0-9]+$/.test(sk.path)&&sk.val.by===w._envs.uid&&/^trim: Black Bear · class$/.test(sk.val.t)&&/you skipped it/.test(rowOf(T.cptrModel(),bb.c.id).g.skip));
  T.cptrSkip(bb.c.id,false); ok("↩ Ask again removes it", last(w).op==="remove"&&last(w).path===sk.path&&!rowOf(T.cptrModel(),bb.c.id).g.skip);
  T.cptrTap("act","hide"); T.cptrTap("g","A"); h=view(w);
  ok("the group bar's ✂️ Make optional / 🙈 Hide choice; Rule A's copies (already optional) go by Hide", /cptrTap\('act','hide'\)/.test(h)&&/Accept this group · 63<\/button>/.test(h)); }

console.log("\n── Rule A · 🔗 Merge: Baseflow, both backs ──");
{ const w=trim("teacher"), T=w.T, X=T.cptrModel(), bf=X.A.find(r=>r.c.name==="Baseflow");
  ok("Baseflow's other copy is a 🔗 Merge (its kept card's back already holds both meanings)", bf&&bf.merge===true&&bf.keep.deck==="Forestry · Terms"&&bf.c.deck==="Aquatic Ecology · Terms");
  ok("…12 fronts to merge, as Trim 1 found", new Set(X.A.filter(r=>r.merge).map(r=>r.c.name.toLowerCase())).size===12, X.A.filter(r=>r.merge).map(r=>r.c.name));
  T.cptrTap("g","A"); T.cptrTap("d","A|Aquatic Ecology · Terms"); T._cptr.more["A|Aquatic Ecology · Terms"]=999; T.cptrTap("r",bf.c.id); const h=view(w);
  ok("opened: both backs side by side (Kept · Forestry · Terms “In Forestry: …” | This copy · Aquatic Ecology · Terms), the merged back to edit, 🔗 Merge", /Kept · Forestry · Terms/.test(h)&&/In Forestry: Water that flows laterally/.test(h)&&/This copy · Aquatic Ecology · Terms/.test(h)&&/id="cptr-mb"/.test(h)&&h.indexOf("cptrMergeSave('"+bf.c.id+"')")>0);
  w.el("cptr-mb",bf.keep.def); let n=Wr(w).length; T.cptrMergeSave(bf.c.id); let wr=last(w);
  ok("🔗 Merge with the back as it is: ONE set — the copy hidden {hide, why:trim:A, mergedInto:<kept card>}", Wr(w).length===n+1&&wr.op==="set"&&wr.path==="classCards/"+CID+"/Aquatic Ecology · Terms/o"+bf.c.o&&wr.val.hide===true&&wr.val.why==="trim:A"&&wr.val.mergedInto===bf.keep.id, wr);
  T.cptrPutOne(bf.c.id); ok("↩ Put back: the copy's record removed", last(w).op==="remove"&&last(w).path===wr.path);
  const w2=trim("teacher"), T2=w2.T, bf2=T2.cptrModel().A.find(r=>r.c.name==="Baseflow"); w2.el("cptr-mb","In Forestry: groundwater flow into streams. · In Aquatics: the flat part of a hydrograph.");
  n=Wr(w2).length; T2.cptrMergeSave(bf2.c.id); wr=last(w2); const kk="Forestry · Terms/o"+bf2.keep.o, ck="Aquatic Ecology · Terms/o"+bf2.c.o;
  ok("with her merged back: ONE update — the kept card's {def, why:trim:A, mergeFrom} + the copy hidden", Wr(w2).length===n+1&&wr.op==="update"&&wr.val[kk].def.indexOf("flat part of a hydrograph")>0&&wr.val[kk].mergeFrom===bf2.c.id&&wr.val[kk].why==="trim:A"&&wr.val[ck].hide===true&&wr.val[ck].mergedInto===bf2.keep.id, wr);
  T2.cptrPutBack("trim:A"); const pb=last(w2);
  ok("↩ Put back all (by why trim:A): ONE update that removes both, so the unit's back is back", pb.op==="update"&&pb.val[kk]===null&&pb.val[ck]===null, pb); }

console.log("\n── Rule D · ✏️ Shorten ──");
{ const w=trim("teacher"), T=w.T, X=T.cptrModel();
  ok("114 core backs over 110 characters, longest first (Trim 1's merged backs lead, then Colluvium)", X.D.length===114&&X.D.every((r,i)=>i===0||r.len<=X.D[i-1].len)&&X.D.some(r=>r.c.name==="Colluvium"), X.D.slice(0,2).map(r=>r.c.name));
  const co=X.D.findIndex(r=>r.c.name==="Colluvium"); ok("…every one over 110, Colluvium's 196 among the first", X.D.every(r=>r.len>110)&&co>=0&&X.D[co].len===196&&X.D.slice(0,co).every(r=>/ · In /.test(r.c.def)), [co,X.D[co]&&X.D[co].len]);
  const r=X.D[co]; T.cptrTap("g","D"); T.cptrTap("d","D|"+r.c.deck); T.cptrShortOpen(r.c.id); let h=view(w);
  ok("✏️ Shorten opens the back right there", /id="cptr-sb"/.test(h)&&h.indexOf("cptrShortSave('"+r.c.id+"')")>0);
  w.el("cptr-sb","Soil material moved downslope by gravity."); const n=Wr(w).length; T.cptrShortSave(r.c.id); const wr=last(w);
  ok("Save: ONE set of her class's back (CPCARDSEDIT's record, ✎ Edited), the app wrote none of it", Wr(w).length===n+1&&wr.op==="set"&&wr.val.def==="Soil material moved downslope by gravity."&&wr.val.name==="Colluvium"&&!("why" in wr.val)); }

console.log("\n── the trim goal ──");
{ const w=trim("teacher"), T=w.T, G=[{name:"Area",date:"2027-03-22"},{name:"State",date:"2027-04-23"}];
  ok("cptrGoalRec (pure): a class goal, 50–100%, 10–120 min", T.cptrGoalRec({goal:"State",pct:"90",cal:"noWeekends",min:"40"},G,"u",5).rec.maxMinutes===40&&T.cptrGoalRec({goal:"Nope",pct:95,cal:"class",min:45},G,"u",5).ok===false&&T.cptrGoalRec({goal:"Area",pct:40,cal:"class",min:45},G,"u",5).ok===false&&T.cptrGoalRec({goal:"Area",pct:95,cal:"class",min:5},G,"u",5).ok===false);
  T.cptrGoalOpen(); ok("change opens the goal's form", /id="cptr-g-goal"/.test(view(w)));
  w.el("cptr-g-goal","State"); w.el("cptr-g-pct","95"); w.el("cptr-g-cal","noWeekends"); w.el("cptr-g-min","40"); const n=Wr(w).length; T.cptrGoalSave(); const wr=last(w);
  ok("Save the goal: ONE set of classes/<cid>/trimGoal {goal, pct, calendar, maxMinutes, by, ts}", Wr(w).length===n+1&&wr.op==="set"&&wr.path==="classes/"+CID+"/trimGoal"&&wr.val.goal==="State"&&wr.val.calendar==="noWeekends"&&wr.val.maxMinutes===40&&wr.val.by===w._envs.uid);
  settle(w); ok("the line follows: by State (Apr 23) on weekends too in ≤ 40 min a day", /by State \(Apr 23\) on weekends too in ≤ 40 min a day/.test(text(view(w))), text(view(w)).slice(0,300)); }

console.log("\n── 🔒 CPLOCKS: Adrienne locked the cards ──");
{ const w=trim("teacher"); w._envc.cls.locks={cards:true}; w.T._cptr.memo=null; w.T.cptrTap("g","C"); w.T.cptrTap("d","C|Wildlife · ID"); const X=w.T.cptrModel(), be=X.C.find(r=>r.c.name==="Bald Eagle · class"); w.T.cptrTap("r",be.c.id); const h=view(w);
  ok("the teacher sees the list and the numbers, a lock line, and no Accept / Skip / Put back / change", /locked the cards: you can see the list and the numbers; accepting is off/.test(h)&&/Now: <b>/.test(h)&&!/cptrAccept\(|cptrOne\(|cptrSkip\(|cptrPut|cptrGoalOpen\(/.test(h));
  const n=Wr(w).length; ok("…and every tap refuses (no write)", w.T.cptrOne(be.c.id,"C","core")===false&&w.T.cptrAccept("skill",true)===0&&w.T.cptrSkip(be.c.id,true)===false&&w.T.cptrGoalSave()===false&&Wr(w).length===n);
  w.envsDemoGo("admin"); w.envcView("cpcards"); w.T._cptr.on=true; w.T._cptr.memo=null; ok("Adrienne keeps hers", !/accepting is off/.test(view(w))&&/cptrTap\('mode','unit'\)/.test(view(w))); }

console.log("\n── Adrienne's unit layer: units/<id>/trim, every class ──");
{ const w=demo("admin"); w.envcView("cpcards"); w.T.cptrToggle(); settle(w); const T=w.T;
  ok("Adrienne gets “Trim for: 🏫 This class · 📦 The unit · every class”", /🏫 This class/.test(view(w))&&/📦 The unit · every class/.test(view(w)));
  T.cptrTap("mode","unit"); let h=view(w);
  ok("unit mode says every class gets it, and Lincoln only through a repo PR", /trimming <b>for the unit<\/b>: every class gets it/.test(h)&&/Lincoln’s cards change only when a repo PR bakes these into the unit/.test(h));
  const X=T.cptrModel(), good=rowOf(X,BIO+"#o369");
  ok("in the unit, a card on a test comes out class by class, never for every class", /a test card comes out class by class/.test(good.g.block));
  const n=Wr(w).length; T.cptrAccept("skill|aquatics.biotic_index",true); const wr=last(w);
  ok("Accept: ONE update of units/nc_envirothon/trim — 7 records {name, core:false, why}, keyed o<order>; classCards untouched", Wr(w).length===n+1&&wr.op==="update"&&wr.path==="units/"+UID+"/trim"&&Object.keys(wr.val).length===7&&Object.keys(wr.val).every(k=>/^Aquatic Ecology · Facts\/o\d+$/.test(k)&&wr.val[k].core===false&&wr.val[k].why==="skill:aquatics.biotic_index"), wr);
  T.cptrTap("mode","class"); settle(w);
  ok("back in her class view: the core count already has Adrienne's 7 out (1,521), listed under “by Adrienne for the unit”", nowCore(w)===1521&&(T.cptrTap("g","T"),/Adrienne trimmed 7 for the unit/.test(view(w))));
  const c=card(w,BIO,"How do you get the Biotic Index Value?"); T.cptrKeep(c.id,true); const kp=last(w);
  ok("↩ Keep it for my class: ONE set of classCards/<cid>/…/o372 {name, keep:true}; the card is core again for the class", kp.op==="set"&&kp.path==="classCards/"+CID+"/"+BIO+"/o372"&&kp.val.keep===true&&kp.val.name===c.name&&nowCore(w)===1522);
  T.cptrTap("mode","unit"); T.cptrUndo(); const un=last(w);
  ok("unit Undo: ONE update of units/<id>/trim putting the 7 back (removed)", un.op==="update"&&un.path==="units/"+UID+"/trim"&&Object.values(un.val).every(v=>v===null)&&Object.keys(un.val).length===7);
  const w2=demo("teacher"); w2.envcView("cpcards"); w2.T.cptrToggle(); ok("a teacher has no unit mode", !/cptrTap\('mode','unit'\)/.test(view(w2))&&(w2.T.cptrTap("mode","unit"),w2.T._cptr.mode==="class")); }

console.log("\n── the kid (the demo's kid, then a live boot) ──");
{ const w=trim("teacher"), T=w.T; T.cptrAccept("skill|aquatics.biotic_index",true);
  w._envs.kid=w._envs.kid||"maya"; const kid=w._envs.kid;
  const deck=LIB.unit.decks.find(d=>d.key===BIO), u={decks:[{key:BIO,cards:deck.cards.map(c=>Object.assign({},c))}]}, old=u.decks[0].cards;
  ok("her class's trim reaches the class's own kid in memory: the 7 cards stay, no longer core (a new card list, so nothing cached carries over)", T.cptrHydrate(u)===true&&u.decks[0].cards!==old&&u.decks[0].cards.length===old.length&&u.decks[0].cards.filter((c,i)=>old[i].core===true&&c.core===false).length===7&&u.decks[0].cards.find(c=>c.name==="How do you get the Biotic Index Value?").trimmed===true);
  T._cptr.U[UID]={[BIO]:{o1:{name:deck.cards[0].name,hide:true,why:"trim:B",by:"a",ts:1}}}; w._cpce=w._cpce;
  const I={L:{},hide:{},def:{},add:{},any:false}; T.cptrKidIdx(I);
  ok("a card Adrienne hid for the unit joins the kid's hidden list (bank, sitting, drill, games, ID Flash leave it)", I.hide[BIO]&&I.hide[BIO][deck.cards[0].name]===1&&I.any===true);
  const I2={L:{[BIO]:{o1:{name:deck.cards[0].name,keep:true,by:"t",ts:2}}},hide:{},def:{},add:{},any:false}; T.cptrKidIdx(I2);
  ok("…unless her class keeps it", !I2.hide[BIO]);
  const lv=W({w:{search:""}}); lv._envs.role="kid"; lv._envs.kid="k1"; lv._envs.cid=CID; const reads=lv.G.reads.length;
  const sdb={ref:p=>({once:(ev,fn)=>{ lv.G.reads.push(p); fn({val:()=>({[BIO]:{o372:{name:"How do you get the Biotic Index Value?",core:false,why:"trim:B",by:"a",ts:1}}})}); }})};
  const went=lv.T.cptrKidLoad(sdb,CID);
  ok("a live kid's boot reads units/<id>/trim ONCE per attached unit (and not again)", went===true&&lv.G.reads.slice(reads).join()==="units/"+UID+"/trim"&&lv.T.cptrKidLoad(sdb,CID)===false&&lv.G.writes.length===0, lv.G.reads.slice(reads));
  const pr=W({w:{search:""}}); pr._envs.role="teacher"; ok("…a teacher's or Adrienne's app doesn't (the console listens instead)", pr.T.cptrKidLoad(sdb,CID)===false); }

console.log("\n── the pure records ──");
{ const w=W({w:{fam:HOWE}}), T=w.T, c={name:"Front",deck:"D",o:3};
  const a=T.cptrRecNext(c,{name:"Front",def:"her back",by:"x",ts:1},"core","trim:B","u",9);
  ok("cptrRecNext keeps her edited back and adds {core:false, why}", a.def==="her back"&&a.core===false&&a.why==="trim:B"&&a.by==="u"&&a.ts===9&&!("hide" in a));
  ok("cptrRecBack: a trim alone → null; with her back → the back stays; a merge restores prevDef", T.cptrRecBack({name:"F",core:false,why:"trim:B"},"u",1)===null&&T.cptrRecBack(a,"u",1).def==="her back"&&!("core" in T.cptrRecBack(a,"u",1))&&T.cptrRecBack({name:"F",def:"merged",why:"trim:A",mergeFrom:"x",prevDef:"old"},"u",1).def==="old"&&T.cptrRecBack({name:"F",def:"merged",why:"trim:A",mergeFrom:"x"},"u",1)===null);
  const d=demo("teacher"); d.envcView("cpcards"); const cc=card(d,"Forestry · Terms","Baseflow");
  ok("CPCARDSEDIT's cpceNext keeps a trim when a hide is undone (the record isn't dropped)", d.O.cpceNext(cc,{name:"Baseflow",core:false,why:"trim:A",hide:true},{hide:false},"u",1).core===false&&d.O.cpceNext(cc,{name:"Baseflow",hide:true},{hide:false},"u",1)===null); }

console.log("\n── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon/SITE_RULES.json"),"utf8")).rules, cc=R.classCards.$cid.$deck.$card, ut=R.units.$unitId.trim;
  ok("classCards: a record may be {core:false} or {keep:true}; why / mergedInto / mergeFrom / prevDef / keep are allowed, nothing else new", /newData\.child\('core'\)\.val\(\) == false/.test(cc[".validate"])&&/newData\.child\('keep'\)\.val\(\) == true/.test(cc[".validate"])&&["why","mergedInto","mergeFrom","prevDef","keep"].every(k=>cc[k])&&cc.$other[".validate"]===false&&/\^\(trim:\[A-D\]\|skill:/.test(cc.why[".validate"]));
  ok("…the teacher's card write still needs locks/cards off", /locks\/cards'\)\.val\(\) != true/.test(cc[".write"]));
  ok("units/<id>/trim: every login reads, ONLY an admin writes; o<order> keys; {name, why, by, ts} + hide or core:false", ut[".read"]==="auth != null"&&ut[".write"]==="auth != null && root.child('admins/'+auth.uid).val() == true"&&/\^o\[0-9\]/.test(ut.$deck.$card[".validate"])&&ut.$deck.$card.$other[".validate"]===false);
  ok("units/<id>/trimGoal and trimSkip: admin only", /admins/.test(R.units.$unitId.trimGoal[".write"])&&/admins/.test(R.units.$unitId.trimSkip[".write"]));
  const cl=R.classes.$cid;
  ok("classes/<cid>/trimGoal and trimTicks: the class's teacher, only while the cards aren't locked; shapes checked", /locks\/cards'\)\.val\(\) != true/.test(cl.trimGoal[".write"])&&/locks\/cards'\)\.val\(\) != true/.test(cl.trimTicks[".write"])&&cl.trimGoal.$other[".validate"]===false&&/class\|school\|weekdays\|noWeekends\|every/.test(cl.trimGoal.calendar[".validate"]));
  const w=trim("teacher"), T=w.T; T.cptrAccept("skill|aquatics.biotic_index",true); const v=Object.values(last(w).val)[0];
  ok("the shapes the code writes use only allowed keys", Object.keys(v).every(k=>k in cc)&&(()=>{ T.cptrTick("texture_feel"); return Object.keys(last(w).val).every(k=>k in cl.trimTicks.$key); })()); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
function CPTR_REASONS(w){ const T=w.T; return ["skill","A","B","C","D"].map(k=>{ T.cptrTap("g",k); const h=view(w), s=T.CPTR_STEPS.find(x=>x[0]===k); return h.indexOf(s[2].replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"))>=0; }); }
run().catch(e=>{ console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
