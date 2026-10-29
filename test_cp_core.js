/*
 * Node tests — ⭐ CPCORE, core cards first (DESIGN_class_platform_2026-10-28.md §7(d), §13 row 4, §12, §15; PR 4 of the class platform).
 * The pace study (2026-10-28): the 🌿 sitting handed out new cards in bank order with the core ones spread through it, so a student went
 * through nearly every card to finish the core ones. Q7, the design's pick: on by default for the class site; non-core cards come right
 * after the core ones, never held for the final.
 *   · where the block sits and how it is hooked (three typeof-guarded lines; the ENVCS settings literal is never edited);
 *   · ⚙️ Class settings: the "Core cards first" row after "Decks introducing at once", added once; class value, a student's override,
 *     Adrienne's lock — every save one targeted update through ENVCLASSSET's own save;
 *   · the kid's side: default on, the class's "off", a student's own value; only the site's kid (kid / parent / demo);
 *   · the REAL mstPile (sliced from index.html) on the REAL NC Envirothon unit (envirothon/nc_envirothon_unit.json): every number below is
 *     counted from the data at test time — with core first a deck's core cards all come before its first non-core card, and a whole
 *     station's core is done after exactly its core count; in bank order it takes far more;
 *   · focusDecks: a deck with core left opens first; a deck being learned keeps its seat; the hold across decks;
 *   · Howe (no edition) and Lincoln's order:"bank" → the very same arrays back, and mstPile's output identical with and without the block;
 *   · §15: a unit that marks no card core → nothing moves;
 *   · the demo: two real non-core cards ahead of the sample deck's core ones; Kid ▸ 🌿 hands the core ones first, "In deck order" doesn't.
 *                                                                                                               run: node test_cp_core.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CLS,CORE,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
function demo(role){ const w=world({fam:FAM,search:"?demo=1&role="+(role||"teacher"),cpcore:true}); w.envSiteDemoBoot(); w.renderAll(); return w; }
function liveConsole(role){ const w=world({fam:FAM,cpcore:true}); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"}}; return w; }
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const UNITJ=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));

// the real study engine + the real mastBankEligible + (optionally) this block, in a sandbox. site = {on, kid, role, demo, layers}
const MST=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"), ELIG=cut("function mastBankEligible(kid,cat){","\n}\n");
function engine(withBlock,site,md,us,win){
  site=site||{};
  return new Function("masteryData","unitStudies","window","site",`
    let masteryKid=null; const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
    const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; const cy=item.cycle||1; return (pn-1)%iv===(cy-1)%iv; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(){ return false; }
    function mastFullBank(kid){ const base={}; let c=masteryData[kid+"_custom_items"]||[]; if(!Array.isArray(c)) c=Object.values(c); c.forEach(ci=>{ if(!ci) return; (base[ci.cat]=base[ci.cat]||[]); if(base[ci.cat].indexOf(ci.name)<0) base[ci.cat].push(ci.name); }); return base; }
    ${ELIG}
    const ENV_UNIT_ID="nc_envirothon"; const _envs={kid:site.kid||"",role:site.role||""};
    function envSiteOn(){ return !!site.on; } function envsDemo(){ return !!site.demo; } function envClsLayers(){ return site.layers||[{},{}]; }
    ${withBlock?CORE:""}
    ${MST}
    return { mstPile, mstSessions, cpCoreNames:typeof cpCoreNames==="function"?cpCoreNames:null };`)(md,us,win||{},site);
}
const deckOf=k=>UNITJ.decks.find(d=>d.key===k);
const coreN=k=>deckOf(k).cards.filter(c=>c.core===true).length;
// a kid with every card of `decks` in the bank (unit order), nothing started; one 🌿 session over those decks
function freshKid(decks,sess){ const md={k:[],k_custom_items:[],k_sessions:{envirothon:Object.assign({name:"Envirothon",kind:"deck",decks,who:"solo",newPerDay:20,passes:2,order:"bank",maxCards:0,focusDecks:0},sess||{})}};
  decks.forEach(k=>deckOf(k).cards.forEach(c=>md.k_custom_items.push({cat:k,name:c.name,def:c.def}))); return md; }
// play day after day: mint today's new names as cards already climbed past learning (so seats free at once); stop when `done(handed)` says so
function play(E,md,done,maxDays){ const handed=[]; let id=0;
  for(let day=1;day<=(maxDays||2000);day++){ const p=E.mstPile("k","envirothon",day,null); if(!p.newNames.length) break;
    p.newNames.forEach(n=>{ handed.push(n); md.k.push({id:"i"+(++id),subject:n.deck,prompt:n.name,answer:"",status:"active",tier:"monthly",next_due:99999,cycle:1}); });
    if(done&&done(handed)) break; }
  return handed; }
const US={nc_envirothon:{id:"nc_envirothon",decks:UNITJ.decks}};
const KID={on:true,kid:"k",role:"kid"};

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPCORE_START"), b=src.indexOf("// CPCORE_END"), m=src.indexOf("// ── MST_ENGINE_START ──");
  ok("CPCORE once, right before the study engine (after NEWBUDGET_END)", a>0&&b>a&&src.indexOf("// CPCORE_START",a+1)<0&&src.slice(b,m).trim()==="// CPCORE_END"&&src.slice(src.indexOf("// NEWBUDGET_END"),a).trim()==="// NEWBUDGET_END");
  ok("the header names the design sections, the date and the build words", /§7\(d\)/.test(CORE)&&/2026-10-28/.test(CORE)&&/lets get these built/.test(CORE));
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CORE));
  ok("the block declares, plus ONE guarded splice of its settings row (no other statement runs at load)", CORE.split("\n").filter(l=>l.trim()&&!/^(\/\/|function |const | |})/.test(l)).length===1&&/^if\(typeof ENVCS_FIELDS!=="undefined"&&Array\.isArray\(ENVCS_FIELDS\)&&!ENVCS_FIELDS\.some/m.test(CORE));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/⭐ CPCORE/.test(l));
  ok("3 tagged lines outside the block, every one typeof-guarded", hooks.length===3&&hooks.every(l=>/typeof cpCore\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  const pile=cut("function mstPile(kid, sid, pn, todayLog) {","\n}\n");
  ok("two of them in mstPile: the new-card names (right after mastBankEligible) and the fresh decks of focusDecks", /let names = \(typeof mastBankEligible === "function"\) \? mastBankEligible\(kid, deck\) : \(bank\[deck\] \|\| \[\]\);\n      if \(typeof cpCoreNames === "function"\) names = cpCoreNames\(kid, session, deck, names, existingByDeck\);/.test(pile)&&/let fresh = focusDecks\.filter\(d => !\(learnByDeck\[d\] > 0\)\);\n    if \(typeof cpCoreFresh === "function"\) fresh = cpCoreFresh\(kid, session, fresh, existingByDeck\);/.test(pile));
  ok("the third is the demo seed's last line", /if\(typeof cpCoreDemoSeed==="function"\) cpCoreDemoSeed\(kid,DK\);[^\n]*\n\}/.test(cut("function envsDemoSeedKid(data){","\n}\n")));
  ok("the ENVCS settings literal itself is not edited (no coreFirst in ENVCLASSSET)", CLS.indexOf("coreFirst")<0); }

console.log("\n── ⚙️ Class settings: the 'Core cards first' row ──");
{ const w=demo("teacher"), F=w.ENVCS_FIELDS, i=F.findIndex(f=>f.name==="coreFirst");
  ok("added once, right after 'Decks introducing at once', up front (How the class studies), study part", i>0&&F[i-1].name==="focusDecks"&&F.filter(f=>f.name==="coreFirst").length===1&&F[i].sect==="front"&&F[i].part==="study");
  const fake=[{name:"newPerDay"},{name:"focusDecks"},{name:"x"}], add=new Function("ENVCS_FIELDS","CPCORE_FIELD",CORE.split("\n").find(l=>/^if\(typeof ENVCS_FIELDS/.test(l)));
  add(fake,{name:"coreFirst"}); add(fake,{name:"coreFirst"});
  ok("the splice is guarded: a second run adds nothing; it goes after focusDecks", fake.map(f=>f.name).join()==="newPerDay,focusDecks,coreFirst,x");
  const fk=[{name:"a"}]; add(fk,{name:"coreFirst"}); ok("…and at the end when there is no focusDecks row", fk.map(f=>f.name).join()==="a,coreFirst");
  w.envcView("classset"); const h=w.G.content;
  ok("the panel shows the row with its two choices, on by default", /Core cards first/.test(h)&&/envClsSave\('class','coreFirst','on'\)/.test(h)&&/envClsSave\('class','coreFirst','off'\)/.test(h)&&/now: <b>⭐ Core cards first<\/b> \(default\)/.test(h));
  ok("the check takes on / off and nothing else", w.envClsCheck("coreFirst","on").ok&&w.envClsCheck("coreFirst","off").ok&&!w.envClsCheck("coreFirst","core").ok&&!w.envClsCheck("coreFirst",true).ok); }
{ const w=liveConsole("teacher"), W=()=>w.G.writes;
  w.envClsSave("class","coreFirst","off"); await w.flush();
  ok("class → off: ONE update classes/c1/settings/study {coreFirst:'off'}", W().length===1&&JSON.stringify(W()[0])===JSON.stringify(["update","classes/c1/settings/study",{coreFirst:"off"}]), W());
  w.envClsSave("fam_k","coreFirst","on"); await w.flush();
  ok("one student back on: update students/fam_k/settings/study {coreFirst:'on'}", JSON.stringify(W()[1])===JSON.stringify(["update","students/fam_k/settings/study",{coreFirst:"on"}]));
  const s=w.envClsStudentHtml("fam_k"); w._envcs.stuOpen="fam_k"; const s2=w.envClsStudentHtml("fam_k");
  ok("the student page counts it and shows 'this student: on · class: In deck order'", /1 changed for Kay L\./.test(s)&&/this student: <b>⭐ Core cards first<\/b> · class: In deck order/.test(s2));
  w.envClsSave("fam_k","coreFirst",null); await w.flush();
  ok("✕ use the class's → {coreFirst:null}", JSON.stringify(W()[2])===JSON.stringify(["update","students/fam_k/settings/study",{coreFirst:null}]));
  w._envcs.locks={coreFirst:true}; const n=W().length; w.envClsSave("class","coreFirst","on"); await w.flush();
  ok("Adrienne's 🔒 on it: the teacher's save is refused, nothing written; the row shows greyed, '🔒 set by Adrienne'", W().length===n&&w.envClsSave("class","coreFirst","on")===false&&/Core cards first 🔒[\s\S]*set by Adrienne/.test(w.envClsPanelHtml()));
  const a=liveConsole("admin"); a._envcs.locks={coreFirst:true}; a.envClsSave("class","coreFirst","on"); await a.flush();
  ok("…Adrienne's own save goes through", JSON.stringify(a.G.writes[0])===JSON.stringify(["update","classes/c1/settings/study",{coreFirst:"on"}])); }

console.log("\n── the kid's side: which value the sitting uses, and for whom ──");
{ const w=demo("kid"), K=w.core, S={sid:"envirothon",kind:"deck",order:"bank",decks:[]};
  ok("the demo's kid: on by default (no value saved anywhere)", K.cpCoreSetting()==="on"&&K.cpCoreOn(w._envs.kid,S)===true);
  w._envc.cls.settings={study:{coreFirst:"off"}};
  ok("the class says off → off", K.cpCoreSetting()==="off"&&K.cpCoreOn(w._envs.kid,S)===false);
  w._envc.students[w._envs.sid].settings={study:{coreFirst:"on"}};
  ok("this student's own on beats the class's off", K.cpCoreSetting()==="on"&&K.cpCoreOn(w._envs.kid,S)===true);
  w._envc.students[w._envs.sid].settings={study:{coreFirst:"maybe"}};
  ok("a bad stored value is skipped (the class's off stands)", K.cpCoreSetting()==="off");
  w._envc.cls.settings={}; w._envc.students[w._envs.sid].settings={};
  ok("another kid, the Daily Mix, a check-up → off", K.cpCoreOn("someone_else",S)===false&&K.cpCoreOn(w._envs.kid,{kind:"mix"})===false&&K.cpCoreOn(w._envs.kid,{kind:"checkup"})===false);
  ok("a session record saying order:'core' is core-first by itself", K.cpCoreOn("someone_else",{kind:"deck",order:"core"})===true); }
{ const t=liveConsole("teacher"); t._envs.kid="k";
  ok("a live teacher / admin login never makes a pile core-first (only kid / parent logins)", t.core.cpCoreOn("k",{kind:"deck",order:"bank"})===false);
  const p=world({fam:FAM,cpcore:true}); p._envs.role="parent"; p._envs.kid="k";
  ok("a live parent login with nothing loaded yet: on (the default)", p.core.cpCoreOn("k",{kind:"deck",order:"bank"})===true); }

console.log("\n── the real mstPile on the real unit: a deck's core cards first ──");
const D1="Forestry · Terms", n1=coreN(D1), all1=deckOf(D1).cards.length, bankPos=deckOf(D1).cards.map((c,i)=>c.core===true?i+1:0).filter(Boolean);
ok("(the data) Forestry · Terms has core and non-core cards, its last core card deep in bank order", n1>0&&n1<all1&&bankPos[bankPos.length-1]>n1, {n1,all1,last:bankPos[bankPos.length-1]});
{ const md=freshKid([D1]), E=engine(true,KID,md,US);
  const h=play(E,md,x=>x.length>=all1), firstNon=h.findIndex(n=>!deckOf(D1).cards.find(c=>c.name===n.name).core);
  ok("core first: the first "+n1+" cards handed are exactly the deck's core cards, in bank order; then the rest, in bank order — none held", firstNon===n1&&h.slice(0,n1).map(n=>n.name).join("|")===deckOf(D1).cards.filter(c=>c.core===true).map(c=>c.name).join("|")&&h.length===all1&&h.slice(n1).map(n=>n.name).join("|")===deckOf(D1).cards.filter(c=>c.core!==true).map(c=>c.name).join("|"));
  const md2=freshKid([D1]), E2=engine(true,Object.assign({},KID,{layers:[{study:{coreFirst:"off"}},{}]}),md2,US), h2=play(E2,md2,x=>x.length>=all1);
  ok("the class's 'In deck order': exactly bank order", h2.map(n=>n.name).join("|")===deckOf(D1).cards.map(c=>c.name).join("|")); }
// a whole station: every Forestry deck in one session, 5 a day, every deck open (focusDecks 0: in bank order a deck with nothing left keeps
// its focus seat, so the bank-order run would stall — the core-first run with focusDecks is the next section)
{ const ST=UNITJ.decks.filter(d=>/^Forestry · /.test(d.key)).map(d=>d.key), core=ST.reduce((s,k)=>s+coreN(k),0), cards=ST.reduce((s,k)=>s+deckOf(k).cards.length,0);
  const isCore=n=>deckOf(n.deck).cards.find(c=>c.name===n.name).core===true, coreDone=h=>h.filter(isCore).length>=core;
  const pile=lay=>{ const md=freshKid(ST,{newPerDay:5,maxCards:0,focusDecks:0}); return play(engine(true,Object.assign({},KID,{layers:lay||[{},{}]}),md,US),md,coreDone,5000); };
  const hc=pile(), hb=pile([{study:{coreFirst:"off"}},{}]);
  const reach=h=>{ let n=0, last=0; h.forEach((x,i)=>{ if(isCore(x)&&++n===core) last=i+1; }); return last; };
  ok("Forestry, core first: all "+core+" of its core cards are the first "+core+" cards handed (the non-core ones start the day the last core one goes out)", coreDone(hc)&&reach(hc)===core&&hc.slice(0,core).every(isCore), reach(hc));
  ok("…in deck order the last core card is card "+reach(hb)+" of the "+cards, coreDone(hb)&&reach(hb)>core, reach(hb));
  const md=freshKid(ST,{newPerDay:5,maxCards:12,focusDecks:2}), hf=play(engine(true,KID,md,US),md,coreDone,5000);
  ok("…and with the site's own numbers (5 a day, 12 a sitting, 2 decks at a time) core first still hands all "+core+" core cards first", coreDone(hf)&&reach(hf)===core, reach(hf)); }

console.log("\n── focusDecks: where new cards open, and the hold across decks ──");
{ const A="General Concepts · Terms", B="Forestry · Terms", ac=deckOf(A).cards, aCore=ac.filter(c=>c.core===true), aRest=ac.filter(c=>c.core!==true);
  // A: every core card already climbed (nothing being learned); B untouched. One deck at a time.
  const mk=()=>{ const md=freshKid([A,B],{newPerDay:5,maxCards:12,focusDecks:1}); aCore.forEach((c,i)=>md.k.push({id:"a"+i,subject:A,prompt:c.name,status:"active",tier:"monthly",next_due:99999,cycle:1})); return md; };
  const md=mk(), p=engine(true,KID,md,US).mstPile("k","envirothon",1,null), pb=engine(true,Object.assign({},KID,{layers:[{study:{coreFirst:"off"}},{}]}),mk(),US).mstPile("k","envirothon",1,null);
  ok("A has no core left and nothing in learning, B has core → B opens first, its core cards come", p.newNames.length===5&&p.newNames.every(n=>n.deck===B&&deckOf(B).cards.find(c=>c.name===n.name).core===true), p.newNames);
  ok("…in deck order A (first in the session) opens and hands its non-core cards", pb.newNames.length===5&&pb.newNames.every(n=>n.deck===A)&&pb.newNames[0].name===aRest[0].name, pb.newNames);
  // A still has one core card being learned → A keeps its seat; its non-core cards wait while B has core left
  const md2=mk(); md2.k[0].status="introduction"; md2.k[0].tier="daily";
  const p2=engine(true,KID,md2,US).mstPile("k","envirothon",1,null);
  ok("a deck being learned keeps its seat (its learning card comes) and hands no non-core card while another deck has core left", p2.learning.length===1&&p2.learning[0].subject===A&&p2.newNames.length===0, p2);
  // once B has no core left either, A's non-core cards flow — nothing waits for a final
  const md3=freshKid([A,B],{newPerDay:5,maxCards:0,focusDecks:0}); ac.concat(deckOf(B).cards).filter(c=>c.core===true).forEach((c,i)=>md3.k.push({id:"c"+i,subject:ac.indexOf(c)>=0?A:B,prompt:c.name,status:"active",tier:"monthly",next_due:99999,cycle:1}));
  const p3=engine(true,KID,md3,US).mstPile("k","envirothon",1,null);
  ok("every core card started → the non-core cards come, A's first (no hold for the final)", p3.newNames.length===5&&p3.newNames[0].deck===A&&p3.newNames[0].name===aRest[0].name);
  // a held station (cat_hold) has no eligible core: it never holds anyone back
  const md4=freshKid([A,B],{newPerDay:5,maxCards:0,focusDecks:0}); aCore.forEach((c,i)=>md4.k.push({id:"a"+i,subject:A,prompt:c.name,status:"active",tier:"monthly",next_due:99999,cycle:1})); md4.k_settings={cat_hold:{[B]:true}};
  const p4=engine(true,KID,md4,US).mstPile("k","envirothon",1,null);
  ok("a deck not sent out yet (held) doesn't hold the open deck's non-core cards", p4.newNames.length===5&&p4.newNames.every(n=>n.deck===A)); }

console.log("\n── Howe and Lincoln: the same arrays, the same pile ──");
{ const D=["General Concepts · Terms","Forestry · Terms"], cases=[["Howe, no edition",{on:false,kid:"lincoln",role:""}],["the site on, but order 'bank' for a kid that isn't the site's",{on:true,kid:"maya",role:"kid"}]];
  cases.forEach(([lbl,site])=>{ const md=freshKid(D,{newPerDay:5,maxCards:12,focusDecks:1}); md.lincoln=md.k; md.lincoln_custom_items=md.k_custom_items; md.lincoln_sessions=md.k_sessions;
    const a=engine(true,site,md,US).mstPile("lincoln","envirothon",3,null), b=engine(false,site,JSON.parse(JSON.stringify(md)),US).mstPile("lincoln","envirothon",3,null);
    ok(lbl+": mstPile with the block === without it", JSON.stringify(a)===JSON.stringify(b)&&a.newNames.length>0); });
  const E=engine(true,{on:false},{},US), names=["Forest","Biome"], S={sid:"envirothon",kind:"deck",order:"bank",decks:["Forestry · Terms"]};
  ok("the hook hands back the very array (===) for Lincoln's 'bank' session", E.cpCoreNames("lincoln",S,"Forestry · Terms",names,{})===names); }

console.log("\n── §15: core is optional ──");
{ const U2={x_unit:{id:"x_unit",decks:[{key:"Roots",cards:[{name:"bio"},{name:"geo"},{name:"tele"}]}]}}, md={k:[],k_custom_items:[{cat:"Roots",name:"bio"},{cat:"Roots",name:"geo"},{cat:"Roots",name:"tele"}],k_sessions:{envirothon:{kind:"deck",decks:["Roots"],newPerDay:5,order:"bank"}}};
  const E=engine(true,KID,md,U2), names=["bio","geo","tele"], S={kind:"deck",order:"bank",decks:["Roots"]};
  ok("a unit that marks no card core: every card counts core, the order doesn't move (the same array back)", E.cpCoreNames("k",S,"Roots",names,{})===names&&E.mstPile("k","envirothon",1,null).newNames.map(n=>n.name).join()==="bio,geo,tele");
  const E2=engine(true,KID,md,{}), n2=["bio","geo"];
  ok("a deck whose cards aren't loaded anywhere stays in bank order (the same array back)", E2.cpCoreNames("k",S,"Roots",n2,{})===n2); }

console.log("\n── the demo: Kid ▸ 🌿 hands the sample deck's core cards first ──");
{ const w=demo("kid"), K=w._envs.kid, DK="Forestry · Terms", u=w.unitStudies.nc_envirothon, d=u.decks.find(x=>x.key===DK);
  const real=deckOf(DK).cards, names=d.cards.map(c=>c.name), have=new Set((w.masteryData[K]||[]).filter(i=>i.subject===DK).map(i=>i.prompt));
  const firstCore=d.cards.findIndex(c=>c.core===true&&!have.has(c.name));
  ok("two non-core cards sit right ahead of the deck's first core card not yet started", firstCore>=2&&d.cards[firstCore-1].core===false&&d.cards[firstCore-2].core===false);
  const two=[d.cards[firstCore-2],d.cards[firstCore-1]];
  ok("…they are the unit's own non-core cards, word for word", two.every(c=>{ const r=real.find(x=>x.name===c.name); return r&&r.core!==true&&r.def===c.def; }), two);
  ok("…the deck's order numbers run 1..n again", d.cards.every((c,i)=>c.order===i+1));
  const cust=(w.masteryData[K+"_custom_items"]||[]).filter(c=>c.cat===DK).map(c=>c.name);
  ok("…and the bank (custom items) has them in the same place", cust.join("|")===names.join("|"));
  ok("seeding again adds nothing", w.core.cpCoreDemoSeed(K,DK)===false&&d.cards.length===names.length);
  // the demo's own pile, through the real engine, on the demo's own records
  const md=JSON.parse(JSON.stringify(w.masteryData)), us=JSON.parse(JSON.stringify(w.unitStudies));
  const pileFor=lay=>engine(true,{on:true,kid:K,role:"kid",demo:true,layers:lay},JSON.parse(JSON.stringify(md)),us).mstPile(K,"envirothon",1,null).newNames.filter(n=>n.deck===DK).map(n=>n.name);
  const pc=pileFor([{},{}]), pb=pileFor([{study:{coreFirst:"off"}},{}]);
  const coreLeft=d.cards.filter(c=>c.core===true&&!have.has(c.name)).map(c=>c.name);
  ok("Kid ▸ 🌿 (core first, the default): the sample deck's new cards are its core ones, in bank order; the two non-core cards wait", pc.length>0&&pc.join("|")===coreLeft.slice(0,pc.length).join("|")&&two.every(c=>pc.indexOf(c.name)<0), pc);
  ok("…with the class on 'In deck order' the two non-core cards come first", pb[0]===two[0].name&&pb[1]===two[1].name, pb); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
