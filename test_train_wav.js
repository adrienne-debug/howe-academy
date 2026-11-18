/*
 * 🚂🔊 ABC Train — the finish song as a sound file (TRAINWAV, her go-ahead 2026-11-17: "make the sound file"). On her Mac the
 * song's WebAudio tones ran on a context that claimed to be running while the speakers got silence (WebKit 276687 / 291892), so
 * the song now plays as a WAV made in memory through one audio element, with the tones as the fallback:
 *   · trainWavBytes: a valid 16-bit mono PCM WAV; its length = the 0.15 s lead + the song; all 43 notes at their times with their
 *     pitches (zero crossings in each note's window), the _trainTones shape (a quick rise to 0.16), silence where the song is silent;
 *   · the kid's first tap primes the element once (play + pause inside the tap), never again;
 *   · the finish plays the file: no oscillators; the lights start from the element's real start, not from the call;
 *   · play() refused / an error / no start within a second / no Blob / a browser that can't play a WAV → the tones, exactly once,
 *     the element paused (never both, never doubled; a late start after the fallback is paused);
 *   · stop (park, leave, Play again) pauses and rewinds the element; the 🔊 button starts the file inside its own tap;
 *   · one more breadcrumb: which path, play()'s answer, how far the element's clock moved.
 * Runs the REAL code (UNITPIC + GAMELOG + GAMEGRID + GAMERULES + TTS + TRAIN) with a fake audio element, timers by hand.
 * It cannot hear anything: real sound on a device is checked by playing it.
 *   run:  node test_train_wav.js
 */
const path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const settle=()=>new Promise(r=>setImmediate(r));

