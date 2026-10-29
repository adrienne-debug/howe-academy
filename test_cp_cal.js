/*
 * Node tests — 📅 CPCAL, PR 22 of the class platform (DESIGN_class_platform_2026-10-28.md §8.10, §8.6, §9, §13 row 22, §14 Q16/Q33). From
 * the class syllabus (2026-10-28): the class meets every other Tuesday and students study at home on their own family's days.
 *   · the block and its typeof-guarded hooks; writes only through envcWrite / envsWrite;
 *   · the pure parts: weekday sets and their words, a family's record, a study day on a weekday calendar (and CPPACE's four unchanged), the
 *     family's days on the class's days off, the goal list (first = the target), the meetings and their targeted update;
 *   · the one reader, cpStudyDays(sid) / cpIsStudyDay (PR 17 reads it): the family's own, else the class's; the kid's live listener;
 *   · the planner: Mon–Thu needs more new cards a day than Mon–Fri;
 *   · the demo: Parent ▸ 📅 Our study days ▸ Mon–Thu ▸ Save ▸ Teacher ▸ 📅 Pace: Maya's "Needs from now" changes; the switch (Q33 open:
 *     off = the parent can't change them); the teacher's student page; 🗓 meetings on 📅 Pace (+ the dot on ✎ Days off); "Next class" in
 *     Send out opens CPSEND's sheet filled in and writes nothing;
 *   · the rules; Howe / Lincoln: no edition → nothing drawn, read or written.
 * Uses the world from test_env_site.js; its `o.rev` line injects CPPACE, CPSEND and this block.                     run: node test_cp_cal.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const PACE=cut("// CPPACE_START","// CPPACE_END"), SEND=cut("// CPSEND_START","// CPSEND_END"), CAL=cut("// CPCAL_START","// CPCAL_END");
const PN="_cpp, cpPacePlan, cpNeedPerDay, cppStudy, cppOffStd, cppSections, cppInputs, cppDraft, cppRow, cppOff, cpPaceFlush, cpPaceHtml, cpPaceParentHtml";
const CN="CPCAL_DEMO_MEET, _cpcal, cpcalWdNorm, cpcalWdLabel, cpCalNorm, cpCalStudy, cpCalMerge, cpStudyDays, cpIsStudyDay, cpCalOf, cpCalListen, cpGoalList, cpCalMeetings, cpCalNextMeeting, cpCalMeetUpdate, cpCalMeetIn, cpCalMeetAdd, cpCalMeetDel, cpCalMeetSave, cpCalMeetUndo, cpCalFamilySet, cpCalTap, cpCalSave, cpCalClear, cpCalUndo, cpCalStudentHtml, cpCalParentHtml, cpCalPaceHtml, cpCalNextHtml, cpCalSendNext, cpCalGoalsHtml, cpCalDot, cpCalDetailLine";
const REV=PACE+"\n"+SEND+"\n"+CAL+"\nG.pace={ "+PN+" };\nG.cal={ "+CN+" };\nG.cpsd={ get sheet(){ return _cpsd.sheet; } };";
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const NOW=Date.UTC(2026,9,29,15,0,0);   // Thu Oct 29, 2026
const CID="ms-science-2026", SID="ramirez_maya";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:REV,now:NOW},o)); w.P=w.G.pace; w.C=w.G.cal; return w; }
function demo(role){ const w=W({search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
const settle=w=>{ for(let i=0;i<8;i++){ const n=w.P.cpPaceFlush(); w.renderAll(); if(!n) break; } return w.G.content; };
const row=(w,sid)=>w.P.cppRow(Object.assign({sid},w._envc.students[sid]),w.P.cppDraft(),w.P.cpPacePlan(w.P.cppInputs(w.P.cppDraft())),{sync:true});
const parentNeed=h=>{ const m=/<b>(\d+) new cards a day<\/b> from now/.exec(h); return m?+m[1]:null; };

const run=async()=>{
console.log("── the block and its hooks ──");
{ const a=src.indexOf("// CPCAL_START"), b=src.indexOf("// CPCAL_END");
  ok("one CPCAL block, with the syllabus's words, the date and Q33", a>0&&b>a&&src.indexOf("// CPCAL_START",a+1)<0&&/every other Tuesday/.test(CAL.slice(0,900))&&/2026-10-28/.test(CAL.slice(0,600))&&/Q33/.test(CAL.slice(0,2400)));
  const hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/📅 CPCAL/.test(l));
  ok("its one-line hooks are each tagged 📅 CPCAL and typeof-guarded ("+hooks.length+")", hooks.length>=8&&hooks.every(l=>/typeof cpCal\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,90)));
  ok("…cppStudy, the Pace note, goals, ✎ Days off, the open row, 📅 Pace, the parent page, the listener, the student page, Send out", ["cpCalStudy(cal,s)","cpCalPaceNote()","cpCalGoalsHtml(d)","cpCalDot(ds)","cpCalDetailLine(r.sid)","cpCalPaceHtml(ctx)","cpCalParentHtml(kid)","cpCalListen(sdb,re)","cpCalStudentHtml(sid)","cpCalNextHtml()"].every(f=>hooks.some(l=>l.indexOf(f)>=0)));
  ok("CPPACE's own hook point cpCalOf(sid) is what this block defines", /typeof cpCalOf==="function"&&cpCalOf\(s\.sid\)/.test(PACE)&&/\nfunction cpCalOf\(sid\)/.test(CAL));
  ok("writes only through envcWrite / envsWrite (no firebase, no db.ref, no .set( / .update( of its own); no 🔀", !/firebase\.|\bdb\.ref|\.set\(|\.update\(/.test(CAL)&&/envcWrite\("classes\/"\+_envc\.cid,upd,"update"\)/.test(CAL)&&/envsWrite\(path,val,op\)/.test(CAL)&&CAL.indexOf("\u{1F500}")<0); }

console.log("── the pure parts ──");
{ const w=W(), C=w.C, P=w.P, off=P.cppOffStd();
  ok("weekday sets: \"4321\" → \"1234\"; junk → \"\"", C.cpcalWdNorm("4321")==="1234"&&C.cpcalWdNorm("17")===""&&C.cpcalWdNorm("")===""&&C.cpcalWdNorm(null)===""&&C.cpcalWdNorm("0606")==="06");
  ok("their words: Mon–Thu · Mon–Fri · Every day · Mon, Wed, Fri · Sat, Sun · Tue", C.cpcalWdLabel("1234")==="Mon–Thu"&&C.cpcalWdLabel("12345")==="Mon–Fri"&&C.cpcalWdLabel("0123456")==="Every day"&&C.cpcalWdLabel("135")==="Mon, Wed, Fri"&&C.cpcalWdLabel("06")==="Sat, Sun"&&C.cpcalWdLabel("2")==="Tue");
  ok("a family's record: {days, by, role, at, off?} → {wd, …}; a bad one is null", JSON.stringify(C.cpCalNorm({days:"4321",by:"u",role:"parent",at:5,off:{"2026-11-26":true,"x":true}}))===JSON.stringify({wd:"1234",by:"u",role:"parent",at:5,off:{"2026-11-26":true}})&&C.cpCalNorm({days:"8"})===null&&C.cpCalNorm(null)===null&&C.cpCalNorm("1234")===null);
  const wk=["2026-11-23","2026-11-24","2026-11-25","2026-11-26","2026-11-27","2026-11-28","2026-11-29"], m=c=>wk.map(d=>C.cpCalStudy(c,d)?1:0).join("");
  const own=C.cpCalMerge({days:"school",off},{wd:"1234"});
  ok("Mon–Thu on School days: Thanksgiving week 1100000 (the class's days off skipped), the week after 1111000", m(own)==="1100000"&&["2026-11-30","2026-12-01","2026-12-02","2026-12-03","2026-12-04","2026-12-05","2026-12-06"].map(d=>C.cpCalStudy(own,d)?1:0).join("")==="1111000", m(own));
  ok("…on Weekdays through the holidays the family studies through them (1111000); their own days off win", m(C.cpCalMerge({days:"weekdays",off},{wd:"1234"}))==="1111000"&&m(C.cpCalMerge({days:"school",off},{wd:"1234",off:{"2026-11-24":true}}))==="1011000");
  ok("cppStudy hands a weekday calendar to cpCalStudy (the hook), CPPACE's four answer as before", wk.map(d=>P.cppStudy(own,d)?1:0).join("")==="1100000"&&wk.map(d=>P.cppStudy({days:"school",off},d)?1:0).join("")==="1100000"&&wk.map(d=>P.cppStudy({days:"every",off},d)?1:0).join("")==="1111111"&&wk.map(d=>C.cpCalStudy({days:"noWeekends",off},d)?1:0).join("")==="1100011");
  const G2=[{name:"Area",date:"2027-03-22"},{name:"State",date:"2027-04-23",note:"top 7 MS teams at Area qualify"}];
  ok("the goal list: in order, the FIRST is the target by default; the class's pick wins; a bad date drops", JSON.stringify(C.cpGoalList({goals:G2}).map(x=>x.target))==="[true,false]"&&JSON.stringify(C.cpGoalList({goals:G2,goal:{name:"State"}}).map(x=>x.target))==="[false,true]"&&C.cpGoalList({goals:G2.concat([{name:"X",date:"soon"}])}).length===2&&C.cpGoalList({goals:G2})[1].note==="top 7 MS teams at Area qualify");
  const ms=C.cpCalMeetings({meetings:C.CPCAL_DEMO_MEET});
  ok("meetings: by date, from an object or a list; the next one from today (or today's)", ms.length===10&&ms[0].date==="2026-09-15"&&ms[4].sec==="aquatics"&&C.cpCalMeetings({meetings:["2026-11-10",{date:"2026-10-01",what:"x"},"nope"]}).map(x=>x.date).join()==="2026-10-01,2026-11-10"&&C.cpCalNextMeeting({meetings:C.CPCAL_DEMO_MEET},"2026-10-29").date==="2026-11-10"&&C.cpCalNextMeeting({meetings:C.CPCAL_DEMO_MEET},"2026-11-10").date==="2026-11-10"&&C.cpCalNextMeeting({},"2026-10-29")===null);
  ok("the meetings' update is targeted: a path per changed date, null for one taken out, nothing when nothing changed", JSON.stringify(C.cpCalMeetUpdate(ms,ms))==="{}"&&JSON.stringify(C.cpCalMeetUpdate(ms.slice(0,2),[ms[1],{date:"2026-11-17",what:"Field trip",sec:""}]))===JSON.stringify({"meetings/2026-11-17":{what:"Field trip"},"meetings/2026-09-15":null})&&JSON.stringify(C.cpCalMeetUpdate([ms[4]],[Object.assign({},ms[4],{what:"Streams"})]))===JSON.stringify({"meetings/2026-11-10":{what:"Streams",sec:"aquatics"}})); }

console.log("── the planner: a family's four days ──");
{ const w=demo("teacher"), P=w.P, C=w.C, S=P.cppSections(), decks=[].concat(...S.map(s=>s.decks)), off=P.cppOffStd();
  const base={decks,start:"2026-10-29",goal:"2027-03-22",streak:2,rightRate:0.9,introDays:5,focus:2,target:0.95};
  const five=P.cpNeedPerDay(Object.assign({},base,{calendar:{days:"school",off}})), four=P.cpNeedPerDay(Object.assign({},base,{calendar:C.cpCalMerge({days:"school",off},{wd:"1234"})}));
  console.log("       Area, from nothing on Oct 29: Mon–Fri "+five.n+" a day · Mon–Thu "+four.n+" a day");
  ok("Mon–Thu needs more new cards a day than Mon–Fri for the same goal", five.n!=null&&(four.n==null||four.n>five.n), [five.n,four.n]); }

console.log("── the reader (PR 17) and the kid's listener ──");
{ const w=W({remote:{["students/"+SID+"/calendar"]:{days:"135",by:"uid_p_maya",role:"parent",at:1}}}), C=w.C;
  w._envs.role="kid"; w._envs.sid=SID; w._envs.kid="maya";
  ok("before the listener: the class's days (no class record → School days, the standard days off)", (c=>c.own===false&&c.days==="school"&&c.off["2026-11-26"]===true&&/School days \(Mon–Fri\)/.test(c.label))(C.cpStudyDays(SID)));
  ok("the kid's app keeps ONE live listener on students/<sid>/calendar (a second call adds none)", C.cpCalListen(w.firebase.database(),()=>{})===true&&C.cpCalListen(w.firebase.database(),()=>{})===false&&w.G.listeners.filter(l=>l.p==="students/"+SID+"/calendar").length===1);
  const c=C.cpStudyDays(SID);
  ok("cpStudyDays: the family's own Mon, Wed, Fri, on the class's days off", c.own===true&&c.wd==="135"&&c.label==="Mon, Wed, Fri"&&c.role==="parent"&&c.off["2026-11-25"]===true, c);
  ok("cpIsStudyDay: Mon Nov 2 yes · Tue Nov 3 no · Wed Nov 25 (Thanksgiving off) no", C.cpIsStudyDay(SID,"2026-11-02")===true&&C.cpIsStudyDay(SID,"2026-11-03")===false&&C.cpIsStudyDay(SID,"2026-11-25")===false);
  ok("…and CPPACE's hook gets the same calendar", JSON.stringify(C.cpCalOf(SID))===JSON.stringify({days:"own",wd:"135",off:c.off}));
  ok("nothing written", w.G.writes.length===0); }

console.log("── the demo: Parent ▸ Our study days: Mon–Thu ▸ Teacher ▸ 📅 Pace ──");
{ const w=demo("teacher"), P=w.P, C=w.C;
  ok("the sample class gets the syllabus's meetings and the families' switch ON (the demo only)", Object.keys(w._envc.cls.meetings||{}).length===10&&w._envc.cls.meetings["2026-11-10"].sec==="aquatics"&&w._envc.cls.familyDays===true);
  w.envcView("pace"); settle(w); const r0=row(w,SID);
  w.envsDemoGo("parent"); let h=w.G.content; const need0=parentNeed(h);
  ok("Parent: 📅 Our study days — the class's School days (Mon–Fri), seven chips, Mon–Fri on and live", /📅 Our study days/.test(h.replace(/\\u\{1F4C5\}/g,"📅"))&&/<b>School days \(Mon–Fri\)<\/b> <span class="envs-muted">· the class’s days<\/span>/.test(h)&&(h.match(/onclick="cpCalTap\('ramirez_maya',\d\)"/g)||[]).length===7&&(h.match(/class="on" aria-pressed="true" onclick="cpCalTap/g)||[]).length===5, h.slice(h.indexOf("Our study days"),h.indexOf("Our study days")+900));
  ok("…the two-week strip (🏫 on Tue Oct 27, Soils) and the next class: Tue Nov 10 · Aquatics (in 12 days)", /class="cpcal-strip"/.test(h)&&/title="Tue Oct 27 · study day · class: Soils"/.test(h)&&/Next class: Tue Nov 10<\/b> · Aquatics <span class="envs-muted">\(in 12 days\)/.test(h));
  ok("…the goals: 🎯 Area Mar 22, the pace aims here; State Apr 23 · top 7 MS teams at Area qualify", /<b>Area Mar 22<\/b> <span class="envs-muted">· the pace aims here/.test(h)&&/State Apr 23 · top 7 MS teams at Area qualify/.test(h));
  const W0=w._envs.writes.length; C.cpCalTap(SID,5); h=w.G.content;
  ok("tap Fri → a draft: Mon–Thu, not saved yet, no write", /Mon–Thu — not saved yet/.test(h)&&w._envs.writes.length===W0&&C._cpcal.draft[SID]==="1234");
  await C.cpCalSave(SID); await w.flush(); h=w.G.content; const wr=w._envs.writes.slice(W0);
  ok("Save: ONE write, set students/ramirez_maya/calendar = {days 1234, by uid_p_maya, role parent, at}", wr.length===1&&wr[0].op==="set"&&wr[0].path==="students/"+SID+"/calendar"&&wr[0].val.days==="1234"&&wr[0].val.by==="uid_p_maya"&&wr[0].val.role==="parent"&&typeof wr[0].val.at==="number"&&Object.keys(wr[0].val).length===4, wr);
  ok("…the card reads Mon–Thu · set by the family; Fri is off on the strip", /<b>Mon–Thu<\/b> <span class="envs-muted">· set by the family/.test(h)&&/title="Fri Oct 30"/.test(h)&&/title="Thu Oct 29 · study day"/.test(h));
  const need1=parentNeed(h);
  ok("…the parent's own on-pace card counts the four days too ("+need0+" → "+need1+" a day)", need0!=null&&need1!=null&&need1>need0, [need0,need1]);
  w.envsDemoGo("teacher"); w.envcView("pace"); h=settle(w); const r1=row(w,SID);
  ok("Teacher ▸ 📅 Pace: Maya's \"Needs from now\" changes ("+(r0.need&&r0.need.n)+" → "+(r1.need&&r1.need.n)+" a day)", r0.need&&r1.need&&r0.need.n!=null&&(r1.need.n==null||r1.need.n>r0.need.n), [r0.need&&r0.need.n,r1.need&&r1.need.n]);
  ok("…🗓 card: \"Their own days: Maya R. Mon–Thu (the family)\"; the switch is on", /Their own days: <b>Maya R\.<\/b> Mon–Thu <span class="envs-muted">\(the family\)/.test(h)&&/<input type="checkbox" style="width:20px;height:20px" checked onchange="cpCalFamilySet\(this\.checked\)">/.test(h));
  ok("…the study-day note says a student's own days count instead", /This is the class default; a student with their own study days/.test(h)&&!/Per-family study days come later/.test(h));
  P._cpp.open=SID; h=settle(w);
  ok("…Maya's open row: 📅 Study days: Mon–Thu (set by the family)", /📅 Study days: <b>Mon–Thu<\/b> \(set by the family\)/.test(h.replace(/\\u\{1F4C5\}/g,"📅")));
  ok("…another student still uses the class's days (cpCalOf null)", C.cpCalOf("tran_jonah")===null&&C.cpStudyDays("tran_jonah").own===false); }

console.log("── the switch: Q33 is open, so the family's half is OFF unless she turns it on ──");
{ const w=demo("teacher"), C=w.C; w.envcView("pace"); settle(w);
  const W0=w._envs.writes.length; C.cpCalFamilySet(false); await w.flush();
  ok("the teacher turns it off: ONE update classes/<cid> {familyDays:false}", w._envs.writes.length===W0+1&&w._envs.writes[W0].op==="update"&&w._envs.writes[W0].path==="classes/"+CID&&JSON.stringify(w._envs.writes[W0].val)==='{"familyDays":false}'&&w._envc.cls.familyDays===false);
  w.envsDemoGo("parent"); let h=w.G.content; const W1=w._envs.writes.length;
  ok("Parent: the days show read-only (chips disabled), \"Maya’s teacher sets the study days.\"", /Maya’s teacher sets the study days\./.test(h)&&/aria-pressed="true" disabled onclick="cpCalTap/.test(h)&&!/cpCalSave\('ramirez_maya'\)/.test(h));
  ok("…a tap or a save does nothing and writes nothing", C.cpCalTap(SID,5)===false&&(await C.cpCalSave(SID))===false&&w._envs.writes.length===W1);
  delete w._envc.cls.familyDays; h=(w.renderAll(),w.G.content);
  ok("no switch saved at all = off (the default)", /Maya’s teacher sets the study days\./.test(h)&&C.cpCalTap(SID,5)===false);
  const T=world({fam:FAM,rev:REV,now:NOW}).G.cal; ok("…and a class that isn't the demo never gets it turned on for it (only the demo seeds familyDays)", /if\(c\.familyDays==null\) c\.familyDays=true/.test(CAL)&&/function cpcalDemoSeed\(\)\{ if\(_cpcal\.demo\|\|!cpcalDemo\(\)/.test(CAL)&&T._cpcal.demo===false); }

console.log("── the parent PIN (CPDRILLPARENT's) guards the chips ──");
{ const w=W({search:"?demo=1&role=parent",rev:REV+"\nfunction cpdrLocked(){ return G.pinLocked===true; }"}); w.G.pinLocked=true; w.envSiteDemoBoot(); w.renderAll(); let h=w.G.content; const C=w.C, W0=w._envs.writes.length;
  ok("PIN locked: the chips are disabled, \"Unlock with the parent PIN on 🧠 Review cards\", a tap does nothing", /Unlock with the parent PIN on .{1,12} Review cards to change them/.test(h)&&/aria-pressed="true" disabled onclick="cpCalTap/.test(h)&&C.cpCalTap(SID,5)===false&&w._envs.writes.length===W0);
  w.G.pinLocked=false; w.renderAll(); h=w.G.content;
  ok("…unlocked: the chips are live", /class="on" aria-pressed="true" onclick="cpCalTap\('ramirez_maya'/.test(h)&&C.cpCalTap(SID,5)===true); }

console.log("── the teacher's student page ──");
{ const w=demo("teacher"), C=w.C; w.envcView("student",SID); let h=w.G.content;
  ok("📅 Study days for Maya R.: the chips (live), the strip, where it is saved", /Study days for Maya R\./.test(h)&&(h.match(/class="on" aria-pressed="true" onclick="cpCalTap\('ramirez_maya'/g)||[]).length===5&&/Saved at students\/ramirez_maya\/calendar/.test(h));
  const W0=w._envs.writes.length; C.cpCalTap(SID,1); C.cpCalTap(SID,3); C.cpCalTap(SID,5); await C.cpCalSave(SID); await w.flush(); h=w.G.content;
  const x=w._envs.writes[W0];
  ok("Tue + Thu only → Save: set students/<sid>/calendar {days 24, by the teacher's uid, role teacher}", w._envs.writes.length===W0+1&&x.op==="set"&&x.path==="students/"+SID+"/calendar"&&x.val.days==="24"&&x.val.role==="teacher"&&x.val.by==="uid_teacher_demo"&&/<b>Tue, Thu<\/b> <span class="envs-muted">· set by the teacher/.test(h), x);
  await C.cpCalClear(SID); await w.flush(); h=w.G.content; const y=w._envs.writes[W0+1];
  ok("Use the class’s days → remove students/<sid>/calendar; back to School days", y.op==="remove"&&y.path==="students/"+SID+"/calendar"&&!w._envc.students[SID].calendar&&/<b>School days \(Mon–Fri\)<\/b>/.test(h));
  ok("keeps at least one day", (C.cpCalTap(SID,1),C.cpCalTap(SID,2),C.cpCalTap(SID,3),C.cpCalTap(SID,4),C.cpCalTap(SID,5)===false)&&C._cpcal.draft[SID]==="5"); }

console.log("── 🗓 class meetings on 📅 Pace ──");
{ const w=demo("teacher"), C=w.C, P=w.P; w.envcView("pace"); let h=settle(w);
  ok("the card lists the ten meetings (past ones dimmed), 📤 on those with a section", /Class meetings \(10\)/.test(h)&&/<b style="min-width:96px">Tue Nov 10<\/b><span[^>]*>Aquatics <span class="envs-muted">· 📤 Aquatic Ecology<\/span>/.test(h)&&(h.match(/cpcal-m past/g)||[]).length===4);
  ok("the plan bar names the other goal with its note: \"Also: State Apr 23 · top 7 MS teams at Area qualify\"", /Also: State Apr 23 · top 7 MS teams at Area qualify/.test(h));
  P._cpp.offOpen=true; h=settle(w);
  ok("✎ Days off: a teal dot on each class meeting (Nov 10, Dec 1)", /aria-label="2026-11-10"[^>]*>10<span class="cpcal-dot" title="class: Aquatics"><\/span><\/button>/.test(h)&&/aria-label="2026-12-01"[^>]*>1<span class="cpcal-dot"/.test(h)&&!/aria-label="2026-11-11"[^>]*>11<span class="cpcal-dot"/.test(h));
  const W0=w._envs.writes.length; C.cpCalMeetIn("on","2026-11-17"); C.cpCalMeetIn("what","Field trip"); C.cpCalMeetAdd(); C.cpCalMeetDel("2026-09-15"); h=settle(w);
  ok("+ Meeting and ✕ are a draft: \"2 changes to the meetings, not saved yet\", no write", /2 changes to the meetings, not saved yet/.test(h)&&w._envs.writes.length===W0);
  ok("a second meeting on the same day is refused", (C.cpCalMeetIn("on","2026-11-17"),C.cpCalMeetAdd()===false));
  C.cpCalMeetSave(); await w.flush(); h=settle(w); const x=w._envs.writes[W0];
  ok("Save: ONE update at classes/<cid>, a path per changed date", w._envs.writes.length===W0+1&&x.op==="update"&&x.path==="classes/"+CID&&JSON.stringify(x.val)===JSON.stringify({"meetings/2026-11-17":{what:"Field trip"},"meetings/2026-09-15":null}), x);
  ok("…the class carries them; nothing left to save", w._envc.cls.meetings["2026-11-17"].what==="Field trip"&&!w._envc.cls.meetings["2026-09-15"]&&/Class meetings \(10\)/.test(h)&&!/not saved yet/.test(h));
  w._envc.cls.locks={plan:true}; h=settle(w); const W1=w._envs.writes.length;
  ok("locks/plan (Adrienne's): the meetings and the switch grey out, Save refuses", /disabled onchange="cpCalFamilySet/.test(h)&&/disabled onclick="cpCalMeetDel/.test(h)&&C.cpCalMeetAdd()===false&&C.cpCalFamilySet(true)===false&&w._envs.writes.length===W1); }

console.log("── 📤 Send out: Next class ──");
{ const w=demo("teacher"), C=w.C; w.envcView("send"); let h=w.G.content;
  ok("Send out opens with \"🏫 Next class: Tue Nov 10 · Aquatics (in 12 days)\", Aquatics out to 1 student so far, two taps", /Next class: Tue Nov 10 · Aquatics <span class="envs-muted">\(in 12 days\)/.test(h)&&/Aquatic Ecology is out to 1 student so far\. Send it out\?/.test(h)&&/onclick="cpCalSendNext\('now'\)"/.test(h)&&/onclick="cpCalSendNext\('date'\)">📅 Schedule for Nov 10…/.test(h)&&h.indexOf("Next class")<h.indexOf("📤 Send out</div>"), h.slice(h.indexOf("Next class")-80,h.indexOf("Next class")+600));
  const W0=w._envs.writes.length; C.cpCalSendNext("date"); h=w.G.content; const S=w.G.cpsd.sheet;
  ok("📅 Schedule for Nov 10 opens CPSEND's sheet on Aquatics, On a date, Nov 10 — and writes nothing", S&&S.src==="k:aquatics"&&S.when==="date"&&S.on==="2026-11-10"&&w._envs.writes.length===W0&&/📅 Schedule for Nov 10/.test(h), S&&{src:S.src,when:S.when,on:S.on});
  C.cpCalSendNext("now"); ok("📤 Send it out now… flips the same sheet to Now (still no write)", w.G.cpsd.sheet.when==="now"&&w.G.cpsd.sheet.src==="k:aquatics"&&w._envs.writes.length===W0);
  w._envc.release.all.aquatics={openedAt:NOW,by:"uid_teacher_demo"}; w.envcView("send"); h=w.G.content;
  ok("once it is out to everyone: \"✓ Aquatic Ecology is out to the whole class.\"", /✓ Aquatic Ecology is out to the whole class\./.test(h)&&!/cpCalSendNext/.test(h));
  w._envc.cls.meetings={"2026-11-03":{what:"Review"}}; w.envcView("send"); h=w.G.content;
  ok("a meeting with no section: the line, and \"No section is set to go out\"", /Next class: Tue Nov 3 · Review/.test(h)&&/No section is set to go out for this class/.test(h));
  delete w._envc.cls.meetings; w.envcView("send"); h=w.G.content;
  ok("no meetings: no prompt, Send out as before", !/Next class/.test(h)&&/📤 Send out<\/div>/.test(h)); }

console.log("── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, c=R.classes.$cid, st=R.students.$sid;
  ok("classes/<cid>/meetings: the teacher writes; <date>: {what ≤ 60, sec = a section key}, nothing else", /classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(c.meetings[".write"])&&/\[0-9\]\{4\}-/.test(c.meetings.$date[".validate"])&&/hasChildren\(\['what'\]\)/.test(c.meetings.$date[".validate"])&&/<= 60/.test(c.meetings.$date.what[".validate"])&&c.meetings.$date.$other[".validate"]===false);
  ok("classes/<cid>/familyDays: the teacher writes a boolean", /teacher/.test(c.familyDays[".write"])&&c.familyDays[".validate"]==="newData.isBoolean()");
  ok("students/<sid>/calendar: admin, the class's teacher, or that family's PARENT login only while the class's familyDays is true", /admins/.test(st.calendar[".write"])&&/'\/teacher'\)\.val\(\) == auth\.uid/.test(st.calendar[".write"])&&/'\/role'\)\.val\(\) == 'parent' && root\.child\('classes\/'\+root\.child\('students\/'\+\$sid\+'\/class'\)\.val\(\)\+'\/familyDays'\)\.val\(\) == true/.test(st.calendar[".write"]));
  ok("…{days = weekday digits, by = the writer, role matches the login, at}; off/<date> = true; nothing else", /\^\[0-6\]\{1,7\}\$/.test(st.calendar.days[".validate"])&&/newData\.child\('by'\)\.val\(\) == auth\.uid/.test(st.calendar[".validate"])&&/role'\)\.val\(\) == 'parent' && root\.child\('logins/.test(st.calendar[".validate"])&&st.calendar.$other[".validate"]===false&&/newData\.val\(\) == true/.test(st.calendar.off.$date[".validate"])); }

console.log("── Howe / Lincoln: the hooks say no ──");
{ const w=world({fam:{familyId:"howe",roster:["lincoln"]},rev:REV}), C=w.G.cal;
  ok("no edition: no reader, no calendar for the planner, nothing drawn", C.cpStudyDays("howe_lincoln")===null&&C.cpCalOf("howe_lincoln")===null&&C.cpIsStudyDay("howe_lincoln","2026-11-02")===false&&C.cpCalParentHtml("lincoln")===""&&C.cpCalStudentHtml("howe_lincoln")===""&&C.cpCalPaceHtml({})===""&&C.cpCalNextHtml()===""&&C.cpCalGoalsHtml({})===""&&C.cpCalDot("2026-11-10")==="");
  ok("…no listener, no tap, no save, no switch", C.cpCalListen(w.firebase.database(),()=>{})===false&&C.cpCalTap("howe_lincoln",1)===false&&C.cpCalMeetSave()===false&&C.cpCalFamilySet(true)===false);
  await C.cpCalSave("howe_lincoln"); await w.flush();
  ok("nothing read, listened to or written", w.G.reads.length===0&&w.G.listeners.length===0&&w.G.writes.length===0); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw "+(e&&e.stack||e)); process.exit(1); });
