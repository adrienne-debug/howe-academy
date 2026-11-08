/*
 * 📅 THISWEEK — the "This week" strip (slice C of PLAN_living_schedule_finish_2026-11-08.md; her words 10/29: "All the settings
 * we have in Generate Week need to be adjustable in the week we're currently in"). Against code sliced out of index.html — the
 * THISWEEK block with the real AUTOBUILD merge (gwEffectiveConfig), the real DAYTIMES sheet, the real Sunday catch-up switch and
 * the real one door (relayWeek, _rlwUndoUpd, relayUndo, _rlwApplyLocal) — in a sandbox with a fake database:
 *   0. shape: one block, no kid or family names (block and this file); the day banner calls it behind momHere; the week
 *      listeners keep weekConfig/<wn> live; Undo's local apply and the DAYTIMES save know the strip
 *   1. Mom only: no strip without Mom; collapsed one line; open = the 7-day grid, Sunday first
 *   2. each control writes exactly the path slice B reads — proved by loading the written fixture back as a fresh device would
 *      and running gwEffectiveConfig on it (sitter + hours + with-sitter, kid off, Saturday, Sunday catch-up, ⏰ times)
 *   3. each write = exactly one re-lay request with Undo; three taps within 2 s = one run; Undo puts the setting AND the card back
 *   4. a past day is read-only (no write, no re-lay, no tap in the grid); today is editable
 *   5. next week: the same paths for week N+1, no re-lay at all, nothing written to the week on the board
 *   6. the live sitter node is generateWeek's own shape; Generate Week's late start / no school show read-only
 *   7. ?dryrun=1 writes nothing
 *   8. 🚗 car school (slice D, GWGONE — the wizard was its only door): one leaf per day weekConfig/<wn>/carSchool/<day> = {end,note},
 *      read back by gwEffectiveConfig; on / until re-lay with Undo, a note alone does not; next week writes N+1 only; past read-only
 *   run:  node test_this_week_strip.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name,from){ from=from||src; const sig="function "+name+"("; const i=from.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=from.indexOf("{",i);k<from.length;k++){ if(from[k]==="{")d++; else if(from[k]==="}"){ d--; if(!d) return from.slice(i,k+1); } } throw new Error("unbalanced "+name); }
function block(a,b){ const i=src.indexOf("// "+a), j=src.indexOf("// "+b); if(i<0||j<i) throw new Error("no block "+a); return src.slice(i,j); }
const TW=block("THISWEEK_START","THISWEEK_END");
const NAMES=/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|sara|howe|dewalt|burris|maggie/i;

console.log("0. shape");
{ ok("one THISWEEK block",src.indexOf("// THISWEEK_START")>0&&src.indexOf("// THISWEEK_START",src.indexOf("// THISWEEK_START")+1)<0&&src.indexOf("// THISWEEK_END")>src.indexOf("// THISWEEK_START"));
  ok("no kid or family names in the block",!NAMES.test(TW));
  const me=fs.readFileSync(__filename,"utf8").replace(/const NAMES=.*\n/,"");
  ok("no kid or family names in this test",!NAMES.test(me));
  ok("the day banner calls the strip behind momHere, after the what-moved line",/if\(momHere\(\)\)\{ try\{ if\(typeof relayLineHTML==="function"\) h\+=relayLineHTML\(day\); \}catch\(e\)\{\} \}[^\n]*\n  if\(momHere\(\)\)\{ try\{ if\(typeof twsHTML==="function"\) h\+=twsHTML\(\); \}catch\(e\)\{\} \}/.test(src));
  ok("the week listeners keep weekConfig/<wn> live (a read)",/twsListen\(wk\)/.test(fn("attachWeekListeners")));
  ok("Undo's local apply hands weekConfig / the sitter node to the strip",/parts\[0\]==="weekConfig"\|\|parts\[1\]==="babysitter"/.test(fn("_rlwApplyLocal")));
  ok("the DAYTIMES save / back-to-normal skip the re-lay for a week not built yet",/_twsAfterBoard\(st\.iso\)/.test(fn("dtSave"))&&/_twsAfterBoard\(iso\)/.test(fn("dtClear")));
  ok("the strip writes through one multi-path update only",(TW.match(/db\.ref\(/g)||[]).length===2&&/db\.ref\(\)\.update\(upd\)/.test(TW)&&/db\.ref\("weekConfig\/"\+wn\); r\.on\("value"/.test(TW));
  ok("…never a whole week node (tasks / checked / meta)",!/\/(tasks|checked|history|meta)"?\)?\.set\(/.test(TW)&&!/\.set\(/.test(TW));
  ok("the Generate Week wizard is gone (slice D) and the ⏰ Day times button is still there",!/function renderPlanNextWeek\(/.test(src)&&/function dtBtnHTML\(/.test(src)&&/dtBtnHTML\(day\)/.test(src));
  ok("generateWeek's sitter node shape is the one the strip copies",/sitterObj\["hours_"\+dn\]=mg\.start\+" - "\+mg\.end;/.test(src)&&/sitterObj\.hours=mg\.start\+" - "\+mg\.end;/.test(src)); }

// ── the sandbox ──
const toMin=s=>{ const m=/(\d+):(\d+)\s*([AP]M)/i.exec(s||""); if(!m) return null; return (+m[1]%12+(m[3].toUpperCase()==="PM"?12:0))*60+ +m[2]; };
const fromMin=m=>{ let h=Math.floor(m/60), mn=m%60; const ap=h>=12?"PM":"AM"; if(h===0) h=12; else if(h>12) h-=12; return h+":"+String(mn).padStart(2,"0")+" "+ap; };
const MON={12:"2026-11-09",13:"2026-11-16"};
function addDays(iso,n){ const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
// apply a multi-path update to a plain tree (the fake server)
function applyTree(tree,upd){ Object.keys(upd).forEach(p=>{ const parts=p.split("/"); let o=tree; for(let i=0;i<parts.length-1;i++){ if(!o[parts[i]]||typeof o[parts[i]]!=="object") o[parts[i]]={}; o=o[parts[i]]; } const v=upd[p]; if(v===null||v===undefined||(Array.isArray(v)&&!v.length)) delete o[parts[parts.length-1]]; else o[parts[parts.length-1]]=JSON.parse(JSON.stringify(v)); }); return tree; }
const DAYS_ALL=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const ST_DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function make(o){
  o=o||{};
  const S={writes:[],rw:[],fires:0,timers:[],toasts:[],tree:{}};
  const ctx={console,JSON,Math,Object,Array,Set,Map,String,Number,parseInt,isNaN,Date,
    S, MOM:o.mom!==false, DRY:!!o.dry, TODAY:o.today||"2026-11-11", TODAY_DN:o.todayDn||"wednesday", SATPLAN:!!o.satPlanned,
    ROSTER:["kid_a","kid_b"], KID_COLOR:{}, SITTER_NAME:"Sitter", WK:"week12",
    rulesData:{schoolDay:{},withSitter:o.rulesWithSitter||[]}, calendarData:{holidays:{},vacations:{},kidOverrides:{}},
    weekData:{week:"week12",tasks:[]}, checked:{}, claimed:{}, momMoves:{}, relayLogData:{},
    currData:{subjects:{kid_a:{}},weekDays:{},lessons:{}},
    toMin, fromMin, HA_DEV_ID:"dev_x",
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}},activeElement:null},
    setTimeout:(f,ms)=>{ S.timers.push({f,ms}); return S.timers.length; }, clearTimeout:(id)=>{ if(id&&S.timers[id-1]) S.timers[id-1].f=null; },
    db:{ ref(p){ return { update(u){ S.writes.push(JSON.parse(JSON.stringify(u))); applyTree(S.tree,u); },
      on(ev,cb){ S.on=(S.on||[]).concat([{p,cb}]); }, once(ev,cb){ const parts=String(p).split("/"); let v=S.tree; parts.forEach(k=>{ v=v&&v[k]; }); cb({val:()=>v||null}); } }; } }
  };
  if(o.noDb) ctx.db=null;
  vm.createContext(ctx);
  const pre=`
    function momHere(){ return MOM; } function _dryRun(){ return DRY; } function dbg(){} function renderAll(){} function renderAllSoon(){}
    function gwShowToast(t){ S.toasts.push(t); } function sv(){} function cap(s){ s=String(s); return s.charAt(0).toUpperCase()+s.slice(1); }
    function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    let _todayDay=TODAY_DN; let fbCheckedLoaded=true, fbTasksLoaded=true, fbHistoryLoaded=true, fbCurrLoaded=true;
    const DAYS_ALL=${JSON.stringify(DAYS_ALL)}; const ST_DN=${JSON.stringify(ST_DN)}; const MON=${JSON.stringify(MON)};
    function currWeekNum(){ return 12; } function _wkNumOf(w){ const m=String(w||"").match(/(\\d+)/); return m?parseInt(m[1],10):0; }
    function gwWeekDateRange(wn){ return MON[wn]?{start:MON[wn],end:null}:null; }
    function gwSatPlanned(){ return SATPLAN; }
    function calDateForWeekDay(dn,wn){ const i=DAYS_ALL.indexOf(dn); const r=gwWeekDateRange(wn||currWeekNum()); if(i<0||!r) return null; const d=gwParseDate(r.start); d.setDate(d.getDate()+i); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
    function calToday(){ return TODAY; } function coopFullDayFor(){ return null; }
    function smapIsOff(ds){ const h=(calendarData.holidays||{}); for(const id in h){ if(h[id].start<=ds&&ds<=(h[id].end||h[id].start)) return h[id].name; } return null; }
    function stLunchAny(){ const o=((rulesData||{}).schoolDay||{}).lunchByDate; return !!(o&&Object.keys(o).length); }
    function stLunchFor(_x,iso){ const L=((((rulesData||{}).schoolDay||{}).lunchByDate||{})[iso]||{}).all; return L?{s:toMin(L.start),e:toMin(L.end)}:null; }
    const RLW_WAIT_MS=2000, RLW_UNDO_MS=15*60*1000; let _rlwPend=null, _rlwTimer=null;
    function _rlwFire(){ S.fires++; S.pend=_rlwPend; _rlwPend=null; }
  `;
  const code=pre+[fn("gwParseDate"),fn("gwNormSitter"),fn("ampmTo24"),fn("to12h"),fn("stJ"),fn("stTodayIso"),fn("stDsOf"),fn("stDayNameOf"),fn("stIsoOk"),fn("stDateWords"),
    fn("stApplyLocal"),fn("stWrite"),fn("smapIsKidOff"),fn("relayWeek"),fn("_rlwOnBoard"),fn("_rlwCanUndo"),fn("_rlwUndoUpd"),fn("_rlwApplyLocal"),fn("relayUndo"),fn("dtUndoSnap"),
    block("DAYTIMES_START","DAYTIMES_END"),block("SUNDAYCU_START","SUNDAYCU_END"),block("AUTOBUILD_START","AUTOBUILD_END"),TW].join("\n")
    +`\n;globalThis.T={ abSaved:_abSavedCfg, setNext(v){ twsNext=v; }, setOpen(v){ twsOpen=v; }, getDt(){ return dtState; }, setRules(r){ rulesData=r; }, setCal(c){ calendarData=c; }, setWeek(w){ weekData=w; }, rd(){ return {rulesData,calendarData,weekData}; } };`
    +`\n;const _rwReal=relayWeek; relayWeek=function(why,info){ S.rw.push({why:why,info:JSON.parse(JSON.stringify(info||{}))}); return _rwReal(why,info); };`;
  vm.runInContext(code,ctx);
  // the board's saved settings arrive (the week listener)
  ctx.T.abSaved[12]=o.saved12===undefined?null:o.saved12;
  if(o.saved13!==undefined) ctx.T.abSaved[13]=o.saved13;
  return ctx;
}
const run=(c,js)=>vm.runInContext(js,c);
// a fresh device reading the server tree the strip wrote → gwEffectiveConfig(wn)
function effFrom(tree,wn){
  const c=make({noDb:true});
  c.T.setRules(Object.assign({schoolDay:{}},((tree.config||{}).rules)||{}));
  c.T.setCal(Object.assign({holidays:{},vacations:{},kidOverrides:{}},tree.calendar||{}));
  c.T.abSaved[wn]=((tree.weekConfig||{})[wn])||null;
  return run(c,"gwEffectiveConfig("+wn+")");
}
function flushTimers(c){ let n=0; while(c.S.timers.some(t=>t.f)&&n<50){ const t=c.S.timers.find(t=>t.f); const f=t.f; t.f=null; f(); n++; } }

console.log("1. Mom only, collapsed, the grid");
{ const kid=make({mom:false});
  ok("no Mom → no strip at all",run(kid,"twsHTML()")==="");
  const c=make();
  const h=run(c,"twsHTML()");
  ok("Mom → the collapsed line",/📅 This week · as usual/.test(h)&&!/twsToggleKid/.test(h),h.slice(0,200));
  run(c,"T.setOpen(true)"); const g=run(c,"twsHTML()");
  const cols=(g.match(/font-weight:800;font-size:12px">/g)||[]).length;
  ok("open → seven day columns, Sunday first (the day before Monday)",cols===7&&g.indexOf(">Sun 8<")>0&&g.indexOf(">Sun 8<")<g.indexOf(">Mon 9<")&&g.indexOf(">Sat 14<")>g.indexOf(">Fri 13<"),cols);
  ok("today is marked and has its taps",/>Wed 11 · Today</.test(g)&&g.indexOf("twsToggleKid('kid_a','2026-11-11')")>0);
  ok("a Next week › link",/twsSetNext\(true\)/.test(g));
  ok("no ⏰ sheet on Sunday until a kid has Sunday catch-up",!/twsTimes\('2026-11-08'\)/.test(g)&&/twsTimes\('2026-11-12'\)/.test(g)); }

console.log("2. each control writes what slice B reads (gwEffectiveConfig on the written fixture)");
{ const c=make();
  run(c,"twsToggleSitter('thursday','2026-11-12')");
  run(c,"twsSitterTime('thursday','2026-11-12','end','13:30')");
  run(c,"twsToggleWithSitter('kid_b')");
  run(c,"twsToggleKid('kid_a','2026-11-13')");
  run(c,"twsToggleSaturday()");
  run(c,"twsToggleSunday('kid_b')");
  const paths=[].concat(...c.S.writes.map(u=>Object.keys(u)));
  ok("only the paths slice B reads (+ the live week's sitter node)",paths.every(p=>/^weekConfig\/12\/(babysitter|withSitter|saturday)$/.test(p)||/^calendar\/kidOverrides\/kid_a\/2026-11-13$/.test(p)||/^config\/rules\/sundayCatchup\/kid_b$/.test(p)||p==="week12/babysitter"),paths);
  const cfg=effFrom(c.S.tree,12);
  ok("sitter Thursday with its hours",cfg.babysitter.thursday&&cfg.babysitter.thursday.start==="10:00 AM"&&cfg.babysitter.thursday.end==="1:30 PM",cfg.babysitter);
  ok("…and only Thursday",Object.keys(cfg.babysitter).join()==="thursday");
  ok("the kids with the sitter",JSON.stringify(cfg.withSitter)==='["kid_b"]',cfg.withSitter);
  ok("the kid off Friday rides in cfg.off",JSON.stringify(cfg.off.friday)==='["kid_a"]',cfg.off);
  ok("Saturday on",cfg.saturday===true);
  ok("Sunday catch-up for the kid",JSON.stringify(cfg.sunday)==='["kid_b"]',cfg.sunday);
  ok("the kid-off mark is the 😷 Kid Off entry",JSON.stringify(c.S.tree.calendar.kidOverrides.kid_a["2026-11-13"])==='{"school":false,"note":"Day off"}');
  // times: the strip opens the step-1 sheet itself
  run(c,"twsTimes('2026-11-12')");
  ok("⏰ opens the DAYTIMES sheet for that date",run(c,"T.getDt()&&T.getDt().iso")==="2026-11-12");
  run(c,"dtSet('s','11:00'); dtSet('e','14:00'); dtSave()");
  const cfg2=effFrom(c.S.tree,12);
  ok("⏰ times reach gwEffectiveConfig (dayTimes + the later start)",cfg2.dayTimes.thursday&&cfg2.dayTimes.thursday.start==="11:00 AM"&&cfg2.dayTimes.thursday.end==="2:00 PM"&&cfg2.lateStart.thursday==="11:00 AM",cfg2.dayTimes);
  // toggles go back
  run(c,"twsToggleKid('kid_a','2026-11-13'); twsToggleSitter('thursday','2026-11-12'); twsToggleSaturday(); twsToggleSunday('kid_b')");
  const cfg3=effFrom(c.S.tree,12);
  ok("tapping again undoes each (no sitter, kid back, Saturday off, Sunday off)",!Object.keys(cfg3.babysitter).length&&!cfg3.off.friday&&cfg3.saturday===false&&!cfg3.sunday.length,cfg3);
  ok("the live sitter node goes when the last sitter day does",c.S.tree.week12===undefined||c.S.tree.week12.babysitter===undefined);
  // Saturday the grid plans: locked on
  const P=make({satPlanned:true});
  run(P,"twsToggleSaturday()");
  ok("a Saturday the grid plans stays on (no write, says so)",!P.S.writes.length&&/stays on/.test(P.S.toasts.join()));
  // a kid off for a holiday: changed on the Month calendar, not here
  const H=make(); H.calendarData.holidays={h1:{name:"Holiday",start:"2026-11-12"}};
  run(H,"twsToggleKid('kid_a','2026-11-12')");
  ok("a holiday is not toggled from the strip",!H.S.writes.length&&/Month calendar/.test(H.S.toasts.join()));
  run(H,"T.setOpen(true)"); const hh=run(H,"twsHTML()");
  ok("…the grid shows why",/<s>Kid_a · Holiday<\/s>/.test(hh)&&/Thu off: everyone/.test(hh)); }

console.log("3. one re-lay request per write, with Undo; taps within 2 s = one run; Undo = setting + cards");
{ const c=make();
  run(c,"twsToggleKid('kid_a','2026-11-12')");
  ok("a kid off → one relayWeek with the mark's Undo",c.S.rw.length===1&&c.S.rw[0].why==="kidoff"&&JSON.stringify(c.S.rw[0].info.undo)==='[{"p":"calendar/kidOverrides/kid_a/2026-11-12","gone":true}]',c.S.rw);
  run(c,"twsToggleSitter('friday','2026-11-13')");
  ok("the sitter → one more, Undo for both its paths",c.S.rw.length===2&&c.S.rw[1].info.undo.map(u=>u.p).sort().join()==="week12/babysitter,weekConfig/12/babysitter");
  run(c,"twsToggleSaturday()");
  ok("Saturday → one more",c.S.rw.length===3&&c.S.rw[2].info.undo[0].p==="weekConfig/12/saturday");
  ok("…no run yet (the 2 s wait)",c.S.fires===0);
  flushTimers(c);
  ok("three taps within 2 s → one run",c.S.fires===1,c.S.fires);
  ok("…its Undo holds every path, as it was before the first tap",c.S.pend&&c.S.pend.undo.length===4&&c.S.pend.undo.every(u=>u.gone===true),c.S.pend&&c.S.pend.undo);
  ok("…and all three labels",c.S.pend.labels.length===3);
  // Undo: a run moved one card; the entry carries the door's undo
  const at=Date.now();
  c.weekData.tasks.push({id:"t1",who:"kid_a",day:"friday",time:"10:00 AM"});
  c.relayLogData[String(at)]={at:at,label:"x",undo:c.S.pend.undo,moves:[{id:"t1",who:"kid_a",from:{d:"thursday",t:"11:00 AM"},to:{d:"friday",t:"10:00 AM"}}]};
  run(c,"relayLogData=globalThis.relayLogData||relayLogData");
  const before=c.S.writes.length;
  run(c,"relayUndo('"+at+"')");
  const uu=c.S.writes[before]||{};
  ok("Undo: one multi-path update — the setting paths back AND the card back",uu["calendar/kidOverrides/kid_a/2026-11-12"]===null&&uu["weekConfig/12/babysitter"]===null&&uu["weekConfig/12/saturday"]===null&&uu["week12/babysitter"]===null&&uu["week12/tasks/t1/day"]==="thursday",uu);
  ok("…this device's copy follows (weekConfig cache, calendar, the live sitter node)",!(c.T.abSaved[12]||{}).babysitter&&(c.T.abSaved[12]||{}).saturday===undefined&&!((c.calendarData.kidOverrides.kid_a||{})["2026-11-12"])&&run(c,"T.rd().weekData.babysitter")===undefined);
  const cfg=effFrom(c.S.tree,12);
  ok("…and gwEffectiveConfig is back to as before",!Object.keys(cfg.babysitter).length&&cfg.saturday===false&&!cfg.off.thursday); }

console.log("4. a past day is read-only, today editable");
{ const c=make();   // today = Wednesday Nov 11
  run(c,"twsToggleKid('kid_a','2026-11-10'); twsToggleSitter('monday','2026-11-09'); twsSitterTime('tuesday','2026-11-10','end','13:00'); twsTimes('2026-11-09')");
  ok("past Mon / Tue: no write, no re-lay, no sheet",!c.S.writes.length&&!c.S.rw.length&&!run(c,"T.getDt()"));
  run(c,"T.setOpen(true)"); const g=run(c,"twsHTML()");
  ok("…no taps on a past day in the grid, and it is greyed",g.indexOf("twsToggleKid('kid_a','2026-11-10')")<0&&g.indexOf("twsToggleSitter('monday'")<0&&g.indexOf("twsTimes('2026-11-09')")<0&&/opacity:\.5/.test(g));
  run(c,"twsToggleKid('kid_b','2026-11-11')");
  ok("today: writes and re-lays",c.S.writes.length===1&&c.S.rw.length===1&&/today/.test(c.S.rw[0].info.label));
  const s=make({today:"2026-11-15",todayDn:"sunday"});   // the week is over (Sunday after it)
  run(s,"twsToggleSaturday()");
  ok("a past Saturday is read-only",!s.S.writes.length); }

console.log("5. next week: the same paths for N+1, no re-lay");
{ const c=make();
  run(c,"T.setOpen(true); twsSetNext(true)");
  const g=run(c,"twsHTML()");
  ok("the strip shows Week 13 with a way back",/📅 Week 13/.test(g)&&/twsSetNext\(false\)/.test(g)&&/>Mon 16</.test(g));
  run(c,"twsToggleKid('kid_a','2026-11-18'); twsToggleSitter('tuesday','2026-11-17'); twsToggleWithSitter('kid_a'); twsToggleSaturday(); twsToggleSunday('kid_a')");
  ok("no re-lay at all",c.S.rw.length===0&&c.S.fires===0,c.S.rw);
  const paths=[].concat(...c.S.writes.map(u=>Object.keys(u)));
  ok("nothing written to the week on the board",!paths.some(p=>/^week12|^weekConfig\/12/.test(p)),paths);
  const cfg=effFrom(c.S.tree,13);
  ok("the Sunday self-build of Week 13 reads them",cfg.babysitter.tuesday&&JSON.stringify(cfg.withSitter)==='["kid_a"]'&&JSON.stringify(cfg.off.wednesday)==='["kid_a"]'&&cfg.saturday===true,cfg);
  run(c,"twsTimes('2026-11-19'); dtSet('e','14:00'); dtSave()");
  ok("⏰ next week's date: written, no re-lay",c.S.rw.length===0&&effFrom(c.S.tree,13).dayTimes.thursday.end==="2:00 PM");
  const b=make(); run(b,"dtOpen('2026-11-12'); dtSet('e','14:00'); dtSave()");
  ok("…while a date on the board still re-lays through the door, as before",b.S.rw.length===1&&b.S.rw[0].why==="daytimes"); }

console.log("6. the live sitter node; Generate Week's leftovers read-only (car school is a control now — 8.)");
{ const c=make({rulesWithSitter:["kid_a"]});
  ok("one day: generateWeek's shape",JSON.stringify(run(c,"_twsSitterObj({tuesday:{start:'10:00 AM',end:'2:00 PM'}},['kid_a'],gwNormSitter)"))==='{"days":["tuesday"],"withSitter":["kid_a"],"hours":"10:00 AM - 2:00 PM","mom_return":"2:00 PM"}');
  ok("two days: per-day hours",JSON.stringify(run(c,"_twsSitterObj({tuesday:{start:'10:00 AM',end:'2:00 PM'},thursday:'1:00 PM'},[],gwNormSitter)"))==='{"days":["tuesday","thursday"],"hours_tuesday":"10:00 AM - 2:00 PM","mom_return_tuesday":"2:00 PM","hours_thursday":"10:00 AM - 1:00 PM","mom_return_thursday":"1:00 PM"}');
  ok("none: null",run(c,"_twsSitterObj({},[],gwNormSitter)")===null);
  run(c,"twsToggleSitter('thursday','2026-11-12')");
  ok("the board's node is written and this device reads it at once (with the Settings kids)",JSON.stringify(c.S.tree.week12.babysitter)==='{"days":["thursday"],"withSitter":["kid_a"],"hours":"10:00 AM - 2:00 PM","mom_return":"2:00 PM"}'&&run(c,"T.rd().weekData.babysitter.days[0]")==="thursday");
  const g=make({saved12:{lateStart:{tuesday:"11:00 AM"},carSchool:{friday:{end:"12:30 PM"}},skipDays:["thursday"]}});
  run(g,"T.setOpen(true)"); const h=run(g,"twsHTML()");
  ok("late start / no school from Generate Week show read-only",/Late start 11:00 AM <span[^>]*>\(from Generate Week\)/.test(h)&&/No school <span/.test(h)&&!/onclick="[^"]*lateStart/.test(h));
  ok("…an old car school day shows as the editable 🚗 row, the old wizard's note filled in",/twsToggleCar\('friday','2026-11-13'\)[^>]*>🚗 Car school until 12:30 PM</.test(h)&&/value="Travel Day"/.test(h)&&!/Car school until 12:30 PM <span[^>]*>\(from Generate Week\)/.test(h));
  ok("…and in the collapsed line",/Tue late start 11:00 am/.test(h)&&/Thu no school/.test(h)&&/Fri car school till 12:30 PM/.test(h)); }

console.log("7. dry run");
{ const c=make({dry:true});
  run(c,"twsToggleKid('kid_a','2026-11-12'); twsToggleSitter('friday','2026-11-13')");
  ok("?dryrun=1: nothing reaches the database",c.S.writes.length===0);
  ok("…this device's memory has it, and the door still runs (in memory)",c.calendarData.kidOverrides.kid_a["2026-11-12"]&&c.T.abSaved[12].babysitter.friday&&c.S.rw.length===2); }

console.log("8. 🚗 car school — its home now (GWGONE)");
{ const c=make();
  run(c,"T.setOpen(true)"); const g=run(c,"twsHTML()");
  ok("a 🚗 row on every school day Mon–Fri (taps from today on), none on Saturday / Sunday",(g.match(/🚗 Car school</g)||[]).length===5&&["wednesday","thursday","friday"].every(d=>g.indexOf("twsToggleCar('"+d+"'")>0)&&g.indexOf("twsToggleCar('monday'")<0&&g.indexOf("twsToggleCar('saturday'")<0&&g.indexOf("twsToggleCar('sunday'")<0);
  run(c,"twsToggleCar('thursday','2026-11-12')");
  ok("on → one targeted leaf, the old wizard's default",c.S.writes.length===1&&JSON.stringify(c.S.writes[0])==='{"weekConfig/12/carSchool/thursday":{"end":"12:00 PM","note":"Travel Day"}}',c.S.writes);
  ok("…one re-lay through the door, Undo = the leaf as it was",c.S.rw.length===1&&c.S.rw[0].why==="carschool"&&JSON.stringify(c.S.rw[0].info.undo)==='[{"p":"weekConfig/12/carSchool/thursday","gone":true}]'&&/🚗 Car school Thu on/.test(c.S.rw[0].info.label),c.S.rw);
  ok("gwEffectiveConfig (what generateWeek and every re-lay build from) reads it",JSON.stringify(effFrom(c.S.tree,12).carSchool)==='{"thursday":{"end":"12:00 PM","note":"Travel Day"}}');
  run(c,"twsCarSet('thursday','2026-11-12','end','10:30')");
  ok("until → the leaf with the new time, one more re-lay",JSON.stringify(c.S.writes[1])==='{"weekConfig/12/carSchool/thursday":{"end":"10:30 AM","note":"Travel Day"}}'&&c.S.rw.length===2&&/until 10:30 AM/.test(c.S.rw[1].info.label)&&c.S.rw[1].info.undo[0].was.end==="12:00 PM",c.S.writes[1]);
  run(c,"twsCarSet('thursday','2026-11-12','note','  Road trip  ')");
  ok("a note → written (trimmed), but re-lays nothing (it is only the day's words)",JSON.stringify(c.S.writes[2])==='{"weekConfig/12/carSchool/thursday":{"end":"10:30 AM","note":"Road trip"}}'&&c.S.rw.length===2);
  run(c,"twsCarSet('thursday','2026-11-12','end','nonsense'); twsCarSet('thursday','2026-11-12','end','10:30'); twsCarSet('thursday','2026-11-12','x','1')");
  ok("a bad / unchanged time or an unknown field writes nothing",c.S.writes.length===3);
  run(c,"twsCarSet('friday','2026-11-13','end','11:00')");
  ok("until on a day without car school does nothing",c.S.writes.length===3);
  const h2=run(c,"twsHTML()");
  ok("the grid shows it on, with the time and the note to change",/>🚗 Car school until 10:30 AM</.test(h2)&&/value="10:30"[^>]*twsCarSet\('thursday','2026-11-12','end'/.test(h2)&&/value="Road trip"[^>]*twsCarSet\('thursday','2026-11-12','note'/.test(h2)&&/Thu car school till 10:30 AM/.test(h2));
  run(c,"twsToggleCar('thursday','2026-11-12')");
  ok("off → the leaf removed, re-lay, and gwEffectiveConfig has no car school",c.S.writes[3]["weekConfig/12/carSchool/thursday"]===null&&c.S.rw.length===3&&!Object.keys(effFrom(c.S.tree,12).carSchool).length);
  flushTimers(c);
  ok("…the three re-lay taps within 2 s → one run whose Undo is the leaf before the first tap",c.S.fires===1&&c.S.pend.undo.length===1&&c.S.pend.undo[0].gone===true);
  // keeps another day's car school (a leaf, never the whole map)
  const k=make({saved12:{carSchool:{friday:{end:"1:00 PM",note:"Trip"}}}});
  run(k,"twsToggleCar('thursday','2026-11-12')");
  const ek=effFrom(Object.assign({weekConfig:{12:{carSchool:{friday:{end:"1:00 PM",note:"Trip"}}}}},{}),12);
  ok("another day's car school is never touched (one leaf)",Object.keys(k.S.writes[0]).join()==="weekConfig/12/carSchool/thursday"&&k.T.abSaved[12].carSchool.friday.note==="Trip"&&ek.carSchool.friday.end==="1:00 PM");
  // past day
  run(k,"twsToggleCar('monday','2026-11-09'); twsCarSet('friday','2026-11-13','end','12:00')");
  ok("a past day: no write; today / later: yes",k.S.writes.length===2&&Object.keys(k.S.writes[1]).join()==="weekConfig/12/carSchool/friday");
  // next week
  const n=make(); run(n,"T.setOpen(true); twsSetNext(true)");
  ok("next week's grid has the 🚗 taps",run(n,"twsHTML()").indexOf("twsToggleCar('tuesday','2026-11-17')")>0);
  run(n,"twsToggleCar('tuesday','2026-11-17'); twsCarSet('tuesday','2026-11-17','end','11:15')");
  ok("next week: Week 13's leaf only, no re-lay",n.S.rw.length===0&&[].concat(...n.S.writes.map(u=>Object.keys(u))).every(p=>p==="weekConfig/13/carSchool/tuesday")&&effFrom(n.S.tree,13).carSchool.tuesday.end==="11:15 AM");
  // no Mom, dry run
  const kid=make({mom:false}); run(kid,"twsToggleCar('thursday','2026-11-12')");
  ok("no Mom → nothing",!kid.S.writes.length&&!kid.S.rw.length);
  const d=make({dry:true}); run(d,"twsToggleCar('thursday','2026-11-12')");
  ok("?dryrun=1 → nothing to the database, this device's memory has it",!d.S.writes.length&&d.T.abSaved[12].carSchool.thursday.end==="12:00 PM");
  ok("_twsCar: the old wizard's defaults for a missing field, null for nothing",JSON.stringify(run(d,"_twsCar({})"))==='{"end":"12:00 PM","note":"Travel Day"}'&&run(d,"_twsCar(null)")===null&&run(d,"_twsCar({end:'1:00 PM',note:''}).note")==="Travel Day"); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
