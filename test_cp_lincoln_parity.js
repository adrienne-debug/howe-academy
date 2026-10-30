/*
 * Node tests — 🌿 CPLINCOLNPARITY: Lincoln does everything his class sets for him, inside Howe (after L1 / L3 of
 * DESIGN_class_platform_2026-10-28.md §12; "Adrienne's answers, 2026-10-29"). Her words 2026-10-29: "yes to lincolns stalled cards i basically
 * want him doing everything she wants hi to be but just in our app" · "q21 yes" · "q23 yeah id like to know how he does".
 *   · Where the block sits; every hook a typeof-guarded line that hands back what it was given when L1 is off.
 *   · 1. THE STALL: a replay on the REAL engine (mstSessions, mstPile, CPCORE, CPSEATS, CPREVIEW, ENVDRILLFIRST, NEWBUDGET …) of a
 *     Lincoln-shaped family with L1 on: with the block cut out his Envirothon new cards stop once the open decks run dry; with it they
 *     keep coming until the unit is out. With L1 off the block changes nothing, byte for byte. With L1 on, on the very same records, his
 *     other subjects' piles and Mom's drill are identical with the block in and out, and another kid is untouched.
 *                                                                                                   run: node test_cp_lincoln_parity.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); if(j<0) throw new Error("missing "+b); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const constAt=n=>{ const i=src.indexOf("\nconst "+n+"="); if(i<0) throw new Error("missing const "+n); let d=0; for(let k=i+1;k<src.length;k++){ const c=src[k]; if(c==="["||c==="{"||c==="(") d++; else if(c==="]"||c==="}"||c===")") d--; else if(c===";"&&d===0) return src.slice(i+1,k+1); } };
const BLK=cut("// CPLINCOLNPARITY_START","// CPLINCOLNPARITY_END");
const T="// 🌿 CPLINCOLNPARITY";
const J=x=>JSON.stringify(x);

console.log("0. Where it sits and how it hooks");
ok("one marked block right after CPLINCOLNL3_END", src.indexOf("// CPLINCOLNL3_END\n// CPLINCOLNPARITY_START")>0&&src.split("// CPLINCOLNPARITY_START").length===2);
ok("her words, with the date", /2026-10-29/.test(BLK)&&/i basically want him doing everything she wants/.test(BLK)&&/q21 yes/.test(BLK)&&/q23 yeah id like to know how he does/.test(BLK));
const hookLines=src.split("\n").filter(l=>l.indexOf(T)>=0&&l.indexOf("// CPLINCOLNPARITY_")<0);
ok("every hook line outside the block is tagged and typeof-guarded", hookLines.length>=1&&hookLines.every(l=>/typeof cpln\w+\s*===\s*"function"/.test(l)), hookLines);
ok("mstPile carries the seats hook once, right after CPSHARE's", /cpShareFocus\(kid, session, focusDecks, started, fresh, existingByDeck, loggedNames\);[^\n]*\n\s*if \(typeof cplnFocus === "function"\) focusDecks = cplnFocus\(kid, session, focusDecks, started, fresh, existingByDeck, loggedNames\);/.test(fn("mstPile"))&&fn("mstPile").split("cplnFocus(").length===2);
ok("the block writes nothing (no db, no set / update / remove / transaction)", !/\bdb\b/.test(BLK.replace(/\/\/[^\n]*/g,""))&&!/\.(set|update|remove|transaction)\(/.test(BLK.replace(/\/\/[^\n]*/g,"")));

