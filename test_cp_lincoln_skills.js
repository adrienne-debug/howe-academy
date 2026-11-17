/*
 * Node tests — 🧩 CPLINCOLNSKILLS, the skills on Lincoln's own 🌿 Study page in the family app (2026-11-17). Her words: "we need the
 * skills built stat", after "also skills are not on lincolns study page correct?". Plan B of PLAN_cp_lincoln_parity_2026-10-29.md, slice 1.
 *   · where the block sits (classes.js right after CPMYCLASS, its marker in index.html), its three typeof-guarded hook lines, ONE read, no write
 *   · who: a mirrored kid, the class link on, his class's skills layer answered, on his own 📚 Study page — "" / false / null for every
 *     other kid, session, page and family (the page byte for byte as before), and nothing changes on the class site
 *   · the door: the skills of the sections that are out to him, his class's Hide / Make optional applied; a refused read = the unit's own
 *   · all 13 skills of the NC Envirothon unit open and make a problem with the repo pictures
 *   · a whole sitting: 👀 → ✍️, ONE write on the family's mastery — exactly <kid>_skills/<unit>/<skill> + studyLog/<kid>/skills/<day>;
 *     ?dryrun=1 writes nothing; the mirror's summary gets summary.skills; "skills learned N of M" on his My scores rows
 *   · not in this slice: the final never waits for skills here, 🚩 Flag it stays off, no class photo layer is read
 * Uses the world from test_env_site.js as Howe with the class link.                                run: node test_cp_lincoln_skills.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const raw=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"), CJS=fs.readFileSync(path.join(__dirname,"classes.js"),"utf8"), EJS=fs.readFileSync(path.join(__dirname,"env.js"),"utf8");
const LK=cut("// CPLINCOLNSKILLS_START","// CPLINCOLNSKILLS_END"), LN=cut("// CPLINCOLN_START","// CPLINCOLN_END"), MC=cut("// CPMYCLASS_START","// CPMYCLASS_END"), PTS=cut("// CPPOINTS_START","// CPPOINTS_END");
const PHO=cut("// CPPHOTOS_START","// CPPHOTOS_END"), SKL=cut("// CPSKILL_START","// CPSKILL_END");
const ITEMS=["CPITEMGEAR","CPITEMBIOTIC","CPITEMTRIANGLE","CPITEMLABEL","CPITEMID","CPITEMSCALE"].map(n=>cut("// "+n+"_START","// "+n+"_END"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const UNIT=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const T="🧩 CPLINCOLNSKILLS", K="lincoln", CIDX="c1", DAY="20261028";
const fb=k=>k.replace(/\./g,":");

console.log("── the block, where it sits, how it is hooked ──");
{ ok("one CPLINCOLNSKILLS block in classes.js, right after CPMYCLASS_END; none in index.html", CJS.indexOf("// CPMYCLASS_END\n// CPLINCOLNSKILLS_START")>0&&CJS.split("// CPLINCOLNSKILLS_START").length===2&&raw.indexOf("// CPLINCOLNSKILLS_START")<0);
  ok("its marker in index.html right after CPMYCLASS's", raw.indexOf("// ⇢ classes.js: CPMYCLASS\n// ⇢ classes.js: CPLINCOLNSKILLS\n")>0);
  ok("the header has her words, the date, the plan, and what is NOT in this slice", /2026-11-17/.test(LK.slice(0,300))&&/we need the skills built stat/.test(LK)&&/PLAN_cp_lincoln_parity_2026-10-29\.md/.test(LK)&&/NOT HERE/.test(LK)&&/skillsForFinal/.test(LK)&&/Plan D/.test(LK));
  ok("the block only declares (nothing runs at load)", LK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const code=LK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing: no set / update / remove / transaction / push, no db, no envsWrite, no storage", !/\.(set|update|remove|transaction|push)\(|\bdb\b|envsWrite\(|envcWrite\(|bankDirect\(|HA_LS|localStorage|sessionStorage/.test(code));
  ok("its only read is ONE once(\"value\") on classSkills/<cid>, through the mirror's app", (code.match(/\.once\(/g)||[]).length===1&&(code.match(/\.ref\(/g)||[]).length===1&&/edb\.ref\("classSkills\/"\+cid\)\.once\("value"/.test(code)&&!/\.on\(/.test(code)&&!/firebase/.test(code));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(LK)&&LK.indexOf("\u{1F500}")<0);
  const hooks=(raw+"\n"+EJS).split("\n").filter(l=>/\bcplk\w+\(/.test(l)&&!/^\s*\/\//.test(l));
  ok("three hook lines outside classes.js, each typeof-guarded and tagged "+T, hooks.length===3&&hooks.every(l=>l.indexOf(T)>=0&&(l.match(/cplk\w+(?=\()/g)||[]).every(f=>new RegExp("typeof "+f+"===\"function\"").test(l))), hooks.map(l=>l.trim().slice(0,90)));
  const R=fn("renderMastStudy");
  ok("…renderMastStudy: a running skill sitting takes the page, right after ID Flash's own line", /envFlashRunningHtml\(kid\); if\(_ef\) return h\+_ef; \}[^\n]*\n  if\(typeof cplkRunHtml==="function"\)\{ const _sk=cplkRunHtml\(kid\); if\(_sk\) return h\+_sk; \}/.test(R));
  ok("…renderMastStudy: the door under the 🌿 start, never under a running card sitting, right above My class", /\n  if\(!running&&typeof cplkDoorHtml==="function"\) h\+=cplkDoorHtml\(kid,session\);[^\n]*\n  if\(!running&&typeof cpMyClassHtml==="function"\)/.test(R));
  ok("…envmRelAttach: the layer read with the mirror's other class reads", /if\(typeof cplkLoad==="function"\) cplkLoad\(kid,cid,_envm\.edb\);/.test(fn("envmRelAttach")));
  const inCls=CJS.replace(LK,"").split("\n").filter(l=>/\bcplk\w+\(/.test(l)&&!/^\s*\/\//.test(l));
  ok("inside classes.js the engine asks this block in four typeof-guarded lines (cpskOn, cpskListFor, cpSkillKidOn, cpPhotos)", inCls.length===4&&inCls.every(l=>(l.match(/cplk\w+(?=\()/g)||[]).every(f=>new RegExp("typeof "+f+"===\"function\"").test(l)))&&["function cpskOn(","function cpskListFor(","function cpSkillKidOn(","if(!cpphSite()&&"].every(a=>inCls.some(l=>l.trim().indexOf(a)===0)), inCls.map(l=>l.trim().slice(0,70)));
  const names=(LK.match(/^(?:function|const) (\w+)/gm)||[]).map(x=>x.split(" ")[1]), rest=src.replace(LK,"");
  ok("none of its top-level names is declared anywhere else (one global scope)", names.length===9&&names.every(n=>!new RegExp("(function|const|let|var)\\s+"+n+"\\b").test(rest)), names);
  ok("CPSKILL still has its one write and its one read (the save is the engine's own, nothing new)", (SKL.replace(/^\/\/.*$/mg,"").match(/\.update\(|\.set\(|\.remove\(/g)||[]).length===1&&/db\.ref\("mastery"\)\.update\(upd\)/.test(SKL));
  ok("🚩 Flag it stays the class site's (cpflKidOn asks envSiteOn)", /function cpflKidOn\(\)\{ try\{ return typeof envSiteOn==="function"&&envSiteOn\(\)&&/.test(src));
  ok("the final's hold reads the class site's own plan (_envs.cls.plan) — not his class layer", /const P=\(_envs\.cls&&_envs\.cls\.plan&&_envs\.cls\.plan\[section\]\)\|\|null; if\(!P\|\|P\.skillsForFinal!==true\) return null;/.test(fn("cpskFinalMissing"))); }

// ── the world: Howe with the class link (ENVMIRROR, ENVSITE, CPUNIT … from the harness) + CPLINCOLN, CPMYCLASS (its cpmcStudyPage), CPPHOTOS,
//    CPSKILL, the six item types and this block; ENVIDFLASH's picture index is the repo's real one
const FAM={familyId:"howe",roster:[],envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:CIDX}};
const STUBS='var kcPlay=null; function envPicsIndex(){ return G.pics||null; } function envPicsLoad(){ G.picLoads=(G.picLoads||0)+1; return Promise.resolve(G.pics); }';
const XS="\nG.lk={ _cplk, _cpln, _cpsk, _cpph, cplkKidOn, cplkAny, cplkOpts, cplkLoad, cplkPage, cplkRunHtml, cplkDoorHtml, cplnOn, cpskOn, cpskListFor, cpSkillList, cpSkillKidOn, cpSkillsFor, cpSkillOpen, cpSkillPick, cpSkillInput, cpSkillStep, cpSkillCheckTry, cpSkillNextTry, cpSkillQuit, cpSkillFinish, cpSkillSittingHtml, cpSkillDoorHtml, cpSkillSummary, cpSkillPaceLine, cpSkillFinalWait, cpPhotos, envSummary, envmRelAttach, envMirrorOn, envsStations, CPSK_TYPES, CPSK_SITTING, ENV_DECKS, ENV_UNIT_ID, ENV_SESSION_SID, get kcPlay(){ return kcPlay; }, set kcPlay(v){ kcPlay=v; } };";
const REV=[LN,PTS,MC,LK,PHO,SKL].concat(ITEMS).concat([STUBS,XS]).join("\n");
const REV0=[LN,PTS,MC,PHO,SKL].concat(ITEMS).concat([STUBS,XS.replace("cplkKidOn, cplkAny, cplkOpts, cplkLoad, cplkPage, cplkRunHtml, cplkDoorHtml, ","").replace("_cplk, ","")]).join("\n");   // the control: the same world without this block
function W(o){ o=o||{};
  const w=world(Object.assign({fam:JSON.parse(JSON.stringify(o.fam||FAM)),rev:o.noBlock?REV0:REV,unitStudies:{},masteryData:{},dry:!!o.dry,unitsReady:true},o.w||{}));
  const m=w.G.lk; w.m=m; w.G.pics=o.pics===false?null:PICS;
  const decks=m.ENV_DECKS.map(d=>({key:d[0],stage:d[2],station:d[3],n:d[5]}));
  w.unitStudies[m.ENV_UNIT_ID]={id:m.ENV_UNIT_ID,decks:decks,enrolled:{lincoln:true}};
  // his cards: every deck in; `held` stations keep their holds (not sent out yet)
  const held=o.held||["cei"], hold={}; decks.forEach(d=>{ if(held.indexOf(d.station)>=0) hold[d.key]=true; });
  w.masteryData.lincoln=decks.map((d,i)=>({id:"i"+i,subject:d.key,prompt:"card "+i,tier:"daily",status:"active"}));
  w.masteryData.lincoln_settings={cat_hold:hold};
  w.masteryData.ellis=[{id:"e1",subject:"Latin",prompt:"amo",tier:"daily",status:"active"}];
  w._envm.app={name:"envirothon"};   // the mirror's named app is already up, as on a running device (envmReady keeps the edb below)
  if(o.signedIn!==false) w._envm.user={uid:"u1",email:"mom@x"};
  w._envm.classOf.lincoln=CIDX;
  if(o.link!==false) m._cpln.kids.lincoln={cid:CIDX,sid:"howe_lincoln",cls:{},plan:o.plan||{},stu:{},ok:true};
  if(o.page!==false) m.kcPlay={who:"lincoln",mode:"drills",from:"corner"};
  // the mirror's app: reads recorded, classSkills answered (or refused), every write recorded apart from the family's own
  w.E={once:[],on:[],writes:[]};
  w._envm.edb={ref:p=>({ on(ev,f,bad){ w.E.on.push(p); }, off(){},
    once(ev,f,bad){ w.E.once.push(p); if(p==="classSkills/"+CIDX){ if(o.refuse){ if(bad) bad(new Error("permission_denied")); return; } if(o.pending) return; f({val:()=>(o.layer===undefined?null:o.layer)}); return; } f({val:()=>null}); },
    set(v){ w.E.writes.push(["set",p,v]); return Promise.resolve(); }, update(v){ w.E.writes.push(["update",p,v]); return Promise.resolve(); }, remove(){ w.E.writes.push(["remove",p]); return Promise.resolve(); }, transaction(){ w.E.writes.push(["transaction",p]); } })};
  w.initFb();   // db = the family's own instance (every write lands in w.G.writes)
  if(o.attach!==false&&!o.noBlock) m.cplkLoad(K,CIDX,w._envm.edb);
  return w; }
const ENV={sid:"envirothon",name:"Envirothon",emoji:"🌿"};
const rows=h=>(h.match(/cpSkillOpen\('lincoln','([^']+)'\)/g)||[]).map(x=>/,'([^']+)'\)/.exec(x)[1]);
const SK=UNIT.skills, bySec=s=>SK.filter(x=>x.section===s).map(x=>fb(x.key)).sort();

console.log("\n── who gets the skills ──");
{ const w=W(), m=w.m;
  ok("the world is Howe, not the class site", w.envSiteOn()===false&&m.ENV_SESSION_SID===ENV.sid);
  ok("a mirrored kid, the class link on, the layer answered → on", m.cplkKidOn(K)===true&&m.cplkAny()===true&&m.cpskOn()===true&&m.cpSkillKidOn(K)===true);
  ok("…the layer was read ONCE, on the mirror's app, at classSkills/<cid>", w.E.once.filter(p=>p==="classSkills/c1").length===1&&w.G.reads.indexOf("classSkills/c1")<0);
  ok("…asking again for the same class reads nothing more", m.cplkLoad(K,CIDX,w._envm.edb)===false&&w.E.once.filter(p=>p==="classSkills/c1").length===1);
  ok("envmRelAttach's own line asks for it (the real hook)", (()=>{ const x=W({attach:false}); const before=x.m.cplkKidOn(K); x.m.envmRelAttach(K); return before===false&&x.E.once.indexOf("classSkills/c1")>=0&&x.m.cplkKidOn(K)===true; })());
  ok("the layer not answered yet → off (no door flashes skills the teacher hid)", (()=>{ const x=W({pending:true}); return x.m.cplkKidOn(K)===false&&x.m.cpskOn()===false&&x.m.cplkDoorHtml(K,ENV)===""; })());
  ok("a refused read → on, with no layer (the unit's own skills)", (()=>{ const x=W({refuse:true}); return x.m.cplkKidOn(K)===true&&JSON.stringify(x.m.cplkOpts(K).layer)==="{}"&&x.m.cpskListFor(K).length===13; })());
  const off=(o,kid)=>{ const x=W(o), k=kid||K; if(kid) x.m.kcPlay={who:kid,mode:"drills",from:"corner"};
    return x.m.cplkKidOn(k)===false&&x.m.cplkDoorHtml(k,ENV)===""&&x.m.cplkRunHtml(k)===""&&x.m.cpSkillsFor(k).length===0&&x.m.cpSkillOpen(k,"aquatics:biotic_index")===false&&x.m.cpSkillSummary(k,x.masteryData,1)===null; };
  ok("the class link not in (his class reads not arrived) → nothing", off({link:false}));
  ok("signed out of the class link → nothing", off({signedIn:false}));
  ok("a family with no class link (DeWalt, Burris) → nothing, and cpskOn stays false", off({fam:{familyId:"dewalt",roster:[]}})&&W({fam:{familyId:"dewalt",roster:[]}}).m.cpskOn()===false);
  ok("another Howe kid (not mirrored) → nothing, even while Lincoln's are on", off({},"ellis"));
  { const x=W(); x.m._cpln.pause=1; ok("the class layer paused (cplnRaw, the editors) → nothing", x.m.cplkKidOn(K)===false&&x.m.cpskOn()===false&&x.m.cplkDoorHtml(K,ENV)===""); }
  { const x=W({fam:{familyId:"envirothon",edition:"envirothon",roster:[]},w:{}}); ok("the class site itself: this block says no and reads nothing (the site's own skills are CPSKILL's, unchanged)", x.envSiteOn()===true&&x.m.cplkKidOn(K)===false&&x.m.cplkAny()===false&&x.m.cplkOpts(K)===null&&x.E.once.indexOf("classSkills/c1")<0&&x.m.cplkLoad(K,CIDX,x._envm.edb)===false); } }

console.log("\n── the door on his 🌿 Study page ──");
{ const w=W(), m=w.m, h=m.cplkDoorHtml(K,ENV);
  ok("the class site's own 🧩 Skills door", /🧩 Skills/.test(h)&&/First you watch one worked out/.test(h));
  ok("…one row per skill of the sections that are out to him (CEI held: it has none anyway) — all 13", rows(h).length===13&&rows(h).slice().sort().join()===SK.map(s=>fb(s.key)).sort().join(), rows(h));
  ok("…in section order: forestry, soils, aquatics, wildlife", (()=>{ const ord=["forestry","soils","aquatics","wildlife"], secOf=f=>SK.find(s=>fb(s.key)===f).section, seq=rows(h).map(secOf); return seq.every((s,i)=>i===0||ord.indexOf(seq[i-1])<=ord.indexOf(s)); })());
  ok("…a new skill says it starts with a worked example and has a Go button", /New · starts with a worked example/.test(h)&&/>Go<\/button>/.test(h));
  { const x=W({held:["cei","wildlife","soils"]}), r=rows(x.m.cplkDoorHtml(K,ENV)); ok("a section not sent out to him yet (every deck held) shows no skill: Wildlife and Soils held → 10 rows", r.length===10&&r.every(f=>!/^(wildlife|soils):/.test(f)), r); }
  { const x=W({held:["general","forestry","soils","aquatics","wildlife","cei"]}); ok("nothing out to him yet → no door at all", x.m.cplkDoorHtml(K,ENV)===""); }
  { const x=W({layer:{"aquatics:bugs":{hide:true,by:"t",ts:1},"forestry:biltmore":{core:false,by:"t",ts:1}}}), r=rows(x.m.cplkDoorHtml(K,ENV)), L=x.m.cpskListFor(K);
    ok("his class's layer: a skill the teacher hid is gone, one she made optional is no longer core", r.length===12&&r.indexOf("aquatics:bugs")<0&&L.find(s=>s.fb==="forestry:biltmore").core===false&&L.find(s=>s.fb==="forestry:tools").core===true); }
  ok("another session (Daily Mix) → \"\"", m.cplkDoorHtml(K,{sid:"daily_mix",name:"Daily Mix"})==="");
  { const x=W({page:false}); ok("Mom's Mastery tab (not his own 📚 Study page) → \"\"", x.m.cplkDoorHtml(K,ENV)===""&&x.m.cplkRunHtml(K)===""); }
  { const x=W(); x.m.kcPlay={who:K,mode:"games",from:"corner"}; ok("…nor his Games page → \"\"", x.m.cplkDoorHtml(K,ENV)===""); }
  ok("the class site's toast style is put on the page once (envsCss)", w.G.created.filter(e=>e&&e.id==="envs-css").length===1);
  { const x=W({pics:false}); x.m.cplkDoorHtml(K,ENV); x.m.cplkDoorHtml(K,ENV); ok("the picture index not in yet → asked for ONCE; already in → never asked", x.G.picLoads===1&&!w.G.picLoads); }
  // renderMastStudy's own two lines: h + "" === h — the page is byte for byte what it was
  const R=fn("renderMastStudy").split("\n"), l1=R.find(l=>/cplkRunHtml/.test(l)).replace(/\/\/.*$/,""), l2=R.find(l=>/cplkDoorHtml/.test(l)).replace(/\/\/.*$/,"");
  const page=(mm,kid,running)=>{ const cplkRunHtml=mm.cplkRunHtml, cplkDoorHtml=mm.cplkDoorHtml, session=ENV; let h="<div>START</div>"; const f=new Function("h","kid","session","running","cplkRunHtml","cplkDoorHtml",l1.replace("return h+_sk;","return \"RUN:\"+_sk;")+"\n"+l2+"\nreturn h;"); return f(h,kid,session,running,cplkRunHtml,cplkDoorHtml); };
  ok("renderMastStudy's lines: skills off (another kid, no link, signed out, Mom's tab) → the same HTML, byte for byte", page(W().m,"ellis",false)==="<div>START</div>"&&page(W({link:false}).m,K,false)==="<div>START</div>"&&page(W({signedIn:false}).m,K,false)==="<div>START</div>"&&page(W({page:false}).m,K,false)==="<div>START</div>");
  ok("…on for him → the door is added under the start", page(m,K,false).indexOf("<div>START</div>")===0&&/🧩 Skills/.test(page(m,K,false)));
  ok("…a card sitting running → no door", page(m,K,true)==="<div>START</div>");
  ok("the block missing (classes.js not loaded yet): both lines are typeof-guarded → the page as before", (()=>{ const f=new Function("h","kid","session","running",l1+"\n"+l2+"\nreturn h;"); return f("<div>START</div>",K,ENV,false)==="<div>START</div>"; })()); }

console.log("\n── every skill of the unit opens and makes a problem ──");
{ const w=W(), m=w.m; let bad=[], pic=0, noPic=[];
  SK.forEach((s,i)=>{ const f=fb(s.key); const opened=m.cpSkillOpen(K,f,1000+i); const r=m._cpsk.run; const h=opened?m.cplkRunHtml(K):"";
    if(!opened||!r||!r.prob||!r.prob.steps.length||h.length<200||h.indexOf(s.label.replace(/&/g,"&amp;"))<0) bad.push(s.key);
    if(/<img /.test(h)) pic++; else if(s.type==="id") noPic.push(s.key);
    m.cpSkillQuit(); });
  ok("all 13 open, make a problem, and draw the class site's sitting", bad.length===0&&SK.length===13, bad);
  ok("the picture skills draw a repo picture (envirothon/pics — the set ID Flash shows)", pic>=5&&noPic.length===0, {pic,noPic});
  ok("…quitting before a try writes nothing and leaves no sitting", w.G.writes.length===0&&w.E.writes.length===0&&m._cpsk.run===null);
  const P=m.cpPhotos("Mayfly nymph");
  ok("cpPhotos gives him the repo set only", P.length>0&&P.every(p=>p.from==="repo"&&/^envirothon\/pics\//.test(p.url)), P.slice(0,2));
  ok("…and still nothing for a family with no class link, or with his link off", W({fam:{familyId:"dewalt",roster:[]}}).m.cpPhotos("Mayfly nymph").length===0&&W({link:false}).m.cpPhotos("Mayfly nymph").length===0);
  ok("a skill that isn't in his list (hidden by the teacher) doesn't open", (()=>{ const x=W({layer:{"aquatics:bugs":{hide:true,by:"t",ts:1}}}); return x.m.cpSkillOpen(K,"aquatics:bugs")===false&&x.m._cpsk.run===null; })()); }

console.log("\n── a whole sitting: one write, on the family's own mastery ──");
const FBX="aquatics:biotic_index";
function sit(w,n){ const m=w.m; m.cpSkillOpen(K,FBX,4242);
  for(let t=0;t<(n||m.CPSK_SITTING)&&m._cpsk.run&&!m._cpsk.run.done;t++){ const r=m._cpsk.run, n0=r.tries.length;
    if(r.stage==="shown"){ for(let i=0;i<40&&m._cpsk.run&&!m._cpsk.run.done&&m._cpsk.run.tries.length===n0;i++) m.cpSkillStep(); }
    else { r.prob.steps.forEach((st,i)=>{ if(i>=r.from) (st.kind==="pick"?m.cpSkillPick:m.cpSkillInput)(i,String(st.answer)); }); m.cpSkillCheckTry(); m.cpSkillNextTry(); } }
  return m._cpsk.run; }
{ const w=W(), m=w.m; m.cpSkillOpen(K,FBX,4242);
  const h0=m.cplkRunHtml(K);
  ok("Go → the sitting takes his page: 👀 Watch it, try 1 of 6", /Watch it/.test(h0)&&/try 1 of 6/.test(h0)&&/Next step/.test(h0));
  ok("…nothing is written while he works", w.G.writes.length===0);
  { const x=W({page:false}); x.m.kcPlay={who:K,mode:"drills"}; x.m.cpSkillOpen(K,FBX,1); x.m.kcPlay=null; ok("…on Mom's Mastery tab his running sitting does not take the page", x.m.cplkRunHtml(K)===""&&!!x.m._cpsk.run); }
  { const x=W(); x.m.cpSkillOpen(K,FBX,1); ok("…and it never shows on another kid's page", x.m.cplkRunHtml("ellis")===""); }
  const r=sit(w);
  ok("six tries: two worked examples, then he finishes the last steps (✍️)", !!r&&!!r.done&&r.done.tries===6&&r.done.shown===2&&r.done.kidN===4&&r.done.correct===4, r&&r.done&&{tries:r.done.tries,shown:r.done.shown,kidN:r.done.kidN,correct:r.done.correct});
  ok("ONE write, an update on the family's mastery", w.G.writes.length===1&&w.G.writes[0][0]==="update"&&w.G.writes[0][1]==="mastery", w.G.writes.map(x=>[x[0],x[1]]));
  const upd=(w.G.writes[0]||[])[2]||{}, keys=Object.keys(upd).sort();
  ok("…exactly two targeted paths: lincoln_skills/nc_envirothon/<skill> and studyLog/lincoln/skills/<day>", keys.length===2&&keys[0]==="lincoln_skills/nc_envirothon/"+FBX&&keys[1]==="studyLog/lincoln/skills/"+DAY, keys);
  const st=upd["lincoln_skills/nc_envirothon/"+FBX]||{}, lg=upd["studyLog/lincoln/skills/"+DAY]||{};
  ok("…the skill's state (stage, the last tries) and the day's entry (4 graded tries, 2 worked examples)", ["shown","faded","solo"].indexOf(st.stage)>=0&&Array.isArray(st.tries)&&st.tries.length===6&&st.learned===false&&lg.total===4&&lg.correct===4&&lg.shown===2&&lg.items.length===4&&lg.items.every(i=>i.result==="c"&&i.deck==="skill:"+FBX));
  ok("…no key holds a character Firebase refuses", keys.every(k=>!/[.#$\[\]]/.test(k)));
  ok("the 🌿 session's own log is untouched (its own id, like ID Flash)", !((w.masteryData.studyLog||{}).lincoln||{}).envirothon);
  { const x=W(); sit(x); x.m.cpSkillQuit(); x.m.cpSkillOpen(K,FBX,99); const hx=x.m.cplkRunHtml(K);
    ok("a typed step has its own id, so the page's background redraws keep his cursor in the box (_preserveUI restores focus by id)", x.m._cpsk.run.stage==="solo"&&/<input id="cpsk-in-\d+" type="text"/.test(hx)&&(hx.match(/<input /g)||[]).length===(hx.match(/<input id="cpsk-in-\d+"/g)||[]).length, (hx.match(/<input [^>]{0,40}/g)||[]).slice(0,3)); }
  ok("the done screen, then Done → his page again with the skill moved on", /done for now/.test(m.cplkRunHtml(K))&&(m.cpSkillQuit(),m._cpsk.run===null)&&m.cplkRunHtml(K)===""&&/Finish it|On your own/.test(m.cplkDoorHtml(K,ENV)));
  // the mirror: summary.skills for him, and the "skills learned" line on his My scores rows
  const S=m.envSummary(K);
  ok("his mirror's summary now carries summary.skills (counts and codes only)", !!S.skills&&S.skills.aquatics.total===6&&S.skills.forestry.total===4&&S.skills.soils.total===2&&S.skills.wildlife.total===1&&S.skills.aquatics.learned===0&&["shown","faded","solo"].indexOf(S.skills.aquatics.stage[FBX])>=0&&S.skills.aquatics.stage["aquatics:bugs"]==="new", S.skills&&S.skills.aquatics);
  ok("…and the row line reads \"skills learned 0 of 6\"", m.cpSkillPaceLine(S,"aquatics")==="skills learned 0 of 6");
  ok("the class database gets nothing from the skills but the mirror's own publish: ONE update on students/<his id> (summary + meta), now with summary.skills", w.E.writes.length===1&&w.E.writes[0][0]==="update"&&w.E.writes[0][1]==="students/howe_lincoln"&&Object.keys(w.E.writes[0][2]).sort().join()==="meta,summary"&&!!w.E.writes[0][2].summary.skills&&w.E.writes[0][2].summary.skills.aquatics.total===6, w.E.writes.map(x=>[x[0],x[1],Object.keys(x[2]||{})]));
  ok("the control (the same world without this block): no summary.skills — what his mirror published until today", W({noBlock:true}).m.envSummary(K).skills===undefined);
  { const x=W(); ok("another kid's summary gets none", x.m.cpSkillSummary("ellis",x.masteryData,1)===null); } }

console.log("\n── learned takes two days ──");
{ const w=W(), m=w.m; let guard=0;
  while(guard++<12){ sit(w); m.cpSkillQuit(); const st=((w.masteryData.lincoln_skills||{}).nc_envirothon||{})[FBX]; if(st&&st.stage==="solo"&&st.tries.filter(t=>t.s==="solo"&&t.ok).length>=4) break; }
  const st1=w.masteryData.lincoln_skills.nc_envirothon[FBX];
  ok("many right tries on ONE day → 💪 On your own, not learned yet (the rule wants 2 days)", st1.stage==="solo"&&st1.learned===false, {stage:st1.stage,learned:st1.learned});
  w.G.now+=86400000; sit(w,1); m.cpSkillQuit();   // one try, then "Stop here (keeps what you did)"
  const st2=w.masteryData.lincoln_skills.nc_envirothon[FBX];
  ok("…a right try the next day → learned, a review comes back in 7 days", st2.learned===true&&st2.next>w.G.now&&Math.round((st2.next-st2.at)/86400000)===7, {learned:st2.learned,rev:st2.rev});
  ok("…the door says ✓ Learned, the summary counts it", /Learned · next review in 7 days/.test(m.cplkDoorHtml(K,ENV))&&m.envSummary(K).skills.aquatics.learned===1&&m.envSummary(K).skills.aquatics.stage[FBX]==="learned");
  ok("every save was the same two paths", w.G.writes.length>2&&w.G.writes.every(x=>x[0]==="update"&&x[1]==="mastery"&&Object.keys(x[2]).length===2&&Object.keys(x[2]).every(k=>k==="lincoln_skills/nc_envirothon/"+FBX||/^studyLog\/lincoln\/skills\/\d{8}$/.test(k)))); }

console.log("\n── ?dryrun=1 writes nothing ──");
{ const w=W({dry:true}), m=w.m, r=sit(w);
  ok("a whole sitting under dry run: scored on the page, NOTHING written anywhere", !!r&&!!r.done&&r.done.dry===true&&r.done.saved===false&&w.G.writes.length===0&&w.E.writes.length===0);
  ok("…and the done screen says so", /Dry run — scored here only, nothing saved/.test(m.cplkRunHtml(K))); }

console.log("\n── not in this slice ──");
{ const w=W({plan:{aquatics:{skillsForFinal:true},forestry:{skillsForFinal:true}}}), m=w.m;
  ok("the final never waits for skills here, even when his class's plan asks (its own piece)", m.cpSkillFinalWait(K,"aquatics")===false&&m.cpSkillFinalWait(K,"forestry")===false);
  ok("no class or unit photo layer is read through his mirror (Plan D)", w.E.once.every(p=>!/^(classPhotos|units\/[^/]+\/photos)/.test(p))&&m._cpph.kidC===null&&m._cpph.kidU===null);
  m.cpSkillOpen(K,FBX,7); for(let i=0;i<3;i++) m.cpSkillStep();
  ok("no 🚩 Flag it in his sitting", !/Flag it/.test(m.cplkRunHtml(K))); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
