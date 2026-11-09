/*
 * 🗣 SAIDPICK — Memory flip "Say it first": after "I said it", pick what you said (Sara list 2026-11-02, her yes 2026-11-08).
 * Three choices (the right answer + two lures from the same deck, never one twice), each with a 🔊 chip that says it;
 * right → ✓, wrong → the right one is spoken and lit; the finished board logs through gameLogRound like a Which one? pick.
 * Switch: GAME_RULES.memory "saidpick" (rules pop-up), default on for Pre-K to 2nd grade. The app never picks for the kid.
 *   run:  node test_sayit_choices.js
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
  "_matchGateClose","_matchBoardDone","_matchClearNext","_matchTone","matchDing","matchBonk","mastMatchThen","mastMatchSetThen",
  "mastMatchTap","mastMatchFinish","_matchElapsed","mastMatchPause","_matchEligible","mastMatchStart","_matchSpeakTile","_matchGateHtml","_matchPairHtml",
  "_matchSayAge","matchSaidPickOn","_matchTtsOk","_matchSaidChoices","_matchSaidOpen","mastMatchSaidHear","mastMatchSaidPick","_matchSaidHtml",
  "_grE","_grJ","gameRuleDefs","gameRule","gameRuleSet","gameRulesHtml","gameRulesRender","gameLogDay","gameLogEntry","gameLogRound",
  "_matchThenDefault","_matchBestKey","gameLogMatchEntry"];   // MEMLOGFIX: the REAL finish log is loaded — it used to be left out, which hid the double log
const RULES=cut("const GAME_RULES={","\n};")+"\nlet gameRulesUI=null;";

const SUMS=[
  {id:"s1",subject:"Adding",prompt:"1 + 1",answer:"2",status:"active"},
  {id:"s2",subject:"Adding",prompt:"2 + 1",answer:"3",status:"active"},
  {id:"s3",subject:"Adding",prompt:"2 + 2",answer:"4",status:"active"},
  {id:"s4",subject:"Adding",prompt:"3 + 2",answer:"5",status:"active"},
  {id:"s5",subject:"Adding",prompt:"3 + 3",answer:"6",status:"active"},
  {id:"x1",subject:"Colors",prompt:"red",answer:"like a fire truck",status:"active"},   // another deck — never a lure
];
function sandbox(o){
  o=o||{};
  const L={now:1000,timers:[],spoken:[],dbWrites:[],re:0};
  const ctx={
    console, Math, Object, Array, String, parseFloat, isNaN, JSON, Promise,
    Date:{now:()=>L.now},
    setTimeout:(f,ms)=>{ L.timers.push({f,ms}); return L.timers.length; },
    setInterval:()=>1, clearInterval:()=>{}, mastView:"match",
    masteryKid:"kidA",
    masteryData:{kidA:o.items||SUMS, kidA_settings:o.settings||{}},
    matchStyle:"memory", matchPairMode:o.pair||"two", matchState:null,
    mastDrillSettings:()=>({match_speak:false}),
    _smTileVis:()=>null, mastGetDef:()=>null,
    mastSpeak:t=>L.spoken.push(t),
    _mastRe:()=>{ L.re++; },
    db:{ref:p=>({set:v=>L.dbWrites.push([p,"set",v]),update:v=>L.dbWrites.push([p,"update",v]),push:v=>L.dbWrites.push([p,"push",v])})},
    HA_LS:{setItem(){}},
    bbAlarmCtx:null,
    window:o.window||{speechSynthesis:{}},
    _ttsVoicesLoaded:()=>!!o.voices,
    bbAudioUnlock:()=>{},
    ckGradeOf:()=>(o.grade===undefined?null:o.grade), kcLittle:()=>!!o.little,
    esc:s=>String(s==null?"":s).replace(/</g,"&lt;"), document:{getElementById:id=>id==="grules-panel"?null:{}},
    _showCelebration:()=>{}, alert:m=>{ L.alert=m; },
    _gdCanEdit:()=>o.mom!==false, mstTodayKey:()=>"20261108", renderAll:()=>{},
  };
  vm.createContext(ctx);
  vm.runInContext(RULES+"\n"+NAMES.map(fn).join("\n")+"\nthis.GAME_RULES=GAME_RULES;",ctx);
  ctx.L=L;
  const flush=()=>{ const t=L.timers.splice(0); t.forEach(x=>x.f()); };
  const run=c=>vm.runInContext(c,ctx);
  // flip the first face-down tile of some card not yet asked → the gate
  const flipNew=()=>run('(function(){ const st=matchState; const ix=st.tiles.findIndex(t=>!t.up&&!t.matched&&!st.asked[t.pid]); mastMatchTap(ix); return ix; })()');
  return {ctx,L,flush,run,flipNew};
}

console.log("👶 the switch: on for Pre-K to 2nd grade, off for 3rd up, Mom can flip it");
{
  const age=o=>sandbox(o).run('gameRule("kidA","memory","saidpick")');
  ok("grade 1 → on",age({grade:1})==="on");
  ok("grade 2 → on",age({grade:2})==="on");
  ok("grade 3 → off",age({grade:3})==="off");
  ok("no grade, Pre-K → on",age({little:true})==="on");
  ok("no grade, school-age → off",age({})==="off");
  ok("stored off beats the age default",age({grade:1,settings:{gameRules:{memory:{saidpick:"off"}}}})==="off");
  ok("stored on beats the age default",age({grade:5,settings:{gameRules:{memory:{saidpick:"on"}}}})==="on");
  ok("a junk stored value falls back to the age default",age({grade:1,settings:{gameRules:{memory:{saidpick:"maybe"}}}})==="on");
  const S=sandbox({grade:1});
  const pop=S.run('gameRulesHtml("kidA","memory")');
  ok("the rules pop-up lists the rule with On / Off pills",/pick what you said/.test(pop)&&/gameRuleSet\('kidA','memory','saidpick','on'\)/.test(pop)&&/gameRuleSet\('kidA','memory','saidpick','off'\)/.test(pop));
  ok("…the kid's current value is the lit pill",/aria-pressed="true"[^>]*>✓ On</.test(pop));
  ok("Mom's tap writes this rule only",S.run('gameRuleSet("kidA","memory","saidpick","off")')===true&&JSON.stringify(S.L.dbWrites)==='[["mastery/kidA_settings/gameRules/memory/saidpick","set","off"]]',S.L.dbWrites);
  ok("…and the game reads it at once",S.run('matchSaidPickOn("kidA")')===false);
  const K=sandbox({grade:1,mom:false});
  ok("a kid can look but not flip it",K.run('gameRuleSet("kidA","memory","saidpick","off")')===false&&K.L.dbWrites.length===0);
  ok("the other games' rules are untouched (+ 🧩 JIGSAW's pieces rule — test_game_jigsaw.js)",JSON.stringify(Object.keys(S.ctx.GAME_RULES))==='["spell","jeop","jumble","jigsaw","memory","train"]');
  ok("Memory flip's rules: Then, then Say it first (MEMLOGFIX)",JSON.stringify(S.ctx.GAME_RULES.memory.map(r=>r.key))==='["then","saidpick"]');
}

console.log("🗣 I said it → three choices, nothing spoken, nothing picked");
{
  const S=sandbox({little:true});
  S.run('mastMatchStart("Adding")');
  ok("a Pre-K round is Say it first",S.run('matchState.then')==="say");
  S.flipNew();
  ok("the first flip opens the say gate",S.run('matchState.gate&&matchState.gate.kind')==="say");
  ok("before I said it: the I said it button, no choices",/mastMatchSaid\(\)/.test(S.run('_matchGateHtml(matchState,"#c2410c")'))&&!S.run('matchState.gate.choices'));
  S.run('mastMatchSaid()');
  const g=S.run('matchState.gate');
  ok("I said it → the choose step",g&&g.step==="choose"&&g.ask==="Which one did you say?");
  ok("exactly three choices",g.choices.length===3,g.choices);
  ok("one right answer, and it is this card's",g.choices.filter(c=>c.ok).length===1&&g.choices.find(c=>c.ok).pid===g.pid);
  const texts=g.choices.map(c=>c.text);
  ok("never the same answer twice",new Set(texts).size===3,texts);
  ok("lures come from the same deck",g.choices.every(c=>/^s\d$/.test(c.pid)),g.choices);
  const flippedPrompt=S.run('matchState.tiles[matchState.sel].isPrompt');
  ok("the choices are what the kid says for the flipped side (a sum → its answer; an answer → its sum)",texts.every(t=>flippedPrompt?/^\d+$/.test(t):/\+/.test(t)),texts);
  // an answer side: the lures are the nearest numbers (Pick it's own rule)
  const N=sandbox({little:true}); N.run('mastMatchStart("Adding")');
  N.run('(function(){ const st=matchState, ix=st.tiles.findIndex(t=>t.isPrompt&&t.pid==="s3"); mastMatchTap(ix); mastMatchSaid(); })()');
  const nt=N.run('matchState.gate.choices.map(c=>c.text).sort()');
  ok("number lures are the nearest values (2 + 2 → 3 · 4 · 5)",JSON.stringify(nt)==='["3","4","5"]',nt);
  ok("nothing is spoken yet — the kid answers first",S.L.spoken.length===0,S.L.spoken);
  S.flush();
  ok("no timer picks for the kid",S.run('matchState.gate&&matchState.gate.picked')===null);
  ok("a second I said it tap does nothing",(S.run('mastMatchSaid()'),S.run('matchState.gate.step'))==="choose"&&S.L.spoken.length===0);
  const html=S.run('_matchGateHtml(matchState,"#c2410c")');
  ok("each choice has a 🔊 chip",(html.match(/mastMatchSaidHear\(\d,event\)/g)||[]).length===3);
  ok("…and shows its text",texts.every(t=>html.indexOf(t)>=0));
  ok("the board taps stay locked while choosing",(S.run('mastMatchTap(0)'),S.run('matchState.gate.step'))==="choose");
  let stopped=0;
  S.ctx.EV={stopPropagation:()=>{stopped++;}};
  S.run('mastMatchSaidHear(1,EV)');
  ok("🔊 says that choice",S.L.spoken.length===1&&S.L.spoken[0]===texts[1],S.L.spoken);
  ok("…without picking it",S.run('matchState.gate.picked')===null&&stopped===1);
  const ri=g.choices.findIndex(c=>c.ok);
  S.run('mastMatchSaidPick('+ri+')');
  ok("a right pick is marked right",S.run('matchState.res[matchState.gate.pid]')==="c"&&S.run('matchState.gate.picked')===ri);
  ok("…shows a ✓",/✓/.test(S.run('_matchGateHtml(matchState,"#c2410c")')));
  ok("…and logs one first-try turn",JSON.stringify(S.run('matchState.sayTurns'))===JSON.stringify([{pid:g.pid,done:true,first:true,wrong:{}}]));
  ok("a second pick does nothing",(S.run('mastMatchSaidPick('+((ri+1)%3)+')'),S.run('matchState.sayTurns.length'))===1);
  S.flush();
  ok("then the gate closes and the hunt goes on",S.run('matchState.gate')===null);
}

console.log("❌ a wrong pick: the right one is spoken and lit");
{
  const S=sandbox({grade:2});
  S.run('mastMatchStart("Adding")'); S.flipNew(); S.run('mastMatchSaid()');
  const g=S.run('matchState.gate'), wi=g.choices.findIndex(c=>!c.ok), r=g.choices.find(c=>c.ok);
  S.run('mastMatchSaidPick('+wi+')');
  ok("marked missed",S.run('matchState.res[matchState.gate.pid]')==="m");
  ok("the right answer is spoken",S.L.spoken.length===1&&S.L.spoken[0]===r.text,S.L.spoken);
  const html=S.run('_matchGateHtml(matchState,"#c2410c")');
  ok("the right one is lit green with a ✓, the wrong one red",html.indexOf("border:2.5px solid #16a34a")>=0&&html.indexOf("border:2.5px solid #dc2626")>=0&&html.indexOf("✓ "+r.text)>=0);
  ok("logged as a miss (first false, the wrong pick named)",JSON.stringify(S.run('matchState.sayTurns[0]'))===JSON.stringify({pid:g.pid,done:true,first:false,wrong:{[g.choices[wi].pid]:1}}));
  S.flush();
  ok("the gate closes after the look",S.run('matchState.gate')===null);
}

console.log("📝 the finished board logs through gameLogRound like a Which one? pick");
{
  const S=sandbox({little:true});
  S.run('mastMatchStart("Adding")');
  const n=S.run('matchState.tiles.length/2');
  let picks=0;
  for(let k=0;k<n;k++){
    const ix=S.flipNew();
    S.run('mastMatchSaid()');
    const g=S.run('matchState.gate');
    const pickI=k===0?g.choices.findIndex(c=>!c.ok):g.choices.findIndex(c=>c.ok);   // the first card missed, the rest right
    S.run('mastMatchSaidPick('+pickI+')'); picks++;
    S.flush();
    S.run('(function(){ const st=matchState, a=st.tiles['+ix+']; const j=st.tiles.findIndex((t,i)=>i!=='+ix+'&&t.pid===a.pid); mastMatchTap(j); })()');
    S.flush();
  }
  ok("the board finished",S.run('!!matchState.endTs')&&S.run('matchState.phase')==="done");
  const push=S.L.dbWrites.filter(w=>w[1]==="push");
  ok("one gameLog push, at GAMELOG's path (MEMLOGFIX: MATCHLOG's record, the only one)",push.length===1&&push[0][0]==="mastery/gameLog/kidA/20261108",S.L.dbWrites);
  const e=push[0]&&push[0][2];
  ok("game:\"memory\", the deck, one item per card",e&&e.game==="memory"&&e.deck==="Adding"&&e.items.length===picks);
  ok("items read like Which one?: {id, ok, n}",e&&e.items[0].ok===false&&e.items[0].n===2&&e.items.slice(1).every(i=>i.ok===true&&i.n===1),e&&e.items);
  ok("the device's own copy is kept until the listener brings it",Object.keys(S.run('masteryData.gameLog.kidA["20261108"]')).length===1);
  ok("never touches the ladder: no other writes but the log",S.L.dbWrites.every(w=>w[1]==="push"||/_settings\/match_best$/.test(w[0])),S.L.dbWrites);
  S.run('mastMatchFinish()');
  ok("logged once (a second finish finds st.gameLogged)",S.L.dbWrites.filter(w=>w[1]==="push").length===1);
}

console.log("⏭ the switch off, or a deck too thin: I said it as before");
{
  const S=sandbox({grade:4,settings:{match_then:"say"}});
  S.run('mastMatchStart("Adding")'); S.flipNew(); S.run('mastMatchSaid()');
  ok("3rd grade up (default off): the app says the answer and the gate closes",S.run('matchState.gate')===null&&S.L.spoken.length===1);
  const T=sandbox({little:true,settings:{gameRules:{memory:{saidpick:"off"}}}});
  T.run('mastMatchStart("Adding")'); T.flipNew(); T.run('mastMatchSaid()');
  ok("Mom's Off: the same",T.run('matchState.gate')===null&&T.L.spoken.length===1);
  const U=sandbox({grade:5,settings:{match_then:"say",gameRules:{memory:{saidpick:"on"}}}});
  U.run('mastMatchStart("Adding")'); U.flipNew(); U.run('mastMatchSaid()');
  ok("Mom's On for an older kid: choices",U.run('matchState.gate.step')==="choose");
  const thin=sandbox({little:true,items:[
    {id:"r1",subject:"Rules",prompt:"one",answer:"Capital letter",status:"active"},
    {id:"r2",subject:"Rules",prompt:"two",answer:"Capital letter",status:"active"},
    {id:"r3",subject:"Rules",prompt:"three",answer:"End mark",status:"active"},
    {id:"r4",subject:"Rules",prompt:"four",answer:"Capital letter",status:"active"},
  ]});
  // only two distinct meanings → at most one lure → no fair three; the old way
  const g=thin.run('(function(){ matchState={kid:"kidA",deck:"Rules",pairMode:"two",then:"say",tiles:[{pid:"r1",isPrompt:false,up:true}],sel:0,asked:{},res:{},missed:[],gate:{pid:"r1",kind:"say",speak:"one",picked:null}}; return _matchSaidChoices(matchState,matchState.gate); })()');
  ok("a word side with a full deck still offers three",Array.isArray(g)&&g.length===3);
  const g2=thin.run('(function(){ matchState.tiles=[{pid:"r1",isPrompt:true,up:true}]; matchState.gate={pid:"r1",kind:"say",speak:"Capital letter",picked:null}; return _matchSaidChoices(matchState,matchState.gate); })()');
  ok("a meaning side with one lure → null (old way)",g2===null);
  thin.run('mastMatchSaid()');
  ok("…I said it speaks and closes",thin.run('matchState.gate')===null&&thin.L.spoken[0]==="Capital letter");
  const P=sandbox({grade:4});
  P.run('mastMatchStart("Adding")'); P.flipNew(); P.run('mastMatchSaid(); mastMatchSaidPick(0)');
  ok("Pick it first is untouched (no say choices on a pick gate)",P.run('matchState.gate.kind')==="pick"&&!P.run('matchState.gate.step')&&P.run('matchState.gate.picked')===null&&!P.run('matchState.sayTurns'));
}

console.log("🔇 TTS dead: plain text, no chips");
{
  const dead=[{window:{}},{window:{speechSynthesis:{},_ttsDead:true},voices:false}];
  dead.forEach((o,i)=>{
    const S=sandbox(Object.assign({little:true},o));
    S.run('mastMatchStart("Adding")'); S.flipNew(); S.run('mastMatchSaid()');
    const html=S.run('_matchGateHtml(matchState,"#c2410c")'), texts=S.run('matchState.gate.choices.map(c=>c.text)');
    ok("dead case "+(i+1)+": no 🔊 chip",html.indexOf("mastMatchSaidHear")<0);
    ok("dead case "+(i+1)+": the three choices still show as text",texts.length===3&&texts.every(t=>html.indexOf(t)>=0));
  });
  const R=sandbox({little:true,window:{speechSynthesis:{},_ttsDead:true},voices:true});
  ok("a device that found its voices again gets the chips back",R.run('_matchTtsOk()')===true);
}

console.log("wiring");
{
  const blk=cut("// SAIDPICK_START","// SAIDPICK_END");
  ok("no kid or family names in the new code",!/lincoln|ellis|lucy|julian|caleb|kenzie|sara\b|dewalt|howe/i.test(blk.replace(/Sara list/g,"")));
  ok("no 🔀 anywhere",src.indexOf("\u{1F500}")<0);
  ok("the only write is gameLogRound's (no db.ref in the block)",!/db\.ref/.test(blk));
  ok("I said it reaches the choices through a guarded call",/typeof _matchSaidOpen==="function"&&_matchSaidOpen\(st,g\)/.test(fn("mastMatchSaid")));
  ok("the gate renders the choose step",/g\.step==="choose"\)\{\s*h\+=_matchSaidHtml/.test(fn("_matchGateHtml")));
  ok("the board's end pushes no log of its own — the picks ride in st.res to MATCHLOG's one entry (MEMLOGFIX)",!/_matchSaidLog|gameLogRound/.test(fn("_matchBoardDone"))&&src.indexOf("function _matchSaidLog(")<0&&/st\.res\[g\.pid\]=c\.ok\?"c":"m";/.test(fn("mastMatchSaidPick")));
  ok("gameRule honours a rule's defFor (kid-aware default)",/d\.defFor/.test(fn("gameRule")));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
