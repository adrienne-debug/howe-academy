/* 🩺 CKSPENT (Sara DeWalt 2026-11-08): a finished check-up "needs to just automatically come off the schedule and just make a note
 * for mom that it came off the schedule because it was done, and any data that might need to be given to the mom."
 * Live: the × ÷ check-up (checkup_math_fluency_path_7) had every family passed/done on 10/29; its linked "Facts Check-up" subject
 * kept laying a card a day (Mom checked "check-up complete ✓" cards 10/30, 11/2, 11/3, 11/4) until the subject was deleted 11/5.
 *  1. finished session → its open week cards removed (one targeted update), checked / claimed ones kept, one 🩺 note; twice = one note
 *  2. ended (session deleted by Mom) → the same, "ended by Mom" wording
 *  3. active session → nothing removed, nothing written · dry run / data not loaded → nothing
 *  4. a fixture shaped like the live data (the real check-up state of 10/29, the real stage-7 deck, the week-5 cards)
 *  5. Mom's Now shows the note under its own 🩺 heading; the heal is wired beside stHeal, the finishing tap and the session delete
 *   run: node test_checkup_spent.js */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const slice=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const fnIn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } };
const ck=slice("// CHECKUP_START","// CHECKUP_END");
ok("the CKSPENT block sits inside CHECKUP", ck.indexOf("// CKSPENT_START")>0&&ck.indexOf("// CKSPENT_END")>0);
const mm=["mmAlertKey","mmAlertList","mmAlertRowHTML","mmAlertsNowHTML"].map(fnIn).join("\n");
const stubs=`
var masteryData={}, unitStudies={}, weekData={tasks:[]}, checked={}, claimed={}, minAlerts={}, WK="week5", lastTasksWrite=0, _todayDay="tuesday";
var fbCheckedLoaded=true, fbTasksLoaded=true, _haMastReady=true, _haUnitsReady=true, DRY=false, DAYKEY="20261103";
var SUBJECTS={}, SESSIONS={}, WRITES=[], SAVED={}, DBG=[], RENDERS=0;
var db={ref:p=>({update:v=>WRITES.push(["update",p,JSON.parse(JSON.stringify(v))]),set:v=>WRITES.push(["set",p,JSON.parse(JSON.stringify(v))]),remove:()=>WRITES.push(["remove",p])})};
function _dryRun(){ return DRY; } function sv(k,v){ SAVED[k]=JSON.parse(JSON.stringify(v)); } function dbg(m){ DBG.push(m); } function renderAll(){ RENDERS++; }
function gwGetSubjects(k){ return SUBJECTS[k]||{}; } function mstSessions(k){ return SESSIONS[k]||[]; } function mstTodayKey(){ return DAYKEY; }
function effectiveDay(t){ return t.day; }
function mmKidName(k){ return k.toUpperCase(); } function mmDayIso(){ return "2026-11-03"; } function esc(s){ return String(s); }
function ckSessionFilter(s,c){ return c; }
function _ustCards(u,n){ const out=[]; (u.decks||[]).forEach(d=>{ ((d&&d.cards)||[]).filter(c=>c&&c.stage===n).forEach(c=>out.push(Object.assign({},c,{_dk:d.key}))); }); return out; }
var HA_LS={setItem(){},getItem(){return null;}}; var document={getElementById(){return null;}};
`;
const api=`
return {ckPlan,ckSpentPlan,ckSpentScore,ckSpentText,ckSpentHeal,mmAlertsNowHTML,
  S:()=>({masteryData,weekData,checked,claimed,minAlerts,WRITES,SAVED,DBG,RENDERS,lastTasksWrite}),
  set:o=>{ if("masteryData" in o) masteryData=o.masteryData; if("unitStudies" in o) unitStudies=o.unitStudies; if("tasks" in o) weekData={tasks:o.tasks};
    if("checked" in o) checked=o.checked; if("claimed" in o) claimed=o.claimed; if("minAlerts" in o) minAlerts=o.minAlerts; if("SUBJECTS" in o) SUBJECTS=o.SUBJECTS;
    if("SESSIONS" in o) SESSIONS=o.SESSIONS; if("DRY" in o) DRY=o.DRY; if("DAYKEY" in o) DAYKEY=o.DAYKEY; if("TODAY" in o) _todayDay=o.TODAY;
    if("mast" in o) _haMastReady=o.mast; if("units" in o) _haUnitsReady=o.units; if("tl" in o) fbTasksLoaded=o.tl; },
  clear:()=>{ WRITES.length=0; DBG.length=0; } };`;
