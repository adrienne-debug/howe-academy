/*
 * Node tests — 🎯 CPTESTPREP: every learned (graduated) Envirothon card comes back ONCE in the 🌿 sitting in the weeks before the class's
 * next goal date. Her answer 2026-11-17 to "Build a 'before the test' pass that brings every graduated card back once?": "Yes, build it".
 *   · Where the block sits; every hook a typeof-guarded line; the block's only read is classes/<cid>/goals; the settings row by name.
 *   · Inert (no goal date, the setting at 0, outside the window, another session / kid / family): the pile and the save's writes are
 *     byte-identical to the block cut out (= main).
 *   · The window's first and last day; the daily share over the window with skipped days; each card once per goal date; right stays
 *     graduated + prep; a miss follows miss_drop ("reset" and "one") + prep; hidden / Off-section / parked / non-Envirothon cards never come;
 *     longest unseen first; Lincoln's mirror (the goals read, his class's value + his override); the class site (school days only);
 *     ?dryrun=1 writes nothing (the app's own db.ref patch); no whole-node write; the one line on the 🌿 start card.
 * Runs the REAL engine sliced from the page: mstSessions, mstPile, mstSittingInit / mstAnswer / mstOutcomes, mastApplyScores and
 * _mstSaveInner.                                                                                         run: node test_cp_testprep.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); if(j<0) throw new Error("missing "+b); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const constAt=n=>{ const i=src.indexOf("\nconst "+n+"="); if(i<0) throw new Error("missing const "+n); let d=0; for(let k=i+1;k<src.length;k++){ const c=src[k]; if(c==="["||c==="{"||c==="(") d++; else if(c==="]"||c==="}"||c===")") d--; else if(c===";"&&d===0) return src.slice(i+1,k+1); } };
const BLK=cut("// CPTESTPREP_START","// CPTESTPREP_END");
const T="// 🎯 CPTESTPREP";
const J=x=>JSON.stringify(x);

console.log("1. Where it sits and how it hooks");
ok("one marked block right after CPSPECIALIST_END, just before the study engine it hooks (classes.js; its marker after CPSPECIALIST's in index.html)",
  src.indexOf("// CPSPECIALIST_END\n// CPTESTPREP_START")>0&&src.indexOf("// CPTESTPREP_END\n// ── MST_ENGINE_START ──")>0&&fs.readFileSync(path.join(__dirname,"index.html"),"utf8").indexOf("// ⇢ classes.js: CPSPECIALIST\n// ⇢ classes.js: CPTESTPREP\n")>0);
ok("her answer and the date are in the block", /2026-11-17/.test(BLK)&&/Yes, build it/.test(BLK));
const CODE=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).map(l=>l.replace(/\s\/\/ .*$/,"")).join("\n");
ok("the block writes nothing: no set / update / remove / transaction, no db, no storage (code lines)", !/\.(set|update|remove|transaction)\(/.test(CODE)&&!/\bdb\b/.test(CODE)&&!/HA_LS|localStorage/.test(CODE));
ok("its only read is ONE .once of classes/<cid>/goals", (BLK.match(/\.once\(/g)||[]).length===1&&/edb\.ref\("classes\/"\+cid\+"\/goals"\)\.once\(/.test(BLK));
const hookLines=src.split("\n").filter(l=>l.indexOf(T)>=0&&l.indexOf("// CPTESTPREP_")<0);
ok("every hook line outside the block is tagged and typeof-guarded (or rides the guarded result)", hookLines.length===5&&hookLines.every(l=>/typeof cpprep\w+\s*===\s*"function"|_tp&&_tp\.indexOf/.test(l)), hookLines);
[["mstPile","cpprepPick("],["_mstSaveInner","cpprepStamp("],["renderMastStudy","cpprepStartHtml("],["envmRelAttach","cpprepLoad("]].forEach(h=>ok(h[0]+" carries its one hook ("+h[1]+")", fn(h[0]).split(h[1]).length===2));
ok("the save writes the stamp inside its own targeted update, only for the cards the hook stamped", /if\(_tp&&_tp\.indexOf\(it\)>=0\) upd\[ix\+"\/prep"\]=it\.prep;/.test(fn("_mstSaveInner"))&&fn("_mstSaveInner").indexOf("cpprepStamp(")<fn("_mstSaveInner").indexOf('upd[ix+"/prep"]'));
ok("the stamp hook runs after the grading (mastApplyScores) and before the update is built", fn("_mstSaveInner").indexOf("mastApplyScores(")<fn("_mstSaveInner").indexOf("cpprepStamp(")&&fn("_mstSaveInner").indexOf("cpprepStamp(")<fn("_mstSaveInner").indexOf("const upd={}"));
ok("the ENVCS_FIELDS literal in env.js is untouched (the row is added by name from the block)", !/prepDays/.test(constAt("ENVCS_FIELDS")));
ok("the pile's own two returns are unchanged (the hook returns only when it has cards)", /if \(typeof cpReviewCapPile === "function" && session\.reviewCap > 0\) return cpReviewCapPile\(session, \{ reviews, learning, newNames \}\);   \/\/ 🔁 CPREVIEW[^\n]*\n  return \{ reviews, learning, newNames \};\n\}$/.test(fn("mstPile")));

// ── the engine world ──
const ENG=[
  constAt("ENV_UNIT_ID"),constAt("ENV_STAGES"),constAt("ENV_DECKS"),constAt("ENV_SESSION_SID"),constAt("ENV_SESSION"),fn("envCardsInCode"),
  constAt("MAST_TIER_ORDER"),constAt("MAST_TIER_INT"),constAt("MAST_MASTERY_TIER_DEFAULT"),constAt("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",constAt("MST_BACK_FIELDS"),
  "let mstSid=null, mstState=null, mstFlipped=false, mstStartTs=null, mstDone=null, mstKid=null, mstSaveErr=null;",
  cut("// ENVMIRROR_START","// ENVMIRROR_END"),cut("// CPLINCOLN_START","// CPLINCOLN_END"),
  cut("// ENVCLASSSET_START","// ENVCLASSSET_END"),cut("// CPSEATS_START","// CPSEATS_END"),cut("// CPREVIEW_START","// CPREVIEW_END"),"__BLK__",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastGetCatMode","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","evo2LastTested",
      "mstLogGet","mstBeforeSnap","mstBeforeMerge","_mstSaveInner",
      "cppMs","cppStr","cppAdd","cppOk","cppGoals","cppStudy","cpcalMs","cpcalOk","cpcalWdOf","cpcalDays","cpCalStudy"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),cut("// REVIEWENGINE_START","// REVIEWENGINE_END"),cut("// NEWBUDGET_START","// NEWBUDGET_END"),cut("// CPCORE_START","// CPCORE_END"),
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  'MST_PATTERN_MODES.push("pick"); MST_PATTERN_MODES.push("copy"); MST_PATTERN_MODES.push("ideas");',
  "const MAST_DEFAULT_CAT_MODES={};"].join("\n");
const DRYPATCH=cut("    if(_dryRun()){\n      try{\n        const _origRef=db.ref.bind(db);","console.warn(\"dryrun patch failed\",e); }\n    }");
const EDECKS=src.match(/\nconst ENV_DECKS=\[[\s\S]*?\];/)[0].match(/\["([^"]+)","(flip|flash|quiz)"/g).map(s=>s.match(/\["([^"]+)"/)[1]);
const D3=EDECKS.slice(0,3);
const GOAL={name:"State",date:"2027-04-17"}, FROM="2027-03-27", TO="2027-04-16";   // 21 days: 3/27 … 4/16
// a kid: 3 Envirothon decks in the 🌿 session, 10 graduated cards each + 2 on the ladder; a graduated German card; one parked
function fixture(kid){
  const M={}, items=[], bank=[];
  D3.forEach((d,di)=>{ for(let i=0;i<12;i++) bank.push({cat:d,name:d+" c"+i,def:"e"+i});
    for(let i=0;i<10;i++) items.push({id:"g"+di+"_"+String(i).padStart(2,"0"),subject:d,type:"env",prompt:d+" c"+i,answer:"e"+i,tier:"graduated",status:"active",review_mode:"flash",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0});
    for(let i=10;i<12;i++) items.push({id:"l"+di+"_"+i,subject:d,type:"env",prompt:d+" c"+i,answer:"e"+i,tier:"weekly",status:"active",review_mode:"flash",next_due:9999,drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}); });
  items.push({id:"ger_1",subject:"German",type:"german",prompt:"Hund",answer:"dog",tier:"graduated",status:"active",review_mode:"flash",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0});
  items.push({id:"park_1",subject:D3[0],type:"env",prompt:"parked one",tier:"graduated",status:"parked",review_mode:"flash",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0});
  M[kid]=items; M[kid+"_custom_items"]=bank;
  M[kid+"_settings"]={intro_dots:4,ladder_streak:1,max_per_cat:5,max_intro_per_cat:3,miss_drop:"reset",cat_hold:{}};
  M[kid+"_sessions"]={german:{name:"German",kind:"deck",decks:["German"],newPerDay:0,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",maxCards:12,focusDecks:0},
    envirothon:{name:"Envirothon",emoji:"🌿",kind:"deck",who:"solo",newPerDay:0,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",order:"bank",maxCards:12,focusDecks:2,pattern:["rec"],decks:D3.slice()}};
  M.studyLog={}; M.history={[kid]:{"20261101":{items:[{id:"g1_05",result:"c"},{id:"g2_09",result:"m"}]},"20261201":{items:[{id:"g0_00",result:"c"}]}}};   // these three were seen latest: they come last
  const U={nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{[kid]:true},decks:EDECKS.map((k,i)=>({key:k,station:["general","forestry","soils","aquatic","wildlife"][Math.min(4,Math.floor(i/3))],cards:Array.from({length:12},(_,j)=>({name:k+" c"+j,def:"e"+j,core:j%2===0}))}))}};
  return {M,U};
}
function world(o){
  o=o||{};
  const kid=o.site?"maya":"lincoln";
  const f=fixture(kid); if(o.mutate) o.mutate(f.M[kid],f.M);
  const reads=[], writes=[], held=[];
  const edb={ref:p=>({once(ev,okf,bad){ reads.push(p); if(o.refuse===p){ if(bad) bad(new Error("permission_denied")); return; } const v=(o.remote||{})[p]; ok_(okf,v); }, on(){}, off(){}})};
  const ok_=(okf,v)=>okf({val:()=>v===undefined?null:v});
  const mkRef=p=>({set(v){ writes.push(["set",p,JSON.parse(J(v))]); return Promise.resolve(); },update(v){ writes.push(["update",p,JSON.parse(J(v))]); return Promise.resolve(); },remove(){ writes.push(["remove",p]); return Promise.resolve(); },transaction(){ writes.push(["transaction",p]); },push(){ writes.push(["push",p]); return mkRef(p+"/x"); },child(c){ return mkRef(p+"/"+c); }});
  const db=o.noDb?null:{ref:mkRef};
  const st={today:o.today||FROM, pn:o.pn||500};
  const ctx={console:{log(){},error(){},warn(){}},Object,Array,String,Number,Math,JSON,Date,Set,Map,WeakMap,Infinity,NaN,isNaN,parseInt,parseFloat,Promise,
    window:{HA_FAMILY:(o.site||o.cfg===false)?{familyId:"howe"}:{familyId:"howe",envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:"c1"}}},
    masteryData:f.M, unitStudies:f.U, masteryKid:kid, db, HA_LS:{s:{},getItem(k){ return this.s[k]||null; },setItem(k,v){ this.s[k]=String(v); },removeItem(k){ delete this.s[k]; }},
    _dryRun:()=>!!o.dry, renderAllSoon:()=>{}, cap:s=>s[0].toUpperCase()+s.slice(1), gwShowToast(){}, setTimeout:()=>0, clearTimeout(){},
    envSiteOn:()=>!!o.site, envsDemo:()=>false, _envs:o.site?{kid:"maya",role:"kid",sid:"fam_maya",cls:{goals:o.goals===undefined?[GOAL]:o.goals}}:{kid:null,role:null,cls:null}, _envc:{}, envcOn:()=>false, envcAdmin:()=>false,
    envsEsc:v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    mastIsNeverDrill:i=>!!(i&&i.never), mastDynamicShouldAdd:()=>false, mastDynamicShouldPrune:()=>false, mastDynamicEligible:()=>false, mastDynamicMark(){}, mastDynamicClear(){}, mastDynamicCapNotice:false,
    _todayStr:()=>st.today, cpcalToday:()=>st.today, mstTodayKey:()=>st.today.replace(/-/g,""), mstDateStr:()=>st.today, mastGetPrintNum:()=>st.pn,
    cpcalCls:()=>ctx._envs.cls, cpStudyDays:()=>o.cal||null, mastPrintLogAppend(){}, mstNavReset(){}, mstClearPersist(){}, _mastRe(){}, dbg(){},
    cpceItems:o.hide?((k,a)=>a.filter(i=>o.hide.indexOf(i.id)<0)):undefined, cpSecItems:o.off?((k,a)=>a.filter(i=>o.off.indexOf(i.subject)<0)):undefined,
    reads, writes, held, edb, st};
  if(!ctx.cpceItems) delete ctx.cpceItems; if(!ctx.cpSecItems) delete ctx.cpSecItems;
  vm.createContext(ctx);
  vm.runInContext(ENG.replace("__BLK__",o.noBlock?"":BLK)+"\n;this.api={};",ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  if(o.dry) vm.runInContext(DRYPATCH,ctx);   // the app's own boot patch, as ?dryrun=1 runs it
  if(o.site){ ctx.get("_envcs.loaded=true"); ctx._envcs=ctx.get("_envcs"); ctx._envcs.kcls=o.cls||{}; ctx._envcs.kstu=o.stu||{}; }
  else if(!o.noLoad){
    ctx.get("_envm.user={uid:'u1',email:'mom@x'}");
    ctx.get("cplnLoad('lincoln','c1',edb,'howe_lincoln')"); ctx.get("typeof cpprepLoad==='function'?cpprepLoad('lincoln','c1',edb):0");
  }
  ctx.kid=kid;
  return ctx;
}
const REMOTE=(study,goals,stu)=>({"classes/c1/settings":{study:study||{}},"classes/c1/plan":{},"students/howe_lincoln/settings":{study:stu||{}},"classes/c1/goals":goals===undefined?{0:GOAL}:goals});
const L=o=>world(Object.assign({remote:REMOTE()},o||{}));
// today's pile / the start line / one sitting answered and saved (ans: id → "good" | "again"; default all good)
const pile=w=>w.get("mstPile(masteryKid,'envirothon',st.pn,mstLogGet(masteryKid,'envirothon'))");
const prepIds=w=>{ const p=pile(w); return (p.reviews||[]).filter(i=>i.tier==="graduated"||i.prep).map(i=>i.id); };
const line=w=>w.get("cpprepStartHtml&&typeof cpprepStartHtml==='function'?cpprepStartHtml(masteryKid,mstSessions(masteryKid).find(s=>s.sid==='envirothon')):''");
function sit(w,ans){
  ans=ans||{}; const at=w.writes.length;
  w.get("mstSid='envirothon'; mstState=mstSittingInit(mstPile(masteryKid,'envirothon',st.pn,mstLogGet(masteryKid,'envirothon')),mstSessions(masteryKid).find(s=>s.sid==='envirothon'),{dotsNeeded:()=>4,noType:()=>true});");
  const asked={}; for(let g=0;g<400;g++){ const c=w.get("mstCurrent(mstState)"); if(!c) break; const a=(!asked[c.key]&&ans[c.id])||"good"; asked[c.key]=1; w.get("mstAnswer(mstState,"+J(c.key)+","+J(a)+")"); }   // the first answer counts; a missed card comes round again in the sitting
  w.get("mstState&&_mstSaveInner()");
  return w.writes.slice(at);
}
const item=(w,id)=>w.get("masteryData[masteryKid].find(i=>i.id==="+J(id)+")");
const day=(w,s,pn)=>{ w.st.today=s; w.st.pn=pn; };

console.log("2. The settings row");
{ const w=L(); const F=w.get("ENVCS_FIELDS"), i=F.findIndex(f=>f.name==="prepDays"), f=F[i];
  ok("“Learned cards come back before the test”: a study row in “When cards move on”, right after “Hands off to the drill at”", f&&f.part==="study"&&f.sect==="moves"&&F[i-1].name==="handOffAt"&&f.label==="Learned cards come back before the test", f);
  ok("whole days 0–60, default 21, 0 = off, with a plain means line", f.kind==="int"&&f.min===0&&f.max===60&&f.def===21&&f.zero==="off"&&/each learned card comes back once/.test(f.means));
  ok("added once (a second call adds nothing)", w.get("cpprepFields(),ENVCS_FIELDS.filter(f=>f.name==='prepDays').length")===1);
  ok("the range check is the other rows' own (61 and 1.5 refused, 0 and 60 kept)", !w.get("envClsCheck('prepDays',61).ok")&&!w.get("envClsCheck('prepDays',1.5).ok")&&w.get("envClsCheck('prepDays',0).v")===0&&w.get("envClsCheck('prepDays',60).v")===60); }

console.log("3. Inert: the pile and the save are exactly main's");
{ const cases=[["no goal date (the class has none)",{remote:REMOTE({},null)}],["the setting at 0",{remote:REMOTE({prepDays:0})}],["his override at 0 (class 21)",{remote:REMOTE({prepDays:21},undefined,{prepDays:0})}],
    ["the day before the window opens",{today:"2027-03-26"}],["the goal day itself",{today:GOAL.date}],["after the goal",{today:"2027-05-01"}],
    ["the goals read refused",{refuse:"classes/c1/goals"}],["the family has no class link (Howe without the config block)",{cfg:false}],["his class link not read in",{noLoad:true}],
    ["a goal date that isn't a real day",{remote:REMOTE({},{0:{name:"Bad",date:"2027-02-30"}})}]];
  cases.forEach(c=>{ const a=L(c[1]), b=L(Object.assign({},c[1],{noBlock:true}));
    ok(c[0]+": the pile is byte-identical to the block cut out", J(pile(a))===J(pile(b)), [pile(a).reviews.length,pile(b).reviews.length]);
    ok(c[0]+": no start line", line(a)==="");
    const wa=sit(a), wb=sit(b); ok(c[0]+": the sitting's writes are byte-identical (no prep anywhere)", J(wa)===J(wb)&&!/prep/.test(J(wa))); }); }
{ const a=L({today:"2027-04-01"}); ok("another session of the same kid (German, a graduated card in its deck): its pile has no learned card", J(a.get("mstPile('lincoln','german',st.pn,null)").reviews.map(i=>i.id))==="[]");
  ok("another kid: nothing", a.get("cpprepPick('ellis',{sid:'envirothon',decks:"+J(D3)+"},masteryData.lincoln,new Set(),null)")===null); }

console.log("4. The window and the daily share (Lincoln: every day is a study day)");
{ const w=L(); const ids=prepIds(w);
  ok("first day (3/27, 21 days left): ⌈30 / 21⌉ = 2 come", ids.length===2, ids);
  ok("longest unseen first, then by id (never-seen g0_01, g0_02; the three seen in Nov/Dec wait till last)", J(ids)===J(["g0_01","g0_02"]), ids);
  ok("the same day gives the same cards (asked again)", J(prepIds(w))===J(ids));
  ok("they ride on top as review cards (the 🌿 sitting's own learning/new parts untouched)", J(pile(w).learning)===J(pile(L({noBlock:true})).learning)&&pile(w).prep===2);
  const ln=line(w); ok("the start line: “🎯 State in 21 days · 2 learned cards come back today”", /🎯 State in 21 days · 2 learned cards come back today/.test(ln), ln); }
{ const w=L({today:TO}); const ids=prepIds(w);
  ok("last day (4/16) with nothing done before: all 30 come (1 study day left)", ids.length===30, ids.length);
  ok("…the three seen latest are the last three", J(ids.slice(-3))===J(["g1_05","g2_09","g0_00"]), ids.slice(-3));
  ok("the line says tomorrow", /State tomorrow · 30 learned cards come back today/.test(line(w)), line(w)); }
{ // the whole window, a sitting a day, every card right, with three days skipped
  const w=L(); const seen={}, perDay=[]; let pn=500; const skip=new Set(["2027-03-29","2027-04-05","2027-04-06"]);
  let bad=null;
  for(let s=FROM;s<=TO;s=w.get("cppAdd("+J(s)+",1)")){
    day(w,s,++pn); if(skip.has(s)){ perDay.push([s,"skipped"]); continue; }
    const waiting=w.get("masteryData.lincoln.filter(i=>i.tier==='graduated'&&i.status==='active'&&"+J(D3)+".indexOf(i.subject)>=0&&i.prep!=="+J(GOAL.date)+").length");
    const left=w.get("cpcalDays("+J(s)+","+J(TO)+")+1"), want=Math.ceil(waiting/left), ids=prepIds(w);
    if(ids.length!==want&&!bad) bad=[s,ids.length,want];
    ids.forEach(id=>{ seen[id]=(seen[id]||0)+1; }); perDay.push([s,ids.length]);
    sit(w);
    if(prepIds(w).length&&!bad) bad=[s,"a second look the same day drew more"]; }
  ok("every day: the share is ⌈waiting ÷ days left⌉, worked out fresh (skipped days need nothing)", !bad, bad||perDay);
  ok("each of the 30 cards came exactly once", Object.keys(seen).length===30&&Object.values(seen).every(n=>n===1), seen);
  ok("hidden by nothing here, so the parked card and the German card never came", !seen.park_1&&!seen.ger_1);
  ok("after the window's last day nothing is left waiting", w.get("masteryData.lincoln.filter(i=>i.tier==='graduated'&&"+J(D3)+".indexOf(i.subject)>=0&&i.status==='active'&&i.prep!=="+J(GOAL.date)+").length")===0);
  ok("every right answer left the card graduated, stamped prep = the goal date", w.get("masteryData.lincoln.filter(i=>/^g\\d/.test(i.id)).every(i=>i.tier==='graduated'&&i.prep==="+J(GOAL.date)+"&&i.next_due==null)"));
  day(w,GOAL.date,pn+1); ok("the goal day: no line, nothing comes", line(w)===""&&prepIds(w).length===0);
  const nextGoal={name:"Nationals",date:"2027-07-20"}; w.get("_cpprep.g.lincoln.goals.push("+J(nextGoal)+")"); day(w,"2027-07-01",pn+2);
  ok("a later goal: the same cards are due again for THAT goal (the stamp is per goal date)", prepIds(w).length===Math.ceil(30/19), prepIds(w).length); }
{ const w=L(); sit(w); ok("a second sitting the same day: today's two are not drawn again, and no new ones join", prepIds(w).length===0);
  ok("…the line says today's are done", /today’s learned cards are done ✓/.test(line(w)), line(w)); }

console.log("5. The result: right stays graduated + stamped; a miss follows miss_drop");
{ const w=L(); const wr=sit(w,{g0_02:"again"});
  const a=item(w,"g0_01"), b=item(w,"g0_02"), ix=id=>w.get("masteryData.lincoln.findIndex(i=>i.id==="+J(id)+")");
  ok("right: still graduated, prep = 2027-04-17, nothing booked", a.tier==="graduated"&&a.prep===GOAL.date&&a.next_due==null&&a.status==="active", a);
  ok("miss (\"reset\"): back to the first level (every other day), booked a full interval out, prep stamped", b.tier==="every_other_day"&&b.prep===GOAL.date&&b.next_due>=502&&b.drop_count===1, b);
  const up=wr.filter(x=>x[0]==="update"&&x[1]==="mastery/lincoln");
  ok("ONE targeted update at mastery/lincoln carries both, with the one new field", up.length===1&&up[0][2][ix("g0_01")+"/prep"]===GOAL.date&&up[0][2][ix("g0_02")+"/prep"]===GOAL.date&&up[0][2][ix("g0_01")+"/tier"]==="graduated"&&up[0][2][ix("g0_02")+"/tier"]==="every_other_day", up);
  ok("no whole-node write: every key is <index>/<field>, and the only set is today's study log", up.every(u=>Object.keys(u[2]).every(k=>/^\d+\/[a-z_A-Z]+$/.test(k)))&&wr.filter(x=>x[0]!=="update").every(x=>x[0]==="set"&&/^mastery\/studyLog\/lincoln\/envirothon\/\d{8}$/.test(x[1])), wr.map(x=>[x[0],x[1]]));
  ok("the missed card is not drawn as a learned card again (it is on the ladder now, and stamped)", day(w,"2027-03-28",501)||prepIds(w).indexOf("g0_02")<0);
  day(w,"2027-03-29",502+2); const p=pile(w); ok("…it comes back as an ordinary review when the ladder says so", p.reviews.some(i=>i.id==="g0_02"&&i.tier==="every_other_day"), p.reviews.map(i=>i.id)); }
{ const w=L({mutate:(it,M)=>{ M.lincoln_settings.miss_drop="one"; }}); sit(w,{g0_01:"again"}); const a=item(w,"g0_01");
  ok("miss (\"one\"): down one level (monthly), prep stamped", a.tier==="monthly"&&a.prep===GOAL.date, a); }
{ const w=L({mutate:(it,M)=>{ M.lincoln_settings.miss_drop="one"; }, remote:Object.assign(REMOTE(),{"classes/c1/settings":{study:{},drill:{miss_drop:"reset"}}})}); sit(w,{g0_01:"again"});
  ok("What a miss does stays Mom's for Lincoln (his class's miss_drop isn't brought): \"one\" → monthly", item(w,"g0_01").tier==="monthly"); }
{ const w=L({mutate:(it,M)=>{ M.lincoln_settings.ladder=["every_other_day","weekly","bi_weekly","monthly"]; }}); sit(w); const a=item(w,"g0_01");
  ok("a ladder without the graduated rung: a right still leaves the card graduated (put back), stamped", a.tier==="graduated"&&a.prep===GOAL.date&&a.next_due==null, a); }

console.log("6. Which cards");
{ const w=L({hide:["g0_01"],off:[D3[2]],mutate:it=>{ it.find(i=>i.id==="g0_02").never=true; }}); const ids=prepIds(w);
  ok("a card hidden for the class (cpceItems), an Off section's cards (cpSecItems) and a never-drill card are skipped", ids.indexOf("g0_01")<0&&ids.indexOf("g0_02")<0&&ids.every(id=>!/^g2_/.test(id)), ids);
  ok("…and the share counts only what can come: ⌈18 / 21⌉ = 1", ids.length===1&&ids[0]==="g0_03", ids);
  day(w,TO,520); ok("on the last day the 18 come, none of the skipped ones", prepIds(w).length===18&&prepIds(w).every(id=>id!=="g0_01"&&id!=="g0_02"&&!/^g2_/.test(id))); }
{ const w=L({today:TO}); ok("the German graduated card (not an Envirothon deck) never comes, even on the last day", prepIds(w).indexOf("ger_1")<0&&w.get("mstPile('lincoln','german',st.pn,null)").reviews.length===0);
  ok("the parked card never comes", prepIds(w).indexOf("park_1")<0); ok("cards still on the ladder are left alone (not drawn, not due)", !pile(w).reviews.some(i=>/^l/.test(i.id))); }

console.log("7. Lincoln's mirror");
{ const w=L(); ok("one read of classes/c1/goals with his three class reads", J(w.reads)===J(["classes/c1/settings","classes/c1/plan","students/howe_lincoln/settings","classes/c1/goals"]), w.reads);
  w.get("cpprepLoad('lincoln','c1',edb)"); ok("asked again for the same class: no new read", w.reads.length===4);
  ok("nothing written by the reads", w.writes.length===0); }
{ const w=L({remote:REMOTE({prepDays:10})}); ok("the class's value (10 days): 3/27 is outside the window", prepIds(w).length===0); day(w,"2027-04-07",510); ok("…4/07 is its first day: ⌈30/10⌉ = 3", prepIds(w).length===3); }
{ const w=L({remote:REMOTE({prepDays:10},undefined,{prepDays:30}),today:"2027-03-18"}); ok("his own override (30) beats the class's (10): 3/18 is in, ⌈30/30⌉ = 1", prepIds(w).length===1); }
{ const w=L({remote:REMOTE({prepDays:99})}); ok("a bad class value is skipped (the default 21 stays)", prepIds(w).length===2); }
{ const w=L({remote:REMOTE({},{0:{name:"Regional",date:"2027-03-01"},1:GOAL,2:{name:"Nationals",date:"2027-07-20"}})});
  ok("the NEXT goal on or after today is used (Regional is past)", /🎯 State in 21 days/.test(line(w)), line(w)); }
{ const w=L(); w.get("_envm.user=null"); ok("the mirror signed out: inert again", prepIds(w).length===0&&line(w)===""); }

console.log("8. The class site (the student's study days)");
{ const S=o=>world(Object.assign({site:true,cal:{days:"school",off:{"2027-04-02":true}},cls:{study:{prepDays:21}}},o||{}));
  const w=S(); ok("the site's kid, first day (Sat 3/27): a day off — none, but the line still shows what waits", prepIds(w).length===0&&/State in 21 days · 30 learned cards still to come back/.test(line(w)), line(w));
  // school days 3/29 … 4/16, less 4/02 = 14 study days
  day(w,"2027-03-29",501); ok("Mon 3/29: ⌈30 / 14 study days⌉ = 3", prepIds(w).length===3, prepIds(w).length);
  const wb=S({noBlock:true}); wb.st.today="2027-03-29"; wb.st.pn=501;
  ok("the site's 🌿 pile is the same as without the block plus those 3 on top", J(pile(w).reviews.slice(0,-3))===J(pile(wb).reviews)&&J(pile(w).learning)===J(pile(wb).learning));
  sit(w); ok("the stamps ride the site's own save", w.get("masteryData.maya.filter(i=>i.prep==="+J(GOAL.date)+").length")===3);
  day(w,"2027-04-02",505); ok("the class's day off (4/02): none", prepIds(w).length===0);
  const w2=S({goals:[]}); w2.st.today="2027-03-29"; ok("no goal on the class: inert", prepIds(w2).length===0&&line(w2)==="");
  const w3=S({cls:{study:{prepDays:0}}}); w3.st.today="2027-03-29"; ok("the class set it to 0: inert", prepIds(w3).length===0);
  const w4=S({cls:{study:{prepDays:21}},stu:{study:{prepDays:5}}}); w4.st.today="2027-03-29"; ok("a student override (5 days) is followed: 3/29 is outside", prepIds(w4).length===0);
  const w5=S({cal:null}); w5.st.today="2027-03-27"; ok("no calendar known: calendar days (⌈30/21⌉ = 2 on Saturday)", prepIds(w5).length===2);
  const w6=S(); w6.st.today="2027-04-17"; ok("a Saturday with no study day left before the goal… (goal day: off)", prepIds(w6).length===0);
  const w7=world({site:true,cal:{days:"school",off:{}},cls:{study:{prepDays:21}},goals:[{name:"State",date:"2027-04-19"}]}); w7.st.today="2027-04-17";
  ok("a day off with no study day left before the goal (Sat 4/17, goal Mon 4/19): everything that waits comes", prepIds(w7).length===30, prepIds(w7).length); }

console.log("9. ?dryrun=1 and no db");
{ const w=L({dry:true}); const wr=sit(w); ok("?dryrun=1 (the app's own db.ref patch): the sitting writes nothing", wr.length===0&&w.writes.length===0);
  ok("…the stamp is in memory only (this device)", item(w,"g0_01").prep===GOAL.date); }
{ const w=L({noDb:true}); sit(w); ok("no db at all: nothing written, nothing thrown", w.writes.length===0&&item(w,"g0_01").prep===GOAL.date); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