// ── by text ──
const WAV=cut("// TRAINWAV_START","// TRAINWAV_END"), TRAIN=cut("// TRAIN_START","// TRAIN_END");
ok("the block sits inside the Train's song code",TRAIN.indexOf("// TRAINWAV_START")>0&&TRAIN.indexOf("// TRAINWAV_START")<TRAIN.indexOf("function trainSing("));
ok("no kid's or family's name in the change",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe|sara/i.test(WAV));
ok("nothing fetched, nothing stored, nothing written",!/fetch\(|XMLHttpRequest|localStorage|HA_LS|db\.|\.ref\(/.test(WAV.replace(/\/\/[^\n]*/g,"")));
ok("the shared context and the alarm are not touched by the block",!/bbAlarmCtx|bbAudioUnlock|createOscillator|matchDing/.test(WAV.replace(/\/\/[^\n]*/g,"")));
ok("the WebAudio unlock is kept as it was (the prime is one line ahead of it)",/function _trainUnlock\(\)\{\n  if\(typeof _trainWavPrime==="function"\) _trainWavPrime\(\);[^\n]*\n  try\{\n    if\(typeof bbAudioUnlock==="function"\) bbAudioUnlock\(\);/.test(TRAIN));
ok("the two old breadcrumbs stay",/dbg\("train song start: ctx="/.test(TRAIN)&&/dbg\("train song \+1\.2s: ctx="/.test(TRAIN));

// ── a sandbox: the real code, a fake audio element, a fake AudioContext ──
const L=ch=>({id:"L_"+ch,subject:"Abc",prompt:ch,status:"active",tier:"daily"});
const FULL=ABC.map(L);
function world(o){
  o=o||{};
  const timers=[], tones=[], dbgs=[], els=[], blobs=[]; let now=0, clock=1762600000000;
  class FakeDate extends Date{ static now(){ return clock+=1000; } }
  const later=(ms,f)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1+Math.random()}); };
  const fakeCtx=function(){ this.state=o.ctxState||"running"; this.destination={}; this.sampleRate=48000; Object.defineProperty(this,"currentTime",{get:()=>now/1000});
    this.createOscillator=()=>{ const x={type:"",frequency:{value:0},connect(){},start(t){ tones.push(["start",x.frequency.value,t]); },stop(t){ tones.push(["stop",t]); }}; return x; };
    this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
    this.createBuffer=()=>({}); this.createBufferSource=()=>({connect(){},start(){}}); this.resume=()=>Promise.resolve(); };
  // the audio element: o.mode decides how its play() goes — "resolve" (starts after o.startMs), "reject", "never", "error", "throw", "nopromise"
  const FakeAudio=function(){
    const el={src:"",preload:"",paused:true,_t0:null,_ct:0,_rej:null,onplaying:null,onerror:null,plays:[],pauses:0,
      canPlayType:()=>o.canWav===false?"":"maybe",
      get currentTime(){ return (el.paused||el._t0==null)?el._ct:el._ct+(now-el._t0)/1000; },
      set currentTime(v){ el._ct=v; if(!el.paused&&el._t0!=null) el._t0=now; },
      pause(){ if(!el.paused&&el._t0!=null) el._ct=el.currentTime; el.paused=true; el._t0=null; el.pauses++; if(el._rej){ const r=el._rej; el._rej=null; r({name:"AbortError"}); } },
      play(){
        el.plays.push({at:now,mode:o.mode});
        const mode=o.mode||"resolve";
        if(mode==="throw") throw new Error("no");
        if(mode==="reject") return Promise.reject({name:"NotAllowedError"});
        el.paused=false; el._t0=null;
        const start=res=>later(o.startMs||0,()=>{ if(el.paused) return; el._rej=null; el._t0=now; if(el.onplaying) el.onplaying(); if(res) res(); });
        if(mode==="nopromise"){ start(null); return undefined; }
        if(mode==="late") return new Promise(res=>later(o.lateMs||1500,()=>{ el.paused=false; el._t0=now; if(el.onplaying) el.onplaying(); res(); }));   // a browser that starts it anyway, after the pause
        return new Promise((res,rej)=>{ el._rej=rej;
          if(mode==="resolve") start(res);
          if(mode==="error") later(50,()=>{ el.paused=true; if(el.onerror) el.onerror(); });
        });
      } };
    els.push(el); return el;
  };
  const CODE=cut("// UNITPIC_START","// UNITPIC_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// TTS_START","// TTS_END")+"\n"+TRAIN;
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,Promise,
    ArrayBuffer,DataView,Uint8Array,Float32Array,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1+Math.random()}); return timers.length; },
    setInterval:()=>0, clearInterval(){}, clearTimeout(){}, performance:{now:()=>now},
    navigator:{userAgent:"Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15"},
    SpeechSynthesisUtterance:function(t){ this.text=t; },
    HA_LS:{getItem:()=>null,setItem(){},removeItem(){}},dbg:m=>dbgs.push(m),
    _dryRun:()=>true,_mastRe(){ ctx._renders=(ctx._renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?FULL:[]), mastGetVisual:()=>null, mastItemVis:it=>it.prompt,
    matchDing(){},matchBonk(){}, mstTodayKey:()=>"20261108",mastView:"train",masteryKid:"k",bbAlarmCtx:null,
    masteryData:{k:FULL,k_settings:{},gameLog:{}}, mastGetDef:()=>"", mastGetDefAudio:()=>"",
    db:{ref:()=>({set(){},update(){},push(){},remove(){}})}};
  if(!o.noAudioEl) ctx.Audio=FakeAudio;
  if(!o.noBlob){ ctx.Blob=function(parts,opt){ this.parts=parts; this.type=opt&&opt.type; }; ctx.URL={createObjectURL:b=>{ blobs.push(b); return "blob:song"+blobs.length; }}; }
  if(!o.noCtx) ctx.AudioContext=fakeCtx;
  if(o.doc) ctx.document={getElementById:id=>o.doc[id]||null};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'trainState',{get:()=>trainState,set:v=>{trainState=v;}}); Object.defineProperty(this,'_trainRandom',{get:()=>_trainRandom,set:v=>{_trainRandom=v;}});"+
    " this.TRAIN_SONG=TRAIN_SONG; this.TRAIN_ROLL_MS=TRAIN_ROLL_MS; this.TRAIN_HZ=TRAIN_HZ; this.TRAIN_BEAT_S=TRAIN_BEAT_S; this.TRAINWAV_SR=TRAINWAV_SR; this.TRAINWAV_LEAD=TRAINWAV_LEAD;"+
    " this._trainOsc=()=>_trainOsc; this.setCtx=s=>{ if(bbAlarmCtx) bbAlarmCtx.state=s; };",ctx);
  let x=5; ctx._trainRandom=()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; };
  const tick=t=>{ for(;;){ const due=timers.filter(y=>y.at<=t).sort((p,q)=>p.at-q.at||p.id-q.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  // els: the song's elements only (the voice's baked-speech element, _ttsAudio, is another audio element)
  return {c:ctx,o,tones,dbgs,get els(){ const a=els.filter(e=>/^blob:song/.test(e.src)); a.made=els.length; return a; },blobs,timers,tick,now:()=>now};
}
// every timer due by t, letting play()'s promise answers land between them
async function run(w,t){
  for(let g=0;g<5000;g++){ await settle(); const due=w.timers.length?Math.min.apply(null,w.timers.map(y=>y.at)):null; if(due==null||due>t) break; w.tick(due); }
  await settle(); if(w.now()<t) w.tick(t); await settle();
}
// play a round to its finish, every car right; returns the state at the finish
async function playRound(w){
  const c=w.c; c.trainStart(); const st=c.trainState;
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); if(st.phase==="done") break; }
  return st;
}
// run the song to its end, recording each change of the lit note: [{i, at}]
async function runSong(w,st){
  const seen=[]; let last=st.song.i;
  for(let g=0;g<5000&&!st.song.end;g++){ await settle(); const due=w.timers.length?Math.min.apply(null,w.timers.map(y=>y.at)):null; if(due==null) break; w.tick(due);
    if(st.song.i!==last&&st.song.i<w.c.TRAIN_SONG.length){ seen.push({i:st.song.i,at:w.now()}); last=st.song.i; } }
  await settle(); return seen;
}
const starts=w=>w.tones.filter(x=>x[0]==="start");