const A=new Function(stubs+ck+"\n"+mm+"\n"+api)();
// ── the real stage-7 deck (DeWalt unitStudies/math_fluency_path, 313 cards): 0s = 0×0…0×12 + 1×0…12×0; n = n×1…n×12 + (n·k)÷n
function stage7(){ const cards=[]; let o=200;
  for(let k=0;k<=12;k++) cards.push({family:"× ÷ · 0s",name:"0×"+k,def:"0",stage:7,order:++o});
  for(let k=1;k<=12;k++) cards.push({family:"× ÷ · 0s",name:k+"×0",def:"0",stage:7,order:++o});
  for(let n=1;n<=12;n++){ const f="× ÷ · "+n+"s"; for(let k=1;k<=12;k++) cards.push({family:f,name:n+"×"+k,def:String(n*k),stage:7,order:++o});
    for(let k=1;k<=12;k++) cards.push({family:f,name:(n*k)+"÷"+n,def:String(k),stage:7,order:++o}); }
  return cards; }
const unit={decks:[{key:"Math Facts",cards:stage7()}]};
// the live check-up state, mastery/<kid>_checkup/checkup_math_fluency_path_7 as read 2026-11-08 (slugs and days only)
const LIVE_STATE={"day":{"20261006":10,"20261007":10,"20261009":10,"20261012":10,"20261013":10,"20261015":10,"20261016":10,"20261019":10,"20261020":10,"20261021":10,"20261023":10,"20261026":10,"20261027":10,"20261028":10,"20261029":1},"f":{"x_d___0s":{"a":{"0x12":{"d":"20261006","r":"c","t":9.8},"0x8":{"d":"20261006","r":"c","t":1.9},"0x9":{"d":"20261006","r":"c","t":3.1},"12x0":{"d":"20261006","r":"c","t":7.2},"9x0":{"d":"20261006","r":"c","t":2.5}},"m":"pass"},"x_d___10s":{"a":{"10x12":{"d":"20261020","r":"c","t":4.7},"10x8":{"d":"20261021","r":"c","t":5.5},"10x9":{"d":"20261020","r":"s","t":5.3},"120d10":{"d":"20261021","r":"c","t":3.4},"90d10":{"d":"20261021","r":"c","t":1.9}},"m":"pass"},"x_d___11s":{"a":{"110d11":{"d":"20261027","r":"m","t":9.9},"11d11":{"d":"20261023","r":"c","t":1.9},"11x1":{"d":"20261021","r":"c","t":3.8},"11x10":{"d":"20261023","r":"s","t":5.3},"11x11":{"d":"20261023","r":"m","t":11.9},"11x12":{"d":"20261021","r":"m","t":17.6},"11x2":{"d":"20261021","r":"c","t":3.7},"11x3":{"d":"20261021","r":"c","t":1.5},"11x4":{"d":"20261021","r":"c","t":1.2},"11x5":{"d":"20261021","r":"c","t":1.1},"11x6":{"d":"20261021","r":"c","t":1.2},"11x7":{"d":"20261029","r":"c","t":13},"11x8":{"d":"20261026","r":"c","t":11},"11x9":{"d":"20261028","r":"c","t":3},"121d11":{"d":"20261027","r":"m","t":6.5},"132d11":{"d":"20261026","r":"c","t":4.4},"22d11":{"d":"20261023","r":"c","t":2.5},"33d11":{"d":"20261023","r":"c","t":2.6},"44d11":{"d":"20261023","r":"c","t":12.7},"55d11":{"d":"20261023","r":"c","t":4.6},"66d11":{"d":"20261023","r":"c","t":1.9},"77d11":{"d":"20261023","r":"c","t":1.7},"88d11":{"d":"20261028","r":"c","t":4.9},"99d11":{"d":"20261023","r":"c","t":1.5}},"m":"done"},"x_d___12s":{"a":{"108d12":{"d":"20261026","r":"s","t":7.1},"120d12":{"d":"20261028","r":"s","t":7.6},"12d12":{"d":"20261026","r":"c","t":5.5},"12x1":{"d":"20261027","r":"c","t":2.6},"12x10":{"d":"20261028","r":"s","t":5.6},"12x11":{"d":"20261028","r":"s","t":11.8},"12x12":{"d":"20261026","r":"m","t":14},"12x2":{"d":"20261027","r":"s","t":12.6},"12x3":{"d":"20261028","r":"s","t":5},"12x4":{"d":"20261027","r":"s","t":9.4},"12x5":{"d":"20261027","r":"s","t":6.3},"12x6":{"d":"20261027","r":"s","t":6.3},"12x7":{"d":"20261026","r":"s","t":11.9},"12x8":{"d":"20261026","r":"s","t":11.6},"12x9":{"d":"20261028","r":"s","t":10.5},"132d12":{"d":"20261026","r":"s","t":6.4},"144d12":{"d":"20261026","r":"m","t":15.6},"24d12":{"d":"20261026","r":"s","t":7.4},"36d12":{"d":"20261028","r":"c","t":2.9},"48d12":{"d":"20261028","r":"c","t":3.3},"60d12":{"d":"20261027","r":"s","t":5.1},"72d12":{"d":"20261028","r":"s","t":5},"84d12":{"d":"20261027","r":"s","t":11},"96d12":{"d":"20261027","r":"s","t":6}},"m":"done"},"x_d___1s":{"a":{"12d1":{"d":"20261006","r":"s","t":5.2},"1x12":{"d":"20261006","r":"c","t":3.5},"1x8":{"d":"20261006","r":"c","t":2.1},"1x9":{"d":"20261006","r":"c","t":1.9},"9d1":{"d":"20261006","r":"s","t":4.9}},"m":"pass"},"x_d___2s":{"a":{"18d2":{"d":"20261007","r":"s","t":10.4},"24d2":{"d":"20261007","r":"c","t":4.5},"2x12":{"d":"20261007","r":"c","t":3.2},"2x8":{"d":"20261007","r":"c","t":2.3},"2x9":{"d":"20261007","r":"c","t":2.5}},"m":"pass"},"x_d___3s":{"a":{"27d3":{"d":"20261007","r":"c","t":3.4},"36d3":{"d":"20261007","r":"s","t":6.3},"3x12":{"d":"20261007","r":"s","t":6.1},"3x8":{"d":"20261007","r":"c","t":2.7},"3x9":{"d":"20261007","r":"c","t":4.8}},"m":"pass"},"x_d___4s":{"a":{"12d4":{"d":"20261012","r":"c","t":3.6},"16d4":{"d":"20261012","r":"s","t":4},"20d4":{"d":"20261012","r":"s","t":13.1},"24d4":{"d":"20261012","r":"c","t":3.2},"28d4":{"d":"20261012","r":"c","t":2.7},"32d4":{"d":"20261013","r":"c","t":4.7},"36d4":{"d":"20261013","r":"c","t":3.6},"40d4":{"d":"20261013","r":"c","t":2.4},"44d4":{"d":"20261013","r":"c","t":2.3},"48d4":{"d":"20261009","r":"m","t":7.6},"4d4":{"d":"20261012","r":"c","t":5.1},"4x1":{"d":"20261009","r":"c","t":2},"4x10":{"d":"20261012","r":"c","t":1.8},"4x11":{"d":"20261012","r":"c","t":1.8},"4x12":{"d":"20261009","r":"s","t":6.4},"4x2":{"d":"20261009","r":"c","t":1.8},"4x3":{"d":"20261009","r":"c","t":2.3},"4x4":{"d":"20261009","r":"c","t":2.6},"4x5":{"d":"20261009","r":"c","t":2.4},"4x6":{"d":"20261009","r":"m","t":3.1},"4x7":{"d":"20261012","r":"s","t":8.5},"4x8":{"d":"20261009","r":"c","t":2.9},"4x9":{"d":"20261009","r":"s","t":5.1},"8d4":{"d":"20261012","r":"c","t":3.6}},"m":"done"},"x_d___5s":{"a":{"45d5":{"d":"20261013","r":"s","t":4.2},"5x12":{"d":"20261013","r":"s","t":5.3},"5x8":{"d":"20261013","r":"c","t":3.2},"5x9":{"d":"20261013","r":"s","t":5.6},"60d5":{"d":"20261013","r":"c","t":3.5}},"m":"pass"},"x_d___6s":{"a":{"54d6":{"d":"20261015","r":"c","t":6.1},"6x12":{"d":"20261013","r":"s","t":12.4},"6x8":{"d":"20261015","r":"s","t":6.3},"6x9":{"d":"20261015","r":"s","t":11.3},"72d6":{"d":"20261015","r":"c","t":2.8}},"m":"pass"},"x_d___7s":{"a":{"63d7":{"d":"20261015","r":"s","t":5},"7x12":{"d":"20261015","r":"s","t":12.4},"7x8":{"d":"20261015","r":"s","t":6.4},"7x9":{"d":"20261015","r":"s","t":5.8},"84d7":{"d":"20261015","r":"s","t":8.4}},"m":"pass"},"x_d___8s":{"a":{"16d8":{"d":"20261019","r":"c","t":3.2},"24d8":{"d":"20261019","r":"c","t":3.2},"32d8":{"d":"20261019","r":"c","t":4.6},"40d8":{"d":"20261019","r":"s","t":5.1},"48d8":{"d":"20261019","r":"c","t":3.9},"56d8":{"d":"20261019","r":"c","t":1.9},"64d8":{"d":"20261019","r":"c","t":1.3},"72d8":{"d":"20261019","r":"c","t":1.3},"80d8":{"d":"20261020","r":"c","t":4.6},"88d8":{"d":"20261020","r":"m","t":3.6},"8d8":{"d":"20261019","r":"c","t":2.8},"8x1":{"d":"20261016","r":"c","t":3.1},"8x10":{"d":"20261016","r":"c","t":1.6},"8x11":{"d":"20261019","r":"s","t":6.4},"8x12":{"d":"20261015","r":"m","t":10.7},"8x2":{"d":"20261016","r":"c","t":4.2},"8x3":{"d":"20261016","r":"c","t":3.3},"8x4":{"d":"20261016","r":"s","t":6.4},"8x5":{"d":"20261016","r":"c","t":2.9},"8x6":{"d":"20261016","r":"c","t":1.9},"8x7":{"d":"20261016","r":"s","t":6.3},"8x8":{"d":"20261016","r":"s","t":9.6},"8x9":{"d":"20261016","r":"s","t":5.9},"96d8":{"d":"20261020","r":"c","t":3.7}},"m":"done"},"x_d___9s":{"a":{"108d9":{"d":"20261020","r":"c","t":3.3},"81d9":{"d":"20261020","r":"c","t":2.8},"9x12":{"d":"20261020","r":"s","t":7},"9x8":{"d":"20261020","r":"s","t":12.4},"9x9":{"d":"20261020","r":"c","t":3.8}},"m":"pass"}}};
const SID="checkup_math_fluency_path_7", K="k1";
const SESSION={sid:SID,kind:"checkup",name:"Check-up: × and ÷ facts",unit:"math_fluency_path",stage:7,perDay:10,quick:5,untested:"known",who:"mom"};
const SPELL={sid:"checkup_all_about_spelling_1-4_1-5",kind:"checkup",name:"Check-up: Levels 1–4 · Lessons 1–5",unit:"spell",stage:1,perDay:10,quick:3,untested:"spot",who:"mom"};
const spellUnit={decks:[{key:"AAS Words",cards:[{family:"Lesson 1",name:"cat",stage:1,order:1},{family:"Lesson 1",name:"hat",stage:1,order:2},{family:"Lesson 2",name:"dog",stage:1,order:3}]}]};
// the live subjects: the Facts Check-up (Nov 4 snapshot) and the spelling check-up, both Mom-required daily cards
const SUBS={[K]:{facts_check_up:{display:"Facts Check-up",study:SID,device:"paper",mom:"required",cap:1,noCarry:true,timesPerWeek:5,tracking:"daily"},
  checkup_spelling:{display:"Checkup Spelling",study:SPELL.sid,mom:"required",noCarry:true,timesPerWeek:5,tracking:"daily"},
  math:{display:"Math"}}};
