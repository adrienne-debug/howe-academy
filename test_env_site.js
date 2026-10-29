/*
 * Node tests — 🌿 ENVSITE, step 4 of the Envirothon plan (PLAN_envirothon_2026-10-27.md; DESIGN_envirothon_console ✅ DECISIONS,
 * DESIGN_envirothon_micro_academy ✅ DECISIONS). Her words 2026-10-27/28: "I'm good with it all being on one page as long as I can
 * somehow protect my product" · "can i see the page before i set up the blaze".
 *   · No edition, no demo (Howe, DeWalt, Burris) → every hook target returns false/null at once: no element, no CSS, no listener,
 *     no write, no class on body — the boot is byte-identical. The blocks only declare; every hook line is typeof-guarded.
 *   · The router sends each role to its part and nothing else; the locked-season card; the auto-lock date logic (2027-04-24).
 *   · The teacher's + Student writes exactly the listed paths (and in demo nothing); the kid code → synthetic login is deterministic
 *     and no password is ever written anywhere but Auth; the send-out multi-path update shape; the team board math on a fixed sample;
 *     the rules file parses and names every node; every door the micro doc lists as off is unreachable under the edition.
 * Runs the real ENVSITE + ENVCONSOLE blocks (with ENVMIRROR's envSummary and ENVUNIT's constants) sliced from index.html in a fake
 * world. test_env_console.js requires this file for the same world.                                     run: node test_env_site.js
 */
