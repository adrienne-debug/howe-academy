/*
 * 👆 "Which one?" (her yes 2026-10-23; PLAN_practice_games_2026-10-23.md build #2).
 * The app SAYS a card's name (never written), three big pictures, tap the one you heard. Wrong greys that tile,
 * bonks, says it again; right dings, grows, next. Round of 8 (6 for small decks); missed cards come back once.
 * Personal best under "<deck> · which" only; "Save to Scores" pushes game:"which". Never touches the ladder.
 *   run:  node test_which_one.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// WHICHONE_START"), b=src.indexOf("// WHICHONE_END");
ok("WHICHONE block exists",a>0&&b>a);
const blk=src.slice(a,b);

const PICS={Animals:["cat","dog","cow","pig","hen","owl","fox","bee","ant","elk"],Shapes:["circle","square","star","heart"]};
function deckItems(){
  const out=[];
  PICS.Animals.forEach((p,i)=>out.push({id:"a"+i,subject:"Animals",prompt:p,emoji:"E"+i,status:i%2?"active":"introduction"}));
  PICS.Shapes.forEach((p,i)=>out.push({id:"s"+i,subject:"Shapes",prompt:p,emoji:"S"+i,status:"active"}));
  out.push({id:"w1",subject:"Words",prompt:"the",status:"active"});               // no picture
  out.push({id:"w2",subject:"Words",prompt:"and",status:"active"});
  out.push({id:"t1",subject:"Tiny",prompt:"sun",emoji:"T1",status:"active"});      // only 2 picture cards
  out.push({id:"t2",subject:"Tiny",prompt:"moon",emoji:"T2",status:"active"});
  out.push({id:"t3",subject:"Tiny",prompt:"Sun",emoji:"T3",status:"active"});      // same name as t1 → not a 3rd card
  out.push({id:"p1",subject:"Animals",prompt:"Katze",emoji:"P",status:"active",dir:"prod"});  // 🇬🇧→🇩🇪 twin
  out.push({id:"g1",subject:"Animals",prompt:"yak",emoji:"G",status:"graduated"});
  return out;
}
function sandbox(o){
  o=o||{};
  const L={timers:[],spoken:[],dbWrites:[],celebrated:[],re:0,dings:0,bonks:0};
  const ctx={
    console, Math, Object, Array, String, JSON,
    Date, setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    mastView:"which", masteryKid:"julian",
    masteryData:{julian:o.items||deckItems(),julian_settings:o.settings||{}},
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    mastSpeak:t=>L.spoken.push(t),
    matchDing:()=>L.dings++, matchBonk:()=>L.bonks++,
    _mastRe:()=>{ L.re++; },
    _dryRun:()=>false,
    db:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v]),push:v=>L.dbWrites.push([p,"push",v])})},
    HA_LS:{setItem(){}},
    bbAudioUnlock:()=>{ L.unlocked=(L.unlocked||0)+1; },
    document:{getElementById:id=>id==="celeb-overlay"?{}:null},
    _showCelebration:(k,t,op)=>L.celebrated.push([k,t,op]),
  };
  vm.createContext(ctx);
  vm.runInContext(blk+"\n;this.__st=()=>whichState;this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx.L=L; return ctx;
}
const flush=c=>{ const t=c.L.timers.splice(0); t.forEach(x=>x.f()); };
const itemOf=(c,id)=>c.masteryData.julian.find(x=>x.id===id);

console.log("deck eligibility");
{
  const c=sandbox();
  const d=c.whichDecks(c.masteryData.julian);
  ok("decks with ≥3 different picture cards are listed",JSON.stringify(d)===JSON.stringify(["Animals","Shapes"]),d);
  ok("a deck with no pictures is not listed",d.indexOf("Words")<0);
  ok("two cards + a same-name twin don't make 3",d.indexOf("Tiny")<0);
  const pool=c.whichPool(c.masteryData.julian,"Animals");
  ok("pool skips 🇬🇧→🇩🇪 twins and graduated cards",!pool.some(x=>x.id==="p1"||x.id==="g1")&&pool.length===10,pool.length);
  const h=c.buildWhichHtml("#c2410c");
  ok("picker shows each deck and Mix the decks",h.indexOf("whichStart('Animals')")>=0&&h.indexOf("whichStart('Shapes')")>=0&&h.indexOf("Mix the decks")>=0);
  ok("no Tiny / Words chip",h.indexOf("Tiny")<0&&h.indexOf("whichStart('Words')")<0);
  const c2=sandbox({items:[{id:"x",subject:"A",prompt:"cat",emoji:"x",status:"active"}]});
  ok("no eligible deck → a plain note",c2.buildWhichHtml("#000").indexOf("3 or more cards with a picture")>=0);
}

console.log("a turn: three tiles, one right, distractors from the same deck");
{
  const c=sandbox();
  const items=c.masteryData.julian, pool=c.whichPool(items,c.WHICH_MIX);
  let good=true;
  for(let k=0;k<200;k++){
    const it=items[k%10];
    const t=c.whichTiles(it,pool);
    const names=t.map(id=>itemOf(c,id).prompt.toLowerCase());
    if(t.length!==3||new Set(t).size!==3||new Set(names).size!==3||t.filter(id=>id===it.id).length!==1||!t.every(id=>itemOf(c,id).subject===it.subject)) { good=false; break; }
  }
  ok("200 turns: 3 distinct tiles, two different names, exactly one right, all same deck",good);
  const sh=c.masteryData.julian.find(x=>x.id==="s0");
  const st=c.whichTiles(sh,pool);
  ok("a Shapes card never pulls an Animals picture",st.every(id=>itemOf(c,id).subject==="Shapes"));
  const order=new Set(); for(let k=0;k<60;k++) order.add(c.whichTiles(sh,pool).indexOf("s0"));
  ok("the right tile moves around (shuffled per turn)",order.size===3,[...order]);
  ok("a deck that can't make 3 → null",c.whichTiles(items.find(x=>x.id==="t1"),c.whichPool(items,c.WHICH_MIX))===null);
}

console.log("the name is spoken, not rendered");
{
  const c=sandbox();
  c.whichStart("Animals");
  const st=c.__st(), it=itemOf(c,st.turns[0].pid);
  ok("starting unlocks audio inside the tap",c.L.unlocked===1);
  ok("the first card's name is said",c.L.spoken[0]===it.prompt,c.L.spoken);
  const h=c.buildWhichHtml("#c2410c");
  const names=PICS.Animals.filter(p=>new RegExp(">\\s*"+p+"\\s*<|\\b"+p+"\\b","i").test(h.replace(/<style>[\s\S]*?<\/style>/,"")));
  ok("no card name appears on screen",names.length===0,names);
  ok("three big tiles + a 🔊 again button",(h.match(/class="which-tile/g)||[]).length===3&&h.indexOf("whichSayAgain()")>=0);
  c.whichSayAgain();
  ok("🔊 says it again",c.L.spoken.length===2&&c.L.spoken[1]===it.prompt);
}

console.log("wrong tap greys out and re-speaks; right tap finishes the turn");
{
  const c=sandbox();
  c.whichStart("Animals");
  const st=c.__st(), t=st.turns[0];
  const wrongIx=t.tiles.findIndex(id=>id!==t.pid), rightIx=t.tiles.indexOf(t.pid);
  const said=c.L.spoken.length;
  c.whichTap(wrongIx);
  ok("wrong → soft bonk",c.L.bonks===1&&c.L.dings===0);
  ok("wrong → the word is said again",c.L.spoken.length===said+1&&c.L.spoken[said]===itemOf(c,t.pid).prompt);
  ok("wrong tile is greyed",/which-tile which-wrong/.test(c.buildWhichHtml("#000")));
  ok("turn not over after a wrong tap",st.i===0&&!t.done);
  c.whichTap(wrongIx);
  ok("a greyed tile does nothing",c.L.bonks===1);
  c.whichTap(rightIx);
  ok("right → soft ding, the picture grows",c.L.dings===1&&st.grow===rightIx&&/which-grow/.test(c.buildWhichHtml("#000")));
  ok("taps are locked during the beat",(c.whichTap(rightIx),c.L.dings===1));
  ok("missed card doesn't count as first-tap",st.first===0&&t.first===false);
  flush(c);
  ok("next turn after the beat, its name said",st.i===1&&c.L.spoken[c.L.spoken.length-1]===itemOf(c,st.turns[1].pid).prompt);
}

console.log("round size, missed cards return once, first-tap count, finish");
{
  const c=sandbox();
  c.whichStart("Animals");
  const st=c.__st();
  ok("10-card deck → 8 turns",st.turns.length===8&&st.of===8,st.turns.length);
  ok("8 different cards (every card once before repeats)",new Set(st.turns.map(x=>x.pid)).size===8);
  // miss turns 0 and 3, everything else first tap
  for(let k=0;k<8;k++){
    const t=st.turns[st.i];
    if(k===0||k===3){ c.whichTap(t.tiles.findIndex(id=>id!==t.pid)); c.whichTap(t.tiles.findIndex(id=>id!==t.pid&&!t.wrong[id])); }
    c.whichTap(t.tiles.indexOf(t.pid)); flush(c);
  }
  ok("two missed cards came back at the end",st.turns.length===10&&st.turns[8].back&&st.turns[9].back&&st.turns[8].pid===st.turns[0].pid&&st.turns[9].pid===st.turns[3].pid);
  // the returning cards: miss one again — it must NOT come back a second time
  let t=st.turns[st.i]; c.whichTap(t.tiles.findIndex(id=>id!==t.pid)); c.whichTap(t.tiles.indexOf(t.pid)); flush(c);
  t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c);
  ok("a card comes back only once",st.turns.length===10);
  ok("round finished",st.phase==="done");
  ok("6 on the first tap of 8",st.first===6&&st.of===8,[st.first,st.of]);
  const h=c.buildWhichHtml("#c2410c");
  ok("finish shows 'N on the first tap' + found pictures",h.indexOf("6 on the first tap")>=0&&(h.match(/class="memoji"/g)||[]).length===8);
  ok("finish has Play again / Mix the decks / Save to Scores",h.indexOf("Play again")>=0&&h.indexOf("whichStart('Mix the decks')")>=0&&h.indexOf("whichLogResult()")>=0);
  ok("not a clean round → no confetti",c.L.celebrated.length===0);
  ok("best saved under '<deck> · which' only",c.L.dbWrites.length===1&&c.L.dbWrites[0][0]==="mastery/julian_settings/match_best"&&c.L.dbWrites[0][1]==="update"&&JSON.stringify(Object.keys(c.L.dbWrites[0][2]))===JSON.stringify(["Animals \u00B7 which"])&&c.L.dbWrites[0][2]["Animals \u00B7 which"]===6,c.L.dbWrites);
  c.whichLogResult();
  const w=c.L.dbWrites[1];
  ok("Save to Scores pushes game:'which' to matchLog",w&&w[0]==="mastery/matchLog/julian"&&w[1]==="push"&&w[2].game==="which"&&w[2].first===6&&w[2].of===8&&w[2].deck==="Animals"&&w[2].ts>0&&/^\d{4}-\d\d-\d\d$/.test(w[2].date),w);
  c.whichLogResult();
  ok("Save to Scores only once per round",c.L.dbWrites.length===2);
  // Play again: a worse round doesn't overwrite the best
  c.whichStart("Animals");
  const s2=c.__st();
  for(let k=0;k<8;k++){ const t2=s2.turns[s2.i]; c.whichTap(t2.tiles.findIndex(id=>id!==t2.pid)); c.whichTap(t2.tiles.indexOf(t2.pid)); flush(c); }
  while(s2.phase==="play"){ const t2=s2.turns[s2.i]; c.whichTap(t2.tiles.indexOf(t2.pid)); flush(c); }
  ok("a lower round keeps the old best (no write)",c.L.dbWrites.length===2&&c.masteryData.julian_settings.match_best["Animals \u00B7 which"]===6);
}

console.log("small deck, clean round, mix");
{
  const c=sandbox();
  c.whichStart("Shapes");
  const st=c.__st();
  ok("4-card deck → 6 turns",st.turns.length===6,st.turns.length);
  ok("never the same card twice in a row",st.turns.every((x,i)=>!i||x.pid!==st.turns[i-1].pid));
  while(st.phase==="play"){ const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c); }
  ok("clean round → small confetti, no song",c.L.celebrated.length===1&&c.L.celebrated[0][2].noSong===true);
  ok("clean round: 6 of 6",st.first===6&&st.of===6);
  const m=sandbox();
  m.whichStart(m.WHICH_MIX);
  const ms=m.__st();
  ok("Mix: 8 turns across decks",ms.turns.length===8&&ms.mix);
  ok("Mix: every turn's tiles come from that card's own deck",ms.turns.every(t=>t.tiles.every(id=>itemOf(m,id).subject===itemOf(m,t.pid).subject)));
  ok("Mix best key is 'Mix the decks · which'",m.whichBestKey(m.WHICH_MIX)==="Mix the decks \u00B7 which");
}

console.log("dry run + no ladder");
{
  const c=sandbox(); c._dryRun=()=>true;
  c.whichStart("Shapes"); const st=c.__st();
  while(st.phase==="play"){ const t=st.turns[st.i]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c); }
  c.whichLogResult();
  ok("?dryrun=1 writes nothing to Firebase",c.L.dbWrites.length===0);
  ok("no ladder calls in the block",!/mastApplyScores|next_due|mastSaveSession|\.set\(/.test(blk));
  ok("only match_best and matchLog paths are written",(blk.match(/db\.ref\(([^)]*)\)/g)||[]).every(r=>/match_best|matchLog/.test(r)));
  ok("no 🔀 emoji",blk.indexOf("\u{1F500}")<0&&blk.indexOf("1F500")<0);
}

console.log("hooks");
{
  ok("Which one? is a game in the 🎮 Games list (GAMESTAB)",/key:"which",[^\n]*view:"which"[^\n]*render:c=>buildWhichHtml\(c\)/.test(src));
  ok("renderMastery dispatches games through gamesBodyHtml",/if\(gamesActive\(\)\)\{[^\n]*\n\s*h\+=gamesBodyHtml\(color\);/.test(src));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
