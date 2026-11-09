/*
 * MEMLOGFIX — Memory flip's honesty fixes (games honesty audit 2026-11-08 §4 #2 / §7 rank 3; her decision 11/8).
 *   1. ONE gameLog entry per Say-it board. Say it first + "pick what you said" (SAIDPICK) wrote each pick into st.sayTurns AND
 *      st.res; the board's end pushed one entry (_matchSaidLog, guarded on a throwaway object) and mastMatchFinish pushed a second
 *      (MATCHLOG), so every Pre-K–2nd pick counted twice in Right %, per-deck % and "learned through games". Now the picks ride
 *      in st.res to MATCHLOG's one entry; one guard (st.gameLogged). The old harness hid this by leaving gameLogMatchEntry out —
 *      this one loads the REAL finish chain.
 *   2. "Then" (say / pick / none) is Mom's: GAME_RULES.memory "then" in the 📜 rules pop-up, behind the Mom gate. The kid-facing
 *      row is gone; mastMatchSetThen needs momHere() and writes only when db && !_dryRun(). An old match_then keeps working.
 *   3. ?dryrun=1 is inert for the Voice toggle and "Save to Scores"; the Match header's best reads the round's full key.
 *   run:  node test_memory_log_fix.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fn(n){
  const i=src.indexOf("function "+n+"("); if(i<0) throw new Error("no function "+n);
  const eol=src.indexOf("\n",i); const line=src.slice(i,eol);
  let d=0; for(const ch of line){ if(ch==="{") d++; else if(ch==="}") d--; }
  if(d===0) return line;
  return src.slice(i,src.indexOf("\n}",i)+2);
}
function cut(a,b){ const i=src.indexOf(a); if(i<0) throw new Error("no "+a); return src.slice(i,src.indexOf(b,i)+b.length); }
const NAMES=["_matchPlain","_matchAsk","_matchLures","_matchItem","_matchGateBuild","_matchGateOpen","mastMatchSaid","mastMatchPick",
  "_matchGateClose","_matchBoardDone","_matchClearNext","_matchTone","matchDing","matchBonk","_matchThenDefault","mastMatchThen","mastMatchSetThen",
  "mastMatchTap","_matchBestKey","mastMatchFinish","_matchElapsed","mastMatchPause","_matchEligible","mastMatchStart","_matchSpeakTile","_matchGateHtml","_matchPairHtml",
  "_matchSayAge","matchSaidPickOn","_matchTtsOk","_matchSaidChoices","_matchSaidOpen","mastMatchSaidHear","mastMatchSaidPick","_matchSaidHtml",
  "mastMatchToggleSpeak","mastMatchLogResult","buildMatchHtml",
  "_grE","_grJ","gameRuleDefs","gameRule","gameRuleSet","gameRulesHtml","gameRulesRender",
  "gameLogDay","gameLogEntry","gameLogRound","gameLogMatchEntry"];   // ← gameLogMatchEntry IS loaded: the real finish path
const RULES=cut("const GAME_RULES={","\n};")+"\nlet gameRulesUI=null;";

const SUMS=[
  {id:"s1",subject:"Adding",prompt:"1 + 1",answer:"2",status:"active"},
  {id:"s2",subject:"Adding",prompt:"2 + 1",answer:"3",status:"active"},
  {id:"s3",subject:"Adding",prompt:"2 + 2",answer:"4",status:"active"},
  {id:"s4",subject:"Adding",prompt:"3 + 2",answer:"5",status:"active"},
  {id:"s5",subject:"Adding",prompt:"3 + 3",answer:"6",status:"active"},
];
function sandbox(o){
  o=o||{};
  const L={now:1000,timers:[],spoken:[],dbWrites:[],re:0,seed:7};
  const ctx={
    console, Object, Array, String, Number, RegExp, Set, parseFloat, isNaN, JSON, Promise,
    Math:Object.assign(Object.create(Math),{random:()=>{ L.seed=(L.seed*16807)%2147483647; return (L.seed-1)/2147483646; }}),   // seeded: boards compare byte for byte
    Date:Object.assign(function(){ return new Date(L.now); },{now:()=>L.now}),
    setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    setInterval:()=>1, clearInterval:()=>{}, mastView:"match",
    masteryKid:"kidA",
    masteryData:{kidA:o.items||SUMS, kidA_settings:o.settings||{}},
    matchStyle:o.style||"memory", matchPairMode:"two", matchState:null,
    mastDrillSettings:()=>({match_speak:false}), mastMatchDecks:()=>["Adding"],
    _smTileVis:()=>null, mastGetDef:()=>null,
    mastSpeak:t=>L.spoken.push(t),
    _mastRe:()=>{ L.re++; },
    db:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v]),push:v=>L.dbWrites.push([p,"push",JSON.parse(JSON.stringify(v))])})},
    HA_LS:{setItem(){}},
    bbAlarmCtx:null,
    window:{speechSynthesis:{}}, _ttsVoicesLoaded:()=>true, bbAudioUnlock:()=>{},
    ckGradeOf:()=>(o.grade===undefined?null:o.grade), kcLittle:()=>!!o.little,
    esc:s=>String(s==null?"":s).replace(/</g,"&lt;"), document:{getElementById:id=>id==="grules-panel"?null:{}},
    _showCelebration:()=>{}, alert:m=>{ L.alert=m; },
    momHere:()=>!!o.mom, _gdCanEdit:()=>!!o.mom, _dryRun:()=>!!o.dry,
    mstTodayKey:()=>"20261108", renderAll:()=>{}, MAST_KID_COL:{kidA:"#7c3aed"},
  };
  vm.createContext(ctx);
  vm.runInContext(RULES+"\n"+NAMES.map(fn).join("\n")+"\nthis.GAME_RULES=GAME_RULES;",ctx);
  ctx.L=L;
  const flush=()=>{ for(let k=0;k<5&&L.timers.length;k++){ const t=L.timers.splice(0); t.forEach(x=>x.f()); } };
  const run=c=>vm.runInContext(c,ctx);
  return {ctx,L,flush,run};
}
// Play a whole Say-it board: each card flipped, "I said it", a pick (missI = which cards are picked wrong), then its pair found.
function playSayBoard(S,missI){
  S.run('mastMatchStart("Adding")');
  const n=S.run('matchState.tiles.length/2'); let picks=0;
  for(let k=0;k<n;k++){
    const ix=S.run('(function(){ const st=matchState; const ix=st.tiles.findIndex(t=>!t.up&&!t.matched&&!st.asked[t.pid]); mastMatchTap(ix); return ix; })()');
    S.run('mastMatchSaid()');
    const g=S.run('matchState.gate');
    S.run('mastMatchSaidPick('+((missI||[]).indexOf(k)>=0?g.choices.findIndex(c=>!c.ok):g.choices.findIndex(c=>c.ok))+')'); picks++;
    S.flush();
    S.run('(function(){ const st=matchState, a=st.tiles['+ix+']; const j=st.tiles.findIndex((t,i)=>i!=='+ix+'&&t.pid===a.pid); mastMatchTap(j); })()');
    S.flush();
  }
  return {n,picks};
}

console.log("1 · one gameLog entry per Say-it board (the real finish path loaded)");
{
  const S=sandbox({little:true});
  ok("the harness has MATCHLOG's builder — the path the old test left out",S.run('typeof gameLogMatchEntry')==="function"&&S.run('typeof gameLogRound')==="function");
  ok("a Pre-K round is Say it first with pick-what-you-said on",S.run('mastMatchThen()')==="say"&&S.run('matchSaidPickOn("kidA")')===true);
  const r=playSayBoard(S,[0,2]);
  ok("the board finished",S.run('matchState.phase')==="done"&&S.run('!!matchState.endTs'));
  const push=S.L.dbWrites.filter(w=>w[1]==="push"&&w[0].indexOf("mastery/gameLog/")===0);
  ok("exactly ONE gameLog push for the board",push.length===1,S.L.dbWrites.map(w=>w[0]+" "+w[1]));
  const e=push[0]&&push[0][2]||{};
  ok("…with N items for N picks ("+r.picks+")",Array.isArray(e.items)&&e.items.length===r.picks&&r.picks===r.n,e.items);
  ok("…every card once",new Set((e.items||[]).map(i=>i.id)).size===r.picks);
  ok("…the two wrong picks are ok:false n:2, the rest ok:true n:1",(e.items||[]).filter(i=>!i.ok&&i.n===2).length===2&&(e.items||[]).filter(i=>i.ok&&i.n===1).length===r.picks-2,e.items);
  ok("…it is MATCHLOG's record: game memory, then say, the deck",e.game==="memory"&&e.then==="say"&&e.deck==="Adding"&&e.why==="free");
  ok("one device copy too (not two)",Object.keys(S.run('masteryData.gameLog.kidA["20261108"]')).length===1);
  ok("the guard is on the board itself (st.gameLogged)",S.run('matchState.gameLogged')===true);
  S.run('mastMatchFinish(); _matchBoardDone(matchState)');
  ok("a second finish / board-done writes no second entry",S.L.dbWrites.filter(w=>w[1]==="push").length===1);
  ok("Right % reads right: "+(r.picks-2)+" of "+r.picks+" first try",S.run('matchState.firstTry')===r.picks-2&&S.run('matchState.ofN')===r.picks);
  // Pick it first is unchanged: still one entry, its misses' clear-up adds nothing
  const P=sandbox({grade:4});
  P.run('mastMatchStart("Adding")');
  const n=P.run('matchState.tiles.length/2');
  for(let k=0;k<n;k++){
    const ix=P.run('(function(){ const st=matchState; const ix=st.tiles.findIndex(t=>!t.up&&!t.matched&&!st.asked[t.pid]); mastMatchTap(ix); return ix; })()');
    P.run('mastMatchPick(matchState.gate.chips.findIndex(c=>'+(k===0?'!c.ok':'c.ok')+'))'); P.flush();
    P.run('(function(){ const st=matchState, a=st.tiles['+ix+']; const j=st.tiles.findIndex((t,i)=>i!=='+ix+'&&t.pid===a.pid); mastMatchTap(j); })()'); P.flush();
  }
  ok("Pick it: the miss's clear-up round runs",P.run('matchState.phase')==="clearup");
  P.run('mastMatchPick(matchState.gate.chips.findIndex(c=>c.ok))'); P.flush();
  const pp=P.L.dbWrites.filter(w=>w[1]==="push");
  ok("Pick it: one push, N items (the clear-up re-ask is not scored twice)",P.run('matchState.phase')==="done"&&pp.length===1&&pp[0][2].items.length===n,pp.map(w=>w[2].items.length));
}
{
  ok("no second log path left: _matchSaidLog is gone",src.indexOf("function _matchSaidLog(")<0&&!/_matchSaidLog\(/.test(src));
  ok("the board's end pushes nothing itself",!/gameLogRound/.test(fn("_matchBoardDone")));
  const blk=cut("// ── \u{1F3AF} Match game","// WHICHONE_START");
  ok("in the whole Match / Memory code, gameLogRound is called once — mastMatchFinish's MATCHLOG line",(blk.replace(/\/\/[^\n]*/g,"").match(/gameLogRound\(/g)||[]).length===1&&(fn("mastMatchFinish").match(/gameLogRound\(st,gameLogMatchEntry\(st\)\)/g)||[]).length===1);   // code only, comments stripped
}