// shared node harness for ENVSITE + ENVCONSOLE: the real blocks (+ ENVMIRROR for envSummary, ENVUNIT's constants) in a tiny fake world
const fs=require("fs"), path=require("path");
const REPO=__dirname;
const src=fs.readFileSync(path.join(REPO,"index.html"),"utf8");
function slice(a,b){ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("slice missing "+a); return src.slice(i,j+b.length); }
const SITE=slice("// ENVSITE_START","// ENVSITE_END"), CON=slice("// ENVCONSOLE_START","// ENVCONSOLE_END"), MIR=slice("// ENVMIRROR_START","// ENVMIRROR_END");
const CLS=slice("// ENVCLASSSET_START","// ENVCLASSSET_END");   // ⚙️ the class settings (2026-10-28): the console's panel + the kid's overlay
const CPS=slice("// CPSEATS_START","// CPSEATS_END");   // 🪑 Cards a sitting = Auto (2026-10-28): Days a card is learned, top value 200, the real-pace line
const CPC=slice("// CPCLASS_START","// CPCLASS_END");   // 🏫 the class record and its look (2026-10-28): the bars, 🏫 Class setup, + Class, the lock date
const CPU=slice("// CPUNIT_START","// CPUNIT_END");   // 📦 units as data (2026-10-28): HoweUnits, the catalog, a class's units, sections from the units, enroll per unit
const CORE=slice("// CPCORE_START","// CPCORE_END");   // ⭐ core cards first (2026-10-28): the "Core cards first" row + the two mstPile hooks — in the world only with o.cpcore
const CCS=slice("// CPCARDSSEE_START","// CPCARDSSEE_END");   // 📚 the cards browser, read-only (2026-10-28): 📚 Cards in the console
// o.envt: the station check-ins too (ENVTEST, + the forms on window.HoweEnvirothon = o.lib) — the demo's check-in rules (2026-10-28) —
// and the 🔊 read-aloud switch right after it (ENVREADALOUD; mastSpeak records into G.said)
const ENVT=slice("// ENVTEST_START","// ENVREADALOUD_END");
const UNIT=slice('const ENV_UNIT_ID="nc_envirothon";','const ENV_CARD_COUNT=ENV_DECKS.reduce((s,d)=>s+d[5],0);')+"\n"+slice("const ENV_SESSION_SID=","function envSessionRecord(u){")+'const r=Object.assign({},ENV_SESSION,{decks:(u&&u.decks||[]).map(d=>d.key).filter(Boolean)}); r.pattern=ENV_SESSION.pattern.slice(); return r; }\n';
const tierFn=src.slice(src.indexOf("function mastTierAtLeast(tier,gateTier){"), src.indexOf("}", src.indexOf("return a>=b;", src.indexOf("function mastTierAtLeast(tier,gateTier){")))+1);
function el(id){ return {id,value:"",innerHTML:"",textContent:"",style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},focus(){},outerHTML:"",parentNode:null,appendChild(){},querySelectorAll(){ return []; },contains(){ return false; }}; }
function world(o){
  o=o||{}; const G={lib:o.lib||null,search:o.search||"",fam:o.fam===undefined?{familyId:"howe",roster:[]}:o.fam,els:{},created:[],body:{classList:{list:[],add(...a){ a.forEach(x=>{ if(this.list.indexOf(x)<0) this.list.push(x); }); },remove(){},toggle(){},contains(x){ return this.list.indexOf(x)>=0; }},appendChild(e){ G.created.push(e); }},
    renders:0,content:"",writes:[],reads:[],listeners:[],auth:o.auth||null,remote:o.remote||{},signins:[],resets:[],created_users:[],reloads:0,toasts:[],bank:{},dry:!!o.dry,tab:"schedule",now:o.now||Date.UTC(2026,9,28,15,0,0),apps:[],mastReady:!!o.mastReady,unitsReady:!!o.unitsReady,masteryData:o.masteryData,unitStudies:o.unitStudies,roster:o.roster};
  const ref=(p)=>({ once(ev,fn){ G.reads.push(p); const v=(p in G.remote)?G.remote[p]:null; const snap={val:()=>v}; if(fn) fn(snap); return Promise.resolve(snap); }, on(ev,fn){ G.listeners.push({p,fn}); if(p in G.remote){ try{ fn({val:()=>G.remote[p]}); }catch(e){ G.onErr=String(e); } } }, off(ev,fn){ G.listeners=G.listeners.filter(l=>!(l.p===p&&l.fn===fn)); },
    set(v){ G.writes.push(["set",p,v]); return Promise.resolve(); }, update(v){ G.writes.push(["update",p,v]); return Promise.resolve(); }, remove(){ G.writes.push(["remove",p]); return Promise.resolve(); }, transaction(fn){ G.writes.push(["transaction",p,fn(null)]); return Promise.resolve({committed:true,snapshot:{val:()=>fn(null)}}); } });
  const mkAuth=(name)=>({ currentUser:G.auth, onAuthStateChanged(fn){ fn(G.auth); }, signInWithEmailAndPassword(e,p){ G.signins.push([name,e,p]); return Promise.resolve({user:{uid:"u_"+e,email:e}}); }, sendPasswordResetEmail(e){ G.resets.push(e); return Promise.resolve(); }, createUserWithEmailAndPassword(e,p){ G.created_users.push([name,e,p]); return Promise.resolve({user:{uid:"uid_"+e.replace(/[^a-z0-9]/gi,"").slice(0,12),email:e}}); }, signOut(){ return Promise.resolve(); } });
  const dbObj={ref(p){ return (p===undefined)?ref("/"):ref(p); }};
  const firebase={ apps:[{name:"[DEFAULT]"}], database(){ return dbObj; }, auth(){ return mkAuth("default"); }, app(){ return {name:"[DEFAULT]",database(url){ G.famDbUrl=url; return dbObj; },auth(){ return mkAuth("default"); }}; }, initializeApp(cfg,name){ const a={name,options:cfg,database:()=>dbObj,auth:()=>mkAuth(name)}; firebase.apps.push(a); G.apps.push(name); return a; } };
  const document={ getElementById:(id)=>{ if(id==="content") return G.contentEl; return G.els[id]||null; }, createElement:(t)=>{ const e=el(""); e.tag=t; return e; }, body:G.body, head:{appendChild(e){ G.created.push(e); }}, activeElement:null, addEventListener(){} , documentElement:{} };
  G.contentEl=el("content"); Object.defineProperty(G.contentEl,"innerHTML",{set(v){ G.content=v; G.renders++; },get(){ return G.content; }});
  const api=new Function("G","firebase","document","tierFn",`
    const window={ HA_FAMILY:G.fam, HoweEnvirothon:G.lib||undefined, scrollTo(){}, open(){ return null; } }; const location={ search:G.search, hostname:"", origin:"file://", pathname:"/x/index.html", reload(){ G.reloads++; } };
    const sessionStorage={ setItem(){}, getItem(){ return null; } }; const console={ log(){}, error(){}, warn(){} };
    const setTimeout=(fn,ms)=>{ G.timers=G.timers||[]; G.timers.push({fn,ms}); return G.timers.length; }, clearTimeout=()=>{};
    const Date=Object.assign(function(...a){ return a.length?new globalThis.Date(...a):new globalThis.Date(G.now); },{ now(){ return G.now; }, UTC: globalThis.Date.UTC.bind(globalThis.Date) });
    const FB_CFG={ apiKey:"k", authDomain:"howe-envirothon.firebaseapp.com", databaseURL:"https://howe-envirothon-default-rtdb.firebaseio.com", projectId:"howe-envirothon", appId:"1:2:web:3" };
    const HA_LS={ s:{}, getItem(k){ return (k in this.s)?this.s[k]:null; }, setItem(k,v){ this.s[k]=String(v); }, removeItem(k){ delete this.s[k]; } };
    let tab=G.tab, masteryKid="x", mastView="drill", _haMastReady=!!G.mastReady, _haUnitsReady=!!G.unitsReady, _haAuthStarted=false, APP_PIN="0329", db=G.db||null;
    let masteryData=G.masteryData||{}, unitStudies=G.unitStudies||{}, bank=G.bank; const KID_NAME={}, KID_COLOR={}, ROSTER_DEF=G.roster||[];
    const STARTER_UNITS={}; const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const MAST_MASTERY_TIER_DEFAULT="monthly";
    ${tierFn}
    function _dryRun(){ return G.dry; } function cap(s){ return KID_NAME[s]||(String(s).charAt(0).toUpperCase()+String(s).slice(1)); } function momHere(){ return false; }
    function gwShowToast(m){ G.toasts.push(m); } function renderAllSoon(){ renderAll(); } function haAuthHide(){ G.authHidden=true; } function haAuthWatch(){ G.watched=true; } function haSignOut(){ G.signedOut=true; }
    function initFb(){ G.initFb=(G.initFb||0)+1; db=(typeof envSiteDb==="function"&&envSiteDb())||firebase.database(); }
    function renderAll(){ G.renders++; const c=document.getElementById("content"); if(typeof envSiteRender==="function"&&envSiteRender(c)) return; G.schedulePaints=(G.schedulePaints||0)+1; }
    function showTab(t){ if(typeof envSiteTabGate==="function"&&envSiteTabGate(t)) return; tab=t; renderAll(); }
    function bankDirect(kid,pts,note){ G.bankWrites=G.bankWrites||[]; G.bankWrites.push([kid,pts,note]); return "id"; } function bankBalance(kid){ return (G.bankWrites||[]).reduce((s,w)=>s+w[1],0); }
    function renderMastStudy(opts){ G.studyCalls=(G.studyCalls||0)+1; G.studyKid=masteryKid; return G.studyHtml||'<div id="fake-study">STUDY '+masteryKid+'</div>'; }
    function gamesActive(){ return mastView==="games"||mastView==="match"; } function gamesOpen(){ mastView="match"; renderAll(); } function gamesSubHtml(c){ return '<div id="fake-games-sub">GAMES SUB</div>'; } function gamesBodyHtml(c){ return '<div id="fake-games-body">GAMES BODY</div>'; }
    function _ustApply(u,kid,n){ G.ust=G.ust||[]; G.ust.push(["apply",kid,n]); return {iu:{},bu:{},modes:{},intro:{},defs:{},hold:{}}; } function _ustWrite(id,kid,w,rec){ G.ust.push(["write",kid,rec.stage]); } function envHydrateAll(){ G.hydrated=true; }
    function envEnrollSession(u,kid){ G.sessionMade=kid; }
    ${UNIT}
    ${o.envt?"const setInterval=()=>1, clearInterval=()=>{}; function mastSpeak(t){ G.said=(G.said||[]).concat([String(t)]); }\n"+ENVT:""}
    ${MIR}
    ${SITE}
    ${CON}
    ${CLS}
    ${CPS}
    ${o.rev||""}
    ${CPC}
    ${o.noCpu?"":CPU}
    ${o.cpcore?CORE:""}
    ${o.noCcs?"":CCS}
    STARTER_UNITS[ENV_UNIT_ID]=envUnitRecordStub; function envUnitRecordStub(){ return {id:ENV_UNIT_ID,starter:ENV_UNIT_ID,starterVer:1,cardsInCode:true,stages:ENV_STAGES.map(s=>({n:s[0]})),decks:ENV_DECKS.map(d=>({key:d[0],stage:d[2],station:d[3],n:d[5],cards:[]}))}; }
    return { get tab(){ return tab; }, set tab(v){ tab=v; }, get db(){ return db; }, get mastView(){ return mastView; }, set mastView(v){ mastView=v; }, get masteryKid(){ return masteryKid; }, unitStudies, masteryData, HA_LS, _envs, _envc, _envm, STARTER_UNITS,
      envEdition, envSiteOn, envsDemo, envsLockState, envsStations, envsStationStat, envsGain, envsEffort, envsBoardsCompute, envsBoardsHtml, envsMakeCode, envsCodeNorm, envsCodeOk, envsKidEmail, envsKidPw, envsFamilyDbUrl, envSiteDb, envSiteDemoBoot, envSiteGate, envsApplyLogin, envSiteAuthShow, envsAuthHtml, envsAuthSubmit, envsKidSubmit, envSiteTabGate, envSiteRender, envsView, envsDemoGo, envsDemoData, envsDemoStart, envSiteSittingDone, envsAutoEnroll, envsWrite, envsLicenseLine, envsCard, envsKidHtml, envsParentHtml, envsStationRowsHtml, envsScoresHtml, envsTipsHtml, envsSettingsHtml, envsReadShared, envsStreakHtml, ENVS_OFF_TABS, ENVS_TIPS, ENVS_CONTACT, ENVS_FULL_APP, ENVS_STARS, ENVS_AUTOLOCK,
      initFb, envConsoleStart, envConsoleHtml, envcView, envcGridHtml, envcStudentHtml, envcRosterHtml, envcSendHtml, envcStrongHtml, envcStrongRank, envcCardsHtml, envcBoardsHtml, envcWhoHtml, envcAdminHtml, envcAddStudentPaths, envcSendOutUpdate, envcFinalUpdate, envcFinalFor, envcFinalOut, envcFinalRec, envcAddStudent, envcSendOut, envcSendPick, envcSendDeck, envcOpenFor, envcUndo, envcCardAdd, envcCardRetire, envcCardSave, envcTeamSet, envcWhoSet, envcLock, envcSeedJson, envcPickClass, envcStudents, envcNewCode, envcBoardsPublish, envcScoreSave, envcDemoStart, envcTeacherAdd, envcClassAdd, envcSeedShow, showTab, renderAll, firebase, ENV_SESSION, ENV_SESSION_SID,
      _envcs, ENVCS_FIELDS, ENVCS_SECTS, envClassOverlay, envClsMerge, envClsCheck, envClsSave, envClsInput, envClsReset, envClsPat, envClsLock, envClsPanelHtml, envClsStudentHtml, envClsStartHtml, envClsKidLoad, envClsLayers, envClsEff, envClsClassVal, envClsLocked, envClsDef, envClsTierOrderOk, envClsConsoleStart,
      cp:{ CP_HUES, CP_EMOJI, CP_DEF, CP_LABELS_UNIT, CP_LABELS_PLAIN, CP_FEATURES, CP_CAL_DAYS, _cp, cpHex, cpLum, cpContrast, cpTextOn, cpAccentOn, cpTitleOk, cpEmojiOk, cpDateOk, cpDateLabel, cpBrand, cpLabel, cpFeature, cpSeason, cpLockKey, cpLockLabel, cpTopHtml, cpBarHtml, cpClassIn, cpDraftOf, cpDraft, cpCheck, cpCan, cpSet, cpEmojiType, cpGoal, cpGoalAdd, cpGoalDel, cpOffAdd, cpOffDel, cpFeat, cpWord, cpCancel, cpSave, cpPrevHtml, cpSetupHtml, cpNewClass, cpAdminClassHtml, cpClassAdd, cpDemoStart, cpCls },
      envsAutoLockLabel,
      cps:{ CPS_SEATS_MAX, CPS_DAYS_ROW, CPS_FIELDS_SET, cpSeatsFields, cpSeatsAuto, cpSeatsPace, cpSeatsDef, cpSeatsCheck, cpSeatsFmt, cpSeatsDays, cpSeatsStudy, cpSeatsNums, cpSeatsCtlHtml, cpSeatsPaceHtml },
      cpu:${o.noCpu?"null":"{ CPU_UNITS, CPU_DEFAULT, _cpu, cpuOn, cpuReg, cpuUnit, cpuQid, cpuLoad, cpuIndex, cpuIds, cpuDecks, cpuSections, cpuSum, cpuWatch, cpuAdminWatch, cpuAttached, cpuStations, cpuLabel, cpuFeature, cpuUnitRecord, cpuGeneric, cpuHydrate, cpuHydrateAll, cpuEnrollSession, cpuAutoEnroll, cpuUnitsHtml, cpuPublish, cpuPubState, cpuSetupHtml, cpuUnitsAfter, cpuAttach, cpuNewUnitsHtml, cpuNewUnits, cpuDemoStart, get win(){ return window; } }"},
      core:${o.cpcore?"{ CPCORE_FIELD, _cpcore, cpCoreOn, cpCoreSetting, cpCoreSet, cpCoreLeft, cpCoreNames, cpCoreFresh, cpCoreDemoSeed }":"null"},
      ccs:${o.noCcs?"null":"{ CPCS_PAGE, CPCS_SPAGE, _cpcs, cpcsOn, cpcsChips, cpcsFoldAll, cpcsUnitIds, cpcsLib, cpcsLoad, cpcsKind, cpcsIndex, cpcsPass, cpcsCounts, cpcsTap, cpcsSearch, cpcsHtml, cpcsListHtml, cpcsChipsHtml, cpcsWord }"},
      envt:${o.envt?"{ envtOpen, envtStatus, envtStartHtml, envtPick, envtNext, envtClose, envtCoreLine, envtWaitsForCheckin, envtFinalApply, envRaSet, envRaMode, envRaStartHtml, envRaReadQ, get state(){ return envtState; } }":"null"} };`)(G,firebase,document,tierFn);
  api.G=G; api.el=(id,v)=>{ G.els[id]=el(id); if(v!==undefined) G.els[id].value=v; return G.els[id]; };
  api.flush=async()=>{ for(let i=0;i<60;i++) await Promise.resolve(); };
  api.tick=()=>{ const t=(G.timers||[]).shift(); if(t) t.fn(); return !!t; };
  return api;
}


