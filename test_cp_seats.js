/*
 * Node tests — 🪑 CPSEATS, PR 5 of the class platform (DESIGN_class_platform_2026-10-28.md §7(c), §8, §12, §13 row 5; her go 2026-10-28;
 * design question 8 answered its way: Auto). "Cards a sitting" (maxCards 12) quietly held a site student to about 2.4 new cards a day
 * whatever New cards a day said; she wants 20 a day possible.
 *   · Where it sits and how it hooks: one block right after ENVCLASSSET_END, typeof-guarded one-line hooks, the ENVCS_FIELDS literal untouched
 *     (the block updates the maxCards row and adds "Days a card is learned" by name, once).
 *   · The panel: Auto (25 at 5 a day) is the default, a number caps it (0–200, 0 = no limit), the amber real-pace line ("set 12 → about 2
 *     a day"), Auto clears it; the student page the same with the student's own numbers; every save one targeted update at its path.
 *   · The kid: the overlay turns Auto into New cards a day × Days a card is learned IN MEMORY; Days a card is learned reaches the drill.
 *   · THE PACE, AGAINST THE ENGINE: the real mstSessions + mstPile + mastDrillSettings from index.html, run over 30 simulated study days with
 *     the real overlay — Auto gives New cards a day every day; 12 a sitting holds it near 2.4 whatever New cards a day says.
 *   · Howe / Lincoln: no edition → the very same objects back, nothing drawn, read or written.
 * Uses the world from test_env_site.js.                                                                      run: node test_cp_seats.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CLS,CPS,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
function demo(role){ const w=world({fam:FAM,search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
function liveConsole(role){ const w=world({fam:FAM}); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",teacher:"t1",students:{fam_k:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"}}; return w; }
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
// the panel's Cards a sitting row (from its label to the next row)
const seatsRow=h=>{ const i=h.indexOf(">Cards a sitting<"); return i<0?"":h.slice(i,h.indexOf("How cards are learned",i)); };
const amber=h=>/data-cps="amber"/.test(seatsRow(h));

// ── the real engine from index.html: MST_ENGINE (mstSessions, mstPile …) + mastDrillSettings + mastIntroDotsFor, overlay passed in ──
const MST=src.slice(src.indexOf("// ── MST_ENGINE_START ──"),src.indexOf("// ── MST_ENGINE_END ──"));
const DRILL=cut("function mastDrillSettings(){","\n}\n")+cut("function mastIntroDotsFor(cat,s){","}\n");
function engine(overlay,md){
  return new Function("envClassOverlay","md",`
    let masteryData=md, masteryKid=null; const ENV_SESSION_SID="envirothon";
    const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
    const MAST_TIER_INT={daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
    function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false; if(item.next_due!=null&&iv>1) return pn>=item.next_due; return true; }
    function mastIsParked(i){ return !!(i&&i.status==="parked"); } function mastIsNeverDrill(i){ return false; }
    function mastFullBank(kid){ const b={}; (masteryData[kid+"_custom_items"]||[]).forEach(c=>{ (b[c.cat]=b[c.cat]||[]).push(c.name); }); return b; }
    ${DRILL}
    ${MST}
    return { mstSessions, mstPile, mastDrillSettings, mastIntroDotsFor, kid(k){ masteryKid=k; } };`)(overlay,md);
}
// 30 study days of the 🌿 sitting, every card right: the real pile each day; the day's save as _mstSaveInner + mastApplyScores pass 1 do it
// (a learning card shown → one dot, graduating to the ladder's first rung at mastIntroDotsFor; a new card is minted with its first dot)
function simulate(w,decks,days){
  const kid=w._envs.kid, items=[], bank=[];
  decks.forEach(d=>{ for(let i=1;i<=d.n;i++) bank.push({cat:d.key,name:d.key+" #"+i}); });
  const md={[kid]:items,[kid+"_custom_items"]:bank,[kid+"_settings"]:{},[kid+"_sessions"]:{envirothon:Object.assign({},w.masteryData[kid+"_sessions"].envirothon,{decks:decks.map(d=>d.key)})}};
  const E=engine(w.envClassOverlay,md); const perDay=[], seatsSeen=new Set(); let nid=0;
  for(let pn=1;pn<=days;pn++){
    const ses=E.mstSessions(kid).find(s=>s.sid==="envirothon"); seatsSeen.add(ses.maxCards);
    const p=E.mstPile(kid,"envirothon",pn,null);
    E.kid(kid); const S=E.mastDrillSettings();
    const dot=it=>{ it.tally_dots=(it.tally_dots||0)+1; const need=E.mastIntroDotsFor(it.subject,S); if(it.tally_dots>=need){ it.status="active"; it.tier=S.ladder[0]; it.tally_dots=need; it.next_due=pn+2; it.graduatedOn=pn; } };
    p.reviews.forEach(it=>{ it.tier="weekly"; it.next_due=pn+5; });   // reviews ride outside the seats (no log → doneToday 0); a right one climbs out of the sitting
    p.learning.forEach(dot);
    p.newNames.forEach(n=>{ const it={id:"c"+(++nid),subject:n.deck,prompt:n.name,status:"introduction",tier:"daily",tally_dots:0,bornOn:pn}; items.push(it); dot(it); });
    perDay.push(p.newNames.length);
  }
  const avg=(a,b)=>{ const s=perDay.slice(a-1,b); return s.reduce((x,y)=>x+y,0)/s.length; };
  return {perDay,avg,items,seats:[...seatsSeen]};
}
// a big synthetic bank (4 decks, each larger than 30 days at the highest rate tried) — no real card counts
const BIG=n=>["Deck A","Deck B","Deck C","Deck D"].map(k=>({key:k,n}));

const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPSEATS_START"), b=src.indexOf("// CPSEATS_END"), e=src.indexOf("// CPUNIT_END");
  ok("CPSEATS right after CPUNIT_END (after ENVCS_FIELDS is declared), once", a>0&&b>a&&src.indexOf("// CPSEATS_START",a+1)<0&&src.slice(e,a).trim()==="// CPUNIT_END"&&src.indexOf("const ENVCS_FIELDS=[")<a);
  ok("the block only declares (its one load step is a const: the guarded update of the settings list)", CPS.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let | |})/.test(l))&&/^const CPS_FIELDS_SET=cpSeatsFields\(\);$/m.test(CPS));
  ok("the design, the date and the 2.4 a day are in the header", /2026-10-28/.test(CPS)&&/§7\(c\)/.test(CPS)&&/§13 row 5/.test(CPS)&&/2\.4/.test(CPS)&&/20 new cards a day/.test(CPS));
  ok("no Howe kid name as a code literal", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPS));
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🪑 CPSEATS/.test(l));
  ok("6 tagged lines outside the block, every one typeof-guarded", hooks.length===6&&hooks.every(l=>/typeof cpSeats\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,60)));
  ok("…all inside ENVCLASSSET: envClsDef, envClsCheck, envClsFmt, envClassOverlay, envClsRowHtml (the control + the line)", ["envClsDef","envClsCheck","envClsFmt","envClassOverlay"].every(f=>{ const i=CLS.indexOf("function "+f+"("); return /🪑 CPSEATS/.test(CLS.slice(i,CLS.indexOf("\n}\n",i))); })&&(()=>{ const i=CLS.indexOf("function envClsRowHtml("); return (CLS.slice(i,CLS.indexOf("\n}\n",i)).match(/🪑 CPSEATS/g)||[]).length===2; })());
  ok("the overlay's hook is the study part only and still ends in ENVCLASSSET's own return", /if\(part==="study"&&typeof cpSeatsStudy==="function"\) return cpSeatsStudy\(kid,envClsMerge\(part,rec,L\),L\);[^\n]*\n    return envClsMerge\(part,rec,L\);/.test(CLS));
  ok("the ENVCS_FIELDS literal is not edited (maxCards still reads 0–60, 12 there; the block changes the row in memory)", /\{name:"maxCards",part:"study",sect:"front",kind:"int",min:0,max:60,def:12,/.test(CLS)&&!/name:"intro_dots"/.test(CLS)); }

console.log("\n── the settings list after the load step ──");
{ const w=demo("teacher"), F=w.ENVCS_FIELDS, m=F.find(f=>f.name==="maxCards"), d=F.find(f=>f.name==="intro_dots");
  ok("Cards a sitting: Auto by default, 0–200, its meaning names Auto", w.cps.CPS_FIELDS_SET===true&&m.kind==="seats"&&m.min===0&&m.max===200&&m.def==="auto"&&/Auto = New cards a day × Days a card is learned/.test(m.means));
  ok("'Days a card is learned' joins the drill ladder (Advanced), first row, 1–10, default 5", d&&d.part==="drill"&&d.sect==="ladder"&&d.kind==="int"&&d.min===1&&d.max===10&&d.def===5&&F.indexOf(d)===F.findIndex(f=>f.name==="ladder_streak")-1);
  ok("the update runs once: a second call adds no second row", w.cps.cpSeatsFields()===true&&F.filter(f=>f.name==="intro_dots").length===1&&F.length===16); }

console.log("\n── the pace math (pure) ──");
{ const w=demo("teacher"), A=w.cps.cpSeatsAuto, P=w.cps.cpSeatsPace;
  ok("Auto = New cards a day × days learned: 5 → 25, 20 → 100, 21 → 105 (the design's example), 0 → 0 (no limit)", A(5,5)===25&&A(20,5)===100&&A(21,5)===105&&A(0,5)===0&&A(20,4)===80);
  ok("12 a sitting at 5 a day: about 2 really fit (12 ÷ 5 = 2.4), capped", P(5,12,5).about===2&&Math.abs(P(5,12,5).real-2.4)<1e-9&&P(5,12,5).capped===true);
  ok("12 a sitting at 20 a day: still about 2 — whatever New cards a day says", P(20,12,5).about===2&&P(20,12,5).capped===true);
  ok("Auto, 0 (no limit) and enough seats are not capped; 24 at 5 a day is (about 4)", !P(5,"auto",5).capped&&P(5,"auto",5).seats===25&&!P(5,null,5).capped&&!P(5,0,5).capped&&!P(5,25,5).capped&&!P(5,30,5).capped&&P(5,24,5).capped&&P(5,24,5).about===4);
  ok("4 days a card is learned: 12 a sitting fits about 3; Auto at 20 a day is 80", P(20,12,4).about===3&&P(20,"auto",4).seats===80); }

console.log("\n── allowed values ──");
{ const w=demo("teacher"), C=(n,v,k)=>w.envClsCheck(n,v,k);
  ok("Cards a sitting: Auto (any case), 0, 200 · not 201, -1, 2.5, words", C("maxCards","auto").ok&&C("maxCards","Auto").v==="auto"&&C("maxCards",0).ok&&C("maxCards","200").v===200&&!C("maxCards",201).ok&&!C("maxCards",-1).ok&&!C("maxCards",2.5).ok&&!C("maxCards","lots").ok&&/Auto or a whole number 0–200/.test(C("maxCards",201).error));
  ok("Days a card is learned: 1–10", C("intro_dots",1).ok&&C("intro_dots",10).ok&&!C("intro_dots",0).ok&&!C("intro_dots",11).ok);
  ok("other settings check as before (New cards a day 0–50, 'auto' is not a number there)", C("newPerDay",50).ok&&!C("newPerDay",51).ok&&!C("newPerDay","auto").ok); }

console.log("\n── the teacher's ⚙️ Class settings: Auto, a number, the real-pace line ──");
{ const w=demo("teacher"); w.envcView("classset"); let h=w.G.content, r=seatsRow(h);
  ok("at the defaults: Cards a sitting is Auto (25), the Auto button on, the box blank, 'now: Auto (default)'", /<button class="envs-btn " [^>]*>Auto \(25\)<\/button>/.test(r)&&/value="" placeholder="a number"/.test(r)&&/now: <b>Auto<\/b> \(default\)/.test(r));
  ok("…its line: 'Auto: 5 new a day × 5 days a card is learned = 25 cards a sitting, so all 5 new cards a day fit' — not amber", /Auto: 5 new a day × 5 days a card is learned = 25 cards a sitting, so all 5 new cards a day fit\./.test(r)&&!amber(h));
  w.envClsInput("class","maxCards","12"); await w.flush(); h=w.G.content; r=seatsRow(h);
  ok("set 12 → the amber line: 'At 12 cards a sitting, about 2 new cards a day really fit (New cards a day is 5)' and why", amber(h)&&/At 12 cards a sitting, about 2 new cards a day really fit \(New cards a day is 5\)\. A new card keeps its seat for the 5 days it is learned, so 12 ÷ 5 ≈ 2\.4\. Auto \(25\) fits all 5\./.test(r));
  ok("…the box shows 12, Auto is off, 'now: 12'", /value="12"/.test(r)&&/<button class="envs-btn sec" [^>]*>Auto \(25\)/.test(r)&&/now: <b>12<\/b>/.test(r));
  w.envClsInput("class","newPerDay","20"); await w.flush(); h=w.G.content; r=seatsRow(h);
  ok("New cards a day 20 with 12 a sitting → still 'about 2' (New cards a day is 20) · Auto (100)", amber(h)&&/about 2 new cards a day really fit \(New cards a day is 20\)/.test(r)&&/Auto \(100\) fits all 20/.test(r));
  w.envClsInput("class","maxCards","100"); await w.flush(); h=w.G.content; r=seatsRow(h);
  ok("100 a sitting at 20 a day → '✓ all 20 new cards a day fit', no amber", !amber(h)&&/At 100 cards a sitting, all 20 new cards a day fit\./.test(r));
  w.envClsInput("class","maxCards","0"); await w.flush(); r=seatsRow(w.G.content);
  ok("0 → 'No limit: all 20 new cards a day fit'", /No limit: all 20 new cards a day fit/.test(r)&&/now: <b>0 \(no limit\)<\/b>/.test(r));
  w.envClsInput("class","maxCards","12"); await w.flush(); ok("(back to 12: amber again)", amber(w.G.content));
  w.envClsSave("class","maxCards",null); await w.flush(); h=w.G.content; r=seatsRow(h);
  ok("tap Auto → the amber line is gone: 'Auto: 20 new a day × 5 days … = 100 cards a sitting'", !amber(h)&&/Auto: 20 new a day × 5 days a card is learned = 100 cards a sitting/.test(r)&&/now: <b>Auto<\/b> \(default\)/.test(r));
  ok("the Auto tap clears the class's value (it is the default): 'would write' {maxCards:null}", JSON.stringify(w._envs.writes[w._envs.writes.length-1]).indexOf('"maxCards":null')>=0);
  ok("the Advanced fold is closed: 'Days a card is learned' isn't up front", !/Days a card is learned<\/div>/.test(h));
  w._envcs.adv=true; w.renderAll(); h=w.G.content;
  ok("Advanced ▸ The drill ladder: 'Days a card is learned' (1–10), now 5 (default), right above 'Right in a row to move up'", /Days a card is learned<\/div><div class="envs-muted">Learning days a new card gets in the 🌿 sitting before it climbs the drill ladder\. Auto cards a sitting grows with it\. \(1–10\)/.test(h)&&h.indexOf(">Days a card is learned<")<h.indexOf(">Right in a row to move up<")&&h.indexOf("The drill ladder")<h.indexOf(">Days a card is learned<"));
  w.envClsInput("class","intro_dots","4"); await w.flush(); r=seatsRow(w.G.content);
  ok("Days a card is learned 4 → Auto is 80 (20 × 4)", /Auto \(80\)/.test(r)&&/= 80 cards a sitting/.test(r));
  const a=demo("admin"); a.envcView("classset"); a._envcs.adv=true; a.renderAll();
  ok("Adrienne can 🔒 lock both rows like any other setting", /envClsLock\('maxCards'/.test(a.G.content)&&/envClsLock\('intro_dots'/.test(a.G.content)); }

console.log("\n── a student page: the student's own numbers ──");
{ const w=demo("teacher"); const sid="tran_jonah"; w._envcs.stuOpen=sid; w.envcView("student",sid);
  let h=w.envClsStudentHtml(sid), r=seatsRow(h);
  ok("Jonah (his own 3 a day) on the class's Auto: Auto (15), 'class: Auto', '✓ … = 15'", /Auto \(15\)/.test(r)&&/class: <b>Auto<\/b>/.test(r)&&/Auto: 3 new a day × 5 days a card is learned = 15 cards a sitting/.test(r)&&/placeholder="class: Auto"/.test(r));
  w.envClsInput("class","maxCards","12"); await w.flush(); h=w.envClsStudentHtml(sid); r=seatsRow(h);
  ok("the class sets 12 → Jonah's page goes amber with HIS numbers: about 2 (New cards a day is 3), Auto (15)", amber(h)&&/about 2 new cards a day really fit \(New cards a day is 3\)/.test(r)&&/Auto \(15\) fits all 3/.test(r)&&/class: <b>12<\/b>/.test(r));
  ok("…his Auto button saves 'auto' for him (the class has a number)", /onclick="envClsSave\('tran_jonah','maxCards','auto'\)"/.test(r));
  w.envClsSave(sid,"maxCards","auto"); await w.flush(); h=w.envClsStudentHtml(sid); r=seatsRow(h);
  ok("Jonah on Auto over the class's 12: no amber, 'this student: Auto · class: 12'", !amber(h)&&/this student: <b>Auto<\/b> · class: 12/.test(r)); }

console.log("\n── every save writes exactly its path (one targeted update) ──");
{ const w=liveConsole("teacher"); const W=()=>w.G.writes;
  w.envClsInput("class","maxCards","12"); await w.flush();
  ok("Cards a sitting 12 → update classes/c1/settings/study {maxCards:12}", JSON.stringify(W()[0])===JSON.stringify(["update","classes/c1/settings/study",{maxCards:12}]), W());
  w.envClsSave("class","maxCards",null); await w.flush();
  ok("Auto (the class) → update classes/c1/settings/study {maxCards:null}", JSON.stringify(W()[1])===JSON.stringify(["update","classes/c1/settings/study",{maxCards:null}]));
  w.envClsInput("class","maxCards","150"); await w.flush();
  ok("150 is allowed now (top 200) → {maxCards:150}", JSON.stringify(W()[2])===JSON.stringify(["update","classes/c1/settings/study",{maxCards:150}]));
  w.envClsInput("class","intro_dots","4"); await w.flush();
  ok("Days a card is learned 4 → update classes/c1/settings/drill {intro_dots:4}", JSON.stringify(W()[3])===JSON.stringify(["update","classes/c1/settings/drill",{intro_dots:4}]));
  w.envClsSave("fam_k","maxCards","auto"); await w.flush();
  ok("a student's Auto over a class number → update students/fam_k/settings/study {maxCards:\"auto\"}", JSON.stringify(W()[4])===JSON.stringify(["update","students/fam_k/settings/study",{maxCards:"auto"}]));
  const n=W().length; w.envClsInput("class","maxCards","201"); await w.flush();
  ok("201 is refused: no write, a toast", W().length===n&&w.G.created.some(e=>/Auto or a whole number 0–200/.test(e.textContent||""))); }

console.log("\n── the kid: Auto in memory, through ENVCLASSSET's overlay ──");
{ const w=demo("teacher"); const md=w.masteryData, before=JSON.stringify(md), rec=md.maya_sessions.envirothon, ds=md.maya_settings||{};
  const S=()=>w.envClassOverlay("study","maya",rec);
  ok("her record says 12 (the enroll's), the overlay gives Auto: 5 × 5 = 25", rec.maxCards===12&&S().maxCards===25&&S()!==rec);
  w.envClsInput("class","newPerDay","20"); await w.flush(); ok("class 20 a day → 100 a sitting", S().maxCards===100&&S().newPerDay===20);
  w.envClsInput("class","intro_dots","4"); await w.flush(); const D=w.envClassOverlay("drill","maya",ds);
  ok("Days a card is learned 4 → 80 a sitting, and her drill settings carry intro_dots 4 (cards graduate after 4 days)", S().maxCards===80&&D.intro_dots===4&&D!==ds);
  w.envClsInput("class","maxCards","12"); await w.flush(); ok("class 12 → 12", S().maxCards===12);
  w.envClsSave("ramirez_maya","maxCards","auto"); await w.flush(); ok("Maya's own Auto over the class's 12 → 80", S().maxCards===80);
  w.envClsInput("class","maxCards","0"); await w.flush(); w.envClsSave("ramirez_maya","maxCards",null); await w.flush(); ok("class 0 → 0 (no limit)", S().maxCards===0);
  ok("nothing in her own records changed (masteryData byte-identical)", JSON.stringify(md)===before);
  ok("another session of hers comes back untouched (the overlay is the 🌿 session only)", (()=>{ const o={name:"German",maxCards:7}; const E=engine(w.envClassOverlay,{maya:[],maya_sessions:{german:o}}); return E.mstSessions("maya")[0].maxCards===7; })()); }

console.log("\n── THE PACE, against the engine: the real mstPile over 30 study days ──");
{ const at=async(npd,seats,days)=>{ const w=demo("teacher"); w.envClsInput("class","newPerDay",String(npd)); if(seats!=null) w.envClsInput("class","maxCards",String(seats)); if(days!=null) w.envClsInput("class","intro_dots",String(days)); await w.flush(); w.envsDemoGo("kid"); return w; };
  let w=await at(5,null), s=simulate(w,BIG(30*20),30);
  ok("Auto at 5 a day: the sitting is 25 seats and EVERY one of the 30 days brings 5 new cards", s.seats.length===1&&s.seats[0]===25&&s.perDay.every(n=>n===5), s.perDay);
  ok("…and a card keeps its seat 5 learning days, then climbs (5 cards graduated on day 5)", s.items.filter(i=>i.bornOn===1).every(i=>i.graduatedOn===5)&&s.items.filter(i=>i.graduatedOn===5).length===5);
  w=await at(20,null); s=simulate(w,BIG(30*20),30);
  ok("Auto at 20 a day: 100 seats, 20 new cards every day — 600 in 30 days", s.seats[0]===100&&s.perDay.every(n=>n===20)&&s.items.length===600, s.perDay);
  w=await at(5,12); s=simulate(w,BIG(30*20),30); const a5=s.avg(6,30);
  ok("12 a sitting at 5 a day: after the first week the pace holds near 2.4 a day (days 6–30 average "+a5.toFixed(2)+")", Math.abs(a5-2.4)<0.25&&Math.max(...s.perDay.slice(5))<=5, s.perDay);
  ok("…the panel's 'about 2' is that pace", w.cps.cpSeatsPace(5,12,5).about===Math.floor(a5));
  w=await at(20,12); s=simulate(w,BIG(30*20),30); const a20=s.avg(6,30);
  ok("12 a sitting at 20 a day: the SAME ~2.4 (days 6–30 average "+a20.toFixed(2)+") — New cards a day can't lift it", a20>=2&&a20<=2.8&&Math.abs(a20-a5)<0.3, s.perDay);
  w=await at(20,null,4); s=simulate(w,BIG(30*20),30);
  ok("Days a card is learned 4 at 20 a day: Auto 80 seats, still 20 every day, cards graduate on their 4th day", s.seats[0]===80&&s.perDay.every(n=>n===20)&&s.items.filter(i=>i.bornOn===1).every(i=>i.graduatedOn===4), s.perDay);
  // the real unit's first decks, their sizes read from units/nc_envirothon/index.json (never typed here), while they still have cards to give.
  // (Past them the engine's focusDecks pick is its own matter: a deck with nothing left to introduce still holds a focus slot — reported, not this PR.)
  const idx=JSON.parse(fs.readFileSync(path.join(REPO,"units/nc_envirothon/index.json"),"utf8")), REAL=Object.keys(idx.decks).sort((x,y)=>idx.decks[x].order-idx.decks[y].order).map(k=>({key:k,n:idx.decks[k].n}));
  const days=Math.floor((REAL[0].n+REAL[1].n)/20), sum=a=>a.reduce((x,y)=>x+y,0);
  w=await at(20,null); const sa=simulate(w,REAL,days); w=await at(20,12); const s12=simulate(w,REAL,days);
  ok("on the real unit's first two decks at 20 a day, "+days+" days: Auto brings "+sa.perDay.join(", ")+" ("+sum(sa.perDay)+"); 12 a sitting brings "+s12.perDay.join(", ")+" ("+sum(s12.perDay)+")", days>=3&&sa.perDay.slice(0,3).every(n=>n===20)&&s12.perDay[0]===12&&s12.perDay.slice(1).every(n=>n===0)&&sum(sa.perDay)>=5*sum(s12.perDay), {auto:sa.perDay,twelve:s12.perDay}); }

console.log("\n── Howe and Lincoln: untouched ──");
{ const h=world({fam:{familyId:"howe",roster:[]}}); const rec={name:"Envirothon",decks:["Forestry · Terms"],newPerDay:5,maxCards:12,focusDecks:2}, own={};
  ok("no edition: the overlay hands back Lincoln's very record (12 a sitting) and drill settings", h.envClassOverlay("study","lincoln",rec)===rec&&h.envClassOverlay("drill","lincoln",own)===own);
  const E=engine(h.envClassOverlay,{lincoln:[],lincoln_sessions:{envirothon:rec}}); ok("…so his real mstSessions still reads 12 a sitting", E.mstSessions("lincoln")[0].maxCards===12);
  ok("no pace line, no control, nothing read or written", h.cps.cpSeatsPaceHtml(h.ENVCS_FIELDS.find(f=>f.name==="maxCards"),"class")===""&&h.G.reads.length===0&&h.G.writes.length===0&&h.G.created.length===0);
  ok("the site's teacher / admin (not a kid login) gets the record back as is, live", (()=>{ const L=liveConsole("teacher"); L._envs.kid="maya"; return L.envClassOverlay("study","maya",rec)===rec; })()); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("CRASH "+(e&&e.stack||e)); process.exit(1); });
