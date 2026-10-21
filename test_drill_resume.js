/*
 * 🎯 DRILL_RESUME + 📝 DRILL_UNMARKED (her report 2026-10-20: "i had to go to another page and come back and it didnt keep the drill at
 * my last spot"; "could we make it pop up the ones not answered?"). A resume — reload OR tab switch — lands on the next unmarked card;
 * Save with unmarked cards shows them with Go back / Save anyway.  run: node test_drill_resume.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
// Lucy's drill: 6 slideshow cards a..f (all learning cards, none are quiz items)
const DUE=["a","b","c","d","e","f"].map(id=>({id:id,prompt:id.toUpperCase(),status:"introduction"}));
function mk(scores,idx){ const store={}, calls=[];
  const ctx={console,Object,Array,String,JSON,Date,Number,
    HA_LS:{getItem:k=>store[k]||null,setItem:(k,v)=>{ store[k]=v; },removeItem:k=>{ delete store[k]; }}, store,
    masteryKid:"lucy", mastLogMode:false, mastLogScores:{}, mastLogStartTs:1, mastLogPausedMs:0, mastLogPauseAt:null, mastSlideIdx:0, mastFlipped:false,
    mastSessionDue:()=>DUE, mastGetPrintNum:()=>3, mastItemIsQuiz:()=>false, mastRescueStaleLog:()=>{ calls.push("rescue"); }, _mastRe:()=>{ calls.push("re"); }, calls,
    document:{getElementById:()=>null}, mastOrderedDue:()=>DUE, renderMastery:()=>{}, mastSpellPeek:null};
  vm.createContext(ctx);
  vm.runInContext(["mastNextUnmarkedIdx","mastRestoreLog","mastPersistLog","mastClearLogPersist","mastStartLog","mastSaveAsk","mastSaveGoBack","mastSaveAnyway"].map(fn).join("\n")+"\nlet _mastResumed=\"\"; let mastSaveAsking=false; function mastSaveResults(){ calls.push('save'); mastSaveAsking=false; }",ctx);
  if(scores){ ctx.mastLogMode=true; ctx.mastLogScores=scores; ctx.mastSlideIdx=idx||0; vm.runInContext("mastPersistLog()",ctx); }
  ctx.get=e=>vm.runInContext(e,ctx); return ctx; }

console.log("1. Her day — marked a, b, c; went to another page; came back (no reload: Log mode still on in memory, card reset to 0)");
{ const c=mk({a:"c",b:"m",c:"shown"},3); c.mastSlideIdx=0;   // another page re-drew; the slideshow would start at card 1
  c.get("mastRestoreLog()"); ok("resume lands on d (index 3) — the first card with no mark — not card 1", c.mastSlideIdx===3&&c.mastLogMode===true, c.mastSlideIdx);
  c.mastSlideIdx=1; c.get("mastRestoreLog()"); ok("…and places the card only once: her own ← → taps after that are hers", c.mastSlideIdx===1);
}
console.log("2. The same after a RELOAD (Log mode gone from memory, scores in storage)");
{ const c=mk({a:"c",b:"m",c:"shown",d:"c"},4); c.mastLogMode=false; c.mastLogScores={}; c.mastSlideIdx=0;
  c.get("mastRestoreLog()"); ok("resume: Log mode back, scores back, on e (index 4)", c.mastLogMode===true&&c.mastLogScores.d==="c"&&c.mastSlideIdx===4, [c.mastSlideIdx,c.mastLogScores]);
}
console.log("3. Everything marked → resume lands on the last card (nothing left)");
{ const c=mk({a:"c",b:"c",c:"c",d:"c",e:"c",f:"shown"},0); c.mastSlideIdx=0; c.get("mastRestoreLog()"); ok("index 5 (the last card)", c.mastSlideIdx===5); }
console.log("4. 📝 Save with cards unmarked");
{ const c=mk({a:"c",b:"m"},2); c.get("mastSaveAsk()"); ok("Save opens the question instead of saving", c.get("mastSaveAsking")===true&&c.calls.indexOf("save")<0);
  c.mastSlideIdx=0; c.get("mastSaveGoBack()"); ok("Go back: the slideshow jumps to c (index 2), the question closes", c.mastSlideIdx===2&&c.get("mastSaveAsking")===false);
  c.get("mastSaveAsk()"); c.get("mastSaveAnyway()"); ok("Save anyway: saves (marked cards only — unmarked ones have no score, so the save skips them)", c.calls.indexOf("save")>=0&&c.get("mastSaveAsking")===false);
  const H=src.slice(src.indexOf("// ── BOTTOM BAR ──"),src.indexOf("// ── BOTTOM BAR ──")+3000);
  ok("the bar: Save is always tappable; unmarked → mastSaveAsk; the list names the cards (prompt) with Go back / Save anyway / Cancel", /onclick="'\+\(allScored\?'mastSaveResults\(\)':'mastSaveAsk\(\)'\)\+'"/.test(H)&&/not marked yet/.test(H)&&/i\.prompt\|\|i\.name\|\|i\.id/.test(H)&&/mastSaveGoBack\(\)/.test(H)&&/mastSaveAnyway\(\)/.test(H));
  ok("no 'disabled' Save button any more", !/mastSaveResults\(\)"'\+\(allScored\?'':' disabled'\)/.test(src));
}
console.log("5. A fresh Log / a kid switch place the card fresh");
{ ok("mastStartLog and mastSetKid clear the 'already placed' mark", /function mastStartLog\(\)\{ _mastResumed="";/.test(src)&&/function mastSetKid\(k,noRender\)\{ _mastResumed="";/.test(src)); }
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
