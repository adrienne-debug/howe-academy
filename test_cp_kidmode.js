/*
 * 🧒 CPKIDMODE (2026-11-10) — shared-device kid mode on the class site. Her decisions:
 *   · the parent page: "Go to <kid>" top right, one per kid on the login → that kid's own page, the parent still signed in underneath; the device
 *     remembers it (HA_LS envs_mode = "kid:<kid>") so a reload comes back as the kid
 *   · kid view: "👩 Parent" asks for the parent's password (Firebase reauthenticate) — right → the parent page, wrong → "That's not it", stays
 *   · kid → kid without the password when the login has two or more kids, ON by default, OFF per parent (logins/<uid>/kidSwap, absent = on)
 *   · a VIEW on a parent login: _envs.role stays "parent"; real kid logins, teachers, admins see none of it; Howe/DeWalt/Burris untouched
 *   run:  node test_cp_kidmode.js
 */
const fs=require("fs"), path=require("path"); const {world,src}=require("./test_env_site.js");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):""));} };
const FAM={familyId:"howe",roster:[],edition:"envirothon"};
const L2={role:"parent",familyId:"park",kid:"ada",cid:"ms1",kids:{ada:true,henry:true}};
const L1={role:"parent",familyId:"park",kid:"ada",cid:"ms1"};
// a fake signed-in parent whose reauthenticate accepts only `good`
const parentAuth=(good)=>({uid:"UP",email:"mom@example.com",tries:[],reauthenticateWithCredential(c){ this.tries.push(c); return c.p===good?Promise.resolve({user:this}):Promise.reject({code:"auth/wrong-password",message:"bad"}); }});
const withProvider=w=>{ w.firebase.auth.EmailAuthProvider={credential:(e,p)=>({e,p})}; return w; };

