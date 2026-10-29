/*
 * Node tests — ⚙️ ENVCLASSSET, the Envirothon class settings (her words 2026-10-28: "the teacher should be able to have the controls to
 * edit how many can be each day how they will be learned how many times in which level all of these type settings that are in drills" ·
 * "can i see that in the demo"). The teacher's ⚙️ Class settings screen (up front + the Advanced fold), a student's own settings with
 * "class: …" until overridden, Adrienne's 🔒 locks, every save one targeted update at exactly its path, the ranges Howe's editor allows,
 * and the kid's side: the class's values laid over the 🌿 session record and the drill settings IN MEMORY only — the real mstSessions /
 * mastDrillSettings / mastGetCatMode sliced from index.html — with Howe (no edition) and every other session byte-identical.
 * Uses the world from test_env_site.js.                                                           run: node test_env_class_settings.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CLS,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const CID="ms-science-2026";
function demo(role){ const w=world({fam:FAM,search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
function last(w){ return w._envs.writes[w._envs.writes.length-1]; }
// a live teacher (or admin) on a fake project: one class c1 with one student fam_k
function liveConsole(role){ const w=world({fam:FAM}); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"}}; return w; }
// the real study / drill readers from index.html, in a sandbox; overlay = the block's envClassOverlay or undefined (no block at all)
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const ENG=[cut("const MST_SESSION_DEFAULTS = {","\n};"),cut("function mstPatternClean(p) {","\n}\n"),cut("function mstPatternMode(pattern, dots, need) {","\n}\n"),cut("function mstSessions(kid) {","\n}\n"),cut("function mastDrillSettings(){","\n}\n"),cut("function mastGetCatMode(kid,cat){","||\"flash\"; }")].join("\n");
function engine(overlay,md,mk){ return new Function("envClassOverlay","masteryData","mk",'let masteryKid=mk; const ENV_SESSION_SID="envirothon"; const MAST_DEFAULT_CAT_MODES={}; const MST_PATTERN_MODES=["rec","say","type","pick","copy","ideas"]; function mastFullBank(){ return {}; }\n'+ENG+'\nreturn {mstSessions,mastDrillSettings,mastGetCatMode,mstPatternMode};')(overlay,md,mk); }
const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// ENVCLASSSET_START"), b=src.indexOf("// ENVCLASSSET_END"), c=src.indexOf("// ENVCONSOLE_END");
  ok("ENVCLASSSET right after ENVCONSOLE_END, once", a>0&&b>a&&src.indexOf("// ENVCLASSSET_START",a+1)<0&&src.slice(c,a).trim()==="// ENVCONSOLE_END");
  ok("the block only declares (nothing runs at boot)", CLS.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let | |})/.test(l)));
  ok("her words and the date are in the block header", /2026-10-28/.test(CLS)&&/the teacher\s*\n?\/\/ should be able to have the controls|the teacher should be able to have the controls/.test(CLS));
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CLS));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/⚙️ ENVCLASSSET/.test(l));
  ok("9 tagged lines outside the block, every one typeof-guarded", hooks.length===9&&hooks.every(l=>/typeof envCl\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,70)));
  ok("the overlay sits in exactly mstSessions, envtHandOffAt, mastDrillSettings, mastGetCatMode — one line each", ["function mstSessions(kid) {","function envtHandOffAt(kid){","function mastDrillSettings(){","function mastGetCatMode(kid,cat){"].every(f=>{ const i=src.indexOf(f); const body=src.slice(i,src.indexOf("\n}",i)+2); return (body.match(/envClassOverlay\(/g)||[]).length===1; })&&(out.match(/envClassOverlay\(/g)||[]).length===4);
  ok("the kid's read sits in envsReadShared, the locks listener in envConsoleStart, the screen in envConsoleHtml, the student card in envcStudentHtml", ["envsReadShared","envConsoleStart","envConsoleHtml","envcStudentHtml"].every(f=>{ const i=src.indexOf("function "+f+"("); return /⚙️ ENVCLASSSET/.test(src.slice(i,src.indexOf("\n}\n",i))); }));
  ok("the start line sits right above the 🌿 header (the header's own lines, pinned by other tests, are untouched)", /h\+=envClsStartHtml\(kid,session\);[^\n]*\n  h\+='<div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:20px;padding:20px;margin-bottom:16px;/.test(src)); }

console.log("\n── the panel: up front and the Advanced fold ──");
{ const w=demo("teacher");
  ok("the console has a '⚙️ Class settings' chip (teacher and admin)", /envcView\('classset'\)/.test(w.G.content)&&/⚙️ Class settings/.test(w.G.content)&&/envcView\('classset'\)/.test(demo("admin").G.content));
  w.envcView("classset"); let h=w.G.content;
  ok("up front: New cards a day · Cards a sitting · How cards are learned · Passes per sitting · Decks introducing at once", ["New cards a day","Cards a sitting","How cards are learned","Passes per sitting","Decks introducing at once"].every(t=>h.indexOf(t)>=0));
  ok("each shows its meaning, Howe's range and the value now at the defaults (5 a day, Auto a sitting since 🪑 CPSEATS, 2 passes, 2 decks)", /Cards a student meets for the first time each study day\. \(0–50\)/.test(h)&&/now: <b>5<\/b> \(default\)/.test(h)&&/now: <b>Auto<\/b> \(default\)/.test(h)&&/now: <b>2<\/b> \(default\)/.test(h)&&/\(1–5\)/.test(h)&&/\(0–20\)/.test(h)&&/Auto, or 0–200/.test(h));
  ok("how cards are learned: the four steps, Pick it → Key ideas → Type it ticked in order, Flip not ticked", /1\. 🎯 Pick it/.test(h)&&/2\. 🧩 Key ideas/.test(h)&&/3\. ⌨️ Type it/.test(h)&&/<b>🔄 Flip<\/b>/.test(h)&&(h.match(/type="checkbox" checked/g)||[]).length===3);
  ok("the Advanced fold is closed: none of its rows yet", /▾ Advanced/.test(h)&&!/Mixes into review at|Right in a row to move up|What a miss does/.test(h));
  w._envcs.adv=true; w.renderAll(); h=w.G.content;
  ok("Advanced: mix-in / hand-off levels, the ladder (in a row, per level, a miss), the limits, each deck's mode + new at once", ["Mixes into review at","Hands off to the drill at","Right in a row to move up","Right in a row, per level","What a miss does","New per deck in a drill","Learning cards per drill","Overdue reviews per drill","How each deck shows in the drill","New at once, per deck"].every(t=>h.indexOf(t)>=0));
  ok("…every one of the 15 Envirothon decks has a mode picker and a new-at-once box", (h.match(/envClsSave\('class','cat_modes',this\.value,/g)||[]).length===15&&(h.match(/envClsInput\('class','cat_intro_max',this\.value,/g)||[]).length===15);
  ok("…the deck modes start at each deck's own (Facts decks Flash, the rest Flip)", /<option value="flash" selected>⚡ Flash/.test(h)&&/<option value="flip" selected>🔄 Flip/.test(h));
  ok("a 'Reset to default' per section (5 sections)", (h.match(/>Reset to default</g)||[]).length===5);
  ok("the teacher sees no 🔒 Lock buttons", !/envClsLock\(/.test(h));
  const a=demo("admin"); a.envcView("classset"); a._envcs.adv=true; a.renderAll();
  ok("Adrienne sees a 🔒 Lock on every one of the 16 settings (🪑 CPSEATS adds Days a card is learned)", (a.G.content.match(/envClsLock\('/g)||[]).length===16); }

console.log("\n── every save writes exactly its path (one targeted update) ──");
{ const w=liveConsole("teacher"); const W=()=>w.G.writes;
  w.envClsInput("class","newPerDay","20"); await w.flush();
  ok("New cards a day = 20 → update classes/c1/settings/study {newPerDay:20}, nothing else", W().length===1&&JSON.stringify(W()[0])===JSON.stringify(["update","classes/c1/settings/study",{newPerDay:20}]), W());
  w.envClsSave("class","ladder_streak","4"); await w.flush();
  ok("Right in a row = 4 → update classes/c1/settings/drill {ladder_streak:4}", JSON.stringify(W()[1])===JSON.stringify(["update","classes/c1/settings/drill",{ladder_streak:4}]));
  w.envClsSave("class","cat_modes","flash","Forestry · Terms"); await w.flush();
  ok("a deck's mode → update classes/c1/settings/drill {'cat_modes/Forestry · Terms':'flash'} (one key, not the whole map)", JSON.stringify(W()[2])===JSON.stringify(["update","classes/c1/settings/drill",{"cat_modes/Forestry · Terms":"flash"}]));
  w.envClsInput("class","tier_streaks","5","weekly"); await w.flush();
  ok("one level's streak → {'tier_streaks/weekly':5}", JSON.stringify(W()[3])===JSON.stringify(["update","classes/c1/settings/drill",{"tier_streaks/weekly":5}]));
  w.envClsPat("class","rec","on"); await w.flush();
  ok("ticking Flip on → the whole order as one value {pattern:[pick,ideas,type,rec]}", JSON.stringify(W()[4])===JSON.stringify(["update","classes/c1/settings/study",{pattern:["pick","ideas","type","rec"]}]));
  w.envClsPat("class","rec","up"); await w.flush();
  ok("moving it up one → {pattern:[pick,ideas,rec,type]}", JSON.stringify(W()[5][2])===JSON.stringify({pattern:["pick","ideas","rec","type"]}));
  w.envClsSave("class","mixInAt","every_other_day"); await w.flush();
  ok("a level → {mixInAt:'every_other_day'}", JSON.stringify(W()[6])===JSON.stringify(["update","classes/c1/settings/study",{mixInAt:"every_other_day"}]));
  w.envClsSave("fam_k","newPerDay","8"); await w.flush();
  ok("one student's override → update students/fam_k/settings/study {newPerDay:8}", JSON.stringify(W()[7])===JSON.stringify(["update","students/fam_k/settings/study",{newPerDay:8}]));
  w.envClsReset("class","front"); await w.flush();
  ok("Reset to default (up front) → ONE update clearing exactly the set values {newPerDay:null, pattern:null}", JSON.stringify(W()[8])===JSON.stringify(["update","classes/c1/settings/study",{newPerDay:null,pattern:null}]), W()[8]);
  const n=W().length; w.envClsReset("class","front"); await w.flush(); ok("…a second reset with nothing set writes nothing", W().length===n);
  ok("no write anywhere but classes/c1/settings and students/fam_k/settings", W().every(x=>/^(classes\/c1\/settings\/(study|drill)|students\/fam_k\/settings\/(study|drill))$/.test(x[1])));
  w.envClsLock("newPerDay",true); await w.flush(); ok("a teacher can't lock (nothing written)", W().length===n);
  const a=liveConsole("admin"); a.envClsLock("newPerDay",true); await a.flush();
  ok("Adrienne's 🔒 → update settings/locks {newPerDay:true}; 🔓 → {newPerDay:null}", JSON.stringify(a.G.writes[0])===JSON.stringify(["update","settings/locks",{newPerDay:true}])&&(a.envClsLock("newPerDay",false),true)&&(await a.flush(),JSON.stringify(a.G.writes[1])===JSON.stringify(["update","settings/locks",{newPerDay:null}])));
  ok("the live console listens to settings/locks (kept across a class switch)", (()=>{ const L=liveConsole("teacher"); L.envClsConsoleStart(); const has=()=>L.G.listeners.some(x=>x.p==="settings/locks"); return has()&&/k!=="locks"/.test(src.slice(src.indexOf("function envcPickClass("),src.indexOf("function envcPickClass(")+400)); })());
  const d=liveConsole("teacher"); d.G.dry=true; d.envClsInput("class","newPerDay","20"); await d.flush(); ok("dry run → nothing written", d.G.writes.length===0); }

console.log("\n── ranges (Howe's own) ──");
{ const w=demo("teacher"); const C=(n,v,k)=>w.envClsCheck(n,v,k);
  ok("New cards a day: 0 and 50 ok; 51, −1, 2.5, blank refused with Howe's wording", C("newPerDay",0).ok&&C("newPerDay",50).v===50&&C("newPerDay","20").v===20&&!C("newPerDay",51).ok&&!C("newPerDay",-1).ok&&!C("newPerDay",2.5).ok&&!C("newPerDay","").ok&&C("newPerDay",51).error==="New cards a day must be a whole number 0–50");
  ok("Passes 1–5 · Cards a sitting Auto or 0–200 (🪑 CPSEATS) · Decks at once 0–20", C("passes",1).ok&&C("passes",5).ok&&!C("passes",0).ok&&!C("passes",6).ok&&C("maxCards",0).ok&&C("maxCards",200).ok&&!C("maxCards",201).ok&&C("maxCards","auto").ok&&C("focusDecks",20).ok&&!C("focusDecks",21).ok);
  ok("Right in a row 1–10 · per level 1–10 on a level that climbs · new per deck 1–10 · learning 0–40 · overdue 0–60", C("ladder_streak",10).ok&&!C("ladder_streak",0).ok&&!C("ladder_streak",11).ok&&C("tier_streaks",4,"weekly").ok&&!C("tier_streaks",4,"graduated").ok&&!C("tier_streaks",11,"weekly").ok&&C("max_intro_per_cat",1).ok&&!C("max_intro_per_cat",0).ok&&C("max_learn_per_drill",40).ok&&!C("max_learn_per_drill",41).ok&&C("max_overdue_per_drill",60).ok&&!C("max_overdue_per_drill",61).ok);
  ok("deck settings only for the unit's decks; a mode is Flash / Flip / Quiz", C("cat_modes","flip","Forestry · ID").ok&&!C("cat_modes","spell","Forestry · ID").ok&&!C("cat_modes","flip","German").ok&&C("cat_intro_max",4,"Wildlife · Terms").ok&&!C("cat_intro_max",4,"Nope").ok);
  ok("a level must be on the ladder; a miss is reset / one; the steps are the four known, at least one, no repeats", C("mixInAt","weekly").ok&&!C("mixInAt","daily").ok&&C("miss_drop","one").ok&&!C("miss_drop","x").ok&&JSON.stringify(C("pattern",["rec","rec","bogus","type"]).v)==='["rec","type"]'&&!C("pattern",[]).ok&&!C("pattern",["bogus"]).ok&&C("pattern",{0:"type",1:"pick"}).ok);
  const n=w._envs.writes.length; w.envClsInput("class","newPerDay","51"); w.envClsInput("class","passes","0"); await w.flush();
  ok("out of range in the panel → a toast, nothing written", w._envs.writes.length===n);
  w.envClsSave("class","mixInAt","monthly"); await w.flush();
  ok("mix-in at or above hand-off is refused (Howe's rule: 'Hand-off must be above mix-in')", w._envs.writes.length===n&&w.envClsTierOrderOk("weekly","bi_weekly")&&!w.envClsTierOrderOk("bi_weekly","bi_weekly"));
  w.envClsPat("class","pick","off"); await w.flush(); w.envClsPat("class","ideas","off"); await w.flush(); const n2=w._envs.writes.length; w.envClsPat("class","type","off"); await w.flush();
  ok("the last ticked step can't be unticked", w._envs.writes.length===n2&&JSON.stringify(w.envClsEff("class","pattern"))==='["type"]'); }

console.log("\n── per student: 'class: …' until overridden; clearing falls back ──");
{ const w=demo("teacher"); w.envcView("student","tran_jonah"); let h=w.G.content;
  ok("the student page has '⚙️ Settings for this student', folded, saying what changed", /Settings for this student/.test(h)&&/1 changed for Jonah T\./.test(h)&&/▾ Open/.test(h)&&!/envClsInput\('tran_jonah'/.test(h));
  w._envcs.stuOpen="tran_jonah"; w.renderAll(); h=w.G.content;
  ok("open: the sample override shows 'this student: 3 · class: 5' and a '✕ use the class's'", /this student: <b>3<\/b> · class: 5/.test(h)&&/envClsSave\('tran_jonah','newPerDay',null\)/.test(h));
  ok("…the rest show 'class: …' (Cards a sitting: class Auto since 🪑 CPSEATS, Passes: class 2)", /class: <b>Auto<\/b>/.test(h)&&/class: <b>2<\/b>/.test(h));
  w.envcView("student","ramirez_maya"); w._envcs.stuOpen="ramirez_maya"; w.renderAll();
  ok("Maya has none: 'All as the class', every row 'class: …'", /All as the class/.test(w.G.content)&&/class: <b>5<\/b>/.test(w.G.content)&&!/this student:/.test(w.G.content));
  w.envClsInput("class","newPerDay","20"); await w.flush();
  ok("the class's 20 shows on Maya's page as 'class: 20'", (w.renderAll(),/class: <b>20<\/b>/.test(w.G.content)));
  w.envClsSave("tran_jonah","newPerDay",null); await w.flush();
  ok("clearing Jonah's override → update students/tran_jonah/settings/study {newPerDay:null} (demo: would write)", JSON.stringify(last(w))===JSON.stringify({op:"update",path:"students/tran_jonah/settings/study",val:{newPerDay:null}}));
  ok("…and he falls back to the class (20)", w.envClsEff("tran_jonah","newPerDay")===20&&!(w._envc.students.tran_jonah.settings.study||{}).newPerDay);
  w.envClsInput("tran_jonah","cat_intro_max","2","Forestry · Terms"); await w.flush();
  ok("a student's per-deck override is one key under students/<sid>/settings/drill", JSON.stringify(last(w))===JSON.stringify({op:"update",path:"students/tran_jonah/settings/drill",val:{"cat_intro_max/Forestry · Terms":2}})); }

console.log("\n── Adrienne's locks ──");
{ const w=demo("admin"); w.envcView("classset"); w.envClsLock("newPerDay",true); await w.flush();
  ok("admin: 🔒 Lock → demo 'would update settings/locks'; the row says locked for the teacher", JSON.stringify(last(w))===JSON.stringify({op:"update",path:"settings/locks",val:{newPerDay:true}})&&/🔓 Unlock/.test(w.G.content)&&/locked for the teacher/.test(w.G.content));
  w.envsDemoGo("teacher"); w.envcView("classset"); const h=w.G.content; const i=h.indexOf("New cards a day"), row=h.slice(h.lastIndexOf('<div style="padding:10px 0',i),h.indexOf("Cards a sitting",i));
  ok("teacher: that row is greyed, its box disabled, '🔒 set by Adrienne'", /opacity:\.55/.test(row)&&/ disabled onchange/.test(row)&&/set by Adrienne/.test(row), row.slice(0,300));
  ok("…the other rows stay open", !/ disabled onchange="envClsInput\('class','passes'/.test(h));
  const n=w._envs.writes.length; w.envClsInput("class","newPerDay","30"); w.envClsSave("tran_jonah","newPerDay",9); w.envClsReset("class","front"); await w.flush();
  ok("a teacher save of a locked setting is refused (class and student); Reset skips it", w._envs.writes.length===n&&w.envClsEff("class","newPerDay")===5&&w.envClsEff("tran_jonah","newPerDay")===3);
  w.envsDemoGo("admin"); w.envClsInput("class","newPerDay","20"); await w.flush();
  ok("Adrienne still changes it", JSON.stringify(last(w))===JSON.stringify({op:"update",path:"classes/"+CID+"/settings/study",val:{newPerDay:20}}));
  const rules=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon/SITE_RULES.json"),"utf8")).rules;
  const cs=rules.classes.$cid.settings, ss=rules.students.$sid.settings, lk=rules.settings.locks;
  ok("rules: settings/locks — any login reads, only admin writes, true/null only", lk[".read"]==="auth != null"&&/admins/.test(lk[".write"])&&!/teacher/.test(lk[".write"])&&lk.$name[".validate"]==="newData.isBoolean()");
  ok("rules: a class value for a locked name fails .validate unless admin; only study / drill", /settings\/locks\/'\+\$name/.test(cs.$part.$name[".validate"])&&/admins/.test(cs.$part.$name[".validate"])&&/study.*drill/.test(cs.$part[".validate"]));
  ok("rules: a student override — the class's teacher (never for a locked name, set or clear) or admin", /teacher/.test(ss.$part.$name[".write"])&&/settings\/locks\/'\+\$name\)\.val\(\) != true/.test(ss.$part.$name[".write"])&&/admins/.test(ss.$part.$name[".write"])&&!ss[".write"]);
  ok("rules: the class's teacher writes classes/<cid>/settings (per child since 🏫 CPCLASS: the whole class is the admin's)", /classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/.test(rules.classes.$cid.settings[".write"])&&!/teacher/.test(rules.classes.$cid[".write"]));
  ok("SITE_SETUP.md explains the class settings", /Class settings/.test(fs.readFileSync(path.join(REPO,"envirothon/SITE_SETUP.md"),"utf8"))); }

console.log("\n── the kid: the overlay, in memory only ──");
{ const w=demo("teacher"); const md=w.masteryData, before=JSON.stringify(md);
  const rec=md.maya_sessions.envirothon, ds=md.maya_settings;
  { const S0=w.envClassOverlay("study","maya",rec);
    ok("before any change: the drill overlay gives back the very same object; the study one differs only in Cards a sitting = Auto (5 a day × 5 days = 25, 🪑 CPSEATS), a new object", w.envClassOverlay("drill","maya",ds)===ds&&S0!==rec&&S0.maxCards===25&&rec.maxCards===12&&Object.keys(rec).every(k=>k==="maxCards"||S0[k]===rec[k])); }
  w.envClsInput("class","newPerDay","20"); w.envClsInput("class","passes","3"); w.envClsInput("class","maxCards","30"); await w.flush();
  w.envClsPat("class","rec","on"); await w.flush(); w.envClsPat("class","pick","off"); await w.flush(); w.envClsPat("class","ideas","off"); await w.flush(); w.envClsPat("class","type","off"); await w.flush();
  w.envClsInput("class","ladder_streak","5"); w.envClsSave("class","miss_drop","one"); w.envClsSave("class","cat_modes","flash","Forestry · Terms"); w.envClsInput("class","max_intro_per_cat","6"); w.envClsInput("class","cat_intro_max","2","Forestry · ID"); await w.flush();
  ok("the demo wrote NOTHING (every save a 'would write' record)", w.G.writes.length===0&&w._envs.writes.length>=10);
  w.envsDemoGo("kid");
  const S=w.envClassOverlay("study","maya",rec), D=w.envClassOverlay("drill","maya",ds);
  ok("Maya's 🌿 session in memory: 20 new a day, 3 passes, 30 a sitting, Flip only — a new object", S!==rec&&S.newPerDay===20&&S.passes===3&&S.maxCards===30&&JSON.stringify(S.pattern)==='["rec"]'&&S.decks===rec.decks);
  ok("her drill settings in memory: 5 in a row, a miss drops one level, Forestry · Terms on Flash", D!==ds&&D.ladder_streak===5&&D.miss_drop==="one"&&D.cat_modes["Forestry · Terms"]==="flash"&&D.cat_modes["Forestry · ID"]===ds.cat_modes["Forestry · ID"]);
  ok("'New per deck in a drill' 6 reaches the decks: the enroll's per-deck 3s step aside, the class's own per-deck 2 stays", D.max_intro_per_cat===6&&D.cat_intro_max["Forestry · ID"]===2&&D.cat_intro_max["Forestry · Terms"]===undefined);
  ok("nothing in her own records changed (masteryData byte-identical)", JSON.stringify(md)===before);
  const E=engine(w.envClassOverlay,md,"maya"); const ses=E.mstSessions("maya").find(s=>s.sid==="envirothon");
  ok("the REAL mstSessions reads 20 / 3 passes / pattern [rec] for the 🌿 session", ses.newPerDay===20&&ses.passes===3&&JSON.stringify(ses.pattern)==='["rec"]');
  ok("…so her next learning card is a flip card (mstPatternMode → 'rec' on every learning day)", [0,1,2,3,4].every(d=>E.mstPatternMode(ses.pattern,d,5)==="rec"));
  ok("the REAL mastDrillSettings / mastGetCatMode read the class's values", E.mastDrillSettings().ladder_streak===5&&E.mastDrillSettings().miss_drop==="one"&&E.mastGetCatMode("maya","Forestry · Terms")==="flash"&&E.mastGetCatMode("maya","Forestry · Facts")==="flash"&&E.mastGetCatMode("maya","Forestry · ID")==="flip");
  ok("the 🌿 start: '⚙️ Your class plan: up to 20 new cards today · 🔄 Flip'", /Your class plan: up to 20 new cards today · 🔄 Flip/.test(w.envClsStartHtml("maya",ses)));
  ok("…not on any other session, not for another kid", w.envClsStartHtml("maya",Object.assign({},ses,{sid:"german"}))===""&&w.envClsStartHtml("other",ses)==="");
  ok("another kid, or the drill of nobody, gets the very same object back", w.envClassOverlay("study","other",rec)===rec&&w.envClassOverlay("drill","",ds)===ds);
  w.envsDemoGo("teacher"); w.envClsSave("class","handOffAt","monthly"); await w.flush(); w.envsDemoGo("kid");
  const H=engine(w.envClassOverlay,md,"maya"); ok("hand-off reaches mstSessions (the 🌿 owns cards below it) — and the final's envtHandOffAt reads the same overlay", H.mstSessions("maya")[0].handOffAt==="monthly"&&/envClassOverlay\("study",kid,s\)/.test(src.slice(src.indexOf("function envtHandOffAt("),src.indexOf("function envtHandOffAt(")+300)));
  ok("a bad stored value is skipped, a mix-in / hand-off pair out of order keeps the kid's own", (()=>{ const m=w.envClsMerge("study",{newPerDay:5,mixInAt:"weekly",handOffAt:"bi_weekly"},[{study:{newPerDay:99,mixInAt:"monthly"}}]); return m.newPerDay===5&&m.mixInAt==="weekly"&&m.handOffAt==="bi_weekly"; })());
  ok("student over class: class 20, student 8 → 8; student cleared → 20", w.envClsMerge("study",{newPerDay:5},[{study:{newPerDay:20}},{study:{newPerDay:8}}]).newPerDay===8&&w.envClsMerge("study",{newPerDay:5},[{study:{newPerDay:20}},{study:{}}]).newPerDay===20); }

console.log("\n── the kid's boot (live): one once each, no write ──");
{ const remote={"classes/c1/settings":{study:{newPerDay:20,pattern:["rec"]},drill:{ladder_streak:4}},"students/fam_k/settings":{study:{passes:4}}};
  const w=world({fam:FAM,remote}); w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.cid="c1";
  const rec={name:"Envirothon",newPerDay:5,passes:2,pattern:["pick","ideas","type"],mixInAt:"weekly",handOffAt:"bi_weekly"};
  ok("before the reads arrive: nothing applies", w.envClassOverlay("study","k",rec)===rec);
  w.envsReadShared();
  const mine=w.G.reads.filter(p=>/settings/.test(p));
  ok("exactly two reads: classes/c1/settings and students/fam_k/settings, once each", JSON.stringify(mine.sort())===JSON.stringify(["classes/c1/settings","students/fam_k/settings"])&&!w.G.listeners.some(l=>/settings$/.test(l.p)&&/^(classes\/c1|students)/.test(l.p)));
  const S=w.envClassOverlay("study","k",rec), D=w.envClassOverlay("drill","k",{ladder_streak:3});
  ok("…then the class (20, Flip) and the student (4 passes) apply; drill 4 in a row", S.newPerDay===20&&S.passes===4&&JSON.stringify(S.pattern)==='["rec"]'&&D.ladder_streak===4);
  w.envClsKidLoad(w.firebase.database(),"c1"); ok("a second load reads nothing more", w.G.reads.filter(p=>/settings/.test(p)).length===2);
  ok("no write on the kid's boot", w.G.writes.length===0);
  const p=world({fam:FAM,remote}); p._envs.role="parent"; p._envs.kid="k"; p._envs.sid="fam_k"; p._envs.cid="c1"; p.envsReadShared(); ok("a parent's login reads them too (the parent drill uses them)", p.envClassOverlay("study","k",rec).newPerDay===20);
  const t=liveConsole("teacher"); t._envs.kid="k"; t._envcs.loaded=true; t._envcs.kcls={study:{newPerDay:20}}; ok("a teacher's login never lays them over anything", t.envClassOverlay("study","k",rec)===rec); }

console.log("\n── Howe (no edition) and every other session: byte-identical ──");
{ const h=world({fam:{familyId:"howe",roster:[]}}); const rec={name:"Envirothon",newPerDay:5}, ds={ladder_streak:3};
  h._envs.kid="lincoln_like"; h._envcs.loaded=true; h._envcs.kcls={study:{newPerDay:20},drill:{ladder_streak:9}};
  ok("Howe: envClassOverlay gives back the very same object (study and drill), even with values in memory", h.envClassOverlay("study","lincoln_like",rec)===rec&&h.envClassOverlay("drill","lincoln_like",ds)===ds);
  ok("Howe: no read, no listener, no start line, the panel is empty", h.envClsKidLoad(h.firebase.database(),"c1")===false&&h.G.reads.length===0&&h.G.listeners.length===0&&h.envClsStartHtml("lincoln_like",{sid:"envirothon",newPerDay:5})===""&&h.envClsPanelHtml()===""&&h.envClsStudentHtml("x")===""&&h.envClsConsoleStart()===false);
  const fixture=()=>({k:[{id:"a",subject:"German",status:"active"}],k_sessions:{german:{name:"German",decks:["German"],newPerDay:4,pattern:["rec","say","type"]},envirothon:{name:"Envirothon",emoji:"🌿",kind:"deck",decks:["Forestry · Terms"],newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",maxCards:12,focusDecks:2,pattern:["pick","ideas","type"]},mix:{name:"Daily Mix",kind:"mix"}},k_settings:{ladder_streak:4,cat_modes:{German:"flip"},cat_intro_max:{German:2}}});
  const snap=E=>JSON.stringify([E.mstSessions("k"),E.mastDrillSettings(),E.mastGetCatMode("k","German"),E.mastGetCatMode("k","Forestry · Terms")]);
  const none=snap(engine(undefined,fixture(),"k")), howe=snap(engine(h.envClassOverlay,fixture(),"k"));
  ok("the real mstSessions / mastDrillSettings / mastGetCatMode: Howe with the block = without it, byte for byte", none===howe&&none.length>200);
  const s=demo("teacher"); s.envClsInput("class","newPerDay","20"); s.envClsInput("class","ladder_streak","7"); await s.flush(); s.envsDemoGo("kid");
  const md=fixture(); const site=engine(s.envClassOverlay,md,"k");
  ok("on the site, a kid who is not the site's kid: byte-identical too", snap(site)===none);
  md.maya=md.k; md.maya_sessions=md.k_sessions; md.maya_settings=md.k_settings; const M=engine(s.envClassOverlay,md,"maya"), all=M.mstSessions("maya");
  ok("on the site's own kid: every session but the 🌿 one is untouched (German, the Mix)", JSON.stringify(all.filter(x=>x.sid!=="envirothon"))===JSON.stringify(engine(undefined,fixture(),"k").mstSessions("k").filter(x=>x.sid!=="envirothon"))&&all.find(x=>x.sid==="envirothon").newPerDay===20); }

console.log("\n── the demo ──");
{ const w=demo("teacher");
  ok("the sample class starts at the defaults: no class value, 5 a day", JSON.stringify((w._envc.cls&&w._envc.cls.settings)||{})==="{}"&&w.envClsEff("class","newPerDay")===5&&w.envClsEff("class","pattern").join()==="pick,ideas,type");
  ok("one sample student (Jonah T.) has an override; Maya none; no lock", JSON.stringify(w._envc.students.tran_jonah.settings)==='{"study":{"newPerDay":3}}'&&!w._envc.students.ramirez_maya.settings&&!Object.keys(w._envcs.locks).length);
  w.envcView("classset"); w.envClsInput("class","newPerDay","20"); await w.flush();
  ok("a change: the 'would write' toast, the screen shows 20 at once, nothing written", /demo: would update classes\/ms-science-2026\/settings\/study/.test(w.G.els["envs-toast"]?w.G.els["envs-toast"].textContent:(w.G.created.find(e=>e.id==="envs-toast")||{}).textContent||"")&&/now: <b>20<\/b>/.test(w.G.content)&&w.G.writes.length===0);
  w.envsDemoGo("kid"); const ses=w.masteryData.maya_sessions.envirothon;
  ok("…switch to Kid: Maya's 🌿 session reads 20 (the class plan line says so)", w.envClassOverlay("study","maya",ses).newPerDay===20&&/up to 20 new cards today/.test(w.envClsStartHtml("maya",Object.assign({sid:"envirothon"},w.envClassOverlay("study","maya",ses)))));
  ok("the demo never reads Firebase for it", w.envClsKidLoad(w.firebase.database(),CID)===false&&w.G.reads.length===0); }

console.log("\n"+pass+" passed, "+fail+" failed");
if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
