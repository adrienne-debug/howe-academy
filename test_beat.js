/*
 * ⏱ Beat my time (her go 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "Beat-my-time Matching"). Match's face-up pairs on
 * MASTERED cards only (gate tier or above); the clock starts on the first tap and the finish is the kid's time against their own best
 * (lower is better). Wrong pairs come back once on a small untimed board. gameLogRound (game "beat"); match_best "<deck> · beat" in
 * seconds, only when beaten; never the ladder. Runs the REAL code with a hand-driven clock.
 *   run:  node test_beat.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// BEAT_START"), b=src.indexOf("// BEAT_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one BEAT block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// BEAT_START",a+1)<0&&src.indexOf("// BEAT_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[key\]:st\.sec\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|tiles\.push|back\.push|out\.push/g,"")));
ok("GAMES_LIST: Beat my time right after Battleship; park pauses the clock",/resume:\(\)=>shipResume\(\), decks:k=>typeof shipDecks==="function"\?shipDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"beat",\s*emoji:"\\u23F1",\s*label:"Beat my time",view:"beat",\s*available:k=>typeof beatDecks==="function"&&beatDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildBeatHtml\(c\),\n\s*park:\(\)=>beatPark\(\), restore:v=>\{ beatState=v\|\|null; \}, resume:\(\)=>beatResume\(\), decks:k=>typeof beatDecks==="function"\?beatDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/beat/i.test(fnText("gamesCurrentKey"))&&!/beatState|beatResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("the gate is the Sprint rule (gate_tier via mastTierAtLeast); Match's own door (_matchEligible) for the class guards — no hook line of its own; no lives, no leaderboard, no points",/mastTierAtLeast\(it\.tier,beatGate\(kid\)\)/.test(code)&&/gate_tier\|\|"weekly"/.test(code)&&/_matchEligible\(it\)/.test(code)&&!/envtWaitsForCheckin|cpceHidItem|cpSecOffItem/.test(code)&&!/lives|hearts|leaderboard|points|bankDirect/i.test(code));
ok("the clock tick only touches #beat-clock and stops by itself when parked, off screen or done",/getElementById\("beat-clock"\)/.test(fnText("_beatTick"))&&/beatState!==st\|\|st\.endTs\|\|st\.pausedAt\|\|\(typeof mastView!=="undefined"&&mastView!=="beat"\)/.test(fnText("_beatTick")));

// ── a sandbox: _matchPairHtml + GAMELOG + GAMEGRID + BEAT, a kid's cards, a recording db, a hand-driven clock ──
const C=(id,deck,front,back,tier,extra)=>Object.assign({id:id,subject:deck,prompt:front,answer:back,status:"active",tier:tier||"monthly"},extra||{});
const ROOTS=[C("r1","Roots","geo","earth"),C("r2","Roots","aqua","water"),C("r3","Roots","bio","life"),C("r4","Roots","tele","far"),C("r5","Roots","photo","light"),C("r6","Roots","graph","write"),C("r7","Roots","phon","sound","daily"),C("r8","Roots","chron","time","every_other_day")];
const PICS=[C("p1","Animals","cat","","monthly",{emoji:"🐱"}),C("p2","Animals","dog","","monthly",{emoji:"🐶"}),C("p3","Animals","cow","","monthly",{emoji:"🐮"}),C("p4","Animals","pig","","weekly",{emoji:"🐷"}),C("p5","Animals","fox","","daily",{emoji:"🦊"})];
const DUP=[C("d1","Rules","Isaac hit a grand slam.","Use a before a consonant."),C("d2","Rules","Carlotta has a puppy.","Use a before a consonant."),C("d3","Rules","Jing saw an island.","Use an before a vowel."),C("d4","Rules","Abe is an honest man.","Use an before a vowel."),C("d5","Rules","I ate an apple.","Use an before a vowel.")];
function world(items,o){
  o=o||{};
  const writes=[], dings=[], timers=[], ivals=[]; let now=1000000;
  const CODE=fnText("_matchPlain")+"\n"+fnText("_matchPairHtml")+"\n"+fnText("_matchEligible")+"\nvar matchPairMode=\"two\";\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// BEAT_START","// BEAT_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,
    setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },setInterval:(f,ms)=>{ ivals.push(f); return ivals.length; },clearInterval:()=>{},
    document:{getElementById:id=>id==="celeb-overlay"?(o.celeb?{}:null):(id==="beat-clock"?ctx._clockEl:null)},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:(it,noGlyph)=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    mastGetDef:()=>null,
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mastTierAtLeast:(t,g)=>{ const O=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; return O.indexOf(t||"daily")>=O.indexOf(g||"weekly"); },
    mstTodayKey:()=>"20261103",mastView:"beat",masteryKid:"k",WHICH_MIX:"Mix the decks",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  ctx._clockEl={textContent:""};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'beatState',{get:()=>beatState,set:v=>{beatState=v;}}); Object.defineProperty(this,'_beatRandom',{get:()=>_beatRandom,set:v=>{_beatRandom=v;}}); this.BEAT_PAIRS=BEAT_PAIRS;",ctx);
  ctx._beatRandom=seeded(o.seed||3);
  ctx._beatNow=()=>now;
  const flush=()=>{ let g=0; while(timers.length&&g++<50){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,dings,timers,ivals,flush,tick:ms=>{ now+=ms; },now:()=>now};
}
const tileOf=(st,pid,prompt)=>st.tiles.findIndex(t=>t.pid===pid&&t.isPrompt===prompt&&!t.matched);
function matchPair(w,pid){ const c=w.c, st=c.beatState; c.beatTap(tileOf(st,pid,true)); c.beatTap(tileOf(st,pid,false)); }
// a clean round: tile 0 starts the clock, `ms` pass, tile 0's own pair goes first (it is still selected), then the rest
function cleanRun(w,ms){ const c=w.c, st=c.beatState; c.beatTap(0); w.tick(ms); const p0=st.tiles[0].pid; matchPair(w,p0); st.pairs.filter(p=>p!==p0).forEach(pid=>{ matchPair(w,pid); }); }

{ const w=world(ROOTS.concat(PICS,DUP)), c=w.c;
  const decks=c.beatDecks(c.masteryData.k);
  ok("decks: Roots (6 of 8 mastered) and Animals (4 of 5: fox at daily is out) play; a rule deck whose backs repeat collapses to 2 pairs → no; a production twin never",JSON.stringify(decks)==="[\"Animals\",\"Roots\"]"&&!c.beatEligible(Object.assign({},ROOTS[0],{id:"tw",dir:"prod"}),"k"),decks);
  ok("the Sprint rule: a card below the gate (weekly) never plays; the kid's own gate_tier is read",c.beatPool(c.masteryData.k,"Roots").length===6&&!c.beatPool(c.masteryData.k,"Roots").some(x=>x.id==="r7"||x.id==="r8")&&(()=>{ const w2=world(PICS,{settings:{gate_tier:"daily"}}); return w2.c.beatPool(w2.c.masteryData.k,"Animals").length===5; })());
  const off=world(ROOTS,{settings:{gameDecks:{Roots:{beat:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Beat my time is not offered; the preload (asked raw) still lists it",off.c.beatDecks(off.c.masteryData.k).length===0&&off.c.gameDeckCan("k",{key:"beat",decks:k=>off.c.beatDecks(off.c.masteryData.k,k)}).indexOf("Roots")>=0);
}
{ const w=world(ROOTS), c=w.c;
  c.beatStart("Roots"); const st=c.beatState;
  ok("a round: 6 pairs → 12 tiles (a front tile + its meaning tile each), the clock NOT started, nothing matched",st&&st.phase==="play"&&st.pairs.length===6&&st.tiles.length===12&&st.tiles.filter(t=>t.isPrompt).length===6&&st.startTs===null&&c.beatElapsed(st)===0&&st.game==="beat");
  const h0=c.buildBeatHtml("#000");
  ok("the board: 12 tiles in 3 columns, the clock at 0.0s and 'first time — set your best!'",(h0.match(/class="beat-tile/g)||[]).length===12&&/repeat\(3,1fr\)/.test(h0)&&/id="beat-clock"[^>]*>0\.0s</.test(h0)&&/set your best/.test(h0));
  c.beatTap(0);
  ok("the first tap starts the clock and the tick",st.startTs===w.now()&&w.ivals.length===1&&st.sel===0);
  w.tick(1500); w.ivals[0]();
  ok("the tick writes the running time into #beat-clock only",c._clockEl.textContent==="1.5s");
  // a wrong pair
  const first=st.tiles[0], other=st.tiles.findIndex((t,i)=>i!==0&&t.pid!==first.pid);
  c.beatTap(other);
  ok("a wrong pair: the bonk, both tiles red, both CARDS marked, the board locked for a beat",w.dings.slice(-1)[0]==="bonk"&&first.miss&&st.tiles[other].miss&&st.missed[first.pid]===1&&st.missed[st.tiles[other].pid]===1&&st.lock);
  w.flush(); ok("…then they clear",!first.miss&&!st.lock&&st.sel===-1);
  w.tick(10000);
  st.pairs.forEach(pid=>{ matchPair(w,pid); });
  ok("every pair matched → the clock stops (11.5s), 4 of 6 pairs clean, and the two marked pairs come back on a small UNTIMED board",st.phase==="back"&&st.sec===11.5&&st.endTs===w.now()&&st.first===4&&st.backPairs.length===2&&st.tiles.length===4&&w.dings.filter(x=>x==="ding").length===6);
  const hb=c.buildBeatHtml("#000");
  ok("the back board says the clock stopped; 2 columns for 4 tiles",/clock stopped/.test(hb)&&/repeat\(2,1fr\)/.test(hb));
  w.tick(60000);   // time passes — it must not count
  st.backPairs.forEach(pid=>{ matchPair(w,pid); });
  ok("the come-back cleared → done; the time is still 11.5s; a first round is always a new best",st.phase==="done"&&st.sec===11.5&&st.isPB&&st.prevBest===null);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key 'Roots · beat' = 11.5 (seconds); ONE gameLog push, game beat, 6 pairs + 2 come-backs",mb.length===1&&JSON.stringify(mb[0][2])==="{\"Roots · beat\":11.5}"&&gl.length===1&&gl[0][2].game==="beat"&&gl[0][2].items.length===8&&gl[0][2].items.filter(i=>i.back).length===2&&gl[0][2].items.filter(i=>i.ok&&!i.back).length===4&&w.writes.length===2);
  ok("the finish: 'New best — 11.5s!', '4 of 6 pairs clean', Try to beat it",/New best \u2014 11\.5s!/.test(c.buildBeatHtml("#000"))&&/4 of 6 pairs clean/.test(c.buildBeatHtml("#000"))&&/Try to beat it/.test(c.buildBeatHtml("#000")));
  // a slower clean round: no new best
  c.beatStart("Roots"); const st2=c.beatState; cleanRun(w,20000);
  ok("a clean but slower round (20.0s): 6 of 6, no come-back, NOT a best — nothing written; the best to beat shows on the board next time",st2.phase==="done"&&st2.first===6&&st2.sec===20&&!st2.isPB&&st2.prevBest===11.5&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===1&&(c.beatStart("Roots"),/beat 11\.5s/.test(c.buildBeatHtml("#000"))));
  // a faster round: new best
  const st3=c.beatState; cleanRun(w,5000);
  ok("a faster round (5.0s) → new best written (lower is better)",st3.isPB&&st3.sec===5&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2);
}
{ const w=world(ROOTS), c=w.c;
  c.beatStart("Roots"); const st=c.beatState; c.beatTap(0); w.tick(3000);
  // one wrong pair only → the come-back brings one clean pair along
  const first=st.tiles[0], other=st.tiles.findIndex((t,i)=>i!==0&&t.pid!==first.pid); c.beatTap(other); w.flush();
  st.pairs.forEach(pid=>{ matchPair(w,pid); });
  ok("two cards marked by one wrong tap → a 2-pair come-back board (4 tiles); no extra pair needed",st.phase==="back"&&st.tiles.length===4);
  const parked=c.beatPark();
  ok("park on the back board (clock already stopped): nothing to pause",parked===st&&st.pausedAt===null);
}
{ const w=world(ROOTS), c=w.c;
  c.beatStart("Roots"); const st=c.beatState; c.beatTap(0); w.tick(2000);
  c.beatPark(); ok("GAMEKIT park mid-round pauses the clock",st.pausedAt===w.now());
  w.tick(50000); ok("…time away does not count",c.beatElapsed(st)===2000);
  c.beatResume(); ok("resume picks the clock up where it left off",st.pausedAt===null&&st.pausedTotal===50000&&c.beatElapsed(st)===2000);
  c.beatTap(0); ok("a tap while paused was ignored; after resume the board responds",st.sel===0);
  c.beatChangeDeck(); ok("Change deck drops the round: nothing written",c.beatState===null&&w.writes.length===0);
}
{ const w=world(ROOTS,{dry:true,celeb:true}), c=w.c;
  c.beatStart("Roots"); const st=c.beatState; cleanRun(w,4000);
  ok("?dryrun=1: the round plays, a new best shows the small confetti, nothing is written",st.phase==="done"&&st.isPB&&w.dings.some(x=>x==="celeb:\u23F1 Roots \u2014 new best!")&&w.writes.length===0);
}
{ const w=world(PICS), c=w.c;
  c.beatStart("Animals"); const st=c.beatState;
  ok("a picture deck: 4 mastered pairs (fox stays out), the pair tile is the picture",st.pairs.length===4&&st.tiles.length===8&&!st.pairs.some(p=>p==="p5")&&st.tiles.some(t=>!t.isPrompt&&/memoji/.test(t.html)));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