console.log("2 · Then is Mom's rule (📜 pop-up), not a kid's button");
{
  const age=o=>sandbox(o).run('mastMatchThen()');
  ok("defaults as today: grade 2 → say, grade 3 → pick, Pre-K → say, school-age no grade → pick",
    age({grade:2})==="say"&&age({grade:3})==="pick"&&age({little:true})==="say"&&age({})==="pick");
  ok("an old <kid>_settings/match_then keeps working",age({grade:1,settings:{match_then:"none"}})==="none"&&age({grade:5,settings:{match_then:"say"}})==="say");
  ok("Mom's rule beats an old match_then",age({grade:1,settings:{match_then:"none",gameRules:{memory:{then:"pick"}}}})==="pick");
  ok("a junk stored value falls back",age({grade:1,settings:{gameRules:{memory:{then:"loud"}}}})==="say");
  const M=sandbox({grade:1,mom:true});
  const pop=M.run('gameRulesHtml("kidA","memory")');
  ok("the 📜 pop-up lists Then first with say / pick / none pills",pop.indexOf("gameRuleSet('kidA','memory','then','say')")>0&&pop.indexOf("gameRuleSet('kidA','memory','then','pick')")>0&&pop.indexOf("gameRuleSet('kidA','memory','then','none')")>0&&pop.indexOf("'then'")<pop.indexOf("'saidpick'"));
  ok("…the kid's current value is lit",/aria-pressed="true"[^>]*>✓ Says it first</.test(pop));
  ok("Mom's tap writes this rule only",M.run('gameRuleSet("kidA","memory","then","none")')===true&&JSON.stringify(M.L.dbWrites)==='[["mastery/kidA_settings/gameRules/memory/then","set","none"]]',M.L.dbWrites);
  ok("…and the next board reads it",M.run('mastMatchStart("Adding"); matchState.then')==="none");
  const K=sandbox({grade:1,mom:false});
  const kpop=K.run('gameRulesHtml("kidA","memory")');
  ok("a kid sees the pop-up's pills disabled",/gameRuleSet\('kidA','memory','then','none'\)" disabled/.test(kpop)&&/Mom changes these/.test(kpop));
  ok("a kid can't set it through the pop-up",K.run('gameRuleSet("kidA","memory","then","none")')===false&&K.L.dbWrites.length===0);
  K.run('matchState={deck:"x"}');
  ok("a kid can't set it through mastMatchSetThen (momHere gate)",K.run('mastMatchSetThen("none")')===false&&K.L.dbWrites.length===0&&K.run('mastMatchThen()')==="say"&&K.run('matchState.deck')==="x");
  const M2=sandbox({grade:1,mom:true});
  M2.run('matchState={deck:"x"}');
  ok("Mom's mastMatchSetThen: this rule only, fresh board",M2.run('mastMatchSetThen("pick")')===true&&JSON.stringify(M2.L.dbWrites)==='[["mastery/kidA_settings/gameRules/memory/then","set","pick"]]'&&M2.run('matchState')===null);
  // the kid's Memory screen
  const B=sandbox({grade:4});
  const h=B.run('buildMatchHtml("#7c3aed")');
  ok("the kid's Memory screen has no Then row and no way to reach the setter",h.indexOf(">Then<")<0&&h.indexOf("mastMatchSetThen")<0&&h.indexOf("Just find pairs")<0&&h.indexOf(">Pairs<")>0);
  ok("nothing in the page calls mastMatchSetThen",(src.match(/mastMatchSetThen\(/g)||[]).length===1);
}

console.log("3 · dry run is inert; the header's best uses the full key");
{
  const D=sandbox({grade:1,mom:true,dry:true});
  D.run('mastMatchToggleSpeak()');
  ok("dry run: Voice toggles on this device only",D.L.dbWrites.length===0&&D.run('masteryData.kidA_settings.match_speak')===true);
  D.run('matchState={kid:"kidA",deck:"Adding",style:"memory",pairMode:"two",then:"say",endTs:5,sec:3,res:{},missed:[]}; mastMatchLogResult()');
  ok("dry run: Save to Scores keeps the local copy, pushes nothing",D.L.dbWrites.length===0&&D.run('masteryData.matchLog.kidA.length')===1&&D.run('matchState.logged')===true);
  D.run('matchState={deck:"x"}');
  ok("dry run: Mom's Then sets locally, writes nothing",D.run('mastMatchSetThen("none")')===true&&D.L.dbWrites.length===0&&D.run('mastMatchThen()')==="none");
  const W=sandbox({grade:1,mom:true});
  W.run('mastMatchToggleSpeak()');
  W.run('matchState={kid:"kidA",deck:"Adding",style:"memory",pairMode:"two",then:"say",endTs:5,sec:3,res:{},missed:[]}; mastMatchLogResult()');
  ok("live: Voice and Save to Scores write their one path each, as before",JSON.stringify(W.L.dbWrites.map(w=>[w[0],w[1]]))==='[["mastery/kidA_settings/match_speak","set"],["mastery/matchLog/kidA","push"]]',W.L.dbWrites);
  ok("finish and header share one key builder",/const key=_matchBestKey\(st\);/.test(fn("mastMatchFinish"))&&/\[_matchBestKey\(st\)\]/.test(fn("buildMatchHtml")));
  const H=sandbox({grade:4,settings:{match_best:{"Adding · memory":9,"Adding · memory · pick":12}}});
  H.run('mastMatchStart("Adding")');
  const hh=H.run('buildMatchHtml("#7c3aed")');
  ok("a Pick it board shows its own best (12s), not a plain round's (9s)",H.run('_matchBestKey(matchState)')==="Adding · memory · pick"&&hh.indexOf("best 12s")>0&&hh.indexOf("best 9s")<0);
  const F=sandbox({grade:4,style:"match",settings:{match_best:{"Adding":7}}});
  F.run('mastMatchStart("Adding")');
  ok("a Face-up board keeps its plain key (… no then part)",F.run('_matchBestKey(matchState)')==="Adding"&&F.run('buildMatchHtml("#7c3aed")').indexOf("best 7s")>0);
}

console.log("4 · a kid on the default plays the same board");
{
  // the old rule, as it shipped before this change (match_then, else grade ≤ 2 says, else Pre-K says)
  const oldThen=o=>{ const s=o.settings||{}; if(["say","pick","none"].indexOf(s.match_then)>=0) return s.match_then; if(o.grade!=null) return o.grade<=2?"say":"pick"; return o.little?"say":"pick"; };
  const cases=[{grade:0},{grade:1},{grade:2},{grade:3},{grade:6},{little:true},{},{grade:4,settings:{match_then:"say"}},{grade:1,settings:{match_then:"none"}}];
  ok("every grade / Pre-K / old-setting case gets the same Then as before",cases.every(o=>sandbox(o).run('mastMatchThen()')===oldThen(o)),cases.map(o=>[oldThen(o),sandbox(o).run('mastMatchThen()')]));
  const render=o=>{ const S=sandbox(o); const pre=S.run('buildMatchHtml("#7c3aed")'); S.run('mastMatchStart("Adding")'); S.run('mastMatchTap(0)'); return pre+"\n"+S.run('buildMatchHtml("#7c3aed")'); };
  [[{grade:1},"say"],[{grade:4},"pick"]].forEach(([o,v])=>{
    const def=render(o);
    ok("default "+v+" kid: the board is byte-identical to the same kid with that Then saved the old way",def===render(Object.assign({},o,{settings:{match_then:v}})));
    ok("…and to Mom saving it as the new rule",def===render(Object.assign({},o,{settings:{gameRules:{memory:{then:v}}}})));
  });
}

console.log("wiring");
{
  const blk=cut("// ── \u{1F3AF} Match game","// WHICHONE_START");
  ok("no kid or family names in the changed code",!/lincoln|ellis|lucy|julian|caleb|kenzie|\bsara\b|dewalt/i.test(fn("_matchThenDefault")+fn("mastMatchThen")+fn("mastMatchSetThen")+fn("_matchBestKey")+cut('memory:[{key:"then"','{key:"saidpick"')));
  ok("no 🔀 anywhere",src.indexOf("\u{1F500}")<0);
  ok("every db write in the Match block is guarded by _dryRun except the best (mastMatchFinish, not in scope)",(blk.match(/if\(db\)/g)||[]).length===1&&/if\(db\) db\.ref\("mastery\/"\+kid\+"_settings\/match_best"\)/.test(blk));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
