/*
 * 🧩 Picture Puzzle (her design 2026-11-08, PLAN_abc_puzzle_games_2026-11-08.md Game 2).
 * Offered only for a kid with picture cards (a real picture to cut — found by the cards, never a name). A card the kid is learning
 * is cut into 4 / 6 / 9 pieces by level (CSS background tiles, no canvas); the pieces scatter in the tray; level 1's frame shows a
 * faint outline; drag (or tap) a piece close to its place and it snaps in, anywhere else it goes back. Finish: the whole picture, the
 * word shown + said, then "What is it?" with 3 words — logged through gameLogRound as a round of that card. Two clean rounds in a
 * row → more pieces; Mom can pin the pieces (GAME_RULES.jigsaw "pieces").
 * Runs the REAL code (GAMELOG + GAMEGRID + GAMERULES + JIGSAW) with timers by hand.
 *   run:  node test_game_jigsaw.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// JIGSAW_START"), b=src.indexOf("// JIGSAW_END");
ok("one JIGSAW block, straight after GAMELIKE_END",a>0&&b>a&&src.indexOf("// JIGSAW_START",a+1)<0&&src.slice(src.indexOf("// GAMELIKE_END"),a).trim()==="// GAMELIKE_END");
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's or family's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe|sara/i.test(blk));
ok("no deck named in code (found by its pictures)",!/"Animals"|"Shapes"|"Colors"|subject==="/.test(code));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: none of its own — only gameLogRound(st); no points, no ladder, no best score",!/db\.ref\(|\.set\(|\.update\(|\.push\(\{/.test(code.replace(/out\.push\(\{/g,""))&&/gameLogRound\(st\)/.test(code)&&!/bankDirect|next_due|studyLog|match_best|tier=(?!=)/.test(code));
ok("no canvas: the pieces are CSS background tiles",!/canvas|getContext/i.test(code)&&/background-size:'\+t\.bgSize/.test(code)&&/background-image:var\(--jig-img\)/.test(code));
ok("GAMES_LIST: the puzzle after the ABC Train, with park / restore / resume and decks for the grid",/trainDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"jigsaw", emoji:"\\u\{1F9E9\}", label:"Picture Puzzle", view:"jigsaw",\s*available:k=>typeof jigAvail==="function"&&jigAvail\(k\), render:c=>buildJigHtml\(c\),\n     park:\(\)=>jigPark\(\), restore:v=>\{ jigState=v\|\|null; \}, resume:\(\)=>jigResume\(\), decks:k=>/.test(src));
ok("GAME_LIKE_STATE names the puzzle's state (the 👍👎 line)",/\n  jigsaw:\(\)=>jigState/.test(cut("const GAME_LIKE_STATE={","\n};")));
ok("GAMELOG: one guarded line adds level + clean to a puzzle round",/if\(st\.game==="jigsaw"&&st\.level!=null\)\{ e\.level=st\.level; e\.clean=!!st\.clean; \}/.test(cut("// GAMELOG_START","// GAMELOG_END")));
ok("drag: pointer events, a piece takes the finger (touch-action:none)",/addEventListener\("pointermove"/.test(code)&&/addEventListener\("pointerup"/.test(code)&&/addEventListener\("pointercancel"/.test(code)&&/\.jig-tp\{[^}]*touch-action:none/.test(blk));
ok("the show timer checks its own round",/jigState===st&&st\.phase==="show"&&st\.seq===seq/.test(code));

// ── a sandbox ──
let _id=0;
const C=(word,extra)=>Object.assign({id:"c"+(++_id),subject:"Pets",prompt:word,status:"active",tier:"daily",imageUrl:"https://pics.example/"+word+".jpg"},extra||{});
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[]; let now=0, clock=1762600000000;
  class FakeDate extends Date{ static now(){ return clock+=1000; } }
  const CODE=cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// UNITPIC_START","// UNITPIC_END")+"\n"+cut("// JIGSAW_START","// JIGSAW_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date:FakeDate,parseInt,isNaN,isFinite,Promise,encodeURIComponent,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx._renders=(ctx._renders||0)+1; },momHere:()=>o.mom!==false,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?items||[]:[]),
    mastGetVisual:(cat,name)=>(o.vis&&o.vis[name])||null,
    mastSpeak:t=>{ if(o.noVoice) throw new Error("no voice"); said.push(t); },matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),
    mstTodayKey:()=>"20261108",mastView:"jigsaw",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{},gameLog:o.log||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jigState',{get:()=>jigState,set:v=>{jigState=v;}}); Object.defineProperty(this,'_jigRandom',{get:()=>_jigRandom,set:v=>{_jigRandom=v;}});"+
    " this.GAME_RULES=GAME_RULES; this.JIG_PIECES=JIG_PIECES; this.JIG_SNAP=JIG_SNAP; this.JIG_SHOW_MS=JIG_SHOW_MS; this.JIG_CHOICES=JIG_CHOICES;",ctx);
  if(o.live) vm.runInContext("mastLiveImg=__live;",Object.assign(ctx,{__live:o.live}));   // a stand-in for 🖼 UNITPIC's helper
  ctx._jigRandom=seeded(o.seed||3);
  const tick=t=>{ for(;;){ const due=timers.filter(x=>x.at<=t).sort((x,y)=>x.at-y.at||x.id-y.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  const flushAll=()=>{ let g=0; while(timers.length&&g++<200){ tick(Math.min.apply(null,timers.map(x=>x.at))); } };
  return {c:ctx,writes,said,dings,timers,tick,flushAll,now:()=>now};
}
const DECK=()=>[C("cat"),C("dog"),C("cow"),C("pig",{subject:"Farm"}),C("hen",{subject:"Farm",imageUrl:""})];
// place every piece at its own spot
function build(w){ const c=w.c, st=c.jigState, T=c.jigTiles(st.n,st.ar); st.tray.slice().forEach(i=>c.jigDrop(i,T[i].x,T[i].y)); return st; }
const rightIx=st=>st.choices.indexOf(st.word);

// ── availability ──
{ ok("picture cards → offered",world(DECK()).c.jigAvail("k")===true);
  ok("no cards, or only emoji / drawn cards (nothing to cut) → not offered",world([]).c.jigAvail("k")===false&&world([C("cat",{imageUrl:"",emoji:"🐱"}),C("Circle",{imageUrl:""})]).c.jigAvail("k")===false);
  ok("a picture card not in play (parked, retired) or a production twin doesn't count",world([C("cat",{status:"parked"}),C("dog",{status:"retired"}),C("cow",{dir:"prod"})]).c.jigAvail("k")===false&&world([C("cat",{status:"introduction"})]).c.jigAvail("k")===true);
  ok("a picture from the kid's visuals (mastGetVisual imageUrl) counts; an emoji visual doesn't",world([C("cat",{imageUrl:""})],{vis:{cat:{imageUrl:"https://pics.example/x.png"}}}).c.jigAvail("k")===true&&world([C("cat",{imageUrl:""})],{vis:{cat:"🐱"}}).c.jigAvail("k")===false);
  ok("🖼 UNITPIC's mastLiveImg is the one answer (a live emoji → no picture; a live URL → the picture cut is that one)",world([C("cat")],{live:()=>""}).c.jigAvail("k")===false&&world([C("cat")],{live:()=>"https://live.example/c.jpg"}).c.jigPic(C("cat"),"k")==="https://live.example/c.jpg");
  const off=world(DECK(),{settings:{gameDecks:{Pets:{jigsaw:false},Farm:{jigsaw:false}}}});
  ok("🎮 GAMEGRID: every picture deck off → not offered; the raw list still names the decks",off.c.jigAvail("k")===false&&JSON.stringify(off.c.gameDeckCan("k",{key:"jigsaw",decks:k=>off.c.jigDecks(off.c.masteryData.k,k)}))==='["Farm","Pets"]');
  ok("the decks: only those with a picture card",JSON.stringify(world(DECK()).c.jigDecks(DECK(),"k"))==='["Farm","Pets"]'&&JSON.stringify(world([C("hen",{imageUrl:""})]).c.jigDecks([C("hen",{imageUrl:""})],"k"))==="[]");
  ok("no picture cards → the game's page says what it needs, no crash",/needs cards with pictures/.test(world([]).c.buildJigHtml("#000")));
}

// ── the tiling math ──
{ const c=world([]).c, J=x=>JSON.stringify(x);
  ok("grids: 4 = 2 × 2, 6 = 3 × 2, 9 = 3 × 3",J(c.jigGrid(4))==='{"cols":2,"rows":2}'&&J(c.jigGrid(6))==='{"cols":3,"rows":2}'&&J(c.jigGrid(9))==='{"cols":3,"rows":3}');
  ok("levels: 1 → 4 pieces, 2 → 6, 3 → 9",J(c.JIG_PIECES)==='{"1":4,"2":6,"3":9}');
  [4,6,9].forEach(n=>{ const T=c.jigTiles(n,1), g=c.jigGrid(n);
    const cover=T.every(t=>Math.abs(t.w-1/g.cols)<1e-9&&Math.abs(t.h-1/g.rows)<1e-9)&&T.map(t=>t.i).join()===Array.from({length:n},(x,i)=>i).join()&&new Set(T.map(t=>t.x+","+t.y)).size===n&&T.every(t=>t.x+t.w<=1+1e-9&&t.y+t.h<=1+1e-9);
    ok(n+" pieces: each 1/cols × 1/rows of the frame, every place once, row by row, inside the frame",cover); });
  const T4=c.jigTiles(4,1), T6=c.jigTiles(6,1), T9=c.jigTiles(9,1);
  ok("square picture, 4 pieces: the picture at 200% × 200%, corners at 0% / 100%",T4.every(t=>t.bgSize==="200% 200%")&&T4.map(t=>t.bgPos).join("|")==="0% 0%|100% 0%|0% 100%|100% 100%");
  ok("6 pieces: 300% × 200%, columns at 0 / 50 / 100%",T6.every(t=>t.bgSize==="300% 200%")&&T6.slice(0,3).map(t=>t.bgPos).join("|")==="0% 0%|50% 0%|100% 0%"&&T6[4].bgPos==="50% 100%");
  ok("9 pieces: 300% × 300%, the middle piece at 50% 50%",T9.every(t=>t.bgSize==="300% 300%")&&T9[4].bgPos==="50% 50%"&&T9[8].bgPos==="100% 100%");
  // geometry: where the picture's left edge lands, in frames: CSS offset = (piece − picture) × p
  const edge=(t,n,ar)=>{ const g=c.jigGrid(n), sw=parseFloat(t.bgSize)/100, sh=parseFloat(t.bgSize.split(" ")[1])/100, px=parseFloat(t.bgPos)/100, py=parseFloat(t.bgPos.split(" ")[1])/100;
    return {x:(1-sw)*px/g.cols+t.x, y:(1-sh)*py/g.rows+t.y, w:sw/g.cols, h:sh/g.rows}; };   // the picture's left / top edge and size, in frames (same for every piece)
  const same=(n,ar)=>{ const T=c.jigTiles(n,ar), e=T.map(t=>edge(t,n,ar)); return e.every(q=>Math.abs(q.x-e[0].x)<0.002&&Math.abs(q.y-e[0].y)<0.002&&Math.abs(q.w-e[0].w)<1e-9)&&e[0]; };
  const s1=same(4,1), w2=same(6,2), t2=same(9,0.5);
  ok("every piece shows ITS part of one picture: the picture's edge is the same place for all pieces (square, wide, tall)",!!s1&&!!w2&&!!t2&&!!same(4,1.5)&&!!same(9,0.75));
  ok("a square picture fills the frame exactly",Math.abs(s1.x)<1e-6&&Math.abs(s1.y)<1e-6&&Math.abs(s1.w-1)<1e-9&&Math.abs(s1.h-1)<1e-9);
  ok("a wide picture (2:1) covers the frame centred — the sides cropped, not stretched",Math.abs(w2.w-2)<1e-9&&Math.abs(w2.h-1)<1e-9&&Math.abs(w2.x+0.5)<0.002&&Math.abs(w2.y)<0.002);
  ok("a tall picture (1:2): the top and bottom cropped",Math.abs(t2.w-1)<1e-9&&Math.abs(t2.h-2)<1e-9&&Math.abs(t2.y+0.5)<0.002&&Math.abs(t2.x)<0.002);
  ok("a bad aspect falls back to square",c.jigTiles(4,0)[1].bgPos==="100% 0%"&&c.jigTiles(4,NaN)[3].bgSize==="200% 200%");
}

// ── the snap rule ──
{ const c=world([]).c, T=c.jigTiles(9,1), t=T[4], s=c.JIG_SNAP;
  ok("snap: dropped right on its place",c.jigSnap(t,t.x,t.y)===true);
  ok("snap: close is enough — within JIG_SNAP of a piece's size, either way",c.jigSnap(t,t.x+t.w*s,t.y-t.h*s)===true&&c.jigSnap(t,t.x-t.w*s*0.9,t.y+t.h*s*0.9)===true);
  ok("snap: further off → no",c.jigSnap(t,t.x+t.w*s+0.01,t.y)===false&&c.jigSnap(t,t.x,t.y-t.h*s-0.01)===false);
  ok("snap: on another piece's place → no (each piece has one place)",T.filter(o=>o.i!==4).every(o=>c.jigSnap(t,o.x,o.y)===false));
}

// ── a round ──
{ const w=world(DECK()), c=w.c;
  c.jigStart(); const st=c.jigState;
  ok("start: level 1 → 4 pieces, every piece in the tray once, shuffled (not in order)",st.level===1&&st.n===4&&st.tray.slice().sort().join()==="0,1,2,3"&&st.tray.join()!=="0,1,2,3"&&st.phase==="play");
  ok("the card: a picture card in play, its word, its picture",st.word&&["cat","dog","cow","pig"].indexOf(st.word)>=0&&st.img==="https://pics.example/"+st.word+".jpg"&&st.turns.length===1&&st.turns[0].pid===st.pid);
  let h=c.buildJigHtml("#123");
  ok("the screen: the picture set once on the board, level 1's faint outline (the picture ghosted + the pieces' lines), 4 pieces in the tray to drag",(h.match(/--jig-img:url\(&quot;https:\/\/pics\.example\//g)||[]).length===1&&/class="jig-ghost"/.test(h)&&(h.match(/class="jig-cell"/g)||[]).length===4&&(h.match(/onpointerdown="jigDown\(event,\d\)"/g)||[]).length===4);
  ok("…each tray piece is its slice of the picture, a frame-piece in size",(()=>{ const T=c.jigTiles(4,1); return st.tray.every(i=>h.indexOf('onpointerdown="jigDown(event,'+i+')" style="background-size:'+T[i].bgSize+';background-position:'+T[i].bgPos+';width:calc(var(--jig-s) / 2);height:calc(var(--jig-s) / 2);')>=0); })());
  const T=c.jigTiles(4,1), i0=st.tray[0], other=T.find(t=>t.i!==i0);
  c.jigDrop(i0,other.x,other.y);
  ok("dropped on the wrong place: back to the tray (the slide-back), no sound, nothing placed",!st.placed[i0]&&st.bounce===i0&&w.dings.length===0&&/jig-tp jig-back/.test(c.buildJigHtml("#123")));
  c.jigDrop(i0,null,null);
  ok("dropped outside the frame: back too",!st.placed[i0]&&st.bounce===i0);
  c.jigDrop(i0,T[i0].x+0.05,T[i0].y-0.05);
  ok("dropped close to its place: it snaps in (the clack)",st.placed[i0]===1&&st.snap===i0&&w.dings.join()==="ding");
  h=c.buildJigHtml("#123");
  ok("…it shows in the frame at its place, 3 pieces left in the tray",new RegExp('class="jig-pc jig-in jig-snap" style="background-size:'+T[i0].bgSize.replace(/%/g,"%")+';background-position:'+T[i0].bgPos+';left:'+(T[i0].x*100)+'%;top:'+(T[i0].y*100)+'%').test(h)&&(h.match(/jigDown\(event/g)||[]).length===3&&/1 of 4 pieces/.test(h));
  ok("a placed piece can't be dropped again",c.jigDropJudge(st,i0,T[i0].x,T[i0].y)===null);
  st.tray.slice(1).forEach(i=>c.jigDrop(i,T[i].x,T[i].y));
  ok("the last piece: the whole picture, its word shown and said",st.phase==="show"&&w.said[w.said.length-1]===st.word&&/class="jig-whole"/.test(c.buildJigHtml("#123"))&&new RegExp('class="jig-word">'+st.word+'<').test(c.buildJigHtml("#123")));
  ok("no tray, no outline once it's whole",!/jigDown\(event/.test(c.buildJigHtml("#123"))&&!/class="jig-ghost"/.test(c.buildJigHtml("#123")));
  w.tick(w.now()+c.JIG_SHOW_MS);
  ok("then \"What is it?\" — said, 3 different words, the card's own among them",st.phase==="ask"&&w.said[w.said.length-1]==="What is it?"&&st.choices.length===3&&new Set(st.choices).size===3&&st.choices.indexOf(st.word)>=0);
  ok("…the other words come from its own deck first",st.choices.every(x=>["cat","dog","cow"].indexOf(x)>=0)||st.word==="pig");
  h=c.buildJigHtml("#123");
  ok("the question: the whole picture stays, 3 word buttons, the word itself not shown above them",/class="jig-whole"/.test(h)&&(h.match(/class="jig-ch" onclick="jigTap\(\d\)"/g)||[]).length===3&&!/class="jig-word">[a-z]/.test(h));
  const wi=st.choices.findIndex(x=>x!==st.word);
  c.jigTap(wi);
  ok("a wrong word: the bonk, it greys out (can't be tapped again), the question stays",w.dings[w.dings.length-1]==="bonk"&&st.phase==="ask"&&new RegExp('class="jig-ch jig-no" onclick="jigTap\\('+wi+'\\)" disabled').test(c.buildJigHtml("#123"))&&c.jigJudge(st,wi)===null);
  const wi2=st.choices.findIndex((x,k)=>x!==st.word&&k!==wi); c.jigTap(wi2);
  ok("two wrong → the card's miss (fail), still his tap to make",st.turns[0].fail===true&&st.phase==="ask");
  c.jigTap(rightIx(st));
  const p=w.writes.filter(x=>x[0]==="push");
  ok("the right word: ding, said again, done",st.phase==="done"&&w.dings[w.dings.length-1]==="ding"&&w.said[w.said.length-1]===st.word);
  ok("logged once through gameLogRound: game jigsaw, the card's deck, one item (the card: ok false, n 3, fail), level 1, not clean",p.length===1&&p[0][1]==="mastery/gameLog/k/20261108"&&p[0][2].game==="jigsaw"&&p[0][2].deck===st.deck&&p[0][2].level===1&&p[0][2].clean===false&&JSON.stringify(p[0][2].items)===JSON.stringify([{id:st.pid,ok:false,n:3,fail:true}]));
  ok("nothing else is written",w.writes.length===1);
  h=c.buildJigHtml("#123");
  ok("the finish: the word, one Play again",new RegExp('🎉 '+st.word+'!').test(h)&&(h.match(/Play again/g)||[]).length===1&&/onclick="jigStart\(\)"/.test(h));
  c.jigStart();
  ok("Play again: a new round with a different picture",c.jigState!==st&&c.jigState.pid!==st.pid&&c.jigState.phase==="play");
}
// clean round, Next button, logging edge cases
{ const w=world(DECK()), c=w.c;
  c.jigStart(); const st=build(w);
  ok("Next skips the wait",st.phase==="show"&&(c.jigNext(),st.phase==="ask"));
  c.jigTap(rightIx(st));
  const e=w.writes[0][2];
  ok("named on the first tap: ok true, n 1, the round is clean",e.clean===true&&JSON.stringify(e.items)===JSON.stringify([{id:st.pid,ok:true,n:1}]));
  w.flushAll(); ok("the old show timer does nothing after Next",st.phase==="done"&&w.writes.length===1);
  const d=world(DECK(),{dry:true}); d.c.jigStart(); const sd=build(d); d.c.jigNext(); d.c.jigTap(rightIx(sd));
  ok("?dryrun=1: nothing written (this device keeps its copy)",d.writes.length===0&&Object.keys(d.c.masteryData.gameLog.k["20261108"]).length===1);
  const part=world(DECK()); part.c.jigStart(); const sp=part.c.jigState, T=part.c.jigTiles(4,1); part.c.jigDrop(sp.tray[0],T[sp.tray[0]].x,T[sp.tray[0]].y); part.c.jigStart();
  ok("a round dropped part-way writes nothing",part.writes.length===0);
  const lone=world([C("cat")]); lone.c.jigStart(); const sl=build(lone); lone.flushAll();
  ok("only one word anywhere: no question to ask — the whole picture, then the finish; nothing to log",sl.phase==="done"&&lone.writes.length===0&&/Play again/.test(lone.c.buildJigHtml("#000")));
  const two=world([C("cat"),C("dog",{imageUrl:"",subject:"Farm"})]); two.c.jigStart();
  ok("words come from the kid's other decks when its own deck is short (a word card with no picture is fine)",JSON.stringify(two.c.jigState.choices.slice().sort())==='["cat","dog"]');
  ok("the question never repeats a word (case, markup ignored)",(()=>{ const c2=world([]).c, ch=c2.jigChoices(C("Cat"),[C("cat"),C("<b>CAT</b>"),C("dog"),C("Dog"),C("cow")]); return ch.length===3&&new Set(ch.map(x=>x.toLowerCase())).size===3; })());
}
// which card
{ const c=world([]).c, pool=[C("cat",{tier:"weekly"}),C("dog",{status:"introduction",tier:"weekly"}),C("cow",{tier:"monthly"})];
  let seen={}; for(let s=1;s<=20;s++){ const cc=world([],{seed:s}).c; seen[cc.jigPick(pool,null).prompt]=1; }
  ok("a learning card first (introduced, or at the daily tier)",Object.keys(seen).join()==="dog");
  ok("never the last one played when there's another",(()=>{ const p2=[C("a"),C("b")]; for(let s=1;s<=20;s++){ if(world([],{seed:s}).c.jigPick(p2,p2[0].id)!==p2[1]) return false; } return true; })());
  ok("no learning card → any picture card",["cat","cow"].indexOf(c.jigPick([C("cat",{tier:"weekly"}),C("cow",{tier:"monthly"})],null).prompt)>=0&&c.jigPick([],null)===null);
}
// level 2 / 3 screens
{ const w=world(DECK(),{settings:{gameRules:{jigsaw:{pieces:"6"}}}}), c=w.c;
  c.jigStart(); const st=c.jigState, h=c.buildJigHtml("#000");
  ok("pinned at 6: 6 pieces, no faint outline in the frame",st.n===6&&st.level===2&&!/class="jig-ghost"/.test(h)&&!/class="jig-cell"/.test(h)&&(h.match(/jigDown\(event/g)||[]).length===6&&/width:calc\(var\(--jig-s\) \/ 3\);height:calc\(var\(--jig-s\) \/ 2\)/.test(h));
  c.gameRuleSet("k","jigsaw","pieces","9"); c.jigStart();
  ok("pinned at 9: 9 pieces",c.jigState.n===9&&c.jigState.level===3);
}
// the level-up rule + Mom's pin
{ const c=world([]).c, R=(lv,cl,at)=>({game:"jigsaw",level:lv,clean:cl,at:at});
  ok("pure: no rounds → level 1; two clean in a row → 2; then → 3; never past 3",c.jigLevelFrom([])===1&&c.jigLevelFrom([R(1,true,1),R(1,true,2)])===2&&c.jigLevelFrom([R(1,true,1),R(1,true,2),R(2,true,3),R(2,true,4)])===3&&c.jigLevelFrom([R(1,true,1),R(1,true,2),R(2,true,3),R(2,true,4),R(3,true,5),R(3,true,6)])===3);
  ok("pure: clean, not clean, clean → still 1; another game's rounds don't count",c.jigLevelFrom([R(1,true,1),R(1,false,2),R(1,true,3)])===1&&world([],{log:{k:{"20261107":{"-a":{game:"train",level:1,clean:true,at:1},"-b":{game:"train",level:1,clean:true,at:2}}}}}).c.jigLevel("k")===1);
  const w=world(DECK()), cc=w.c, play=()=>{ cc.jigStart(); const st=build(w); cc.jigNext(); cc.jigTap(rightIx(st)); return st; };
  play(); ok("one clean round: still 4 pieces",cc.jigLevel("k")===1);
  const s2=play(); ok("two clean in a row: 6 pieces next time, and the finish says so",cc.jigLevel("k")===2&&s2.levelAfter===2&&/6 pieces next time/.test(cc.buildJigHtml("#000")));
  cc.jigStart(); ok("the next round: 6 pieces",cc.jigState.n===6);
  const lg={k:{"20261107":{"-a":R(1,true,5),"local_5":R(1,true,5),"-b":R(1,true,6)}}};
  ok("this device's copy + the pushed copy of one round count once",world(DECK(),{log:lg}).c.jigLevel("k")===2&&world(DECK(),{log:{k:{"20261107":{"-a":R(1,true,5),"local_5":R(1,true,5)}}}}).c.jigLevel("k")===1);
  const m=world(DECK());
  ok("GAME_RULES.jigsaw: one rule \"pieces\" — auto / 4 / 6 / 9, default auto",JSON.stringify(m.c.GAME_RULES.jigsaw.map(r=>[r.key,r.def,r.opts.map(o=>o[0])]))==='[["pieces","auto",["auto","4","6","9"]]]');
  ok("the rules pop-up lists it",/How many pieces\?/.test(m.c.gameRulesHtml("k","jigsaw"))&&/9 pieces/.test(m.c.gameRulesHtml("k","jigsaw")));
  ok("Mom pins 9 → 9 pieces from the first round (one targeted set)",m.c.gameRuleSet("k","jigsaw","pieces","9")===true&&m.c.jigLevel("k")===3&&JSON.stringify(m.writes)==='[["set","mastery/k_settings/gameRules/jigsaw/pieces","9"]]');
  const pin=world(DECK(),{log:lg,settings:{gameRules:{jigsaw:{pieces:"4"}}}});
  ok("pinned at 4: stays at 4 after two clean rounds; back to auto → the rounds count",pin.c.jigLevel("k")===1&&pin.c.gameRuleSet("k","jigsaw","pieces","auto")&&pin.c.jigLevel("k")===2);
  const kid=world(DECK(),{mom:false});
  ok("a kid can't pin it; a value that isn't an option is ignored",kid.c.gameRuleSet("k","jigsaw","pieces","9")===false&&kid.writes.length===0&&world(DECK(),{settings:{gameRules:{jigsaw:{pieces:"12"}}}}).c.jigLevel("k")===1);
}
// park / resume (🎲 GAMEKIT)
{ const w=world(DECK()), c=w.c;
  c.jigStart(); const st=build(w); const n0=w.said.length;
  const parked=c.jigPark(); c.jigState=null; w.flushAll();
  ok("parked during the whole-picture moment: its timer does nothing",parked===st&&st.phase==="show"&&w.said.length===n0);
  c.jigState=parked; c.jigResume();
  ok("back to that kid: straight to the question",st.phase==="ask");
  const w2=world(DECK()), c2=w2.c; c2.jigStart(); const s2=c2.jigState; c2.jigTapPiece(s2.tray[0]); c2.jigPark(); c2.jigResume();
  ok("parked holding a piece: on resume it's put down, nothing placed",s2.sel===null&&!Object.keys(s2.placed).length&&s2.phase==="play");
}
// tap to place
{ const w=world(DECK()), c=w.c;
  c.jigStart(); const st=c.jigState, i=st.tray[0], T=c.jigTiles(4,1), t=T[i];
  c.jigTapPiece(i); ok("a tap picks a piece (it lights up), again puts it down",st.sel===i&&/jig-tp jig-sel/.test(c.buildJigHtml("#000"))&&/Now tap where it goes/.test(c.buildJigHtml("#000"))&&(c.jigTapPiece(i),st.sel===null));
  const frame={getBoundingClientRect:()=>({left:100,top:50,width:206,height:206}),clientLeft:3,clientTop:3,clientWidth:200,clientHeight:200};
  const wrong=T.find(o=>o.i!==i);
  c.jigTapPiece(i); c.jigFrameTap({currentTarget:frame,clientX:103+wrong.x*200+20,clientY:53+wrong.y*200+20});
  ok("…a tap on the wrong square: back to the tray",!st.placed[i]&&st.bounce===i&&st.sel===null);
  c.jigTapPiece(i); c.jigFrameTap({currentTarget:frame,clientX:103+t.x*200+70,clientY:53+t.y*200+90});
  ok("…a tap anywhere on its own square: it goes in",st.placed[i]===1);
  c.jigFrameTap({currentTarget:frame,clientX:110,clientY:60}); ok("a frame tap with no piece picked does nothing",Object.keys(st.placed).length===1);
}
// the drag itself, with a fake page
{ const w=world(DECK()), c=w.c;
  c.jigStart(); const st=c.jigState, i=st.tray[0], t=c.jigTiles(4,1)[i];
  const frame={getBoundingClientRect:()=>({left:100,top:50,width:206,height:206}),clientLeft:3,clientTop:3,clientWidth:200,clientHeight:200};
  const L={}, cls=new Set(); let el; el={style:{},classList:{add:x=>cls.add(x),remove:x=>cls.delete(x)},addEventListener(n,f){ L[n]=f; },removeEventListener(n){ delete L[n]; },setPointerCapture(){},releasePointerCapture(){},
    getBoundingClientRect:()=>{ const m=/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/.exec(el.style.transform||""); return {left:120+(m?+m[1]:0),top:400+(m?+m[2]:0),width:100,height:100}; }};
  c.document={getElementById:id=>id==="jig-frame"?frame:null};
  c.jigDown({clientX:150,clientY:430,pointerId:1,button:0,currentTarget:el},i);
  ok("drag: pointer events on the piece (move / up / cancel)",typeof L.pointermove==="function"&&typeof L.pointerup==="function"&&typeof L.pointercancel==="function");
  const gx=103+t.x*200+6-120, gy=53+t.y*200-5-400;   // its corner a few px off its own place
  L.pointermove({clientX:150+gx,clientY:430+gy});
  ok("…it follows the finger",cls.has("jig-drag")&&/translate/.test(el.style.transform));
  L.pointerup({type:"pointerup",clientX:150+gx,clientY:430+gy});
  ok("…let go near its place (measured against the frame's inside) → it snaps in",st.placed[i]===1&&el.style.transform===""&&!cls.has("jig-drag"));
  const j=st.tray[1], L2={}; const el2={style:{},classList:{add(){},remove(){}},addEventListener(n,f){ L2[n]=f; },removeEventListener(n){ delete L2[n]; },setPointerCapture(){},releasePointerCapture(){},getBoundingClientRect:()=>({left:120,top:400,width:100,height:100})};
  c.jigDown({clientX:150,clientY:430,pointerId:2,button:0,currentTarget:el2},j); L2.pointermove({clientX:190,clientY:470}); L2.pointercancel({type:"pointercancel",clientX:190,clientY:470});
  ok("a cancelled drag (the browser took the touch) → back to the tray",!st.placed[j]&&st.bounce===j);
  c.jigDown({clientX:150,clientY:430,pointerId:3,button:0,currentTarget:el2},j); L2.pointerup({type:"pointerup",clientX:151,clientY:431});
  ok("a press that barely moves is a tap: it picks the piece",st.sel===j);
}
// the picture URL is safe in the page
{ const w=world([C("cat",{imageUrl:'https://x.example/a"b\\c&d.jpg'}),C("dog")]); w.c._jigRandom=()=>0; w.c.jigStart();
  const h=w.c.buildJigHtml("#000");
  ok("a picture URL with a quote, a backslash or & can't break out of the page's markup",w.c.jigState.word==="cat"&&h.indexOf('--jig-img:url(&quot;https://x.example/a%22b%5Cc&amp;d.jpg&quot;)')>=0&&h.indexOf('a"b')<0);
}
{ let err=null; try{ const w=world(DECK(),{noVoice:true}); w.c.jigStart(); build(w); w.flushAll(); w.c.jigTap(rightIx(w.c.jigState)); }catch(e){ err=e; }
  ok("no voice on the device: no crash",err===null);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
