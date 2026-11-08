/*
 * 🚂 ABC Train — the sung finish, voice-led (her report 2026-11-08 on a tablet: the finish said "capital A, capital B…" and "totally
 * messed up the song" — each note's mastSpeak cancelled the one before, so the voice never finished a letter). Her yes to the fix:
 *   · spelled letter names for the voice (TRAIN_LETTER_NAMES via trainSpoken) — never a lone capital handed to the engine; the
 *     screen still shows "A";
 *   · the VOICE leads: one utterance per line of the song, queued (mastSpeakLine — no cancel between lines, the next on onend),
 *     a little slow; each car lit as its letter is said (word events → letter; none → evenly spaced over the line), the line's
 *     melody tones under it at the pace the line before was sung;
 *   · no speech engine → the tones + lights as before, no words; parking / leaving / Play again stops the voice, its queue, the tones.
 * Runs the REAL code (UNITPIC + GAMELOG + GAMEGRID + GAMERULES + TTS + TRAIN) against a fake speechSynthesis with timers by hand.
 *   run:  node test_train_song.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LINES=["ay bee see dee ee eff gee","aitch eye jay kay el em en oh pee","cue are ess, tee you vee","double-you ex, why and zee","now I know my ay bee sees","next time won't you sing with me"];
// a lone capital handed to the voice (the one "I" of "now I know" is the word, not the letter)
const loneCap=t=>/\b[A-Z]\b/.test(String(t).replace(/^now I know/,""));

// ── by text ──
const TTS=cut("// TTS_START","// TTS_END"), TRAIN=cut("// TRAIN_START","// TRAIN_END"), LINE=cut("// TTSLINE_START","// TTSLINE_END");
ok("the queued line lives in the ONE speak block (TTS), as its own marked part — no screen builds its own utterance",TTS.indexOf(LINE)>0&&/_ttsUtter\(String\(text\)/.test(LINE)&&!/new SpeechSynthesisUtterance/.test(LINE)&&!/new SpeechSynthesisUtterance|speechSynthesis\.speak\(/.test(TRAIN));
ok("the queued line never cancels (only mastSpeakHush does)",!/cancel\(/.test(LINE.slice(0,LINE.indexOf("function mastSpeakHush"))));
ok("the TTSLINE part defines only mastSpeakLine and mastSpeakHush",(LINE.match(/\nfunction (\w+)/g)||[]).map(x=>x.trim()).join()==="function mastSpeakLine,function mastSpeakHush");
ok("the Train's only voice is _trainSay (through trainSpoken) and the song's mastSpeakLine",(TRAIN.match(/mastSpeak\(/g)||[]).length===1&&/function _trainSay\(text\)\{ text=trainSpoken\(text\);/.test(TRAIN)&&/mastSpeakLine\(ln\.say,/.test(TRAIN));
ok("_trainStopSong cancels the voice + its queue (mastSpeakHush) and moves the run on",/function _trainStopSong\(\)\{\n  _trainRun\+\+;[\s\S]*?mastSpeakHush\(\)/.test(TRAIN));
ok("no kid's or family's name in the change",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe|sara/i.test(TRAIN+LINE));

// ── a sandbox with the real speak block and a fake engine ──
const L=ch=>({id:"L_"+ch,subject:"Abc",prompt:ch,status:"active",tier:"daily"});
const FULL=ABC.map(L);
function world(o){
  o=o||{};
  const timers=[], tones=[], spoken=[], said=[]; let now=0, clock=1762600000000, cancels=0, cur=null;
  const queue=[];
  // The fake engine: speak() queues; the head starts (onstart) when nothing is speaking; cancel() drops all (an interrupted error)
  const synth={ speaking:false, pending:false, getVoices:()=>[{name:"Samantha",lang:"en-US",default:true}], addEventListener(){}, resume(){},
    cancel(){ cancels++; const c=cur; cur=null; queue.length=0; synth.speaking=false; if(c&&c.onerror) c.onerror({error:"interrupted"}); },
    speak(u){ spoken.push({text:u.text,rate:u.rate,at:now}); queue.push(u); pump(); } };
  function pump(){ if(cur||!queue.length) return; cur=queue.shift(); synth.speaking=true; if(o.noStart) return; if(cur.onstart) cur.onstart({}); }
  function finish(){ const c=cur; if(!c) return; cur=null; synth.speaking=false; if(!o.noEnd&&c.onend) c.onend({}); pump(); }
  class FakeDate extends Date{ static now(){ return clock+=1000; } }
  const fakeAudio=function(){ this.state="running"; this.destination={}; Object.defineProperty(this,"currentTime",{get:()=>now/1000});
    this.createOscillator=()=>{ const x={type:"",frequency:{value:0},connect(){},start(t){ tones.push(["start",x.frequency.value,t]); },stop(t){ tones.push(["stop",t]); }}; return x; };
    this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}); this.resume=()=>Promise.resolve(); };
  const CODE=cut("// UNITPIC_START","// UNITPIC_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+TTS+"\n"+TRAIN;
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,Promise,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    setInterval:()=>0, clearInterval(){}, clearTimeout(){},
    performance:{now:()=>now},
    navigator:{userAgent:o.ua||"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"},
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
    " this.TRAIN_SONG=TRAIN_SONG; this.TRAIN_ROLL_MS=TRAIN_ROLL_MS; this.TRAIN_LETTER_NAMES=TRAIN_LETTER_NAMES; this.TRAIN_SING_RATE=TRAIN_SING_RATE; this.TRAIN_SING_WORD_S=TRAIN_SING_WORD_S; this.TRAIN_HZ=TRAIN_HZ;"+
    " this._trainOsc=()=>_trainOsc; this._trainVoiceOn=()=>_trainVoiceOn;",ctx);
  let x=5; ctx._trainRandom=()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; };
  const tick=t=>{ for(;;){ const due=timers.filter(y=>y.at<=t).sort((p,q)=>p.at-q.at||p.id-q.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  const flushAll=()=>{ let g=0; while(timers.length&&g++<2000){ tick(Math.min.apply(null,timers.map(y=>y.at))); } };
  return {c:ctx,synth,spoken,tones,tick,flushAll,finish,cur:()=>cur,queue,now:()=>now,cancels:()=>cancels};
}
// play a round to its finish, every car right; the engine says each letter and ends it
function playRound(w){
  const c=w.c; c.trainStart(); const st=c.trainState;
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); if(w.cur()) w.finish(); w.tick(w.now()+c.TRAIN_ROLL_MS); }
  return st;
}
const songSaid=(w,n0)=>w.spoken.slice(n0).map(x=>x.text);

// ── the letter names ──
{ const c=world({noSynth:true}).c, N=c.TRAIN_LETTER_NAMES;
  ok("a name for every letter A–Z, the ones she approved",ABC.map(x=>N[x]).join(" ")==="ay bee see dee ee eff gee aitch eye jay kay el em en oh pee cue are ess tee you vee double-you ex why zee");
  ok("no name is itself a capital letter",ABC.every(x=>!loneCap(N[x])&&N[x]===N[x].toLowerCase()));
  ok("trainSpoken: a letter → its name",c.trainSpoken("A")==="ay"&&c.trainSpoken("W")==="double-you");
  ok("trainSpoken: the 🔊 \"what comes next\" line",c.trainSpoken("J, K, L. What comes next?")==="jay, kay, el. What comes next?");
  ok("trainSpoken: every letter, in any sentence, leaves no lone capital",ABC.every(x=>!loneCap(c.trainSpoken(x+", "+x+". What comes next?")))&&!loneCap(c.trainSpoken(ABC.join(", "))));
  ok("…and words keep their capitals (What, Put)",c.trainSpoken("What comes next? Put each car in its place!")==="What comes next? Put each car in its place!");
}

// ── the song's lines ──
{ const c=world({noSynth:true}).c, Ls=c.trainSongLines(), S=c.TRAIN_SONG;
  ok("six lines, the words she approved",JSON.stringify(Ls.map(l=>l.say))===JSON.stringify(LINES),Ls.map(l=>l.say));
  ok("the lines cover all 26 letters, in order, each exactly once",Ls.map(l=>l.words.filter(w=>S[w.i].k==="L").map(w=>S[w.i].s).join("")).join("")===ABC.join(""));
  ok("every note of the song is in exactly one line, in order",Ls.reduce((a,l)=>a.concat(l.notes),[]).join()===S.map((x,i)=>i).join());
  ok("each line is 8 beats",Ls.every(l=>l.notes.reduce((n,i)=>n+S[i].b,0)===8));
  ok("each word knows where it starts in its line",Ls.every(l=>l.words.every(w=>l.say.slice(w.at,w.at+w.w.length)===w.w)));
  ok("W's held notes say nothing of their own: \"double-you\" once",Ls[3].words.length===5&&Ls[3].notes.length===7);
  ok("no line hands the voice a lone capital",Ls.every(l=>!loneCap(l.say)));
  const T=c.trainLineTimes(Ls[1],0.4);
  ok("a line's own clock: starts at 0, L M N O half beats, P held",T[0].t===0&&T.map(x=>x.d).join()==="0.4,0.4,0.4,0.4,0.2,0.2,0.2,0.2,0.8"&&T[8].t===2.4);
  // word events → the letter
  const l1=Ls[0], l4=Ls[3];
  ok("word event at a word's start → that letter (\"dee\" → D)",S[l1.words[c.trainLineWordAt(l1,l1.say.indexOf("dee"),0)].i].s==="D");
  ok("an event inside \"double-you\" (an engine that reads it as two words) is still W",S[l4.words[c.trainLineWordAt(l4,l4.say.indexOf("you"),1)].i].s==="W"&&S[l4.words[c.trainLineWordAt(l4,0,0)].i].s==="W");
  ok("…after the comma: \"why\" → Y; \"and\" is the word (whole train), \"zee\" → Z",S[l4.words[c.trainLineWordAt(l4,l4.say.indexOf("why"),3)].i].s==="Y"&&S[l4.words[c.trainLineWordAt(l4,l4.say.indexOf("zee"),4)].i].s==="Z");
  ok("no charIndex: counted word events instead (and never past the last word)",c.trainLineWordAt(l1,undefined,2)===2&&c.trainLineWordAt(l1,undefined,40)===6);
  ok("no word events: n words evenly spaced across the line's length",c.trainFallbackTimes(4,2).join()==="0,0.5,1,1.5"&&c.trainFallbackTimes(7,3.5).join()==="0,0.5,1,1.5,2,2.5,3");
}

// ── an engine WITH word events: the voice leads, each car lit as its letter is said ──
{ const w=world({audio:true}), c=w.c;
  const st=playRound(w);
  ok("the round's letters were said by name, never a lone capital",w.spoken.length>=4&&w.spoken.every(x=>!loneCap(x.text))&&st.turns.every(t=>w.spoken.some(x=>x.text===c.TRAIN_LETTER_NAMES[t.L])));
  c.trainHear.call(null); // not in play: says nothing
  const S=c.TRAIN_SONG, Ls=c.trainSongLines(), n0=w.spoken.length-1, k0=w.cancels(), lit=[];
  ok("the finish speaks line 1 — one utterance, slightly slow",w.spoken[n0].text===LINES[0]&&w.spoken[n0].rate===c.TRAIN_SING_RATE&&c.TRAIN_SING_RATE<0.85);
  ok("…the first car lit as the voice starts",st.song.i===0&&c._trainVoiceOn());
  ok("…and that line's melody tones started with it (7 notes: A–G)",w.tones.filter(x=>x[0]==="start").length===7&&w.tones.filter(x=>x[0]==="start").map(x=>x[1]).join()===Ls[0].notes.map(i=>c.TRAIN_HZ[S[i].n]).join());
  Ls.forEach((l,k)=>{
    const u=w.cur();
    ok("line "+(k+1)+" spoken once, only after the line before ended: \""+l.say+"\"",u&&u.text===LINES[k]&&songSaid(w,n0).length===k+1);
    l.words.forEach((wd,j)=>{ w.tick(w.now()+300); u.onboundary({name:"word",charIndex:wd.at}); if(S[st.song.i].k==="L") lit.push(S[st.song.i].s); if(wd.w==="double-you") u.onboundary({name:"word",charIndex:wd.at+7}); });
    u.onboundary({name:"sentence",charIndex:0});   // not a word: ignored
    w.tick(w.now()+300); w.finish(); w.tick(w.now()+1);
  });
  ok("the cars lit A to Z in order, each exactly once, on the voice's word events",lit.join("")===ABC.join(""),lit.join(""));
  ok("six utterances, no cancel anywhere in the song (nothing cut off)",songSaid(w,n0).join("|")===LINES.join("|")&&w.cancels()===k0);
  ok("every word the Train handed the voice in this game: never a lone capital",w.spoken.every(x=>!loneCap(x.text)));
  w.tick(w.now()+500);
  ok("after the last line: the whole train lit, Play again shows",st.song.end===true&&st.song.i===S.length&&/Play again/.test(c.buildTrainHtml("#000"))&&!c._trainVoiceOn());
  ok("tones for every note of the song, line by line",w.tones.filter(x=>x[0]==="start").length===S.length);
}

{ const w=world({audio:true}), c=w.c;   // a word event arriving after its line ended (some engines do)
  const st=playRound(w), u0=w.cur(); u0.onboundary({name:"word",charIndex:0}); w.finish(); w.tick(w.now()+1000); const i1=st.song.i;
  u0.onboundary({name:"word",charIndex:LINES[0].indexOf("dee")});
  ok("a late word event lights nothing back in a line that ended",st.song.i===i1&&c.TRAIN_SONG[i1].s==="H"&&w.cur().text===LINES[1]);
}
// ── an engine WITHOUT word events (iOS Safari often): lights evenly over the line, the pace learned from the voice ──
{ const w=world({audio:true}), c=w.c, S=c.TRAIN_SONG, Ls=c.trainSongLines();
  const st=playRound(w), t0=w.now(), per=c.TRAIN_SING_WORD_S, letter=()=>S[st.song.i].s;
  const seq=[letter()];
  for(let j=1;j<4;j++){ w.tick(t0+Math.round(j*per*1000)); seq.push(letter()); }
  ok("line 1: A at the start, then B, C, D at the guessed even spacing ("+per+" s a word)",seq.join("")==="ABCD");
  w.tick(t0+2000); w.finish();   // the voice was quicker than the guess: E F G not lit yet
  ok("the voice ended first: the line's next is not spoken until the left-over letters light",songSaid(w,0).filter(x=>x===LINES[1]).length===0);
  const seen=[]; for(let j=1;j<=3;j++){ w.tick(t0+2000+j*90); seen.push(letter()); }
  ok("…E, F, G light in order, quickly",seen.join("")==="EFG");
  w.tick(t0+2000+3*90+60); const t1=w.now(), ost=w.tones.filter(x=>x[0]==="start").length;
  ok("then line 2 is spoken",w.cur()&&w.cur().text===LINES[1]&&letter()==="H");
  const pw=2/7, beat=Math.max(0.25,Math.min(0.9,9*pw/8));
  w.tick(t1+Math.round(pw*1000)+1);
  ok("line 2's lights at the pace line 1 was really sung (2 s / 7 words)",letter()==="I");
  const st2=w.tones.filter(x=>x[0]==="start").slice(7,16).map(x=>x[2]);
  ok("line 2's tones started with the voice, its beat from line 1's measured length",st2.length===9&&Math.abs((st2[1]-st2[0])-beat)<0.002&&Math.abs(st2[0]-(t1/1000+0.02))<0.002,[st2[1]-st2[0],beat]);
  // run the rest: each line ends after a bit; everything lights in order
  const lit=[letter()]; let last=letter();
  for(let g=0;g<200&&!st.song.end;g++){ w.tick(w.now()+100); const L=st.song.i<S.length&&S[st.song.i].k==="L"?S[st.song.i].s:""; if(L&&L!==last){ lit.push(L); last=L; } if(g%25===24) w.finish(); }
  w.flushAll();
  ok("the rest of the song: every line once, in order, and the train finishes",songSaid(w,0).filter(x=>LINES.indexOf(x)>=0).join("|")===LINES.join("|")&&st.song.end===true);
  ok("…the letters still lit in order (I to Z, none skipped, none back)",lit.join("")===ABC.slice(8).join(""),lit.join(""));
}

// ── an engine that never says "started" or "ended": the song still runs, in order, and finishes ──
{ const w=world({audio:true,noStart:true,noEnd:true}), c=w.c;
  const st=playRound(w); w.flushAll();
  ok("no start / end events: every line still queued once, in order, the finish shows",songSaid(w,0).filter(x=>LINES.indexOf(x)>=0).join("|")===LINES.join("|")&&st.song.end===true&&/Play again/.test(c.buildTrainHtml("#000")));
}

// ── no speech engine: the tones + lights as before, no words ──
{ const w=world({audio:true,noSynth:true}), c=w.c;
  const st=playRound(w); const lit=[]; let last="";
  for(let g=0;g<1000&&!st.song.end;g++){ w.tick(w.now()+50); const x=c.TRAIN_SONG[st.song.i]; if(x&&x.k==="L"&&x.s!==last){ lit.push(x.s); last=x.s; } }
  ok("no engine: nothing spoken (not even through the baked files) — the tones for every note, the lights A–Z in order",w.spoken.length===0&&w.tones.filter(x=>x[0]==="start").length===c.TRAIN_SONG.length&&lit.join("")===ABC.join("")&&st.song.end===true);
  const w2=world({noSynth:true}); let err=null; try{ playRound(w2); w2.flushAll(); }catch(e){ err=e; }
  ok("no engine and no AudioContext: no crash, the finish shows",err===null&&w2.c.trainState.song.end===true&&/Play again/.test(w2.c.buildTrainHtml("#000")));
}

// ── stopping: parking, leaving, Play again ──
{ const w=world({audio:true}), c=w.c;
  const st=playRound(w); w.finish(); w.tick(w.now()+1000); const k0=w.cancels(), n0=w.spoken.length;
  ok("mid-song (line 2 speaking)",w.cur()&&w.cur().text===LINES[1]);
  const parked=c.trainPark(); c.trainState=null;
  ok("parking: the voice cancelled, its queue empty, the tones stopped",w.cancels()===k0+1&&!w.cur()&&w.queue.length===0&&c._trainOsc().length===0&&!c._trainVoiceOn()&&parked===st&&st.song.end===true);
  w.flushAll();
  ok("…and nothing more is said or lit afterwards (a late end event queues no next line)",w.spoken.length===n0);
  c.trainState=parked; c.trainResume();
  ok("back to that kid: the finish with Play again",/Play again/.test(c.buildTrainHtml("#000")));
}
{ const w=world({audio:true}), c=w.c;
  const st=playRound(w); const k0=w.cancels();
  c.trainStart(); const n0=w.spoken.length;
  ok("Play again mid-song: the old song's voice cancelled, a new round",w.cancels()>k0&&c.trainState!==st&&c.trainState.phase==="play");
  w.flushAll();
  ok("…and the old song says nothing more",w.spoken.slice(n0).every(x=>LINES.indexOf(x.text)<0));
}
{ const doc={"trn-finish":{}}, w=world({audio:true,doc:doc}), c=w.c;   // the finish on screen, then gone: the kid left the game
  const st=playRound(w); const k0=w.cancels();
  ok("on the finish screen the song sings",w.cur()&&w.cur().text===LINES[0]&&c._trainVoiceOn());
  delete doc["trn-finish"]; w.tick(w.now()+600);
  ok("leaving the game mid-song: the voice cancelled, the tones stopped, the song over",st.song.end===true&&w.cancels()>k0&&c._trainOsc().length===0);
  const n0=w.spoken.length; w.flushAll();
  ok("…no more lines",w.spoken.length===n0);
}
{ const w=world({audio:true}), c=w.c, k0=w.cancels();
  c.trainStart(); c.trainPark();
  ok("a stop with no song singing cancels no one else's speech",w.cancels()===k0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
