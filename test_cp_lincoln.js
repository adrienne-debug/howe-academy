/*
 * Node tests — 🌿 CPLINCOLN, L1 of the class platform (DESIGN_class_platform_2026-10-28.md §12.1, §13 row L1). Her words 2026-10-28:
 * "I want Lincoln's cards limit to follow what the class limit is. And I don't want his Envirothon to affect his overall cards, but to be
 * incorporated as needed. And they have to keep being in there, but it can still be in the study session." Her picks 2026-10-29: his
 * Envirothon weekly cards "Move to 🌿 sitting" (out of the Daily Mix); the new-card budget "Leave Envirothon out".
 *   · Where the block sits; every hook a typeof-guarded line; the block writes nothing and reads only through his mirror.
 *   · Inert: no config, signed out, reads not all in, a read refused, the class site → every hook hands back what it was given (===).
 *   · The three reads; his 🌿 session in memory (class ← his override over the site's defaults, Auto seats, core first, reviews in the
 *     sitting + Reviews a sitting); his 15 decks' per-deck drill fields only; ENV_DRILL_MAX → Reviews a sitting; the section plan; the
 *     editors open on HIS values; "⚙️ set by the class".
 *   · THE REPLAY: a Lincoln-shaped family (German fixed · Science pace · Daily Study rest · Mom-only Math · Daily Mix · 🌿 with the 15 real
 *     Envirothon decks), 60 school days on the REAL engine sliced from index.html (mstSessions, mstPile, mstOwnedIds, mastDueItems with
 *     ENVDRILLFIRST, mastApplyScores, NEWBUDGET, REVIEWENGINE's rePlan), every card right. Three worlds: the block cut out, the block
 *     inert, L1 on. Inert = cut out, byte for byte. L1 on: German, Science, Daily Study, Mom's drill (other subjects) and the spreading are
 *     byte-identical every day, and so is every non-Envirothon card. The two accepted effects are pinned exactly: (a) the Mix's other
 *     cards are the same set minus the Envirothon cards; (b) the budget's load leaves out the 15 decks and nothing else in it changes.
 *     His Envirothon cards keep coming and none drops out.                                          run: node test_cp_lincoln.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); if(j<0) throw new Error("missing "+b); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const constAt=n=>{ const i=src.indexOf("\nconst "+n+"="); if(i<0) throw new Error("missing const "+n); let d=0; for(let k=i+1;k<src.length;k++){ const c=src[k]; if(c==="["||c==="{"||c==="(") d++; else if(c==="]"||c==="}"||c===")") d--; else if(c===";"&&d===0) return src.slice(i+1,k+1); } };
const BLK=cut("// CPLINCOLN_START","// CPLINCOLN_END");
const T="// 🌿 CPLINCOLN";

console.log("1. Where it sits and how it hooks");
ok("one marked block right after ENVMIRROR_END", src.indexOf("// ENVMIRROR_END\n// CPLINCOLN_START")>0);
ok("her words and both picks, with dates", /2026-10-28/.test(BLK)&&/I want Lincoln's cards limit to follow what the class limit is/.test(BLK)&&/2026-10-29/.test(BLK)&&/Move to 🌿 sitting/.test(BLK)&&/Leave Envirothon out/.test(BLK));
ok("the block writes nothing: no set / update / remove / transaction / push, no db", !/\.(set|update|remove|transaction|push)\(\s*[^)]/.test(BLK.replace(/\.push\(p\[0\]|rec\.n|\.push\(/g,""))&&!/\bdb\b/.test(BLK)&&!/HA_LS/.test(BLK));
ok("its only reads are three .once on the mirror's app", (BLK.match(/\.once\(/g)||[]).length===1&&/classes\/"\+cid\+"\/settings/.test(BLK)&&/classes\/"\+cid\+"\/plan/.test(BLK)&&/students\/"\+sid\+"\/settings/.test(BLK));
const hookLines=src.split("\n").filter(l=>l.indexOf(T)>=0&&l.indexOf("// CPLINCOLN_")<0);
ok("every hook line outside the block is tagged and typeof-guarded", hookLines.length>=11&&hookLines.every(l=>/typeof cpln\w+\s*===\s*"function"/.test(l)), hookLines.length);
const HOOKS=[["envmRelAttach","cplnLoad("],["envClassOverlay","cplnOverlay("],["cpReviewSession","cplnSession("],["mstMixOwns","cplnMixSkip("],["nbLoad","cplnLoadItems("],
  ["mastDueItems","cplnDrillMax("],["cpReviewLearnedAt","cplnLearnedAt("],["cpFinalPlan","cplnPlanRec("],["mhqSessOpen","cplnEditorForm("],["_mhqRenderSessForm","cplnEditorMark("],["mastAdminInit","cplnRaw("]];
HOOKS.forEach(h=>ok(h[0]+" carries its one hook ("+h[1]+")", fn(h[0]).split(h[1]).length===2));
ok("mastDueItems hands ENVDRILLFIRST his ceiling (no edit for anyone else: undefined → ENV_DRILL_MAX)", /envDrillJoin\(_env,l,\(typeof cplnDrillMax==="function"\)\?cplnDrillMax\(kid,ENV_DRILL_MAX\):undefined\)/.test(fn("mastDueItems"))&&/slice\(0,max==null\?ENV_DRILL_MAX:max\)/.test(fn("envDrillJoin")));
ok("the class-student test (cpReviewOn) is not widened", !/cpln/.test(fn("cpReviewOn")));
ok("the editor's labels the marks look for are the form's own", ["New/day","Passes","Cards a sitting","Decks at once","Learning pattern","Mix in at","Hand off at","Order"].every(l=>fn("_mhqRenderSessForm").indexOf("'\">"+l+"</div>")>=0||fn("_mhqRenderSessForm").indexOf("\">"+l+"</div>")>=0));

// ── the engine world: the REAL blocks and functions, sliced from index.html ──
const ENG=[
  constAt("ENV_UNIT_ID"),constAt("ENV_STAGES"),constAt("ENV_DECKS"),constAt("ENV_SESSION_SID"),constAt("ENV_SESSION"),fn("envCardsInCode"),
  constAt("MAST_TIER_ORDER"),constAt("MAST_TIER_INT"),constAt("MAST_MASTERY_TIER_DEFAULT"),constAt("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  cut("// ENVMIRROR_START","// ENVMIRROR_END"),"__BLK__",
  cut("// ENVCLASSSET_START","// ENVCLASSSET_END"),cut("// CPSEATS_START","// CPSEATS_END"),cut("// CPREVIEW_START","// CPREVIEW_END"),cut("// CPFINAL_START","// CPFINAL_END"),
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastGetCatMode","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","evo2LastTested"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),cut("// REVIEWENGINE_START","// REVIEWENGINE_END"),cut("// NEWBUDGET_START","// NEWBUDGET_END"),cut("// CPCORE_START","// CPCORE_END"),
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  'MST_PATTERN_MODES.push("pick"); MST_PATTERN_MODES.push("copy"); MST_PATTERN_MODES.push("ideas");',   // the app adds these further down (PATPICK, PATCCC, PATIDEAS)
  "const MAST_DEFAULT_CAT_MODES={};"].join("\n");
function world(o){
  o=o||{};
  const reads=[], writes=[], paints={n:0}, held=[];
  const edb={ref:p=>({once(ev,ok,bad){ reads.push(p); if(o.refuse&&o.refuse===p){ if(bad) bad(new Error("permission_denied")); return; } const v=(o.remote||{})[p]; if(o.hold){ held.push(()=>ok({val:()=>v===undefined?null:v})); return; } ok({val:()=>v===undefined?null:v}); },
    on(){}, off(){}, set(v){ writes.push(["set",p,v]); }, update(v){ writes.push(["update",p,v]); }, remove(){ writes.push(["remove",p]); }})};
  const ctx={console:{log(){},error(){},warn(){}},Object,Array,String,Number,Math,JSON,Date,Set,Map,WeakMap,Infinity,NaN,isNaN,parseInt,parseFloat,Promise,
    window:{HA_FAMILY:o.cfg===false?{familyId:"howe"}:{familyId:"howe",envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:"c1"}}},
    masteryData:o.M, unitStudies:o.U, masteryKid:"lincoln", db:null, HA_LS:{s:{},getItem(k){ return this.s[k]||null; },setItem(k,v){ this.s[k]=String(v); },removeItem(k){ delete this.s[k]; }},
    _dryRun:()=>false, renderAllSoon:()=>{ paints.n++; }, cap:s=>s[0].toUpperCase()+s.slice(1), gwShowToast(){}, setTimeout:()=>0, clearTimeout(){},
    envSiteOn:()=>!!o.site, envsDemo:()=>false, _envs:{kid:o.site?"lincoln":null,role:o.site?"kid":null,cls:null}, _envc:{}, envcOn:()=>false, envcAdmin:()=>false,
    mastIsNeverDrill:()=>false, mastDynamicShouldAdd:()=>false, mastDynamicShouldPrune:()=>false, mastDynamicEligible:()=>false, mastDynamicMark(){}, mastDynamicClear(){}, mastDynamicCapNotice:false,
    reads, writes, paints, held, edb};
  vm.createContext(ctx);
  vm.runInContext(ENG.replace("__BLK__",o.noBlock?"":BLK)+"\n;this.api={get _cpln(){ return typeof _cpln!=='undefined'?_cpln:null; }, _envm, ENVCS_FIELDS, ENV_DRILL_MAX};",ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  if(o.signedIn!==false) ctx.get("_envm.user={uid:'u1',email:'mom@x'}");
  return ctx;
}
// a Lincoln-shaped family. Other subjects: German (deck, budget fixed 5), Science (deck, budget pace), Daily Study (all, rest; Math kept with Mom),
// Daily Mix (finish 60). 🌿 Envirothon: the 15 real decks, a few cards each, half core.
const EDECKS=src.match(/\nconst ENV_DECKS=\[[\s\S]*?\];/)[0].match(/\["([^"]+)","(flip|flash|quiz)"/g).map(s=>s.match(/\["([^"]+)"/)[1]);
const OTHER=["German","Science","AAS Words","Math Facts","Vocabulary"];
function fixture(){
  const M={}, items=[], bank=[];
  OTHER.forEach((d,di)=>{ for(let i=0;i<60;i++){ bank.push({cat:d,name:d+" w"+i,def:"d"+i}); }
    for(let i=0;i<40;i++){ const tier=["every_other_day","weekly","bi_weekly","monthly","weekly"][i%5]; items.push({id:"lin|"+d+"|"+d+" w"+i,subject:d,type:d.toLowerCase(),prompt:d+" w"+i,answer:"d"+i,tier,status:"active",review_mode:"flash",next_due:400-(i%7)-di,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); } });
  EDECKS.forEach((d,di)=>{ for(let i=0;i<12;i++) bank.push({cat:d,name:d+" c"+i,def:"e"+i});
    for(let i=0;i<4;i++){ const tier=["weekly","bi_weekly","every_other_day","graduated"][i]; items.push({id:"lin|"+d+"|"+d+" c"+i,subject:d,type:"env",prompt:d+" c"+i,answer:"e"+i,tier,status:"active",review_mode:"flash",next_due:399-(i%3),drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); } });
  M.lincoln=items; M.lincoln_custom_items=bank;
  M.lincoln_settings={new_budget:20,intro_dots:4,ladder_streak:1,max_per_cat:5,max_intro_per_cat:3,cat_modes:{German:"flip"},cat_intro_max:Object.assign({German:4},Object.fromEntries(EDECKS.map(d=>[d,3]))),cat_intro_dots:{German:6},miss_drop:"reset",cat_hold:{}};
  M.lincoln_sessions={daily_mix:{name:"Daily Mix",kind:"mix",mixFinish:60},
    german:{name:"German",kind:"deck",decks:["German"],newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",maxCards:12,focusDecks:0,budgetRole:"fixed"},
    science:{name:"Science",kind:"deck",decks:["Science"],newPerDay:4,passes:2,mixInAt:"weekly",handOffAt:"monthly",budgetRole:"pace"},
    ds:{name:"Daily Study",kind:"all",skipDecks:["Math Facts"],newPerDay:6,passes:2,mixInAt:"every_other_day",handOffAt:"bi_weekly",maxCards:12,focusDecks:2,budgetRole:"rest"},
    envirothon:{name:"Envirothon",emoji:"🌿",kind:"deck",who:"solo",newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",order:"bank",maxCards:12,focusDecks:2,pattern:["pick","ideas","type"],decks:EDECKS.slice()}};
  M.studyLog={}; M.history={};
  const U={nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{lincoln:true},decks:EDECKS.map((k,i)=>({key:k,station:["general","forestry","soils","aquatic","wildlife"][Math.min(4,Math.floor(i/3))],cards:Array.from({length:12},(_,j)=>({name:k+" c"+j,def:"e"+j,core:j%2===0}))}))}};
  return {M,U};
}
const CLASS={ "classes/c1/settings":{study:{newPerDay:8,maxCards:"auto",passes:1,focusDecks:3,pattern:["pick","type"],coreFirst:"on",reviewCap:6,mixInAt:"monthly",handOffAt:"graduated"},
    drill:{intro_dots:3,max_intro_per_cat:2,cat_modes:{"Forestry · Terms":"quiz"},ladder_streak:5,miss_drop:"one",max_learn_per_drill:4}},
  "classes/c1/plan":{forestry:{finalAt:70,pass:75,retakeHours:12,checkin:false,learnedAt:"monthly"}},
  "students/howe_lincoln/settings":{study:{newPerDay:10}} };
function on(o){ const f=fixture(); const w=world(Object.assign({M:f.M,U:f.U,remote:CLASS},o||{})); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); return w; }
const J=x=>JSON.stringify(x);

console.log("2. Inert: every hook hands back what it was given");
{ const cases=[["no envirothon block in family-config",{cfg:false}],["signed out of the mirror",{signedIn:false}],["a read refused",{refuse:"classes/c1/plan"}],["the reads not all in yet",{hold:true}],["the class site itself",{site:true}],["no class read at all",{noLoad:true}]];
  cases.forEach(c=>{ (()=>{ const f=fixture(); const w=world(Object.assign({M:f.M,U:f.U,remote:CLASS},c[1])); if(!c[1].noLoad) w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')");
    const M=w.get("masteryData"), rec=M.lincoln_sessions.envirothon, st=M.lincoln_settings;
    ok(c[0]+": the overlay hands back his own 🌿 record (===) and his own drill settings (===)", (c[1].site||w.get("envClassOverlay('study','lincoln',masteryData.lincoln_sessions.envirothon)")===rec)&&w.get("cplnOverlay('drill','lincoln',masteryData.lincoln_settings)")===undefined&&(c[1].site||w.get("envClassOverlay('drill','lincoln',masteryData.lincoln_settings)")===st));
    if(c[1].site){ ok(c[0]+": L1 is off and every L1 hook hands back what it was given (the site's own layer runs)", !w.get("cplnOn('lincoln')")&&w.get("cplnSession('lincoln','envirothon',{},{})")===false&&w.get("(()=>{ const a=masteryData.lincoln; return cplnLoadItems('lincoln',a)===a; })()")&&w.get("cplnDrillMax('lincoln',15)")===15&&w.get("cplnPlanRec('lincoln','forestry')")===undefined&&w.get("cplnLearnedAt('lincoln','forestry')")===null&&w.reads.length===0); ok(c[0]+": nothing written", w.writes.length===0); return; }
    ok(c[0]+": no reviewIn, Mix keeps him, load array ===, ceiling 15, no plan", w.get("mstSessions('lincoln').find(s=>s.sid==='envirothon').reviewIn")===undefined&&!w.get("cplnMixSkip(mstSessions('lincoln').find(s=>s.sid==='envirothon'))")
      &&w.get("(()=>{ const a=masteryData.lincoln; return cplnLoadItems('lincoln',a)===a; })()")&&w.get("cplnDrillMax('lincoln',ENV_DRILL_MAX)")===15&&w.get("cplnPlanRec('lincoln','forestry')")===undefined&&w.get("cplnLearnedAt('lincoln','forestry')")===null);
    ok(c[0]+": nothing written", w.writes.length===0); })(); }); }
{ const f=fixture(); const w=world({M:f.M,U:f.U,remote:CLASS,cfg:false}); ok("no config: cplnLoad isn't even reached by the mirror (envmKids is empty)", w.get("envmKids().length")===0); }
{ const f=fixture(); const w=world({M:f.M,U:f.U,remote:CLASS}); const g=fixture(); g.U.nc_envirothon.enrolled={};
  const w2=world({M:g.M,U:g.U,remote:CLASS}); w2.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); ok("a kid not enrolled in the unit: off", !w2.get("cplnOn('lincoln')")); ok("another kid of the family: off", (w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"),!w.get("cplnOn('ellis')"))); }

console.log("3. The reads: once per class, nothing written");
{ const w=on(); ok("three once reads: the class's settings and plan, his override", J(w.reads)===J(["classes/c1/settings","classes/c1/plan","students/howe_lincoln/settings"]), w.reads);
  ok("on when all three are in; the arrival repaints once (renderAllSoon)", w.get("cplnOn('lincoln')")&&w.paints.n===1);
  w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); ok("asked again for the same class: no new read", w.reads.length===3);
  ok("nothing written anywhere", w.writes.length===0);
  const before=J(fixture().M); ok("his Howe records are exactly as they were (deep)", J(w.get("masteryData"))===before);
  w.get("_envm.user=null"); ok("the mirror signed out: off again, today's behaviour", !w.get("cplnOn('lincoln')")); }
{ const f=fixture(); const w=world({M:f.M,U:f.U,remote:CLASS,hold:true}); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')");
  ok("while the reads are on their way: off", !w.get("cplnOn('lincoln')")); w.held.forEach(g=>g()); ok("…on once the last one lands", w.get("cplnOn('lincoln')")); }
{ const f=fixture(); const w=world({M:f.M,U:f.U,remote:{}}); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); ok("an empty class (nothing saved) still counts as read: the site's defaults", w.get("cplnOn('lincoln')")); }

console.log("4. His 🌿 session follows the class, in memory");
{ const w=on(); const s=w.get("mstSessions('lincoln').find(s=>s.sid==='envirothon')");
  ok("New cards a day: his override (10) over the class (8)", s.newPerDay===10, s.newPerDay);
  ok("Cards a sitting Auto = 10 a day × the class's 3 days a card is learned = 30", s.maxCards===30, s.maxCards);
  ok("How cards are learned, Passes, Decks introducing at once: the class's", J(s.pattern)===J(["pick","type"])&&s.passes===1&&s.focusDecks===3, [s.pattern,s.passes,s.focusDecks]);
  ok("Core cards first → order \"core\" (CPCORE's own engine option)", s.order==="core");
  ok("reviews in the sitting, under the class's Reviews a sitting (6)", s.reviewIn==="sitting"&&s.reviewCap===6&&s.cplnClass===true);
  ok("the class's mix-in / hand-off are not brought (L1's list only)", s.mixInAt==="weekly"&&s.handOffAt==="bi_weekly");
  ok("his own record is untouched", J(w.get("masteryData.lincoln_sessions.envirothon"))===J(fixture().M.lincoln_sessions.envirothon));
  const others=w.get("mstSessions('lincoln').filter(s=>s.sid!=='envirothon')"); const f=fixture(); const w0=world({M:f.M,U:f.U,cfg:false});
  ok("every other session is exactly as without L1", J(others)===J(w0.get("mstSessions('lincoln').filter(s=>s.sid!=='envirothon')"))); }
{ const f=fixture(); const w=world({M:f.M,U:f.U,remote:{}}); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); const s=w.get("mstSessions('lincoln').find(s=>s.sid==='envirothon')");
  ok("a class with nothing saved: the site's defaults (5 a day, Auto 25, pick → ideas → type, 2 passes, 2 decks, core first, all reviews)", s.newPerDay===5&&s.maxCards===25&&J(s.pattern)===J(["pick","ideas","type"])&&s.passes===2&&s.focusDecks===2&&s.order==="core"&&s.reviewCap===0, s); }
{ const R=JSON.parse(J(CLASS)); R["classes/c1/settings"].study={newPerDay:999,maxCards:12,coreFirst:"off",pattern:["nope"]}; R["students/howe_lincoln/settings"]={};
  const f=fixture(); const w=world({M:f.M,U:f.U,remote:R}); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); const s=w.get("mstSessions('lincoln').find(s=>s.sid==='envirothon')");
  ok("a bad class value is skipped (999 a day → the default 5; a bad pattern → the default); a number of seats stays; In deck order → bank", s.newPerDay===5&&s.maxCards===12&&s.order==="bank"&&J(s.pattern)===J(["pick","ideas","type"]), s); }

console.log("5. His 15 decks' per-deck drill fields, nothing else");
{ const w=on(); const d=w.get("(()=>{ masteryKid='lincoln'; return mastDrillSettings(); })()"); const f=fixture(); const w0=world({M:f.M,U:f.U,cfg:false}); const d0=w0.get("(()=>{ masteryKid='lincoln'; return mastDrillSettings(); })()");
  const mode=k=>w.get("mastGetCatMode")("lincoln",k), mode0=k=>w0.get("mastGetCatMode")("lincoln",k);
  ok("How each deck shows: the class's (Forestry · Terms → quiz); the rest of the 15 their unit's own mode", mode("Forestry · Terms")==="quiz"&&mode("Forestry · Facts")==="flash"&&mode("General Concepts · Terms")==="flip");
  ok("…and every other deck's mode is Mom's (German flip, Science her default)", mode("German")==="flip"&&mode("German")===mode0("German")&&mode("Science")===mode0("Science"));
  { const o=w.get("envClassOverlay('drill','lincoln',masteryData.lincoln_settings)"), r=w.get("masteryData.lincoln_settings"), y=JSON.parse(J(o)), x=JSON.parse(J(r));
    ["cat_modes","cat_intro_max","cat_intro_dots"].forEach(k=>{ EDECKS.forEach(e=>{ if(y[k]) delete y[k][e]; if(x[k]) delete x[k][e]; }); if(y[k]&&!Object.keys(y[k]).length&&!x[k]) delete y[k]; });
    ok("the drill overlay is his own settings record plus those three per-deck maps on the 15 decks, nothing else", J(y)===J(x), [y,x]); }
  ok("New at once: the class's New per deck in a drill (2) on each of the 15", EDECKS.every(k=>d.cat_intro_max[k]===2));
  ok("Days a card is learned: the class's 3 on each of the 15 (cat_intro_dots)", EDECKS.every(k=>d.cat_intro_dots[k]===3)&&w.get("(()=>{ masteryKid='lincoln'; return mastIntroDotsFor('Soils and Land Use · ID'); })()")===3);
  const strip=x=>{ const y=JSON.parse(J(x)); ["cat_intro_max","cat_intro_dots"].forEach(k=>{ EDECKS.forEach(e=>{ delete y[k][e]; }); }); return y; };
  ok("everything else is Mom's, value for value: right in a row, a miss, the ladder, the limits, German's own numbers", J(strip(d))===J(strip(d0))&&d.ladder_streak===1&&d.miss_drop==="reset"&&d.max_learn_per_drill===0&&d.intro_dots===4&&d.cat_intro_max.German===4&&d.cat_intro_dots.German===6);
  ok("his own settings record untouched", J(w.get("masteryData.lincoln_settings"))===J(fixture().M.lincoln_settings));
  ok("Drill Rules opens on his own settings (cplnRaw), so its Save can't write the class's per-deck values", J(w.get("cplnRaw(()=>{ masteryKid='lincoln'; return mastDrillSettings(); })"))===J(d0)); }
{ const R=JSON.parse(J(CLASS)); R["students/howe_lincoln/settings"]={drill:{cat_intro_max:{"Forestry · ID":5}}}; const f=fixture(); const w=world({M:f.M,U:f.U,remote:R}); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')");
  const d=w.get("(()=>{ masteryKid='lincoln'; return mastDrillSettings(); })()"); ok("his override for one deck beats the class's number", d.cat_intro_max["Forestry · ID"]===5&&d.cat_intro_max["Forestry · Terms"]===2); }

console.log("6. Mom's drill: ENV_DRILL_MAX becomes the class's Reviews a sitting");
// what still reaches her drill: a deck she keeps out of his 🌿 session (or a card she pulls by hand). Here: Wildlife · ID, 20 due.
{ const mk=(cap,off)=>{ const f=fixture(), WID="Wildlife · ID"; f.M.lincoln_sessions.envirothon.decks=EDECKS.filter(d=>d!==WID); f.M.lincoln=f.M.lincoln.filter(i=>i.subject!==WID);
    for(let i=0;i<20;i++) f.M.lincoln.push({id:"lin|"+WID+"|w"+i,subject:WID,prompt:"w"+i,answer:"a",tier:"bi_weekly",status:"active",review_mode:"flash",next_due:390,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0});
    const R=JSON.parse(J(CLASS)); R["classes/c1/settings"].study.reviewCap=cap;
    const w=world({M:f.M,U:f.U,remote:R,cfg:off?false:undefined}); w.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); const due=w.get("mastDueItems('lincoln',420)"); return {env:due.filter(i=>EDECKS.indexOf(i.subject)>=0).length,rest:due.filter(i=>EDECKS.indexOf(i.subject)<0).map(i=>i.id)}; };
  const a=mk(6), b=mk(0), c=mk(6,true);
  ok("Reviews a sitting 6 → at most 6 Envirothon cards up front", a.env===6, a.env); ok("0 → no ceiling (all 20)", b.env===20, b.env); ok("L1 off → today's 15", c.env===15, c.env);
  ok("his other subjects' drill is the same list in each case", J(a.rest)===J(c.rest)&&J(b.rest)===J(c.rest)); }

console.log("7. His check-ins and finals: the class's section plan");
{ const w=on(); const p=w.get("cpFinalPlan('lincoln','forestry')");
  ok("Forestry: final at 70 %, pass 75 %, retake after 12 h, no check-in", p&&p.finalAt===70&&p.pass===75&&p.retakeHours===12&&p.checkin===false, p);
  ok("a section with no plan reads the defaults (85 · 80 · 24 h · check-in on)", J(w.get("cpFinalPlan('lincoln','soils')"))===J({finalAt:85,pass:80,retakeHours:24,checkin:true,learnedAt:"bi_weekly"}));
  ok("learned at: the plan's (monthly), else every 2 weeks", w.get("cpReviewLearnedAt('lincoln','forestry')")==="monthly"&&w.get("cpReviewLearnedAt('lincoln','soils')")==="bi_weekly");
  ok("the parent / teacher drills and the watch stay off for him (cpReviewOn false)", w.get("cpReviewOn('lincoln')")===false); }

console.log("8. Mastery HQ ▸ Sessions: his editor");
{ const w=on(); const form=w.get("cplnEditorForm('lincoln','envirothon',{newPerDay:10,maxCards:30,order:'core'})");
  ok("opens on HIS record (5 a day, 12 a sitting, bank), so a Save keeps her numbers", form.newPerDay===5&&form.maxCards===12&&form.order==="bank"&&form.passes===2&&J(form.pattern)===J(["pick","ideas","type"]));
  const other={newPerDay:5}; ok("any other session's form is handed back as is", w.get("(f=>cplnEditorForm('lincoln','german',f))")(other)===other);
  const H='<div style="x"><div style="l">New/day</div>S<div style="l">Passes</div>S<div style="l">Cards a sitting</div>S<div style="l">Decks at once</div>S<div style="l">Learning pattern</div>S<div style="l">Mix in at</div>S<div style="l">Hand off at</div>S<div style="l">Order</div>S</div>';
  const m=w.get("(h=>cplnEditorMark('lincoln','envirothon',h))")(H);
  ok("\"⚙️ set by the class\" on each field the class sets, with the value he gets", (m.match(/data-cpln="class"/g)||[]).length===8&&/New\/day <span[^>]*>⚙️ set by the class: 10</.test(m)&&/Cards a sitting <span[^>]*>⚙️ set by the class: 30</.test(m)&&/Order <span[^>]*>⚙️ set by the class: core cards first</.test(m)&&/every review in the 🌿 sitting \(6 a sitting\)/.test(m), m.slice(0,300));
  ok("one line on top: her numbers are kept and come back if he leaves the class", /data-cpln="note"/.test(m)&&/come back if he leaves the class/.test(m));
  ok("not his 🌿 session, or L1 off: the form's HTML comes back as it was", w.get("(h=>cplnEditorMark('lincoln','german',h))")(H)===H&&world({M:fixture().M,U:fixture().U,cfg:false}).get("(h=>cplnEditorMark('lincoln','envirothon',h))")(H)===H); }

console.log("9. THE REPLAY: 60 school days, three worlds");
// one school day, the way he works through it: 🌿 (Keep going to the end), German, Science, Daily Study, the whole Daily Mix, Mom's drill.
function study(w,sid,pn,until){ const out=[]; let log={items:[]}; for(let k=0;k<50;k++){
    const pile=w.get("mstPile")("lincoln",sid,pn,log); out.push(pile);
    const n=(pile.reviews||[]).length+(pile.learning||[]).length+(pile.newNames||[]).length; if(!n) break;
    w.get("masteryKid='lincoln'"); const items=w.get("masteryData.lincoln"), scores={};
    pile.reviews.forEach(i=>{ scores[i.id]="c"; }); pile.learning.forEach(i=>{ scores[i.id]="shown"; });
    pile.newNames.forEach(x=>{ const id="lin|"+x.deck+"|"+x.name; items.push({id,subject:x.deck,type:x.deck.toLowerCase(),prompt:x.name,tier:"daily",review_mode:"flash",status:"introduction",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); scores[id]="shown"; });
    w.get("mastApplyScores")(items,Object.keys(scores).map(id=>({id})),scores,pn,w.get("mastDrillSettings()"),{prevShown:new Set(),autoPull:false,chain:false});
    Object.keys(scores).forEach(id=>{ const it=items.find(i=>i.id===id); log.items.push({id,result:scores[id]==="shown"?"shown":"c",name:it?it.prompt:undefined}); });
    if(!until||!(pile.reviewLeft>pile.reviews.length||pile.mixLeft>pile.reviews.length)) break; }
  return out; }
function drill(w,pn){ w.get("masteryKid='lincoln'"); const due=w.get("mastDueItems('lincoln',"+pn+")"), items=w.get("masteryData.lincoln"), scores={}; due.forEach(i=>{ scores[i.id]="c"; });
  w.get("mastApplyScores")(items,due.map(i=>({id:i.id})),scores,pn,w.get("mastDrillSettings()"),{autoPull:false,chain:false}); return due; }
const isEnv=x=>EDECKS.indexOf(x&&(x.subject||x.deck))>=0;
const noEnvPile=p=>({reviews:(p.reviews||[]).filter(i=>!isEnv(i)),learning:(p.learning||[]).filter(i=>!isEnv(i)),newNames:(p.newNames||[]).filter(i=>!isEnv(i))});
function day(w,pn){
  const r={};
  r.spread=w.get("rePlan")("lincoln",w.get("masteryData.lincoln"),pn,pn).plan.filter(x=>!isEnv(x.it)).map(x=>[x.it.id,x.day]);
  r.budget=w.get("nbPlan")("lincoln",pn);
  r.loadOther=Math.round(w.get("masteryData.lincoln").filter(i=>!isEnv(i)&&i.status==="active").reduce((s,i)=>s+(w.get("MAST_TIER_INT")[i.tier||"daily"]?1/w.get("MAST_TIER_INT")[i.tier||"daily"]:0),0));
  r.env=study(w,"envirothon",pn,true);
  r.german=study(w,"german",pn); r.science=study(w,"science",pn); r.ds=study(w,"ds",pn);
  r.mix=study(w,"daily_mix",pn,true);
  r.drill=drill(w,pn);
  r.other=J(w.get("masteryData.lincoln").filter(i=>!isEnv(i)).sort((a,b)=>a.id<b.id?-1:1));
  return r; }
// Her yes 2026-10-29 ("Accept the shift"): Howe's day-picker (mastStampNextDue) books a graded card on the emptiest day of its rung,
// counting every subject's cards there, in the order they're graded. So when his Envirothon cards move differently, or the Mix's order
// changes (a), his other cards can land a day or few apart, inside the slack Howe already allows. The replay therefore pins:
//   · the RULES are the same: on the very same records, every engine output for his other subjects is identical with L1 on and off;
//   · the slack holds in both worlds: every other card graded is booked inside its rung's window, none is ever left due, none is lost;
//   · (a) and (b) exactly; inert = the block cut out, byte for byte; his Envirothon keeps coming and none of it drops out.
const SLACK=iv=>Math.min(Math.floor(iv/2),7);
function sameState(w,pn){
  const run=()=>{ const r={}; ["german","science","ds"].forEach(k=>{ r[k]=w.get("mstPile")("lincoln",k,pn,null); });
    r.drill=w.get("mastDueItems")("lincoln",pn).filter(i=>!isEnv(i)).map(i=>i.id);
    r.spread=w.get("rePlan")("lincoln",w.get("masteryData.lincoln"),pn,pn).plan.filter(x=>!isEnv(x.it)).map(x=>[x.it.id,x.day]);
    r.mix=w.get(`(()=>{ masteryKid='lincoln'; const S=mstSessions('lincoln'), L=mastDrillSettings().ladder; return masteryData.lincoln.filter(i=>mstMixOwns(S,i,L)&&mastIsDue(i,${pn})).map(i=>i.id); })()`);
    r.budget=w.get("nbPlan")("lincoln",pn); return r; };
  const on=run(), off=w.get("cplnRaw")(run); return {on,off}; }
const N=60, P0=400, f1=fixture(), f2=fixture(), f3=fixture();
const W0=world({M:f1.M,U:f1.U,remote:CLASS,noBlock:true}), W1=world({M:f2.M,U:f2.U,remote:CLASS,cfg:false}), W2=world({M:f3.M,U:f3.U,remote:CLASS}); W2.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')");
ok("the replay's L1 world is on, the inert one is off", W2.get("cplnOn('lincoln')")&&!W1.get("cplnOn('lincoln')"));
const bad={inert:[],rules:[],mixA:[],budgetB:[],slack:[],leftDue:[],lost:[],envNew:0,envNewOff:0,envOwned:[],mixEnv:0,mixEnvOff:0,capHeld:0,levelSame:0,moved:0,shifted:0,cardDays:0,hist:{}};
const snapNd=w=>{ const m={}; w.get("masteryData.lincoln").forEach(i=>{ if(!isEnv(i)) m[i.id]=i.next_due; }); return m; };
for(let d=0;d<N;d++){ const pn=P0+d;
  // the rules, on the same records (L1's world, before the day's work)
  const S=sameState(W2,pn), A=S.off.budget, B=S.on.budget;
  const lvl=!!(A&&B&&A.level===B.level); if(lvl) bad.levelSame++;
  if(lvl&&(J(S.on.german)!==J(S.off.german)||J(S.on.science)!==J(S.off.science)||J(S.on.ds)!==J(S.off.ds))) bad.rules.push([pn,"sittings"]);
  if(J(S.on.drill)!==J(S.off.drill)) bad.rules.push([pn,"drill"]);
  if(J(S.on.spread)!==J(S.off.spread)) bad.rules.push([pn,"spread"]);
  // (a) the Mix holds the same other cards, minus the Envirothon ones
  const offOther=S.off.mix.filter(id=>!isEnv({subject:id.split("|")[1]}));
  if(J(S.on.mix.slice().sort())!==J(offOther.slice().sort())) bad.mixA.push(pn);
  bad.mixEnv+=S.on.mix.length-S.on.mix.filter(id=>!isEnv({subject:id.split("|")[1]})).length; bad.mixEnvOff+=S.off.mix.length-offOther.length;
  // (b) the load is his other subjects' alone; nothing else in the budget moves
  const loadOther=Math.round(W2.get("masteryData.lincoln").filter(i=>!isEnv(i)&&i.status==="active").reduce((s,i)=>{ const iv=W2.get("MAST_TIER_INT")[i.tier||"daily"]; return s+(iv?1/iv:0); },0));
  if(!(A&&B&&B.load===loadOther&&B.total===A.total&&(!lvl||J(B.by)===J(A.by)&&B.room===A.room&&B.used===A.used))) bad.budgetB.push([pn,B&&B.load,loadOther]);
  // the day, in all three worlds
  const n1=snapNd(W1), n2=snapNd(W2);
  const a=day(W0,pn), b=day(W1,pn), c=day(W2,pn);
  if(J(a)!==J(b)) bad.inert.push(pn);
  // the slack, in both worlds: every other card booked today sits inside its rung's window; none is left due; none is lost
  [[W1,n1,"off"],[W2,n2,"on"]].forEach(([w,before,tag])=>{ const IV=w.get("MAST_TIER_INT");
    w.get("masteryData.lincoln").forEach(i=>{ if(isEnv(i)) return; const iv=IV[i.tier||"daily"];
      if(i.next_due!==before[i.id]&&i.next_due!=null&&iv>1){ bad.moved++; if(!(i.next_due>=pn+iv&&i.next_due<=pn+iv+SLACK(iv))) bad.slack.push([tag,pn,i.id,i.tier,i.next_due]); }
      if(i.status==="active"&&w.get("mastIsDue")(i,pn)) bad.leftDue.push([tag,pn,i.id]); }); });
  const ids=w=>J(w.get("masteryData.lincoln").filter(i=>!isEnv(i)).map(i=>i.id).sort());
  if(ids(W1)!==ids(W2)) bad.lost.push(pn);
  { const m1={}; W1.get("masteryData.lincoln").forEach(i=>{ m1[i.id]=i; }); W2.get("masteryData.lincoln").forEach(i=>{ const o=m1[i.id]; if(isEnv(i)||!o) return; bad.cardDays++; if(o.next_due!==i.next_due){ bad.shifted++; const k=(o.next_due==null||i.next_due==null)?"rung":Math.abs(o.next_due-i.next_due); bad.hist[k]=(bad.hist[k]||0)+1; } }); }
  // his Envirothon keeps coming, and nothing drops out: every due Envirothon card below graduated is reviewed by the end of the day
  bad.envNew+=c.env.reduce((s,p)=>s+(p.newNames||[]).filter(isEnv).length,0); bad.envNewOff+=b.env.reduce((s,p)=>s+(p.newNames||[]).filter(isEnv).length,0);
  if(c.env[0].reviewCap>0&&c.env[0].reviewLeft>c.env[0].reviews.length) bad.capHeld++;
  const left=W2.get("masteryData.lincoln").filter(i=>isEnv(i)&&i.status==="active"&&i.tier!=="graduated"&&W2.get("mastIsDue")(i,pn));
  if(left.length) bad.envOwned.push([pn,left.length]); }
ok("inert = the block cut out: every pile, drill, budget, spread and card, byte for byte, "+N+" days", bad.inert.length===0, bad.inert);
ok("the rules are the same: on the same records, German, Science, Daily Study, Mom's drill and the spreading of his other decks are identical with L1 on and off, every day", bad.rules.length===0, bad.rules.slice(0,5));
ok("…and the budget's level matched, so the sittings were compared on all "+bad.levelSame+" days", bad.levelSame===N, bad.levelSame);
ok("(a) the Daily Mix: the same other cards, minus the Envirothon ones, every day", bad.mixA.length===0, bad.mixA);
ok("(a) …no Envirothon card in his Mix with L1 (there were "+bad.mixEnvOff+" across the days without it)", bad.mixEnv===0&&bad.mixEnvOff>0, [bad.mixEnv,bad.mixEnvOff]);
ok("(b) the budget: the load is his other subjects' alone, and every other number is the same at the same level", bad.budgetB.length===0, bad.budgetB.slice(0,3));
ok("the accepted shift is inside Howe's slack: every other card booked ("+bad.moved+" bookings) lands within its rung's window, with L1 and without", bad.slack.length===0&&bad.moved>0, bad.slack.slice(0,3));
ok("no other card is ever left due at the end of a day, and none is lost or added", bad.leftDue.length===0&&bad.lost.length===0, [bad.leftDue.slice(0,3),bad.lost.slice(0,3)]);
console.log("      the shift, measured: on "+bad.shifted+" of "+bad.cardDays+" card-days an other card's next day differs between the worlds; by how much: "+J(bad.hist)+" · Envirothon new cards "+bad.envNew+" with L1, "+bad.envNewOff+" without");
ok("his Envirothon keeps coming: at least as many new cards as today's 🌿 session gives ("+bad.envNew+" with L1, "+bad.envNewOff+" without)", bad.envNew>=bad.envNewOff&&bad.envNew>0, [bad.envNew,bad.envNewOff]);
ok("Reviews a sitting held a sitting to 6 on busy days, and Keep going reviewed the rest ("+bad.capHeld+" days)", bad.capHeld>0);
ok("nothing drops out: no due Envirothon card below graduated is left unreviewed at the end of any day", bad.envOwned.length===0, bad.envOwned.slice(0,3));
{ const S=W2.get("masteryData.lincoln").filter(isEnv), tiers={}; S.forEach(i=>{ tiers[i.tier]=(tiers[i.tier]||0)+1; });
  ok("his Envirothon cards climb in the sitting, past every 2 weeks", (tiers.monthly||0)+(tiers.graduated||0)>EDECKS.length, tiers); }
{ const f=fixture(); f.M.lincoln_settings.new_budget=20; const g=fixture();
  f.M.lincoln=f.M.lincoln.filter(isEnv); for(let i=0;i<100;i++) f.M.lincoln.push({id:"lin|German|g"+i,subject:"German",prompt:"g"+i,answer:"a",tier:"every_other_day",status:"active",review_mode:"flash",next_due:401,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0});   // 50 a day from German + 12 from Envirothon: over 60
  g.M.lincoln=f.M.lincoln.map(i=>Object.assign({},i));
  const wOn=world({M:f.M,U:f.U,remote:CLASS}); wOn.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); const wOff=world({M:g.M,U:g.U,remote:CLASS,cfg:false});
  const A=wOff.get("nbPlan('lincoln',400)"), B=wOn.get("nbPlan('lincoln',400)");
  ok("(b) where the Envirothon cards tipped the load over a line, leaving them out moves it back (the accepted effect)", B.load<A.load&&B.level!==A.level, [A.load,A.level,B.load,B.level]); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
