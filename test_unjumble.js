/*
 * 🧩 Unjumble (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "Unjumble" — put the words of a sentence in order).
 * The words of a sentence card come up mixed; tap them into the line, Check. A miss locks the right positions and sends the rest back; a
 * second miss shows the sentence for a beat and the card comes back once at the end. gameLogRound (game "jumble"); match_best
 * "<deck> · jumble" only when beaten; never the ladder. Runs the REAL code with timers by hand.
 *   run:  node test_unjumble.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// UNJUMBLE_START"), b=src.indexOf("// UNJUMBLE_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one UNJUMBLE block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// UNJUMBLE_START",a+1)<0&&src.indexOf("// UNJUMBLE_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[key\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|tiles\.push|line\.push|\.push\(\{pid:i\.id/g,"")));
ok("GAMES_LIST: Unjumble after Jeopardy (the games built alongside it may sit between), with park / restore / resume and decks for the grid",src.indexOf('  {key:"jumble",')>src.indexOf('  {key:"jeop",')&&/\n  \{key:"jumble",\s*emoji:"\\u\{1F9E9\}", label:"Unjumble",\s*view:"jumble",\s*available:k=>typeof ujAvail==="function"&&ujAvail\(k\), render:c=>buildJumbleHtml\(c\),\n\s*park:\(\)=>jumbleState, restore:v=>\{ jumbleState=v\|\|null; \}, resume:\(\)=>jumbleResume\(\), decks:k=>typeof ujDecks==="function"\?ujDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/jumble/i.test(fnText("gamesCurrentKey"))&&!/jumbleState|jumbleResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, no clock, no leaderboard, no points; tap only (no drag) — phone first; the start tap unlocks audio",!/lives|hearts|leaderboard|bankDirect|setInterval|pointerdown|draggable/i.test(code)&&/bbAudioUnlock\(\)/.test(blk));
ok("the one timer checks its own round and sequence (a parked round never advances)",(code.match(/setTimeout\(/g)||[]).length===1&&/jumbleState===st&&st\.lock&&st\.seq===seq/.test(code));
ok("the voice says the sentence only as the confirm after a right answer (never before)",/if\(r==="right"\)\{[^\n]*_ujSay\(st,t\)/.test(code)&&(code.match(/_ujSay\(/g)||[]).length===2);

// ── a sandbox: WHICHONE (left-out / silent rules) + GAMELOG + GAMEGRID + UNJUMBLE + dcLevel, a kid's cards, a recording db, timers by hand ──
const C=(deck,front,extra)=>Object.assign({id:(deck+"_"+front).replace(/\W+/g,"_").slice(0,40)+"_"+Math.abs(front.length*31+deck.length),subject:deck,prompt:front,answer:"the rule",status:"active",tier:"weekly"},extra||{});
const ARTICLES=["Isaac hit <u>a</u> grand slam.","Carlotta has <u>a</u> new puppy.","Maria gave her mother <u>a</u> box of candy.","We saw <u>an</u> owl in the barn."].map(f=>C("Articles",f));
const CAPS=["<u>Kangaroos</u> are native to Australia.","<u>Peggy</u> likes to be called <u>Peg</u>.","<u>Mom</u> and <u>Dad</u> went out to dinner."].map(f=>C("Capitalization",f));
const PUNCT=["Abraham Lincoln was born in Kentucky<b class=mast-hl>.</b>","Fri<b class=mast-hl>.</b>   Aug<b class=mast-hl>.</b>   Ln<b class=mast-hl>.</b>   Mrs<b class=mast-hl>.</b>   Dr<b class=mast-hl>.</b>","Roger Smith\u2019s initials are R<b class=mast-hl>.</b>S<b class=mast-hl>.</b>","Where are you going<b class=mast-hl>?</b>"].map(f=>C("Punctuation",f));
const ROOTS=["geo","chron","morph","bene"].map(r=>C("Roots",r));
const SPELL=["The cat sat on the mat today.","The dog ran to the big park.","A fish swam in the cold sea."].map(f=>C("Spelling Words",f,{type:"spelling_word"}));
const UNIT=["one","two","three"].map((f,i)=>C("Unit",f,{sentence:["The sun is a star in space.","Plants make food from light and air.","Water goes up as vapor and comes down as rain."][i]}));
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// UNJUMBLE_START","// UNJUMBLE_END")+"\n"+fnText("dcLevel");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,isFinite,setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx.renders=(ctx.renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>null,
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    ROSTER_DEF:o.roster||[{id:"k",grade:"4"},{id:"little",grade:"PreK"},{id:"early",grade:"1"}],
    mstTodayKey:()=>"20261103",mastView:o.view||"jumble",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jumbleState',{get:()=>jumbleState,set:v=>{jumbleState=v;}}); Object.defineProperty(this,'_ujRandom',{get:()=>_ujRandom,set:v=>{_ujRandom=v;}}); this.UJ_MIN=UJ_MIN; this.UJ_ROUND=UJ_ROUND; this.UJ_TRIES=UJ_TRIES; this.UJ_BEAT=UJ_BEAT; this.UJ_BEAT_SHOW=UJ_BEAT_SHOW; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._ujRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const x=timers.shift(); x.f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
// put the current sentence in the line, right (or with the first two words swapped when bad=true), then Check
function solve(w,bad){
  const c=w.c, st=c.jumbleState, t=st.turns[st.i], n=t.words.length;
  const order=[]; for(let p=0;p<n;p++) if(t.line[p]==null) order.push(p);   // the empty slots fill in order, so tap the words that belong there
  const want=order.map(p=>p);
  if(bad&&want.length>=2){ const x=want[0]; want[0]=want[1]; want[1]=x; }
  want.forEach(p=>{ const wi=t.tiles.find(i=>t.line.indexOf(i)<0&&t.words[i]===t.words[p]); c.jumbleTap(wi); });
  c.jumbleCheck();
}

console.log("── what is a sentence (pure) ──");
{ const w=world([]), c=w.c;
  ok("a rule's example sentence with markup → yes, and the words keep their own capital and punctuation",c.ujIsSentence("Isaac hit <u>a</u> grand slam.")&&c.ujWords("Abraham Lincoln was born in Kentucky<b class=mast-hl>.</b>").join("|")==="Abraham|Lincoln|was|born|in|Kentucky.");
  ok("a question → yes",c.ujIsSentence("Where are you going<b class=mast-hl>?</b>"));
  ok("a run of abbreviations is not a sentence",!c.ujIsSentence("Fri<b class=mast-hl>.</b>   Aug<b class=mast-hl>.</b>   Ln<b class=mast-hl>.</b>   Mrs<b class=mast-hl>.</b>   Dr<b class=mast-hl>.</b>"));
  ok("initials in a sentence are fine (one inner period)",c.ujIsSentence("Roger Smith\u2019s initials are R.S."));
  ok("a rule's example line, a word, a short phrase, a math fact, a definition without an end mark → no",!c.ujIsSentence("boat \u2192 boats \u00B7 flower \u2192 flowers \u00B7 book \u2192 books.")&&!c.ujIsSentence("geo")&&!c.ujIsSentence("The big dog.")&&!c.ujIsSentence("6\u00D77")&&!c.ujIsSentence("imaginary lines that run east-west and measure distance north or south of the equator"));
  ok("too long (13+ words) → no; 12 → yes",!c.ujIsSentence("one two three four five six seven eight nine ten eleven twelve thirteen.")&&c.ujIsSentence("one two three four five six seven eight nine ten eleven twelve."));
  ok("one word repeated has no order to find",!c.ujIsSentence("la la la la la."));
  ok("a card's `sentence` field wins over its front; a plain front that is a sentence plays as itself",c.ujSentence(UNIT[0])==="The sun is a star in space."&&c.ujSentence(ARTICLES[0])==="Isaac hit a grand slam."&&c.ujSentence(ROOTS[0])==="");
}
console.log("── which decks (pure) ──");
{ const w=world(ARTICLES.concat(CAPS,PUNCT,ROOTS,SPELL,UNIT)), c=w.c;
  const p=c.ujPools(c.masteryData.k,"k");
  ok("decks with 3+ sentence cards: Articles 4, Capitalization 3, Punctuation 3 (the abbreviation list left out), Unit 3 (its sentence field)",Object.keys(p).join(",")==="Articles,Capitalization,Punctuation,Unit"&&p.Articles.length===4&&p.Punctuation.length===3&&p.Unit.length===3,Object.keys(p));
  ok("a word deck is not in; spelling stays out (Which one?'s rule)",!p.Roots&&!p["Spelling Words"]);
  ok("the level gate: readers only — a pre-reader never sees it, a 1st grader does",c.ujAvail("k")===true&&c.ujLevelOk("early")===true&&c.ujLevelOk("little")===false);
  const two=world(ARTICLES.slice(0,2)); ok("two sentences → no deck",two.c.ujDecks(two.c.masteryData.k,"k").length===0&&/No decks ready for Unjumble/.test(two.c.buildJumbleHtml("#000")));
  const dup=world(ARTICLES.concat([Object.assign({},ARTICLES[0],{id:"dup"})])); ok("the same sentence twice counts once",dup.c.ujPools(dup.c.masteryData.k,"k").Articles.length===4);
  const off=world(ARTICLES.concat(CAPS),{settings:{gameDecks:{Articles:{jumble:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Unjumble is out of its list; its own column (a deck off for Which one? still plays)",off.c.ujDecks(off.c.masteryData.k,"k").join(",")==="Capitalization"&&(()=>{ const w2=world(ARTICLES.concat(CAPS),{settings:{gameDecks:{Articles:{which:false}}}}); return w2.c.ujDecks(w2.c.masteryData.k,"k").length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"jumble",decks:k=>off.c.ujDecks(off.c.masteryData.k,k)}).indexOf("Articles")>=0);
  off.c.jumbleStart("Articles"); ok("…and it cannot be started",off.c.jumbleState===null);
}
console.log("── a turn (pure) ──");
{ const w=world([]), c=w.c;
  let never=true; for(let i=0;i<40;i++){ const t=c.ujTurn("x","Isaac hit a grand slam.",false); if(t.tiles.every((wi,p)=>wi===p)) never=false; if(t.line.some(x=>x!==null)||t.line.length!==5) never=false; }
  ok("the tiles never come up in the sentence's own order; the line starts empty",never);
}
console.log("── a round: right, a miss that locks, a second miss that shows, the come-back, the writes ──");
{ const w=world(ARTICLES.concat(CAPS)), c=w.c;
  c.jumbleStart("Articles"); const st=c.jumbleState;
  ok("a round of 4 sentences, nothing said yet",st&&st.phase==="play"&&st.turns.length===4&&st.of===4&&st.game==="jumble"&&st.kid==="k"&&w.said.length===0);
  let t=st.turns[0];
  const h0=c.buildJumbleHtml("#000");
  ok("the screen: empty slots, the mixed tiles, Check off until the line is full",(h0.match(/class="uj-slot"/g)||[]).length===t.words.length&&(h0.match(/jumbleTap\(/g)||[]).length===t.words.length&&/onclick="jumbleCheck\(\)" disabled/.test(h0));
  c.jumbleTap(t.tiles[0]); ok("a tap fills the first slot; tapping it there sends it back",t.line[0]===t.tiles[0]&&(c.jumbleUntap(0),t.line[0]===null));
  solve(w);
  ok("right → done, first, the ding, the sentence SAID as the confirm, the board locks for a beat",t.done&&t.first&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&w.said.slice(-1)[0]==="Isaac hit a grand slam."||w.said.slice(-1)[0]===t.words.join(" ")&&st.lock);
  ok("…the line shows every word, Check is off, the message says so",/That\u2019s it!/.test(c.buildJumbleHtml("#000"))&&/jumbleCheck\(\)" disabled/.test(c.buildJumbleHtml("#000")));
  w.flush(); ok("after the beat: the next sentence",st.i===1&&!st.lock);
  t=st.turns[1]; solve(w,true);
  ok("a miss → the bonk, the right positions lock (green), the two swapped go back to the tray, one more try",w.dings.slice(-1)[0]==="bonk"&&t.tries===1&&!t.done&&Object.keys(t.locked).length===t.words.length-2&&t.line.filter(x=>x==null).length===2&&/uj-lock/.test(c.buildJumbleHtml("#000"))&&/green ones are right/.test(c.buildJumbleHtml("#000")));
  c.jumbleClear(); ok("Clear keeps the locked words",t.line.filter(x=>x!=null).length===t.words.length-2);
  solve(w);
  ok("then right → done, not first, the count stays, nothing comes back for a one-miss card",t.done&&!t.first&&st.first===1&&st.turns.length===4);
  w.flush();
  t=st.turns[2]; solve(w,true); solve(w,true);
  ok("two misses → fail: the sentence shows in order for a beat (amber), the card queued once for the end",t.fail&&t.done&&t.show&&t.line.every((wi,p)=>wi===p)&&/Here\u2019s how it goes/.test(c.buildJumbleHtml("#000"))&&/uj-show/.test(c.buildJumbleHtml("#000"))&&st.turns.length===5&&st.turns[4].back&&st.turns[4].pid===t.pid&&w.timers[0].ms===c.UJ_BEAT_SHOW);
  w.flush();
  solve(w); w.flush();
  ok("the come-back is asked last",st.i===4&&st.turns[4].back&&/One more time/.test(c.buildJumbleHtml("#000")));
  solve(w); w.flush();
  ok("the round ends: 2 of 4 on the first try (the come-back counts for nothing)",st.phase==="done"&&st.first===2&&st.of===4);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game jumble and every turn (the fail marked)",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Articles · jumble\":2}"&&gl.length===1&&gl[0][2].game==="jumble"&&gl[0][2].items.length===5&&gl[0][2].items.filter(i=>i.ok).length===3&&gl[0][2].items.filter(i=>i.fail).length===1&&gl[0][2].items.filter(i=>i.back).length===1&&w.writes.length===2);
  ok("the finish shows the count against the kid's own best; no confetti on a round with misses",/2 of 4 on the first try/.test(c.buildJumbleHtml("#000"))&&/new best/.test(c.buildJumbleHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x)));
  c.jumbleStart("Articles"); const st2=c.jumbleState; let g=0; while(st2.phase==="play"&&g++<20){ solve(w); w.flush(); }
  ok("a clean round: 4 of 4, a new best written, confetti only with the overlay present (none here)",st2.first===4&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&!w.dings.some(x=>/celeb/.test(x)));
  c.jumbleStart("Articles"); const st3=c.jumbleState; g=0; while(st3.phase==="play"&&g++<20){ solve(w); w.flush(); }
  ok("a best that is not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&st3.isPB===false);
}
{ const w=world(ARTICLES,{celeb:true}), c=w.c;
  c.jumbleStart("Articles"); let g=0; while(c.jumbleState.phase==="play"&&g++<20){ solve(w); w.flush(); }
  ok("with the overlay, a clean round gets the small confetti (no song)",w.dings.some(x=>x==="celeb:\u{1F9E9} Every sentence in order!"));
  const d=world(ARTICLES,{dry:true}); d.c.jumbleStart("Articles"); g=0; while(d.c.jumbleState.phase==="play"&&g++<20){ solve(d); d.flush(); }
  ok("?dryrun=1: nothing written (best and log stay in memory)",d.writes.length===0&&d.c.masteryData.k_settings.match_best["Articles \u00B7 jumble"]===4&&d.c.masteryData.gameLog.k["20261103"]);
  const m=world(ARTICLES.concat(CAPS,PUNCT)); m.c.jumbleStart(m.c.WHICH_MIX);
  ok("the Mix: up to UJ_ROUND sentences from every deck",m.c.jumbleState.mix===true&&m.c.jumbleState.turns.length===m.c.UJ_ROUND);
  m.c.jumbleChangeDeck(); ok("Change deck drops the round: nothing written",m.c.jumbleState===null&&m.writes.length===0);
  const one=world(ARTICLES); one.c.jumbleStart(one.c.WHICH_MIX); ok("one deck → no Mix round",one.c.jumbleState===null);
  const g2=world(ARTICLES.concat(CAPS)); g2.c.jumbleStart("Articles"); g2.c.masteryKid="other"; let gg=0; while(g2.c.jumbleState.phase==="play"&&gg++<20){ solve(g2); g2.flush(); }
  ok("the finish saves to the round's OWN kid, not the kid picked now",g2.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&g2.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
}
console.log("── a silent language, resume (GAMEKID → GAMEKIT) ──");
{ const G=["Ich habe einen Hund und eine Katze.","Der Hund ist sehr groß und braun.","Wir gehen heute in die Schule."].map(f=>C("German",f));
  const w=world(G), c=w.c; c.jumbleStart("German"); solve(w);
  ok("a silent language: right, the ding, but nothing said",c.jumbleState.turns[0].first&&w.dings.slice(-1)[0]==="ding"&&w.said.length===0);
  const r=world(ARTICLES), rc=r.c; rc.jumbleStart("Articles"); solve(r); const st=rc.jumbleState;
  ok("mid-beat: locked",st.lock&&st.i===0);
  rc.jumbleResume(); ok("resume settles the beat: the next sentence, no render needed",!st.lock&&st.i===1);
  const i1=st.i; r.flush(); ok("the old timer after a resume does nothing",st.i===i1);
  rc.jumbleResume(); ok("resume with nothing mid-step changes nothing",st.i===i1&&!st.lock);
  const v=world(ARTICLES,{view:"which"}); v.c.jumbleStart("Articles"); solve(v);
  ok("not on screen → no speech",v.said.length===0);
}
console.log("── 📜 GAMERULES: 'Show the sentence after…' — 2 misses (default, as above) / 3 misses / never ──");
{ const w=world(ARTICLES.concat(CAPS)), c=w.c;
  ok("the rule sits in the registry under the game's key 'jumble', default 2 (today), options 2 / 3 / never; the pop-up lists it",c.gameRuleDefs("jumble").length===1&&c.gameRuleDefs("jumble")[0].def==="2"&&c.gameRuleDefs("jumble")[0].opts.map(o=>o[0]).join()==="2,3,never"&&c.gameRule("k","jumble","reveal")==="2"&&/Show the sentence after/.test(c.gameRulesHtml("k","jumble")));
  ok("the UNJUMBLE block reads it through one guarded gameRule() call",/gameRule\(kid,"jumble","reveal"\)/.test(fnText("ujRule"))&&/t\.limit=R\.limit/.test(fnText("jumbleCheck")));
}
{ const w=world(ARTICLES.concat(CAPS),{settings:{gameRules:{jumble:{reveal:"3"}}}}), c=w.c;
  c.jumbleStart("Articles"); const st=c.jumbleState, t=st.turns[0];
  solve(w,true); solve(w,true);
  ok("'3 misses': the second miss is still a try — locks, no show, no fail",t.tries===2&&!t.done&&!t.show&&!t.fail);
  solve(w,true);
  ok("the third miss fails: the sentence shows for the long beat, the card comes back once",t.fail&&t.show&&/Here\u2019s how it goes/.test(c.buildJumbleHtml("#000"))&&st.turns.length===5&&st.turns[4].back&&w.timers.slice(-1)[0].ms===2600);
}
{ const w=world(ARTICLES.concat(CAPS),{settings:{gameRules:{jumble:{reveal:"never"}}}}), c=w.c;
  c.jumbleStart("Articles"); const st=c.jumbleState, t=st.turns[0];
  solve(w,true); solve(w,true);
  ok("'never': two misses end the card WITHOUT the sentence — 'We'll come back to that one', the short beat, the card back once at the end",t.fail&&t.done&&!t.show&&t.line.some(wi=>wi==null)&&/come back to that one/.test(c.buildJumbleHtml("#000"))&&!/Here\u2019s how it goes/.test(c.buildJumbleHtml("#000"))&&!/uj-show"/.test(c.buildJumbleHtml("#000"))&&st.turns.length===5&&st.turns[4].back&&w.timers.slice(-1)[0].ms===900);   // uj-show" = a tile carrying the class (the stylesheet names it too)
  w.flush(); ok("…and the round goes on",st.i===1&&!st.lock);
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
