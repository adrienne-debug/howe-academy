/*
 * 🚂 ABC Train (her design 2026-11-08, PLAN_abc_puzzle_games_2026-11-08.md step 1: levels 1–2 + the sung finish (a)).
 * Available only for a kid with a letters deck (every card one letter A–Z — found by its cards, never a name). Level 1: the engine +
 * 2–3 cars from A, pick the next from 3; level 2: 4 choices, starting anywhere. Wrong → bounce, the right one wiggles, never placed for
 * the kid; a letter missed twice is a miss. Two clean rounds in a row → up a level (read back from the game log); Mom can pin it
 * (GAME_RULES.train "level"). Finish: the ABC song as WebAudio tones, each car lit + said on its note; one Play again.
 * Runs the REAL code (GAMELOG + GAMEGRID + GAMERULES + TRAIN) with timers by hand.
 *   run:  node test_game_train.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const UNITPIC = src.slice(src.indexOf("// UNITPIC_START"), src.indexOf("// UNITPIC_END"));   // the one card-picture helper (mastLiveVisual) the drawers call
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };
const ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ── by text ──
const a=src.indexOf("// TRAIN_START"), b=src.indexOf("// TRAIN_END");
ok("one TRAIN block, straight after NAMEALL_END",a>0&&b>a&&src.indexOf("// TRAIN_START",a+1)<0&&src.slice(src.indexOf("// NAMEALL_END"),a).trim()==="// NAMEALL_END");
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's or family's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe|sara/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: none of its own — only gameLogRound(st); no points, no ladder, no best score",!/db\.ref\(|\.set\(|\.update\(|\.push\(\{/.test(code.replace(/turns\.push\(\{/g,""))&&/gameLogRound\(st\)/.test(code)&&!/bankDirect|next_due|studyLog|match_best|tier=/.test(code));
ok("deck found by its cards (single letters), never by a deck name",/\^\[A-Za-z\]\$/.test(code)&&!/"Letters"|'Letters'|subject==="/.test(code));
ok("GAMES_LIST: the train after Name all, with park / restore / resume and decks for the grid",/nameallResume\(\), decks:k=>[^\n]*\n  \{key:"train",\s*emoji:"\\u\{1F682\}", label:"ABC Train",\s*view:"train",\s*available:k=>typeof trainAvail==="function"&&trainAvail\(k\), render:c=>buildTrainHtml\(c\),\n\s*park:\(\)=>trainPark\(\), restore:v=>\{ trainState=v\|\|null; \}, resume:\(\)=>trainResume\(\), decks:k=>typeof trainDecks==="function"\?trainDecks\(_gamesItems\(k\),k\):\[\]\}/.test(src));
ok("no new route: gamesCurrentKey / kcPlayOpen / GAMEKID untouched (the entry's view does it)",!/train/i.test(fnText("gamesCurrentKey"))&&!/train/i.test(fnText("kcPlayOpen"))&&!/train/i.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("GAME_LIKE_STATE names the train's state (the 👍👎 line)",/\n  train:\(\)=>trainState/.test(cut("const GAME_LIKE_STATE={","\n};")));
ok("GAMELOG: one guarded line adds level + clean to a train round only",/if\(st\.game==="train"&&st\.level!=null\)\{ e\.level=st\.level; e\.clean=!!st\.clean; \}/.test(fnText("gameLogEntry")));
ok("the start tap unlocks audio; every song / roll timer checks its own round",/bbAudioUnlock\(\)/.test(code)&&/trainState===st&&st\.lock&&st\.seq===seq/.test(code)&&/trainState===st&&st\.seq===seq&&st\.song/.test(code));

// ── a sandbox ──
const L=(ch,extra)=>Object.assign({id:"L_"+ch,subject:"Abc",prompt:ch,status:"active",tier:"daily"},extra||{});
const FULL=ABC.map(ch=>L(ch));
function fakeAudio(log){
  return function(){ this.state="running"; this.currentTime=0; this.destination={};
    this.createOscillator=()=>{ const o={type:"",frequency:{value:0},connect(){},start(t){ log.push(["start",o.frequency.value,t]); },stop(t){ log.push(["stop",t]); }}; return o; };
    this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
    this.resume=()=>Promise.resolve(); };
}
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[], tones=[]; let now=0, clock=1762600000000;
  class FakeDate extends Date{ static now(){ return clock+=1000; } }   // each round finishes at its own time
  const CODE=cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// TRAIN_START","// TRAIN_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,Promise,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx._renders=(ctx._renders||0)+1; },bbAudioUnlock(){},momHere:()=>o.mom!==false,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?items||[]:[]),
    mastGetVisual:(cat,name)=>(o.vis&&o.vis[name])||null,
    mastItemVis:it=>it.emoji?'<span class="emo">'+it.emoji+'</span>':'<span class="glyph">'+it.prompt+'</span>',
    mastSpeak:t=>{ if(o.noVoice) throw new Error("no voice"); said.push(t); },matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),
    mstTodayKey:()=>"20261108",mastView:"train",masteryKid:"k",bbAlarmCtx:null,
    masteryData:{k:items||[],k_settings:o.settings||{},gameLog:o.log||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  if(o.audio) ctx.window={AudioContext:fakeAudio(tones)}; else if(o.window) ctx.window={};
  if(o.doc) ctx.document={getElementById:id=>o.doc[id]||null};
  vm.createContext(ctx);
  vm.runInContext(UNITPIC + "\n" + CODE+"\nObject.defineProperty(this,'trainState',{get:()=>trainState,set:v=>{trainState=v;}}); Object.defineProperty(this,'_trainRandom',{get:()=>_trainRandom,set:v=>{_trainRandom=v;}});"+
    " this.TRAIN_SONG=TRAIN_SONG; this.TRAIN_ROLL_MS=TRAIN_ROLL_MS; this.TRAIN_STEPS=TRAIN_STEPS; this.TRAIN_HZ=TRAIN_HZ; this.TRAIN_LETTER_NAMES=TRAIN_LETTER_NAMES; this.TRAIN_BEAT_S=TRAIN_BEAT_S; this.GAME_RULES=GAME_RULES; this._trainOsc=()=>_trainOsc;",ctx);
  ctx._trainRandom=seeded(o.seed||3);
  const tick=t=>{ for(;;){ const due=timers.filter(x=>x.at<=t).sort((x,y)=>x.at-y.at||x.id-y.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  const flushAll=()=>{ let g=0; while(timers.length&&g++<500){ tick(Math.min.apply(null,timers.map(x=>x.at))); } };
  return {c:ctx,writes,said,dings,timers,tones,tick,flushAll,now:()=>now};
}
const rightIx=t=>t.choices.indexOf(t.L), wrongIx=t=>t.choices.findIndex(x=>x!==t.L);
// play the open round to the end: misses = {letter: how many wrong taps first}
function playRound(w,misses){
  const c=w.c, st=c.trainState;
  for(let g=0;g<20&&st.phase==="play";g++){
    const t=st.turns[st.i], m=(misses&&misses[t.L])||0;
    const wrongs=t.choices.filter(x=>x!==t.L);
    for(let k=0;k<m;k++) c.trainTap(t.choices.indexOf(wrongs[k%wrongs.length]));
    c.trainTap(rightIx(t)); w.tick(w.now()+c.TRAIN_ROLL_MS);
  }
  return st;
}

// ── availability ──
{ const w=world(FULL), c=w.c;
  ok("a deck of single letters A–Z → the train is offered",c.trainAvail("k")===true&&JSON.stringify(c.trainDecks(FULL,"k"))==="[\"Abc\"]");
  ok("no letters deck → not offered (a picture deck, a word deck)",world([{id:"a",subject:"Animals",prompt:"cat",status:"active",emoji:"🐱"},{id:"b",subject:"Animals",prompt:"dog",status:"active"}]).c.trainAvail("k")===false&&world([]).c.trainAvail("k")===false);
  ok("a deck with ONE word among the letters is not a letters deck",world(FULL.concat([L("x",{prompt:"ox",id:"ox"})])).c.trainAvail("k")===false);
  ok("fewer than 5 letters, or every letter card parked → not offered",world(FULL.slice(0,4)).c.trainAvail("k")===false&&world(FULL.map(x=>Object.assign({},x,{status:"parked"}))).c.trainAvail("k")===false);
  ok("a letters deck still being introduced (A–P, some parked) counts — the train is still the whole alphabet",world(FULL.slice(0,16).map((x,i)=>Object.assign({},x,{status:i<5?"introduction":"parked"}))).c.trainAvail("k")===true);
  const low=ABC.map(ch=>L(ch.toLowerCase(),{subject:"Lower",id:"l_"+ch})), both=world(FULL.concat(low));
  ok("a lowercase-only deck counts too; with both, the capital-letter deck builds the train",world(low).c.trainAvail("k")===true&&both.c.trainDeck(both.c.masteryData.k,"k").deck==="Abc"&&both.c.trainDecks(both.c.masteryData.k,"k").length===2);
  const off=world(FULL,{settings:{gameDecks:{Abc:{train:false}}}});
  ok("🎮 GAMEGRID: the deck turned off for the train → not offered; the grid's preload (raw) still lists it",off.c.trainAvail("k")===false&&off.c.gameDeckCan("k",{key:"train",decks:k=>off.c.trainDecks(off.c.masteryData.k,k)}).indexOf("Abc")>=0);
  ok("no deck → the game's page says what it needs, no crash",/needs a Letters deck/.test(world([]).c.buildTrainHtml("#000")));
}

// ── rounds and choices per level ──
{ let lv1ok=true, lv2ok=true, anyLate=false, coupledSeen={};
  for(let s=1;s<=40;s++){
    const c=world(FULL,{seed:s}).c, cards={}; FULL.forEach(x=>{ cards[x.prompt]=x; });
    const r1=c.trainRound(1,cards), r2=c.trainRound(2,cards);
    coupledSeen[r1.coupled]=1;
    const seq=(r,n)=>{ const all=r.on.concat(r.turns.map(t=>t.L)), i0=ABC.indexOf(all[0]); return all.every((x,i)=>x===ABC[i0+i])&&r.turns.length===c.TRAIN_STEPS&&r.turns.every(t=>t.choices.length===n&&new Set(t.choices).size===n&&t.choices.indexOf(t.L)>=0&&t.choices.every(x=>ABC.indexOf(x)>=0)); };
    if(!(r1.start===0&&r1.on[0]==="A"&&(r1.coupled===2||r1.coupled===3)&&seq(r1,3))) lv1ok=false;
    if(!(seq(r2,4)&&r2.start+r2.coupled+c.TRAIN_STEPS<=26)) lv2ok=false;
    if(r2.start>0) anyLate=true;
  }
  ok("level 1: always from A, 2 or 3 cars already coupled, then the next letters in order — 3 different choices, the right one among them",lv1ok&&coupledSeen[2]&&coupledSeen[3]);
  ok("level 2: 4 different choices, the run stays inside A–Z",lv2ok);
  ok("level 2: the starting cars can be anywhere in the alphabet",anyLate);
  const c=world(FULL).c, ch=c.trainChoices("D",3);
  ok("the lures are the right letter's neighbours (a car already on the train can be one, so the earliest letter isn't always right)",ch.every(x=>Math.abs(ABC.indexOf(x)-3)<=2));
  let earliestAlways=true; for(let s=1;s<=30;s++){ const r=world(FULL,{seed:s}).c.trainRound(1,{}); r.turns.forEach(t=>{ if(t.choices.slice().sort()[0]!==t.L) earliestAlways=false; }); }
  ok("…checked over 30 level-1 rounds: the right car is NOT always the alphabetically first choice",!earliestAlways);
}

// ── right / wrong ──
{ const w=world(FULL.map((x,i)=>i===4?Object.assign({},x,{emoji:"🐘"}):x)), c=w.c;
  c.trainStart(); const st=c.trainState, t=st.turns[0], onBefore=st.on.slice();
  ok("start: level 1, the round's turns, the first car to pick is the letter after the coupled ones",st.level===1&&st.phase==="play"&&t.L===ABC[st.on.length]&&t.choices.length===3);
  let h=c.buildTrainHtml("#123");
  ok("the play screen: the engine at the front, the coupled cars (upper + lower), a ? slot, 3 choice cars",h.indexOf("\u{1F682}")>=0&&h.indexOf("\u{1F682}")<h.indexOf('data-trn-l="A"')&&/<span class="trn-up">A<\/span><span class="trn-lo">a<\/span>/.test(h)&&/trn-slot/.test(h)&&(h.match(/onclick="trainTap\(/g)||[]).length===3);
  const wi=wrongIx(t), wl=t.choices[wi];
  c.trainTap(wi);
  ok("a wrong car: the bonk, it bounces, nothing is coupled, the turn stays open",w.dings.join()==="bonk"&&st.on.join()===onBefore.join()&&!t.done&&t.wrong[wl]===1&&st.bounce===wi&&!t.fail);
  h=c.buildTrainHtml("#123");
  ok("…the tapped car bounces and the RIGHT car wiggles — the kid still has to tap it",new RegExp('trn-choice trn-bounce" onclick="trainTap\\('+wi+'\\)').test(h)&&new RegExp('trn-choice trn-wiggle" onclick="trainTap\\('+rightIx(t)+'\\)').test(h));
  const w2=t.choices.findIndex(x=>x!==t.L&&x!==wl); c.trainTap(w2);
  ok("a second different miss on the same letter → it counts as a miss (fail), still not placed",t.fail===true&&!t.done&&Object.keys(t.wrong).length===2);
  c.trainTap(rightIx(t));
  ok("the right car: ding, it couples (rolls in), its letter's NAME is said (never a bare capital), the round locks for the roll",t.done&&t.first===false&&st.on[st.on.length-1]===t.L&&st.roll===t.L&&st.lock&&w.said[w.said.length-1]===c.TRAIN_LETTER_NAMES[t.L]&&w.dings[w.dings.length-1]==="ding");
  ok("…the new car carries the roll-in animation",new RegExp('class="trn-car trn-in" data-trn-l="'+t.L+'"').test(c.buildTrainHtml("#123")));
  const before=w.dings.length; c.trainTap(0);
  ok("a tap during the roll does nothing",w.dings.length===before&&st.i===0);
  w.tick(w.now()+c.TRAIN_ROLL_MS);
  ok("after the roll: the next turn",st.i===1&&!st.lock&&st.roll===null);
  const pic=c._trainCarHtml("E",{cards:{E:FULL[4]&&Object.assign({},FULL[4],{emoji:"🐘"})}}), nopic=c._trainCarHtml("B",{cards:{B:FULL[1]}});
  ok("a car shows the card's picture when it has one (mastItemVis) — else the letter alone, never the glyph twice",/trn-pic"><span class="emo">🐘/.test(pic)&&!/trn-pic/.test(nopic)&&/trn-up">B<.*trn-lo">b</.test(nopic));
  ok("a picture from the kid's visuals (mastGetVisual) counts too",/trn-pic/.test(world(FULL,{vis:{C:"🐱"}}).c._trainCarHtml("C",{cards:{C:FULL[2]}})));
}

// ── a whole round + logging ──
{ const w=world(FULL), c=w.c;
  c.trainStart(); const st=playRound(w);
  const p=w.writes.filter(x=>x[0]==="push");
  ok("a clean round finishes: phase done, clean",st.phase==="done"&&st.clean===true);
  ok("logged once through gameLogRound: mastery/gameLog/<kid>/<day> push, game train, level 1, clean, one item per letter (its card id)",p.length===1&&p[0][1]==="mastery/gameLog/k/20261108"&&p[0][2].game==="train"&&p[0][2].level===1&&p[0][2].clean===true&&p[0][2].deck==="Abc"&&p[0][2].items.length===c.TRAIN_STEPS&&p[0][2].items.every(x=>x.ok===true&&x.n===1&&/^L_[A-Z]$/.test(x.id)));
  ok("nothing else is written (no points, no ladder, no best)",w.writes.length===1);
  const w2=world(FULL); w2.c.trainStart(); const L2=w2.c.trainState.turns[1].L; playRound(w2,{[L2]:2});
  const e2=w2.writes.filter(x=>x[0]==="push")[0][2], it2=e2.items.find(x=>x.id==="L_"+L2);
  ok("a letter missed twice in the round: ok false, n 3, fail — like every game's miss; the round is not clean",it2&&it2.ok===false&&it2.n===3&&it2.fail===true&&e2.clean===false);
  const w3=world(FULL); w3.c.trainStart(); const L3=w3.c.trainState.turns[0].L; playRound(w3,{[L3]:1});
  const it3=w3.writes[0][2].items.find(x=>x.id==="L_"+L3);
  ok("missed once: ok false, n 2, no fail",it3.ok===false&&it3.n===2&&!it3.fail);
  const d=world(FULL,{dry:true}); d.c.trainStart(); playRound(d);
  ok("?dryrun=1: nothing written (this device keeps its copy)",d.writes.length===0&&Object.keys(d.c.masteryData.gameLog.k["20261108"]).length===1);
  const part=world(FULL); part.c.trainStart(); part.c.trainTap(rightIx(part.c.trainState.turns[0])); part.c.trainStart();
  ok("a round dropped part-way writes nothing",part.writes.length===0);
  const sparse=world(FULL.slice(0,3)); sparse.c.trainStart();
  ok("a 3-letter deck: Start does nothing (no train at all)",sparse.c.trainState===null);
  const gap=world(FULL.filter(x=>x.prompt!=="E")); gap.c._trainRandom=()=>0.1; gap.c.trainStart(); playRound(gap);
  const eg=gap.writes[0][2];
  ok("a letter with no card in the deck still rides the train (the real order) but isn't logged as a card",gap.c.trainState.on.indexOf("E")>=0&&!eg.items.some(x=>x.id==="L_E")&&eg.items.length===c.TRAIN_STEPS-1);
}

// ── the level-up rule ──
{ const c=world(FULL).c, R=(lv,cl,at)=>({game:"train",level:lv,clean:cl,at:at});
  ok("pure: no rounds → level 1",c.trainLevelFrom([])===1);
  ok("pure: two clean level-1 rounds in a row → level 2",c.trainLevelFrom([R(1,true,1),R(1,true,2)])===2);
  ok("pure: clean, missed, clean → still level 1 (in a row)",c.trainLevelFrom([R(1,true,1),R(1,false,2),R(1,true,3)])===1);
  ok("pure: clean, missed, clean, clean → level 2",c.trainLevelFrom([R(1,true,1),R(1,false,2),R(1,true,3),R(1,true,4)])===2);
  ok("pure: rounds played at another level don't count toward this one",c.trainLevelFrom([R(2,true,1),R(2,true,2),R(1,true,3)])===1);
  ok("pure: never past level 2 (levels 3–5 come later)",c.trainLevelFrom([R(1,true,1),R(1,true,2),R(2,true,3),R(2,true,4),R(2,true,5)])===2);
  const w=world(FULL), cc=w.c;
  cc.trainStart(); playRound(w); ok("after one clean round: still level 1",cc.trainLevel("k")===1&&cc.trainState.levelAfter===1);
  cc.trainStart(); playRound(w);
  ok("after the second clean round in a row: level 2, and the finish says so",cc.trainLevel("k")===2&&cc.trainState.levelAfter===2&&/Level 2 next time/.test(cc.buildTrainHtml("#000")));
  cc.trainStart(); ok("the next round is level 2: 4 choices",cc.trainState.level===2&&cc.trainState.turns.every(t=>t.choices.length===4));
  const lg={k:{"20261107":{"-a":R(1,true,5),"local_5":R(1,true,5),"-b":R(1,true,6)}}};
  ok("this device's copy + the pushed copy of one round count once (its time + items) — the log is read on any device",world(FULL,{log:lg}).c.trainLevel("k")===2&&world(FULL,{log:{k:{"20261107":{"-a":R(1,true,5),"local_5":R(1,true,5)}}}}).c.trainLevel("k")===1);
}

// ── Mom's pin ──
{ const w=world(FULL), c=w.c;
  ok("GAME_RULES.train: \"level\" — auto / 1 / 2, default auto (+ 🚂 PKTRAIN's \"study\" on / off, default on — test_prek_study_train.js)",JSON.stringify(c.GAME_RULES.train.map(r=>[r.key,r.def,r.opts.map(o=>o[0])]))==='[["level","auto",["auto","1","2"]],["study","on",["on","off"]]]');
  ok("the rules pop-up lists it",/Which level\?/.test(c.gameRulesHtml("k","train"))&&/Level 2/.test(c.gameRulesHtml("k","train")));
  ok("Mom pins level 2 → a kid with no rounds starts at level 2 (one targeted set)",c.gameRuleSet("k","train","level","2")===true&&c.trainLevel("k")===2&&JSON.stringify(w.writes)==='[["set","mastery/k_settings/gameRules/train/level","2"]]');
  c.trainStart(); ok("…and the round has 4 choices",c.trainState.level===2&&c.trainState.turns[0].choices.length===4);
  const w2=world(FULL,{log:{k:{"20261107":{"-a":{game:"train",level:1,clean:true,at:1},"-b":{game:"train",level:1,clean:true,at:2}}}},settings:{gameRules:{train:{level:"1"}}}});
  ok("pinned at level 1 → stays at 1 even after two clean rounds",w2.c.trainLevel("k")===1);
  ok("back to auto → the rounds count (level 2)",w2.c.gameRuleSet("k","train","level","auto")&&w2.c.trainLevel("k")===2);
  const kid=world(FULL,{mom:false});
  ok("a kid can't pin it; a value that isn't an option is ignored",kid.c.gameRuleSet("k","train","level","2")===false&&kid.writes.length===0&&world(FULL,{settings:{gameRules:{train:{level:"9"}}}}).c.trainLevel("k")===1);
}

// ── the song ──
{ const c=world(FULL).c, S=c.TRAIN_SONG, T=c.trainSongTimes(0.5);
  const letters=S.filter(x=>x.k==="L").map(x=>x.s);
  ok("the song's letters: A to Z, each once, in order",letters.join("")===ABC.join(""));
  ok("Twinkle Twinkle: A–G = C C G G A A G(held)",S.slice(0,7).map(x=>x.n+":"+x.b).join(" ")==="C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2");
  ok("L M N O are quick (half beats) on D, then P held on C",S.filter(x=>"LMNO".indexOf(x.s)>=0&&x.k==="L").every(x=>x.b===0.5&&x.n==="D4")&&S.find(x=>x.s==="P").b===2&&S.find(x=>x.s==="P").n==="C4");
  ok("W is held over three notes (dou-ble-u) and said once",S.filter(x=>x.s==="W").map(x=>x.k).join("")==="Lcc");
  ok("the last two lines are words (\"Now I know my A B C's …\"), lit as a whole train, not said as letters",S.slice(S.findIndex(x=>x.s==="Now")).every(x=>x.k==="w")&&c._trainLit(S.findIndex(x=>x.s==="Now"))==="*");
  ok("six lines of 8 beats each: 48 beats",S.reduce((n,x)=>n+x.b,0)===48);
  ok("timing table: starts at 0, each note after the last, length = beats × the beat",T[0].t===0&&T.every((x,i)=>i===0||x.t>T[i-1].t)&&T.every(x=>x.d===x.b*0.5));
  ok("timing table: H at 4 s, Q at 8 s, Now at 16 s (beat 0.5 s)",T.find(x=>x.s==="H").t===4&&T.find(x=>x.s==="Q").t===8&&T.find(x=>x.s==="Now").t===16);
  ok("every note has a pitch",S.every(x=>c.TRAIN_HZ[x.n]>0));
  ok("the default beat",c.trainSongTimes()[1].t===c.TRAIN_BEAT_S);
  ok("lit at each note: before the song nothing, a letter on its note, the whole train after",c._trainLit(-1)===""&&c._trainLit(0)==="A"&&c._trainLit(S.length)==="*");
}
{ const w=world(FULL,{audio:true}), c=w.c;
  c.trainStart(); const st=playRound(w); const n0=w.said.length;
  ok("the finish starts the song: tones scheduled for every note (WebAudio)",st.song&&st.song.tones===true&&w.tones.filter(x=>x[0]==="start").length===c.TRAIN_SONG.length);
  ok("the tones play the melody's pitches in order",w.tones.filter(x=>x[0]==="start").map(x=>x[1]).join()===c.TRAIN_SONG.map(x=>c.TRAIN_HZ[x.n]).join());
  let h=c.buildTrainHtml("#000");
  ok("the finish screen: the whole A–Z train behind the engine, no Play again until the song ends",/id="trn-finish"/.test(h)&&ABC.every(x=>h.indexOf('data-trn-l="'+x+'"')>=0)&&!/Play again/.test(h));
  w.tick(w.now()+1000);
  ok("a second in: A, B lit on their notes (no speech engine here: no words, never a voice per note)",w.said.slice(n0).length===0&&st.song.i===1&&/class="trn-car trn-lit" data-trn-l="B"/.test(c.buildTrainHtml("#000")));
  w.flushAll();
  ok("no speech engine: the whole song says nothing (the tones + lights only)",w.said.slice(n0).length===0);
  h=c.buildTrainHtml("#000");
  ok("the end: one Play again button, the whole train lit",st.song.end===true&&(h.match(/Play again/g)||[]).length===1&&/onclick="trainStart\(\)"/.test(h)&&(h.match(/trn-car trn-lit/g)||[]).length===26);
  c.trainStart(); ok("Play again: a new round",c.trainState!==st&&c.trainState.phase==="play");
}
{ let err=null, w;
  try{ w=world(FULL,{window:true,noVoice:true}); w.c.trainStart(); playRound(w); w.flushAll(); }catch(e){ err=e; }
  ok("no AudioContext and no voice: no crash — the lights and letters run on their own clock",err===null&&w.c.trainState.song.tones===false&&w.c.trainState.song.end===true&&/Play again/.test(w.c.buildTrainHtml("#000")));
  let err2=null, w2; try{ w2=world(FULL); w2.c.trainStart(); playRound(w2); w2.flushAll(); }catch(e){ err2=e; }
  ok("no window at all: no crash",err2===null&&w2.c.trainState.song.end===true);
  ok("…and the silent finish says \"Sing along!\" while it runs",(()=>{ const w3=world(FULL); w3.c.trainStart(); playRound(w3); return /Sing along/.test(w3.c.buildTrainHtml("#000")); })());
}
{ const w=world(FULL,{audio:true,doc:{}}), c=w.c;   // a document without #trn-finish: the kid left the game
  c.trainStart(); const st=playRound(w); w.tick(w.now()+400);
  ok("leaving the game mid-song stops it (tones stopped, no more letters)",st.song.end===true&&w.tones.filter(x=>x[0]==="stop").length>=c.TRAIN_SONG.length&&c._trainOsc().length===0);
}
// ── park / resume (🎲 GAMEKIT) ──
{ const w=world(FULL,{audio:true}), c=w.c;
  c.trainStart(); const st=playRound(w); const n0=w.said.length;
  const parked=c.trainPark(); c.trainState=null; w.flushAll();
  ok("parking mid-song stops it: no more letters, the tones stopped",parked===st&&w.said.length===n0&&st.song.end===true&&c._trainOsc().length===0);
  c.trainState=parked; c.trainResume();
  ok("back to that kid: the finish with Play again",/Play again/.test(c.buildTrainHtml("#000")));
  const w2=world(FULL), c2=w2.c; c2.trainStart(); const s2=c2.trainState; c2.trainTap(rightIx(s2.turns[0]));
  c2.trainPark(); c2.trainState=null; w2.flushAll(); c2.trainState=s2; c2.trainResume();
  ok("parked while a car rolled in: on resume the next turn is open (nothing lost, nothing doubled)",s2.i===1&&!s2.lock&&s2.on.filter(x=>x===s2.turns[0].L).length===1);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
