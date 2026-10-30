/*
 * Node tests — 📌 THE ASSIGNMENT AND 🚀 GETTING AHEAD on the class site (DESIGN_class_platform_2026-10-28.md, "Adrienne's asks, 2026-10-30
 * (from Brittany)" part 1). Her words 2026-10-30: "the pace and what she sends out is kind of like the assignment, but they can always get
 * ahead and study areas also. And I think that needs to be reflected in the points."
 *   · how it is hooked: one block right after CPSENDEARLY_END, every line outside it tagged 🚀 CPAHEAD and typeof-guarded;
 *   · the switch (pure): on by default, the student's own wins; Adrienne's lock (CPLOCKS part + ENVCLASSSET's settings/locks);
 *   · THE POINTS (pure): only cards started after the day's assignment was done (past base) AND climbed out of ⭐ learning count, once, on the
 *     day they climbed; effort + 2 each this week; the team keeps its gain and adds a labelled 🚀 bonus (1 per 10 cards per member);
 *   · the assignment (pure): N new · M reviews, ✓ when done, Reviews a sitting, a day that isn't a study day, the 🚀 extra;
 *   · the REAL mstPile on the REAL NC Envirothon unit: nothing set = the same pile; a section opened early gives nothing to the assignment and
 *     takes no focus seat; 🚀 Keep going = up to the extra more new cards, the opened section first; seats for cards started ahead later;
 *     Howe / Lincoln untouched;
 *   · the kid's 📌 card, 🚀 Keep going's family record, 🔓 Study ahead's write (envsWrite) + the family update; switch off hides both;
 *   · the console: 🚀 on the grid, the student page, ⚙️ Class settings, one update per tap, the lock; 📅 Pace counts an early section once;
 *   · the rules file.                                                                                    run: node test_cp_ahead.js
 */
const fs=require("fs"), path=require("path");
const REPO=__dirname, src=fs.readFileSync(path.join(REPO,"index.html"),"utf8");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const AH=cut("// CPAHEAD_START","// CPAHEAD_END"), MST=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"), ELIG=cut("function mastBankEligible(kid,cat){","\n}\n");
const NAMES=[...new Set((AH.match(/^function (\w+)\(/mg)||[]).map(x=>x.slice(9,-1)))].concat(["_cpah","CPAH_PART","CPAH_TEAM_PER","CPAH_EFFORT_X"]);
const UNITJ=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));
const SECS=[["general","General Concepts"],["forestry","Forestry"],["soils","Soils and Land Use"],["aquatics","Aquatic Ecology"],["wildlife","Wildlife"],["cei","Current Issue"]];
const secOf=k=>(SECS.find(s=>String(k).indexOf(s[1]+" · ")===0)||[])[0]||null;
const STATIONS=SECS.map(s=>({id:s[0],label:s[1],short:s[1].split(" ")[0],decks:UNITJ.decks.filter(d=>secOf(d.key)===s[0]).map(d=>({key:d.key,core:(d.cards||[]).filter(c=>c.core).length}))}));
const TODAY="20261030";
// one sandbox: the block (optionally the real engine + mastBankEligible), with G's stubs
function box(o){
  o=o||{}; const G=Object.assign({on:true,kid:"k",sid:"fam_k",role:"kid",uid:"u_k",layers:[{},{}],md:{},writes:[],dbw:[],toasts:[],sent:{},started:0,renders:0,con:false,admin:false,cls:null,students:{},locks:{},clsLocks:{}},o);
  const body=`
    let masteryKid=null, mstState=null, mstSid=null, mstDone={x:1}; const masteryData=G.md, unitStudies={};
    const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; const cy=item.cycle||1; return (pn-1)%iv===(cy-1)%iv; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(){ return false; }
    function mastFullBank(kid){ const base={}; let c=masteryData[kid+"_custom_items"]||[]; if(!Array.isArray(c)) c=Object.values(c); c.forEach(ci=>{ if(!ci) return; (base[ci.cat]=base[ci.cat]||[]); if(base[ci.cat].indexOf(ci.name)<0) base[ci.cat].push(ci.name); }); return base; }
    ${o.engine?ELIG:""}
    const ENV_UNIT_ID="nc_envirothon", ENV_SESSION_SID="envirothon"; const _envs={kid:G.kid,sid:G.sid,role:G.role,uid:G.uid,cid:"c1"};
    const _cpshare={sent:G.sent}; const _envc={cid:"c1",cls:G.cls,students:G.students};
    const CPL_PARTS=[{k:"brand"},{k:"plan"}];
    function envSiteOn(){ return !!G.on; } function envsDemo(){ return false; } function envClsLayers(){ return G.layers; }
    function envsStations(){ return G.stations; } function envsStationOfDeck(k){ return G.secOf(k); }
    function mstTodayKey(){ return "${TODAY}"; } function mastGetPrintNum(){ return 400; }
    function mstLogGet(kid,sid){ return (((masteryData.studyLog||{})[kid]||{})[sid]||{})["${TODAY}"]||null; }
    function envsDayKey(ms){ return new Date(ms).toISOString().slice(0,10).replace(/-/g,""); }
    function envsDaysAgo(k,now){ const t=Date.UTC(2026,9,30), m=Date.UTC(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8)); return Math.round((t-m)/86400000); }
    function envsEsc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); } function envsJ(v){ return String(v); }
    function envsToast(m){ G.toasts.push(m); } function envsRe(){ G.renders++; } function mstStart(){ G.started++; }
    function envsWrite(p,v,op){ G.writes.push([op||"set",p,v]); return Promise.resolve(); }
    function envcWrite(p,v,op){ return envsWrite(p,v,op); }
    function envcOn(){ return !!G.con; } function envcAdmin(){ return !!G.admin; } function envcName(s){ return (s.meta&&s.meta.name)||s.sid; }
    function envcStationOpen(sid,st){ return ((G.open||{})[sid]||{})[st.id]||""; }
    function cpLocked(p){ return !!G.clsLocks[p]; } function envClsLocked(n){ return !!G.locks[n]; } function cpLockName(){ return "Adrienne"; } function cpLockSet(p,on){ G.lockSet=[p,on]; return true; }
    function envClsMem(scope,part,upd){ G.mem=[scope,part,upd]; }
    function envtStation(s){ return s!=="general"; }
    const db=G.live?{ref(p){ return {set(v){ G.dbw.push(["set",p,v]); },update(v){ G.dbw.push(["update",p,v]); }}; }}:null; function _dryRun(){ return false; }
    ${o.pre||""}
    ${AH}
    ${o.engine?MST:""}
    ${o.post||""}
    return { ${NAMES.join(", ")}${o.engine?", mstPile, mstSessions":""}, masteryData };`;
  G.stations=G.stations||STATIONS; G.secOf=secOf;
  const X=new Function("G",body)(G); X.G=G; return X; }