(async()=>{
// ── the file itself ──
{ const w=world({}), c=w.c, T=c.trainSongTimes(), SR=c.TRAINWAV_SR, LEAD=c.TRAINWAV_LEAD, S=c.TRAIN_SONG;
  const b=c.trainWavBytes(), dv=new DataView(b.buffer,b.byteOffset,b.byteLength), str=(o)=>String.fromCharCode(b[o],b[o+1],b[o+2],b[o+3]);
  ok("a WAV: RIFF / WAVE / fmt / data, the RIFF size = file − 8",str(0)==="RIFF"&&str(8)==="WAVE"&&str(12)==="fmt "&&str(36)==="data"&&dv.getUint32(4,true)===b.length-8);
  ok("16-bit mono PCM at 22050: format 1, 1 channel, byte rate 44100, block 2",dv.getUint32(16,true)===16&&dv.getUint16(20,true)===1&&dv.getUint16(22,true)===1&&dv.getUint32(24,true)===22050&&SR===22050&&dv.getUint32(28,true)===44100&&dv.getUint16(32,true)===2&&dv.getUint16(34,true)===16);
  const n=dv.getUint32(40,true)/2, last=T[T.length-1];
  ok("the data size fills the file",dv.getUint32(40,true)===b.length-44);
  ok("its length = the 0.15 s lead + the song's 48 beats ("+(n/SR).toFixed(3)+" s)",LEAD===0.15&&Math.abs(n/SR-(LEAD+last.t+last.d))<=1/SR&&Math.abs(last.t+last.d-48*c.TRAIN_BEAT_S)<0.001);
  ok("small enough to make on the spot (under 1.5 MB)",b.length<1.5e6);
  const smp=i=>dv.getInt16(44+i*2,true);
  let leadSilent=true; for(let i=0;i<Math.round(LEAD*SR);i++) if(smp(i)!==0){ leadSilent=false; break; }
  ok("the lead is silence (the prime plays only this)",leadSilent);
  const bad=[], shape=[];
  T.forEach((x,k)=>{
    const a=Math.round((LEAD+x.t)*SR), len=Math.max(0.12,x.d*0.92), hz=c.TRAIN_HZ[x.n];
    const w0=a+Math.round(0.035*SR), w1=a+Math.round(len*0.6*SR); let zc=0;
    for(let i=w0+1;i<w1;i++){ const p=smp(i-1), q=smp(i); if((p<0&&q>=0)||(p>=0&&q<0)) zc++; }
    const est=zc/2/((w1-w0)/SR);
    if(Math.abs(est-hz)/hz>0.03) bad.push({k:k,s:x.s,hz:hz,est:Math.round(est)});
    let pk=0; for(let i=a;i<a+Math.round(0.05*SR);i++) pk=Math.max(pk,Math.abs(smp(i)));
    if(pk<0.12*32767||pk>0.17*32767) shape.push({k:k,pk:pk});
  });
  ok("all 43 notes there, each at its time with its pitch (zero crossings within 3%)",T.length===43&&bad.length===0,bad.slice(0,4));
  ok("each note rises to about 0.16 of full scale (the tones' gain)",shape.length===0,shape.slice(0,4));
  const notQuiet=[];
  T.forEach((x,k)=>{ const a=Math.round((LEAD+x.t)*SR), e=a+Math.round(Math.max(0.12,x.d*0.92)*SR)+1, nx=k+1<T.length?Math.round((LEAD+T[k+1].t)*SR):n;
    for(let i=e;i<nx;i++) if(smp(i)!==0){ notQuiet.push({k:k,i:i}); break; } });
  ok("silence where the song is silent: between notes and after the last",notQuiet.length===0,notQuiet.slice(0,3));
  const repeat=S.findIndex((x,k)=>k>0&&x.n===S[k-1].n);
  ok("two notes on the same pitch stay two notes (a gap between them)",repeat>0&&(()=>{ const a=Math.round((LEAD+T[repeat].t)*SR); return smp(a-2)===0; })());
  ok("PURE: the same bytes every time",c.trainWavBytes().length===b.length&&c.trainWavBytes()[50000]===b[50000]);
}

// ── the round: the prime, once ──
{ const w=world({mode:"resolve"}), c=w.c;
  c.trainStart(); const st=c.trainState, t0=st.turns[st.i];
  ok("before any tap: no element, no file made yet",w.els.length===0&&w.blobs.length===0);
  c.trainTap(t0.choices.indexOf(t0.L)); const el=w.els[0];
  ok("the kid's first tap makes the file and primes the element: play() inside the tap, paused at once, rewound",w.els.length===1&&el.plays.length===1&&el.paused===true&&el.currentTime===0);
  await run(w,w.now()+c.TRAIN_ROLL_MS);
  ok("…the prime never sounds (its start never comes: paused before it could)",el.paused===true&&el.currentTime===0);
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); }
  ok("one audio element, one file for the page (a Blob, audio/wav, no fetch)",w.els.length===1&&w.blobs.length===1&&w.blobs[0].type==="audio/wav"&&el.src==="blob:song1"&&el.preload==="auto");
  ok("ONE prime for the whole round (not on every tap): the only other play() is the finish's",st.phase==="done"&&el.plays.length===2&&el.plays.filter(p=>p.at<el.plays[1].at).length===1);
}

