/*
 * 🏠 CPHOMELINK (2026-11-10) — the home link on the class site. Her decisions:
 *   (a) a teacher or admin login that ALSO carries a parent record (logins/<uid> = a parent row + home:true) stays teacher/admin at sign-in
 *   (b) "🏠 <kid>" in the console opens that family's parent page (HA_LS envs_home = "1" + reload); from there the CPKIDMODE switch works as
 *       for any parent — except a Howe-app kid (Lincoln), who gets the parent view only (no kid mode, no family instance, no app boot, no mirror)
 *   (c) the family's own parent login keeps working: the home link is a second parent (students/<sid>/logins/home), not a replacement
 *   A plain parent or kid login reads nothing more and sees nothing new; Howe/DeWalt/Burris untouched (test_env_site.js).
 *   run:  node test_cp_homelink.js
 */
const {world}=require("./test_env_site.js");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):""));} };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const ROW_B={role:"parent",familyId:"josiah-c",kid:"josiah",cid:"ms-science-2026",name:"Josiah C.",home:true};   // Brittany's home record
const ROW_A={role:"parent",familyId:"howe",kid:"lincoln",cid:"ms-science-2026",name:"Lincoln",home:true};        // Adrienne's
const TEACH={name:"Brittany",classes:{"ms-science-2026":true}};
const CLS={"classes/ms-science-2026":{name:"MS Science",teacher:"u1",students:{"josiah-c_josiah":true,howe_lincoln:true}}};
async function gate(remote,flag,mode){
  const w=world({fam:Object.assign({},FAM),auth:{uid:"u1",email:"b@example.com"},remote:Object.assign({},CLS,remote)});
  if(flag) w.HA_LS.setItem("envs_home","1"); if(mode) w.HA_LS.setItem("envs_mode",mode);
  let cont=0; w.envSiteGate({uid:"u1",email:"b@example.com"},()=>{ cont++; w.G.initFb=(w.G.initFb||0)+1; w.renderAll(); }); await w.flush(); w.cont=cont; return w;
}

