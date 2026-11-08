/*
 * 🔴 Connect Four vs the app (her word 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3). Every cell shows its card; tap a column,
 * answer the card where the disc lands (say / type / pick); right → your disc, wrong twice → no disc, the app plays (win > block > middle).
 * Four in a row or a full board ends it; misses back once. gameLogRound (game "four"); match_best "<deck> · four" = first-try rights,
 * never wins; never the ladder. Runs the REAL code with timers by hand.
 *   run:  node test_four.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// FOUR_START"), b=src.indexOf("// FOUR_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one FOUR block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// FOUR_START",a+1)<0&&src.indexOf("// FOUR_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|open\.push|backs\.push|b\.push|cards\.push/g,"")));
ok("GAMES_LIST: Connect Four right after Teach it, with park / restore / resume and decks for the grid",/resume:\(\)=>teachResume\(\), decks:k=>typeof teachDecks==="function"\?teachDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"four",\s*emoji:"\\u\{1F534\}", label:"Connect Four",view:"four",\s*available:k=>typeof fourDecks==="function"&&fourDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildFourHtml\(c\),\n\s*park:\(\)=>fourState, restore:v=>\{ fourState=v\|\|null; \}, resume:\(\)=>fourResume\(\), decks:k=>typeof fourDecks==="function"\?fourDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/four/i.test(fnText("gamesCurrentKey"))&&!/fourState|fourResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no points, steals, lives or clock; the start tap unlocks audio; the honor tap documented; the answer never shown after a miss",!/points|\bpts\b|steal|lives|hearts|leaderboard|setInterval|bankDirect/i.test(code)&&/bbAudioUnlock\(\)/.test(blk)&&/honor system/.test(blk)&&!/It was|The answer (is|was)/.test(blk));

// ── pure board ──
{ const ctx={console,Math,Array,Object,JSON,Number,String}; vm.createContext(ctx);
  vm.runInContext(fnText("c4Empty")+"\n"+fnText("c4Drop")+"\n"+fnText("c4Full")+"\n"+fnText("c4Win")+"\n"+fnText("c4AppMove")+"\nvar _c4Random=Math.random;",ctx);
  const B=ctx.c4Empty(7,6);
  ok("an empty 7×6 board: a disc lands on the bottom row; a full column returns -1",B.length===6&&B[0].length===7&&ctx.c4Drop(B,3)===5&&(()=>{ for(let r=0;r<6;r++) B[r][0]=1; return ctx.c4Drop(B,0)===-1; })());
  const W=ctx.c4Empty(7,6); [[5,0],[5,1],[5,2]].forEach(([r,c])=>{ W[r][c]=1; });
  ok("four in a row is seen across, down and on both diagonals",(W[5][3]=1,ctx.c4Win(W,1,5,3))&&(()=>{ const V=ctx.c4Empty(7,6); for(let r=2;r<6;r++) V[r][4]=2; return ctx.c4Win(V,2,2,4); })()&&(()=>{ const D=ctx.c4Empty(7,6); [[5,0],[4,1],[3,2],[2,3]].forEach(([r,c])=>{ D[r][c]=1; }); return ctx.c4Win(D,1,2,3)&&!ctx.c4Win(D,2,2,3); })()&&(()=>{ const D=ctx.c4Empty(7,6); [[5,6],[4,5],[3,4],[2,3]].forEach(([r,c])=>{ D[r][c]=2; }); return ctx.c4Win(D,2,3,4); })());
  ok("three in a row is not a win",!ctx.c4Win((()=>{ const T=ctx.c4Empty(7,6); T[5][0]=T[5][1]=T[5][2]=1; return T; })(),1,5,2));
  const A=ctx.c4Empty(7,6); A[5][0]=A[5][1]=A[5][2]=2;
  ok("the app takes a winning column when it has one",ctx.c4AppMove(A,seeded(1))===3);
  const K=ctx.c4Empty(7,6); K[5][1]=K[5][2]=K[5][3]=1; K[5][5]=2;
  ok("…else it blocks the kid's winning column (either end)",[0,4].indexOf(ctx.c4AppMove(K,seeded(1)))>=0);
  const M=ctx.c4Empty(7,6); const mv=ctx.c4AppMove(M,seeded(2));
  ok("…else a column near the middle",mv>=2&&mv<=4);
  const F=ctx.c4Empty(7,6); for(let r=0;r<6;r++) for(let c=0;c<7;c++) F[r][c]=((r+c)%2)+1;
  ok("a full board: no move, c4Full",ctx.c4AppMove(F,seeded(1))===-1&&ctx.c4Full(F));
}

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + FOUR, a kid's cards, a recording db, timers by hand ──
const P=(n,emoji)=>({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:"weekly"});
const M=(f,ans)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:"weekly"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉"),P("bee","🐝")];
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10"),M("8+3","11"),M("2+7","9"),M("100+200","300")];
const SMALL=[M("1+1","2"),M("1+2","3"),M("1+3","4"),M("1+4","5"),M("1+5","6")].map(x=>Object.assign(x,{subject:"Tiny"}));
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// FOUR_START","// FOUR_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mstTodayKey:()=>"20261103",mastView:"four",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'fourState',{get:()=>fourState,set:v=>{fourState=v;}}); Object.defineProperty(this,'_c4Random',{get:()=>_c4Random,set:v=>{_c4Random=v;}}); this.C4_COLS=C4_COLS; this.C4_ROWS=C4_ROWS; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._c4Random=seeded(o.seed||3);
  const flush=()=>{ let g=0; while(timers.length&&g++<50){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
function answer(w,bad){ const c=w.c, st=c.fourState, t=st.turns[st.open.t];
  if(t.act==="say"){ c.fourSaid(); return; }
  if(t.act==="type"){ const s=bad?"777":backOf(c,t.pid); for(const ch of s) c.fourKey(ch); c.fourCheck(); return; }
  const right=backOf(c,t.pid); c.fourPickTap(bad?t.opts.findIndex(o=>o!==right&&!t.wrong[o]):t.opts.indexOf(right)); }
const count=(st,who)=>st.board.reduce((n,row)=>n+row.filter(v=>v===who).length,0);

{ const w=world(ANIMALS.concat(MATH,SMALL)), c=w.c;
  ok("decks: 6+ playable cards → Animals and Math Facts; a 5-card deck can't",JSON.stringify(c.fourDecks(c.masteryData.k))==="[\"Animals\",\"Math Facts\"]");
  const off=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{four:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Connect Four is not offered; off for Which one? only, it still plays; the preload lists it",JSON.stringify(off.c.fourDecks(off.c.masteryData.k))==="[\"Math Facts\"]"&&off.c.gameDeckCan("k",{key:"four",decks:k=>off.c.fourDecks(off.c.masteryData.k,k)}).indexOf("Animals")>=0&&(()=>{ const w2=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{which:false}}}}); return w2.c.fourDecks(w2.c.masteryData.k).length===2; })());
}
{ const w=world(MATH), c=w.c;
  c.fourStart("Math Facts"); const st=c.fourState;
  ok("a round: a 7×6 board, every cell a card of the deck (7 cards cycle, none twice before all 7), the kid's turn, nothing asked yet",st&&st.phase==="play"&&st.board.length===6&&st.cards.length===6&&st.cards.every(r=>r.length===7)&&new Set(st.cards[0]).size===7&&st.who==="kid"&&!st.open&&st.game==="four"&&st.kid==="k"&&w.said[0]==="Your turn!");
  const h0=c.buildFourHtml("#000");
  ok("the board shows each cell's front (short) and 7 column buttons; the long front 100+200 shows '?'",(h0.match(/class="c4-cell"/g)||[]).length===42&&(h0.match(/class="c4-col"/g)||[]).length===7&&h0.indexOf(">7+8<")>0&&h0.indexOf(">?<")>0&&h0.indexOf("100+200")<0);
  c.fourPickCol(3); const o=st.open, pid=st.cards[5][3];
  ok("tap column 4: the bottom cell's card is asked (typed), its front said, the cell lit",o&&o.col===3&&o.row===5&&st.turns[0].pid===pid&&st.turns[0].act==="type"&&w.said.slice(-1)[0]===c.masteryData.k.find(x=>x.id===pid).prompt&&/c4-ask/.test(c.buildFourHtml("#000"))&&/c4-key/.test(c.buildFourHtml("#000")));
  ok("while a card is open no other column can be tapped",(c.fourPickCol(0),st.turns.length===1));
  answer(w);
  ok("right → the ding, the kid's disc lands on that cell, the app's turn comes after a beat",w.dings.slice(-1)[0]==="ding"&&st.board[5][3]===1&&st.first===1&&st.of===1&&st.lock&&st.after==="app");
  w.flush();
  ok("the app drops a disc (answering nothing) and hands the turn back",count(st,2)===1&&st.who==="kid"&&!st.lock&&!st.open&&/Your turn/.test(st.msg));
  // a miss: wrong twice → no disc, the app still plays
  const col=[0,1,2,4,5,6].find(cc=>c.c4Drop(st.board,cc)>=0); c.fourPickCol(col); const row=st.open.row; answer(w,true);
  ok("wrong once → the bonk, try again, the cell still open",w.dings.slice(-1)[0]==="bonk"&&/Almost/.test(st.msg)&&st.open);
  answer(w,true);
  ok("wrong twice → 'We'll come back to that one', NO disc, the turn passes to the app",/come back/.test(st.msg)&&st.board[row][col]===0&&st.of===2&&st.first===1&&st.after==="app");
  w.flush(); ok("…the app played, the kid's turn again",count(st,2)===2&&st.who==="kid");
  // play on until the round ends (answer everything right; the app may win or the kid may)
  let guard=0; while(st.phase==="play"&&guard++<60){ if(st.lock){ w.flush(); continue; } if(!st.open){ const cc=[3,2,4,1,5,0,6].find(x=>c.c4Drop(st.board,x)>=0); c.fourPickCol(cc); } else answer(w); }
  ok("the round ends with four in a row or a full board, then the missed card comes back once",(st.phase==="back"||st.phase==="done")&&["kid","app","tie"].indexOf(st.winner)>=0);
  guard=0; while(st.phase!=="done"&&guard++<20){ if(st.lock){ w.flush(); continue; } if(st.open) answer(w); else w.flush(); }
  ok("finish: the missed card came back once (it counts for nothing); first-try count = right answers on the first try",st.phase==="done"&&st.turns.filter(t=>t.back).length===1&&st.first===st.of-1);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key 'Math Facts · four' = the first-try rights (never the win); ONE gameLog push, game four, every act",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])===JSON.stringify({"Math Facts · four":st.first})&&gl.length===1&&gl[0][2].game==="four"&&gl[0][2].items.length===st.turns.length&&w.writes.length===2);
  const hf=c.buildFourHtml("#000");
  ok("the finish says who connected four, shows the board and 'N of M on the first try — new best'",/(you did it|I got four|A tie)/.test(hf)&&/on the first try/.test(hf)&&/new best/.test(hf)&&(hf.match(/class="c4-cell/g)||[]).length===42);
}
{ const w=world(ANIMALS), c=w.c;
  c.fourStart("Animals"); const st=c.fourState; c.fourPickCol(0);
  ok("a picture deck: the cell shows the picture, the ask is 'What is it?' — the name is never written",/memoji/.test(c.buildFourHtml("#000"))&&st.turns[0].act==="say"&&w.said.slice(-1)[0]==="What is it?"&&!/>cat<|>dog<|>cow<|>pig<|>fox<|>owl<|>bee</.test(c.buildFourHtml("#000")));
  c.fourSaid();
  ok("🗣 I said it → the app SAYS the name back, the disc lands",/^(cat|dog|cow|pig|fox|owl|bee)\. That/.test(w.said.slice(-1)[0])&&st.board[5][0]===1);
  const parked=st; c.fourState=null; w.flush();
  ok("a parked round's beat does nothing (the app has not played)",count(parked,2)===0&&parked.lock);
  c.fourState=parked; c.fourResume();
  ok("resume settles the beat: the app plays at once, then its own beat hands the turn back",count(parked,2)===1&&parked.who==="app"&&parked.lock&&(w.flush(),parked.who==="kid"&&!parked.lock));
  c.fourStop(); ok("Stop drops the round: nothing written",c.fourState===null&&w.writes.length===0);
}
{ const w=world(MATH,{dry:true}), c=w.c;
  c.fourStart("Math Facts"); const st=c.fourState; let guard=0;
  while(st.phase!=="done"&&guard++<80){ if(st.lock){ w.flush(); continue; } if(st.open){ answer(w); continue; } if(st.phase==="play"){ const cc=[3,2,4,1,5,0,6].find(x=>c.c4Drop(st.board,x)>=0); c.fourPickCol(cc); } else w.flush(); }
  ok("?dryrun=1: a whole round plays to the end, nothing is written",st.phase==="done"&&w.writes.length===0);
}
{ const w=world(ANIMALS.concat(MATH),{celeb:true}), c=w.c;
  c.fourStart(c.WHICH_MIX); const st=c.fourState;
  ok("Mix the decks: cells from both decks",st.mix&&new Set(st.cards.flat().map(p=>c.masteryData.k.find(x=>x.id===p).subject)).size===2);
  let guard=0; while(st.phase!=="done"&&guard++<80){ if(st.lock){ w.flush(); continue; } if(st.open){ answer(w); continue; } if(st.phase==="play"){ const cc=[3,2,4,1,5,0,6].find(x=>c.c4Drop(st.board,x)>=0); c.fourPickCol(cc); } else w.flush(); }
  ok("a clean round: every answer first try; confetti only if the kid also connected four",st.first===st.of&&(st.winner==="kid")===w.dings.some(x=>x==="celeb:\u{1F534} Four in a row!"));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