// ── the finish plays the file: no oscillators, the lights from its real start ──
{ const w=world({mode:"resolve",startMs:300}), c=w.c, S=c.TRAIN_SONG, T=c.trainSongTimes();
  const st=await playRound(w), el=w.els[0], tFin=el.plays[el.plays.length-1].at;
  ok("the finish starts the element (a second play, from the finish)",el.plays.length===2&&st.phase==="done");
  ok("the file path makes no oscillators",starts(w).length===0&&c._trainOsc().length===0&&st.song.path==="file");
  ok("on the file the finish shows neither \"Sing along!\" nor the 🔊 hint",!/Sing along|Tap for sound/.test(c.buildTrainHtml("#000")));
  const seen=await runSong(w,st);
  ok("the lights start from the element's REAL start (+0.3 s here), not from the call",!!seen[0]&&Math.abs(seen[0].at-(tFin+300+150))<=1&&seen[0].i===0,seen[0]);
  ok("…every note lit at the file's own time for it",seen.length===S.length&&seen.every(x=>Math.abs(x.at-(tFin+300+150+T[x.i].t*1000))<=1));
  ok("every letter lit once, A to Z in order",seen.filter(x=>S[x.i].k==="L").map(x=>S[x.i].s).join("")===ABC.join(""));
  ok("the end: the whole train lit, Play again",st.song.end===true&&/Play again/.test(c.buildTrainHtml("#000")));
  ok("never a fallback once it started (no tones, ever)",starts(w).length===0);
  const crumb=w.dbgs.find(m=>/^train song path:/.test(m));
  ok("breadcrumb: path=file, play() resolved, the element's clock moved",/^train song path: file · file play=resolved · el (\d+\.\d\d)s moved$/.test(crumb||"")&&+crumb.match(/el ([\d.]+)s/)[1]>0.8,crumb);
  ok("the two old breadcrumbs still come",w.dbgs.some(m=>/^train song start: /.test(m))&&w.dbgs.some(m=>/^train song \+1\.2s: /.test(m)));
  await run(w,w.now()+1000);
  c.trainStart(); const st2=c.trainState; for(let g=0;g<20&&st2.phase==="play";g++){ const t=st2.turns[st2.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); }
  ok("Play again: the same element and file (made once a page), primed no more",w.els.length===1&&w.blobs.length===1&&el.plays.length===3);
}