const card=(id,day,sk)=>({id,who:K,day,subjectKey:sk,time:"10:00 AM",dur:10,mom:"required",title:sk==="facts_check_up"?"📄 Facts Check-up — Facts Check-up":"📄 Checkup Spelling — Checkup Spelling"});
// week 5: Mon's facts card checked (11/2 10:20 AM), Tue–Fri open; the spelling check-up a card a day; a plain Math card; a ghost row
function week5(){ return [card("2026d306_2242","monday","facts_check_up"),card("2026d307_2641","tuesday","facts_check_up"),card("2026d308_2683","wednesday","facts_check_up"),
  card("2026d309_x1","thursday","facts_check_up"),card("2026d310_x2","friday","facts_check_up"),
  card("2026d306_3398","monday","checkup_spelling"),card("2026d307_3433","tuesday","checkup_spelling"),card("2026d308_3468","wednesday","checkup_spelling"),
  card("2026d307_m1","tuesday","math"),{dur:20}]; }
const fresh=o=>{ A.set(Object.assign({unitStudies:{math_fluency_path:unit,spell:spellUnit},SUBJECTS:SUBS,SESSIONS:{[K]:[SESSION,SPELL]},
  masteryData:{[K+"_checkup"]:{[SID]:JSON.parse(JSON.stringify(LIVE_STATE)),[SPELL.sid]:{f:{},day:{}}}},tasks:week5(),checked:{"2026d306_2242":"10:20 AM Nov 2","2026d306_3398":"9:25 AM Nov 2"},
  claimed:{},minAlerts:{},DRY:false,DAYKEY:"20261103",TODAY:"tuesday",mast:true,units:true,tl:true},o||{})); A.clear(); };