module.exports={world,src,SITE,CON,MIR,UNIT,CLS,CPS,CPC,CPU,CORE,CCS,REPO};
if(require.main===module){
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const run=async()=>{
console.log("── the blocks, where they sit, how they are hooked ──");
{ const a=src.indexOf("// ENVSITE_START"), b=src.indexOf("// ENVSITE_END"), c=src.indexOf("// ENVCONSOLE_START"), d=src.indexOf("// ENVCONSOLE_END");
  ok("ENVSITE right after ENVMIRROR_END, ENVCONSOLE right after ENVSITE_END, each once", a>0&&b>a&&c>b&&d>c&&src.indexOf("// ENVSITE_START",a+1)<0&&src.indexOf("// ENVCONSOLE_START",c+1)<0&&src.slice(src.indexOf("// ENVMIRROR_END"),a).trim()==="// ENVMIRROR_END"&&src.slice(b,c).trim()==="// ENVSITE_END");
  const decl=l=>!l.trim()||/^(\/\/|function |const |let |var | |})/.test(l);
  ok("both blocks only declare (nothing runs at boot)", SITE.split("\n").every(decl)&&CON.split("\n").every(decl));
  ok("no Howe kid name as a code literal in either block", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(SITE+CON));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}")<0);
  const hooks=src.split("\n").filter(l=>/🌿 ENVSITE/.test(l));
  ok("exactly 7 hook lines outside the blocks, every one typeof-guarded", hooks.length===7&&hooks.every(l=>/typeof envSite\w+==="function"/.test(l)), hooks.length);
  ok("hooks: auth gate (demo + role), sign-in card, initFb db handle, showTab, _renderAllInner, sitting save", ["envSiteDemoBoot","envSiteGate","envSiteAuthShow","envSiteDb","envSiteTabGate","envSiteRender","envSiteSittingDone"].every(f=>hooks.some(l=>l.indexOf(f)>=0))); }

console.log("\n── no edition, no demo → inert; the boot is byte-identical ──");
{ const w=world({fam:{familyId:"howe",roster:[]}});
  ok("envEdition() is \"\" and envSiteOn() false for Howe", w.envEdition()===""&&w.envSiteOn()===false);
  ok("every hook target says no", w.envSiteDemoBoot()===false&&w.envSiteGate({uid:"u"},()=>{})===false&&w.envSiteAuthShow("")===false&&w.envSiteDb()===null&&w.envSiteTabGate("units")===false&&w.envSiteRender(w.G.contentEl)===false&&w.envSiteSittingDone("k",{total:5})===false);
  ok("nothing created, no CSS, no listener, no read, no write, no body class, #content untouched", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0&&w.G.body.classList.list.length===0&&w.G.content===""&&w.G.renders===0);
  ok("🏫 CPCLASS's hook targets say no too (no bar, no class, no lock key, no screen, no + Class) and the lock / label / © line read as before", w.cp.cpTopHtml("kid","K")===""&&w.cp.cpClassIn()===false&&w.cp.cpLockKey()===""&&w.cp.cpSeason()==="2026-27"&&w.cp.cpSetupHtml()===""&&w.cp.cpAdminClassHtml()===""&&w.cp.cpClassAdd()===false&&w.envsLockState(null,"20270425").why==="auto"&&w.envsAutoLockLabel()==="Apr 24, 2027"&&/for the 2026-27 season/.test(w.envsLicenseLine()));
  { const u=w.cpu; ok("📦 CPUNIT's hook targets say no too (no sections, no enroll, no hydrate, no registry, no screens, no words) and envsStations reads ENV_DECKS exactly as before", u.cpuOn()===false&&u.cpuStations()===null&&u.cpuAutoEnroll()===false&&u.cpuHydrateAll()===false&&u.cpuReg()===null&&u.win.HoweUnits===undefined&&u.cpuUnitsHtml()===""&&u.cpuSetupHtml()===""&&u.cpuNewUnitsHtml()===""&&u.cpuLabel("section")===""&&u.cpuFeature("teams")===null&&u.cpuAttached().length===0&&u.cpuWatch("x_unit")===false&&u.cpuPublish("nc_envirothon")===false&&u.cpuAttach("nc_envirothon",false)===false&&w.envsStations().length===6&&w.envsStations().every(s=>!("unit" in s))&&w.envsAutoEnroll()===false);
    ok("…and nothing created, no listener, no read, no write after calling them", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0); }
  { const rec={name:"Envirothon",decks:["Forestry · Terms"],newPerDay:5,maxCards:12,focusDecks:2}, own={intro_dots:5};
    ok("🪑 CPSEATS's hooks say no too: a Howe kid's 🌿 record and drill settings come back as the very same objects (Lincoln keeps 12 a sitting), no pace line, no control", w.envClassOverlay("study","lincoln",rec)===rec&&rec.maxCards===12&&w.envClassOverlay("drill","lincoln",own)===own&&w.cps.cpSeatsPaceHtml(w.ENVCS_FIELDS.find(f=>f.name==="maxCards"),"class")===""&&w.envClsStartHtml("lincoln",{sid:"envirothon",newPerDay:5})==="");
    ok("…and nothing created, no listener, no read, no write after calling them", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0); }
  { const c=world({fam:{familyId:"howe",roster:[]},cpcore:true}), K=c.core, D="Forestry · Terms", names=["Forest","Cambium","Biome"], fresh=["Soils and Land Use · Terms","Forestry · Terms"];
    c.unitStudies.nc_envirothon={id:"nc_envirothon",decks:[{key:D,cards:[{name:"Forest",core:false},{name:"Cambium",core:true},{name:"Biome",core:false}]}]}; c.masteryData.lincoln=[];
    const S={sid:"envirothon",kind:"deck",order:"bank",decks:[D,fresh[0]]}, M=c.masteryData;
    ok("⭐ CPCORE's hooks hand back the very array they were given for a Howe kid (Lincoln's 🌿 session, order \"bank\"): names, focus decks; no demo seed; the setting is off here", K.cpCoreOn("lincoln",S)===false&&K.cpCoreNames("lincoln",S,D,names,{})===names&&K.cpCoreFresh("lincoln",S,fresh,{})===fresh&&K.cpCoreDemoSeed("lincoln",D)===false&&c.unitStudies.nc_envirothon.decks[0].cards.length===3&&M.lincoln.length===0);
    ok("…and nothing created, no listener, no read, no write after calling them", c.G.created.length===0&&c.G.listeners.length===0&&c.G.reads.length===0&&c.G.writes.length===0); }
  { const c=w.ccs, chips=[["grid","x"],["cards","y"]], before=JSON.stringify(chips); c.cpcsTap("st","forestry"); c.cpcsSearch("tree");
    ok("📚 CPCARDSSEE's hook targets say no too: the chip list comes back the very same array, untouched; no page, no index, no units, no load, taps do nothing", c.cpcsOn()===false&&c.cpcsChips(chips)===chips&&JSON.stringify(chips)===before&&c.cpcsHtml()===""&&c.cpcsIndex()===null&&c.cpcsUnitIds().length===0&&c.cpcsLoad()===false&&c._cpcs.os===null&&c._cpcs.q===""&&(w.G.timers||[]).length===0);
    ok("…and nothing created, no listener, no read, no write, no paint after calling them", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0&&w.G.renders===0); }
  w.showTab("units"); ok("showTab works as before (tab = units, the schedule paint ran)", w.tab==="units"&&w.G.schedulePaints===1);
  const d=world({fam:{familyId:"dewalt",roster:[]}}); ok("a second family (no edition) is inert too", d.envEdition()===""&&d.envSiteRender(d.G.contentEl)===false&&d.G.created.length===0);
  const h=world({fam:{familyId:"howe",roster:[]},search:"?dryrun=1"}); ok("?dryrun=1 alone is not the demo", h.envsDemo()===false&&h.envEdition()==="");
  const envm=src.slice(src.indexOf("// ENVMIRROR_START"),src.indexOf("// ENVMIRROR_END"));
  ok("ENVMIRROR itself is untouched by this PR (still declares only; same publish path)", envm.indexOf('ref("students/"+sid).update({summary:s,meta:meta})')>0); }

