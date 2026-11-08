/*
 * 🪄 GWGONE — slice D of PLAN_living_schedule_finish_2026-11-08.md (her decision 2026-10-29: the Generate Week page goes away;
 * the day banner's Mom-only 🔄 Regenerate stays the ONLY safety). Source scans + the hint run in a sandbox:
 *   0. shape: one GWGONE block, no kid or family names (block and this file)
 *   1. the doors that opened Generate Week on THIS week are gone: "Regenerate Week N", the ✨ notice's Review (agReview), the
 *      "Schedule structure changed" Regenerate; the HQ row / Mom's Day banner no longer say "Regenerate this week"
 *   2. the Plan Next Week wizard is gone — every function, its state, its CSS, "Plan Week N →"; each of its settings has a home on
 *      📅 This week (🚗 car school the last one, test_this_week_strip.js §8); the page keeps 📓 notebooks + ⬇️ week JSON
 *   3. the Phase-2 week-config card helpers nothing called are gone; gwShowToast / gwNormSitter stay
 *   4. the engine is untouched and still the self-build's: generateWeek, gwCommit, gwEffectiveConfig, autoGenerateWeekIfNeeded
 *   5. weekConfig/<wn> is still read (self-build, Regenerate, the strip's live read); nothing removes or migrates it
 *   6. 🔄 Regenerate (schedRegenerateNow) is still on the day banner, Mom only, same path
 *   7. the hint: the exact line where the button was, once per device until ✕ (localStorage), safe when storage throws
 *   run:  node test_no_generate_week.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name,from){ from=from||src; const sig="function "+name+"("; const i=from.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=from.indexOf("{",i);k<from.length;k++){ if(from[k]==="{")d++; else if(from[k]==="}"){ d--; if(!d) return from.slice(i,k+1); } } throw new Error("unclosed "+name); }
function has(name){ return src.indexOf("function "+name+"(")>=0; }
function block(a,b){ const i=src.indexOf("// "+a), j=src.indexOf("// "+b); if(i<0||j<i) throw new Error("no block "+a); return src.slice(i,j+("// "+b).length); }
const GG=block("GWGONE_START","GWGONE_END");
const NAMES=/lincoln|ellis|lucy|julian|taylor|kenzie|makenzie|andrew|sara|howe|dewalt|burris|maggie/i;
const HINT="The week builds itself on Sunday — change this week in 📅 This week.";

console.log("0. shape");
{ ok("one GWGONE block",src.indexOf("// GWGONE_START")>0&&src.indexOf("// GWGONE_START",src.indexOf("// GWGONE_START")+1)<0);
  ok("no kid or family names in the block",!NAMES.test(GG));
  const me=fs.readFileSync(__filename,"utf8").replace(/const NAMES=.*\n/,"");
  ok("no kid or family names in this test",!NAMES.test(me)); }

console.log("1. the doors into Generate Week for THIS week are gone");
{ ok("no \"Regenerate Week N\" button on the Generate Week page",!/>Regenerate Week '\+cw\+'</.test(src)&&!/openPlanNextWeek\('\+cw\+'\)/.test(fn("renderAdminGenerate")));
  ok("nothing opens the wizard on the current week",!/openPlanNextWeek\('\+currWeekNum\(\)\+'\)/.test(src)&&!/openPlanNextWeek\(currWeekNum\(\)\)/.test(src));
  ok("the ✨ auto-built notice has no Review door (agReview gone), keeps its ✕",!/agReview/.test(src)&&/onclick="agDismiss\(\)"/.test(fn("renderSchedule"))&&/Built from the Calendar \+ Lesson Map\. Change this week in 📅 This week\./.test(fn("renderSchedule")));
  const rs=fn("renderSchedule"), i=rs.indexOf("Schedule structure changed"), sc=rs.slice(i,rs.indexOf("}catch(e){}",i));
  ok("\"Schedule structure changed\" has no button into the page, it names 🔄 Regenerate",i>0&&!/<button/.test(sc)&&/🔄 Regenerate on the day banner lays them in now\./.test(sc));
  ok("HQ row: no \"Regenerate this week\" / \"plan next week\"",/_hqRow\("generate","🪄","Generate Week","Notebooks, week JSON — the week builds itself; change it in 📅 This week"\)/.test(src)&&!/Regenerate this week/.test(src)&&!/[Pp]lan next week/.test(src.replace(/\/\/[^\n]*/g,"")));
  ok("Settings ▸ sitter points at 📅 This week, not Plan Next Week",!/Set days &amp; times in Plan Next Week/.test(src)&&/Set days &amp; times in 📅 This week/.test(src)); }

