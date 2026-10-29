/*
 * Node tests — 🏅 CPSPECIALIST, a student is the class's "master" of one section (DESIGN_class_platform_2026-10-28.md §8.9, §8.7, §8.8, §9.1,
 * §13 row 21, §14 Q32; PR 21 of the class platform). Her words 2026-10-28: "kids split up … master of each subject … easily turned off …
 * keep reviewing."
 *   · how it is hooked: one block right after CPSECTIONS, every line outside it tagged 🏅 CPSPECIALIST and typeof-guarded;
 *   · the rule (pure): the defaults ← the class's ← the student's own; CPSHARE's mix of their section at 70 % and the rest over their On sections;
 *   · the REAL mstPile (sliced from index.html, with CPCORE, CPSHARE and CPSECTIONS) on the REAL NC Envirothon unit: a Forestry specialist's
 *     new cards come from Forestry while Soils keeps its reviews; Soils switched back On shares 30 %; the class's own Off still wins;
 *     CPPACE's Core only opens for their section alone;
 *   · BYTE-IDENTICAL REPLAYS: 40 study days of the real engine with and without this block — every Howe kid (no edition), Lincoln (a mark in
 *     the data, not the site's kid), the site's kid with nothing set, the feature off, a teacher login — the same pile every day;
 *   · the kid's live listener, the 🌿 start's line;
 *   · the console: 💪 Who is strong where ▸ Make specialist ▸ Undo, one update each through envsWrite; the student page; ⚙️ Class settings;
 *     🏅 on the grid; the 🎚 On tap that beats the specialist's Review only; Adrienne's 🔒 locks/specialists (and the two switches CPLOCKS gains);
 *   · 📅 Pace: the row reads 🏅 and "review only", "needs from now" runs with their share and their section's non-core cards;
 *   · the demo: Teacher ▸ Who is strong where ▸ Make Maya Forestry specialist ▸ her pace row and 🌿 start change;
 *   · Howe: nothing read, written or listened to; the rules file.                                         run: node test_cp_specialist.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CORE,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const SPEC=cut("// CPSPECIALIST_START","// CPSPECIALIST_END"), SEC=cut("// CPSECTIONS_START","// CPSECTIONS_END"), LOCKS=cut("// CPLOCKS_START","// CPLOCKS_END");
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), SHARE=cut("// CPSHARE_START","// CPSHARE_END"), PACE=cut("// CPPACE_START","// CPPACE_END");
const MST=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"), ELIG=cut("function mastBankEligible(kid,cat){","\n}\n");
const UNITJ=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const SECS=[["general","General Concepts"],["forestry","Forestry"],["soils","Soils and Land Use"],["aquatics","Aquatic Ecology"],["wildlife","Wildlife"],["cei","Current Issue"]];
const secOf=k=>(SECS.find(s=>String(k).indexOf(s[1]+" · ")===0)||[])[0]||null;
const SPEC_NAMES="CPSPEC_SHARE, CPSPEC_PARTS, _cpspec, cpSpecSite, cpSpecOpts, cpSpecMix, cpSpecOf, cpSpecKid, cpSecLayer, cpShareRuleFor, cpSpecNonCore, cpSpecListen, cpSpecStartNote, cpSpecPaceOpt, cpSpecPaceMark, cpSpecLockParts, cpSpecMake, cpSpecUndo, cpSpecUndoClose, cpSpecSetOpt, cpSpecLock, cpSpecCellTag, cpSpecStrongBtn, cpSpecStrongBarHtml, cpSpecStudentHtml, cpSpecSetHtml";
const SEC_NAMES="cpSecState, cpSecOfStudent, cpSecSet, cpSecDemoPile, cpSecStartNote";

// ── the engine sandbox: the real study engine + mastBankEligible + CPCORE + CPSHARE + CPSECTIONS + CPPACE's Core only + (optionally) this block.
//    site = {on, kid, sid, role, cls (the class record: plan, features), mine (students/<sid>/sections), spec (students/<sid>/specialist), layers, feature}
function engine(withBlock,site,md,us){
  site=site||{};
  const E=new Function("masteryData","unitStudies","window","site","SECS","secOf",`
    let masteryKid=null; const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
    const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; const cy=item.cycle||1; return (pn-1)%iv===(cy-1)%iv; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(){ return false; }
    function mastFullBank(kid){ const base={}; let c=masteryData[kid+"_custom_items"]||[]; if(!Array.isArray(c)) c=Object.values(c); c.forEach(ci=>{ if(!ci) return; (base[ci.cat]=base[ci.cat]||[]); if(base[ci.cat].indexOf(ci.name)<0) base[ci.cat].push(ci.name); }); return base; }
    ${ELIG}
    const ENV_UNIT_ID="nc_envirothon", ENV_SESSION_SID="envirothon"; const _envs={kid:site.kid||"",sid:site.sid||"",role:site.role||"",cls:site.cls||null};
    function envSiteOn(){ return !!site.on; } function envsDemo(){ return false; } function envClsLayers(){ return site.layers||[{},{}]; }
    function cpFeature(n,cls){ return site.feature!==false; }
    function envsStations(){ return SECS.map(s=>({id:s[0],label:s[1],short:s[1].split(" ")[0],decks:((unitStudies.nc_envirothon||{}).decks||[]).filter(d=>secOf(d.key)===s[0]).map(d=>({key:d.key}))})); }
    function envsStationOfDeck(k){ return secOf(k); }
    function cppSite(){ return !!site.on; } function cppCls(){ return _envs.cls; }
    ${fn("cpPaceCoreOnly")}
    ${CORE}
    ${SHARE}
    ${SEC}
    ${withBlock?SPEC:""}
    ${MST}
    _cpsec.mine=site.mine||null; ${withBlock?"_cpspec.mine=site.spec||null;":""}
    return { mstPile, mstSessions, cpPaceCoreOnly, _envs, X:{ ${SEC_NAMES} }, S:${withBlock?"{ "+SPEC_NAMES+" }":"null"} };`)(md,us,{},site,SECS,secOf);
  return E;
}
const deckOf=k=>UNITJ.decks.find(d=>d.key===k);
const US={nc_envirothon:{id:"nc_envirothon",decks:UNITJ.decks}};
const FT="Forestry · Terms", FF="Forestry · Facts", ST="Soils and Land Use · Terms", SF="Soils and Land Use · Facts";
// a student with Soils and Forestry open: in each deck some cards on the ladder (due today), some still being learned, the rest new
function kidMd(kid,decks,sess){
  kid=kid||"k"; decks=decks||[ST,FT]; const md={[kid]:[],[kid+"_custom_items"]:[],[kid+"_sessions"]:{envirothon:Object.assign({name:"Envirothon",kind:"deck",decks,who:"solo",newPerDay:6,passes:2,order:"bank",maxCards:0,focusDecks:0},sess||{})}};
  let id=0; decks.forEach(k=>{ const cs=deckOf(k).cards; cs.forEach(c=>md[kid+"_custom_items"].push({cat:k,name:c.name,def:c.def}));
    cs.slice(0,3).forEach(c=>md[kid].push({id:"r"+(++id),subject:k,prompt:c.name,answer:"",status:"active",tier:"every_other_day",next_due:0,cycle:1,consecutive_correct:1}));
    cs.slice(3,5).forEach(c=>md[kid].push({id:"l"+(++id),subject:k,prompt:c.name,answer:"",status:"introduction",tier:"daily",tally_dots:1,cycle:1})); });
  return md; }
const SITE=o=>Object.assign({on:true,kid:"k",sid:"fam_k",role:"kid"},o||{});
const secsOf=(list,f)=>{ const o={}; list.forEach(x=>{ const s=secOf(f(x)); o[s]=(o[s]||0)+1; }); return o; };
const pile=(E,kid,day)=>E.mstPile(kid||"k","envirothon",day||1,null);

// ── the site world (test_env_site.js) with the real engine, CPLOCKS, CPPACE, CPSHARE, CPSECTIONS and this block
const ENG=[constLine("MAST_TIER_INT"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores"].map(fn),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return 400; }",
  MST, "G.eng={ mstSessions, mstPile };"].join("\n");
const XS=SEC+"\nG.sec={ "+SEC_NAMES+", cpSecPicked, cpSecPick, cpSecStudentHtml };";
const XP=SPEC+"\nG.spec={ "+SPEC_NAMES+" };";
const PX=PACE+"\nG.pace={ _cpp, cpPacePlan, cpNeedPerDay, cppInputs, cppDraft, cppRow, cpPaceFlush, cpPaceHtml };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,rev:LOCKS+"\nG.locks={ CPL_PARTS, cpLockSet, cpLocked, cpLockSetupHtml };\n"+REV+"\n"+PX+"\n"+SHARE+"\n"+XS+"\n"+(o.noSpec?"":XP)+"\n"+ENG,now:Date.UTC(2026,9,29,15,0,0)},o.w||{}));
  w.X=w.G.sec; w.S=w.G.spec; w.P=w.G.pace; w.E=w.G.eng; w.L=w.G.locks; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function liveConsole(role){ const w=W(); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true,fam_j:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"},fam_j:{meta:{name:"Jo M.",familyId:"fam",kid:"j"},class:"c1"}}; return w; }
const txt=h=>String(h||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ");

const run=async()=>{
console.log("── how it is hooked ──");
{ const a=src.indexOf("// CPSPECIALIST_START"), b=src.indexOf("// CPSPECIALIST_END");
  ok("one CPSPECIALIST block, right after CPSECTIONS_END", a>0&&b>a&&src.indexOf("// CPSPECIALIST_START",a+1)<0&&src.indexOf("// CPSPECIALIST_END",b+1)<0&&src.slice(src.indexOf("// CPSECTIONS_END"),a).trim()==="// CPSECTIONS_END");
  ok("the header names §8.9, PR 21, her words and the date", /§8\.9/.test(SPEC)&&/PR 21/.test(SPEC)&&/master of each subject/.test(SPEC)&&/keep reviewing/.test(SPEC)&&/2026-10-28/.test(SPEC));
  ok("the block only declares, plus the one call that adds Adrienne's two switches to CPLOCKS's list", SPEC.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |}|cpSpecLockParts\(\);$)/.test(l))&&SPEC.split("\n").filter(l=>/^cpSpecLockParts\(\);$/.test(l)).length===1);
  ok("no Howe kid name as a code literal, no 🔀, no direct database call (writes go through envcWrite → envsWrite)", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(SPEC)&&SPEC.indexOf("\u{1F500}")<0&&!/firebase\.|\bdb\.ref|envsWrite\(|envcMulti\(|\.update\(|\.set\(/.test(SPEC.replace(/^\s*\/\/.*$/mg,"")));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🏅 CPSPECIALIST/.test(l)), G=/typeof (cpSpec\w+|cpSecLayer) ?=== ?"function"/;
  ok("every line outside the block tagged 🏅 CPSPECIALIST is typeof-guarded on one of its functions", hooks.length>0&&hooks.every(l=>G.test(l)), hooks.filter(l=>!G.test(l)).map(l=>l.trim().slice(0,90)));
  const want=["cpSpecNonCore","cpSpecStartNote","cpSpecListen","cpSpecCellTag","cpSpecStudentHtml","cpSpecStrongBarHtml","cpSpecStrongBtn","cpSpecSetHtml","cpSpecPaceOpt"];
  ok("every hook is wired: Core only, the 🌿 start, the listener, the grid, the student page, Who is strong where ×2, Class settings, Pace", want.every(f=>hooks.some(l=>l.indexOf(f)>=0)), want.filter(f=>!hooks.some(l=>l.indexOf(f)>=0)));
  ok("CPSHARE's cpShareRuleFor and CPSECTIONS's cpSecLayer now have their readers (both typeof-guarded where they are called)", /typeof cpShareRuleFor==="function"/.test(SHARE)&&/typeof cpSecLayer==="function"/.test(SEC)&&/function cpShareRuleFor\(kid,r\)/.test(SPEC)&&/function cpSecLayer\(sid,sec\)/.test(SPEC));
  ok("CPSECTIONS's two saves store against the layer (an On tap beats a specialist's Review only)", (SEC.match(/cpSecStore\(\(\(typeof cpSecLayer==="function"\)&&cpSecLayer\(sid,sec\)\)\|\|/g)||[]).length===2); }

console.log("\n── the rule (pure) ──");
{ const S=engine(true,{},{},US).S;
  ok("defaults: 70 %, non-core open, the other sections Review only", JSON.stringify(S.cpSpecOpts([]))===JSON.stringify({share:70,nonCore:true,others:"review"}));
  ok("the class's values over the defaults, the student's own over the class's", JSON.stringify(S.cpSpecOpts([{study:{specialistShare:80,specialistNonCore:false,specialistOthers:"on"}},{study:{specialistShare:90}}]))===JSON.stringify({share:90,nonCore:false,others:"on"}));
  ok("values the app doesn't know are ignored", JSON.stringify(S.cpSpecOpts([{study:{specialistShare:30,specialistNonCore:"yes",specialistOthers:"off"}},{study:{specialistShare:70.5}}]))===JSON.stringify({share:70,nonCore:true,others:"review"}));
  ok("nothing else On: all of it from their section", JSON.stringify(S.cpSpecMix("forestry",[],70))==='{"newFrom":"mix","mix":{"forestry":100}}');
  ok("one other On: 7 : 3", JSON.stringify(S.cpSpecMix("forestry",["soils"],70).mix)==='{"forestry":7,"soils":3}');
  ok("three others On: 70×3 : 30 each → 7 : 1 : 1 : 1 (70 % and 10 % each)", JSON.stringify(S.cpSpecMix("forestry",["soils","aquatics","wildlife"],70).mix)==='{"forestry":7,"soils":1,"aquatics":1,"wildlife":1}');
  ok("100 %: their section alone; the section itself is never in its own 'others'", JSON.stringify(S.cpSpecMix("forestry",["soils"],100).mix)==='{"forestry":100}'&&JSON.stringify(S.cpSpecMix("forestry",["forestry","soils"],50).mix)==='{"forestry":1,"soils":1}');
  const big=S.cpSpecMix("a",Array.from({length:30},(_,i)=>"s"+i),70).mix, sh=big.a/Object.keys(big).reduce((t,k)=>t+big[k],0);
  ok("many sections: whole shares 1–100 that CPSHARE keeps, still about 70 %", Object.keys(big).every(k=>Number.isInteger(big[k])&&big[k]>=1&&big[k]<=100)&&sh>0.6&&sh<0.8, [big.a,big.s0,sh]); }

console.log("\n── the real mstPile: Soils and Forestry open, Maya is the Forestry specialist ──");
{ const p0=pile(engine(true,SITE(),kidMd(),US)), n0=secsOf(p0.newNames,n=>n.deck);
  ok("no mark: deck by deck, the day's new cards from Soils", n0.soils===6&&!n0.forestry, n0);
  const E1=engine(true,SITE({spec:"forestry"}),kidMd(),US), p1=pile(E1), n1=secsOf(p1.newNames,n=>n.deck), r1=secsOf(p1.reviews,i=>i.subject), l1=secsOf(p1.learning,i=>i.subject);
  ok("a Forestry specialist: every new card from Forestry (Soils is Review only)", n1.forestry===6&&!n1.soils, n1);
  ok("…the Soils reviews still come and its learning cards finish; Forestry's as before", r1.soils===3&&r1.forestry===3&&l1.soils===2&&l1.forestry===2, [r1,l1]);
  ok("…the reader: cpSecState says Soils 'review', Forestry On; the bank gives no Soils cards", E1.X.cpSecState("k","soils")==="review"&&E1.X.cpSecState("k","forestry")===""&&E1.S.cpSecLayer("fam_k","forestry")==="");
  const E2=engine(true,SITE({spec:"forestry",mine:{soils:"on"}}),kidMd(),US); let F=0, So=0;
  for(let d=1;d<=10;d++){ const n=secsOf(pile(E2,"k",d).newNames,x=>x.deck); F+=n.forestry||0; So+=n.soils||0; }
  ok("the teacher switches Soils back On (her 'on'): 70 % Forestry · 30 % Soils over 10 days (42 · 18)", F===42&&So===18, [F,So]);
  const E3=engine(true,SITE({spec:"forestry",mine:{soils:"on"},layers:[{study:{specialistShare:80}},{study:{specialistShare:100}}]}),kidMd(),US);
  ok("…the student's own share (100 %) over the class's (80 %): all from Forestry", secsOf(pile(E3).newNames,n=>n.deck).forestry===6);
  const E4=engine(true,SITE({spec:"forestry",layers:[{study:{specialistOthers:"on"}},{}]}),kidMd(),US); F=0; So=0;
  for(let d=1;d<=10;d++){ const n=secsOf(pile(E4,"k",d).newNames,x=>x.deck); F+=n.forestry||0; So+=n.soils||0; }
  ok("the class keeps a specialist's other sections On: Soils stays On and shares 30 %", E4.X.cpSecState("k","soils")===""&&F===42&&So===18, [F,So]);
  const E5=engine(true,SITE({spec:"forestry",cls:{plan:{soils:{state:"off"}}}}),kidMd(),US), p5=pile(E5);
  ok("the class's own Off on Soils still wins over the mark (paused: no Soils reviews either)", E5.X.cpSecState("k","soils")==="off"&&!p5.reviews.some(i=>secOf(i.subject)==="soils")&&secsOf(p5.newNames,n=>n.deck).forestry===6);
  const slow=()=>{ const m=kidMd("k",[ST,FT],{focusDecks:1}); m.k=m.k.filter(i=>secOf(i.subject)==="soils"); return m; };   // a slow student: Soils still being learned, Forestry not started
  const n6=secsOf(pile(engine(true,SITE(),slow(),US)).newNames,n=>n.deck), m6=secsOf(pile(engine(true,SITE({spec:"forestry"}),slow(),US)).newNames,n=>n.deck);
  ok("'Decks introducing at once' = 1, a slow student: the started Soils deck holds the seat with no mark; the specialist's Forestry gets a seat of its own", n6.soils===6&&!n6.forestry&&m6.forestry===6&&!m6.soils, [n6,m6]);
  ok("the feature off (🏫 Words and features): the mark is ignored, the pile as with none", JSON.stringify(pile(engine(true,SITE({spec:"forestry",feature:false}),kidMd(),US)))===JSON.stringify(p0));
  ok("a mark for a section the class doesn't have, or a teacher login: as with none", JSON.stringify(pile(engine(true,SITE({spec:"narnia"}),kidMd(),US)))===JSON.stringify(p0)&&JSON.stringify(pile(engine(true,SITE({spec:"forestry",role:"teacher"}),kidMd(),US)))===JSON.stringify(pile(engine(true,SITE({role:"teacher"}),kidMd(),US)))); }

console.log("\n── Core only opens for their section alone (CPPACE) ──");
{ const cs=deckOf(FT).cards, core=cs.filter(c=>c.core===true).slice(0,2).map(c=>c.name), non=cs.filter(c=>c.core!==true).slice(0,2).map(c=>c.name), names=core.concat(non);
  const scs=deckOf(ST).cards, sn=scs.filter(c=>c.core===true).slice(0,1).map(c=>c.name).concat(scs.filter(c=>c.core!==true).slice(0,1).map(c=>c.name));
  const cls={plan:{forestry:{coreOnly:true},soils:{coreOnly:true}}}, sess={decks:[FT,ST]};
  const N=engine(true,SITE({cls}),kidMd(),US), Y=engine(true,SITE({cls,spec:"forestry"}),kidMd(),US), Z=engine(true,SITE({cls,spec:"forestry",layers:[{study:{specialistNonCore:false}},{}]}),kidMd(),US);
  ok("Core only on Forestry: its non-core cards wait (no mark)", JSON.stringify(N.cpPaceCoreOnly("k",sess,FT,names))===JSON.stringify(core));
  ok("the Forestry specialist: the very same names back, non-core included", Y.cpPaceCoreOnly("k",sess,FT,names)===names);
  ok("…Soils (not their section) still core only", JSON.stringify(Y.cpPaceCoreOnly("k",sess,ST,sn))===JSON.stringify(sn.slice(0,1)));
  ok("…and the class's 'core only as planned' keeps it", JSON.stringify(Z.cpPaceCoreOnly("k",sess,FT,names))===JSON.stringify(core)); }

console.log("\n── byte-identical: the real engine, 40 days, with and without this block ──");
function replay(withBlock,site,kid,days,sess,decks){
  const md=kidMd(kid,decks||[FT,FF,ST,SF],sess), E=engine(withBlock,site,md,US), out=[]; let id=0;
  for(let day=1;day<=days;day++){ const p=E.mstPile(kid,"envirothon",day,null); out.push(JSON.stringify(p)); const items=md[kid];
    p.learning.forEach(i=>{ i.tally_dots=(i.tally_dots||0)+1; if(i.tally_dots>=4){ i.status="active"; i.tier="weekly"; i.next_due=day+5; } });
    p.reviews.forEach(i=>{ i.next_due=day+10; if(i.tier==="every_other_day") i.tier="weekly"; });
    p.newNames.forEach(n=>items.push({id:"n"+day+"_"+(++id),subject:n.deck,prompt:n.name,answer:"",status:"introduction",tier:"daily",tally_dots:1,cycle:1})); }
  return out; }
{ const MARK={spec:"forestry",cls:{plan:{forestry:{coreOnly:true}}},layers:[{study:{specialistShare:90,newFrom:"spread"}},{}]};
  const cases=[...["lincoln","ellis","lucy","julian"].map(k=>["Howe's "+k+" (no edition)",{on:false,kid:k},k]),
    ["Lincoln in Howe with a specialist mark in the data (not the site's kid)",Object.assign({on:false,kid:"lincoln"},MARK),"lincoln"],
    ["the site on, a mark saved, but this kid isn't the site's kid",Object.assign({on:true,kid:"maya",role:"kid"},MARK),"k"],
    ["the site's own kid with nothing set",SITE(),"k"],
    ["the site's own kid, the class's rule and Core only, no mark",SITE({cls:MARK.cls,layers:MARK.layers}),"k"],
    ["the site's own kid, the feature off",SITE(Object.assign({feature:false},MARK)),"k"],
    ["the site's own kid, a live teacher login (not a kid / parent)",SITE(Object.assign({role:"teacher"},MARK)),"k"],
    ["a mark the app doesn't know",SITE({spec:"later"}),"k"],
    ["Lincoln, Decks introducing at once = 2",{on:false,kid:"lincoln"},"lincoln",{focusDecks:2}]];
  cases.forEach(([lbl,site,kid,sess])=>{ const a=replay(true,site,kid,40,sess), b=replay(false,site,kid,40,sess);
    ok(lbl+": 40 days, every pile identical", a.length===40&&a.every((x,i)=>x===b[i])&&a.some(x=>JSON.parse(x).newNames.length>0)&&a.some(x=>JSON.parse(x).reviews.length>0), a.findIndex((x,i)=>x!==b[i])); });
  const a=replay(true,SITE({spec:"forestry"}),"k",40,null,[ST,SF,FT,FF]), b=replay(false,SITE({spec:"forestry"}),"k",40,null,[ST,SF,FT,FF]);
  ok("…and the mark itself does change the site kid's piles (the replay can see a difference)", a.some((x,i)=>x!==b[i]));
  const H=engine(true,{on:false,kid:"lincoln",spec:"forestry"},{},US).S, r={newFrom:"spread"}, names=["a"];
  ok("Howe: every hook hands back the very thing it was given and says no", H.cpShareRuleFor("lincoln",r)===r&&H.cpShareRuleFor("lincoln",null)===null&&H.cpSecLayer("fam_k","soils")===""&&H.cpSpecNonCore("lincoln","forestry")===false&&H.cpSpecStartNote("lincoln")===""&&JSON.stringify(H.cpSpecPaceOpt("x",{coreOnly:{}}))==="{}"&&H.cpSpecOf("fam_k")===""); }

console.log("\n── the kid's app: the live listener and the 🌿 start ──");
{ const w=W({w:{remote:{"students/fam_k/specialist":"forestry"}}}); w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.cls={features:{specialists:true}}; let re=0;
  ok("a kid login: one live listener on students/<sid>/specialist; its value is the mark", w.S.cpSpecListen(w.firebase.database(),()=>re++)===true&&w.G.listeners.filter(l=>l.p==="students/fam_k/specialist").length===1&&re===1&&w.S.cpSpecKid("k")==="forestry");
  ok("…once only", w.S.cpSpecListen(w.firebase.database(),()=>re++)===false&&w.G.listeners.filter(l=>l.p==="students/fam_k/specialist").length===1);
  ok("…CPSECTIONS reads the other sections as Review only, and the 🌿 start's lines say so", w.X.cpSecState("k","soils")==="review"&&w.S.cpSpecStartNote("k")===" · 🏅 Forestry specialist"&&/Soils: review only/.test(w.X.cpSecStartNote("k")));
  w._envs.cls={features:{specialists:false}}; ok("the class turns the feature off: the mark is ignored at once", w.S.cpSpecKid("k")===""&&w.X.cpSecState("k","soils")==="");
  const t=W(); t._envs.role="teacher"; t._envs.sid="fam_k"; ok("a teacher login: no listener", t.S.cpSpecListen(t.firebase.database(),()=>{})===false&&t.G.listeners.length===0);
  const d=demo("kid"); d._envc.students.ramirez_maya.specialist="forestry"; const sess=d.E.mstSessions("maya").find(s=>s.sid==="envirothon");
  ok("the demo kid's 🌿 start: '⚙️ Your class plan … · 🏅 Forestry specialist · General: review only · Soils: review only …'", /Your class plan[^<]*· 🏅 Forestry specialist · General: review only · Soils: review only/.test(d.envClsStartHtml("maya",sess)), d.envClsStartHtml("maya",sess)); }

console.log("\n── the demo: Teacher ▸ 💪 Who is strong where ▸ Make Maya Forestry specialist ──");
{ const w=demo("teacher"), S=w.S, n0=w._envs.writes.length; w.envcView("strong"); const h=w.G.content;
  ok("each station's ranking has 🏅 Make specialist beside each student (not General)", /cpSpecMake\('ramirez_maya','forestry'\)/.test(h)&&/🏅 Make specialist/.test(h)&&!/cpSpecMake\('[^']+','general'\)/.test(h)&&/Make specialist<\/b> puts a student on one station: 70%/.test(h));
  const p0=w.X.cpSecDemoPile(), d=w.P.cppDraft(), base=w.P.cpPacePlan(w.P.cppInputs(d)), maya=()=>w.envcStudents().find(s=>s.sid==="ramirez_maya");
  const r0=w.P.cppRow(maya(),d,base,{sync:true});
  S.cpSpecMake("ramirez_maya","forestry"); await w.flush();
  ok("Make specialist → ONE update through envsWrite: students/ramirez_maya/specialist = 'forestry'", w._envs.writes.length===n0+1&&JSON.stringify(w._envs.writes[n0])===JSON.stringify({op:"update",path:"/",val:{"students/ramirez_maya/specialist":"forestry"}}), w._envs.writes.slice(n0));
  const h2=w.G.content, p1=w.X.cpSecDemoPile();
  ok("the screen repaints: the bar with Undo, what the mark does, and Maya shows 🏅 specialist in Forestry", /🏅 Maya R\. is now the Forestry specialist/.test(txt(h2))&&/70% of the new cards from Forestry, all of Forestry’s cards open \(not only core\), the other sections Review only/.test(txt(h2))&&/cpSpecUndo\(\)/.test(h2)&&/🏅 specialist/.test(h2)&&!/cpSpecMake\('ramirez_maya','forestry'\)/.test(h2));
  ok("her 🌿 start changes: Percolation (Soils) leaves the new cards and Forestry fills them; the Soils reviews still come", p0.newNames.some(n=>n.name==="Percolation")&&!p1.newNames.some(n=>secOf(n.deck)==="soils")&&p1.newNames.length===p0.newNames.length&&p1.newNames.every(n=>secOf(n.deck)==="forestry")&&secsOf(p1.reviews,i=>i.subject).soils===secsOf(p0.reviews,i=>i.subject).soils, [p0.newNames.map(n=>n.name),p1.newNames.map(n=>n.name)]);
  ok("…and the bar shows it (🧪 Maya's next 🌿 start, the real engine)", /🧪 Maya’s next 🌿 start : new — Forestry ×5/.test(txt(h2)), txt(h2).slice(txt(h2).indexOf("🧪"),txt(h2).indexOf("🧪")+120));
  w.P._cpp.memo={}; const r1=w.P.cppRow(maya(),d,base,{sync:true});
  ok("her 📅 Pace row changes: Forestry reads 🏅, Soils 'review only' (was on the goal), left out of should be / is", /^🏅 /.test(r1.per.forestry.mark.t)&&r1.per.soils.mark.t==="review only"&&!r0.per.soils.out&&r1.per.soils.out==="review"&&r1.should<r0.should, [r0.per.soils,r1.per.soils.mark,r0.should,r1.should]);
  ok("…and 'needs from now' is worked out for her own mix", r1.need&&r0.need&&r1.need.n!==r0.need.n, [r0.need&&r0.need.n,r1.need&&r1.need.n]);
  w.envcView("pace"); for(let i=0;i<8;i++){ if(!w.P.cpPaceFlush()) break; } w.envcView("pace"); ok("📅 Pace's table: 🏅 in her Forestry cell", /🏅 [▲●▼]/.test(w.G.content));
  w.envcView("grid"); ok("📋 Class: 🏅 in Maya's Forestry cell", /title="Forestry specialist" aria-label="Forestry specialist">🏅/.test(w.G.content));
  w.envcView("strong"); S.cpSpecUndo(); await w.flush();
  ok("↩︎ Undo → ONE update back to what was there (null)", JSON.stringify(w._envs.writes[w._envs.writes.length-1])===JSON.stringify({op:"update",path:"/",val:{"students/ramirez_maya/specialist":null}})&&S.cpSpecOf("ramirez_maya")===""&&JSON.stringify(w.X.cpSecDemoPile().newNames)===JSON.stringify(p0.newNames));
  ok("…the bar is back to its one line (nothing to undo)", !/cpSpecUndo\(\)/.test(w.G.content)&&/Make specialist<\/b> puts a student on one station/.test(w.G.content));
  S.cpSpecMake("ramirez_maya","soils"); await w.flush(); S.cpSpecMake("ramirez_maya","forestry"); await w.flush(); S.cpSpecUndo(); await w.flush();
  ok("Undo after a change of station puts the old station back ('soils')", w._envc.students.ramirez_maya.specialist==="soils"&&JSON.stringify(w._envs.writes[w._envs.writes.length-1].val)==='{"students/ramirez_maya/specialist":"soils"}');
  const k=w._envs.writes.length;
  ok("the same mark again, an unknown section or student → nothing written", S.cpSpecMake("ramirez_maya","soils")===false&&S.cpSpecMake("ramirez_maya","narnia")===false&&S.cpSpecMake("nobody","soils")===false&&w._envs.writes.length===k);
  ok("the demo wrote nothing to a database", w.G.writes.length===0); }

console.log("\n── the student page, ⚙️ Class settings, and the 🎚 On tap ──");
{ const w=demo("teacher"), S=w.S; S.cpSpecMake("ramirez_maya","forestry"); await w.flush(); w.envcView("student","ramirez_maya"); const h=w.G.content;
  ok("Teacher ▸ Maya: the 🏅 Specialist card — None and a button per section, Forestry pressed, her share and non-core choices", /🏅 Specialist/.test(h)&&/aria-pressed="true" onclick="cpSpecMake\('ramirez_maya','forestry'\)">🏅 Forestry/.test(h)&&/cpSpecMake\('ramirez_maya',''\)/.test(h)&&/as the class \(70%\)/.test(h)&&/Their other sections are Review only — switch any back On in 🎚 Sections/.test(h));
  ok("…her 🎚 Sections pills show the others Review only", /aria-pressed="true" onclick="cpSecSet\('ramirez_maya','soils','review'\)"/.test(h));
  const n=w._envs.writes.length; S.cpSpecSetOpt("ramirez_maya","specialistShare","80"); await w.flush();
  ok("her own share 80 % → students/ramirez_maya/settings/study/specialistShare = 80", JSON.stringify(w._envs.writes[n].val)==='{"students/ramirez_maya/settings/study/specialistShare":80}'&&/80% of the new cards from Forestry/.test(txt(w.G.content)));
  S.cpSpecSetOpt("ramirez_maya","specialistShare",""); await w.flush();
  ok("…'as the class' clears it (null)", JSON.stringify(w._envs.writes[n+1].val)==='{"students/ramirez_maya/settings/study/specialistShare":null}'&&!(((w._envc.students.ramirez_maya.settings||{}).study||{}).specialistShare));
  ok("a share the app doesn't offer, or specialistOthers for one student → nothing written", S.cpSpecSetOpt("ramirez_maya","specialistShare","33")===false&&S.cpSpecSetOpt("ramirez_maya","specialistOthers","on")===false&&w._envs.writes.length===n+2);
  w.X.cpSecSet("ramirez_maya","soils",""); await w.flush();
  ok("🎚 Soils ▸ On beats her Review only: students/ramirez_maya/sections/soils = 'on' (her Soils new cards come back, 30 %)", JSON.stringify(w._envs.writes[n+2].val)==='{"students/ramirez_maya/sections/soils":"on"}'&&w.X.cpSecOfStudent("ramirez_maya","soils")===""&&w.X.cpSecDemoPile().newNames.some(x=>secOf(x.deck)==="soils"));
  w.X.cpSecSet("ramirez_maya","soils","review"); await w.flush();
  ok("…and back to Review only clears her own value (null): the mark says Review only again", JSON.stringify(w._envs.writes[n+3].val)==='{"students/ramirez_maya/sections/soils":null}'&&w.X.cpSecOfStudent("ramirez_maya","soils")==="review");
  w.envcView("classset"); const c=w.G.content;
  ok("⚙️ Class settings ▸ 🏅 Specialists: share (70 % default), non-core, other stations, who is one now", /🏅 Specialists/.test(c)&&/70% \(default\)/.test(c)&&/cpSpecSetOpt\('class','specialistOthers',this\.value\)/.test(c)&&/Specialists now: <b>Maya R\.<\/b> 🏅 Forestry/.test(c));
  const m=w._envs.writes.length; S.cpSpecSetOpt("class","specialistOthers","on"); await w.flush();
  ok("Their other stations: Stay On → classes/<cid>/settings/study/specialistOthers = 'on'; her Soils is On again", JSON.stringify(w._envs.writes[m].val)==='{"classes/'+w._envc.cid+'/settings/study/specialistOthers":"on"}'&&w.X.cpSecOfStudent("ramirez_maya","soils")==="");
  S.cpSpecSetOpt("class","specialistOthers",""); S.cpSpecSetOpt("class","specialistNonCore","false"); await w.flush();
  ok("…back to the default (null); non-core 'core only as planned' → false", JSON.stringify(w._envs.writes.slice(m+1).map(x=>x.val))===JSON.stringify([{["classes/"+w._envc.cid+"/settings/study/specialistOthers"]:null},{["classes/"+w._envc.cid+"/settings/study/specialistNonCore"]:false}]));
  w._envc.cls.features=Object.assign({},w._envc.cls.features||{},{specialists:false}); w.envcView("strong"); const off=w.G.content; w.envcView("student","ramirez_maya");
  ok("🏫 the feature off: no Make specialist, no 🏅 card, no settings card, the mark ignored (Soils On again)", !/cpSpecMake/.test(off)&&!/🏅 Specialist/.test(w.G.content)&&S.cpSpecSetHtml()===""&&S.cpSpecOf("ramirez_maya")===""&&w.X.cpSecOfStudent("ramirez_maya","soils")===""); }

console.log("\n── live console: the writes, Adrienne's locks ──");
{ const w=liveConsole("teacher"), S=w.S; S.cpSpecMake("fam_k","forestry"); await w.flush();
  ok("a live teacher: ONE update at the root, students/fam_k/specialist = 'forestry'", w.G.writes.length===1&&JSON.stringify(w.G.writes[0])===JSON.stringify(["update","/",{"students/fam_k/specialist":"forestry"}]), w.G.writes);
  ok("…Kay's other sections read Review only on the console (and her Forestry doesn't)", w.X.cpSecOfStudent("fam_k","soils")==="review"&&w.X.cpSecOfStudent("fam_k","forestry")===""&&w.X.cpSecOfStudent("fam_j","soils")==="");
  const L=liveConsole("teacher"); L._envc.cls.locks={specialists:true,byName:"Adrienne"}; L.envcView("strong");
  ok("locks/specialists: Make specialist greyed, the student card greyed '🔒 Set by Adrienne', every save refused (nothing written)", L.S.cpSpecMake("fam_k","forestry")===false&&L.S.cpSpecSetOpt("class","specialistShare","80")===false&&L.G.writes.length===0&&/disabled/.test(L.S.cpSpecStrongBtn("fam_k","forestry"))&&/🔒 Set by Adrienne/.test(L.S.cpSpecStudentHtml("fam_k"))&&/🔒 Specialists are set by Adrienne/.test((L.G.els["envs-toast"]||L.G.created.find(e=>e.id==="envs-toast")||{}).textContent||""));
  const g=liveConsole("teacher"); g._envcs.locks={specialists:true};
  ok("…the same lock for every class (settings/locks/specialists)", g.S.cpSpecMake("fam_k","forestry")===false&&g.G.writes.length===0);
  const a=liveConsole("admin"); a._envc.cls.locks={specialists:true}; a._envcs.locks={specialists:true}; a.S.cpSpecMake("fam_k","forestry"); await a.flush();
  ok("Adrienne's own saves go through", a.G.writes.length===1);
  ok("CPLOCKS's list gains 🎚 the section states and 🏅 the specialists (once)", a.L.CPL_PARTS.some(p=>p.k==="sections")&&a.L.CPL_PARTS.some(p=>p.k==="specialists")&&a.L.CPL_PARTS.filter(p=>p.k==="specialists").length===1&&a.S.cpSpecLockParts()===0);
  a.L.cpLockSet("specialists",true); a.L.cpLockSet("sections",true); await a.flush();
  ok("…so her switch in 🏫 Class setup writes classes/<cid>/locks/specialists and …/sections", JSON.stringify(a.G.writes.slice(1).map(x=>[x[1],x[2].specialists,x[2].sections]))===JSON.stringify([["classes/c1/locks",true,undefined],["classes/c1/locks",undefined,true]]), a.G.writes.slice(1));
  ok("…and the setup screen lists them", /🏅 The specialists/.test(a.L.cpLockSetupHtml(a._envc.cls,true))&&/🎚 The section states/.test(a.L.cpLockSetupHtml(a._envc.cls,true)));
  a.S.cpSpecLock(true); await a.flush(); ok("'🔒 Lock for every class' writes settings/locks/specialists", JSON.stringify(a.G.writes[a.G.writes.length-1])===JSON.stringify(["update","settings/locks",{specialists:true}]));
  const k=liveConsole("kid"); ok("a kid login: no button, no card, no save", k.S.cpSpecStrongBtn("fam_k","forestry")===""&&k.S.cpSpecStudentHtml("fam_k")===""&&k.S.cpSpecMake("fam_k","forestry")===false&&k.G.writes.length===0); }

console.log("\n── 📅 Pace: the specialist's run ──");
{ const w=demo("teacher"), S=w.S; w._envc.students.ramirez_maya.specialist="forestry";
  const nin={coreOnly:{forestry:true,soils:true}}, o=S.cpSpecPaceOpt("ramirez_maya",nin);
  ok("'needs from now': their share (all Forestry: the others are Review only) and Forestry's non-core cards in the run", JSON.stringify(o.share)==='{"newFrom":"mix","mix":{"forestry":100}}'&&JSON.stringify(o.coreOnly)==='{"soils":true}'&&nin.coreOnly.forestry===true);
  w._envc.students.ramirez_maya.sections={soils:"on"};
  ok("…Soils back On: 7 : 3", JSON.stringify(S.cpSpecPaceOpt("ramirez_maya",{}).share.mix)==='{"forestry":7,"soils":3}');
  ok("a student with no mark: nothing added ({})", JSON.stringify(S.cpSpecPaceOpt("tran_jonah",nin))==="{}");
  const per={forestry:{mark:{k:"on",t:"●"}}}, m0=per.forestry.mark; S.cpSpecPaceMark("ramirez_maya",per);
  ok("the row's Forestry cell reads '🏅 ●' (a new mark object)", per.forestry.mark.t==="🏅 ●"&&m0.t==="●"); }

console.log("\n── Howe (no edition): every entry point says no ──");
{ const w=W({w:{fam:{familyId:"howe",roster:[]}}}), S=w.S;
  ok("no mark, no layer, no rule, no card, no button, no listener", S.cpSpecSite()===false&&S.cpSpecOf("x")===""&&S.cpSecLayer("x","soils")===""&&S.cpShareRuleFor("lincoln",null)===null&&S.cpSpecStudentHtml("x")===""&&S.cpSpecSetHtml()===""&&S.cpSpecStrongBtn("x","soils")===""&&S.cpSpecStrongBarHtml()===""&&S.cpSpecCellTag("x","soils")===""&&S.cpSpecListen(w.firebase.database(),()=>{})===false&&S.cpSpecMake("x","soils")===false);
  ok("…and nothing read, written or listened to", w.G.writes.length===0&&w.G.reads.length===0&&w.G.listeners.length===0); }

console.log("\n── the rules file ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, Sp=R.students.$sid.specialist, C=R.classes.$cid.settings.$part, Su=R.students.$sid.settings.$part;
  ok("students/<sid>/specialist: a section key, written by the class's teacher (unless locks/specialists, the class's or every class's) or admin, only while the class's feature isn't off", !!Sp&&/locks\/specialists/.test(Sp[".write"])&&/settings\/locks\/specialists/.test(Sp[".write"])&&/admins/.test(Sp[".write"])&&/\/teacher/.test(Sp[".write"])&&/isString/.test(Sp[".validate"])&&/\[a-z\]/.test(Sp[".validate"])&&/features\/specialists/.test(Sp[".validate"]));
  ok("classes/<cid>/settings/study/{specialistShare 50–100, specialistNonCore true|false, specialistOthers 'review'|'on'}, under the specialists locks (admin exempt)", ["specialistShare","specialistNonCore","specialistOthers"].every(k=>C[k]&&/\$part == 'study'/.test(C[k][".validate"])&&/locks\/specialists/.test(C[k][".validate"])&&/admins/.test(C[k][".validate"]))&&/>= 50/.test(C.specialistShare[".validate"])&&/<= 100/.test(C.specialistShare[".validate"])&&/isBoolean/.test(C.specialistNonCore[".validate"])&&/'review'/.test(C.specialistOthers[".validate"])&&/'on'/.test(C.specialistOthers[".validate"]));
  ok("students/<sid>/settings/study/{specialistShare, specialistNonCore}: the teacher or admin, under the same locks", ["specialistShare","specialistNonCore"].every(k=>Su[k]&&/locks\/specialists/.test(Su[k][".write"])&&/admins/.test(Su[k][".write"])&&/\/teacher/.test(Su[k][".write"])&&/\$part == 'study'/.test(Su[k][".validate"]))&&!Su.specialistOthers);
  ok("classes/<cid>/features/specialists was already a known feature", /specialists/.test(R.classes.$cid.features.$k[".validate"])); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