const ids=()=>A.S().weekData.tasks.filter(t=>t&&t.id).map(t=>t.id);
const taskUpd=()=>A.S().WRITES.filter(w=>w[1]==="week5/tasks");
const notes=()=>Object.keys(A.S().minAlerts).filter(k=>A.S().minAlerts[k].kind==="ckoff");

console.log("── 4. the live shape: the × ÷ check-up of 10/29 ──");
const p0=A.ckPlan(stage7(),SESSION,LIVE_STATE);
ok("the real deck is 313 cards in 13 families, and the live state is COMPLETE (0 left to ask)", stage7().length===313&&p0.families===13&&p0.complete&&p0.checked===13, p0.queue.length);
const sc=A.ckSpentScore(LIVE_STATE,stage7());
ok("its numbers: 141 asked, 131 right, 49 took a moment, 10 missed, last graded Oct 29", sc.total===141&&sc.right===131&&sc.slow===49&&sc.missed.length===10&&sc.last==="20261029", sc);
ok("missed cards carry their real names (11×11, 144÷12 …), not the slugs", sc.missed.indexOf("11×11")>=0&&sc.missed.indexOf("144÷12")>=0&&!sc.missed.some(m=>/x|d/.test(m)), sc.missed);

console.log("── 1. finished → its open cards come off, one note ──");
fresh(); A.ckSpentHeal();
let S=A.S();
ok("Tue–Fri facts cards removed from the week", ["2026d307_2641","2026d308_2683","2026d309_x1","2026d310_x2"].every(id=>ids().indexOf(id)<0), ids());
ok("Monday's CHECKED facts card stays", ids().indexOf("2026d306_2242")>=0);
ok("the active spelling check-up's cards and the Math card stay", ["2026d306_3398","2026d307_3433","2026d308_3468","2026d307_m1"].every(id=>ids().indexOf(id)>=0));
ok("the id-less ghost row is left alone (not this heal's business)", S.weekData.tasks.some(t=>t&&!t.id));
const tu=taskUpd();
ok("ONE targeted update of week5/tasks: exactly the four ids → null (never the whole node)", tu.length===1&&tu[0][0]==="update"&&JSON.stringify(Object.keys(tu[0][2]).sort())===JSON.stringify(["2026d307_2641","2026d308_2683","2026d309_x1","2026d310_x2"])&&Object.values(tu[0][2]).every(v=>v===null), tu);
ok("the local week copy is saved without them", (S.SAVED["week5_tasks"]||[]).filter(t=>t&&t.subjectKey==="facts_check_up").length===1&&S.lastTasksWrite>0);
const nk=notes();
ok("one 🩺 note in Mom's list", nk.length===1, nk);
const rec=S.minAlerts[nk[0]]||{};
ok("the note reads: × and ÷ facts check-up came off K1’s schedule — done Oct 29: 131 of 141 right …", /^× and ÷ facts check-up came off K1’s schedule — done Oct 29: 131 of 141 right \(49 took a moment\) · missed 10: /.test(rec.text||""), rec.text);
ok("…and lists the missed facts", ["11×11","144÷12","4×6","8×12"].every(m=>(rec.text||"").indexOf(m)>=0));
ok("the note record is written once, targeted, under week5/minAlerts", S.WRITES.filter(w=>w[1]==="week5/minAlerts/"+nk[0]&&w[0]==="set").length===1&&rec.kind==="ckoff"&&rec.kid===K&&rec.id===SID);
const offW=S.WRITES.filter(w=>w[1]==="mastery/"+K+"_checkup/"+SID+"/off");
ok("the told-once marker: mastery/<kid>_checkup/<sid>/off = {why:done, day}", offW.length===1&&offW[0][0]==="set"&&offW[0][2].why==="done"&&offW[0][2].day==="20261103", offW);
ok("nothing else is written (no grades, no sessions, no subjects)", S.WRITES.length===3, S.WRITES.map(w=>w[1]));
console.log("── 1b. run twice = still one note ──");
A.clear(); A.ckSpentHeal(); S=A.S();
ok("second pass: nothing left to remove, nothing written", S.WRITES.length===0&&notes().length===1, S.WRITES);
// a rebuild lays the facts cards again (the subject is still there) and Mom already tapped ✓ Got it on the note
A.set({tasks:A.S().weekData.tasks.concat([card("2026d309_r1","thursday","facts_check_up"),card("2026d310_r2","friday","facts_check_up")]),minAlerts:{}}); A.clear(); A.ckSpentHeal(); S=A.S();
ok("a rebuild's re-laid cards come off again …", ids().indexOf("2026d309_r1")<0&&ids().indexOf("2026d310_r2")<0&&taskUpd().length===1);
ok("… but Mom is NOT told a second time (the marker)", notes().length===0&&!S.WRITES.some(w=>/minAlerts|\/off$/.test(w[1])), S.WRITES);
console.log("── 1c. kept: claimed, and today's card when it was worked today ──");
fresh({claimed:{"2026d308_2683":"9:50 AM Nov 4"}}); A.ckSpentHeal();
ok("a card waiting for Mom's check (claimed) stays", ids().indexOf("2026d308_2683")>=0&&ids().indexOf("2026d307_2641")<0);
const st2=JSON.parse(JSON.stringify(LIVE_STATE));
fresh({DAYKEY:"20261029",TODAY:"thursday",masteryData:{[K+"_checkup"]:{[SID]:st2}}}); A.ckSpentHeal();
ok("finished TODAY (graded 10/29) → today's card stays for Mom's check, the rest of the week comes off", ids().indexOf("2026d309_x1")>=0&&["2026d307_2641","2026d308_2683","2026d310_x2"].every(id=>ids().indexOf(id)<0), ids());
ok("…and the note goes now (something came off)", notes().length===1);