(async()=>{
// ── pure helpers ──
{ const w=world({fam:FAM});
  ok("mode key is envs_mode", w.ENVS_MODE_KEY==="envs_mode");
  ok("format: kid → 'kid:<kid>'; a bad key → ''", w.envsModeFmt("ada")==="kid:ada"&&w.envsModeFmt("Bad key!")===""&&w.envsModeFmt(null)==="");
  ok("parse: 'kid:<kid>' → kid; anything else → ''", w.envsModeParse("kid:henry")==="henry"&&w.envsModeParse("kid:")===""&&w.envsModeParse("parent")===""&&w.envsModeParse(null)===""&&w.envsModeParse("kid:a b")==="");
  ok("parse(format(k)) round-trips", ["ada","h-2","x_y"].every(k=>w.envsModeParse(w.envsModeFmt(k))===k));
  ok("kidSwap: absent / true / anything but false = on; false = off", w.envsKidSwapOn(undefined)&&w.envsKidSwapOn(null)&&w.envsKidSwapOn(true)&&!w.envsKidSwapOn(false));
  ok("reauth messages: wrong password → That's not it; too many → wait; network → no connection", w.envsReauthMsg({code:"auth/wrong-password"})==="That’s not it"&&w.envsReauthMsg({code:"auth/invalid-credential"})==="That’s not it"&&/wait a minute/.test(w.envsReauthMsg({code:"auth/too-many-requests"}))&&/No connection/.test(w.envsReauthMsg({code:"auth/network-request-failed"}))&&w.envsReauthMsg(null)==="That’s not it"); }

// ── which buttons a state shows ──
{ const w=world({fam:FAM}); const B=st=>JSON.stringify(w.envsModeBtns(st));
  ok("parent page, two kids → Go to each", B({role:"parent",kids:["ada","henry"],kid:"ada",kidMode:""})==='[{"go":"ada"},{"go":"henry"}]');
  ok("parent page, one kid → Go to that kid", B({role:"parent",kids:["ada"],kid:"ada",kidMode:""})==='[{"go":"ada"}]');
  ok("parent page, kids list empty (demo) → the open kid", B({role:"parent",kids:[],kid:"maya",kidMode:""})==='[{"go":"maya"}]');
  ok("kid view, two kids, swap on (absent) → Go to the other + 👩 Parent last", B({role:"parent",kids:["ada","henry"],kid:"ada",kidMode:"ada"})==='[{"go":"henry"},{"parent":true}]');
  ok("kid view, two kids, swap OFF → 👩 Parent only", B({role:"parent",kids:["ada","henry"],kid:"ada",kidMode:"ada",kidSwap:false})==='[{"parent":true}]');
  ok("kid view, one kid → 👩 Parent only", B({role:"parent",kids:["ada"],kid:"ada",kidMode:"ada"})==='[{"parent":true}]');
  ok("a REAL kid login → nothing, whatever the state says", B({role:"kid",kids:["ada"],kid:"ada",kidMode:"ada"})==="[]"&&B({role:"kid",kids:["ada"],kid:"ada",kidMode:""})==="[]");
  ok("teacher / admin → nothing", B({role:"teacher",kids:[],kid:""})==="[]"&&B({role:"admin",kids:[],kid:""})==="[]");
  ok("the page role: kid view on a parent login = kid; otherwise the login's role", w.envsPageRole({role:"parent",kidMode:"ada"})==="kid"&&w.envsPageRole({role:"parent",kidMode:""})==="parent"&&w.envsPageRole({role:"kid",kidMode:"ada"})==="kid"&&w.envsPageRole({role:"teacher",kidMode:"x"})==="teacher"); }

// ── the gate remembers the mode ──
{ const w=world({fam:FAM}); w.envsApplyLogin(L2);
  ok("no mode on the device → the parent page", w._envs.kidMode===""&&w._envs.role==="parent"&&w._envs.kidSwap===true);
  w.HA_LS.setItem("envs_mode","kid:henry"); w.envsApplyLogin(L2);
  ok("envs_mode = kid:henry → Henry's view, role still parent, sid = Henry's", w._envs.kidMode==="henry"&&w._envs.kid==="henry"&&w._envs.sid==="park_henry"&&w._envs.role==="parent");
  w.HA_LS.setItem("envs_kid_pick","ada"); w.envsApplyLogin(L2);
  ok("the mode wins over the CPSIBLINGS pick", w._envs.kid==="henry"&&w._envs.kidMode==="henry");
  w.HA_LS.setItem("envs_mode","kid:maya"); w.envsApplyLogin(L2);
  ok("a mode naming a kid not on this login is ignored", w._envs.kidMode==="");
  w.HA_LS.setItem("envs_mode","kid:ada"); w.envsApplyLogin(L1);
  ok("one-kid parent: kid:ada → Ada's view", w._envs.kidMode==="ada"&&w._envs.kid==="ada");
  w.envsApplyLogin({role:"kid",familyId:"park",kid:"ada",cid:"ms1"});
  ok("a KID login on that device never takes the mode", w._envs.kidMode===""&&w._envs.role==="kid");
  w.envsApplyLogin(Object.assign({},L2,{kidSwap:false}));
  ok("logins/<uid>/kidSwap false → _envs.kidSwap false", w._envs.kidSwap===false); }

// ── parent page: Go to + the switch ──
{ const w=world({fam:FAM}); w.envsApplyLogin(L2); w._envs.view="home"; w._envs.kidNames={henry:"Henry P."};
  const h=w.envsParentHtml();
  ok("parent page: Go to Ada + Go to Henry top right (in the bar), no 👩 Parent", /envs-mode/.test(h)&&/envsGoKid\('ada'\)">Go to Ada</.test(h)&&/envsGoKid\('henry'\)">Go to Henry P\.</.test(h)&&!/envsParentAsk/.test(h)&&h.indexOf("envs-mode")<h.indexOf("envs-kids"));
  ok("…the CPSIBLINGS kid tabs are still there", /envs-kids/.test(h)&&/envsPickKid\('henry'\)/.test(h));
  ok("…and the switch: 'Kids can switch to each other without my password' with On marked", /Kids can switch to each other without my password/.test(h)&&/class="on" aria-pressed="true" onclick="envsSetKidSwap\(true\)">On/.test(h));
  w.envsApplyLogin(L1); ok("one kid → no switch (nothing to switch between), still Go to Ada", !/envs-swap/.test(w.envsParentHtml())&&/Go to Ada/.test(w.envsParentHtml()));
  w.envsApplyLogin(L2);
  const r=w.envsGoKid("henry");
  ok("Go to Henry: stores envs_mode=kid:henry (+ the pick) and reloads", r===true&&w.HA_LS.getItem("envs_mode")==="kid:henry"&&w.HA_LS.getItem("envs_kid_pick")==="henry"&&w.G.reloads===1);
  ok("Go to a stranger → nothing", w.envsGoKid("maya")===false&&w.G.reloads===1);
  ok("nothing written to any database by switching", w.G.writes.length===0); }

// ── the switch writes the parent's own row ──
{ const w=world({fam:FAM,auth:{uid:"UP",email:"mom@example.com"}}); w.envsApplyLogin(L2); w._envs.uid="UP"; w._envs.view="home";
  const r=w.envsSetKidSwap(false); await w.flush();
  ok("Off → set logins/UP/kidSwap = false, nothing else", r===true&&w.G.writes.length===1&&w.G.writes[0][0]==="set"&&w.G.writes[0][1]==="logins/UP/kidSwap"&&w.G.writes[0][2]===false, w.G.writes);
  ok("…the page shows Off marked", w._envs.kidSwap===false&&/class="on" aria-pressed="true" onclick="envsSetKidSwap\(false\)">Off/.test(w.envsParentHtml()));
  ok("tapping Off again writes nothing", w.envsSetKidSwap(false)===false&&w.G.writes.length===1);
  w.envsSetKidSwap(true); await w.flush();
  ok("On → logins/UP/kidSwap = true", w.G.writes.length===2&&w.G.writes[1][2]===true&&w._envs.kidSwap===true);
  w._envs.kidMode="ada"; ok("from kid view the switch cannot be changed", w.envsSetKidSwap(false)===false&&w.G.writes.length===2);
  w._envs.kidMode=""; w._envs.role="kid"; ok("a kid login cannot change it", w.envsSetKidSwap(false)===false); }
{ const w=world({fam:FAM,dry:true}); w.envsApplyLogin(L2); w._envs.uid="UP"; w.envsSetKidSwap(false); await w.flush();
  ok("dry run: no write", w.G.writes.length===0); }

// ── kid view: the page ──
{ const w=world({fam:FAM}); w.HA_LS.setItem("envs_mode","kid:ada"); w.envsApplyLogin(L2); w.tab="envsite"; w._envs.view="study"; w._envs.kidNames={henry:"Henry P."};
  w.renderAll(); const h=w.G.content;
  ok("kid view renders the KID's page (study screen, 🎮 Games, Scores) for Ada", /fake-study/.test(h)&&/STUDY ada/.test(h)&&/Games/.test(h)&&/Scores/.test(h)&&!/How Ada is doing/.test(h)&&w.G.studyKid==="ada");
  ok("…with 👩 Parent and Go to Henry P. top right, no Go to Ada", /envsParentAsk\(\)/.test(h)&&/Go to Henry P\./.test(h)&&!/Go to Ada/.test(h));
  ok("…and no parent switch, no kid tabs", !/envs-swap/.test(h)&&!/envs-kids/.test(h));
  ok("role stays parent underneath", w._envs.role==="parent");
  w._envs.view="settings"; w.renderAll(); const st=w.G.content;
  ok("⚙️ in kid view: no Parent PIN card, no Sign out", !/Parent PIN/.test(st)&&!/envsSignOut/.test(st)&&/in Ada’s view/.test(st));
  w._envs.view="study";
  const r=w.envsGoKid("henry");
  ok("kid → kid (swap on): Go to Henry stores kid:henry and reloads, no password", r===true&&w.HA_LS.getItem("envs_mode")==="kid:henry"&&w.G.reloads===1);
  ok("Go to the kid already open → nothing", w.envsGoKid("ada")===false&&w.G.reloads===1);
  w._envs.kidSwap=false; w.renderAll();
  ok("swap OFF: only 👩 Parent shows, and Go to Henry is refused", !/Go to Henry/.test(w.G.content)&&/envsParentAsk/.test(w.G.content)&&w.envsGoKid("henry")===false&&w.G.reloads===1); }
{ const w=world({fam:FAM}); w.envsApplyLogin({role:"kid",familyId:"park",kid:"ada",cid:"ms1"}); w.tab="envsite"; w._envs.view="study"; w.renderAll(); const h=w.G.content;
  ok("a REAL kid login: the kid page with no 👩 Parent and no Go to", /fake-study/.test(h)&&!/envsParentAsk/.test(h)&&!/envsGoKid/.test(h)&&!/envs-mode/.test(h));
  ok("…the prompt cannot open, the check refuses, Go to refuses", w.envsParentAsk()===false&&w.envsGoKid("ada")===false);
  ok("…its ⚙️ still has Sign out", (w._envs.view="settings",w.renderAll(),/envsSignOut/.test(w.G.content)));
  const p=await w.envsParentCheck("x"); ok("…envsParentCheck resolves false", p===false); }

// ── the body class and the gate route ──
{ const w=world({fam:FAM,auth:{uid:"u1",email:"p@example.com"},remote:{"logins/u1":{role:"parent",familyId:"park",kid:"ada",cid:"ms1",kids:{henry:true}}}});
  w.HA_LS.setItem("envs_mode","kid:henry"); w.envSiteGate({uid:"u1",email:"p@example.com"},()=>{}); await w.flush();
  ok("the gate on a device in kid mode: body env-role-parent (the login) + env-kidmode, Henry's sid, masteryKid henry, role parent", w.G.body.classList.contains("env-role-parent")&&w.G.body.classList.contains("env-kidmode")&&w._envs.sid==="park_henry"&&w.masteryKid==="henry"&&w._envs.role==="parent");
  ok("…the mirror is pointed at the parent's kids, as for the parent's own pick", JSON.stringify(w.G.fam.envirothon.kids)===JSON.stringify(["ada","henry"])&&w.G.fam.envirothon.familyId==="park"); }

// ── 👩 Parent: the password ──
{ const w=withProvider(world({fam:FAM,auth:parentAuth("s3cret")})); w.HA_LS.setItem("envs_mode","kid:ada"); w.envsApplyLogin(L2);
  ok("the prompt opens in kid view (its own layer on <body>, a password field)", w.envsParentAsk()===true&&w._envs.pwOpen===true&&w.G.created.some(e=>e.id==="envs-pw"&&/type="password"/.test(e.innerHTML)&&!/current-password/.test(e.innerHTML)));
  const bad=await w.envsParentCheck("nope");
  ok("wrong password → false, toast 'That's not it', still in kid view, the mode kept, no reload", bad===false&&w._envs.kidMode==="ada"&&w.HA_LS.getItem("envs_mode")==="kid:ada"&&w.G.reloads===0);
  const empty=await w.envsParentCheck(""); ok("empty → false, Firebase not asked", empty===false&&w.G.auth.tries.length===1);
  const good=await w.envsParentCheck("s3cret");
  ok("right password → reauthenticate with the parent's email, envs_mode cleared, reload to the parent page", good===true&&w.G.auth.tries[1].e==="mom@example.com"&&w.HA_LS.getItem("envs_mode")===null&&w.G.reloads===1);
  ok("the password is never written or stored (HA_LS, DB)", !JSON.stringify(w.HA_LS.s).includes("s3cret")&&!JSON.stringify(w.G.writes).includes("s3cret")&&!JSON.stringify(w._envs).includes("s3cret")); }
{ const w=withProvider(world({fam:FAM,auth:parentAuth("s3cret")})); w.HA_LS.setItem("envs_mode","kid:ada"); w.envsApplyLogin(L2);
  w.el("envs-pw-in","s3cret"); w.el("envs-pw-b"); w.envsParentSubmit(null);
  ok("submit clears the field at once (before Firebase answers)", w.G.els["envs-pw-in"].value===""&&w.G.els["envs-pw-b"].disabled===true);
  await w.flush(); ok("…and the right password goes back to the parent page", w.G.reloads===1&&w.HA_LS.getItem("envs_mode")===null);
  w.el("envs-pw-b"); w._envs.kidMode="ada"; w.HA_LS.setItem("envs_mode","kid:ada"); w.el("envs-pw-in","wrong"); w.envsParentSubmit(null); await w.flush();
  ok("a wrong one re-enables the button and stays", w.G.els["envs-pw-b"].disabled===false&&w.G.reloads===1&&w.HA_LS.getItem("envs_mode")==="kid:ada"); }
{ const w=withProvider(world({fam:FAM,auth:null})); w.HA_LS.setItem("envs_mode","kid:ada"); w.envsApplyLogin(L2);
  ok("no signed-in user (session lost) → false, stays in kid view", (await w.envsParentCheck("s3cret"))===false&&w.G.reloads===0); }
{ const w=withProvider(world({fam:FAM,auth:parentAuth("s3cret")})); w.envsApplyLogin(L2);
  ok("on the parent page (no kid view) the prompt and the check refuse", w.envsParentAsk()===false&&(await w.envsParentCheck("s3cret"))===false&&w.G.auth.tries.length===0); }

// ── sign out forgets the kid view ──
{ const w=world({fam:FAM}); w.HA_LS.setItem("envs_mode","kid:ada"); w.envsApplyLogin(L2); w.envsSignOut();
  ok("Sign out clears envs_mode", w.HA_LS.getItem("envs_mode")===null&&w.G.signedOut===true); }

// ── demo: buttons and switching without Firebase ──
{ const w=world({fam:FAM,search:"?demo=1&role=parent"}); w.envSiteDemoBoot(); w.renderAll();
  ok("demo parent page: Go to Maya top right", /envsGoKid\('maya'\)">Go to Maya</.test(w.G.content));
  ok("demo: Go to Maya switches in memory to Maya's kid page, no reload", w.envsGoKid("maya")===true&&w._envs.kidMode==="maya"&&w.G.reloads===0&&(w.renderAll(),/fake-study|Your cards are on their way/.test(w.G.content))&&/envsParentAsk/.test(w.G.content));
  ok("demo: 👩 Parent prompt opens; any password goes back (demo toast), no Firebase", w.envsParentAsk()===true&&(await w.envsParentCheck("x"))===true&&w._envs.kidMode===""&&w.G.reloads===0&&w.G.signins.length===0);
  w.renderAll(); ok("…back on the demo parent page", /Go to Maya/.test(w.G.content)&&!/envsParentAsk/.test(w.G.content));
  w.envsGoKid("maya"); w.envsDemoGo("teacher"); ok("switching the demo role leaves kid view", w._envs.kidMode==="");
  ok("demo: nothing written", w.G.writes.length===0); }

// ── scope: Howe / DeWalt / Burris untouched ──
{ const w=world({fam:{familyId:"howe",roster:[]}});
  ok("no edition: no buttons, no switch, no prompt, Go to refused", w.envsModeBtnsHtml()===""&&w.envsKidSwapHtml()===""&&w.envsParentAsk()===false&&w.envsGoKid("ada")===false&&w.G.created.length===0&&w.G.reloads===0);
  w.HA_LS.setItem("envs_mode","kid:ada"); ok("…a stray envs_mode does nothing either (the site's gate never runs)", w.envSiteGate({uid:"u"},()=>{})===false&&w.G.reads.length===0); }

// ── the rules ──
{ const R=JSON.parse(fs.readFileSync(path.join(__dirname,"envirothon/SITE_RULES.json"),"utf8")); const L=R.rules.logins.$uid;
  ok("rules: logins/$uid/kidSwap — its own uid writes it, boolean only", L.kidSwap&&L.kidSwap[".write"]==="auth != null && auth.uid == $uid"&&L.kidSwap[".validate"]==="newData.isBoolean()");
  ok("rules: no $other under logins/$uid (an extra child is allowed); the row's .validate unchanged", !("$other" in L)&&/hasChildren\(\['role','familyId','kid'\]\)/.test(L[".validate"]));
  ok("_about notes CPKIDMODE (2026-11-10)", /CPKIDMODE \(2026-11-10\)/.test(R._about)); }

// ── the block ──
{ const i=src.indexOf("// CPKIDMODE_START"), j=src.indexOf("// CPKIDMODE_END"), e=src.indexOf("// ENVSITE_END");
  ok("the block sits inside ENVSITE (ships with the class site)", i>0&&j>i&&e>j&&src.indexOf("// ENVSITE_START")<i);
  const B=src.slice(i,j); ok("the block never logs or stores the password", !/console\.(log|error|warn)\([^)]*pw/.test(B)&&!/setItem\([^)]*pw/.test(B)); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