console.log("\n── the switch ──");
{ ok("host config edition:\"envirothon\" turns it on", world({fam:{familyId:"envirothon",edition:"envirothon",roster:[]}}).envEdition()==="envirothon");
  ok("?demo=1 turns it on (demo) with the default role = the sign-in card", (()=>{ const w=world({fam:{familyId:"howe",roster:[]},search:"?demo=1"}); return w.envEdition()==="envirothon"&&w.envsDemo()===true&&w._envs.demoRole==="signin"; })());
  ok("?demo=1&role=teacher picks the role", world({fam:{familyId:"howe",roster:[]},search:"?demo=1&role=teacher"})._envs.demoRole==="teacher"||(()=>{ const w=world({fam:{familyId:"howe",roster:[]},search:"?demo=1&role=teacher"}); w.envsDemo(); return w._envs.demoRole==="teacher"; })());
  ok("demo:true in the config turns it on with no query string (the double-clicked file)", (()=>{ const w=world({fam:{familyId:"envirothon-demo",edition:"envirothon",demo:true,roster:[]}}); return w.envsDemo()===true&&w.envEdition()==="envirothon"; })());
  const w=world({fam:{familyId:"x",edition:"starter",roster:[]}}); ok("another edition word is not this edition", w.envEdition()===""); }

console.log("\n── the master lock: release/locked + the auto-lock after 2027-04-24 ──");
{ const w=world({fam:{familyId:"envirothon",edition:"envirothon",roster:[]}}); const L=w.envsLockState;
  ok("nothing set, before the date → open", L(null,"20261028").locked===false&&L(undefined,"20270424").locked===false);
  ok("true → locked (switch)", L(true,"20261028").locked===true&&L(true,"20261028").why==="switch");
  ok("{locked:true} → locked any day", L({locked:true,at:1},"20261028").locked===true);
  ok("{locked:false} before the date → open", L({locked:false,at:Date.UTC(2026,9,1)},"20261028").locked===false);
  ok("the day after 2027-04-24 with nothing set → locked by itself (auto)", L(null,"20270425").locked===true&&L(null,"20270425").why==="auto"&&L({locked:false,at:Date.UTC(2026,9,1)},"20270501").locked===true);
  ok("on 2027-04-24 itself → still open (State day)", L(null,"20270424").locked===false);
  ok("an admin's {locked:false} dated AFTER the date reopens the next season", L({locked:false,at:Date.UTC(2027,4,3)},"20270601").locked===false&&L({locked:false,at:Date.UTC(2027,4,3)},"20270601").why==="reopened");
  ok("an admin's {locked:false} dated BEFORE the date does not survive the auto-lock", L({locked:false,at:Date.UTC(2027,2,3)},"20270601").locked===true);
  ok("ENVS_AUTOLOCK is 20270424 and the admin card names Apr 24, 2027", w.ENVS_AUTOLOCK==="20270424"&&/Apr 24, 2027/.test((()=>{ w._envs.role="admin"; return w.envcAdminHtml(); })())); }

console.log("\n── the router: each role → its part, nothing else ──");
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
async function gate(role,extra,remote){ const w=world(Object.assign({fam:FAM,auth:{uid:"u1",email:"p@example.com"},remote:Object.assign({"logins/u1":role?Object.assign({role,familyId:"ramirez",kid:"maya",cid:"ms1"},extra||{}):null},remote||{})},{}));
  let cont=0; const r=w.envSiteGate({uid:"u1",email:"p@example.com"},()=>{ cont++; w.G.authHidden=true; w.G.initFb=(w.G.initFb||0)+1; w.renderAll(); }); await w.flush(); w.cont=cont; w.gateRet=r; return w; }
{ const w=await gate("kid"); ok("kid: gate true, logins read, role kid, sid ramirez_maya, the family instance URL derived from the project id", w.gateRet===true&&w.G.reads.includes("logins/u1")&&w._envs.role==="kid"&&w._envs.sid==="ramirez_maya"&&w._envs.dbUrl==="https://howe-envirothon-ramirez.firebaseio.com");
  ok("kid: boot continued (cont once), envSiteDb() hands initFb the family instance, body says env-site env-role-kid", w.cont===1&&w.envSiteDb()!==null&&w.G.body.classList.contains("env-site")&&w.G.body.classList.contains("env-role-kid"));
  ok("kid: the page is the study screen — the 🌿 session, Games / Scores / Team / Star Store / Tips chips — no console, no Schedule", /fake-study/.test(w.G.content)&&/Games/.test(w.G.content)&&/Star Store/.test(w.G.content)&&!/Roster|Send out|Who is strong/.test(w.G.content)&&!/Schedule/.test(w.G.content)&&w.masteryKid==="maya");
  ok("kid: the mirror is pointed at this project under this login (HA_FAMILY.envirothon familyId = ramirez, kids = [maya])", w.G.fam.envirothon&&w.G.fam.envirothon.familyId==="ramirez"&&w.G.fam.envirothon.kids[0]==="maya"&&w.G.fam.envirothon.classId==="ms1");
  ok("kid: the shared instance's listeners are classes/ms1, boards/ms1, settings/whoDrills/ms1, release/locked — nothing else", JSON.stringify(w.G.listeners.map(l=>l.p).sort())===JSON.stringify(["boards/ms1","classes/ms1","release/locked","settings/whoDrills/ms1"]));
  ok("kid: no write happened", w.G.writes.length===0); }
{ const w=await gate("parent"); ok("parent: role parent, same family instance, boot continued, the read-only page (How Maya is doing · Team · Tips), no console", w._envs.role==="parent"&&w._envs.dbUrl==="https://howe-envirothon-ramirez.firebaseio.com"&&w.cont===1&&/How Maya is doing/.test(w.G.content)&&/Who drills/.test(w.G.content)&&!/Roster|Send out/.test(w.G.content)&&!/fake-study/.test(w.G.content));
  ok("parent: the tips card has the greyed full-app list and PLACEHOLDER lines + contact line", (()=>{ w.envsView("tips"); return /What a full Howe Academy adds/.test(w.G.content)&&/PLACEHOLDER tip 1/.test(w.G.content)&&/PLACEHOLDER contact line/.test(w.G.content); })());
  ok("kid's tips card has the six lines but NOT the full-app shop window", (()=>{ const k=world({fam:FAM}); k._envs.role="kid"; const h=k.envsTipsHtml("kid"); return /PLACEHOLDER tip 6/.test(h)&&!/What a full Howe Academy adds/.test(h); })()); }
{ const w=await gate("teacher",{familyId:"",kid:""},{"teachers/u1":{name:"Ms. B",classes:{ms1:true}},"classes/ms1":{name:"MS Science 2026-27",teacher:"u1",students:{ramirez_maya:true}}});
  ok("teacher: role teacher, NO family instance, the app's boot is NOT continued (no initFb), the console starts", w._envs.role==="teacher"&&w._envs.dbUrl===""&&w.cont===0&&!w.G.initFb&&w.G.authHidden===true&&w.G.watched===true);
  ok("teacher: reads teachers/u1 once; listens to release/locked, classes/ms1, release/ms1, scores/ms1, teacherCards/ms1, settings/whoDrills/ms1 and ONE students/<sid> per student", w.G.reads.includes("teachers/u1")&&["release/locked","classes/ms1","release/ms1","scores/ms1","teacherCards/ms1","settings/whoDrills/ms1","students/ramirez_maya"].every(p=>w.G.listeners.some(l=>l.p===p))&&!w.G.listeners.some(l=>l.p==="students"||l.p==="classes"), w.G.listeners.map(l=>l.p));
  ok("teacher: the page is the console (Class · Roster · Send out · Who is strong where · Teacher cards · Boards · Who drills), no Admin chip, no study", /Roster/.test(w.G.content)&&/Send out/.test(w.G.content)&&/Who drills/.test(w.G.content)&&!/🔑 Admin/.test(w.G.content)&&!/fake-study/.test(w.G.content)&&!/Star Store/.test(w.G.content)); }
{ const w=await gate(null,null,{"admins/u1":true,"classes":{ms1:{name:"A",teacher:"t"},ms2:{name:"B",teacher:"t2"}}});
  ok("admin by admins/<uid> alone (no logins row): role admin, listens to every class and the teachers, Admin chip present", w._envs.role==="admin"&&w.G.listeners.some(l=>l.p==="classes")&&w.G.listeners.some(l=>l.p==="teachers")&&/🔑 Admin/.test(w.G.content)); }
{ const w=await gate(null); ok("a login with no record → the 'not set up' card, nothing else loads", w.G.created.some(e=>/isn’t set up yet/.test(e.innerHTML||""))&&w.cont===0&&w.G.renders===0); }
{ const w=await gate("kid",null,{"release/locked":true}); ok("locked season → a kid lands on the 'Season closed' card; boot not continued; nothing rendered", w.G.created.some(e=>/Season closed/.test(e.innerHTML||"")&&/© 2026 Howe Academy/.test(e.innerHTML||""))&&w.cont===0&&w.G.renders===0); }
{ const w=await gate("teacher",{familyId:"",kid:""},{"release/locked":{locked:true,at:1,by:"a"}}); ok("locked season → the teacher too", w.G.created.some(e=>/Season closed/.test(e.innerHTML||""))&&!w.G.listeners.some(l=>l.p==="classes/ms1")); }
{ const w=await gate(null,null,{"admins/u1":true,"release/locked":true}); ok("locked season → the ADMIN still gets in (to reopen)", w._envs.role==="admin"&&!w.G.created.some(e=>/Season closed/.test(e.innerHTML||""))&&/CLOSED/.test(w.envcAdminHtml())); }
{ const w=world({fam:FAM,now:Date.UTC(2027,4,10)}); const r=w.envSiteGate({uid:"u1"},()=>{}); await w.flush();
  w.G.remote["logins/u1"]={role:"parent",familyId:"f",kid:"k"}; const w2=world({fam:FAM,now:Date.UTC(2027,4,10),remote:{"logins/u1":{role:"parent",familyId:"f",kid:"k"}}}); w2.envSiteGate({uid:"u1"},()=>{ w2.G.contd=true; }); await w2.flush();
  ok("after 2027-04-24 with no lock record → auto-locked: the season-closed card says it closes by itself", r===true&&!w2.G.contd&&w2.G.created.some(e=>/closes by itself after Apr 24, 2027/.test(e.innerHTML||""))); }