console.log("── 2. ended by Mom (session deleted) ──");
const part={f:{"x_d___0s":LIVE_STATE.f["x_d___0s"],"x_d___4s":LIVE_STATE.f["x_d___4s"]},day:{"20261006":10,"20261013":10}};
fresh({SESSIONS:{[K]:[SPELL]},masteryData:{[K+"_checkup"]:{[SID]:part}}}); A.ckSpentHeal(); S=A.S();
ok("the deleted check-up's open cards come off, the checked one and the spelling ones stay", ["2026d307_2641","2026d308_2683","2026d309_x1","2026d310_x2"].every(id=>ids().indexOf(id)<0)&&["2026d306_2242","2026d307_3433"].every(id=>ids().indexOf(id)>=0), ids());
const er=S.minAlerts[notes()[0]]||{};
ok("one note: Facts check-up came off K1’s schedule — ended by Mom: 27 of 29 right … so far", notes().length===1&&/^Facts check-up came off K1’s schedule — ended by Mom: 27 of 29 right \(5 took a moment\) so far · missed 2: /.test(er.text||""), er.text);
ok("marker says ended", S.WRITES.some(w=>/\/off$/.test(w[1])&&w[2].why==="ended"));
A.clear(); A.ckSpentHeal();
ok("run twice = still one note, nothing written", notes().length===1&&A.S().WRITES.length===0);
fresh({SESSIONS:{[K]:[SPELL]},masteryData:{}}); A.ckSpentHeal();
ok("ended before any grade: 'ended by Mom' with no numbers", /— ended by Mom$/.test((A.S().minAlerts[notes()[0]]||{}).text||""), A.S().minAlerts);

