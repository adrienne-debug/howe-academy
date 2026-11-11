/*
 * 🎬 JEOROUND — the moment between Jeopardy rounds (her words 2026-11-10: "when jeopardy goes to the next round make it special and let
 * them know whats happening"). Rounds exist only on a 💵 Money board: Jeopardy! → Double Jeopardy! → Final Jeopardy! (more than $0 only).
 * Runs the REAL code (WHICHONE + GAMELOG + GAMEGRID + GAMERULES + JEOPARDY + JPMONEY + JPJUDGE + GAMEJUDGE, with and without JEOROUND).
 *   run:  node test_jeoround.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const games=fs.readFileSync(path.join(__dirname,"games.js"),"utf8");
const cutIn=(s,a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return s.slice(i,j); };
function fnIn(s,name){ const i=s.indexOf("function "+name+"("); if(i<0) return ""; const j=s.indexOf("\nfunction ",i+10), k=s.indexOf("\n// ",i+10); return s.slice(i,Math.min(j<0?1e9:j,k<0?1e9:k)); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

// ── the block ──
ok("one JEOROUND block in games.js, the last game block (after JIGSAW_END — JPJUDGE must stay straight after JPMONEY)",games.split("// JEOROUND_START").length===2&&games.split("// JEOROUND_END").length===2&&games.indexOf("// JIGSAW_END")<games.indexOf("// JEOROUND_START")&&games.indexOf("// JEOROUND_START")<games.indexOf("// JEOROUND_END"));
const blk=cutIn(games,"// JEOROUND_START","// JEOROUND_END"), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("the block cites her words and the date",/her words 2026-11-10: "when jeopardy goes to the next round make it special and let them\s*\n?\/\/ ?know whats happening"/.test(blk)||/2026-11-10/.test(blk)&&/make it special/.test(blk));
ok("writes nothing: no ref( / .set( / .update( / .remove( / db / localStorage in the block (its only .push is its own word list)",!/ref\(|\.set\(|\.update\(|\.remove\(|(?<!lines)\.push\(|\bdb\b|HA_LS|localStorage|gameLogRound|bankDirect/.test(code));
ok("prefers-reduced-motion: the animation is dropped, the words stay",/@media \(prefers-reduced-motion:reduce\)\{\.jr-ov,\.jr-ov \*\{animation:none!important\}/.test(blk));
ok("a re-draw keeps its place: animations ride a negative delay from the overlay's start",/--jr-t:-'\+el\+'ms/.test(blk)&&/animation-delay:var\(--jr-t\)/.test(blk));
ok("the flourish is the game's own tone (_matchTone), guarded — no AudioContext of its own",/typeof _matchTone==="function"\) _matchTone\(/.test(code)&&!/AudioContext/.test(code));

// ── the hooks: exactly once per round change ──
const re=fnIn(games,"jpMoneyRoundEnd");
const r1Line=(re.match(/if\(st\.round===1\)\{[^\n]*/)||[""])[0], r2Line=(re.match(/if\(st\.round===2&&st\.bank>0\)\{[^\n]*/)||[""])[0];
ok("jpMoneyRoundEnd: jeoRoundShow twice in all — once in the round 1 → Double Jeopardy branch, once in the → Final branch",(re.match(/jeoRoundShow\(st\)/g)||[]).length===2&&(r1Line.match(/jeoRoundShow\(st\)/g)||[]).length===1&&(r2Line.match(/jeoRoundShow\(st\)/g)||[]).length===1,re);
ok("…after the round is built (jpMoneyRound2 / jpMoneyFinal first), Final's only when Final really started",r1Line.indexOf("jpMoneyRound2(st)")<r1Line.indexOf("jeoRoundShow")&&/const fin=jpMoneyFinal\(st\); if\(fin&&typeof jeoRoundShow==="function"\) jeoRoundShow\(st\); return fin;/.test(r2Line));
ok("nowhere else calls jeoRoundShow",(games.replace(blk,"").match(/jeoRoundShow\(/g)||[]).length===2);
ok("buildJeopHtml draws the overlay from the state (one guarded line); jeopResume clears it",(fnIn(games,"buildJeopHtml").match(/if\(st\.jr&&typeof jeoRoundHtml==="function"\) h\+=jeoRoundHtml\(st\);/g)||[]).length===1&&/if\(st\.jr&&typeof jeoRoundClear==="function"\) jeoRoundClear\(st\);/.test(fnIn(games,"jeopResume")));

// ── a sandbox (test_jeop_money.js's world), with or without JEOROUND ──
function world(items,o){
  o=o||{};
  const writes=[], said=[], tones=[], timers=[];
  const S=src, opt=(a,b)=>S.indexOf(a)>=0?"\n"+cutIn(S,a,b):"";
  const CODE=cutIn(S,"// WHICHONE_START","// WHICHONE_END")+"\n"+cutIn(S,"// GAMELOG_START","// GAMELOG_END")+"\n"+cutIn(S,"// GAMEGRID_START","// GAMEGRID_END")+"\n"+cutIn(S,"// GAMERULES_START","// GAMERULES_END")+"\n"+cutIn(S,"// JEOPARDY_START","// JEOPARDY_END")+opt("// JPMONEY_START","// JPMONEY_END")+opt("// JPJUDGE_START","// JPJUDGE_END")+opt("// GAMEJUDGE_START","// GAMEJUDGE_END")+(o.noJr?"":"\n"+cutIn(S,"// JEOROUND_START","// JEOROUND_END"));
  const clock={t:1e12};
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,parseInt,isNaN,Date:{now:()=>clock.t},setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:()=>null,createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
    _dryRun:()=>false,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>{},matchBonk:()=>{},_matchTone:(f)=>tones.push(f.join(",")),_showCelebration(){},
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mstTodayKey:()=>"20261110",mastView:"jeop",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jeopState',{get:()=>jeopState,set:v=>{jeopState=v;}}); Object.defineProperty(this,'_jpRandom',{get:()=>_jpRandom,set:v=>{_jpRandom=v;}});",ctx);
  ctx._jpRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } }, step=()=>{ const f=timers.shift(); if(f) f(); };   // step: one beat at a time, so a round change is seen before its overlay's clock runs
  return {c:ctx,writes,said,tones,timers,flush,step,clock};
}
const MON=()=>({settings:{gameRules:{jeop:{mode:"money"}}}});
const deckOf=(nm,n)=>Array.from({length:n},(_,i)=>({id:nm.replace(/\W/g,"")+"_"+i,subject:nm,prompt:(i+2)+"+"+(i+3),answer:String(2*i+5),status:"active",tier:["daily","every_other_day","weekly","bi_weekly","monthly","graduated"][i%6]}));
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
function answer(w,bad){
  const c=w.c, st=c.jeopState, t=st.turns[st.open.t];
  if(t.act==="say"){ c.jeopSaid(); return; }
  if(t.act==="type"){ const s=bad?"777":backOf(c,t.pid); for(const ch of s) c.jeopKey(ch); c.jeopCheck(); return; }
  const right=backOf(c,t.pid); c.jeopPickTap(bad?t.opts.findIndex(x=>x!==right&&!t.wrong[x]):t.opts.indexOf(right));
}
// play every square (right, or wrong twice when bad(st,t)), flushing beats, until stopAt(st)
function drive(w,bad,stopAt){
  const c=w.c, st=c.jeopState; let g=0;
  while(st.phase!=="done"&&g++<400){
    if(stopAt&&stopAt(st)) return st;
    if(st.bet){ c.jeopBetGo(); continue; }
    if(st.open&&!st.lock){ const t=st.turns[st.open.t]; if(!t.back&&bad&&bad(st,t)){ answer(w,true); if(!t.done) answer(w,true); } else answer(w); continue; }
    if(st.phase==="play"&&!st.open&&!st.lock){ const ci=st.cells.findIndex(x=>!x.done); if(ci>=0){ c.jeopPickCell(ci); continue; } }
    w.step();
  }
  return st;
}
const OV=/class="jr-ov"/;

