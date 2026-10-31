/*
 * 🎮 GAMELOG — games save each card's result (slice 1 of DESIGN_missed_card_games_2026-10-31.md; her "Start slice 1",
 * 2026-10-31). Every FINISHED Which one? round appends {game:"which", deck, at, secs, items:[{id, ok, n, back?}]} to
 * mastery/gameLog/<kid>/<yyyymmdd> by itself (no "Save to Scores" tap). Never the ladder, never history, never studyLog.
 * A round dropped mid-way writes nothing. Dry run writes nothing. The round's own kid.
 *   run:  node test_game_log.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// WHICHONE_START"), m=src.indexOf("// WHICHONE_END"), g=src.indexOf("// GAMELOG_START"), b=src.indexOf("// GAMELOG_END");
ok("GAMELOG block sits right after WHICHONE",a>0&&m>a&&g>m&&b>g&&src.slice(m,g).trim()==="// WHICHONE_END");
const blk=src.slice(a,b);
const gl=src.slice(g,b);
ok("the round remembers its start (t0)",/whichState=\{kid:masteryKid,deck:deck,mix:mix,t0:Date\.now\(\),/.test(blk));
ok("one guarded hook in whichFinish",/function whichFinish\(st\)\{\n  st\.phase="done";\n  const kid=st\.kid\|\|masteryKid;   \/\/ GAMEKID\n  try\{ if\(typeof gameLogRound==="function"\) gameLogRound\(st\); \}catch\(e\)\{\}/.test(blk));
ok("the hook is called exactly once in the file",(src.match(/gameLogRound\(st\); \}catch/g)||[]).length===1);
ok("block writes only mastery/gameLog, by push",/db\.ref\("mastery\/gameLog\/"\+kid\+"\/"\+day\)\.push\(e\)/.test(gl)&&!/\.set\(|\.update\(|\.remove\(|transaction\(/.test(gl));
ok("block never names studyLog/history paths in a write",!/ref\([^)]*(studyLog|history)/.test(gl));
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew/i.test(gl));

const ANIMALS=["cat","dog","cow","pig","hen","owl","fox","bee","ant","elk"];
function deckItems(){ return ANIMALS.map((p,i)=>({id:"a"+i,subject:"Animals",prompt:p,emoji:"E"+i,status:"active",tier:"weekly",next_due:10})); }
function sandbox(o){
  o=o||{};
  const L={timers:[],dbWrites:[],re:0};
  const ctx={
    console, Math, Object, Array, String, JSON,
    Date:o.Date||Date, setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    mastView:"which", masteryKid:o.kid||"julian",
    masteryData:{julian:deckItems(),julian_settings:{},caleb:deckItems(),caleb_settings:{}},
    _smTileVis:it=>(it&&it.emoji?'<span>'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(),
    esc:s=>String(s||""),
    mastSpeak:()=>{}, matchDing:()=>{}, matchBonk:()=>{}, _mastRe:()=>{ L.re++; },
    _dryRun:()=>!!o.dry,
    db:o.noDb?null:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v]),push:v=>L.dbWrites.push([p,"push",v])})},
    HA_LS:{setItem(){}},
    bbAudioUnlock:()=>{},
    document:{getElementById:()=>null},
    _showCelebration:()=>{},
  };
  if(o.todayKey) ctx.mstTodayKey=()=>o.todayKey;
  vm.createContext(ctx);
  vm.runInContext(blk+"\n;this.__st=()=>whichState;",ctx);
  ctx.L=L; return ctx;
}
const flush=c=>{ let guard=0; while(c.L.timers.length&&guard++<100){ const t=c.L.timers.splice(0); t.forEach(x=>x.f()); } };
// play the whole round; wrongOn = set of pids that get one wrong tap first (only on their first showing)
function play(c,wrongOn){
  wrongOn=wrongOn||{}; const done={};
  let guard=0;
  while(c.__st()&&c.__st().phase==="play"&&guard++<60){
    const st=c.__st(), t=st.turns[st.i];
    if(wrongOn[t.pid]&&!done[t.pid]){ done[t.pid]=1; c.whichTap(t.tiles.findIndex(p=>p!==t.pid)); }
    c.whichTap(t.tiles.indexOf(t.pid)); flush(c);
  }
}
const pushes=c=>c.L.dbWrites.filter(w=>w[1]==="push"&&/^mastery\/gameLog\//.test(w[0]));

console.log("a clean round");
{
  const c=sandbox({todayKey:"20261031"});
  const before=JSON.stringify(c.masteryData.julian);
  c.whichStart("Animals"); play(c);
  const P=pushes(c);
  ok("one entry pushed when the round finishes",P.length===1,P.length);
  ok("path = mastery/gameLog/<kid>/<day key>",P[0]&&P[0][0]==="mastery/gameLog/julian/20261031",P[0]&&P[0][0]);
  const e=P[0]&&P[0][2];
  ok("entry names the game and the deck",e&&e.game==="which"&&e.deck==="Animals");
  ok("one item per card played (8)",e&&e.items.length===8,e&&e.items.length);
  ok("every card right on the first tap: ok true, n 1",e&&e.items.every(x=>x.ok===true&&x.n===1&&!x.back));
  ok("items carry the card ids",e&&e.items.every(x=>/^a\d$/.test(x.id)));
  ok("seconds and time are recorded",e&&typeof e.secs==="number"&&e.secs>=0&&typeof e.at==="number");
  ok("the cards (ladder) are untouched",JSON.stringify(c.masteryData.julian)===before);
  ok("only gameLog + the existing best score were written",c.L.dbWrites.every(w=>/^mastery\/gameLog\//.test(w[0])||w[0]==="mastery/julian_settings/match_best"),c.L.dbWrites.map(w=>w[0]));
  ok("this device keeps a local copy",Object.keys(((c.masteryData.gameLog||{}).julian||{})["20261031"]||{}).length===1);
}

console.log("a missed card");
{
  const c=sandbox({todayKey:"20261031"});
  c.whichStart("Animals");
  const first=c.__st().turns[0].pid;
  play(c,{[first]:1});
  const e=(pushes(c)[0]||[])[2]||{items:[]};
  const its=e.items.filter(x=>x.id===first);
  ok("the missed card is logged ok:false, n:2",its[0]&&its[0].ok===false&&its[0].n===2,its);
  ok("its come-back turn is logged with back:true",its.length===2&&its[1].back===true&&its[1].ok===true&&its[1].n===1,its);
  ok("the other cards stay ok:true",e.items.filter(x=>x.id!==first).every(x=>x.ok));
}

console.log("nothing written when it shouldn't be");
{
  const c=sandbox({dry:true,todayKey:"20261031"});
  c.whichStart("Animals"); play(c);
  ok("dry run: no database write at all",c.L.dbWrites.length===0,c.L.dbWrites);
  ok("dry run: the local copy still shows the round",Object.keys(((c.masteryData.gameLog||{}).julian||{})["20261031"]||{}).length===1);
}
{
  const c=sandbox({noDb:true});
  c.whichStart("Animals"); let threw=false; try{ play(c); }catch(e){ threw=true; }
  ok("no database handle: the round still finishes, no error",!threw&&c.__st().phase==="done");
}
{
  const c=sandbox();
  c.whichStart("Animals");
  const t=c.__st().turns[0]; c.whichTap(t.tiles.indexOf(t.pid)); flush(c);
  c.whichChangeDeck();
  ok("a round dropped mid-way (Change deck) writes nothing",c.L.dbWrites.length===0&&!c.masteryData.gameLog);
}
{
  const c=sandbox({todayKey:"20261031"});
  c.whichStart("Animals"); play(c);
  c.whichFinish(c.__st());
  ok("finishing twice still saves once",pushes(c).length===1,pushes(c).length);
}

console.log("the round's own kid");
{
  const c=sandbox({todayKey:"20261031"});
  c.whichStart("Animals");
  c.masteryKid="caleb";   // the screen moved to another kid; the round belongs to julian
  play(c);
  const P=pushes(c);
  ok("saved under the round's kid, not the kid on screen",P.length===1&&P[0][0]==="mastery/gameLog/julian/20261031",P.map(x=>x[0]));
}

console.log("pure entry");
{
  const c=sandbox();
  ok("an unfinished round → null",c.gameLogEntry({phase:"play",turns:[{pid:"a1",done:true,first:true,wrong:{}}]})===null);
  ok("a finished round with no played turns → null",c.gameLogEntry({phase:"done",turns:[]})===null);
  const e=c.gameLogEntry({phase:"done",deck:"Shapes",t0:1000,turns:[{pid:"s1",done:true,first:false,wrong:{x:1,y:1}},{pid:"s2",done:false,first:false,wrong:{}}]},11000);
  ok("taps = wrong taps + 1; unplayed turns left out; secs from t0",e&&e.items.length===1&&e.items[0].n===3&&e.items[0].ok===false&&e.secs===10,e);
  ok("day key falls back to today's UTC date like the drill",/^\d{8}$/.test(c.gameLogDay()));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
