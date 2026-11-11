// ABCTRAIN_AUDIO — her report 2026-11-11: the ABC song's lights ran but "no sound". The kid's tap/drop unlocks the shared
// AudioContext inside the gesture, and a song started on a context that is not running shows "🔊 Tap for sound".
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const fn=(name)=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } };
ok("block exists", src.indexOf("// ABCTRAIN_AUDIO_START")>0 && src.indexOf("// ABCTRAIN_AUDIO_END")>src.indexOf("// ABCTRAIN_AUDIO_START"));
ok("trainTap unlocks first", /function trainTap\(ci\)\{\s*_trainUnlock\(\);/.test(src));
ok("trainDrop unlocks first", /function trainDrop\(ti,k\)\{\s*_trainUnlock\(\);/.test(src));
ok("trainSing marks muted after scheduling", /st\.song\.tones=_trainTones\(notes\);\s*st\.song\.muted=\(_trainCtxRunning\(\)===false\);/.test(src));
ok("finish shows 🔊 only while tones are scheduled, muted, not ended", /if\(sg\.tones&&sg\.muted&&!end\) h\+='<button onclick="trainSound\(\)"/.test(src));
ok("no Firebase write in the block", !/\.ref\(|\.set\(|\.update\(|\.push\(/.test(cut("// ABCTRAIN_AUDIO_START","// ABCTRAIN_AUDIO_END")));
// run the helpers against a fake context
const S={ states:[], created:0, started:0 };
const mk=(state)=>({ state, resume(){ S.states.push("resume"); this.state="running"; return Promise.resolve(); }, createBuffer(){ S.created++; return {}; }, createBufferSource(){ return { connect(){}, start(){ S.started++; } }; }, destination:{} });
const code=cut("// ABCTRAIN_AUDIO_START","// ABCTRAIN_AUDIO_END");
const run=(ctxState, withUnlockFn)=>{
  const sandbox="var bbAlarmCtx="+(ctxState===null?"null":"CTX")+"; var trainState=null; var _mastRe=function(){}; var trainSing=function(){}; "+(withUnlockFn?"function bbAudioUnlock(){ if(!bbAlarmCtx) bbAlarmCtx=CTX; }":"")+code+"; return {u:_trainUnlock, r:_trainCtxRunning, ctx:function(){return bbAlarmCtx;}};";
  return new Function("CTX",sandbox)(ctxState===null?null:mk(ctxState));
};
S.started=0; let r=run("suspended",true); r.u(); ok("unlock resumes a suspended context and plays the silent frame", S.states.includes("resume") && S.started===1 && r.ctx().state==="running");
S.started=0; S.states=[]; r=run("running",true); r.u(); ok("a running context still gets the silent frame, no resume", !S.states.includes("resume") && S.started===1);
r=run(null,false); ok("no WebAudio at all → running() is null (lights alone, as before)", r.r()===null);
ok("running() false on a suspended context", run("suspended",false).r()===false);
ok("running() true on a running context", run("running",false).r()===true);
S.started=0; r=run(null,false); r.u(); ok("unlock with no context and no helper does not throw", S.started===0);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
