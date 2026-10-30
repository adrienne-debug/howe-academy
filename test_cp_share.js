/*
 * Node tests — 🧭 CPSHARE, where new cards come from once more than one section is open (DESIGN_class_platform_2026-10-28.md §8.7,
 * §9.1, §13 row 19, §14 Q30; PR 19 of the class platform). Her words 2026-10-28: "if the whole class is moving on to a new subject …
 * picking up equally … or just the new stuff … kids split up … easily turned off … keep reviewing … but no send more in. So there needs to
 * be settings for that."
 *   · how it is hooked: one block, every line outside it tagged 🧭 CPSHARE and typeof-guarded;
 *   · THE SPLIT (pure): each rule's shares, fractions carrying exactly (0.6 a day = 3 cards in 5 days), a section that can't use its share
 *     passing it on, Newest only passing nothing to the old sections;
 *   · the REAL mstPile (sliced from index.html, with CPCORE's core first) on the REAL NC Envirothon unit, a slow student stuck in Forestry
 *     with Aquatics newly sent: deck by deck every new card is Forestry; each rule's split over 10 days, counted exactly; the old section's
 *     learning cards keep coming; a second sitting the same day; which section is "newest";
 *   · BYTE-IDENTICAL REPLAYS: 40 study days of the real engine with and without this block — Howe (no edition), Lincoln (not the site's
 *     kid), the site's kid with nothing saved, the Daily Mix — the same pile every day;
 *   · ⚙️ Class settings: the card, every save one targeted update through envcWrite, the range checks, Adrienne's 🔒;
 *   · 📅 Pace: the planner runs the rule; the bar shows every choice side by side as a what-if (no write) until its own Save;
 *   · the demo: Jonah's next 🌿 start is Forestry only deck by deck, and has Aquatics cards again with "Newest + catch-up 30%";
 *   · the rules file.                                                                                         run: node test_cp_share.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CORE,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const SHARE=cut("// CPSHARE_START","// CPSHARE_END"), PACE=cut("// CPPACE_START","// CPPACE_END");
const MST=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"), ELIG=cut("function mastBankEligible(kid,cat){","\n}\n");
const UNITJ=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const SECS=[["general","General Concepts"],["forestry","Forestry"],["soils","Soils and Land Use"],["aquatics","Aquatic Ecology"],["wildlife","Wildlife"],["cei","Current Issue"]];
const secOf=k=>(SECS.find(s=>k.indexOf(s[1]+" · ")===0)||[])[0]||null;
const SHARE_NAMES="CPSHARE_RULES, CPSHARE_DEMO, _cpshare, cpShareSite, cpShareRule, cpShareClean, cpShareOf, cpShareSeen, cpShareWeights, cpShareSplit, cpNewQuota, cpShareFocus, cpShareNames, cpShareSaved, cpShareOpt, cpShareFill, cpShareSave, cpShareSet, cpShareCatch, cpShareMix, cpShareLock, cpShareSetHtml, cpShareBarHtml, cpSharePick, cpShareKeep, cpShareUndo, cpShareDemoPile, cpShareDemoHtml";

// ── the engine sandbox: the real study engine + mastBankEligible + CPCORE + (optionally) this block. site = {on, kid, role, demo, layers}
function engine(withBlock,site,md,us){
  site=site||{};
  return new Function("masteryData","unitStudies","window","site","SECS","secOf",`
    let masteryKid=null; const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
    const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; const cy=item.cycle||1; return (pn-1)%iv===(cy-1)%iv; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(){ return false; }
    function mastFullBank(kid){ const base={}; let c=masteryData[kid+"_custom_items"]||[]; if(!Array.isArray(c)) c=Object.values(c); c.forEach(ci=>{ if(!ci) return; (base[ci.cat]=base[ci.cat]||[]); if(base[ci.cat].indexOf(ci.name)<0) base[ci.cat].push(ci.name); }); return base; }
    ${ELIG}
    const ENV_UNIT_ID="nc_envirothon", ENV_SESSION_SID="envirothon"; const _envs={kid:site.kid||"",role:site.role||""};
    function envSiteOn(){ return !!site.on; } function envsDemo(){ return !!site.demo; } function envClsLayers(){ return site.layers||[{},{}]; }
    function envsStations(){ return SECS.map(s=>({id:s[0],label:s[1],short:s[1].split(" ")[0],decks:((unitStudies.nc_envirothon||{}).decks||[]).filter(d=>secOf(d.key)===s[0]).map(d=>({key:d.key}))})); }
    ${CORE}
    ${withBlock?SHARE:""}
    ${MST}
    return { mstPile, mstSessions, S:${withBlock?"{ "+SHARE_NAMES+" }":"null"} };`)(md,us,{},site,SECS,secOf);
}
const deckOf=k=>UNITJ.decks.find(d=>d.key===k);
const US={nc_envirothon:{id:"nc_envirothon",decks:UNITJ.decks}};
const FT="Forestry · Terms", FF="Forestry · Facts", AT="Aquatic Ecology · Terms", AF="Aquatic Ecology · Facts", GT="General Concepts · Terms";
const KID={on:true,kid:"k",role:"kid"};
const isCore=n=>!!(deckOf(n.deck).cards.find(c=>c.name===n.name)||{}).core;
// a slow student: `slow` cards of each listed deck still being learned (core first, as he got them); every deck of `decks` in the bank
function slowKid(decks,slow,sess){
  const md={k:[],k_custom_items:[],k_sessions:{envirothon:Object.assign({name:"Envirothon",kind:"deck",decks,who:"solo",newPerDay:5,passes:2,order:"bank",maxCards:0,focusDecks:2},sess||{})}};
  decks.forEach(k=>deckOf(k).cards.forEach(c=>md.k_custom_items.push({cat:k,name:c.name,def:c.def})));
  let id=0; Object.keys(slow||{}).forEach(k=>{ const cs=deckOf(k).cards.filter(c=>c.core).concat(deckOf(k).cards.filter(c=>!c.core)).slice(0,slow[k]);
    cs.forEach(c=>md.k.push({id:"s"+(++id),subject:k,prompt:c.name,answer:"",status:"introduction",tier:"daily",tally_dots:1,cycle:1})); });
  return md; }
const rule=r=>[{study:r},{}];
const SITE=r=>Object.assign({},KID,{layers:rule(r)});
// day after day: today's new names become cards that have climbed (seats free at once); the slow cards stay where they are
function play(E,md,days,from){ const per=[]; let id=0;
  for(let day=from||1;day<(from||1)+days;day++){ const p=E.mstPile("k","envirothon",day,null); per.push(p);
    p.newNames.forEach(n=>{ md.k.push({id:"n"+day+"_"+(++id),subject:n.deck,prompt:n.name,answer:"",status:"active",tier:"monthly",next_due:99999,cycle:1}); }); }
  return per; }
const bySec=per=>{ const o={}; per.forEach(p=>p.newNames.forEach(n=>{ const s=secOf(n.deck); o[s]=(o[s]||0)+1; })); return o; };
const sent=(E,o)=>{ E.S._cpshare.sent.k={}; Object.keys(o).forEach(s=>{ E.S._cpshare.sent.k[s]=o[s]; }); };

// ── the site world (test_env_site.js) with the real engine, CPPACE and this block
const ENG=[constLine("MAST_TIER_INT"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores"].map(fn),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return 400; }",
  MST, "G.eng={ mstSessions, mstPile };"].join("\n");
const SX=SHARE+"\nG.share={ "+SHARE_NAMES+" };";
const PX=PACE+"\nG.pace={ _cpp, cpPacePlan, cpNeedPerDay, cppInputs, cppDraft, cpPaceFlush };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,rev:PX+"\n"+(o.noShare?"":SX)+"\n"+ENG,now:Date.UTC(2026,9,29,15,0,0)},o.w||{})); w.S=w.G.share; w.P=w.G.pace; w.E=w.G.eng; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function liveConsole(role){ const w=W(); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"}}; return w; }

const run=async()=>{
console.log("── how it is hooked ──");
{ const a=src.indexOf("// CPSHARE_START"), b=src.indexOf("// CPSHARE_END");
  ok("one CPSHARE block", a>0&&b>a&&src.indexOf("// CPSHARE_START",a+1)<0&&src.indexOf("// CPSHARE_END",b+1)<0);
  ok("the header names §8.7, PR 19, her words and the date", /§8\.7/.test(SHARE)&&/PR 19/.test(SHARE)&&/no send\s*\/\/ more in/.test(SHARE)&&/2026-10-28/.test(SHARE));
  ok("the block only declares (nothing runs at load)", SHARE.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  ok("no Howe kid name as a code literal, no 🔀, no direct database call (writes go through envcWrite)", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(SHARE)&&SHARE.indexOf("\u{1F500}")<0&&!/firebase\.|db\.ref|envsWrite\(|\.update\(/.test(SHARE.replace(/^\s*\/\/.*$/mg,"")));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🧭 CPSHARE/.test(l));
  ok("every line outside the block tagged 🧭 CPSHARE is one typeof-guarded call", hooks.length>0&&hooks.every(l=>/typeof cp(Share\w+)\s*===?\s*"function"/.test(l)), hooks.map(l=>l.trim().slice(0,70)));
  const pile=cut("function mstPile(kid, sid, pn, todayLog) {","\n}\n");
  // 🌿 CPLINCOLNPARITY (2026-10-29): Lincoln's own seats line may follow it (his 🌿 sitting only; the same list back otherwise)
  ok("mstPile: the focus line right after the focusDecks slice (before inFocus), the names line right after CPPACE's Core only line",
    /focusDecks = started\.concat\(fresh\)\.slice\(0, session\.focusDecks\);\n    if \(typeof cpShareFocus === "function"\) focusDecks = cpShareFocus\([^\n]*\n(?:    if \(typeof cplnFocus === "function"\)[^\n]*\n)?    const inFocus = new Set\(focusDecks\);/.test(pile)&&
    /names = cpPaceCoreOnly\(kid, session, deck, names\);[^\n]*\n      if \(typeof cpShareNames === "function"\) names = cpShareNames\(kid, session, deck, names, \{ newNames, [^\n]*\n      for \(let ni = 0;/.test(pile));
  ok("CPCORE's two lines are untouched (each still right after the line it follows)", /let fresh = focusDecks\.filter\(d => !\(learnByDeck\[d\] > 0\)\);\n    if \(typeof cpCoreFresh === "function"\)/.test(pile)&&/let names = \(typeof mastBankEligible === "function"\) \? mastBankEligible\(kid, deck\) : \(bank\[deck\] \|\| \[\]\);\n      if \(typeof cpCoreNames === "function"\)/.test(pile));
  ok("the Pace control comes through hooks (cpPacePlan's first line + its day loop, the plan bar), no CPPACE function rewritten", /function cpPacePlan\(o\)\{\n  if\(typeof cpShareOpt==="function"\) o=cpShareOpt\(o\);/.test(src)&&/if\(o\.share&&typeof cpShareFill==="function"\) room=cpShareFill\(/.test(PACE)&&/if\(typeof cpShareBarHtml==="function"\) h\+=cpShareBarHtml\(\{d,inp,plan\}\);/.test(PACE));
  ok("the hooks PR 20 / PR 21 use are left: cpSecState (built by PR 20, CPSECTIONS), cpShareRuleFor (built by PR 21, CPSPECIALIST)", /typeof cpSecState==="function"/.test(SHARE)&&/typeof cpShareRuleFor==="function"/.test(SHARE)&&src.indexOf("function cpShareRuleFor(")>0); }

console.log("\n── the split (pure) ──");
{ const E=engine(true,{},{},US).S, sp=E.cpShareSplit;
  const two=[{key:"forestry",at:1,order:1,avail:99,left:50},{key:"aquatics",at:2,order:3,avail:99,left:100}];
  const days=(r,secs,N,n)=>{ const t={}; for(let d=0;d<n;d++){ const q=sp(r,secs,N,d); Object.keys(q).forEach(k=>{ t[k]=(t[k]||0)+q[k]; }); } return t; };
  ok("nothing saved / an unknown rule → no split (as now)", JSON.stringify(sp(null,two,5,0))==="{}"&&JSON.stringify(sp({newFrom:"maybe"},two,5,0))==="{}"&&E.cpShareClean({newFrom:""})===null);
  ok("a 0.6 share is exactly 3 cards in 5 days (N = 2, catch-up 30%)", days({newFrom:"newest",catchUp:30},two,2,5).forestry===3&&days({newFrom:"newest",catchUp:30},two,2,5).aquatics===7);
  let sums=true; for(let d=0;d<60;d++){ const q=sp({newFrom:"newest",catchUp:30},two,5,d); if((q.forestry||0)+(q.aquatics||0)!==5) sums=false; }
  ok("every day hands out exactly N when every section has room", sums);
  ok("Newest + catch-up 30%: 70 / 30 over 10 days at 5 a day (35 / 15)", JSON.stringify(days({newFrom:"newest",catchUp:30},two,5,10))===JSON.stringify({aquatics:35,forestry:15}));
  ok("Newest only: all of it to the newest", JSON.stringify(days({newFrom:"newestOnly"},two,5,10))===JSON.stringify({aquatics:50}));
  ok("A little of everything: even", JSON.stringify(days({newFrom:"spread"},two,5,10))===JSON.stringify({aquatics:25,forestry:25}));
  ok("Teacher's mix 20 / 80 (shares as parts of the whole)", JSON.stringify(days({newFrom:"mix",mix:{forestry:1,aquatics:4}},two,5,10))===JSON.stringify({aquatics:40,forestry:10}));
  ok("catch-up 0 = newest only; nothing older left to catch up = all newest", JSON.stringify(days({newFrom:"newest",catchUp:0},two,5,4))===JSON.stringify({aquatics:20})&&JSON.stringify(days({newFrom:"newest",catchUp:30},[two[1]],5,4))===JSON.stringify({aquatics:20}));
  const three=[{key:"general",at:1,order:0,avail:99,left:10},{key:"forestry",at:1,order:1,avail:99,left:30},{key:"aquatics",at:5,order:3,avail:99,left:200}];
  ok("the catch-up is split by core cards left (General 10 · Forestry 30 → 1 : 3 of the 30%)", JSON.stringify(days({newFrom:"newest",catchUp:40},three,10,10))===JSON.stringify({aquatics:60,forestry:30,general:10}));
  ok("'newest' = the latest send-out; a tie goes to the later section in the unit", sp({newFrom:"newestOnly"},[{key:"a",at:9,order:0,avail:9},{key:"b",at:3,order:5,avail:9}],4,0).a===4&&sp({newFrom:"newestOnly"},[{key:"a",at:0,order:0,avail:9},{key:"b",at:0,order:5,avail:9}],4,0).b===4);
  const short=[{key:"forestry",at:1,order:1,avail:99,left:50},{key:"aquatics",at:2,order:3,avail:2,left:2}];
  ok("a section that can't use its share passes it on (Aquatics has 2 → Forestry takes the other 3)", JSON.stringify(sp({newFrom:"newest",catchUp:30},short,5,0))===JSON.stringify({aquatics:2,forestry:3}));
  ok("…but never to a section the rule gives no share (Newest only: 2, nothing from Forestry)", JSON.stringify(sp({newFrom:"newestOnly"},short,5,0))===JSON.stringify({aquatics:2}));
  ok("a section with nothing to hand out today is skipped (its share goes to the others)", JSON.stringify(days({newFrom:"spread"},[two[0],{key:"aquatics",at:2,order:3,avail:0,left:9}],5,2))===JSON.stringify({forestry:10}));
  ok("the teacher's mix with no share on any open section: split evenly", JSON.stringify(days({newFrom:"mix",mix:{wildlife:50}},two,4,5))===JSON.stringify({aquatics:10,forestry:10}));
  ok("stored values are cleaned: catch-up outside 0–50 → 30, a mix share outside 1–100 dropped", E.cpShareClean({newFrom:"newest",catchUp:80}).catchUp===30&&E.cpShareClean({newFrom:"newest",catchUp:"x"}).catchUp===30&&E.cpShareClean({newFrom:"newest",catchUp:2.5}).catchUp===30&&JSON.stringify(E.cpShareClean({newFrom:"mix",mix:{a:40,b:0,c:200,d:"x"}}).mix)==='{"a":40}');
  ok("a student's own values sit over the class's (PR 21)", E.cpShareOf([{study:{newFrom:"spread",catchUp:20}},{study:{newFrom:"newest"}}]).newFrom==="newest"&&E.cpShareOf([{study:{newFrom:"spread",catchUp:20}},{study:{newFrom:"newest"}}]).catchUp===20); }

console.log("\n── the real mstPile: a slow student stuck in Forestry, Aquatics newly sent ──");
const D4=[FT,FF,AT,AF], SLOW={[FT]:30,[FF]:20};
{ const md=slowKid(D4,SLOW), E=engine(true,KID,md,US); sent(E,{forestry:1000,aquatics:9000});
  const p=E.mstPile("k","envirothon",1,null);
  ok("deck by deck (nothing saved): all 5 new cards are Forestry — his two started Forestry decks hold both seats", p.newNames.length===5&&p.newNames.every(n=>secOf(n.deck)==="forestry"), p.newNames.map(n=>n.deck));
  const md0=slowKid(D4,SLOW), per0=play(engine(true,KID,md0,US),md0,10);
  ok("…and over 10 days not one Aquatics card", !bySec(per0).aquatics&&bySec(per0).forestry===50, bySec(per0)); }
{ const each={newest:{aquatics:35,forestry:15},newestOnly:{aquatics:50},spread:{aquatics:25,forestry:25},mix:{aquatics:40,forestry:10}};
  Object.keys(each).forEach(r=>{ const md=slowKid(D4,SLOW), E=engine(true,SITE({newFrom:r,catchUp:30,mix:{forestry:20,aquatics:80}}),md,US); sent(E,{forestry:1000,aquatics:9000});
    const per=play(E,md,10), got=bySec(per);
    ok(CPRULE(r)+": over 10 days at 5 a day → "+JSON.stringify(each[r]), JSON.stringify(Object.keys(got).sort().reduce((o,k)=>(o[k]=got[k],o),{}))===JSON.stringify(Object.keys(each[r]).sort().reduce((o,k)=>(o[k]=each[r][k],o),{})), got); });
  const md=slowKid(D4,SLOW), E=engine(true,SITE({newFrom:"newest"}),md,US); sent(E,{forestry:1000,aquatics:9000}); const p=E.mstPile("k","envirothon",1,null);
  ok("Newest + catch-up: his 50 Forestry learning cards still come (nothing he started is dropped)", p.learning.length===50&&p.learning.every(i=>secOf(i.subject)==="forestry"));
  ok("…core first still holds inside each section (every new card handed is a core card)", p.newNames.length===5&&p.newNames.every(isCore), p.newNames);
  const pn=E.mstPile("k","envirothon",1,null); ok("the same day gives the same pile (no state)", JSON.stringify(pn)===JSON.stringify(p));
  const E2=engine(true,SITE({newFrom:"newestOnly"}),slowKid(D4,SLOW),US); sent(E2,{forestry:9000,aquatics:1000});
  ok("which section is newest comes from when each was sent (Forestry sent later → Newest only gives Forestry)", E2.mstPile("k","envirothon",1,null).newNames.every(n=>secOf(n.deck)==="forestry"));
  const md3=slowKid(D4,SLOW), E3=engine(true,SITE({newFrom:"newestOnly"}),md3,US); sent(E3,{forestry:1000,aquatics:9000});
  const first=E3.mstPile("k","envirothon",1,null), log={items:first.newNames.slice(0,3).map((n,i)=>({id:"x"+i,name:n.name,deck:n.deck,result:"shown"}))};
  first.newNames.slice(0,3).forEach((n,i)=>md3.k.push({id:"x"+i,subject:n.deck,prompt:n.name,status:"introduction",tier:"daily",tally_dots:1,cycle:1}));
  const second=E3.mstPile("k","envirothon",1,log);
  ok("a second sitting the same day: only the rest of today's share (3 of 5 shown → 2 more, still Aquatics)", second.newNames.length===2&&second.newNames.every(n=>secOf(n.deck)==="aquatics"), second.newNames);
  const md4=slowKid(D4,SLOW); md4.k_settings={cat_hold:{[AT]:true,[AF]:true}}; const E4=engine(true,SITE({newFrom:"newestOnly"}),md4,US); sent(E4,{forestry:1000,aquatics:9000});
  ok("Aquatics still held (not sent to him): it can't be the newest — Forestry carries on", E4.mstPile("k","envirothon",1,null).newNames.length===5&&E4.mstPile("k","envirothon",1,null).newNames.every(n=>secOf(n.deck)==="forestry"));
  const md5=slowKid([GT,FT,FF,AT],{[FT]:30,[FF]:20}), E5=engine(true,SITE({newFrom:"newest",catchUp:30}),md5,US); sent(E5,{general:500,forestry:1000,aquatics:9000});
  const g5=bySec(play(E5,md5,10));
  ok("three sections: Aquatics 70%, General and Forestry share the 30% by core left", g5.aquatics===35&&(g5.general||0)+(g5.forestry||0)===15&&g5.forestry>(g5.general||0), g5); }
function CPRULE(r){ return {newest:"Newest + catch-up 30%",newestOnly:"Newest only",spread:"A little of everything",mix:"Teacher's mix 20 / 80"}[r]; }

console.log("\n── byte-identical: the real engine, 40 days, with and without this block ──");
// a fuller replay: learning cards climb, reviews come due and are graded right, new cards start learning
function replay(withBlock,site,kid,sess,days,pre){
  const md=JSON.parse(JSON.stringify(slowKid(D4,SLOW,sess))); if(kid!=="k"){ ["","_custom_items","_sessions"].forEach(s=>{ md[kid+s]=md["k"+s]; delete md["k"+s]; }); }
  if(pre) pre(md); const E=engine(withBlock,site,md,US); if(withBlock) E.S._cpshare.sent[kid]={forestry:1000,aquatics:9000}; const out=[]; let id=0;
  for(let day=1;day<=days;day++){ const p=E.mstPile(kid,"envirothon",day,null); out.push(JSON.stringify(p)); const items=md[kid];
    p.learning.forEach(i=>{ i.tally_dots=(i.tally_dots||0)+1; if(i.tally_dots>=4){ i.status="active"; i.tier="weekly"; i.next_due=day+5; } });
    p.reviews.forEach(i=>{ i.next_due=day+10; });
    p.newNames.forEach(n=>items.push({id:"r"+day+"_"+(++id),subject:n.deck,prompt:n.name,answer:"",status:"introduction",tier:"daily",tally_dots:1,cycle:1})); }
  return out; }
{ const cases=[["Howe (no edition)",{on:false,kid:"lincoln"},"lincoln"],
    ["Lincoln in Howe even with a class rule in the layers (not the site's kid)",{on:false,kid:"lincoln",layers:rule({newFrom:"newest"})},"lincoln"],
    ["the site on, a rule saved, but this kid isn't the site's kid",{on:true,kid:"maya",role:"kid",layers:rule({newFrom:"newest"})},"k"],
    ["the site's own kid with nothing saved (Deck by deck)",KID,"k"],
    ["the site's own kid, a live teacher login (not a kid / parent)",{on:true,kid:"k",role:"teacher",layers:rule({newFrom:"newest"})},"k"],
    ["a rule value the app doesn't know",SITE({newFrom:"maybe"}),"k"],
    ["only one section open (Aquatics held): a rule changes nothing",SITE({newFrom:"newest"}),"k",md=>{ md.k_settings={cat_hold:{[AT]:true,[AF]:true}}; }],
    ["focusDecks 0 (every open deck) and Lincoln",{on:false,kid:"lincoln"},"lincoln",null,{focusDecks:0}]];
  cases.forEach(([lbl,site,kid,pre,sess])=>{ const a=replay(true,site,kid,sess,40,pre), b=replay(false,site,kid,sess,40,pre);
    ok(lbl+": 40 days, every pile identical", a.length===40&&a.every((x,i)=>x===b[i])&&a.some(x=>JSON.parse(x).newNames.length>0), a.findIndex((x,i)=>x!==b[i])); });
  const E=engine(true,{on:false},{},US), arr=["a","b"], S={sid:"envirothon",kind:"deck",decks:[FT,AT],focusDecks:2};
  ok("Howe: each mstPile hook hands back the very array (===)", E.S.cpShareFocus("lincoln",S,arr,arr,[],{},new Set())===arr&&E.S.cpShareNames("lincoln",S,FT,arr,{newNames:[]})===arr&&E.S.cpNewQuota("lincoln",S,1,{})===null);
  const M=engine(true,SITE({newFrom:"newest"}),{},US);
  ok("the Daily Mix and a check-up never get a rule", M.S.cpShareRule("k",{kind:"mix"})===null&&M.S.cpShareRule("k",{kind:"checkup"})===null&&M.S.cpShareRule("k",{kind:"deck"}).newFrom==="newest"); }

console.log("\n── the sent dates: cpsdRelease's records, in memory ──");
{ const w=W(); w.envSiteOn=null; const E=engine(true,{on:true,kid:"k",role:"kid"},{},US).S;
  ok("a section, a deck and a Key Concept record each mark their section; the earliest stays", E.cpShareSeen("k",{forestry:{openedAt:500},[AT]:{openedAt:900},"general~k2":{openedAt:300}})===3&&E.cpShareSeen("k",{forestry:{openedAt:800}})===0&&E.cpShareSeen("k",{forestry:{openedAt:100}})===1&&JSON.stringify(E._cpshare.sent.k)===JSON.stringify({forestry:100,aquatics:900,general:300}));
  ok("a record with no openedAt, or an unknown key, is skipped", E.cpShareSeen("k",{soils:true,nowhere:{openedAt:5}})===0);
  const H=engine(true,{on:false},{},US).S; ok("Howe: nothing is kept", H.cpShareSeen("lincoln",{forestry:{openedAt:5}})===0&&!H._cpshare.sent.lincoln);
  // 🌿 CPLINCOLNPARITY (2026-10-29): the site check also lets Lincoln's mirror through (cplnpSendOn), tagged on that line
  ok("the hook sits in CPSEND's apply step, right after its site check", /function cpsdRelease\(kid,rel,u\)\{\n  if\(!cpsdSite\(\)(?:&&!\(typeof cplnpSendOn==="function"&&cplnpSendOn\(kid\)\))?\) return null; if\(!rel\|\|typeof rel!=="object"\) return 0;[^\n]*\n  if\(typeof cpShareSeen==="function"\) cpShareSeen\(kid,rel\);/.test(src)); }

console.log("\n── ⚙️ Class settings: the card and its saves ──");
{ const w=liveConsole("teacher"), Wr=()=>w.G.writes, h=w.envClsPanelHtml();
  ok("the card shows, with all five choices and 'Deck by deck (as now)' while nothing is saved", /🧭 Where new cards come from/.test(h)&&w.S.CPSHARE_RULES.every(r=>h.indexOf("cpShareSet('"+r[0]+"')")>=0)&&/now: <b>Deck by deck \(as now\)<\/b> \(nothing saved\)/.test(h));
  w.S.cpShareSet("newest"); await w.flush();
  ok("Newest + catch-up → ONE update classes/c1/settings/study {newFrom:'newest'}", Wr().length===1&&JSON.stringify(Wr()[0])===JSON.stringify(["update","classes/c1/settings/study",{newFrom:"newest"}]), Wr());
  const h2=w.envClsPanelHtml();
  ok("…the console's class has it; the card says 'now: Newest + catch-up 30%' and offers the catch-up box", w._envc.cls.settings.study.newFrom==="newest"&&/now: <b>Newest \+ catch-up 30%<\/b>/.test(h2)&&/cpShareCatch\(this\.value\)/.test(h2));
  w.S.cpShareCatch("20"); await w.flush();
  ok("catch-up 20 → {catchUp:20}", JSON.stringify(Wr()[1])===JSON.stringify(["update","classes/c1/settings/study",{catchUp:20}]));
  const n=Wr().length; w.S.cpShareCatch("70"); w.S.cpShareCatch("2.5"); await w.flush();
  ok("catch-up 70 or 2.5 → refused, nothing written", Wr().length===n&&w.G.created.some(e=>e&&e.id==="envs-toast"&&/0–50/.test(e.textContent)));
  w.S.cpShareSet("mix"); w.S.cpShareMix("forestry","25"); w.S.cpShareMix("aquatics",""); await w.flush();
  ok("the mix: a section's share → {'mix/forestry':25}; blank → {'mix/aquatics':null}", JSON.stringify(Wr().slice(-2))===JSON.stringify([["update","classes/c1/settings/study",{"mix/forestry":25}],["update","classes/c1/settings/study",{"mix/aquatics":null}]]));
  const m=Wr().length; w.S.cpShareMix("narnia","20"); w.S.cpShareMix("soils","101"); await w.flush(); ok("an unknown section or a share past 100 → nothing written", Wr().length===m);
  w.S.cpShareSet(""); await w.flush(); ok("Deck by deck → {newFrom:null} (back to nothing saved)", JSON.stringify(Wr()[Wr().length-1])===JSON.stringify(["update","classes/c1/settings/study",{newFrom:null}])&&w._envc.cls.settings.study.newFrom===undefined);
  w._envcs.locks={newFrom:true}; const k=Wr().length; ok("Adrienne's 🔒 (settings/locks/newFrom): the teacher's save is refused, nothing written, the card greyed '🔒 set by Adrienne'", w.S.cpShareSet("spread")===false&&w.S.cpShareCatch("10")===false&&Wr().length===k&&/🔒 set by Adrienne/.test(w.S.cpShareSetHtml())&&/disabled/.test(w.S.cpShareSetHtml()));
  const a=liveConsole("admin"); a._envcs.locks={newFrom:true}; a.S.cpShareSet("spread"); a.S.cpShareLock(false); await a.flush();
  ok("…Adrienne's own save goes through, and her lock is one update at settings/locks", JSON.stringify(a.G.writes)===JSON.stringify([["update","classes/c1/settings/study",{newFrom:"spread"}],["update","settings/locks",{newFrom:null}]])&&/🔓 Unlock|🔒 Lock/.test(a.S.cpShareSetHtml()));
  const k2=liveConsole("kid"); k2._envc.cid="c1"; ok("a kid login: no card, no save", k2.S.cpShareSetHtml()===""&&k2.S.cpShareSet("newest")===false); }

console.log("\n── 📅 Pace: the planner and the bar ──");
{ const w=demo("teacher"), P=w.P, S=w.S;
  w.envcView("pace"); for(let i=0;i<6;i++){ if(!P.cpPaceFlush()) break; } w.envcView("pace"); const h=w.G.content;
  ok("the bar shows 🧭 Where new cards come from with every choice in one table (finish, minutes, each section)", /🧭 Where new cards come from/.test(h)&&S.CPSHARE_RULES.every(r=>h.indexOf("cpSharePick('"+r[0]+"')")>=0)&&/min a day/.test(h));
  const inp=P.cppInputs(P.cppDraft()), plan=r=>P.cpPacePlan(Object.assign({},inp,{share:r}));
  const as=plan(null), nw=plan({newFrom:"newest",catchUp:30}), no=plan({newFrom:"newestOnly"});
  ok("the planner runs each rule: Newest only puts more of Aquatics (the newest) learned by the goal than deck by deck, and less of the old", no.sections.aquatics.atGoal>as.sections.aquatics.atGoal&&(no.sections.forestry.atGoal+no.sections.general.atGoal)<=(as.sections.forestry.atGoal+as.sections.general.atGoal), [as.sections,no.sections]);
  ok("…Newest + catch-up sits between them for Aquatics", nw.sections.aquatics.atGoal>=as.sections.aquatics.atGoal&&nw.sections.aquatics.atGoal<=no.sections.aquatics.atGoal, [as.sections.aquatics,nw.sections.aquatics,no.sections.aquatics]);
  ok("with nothing saved the planner's input comes back untouched (the same object)", S.cpShareOpt(inp)===inp);
  const n0=w._envs.writes.length; S.cpSharePick("newestOnly"); const h2=w.G.content;
  ok("tapping a choice is a what-if: highlighted, 'Students see nothing until you save it', nothing written", /What-if: new cards from “Newest only”/.test(h2)&&w._envs.writes.length===n0&&!((w._envc.cls.settings||{}).study||{}).newFrom);
  S.cpShareKeep(); await w.flush();
  ok("Save → one update at classes/<cid>/settings/study {newFrom:'newestOnly'}; the plan now uses it", w._envs.writes.length===n0+1&&JSON.stringify(w._envs.writes[n0])===JSON.stringify({op:"update",path:"classes/"+w._envc.cid+"/settings/study",val:{newFrom:"newestOnly"}})&&S.cpShareOpt(inp).share.newFrom==="newestOnly");
  const live=liveConsole("teacher"); live._envc.cls.goals=[{name:"State",date:"2027-04-23"}]; ok("no goal yet / not the console → no bar", S.cpShareBarHtml(null)===""&&live.S.cpShareBarHtml({inp:{goal:""}})===""); }

console.log("\n── the demo: Jonah's next 🌿 start ──");
{ const w=demo("teacher"), S=w.S; w.envcView("classset"); const h=w.G.content;
  const p0=S.cpShareDemoPile(null), secs=p=>p.newNames.map(n=>secOf(n.deck));
  ok("deck by deck: Jonah's new cards are all Forestry (his started Forestry decks hold both seats)", p0&&p0.newNames.length>0&&secs(p0).every(s=>s==="forestry"), p0);
  ok("…the card says so: '🧪 Jonah’s next 🌿 start' and no Aquatics", /🧪 <b>Jonah’s next 🌿 start<\/b>/.test(h)&&!/Aquatic/.test(h.slice(h.indexOf("Jonah’s next")).split(" still being learned")[0]), h.slice(h.indexOf("Jonah’s next"),h.indexOf("Jonah’s next")+300));
  S.cpShareSet("newest"); await w.flush(); w.envcView("classset"); const h2=w.G.content, p1=S.cpShareDemoPile(S.cpShareClean(w._envc.cls.settings.study));
  ok("switch to Newest + catch-up 30% → his start shows Aquatics cards again", p1&&secs(p1).indexOf("aquatics")>=0&&/Aquatic/.test(h2.slice(h2.indexOf("Jonah’s next")).split(" still being learned")[0]), p1);
  ok("…his Forestry learning cards still come", p1.learning===p0.learning&&p0.learning===S.CPSHARE_DEMO.terms+S.CPSHARE_DEMO.facts);
  ok("the look leaves nothing behind (no sample kid, Maya still the kid, the class's settings as saved)", !Object.keys(w.masteryData).some(k=>k.indexOf(S.CPSHARE_DEMO.kid)===0)&&w._envs.kid==="maya"&&w._envs.sid==="ramirez_maya"&&w._envc.cls.settings.study.newFrom==="newest"&&!S._cpshare.sent[S.CPSHARE_DEMO.kid]&&(w._envc.students.tran_jonah.settings.study||{}).newPerDay===3);
  ok("the demo wrote nothing but the one 'would write' of the save", w._envs.writes.length===1&&w.G.writes.length===0);
  const live=liveConsole("teacher"); ok("off the demo there is no sample Jonah", live.S.cpShareDemoPile(null)===null&&live.S.cpShareDemoHtml(null)===""); }

console.log("\n── Howe (no edition): every entry point says no ──");
{ const w=W({w:{fam:{familyId:"howe",roster:[]}}}), S=w.S, o={a:1};
  ok("no rule, no card, no bar, no demo, the planner's input untouched", S.cpShareSite()===false&&S.cpShareRule("lincoln",{kind:"deck"})===null&&S.cpShareSetHtml()===""&&S.cpShareBarHtml({inp:{goal:"x"}})===""&&S.cpShareDemoHtml(null)===""&&S.cpShareOpt(o)===o&&S.cpShareSaved()===null&&S.cpShareSet("newest")===false&&S.cpShareLock(true)===false);
  ok("…and nothing read, written or listened to", w.G.writes.length===0&&w.G.reads.length===0&&w.G.listeners.length===0); }

console.log("\n── the rules file ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, P=R.classes.$cid.settings.$part;
  ok("newFrom: a study value, one of the four, refused under Adrienne's lock unless admin", /\$part == 'study'/.test(P.newFrom[".validate"])&&/newest\|newestOnly\|spread\|mix/.test(P.newFrom[".validate"])&&/settings\/locks\/newFrom/.test(P.newFrom[".validate"])&&/admins/.test(P.newFrom[".validate"]));
  ok("catchUp: a number 0–50, same lock; mix/<section>: a number 1–100, same lock", /newData\.val\(\) <= 50/.test(P.catchUp[".validate"])&&/settings\/locks\/newFrom/.test(P.catchUp[".validate"])&&/settings\/locks\/newFrom/.test(P.mix[".validate"])&&/<= 100/.test(P.mix.$sec[".validate"]));
  ok("every other setting keeps ENVCLASSSET's own lock check", /settings\/locks\/'\+\$name/.test(P.$name[".validate"])); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
