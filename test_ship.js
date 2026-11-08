/*
 * 🚢 Battleship (her word 2026-11-03: "Battleship/map pin"; PLAN_practice_games_2026-10-23.md Tier 4). The deck's pictures sit on a
 * sea grid with coordinates for the whole round. Find turns: the app SAYS a name, tap the picture. Name turns: a tile lights, say it,
 * 🗣. Misses back once. Picture / symbol decks only — answer decks are hidden through decks(). gameLogRound (game "ship");
 * match_best "<deck> · ship" only when beaten; never the ladder. Runs the REAL code with timers by hand.
 *   run:  node test_ship.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// SHIP_START"), b=src.indexOf("// SHIP_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one SHIP block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// SHIP_START",a+1)<0&&src.indexOf("// SHIP_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push/g,"")));
ok("GAMES_LIST: Battleship right after Connect Four, with park / restore / resume and decks for the grid",/resume:\(\)=>fourResume\(\), decks:k=>typeof fourDecks==="function"\?fourDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"ship",\s*emoji:"\\u\{1F6A2\}", label:"Battleship",\s*view:"ship",\s*available:k=>typeof shipDecks==="function"&&shipDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildShipHtml\(c\),\n\s*park:\(\)=>shipState, restore:v=>\{ shipState=v\|\|null; \}, resume:\(\)=>shipResume\(\), decks:k=>typeof shipDecks==="function"\?shipDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/ship/i.test(fnText("gamesCurrentKey"))&&!/shipState|shipResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, clock, luck or opponent fleet; the start tap unlocks audio; the honor tap is documented; the block says why it is the picture-grid form",!/lives|hearts|leaderboard|setInterval|points|bankDirect/i.test(code)&&/bbAudioUnlock\(\)/.test(blk)&&/honor system/.test(blk)&&/NO deck carries either today/.test(blk));
ok("a find's name is SAID, never written in the message",/Fire at\\u2026 \(listen!\)/.test(blk)&&!/Fire at\\u2026 "\+shipName/.test(blk));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + SHIP ──
const P=(n,emoji)=>({id:"p_"+n,subject:"NC Snakes",prompt:n,emoji:emoji,status:"active",tier:"weekly"});
const L=(n)=>({id:"l_"+n,subject:"Letters",prompt:n,status:"active",tier:"weekly"});
const M=(f,ans)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:"weekly"});
const SNAKES=[P("copperhead","🐍"),P("rat snake","🐉"),P("garter","🪱"),P("king snake","👑"),P("corn snake","🌽"),P("water snake","💧"),P("hognose","🐽")];
const LETTERS=["b","d","p","q","m","n"].map(L);
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10"),M("8+3","11"),M("2+7","9")];
const FEW=[P("a","🅰️"),P("b","🅱️"),P("c","©️")].map(x=>Object.assign(x,{subject:"Few"}));
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// SHIP_START","// SHIP_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:(it,noGlyph)=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':(it&&!noGlyph&&String(it.prompt||"").length<=3&&it.subject==="Letters"?'<span class="glyph">'+it.prompt+'</span>':null)),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    mstTodayKey:()=>"20261103",mastView:"ship",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'shipState',{get:()=>shipState,set:v=>{shipState=v;}}); Object.defineProperty(this,'_shipRandom',{get:()=>_shipRandom,set:v=>{_shipRandom=v;}}); this.SHIP_MAX=SHIP_MAX; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._shipRandom=seeded(o.seed||3);
  const flush=()=>{ let g=0; while(timers.length&&g++<50){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const nameOf=(c,pid)=>c.masteryData.k.find(x=>x.id===pid).prompt;
function right(w){ const c=w.c, st=c.shipState, t=st.turns[st.i]; if(t.act==="find") c.shipTap(st.grid.indexOf(t.pid)); else c.shipSaid(); }

{ const w=world(SNAKES.concat(LETTERS,MATH,FEW)), c=w.c;
  ok("decks: picture (snakes) and symbol (letters) decks can be a map; an answer deck (math) and a 3-card deck cannot",JSON.stringify(c.shipDecks(c.masteryData.k))==="[\"Letters\",\"NC Snakes\"]");
  ok("the grid entry hides itself: decks() lists no answer deck, so the grid shows '–' there and the game is never offered on it",c.shipDecks(MATH.concat(FEW),"k").length===0&&/No decks ready/.test(world(MATH).c.buildShipHtml("#000")));
  ok("shape: up to 9 tiles → 3 across; 10–12 → 4 across; coordinates read A1 … C3 / A1 … C4",JSON.stringify(c.shipShape(7))==="{\"cols\":3,\"rows\":3}"&&JSON.stringify(c.shipShape(12))==="{\"cols\":4,\"rows\":3}"&&c.shipCoord(0,3)==="A1"&&c.shipCoord(4,3)==="B2"&&c.shipCoord(11,4)==="C4");
  const off=world(SNAKES,{settings:{gameDecks:{"NC Snakes":{ship:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Battleship is not offered; the preload (asked raw) still lists it; off for Which one? only, it plays",off.c.shipDecks(off.c.masteryData.k).length===0&&off.c.gameDeckCan("k",{key:"ship",decks:k=>off.c.shipDecks(off.c.masteryData.k,k)}).indexOf("NC Snakes")>=0&&(()=>{ const w2=world(SNAKES,{settings:{gameDecks:{"NC Snakes":{which:false}}}}); return w2.c.shipDecks(w2.c.masteryData.k).length===1; })());
}
{ const w=world(SNAKES), c=w.c;
  c.shipStart("NC Snakes"); const st=c.shipState;
  ok("a round: 7 tiles on a 3-across sea, 7 turns (find / name alternating), every tile once, the first ask said inside the tap",st&&st.phase==="play"&&st.grid.length===7&&st.cols===3&&st.turns.length===7&&new Set(st.turns.map(t=>t.pid)).size===7&&st.turns[0].act==="find"&&st.turns[1].act==="name"&&w.said.length===1&&st.game==="ship"&&st.kid==="k");
  const t0=st.turns[0], h0=c.buildShipHtml("#000");
  ok("a find: 'Fire at the <name>!' is SAID; the message and the sea never write the name; every tile shows its coordinate and picture",w.said[0]==="Fire at the "+nameOf(c,t0.pid)+"!"&&!/listen!\)[^<]*copperhead|>copperhead</.test(h0)&&h0.indexOf("Fire at")>0&&(h0.match(/class="ship-tile/g)||[]).length===7&&h0.indexOf(">A1<")>0&&h0.indexOf(">C1<")>0);
  const wrongGi=st.grid.findIndex(p=>p!==t0.pid); c.shipTap(wrongGi);
  ok("a wrong tile: splash, the bonk, said again, that tile greys out, the turn stays open",w.dings.slice(-1)[0]==="bonk"&&/Splash/.test(st.msg)&&w.said.length===2&&t0.wrong[st.grid[wrongGi]]===1&&!t0.done&&/ship-wrong/.test(c.buildShipHtml("#000")));
  c.shipTap(wrongGi); ok("a greyed tile can't be tapped again",Object.keys(t0.wrong).length===1);
  c.shipTap(st.grid.indexOf(t0.pid));
  ok("the right tile: 💥 Hit!, the ding, sunk, not first, the card queued to come back once as a find",t0.done&&!t0.first&&st.first===0&&st.sunk[t0.pid]===1&&w.dings.slice(-1)[0]==="ding"&&st.turns.length===8&&st.turns[7].back&&st.turns[7].act==="find"&&/ship-sunk/.test(c.buildShipHtml("#000")));
  w.flush(); const t1=st.turns[1];
  ok("a name turn: 'What's at B2?' with the tile lit and the 🗣 button; no find tap works now",st.i===1&&/What\u2019s at [A-C][1-3]\?/.test(st.msg)&&/ship-lit/.test(c.buildShipHtml("#000"))&&/I said it/.test(c.buildShipHtml("#000"))&&(c.shipTap(st.grid.indexOf(t1.pid)),!t1.done));
  c.shipSaid();
  ok("🗣 I said it → the app SAYS the name back, Hit!, first-shot count 1",t1.done&&t1.first&&st.first===1&&w.said.slice(-1)[0]===nameOf(c,t1.pid)+". Hit!"&&st.sunk[t1.pid]===1);
  w.flush();
  ok("a sunk tile can't be fired at on a later find (only the asked one)",(()=>{ const t=st.turns[st.i]; if(t.act!=="find") return true; const sunkOther=st.grid.findIndex(p=>st.sunk[p]&&p!==t.pid); c.shipTap(sunkOther); return !t.done&&!t.wrong[st.grid[sunkOther]]; })());
  let guard=0; while(st.phase==="play"&&guard++<20){ right(w); w.flush(); }
  ok("the round ends after the come-back: 6 of 7 on the first shot; the come-back counts for nothing",st.phase==="done"&&st.first===6&&st.of===7&&st.turns.length===8);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key 'NC Snakes · ship' = 6; ONE gameLog push, game ship, 8 items (1 back); nothing else",mb.length===1&&JSON.stringify(mb[0][2])==="{\"NC Snakes · ship\":6}"&&gl.length===1&&gl[0][2].game==="ship"&&gl[0][2].items.length===8&&gl[0][2].items.filter(i=>i.back).length===1&&w.writes.length===2);
  ok("the finish: '6 of 7 on the first shot — new best', Play again",/6 of 7 on the first shot/.test(c.buildShipHtml("#000"))&&/new best/.test(c.buildShipHtml("#000"))&&/Play again/.test(c.buildShipHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x)));
}
{ const w=world(LETTERS,{celeb:true}), c=w.c;
  c.shipStart("Letters"); const st=c.shipState;
  ok("a symbol deck: the glyphs are the fleet (6 tiles, 3 across)",st.grid.length===6&&st.cols===3&&/glyph/.test(c.buildShipHtml("#000")));
  let guard=0; while(st.phase==="play"&&guard++<20){ right(w); w.flush(); }
  ok("a clean round: 6 of 6, the small confetti with the overlay present",st.first===6&&w.dings.some(x=>x==="celeb:\u{1F6A2} You sank them all!"));
  c.shipStart("Letters"); const st2=c.shipState; guard=0; while(st2.phase==="play"&&guard++<20){ right(w); w.flush(); }
  ok("a best not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===1&&st2.isPB===false);
}
{ const w=world(SNAKES.concat(LETTERS),{dry:true}), c=w.c;
  c.shipStart(c.WHICH_MIX); const st=c.shipState;
  ok("Mix the decks: up to 12 tiles from both decks, 4 across",st.mix&&st.grid.length===12&&st.cols===4&&new Set(st.grid.map(p=>c.masteryData.k.find(x=>x.id===p).subject)).size===2);
  let guard=0; while(st.phase==="play"&&guard++<30){ right(w); w.flush(); }
  ok("?dryrun=1: the round plays, nothing is written",st.phase==="done"&&w.writes.length===0);
  c.shipStart("NC Snakes"); c.shipChangeDeck(); ok("Change deck drops the round: nothing written",c.shipState===null&&w.writes.length===0);
}
{ const w=world(SNAKES), c=w.c;
  c.shipStart("NC Snakes"); const st=c.shipState; right(w);   // Hit!, the beat pending
  const parked=st; c.shipState=null; w.flush();
  ok("a parked round's beat does nothing",parked.lock&&parked.i===0);
  c.shipState=parked; c.shipResume();
  ok("resume settles the beat: the next ask, said",!parked.lock&&parked.i===1&&w.said.length===3);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
