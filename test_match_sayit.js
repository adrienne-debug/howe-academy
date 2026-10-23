/*
 * 🎤 Memory "say it first" / 🎯 "pick it first" (her yes 2026-10-23; PLAN_practice_games_2026-10-23.md build #1).
 * In Memory flip the board locks after the first tile of a turn until the kid answers: Say it (says it,
 * taps "I said it", THEN the app speaks the answer) or Pick it (three chips: the answer + two lures from the
 * same deck; a miss comes back in a clear-up round). Memory flip only; never touches the ladder.
 *   run:  node test_match_sayit.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fn(n){
  const i=src.indexOf("function "+n+"("); if(i<0) throw new Error("no function "+n);
  const eol=src.indexOf("\n",i); const line=src.slice(i,eol);
  let d=0; for(const ch of line){ if(ch==="{") d++; else if(ch==="}") d--; }
  if(d===0) return line;                                   // one-liner
  return src.slice(i,src.indexOf("\n}",i)+2);
}
const NAMES=["_matchPlain","_matchAsk","_matchLures","_matchItem","_matchGateBuild","_matchGateOpen","mastMatchSaid","mastMatchPick",
  "_matchGateClose","_matchBoardDone","_matchClearNext","_matchTone","matchDing","matchBonk","mastMatchThen","mastMatchSetThen",
  "mastMatchTap","mastMatchFinish","_matchElapsed","mastMatchPause","_matchEligible","mastMatchStart","_matchSpeakTile","_matchGateHtml"];

// A fresh sandbox per scenario: deck of × facts for a 4th grader (pick) or a picture deck for Pre-K (say).
function sandbox(o){
  o=o||{};
  const L={now:1000,timers:[],spoken:[],dbWrites:[],celebrated:[],re:0};
  const items=o.items||[
    {id:"m78",subject:"Multiplication",prompt:"7 × 8",answer:"56",status:"active"},
    {id:"m66",subject:"Multiplication",prompt:"6 × 6",answer:"36",status:"active"},
    {id:"m97",subject:"Multiplication",prompt:"9 × 7",answer:"63",status:"active"},
    {id:"m69",subject:"Multiplication",prompt:"6 × 9",answer:"54",status:"active"},
    {id:"m34",subject:"Multiplication",prompt:"3 × 4",answer:"12",status:"active"},
    {id:"m99",subject:"Multiplication",prompt:"9 × 9",answer:"81",status:"active"},
  ];
  const ctx={
    console, Math, Object, Array, String, parseFloat, isNaN, JSON, Promise,
    Date:{now:()=>L.now},
    setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    setInterval:()=>1, clearInterval:()=>{}, mastView:"match",
    masteryKid:o.kid||"ellis",
    masteryData:Object.assign({ellis:items,ellis_settings:o.settings||{}},o.data||{}),
    matchStyle:o.style||"memory", matchPairMode:o.pair||"two", matchState:null,
    mastDrillSettings:()=>({match_speak:!!o.speak}),
    _smTileVis:(it,noGlyph)=>(o.pics?'<img data-pic="'+it.id+'">':null),
    mastGetDef:(k,p)=>(o.defs?o.defs[p]:null),
    mastSpeak:t=>L.spoken.push(t),
    _mastRe:()=>{ L.re++; },
    db:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v])})},
    HA_LS:{setItem(){}},
    bbAlarmCtx:null, window:{}, bbAudioUnlock:()=>{ L.unlocked=(L.unlocked||0)+1; },
    ckGradeOf:k=>(o.grade===undefined?null:o.grade), kcLittle:k=>!!o.little,
    esc:s=>String(s||""), document:{getElementById:()=>({})},
    _showCelebration:(k,t,opts)=>L.celebrated.push([k,t,opts]),
    alert:m=>{ L.alert=m; },
  };
  vm.createContext(ctx);
  // _matchPairHtml as shipped: picture first, else the definition/answer text.
  vm.runInContext(fn("_matchPairHtml")+"\n"+NAMES.map(fn).join("\n"),ctx);
  ctx.L=L;
  const flush=()=>{ const t=L.timers.splice(0); t.forEach(x=>x.f()); };
  return {ctx,L,flush,run:code=>vm.runInContext(code,ctx)};
}

console.log("🎯 lures come from the same deck and are believable");
{
  const S=sandbox();
  const lures=S.run('_matchLures(masteryData.ellis[0], masteryData.ellis, c=>c.answer, 2).map(l=>l.k).sort()');
  ok("number answers: the two NEAREST values are the lures (7×8 → 54, 63)",JSON.stringify(lures)==='["54","63"]',lures);
  const txt=sandbox({items:[
    {id:"a",subject:"Roots",prompt:"bio",answer:"life",status:"active"},
    {id:"b",subject:"Roots",prompt:"geo",answer:"earth",status:"active"},
    {id:"c",subject:"Roots",prompt:"hydro",answer:"water",status:"active"},
    {id:"d",subject:"Roots",prompt:"photo",answer:"light",status:"active"},
    {id:"e",subject:"Roots",prompt:"vita",answer:"life",status:"active"},   // same meaning as bio
  ]});
  const got=txt.run('_matchLures(masteryData.ellis[0], masteryData.ellis, c=>c.answer, 2).map(l=>l.k)');
  ok("text answers: two lures, never the right answer, never a duplicate of it",got.length===2&&got.indexOf("life")<0&&got[0]!==got[1],got);
  const rule=sandbox({items:[
    {id:"r1",subject:"Rules",prompt:"Rule one",answer:"Capitalize names",status:"active"},
    {id:"r2",subject:"Rules",prompt:"Rule two",answer:"Capitalize names",status:"active"},
    {id:"r3",subject:"Rules",prompt:"Rule three",answer:"Capitalize names",status:"active"},
    {id:"r4",subject:"Rules",prompt:"Rule four",answer:"Capitalize names",status:"active"},
  ]});
  rule.run('matchState={deck:"Rules",style:"memory",pairMode:"two",then:"pick",asked:{},res:{},missed:[],tiles:[],cq:[]}');
  const g=rule.run('_matchGateBuild(matchState,{isPrompt:true},masteryData.ellis[0])');
  ok("a deck whose other cards share one meaning has no lure → that card falls back to Say it",g.kind==="say"&&!g.chips,g.kind);
}

console.log("👶 the age default and the saved choice");
{
  ok("1st grade → Say it",sandbox({grade:1}).run("mastMatchThen()")==="say");
  ok("4th grade → Pick it",sandbox({grade:4}).run("mastMatchThen()")==="pick");
  ok("no grade set, Pre-K (not school-age) → Say it",sandbox({little:true}).run("mastMatchThen()")==="say");
  ok("no grade set, school-age → Pick it",sandbox({}).run("mastMatchThen()")==="pick");
  ok("Mom's saved choice beats the age default",sandbox({grade:1,settings:{match_then:"pick"}}).run("mastMatchThen()")==="pick");
  const S=sandbox({grade:1});
  S.run('matchState={deck:"x"}; mastMatchSetThen("none")');
  ok("choosing writes ONLY mastery/<kid>_settings/match_then and resets the board",
    S.L.dbWrites.length===1&&S.L.dbWrites[0][0]==="mastery/ellis_settings/match_then"&&S.L.dbWrites[0][2]==="none"&&S.ctx.matchState===null,S.L.dbWrites);
  ok("a bad value is ignored",(S.run('mastMatchSetThen("loud"); masteryData.ellis_settings.match_then'))==="none");
}

console.log("🎯 Pick it: the first flip asks, the board waits, a miss comes back");
{
  const S=sandbox({grade:4});
  S.run('mastMatchStart("Multiplication")');
  const st=S.ctx.matchState;
  ok("a Memory round carries the then-step",st&&st.then==="pick"&&st.tiles.length===12,st&&st.then);
  ok("prompt tiles know their side",st.tiles.filter(t=>t.isPrompt).length===6);
  const first=st.tiles.findIndex(t=>t.isPrompt);
  S.run('mastMatchTap('+first+')');
  const g=st.gate;
  ok("the first flip opens the gate with three chips",g&&g.kind==="pick"&&g.chips.length===3,g&&g.kind);
  ok("a math fact asks for \"the answer\", not \"what it means\"",g.ask==="Pick the answer",g.ask);
  ok("…one chip is the answer, the lures are the two nearest facts",g.chips.filter(c=>c.ok).length===1&&g.chips.every(c=>/^\d+$/.test(c.html.replace(/<[^>]*>/g,""))),g.chips.map(c=>c.html));
  ok("the clock started and the tap unlocked audio",st.startTs===1000&&S.L.unlocked===1);
  const other=st.tiles.findIndex((t,i)=>i!==first&&!t.up);
  S.run('mastMatchTap('+other+')');
  ok("the board is locked while the gate is up",st.tiles[other].up===false&&st.sel===first);
  ok("pause can't open over the gate",(S.run("mastMatchPause(); matchState.pausedAt")==null));
  const wrong=g.chips.findIndex(c=>!c.ok), askedPid=g.pid;
  S.L.now=4000;
  S.run('mastMatchPick('+wrong+')');
  ok("a wrong chip = miss recorded, card queued for clear-up, bonk",st.res[askedPid]==="m"&&st.missed[0]===askedPid&&g.picked===wrong);
  ok("the chips lock after one pick",(S.run('mastMatchPick('+g.chips.findIndex(c=>c.ok)+'); matchState.gate.picked'))===wrong);
  S.flush();
  ok("…then the gate closes and its seconds come off the clock (3 s thinking → pausedTotal 3000)",st.gate===null&&st.pausedTotal===3000,[st.gate,st.pausedTotal]);
  // find the partner, then flip the same card first again: it is NOT asked twice
  const partner=st.tiles.findIndex((t,i)=>i!==first&&t.pid===askedPid);
  S.run('mastMatchTap('+partner+')');
  ok("the pair matches and lingers",st.tiles[first].matched&&st.tiles[partner].matched);
  S.flush();
  const second=st.tiles.findIndex(t=>!t.matched&&t.isPrompt);
  S.run('mastMatchTap('+second+')');
  ok("the next first-flip asks again (a new card)",st.gate&&st.gate.pid===st.tiles[second].pid);
  const right=st.gate.chips.findIndex(c=>c.ok);
  S.run('mastMatchPick('+right+')'); S.flush();
  ok("a right chip = first-try credit",st.res[st.tiles[second].pid]==="c");
  // non-matching second flip: both go back down; flipping that first card again does not re-ask
  const stranger=st.tiles.findIndex((t,i)=>!t.matched&&!t.up&&t.pid!==st.tiles[second].pid);
  S.run('mastMatchTap('+stranger+')'); S.flush();
  ok("a wrong hunt flips both back (classic concentration)",!st.tiles[second].up&&!st.tiles[stranger].up&&st.sel===-1);
  S.run('mastMatchTap('+second+')');
  ok("a card already asked this game is not asked again",st.gate===null&&st.tiles[second].up===true);
}

console.log("🧹 clear-up round, then the finish");
{
  const S=sandbox({grade:4});
  S.run('mastMatchStart("Multiplication")');
  const st=S.ctx.matchState;
  st.startTs=1000; st.res={m78:"m",m66:"c",m97:"c"}; st.missed=["m78"];
  st.tiles.forEach(t=>{ t.matched=true; t.up=true; });
  S.L.now=9000;
  S.run('_matchBoardDone(matchState)');
  ok("misses → clear-up phase, the clock stopped at board-clear",st.phase==="clearup"&&st.endTs===9000&&st.gate&&st.gate.clearup===true,st.phase);
  ok("the clear-up shows the question tile and three chips",/7 × 8/.test(st.gate.qhtml)&&st.gate.chips.length===3);
  ok("no finish line while the clear-up runs",!/right first try/.test(S.run('_matchGateHtml(matchState,"#000")'))&&S.L.dbWrites.length===0);
  const right=st.gate.chips.findIndex(c=>c.ok);
  S.run('mastMatchPick('+right+')'); S.flush();
  ok("after the last clear-up card the round finishes",st.phase==="done"&&st.gate===null);
  ok("first-try count = right ÷ asked (2 of 3)",st.firstTry===2&&st.ofN===3,[st.firstTry,st.ofN]);
  ok("the best is kept under its own key (… · memory · pick) and written as that one key",
    st.bestKey==="Multiplication · memory · pick"&&S.L.dbWrites.length===1&&S.L.dbWrites[0][0]==="mastery/ellis_settings/match_best"&&Object.keys(S.L.dbWrites[0][2])[0]===st.bestKey,S.L.dbWrites);
  ok("8 s round (9000 − 1000, nothing paused)",st.sec===8,st.sec);
  ok("a first best is confetti (no song, no points)",S.L.celebrated.length===1&&S.L.celebrated[0][2].noSong===true&&!S.L.celebrated[0][2].points,S.L.celebrated);
  // a clean sheet on a slower round still celebrates; a plain slower round does not
  const T=sandbox({grade:4,settings:{match_best:{"Multiplication · memory · pick":5}}});
  T.run('mastMatchStart("Multiplication")'); const t2=T.ctx.matchState;
  t2.startTs=1000; t2.res={m78:"c",m66:"c"}; t2.tiles.forEach(t=>{t.matched=true;}); T.L.now=20000;
  T.run('_matchBoardDone(matchState)');
  ok("every card right first try → confetti even without a best time; no best written",T.L.celebrated.length===1&&t2.isPB===false&&T.L.dbWrites.length===0);
  const U=sandbox({grade:4,settings:{match_best:{"Multiplication · memory · pick":5}}});
  U.run('mastMatchStart("Multiplication")'); const u2=U.ctx.matchState;
  u2.startTs=1000; u2.res={m78:"m",m66:"c"}; u2.missed=[]; u2.tiles.forEach(t=>{t.matched=true;}); U.L.now=20000;
  U.run('_matchBoardDone(matchState)');
  ok("a miss and a slower time → plain finish, no confetti",U.L.celebrated.length===0&&u2.phase==="done");
}

console.log("🎤 Say it: no chips, the app speaks AFTER the kid");
{
  const S=sandbox({grade:1,speak:true,pics:true,pair:"same"});
  S.run('mastMatchStart("Multiplication")');
  const st=S.ctx.matchState;
  ok("a Same-pair picture round for a little kid is Say it",st.then==="say");
  S.run('mastMatchTap(0)');
  ok("the first flip opens a Say gate, nothing spoken yet (the voice would hand over the answer)",st.gate&&st.gate.kind==="say"&&!st.gate.chips&&S.L.spoken.length===0,[st.gate&&st.gate.kind,S.L.spoken]);
  ok("it asks for the name of the picture",st.gate.ask==="Say its name",st.gate.ask);
  ok("the gate panel offers one big button and no chips",/I said it/.test(S.run('_matchGateHtml(matchState,"#000")'))&&!/mastMatchPick/.test(S.run('_matchGateHtml(matchState,"#000")')));
  S.run('mastMatchSaid()');
  ok("\"I said it\" → the app says the name, gate closes",S.L.spoken.length===1&&S.L.spoken[0]===S.ctx.masteryData.ellis.find(i=>i.id===st.tiles[0].pid).prompt&&st.gate===null,S.L.spoken);
  ok("the second tile of the turn is read aloud as before (voice on)",(S.run('mastMatchTap(1); L.spoken.length'))===2);
  st.tiles.forEach(t=>{t.matched=true;}); S.L.now=5000;
  S.run('_matchBoardDone(matchState)');
  ok("Say it keeps no clock to beat: no best, no best write, key … · say",st.isPB===false&&S.L.dbWrites.length===0&&st.bestKey==="Multiplication · memory · same · say",[st.isPB,st.bestKey]);
  const W=sandbox({grade:1,defs:{"7 × 8":"fifty-six"}});
  W.run('mastMatchStart("Multiplication")'); const w=W.ctx.matchState;
  const p=w.tiles.findIndex(t=>t.isPrompt), m=w.tiles.findIndex(t=>!t.isPrompt);
  W.run('mastMatchTap('+p+')');
  ok("word tile flipped → say the meaning (a definition) or the answer (a bare number), and the app speaks that",(()=>{ const wi=W.ctx.masteryData.ellis.find(i=>i.id===w.tiles[p].pid); const isDef=wi.prompt==="7 \u00D7 8"; return w.gate.ask===(isDef?"Say what it means":"Say the answer")&&w.gate.speak===(isDef?"fifty-six":wi.answer); })(),[w.gate.ask,w.gate.speak]);
  W.run('mastMatchSaid()'); W.run('mastMatchTap('+m+')'); W.flush();
  const w2=w.tiles.findIndex(t=>!t.isPrompt&&!t.up&&!t.matched);
  W.run('mastMatchTap('+w2+')');
  ok("meaning tile flipped first → \"Say the word\" and the app speaks the word",w.gate&&w.gate.ask==="Say the word"&&w.gate.speak===W.ctx.masteryData.ellis.find(i=>i.id===w.tiles[w2].pid).prompt,w.gate&&w.gate.ask);
}

console.log("⏭ untouched games");
{
  const S=sandbox({grade:4,speak:true,settings:{match_then:"none"}});
  S.run('mastMatchStart("Multiplication")');
  S.run('mastMatchTap(0)');
  ok("\"Just find pairs\" = no gate, the voice reads the tile on tap as before",S.ctx.matchState.gate===null&&S.L.spoken.length===1);
  const F=sandbox({grade:4,style:"match"});
  F.run('mastMatchStart("Multiplication")');
  F.run('mastMatchTap(0)');
  ok("Face-up never gates (every answer is already on the board)",F.ctx.matchState.then==="none"&&F.ctx.matchState.gate===null);
}

console.log("wiring");
ok("the Then row is drawn only inside the Memory-flip branch",/if\(matchStyle==="memory"\)\{\n\s*\/\/ MATCH_THEN[^\n]*\n\s*const th=mastMatchThen\(\);/.test(src));
ok("three Then choices: Say it first · Pick it first · Just find pairs",/mastMatchSetThen\(\\'say\\'\)/.test(src)&&/mastMatchSetThen\(\\'pick\\'\)/.test(src)&&/mastMatchSetThen\(\\'none\\'\)/.test(src));
ok("the gate panel renders under the board while a round runs",/if\(st\.gate&&!st\.endTs\) h\+=_matchGateHtml\(st,color\);/.test(src));
ok("the clear-up panel replaces the empty board",/else if\(st\.phase==="clearup"&&st\.gate\)\{\n\s*h\+=_matchGateHtml\(st,color\);/.test(src));
ok("Save to Scores records what was asked and missed",/then:st\.then\|\|"none",first:st\.firstTry\|\|0,of:st\.ofN\|\|0,missed:\(st\.missed\|\|\[\]\)\.slice\(\)/.test(src));
ok("no ladder write anywhere in the block",!/mastApplyScores|mastSaveResults|next_due|consecutive_correct/.test(src.slice(src.indexOf("// MATCH_THEN_START"),src.indexOf("// MATCH_THEN_END"))));
ok("the block is marked",src.indexOf("// MATCH_THEN_START")>0&&src.indexOf("// MATCH_THEN_END")>src.indexOf("// MATCH_THEN_START"));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
