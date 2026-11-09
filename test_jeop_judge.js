/*
 * ⚖️ How "I said it" is checked — ONE setting per kid (her decision 2026-11-08, from the games audit: "one setting per kid, not a pill
 * per game"), and Jeopardy money mode on top of it (her finding on the tablet that night: with money on, the board asks "What is it?",
 * the kid taps "I said it" — "everybody would win"). The kid's setting: Say it, then pick it (default Pre-K–2nd; 3 / 4 / 5 choices,
 * default 4, each with Say-it's 🔊 chip) / Type it (default 3rd up; the study session's typed match) / Mom judges (the answer behind
 * the Mom gate, ✓ / ✗). Stored at mastery/<kid>_settings/games/judge + judgeChoices; Mom sets it on the 🎮 Games settings row.
 * The shared helper gameJudgeAct(st, turn, {kid, deck, right, names, onRight, onWrong, …}) that the other say-it games will use.
 * Jeopardy: one response — right + the value, wrong − it and the right name lit + said; Daily Double and Final judged the same way.
 * Off mode: "I said it" exactly as on main.
 * Runs the REAL code (WHICHONE + GAMELOG + GAMEGRID + GAMERULES + JEOPARDY + JPMONEY + JPJUDGE + GAMEJUDGE + SAIDPICK's lures / TTS
 * check + the study session's typed match).
 *   run:  node test_jeop_judge.js
 *   the Off snapshot was taken from main 2026-11-08 (6605417):  JP_SNAP_SRC=<main's index.html> node test_jeop_judge.js --snap
 */
const fs=require("fs"), path=require("path"), vm=require("vm"), crypto=require("crypto");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const SNAP_ONLY=process.argv.indexOf("--snap")>=0;
const src=fs.readFileSync(process.env.JP_SNAP_SRC||path.join(__dirname,"index.html"),"utf8");
const cutIn=(s,a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return s.slice(i,j); };
function fnIn(S,name){ const i=S.indexOf("function "+name+"("); if(i<0) throw new Error("no function "+name); const j=S.indexOf("\nfunction ",i+10), k=S.indexOf("\n// ",i+10); return S.slice(i,Math.min(j<0?1e9:j,k<0?1e9:k)); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

const P=(n,emoji,tier)=>({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:tier||"weekly"});
const ANIMALS=[P("cat","🐱","graduated"),P("dog","🐶","monthly"),P("cow","🐮","bi_weekly"),P("pig","🐷","weekly"),P("fox","🦊","every_other_day"),P("owl","🦉","daily"),P("hen","🐔","daily"),P("ant","🐜","weekly")];
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const MATH=[M("7+8","15","monthly"),M("6+6","12","bi_weekly"),M("9+4","13","weekly"),M("5+5","10","every_other_day"),M("8+3","11","daily")];
const TINY=[P("bee","🐝"),P("yak","🐃"),P("elk","🦌")].map(x=>Object.assign({},x,{id:"t_"+x.prompt,subject:"Tiny"}));

function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[], nodes={};
  const S=o.src||src, opt=(a,b)=>S.indexOf(a)>=0?"\n"+cutIn(S,a,b):"";
  const extra=["_matchLures","_matchTtsOk","mstNormMath","mstTypeAnsOk"].filter(n=>S.indexOf("function "+n+"(")>=0).map(n=>fnIn(S,n)).join("\n");
  const CODE=cutIn(S,"// WHICHONE_START","// WHICHONE_END")+"\n"+cutIn(S,"// GAMELOG_START","// GAMELOG_END")+"\n"+cutIn(S,"// GAMEGRID_START","// GAMEGRID_END")+"\n"+cutIn(S,"// GAMERULES_START","// GAMERULES_END")+"\n"+cutIn(S,"// JEOPARDY_START","// JEOPARDY_END")+opt("// JPMONEY_START","// JPMONEY_END")+opt("// JPJUDGE_START","// JPJUDGE_END")+opt("// GAMEJUDGE_START","// GAMEJUDGE_END")+
    "\n"+(S.indexOf("const MST_TYPEANS_FRAC=")>=0?S.slice(S.indexOf("const MST_TYPEANS_FRAC="),S.indexOf("\n",S.indexOf("const MST_TYPEANS_FRAC="))):"")+"\n"+extra;
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    window:{speechSynthesis:o.noTts?null:{}},
    document:{getElementById:id=>nodes[id]||null,createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>!!o.mom,renderAll(){},cap:s=>s,
    pinOk:v=>v==="1234",dadPinOk:v=>v==="5678",ckGradeOf:k=>(o.grade===undefined?null:o.grade),
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mstTodayKey:()=>"20261108",mastView:"jeop",masteryKid:"k",GAMES_LIST:[],
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  ctx.Math=Object.create(Math); ctx.Math.random=seeded((o.seed||3)+100);   // _matchLures' shuffle, seeded
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jeopState',{get:()=>jeopState,set:v=>{jeopState=v;}}); Object.defineProperty(this,'jeopPickDecks',{get:()=>jeopPickDecks,set:v=>{jeopPickDecks=v;}}); Object.defineProperty(this,'_jpRandom',{get:()=>_jpRandom,set:v=>{_jpRandom=v;}}); this.GAME_RULES=GAME_RULES;",ctx);
  ctx._jpRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,nodes,flush};
}
const nameOf=(c,pid)=>c.masteryData.k.find(x=>x.id===pid).prompt;