// ── the fallback: exactly once ──
for(const mode of ["reject","never","error","throw"]){
  const w=world({mode:"resolve"}), c=w.c, S=c.TRAIN_SONG;
  c.trainStart(); const st=c.trainState; w.o.mode=mode;   // primed fine; the finish's play() goes `mode`
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); if(st.phase==="done") break; }
  const tFin=w.els[0].plays[w.els[0].plays.length-1].at;
  const seen=await runSong(w,st);
  const at=mode==="never"?1000:mode==="error"?50:0;
  ok(mode+": the tones play, exactly once — 43 tones, in the melody's order",starts(w).length===S.length&&starts(w).map(x=>x[1]).join()===S.map(x=>c.TRAIN_HZ[x.n]).join()&&st.song.path==="tones"&&st.song.tones===true);
  ok(mode+": …from the fallback's moment ("+at+" ms) with the tones' 0.15 s lead",Math.abs(starts(w)[0][2]-((tFin+at)/1000+0.15))<0.002,starts(w)[0]);
  ok(mode+": …the element paused (never both at once)",w.els[0].paused===true);
  ok(mode+": every letter lit once, A to Z, on its tone",seen.filter(x=>S[x.i].k==="L").map(x=>S[x.i].s).join("")===ABC.join("")&&seen.every(x=>Math.abs(x.at/1000-starts(w)[x.i][2])<0.0015));
  const crumb=w.dbgs.find(m=>/^train song path:/.test(m));
  ok(mode+": breadcrumb says tones, and why",/^train song path: tones · file play=\S+.* fell back \((rejected|no start|error|threw)\)/.test(crumb||""),crumb);
}
{ const w=world({mode:"resolve"}), c=w.c, S=c.TRAIN_SONG;
  c.trainStart(); const st=c.trainState; w.o.mode="late"; w.o.lateMs=1500;   // starts only after the fallback took over
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); if(st.phase==="done") break; }
  const seen=await runSong(w,st);
  ok("a late start after the fallback: the element is paused again — never a doubled song",w.els[0].paused===true&&starts(w).length===S.length);
  ok("…the lights ran once (each note once, in order)",seen.map(x=>x.i).join()===S.map((x,i)=>i).join());
}
{ const w=world({mode:"error"}), c=w.c;
  await playRound(w); await runSong(w,w.c.trainState); const n0=w.els[0].plays.length;
  c.trainStart(); const st2=c.trainState; for(let g=0;g<20&&st2.phase==="play";g++){ const t=st2.turns[st2.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); }
  ok("a file the browser errors on: the next finish goes straight to the tones",w.els[0].plays.length===n0&&st2.song.path==="tones"&&st2.song.file===null);
}
{ const w=world({mode:"nopromise",startMs:200}), c=w.c;
  const st=await playRound(w); await run(w,w.now()+500);
  ok("an old play() with no promise: its playing event starts the file, no tones",st.song.path==="file"&&st.song.i>=0&&starts(w).length===0);
}

