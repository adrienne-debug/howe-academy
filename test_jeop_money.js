/*
 * 💵 Jeopardy money mode (her words 2026-11-08: "I like the idea of the fake money and betting to see if they win the game or if they
 * run out of money, kind of like the real game … more like Double Jeopardy"; follow the TV show's rules; Sure / Not sure retired).
 * A Jeopardy GAME RULE "mode": Off (the plain board, byte for byte) / Money. Money: $200–$1000 rows, Double Jeopardy $400–$2000, right
 * adds / wrong subtracts (the bank can go negative), 1 then 2 hidden Daily Doubles (never the top row, bet $5 up to the larger of the
 * bank and the round's top value, "True Daily Double" = all in), Final Jeopardy only with more than $0 (bet $0 up to the bank), the
 * final bank against the deck's best. Play money lives inside one game only — never points, Stars or the trophy shelf.
 * Runs the REAL code (WHICHONE + GAMELOG + GAMEGRID + GAMERULES + JEOPARDY + JPMONEY).
 *   run:  node test_jeop_money.js
 *   the Off snapshot was taken from main 2026-11-08 (e5cbab4):  JP_SNAP_SRC=<main's index.html> node test_jeop_money.js --snap
 *   Merged with SCORESGAMES (claude/scores-games-section, 2026-11-08): the snapshot is retaken on the merged tree. The ONLY difference
 *   from main is one new logging field — GAMELOG's why:"free" on the round's gameLog push (PLAN_scores_page §4 #3). Every screen,
 *   every word said, every sound and every other write is main's, byte for byte: the trace with that field taken out still hashes to
 *   main's snapshot (checked below). Off still changes nothing a kid or Mom sees.
 */
const fs=require("fs"), path=require("path"), vm=require("vm"), crypto=require("crypto");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const SNAP_ONLY=process.argv.indexOf("--snap")>=0;
const src=fs.readFileSync(process.env.JP_SNAP_SRC||path.join(__dirname,"index.html"),"utf8");
const cutIn=(s,a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return s.slice(i,j); };
const cut=(a,b)=>cutIn(src,a,b);
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

