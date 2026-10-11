/*
 * 🧰 HH_PROJECTS — once-jobs and projects (her 2026-10-11). Once: due daily until checked one time, then retired with the
 * date by Mom's device. Project: never due; target, plan, steps, a work log with sessions; the 🧰 Projects view.
 *                                                                                        run: node test_house_projects.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const BLOCK=cut("// HOUSEHOLD_START","// HH_PROJECTS_END");
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const TODAY=iso(new Date()), N=dayNum(TODAY), YDAY=isoOf(N-1);
const atOf=s=>new Date(s+"T12:00:00").getTime();
function mk(o){
  o=o||{}; const writes=[], ls={}, dom={};
  const cfg={chores:{lincoln:[{emoji:"📚",label:"Return the library books",pts:10,cad:"once"},{emoji:"🔧",label:"Fix the gate latch",pts:20,cad:"once"},{emoji:"🍽️",label:"Wipe table",pts:10,cad:"daily"}]},afternoon:{}};
  const log={lincoln:{}}; if(!o.noTap){ const s=YDAY, wk="wk0", dk=DN[new Date(s+"T12:00:00Z").getUTCDay()]; log.lincoln[wk]={}; log.lincoln[wk][dk]={a:{label:"Return the library books",slot:"chores",act:"on",ts:"",at:atOf(s),pts:10}}; }
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }}, db:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:undefined, momHere:()=>!o.noMom, confirm:()=>true, rulesData:{}, calendarData:{holidays:{},vacations:{}},
    ROSTER:["lincoln","ellis","lucy","julian"], SL_KIDS:["lincoln","ellis","lucy","julian"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, KID_COLOR:{}, MC_DEFAULT:{},
    routineCfg2:cfg, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, stepCycleOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:log, momdayData:{}, daddayData:{}, momChoresData:{_seeded:true,mc_a:{label:"Kitchen close-down",cad:"daily",ts:1}}, dadChoresData:{}, activeWk:()=>"week26", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s), mwBanner:s=>"", mpSubnav:v=>"", mwToast:m=>{ ctx.toasts.push(m); }, toasts:[], renderAll:()=>{}, renderMomsPlan:()=>{}, document:{getElementById:id=>dom[id]||null}, dom, writes};
  vm.createContext(ctx); vm.runInContext(fn("toMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+CAD+"\n"+ROT+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+BLOCK, ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  ctx.hhImport(); ctx.hhTakeover(true); ctx.writes.length=0; return ctx;
}
const BOOKS="rt_chores_lincoln_return_the_library_books", GATE="rt_chores_lincoln_fix_the_gate_latch";
console.log("1. Just once");
{ const c=mk({noTap:true});
  ok("'once' is due every day and reads 'Just once'", c.cadDueOn("once","monday")&&c.cadDueOn("once","sunday")&&c.cadLabel("once")==="Just once");
  ok("a once-job sits on the kid's list like any step", c.rtStepsFor("chores","lincoln",true).map(s=>s.label).indexOf("Return the library books")>=0);
  ok("nothing checked yet → the sweep writes nothing", c.hhOnceSweep().length===0&&c.writes.length===0);
  c.hhAddToggle(); c.hhAddSet("who","lucy"); c.hhAddSet("kind","once"); c.dom["hh-add-label"]={value:"Take the boxes to the curb"}; const id=c.hhAddSave(); const j=c.hhJobs()[id];
  ok("the add form, Kind = Once: cad once, from today, in the pile (off her list until sent), the Days row hidden", j.cad==="once"&&j.from===TODAY&&j.hold===true&&!c.rtStepsFor("chores","lucy",true).some(s=>s.label==="Take the boxes to the curb")&&(c.hhAddToggle(),c.hhAddSet("kind","once"),!/hhAddSet\('cad','wk:0'\)/.test(c.hhAddHTML())&&/checked one time/.test(c.hhAddHTML())));   // HH_ONCEPILE
}
{ const c=mk(); const swept=c.hhOnceSweep();
  ok("Lincoln tapped the books yesterday → the sweep retires that row with the date, one multi-path update; the gate latch stays", swept.length===1&&swept[0]===BOOKS&&c.hhJobs()[BOOKS].status==="retired"&&c.hhJobs()[BOOKS].done===YDAY&&c.hhJobs()[GATE].status==="active"&&c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][2]["household/jobs/"+BOOKS+"/done"]===YDAY, c.writes);
  ok("it leaves his list; the latch and the table stay", c.rtStepsFor("chores","lincoln",true).map(s=>s.label).join("|")==="Fix the gate latch|Wipe table");
  c.writes.length=0; ok("the sweep is quiet the second time", c.hhOnceSweep().length===0&&c.writes.length===0);
  const k=mk({noMom:true}); ok("a kid's device never sweeps", k.hhOnceSweep().length===0&&k.writes.length===0);
  ok("the tab runs the sweep when it opens", /function renderHousehold\(el\)\{\n\s*try\{ if\(typeof hhOnceSweep==="function"\) hhOnceSweep\(\); \}catch\(e\)\{\}/.test(src));
}
console.log("2. Projects");
{ const c=mk({noTap:true}); c.hhAddToggle(); c.hhAddSet("who","mom"); c.hhAddSet("kind","project"); c.hhAddSet("room","living"); c.dom["hh-add-label"]={value:"The art cabinet"}; const id=c.hhAddSave(); const j=c.hhJobs()[id];
  ok("Kind = Project: layer project, as needed (never due), room kept, a toast pointing at 🧰 Projects", j.layer==="project"&&j.cad==="asneeded"&&j.room==="living"&&c.toasts.some(t=>/🧰 Project added/.test(t))&&c.hhIsProject(j));
  ok("never on her strip's due list and not a once-job", !c.cadDueOn(j.cad,"monday")&&!c.hhIsOnce(j));
  ok("status: not started", c.hhProjStatus(j).k==="new");
  c.writes.length=0; c.hhProjSet(id,"target","2026-11-15"); c.hhProjSet(id,"expect","180"); c.hhProjSet(id,"plan","Buy two Billys\nMove the paper shelf first");
  ok("target, expected minutes and the plan: one targeted write each", c.writes.length===3&&c.writes.map(w=>w[1].split("/").pop()).join()==="target,expect,plan"&&j.target==="2026-11-15"&&j.expect===180&&/Billys/.test(j.plan), c.writes);
  ok("a bad target / field is ignored", c.hhProjSet(id,"target","next week")===null&&c.hhProjSet(id,"colour","red")===null);
  c.writes.length=0; const r1=c.hhProjLog(id,25,"mom","emptied the top shelf"); const r2=c.hhProjLog(id,"40","lincoln","carried boxes");
  ok("two sessions logged: household/jobs/<id>/work/<ts>, with minutes, who, note and the date", c.writes.length===2&&/^household\/jobs\/[^/]+\/work\/\d+$/.test(c.writes[0][1])&&r1.min===25&&r1.by==="mom"&&r1.iso===TODAY&&r2.min===40&&r2.by==="lincoln");
  const W=c.hhProjWork(j); ok("the totals: 65 min in 2 sessions, first and last today", W.min===65&&W.n===2&&W.first===TODAY&&W.last===TODAY);
  ok("status: in progress with the numbers", /In progress since/.test(c.hhProjStatus(j).txt)&&/65 min in 2 sessions/.test(c.hhProjStatus(j).txt));
  ok("bad minutes / an unknown doer → nothing or the owner", c.hhProjLog(id,0,"mom","")===null&&c.hhProjLog(id,10,"nana","x").by==="mom");
  c.writes.length=0; const s1=c.hhProjStepAdd(id,{value:"Empty the cabinet"}); const s2=c.hhProjStepAdd(id,{value:"Build the Billys"}); c.hhProjStep(id,s1);
  ok("steps: two added, the first checked with today's date; next = the second", c.hhProjSteps(j).length===2&&c.hhProjSteps(j)[0].done===TODAY&&c.hhProjSteps(j)[1].done===""&&c.writes.length===3&&c.writes[2][1]==="household/jobs/"+id+"/steps/"+s1+"/done");
  c.hhProjStep(id,s1); ok("a step can be unchecked", c.hhProjSteps(j)[0].done==="");
  c.dom["hp-min-"+id]={value:"15"}; c.dom["hp-by-"+id]={value:"dad"}; c.dom["hp-note-"+id]={value:"hung the doors"}; const r3=c.hhProjLogFromForm(id); ok("the form logs with its boxes", r3.min===15&&r3.by==="dad"&&r3.note==="hung the doors");
  c.hhGo("proj"); const el={}; c.renderHousehold(el); let h=el.innerHTML;
  ok("the 🧰 Projects chip and the view: the project with its who, room, target, expected minutes and status line", /hhGo\('proj'\)/.test(h)&&/🧰 The art cabinet/.test(h)&&/🎯 11-15/.test(h)&&/~180 min/.test(h)&&/In progress since/.test(h)&&/next: Empty the cabinet/.test(h));
  c.hhProjToggle(id); c.renderHousehold(el); h=el.innerHTML;
  ok("unfolded: the plan box, the steps, the work log newest first, the Worked-on-it form, ✓ Done", /Buy two Billys/.test(h)&&/hhProjStep\('/.test(h)&&/hung the doors/.test(h)&&h.indexOf("hung the doors")<h.indexOf("emptied the top shelf")&&/hhProjLogFromForm\('/.test(h)&&/hhProjDone\('/.test(h));
  c.writes.length=0; c.hhProjDone(id,true); ok("✓ Done: retired with today's date, one update; it drops to the bottom struck through", c.hhJobs()[id].status==="retired"&&c.hhJobs()[id].done===TODAY&&c.writes.length===1&&c.hhProjStatus(c.hhJobs()[id]).k==="done"&&(c.renderHousehold(el),/line-through/.test(el.innerHTML)&&/Reopen/.test(el.innerHTML)));
  c.hhProjDone(id,false); ok("↩ Reopen puts it back", c.hhJobs()[id].status==="active"&&!c.hhJobs()[id].done);
  const k=mk({noMom:true}); k.hhGo("proj"); const ek={}; k.renderHousehold(ek); ok("a kid's device: the list, no edit controls, no writes", /No projects or once-jobs yet|🧰/.test(ek.innerHTML)&&!/hhProjSet\(/.test(ek.innerHTML)&&k.hhProjLog(BOOKS,10,"mom","")===null&&k.writes.length===0);
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
