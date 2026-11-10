/*
 * 🧒 CPSIBLINGS (2026-11-10) — one parent login, several kids; the parent makes each kid's card herself.
 * Her words: "could we link both of them to the same mom" · "can the parent get a mirror link to have each kids code".
 *   · the gate: logins/<uid>/kids lists the others → _envs.kids (login's kid first, no dupes); the device's last pick opens first; a kid login stays one kid
 *   · the parent page: a tab per kid when there are two, none for one; a tap stores the pick and reloads (every listener is keyed on one sid)
 *   · 🎟 Student cards: a new code = a new kid user (synthetic email + derived password on a secondary app) + logins/<uidK> + students/<sid>/logins/kid|kidAt,
 *     the card shown once; neither the code nor a password is in anything written to the database
 *   · the console: + Sibling writes the kid's row, the parent's kids list (every kid of the family), the student record, the seat — and no parent user;
 *     the card is on the student page for micro students only
 *   · the rules: logins/$uid/kids/$k (teacher of that login's class, true only, slug key); a parent's own new kid row; students/$sid/logins/kid + kidAt
 *   run:  node test_cp_siblings.js
 */
const fs=require("fs"), path=require("path"); const {world,src}=require("./test_env_site.js");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):""));} };
const FAM={familyId:"howe",roster:[],edition:"envirothon"};
const L2={role:"parent",familyId:"park",kid:"ada",cid:"ms1",kids:{ada:true,ben:true,"bad key!":true,zed:false}};