const P=(n,emoji,tier)=>({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:tier||"weekly"});
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const G=(f,ans,tier)=>({id:"g_"+f,subject:"German",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const ANIMALS=[P("cat","🐱","graduated"),P("dog","🐶","monthly"),P("cow","🐮","bi_weekly"),P("pig","🐷","weekly"),P("fox","🦊","every_other_day"),P("owl","🦉","daily"),P("hen","🐔","daily"),P("ant","🐜","weekly")];
const MATH=[M("7+8","15","monthly"),M("6+6","12","bi_weekly"),M("9+4","13","weekly"),M("5+5","10","every_other_day"),M("8+3","11","daily"),M("2+9","11","daily"),M("4+4","8","weekly")];
const GERMAN=[G("gut","well"),G("ich","I"),G("du","you"),G("ja","yes")];
const MATH3=[M("1+1","2"),M("1+2","3"),M("2+2","4")];

// ── a sandbox: the real blocks, a kid "k", a recording db, timers by hand ──
function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[], nodes={};
  const S=o.src||src, opt=(a,b)=>S.indexOf(a)>=0?"\n"+cutIn(S,a,b):"";
  const CODE=cutIn(S,"// WHICHONE_START","// WHICHONE_END")+"\n"+cutIn(S,"// GAMELOG_START","// GAMELOG_END")+"\n"+cutIn(S,"// GAMEGRID_START","// GAMEGRID_END")+"\n"+cutIn(S,"// GAMERULES_START","// GAMERULES_END")+"\n"+cutIn(S,"// JEOPARDY_START","// JEOPARDY_END")+opt("// JPWAGER_START","// JPWAGER_END")+opt("// JPMONEY_START","// JPMONEY_END");
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    document:{getElementById:id=>nodes[id]||(o.celeb&&id==="celeb-overlay"?{}:null),createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>true,renderAll(){},cap:s=>s,
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mstTodayKey:()=>"20261108",mastView:"jeop",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jeopState',{get:()=>jeopState,set:v=>{jeopState=v;}}); Object.defineProperty(this,'jeopPickDecks',{get:()=>jeopPickDecks,set:v=>{jeopPickDecks=v;}}); Object.defineProperty(this,'_jpRandom',{get:()=>_jpRandom,set:v=>{_jpRandom=v;}}); this.GAME_RULES=GAME_RULES;",ctx);
  ctx._jpRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,nodes,flush};
}
const backOf=(c,pid)=>c._whichBack(c.masteryData.k.find(x=>x.id===pid));
// answer the open card right (or wrong when bad=true), once
function answer(w,bad){
  const c=w.c, st=c.jeopState, t=st.turns[st.open.t];
  if(t.act==="say"){ c.jeopSaid(); return; }
  if(t.act==="type"){ const s=bad?"777":backOf(c,t.pid); for(const ch of s) c.jeopKey(ch); c.jeopCheck(); return; }
  const right=backOf(c,t.pid); c.jeopPickTap(bad?t.opts.findIndex(o=>o!==right&&!t.wrong[o]):t.opts.indexOf(right));
}

// ── OFF = main byte for byte: one scripted afternoon, every screen + every write + every word said, hashed ──
function offSession(S,raw){
  const log=[], snap=(w,tag)=>log.push(tag+"\n"+w.c.buildJeopHtml("#123456"));
  { const w=world(ANIMALS.concat(MATH,GERMAN),{src:S}), c=w.c;
    snap(w,"start"); c.jeopToggle("German"); snap(w,"toggle"); c.jeopPickDecks=["Animals","Math Facts"];
    c.jeopStart(); snap(w,"board"); const st=c.jeopState;
    let step=0, guard=0;
    while(st.phase!=="done"&&guard++<80){
      if(st.phase==="play"&&!st.open&&!st.lock){ const ci=st.cells.findIndex(x=>!x.done); c.jeopPickCell(ci); snap(w,"open"+ci); }
      if(st.open&&!st.lock){ const t=st.turns[st.open.t]; const bad=(step%4===1)||(step%7===3&&t.tries===1); answer(w,bad&&!t.back); step++; snap(w,"ans"+step); }
      w.flush(); snap(w,"beat"+step);
    }
    snap(w,"done"); log.push("writes "+JSON.stringify(w.writes.map(x=>[x[0],x[1],x[0]==="push"?Object.assign({},x[2],{at:0,secs:0}):x[2]])));
    log.push("said "+JSON.stringify(w.said)); log.push("dings "+JSON.stringify(w.dings));
    c.jeopStart(); snap(w,"again"); c.jeopStop(); snap(w,"stop");
  }
  { const w=world(GERMAN.concat(MATH3),{src:S,celeb:true,seed:9}), c=w.c;
    c.jeopPickDecks=["German"]; c.jeopStart(); const st=c.jeopState; let guard=0;
    while(st.phase!=="done"&&guard++<30){ if(!st.open&&st.phase==="play"){ c.jeopPickCell(st.cells.findIndex(x=>!x.done)); snap(w,"g-open"); } answer(w); snap(w,"g-ans"); w.flush(); }
    snap(w,"g-done"); log.push("g "+JSON.stringify(w.writes.map(x=>x[0]==="push"?[x[0],x[1]]:x))+JSON.stringify(w.said)+JSON.stringify(w.dings));
  }
  if(process.env.JP_SNAP_DUMP) fs.writeFileSync(process.env.JP_SNAP_DUMP,log.join("\n──\n"));
  if(raw) return log.join("\n──\n");
  return crypto.createHash("sha256").update(log.join("\n──\n")).digest("hex");
}
if(SNAP_ONLY){ console.log(offSession(src)); process.exit(0); }
const OFF_MAIN="f04c238f22c6e57fa7fcfefd227f7ce58477943ff9b205ece3dd52549fbeb763";   // offSession(main e5cbab4's index.html), 2026-11-08
const OFF_SNAP="61f179b2a99626b08c366f25d178fa8f8202e65dce655eb3fa2b36fd46cfe489";   // offSession(merged with SCORESGAMES), 2026-11-08 — main + why:"free"

// ── by text ──
const a=src.indexOf("// JPMONEY_START"), b=src.indexOf("// JPMONEY_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one JPMONEY block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// JPMONEY_START",a+1)<0&&src.indexOf("// JPMONEY_END",b+1)<0);
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,""), RULES=cut("const GAME_RULES={","\n};"), JP=cut("// JEOPARDY_START","// JEOPARDY_END");
const NAMES=/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|adrienne|dewalt|burris|howe/i;
ok("no kid's or family's name in the block, the rule, the Jeopardy block or this test's cards",!NAMES.test(blk)&&!NAMES.test((RULES.match(/  jeop:[\s\S]*?\]\]\}\],/)||[""])[0])&&!NAMES.test(JP)&&!NAMES.test(JSON.stringify(ANIMALS.concat(MATH,GERMAN,MATH3))));
ok("Sure / Not sure is retired: no JPWAGER block, no jeopSure / jpWager*, no st.wager anywhere",src.indexOf("JPWAGER_START")<0&&!/jeopSure|jpWager|jeopWagerOn|st\.wager/.test(src));
ok("the rule: GAME_RULES.jeop has ONE rule, 'mode', default off, options Off / Money — no 'wager', no Sure",/  jeop:\[\{key:"mode",label:"Play money\?",def:"off",opts:\[[^\n]*\n\s*\["off","Off",[^\n]*\n\s*\["money","Money",[^\n]*\]\]\}\],/.test(RULES)&&!/key:"wager"|Sure/.test((RULES.match(/  jeop:[\s\S]*?\]\]\}\],/)||[""])[0].replace(/\/\/.*$/gm,"")));
ok("writes of its own: ONE — match_best key '<board> · jeop money', update, guarded; the round's log through gameLogRound",(code.match(/db\.ref\(/g)||[]).length===1&&/if\(db&&!_dryRun\(\)\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)\.update\(\{\[(?:key|\(typeof haKey==="function"\?haKey\(key\):key\))\]:st\.bank\}\)/.test(code)&&/gameLogRound\(st\)/.test(code)&&!/\.set\(|\.remove\(|\.push\(\{|next_due|studyLog|consecutive_correct/.test(code.replace(/bets\.push|cells\.push|took\.push/g,"")));
ok("play money only: no real points, Star Bank, spins, trophies or bankDirect in the code",!/bankDirect|\bpts\b|points|starBank|addStars|spins|trophy|kidStars/i.test(code));
ok("every JEOPARDY hook is guarded (typeof … === \"function\") and marked 💵 JPMONEY",(JP.match(/💵 JPMONEY/g)||[]).length===18&&(JP.match(/typeof jpMoney\w+==="function"/g)||[]).length===15&&/if\(typeof jpMoneyStart==="function"\) jpMoneyStart\(jeopState\);/.test(JP));
ok("GAMELOG: one guarded line keeps mode, bank, bets and result on a money round",/if\(st\.game==="jeop"&&st\.money\)\{ e\.mode="money"; e\.bank=st\.bank; e\.bets=/.test(fnText("gameLogEntry")));
ok("the answer is still never shown, and judging is Jeopardy's own (jeopJudge untouched by money)",!/jeopJudge|_jpAnsOk/.test(code)&&!/It was|The answer (is|was)/.test(blk));
ok("Off = the snapshot: every screen, write, word said and sound of a scripted afternoon hashes to the merged tree's snapshot",offSession(src)===OFF_SNAP);
{ const tr=offSession(src,true), sha=s=>crypto.createHash("sha256").update(s).digest("hex");
  ok("…and = main byte for byte but for ONE logging field: the round's gameLog push carries why:\"free\" once; without it the trace hashes to main's snapshot",
    (tr.match(/"why":"free"/g)||[]).length===1&&sha(tr.replace(',"why":"free"',""))===OFF_MAIN); }

// ── money games ──
const MON=()=>({settings:{gameRules:{jeop:{mode:"money"}}}});   // a fresh settings object per world (match_best must not leak between games)
const deckOf=(nm,n,tier)=>Array.from({length:n},(_,i)=>({id:nm.replace(/\W/g,"")+"_"+i,subject:nm,prompt:(i+2)+"+"+(i+3),answer:String(2*i+5),status:"active",tier:tier||(["daily","every_other_day","weekly","bi_weekly","monthly","graduated"][i%6])}));
// drive a money game to its end. ans(st,t) → true (right first) | false (wrong once, then right) | "fail" (wrong twice); bet(st) → a number, "all" or null
function drive(w,ans,bet,stopAt){
  const c=w.c, st=c.jeopState; let g=0;
  while(st.phase!=="done"&&g++<400){
    if(stopAt&&stopAt(st)) return st;
    if(st.bet){ const v=bet?bet(st):null; if(v==="all") c.jeopBetAll(); else { if(v!=null) c.jeopBetSlide(v); c.jeopBetGo(); } continue; }
    if(st.open&&!st.lock){ const t=st.turns[st.open.t]; const r=t.back?true:ans(st,t); if(r===true) answer(w); else { answer(w,true); if(!t.done) answer(w,r==="fail"); } continue; }
    if(st.phase==="play"&&!st.open&&!st.lock){ const ci=st.cells.findIndex(x=>!x.done); if(ci>=0){ c.jeopPickCell(ci); continue; } }
    w.flush();
  }
  return st;
}
{ // values per row: 5 / 4 / 3-row decks, round 1 and Double Jeopardy
  const lab=(n)=>{ const w=world(deckOf("Facts",n),MON()), c=w.c; c.jeopStart(); const st=c.jeopState, h=c.buildJeopHtml("#000");
    const r1=(h.match(/class="jp-cell"[^>]*>([^<]*)</g)||[]).map(x=>x.replace(/.*>/,"").replace(/<$/,""));
    drive(w,()=>true,null,s=>s.round===2&&!s.lock); const r2=(c.buildJeopHtml("#000").match(/class="jp-cell"[^>]*>([^<]*)</g)||[]).map(x=>x.replace(/.*>/,"").replace(/<$/,""));
    return [st.rows,r1.join(" "),r2.join(" "),st.top]; };
  const L5=lab(5), L4=lab(4), L3=lab(3);
  ok("5-card deck: 5 rows $200 $400 $600 $800 $1,000; Double Jeopardy $400 … $2,000",L5[0]===5&&L5[1]==="$200 $400 $600 $800 $1,000"&&L5[2]==="$400 $800 $1,200 $1,600 $2,000"&&L5[3]===2000,L5);
  ok("4-card deck: 4 rows, same steps $200 … $800; doubled $400 … $1,600",L4[0]===4&&L4[1]==="$200 $400 $600 $800"&&L4[2]==="$400 $800 $1,200 $1,600",L4);
  ok("3-card deck: 3 rows $200 $400 $600; doubled $400 $800 $1,200",L3[0]===3&&L3[1]==="$200 $400 $600"&&L3[2]==="$400 $800 $1,200",L3);
  ok("PURE values + money format (a minus sign for below $0)",[0,1,2,3,4].map(r=>world([],{}).c.jpMoneyVal({round:1},r)).join()==="200,400,600,800,1000"&&world([],{}).c.jpMoneyVal({round:2},4)===2000&&world([],{}).c.jpMoneyFmt(-1400)==="−$1,400"&&world([],{}).c.jpMoneyFmt(12500)==="$12,500");
}
{ // Daily Doubles: count and placement over many boards
  let r1ok=true, r2ok=true, cols2=true, offNone=true;
  for(let seed=1;seed<=40;seed++){
    const w=world(deckOf("Facts",5).concat(deckOf("More",5)),Object.assign({seed:seed},MON())), c=w.c; c.jeopStart(); const st=c.jeopState;
    const d1=st.cells.filter(x=>x.dd); if(d1.length!==1||d1.some(x=>x.row===0)) r1ok=false;
    drive(w,()=>true,null,s=>s.round===2);
    const d2=st.cells.filter(x=>x.dd); if(d2.length!==2||d2.some(x=>x.row===0)) r2ok=false; if(d2.length===2&&d2[0].col===d2[1].col) cols2=false;
    const o=world(deckOf("Facts",5).concat(deckOf("More",5)),{seed:seed}); o.c.jeopStart(); if(o.c.jeopState.cells.some(x=>"dd" in x)||o.c.jeopState.money) offNone=false;
  }
  ok("round 1: exactly 1 Daily Double, never in the top row (40 boards)",r1ok);
  ok("Double Jeopardy: exactly 2, never in the top row, in different columns when there are 2+ columns",r2ok&&cols2);
  ok("Off: no Daily Double, no money on the state",offNone);
  const w=world(deckOf("Facts",3),Object.assign({seed:5},MON())); w.c.jeopStart(); drive(w,()=>true,null,s=>s.round===2);
  ok("a 1-column, 3-row board still fits its 2 Double Jeopardy Daily Doubles below the top row",w.c.jeopState.cells.filter(x=>x.dd&&x.row>0).length===2);
}
{ // the bank: right +, wrong −, below $0 allowed, the second try and the come-backs worth nothing
  const w=world(deckOf("Facts",5),MON()), c=w.c; c.jeopStart(); const st=c.jeopState;
  ok("Money board: bank $0, round 1, 'Jeopardy!' and the bank drawn big, values on the squares",st.money===true&&st.bank===0&&st.round===1&&/Jeopardy!/.test(c.buildJeopHtml("#000"))&&/Bank <span[^>]*>\$0</.test(c.buildJeopHtml("#000")));
  const plain=st.cells.findIndex(x=>!x.dd&&x.row===0); c.jeopPickCell(plain); answer(w);
  ok("right first: + the square's value ($200), 'That's it! +$200'",st.bank===200&&st.msg==="That’s it! +$200");
  w.flush();
  const p2=st.cells.findIndex(x=>!x.dd&&!x.done); const v2=c.jpMoneyVal(st,st.cells[p2].row); c.jeopPickCell(p2); answer(w,true);
  ok("wrong first: − the value at once, shown on the line; the card stays open for its second try",st.bank===200-v2&&st.msg===c.jpMoneyFmt(-v2)+" · Almost — try again!"&&st.open);
  answer(w); w.flush();
  ok("right on the second try: worth nothing (the show takes one response)",st.bank===200-v2);
  const w2=world(deckOf("Facts",5),MON()); w2.c.jeopStart(); const neg=drive(w2,()=>false);
  ok("every first answer wrong: the bank goes below $0 in BOTH rounds (−$3,000 then −$9,000), the game plays on",neg.bank===-9000&&neg.result==="out"&&neg.round===2,neg.bank);
  const w3=world(deckOf("Facts",5),MON()); w3.c.jeopStart(); const s3=w3.c.jeopState; drive(w3,(s,t)=>s.round===1&&t===s.turns[0]?"fail":true,null,s=>s.round===3);
  ok("a missed card's come-back at the end moves no money",(()=>{ const before=s3.bank; drive(w3,()=>true,()=>0); return s3.phase==="done"&&s3.bank===before&&s3.turns.filter(t=>t.back).length===1&&s3.turns.filter(t=>t.back).every(t=>t.paid==null); })());
}
{ // Daily Double bets
  const w=world(deckOf("Facts",5),Object.assign({seed:11},MON())), c=w.c; c.jeopStart(); const st=c.jeopState, dd=st.cells.findIndex(x=>x.dd);
  c.jeopPickCell(dd); let h=c.buildJeopHtml("#000");
  ok("a Daily Double asks the bet BEFORE the card: the slider, ±$100, Bet $N — no card, no answer controls, the category named",st.bet&&!st.open&&/Daily Double!/.test(h)&&/type="range" min="5" max="1000"/.test(h)&&/jeopBetStep\(100\)/.test(h)&&/id="jp-bet-go"/.test(h)&&!/class="jp-(key|card|opt)/.test(h)&&/Category: Facts/.test(h)&&/Daily Double! How much do you bet\?/.test(w.said.slice(-1)[0]));
  ok("with $0 in the bank there is no True Daily Double button (nothing to go all in with)",!/True Daily Double/.test(h));
  c.jeopPickCell(st.cells.findIndex(x=>!x.dd)); ok("no other square opens while the bet is pending",!st.open&&st.turns.length===0);
  ok("bet bounds: $5 up to the larger of the bank and the round's top value (TV: $1,000 / $2,000)",(()=>{ const B=c.jpMoneyBounds; return JSON.stringify(B({bank:0,top:1000},"dd"))==='{"min":5,"max":1000}'&&JSON.stringify(B({bank:-400,top:1000},"dd"))==='{"min":5,"max":1000}'&&JSON.stringify(B({bank:3400,top:1000},"dd"))==='{"min":5,"max":3400}'&&JSON.stringify(B({bank:1200,top:2000},"dd"))==='{"min":5,"max":2000}'&&JSON.stringify(B({bank:2600,top:2000},"final"))==='{"min":0,"max":2600}'; })());
  w.nodes["jp-bet-amt"]={textContent:""}; w.nodes["jp-bet-go"]={textContent:""};
  c.jeopBetSlide(5000); const hi=st.bet.val; c.jeopBetSlide(2); const lo=st.bet.val; c.jeopBetSlide(777);
  ok("the slider is held to the bounds in $5 steps, and its labels follow without a re-draw",hi===1000&&lo===5&&st.bet.val===775&&w.nodes["jp-bet-amt"].textContent==="$775"&&w.nodes["jp-bet-go"].textContent==="Bet $775");
  c.jeopBetStep(100); ok("+$100",st.bet.val===875); c.jeopBetStep(-100);
  c.jeopBetGo(); const t=st.turns[st.open.t];
  ok("Bet → the card opens with its controls; the bet rides on the turn",t.bet===775&&t.dd===true&&/You bet \$775\./.test(st.msg)&&/jp-key/.test(c.buildJeopHtml("#000")));
  answer(w,true);
  ok("a wrong Daily Double: − the bet, and the louder line kept from Sure / Not sure",st.bank===-775&&st.msg==="That was your Daily Double — look again!");
  answer(w,true);
  ok("…wrong twice: 'That was your Daily Double — we'll come back to that one.'",st.msg==="That was your Daily Double — we’ll come back to that one."&&st.bets.length===1&&JSON.stringify(st.bets[0])==='{"round":1,"kind":"dd","bet":775,"ok":false}');
  w.flush();
  // True Daily Double: all in
  const w2=world(deckOf("Facts",5),Object.assign({seed:11},MON())), c2=w2.c; c2.jeopStart(); const s2=c2.jeopState;
  drive(w2,()=>true,null,s=>!s.lock&&!s.open&&s.bank>=600&&!s.bet&&s.cells.some(x=>x.dd&&!x.done));
  const bankNow=s2.bank; c2.jeopPickCell(s2.cells.findIndex(x=>x.dd));
  ok("with money in the bank: '🔥 True Daily Double ($N)'",new RegExp("True Daily Double \\("+c2.jpMoneyFmt(bankNow).replace("$","\\$")+"\\)").test(c2.buildJeopHtml("#000")));
  c2.jeopBetAll(); answer(w2);
  ok("True Daily Double right: the whole bank doubles",s2.bank===bankNow*2&&s2.turns[s2.open.t].bet===bankNow);
}
{ // round 2, Final Jeopardy and its gate
  const w=world(deckOf("Facts",10),Object.assign({seed:4},MON())), c=w.c; c.jeopStart(); const st=c.jeopState, r1=st.cells.map(x=>x.pid);
  drive(w,()=>true,null,s=>s.round===2);
  ok("round 1 clear → 'Double Jeopardy!' with a new board from the same deck (cards not on round 1 when the deck has enough)",st.round===2&&w.said.indexOf("Double Jeopardy! Every square is worth double now.")>=0&&/Double Jeopardy!</.test(c.buildJeopHtml("#000"))&&st.cells.length===5&&st.cells.every(x=>r1.indexOf(x.pid)<0)&&st.of===10);
  drive(w,()=>true,null,s=>s.round===3);
  const h=c.buildJeopHtml("#000"), fin=c.masteryData.k.find(x=>x.id===st.final.pid);
  ok("Double Jeopardy clear with more than $0 → Final Jeopardy: the category named, bet $0 up to the bank, no board, no card yet",st.round===3&&st.bet&&st.bet.kind==="final"&&st.bet.min===0&&st.bet.max===st.bank&&/Final Jeopardy!/.test(h)&&/Category: Facts/.test(h)&&/type="range" min="0" max="9000"/.test(h)&&!/class="jp-cell/.test(h)&&!st.open&&/Bet it all/.test(h));
  ok("Final's card is the least-known card on the board's decks",fin&&fin.tier==="daily");
  c.jeopBetSlide(4000); c.jeopBetGo(); answer(w); drive(w,()=>true);
  ok("Final right: + the bet; the game ends: bank $13,000, 🏆 New record! You won $13,000",st.phase==="done"&&st.bank===13000&&st.result==="record"&&/New record! You won \$13,000/.test(c.buildJeopHtml("#000"))&&/Final \+\$4,000/.test(c.buildJeopHtml("#000")));
  ok("one Play again (the start screen's), above the finish",(c.buildJeopHtml("#000").match(/Play again/g)||[]).length===1);
  // a second game that doesn't beat it
  c.jeopStart(); const s2=c.jeopState; drive(w,(s,t)=>s.round!==1||t!==s.turns[0],()=>0);
  ok("a lower bank: '🎉 You won $N' with the record to beat, nothing written for the best",s2.result==="won"&&/You won \$/.test(c.buildJeopHtml("#000"))&&/Record to beat: \$13,000/.test(c.buildJeopHtml("#000"))&&w.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===1);
  // ≤ $0 after Double Jeopardy: no Final
  const w3=world(deckOf("Facts",5),MON()), c3=w3.c; c3.jeopStart(); const s3=drive(w3,()=>false);
  ok("$0 or less after Double Jeopardy: no Final Jeopardy — 💸 Out of money (the misses come back once first)",s3.phase==="done"&&s3.final===null&&s3.result==="out"&&/Out of money/.test(c3.buildJeopHtml("#000"))&&/no Final Jeopardy this time/.test(c3.buildJeopHtml("#000"))&&s3.turns.some(t=>t.back));
  ok("…and nothing is written for the best",w3.writes.filter(x=>x[1]==="mastery/k_settings/match_best").length===0);
  // exactly $0 after DJ → no Final either
  const w4=world(deckOf("Facts",5),MON()), c4=w4.c; c4.jeopStart(); const s4=c4.jeopState; drive(w4,()=>true,null,s=>s.round===2&&!s.lock);
  s4.bank=-s4.cells.reduce((n,x)=>n+c4.jpMoneyVal(s4,x.row),0)-0; drive(w4,()=>true,()=>null);
  ok("exactly $0 after Double Jeopardy: no Final (the show's rule is more than $0)",s4.bank===0&&s4.final===null&&s4.result==="out");
  // all in on Final and wrong → out of money after Final
  const w5=world(deckOf("Facts",5),MON()), c5=w5.c; c5.jeopStart(); const s5=drive(w5,(s,t)=>!t.fin,s=>s.bet.kind==="final"?"all":null);
  ok("all in on Final and wrong: $0 → 💸 Out of money (no 'no Final' line)",s5.bank===0&&s5.result==="out"&&/Out of money/.test(c5.buildJeopHtml("#000"))&&!/no Final Jeopardy/.test(c5.buildJeopHtml("#000")));
}
{ // logging shape + dry run
  const w=world(deckOf("Facts",5),Object.assign({seed:6},MON())), c=w.c; c.jeopStart(); const st=drive(w,(s,t)=>!(s.round===1&&t===s.turns[1]),s=>s.bet.kind==="final"?1000:null);
  const gl=w.writes.filter(x=>x[0]==="push"), mb=w.writes.filter(x=>x[1]==="mastery/k_settings/match_best"), e=gl[0]&&gl[0][2];
  ok("ONE gameLog push at mastery/gameLog/<kid>/<day>: game jeop, right / miss per card (as before), + mode, bank, bets, result",gl.length===1&&gl[0][1]==="mastery/gameLog/k/20261108"&&e.game==="jeop"&&e.deck==="Facts"&&e.mode==="money"&&e.bank===st.bank&&e.result==="record"&&Array.isArray(e.bets)&&e.bets.length===4&&e.bets.every(x=>typeof x.bet==="number"&&typeof x.ok==="boolean"&&/^(dd|final)$/.test(x.kind))&&e.bets[3].kind==="final"&&e.bets[3].bet===1000&&e.items.length===12&&e.items.filter(i=>!i.ok&&!i.back).length===1&&e.items.filter(i=>i.back).length===1&&e.items.every(i=>Object.keys(i).every(k=>/^(id|ok|n|back|fail)$/.test(k))));
  ok("the best bank: ONE targeted update of match_best 'Facts · jeop money' — nothing else written (no points, no Stars, no trophy shelf)",mb.length===1&&JSON.stringify(mb[0][2])===JSON.stringify({"Facts · jeop money":st.bank})&&w.writes.length===2&&!("Facts · jeop" in c.masteryData.k_settings.match_best));
  const d=world(deckOf("Facts",5),Object.assign({dry:true},MON())); d.c.jeopStart(); drive(d,()=>true,()=>0);
  ok("?dryrun=1: a money game plays to the end, nothing is written",d.c.jeopState.phase==="done"&&d.writes.length===0);
  const s=world(deckOf("Facts",5),MON()); s.c.jeopStart(); s.c.jeopPickCell(s.c.jeopState.cells.findIndex(x=>x.dd)); s.c.jeopStop();
  ok("Stop mid-bet drops the game: nothing written",s.c.jeopState===null&&s.writes.length===0);
}
{ // the rules pop-up + the switch
  const w=world(deckOf("Facts",5)), c=w.c, h=c.gameRulesHtml("k","jeop");
  ok("the rules pop-up shows 'Play money?' with Off ✓ and Money — no Sure / Not sure, no Daily double rule",/Play money\?/.test(h)&&/✓ Off/.test(h)&&/>Money</.test(h)&&!/Sure|Daily double/.test(h)&&c.gameRule("k","jeop","mode")==="off");
  ok("the start screen: Off keeps today's line; Money says what the game is",/Answer it to clear it!/.test(c.buildJeopHtml("#000"))&&(()=>{ const m=world(deckOf("Facts",5),MON()); return /Play money, like the TV show!/.test(m.c.buildJeopHtml("#000"))&&!/Answer it to clear it!/.test(m.c.buildJeopHtml("#000")); })());
  c.gameRuleSet("k","jeop","mode","money");
  ok("Mom picks Money: one targeted set at mastery/<kid>_settings/gameRules/jeop/mode",w.writes.length===1&&JSON.stringify(w.writes[0])==='["set","mastery/k_settings/gameRules/jeop/mode","money"]'&&c.jeopMoneyOn("k"));
  const old=world(deckOf("Facts",5),{settings:{gameRules:{jeop:{wager:"on"}}}}); old.c.jeopStart();
  ok("a kid whose old 'Daily double' was on gets the plain board (the stored value is simply ignored)",!old.c.jeopState.money&&!old.c.jeopState.cells.some(x=>x.dd)&&old.c.gameRule("k","jeop","wager")===null);
  const mid=world(deckOf("Facts",5),MON()); mid.c.jeopStart(); mid.c.masteryData.k_settings.gameRules.jeop.mode="off";
  ok("a flip mid-game changes nothing until the next board",mid.c.jeopState.money===true&&/\$200/.test(mid.c.buildJeopHtml("#000")));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
