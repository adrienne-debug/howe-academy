/*
 * 🎲 GAMEKIT (2026-11-02) — so four new games can be built at once without touching shared code: a GAMES_LIST entry may
 * carry park() / restore(v) / resume(), and gamesCurrentKey reads a game's view off its entry. A new game = its own block
 * + ONE GAMES_LIST line. Build it is the worked example. Runs the REAL GAMEKID + GAMESTAB code.
 *   run:  node test_games_kit.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
ok("gamesCurrentKey reads a game's view off GAMES_LIST (no per-game line needed)",/const g=GAMES_LIST\.find\(x=>x&&!x\.style&&x\.view===mastView\);/.test(fnText("gamesCurrentKey")));
ok("GAMEKID parks / restores / resumes through _gkEntries, each call guarded",/gx\[g\.key\]=g\.park\(\)/.test(fnText("gameKidSwitch"))&&/g\.restore\(\(p&&p\.games&&p\.games\[g\.key\]\)\|\|null\)/.test(fnText("gameKidSwitch"))&&/g\.resume\(\)/.test(fnText("_gkResume")));
ok("no game is named in GAMEKID any more except Match / Which one? (the two that live there)",!/spell|bingo|sort|fish|dump/i.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("Build it's entry carries the three fields",/park:\(\)=>spellState, restore:v=>\{ spellState=v\|\|null; \}, resume:\(\)=>spellResume\(\)/.test(src));

// ── a sandbox: GAMEKID + GAMESTAB, a fake new game added to GAMES_LIST ──
function world(){
  const log=[];
  const ctx={console,JSON,Object,Array,String,Number,Math,Date,Set,setInterval:()=>1,clearInterval(){},
    window:{_matchTick:null},speechSynthesis:{cancel(){}},
    masteryKid:"k1",masteryData:{k1:[{id:"a",subject:"Letters"}],k2:[{id:"b",subject:"Letters"}]},
    matchState:null,matchStyle:"match",matchPairMode:"two",whichState:null,sprintDeck:"__all__",sprintDeckScope:null,mastView:"games",
    whichFinish(){},_whichSay(){},_matchElapsed:()=>0,document:{getElementById:()=>null},
    buildMatchHtml:()=>"",buildWhichHtml:()=>"",whichDecks:()=>[],envFlashAvail:()=>false,envFlashGameHtml:()=>"",spellPool:()=>[],buildSpellHtml:()=>"",spellResume(){},
    mastMatchDecks:()=>[],mastSetView(){},_mastRe(){},mastScoreItemId:null,mastManualScore:false,mastMatchSetStyle(){},
    log};
  vm.createContext(ctx);
  vm.runInContext(cut("// GAMEKID_START","// GAMEKID_END")+"\n"+cut("// GAMESTAB_START","// GAMESTAB_END")+
    "\nlet spellState=null; var bingoState=null; var fishState=null;"+
    "\nGAMES_LIST.push({key:'bingo',emoji:'🎱',label:'Bingo',view:'bingo',available:()=>true,render:()=>'',park:()=>bingoState,restore:v=>{ bingoState=v||null; },resume:()=>{ log.push('resume:'+(bingoState&&bingoState.id)); }});"+
    "\nGAMES_LIST.push({key:'fish',emoji:'🐟',label:'Go Fish',view:'fish',available:()=>true,render:()=>'',park:()=>{ throw new Error('boom'); },restore:v=>{ fishState=v||null; }});"+
    "\nthis.__bingo=v=>{ if(v!==undefined) bingoState=v; return bingoState; }; this.__fish=()=>fishState; this.__spell=v=>{ if(v!==undefined) spellState=v; return spellState; }; this.__park=()=>_gkPark;",ctx);
  return ctx;
}
console.log("── gamesCurrentKey knows a new game by its entry ──");
{
  const c=world();
  c.mastView="bingo"; ok("mastView 'bingo' → key 'bingo'",c.gamesCurrentKey()==="bingo"&&c.gamesActive()===true);
  c.mastView="fish"; ok("mastView 'fish' → key 'fish'",c.gamesCurrentKey()==="fish");
  c.mastView="spell"; ok("Build it still 'spell'",c.gamesCurrentKey()==="spell");
  c.mastView="drill"; ok("a non-game view → null",c.gamesCurrentKey()===null&&c.gamesActive()===false);
  c.mastView="games"; ok("the bare section → ''",c.gamesCurrentKey()==="");
}
console.log("── GAMEKID parks / restores / resumes a new game's round per kid ──");
{
  const c=world();
  c.gameKidSwitch("k1");   // first sight
  c.__bingo({id:"round-k1",phase:"play"});
  c.gameKidSwitch("k2");
  ok("switching away parks k1's Bingo round and clears the global",c.__bingo()===null&&c.__park().k1.games.bingo.id==="round-k1");
  ok("a park() that throws never breaks the switch (Go Fish parked as nothing)",c.__park().k1.games.fish===undefined&&c.__fish()===null);
  c.__bingo({id:"round-k2",phase:"play"});
  c.gameKidSwitch("k1");
  ok("switching back restores k1's round and resumes it",c.__bingo()&&c.__bingo().id==="round-k1"&&c.log[c.log.length-1]==="resume:round-k1");
  ok("k2's round is parked meanwhile",c.__park().k2.games.bingo.id==="round-k2");
  c.gameKidSwitch("k3");
  ok("a kid with nothing parked gets null, resume sees null",c.__bingo()===null&&c.log[c.log.length-1]==="resume:null");
}
console.log("── Build it rides the same path ──");
{
  const c=world();
  c.gameKidSwitch("k1"); c.__spell({phase:"play",turns:[],i:0});
  c.gameKidSwitch("k2");
  ok("Build it parked under games.spell, global cleared",c.__spell()===null&&c.__park().k1.games.spell&&c.__park().k1.games.spell.phase==="play");
  c.gameKidSwitch("k1");
  ok("and restored",c.__spell()&&c.__spell().phase==="play");
}
console.log("── Match and Which one? untouched ──");
{
  const c=world();
  c.gameKidSwitch("k1"); c.whichState={phase:"done"}; c.matchStyle="memory";
  c.gameKidSwitch("k2");
  ok("Which one? parked by name as before; Match style parked",c.whichState===null&&c.__park().k1.which.phase==="done"&&c.__park().k1.style==="memory");
  c.gameKidSwitch("k1");
  ok("and back",c.whichState&&c.whichState.phase==="done"&&c.matchStyle==="memory");
}
console.log("── without GAMESTAB (a sandbox that only has GAMEKID) nothing breaks ──");
{
  const ctx={console,Object,Array,Date,window:{},speechSynthesis:{cancel(){}},masteryKid:"k1",masteryData:{k1:[]},matchState:null,matchStyle:"match",matchPairMode:"two",whichState:null,sprintDeck:"__all__",sprintDeckScope:null,mastView:"drill",setInterval:()=>1,clearInterval(){},document:{getElementById:()=>null}};
  vm.createContext(ctx); vm.runInContext(cut("// GAMEKID_START","// GAMEKID_END"),ctx);
  let err=null; try{ ctx.gameKidSwitch("k1"); ctx.gameKidSwitch("k2"); }catch(e){ err=String(e); }
  ok("GAMES_LIST undefined → no entries, no error",err===null&&ctx._gkEntries().length===0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