const deckOf=k=>UNITJ.decks.find(d=>d.key===k);
const FT="Forestry · Terms", FF="Forestry · Facts", ST="Soils and Land Use · Terms", WT=STATIONS.find(s=>s.id==="wildlife").decks[0].key, WALL=STATIONS.find(s=>s.id==="wildlife").decks.map(d=>d.key);
// a student with Forestry + Soils open (some cards on the ladder, some learning), Wildlife held
function kidMd(sess,extra){
  const k="k", decks=[FT,ST].concat(WALL), md={[k]:[],[k+"_custom_items"]:[],[k+"_settings"]:{cat_hold:Object.fromEntries(WALL.map(d=>[d,true]))},[k+"_sessions"]:{envirothon:Object.assign({name:"Envirothon",kind:"deck",decks,who:"solo",newPerDay:5,passes:2,order:"bank",maxCards:25,focusDecks:2},sess||{})}};
  let id=0; decks.forEach(dk=>{ const cs=deckOf(dk).cards; cs.forEach(c=>md[k+"_custom_items"].push({cat:dk,name:c.name,def:c.def})); if(WALL.indexOf(dk)>=0) return;
    cs.slice(0,3).forEach(c=>md[k].push({id:"r"+(++id),subject:dk,prompt:c.name,status:"active",tier:"every_other_day",next_due:0,cycle:1}));
    cs.slice(3,5).forEach(c=>md[k].push({id:"l"+(++id),subject:dk,prompt:c.name,status:"introduction",tier:"daily",tally_dots:1,cycle:1})); });
  return Object.assign(md,extra||{}); }
const pileOf=(X,log)=>X.mstPile("k","envirothon",400,log||null);
const secCount=(p)=>{ const o={}; (p.newNames||[]).forEach(n=>{ const s=secOf(n.deck); o[s]=(o[s]||0)+1; }); return o; };

