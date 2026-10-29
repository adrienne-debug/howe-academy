/*
 * Node tests — 🎚 CPSECTIONS, On · Review only · Off per student per section (DESIGN_class_platform_2026-10-28.md §8.8, §9.1,
 * §13 row 20, §14 Q31; PR 20 of the class platform). Her words 2026-10-28: "kids split up … master of each subject … things should be
 * able to be easily turned off as well. It could keep reviewing what they have in their regular ladder, but no send more in. So there
 * needs to be settings for that."
 *   · how it is hooked: one block, every line outside it tagged 🎚 CPSECTIONS and typeof-guarded;
 *   · the states (pure): the student's own over the class's, "on" kept only to override the class;
 *   · the REAL mstPile (sliced from index.html, with CPCORE and CPSHARE) on the REAL NC Envirothon unit: Review only = no new cards from
 *     that section while its reviews and its learning cards still come; Off = nothing from it; the class-wide state; a student's own "on";
 *     CPSHARE's split passes a Review-only section's share to the On ones;
 *   · BYTE-IDENTICAL REPLAYS: 40 study days of the real engine with and without this block — every Howe kid (no edition), Lincoln (not the
 *     site's kid, even with states in the class record), the site's kid with nothing set, a teacher login — the same pile every day;
 *   · Off skips Mom's / the parent's drill, the games and ID Flash; its check-in and final wait (a taken final keeps its score);
 *   · the kid's live listener, the 🌿 start's line;
 *   · the console: the student page's pills, the grid's column header ▸ For everyone / picked students, one update each through envsWrite,
 *     Adrienne's 🔒 locks/sections and CPLOCKS's plan lock;
 *   · 📅 Pace: a class-wide or a student's Review only / Off section leaves the plan and the row says "review only" / "paused";
 *   · the demo: Teacher ▸ Maya ▸ Soils: Review only ▸ her next 🌿 start has no new Soils cards, the Soils reviews still come;
 *   · Howe: nothing read, written or listened to; the rules file.                                        run: node test_cp_sections.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CORE,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } }
const constLine=n=>{ const m=src.match(new RegExp("const "+n+"=[^\\n]*;")); if(!m) throw new Error("missing const "+n); return m[0]; };
const SEC=cut("// CPSECTIONS_START","// CPSECTIONS_END"), LOCKS=cut("// CPLOCKS_START","// CPLOCKS_END"), REV=cut("// CPREVIEW_START","// CPREVIEW_END"), SHARE=cut("// CPSHARE_START","// CPSHARE_END"), PACE=cut("// CPPACE_START","// CPPACE_END");
const MST=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──"), ELIG=cut("function mastBankEligible(kid,cat){","\n}\n");
const LIB=require(path.join(REPO,"envirothon.js"));
const UNITJ=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","nc_envirothon_unit.json"),"utf8"));
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const SECS=[["general","General Concepts"],["forestry","Forestry"],["soils","Soils and Land Use"],["aquatics","Aquatic Ecology"],["wildlife","Wildlife"],["cei","Current Issue"]];
const secOf=k=>(SECS.find(s=>String(k).indexOf(s[1]+" · ")===0)||[])[0]||null;
const SEC_NAMES="cpSecPaceDetail, CPSEC_STATES, _cpsec, cpSecSite, cpSecEff, cpSecStore, cpSecState, cpSecKidMap, cpSecBank, cpSecItems, cpSecOffItem, cpSecFlash, cpSecTestOff, cpSecListen, cpSecStartNote, cpSecOfStudent, cpSecPaceOpt, cpSecPaceCell, cpSecPaceOut, cpSecSet, cpSecPicked, cpSecEveryone, cpSecGrid, cpSecPick, cpSecHeadHtml, cpSecCellTag, cpSecGridHtml, cpSecStudentHtml, cpSecDemoPile, cpSecDemoHtml";

// ── the engine sandbox: the real study engine + mastBankEligible + CPCORE + CPSHARE + (optionally) this block.
//    site = {on, kid, sid, role, cls (the class record: plan/<section>/state), mine (students/<sid>/sections), layers}
function engine(withBlock,site,md,us){
  site=site||{};
  const E=new Function("masteryData","unitStudies","window","site","SECS","secOf",`
    let masteryKid=null; const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
    const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastDrillSettings(){ return {ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}; }
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; const cy=item.cycle||1; return (pn-1)%iv===(cy-1)%iv; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(){ return false; }
    function mastFullBank(kid){ const base={}; let c=masteryData[kid+"_custom_items"]||[]; if(!Array.isArray(c)) c=Object.values(c); c.forEach(ci=>{ if(!ci) return; (base[ci.cat]=base[ci.cat]||[]); if(base[ci.cat].indexOf(ci.name)<0) base[ci.cat].push(ci.name); }); return base; }
    ${ELIG}
    const ENV_UNIT_ID="nc_envirothon", ENV_SESSION_SID="envirothon"; const _envs={kid:site.kid||"",sid:site.sid||"",role:site.role||"",cls:site.cls||null};
    function envSiteOn(){ return !!site.on; } function envsDemo(){ return false; } function envClsLayers(){ return site.layers||[{},{}]; }
    function envsStations(){ return SECS.map(s=>({id:s[0],label:s[1],short:s[1].split(" ")[0],decks:((unitStudies.nc_envirothon||{}).decks||[]).filter(d=>secOf(d.key)===s[0]).map(d=>({key:d.key}))})); }
    function envsStationOfDeck(k){ return secOf(k); }
    ${CORE}
    ${SHARE}
    ${withBlock?SEC:""}
    ${MST}
    ${withBlock?"_cpsec.mine=site.mine||null;":""}
    return { mstPile, mstSessions, _envs, X:${withBlock?"{ "+SEC_NAMES+" }":"null"}, H:{ cpShareSplit, _cpshare } };`)(md,us,{},site,SECS,secOf);
  return E;
}
const deckOf=k=>UNITJ.decks.find(d=>d.key===k);
const US={nc_envirothon:{id:"nc_envirothon",decks:UNITJ.decks}};
const FT="Forestry · Terms", FF="Forestry · Facts", ST="Soils and Land Use · Terms", SF="Soils and Land Use · Facts", AT="Aquatic Ecology · Terms";
// a student with Forestry and Soils open: in each deck some cards on the ladder (due today), some still being learned, the rest new
function kidMd(kid,decks,sess){
  kid=kid||"k"; decks=decks||[ST,FT]; const md={[kid]:[],[kid+"_custom_items"]:[],[kid+"_sessions"]:{envirothon:Object.assign({name:"Envirothon",kind:"deck",decks,who:"solo",newPerDay:6,passes:2,order:"bank",maxCards:0,focusDecks:0},sess||{})}};
  let id=0; decks.forEach(k=>{ const cs=deckOf(k).cards; cs.forEach(c=>md[kid+"_custom_items"].push({cat:k,name:c.name,def:c.def}));
    cs.slice(0,3).forEach(c=>md[kid].push({id:"r"+(++id),subject:k,prompt:c.name,answer:"",status:"active",tier:"every_other_day",next_due:0,cycle:1,consecutive_correct:1}));
    cs.slice(3,5).forEach(c=>md[kid].push({id:"l"+(++id),subject:k,prompt:c.name,answer:"",status:"introduction",tier:"daily",tally_dots:1,cycle:1})); });
  return md; }
const SITE=o=>Object.assign({on:true,kid:"k",sid:"fam_k",role:"kid"},o||{});
const secsOf=(list,f)=>{ const o={}; list.forEach(x=>{ const s=secOf(f(x)); o[s]=(o[s]||0)+1; }); return o; };
const pile=(E,kid,day)=>E.mstPile(kid||"k","envirothon",day||1,null);

// ── the site world (test_env_site.js) with the real engine, CPPACE, CPSHARE and this block
const ENG=[constLine("MAST_TIER_INT"),"const MAST_BANK_MAP={};",
  ...["mastFullBank","mastBankEligible","mastDrillSettings","mastIntroDotsFor","mastIntroMaxFor","mastIsParked","mastStampNextDue","mastIsDue","mastApplyScores"].map(fn),
  "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicShouldPrune(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicMark(){} function mastDynamicClear(){} let mastDynamicCapNotice=false;",
  "function mastGetPrintNum(){ return 400; }",
  MST, "G.eng={ mstSessions, mstPile };"].join("\n");
const XS=SEC+"\nG.sec={ "+SEC_NAMES+" };";
const PX=PACE+"\nG.pace={ _cpp, cpPacePlan, cpNeedPerDay, cppInputs, cppDraft, cppRow, cppDetailHtml, cpPaceFlush, cpPaceHtml };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,cpcore:true,rev:LOCKS+"\n"+REV+"\n"+PX+"\n"+SHARE+"\n"+(o.noSec?"":XS)+"\n"+ENG,now:Date.UTC(2026,9,29,15,0,0)},o.w||{})); w.X=w.G.sec; w.P=w.G.pace; w.E=w.G.eng; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function liveConsole(role){ const w=W(); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true,fam_j:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"},fam_j:{meta:{name:"Jo M.",familyId:"fam",kid:"j"},class:"c1"}}; return w; }

const run=async()=>{
console.log("── how it is hooked ──");
{ const a=src.indexOf("// CPSECTIONS_START"), b=src.indexOf("// CPSECTIONS_END");
  ok("one CPSECTIONS block", a>0&&b>a&&src.indexOf("// CPSECTIONS_START",a+1)<0&&src.indexOf("// CPSECTIONS_END",b+1)<0);
  ok("the header names §8.8, PR 20, her words and the date", /§8\.8/.test(SEC)&&/PR 20/.test(SEC)&&/keep reviewing what they have in their regular ladder, but no send more in/.test(SEC.replace(/\n\/\/ /g," "))&&/2026-10-28/.test(SEC));
  ok("the block only declares (nothing runs at load)", SEC.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  ok("no Howe kid name as a code literal, no 🔀, no direct database call (writes go through envcWrite → envsWrite)", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(SEC)&&SEC.indexOf("\u{1F500}")<0&&!/firebase\.|\bdb\.ref|envsWrite\(|envcMulti\(|\.update\(/.test(SEC.replace(/^\s*\/\/.*$/mg,"")));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🎚 CPSECTIONS/.test(l));
  ok("every line outside the block tagged 🎚 CPSECTIONS is typeof-guarded on a cpSec function", hooks.length>0&&hooks.every(l=>/typeof cpSec\w+ ?=== ?"function"/.test(l)), hooks.filter(l=>!/typeof cpSec\w+ ?=== ?"function"/.test(l)).map(l=>l.trim().slice(0,90)));
  const want=["cpSecBank","cpSecItems","cpSecOffItem","cpSecFlash","cpSecTestOff","cpSecListen","cpSecStartNote","cpSecHeadHtml","cpSecCellTag","cpSecGridHtml","cpSecStudentHtml","cpSecPaceOpt","cpSecPaceCell","cpSecPaceOut"];
  ok("every hook is wired: bank, pile + drill, games ×2, ID Flash, check-in + final, listener, start line, grid ×3, student page, pace ×3", want.every(f=>hooks.some(l=>l.indexOf(f)>=0))&&hooks.filter(l=>/cpSecItems\(/.test(l)).length===2&&hooks.filter(l=>/cpSecOffItem\(/.test(l)).length===2&&hooks.filter(l=>/cpSecTestOff\(/.test(l)).length===2, want.filter(f=>!hooks.some(l=>l.indexOf(f)>=0)));
  ok("CPSHARE's cpSecState hook now has its reader (Review only / Off sections leave the split)", /typeof cpSecState==="function"/.test(SHARE)&&/function cpSecState\(kid,sec\)/.test(SEC)); }

console.log("\n── the states (pure) ──");
{ const X=engine(true,{},{},US).X;
  ok("nothing anywhere = On", X.cpSecEff(undefined,undefined)===""&&X.cpSecEff("",null)==="");
  ok("the class's Review only / Off reaches the student", X.cpSecEff("review")==="review"&&X.cpSecEff("off")==="off");
  ok("the student's own wins, and 'on' keeps one student On while the class is Review only", X.cpSecEff("review","off")==="off"&&X.cpSecEff("off","on")===""&&X.cpSecEff("","review")==="review");
  ok("PR 21's layer sits between them (a student's own still wins)", X.cpSecEff("","", "review")==="review"&&X.cpSecEff("","on","review")===""&&X.cpSecEff("off","","on")==="");
  ok("values the app doesn't know are ignored (a class 'on' is just On)", X.cpSecEff("maybe","later")===""&&X.cpSecEff("on")==="");
  ok("what a student's leaf stores: null when it matches the class, 'on' only to override it", X.cpSecStore("","")===null&&X.cpSecStore("","review")==="review"&&X.cpSecStore("review","review")===null&&X.cpSecStore("review","")==="on"&&X.cpSecStore("off","review")==="review"); }

console.log("\n── the real mstPile: Forestry and Soils open ──");
{ const E0=engine(true,SITE(),kidMd(),US), p0=pile(E0);
  const n0=secsOf(p0.newNames,n=>n.deck), r0=secsOf(p0.reviews,i=>i.subject), l0=secsOf(p0.learning,i=>i.subject);
  ok("nothing set: new cards (deck by deck: Soils first), reviews and learning cards from both sections", n0.soils===6&&r0.forestry===3&&r0.soils===3&&l0.forestry===2&&l0.soils===2, [n0,r0,l0]);
  const E1=engine(true,SITE({mine:{soils:"review"}}),kidMd(),US), p1=pile(E1);
  const n1=secsOf(p1.newNames,n=>n.deck), r1=secsOf(p1.reviews,i=>i.subject), l1=secsOf(p1.learning,i=>i.subject);
  ok("Soils Review only: no new Soils cards — the day's new cards come from Forestry", !n1.soils&&n1.forestry===6, p1.newNames.map(n=>n.deck));
  ok("…the Soils reviews still come, and the Soils cards still being learned finish", r1.soils===3&&l1.soils===2, [r1,l1]);
  ok("…Forestry is untouched (its reviews and learning cards as before)", r1.forestry===3&&l1.forestry===2);
  ok("…its bank gives nothing: mastBankEligible is empty for both Soils decks, Forestry's as before", E1.X.cpSecBank("k",ST)&&!E1.X.cpSecBank("k",FT));
  const E2=engine(true,SITE({mine:{soils:"off"}}),kidMd(),US), p2=pile(E2);
  ok("Soils Off: nothing from Soils — no new cards, no reviews, no learning cards (paused like hidden cards)", !p2.newNames.some(n=>secOf(n.deck)==="soils")&&!p2.reviews.some(i=>secOf(i.subject)==="soils")&&!p2.learning.some(i=>secOf(i.subject)==="soils")&&p2.reviews.length===3&&p2.learning.length===2, [p2.reviews.length,p2.learning.length]);
  const md3=kidMd(), before=JSON.stringify(md3); pile(engine(true,SITE({mine:{soils:"off"}}),md3,US));
  ok("…and nothing is rewritten: every card keeps its level and date (back On, the reviews are still due)", JSON.stringify(md3)===before&&secsOf(pile(engine(true,SITE(),md3,US)).reviews,i=>i.subject).soils===3);
  const E4=engine(true,SITE({cls:{plan:{soils:{state:"review"}}}}),kidMd(),US), p4=pile(E4);
  ok("the class-wide state (classes/<cid>/plan/soils/state = review) does the same for every student", !p4.newNames.some(n=>secOf(n.deck)==="soils")&&secsOf(p4.reviews,i=>i.subject).soils===3);
  const E5=engine(true,SITE({cls:{plan:{soils:{state:"review"}}},mine:{soils:"on"}}),kidMd(),US);
  ok("…a student's own 'on' keeps their Soils new cards coming", pile(E5).newNames.some(n=>secOf(n.deck)==="soils"));
  const E6=engine(true,SITE({mine:{soils:"review"},layers:[{study:{newFrom:"spread"}},{}]}),kidMd(),US), p6=pile(E6);
  ok("with CPSHARE's 'A little of everything': Soils' share goes to Forestry (all 6 new from Forestry)", p6.newNames.length===6&&p6.newNames.every(n=>secOf(n.deck)==="forestry"), p6.newNames.map(n=>n.deck));
  const E7=engine(true,SITE({role:"teacher",mine:{soils:"review"}}),kidMd(),US);
  ok("a teacher login (not the kid / parent) gets nothing from this", pile(E7).newNames.some(n=>secOf(n.deck)==="soils")&&E7.X.cpSecState("k","soils")===""); }

console.log("\n── byte-identical: the real engine, 40 days, with and without this block ──");
function replay(withBlock,site,kid,days,sess){
  const md=kidMd(kid,[FT,FF,ST,SF],sess), E=engine(withBlock,site,md,US), out=[]; let id=0;
  for(let day=1;day<=days;day++){ const p=E.mstPile(kid,"envirothon",day,null); out.push(JSON.stringify(p)); const items=md[kid];
    p.learning.forEach(i=>{ i.tally_dots=(i.tally_dots||0)+1; if(i.tally_dots>=4){ i.status="active"; i.tier="weekly"; i.next_due=day+5; } });
    p.reviews.forEach(i=>{ i.next_due=day+10; if(i.tier==="every_other_day") i.tier="weekly"; });
    p.newNames.forEach(n=>items.push({id:"n"+day+"_"+(++id),subject:n.deck,prompt:n.name,answer:"",status:"introduction",tier:"daily",tally_dots:1,cycle:1})); }
  return out; }
{ const STATES={cls:{plan:{soils:{state:"off"},forestry:{state:"review"}}},mine:{soils:"review",forestry:"off"}};
  const cases=[...["lincoln","ellis","lucy","julian"].map(k=>["Howe's "+k+" (no edition)",{on:false,kid:k},k]),
    ["Lincoln in Howe with section states in the class record (not the site's kid)",Object.assign({on:false,kid:"lincoln"},STATES),"lincoln"],
    ["the site on, states saved, but this kid isn't the site's kid",Object.assign({on:true,kid:"maya",role:"kid"},STATES),"k"],
    ["the site's own kid with nothing set",SITE(),"k"],
    ["the site's own kid, a live teacher login (not a kid / parent)",SITE(Object.assign({role:"teacher"},STATES)),"k"],
    ["state values the app doesn't know",SITE({cls:{plan:{soils:{state:"maybe"}}},mine:{forestry:"later"}}),"k"],
    ["Lincoln, Decks introducing at once = 2",{on:false,kid:"lincoln"},"lincoln",{focusDecks:2}]];
  cases.forEach(([lbl,site,kid,sess])=>{ const a=replay(true,site,kid,40,sess), b=replay(false,site,kid,40,sess);
    ok(lbl+": 40 days, every pile identical", a.length===40&&a.every((x,i)=>x===b[i])&&a.some(x=>JSON.parse(x).newNames.length>0)&&a.some(x=>JSON.parse(x).reviews.length>0), a.findIndex((x,i)=>x!==b[i])); });
  const H=engine(true,{on:false,kid:"lincoln"},{},US).X, arr=[{subject:ST}], out=[{key:ST}], o={decks:[{key:ST,section:"soils"}]};
  ok("Howe: every hook hands back the very thing it was given (===) and says no", H.cpSecItems("lincoln",arr)===arr&&H.cpSecFlash("lincoln",out)===out&&out.length===1&&H.cpSecPaceOpt(o)===o&&!H.cpSecBank("lincoln",ST)&&!H.cpSecOffItem("lincoln",arr[0])&&!H.cpSecTestOff("lincoln","soils")&&H.cpSecState("lincoln","soils")===""&&H.cpSecStartNote("lincoln")===""); }

console.log("\n── Off: the drill, the games, ID Flash, the check-in and final ──");
{ const X=engine(true,SITE({mine:{soils:"off",forestry:"review"}}),{},US).X, items=[{subject:FT,prompt:"a"},{subject:ST,prompt:"b"},{subject:SF,prompt:"c"}];
  const got=X.cpSecItems("k",items);
  ok("Mom's / the parent's drill and the sitting: an Off section's cards leave; a Review-only section's stay", got.length===1&&got[0].subject===FT);
  ok("the games (Match, Which one): an Off card is skipped, a Review-only one isn't", X.cpSecOffItem("k",items[1])&&!X.cpSecOffItem("k",items[0]));
  const fl=[{key:FT},{key:"Soils and Land Use · ID"},{key:AT}]; X.cpSecFlash("k",fl);
  ok("ID Flash: the Off section's ID deck drops out (in place)", fl.length===2&&fl.every(d=>secOf(d.key)!=="soils"));
  ok("the check-in and final wait while Off; Review only leaves them open", X.cpSecTestOff("k","soils")&&!X.cpSecTestOff("k","forestry"));
  const N=engine(true,SITE(),{},US).X, same=items.slice(); ok("nothing Off: the very same array back", N.cpSecItems("k",same)===same&&N.cpSecFlash("k",fl)===fl); }
{ const w=demo("kid",{w:{envt:true,lib:{demo:true,tests:LIB.tests}}}), u=w.unitStudies.nc_envirothon, T=w.envt;
  w.masteryData.maya_tests.soils.postOpen={date:"2026-10-28",ts:1,by:"uid_teacher_demo"};   // the teacher opened Soils' final for her
  const s0=T.envtStatus(u,"maya","soils"), f0=T.envtStatus(u,"maya","forestry");
  w._envc.students.ramirez_maya.sections={soils:"off",forestry:"off"};
  const s1=T.envtStatus(u,"maya","soils"), f1=T.envtStatus(u,"maya","forestry");
  ok("the demo's Maya: Soils' final open → Soils Off closes it (why 'off'), its check-in score still shows", s1&&!s1.post.open&&s1.post.why==="off"&&/Pre 8\/15/.test(s1.line)&&s0&&s0.post.open===true, [s0&&s0.post,s1&&s1.post]);
  ok("…Forestry (graduated) keeps its 🎓 and its final score", f1&&f1.graduated&&/Post 14\/15/.test(f1.line)&&f1.line===f0.line);
  w._envc.students.ramirez_maya.sections={aquatics:"off"}; const a1=T.envtStatus(u,"maya","aquatics"); delete w._envc.students.ramirez_maya.sections; const a0=T.envtStatus(u,"maya","aquatics");
  ok("an Off section's check-in is not offered; back On it is", a0&&a0.pre.open===true&&a1&&a1.pre.open===false, [a0&&a0.pre,a1&&a1.pre]); }

console.log("\n── the kid's app: the live listener and the 🌿 start ──");
{ const w=W({w:{remote:{"students/fam_k/sections":{soils:"review"}}}}); w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; let re=0;
  ok("a kid login: one live listener on students/<sid>/sections; its value is the student's own", w.X.cpSecListen(w.firebase.database(),()=>re++)===true&&w.G.listeners.filter(l=>l.p==="students/fam_k/sections").length===1&&re===1&&w.X.cpSecState("k","soils")==="review");
  ok("…once only", w.X.cpSecListen(w.firebase.database(),()=>re++)===false&&w.G.listeners.filter(l=>l.p==="students/fam_k/sections").length===1);
  w._envs.cls={plan:{aquatics:{state:"off"}}};
  ok("the class record it already listens to brings the class-wide state", w.X.cpSecState("k","aquatics")==="off");
  ok("the 🌿 start's line says it", /Soils: review only/.test(w.X.cpSecStartNote("k"))&&/Aquatics: paused/.test(w.X.cpSecStartNote("k")), w.X.cpSecStartNote("k"));
  const t=W(); t._envs.role="teacher"; t._envs.sid="fam_k"; ok("a teacher login: no listener", t.X.cpSecListen(t.firebase.database(),()=>{})===false&&t.G.listeners.length===0);
  const d=demo("kid"); d._envc.students.ramirez_maya.sections={soils:"review"}; const sess=d.E.mstSessions("maya").find(s=>s.sid==="envirothon");
  ok("the demo kid's 🌿 start: '⚙️ Your class plan … · Soils: review only'", /Your class plan[^<]*· Soils: review only/.test(d.envClsStartHtml("maya",sess)), d.envClsStartHtml("maya",sess)); }

console.log("\n── the console: the student page's pills ──");
{ const w=demo("teacher"), X=w.X, n0=w._envs.writes.length; w.envcView("student","ramirez_maya"); const h=w.G.content;
  ok("Teacher ▸ Maya: 🎚 Sections for Maya, a three-way pill per section, every one On", /🎚 Sections for Maya R\./.test(h)&&(h.match(/cpSecSet\('ramirez_maya','soils','(|review|off)'\)/g)||[]).length===3&&(h.match(/aria-pressed="true"[^>]*>On</g)||[]).length===6, (h.match(/aria-pressed="true"[^>]*>[^<]*</g)||[]));
  ok("…and the demo line: Maya's next 🌿 start (the real engine) has a new Soils card, Percolation", /🧪 <b>Maya’s next 🌿 start<\/b>: new — .*?<b>Soils<\/b> ×1/.test(h)&&/Percolation/.test(h.slice(h.indexOf("Maya’s next"))), h.slice(h.indexOf("Maya’s next"),h.indexOf("Maya’s next")+500));
  const p0=X.cpSecDemoPile(), soil0=p0.reviews.filter(i=>secOf(i.subject)==="soils").length;
  X.cpSecSet("ramirez_maya","soils","review"); await w.flush();
  ok("Soils: Review only → ONE update through envsWrite: students/ramirez_maya/sections/soils = 'review'", w._envs.writes.length===n0+1&&JSON.stringify(w._envs.writes[n0])===JSON.stringify({op:"update",path:"/",val:{"students/ramirez_maya/sections/soils":"review"}}), w._envs.writes.slice(n0));
  const p1=X.cpSecDemoPile();
  ok("Kid view: no new Soils cards", p0.newNames.some(n=>secOf(n.deck)==="soils")&&!p1.newNames.some(n=>secOf(n.deck)==="soils"), p1.newNames);
  ok("…the Soils reviews still come (Soil horizon, Loam, Parent material), and Humus still being learned", soil0===3&&p1.reviews.filter(i=>secOf(i.subject)==="soils").length===3&&p1.learning.some(i=>secOf(i.subject)==="soils"), p1.reviews.map(i=>i.prompt));
  const h2=w.G.content;
  ok("the page repaints: Review only pressed for Soils, Maya's start line without Percolation", /aria-pressed="true" onclick="cpSecSet\('ramirez_maya','soils','review'\)"/.test(h2)&&!/Percolation/.test(h2.slice(h2.indexOf("Maya’s next"),h2.indexOf("Maya’s next")+800)));
  w.envsDemoGo("kid"); ok("the kid's own 🌿 start (the demo kid) reads it too", X.cpSecState("maya","soils")==="review"); w.envsDemoGo("teacher"); w.envcView("student","ramirez_maya");
  X.cpSecSet("ramirez_maya","soils","off"); X.cpSecSet("ramirez_maya","soils",""); await w.flush();
  ok("Off → 'off'; On → null (back to the class's)", JSON.stringify(w._envs.writes.slice(-2).map(x=>x.val))===JSON.stringify([{"students/ramirez_maya/sections/soils":"off"},{"students/ramirez_maya/sections/soils":null}])&&!w._envc.students.ramirez_maya.sections);
  const k=w._envs.writes.length; ok("the same state again, an unknown section or state → nothing written", X.cpSecSet("ramirez_maya","soils","")===false&&X.cpSecSet("ramirez_maya","narnia","off")===false&&X.cpSecSet("ramirez_maya","soils","maybe")===false&&X.cpSecSet("nobody","soils","off")===false&&w._envs.writes.length===k);
  ok("the demo wrote nothing to a database", w.G.writes.length===0); }

console.log("\n── the console: the grid's column header ──");
{ const w=liveConsole("teacher"), X=w.X, Wr=()=>w.G.writes; const g=w.envcGridHtml();
  ok("each section's column header is a button (▾) that opens its panel", w.envsStations().every(s=>g.indexOf("cpSecGrid('"+s.id+"')")>=0)&&/Tap a section’s name to set it On · Review only · Off/.test(g));
  X.cpSecGrid("soils"); const h=w.envcGridHtml();
  ok("Soils' panel: For everyone (On pressed) and For picked students with every student", /🎚 Soils/.test(h)&&/cpSecEveryone\('soils','review'\)/.test(h)&&/Kay L\./.test(h)&&/Jo M\./.test(h)&&/now: <b>On<\/b> for the class/.test(h));
  X.cpSecEveryone("soils","review"); await w.flush();
  ok("For everyone: Review only → ONE update: classes/c1/plan/soils/state = 'review'", Wr().length===1&&JSON.stringify(Wr()[0])===JSON.stringify(["update","/",{"classes/c1/plan/soils/state":"review"}]), Wr());
  ok("…every student reads Review only, the header says so, the cells carry ↻", X.cpSecOfStudent("fam_k","soils")==="review"&&X.cpSecOfStudent("fam_j","soils")==="review"&&/review only<\/div>/.test(X.cpSecHeadHtml(w.envsStations().find(s=>s.id==="soils")))&&/↻/.test(X.cpSecCellTag("fam_k","soils")));
  X.cpSecPick("fam_k",true); X.cpSecPicked("soils",""); await w.flush();
  ok("For picked students (Kay): On → students/fam_k/sections/soils = 'on' (her own, over the class's)", JSON.stringify(Wr()[1])===JSON.stringify(["update","/",{"students/fam_k/sections/soils":"on"}])&&X.cpSecOfStudent("fam_k","soils")===""&&X.cpSecOfStudent("fam_j","soils")==="review");
  X.cpSecPick("*",true); X.cpSecPicked("soils","off"); await w.flush();
  ok("Pick all ▸ Off → one update with each student's path", JSON.stringify(Wr()[2])===JSON.stringify(["update","/",{"students/fam_j/sections/soils":"off","students/fam_k/sections/soils":"off"}]), Wr()[2]);
  X.cpSecEveryone("soils",""); await w.flush();
  ok("For everyone: On → the class's state cleared and every student's own value cleared, in the same update", JSON.stringify(Wr()[3])===JSON.stringify(["update","/",{"classes/c1/plan/soils/state":null,"students/fam_j/sections/soils":null,"students/fam_k/sections/soils":null}])&&X.cpSecOfStudent("fam_k","soils")===""&&!(w._envc.cls.plan||{}).soils, Wr()[3]);
  X.cpSecPick("*",false); const n=Wr().length; ok("nobody picked → nothing written", X.cpSecPicked("soils","off")===false&&Wr().length===n);
  ok("the class's plan record keeps its other leaves (the final's share)", (()=>{ w._envc.cls.plan={soils:{finalAt:80}}; X.cpSecEveryone("soils","off"); return true; })()&&(await w.flush(),w._envc.cls.plan.soils.finalAt===80&&w._envc.cls.plan.soils.state==="off")); }

console.log("\n── Adrienne's locks ──");
{ const w=liveConsole("teacher"), X=w.X; w._envc.cls.locks={sections:true,byName:"Adrienne"}; X.cpSecGrid("soils");
  ok("locks/sections: the teacher's pills are greyed, '🔒 Set by Adrienne', and every save refused (nothing written)", X.cpSecSet("fam_k","soils","review")===false&&X.cpSecEveryone("soils","off")===false&&(X.cpSecPick("fam_k",true),X.cpSecPicked("soils","off"))===false&&w.G.writes.length===0&&/disabled/.test(X.cpSecStudentHtml("fam_k"))&&/🔒 Set by Adrienne/.test(X.cpSecStudentHtml("fam_k")));
  const g=liveConsole("teacher"); g._envcs.locks={sections:true};
  ok("…the same lock for every class (settings/locks/sections)", g.X.cpSecSet("fam_k","soils","review")===false&&g.G.writes.length===0);
  const p=liveConsole("teacher"); p._envc.cls.locks={plan:true}; p.X.cpSecSet("fam_k","soils","review"); p.X.cpSecEveryone("soils","off"); await p.flush();
  ok("CPLOCKS's plan lock stops For everyone (it lives under plan/) but not one student's own", p.G.writes.length===1&&p.G.writes[0][2]["students/fam_k/sections/soils"]==="review");
  const a=liveConsole("admin"); a._envc.cls.locks={sections:true,plan:true}; a.X.cpSecSet("fam_k","soils","review"); a.X.cpSecEveryone("soils","off"); await a.flush();
  ok("Adrienne's own saves go through", a.G.writes.length===2);
  const k=liveConsole("kid"); ok("a kid login: no card, no panel, no save", k.X.cpSecStudentHtml("fam_k")===""&&k.X.cpSecGridHtml()===""&&k.X.cpSecSet("fam_k","soils","off")===false&&k.G.writes.length===0); }

console.log("\n── 📅 Pace: the sections leave the goal ──");
{ const w=demo("teacher"), P=w.P, X=w.X, d=P.cppDraft(), inp=P.cppInputs(d);
  ok("nothing set: the planner's input comes back untouched (the same object)", X.cpSecPaceOpt(inp)===inp);
  const base=P.cpPacePlan(inp);
  w._envc.cls.plan=Object.assign({},w._envc.cls.plan||{},{soils:Object.assign({},(w._envc.cls.plan||{}).soils||{},{state:"review"})}); P._cpp.memo={};
  const cut=P.cpPacePlan(inp);
  ok("a class-wide Review only: Soils leaves the class's plan (its core cards are out of the total)", base.sections.soils&&base.sections.soils.total>0&&!cut.sections.soils&&cut.total===base.total-base.sections.soils.total, [base.total,cut.total]);
  delete w._envc.cls.plan.soils.state; P._cpp.memo={};
  const own=Object.assign({},inp,{leaveOut:{forestry:true}}), o2=X.cpSecPaceOpt(own);
  ok("a run's leaveOut drops that section's decks and its starting point", o2!==own&&!o2.decks.some(x=>x.section==="forestry")&&o2.decks.length<inp.decks.length);
  w._envc.students.ramirez_maya.sections={soils:"review"}; w._envc.students.walker_caleb.sections={soils:"off"}; P._cpp.memo={};
  const S=w.envcStudents(), maya=P.cppRow(S.find(s=>s.sid==="ramirez_maya"),d,base,{sync:true}), cal=P.cppRow(S.find(s=>s.sid==="walker_caleb"),d,base,{sync:true}), av=P.cppRow(S.find(s=>s.sid==="morales_avery"),d,base,{sync:true});
  ok("Maya's row: Soils says 'review only' and is left out of should be / is", maya.per.soils&&maya.per.soils.out==="review"&&maya.per.soils.mark.t==="review only"&&maya.per.soils.should===0&&maya.per.soils.is===0);
  ok("Caleb's row: Soils says 'paused'; Avery (nothing set) keeps Soils in her goal", cal.per.soils.mark.t==="paused"&&av.per.soils&&!av.per.soils.out&&av.per.soils.total>0);
  ok("…Maya's 'needs from now' run leaves Soils out", X.cpSecPaceOut("ramirez_maya").leaveOut.soils===true&&JSON.stringify(X.cpSecPaceOut("morales_avery"))==="{}");
  w.envcView("pace"); for(let i=0;i<8;i++){ if(!P.cpPaceFlush()) break; } w.envcView("pace"); const h=w.G.content;
  ok("📅 Pace: the table's cells read 'review only' and 'paused'", /review only<\/td>/.test(h)&&/paused<\/td>/.test(h));
  P._cpp.open="ramirez_maya"; w.envcView("pace"); ok("…and Maya's detail says 'review only · left out of the goal'", /Soils[^<:]*: <b style="color:#6b7280">review only<\/b> <span class="envs-muted">· left out of the goal/.test(w.G.content)); }

console.log("\n── Howe (no edition): every entry point says no ──");
{ const w=W({w:{fam:{familyId:"howe",roster:[]}}}), X=w.X, o={decks:[]};
  ok("no state, no card, no panel, no header button, no listener, the planner's input untouched", X.cpSecSite()===false&&X.cpSecState("lincoln","soils")===""&&X.cpSecStudentHtml("x")===""&&X.cpSecGridHtml()===""&&X.cpSecHeadHtml({id:"soils",short:"Soils"})==="Soils"&&X.cpSecCellTag("x","soils")===""&&X.cpSecListen(w.firebase.database(),()=>{})===false&&X.cpSecPaceOpt(o)===o&&X.cpSecSet("x","soils","off")===false&&X.cpSecEveryone("soils","off")===false);
  ok("…and nothing read, written or listened to", w.G.writes.length===0&&w.G.reads.length===0&&w.G.listeners.length===0); }

console.log("\n── the rules file ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, St=R.students.$sid.sections, Pl=R.classes.$cid.plan.$key.state;
  ok("students/<sid>/sections/<section>: 'on' | 'review' | 'off', written by the class's teacher (unless locks/sections, the class's or every class's) or admin", !!St&&/'on'/.test(St.$sec[".validate"])&&/'review'/.test(St.$sec[".validate"])&&/'off'/.test(St.$sec[".validate"])&&/locks\/sections/.test(St.$sec[".write"])&&/settings\/locks\/sections/.test(St.$sec[".write"])&&/admins/.test(St.$sec[".write"])&&/\/teacher/.test(St.$sec[".write"]));
  ok("classes/<cid>/plan/<section>/state: 'review' | 'off', under the plan's own lock and locks/sections (not for admin)", !!Pl&&/'review'/.test(Pl[".validate"])&&/'off'/.test(Pl[".validate"])&&!/'on'/.test(Pl[".validate"])&&/locks\/sections/.test(Pl[".validate"])&&/admins/.test(Pl[".validate"])&&/locks\/plan/.test(R.classes.$cid.plan[".write"])); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