console.log("\n── the sign-in card ──");
{ const w=world({fam:FAM}); const r=w.envSiteAuthShow("hello"); const card=w.G.created.find(e=>e.id==="ha-auth");
  ok("draws the site's own card: email + password, 'Student code from your card', the © + license line with the class and season", r===true&&card&&/type="email"/.test(card.innerHTML)&&/type="password"/.test(card.innerHTML)&&/Student code from your card/.test(card.innerHTML)&&card.innerHTML.indexOf("© 2026 Howe Academy · licensed to MS Science 2026-27 for the 2026-27 season · not for redistribution")>0);
  ok("the message lands in #ha-auth-m", (()=>{ w.el("ha-auth-m"); w.envSiteAuthShow("That code isn’t one of ours"); return w.G.els["ha-auth-m"].textContent==="That code isn’t one of ours"; })());
  w.el("ha-auth-k","mr7 kq4"); w.el("ha-auth-kb"); w.envsKidSubmit(null); await w.flush();
  ok("a kid code signs in with the synthetic email + the derived password on the DEFAULT auth, then reloads (the gate routes on the next boot)", w.G.signins.length===1&&w.G.signins[0][1]==="k-mr7kq4@howe-envirothon.kid"&&w.G.signins[0][2]==="KMR7-KQ4#howe-envirothon"&&w.G.reloads===1);
  w.el("ha-auth-k","abc"); w.envsKidSubmit(null); ok("a malformed code is refused with a hint, no sign-in", w.G.signins.length===1&&w.G.els["ha-auth-m"].textContent.indexOf("ABC-123")>=0);
  w.el("ha-auth-e","parent@example.com"); w.el("ha-auth-p","pw"); w.el("ha-auth-b"); w.envsAuthSubmit(null); await w.flush(); ok("email + password sign in on the default auth and reload", w.G.signins.length===2&&w.G.signins[1][1]==="parent@example.com"&&w.G.reloads===2);
  ok("in demo the card is drawn inside the page, not as an overlay, and its buttons only toast", (()=>{ const d=world({fam:FAM,search:"?demo=1"}); d.envSiteDemoBoot(); d.renderAll(); return d.envSiteAuthShow("")===false&&/Student code from your card/.test(d.G.content)&&/envsDemoFake/.test(d.G.content)&&!/envsAuthSubmit\(event\)/.test(d.G.content); })()); }

console.log("\n── kid codes → synthetic logins: deterministic, never stored ──");
{ const w=world({fam:FAM});
  ok("envsMakeCode: ABC-123 shape from a safe alphabet (no 0/O/1/I)", (()=>{ let seed=7; const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; }; const c=w.envsMakeCode(rnd); return /^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/.test(c)&&w.envsCodeOk(c); })());
  ok("envsCodeNorm accepts lower case, spaces, a missing dash", w.envsCodeNorm("mr7 kq4")==="MR7-KQ4"&&w.envsCodeNorm("mr7kq4")==="MR7-KQ4"&&w.envsCodeNorm("MR7-KQ4")==="MR7-KQ4");
  ok("email + password are a pure function of the code and the project id", w.envsKidEmail("MR7-KQ4")==="k-mr7kq4@howe-envirothon.kid"&&w.envsKidEmail("mr7 kq4")===w.envsKidEmail("MR7-KQ4")&&w.envsKidPw("MR7-KQ4")===w.envsKidPw("mr7kq4")&&w.envsKidPw("MR7-KQ4").length>=6&&w.envsKidPw("MR7-KQ4")!==w.envsKidPw("MR7-KQ5"));
  ok("the family instance URL: <projectId>-<familyId>, or the host config's pattern", w.envsFamilyDbUrl("ramirez")==="https://howe-envirothon-ramirez.firebaseio.com"&&(()=>{ const p=world({fam:Object.assign({},FAM,{envirothon:{familyDbPattern:"https://x-{fid}.firebaseio.com"}})}); return p.envsFamilyDbUrl("ramirez")==="https://x-ramirez.firebaseio.com"; })()); }

console.log("\n── the teacher's + Student: exactly the listed paths; in demo nothing ──");
{ const w=world({fam:FAM}); const o=w.envcAddStudentPaths({cid:"ms1",familyId:"shah-p",kid:"priya",name:"Priya S.",uidParent:"UP",uidKid:"UK",now:5});
  ok("the record set = logins/UP, logins/UK, students/<sid>/{meta,class,app,logins}, classes/ms1/students/<sid> — 7 paths, nothing else", JSON.stringify(Object.keys(o).sort())===JSON.stringify(["classes/ms1/students/shah-p_priya","logins/UK","logins/UP","students/shah-p_priya/app","students/shah-p_priya/class","students/shah-p_priya/logins","students/shah-p_priya/meta"].sort()), Object.keys(o));
  ok("logins rows carry role/familyId/kid/cid/name; meta the MIRROR_SETUP shape {familyId,kid,name,at}; app micro; no email anywhere", o["logins/UP"].role==="parent"&&o["logins/UK"].role==="kid"&&o["logins/UK"].familyId==="shah-p"&&o["logins/UK"].cid==="ms1"&&JSON.stringify(Object.keys(o["students/shah-p_priya/meta"]).sort())==='["at","familyId","kid","name"]'&&o["students/shah-p_priya/app"]==="micro"&&!/@/.test(JSON.stringify(o)));
  // live: the secondary app creates both users, sends the reset email, then ONE update on the root with those paths
  const L=world({fam:FAM,auth:{uid:"t1",email:"t@x.org"},remote:{"teachers/t1":{classes:{ms1:true}},"classes/ms1":{name:"C",teacher:"t1",students:{}}}}); L._envs.role="teacher"; L._envs.uid="t1"; L.envConsoleStart(); await L.flush();
  L.el("envc-first","Priya"); L.el("envc-last","s"); L.el("envc-email","Parent@Example.com"); L.envcAddStudent(); await L.flush(); await L.flush();
  ok("live: the secondary named app 'envcreate' created the parent and the kid user (not the teacher's own auth)", L.G.apps.includes("envcreate")&&L.G.created_users.length===2&&L.G.created_users.every(c=>c[0]==="envcreate")&&L.G.created_users[0][1]==="parent@example.com"&&/^k-[a-z2-9]{6}@howe-envirothon\.kid$/.test(L.G.created_users[1][1]), L.G.created_users);
  ok("live: a password-reset email went to the parent; the kid's password is the derived one; the parent's is random (never shown)", L.G.resets[0]==="parent@example.com"&&L.G.created_users[1][2]===L.envsKidPw(L._envc.newLogin.code)&&L.G.created_users[0][2].length>=20);
  const upd=L.G.writes.filter(x=>x[0]==="update"&&x[1]==="/");
  const uidP=L.G.created_users[0]&&("uid_"+L.G.created_users[0][1].replace(/[^a-z0-9]/gi,"").slice(0,12)), uidK=L.G.created_users[1]&&("uid_"+L.G.created_users[1][1].replace(/[^a-z0-9]/gi,"").slice(0,12));
  const want=["classes/ms1/students/priya-s_priya","logins/"+uidP,"logins/"+uidK,"students/priya-s_priya/app","students/priya-s_priya/class","students/priya-s_priya/logins","students/priya-s_priya/meta"].sort();
  ok("live: exactly ONE multi-path update on the root, with exactly the 7 paths (sid priya-s_priya), and no other write", upd.length===1&&L.G.writes.length===1&&JSON.stringify(Object.keys(upd[0][2]).sort())===JSON.stringify(want), L.G.writes.map(x=>x[1]).concat(upd.length?Object.keys(upd[0][2]):[]));
  ok("live: neither the code nor any password is in anything written to the database", !JSON.stringify(L.G.writes).includes(L._envc.newLogin.code)&&!JSON.stringify(L.G.writes).includes(L.G.created_users[1][2])&&!JSON.stringify(L.G.writes).includes(L.G.created_users[0][2]));
  ok("live: the printable card shows the name and the code once", /Priya S\./.test(L.envcRosterHtml())&&L.envcRosterHtml().indexOf(L._envc.newLogin.code)>0);
  const D=world({fam:FAM,search:"?demo=1&role=teacher"}); D.envSiteDemoBoot(); D.el("envc-first","Priya"); D.el("envc-last","s"); D.el("envc-email","p@example.com"); const nBefore=Object.keys(D._envc.students).length; D.envcAddStudent(); await D.flush();
  ok("demo: no user created, no write, one 'would write' toast naming the paths, the row appears, the code card shows", D.G.created_users.length===0&&D.G.writes.length===0&&D._envs.writes.length===1&&Object.keys(D._envc.students).length===nBefore+1&&D._envc.newLogin&&D._envc.newLogin.demo===true); }

