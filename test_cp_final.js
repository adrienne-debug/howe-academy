/*
 * Node tests — 📝 CPFINAL, PR 7 of the class platform (DESIGN_class_platform_2026-10-28.md §7(f), §5.1, §12, §13 row 7, §14 Q6). The gap:
 * PR A's "the final opens when EVERY core card is learned" never fires on its own, because a miss sends a card back down and a station
 * levels off at about 80–93 % learned. The fix: a section plan per class, classes/<cid>/plan/<key> = {finalAt, pass, retakeHours, checkin,
 * learnedAt}, and the final opens at 85 % of the core cards by default.
 *   · Where the block sits and how it hooks (typeof-guarded one-line hooks, every one tagged).
 *   · The pure plan: defaults (85 / 80 / 24 h / check-in on / every 2 weeks), bad values read the default, Save sends the changed leaves only.
 *   · The demo kid: Soils "Final opens at 85% · 3 of 4" on Scores and the parent page; past it, it opens; the pass mark, the retake wait and
 *     the check-in switch follow the plan.
 *   · The teacher: 🏫 Class setup ▸ "📋 Station plan" (the class's word for a section), Save = one targeted update, the kid sees it; the
 *     "Open the final" button still works and its note names the share.
 *   · Howe: a Howe kid (no edition — Lincoln's case) keeps PR A's rule exactly, with or without the block, even with a plan in memory.
 *   · The rules file and the setup note.
 * Uses the world from test_env_site.js (its `o.rev` line injects CPREVIEW + this block).                          run: node test_cp_final.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END");
const FINX=FIN+"\nG.fin={ CPF_DEF, CPF_RETAKE_MAX, _cpf, cpFinalPlanOf, cpFinalPlan, cpFinalNeed, cpFinalRetakeMs, cpFinalPassAt, cpFinalCheckin, cpFinalLine, cpFinalStartWhy, cpFinalOpensText, cpFinalDraftOf, cpFinalCheck, cpFinalSet, cpFinalSave, cpFinalCancel, cpFinalPlanHtml, cpFinalDemoSeed, cpfSections };";
// fin false = the same world without this block (the control)
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+(o.fin===false?"":FINX)},o.w||{})); w.F=w.G.fin||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026";
const flush=()=>new Promise(r=>setImmediate(r));

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPFINAL_START"), b=src.indexOf("// CPFINAL_END"), e=src.indexOf("// CPREVIEW_END");
  ok("CPFINAL once, right after CPREVIEW_END", a>0&&b>a&&src.indexOf("// CPFINAL_START",a+1)<0&&src.slice(e,a).trim()==="// CPREVIEW_END");
  ok("the header names §7(f), §13 row 7, Q6, PR 7, the 85 % and the date", /§7\(f\)/.test(FIN)&&/§13 row 7/.test(FIN)&&/Q6/.test(FIN)&&/PR 7/.test(FIN)&&/85 %/.test(FIN)&&/2026-10-28/.test(FIN));
  ok("the block only declares (functions and consts)", FIN.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const code=FIN.replace(/^\/\/.*$/mg,"");
  ok("no Howe kid name as a code literal; the one write is the teacher's Save through envcWrite", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code)&&!/\.ref\(|envsWrite|\bdb\./.test(code)&&(code.match(/envcWrite\(/g)||[]).length===1);
  ok("no hard-coded 'Station' in the block's strings (the class's word for a section, cpLabel)", !/["'][^"'\n]*\bStations?\b/.test(code)&&/cpLabel\("section"/.test(code));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/cpFinal\w+/.test(l)&&!/📤 CPSEND/.test(l));   // 📤 CPSEND's Send out tree reads the share text too (its own line, tagged)
  ok("12 hook lines outside the block, every one tagged 📝 CPFINAL and typeof-guarded", hooks.length===12&&hooks.every(l=>/📝 CPFINAL/.test(l))&&hooks.every(l=>(l.match(/cpFinal\w+\(/g)||[]).every(()=>/typeof cpFinal\w+ ?[!=]== ?"function"/.test(l))), hooks.map(l=>l.trim().slice(0,80)));
  const T=cut("// ENVTEST_START","// ENVTEST_END");
  ok("ENVTEST: the open test, the retake, the line, the check-in, the pass mark (scored and shown), the start card", [/core\.learned>=\(typeof cpFinalNeed==="function"\?cpFinalNeed\(kid,station,core\.total\):core\.total\)/,/<\(typeof cpFinalRetakeMs==="function"\?cpFinalRetakeMs\(kid,station,ENVT_RETAKE_MS\):ENVT_RETAKE_MS\)/,/if\(typeof cpFinalLine==="function"\)\{ const fl=cpFinalLine\(kid,station,st\.post\.core\); if\(fl\) return fl; \}/,/if\(typeof cpFinalCheckin==="function"&&!cpFinalCheckin\(kid,station\)\) return false;/,/envtReleased\(kid,station\)&&\(typeof cpFinalCheckin!=="function"\|\|cpFinalCheckin\(kid,station\)\)/,/sc\.pass=sc\.right>=cpFinalPassAt\(S\.kid,S\.station,sc\.n,envtPassAt\(sc\.n\)\)/,/pass is '\+\(typeof cpFinalPassAt==="function"\?cpFinalPassAt\(S\.kid,S\.station,d\.n,envtPassAt\(d\.n\)\):envtPassAt\(d\.n\)\)/,/\(typeof cpFinalStartWhy==="function"&&cpFinalStartWhy\(kid,st\)\)\|\|/].every(r=>r.test(T)));
  ok("PR A's own Howe line is still there, word for word", /return "Final opens when every core card is learned \\u00B7 "\+st\.post\.core\.learned\+" of "\+st\.post\.core\.total; \}/.test(T)&&/const ENVT_PASS_NUM=4, ENVT_PASS_DEN=5;/.test(T)&&/const ENVT_RETAKE_MS=24\*60\*60\*1000;/.test(T));
  ok("🏫 Class setup draws the plan card between 📦 Units and the closing date", /cpuSetupHtml\(\):""\)\+\(\(typeof cpFinalPlanHtml==="function"\)\?cpFinalPlanHtml\(\):""\)\+cpCloseHtml\(d\)/.test(src));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0); }

console.log("\n── the plan, pure ──");
{ const w=W(), F=w.F;
  ok("defaults: 85 % · 80 % · 24 h · check-in on · every 2 weeks (CPREVIEW's learnedAt default)", JSON.stringify(F.cpFinalPlanOf(undefined))===JSON.stringify({finalAt:85,pass:80,retakeHours:24,checkin:true,learnedAt:"bi_weekly"})&&F.CPF_DEF.finalAt===85);
  ok("a plan's own numbers", JSON.stringify(F.cpFinalPlanOf({finalAt:90,pass:70,retakeHours:0,checkin:false,learnedAt:"monthly",order:3}))===JSON.stringify({finalAt:90,pass:70,retakeHours:0,checkin:false,learnedAt:"monthly"}));
  ok("bad values read the default: 0 %, 101 %, 85.5, '85', -1 h, 721 h, an unknown level", JSON.stringify(F.cpFinalPlanOf({finalAt:0,pass:101,retakeHours:-1,learnedAt:"someday"}))===JSON.stringify(F.cpFinalPlanOf({}))&&F.cpFinalPlanOf({finalAt:85.5}).finalAt===85&&F.cpFinalPlanOf({retakeHours:721}).retakeHours===24&&F.cpFinalPlanOf({finalAt:"60"}).finalAt===60);
  const S=[{id:"soils",short:"Soils"},{id:"forestry",short:"Forestry"}], plan={soils:{order:2,pass:70}};
  const d=F.cpFinalDraftOf({plan},S);
  ok("the draft: strings for the boxes, the class's values over the defaults", d.soils.finalAt==="85"&&d.soils.pass==="70"&&d.soils.retakeHours==="24"&&d.soils.checkin===true&&d.forestry.learnedAt==="bi_weekly");
  ok("nothing changed → no leaves", JSON.stringify(F.cpFinalCheck(d,plan,S))===JSON.stringify({ok:true,upd:{}}));
  d.soils.finalAt="75"; d.forestry.checkin=false; d.forestry.retakeHours="48";
  const c=F.cpFinalCheck(d,plan,S);
  ok("Save sends the changed leaves only — never plan/<key> whole (CPUNIT's order is kept)", c.ok&&JSON.stringify(c.upd)===JSON.stringify({"plan/soils/finalAt":75,"plan/forestry/retakeHours":48,"plan/forestry/checkin":false}), c);
  const bad=(k,v)=>{ const x=JSON.parse(JSON.stringify(d)); x.soils[k]=v; return F.cpFinalCheck(x,plan,S); };
  ok("refused: 0 %, 101 %, 80.5 %, empty, 721 h, an unknown level — each says which section", [["finalAt","0"],["finalAt","101"],["pass","80.5"],["pass",""],["retakeHours","721"],["learnedAt","x"]].every(([k,v])=>{ const r=bad(k,v); return !r.ok&&/^Soils: /.test(r.error); }));
  ok("the need: ceil(total × finalAt / 100) — 4 cards at 85 % = 4; at 75 % = 3; 282 at 85 % = 240", Math.ceil(4*85/100)===4&&Math.ceil(4*75/100)===3&&Math.ceil(282*85/100)===240); }

console.log("\n── the demo kid: Soils 'Final opens at 85% · 3 of 4' ──");
{ const d=demo("kid"), E=d.envt, u=d.unitStudies.nc_envirothon, F=d.F, st=()=>E.envtStatus(u,K,"soils"), core=st().post.core;
  ok("the demo seeds Maya's 'Parent material' at every 2 weeks, so "+core.learned+" of "+core.total+" Soils core cards are learned", core.learned===3&&core.total===4&&d.masteryData.maya.find(i=>i.id==="m_parent").tier==="bi_weekly");
  ok("…which is under 85 % (needs "+Math.ceil(core.total*.85)+"): the final waits on the cards", !st().post.open&&st().post.why==="cards"&&F.cpFinalNeed(K,"soils",core.total)===Math.ceil(core.total*85/100));
  const line="Final opens at 85% · "+core.learned+" of "+core.total;
  ok("the line: '"+line+"'", E.envtCoreLine(K,"soils")===line&&line==="Final opens at 85% · 3 of 4");
  d.envsView("scores"); ok("…on her Scores, and PR A's 'every core card' line is gone", d.G.content.indexOf(line)>0&&!/every core card is learned/.test(d.G.content));
  d.envsDemoGo("parent"); ok("…and on the parent's page", d.G.content.indexOf(line)>0);
  d.envsDemoGo("kid");
  d._envs.cls.plan={soils:{finalAt:75}};
  ok("at 75 % the same 3 of 4 opens it: the 🌿 start shows the final, '75% of core cards learned — show what you know'", st().post.open&&/Soils\/Land Use final/.test(E.envtStartHtml(K,{sid:"envirothon"}))&&/75% of core cards learned — show what you know/.test(E.envtStartHtml(K,{sid:"envirothon"}))&&E.envtCoreLine(K,"soils")==="");
  delete d._envs.cls.plan;
  d.masteryData.maya.push({id:"m_perc",subject:"Soils and Land Use · Terms",type:"envirothon",prompt:"Percolation",status:"active",tier:"bi_weekly"});
  ok("past it at 85 % (Percolation learned, 4 of 4): open, 'every core card learned'", st().post.open&&/every core card learned — show what you know/.test(E.envtStartHtml(K,{sid:"envirothon"})));
  ok("she can take the real Soils final", E.envtOpen(K,"soils","post")===true&&E.state.form.items.length===LIB.tests.soils.post.items.length); E.envtClose();
  ok("nothing written", d.G.writes.length===0); }

console.log("\n── the pass mark and the retake wait follow the plan ──");
{ const d=demo("kid"), E=d.envt, u=d.unitStudies.nc_envirothon;
  const ov=()=>{ const a=d.G.created.filter(e=>e.id==="envtest-ov"); return a.length?a[a.length-1].innerHTML:""; };
  const n=LIB.tests.soils.post.items.length;
  const take=right=>{ E.envtOpen(K,"soils","post"); E.state.form.items.forEach((it,i)=>{ const a=Array.isArray(it.ans)?it.ans:[it.ans]; if(i<right) a.forEach(x=>E.envtPick(x)); else E.envtPick(Array.isArray(it.ans)?0:(it.ans+1)%it.choices.length); E.envtNext(); }); return E.state.done; };
  d._envs.cls.plan={soils:{finalAt:75,pass:60,retakeHours:2}};
  const right=Math.ceil(n*.6);
  ok("pass 60 %: "+right+" of "+n+" passes (80 % would need "+Math.ceil(n*.8)+") and the screen says 'pass is "+right+" of "+n+"'", right<Math.ceil(n*.8)&&(()=>{ const r=take(right); return r&&r.right===right&&r.pass&&r.grad&&ov().indexOf("pass is "+right+" of "+n)>0; })());
  E.envtClose(); delete d.masteryData.maya_tests.soils.graduated; d.G.now+=3*3600000;
  const r2=take(right-1); E.envtClose();
  ok("…one fewer does not pass", r2&&!r2.pass);
  const t0=d.G.now;
  d.G.now=t0+90*60000; ok("retake after 2 h: 1½ h later it waits ('final again tomorrow' stays PR A's words)", E.envtStatus(u,K,"soils").post.why==="wait");
  d.G.now=t0+2*3600000+60000; ok("…2 h later it is open again", E.envtStatus(u,K,"soils").post.open);
  d._envs.cls.plan.soils.retakeHours=0; d.G.now=t0+1000; ok("0 h = right away", E.envtStatus(u,K,"soils").post.open);
  delete d._envs.cls.plan.soils.retakeHours; ok("no number = 24 h, as before", E.envtStatus(u,K,"soils").post.why==="wait");
  ok("nothing written", d.G.writes.length===0); }

console.log("\n── check-in on (the default) is PR A's rule; off lets the cards come ──");
{ const d=demo("kid"), E=d.envt, u=d.unitStudies.nc_envirothon, A="Aquatic Ecology · Terms";
  ok("Aquatics sent out, check-in not taken: the cards wait and the check-in is offered (unchanged)", E.envtWaitsForCheckin(K,A)&&E.envtStatus(u,K,"aquatics").pre.open);
  d._envs.cls.plan={aquatics:{checkin:true}}; ok("check-in on, said out loud: the same", E.envtWaitsForCheckin(K,A)&&E.envtStatus(u,K,"aquatics").pre.open);
  d._envs.cls.plan={aquatics:{checkin:false}}; ok("check-in off: the cards don't wait and no check-in is offered", !E.envtWaitsForCheckin(K,A)&&!E.envtStatus(u,K,"aquatics").pre.open&&!/Aquatic Ecology check-in/.test(E.envtStartHtml(K,{sid:"envirothon"})));
  ok("…other sections keep their check-in", !d.F.cpFinalCheckin(K,"aquatics")&&d.F.cpFinalCheckin(K,"soils")); }

console.log("\n── the teacher: 🏫 Class setup ▸ 📋 Station plan ──");
{ const d=demo("teacher"), F=d.F;
  d.envcView("setup"); const h=d.G.content;
  const S=F.cpfSections();
  ok("the card is there, called by the class's word: '📋 Station plan'", /📋 Station plan/.test(h)&&/onclick="cpFinalSave\(\)"/.test(h));
  ok("one row per section with a final ("+S.length+"; General has none), each with 85 % · 80 % · 24 h · every 2 weeks", S.length>0&&!S.some(s=>s.id==="general")&&S.every(s=>h.indexOf("cpFinalSet('"+s.id+"','finalAt'")>0)&&(h.match(/aria-label="finalAt"/g)||[]).length===S.length&&/value="85" aria-label="finalAt"/.test(h)&&/value="80" aria-label="pass"/.test(h)&&/value="24" aria-label="retakeHours"/.test(h)&&/<option value="bi_weekly" selected>Every 2 weeks<\/option>/.test(h));
  ok("a check-in box only where the section has a check-in form", S.every(s=>(h.indexOf("cpFinalSet('"+s.id+"','checkin'")>0)===!!(LIB.tests[s.id]&&LIB.tests[s.id].pre)));
  d._envc.cls.labels={section:"Unit"}; F._cpf.d=null; d.envcView("setup");
  ok("the class calls a section a 'Unit' → '📋 Unit plan'", /📋 Unit plan/.test(d.G.content)&&!/Station plan/.test(d.G.content)); delete d._envc.cls.labels;
  ok("nothing changed → 'Nothing changed', no write", (F._cpf.d=null,F.cpFinalSave()===false)&&d._envs.writes.length===0);
  F.cpFinalSet("soils","finalAt","101"); const toast=()=>{ const t=d.G.created.filter(e=>e.id==="envs-toast"); return t.length?t[t.length-1].textContent:""; };
  ok("101 % → refused with the reason ('Soils: the final opens at a whole percent, 1 to 100.'), no write", F.cpFinalSave()===false&&d._envs.writes.length===0&&toast()==="Soils: the final opens at a whole percent, 1 to 100.", toast());
  F.cpFinalSet("soils","finalAt","75"); const n0=d._envs.writes.length; F.cpFinalSave(); await flush();
  const wr=d._envs.writes[n0];
  ok("Save: ONE update at classes/"+CID+" with the one changed leaf (plan/soils/finalAt = 75); demo writes nothing", d._envs.writes.length===n0+1&&wr.op==="update"&&wr.path==="classes/"+CID&&JSON.stringify(wr.val)==="{\"plan/soils/finalAt\":75}"&&d.G.writes.length===0, wr);
  ok("…the class in memory has it, and the box reads 75 after the repaint", d._envc.cls.plan.soils.finalAt===75&&/value="75" aria-label="finalAt"/.test(d.G.content));
  d.envcView("student","ramirez_maya");
  ok("Maya's page: '📝 Open the final · Soils' is still there; the note names the plan", /envcFinalFor\('ramirez_maya','soils'\)/.test(d.G.content)&&/It opens on its own once the station plan’s share of core cards is learned/.test(d.G.content));
  d.envsDemoGo("kid"); const E=d.envt, u=d.unitStudies.nc_envirothon;
  ok("back as Maya (the demo's class record is the console's): her Soils final is open at 3 of 4", E.envtStatus(u,K,"soils").post.open&&/75% of core cards learned/.test(E.envtStartHtml(K,{sid:"envirothon"})));
  d.envsDemoGo("teacher"); d.envcView("send"); d.envcSendPick("forestry");
  ok("Send out ▸ Forestry: the whole-class note names Forestry's share (85 %)", /It opens on its own once a student has learned 85% of the station’s core cards/.test(d.G.content));
  d._envc.cls.plan.soils.finalAt=85; d.envcView("student","ramirez_maya");
  ok("every section at 85 %: the student page says one number", /It opens on its own once 85% of a station’s core cards are learned/.test(d.G.content));
  const n1=d._envs.writes.length; d.envcFinalFor("ramirez_maya","soils"); await flush();
  ok("the teacher's Open the final still writes release/<cid>/final/students/ramirez_maya/soils (demo: would write)", d._envs.writes.length===n1+1&&d._envs.writes[n1].path==="release/"+CID+"/final/students/ramirez_maya/soils"&&d.G.writes.length===0);
  const k=demo("kid"); ok("the kid's and parent's pages have no plan card", k.F.cpFinalPlanHtml()===""&&(k.envsDemoGo("parent"),k.F.cpFinalPlanHtml()==="")); }

console.log("\n── Howe: Lincoln keeps PR A's rule (every core card learned at his handOffAt) ──");
const howeWorld=fin=>{
  const soils=["Soils and Land Use · Terms","Soils and Land Use · Facts"].filter(k=>LIB.unit.decks.some(d=>d.key===k));
  const decks=LIB.unit.decks.map(d=>({key:d.key,cards:soils.indexOf(d.key)>=0?d.cards:[]}));
  const core=[]; decks.forEach(d=>d.cards.forEach((c,i)=>{ if(c.core) core.push({id:d.key+i,subject:d.key,prompt:c.name,status:"active",tier:"bi_weekly"}); }));
  const w=W({fin,w:{fam:HOWE,masteryData:{lincoln:core,lincoln_settings:{cat_hold:{}},lincoln_tests:{soils:{pre:{right:9,n:15,ts:1}},aquatics:{}}},unitStudies:{nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{lincoln:true},decks}}}});
  return {w,core,u:w.unitStudies.nc_envirothon};
};
{ const A=howeWorld(), B=howeWorld(false), L="lincoln";
  ok("a Howe kid: no edition, so not the site's kid", !A.w.envSiteOn()&&A.w.F&&A.w.F.cpFinalPlan(L,"soils")===null&&!B.w.F);
  const n=A.core.length; A.core[0].tier="weekly"; B.core[0].tier="weekly";
  const need85=Math.ceil(n*.85);
  ok("Soils: "+(n-1)+" of "+n+" core cards learned — far past 85 % ("+need85+") — and still closed: every core card is the rule", n-1>=need85&&!A.w.envt.envtStatus(A.u,L,"soils").post.open&&A.w.envt.envtStatus(A.u,L,"soils").post.why==="cards");
  ok("his line is PR A's: 'Final opens when every core card is learned · "+(n-1)+" of "+n+"'", A.w.envt.envtCoreLine(L,"soils")==="Final opens when every core card is learned · "+(n-1)+" of "+n);
  ok("with the block and without it: the same status and line", JSON.stringify(A.w.envt.envtStatus(A.u,L,"soils"))===JSON.stringify(B.w.envt.envtStatus(B.u,L,"soils"))&&A.w.envt.envtCoreLine(L,"soils")===B.w.envt.envtCoreLine(L,"soils"));
  A.w._envs.cls={plan:{soils:{finalAt:50,pass:10,retakeHours:0,checkin:false}}};
  ok("even with a class plan in memory, nothing applies to him", !A.w.envt.envtStatus(A.u,L,"soils").post.open&&A.w.envt.envtCoreLine(L,"soils")===B.w.envt.envtCoreLine(L,"soils")&&A.w.F.cpFinalPlan(L,"soils")===null);
  const F=A.w.F, ms=24*3600000;
  ok("every hook hands back what it was given: need = total, retake = 24 h, pass = 80 %, check-in on, no line, no start text", F.cpFinalNeed(L,"soils",n)===n&&F.cpFinalRetakeMs(L,"soils",ms)===ms&&F.cpFinalPassAt(L,"soils",17,14)===14&&F.cpFinalCheckin(L,"aquatics")===true&&F.cpFinalLine(L,"soils",{learned:1,total:2})===""&&F.cpFinalStartWhy(L,A.w.envt.envtStatus(A.u,L,"soils"))===""&&F.cpFinalOpensText("")===""&&F.cpFinalPlanHtml()==="");
  A.core[0].tier="bi_weekly"; B.core[0].tier="bi_weekly";
  ok("all "+n+" learned → open, 'every core card learned' (as before)", A.w.envt.envtStatus(A.u,L,"soils").post.open&&/every core card learned — show what you know/.test(A.w.envt.envtStartHtml(L,{sid:"envirothon"})));
  A.w.masteryData.lincoln_sessions={envirothon:{handOffAt:"monthly"}}; B.w.masteryData.lincoln_sessions={envirothon:{handOffAt:"monthly"}};
  ok("…learned is still his session's handOffAt: monthly → every-2-weeks cards don't count, same with and without", !A.w.envt.envtStatus(A.u,L,"soils").post.open&&JSON.stringify(A.w.envt.envtStatus(A.u,L,"soils").post.core)===JSON.stringify(B.w.envt.envtStatus(B.u,L,"soils").post.core));
  ok("his Aquatics cards still wait for the check-in (the plan's 'off' is ignored)", A.w.envt.envtWaitsForCheckin(L,"Aquatic Ecology · Terms")===B.w.envt.envtWaitsForCheckin(L,"Aquatic Ecology · Terms"));
  ok("nothing written, nothing drawn", A.w.G.writes.length===0&&A.w.G.created.length===0); }

console.log("\n── the rules file, the setup note, the demo ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules.classes.$cid, P=R.plan;
  ok("classes/<cid>/plan: the class's teacher writes it (no brand lock); the whole class stays Adrienne's", /classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(P[".write"])&&!/locks/.test(P[".write"])&&/admins/.test(R[".write"]));
  ok("shapes: the key, finalAt 1–100, pass 1–100, retakeHours 0–720, checkin true/false, learnedAt one of the ladder's five, order a number", /\$key\.matches/.test(P.$key[".validate"])&&/>= 1 && newData\.val\(\) <= 100/.test(P.$key.finalAt[".validate"])&&/>= 1 && newData\.val\(\) <= 100/.test(P.$key.pass[".validate"])&&/>= 0 && newData\.val\(\) <= 720/.test(P.$key.retakeHours[".validate"])&&/isBoolean/.test(P.$key.checkin[".validate"])&&["every_other_day","weekly","bi_weekly","monthly","graduated"].every(t=>P.$key.learnedAt[".validate"].indexOf("'"+t+"'")>0)&&/isNumber/.test(P.$key.order[".validate"]));
  const setup=fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8");
  ok("SITE_SETUP.md explains the section plan and the 85 %", /section plan/.test(setup)&&/85 %/.test(setup)&&/classes\/<cid>\/plan/.test(setup));
  const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js")); const html=buildDemo(src,"test",{});
  ok("make_demo carries the block (the demo shows the plan and the 85 % line)", html.indexOf("// CPFINAL_START")>0&&html.indexOf("function cpFinalPlanHtml(")>0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw: "+(e&&e.stack||e)); process.exit(1); });
