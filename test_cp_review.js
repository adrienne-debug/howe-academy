/*
 * Node tests — 🔁 CPREVIEW, PR 6 of the class platform (DESIGN_class_platform_2026-10-28.md §7(a), §2, §5.1, §9, §12, §13 row 6). Her answer
 * to Q5 (2026-10-28): "the default would be that it stays in the student's own session." The gap: on the class site a card left the 🌿
 * sitting at weekly for Mom's drill, and the site has no Mom's drill — so weekly cards were never reviewed, nothing reached every 2 weeks,
 * and the final could never open by itself.
 *   · Where the block sits and how it hooks (typeof-guarded one-line hooks; the ENVCS_FIELDS literal untouched).
 *   · ⚙️ Class settings: "Reviews a sitting" right after "Cards a sitting" (0–200, default 0 = all of them); class value, a student's
 *     override, Adrienne's lock — every save one targeted update through ENVCLASSSET's own save. The two "when cards move on" rows say
 *     they don't move cards on the site.
 *   · The kid: reviewIn "sitting" by default for the site's kid (kid / parent / demo), never for a teacher or admin login; the 🌿 pile carries
 *     weekly, every-2-weeks and monthly reviews; Reviews a sitting gives the oldest due first, then "Keep going · N left"; a card a drill
 *     graded today isn't asked again; learnedAt (the section plan's, default every 2 weeks) is what the final counts.
 *   · THE REPLAY: 40 simulated study days of demo Maya's real 🌿 session, on the REAL mstSessions + mstPile + mastBankEligible +
 *     mastDrillSettings + mastIsDue + mastStampNextDue + mastApplyScores (sliced from index.html), every card right, no drill at all:
 *     her weekly cards climb to every 2 weeks and past, and the Soils final opens on its own. The same 40 days without the block: the
 *     weekly cards never move and the final stays shut.
 *   · Howe: a Howe kid (Lincoln's 🌿 Envirothon session, no edition) gets the very same sessions, ownership, piles and learned counts with
 *     the block as without it, day after day; his weekly+ cards still go to Mom's drill (mstOwnedIds).
 *   · The parent page: "Maya reviews in the 🌿 sitting on the student login …", no PIN drill.
 * Uses the world from test_env_site.js (its one `o.rev` line injects this block + the engine).               run: node test_cp_review.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CLS,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END");
// the REAL study engine and the REAL ladder scoring, sliced from index.html. Stubs: no built-in banks (a site kid has none), no
// concept/transfer cards, the dynamic deck off (its default). study() is one sitting saved the way _mstSaveInner saves it: new names
// minted on the first rung, every review graded (right unless `grade` says), every learning card "shown", then mastApplyScores.
const ENG=[constLine("MAST_TIER_INT"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores"].map(fn),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  `let _revN=0;
  function _revStudy(kid,sid,pn,grade,log){
    const pile=mstPile(kid,sid,pn,log||null), tiers=pile.reviews.map(i=>i.tier), _mk=masteryKid; masteryKid=kid;
    let items=masteryData[kid]; if(!Array.isArray(items)) items=masteryData[kid]=Object.values(items||{});
    const scores={};
    pile.reviews.forEach(i=>{ scores[i.id]=grade?grade(i):"c"; });
    pile.learning.forEach(i=>{ scores[i.id]="shown"; });
    pile.newNames.forEach(n=>{ const it={id:kid.slice(0,3)+"_n"+(++_revN),subject:n.deck,type:n.deck.toLowerCase(),prompt:n.name,tier:"daily",review_mode:"flash",status:"introduction",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}; items.push(it); scores[it.id]="shown"; });
    const r=mastApplyScores(items,Object.keys(scores).map(id=>({id})),scores,pn,mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false});
    masteryKid=_mk;
    return {pile,tiers,scores,log:{items:Object.keys(scores).map(id=>({id,result:scores[id]==="shown"?"shown":scores[id],name:scores[id]==="shown"?(items.find(i=>i.id===id)||{}).prompt:undefined}))}};
  }
  function _revDrill(kid,ids,pn,sc){ const _mk=masteryKid; masteryKid=kid; const items=masteryData[kid], scores={}; ids.forEach(id=>{ scores[id]=sc||"c"; }); mastApplyScores(items,ids.map(id=>({id})),scores,pn,mastDrillSettings(),{autoPull:false,chain:false}); masteryKid=_mk; }
  G.eng={ mstSessions, mstOwns, mstOwnedIds, mstPile, mastDrillSettings, mastIsDue, study:_revStudy, drill:_revDrill, setKid(k){ masteryKid=k; } };`].join("\n");
const REVX=REV+"\nG.rev={ CPR_CAP_ROW, CPR_LEARNED_DEF, CPR_MEANS, CPR_FIELDS_SET, cpReviewFields, cpReviewOn, cpReviewCapOf, cpReviewSession, cpReviewOwns, cpReviewCapPile, cpReviewLearnedAt, cpReviewMoreHtml, cpReviewWhoNote };";
// a world: `rev` false = the same world with the engine only (no CPREVIEW), the control
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,envt:true,lib:{demo:true,tests:LIB.tests},rev:(o.rev===false?"":REVX)+"\n"+ENG},o.w||{})); w.E=w.G.eng; w.R=w.G.rev||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function liveConsole(role){ const w=W(); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"}}; return w; }
const K="maya", SID="envirothon", P0=400;   // P0: any school-day number past every seeded next_due
const items=w=>w.masteryData[K];
const LADDER=["every_other_day","weekly","bi_weekly","monthly","graduated"], at=(t,min)=>LADDER.indexOf(t)>=LADDER.indexOf(min);

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPREVIEW_START"), b=src.indexOf("// CPREVIEW_END"), e=src.indexOf("// ENVIDFLASH_END");
  ok("CPREVIEW once, right after ENVIDFLASH_END (🌲 CPITEMID's and 📏 CPITEMSCALE's blocks may sit between; after ENVCLASSSET's settings list is declared)", a>0&&b>a&&src.indexOf("// CPREVIEW_START",a+1)<0&&src.slice(e,a).replace(/\/\/ CPITEMID_START[\s\S]*?\/\/ CPITEMID_END\n/,"").replace(/\/\/ CPITEMSCALE_START[\s\S]*?\/\/ CPITEMSCALE_END\n/,"").trim()==="// ENVIDFLASH_END"&&src.indexOf("const ENVCS_FIELDS=[")<a);
  ok("the header names the design sections, PR 6, her Q5 words and the date", /§7\(a\)/.test(REV)&&/§13 row 6/.test(REV)&&/PR 6/.test(REV)&&/the default would be that it stays in the student's own\s*\/\/ session/.test(REV)&&/2026-10-28/.test(REV));
  ok("the block only declares (its one load step is a const: the guarded update of the settings list)", REV.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l))&&/^const CPR_FIELDS_SET=cpReviewFields\(\);$/m.test(REV));
  ok("no Howe kid name as a code literal, no database call in the block", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(REV)&&!/\.ref\(|envsWrite|envcWrite|\bdb\b/.test(REV.replace(/^\/\/.*$/mg,"")));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🔁 CPREVIEW/.test(l));
  ok("7 tagged lines outside the block, every one typeof-guarded", hooks.length===7&&hooks.every(l=>/typeof cpReview\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,70)));
  const owns=cut("function mstOwns(session, item, ladder) {","\n}\n"), ses=cut("function mstSessions(kid) {","\n}\n"), pile=cut("function mstPile(kid, sid, pn, todayLog) {","\n}\n");
  ok("mstOwns: one line, right before the mix-in test, only for a reviewIn \"sitting\" session", /const tier = item\.tier \|\| "daily";\n  if \(typeof cpReviewOwns === "function" && session\.reviewIn === "sitting"\) return cpReviewOwns\(session, item, tier\);[^\n]*\n  return mstTierIdx\(tier, ladder\) < mstTierIdx\(session\.mixInAt, ladder\);/.test(owns));
  ok("mstSessions: one line right after the session object is pushed (the kid's record is never touched)", /    \}\);\n    if \(typeof cpReviewSession === "function"\) cpReviewSession\(kid, sid, rec, out\[out\.length - 1\]\);[^\n]*\n  \}\);/.test(ses));
  ok("mstPile: one line before the deck pile's own return, only when the session has a cap", /  if \(typeof cpReviewCapPile === "function" && session\.reviewCap > 0\) return cpReviewCapPile\(session, \{ reviews, learning, newNames \}\);[^\n]*\n  return \{ reviews, learning, newNames \};\n\}\n$/.test(pile));
  ok("envtCoreCount: learned = cpReviewLearnedAt (the site) or envtHandOffAt (everyone else)", /const at=\(typeof cpReviewLearnedAt==="function"&&cpReviewLearnedAt\(kid,station\)\)\|\|envtHandOffAt\(kid\),/.test(cut("function envtCoreCount(kid,station){","\n  return out; }")));
  ok("envsWhoNote: the note first asks cpReviewWhoNote; the old notes are still there behind it", /function envsWhoNote\(\)\{ const w=_envs\.who\|\|"";\n  if\(typeof cpReviewWhoNote==="function"\)\{ const t=cpReviewWhoNote\(w\); if\(t\) return t; \}[^\n]*\n  return w==="teacher"\?/.test(src)&&/open the parent view with your PIN to drill/.test(src));
  const view=cut("function renderMastStudy(","\n}\n");
  ok("renderMastStudy: Keep going on the done screen (after the Mix's), the 'N of M due' line under Start", /Today\\'s Mix is done[^\n]*\n    if\(typeof cpReviewMoreHtml==="function"\) h\+=cpReviewMoreHtml\(session,pile,"done"\);/.test(view)&&/\/\/ MIX_FINISH\n      if\(typeof cpReviewMoreHtml==="function"\) h\+=cpReviewMoreHtml\(session,pile,"start"\);/.test(view));
  ok("the ENVCS_FIELDS literal is not edited (no reviewCap there; the meaning lines in the literal are the old ones)", CLS.indexOf("reviewCap")<0&&/The level where a card goes to the drill — and counts as learned for the final\./.test(CLS));
  ok("test_env_site.js carries this block only through its one `o.rev` line", (fs.readFileSync(path.join(REPO,"test_env_site.js"),"utf8").match(/o\.rev/g)||[]).length===1); }

console.log("\n── ⚙️ Class settings: 'Reviews a sitting' ──");
{ const w=demo("teacher"), F=w.ENVCS_FIELDS, i=F.findIndex(f=>f.name==="reviewCap"), f=F[i];
  ok("added once, right after 'Cards a sitting', up front (How the class studies), study part, 0–200, default 0 = all of them", i>0&&F[i-1].name==="maxCards"&&F.filter(x=>x.name==="reviewCap").length===1&&f.sect==="front"&&f.part==="study"&&f.kind==="int"&&f.min===0&&f.max===200&&f.def===0&&f.zero==="all of them"&&f.label==="Reviews a sitting");
  ok("the load step is guarded: a second run adds nothing", w.R.cpReviewFields()===true&&F.filter(x=>x.name==="reviewCap").length===1);
  ok("'Mixes into review at' / 'Hands off to the drill at' now say they don't move cards on the site, and learned is the section's level", /every review stays in the 🌿 sitting, so this doesn’t move cards/.test(F.find(x=>x.name==="mixInAt").means)&&/parent’s drill/.test(F.find(x=>x.name==="handOffAt").means)&&!/counts as learned for the final\.$/.test(F.find(x=>x.name==="handOffAt").means)&&/Every 2 weeks/.test(F.find(x=>x.name==="handOffAt").means));
  ok("the check: 0 and 200 · not 201, -1, 2.5, words", w.envClsCheck("reviewCap",0).ok&&w.envClsCheck("reviewCap","200").v===200&&!w.envClsCheck("reviewCap",201).ok&&!w.envClsCheck("reviewCap",-1).ok&&!w.envClsCheck("reviewCap",2.5).ok&&!w.envClsCheck("reviewCap","many").ok);
  w.envcView("classset"); const h=w.G.content, r=h.slice(h.indexOf(">Reviews a sitting<"),h.indexOf("How cards are learned"));
  ok("the panel: the row right under Cards a sitting, its meaning, (0–200), 'now: 0 (all of them) (default)'", h.indexOf(">Cards a sitting<")<h.indexOf(">Reviews a sitting<")&&/the oldest due first\. When those are done the student can Keep going for the rest \(0 = all of them\)\. \(0–200\)/.test(r)&&/now: <b>0 \(all of them\)<\/b> \(default\)/.test(r)&&/envClsInput\('class','reviewCap',this\.value\)/.test(r));
  w.envClsInput("class","reviewCap","12"); await w.flush();
  ok("demo: set 12 → 'would write' {reviewCap:12}, nothing written, the panel shows 12", JSON.stringify(w._envs.writes[w._envs.writes.length-1]).indexOf('"reviewCap":12')>=0&&w.G.writes.length===0&&/now: <b>12<\/b>/.test(w.G.content));
  w.envsDemoGo("kid"); const s=w.E.mstSessions(K).find(x=>x.sid===SID);
  ok("…and Maya's 🌿 session uses it at once: reviewIn 'sitting', reviewCap 12", s.reviewIn==="sitting"&&s.reviewCap===12); }
{ const w=liveConsole("teacher"), Wr=()=>w.G.writes;
  w.envClsSave("class","reviewCap",20); await w.flush();
  ok("class → 20: ONE update classes/c1/settings/study {reviewCap:20}", Wr().length===1&&JSON.stringify(Wr()[0])===JSON.stringify(["update","classes/c1/settings/study",{reviewCap:20}]), Wr());
  w.envClsSave("fam_k","reviewCap",0); await w.flush();
  ok("one student at 0 (all of them): update students/fam_k/settings/study {reviewCap:0}", JSON.stringify(Wr()[1])===JSON.stringify(["update","students/fam_k/settings/study",{reviewCap:0}]));
  w._envcs.stuOpen="fam_k"; ok("the student page: 'this student: 0 (all of them) · class: 20'", /this student: <b>0 \(all of them\)<\/b> · class: 20/.test(w.envClsStudentHtml("fam_k")));
  w.envClsSave("fam_k","reviewCap",null); await w.flush();
  ok("✕ use the class's → {reviewCap:null}", JSON.stringify(Wr()[2])===JSON.stringify(["update","students/fam_k/settings/study",{reviewCap:null}]));
  const n=Wr().length; ok("201 is refused, nothing written", w.envClsSave("class","reviewCap",201)===false&&Wr().length===n);
  w._envcs.locks={reviewCap:true}; w.envClsSave("class","reviewCap",5); await w.flush();
  ok("Adrienne's 🔒 on it: the teacher's save is refused; the row shows greyed '🔒 set by Adrienne'", Wr().length===n&&/Reviews a sitting 🔒[\s\S]*set by Adrienne/.test(w.envClsPanelHtml()));
  const a=liveConsole("admin"); a._envcs.locks={reviewCap:true}; a.envClsSave("class","reviewCap",5); await a.flush();
  ok("…Adrienne's own save goes through", JSON.stringify(a.G.writes[0])===JSON.stringify(["update","classes/c1/settings/study",{reviewCap:5}])); }

console.log("\n── the kid: who reviews in the sitting ──");
{ const w=demo("kid"), s=w.E.mstSessions(K).find(x=>x.sid===SID), own=w.masteryData[K+"_sessions"][SID];
  ok("demo Maya's 🌿 session: reviewIn 'sitting', reviewCap 0 (all of them) — and her own session record gains nothing", s.reviewIn==="sitting"&&s.reviewCap===0&&own.reviewIn===undefined&&own.reviewCap===undefined);
  ok("mixInAt / handOffAt are left as they were (weekly / every 2 weeks)", s.mixInAt==="weekly"&&s.handOffAt==="bi_weekly");
  const lad=w.E.mastDrillSettings().ladder, it=t=>({id:"x",subject:s.decks[0],status:"active",tier:t});
  ok("mstOwns: the sitting owns every active card on every rung below graduated; graduated and parked are not", ["daily","every_other_day","weekly","bi_weekly","monthly"].every(t=>w.E.mstOwns(s,it(t),lad))&&!w.E.mstOwns(s,it("graduated"),lad)&&!w.E.mstOwns(s,Object.assign(it("weekly"),{status:"parked"}),lad)&&!w.E.mstOwns(s,Object.assign(it("weekly"),{subject:"Not a deck"}),lad));
  ok("…a learning card still belongs to it (as before)", w.E.mstOwns(s,{id:"y",subject:s.decks[0],status:"introduction",tier:"daily"},lad));
  ok("mstOwnedIds holds every active non-graduated card of hers (nothing left for a drill)", items(w).filter(i=>i.status==="active"&&i.tier!=="graduated").every(i=>w.E.mstOwnedIds(K).has(i.id))); }
{ const p=demo("parent");
  ok("the demo's parent view: the same (the kid's app runs on that login too)", p.E.mstSessions(K)[0].reviewIn==="sitting"); }
{ const t=liveConsole("teacher"); t._envs.kid="k"; t.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:["D"]}};
  ok("a live teacher login never gets reviewIn (only kid / parent logins)", t.E.mstSessions("k")[0].reviewIn===undefined&&!("reviewIn" in t.E.mstSessions("k")[0]));
  const a=liveConsole("admin"); a._envs.kid="k"; a.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:["D"]}};
  ok("…nor an admin login", !("reviewIn" in a.E.mstSessions("k")[0])); }
{ const w=W(); w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; w.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:["D"]},other:{name:"Mix",kind:"mix"}};
  const S=w.E.mstSessions("k");
  ok("a live kid login before the class's settings arrive: 'sitting' already (the default needs no read), cap 0", S[0].reviewIn==="sitting"&&S[0].reviewCap===0);
  ok("…a Daily Mix session gets nothing", !("reviewIn" in S[1]));
  ok("another kid on the same device gets nothing", (w.masteryData.z_sessions={envirothon:{name:"E",kind:"deck",decks:["D"]}}, !("reviewIn" in w.E.mstSessions("z")[0])));
  w._envcs.loaded=true; w._envcs.kcls={study:{reviewCap:15}}; w._envcs.kstu={study:{reviewCap:8}};
  ok("once loaded: the class's 15, this student's 8 wins", w.E.mstSessions("k")[0].reviewCap===8);
  w._envcs.kstu={study:{reviewCap:"lots"}}; ok("a bad stored value is skipped (the class's 15)", w.E.mstSessions("k")[0].reviewCap===15);
  w.masteryData.k_sessions.u2={name:"Second unit",kind:"deck",decks:["E"]};
  ok("a second unit's deck session (no ENVCLASSSET overlay) reviews in the sitting too, with the class's cap", w.E.mstSessions("k").find(x=>x.sid==="u2").reviewIn==="sitting"&&w.E.mstSessions("k").find(x=>x.sid==="u2").reviewCap===15); }

console.log("\n── demo Maya's 🌿: weekly and every-2-weeks cards come up as reviews ──");
const deckSet=w=>new Set(w.E.mstSessions(K).find(x=>x.sid===SID).decks);
{ const w=demo("kid"), c=demo("kid",{rev:false}), p=w.E.mstPile(K,SID,P0,null), pc=c.E.mstPile(K,SID,P0,null), D=deckSet(w);
  const want=items(w).filter(i=>D.has(i.subject)&&i.status==="active"&&i.tier!=="graduated"&&w.E.mastIsDue(i,P0)).map(i=>i.id).sort();
  const wk=items(w).filter(i=>i.tier==="weekly"||i.tier==="bi_weekly");
  ok("(the demo data) Maya has weekly and every-2-weeks cards", items(w).some(i=>i.tier==="weekly")&&items(w).some(i=>i.tier==="bi_weekly"), wk.map(i=>i.id));
  ok("with CPREVIEW: every active card due on her session's decks is a review — weekly, every 2 weeks and monthly included", JSON.stringify(p.reviews.map(i=>i.id).sort())===JSON.stringify(want)&&wk.every(i=>p.reviews.some(r=>r.id===i.id))&&p.reviews.some(i=>i.tier==="monthly"), p.reviews.map(i=>i.id+":"+i.tier));
  ok("without it (the control): only the cards below weekly — none of the weekly / every-2-weeks ones", pc.reviews.length>0&&pc.reviews.every(i=>["daily","every_other_day"].indexOf(i.tier)>=0)&&!pc.reviews.some(i=>wk.some(x=>x.id===i.id)), pc.reviews.map(i=>i.id+":"+i.tier));
  ok("…the reviews come oldest due first, as before; learning and new cards are the same either way", JSON.stringify(p.learning.map(i=>i.id))===JSON.stringify(pc.learning.map(i=>i.id))&&JSON.stringify(p.newNames)===JSON.stringify(pc.newNames));
  ok("no cap (0) → the pile has no Keep-going fields", !("reviewLeft" in p)&&!("reviewCap" in p)&&w.R.cpReviewMoreHtml({},p,"start")===""); }

console.log("\n── Reviews a sitting: the oldest due first, then Keep going ──");
{ const w=demo("kid"); w._envc.cls.settings={study:{reviewCap:3}};
  const D=deckSet(w); let n=0; items(w).forEach(i=>{ if(D.has(i.subject)&&i.status==="active"&&i.tier!=="daily"&&i.tier!=="graduated") i.next_due=P0-(++n); });   // different due days: the last one set is the oldest
  const due=items(w).filter(i=>D.has(i.subject)&&i.status==="active"&&i.tier!=="graduated"&&w.E.mastIsDue(i,P0)), total=due.length;
  const p=w.E.mstPile(K,SID,P0,null), nd=i=>i.next_due!=null?i.next_due:-1, oldest=due.slice().sort((a,b)=>nd(a)-nd(b)||(a.id<b.id?-1:1)).slice(0,3).map(i=>i.id).sort();
  ok("(the data) more reviews due than the cap", total>3, total);
  ok("the class's 3: the sitting holds the 3 oldest due; reviewLeft = all "+total+" due, reviewCap 3", p.reviews.length===3&&JSON.stringify(p.reviews.map(i=>i.id).sort())===JSON.stringify(oldest)&&p.reviewLeft===total&&p.reviewCap===3, {got:p.reviews.map(i=>i.id),oldest});
  ok("the start line: '3 of "+total+" reviews due — done at 3, keep going if you like'", new RegExp("3 of "+total+" reviews due — done at 3, keep going if you like").test(w.R.cpReviewMoreHtml({sid:SID},p,"start")));
  ok("learning and new cards are not cut by it", (()=>{ const c=demo("kid",{rev:false}).E.mstPile(K,SID,P0,null); return JSON.stringify(c.learning.map(i=>i.id))===JSON.stringify(p.learning.map(i=>i.id))&&c.newNames.length===p.newNames.length; })());
  const s1=w.E.study(K,SID,P0);
  const p2=w.E.mstPile(K,SID,P0,s1.log);
  ok("after the sitting is saved: the next 3, none of the first 3 again; "+(total-3)+" left", p2.reviews.length===Math.min(3,total-3)&&!p2.reviews.some(i=>s1.pile.reviews.some(r=>r.id===i.id))&&p2.reviewLeft===total-3&&p2.newNames.length===0, p2.reviews.map(i=>i.id));
  ok("the done screen offers 'Keep going · "+(total-3)+" left' (mstStart: the same save)", new RegExp("onclick=\"mstStart\\(\\)\"[^>]*>Keep going · "+(total-3)+" left</button>").test(w.R.cpReviewMoreHtml({sid:SID},p2,"done"))&&/Today’s reviews are done ✓/.test(w.R.cpReviewMoreHtml({sid:SID},p2,"done")));
  let log=s1.log, rounds=1; while(true){ const q=w.E.mstPile(K,SID,P0,log); if(!q.reviews.length) break; const s=w.E.study(K,SID,P0,null,log); log={items:log.items.concat(s.log.items)}; if(++rounds>50) break; }
  const pe=w.E.mstPile(K,SID,P0,log);
  ok("Keep going until none are left: every one of the "+total+" got reviewed, then no button", rounds===Math.ceil(total/3)&&pe.reviews.length===0&&w.R.cpReviewMoreHtml({sid:SID},pe,"done")===""&&due.every(i=>log.items.some(e=>e.id===i.id&&e.result==="c")), rounds); }

console.log("\n── a card a drill graded today isn't asked again ──");
{ const w=demo("kid"), wk=items(w).find(i=>i.tier==="weekly"), before=w.E.mstPile(K,SID,P0,null);
  w.E.drill(K,[wk.id],P0,"c");
  const after=w.E.mstPile(K,SID,P0,null);
  ok("a weekly card due today, graded ✓ in a drill → booked forward, gone from today's sitting", before.reviews.some(i=>i.id===wk.id)&&!after.reviews.some(i=>i.id===wk.id)&&wk.next_due>P0&&after.reviews.length===before.reviews.length-1); }

console.log("\n── learnedAt: what the final counts ──");
{ const w=demo("kid"), E=w.envt;
  ok("the site's kid: the section plan's learnedAt, else every 2 weeks", w.R.cpReviewLearnedAt(K,"soils")==="bi_weekly"&&w.R.CPR_LEARNED_DEF==="bi_weekly");
  const soilsCore=()=>{ const c=w.envtStatus?null:null; return E.envtStatus(w.unitStudies.nc_envirothon,K,"soils").post.core; };
  const base=soilsCore();
  w._envc.cls.settings={study:{handOffAt:"monthly"}};
  ok("moving 'Hands off to the drill at' to monthly no longer changes learned for the final", JSON.stringify(soilsCore())===JSON.stringify(base), [soilsCore(),base]);
  w._envs.cls.plan={soils:{learnedAt:"monthly"}};
  ok("the section plan's learnedAt monthly: only monthly+ cards count", soilsCore().learned<base.learned&&w.R.cpReviewLearnedAt(K,"soils")==="monthly", soilsCore());
  w._envs.cls.plan={soils:{learnedAt:"someday"}}; ok("a bad plan value → every 2 weeks", w.R.cpReviewLearnedAt(K,"soils")==="bi_weekly");
  delete w._envs.cls.plan;
  ok("not the site's kid → null (PR A's rule: the session's handOffAt)", w.R.cpReviewLearnedAt("someone_else","soils")===null); }

console.log("\n── THE REPLAY: 40 study days, every card right, no drill ──");
const replay=rev=>{ const w=demo("kid",{rev}), u=w.unitStudies.nc_envirothon, start=JSON.parse(JSON.stringify(items(w))), opened=[];
  for(let d=0;d<40;d++){ w.E.study(K,SID,P0+d); if(w.envt.envtStatus(u,K,"soils").post.open&&!opened.length) opened.push(d+1); }
  return {w,u,start,opened,end:items(w)}; };
{ const A=replay(), B=replay(false);
  const weekly0=A.start.filter(i=>i.tier==="weekly").map(i=>i.id), coreSoils=A.w.envt.envtStatus(A.u,K,"soils").post.core;
  const tierOf=(r,id)=>(r.end.find(i=>i.id===id)||{}).tier;
  const d0=demo("kid"), line0=d0.envt.envtCoreLine(K,"soils");
  ok("(the start) Maya has "+weekly0.length+" weekly cards; the Soils final is shut: '"+line0+"'", weekly0.length>0&&!d0.envt.envtStatus(d0.unitStudies.nc_envirothon,K,"soils").post.open&&/^Final opens when every core card is learned · \d+ of \d+$/.test(line0));
  ok("with CPREVIEW: every weekly card climbed to every 2 weeks or past — no drill ran", weekly0.every(id=>at(tierOf(A,id),"bi_weekly")), weekly0.map(id=>id+":"+tierOf(A,id)));
  ok("…and cards that started at every 2 weeks climbed to monthly", A.start.filter(i=>i.tier==="bi_weekly").every(i=>at(tierOf(A,i.id),"monthly")), A.start.filter(i=>i.tier==="bi_weekly").map(i=>i.id+":"+tierOf(A,i.id)));
  ok("…cards met for the first time in these 40 days reached weekly and past too", A.end.filter(i=>!A.start.some(s=>s.id===i.id)).some(i=>at(i.tier,"bi_weekly")), A.end.filter(i=>!A.start.some(s=>s.id===i.id)).map(i=>i.tier));
  ok("the Soils final opened on its own (day "+(A.opened[0]||"never")+"): every core card ("+coreSoils.total+") at every 2 weeks or past, nobody opened it", A.opened.length===1&&coreSoils.total>0&&coreSoils.learned===coreSoils.total&&!(A.w.masteryData.maya_tests.soils||{}).postOpen&&A.w.G.writes.length===0, {opened:A.opened,coreSoils});
  ok("without CPREVIEW (the control): every weekly card is still weekly after 40 days", weekly0.every(id=>tierOf(B,id)==="weekly"), weekly0.map(id=>id+":"+tierOf(B,id)));
  ok("…nothing new got past weekly, and the Soils final never opened", !B.end.filter(i=>!B.start.some(s=>s.id===i.id)).some(i=>at(i.tier,"bi_weekly"))&&!B.opened.length&&!B.w.envt.envtStatus(B.u,K,"soils").post.open); }

console.log("\n── Howe: Lincoln's 🌿 Envirothon session is not touched ──");
// a Howe kid (no edition), his 🌿 session with Envirothon decks; cards on every rung. Same world with and without the block.
const HOWE={familyId:"howe",roster:[]};
function howe(rev){ const w=W({rev,w:{fam:HOWE}}); const D=["General Concepts · Terms","Forestry · Terms"];
  w.masteryData.lincoln_sessions={envirothon:Object.assign({},w.ENV_SESSION,{decks:D,pattern:w.ENV_SESSION.pattern.slice()}),german:{name:"German",kind:"deck",decks:["German"]}};
  w.masteryData.lincoln_custom_items=[]; for(let i=1;i<=30;i++) D.concat(["German"]).forEach(d=>w.masteryData.lincoln_custom_items.push({cat:d,name:d+" #"+i,def:"x"}));
  const T=["daily","every_other_day","weekly","bi_weekly","monthly","graduated"]; w.masteryData.lincoln=[]; let n=0;
  D.concat(["German"]).forEach(d=>T.forEach((t,k)=>{ w.masteryData.lincoln.push({id:"L"+(++n),subject:d,prompt:d+" #"+(k+1),status:"active",tier:t,cycle:1,consecutive_correct:1,next_due:t==="daily"||t==="graduated"?undefined:0}); }));
  w.masteryData.lincoln.push({id:"L"+(++n),subject:D[0],prompt:D[0]+" #9",status:"introduction",tier:"daily",tally_dots:1,cycle:1});
  return w; }
{ const A=howe(), B=howe(false), J=x=>JSON.stringify(x);
  ok("the block is loaded in the Howe world (its functions exist) but the site is off", typeof A.R.cpReviewSession==="function"&&!A.envSiteOn());
  ok("mstSessions: byte-for-byte the same, no reviewIn / reviewCap key", J(A.E.mstSessions("lincoln"))===J(B.E.mstSessions("lincoln"))&&A.E.mstSessions("lincoln").every(s=>!("reviewIn" in s)&&!("reviewCap" in s)));
  const s=A.E.mstSessions("lincoln")[0], lad=A.E.mastDrillSettings().ladder;
  ok("mstOwns: the 🌿 still owns only the cards below weekly; weekly+ are not his sitting's", A.masteryData.lincoln.filter(i=>i.subject!=="German").every(i=>A.E.mstOwns(s,i,lad)===B.E.mstOwns(s,i,lad))&&!A.masteryData.lincoln.some(i=>i.tier==="weekly"&&A.E.mstOwns(s,i,lad)));
  ok("mstOwnedIds: the same set — his weekly / every-2-weeks / monthly Envirothon cards stay with Mom's drill", J([...A.E.mstOwnedIds("lincoln")].sort())===J([...B.E.mstOwnedIds("lincoln")].sort())&&A.masteryData.lincoln.filter(i=>["weekly","bi_weekly","monthly"].indexOf(i.tier)>=0).every(i=>!A.E.mstOwnedIds("lincoln").has(i.id)));
  ok("mstPile: the same pile, no Keep-going fields", J(A.E.mstPile("lincoln","envirothon",P0,null))===J(B.E.mstPile("lincoln","envirothon",P0,null))&&!("reviewLeft" in A.E.mstPile("lincoln","envirothon",P0,null)));
  let same=true, wkIn=false; for(let d=0;d<40;d++){ const a=A.E.study("lincoln","envirothon",P0+d), b=B.E.study("lincoln","envirothon",P0+d);
    if(J(a.pile)!==J(b.pile)) same=false; if(a.tiers.some(t=>["weekly","bi_weekly","monthly"].indexOf(t)>=0)) wkIn=true; }
  ok("40 study days for him: every day's pile identical with and without the block; no weekly+ card ever in his sitting", same&&!wkIn);
  ok("…and his cards end byte-for-byte the same", J(A.masteryData.lincoln)===J(B.masteryData.lincoln));
  A._envs.kid="lincoln"; A._envs.role="kid";
  ok("even with the site's kid fields set, no edition → no reviewIn, learnedAt null, no parent note", !("reviewIn" in A.E.mstSessions("lincoln")[0])&&A.R.cpReviewLearnedAt("lincoln","forestry")===null&&A.R.cpReviewOn("lincoln")===false&&A.R.cpReviewWhoNote("parent")==="");
  ok("the pure hooks hand back what they were given: cpReviewSession(…) is the same object, unchanged; cpReviewCapPile with no cap is the same pile", (()=>{ const o={kind:"deck",decks:[]}, c=J(o); const p={reviews:[1],learning:[],newNames:[]}; return A.R.cpReviewSession("lincoln","envirothon",{},o)===o&&J(o)===c&&A.R.cpReviewCapPile({reviewCap:0},p)===p; })());
  ok("…nothing was read or written", A.G.writes.length===0&&A.G.reads.length===0&&A.G.listeners.length===0); }
{ const A=W({w:{fam:HOWE,envt:true}}), B=W({rev:false,w:{fam:HOWE,envt:true}});
  [A,B].forEach(w=>{ w.unitStudies.nc_envirothon={id:"nc_envirothon",enrolled:{lincoln:true},decks:[{key:"Soils and Land Use · Terms",cards:[{name:"Loam",core:true},{name:"Humus",core:true}]}]}; w.masteryData.lincoln=[{id:"a",subject:"Soils and Land Use · Terms",prompt:"Loam",status:"active",tier:"bi_weekly"},{id:"b",subject:"Soils and Land Use · Terms",prompt:"Humus",status:"active",tier:"weekly"}];
    w.masteryData.lincoln_sessions={envirothon:{handOffAt:"weekly"}}; });
  const c=w=>w.envt.envtStatus(w.unitStudies.nc_envirothon,"lincoln","soils");
  ok("his final keeps PR A's rule: learned = his session's handOffAt (weekly here → both count), the same with and without the block", c(A)&&JSON.stringify(c(A).post.core)===JSON.stringify(c(B).post.core)&&c(A).post.core.learned===c(A).post.core.total); }

console.log("\n── the parent page: the reviews are in the sitting ──");
{ const w=demo("parent"); const h=w.G.content;
  ok("demo Parent ▸ How Maya is doing: 'Maya reviews in the 🌿 sitting on the student login …' — no PIN drill", /Maya reviews in the 🌿 sitting on the student login: every card comes back on the day it’s due, at every level, so there’s no drill for you to run\./.test(h)&&!/PIN to drill/.test(h));
  ok("the demo class has the teacher drilling too (who: both) → '… The teacher drills in class too.'", w._envs.who==="both"&&/no drill for you to run\. The teacher drills in class too\./.test(h));
  w._envs.who="parent"; w.renderAll();
  ok("who 'parent' (the old 'open the parent view with your PIN') → the new note, no teacher line", /Maya reviews in the 🌿 sitting/.test(w.G.content)&&!/PIN to drill/.test(w.G.content)&&!/The teacher drills in class too/.test(w.G.content));
  ok("the note uses the name, never a pronoun", !/\b(her|his|she|he|their)\b/i.test(w.R.cpReviewWhoNote("both"))); }

console.log("\n── the demo page (make_demo.js) carries it ──");
{ const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")), h=buildDemo(src,"test",LIB.tests);
  ok("the built demo holds the block and its hooks (the demo is index.html + the sample data)", h.indexOf("// CPREVIEW_START")>0&&(h.match(/🔁 CPREVIEW/g)||[]).length>=7); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