// ── OFF = main byte for byte: a scripted say-it afternoon (every screen, write, word said, sound), hashed ──
function offSession(S){
  const log=[], snap=(w,tag)=>log.push(tag+"\n"+w.c.buildJeopHtml("#123456"));
  const w=world(ANIMALS.concat(MATH),{src:S,settings:{games:{judge:"mom",judgeChoices:5}}}), c=w.c;   // a judging setting stored: Off ignores it
  c.jeopPickDecks=["Animals","Math Facts"]; c.jeopStart(); snap(w,"board"); const st=c.jeopState; let g=0, step=0;
  while(st.phase!=="done"&&g++<80){
    if(st.phase==="play"&&!st.open&&!st.lock){ c.jeopPickCell(st.cells.findIndex(x=>!x.done)); snap(w,"open"); }
    if(st.open&&!st.lock){ const t=st.turns[st.open.t];
      if(t.act==="say") c.jeopSaid(); else if(t.act==="type"){ for(const ch of (step++%3===1?"99":c._whichBack(c.masteryData.k.find(x=>x.id===t.pid)))) c.jeopKey(ch); c.jeopCheck(); }
      snap(w,"ans"); }
    w.flush(); snap(w,"beat");
  }
  log.push("writes "+JSON.stringify(w.writes.map(x=>[x[0],x[1],x[0]==="push"?Object.assign({},x[2],{at:0,secs:0}):x[2]])));
  log.push("said "+JSON.stringify(w.said)); log.push("dings "+JSON.stringify(w.dings)); log.push("state "+JSON.stringify(Object.keys(st).sort()));
  log.push("turns "+JSON.stringify(st.turns));
  return crypto.createHash("sha256").update(log.join("\n──\n")).digest("hex");
}
if(SNAP_ONLY){ console.log(offSession(src)); process.exit(0); }
const OFF_MAIN="465ac1c93f822db2ba96cb5e823b152b98e1c3abe8b00bbd67c8931e569e89ab";   // offSession(main 6605417's index.html), 2026-11-08

