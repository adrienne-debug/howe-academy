/*
 * Node tests — 👩‍🏫 CPLINCOLNL3, L3 of the class platform (DESIGN_class_platform_2026-10-28.md §12.2, §13 row L3). Her words 2026-10-28:
 * "I would definitely love for the teacher grade drills for Lincoln to be sent to me so I can keep an eye on where he's at."
 *   · Where the block sits; every hook a typeof-guarded line; its only Howe writes are the claim (a transaction on
 *     mastery/<kid>_teacherDrills/<key>) and the targeted ladder fields of mastery/<kid>; never mastery/history.
 *   · Inert: no config, signed out, the class site, the listener refused → nothing read, written or drawn.
 *   · His pick: drillPick on the class project, Envirothon cards due today, most-missed first, sent only when it changed.
 *   · THE REPLAY on a Lincoln-shaped family (5 other subjects + the 15 real Envirothon decks), the REAL engine sliced from index.html
 *     (ENVMIRROR, CPLINCOLN, ENVCLASSSET, mastApplyScores, mastDrillSettings, mastStampNextDue …): a drill applies once, exactly as
 *     mastApplyScores grades it; a repeat (and a second device) doesn't apply twice; offline catch-up (drills waiting before the listener,
 *     and units not in yet); his other subjects untouched; nothing lands in history; a drill naming another deck is refused; dry run
 *     writes nothing; his summary's weak list counts the ✗; Mom's 👩‍🏫 list on the Units page.          run: node test_cp_lincoln_l3.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); if(j<0) throw new Error("missing "+b); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const constAt=n=>{ const i=src.indexOf("\nconst "+n+"="); if(i<0) throw new Error("missing const "+n); let d=0; for(let k=i+1;k<src.length;k++){ const c=src[k]; if(c==="["||c==="{"||c==="(") d++; else if(c==="]"||c==="}"||c===")") d--; else if(c===";"&&d===0) return src.slice(i+1,k+1); } };
const BLK=cut("// CPLINCOLNL3_START","// CPLINCOLNL3_END");
const T="// 👩‍🏫 CPLINCOLNL3";
const J=x=>JSON.stringify(x);
const tick=()=>new Promise(r=>setImmediate(r));

console.log("1. Where it sits and how it hooks");
ok("one marked block right after CPLINCOLN_END", src.indexOf("// CPLINCOLN_END\n// CPLINCOLNL3_START")>0&&src.split("// CPLINCOLNL3_START").length===2);
ok("her words, with the date", /I would definitely love for the teacher grade drills for Lincoln to be sent to me so I can keep an\s*\n\/\/ eye on where he's at/.test(BLK)&&/2026-10-28/.test(BLK));
const hookLines=src.split("\n").filter(l=>l.indexOf(T)>=0&&l.indexOf("// CPLINCOLNL3_")<0);
ok("four hook lines outside the block, each tagged and typeof-guarded", hookLines.length===4&&hookLines.every(l=>/^\s*if\(typeof cplnt\w+==="function"\)/.test(l)), hookLines.length);
[["envmPublishKid","cplntPickPub(kid,sid,_envm.edb,s)"],["envmRelAttach","cplntAttach(kid,cid,_envm.edb,_envm.subs,envmSid(kid))"],["envSummary","cplntMissBy(kid,M,missBy,isDeck)"],["renderUnitDetail","cplntUnitHtml(u,enrolledKids,isMom)"]]
  .forEach(h=>ok(h[0]+" carries its one hook", fn(h[0]).split(h[1]).length===2));
ok("the Units hook sits right after the station check-ins", /h\+=envtDetailHtml\(u,enrolledKids,isMom\);[^\n]*\n  if\(typeof cplntUnitHtml==="function"\) h\+=cplntUnitHtml\(u,enrolledKids,isMom\);/.test(src));
ok("the block's Howe writes: one transaction on mastery/<kid>_teacherDrills/<key>, one update of mastery/<kid>; nothing else on db",
  (BLK.match(/\bdb\.ref\(/g)||[]).length===2&&/db\.ref\("mastery\/"\+kid\+"_teacherDrills\/"\+id\)/.test(BLK)&&/db\.ref\("mastery\/"\+kid\)\.update\(upd\)/.test(BLK)&&!/\bdb\.ref\([^)]*\)\.(set|remove)\(/.test(BLK));
ok("never mastery/history (no path, no history record built)", !/mastery\/history|\.history\b/.test(BLK.replace(/^\/\/.*$/gm,"")));
ok("its class-project writes: drillPick only (set / remove)", (BLK.match(/edb\.ref\(/g)||[]).length===2&&/edb\.ref\("students\/"\+sid\+"\/drillPick"\)/.test(BLK)&&/edb\.ref\("drills\/"\+cid\+"\/"\+sid\)/.test(BLK));
ok("every db write waits on cplntLive (db && !dry run)", /function cplntLive\(\)\{ return typeof db!=="undefined"&&!!db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\); \}/.test(BLK)&&/if\(Object\.keys\(upd\)\.length&&cplntLive\(\)\) db\.ref/.test(BLK)&&/if\(!cplntLive\(\)\)\{   \/\/ \?dryrun=1/.test(BLK));
ok("grades through mastApplyScores on his drill settings, no auto-pull, no chaining", /mastApplyScores\(items,plan\.ids\.map\(id=>\(\{id\}\)\),plan\.scores,pn,mastDrillSettings\(\),\{prevShown:new Set\(\),autoPull:false,chain:false\}\)/.test(BLK));
ok("the site rules already let his mirror read drills/<cid>/<his sid> and write his drillPick (no rules change)", (()=>{ const R=JSON.parse(fs.readFileSync(path.join(__dirname,"envirothon","SITE_RULES.json"),"utf8")).rules;
  return /beginsWith\(root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)\.val\(\) \+ '_'\)/.test(R.drills.$cid.$sid[".read"])&&/beginsWith\(root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)\.val\(\) \+ '_'\)/.test(R.students.$sid.drillPick[".write"]); })());

// ── the engine world: the REAL blocks and functions, sliced from index.html ──
const ENG=[
  constAt("ENV_UNIT_ID"),constAt("ENV_STAGES"),constAt("ENV_DECKS"),constAt("ENV_SESSION_SID"),constAt("ENV_SESSION"),fn("envCardsInCode"),
  constAt("MAST_TIER_ORDER"),constAt("MAST_TIER_INT"),constAt("MAST_MASTERY_TIER_DEFAULT"),constAt("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  cut("// ENVMIRROR_START","// ENVMIRROR_END"),"__L1__","__BLK__",
  cut("// ENVCLASSSET_START","// ENVCLASSSET_END"),cut("// CPSEATS_START","// CPSEATS_END"),cut("// CPREVIEW_START","// CPREVIEW_END"),cut("// CPFINAL_START","// CPFINAL_END"),
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastGetCatMode","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","evo2LastTested"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),cut("// REVIEWENGINE_START","// REVIEWENGINE_END"),cut("// NEWBUDGET_START","// NEWBUDGET_END"),cut("// CPCORE_START","// CPCORE_END"),
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  'MST_PATTERN_MODES.push("pick"); MST_PATTERN_MODES.push("copy"); MST_PATTERN_MODES.push("ideas");',
  "const MAST_DEFAULT_CAT_MODES={};"].join("\n");
const L1=cut("// CPLINCOLN_START","// CPLINCOLN_END");
const PN=400;
function world(o){
  o=o||{};
  const remote=o.remote||{}, writes=[], ewrites=[], toasts=[], timers=[], subs={}, offs=[], store=Object.assign({},o.store||{});
  const edb={ref:p=>({
    once(ev,okf,bad){ const v=remote[p]; okf({val:()=>v===undefined?null:v}); },
    on(ev,f,bad){ if(o.refuse===p){ if(bad) bad(new Error("permission_denied")); return; } subs[p]=f; f({val:()=>remote[p]===undefined?null:remote[p]}); },
    off(ev,f){ offs.push(p); if(subs[p]===f) delete subs[p]; },
    set(v){ ewrites.push(["set",p,v]); return Promise.resolve(); }, update(v){ ewrites.push(["update",p,v]); return Promise.resolve(); }, remove(){ ewrites.push(["remove",p]); return Promise.resolve(); }})};
  const db={ref:p=>({
    transaction(f){ if(o.offline) return new Promise(()=>{}); const cur=store[p]===undefined?null:store[p], nv=f(cur); if(nv===undefined) return Promise.resolve({committed:false}); store[p]=JSON.parse(J(nv)); writes.push(["tx",p,nv]); return Promise.resolve({committed:true}); },
    update(v){ writes.push(["update",p,v]); return Promise.resolve(); }, set(v){ writes.push(["set",p,v]); return Promise.resolve(); }, remove(){ writes.push(["remove",p]); return Promise.resolve(); }})};
  const ctx={console:{log(){},error(){},warn(){}},Object,Array,String,Number,Math,JSON,Date,Set,Map,WeakMap,Infinity,NaN,isNaN,isFinite,parseInt,parseFloat,Promise,
    window:{HA_FAMILY:o.cfg===false?{familyId:"howe"}:{familyId:"howe",envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:"c1"}}},
    masteryData:o.M, unitStudies:o.U, masteryKid:"julian", db:o.noDb?null:db, HA_LS:{s:{},getItem(k){ return this.s[k]||null; },setItem(k,v){ this.s[k]=String(v); },removeItem(k){ delete this.s[k]; }},
    _dryRun:()=>!!o.dry, renderAllSoon(){}, cap:s=>s[0].toUpperCase()+s.slice(1), gwShowToast(m){ toasts.push(m); },
    setTimeout:(f,ms)=>{ timers.push(f); return timers.length; }, clearTimeout(){}, mastGetPrintNum:()=>PN,
    envSiteOn:()=>!!o.site, envsDemo:()=>false, _envs:{kid:null,role:null,cls:null}, _envc:{}, envcOn:()=>false, envcAdmin:()=>false,
    mastIsNeverDrill:()=>false, mastDynamicShouldAdd:()=>false, mastDynamicShouldPrune:()=>false, mastDynamicEligible:()=>false, mastDynamicMark(){}, mastDynamicClear(){}, mastDynamicCapNotice:false,
    writes, ewrites, toasts, timers, subs, offs, store, edb};
  if(o.unitsLater) ctx._haUnitsReady=false;
  vm.createContext(ctx);
  vm.runInContext(ENG.replace("__L1__",L1).replace("__BLK__",o.noBlock?"":BLK),ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  if(o.signedIn!==false){ ctx.get("_envm.user={uid:'u1',email:'mom@x'}"); ctx.get("_envm.edb=edb"); ctx.get("_envm.classOf.lincoln='c1'"); }
  return ctx;
}
const EDECKS=src.match(/\nconst ENV_DECKS=\[[\s\S]*?\];/)[0].match(/\["([^"]+)","(flip|flash|quiz)"/g).map(s=>s.match(/\["([^"]+)"/)[1]);
const OTHER=["German","Science","AAS Words","Math Facts","Vocabulary"];
function fixture(){
  const M={}, items=[], bank=[];
  OTHER.forEach((d,di)=>{ for(let i=0;i<40;i++){ const tier=["every_other_day","weekly","bi_weekly","monthly","weekly"][i%5]; items.push({id:"lin|"+d+"|"+d+" w"+i,subject:d,type:d.toLowerCase(),prompt:d+" w"+i,answer:"d"+i,tier,status:"active",review_mode:"flash",next_due:400-(i%7)-di,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); } });
  EDECKS.forEach((d,di)=>{ for(let i=0;i<12;i++) bank.push({cat:d,name:d+" c"+i,def:"e"+i});
    for(let i=0;i<4;i++){ const tier=["weekly","bi_weekly","every_other_day","graduated"][i]; items.push({id:"lin|"+d+"|"+d+" c"+i,subject:d,type:"env",prompt:d+" c"+i,answer:"e"+i,tier,status:"active",review_mode:"flash",next_due:399-(i%3),drop_count:i===1&&di===2?3:0,consecutive_correct:0,cycle:1,tally_dots:0}); } });
  items.push({id:"lin|"+EDECKS[0]+"|learning",subject:EDECKS[0],type:"env",prompt:EDECKS[0]+" c5",answer:"e5",tier:"daily",status:"introduction",review_mode:"flash",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:1});
  M.lincoln=items; M.lincoln_custom_items=bank;
  M.lincoln_settings={intro_dots:4,ladder_streak:1,max_per_cat:5,max_intro_per_cat:3,miss_drop:"reset",cat_hold:{}};
  M.lincoln_sessions={envirothon:{name:"Envirothon",emoji:"🌿",kind:"deck",who:"solo",newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",order:"bank",maxCards:12,focusDecks:2,pattern:["pick","ideas","type"],decks:EDECKS.slice()}};
  M.studyLog={}; M.history={lincoln:{"20261028":{date:"2026-10-28",printNum:399,total:3,scored:3,correct:3,miss:0,items:[{id:"lin|German|German w0",prompt:"German w0",result:"c",oldTier:"weekly"}]}}};
  M.ellis=[{id:"ell|x",subject:"Science",prompt:"x",tier:"weekly",status:"active",next_due:399}];
  const U={nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{lincoln:true},decks:EDECKS.map((k,i)=>({key:k,station:["general","forestry","soils","aquatic","wildlife"][Math.min(4,Math.floor(i/3))],cards:Array.from({length:12},(_,j)=>({name:k+" c"+j,def:"e"+j,core:j%2===0}))}))}};
  return {M,U};
}
const E0=EDECKS[0], E1=EDECKS[1], E2=EDECKS[2];
const D1={at:Date.parse("2026-10-27T15:00:00Z"),by:"t1",name:"Ms. Brittany",items:[{deck:E0,name:E0+" c0",r:"c"},{deck:E1,name:E1+" c1",r:"m"},{deck:E2,name:E2+" c2",r:"c"}]};
const D2={at:Date.parse("2026-10-28T15:00:00Z"),by:"t1",name:"Ms. Brittany",items:[{deck:E1,name:E1+" c0",r:"c"},{deck:E0,name:E0+" c5",r:"c"}]};   // E0 c5 is still learning: skipped
const PATH="drills/c1/howe_lincoln";
function on(o){ const f=fixture(); o=o||{}; const remote=Object.assign({"classes/c1/settings":{},"classes/c1/plan":{},"students/howe_lincoln/settings":{}},o.remote||{});
  const w=world(Object.assign({},o,{M:f.M,U:f.U,remote})); return w; }
const envIx=(M)=>{ const s=new Set(EDECKS); return M.lincoln.map((it,i)=>s.has(it.subject)?i:-1).filter(i=>i>=0); };
const otherOf=M=>J(M.lincoln.filter(i=>EDECKS.indexOf(i.subject)<0));

(async()=>{
console.log("2. Inert: nothing read, written or drawn");
for(const c of [["no envirothon block in family-config",{cfg:false}],["signed out of the mirror",{signedIn:false}],["the class site itself",{site:true}]]){
  const w=on(Object.assign({remote:{[PATH]:{d1:D1}}},c[1]));
  const before=J(w.get("masteryData"));
  ok(c[0]+": off; attach refuses; no listener", !w.get("cplntOn('lincoln')")&&w.get("cplntAttach('lincoln','c1',edb,_envm.subs,'howe_lincoln')")===false&&!w.subs[PATH]);
  ok(c[0]+": catch-up and the pick do nothing", w.get("cplntCatchUp('lincoln')")===0&&w.get("cplntPickPub('lincoln','howe_lincoln',edb)")===false);
  if(c[1].signedIn!==false) ok(c[0]+": the summary hook counts nothing (signed out it may: the summary isn't published then)", w.get("cplntMissBy('lincoln',{lincoln_teacherDrills:{d1:{items:[{deck:'"+E1+"',name:'x',r:'m'}]}}},{},{'"+E1+"':true})")===0);
  ok(c[0]+": the Units list draws nothing", w.get("cplntUnitHtml(unitStudies.nc_envirothon,['lincoln'],true)")==="");
  await tick();
  ok(c[0]+": nothing written anywhere, his records as they were", w.writes.length===0&&w.ewrites.length===0&&J(w.get("masteryData"))===before&&w.toasts.length===0); }
{ const f=fixture(), a=world({M:f.M,U:f.U,noBlock:true}), g=fixture(), b=world({M:g.M,U:g.U,cfg:false});
  ok("no config: envSummary is the same as with the block cut out", J(Object.assign(b.get("envSummary('lincoln',{now:1793000000000})"),{}))===J(a.get("envSummary('lincoln',{now:1793000000000})"))); }
{ const w=on({remote:{[PATH]:{d1:D1}},refuse:PATH}); w.get("envmRelAttach('lincoln')"); await tick();
  ok("the drills listener refused (rules / unreachable): nothing happens", !w.subs[PATH]&&w.writes.length===0&&w.toasts.length===0); }
{ const w=on({remote:{[PATH]:{d1:D1}}}); w.get("masteryData.lincoln_teacherDrills=undefined"); w.get("cplntAttach('ellis','c1',edb,_envm.subs,'howe_ellis')");
  ok("a kid this family doesn't mirror: off", !w.get("cplntOn('ellis')")&&!w.subs["drills/c1/howe_ellis"]); }

console.log("3. A drill applies once, exactly as mastApplyScores grades it");
{ const w=on({remote:{[PATH]:{d1:D1}}}); const M=w.get("masteryData");
  const beforeOther=otherOf(M), beforeHist=J(M.history), beforeSet=J(M.lincoln_settings), beforeSess=J(M.lincoln_sessions), beforeEllis=J(M.ellis);
  // expected: the same cards graded straight through mastApplyScores in a world without the block
  const g=fixture(), x=world({M:g.M,U:g.U,noBlock:true}); x.get("_envm.user=null");
  x.get("masteryKid='lincoln'"); x.get(`(()=>{ const items=masteryData.lincoln, ids=["lin|${E0}|${E0} c0","lin|${E1}|${E1} c1","lin|${E2}|${E2} c2"], sc={}; sc[ids[0]]="c"; sc[ids[1]]="m"; sc[ids[2]]="c";
    mastApplyScores(items,ids.map(id=>({id})),sc,${PN},mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false}); })()`);
  w.get("envmRelAttach('lincoln')"); await tick(); await tick();
  ok("the mirror's envmRelAttach starts the listener on drills/<cid>/<his sid>", typeof w.subs[PATH]==="function");
  const tx=w.writes.filter(r=>r[0]==="tx"), up=w.writes.filter(r=>r[0]==="update");
  ok("ONE claim: mastery/lincoln_teacherDrills/d1 = {at, teacher, items, right, n, graded}", tx.length===1&&tx[0][1]==="mastery/lincoln_teacherDrills/d1"&&J(tx[0][2])===J({at:D1.at,teacher:"Ms. Brittany",items:D1.items,right:2,n:3,graded:3}), tx);
  ok("ONE targeted update of mastery/lincoln, only the three graded cards' ladder fields", up.length===1&&up[0][1]==="mastery/lincoln"&&(()=>{ const ix=new Set(Object.keys(up[0][2]).map(k=>+k.split("/")[0])); const want=["lin|"+E0+"|"+E0+" c0","lin|"+E1+"|"+E1+" c1","lin|"+E2+"|"+E2+" c2"].map(id=>M.lincoln.findIndex(i=>i.id===id)); return ix.size===3&&want.every(i=>ix.has(i)); })()&&Object.keys(up[0][2]).every(k=>/^\d+\/(tier|consecutive_correct|cycle|drop_count|status|tally_dots|next_due|dynamic|dynSource|dynFromTier|dynAddedAt)$/.test(k)), up.map(u=>Object.keys(u[2])));
  const G=w.get("masteryData").lincoln, X=x.get("masteryData").lincoln;
  ok("each graded card lands exactly where mastApplyScores puts it (tier, next_due, streak, drops)", J(G)===J(X), G.filter((it,i)=>J(it)!==J(X[i])).slice(0,2));
  ok("…and the update carries those very values", Object.keys(up[0][2]).every(k=>{ const [i,f]=k.split("/"); const v=up[0][2][k], c=G[+i][f]; return v===c||(v===null&&c==null)||(f==="consecutive_correct"&&v===(c||0))||(f==="cycle"&&v===(c||1))||(f==="drop_count"&&v===(c||0)); }));
  ok("the ✗ card dropped (his miss rule), the ✓ cards climbed", G.find(i=>i.id==="lin|"+E1+"|"+E1+" c1").tier==="every_other_day"&&G.find(i=>i.id==="lin|"+E0+"|"+E0+" c0").tier==="bi_weekly"&&G.find(i=>i.id==="lin|"+E1+"|"+E1+" c1").drop_count===1);
  ok("his other subjects untouched: every non-Envirothon card, his settings, his sessions, another kid", otherOf(w.get("masteryData"))===beforeOther&&J(w.get("masteryData").lincoln_settings)===beforeSet&&J(w.get("masteryData").lincoln_sessions)===beforeSess&&J(w.get("masteryData").ellis)===beforeEllis);
  ok("nothing lands in history: no write path names it, masteryData.history byte-identical", w.writes.every(r=>!/history/.test(r[1]))&&J(w.get("masteryData").history)===beforeHist);
  ok("the notice: \"🌿 Ms. Brittany drilled Lincoln: 2 of 3 · missed '…'\" (toast + the Settings card's notices)", w.toasts.length===1&&w.toasts[0]==="🌿 Ms. Brittany drilled Lincoln: 2 of 3 · missed '"+E1+" c1'"&&w.get("_envm.notices[0].msg")===w.toasts[0], w.toasts);
  ok("his drillPick goes to the class project (≤5, Envirothon fronts only)", (()=>{ const p=w.ewrites.filter(r=>r[1]==="students/howe_lincoln/drillPick"); return p.length>=1&&p.every(r=>r[0]==="set"&&r[2].length<=5&&r[2].every(c=>EDECKS.indexOf(c.deck)>=0&&Object.keys(c).join()==="deck,name")); })(), w.ewrites.map(r=>r[1]));
  // the repeat: the listener fires again with the same drill; masteryData now holds the record
  const n0=w.writes.length; w.subs[PATH]({val:()=>({d1:D1})}); await tick(); await tick();
  ok("a repeat delivery doesn't apply twice (no claim, no grade, no notice)", w.writes.length===n0&&w.toasts.length===1);
  // the mastery listener replaces masteryData with the server copy (which carries the claim): still once
  const snap=JSON.parse(J(w.get("masteryData"))); w.get("masteryData="+J(snap)); w.subs[PATH]({val:()=>({d1:D1})}); await tick();
  ok("…nor after masteryData is replaced by the server copy", w.writes.length===n0);
  // a new drill arrives later
  w.subs[PATH]({val:()=>({d1:D1,d2:D2})}); await tick(); await tick();
  const tx2=w.writes.filter(r=>r[0]==="tx");
  ok("the next drill applies once; a card still learning is skipped (graded 1 of 2)", tx2.length===2&&tx2[1][1]==="mastery/lincoln_teacherDrills/d2"&&tx2[1][2].graded===1&&tx2[1][2].right===2&&w.get("masteryData").lincoln.find(i=>i.prompt===E0+" c5").status==="introduction"); }

console.log("4. A second device, offline catch-up");
{ const w=on({remote:{[PATH]:{d1:D1}},store:{"mastery/lincoln_teacherDrills/d1":{at:D1.at,n:3}}}); const before=J(w.get("masteryData").lincoln);
  w.get("envmRelAttach('lincoln')"); await tick(); await tick();
  ok("another device already claimed it (its record not here yet): the transaction aborts, nothing graded", w.writes.length===0&&J(w.get("masteryData").lincoln)===before&&w.toasts.length===0); }
{ const w=on({remote:{[PATH]:{d2:D2,d1:D1}}}); w.get("envmRelAttach('lincoln')"); await tick(); await tick();
  const tx=w.writes.filter(r=>r[0]==="tx");
  ok("offline catch-up: two drills waiting when Howe opens both apply, oldest first, once each", tx.length===2&&tx[0][1].endsWith("/d1")&&tx[1][1].endsWith("/d2")&&w.writes.filter(r=>r[0]==="update").length===2&&w.toasts.length===2); }
{ const w=on({remote:{[PATH]:{d1:D1}},unitsLater:true}); w.get("envmRelAttach('lincoln')"); await tick();
  ok("the units not in yet: nothing applied, one retry timer", w.writes.length===0&&w.timers.length>=1);
  w.get("_haUnitsReady=true"); w.timers.shift()(); await tick(); await tick();
  ok("…they arrive: the waiting drill applies once", w.writes.filter(r=>r[0]==="tx").length===1&&w.writes.filter(r=>r[0]==="update").length===1); }
{ const w=on({remote:{[PATH]:{d1:D1}},offline:true}); w.get("envmRelAttach('lincoln')"); await tick();
  ok("the claim can't reach the server (offline): nothing graded, and it isn't tried twice meanwhile", w.writes.length===0&&w.get("Object.keys(_cplnt.busy).join()")==="d1"&&(w.subs[PATH]({val:()=>({d1:D1})}),w.writes.length===0)); }
{ const w=on({remote:{[PATH]:{d1:D1}}}); w.get("envmRelAttach('lincoln')"); await tick(); await tick(); w.get("_envm.user=null"); w.get("envmDetach()");
  ok("the mirror signs out: the drills listener comes off", w.offs.indexOf(PATH)>=0&&!w.get("cplntOn('lincoln')")); }

console.log("5. Only Envirothon cards can be graded");
for(const c of [["a drill naming another deck (German)",{at:1,name:"Ms. Brittany",items:[{deck:"German",name:"German w1",r:"m"}]}],
  ["a drill mixing an Envirothon card with another deck",{at:2,name:"Ms. Brittany",items:[{deck:E0,name:E0+" c0",r:"c"},{deck:"Science",name:"Science w2",r:"c"}]}],
  ["a drill with no cards",{at:3,name:"x",items:[]}],["a drill with more than 5 cards",{at:4,items:Array.from({length:6},(_,i)=>({deck:E0,name:E0+" c"+i,r:"c"}))}],["a card with no ✓ / ✗",{at:5,items:[{deck:E0,name:E0+" c0",r:"?"}]}]]){
  const w=on({remote:{[PATH]:{bad:c[1]}}}); const before=J(w.get("masteryData"));
  w.get("envmRelAttach('lincoln')"); await tick(); await tick(); w.subs[PATH]({val:()=>({bad:c[1]})}); await tick();
  ok(c[0]+": refused, nothing graded or written, his records as they were", w.writes.length===0&&J(w.get("masteryData"))===before);
  ok(c[0]+": one notice saying it wasn't applied, and Mom's list shows it", w.toasts.length===1&&/was not applied/.test(w.toasts[0])&&/data-cplnt="refused"/.test(w.get("cplntUnitHtml(unitStudies.nc_envirothon,['lincoln'],true)")), w.toasts); }
{ const w=on({remote:{[PATH]:{"a/b":D1}}}); w.get("envmRelAttach('lincoln')"); await tick(); ok("a key that isn't a plain id is never used as a path", w.writes.length===0); }

console.log("6. Dry run, the summary, the pick");
{ const w=on({remote:{[PATH]:{d1:D1}},dry:true}); w.get("envmRelAttach('lincoln')"); await tick();
  ok("?dryrun=1: graded in memory so she can watch it, nothing written to Howe or the class project", w.writes.length===0&&w.ewrites.length===0&&w.get("masteryData").lincoln.find(i=>i.id==="lin|"+E0+"|"+E0+" c0").tier==="bi_weekly"&&!!w.get("masteryData").lincoln_teacherDrills.d1&&/\(dry run: nothing saved\)$/.test(w.toasts[0]||""), w.toasts); }
{ const w=on({remote:{[PATH]:{d1:D1}}}); const s0=w.get("envSummary('lincoln',{now:1793000000000})");
  w.get("envmRelAttach('lincoln')"); await tick(); await tick(); const s1=w.get("envSummary('lincoln',{now:1793000000000})");
  const row=(s1.weak[E1]||[]).find(r=>r.n===E1+" c1");
  ok("his summary's weak list counts the teacher's ✗ (m 1, and the drop)", !((s0.weak[E1]||[]).some(r=>r.n===E1+" c1"))&&row&&row.m===1&&row.d===1, row);
  ok("…and nothing else in the summary moves but that card's ladder counts", J(s0.days)===J(s1.days)&&J(s0.streak)===J(s1.streak)); }
{ const w=on(); const p=w.get("cplntPick('lincoln')");
  ok("the pick: 5 Envirothon cards due today, the most-missed first", p.length===5&&p.every(c=>EDECKS.indexOf(c.deck)>=0)&&p[0].deck===E2&&p[0].name===E2+" c1", p);
  w.get("masteryData.lincoln_settings.cat_hold={'"+E2+"':true}"); ok("…a held deck's cards are left out", w.get("cplntPick('lincoln')").every(c=>c.deck!==E2));
  w.get("masteryData.lincoln_settings.cat_hold={}");
  ok("sent once, not again while it's the same", w.get("cplntPickPub('lincoln','howe_lincoln',edb)")===true&&w.get("cplntPickPub('lincoln','howe_lincoln',edb)")===false&&w.ewrites.filter(r=>r[1]==="students/howe_lincoln/drillPick").length===1);
  w.get("HA_LS.s={}"); w.get("envmPublishKid('lincoln',true)"); ok("rides along with the mirror's summary publish", w.ewrites.filter(r=>r[1]==="students/howe_lincoln/drillPick").length===2&&w.ewrites.some(r=>r[1]==="students/howe_lincoln"&&r[0]==="update"));
  w.get("HA_LS.s={}"); w.get("_envm.locked=true"); ok("the season locked: no pick sent", w.get("cplntPickPub('lincoln','howe_lincoln',edb)")===false); }
{ const w=on({dry:true}); ok("dry run: no pick sent", w.get("cplntPickPub('lincoln','howe_lincoln',edb)")===false&&w.ewrites.length===0); }

console.log("7. Mom's 👩‍🏫 Teacher drills list on the Units page");
{ const w=on({remote:{[PATH]:{d1:D1,d2:D2}}}); w.get("envmRelAttach('lincoln')"); await tick(); await tick();
  const h=w.get("cplntUnitHtml(unitStudies.nc_envirothon,['lincoln'],true)");
  ok("Mom sees \"Lincoln's teacher drills\" with a month line", /Lincoln’s teacher drills/.test(h)&&/data-cplnt="month"[^>]*>October: 2 drills · 5 cards · 80% right</.test(h), h.slice(0,600));
  ok("newest first: date, teacher, \"N of M right\", the missed fronts in red", (()=>{ const rows=h.split('data-cplnt="row"').slice(1); return rows.length===2&&/2 of 2 right/.test(rows[0])&&/2 of 3 right/.test(rows[1])&&/Ms\. Brittany/.test(rows[1])&&new RegExp('color:#b91c1c;font-weight:700">'+E1.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+' c1<').test(rows[1]); })());
  ok("tap a row for every card, with ✓ / ✗ and a line when a card couldn't move", /<details data-cplnt="row"/.test(h)&&(h.match(/>✓</g)||[]).length===4&&(h.match(/>✗</g)||[]).length===1&&/wasn’t an active card of his yet/.test(h));
  ok("not Mom: nothing", w.get("cplntUnitHtml(unitStudies.nc_envirothon,['lincoln'],false)")==="");
  ok("another unit's page: nothing", w.get("cplntUnitHtml({id:'word_roots'},['lincoln'],true)")===""); }
{ const w=on(); ok("signed in, no drills yet: Mom sees that it's waiting for one", /None yet/.test(w.get("cplntUnitHtml(unitStudies.nc_envirothon,['lincoln'],true)"))); }
{ const w=on({remote:{[PATH]:{d1:D1}}}); w.get("envmRelAttach('lincoln')"); await tick(); await tick(); w.get("_envm.user=null");
  ok("the records stay readable on her devices even when this one's mirror is signed out", /2 of 3 right/.test(w.get("cplntUnitHtml(unitStudies.nc_envirothon,['lincoln'],true)"))); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
})().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
