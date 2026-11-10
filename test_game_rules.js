/*
 * 📜 Game rules pop-up (her design 2026-11-03): the games grid's header names are buttons → a pop-up with that game's rules for the
 * kid being viewed; each game lists only the rules it has; per kid under mastery/<kid>_settings/gameRules/<game>/<rule>, one targeted
 * set, Mom only, default = today. First rule: Build it "source" (learning words only | all spelling words). Her second rule — a game
 * with no deck checked is hidden from the kid's tab — is gamesFor/gameDeckAny as it stands; pinned here. Runs the REAL code.
 *   run:  node test_game_rules.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=src.indexOf("// GAMERULES_START"), b=src.indexOf("// GAMERULES_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one GAMERULES block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// GAMERULES_START",a+1)<0&&src.indexOf("// GAMERULES_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's or family's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: ONE targeted set of mastery/<kid>_settings/gameRules/<game>/<rule>, guarded; no update / remove / push, no whole-node set",(code.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\("mastery\/"\+kid\+"_settings\/gameRules\/"\+game\+"\/"\+rule\)\.set\(val\)/.test(code)&&/typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)/.test(code)&&!/\.update\(|\.remove\(|\.push\(/.test(code.replace(/ov\.remove\(\)/g,"")));   // ov.remove() is the pop-up's own DOM node, not a write
ok("Mom only: gameRuleSet goes through _gdCanEdit (the grid's lock)",/typeof _gdCanEdit!=="function"\|\|!_gdCanEdit\(\)\) return false/.test(fnText("gameRuleSet")));
ok("GAMEGRID's header: one guarded line turns each game name into the rules button",(fnText("gameDecksHtml").match(/gameRulesBtnHtml/g)||[]).length===2&&/\(typeof gameRulesBtnHtml==="function"\)\?gameRulesBtnHtml\(kid,g\):\(g\.emoji\+' '\+E\(g\.label\)\)/.test(fnText("gameDecksHtml")));
ok("SPELLBUILD's spellPool: one guarded read of gameRule(kid,\"spell\",\"source\"); learning words sort first",/typeof gameRule==="function"&&gameRule\(kid,"spell","source"\)==="all"/.test(fnText("spellPool"))&&/\(lrn\(b\)-lrn\(a\)\)\|\|/.test(fnText("spellPool")));
ok("her second rule is already gamesFor → gameDeckAny (every deck off → not offered; a deck never set counts as on)",/gameDeckAny\(k,g\)/.test(fnText("gamesFor"))&&/return d\.some\(x=>gameDeckOn\(k,g\.key,x\)\)/.test(fnText("gameDeckAny"))&&/if\(!g\|\|g\[game\]==null\) return true/.test(fnText("gameDeckOn")));
{ const list=cut("const GAMES_LIST=[","\n];"), entries=list.split(/\n  (?=\{key:")/).filter(e=>/\{key:"/.test(e)), keys=entries.map(e=>e.match(/\{key:"([a-z]+)"/)[1]), noDecks=entries.filter(e=>!/decks:k=>/.test(e)).map(e=>e.match(/\{key:"([a-z]+)"/)[1]).filter(k=>!/^(match|memory|which|spell)$/.test(k));   // match / memory / which / spell have GD_BUILTIN deck lists
  ok("every game but ID Flash (the class site's) has a deck list, so the hide-when-unchecked rule reaches all of them: "+keys.join(" "),noDecks.length===1&&noDecks[0]==="idflash",noDecks); }

// ── a sandbox: GAMEGRID + GAMERULES (+ WORDWORKOUT + SPELLBUILD for the pool), a fake document for the pop-up ──
function world(items,o){
  o=o||{};
  const writes=[], nodes={};
  const mk=()=>({style:{},_h:"",id:"",set innerHTML(v){ this._h=v; },get innerHTML(){ return this._h; },remove(){ delete nodes[this.id]; },onclick:null});
  const CODE=cut("// WORDWORKOUT_START","// WORDWORKOUT_END")+"\n"+cut("// SPELLBUILD_START","// SPELLBUILD_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    document:{getElementById:id=>nodes[id]||null,createElement:()=>mk(),body:{appendChild(n){ nodes[n.id]=n; }}},
    momHere:()=>o.mom!==false,_dryRun:()=>!!o.dry,HA_LS:{setItem(){}},gwShowToast(){},_mastRe(){},renderAll(){ ctx._renders=(ctx._renders||0)+1; },mastGetPrintNum:()=>1,bbAudioUnlock(){},cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    mastSpeak(){},matchDing(){},matchBonk(){},_showCelebration(){},mstTodayKey:()=>"20261103",mastView:"spell",masteryKid:"k",
    _gamesItems:k=>(k==="k"?items||[]:[]),
    GAMES_LIST:[{key:"spell",emoji:"\u{1F524}",label:"Build it",view:"spell",available:()=>true,render:()=>""},{key:"which",emoji:"\u{1F446}",label:"Which one?",view:"which",available:()=>true,render:()=>""},{key:"zzz",emoji:"\u{1F3B1}",label:"Fake game",view:"zzz",available:()=>true,render:()=>"",decks:k=>["Letters"]}],
    masteryData:{k:items||[],k_settings:o.settings||{},k_custom_items:[]},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'gameRulesUI',{get:()=>gameRulesUI,set:v=>{gameRulesUI=v;}}); this.GAME_RULES=GAME_RULES;",ctx);
  return {c:ctx,writes,nodes};
}
const W=(w,extra)=>Object.assign({id:"w_"+w,subject:"AAS Words",prompt:w,status:"introduction"},extra||{});
const WORDS=[W("red",{ww:{m:1,d:"2026-10-15"}}),W("men",{ww:{m:1,d:"2026-10-16"}}),W("leg"),W("mix",{status:"active"}),W("they",{status:"active",ww:{m:2,d:"2026-10-20",on:true,since:"2026-10-20",r:[]}}),
  W("gone",{status:"active",ww:{m:1,d:"2026-10-28"}}),W("sand",{status:"active",ww:{m:1,d:"2026-10-25"}}),W("hat",{status:"active"}),{id:"m1",subject:"Math Facts",prompt:"7×8",answer:"56",status:"active"}];
const ACTIVE_ONLY=[W("mix",{status:"active"}),W("gone",{status:"active",ww:{m:1,d:"2026-10-28"}}),W("sand",{status:"active",ww:{m:1,d:"2026-10-25"}}),W("hat",{status:"active"})];

{ const w=world(WORDS), c=w.c;
  ok("the registry: Build it has one rule, 'source', default 'learning', two options; Which one? has none",c.gameRuleDefs("spell").length===1&&c.gameRuleDefs("spell")[0].key==="source"&&c.gameRuleDefs("spell")[0].def==="learning"&&c.gameRuleDefs("spell")[0].opts.map(o=>o[0]).join()==="learning,all"&&c.gameRuleDefs("which").length===0);
  ok("gameRule: nothing stored → the default; an unknown rule → null",c.gameRule("k","spell","source")==="learning"&&c.gameRule("k","spell","nope")===null&&c.gameRule("k","which","source")===null);
  const P0=c.spellPool(c.masteryData.k).map(c.spellWordOf);
  ok("default 'learning' = today's pool exactly: introduction + Workout words, most-recently-missed first",JSON.stringify(P0)==="[\"they\",\"men\",\"red\",\"leg\"]",P0);
  ok("the grid header: every game name is a button that opens its rules; Build it carries the 📜 mark, Which one? does not",(()=>{ const h=c.gameDecksHtml("k"); return (h.match(/class="gr-hbtn"/g)||[]).length===3&&/onclick="gameRulesOpen\('k','spell'\)"/.test(h)&&/Build it <span[^>]*>\u{1F4DC}/u.test(h)&&!/Which one\? <span/.test(h); })());
  c.gameRulesOpen("k","spell");
  const panel=w.nodes["grules-panel"];
  ok("the pop-up opens on body with Build it's one rule, 'Learning words only' ticked, both pills live for Mom",!!panel&&/Build it · rules/.test(panel.innerHTML)&&/Which words does Build it use\?/.test(panel.innerHTML)&&/✓ Learning words only/.test(panel.innerHTML)&&(panel.innerHTML.match(/class="gr-pill/g)||[]).length===2&&!/disabled/.test(panel.innerHTML)&&/For K\./.test(panel.innerHTML));
  ok("Which one?'s pop-up says it has no rules yet (no empty box)",/no rules yet/.test(c.gameRulesHtml("k","which"))&&!/gr-pill/.test(c.gameRulesHtml("k","which")));
  ok("gameRuleSet: a value that is not an option, or an unknown rule, is refused and writes nothing",c.gameRuleSet("k","spell","source","everything")===false&&c.gameRuleSet("k","spell","nope","all")===false&&w.writes.length===0);
  ok("Mom taps 'All spelling words' → ONE targeted set, in memory too, the pop-up re-drawn with ✓ moved, the grid re-rendered",c.gameRuleSet("k","spell","source","all")===true&&w.writes.length===1&&JSON.stringify(w.writes[0])==="[\"set\",\"mastery/k_settings/gameRules/spell/source\",\"all\"]"&&c.masteryData.k_settings.gameRules.spell.source==="all"&&/✓ All spelling words/.test(w.nodes["grules-panel"].innerHTML)&&c.gameRule("k","spell","source")==="all"&&c._renders===1);
  const P1=c.spellPool(c.masteryData.k).map(c.spellWordOf);
  ok("'all': every spelling word in play — the learning words first (as before), then the active ones most-recently-missed first, then by name; Math never",JSON.stringify(P1)==="[\"they\",\"men\",\"red\",\"leg\",\"gone\",\"sand\",\"hat\",\"mix\"]",P1);
  c.gameRulesClose();
  ok("✕ closes the pop-up",!w.nodes["grules-panel"]&&c.gameRulesUI===null);
  ok("a stored value that is no longer an option falls back to the default",(c.masteryData.k_settings.gameRules.spell.source="weird",c.gameRule("k","spell","source")==="learning"));
}
{ const w=world(ACTIVE_ONLY), c=w.c;
  ok("the live case: a kid with 132 active words and 0 learning → Build it has NO words today (hidden)…",c.spellPool(c.masteryData.k).length===0);
  c.masteryData.k_settings.gameRules={spell:{source:"all"}};
  ok("…and with 'all' every active word plays, most-recently-missed first",JSON.stringify(c.spellPool(c.masteryData.k).map(c.spellWordOf))==="[\"gone\",\"sand\",\"hat\",\"mix\"]");
  ok("the grid's preload (asked raw) and the practice round's door are untouched by the rule",c.spellPlayable(c.masteryData.k[0])===true);
}
{ const w=world(WORDS,{mom:false}), c=w.c;
  ok("a kid's device (no Mom): the pop-up shows the rules read-only — pills disabled, 'Mom changes these'; a tap writes nothing",(c.gameRulesOpen("k","spell"),/disabled/.test(w.nodes["grules-panel"].innerHTML)&&/Mom changes these/.test(w.nodes["grules-panel"].innerHTML))&&c.gameRuleSet("k","spell","source","all")===false&&w.writes.length===0&&c.gameRule("k","spell","source")==="learning");
}
{ const w=world(WORDS,{dry:true}), c=w.c;
  ok("?dryrun=1: the rule flips in memory, nothing is written",c.gameRuleSet("k","spell","source","all")===true&&w.writes.length===0&&c.gameRule("k","spell","source")==="all");
}
{ const w=world(WORDS,{settings:{gameDecks:{Letters:{zzz:false}}}}), c=w.c;
  ok("her second rule, live in GAMEGRID: a game whose only deck is unchecked is not offered (gameDeckAny), a game with no decks set is",c.gameDeckAny("k",c.GAMES_LIST[2])===false&&c.gameDeckAny("k",{key:"spell"})===true);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
