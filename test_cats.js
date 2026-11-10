/*
 * 📋 Categories (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Categories dump (Scattergories-lite)").
 * A category = a group of a deck's cards that share one back (a fact family, a rule, a kind); the kid types every card in it they can,
 * up to 3 categories a round, a quiet 2-minute clock each. Chips: ✓ in the group · "another group" · not in this deck. Nothing hinted;
 * the group's cards are shown only after the kid is done with it. gameLogRound (game "cats"); match_best "<deck> · cats" only when
 * beaten; never the ladder. Runs the REAL code (with Brain Dump's matcher on the page, and without it).
 *   run:  node test_cats.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// CATS_START"), b=src.indexOf("// CATS_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one CATS block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// CATS_START",a+1)<0&&src.indexOf("// CATS_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.count\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|cards\.push|others\.push|typed\.push|elsewhere\.push/g,"")));
ok("GAMES_LIST: Categories right after Sure? then flip, with park / restore / resume and decks for the grid",/resume:\(\)=>sureResume\(\), decks:k=>typeof sureDecks==="function"\?sureDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"cats",\s*emoji:"\\u\{1F4CB\}",\s*label:"Categories",\s*view:"cats",\s*available:k=>typeof catsAvail==="function"&&catsAvail\(k\), render:c=>buildCatsHtml\(c\),\n\s*park:\(\)=>catsPark\(\), restore:v=>\{ catsRestore\(v\); \}, resume:\(\)=>catsResume\(\), decks:k=>typeof catsDecks==="function"\?catsDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/catsState|catsResume/.test(fnText("gamesCurrentKey"))&&!/catsState|catsResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, points, leaderboard or opponent; no hint / autocomplete while typing; the start tap unlocks audio",!/lives|hearts|leaderboard|bankDirect|steal|opponent|datalist|autocomplete="on"/i.test(code)&&/autocomplete="off"/.test(blk)&&/bbAudioUnlock\(\)/.test(blk));
ok("the group's cards are listed only on the finish (after the kid is done with it); which other group a stray belongs to is never told",/shown only AFTER the kid is done/.test(blk)&&/another group/.test(blk)&&!/belongs to the group|It belongs/.test(blk));
ok("level gate: readers who type (Brain Dump's gate when on the page, else dcLevel)",/dumpLevelOk\(kid\)/.test(blk)&&/l!=="little"&&l!=="early"/.test(blk));

// ── a sandbox: GAMELOG + GAMEGRID + CATS (+ BRAINDUMP's matcher when asked), a kid's cards, a recording db, a clock by hand ──
const M=(f,ans)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:"weekly"});
const R=(s,rule,deck)=>({id:"r_"+s.replace(/\W/g,"_"),subject:deck||"Articles",prompt:s,answer:rule,status:"active",tier:"weekly"});
const MATH=[M("6+6","12"),M("7+5","12"),M("8+4","12"),M("9+3","12"),M("5+5","10"),M("7+3","10"),M("6+4","10"),M("1+9","10"),M("9+9","18"),M("8+3","11"),M("2+9","11"),M("5+6","11"),M("4+7","11")];   // 12 ×4 · 10 ×4 · 11 ×4 · 18 ×1
const RULES=[R("a dog","Use a before a consonant sound"),R("a cat","Use a before a consonant sound"),R("a house","Use a before a consonant sound"),R("an apple","Use an before a vowel sound"),R("an egg","Use an before a vowel sound"),R("an owl","Use an before a vowel sound")];
const ROOTS=[{id:"g1",subject:"Roots",prompt:"geo",answer:"earth",status:"active"},{id:"g2",subject:"Roots",prompt:"astro",answer:"star",status:"active"},{id:"g3",subject:"Roots",prompt:"hydro",answer:"water",status:"active"}];   // every back its own: no group
const SPELL=["red","blue","green"].map(w=>({id:"s_"+w,subject:"Spelling",prompt:w,answer:"color",status:"active"}));
function world(items,o){
  o=o||{};
  const writes=[], dings=[], timers=[], els={};
  const CODE=cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+(o.dump?cut("// BRAINDUMP_START","// BRAINDUMP_END")+"\n"+fnText("mstNormAns")+"\n":"")+cut("// CATS_START","// CATS_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,
    setTimeout:(f,ms)=>{ timers.push({f,ms}); return timers.length; },setInterval:(f,ms)=>{ ctx._iv={f,ms}; return 1; },clearInterval(){ ctx._iv=null; },
    window:{_catsTick:null,_dumpTick:null},document:{getElementById:id=>els[id]||null},els,
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx._renders=(ctx._renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    _whichLeftOut:(i)=>/spell/i.test(i.subject||""),
    mastSpeak(){},matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    dcLevel:k=>k==="little"?"little":k==="early"?"early":"middle",
    mstTodayKey:()=>"20261103",mastView:o.view||"cats",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  if(o.celeb) els["celeb-overlay"]={};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'catsState',{get:()=>catsState,set:v=>{catsState=v;}}); Object.defineProperty(this,'_catsRandom',{get:()=>_catsRandom,set:v=>{_catsRandom=v;}}); this.CATS_PER_ROUND=CATS_PER_ROUND; this.CATS_SECS=CATS_SECS; this.__raw=()=>_gdRaw;",ctx);
  ctx._catsRandom=seeded(o.seed||3);
  return {c:ctx,writes,dings,timers,els};
}
// type a name into the box and press Enter (with the chips on the page, as on a tablet)
function type(w,text){ w.els["cats-in"]={value:text}; w.els["cats-chips"]={insertAdjacentHTML(){ w.chips=(w.chips||0)+1; }}; w.els["cats-count"]={textContent:""}; w.c.catsAdd(); }
const catOf=(c)=>{ const st=c.catsState; return st.cats[st.ci]; };

console.log("── the groups (pure) ──");
{ const w=world(MATH.concat(RULES,ROOTS,SPELL)), c=w.c;
  const g=c.catsGroups(c.masteryData.k,"k");
  ok("Math Facts: three groups of 3+ (12, 10, 11); the lone 18 is no group",g["Math Facts"]&&g["Math Facts"].length===3&&g["Math Facts"].every(x=>x.cards.length===4&&x.label!=="18"));
  ok("Articles: two rule groups of 3",g.Articles&&g.Articles.length===2&&g.Articles.every(x=>x.cards.length===3));
  ok("Roots (every back its own) and spelling never play",!g.Roots&&!g.Spelling);
  ok("catsDecks lists the two",JSON.stringify(c.catsDecks(c.masteryData.k,"k"))==="[\"Articles\",\"Math Facts\"]");
  ok("catsAvail: a middle / upper kid with a deck; never a little / early one",c.catsAvail("k")&&!c.catsAvail("little")&&!c.catsAvail("early"));
  const one=world(MATH.filter(x=>x.answer==="12").concat(ROOTS));
  ok("one group alone is not a deck (it needs two)",one.c.catsDecks(one.c.masteryData.k,"k").length===0&&/No decks ready for Categories/.test(one.c.buildCatsHtml("#000")));
  const r=c.catsRound("Math Facts",g);
  ok("a round: up to 3 groups of the deck, each with its cards; the deck's other grouped cards kept aside as 'others'",r.cats.length===3&&r.cats.reduce((n,x)=>n+x.cards.length,0)===12&&r.others.length===0);
  const big=world(MATH.concat([M("1+1","2"),M("0+2","2"),M("2+0","2")])), rb=big.c.catsRound("Math Facts",big.c.catsGroups(big.c.masteryData.k,"k"));
  ok("four groups → 3 drawn, the fourth's cards are the 'others'",rb.cats.length===3&&rb.others.length>0&&rb.others.length===15-rb.cats.reduce((n,x)=>n+x.cards.length,0));
  ok("catsPrep: a fact typed loosely is the card ('6 + 6', '6x6', '6*6'); words untouched",c.catsPrep("6 + 6")==="6+6"&&c.catsPrep("6x6")==="6\u00D76"&&c.catsPrep("6*6")==="6\u00D76"&&c.catsPrep("a dog")==="a dog");
  ok("catsSwap: a fact's twin",c.catsSwap("4+8")==="8+4"&&c.catsSwap("3\u00D77")==="7\u00D73"&&c.catsSwap("a dog")===""&&c.catsSwap("12-4")==="");
  const off=world(MATH.concat(RULES),{settings:{gameDecks:{Articles:{cats:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Categories is gone; the preload (asked raw) still lists it so she can turn it back on",JSON.stringify(off.c.catsDecks(off.c.masteryData.k,"k"))==="[\"Math Facts\"]"&&off.c.gameDeckCan("k",{key:"cats",decks:k=>off.c.catsDecks(off.c.masteryData.k,k)}).indexOf("Articles")>=0&&off.c.__raw()===false);
  off.c.catsStart("Articles");
  ok("…and a turned-off deck cannot be started",off.c.catsState===null);
}
console.log("── a round of fact families ──");
{ const w=world(MATH), c=w.c;
  c.catsStart("Math Facts"); const st=c.catsState;
  ok("a round: 3 categories, 12 cards in all, the first open, the clock ticking, nothing written",st&&st.phase==="play"&&st.cats.length===3&&st.of===12&&st.ci===0&&c._iv&&c._iv.ms===1000&&w.writes.length===0&&st.game==="cats"&&st.kid==="k");
  let cat=catOf(c), h=c.buildCatsHtml("#000");
  ok("the screen: the category as the cue, '0 of N', the box, Next — none of the group's cards written",h.indexOf(">"+cat.label+"<")>0&&/0 of /.test(h)&&/id="cats-in"/.test(h)&&/Next category/.test(h)&&!cat.cards.some(x=>h.indexOf(">"+x.front+"<")>=0));
  const first=cat.cards[0].front;
  type(w,first);
  ok("a card of the group typed exactly → ✓, the ding, counted, a chip added in place",cat.named[cat.cards[0].pid]===1&&st.count===1&&w.dings.slice(-1)[0]==="ding"&&w.chips===1&&cat.typed[0].how==="hit");
  type(w,first);
  ok("the same name again is ignored (no chip, no count)",st.count===1&&w.chips===1&&cat.typed.length===1);
  const second=cat.cards[1].front, loose=second.replace("+"," + ");
  type(w,loose);
  ok("typed with spaces ('"+loose+"') → the same card",cat.named[cat.cards[1].pid]===1&&st.count===2);
  const third=cat.cards[2].front, swapped=third.split("+").reverse().join("+");
  type(w,swapped);
  ok("the fact with its sides swapped ('"+swapped+"' for '"+third+"') counts — the same fact",cat.named[cat.cards[2].pid]===1&&st.count===3);
  const other=st.cats[1].cards[0].front, d0=w.dings.length;
  type(w,other);
  ok("a card of ANOTHER group → an amber 'another group' chip, no ding, not counted, which group is never told",cat.typed.slice(-1)[0].how==="other"&&cat.typed.slice(-1)[0].pid==null&&st.count===3&&w.dings.length===d0&&/another group/.test(c._catsChip(cat.typed.slice(-1)[0]))&&c._catsChip(cat.typed.slice(-1)[0]).indexOf(st.cats[1].label)<0);
  type(w,"99+99");
  ok("a name not in the deck → a grey chip, not counted",cat.typed.slice(-1)[0].how==="miss"&&st.count===3);
  type(w,"   ");
  ok("a blank entry does nothing",cat.typed.length===5);
  const n1=c._renders||0; c.catsNextCat();
  ok("➡ Next → the second category opens, its own clock from zero, the first's seconds kept",st.ci===1&&catOf(c).label===st.cats[1].label&&st.cats[0].secs>=0&&c._iv&&(c._renders||0)===n1+1);
  cat=catOf(c); cat.cards.forEach(x=>type(w,x.front));
  ok("every card of a group named → it closes by itself and the next opens",st.ci===2&&Object.keys(st.cats[1].named).length===st.cats[1].cards.length);
  ok("the last category's button says I'm done",/I\u2019m done/.test(c.buildCatsHtml("#000")));
  c.catsNextCat();
  ok("done → the round ends: named 7 of 12 (3 + 4 + 0), the best written",st.phase==="done"&&st.count===7&&st.of===12&&st.isPB);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game cats and every card of the round's groups",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])===JSON.stringify({"Math Facts \u00B7 cats":st.count})&&gl.length===1&&gl[0][2].game==="cats"&&gl[0][2].items.length===12&&gl[0][2].items.filter(i=>i.ok).length===7&&gl[0][2].items.filter(i=>!i.ok&&i.n===2).length===5&&w.writes.length===2);
  h=c.buildCatsHtml("#000");
  ok("the finish: named N of M, each group with ✓ named and the rest dim (now that the kid is done), the stray chips, Play again",/You named 7 of 12/.test(h)&&/new best/.test(h)&&(h.match(/cats-chip cats-on/g)||[]).length===7&&(h.match(/cats-chip cats-dim/g)||[]).length===5&&/another group/.test(h)&&/Play again/.test(h)&&!w.dings.some(x=>/celeb/.test(x)));
  ok("the clock stopped with the round",c._iv===null||c.window._catsTick===null);
}
console.log("── the clock, Brain Dump's matcher, rules, the dry run, confetti, the kid ──");
{ const w=world(MATH), c=w.c;
  c.catsStart("Math Facts"); const st=c.catsState;
  st.catT0=Date.now()-c.CATS_SECS*1000-10; c._iv.f();
  ok("the category's 2 minutes run out → it closes by itself, the next opens",st.ci===1&&st.phase==="play");
  c.catsChangeDeck();
  ok("Change deck drops the round: nothing written",c.catsState===null&&w.writes.length===0);
  const d=world(RULES,{dump:true}), dc=d.c; dc.catsStart("Articles"); const ds=dc.catsState; let cat=catOf(dc);
  ok("a rule deck: the rule is the cue, the sentences are the cards",cat.label.indexOf("Use a")===0||cat.label.indexOf("Use an")===0);
  const want=cat.cards[0].front, typo=want.slice(0,-1)+(want.slice(-1)==="e"?"a":"e");
  type(d,typo);
  ok("with Brain Dump's matcher on the page, one letter off on a long name is 'close' and counts (the recap shows the card's own spelling)",cat.named[cat.cards[0].pid]===1&&cat.typed[0].how==="close"&&ds.count===1);
  type(d,cat.cards[1].front.toUpperCase()+".");
  ok("case and punctuation don't count",ds.count===2);
  type(d,"a zebra");
  ok("a sentence that follows the rule but isn't a card → not in this deck (grey), not wrong",cat.typed.slice(-1)[0].how==="miss"&&ds.count===2);
  const n=world(RULES), nc=n.c; nc.catsStart("Articles"); const ncat=catOf(nc); type(n,ncat.cards[0].front.slice(0,-1)+"x");
  ok("without Brain Dump on the page: exact only (a typo is grey)",ncat.typed[0].how==="miss"&&nc.catsState.count===0);
  const dr=world(MATH,{dry:true}); dr.c.catsStart("Math Facts"); while(dr.c.catsState.phase==="play"){ catOf(dr.c).cards.forEach(x=>type(dr,x.front)); }
  ok("?dryrun=1: the round plays, nothing is written (the best stays in memory)",dr.c.catsState.phase==="done"&&dr.writes.length===0&&dr.c.masteryData.k_settings.match_best["Math Facts \u00B7 cats"]===12);
  const e=world(MATH,{celeb:true}); e.c.catsStart("Math Facts"); while(e.c.catsState.phase==="play"){ catOf(e.c).cards.forEach(x=>type(e,x.front)); }
  ok("every card of the round named → the small confetti (noSong)",e.dings.some(x=>x==="celeb:\u{1F4CB} You named every one!"));
  const k=world(MATH); k.c.catsStart("Math Facts"); k.c.masteryKid="other"; while(k.c.catsState.phase==="play"){ catOf(k.c).cards.forEach(x=>type(k,x.front)); }
  ok("the finish saves to the round's OWN kid, not the kid picked now",k.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&k.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
  const nb=world(MATH,{settings:{match_best:{"Math Facts \u00B7 cats":12}}}); nb.c.catsStart("Math Facts"); while(nb.c.catsState.phase==="play"){ catOf(nb.c).cards.forEach(x=>type(nb,x.front)); }
  ok("a best that is not beaten writes no best (the log still goes)",nb.writes.length===1&&nb.writes[0][0]==="push"&&nb.c.catsState.isPB===false&&nb.c.catsState.prevBest===12);
}
console.log("── park / restore / resume (GAMEKID → GAMEKIT): time away is not play time ──");
{ const w=world(MATH), c=w.c;
  c.catsStart("Math Facts"); const st=c.catsState; st.catT0=Date.now()-5000;
  const p=c.catsPark();
  ok("park marks the pause and hands back the round",p===st&&st.pausedAt>0);
  c._iv.f();
  ok("the clock clears itself while parked (no close, no tick)",c._iv===null&&st.ci===0);
  st.pausedAt-=30000;   // 30 s away
  c.catsState=null; c.catsRestore(st);
  ok("restore ends the pause and keeps the 30 s out of the category's time",c.catsState===st&&st.pausedAt===null&&st.pausedTotal>=30000&&c.catsElapsed(st)<10000);
  c.catsResume();
  ok("resume starts the clock again (only when on screen)",c._iv&&c._iv.ms===1000);
  c._iv=null; c.mastView="which"; c.catsResume();
  ok("not on screen → no clock",c._iv===null);
}
console.log("── 📋 CATSCAP (2026-11-08, games honesty audit #16): a group takes its size + 3 entries; spraying fronts is capped ──");
{ const w=world(MATH), c=w.c; c.catsStart("Math Facts"); const st=c.catsState, cat=st.cats[st.ci];
  const cap=cat.cards.length+3, mine=cat.cards.map(x=>x.front);
  const elsewhere=[]; st.cats.forEach((g,i)=>{ if(i!==st.ci) g.cards.forEach(x=>elsewhere.push(x.front)); }); (st.others||[]).forEach(x=>elsewhere.push(x.front));
  ok("the cap is the group's size + 3 (CATS_EXTRA)",c.catsCap(cat)===cap&&elsewhere.length>=cap-2);
  // spray: every other front first (each a free "another group" today), then this group's own cards
  const spray=elsewhere.slice(0,cap-2).concat(mine);
  const rs=[]; spray.forEach(f=>{ w.els["cats-note"]={textContent:""}; if(st.ci===0&&st.phase==="play") rs.push([f,c.catsEnter(st,f)]); });
  const kept=cat.typed.length, hits=Object.keys(cat.named).length;
  ok("entries stop at the cap: "+cap+" kept, the rest refused as 'full'",kept===cap&&rs.slice(cap).every(r=>r[1]==="full")&&rs.slice(0,cap).every(r=>r[1]!=="full"),rs.map(r=>r[1]));
  ok("…so only 2 of the group's "+mine.length+" are counted (the spray cost the rest)",hits===2&&st.count===2);
  ok("a name already counted is still free past the cap (dup, not full)",c.catsEnter(st,cat.typed.find(x=>x.pid!=null).text)==="dup");
  type(w,mine[mine.length-1]);
  ok("catsAdd on a full group: no chip added, the soft line shown, the count unchanged",!w.chips&&w.els["cats-note"].textContent==="That’s plenty for this category — tap Next when you’re ready."&&st.count===2);
  ok("…the screen keeps the line on a redraw",c.buildCatsHtml("#000").includes('id="cats-note"')&&c.buildCatsHtml("#000").includes("plenty for this category"));
  const n=world(MATH), nc=n.c; nc.catsStart("Math Facts"); const ncat=nc.catsState.cats[0];
  ok("a group under its cap has no line",!nc.buildCatsHtml("#000").includes("plenty for this category")&&!nc.catsFull(ncat));
  while(nc.catsState.ci<nc.catsState.cats.length) nc.catsNextCat();
  const e=(w.c.catsNextCat(),w.c.catsNextCat(),w.c.catsNextCat(),w.writes.find(x=>x[0]==="push"));
  ok("the round logs the capped group honestly: its 2 named ok, the rest missed",!!e&&e[2].items.filter(it=>cat.cards.some(x=>String(x.pid)===it.id)).filter(it=>it.ok).length===2);
}

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
