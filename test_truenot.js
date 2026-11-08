/*
 * ✅ True / Not true (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "True / Not true swipe").
 * A card's front with a claim — its own back / name (true) or one of its deck's other backs (not true); swipe right = True, left = Not true.
 * Mastered only (the gate tier, the Sprint rule). Wrong → bonk, nothing told, the card comes back once as a fresh statement.
 * gameLogRound (game "truenot"); match_best "<deck> · truenot" only when beaten; never the ladder. Runs the REAL code.
 *   run:  node test_truenot.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
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
  vm.runInContext(CODE+"\nObject.defineProperty(this,'tnState',{get:()=>tnState,set:v=>{tnState=v;}}); Object.defineProperty(this,'_tnRandom',{get:()=>_tnRandom,set:v=>{_tnRandom=v;}}); this.TN_ROUND=TN_ROUND; this.TN_MIN=TN_MIN; this.TN_BEAT=TN_BEAT; this.TN_BEAT_WRONG=TN_BEAT_WRONG; this.WHICH_MIX=WHICH_MIX; this.__raw=()=>_gdRaw;",ctx);
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
  const tr=c.tnTruths(10), tr7=c.tnTruths(7);
  ok("tnTruths: half true (the odd one true), shuffled",tr.length===10&&tr.filter(x=>x).length===5&&tr7.filter(x=>x).length===4);
}
console.log("── a round of pictures ──");
{ const w=world(ANIMALS), c=w.c;
  c.tnStart("Animals"); const st=c.tnState;
  ok("a round: every gated card once (6 here, fewer than TN_ROUND), 3 true / 3 not, the first claim said inside the tap",st&&st.phase==="play"&&st.turns.length===6&&st.of===6&&new Set(st.turns.map(t=>t.pid)).size===6&&st.turns.filter(t=>t.truth).length===3&&w.said.length===1&&st.game==="truenot"&&st.kid==="k");
  ok("a true statement's claim is the card itself; a false one's is another card of the deck with another name",st.turns.every(t=>t.truth?t.cpid===t.pid:(t.cpid!==t.pid&&item(c,t.cpid).subject==="Animals"&&item(c,t.cpid).prompt!==item(c,t.pid).prompt)));
  const t0=st.turns[0];
  ok("what is said is the CLAIM's name (the lure's name on a false statement), and it is never written on the card",w.said[0]===item(c,t0.cpid).prompt&&c.buildTnHtml("#000").indexOf(">"+w.said[0]+"<")<0&&!ANIMALS.some(x=>c.buildTnHtml("#000").indexOf(">"+x.prompt+"<")>=0));
  ok("the card shows the picture, the two buttons and 🔊; 'Is this what you hear?'",/tn-vis/.test(c.buildTnHtml("#000"))&&/tnSwipe\(false\)/.test(c.buildTnHtml("#000"))&&/tnSwipe\(true\)/.test(c.buildTnHtml("#000"))&&/tnSayAgain/.test(c.buildTnHtml("#000"))&&/Is this what you hear/.test(c.buildTnHtml("#000")));
  call(c);
  ok("the right call → done, first, the ding, the card flies the way it was swiped, the board locks for a beat",t0.done&&t0.first&&st.first===1&&w.dings.slice(-1)[0]==="ding"&&st.lock&&st.fly===(t0.truth?"right":"left")&&/tn-fly-/.test(c.buildTnHtml("#000"))&&w.timers.length===1&&w.timers[0].ms===c.TN_BEAT);
  const n1=w.dings.length; c.tnSwipe(true); c.tnSwipe(false);
  ok("taps while it flies are ignored",w.dings.length===n1&&st.i===0);
  const s1=w.said.length; w.flush();
  ok("after the beat the next statement comes up and is said",st.i===1&&!st.lock&&st.fly===null&&w.said.length===s1+1);
  const t1=st.turns[1]; call(c,true);
  ok("a wrong call → the bonk, 'Not that one', the card shakes, nothing told, and the card is queued to come back once",t1.done&&!t1.first&&st.first===1&&w.dings.slice(-1)[0]==="bonk"&&st.shake&&/Not that one/.test(c.buildTnHtml("#000"))&&/tn-shake/.test(c.buildTnHtml("#000"))&&st.turns.length===7&&st.turns[6].back&&st.turns[6].pid===t1.pid&&w.timers[0].ms===c.TN_BEAT_WRONG);
  ok("the wrong call is logged against the claim it fell for",t1.wrong[String(t1.cpid)]===1);
  w.flush();
  let guard=0; while(st.phase==="play"&&guard++<20){ call(c); w.flush(); }
  ok("the round ends after the come-back: 5 of 6 on the first swipe (the come-back counts for nothing)",st.phase==="done"&&st.first===5&&st.of===6);
  const mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), gl=w.writes.filter(x=>x[0]==="push"&&x[1]==="mastery/gameLog/k/20261103");
  ok("writes: match_best ONE key, update, only this game's key; ONE gameLog push with game truenot and every statement",mb.length===1&&mb[0][0]==="update"&&JSON.stringify(mb[0][2])==="{\"Animals · truenot\":5}"&&gl.length===1&&gl[0][2].game==="truenot"&&gl[0][2].items.length===7&&gl[0][2].items.filter(i=>i.ok).length===6&&gl[0][2].items.filter(i=>i.back).length===1&&gl[0][2].items.find(i=>!i.ok).n===2&&w.writes.length===2);
  ok("the finish shows the count against the kid's own best; no confetti on a round with a miss",/5 of 6 on the first swipe/.test(c.buildTnHtml("#000"))&&/new best/.test(c.buildTnHtml("#000"))&&!w.dings.some(x=>/celeb/.test(x)));
  c.tnStart("Animals"); const st2=c.tnState; guard=0;
  while(st2.phase==="play"&&guard++<20){ call(c); w.flush(); }
  ok("a clean round: 6 of 6, a new best written",st2.first===6&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2);
  c.tnStart("Animals"); const st3=c.tnState; guard=0;
  while(st3.phase==="play"&&guard++<20){ call(c); w.flush(); }
  ok("a best that is not beaten writes nothing more",w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===2&&st3.isPB===false&&st3.prevBest===6);
}
console.log("── answer mode, the Mix, the dry run, confetti ──");
{ const w=world(ANIMALS.concat(MATH,GERMAN)), c=w.c;
  c.tnStart("Math Facts"); const st=c.tnState, t=st.turns[0], it=item(c,t.pid), cl=item(c,t.cpid);
  const h=c.buildTnHtml("#000");
  ok("answer mode: the FRONT is written big and said; the CLAIM is a written back (its own, or another card's)",h.indexOf(">"+it.prompt+"<")>0&&w.said[0]===it.prompt&&/tn-claim/.test(h)&&h.indexOf(">"+cl.answer+"<")>0&&/Do these go together/.test(h));
  ok("a false statement's claim is a different back of the same deck",st.turns.filter(x=>!x.truth).every(x=>item(c,x.cpid).answer!==item(c,x.pid).answer&&item(c,x.cpid).subject==="Math Facts"));
  c.tnStart("German"); const gs=c.tnState;
  ok("a language the voice can't say: nothing is said, no 🔊 button",w.said.length===1&&!/tnSayAgain\(\)" aria-label/.test(c.buildTnHtml("#000"))&&gs.turns.length===4);
  c.tnStart(c.WHICH_MIX); const mx=c.tnState;
  ok("Mix the decks: statements from more than one deck, each claim from the card's OWN deck",mx.mix&&new Set(mx.turns.map(t=>item(c,t.pid).subject)).size>=2&&mx.turns.every(t=>item(c,t.cpid).subject===item(c,t.pid).subject)&&mx.turns.length===c.TN_ROUND);
  ok("Change deck mid-round drops it: nothing written",(c.tnChangeDeck(),c.tnState===null&&w.writes.length===0));
  const d=world(ANIMALS,{dry:true}); d.c.tnStart("Animals"); let guard=0; while(d.c.tnState.phase==="play"&&guard++<20){ call(d.c); d.flush(); }
  ok("?dryrun=1: the round plays, nothing is written (the best stays in memory)",d.c.tnState.phase==="done"&&d.writes.length===0&&d.c.masteryData.k_settings.match_best["Animals \u00B7 truenot"]===6);
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