console.log("2. the Plan Next Week wizard is gone; its settings live on 📅 This week");
{ ["openPlanNextWeek","pnwStartWizard","closePlanNextWeek","pnwGenerate","pnwApply","pnwBack","renderPlanNextWeek","pnwCheckPin","pnwToggleSitter","pnwToggleWithSitter",
   "pnwToggleSkip","pnwToggleLate","pnwToggleCar","pnwToggleDay","pnwShowKid","pnwSaveAndGenerate","gwWeekExists","gwNextRealWeek"].forEach(n=>ok(n+" gone",!new RegExp("\\b"+n+"\\b").test(src)));
  ok("its state (let pnw…) and overlay are gone",!/\bpnw[A-Z]\w*/.test(src)&&!/pnw-overlay/.test(src));
  ok("its CSS is gone except .pnw-chip / .on (helpers and Settings draw with them)",!/\.pnw-(?!chip[{.])[\w-]+\{/.test(src)&&/\.pnw-chip\{/.test(src)&&/\.pnw-chip\.on\{/.test(src)&&!/\.pnw-chip\.skip/.test(src));
  ok("no whole-node weekConfig write left (the wizard's .set({...gwConfig}))",!/weekConfig\/"\+[^)]*\)\.set\(/.test(src));
  const TW=block("THISWEEK_START","THISWEEK_END");
  const homes={"sitter days + hours":/function twsToggleSitter\(/,"with the sitter":/function twsToggleWithSitter\(/,"skip days → each kid off":/function twsToggleKid\(/,
    "late start → ⏰ day times":/function twsTimes\(/,"Include Saturday":/function twsToggleSaturday\(/,"🚗 car school":/function twsToggleCar\(/,"next week":/function twsSetNext\(/};
  Object.keys(homes).forEach(k=>ok("home on 📅 This week: "+k,homes[k].test(TW)));
  ok("car school writes the leaf gwEffectiveConfig reads",/"weekConfig\/"\+wn\+"\/carSchool\/"\+dn/.test(TW)&&/carSchool:Object\.assign\(\{\},\(s&&s\.carSchool\)\|\|\{\}\)/.test(fn("_abMerge")));
  const g=fn("renderAdminGenerate");
  ok("the Generate Week page keeps 📓 notebooks and ⬇️ week JSON (their door), and the hint",/haOpenNotebookPicker\(\)/.test(g)&&/downloadWeekJSON\(\)/.test(g)&&/gwGoneHintHTML\(\)/.test(g)&&!/Plan Week/.test(g.replace(/\/\/[^\n]*/g,""))); }

console.log("3. the Phase-2 week-config card helpers nothing called are gone");
{ ["loadWeekConfig","saveWeekConfig","gwToggleCard","gwToggleSitter","gwSetSitterTime","gwSetSitterStart","gwToggleSkip","gwToggleLate","gwSetLateTime","gwToggleCar","gwSetCarEnd","gwSetCarNote","gwToggleSaturday"].forEach(n=>ok(n+" gone",!new RegExp("\\b"+n+"\\b").test(src)));
  ok("gwConfigOpen gone",!/gwConfigOpen/.test(src));
  ok("gwShowToast and gwNormSitter stay (used everywhere / by the engine)",has("gwShowToast")&&has("gwNormSitter")&&/gwNormSitter\(/.test(fn("generateWeek")+fn("schedRegenerateNow"))); }

console.log("4. the engine is untouched and is the self-build's");
{ ["generateWeek","gwCommit","gwEffectiveConfig","autoGenerateWeekIfNeeded","runGenerateWeek","_abBuild","autoBuildOnDayRoll"].forEach(n=>ok(n+" present",has(n)));
  const ab=fn("_abBuild");
  ok("the self-build builds from gwEffectiveConfig → generateWeek → gwCommit",/const cfg=gwEffectiveConfig\(wn,saved\);/.test(ab)&&/const gen=generateWeek\(cfg\);/.test(ab)&&/gwCommit\(\);/.test(ab));
  ok("autoGenerateWeekIfNeeded reads the saved settings, then _abBuild",/_abLoadSaved\(wn,function\(saved\)\{[\s\S]{0,80}_abBuild\(wn,saved\)/.test(fn("autoGenerateWeekIfNeeded")));
  ok("the day roll runs the same self-build",/autoGenerateWeekIfNeeded\(\)/.test(fn("autoBuildOnDayRoll"))&&/autoBuildOnDayRoll\(\)/.test(fn("dayRollCheck"))); }

console.log("5. weekConfig/<wn> still read; nothing removes or migrates it");
{ ok("the self-build reads weekConfig/<wn> from the server",/db\.ref\("weekConfig\/"\+wn\)\.once\("value"/.test(fn("_abLoadSaved")));
  ok("🔄 Regenerate reads weekConfig/<wn>",/db\.ref\("weekConfig\/"\+wn\)\.once\("value"/.test(fn("schedRegenerateNow")));
  ok("the strip keeps the board week's weekConfig live",/db\.ref\("weekConfig\/"\+wn\); r\.on\("value"/.test(src));
  ok("gwEffectiveConfig still merges the saved node (sitter, skip, late start, car school, Saturday)",/\(s&&\(s\.babysitter\|\|s\.\w+\)\)/.test(fn("_abMerge"))&&/carSchool:Object\.assign\(\{\},\(s&&s\.carSchool\)\|\|\{\}\)/.test(fn("_abMerge"))&&/lateStart:Object\.assign/.test(fn("_abMerge")));
  ok("no code removes weekConfig",!/weekConfig[^\n]{0,60}\.remove\(/.test(src)&&!/"weekConfig\/[^"]*"\s*\]\s*=\s*null/.test(src)); }

console.log("6. 🔄 Regenerate stays, Mom only, same path");
{ const r=fn("schedRegenerateNow");
  ok("the day banner draws 🔄 Regenerate behind momHere",/\(momHere\(\)\?'<button class="bo-btn" onclick="schedRegenerateNow\(\)">🔄 Regenerate<\/button>':''\)/.test(src));
  ok("schedRegenerateNow: Mom only, confirm, runGenerateWeek → gwCommit",/if\(!momHere\(\)\) return;/.test(r)&&/confirm\("⚠️ Regenerate Week "\+wn\+" from right now\?/.test(r)&&/runGenerateWeek\(\);/.test(r)&&/gwCommit\(\);/.test(r)); }

console.log("7. the hint line");
function hintWorld(store){
  const els={}; const doc={ getElementById:id=>els[id]||null };
  const ctx={ HA_LS:store, document:doc, console };
  vm.createContext(ctx); vm.runInContext(GG,ctx);
  return {ctx,els};
}
function memLS(){ const m={}; return { m, getItem:k=>(k in m?m[k]:null), setItem:(k,v)=>{ m[k]=String(v); }, removeItem:k=>{ delete m[k]; } }; }
{ const ls=memLS(); const w=hintWorld(ls);
  const h=w.ctx.gwGoneHintHTML();
  ok("shows the exact line with a ✕",h.includes(HINT)&&/onclick="gwGoneHintDismiss\(\)"/.test(h)&&/&times;/.test(h),h);
  ok("shows again until dismissed (a redraw keeps it)",w.ctx.gwGoneHintHTML()===h);
  let removed=false; w.els["gw-gone-hint"]={ remove:()=>{ removed=true; } };
  w.ctx.gwGoneHintDismiss();
  ok("✕ remembers it on this device (localStorage) and takes the line away now",ls.m["ha_gw_gone_hint"]==="1"&&removed);
  ok("after ✕ it never shows on this device",w.ctx.gwGoneHintHTML()==="");
  const w2=hintWorld(memLS());
  ok("another device (its own storage) still sees it once",w2.ctx.gwGoneHintHTML().includes(HINT));
  const bad={ getItem:()=>{ throw new Error("blocked"); }, setItem:()=>{ throw new Error("blocked"); }, removeItem:()=>{} };
  const w3=hintWorld(bad); let threw=false;
  try{ w3.ctx.gwGoneHintHTML(); w3.ctx.gwGoneHintDismiss(); }catch(e){ threw=true; }
  ok("storage that throws: still shows, ✕ doesn't throw",!threw&&w3.ctx.gwGoneHintHTML().includes(HINT));
  ok("the hint writes nothing to Firebase",!/db\.|firebase/i.test(GG.replace(/\/\/[^\n]*/g,""))); }
{ // the Generate Week page as drawn: the hint where "Regenerate Week N" was, "Plan Week N →" still there
  const ls=memLS(); const el={innerHTML:""};
  const ctx={ HA_LS:ls, document:{getElementById:()=>null}, console,
    currData:{subjects:{a:1}}, WK:"week11", gwStatus:"", gwResult:null, esc:s=>s, cap:s=>s };
  vm.createContext(ctx); vm.runInContext(GG+"\n"+fn("renderAdminGenerate"),ctx);
  ctx.renderAdminGenerate(el,"");
  const h=el.innerHTML;
  ok("the page shows the hint before the buttons",h.includes(HINT)&&h.indexOf(HINT)<h.indexOf("haOpenNotebookPicker()"));
  ok("no Regenerate Week / Plan Week buttons; notebooks and week JSON still there",!/Regenerate Week|Plan Week|openPlanNextWeek/.test(h)&&/haOpenNotebookPicker\(\)/.test(h)&&/downloadWeekJSON\(\)/.test(h));
  ls.m["ha_gw_gone_hint"]="1"; ctx.renderAdminGenerate(el,"");
  ok("dismissed on this device → the page has no hint",!el.innerHTML.includes(HINT)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