console.log("── 3. active / not ready / dry run → nothing ──");
const act=JSON.parse(JSON.stringify(LIVE_STATE)); delete act.f["x_d___12s"];
fresh({masteryData:{[K+"_checkup"]:{[SID]:act}}}); A.ckSpentHeal();
ok("an active check-up (the 12s still to check): nothing removed, nothing written", ids().length===9&&A.S().WRITES.length===0&&notes().length===0, A.S().WRITES);
fresh({DRY:true}); A.ckSpentHeal();
ok("dry run: nothing removed, nothing written", ids().length===9&&A.S().WRITES.length===0);
fresh({mast:false}); A.ckSpentHeal();
ok("Mastery not loaded yet: nothing (every check-up would look deleted)", ids().length===9&&A.S().WRITES.length===0);
fresh({units:false}); A.ckSpentHeal();
ok("units not loaded yet: nothing", ids().length===9&&A.S().WRITES.length===0);
fresh({tl:false}); A.ckSpentHeal();
ok("the cached week (tasks not loaded from Firebase): nothing", ids().length===9&&A.S().WRITES.length===0);
fresh({unitStudies:{spell:spellUnit}}); A.ckSpentHeal();
ok("the check-up's unit missing (no cards) is never 'done'", ids().length===9&&A.S().WRITES.length===0);
const pl=A.ckSpentPlan([card("a","monday","math"),{id:"b",who:K,day:"monday",subjectKey:"study_x"}],{subjectsOf:()=>({math:{},study_x:{study:"daily_study"}}),sessionOf:()=>null,stateOf:()=>null,cardsOf:()=>[],done:()=>false,dayOf:t=>t.day,todayDay:"monday",todayKey:"x"});
ok("a plain card, or a NON-check-up study session that was deleted, is never touched", pl.remove.length===0&&pl.spent.length===0, pl);

