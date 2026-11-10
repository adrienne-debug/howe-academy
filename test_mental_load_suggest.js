/* 🧠 MLSUGGEST — the Load dial suggests (slice 3 of PLAN_mental_load_2026-11-03.md; her Mode answer 2026-11-03: Suggest, in Mom's Day).
   mlWindow on fixtures (minutes = drill + study + sprint + games ½; first-try = the Scores formula; sittings; days before today, after the
   last change); mlSuggest's one rule (down 5 · fewer sittings at the floor · up 5 · none in 80–85 %; never two; quiet 3 days after a change,
   Not now, mode off, no dial); the 🔴 Now row renders / omits; Apply writes exactly the dial's own batch; Not now = load/snooze; Mode;
   dry run writes nothing; nothing writes on render; no family or kid names. Fixture family (ava · ben), touches no live data.
   run: node test_mental_load_suggest.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(z,i); if(j<0) throw new Error("missing end "+z); return src.slice(i,j); };
const A=src.indexOf("// MLSUGGEST_START"), Z=src.indexOf("// MLSUGGEST_END"), block=src.slice(A,Z);
const SCP=blk("// SCORESPAGE_START","// SCORESPAGE_END"), SCR=blk("const SC_RANK=","\n// History-shaped view"), DIAL=blk("// MLDIAL_START","// MLDIAL_END");

console.log("── the block ──");
ok("marked once, right after MLDIAL_END", A>0&&Z>A&&src.split("// MLSUGGEST_START").length===2&&src.split("// MLSUGGEST_END").length===2&&src.indexOf("// MLDIAL_END\n// MLSUGGEST_START")>0);
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris|taylor|makenzie|andrew|caleb|kenzie|sara|melanie/i.test(block));
ok("the block never touches the database itself — every write goes through the dial's _mldSave (db && !_dryRun())", !/db\.ref\(|firebase|\.transaction\(|HA_LS\./.test(block)&&(block.match(/_mldSave\(/g)||[]).length===2&&/mldSet\(kid,sg\.minutes,sg\.sittings\)/.test(block));
ok("no auto mode is built (slice 3b)", !/["']auto/.test(block));
ok("the Now card hook is guarded, right after LEVELREADY", /hhLevelReadyNowHTML\(\); nowN\+=_lr\.n; h\+=_lr\.html; \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof mlsNowHTML==="function"\)\{ const _ml=mlsNowHTML\(\); nowN\+=_ml\.n; h\+=_ml\.html; \} \}catch\(e\)\{\}/.test(src));
ok("the dial card's Mode line is guarded and only once the dial is stored", /if\(d\.stored&&typeof mlsModeHtml==="function"\) h\+=mlsModeHtml\(kid\);/.test(DIAL));
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());

function world(o){
  o=o||{}; const calls=[];
  const c={console,Date,momHere:()=>o.mom!==false,ROSTER:o.roster||["ava","ben"],ROSTER_DEF:o.rdef||[{id:"ava",grade:"3",schoolAge:true},{id:"ben",grade:"5",schoolAge:true}],
    KID_NAME:{ava:"Ava",ben:"Ben"},KID_COLOR:{},masteryData:o.md||{},weekData:{tasks:[]},checked:{},archive:{},currWeekNum:()=>30,mstTodayKey:()=>o.today||"20261108",
    mastSchoolDayNum:(k,d)=>{ const n=Math.round(Date.parse(d)/86400000); return n-Math.round(n/7)*2; },
    nbLoad:k=>0,ENV_SESSION_SID:"envirothon",_dryRun:()=>!!o.dry,HA_LS:{getItem:()=>null,setItem:()=>{}},renderAll:()=>{},gwShowToast:()=>{},
    document:{getElementById:()=>null}};
  c.db=o.noDb?null:{ref:p=>{ calls.push({op:"ref",p:p}); return {update:u=>calls.push({op:"update",p:p,u:JSON.parse(JSON.stringify(u))}),set:v=>calls.push({op:"set",p:p,v}),remove:()=>calls.push({op:"remove",p:p})}; }};
  vm.createContext(c); vm.runInContext(SCR+"\n"+SCP+"\n"+DIAL+"\n"+block,c); c.calls=calls; c.run=e=>vm.runInContext(e,c); return c;
}
const writes=w=>w.calls.filter(x=>x.op!=="ref");

// a day of work: drill secs + graded items, a study sitting, a game round, a sprint
const items=(right,of,pre)=>Array.from({length:of},(_,i)=>({id:(pre||"c")+i,result:i<right?"c":"m"}));
function logs(spec){   // spec: {yyyymmdd: {drill:[secs,right,of], study:[secs,right,of], game:[secs,ok,of], sprint:secs}}
  const H={}, S={}, G={}, P=[];
  Object.keys(spec).forEach(k=>{ const d=spec[k];
    if(d.drill) H[k]={secs:d.drill[0],sessTimes:[d.drill[0]],items:items(d.drill[1],d.drill[2],"d"+k)};
    if(d.study){ (S.s1||(S.s1={}))[k]={sits:[{secs:d.study[0],total:d.study[2]}],secs:d.study[0],total:d.study[2],items:items(d.study[1],d.study[2],"s"+k).map(x=>({id:x.id,name:x.id,result:x.result}))}; }
    if(d.game) G[k]=[{game:"match",secs:d.game[0],items:Array.from({length:d.game[2]},(_,i)=>({id:"g"+k+i,ok:i<d.game[1]}))}];
    if(d.sprint) P.push({date:k.slice(0,4)+"-"+k.slice(4,6)+"-"+k.slice(6,8),a:20,secsA:d.sprint,ts:0,src:"drill"}); });
  return {history:{ava:H},studyLog:{ava:S},gameLog:{ava:G},sprintLog:{ava:P}};
}
const D3=(spec,more)=>Object.assign(logs(spec),{today:"20261108",budgetMin:25,sittings:2},more||{});

console.log("── mlWindow: the window math ──");
{ const w=world(), W=w.run("mlWindow");
  // 11/07: drill 10 min (16/20) + study 8 min (8/10) + games 6 min (½ → 3; 4/6 at ½) + sprint 2 min = 23 min; right (16+8+2)/(20+10+3) = 79 %
  const L=D3({"20261107":{drill:[600,16,20],study:[480,8,10],game:[360,4,6],sprint:120},
              "20261106":{drill:[900,9,10],study:[600,9,10]},
              "20261104":{drill:[1200,10,10]},
              "20261108":{drill:[3000,0,10]},          // today — still going, never in the window
              "20261101":{drill:[300,5,5]}});
  const r=W("ava",3,L);
  ok("three days with work, before today, newest first (a day with nothing logged is skipped, not counted)", r.ready&&r.n===3&&r.days.map(d=>d.day).join()==="20261107,20261106,20261104", r.days.map(d=>d.day));
  const d7=r.days[0];
  ok("a day's minutes = drill + study + games × ½ + sprint (10 + 8 + 3 + 2 = 23)", d7.min===23&&d7.drill===10&&d7.study===8&&d7.games===6&&d7.sprint===2, d7);
  ok("a day's first-try = the Scores formula (games' taps at ½): 26 of 33 → 79 %", d7.graded===33&&d7.right===26&&d7.pct===79, d7);
  ok("sittings = drill sittings + study sittings (games and sprints are not sittings)", d7.sittings===2&&r.days[2].sittings===1, r.days.map(d=>d.sittings));
  ok("the window: minutes = the per-day average (23 + 25 + 20) ÷ 3 = 23; first-try = right ÷ graded over the 3 days", r.minPerDay===23&&r.graded===63&&r.right===54&&r.pct===86, r);
  ok("…and the Load word against the dial (23 of 25 → Steady)", r.load&&r.load.word==="Steady"&&r.load.ratio===92, r.load);
  ok("each day matches scpMinutes / scpRight run on that one day", (()=>{ const wd={from:"20261106",to:"20261106"}; const m=w.run("scpMinutes")("ava",L.history,L.studyLog,L.gameLog,wd,1), rt=w.run("scpRight")("ava",L.history,L.studyLog,L.gameLog,wd); return m.total===r.days[1].min&&rt.pct===r.days[1].pct; })());
  const r2=W("ava",3,Object.assign({},L,{since:"20261105"}));
  ok("only days AFTER the last dial change (11/5) count → 2 days, not ready", !r2.ready&&r2.n===2&&r2.days.map(d=>d.day).join()==="20261107,20261106", r2.days.map(d=>d.day));
  ok("nothing logged → an empty window, not ready, no throw", (()=>{ const e=W("ava",3,{today:"20261108"}); return e.n===0&&!e.ready&&e.minPerDay===null&&e.pct===null; })());
  ok("a sitting left open over 2 h is not counted (the Scores rule)", W("ava",1,D3({"20261107":{drill:[9000,5,5],study:[300,5,5]}})).days[0].min===5);
  ok("a sprint with no live seconds: the clock × sheets (60 s a sheet without one)", (()=>{ const f=w.run("mlsSprintSecs"); return f({a:10,b:12,clk:90},7200)===180&&f({a:10},7200)===60&&f({a:10,secsA:45,secsB:50},7200)===95; })());
  ok("the default window is 3 days", W("ava",undefined,L).need===3); }

console.log("── mlSuggest: one rule ──");
const S=(w,spec,dial,more)=>w.run("mlSuggest")("ava",w.run("mlWindow")("ava",3,D3(spec,more)),Object.assign({minutes:25,sittings:2,stored:true,mode:"suggest",snooze:"",changed:""},dial||{}));
const days=(o)=>({"20261105":o,"20261106":o,"20261107":o});
{ const w=world();
  const over=S(w,days({drill:[1200,9,10],study:[480,9,10]}));   // 28 min, 90 %
  ok("over the dial 3 days → turn down 5 min", over&&over.dir==="down"&&over.what==="minutes"&&over.minutes===20&&over.sittings===2&&over.why==="over", over);
  ok("…the card's words: \"3 days at 90% first-try, 28 of 25 min — turn down to 20 min?\"", over&&over.text==="3 days at 90% first-try, 28 of 25 min — turn down to 20 min?", over&&over.text);
  const low=S(w,days({drill:[600,7,10],study:[300,7,10]}));      // 15 min, 70 %
  ok("under 80 % first-try 3 days (even under the dial) → turn down", low&&low.dir==="down"&&low.minutes===20&&low.why==="low", low);
  ok("over AND low → still ONE suggestion", (()=>{ const x=S(w,days({drill:[1200,7,10],study:[480,7,10]})); return x&&x.why==="over+low"&&x.dir==="down"; })());
  const mixed={"20261105":{drill:[1200,9,10],study:[480,9,10]},"20261106":{drill:[600,9,10],study:[300,9,10]},"20261107":{drill:[1200,9,10],study:[480,9,10]}};
  ok("over on only 2 of the 3 days → nothing (it has to hold every day)", S(w,mixed)===null);
  ok("low on 2 of 3, the third 90 % → nothing", S(w,{"20261105":{drill:[600,7,10]},"20261106":{drill:[600,7,10]},"20261107":{drill:[600,9,10],study:[300,9,10]}})===null);
  const up=S(w,days({drill:[600,9,10],study:[300,10,10]}));      // 15 min, 95 %, 2 sittings done of 2
  ok("under the dial + over 85 % + every sitting done → turn up 5 min", up&&up.dir==="up"&&up.minutes===30&&up.why==="room", up);
  ok("…\"3 days at 95% first-try, 15 of 25 min, every sitting done — turn up to 30 min?\"", up&&up.text==="3 days at 95% first-try, 15 of 25 min, every sitting done — turn up to 30 min?", up&&up.text);
  ok("under + high but a sitting not done (the day was cut short, not early) → nothing", S(w,days({drill:[900,10,10]}))===null);
  ok("in the 80–85 % band and under → nothing", S(w,days({drill:[600,8,10],study:[300,9,11]}))===null);
  ok("exactly at the dial (25 of 25) → nothing", S(w,days({drill:[1200,9,10],study:[300,9,10]}))===null);
  ok("at the 5-minute floor, over → one sitting fewer instead", (()=>{ const x=S(w,days({drill:[600,9,10],study:[300,9,10]}),{minutes:5,sittings:2}); return x&&x.what==="sittings"&&x.minutes===5&&x.sittings===1&&/1 sitting a day instead of 2\?$/.test(x.text); })());
  ok("at the floor with 1 sitting → nothing to turn down", S(w,days({drill:[600,9,10]}),{minutes:5,sittings:1})===null);
  ok("at the 120 ceiling → no turn up", S(w,days({drill:[600,10,10],study:[300,10,10]}),{minutes:120})===null);
  ok("nothing graded, over the dial → down, \"nothing graded\" in the words", (()=>{ const x=S(w,days({game:[3600,0,0]})); return x&&x.dir==="down"&&/^3 days at nothing graded, 30 of 25 min/.test(x.text); })());
  ok("only 2 days of work → not ready, nothing", S(w,{"20261106":{drill:[1200,7,10]},"20261107":{drill:[1200,7,10]}})===null);
  // the quiet rules
  const heavy=days({drill:[1200,7,10],study:[480,7,10]});
  ok("no dial stored for the kid → nothing", S(w,heavy,{stored:false})===null);
  ok("mode off → nothing", S(w,heavy,{mode:"off"})===null);
  ok("Not now: snoozed until 11/10 → nothing on 11/8; on 11/10 it may ask again", S(w,heavy,{snooze:"20261110"})===null&&!!S(w,days({drill:[1200,7,10],study:[480,7,10]}),{snooze:"20261110"},{today:"20261110"}));
  ok("a dial change on 11/6 → quiet (the window only counts days after it)", S(w,heavy,{changed:"20261106"},{since:"20261106"})===null);
  ok("…even a window built without `since` is held by the change day", S(w,heavy,{changed:"20261106"})===null);
  ok("a change on 11/2 with 3 heavy days after it → it asks again", !!S(w,heavy,{changed:"20261102"},{since:"20261102"}));
  ok("change day + 3 not yet past → quiet, even with 3 days logged after it", S(w,{"20261103":{drill:[1200,7,10]},"20261104":{drill:[1200,7,10]},"20261105":{drill:[1200,7,10]}},{changed:"20261102"},{since:"20261102",today:"20261105"})===null);
  ok("a change as a timestamp (load/last.at) reads as its day", w.run("_mlsKeyOf")(Date.UTC(2026,10,6,15))==="20261106"); }

// the app world: ava has a stored dial (25 min, 2 sittings) and 3 heavy days; ben has no dial
const heavyLogs=()=>{ const L=logs({"20261105":{drill:[1200,7,10],study:[480,7,10]},"20261106":{drill:[1200,7,10],study:[480,7,10]},"20261107":{drill:[1200,7,10],study:[480,7,10]}});
  L.history.ben=JSON.parse(JSON.stringify(L.history.ava)); L.studyLog.ben=JSON.parse(JSON.stringify(L.studyLog.ava)); return L; };
const appMd=(load)=>Object.assign(heavyLogs(),{ava:[{id:"i1",status:"introduction"},{id:"i2",status:"active",tier:"weekly"}],
  ava_settings:{intro_dots:5,max_learn_per_drill:3,load:Object.assign({budgetMin:25,sittings:2},load||{})},
  ava_sessions:{s1:{name:"Daily Study",kind:"all",newPerDay:5,passes:2},mx:{name:"Mix",kind:"mix",mixFinish:20}},ben_settings:{}});

console.log("── the 🔴 Now row ──");
{ const w=world({md:appMd()}); const r=w.run("mlsNowHTML")();
  ok("a kid with a suggestion → one row, counted once", r.n===1&&r.html.split('class="mls-row"').length===2, r);
  ok("the row: \"🧠 Ava: 3 days at 70% first-try, 28 of 25 min — turn down to 20 min?\" with Apply and Not now", /🧠 <b>Ava<\/b>: 3 days at 70% first-try, 28 of 25 min — turn down to 20 min\?/.test(r.html)&&/mlsApply\('ava'\)"[^>]*>Apply</.test(r.html)&&/mlsSnooze\('ava'\)"[^>]*>Not now</.test(r.html), r.html);
  ok("the kid with no dial (same heavy days) gets no row", !/Ben/.test(r.html));
  ok("rendering writes nothing", writes(w).length===0, w.calls); }
{ const md=appMd(); delete md.ava_settings.load; const w=world({md}); const r=w.run("mlsNowHTML")();
  ok("no kid has a dial stored → {n:0, html:\"\"} (the Now card byte-identical)", r.n===0&&r.html==="", r); }
{ const w=world({md:appMd(),mom:false}); ok("not Mom → nothing shown", w.run("mlsNowHTML")().html===""); }
{ const w=world({md:appMd({mode:"off"})}); ok("mode off → no row", w.run("mlsNowHTML")().html===""); }
{ const w=world({md:appMd({budgetMin:30})}); ok("inside the band (28 of 30, but 70 %) → still down for accuracy", /turn down to 25 min/.test(w.run("mlsNowHTML")().html)); }

console.log("── Apply ──");
{ // what the dial itself would write for 20 min, 2 sittings, from the same state
  const ref=world({md:appMd()}); ref.run("mldSet")("ava",20,2); const refUp=writes(ref).filter(x=>x.op==="update")[0];
  const w=world({md:appMd()}); const b=w.run("mlsApply")("ava"); const ws=writes(w);
  ok("Apply = ONE multi-path update at the root (no set, no remove)", ws.length===1&&ws[0].op==="update"&&ws[0].p===undefined, ws.map(x=>x.op+" "+x.p));
  const strip=u=>{ const o=JSON.parse(JSON.stringify(u)); Object.keys(o).forEach(k=>{ if(/load\/last$/.test(k)&&o[k]) delete o[k].at; }); return o; };
  ok("…exactly the dial's own batch for 20 min (the same paths, the same values)", JSON.stringify(Object.keys(ws[0].u).sort())===JSON.stringify(Object.keys(refUp.u).sort())&&JSON.stringify(strip(ws[0].u))===JSON.stringify(strip(refUp.u)), Object.keys(ws[0].u));
  ok("…every path under the kid's own mastery settings/sessions; never snooze or mode", Object.keys(ws[0].u).every(p=>/^mastery\/ava_(settings|sessions)\//.test(p))&&!Object.keys(ws[0].u).some(p=>/snooze|mode/.test(p)));
  ok("the dial now reads 20, with load/last for Undo", w.masteryData.ava_settings.load.budgetMin===20&&w.masteryData.ava_settings.load.last&&b&&b.moved.some(m=>m.k==="budgetMin"&&m.from===25&&m.to===20));
  const r=w.run("mlsNowHTML")();
  ok("after Apply: no suggestion (quiet after a change); the what-changed line + ↩ Undo show on this device", r.n===0&&/class="mls-done"/.test(r.html)&&/applied/.test(r.html)&&/Moved: New a day \(Daily Study\) 5 → \d/.test(r.html)&&/mldUndo\('ava'\)"[^>]*>↩ Undo</.test(r.html)&&!/class="mls-row"/.test(r.html), r.html);
  w.run("mldUndo")("ava"); const u2=writes(w).filter(x=>x.op==="update")[1];
  ok("Undo (the dial's own) puts the dial back to 25", u2&&u2.u["mastery/ava_settings/load/budgetMin"]===25&&w.masteryData.ava_settings.load.budgetMin===25);
  ok("…and the done row goes away", !/mls-done/.test(w.run("mlsNowHTML")().html)); }
{ const md=appMd(); md.ava_settings.load.mode="off"; const w=world({md}); ok("no suggestion → Apply writes nothing", w.run("mlsApply")("ava")===false&&writes(w).length===0); }
{ const w=world({md:appMd(),mom:false}); ok("not Mom → Apply / Not now / Mode write nothing", w.run("mlsApply")("ava")===false&&w.run("mlsSnooze")("ava")===false&&w.run("mlsSetMode")("ava","off")===false&&writes(w).length===0); }

console.log("── Not now ──");
{ const w=world({md:appMd()}); w.run("mlsSnooze")("ava"); const ws=writes(w);
  ok("Not now = one targeted write: load/snooze = today + 3", ws.length===1&&ws[0].op==="update"&&JSON.stringify(ws[0].u)===JSON.stringify({"mastery/ava_settings/load/snooze":"20261111"}), ws);
  ok("…the row is gone today", w.run("mlsNowHTML")().html==="");
  const later=world({md:Object.assign(appMd(),{}),today:"20261111"}); later.masteryData.ava_settings.load.snooze="20261111";
  ok("…and back on 11/11", /class="mls-row"/.test(later.run("mlsNowHTML")().html)); }

console.log("── Mode ──");
{ const w=world({md:appMd()});
  ok("the dial's card shows Suggest / Off once the dial is stored", /class="mls-mode"/.test(w.run("mldDialHtml")("ava"))&&/mlsSetMode\('ava','off'\)/.test(w.run("mldDialHtml")("ava")));
  ok("…and not before (byte-identical dial card with no dial)", !/mls-mode/.test(w.run("mldDialHtml")("ben")));
  ok("the default is suggest (unset)", w.run("mlsDialOf")("ava").mode==="suggest");
  w.run("mlsSetMode")("ava","off"); const ws=writes(w);
  ok("Off = one targeted write of load/mode", ws.length===1&&JSON.stringify(ws[0].u)===JSON.stringify({"mastery/ava_settings/load/mode":"off"}), ws);
  ok("…and the suggestion stops", w.run("mlsNowHTML")().html==="");
  ok("an unknown mode (e.g. auto) is refused", w.run("mlsSetMode")("ava","auto")===false&&writes(w).length===1); }

console.log("── dry run ──");
{ const w=world({md:appMd(),dry:true}); w.run("mlsNowHTML")(); w.run("mlsApply")("ava"); w.run("mldUndo")("ava"); w.run("mlsSnooze")("ava"); w.run("mlsSetMode")("ava","off");
  ok("?dryrun=1: render, Apply, Undo, Not now and Mode write nothing", w.calls.length===0, w.calls); }
{ const w=world({md:appMd(),noDb:true}); ok("no database (demo / offline) → no throw, memory only", w.run("mlsApply")("ava")&&w.masteryData.ava_settings.load.budgetMin===20); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