{ // round 1 → Double Jeopardy
  const w=world(deckOf("Facts",10),Object.assign({seed:4},MON())), c=w.c; c.jeopStart(); const st=c.jeopState;
  drive(w,null,s=>s.round===2);
  const h=c.buildJeopHtml("#000");
  ok("round 1 clear → the overlay is up for round 2, once (one flourish)",st.round===2&&st.jr&&st.jr.round===2&&OV.test(h)&&w.tones.length===1&&st.jrDone[2]===1);
  ok("it says 'Round 2' + 'Double Jeopardy!' + the real values + the Daily Doubles hidden",/<div class="jr-kick">Round 2<\/div><div class="jr-name">Double Jeopardy!<\/div>/.test(h)&&/Every square is worth double now: \$400 to \$2,000\./.test(h)&&/2 Daily Doubles are hiding on the board\./.test(h));
  ok("the bank and the squares right the first time, side by side",new RegExp('Your bank</div><div class="jr-stat-v">'+c.jpMoneyFmt(st.bank).replace("$","\\$")+'</div>').test(h)&&/Right the first time<\/div><div class="jr-stat-v">5 of 5<\/div>/.test(h));
  ok("a 'Let's go!' button and a tap anywhere both move on",/onclick="event\.stopPropagation\(\);jeoRoundGo\(\)">Let\u2019s go!<\/button>/.test(h)&&/class="jr-ov"[^>]*onclick="jeoRoundGo\(\)"/.test(h));
  ok("JPMONEY's own spoken line is kept (said once, unchanged)",w.said.filter(x=>x==="Double Jeopardy! Every square is worth double now.").length===1);
  ok("idempotent: a second call for the same round change does nothing (no second flourish, no new timer)",(()=>{ const n=w.timers.length, jr=st.jr; return c.jeoRoundShow(st)===false&&w.tones.length===1&&w.timers.length===n&&st.jr===jr; })());
  ok("a re-draw mid-way keeps its place (negative delay from the start)",(()=>{ w.clock.t+=1500; return /style="--jr-t:-1500ms"/.test(c.buildJeopHtml("#000")); })());
  c.jeoRoundGo(); ok("'Let's go!' → the overlay is gone, the board is back",!st.jr&&!OV.test(c.buildJeopHtml("#000"))&&/class="jp-cell/.test(c.buildJeopHtml("#000")));
  c.jeoRoundGo(); ok("…a second tap does nothing",!st.jr);
}
{ // the board after the overlay is today's board, byte for byte (and nothing else is written or said)
  const A=world(deckOf("Facts",10),Object.assign({seed:4},MON())), B=world(deckOf("Facts",10),Object.assign({seed:4},MON(),{noJr:true}));
  A.c.jeopStart(); B.c.jeopStart(); drive(A,null,s=>s.round===2); drive(B,null,s=>s.round===2);
  A.flush(); B.flush();
  ok("the clock alone takes it down (after JR_MS)",!A.c.jeopState.jr);
  ok("then the Double Jeopardy board is exactly the one without this block",A.c.buildJeopHtml("#000")===B.c.buildJeopHtml("#000"));
  drive(A,null,s=>s.round===3); drive(B,null,s=>s.round===3); A.flush(); B.flush();
  ok("…and Final's bet screen too",A.c.buildJeopHtml("#000")===B.c.buildJeopHtml("#000"));
  drive(A); drive(B);
  ok("the whole game: same words said, same writes",JSON.stringify(A.said)===JSON.stringify(B.said)&&JSON.stringify(A.writes)===JSON.stringify(B.writes)&&A.writes.length>0);
}
{ // Double Jeopardy → Final
  const w=world(deckOf("Facts",10),Object.assign({seed:4},MON())), c=w.c; c.jeopStart(); const st=c.jeopState;
  drive(w,null,s=>s.round===3);
  const h=c.buildJeopHtml("#000");
  ok("Double Jeopardy clear with money → the overlay for round 3 (a second flourish, the lower one)",st.round===3&&st.jr&&st.jr.round===3&&OV.test(h)&&w.tones.length===2&&w.tones[1]==="392,523,659,784");
  ok("it says 'Round 3' + 'Final Jeopardy!' + the category + the real bet limit",/<div class="jr-kick">Round 3<\/div><div class="jr-name">Final Jeopardy!<\/div>/.test(h)&&/One last question\. The category is Facts\./.test(h)&&new RegExp("Bet from \\$0 up to "+c.jpMoneyFmt(st.bank).replace("$","\\$")+" \u2014 your whole bank\\.").test(h));
  ok("under it, Final's bet is waiting as before",st.bet&&st.bet.kind==="final"&&/Category: Facts/.test(h));
  drive(w); ok("the game ends with no third overlay",st.phase==="done"&&w.tones.length===2&&!OV.test(c.buildJeopHtml("#000")));
}
{ // out of money after Double Jeopardy: a 2-round game, no Final, no overlay for it
  const w=world(deckOf("Facts",10),Object.assign({seed:4},MON())), c=w.c; c.jeopStart(); const st=c.jeopState;
  drive(w,(s)=>true);
  ok("$0 or less after Double Jeopardy → no round 3 overlay (only round 2's)",st.phase==="done"&&st.result==="out"&&w.tones.length===1&&!st.jrDone[3]);
}
{ // the plain board has no rounds
  const w=world(deckOf("Facts",10),{seed:4}), c=w.c; c.jeopStart(); const st=c.jeopState;
  drive(w);
  ok("Off (no money): never an overlay, never a flourish, no jr state",st.phase==="done"&&w.tones.length===0&&!("jr" in st)&&!("jrDone" in st));
}
{ // parking / leaving
  const w=world(deckOf("Facts",10),Object.assign({seed:4},MON())), c=w.c; c.jeopStart(); const st=c.jeopState;
  drive(w,null,s=>s.round===2);
  c.jeopResume(); ok("parked mid-overlay → back to the board, not the overlay",!st.jr&&!OV.test(c.buildJeopHtml("#000")));
  const w2=world(deckOf("Facts",10),Object.assign({seed:4},MON())), c2=w2.c; c2.jeopStart(); const st2=c2.jeopState;
  drive(w2,null,s=>s.round===2); w2.clock.t+=5000;
  ok("away past JR_MS → it is simply gone when drawn again",!OV.test(c2.buildJeopHtml("#000"))&&!st2.jr);
  c2.jeopStop(); ok("Stop takes it with the round",c2.jeopState===null);
}
{ // PURE: the words come from the round's data
  const w=world([],{}), c=w.c;
  const T=(n,o)=>Object.assign({money:true,rows:3,bank:-200,first:1,cells:[{dd:true},{dd:false},{dd:true}],turns:[{done:true},{done:true},{done:true,back:true},{done:true}]},o);
  const r2=c.jeoRoundText(T(0,{round:2}));
  ok("round 2 of a 2-round game (3 rows, bank below $0): '$400 to $1,200', 2 Daily Doubles, bank −$200 marked, 1 of 3",r2&&r2.kicker==="Round 2"&&r2.name==="Double Jeopardy!"&&r2.lines[0]==="Every square is worth double now: $400 to $1,200."&&r2.lines[1]==="2 Daily Doubles are hiding on the board."&&r2.stats[0].value==="−$200"&&r2.stats[0].neg===true&&r2.stats[1].value==="1 of 3",r2);
  const r2b=c.jeoRoundText(T(0,{round:2,cells:[{dd:true}]}));
  ok("one Daily Double reads in the singular; none → no line",r2b.lines[1]==="1 Daily Double is hiding on the board."&&c.jeoRoundText(T(0,{round:2,cells:[]})).lines.length===1);
  const r3=c.jeoRoundText(T(0,{round:3,bank:3400,final:{deck:"States"}}));
  ok("the final round: the category and $0 up to the bank",r3&&r3.kicker==="Round 3"&&r3.name==="Final Jeopardy!"&&r3.lines[0]==="One last question. The category is States."&&r3.lines[1]==="Bet from $0 up to $3,400 \u2014 your whole bank."&&r3.stats[0].value==="$3,400"&&!r3.stats[0].neg,r3);
  ok("nothing for round 1 or a plain board",c.jeoRoundText(T(0,{round:1}))===null&&c.jeoRoundText(T(0,{round:2,money:false}))===null&&c.jeoRoundText(null)===null);
  ok("a deck name is escaped on screen",(()=>{ const st=T(0,{round:3,bank:100,final:{deck:"<b>x</b>"},jr:{round:3,t0:w.clock.t,seq:1}}); const h=c.jeoRoundHtml(st); return /&lt;b&gt;x&lt;\/b&gt;/.test(h)&&!/<b>x<\/b>/.test(h); })());
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
