/*
 * Node tests — 🧩 CPSKILL, PR 25 of the class platform (DESIGN_class_platform_2026-10-28.md §4.1b, §9, §12, §13 row 25;
 * RESEARCH_envirothon_skills_2026-10-28.md §2–§3, §4.3). The skill ENGINE: unit.skills, the three stages (shown → faded → on your own),
 * the learned rule, which step was missed, one write per sitting, summary.skills, classSkills, plan.<key>.skillsForFinal, the hook points
 * for 📅 Pace and ⚠ Most missed, and the demo's one sample skill (the biotic index worksheet, a `sheet`).
 *   · Where the block sits and how it hooks (typeof-guarded one-line hooks, every one tagged 🧩 CPSKILL).
 *   · The practice rules, pure: the stages, the fade, the learned rule (4 of the last 5 solo, 2 days, last right), reviews at 7 then 14 days.
 *   · The sample worksheet over many seeds: kinds not animals, × 3 / 2 / 1, the rating bands, the miss codes and their words.
 *   · The demo kid: 👀 → ✍️ → 💪 in one sitting, the missed step saved, ONE write, summary.skills, "skills learned 0 of 1".
 *   · A live kid: the class layer read once, the one write on the family instance (db), dry run writes nothing.
 *   · The teacher: 🏫 Class setup ▸ 🧩 Skills — hide / optional (classSkills, targeted), the final switch (one leaf), the Skills fold.
 *   · The final waits for the core skills when the section plan says so.
 *   · Howe / Lincoln: no edition → every hook says no; envSummary is byte-identical with and without the block.
 *   · The rules file.
 * Uses the world from test_env_site.js (its `o.rev` line injects CPREVIEW + CPFINAL + this block).                run: node test_cp_skill.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const HOWE={familyId:"howe",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const REV=cut("// CPREVIEW_START","// CPREVIEW_END"), FIN=cut("// CPFINAL_START","// CPFINAL_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END");
const SKLX=SKL+"\nG.sk={ CPSK_SITTING, CPSK_KEEP, CPSK_STAGES, CPSK_REVIEW_DAYS, CPSK_SID, CPSK_COST, CPSK_TYPES, CPSK_DEMO_SKILL, CPSK_SHEET, _cpsk, cpskOn, cpskFb, cpskRng, cpSkillTypeAdd, cpSkillCheck, cpSkillList, cpSkillFresh, cpSkillLearnedBy, cpSkillNext, cpSkillDue, cpSkillFrom, cpSkillKidOn, cpSkillsFor, cpSkillKidLoad, cpSkillOpen, cpSkillInput, cpSkillPick, cpSkillHelp, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillFinish, cpSkillDoorHtml, cpSkillSittingHtml, cpSkillStudyWrap, cpSkillSummary, cpSkillPaceLine, cpSkillRowLine, cpSkillFoldRows, cpSkillFoldHtml, cpSkillQuestionLine, cpSkillMissLabel, cpSkillFinalWait, cpSkillFinalLine, cpSkillSetupHtml, cpSkillSetCore, cpSkillSetHide, cpSkillSetFinal, cpSkillDemoSeed, cpskRangeText };";
// sk false = the same world without this block (the control)
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+(o.sk===false?"":SKLX)},o.w||{})); w.S=w.G.sk||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"kid")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const K="maya", CID="ms-science-2026", FB="aquatics:biotic_index", DAY=86400000;
const T0=Date.UTC(2026,9,28,15,0,0);

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPSKILL_START"), b=src.indexOf("// CPSKILL_END"), e=src.indexOf("// CPCARDSEDIT_END");
  ok("CPSKILL once, after CPCARDSEDIT_END", a>0&&b>a&&e>0&&a>e&&src.indexOf("// CPSKILL_START",a+1)<0);   // position-tolerant: CPPHOTOS (PR 29) sits between them
  ok("the header names §4.1b, §13 row 25, PR 25, the research, the three stages, the learned rule, one write, and the date", /§4\.1b/.test(SKL)&&/§13 row 25/.test(SKL)&&/PR 25/.test(SKL)&&/RESEARCH_envirothon_skills_2026-10-28\.md/.test(SKL)&&/THE THREE STAGES/.test(SKL)&&/THE LEARNED RULE/.test(SKL)&&/ONE WRITE PER SITTING/.test(SKL)&&/2026-10-28/.test(SKL));
  ok("the block only declares, plus its one registration (the sample `sheet` maker)", SKL.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)||l==='cpSkillTypeAdd("sheet",CPSK_SHEET);'));
  const code=SKL.replace(/^\/\/.*$/mg,"").replace(/   \/\/ .*$/mg,"");
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(code));
  ok("writes: the kid's one save (cpskWrite: envsWrite in the demo, db live), the teacher's layer and plan leaf through envcWrite — nothing else", (code.match(/\.update\(|\.set\(|\.remove\(/g)||[]).length===1&&/db\.ref\("mastery"\)\.update\(upd\)/.test(code)&&(code.match(/envsWrite\(/g)||[]).length===1&&(code.match(/envcWrite\(/g)||[]).length===2);
  ok("the one read: classSkills/<cid> once on a kid's app (+ the console's own listener through envcSub)", (code.match(/\.once\(/g)||[]).length===1&&/ref\("classSkills\/"\+cid\)\.once/.test(code)&&/envcSub\("cpsk:"\+cid,"classSkills\/"\+cid/.test(code));
  ok("no 'Station' word in the block's strings", !/["'][^"'\n]*\bStations?\b/.test(code));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/cpSkill\w+/.test(l)&&!/^\s*\/\//.test(l));
  ok("every line outside the block that names it is tagged 🧩 CPSKILL and typeof-guarded", hooks.length>0&&hooks.every(l=>/🧩 CPSKILL/.test(l))&&hooks.every(l=>(l.match(/cpSkill\w+(?=\()/g)||[]).every(f=>new RegExp("typeof "+f+" ?[!=]== ?\"function\"").test(l))), hooks.map(l=>l.trim().slice(0,90)));
  const H=n=>hooks.some(l=>l.indexOf(n)>=0);
  ok("the hooks: the study page, envSummary, envtStatus, envtCoreLine, the station rows, 🏫 Class setup, the demo seed", ["cpSkillStudyWrap","cpSkillSummary","cpSkillFinalWait","cpSkillFinalLine","cpSkillRowLine","cpSkillSetupHtml","cpSkillDemoSeed"].every(H));
  ok("envSummary's line sits after the tests and before its return (other blocks' one-line hooks may sit between)", /if\(Object\.keys\(tests\)\.length\) out\.tests=tests; \}\n(?:  if\(typeof cp\w+[^\n]*\n){0,3}  if\(typeof cpSkillSummary==="function"\)\{ const sk=cpSkillSummary\(kid,M,now\); if\(sk\) out\.skills=sk; \}[^\n]*\n(?:  if\(typeof cp\w+[^\n]*\n){0,3}  return out;/.test(src));
  ok("envtStatus: only an open final is held back, and never one the teacher opened (rec.postOpen)", /    else out\.post\.open=true;\n    if\(out\.post\.open&&!rec\.postOpen&&typeof cpSkillFinalWait==="function"&&cpSkillFinalWait\(kid,station\)\)\{ out\.post\.open=false; out\.post\.why="skills"; \}/.test(src));
  ok("🏫 Class setup draws the Skills card after the closing date (CPFINAL's plan card stays where it was)", /cpFinalPlanHtml\(\):""\)\+cpCloseHtml\(d\)\+\(\(typeof cpSkillSetupHtml==="function"\)\?cpSkillSetupHtml\(\):""\);/.test(src)); }

console.log("\n── Howe and Lincoln: no edition, every hook says no ──");
{ const w=W({w:{fam:HOWE}}), S=w.S, before=JSON.stringify([w.G.reads,w.G.writes,w.G.listeners.length,w.G.created.length]);
  w.masteryData.lincoln=[{id:"l1",subject:"Aquatic Ecology · Terms",prompt:"Biotic index",tier:"weekly",status:"active"}];
  w.masteryData.lincoln_skills={nc_envirothon:{[FB]:{stage:"solo",learned:true,tries:[],miss:{math:2}}}};
  ok("cpskOn false; no skills, no summary, no door, no line, no fold, no card, no final hold, nothing opens", S.cpskOn()===false&&S.cpSkillList().length===0&&S.cpSkillSummary("lincoln",w.masteryData,T0)===null&&S.cpSkillStudyWrap("lincoln","BODY")==="BODY"&&S.cpSkillRowLine({skills:{aquatics:{learned:1,total:1}}},"aquatics")===""&&S.cpSkillPaceLine({skills:{aquatics:{learned:1,total:1}}},"aquatics")===""&&S.cpSkillFoldHtml([{summary:{}}])===""&&S.cpSkillSetupHtml()===""&&S.cpSkillFinalWait("lincoln","aquatics")===false&&S.cpSkillFinalLine("lincoln","aquatics")===""&&S.cpSkillOpen("lincoln",FB)===false&&S.cpSkillKidLoad()===false&&S.cpSkillDemoSeed({})===false&&S.cpSkillQuestionLine("q",[])==="");
  ok("…and nothing read, written, listened to or created", JSON.stringify([w.G.reads,w.G.writes,w.G.listeners.length,w.G.created.length])===before); }

// envSummary is ENVMIRROR's function; expose it through a world built with an export line
function WS(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:{demo:true,tests:LIB.tests},rev:REV+"\n"+FIN+"\n"+(o.sk===false?"":SKLX)+"\nG.envSummary=envSummary;"},o.w||{})); w.S=w.G.sk||null; return w; }
{ const mk=sk=>{ const w=WS({sk,w:{fam:HOWE}}); w.masteryData.lincoln=[{id:"l1",subject:"Aquatic Ecology · Terms",prompt:"Biotic index",tier:"weekly",status:"active"}]; w.masteryData.lincoln_skills={nc_envirothon:{[FB]:{stage:"solo",learned:true,tries:[],miss:{math:2}}}}; return w; };
  const u={id:"nc_envirothon",decks:[{key:"Aquatic Ecology · Terms",station:"aquatics",cards:[{name:"Biotic index",def:"x",core:true}]}]};
  const a=mk(true), b=mk(false), sa=a.G.envSummary("lincoln",{M:a.masteryData,u,now:T0}), sb=b.G.envSummary("lincoln",{M:b.masteryData,u,now:T0});
  ok("Lincoln's summary (envSummary, Howe) is byte-identical with and without the block — no skills key, even with a _skills record in his data", JSON.stringify(sa)===JSON.stringify(sb)&&!("skills" in sa)); }

console.log("\n── the practice rules, pure ──");
{ const w=W(), S=w.S, N=S.cpSkillNext;
  let s=S.cpSkillFresh();
  ok("a fresh skill starts at 👀 shown, not learned, no review", s.stage==="shown"&&s.learned===false&&s.next===null&&S.cpSkillDue(null,T0)==="new"&&S.cpSkillDue(s,T0)==="practice");
  ok("the stages are shown → faded → solo", JSON.stringify(S.CPSK_STAGES)===JSON.stringify(["shown","faded","solo"]));
  s=N(s,{ok:true,s:"shown"},5,T0); ok("one worked example: still shown (up 1)", s.stage==="shown"&&s.up===1&&s.tries.length===1);
  s=N(s,{ok:true,s:"shown"},5,T0+1); ok("two right in a row: up to ✍️ faded, the student does the last 1 step", s.stage==="faded"&&s.fade===1&&S.cpSkillFrom(s,5)===4);
  s=N(s,{ok:true,s:"faded"},5,T0+2); ok("a right faded round hands over one more step (the last 2)", s.stage==="faded"&&s.fade===2&&S.cpSkillFrom(s,5)===3);
  const f1=N(s,{ok:false,miss:"math",step:3,s:"faded"},5,T0+3);
  ok("a miss: stays faded, the step and its code are kept on the try, the code counts", f1.stage==="faded"&&f1.tries[f1.tries.length-1].miss==="math"&&f1.tries[f1.tries.length-1].step===3&&f1.miss.math===1);
  const f2=N(f1,{ok:false,miss:"range",s:"faded"},5,T0+4);
  ok("two misses in a row: back one stage (to 👀 shown)", f2.stage==="shown"&&f2.miss.range===1);
  s=N(s,{ok:true,s:"faded"},5,T0+3); ok("two right in a row in faded: up to 💪 on your own (every step)", s.stage==="solo"&&S.cpSkillFrom(s,5)===0);
  const back=N(N(s,{ok:false,miss:"math",s:"solo"},5,T0+5),{ok:false,miss:"math",s:"solo"},5,T0+6);
  ok("two solo misses: back to faded with all but one step the student's", back.stage==="faded"&&back.fade===4&&S.cpSkillFrom(back,5)===1);
  // the learned rule
  const t=(ok,day,o)=>Object.assign({ok,s:"solo",at:T0+day*DAY},o||{});
  ok("learned: 4 of the last 5 solo right, on 2 days, last right", S.cpSkillLearnedBy([t(true,0),t(false,0),t(true,0),t(true,1),t(true,1)])===true);
  ok("not learned: the last one missed", S.cpSkillLearnedBy([t(true,0),t(true,0),t(true,1),t(true,1),t(false,1)])===false);
  ok("not learned: only 3 of the last 5 right", S.cpSkillLearnedBy([t(false,0),t(true,0),t(false,1),t(true,1),t(true,1)])===false);
  ok("not learned: all on one day", S.cpSkillLearnedBy([t(true,0),t(true,0),t(true,0),t(true,0),t(true,0)])===false);
  ok("not learned: worked examples and faded rounds don't count; a try with the help chart isn't solo", S.cpSkillLearnedBy([t(true,0),t(true,0),t(true,1),{ok:true,s:"faded",at:T0+DAY},t(true,1,{help:true})])===false&&S.cpSkillLearnedBy([t(true,0),t(true,0),t(true,1),t(true,1)])===true);
  ok("only the last 5 solo tries count (old misses age out)", S.cpSkillLearnedBy([t(false,0),t(false,0),t(true,1),t(true,1),t(true,2),t(true,2),t(true,2)])===true);
  // reviews
  let L=Object.assign(S.cpSkillFresh(),{stage:"solo"}); [0,0,1,1].forEach((d,i)=>{ L=N(L,{ok:true,s:"solo"},5,T0+d*DAY+i); });
  ok("learned on the 4th right solo try over 2 days; a review comes back 7 days later", L.learned===true&&L.next===T0+DAY+3+7*DAY&&L.rev===0&&S.cpSkillDue(L,T0+2*DAY)==="done"&&S.cpSkillDue(L,L.next)==="review");
  const R1=N(L,{ok:true,s:"solo"},5,L.next); ok("a right review: the next one in 14 days", R1.learned&&R1.rev===1&&R1.next===L.next+14*DAY);
  const R2=N(R1,{ok:true,s:"solo"},5,R1.next); ok("…and every 14 days after", R2.next===R1.next+14*DAY);
  const RM=N(R1,{ok:false,miss:"math",s:"solo"},5,R1.next); ok("a missed review un-learns it until a right try (no review date)", RM.learned===false&&RM.next===null&&S.cpSkillDue(RM,RM.at)==="practice");
  let keep=S.cpSkillFresh(); for(let i=0;i<20;i++) keep=N(keep,{ok:i%2===0,s:"solo",miss:"math"},5,T0+i); ok("the record keeps the last 8 tries", keep.tries.length===S.CPSK_KEEP&&S.CPSK_KEEP===8);
  ok("a Firebase-safe miss code: '.' becomes ':'", N(S.cpSkillFresh(),{ok:false,miss:"a.b",s:"shown"},2,T0).tries[0].miss==="a:b"&&S.cpskFb("soils.triangle")==="soils:triangle");
  ok("the pace's fixed cost per skill: ~3 min a try, ~8 tries, reviews at 7 and 14 days", S.CPSK_COST.tryMin===3&&S.CPSK_COST.tries===8&&JSON.stringify(S.CPSK_COST.reviewDays)==="[7,14]"); }

console.log("\n── a unit's skills: the shape check, the generic types ──");
{ const w=W(), S=w.S, good={key:"soils.triangle",section:"soils",type:"chart",label:"Soil texture triangle",core:true,steps:["clay line"]};
  ok("a good skill passes; bad key / unknown section / unknown type / no label / steps not a list fail", S.cpSkillCheck(good,["soils"]).ok&&!S.cpSkillCheck(Object.assign({},good,{key:"Bad Key"}),null).ok&&!S.cpSkillCheck(good,["forestry"]).ok&&!S.cpSkillCheck(Object.assign({},good,{type:"essay"}),null).ok&&!S.cpSkillCheck(Object.assign({},good,{label:""}),null).ok&&!S.cpSkillCheck(Object.assign({},good,{steps:"x"}),null).ok);
  ok("the item types are the design's eight, generic", ["chart","table","sheet","label","id","scale","mock","rubric"].every(t=>S.cpSkillCheck(Object.assign({},good,{type:t}),null).ok));
  ok("a later PR registers its type from its own block; an unknown type is refused", S.cpSkillTypeAdd("chart",{make(){ return {steps:[{id:"x",label:"x",kind:"num",answer:1}]}; }})===true&&S.cpSkillTypeAdd("essay",{make(){}})===false&&S.cpSkillTypeAdd("table",{})===false&&!!S.CPSK_TYPES.sheet); }

console.log("\n── the sample worksheet (research §4.3), over 300 problems ──");
{ const w=W(), S=w.S, sk=S.CPSK_DEMO_SKILL, M=S.CPSK_SHEET;
  ok("the sample is generic: a `sheet` on the unit's aquatics section, core, with the unit's own taxa (9 + 11 + 9)", sk.type==="sheet"&&sk.section==="aquatics"&&sk.core===true&&sk.data.kind==="tally"&&sk.data.groups.map(g=>g.items.length).join()==="9,11,9"&&sk.data.groups.map(g=>g.weight).join()==="3,2,1");
  const band=t=>t>=23?"Excellent":t>=17?"Good":t>=11?"Fair":"Poor"; let bad=null, seen={};
  for(let seed=1;seed<=300&&!bad;seed++){ const p=M.make(sk,S.cpskRng(seed)), names=p.rows.map(r=>r.name);
    const cnt=g=>p.rows.filter(r=>r.g===g).length, ind=g=>p.rows.filter(r=>r.g===g).reduce((a,r)=>a+r.n,0), tot=3*cnt("g1")+2*cnt("g2")+cnt("g3");
    const st=p.steps; seen[st[4].answer]=1;
    if(!(p.rows.length>=5&&p.rows.length<=9)) bad=["5 to 9 kinds",seed,p.rows.length];
    else if(new Set(names).size!==names.length) bad=["no kind twice",seed];
    else if(!p.rows.some(r=>r.n>1)) bad=["one kind seen more than once",seed];
    else if(st.length!==5||st.map(x=>x.id).join()!=="count:g1,count:g2,count:g3,math,range") bad=["the 5 steps",seed,st.map(x=>x.id)];
    else if(st[0].answer!==cnt("g1")||st[1].answer!==cnt("g2")||st[2].answer!==cnt("g3")||st[0].alt!==ind("g1")) bad=["count KINDS (alt = animals)",seed];
    else if(st[3].answer!==tot) bad=["× 3/2/1 and add",seed];
    else if(st[4].answer!==band(tot)||st[4].choices.join()!=="Excellent,Good,Fair,Poor") bad=["the rating band",seed,tot,st[4].answer]; }
  ok("every problem: 5–9 kinds, none twice, one seen more than once, 5 steps, counts are KINDS, × 3/2/1 + add, the right band", !bad, bad);
  ok("problems vary: every rating comes up across seeds", ["Excellent","Good","Fair","Poor"].every(r=>seen[r]), Object.keys(seen));
  ok("each try is a new problem (two seeds, two samples)", JSON.stringify(M.make(sk,S.cpskRng(1)).rows)!==JSON.stringify(M.make(sk,S.cpskRng(2)).rows));
  const R=[{min:23},{min:17},{min:11},{min:0}];
  ok("the bands read as the research: Excellent 23+, Good 17–22, Fair 11–16, Poor 0–10", S.cpskRangeText(R,0)==="23+"&&S.cpskRangeText(R,1)==="17–22"&&S.cpskRangeText(R,2)==="11–16"&&S.cpskRangeText(R,3)==="0–10");
  const p=(()=>{ for(let s=1;s<200;s++){ const q=M.make(sk,S.cpskRng(s)); if(q.steps[1].alt!==q.steps[1].answer) return q; } })();
  ok("the miss codes: animals instead of kinds → count:individuals; another wrong count → group:g2; math; range", M.miss(p.steps[1],String(p.steps[1].alt))==="count:individuals"&&M.miss(p.steps[1],String(p.steps[1].answer+p.steps[1].alt+7))==="group:g2"&&M.miss(p.steps[3],"0")==="math"&&M.miss(p.steps[4],"Poor")==="range");
  ok("…and in words for the teacher", M.missLabel("count:individuals",sk)==="counted animals, not kinds"&&M.missLabel("group:g2",sk)==="sorted into Group 2 (somewhat sensitive) wrong"&&M.missLabel("math",sk)==="the multiply-and-add"&&M.missLabel("range",sk)==="picked the wrong rating"&&S.cpSkillMissLabel({type:"sheet",data:sk.data},"weird")==="weird");
  ok("a sheet that isn't a tally makes no problem (the full `sheet` type is its own PR)", M.make({data:{kind:"formula"}},S.cpskRng(1))===null&&M.make({},S.cpskRng(1))===null); }

console.log("\n── the demo kid: 👀 → ✍️ → 💪 in one sitting ──");
{ const d=demo("kid"), S=d.S, run=()=>S._cpsk.run;
  ok("the demo puts the sample on the demo's unit only (the catalog entry never carries it)", S._cpsk.demo.nc_envirothon.length===1&&!(d.cpu.CPU_UNITS.nc_envirothon.skills||[]).some(s=>JSON.stringify(s.data)===JSON.stringify(S.CPSK_DEMO_SKILL.data)));   // 🧰 CPITEMGEAR: the entry now carries the unit's real skills · 🪲 CPITEMBIOTIC: one of them has the sample's key
  ok("Maya's Study page: the 🧩 Skills door under the study start, Biotic index, 'New · starts with a worked example'", /fake-study[\s\S]*🧩 Skills[\s\S]*Biotic index/.test(d.G.content)&&/New · starts with a worked example/.test(d.G.content));
  const list=S.cpSkillsFor(K); ok("her skills: the aquatics one (Aquatics is sent out to her)", list.length===1&&list[0].fb===FB&&list[0].due==="new");
  ok("Go opens a sitting: the page is the sitting (not the study start)", S.cpSkillOpen(K,FB,4242)===true&&!/fake-study/.test(d.G.content)&&/try 1 of 6/.test(d.G.content)&&/👀 Watch it/.test(d.G.content)&&/What you found in the stream/.test(d.G.content));
  const n=run().prob.steps.length;
  ok("👀 the worked example lights one step at a time ('Next step'), then 'Got it'", run().shown===1&&/Next step/.test(d.G.content)&&(()=>{ for(let i=1;i<n;i++) S.cpSkillStep(); return /Got it/.test(d.G.content)&&run().shown===n; })());
  ok("…every step's answer and its work show (the chart too)", run().prob.steps.every(x=>d.G.content.indexOf(String(x.work).replace(/&/g,"&amp;"))>=0)&&/The chart/.test(d.G.content));
  S.cpSkillStep(); ok("Got it counts it and the next problem comes (still shown, a NEW sample)", run().tries.length===1&&run().n===2&&run().stage==="shown");
  for(let i=0;i<n;i++) S.cpSkillStep();
  ok("after two worked examples: ✍️ Finish it — the steps before the last are done, the student does the last", run().stage==="faded"&&run().from===n-1&&/✍️ Finish it/.test(d.G.content)&&/Now the first steps are done for you/.test(d.G.content));
  const fill=(right,wrongAt)=>{ const r=run(); for(let i=r.from;i<r.prob.steps.length;i++){ const st=r.prob.steps[i]; let v=String(st.answer); if(i===wrongAt) v=st.kind==="pick"?st.choices.find(c=>c!==st.answer):(wrongAt<3&&st.alt!==st.answer?String(st.alt):String(st.answer+1)); if(st.kind==="pick") S.cpSkillPick(i,v); else S.cpSkillInput(i,v); } };
  S.cpSkillCheckTry(); ok("Check with a step empty: 'Fill in every step first', nothing counted", run().tries.length===2&&!run().checked);
  fill(true); S.cpSkillCheckTry(); ok("a right faded try: ✓ All right!", run().checked.ok&&/All right!/.test(d.G.content)&&run().st.fade===2);
  S.cpSkillNextTry(); ok("next: the student does the last 2 steps", run().stage==="faded"&&run().from===n-2);
  fill(true); S.cpSkillCheckTry(); ok("two right in a row: up to 💪 on your own ('Next: on your own!')", run().st.stage==="solo"&&/Next: on your own!/.test(d.G.content));
  S.cpSkillNextTry(); ok("💪 every step is the student's; the chart is behind 'Show the chart'", run().stage==="solo"&&run().from===0&&/Show the chart/.test(d.G.content)&&!/The chart<\/summary>/.test(d.G.content));
  // a solo miss at the step where animals ≠ kinds (the research's trap), else the math
  const r=run(), gi=r.prob.steps.findIndex((x,i)=>i<3&&x.alt!==x.answer), at=gi>=0?gi:3, code=gi>=0?"count:individuals":"math";
  fill(false,at); S.cpSkillCheckTry();
  ok("a solo miss: the FIRST step that went wrong is saved as the miss ("+code+"), and the screen says which step", run().checked.ok===false&&run().checked.step===at&&run().checked.miss===code&&new RegExp("Missed at step "+(at+1)).test(d.G.content));
  ok("…the wrong step shows ✗ and the right answer with its work", /✗ /.test(d.G.content)&&d.G.content.indexOf("→ "+r.prob.steps[at].answer)>=0);
  const writesBefore=d._envs.writes.length;
  S.cpSkillNextTry(); fill(true); S.cpSkillCheckTry();
  ok("nothing is written during the sitting", d._envs.writes.length===writesBefore&&run().tries.length===6);
  S.cpSkillNextTry();
  const W1=d._envs.writes.slice(writesBefore), w1=W1[0]||{}, day=new Date(T0).toISOString().slice(0,10).replace(/-/g,"");
  ok("the 6th try ends the sitting with ONE write: an update on mastery with the skill's state and the day's study log", W1.length===1&&w1.op==="update"&&w1.path==="mastery"&&JSON.stringify(Object.keys(w1.val).sort())===JSON.stringify(["maya_skills/nc_envirothon/"+FB,"studyLog/maya/skills/"+day].sort()), W1.map(x=>[x.op,x.path,Object.keys(x.val||{})]));
  const st=w1.val["maya_skills/nc_envirothon/"+FB], log=w1.val["studyLog/maya/skills/"+day];
  ok("the state: on your own, not learned yet, the 6 tries, the miss counted by its code", st.stage==="solo"&&st.learned===false&&st.tries.length===6&&st.miss[code]===1&&st.tries.map(t=>t.s).join()==="shown,shown,faded,faded,solo,solo");
  ok("the study log under its own sid: the 4 tries the student did (2 worked examples apart), the miss code on the item", log.total===4&&log.correct===3&&log.miss===1&&log.shown===2&&log.items.length===4&&log.items.some(i=>i.result==="m"&&i.miss===code)&&S.CPSK_SID==="skills");
  ok("the done screen: 6 tries · 3 of 4 right · 2 worked examples · Next time: on your own", /6 tries · 3 of 4 right · 2 worked examples/.test(d.G.content)&&/Next time: 💪 On your own/.test(d.G.content));
  ok("in memory at once (the demo writes nothing for real)", d.masteryData.maya_skills.nc_envirothon[FB]===st&&d.masteryData.studyLog.maya.skills[day]===log);
  S.cpSkillQuit(); ok("Done: back to the study start; the door now says 'On your own · 1 of the last 5 right'", !S._cpsk.run&&/fake-study/.test(d.G.content)&&/On your own · 1 of the last 5 right/.test(d.G.content));
  d.envsView("scores"); ok("Scores ▸ Aquatics: '🧩 skills learned 0 of 1'", /🧩 skills learned 0 of 1/.test(d.G.content));
  d.envsDemoGo("parent"); ok("…and on the parent's page", /🧩 skills learned 0 of 1/.test(d.G.content));
  d.envsDemoGo("kid"); S.cpSkillOpen(K,FB,7); S.cpSkillQuit(); ok("Quit before any try: nothing written", d._envs.writes.length===writesBefore+1&&!S._cpsk.run);
  S.cpSkillOpen(K,FB,8); fill(true); S.cpSkillCheckTry(); S.cpSkillQuit();
  ok("Stop here after a try keeps it: one more write, the day's log merged (a second sitting)", d._envs.writes.length===writesBefore+2&&d.masteryData.studyLog.maya.skills[day].sits.length===2); }

console.log("\n── summary.skills (what the mirror publishes) ──");
{ const w=WS({w:{search:"?demo=1&role=kid"}}); w.envSiteDemoBoot(); w.renderAll(); const S=w.S;
  const s0=w.G.envSummary(K,{now:T0}).skills;
  ok("a kid who never tried: aquatics {learned 0, total 1, stage new}", JSON.stringify(s0)===JSON.stringify({aquatics:{learned:0,total:1,miss:{},stage:{[FB]:"new"}}}), s0);
  w.masteryData.maya_skills={nc_envirothon:{[FB]:{stage:"solo",learned:true,miss:{"count:individuals":2,math:1},tries:[]}}};
  const s1=w.G.envSummary(K,{now:T0}).skills.aquatics;
  ok("counts and codes only: learned 1 of 1, the miss codes per skill, the stage", s1.learned===1&&s1.total===1&&s1.miss[FB]["count:individuals"]===2&&s1.stage[FB]==="learned"&&!JSON.stringify(s1).includes("tries"));
  ok("the pace's line reads it: 'skills learned 1 of 1'; a section with no skills: nothing", S.cpSkillPaceLine({skills:{aquatics:s1}},"aquatics")==="skills learned 1 of 1"&&S.cpSkillPaceLine({skills:{aquatics:s1}},"soils")===""&&S.cpSkillPaceLine({},"aquatics")===""); }

console.log("\n── a live kid: the class layer read once, the one write on the family instance ──");
{ const live=(dry)=>{ const w=W({w:{fam:FAM,dry,remote:{["classSkills/"+CID]:{}}}}); const S=w.S; w.initFb();
    Object.assign(w._envs,{role:"kid",kid:K,sid:"ramirez_maya",cid:CID,cls:{units:{nc_envirothon:true}}}); S._cpsk.demo.nc_envirothon=[S.CPSK_DEMO_SKILL];
    w.masteryData[K]=[]; w.masteryData[K+"_settings"]={cat_hold:{"Forestry · Terms":true}}; return w; };
  const w=live(false), S=w.S;
  ok("the kid's page reads classSkills/<cid> once (no listener), and the door shows", S.cpSkillStudyWrap(K,"BODY").indexOf("Biotic index")>0&&S.cpSkillStudyWrap(K,"BODY")&&w.G.reads.filter(p=>p==="classSkills/"+CID).length===1&&!w.G.listeners.some(l=>/classSkills/.test(l.p)));
  w.G.remote["classSkills/"+CID]={[FB]:{hide:true,by:"t",ts:1}}; S._cpsk.kidAsked=""; S.cpSkillKidLoad();
  ok("a skill the teacher hid isn't on the kid's page", S.cpSkillStudyWrap(K,"BODY")==="BODY"&&S.cpSkillsFor(K).length===0);
  S._cpsk.kid={}; S.cpSkillOpen(K,FB,3); S.cpSkillStep(); for(let i=1;i<=S._cpsk.run.prob.steps.length;i++) S.cpSkillStep(); S.cpSkillQuit();
  const ups=w.G.writes.filter(x=>x[0]==="update");
  ok("one write: db.ref('mastery').update({<kid>_skills/<unit>/<key>, studyLog/<kid>/skills/<day>}) — targeted paths, the family's own instance", w.G.writes.length===1&&ups.length===1&&ups[0][1]==="mastery"&&Object.keys(ups[0][2]).every(k=>/^maya_skills\/nc_envirothon\/aquatics:biotic_index$|^studyLog\/maya\/skills\/\d{8}$/.test(k)), w.G.writes.map(x=>[x[0],x[1]]));
  const d=live(true), D=d.S; D.cpSkillOpen(K,FB,3); D.cpSkillStep(); for(let i=1;i<=D._cpsk.run.prob.steps.length;i++) D.cpSkillStep(); D.cpSkillQuit();
  ok("?dryrun=1: the sitting runs and scores, writes nothing, and says so", d.G.writes.length===0&&/Dry run/.test(D.cpSkillSittingHtml())); }

console.log("\n── the teacher: 🏫 Class setup ▸ 🧩 Skills ──");
{ const d=demo("teacher"), S=d.S; d.envcView("setup");
  ok("the Skills card: Aquatics ▸ Biotic index · sheet · core, Make optional, Hide, the final switch", /🧩 Skills/.test(d.G.content)&&/Biotic index/.test(d.G.content)&&/sheet · core/.test(d.G.content)&&/Make optional/.test(d.G.content)&&/🙈 Hide/.test(d.G.content)&&/waits for the core skills too/.test(d.G.content));
  ok("the Skills fold (the hook ⚠ Most missed will call): 1 of 8 learned, where they are, the most-missed step with its count", /🧩 Skills · 1/.test(d.G.content)&&/1 of 8 learned/.test(d.G.content)&&/1 watching · 1 finishing · 1 on their own · 4 not started/.test(d.G.content)&&/Most missed step: counted animals, not kinds \(5\)/.test(d.G.content));
  const rows=S.cpSkillFoldRows(d.envcStudents());
  ok("the fold's rows rank by % learned and add the miss codes across students", rows.length===1&&rows[0].learned===1&&rows[0].n===8&&rows[0].top==="count:individuals"&&rows[0].topN===5&&rows[0].miss["group:g2"]===1&&rows[0].miss.range===1);
  S.CPSK_DEMO_SKILL.tests=["post-15"];
  ok("the item analysis line: a question linked to the skill → '7 students haven’t learned Biotic index'", S.cpSkillQuestionLine("post-15",d.envcStudents())==="7 students haven’t learned Biotic index"&&S.cpSkillQuestionLine("post-1",d.envcStudents())==="");
  delete S.CPSK_DEMO_SKILL.tests;
  const n0=d._envs.writes.length;
  S.cpSkillSetHide(FB,true); await d.flush(); const h=d._envs.writes[n0];
  ok("🙈 Hide: ONE set at classSkills/<cid>/<key> = {hide, by, ts} (the class's layer, never the unit)", d._envs.writes.length===n0+1&&h.op==="set"&&h.path==="classSkills/"+CID+"/"+FB&&h.val.hide===true&&h.val.by==="uid_teacher_demo"&&typeof h.val.ts==="number"&&!("core" in h.val));
  ok("…the card shows it hidden with ↩ Show again, and the fold leaves it out", /hidden/.test(d.G.content)&&/↩ Show again/.test(d.G.content)&&!/🧩 Skills · 1/.test(d.G.content));
  d.envsDemoGo("kid"); ok("Kid: no Skills door, and the summary has no skills", !/🧩 Skills/.test(d.G.content)&&S.cpSkillSummary(K,d.masteryData,T0)===null);
  d.envsDemoGo("teacher"); d.envcView("setup"); S.cpSkillSetHide(FB,false); await d.flush(); const sh=d._envs.writes[n0+1];
  ok("↩ Show again: nothing left to differ → ONE remove of that skill's record", sh.op==="remove"&&sh.path==="classSkills/"+CID+"/"+FB&&!S._cpsk.L[CID][FB]);
  S.cpSkillSetCore(FB,false); await d.flush(); const co=d._envs.writes[n0+2];
  ok("Make optional: {core:false, by, ts}; the kid's list reads it optional", co.op==="set"&&co.val.core===false&&S.cpSkillList(undefined,undefined,{all:true})[0].core===false&&/sheet · optional/.test(d.G.content));
  S.cpSkillSetCore(FB,true); await d.flush(); ok("Make core again = the unit's own value → the record is removed", d._envs.writes[n0+3].op==="remove");
  S.cpSkillSetFinal("aquatics",true); await d.flush(); const pf=d._envs.writes[n0+4];
  ok("the final switch: ONE update at classes/<cid> with the one leaf plan/aquatics/skillsForFinal", pf.op==="update"&&pf.path==="classes/"+CID&&JSON.stringify(pf.val)===JSON.stringify({"plan/aquatics/skillsForFinal":true})&&d._envc.cls.plan.aquatics.skillsForFinal===true);
  ok("nothing else was written", d._envs.writes.length===n0+5&&d.G.writes.length===0); }

console.log("\n── the final waits for the core skills when the plan says so ──");
{ const d=demo("kid"), S=d.S, E=d.envt, u=d.unitStudies.nc_envirothon, st=()=>E.envtStatus(u,K,"soils");
  S._cpsk.demo.nc_envirothon.push({key:"soils.sheet",section:"soils",type:"sheet",label:"Soil sheet",core:true,data:S.CPSK_DEMO_SKILL.data});
  d._envs.cls.plan={soils:{finalAt:75}};
  ok("Soils at 75 % with 3 of 4 core cards learned: the final opens (CPFINAL) while skillsForFinal is off (the default)", st().post.open===true);
  d._envs.cls.plan.soils.skillsForFinal=true;
  ok("skillsForFinal on, the core skill not learned: the final waits, why = skills", st().post.open===false&&st().post.why==="skills");
  ok("the line says which: 'Final opens once the core skills are learned too · 0 of 1 (Soil sheet)'", E.envtCoreLine(K,"soils")==="Final opens once the core skills are learned too · 0 of 1 (Soil sheet)");
  d.envsView("scores"); ok("…on her Scores", /Final opens once the core skills are learned too · 0 of 1 \(Soil sheet\)/.test(d.G.content));
  d.masteryData.maya_skills={nc_envirothon:{"soils:sheet":{stage:"solo",learned:true,tries:[]}}};
  ok("the skill learned: the final opens", st().post.open===true&&E.envtCoreLine(K,"soils")==="");
  d.masteryData.maya_skills={}; S._cpsk.demo.nc_envirothon[1].core=false;
  ok("an optional (non-core) skill never holds it", st().post.open===true);
  S._cpsk.demo.nc_envirothon[1].core=true; d.masteryData.maya_tests.soils.postOpen=true;
  ok("the teacher's 'Open the final' still opens it", st().post.open===true);
  delete d.masteryData.maya_tests.soils.postOpen; d._envs.cls.plan.soils.finalAt=85;
  ok("below the card share it still says the cards (the skills line only once the cards are there)", st().post.why==="cards"&&/^Final opens at 85%/.test(E.envtCoreLine(K,"soils"))); }

console.log("\n── the rules file ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, C=R.classSkills&&R.classSkills.$cid, P=R.classes.$cid.plan.$key;
  ok("classSkills/<cid>: read by the class's logins (teacher, admin, its kids and parents)", C&&/logins\/'\+auth\.uid\+'\/cid'\)\.val\(\) == \$cid/.test(C[".read"])&&/teacher'\)\.val\(\) == auth\.uid/.test(C[".read"]));
  ok("…written per skill by the class's teacher or an admin; by == auth.uid; hide true / core boolean only", /teacher'\)\.val\(\) == auth\.uid/.test(C.$skill[".write"])&&/admins/.test(C.$skill[".write"])&&/newData\.child\('by'\)\.val\(\) == auth\.uid/.test(C.$skill[".validate"])&&C.$skill.hide[".validate"]==="newData.val() == true"&&C.$skill.core[".validate"]==="newData.isBoolean()"&&C.$skill.$other[".validate"]===false);
  ok("…the skill key is checked (\":\" for \".\")", /\$skill\.matches\(\/\^\[a-z0-9\]\[a-z0-9_:-\]/.test(C.$skill[".validate"])&&/^[a-z0-9][a-z0-9_:-]{0,59}$/.test(FB));
  ok("plan/<key>/skillsForFinal is a boolean", P.skillsForFinal&&P.skillsForFinal[".validate"]==="newData.isBoolean()"); }

};
run().then(()=>{ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); }).catch(e=>{ console.error(e); process.exit(1); });
