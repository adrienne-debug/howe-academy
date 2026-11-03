/* 🗓 SCHEDBAR — the Schedule's own sub-bar (Schedule · Wins · History · Admin) is retired (her plan-2 yes 2026-11-02): the Schedule
 * tab just shows the schedule; inside Mom's Day ▸ Schedule only Today · Week · Month remain; the Mom chip on the main Schedule is her
 * view alone (no tools, switch on or off); Wins / History / Admin doors lead to Mom's Day pages.   run: node test_sched_bar.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// SCHEDBAR_START"), b=src.indexOf("// SCHEDBAR_END");
ok("SCHEDBAR block is marked once, inside renderSchedSubtabs", a>0&&b>a&&src.split("// SCHEDBAR_START").length===2&&fn("renderSchedSubtabs").indexOf("// SCHEDBAR_START")>0);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(src.slice(a,b)));

console.log("── the bar is gone ──");
{ const rs=fn("renderSchedSubtabs");
  ok("renderSchedSubtabs still draws ▸ Schedule's strip (#msv-bar), then hides and empties the sub-bar — no buttons at all", /const on=\(momSchedView&&tab==="schedule"\); mb\.style\.display=on\?"contents":"none"/.test(rs)&&/const el=document\.getElementById\("sched-subtabs"\);\n  if\(el\)\{ el\.style\.display="none"; el\.innerHTML=""; \}/.test(rs)&&!/sched-sub'|Wins<\/button>|History<\/button>|Admin<\/button>/.test(rs));
  ok("the paint rule never shows it (navBarsShow)", /"sched-subtabs": false,/.test(fn("navBarsShow")));
  ok("the element stays in the page (the stack measures it as 0: --sub-h)", /<div id="sched-subtabs" style="display:none"><\/div>/.test(src)&&/"sched-subtabs":"--sub-h"/.test(src));
  ok("Mom's Day ▸ Schedule's own strip is untouched: banner, menu, Today · Week · Month (no Admin)", /return ban\+mpSubnav\('cal'\)\+'<div style="display:flex;gap:8px;padding:8px 12px;max-width:520px;margin:0 auto">'\+tb\('today'/.test(fn("msvBarHTML"))&&!/Admin/.test(fn("msvBarHTML")));
  ok("Today tapped inside ▸ Schedule closes an open Admin / History / Wins page (the bar used to)", /^function msvEnter\(\)\{\n  if\(momSchedView&&tab==="schedule"\)\{ schedShowAdmin=false; schedShowHistory=false; schedShowPace=false; schedShowBoard=false; renderAll\(\); return; \}/.test(fn("msvEnter"))); }

console.log("── the Mom chip is her view alone ──");
{ const L=["_momSuspend","_momResume","momHereReal","haMomOn","haMomOff"].map(fn).join("\n");
  const LINE=(src.match(/\n(  try\{ if\(tab==="schedule"&&!momSchedView\)\{ _momSuspend\(\); \} else _momResume\(\); \}catch\(e\)\{\}[^\n]*)\n/)||[])[1];
  ok("every paint: on the main Schedule Mom mode is set aside under EVERY chip, the Mom chip too", !!LINE&&fn("_renderAllInner").indexOf(LINE)>0&&/her plan-2/.test(LINE));
  const lens=(tab,msv,kid,on)=>new Function("HA_LS","var _momSusp=null,momModeActive=false,momPinUnlocked=false,adminPinUnlocked=false,mastAdminPinOk=false;\n"+L+"\nreturn function(tab,momSchedView,kid,on){ if(on) haMomOn(); else haMomOff();\n"+LINE+"\nreturn {active:momModeActive,real:momHereReal()}; };")({setItem(){}})(tab,msv,kid,on);
  ok("switch on, Mom chip on the main Schedule → no Mom tools (set aside), the switch itself still on", (()=>{ const r=lens("schedule",false,"mom",true); return r.active===false&&r.real===true; })());
  ok("switch on, Mom's Day ▸ Schedule, Mom chip → her tools (as always)", lens("schedule",true,"mom",true).active===true);
  ok("tapping the Mom chip still only picks her view (selKid: never a code, never off)", /if\(k==="mom"\)\{ kid="mom"; schedShowAdmin=false; renderAll\(\); window\.scrollTo\(\{top:0,behavior:'smooth'\}\); return; \}/.test(fn("selKid")));
  ok("her agenda draws whenever the Mom chip is picked; check-offs behave as a kid's (cards gate Mom tools on momHereCards)", /\n  if\(kid==="mom"\)\{\n    h\+=momAgendaHtml\(tasks\);/.test(src)&&/function momHereCards\(\)\{ return momHere\(\)&&!\(typeof tab!=="undefined"&&tab==="kids"\); \}/.test(src)); }

console.log("── the old doors lead to Mom's Day ──");
{ const gs=fn("goToStars");
  ok("⭐ / Wins: Mom (switch really on) → Mom's Day ▸ School ▸ Wins; a kid → their Corner", /if\(typeof momHereReal==="function"&&!momHereReal\(\)\)\{ showTab\("kids"\); return; \}\n  mpGoto\('wins'\); \}/.test(gs)&&!/schedShowPace=true/.test(gs));
  const hq=fn("momHQGo");
  ok("HQ's History / Trends / Attendance / Report rows → School ▸ History on that tab", /case "history": case "trends": case "attendance": case "report":\n      histTab=\(t==="history"\?"log":t\);\n      mpGoto\('hist'\); return;/.test(hq)&&!/schedShowHistory=true/.test(hq));
  ok("HQ's Mastery / Units / Notebooks rows → the tab framed by Mom's Day (mpSchoolOpen)", /case "mastery": mpSchoolOpen\('mhq'\); return;/.test(hq)&&/case "units": mpSchoolOpen\('units'\); return;/.test(hq)&&/case "notebook": mpSchoolOpen\('notebook'\); return;/.test(hq));
  ok("the kids' old Admin door (msvOpenAdmin) lands on Mom's Day ▸ HQ once that page exists (typeof-guarded, merge-order safe)", /^function msvOpenAdmin\(\)\{ if\(typeof MP_GROUP_VIEWS!=="undefined"\)\{ mpGoto\('hq'\); return; \}/.test(fn("msvOpenAdmin")));
  ok("nothing in the app draws a button to toggleSchedPace / toggleSchedHistory / toggleSchedAdmin / msvOpenAdmin any more", !/onclick="toggleSchedPace\(\)|onclick="toggleSchedHistory\(\)|onclick="toggleSchedAdmin\(\)|msvOpenAdmin\(\)'\)\+'">/.test(src)); }
ok("no Firebase writes in the touched functions", !/db\.|\.ref\(/.test(fn("renderSchedSubtabs")+fn("goToStars")+fn("msvOpenAdmin")+fn("msvEnter")));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
