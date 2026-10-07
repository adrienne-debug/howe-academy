/*
 * 🔔 Math Sprint end-of-minute chime (her report 2026-10-01: "math sprint didn't make a sound when minute done").
 * Cause: bbChime() built a brand-new AudioContext at the moment the timer hit zero — 60 s after the last tap — and
 * iPad Safari / Chrome keep a context created outside a tap muted. The Start tap already unlocks bbAlarmCtx
 * (bbAudioUnlock); the chime now reuses that context and resumes it, like the brain-break alarm does.
 *   run:  node test_sprint_chime.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function slice(n){ const i=src.indexOf("function "+n+"("); return src.slice(i,src.indexOf("\n}",i)+2); }
console.log("🔔 the chime reuses the unlocked context");
{
  // a fake AudioContext that records whether it was created inside the chime, and whether resume() was called
  const made=[]; let resumed=0;
  function FakeCtx(){ this.state="suspended"; this.currentTime=0; this.destination={}; made.push(this); }
  FakeCtx.prototype.resume=function(){ resumed++; this.state="running"; return Promise.resolve(); };
  FakeCtx.prototype.createOscillator=function(){ return {connect(){},start(){},stop(){},frequency:{}}; };
  FakeCtx.prototype.createGain=function(){ return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}; };
  const ctx={window:{AudioContext:FakeCtx},bbAlarmCtx:null,console,Promise};
  vm.createContext(ctx); vm.runInContext("let bbAlarmCtx=null;\n"+slice("bbAudioUnlock")+"\n"+slice("bbChime"),ctx);
  vm.runInContext("bbAudioUnlock()",ctx);           // the Start tap
  ok("the Start tap unlocks one context",made.length===1&&resumed===1,[made.length,resumed]);
  vm.runInContext("bbChime()",ctx);                 // 60 s later, the minute is up
  ok("the chime plays on that same context — it does not open a new one",made.length===1,made.length);
  made[0].state="suspended"; vm.runInContext("bbChime()",ctx);
  ok("a context the browser suspended is resumed before the tones",resumed===2,resumed);
  made[0].state="closed"; vm.runInContext("bbChime()",ctx);
  ok("a closed context is replaced, so the chime never silently dies",made.length===2,made.length);
}
console.log("wiring");
// MSBUZZ (2026-10-07): the end of the minute now rings msBuzz (a sharp buzzer) instead of bbChime — see test_sprint_buzz.js
ok("Math Sprint's Start unlocks audio inside the tap",/function msTimerStart\(\)\{\n[^\n]*\n  msTimerReset\(\); try\{ if\(typeof bbAudioUnlock==="function"\) bbAudioUnlock\(\); \}catch\(e\)\{\}/.test(src));
ok("…and rings the buzzer when the minute ends",/function msTimerEnd\(\)\{[\s\S]{0,300}try\{ msBuzz\(\); \}catch\(e\)\{\}/.test(src));
ok("bbChime reuses bbAlarmCtx and resumes it",/function bbChime\(\)\{\n  try\{\n(?:\s*\/\/[^\n]*\n)*\s*if\(!bbAlarmCtx\|\|bbAlarmCtx\.state==="closed"\) bbAlarmCtx=new \(window\.AudioContext\|\|window\.webkitAudioContext\)\(\);\n\s*const ctx=bbAlarmCtx;\n\s*if\(ctx\.state==="suspended"\)\{ try\{ ctx\.resume\(\)\.catch\(function\(\)\{\}\); \}catch\(e\)\{\} \}/.test(src));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
