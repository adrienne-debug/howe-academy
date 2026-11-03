/*
 * 🐹 Whack-a-mole (her "yes to all and go to all" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Whack-a-mole / Find the match").
 * Only cards at the gate tier or above are timed (the Sprint rule). Four moles pop one after another and hide; tap the right one.
 * A wrong tap or a missed pop → bonk, said again, the right mole back up and held. Misses once at the end. gameLogRound (game "mole");
 * match_best "<deck> · mole" only when beaten; never the ladder. Runs the REAL code with timers by hand.
 *   run:  node test_mole.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// MOLE_START"), b=src.indexOf("// MOLE_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one MOLE block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// MOLE_START",a+1)<0&&src.indexOf("// MOLE_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[key\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push/g,"")));
ok("GAMES_LIST: Whack-a-mole right after Go Fish, with park / restore / resume and decks for the grid",/resume:\(\)=>gofishResume\(\), decks:k=>typeof gofishDecks==="function"\?gofishDecks\(_gamesItems\(k\),k\):\[\]\},[^\n]*\n  \{key:"mole",\s*emoji:"\\u\{1F439\}", label:"Whack-a-mole",\s*view:"mole",\s*available:k=>typeof moleDecks==="function"&&moleDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildMoleHtml\(c\),\n\s*park:\(\)=>moleState, restore:v=>\{ moleState=v\|\|null; \}, resume:\(\)=>moleResume\(\), decks:k=>typeof moleDecks==="function"\?moleDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/mole/i.test(fnText("gamesCurrentKey"))&&!/moleState|moleResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, no leaderboard, no points, no steals; the start tap unlocks audio",!/lives|hearts|leaderboard|bankDirect|steal/i.test(code)&&/bbAudioUnlock\(\)/.test(blk));
ok("every timer checks its own round and sequence (a parked round's moles never move)",(code.match(/setTimeout\(/g)||[]).length===3&&(code.match(/moleState!==st\|\|st\.seq!==seq/g)||[]).length===2&&/moleState===st&&st\.lock&&st\.seq===seq/.test(code));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + MOLE, a kid's cards, a recording db, timers by hand with a clock ──
const P=(n,emoji,tier,extra)=>Object.assign({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:tier||"monthly"},extra||{});
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"bi_weekly"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉","daily"),P("bee","🐝","every_other_day"),P("ant","🐜","weekly")];
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10"),M("8+3","11","daily"),M("2+7","9","daily")];
const LOW=[P("a1","🐱","daily"),P("a2","🐶","daily"),P("a3","🐮","daily"),P("a4","🐷","daily"),P("a5","🦊","every_other_day")];
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[]; let now=0;
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// MOLE_START","// MOLE_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,
    setTimeout:(f,ms)=>{ timers.push({at:now+(ms||0),f:f,id:timers.length+1}); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx._renders=(ctx._renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mastTierAtLeast:(t,g)=>{ const O=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; return O.indexOf(t||"daily")>=O.indexOf(g||"weekly"); },
    mstTodayKey:()=>"20261103",mastView:o.view||"mole",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'moleState',{get:()=>moleState,set:v=>{moleState=v;}}); Object.defineProperty(this,'_moleRandom',{get:()=>_moleRandom,set:v=>{_moleRandom=v;}}); this.MOLE_UP=MOLE_UP; this.MOLE_GAP=MOLE_GAP; this.MOLE_BEAT=MOLE_BEAT; this.MOLE_WAVES=MOLE_WAVES; this.WHICH_MIX=WHICH_MIX;",ctx);
  ctx._moleRandom=seeded(o.seed||3);
  // advance the clock to `t`, firing every timer due by then, in order
  const tick=t=>{ for(;;){ const due=timers.filter(x=>x.at<=t).sort((x,y)=>x.at-y.at||x.id-y.id)[0]; if(!due) break; timers.splice(timers.indexOf(due),1); now=due.at; due.f(); } now=t; };
  const flushAll=()=>{ let g=0; while(timers.length&&g++<500){ const nx=Math.min.apply(null,timers.map(x=>x.at)); tick(nx); } };
  return {c:ctx,writes,said,dings,timers,tick,flushAll,now:()=>now};
}
const rightSlot=(c,t)=>t.tiles.indexOf(t.pid);
const beat=(w)=>w.tick(w.now()+w.c.MOLE_BEAT);   // the lock beat after a right tap — the next wave then starts, nothing of it has popped yet

{ const w=world(ANIMALS.concat(MATH).concat([{id:"s1",subject:"AAS Words",prompt:"red",status:"active",tier:"monthly"}])), c=w.c;
  const decks=c.moleDecks(c.masteryData.k);
  ok("decks: Animals (5 gated of 8) and Math Facts (4 gated of 6) play; spelling never",JSON.stringify(decks)==="[\"Animals\",\"Math Facts\"]",decks);
  const pool=c.molePool(c.masteryData.k,"Animals");
  ok("the Sprint rule: only cards at the gate (weekly) or above are timed — owl (daily) and bee (every other day) stay out, ant (weekly) is in",pool.length===6&&!pool.some(x=>x.id==="p_owl"||x.id==="p_bee")&&pool.some(x=>x.id==="p_ant"));
  ok("Math Facts: 4 of 6 gated",c.molePool(c.masteryData.k,"Math Facts").length===4);
  const it=ANIMALS[0], tiles=c.moleTiles(it,c._moleWhichPool(c.masteryData.k,"k"),"picture");
  ok("a wave: 4 holes — the right card + 3 different cards of its deck (lures may be any tier)",tiles.length===4&&tiles.indexOf("p_cat")>=0&&new Set(tiles).size===4&&tiles.every(p=>p.indexOf("p_")===0));
  const lo=world(LOW);
  ok("a deck whose cards are still learning (below the gate) is not offered at all",lo.c.moleDecks(lo.c.masteryData.k).length===0&&/No decks ready/.test(lo.c.buildMoleHtml("#000")));
  const g=world(LOW,{settings:{gate_tier:"daily"}});
  ok("the kid's own gate tier is read (<kid>_settings.gate_tier)",g.c.moleGate("k")==="daily"&&g.c.moleDecks(g.c.masteryData.k).length===1);
  const off=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{mole:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for Whack-a-mole is not offered; turned off for Which one? only, it still plays here",JSON.stringify(off.c.moleDecks(off.c.masteryData.k))==="[\"Math Facts\"]"&&(()=>{ const w2=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{which:false}}}}); return w2.c.moleDecks(w2.c.masteryData.k).length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"mole",decks:k=>off.c.moleDecks(off.c.masteryData.k,k)}).indexOf("Animals")>=0);
}
{ const w=world(ANIMALS), c=w.c;
  c.moleStart("Animals"); const st=c.moleState;
  ok("a round: every gated card once (6 here, fewer than MOLE_WAVES), the first prompt said inside the tap, nothing up yet",st&&st.phase==="play"&&st.turns.length===6&&st.of===6&&new Set(st.turns.map(t=>t.pid)).size===6&&w.said.length===1&&Object.keys(st.turns[0].up).length===0&&st.game==="mole"&&st.kid==="k");
  ok("the said word is the card's NAME, which is NOT written on the board",w.said[0]===ANIMALS.find(x=>x.id===st.turns[0].pid).prompt&&c.buildMoleHtml("#000").indexOf(">"+w.said[0]+"<")<0);
  w.tick(0); ok("t=0: the first mole pops",Object.keys(st.turns[0].up).length===1&&st.turns[0].up[0]===1);
  w.tick(3*c.MOLE_GAP); ok("t=3 gaps: all four are up",Object.keys(st.turns[0].up).length===4&&/mole mole-up/.test(c.buildMoleHtml("#000"))&&(c.buildMoleHtml("#000").match(/class="mole-hole"/g)||[]).length===4);
  let t=st.turns[0]; c.moleTap(rightSlot(c,t));
  ok("tap the right one while it is up → done, first, the ding, the board locks for a beat",t.done&&t.first&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&st.lock);
  const before=w.said.length; beat(w);
  ok("after the beat the next wave starts (said once) and the hide timers of wave 1 did nothing",st.i===1&&w.said.length===before+1&&st.turns[0].done);
  // wave 2: tap a WRONG mole
  w.tick(w.now()+3*c.MOLE_GAP); t=st.turns[1];
  const wrongSlot=t.tiles.findIndex(p=>p!==t.pid);
  c.moleTap(wrongSlot);
  ok("tap a wrong one → the bonk, the prompt said again, only the right mole is up and HELD (no clock on a correction)",w.dings.slice(-1)[0]==="bonk"&&w.said.length===before+2&&t.hold&&Object.keys(t.up).length===1&&t.up[rightSlot(c,t)]===1&&/mole-held/.test(c.buildMoleHtml("#000"))&&/Here it is/.test(c.buildMoleHtml("#000")));
  w.tick(w.now()+2*c.MOLE_UP);
  ok("…and the held mole does not hide while the kid looks",t.up[rightSlot(c,t)]===1&&!t.done);
  c.moleTap(wrongSlot); ok("a hidden mole can't be tapped",!t.done);
  c.moleTap(rightSlot(c,t)); const s7=w.said.length;
  ok("tap it → done, not first, first-tap count unchanged, the card queued to come back once",t.done&&!t.first&&st.first===1&&st.turns.length===7&&st.turns[6].back&&st.turns[6].pid===t.pid);
  beat(w);
  // wave 3: let the right one hide untouched
  t=st.turns[2]; const d0=w.dings.length, s0=w.said.length;
  w.tick(w.now()+rightSlot(c,t)*c.MOLE_GAP+c.MOLE_UP+1);
  ok("the right mole goes down untouched → a miss (late): the bonk, said again, the right mole back up and held",t.wrong.late===1&&w.dings.slice(-1)[0]==="bonk"&&w.dings.length===d0+1&&w.said.length===s0+1&&t.hold&&t.up[rightSlot(c,t)]===1);
  c.moleTap(rightSlot(c,t)); beat(w);
  ok("it comes back once too (8 turns now)",st.turns.length===8&&st.turns.filter(x=>x.back).length===2);
  // waves 4..7 right away
  let guard=0; while(st.phase==="play"&&guard++<20){ const tt=st.turns[st.i]; w.tick(w.now()+3*c.MOLE_GAP); c.moleTap(rightSlot(c,tt)); beat(w); }
  ok("the round ends after the come-backs: 4 of 6 on the first tap (the two come-backs count for nothing)",st.phase==="done"&&st.first===4&&st.of===6);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game mole and every turn",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Animals · mole\":4}"&&gl.length===1&&gl[0][2].game==="mole"&&gl[0][2].items.length===8&&gl[0][2].items.filter(i=>i.ok).length===6&&gl[0][2].items.filter(i=>i.back).length===2&&w.writes.length===2);
  ok("the finish shows the count against the kid's own best; no confetti on a round with misses",/4 of 6 on the first tap/.test(c.buildMoleHtml("#000"))&&/new best/.test(c.buildMoleHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x)));
  c.moleStart("Animals"); const st2=c.moleState; guard=0;
  while(st2.phase==="play"&&guard++<20){ const tt=st2.turns[st2.i]; w.tick(w.now()+3*c.MOLE_GAP); c.moleTap(rightSlot(c,tt)); beat(w); }
  ok("a clean round: 6 of 6, a new best written, the small confetti only with the overlay present (none here)",st2.first===6&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&!w.dings.some(x=>/celeb/.test(x)));
  c.moleStart("Animals"); const st3=c.moleState; guard=0;
  while(st3.phase==="play"&&guard++<20){ const tt=st3.turns[st3.i]; w.tick(w.now()+3*c.MOLE_GAP); c.moleTap(rightSlot(c,tt)); beat(w); }
  ok("a best that is not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&st3.isPB===false);
}
{ const w=world(ANIMALS,{celeb:true}), c=w.c;
  c.moleStart("Animals"); const st=c.moleState; let guard=0;
  while(st.phase==="play"&&guard++<20){ const tt=st.turns[st.i]; w.tick(w.now()+3*c.MOLE_GAP); c.moleTap(rightSlot(c,tt)); beat(w); }
  ok("with the overlay on the page, a clean round gets the small confetti (noSong)",w.dings.some(x=>x==="celeb:\u{1F439} You got them all!"));
}
{ const w=world(ANIMALS,{dry:true}), c=w.c;
  c.moleStart("Animals"); const st=c.moleState; let guard=0;
  while(st.phase==="play"&&guard++<20){ const tt=st.turns[st.i]; w.tick(w.now()+3*c.MOLE_GAP); c.moleTap(rightSlot(c,tt)); beat(w); }
  ok("?dryrun=1: the round plays, nothing is written",st.phase==="done"&&w.writes.length===0);
}
{ const w=world(ANIMALS.concat(MATH)), c=w.c;
  c.moleStart("Math Facts"); const st=c.moleState; w.tick(3*c.MOLE_GAP);
  const h=c.buildMoleHtml("#000"), t=st.turns[0], it=MATH.find(x=>x.id===t.pid);
  ok("answer mode: the FRONT is shown big and said; the moles are BACKS (the card's own + 3 other answers)",h.indexOf(it.prompt)>0&&w.said[0]===it.prompt&&h.indexOf('class="mole-ans"')>0&&t.tiles.length===4&&h.indexOf(">"+it.answer+"<")>0);
  c.moleStart(c.WHICH_MIX); const mx=c.moleState;
  ok("Mix the decks: cards from both decks, each wave's lures from the card's OWN deck",mx.mix&&new Set(mx.turns.map(t=>c.masteryData.k.find(x=>x.id===t.pid).subject)).size===2&&mx.turns.every(t=>{ const d=c.masteryData.k.find(x=>x.id===t.pid).subject; return t.tiles.every(p=>c.masteryData.k.find(x=>x.id===p).subject===d); }));
  ok("Change deck mid-round drops it: nothing written",(c.moleChangeDeck(),c.moleState===null&&w.writes.length===0));
}
{ const w=world(ANIMALS), c=w.c;
  c.moleStart("Animals"); const st=c.moleState; w.tick(c.MOLE_GAP);   // two moles up, two still to pop
  const parked=st; c.moleState=null;   // GAMEKID: another kid took the device — the entry parks the round
  w.flushAll();
  ok("a parked round's timers do nothing (no pops, no hides, no misses)",Object.keys(parked.turns[0].up).length===2&&!parked.turns[0].wrong.late&&w.dings.length===0);
  c.moleState=parked; c.moleResume();
  ok("resume: the open wave's moles all come up and stay, the prompt said again",Object.keys(parked.turns[0].up).length===4&&parked.turns[0].hold&&w.said.length===2);
  c.moleTap(rightSlot(c,parked.turns[0]));
  ok("…and the tap still counts as a first-tap right (the parking was not the kid's miss)",parked.turns[0].first&&parked.first===1);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