console.log("── 5. Mom's Now + wiring ──");
fresh(); A.ckSpentHeal();
const now=A.mmAlertsNowHTML();
ok("Mom's 🔴 Now counts the note and shows it under a 🩺 Check-ups heading with ✓ Got it", now.n===1&&now.html.indexOf("\u{1FA7A} Check-ups")>=0&&now.html.indexOf("Got it")>=0&&now.html.indexOf("⏱ Timed cards")<0, now);
A.set({minAlerts:Object.assign({},A.S().minAlerts,{early_x_2026:{kind:"early",kid:K,id:"x",text:"K1 finished Math at 3 of 20 minutes",at:1,day:"2026-11-03"}})});
const now2=A.mmAlertsNowHTML();
ok("a timed-card line keeps its ⏱ heading beside it", now2.n===2&&now2.html.indexOf("⏱ Timed cards")>=0&&now2.html.indexOf("⏱ K1 finished")>=0&&now2.html.indexOf("\u{1FA7A} × and ÷")>=0);
ok("the heal runs beside every stHeal trigger (checked list, tasks change, Mastery first, units first)", (src.match(/typeof ckSpentHeal==="function"\) ckSpentHeal\(\)/g)||[]).length>=5);
ok("the tap that finishes a check-up runs it", /if\(!p2\.queue\.length&&typeof ckSpentHeal==="function"\) ckSpentHeal\(\);/.test(ck));
ok("Mom deleting a study session runs it", /_sessions\/" \+ sid\)\.remove\(\);\n[^\n]*\n  try \{ if \(typeof ckSpentHeal === "function"\) ckSpentHeal\(\); \} catch \(e\) \{\}/.test(src));
ok("no 🔀 emoji added", src.indexOf("\u{1F500}")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