(async()=>{
// ── PURE: the home record and the role decision ──
{ const w=world({fam:FAM});
  ok("home key is envs_home", w.ENVS_HOME_KEY==="envs_home");
  ok("a parent row with home:true → its parent record (family, kid, class, name)", JSON.stringify(w.envsHomeRec(ROW_B))==='{"role":"parent","familyId":"josiah-c","kid":"josiah","cid":"ms-science-2026","name":"Josiah C."}');
  ok("no home flag / home not exactly true / a kid row / no family → null", w.envsHomeRec(Object.assign({},ROW_B,{home:undefined}))===null&&w.envsHomeRec(Object.assign({},ROW_B,{home:"yes"}))===null&&w.envsHomeRec(Object.assign({},ROW_B,{role:"kid"}))===null&&w.envsHomeRec(Object.assign({},ROW_B,{familyId:""}))===null&&w.envsHomeRec(null)===null);
  ok("kids + kidSwap:false ride along (siblings, kid mode)", (r=>r.kids.ada===true&&r.kidSwap===false)(w.envsHomeRec(Object.assign({},ROW_B,{kids:{ada:true},kidSwap:false}))));
  const P=w.envsHomeRec(ROW_B), PA=w.envsHomeRec(ROW_A);
  let r=w.envsHomePick(P,null,TEACH,false,"");
  ok("teacher record + flag off → TEACHER of her first class, carrying the home record", r.role==="teacher"&&r.cid==="ms-science-2026"&&r.name==="Brittany"&&r.home.familyId==="josiah-c");
  r=w.envsHomePick(PA,true,null,false,""); ok("admin + flag off → ADMIN carrying the home record", r.role==="admin"&&r.home.kid==="lincoln");
  ok("neither admin nor a teacher with a class → null (the row signs in as the plain parent it is)", w.envsHomePick(P,null,null,true,"")===null&&w.envsHomePick(P,false,{name:"x"},false,"")===null);
  r=w.envsHomePick(P,null,TEACH,true,"micro"); ok("teacher + flag on → the PARENT record, homeOf teacher, not a Howe-app kid", r.role==="parent"&&r.familyId==="josiah-c"&&r.homeOf==="teacher"&&r.homeApp==="");
  r=w.envsHomePick(PA,true,null,true,""); ok("admin + flag on + family howe → parent, homeOf admin, homeApp howe", r.role==="parent"&&r.homeOf==="admin"&&r.homeApp==="howe");
  r=w.envsHomePick(P,null,TEACH,true,"howe"); ok("students/<sid>/app = howe → homeApp howe whatever the family id", r.homeApp==="howe"); }

// ── the gate: plain logins are untouched ──
{ const w=await gate({"logins/u1":{role:"parent",familyId:"josiah-c",kid:"josiah",cid:"ms-science-2026"},"teachers/u1":TEACH},true);
  ok("plain parent row (no home flag), even with a teachers record and envs_home set → parent, exactly the old reads, nothing new", w._envs.role==="parent"&&w.G.reads.slice(0,2).join(",")==="release/locked,logins/u1"&&!w.G.reads.some(p=>/^(admins|teachers)\//.test(p))&&w._envs.home===null&&w._envs.homeOf===""&&w.cont===1);
  ok("…its page has no 👩‍🏫 Back to the console and no 🏠", !/envsHomeBack|envsHomeGo/.test(w.G.content)&&/Go to Josiah/.test(w.G.content)); }
{ const w=await gate({"logins/u1":{role:"kid",familyId:"josiah-c",kid:"josiah",cid:"ms-science-2026",home:true},"teachers/u1":TEACH},true);
  ok("a KID row (home:true or not) → kid, no admins/teachers read", w._envs.role==="kid"&&w.G.reads.slice(0,2).join(",")==="release/locked,logins/u1"&&!w.G.reads.some(p=>/^(admins|teachers)\//.test(p))&&w._envs.homeOf===""); }
{ const w=await gate({"logins/u1":ROW_B},true);
  ok("home:true but no teacher/admin record → the plain parent it is (one admins + one teachers read, no home page)", w._envs.role==="parent"&&w._envs.homeOf===""&&w._envs.home===null&&w.G.reads.slice(0,4).join(",")==="release/locked,logins/u1,admins/u1,teachers/u1"&&!w.G.reads.some(p=>/\/app$/.test(p))&&!/envsHomeBack/.test(w.G.content)); }

// ── Brittany: teacher at sign-in, 🏠 Josiah → the home page ──
{ const w=await gate({"logins/u1":ROW_B,"teachers/u1":TEACH});
  ok("(a) logins row with home:true + teachers/<uid> → TEACHER, her class, the console (no app boot), the home record kept", w._envs.role==="teacher"&&w._envs.cid==="ms-science-2026"&&w.cont===0&&w._envs.home&&w._envs.home.familyId==="josiah-c"&&w._envs.home.kid==="josiah"&&w._envs.dbUrl==="");
  ok("…reads: release/locked, logins, admins, teachers — no student app read while the flag is off", ["release/locked","logins/u1","admins/u1","teachers/u1"].every(p=>w.G.reads.includes(p))&&!w.G.reads.some(p=>/\/app$/.test(p)));
  ok("(b) the console's top bar has 🏠 Josiah (before ⚙️)", /envsHomeGo\(\)[^>]*>\u{1F3E0} Josiah<\/button>/u.test(w.G.content)&&w.G.content.indexOf("envsHomeGo()")<w.G.content.indexOf('aria-label="Settings"'), w.G.content.slice(0,600));
  ok("…envsHomeBtnHtml for her: 🏠 Josiah", /\u{1F3E0} Josiah/u.test(w.envsHomeBtnHtml()));
  const r=w.envsHomeGo();
  ok("🏠 → HA_LS envs_home = 1, any kid mode forgotten, a reload, nothing written", r===true&&w.HA_LS.getItem("envs_home")==="1"&&w.HA_LS.getItem("envs_mode")===null&&w.G.reloads===1&&w.G.writes.length===0); }
{ const w=await gate({"logins/u1":ROW_B,"teachers/u1":TEACH,"students/josiah-c_josiah/app":"micro"},true);
  ok("flag on → the PARENT page for josiah-c: role parent, homeOf teacher, the family instance, the app's boot continued", w._envs.role==="parent"&&w._envs.homeOf==="teacher"&&w._envs.homeApp===""&&w._envs.familyId==="josiah-c"&&w._envs.sid==="josiah-c_josiah"&&w._envs.dbUrl==="https://howe-envirothon-josiah-c.firebaseio.com"&&w.cont===1);
  ok("…one extra read for the student's app", w.G.reads.includes("students/josiah-c_josiah/app"));
  ok("…the page: How Josiah is doing, Go to Josiah, 👩‍🏫 Back to the console, the PIN/codes as for any parent", /How Josiah C\. is doing/.test(w.G.content)&&/envsGoKid\('josiah'\)">Go to Josiah C\.</.test(w.G.content)&&/envsHomeBack\(\)[^>]*>\u{1F469}‍\u{1F3EB} Back to the console</u.test(w.G.content)&&/Student cards/.test(w.G.content));
  ok("…the mirror points at the family as for its own parent", w.G.fam.envirothon&&w.G.fam.envirothon.familyId==="josiah-c");
  ok("envsModeBtns: Go to Josiah, then Back to the console", JSON.stringify(w.envsModeBtns())==='[{"go":"josiah"},{"console":true}]');
  const b=w.envsHomeBack();
  ok("👩‍🏫 Back to the console (no password) → envs_home cleared, reload, nothing written", b===true&&w.HA_LS.getItem("envs_home")===null&&w.G.reloads===1&&w.G.writes.length===0); }
{ const w=await gate({"logins/u1":ROW_B,"teachers/u1":TEACH},true,"kid:josiah");
  ok("home page + kid mode on the device → Josiah's kid view (CPKIDMODE), role still parent", w._envs.kidMode==="josiah"&&w._envs.role==="parent"&&w._envs.homeOf==="teacher"&&/fake-study/.test(w.G.content));
  ok("…kid view: 👩 Parent only — no Back to the console (that goes through the password first)", JSON.stringify(w.envsModeBtns())==='[{"parent":true}]'&&!/envsHomeBack/.test(w.G.content));
  ok("…envsHomeBack refuses from kid view", w.envsHomeBack()===false&&w.G.reloads===0&&w.HA_LS.getItem("envs_home")==="1"); }

// ── Adrienne: admin, 🏠 Lincoln → the Howe-app home page ──
{ const w=await gate({"logins/u1":ROW_A,"admins/u1":true});
  ok("admin + home row → ADMIN, teachers never read, home record kept", w._envs.role==="admin"&&!w.G.reads.includes("teachers/u1")&&w._envs.home.kid==="lincoln");
  ok("…🏠 Lincoln in her console", /\u{1F3E0} Lincoln/u.test(w.G.content)); }
{ const w=await gate({"logins/u1":ROW_A,"admins/u1":true,"students/howe_lincoln/summary":{unitVer:1,at:1,byDeck:{},streak:{days:3,last:"20261027"},days:{}},"students/howe_lincoln/class":"ms-science-2026"},true,"kid:lincoln");
  ok("flag on, family howe → parent, homeOf admin, homeApp howe, NO family instance, NO app boot (no initFb), no kid mode even with envs_mode set", w._envs.role==="parent"&&w._envs.homeOf==="admin"&&w._envs.homeApp==="howe"&&w._envs.dbUrl===""&&w.cont===0&&!w.G.initFb&&w._envs.kidMode===""&&w.envSiteDb()===null);
  ok("…no students/<sid>/app read (family howe says it)", !w.G.reads.some(p=>/\/app$/.test(p)));
  ok("…listens to the mirrored summary + weeks, the class, boards, who drills, the lock — reads only", ["students/howe_lincoln/summary","students/howe_lincoln/weeks","classes/ms-science-2026","boards/ms-science-2026","settings/whoDrills/ms-science-2026","release/locked"].every(p=>w.G.listeners.some(l=>l.p===p)), w.G.listeners.map(l=>l.p));
  ok("…the page uses the mirrored summary (3-day streak)", w.envsSummary("lincoln")&&w.envsSummary("lincoln").streak.days===3&&/3-day streak/.test(w.G.content));
  ok("(b) …'Lincoln studies in the Howe app', no Go to Lincoln, Back to the console", /Lincoln studies in the Howe app/.test(w.G.content)&&!/envsGoKid/.test(w.G.content)&&/envsHomeBack\(\)/.test(w.G.content)&&JSON.stringify(w.envsModeBtns())==='[{"console":true}]');
  ok("…read-only: no review switch, no study days, no flags, no Student cards", !/Student cards/.test(w.G.content)&&!/cpdrAsk|cpdrSet/.test(w.G.content));
  ok("…the mirror never arms, nothing enrolls, the mirror target is not set, nothing written", !w._envs.mirrorArmed&&!w.G.ust&&!(w.G.fam.envirothon)&&w.G.writes.length===0);
  w._envs.view="settings"; w.renderAll();
  ok("…⚙️: no Parent PIN (no family instance to keep it), Sign out still there", !/Parent PIN/.test(w.G.content)&&/envsSignOut/.test(w.G.content));
  w.envsSignOut(); ok("Sign out forgets the home page and the kid mode", w.HA_LS.getItem("envs_home")===null&&w.HA_LS.getItem("envs_mode")===null); }
{ const w=await gate({"logins/u1":ROW_B,"teachers/u1":TEACH,"students/josiah-c_josiah/app":"howe"},true);
  ok("a non-howe family whose student record says app = howe → the Howe-app home page too", w._envs.homeApp==="howe"&&w._envs.dbUrl===""&&w.cont===0); }
{ const w=await gate({"logins/u1":ROW_A,"admins/u1":true,"release/locked":true},true);
  ok("a closed season does not shut Adrienne out of her home page", w._envs.homeOf==="admin"&&!w.G.created.some(e=>/Season closed/.test(e.innerHTML||""))); }
{ const w=await gate({"logins/u1":ROW_B,"teachers/u1":TEACH,"release/locked":true},true);
  ok("…the teacher's home page closes with the season, as her console does", w.G.created.some(e=>/Season closed/.test(e.innerHTML||""))); }

// ── buttons per role ──
{ const w=world({fam:FAM}); const B=st=>JSON.stringify(w.envsModeBtns(st));
  ok("plain parent → Go to only (no console button)", B({role:"parent",kids:["ada"],kid:"ada",kidMode:""})==='[{"go":"ada"}]');
  ok("teacher / admin with a home → no mode buttons (the 🏠 is in the console bar)", B({role:"teacher",homeOf:"",home:{kid:"x"}})==="[]"&&B({role:"admin"})==="[]");
  ok("home page, micro family → Go to + console; Howe-app → console only; kid view → 👩 Parent only", B({role:"parent",kids:["josiah"],kid:"josiah",kidMode:"",homeOf:"teacher"})==='[{"go":"josiah"},{"console":true}]'&&B({role:"parent",kids:["lincoln"],kid:"lincoln",kidMode:"",homeOf:"admin",homeApp:"howe"})==='[{"console":true}]'&&B({role:"parent",kids:["josiah"],kid:"josiah",kidMode:"josiah",homeOf:"teacher"})==='[{"parent":true}]');
  w._envs.role="teacher"; w._envs.home=null; ok("🏠: a teacher with no home record → none", w.envsHomeBtnHtml()===""&&w.envsHomeGo()===false);
  w._envs.role="parent"; w._envs.home={kid:"x"}; ok("🏠: a parent → none", w.envsHomeBtnHtml()===""&&w.envsHomeGo()===false&&w.G.reloads===0); }
{ const w=world({fam:{familyId:"howe",roster:[]}}); w._envs.role="teacher"; w._envs.home={kid:"josiah",name:"Josiah"};
  ok("not the class site (Howe/DeWalt/Burris) → no 🏠, no home page, nothing read", w.envsHomeBtnHtml()===""&&w.envsHomeGo()===false&&w.envsHomeBack()===false&&w.G.reads.length===0); }

// ── Admin ▸ Families seed JSON ──
{ const w=world({fam:FAM});
  const s={sid:"josiah-c_josiah",class:"ms-science-2026",meta:{familyId:"josiah-c",kid:"josiah",name:"Josiah C."},logins:{parent:"UHUSB",kid:"UKID",home:"UBRIT"}};
  ok("seed JSON allows the family's parent, the kid AND the home-linked parent", JSON.stringify(w.envcSeedJson(s).allowed)==='{"UHUSB":true,"UKID":true,"UBRIT":true}');
  ok("…without a home link: the two, as before", JSON.stringify(w.envcSeedJson(Object.assign({},s,{logins:{parent:"UHUSB",kid:"UKID"}})).allowed)==='{"UHUSB":true,"UKID":true}'); }

// ── demo: the sample teacher's 🏠 Maya, in memory ──
{ const w=world({fam:FAM,search:"?demo=1&role=teacher"}); w.envSiteDemoBoot(); w.renderAll();
  ok("demo teacher: 🏠 Maya in the console bar", /envsHomeGo\(\)[^>]*>\u{1F3E0} Maya</u.test(w.G.content));
  w.envsHomeGo();
  ok("🏠 → Maya's parent page in memory, with Back to the console; no reload, nothing written", w._envs.role==="parent"&&w._envs.homeOf==="teacher"&&/How Maya is doing/.test(w.G.content)&&/envsHomeBack\(\)/.test(w.G.content)&&w.G.reloads===0&&w.G.writes.length===0);
  w.envsHomeBack();
  ok("Back to the console → the teacher again", w._envs.role==="teacher"&&w._envs.homeOf===""&&/envsHomeGo\(\)/.test(w.G.content));
  w.envsDemoGo("parent"); ok("the demo's own Parent button → a plain parent page (no console button)", w._envs.homeOf===""&&!/envsHomeBack/.test(w.G.content)); }

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
})().catch(e=>{ console.error(e); process.exit(1); });
