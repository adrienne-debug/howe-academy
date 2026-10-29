/*
 * Node tests — 📅 CPPACE, PR 8 of the class platform (DESIGN_class_platform_2026-10-28.md §8.1–§8.6, §8.10, §12, §13 row 8, §14 Q16/Q17;
 * her go 2026-10-28). Her words: "a pace target that gives her all the data and can manipulate things where she can see where kids need to
 * be and also kind of help her know what she needs, questions to take out, etc."
 *   · Where it sits and how it hooks: one block after CPSEATS_END; every hook line outside it is one typeof-guarded line.
 *   · THE PLANNER against the 2026-10-28 simulation: on that day's 1,660-core set (the per-deck core counts of the ENVUNIT commit, below)
 *     cpNeedPerDay gives the worked example — School days 21 · Weekdays through the holidays 17 · Weekends too 13 · Every day 11 — and the
 *     minutes about 60 / 52 / 43 / 38. On the unit as it is today the four calendars keep that order (no card count is pinned here: trims
 *     and core adds move them).
 *   · 📅 Pace in the demo console: the chip, the plan bar, the four calendars, every student by section, "Needs from now"; every lever is a
 *     what-if (no write) until Save, which writes one update at classes/<cid> and one per student changed. "Give Jonah N" turns his row to on
 *     pace before Save. Adrienne's locks grey what they lock. Core only reaches the kid's sitting. On pace on 📋 Class, the parent's page and
 *     ⚙️ Class settings.
 *   · Howe / Lincoln: no edition → every hook hands back what it was given; nothing drawn, read or written.
 * Uses the world from test_env_site.js (its `o.rev` line injects this block).                                    run: node test_cp_pace.js
 */
const {world,src}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const A=src.indexOf("// CPPACE_START"), B=src.indexOf("// CPPACE_END"), PACE=src.slice(A,B+"// CPPACE_END".length);
const NAMES="CPP_CALS, CPP_OFF_STD, CPP_SEND_PLAN, _cpp, cpPacePlan, cpNeedPerDay, cppDays, cppStudy, cppOffStd, cppSections, cppInputs, cppDraft, cppDraftOf, cppRow, cppIs, cppSet, cppOff, cppCoreOnly, cppStu, cppOpen, cppReset, cpPaceSave, cpPaceFlush, cpPaceChips, cpPaceHtml, cpPaceGridChip, cpPaceSumHtml, cpPaceParentHtml, cpPaceSumCore, cpPaceCoreOnly, cppLater";
const PX=PACE+"\nG.pace={ "+NAMES+" };";
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const NOW=Date.UTC(2026,9,29,15,0,0);   // the simulation's day
function demo(role,o){ o=o||{}; const w=world(Object.assign({fam:FAM,search:"?demo=1&role="+(role||"teacher"),rev:(o.pre||"")+PX,now:NOW},o.w||{})); w.envSiteDemoBoot(); w.renderAll(); w.P=w.G.pace; return w; }
const settle=w=>{ for(let i=0;i<6;i++){ const n=w.P.cpPaceFlush(); w.renderAll(); if(!n) break; } return w.G.content; };
const pace=w=>{ w.envcView("pace"); return settle(w); };
// the 2026-10-28 simulation's set: 1,660 core cards (git acc6787: envirothon/nc_envirothon_unit.json), per deck, in session order
const F1660=[["General Concepts · Terms","general",10],["General Concepts · Facts","general",0],["Forestry · Terms","forestry",166],["Forestry · Facts","forestry",157],["Forestry · ID","forestry",165],
  ["Soils and Land Use · Terms","soils",131],["Soils and Land Use · Facts","soils",114],["Soils and Land Use · ID","soils",34],["Aquatic Ecology · Terms","aquatics",163],["Aquatic Ecology · Facts","aquatics",158],
  ["Aquatic Ecology · ID","aquatics",104],["Wildlife · Terms","wildlife",193],["Wildlife · Facts","wildlife",132],["Wildlife · ID","wildlife",118],["Current Issue · 2027","cei",15]];
