/*
 * Node tests — 🧠 CPDRILLPARENT, PR 13 of the class platform (DESIGN_class_platform_2026-10-28.md §7(a) 2–3, §2, §9, §13 row 13, §14 Q5).
 * Her words 2026-10-28: "For the parent, I think they can get the option to pick per kid, and the default would be that it stays in the
 * student's own session. But the mom, if she knows her kid and wants to hand it off to a parent drill so the parent could get it, then the
 * drill would show up on her site, and then she would need to run it daily."
 *   · Where the block sits and how it hooks (6 typeof-guarded lines; the mstOwns case on CPREVIEW's same guarded line).
 *   · The switch "🧠 I'll drill the review cards with Maya": off by default, asks once, students/<sid>/review through envsWrite ("would
 *     write" in the demo), a teacher's hold reads "Set by the teacher", the live listener, the rule in SITE_RULES.json.
 *   · reviewIn "parent": the 🌿 sitting keeps everything below the hand-off level; every 2 weeks and up go to the parent's drill.
 *   · 🧠 Drill with Maya: the real reviews (mastDueItems on the session's decks), ✓ / ✗, graded through mastApplyScores exactly as Mom's
 *     drill grades, the same targeted fields mastSaveResults writes + mastery/history/<kid>/<date>, in the family's instance.
 *   · The parent PIN guards the switch and the drill once the family has one.
 *   · THE REPLAY: 30 study days, switch on, the parent drills every other day: the cards still climb, the sitting never sees a hand-off
 *     card, and switching back hands every card to the sitting with nothing lost. The control: the parent never drills → they stall.
 *   · Howe: Lincoln's sessions, ownership, drill and piles are byte-for-byte the same with the block as without it.
 * Uses the world from test_env_site.js through its one `o.rev` line (CPREVIEW + this block + the real engine).  run: node test_cp_drill_parent.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), PDR=cut("// CPDRILLPARENT_START","// CPDRILLPARENT_END");
// the REAL study engine, the REAL drill builder (mastDueItems + ENVDRILLFIRST) and the REAL ladder scoring, sliced from index.html.
// Stubs: no built-in banks, no dynamic deck (its default off), the school-day clock = G.pn.
const ENG=[constLine("MAST_TIER_INT"),constLine("MAST_LEARN_FLOOR"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores","mastDueItems","mastCustomDef"].map(fn),
  cut("// ENVDRILLFIRST_START","// ENVDRILLFIRST_END"),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return G.pn!=null?G.pn:400; } function mastPrintLogAppend(dt,pn){ if(db) db.ref(\"mastery/printLog\").transaction(()=>[{date:dt,num:pn}]); }",
  cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"),
  `let _pdN=0;
  function _pdStudy(kid,sid,pn){
    const pile=mstPile(kid,sid,pn,null), seen={reviews:pile.reviews.map(i=>({id:i.id,tier:i.tier})),learning:pile.learning.map(i=>i.id),newNames:pile.newNames.length}, _mk=masteryKid; masteryKid=kid;   // seen: as the sitting showed them (grading moves the items in place)
    let items=masteryData[kid]; if(!Array.isArray(items)) items=masteryData[kid]=Object.values(items||{});
    const scores={}; pile.reviews.forEach(i=>{ scores[i.id]="c"; }); pile.learning.forEach(i=>{ scores[i.id]="shown"; });
    pile.newNames.forEach(n=>{ const it={id:kid.slice(0,3)+"_n"+(++_pdN),subject:n.deck,type:n.deck.toLowerCase(),prompt:n.name,tier:"daily",review_mode:"flash",status:"introduction",drop_count:0,consecutive_correct:0,cycle:1,tally_dots:0}; items.push(it); scores[it.id]="shown"; });
    mastApplyScores(items,Object.keys(scores).map(id=>({id})),scores,pn,mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false});
    masteryKid=_mk; return seen;
  }
  G.eng={ mstSessions, mstOwns, mstOwnedIds, mstPile, mastDueItems, mastDrillSettings, mastIsDue, mastApplyScores, study:_pdStudy, setKid(k){ masteryKid=k; } };`].join("\n");
const PDX=PDR+"\nG.pdr={ _cpdr, CPDR_MEANS_HANDOFF, CPDR_FIELDS_SET, cpdrFields, cpdrOn, cpdrRecOf, cpdrHeld, cpdrMode, cpdrOwns, cpdrListen, cpdrPinSet, cpdrLocked, cpdrPinOk, cpdrUnlock, cpdrCanSwitch, cpdrAsk, cpdrCancel, cpdrSet, cpdrDecks, cpdrHandOff, cpdrLevel, cpdrDue, cpdrInfo, cpdrStart, cpdrFlip, cpdrGrade, cpdrPrev, cpdrLeave, cpdrApply, cpdrLive, cpdrWrite, cpdrSave, cpdrCardHtml, cpdrDrillHtml, cpdrWhoNote };";
// pdr false = the same world without this block (CPREVIEW + the engine): the control
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+(o.pdr===false?"":PDX)+"\n"+ENG},o.w||{})); w.E=w.G.eng; w.P=w.G.pdr||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", SID="envirothon", STU="ramirez_maya", P0=400, DAY=86400000;
const items=w=>w.masteryData[K], J=x=>JSON.stringify(x);
const LADDER=["every_other_day","weekly","bi_weekly","monthly","graduated"], at=(t,min)=>LADDER.indexOf(t)>=LADDER.indexOf(min);
const hand=t=>at(t,"bi_weekly");   // the default hand-off level and up
const lastW=w=>w._envs.writes[w._envs.writes.length-1];
// the parent of demo Maya turns the switch on, through the page: unlock with the PIN, ask, OK
function switchOn(w){ w.envsDemoGo("parent"); if(w.P.cpdrLocked()){ w.el("cpdr-pin","0329"); w.P.cpdrUnlock(); } w.P.cpdrAsk(); return w.P.cpdrSet(true); }
// one parent drill through the page: start, every card graded (✓ unless `grade` says), save
function parentDrill(w,grade){ w.envsDemoGo("parent"); if(!w.P.cpdrStart()) return null; const d=w.P._cpdr.drill, ids=d.ids.slice(), tiers={};
  ids.forEach(id=>{ tiers[id]=(items(w).find(i=>i.id===id)||{}).tier; }); ids.forEach(id=>w.P.cpdrGrade(grade?grade(id):"c")); if(ids.length) w.P.cpdrSave(); else w.P.cpdrLeave(); return {ids,tiers}; }

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPDRILLPARENT_START"), b=src.indexOf("// CPDRILLPARENT_END"), e=src.indexOf("// CPREVIEW_END");
  ok("CPDRILLPARENT exactly once, after CPREVIEW_END (other blocks may land between)", a>0&&b>a&&src.indexOf("// CPDRILLPARENT_START",a+1)<0&&e>0&&e<a);
  ok("the header names the design sections, PR 13, her words and the date", /§7\(a\)/.test(PDR)&&/§13 row 13/.test(PDR)&&/PR 13/.test(PDR)&&/the mom, if she knows her kid and\s*\/\/ wants to hand it off to a parent drill/.test(PDR)&&/2026-10-28/.test(PDR));
  ok("the block only declares (its one load step is a const: the guarded meaning update)", PDR.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l))&&/^const CPDR_FIELDS_SET=cpdrFields\(\);$/m.test(PDR));
  const code=PDR.replace(/^\/\/.*$/mg,"");
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code));
  ok("the database is touched in two places only: the listener (cpdrListen) and the family write (cpdrWrite); shared writes go through envsWrite", (code.match(/\.ref\(/g)||[]).length===2&&/sdb\.ref\("students\/"\+sid\+"\/review"\)\.on\("value"/.test(fn("cpdrListen"))&&/const r=db\.ref\(path\)/.test(fn("cpdrWrite"))&&/envsWrite\("students\/"\+sid\+"\/review",rec,"set"\)/.test(fn("cpdrSet")));
  ok("no renderAllSoon in the block (the listener redraws through envsReadShared's own combined redraw)", !/renderAllSoon/.test(code));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🧠 CPDRILLPARENT/.test(l));
  ok("6 tagged lines outside the block, every one typeof-guarded", hooks.length===6&&hooks.every(l=>/typeof cpdr\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  const owns=cut("function mstOwns(session, item, ladder) {","\n}\n");
  ok("mstOwns: the second case on CPREVIEW's same guarded line, only for a reviewIn \"parent\" session; the mix-in test after it untouched", /const tier = item\.tier \|\| "daily";\n  if \(typeof cpReviewOwns === "function" && session\.reviewIn === "sitting"\) return cpReviewOwns\(session, item, tier\); if \(typeof cpdrOwns === "function" && session\.reviewIn === "parent"\) return cpdrOwns\(session, item, tier, ladder\);[^\n]*\n  return mstTierIdx\(tier, ladder\) < mstTierIdx\(session\.mixInAt, ladder\);/.test(owns));
  ok("cpReviewSession: reviewIn = cpdrMode(kid) || \"sitting\"", /  s\.reviewIn=\(typeof cpdrMode==="function"&&cpdrMode\(kid\)\)\|\|"sitting";/.test(fn("cpReviewSession")));
  ok("cpReviewWhoNote: asks cpdrWhoNote after its own site / role guard", /return "";\n  if\(typeof cpdrWhoNote==="function"\)\{ const t=cpdrWhoNote\(who\); if\(t\) return t; \}/.test(fn("cpReviewWhoNote")));
  ok("envsReadShared: the listener after the class read, with that function's combined redraw", /go\(val\(s\)\)\);\n  if\(typeof cpdrListen==="function"\) cpdrListen\(sdb,re\);/.test(fn("envsReadShared")));
  const ph=fn("envsParentHtml");
  ok("envsParentHtml: the 🧠 card first on the home view; the 'pdrill' view ahead of boards / tips / settings", /else \{ if\(typeof cpdrCardHtml==="function"\) h\+=cpdrCardHtml\(kid\); h\+=envsStreakHtml\(s\);/.test(ph)&&/if\(v==="pdrill"&&typeof cpdrDrillHtml==="function"\) h\+=cpdrDrillHtml\(kid\);[^\n]*\n  else if\(v==="boards"\)/.test(ph));
  ok("test_env_site.js is not touched by this PR (the world comes in through its existing `o.rev` line)", (fs.readFileSync(path.join(REPO,"test_env_site.js"),"utf8").match(/cpdr|CPDRILLPARENT/g)||[]).length===0); }

console.log("\n── the rule: students/<sid>/review ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), r=R.rules.students.$sid.review;
  ok("SITE_RULES.json: students/$sid/review has a write and a validate", r&&typeof r[".write"]==="string"&&typeof r[".validate"]==="string");
  ok("…written by Adrienne, the class's teacher, or a PARENT login of this family (familyId prefix + role parent)", /admins\/'\+auth\.uid\)\.val\(\) == true/.test(r[".write"])&&/\/teacher'\)\.val\(\) == auth\.uid/.test(r[".write"])&&/\$sid\.beginsWith\(root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)/.test(r[".write"])&&/logins\/'\+auth\.uid\+'\/role'\)\.val\(\) == 'parent'/.test(r[".write"]));
  ok("…a teacher's or Adrienne's 'sitting' holds against the parent", /!\(data\.child\('mode'\)\.val\(\) == 'sitting' && \(data\.child\('role'\)\.val\(\) == 'teacher' \|\| data\.child\('role'\)\.val\(\) == 'admin'\)\)/.test(r[".write"]));
  ok("…the shape: mode sitting | parent, by = the writer, at a number, role matching who wrote it, a short note", /hasChildren\(\['mode','by','role','at'\]\)/.test(r[".validate"])&&/'sitting' \|\| newData\.child\('mode'\)\.val\(\) == 'parent'/.test(r[".validate"])&&/newData\.child\('by'\)\.val\(\) == auth\.uid/.test(r[".validate"])&&/role'\)\.val\(\) == 'parent' && root\.child\('logins/.test(r[".validate"])&&/length <= 200/.test(r[".validate"])); }

console.log("\n── the default: every review in Maya's own 🌿 sitting ──");
{ const w=demo("kid"), s=w.E.mstSessions(K).find(x=>x.sid===SID);
  ok("no record → reviewIn 'sitting' (CPREVIEW's default), cpdrMode null", s.reviewIn==="sitting"&&w.P.cpdrMode(K)===null&&w.P.cpdrInfo(K).mode==="sitting");
  ok("the parent's drill is empty", w.P.cpdrDue(K,P0).length===0);
  w.envsDemoGo("parent"); const h=w.G.content;
  ok("Parent ▸ How Maya is doing: the 🧠 Review cards card first, the switch off, 'Off: Maya reviews every card in the 🌿 sitting'", h.indexOf("🧠 Review cards")>0&&h.indexOf("🧠 Review cards")<h.indexOf("Stations · the same numbers")&&/role="switch" aria-checked="false"/.test(h)&&/I’ll drill the review cards with Maya/.test(h)&&/Off: Maya reviews every card in the 🌿 sitting\. Turn it on to drill the every 2 weeks and up cards with Maya yourself, every study day\./.test(h));
  ok("…locked by the PIN in the demo (the switch greyed, a PIN box, 'Demo PIN: 0329'); the Who drills note is CPREVIEW's", /role="switch" aria-checked="false" disabled/.test(h)&&/id="cpdr-pin"/.test(h)&&/Demo PIN: 0329/.test(h)&&/Maya reviews in the 🌿 sitting on the student login/.test(h));
  ok("the kid's page has no switch", (w.envsDemoGo("kid"), !/I’ll drill the review cards/.test(w.G.content))&&w.P.cpdrCardHtml(K)===""); }

console.log("\n── the parent PIN ──");
{ const w=demo("parent");
  ok("locked: ask, set and start all refuse, nothing written", w.P.cpdrLocked()&&w.P.cpdrAsk()===false&&w._envs.writes.length===0&&w.P.cpdrStart()===false);
  const n0=w._envs.writes.length; await w.P.cpdrSet(true); ok("…cpdrSet(true) refused too", w._envs.writes.length===n0&&w.P.cpdrMode(K)===null);
  w.el("cpdr-pin","1111"); ok("a wrong PIN: 'That PIN isn’t right.', still locked", w.P.cpdrUnlock()===false&&w.P.cpdrLocked()&&w.G.els["envs-toast"]===undefined||w.P.cpdrLocked());
  w.el("cpdr-pin","0329"); ok("the right PIN unlocks for the page (the switch is live)", w.P.cpdrUnlock()===true&&!w.P.cpdrLocked()&&/role="switch" aria-checked="false" onclick="cpdrAsk\(\)"/.test(w.G.content)&&!/id="cpdr-pin"/.test(w.G.content)); }
{ const w=W(); w._envs.role="parent";
  ok("live, no PIN set by the family → no gate, and a line saying where to set one", !w.P.cpdrPinSet()&&!w.P.cpdrLocked());
  w.HA_LS.setItem("ha_app_pin","4321"); ok("once the family has a PIN (⚙️ Parent PIN) → locked until it's typed", w.P.cpdrPinSet()&&w.P.cpdrLocked());
  w._envs.role="kid"; ok("a kid login is never 'locked' (it has no switch at all)", !w.P.cpdrLocked()); }

console.log("\n── the switch on: asks once, writes students/<sid>/review ──");
{ const w=demo("parent"); w.el("cpdr-pin","0329"); w.P.cpdrUnlock();
  ok("tap → the question, before anything is written", w.P.cpdrAsk()===true&&w._envs.writes.length===0&&/You’ll need to drill Maya’s review cards every study day\. Maya’s teacher sees when it’s not getting done\./.test(w.G.content)&&/onclick="cpdrSet\(true\)">OK</.test(w.G.content)&&/>Not now</.test(w.G.content));
  w.P.cpdrCancel(); ok("Not now → back to off, nothing written", w._envs.writes.length===0&&!w.P._cpdr.asking&&w.P.cpdrMode(K)===null);
  w.P.cpdrAsk(); await w.P.cpdrSet(true); await w.flush();
  ok("OK → ONE write through envsWrite: set students/ramirez_maya/review {mode:'parent', by, role:'parent', at} — 'would write', nothing real", w._envs.writes.length===1&&J(lastW(w))===J({op:"set",path:"students/"+STU+"/review",val:{mode:"parent",by:"uid_p_maya",role:"parent",at:w.G.now}})&&w.G.writes.length===0, w._envs.writes);
  ok("the switch reads on; Maya's session now reviewIn 'parent'", /role="switch" aria-checked="true" onclick="cpdrSet\(false\)"/.test(w.G.content)&&w.E.mstSessions(K).find(x=>x.sid===SID).reviewIn==="parent"&&w.P.cpdrMode(K)==="parent");
  ok("the card: 'Maya’s every 2 weeks and up cards come to you. Everything below that stays in Maya’s 🌿 sitting.' + 🧠 Drill with Maya · N due", /Maya’s every 2 weeks and up cards come to you\. Everything below that stays in Maya’s 🌿 sitting\./.test(w.G.content)&&/onclick="cpdrStart\(\)">🧠 Drill with Maya · \d+ due</.test(w.G.content));
  ok("the Who drills note says the reviews are the parent's", /Maya’s every 2 weeks and up review cards come to you: 🧠 Drill with Maya at the top of this page, every study day\. Everything below that stays in Maya’s 🌿 sitting\. The teacher drills in class too\./.test(w.G.content)&&!/no drill for you to run/.test(w.G.content));
  ok("the note uses the name, never a pronoun", !/\b(her|his|she|he|their)\b/i.test(w.P.cpdrWhoNote("both")+w.P.cpdrCardHtml(K).replace(/<[^>]*>/g,""))); }

console.log("\n── reviewIn 'parent': who owns which card ──");
{ const w=demo("kid"); await switchOn(w); w.envsDemoGo("kid");
  const s=w.E.mstSessions(K).find(x=>x.sid===SID), lad=w.E.mastDrillSettings().ladder, it=t=>({id:"x",subject:s.decks[0],status:"active",tier:t});
  ok("the 🌿 sitting owns daily, every other day and weekly; not every 2 weeks, monthly or graduated", ["daily","every_other_day","weekly"].every(t=>w.E.mstOwns(s,it(t),lad))&&["bi_weekly","monthly","graduated"].every(t=>!w.E.mstOwns(s,it(t),lad)));
  ok("…learning cards are still the sitting's; parked and other decks are nobody's here", w.E.mstOwns(s,{id:"y",subject:s.decks[0],status:"introduction",tier:"daily"},lad)&&!w.E.mstOwns(s,Object.assign(it("weekly"),{status:"parked"}),lad)&&!w.E.mstOwns(s,Object.assign(it("weekly"),{subject:"Not a deck"}),lad));
  const pile=w.E.mstPile(K,SID,P0,null), due=items(w).filter(i=>s.decks.indexOf(i.subject)>=0&&i.status==="active"&&w.E.mastIsDue(i,P0));
  ok("(the demo data) Maya has every-2-weeks and monthly cards due", due.some(i=>i.tier==="bi_weekly")&&due.some(i=>i.tier==="monthly"), due.map(i=>i.id+":"+i.tier));
  ok("Kid ▸ 🌿: the every-2-weeks and monthly cards are gone from the sitting; the weekly ones still come", pile.reviews.length>0&&!pile.reviews.some(i=>hand(i.tier))&&pile.reviews.some(i=>i.tier==="weekly"), pile.reviews.map(i=>i.id+":"+i.tier));
  const pd=w.P.cpdrDue(K,P0), want=due.filter(i=>hand(i.tier)&&!(w.masteryData[K+"_settings"].cat_hold||{})[i.subject]).map(i=>i.id).sort();
  ok("the parent's drill carries exactly the due cards at every 2 weeks and up (the real reviews, no extras, nothing below)", J(pd.map(i=>i.id).sort())===J(want)&&pd.every(i=>hand(i.tier)), pd.map(i=>i.id+":"+i.tier));
  ok("…it is the app's own builder: the same list mastDueItems builds, cut to the session's decks", J(pd.map(i=>i.id))===J(w.E.mastDueItems(K,P0).filter(i=>i.status==="active"&&s.decks.indexOf(i.subject)>=0).map(i=>i.id)));
  ok("cpdrInfo (for PR 17): mode parent, "+pd.length+" due", (w.G.pn=P0, J(w.P.cpdrInfo(K))===J({mode:"parent",held:false,due:pd.length}))); }
{ const w=demo("kid"); await switchOn(w); w._envc.cls.settings={study:{handOffAt:"monthly"}}; w.envsDemoGo("kid");
  const s=w.E.mstSessions(K).find(x=>x.sid===SID), pile=w.E.mstPile(K,SID,P0,null), pd=w.P.cpdrDue(K,P0);
  ok("the teacher moves 'Hands off to the drill at' to monthly → the every-2-weeks cards stay in the sitting, only monthly+ go to the parent", s.handOffAt==="monthly"&&pile.reviews.some(i=>i.tier==="bi_weekly")&&!pile.reviews.some(i=>i.tier==="monthly")&&pd.length>0&&pd.every(i=>at(i.tier,"monthly"))&&w.P.cpdrLevel(K)==="monthly and up"); }

console.log("\n── 🧠 Drill with Maya: ✓ / ✗, graded like Mom's drill ──");
{ const w=demo("kid"); await switchOn(w); w.G.pn=P0; w.envsDemoGo("parent");
  const before=JSON.parse(J(items(w))), n0=w._envs.writes.length;
  ok("Start → the drill view", w.P.cpdrStart()===true&&w._envs.view==="pdrill");
  const d=w.P._cpdr.drill, ids=d.ids.slice(), first=items(w).find(i=>i.id===ids[0]);
  ok("card 1 of "+ids.length+": the front, its deck, 'Show the answer', ✗ Missed / ✓ Right; no back yet", ids.length>=3&&new RegExp("1 of "+ids.length+" · ").test(w.G.content)&&w.G.content.indexOf(">"+first.prompt+"<")>0&&/>Show the answer</.test(w.G.content)&&/cpdrGrade\('m'\)">✗ Missed/.test(w.G.content)&&/cpdrGrade\('c'\)">✓ Right/.test(w.G.content)&&w.G.content.indexOf(first.answer)<0, ids);
  w.P.cpdrFlip(); ok("Show the answer → the back (the card's own definition)", w.G.content.indexOf(first.answer)>0);
  const plan={}; ids.forEach((id,k)=>{ plan[id]=k===1?"m":"c"; });
  w.P.cpdrGrade(plan[ids[0]]); ok("✓ → card 2, its back hidden again", new RegExp("2 of "+ids.length).test(w.G.content)&&w.G.content.indexOf(first.answer)<0);
  w.P.cpdrPrev(); ok("← Back → card 1 again, its grade shown ('was ✓')", /1 of \d+ · [^<]* · was ✓/.test(w.G.content));
  ids.forEach(id=>w.P.cpdrGrade(plan[id]));
  ok("all graded → 'All "+ids.length+" graded · "+(ids.length-1)+" ✓ · 1 ✗' + Save the drill; nothing written yet", new RegExp("All "+ids.length+" graded · "+(ids.length-1)+" ✓ · 1 ✗").test(w.G.content)&&/onclick="cpdrSave\(\)">Save the drill</.test(w.G.content)&&w._envs.writes.length===n0);
  // the reference: Mom's drill grading the same cards with the same marks (mastApplyScores on a copy)
  const ref=JSON.parse(J(before)); w.E.setKid(K); w.E.mastApplyScores(ref,ids.map(id=>({id})),plan,P0,w.E.mastDrillSettings(),{prevShown:new Set(),autoPull:false,chain:false});
  ok("Save →", w.P.cpdrSave()===true&&w._envs.view==="home");
  const W2=w._envs.writes.slice(n0);
  ok("two 'would write's through envsWrite: update mastery/maya, set mastery/history/maya/<today>; nothing real", W2.length===2&&W2[0].op==="update"&&W2[0].path==="mastery/"+K&&W2[1].op==="set"&&W2[1].path==="mastery/history/"+K+"/20261028"&&w.G.writes.length===0, W2.map(x=>x.op+" "+x.path));
  ok("every card ends exactly as Mom's drill would leave it", J(items(w))===J(ref));
  const fields=[...new Set([...fn("mastSaveResults").matchAll(/upd\[ix\+"\/(\w+)"\]/g)].map(m=>m[1]))].sort(), up=W2[0].val, idx=[...new Set(Object.keys(up).map(k=>k.split("/")[0]))];
  ok("the update is targeted: only the "+ids.length+" graded cards, the very fields mastSaveResults writes", idx.length===ids.length&&idx.every(ix=>ids.indexOf(items(w)[+ix].id)>=0)&&J([...new Set(Object.keys(up).map(k=>k.split("/")[1]))].sort())===J(fields.filter(f=>f!=="ww")), {fields,got:Object.keys(up).slice(0,14)});
  ok("…with each card's new tier and next date", idx.every(ix=>up[ix+"/tier"]===items(w)[+ix].tier&&up[ix+"/next_due"]===(items(w)[+ix].next_due??null)));
  const H=W2[1].val;
  ok("history: Mom's drill's record shape — date, printNum, total, scored, correct, miss, pct, items {id, prompt, result, oldTier}", H.date==="2026-10-28"&&H.printNum===P0&&H.total===ids.length&&H.scored===ids.length&&H.correct===ids.length-1&&H.miss===1&&H.pct===Math.round((ids.length-1)/ids.length*100)&&H.items.length===ids.length&&H.items.every(x=>ids.indexOf(x.id)>=0&&x.prompt&&(x.result==="c"||x.result==="m")&&x.oldTier===before.find(b=>b.id===x.id).tier), H);
  ok("the parent page: '✓ Saved: "+ids.length+" cards · "+(ids.length-1)+" ✓ · 1 ✗', nothing left due today", new RegExp("✓ Saved: "+ids.length+" cards · "+(ids.length-1)+" ✓ · 1 ✗").test(w.G.content)&&/✓ Nothing due today\./.test(w.G.content)&&w.P.cpdrDue(K,P0).length===0);
  ok("a card graded ✓ in the drill is not asked again in today's sitting either", (w.envsDemoGo("kid"), !w.E.mstPile(K,SID,P0,null).reviews.some(i=>ids.indexOf(i.id)>=0)));
  ok("the history is in memory for the page (and PR 17's watch)", w.masteryData.history[K]["20261028"]===H);
  // a second drill the same day merges
  const mc=items(w).find(i=>i.id===ids[0]); mc.next_due=P0;   // a ✓ card, still at every 2 weeks or up, due again
  w.envsDemoGo("parent"); w.P.cpdrStart(); w.P.cpdrGrade("c"); w.P.cpdrSave();
  const H2=lastW(w).val; ok("a second drill the same day merges into today's record (counts add, items append)", lastW(w).path==="mastery/history/"+K+"/20261028"&&H2.total===ids.length+1&&H2.correct===ids.length&&H2.items.length===ids.length+1&&H2.sessTimes.length===2, H2); }
{ const w=demo("kid"); await switchOn(w); w.G.pn=P0; w.envsDemoGo("parent"); w.P.cpdrStart(); w.P.cpdrGrade("c"); const n=w._envs.writes.length, b=J(items(w));
  w.P.cpdrLeave(); ok("✕ Leave before saving: nothing written, nothing changed, the cards stay due", w._envs.writes.length===n&&J(items(w))===b&&w.P.cpdrDue(K,P0).length>0&&w._envs.view==="home");
  w.P.cpdrStart(); ok("Save with nothing graded: refused", w.P.cpdrSave()===false&&w._envs.writes.length===n); }

console.log("\n── the switch off: the cards go back to the sitting, nothing lost ──");
{ const w=demo("kid"); await switchOn(w); w.G.pn=P0; const b=J(items(w));
  w.envsDemoGo("parent"); await w.P.cpdrSet(false); await w.flush();
  ok("off → set students/ramirez_maya/review {mode:'sitting', role:'parent'} (no confirm)", J(lastW(w).val)===J({mode:"sitting",by:"uid_p_maya",role:"parent",at:w.G.now})&&/role="switch" aria-checked="false"/.test(w.G.content));
  ok("the switch wrote nothing else and changed no card", w._envs.writes.length===2&&J(items(w))===b);
  w.envsDemoGo("kid"); const p=w.E.mstPile(K,SID,P0,null);
  ok("Kid ▸ 🌿: the every-2-weeks and monthly cards are back in the sitting; the parent's drill is empty", p.reviews.some(i=>i.tier==="bi_weekly")&&p.reviews.some(i=>i.tier==="monthly")&&w.P.cpdrDue(K,P0).length===0&&w.E.mstSessions(K)[0].reviewIn==="sitting"); }

console.log("\n── a teacher's hold ──");
{ const w=demo("parent"); w.el("cpdr-pin","0329"); w.P.cpdrUnlock();
  w.P._cpdr.revs[STU]={mode:"sitting",by:"uid_teacher_demo",role:"teacher",at:1,note:"Back to the sitting before the final."}; w.renderAll();
  ok("the card reads '🔒 Set by the teacher: Maya reviews every card in the 🌿 sitting.' + the note; no switch", /🔒 <b>Set by the teacher:<\/b> Maya reviews every card in the 🌿 sitting\. <i>Back to the sitting before the final\.<\/i>/.test(w.G.content)&&!/role="switch"/.test(w.G.content));
  await w.P.cpdrSet(true); ok("the parent can't switch it on; nothing written; the sitting keeps the reviews", w._envs.writes.length===0&&w.P.cpdrMode(K)===null&&w.P.cpdrAsk()===false&&w.P.cpdrHeld()&&w.P.cpdrInfo(K).held);
  w.P._cpdr.revs[STU]={mode:"parent",by:"uid_p_maya",role:"parent",at:1}; ok("(a parent's own 'parent' record is not a hold)", !w.P.cpdrHeld()&&w.P.cpdrMode(K)==="parent"); }

console.log("\n── live logins: the listener, the shared write, the family write ──");
const liveKid=(role,o)=>{ const w=W(o); w._envs.role=role; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.familyId="fam"; w._envs.uid="uid_p"; w._envs.dbUrl="https://x-fam.firebaseio.com";
  w.masteryData.k_sessions={envirothon:{name:"Envirothon",kind:"deck",decks:["D"],handOffAt:"bi_weekly"}};
  w.masteryData.k=[{id:"a",subject:"D",prompt:"Loam",answer:"A mix",status:"active",tier:"weekly",cycle:1,consecutive_correct:0,next_due:0},{id:"b",subject:"D",prompt:"Humus",answer:"Dark matter",status:"active",tier:"bi_weekly",cycle:1,consecutive_correct:0,next_due:0},{id:"c",subject:"D",prompt:"Silt",answer:"Fine bits",status:"active",tier:"monthly",cycle:1,consecutive_correct:2,next_due:0}];
  w.G.pn=P0; return w; };
{ const w=liveKid("parent",{w:{remote:{"students/fam_k/review":{mode:"parent",by:"uid_p",role:"parent",at:5}}}});
  w.envsReadShared();
  ok("a parent login: envsReadShared adds ONE listener on students/fam_k/review (the shared instance)", w.G.listeners.filter(l=>l.p==="students/fam_k/review").length===1&&w.P._cpdr.armed==="fam_k");
  ok("…its value arrives → reviewIn 'parent' at once", w.P.cpdrMode("k")==="parent"&&w.E.mstSessions("k")[0].reviewIn==="parent");
  w.envsReadShared(); ok("…a second read adds no second listener", w.G.listeners.filter(l=>l.p==="students/fam_k/review").length===1);
  ok("no PIN set → no gate; the card says where to set one", !w.P.cpdrLocked()&&/set a parent PIN in ⚙️/.test(w.P.cpdrCardHtml("k")));
  ok("the drill: the every-2-weeks and monthly cards (b, c), not the weekly one", J(w.P.cpdrDue("k").map(i=>i.id))===J(["b","c"]));
  w.initFb(); w.P.cpdrStart(); w.P.cpdrGrade("c"); w.P.cpdrGrade("m"); w.P.cpdrSave(); await w.flush();
  const fam=w.G.writes.filter(x=>/^mastery\//.test(x[1]));
  ok("Save: the family instance gets ONE update of mastery/k (cards 1 and 2 only), mastery/history/k/<today>, the printLog entry; nothing through the shared envsWrite", w.G.famDbUrl==="https://x-fam.firebaseio.com"&&fam.length===3&&fam[0][0]==="update"&&fam[0][1]==="mastery/k"&&J([...new Set(Object.keys(fam[0][2]).map(k=>k.split("/")[0]))].sort())===J(["1","2"])&&fam[1][0]==="set"&&fam[1][1]==="mastery/history/k/20261028"&&fam[2][1]==="mastery/printLog"&&w._envs.writes.length===0, w.G.writes.map(x=>x[0]+" "+x[1]));
  ok("…b ✓ kept its rung and moved its date; c ✗ dropped a rung", w.masteryData.k[1].tier==="bi_weekly"&&w.masteryData.k[1].next_due>P0&&w.masteryData.k[1].consecutive_correct===1&&w.masteryData.k[2].tier!=="monthly", w.masteryData.k);
  w.G.writes.length=0; await w.P.cpdrSet(false); await w.flush();
  ok("live switch off: set students/fam_k/review on the shared instance {mode:'sitting', by:'uid_p', role:'parent', at}", w.G.writes.length===1&&J(w.G.writes[0])===J(["set","students/fam_k/review",{mode:"sitting",by:"uid_p",role:"parent",at:w.G.now}])); }
{ const w=liveKid("parent",{w:{dry:true}}); w.P._cpdr.revs.fam_k={mode:"parent",by:"uid_p",role:"parent",at:1}; w.initFb(); w.P.cpdrStart(); w.P.cpdrGrade("c"); w.P.cpdrGrade("c"); w.P.cpdrSave(); await w.flush();
  ok("?dryrun=1: the drill grades in memory, writes nothing anywhere", w.G.writes.length===0&&w._envs.writes.length===0&&w.masteryData.k[1].next_due>P0); }
{ const w=liveKid("parent"); w.HA_LS.setItem("ha_app_pin","0329"); w.P._cpdr.revs.fam_k={mode:"parent",by:"uid_p",role:"parent",at:1};
  ok("live with a family PIN: the drill won't start until it's typed", w.P.cpdrStart()===false&&/id="cpdr-pin"/.test(w.P.cpdrCardHtml("k"))&&!/Demo PIN/.test(w.P.cpdrCardHtml("k")));
  w.el("cpdr-pin","1234"); w.P.cpdrUnlock(); ok("…a wrong one keeps it shut", w.P.cpdrStart()===false); w.el("cpdr-pin","0329"); w.P.cpdrUnlock(); ok("…typed: it starts", w.P.cpdrStart()===true); }
{ const w=liveKid("kid",{w:{remote:{"students/fam_k/review":{mode:"parent",by:"uid_p",role:"parent",at:5}}}}); w.envsReadShared();
  ok("a kid login: the same listener; its 🌿 hands the every-2-weeks+ cards to the parent", w.G.listeners.some(l=>l.p==="students/fam_k/review")&&w.E.mstSessions("k")[0].reviewIn==="parent"&&J(w.E.mstPile("k","envirothon",P0,null).reviews.map(i=>i.id))===J(["a"]));
  ok("…but a kid can't switch or drill", w.P.cpdrCanSwitch()===false&&w.P.cpdrStart()===false&&w.P.cpdrCardHtml("k")==="");
  w.G.listeners.find(l=>l.p==="students/fam_k/review").fn({val:()=>null});
  ok("the record removed (or the switch off elsewhere) → back to the sitting without a reload", w.E.mstSessions("k")[0].reviewIn==="sitting"&&J(w.E.mstPile("k","envirothon",P0,null).reviews.map(i=>i.id).sort())===J(["a","b","c"])); }
["teacher","admin"].forEach(role=>{ const w=liveKid(role); w.envsReadShared();
  ok("a "+role+" login: no listener, no lane", w.P.cpdrListen(w.firebase.database(),()=>{})===false&&!w.G.listeners.some(l=>l.p==="students/fam_k/review")&&w.P.cpdrMode("k")===null); });

console.log("\n── THE REPLAY: 30 study days, switch on, the parent drills every other day ──");
const replay=parentDrills=>{
  const w=demo("kid"); switchOn(w); w.envsDemoGo("kid");
  const start=JSON.parse(J(items(w))), seenSitting=[], seenParent=[], drills=[];
  for(let d=0;d<30;d++){ w.G.now=Date.UTC(2026,9,28,15)+d*DAY; w.G.pn=P0+d; w.envsDemoGo("kid");
    const p=w.E.study(K,SID,P0+d); p.reviews.forEach(i=>seenSitting.push(i.tier));
    if(parentDrills&&d%2===0){ const r=parentDrill(w); if(r){ drills.push(r.ids.length); Object.values(r.tiers).forEach(t=>seenParent.push(t)); } } }
  return {w,start,seenSitting,seenParent,drills};
};
{ const A=replay(true), B=replay(false), tierOf=(r,id)=>(items(r.w).find(i=>i.id===id)||{}).tier;
  const bi0=A.start.filter(i=>i.tier==="bi_weekly").map(i=>i.id), mo0=A.start.filter(i=>i.tier==="monthly").map(i=>i.id), wk0=A.start.filter(i=>i.tier==="weekly").map(i=>i.id);
  ok("(the start) Maya has "+bi0.length+" every-2-weeks, "+mo0.length+" monthly and "+wk0.length+" weekly cards", bi0.length>0&&mo0.length>0&&wk0.length>0);
  ok("15 parent drills ran (every other day), each with the cards due that day — "+A.drills.join(","), A.drills.length===15&&A.drills.some(n=>n>0));
  ok("in 30 days the 🌿 sitting never once held an every-2-weeks-or-higher card", A.seenSitting.length>0&&!A.seenSitting.some(hand), [...new Set(A.seenSitting)]);
  ok("…and the parent's drill never held a card below every 2 weeks", A.seenParent.length>0&&A.seenParent.every(hand), [...new Set(A.seenParent)]);
  ok("the cards still climb: every every-2-weeks card reached monthly or past", bi0.every(id=>at(tierOf(A,id),"monthly")), bi0.map(id=>id+":"+tierOf(A,id)));
  ok("…the monthly cards climbed on (graduated) or held monthly; none fell", mo0.every(id=>at(tierOf(A,id),"monthly"))&&mo0.some(id=>tierOf(A,id)==="graduated"), mo0.map(id=>id+":"+tierOf(A,id)));
  ok("…the weekly cards climbed through the sitting to every 2 weeks and were handed over", wk0.every(id=>at(tierOf(A,id),"bi_weekly")), wk0.map(id=>id+":"+tierOf(A,id)));
  ok("the control (switch on, the parent never drills): the every-2-weeks cards stall where they were — the drill is what moves them", bi0.every(id=>tierOf(B,id)==="bi_weekly")&&!B.seenSitting.some(hand), bi0.map(id=>id+":"+tierOf(B,id)));
  ok("…the sitting still climbs its own cards up to the hand-off in the control", wk0.every(id=>at(tierOf(B,id),"bi_weekly")));
  ok("the demo wrote only 'would write's: the switch once, then the drills' cards + history", A.w.G.writes.length===0&&A.w._envs.writes.filter(x=>/review$/.test(x.path)).length===1&&A.w._envs.writes.filter(x=>/^mastery\/history\//.test(x.path)).length===A.drills.filter(n=>n>0).length);
  // switch back at day 30: nothing lost, the sitting takes them all
  const snap=J(items(A.w)); A.w.envsDemoGo("parent"); await A.w.P.cpdrSet(false);
  ok("switch off on day 30: every card keeps its level, streak and date (the switch moves no card)", J(items(A.w))===snap&&A.w.P.cpdrMode(K)===null);
  const handed=items(A.w).filter(i=>i.status==="active"&&hand(i.tier)&&i.tier!=="graduated").map(i=>i.id), seen=new Set(), after=[];
  for(let d=30;d<60;d++){ A.w.G.now=Date.UTC(2026,9,28,15)+d*DAY; A.w.G.pn=P0+d; A.w.envsDemoGo("kid"); const p=A.w.E.study(K,SID,P0+d); p.reviews.forEach(i=>{ seen.add(i.id); after.push(i.tier); });
    if(A.w.P.cpdrDue(K,P0+d).length) seen.add("PARENT_DUE"); }
  ok("the next 30 days, sitting only: every card that was the parent's ("+handed.length+") came back to the 🌿 sitting on its day", handed.length>0&&handed.every(id=>seen.has(id)), handed.filter(id=>!seen.has(id)));
  ok("…the sitting carried every-2-weeks and monthly reviews again, and the parent's drill stayed empty", after.some(t=>t==="bi_weekly")&&after.some(t=>t==="monthly")&&!seen.has("PARENT_DUE"));
  ok("…and none of them lost ground: each is at its day-30 level or higher", handed.every(id=>LADDER.indexOf(tierOf(A,id))>=LADDER.indexOf(JSON.parse(snap).find(i=>i.id===id).tier)), handed.map(id=>id+":"+tierOf(A,id))); }

console.log("\n── Howe: Lincoln is not touched ──");
const HOWE={familyId:"howe",roster:[]};
function howe(pdr){ const w=W({pdr,w:{fam:HOWE}}); const D=["General Concepts · Terms","Forestry · Terms"];
  w.unitStudies.nc_envirothon={id:"nc_envirothon",enrolled:{lincoln:true},decks:D.map(k=>({key:k,cards:[]}))};
  w.masteryData.lincoln_sessions={envirothon:Object.assign({},w.ENV_SESSION,{decks:D,pattern:w.ENV_SESSION.pattern.slice()}),german:{name:"German",kind:"deck",decks:["German"]}};
  w.masteryData.lincoln_custom_items=[]; for(let i=1;i<=30;i++) D.concat(["German"]).forEach(d=>w.masteryData.lincoln_custom_items.push({cat:d,name:d+" #"+i,def:"x"}));
  const T=["daily","every_other_day","weekly","bi_weekly","monthly","graduated"]; w.masteryData.lincoln=[]; let n=0;
  D.concat(["German"]).forEach(d=>T.forEach((t,k)=>{ w.masteryData.lincoln.push({id:"L"+(++n),subject:d,prompt:d+" #"+(k+1),status:"active",tier:t,cycle:1,consecutive_correct:1,next_due:t==="daily"||t==="graduated"?undefined:0}); }));
  return w; }
{ const A=howe(), B=howe(false);
  A._envs.kid="lincoln"; A._envs.role="parent"; A._envs.sid="howe_lincoln"; A.P._cpdr.revs.howe_lincoln={mode:"parent",by:"x",role:"parent",at:1};   // even a stray record for him
  ok("the block is loaded in the Howe world but the site is off", typeof A.P.cpdrMode==="function"&&!A.envSiteOn());
  ok("cpdrMode null, no card, no listener, no due list for him", A.P.cpdrMode("lincoln")===null&&A.P.cpdrCardHtml("lincoln")===""&&A.P.cpdrListen(A.firebase.database(),()=>{})===false&&A.P.cpdrDue("lincoln",P0).length===0&&A.P.cpdrWhoNote("both")==="");
  ok("mstSessions: byte-for-byte the same (no reviewIn)", J(A.E.mstSessions("lincoln"))===J(B.E.mstSessions("lincoln"))&&A.E.mstSessions("lincoln").every(s=>!("reviewIn" in s)));
  const s=A.E.mstSessions("lincoln")[0], lad=A.E.mastDrillSettings().ladder;
  ok("mstOwns / mstOwnedIds: the same — his weekly+ Envirothon cards stay with Mom's drill", A.masteryData.lincoln.every(i=>A.E.mstOwns(s,i,lad)===B.E.mstOwns(s,i,lad))&&J([...A.E.mstOwnedIds("lincoln")].sort())===J([...B.E.mstOwnedIds("lincoln")].sort()));
  ok("Mom's drill builder (mastDueItems): the same list", J(A.E.mastDueItems("lincoln",P0).map(i=>i.id))===J(B.E.mastDueItems("lincoln",P0).map(i=>i.id))&&A.E.mastDueItems("lincoln",P0).some(i=>i.tier==="weekly"));
  let same=true; for(let d=0;d<30;d++){ const a=A.E.study("lincoln","envirothon",P0+d), b=B.E.study("lincoln","envirothon",P0+d); if(J(a)!==J(b)) same=false; }
  ok("30 study days: every pile identical, his cards end byte-for-byte the same", same&&J(A.masteryData.lincoln)===J(B.masteryData.lincoln));
  ok("cpdrOwns hands back false for any session that isn't reviewIn 'parent'", !A.P.cpdrOwns(s,A.masteryData.lincoln[0],"daily",lad)&&!A.P.cpdrOwns({reviewIn:"sitting",handOffAt:"bi_weekly"},{status:"active",tier:"daily"},"daily",lad));
  ok("nothing was read or written", A.G.writes.length===0&&A.G.reads.length===0&&A.G.listeners.length===0&&A._envs.writes.length===0); }

console.log("\n── ⚙️ Class settings: what 'Hands off to the drill at' means now ──");
{ const w=demo("teacher"), f=w.ENVCS_FIELDS.find(x=>x.name==="handOffAt");
  ok("the row says it's where a card goes to the parent's drill, and that learned is the section's level", f.means===w.P.CPDR_MEANS_HANDOFF&&/parent’s drill when a parent takes a student’s reviews over/.test(f.means)&&/Every 2 weeks unless the section plan says otherwise/.test(f.means)&&w.P.CPDR_FIELDS_SET===true); }

console.log("\n── the demo page (make_demo.js) carries it ──");
{ const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")), h=buildDemo(src,"test",LIB.tests);
  ok("the built demo holds the block and its 6 hooks", h.indexOf("// CPDRILLPARENT_START")>0&&(h.match(/🧠 CPDRILLPARENT/g)||[]).length>=6); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