// ── by text ──
const jm=src.indexOf("// JPMONEY_END"), a=src.indexOf("// JPJUDGE_START"), b=src.indexOf("// JPJUDGE_END"), ga=src.indexOf("// GAMEJUDGE_START"), gb=src.indexOf("// GAMEJUDGE_END"), gl=src.indexOf("// GAMELIKE_START");
ok("JPJUDGE straight after JPMONEY_END, GAMEJUDGE straight after JPJUDGE_END, then GAMELIKE_START; one of each",a>jm&&src.slice(jm,a).trim()==="// JPMONEY_END"&&b>a&&ga>b&&src.slice(b,ga).trim()==="// JPJUDGE_END"&&gb>ga&&gl>gb&&src.slice(gb,gl).trim()==="// GAMEJUDGE_END"&&src.indexOf("// JPJUDGE_START",a+1)<0&&src.indexOf("// GAMEJUDGE_START",ga+1)<0);
const jblk=src.slice(a,b), jcode=jblk.replace(/^\s*\/\/.*$/gm,""), gblk=src.slice(ga,gb), gcode=gblk.replace(/^\s*\/\/.*$/gm,""), JP=cutIn(src,"// JEOPARDY_START","// JEOPARDY_END"), RULES=cutIn(src,"const GAME_RULES={","\n};");
const JR=(RULES.match(/  jeop:[\s\S]*?\]\]\}\],/)||[""])[0];
const NAMES=/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|adrienne|dewalt|burris|howe/i;
ok("no kid's or family's name in either block or this test's cards",!NAMES.test(jblk)&&!NAMES.test(gblk)&&!NAMES.test(JSON.stringify(ANIMALS.concat(MATH,TINY))));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("no per-game pill: GAME_RULES.jeop is main's one 'mode' rule, nothing about judging",/^  jeop:\[\{key:"mode",label:"Play money\?",def:"off",opts:\[[^\n]*\n\s*\["off","Off",[^\n]*\n\s*\["money","Money",[^\n]*\]\]\}\],$/.test(JR)&&!/judge|choices/i.test(JR.replace(/\/\/.*$/gm,"")));
ok("GAMEJUDGE writes: ONE targeted set of mastery/<kid>_settings/games/<judge|judgeChoices>, guarded, Mom only; no update / remove / push",(gcode.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\("mastery\/"\+kid\+"_settings\/games\/"\+key\)\.set\(val\)/.test(gcode)&&/typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)/.test(gcode)&&/_gdCanEdit\(\)\) return false/.test(gcode)&&!/\.update\(|\.remove\(|\.push\(/.test(gcode));
ok("JPJUDGE writes nothing of its own (no db, no points / Stars)",!/db\.ref|\.set\(|\.update\(|\.push\(\{|bankDirect|starBank/.test(jcode));
ok("the JEOPARDY hooks: 4 lines, each guarded (typeof jpJudge… === \"function\") and marked ⚖️ JPJUDGE, none with a $ or 'bank'",(JP.match(/⚖️ JPJUDGE/g)||[]).length===4&&(JP.match(/typeof jpJudge\w+==="function"/g)||[]).length===4&&!/bank|\$/.test(JP.split("\n").filter(l=>/⚖️ JPJUDGE/.test(l)).join("\n").replace(/\$\{|\$\//g,"")));
ok("GAMEGRID: one guarded line puts the kid's judging row above the grid",(cutIn(src,"// GAMEGRID_START","// GAMEGRID_END").match(/⚖️ GAMEJUDGE/g)||[]).length===1&&/if\(typeof gameJudgeRowHtml==="function"\) h\+=gameJudgeRowHtml\(kid\);/.test(fnIn(src,"gameDecksHtml")));
ok("GAMELOG: one guarded line stamps judge (gameJudgeStamp) — st.judge is set only on a money board",/if\(st\.judge&&typeof gameJudgeStamp==="function"\) gameJudgeStamp\(e,st\.judge\);/.test(fnIn(src,"gameLogEntry"))&&/st\.money\|\|typeof gameJudgeMode/.test(src.slice(src.indexOf("function jpJudgeStart("),src.indexOf("function jpJudgeOpen("))));
ok("the helper reuses Say-it's pieces (_matchLures, _matchTtsOk, mastSpeak), the study session's mstTypeAnsOk, and momHere / pinOk / dadPinOk",/_matchLures\(/.test(gcode)&&/_matchTtsOk\(\)/.test(gcode)&&/mastSpeak\(c\.text\)/.test(gcode)&&/mstTypeAnsOk\(t\.gj\.typed,t\.gj\.right\)/.test(gcode)&&/momHere\(\)/.test(gcode)&&/pinOk\(v\)/.test(gcode)&&/dadPinOk\(v\)/.test(gcode));
ok("Jeopardy goes through the shared helper (gameJudgeAct / gameJudgeSaid / gameJudgeHtml) — no judging UI of its own",/gameJudgeAct\(st,t,\{kid:st\.kid,deck:deck,right:name,names:names/.test(jcode)&&/gameJudgeSaid\(\)/.test(jcode)&&/gameJudgeHtml\(t,color,lock\)/.test(jcode)&&!/<button|<input/.test(jcode));
ok("the helper's signature: gameJudgeAct(st,turn,opts) with kid, deck, right, names, onRight, onWrong",/function gameJudgeAct\(st,turn,opts\)/.test(gcode)&&/opts\.right/.test(gcode)&&/opts\.names/.test(gcode)&&/opts\.onRight\(turn\)/.test(gcode)&&/opts\.onWrong\(turn,gj\.given\)/.test(gcode)&&/opts\.kid/.test(gcode));

// ── the per-kid setting ──
const MON=(judge,ch)=>{ const s={gameRules:{jeop:{mode:"money"}}}; if(judge||ch){ s.games={}; if(judge) s.games.judge=judge; if(ch) s.games.judgeChoices=ch; } return {settings:s}; };
{ const c=g=>world([],{grade:g}).c;
  ok("nothing stored → by grade: unknown pick, Pre-K pick, K pick, 2nd pick, 3rd type, 7th type",c(undefined).gameJudgeMode("k")==="pick"&&c(-1).gameJudgeMode("k")==="pick"&&c(0).gameJudgeMode("k")==="pick"&&c(2).gameJudgeMode("k")==="pick"&&c(3).gameJudgeMode("k")==="type"&&c(7).gameJudgeMode("k")==="type");
  ok("choices: nothing stored → 4",c(undefined).gameJudgeChoices("k")===4);
  const s=k=>world([],{grade:5,settings:{games:k}}).c;
  ok("stored wins over the grade: mom / pick / type; choices 3 / 5 (a number or a string)",s({judge:"mom"}).gameJudgeMode("k")==="mom"&&s({judge:"pick"}).gameJudgeMode("k")==="pick"&&s({judgeChoices:3}).gameJudgeChoices("k")===3&&s({judgeChoices:"5"}).gameJudgeChoices("k")===5);
  ok("read defensively: a bad value, a non-object, missing settings → the defaults",s({judge:"nope",judgeChoices:9}).gameJudgeMode("k")==="type"&&s({judge:"nope",judgeChoices:9}).gameJudgeChoices("k")===4&&world([],{settings:{games:"x"}}).c.gameJudgeMode("k")==="pick"&&world([],{}).c.gameJudgeMode("other")==="pick");
  const m=world([],{mom:true}); m.c.gameJudgeSet("k","judge","mom"); m.c.gameJudgeSet("k","judgeChoices",5);
  ok("Mom sets it: ONE targeted set per tap at mastery/<kid>_settings/games/judge and …/judgeChoices",JSON.stringify(m.writes)==='[["set","mastery/k_settings/games/judge","mom"],["set","mastery/k_settings/games/judgeChoices",5]]'&&m.c.gameJudgeMode("k")==="mom"&&m.c.gameJudgeChoices("k")===5);
  ok("a value that isn't an option writes nothing",m.c.gameJudgeSet("k","judge","x")===false&&m.c.gameJudgeSet("k","judgeChoices",7)===false&&m.c.gameJudgeSet("k","other","pick")===false&&m.writes.length===2);
  const k=world([],{}); ok("a kid's device (no Mom): nothing changes, nothing written",k.c.gameJudgeSet("k","judge","pick")===false&&k.writes.length===0);
  const d=world([],{mom:true,dry:true}); d.c.gameJudgeSet("k","judge","type"); ok("?dryrun=1: set in memory, nothing written",d.writes.length===0&&d.c.gameJudgeMode("k")==="type");
  const g=world(ANIMALS,{mom:true}), h=g.c.gameDecksHtml("k");
  ok("Mom's Day ▸ … ▸ 🎮 Games: the row 'How is “I said it” checked for <kid>?' sits above the grid, Say it, then pick it ✓, Choices 4 ✓, 'Not set'",/How is “I said it” checked for k\?/.test(h)&&h.indexOf("gj-row")<h.indexOf("<table")&&/✓ Say it, then pick it/.test(h)&&/>Type it</.test(h)&&/>Mom judges</.test(h)&&/✓ 4</.test(h)&&/Not set/.test(h)&&/gameJudgeSet\('k','judge','mom'\)/.test(h));
  const gt=world(ANIMALS,{mom:true,settings:{games:{judge:"type"}}}).c.gameDecksHtml("k");
  ok("Type it chosen: no Choices pills, no 'Not set'",/✓ Type it/.test(gt)&&!/Choices/.test(gt)&&!/Not set/.test(gt));
  ok("a kid's device: the row shows, its pills disabled",/class="gj-pill[^"]*"[^>]*disabled/.test(world(ANIMALS,{}).c.gameDecksHtml("k")));
}

// ── the shared helper, on a made-up game (how gofish / four / ship / kaboom / sure will hook in) ──
{ const w=world([],{grade:1}), c=w.c, st={kid:"k"}, turn={}, got=[];
  const opts={kid:"k",deck:"Birds",right:"robin",names:["jay","wren","robin","Jay","crow","owl"],onRight:t=>got.push("right"),onWrong:(t,g)=>got.push("wrong:"+g),line:s=>got.push("line:"+s)};
  ok("gameJudgeAct → true; the kid's mode (pick by grade), 4 choices, the ask on the game's line",c.gameJudgeAct(st,turn,opts)===true&&turn.gj.mode==="pick"&&turn.gj.ch.length===4&&got[0]==="line:Say it out loud… then tap what you said.");
  ok("choices: the right one once, no text twice (robin / Jay dropped), only names handed in",turn.gj.ch.filter(x=>x.ok).length===1&&new Set(turn.gj.ch.map(x=>x.text.toLowerCase())).size===4&&turn.gj.ch.every(x=>["robin","jay","wren","crow","owl"].indexOf(x.text)>=0));
  ok("the round's JSON has no link back to the game (the context is in memory only)",JSON.stringify(turn).indexOf("_ctx")<0&&JSON.stringify(turn).indexOf("onRight")<0);
  c.gameJudgePick(0); ok("a choice can't be tapped before 'I said it'",got.length===1);
  c.gameJudgeSaid(); c.gameJudgePick(turn.gj.ch.findIndex(x=>x.ok));
  ok("I said it → 'Tap what you said.'; the right tap → onRight once; done",got.join("|")==="line:Say it out loud… then tap what you said.|line:Tap what you said.|right"&&turn.gj.done&&turn.gj.ok===true);
  c.gameJudgePick(0); ok("a settled turn ignores more taps",got.length===3);
  const t2={}, g2=[]; c.gameJudgeAct(st,t2,Object.assign({},opts,{mode:"type",onRight:()=>g2.push("R"),onWrong:(t,g)=>g2.push("W:"+g)}));
  c.gameJudgeTyped("Robin "); c.gameJudgeCheck(); ok("type: 'Robin ' → onRight",g2.join()==="R");
  const t3={}, g3=[]; c.gameJudgeAct(st,t3,Object.assign({},opts,{mode:"pick",names:[]})); ok("pick with no other name → false (keep the honor tap), nothing attached",!t3.gj);
  const t4={}, g4=[]; let alive=true; c.gameJudgeAct(st,t4,Object.assign({},opts,{mode:"mom",live:()=>alive,onRight:()=>g4.push("R"),onWrong:()=>g4.push("W")}));
  alive=false; c.gameJudgeMomShow(); ok("live() false (the game moved on) → taps do nothing",!t4.gj.momShow&&!t4.gj.momAsk);
  ok("gameJudgeAct refuses a turn with no right answer",c.gameJudgeAct(st,{},Object.assign({},opts,{right:""}))===false);
}

// ── Off: byte for byte ──
ok("Off = main: a scripted say-it board with a judging setting stored (every screen, write, word said, sound, the state and the turns) hashes to main's snapshot",offSession(src)===OFF_MAIN,offSession(src));

// helpers for money games
const val=(c,st)=>{ const o=st.open, cell=o&&o.ci!=null?st.cells[o.ci]:null; return cell?c.jpMoneyVal(st,cell.row):0; };
function openPlain(w){ const c=w.c, st=c.jeopState; const ci=st.cells.findIndex(x=>!x.done&&!x.dd); c.jeopPickCell(ci); return st.turns[st.open.t]; }

// ── Say it, then pick it ──
{ const w=world(ANIMALS,MON()), c=w.c; c.jeopStart(); const st=c.jeopState;
  ok("a money board reads the kid's setting once: pick (no grade), 4 choices",st.judge==="pick"&&st.nch===4);
  const t=openPlain(w), name=nameOf(c,t.pid); let h=c.buildJeopHtml("#000");
  ok("the card opens with 'Say it out loud… then tap what you said.' and 🗣 I said it — no choices yet (recall first)",t.judge==="pick"&&t.gj.step==="say"&&st.msg==="Say it out loud… then tap what you said."&&/I said it/.test(h)&&!/said-ch/.test(h)&&w.said.slice(-1)[0]==="What is it?");
  ok("4 choices: the right name once + 3 others from the same deck, no text twice",t.gj.ch.length===4&&t.gj.ch.filter(x=>x.ok).length===1&&t.gj.ch.find(x=>x.ok).text===name&&new Set(t.gj.ch.map(x=>x.text.toLowerCase())).size===4&&t.gj.ch.every(x=>ANIMALS.some(p=>p.prompt===x.text)));
  c.jeopSaid(); h=c.buildJeopHtml("#000");
  ok("🗣 I said it (the board's own button) → the choices, 'Tap what you said.', each with a 🔊 chip; nothing scored yet",t.gj.step==="pick"&&!t.done&&st.msg==="Tap what you said."&&(h.match(/class="said-ch"/g)||[]).length===4&&(h.match(/class="said-hear"/g)||[]).length===4&&st.bank===0);
  const n0=w.said.length; c.gameJudgeHear(1,{stopPropagation(){}});
  ok("🔊 says that choice only — never picks",w.said.length===n0+1&&w.said[n0]===t.gj.ch[1].text&&!t.done);
  const v=val(c,st); c.gameJudgePick(t.gj.ch.findIndex(x=>x.ok));
  ok("right → + the square's value, 'That's it! +$N', the name said, the ding",t.done&&t.first&&st.bank===v&&st.msg==="That’s it! +"+c.jpMoneyFmt(v)&&w.said.slice(-1)[0]===name+". That’s it!"&&w.dings.slice(-1)[0]==="ding");
  w.flush();
  const t2=openPlain(w), n2=nameOf(c,t2.pid), v2=val(c,st), before=st.bank; c.jeopSaid(); c.gameJudgePick(t2.gj.ch.findIndex(x=>!x.ok)); h=c.buildJeopHtml("#000");
  ok("wrong → − the value at once (one response), the bonk, 'It's <name>.' said, the right one lit green ✓ and the tapped one red",t2.done&&!t2.first&&t2.fail&&st.bank===before-v2&&w.dings.slice(-1)[0]==="bonk"&&w.said.slice(-1)[0]==="It’s "+n2+"."&&st.msg==="It’s "+n2+". "+c.jpMoneyFmt(-v2)&&/#16a34a[^>]*>[^<]*<span[^>]*>✓ /.test(h)&&/#dc2626/.test(h));
  c.gameJudgePick(t2.gj.ch.findIndex(x=>x.ok)); ok("…a second tap does nothing",st.bank===before-v2);
  ok("the miss holds a longer beat (the first timer is stale)",w.timers.length===2);
  w.flush(); ok("then the board",!st.open&&st.msg==="Pick a square!");
}
{ // choice count + small decks
  const counts=[3,4,5].map(n=>{ const w=world(ANIMALS,MON("pick",n)); w.c.jeopStart(); return openPlain(w).gj.ch.length; });
  ok("the kid's choices 3 / 4 / 5 → 3 / 4 / 5 choices",counts.join()==="3,4,5",counts);
  const w=world(TINY,MON("pick",5)); w.c.jeopStart(); const t=openPlain(w);
  ok("a 3-card deck with 5 asked: 3 choices (all it has), the right one among them",t.gj.ch.length===3&&t.gj.ch.filter(x=>x.ok).length===1);
  let distinct=true, okOnce=true;
  for(let seed=1;seed<=30;seed++){ const x=world(ANIMALS.concat(MATH),Object.assign({seed:seed},MON("pick",5))); x.c.jeopStart(); const st=x.c.jeopState;
    st.cells.filter(cl=>cl.act==="say"&&!cl.dd).forEach(cl=>{ x.c.jeopPickCell(st.cells.indexOf(cl)); const tt=st.turns[st.open.t], ch=tt.gj.ch; if(new Set(ch.map(y=>y.text.toLowerCase())).size!==ch.length) distinct=false; if(ch.filter(y=>y.ok).length!==1||!ch.every(y=>ANIMALS.some(p=>p.prompt===y.text))) okOnce=false; st.open=null; }); }
  ok("30 boards: never one text twice; the right name exactly once; only names from the same deck (no math answers)",distinct&&okOnce);
  const q=world(ANIMALS,Object.assign({noTts:true},MON())); q.c.jeopStart(); openPlain(q); q.c.jeopSaid();
  ok("TTS dead on this device: the choices are plain (no 🔊 chips)",/class="said-ch"/.test(q.c.buildJeopHtml("#000"))&&!/said-hear/.test(q.c.buildJeopHtml("#000")));
  const m=world(MATH,MON()); m.c.jeopStart(); const tm=openPlain(m);
  ok("a number-back square is untouched by judging (its number pad, as before)",tm.act==="type"&&!tm.judge&&!tm.gj&&/jp-key/.test(m.c.buildJeopHtml("#000")));
  const g3=world(ANIMALS,Object.assign({grade:4},MON())); g3.c.jeopStart();
  ok("nothing stored + a 4th grader → the board types",g3.c.jeopState.judge==="type");
}

// ── Type it ──
{ const w=world(ANIMALS,MON("type")), c=w.c; c.jeopStart(); const st=c.jeopState;
  const t=openPlain(w), name=nameOf(c,t.pid); let h=c.buildJeopHtml("#000");
  ok("Type it: a text box + Check, 'Type what it is, then Check.', no 'I said it', no choices",t.judge==="type"&&/id="gj-type-in"/.test(h)&&/>Check</.test(h)&&!/I said it|said-ch/.test(h)&&st.msg==="Type what it is, then Check.");
  c.jeopSaid(); ok("the honor tap does nothing on a typed card",!t.done);
  c.gameJudgeCheck(); ok("Check with nothing typed does nothing",!t.done);
  w.nodes["gj-type-in"]={value:"  "+name.toUpperCase()+" "}; const v=val(c,st); c.gameJudgeCheck();
  ok("typed with capitals and spaces → right, + the value (the study session's match)",t.done&&t.first&&st.bank===v);
  w.flush(); delete w.nodes["gj-type-in"];
  const t2=openPlain(w), n2=nameOf(c,t2.pid), v2=val(c,st), b2=st.bank; c.gameJudgeTyped("zebra"); c.gameJudgeCheck(); h=c.buildJeopHtml("#000");
  ok("typed wrong → − the value, 'It's <name>.' said, the screen shows what was typed and the right name",t2.done&&!t2.first&&st.bank===b2-v2&&w.said.slice(-1)[0]==="It’s "+n2+"."&&/You typed “zebra”/.test(h)&&h.indexOf(n2)>=0);
  const T=c.mstTypeAnsOk;
  ok("the match: accepts case / spaces / number forms; rejects a different word, a misspelling, a blank",T("Cat","cat")&&T(" cat ","cat")&&T("ice  cream","Ice Cream")&&T("4.0","4")&&T("1,000","1000")&&!T("cats","cat")&&!T("dgo","dog")&&!T("","dog")&&!T("cow","owl"));
}

// ── Mom judges ──
{ const w=world(ANIMALS,MON("mom")), c=w.c; c.jeopStart(); const st=c.jeopState;
  const t=openPlain(w), name=nameOf(c,t.pid); let h=c.buildJeopHtml("#000");
  ok("Mom judges: 'Say it out loud to Mom.' and '🔒 Show Mom the answer' — the answer is NOT on the screen",t.judge==="mom"&&st.msg==="Say it out loud to Mom."&&/Show Mom the answer/.test(h)&&!/I said it/.test(h)&&h.indexOf(">"+name+"<")<0);
  c.jeopSaid(); c.gameJudgeMom(true); ok("no honor tap, and ✓ does nothing before the gate",!t.done&&st.bank===0);
  c.gameJudgeMomShow(); h=c.buildJeopHtml("#000");
  ok("no Mom here → the code box (Mom or Dad), still no answer",t.gj.momAsk&&!t.gj.momShow&&/id="gj-mom-pin"/.test(h)&&h.indexOf(">"+name+"<")<0);
  c.gameJudgeCode("0000"); c.gameJudgeMom(true); ok("a wrong code opens nothing",!t.gj.momShow&&!t.done&&!st.gjMomOk);
  c.gameJudgeCode("1234"); h=c.buildJeopHtml("#000");
  ok("Mom's code → the answer for Mom with ✓ / ✗ (good for this game only — Mom mode never turned on)",t.gj.momShow&&st.gjMomOk&&h.indexOf(">"+name+"<")>=0&&/gameJudgeMom\(true\)/.test(h)&&/gameJudgeMom\(false\)/.test(h));
  const v=val(c,st); c.gameJudgeMom(true);
  ok("✓ → + the value",t.done&&t.first&&st.bank===v);
  w.flush();
  const t2=openPlain(w), v2=val(c,st), n2=nameOf(c,t2.pid); c.gameJudgeMomShow();
  ok("the next square: the gate stays open for this game (no code again)",t2.gj.momShow&&!t2.gj.momAsk);
  c.gameJudgeMom(false);
  ok("✗ → − the value, the right name said",t2.done&&!t2.first&&st.bank===v-v2&&w.said.slice(-1)[0]==="It’s "+n2+".");
  c.jeopStart(); const t3=openPlain(w); c.gameJudgeMomShow();
  ok("a new board asks for the code again",t3.gj.momAsk&&!t3.gj.momShow);
  const d=world(ANIMALS,MON("mom")); d.c.jeopStart(); const td=openPlain(d); d.c.gameJudgeMomShow(); d.c.gameJudgeCode("5678");
  ok("Dad's code opens it too",td.gj.momShow);
  const m=world(ANIMALS,Object.assign({mom:true},MON("mom"))); m.c.jeopStart(); const tm=openPlain(m); m.c.gameJudgeMomShow();
  ok("the Mom switch on: the answer opens with no code",tm.gj.momShow&&!tm.gj.momAsk);
  const n=world(ANIMALS,MON("mom")); n.c.jeopStart(); const tn=openPlain(n); n.c.gameJudgeMomShow(); n.c.gameJudgeMomCancel();
  ok("Cancel closes the code box",!tn.gj.momAsk&&!tn.gj.momShow&&/Show Mom the answer/.test(n.c.buildJeopHtml("#000")));
}

// ── a whole game: Daily Doubles, Final Jeopardy and the come-backs go through judging; the log carries judge ──
function play(judge,rightFn,seed){
  const w=world(ANIMALS,Object.assign({seed:seed||5,mom:true},MON(judge))), c=w.c; c.jeopStart(); const st=c.jeopState; let g=0; const seenJ=[];
  while(st.phase!=="done"&&g++<400){
    if(st.bet){ c.jeopBetSlide(st.bet.kind==="final"?st.bank:100); c.jeopBetGo(); continue; }
    if(st.open&&!st.lock){ const t=st.turns[st.open.t], name=nameOf(c,t.pid), r=rightFn(st,t); seenJ.push({j:t.judge,dd:!!t.dd,fin:!!t.fin,back:!!t.back});
      if(t.judge==="pick"){ c.jeopSaid(); c.gameJudgePick(t.gj.ch.findIndex(x=>!!x.ok===r)); }
      else if(t.judge==="type"){ c.gameJudgeTyped(r?name:"nope"); c.gameJudgeCheck(); }
      else if(t.judge==="mom"){ c.gameJudgeMomShow(); c.gameJudgeMom(r); }
      else c.jeopSaid();
      continue; }
    if(st.phase==="play"&&!st.open&&!st.lock){ const ci=st.cells.findIndex(x=>!x.done); if(ci>=0){ c.jeopPickCell(ci); continue; } }
    w.flush();
  }
  return {w,c,st,seenJ};
}
["pick","type","mom"].forEach(j=>{
  const {w,st,seenJ}=play(j,(s,t)=>!(s.round===1&&t===s.turns[1]));
  const e=(w.writes.find(x=>x[0]==="push")||[])[2]||{};
  ok(j+": every square judged — round 1's Daily Double, both of Double Jeopardy's, Final and the come-back",st.phase==="done"&&seenJ.every(x=>x.j===j)&&seenJ.filter(x=>x.dd).length===3&&seenJ.filter(x=>x.fin).length===1&&seenJ.filter(x=>x.back).length===1,seenJ.filter(x=>x.j!==j));
  ok(j+": the bets ride on the judged answer (right adds the bet)",st.bets.length===4&&st.bets.every(x=>x.ok));
  ok(j+": ONE gameLog push, game jeop, mode money, judge '"+j+"', the miss and its come-back per card as before",e.game==="jeop"&&e.mode==="money"&&e.judge===j&&e.items.filter(i=>!i.ok&&!i.back&&i.fail).length===1&&e.items.filter(i=>i.back).length===1&&e.items.every(i=>Object.keys(i).every(k=>/^(id|ok|n|back|fail)$/.test(k))));
});
{ // Daily Double + Final wrong: − the bet
  const {st}=play("pick",(s,t)=>!t.dd&&!t.fin,9);
  ok("pick: a wrong Daily Double takes the bet away",st.bets.length>=3&&st.bets.filter(x=>x.kind==="dd").every(x=>!x.ok));
  const w=world(ANIMALS,Object.assign({seed:11},MON("pick"))), c=w.c; c.jeopStart(); const st2=c.jeopState;
  c.jeopPickCell(st2.cells.findIndex(x=>x.dd)); c.jeopBetSlide(300); c.jeopBetGo(); const t=st2.turns[st2.open.t];
  ok("a Daily Double card opens judged, its bet on the line",t.dd&&t.bet===300&&t.judge==="pick"&&/You bet \$300\. Say it out loud… then tap what you said\./.test(st2.msg));
  c.jeopSaid(); c.gameJudgePick(t.gj.ch.findIndex(x=>!x.ok));
  ok("…wrong: − $300, 'That was your Daily Double! It's <name>.'",st2.bank===-300&&st2.msg==="That was your Daily Double! It’s "+nameOf(c,t.pid)+". −$300");
}
{ // dry run
  const d=world(ANIMALS,Object.assign({dry:true,mom:true},MON("mom"))); d.c.jeopStart(); const st=d.c.jeopState; let g=0;
  while(st.phase!=="done"&&g++<400){ if(st.bet){ d.c.jeopBetGo(); continue; } if(st.open&&!st.lock){ d.c.gameJudgeMomShow(); d.c.gameJudgeMom(true); continue; } if(st.phase==="play"&&!st.open&&!st.lock){ d.c.jeopPickCell(st.cells.findIndex(x=>!x.done)); continue; } d.flush(); }
  ok("?dryrun=1: a judged game plays to the end, nothing written",st.phase==="done"&&d.writes.length===0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
