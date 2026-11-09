/*
 * 🤔 Sure? then flip (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Sure? then flip").
 * 👍 sure / 🤷 not sure FIRST, then produce the card (say 🗣 + own ✓/✗ mark, type a number, pick a back), THEN the flip shows the
 * answer. A confident miss gets the louder correction (big red, said twice) and comes back FIRST; an unsure miss comes back after.
 * gameLogRound (game "sure"); match_best "<deck> · sure" only when beaten; never the ladder. Runs the REAL code, timers by hand.
 *   run:  node test_sure.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// SURE_START"), b=src.indexOf("// SURE_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one SURE block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// SURE_START",a+1)<0&&src.indexOf("// SURE_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|turns\.splice/g,"")));
ok("GAMES_LIST: Sure? then flip right after True / Not true, with park / restore / resume and decks for the grid",/resume:\(\)=>tnResume\(\), decks:k=>typeof tnDecks==="function"\?tnDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"sure",\s*emoji:"\\u\{1F914\}",\s*label:"Sure\? then flip",\s*view:"sure",\s*available:k=>typeof sureDecks==="function"&&sureDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildSureHtml\(c\),\n\s*park:\(\)=>sureState, restore:v=>\{ sureState=v\|\|null; \}, resume:\(\)=>sureResume\(\), decks:k=>typeof sureDecks==="function"\?sureDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/sureState|sureResume/.test(fnText("gamesCurrentKey"))&&!/sureState|sureResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, clock, points, leaderboard or opponent; the start tap unlocks audio; the honor tap is documented",!/lives|hearts|leaderboard|bankDirect|steal|setInterval|opponent/i.test(code)&&/bbAudioUnlock\(\)/.test(blk)&&/honor system/.test(blk));
ok("the confidence call comes BEFORE the card is produced (the sure step opens the produce step), and the answer is written only on the flip",/t\.sure=!!sure; t\.step="produce";/.test(blk)&&/the flip: the answer, written — after the kid produced/.test(blk));
ok("one timer (the beat after a right answer), checked against its own round and sequence",(code.match(/setTimeout\(/g)||[]).length===1&&/sureState===st&&st\.lock&&st\.seq===seq/.test(code));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + SURE, a kid's cards, a recording db, timers by hand ──
const P=(n,emoji)=>({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:"weekly"});
const M=(f,ans)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:"weekly"});
const G=(f,ans)=>({id:"g_"+f,subject:"German",prompt:f,answer:ans,status:"active",tier:"weekly"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉")];
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10")];
const GERMAN=[G("gut","well"),G("ich","I"),G("du","you"),G("ja","yes")];
const SMALL=[{id:"x1",subject:"Tiny",prompt:"a",emoji:"🅰️",status:"active"},{id:"x2",subject:"Tiny",prompt:"b",emoji:"🅱️",status:"active"}];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// SURE_START","// SURE_END")+(o.noJudge?"":"\n"+cut("// GAMEJUDGE_START","// GAMEJUDGE_END"));   // ⚖️ GAMEJUDGE: a said card is judged before the flip
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mstTypeAnsOk:(t,a)=>Number(t)===Number(a),
    mstTodayKey:()=>"20261103",mastView:o.view||"sure",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'sureState',{get:()=>sureState,set:v=>{sureState=v;}}); Object.defineProperty(this,'_sureRandom',{get:()=>_sureRandom,set:v=>{_sureRandom=v;}}); this.SURE_ROUND=SURE_ROUND; this.SURE_MIN=SURE_MIN; this.WHICH_MIX=WHICH_MIX; this.__raw=()=>_gdRaw;",ctx);
  ctx._sureRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const item=(c,pid)=>c.masteryData.k.find(x=>x.id===pid);
const backOf=(c,pid)=>c._whichBack(item(c,pid));
// ⚖️ GAMEJUDGE: the kid's pick after "I said it" — the right choice, or (bad) another one
function pickSaid(c,t,bad){ const ch=t.gj.ch, i=ch.findIndex(x=>x.ok); c.gameJudgePick(bad?(i+1)%ch.length:i); }
// one whole card: the confidence call, the act (right or wrong), then whatever the flip asks for
function play(c,w,sure,bad){
  const st=c.sureState, t=st.turns[st.i];
  c.sureCall(sure);
  if(t.act==="say"){ c.sureSaid(); pickSaid(c,t,bad); }
  else if(t.act==="type"){ const right=backOf(c,t.pid); String(bad?Number(right)+1:right).split("").forEach(ch=>c.sureKey(ch)); c.sureCheck(); }
  else { const i=t.opts.indexOf(backOf(c,t.pid)); c.surePickTap(bad?(i+1)%t.opts.length:i); }
  if(t.ok) w.flush(); else c.sureGotIt();
}

console.log("── which decks play (pure) ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN,SMALL).concat([{id:"s1",subject:"AAS Words",prompt:"red",status:"active",tier:"monthly"}])), c=w.c;
  const decks=c.sureDecks(c.masteryData.k);
  ok("decks: Animals, German, Math Facts play; a 2-card deck and spelling never",JSON.stringify(decks)==="[\"Animals\",\"German\",\"Math Facts\"]",decks);
  ok("the act per card: a picture is said, a number back is typed, a word back is picked",c.sureKind(ANIMALS[0],"picture")==="say"&&c.sureKind(MATH[0],"answer")==="type"&&c.sureKind(GERMAN[0],"answer")==="pick");
  ok("the flip: a picture's NAME, an answer card's BACK",c.sureAnswer(ANIMALS[0],"say")==="cat"&&c.sureAnswer(MATH[0],"type")==="15"&&c.sureAnswer(GERMAN[0],"pick")==="well");
  const off=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{sure:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Sure? is not offered; turned off for Which one? only, it still plays here",JSON.stringify(off.c.sureDecks(off.c.masteryData.k))==="[\"Math Facts\"]"&&(()=>{ const w2=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{which:false}}}}); return w2.c.sureDecks(w2.c.masteryData.k).length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"sure",decks:k=>off.c.sureDecks(off.c.masteryData.k,k)}).indexOf("Animals")>=0);
  off.c.sureStart("Animals");
  ok("…and a turned-off deck cannot be started; _gdRaw is put back",off.c.sureState===null&&off.c.__raw()===false);
  const e=world(SMALL);
  ok("no deck ready → the empty note",/No decks ready for Sure/.test(e.c.buildSureHtml("#000")));
}
console.log("── a round of pictures: sure → say → pick (judged BEFORE the flip) → flip ──");
{ const w=world(ANIMALS), c=w.c;
  c.sureStart("Animals"); const st=c.sureState;
  ok("a round: 6 cards (fewer than SURE_ROUND), every one at the sure step, nothing said for a picture (its name is what the kid produces)",st&&st.phase==="play"&&st.turns.length===6&&st.of===6&&st.turns.every(t=>t.step==="sure"&&t.act==="say"&&t.sure===null)&&w.said.length===0&&st.game==="sure"&&st.kid==="k");
  let h=c.buildSureHtml("#000"), t=st.turns[0];
  ok("the sure step: the picture, 👍 I'm sure / 🤷 Not sure, 'How sure are you?' — no answer anywhere, no 🗣 yet",/sure-vis/.test(h)&&/sureCall\(true\)/.test(h)&&/sureCall\(false\)/.test(h)&&/How sure are you/.test(h)&&!/sureSaid/.test(h)&&!ANIMALS.some(x=>h.indexOf(">"+x.prompt+"<")>=0));
  c.sureSaid(); c.gameJudgePick(0);
  ok("say / pick before the confidence call do nothing",t.step==="sure"&&!t.done&&!t.gj);
  c.sureCall(true); h=c.buildSureHtml("#000");
  ok("👍 → the produce step: 🗣 I said it (the judge's — say it first, then pick), still no name written",t.sure===true&&t.step==="produce"&&t.judge==="pick"&&/gameJudgeSaid\(\)/.test(h)&&/Say it out loud/.test(h)&&!/class="sure-flip/.test(h)&&h.indexOf(">"+item(c,t.pid).prompt+"<")<0);
  const nSaid=w.said.length; c.sureSaid(); h=c.buildSureHtml("#000");
  ok("🗣 → NOT the flip: the choices (Tap what you said), still no flip, nothing said — the judge comes before the flip",t.step==="produce"&&t.ok===null&&t.judge==="pick"&&t.gj.step==="pick"&&/gameJudgePick\(/.test(h)&&/Tap what you said/.test(h)&&!/class="sure-flip/.test(h)&&w.said.length===nSaid);
  ok("no self-mark anywhere: no ✅ I had it / ❌ Not quite, no sureMark",typeof c.sureMark==="undefined"&&!/I had it|Not quite|sureMark/.test(h+src.slice(src.indexOf("// SURE_START"),src.indexOf("// SURE_END")).replace(/^\/\/.*$/gm,"")));
  pickSaid(c,t,false); h=c.buildSureHtml("#000");
  ok("the right pick → the flip: the name written AND said (the confirm)",t.step==="flip"&&/class="sure-flip/.test(h)&&h.indexOf(">"+item(c,t.pid).prompt+"<")>0&&w.said.slice(-1)[0]===item(c,t.pid).prompt);
  ok("✓ right pick → right, first, the ding, 'You knew it!', the board locks for a beat; tally sure&right",t.done&&t.ok===true&&t.first&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&st.lock&&/You knew it/.test(h)&&/sure-ok/.test(h)&&st.tally.sr===1&&w.timers.length===1);
  w.flush();
  ok("after the beat the next card is up at its sure step",st.i===1&&!st.lock&&st.turns[1].step==="sure");
  // card 2: SURE and wrong → the loud correction, comes back FIRST
  t=st.turns[1]; c.sureCall(true); c.sureSaid(); const d0=w.dings.length; pickSaid(c,t,true); h=c.buildSureHtml("#000");
  ok("👍 then a wrong pick → the LOUDER correction: the bonk, the big red flip 'You were sure — look closely', the name said TWICE, ➡ Got it (no timer)",t.ok===false&&t.fail&&!t.first&&w.dings.slice(-1)[0]==="bonk"&&w.dings.length===d0+1&&/sure-loud/.test(h)&&/You were sure/.test(h)&&w.said.slice(-1)[0]===item(c,t.pid).prompt+". "+item(c,t.pid).prompt+"."&&/sureGotIt\(\)/.test(h)&&w.timers.length===0&&st.tally.sw===1);
  ok("…and the card is queued to come back once, marked as a confident miss",st.turns.length===7&&st.turns[6].back&&st.turns[6].pid===t.pid&&st.turns[6].sureFirst===true);
  c.sureGotIt();
  // card 3: NOT sure and wrong → the soft correction, comes back AFTER the confident one
  t=st.turns[2]; c.sureCall(false); c.sureSaid(); pickSaid(c,t,true); h=c.buildSureHtml("#000");
  ok("🤷 then a wrong pick → the soft correction: the bonk, the amber flip 'Not yet — it's', the name said once",t.ok===false&&/sure-soft/.test(h)&&/Not yet/.test(h)&&w.said.slice(-1)[0]===item(c,t.pid).prompt&&st.tally.nw===1);
  ok("its come-back goes AFTER the confident miss's",st.turns.length===8&&st.turns[7].back&&st.turns[7].pid===t.pid&&!st.turns[7].sureFirst&&st.turns[6].pid===st.turns[1].pid);
  c.sureGotIt();
  // card 4: NOT sure and right
  t=st.turns[3]; c.sureCall(false); c.sureSaid(); pickSaid(c,t,false); h=c.buildSureHtml("#000");
  ok("🤷 then the right pick → 'You had it after all!', counted first-time right",t.first&&st.first===2&&/had it after all/.test(h)&&st.tally.nr===1);
  w.flush();
  // card 5: another SURE miss → it comes back right after the first confident miss, still before the unsure one
  t=st.turns[4]; c.sureCall(true); c.sureSaid(); pickSaid(c,t,true); c.sureGotIt();
  ok("a second confident miss lines up behind the first, both before the unsure one",st.turns.length===9&&st.turns[6].pid===st.turns[1].pid&&st.turns[7].pid===st.turns[4].pid&&st.turns[8].pid===st.turns[2].pid);
  play(c,w,true,false);
  ok("the come-backs: the first one up is the confident miss, 'One more look'",st.i===6&&st.turns[6].back&&/One more look/.test(c.buildSureHtml("#000")));
  play(c,w,true,false); play(c,w,false,false); play(c,w,true,true);
  ok("the round ends after the come-backs: 3 of 6 right the first time (come-backs count for nothing, and never come back again)",st.phase==="done"&&st.first===3&&st.of===6&&st.turns.length===9);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game sure and every turn",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Animals · sure\":3}"&&gl.length===1&&gl[0][2].game==="sure"&&gl[0][2].items.length===9&&gl[0][2].items.filter(i=>i.ok).length===5&&gl[0][2].items.filter(i=>i.back).length===3&&gl[0][2].items.filter(i=>i.fail).length===4&&w.writes.length===2);
  h=c.buildSureHtml("#000");
  ok("the finish: the count against the best and the honest tally",/3 of 6 right the first time/.test(h)&&/new best/.test(h)&&/sure &amp; right 1/.test(h)&&/sure &amp; wrong 2/.test(h)&&/not sure &amp; right 1/.test(h)&&/not sure &amp; wrong 1/.test(h)&&!w.dings.some(x=>/celeb/.test(x)));
}
console.log("── answer decks: type and pick ──");
{ const w=world(MATH.concat(GERMAN)), c=w.c;
  c.sureStart("Math Facts"); const st=c.sureState; let t=st.turns[0], it=item(c,t.pid);
  ok("an answer card: the FRONT written and said at the sure step; the back nowhere",c.buildSureHtml("#000").indexOf(">"+it.prompt+"<")>0&&w.said[0]===it.prompt&&c.buildSureHtml("#000").indexOf(">"+it.answer+"<")<0);
  c.sureCall(true); let h=c.buildSureHtml("#000");
  ok("type: the number pad, ✔ disabled until something is typed",/sureKey\('7'\)/.test(h)&&/sureCheck\(\)" disabled/.test(h));
  String(Number(it.answer)+1).split("").forEach(ch=>c.sureKey(ch)); c.sureCheck(); h=c.buildSureHtml("#000");
  ok("a wrong number, sure → the loud flip shows the right back (written, said twice), one try only",t.ok===false&&/sure-loud/.test(h)&&h.indexOf(">"+it.answer+"<")>0&&w.said.slice(-1)[0]===it.answer+". "+it.answer+".");
  c.sureKey("1"); ok("the pad is dead after the flip",t.typed===String(Number(it.answer)+1));
  c.sureGotIt(); t=st.turns[1]; it=item(c,t.pid); c.sureCall(false); it.answer.split("").forEach(ch=>c.sureKey(ch)); c.sureCheck();
  ok("a right number, not sure → right, the ding, 'had it after all', the back said once",t.ok===true&&t.first&&w.dings.slice(-1)[0]==="ding"&&w.said.slice(-1)[0]===it.answer&&/had it after all/.test(c.buildSureHtml("#000")));
  w.flush(); const sN=w.said.length;
  c.sureStart("German"); const gs=c.sureState; t=gs.turns[0]; it=item(c,t.pid);
  ok("a language the voice can't say: the front is shown, not said, no 🔊 at the sure step",w.said.length===sN&&c.buildSureHtml("#000").indexOf(">"+it.prompt+"<")>0&&!/sureSayAgain/.test(c.buildSureHtml("#000")));
  c.sureCall(true); h=c.buildSureHtml("#000");
  ok("pick: three backs of the deck, the card's own among them",t.opts.length===3&&t.opts.indexOf(it.answer)>=0&&new Set(t.opts).size===3&&(h.match(/surePickTap\(/g)||[]).length===3);
  const wrongI=t.opts.findIndex(o=>o!==it.answer); c.surePickTap(wrongI); h=c.buildSureHtml("#000");
  ok("a wrong pick → the flip shows the picked one struck through and the right back, 🔊 says it (English)",t.ok===false&&t.picked===t.opts[wrongI]&&/<s>/.test(h)&&h.indexOf(">"+it.answer+"<")>0&&/sureSayAgain/.test(h));
  c.surePickTap((wrongI+1)%3); ok("the picks are dead after the flip",t.picked===t.opts[wrongI]);
  c.sureChangeDeck();
  ok("Change deck mid-round drops it: nothing written",c.sureState===null&&w.writes.length===0);
}
console.log("── the Mix, the dry run, confetti, the kid ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN)), c=w.c;
  c.sureStart(c.WHICH_MIX); const mx=c.sureState;
  ok("Mix the decks: SURE_ROUND cards from more than one deck, each with its own act",mx.mix&&mx.turns.length===c.SURE_ROUND&&new Set(mx.turns.map(t=>item(c,t.pid).subject)).size>=2&&mx.turns.every(t=>t.act===(item(c,t.pid).subject==="Animals"?"say":item(c,t.pid).subject==="Math Facts"?"type":"pick")));
  let guard=0; while(mx.phase==="play"&&guard++<30) play(c,w,true,false);
  ok("a clean Mix round: 8 of 8, best under the Mix's own key",mx.phase==="done"&&mx.first===8&&JSON.stringify(w.writes.find(x=>x[0]==="update")[2])===JSON.stringify({[c.WHICH_MIX+" \u00B7 sure"]:8}));
  const d=world(ANIMALS,{dry:true}); d.c.sureStart("Animals"); guard=0; while(d.c.sureState.phase==="play"&&guard++<30) play(d.c,d,false,false);
  ok("?dryrun=1: the round plays, nothing is written (the best stays in memory)",d.c.sureState.phase==="done"&&d.writes.length===0&&d.c.masteryData.k_settings.match_best["Animals \u00B7 sure"]===6);
  const e=world(ANIMALS,{celeb:true}); e.c.sureStart("Animals"); guard=0; while(e.c.sureState.phase==="play"&&guard++<30) play(e.c,e,true,false);
  ok("with the overlay on the page, a clean round gets the small confetti (noSong)",e.dings.some(x=>x==="celeb:\u{1F914} You knew them all!"));
  const k=world(ANIMALS); k.c.sureStart("Animals"); k.c.masteryKid="other"; guard=0; while(k.c.sureState.phase==="play"&&guard++<30) play(k.c,k,true,false);
  ok("the finish saves to the round's OWN kid, not the kid picked now",k.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&k.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
  const nb=world(ANIMALS,{settings:{match_best:{"Animals \u00B7 sure":6}}}); nb.c.sureStart("Animals"); guard=0; while(nb.c.sureState.phase==="play"&&guard++<30) play(nb.c,nb,true,false);
  ok("a best that is not beaten writes no best (the log still goes)",nb.writes.length===1&&nb.writes[0][0]==="push"&&nb.c.sureState.isPB===false&&nb.c.sureState.prevBest===6);
}
console.log("── resume (GAMEKID → GAMEKIT) ──");
{ const w=world(MATH), c=w.c;
  c.sureStart("Math Facts"); const st=c.sureState; const t=st.turns[0]; c.sureCall(true); backOf(c,t.pid).split("").forEach(ch=>c.sureKey(ch)); c.sureCheck();
  ok("mid-step: locked on the beat after a right answer",st.lock&&st.i===0);
  const parked=st; c.sureState=null; w.flush();
  ok("a parked round's timer does nothing",parked.i===0&&parked.lock);
  c.sureState=parked; const n=w.said.length; c.sureResume();
  ok("resume settles the beat, moves to the next card and says its front",!parked.lock&&parked.i===1&&w.said.length===n+1);
  c.sureResume();
  ok("resume with nothing mid-step just says it again",parked.i===1&&w.said.length===n+2);
  c.mastView="which"; c.sureResume();
  ok("not on screen → no speech",w.said.length===n+2);
  c.mastView="sure"; c.sureCall(false); String(Number(backOf(c,parked.turns[1].pid))+1).split("").forEach(ch=>c.sureKey(ch)); c.sureCheck();
  const n2=w.said.length; c.sureResume();
  ok("a wrong flip waiting for ➡ Got it is not advanced by a resume (the kid still has to read it); the back is said again",parked.i===1&&parked.turns[1].ok===false&&w.said.length===n2+1);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