console.log("── how it is hooked ──");
{ const a=src.indexOf("// CPAHEAD_START"), b=src.indexOf("// CPAHEAD_END"), e=src.indexOf("// CPSENDEARLY_END\n");
  ok("one CPAHEAD block, IMMEDIATELY after CPSENDEARLY_END", a>0&&b>a&&src.indexOf("// CPAHEAD_START",a+1)<0&&e+"// CPSENDEARLY_END\n".length===a);
  ok("the header carries her words, her three picks and the date", /reflected in the\s*\/\/\s*points|reflected in the points/.test(AH.slice(0,1500).replace(/\n\/\/ /g," "))&&/2026-10-30/.test(AH.slice(0,300))&&/ANY section/.test(AH)&&/ON by\s*\/\/?\s*default|ON by default/.test(AH.replace(/\n\/\/ /g," "))&&/count double/.test(AH));
  ok("no 🔀, no Howe kid name as a code literal", AH.indexOf("\u{1F500}")<0&&!/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(AH));
  const hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/🚀 CPAHEAD/.test(l));
  ok("its hook lines outside the block are each tagged 🚀 CPAHEAD and typeof-guarded ("+hooks.length+")", hooks.length>=13&&hooks.every(l=>/typeof cpAhead\w+ ?=== ?"function"/.test(l)), hooks.map(l=>l.trim().slice(0,80)));
  ok("…in mastBankEligible, mstPile (sessions + focus), renderMastStudy, envSummary, the boards (compute + html), envsReadShared, the grid, the student page, ⚙️ Class settings, 📅 Pace and the demo data",
    ["cpAheadBank(kid,cat,all)","cpAheadSessions(kid, sessions)","cpAheadFocus(kid, session, focusDecks, started, fresh)","cpAheadStartHtml(kid,session,pile,todayLog)","cpAheadSum(kid,M,u)","cpAheadBoards(students,teamList,effort,now)","cpAheadTeamPts(t)","cpAheadBadge(r)","cpAheadListen(sdb,re)","cpAheadGridChip(s)","cpAheadStudentHtml(sid)","cpAheadSetHtml()","cpAheadPaceCell(s,st,x)","cpAheadDemoSeed(students,now)"].every(x=>src.indexOf(x)>0));
  ok("writes to the shared instance go through envsWrite / envcWrite; the family database only through the targeted db.ref of mastery/<kid>_settings", !/firebase\./.test(AH.replace(/^\s*\/\/.*$/mg,""))&&(AH.match(/\bdb\.ref\("([^"]+)"/g)||[]).every(x=>/mastery\//.test(x)));
}

console.log("── the switch ──");
{ const X=box();
  ok("absent everywhere → on (the default)", X.cpAheadAllowed(undefined,undefined)===true);
  ok("the class off → off; the student's own on wins", X.cpAheadAllowed("off",null)===false&&X.cpAheadAllowed("off","on")===true);
  ok("the student's own off wins over the class on", X.cpAheadAllowed("on","off")===false&&X.cpAheadAllowed(null,"off")===false);
  ok("CPLOCKS gains 🚀 getting ahead once", X.cpahLockPart()===0);
  const L=box({layers:null}); ok("live, before the layers arrive, the kid's buttons stay away", L.cpahKidOn()===false);
}

console.log("── the points (pure) ──");
{ const X=box();
  // day 20261020: 3 new (assignment), tap (base 3), 2 extra. Later the two extras are shown; e1 climbs on 20261025, e2 still learning.
  const sh=(n,deck)=>({name:n,deck:deck||FT,result:"shown"}), byDay={"20261020":[sh("a1"),sh("a2"),sh("a3"),{name:"r1",deck:FT,result:"c"},sh("e1"),sh("e2")],"20261021":[sh("e1"),sh("e2"),sh("x9")],"20261025":[sh("e1"),sh("e2")],"20261026":[sh("e2")]};
  const items=[{subject:FT,prompt:"a1",status:"active"},{subject:FT,prompt:"e1",status:"active"},{subject:FT,prompt:"e2",status:"introduction"},{subject:FT,prompt:"x9",status:"active"}];
  ok("the cards first seen on a day, in order (a card still learning from before isn't new)", JSON.stringify(X.cpAheadNewOn(byDay,"20261020").map(c=>c.name))==='["a1","a2","a3","e1","e2"]'&&JSON.stringify(X.cpAheadNewOn(byDay,"20261021").map(c=>c.name))==='["x9"]');
  const C=X.cpAheadCards({"20261020":{base:3}},byDay,items);
  ok("only the cards past base count as started ahead (the assignment's never do)", C.map(c=>c.name).join()==="e1,e2");
  ok("a card counts once it climbed out of ⭐ learning, on its last learning day; one still learning does not", C[0].learned==="20261025"&&C[1].learned===null&&C[1].learning===true);
  ok("a day with no 🚀 record gives nothing (x9 was the assignment's)", X.cpAheadCards({},byDay,items).length===0&&!X.cpAheadCards({"20261020":{base:3}},byDay,items).some(c=>c.name==="x9"));
  ok("a card merely seen (no card on the ladder) never counts", X.cpAheadCards({"20261020":{base:3}},byDay,[]).every(c=>c.learned===null));
  const S=X.cpAheadSumOf(C); ok("summary.ahead = {days:{<day>:n}, total, started}", JSON.stringify(S)==='{"days":{"20261025":1},"total":1,"started":2}');
  const sm=(days,total)=>({summary:{ahead:{days,total}}});
  ok("the effort week = the last 7 days", X.cpAheadWeek({ahead:{days:{"20261030":2,"20261024":3,"20261023":9}}})===5);
  ok("the team bonus = 1 per 10 cards learned ahead", X.cpAheadBonus({ahead:{total:29}})===2&&X.cpAheadBonus({ahead:{total:9}})===0&&X.cpAheadBonus(null)===0);
  const st={a:sm({"20261029":4},25),b:sm({},0),c:{summary:null}}, teams=[{name:"Oaks",members:["a","b"],gain:10},{name:"Pines",members:["c"],gain:11}], eff=[{sid:"b",name:"B",score:20},{sid:"a",name:"A",score:15},{sid:"c",name:"C",score:1}];
  X.cpAheadBoards(st,teams,eff);
  ok("💪 effort: + 2 per card learned ahead this week (it counts double), re-ranked, 🚀 on the row", eff[0].sid==="a"&&eff[0].score===23&&eff[0].ahead===4&&eff[0].aheadPts===8&&eff[1].score===20);
  ok("🏆 team: the gain stays, a labelled bonus is added, the teams rank on both", teams[0].name==="Oaks"&&teams[0].gain===10&&teams[0].bonus===2&&teams[0].pts===12&&teams[1].pts===11&&teams[0].aheadNow===1);
  ok("the team row shows gains + the 🚀 bonus; an old board (no bonus fields) reads as before", /10 from gains \+ 🚀 2 bonus/.test(X.cpAheadTeamLine(teams[0]))&&X.cpAheadTeamPts({gain:7})===7&&X.cpAheadTeamLine({gain:7})==="");
  ok("the boards' words say how it works (and never a score per student)", /every 10 cards/.test(X.cpAheadTeamNote())&&/counts double: \+2/.test(X.cpAheadEffNote())&&!/acc|right \(14|test \d/.test(X.cpAheadTeamNote()+X.cpAheadEffNote()+X.cpAheadTeamLine(teams[0])+X.cpAheadBadge(eff[0])));
}

console.log("── the assignment (pure) ──");
{ const X=box(), A=o=>X.cpAheadAssignOf(o), P=(n,r,l,x)=>Object.assign({newNames:Array(n).fill({}),reviews:Array(r).fill({}),learning:Array(l).fill({})},x||{});
  let a=A({pile:P(5,12,2),log:[],newToday:0}); ok("before the sitting: 5 new · 12 reviews, not done", a.n===5&&a.m===12&&!a.done&&a.newLeft===5&&a.learnLeft===2);
  a=A({pile:P(0,0,0),log:[{result:"c"},{result:"m"},{result:"shown"}],newToday:5}); ok("after it: 5 new · 2 reviews ✓", a.n===5&&a.m===2&&a.done);
  a=A({pile:P(0,12,0,{reviewCap:12,reviewLeft:28}),log:Array(12).fill({result:"c"}),newToday:3}); ok("Reviews a sitting: one capped sitting is the assignment (the rest is CPREVIEW's Keep going)", a.m===12&&a.done);
  a=A({pile:P(0,0,0),log:[],newToday:0}); ok("nothing assigned and nothing due → ✓", a.done&&a.n===0&&a.m===0);
  a=A({pile:P(5,3,0),log:[],newToday:0,studyDay:false}); ok("a day that isn't one of the family's study days has no assignment", a.done&&a.off&&a.n===0);
  a=A({pile:P(4,0,0),log:[],newToday:7,rec:{base:5,extra:5,n:5,m:12}}); ok("🚀 running: the assignment as it was, 2 of 5 extra started, 3 left", a.done&&a.extra&&a.n===5&&a.m===12&&a.extraUsed===2&&a.extraLeft===3);
}

console.log("── the real engine (mstPile on the NC Envirothon unit) ──");
{ const without=box({engine:true,md:kidMd(),pre:"",post:""}), base=pileOf(without);
  const plain=src.replace(/  if \(typeof cpAheadSessions[^\n]*\n/,"").replace(/    if \(typeof cpAheadFocus[^\n]*\n/,"");
  ok("the engine pile gives the assignment's new cards from Forestry / Soils only (Wildlife is held)", base.newNames.length===5&&!secCount(base).wildlife, secCount(base));
  // the same pile with the block's hooks removed from the engine
  const MST0=plain.slice(plain.indexOf("// ── MST_ENGINE_START ──"),plain.indexOf("// ── MST_ENGINE_END ──"));
  const noHook=new Function("G",`const masteryData=G.md; let masteryKid=null; const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; const cy=item.cycle||1; return (pn-1)%iv===(cy-1)%iv; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(){ return false; }
    function mastFullBank(kid){ const base={}; (masteryData[kid+"_custom_items"]||[]).forEach(ci=>{ (base[ci.cat]=base[ci.cat]||[]).push(ci.name); }); return base; }
    ${ELIG.replace(/  if\(typeof cpAheadBank[^\n]*\n/,"")} const ENV_SESSION_SID="envirothon"; ${MST0} return {mstPile};`)({md:kidMd()});
  const p0=noHook.mstPile("k","envirothon",400,null);
  ok("nothing set: byte-identical to the engine without this block", JSON.stringify(p0)===JSON.stringify(base));
  const howe=box({engine:true,on:false,md:kidMd(),layers:[{},{}]}); const hmd=howe.masteryData; hmd.k_settings.ahead_days={[TODAY]:{base:0,shown:0,extra:20}};
  ok("Howe (no edition): a 🚀 record changes nothing", JSON.stringify(pileOf(howe))===JSON.stringify(p0));
  const linc=box({engine:true,kid:"lincoln",md:kidMd(),sent:{}}); linc.masteryData.k_settings.ahead_days={[TODAY]:{base:0,shown:0,extra:20}};
  ok("Lincoln / any kid that isn't the site's own: the same pile", JSON.stringify(pileOf(linc))===JSON.stringify(p0));
  // Wildlife opened early (its holds cleared): no new cards to the assignment, no focus seat taken
  const mineBox=box({engine:true,md:(()=>{ const m=kidMd(); m.k_settings.cat_hold={}; return m; })(),pre:"",post:"_cpah.mine={wildlife:{at:5,by:'u_k'}};"});
  const pE=pileOf(mineBox);
  ok("a section opened early gives NOTHING to the assignment: the same 5 new from Forestry / Soils", pE.newNames.length===5&&!secCount(pE).wildlife&&JSON.stringify(pE.newNames)===JSON.stringify(base.newNames), secCount(pE));
  ok("…its bank is empty outside the extra", mineBox.cpAheadBank("k",WT,["x"]).length===0&&mineBox.cpAheadBank("k",FT,["x"]).length===1);
  // 🚀 running today: the new cards already shown + the extra, no seat limit, the opened section first
  mineBox.masteryData.k_settings.ahead_days={[TODAY]:{base:5,shown:9,extra:5,n:5,m:6}};
  const log={items:[...Array(9)].map((_,i)=>({id:"s"+i,name:"s"+i,deck:FT,result:"shown"}))};
  const pX=pileOf(mineBox,log);
  ok("🚀 + 🔓 Wildlife: exactly the extra (5) more new cards, Wildlife's first", pX.newNames.length===5&&secCount(pX).wildlife===5, secCount(pX));
  const goBox=box({engine:true,md:kidMd()}); goBox.masteryData.k_settings.ahead_days={[TODAY]:{base:5,shown:9,extra:5}};
  const pG=pileOf(goBox,log); ok("🚀 Keep going alone: 5 more new cards from the sections sent out", pG.newNames.length===5&&!secCount(pG).wildlife, secCount(pG));
  // the two focus decks have nothing left to hand out (every card of them already started): Keep going still gives the extra from the others
  const exMd=kidMd({decks:[FT,ST,FF]}); exMd.k_custom_items=exMd.k_custom_items.filter(c=>c.cat===FF||exMd.k.some(i=>i.subject===c.cat&&i.prompt===c.name));
  deckOf(FF).cards.forEach(c=>exMd.k_custom_items.push({cat:FF,name:c.name,def:c.def}));
  const exBox=box({engine:true,md:exMd}), exLog={items:[{id:"x",name:"x",deck:FT,result:"shown"}]};
  ok("(without the extra, the focus decks with nothing left hand out nothing — the engine's own rule)", pileOf(exBox,exLog).newNames.length===0);
  exBox.masteryData.k_settings.ahead_days={[TODAY]:{base:0,shown:1,extra:5}};
  const pEx=pileOf(exBox,exLog); ok("🚀 Keep going when the focus decks are spent: the 5 come from the session's other decks", pEx.newNames.length===5&&pEx.newNames.every(n=>n.deck===FF), pEx.newNames.map(n=>n.deck));
  const offBox=box({engine:true,md:kidMd(),layers:[{study:{getAhead:"off"}},{}]}); offBox.masteryData.k_settings.ahead_days={[TODAY]:{base:5,shown:9,extra:5}};
  ok("the switch off: the extra stops (no more new today)", pileOf(offBox,log).newNames.length===0);
  // later days: the cards started ahead that are still learning get seats on top of the class's
  const seatMd=kidMd({maxCards:10}); seatMd.k_settings.ahead_days={"20261028":{base:0}};
  const ahead=deckOf(FT).cards.slice(10,16).map((c,i)=>({id:"a"+i,subject:FT,prompt:c.name,status:"introduction",tier:"daily",tally_dots:2,cycle:1}));
  seatMd.k=seatMd.k.concat(ahead); seatMd.studyLog={k:{envirothon:{"20261028":{items:ahead.map(a=>({id:a.id,name:a.prompt,deck:FT,result:"shown"}))}}}};
  const SB=box({engine:true,md:seatMd}); const sess=SB.mstSessions("k"); SB.cpAheadSessions("k",sess);
  ok("later days: + one seat per card started ahead still learning (6), so the assignment still fits", sess[0].maxCards===16&&SB.cpahLearningN("k")===6);
  const nb=box({engine:true,on:false,md:seatMd}); const s2=nb.mstSessions("k"); nb.cpAheadSessions("k",s2); ok("…not off the site", s2[0].maxCards===10);
}

console.log("── the kid's 📌 card, 🚀 Keep going, 🔓 Study ahead ──");
{ const mk=(o)=>box(Object.assign({live:true,md:kidMd(),pre:`function mstSessions(){ return [{sid:"envirothon",kind:"deck",newPerDay:5,decks:[]}]; } function mstPile(){ return (G.md.k_settings.ahead_days&&G.pileAfter)||G.pile; }`},o));
  let K=mk(); K.G.pile={newNames:[1,2],reviews:[1],learning:[]};
  let h=K.cpAheadStartHtml("k",{sid:"envirothon",kind:"deck",newPerDay:5},K.G.pile,null);
  ok("before it's done: 📌 2 new · 1 review, what's left, no 🚀 / 🔓", /Today’s assignment: 2 new · 1 review/.test(h)&&/to go/.test(h)&&!/cpAheadGo\(\)|cpAheadOpen/.test(h));
  K.G.pile={newNames:[],reviews:[],learning:[]}; K.masteryData.studyLog={k:{envirothon:{[TODAY]:{items:[{name:"n1",deck:FT,result:"shown"},{name:"r",deck:FT,result:"c"}]}}}};
  h=K.cpAheadStartHtml("k",{sid:"envirothon",kind:"deck",newPerDay:5},K.G.pile,K.masteryData.studyLog.k.envirothon[TODAY]);
  ok("done: ✓, 🚀 Keep going · up to 5 more, 🔓 Study ahead with Wildlife as next up", /✓ done/.test(h)&&/Keep going · up to 5 more new cards/.test(h)&&/Wildlife<\/b> <span class="cpah-next">next up/.test(h)&&(h.match(/cpAheadOpen\(/g)||[]).length===1, h.slice(0,900));
  ok("…and says how the points work", /counts double/.test(h)&&/climbs out of/.test(h));
  K.G.pileAfter={newNames:[{}],reviews:[],learning:[]};
  ok("🚀 Keep going: ONE family write mastery/k_settings/ahead_days/<today> = {base, shown, extra, n, m, at}, then a sitting", K.cpAheadGo()===true&&K.G.dbw.length===1&&K.G.dbw[0][1]==="mastery/k_settings/ahead_days/"+TODAY&&K.G.dbw[0][2].base===1&&K.G.dbw[0][2].shown===1&&K.G.dbw[0][2].extra===5&&K.G.started===1, K.G.dbw);
  ok("…a second tap writes nothing new", (K.cpAheadGo(),K.G.dbw.length===1));
  ok("🔓 Wildlife: students/<sid>/ahead/wildlife = {at, by} through envsWrite, and ONE family update clearing its decks' holds", K.cpAheadOpen("wildlife")===true&&K.G.writes.some(w=>w[1]==="students/fam_k/ahead/wildlife"&&w[2].by==="u_k"&&w[2].at>0)&&K.G.dbw.some(w=>w[0]==="update"&&w[1]==="mastery/k_settings"&&WALL.every(d=>w[2]["cat_hold/"+d]===null))&&!Object.keys(K.masteryData.k_settings.cat_hold).length);
  ok("…the toast says its check-in comes first; it leaves the 🔓 list and shows as studying early", /check-in comes first/.test(K.G.toasts.join("|"))&&!K.cpAheadList("k").some(x=>x.sec==="wildlife")&&K.cpahEarly("k")[0].sec==="wildlife");
  const N=mk(); N.G.pile={newNames:[1],reviews:[],learning:[]}; ok("🔓 / 🚀 before the assignment is done: refused, nothing written", N.cpAheadOpen("wildlife")===false&&N.cpAheadGo()===false&&!N.G.writes.length&&!N.G.dbw.length);
  const O=mk({layers:[{study:{getAhead:"off"}},{}]}); O.G.pile={newNames:[],reviews:[],learning:[]};
  h=O.cpAheadStartHtml("k",{sid:"envirothon",kind:"deck"},O.G.pile,null);
  ok("the switch off: ✓ shows, the 🚀 / 🔓 buttons are gone, and their taps do nothing", /✓ done/.test(h)&&!/cpAheadGo|cpAheadOpen/.test(h)&&O.cpAheadOpen("wildlife")===false);
  ok("a section the teacher has since sent out is an ordinary section again (not early)", (()=>{ const X=box({sent:{k:{wildlife:5}},post:"_cpah.mine={wildlife:{at:1}};"}); return X.cpahEarly("k").length===0&&X.cpAheadBank("k",WT,["a"]).length===1; })());
  const sy=box({live:true,md:kidMd(),post:"_cpah.mine={wildlife:{at:1}};"}); ok("a record made on another device: the decks still held here open (idempotent)", sy.cpahSync("k")===WALL.length*2&&sy.cpahSync("k")===0);
  ok("the summary's part: the site kid only (Lincoln / Howe: null)", box({kid:"k"}).cpAheadSum("lincoln",kidMd())===null&&box({on:false}).cpAheadSum("k",kidMd())===null&&box().cpAheadSum("k",kidMd())===null);
}

console.log("── the console ──");
{ const students={fam_k:{meta:{name:"Kay L."},ahead:{wildlife:{at:Date.UTC(2026,9,30),by:"u_k"}},summary:{ahead:{days:{"20261029":3},total:23}}},fam_j:{meta:{name:"Jo M."}}};
  const C=box({con:true,cls:{settings:{}},students,open:{fam_k:{forestry:"all"}}});
  ok("🚀 by the name on the grid (the early section and this week's count); nothing for a student with neither", /🚀 Wildlife \+3/.test(C.cpAheadGridChip(Object.assign({sid:"fam_k"},students.fam_k)))&&C.cpAheadGridChip({sid:"fam_j"})==="");
  let h=C.cpAheadStudentHtml("fam_k");
  ok("the student page: studying ahead, the counts, the team bonus, their own switch", /Studying ahead: <b>Wildlife/.test(h)&&/<b>3<\/b> this week/.test(h)&&/<b>23<\/b> in all/.test(h)&&/team bonus 🚀 2/.test(h)&&/As the class/.test(h));
  ok("a section sent out to them is no longer 'ahead'", box({con:true,cls:{},students,open:{fam_k:{wildlife:"all"}}}).cpahEarlyOf(Object.assign({sid:"fam_k"},students.fam_k)).length===0);
  h=C.cpAheadSetHtml(); ok("⚙️ Class settings: 🚀 Getting ahead, on by default, the path, how the points work", /🚀 Getting ahead/.test(h)&&/\(the default\)/.test(h)&&/classes\/c1\/settings\/study\/getAhead/.test(h)&&/counts double|count double|double on the/.test(h)&&/\+1 for every 10/.test(h));
  ok("the class off: ONE update of classes/c1/settings/study {getAhead:'off'} through envcWrite", C.cpAheadSet("class","off")===true&&JSON.stringify(C.G.writes[0])==='["update","classes/c1/settings/study",{"getAhead":"off"}]');
  ok("one student: students/<sid>/settings/study {getAhead}; As the class clears it", C.cpAheadSet("fam_k","on")&&C.cpAheadSet("fam_k",null)&&JSON.stringify(C.G.writes.slice(1))==='[["update","students/fam_k/settings/study",{"getAhead":"on"}],["update","students/fam_k/settings/study",{"getAhead":null}]]');
  const L=box({con:true,cls:{},students,clsLocks:{getAhead:true}});
  ok("Adrienne's lock (CPLOCKS): the teacher's tap is refused, nothing written; the card says who set it", L.cpAheadSet("class","off")===false&&!L.G.writes.length&&/set by Adrienne/.test(L.cpAheadSetHtml()));
  const L2=box({con:true,cls:{},students,locks:{getAhead:true}}); ok("…ENVCLASSSET's settings/locks/getAhead locks it too", L2.cpAheadLocked()&&L2.cpAheadSet("fam_k","off")===false);
  const AD=box({con:true,admin:true,cls:{},students,clsLocks:{getAhead:true}}); ok("Adrienne herself: her writes go through, and her 🔒 is CPLOCKS's switch", AD.cpAheadSet("class","off")===true&&/cpAheadLock\(false\)/.test(AD.cpAheadSetHtml())&&AD.cpAheadLock(true)&&JSON.stringify(AD.G.lockSet)==='["getAhead",true]');
  const st=STATIONS.find(s=>s.id==="wildlife"), cell=C.cpAheadPaceCell(Object.assign({sid:"fam_k"},students.fam_k),st,{learned:12,learning:4,est:false});
  ok("📅 Pace: an early section → should 0, is = its learned core cards, marked 🚀 ahead", cell&&cell.should===0&&cell.is===12&&cell.mark.k==="ahead"&&/🚀 \+12/.test(cell.mark.t)&&cell.total>0);
  ok("…a section not opened early: no cell (the row as before)", C.cpAheadPaceCell({sid:"fam_j"},st,{learned:0})===null);
  const row=cut("function cppRow(","\n}\n");
  ok("cppRow counts it once: is += its learned, from today in 'needs from now', and only while it isn't sent out (!open)", /if\(!open&&!opt\.parent&&typeof cpAheadPaceCell==="function"\)\{ const _a=cpAheadPaceCell\(s,st,x\); if\(_a\)\{ per\[st\.id\]=_a; is\+=_a\.is;[^\n]*return; \} \}/.test(row)&&row.indexOf("cpAheadPaceCell")<row.indexOf("if(!open){"));
  const D={ramirez_maya:{summary:{}},morales_avery:{summary:{}}}; C.cpAheadDemoSeed(D,Date.UTC(2026,9,30,15));
  ok("the demo: Maya and Avery have learned cards ahead (the bonus and 🚀 on the boards)", D.ramirez_maya.summary.ahead.total===26&&C.cpAheadWeek(D.ramirez_maya.summary)===12&&C.cpAheadBonus(D.morales_avery.summary)===1);
}

console.log("── the rules file ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")), S=R.rules.students.$sid, A=S.ahead.$sec;
  ok("students/<sid>/ahead/<section>: the family may CREATE its own while the switch is on; the teacher and admin write or remove", /beginsWith\(root\.child\('logins\/'\+auth\.uid\+'\/familyId'\)/.test(A[".write"])&&/!data\.exists\(\) && newData\.exists\(\)/.test(A[".write"])&&/settings\/study\/getAhead'\)\.val\(\) != 'off'/.test(A[".write"])&&/\/teacher'\)\.val\(\) == auth\.uid/.test(A[".write"])&&/admins/.test(A[".write"]));
  ok("…{at:number, by == the writer}, nothing else, a section-shaped key", /by'\)\.val\(\) == auth\.uid/.test(A[".validate"])&&A.$other[".validate"]===false&&/\$sec\.matches/.test(A[".validate"]));
  const c=R.rules.classes.$cid.settings.$part.getAhead, s=S.settings.$part.getAhead;
  ok("getAhead (class and student): 'on' | 'off', the teacher refused while locks/getAhead (CPLOCKS) or settings/locks/getAhead is on", /'on'.*'off'/.test(c[".validate"])&&/locks\/getAhead/.test(c[".validate"])&&/settings\/locks\/getAhead/.test(c[".validate"])&&/locks\/getAhead/.test(s[".write"])&&/'on'.*'off'/.test(s[".validate"]));
  ok("_about names CPAHEAD", /CPAHEAD/.test(R._about));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
