/*
 * 🚂 ABC Train — the sung finish, TONES ONLY (her verdict 2026-11-08 on the tablet, after the voice-led song: "really rough … doesn't
 * line up with the music … better if it didn't talk and just played the song" — the kid sings along):
 *   · during the song NOTHING is spoken — no mastSpeak, no utterance, even with a speech engine on the device;
 *   · the melody plays as WebAudio tones on the song's own clock (trainSongTimes, a steady TRAIN_BEAT_S beat, a little slow);
 *     each car lights and its letter pops on its own note, A to Z in order, each once; "Now I know my A B C's / Next time won't
 *     you sing with me?" light the whole train;
 *   · no AudioContext → the lights alone on the same clock; parking / leaving / Play again stops the tones;
 *   · the level play still says each letter by its spelled name (TRAIN_LETTER_NAMES via trainSpoken) — never a lone capital.
 * Runs the REAL code (UNITPIC + GAMELOG + GAMEGRID + GAMERULES + TTS + TRAIN) against a fake speechSynthesis with timers by hand.
 *   run:  node test_train_song.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
// a lone capital handed to the voice
const loneCap=t=>/\b[A-Z]\b/.test(String(t));

// ── by text ──
const TTS=cut("// TTS_START","// TTS_END"), TRAIN=cut("// TRAIN_START","// TRAIN_END");
const SONG=TRAIN.slice(TRAIN.indexOf("// ── the song ─"),TRAIN.indexOf("function trainPark")).replace(/\/\/[^\n]*/g,"");   // its code, not its comments
ok("the song's code speaks nothing: no mastSpeak, no utterance, no word events, no hush",!/mastSpeak|Utterance|speechSynthesis|onboundary|_trainSay/.test(SONG));
ok("the voice-led machinery is gone (no per-line song, no fallback spacing, no queued-line helper)",!/trainSongLines|trainLineTimes|trainLineWordAt|trainFallbackTimes|_trainSingVoice|_trainVoiceOn|TRAIN_SING_|mastSpeakLine|mastSpeakHush/.test(TRAIN)&&src.indexOf("TTSLINE_START")<0&&!/mastSpeakLine|mastSpeakHush/.test(src));
ok("the Train's only voice is _trainSay, through trainSpoken",(TRAIN.match(/mastSpeak\(/g)||[]).length===1&&/function _trainSay\(text\)\{ text=trainSpoken\(text\);/.test(TRAIN));
ok("the beat: a steady, slightly slow TRAIN_BEAT_S (0.5–0.6 s)",(m=>m&&+m[1]>=0.5&&+m[1]<=0.6)(TRAIN.match(/TRAIN_BEAT_S=([\d.]+)/)));
ok("no kid's or family's name in the change",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe|sara/i.test(TRAIN));

// ── a sandbox with the real speak block and a fake engine ──
const L=ch=>({id:"L_"+ch,subject:"Abc",prompt:ch,status:"active",tier:"daily"});
const FULL=ABC.map(L);
function world(o){
  o=o||{};
  const timers=[], tones=[], spoken=[]; let now=0, clock=1762600000000, cancels=0;
  const synth={ speaking:false, pending:false, getVoices:()=>[{name:"Samantha",lang:"en-US",default:true}], addEventListener(){}, resume(){},
    cancel(){ cancels++; }, speak(u){ spoken.push({text:u.text,at:now}); } };
  class FakeDate extends Date{ static now(){ return clock+=1000; } }
  const fakeAudio=function(){ this.state="running"; this.destination={}; Object.defineProperty(this,"currentTime",{get:()=>now/1000});
    this.createOscillator=()=>{ const x={type:"",frequency:{value:0},connect(){},start(t){ tones.push(["start",x.frequency.value,t]); },stop(t){ tones.push(["stop",t]); }}; return x; };
    this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}); this.resume=()=>Promise.resolve(); };
  const CODE=cut("// UNITPIC_START","// UNITPIC_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+TTS+"\n"+TRAIN;
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,Promise,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    setInterval:()=>0, clearInterval(){}, clearTimeout(){},
    performance:{now:()=>now},
    navigator:{userAgent:"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"},
    Audio:function(){ return {play:()=>({catch(){}})}; },
    SpeechSynthesisUtterance:function(t){ this.text=t; },
    HA_LS:{getItem:()=>null,setItem(){},removeItem(){}},dbg(){},
    _dryRun:()=>true,_mastRe(){ ctx._renders=(ctx._renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?FULL:[]), mastGetVisual:()=>null, mastItemVis:it=>it.prompt,
    matchDing(){},matchBonk(){}, mstTodayKey:()=>"20261108",mastView:"train",masteryKid:"k",bbAlarmCtx:null,
    masteryData:{k:FULL,k_settings:{},gameLog:{}}, mastGetDef:()=>"", mastGetDefAudio:()=>"",
    db:{ref:()=>({set(){},update(){},push(){},remove(){}})}};
  if(!o.noSynth) ctx.speechSynthesis=synth;
  if(o.audio) ctx.AudioContext=fakeAudio;
  if(o.doc) ctx.document={getElementById:id=>o.doc[id]||null};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'trainState',{get:()=>trainState,set:v=>{trainState=v;}}); Object.defineProperty(this,'_trainRandom',{get:()=>_trainRandom,set:v=>{_trainRandom=v;}});"+
    " this.TRAIN_SONG=TRAIN_SONG; this.TRAIN_ROLL_MS=TRAIN_ROLL_MS; this.TRAIN_LETTER_NAMES=TRAIN_LETTER_NAMES; this.TRAIN_HZ=TRAIN_HZ; this.TRAIN_BEAT_S=TRAIN_BEAT_S;"+
    " this._trainOsc=()=>_trainOsc;",ctx);
  let x=5; ctx._trainRandom=()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; };
  const tick=t=>{ for(;;){ const due=timers.filter(y=>y.at<=t).sort((p,q)=>p.at-q.at||p.id-q.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  const flushAll=()=>{ let g=0; while(timers.length&&g++<2000){ tick(Math.min.apply(null,timers.map(y=>y.at))); } };
  return {c:ctx,spoken,tones,tick,flushAll,now:()=>now,cancels:()=>cancels,timers};
}
// play a round to its finish, every car right
function playRound(w){
  const c=w.c; c.trainStart(); const st=c.trainState;
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); w.tick(w.now()+c.TRAIN_ROLL_MS); }
  return st;
}
// run the song to its end, step by step, recording each change of the lit note: [{i, at}]
function runSong(w,st){
  const seen=[]; let last=st.song.i;
  for(let g=0;g<5000&&!st.song.end;g++){ const due=w.timers.length?Math.min.apply(null,w.timers.map(y=>y.at)):null; if(due==null) break; w.tick(due); if(st.song.i!==last&&st.song.i<w.c.TRAIN_SONG.length){ seen.push({i:st.song.i,at:w.now()}); last=st.song.i; } }
  return seen;
}

