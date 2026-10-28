/*
 * Node tests — 👩‍🏫 ENVCONSOLE, the teacher's and Adrienne's part of the Envirothon site (DESIGN_envirothon_console_2026-10-27.md §5 as
 * re-cut by its ✅ DECISIONS). The console screens on the demo's sample class and on a live fake project: the class grid's cells, the
 * student page, the who-is-strong ranking, the boards (and their publish), teacher cards (add / edit own / retire own, admin any),
 * the who-drills switch, the master lock, the families view's seed. Uses the world from test_env_site.js.   run: node test_env_console.js
 */
const {world}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
function demo(role){ const w=world({fam:FAM,search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
const run=async()=>{
console.log("── inert without the edition / outside the console roles ──");
{ const h=world({fam:{familyId:"howe",roster:[]}}); ok("Howe: envConsoleHtml is \"\", envConsoleStart false, no listener", h.envConsoleHtml()===""&&h.envConsoleStart()===false&&h.G.listeners.length===0);
  const k=world({fam:FAM}); k._envs.role="kid"; ok("a kid on the site never gets console HTML or a console write", k.envConsoleHtml()===""&&(()=>{ k.envcWhoSet("teacher"); return k.G.writes.length===0; })()); }

console.log("\n── the sample class ──");
{ const w=demo("teacher"); const S=w.envcStudents();
  ok("eight invented students, no real name, none a Howe kid", S.length===8&&!S.some(s=>/lincoln|ellis|lucy|julian|brittany/i.test(s.sid+JSON.stringify(s.meta))));
  ok("one row is a 'Howe app' student (the mirror's shape: summary + meta, no logins)", S.some(s=>w.envcStudents&&s.app==="howe"&&s.summary&&s.meta&&!(s.logins&&s.logins.kid)));
  ok("three teams, who drills = both, two live teacher cards + one retired, the season open", Object.keys(w._envc.cls.teams).length===8&&new Set(Object.values(w._envc.cls.teams)).size===3&&w._envc.who==="both"&&Object.keys(w._envc.cards["Forestry · Terms"]).length===3&&w._envc.cards["Forestry · Terms"].c3.retired===true&&w._envs.lock.locked===false); }

console.log("\n── §5.1 the class grid ──");
{ const w=demo("teacher"); const h=w.envcGridHtml(); const row=name=>{ const i=h.indexOf(">"+name+"<"); return h.slice(i,h.indexOf("</tr>",i)); };
  ok("header: the six stations + streak + last; General/Forestry/Soils marked ● open, Aquatics/Wildlife/CEI ○", /General.*Forestry.*Soils.*Aquatics.*Wildlife.*CEI.*streak.*last/.test(h)&&(h.match(/● open/g)||[]).length===3&&(h.match(/○</g)||[]).length===3);
  const maya=row("Maya R."); ok("Maya R.: forestry 100% with accuracy, 🎓 on forestry, a 6-day streak, last today; aquatics '–' (not sent out)", /<b>100%<\/b>/.test(maya)&&/\u{1F393}/u.test(maya)&&/>6 d</.test(maya)&&/>today</.test(maya)&&(maya.match(/–/g)||[]).length===3, maya.replace(/<[^>]+>/g,"|").slice(0,300));
  const jonah=row("Jonah T."); ok("Jonah T.: ⚠ (no study in 9 days), streak 0, last 9 days ago; soils sent out but nothing studied → 0%", /⚠/.test(jonah)&&/>0 d</.test(jonah)&&/9 days ago/.test(jonah)&&/title="sent out, nothing studied yet">0%/.test(jonah));
  const caleb=row("Caleb W."); ok("Caleb W.: aquatics opened for him alone shows a cell, not '–'; soils 🎓", !/–[^<]*<\/td><td class="c">[^<]*<\/td><td class="c">[^<]*<\/td><td class="c">\d+ d/.test(caleb)&&/\u{1F393}/u.test(caleb)&&(caleb.match(/–/g)||[]).length===2);
  ok("a name is a link to the student page", /onclick="envcView\('student','ramirez_maya'\)"/.test(h));
  ok("no email, no uid, no password anywhere on the grid", !/@|uid_|password/.test(h)); }

console.log("\n── §5.2 the student page ──");
{ const w=demo("teacher"); w.envcView("student","ramirez_maya"); const h=w.G.content;
  ok("header: name, content version, streak, study days this month, last mirrored", /Maya R\./.test(h)&&/content v1/.test(h)&&/streak 6 d/.test(h)&&/study days this month/.test(h)&&/last mirrored today/.test(h));
  ok("station rows: forestry check-in 9/15 · final 14/15 · 🎓 graduated; soils check-in 8/15; a 'needs work' line on soils; aquatics 🔒 not sent out", /check-in 9\/15 · final 14\/15 · \u{1F393} graduated/u.test(h)&&/check-in 8\/15/.test(h)&&/needs work: Soil horizon/.test(h)&&/\u{1F512} not sent out yet/u.test(h));
  ok("'Open a station for Maya R. only' lists exactly the stations not yet open for her (aquatics, wildlife, CEI)", /Open a station for Maya R\. only/.test(h)&&/envcOpenFor\('ramirez_maya','aquatics'\)/.test(h)&&/envcOpenFor\('ramirez_maya','cei'\)/.test(h)&&!/envcOpenFor\('ramirez_maya','forestry'\)/.test(h));
  ok("the teacher's scores: forestry test 22/25 (date) · presentation 5/5; other stations 'no test yet'; an edit button each", /test 22\/25 \(/.test(h)&&/presentation 5\/5/.test(h)&&/no test yet/.test(h)&&(h.match(/>edit</g)||[]).length===5);
  w.envcOpenFor("ramirez_maya","aquatics"); await w.flush();
  ok("'Open for Maya' writes (demo: would write) release/<cid>/students/ramirez_maya/aquatics and the button disappears", w._envs.writes.some(x=>x.path==="release/ms-science-2026/students/ramirez_maya/aquatics")&&w.G.writes.length===0&&!/envcOpenFor\('ramirez_maya','aquatics'\)/.test(w.G.content));
  w._envc.edit={kind:"score",sid:"tran_jonah",st:"forestry"}; w.envcView("student","tran_jonah"); w._envc.edit={kind:"score",sid:"tran_jonah",st:"forestry"}; w.renderAll();
  ok("the score editor shows test / of / date / presentation / note fields", /id="envc-sc-t"/.test(w.G.content)&&/id="envc-sc-d"/.test(w.G.content)&&/id="envc-sc-n"/.test(w.G.content));
  w.el("envc-sc-t","18"); w.el("envc-sc-tm","25"); w.el("envc-sc-d","2026-10-20"); w.el("envc-sc-p",""); w.el("envc-sc-pm","5"); w.el("envc-sc-n","absent for Q3"); w.envcScoreSave("tran_jonah","forestry"); await w.flush();
  const sc=w._envs.writes.find(x=>x.path==="scores/ms-science-2026/tran_jonah/forestry");
  ok("Save writes scores/<cid>/<sid>/forestry = {test 18, testMax 25, testDate, note, by, ts} — no presentation key when blank", sc&&sc.val.test===18&&sc.val.testMax===25&&sc.val.testDate==="2026-10-20"&&sc.val.note==="absent for Q3"&&!("presentation" in sc.val)&&sc.val.by==="uid_teacher_demo"); }

console.log("\n── 📝 Open the final (2026-10-28): the student page (one student) and Send out (class or picked) ──");
{ const w=demo("teacher"); w.envcView("student","ramirez_maya"); let h=w.G.content;
  ok("student page: a '📝 The final for Maya R.' card — one button per station with a final (no General); 🎓 instead of a button on her graduated forestry", /The final for Maya R\./.test(h)&&/envcFinalFor\('ramirez_maya','soils'\)/.test(h)&&/envcFinalFor\('ramirez_maya','cei'\)/.test(h)&&!/envcFinalFor\('ramirez_maya','forestry'\)/.test(h)&&!/envcFinalFor\('ramirez_maya','general'\)/.test(h)&&(h.match(/envcFinalFor\(/g)||[]).length===4);
  const n0=w._envs.writes.length; w.envcFinalFor("ramirez_maya","soils"); await w.flush();
  const fw=w._envs.writes.slice(n0);
  ok("Open the final · Soils: ONE set release/<cid>/final/students/ramirez_maya/soils = {date, ts, by} — demo: would write, nothing written", fw.length===1&&fw[0].op==="set"&&fw[0].path==="release/ms-science-2026/final/students/ramirez_maya/soils"&&JSON.stringify(Object.keys(fw[0].val).sort())==='["by","date","ts"]'&&fw[0].val.by==="uid_teacher_demo"&&/^\d{4}-\d\d-\d\d$/.test(fw[0].val.date)&&typeof fw[0].val.ts==="number"&&w.G.writes.length===0);
  ok("…and the button turns into 'Soils · final open <date>'", !/envcFinalFor\('ramirez_maya','soils'\)/.test(w.G.content)&&/final open \d{4}-/.test(w.G.content));
  w.envcFinalFor("ramirez_maya","general"); await w.flush(); ok("General concepts has no final: nothing written", w._envs.writes.length===n0+1);
  w.envcView("send"); w.envcSendPick("general"); ok("Send out: no 'Open the final' for General", !/envcFinalOut\(\)/.test(w.G.content));
  w.envcSendPick("wildlife"); w._envc.send.to="pick"; w._envc.send.picked={ramirez_maya:true,tran_jonah:true}; w.renderAll(); h=w.G.content;
  ok("Send out ▸ Wildlife: '📝 Open the final · Wildlife' under Send out now, to the same students", /envcFinalOut\(\)/.test(h)&&/Open the final · Wildlife/.test(h));
  const n1=w._envs.writes.length; w.envcFinalOut(); await w.flush(); const pw=w._envs.writes.slice(n1);
  ok("picked students: ONE multi-path update, exactly release/<cid>/final/students/<sid>/wildlife for each, nothing under release/<cid>/all", pw.length===1&&pw[0].op==="update"&&JSON.stringify(Object.keys(pw[0].val).sort())===JSON.stringify(["release/ms-science-2026/final/students/ramirez_maya/wildlife","release/ms-science-2026/final/students/tran_jonah/wildlife"])&&w.G.writes.length===0);
  w._envc.send={station:"",decks:null,to:"class",picked:{}}; w.envcSendPick("aquatics"); const n2=w._envs.writes.length; w.envcFinalOut(); await w.flush(); const cw=w._envs.writes.slice(n2);
  ok("whole class: ONE key release/<cid>/final/all/aquatics = {date, ts, by}; the screen then says it is open for the whole class", cw.length===1&&JSON.stringify(Object.keys(cw[0].val))===JSON.stringify(["release/ms-science-2026/final/all/aquatics"])&&cw[0].val["release/ms-science-2026/final/all/aquatics"].by==="uid_teacher_demo"&&(w.envcSendPick("aquatics"),/final is open for the whole class/.test(w.G.content))&&!/envcFinalOut\(\)/.test(w.G.content));
  ok("…every student page then shows aquatics 'final open'", (w.envcView("student","tran_jonah"),/Aquatics · final open/.test(w.G.content))&&!/envcFinalFor\('tran_jonah','aquatics'\)/.test(w.G.content));
  w._envc.send.to="pick"; w._envc.send.picked={}; w.envcSendPick("cei"); w._envc.send.to="pick"; const n3=w._envs.writes.length; w.envcFinalOut(); await w.flush(); ok("picked with nobody ticked → nothing written", w._envs.writes.length===n3);
  ok("PURE envcFinalUpdate: class → final/all/<station>; picked → one key per student; no station → nothing", (()=>{ const a=w.envcFinalUpdate("c1","soils",null,"u1",1800000000000), b=w.envcFinalUpdate("c1","soils",["x_y"],"u1",1800000000000); return JSON.stringify(Object.keys(a))==='["release/c1/final/all/soils"]'&&a["release/c1/final/all/soils"].ts===1800000000000&&a["release/c1/final/all/soils"].by==="u1"&&JSON.stringify(Object.keys(b))==='["release/c1/final/students/x_y/soils"]'&&Object.keys(w.envcFinalUpdate("c1","",null,"u1",1)).length===0; })());
  const a=demo("admin"); a.envcView("student","ramirez_maya"); ok("the admin gets the same buttons", /envcFinalFor\('ramirez_maya','soils'\)/.test(a.G.content));
  const k=demo("kid"); const nk=k._envs.writes.length; k.envcFinalFor("ramirez_maya","soils"); k.envcFinalOut(); ok("a kid on the site can't open a final (no console)", k._envs.writes.length===nk); }

console.log("\n── §5.4 who is strong where ──");
{ const w=demo("teacher"); const st=w.envsStations().find(s=>s.id==="forestry"); const r=w.envcStrongRank(w.envcStudents(),st);
  ok("forestry ranking: every student with a number is ranked, best first, ties by name", r.length>=7&&r.every((x,i)=>i===0||r[i-1].score>=x.score));
  const maya=r.find(x=>x.name==="Maya R."); ok("Maya R.: mastery 100 · acc 91 · test 88 (22/25) · pres 100 (5/5) → score = the rounded mean of the four (95)", maya&&maya.mastery===100&&maya.acc===91&&maya.test===88&&maya.pres===100&&maya.score===Math.round((100+91+88+100)/4)&&maya.score===95, maya);
  const theo=r.find(x=>x.name==="Theo K."); ok("Theo K.: no test, no presentation → mean of mastery + accuracy only", theo&&theo.test===null&&theo.pres===null&&theo.score===Math.round((theo.mastery+theo.acc)/2));
  const cei=w.envsStations().find(s=>s.id==="cei"); ok("a station nobody has started ranks nobody", w.envcStrongRank(w.envcStudents(),cei).length===0);
  const h=w.envcStrongHtml(); ok("the screen: one card per station (not General), top 5, the four columns side by side, no save button", (h.match(/<table/g)||[]).length>=3&&/mastery.*acc 14 d.*test.*pres\./.test(h)&&!/General concepts<\/div>/.test(h)&&!/>save</i.test(h)); }

console.log("\n── §5.5 teacher cards ──");
{ const w=demo("teacher"); w.envcView("cards"); let h=w.G.content;
  ok("the add form offers only the unit's Terms / Facts decks (never ID, never a new deck)", /<option value="Forestry · Terms"/.test(h)&&/<option value="Forestry · Facts"/.test(h)&&!/<option value="Forestry · ID"/.test(h)&&!/new deck/i.test(h));
  ok("the list: Mast year and Snag editable (yours), Duff retired (dimmed, no buttons)", /<b>Mast year<\/b>/.test(h)&&/retire<\/button>/.test(h)&&/<b>Duff<\/b>/.test(h)&&/opacity:\.55/.test(h));
  w.el("envc-nc-deck","Forestry · Terms"); w.el("envc-nc-name","mast YEAR"); w.el("envc-nc-def","x"); w.el("envc-nc-concept",""); w.envcCardAdd(); await w.flush();
  ok("a term already in that deck (any case) is refused client-side, nothing written", !w._envs.writes.some(x=>/teacherCards/.test(x.path)));
  w.el("envc-nc-name","Bad.name"); w.envcCardAdd(); await w.flush(); ok("a term with . # $ [ ] / is refused (a Firebase-safe front)", !w._envs.writes.some(x=>/teacherCards/.test(x.path)));
  w.el("envc-nc-name","Coppice"); w.el("envc-nc-def","Cutting a tree to the stump so new shoots grow."); w.el("envc-nc-concept","Forest Management"); w.envcCardAdd(); await w.flush();
  const add=w._envs.writes.find(x=>/teacherCards\/ms-science-2026\/Forestry · Terms\/tc/.test(x.path));
  ok("Add writes teacherCards/<cid>/<deck>/<id> = {name, def, concept, by, ts} (the rules' validate shape)", add&&add.val.name==="Coppice"&&add.val.concept==="Forest Management"&&add.val.by==="uid_teacher_demo"&&typeof add.val.ts==="number"&&JSON.stringify(Object.keys(add.val).sort())==='["by","concept","def","name","ts"]');
  w.el("envc-ec-name","Mast year"); w.el("envc-ec-def","A year with a very large seed crop."); w.envcCardSave("Forestry · Terms","c1"); await w.flush();
  const ed=w._envs.writes.find(x=>x.path==="teacherCards/ms-science-2026/Forestry · Terms/c1"&&x.op==="update");
  ok("edit own: one update {name, def, edited}", ed&&ed.val.def==="A year with a very large seed crop."&&typeof ed.val.edited==="number"&&w._envc.cards["Forestry · Terms"].c1.def===ed.val.def);
  w.envcCardRetire("Forestry · Terms","c2"); await w.flush();
  ok("retire own: sets …/c2/retired = true (append-only; nothing deleted)", w._envs.writes.some(x=>x.path==="teacherCards/ms-science-2026/Forestry · Terms/c2/retired"&&x.val===true)&&!w._envs.writes.some(x=>x.op==="remove"));
  w._envc.cards["Forestry · Terms"].c1.by="someone_else"; const n=w._envs.writes.length; w.envcCardRetire("Forestry · Terms","c1"); w.envcCardSave("Forestry · Terms","c1"); await w.flush();
  ok("a teacher cannot retire or edit another's card", w._envs.writes.length===n);
  const a=demo("admin"); a._envc.cards["Forestry · Terms"].c1.by="someone_else"; a.envcCardRetire("Forestry · Terms","c1"); await a.flush();
  ok("Adrienne (admin) retires anything", a._envs.writes.some(x=>x.path==="teacherCards/ms-science-2026/Forestry · Terms/c1/retired")); }

console.log("\n── boards ──");
{ const w=demo("teacher"); w.envcView("boards"); await w.flush(); const h=w.G.content;
  ok("opening Boards publishes boards/<cid> once (demo: would write) and sets the kid's copy", w._envs.writes.filter(x=>x.path==="boards/ms-science-2026").length<=1&&w._envs.boards&&w._envs.boards.teams.length===3);
  ok("team board: three teams with points, 🥇 first; readiness bars per team; expert badges; effort board; the teachers-only full ranking", /\u{1F947}/u.test(h)&&/Station readiness/.test(h)&&/Station experts/.test(h)&&/Effort this week/.test(h)&&/Full ranking \(teachers only\)/.test(h));
  const B=w._envs.boards; const oaks=B.teams.find(t=>t.name==="Oaks"), pines=B.teams.find(t=>t.name==="Pines");
  ok("Oaks' points = Maya's gain (93−60=33) + Caleb's (80−67=13 forestry, 93−60=33 soils) + Eli's (80−60=20) = 99", oaks&&oaks.gain===33+13+33+20, oaks&&oaks.gain);
  ok("Pines' points = Jonah 0 + Nora (73−53=20) + Avery (87−73=14) = 34", pines&&pines.gain===34, pines&&pines.gain);
  ok("every team has a forestry expert badge; nobody has a CEI badge", B.teams.every(t=>t.badges.forestry)&&B.teams.every(t=>!t.badges.cei));
  ok("effort board: Avery M. (11-day streak, 20 cards a day) on top", B.effort[0].name==="Avery M.");
  w.renderAll(); await w.flush(); ok("a second paint does not publish again (hash unchanged)", w._envs.writes.filter(x=>x.path==="boards/ms-science-2026").length<=1);
  w.envcTeamSet("tran_jonah","Oaks"); await w.flush(); w.renderAll(); await w.flush();
  ok("renaming a team writes classes/<cid>/teams/<sid> and the boards re-publish", w._envs.writes.some(x=>x.path==="classes/ms-science-2026/teams/tran_jonah"&&x.val==="Oaks")&&w._envs.boards.teams.find(t=>t.name==="Oaks").members.includes("tran_jonah"));
  const k=demo("kid"); k.envsView("boards"); const kh=k.G.content; ok("the kid sees the same boards with 'you and the two nearest' and 'Maya R. (you)', never the full ranking", /you and the two nearest/.test(kh)&&/Maya R\. \(you\)/.test(kh)&&!/Full ranking/.test(kh)&&(kh.slice(kh.indexOf("Effort this week")).match(/-day streak/g)||[]).length===3);
  const p=demo("parent"); p.envsView("boards"); ok("the parent sees the same boards (as the kid sees them)", /Team board/.test(p.G.content)&&/Maya R\. \(you\)/.test(p.G.content)); }

console.log("\n── who drills ──");
{ const w=demo("teacher"); w.envcView("who"); ok("three choices, 'both' is on", /Parents/.test(w.G.content)&&/Teacher/.test(w.G.content)&&/Both/.test(w.G.content)&&/now: <b>both<\/b>/.test(w.G.content));
  w.envcWhoSet("teacher"); await w.flush(); ok("the switch writes settings/whoDrills/<cid> = teacher and the parent's note changes", w._envs.writes.some(x=>x.path==="settings/whoDrills/ms-science-2026"&&x.val==="teacher")&&(()=>{ const p=demo("parent"); p._envs.who="teacher"; p.renderAll(); return /The teacher runs the drills in class/.test(p.G.content); })());
  w.envcWhoSet("nobody"); ok("an unknown value is refused", !w._envs.writes.some(x=>x.val==="nobody")); }

console.log("\n── Adrienne's part ──");
{ const w=demo("admin"); w.envcView("admin"); const h=w.G.content;
  ok("the Admin chip only for admin; the teacher's demo has none", /🔑 Admin/.test(h)&&!/🔑 Admin/.test(demo("teacher").G.content));
  ok("Master lock card: open, closes by itself after Apr 24, 2027, 'Close the season now' button", /Master lock/.test(h)&&/<b>open<\/b>/.test(h)&&/Apr 24, 2027/.test(h)&&/Close the season now/.test(h));
  w.envcLock(true); await w.flush(); const lk=w._envs.writes.find(x=>x.path==="release/locked");
  ok("Close writes release/locked = {locked:true, at, by}; the card flips to CLOSED + Reopen", lk&&lk.val.locked===true&&typeof lk.val.at==="number"&&lk.val.by==="uid_admin_demo"&&/CLOSED/.test(w.envcAdminHtml())&&/Reopen the season/.test(w.envcAdminHtml()));
  w.envcLock(false); await w.flush(); ok("Reopen writes {locked:false, at, by}", w._envs.writes.filter(x=>x.path==="release/locked").length===2&&w._envs.writes[w._envs.writes.length-1].val.locked===false);
  ok("the teacher's demo has no lock switch and cannot write it", (()=>{ const t=demo("teacher"); t.envcLock(true); return !/Master lock/.test(t.envcAdminHtml())&&t._envs.writes.length===0; })());
  ok("Teachers card lists Ms. Brittany with her class; + Teacher writes teachers/<uid>/{name, classes/<cid>} and classes/<cid>/teacher", /Ms\. Brittany/.test(h)&&(()=>{ w.el("envc-t-uid","uid_new_t"); w.el("envc-t-name","Mr. New"); w.envcTeacherAdd(); return true; })());
  await w.flush(); const tw=w._envs.writes.find(x=>x.op==="update"&&x.val["teachers/uid_new_t/name"]); ok("…exactly those three paths", tw&&JSON.stringify(Object.keys(tw.val).sort())===JSON.stringify(["classes/ms-science-2026/teacher","teachers/uid_new_t/classes/ms-science-2026","teachers/uid_new_t/name"]));
  ok("Families view: every student with family id, app, parent uid, student uid, last mirror; the Howe-app row has no instance", /Families/.test(h)&&/uid_p_maya/.test(h)&&/uid_k_maya/.test(h)&&/their own project/.test(h));
  w.envcSeedShow("ramirez_maya"); w.renderAll(); const seed=w.envcSeedJson(Object.assign({sid:"ramirez_maya"},w._envc.students.ramirez_maya));
  ok("the seed JSON for a family: allowed/{parent uid, kid uid}, settings/edition envirothon, one-kid family, the pages (mastery/units/kids on, rest off), a random 4-digit pin, settings/envirothon {classId, sid, kid, unit} — never a Claude key", seed.allowed.uid_p_maya===true&&seed.allowed.uid_k_maya===true&&seed.settings.edition==="envirothon"&&seed.settings.family.length===1&&seed.settings.family[0].id==="maya"&&seed.settings.pages.mastery===true&&seed.settings.pages["moms-plan"]===false&&/^\d{4}$/.test(seed.settings.pin)&&seed.settings.pin!=="0329"&&seed.settings.envirothon.sid==="ramirez_maya"&&!JSON.stringify(seed).includes("anthropic"));
  ok("the instance name shown is <projectId>-<familyId>", /howe-envirothon-ramirez/.test(w.G.content)); }

console.log("\n── live (a fake project): one students/<sid> listener per student; writes go to the shared instance ──");
{ const w=world({fam:FAM,auth:{uid:"t1",email:"t@x"},remote:{"teachers/t1":{classes:{ms1:true}},"classes/ms1":{name:"C",teacher:"t1",students:{a_b:true,c_d:true},teams:{a_b:"Oaks"}},"students/a_b":{meta:{name:"A B.",familyId:"a",kid:"b"},summary:{byDeck:{},streak:{days:1,last:"20261028"},days:{},tests:{}}},"release/locked":{locked:false,at:1}}});
  w._envs.role="teacher"; w._envs.uid="t1"; w.tab="envsite"; w.envConsoleStart(); await w.flush();
  ok("listeners: students/a_b and students/c_d (one each), never students/", w.G.listeners.filter(l=>l.p==="students/a_b").length===1&&w.G.listeners.filter(l=>l.p==="students/c_d").length===1&&!w.G.listeners.some(l=>l.p==="students"));
  w.renderAll(); ok("the grid draws from the live rows (A B. present)", /A B\./.test(w.G.content));
  w.envcFinalFor("a_b","forestry"); await w.flush(); ok("live: Open the final sets release/ms1/final/students/a_b/forestry on the shared instance = {date, ts, by:t1}", w.G.writes.some(x=>x[0]==="set"&&x[1]==="release/ms1/final/students/a_b/forestry"&&x[2].by==="t1"&&typeof x[2].ts==="number"));
  w.envcWhoSet("both"); await w.flush(); ok("a write lands on the shared instance's path", w.G.writes.some(x=>x[0]==="set"&&x[1]==="settings/whoDrills/ms1"&&x[2]==="both"));
  w.envcView("boards"); await w.flush(); ok("opening Boards sets boards/ms1 once", w.G.writes.filter(x=>x[1]==="boards/ms1").length===1&&w.G.writes.find(x=>x[1]==="boards/ms1")[2].teams.length>=1);
  const d=world({fam:FAM,auth:{uid:"t1"},dry:true,remote:{"teachers/t1":{classes:{ms1:true}},"classes/ms1":{name:"C",teacher:"t1",students:{}}}}); d._envs.role="teacher"; d._envs.uid="t1"; d.envConsoleStart(); await d.flush(); d.envcWhoSet("both"); await d.flush();
  d.envcFinalFor("x_y","soils"); await d.flush();
  ok("?dryrun=1: the console reads but writes nothing (Open the final included)", d.G.listeners.length>0&&d.G.writes.length===0); }
};
run().then(()=>{ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); }).catch(e=>{ console.error(e); process.exit(1); });