console.log("\n── send-out: the multi-path update ──");
{ const w=world({fam:FAM}); const st=w.envsStations().find(s=>s.id==="forestry");
  const all=w.envcSendOutUpdate("ms1",st,null,null,"t1",99);
  ok("whole station, whole class → ONE key release/ms1/all/forestry = {openedAt, by}", JSON.stringify(all)===JSON.stringify({"release/ms1/all/forestry":{openedAt:99,by:"t1"}}));
  const some=w.envcSendOutUpdate("ms1",st,{"Forestry · ID":false},null,"t1",99);
  ok("two of three decks, whole class → one key per DECK under all/", JSON.stringify(Object.keys(some).sort())===JSON.stringify(["release/ms1/all/Forestry · Facts","release/ms1/all/Forestry · Terms"]));
  const pick=w.envcSendOutUpdate("ms1",st,null,["a_b","c_d"],"t1",99);
  ok("picked students → release/ms1/students/<sid>/forestry per student, nothing under all/", JSON.stringify(Object.keys(pick).sort())===JSON.stringify(["release/ms1/students/a_b/forestry","release/ms1/students/c_d/forestry"]));
  ok("no deck ticked → nothing", Object.keys(w.envcSendOutUpdate("ms1",st,{"Forestry · Terms":false,"Forestry · Facts":false,"Forestry · ID":false},null,"t1",1)).length===0);
  ok("every key is one the mirror accepts (a station id or a deck key of the unit)", Object.keys(some).concat(Object.keys(all)).every(k=>{ const key=k.split("/").slice(3).join("/"); return key==="forestry"||st.decks.some(d=>d.key===key); }));
  const D=world({fam:FAM,search:"?demo=1&role=teacher"}); D.envSiteDemoBoot(); D.envcSendPick("wildlife"); D.envcSendDeck("Wildlife · ID",false); D.envcSendOut(); await D.flush();
  ok("demo Send: no write; the release state shows the two decks as sent", D.G.writes.length===0&&D._envs.writes.length===1&&!!D._envc.release.all["Wildlife · Terms"]&&!!D._envc.release.all["Wildlife · Facts"]&&!D._envc.release.all["Wildlife · ID"]);
  D.envcUndo("release/ms-science-2026/all/Wildlife · Terms"); await D.flush();
  ok("demo Undo removes the one key (no write, one more 'would remove' record)", !D._envc.release.all["Wildlife · Terms"]&&D.G.writes.length===0&&D._envs.writes.length===2&&D._envs.writes[1].op==="remove"); }