// ── the engine world: the REAL blocks and functions, sliced from index.html (test_cp_lincoln.js's world + this block) ──
const ENG=[
  constAt("ENV_UNIT_ID"),constAt("ENV_STAGES"),constAt("ENV_DECKS"),constAt("ENV_SESSION_SID"),constAt("ENV_SESSION"),fn("envCardsInCode"),
  constAt("MAST_TIER_ORDER"),constAt("MAST_TIER_INT"),constAt("MAST_MASTERY_TIER_DEFAULT"),constAt("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  cut("// ENVMIRROR_START","// ENVMIRROR_END"),cut("// CPLINCOLN_START","// CPLINCOLN_END"),"__BLK__",
  cut("// ENVCLASSSET_START","// ENVCLASSSET_END"),cut("// CPSEATS_START","// CPSEATS_END"),cut("// CPREVIEW_START","// CPREVIEW_END"),cut("// CPFINAL_START","// CPFINAL_END"),
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastGetCatMode","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","evo2LastTested"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),cut("// REVIEWENGINE_START","// REVIEWENGINE_END"),cut("// NEWBUDGET_START","// NEWBUDGET_END"),cut("// CPCORE_START","// CPCORE_END"),
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  'MST_PATTERN_MODES.push("pick"); MST_PATTERN_MODES.push("copy"); MST_PATTERN_MODES.push("ideas");',
  "const MAST_DEFAULT_CAT_MODES={};","__X__"].join("\n");
// step 2's world adds the class's card / trim / test layers (CPCARDSEDIT, CPTRIM, CPTESTS) and ENVTEST's check-ins, sliced as they are
const L3=cut("// CPLINCOLNL3_START","// CPLINCOLNL3_END");
const ENG4=[cut("// CPCLASS_START","// CPCLASS_END"),cut("// CPPACE_START","// CPPACE_END"),cut("// CPSEND_START","// CPSEND_END"),cut("// CPSHARE_START","// CPSHARE_END"),
  cut("// CPSECTIONS_START","// CPSECTIONS_END"),cut("// CPSPECIALIST_START","// CPSPECIALIST_END"),constAt("ENVS_SHORT"),...["envsStations","envsStationOfDeck"].map(fn)].join("\n");
const ENG2=[cut("// ENVTEST_START","// ENVTEST_END"),cut("// CPCARDSEDIT_START","// CPCARDSEDIT_END"),cut("// CPTRIM_START","// CPTRIM_END"),cut("// CPTESTS_START","// CPTESTS_END"),
  ...["envHydrate","mastGetDef","mastCustomDef","envmUnit","mastTierAtLeast"].map(fn),"const MAST_MATH_ANS={}, MAST_VOCAB_DEFS={};"].join("\n");
function world(o){
  o=o||{};
  const reads=[], writes=[], paints={n:0};
  const edb={ref:p=>({once(ev,ok,bad){ reads.push(p); if(o.refuse&&(o.refuse===p||o.refuse==="*")){ if(bad) bad(new Error("permission_denied")); return; } const v=(o.remote||{})[p]; ok({val:()=>v===undefined?null:v}); },
    on(ev,ok,bad){ reads.push("on:"+p); if(o.refuse&&(o.refuse===p||o.refuse==="*")){ if(bad) bad(new Error("permission_denied")); return; } const v=(o.remote||{})[p]; ok({val:()=>v===undefined?null:v}); }, off(){},
    set(v){ writes.push(["set",p,v]); }, update(v){ writes.push(["update",p,v]); }, remove(){ writes.push(["remove",p]); }})};
  const ctx={console:{log(){},error(){},warn(){}},Object,Array,String,Number,Math,JSON,Date,Set,Map,WeakMap,Infinity,NaN,isNaN,parseInt,parseFloat,Promise,
    window:{HA_FAMILY:o.cfg===false?{familyId:"howe"}:{familyId:"howe",envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:"c1"}},HoweEnvirothon:o.lib||undefined},
    masteryData:o.M, unitStudies:o.U, masteryKid:"lincoln", db:o.db?{ref:p=>({update(v){ writes.push(["db.update",p,v]); }, set(v){ writes.push(["db.set",p,v]); }, remove(){ writes.push(["db.remove",p]); }})}:null, HA_LS:{s:{},getItem(k){ return this.s[k]||null; },setItem(k,v){ this.s[k]=String(v); },removeItem(k){ delete this.s[k]; }},
    _dryRun:()=>false, renderAllSoon:()=>{ paints.n++; }, cap:s=>s[0].toUpperCase()+s.slice(1), gwShowToast(){}, setTimeout:()=>0, clearTimeout(){},
    envSiteOn:()=>!!o.site, envsDemo:()=>false, _envs:{kid:o.site?"lincoln":null,role:o.site?"kid":null,cls:null}, _envc:{}, envcOn:()=>false, envcAdmin:()=>false,
    mastIsNeverDrill:()=>false, mastDynamicShouldAdd:()=>false, mastDynamicShouldPrune:()=>false, mastDynamicEligible:()=>false, mastDynamicMark(){}, mastDynamicClear(){}, mastDynamicCapNotice:false,
    reads, writes, paints, edb};
  vm.createContext(ctx);
  vm.runInContext(ENG.replace("__BLK__",o.noBlock?"":BLK).replace("__X__",(o.l2?ENG2:"")+(o.l4?"\n"+ENG4:"")+(o.l3?"\n"+L3+"\nvar ROSTER=[], momHere=()=>false;":"")),ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  if(o.signedIn!==false) ctx.get("_envm.user={uid:'u1',email:'mom@x'}");
  if(!o.noLoad){ ctx.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); if(!o.noBlock) ctx.get("cplnpLoad('lincoln','c1',edb,'howe_lincoln')"); }
  return ctx;
}
// a Lincoln-shaped family: German (fixed), Science (pace), Daily Study (rest; Math with Mom), Daily Mix (60), and 🌿 with the 15 real decks.
// His Envirothon starts the way the real unit does: General Concepts small and first, the stations bigger; nothing started yet. Half core.
const EDECKS=src.match(/\nconst ENV_DECKS=\[[\s\S]*?\];/)[0].match(/\["([^"]+)","(flip|flash|quiz)"/g).map(s=>s.match(/\["([^"]+)"/)[1]);
const SIZE=d=>/General Concepts/.test(d)?6:14;
const STN=Object.fromEntries(src.match(/\nconst ENV_DECKS=\[[\s\S]*?\];/)[0].match(/\["[^"]+","(?:flip|flash|quiz)",\d+,"[a-z]+"/g).map(x=>{ const m=x.match(/\["([^"]+)","[a-z]+",\d+,"([a-z]+)"/); return [m[1],m[2]]; }));
const OTHER=["German","Science","AAS Words","Math Facts","Vocabulary"];
function fixture(kid){
  kid=kid||"lincoln"; const M={}, items=[], bank=[];
  OTHER.forEach((d,di)=>{ for(let i=0;i<60;i++){ bank.push({cat:d,name:d+" w"+i,def:"d"+i}); }
    for(let i=0;i<40;i++){ const tier=["every_other_day","weekly","bi_weekly","monthly","weekly"][i%5]; items.push({id:kid.slice(0,3)+"|"+d+"|"+d+" w"+i,subject:d,type:d.toLowerCase(),prompt:d+" w"+i,answer:"d"+i,tier,status:"active",review_mode:"flash",next_due:400-(i%7)-di,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); } });
  EDECKS.forEach(d=>{ for(let i=0;i<SIZE(d);i++) bank.push({cat:d,name:d+" c"+i,def:"e"+i}); });
  M[kid]=items; M[kid+"_custom_items"]=bank;
  M[kid+"_settings"]={new_budget:20,intro_dots:4,ladder_streak:1,max_per_cat:5,max_intro_per_cat:3,cat_modes:{German:"flip"},cat_intro_max:Object.assign({German:4},Object.fromEntries(EDECKS.map(d=>[d,3]))),cat_intro_dots:{German:6},miss_drop:"reset",cat_hold:{}};
  M[kid+"_sessions"]={daily_mix:{name:"Daily Mix",kind:"mix",mixFinish:60},
    german:{name:"German",kind:"deck",decks:["German"],newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",maxCards:12,focusDecks:0,budgetRole:"fixed"},
    science:{name:"Science",kind:"deck",decks:["Science"],newPerDay:4,passes:2,mixInAt:"weekly",handOffAt:"monthly",budgetRole:"pace"},
    ds:{name:"Daily Study",kind:"all",skipDecks:["Math Facts"],newPerDay:6,passes:2,mixInAt:"every_other_day",handOffAt:"bi_weekly",maxCards:12,focusDecks:2,budgetRole:"rest"},
    envirothon:{name:"Envirothon",emoji:"🌿",kind:"deck",who:"solo",newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",order:"bank",maxCards:12,focusDecks:2,pattern:["pick","ideas","type"],decks:EDECKS.slice()}};
  M.studyLog={}; M.history={};
  const U={nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{[kid]:true},decks:EDECKS.map(k=>({key:k,station:STN[k],cards:Array.from({length:SIZE(k)},(_,j)=>({name:k+" c"+j,def:"e"+j,core:j%2===0,concept:1+(j%3)}))}))}};
  return {M,U};
}
const CLASS={ "classes/c1/settings":{study:{newPerDay:8,maxCards:"auto",passes:1,focusDecks:2,pattern:["pick","type"],coreFirst:"on",reviewCap:0},drill:{intro_dots:3}},
  "classes/c1/plan":{}, "students/howe_lincoln/settings":{} };
const isEnv=x=>EDECKS.indexOf(x&&(x.subject||x.deck))>=0;
// one school day, the way he works through it: 🌿 (Keep going to the end), German, Science, Daily Study, the whole Daily Mix, Mom's drill
function study(w,kid,sid,pn,until){ const out=[]; let log={items:[]}; for(let k=0;k<50;k++){
    const pile=w.get("mstPile")(kid,sid,pn,log); out.push(pile);
    const n=(pile.reviews||[]).length+(pile.learning||[]).length+(pile.newNames||[]).length; if(!n) break;
    w.get("masteryKid='"+kid+"'"); const items=w.get("masteryData."+kid), scores={};
    pile.reviews.forEach(i=>{ scores[i.id]="c"; }); pile.learning.forEach(i=>{ scores[i.id]="shown"; });
    pile.newNames.forEach(x=>{ const id=kid.slice(0,3)+"|"+x.deck+"|"+x.name; items.push({id,subject:x.deck,type:x.deck.toLowerCase(),prompt:x.name,tier:"daily",review_mode:"flash",status:"introduction",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); scores[id]="shown"; });
    w.get("mastApplyScores")(items,Object.keys(scores).map(id=>({id})),scores,pn,w.get("mastDrillSettings()"),{prevShown:new Set(),autoPull:false,chain:false});
    Object.keys(scores).forEach(id=>{ const it=items.find(i=>i.id===id); log.items.push({id,result:scores[id]==="shown"?"shown":"c",name:it?it.prompt:undefined,deck:it?it.subject:undefined}); });
    if(!until||!(pile.reviewLeft>pile.reviews.length||pile.mixLeft>pile.reviews.length)) break; }
  return out; }
function drill(w,kid,pn){ w.get("masteryKid='"+kid+"'"); const due=w.get("mastDueItems('"+kid+"',"+pn+")"), items=w.get("masteryData."+kid), scores={}; due.forEach(i=>{ scores[i.id]="c"; });
  w.get("mastApplyScores")(items,due.map(i=>({id:i.id})),scores,pn,w.get("mastDrillSettings()"),{autoPull:false,chain:false}); return due.map(i=>i.id); }
function day(w,kid,pn){ const r={};
  r.env=study(w,kid,"envirothon",pn,true); r.german=study(w,kid,"german",pn); r.science=study(w,kid,"science",pn); r.ds=study(w,kid,"ds",pn);
  r.mix=study(w,kid,"daily_mix",pn,true); r.drill=drill(w,kid,pn); r.cards=J(w.get("masteryData."+kid)); return r; }
const envNew=r=>r.env.reduce((s,p)=>s+(p.newNames||[]).filter(isEnv).length,0);
// his other subjects on the SAME records: the piles and Mom's drill (other subjects) from a world with the block and one without
function others(M,U,kid,pn,o){ const mk=nb=>world(Object.assign({M:JSON.parse(J(M)),U:JSON.parse(J(U)),remote:CLASS,noBlock:nb},o||{}));
  const run=w=>{ const r={}; ["german","science","ds","daily_mix"].forEach(k=>{ r[k]=w.get("mstPile")(kid,k,pn,null); }); w.get("masteryKid='"+kid+"'"); r.drill=w.get("mastDueItems('"+kid+"',"+pn+")").filter(i=>!isEnv(i)).map(i=>i.id); return J(r); };
  return [run(mk(false)),run(mk(true))]; }

console.log("1. The stall: his new Envirothon cards keep coming once a deck runs dry");
{ const N=50, P0=400, f1=fixture(), f2=fixture(), f3=fixture(), f4=fixture();
  const Wcut=world({M:f1.M,U:f1.U,remote:CLASS,noBlock:true}), Won=world({M:f2.M,U:f2.U,remote:CLASS});
  const Woff=world({M:f3.M,U:f3.U,remote:CLASS,cfg:false}), WoffCut=world({M:f4.M,U:f4.U,remote:CLASS,cfg:false,noBlock:true});
  ok("the replay's L1 worlds are on, the inert ones off", Won.get("cplnOn('lincoln')")&&Wcut.get("cplnOn('lincoln')")&&!Woff.get("cplnOn('lincoln')"));
  const per={cut:[],on:[]}; let inert=[], rules=[];
  for(let d=0;d<N;d++){ const pn=P0+d;
    if(d%5===0){ const o=others(f2.M,f2.U,"lincoln",pn); if(o[0]!==o[1]) rules.push(pn); }
    const a=day(Wcut,"lincoln",pn), b=day(Won,"lincoln",pn), c=day(Woff,"lincoln",pn), e=day(WoffCut,"lincoln",pn);
    per.cut.push(envNew(a)); per.on.push(envNew(b)); if(J(c)!==J(e)) inert.push(pn); }
  const total=EDECKS.reduce((s,d)=>s+SIZE(d),0), sum=a=>a.reduce((s,x)=>s+x,0), lastNew=a=>a.reduce((m,x,i)=>x>0?i:m,-1);
  const have=w=>w.get("masteryData.lincoln").filter(isEnv).length;
  console.log("      new Envirothon cards a day, block cut out: "+per.cut.join(",")+"\n      with the block: "+per.on.join(","));
  ok("cut out (today): his new cards STOP for good part-way, with "+(total-sum(per.cut))+" of the unit's "+total+" cards never started", sum(per.cut)<total&&per.cut.slice(-20).every(x=>x===0), per.cut);
  ok("…and before that, a day with none every third day (a started deck held its seat until its learning cards graduated)", per.cut.slice(0,20).filter(x=>x===0).length>=5, per.cut);
  ok("with the block: the next decks open and his new cards keep coming until the whole unit is started ("+have(Won)+" of "+total+")", have(Won)===total&&sum(per.on)===total, [have(Won),sum(per.on)]);
  ok("…with never a day without new cards while the unit had some left, and the class's 8 a day on nearly every day", per.on.slice(0,lastNew(per.on)+1).every(x=>x>0)&&per.on.filter(x=>x===8).length>=lastNew(per.on)-2, per.on);
  ok("L1 off (no config block): the block changes nothing — every pile, drill and card, byte for byte, "+N+" days", inert.length===0, inert);
  ok("L1 on, on the very same records: German, Science, Daily Study, the Daily Mix and Mom's drill (other subjects) are identical with the block in and out", rules.length===0, rules);
  const learnLeft=Won.get("masteryData.lincoln").filter(i=>isEnv(i)&&i.status==="introduction").length;
  ok("no learning card is stranded: a deck that ran out still brings its learning cards (rides along, seatless)", learnLeft===0, learnLeft); }
{ const f=fixture("ellis"), g=fixture("ellis"); const R={}; Object.keys(CLASS).forEach(k=>{ R[k]=CLASS[k]; });
  const a=world({M:f.M,U:f.U,remote:R}), b=world({M:g.M,U:g.U,remote:R,noBlock:true}); let same=true;
  for(let d=0;d<20;d++){ if(J(day(a,"ellis",400+d))!==J(day(b,"ellis",400+d))) same=false; }
  ok("another kid of the family (not mirrored): every pile, drill and card, byte for byte, with the block in and out", same&&!a.get("cplnOn('ellis')")); }
{ const f=fixture(); const w=world({M:f.M,U:f.U,remote:CLASS}); const S=w.get("mstSessions('lincoln')");
  const fd=["a","b"]; ok("the hook hands back the very array for every other session", ["german","science","ds"].every(sid=>w.get("cplnFocus")("lincoln",S.find(s=>s.sid===sid),fd,[],fd,{},new Set())===fd));
  const w2=world({M:fixture().M,U:fixture().U,remote:CLASS,cfg:false}), S2=w2.get("mstSessions('lincoln')");
  ok("…and for his 🌿 session with L1 off", w2.get("cplnFocus")("lincoln",S2.find(s=>s.sid==="envirothon"),fd,[],fd,{},new Set())===fd);
  const w3=world({M:fixture().M,U:fixture().U,remote:CLASS,refuse:"classes/c1/settings"}), S3=w3.get("mstSessions('lincoln')");
  ok("…and with a refused class read (his mirror failed)", !w3.get("cplnOn('lincoln')")&&w3.get("cplnFocus")("lincoln",S3.find(s=>s.sid==="envirothon"),fd,[],fd,{},new Set())===fd); }


console.log("2. L2 (Q21): the class's card and test edits reach him, in memory only");
const FT="Forestry · Terms", FF="Forestry · Facts";
function lib(){ const q=(n,t)=>({n,q:t+" "+n+"?",choices:["a","b","c"],ans:0,cards:[]});
  return {unit:{decks:EDECKS.map(k=>({key:k,cards:Array.from({length:SIZE(k)},(_,j)=>({name:k+" c"+j,def:"e"+j,core:j%2===0}))}))},
    tests:{forestry:{label:"Forestry",pre:{form:"F-pre",items:[q(1,"pre"),q(2,"pre"),q(3,"pre")]},post:{form:"F-post",items:[q(1,"post"),q(2,"post"),q(3,"post"),q(4,"post")]}},
      soils:{label:"Soils",pre:{form:"S-pre",items:[q(1,"spre")]},post:{form:"S-post",items:[q(1,"spost")]}}}}; }
const L2R={ "classCards/c1":{[FT]:{o1:{name:FT+" c0",hide:true,by:"t",ts:1},o2:{name:FT+" c1",def:"the class's back",by:"t",ts:2},o3:{name:FT+" c2",core:false,why:"trim",by:"t",ts:3},
      "c-k1":{name:"Class card",def:"hers",core:true,add:true,by:"t",ts:4}},German:{o1:{name:"German w0",hide:true,by:"t",ts:1},o2:{name:"German w1",def:"not his class's",by:"t",ts:2}}},
  "units/nc_envirothon/trim":{[FF]:{o1:{name:FF+" c0",hide:true,why:"a",by:"a",ts:1},o3:{name:FF+" c2",core:false,why:"b",by:"a",ts:2}}},
  "classTests/c1":{forestry:{pre:{items:{"pre-1":{q:"New wording?",choices:["x","y"],ans:1,by:"t",ts:9},"pre-2":{hide:true,by:"t",ts:9},"c-k9":{q:"Hers?",choices:["m","n"],ans:0,add:true,by:"t",ts:10}},ver:12}}} };
function l2(o){ o=o||{}; const f=fixture(); if(o.ellis) f.U.nc_envirothon.enrolled.ellis=true; f.U.nc_envirothon.cardsInCode=true;
  f.M.lincoln.push({id:"lin|"+FT+"|"+FT+" c0",subject:FT,prompt:FT+" c0",answer:"e0",tier:"weekly",status:"active",review_mode:"flash",next_due:390,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0});
  f.M.lincoln_settings.definitions={[FT+" c1"]:"e1 (Mom's)"};
  f.M.lincoln_tests={forestry:{pre:{form:"F-pre",date:"2026-10-20",n:3,right:2,answers:[0,0,1],ts:1}}};   // his Forestry check-in is taken, so its cards are open (ENVTEST)
  const before=J(f.M);
  const R=Object.assign({},CLASS,o.remote===undefined?L2R:o.remote);
  const w=world(Object.assign({M:f.M,U:f.U,remote:R,l2:true,lib:lib()},o.w||{})); w.get("envHydrate(unitStudies.nc_envirothon,window.HoweEnvirothon)"); w.before=before; return w; }
const bankOf=(w,d)=>w.get("mastBankEligible('lincoln',"+J(d)+")");
const pileIds=(w,sid)=>{ const p=w.get("mstPile('lincoln','"+sid+"',400,null)"); return {r:p.reviews.map(i=>i.id),l:p.learning.map(i=>i.id),n:p.newNames.map(x=>x.deck+"|"+x.name)}; };
{ const w=l2();
  ok("his reads: classCards/<cid>, Adrienne's unit trims and classTests/<cid>, once each, after L1's three", J(w.reads.filter(r=>!/^classes|^students/.test(r)))===J(["classCards/c1","units/nc_envirothon/trim","classTests/c1"]), w.reads);
  ok("on: the card layer and the unit's tests follow his class", w.get("cplnpCardsOn('lincoln')")&&w.get("cplnpUnitKid('tests')")==="lincoln");
  const b=bankOf(w,FT);
  ok("a card the class hid leaves his bank; the class's added card joins it", b.indexOf(FT+" c0")<0&&b.indexOf("Class card")>=0&&b.indexOf(FT+" c3")>=0, b);
  ok("a card Adrienne hid for the unit leaves his bank too", bankOf(w,FF).indexOf(FF+" c0")<0&&bankOf(w,FF).indexOf(FF+" c1")>=0);
  ok("an edited back is the back he sees (Envirothon deck)", w.get("mastGetDef('lincoln',"+J(FT+" c1")+","+J(FT)+")")==="the class's back");
  ok("…and a deckless lookup of the same front never takes the class's back", w.get("mastGetDef('lincoln',"+J(FT+" c1")+",null)")!=="the class's back");
  ok("the class's added card has its back", w.get("mastGetDef('lincoln','Class card',"+J(FT)+")")==="hers");
  ok("the hidden card he already had leaves his 🌿 sitting and Mom's drill", !pileIds(w,"envirothon").r.some(id=>/Terms c0$/.test(id))&&!w.get("mastDueItems('lincoln',420)").some(i=>i.prompt===FT+" c0"));
  const C=w.get("[...cpCoreSet("+J(FT)+")]");
  ok("a card the class made optional is no longer core; the class's added core card is", C.indexOf(FT+" c2")<0&&C.indexOf(FT+" c0")>=0&&C.indexOf("Class card")>=0, C);
  ok("…and one Adrienne made optional for the unit (or hid) is no longer core either", w.get("[...cpCoreSet("+J(FF)+")]").indexOf(FF+" c2")<0&&w.get("[...cpCoreSet("+J(FF)+")]").indexOf(FF+" c0")<0);
  const cc=w.get("envtCoreCount('lincoln','forestry')"), cc0=l2({remote:{}}).get("envtCoreCount('lincoln','forestry')");
  ok("the final's core total follows: Forestry "+cc0.total+" → "+cc.total+" (−1 hidden −1 optional −1 unit-hidden −1 unit-optional +1 hers)", cc.total===cc0.total-3, [cc0,cc]);
  const G=["German","Science","AAS Words","Vocabulary"];
  ok("his other decks are untouched: German keeps the card the class's layer names, and its own back", G.every(d=>J(bankOf(w,d))===J(bankOf(l2({remote:{}}),d)))&&bankOf(w,"German").indexOf("German w0")>=0&&w.get("mastGetDef('lincoln','German w1','German')")!=="not his class's");
  const u=w.get("unitStudies.nc_envirothon.decks").find(d=>d.key===FT);
  ok("the unit record in memory gets the core flag only: no class back, no added card", u.cards.every(c=>c.def===c.name.replace(/^.* c/,"e")||false)&&!u.cards.some(c=>c.name==="Class card")&&u.cards.find(c=>c.name===FT+" c2").core===false, u.cards.slice(0,3));
  ok("nothing written anywhere, and his Howe records are exactly as they were", w.writes.length===0&&J(w.get("masteryData"))===w.before);
  const pre=w.get("envtForm('forestry','pre')"), post=w.get("envtForm('forestry','post')"), base=lib().tests.forestry;
  ok("his check-in is the class's form: her wording, without the one she removed, with hers at the end", pre.items.map(i=>i.q).join("|")==="New wording?|pre 3?|Hers?"&&pre.cls===true&&pre.ver===12, pre.items.map(i=>i.q));
  ok("a form the class didn't touch is the unit's own (the same questions)", J(post.items.map(i=>i.q))===J(base.post.items.map(i=>i.q)));
  const rec={form:pre.form,answers:[1,0,0]}; w.get("cpctAttempt")(rec,{kid:"lincoln",which:"pre",form:pre,answers:[1,0,0]});
  ok("his attempt on the class's form keeps each answer by question id and the form's version (Brittany's results line up)", J(rec.ans)===J({"pre-1":1,"pre-3":0,"c-k9":0})&&rec.formVer===12, rec);
  const r2={form:post.form,answers:[0,0,0,0]}; w.get("cpctAttempt")(r2,{kid:"lincoln",which:"post",form:post,answers:[0,0,0,0]});
  ok("…and one on the unit's own form stays as today (no ans, no formVer)", r2.ans===undefined&&r2.formVer===undefined);
  const S=["german","science","ds","daily_mix"], w0=l2({remote:{}});
  ok("his other subjects' piles and Mom's drill (other subjects) are identical with the class's layers and without, on the same records", S.every(sid=>J(pileIds(w,sid))===J(pileIds(w0,sid)))&&J(w.get("mastDueItems('lincoln',420)").filter(i=>!isEnv(i)).map(i=>i.id))===J(w0.get("mastDueItems('lincoln',420)").filter(i=>!isEnv(i)).map(i=>i.id))); }
{ const w=l2({w:{refuse:"*"}});
  ok("every read refused: L1 is off and he keeps the unit as is (bank, backs, core, forms)", !w.get("cplnOn('lincoln')")&&bankOf(w,FT).indexOf(FT+" c0")>=0&&bankOf(w,FT).indexOf("Class card")<0&&w.get("mastGetDef('lincoln',"+J(FT+" c1")+","+J(FT)+")")!=="the class's back"&&w.get("[...cpCoreSet("+J(FT)+")]").indexOf(FT+" c2")>=0&&w.get("envtForm('forestry','pre')").items.length===3); }
{ const w=l2({w:{refuse:"classCards/c1"}});
  ok("only the card read refused: his cards stay the unit's (Adrienne's unit trims ride on his class's card layer, so they wait too); his tests still follow the class", bankOf(w,FT).indexOf(FT+" c0")>=0&&bankOf(w,FF).indexOf(FF+" c0")>=0&&w.get("[...cpCoreSet("+J(FT)+")]").indexOf(FT+" c2")>=0&&w.get("envtForm('forestry','pre')").cls===true&&w.writes.length===0); }
{ const w=l2({w:{refuse:"classTests/c1"}});
  ok("only the test read refused: his check-ins stay the unit's; his cards still follow the class", w.get("envtForm('forestry','pre')").cls!==true&&w.get("envtForm('forestry','pre')").items.length===3&&bankOf(w,FT).indexOf("Class card")>=0); }
{ const w=l2({w:{cfg:false}});
  ok("no mirror (no envirothon config): every hook hands back what it was given", !w.get("cplnpCardsOn('lincoln')")&&w.get("cplnpCardsLayer()")===null&&w.get("cplnpForm('forestry','pre',{items:[]})")===undefined&&w.get("cplnpCoreSet("+J(FT)+")")===null&&w.get("cplnpHydrate(unitStudies.nc_envirothon)")===false&&w.get("cplnpAttempt({}, {kid:'lincoln',form:{cls:true,items:[]}})")===false&&w.get("envmKids().length")===0);   // envmKids empty: the mirror never even calls cplnpLoad
  ok("…so his bank, backs, core and forms are the unit's", bankOf(w,FT).indexOf(FT+" c0")>=0&&bankOf(w,FT).indexOf("Class card")<0&&w.get("[...cpCoreSet("+J(FT)+")]").indexOf(FT+" c2")>=0&&w.get("envtForm('forestry','pre')").items.length===3); }
{ const w=l2({w:{site:true}});
  ok("the class site itself: none of it (its own layers run)", !w.get("cplnpCardsOn('lincoln')")&&w.get("cplnpForm('forestry','pre',{items:[]})")===undefined); }
{ const w=l2({ellis:true});
  ok("another kid enrolled in the unit and not mirrored: the shared unit (core flags, test forms) stays the unit's", w.get("cplnpUnitKid('cards')")===null&&w.get("[...cpCoreSet("+J(FT)+")]").indexOf(FT+" c2")>=0&&w.get("envtForm('forestry','pre')").items.length===3);
  ok("…while Lincoln's own bank and backs still follow his class, and Ellis's bank is his own", bankOf(w,FT).indexOf(FT+" c0")<0&&w.get("mastGetDef('lincoln',"+J(FT+" c1")+","+J(FT)+")")==="the class's back"&&!w.get("cpceKidOn('ellis')")); }


console.log("3. Q23: Brittany's drills with Lincoln on Mom's Day ▸ 🏡 My day (Mom only)");
ok("renderMomsDay carries the line once, right after the come-back nudges; Mom HQ doesn't", /h\+=cbNudgeHTML\(\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof cplnpMomDayHtml==="function"\) h\+=cplnpMomDayHtml\(\); \}catch\(e\)\{\}/.test(fn("renderMomsDay"))&&fn("renderMomsDay").split("cplnpMomDayHtml(").length===2&&fn("renderMomHQ").indexOf("cplnpMomDayHtml")<0);
function w3(o){ o=o||{}; const f=fixture(); const at=(d,h)=>new Date(2026,9,d,h,0,0).getTime(), it=(n,r)=>({deck:FT,name:n,r});
  if(!o.none) f.M.lincoln_teacherDrills=o.drills||{a1:{at:at(29,10),teacher:"Ms. Brittany",items:[it("Sourwood","m"),it("Oak","c"),it("Pine","c"),it("Ash","c"),it("Elm","c")],right:4,n:5},
    a2:{at:at(29,9),teacher:"Ms. Brittany",items:[it("Bark","c"),it("Cambium","c"),it("Xylem","c")],right:3,n:3},
    b1:{at:at(27,11),teacher:"Ms. <b>Brittany</b>",items:[it("Phloem","m"),it("Leaf","c"),it("Root","m"),it("Bud","c")],right:2,n:4},
    old:{at:at(23,11),teacher:"Ms. Brittany",items:[it("Seed","c")],right:1,n:1}};
  const w=world(Object.assign({M:f.M,U:f.U,remote:CLASS,l3:true},o.w||{})); w.get("ROSTER=['lincoln','ellis']; momHere=()=>"+(o.mom!==false));
  w.now=new Date(2026,9,o.day||29,14,0,0).getTime(); w.before=J(w.get("masteryData")); return w; }
{ const w=w3(), h=w.get("cplnpMomDayHtml")(w.now);
  ok("today's drills in one line: \"👩‍🏫 Ms. Brittany drilled Lincoln today: 7 of 8 · missed 'Sourwood'\"", h.indexOf("Ms. Brittany drilled Lincoln today: 7 of 8 · missed &#39;Sourwood&#39;")>=0||h.indexOf("Ms. Brittany drilled Lincoln today: 7 of 8 · missed 'Sourwood'")>=0, h.slice(0,600));
  ok("the week's tally from Monday on (last week's drill left out): \"This week: 3 drills · 9 of 12 right\"", /data-cplnp="week"[^>]*>This week: 3 drills · 9 of 12 right</.test(h));
  ok("a tap opens L3's own list right there (no leaving Mom's Day)", /<details data-cplnp="day"/.test(h)&&/data-cplnt="list"/.test(h)&&/data-cplnt="month"/.test(h));
  ok("the teacher's name is escaped", h.indexOf("<b>Brittany")<0);
  ok("nothing written, his records as they were", w.writes.length===0&&J(w.get("masteryData"))===w.before); }
{ const w=w3({day:30}), h=w.get("cplnpMomDayHtml")(w.now);
  ok("no drill today: the last one this week instead (\"… last drilled Lincoln Thu, Oct 29: 4 of 5 · missed 'Sourwood'\")", /Ms\. Brittany last drilled Lincoln [^:]*29[^:]*: 4 of 5 · missed 'Sourwood'/.test(h)&&/This week: 3 drills · 9 of 12 right/.test(h), h.slice(0,400)); }
{ const w=w3({day:2+31}); ok("a week with none: no line", w.get("cplnpMomDayHtml")(new Date(2026,10,3,14).getTime())===""); }
{ const w=w3({none:true}); ok("no teacher drills at all: no line", w.get("cplnpMomDayHtml")(w.now)===""); }
{ const w=w3({mom:false}); ok("Mom only: nothing when Mom isn't here", w.get("cplnpMomDayHtml")(w.now)===""); }
{ const w=w3({w:{cfg:false}}); ok("no mirror (no envirothon config): no line", w.get("cplnpMomDayHtml")(w.now)===""); }


console.log("4. Parity: every class setting that changes what he studies, read from his class into his 🌿 Envirothon");
const SOT="Soils and Land Use · Terms", WT="Wildlife · Terms", FID="Forestry · ID";
function w4(o){ o=o||{}; const f=fixture(); f.U.nc_envirothon.cardsInCode=true; f.M.lincoln_tests={forestry:{pre:{form:"F-pre",n:3,right:2,answers:[0,0,1],ts:1}},soils:{pre:{form:"S-pre",n:1,right:1,answers:[0],ts:1}},wildlife:{pre:{form:"W-pre",n:1,right:1,answers:[0],ts:1}}};
  [SOT,"Soils and Land Use · Facts"].forEach(d=>{ for(let i=0;i<3;i++) f.M.lincoln.push({id:"lin|"+d+"|"+d+" c"+i,subject:d,prompt:d+" c"+i,answer:"e",tier:"weekly",status:"active",review_mode:"flash",next_due:390,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); });
  if(o.hold) f.M.lincoln_settings.cat_hold=Object.fromEntries(EDECKS.filter(d=>STN[d]!=="general").map(d=>[d,true]));
  const before=J(f.M), R=Object.assign({},JSON.parse(J(CLASS)),{"classes/c1/tz":"America/New_York"},o.remote||{});
  if(o.study) Object.assign(R["classes/c1/settings"].study,o.study); if(o.plan) R["classes/c1/plan"]=o.plan;
  const w=world(Object.assign({M:f.M,U:f.U,remote:R,l2:true,l4:true,lib:lib(),db:true},o.w||{})); w.get("envHydrate(unitStudies.nc_envirothon,window.HoweEnvirothon)"); w.before=before; return w; }
const elig=(w,d)=>w.get("mastBankEligible('lincoln',"+J(d)+")");
const envS=w=>w.get("mstSessions('lincoln').find(s=>s.sid==='envirothon')"), gerS=w=>w.get("mstSessions('lincoln').find(s=>s.sid==='german')");
const otherPiles=w=>J(["german","science","ds","daily_mix"].map(sid=>pileIds(w,sid)).concat([w.get("mastDueItems('lincoln',420)").filter(i=>!isEnv(i)).map(i=>i.id)]));
// SECTIONS
{ const w=w4({plan:{forestry:{state:"review"}},remote:{"students/howe_lincoln/sections":{soils:"off"}}});
  ok("his reads add his section states, his specialist and the class's features, once each", ["students/howe_lincoln/sections","students/howe_lincoln/specialist","classes/c1/features"].every(p=>w.reads.filter(r=>r===p).length===1), w.reads);
  ok("SECTIONS · the class's Review only: no new cards from Forestry", w.get("cpSecState('lincoln','forestry')")==="review"&&elig(w,FT).length===0&&elig(w,FID).length===0);
  ok("SECTIONS · his own Off: Soils' cards leave his 🌿 sitting and Mom's drill, and no new ones", w.get("cpSecState('lincoln','soils')")==="off"&&!pileIds(w,"envirothon").r.some(id=>/Soils/.test(id))&&!w.get("mastDueItems('lincoln',420)").some(i=>/Soils/.test(i.subject))&&elig(w,SOT).length===0);
  { const pre=x=>{ delete x.get("masteryData").lincoln_tests.soils; return x.get("envtStatus(unitStudies.nc_envirothon,'lincoln','soils')").pre.open; };
    const wOn=w4({plan:{forestry:{state:"review"}},remote:{"students/howe_lincoln/sections":{}}});
    ok("SECTIONS · Off: Soils' check-in waits until it is back On (open with Soils On, closed with it Off)", pre(wOn)===true&&pre(w)===false&&w.get("cpSecTestOff('lincoln','soils')")===true); }
  ok("SECTIONS · a section the class left On gives as before", elig(w,WT).length===SIZE(WT));
  const w0=w4({plan:{forestry:{state:"review"}},remote:{"students/howe_lincoln/sections":{soils:"off"}},w:{noBlock:true}});
  ok("SECTIONS · his other subjects' piles and Mom's drill (other subjects) are identical with this and without", otherPiles(w)===otherPiles(w0)); }
{ const w=w4({plan:{forestry:{state:"review"}},remote:{"students/howe_lincoln/sections":{forestry:"on"}}});
  ok("SECTIONS · his own On beats the class's Review only (the teacher's per-student override)", w.get("cpSecState('lincoln','forestry')")===""&&elig(w,FT).length>0); }
{ const w=w4({plan:{forestry:{state:"review"}},w:{refuse:"students/howe_lincoln/sections"}});
  ok("SECTIONS · his section read refused: today's behaviour (Forestry still gives)", w.get("cpSecKidOn('lincoln')")===false&&elig(w,FT).length>0); }
// SPECIALIST
{ const R={"students/howe_lincoln/sections":{},"students/howe_lincoln/specialist":"wildlife","classes/c1/features":{specialists:true}};
  const w=w4({remote:R,study:{specialistShare:70,specialistOthers:"review"}});
  ok("SPECIALIST · his own section stays On; the others go to review only (the class's \"others\")", w.get("cpSecState('lincoln','wildlife')")===""&&w.get("cpSecState('lincoln','forestry')")==="review"&&elig(w,FT).length===0&&elig(w,WT).length>0);
  const r=w.get("cpShareRule")("lincoln",envS(w));
  ok("SPECIALIST · his new cards: a mix with Wildlife at its share", r&&r.newFrom==="mix"&&r.mix.wildlife>0, r);
  const w2=w4({remote:Object.assign({},R,{"classes/c1/features":{specialists:false}}),study:{specialistOthers:"review"}});
  ok("SPECIALIST · the class's feature off: no specialist (every section as the class has it)", w2.get("cplnpSpec('lincoln')")===""&&w2.get("cpSecState('lincoln','forestry')")===""); }
// WHERE NEW CARDS COME FROM
{ const w=w4({study:{newFrom:"newestOnly"}}); const S=envS(w);
  ok("CPSHARE · his 🌿 session takes the class's rule (Newest only)", J(w.get("cpShareRule")("lincoln",S))===J({newFrom:"newestOnly",catchUp:30,mix:{}}));
  ok("CPSHARE · …and none of his other sessions ever does", w.get("cpShareRule")("lincoln",gerS(w))===null&&["science","ds"].every(sid=>w.get("cpShareRule")("lincoln",w.get("mstSessions('lincoln')").find(s=>s.sid===sid))===null));
  w.get("cpShareSeen('lincoln',{general:{openedAt:1},forestry:{openedAt:5},soils:{openedAt:9}})");
  const p=w.get("mstPile('lincoln','envirothon',400,null)"), w0=w4({});
  const p0=w0.get("mstPile('lincoln','envirothon',400,null)");
  ok("CPSHARE · Newest only: his new cards all come from the section sent out last (Soils)", p.newNames.length>0&&p.newNames.every(x=>STN[x.deck]==="soils"), p.newNames.map(x=>x.deck));
  ok("CPSHARE · …where deck by deck (nothing saved) starts at the first open deck", p0.newNames.length>0&&STN[p0.newNames[0].deck]==="general", p0.newNames.map(x=>x.deck));
  ok("CPSHARE · his override beats the class's rule", J(w4({study:{newFrom:"spread"},remote:{"students/howe_lincoln/settings":{study:{newFrom:"newestOnly"}}}}).get("cpShareRule('lincoln',mstSessions('lincoln').find(s=>s.sid==='envirothon'))").newFrom)==='"newestOnly"');
  ok("CPSHARE · L1 off (no mirror): none", w4({study:{newFrom:"spread"},w:{cfg:false}}).get("cpShareRule('lincoln',mstSessions('lincoln').find(s=>s.sid==='envirothon'))")===null); }
// CORE ONLY
{ const w=w4({plan:{forestry:{coreOnly:true}}}); const S=envS(w), names=[FT+" c1",FT+" c2",FT+" c3",FT+" c4"];
  ok("CORE ONLY · a Core only section hands out only its core cards in his 🌿 sitting", J(w.get("cpPaceCoreOnly")("lincoln",S,FT,names))===J([FT+" c2",FT+" c4"]));
  ok("CORE ONLY · no other session of his is touched (the very same array)", w.get("(n=>cpPaceCoreOnly('lincoln',mstSessions('lincoln').find(s=>s.sid==='german'),'German',n)===n)")(names));
  const w2=w4({plan:{forestry:{coreOnly:true}},remote:{"students/howe_lincoln/sections":{},"students/howe_lincoln/specialist":"forestry","classes/c1/features":{specialists:true}}});
  ok("CORE ONLY · his specialist section hands out its non-core cards too", J(w2.get("cpPaceCoreOnly")("lincoln",envS(w2),FT,names))===J(names));
  const w3=w4({plan:{forestry:{coreOnly:true}},w:{cfg:false}});
  ok("CORE ONLY · L1 off: as today (the very same array)", w3.get("(n=>cpPaceCoreOnly('lincoln',mstSessions('lincoln').find(s=>s.sid==='envirothon'),"+J(FT)+",n)===n)")(names)); }
// SEND-OUTS
{ const w=w4({hold:true});
  const n=w.get("envmRelease")("lincoln",{"forestry~k1":{openedAt:100,by:"t",level:"kc"}});
  const st=w.get("masteryData.lincoln_settings"), up=w.writes.filter(x=>x[0]==="db.update");
  ok("SEND-OUTS · a Key Concept send-out opens Forestry's decks for that Key Concept only (cat_open), in one targeted update of his settings", n>0&&!st.cat_hold[FT]&&st.cat_open[FT]&&st.cat_open[FT].k1===100&&up.length===1&&up[0][1]==="mastery/lincoln_settings"&&Object.keys(up[0][2]).every(k=>/^cat_(hold|open)\/Forestry · /.test(k)), up);
  const e=elig(w,FT); ok("SEND-OUTS · …so only Key Concept 1's cards come", e.length>0&&e.every(x=>(+x.split(" c")[1])%3===0), e);
  ok("SEND-OUTS · the other sections stay held", st.cat_hold[SOT]===true&&elig(w,SOT).length===0); }
{ const w=w4({hold:true,w:{cfg:false}}); const n=w.get("envmRelease")("lincoln",{"forestry~k1":{openedAt:100}});
  ok("SEND-OUTS · no mirror (L1 off): a Key Concept key changes nothing, as today", n===0&&w.get("masteryData.lincoln_settings").cat_hold[FT]===true&&w.writes.length===0); }
{ const w=w4({hold:true,remote:{"release/c1/scheduled":{s1:{key:"soils",to:"all",on:"2026-10-01",at:"08:00",by:"t",ts:1},s2:{key:"wildlife",to:"all",on:"2099-01-01",at:"08:00",by:"t",ts:1}},
    "release/c1/all":{aquatics:{openedAt:50,by:"t"}}}});
  w.get("_envm.edb=edb; _envm.classOf={lincoln:'c1'}"); w.get("cplnpReady('lincoln')"); const st=w.get("masteryData.lincoln_settings");
  ok("SEND-OUTS · his class known: the scheduled listener is on for him", w.reads.indexOf("on:release/c1/scheduled")>=0&&!!w.get("_envm.subs['lincoln|sched']"));
  ok("SEND-OUTS · a scheduled send-out whose moment has passed lands (Soils); one still ahead waits (Wildlife)", !st.cat_hold[SOT]&&st.cat_hold[WT]===true, st.cat_hold);
  ok("SEND-OUTS · the send-outs already there are run through it once more (Aquatics)", !st.cat_hold["Aquatic Ecology · Terms"]);
  ok("SEND-OUTS · where new cards come from knows when each section opened for him", w.get("_cpshare.sent.lincoln.aquatics")===50); }
{ const w=w4({hold:true,study:{catchUp:40}}); ok("SEND-OUTS · the class's catch-up share is his", w.get("cpsdCatchUp()")===40&&w4({hold:true,study:{catchUp:40},w:{cfg:false}}).get("cpsdCatchUp()")===30); }
// all of it at once, and the safety nets
{ const all={plan:{forestry:{state:"review",coreOnly:true},soils:{coreOnly:true}},study:{newFrom:"spread",specialistOthers:"review"},
    remote:{"students/howe_lincoln/sections":{aquatics:"off"},"students/howe_lincoln/specialist":"wildlife","classes/c1/features":{specialists:true}}};
  const w=w4(all), w0=w4(Object.assign({},all,{w:{noBlock:true}}));
  ok("everything on at once: his other subjects' piles and Mom's drill (other subjects) are identical with the block in and out, on the same records", otherPiles(w)===otherPiles(w0));
  ok("…his Howe records are as they were (the only write is a send-out's, and none came)", J(w.get("masteryData"))===w.before&&w.writes.length===0);
  const wr=w4(Object.assign({},all,{w:{refuse:"*"}})), wc=w4(Object.assign({},all,{w:{cfg:false}}));
  ok("every read refused: today's behaviour — the same 🌿 pile, bank and states as with no mirror at all", J(pileIds(wr,"envirothon"))===J(pileIds(wc,"envirothon"))&&J(elig(wr,FT))===J(elig(wc,FT))&&wr.get("cpSecState('lincoln','aquatics')")===""&&wr.get("cpShareRule('lincoln',mstSessions('lincoln').find(s=>s.sid==='envirothon'))")===null);
  const we=w4(all); const f=fixture("ellis"); we.get("masteryData").ellis=f.M.ellis;
  ok("another kid of the family is never his: no section state, no rule, no Core only", we.get("cpSecKidOn('ellis')")===false&&we.get("cpShareRule('ellis',mstSessions('lincoln').find(s=>s.sid==='envirothon'))")===null); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
