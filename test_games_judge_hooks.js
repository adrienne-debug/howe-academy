/*
 * ⚖️ GAMEJUDGE hooks — the five games whose "I said it" was an honor tap (her decision 2026-11-08, from the games audit:
 * "all five go through the shared judge", one setting per kid) + Scores' "before judging".
 *   · Go Fish (say act), Connect Four (say act), Battleship (name act), Kaboom (say act), Sure? then flip (said card, judged BEFORE the
 *     flip): a wrong judge logs ok:false and the game reacts its own way; the honor tap only when the helper returns false (no other
 *     name); every round is stamped (gameLog judge); a Go Fish "Go fish!" for a card not in hand and a Battleship one-tile find are not
 *     logged as rights.
 *   · Scores: a round of a say-it game (gofish / four / ship / sure / kaboom / jeop) WITHOUT a judge stamp is "before judging" — out of
 *     scpRight and scgLearned, grey and labelled in the 🎮 Games section; honest games (no stamp by design) are unchanged.
 * Runs the REAL code: WHICHONE + GAMELOG + GAMEGRID + the game + GAMEJUDGE (+ SAIDPICK's _matchLures / _matchTtsOk, mstTypeAnsOk).
 *   run:  node test_games_judge_hooks.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnIn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("no function "+name); const j=src.indexOf("\nfunction ",i+10), k=src.indexOf("\n// ",i+10); return src.slice(i,Math.min(j<0?1e9:j,k<0?1e9:k)); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

const P=(n,emoji,deck)=>({id:"p_"+n.replace(/ /g,"_"),subject:deck||"Animals",prompt:n,emoji:emoji,status:"active",tier:"weekly"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉"),P("bee","🐝")];
const MATH=[["7+8","15"],["6+6","12"],["9+4","13"],["5+5","10"],["8+3","11"],["2+7","9"]].map(([f,a])=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:a,status:"active",tier:"weekly"}));
// the game → its block, its state and its seeded random
const GAMES={
  gofish:{blk:"GOFISH",st:"gofishState",rnd:"_gfRandom",view:"gofish"},
  four:{blk:"FOUR",st:"fourState",rnd:"_c4Random",view:"four"},
  ship:{blk:"SHIP",st:"shipState",rnd:"_shipRandom",view:"ship"},
  sure:{blk:"SURE",st:"sureState",rnd:"_sureRandom",view:"sure"},
  kaboom:{blk:"KABOOM",st:"kaboomState",rnd:"_kbRandom",view:"kaboom"},
};
const HELPERS=src.slice(src.indexOf("const MST_TYPEANS_FRAC="),src.indexOf("\n",src.indexOf("const MST_TYPEANS_FRAC=")))+"\n"+["_matchLures","_matchTtsOk","mstNormMath","mstTypeAnsOk"].map(fnIn).join("\n");
function world(game,items,o){
  o=o||{}; const G=GAMES[game];
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// "+G.blk+"_START","// "+G.blk+"_END")+"\n"+
    (o.noJudge?"":cut("// GAMEJUDGE_START","// GAMEJUDGE_END")+"\n"+HELPERS);
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f)=>{ timers.push(f); return timers.length; },
    window:{speechSynthesis:{}},document:{getElementById:()=>null},
    _dryRun:()=>false,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>!!o.mom,renderAll(){},cap:s=>s,
    pinOk:v=>v==="1234",dadPinOk:()=>false,ckGradeOf:()=>null,
    _gamesItems:k=>(k==="k"?items:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:t=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration(){},
    mstTodayKey:()=>"20261108",mastView:G.view,masteryKid:"k",
    masteryData:{k:items,k_settings:{games:o.judge?{judge:o.judge}:{}}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'S',{get:()=>"+G.st+"}); Object.defineProperty(this,'"+G.rnd+"',{get:()=>"+G.rnd+",set:v=>{"+G.rnd+"=v;}});",ctx);
  ctx[G.rnd]=seeded(o.seed||3);
  const flush=()=>{ let g=0; while(timers.length&&g++<200){ timers.shift()(); } };
  const log=()=>writes.filter(x=>x[0]==="push"&&/^mastery\/gameLog\//.test(x[1])).map(x=>x[2]);
  return {c:ctx,writes,said,dings,timers,flush,log};
}
const nameOf=(c,pid)=>c._matchPlain((c.masteryData.k.find(x=>x.id===pid)||{}).prompt);
// the kid answers a judged turn: right or wrong, in the turn's mode (pick: "I said it" first)
function judge(w,t,right,said){
  const c=w.c, gj=t.gj;
  if(gj.mode==="pick"){ said(); const i=gj.ch.findIndex(x=>x.ok); c.gameJudgePick(right?i:(i+1)%gj.ch.length); return; }
  if(gj.mode==="type"){ c.gameJudgeTyped(right?gj.right:"zzz"); c.gameJudgeCheck(); return; }
  c.gameJudgeMomShow(); c.gameJudgeMom(!!right);
}
// a version of the world where the helper says "no other name" (returns false) — the honor tap stays
function noNames(w){ const real=w.c.gameJudgeAct; w.c.gameJudgeAct=(st,t,op)=>false; return real; }

console.log("── by text: one guarded hook per game, no 🔀, no kid names ──");
{ const hooks={GOFISH:["_gfJudgeOpen","gofishSaid"],FOUR:["_c4JudgeOpen","fourSaid"],SHIP:["_shipJudgeOpen","shipSaid"],SURE:["_sureJudgeOpen","sureSaid"],KABOOM:["_kbJudgeOpen","kaboomSaid"]};
  Object.keys(hooks).forEach(B=>{ const blk=cut("// "+B+"_START","// "+B+"_END");
    ok(B+": st.judge=gameJudgeMode(kid) guarded at the start, gameJudgeAct guarded, the honor tap kept behind t.gj, the render guarded",
      /if\(typeof gameJudgeMode==="function"\)\{ \w+State\.judge=gameJudgeMode\(masteryKid\); \w+State\.nch=gameJudgeChoices\(masteryKid\); \}/.test(blk)&&
      /typeof gameJudgeAct!=="function"\) return;/.test(blk)&&/if\(t\.gj\)\{ gameJudgeSaid\(\); return; \}/.test(blk)&&/t\.gj&&typeof gameJudgeHtml==="function"/.test(blk)&&
      blk.indexOf("function "+hooks[B][0]+"(")>0&&!/lincoln|ellis|lucy|julian|caleb|makenzie|kenzie|andrew|adrienne/i.test(blk)); });
  ok("no 🔀 anywhere",src.indexOf("\u{1F500}")<0);
  ok("GAMELOG skips a nolog turn (one guarded condition)",/if\(!t\|\|!t\.done\|\|t\.pid==null\|\|t\.nolog\) return;/.test(cut("// GAMELOG_START","// GAMELOG_END")));
  ok("Sure?'s self-mark is gone (no sureMark, no ✅ I had it / ❌ Not quite)",!/sureMark|I had it|Not quite/.test(cut("// SURE_START","// SURE_END").replace(/^\/\/.*$/gm,"")));
}

console.log("── 🐟 Go Fish ──");
{ const w=world("gofish",ANIMALS,{judge:"pick"}), c=w.c;
  c.gofishStart("Animals"); const st=c.S;
  ok("the round reads the kid's setting once: st.judge pick, 4 choices",st.judge==="pick"&&st.nch===4);
  c.gofishAsk(0); let t=st.turns[st.step.t]; const pid=t.pid, nm=nameOf(c,pid), appHad=st.app.indexOf(pid)>=0;
  let h=c.buildGofishHtml("#000");
  ok("the ask: the judge's 🗣 I said it (gameJudgeSaid), not the honor tap; the line asks to say it first",t.judge==="pick"&&t.gj&&/gameJudgeSaid\(\)/.test(h)&&!/gofishSaid\(\)/.test(h)&&/Say it out loud/.test(st.msg));
  c.gofishSaid(); h=c.buildGofishHtml("#000");
  ok("🗣 opens the choices (nothing settled): 4 choices, each with a 🔊 chip (a picture deck)",!t.done&&t.gj.step==="pick"&&t.gj.ch.length===4&&(h.match(/class="said-hear"/g)||[]).length===4);
  const tbl=st.table.length, hand=st.hand.length; const i=t.gj.ch.findIndex(x=>x.ok); c.gameJudgePick((i+1)%4);
  ok("a wrong pick: ok:false (first false, fail, the wrong answer kept), the bonk, \"It's <name>.\" said",t.done&&!t.first&&t.fail&&Object.keys(t.wrong).length===1&&w.dings.slice(-1)[0]==="bonk"&&w.said.slice(-1)[0].indexOf("It’s "+nm+".")===0);
  ok("…the card is NOT a pair yet: nothing on the table, still in the hand, the app's turn next",st.table.length===tbl&&st.hand.length===hand&&st.hand.indexOf(pid)>=0&&st.after==="app"&&(!appHad||st.app.indexOf(pid)>=0));
  h=c.buildGofishHtml("#000");
  ok("…the right one stays lit (✓) while the beat runs",/✓ /.test(h)&&h.indexOf(nm)>0);
  // play the round out, answering every judged card right
  let g=0;
  while(st.phase!=="done"&&g++<600){
    if(st.lock){ w.flush(); continue; }
    const sp=st.step; if(!sp){ w.flush(); continue; }
    if(sp.k==="ask") c.gofishAsk(0);
    else if(sp.k==="fish") c.gofishFish();
    else if(sp.k==="produce"){ const x=st.turns[sp.t]; if(x.gj) judge(w,x,true,()=>c.gofishSaid()); else c.gofishSaid(); }
    else if(sp.k==="find"){ const j=st.hand.indexOf(sp.pid); if(j>=0) c.gofishFindTap(j); else c.gofishGoFish(); }
  }
  const L=w.log();
  ok("the round finishes; ONE gameLog entry stamped judge:\"pick\"",st.phase==="done"&&L.length===1&&L[0].game==="gofish"&&L[0].judge==="pick");
  ok("…the missed ask is logged ok:false",L[0].items.some(x=>x.id===pid&&!x.ok&&!x.back));
  const goFish=st.turns.filter(x=>x.nolog);
  ok("a right \"Go fish!\" (the card not in the kid's hand) is NOT logged",goFish.length>0&&goFish.every(x=>x.act==="find"&&x.first)&&L[0].items.length===st.turns.filter(x=>!x.nolog).length);
}
{ const w=world("gofish",ANIMALS,{judge:"pick"}), c=w.c;
  c.gofishStart("Animals"); const st=c.S, pid=st.hand[0];
  st.hand.push(pid); const pond=st.pond.length;   // the kid just fished its pair
  c._gfProduce(st,pid,"fished"); const t=st.turns[st.step.t];
  c.gofishSaid(); const i=t.gj.ch.findIndex(x=>x.ok); c.gameJudgePick((i+1)%t.gj.ch.length);
  ok("a fished pair named wrong: not a pair yet — one copy back to the bottom of the pond, the app's turn",t.fail&&st.hand.filter(p=>p===pid).length===1&&st.pond.length===pond+1&&st.pond[0]===pid&&st.after==="app"&&!st.table.some(p=>p.pid===pid));
}
{ const w=world("gofish",ANIMALS,{judge:"pick"}), c=w.c; noNames(w);
  c.gofishStart("Animals"); c.gofishAsk(0); const st=c.S, t=st.turns[st.step.t];
  ok("the helper returns false (no other name) → the honor tap stays: 🗣 gofishSaid, counted right",!t.gj&&/gofishSaid\(\)/.test(c.buildGofishHtml("#000"))&&(c.gofishSaid(),t.done&&t.first));
}

console.log("── 🔴 Connect Four ──");
{ const w=world("four",ANIMALS,{judge:"type"}), c=w.c;
  c.fourStart("Animals"); const st=c.S;
  ok("st.judge = the kid's setting (type)",st.judge==="type");
  c.fourPickCol(3); const t=st.turns[st.open.t], o=st.open, nm=nameOf(c,t.pid);
  let h=c.buildFourHtml("#000");
  ok("type: the judge's box + Check; the answer is nowhere on screen before the kid answers",t.judge==="type"&&/gj-type-in/.test(h)&&/gameJudgeCheck\(\)/.test(h)&&h.indexOf(">"+nm+"<")<0&&h.indexOf('"'+nm+'"')<0);
  c.fourSaid();
  ok("🗣 on a type card does nothing (no self-report)",!t.done);
  c.gameJudgeTyped("zzz"); c.gameJudgeCheck();
  ok("a wrong typed answer = a double wrong: ok:false, fail, NO disc in that cell, \"It's <name>.\" said, the app moves next",t.done&&!t.first&&t.fail&&st.board[o.row][o.col]===0&&w.said.slice(-1)[0].indexOf("It’s "+nm+".")===0&&st.after==="app"&&st.of===1&&st.first===0);
  w.timers.shift()();
  ok("…the app's 🔴 disc drops",st.board.some(r=>r.some(v=>v===2))&&st.board.every(r=>r.every(v=>v!==1)));
}
{ const w=world("four",ANIMALS,{judge:"mom",mom:true}), c=w.c;
  c.fourStart("Animals"); const st=c.S; c.fourPickCol(2); const t=st.turns[st.open.t], o=st.open, nm=nameOf(c,t.pid);
  let h=c.buildFourHtml("#000");
  ok("mom: \"Show Mom the answer\" — the name hidden until Mom opens it",/gameJudgeMomShow\(\)/.test(h)&&h.indexOf(">"+nm+"<")<0);
  c.gameJudgeMomShow(); h=c.buildFourHtml("#000");
  ok("…Mom here: the name for Mom, ✓ / ✗",h.indexOf(">"+nm+"<")>0&&/gameJudgeMom\(true\)/.test(h));
  c.gameJudgeMom(true);
  ok("Mom ✓ → the kid's disc lands, first-try",t.done&&t.first&&st.board[o.row][o.col]===1&&st.first===1);
  // play the round out with every say card right
  let g=0; while(st.phase!=="done"&&g++<400){ if(st.lock){ w.flush(); continue; } if(st.open){ const x=st.turns[st.open.t]; judge(w,x,true,()=>c.fourSaid()); continue; }
    if(st.who==="kid"){ const col=[0,1,2,3,4,5,6].find(k=>c.c4Drop(st.board,k)>=0); c.fourPickCol(col); } else w.flush(); }
  const L=w.log();
  ok("the round's gameLog entry is stamped judge:\"mom\"",st.phase==="done"&&L.length===1&&L[0].game==="four"&&L[0].judge==="mom");
}

console.log("── 🚢 Battleship ──");
{ const w=world("ship",ANIMALS,{judge:"pick"}), c=w.c;
  c.shipStart("Animals"); const st=c.S;
  ok("7 tiles: find / name alternating; st.judge pick",st.grid.length===7&&st.judge==="pick"&&st.turns[1].act==="name");
  c.shipTap(st.grid.indexOf(st.turns[0].pid)); w.flush();
  const t=st.turns[1], nm=nameOf(c,t.pid); let h=c.buildShipHtml("#000");
  ok("the name act: the judge's 🗣 (gameJudgeSaid), the tile lit, the coordinate in the line",t.judge==="pick"&&/gameJudgeSaid\(\)/.test(h)&&!/shipSaid\(\)/.test(h)&&/ship-lit/.test(h)&&/What’s at [A-D]\d\? Say it out loud/.test(st.msg));
  c.shipSaid(); ok("🗣 → the choices",t.gj.step==="pick"&&/Tap what you said/.test(st.msg));
  const i=t.gj.ch.findIndex(x=>x.ok); c.gameJudgePick((i+1)%t.gj.ch.length);
  ok("a wrong name: ok:false, the bonk, \"It's <name>.\" (no Hit!), the tile sinks, it comes back once as a find",t.done&&!t.first&&w.dings.slice(-1)[0]==="bonk"&&w.said.slice(-1)[0]==="It’s "+nm+"."&&st.sunk[t.pid]===1&&st.turns.length===8&&st.turns[7].back&&st.turns[7].act==="find"&&st.turns[7].pid===t.pid);
  w.flush();
  let g=0; while(st.phase==="play"&&g++<40){ const x=st.turns[st.i]; if(st.lock){ w.flush(); continue; }
    if(x.act==="find") c.shipTap(st.grid.indexOf(x.pid)); else judge(w,x,true,()=>c.shipSaid()); w.flush(); }
  const last=st.turns[6], L=w.log();
  ok("the last find (one tile left) is forced: not logged, not a first shot — 5 of 6",last.act==="find"&&last.nolog===true&&st.of===6&&st.first===5);
  ok("the gameLog entry: stamped judge:\"pick\", the forced find left out, the missed name ok:false",L.length===1&&L[0].judge==="pick"&&L[0].items.length===7&&!L[0].items.some(x=>x.id===last.pid&&!x.back)&&L[0].items.some(x=>x.id===t.pid&&!x.ok&&!x.back));
}
{ const w=world("ship",ANIMALS,{judge:"pick"}), c=w.c; noNames(w);
  c.shipStart("Animals"); const st=c.S; c.shipTap(st.grid.indexOf(st.turns[0].pid)); w.flush();
  ok("no other name → the honor 🗣 stays on the name act",!st.turns[1].gj&&/shipSaid\(\)/.test(c.buildShipHtml("#000")));
}

console.log("── 🤔 Sure? then flip ──");
{ const w=world("sure",ANIMALS,{judge:"pick"}), c=w.c;
  c.sureStart("Animals"); const st=c.S, t=st.turns[0], nm=nameOf(c,t.pid);
  ok("the sure call first, no judge yet",t.step==="sure"&&!t.gj&&st.judge==="pick");
  c.sureCall(true); let h=c.buildSureHtml("#000");
  ok("👍 → the judge, BEFORE the flip: say it first, no flip, the name nowhere written",t.step==="produce"&&t.judge==="pick"&&/gameJudgeSaid\(\)/.test(h)&&!/class="sure-flip/.test(h)&&h.indexOf(">"+nm+"<")<0);
  c.sureSaid(); h=c.buildSureHtml("#000");
  ok("🗣 → the choices, still no flip, nothing said",t.gj.step==="pick"&&!/class="sure-flip/.test(h)&&/Tap what you said/.test(h)&&w.said.length===0);
  const i=t.gj.ch.findIndex(x=>x.ok), wrongTxt=t.gj.ch[(i+1)%t.gj.ch.length].text; c.gameJudgePick((i+1)%t.gj.ch.length); h=c.buildSureHtml("#000");
  ok("a wrong pick: ok:false → the flip is the confirm — the LOUD correction (sure), the pick struck through, the name said twice, ➡ Got it",t.done&&t.ok===false&&!t.first&&/sure-loud/.test(h)&&h.indexOf("<s>"+wrongTxt+"</s>")>0&&w.said.slice(-1)[0]===nm+". "+nm+"."&&/sureGotIt\(\)/.test(h)&&!/I had it/.test(h));
  c.sureGotIt();
  const t2=st.turns[1]; c.sureCall(false); c.sureSaid(); const j=t2.gj.ch.findIndex(x=>x.ok); c.gameJudgePick(j); h=c.buildSureHtml("#000");
  ok("a right pick → the flip shows and SAYS the name (the confirm), counted right",t2.ok===true&&t2.first&&/sure-ok/.test(h)&&w.said.slice(-1)[0]===nameOf(c,t2.pid));
  w.flush();
  let g=0; while(st.phase==="play"&&g++<40){ const x=st.turns[st.i]; c.sureCall(true); judge(w,x,true,()=>c.sureSaid()); w.flush(); }
  const L=w.log();
  ok("the round's gameLog entry is stamped judge:\"pick\"; the missed card is ok:false",st.phase==="done"&&L.length===1&&L[0].game==="sure"&&L[0].judge==="pick"&&L[0].items.some(x=>x.id===t.pid&&!x.ok&&!x.back));
}
{ const w=world("sure",ANIMALS,{judge:"type"}), c=w.c;
  c.sureStart("Animals"); const st=c.S, t=st.turns[0];
  c.sureCall(true); c.gameJudgeTyped(nameOf(c,t.pid).toUpperCase()+"  "); c.gameJudgeCheck();
  ok("type: the study session's typed match (capitals / spaces don't count) → right, then the flip",t.ok===true&&t.step==="flip");
}
{ const w=world("sure",ANIMALS,{judge:"pick"}), c=w.c; noNames(w);
  c.sureStart("Animals"); const st=c.S, t=st.turns[0]; c.sureCall(true);
  ok("no other name → the honor 🗣 (sureSaid) counts right and flips — no self-mark",!t.gj&&/sureSaid\(\)/.test(c.buildSureHtml("#000"))&&(c.sureSaid(),t.ok===true&&t.step==="flip"&&!/I had it/.test(c.buildSureHtml("#000"))));
}

console.log("── 💥 Kaboom ──");
{ const w=world("kaboom",ANIMALS,{judge:"pick"}), c=w.c;
  c.kaboomStart("Animals"); const st=c.S;
  ok("st.judge = pick",st.judge==="pick");
  c.kaboomDraw(); const t=st.turns[st.open.t], nm=nameOf(c,t.pid);
  ok("the first stick is a card (never KABOOM): the judge's 🗣",t.judge==="pick"&&/gameJudgeSaid\(\)/.test(c.buildKaboomHtml("#000"))&&!/kaboomSaid\(\)/.test(c.buildKaboomHtml("#000")));
  c.kaboomSaid(); const i=t.gj.ch.findIndex(x=>x.ok); c.gameJudgePick((i+1)%t.gj.ch.length);
  ok("a wrong pick = a double wrong: ok:false, fail, no stick for the pile, \"It's <name>.\" said",t.done&&!t.first&&t.fail&&st.pile.length===0&&st.first===0&&w.said.slice(-1)[0].indexOf("It’s "+nm+".")===0);
  w.flush();
  let g=0; while(st.phase!=="done"&&g++<200){ if(st.lock){ w.flush(); continue; } if(st.open){ judge(w,st.turns[st.open.t],true,()=>c.kaboomSaid()); continue; } if(st.phase==="play") c.kaboomDraw(); else w.flush(); }
  const L=w.log();
  ok("it comes back once at the end; the round is stamped judge:\"pick\"; the miss is ok:false",st.phase==="done"&&st.turns.some(x=>x.back&&x.pid===t.pid)&&L.length===1&&L[0].judge==="pick"&&L[0].items.some(x=>x.id===t.pid&&!x.ok&&!x.back));
}

console.log("── answer decks and the Off world are untouched ──");
{ const w=world("kaboom",MATH,{judge:"pick"}), c=w.c;
  c.kaboomStart("Math Facts"); c.kaboomDraw(); const st=c.S, t=st.turns[st.open.t];
  ok("a number back is still the number pad (no judge on a type act)",t.act==="type"&&!t.gj&&/kaboomKey\(/.test(c.buildKaboomHtml("#000")));
  const o=world("gofish",ANIMALS,{noJudge:true}).c; o.gofishStart("Animals"); o.gofishAsk(0);
  const ot=o.S.turns[o.S.step.t];
  ok("without GAMEJUDGE loaded: no st.judge, the honor tap as before",o.S.judge===undefined&&!ot.gj&&(o.gofishSaid(),ot.first===true));
}

console.log("── 📊 Scores: before judging ──");
{ const ctx={console}; vm.createContext(ctx);
  vm.runInContext(cut("const SC_RANK=","\n// History-shaped view")+"\n"+cut("// SCORESPAGE_START","// SCORESPAGE_END")+"\n"+cut("// SCORESGAMES_START","// SCORESGAMES_END"),ctx);
  const run=e=>vm.runInContext(e,ctx), scpRight=run("scpRight"), scgLearned=run("scgLearned"), scgStats=run("scgStats"), scgHtml=run("scgHtml");
  ok("the say-it games, exactly",JSON.stringify(run("SCP_SAY_GAMES"))==='{"gofish":1,"four":1,"ship":1,"sure":1,"kaboom":1,"jeop":1}');
  const it=(id,okv)=>({id:id,ok:okv,n:okv?1:2});
  const R=(game,items,judge)=>Object.assign({game:game,deck:"D",at:1,secs:60,why:"free",items:items},judge?{judge:judge}:{});
  const W={from:"20261102",to:"20261108"};
  const GL={ava:{"20261105":{a:R("gofish",[it("c1",true),it("c2",true)]),b:R("mole",[it("c3",true),it("c4",false)]),c:R("ship",[it("c5",true)],"pick"),d:R("jeop",[it("c6",true)]),e:R("which",[it("c7",false)])}}};
  const r=scpRight("ava",{},{},GL,W);
  ok("scpRight: the unstamped Go Fish and Jeopardy rounds are left out; the stamped Battleship round and the honest games count",r.games.n===4&&r.games.ok===2,r.games);
  ["four","sure","kaboom"].forEach(g=>{ ok("scpRight: an unstamped "+g+" round is left out; stamped it counts",scpRight("ava",{},{},{ava:{"20261105":{a:R(g,[it("x",true)])}}},W).games.n===0&&scpRight("ava",{},{},{ava:{"20261105":{a:R(g,[it("x",true)],"type")}}},W).games.n===1); });
  // learned through games: missed in the drill 11/01, right in a game 11/03, ✓ in the drill 11/06
  const cards=["g1","g2","g3"].map(id=>({id:id,status:"active",tier:"weekly",answer:"Name "+id}));
  const H={ava:{"20261101":{items:cards.map(c=>({id:c.id,result:"m"}))},"20261106":{items:cards.map(c=>({id:c.id,result:"c"}))}}};
  const GL2={ava:{"20261103":{a:R("gofish",[it("g1",true)]),b:R("gofish",[it("g2",true)],"pick"),c:R("mole",[it("g3",true)])}}};
  ok("learned through games: a right in an unstamped Go Fish round doesn't count; a stamped one does; an honest game (no stamp by design) still does",JSON.stringify(scgLearned("ava",cards,H,{},GL2).sort())==='["g2","g3"]');
  const s=scgStats("ava",{gameLog:GL,cards:[],today:"20261108"}), G=k=>s.games.find(g=>g.key===k);
  ok("the Games section: before-judging rounds in their own bucket (rounds counted, no Right %), the rest unchanged",G("gofish").rounds===0&&G("gofish").pct===null&&G("gofish").pre.rounds===1&&G("gofish").pre.n===2&&G("jeop").pre.rounds===1&&G("ship").rounds===1&&!G("ship").pre&&G("mole").rounds===1&&G("mole").pct===50&&!G("mole").pre&&G("which").rounds===1&&!G("which").pre);
  ok("…the summary counts every round played (5) but its first-try % only the counted cards (2 of 4)",s.total.rounds===5&&s.total.n===4&&s.total.pct===50);
  ok("…no deck carries a before-judging round",s.decks.every(d=>!d.games.gofish&&!d.games.jeop));
  const h=scgHtml(s,true,[]);
  ok("…shown grey with the label: '· before judging', 'not counted', one row each for Go Fish and Jeopardy",(h.match(/class="scg-pre"/g)||[]).length===2&&(h.match(/· before judging/g)||[]).length===2&&/not counted/.test(h)&&/Before judging = /.test(h));
  const preRows=(h.match(/<tr class="scg-pre"[\s\S]*?<\/tr>/g)||[]).map(x=>x.replace(/<[^>]*>/g," ").trim().split(/\s+/)[0]).sort();
  ok("…the grey rows are exactly Go Fish and Jeopardy; mole / which / the stamped Battleship are not labelled",JSON.stringify(preRows)==='["gofish","jeop"]',preRows);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