const SIM={start:"2026-10-29",goal:"2027-04-23",sendOn:{aquatics:"2026-11-02",wildlife:"2027-01-04",cei:"2027-02-23"},streak:2,rightRate:0.9,introDays:5,focus:2,target:0.95};

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ ok("one CPPACE block, after CPSEATS_END", A>0&&B>A&&src.indexOf("// CPPACE_START",A+1)<0&&src.indexOf("// CPSEATS_END")<A);
  const out=src.slice(0,A)+src.slice(B), hooks=out.split("\n").filter(l=>/📅 CPPACE/.test(l));
  ok("7 hook lines outside the block, each one typeof-guarded", hooks.length===7&&hooks.every(l=>/typeof cpPace\w+\s*===?\s*"function"/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  const fnOf=l=>{ const i=out.indexOf(l), j=out.lastIndexOf("\nfunction ",i); return out.slice(j+10,out.indexOf("(",j)); };
  ok("…in envSummary, envsParentHtml, envConsoleHtml ×2, envcGridHtml, envClsPanelHtml, mstPile", JSON.stringify(hooks.map(fnOf).sort())===JSON.stringify(["envClsPanelHtml","envConsoleHtml","envConsoleHtml","envSummary","envcGridHtml","envsParentHtml","mstPile"]), hooks.map(fnOf));
  ok("the hook point for a later PR is left, unbuilt: cpSkillsPaceHtml (25) (built: cpCalOf PR 22 test_cp_cal.js · cpSuggestHtml PR 16 test_cp_suggest.js · cpSendEarlyHtml PR 28 test_cp_send_early.js)", ["cpSkillsPaceHtml"].every(f=>new RegExp('typeof '+f+'==="function"').test(PACE)&&src.indexOf("function "+f+"(")<0)&&["cpSuggestHtml","cpSendEarlyHtml"].every(f=>src.indexOf("function "+f+"(")>0));
  ok("no 🔀 and no write but envcWrite (no firebase, no db.ref, no envcMulti)", PACE.indexOf("\u{1F500}")<0&&!/firebase\.|db\.ref|envcMulti|\.set\(|\.update\(/.test(PACE)); }

console.log("── the planner against the 2026-10-28 simulation ──");
{ const w=world({fam:{familyId:"howe",roster:[]},rev:PX}), P=w.G.pace, decks=F1660.map(r=>({key:r[0],section:r[1],n:r[2],core:r[2]})), off=P.cppOffStd();
  ok("the 1,660-core fixture adds up to 1,660", decks.reduce((a,d)=>a+d.core,0)===1660);
  const want={school:[21,60],weekdays:[17,52],noWeekends:[13,43],every:[11,38]}, got={};
  Object.keys(want).forEach(m=>{ const r=P.cpNeedPerDay(Object.assign({decks,calendar:{days:m,off}},SIM)); got[m]=[r.n,r.plan.minutesPerDay]; });
  ok("§8.5 worked example: 21 / 17 / 13 / 11 new cards a day for 95% of core by State", Object.keys(want).every(m=>got[m][0]===want[m][0]), got);
  ok("…about 60 / 52 / 43 / 38 minutes a day (±2)", Object.keys(want).every(m=>Math.abs(got[m][1]-want[m][1])<=2), got);
  const r21=P.cpPacePlan(Object.assign({decks,calendar:{days:"school",off},newPerDay:21},SIM)), r20=P.cpPacePlan(Object.assign({decks,calendar:{days:"school",off},newPerDay:20},SIM));
  ok("at 21 the goal is reached and the finish date is before State; at 20 it is not", r21.reached&&r21.finishDate<"2027-04-23"&&!r20.reached, [r21.finishDate,r21.pctAtGoal,r20.pctAtGoal]);
  ok("the same inputs give the same plan (a fixed seed)", JSON.stringify(P.cpPacePlan(Object.assign({decks,calendar:{days:"school",off},newPerDay:21},SIM)))===JSON.stringify(r21));
  ok("the curve: learned core per section by date, never more than the section has", Object.keys(r21.curve).length>100&&Object.keys(r21.curve).every(k=>Object.keys(r21.curve[k]).every(s=>r21.curve[k][s]<=r21.sections[s].total)));
  ok("…and nothing is learned in a section before it is sent out (Wildlife on Jan 4)", Object.keys(r21.curve).filter(k=>k<"2027-01-18").every(k=>!(r21.curve[k].wildlife>0)));
  const from={general:{learned:10,learning:0},forestry:{learned:400,learning:40},soils:{learned:100,learning:20}};
  const nf=P.cpNeedPerDay(Object.assign({decks,calendar:{days:"school",off},from},SIM));
  ok("a student already well along needs fewer a day from now", nf.n!=null&&nf.n<21, nf.n);
  const late=P.cpNeedPerDay(Object.assign({},SIM,{decks,calendar:{days:"school",off},start:"2027-02-01"}));
  ok("a student starting from nothing on Feb 1 needs more than 21 (or can't make it)", late.n==null||late.n>21, late.n);
  const capped=P.cpPacePlan(Object.assign({decks,calendar:{days:"school",off},newPerDay:21,seats:12},SIM));
  ok("12 cards a sitting holds the plan far short (the CPSEATS finding)", capped.pctAtGoal<50, capped.pctAtGoal);
  const all=F1660.map(r=>({key:r[0],section:r[1],n:r[2]*2,core:r[2]}));
  const cf=P.cpPacePlan(Object.assign({decks:all,calendar:{days:"school",off},newPerDay:21},SIM)), bank=P.cpPacePlan(Object.assign({decks:all,calendar:{days:"school",off},newPerDay:21,coreFirst:false},SIM));
  ok("core first with non-core cards in the decks: the core cards learn as in the core-only run (within 2%: the extra reviews only move the dice); in deck order they fall far short", Math.abs(cf.learnedAtGoal-r21.learnedAtGoal)<=0.02*1660&&bank.learnedAtGoal<0.8*cf.learnedAtGoal, [r21.learnedAtGoal,cf.learnedAtGoal,bank.learnedAtGoal]);
  ok("…the non-core cards cost minutes", cf.minutesPerDay>=r21.minutesPerDay);
  const co=P.cpPacePlan(Object.assign({decks:all,calendar:{days:"school",off},newPerDay:21,coreOnly:{forestry:true,soils:true,aquatics:true,wildlife:true,cei:true,general:true}},SIM));
  ok("Core only on every section = the core-only run", co.learnedAtGoal===r21.learnedAtGoal&&co.minutesPerDay===r21.minutesPerDay);
  // calendars
  const wk=["2026-11-23","2026-11-24","2026-11-25","2026-11-26","2026-11-27","2026-11-28","2026-11-29"], cal=m=>wk.map(d=>P.cppStudy({days:m,off},d)?1:0).join("");
  ok("Thanksgiving week: school 11000 00 · weekdays 11111 00 · weekends too 11000 11 · every day 11111 11", cal("school")==="1100000"&&cal("weekdays")==="1111100"&&cal("noWeekends")==="1100011"&&cal("every")==="1111111", [cal("school"),cal("weekdays"),cal("noWeekends"),cal("every")]);
  ok("the standard days off: Thanksgiving, winter break, MLK Day, spring break", off["2026-11-26"]&&off["2026-12-25"]&&off["2027-01-01"]&&off["2027-01-18"]&&off["2027-04-07"]&&!off["2026-12-16"]&&!off["2027-04-12"]);
}

console.log("── the unit as it is today: the same question, the real core counts (printed, not pinned) ──");
{ const w=demo("teacher"), P=w.P, S=P.cppSections(), decks=[].concat(...S.map(s=>s.decks)), core=decks.reduce((a,d)=>a+d.core,0), off=P.cppOffStd(), n={};
  ["school","weekdays","noWeekends","every"].forEach(m=>{ const r=P.cpNeedPerDay(Object.assign({decks,calendar:{days:m,off}},SIM)); n[m]=[r.n,r.plan.minutesPerDay]; });
  console.log("       today's core "+core+": "+JSON.stringify(n));
  ok("the sections and their core come from the unit's catalog (every deck has a core count)", S.length>=5&&decks.every(d=>Number.isInteger(d.core)&&d.core<=d.n)&&core>0);
  ok("the four calendars keep their order: school ≥ weekdays ≥ weekends too ≥ every day, each 5–50 a day", n.school[0]>=n.weekdays[0]&&n.weekdays[0]>=n.noWeekends[0]&&n.noWeekends[0]>=n.every[0]&&n.every[0]>=5&&n.school[0]<=50, n);
}

console.log("── 📅 Pace in the demo console ──");
{ const w=demo("teacher"), P=w.P; let h=settle(w);
  ok("📋 Class shows 📅 Pace as the next chip", /📋 Class<\/button><button[^>]*envcView\('pace'\)">📅 Pace</.test(h.replace(/\\u\{1F4CB\}/g,"📋")) || h.indexOf("envcView('pace')")>h.indexOf("envcView('grid')"), h.slice(h.indexOf("envs-chips"),h.indexOf("envs-chips")+300));
  ok("the demo class gets the worked example's days off and Right in a row 2", w._envc.cls.calendar.off["2026-12-25"]===true&&w._envc.cls.calendar.off["2027-01-18"]===true&&w._envc.cls.settings.drill.ladder_streak===2);
  ok("📋 Class: an on-pace mark under each name", (h.match(/title="against the 📅 Pace plan"/g)||[]).length===Object.keys(w._envc.students).length, (h.match(/title="against the 📅 Pace plan"/g)||[]).length);
  h=pace(w);
  ok("the plan bar: goal Area / State, target 95 %, the four study-day choices, ✎ Days off, New cards a day 5", /◉ Area Mar 22/.test(h)&&/○ State Apr 23/.test(h)&&/value="95"/.test(h)&&/◉ School days/.test(h)&&/○ Weekdays through the holidays/.test(h)&&/○ Weekends too/.test(h)&&/○ Every day/.test(h)&&/✎ Days off \(\d+\)/.test(h)&&/onchange="cppSet\('npd',this.value\)"/.test(h));
  ok("at the class's 5 a day the result line says how short it falls, and what the plan needs", /cpp-res miss/.test(h)&&/At 5 a day: \d+% of the [\d,]+ core cards by Area Mar 22/.test(h)&&/The plan needs <b>\d+ new cards a day<\/b>/.test(h), (h.match(/cpp-res[^]*?<\/div><\/div>/)||[""])[0].slice(0,400));
  ok("minutes are labelled estimates (20 s / 10 s) and the right rate an assumption", /about 20 s a card in the sitting and 10 s a drill card/.test(h)&&/an assumption you can change/.test(h));
  ok("each section: core count, sent or planned date, ☐ Core only", /Forestry<\/b> <span class="envs-muted">\d+ core · sent/.test(h)&&/Wildlife<\/b> <span class="envs-muted">\d+ core · opens Jan 4 \(planned\)/.test(h)&&(h.match(/> Core only<\/label>/g)||[]).length===P.cppSections().length);
  // the four calendars: each cell is cpNeedPerDay for a student starting today, from zero
  const d=P.cppDraft(), cellN=(m,g)=>{ const r=P.cpNeedPerDay(P.cppInputs(d,{goal:g,days:m,start:"2026-10-29",sid:""})); return r.n; };
  const st={}; ["school","weekdays","noWeekends","every"].forEach(m=>{ st[m]=cellN(m,"State"); });
  const tbl=h.slice(h.indexOf("📆 The four calendars"),h.indexOf("</table>",h.indexOf("📆 The four calendars")));
  ok("📆 The four calendars: Area and State columns, a row per calendar, each cell = New cards a day · minutes", /Area Mar 22<\/th><th>State Apr 23<\/th>/.test(tbl)&&(tbl.match(/<tr class/g)||[]).length===4&&!/…/.test(tbl));
  ok("…State's column is the worked example on today's unit (the same numbers the planner gives): "+JSON.stringify(st), ["school","weekdays","noWeekends","every"].every(m=>new RegExp('cppSet\\(\'days\',\''+m+'\'\\)"><td[^>]*>[○◉] [^<]+</td><td class="c">.*?</td><td class="c"><b>'+st[m]+'</b>').test(tbl)), tbl.slice(0,600));
  // the students
  const rows=h.slice(h.indexOf("Every student against the plan"));
  ok("every student against the plan: should be · is · a mark per section · needs from now", Object.keys(w._envc.students).every(sid=>rows.indexOf("cppOpen('"+sid+"')")>0)&&/<th class="c">Should be<\/th><th class="c">Is<\/th>/.test(rows)&&/<th>Needs from now<\/th>/.test(rows));
  ok("\"Is\" is marked ≈ while the demo's summaries carry no core counts", /<td class="c">≈\d+<\/td>/.test(rows));
  ok("Jonah has his own 3 a day (ENVCLASSSET's sample override): (3*)", /Jonah T\.<\/a> <span class="envs-muted" title="their own New cards a day">\(3\*\)<\/span>/.test(rows));
  // what-if: New cards a day 21 → no write, the page redraws
  const W0=w._envs.writes.length; P.cppSet("npd",21); h=settle(w);
  ok("New cards a day 21 → a what-if: no write, the banner says what changed, Save is live", w._envs.writes.length===W0&&/What-if: New cards a day changed/.test(h)&&/<button class="envs-btn" onclick="cpPaceSave\(\)">Save this plan/.test(h));
  { const rr=h.slice(h.indexOf("Every student against the plan"));
    ok("…every row redraws against 21 a day: marks in days ▲ ahead / ● / ▼ behind; – for a section not sent", /▲ \d+ d/.test(rr)&&/▼ \d+ d/.test(rr)&&/>–<\/td>/.test(rr), rr.slice(0,900)); }
  P.cppSet("goal","State"); h=settle(w);
  ok("State as the goal: the result line now aims at State Apr 23", /◉ State Apr 23/.test(h)&&/State Apr 23\)?/.test((h.match(/cpp-res[^]*?<\/div>/)||[""])[0]));
  // Jonah: his row, his need, "give Jonah N" → on pace before Save
  const sid="tran_jonah"; P.cppOpen(sid); h=settle(w);
  const r0=P.cppRow(Object.assign({sid},w._envc.students[sid]),P.cppDraft(),P.cpPacePlan(P.cppInputs(P.cppDraft())),{sync:true});
  ok("Jonah: behind — he needs more than his own 3 a day from now ⚠", r0.verdict&&r0.verdict.k==="behind"&&r0.need&&r0.need.n>3, [r0.verdict,r0.need&&r0.need.n,r0.gap]);
  ok("his open row: per section should / is, his weakest cards, his check-in, his own New cards a day, a \"Give Jonah N\" button", /should be \d+ · is ≈\d+ of \d+ core/.test(h)&&/weakest: Cambium/.test(h)&&/check-in 7\/15/.test(h)&&new RegExp("Give Jonah "+r0.need.n).test(h));
  P.cppStu(sid,r0.need.n); h=settle(w);
  const r1=P.cppRow(Object.assign({sid},w._envc.students[sid]),P.cppDraft(),P.cpPacePlan(P.cppInputs(P.cppDraft())),{sync:true});
  ok("give Jonah "+r0.need.n+" a day → his row turns to on pace, before Save, with no write", (r1.verdict.k==="on"||r1.verdict.k==="ahead")&&w._envs.writes.length===W0&&new RegExp("Jonah T\\.</a> <span[^>]*>\\("+r0.need.n+"\\*\\)</span><div[^>]*>(● on pace|▲ \\d+ d ahead)").test(h), r1.verdict);
  // Core only for Soils, then Save
  P.cppCoreOnly("soils",true); h=settle(w);
  ok("Core only for Soils is a what-if too", /What-if: [^<]*core only/.test(h)&&w._envs.writes.length===W0);
  P.cpPaceSave(); await w.flush(); h=settle(w);
  const wr=w._envs.writes.slice(W0);
  ok("Save: one update at classes/<cid> (goal, New cards a day, Core only) + one at students/tran_jonah/settings/study", wr.length===2&&wr[0].op==="update"&&wr[0].path==="classes/ms-science-2026"&&JSON.stringify(wr[0].val)===JSON.stringify({goal:{name:"State",pct:95},"settings/study/newPerDay":21,"plan/soils/coreOnly":true})&&wr[1].path==="students/tran_jonah/settings/study"&&wr[1].val.newPerDay===r0.need.n, wr);
  ok("…the class now carries them (the demo's state), the draft starts again from it, nothing left to save", w._envc.cls.goal.name==="State"&&w._envc.cls.settings.study.newPerDay===21&&w._envc.cls.plan.soils.coreOnly===true&&w._envc.students[sid].settings.study.newPerDay===r0.need.n&&!/What-if:/.test(h));
  // ✎ days off: a tap takes a day off; the calendar saves as {days, off}
  P.cppSet("days","noWeekends"); w._cpp=P._cpp; P._cpp.offOpen=true; h=settle(w);
  ok("✎ Days off opens a month grid with the days off in red", /class="cpp-mo"/.test(h)&&/class="off" aria-label="2026-11-26 off"/.test(h));
  P.cppOff("2026-11-30"); P.cpPaceSave(); await w.flush();
  const wc=w._envs.writes[w._envs.writes.length-1];
  ok("Save writes the calendar whole: {days: noWeekends, off: {… 2026-11-30}}", wc.path==="classes/ms-science-2026"&&wc.val.calendar&&wc.val.calendar.days==="noWeekends"&&wc.val.calendar.off["2026-11-30"]===true&&wc.val.calendar.off["2026-11-26"]===true&&Object.keys(wc.val).length===1, wc);
  // ⚙️ Class settings carries the one-line summary
  w.envcView("classset"); h=settle(w);
  ok("⚙️ Class settings: \"📅 Pace: 21 new a day · …\" with a link to 📅 Pace", /<b>📅 Pace:<\/b> 21 new a day · /.test(h.replace(/\\u\{1F4C5\}/g,"📅"))&&/envcView\('pace'\)">Open/.test(h));
}

console.log("── Adrienne's locks ──");
{ const w=demo("teacher"), P=w.P; w._envcs.locks={newPerDay:true}; w._envc.cls.locks={plan:true}; let h=pace(w);
  ok("New cards a day locked: greyed, \"🔒 set by Adrienne\"; Core only greyed by locks/plan", /onchange="cppSet\('npd',this.value\)"[^>]*|disabled onchange="cppSet\('npd'/.test(h)&&/value="5" disabled onchange="cppSet\('npd'/.test(h)&&/🔒 set by Adrienne/.test(h.replace(/\\u\{1F512\}/g,"🔒"))&&/disabled onchange="cppCoreOnly/.test(h));
  const W0=w._envs.writes.length; P.cppDraft().npd=21; P.cppCoreOnly("soils",true); P.cpPaceSave(); await w.flush();
  const toast=()=>{ const t=w.G.created.filter(e=>e.id==="envs-toast"); return t.length?t[t.length-1].textContent:""; };
  ok("…the teacher's save refuses them (no write, a 🔒 note)", w._envs.writes.length===W0&&/Set by Adrienne: New cards a day/.test(toast()), toast());
  w._envs.role="admin"; P.cppDraft().npd=21; P.cpPaceSave(); await w.flush();
  ok("Adrienne herself saves it", w._envs.writes.length===W0+1&&w._envs.writes[W0].val["settings/study/newPerDay"]===21);
}

console.log("── the parent's page and the kid's sitting ──");
{ const w=demo("parent"), P=w.P, h=w.G.content;
  ok("Parent: \"📅 On pace for Area (Mar 22)?\" with Maya's mark, should be / has, per section, and her New cards a day from now", /On pace for Area \(Mar 22\)\?/.test(h)&&/the class plan has about \d+ core cards learned in the sections Maya has; Maya has about \d+/.test(h)&&/Forestry <b/.test(h)&&/new cards a day<\/b> from now/.test(h), h.slice(h.indexOf("On pace for"),h.indexOf("On pace for")+600));
  // core only in the 🌿 sitting (CPCORE's core set; the demo deck has two non-core cards)
  const wc=demo("kid",{w:{cpcore:true}}), Q=wc.P, names=["Forbs","Foliage","Cambium","Crown"], ses={decks:["Forestry · Terms"]};
  ok("Core only off: the sitting's names come back as they were (the very array)", Q.cpPaceCoreOnly("maya",ses,"Forestry · Terms",names)===names);
  wc._envc.cls.plan=Object.assign({},wc._envc.cls.plan,{forestry:{coreOnly:true}});
  const out=Q.cpPaceCoreOnly("maya",ses,"Forestry · Terms",names);
  ok("Core only on for Forestry: the non-core cards wait (Forbs, Foliage out), the core ones stay", JSON.stringify(out)===JSON.stringify(["Cambium","Crown"]), out);
  ok("…another kid (not the site's own) gets the very array back", Q.cpPaceCoreOnly("lincoln",ses,"Forestry · Terms",names)===names);
}

console.log("── the summary's core counts (the site kid's own app) ──");
{ const STUB='function envtCoreCount(kid,st){ return st==="forestry"?{learned:3,total:10}:{learned:0,total:0}; }\n';
  const w=world({fam:FAM,rev:STUB+PX,now:NOW}); w._envs.role="kid"; w._envs.kid="maya"; w.masteryData.maya=[{subject:"Forestry · Terms",prompt:"a",status:"active"},{subject:"Forestry · Terms",prompt:"b",status:"introduction"},{subject:"Forestry · Terms",prompt:"c",status:"active"},{subject:"Forestry · Terms",prompt:"d",status:"active"},{subject:"Forestry · Facts",prompt:"e",status:"introduction"}];
  const o={byDeck:{}}; w.G.pace.cpPaceSumCore("maya",o,{});
  ok("on the site: summary.core.forestry = {learned 3, total 10, learning 2}", JSON.stringify(o.core)===JSON.stringify({forestry:{learned:3,total:10,learning:2}}), o.core);
  const P=w.G.pace, st=P.cppSections().find(s=>s.id==="forestry");
  ok("…and the console reads it exactly (no ≈)", JSON.stringify(P.cppIs({core:o.core},st))===JSON.stringify({learned:3,learning:2,est:false}));
  ok("envSummary carries the line before its return (other blocks' one-line hooks may sit between)", /if\(typeof cpPaceSumCore==="function"\) cpPaceSumCore\(kid,out,ctx\);[^\n]*\n(?:  if\(typeof cp\w+[^\n]*\n){0,3}  return out;\n\}/.test(src));
}

console.log("── Howe / Lincoln: the hooks say no ──");
{ const w=world({fam:{familyId:"howe",roster:["lincoln"]},rev:PX}), P=w.G.pace, chips=[["grid","x"]], out={byDeck:{}}, names=["a","b"];
  ok("no edition: 📅 Pace is not added, nothing draws", P.cpPaceChips(chips)===chips&&chips.length===1&&P.cpPaceHtml()===""&&P.cpPaceGridChip({sid:"howe_lincoln",summary:{}})===""&&P.cpPaceSumHtml()===""&&P.cpPaceParentHtml("lincoln")==="");
  ok("Lincoln's summary comes back the very object, with no core field (his mirror publishes what it did)", P.cpPaceSumCore("lincoln",out,{})===out&&!("core" in out));
  ok("his 🌿 sitting's names come back the very array", P.cpPaceCoreOnly("lincoln",{decks:["Forestry · Terms"]},"Forestry · Terms",names)===names);
  ok("nothing read, listened to or written; no timer queued", w.G.reads.length===0&&w.G.listeners.length===0&&w.G.writes.length===0&&!(w.G.timers||[]).length&&P._cpp.q.length===0);
}
{ // 🏫 Class setup's study-day words follow the planner (the load step, run where CPCLASS sits before this block in index.html)
  const cal=src.slice(src.indexOf("const CP_CAL_DAYS="),src.indexOf("\n",src.indexOf("const CP_CAL_DAYS="))), step=PACE.slice(PACE.indexOf("CPP_CALS.forEach(c=>{ try{ if(typeof CP_CAL_DAYS"),PACE.indexOf("\n",PACE.indexOf("CPP_CALS.forEach(c=>{ try{ if(typeof CP_CAL_DAYS")));
  const defs=PACE.slice(PACE.indexOf("const CPP_CALS="),PACE.indexOf("\n",PACE.indexOf("const CPP_CALS=")));
  const L=new Function(cal+"\n"+defs+"\n"+step+"\nreturn CP_CAL_DAYS;")();
  ok("🏫 Class setup reads: School days (Monday to Friday, days off skipped) · Weekends too (every day but the days off) …", L.find(x=>x[0]==="school")[1]==="School days (Monday to Friday, days off skipped)"&&L.find(x=>x[0]==="noWeekends")[1]==="Weekends too (every day but the days off)"&&L.length===4, L);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