// ── the letter names (the level play's voice) ──
{ const c=world({noSynth:true}).c, N=c.TRAIN_LETTER_NAMES;
  ok("a name for every letter A–Z, the ones she approved",ABC.map(x=>N[x]).join(" ")==="ay bee see dee ee eff gee aitch eye jay kay el em en oh pee cue are ess tee you vee double-you ex why zee");
  ok("no name is itself a capital letter",ABC.every(x=>!loneCap(N[x])&&N[x]===N[x].toLowerCase()));
  ok("trainSpoken: a letter → its name",c.trainSpoken("A")==="ay"&&c.trainSpoken("W")==="double-you");
  ok("trainSpoken: the 🔊 \"what comes next\" line",c.trainSpoken("J, K, L. What comes next?")==="jay, kay, el. What comes next?");
  ok("…and words keep their capitals (What, Put)",c.trainSpoken("What comes next? Put each car in its place!")==="What comes next? Put each car in its place!");
}

// ── a device WITH a speech engine and WebAudio: the level play talks, the song does not ──
{ const w=world({audio:true}), c=w.c, S=c.TRAIN_SONG, B=c.TRAIN_BEAT_S;
  c.trainStart();
  c.trainHear(); const heard=w.spoken[w.spoken.length-1];
  ok("level play: 🔊 says the letters on the track by name, then \"What comes next?\"",heard&&/What comes next\?$/.test(heard.text)&&!loneCap(heard.text.replace(/What comes next\?$/,"")),heard);
  const st=playRound(w);
  ok("level play: each right car's letter said by its name",st.turns.every(t=>w.spoken.some(x=>x.text===c.TRAIN_LETTER_NAMES[t.L])));
  const n0=w.spoken.length, k0=w.cancels(), t0=w.now();
  ok("the finish starts the song: tones for every note, the melody's pitches in order",st.phase==="done"&&st.song.tones===true&&w.tones.filter(x=>x[0]==="start").map(x=>x[1]).join()===S.map(x=>c.TRAIN_HZ[x.n]).join());
  const T=c.trainSongTimes(), starts=w.tones.filter(x=>x[0]==="start").map(x=>x[2]);
  ok("…each tone on the song's own clock: note k at its table time t (beat "+B+" s), a 0.15 s lead",starts.every((s,k)=>Math.abs(s-(t0/1000+0.15+T[k].t))<0.0005));
  const seen=runSong(w,st);
  ok("NOTHING is spoken during the song (an engine is right there)",w.spoken.length===n0,w.spoken.slice(n0));
  ok("…and the song cancels no speech either",w.cancels()===k0);
  const letters=seen.filter(x=>S[x.i].k==="L").map(x=>S[x.i].s);
  ok("every letter lit once, A to Z in order",letters.join("")===ABC.join(""),letters.join(""));
  ok("each lit exactly on its own note (the light's time = that tone's start)",seen.every(x=>Math.abs(x.at/1000-starts[x.i])<0.0015),seen.filter(x=>Math.abs(x.at/1000-starts[x.i])>=0.0015).slice(0,3));
  ok("every note of the song took its turn, in order",seen.map(x=>x.i).join()===S.map((x,i)=>i).join());
  const nowI=S.findIndex(x=>x.s==="Now");
  ok("\"Now I know my A B C's / Next time won't you sing with me?\" light the whole train",S.slice(nowI).every((x,k)=>c._trainLit(nowI+k)==="*")&&c._trainPopHtml(nowI).indexOf("Now I know my A B C")>=0&&c._trainPopHtml(S.length-1).indexOf("sing with me")>=0);
  ok("a letter's note pops it big (upper + lower)",c._trainPopHtml(0).indexOf('trn-popl">A<small>a</small>')>=0);
  ok("the end: the whole train lit, Play again shows",st.song.end===true&&st.song.i===S.length&&/Play again/.test(c.buildTrainHtml("#000"))&&(c.buildTrainHtml("#000").match(/trn-car trn-lit/g)||[]).length===26);
  ok("the song lasts its 48 beats",Math.abs((seen[seen.length-1].at-t0)/1000-(0.15+T[T.length-1].t))<0.002&&Math.abs(T[T.length-1].t+T[T.length-1].d-48*B)<0.001);
}