console.log("\n── the team board math on a fixed sample ──");
{ const w=world({fam:FAM}); const now=Date.UTC(2026,9,28,12);
  const dk=n=>new Date(now-n*86400000).toISOString().slice(0,10).replace(/-/g,"");
  const S={a_x:{meta:{name:"A"},summary:{byDeck:{"Forestry · Terms":{total:100,mastered:50,learning:10,new:40,held:false,c14:9,m14:1,last:dk(0)},"Forestry · Facts":{total:100,mastered:0,learning:0,new:100,held:false},"Forestry · ID":{total:100,mastered:100,learning:0,new:0,held:false}},streak:{days:3,last:dk(0)},days:{[dk(0)]:{n:10,c:9,m:1},[dk(3)]:{n:10,c:9,m:1},[dk(9)]:{n:50}},tests:{forestry:{pre:{right:5,n:10},post:{best:{right:9,n:10}}},soils:{pre:{right:8,n:10},post:{best:{right:6,n:10}}}}}},
    b_y:{meta:{name:"B"},summary:{byDeck:{"Forestry · Terms":{total:100,mastered:20,learning:0,new:80,held:false}},streak:{days:0,last:dk(2)},days:{[dk(2)]:{n:4}},tests:{forestry:{pre:{right:4,n:10},post:{best:{right:7,n:10}}}}}},
    c_z:{meta:{name:"C"},summary:{byDeck:{},streak:{days:1,last:dk(0)},days:{[dk(0)]:{n:6}},tests:{forestry:{pre:{right:6,n:10}}}}}};
  ok("gain = Σ max(0, post% − pre%): A 40 (soils went down → 0), B 30, C 0 (no post)", w.envsGain(S.a_x.summary)===40&&w.envsGain(S.b_y.summary)===30&&w.envsGain(S.c_z.summary)===0);
  ok("effort = reviews in 7 days + 3×streak: A 20+9=29, B 4, C 6+3=9", w.envsEffort(S.a_x.summary,now).score===29&&w.envsEffort(S.b_y.summary,now).score===4&&w.envsEffort(S.c_z.summary,now).score===9);
  const st=w.envsStations().find(s=>s.id==="forestry"), xa=w.envsStationStat(S.a_x.summary,st);
  ok("station stat: mastered 150 of 300 released cards = 50 %, acc14 90 %, graduated null", xa.pct===50&&xa.acc14===90&&xa.released===3&&xa.grad===null&&w.envsStationStat(S.c_z.summary,st).pct===null&&w.envsStationStat(S.c_z.summary,st).released===0);
  const B=w.envsBoardsCompute(S,{a_x:"Oaks",b_y:"Pines",c_z:"Oaks"},now);
  ok("team board: Oaks 40 (A 40 + C 0) above Pines 30; members listed by name", B.teams[0].name==="Oaks"&&B.teams[0].gain===40&&B.teams[1].name==="Pines"&&B.teams[1].gain===30&&B.teams[0].memberNames.join(",")==="A,C");
  ok("readiness: Oaks forestry = mean of A 50 (C not sent out → left out) = 50; Pines 20; soils null for both", B.teams[0].ready.forestry===50&&B.teams[1].ready.forestry===20&&B.teams[0].ready.soils===null);
  ok("expert badges: Oaks forestry → A; Pines forestry → B; no badge where nobody has studied", B.teams[0].badges.forestry.name==="A"&&B.teams[1].badges.forestry.name==="B"&&!B.teams[0].badges.soils);
  ok("effort board ranked A 29, C 9, B 4 — and 'you and the two nearest' for B shows C and B only", B.effort.map(r=>r.name).join("")==="ACB"&&(()=>{ const h=w.envsBoardsHtml(B,"b_y"); const eff=h.slice(h.indexOf("Effort this week")); return /B \(you\)/.test(eff)&&/>C</.test(eff)&&!/>A</.test(eff); })());
  ok("a student with no team sits under 'No team yet'", w.envsBoardsCompute(S,{},now).teams[0].name==="No team yet");
  ok("no individual score anywhere on the public boards (no % right, no test score per student)", !/acc|right \(14|test \d/.test(w.envsBoardsHtml(B,null))); }

console.log("\n── every door the micro doc lists as off is unreachable under the edition ──");
{ const w=world({fam:FAM,search:"?demo=1&role=kid"}); w.envSiteDemoBoot(); w.renderAll();
  const doors=["schedule","notebook","play","moms-plan","babysitter","supplies","history","pace","activities","grid","generate","chorePlan","kitchen","workbooks","eic","purchases","helpers"];
  ok("ENVS_OFF_TABS names every door in the micro doc's list (+ the app's own Mastery / Units / Kids tabs)", doors.every(d=>w.ENVS_OFF_TABS.includes(d))&&["mastery","units","kids"].every(d=>w.ENVS_OFF_TABS.includes(d)));
  ok("showTab(<any door>) lands back on the site's one page every time", w.ENVS_OFF_TABS.every(t=>{ w.showTab(t); return w.tab==="envsite"; })&&w.G.schedulePaints===undefined);
  const kid=w.G.content; ok("the kid's page has none of the app's chrome words (Schedule, Mom's Day, Chores, Notebook, Builder, Admin)", !/Schedule|Mom.s Day|Chores|Notebook|Builder|>Admin</.test(kid));
  ok("the CSS hides the app's header and nav bars for the edition only (body.env-site)", w.G.created.some(e=>e.id==="envs-css"&&/body\.env-site #app-header/.test(e.textContent)&&/body\.env-site #nav-tabs/.test(e.textContent)));
  ok("the kid's Star Store is closed with the one-line note; the stars count shows", (()=>{ w.envsView("store"); return /Star Store · closed here/.test(w.G.content)&&/stars buy things Mom sets up/.test(w.G.content)&&/⭐ 27/.test(w.G.content); })());
  ok("the kid's Games view uses the app's own games sub-menu and body (🏋️ on the Envirothon decks)", (()=>{ w.envsView("games"); return /fake-games-sub/.test(w.G.content)&&/fake-games-body/.test(w.G.content); })());
  ok("the kid's ⚙️ has sign out but no Color card (CPGEAR 2026-10-28: the color is the class's), no PIN (the parent has the PIN) and no family editing", (()=>{ w.envsView("settings"); const h=w.G.content; return !/Color|envsSetColor|type="color"/.test(h)&&/Sign out/.test(h)&&!/PIN/.test(h)&&!/Add kid|Remove/.test(h); })()); }

console.log("\n── stars per finished sitting ──");
{ const w=world({fam:FAM}); w._envs.role="kid"; w._envs.kid="maya";
  ok("live: a finished sitting banks ENVS_STARS ("+3+") through bankDirect, once", w.envSiteSittingDone("maya",{total:8,correct:7,miss:1})===true&&w.G.bankWrites.length===1&&w.G.bankWrites[0][1]===w.ENVS_STARS&&w.ENVS_STARS===3);
  ok("another kid's sitting, an empty sitting, or dry run → nothing", w.envSiteSittingDone("other",{total:8})===false&&w.envSiteSittingDone("maya",{total:0})===false&&(()=>{ w.G.dry=true; const r=w.envSiteSittingDone("maya",{total:3}); w.G.dry=false; return r===false; })()&&w.G.bankWrites.length===1);
  const d=world({fam:FAM,search:"?demo=1&role=kid"}); d.envSiteDemoBoot(); const before=d._envs.bankDemo; ok("demo: the count goes up on screen, bankDirect is never called", d.envSiteSittingDone("maya",{total:5})===true&&d._envs.bankDemo===before+3&&!d.G.bankWrites); }

console.log("\n── the first signed-in boot enrolls the kid, every stage, through the app's own enroll ──");
{ const w=world({fam:FAM,mastReady:true,unitsReady:true}); w._envs.role="parent"; w._envs.kid="maya"; w._envs.dbUrl="https://howe-envirothon-ramirez.firebaseio.com"; w.initFb();
  ok("initFb hands db the family instance (envSiteDb)", w.G.famDbUrl==="https://howe-envirothon-ramirez.firebaseio.com"&&!!w.db);
  const r=w.envsAutoEnroll(); await w.flush();
  const tx=w.G.writes.find(x=>x[0]==="transaction");
  ok("unit missing → the thin unit record is created by TRANSACTION on unitStudies/nc_envirothon (never a set), the cards hydrated", r===true&&tx&&tx[1]==="unitStudies/nc_envirothon"&&w.G.hydrated===true&&!w.G.writes.some(x=>x[0]==="set"), w.G.writes.map(x=>x[0]+" "+x[1]));
  w.tick();
  ok("then every stage (0–5) is applied and written through _ustApply/_ustWrite, the 🌿 session is made, enrolled/<kid> set, state done", !!w.G.ust&&w.G.ust.filter(x=>x[0]==="apply").length===6&&w.G.ust.filter(x=>x[0]==="write").length===6&&w.G.sessionMade==="maya"&&w._envs.autoEnroll==="done"&&w.unitStudies.nc_envirothon.enrolled.maya===true, w.G.ust);
  ok("a second call does nothing", w.envsAutoEnroll()===false&&w.G.ust.length===12);
  const e=world({fam:FAM,mastReady:true,unitsReady:true}); e._envs.role="kid"; e._envs.kid="maya"; e._envs.dbUrl="x"; e.initFb(); e.unitStudies.nc_envirothon={id:"nc_envirothon",starter:"nc_envirothon",enrolled:{maya:true},stages:[{n:0}],decks:[]};
  ok("already enrolled → nothing", e.envsAutoEnroll()===false&&e.G.writes.length===0&&e._envs.autoEnroll==="done");
  const d=world({fam:FAM,mastReady:true,unitsReady:true,dry:true}); d._envs.role="kid"; d._envs.kid="maya"; d._envs.dbUrl="x"; d.initFb(); ok("dry run → nothing", d.envsAutoEnroll()===false&&d.G.writes.length===0);
  const t=world({fam:FAM,mastReady:true,unitsReady:true}); t._envs.role="teacher"; t._envs.uid="t"; t.initFb(); ok("a teacher → nothing", t.envsAutoEnroll()===false);
  const n=world({fam:FAM,mastReady:false,unitsReady:true}); n._envs.role="kid"; n._envs.kid="maya"; n._envs.dbUrl="x"; n.initFb(); ok("before the mastery node has arrived (MASTGATE) → waits", n.envsAutoEnroll()===false&&n.G.writes.length===0);
  const m=world({fam:FAM,search:"?demo=1&role=kid"}); m.envSiteDemoBoot(); ok("demo → nothing", m.envsAutoEnroll()===false&&m.G.writes.length===0); }

console.log("\n── the rules file, the setup note, the build ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")); const nodes=Object.keys(R.rules).filter(k=>k[0]!==".");
  ok("envirothon/SITE_RULES.json parses; the root is locked (.read/.write false)", R.rules[".read"]===false&&R.rules[".write"]===false);
  ok("it names every node of the site: admins teachers logins classes units students release scores teacherCards boards settings (📦 units: the catalog, 2026-10-28)", ["admins","teachers","logins","classes","units","students","release","scores","teacherCards","boards","settings"].every(n=>nodes.includes(n))&&nodes.length===11, nodes);
  ok("students/<sid>/summary + meta keep the mirror's rules (family login by familyId prefix); release/locked admin-only; logins creatable by the class's teacher for kid/parent only", /beginsWith\(root.child\('logins\/'\+auth.uid\+'\/familyId'\)/.test(R.rules.students.$sid.summary[".write"])&&R.rules.release.locked[".write"]==="root.child('admins/'+auth.uid).val() == true"&&/role'\).val\(\) == 'kid'/.test(R.rules.logins.$uid[".write"]));
  ok("a teacher may edit only her own card (by == auth.uid); whoDrills validates parent|teacher|both", /data.child\('by'\).val\(\) == auth.uid/.test(R.rules.teacherCards.$cid.$deck.$card[".write"])&&/'parent'.*'teacher'.*'both'/.test(R.rules.settings.whoDrills.$cid[".validate"]));
  ok("the family instance rules: allowed/<uid> only, allowed itself not writable", /allowed/.test(R.family.rules[".read"])&&R.family.rules.allowed[".write"]===false);
  const setup=fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8");
  ok("envirothon/SITE_SETUP.md: the project, Email/Password, the rules, admins/<uid>, the host repo (to confirm), App Check later, the per-family instance + seed", /Email\/Password/.test(setup)&&/SITE_RULES\.json/.test(setup)&&/admins\/<that uid>/.test(setup)&&/howe-academy-micro/.test(setup)&&/App Check/.test(setup)&&/Import JSON/.test(setup));
  const list=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","build","strip_list.json"),"utf8"));
  ok("the build never strips ENVSITE / ENVCONSOLE / ENVMIRROR / ENVUNIT / ENVTEST / ENVIDFLASH / ENVDRILLFIRST (not in the strip list; unlisted blocks are kept)", !list.strip.some(s=>/^ENV/.test(s.name)));
  ok("the demo copy generator exists (envirothon/build/make_demo.js) and DEMO_site.html is committed beside it", fs.existsSync(path.join(REPO,"envirothon","build","make_demo.js"))&&fs.existsSync(path.join(REPO,"envirothon","DEMO_site.html")));
  if(fs.existsSync(path.join(REPO,"envirothon","DEMO_site.html"))){ const demo=fs.readFileSync(path.join(REPO,"envirothon","DEMO_site.html"),"utf8");
    ok("DEMO_site.html: inline config with edition + demo, no family-config.js tag, no cache-bust redirect, the blocks inside, no Howe kid in its roster", /edition:"envirothon"/.test(demo)&&/demo:true/.test(demo)&&!/<script src="family-config.js">/.test(demo)&&!/location\.hostname==='localhost'\|\|location\.hostname==='127\.0\.0\.1'\)return;var s=document\.documentElement\.outerHTML/.test(demo)&&/cache-bust redirect removed/.test(demo)&&demo.indexOf("// ENVSITE_START")>0&&demo.indexOf("// ENVCONSOLE_START")>0&&!/id:"(lincoln|ellis|lucy|julian)"/.test(demo.slice(0,demo.indexOf("// ENVSITE_START")).slice(demo.indexOf("window.HA_FAMILY"),demo.indexOf("window.HA_FAMILY")+800))); } }

console.log("\n── 📝 the demo shows the check-in rules (2026-10-28): the real forms inline, Maya's three stations, the teacher's Open the final ──");
{ const LIB=require(path.join(REPO,"envirothon.js")), DEMO=path.join(REPO,"envirothon","DEMO_site.html"); const m0=fs.existsSync(DEMO)?fs.statSync(DEMO).mtimeMs:0;
  const {buildDemo}=require(path.join(REPO,"envirothon","build","make_demo.js"));
  const html=buildDemo(src,"test",LIB.tests), i=html.indexOf("window.HoweEnvirothon={"), app=html.indexOf("// ENVSITE_START"), end=html.indexOf("</script>",i), scr=html.slice(html.lastIndexOf("<script>",i)+8,end);
  ok("make_demo inlines HoweEnvirothon.tests as ONE small <script> before the app's script — no cards (each question's `cards` is only its §8.4 link list, 📚 CPCARDSSEE), no envirothon.js tag, under 120 KB more", i>0&&i<app&&(html.match(/window\.HoweEnvirothon=\{/g)||[]).length===1&&!/"def":|"unit":/.test(scr)&&!/<script src="envirothon\.js/.test(html)&&html.length-src.length<120000, html.length-src.length);
  { const {demoBrowse}=require(path.join(REPO,"envirothon","build","make_demo.js")), b=demoBrowse(), h2=buildDemo(src,"test",LIB.tests,b), j=h2.indexOf("window.HoweUnitsDemo"), s2=h2.slice(h2.lastIndexOf("<script>",j)+8,h2.indexOf("</script>",j)), sb2={}; new Function("window",s2)(sb2);
    const U=sb2.HoweUnitsDemo&&sb2.HoweUnitsDemo.nc_envirothon, n=d=>d.reduce((s,x)=>s+x.cards.length,0), pick=c=>JSON.stringify([c.order,c.name,c.def,c.group,c.concept,c.src,!!c.core,c.item||"",c.info||"",c.kind]);
    ok("📚 CPCARDSSEE: with the browse copy, make_demo adds ONE more <script> before the app's (window.HoweUnitsDemo) that unpacks to every card of envirothon.js, field for field — and HoweEnvirothon still holds the questions only", j>0&&j<h2.indexOf("// ENVSITE_START")&&(h2.match(/window\.HoweUnitsDemo=window\.HoweUnitsDemo/g)||[]).length===1&&!!U&&n(U.unit.decks)===n(LIB.unit.decks)&&U.unit.decks.every((d,di)=>d.key===LIB.unit.decks[di].key&&d.cards.every((c,ci)=>pick(c)===pick(LIB.unit.decks[di].cards[ci])))&&h2.indexOf("HoweUnitsDemo")>h2.indexOf("window.HoweEnvirothon={"), [j,n(U?U.unit.decks:[])]); }
  const sb={}; new Function("window",scr)(sb);
  ok("…it evaluates to exactly envirothon.js's forms (and nothing else)", JSON.stringify(sb.HoweEnvirothon.tests)===JSON.stringify(LIB.tests)&&sb.HoweEnvirothon.demo===true&&!sb.HoweEnvirothon.unit);
  ok("building it in a test writes no file (DEMO_site.html untouched; only `node make_demo.js` writes)", (fs.existsSync(DEMO)?fs.statSync(DEMO).mtimeMs:0)===m0);
  const d=world({fam:FAM,search:"?demo=1&role=kid",envt:true,lib:{demo:true,tests:LIB.tests}}); d.envSiteDemoBoot(); d.renderAll(); const E=d.envt, u=d.unitStudies.nc_envirothon, K="maya", start=()=>E.envtStartHtml(K,{sid:"envirothon"});
  ok("Maya: Forestry graduated, as before", !!E.envtStatus(u,K,"forestry").graduated);
  ok("Maya: Aquatics sent out, check-in not taken → its cards wait; the 🌿 start shows the check-in with 'Take the check-in first — then the cards open.'", E.envtWaitsForCheckin(K,"Aquatic Ecology · Terms")&&E.envtStatus(u,K,"aquatics").pre.open&&/Aquatic Ecology check-in/.test(start())&&/Take the check-in first — then the cards open\./.test(start())&&!E.envtWaitsForCheckin(K,"General Concepts · Terms")&&!E.envtWaitsForCheckin(K,"Soils and Land Use · Terms"));
  ok("Maya: Soils check-in taken, final closed — 'Final opens when every core card is learned · 2 of 4'", !E.envtStatus(u,K,"soils").post.open&&E.envtCoreLine(K,"soils")==="Final opens when every core card is learned · 2 of 4");
  d.envsView("scores"); ok("…on her Scores", /Final opens when every core card is learned · 2 of 4/.test(d.G.content));
  d.envsDemoGo("parent"); ok("…and on the parent's page", /Final opens when every core card is learned · 2 of 4/.test(d.G.content));
  d.envsDemoGo("kid");
  ok("the demo can TAKE the Aquatics check-in with the real 14 questions", E.envtOpen(K,"aquatics","pre")===true&&E.state.form.items.length===LIB.tests.aquatics.pre.items.length);
  E.state.form.items.forEach(it=>{ (Array.isArray(it.ans)?it.ans:[it.ans]).forEach(x=>E.envtPick(x)); E.envtNext(); });
  const ov=()=>{ const a=d.G.created.filter(e=>e.id==="envtest-ov"); return a.length?a[a.length-1].innerHTML:""; };
  ok("…scored, 'Demo — nothing saved', nothing written; then the Aquatics cards flow", E.state.done&&E.state.done.saved===false&&/Demo — nothing saved/.test(ov())&&d.G.writes.length===0&&!E.envtWaitsForCheckin(K,"Aquatic Ecology · Terms")&&!!d.masteryData.maya_tests.aquatics.pre);
  E.envtClose();
  d.envsDemoGo("teacher"); d.envcView("student","ramirez_maya");
  ok("teacher: Maya's student page offers 📝 Open the final · Soils (her final is closed)", /envcFinalFor\('ramirez_maya','soils'\)/.test(d.G.content));
  const n0=d._envs.writes.length; d.envcFinalFor("ramirez_maya","soils"); await d.flush();
  ok("…demo: 'would write' release/<cid>/final/students/ramirez_maya/soils, nothing written, and it takes effect for Maya at once (postOpen by the teacher)", d._envs.writes.length===n0+1&&d._envs.writes[n0].path==="release/ms-science-2026/final/students/ramirez_maya/soils"&&d.G.writes.length===0&&d.masteryData.maya_tests.soils.postOpen&&d.masteryData.maya_tests.soils.postOpen.by==="uid_teacher_demo");
  d.envsDemoGo("kid");
  ok("back as Maya: the Soils final is open on her 🌿 start and she can take it (the real Soils post-test)", E.envtStatus(u,K,"soils").post.open&&/Soils\/Land Use final/.test(start())&&E.envtOpen(K,"soils","post")===true&&E.state.form.items.length===LIB.tests.soils.post.items.length);
  E.envtClose();
  d.envsDemoGo("teacher"); d.envcView("send"); d.envcSendPick("cei"); d.envcFinalOut(); await d.flush();
  ok("Send out ▸ CEI ▸ Open the final (whole class): demo 'would write' final/all/cei, and Maya's CEI final opens too; still nothing written", d._envs.writes.some(x=>x.op==="update"&&x.val&&x.val["release/ms-science-2026/final/all/cei"])&&d.masteryData.maya_tests.cei&&d.masteryData.maya_tests.cei.postOpen&&d.G.writes.length===0); }

console.log("\n── 🔊 the read-aloud switch in the demo: the 🌿 start, the check-in screen, the kid's ⚙️ — memory only ──");
{ const LIB=require(path.join(REPO,"envirothon.js"));
  const d=world({fam:FAM,search:"?demo=1&role=kid",envt:true,lib:{demo:true,tests:LIB.tests}}); d.envSiteDemoBoot(); d.renderAll(); const E=d.envt, K="maya";
  const ov=()=>{ const a=d.G.created.filter(e=>e.id==="envtest-ov"); return a.length?a[a.length-1].innerHTML:""; };
  ok("demo Maya starts Off; the 🌿 start draws the switch", E.envRaMode(K)==="off"&&/envra-toggle/.test(E.envRaStartHtml(K,{sid:"envirothon"}))&&/envRaSet\('maya','off'\)[^>]*aria-pressed="true"/.test(E.envRaStartHtml(K,{sid:"envirothon"})));
  d.envsView("settings"); ok("the kid's ⚙️ has the switch", /envra-toggle/.test(d.G.content)&&/envRaSet\('maya','auto'\)/.test(d.G.content));
  const r0=d.G.renders; E.envRaSet(K,"auto");
  ok("tapping Auto in the demo: in memory, the page redraws with Auto pressed, NOTHING written (no db, no envsWrite)", E.envRaMode(K)==="auto"&&d.masteryData.maya_settings.envReadAloud==="auto"&&d.G.renders>r0&&/envRaSet\('maya','auto'\)[^>]*aria-pressed="true"/.test(d.G.content)&&d.G.writes.length===0);
  d.envsDemoGo("parent"); d.envsView("settings"); ok("the parent's ⚙️ has no switch", !/envra-toggle/.test(d.G.content));
  d.envsDemoGo("kid"); d.G.said=[];
  ok("Auto: the Aquatics check-in opens with the switch + 🔊 Read it, and question 1 and its choices are read", E.envtOpen(K,"aquatics","pre")===true&&/envra-toggle/.test(ov())&&/envRaReadQ\(\)/.test(ov())&&d.G.said.length===1&&d.G.said[0].indexOf(LIB.tests.aquatics.pre.items[0].q)===0&&/ A\. /.test(d.G.said[0]));
  E.envRaSet(K,"off"); E.envtPick(0); E.envtNext();
  ok("switched Off on the check-in screen (memory): question 2 shows silently, the test kept its place; 🔊 Read it still reads", E.envRaMode(K)==="off"&&E.state&&E.state.i===1&&d.G.said.length===1&&(E.envRaReadQ(),d.G.said.length===2)&&d.G.writes.length===0);
  E.envtClose(); ok("nothing written anywhere in the demo", d.G.writes.length===0); }
};
run().then(()=>{ console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0); }).catch(e=>{ console.error(e); process.exit(1); });

}
