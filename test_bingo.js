/*
 * 🎱 Bingo — a board of the kid's own pictures, the app says a name, the kid taps it (her yes "I think options for both",
 * 2026-11-02; PLAN_practice_games_2026-10-23.md Tier 1 Picture Bingo). 9+ cards → 3×3, 4–8 → 2×2, small decks pool into the
 * Mix. Every tile is called once; the first line = BINGO; misses come back once after the board is full. Runs the REAL code.
 *   run:  node test_bingo.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=src.indexOf("// BINGO_START"), b=src.indexOf("// BINGO_END"), sp=src.indexOf("// SPELLBUILD_END");
const gt=src.indexOf("// GAMESTAB_START");
ok("exactly one BINGO block, after SPELLBUILD_END, before GAMESTAB_START (the games built alongside it may sit between)",sp>0&&a>sp&&b>a&&gt>b&&src.indexOf("// BINGO_START",a+1)<0&&src.indexOf("// BINGO_END",b+1)<0);
const blk=src.slice(a,b);
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no \u{1F500} in the block",blk.indexOf("\u{1F500}")<0);
ok("the called name is never written on screen (tiles / finish never print a prompt)",!/esc\(.*prompt|E\(.*prompt|\+it\.prompt\+|\+t\.prompt/.test(blk)&&/aria-label="Picture '\+\(ci\+1\)/.test(blk));
ok("writes: match_best one key (guarded) + gameLogRound only — no set / remove / push / studyLog / next_due",/if\(db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&!/\.set\(|\.remove\(|\.push\(\{|studyLog|next_due|matchLog/.test(blk.replace(/st\.turns\.push\(/g,"").replace(/L\.push\(|row\.push\(|col\.push\(|d1\.push\(|d2\.push\(/g,"")));
ok("the round's own kid is used at the finish and for speech, never masteryKid alone",/const kid=st\.kid\|\|masteryKid;/.test(fnText("bingoFinish"))&&/_bingoItems\(st\.kid\)/.test(fnText("_bingoSay")));
ok("the start tap unlocks audio; sounds are the shared ding / bonk; speech is mastSpeak",/bbAudioUnlock\(\)/.test(fnText("bingoStart"))&&/matchDing\(\)/.test(fnText("bingoTap"))&&/matchBonk\(\)/.test(fnText("bingoTap"))&&/mastSpeak\(_matchPlain\(it\.prompt\)\)/.test(fnText("_bingoSay")));
ok("confetti only through _showCelebration with noSong, guarded by celeb-overlay",/document\.getElementById\("celeb-overlay"\)\) _showCelebration\(st\.kid,"\\u\{1F3B1\} BINGO!",\{noSong:true\}\)/.test(blk));
const li=src.indexOf('{key:"idflash",'), lb=src.indexOf('{key:"bingo",'), ls=src.indexOf('{key:"spell",');
ok("GAMES_LIST: the bingo line sits right after idflash (before spell)",li>0&&lb>li&&ls>lb&&src.slice(li,lb).split("\n").length===2);
ok("the entry has the final shape (view bingo, cheap guarded available, park / restore / resume, decks for the grid)",/\{key:"bingo",\s*emoji:"\\u\{1F3B1\}", label:"Bingo",\s*view:"bingo",\s*available:k=>typeof bingoDecks==="function"&&Object\.keys\(bingoDecks\(_gamesItems\(k\),k\)\)\.length>0, render:c=>buildBingoHtml\(c\), park:\(\)=>bingoState, restore:v=>\{ bingoState=v\|\|null; \}, resume:\(\)=>bingoResume\(\), decks:k=>typeof bingoDeckList==="function"\?bingoDeckList\(_gamesItems\(k\),k\):\[\]\}/.test(src));
ok("gamesCurrentKey / GAMEKID were not edited for it (the entry carries everything)",!/bingo/.test(fnText("gamesCurrentKey"))&&!/bingo/i.test(cut("// GAMEKID_START","// GAMEKID_END")));

// ── a sandbox: WHICHONE (the cards) + GAMELOG + BINGO, a kid's cards, a recording db ──
const P=(deck,name,emoji,extra)=>Object.assign({id:deck.slice(0,2).toLowerCase()+"_"+name,subject:deck,prompt:name,emoji:emoji,status:"active"},extra||{});
const ANIMALS=["cat","dog","cow","pig","hen","owl","fox","bee","ant","elk","yak","emu"].map((n,i)=>P("Animals",n,"\u{1F400}"+i));
const FRUIT=["apple","pear","plum","kiwi","fig"].map((n,i)=>P("Fruit",n,"\u{1F34E}"+i));
const MATH=[["2+2","4"],["3+3","6"],["4+4","8"],["5+5","10"],["6+6","12"],["7+7","14"],["8+8","16"],["9+9","18"],["1+1","2"]].map(x=>({id:"m_"+x[0],subject:"Math Facts",prompt:x[0],answer:x[1],status:"active"}));
const SPELL=["red","blue","green","black"].map(w=>({id:"s_"+w,subject:"Spelling",prompt:w,emoji:"\u{1F58D}",status:"active"}));
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], cel=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// BINGO_START","// BINGO_END")+(o.grid?"\n"+cut("// GAMEGRID_START","// GAMEGRID_END"):"");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    document:{getElementById:id=>id==="celeb-overlay"?(o.noOverlay?null:{}):null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},
    mastSpeak:(t,op)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t,op)=>cel.push([k,t,op]),
    mstTodayKey:()=>"20261102",mastView:"bingo",masteryKid:"k",
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    _smTileVis:(it,noGlyph)=>!it?null:it.emoji?'<span class="memoji">'+it.emoji+'</span>':(!noGlyph&&(it.prompt||"").length<=3?'<span>'+it.prompt+'</span>':null),
    mastGetCatMode:(kid,d)=>/spell/i.test(d)?"spell":"",
    masteryData:{k:items||[],k_settings:o.settings||{}},momHere:()=>true,renderAll(){},cap:s=>s,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'bingoState',{get:()=>bingoState,set:v=>{bingoState=v;}}); this.BINGO_MIX=BINGO_MIX; this.__raw=()=>(typeof _gdRaw!==\"undefined\")?_gdRaw:null;",ctx);
  return {c:ctx,writes,said,dings,cel};
}
const cellOf=(st,pid)=>st.board.indexOf(pid);
const settle=c=>{ const st=c.bingoState; if(st&&st.lock) c.bingoNext(st); };
// play the current call right (optionally after one wrong tap on another unmarked tile)
function play(c,wrongFirst){
  const st=c.bingoState, t=st.turns[st.i];
  if(wrongFirst){ const other=st.board.find(p=>p!==t.pid&&!st.marked[p]); c.bingoTap(cellOf(st,other)); }
  c.bingoTap(cellOf(st,t.pid)); settle(c);
}

console.log("── the board (pure) ──");
{
  const {c}=world();
  ok("bingoSize: 3 cards → no board, 4–8 → 2×2, 9+ → 3×3",c.bingoSize(3)===0&&c.bingoSize(4)===2&&c.bingoSize(8)===2&&c.bingoSize(9)===3&&c.bingoSize(20)===3);
  const L3=c.bingoLines(3), L2=c.bingoLines(2);
  ok("a 3×3 has 8 lines of 3 (rows, columns, two diagonals)",L3.length===8&&L3.every(l=>l.length===3)&&JSON.stringify(L3).indexOf("[0,4,8]")>=0&&JSON.stringify(L3).indexOf("[2,4,6]")>=0);
  ok("a 2×2 has 6 lines of 2",L2.length===6&&L2.every(l=>l.length===2));
  const board=["a","b","c","d","e","f","g","h","i"];
  ok("no line yet with 6 scattered stamps",c.bingoLineDone(board,{a:1,b:1,d:1,f:1,h:1,i:1},3)===null);
  ok("the middle column completes a line",JSON.stringify(c.bingoLineDone(board,{b:1,e:1,h:1},3))==="[1,4,7]");
}
console.log("── which decks play (pure) ──");
{
  const {c}=world(ANIMALS.concat(FRUIT,MATH,SPELL));
  const d=c.bingoDecks(c.masteryData.k,"k");
  ok("12 animals → a 3×3 deck; 5 fruit → a small 2×2 deck",d.Animals===3&&d.Fruit===2);
  ok("math facts (answer mode) and spelling never play",!d["Math Facts"]&&!d.Spelling);
  ok("the Mix pools both picture decks (17 names → 3×3)",d[c.BINGO_MIX]===3);
  const d1=c.bingoDecks(FRUIT,"k");
  ok("one small deck alone: a small board, no Mix",d1.Fruit===2&&!d1[c.BINGO_MIX]&&Object.keys(d1).length===1);
  const d2=c.bingoDecks(FRUIT.slice(0,3),"k");
  ok("3 pictures → nothing to play",Object.keys(d2).length===0);
  const two=FRUIT.slice(0,3).concat(["sun","moon","star"].map((n,i)=>P("Sky",n,"\u2600"+i)));
  const d3=c.bingoDecks(two,"k");
  ok("two 3-card picture decks: neither alone, but the Mix makes a small board (her 'options for both')",!d3.Fruit&&!d3.Sky&&d3[c.BINGO_MIX]===2);
  const dup=FRUIT.concat(["apple","pear","plum","kiwi"].map((n,i)=>P("Foods",n,"\u{1F37D}"+i)));
  ok("the Mix counts one picture per NAME across decks (5 fruit + 4 same-named foods = 5, not 9)",c.bingoDecks(dup,"k")[c.BINGO_MIX]===2);
  const intro=ANIMALS.map(x=>Object.assign({},x,{status:"introduction"}));
  ok("introduction cards play; a retired card does not",c.bingoDecks(intro,"k").Animals===3&&!c.bingoDecks(ANIMALS.map(x=>Object.assign({},x,{status:"retired"})),"k").Animals);
  const glyphs=["a","b","c","d","e","f","g","h","i"].map(n=>({id:"L_"+n,subject:"Letters",prompt:n,status:"active"}));
  ok("a Letters deck (the written glyph is the picture) plays too — letter bingo",c.bingoDecks(glyphs,"k").Letters===3);
}
console.log("── a clean 3×3 round ──");
{
  const {c,writes,said,dings,cel}=world(ANIMALS);
  c.bingoStart("Animals");
  const st=c.bingoState;
  ok("a round: 9 different tiles from the deck, one call per tile, the first name said inside the tap",st&&st.size===3&&st.board.length===9&&new Set(st.board).size===9&&st.turns.length===9&&st.turns.every(t=>st.board.indexOf(t.pid)>=0)&&said.length===1&&st.game==="bingo"&&st.kid==="k");
  ok("the said word is the card's name, which is NOT on the board html",said[0]===ANIMALS.find(x=>x.id===st.turns[0].pid).prompt&&c.buildBingoHtml("#000").indexOf(">"+said[0]+"<")<0);
  let lineAt=null;
  for(let n=0;n<9;n++){ const t=st.turns[st.i]; play(c); if(lineAt===null&&st.bingo) lineAt=n+1; }
  ok("every tile right on the first tap → stamped, 9 dings, no bonk",Object.keys(st.marked).length===0||st.phase==="done",{marked:Object.keys(st.marked).length,phase:st.phase});
  ok("the round finished after the 9 calls (nothing came back)",st.phase==="done"&&st.turns.length===9&&st.first===9&&st.of===9&&dings.filter(x=>x==="ding").length===9&&dings.indexOf("bonk")<0);
  ok("the first line came between the 3rd and 7th call and got ONE confetti (noSong, the round's kid)",lineAt>=3&&lineAt<=7&&cel.length===1&&cel[0][0]==="k"&&cel[0][2].noSong===true&&/BINGO/.test(cel[0][1]));
  const up=writes.find(w=>w[0]==="update"), lg=writes.find(w=>w[0]==="push");
  ok("new best: ONE targeted update on <kid>_settings/match_best, key 'Animals · bingo' (the log is pushed first, like Which one?)",writes.length===2&&writes[0][0]==="push"&&up&&up[1]==="mastery/k_settings/match_best"&&JSON.stringify(up[2])===JSON.stringify({"Animals \u00B7 bingo":9})&&st.isPB===true);
  ok("the game log: one push to mastery/gameLog/<kid>/<day>, game 'bingo', 9 items all ok",lg[0]==="push"&&lg[1]==="mastery/gameLog/k/20261102"&&lg[2].game==="bingo"&&lg[2].deck==="Animals"&&lg[2].items.length===9&&lg[2].items.every(i=>i.ok&&i.n===1&&!i.back));
  const h=c.buildBingoHtml("#000");
  ok("finish screen: the pictures, '9 of 9 on the first tap — new best', Play again; no card names",/9 of 9 on the first tap/.test(h)&&/new best/.test(h)&&/Play again/.test(h)&&!ANIMALS.some(x=>new RegExp(">"+x.prompt+"<").test(h)));
}
console.log("── misses: grey, bonk, say again, come back once after the board is full ──");
{
  const {c,writes,said,dings,cel}=world(ANIMALS);
  c.bingoStart("Animals");
  const st=c.bingoState, t0=st.turns[0], other=st.board.find(p=>p!==t0.pid);
  c.bingoTap(cellOf(st,other));
  ok("a wrong tap: that tile is greyed for this call, a bonk, the name said again, nothing stamped",t0.wrong[other]===1&&dings[dings.length-1]==="bonk"&&said.length===2&&!st.marked[other]&&!st.lock);
  const n1=dings.length; c.bingoTap(cellOf(st,other));
  ok("tapping the greyed tile again does nothing",dings.length===n1&&Object.keys(t0.wrong).length===1);
  ok("the board shows that tile greyed",/bingo-cell bingo-wrong/.test(c.buildBingoHtml("#000")));
  c.bingoTap(cellOf(st,t0.pid));
  ok("then the right tile: stamped, ding, counted as a miss, and that card is queued to come back once",st.marked[t0.pid]===1&&t0.done&&t0.first===false&&st.first===0&&st.turns.length===10&&st.turns[9].pid===t0.pid&&st.turns[9].back===true&&st.lock===true);
  const n2=dings.length; c.bingoTap(cellOf(st,st.board.find(p=>!st.marked[p])));
  ok("taps while the stamp settles are ignored",dings.length===n2);
  settle(c);
  ok("next call, the stamp stays",st.i===1&&st.marked[t0.pid]===1&&!st.lock);
  const n3=dings.length; c.bingoTap(cellOf(st,t0.pid));
  ok("a stamped tile is not a tap (no bonk, no miss)",dings.length===n3&&Object.keys(st.turns[1].wrong).length===0);
  // one more miss on call 2, the rest clean
  play(c,true); const t1=st.turns[1];
  for(let n=2;n<9;n++) play(c);
  ok("after the 9th call the board was full; the comeback begins: stamps cleared, only the 2 missed cards called",st.phase==="play"&&st.i===9&&st.clearup===true&&Object.keys(st.marked).length===0&&st.line===null&&st.turns.length===11&&st.turns.slice(9).every(t=>t.back)&&[t0.pid,t1.pid].sort().join()===st.turns.slice(9).map(t=>t.pid).sort().join());
  ok("the comeback screen says 'One more time'",/One more time/.test(c.buildBingoHtml("#000")));
  const celN=cel.length;
  play(c); play(c);
  ok("found both → the round ends; no second confetti",st.phase==="done"&&cel.length===celN&&cel.length===1);
  ok("first-tap count 7 of 9; best saved as 7",st.first===7&&st.of===9&&writes.find(w=>w[0]==="update")[2]["Animals \u00B7 bingo"]===7);
  const items=writes.find(w=>w[0]==="push")[2].items;
  ok("the log has 11 items: 7 ok, 2 misses with n=2, 2 comeback turns marked back",items.length===11&&items.filter(i=>i.ok&&!i.back).length===7&&items.filter(i=>!i.ok&&i.n===2&&!i.back).length===2&&items.filter(i=>i.back).length===2);
  ok("a comeback card found on the first tap never adds to the first-tap count",st.first===7);
}
console.log("── the best, the dry run, the kid ──");
{
  const {c,writes}=world(ANIMALS,{settings:{match_best:{"Animals \u00B7 bingo":9}}});
  c.bingoStart("Animals"); const st=c.bingoState;
  play(c,true); for(let n=1;n<9;n++) play(c); play(c);
  ok("a round that doesn't beat the best writes no best (the log still goes)",st.phase==="done"&&st.isPB===false&&st.prevBest===9&&writes.length===1&&writes[0][0]==="push");
  const w2=world(ANIMALS,{dry:true}); w2.c.bingoStart("Animals"); for(let n=0;n<9;n++) play(w2.c);
  ok("?dryrun=1: nothing written (best and log stay in memory)",w2.c.bingoState.phase==="done"&&w2.writes.length===0&&w2.c.masteryData.k_settings.match_best["Animals \u00B7 bingo"]===9&&w2.c.masteryData.gameLog.k["20261102"]);
  const w3=world(ANIMALS); w3.c.bingoStart("Animals"); w3.c.masteryKid="other";   // the kid switched mid-round (GAMEKID parks; here just the global)
  for(let n=0;n<9;n++) play(w3.c);
  ok("the finish saves to the round's OWN kid, not the kid picked now",w3.writes.find(w=>w[0]==="update")[1]==="mastery/k_settings/match_best"&&w3.writes.find(w=>w[0]==="push")[1]==="mastery/gameLog/k/20261102");
  const w4=world(ANIMALS,{noOverlay:true}); w4.c.bingoStart("Animals"); for(let n=0;n<9;n++) play(w4.c);
  ok("no celeb-overlay on the page → no confetti call, round still fine",w4.cel.length===0&&w4.c.bingoState.phase==="done");
}
console.log("── a small 2×2 board, the Mix, Change deck ──");
{
  const {c,said,cel}=world(FRUIT);
  c.bingoStart("Fruit"); const st=c.bingoState;
  ok("5 fruit → a 2×2 board of 4, 4 calls",st.size===2&&st.board.length===4&&st.turns.length===4&&/bingo-2/.test(c.buildBingoHtml("#000"))&&/repeat\(2,1fr\)/.test(c.buildBingoHtml("#000")));
  play(c); play(c);
  ok("on a 2×2 the second stamp is always a line → BINGO",st.bingo===true&&cel.length===1);
  play(c); play(c);
  ok("four calls → done, 4 of 4",st.phase==="done"&&st.first===4&&st.of===4);
  const w=world(ANIMALS.concat(FRUIT));
  w.c.bingoStart(w.c.BINGO_MIX); const m=w.c.bingoState;
  ok("the Mix: a 3×3 drawn from both decks",m.size===3&&m.mix===true&&m.deck===w.c.BINGO_MIX&&m.board.length===9);
  w.c.bingoChangeDeck();
  ok("Change deck drops the round: nothing written",w.c.bingoState===null&&w.writes.length===0);
  ok("the deck chips: both decks, the small one marked, and the Mix",(()=>{ const h=w.c.buildBingoHtml("#000"); return /Animals/.test(h)&&/Fruit.*small/.test(h)&&/Mix the decks/.test(h); })());
  w.c.bingoStart("Spelling");
  ok("a deck that isn't a Bingo deck starts nothing",w.c.bingoState===null);
  const e=world(FRUIT.slice(0,3));
  ok("no deck ready → the empty note, no chips",/No decks ready for Bingo/.test(e.c.buildBingoHtml("#000")));
}
console.log("── 🎮 the games-per-deck grid: Bingo's own column ──");
{
  const {c}=world(ANIMALS.concat(FRUIT),{grid:true,settings:{gameDecks:{Animals:{which:false}}}});
  const d=c.bingoDecks(c.masteryData.k,"k");
  ok("a deck turned off for Which one? still plays Bingo (its own column, not Which one?'s)",d.Animals===3&&d.Fruit===2&&d[c.BINGO_MIX]===3);
  ok("…and Which one? itself does hide it",c.whichDecks(c.masteryData.k,"k").indexOf("Animals")<0);
  const w=world(ANIMALS.concat(FRUIT),{grid:true,settings:{gameDecks:{Animals:{bingo:false}}}});
  const d2=w.c.bingoDecks(w.c.masteryData.k,"k");
  ok("a deck turned off for Bingo is gone from its chips, and out of the Mix (5 fruit left → a small Mix is not offered: one deck)",!d2.Animals&&d2.Fruit===2&&!d2[w.c.BINGO_MIX]);
  w.c.bingoStart("Animals");
  ok("…and cannot be started",w.c.bingoState===null);
  ok("the grid's preload (gameDeckCan → decks(), asked raw) still lists it, so Mom can turn it back on",w.c.gameDeckCan("k",{key:"bingo",decks:k=>w.c.bingoDeckList(w.c.masteryData.k,k)}).join(",")==="Animals,Fruit");
  ok("_gdRaw is put back as it was after the pool is read",w.c.__raw()===false&&(w.c.bingoPool(w.c.masteryData.k,"k"),w.c.__raw()===false));
  const n=world(ANIMALS,{grid:true});
  ok("nothing stored → every deck on (today byte for byte)",n.c.bingoDecks(n.c.masteryData.k,"k").Animals===3&&n.c.bingoDeckOn("k","Animals")===true);
}
console.log("── resume (GAMEKID → GAMEKIT) ──");
{
  const {c,said}=world(ANIMALS);
  c.bingoStart("Animals"); const st=c.bingoState, t=st.turns[0];
  c.bingoTap(cellOf(st,t.pid));
  ok("mid-step: locked on the stamp",st.lock===true&&st.i===0);
  const n=said.length; c.bingoResume();
  ok("resume settles the stamp, moves to the next call and says it",st.lock===false&&st.i===1&&said.length===n+1);
  c.bingoResume();
  ok("resume with nothing mid-step just says the card again",st.i===1&&said.length===n+2);
  c.mastView="which"; c.bingoResume();
  ok("not on screen → no speech",said.length===n+2);
  // a stale timer never advances a settled turn (the guard in bingoTap)
  const w=world(ANIMALS); let fired=null; w.c.setTimeout=(fn)=>{ fired=fn; return 0; };
  w.c.bingoStart("Animals"); const s2=w.c.bingoState; w.c.bingoTap(cellOf(s2,s2.turns[0].pid)); w.c.bingoResume(); const i2=s2.i; fired();
  ok("the old timer after a resume does nothing",s2.i===i2);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