// ── the beat ──
{ const c=world({noSynth:true}).c, T=c.trainSongTimes();
  ok("the default clock is TRAIN_BEAT_S a beat: B at 1 beat, H at 8, Now at 32",T[1].t===c.TRAIN_BEAT_S&&Math.abs(T.find(x=>x.s==="H").t-8*c.TRAIN_BEAT_S)<0.001&&Math.abs(T.find(x=>x.s==="Now").t-32*c.TRAIN_BEAT_S)<0.001);
  ok("steady: every note's length is its beats × the beat",T.every(x=>Math.abs(x.d-x.b*c.TRAIN_BEAT_S)<0.001));
}

// ── no AudioContext: the lights alone, same clock, no words ──
{ const w=world({}), c=w.c;   // a speech engine, no WebAudio
  const st=playRound(w), n0=w.spoken.length; const seen=runSong(w,st);
  ok("no AudioContext: no tones, the lights A–Z in order, nothing spoken, the finish shows",st.song.tones===false&&w.tones.length===0&&seen.filter(x=>c.TRAIN_SONG[x.i].k==="L").map(x=>c.TRAIN_SONG[x.i].s).join("")===ABC.join("")&&w.spoken.length===n0&&st.song.end===true&&/Play again/.test(c.buildTrainHtml("#000")));
  ok("…and the silent finish says \"Sing along!\" while it runs",(()=>{ const w3=world({}); playRound(w3); return /Sing along/.test(w3.c.buildTrainHtml("#000")); })());
  const w2=world({noSynth:true}); let err=null; try{ playRound(w2); w2.flushAll(); }catch(e){ err=e; }
  ok("no engine and no AudioContext: no crash, the finish shows",err===null&&w2.c.trainState.song.end===true&&/Play again/.test(w2.c.buildTrainHtml("#000")));
}

// ── stopping: parking, leaving, Play again ──
{ const w=world({audio:true}), c=w.c;
  const st=playRound(w); w.tick(w.now()+3000); const i1=st.song.i, k0=w.cancels(), n0=w.spoken.length;
  ok("mid-song (a few letters in), tones scheduled",i1>2&&c._trainOsc().length===c.TRAIN_SONG.length);
  const parked=c.trainPark(); c.trainState=null;
  ok("parking: every tone stopped, the song over",c._trainOsc().length===0&&w.tones.filter(x=>x[0]==="stop").length>=2*c.TRAIN_SONG.length&&parked===st&&st.song.end===true);
  w.flushAll();
  ok("…nothing more lit or said afterwards, no speech cancelled",st.song.i===i1&&w.spoken.length===n0&&w.cancels()===k0);
  c.trainState=parked; c.trainResume();
  ok("back to that kid: the finish with Play again",/Play again/.test(c.buildTrainHtml("#000")));
}
{ const w=world({audio:true}), c=w.c;
  const st=playRound(w); w.tick(w.now()+2000); const i1=st.song.i;
  c.trainStart();
  ok("Play again mid-song: the old song's tones stopped, a new round",c._trainOsc().length===0&&c.trainState!==st&&c.trainState.phase==="play");
  w.flushAll();
  ok("…and the old song lights nothing more",st.song.i===i1);
}
{ const doc={"trn-finish":{}}, w=world({audio:true,doc:doc}), c=w.c;   // the finish on screen, then gone: the kid left the game
  const st=playRound(w); w.tick(w.now()+1000);
  ok("on the finish screen the song plays",st.song.i>=1&&!st.song.end);
  delete doc["trn-finish"]; w.tick(w.now()+600);
  ok("leaving the game mid-song: the tones stopped, the song over",st.song.end===true&&c._trainOsc().length===0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
