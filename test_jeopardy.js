/*
 * 📺 Jeopardy (her "continue next items" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Jeopardy board").
 * A board: one column per deck (the kid picks up to 5), rows ★…★★★★★ = best-known → least-known card by ladder rung. The kid
 * picks a square and PRODUCES the card (say / type / pick). Wrong twice → comes back once at the end, the answer never shown.
 * gameLogRound (game "jeop"); match_best "<board> · jeop" only when beaten; never the ladder. Runs the REAL code.
 *   run:  node test_jeopardy.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// JEOPARDY_START"), b=src.indexOf("// JEOPARDY_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one JEOPARDY block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// JEOPARDY_START",a+1)<0&&src.indexOf("// JEOPARDY_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|cells\.push|backs\.push|out\.push|on\.push/g,"")));
ok("GAMES_LIST: Jeopardy right after Whack-a-mole, with park / restore / resume and decks for the grid",/resume:\(\)=>moleResume\(\), decks:k=>typeof moleDecks==="function"\?moleDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"jeop",\s*emoji:"\\u\{1F4FA\}", label:"Jeopardy",\s*view:"jeop",\s*available:k=>typeof jeopDecks==="function"&&jeopDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildJeopHtml\(c\),\n\s*park:\(\)=>jeopState, restore:v=>\{ jeopState=v\|\|null; \}, resume:\(\)=>jeopResume\(\), decks:k=>typeof jeopDecks==="function"\?jeopDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/jeop/i.test(fnText("gamesCurrentKey"))&&!/jeopState|jeopResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no values, points, money wager, lives, clock or opponent (the 🎰 JPWAGER hooks are confidence, not money); the start tap unlocks audio; the honor tap is documented",!/points|\bpts\b|lives|hearts|leaderboard|setInterval|opponent|bankDirect/i.test(code)&&!/wager/i.test(code.replace(/^.*🎰 JPWAGER.*$/gm,"").replace(/jpWager\w*|st\.wager|wager:null/g,""))&&/bbAudioUnlock\(\)/.test(blk)&&/honor system/.test(blk));
ok("the answer is never shown after a miss (the app never supplies what the kid must produce)",/We\\u2019ll come back to that one\./.test(blk)&&!/It was|The answer (is|was)/.test(blk));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + JEOPARDY, a kid's cards, a recording db, timers by hand ──
const P=(n,emoji,tier)=>({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:tier||"weekly"});
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const G=(f,ans,tier)=>({id:"g_"+f,subject:"German",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const ANIMALS=[P("cat","🐱","graduated"),P("dog","🐶","monthly"),P("cow","🐮","bi_weekly"),P("pig","🐷","weekly"),P("fox","🦊","every_other_day"),P("owl","🦉","daily")];
const MATH=[M("7+8","15","monthly"),M("6+6","12","bi_weekly"),M("9+4","13","weekly"),M("5+5","10","every_other_day"),M("8+3","11","daily")];
const GERMAN=[G("gut","well"),G("ich","I"),G("du","you"),G("ja","yes")];
const SMALL=[{id:"x1",subject:"Tiny",prompt:"a",emoji:"🅰️",status:"active"},{id:"x2",subject:"Tiny",prompt:"b",emoji:"🅱️",status:"active"}];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// JEOPARDY_START","// JEOPARDY_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mstTodayKey:()=>"20261103",mastView:o.view||"jeop",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jeopState',{get:()=>jeopState,set:v=>{jeopState=v;}}); Object.defineProperty(this,'jeopPickDecks',{get:()=>jeopPickDecks,set:v=>{jeopPickDecks=v;}}); Object.defineProperty(this,'_jpRandom',{get:()=>_jpRandom,set:v=>{_jpRandom=v;}}); this.JP_COLS=JP_COLS; this.JP_ROWS=JP_ROWS; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._jpRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
// answer the open card right (or wrong when bad=true), once
function answer(w,bad){
  const c=w.c, st=c.jeopState, t=st.turns[st.open.t];
  if(t.act==="say"){ c.jeopSaid(); return; }
  if(t.act==="type"){ const s=bad?"777":backOf(c,t.pid); for(const ch of s) c.jeopKey(ch); c.jeopCheck(); return; }
  const right=backOf(c,t.pid); c.jeopPickTap(bad?t.opts.findIndex(o=>o!==right&&!t.wrong[o]):t.opts.indexOf(right));
}
const openCell=(w,ci)=>{ w.c.jeopPickCell(ci); return w.c.jeopState.open; };

{ const w=world(ANIMALS.concat(MATH,GERMAN,SMALL)), c=w.c;
  const decks=c.jeopDecks(c.masteryData.k);
  ok("decks: Animals, German and Math Facts can be columns; a 2-card deck can't",JSON.stringify(decks)==="[\"Animals\",\"German\",\"Math Facts\"]",decks);
  const col=c.jeopColumn(ANIMALS,5);
  ok("a column: 5 rows from best-known (★, graduated) down to least-known (★★★★★, daily)",col.length===5&&col[0].id==="p_cat"&&col[4].id==="p_owl"&&c.MAST_TIER_ORDER.indexOf(col[1].tier)>=c.MAST_TIER_ORDER.indexOf(col[3].tier));
  ok("a short deck spreads its cards over the rows (3 cards → 5 rows, some repeat, never empty)",c.jeopColumn(ANIMALS.slice(0,3),5).every(x=>x)&&new Set(c.jeopColumn(ANIMALS.slice(0,3),5).map(x=>x.id)).size===3);
  ok("kinds: picture → say, number back → type, word back → pick",c.jeopKind(ANIMALS[0],"picture")==="say"&&c.jeopKind(MATH[0],"answer")==="type"&&c.jeopKind(GERMAN[0],"answer")==="pick");
  ok("start screen: deck toggles (all three on, under the cap of 5) and a Build the board button; no card is shown",/aria-pressed="true"/.test(c.buildJeopHtml("#000"))&&(c.buildJeopHtml("#000").match(/aria-pressed="true"/g)||[]).length===3&&/Build the board/.test(c.buildJeopHtml("#000"))&&!/7\+8|cat/.test(c.buildJeopHtml("#000")));
  c.jeopToggle("German");
  ok("a toggle takes a deck off the board (never the last one)",JSON.stringify(c.jeopDecksOn(decks))==="[\"Animals\",\"Math Facts\"]"&&(c.jeopToggle("Animals"),c.jeopToggle("Math Facts"),c.jeopDecksOn(decks).length===1));
  c.jeopPickDecks=["Animals","Math Facts"];
  const off=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{jeop:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Jeopardy is not a column; off for Which one? only, it still plays",JSON.stringify(off.c.jeopDecks(off.c.masteryData.k))==="[\"Math Facts\"]"&&(()=>{ const w2=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{which:false}}}}); return w2.c.jeopDecks(w2.c.masteryData.k).length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck",off.c.gameDeckCan("k",{key:"jeop",decks:k=>off.c.jeopDecks(off.c.masteryData.k,k)}).indexOf("Animals")>=0);
}
{ const w=world(ANIMALS.concat(MATH,GERMAN)), c=w.c;
  c.jeopPickDecks=["Animals","Math Facts"]; c.jeopStart(); const st=c.jeopState;
  ok("a board: 2 columns × 5 rows (the smaller deck has 5), 10 squares, nothing open, 'Pick a square!'",st&&st.phase==="play"&&st.decks.length===2&&st.rows===5&&st.cells.length===10&&st.of===10&&!st.open&&st.msg==="Pick a square!"&&st.game==="jeop"&&st.kid==="k"&&st.deck==="2 decks");
  const h0=c.buildJeopHtml("#000");
  ok("the board draws ★ … ★★★★★ squares with the deck names as headers, no card fronts",(h0.match(/class="jp-cell"/g)||[]).length===10&&h0.indexOf(">\u2605\u2605\u2605\u2605\u2605<")>0&&h0.indexOf("jp-head")>0&&!/7\+8|>cat</.test(h0));
  // the easiest Animals square: say it
  const ci0=st.cells.findIndex(x=>x.col===0&&x.row===0); openCell(w,ci0);
  ok("open a picture square: the card shows, the prompt asks 'What is it?', the name is NOT written",st.open&&st.open.ci===ci0&&st.turns.length===1&&st.turns[0].act==="say"&&w.said.slice(-1)[0]==="What is it?"&&!/>cat</.test(c.buildJeopHtml("#000"))&&/I said it/.test(c.buildJeopHtml("#000")));
  ok("while a card is open no other square can be picked",(c.jeopPickCell(ci0+1),st.turns.length===1));
  answer(w);
  ok("🗣 I said it → first-try right, the app SAYS the name back (never writes it), the ding, the square turns green after the beat",st.cells[ci0].done&&st.cells[ci0].first&&st.first===1&&/^cat\. That/.test(w.said.slice(-1)[0])&&!/cat/.test(st.msg)&&!/>cat</.test(c.buildJeopHtml("#000"))&&w.dings.slice(-1)[0]==="ding"&&st.lock);
  w.flush(); ok("back to the board",!st.open&&!st.lock&&st.msg==="Pick a square!"&&/jp-ok/.test(c.buildJeopHtml("#000")));
  // a Math square typed wrong once, then right
  const ciM=st.cells.findIndex(x=>x.col===1&&x.row===0); openCell(w,ciM); const tM=st.turns[st.open.t];
  ok("a number square: the FRONT shows and is said, the number pad is up",tM.act==="type"&&w.said.slice(-1)[0]==="7+8"&&/jp-key/.test(c.buildJeopHtml("#000"))&&c.buildJeopHtml("#000").indexOf(">7+8<")>0);
  answer(w,true);
  ok("wrong once → the bonk, 'Almost — try again!', the square still open",w.dings.slice(-1)[0]==="bonk"&&/Almost/.test(st.msg)&&!tM.done&&tM.tries===1);
  answer(w);
  ok("right on the second try → done, not first, the ding, the square turns amber ◐",tM.done&&!tM.first&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&st.cells[ciM].done&&!st.cells[ciM].first);
  w.flush();
  // a Math square wrong twice
  const ciF=st.cells.findIndex(x=>x.col===1&&x.row===1); openCell(w,ciF); answer(w,true); answer(w,true); const tF=st.turns[st.open.t];
  ok("wrong twice → fail: 'We'll come back to that one.', no ding, the answer never shown, the square amber",tF.fail&&tF.done&&/come back/.test(st.msg)&&w.dings.slice(-1)[0]==="bonk"&&c.buildJeopHtml("#000").indexOf(">"+backOf(c,tF.pid)+"<")<0);
  w.flush();
  // clear the rest
  let guard=0; while(st.phase==="play"&&guard++<30){ const ci=st.cells.findIndex(x=>!x.done); if(ci<0) break; openCell(w,ci); answer(w); w.flush(); }
  ok("every square done → the two missed cards come back once (the board is clear line, then one card at a time)",st.phase==="back"||st.phase==="done");
  w.flush(); guard=0; while(st.phase==="back"&&guard++<10){ if(st.open){ answer(w); } w.flush(); }
  ok("the round ends: 8 of 10 on the first try; the come-backs count for nothing",st.phase==="done"&&st.first===8&&st.of===10&&st.turns.filter(t=>t.back).length===2);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key '2 decks · jeop', update; ONE gameLog push with game jeop and every act (12)",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"2 decks · jeop\":8}"&&gl.length===1&&gl[0][2].game==="jeop"&&gl[0][2].items.length===12&&gl[0][2].items.filter(i=>i.back).length===2&&w.writes.length===2);
  ok("the finish: '8 of 10 on the first try — new best', Play again goes back to the deck toggles",/8 of 10 on the first try/.test(c.buildJeopHtml("#000"))&&/new best/.test(c.buildJeopHtml("#000"))&&/Play again/.test(c.buildJeopHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x)));
}
{ const w=world(GERMAN.concat(MATH),{celeb:true}), c=w.c;
  c.jeopPickDecks=["German"]; c.jeopStart(); const st=c.jeopState;
  ok("one deck: a 1-column board of 4 (the deck's size), named by the deck",st.decks.length===1&&st.rows===4&&st.of===4&&st.deck==="German");
  openCell(w,0); const t=st.turns[0];
  ok("a word square: pick from 3 of the deck's own backs, the card's own among them; a silent language's front is shown, not said",t.act==="pick"&&t.opts.length===3&&t.opts.indexOf(backOf(c,t.pid))>=0&&w.said.length===0&&(c.buildJeopHtml("#000").match(/class="jp-opt"/g)||[]).length===3);
  let guard=0; while(st.phase!=="done"&&guard++<20){ if(!st.open&&st.phase==="play"){ const ci=st.cells.findIndex(x=>!x.done); openCell(w,ci); } answer(w); w.flush(); }
  ok("a clean board: 4 of 4, the small confetti with the overlay present (noSong)",st.first===4&&w.dings.some(x=>x==="celeb:\u{1F4FA} You cleared the board!"));
  c.jeopStart(); const st2=c.jeopState; guard=0; while(st2.phase!=="done"&&guard++<20){ if(!st2.open&&st2.phase==="play"){ openCell(w,st2.cells.findIndex(x=>!x.done)); } answer(w); w.flush(); }
  ok("a best that is not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===1&&st2.isPB===false);
}
{ const w=world(ANIMALS,{dry:true}), c=w.c;
  c.jeopStart(); const st=c.jeopState; let guard=0; while(st.phase!=="done"&&guard++<20){ if(!st.open&&st.phase==="play"){ openCell(w,st.cells.findIndex(x=>!x.done)); } answer(w); w.flush(); }
  ok("?dryrun=1: the round plays, nothing is written",st.phase==="done"&&w.writes.length===0);
  c.jeopStart(); openCell(w,0); c.jeopStop();
  ok("Stop drops the round: nothing written",c.jeopState===null&&w.writes.length===0);
}
{ const w=world(ANIMALS.concat(MATH)), c=w.c;
  c.jeopPickDecks=["Animals","Math Facts"]; c.jeopStart(); const st=c.jeopState; openCell(w,0); answer(w);   // the beat is pending
  const parked=st; c.jeopState=null; w.flush();
  ok("a parked round's beat does nothing",parked.lock&&parked.open);
  c.jeopState=parked; c.jeopResume();
  ok("resume settles the beat: back to the board with the square done",!parked.lock&&!parked.open&&parked.cells[0].done&&parked.msg==="Pick a square!");
  openCell(w,1); const s0=w.said.length; c.jeopState=null; c.jeopState=parked; c.jeopResume();
  ok("resume on an open card says the ask again",w.said.length===s0+1);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
