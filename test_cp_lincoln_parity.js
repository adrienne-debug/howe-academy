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
  "const MAST_DEFAULT_CAT_MODES={};"].join("\n");
function world(o){
  o=o||{};
  const reads=[], writes=[], paints={n:0};
  const edb={ref:p=>({once(ev,ok,bad){ reads.push(p); if(o.refuse&&(o.refuse===p||o.refuse==="*")){ if(bad) bad(new Error("permission_denied")); return; } const v=(o.remote||{})[p]; ok({val:()=>v===undefined?null:v}); },
    on(ev,ok,bad){ reads.push("on:"+p); if(o.refuse&&(o.refuse===p||o.refuse==="*")){ if(bad) bad(new Error("permission_denied")); return; } const v=(o.remote||{})[p]; ok({val:()=>v===undefined?null:v}); }, off(){},
    set(v){ writes.push(["set",p,v]); }, update(v){ writes.push(["update",p,v]); }, remove(){ writes.push(["remove",p]); }})};
  const ctx={console:{log(){},error(){},warn(){}},Object,Array,String,Number,Math,JSON,Date,Set,Map,WeakMap,Infinity,NaN,isNaN,parseInt,parseFloat,Promise,
    window:{HA_FAMILY:o.cfg===false?{familyId:"howe"}:{familyId:"howe",envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:"c1"}}},
    masteryData:o.M, unitStudies:o.U, masteryKid:"lincoln", db:null, HA_LS:{s:{},getItem(k){ return this.s[k]||null; },setItem(k,v){ this.s[k]=String(v); },removeItem(k){ delete this.s[k]; }},
    _dryRun:()=>false, renderAllSoon:()=>{ paints.n++; }, cap:s=>s[0].toUpperCase()+s.slice(1), gwShowToast(){}, setTimeout:()=>0, clearTimeout(){},
    envSiteOn:()=>!!o.site, envsDemo:()=>false, _envs:{kid:o.site?"lincoln":null,role:o.site?"kid":null,cls:null}, _envc:{}, envcOn:()=>false, envcAdmin:()=>false,
    mastIsNeverDrill:()=>false, mastDynamicShouldAdd:()=>false, mastDynamicShouldPrune:()=>false, mastDynamicEligible:()=>false, mastDynamicMark(){}, mastDynamicClear(){}, mastDynamicCapNotice:false,
    reads, writes, paints, edb};
  vm.createContext(ctx);
  vm.runInContext(ENG.replace("__BLK__",o.noBlock?"":BLK),ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  if(o.signedIn!==false) ctx.get("_envm.user={uid:'u1',email:'mom@x'}");
  if(!o.noLoad) ctx.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')");
  return ctx;
}
// a Lincoln-shaped family: German (fixed), Science (pace), Daily Study (rest; Math with Mom), Daily Mix (60), and 🌿 with the 15 real decks.
// His Envirothon starts the way the real unit does: General Concepts small and first, the stations bigger; nothing started yet. Half core.
const EDECKS=src.match(/\nconst ENV_DECKS=\[[\s\S]*?\];/)[0].match(/\["([^"]+)","(flip|flash|quiz)"/g).map(s=>s.match(/\["([^"]+)"/)[1]);
const SIZE=d=>/General Concepts/.test(d)?6:14;
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
  const U={nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{[kid]:true},decks:EDECKS.map((k,i)=>({key:k,station:["general","forestry","soils","aquatic","wildlife"][Math.min(4,Math.floor(i/3))],cards:Array.from({length:SIZE(k)},(_,j)=>({name:k+" c"+j,def:"e"+j,core:j%2===0}))}))}};
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

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
