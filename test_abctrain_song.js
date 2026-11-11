/*
 * 🚂 ABCTRAIN_SONG — the W–X–Y–"and"–Z stretch of the ABC Train's sung finish (her report 2026-11-10: "when it sings the alphabet
 * midi when it gets to w it messes up w is two beats and then it should go to x y and pause for the word and before going to z and
 * its messing up pretty glitchy here").
 *   Was (from W, beat 24): W G4 · W G4 (held) · W F4 (held) · X F4 · Y E4 · "and" E4 as a last-lines word (the whole train lit, the strip
 *   slid to the middle under "Now I know my A B C's") · Z D4 ×2. The W re-popped on every one of its three notes.
 *   Now: W G4 G4 (two beats, popped once) · X F4 · Y F4 · "and" E4 E4 (no car lit, the train holds on Y, the word "and") · Z D4 ×2.
 *   The tune is the same notes and beats; only which letter sits on which note, and what the screen does on a held note, changed.
 * Runs the REAL code (UNITPIC + GAMELOG + GAMEGRID + GAMERULES + TTS + TRAIN) with WebAudio, timers and the finish's DOM faked.
 *   run:  node test_abctrain_song.js
 */
const path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ── by text ──
const BLOCK=cut("// ABCTRAIN_SONG_START","// ABCTRAIN_SONG_END"), TRAIN=cut("// TRAIN_START","// TRAIN_END");
ok("the ABCTRAIN_SONG block sits inside TRAIN and carries her words + the date",TRAIN.indexOf(BLOCK)>=0&&/2026-11-10/.test(BLOCK)&&/w is two beats/.test(BLOCK)&&/pause for the word and/.test(BLOCK));
ok("the song table is in the block",/const TRAIN_SONG=\[/.test(BLOCK));

// ── a sandbox: fake WebAudio, timers by hand, the finish's DOM (strip, 26 cars, pop) ──
const L=ch=>({id:"L_"+ch,subject:"Abc",prompt:ch,status:"active",tier:"daily"});
const FULL=ABC.map(L);
function world(){
  const timers=[], tones=[], paints=[]; let now=0, clock=1762600000000;
  class FakeDate extends Date{ static now(){ return clock+=1000; } }
  const fakeAudio=function(){ this.state="running"; this.destination={}; Object.defineProperty(this,"currentTime",{get:()=>now/1000});
    this.createOscillator=()=>{ const x={type:"",frequency:{value:0},connect(){},start(t){ tones.push(["start",x.frequency.value,t]); },stop(t){ tones.push(["stop",t]); }}; return x; };
    this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}); this.resume=()=>Promise.resolve(); };
  const cars=ABC.map(ch=>{ const on=new Set(); return {ch,getAttribute:()=>ch,classList:{add:c=>on.add(c),remove:c=>on.delete(c),has:c=>on.has(c)}}; });
  const strip={style:{},querySelectorAll:()=>cars};
  let popHtml="";
  const pop={get innerHTML(){ return popHtml; },set innerHTML(v){ popHtml=v; paints.push({at:now,pop:v,lit:cars.filter(c=>c.classList.has("trn-lit")).map(c=>c.ch).join(""),shift:strip.style.transform}); }};
  // the paint sets the lit cars before the pop, so a paint is recorded with its lights; a paint with no pop write is recorded too
  const doc={getElementById:id=>({"trn-strip":strip,"trn-pop":pop,"trn-finish":{}})[id]||null};
  const CODE=cut("// UNITPIC_START","// UNITPIC_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// TTS_START","// TTS_END")+"\n"+TRAIN;
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,Promise,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    setInterval:()=>0, clearInterval(){}, clearTimeout(){}, performance:{now:()=>now},
    navigator:{userAgent:"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"},
    Audio:function(){ return {play:()=>({catch(){}})}; }, SpeechSynthesisUtterance:function(t){ this.text=t; },
    HA_LS:{getItem:()=>null,setItem(){},removeItem(){}},dbg(){},
    _dryRun:()=>true,_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?FULL:[]), mastGetVisual:()=>null, mastItemVis:it=>it.prompt,
    matchDing(){},matchBonk(){}, mstTodayKey:()=>"20261110",mastView:"train",masteryKid:"k",bbAlarmCtx:null,
    masteryData:{k:FULL,k_settings:{},gameLog:{}}, mastGetDef:()=>"", mastGetDefAudio:()=>"",
    db:{ref:()=>({set(){},update(){},push(){},remove(){}})}, AudioContext:fakeAudio, document:doc};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'trainState',{get:()=>trainState,set:v=>{trainState=v;}}); Object.defineProperty(this,'_trainRandom',{get:()=>_trainRandom,set:v=>{_trainRandom=v;}});"+
    " this.TRAIN_SONG=TRAIN_SONG; this.TRAIN_ROLL_MS=TRAIN_ROLL_MS; this.TRAIN_HZ=TRAIN_HZ; this.TRAIN_BEAT_S=TRAIN_BEAT_S;",ctx);
  let x=5; ctx._trainRandom=()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; };
  const tick=t=>{ for(;;){ const due=timers.filter(y=>y.at<=t).sort((p,q)=>p.at-q.at||p.id-q.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  return {c:ctx,tones,paints,tick,now:()=>now,timers,cars,strip};
}
function playRound(w){
  const c=w.c; c.trainStart(); const st=c.trainState;
  for(let g=0;g<20&&st.phase==="play";g++){ const t=st.turns[st.i]; c.trainTap(t.choices.indexOf(t.L)); w.tick(w.now()+c.TRAIN_ROLL_MS); }
  return st;
}

// ── the table: the tune is untouched, the words sit right ──
{ const c=world().c, S=c.TRAIN_SONG;
  // the melody as it was before this fix (pitch:beats, every note), so the tune can't drift
  const OLD="C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:0.5 D4:0.5 D4:0.5 D4:0.5 C4:2 G4:1 G4:1 F4:2 E4:1 E4:1 D4:2 "+
    "G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2";
  ok("the tune is the same notes and beats as before (only the words on them moved)",S.map(x=>x.n+":"+x.b).join(" ")===OLD,S.map(x=>x.n+":"+x.b).join(" "));
  ok("48 beats in all",S.reduce((n,x)=>n+x.b,0)===48);
  // events: a note and the held notes after it ("c") are one event
  const ev=[]; let beat=0;
  S.forEach((x,i)=>{ if(x.k==="c"&&ev.length) ev[ev.length-1].span+=x.b; else ev.push({s:x.s,k:x.k,at:beat,span:x.b,i}); beat+=x.b; });
  const wi=ev.findIndex(e=>e.s==="W"), fromW=ev.slice(wi,ev.findIndex(e=>e.s==="Now")).map(e=>e.s+"@"+e.at+"×"+e.span);
  ok("from W: W two beats, X one, Y one, two beats for \"and\", Z held two — then \"Now\" at beat 32",fromW.join(" ")==="W@24×2 X@26×1 Y@27×1 and@28×2 Z@30×2"&&ev[ev.findIndex(e=>e.s==="Now")].at===32,fromW.join(" "));
  ok("W's notes: G G (two rows, the second held)",S.filter(x=>x.s==="W").map(x=>x.n+x.k).join(" ")==="G4L G4c");
  ok("X and Y on F, \"and\" on E E, Z on D",S.find(x=>x.s==="X").n==="F4"&&S.find(x=>x.s==="Y").n==="F4"&&S.filter(x=>x.s==="and").map(x=>x.n).join()==="E4,E4"&&S.find(x=>x.s==="Z").n==="D4");
  ok("\"and\" is not a letter and not a last-lines word (k a, then held)",S.filter(x=>x.s==="and").map(x=>x.k).join("")==="ac");
  ok("Z is the last letter of the song",S.filter(x=>x.k==="L").pop().s==="Z"&&S.findIndex(x=>x.s==="Z")<S.findIndex(x=>x.s==="Now"));
  const letters=S.filter(x=>x.k==="L").map(x=>x.s);
  ok("26 letter rows, A to Z, none twice",letters.length===26&&letters.join("")===ABC.join(""));
  ok("L M N O quick (half beats), P held two",S.filter(x=>"LMNO".indexOf(x.s)>=0&&x.k==="L").every(x=>x.b===0.5)&&S.find(x=>x.s==="P").b===2);
  ok("every held note follows a note (never first, never after a last-lines word)",S.every((x,i)=>x.k!=="c"||(i>0&&S[i-1].k!=="w")));
  const iand=S.findIndex(x=>x.s==="and"), iY=S.findIndex(x=>x.s==="Y");
  ok("what is lit: W on both its notes, nothing on \"and\" (both notes), Z on Z",c._trainLit(S.findIndex(x=>x.s==="W")+1)==="W"&&c._trainLit(iand)===""&&c._trainLit(iand+1)===""&&c._trainLit(S.findIndex(x=>x.s==="Z"))==="Z");
  ok("the train holds still on \"and\" (Y's spot), then moves on to Z",c.trainSongShift(iand)===c.trainSongShift(iY)&&c.trainSongShift(iand+1)===c.trainSongShift(iY)&&c.trainSongShift(iand+2)!==c.trainSongShift(iY));
  ok("\"and\" shows the word, not \"Now I know my A B C's\"",/>and</.test(c._trainPopHtml(iand))&&c._trainPopHtml(iand).indexOf("Now I know")<0);
}

// ── the finish played through: tones and the screen, note by note ──
{ const w=world(), c=w.c, S=c.TRAIN_SONG, B=c.TRAIN_BEAT_S;
  const st=playRound(w), t0=w.now();
  ok("the finish is singing, tones on",st.phase==="done"&&st.song&&st.song.tones===true);
  const starts=w.tones.filter(x=>x[0]==="start");
  ok("one tone per note, the melody's pitches in order",starts.length===S.length&&starts.map(x=>x[1]).join()===S.map(x=>c.TRAIN_HZ[x.n]).join());
  const T=c.trainSongTimes();
  ok("…each on the song's clock",starts.every((s,k)=>Math.abs(s[2]-(t0/1000+0.15+T[k].t))<0.0005));
  w.paints.length=0;
  for(let g=0;g<5000&&!st.song.end&&w.timers.length;g++) w.tick(Math.min.apply(null,w.timers.map(y=>y.at)));
  const P=w.paints;
  ok("the song ran to its end",st.song.end===true);
  const heads=S.map((x,i)=>i).filter(i=>S[i].k!=="c");
  ok("one screen paint per sung event — none on a held note (W's second beat, \"and\"'s second)",P.length===heads.length,{paints:P.length,events:heads.length});
  ok("…each paint on its event's own tone (light = sound)",P.every((p,k)=>Math.abs(p.at/1000-starts[heads[k]][2])<0.0015));
  const lights=P.map(p=>p.lit).filter(l=>l.length===1);
  ok("26 single-letter lights, A to Z in order, no letter twice",lights.length===26&&lights.join("")===ABC.join(""),lights.join(""));
  const pops=P.map(p=>(p.pop.match(/trn-popl">([A-Z])</)||[])[1]).filter(Boolean);
  ok("each letter pops once (W too)",pops.join("")===ABC.join("")&&pops.filter(x=>x==="W").length===1,pops.join(""));
  const k=P.findIndex(p=>/>and</.test(p.pop)), kY=P.findIndex(p=>/trn-popl">Y</.test(p.pop)), kZ=P.findIndex(p=>/trn-popl">Z</.test(p.pop));
  ok("order on screen: Y, then \"and\", then Z",kY>=0&&k===kY+1&&kZ===k+1);
  ok("on \"and\": no car lit, the train where Y left it, no last-lines words yet",P[k].lit===""&&P[k].shift===P[kY].shift&&P[k].pop.indexOf("Now I know")<0);
  ok("\"and\" one beat after Y, Z two beats after \"and\"",
    Math.abs((P[k].at-P[kY].at)/1000-B)<0.0015&&Math.abs((P[kZ].at-P[k].at)/1000-2*B)<0.0015);
  const kW=P.findIndex(p=>/trn-popl">W</.test(p.pop)), kX=P.findIndex(p=>/trn-popl">X</.test(p.pop));
  ok("W lasts two beats on screen (X lights two beats after W)",kX===kW+1&&Math.abs((P[kX].at-P[kW].at)/1000-2*B)<0.0015);
  const kNow=P.findIndex(p=>/Now I know/.test(p.pop));
  ok("the whole train lights only from \"Now I know my A B C's\" on, after Z",kNow===kZ+1&&P.slice(0,kNow).every(p=>p.lit.length<=1)&&P[kNow].lit.length===26);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