// ── devices without the file: today's tones ──
{ const w=world({noBlob:true}), c=w.c, st=await playRound(w);
  ok("no Blob / URL: the tones, as before (no song element made)",w.els.length===0&&st.song.path==="tones"&&starts(w).length===c.TRAIN_SONG.length&&st.song.file===null);
}
{ const w=world({canWav:false}), c=w.c, st=await playRound(w);
  ok("a browser that says it can't play a WAV (the old TV browser): the tones, no file made",st.song.path==="tones"&&starts(w).length===c.TRAIN_SONG.length&&w.blobs.length===0);
}
{ const w=world({noAudioEl:true,noCtx:true}), c=w.c; let err=null, st;
  try{ st=await playRound(w); await runSong(w,st); }catch(e){ err=e; }
  ok("no Audio and no AudioContext: no crash, the lights alone, \"Sing along!\" path",err===null&&st.song.tones===false&&st.song.end===true&&/Play again/.test(c.buildTrainHtml("#000")));
}

// ── stop: park, leave, Play again ──
{ const w=world({mode:"resolve"}), c=w.c;
  const st=await playRound(w); await run(w,w.now()+3000); const el=w.els[0], i1=st.song.i;
  ok("mid-song on the file: the element playing",el.paused===false&&i1>2);
  const parked=c.trainPark(); c.trainState=null;
  ok("parking pauses and rewinds the element",el.paused===true&&el.currentTime===0&&parked.song.end===true);
  await run(w,w.now()+30000);
  ok("…nothing more lit, no tones after",st.song.i===i1&&starts(w).length===0);
}
{ const doc={"trn-finish":{}}, w=world({mode:"resolve",doc:doc}), c=w.c;
  const st=await playRound(w); await run(w,w.now()+1000); const el=w.els[0];
  ok("on the finish screen the file plays",st.song.i>=0&&!st.song.end&&el.paused===false);
  delete doc["trn-finish"]; await run(w,w.now()+700);
  ok("leaving the game mid-song: the element paused, rewound, the song over",st.song.end===true&&el.paused===true&&el.currentTime===0);
}
{ const w=world({mode:"resolve"}), c=w.c;
  const st=await playRound(w); await run(w,w.now()+2000); const el=w.els[0], i1=st.song.i;
  c.trainStart();
  ok("Play again mid-song: the element paused and rewound, a new round",el.paused===true&&el.currentTime===0&&c.trainState!==st&&c.trainState.phase==="play");
  await run(w,w.now()+30000);
  ok("…the old song lights nothing more",st.song.i===i1);
}

// ── neither path can sound → the 🔊 hint; its tap starts the file inside the tap ──
{ const w=world({mode:"resolve",ctxState:"suspended"}), c=w.c;
  c.trainStart(); const st=c.trainState; w.o.mode="reject";
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); await run(w,w.now()+c.TRAIN_ROLL_MS); if(st.phase==="done") break; }
  await run(w,w.now()+100);
  ok("file refused and the context suspended: the 🔊 Tap for sound hint shows",st.song.path==="tones"&&st.song.muted===true&&/Tap for sound/.test(c.buildTrainHtml("#000")));
  w.o.mode="resolve"; const el=w.els[0], n0=el.plays.length, k0=starts(w).length;
  c.trainSound();
  ok("the 🔊 tap calls play() inside the tap itself (no timer between)",el.plays.length===n0+1);
  await runSong(w,c.trainState);
  ok("…the file plays: no new tones, the hint gone, the song to its end",starts(w).length===k0&&c.trainState.song.path==="file"&&c.trainState.song.end===true&&!/Tap for sound/.test(c.buildTrainHtml("#000")));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
})();