(async()=>{
// ── the gate ──
{ const w=world({fam:FAM}); w.envsApplyLogin(L2);
  ok("a parent login with kids → _envs.kids = login's kid first, the listed ones after, bad keys and false entries dropped", JSON.stringify(w._envs.kids)===JSON.stringify(["ada","ben"]), w._envs.kids);
  ok("the login's own kid is the one open, sid from it", w._envs.kid==="ada"&&w._envs.sid==="park_ada");
  w.HA_LS.setItem("envs_kid_pick","ben"); w.envsApplyLogin(L2);
  ok("the device's last pick opens first when it is one of hers", w._envs.kid==="ben"&&w._envs.sid==="park_ben"&&w._envs.kids[0]==="ada");
  w.HA_LS.setItem("envs_kid_pick","maya"); w.envsApplyLogin(L2);
  ok("a pick that is not hers is ignored", w._envs.kid==="ada");
  w.envsApplyLogin({role:"parent",familyId:"park",kid:"ada",cid:"ms1"});
  ok("one kid, no kids list → kids=[kid]", JSON.stringify(w._envs.kids)===JSON.stringify(["ada"]));
  w.HA_LS.setItem("envs_kid_pick","ben"); w.envsApplyLogin({role:"kid",familyId:"park",kid:"ada",cid:"ms1",kids:{ben:true}});
  ok("a KID login is always its one kid, whatever the row or the device says", w._envs.kid==="ada"&&JSON.stringify(w._envs.kids)===JSON.stringify(["ada"])); }

// ── the parent page ──
{ const w=world({fam:FAM}); w.envsApplyLogin(L2); w._envs.view="home";
  const h=w.envsParentHtml();
  ok("two kids → a tab per kid under the top bar, the open one marked", /envs-kids/.test(h)&&/class="on"[^>]*>Ada</.test(h)&&/envsPickKid\('ben'\)/.test(h)&&!/class="on"[^>]*>Ben</.test(h));
  ok("🎟 Student cards on Home: a New card button per kid, no code shown yet", /Student cards/.test(h)&&/New card for Ada/.test(h)&&/New card for Ben/.test(h)&&!/envc-code-card/.test(h));
  w._envs.kidNames={ben:"Benjamin P."}; ok("a sibling's name comes from students/<sid>/meta/name when it has arrived", /Benjamin P\./.test(w.envsParentHtml()));
  const r=w.envsPickKid("ben");
  ok("tapping another kid stores the pick and reloads", r===true&&w.HA_LS.getItem("envs_kid_pick")==="ben"&&w.G.reloads===1);
  ok("tapping the open kid, or a stranger, does nothing", w.envsPickKid("ada")===false&&w.envsPickKid("maya")===false&&w.G.reloads===1);
  w.envsApplyLogin({role:"parent",familyId:"park",kid:"ada",cid:"ms1"});
  ok("one kid → no tabs, the cards card still there (one button)", !/envs-kids/.test(w.envsParentHtml())&&(w.envsParentHtml().match(/New card for/g)||[]).length===1); }

// ── 🎟 a new code, live ──
{ const w=world({fam:FAM,auth:{uid:"UP",email:"mom@example.com"}}); w.envsApplyLogin(L2); w._envs.view="home"; w.G.now=777;
  const r=w.envsParentNewCode("ben"); await w.flush();
  const code=w._envs.newCard&&w._envs.newCard.code;
  ok("returns true, makes the kid user on a secondary app with the synthetic email + derived password, signs it out", r===true&&w.G.created_users.length===1&&w.G.created_users[0][1]===w.envsKidEmail(code)&&w.G.created_users[0][2]===w.envsKidPw(code), w.G.created_users);
  const up=w.G.writes.filter(x=>x[0]==="update"); const o=up.length?up[up.length-1][2]:{};
  const uidK=(Object.keys(o).find(k=>k.indexOf("logins/")===0)||"logins/?").slice(7);
  ok("ONE multi-path update: logins/<uidK> (role kid, her family, her class, the kid), students/park_ben/logins/kid + kidAt — nothing else", up.length===1&&Object.keys(o).sort().join("|")===["logins/"+uidK,"students/park_ben/logins/kid","students/park_ben/logins/kidAt"].sort().join("|")&&o["logins/"+uidK].role==="kid"&&o["logins/"+uidK].familyId==="park"&&o["logins/"+uidK].cid==="ms1"&&o["logins/"+uidK].kid==="ben"&&o["students/park_ben/logins/kid"]===uidK&&o["students/park_ben/logins/kidAt"]===777, o);
  ok("neither the code nor a password is in anything written to the database", !JSON.stringify(w.G.writes).includes(code)&&!JSON.stringify(w.G.writes).includes(w.G.created_users[0][2]));
  const h=w.envsParentHtml();
  ok("the card shows once: the kid's name, the code, Print, Done, 'not kept anywhere'", /envc-code-card/.test(h)&&h.includes(code)&&/Print card/.test(h)&&/Done/.test(h)&&/not kept anywhere/.test(h));
  ok("a stranger's kid, or a kid login, cannot", w.envsParentNewCode("maya")===false&&(w._envs.role="kid",w.envsParentNewCode("ada")===false)); }
{ const w=world({fam:FAM,demo:true}); w._envs.demo={}; w.envsApplyLogin(L2); w._envs.role="parent";
  const n=w.G.writes.length; w.envsParentNewCode("ada"); await w.flush();
  ok("demo: a sample card, no user, no write", w._envs.newCard&&w._envs.newCard.demo===true&&w.G.created_users.length===0&&w.G.writes.length===n); }

// ── the console: + Sibling ──
{ const w=world({fam:FAM}); const o=w.envcAddSiblingPaths({cid:"ms1",familyId:"park",kid:"ben",name:"Ben P.",kids:["ada"],uidParent:"UP",uidKid:"UK2",now:5});
  ok("+ Sibling writes exactly: the kid's login row, kids/ada + kids/ben on the parent, the student record (meta/class/app/logins), the seat", Object.keys(o).sort().join("|")===["logins/UK2","logins/UP/kids/ada","logins/UP/kids/ben","students/park_ben/meta","students/park_ben/class","students/park_ben/app","students/park_ben/logins","classes/ms1/students/park_ben"].sort().join("|"), Object.keys(o));
  ok("…the kid row is role kid in the same family and class; the student points at the SAME parent uid; app micro", o["logins/UK2"].role==="kid"&&o["logins/UK2"].familyId==="park"&&o["logins/UK2"].cid==="ms1"&&o["students/park_ben/logins"].parent==="UP"&&o["students/park_ben/logins"].kid==="UK2"&&o["students/park_ben/app"]==="micro"&&o["students/park_ben/meta"].familyId==="park"&&o["students/park_ben/meta"].at===5);
  ok("no new parent user and no logins/UP row rewrite (only its kids list)", !Object.keys(o).some(k=>k==="logins/UP"||/uid_p|parentEmail/.test(k)));
  const ADA={meta:{familyId:"park",kid:"ada",name:"Ada P.",at:1},class:"ms1",app:"micro",logins:{parent:"UP",kid:"UK"}}, LIN={meta:{familyId:"howe",kid:"lincoln",name:"Lincoln",at:1},class:"ms1",app:"howe"};
  w._envs.role="teacher"; w._envs.uid="t1"; w.tab="envsite"; Object.assign(w.G.remote,{"teachers/t1":{classes:{ms1:true}},"classes/ms1":{name:"C",teacher:"t1",students:{park_ada:true,howe_lincoln:true}},"students/park_ada":ADA,"students/howe_lincoln":LIN}); w.envConsoleStart(); await w.flush();
  if(!w._envc.students||!w._envc.students.park_ada){ w._envc.students={park_ada:ADA,howe_lincoln:LIN}; } w._envc.cid="ms1"; w._envc.cls=w._envc.cls||{students:{park_ada:true,howe_lincoln:true}};
  w.G.writes.length=0;
  const sh=w.envcSiblingHtml("park_ada");
  ok("the student page offers + A brother or sister for a micro student with a parent login", /brother or sister/.test(sh)&&/envcAddSibling\('park_ada'\)/.test(sh)&&/Same parent login as Ada P\./.test(sh));
  ok("…not for a Howe-at-home student (no parent login here)", w.envcSiblingHtml("howe_lincoln")==="");
  ok("the student page carries the card", /brother or sister/.test(w.envcStudentHtml("park_ada")));
  w.el("envc-sib-first","Ben"); w.envcAddSibling("park_ada"); await w.flush();
  const up=w.G.writes.filter(x=>x[0]==="update"&&x[1]==="/"); const o2=up.length?up[up.length-1][2]:{};
  ok("live + Sibling: one kid user made (no parent user, no reset email), ONE multi-path update with the sibling paths, kids/ada + kids/ben", w.G.created_users.length===1&&w.G.resets.length===0&&up.length===1&&o2["logins/UP/kids/ada"]===true&&o2["logins/UP/kids/ben"]===true&&o2["students/park_ben/logins"].parent==="UP"&&o2["classes/ms1/students/park_ben"]===true, Object.keys(o2));
  ok("the code is shown once (newLogin) and never written", w._envc.newLogin&&w._envc.newLogin.sid==="park_ben"&&!JSON.stringify(w.G.writes).includes(w._envc.newLogin.code));
  ok("…and the name is First + the family's last initial", w._envc.newLogin.name==="Ben P.");
  w.el("envc-sib-first","Ada"); const n=w.G.writes.length; w.envcAddSibling("park_ada"); await w.flush();
  ok("a name already on the roster is refused: no user made, nothing written", w.G.writes.length===n&&w.G.created_users.length===1); }

// ── the rules ──
{ const R=JSON.parse(fs.readFileSync(path.join(__dirname,"envirothon","SITE_RULES.json"),"utf8")), L=R.rules.logins.$uid, K=L.kids&&L.kids.$k, SL=R.rules.students.$sid.logins;
  ok("logins/$uid/kids/$k: written by the teacher of that login's class (guarded) or admin; true only; slug key", K&&/logins\/'\+\$uid\+'\/cid'\)\.exists\(\)/.test(K[".write"])&&/admins/.test(K[".write"])&&/newData\.val\(\) == true/.test(K[".validate"])&&/\$k\.matches/.test(K[".validate"]));
  ok("a parent may make a NEW kid row for one of her own kids only: role kid, same family, same class, kid = hers or in her kids list, kid isString first", /!data\.exists\(\) && newData\.child\('role'\)\.val\(\) == 'kid' && newData\.child\('kid'\)\.isString\(\)/.test(L[".write"])&&/'\/kids\/'\+newData\.child\('kid'\)\.val\(\)\)\.val\(\) == true/.test(L[".write"])&&/newData\.child\('cid'\)\.val\(\) == root\.child\('logins\/'\+auth\.uid\+'\/cid'\)\.val\(\)/.test(L[".write"]));
  ok("students/$sid/logins/kid and kidAt: the parent of that family (role parent, guarded family clause); the node's own write unchanged", SL.kid&&SL.kidAt&&[SL.kid,SL.kidAt].every(x=>/role'\)\.val\(\) == 'parent'/.test(x[".write"])&&/familyId'\)\.exists\(\) && \$sid\.beginsWith/.test(x[".write"]))&&/newData\.parent\(\)\.child\('class'\)/.test(SL[".write"]));
  ok("_about names CPSIBLINGS", /CPSIBLINGS/.test(R._about)); }
{ const site=src.slice(src.indexOf("// ENVSITE_START"),src.indexOf("// ENVSITE_END")), con=src.slice(src.indexOf("// ENVCONSOLE_START"),src.indexOf("// ENVCONSOLE_END"));
  ok("the new functions live inside ENVSITE / ENVCONSOLE (the Envirothon build keeps both)", ["envsPickKid","envsKidTabsHtml","envsParentNewCode","envsCodesCardHtml","envsNewCodePaths"].every(f=>site.includes("function "+f+"("))&&["envcAddSiblingPaths","envcSiblingHtml","envcAddSibling"].every(f=>con.includes("function "+f+"(")));
  ok("no Howe kid name as a code literal in the new code", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(site.slice(site.indexOf("function envsPickKid"),site.indexOf("function envsCodesCardHtml")+2000))); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
})();
