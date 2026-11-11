// ABCTRAIN_AUDIO3 — her report 2026-11-11 with the iPad's breadcrumbs (ctx running, 43 tones, still silent): iPad silent mode mutes
// WebAudio's ambient route. A tiny silent <audio> loop, started inside the tap, moves the page to the playback route.
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const blk=cut("// ABCTRAIN_AUDIO3_START","// ABCTRAIN_AUDIO3_END");
ok("block exists", blk.length>200);
const m=/TRAIN_SILENT_WAV="(data:audio\/wav;base64,[A-Za-z0-9+/=]+)"/.exec(blk); ok("a data-URI WAV is embedded", !!m);
const buf=Buffer.from(m[1].split(",")[1],"base64");
ok("it is a real RIFF/WAVE file under 2 KB", buf.slice(0,4).toString()==="RIFF"&&buf.slice(8,12).toString()==="WAVE"&&buf.length<2048, buf.length);
ok("every sample is silence (8-bit midpoint)", buf.slice(44).every(b=>b===128));
ok("the hum starts inside the tap unlock", /_trainHumStart\(\);[^\n]*ABCTRAIN_AUDIO3/.test(cut("function _trainUnlock(){","function _trainCtxRunning(")));
ok("the hum stops with the song (stop + end)", /_trainRun\+\+; try\{ _trainHumStop\(\); \}catch\(e\)\{\}/.test(src) && /st\.song\.end=true; try\{ _trainHumStop\(\); \}/.test(src));
ok("no Firebase write in the block", !/\.ref\(|\.set\(|\.update\(|\.push\(/.test(blk));
// behaviour with a fake document
const calls={play:0,pause:0,appended:0};
const doc={ createElement(){ return { setAttribute(){}, style:{}, play(){ calls.play++; return Promise.resolve(); }, pause(){ calls.pause++; }, set src(v){ this._s=v; }, get src(){ return this._s; } }; }, body:{ appendChild(){ calls.appended++; } } };
const S=new Function("document",blk+" return {start:_trainHumStart, stop:_trainHumStop, el:function(){return _trainHum;}};")(doc);
S.start(); S.start(); ok("one element, appended once, played on each start", calls.appended===1 && calls.play===2 && S.el().loop===true);
S.stop(); ok("stop pauses and rewinds", calls.pause===1 && S.el().currentTime===0);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
