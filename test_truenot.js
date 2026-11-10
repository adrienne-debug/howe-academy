/*
 * ✅ True / Not true (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "True / Not true swipe").
 * A card's front with a claim — its own back / name (true) or one of its deck's other backs (not true); swipe right = True, left = Not true.
 * ⚖️ TNBOTH (2026-11-08): each card is asked both ways in a round, never back to back; a card is right only when both calls are.
 * Mastered only (the gate tier, the Sprint rule). Wrong → bonk, nothing told, the card comes back once as a fresh statement.
 * gameLogRound (game "truenot"); match_best "<deck> · truenot" only when beaten; never the ladder. Runs the REAL code.
 *   run:  node test_truenot.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── by text ──
const a=src.indexOf("// TRUENOT_START"), b=src.indexOf("// TRUENOT_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one TRUENOT block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// TRUENOT_START",a+1)<0&&src.indexOf("// TRUENOT_END",b+1)<0);
ok("the games' own position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(sp+18,src.indexOf("// GOFISH_START"))));
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: match_best one key (guarded) + gameLogRound — nothing else, no set / remove / push of its own",/db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.first\}\)/.test(blk)&&/gameLogRound\(st\)/.test(blk)&&(code.match(/db\.ref\(/g)||[]).length===1&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/turns\.push|t\.push/g,"")));
ok("GAMES_LIST: True / Not true after Jeopardy (the games built alongside it may sit between), with park / restore / resume and decks for the grid",src.indexOf('{key:"jeop",')>0&&src.indexOf('{key:"jeop",')<src.indexOf('{key:"truenot",')&&/\n  \{key:"truenot",\s*emoji:"\\u\{2705\}",\s*label:"True \/ Not true",\s*view:"truenot",\s*available:k=>typeof tnDecks==="function"&&tnDecks\(_gamesItems\(k\),k\)\.length>0, render:c=>buildTnHtml\(c\),\n\s*park:\(\)=>tnState, restore:v=>\{ tnState=v\|\|null; \}, resume:\(\)=>tnResume\(\), decks:k=>typeof tnDecks==="function"\?tnDecks\(_gamesItems\(k\),k\):\[\]\},/.test(src));
ok("gamesCurrentKey / GAMEKID untouched (the entry does it)",!/truenot|tnState/i.test(fnText("gamesCurrentKey"))&&!/tnState|tnResume/.test(cut("// GAMEKID_START","// GAMEKID_END")));
ok("no lives, clock, points, leaderboard or opponent; the start tap unlocks audio",!/lives|hearts|leaderboard|bankDirect|steal|setInterval|opponent/i.test(code)&&/bbAudioUnlock\(\)/.test(blk));
ok("a miss tells nothing (never 'it was…'), and the right answer is never spoken after a miss",!/It was|The answer (is|was)|it\u2019s really/i.test(blk)&&/Not that one/.test(blk));
ok("every timer checks its own round and turn (a parked round never advances)",(code.match(/setTimeout\(/g)||[]).length===1&&/tnState===st&&st\.lock&&st\.i===at/.test(code));
ok("mastered only: the gate tier is read from the kid's settings and a card below it is not ready",/gate_tier\|\|"weekly"/.test(blk)&&/mastTierAtLeast\(it\.tier,tnGate\(kid\)\)/.test(blk));

// ── a sandbox: WHICHONE + GAMELOG + GAMEGRID + TRUENOT, a kid's cards, a recording db, timers by hand ──
const P=(n,emoji,tier,extra)=>Object.assign({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:tier||"monthly"},extra||{});
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"bi_weekly"});
const G=(f,ans,tier)=>({id:"g_"+f,subject:"German",prompt:f,answer:ans,status:"active",tier:tier||"monthly"});
const ANIMALS=[P("cat","🐱"),P("dog","🐶"),P("cow","🐮"),P("pig","🐷"),P("fox","🦊"),P("owl","🦉","daily"),P("bee","🐝","every_other_day"),P("ant","🐜","weekly")];
const MATH=[M("7+8","15"),M("6+6","12"),M("9+4","13"),M("5+5","10"),M("8+3","11","daily"),M("2+7","9","daily")];
const GERMAN=[G("gut","well"),G("ich","I"),G("du","you"),G("ja","yes")];
const LOW=[P("a1","🐱","daily"),P("a2","🐶","daily"),P("a3","🐮","daily"),P("a4","🐷","daily"),P("a5","🦊","every_other_day")];
const SAME=[M("1+3","4","monthly"),M("2+2","4","monthly"),M("3+1","4","monthly"),M("0+4","4","monthly"),M("4+0","4","monthly")];   // one back for the whole deck: no lure anywhere
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[];
  const CODE=cut("// WHICHONE_START","// WHICHONE_END")+"\n"+cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// TRUENOT_START","// TRUENOT_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push({f:f,ms:ms}); return timers.length; },
    document:{getElementById:()=>o.celeb?{}:null},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx._renders=(ctx._renders||0)+1; },bbAudioUnlock(){},momHere:()=>true,renderAll(){},
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mastTierAtLeast:(t,g)=>{ const O=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; return O.indexOf(t||"daily")>=O.indexOf(g||"weekly"); },
    mstTodayKey:()=>"20261103",mastView:o.view||"truenot",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'tnState',{get:()=>tnState,set:v=>{tnState=v;}}); Object.defineProperty(this,'_tnRandom',{get:()=>_tnRandom,set:v=>{_tnRandom=v;}}); this.TN_ROUND=TN_ROUND; this.TN_CARDS=TN_CARDS; this.TN_MIN=TN_MIN; this.TN_BEAT=TN_BEAT; this.TN_BEAT_WRONG=TN_BEAT_WRONG; this.WHICH_MIX=WHICH_MIX; this.__raw=()=>_gdRaw;",ctx);
  ctx._tnRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const t=timers.shift(); t.f(); } };
  return {c:ctx,writes,said,dings,timers,flush};
}
const item=(c,pid)=>c.masteryData.k.find(x=>x.id===pid);
// the right call for the open statement (or the wrong one)
const call=(c,bad)=>{ const st=c.tnState, t=st.turns[st.i]; c.tnSwipe(bad?!t.truth:t.truth); };

console.log("── which decks and cards play (pure) ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN).concat([{id:"s1",subject:"AAS Words",prompt:"red",status:"active",tier:"monthly"}])), c=w.c;
  const decks=c.tnDecks(c.masteryData.k);
  ok("decks: Animals (6 gated of 8), Math Facts (4 gated of 6), German (4) play; spelling never",JSON.stringify(decks)==="[\"Animals\",\"German\",\"Math Facts\"]",decks);
  const pool=c.tnPool(c.masteryData.k,"Animals");
  ok("the Sprint rule: only cards at the gate (weekly) or above — owl (daily) and bee (every other day) stay out, ant (weekly) is in",pool.length===6&&!pool.some(x=>x.id==="p_owl"||x.id==="p_bee")&&pool.some(x=>x.id==="p_ant"));
  ok("Math Facts: 4 of 6 gated",c.tnPool(c.masteryData.k,"Math Facts").length===4);
  const all=c._tnWhichPool(c.masteryData.k,"k");
  const lures=c.tnLures(ANIMALS[0],all,"picture");
  ok("lures: every other card of ITS deck with a different name (any tier — a lure is only a name)",lures.length===7&&lures.every(x=>x.subject==="Animals"&&x.id!=="p_cat"));
  const ml=c.tnLures(MATH[0],all,"answer");
  ok("answer mode: lures are the deck's other BACKS, one card per different back",ml.length===5&&ml.every(x=>x.answer!=="15")&&new Set(ml.map(x=>x.answer)).size===5);
  const lo=world(LOW);
  ok("a deck whose cards are still learning (below the gate) is not offered at all — a learning card never sees a false pairing",lo.c.tnDecks(lo.c.masteryData.k).length===0&&/No decks ready/.test(lo.c.buildTnHtml("#000")));
  const g=world(LOW,{settings:{gate_tier:"daily"}});
  ok("the kid's own gate tier is read (<kid>_settings.gate_tier)",g.c.tnGate("k")==="daily"&&g.c.tnDecks(g.c.masteryData.k).length===1);
  const same=world(SAME);
  ok("a deck whose cards all share one back has no lure → it is not offered (Which one? can't play it either)",same.c.tnDecks(same.c.masteryData.k).length===0);
  const off=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{truenot:false}}}});
  ok("🎮 GAMEGRID: a deck Mom turned off for True / Not true is not offered; turned off for Which one? only, it still plays here",JSON.stringify(off.c.tnDecks(off.c.masteryData.k))==="[\"Math Facts\"]"&&(()=>{ const w2=world(ANIMALS.concat(MATH),{settings:{gameDecks:{Animals:{which:false}}}}); return w2.c.tnDecks(w2.c.masteryData.k).length===2; })());
  ok("the grid's preload (asked raw) still lists a turned-off deck, so Mom can turn it back on",off.c.gameDeckCan("k",{key:"truenot",decks:k=>off.c.tnDecks(off.c.masteryData.k,k)}).indexOf("Animals")>=0);
  off.c.tnStart("Animals");
  ok("…and a turned-off deck cannot be started",off.c.tnState===null);
  ok("_gdRaw is put back after the pool is read",(c._tnWhichPool(c.masteryData.k,"k"),c.__raw()===false));
  ok("the old half-true run (tnTruths) is gone — every card is asked both ways now",typeof c.tnTruths==="undefined"&&typeof c.tnOrder==="function");
}
console.log("── a round of pictures (⚖️ TNBOTH: each card both ways) ──");
{ const w=world(ANIMALS), c=w.c;
  c.tnStart("Animals"); const st=c.tnState;
  const pids=[...new Set(st.turns.map(t=>t.pid))];
  ok("a round: TN_CARDS (5) of the 6 gated cards, each asked twice = TN_ROUND (10) statements; 5 of M is per card; the first claim said inside the tap",st&&st.phase==="play"&&c.TN_CARDS===5&&pids.length===5&&st.turns.length===10&&st.of===5&&w.said.length===1&&st.game==="truenot"&&st.kid==="k");
  ok("each card: one true statement and one with a same-deck lure",pids.every(p=>{ const two=st.turns.filter(t=>t.pid===p); return two.length===2&&two.filter(t=>t.truth).length===1&&two.find(t=>t.truth).cpid===p&&(()=>{ const f=two.find(t=>!t.truth); return f.cpid!==p&&item(c,f.cpid).subject==="Animals"&&item(c,f.cpid).prompt!==item(c,p).prompt; })(); }));
  ok("a card's two statements are never back to back",st.turns.every((t,i)=>i===0||st.turns[i-1].pid!==t.pid));
  const t0=st.turns[0];
  ok("what is said is the CLAIM's name (the lure's name on a false statement), and it is never written on the card",w.said[0]===item(c,t0.cpid).prompt&&c.buildTnHtml("#000").indexOf(">"+w.said[0]+"<")<0&&!ANIMALS.some(x=>c.buildTnHtml("#000").indexOf(">"+x.prompt+"<")>=0));
  ok("the card shows the picture, the two buttons and 🔊; 'Is this what you hear?'",/tn-vis/.test(c.buildTnHtml("#000"))&&/tnSwipe\(false\)/.test(c.buildTnHtml("#000"))&&/tnSwipe\(true\)/.test(c.buildTnHtml("#000"))&&/tnSayAgain/.test(c.buildTnHtml("#000"))&&/Is this what you hear/.test(c.buildTnHtml("#000")));
  call(c);
  ok("the right call on a card's FIRST statement → done, right, the ding, the fly-off; not yet a first (its pair is still to come), nolog",t0.done&&t0.right&&!t0.first&&t0.nolog&&st.first===0&&w.dings.slice(-1)[0]==="ding"&&st.lock&&st.fly===(t0.truth?"right":"left")&&/tn-fly-/.test(c.buildTnHtml("#000"))&&w.timers.length===1&&w.timers[0].ms===c.TN_BEAT);
  const n1=w.dings.length; c.tnSwipe(true); c.tnSwipe(false);
  ok("taps while it flies are ignored",w.dings.length===n1&&st.i===0);
  const s1=w.said.length; w.flush();
  ok("after the beat the next statement comes up and is said",st.i===1&&!st.lock&&st.fly===null&&w.said.length===s1+1);
  // play on: the right call everywhere, except the SECOND statement of card B (wrong) and the FIRST statement of card C (wrong)
  const B=st.turns[1].pid, C=pids.find(p=>p!==t0.pid&&p!==B);
  const firstOf=p=>st.turns.findIndex(t=>t.pid===p&&!t.back), secondOf=p=>st.turns.findIndex((t,i)=>t.pid===p&&!t.back&&i>firstOf(p));
  const badAt={[secondOf(B)]:1,[firstOf(C)]:1};
  let guard=0, sawWrong=false;
  while(st.phase==="play"&&guard++<30){ const i=st.i, bad=!!badAt[i]&&!st.turns[i].back; call(c,bad);
    if(bad&&!sawWrong){ sawWrong=true; const t=st.turns[i];
      ok("a wrong call → the bonk, 'Not that one', the card shakes, nothing told, the card queued to come back once",t.done&&!t.right&&!t.first&&w.dings.slice(-1)[0]==="bonk"&&st.shake&&/Not that one/.test(c.buildTnHtml("#000"))&&/tn-shake/.test(c.buildTnHtml("#000"))&&st.turns[st.turns.length-1].back&&st.turns[st.turns.length-1].pid===t.pid&&w.timers[0].ms===c.TN_BEAT_WRONG&&t.wrong[String(t.cpid)]===1); }
    w.flush(); }
  const sec=p=>st.turns[secondOf(p)];
  ok("both calls right → the card's first (on its second statement)",sec(t0.pid).first&&!st.turns[firstOf(t0.pid)].first);
  ok("first right, second wrong → not a first",!sec(B).first&&st.turns[firstOf(B)].right&&!sec(B).right);
  ok("first wrong, second right → not a first",!sec(C).first&&!st.turns[firstOf(C)].right&&sec(C).right);
  ok("the round ends after the two come-backs: 3 of 5 cards right both ways (a come-back counts for nothing)",st.phase==="done"&&st.first===3&&st.of===5&&st.turns.length===12&&st.turns.filter(t=>t.back).length===2);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  const items=gl.length?gl[0][2].items:[], main=items.filter(i=>!i.back);
  ok("writes: match_best ONE key (3); ONE gameLog push, game truenot, ONE item per card (5) + the 2 come-backs; ok only for both-right",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Animals · truenot\":3}"&&gl.length===1&&gl[0][2].game==="truenot"&&items.length===7&&main.length===5&&new Set(main.map(i=>i.id)).size===5&&main.filter(i=>i.ok).length===3&&!main.find(i=>i.id===B).ok&&!main.find(i=>i.id===C).ok&&main.find(i=>i.id===B).n===2&&main.find(i=>i.id===C).n===2&&w.writes.length===2);
  ok("the finish shows cards right both ways against the kid's own best; no confetti on a round with a miss",/3 of 5 cards right both ways/.test(c.buildTnHtml("#000"))&&/new best/.test(c.buildTnHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x)));
  c.tnStart("Animals"); const st2=c.tnState; guard=0;
  while(st2.phase==="play"&&guard++<30){ call(c); w.flush(); }
  ok("a clean round: 5 of 5, a new best written, 5 log items all ok",st2.first===5&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&(()=>{ const g=w.writes.filter(x=>x[0]==="push")[1][2].items; return g.length===5&&g.every(i=>i.ok&&i.n===1); })());
  c.tnStart("Animals"); const st3=c.tnState; guard=0;
  while(st3.phase==="play"&&guard++<30){ call(c); w.flush(); }
  ok("a best that is not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&st3.isPB===false&&st3.prevBest===5);
  c.tnStart("Animals"); const st4=c.tnState; guard=0;
  while(st4.phase==="play"&&guard++<30){ const t=st4.turns[st4.i]; call(c,!t.back); w.flush(); }
  const g4=w.writes.filter(x=>x[0]==="push")[3][2].items.filter(i=>!i.back);
  ok("both calls wrong → not a first, n counts both wrong calls (3)",st4.first===0&&g4.length===5&&g4.every(i=>!i.ok&&i.n===3));
  c.tnStart("Animals"); const st5=c.tnState; guard=0;
  while(st5.phase==="play"&&guard++<30){ c.tnSwipe(true); w.flush(); }
  ok("always tapping ✓ True: every card is half right → 0 cards counted (the old coin-flip 50% is gone)",st5.first===0&&w.writes.filter(x=>x[0]==="push")[4][2].items.filter(i=>!i.back).every(i=>!i.ok));
}
console.log("── tnOrder (pure): never back to back, every n, many seeds ──");
{ let bad=0, shape=0;
  for(let seed=1;seed<=300;seed++){ const w=world(ANIMALS,{seed:seed}), c=w.c;
    for(const n of [2,3,4,5]){ const o=c.tnOrder(n);
      if(o.length!==2*n) shape++;
      for(let k=0;k<n;k++){ const two=o.filter(x=>x.k===k); if(two.length!==2||two[0].truth===two[1].truth) shape++; }
      if(o.some((x,i)=>i>0&&o[i-1].k===x.k)) bad++; } }
  ok("300 seeds × n=2..5: each card twice, once true once not",shape===0,shape);
  ok("300 seeds × n=2..5: a card's two statements are never adjacent",bad===0,bad);
  const w=world(ANIMALS), c=w.c; c._tnRandom=()=>0;   // a worst-case random: every shuffle the same
  const o=c.tnOrder(4);
  ok("even with a stuck random the fallback order is valid",o.length===8&&!o.some((x,i)=>i>0&&o[i-1].k===x.k));
}
console.log("── answer mode, the Mix, the dry run, confetti ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN)), c=w.c;
  c.tnStart("Math Facts"); const st=c.tnState, t=st.turns[0], it=item(c,t.pid), cl=item(c,t.cpid);
  const h=c.buildTnHtml("#000");
  ok("answer mode: the FRONT is written big and said; the CLAIM is a written back (its own, or another card's)",h.indexOf(">"+it.prompt+"<")>0&&w.said[0]===it.prompt&&/tn-claim/.test(h)&&h.indexOf(">"+cl.answer+"<")>0&&/Do these go together/.test(h));
  ok("a false statement's claim is a different back of the same deck",st.turns.filter(x=>!x.truth).every(x=>item(c,x.cpid).answer!==item(c,x.pid).answer&&item(c,x.cpid).subject==="Math Facts"));
  c.tnStart("German"); const gs=c.tnState;
  ok("a language the voice can't say: nothing is said, no 🔊 button",w.said.length===1&&!/tnSayAgain\(\)" aria-label/.test(c.buildTnHtml("#000"))&&gs.turns.length===8&&gs.of===4);
  c.tnStart(c.WHICH_MIX); const mx=c.tnState;
  ok("Mix the decks: statements from more than one deck, each claim from the card's OWN deck",mx.mix&&new Set(mx.turns.map(t=>item(c,t.pid).subject)).size>=2&&mx.turns.every(t=>item(c,t.cpid).subject===item(c,t.pid).subject)&&mx.turns.length===c.TN_ROUND);
  ok("Change deck mid-round drops it: nothing written",(c.tnChangeDeck(),c.tnState===null&&w.writes.length===0));
  const d=world(ANIMALS,{dry:true}); d.c.tnStart("Animals"); let guard=0; while(d.c.tnState.phase==="play"&&guard++<20){ call(d.c); d.flush(); }
  ok("?dryrun=1: the round plays, nothing is written (the best stays in memory)",d.c.tnState.phase==="done"&&d.writes.length===0&&d.c.masteryData.k_settings.match_best["Animals \u00B7 truenot"]===5);
  const e=world(ANIMALS,{celeb:true}); e.c.tnStart("Animals"); guard=0; while(e.c.tnState.phase==="play"&&guard++<20){ call(e.c); e.flush(); }
  ok("with the overlay on the page, a clean round gets the small confetti (noSong)",e.dings.some(x=>x==="celeb:\u{2705} You called them all!"));
  const k=world(ANIMALS); k.c.tnStart("Animals"); k.c.masteryKid="other"; guard=0; while(k.c.tnState.phase==="play"&&guard++<20){ call(k.c); k.flush(); }
  ok("the finish saves to the round's OWN kid, not the kid picked now",k.writes.find(x=>x[0]==="update")[1]==="mastery/k_settings/match_best"&&k.writes.find(x=>x[0]==="push")[1]==="mastery/gameLog/k/20261103");
}
console.log("── resume (GAMEKID → GAMEKIT) ──");
{ const w=world(ANIMALS), c=w.c;
  c.tnStart("Animals"); const st=c.tnState; call(c);
  ok("mid-step: locked on the fly-off",st.lock&&st.i===0);
  const parked=st; c.tnState=null; w.flush();
  ok("a parked round's timer does nothing",parked.i===0&&parked.lock);
  c.tnState=parked; const n=w.said.length; c.tnResume();
  ok("resume settles the beat, moves to the next statement and says it",!parked.lock&&parked.i===1&&w.said.length===n+1);
  c.tnResume();
  ok("resume with nothing mid-step just says it again",parked.i===1&&w.said.length===n+2);
  c.mastView="which"; c.tnResume();
  ok("not on screen → no speech",w.said.length===n+2);
  c.mastView="truenot"; call(c); const n2=w.said.length; c.tnResume(); w.flush();
  ok("the old timer after a resume does nothing more",parked.i===2&&w.said.length===n2+1);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
