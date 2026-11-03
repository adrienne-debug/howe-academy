/*
 * 🎮 GAMEGRID — games per deck (her words 2026-11-02): a per-kid grid in Mastery HQ (rows = decks, columns = games), preloaded from each
 * game's own rule; Mom turns a game off / on per deck; stored as overrides only; every game's deck list, the Games tab and the practice
 * round read it through gameDeckOn. Runs the REAL code.
 *   run:  node test_game_grid.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
ok("GAMEGRID block sits right after GAMESTAB_END",(()=>{ const a=src.indexOf("// GAMESTAB_END"), b=src.indexOf("// GAMEGRID_START"), c=src.indexOf("// GAMEGRID_END"); return a>0&&b>a&&c>b&&src.slice(a,b).trim()==="// GAMESTAB_END"; })());
ok("Mastery HQ: the 🎮 Games pill right after ⚙ Rules; the view after the rules branch; renderMasteryHQ routes it",/_mhqPill\("\\u2699 Rules", mhqView === "rules", "mhqSetView\('rules'\)"\) \+\n\s*_mhqPill\("\\u\{1F3AE\} Games", mhqView === "games", "mhqSetView\('games'\)"\)/.test(src)&&/if \(mhqView === "rules"\) return _mhqRenderRules\(kid\);\n  if \(mhqView === "games"\)/.test(src)&&/mhqView==="rules"\|\|mhqView==="games"\)/.test(src));
ok("GAMES_LIST lines untouched (the four game sessions insert after them)",/\{key:"which",  emoji:"\\u\{1F446\}", label:"Which one\?",  view:"which",                 available:k=>whichDecks\(_gamesItems\(k\)\)\.length>0, render:c=>buildWhichHtml\(c\)\},\n/.test(src));
ok("Match decks, Which one? modes, Build it's pool, the practice-round pool and gamesFor each read gameDeckOn (one line each)",/gameDeckOn\(masteryKid,\(typeof matchStyle!=="undefined"&&matchStyle==="memory"\)\?"memory":"match",k\)/.test(fnText("mastMatchDecks"))&&/gameDeckOn\(kid,"which",d\)/.test(fnText("whichDeckModes"))&&/gameDeckOn\(kid,"spell",i\.subject\)/.test(fnText("spellPool"))&&/gameDeckOn\(kid,"spell",i\.subject\)/.test(fnText("_mpPool"))&&/gameDeckAny\(k,g\)/.test(fnText("gamesFor")));
ok("writes: one targeted set per cell, one remove for Reset, nothing else",/db\.ref\("mastery\/"\+kid\+"_settings\/gameDecks\/"\+k\+"\/"\+game\)\.set\(!!on\)/.test(fnText("gameDeckSet"))&&/db\.ref\("mastery\/"\+kid\+"_settings\/gameDecks"\)\.remove\(\)/.test(fnText("gameDeckReset"))&&!/db\./.test(fnText("gameDeckOn")+fnText("gameDecksHtml")+fnText("gameDeckCan")));
const blk=cut("// GAMEGRID_START","// GAMEGRID_END");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));

// ── a sandbox with the real WHICHONE + GAMELOG + MISSPLAY + WORDWORKOUT + SPELLBUILD + GAMESTAB + GAMEGRID blocks + mastMatchDecks ──
const L="ABCDEFGHIJ".split("");
function cards(){
  const a=L.map((p,i)=>({id:"k_"+p,subject:"Letters",prompt:p,status:"active",tier:"weekly"}));
  const m=[["6×7","42"],["6×8","48"],["6×9","54"],["7×7","49"],["7×8","56"]].map(([q,ans],i)=>({id:"m"+i,subject:"Math Facts",prompt:q,answer:ans,status:"active",tier:"weekly"}));
  const w=["red","men","leg"].map(x=>({id:"w_"+x,subject:"AAS Words",prompt:x,status:"introduction",tier:"daily"}));
  return a.concat(m,w);
}
function world(o){
  o=o||{};
  const writes=[];
  const md={k1:cards(),k1_settings:o.settings||{},k2:[],k2_settings:{},history:{},studyLog:{}};
  const CODE=cut("// WHICHONE_START","// MISSPLAY_END")+"\n"+cut("// WORDWORKOUT_START","// WORDWORKOUT_END")+"\n"+cut("// SPELLBUILD_START","// SPELLBUILD_END")+"\n"+cut("// GAMESTAB_START","// GAMEGRID_END")+"\n"+fnText("mastMatchDecks");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    masteryKid:"k1",masteryData:md,matchStyle:"match",matchPairMode:"two",mastView:"games",matchState:null,whichState:null,
    _matchEligible:it=>!!(it&&it.subject!=="AAS Words"),   // Match plays pictures / meanings: Letters (10) and Math (5) qualify (4+), spelling doesn't
    _smTileVis:it=>(it&&it.subject==="Letters"?'<b>'+it.prompt+'</b>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").trim(),esc:s=>String(s||""),cap:s=>s.toUpperCase(),
    mastSpeak(){},matchDing(){},matchBonk(){},_mastRe(){},_dryRun:()=>!!o.dry,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{setItem(){}},bbAudioUnlock(){},renderAll(){},momHere:()=>o.mom!==false,mastAdminPinOk:!!o.pin,gwShowToast(){},mastGetPrintNum:()=>1,
    mastSchoolDayNum:()=>5,mstTodayKey:()=>"20261102",mastSetView(){},mastScoreItemId:null,mastManualScore:false,mastMatchSetStyle(){},buildMatchHtml:()=>"",envFlashAvail:()=>false,envFlashGameHtml:()=>"",
    document:{getElementById:()=>null,createElement:()=>({style:{}}),body:{appendChild(){}}}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'wwUI',{get:()=>wwUI,set:v=>{wwUI=v;}}); this.GAMES_LIST=GAMES_LIST; this.__raw=()=>_gdRaw;",ctx);
  return {c:ctx,writes,md};
}
console.log("── defaults: nothing stored = every game plays its own decks ──");
{
  const {c}=world();
  ok("gameDeckOn is true with nothing stored",c.gameDeckOn("k1","which","Letters")===true&&c.gameDeckOn("k1","spell","AAS Words")===true&&c.gameDeckOn("nobody","x","y")===true);
  const can=g=>c.gameDeckCan("k1",c.GAMES_LIST.find(x=>x.key===g));
  ok("preload = each game's own rule: Match/Memory Letters+Math, Which one? Letters+Math, Build it AAS Words, ID Flash none",can("match").join(",")==="Letters,Math Facts"&&can("memory").join(",")==="Letters,Math Facts"&&can("which").join(",")==="Letters,Math Facts"&&can("spell").join(",")==="AAS Words"&&can("idflash").length===0);
  ok("the raw flag is back off after a preload",c.__raw()===false);
  ok("the kid's deck rows",c._gdDecks("k1").join(",")==="AAS Words,Letters,Math Facts");
}
console.log("── Mom turns a game off for a deck: one targeted set; the games read it ──");
{
  const {c,writes}=world();
  ok("set: Which one? off for Letters",c.gameDeckSet("k1","which","Letters",false)===true&&writes.length===1&&writes[0][0]==="set"&&writes[0][1]==="mastery/k1_settings/gameDecks/Letters/which"&&writes[0][2]===false);
  ok("gameDeckOn now false there, true elsewhere",c.gameDeckOn("k1","which","Letters")===false&&c.gameDeckOn("k1","which","Math Facts")===true&&c.gameDeckOn("k1","match","Letters")===true);
  ok("Which one? no longer plays Letters: modes, decks, pool and the practice-round pool",!c.whichDeckModes(c.masteryData.k1,"k1").Letters&&c.whichDecks(c.masteryData.k1,"k1").join(",")==="Math Facts"&&c.whichPool(c.masteryData.k1,c.WHICH_MIX,"k1").every(i=>i.subject!=="Letters")&&c._mpPool("k1",c.masteryData.k1).every(i=>i.subject!=="Letters"));
  ok("the preload still shows Letters as a deck Which one? CAN play (so Mom can turn it back on)",c.gameDeckCan("k1",c.GAMES_LIST.find(x=>x.key==="which")).indexOf("Letters")>=0);
  c.gameDeckSet("k1","which","Letters",true);
  ok("back on: true written, Letters plays again",writes[1][2]===true&&c.whichDeckModes(c.masteryData.k1,"k1").Letters==="symbol");
  c.gameDeckSet("k1","match","Letters",false);
  ok("Match off for Letters: its deck list drops Letters while Memory flip keeps it",c.mastMatchDecks().join(",")==="Math Facts"&&(c.matchStyle="memory",c.mastMatchDecks().join(",")==="Letters,Math Facts"));
  c.matchStyle="match";
  c.gameDeckSet("k1","spell","AAS Words",false);
  ok("Build it off for AAS Words: no words to build, not offered in the Games tab, spelling out of the round",c.spellPool(c.masteryData.k1,"k1").length===0&&!c.gamesFor("k1").some(g=>g.key==="spell")&&c._mpPool("k1",c.masteryData.k1).every(i=>i.subject!=="AAS Words"));
  c.gameDeckSet("k1","match","Math Facts",false);
  ok("Match off for every deck → Match not offered, Memory flip still is",!c.gamesFor("k1").some(g=>g.key==="match")&&c.gamesFor("k1").some(g=>g.key==="memory"));
}
console.log("── a deck name with Firebase-illegal characters ──");
{
  const {c,writes}=world();
  ok("key swaps . # $ / [ ] for _",c.gdKey("Mr. Men/Little #1 [a]")==="Mr_ Men_Little _1 _a_"&&c.gdKey("Letters")==="Letters");
  c.gameDeckSet("k1","which","A.B",false);
  ok("stored and read under the safe key",writes[0][1]==="mastery/k1_settings/gameDecks/A_B/which"&&c.gameDeckOn("k1","which","A.B")===false);
}
console.log("── Reset, Mom-only, dry run ──");
{
  const {c,writes,md}=world({settings:{gameDecks:{Letters:{which:false}}}});
  ok("stored override read on load",c.gameDeckOn("k1","which","Letters")===false);
  ok("Reset removes the overrides node only",c.gameDeckReset("k1")===true&&md.k1_settings.gameDecks===undefined&&writes[0][0]==="remove"&&writes[0][1]==="mastery/k1_settings/gameDecks"&&c.gameDeckOn("k1","which","Letters")===true);
  const {c:c2,writes:w2}=world({mom:false});
  ok("not Mom: set and Reset refused, nothing written",c2.gameDeckSet("k1","which","Letters",false)===false&&c2.gameDeckReset("k1")===false&&w2.length===0&&c2.gameDeckOn("k1","which","Letters")===true);
  const {c:c3}=world({mom:false,pin:true});
  ok("the admin PIN counts as Mom",c3.gameDeckSet("k1","which","Letters",false)===true);
  const {c:c4,writes:w4}=world({dry:true});
  ok("dry run: in memory only",c4.gameDeckSet("k1","which","Letters",false)===true&&c4.gameDeckOn("k1","which","Letters")===false&&w4.length===0);
}
console.log("── a new game's entry with decks(), and one without (fake keys no real game owns) ──");
{
  const {c}=world();
  c.GAMES_LIST.push({key:"zzz",emoji:"🎱",label:"Fake game",view:"zzz",available:()=>true,render:()=>"",decks:k=>["Letters"]});
  c.GAMES_LIST.push({key:"zzy",emoji:"🧠",label:"Fake no-decks game",view:"zzy",available:()=>true,render:()=>""});
  ok("decks() is the preload for a new game",c.gameDeckCan("k1",c.GAMES_LIST.find(g=>g.key==="zzz")).join(",")==="Letters");
  ok("an entry without decks() is tolerated: no cells, always offered",c.gameDeckCan("k1",c.GAMES_LIST.find(g=>g.key==="zzy")).length===0&&c.gamesFor("k1").some(g=>g.key==="zzy"));
  c.gameDeckSet("k1","zzz","Letters",false);
  ok("every deck off → the new game is not offered",!c.gamesFor("k1").some(g=>g.key==="zzz"));
  const {c:c2}=world(); c2.GAMES_LIST.push({key:"zzx",emoji:"💥",label:"Fake throwing game",view:"zzx",available:()=>true,render:()=>"",decks:()=>{ throw new Error("boom"); }});
  ok("a throwing decks() → no cells, still offered, raw flag reset",c2.gameDeckCan("k1",c2.GAMES_LIST.find(g=>g.key==="zzx")).length===0&&c2.gamesFor("k1").some(g=>g.key==="zzx")&&c2.__raw()===false);
}
console.log("── the grid ──");
{
  const {c}=world({settings:{gameDecks:{Letters:{which:false}}}});
  const h=c.gameDecksHtml("k1");
  ok("rows for each deck, a column per game",h.indexOf(">Letters<")>0&&h.indexOf(">Math Facts<")>0&&h.indexOf(">AAS Words<")>0&&h.indexOf("Which one?")>0&&h.indexOf("Build it")>0&&h.indexOf("ID Flash")>0);
  ok("cells: Which one? · Letters is OFF (○), Match · Letters ON (✓), Build it · Letters is –",/aria-label="Which one\? · Letters off"[^>]*>○</.test(h)&&/aria-label="Match · Letters on"[^>]*>✓</.test(h)&&(h.match(/–/g)||[]).length>=5);
  ok("a cell tap calls gameDeckSet with the opposite value",/gameDeckSet\('k1','which','Letters',true\)/.test(h)&&/gameDeckSet\('k1','match','Letters',false\)/.test(h));
  ok("Reset offered when something is stored",/gameDeckReset\('k1'\)/.test(h));
  const {c:c2}=world({mom:false}); const h2=c2.gameDecksHtml("k1");
  ok("not Mom: cells disabled, no Reset, a note",/gd-cell on" onclick="[^"]+" disabled/.test(h2)&&!/gameDeckReset/.test(h2)&&h2.indexOf("Mom only")>=0);
  const {c:c3}=world(); ok("nothing stored: no Reset button",!/gameDeckReset/.test(c3.gameDecksHtml("k1")));
  ok("a kid with no decks: a kind note",c.gameDecksHtml("k2").indexOf("No decks yet")>=0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
