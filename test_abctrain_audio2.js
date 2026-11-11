// ABCTRAIN_AUDIO2 — her report 2026-11-11 (after ABCTRAIN_AUDIO): still "no sound". The train now resumes the context on ANY
// non-running state (iPad reports "interrupted", not "suspended", after speech) and leaves two breadcrumbs in _debug per song.
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
ok("block exists", src.indexOf("// ABCTRAIN_AUDIO2_START")>0);
const unlock=cut("function _trainUnlock(){","function _trainCtxRunning(");
ok("_trainUnlock resumes on any non-running state", /ctx\.state!=="running"/.test(unlock) && !/ctx\.state==="suspended"/.test(unlock));
const tctx=cut("function _trainCtx(){","function _trainTones(");
ok("_trainCtx resumes on any non-running state", /ctx\.state!=="running"/.test(tctx) && !/ctx\.state==="suspended"/.test(tctx));
const blk=cut("// ABCTRAIN_AUDIO2_START","// ABCTRAIN_AUDIO2_END");
ok("two breadcrumbs per song (start, +1.2s)", (blk.match(/dbg\(/g)||[]).length===2 && /train song start/.test(blk) && /train song \+1\.2s/.test(blk));
ok("breadcrumbs only — no Firebase set/update/remove in the block", !/\.set\(|\.update\(|\.remove\(|\.push\(/.test(blk));
const S={resumed:0,started:0};
const CTX={state:"interrupted",resume(){S.resumed++;this.state="running";return Promise.resolve();},createBuffer(){return {};},createBufferSource(){return {connect(){},start(){S.started++;}};},destination:{}};
const code=cut("// ABCTRAIN_AUDIO_START","// ABCTRAIN_AUDIO_END");
const U=new Function("CTX","var bbAlarmCtx=CTX; var trainState=null; var _mastRe=function(){}; var trainSing=function(){}; function bbAudioUnlock(){}"+code+" return _trainUnlock;")(CTX);
U(); ok("an 'interrupted' context is resumed and gets the silent frame", S.resumed===1 && S.started===1 && CTX.state==="running");
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
